# Python Learning Platform — execution harness.
#
# Loaded once into Pyodide (the browser worker and the Node content validator
# use the same file) and called for every Run, Run tests and Visualize. Nothing
# here is simulated: every printed line, variable, test verdict and trace step
# comes from actually executing the learner's code with CPython (compiled to
# WebAssembly by Pyodide).
#
# Entry point: `await run(request_json) -> result_json`, request modes:
#   app     run the project, streaming stdout/stderr to the page
#   test    run the project fresh before each test, then run the test code
#   compile syntax-check every .py file (and optional test snippets)
#   trace   run under sys.settrace and record frames + objects per step
import ast
import builtins
import dis
import importlib
import inspect
import io
import json
import linecache
import math
import os
import shutil
import sys
import time
import traceback
import types

from _plp_js import emit as _js_emit, request_input as _js_request_input

PROJECT = '/home/pyodide/project'
OUTPUT_LIMIT = 200_000
HARNESS_DIR = os.path.dirname(os.path.abspath(__file__))
_TOP_LEVEL_AWAIT = ast.PyCF_ALLOW_TOP_LEVEL_AWAIT
_real_input = builtins.input


def _blocking_sleep(secs, /):
    """CPython's time.sleep() blocks the thread. Pyodide's version yields to the
    browser's event loop (so asyncio tasks keep running during it), which would
    teach the wrong lesson about blocking calls — restore CPython's semantics.
    Interrupts (Stop / time limit) still work because this is a Python loop."""
    if isinstance(secs, bool) or not isinstance(secs, (int, float)):
        raise TypeError(f"'{type(secs).__name__}' object cannot be interpreted as an integer or float")
    if secs < 0:
        raise ValueError('sleep length must be non-negative')
    end = time.perf_counter() + secs
    while time.perf_counter() < end:
        pass


_blocking_sleep.__name__ = _blocking_sleep.__qualname__ = 'sleep'
_blocking_sleep.__module__ = 'time'
time.sleep = _blocking_sleep


# ---------------------------------------------------------- fresh state
# The interpreter is reused between runs (loading it takes seconds), so global
# state a program changes must be put back before the next run — otherwise e.g.
# logging.basicConfig() from an earlier run would keep writing to that run's
# (gone) output, and changed warning filters would leak into later programs.
import gc
import logging
import warnings

_BASE_BUILTINS = dict(builtins.__dict__)
_BASE_WARNING_FILTERS = list(warnings.filters)
_BASE_ENVIRON = dict(os.environ)
_BASE_PATH = list(sys.path)
_BASE_RECURSION = sys.getrecursionlimit()
_BASE_HOOKS = (sys.excepthook, sys.displayhook)
_BASE_GC = gc.get_threshold()


def _logger_state(lg):
    return (list(lg.handlers), lg.level, lg.propagate, lg.disabled, list(lg.filters))


_BASE_LOGGERS = {name: _logger_state(lg) for name, lg in logging.Logger.manager.loggerDict.items() if isinstance(lg, logging.Logger)}
_BASE_ROOT = _logger_state(logging.root)


def _restore_logger(lg, state):
    handlers, level, propagate, disabled, filters = state
    lg.handlers[:] = handlers
    lg.setLevel(level)
    lg.propagate = propagate
    lg.disabled = disabled
    lg.filters[:] = filters


def _reset_state():
    bd = builtins.__dict__
    for k in list(bd):
        if k not in _BASE_BUILTINS:
            del bd[k]
    for k, v in _BASE_BUILTINS.items():
        if bd.get(k) is not v:
            bd[k] = v
    logging.disable(logging.NOTSET)
    _restore_logger(logging.root, _BASE_ROOT)
    for name, lg in list(logging.Logger.manager.loggerDict.items()):
        if isinstance(lg, logging.Logger):
            _restore_logger(lg, _BASE_LOGGERS.get(name, ([], logging.NOTSET, True, False, [])))
    warnings.filters[:] = _BASE_WARNING_FILTERS
    try:
        warnings._filters_mutated()
    except Exception:  # noqa: BLE001 — internal helper; best effort
        pass
    if os.environ != _BASE_ENVIRON:
        os.environ.clear()
        os.environ.update(_BASE_ENVIRON)
    sys.path[:] = _BASE_PATH
    sys.setrecursionlimit(_BASE_RECURSION)
    sys.excepthook, sys.displayhook = _BASE_HOOKS
    gc.enable()
    gc.set_threshold(*_BASE_GC)
    decimal = sys.modules.get('decimal')
    if decimal is not None:
        decimal.setcontext(decimal.Context())
    # `import this` prints the Zen of Python on first import only; every real run
    # is a fresh process, so forget it between runs.
    sys.modules.pop('this', None)


# ----------------------------------------------------------------- output


