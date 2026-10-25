// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const MINI_PYTEST = py`"""mini_pytest - a SIMPLIFIED, teaching-only imitation of pytest.

Real pytest also discovers test files, rewrites asserts at import time
(it never re-runs code), and adds fixtures, plugins and richer reports.
"""
import ast
import linecache
import os
import re
import time
import traceback


class _Mark:
    def parametrize(self, argnames, argvalues):
        def decorate(test):
            test.params = ([name.strip() for name in argnames.split(",")], list(argvalues))
            return test
        return decorate

    def skip(self, reason=""):
        def decorate(test):
            test.skip_reason = reason
            return test
        return decorate


mark = _Mark()


class raises:
    """with raises(ValueError, match="regex") as excinfo: ..."""

    def __init__(self, expected, match=None):
        self.expected, self.match, self.value = expected, match, None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            raise AssertionError(f"DID NOT RAISE {self.expected.__name__}")
        if not issubclass(exc_type, self.expected):
            return False                      # a different exception: let it escape
        if self.match is not None and not re.search(self.match, str(exc)):
            raise AssertionError(f"Regex pattern did not match. Regex: {self.match!r} Input: {str(exc)!r}")
        self.value = exc
        return True                           # swallow the expected exception


def _cases(test):
    """One (id, kwargs) pair per parametrize row; a single case otherwise."""
    if not hasattr(test, "params"):
        return [(test.__name__, {})]
    names, rows = test.params
    cases = []
    for row in rows:
        row = row if len(names) > 1 else (row,)
        case_id = "-".join(str(value) for value in row)
        cases.append((f"{test.__name__}[{case_id}]", dict(zip(names, row))))
    return cases


_OPS = {ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">", ast.GtE: ">=", ast.In: "in"}


def _explain(test, error):
    """Find the failing line in the test and, for 'assert a OP b', show both values."""
    frames = [(f, n) for f, n in traceback.walk_tb(error.__traceback__) if f.f_code is test.__code__]
    detail = f"{type(error).__name__}: {error}"
    if not frames:
        return "", detail
    frame, lineno = frames[-1]
    line = linecache.getline(frame.f_code.co_filename, lineno).strip()
    if isinstance(error, AssertionError) and not error.args:
        try:   # SIMPLIFIED: re-evaluates both sides. Real pytest records them as the assert runs.
            check = ast.parse(line).body[0].test
            left = eval(ast.unparse(check.left), frame.f_globals, frame.f_locals)
            right = eval(ast.unparse(check.comparators[0]), frame.f_globals, frame.f_locals)
            detail = f"assert {left!r} {_OPS[type(check.ops[0])]} {right!r}"
        except Exception:
            detail = f"assert {line.removeprefix('assert ')}"
    return line, detail


def run(namespace, keyword=None, exitfirst=False, report=True):
    """Run every test_* function in a module or dict. Returns {'passed': [...], ...}."""
    namespace = namespace if isinstance(namespace, dict) else vars(namespace)
    filename = os.path.basename(namespace.get("__file__", "test_file.py"))
    results = {"passed": [], "failed": [], "skipped": []}
    started = time.perf_counter()
    progress, failures = "", []
    tests = [obj for name, obj in namespace.items() if name.startswith("test") and callable(obj)]
    for test in tests:
        for case_id, kwargs in _cases(test):
            if keyword and keyword not in case_id:
                continue                      # like pytest -k (substring match only)
            if hasattr(test, "skip_reason"):
                results["skipped"].append(case_id)
                progress += "s"
                continue
            try:
                test(**kwargs)
            except Exception as error:
                results["failed"].append(case_id)
                failures.append((case_id, *_explain(test, error)))
                progress += "F"
                if exitfirst:
                    break                     # like pytest -x
            else:
                results["passed"].append(case_id)
                progress += "."
        if exitfirst and failures:
            break
    if report:
        _print_report(progress, failures, results, filename, time.perf_counter() - started)
    return results


def _print_report(progress, failures, results, filename, seconds):
    print(f"{progress:<72}[100%]")
    if failures:
        print(" FAILURES ".center(78, "="))
        for case_id, line, detail in failures:
            print(f" {case_id} ".center(78, "_"))
            print(f">   {line}")
            print(f"E   {detail}")
        print(" short test summary info ".center(78, "="))
        for case_id, line, detail in failures:
            print(f"FAILED {filename}::{case_id} - {detail}")
    counts = [f"{len(results[k])} {k}" for k in ("failed", "passed", "skipped") if results[k]]
    print(f"{', '.join(counts) or 'no tests ran'} in {seconds:.2f}s")
`

const PRICING = py`"""pricing.py - the code under test."""


def apply_discount(subtotal):
    """Orders of 50.00 or more get 10% off."""
    if subtotal < 0:
        raise ValueError(f"subtotal cannot be negative, got {subtotal}")
    if subtotal >= 50:
        return round(subtotal * 0.9, 2)
    return subtotal


def parse_quantity(text):
    """Turn what the customer typed into a whole number of at least 1."""
    try:
        quantity = int(text)
    except ValueError:
        raise ValueError(f"not a whole number: {text!r}") from None
    if quantity < 1:
        raise ValueError(f"quantity must be at least 1, got {quantity}")
    return quantity
`

const TEST_PRICING = py`"""test_pricing.py - pytest style: plain functions and plain asserts."""
import mini_pytest as pytest   # in a real project: import pytest

from pricing import apply_discount, parse_quantity


def test_small_orders_pay_full_price():
    assert apply_discount(20.00) == 20.00


def test_discount_at_threshold():
    assert apply_discount(50.00) == 45.00


@pytest.mark.parametrize("subtotal, expected", [
    (0.00, 0.00),
    (49.99, 49.99),
    (50.00, 45.00),
    (120.00, 108.00),
])
def test_apply_discount(subtotal, expected):
    assert apply_discount(subtotal) == expected


def test_negative_subtotal_is_rejected():
    with pytest.raises(ValueError, match="negative"):
        apply_discount(-5)


@pytest.mark.parametrize("text, expected", [("3", 3), (" 12 ", 12)])
def test_parse_quantity(text, expected):
    assert parse_quantity(text) == expected


@pytest.mark.parametrize("text", ["zero", "2.5", "3 apples"])
def test_parse_quantity_rejects_non_numbers(text):
    with pytest.raises(ValueError, match="not a whole number"):
        parse_quantity(text)


@pytest.mark.parametrize("text", ["0", "-1"])
def test_parse_quantity_rejects_values_below_one(text):
    with pytest.raises(ValueError, match="at least 1"):
        parse_quantity(text)


@pytest.mark.skip(reason="gift cards are not built yet")
def test_gift_card_pays_for_the_whole_order():
    ...


if __name__ == "__main__":
    # SIMPLIFIED stand-in for typing "pytest -q" in a terminal. Real pytest needs
    # no such lines: it finds this file because its name starts with test_.
    results = pytest.run(globals())
`

const UNITTEST_VERSION = py`"""The same checks written with unittest, for comparison."""
import unittest

from pricing import apply_discount, parse_quantity


class TestApplyDiscount(unittest.TestCase):
    def test_small_orders_pay_full_price(self):
        self.assertEqual(apply_discount(20.00), 20.00)

    def test_discount_at_threshold(self):
        self.assertEqual(apply_discount(50.00), 45.00)

    def test_apply_discount(self):
        for subtotal, expected in [(0.00, 0.00), (49.99, 49.99), (50.00, 45.00), (120.00, 108.00)]:
            with self.subTest(subtotal=subtotal):
                self.assertEqual(apply_discount(subtotal), expected)

    def test_negative_subtotal_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "negative"):
            apply_discount(-5)


class TestParseQuantity(unittest.TestCase):
    def test_parse_quantity(self):
        for text, expected in [("3", 3), (" 12 ", 12)]:
            with self.subTest(text=text):
                self.assertEqual(parse_quantity(text), expected)

    def test_rejects_non_numbers(self):
        for text in ["zero", "2.5", "3 apples"]:
            with self.subTest(text=text):
                with self.assertRaisesRegex(ValueError, "not a whole number"):
                    parse_quantity(text)

    def test_rejects_values_below_one(self):
        for text in ["0", "-1"]:
            with self.subTest(text=text):
                with self.assertRaisesRegex(ValueError, "at least 1"):
                    parse_quantity(text)

    @unittest.skip("gift cards are not built yet")
    def test_gift_card_pays_for_the_whole_order(self):
        pass


if __name__ == "__main__":
    unittest.main(argv=["pricing-tests"], exit=False, verbosity=2)
`

const SHIPPING_FN = py`def shipping_cost(weight_kg):
    """Parcel price by weight in kg: up to 2 -> 3.50, up to 10 -> 7.00, up to 30 -> 15.00.

    Weights of zero or less, and parcels over 30 kg, raise ValueError.
    """
    if weight_kg <= 0:
        raise ValueError(f"weight must be positive, got {weight_kg}")
    if weight_kg <= 2:
        return 3.50
    if weight_kg <= 10:
        return 7.00
    if weight_kg <= 30:
        return 15.00
    raise ValueError(f"too heavy to ship: {weight_kg} kg")
`

const SHIPPING_STARTER = py`import mini_pytest as pytest   # simplified stand-in for: import pytest


` + SHIPPING_FN + py`

# Copy-pasted tests. Replace them with two parametrized tests.
def test_one_kilo():
    assert shipping_cost(1) == 3.50


def test_five_kilos():
    assert shipping_cost(5) == 7.00


def test_twenty_kilos():
    assert shipping_cost(20) == 15.00


if __name__ == "__main__":
    pytest.run(globals())
`

const SHIPPING_SOLUTION = py`import mini_pytest as pytest   # simplified stand-in for: import pytest


` + SHIPPING_FN + py`

@pytest.mark.parametrize("weight_kg, expected", [
    (0.5, 3.50),
    (2, 3.50),        # top edge of the first band
    (2.5, 7.00),      # just above it
    (10, 7.00),
    (10.5, 15.00),
    (30, 15.00),
])
def test_shipping_cost(weight_kg, expected):
    assert shipping_cost(weight_kg) == expected


@pytest.mark.parametrize("weight_kg", [0, -1, 30.5])
def test_invalid_weights_are_rejected(weight_kg):
    with pytest.raises(ValueError):
        shipping_cost(weight_kg)


if __name__ == "__main__":
    pytest.run(globals())
`

// mutation check: swap shipping_cost for a broken one and run the learner's parametrized tests
const SHIPPING_CHECK = py`real = ns["shipping_cost"]
runner = module("mini_pytest")
def suite_passes_with(fake):
    ns["shipping_cost"] = fake
    try:
        found = runner.run(ns, report=False)
        return not found["failed"] and len(found["passed"]) > 0
    finally:
        ns["shipping_cost"] = real
`

const RAISES_DEMO = py`

def parse_quantity(text):
    quantity = int(text)
    if quantity < 1:
        raise ValueError(f"quantity must be at least 1, got {quantity}")
    return quantity


def demo():
    try:
        with MustRaise(ValueError, match="at least 1") as info:
            parse_quantity("0")
        print("caught:", info.value)
    except Exception as error:
        print(f"{type(error).__name__} escaped: {error}")


demo()
`

const RAISES_STARTER = py`import re


class MustRaise:
    """A simplified pytest.raises:  with MustRaise(ValueError, match="regex") as info: ..."""

    def __init__(self, expected, match=None):
        self.expected = expected      # an exception class, e.g. ValueError
        self.match = match            # optional regex searched for in str(exception)
        self.value = None             # the caught exception, once there is one

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        # TODO: decide what happens when the with-block finishes
        return False
` + RAISES_DEMO

const RAISES_SOLUTION = py`import re


class MustRaise:
    """A simplified pytest.raises:  with MustRaise(ValueError, match="regex") as info: ..."""

    def __init__(self, expected, match=None):
        self.expected = expected      # an exception class, e.g. ValueError
        self.match = match            # optional regex searched for in str(exception)
        self.value = None             # the caught exception, once there is one

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            raise AssertionError(f"DID NOT RAISE {self.expected.__name__}")
        if not issubclass(exc_type, self.expected):
            return False              # not ours: let it propagate
        if self.match is not None and not re.search(self.match, str(exc)):
            raise AssertionError(f"pattern {self.match!r} not found in {str(exc)!r}")
        self.value = exc
        return True                   # True tells Python to swallow the exception
` + RAISES_DEMO

export default {
  id: 'pytest-basics',
  title: 'pytest: tests, assertions & parametrize',
  summary: 'pytest finds your test_* functions automatically, explains every failing plain assert, and turns one test into many with parametrize.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['testing-fundamentals'],
  related: ['fixtures', 'mocking', 'tdd', 'raising-exceptions', 'regular-expressions', 'decorators', 'context-managers', 'virtual-environments', 'pip-and-dependencies', 'packaging', 'code-quality-tools', 'bytecode'],
  tags: ['pytest', 'test discovery', 'assert', 'assertion rewriting', 'pytest.raises', 'match', 'parametrize', 'pytest.param', 'markers', 'skip', 'skipif', 'xfail', 'pytest -k', 'pytest -x', 'pytest -q', 'pytest.approx', 'exit codes', 'failure output'],
  apis: [
    { name: 'pytest (command)', summary: 'Collects test_*.py / *_test.py files, runs every test_* function and Test* class method, and reports the results.' },
    { name: 'pytest.raises(Exc, match=None)', summary: 'Context manager: the block must raise Exc (or a subclass); match is a regex searched for in str(exception).' },
    { name: '@pytest.mark.parametrize(argnames, argvalues, ids=None)', summary: 'Runs one test function once per row of values, each reported as a separate test.' },
    { name: '@pytest.mark.skip / skipif / xfail', summary: 'Do not run a test (always or conditionally), or run it expecting failure (strict=True fails on an unexpected pass).' },
    { name: 'pytest.approx(expected)', summary: 'Compare floats with a tolerance: assert total == pytest.approx(0.3).' },
    { name: 'pytest -q / -v / -k EXPR / -x / --lf / -m MARK', summary: 'Quiet or verbose output; select by name; stop at first failure; rerun last failures; select by marker.' },
  ],
  docs: [
    { label: 'pytest — Get started', url: 'https://docs.pytest.org/en/stable/getting-started.html' },
    { label: 'pytest — How to write and report assertions', url: 'https://docs.pytest.org/en/stable/how-to/assert.html' },
    { label: 'pytest — How to parametrize tests', url: 'https://docs.pytest.org/en/stable/how-to/parametrize.html' },
    { label: 'pytest — Skip and xfail', url: 'https://docs.pytest.org/en/stable/how-to/skipping.html' },
    { label: 'pytest — How to invoke pytest', url: 'https://docs.pytest.org/en/stable/how-to/usage.html' },
    { label: 'pytest — Conventions for test discovery', url: 'https://docs.pytest.org/en/stable/explanation/goodpractices.html#conventions-for-python-test-discovery' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**pytest** is the testing tool most Python projects use. It's a third-party package (you install it with pip), and it takes the ideas from [testing fundamentals](lesson:testing-fundamentals) — arrange, act, assert — and removes almost all the ceremony.`,
    py`With pytest a test is just a **function whose name starts with \`test\`**, and the check is a **plain \`assert\`**:`,
    { code: py`from pricing import apply_discount


def test_discount_at_threshold():
    assert apply_discount(50.00) == 45.00`, lang: 'python', title: 'test_pricing.py — a complete pytest test' },
    py`No class, no \`self.assertEqual\`, no \`unittest.main()\`. You type \`pytest\` in a terminal and it **discovers** the file (its name starts with \`test_\`), runs the function, and — if the assert fails — shows you *both values* and *where they came from*. Add \`@pytest.mark.parametrize\` and the same function checks a whole table of cases.`,
    py`pytest can't be installed in this browser sandbox, so the playground uses a small, clearly labelled **simplified** runner written in plain Python. Every pytest command and output in this lesson is shown exactly as the real tool prints it.`,
  ],
  why: [
    py`Tests only help if people actually write them. unittest's boilerplate (classes, camelCase methods, a dozen \`assertSomething\` names to remember) is small friction, but friction adds up. pytest's "just write a function and assert" style makes tests quick to write and easy to read.`,
    py`Failures are also easier to understand. When \`assert apply_discount(50.00) == 45.00\` fails, pytest prints \`assert 50.0 == 45.0\` and \`where 50.0 = apply_discount(50.0)\` — you often know the bug before opening the file.`,
    py`And it scales: **parametrize** turns copy-pasted tests into one table, **markers** let you skip or select groups of tests, **[fixtures](lesson:fixtures)** share setup cleanly, and a large plugin ecosystem adds coverage, parallel runs and more. pytest also runs existing \`unittest\` tests unchanged, so teams can switch gradually.`,
  ],
  eli15: [
    py`Think of unittest as a very formal teacher: every answer must be written on the official form, in the right box, with the right heading.`,
    py`pytest is a relaxed but sharp teacher. You just write \`assert price == 45\` inside any function whose name starts with \`test_\`. pytest walks round the room, finds every such function by its name, and checks it. If your answer is wrong it doesn't only say "wrong" — it shows you what you actually got (\`50.0\`) next to what you expected (\`45.0\`) and which calculation produced it.`,
    py`And if you want to check the same rule with ten different numbers, you don't write ten tests: you give pytest a table and it runs the test once per row.`,
  ],
  analogy: {
    title: 'A referee with video replay',
    body: [
      py`A football referee blows the whistle when something goes wrong. A referee with **video replay** can also show everyone exactly what happened, frame by frame.`,
      py`A plain Python \`assert\` is the whistle: it stops with \`AssertionError\` and nothing else. pytest is the referee with replay: it records the values in the assert as it runs, so a failure shows the left side, the right side and the function calls that produced them. Parametrize is running the same drill with a whole squad of players, and markers are notes on the team sheet ("injured — skip", "expected to lose — xfail").`,
    ],
    mapping: [
      ['the whistle', 'a failing assert raising AssertionError'],
      ['the video replay', "pytest's assertion rewriting: assert 50.0 == 45.0, where 50.0 = apply_discount(50.0)"],
      ['the referee spotting players by shirt', 'test discovery: files test_*.py, functions test_*'],
      ['one drill, many players', '@pytest.mark.parametrize: one test, many rows of data'],
      ['"injured — sitting out"', '@pytest.mark.skip / skipif'],
      ['"expected to lose this one"', '@pytest.mark.xfail'],
      ['the final score', 'the summary line: 2 failed, 12 passed, 1 skipped'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'What assertion rewriting does (simplified)',
    props: {
      code: py`def apply_discount(subtotal):
    return subtotal * 0.9 if subtotal > 50 else subtotal   # bug: should be >=

# You write:   assert apply_discount(50.0) == 45.0
# pytest compiles something like this instead (SIMPLIFIED):
def test_discount_at_threshold():
    left = apply_discount(50.0)        # 1. remember each value...
    right = 45.0
    if not left == right:              # 2. ...then check the condition
        message = f"assert {left!r} == {right!r}"
        message += f"\n +  where {left!r} = apply_discount(50.0)"
        raise AssertionError(message)  # 3. explain using the saved values

try:
    test_discount_at_threshold()
except AssertionError as error:
    print("FAILED test_discount_at_threshold")
    print(error)
`,
      notes: {
        2: 'The code under test, with a classic boundary bug: `>` instead of `>=`.',
        7: 'pytest rewrites your `assert` so every sub-expression is computed **once** and stored in a hidden variable.',
        9: 'The comparison itself is exactly what your assert said.',
        10: 'Only when it fails does pytest build an explanation from the stored values — nothing is re-run.',
        16: 'The runner catches the `AssertionError` and prints the explanation as part of the report.',
      },
    },
    alt: 'Step-by-step trace. apply_discount has a bug using > instead of >=. A hand-written version of a rewritten test stores apply_discount(50.0) in left and 45.0 in right, finds they differ, builds the message "assert 50.0 == 45.0, where 50.0 = apply_discount(50.0)" and raises AssertionError, which the runner prints.',
    caption: py`Real pytest does this to the **syntax tree** of your test module when it is imported, not by hand — you keep writing plain \`assert\`. See *Under the hood* below.`,
  },
  syntax: [
    py`#### Install and run`,
    { code: py`python -m pip install pytest      # inside your project's virtual environment
pytest -q                         # run everything; quiet: one character per test
pytest -v                         # verbose: one line per test
pytest test_pricing.py::test_discount_at_threshold   # one test, by its "node id"
pytest -k "quantity and not below"   # select by name expression
pytest -x                         # stop at the first failure
pytest --lf                       # rerun only last run's failures
pytest -m "not slow"              # select by marker
python -m pytest                  # same, but also puts the current folder on sys.path`, lang: 'bash', title: 'terminal' },
    py`Install it in a [virtual environment](lesson:virtual-environments) and pin it as a development dependency ([pip & dependencies](lesson:pip-and-dependencies)).`,
    py`#### How pytest finds tests (discovery)`,
    py`With no configuration, pytest starts from the current folder (or the paths you give it) and recurses into sub-folders. It collects:`,
    py`- **files** named \`test_*.py\` or \`*_test.py\`;
- inside them, **functions** whose names start with \`test\`;
- **classes** whose names start with \`Test\` *and that have no \`__init__\`* — their \`test*\` methods are tests (pytest creates a fresh instance per test);
- any \`unittest.TestCase\` subclasses, run the unittest way.`,
    py`#### Plain assert — and pytest.approx for floats`,
    { code: py`def test_total():
    assert cart_total([20.0, 30.0]) == 50.0
    assert "apple" in basket
    assert receipt.startswith("Thanks")
    assert 0.1 + 0.2 == pytest.approx(0.3)     # tolerance for floats
    assert user is None`, lang: 'python', static: true, title: 'any expression works' },
    py`Every assert gets a detailed failure message. For containers pytest even diffs them (\`At index 2 diff: 3 != 4\`); run with \`-vv\` for the full diff.`,
    py`#### Expected exceptions: pytest.raises`,
    { code: py`import pytest


def test_rejects_zero():
    with pytest.raises(ValueError, match="at least 1"):
        parse_quantity("0")


def test_message_shows_the_input():
    with pytest.raises(ValueError) as excinfo:
        parse_quantity("lots")
    assert "'lots'" in str(excinfo.value)      # excinfo.value is the exception object`, lang: 'python', static: true, title: 'pytest.raises' },
    py`\`match\` is a **regular expression** searched for (\`re.search\`) in \`str(exception)\` — so characters like \`$ . ( ) [ ? +\` have special meanings. Use \`re.escape(text)\` to match literal text ([regular expressions](lesson:regular-expressions)). The block passes only if the expected exception type (or a subclass) is raised; if nothing is raised, the test fails with \`Failed: DID NOT RAISE <class 'ValueError'>\`.`,
    py`#### One test, many cases: parametrize`,
    { code: py`import pytest


@pytest.mark.parametrize("subtotal, expected", [
    (0.00, 0.00),
    (49.99, 49.99),
    (50.00, 45.00),
    (120.00, 108.00),
])
def test_apply_discount(subtotal, expected):
    assert apply_discount(subtotal) == expected


@pytest.mark.parametrize("subtotal, expected", [
    pytest.param(49.99, 49.99, id="just-below"),
    pytest.param(50.00, 45.00, id="at-threshold"),
    pytest.param(1e9, 9e8, id="huge", marks=pytest.mark.slow),
])
def test_apply_discount_named(subtotal, expected):
    assert apply_discount(subtotal) == expected`, lang: 'python', static: true, title: 'parametrize' },
    py`- The first argument names the parameters (a comma-separated string or a list); they must match the function's arguments.
- Each row becomes a **separate test** with its own id, built from the values: \`test_apply_discount[50.0-45.0]\`. Use \`ids=[...]\` or \`pytest.param(..., id="...")\` for readable names.
- Stacking two parametrize decorators runs every **combination** (3 sizes × 2 colours = 6 tests).`,
    py`#### Markers: skip, skipif, xfail and your own`,
    { code: py`import sys
import pytest


@pytest.mark.skip(reason="gift cards are not built yet")
def test_gift_card(): ...


@pytest.mark.skipif(sys.version_info < (3, 12), reason="needs itertools.batched (3.12+)")
def test_batches(): ...


@pytest.mark.xfail(reason="rounding bug #142", strict=True)
def test_split_rounding(): ...


@pytest.mark.slow                      # custom marker: register it in the config
def test_full_catalogue_import(): ...`, lang: 'python', static: true, title: 'markers' },
    py`| marker | the test… | reported as |
|---|---|---|
| \`skip\` | never runs | \`s\` / SKIPPED |
| \`skipif(cond)\` | doesn't run when \`cond\` is true | \`s\` / SKIPPED |
| \`xfail\` | runs, failure expected | \`x\` XFAIL if it fails, \`X\` XPASS if it passes |
| \`xfail(strict=True)\` | runs, failure *required* | an unexpected pass becomes a **failure** |
| custom (\`slow\`) | runs normally; select with \`-m slow\` / \`-m "not slow"\` | normal outcome |`,
    py`#### Configuration (pyproject.toml)`,
    { code: py`[tool.pytest.ini_options]
testpaths = ["tests"]                 # where to look when you just type pytest
addopts = "-ra --strict-markers"      # always: summary of non-passes; unknown markers are errors
xfail_strict = true                   # an xfail that passes fails the run
markers = [
    "slow: tests that take more than a second",
]`, lang: 'toml', title: 'pyproject.toml' },
    { callout: 'note', title: 'Language vs tool', text: py`\`assert\` is part of the Python language. Discovery rules, rewriting, markers and parametrize are all features of the **pytest tool** — plain \`python test_pricing.py\` would just define the functions and exit. That is why the playground needs a runner.` },
  ],
  walkthrough: {
    title: 'Reading the pytest-style test file',
    lang: 'python',
    code: TEST_PRICING,
    intro: py`This is \`test_pricing.py\` in the playground. The only lines that differ from a real pytest file are the import on line 2 and the \`__main__\` block at the end.`,
    steps: [
      { lines: [2, 4], text: py`The test imports pytest (here: the simplified stand-in) and the code under test. pytest itself never needs to be told about this file — the \`test_\` prefix in its name is enough.` },
      { lines: [7, 8], text: py`A whole test in two lines: a function named \`test_…\` and a plain \`assert\`. A test passes when it finishes without raising.` },
      { lines: [11, 12], text: py`A **boundary** test: the rule is "50.00 or more", so 50.00 itself is the most important value to check.` },
      { lines: [15, 22], text: py`\`parametrize\` turns a table into four separate tests. The names in the string (\`"subtotal, expected"\`) become the function's arguments, filled in from each row.` },
      { lines: [25, 27], text: py`\`raises\` passes only if the block raises \`ValueError\` **and** its message contains a match for the regex \`"negative"\`. Keep just the one failing call inside the block.` },
      { lines: [35, 44], text: py`Parametrize also works with a single argument: then each row is just a value. Two separate tests keep the two different error messages apart.` },
      { lines: [47, 49], text: py`A skipped test is collected and reported (\`s\`) but never run — a visible reminder of unfinished work rather than a commented-out test.` },
      { lines: [52, 55], text: py`The simplified runner needs to be called explicitly. Real pytest runs discovery, rewriting and reporting for you when you type \`pytest\`.` },
    ],
  },
  playground: {
    title: 'pytest-style tests with a simplified runner',
    objective: 'Run the suite, break the discount rule to read a failure report, add parametrize rows, check an exception message, and select tests like pytest -k.',
    files: { 'test_pricing.py': TEST_PRICING, 'pricing.py': PRICING, 'mini_pytest.py': MINI_PYTEST },
    entry: 'test_pricing.py',
    expected: py`A pytest-style quiet report from the **simplified** runner:

\`\`\`text
..............s                                                         [100%]
14 passed, 1 skipped in 0.00s
\`\`\`

Fifteen tests from eight functions: parametrize expanded four of them. The time is measured live. Real \`pytest -q\` prints the same shape. The **unittest** variant (switch above the editor) runs the same checks the unittest way so you can compare.`,
    experiments: [
      {
        id: 'see-it-fail',
        task: py`Break the rule on purpose: in \`pricing.py\`, change \`if subtotal >= 50:\` to \`if subtotal > 50:\`. Run it and read the report. Which **two** tests fail, and what values does the \`E\` line show? (Put \`>=\` back afterwards.)`,
        hint: py`Look for \`FAILED test_pricing.py::...\` lines in the short summary. One is a normal test, one is a parametrized case.`,
        tests: [{ name: 'the suite now reports failures', code: py`assert results["failed"], 'Change >= to > in pricing.py and run again'` }],
        explain: py`\`test_discount_at_threshold\` and the case \`test_apply_discount[50.0-45.0]\` fail with \`assert 50.0 == 45.0\` — the report shows the actual value (no discount) next to the expected one. Real pytest adds a \`where 50.0 = apply_discount(50.0)\` line too. Notice how the parametrized case is reported **by its id**, so you know which row broke. Now change \`>\` back to \`>=\`.`,
      },
      {
        id: 'add-cases',
        task: py`Add two rows to the \`test_apply_discount\` table: one just **above** the threshold, \`(50.01, 45.01)\`, and a large order, \`(200.00, 180.00)\`. All tests must pass.`,
        hint: py`Each row is a tuple inside the list passed to \`parametrize\`, e.g. \`(50.01, 45.01),\` on its own line.`,
        tests: [
          { name: 'both new rows are in the table', code: py`rows = [tuple(row) for row in test_apply_discount.params[1]]
assert (50.01, 45.01) in rows and (200.0, 180.0) in rows, 'Add (50.01, 45.01) and (200.00, 180.00) to the parametrize list'` },
          { name: 'the whole suite passes', code: py`assert not results["failed"], f'Failing: {results["failed"]} (did you put >= back?)'` },
        ],
        explain: py`Two new lines of data, two new tests — no new functions. Testing *at*, *just below* and *just above* a boundary is the habit that catches off-by-one bugs. The ids \`[50.01-45.01]\` and \`[200.0-180.0]\` appear automatically.`,
      },
      {
        id: 'excinfo',
        task: py`Write a new test \`test_error_message_shows_what_was_typed\` that checks \`parse_quantity("lots")\` raises \`ValueError\` **and** that the text \`lots\` appears in the error message. Use \`with pytest.raises(ValueError) as excinfo:\` and then assert on \`str(excinfo.value)\` **after** the \`with\` block.`,
        hint: py`\`\`\`python
def test_error_message_shows_what_was_typed():
    with pytest.raises(ValueError) as excinfo:
        parse_quantity("lots")
    assert "lots" in str(excinfo.value)
\`\`\``,
        tests: [
          { name: 'the test exists and passes', code: py`test = ns.get("test_error_message_shows_what_was_typed")
assert callable(test), 'Define a function named test_error_message_shows_what_was_typed'
assert "test_error_message_shows_what_was_typed" in results["passed"], 'Your new test should pass on the real parse_quantity'` },
          { name: 'it fails if the message stops mentioning the input', code: py`test = ns["test_error_message_shows_what_was_typed"]
real = test.__globals__["parse_quantity"]
def vague(text):
    try:
        return real(text)
    except ValueError:
        raise ValueError("invalid quantity") from None
test.__globals__["parse_quantity"] = vague
try:
    found = module("mini_pytest").run({"test_new": test}, report=False)
finally:
    test.__globals__["parse_quantity"] = real
assert found["failed"], 'A parse_quantity with a vague message still passes your test: check "lots" is in str(excinfo.value)'` },
        ],
        explain: py`\`excinfo.value\` is the actual exception object, so you can check anything about it — its message, attributes, or its \`__cause__\`. The checker swapped in a version with a vague message and your test caught it. The assert sits *after* the \`with\` block on purpose: inside it, it would never run, because the line above raises.`,
      },
      {
        id: 'select-k',
        task: py`Imitate \`pytest -k quantity\`: change the last line to \`results = pytest.run(globals(), keyword="quantity")\` so only tests whose id contains "quantity" run. How many run? Then try \`exitfirst=True\` together with the broken \`>\` from the first experiment (like \`pytest -x\`).`,
        hint: py`Only the call on the last line changes: add \`keyword="quantity"\` as a second argument.`,
        tests: [{ name: 'only the 7 quantity tests ran', code: py`ran = results["passed"] + results["failed"] + results["skipped"]
assert ran and all("quantity" in name for name in ran), 'Pass keyword="quantity" to pytest.run'
assert len(ran) == 7` },
        ],
        explain: py`Seven tests match. Real \`-k\` is more powerful: it accepts expressions such as \`-k "quantity and not below"\`, matches case-insensitively, and real pytest reports the rest as **deselected**. \`-x\` stops at the first failure — handy when one bug breaks dozens of tests and you want the first report only.`,
      },
    ],
    variants: [
      { id: 'unittest', label: 'Same tests with unittest', files: { 'test_pricing.py': UNITTEST_VERSION, 'pricing.py': PRICING } },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What happens when you type pytest',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'cmd', label: 'pytest -q', note: 'you type', x: 90, y: 80, tone: 'yellow' },
        { id: 'config', label: 'rootdir + config', note: 'pyproject.toml, pytest.ini…', x: 290, y: 80 },
        { id: 'files', label: 'Find test files', note: 'test_*.py · *_test.py', x: 480, y: 80, tone: 'blue' },
        { id: 'rewrite', label: 'Import + rewrite asserts', note: 'AST rewrite, cached .pyc', x: 670, y: 80, tone: 'blue' },
        { id: 'items', label: 'Collect items', note: 'test_* funcs, Test* classes, parametrize rows', x: 640, y: 240, tone: 'blue' },
        { id: 'run', label: 'Run each item', note: 'setup → call → teardown', x: 400, y: 240, tone: 'ink' },
        { id: 'report', label: 'Report + exit code', note: '. F s x X · 0 = all passed', x: 150, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'cmd', to: 'config' },
        { from: 'config', to: 'files' },
        { from: 'files', to: 'rewrite' },
        { from: 'rewrite', to: 'items' },
        { from: 'items', to: 'run' },
        { from: 'run', to: 'report' },
      ],
      steps: [
        { focus: ['cmd', 'config'], edges: ['cmd->config'], text: py`pytest finds the project's **rootdir** and reads its config (\`[tool.pytest.ini_options]\` in \`pyproject.toml\`, or \`pytest.ini\`). \`addopts\` are added to your command.` },
        { focus: ['files'], edges: ['config->files'], text: py`It walks the given paths (or \`testpaths\`), skipping folders like \`.git\` and \`venv\`, and picks files named \`test_*.py\` or \`*_test.py\`.` },
        { focus: ['rewrite'], edges: ['files->rewrite'], text: py`Each test file (and \`conftest.py\`) is imported through pytest's import hook, which **rewrites every \`assert\`** so failures can report values.` },
        { focus: ['items'], edges: ['rewrite->items'], text: py`\`test*\` functions and \`Test*\` classes become **items**; each parametrize row is its own item, e.g. \`test_pricing.py::test_apply_discount[50.0-45.0]\`. \`-k\`, \`-m\` and skip markers apply here.` },
        { focus: ['run'], edges: ['items->run'], text: py`Each item runs **setup → call → teardown**. An exception in *call* is a **failure**; one in setup or teardown (usually a [fixture](lesson:fixtures)) is an **error**.` },
        { focus: ['report'], edges: ['run->report'], text: py`The report prints progress characters, failure details, a short summary and totals. The **exit code** tells CI the verdict: 0 all passed, 1 failures, 5 nothing collected.` },
      ],
    },
    alt: 'Pipeline diagram. Top row: pytest -q, then rootdir and config, then find test files matching test_*.py, then import and rewrite asserts. Bottom row, right to left: collect items including parametrize rows, run each item through setup, call and teardown, then report and exit code.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Here is what the real tool prints for the playground's tests with the \`>\` bug from the first experiment (in a file that starts with \`import pytest\`). Read it **top to bottom**: progress, one section per failure, a short summary, totals.`,
      { code: py`$ pytest -q
.F..F.........s                                                          [100%]
=================================== FAILURES ===================================
__________________________ test_discount_at_threshold __________________________

    def test_discount_at_threshold():
>       assert apply_discount(50.00) == 45.00
E       assert 50.0 == 45.0
E        +  where 50.0 = apply_discount(50.0)

test_pricing.py:11: AssertionError
________________________ test_apply_discount[50.0-45.0] ________________________

subtotal = 50.0, expected = 45.0

    @pytest.mark.parametrize("subtotal, expected", [
        (0.00, 0.00),
        (49.99, 49.99),
        (50.00, 45.00),
        (120.00, 108.00),
    ])
    def test_apply_discount(subtotal, expected):
>       assert apply_discount(subtotal) == expected
E       assert 50.0 == 45.0
E        +  where 50.0 = apply_discount(50.0)

test_pricing.py:21: AssertionError
=========================== short test summary info ============================
FAILED test_pricing.py::test_discount_at_threshold - assert 50.0 == 45.0
FAILED test_pricing.py::test_apply_discount[50.0-45.0] - assert 50.0 == 45.0
2 failed, 12 passed, 1 skipped in 0.04s`, lang: 'text', title: 'real pytest output (your timing will differ)' },
      py`- \`.\` passed, \`F\` failed, \`E\` error, \`s\` skipped, \`x\` xfailed, \`X\` xpassed.
- \`>\` marks the line that raised; \`E\` lines explain it — \`where 50.0 = apply_discount(50.0)\` is the replay.
- A parametrized failure first shows **that case's arguments** (\`subtotal = 50.0, expected = 45.0\`).
- \`test_pricing.py:11\` is the file and line to open.`,
      py`Without \`-q\` you also get a header (\`platform …\`, \`rootdir: …\`, \`collected 15 items\`); with \`-v\` one line per test (\`test_pricing.py::test_small_orders_pay_full_price PASSED [  6%]\`). The **exit code** is what CI reads: \`0\` all passed, \`1\` some failed, \`2\` interrupted, \`3\` internal error, \`4\` usage error, \`5\` no tests collected.`,
    ],
    technical: [
      py`#### Assertion rewriting`,
      py`Plain Python forgets the values once an \`assert\` fails. pytest keeps them by **changing your test code as it is imported**: an import hook on \`sys.meta_path\` parses each test module and \`conftest.py\` into an **AST** (the parsed tree of the code — see [bytecode](lesson:bytecode)), replaces every \`assert\` with code that evaluates each sub-expression **once** into temporaries and builds an explanation only on failure, then compiles it and caches the bytecode in \`__pycache__\` under a pytest-specific name.`,
      py`So: asserts in **helper modules** are *not* rewritten (bare \`AssertionError\`) unless you call \`pytest.register_assert_rewrite("tests.helpers")\` before they're imported; \`--assert=plain\` switches rewriting off; and \`assert ok, "msg"\` shows your message *plus* the introspection.`,
      py`#### Collection and outcomes`,
      py`Collection builds a tree of **nodes** — session → modules → classes → functions → parametrized items — each with a **node id** (\`path::Class::name[id]\`) used by \`-k\`, \`--lf\` and the command line. Parametrize works through a hook (\`pytest_generate_tests\` with a \`Metafunc\`) that multiplies one function into many items. Unlike unittest, pytest calls *any* exception during the test body a **failure**, reserving **error** for setup/teardown problems.`,
      { callout: 'note', title: 'Tool defaults, not language rules', text: py`\`test_*.py\`, \`test*\` and \`Test*\` are pytest *defaults* (\`python_files\`, \`python_functions\`, \`python_classes\`). pytest runs tests in file order (unittest sorts them by name) — but good tests never depend on order.` },
    ],
    production: [
      py`- **Configure once** in \`pyproject.toml\`: \`testpaths\`, \`addopts = "-ra --strict-markers"\`, registered \`markers\`, \`xfail_strict = true\`.
- **Layout:** with code in \`src/your_package/\` and tests in \`tests/\` ([project structure](lesson:project-structure), [packaging](lesson:packaging)), install the package in editable mode (\`pip install -e .\`) or set \`pythonpath = ["src"]\`.
- **Fast feedback:** \`pytest -x --lf\` while fixing; \`--durations=10\` lists the slowest tests; run \`-m "not slow"\` locally and everything in CI.
- **Plugins:** \`pytest-cov\` ([coverage](lesson:tdd)), \`pytest-xdist\` (\`-n auto\`, parallel processes), \`pytest-randomly\` (shuffled order exposes hidden dependencies), \`pytest-mock\` ([mocking](lesson:mocking)).
- **xfail and skip are debt:** give each a reason and an issue number; strict xfail forces removal once fixed.`,
    ],
  },
  mistakes: [
    {
      title: 'Naming test files so pytest can’t find them',
      wrong: { code: py`# cart_tests.py   <- matches neither test_*.py nor *_test.py
def test_empty_cart_total_is_zero():
    assert cart_total([]) == 0`, lang: 'python', static: true },
      right: { code: py`# test_cart.py
def test_empty_cart_total_is_zero():
    assert cart_total([]) == 0`, lang: 'python', static: true },
      explanation: py`pytest silently ignores non-matching files, so these tests never run — and "no failures" looks like success. \`pytest --collect-only -q\` lists what was collected.`,
    },
    {
      title: 'Putting an assert after the raising call inside pytest.raises',
      wrong: { code: py`def test_rejects_zero():
    with pytest.raises(ValueError) as excinfo:
        parse_quantity("0")
        assert "at least 1" in str(excinfo.value)   # never runs`, lang: 'python', static: true },
      right: { code: py`def test_rejects_zero():
    with pytest.raises(ValueError) as excinfo:
        parse_quantity("0")
    assert "at least 1" in str(excinfo.value)`, lang: 'python', static: true },
      explanation: py`Once \`parse_quantity("0")\` raises, the rest of the \`with\` block is skipped — the assert is dead code. Dedent checks out of the block, or use \`match=\`.`,
    },
    {
      title: 'Forgetting that match is a regular expression',
      wrong: { code: py`def test_low_price_message():
    with pytest.raises(ValueError, match="$4.50 (minimum $5.00)"):
        check_price(4.50)`, lang: 'python', static: true },
      right: { code: py`import re


def test_low_price_message():
    with pytest.raises(ValueError, match=re.escape("$4.50 (minimum $5.00)")):
        check_price(4.50)`, lang: 'python', static: true },
      explanation: py`\`$\` means "end of text" and \`( )\` form a group, so the pattern can't match the literal message. \`re.escape()\` makes every character literal; a short pattern (\`match="minimum"\`) is less brittle anyway.`,
    },
    {
      title: 'Copy-pasting tests (or looping) instead of parametrizing',
      wrong: { code: py`def test_discount_49_99():
    assert apply_discount(49.99) == 49.99

def test_all_discounts():
    for subtotal, expected in [(50.00, 45.00), (120.00, 108.00)]:
        assert apply_discount(subtotal) == expected   # first failure hides the rest`, lang: 'python', static: true },
      right: { code: py`@pytest.mark.parametrize("subtotal, expected", [
    (49.99, 49.99),
    (50.00, 45.00),
    (120.00, 108.00),
])
def test_apply_discount(subtotal, expected):
    assert apply_discount(subtotal) == expected`, lang: 'python', static: true },
      explanation: py`Copies drift apart, and a loop is *one* test that stops at the first bad case. A parametrize table is scannable, one line per new case, and reports every row separately.`,
    },
    {
      title: 'Returning a value instead of asserting it',
      wrong: { code: py`def test_discount():
    return apply_discount(50.00) == 45.00`, lang: 'python', static: true },
      right: { code: py`def test_discount():
    assert apply_discount(50.00) == 45.00`, lang: 'python', static: true },
      explanation: py`A test's return value is not a check — returning \`False\` fails nothing. pytest flags non-\`None\` returns (a \`PytestReturnNotNoneWarning\`, a failure in recent versions), but the fix is simply to \`assert\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`no tests ran in 0.01s   (exit code 5)`,
      cause: py`Nothing was collected: file or function names don't match, wrong folder, or \`testpaths\` points elsewhere.`,
      fix: py`Run \`pytest --collect-only -q\` to see what pytest finds; rename, or pass the path explicitly.`,
    },
    {
      symptom: py`ModuleNotFoundError: No module named 'pricing'`,
      cause: py`The code under test isn't importable from where pytest runs — common with a \`src/\` layout or a separate \`tests/\` folder.`,
      fix: py`\`pip install -e .\`, or \`pythonpath = ["src"]\` in the pytest config, or run \`python -m pytest\` from the project root (it adds the current folder to \`sys.path\`).`,
    },
    {
      symptom: py`fixture 'subtotal' not found`,
      cause: py`pytest treats every test argument as a **fixture** name. An argument that parametrize doesn't supply (typo, forgotten decorator) is looked up as a fixture and fails at setup — an **error**.`,
      fix: py`Make the parametrize names match the parameters exactly: \`"subtotal, expected"\` ↔ \`def test_x(subtotal, expected)\`.`,
    },
    {
      symptom: py`Failed: DID NOT RAISE <class 'ValueError'>`,
      cause: py`The block inside \`pytest.raises(ValueError)\` finished without raising — missing validation, or the wrong call is inside the block.`,
      fix: py`Check the input really is invalid for the code under test and that the raising call is the one inside the \`with\`.`,
    },
    {
      symptom: py`PytestUnknownMarkWarning: Unknown pytest.mark.slwo - is this a typo?`,
      cause: py`An unregistered custom marker — here a typo of \`slow\`, so \`-m "not slow"\` won't deselect the test.`,
      fix: py`Register markers in \`pyproject.toml\` and add \`--strict-markers\` to \`addopts\` so typos become errors.`,
    },
  ],
  bestPractices: [
    'Name files test_*.py and functions test_<behaviour>, so a failing name tells you what broke.',
    'Use plain assert with the simplest expression; let pytest explain failures.',
    'Keep exactly one call inside pytest.raises; check the message with match= (re.escape literal text) or excinfo.value after the block.',
    'Parametrize instead of copy-pasting or looping; add ids for non-obvious rows.',
    'Compare floats with pytest.approx, never ==.',
    'Register custom markers, run with --strict-markers, and give every skip/xfail a reason.',
  ],
  useCases: [
    'Table-driven unit tests for pure functions: pricing, parsing, validation.',
    'Checking error handling with pytest.raises and message matching.',
    'Running an existing unittest suite under pytest while migrating gradually.',
    'Fast tests on every push, -m slow nightly; xfail(strict=True) for a tracked bug.',
  ],
  comparison: {
    title: 'unittest vs pytest',
    headers: ['', 'unittest (standard library)', 'pytest (third-party)'],
    rows: [
      ['a test is…', 'a test* method on a unittest.TestCase subclass', 'any test* function (or method of a Test* class)'],
      ['checking', 'self.assertEqual, assertIn, assertTrue…', 'plain assert, with rewritten failure messages'],
      ['exceptions', 'self.assertRaises / assertRaisesRegex', 'pytest.raises(Exc, match=...)'],
      ['many cases', 'loop + self.subTest', '@pytest.mark.parametrize — one item per row'],
      ['setup', 'setUp / tearDown methods', 'fixtures, injected by argument name'],
      ['skip / expected failure', '@unittest.skip, skipIf, expectedFailure', '@pytest.mark.skip, skipif, xfail(strict=...)'],
      ['install', 'built in', 'pip install pytest'],
    ],
    note: py`pytest runs unittest-style tests as they are, so you can mix both while migrating. Switch the playground to the **unittest** variant to compare the same suite side by side.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'pytest-basics-q1',
      type: 'mcq',
      prompt: py`A project contains two files. With default settings, which tests does \`pytest\` run?

- \`test_cart.py\`: a function \`test_total\`, a function \`check_discount\`, and a class \`TestCheckout\` that has an \`__init__\` method and a method \`test_pay\`
- \`cart_tests.py\`: a function \`test_empty\``,
      options: [
        { text: 'test_total and test_empty', why: 'cart_tests.py matches neither test_*.py nor *_test.py, so the file is never collected.' },
        { text: 'test_total and TestCheckout.test_pay', why: 'pytest cannot collect a test class with an __init__ constructor; it skips the class with a PytestCollectionWarning.' },
        'test_total only',
        { text: 'All four functions', why: 'check_discount does not start with test, and the other two are excluded by the file and class rules.' },
      ],
      answer: 2,
      explanation: py`Only \`test_cart.py\` matches the file pattern; inside it only \`test_total\` qualifies. \`check_discount\` lacks the prefix and \`TestCheckout\` has an \`__init__\`. Run \`pytest --collect-only -q\` to check what's collected.`,
    },
    {
      id: 'pytest-basics-q2',
      type: 'output',
      prompt: py`\`pytest.raises(match=...)\` uses \`re.search(pattern, str(exception))\`. What does this print?`,
      code: py`import re

message = "price too low: $4.50 (minimum is $5.00)"
print(bool(re.search("minimum", message)))
print(bool(re.search("$4.50", message)))
print(bool(re.search(re.escape("$4.50"), message)))`,
      answer: 'True\nFalse\nTrue',
      accept: ['True\nFalse\nTrue'],
      explanation: py`"minimum" is plain text and is found. In \`"$4.50"\`, \`$\` is an anchor meaning "end of the string", so nothing can follow it and the search fails. \`re.escape\` puts a backslash in front of \`$\` and \`.\`, so the text matches literally. So \`match="$4.50"\` would make a correct test fail.`,
    },
    {
      id: 'pytest-basics-q3',
      type: 'bug',
      prompt: 'This test passes, yet it would also pass if the error message were completely wrong. Click the line that never runs.',
      code: py`def test_zero_quantity_is_rejected():
    with pytest.raises(ValueError) as excinfo:
        parse_quantity("0")
        assert "at least 1" in str(excinfo.value)`,
      answerLine: 4,
      explanation: py`\`parse_quantity("0")\` raises, so execution jumps straight to the end of the \`with\` block — line 4 is skipped every time. Dedent it so it runs after the block, or use \`pytest.raises(ValueError, match="at least 1")\`.`,
    },
    {
      id: 'pytest-basics-q4',
      type: 'fill',
      prompt: 'Complete the tests: run the first one for each row, and check that "0" raises ValueError with a message containing "at least 1".',
      code: py`import pytest

@pytest.mark.___("text, expected", [("3", 3), (" 12 ", 12)])
def test_parse_quantity(text, expected):
    assert parse_quantity(text) == expected

def test_rejects_zero():
    with pytest.___(ValueError, ___="at least 1"):
        parse_quantity("0")`,
      answer: [['parametrize'], ['raises'], ['match']],
      explanation: py`\`@pytest.mark.parametrize\` creates one test per row; \`pytest.raises(ValueError, match="at least 1")\` requires the exception and searches its message with the regex.`,
    },
    {
      id: 'pytest-basics-q5',
      type: 'mcq',
      prompt: py`Using the playground's test names, which tests does \`pytest -k "quantity and not below"\` select?`,
      options: [
        { text: 'Only the two test_parse_quantity cases', why: 'test_parse_quantity_rejects_non_numbers also contains "quantity" and not "below".' },
        'The 2 test_parse_quantity cases and the 3 test_parse_quantity_rejects_non_numbers cases',
        { text: 'All 7 tests with "quantity" in the name', why: '"and not below" removes test_parse_quantity_rejects_values_below_one.' },
        { text: 'None — -k needs an exact test name', why: '-k matches substrings of test names (case-insensitively) and combines them with and / or / not.' },
      ],
      answer: 1,
      explanation: py`\`-k\` evaluates the expression against each test's name: it must contain "quantity" and must not contain "below". Five items match; the rest are reported as **deselected**.`,
    },
    {
      id: 'pytest-basics-q6',
      type: 'mcq',
      prompt: py`A test marked \`@pytest.mark.xfail(reason="bug #142", strict=True)\` starts passing after a teammate's fix. What happens?`,
      options: [
        { text: 'It is reported as XPASS and the run stays green', why: 'That is the non-strict default. strict=True changes it.' },
        'The run fails: with strict=True an unexpected pass counts as a failure',
        { text: 'It is reported as a normal PASSED test', why: 'pytest knows the test was expected to fail and reports that it did not.' },
        { text: 'It is skipped from now on', why: 'xfail tests always run; only skip markers prevent running.' },
      ],
      answer: 1,
      explanation: py`Strict xfail forces you to notice the fix and remove the marker, so the test becomes a real regression test. Set \`xfail_strict = true\` in the config to make it the default.`,
    },
    {
      id: 'pytest-basics-q7',
      type: 'short',
      prompt: py`Plain Python's \`assert a == b\` only raises a bare \`AssertionError\`. How can pytest show \`assert 50.0 == 45.0\` and \`where 50.0 = apply_discount(50.0)\`?`,
      answer: py`Assertion rewriting. pytest imports test modules (and conftest.py) through its own import hook, which parses the source into an AST and replaces each assert with code that evaluates and stores every sub-expression once, checks the condition, and on failure builds a message from the stored values. The rewritten bytecode is cached. Nothing is re-run, and modules that are not test modules are not rewritten unless registered with pytest.register_assert_rewrite.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'shipping-table',
      title: 'Turn copy-paste into a parametrized table',
      difficulty: 'intermediate',
      prompt: py`\`shipping_cost(weight_kg)\` is **correct**: up to 2 kg costs 3.50, up to 10 kg 7.00, up to 30 kg 15.00; weights of 0 or less, and anything over 30 kg, raise \`ValueError\`. Three copy-pasted tests check one weight per band. Replace them with two parametrized tests (the file uses the playground's simplified \`mini_pytest\`, imported as \`pytest\`, which supports \`@pytest.mark.parametrize\` and \`pytest.raises\`):

1. \`test_shipping_cost(weight_kg, expected)\` — parametrized with \`"weight_kg, expected"\`;
2. \`test_invalid_weights_are_rejected(weight_kg)\` — parametrized with \`"weight_kg"\`, using \`with pytest.raises(ValueError):\`.

The checker runs your tests against the real function (**all must pass**) and against broken versions — **each must make at least one test fail**:

- charges exactly **2 kg** as 7.00; charges **10 kg** as 15.00; **rejects 30 kg**;
- extends the cheapest band up to **3 kg** (so something between 2 and 3 kg costs 3.50);
- **accepts 0 kg** (returns 3.50); **accepts parcels over 30 kg** (returns 15.00).`,
      files: { 'main.py': SHIPPING_STARTER, 'mini_pytest.py': MINI_PYTEST },
      hints: [
        'Bugs live at the edges. For every boundary (2, 10, 30) test the value exactly on it, and test one value just above 2.',
        'The valid table needs rows like (2, 3.50), (2.5, 7.00), (10, 7.00), (30, 15.00). The invalid list needs 0, a negative number and something above 30.',
        '@pytest.mark.parametrize("weight_kg", [0, -1, 30.5])\ndef test_invalid_weights_are_rejected(weight_kg):\n    with pytest.raises(ValueError):\n        shipping_cost(weight_kg)',
      ],
      solution: {
        explanation: py`The two tables pin every edge of the specification: each boundary value exactly (2, 10, 30), a value just past the first boundary (2.5), and the invalid region on both sides (0, -1, 30.5). Each row is reported as its own test, so a failure names the exact weight. The original three tests used only "comfortable" middle values, so every broken version above would have passed them — the checker's mutants are exactly the off-by-one and moved-boundary bugs real code gets. That is how **mutation testing** judges a suite (see [TDD & coverage](lesson:tdd)).`,
        files: { 'main.py': SHIPPING_SOLUTION, 'mini_pytest.py': MINI_PYTEST },
      },
      tests: [
        { name: 'test_shipping_cost is parametrized with weight_kg, expected', code: py`test = ns.get("test_shipping_cost")
assert callable(test), 'Define test_shipping_cost(weight_kg, expected)'
assert getattr(test, "params", None), 'Decorate it with @pytest.mark.parametrize("weight_kg, expected", [...])'
assert test.params[0] == ["weight_kg", "expected"]` },
        { name: 'test_invalid_weights_are_rejected is parametrized with weight_kg', code: py`test = ns.get("test_invalid_weights_are_rejected")
assert callable(test), 'Define test_invalid_weights_are_rejected(weight_kg)'
assert getattr(test, "params", None) and test.params[0] == ["weight_kg"], 'Decorate it with @pytest.mark.parametrize("weight_kg", [...])'` },
        { name: 'all your tests pass on the correct shipping_cost', code: SHIPPING_CHECK + py`
assert suite_passes_with(real), 'Some of your tests fail on the CORRECT function — check the expected prices'` },
        { name: 'catches 2 kg charged as 7.00', code: SHIPPING_CHECK + py`
assert not suite_passes_with(lambda w: 7.00 if w == 2 else real(w)), 'Test exactly 2 kg (it costs 3.50)'` },
        { name: 'catches 10 kg charged as 15.00', code: SHIPPING_CHECK + py`
assert not suite_passes_with(lambda w: 15.00 if w == 10 else real(w)), 'Test exactly 10 kg (it costs 7.00)'` },
        { name: 'catches 30 kg being rejected', code: SHIPPING_CHECK + py`
def rejects_30(w):
    if w == 30:
        raise ValueError("too heavy")
    return real(w)
assert not suite_passes_with(rejects_30), 'Test exactly 30 kg (it costs 15.00)'` },
        { name: 'catches the cheap band extended to 3 kg', code: SHIPPING_CHECK + py`
assert not suite_passes_with(lambda w: 3.50 if 2 < w <= 3 else real(w)), 'Test a weight just above 2 kg (for example 2.5 costs 7.00)'` },
        { name: 'catches 0 kg being accepted', code: SHIPPING_CHECK + py`
assert not suite_passes_with(lambda w: 3.50 if w <= 0 else real(w)), 'Add 0 (and a negative weight) to the invalid list'` },
        { name: 'catches parcels over 30 kg being accepted', code: SHIPPING_CHECK + py`
assert not suite_passes_with(lambda w: 15.00 if w > 30 else real(w)), 'Add a weight above 30 kg to the invalid list'` },
      ],
    },
    {
      id: 'build-must-raise',
      title: 'Build your own pytest.raises',
      difficulty: 'intermediate',
      prompt: py`Finish \`MustRaise\`, a simplified \`pytest.raises\`, by writing its \`__exit__(self, exc_type, exc, tb)\` method. Python calls \`__exit__\` when the \`with\` block ends: \`exc_type\` is \`None\` if nothing was raised; returning \`True\` swallows the exception, returning \`False\` lets it continue (see [context managers](lesson:context-managers)).

Rules:

1. Nothing raised → raise \`AssertionError\` whose message contains \`DID NOT RAISE ValueError\` (use the expected class's \`__name__\`).
2. The expected type **or a subclass** was raised → store the exception in \`self.value\` and swallow it.
3. A different exception type → let it propagate unchanged.
4. If \`match\` is given and \`re.search(self.match, str(exc))\` finds nothing → raise \`AssertionError\` whose message contains the pattern.

When it works, the program prints \`caught: quantity must be at least 1, got 0\`.`,
      files: { 'main.py': RAISES_STARTER },
      hints: [
        'Handle the four cases in order: exc_type is None; not issubclass(exc_type, self.expected); a failed match; success.',
        'issubclass(exc_type, self.expected) accepts subclasses too. Returning False (or None) re-raises the original exception automatically.',
        'if exc_type is None: raise AssertionError(f"DID NOT RAISE {self.expected.__name__}")\nif not issubclass(exc_type, self.expected): return False\n…then check the match, set self.value = exc and return True.',
      ],
      solution: {
        explanation: py`\`__exit__\` sees how the block ended. No exception means the code under test didn't raise, so we raise \`AssertionError\` ourselves — that's how a test *fails*. A non-matching type returns \`False\` so the real error propagates and is reported honestly instead of being hidden. A matching type is stored on \`self\` (which \`__enter__\` returned, so \`as info\` sees it) and swallowed with \`return True\`. Real \`pytest.raises\` works the same way, returning an \`ExceptionInfo\` object with \`.value\`, \`.type\` and \`.match()\`.`,
        files: { 'main.py': RAISES_SOLUTION },
      },
      tests: [
        { name: 'prints the caught exception', code: py`assert "caught: quantity must be at least 1, got 0" in output` },
        { name: 'stores the expected exception and swallows it', code: py`with MustRaise(ValueError) as info:
    int("abc")
assert isinstance(info.value, ValueError)` },
        { name: 'accepts subclasses of the expected type', code: py`with MustRaise(LookupError) as info:
    {}["missing"]
assert isinstance(info.value, KeyError)` },
        { name: 'fails with DID NOT RAISE when nothing is raised', code: py`try:
    with MustRaise(ValueError):
        pass
except AssertionError as error:
    assert "DID NOT RAISE ValueError" in str(error)
else:
    raise AssertionError("MustRaise must raise AssertionError when the block raises nothing")` },
        { name: 'lets other exception types propagate', code: py`try:
    with MustRaise(ValueError):
        1 / 0
except ZeroDivisionError:
    pass
else:
    raise AssertionError("A ZeroDivisionError must escape from MustRaise(ValueError)")` },
        { name: 'a non-matching message fails and mentions the pattern', code: py`try:
    with MustRaise(ValueError, match="negative"):
        raise ValueError("quantity must be at least 1")
except AssertionError as error:
    assert "negative" in str(error)
else:
    raise AssertionError("A message that does not match must raise AssertionError")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'pytest-basics-discovery',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How does pytest decide what is a test? A teammate says their new tests "pass" but CI shows the test count didn’t change — what would you check?',
      answer: 'By default: files test_*.py or *_test.py under the given paths/testpaths; in them, functions starting with test and test* methods of Test* classes without __init__; plus unittest.TestCase subclasses. Check the names, a Test class with __init__, the testpaths/pattern config, and run pytest --collect-only -q.',
      explanation: py`Non-matching files are silently ignored, and a \`Test*\` class with \`__init__\` is skipped with only a warning. The patterns are configurable (\`python_files\`, \`python_classes\`, \`python_functions\`), so check the project's config too.`,
      whyAsked: '"Tests that never run" is a real and dangerous failure mode.',
      mistakes: ['Assuming every file in tests/ is collected', 'Not knowing about --collect-only'],
      followUps: ['What is a node id?', 'What does exit code 5 mean?', 'How do you stop pytest collecting a helper class called TestData? (__test__ = False)'],
      modelAnswer: 'pytest collects files named test_*.py or *_test.py from the paths I give it or the configured testpaths. Inside them it takes functions starting with test, and test methods of classes starting with Test that have no __init__; it also runs unittest.TestCase classes. Everything else is silently ignored. So I would check the file name, the function prefix, whether the class has an __init__ — which only produces a warning — and the config. pytest --collect-only -q shows exactly what was found.',
    },
    {
      id: 'pytest-basics-assertion-rewriting',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does pytest’s assertion rewriting work, and why does a failing assert inside a helper module show only a bare AssertionError?',
      answer: 'pytest installs an import hook; when it imports test modules and conftest.py it parses them to an AST, rewrites each assert to store intermediate values and build an explanation on failure, then compiles and caches the bytecode. Helper modules are ordinary imports, so their asserts are not rewritten unless registered with pytest.register_assert_rewrite before import.',
      explanation: py`Each sub-expression is evaluated once (no re-running, no extra side effects) and the message is only formatted on failure. \`--assert=plain\` disables rewriting.`,
      code: { lang: 'python', code: py`# tests/conftest.py
import pytest

pytest.register_assert_rewrite("tests.helpers")   # before tests.helpers is imported` },
      whyAsked: 'Senior candidates should understand their tools well enough to explain surprising behaviour.',
      mistakes: ['Claiming pytest re-runs the failing expression', 'Not knowing the rewrite happens at import time'],
      followUps: ['Why can rewriting miss a module imported before pytest starts?', 'How does pytest show list or dict diffs?'],
      modelAnswer: 'Before importing test modules, pytest installs an import hook. When a test module or conftest.py is imported, the hook parses the source into an abstract syntax tree and replaces every assert with code that evaluates each sub-expression once, keeps the values, and only if the condition is false builds a message like "assert 50.0 == 45.0, where 50.0 = apply_discount(50.0)". The new tree is compiled and cached. A helper module is imported normally, so its asserts are plain Python asserts. The fix is pytest.register_assert_rewrite for that module, called before it is first imported — usually in conftest.py.',
    },
    {
      id: 'pytest-basics-regex-match',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This test fails even though check_price(4.50) raises ValueError("price too low: $4.50 (minimum is $5.00)"). Why?',
      code: { lang: 'python', code: py`def test_low_price():
    with pytest.raises(ValueError, match="$4.50 (minimum is $5.00)"):
        check_price(4.50)` },
      options: ['pytest.raises cannot check messages', 'match is a regular expression: $ and ( ) are special characters, so the literal text does not match', 'The message must match from the start of the string', 'Floats in messages are rounded'],
      correctOption: 1,
      answer: 'match is a regex used with re.search. $ is an end-of-string anchor and ( ) is a group, so the pattern cannot match the literal message. Use re.escape(...) or a short distinctive pattern like match="minimum".',
      explanation: py`\`re.search\` (not \`fullmatch\`) is used, so a substring is enough — that's why short patterns work well. Characters such as \`. $ ^ * + ? ( ) [ ] { } |\` (and the backslash) need escaping.`,
      whyAsked: 'A very common real-world gotcha that tests both pytest and regex knowledge.',
      mistakes: ['Thinking match is a plain substring check', 'Fixing it by deleting the match'],
      followUps: ['How would you assert the full message exactly?', 'What does excinfo.value give you?'],
      modelAnswer: 'The match argument is a regular expression that pytest searches for in str() of the exception. Here the dollar signs are end-of-string anchors and the parentheses form a group, so it can never match the literal text and the test fails with a "Regex pattern did not match" error. I would wrap the text in re.escape, or better, match a short distinctive fragment such as "minimum". If I need the exact message, I use pytest.raises as excinfo and compare str(excinfo.value) after the block.',
    },
    {
      id: 'pytest-basics-markers-ci',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Your suite has a few slow tests, some Windows-only tests, and one test that fails because of a known bug. Developers have stopped running the suite locally. How would you organise this with pytest?',
      answer: 'Mark slow tests with a registered @pytest.mark.slow and run -m "not slow" locally, everything in CI; skipif(sys.platform != "win32", reason=...) for platform tests; xfail(reason="issue #…", strict=True) for the known bug; --strict-markers and -ra in addopts so typos are errors and skips stay visible.',
      explanation: py`Markers turn one suite into several views. Strict xfail makes sure the marker is removed once the bug is fixed. Also ask *why* tests are slow — often a real network or database call that belongs in an integration tier or could use a [test double](lesson:mocking).`,
      whyAsked: 'Tests team-level judgement: keeping a suite fast and trusted.',
      mistakes: ['Deleting or commenting out slow tests', 'Using skip for a known bug (it hides the fix)', 'Unregistered markers that silently do nothing'],
      followUps: ['skip vs xfail?', 'How would you run tests in parallel?'],
      modelAnswer: 'I would make the fast path the default. Slow tests get a registered slow marker, so developers run pytest -m "not slow" while CI runs everything. Windows-only tests use skipif on sys.platform with a clear reason. The known bug gets xfail with the issue number and strict=True, so the run turns red once it is fixed and the marker gets removed. In pyproject I would add --strict-markers and -ra to addopts. Then I would look at why the slow tests are slow — often they hit real services and belong in a separate integration tier.',
    },
    {
      id: 'pytest-basics-expand-parametrize',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `expand_parametrize(test_name, argnames, rows)` that returns a list of `(test_id, kwargs)` pairs the way pytest expands a parametrize table. `argnames` is a comma-separated string. With one name each row is a single value, otherwise a tuple. The id is `test_name[v1-v2]` from `str()` of each value. Raise `ValueError` if a row has the wrong number of values.',
      answer: 'Split and strip the names; wrap single values in a 1-tuple; check the length; id = f"{test_name}[{"-".join(map(str, values))}]"; kwargs = dict(zip(names, values)).',
      explanation: py`This mirrors collection: each row becomes a separate item with its own id and arguments. Real pytest also escapes non-ASCII in ids, falls back to \`argname + index\` for complex objects, supports \`ids=\`/\`pytest.param\`, and reports a wrong row length as a collection error.`,
      starter: { files: { 'main.py': py`def expand_parametrize(test_name, argnames, rows):
    """Return [(test_id, kwargs), ...] like pytest's parametrize."""
    # TODO
    return []