class _Sink:
    """Collects everything a run prints; optionally streams it to the page."""

    def __init__(self, stream):
        self.stream = stream
        self.parts = []
        self.size = 0
        self.truncated = False
        self.pending = []
        self.last = 0.0

    def write(self, name, s):
        if self.truncated or not s:
            return
        if self.size + len(s) > OUTPUT_LIMIT:
            s = s[: max(0, OUTPUT_LIMIT - self.size)]
            self.truncated = True
        self.size += len(s)
        self._add(name, s)
        if self.truncated:
            self._add('info', f'\n[output truncated after {OUTPUT_LIMIT:,} characters]\n')
            self.flush()
            return
        if self.stream and '\n' in s:
            now = time.monotonic()
            if now - self.last > 0.03 or sum(len(t) for _, t in self.pending) > 8192:
                self.flush()

    def _add(self, name, s):
        self.parts.append((name, s))
        if self.stream:
            if self.pending and self.pending[-1][0] == name:
                self.pending[-1] = (name, self.pending[-1][1] + s)
            else:
                self.pending.append((name, s))

    def info(self, s):
        self._add('info', s)

    def flush(self):
        if not self.stream:
            return
        pending, self.pending = self.pending, []
        for name, text in pending:
            _js_emit(name, text)
        self.last = time.monotonic()

    def text(self, name='stdout'):
        return ''.join(s for n, s in self.parts if n == name)


class _Out(io.TextIOBase):
    def __init__(self, sink, name):
        self._sink = sink
        self._name = name

    @property
    def name(self):
        return f'<{self._name}>'

    @property
    def encoding(self):
        return 'utf-8'

    def writable(self):
        return True

    def isatty(self):
        return False

    def write(self, s):
        if not isinstance(s, str):
            raise TypeError(f'write() argument must be str, not {type(s).__name__}')
        self._sink.write(self._name, s)
        return len(s)

    def flush(self):
        self._sink.flush()


# ------------------------------------------------------------------ input


class _Input:
    """Feeds input(): pre-typed lines first, then (in the browser) a live prompt."""

    def __init__(self, lines, interactive, sink):
        self.lines = list(lines)
        self.interactive = interactive
        self.sink = sink
        self.asked = 0

    def readline(self, prompt=''):
        self.asked += 1
        if self.lines:
            line = self.lines.pop(0)
            self.sink.write('stdin', line + '\n')
            return line
        if self.interactive:
            self.sink.flush()
            got = _js_request_input(prompt)
            if got is not None:
                line = str(got)
                self.sink.write('stdin', line + '\n')
                return line
        raise EOFError('EOF when reading a line')


class _Stdin(io.TextIOBase):
    def __init__(self, source):
        self._source = source

    def readable(self):
        return True

    def isatty(self):
        return False

    def readline(self, size=-1):
        try:
            return self._source.readline() + '\n'
        except EOFError:
            return ''

    def read(self, size=-1):
        out = []
        while True:
            line = self.readline()
            if not line:
                return ''.join(out)
            out.append(line)


def _make_input(source):
    def input(prompt=''):  # noqa: A001 — replaces the builtin while user code runs
        prompt = str(prompt)
        if prompt:
            sys.stdout.write(prompt)
        return source.readline(prompt)

    return input


def _lines(stdin):
    if stdin is None:
        return []
    if isinstance(stdin, list):
        return [str(x) for x in stdin]
    text = str(stdin)
    if text.endswith('\n'):
        text = text[:-1]
    return text.split('\n') if text else []


# ---------------------------------------------------------------- project


def _short(text):
    return str(text).replace(PROJECT + '/', '')