for case in expand_parametrize("test_discount", "subtotal, expected", [(50.0, 45.0), (20, 20)]):
    print(case)
` } },
      tests: [
        { name: 'two argnames', code: py`assert expand_parametrize("test_discount", "subtotal, expected", [(50.0, 45.0), (20, 20)]) == [
    ("test_discount[50.0-45.0]", {"subtotal": 50.0, "expected": 45.0}),
    ("test_discount[20-20]", {"subtotal": 20, "expected": 20}),
]` },
        { name: 'one argname: rows are single values', code: py`assert expand_parametrize("test_q", "text", ["0", "-1"]) == [("test_q[0]", {"text": "0"}), ("test_q[-1]", {"text": "-1"})]` },
        { name: 'a row with the wrong length raises ValueError', code: py`with raises(ValueError):
    expand_parametrize("test_x", "a, b", [(1, 2, 3)])` },
      ],
      solution: { files: { 'main.py': py`def expand_parametrize(test_name, argnames, rows):
    """Return [(test_id, kwargs), ...] like pytest's parametrize."""
    names = [name.strip() for name in argnames.split(",")]
    cases = []
    for row in rows:
        values = (row,) if len(names) == 1 else tuple(row)
        if len(values) != len(names):
            raise ValueError(f"{test_name}: {len(names)} names but {len(values)} values in {row!r}")
        case_id = "-".join(str(value) for value in values)
        cases.append((f"{test_name}[{case_id}]", dict(zip(names, values))))
    return cases


for case in expand_parametrize("test_discount", "subtotal, expected", [(50.0, 45.0), (20, 20)]):
    print(case)
` } },
      hints: ['names = [n.strip() for n in argnames.split(",")]', 'With one name, wrap each row: (row,). Then zip names with values.'],
      whyAsked: 'Shows you understand what parametrize generates (separate items with ids), not just its syntax.',
      mistakes: ['Treating a single string row as a tuple (splitting it into characters)', 'Forgetting to strip spaces from names', 'Not validating row length'],
      followUps: ['How would you support stacked decorators? (itertools.product of the expansions)', 'How would you support ids=?'],
      modelAnswer: 'I split the argnames string on commas and strip each name. For every row, if there is one name I wrap it in a one-element tuple, otherwise I convert it to a tuple, and a length mismatch raises ValueError. The id is the test name plus the values joined with dashes in square brackets, and the keyword arguments are dict(zip(names, values)). That is what pytest does at collection: one item per row, each passing or failing independently. Stacked decorators would be the product of the expansions — three sizes times two colours gives six items.',
    },
  ],

  takeaways: [
    'pytest discovers tests by name: files test_*.py or *_test.py, functions test_*, classes Test* without __init__ — and it runs unittest tests too.',
    'A pytest test is a plain function with a plain assert; assertion rewriting (done at import time) shows the values and calls behind a failure.',
    'pytest.raises(Exc, match=...) checks exceptions; match is a regex searched in the message — re.escape literal text, and keep one call in the block.',
    '@pytest.mark.parametrize turns one test into one item per row, each with its own id; stacked decorators give every combination.',
    'Markers: skip, skipif, xfail (strict=True for tracked bugs), and registered custom markers selected with -m.',
    'Daily commands: pytest -q, -v, -k EXPR, -x, --lf; read failures top to bottom: > line, E lines, file:line, short summary.',
    'Exit code 0 means all passed; anything else makes CI red (1 failures, 5 nothing collected).',
  ],
}