def _prepare_project(files):
    """Write the project to a fresh folder and forget modules from the last run."""
    for name, mod in list(sys.modules.items()):
        f = getattr(mod, '__file__', None) or ''
        if f.startswith(PROJECT + '/'):
            del sys.modules[name]
    if os.path.isdir(PROJECT):
        os.chdir('/')
        shutil.rmtree(PROJECT, ignore_errors=True)
    os.makedirs(PROJECT, exist_ok=True)
    for name, src in files.items():
        path = os.path.join(PROJECT, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(src)
    os.chdir(PROJECT)
    if not sys.path or sys.path[0] != PROJECT:
        while PROJECT in sys.path:
            sys.path.remove(PROJECT)
        sys.path.insert(0, PROJECT)
    importlib.invalidate_caches()
    linecache.clearcache()


# Browsers without WebAssembly stack switching (JSPI) can't block inside
# asyncio.run(). There, top-level `asyncio.run(coro)` calls are compiled as
# `await coro` instead — the coroutine still runs for real on the event loop.
_ASYNCIO_FALLBACK = False


class _AsyncioRunToAwait(ast.NodeTransformer):
    def _skip(self, node):
        return node  # only module-level calls (incl. inside if __name__ == "__main__")

    visit_FunctionDef = visit_AsyncFunctionDef = visit_ClassDef = visit_Lambda = _skip

    def visit_Call(self, node):
        self.generic_visit(node)
        f = node.func
        if isinstance(f, ast.Attribute) and f.attr == 'run' and isinstance(f.value, ast.Name) and f.value.id == 'asyncio' and node.args:
            return ast.copy_location(ast.Await(node.args[0]), node)
        return node


def _compile_program(source, path):
    if _ASYNCIO_FALLBACK and 'asyncio.run' in source:
        tree = _AsyncioRunToAwait().visit(ast.parse(source, path))
        ast.fix_missing_locations(tree)
        return compile(tree, path, 'exec', flags=_TOP_LEVEL_AWAIT, dont_inherit=True)
    return compile(source, path, 'exec', flags=_TOP_LEVEL_AWAIT, dont_inherit=True)


def _entry_of(files, entry):
    if entry and entry in files:
        return entry
    if 'main.py' in files:
        return 'main.py'
    py = [f for f in files if f.endswith('.py')]
    return py[0] if py else None


def _is_internal(filename):
    filename = filename or ''
    if filename.startswith(PROJECT + '/'):
        return False
    return filename.startswith(HARNESS_DIR + '/') or '/_pyodide/' in filename or '/site-packages/pyodide/' in filename


def _format_exception(exc):
    """A real CPython traceback, minus the harness's own frames."""
    tb = exc.__traceback__
    while tb is not None and _is_internal(tb.tb_frame.f_code.co_filename):
        tb = tb.tb_next
    text = ''.join(traceback.format_exception(type(exc), exc, tb))
    return _short(text)


def _exc_line(exc):
    msg = str(exc)
    return f'{type(exc).__name__}: {msg}' if msg else type(exc).__name__


def _where(exc):
    """'main.py line 7' for the innermost frame that belongs to the project."""
    tb = exc.__traceback__
    found = None
    while tb is not None:
        fname = tb.tb_frame.f_code.co_filename
        if fname.startswith(PROJECT + '/'):
            found = f'{_short(fname)} line {tb.tb_lineno}'
        tb = tb.tb_next
    if found is None and isinstance(exc, SyntaxError) and exc.filename:
        found = f'{_short(exc.filename)} line {exc.lineno}'
    return found


def _safe_repr(obj, limit=300):
    try:
        text = repr(obj)
    except Exception as e:  # a user __repr__ can raise
        text = f'<{type(obj).__name__} object (repr failed: {type(e).__name__})>'
    if len(text) > limit:
        text = text[: limit - 1] + '…'
    return text


_HIDDEN_KINDS = (types.ModuleType,)


def _variables(ns, hide=()):
    out = []
    for name, value in list(ns.items()):
        if name.startswith('__') or name in hide:
            continue
        try:  # some objects raise on inspection (e.g. a dead weakref.proxy)
            t = type(value)  # type() never consults the object, unlike isinstance()
            if issubclass(t, _HIDDEN_KINDS):
                continue
            kind = 'class' if issubclass(t, type) else 'function' if t is types.FunctionType else t.__name__
            out.append({'name': name, 'type': kind, 'value': _safe_repr(value)})
        except Exception as e:  # noqa: BLE001
            out.append({'name': name, 'type': type(value).__name__, 'value': f'<unavailable: {type(e).__name__}>'})
        if len(out) >= 80:
            break
    return out


async def _exec_program(files, entry, stdin=None, interactive=False, stream=False, run_name='__main__'):
    """Run the entry file as a fresh program. Returns (summary, namespace, sink)."""
    sink = _Sink(stream)
    entry = _entry_of(files, entry)
    if entry is None:
        return {'status': 'error', 'error': 'There is no .py file to run.'}, {}, sink
    _reset_state()
    _prepare_project(files)
    path = os.path.join(PROJECT, entry)
    module = types.ModuleType(run_name)
    module.__file__ = path
    module.__builtins__ = builtins
    ns = module.__dict__
    source = _Input(_lines(stdin), interactive, sink)
    saved = (sys.stdout, sys.stderr, sys.stdin, sys.modules.get('__main__'), builtins.input, sys.argv)
    sys.stdout, sys.stderr = _Out(sink, 'stdout'), _Out(sink, 'stderr')
    sys.stdin = _Stdin(source)
    builtins.input = _make_input(source)
    sys.argv = [entry]
    if run_name == '__main__':
        sys.modules['__main__'] = module
    summary = {'status': 'ok', 'error': None, 'where': None, 'exitCode': 0}
    started = time.perf_counter()
    try:
        code = _compile_program(files[entry], path)
        if code.co_flags & inspect.CO_COROUTINE:
            await eval(code, ns)
        else:
            exec(code, ns)
    except SystemExit as e:
        code_ = e.code
        if code_ not in (None, 0):
            summary.update(status='exit', exitCode=code_ if isinstance(code_, int) else 1)
            if not isinstance(code_, int):
                sink.write('stderr', f'{code_}\n')
            sink.info(f'\n[program exited with status {summary["exitCode"]}]\n')
    except KeyboardInterrupt:
        summary.update(status='stopped', error='Execution was stopped.')
    except BaseException as e:  # noqa: BLE001 — report everything the learner's code raises
        summary.update(status='error', error=_exc_line(e), where=_where(e))
        sink.write('stderr', _format_exception(e))
        hint = _hint_for(e, source)
        if hint:
            sink.info(hint)
    finally:
        summary['ms'] = round((time.perf_counter() - started) * 1000, 1)
        sys.stdout, sys.stderr, sys.stdin, main_mod, builtins.input, sys.argv = saved
        if run_name == '__main__' and main_mod is not None:
            sys.modules['__main__'] = main_mod
        try:
            sink.flush()
        except BaseException:  # noqa: BLE001
            pass
    summary['inputCalls'] = source.asked
    sink.module = module  # tests run with this module as __main__ (pickle, dataclasses, typing need it)
    return summary, ns, sink


def _hint_for(exc, source):
    if isinstance(exc, EOFError) and source.asked and not source.interactive:
        return '\n[hint] input() had no line left to read. Type the input lines into the Input tab (one per line), then run again.\n'
    if isinstance(exc, RuntimeError) and 'stack switching' in str(exc):
        return (
            '\n[hint] asyncio.run() needs WebAssembly stack switching (JSPI), which this browser does not provide. '
            'Chrome and Edge 137+ support it. In this playground you can also write `await main()` at the top level.\n'
        )
    if isinstance(exc, RuntimeError) and "can't start new thread" in str(exc):
        return '\n[hint] Threads cannot start inside the browser sandbox (WebAssembly runs on one thread here). Run threading examples on your own computer.\n'
    if isinstance(exc, (ModuleNotFoundError,)) and exc.name and exc.name.split('.')[0] not in sys.stdlib_module_names:
        return f'\n[hint] "{exc.name}" is a third-party package. The browser sandbox only has the Python standard library — install it with pip on your own machine to use it.\n'
    if isinstance(exc, (OSError, RuntimeError)) and ('TLS' in str(exc) or 'network' in str(exc).lower()):
        return '\n[hint] The sandbox has no network access. Lessons simulate HTTP with fake clients; run real requests on your own computer.\n'
    return None


# ------------------------------------------------------------------ tests


class _Raises:
    def __init__(self, expected, match=None):
        self.expected = expected
        self.match = match
        self.value = None

    def __enter__(self):
        return self

    def __exit__(self, et, ev, tb):
        name = getattr(self.expected, '__name__', str(self.expected))
        if et is None:
            raise AssertionError(f'Expected {name} to be raised, but no exception was raised.')
        if not issubclass(et, self.expected):
            return False  # a different exception: let it fail the test with its own message
        if self.match is not None:
            import re

            if not re.search(self.match, str(ev)):
                raise AssertionError(f'{name} was raised, but its message {str(ev)!r} does not match {self.match!r}.')
        self.value = ev
        return True


class _Approx:
    def __init__(self, expected, rel=1e-6, abs=1e-9):  # noqa: A002
        self.expected = expected
        self.rel = rel
        self.abs = abs

    def _close(self, a, b):
        try:
            return math.isclose(a, b, rel_tol=self.rel, abs_tol=self.abs)
        except TypeError:
            return a == b

    def __eq__(self, other):
        if isinstance(self.expected, (list, tuple)):
            return isinstance(other, (list, tuple)) and len(other) == len(self.expected) and all(self._close(a, b) for a, b in zip(other, self.expected))
        if isinstance(self.expected, dict):
            return isinstance(other, dict) and other.keys() == self.expected.keys() and all(self._close(other[k], v) for k, v in self.expected.items())
        return self._close(other, self.expected)

    def __repr__(self):
        return f'approx({self.expected!r})'


class ProgramCrashed(Exception):
    pass


def _drive(coro):
    """Run a coroutine that never really suspends (a synchronous program) to completion."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    coro.close()
    raise RuntimeError('This program awaits at the top level — use `await run_program_async()` in the test instead.')


def _explain_assert(src, lineno, ns):
    """pytest-style detail for a bare `assert`: show both sides of the comparison."""
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return None
    for node in ast.walk(tree):
        if isinstance(node, ast.Assert) and node.lineno <= lineno <= (node.end_lineno or node.lineno):
            text = ast.get_source_segment(src, node.test) or ''
            if any(isinstance(n, ast.Await) for n in ast.walk(node.test)):
                return f'assert {text}'
            try:
                if isinstance(node.test, ast.Compare) and len(node.test.ops) == 1:
                    left = eval(compile(ast.Expression(node.test.left), '<test>', 'eval'), ns)
                    right = eval(compile(ast.Expression(node.test.comparators[0]), '<test>', 'eval'), ns)
                    return f'assert {text}\n  left side:  {_safe_repr(left, 200)}\n  right side: {_safe_repr(right, 200)}'
                value = eval(compile(ast.Expression(node.test), '<test>', 'eval'), ns)
                return f'assert {text}\n  was: {_safe_repr(value, 200)}'
            except BaseException:  # noqa: BLE001
                return f'assert {text}'
    return None


def _test_line(exc):
    tb = exc.__traceback__
    line = None
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == '<test>':
            line = tb.tb_lineno
        tb = tb.tb_next
    return line


async def _run_tests(req):
    files, entry = req['files'], req.get('entry')
    results = []
    for t in req.get('tests', []):
        name = t.get('name', 'test')
        prog, ns, sink = await _exec_program(files, entry, stdin=t.get('stdin', req.get('stdin')), stream=False)
        if prog['status'] == 'stopped':
            results.append({'name': name, 'pass': False, 'error': 'Stopped: the time limit was reached (an infinite loop?).'})
            break
        if prog['status'] == 'error':
            where = f' ({prog["where"]})' if prog.get('where') else ''
            results.append({'name': name, 'pass': False, 'error': f'Your program crashed before this check could run: {prog["error"]}{where}'})
            continue
        results.append(await _one_test(t, files, entry, ns, sink))
    return {'status': 'ok', 'results': results}


async def _one_test(t, files, entry, prog_ns, prog_sink):
    name = t.get('name', 'test')
    src = t.get('code', '')

    def _result(s, sk):
        if s['status'] == 'error':
            raise ProgramCrashed(f'the program crashed with {s["error"]}' + (f' ({s["where"]})' if s.get('where') else ''))
        return sk.text('stdout')

    def run_program(stdin=''):
        s, _, sk = _drive(_exec_program(files, entry, stdin=stdin, stream=False))
        return _result(s, sk)

    async def run_program_async(stdin=''):
        s, _, sk = await _exec_program(files, entry, stdin=stdin, stream=False)
        return _result(s, sk)

    def capture(fn, *args, **kwargs):
        sk = _Sink(False)
        saved = sys.stdout
        sys.stdout = _Out(sk, 'stdout')
        try:
            fn(*args, **kwargs)
        finally:
            sys.stdout = saved
        return sk.text('stdout')

    tns = dict(prog_ns)
    tns.update(
        __name__='__plp_test__',
        output=prog_sink.text('stdout'),
        run_program=run_program,
        run_program_async=run_program_async,
        capture=capture,
        raises=_Raises,
        approx=_Approx,
        files=dict(files),
        ns=prog_ns,
        module=importlib.import_module,
    )
    sink = _Sink(False)
    saved = sys.stdout, sys.stderr, builtins.input, sys.modules.get('__main__')
    sys.stdout, sys.stderr = _Out(sink, 'stdout'), _Out(sink, 'stderr')
    builtins.input = _make_input(_Input(_lines(t.get('stdin')), False, sink))
    if getattr(prog_sink, 'module', None) is not None:
        sys.modules['__main__'] = prog_sink.module
    try:
        code = compile(src, '<test>', 'exec', flags=_TOP_LEVEL_AWAIT, dont_inherit=True)
        if code.co_flags & inspect.CO_COROUTINE:
            await eval(code, tns)
        else:
            exec(code, tns)
        return {'name': name, 'pass': True}
    except KeyboardInterrupt:
        return {'name': name, 'pass': False, 'error': 'Stopped: the time limit was reached (an infinite loop?).'}
    except AssertionError as e:
        line = _test_line(e)
        detail = _explain_assert(src, line, tns) if line else None
        msg = str(e)
        parts = [p for p in (msg, detail) if p]
        return {'name': name, 'pass': False, 'error': '\n'.join(parts) or 'Assertion failed.'}
    except ProgramCrashed as e:
        return {'name': name, 'pass': False, 'error': f'When the test re-ran your program, {e}'}
    except BaseException as e:  # noqa: BLE001
        where = _where(e)
        return {'name': name, 'pass': False, 'error': _exc_line(e) + (f' (raised at {where})' if where else '')}
    finally:
        sys.stdout, sys.stderr, builtins.input, main_mod = saved
        if main_mod is not None:
            sys.modules['__main__'] = main_mod


# ---------------------------------------------------------------- compile


def _compile_all(req):
    errors = []
    for name, src in req['files'].items():
        if not name.endswith('.py'):
            continue
        try:
            compile(src, name, 'exec', flags=_TOP_LEVEL_AWAIT, dont_inherit=True)
        except SyntaxError as e:
            errors.append({'file': name, 'line': e.lineno, 'message': f'{type(e).__name__}: {e.msg}'})
    for i, snippet in enumerate(req.get('snippets', [])):
        try:
            compile(snippet.get('code', ''), '<test>', 'exec', flags=_TOP_LEVEL_AWAIT, dont_inherit=True)
        except SyntaxError as e:
            errors.append({'file': snippet.get('name', f'snippet {i}'), 'line': e.lineno, 'message': f'{type(e).__name__}: {e.msg}'})
    return {'status': 'ok' if not errors else 'error', 'errors': errors}


# ------------------------------------------------------------------ trace


class _TraceLimit(BaseException):
    pass


_INLINE_ALWAYS = (type(None), bool)
_PRIMITIVES = (int, float, complex, str, bytes)


class _Tracer:
    """Records the program's state (frames, variables, objects) at every step."""

    def __init__(self, files, inline, max_steps, sink):
        self.paths = {os.path.join(PROJECT, f) for f in files if f.endswith('.py')}
        self.inline = inline
        self.max_steps = max_steps
        self.sink = sink
        self.steps = []
        self.labels = {}  # id(obj) -> (label, type)
        self.next_label = 1
        self.frame_ids = {}
        self.next_frame = 1
        self.truncated = False
        self.module_ns = None
        self.user_modules = set()

    # -- object labels stay stable across steps so the UI can keep objects in place
    def label(self, obj):
        key = id(obj)
        hit = self.labels.get(key)
        if hit is not None and hit[1] is type(obj):
            return hit[0]
        n = self.next_label
        self.next_label += 1
        self.labels[key] = (n, type(obj))
        return n

    def frame_label(self, frame):
        key = id(frame)
        if key not in self.frame_ids:
            self.frame_ids[key] = self.next_frame
            self.next_frame += 1
        return self.frame_ids[key]

    def is_user_class(self, cls):
        mod = getattr(cls, '__module__', None)
        return mod == '__main__' or mod in self.user_modules

    # -- encoding
    def ref(self, obj, heap, queue):
        if type(obj) in _INLINE_ALWAYS:
            return {'v': repr(obj), 't': type(obj).__name__}
        if self.inline and type(obj) in _PRIMITIVES:
            return {'v': _safe_repr(obj, 60), 't': type(obj).__name__}
        n = self.label(obj)
        if n not in heap:
            heap[n] = None
            queue.append((n, obj))
        return {'r': n}

    def encode(self, obj, heap, queue):
        MAX = 12
        t = type(obj)
        tname = t.__name__
        if t in _PRIMITIVES or (isinstance(obj, _PRIMITIVES) and not hasattr(obj, '__dict__')):
            return {'k': 'prim', 'type': tname, 'v': _safe_repr(obj, 60)}
        if isinstance(obj, (list, tuple)):
            items = [self.ref(x, heap, queue) for x in list(obj)[:MAX]]
            entry = {'k': 'tuple' if isinstance(obj, tuple) else 'list', 'type': tname, 'items': items, 'more': max(0, len(obj) - MAX)}
            if hasattr(obj, '_fields'):
                entry['fields'] = list(obj._fields)[:MAX]
            return entry
        if isinstance(obj, (set, frozenset)):
            items = [self.ref(x, heap, queue) for x in list(obj)[:MAX]]
            return {'k': 'set', 'type': tname, 'items': items, 'more': max(0, len(obj) - MAX)}
        if isinstance(obj, dict):
            pairs = list(obj.items())
            entries = [[self.ref(k, heap, queue), self.ref(v, heap, queue)] for k, v in pairs[:MAX]]
            return {'k': 'dict', 'type': tname, 'entries': entries, 'more': max(0, len(pairs) - MAX)}
        if isinstance(obj, types.FunctionType):
            entry = {'k': 'func', 'type': 'function', 'name': obj.__qualname__}
            try:
                entry['sig'] = f'{obj.__name__}{inspect.signature(obj)}'
            except (TypeError, ValueError):
                entry['sig'] = obj.__name__ + '(…)'
            if obj.__closure__:
                cells = []
                for nm, cell in zip(obj.__code__.co_freevars, obj.__closure__):
                    try:
                        cells.append([nm, self.ref(cell.cell_contents, heap, queue)])
                    except ValueError:
                        cells.append([nm, {'v': '<empty>', 't': 'cell'}])
                entry['closure'] = cells[:MAX]
            wrapped = obj.__dict__.get('__wrapped__')
            if wrapped is not None:
                entry['wraps'] = self.ref(wrapped, heap, queue)
            return entry
        if isinstance(obj, (types.GeneratorType, types.CoroutineType)):
            state = inspect.getgeneratorstate(obj) if isinstance(obj, types.GeneratorType) else inspect.getcoroutinestate(obj)
            entry = {'k': 'gen', 'type': tname, 'name': obj.__qualname__, 'state': state.split('_', 1)[1].lower()}
            frame = getattr(obj, 'gi_frame', None) or getattr(obj, 'cr_frame', None)
            if frame is not None and state.endswith('SUSPENDED'):
                entry['line'] = frame.f_lineno
                entry['locals'] = [[k, self.ref(v, heap, queue)] for k, v in list(frame.f_locals.items())[:MAX] if not k.startswith('.')]
            return entry
        if isinstance(obj, type) and self.is_user_class(obj):
            attrs, methods = [], []
            for k, v in obj.__dict__.items():
                if k.startswith('__') and k not in ('__init__', '__repr__', '__str__', '__eq__', '__len__', '__iter__', '__call__', '__enter__', '__exit__'):
                    continue
                if isinstance(v, (types.FunctionType, staticmethod, classmethod, property)):
                    kind = type(v).__name__ if not isinstance(v, types.FunctionType) else 'method'
                    methods.append(k if kind == 'method' else f'{k} ({kind})')
                else:
                    attrs.append([k, self.ref(v, heap, queue)])
            bases = [b.__name__ for b in obj.__bases__ if b is not object]
            return {
                'k': 'class',
                'type': 'class',
                'name': obj.__name__,
                'bases': bases,
                'mro': [c.__name__ for c in obj.__mro__],
                'methods': methods[:MAX],
                'attrs': attrs[:MAX],
            }
        if isinstance(obj, types.MethodType):
            return {'k': 'other', 'type': 'method', 'v': f'bound method {obj.__func__.__qualname__}', 'self': self.ref(obj.__self__, heap, queue)}
        if self.is_user_class(t) and not isinstance(obj, BaseException):
            attrs = []
            d = getattr(obj, '__dict__', None)
            if isinstance(d, dict):
                attrs = [[k, self.ref(v, heap, queue)] for k, v in list(d.items())[:MAX]]
            for slot in getattr(t, '__slots__', ()) if isinstance(getattr(t, '__slots__', ()), (tuple, list)) else ():
                if hasattr(obj, slot):
                    attrs.append([slot, self.ref(getattr(obj, slot), heap, queue)])
            return {'k': 'obj', 'type': tname, 'attrs': attrs, 'mro': [c.__name__ for c in t.__mro__ if c is not object]}
        return {'k': 'other', 'type': tname, 'v': _safe_repr(obj, 80)}

    def safe_encode(self, obj, heap, queue):
        try:
            return self.encode(obj, heap, queue)
        except Exception as e:  # noqa: BLE001 — e.g. a dead weakref.proxy
            return {'k': 'other', 'type': type(obj).__name__, 'v': f'<unavailable: {type(e).__name__}>'}

    def frame_vars(self, frame, heap, queue):
        out = []
        if frame.f_code.co_name == '<module>':
            items = list(frame.f_globals.items())
        else:
            items = list(frame.f_locals.items())
        for k, v in items:
            if k.startswith('__') or k.startswith('.') or issubclass(type(v), types.ModuleType):
                continue
            out.append([k, self.ref(v, heap, queue)])
            if len(out) >= 30:
                break
        return out

    def snapshot(self, frame, event, arg):
        if len(self.steps) >= self.max_steps:
            self.truncated = True
            raise _TraceLimit()
        chain = []
        f = frame
        while f is not None:
            if f.f_code.co_filename in self.paths:
                chain.append(f)
            f = f.f_back
        chain.reverse()
        heap, queue = {}, []
        stack = []
        for fr in chain:
            name = fr.f_code.co_name
            flags = fr.f_code.co_flags
            if name == '<module>':
                kind = 'module'
            elif not flags & inspect.CO_OPTIMIZED:
                kind = 'class'  # class bodies run as unoptimised code blocks
            elif flags & (inspect.CO_GENERATOR | inspect.CO_COROUTINE):
                kind = 'gen'
            else:
                kind = 'func'
            entry = {
                'id': self.frame_label(fr),
                'name': 'Global frame' if name == '<module>' and fr.f_code.co_filename.endswith('/main.py') else name,
                'file': _short(fr.f_code.co_filename),
                'line': fr.f_lineno,
                'kind': kind,
                'vars': self.frame_vars(fr, heap, queue),
            }
            stack.append(entry)
        step = {'e': event, 'line': frame.f_lineno, 'file': _short(frame.f_code.co_filename), 'stack': stack, 'o': len(self.sink.text('stdout'))}
        if event == 'return':
            step['ret'] = self.ref(arg, heap, queue)
            if frame.f_code.co_flags & inspect.CO_GENERATOR and frame.f_lasti >= 0:
                step['yield'] = _is_yield(frame)
        if event == 'exception':
            exc = arg[1]
            step['exc'] = _exc_line(exc)
        while queue and len(heap) <= 60:
            n, obj = queue.pop(0)
            heap[n] = self.safe_encode(obj, heap, queue)
        for n, obj in queue:
            heap[n] = {'k': 'other', 'type': type(obj).__name__, 'v': '…'}
        step['heap'] = heap
        self.steps.append(step)

    def local_trace(self, frame, event, arg):
        if event == 'return' and frame.f_code.co_name == '<module>':
            return self.local_trace  # the final "finished" step shows this state
        if event in ('line', 'return', 'exception'):
            self.snapshot(frame, event, arg)
        return self.local_trace

    def global_trace(self, frame, event, arg):
        if frame.f_code.co_filename not in self.paths:
            return None
        if event == 'call':
            if frame.f_code.co_name != '<module>' or frame.f_back is None or frame.f_back.f_code.co_filename in self.paths:
                self.snapshot(frame, 'call', None)
        return self.local_trace


_YIELD_OP = dis.opmap.get('YIELD_VALUE')


def _is_yield(frame):
    """True when a generator's 'return' event is really a yield (it will resume later)."""
    try:
        return frame.f_code.co_code[frame.f_lasti] == _YIELD_OP
    except Exception:  # noqa: BLE001
        return False


async def _trace(req):
    files = req['files']
    entry = _entry_of(files, req.get('entry'))
    if entry is None:
        return {'status': 'error', 'error': 'There is no .py file to visualize.'}
    sink = _Sink(False)
    tracer = _Tracer(files, bool(req.get('inline', True)), int(req.get('maxSteps', 300)), sink)
    _reset_state()
    _prepare_project(files)
    path = os.path.join(PROJECT, entry)
    module = types.ModuleType('__main__')
    module.__file__ = path
    module.__builtins__ = builtins
    ns = module.__dict__
    tracer.user_modules = {os.path.splitext(f)[0].replace('/', '.') for f in files if f.endswith('.py')}
    source = _Input(_lines(req.get('stdin')), False, sink)
    saved = (sys.stdout, sys.stderr, sys.stdin, sys.modules.get('__main__'), builtins.input)
    sys.stdout, sys.stderr = _Out(sink, 'stdout'), _Out(sink, 'stderr')
    sys.stdin = _Stdin(source)
    builtins.input = _make_input(source)
    sys.modules['__main__'] = module
    status, error = 'ok', None
    try:
        code = compile(files[entry], path, 'exec', dont_inherit=True)
        sys.settrace(tracer.global_trace)
        try:
            exec(code, ns)
        finally:
            sys.settrace(None)
    except _TraceLimit:
        status = 'truncated'
    except KeyboardInterrupt:
        status, error = 'stopped', 'Execution was stopped.'
    except BaseException as e:  # noqa: BLE001
        status, error = 'error', _exc_line(e)
        sink.write('stderr', _format_exception(e))
    finally:
        sys.settrace(None)
        sys.stdout, sys.stderr, sys.stdin, main_mod, builtins.input = saved
        if main_mod is not None:
            sys.modules['__main__'] = main_mod
    # A final "finished" step showing the globals once everything has run.
    if status in ('ok', 'error'):
        heap, queue = {}, []
        gvars = []
        for k, v in list(ns.items()):
            if k.startswith('__') or issubclass(type(v), types.ModuleType):
                continue
            gvars.append([k, tracer.ref(v, heap, queue)])
        while queue and len(heap) <= 60:
            n, obj = queue.pop(0)
            heap[n] = tracer.safe_encode(obj, heap, queue)
        for n, obj in queue:
            heap[n] = {'k': 'other', 'type': type(obj).__name__, 'v': '…'}
        last_line = tracer.steps[-1]['line'] if tracer.steps else 1
        tracer.steps.append({
            'e': 'end' if status == 'ok' else 'crash',
            'line': last_line,
            'file': entry,
            'stack': [{'id': 0, 'name': 'Global frame', 'file': entry, 'line': last_line, 'kind': 'module', 'vars': gvars[:30]}],
            'heap': heap,
            'o': len(sink.text('stdout')),
            'exc': error,
        })
    return {
        'status': status,
        'error': error,
        'steps': tracer.steps,
        'stdout': sink.text('stdout'),
        'stderr': sink.text('stderr'),
        'truncated': tracer.truncated,
        'entry': entry,
    }


# ------------------------------------------------------------------- main


async def run(request_json):
    global _ASYNCIO_FALLBACK
    req = json.loads(request_json)
    mode = req.get('mode', 'app')
    _ASYNCIO_FALLBACK = req.get('jspi') is False
    try:
        if mode == 'compile':
            result = _compile_all(req)
        elif mode == 'test':
            result = await _run_tests(req)
        elif mode == 'trace':
            result = await _trace(req)
        else:
            summary, ns, sink = await _exec_program(
                req['files'], req.get('entry'), stdin=req.get('stdin'), interactive=bool(req.get('interactive')), stream=True
            )
            result = dict(summary)
            result['variables'] = _variables(ns)
            result['stdout'] = sink.text('stdout')
    except KeyboardInterrupt:
        result = {'status': 'stopped', 'error': 'Execution was stopped.'}
    except BaseException as e:  # noqa: BLE001 — a harness bug must never look like learner output
        result = {'status': 'internal', 'error': f'Internal sandbox error: {_exc_line(e)}', 'detail': traceback.format_exc()}
    return json.dumps(result, default=str)


def info():
    return json.dumps({'python': sys.version.split()[0], 'implementation': sys.implementation.name})
