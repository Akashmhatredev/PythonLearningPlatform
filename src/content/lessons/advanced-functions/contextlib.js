// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const REPORT = py`import io
from contextlib import ExitStack, contextmanager, redirect_stdout, suppress


@contextmanager
def section(title):
    """Print a header, run the block, then a footer — even if the block fails."""
    print(f"== {title} ==")
    try:
        yield title.upper()
    finally:
        print(f"== end {title} ==")


def noisy_total(numbers):
    for n in numbers:
        print("debug: adding", n)      # chatty code we can't edit
    return sum(numbers)


REGIONS = ["north", "south", "east", "west"]   # there is no west.csv

with section("open files"):
    with ExitStack() as stack:
        files = {}
        for region in REGIONS:
            with suppress(FileNotFoundError):
                files[region] = stack.enter_context(open(f"{region}.csv"))
        print("opened:", list(files))
        sales = {region: [int(line) for line in f] for region, f in files.items()}
    print("all closed:", all(f.closed for f in files.values()))

with section("totals") as heading:
    captured = io.StringIO()
    with redirect_stdout(captured):
        totals = {region: noisy_total(nums) for region, nums in sales.items()}
    print(heading, totals)
    print("debug lines hidden:", captured.getvalue().count("\n"))
`

export default {
  id: 'contextlib',
  title: 'contextlib: @contextmanager, ExitStack & friends',
  summary: 'The contextlib module turns a generator with one yield into a context manager and supplies ready-made managers — suppress, redirect_stdout, closing, nullcontext, chdir — plus ExitStack for juggling any number of resources.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['context-managers', 'generators'],
  related: ['context-managers', 'generators', 'advanced-generators', 'decorators', 'reading-writing-files', 'pathlib', 'try-except', 'error-handling-patterns', 'asyncio-in-practice', 'asyncio-basics', 'mocking', 'abstract-base-classes', 'sql-and-sqlite', 'threading'],
  tags: ['contextlib', '@contextmanager', 'generator', 'yield', 'try/finally', 'ExitStack', 'suppress', 'redirect_stdout', 'closing', 'nullcontext', 'chdir', 'AbstractContextManager', 'asynccontextmanager', 'async with', 'atomic write'],
  apis: [
    { name: '@contextlib.contextmanager', summary: 'Decorates a generator function that yields once: code before yield = enter, the yielded value = "as" target, code after = exit.' },
    { name: 'contextlib.ExitStack()', summary: 'A manager that holds a stack of other managers and callbacks and unwinds them all, in reverse order, on exit.' },
    { name: 'ExitStack.enter_context(cm)', summary: 'Enters cm, schedules its __exit__, and returns what its __enter__ returned.' },
    { name: 'ExitStack.callback(fn, *args)', summary: 'Schedules fn(*args) to run when the stack unwinds.' },
    { name: 'ExitStack.pop_all()', summary: 'Moves every scheduled cleanup to a new ExitStack, so the current with block exits without running them.' },
    { name: 'contextlib.suppress(*exceptions)', summary: 'Silently ignores the listed exception types raised in the block.' },
    { name: 'contextlib.redirect_stdout(target)', summary: 'Temporarily points sys.stdout at another file-like object (redirect_stderr too).' },
    { name: 'contextlib.closing(thing)', summary: 'Calls thing.close() on exit — for objects with close() but no context manager support.' },
    { name: 'contextlib.nullcontext(enter_result=None)', summary: 'A do-nothing manager: a stand-in when a manager is optional.' },
    { name: 'contextlib.chdir(path)', summary: 'Temporarily changes the current working directory (3.11+).' },
    { name: 'contextlib.AbstractContextManager', summary: 'ABC with a default __enter__ (returns self) and an abstract __exit__.' },
    { name: '@contextlib.asynccontextmanager', summary: 'The async version: an async generator becomes an async context manager for "async with".' },
  ],
  docs: [
    { label: 'contextlib — utilities for with-statement contexts', url: 'https://docs.python.org/3/library/contextlib.html' },
    { label: 'contextlib — ExitStack examples and recipes', url: 'https://docs.python.org/3/library/contextlib.html#examples-and-recipes' },
    { label: 'PEP 343 — the "with" statement', url: 'https://peps.python.org/pep-0343/' },
    { label: 'Language reference — async with', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-async-with-statement' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Writing a class with \`__enter__\` and \`__exit__\` (see [context managers](lesson:context-managers)) is fine for big, stateful managers — but for "do this before, that after" it's a lot of ceremony. The standard library module **\`contextlib\`** fixes that, and adds tools for the awkward cases.`,
    py`The star is **\`@contextmanager\`**. Write a [generator](lesson:generators) function that \`yield\`s exactly once: everything before the \`yield\` is setup, the yielded value is what \`as\` receives, and everything after is cleanup.`,
    { code: py`from contextlib import contextmanager


@contextmanager
def section(title):
    print(f"== {title} ==")          # setup (like __enter__)
    try:
        yield                         # the with-block runs here
    finally:
        print(f"== end {title} ==")  # cleanup (like __exit__), even on errors


with section("totals"):
    print("north: 200")`, lang: 'python', title: 'a context manager in six lines' },
    py`Around it, contextlib offers small, sharp tools: **\`suppress\`** (ignore specific exceptions), **\`redirect_stdout\`** (capture printed output), **\`closing\`** (call \`.close()\` for objects that lack \`with\` support), **\`nullcontext\`** (a do-nothing stand-in), **\`chdir\`** (3.11+, temporarily change directory) — and **\`ExitStack\`**, which manages *any number* of context managers decided at runtime.`,
  ],
  why: [
    py`Most context managers in real code are tiny: time this, lock that, set a value and put it back. A generator expresses "before, during, after" in reading order, so the code is shorter and harder to get wrong than two separate methods sharing state through \`self\`.`,
    py`The ready-made managers cover things everyone needs and nobody should rewrite: \`suppress(FileNotFoundError)\` documents intent better than \`try/except: pass\`; \`redirect_stdout\` captures output for tests; \`closing\` gives \`with\` support to older APIs.`,
    py`And some problems are impossible with plain \`with\`: "open every file in this list (however long it is) and close all of them reliably — even if the seventh fails to open". \`ExitStack\` solves exactly that.`,
  ],
  eli15: [
    py`Remember the strict PE teacher from the last lesson, who makes sure the football always goes back? Writing a whole class for that teacher is like filling in a long form. \`@contextmanager\` lets you just write a **to-do list with a pause in the middle**: "unlock the cupboard … ⏸ (pause while the game happens) … lock the cupboard".`,
    py`The \`yield\` is the pause button. Python runs your list up to the pause, lets the \`with\` block happen, then presses play to finish the list. Wrap the second half in \`try/finally\` and it runs even if the game ends in chaos.`,
    py`\`ExitStack\` is a **stack of to-do sticky notes**: every time you borrow something you stick a "give this back" note on the pile. At the end you work through the pile from the top — last borrowed, first returned — however many notes there are.`,
  ],
  analogy: {
    title: 'A cloakroom ticket stack',
    body: [
      py`At a concert cloakroom each coat you hand in gets a ticket, and the attendant stacks the tickets. At the end of the night they hand coats back starting from the **top** of the pile — the last coat in is the first out. It doesn't matter whether there were 2 coats or 200.`,
      py`\`ExitStack\` is the attendant: \`enter_context(cm)\` hands in a coat (enters a manager) and keeps its ticket (its \`__exit__\`); \`callback(fn)\` adds a note like "give Ada her umbrella"; leaving the \`with\` returns everything in reverse order. \`pop_all()\` hands the whole stack of tickets to someone else to deal with later.`,
    ],
    mapping: [
      ['handing in a coat and getting a ticket', 'stack.enter_context(open(path))'],
      ['a handwritten note on the pile', 'stack.callback(print, "done")'],
      ['returning coats from the top of the pile', 'exits run in reverse (LIFO) order'],
      ['any number of coats', 'a dynamic number of resources'],
      ['a coat that can’t be accepted', 'an error while entering — earlier ones are still returned'],
      ['handing the ticket pile to a colleague', 'stack.pop_all() transfers the cleanups'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A @contextmanager generator pauses at yield',
    props: {
      code: py`from contextlib import contextmanager


@contextmanager
def opened_shop(name):
    print("unlock", name)
    try:
        yield name.upper()        # the with-block runs here
    finally:
        print("lock", name)


with opened_shop("bakery") as sign:
    print("selling at", sign)

try:
    with opened_shop("cafe"):
        raise RuntimeError("power cut")
except RuntimeError as err:
    print("handled:", err)
`,
      notes: {
        13: 'Entering the `with` starts the generator: it runs from the top until it reaches `yield`.',
        8: 'The generator **pauses** here. The yielded value, `"BAKERY"`, becomes `sign`. Look at the generator object: it is *suspended* at this line.',
        14: 'The with-body runs while the generator is paused.',
        10: 'Leaving the block resumes the generator after `yield`; the `finally` block does the cleanup.',
        18: 'This time the body raises. contextlib **throws** the exception into the generator, at the `yield`…',
        20: '…the `finally` still ran (you saw "lock cafe"), and because the generator didn\'t catch the error, it continued outwards to this `except`.',
      },
    },
    alt: 'A step-by-step trace. Entering with opened_shop("bakery") runs the generator until yield name.upper(); the generator object is shown suspended at the yield and the name sign is bound to "BAKERY". The body prints selling at BAKERY. Leaving the block resumes the generator, whose finally prints lock bakery. The second with enters opened_shop("cafe"), prints unlock cafe, the body raises RuntimeError, the exception is thrown into the generator at the yield, the finally prints lock cafe, and the error propagates to the except clause, which prints handled: power cut.',
    caption: py`One function, two halves, one pause. The \`try/finally\` around \`yield\` is what makes cleanup survive an exception thrown in at the pause point.`,
  },
  syntax: [
    py`#### @contextmanager: the rules`,
    { code: py`from contextlib import contextmanager


@contextmanager
def name_of_manager(arguments):
    # 1. setup — runs on entry
    resource = ...
    try:
        yield resource          # 2. exactly ONE yield; its value is the "as" target
    finally:
        ...                     # 3. cleanup — runs on exit, even if the block raised`, lang: 'python', title: 'the template' },
    py`- **Yield exactly once.** No yield → \`RuntimeError: generator didn't yield\`. A second yield → \`RuntimeError: generator didn't stop\`.
- **Put \`yield\` inside \`try/finally\`.** If the with-block raises, the exception is *re-raised inside your generator at the \`yield\`*. Without \`finally\`, the cleanup lines after \`yield\` are simply skipped.
- **To handle an exception**, use \`try/except\` around the \`yield\`. Catching it and *not* re-raising **suppresses** it — the same as \`__exit__\` returning \`True\`. Re-raise with a bare \`raise\` unless suppression is the point.
- **Each call creates a fresh manager.** \`section("a")\` returns a new object every time. Don't store one and use it in two \`with\` statements — generator-based managers are single-use.`,
    { callout: 'tip', title: 'Bonus: they also work as decorators', text: py`A manager made with \`@contextmanager\` can decorate a function: \`@section("nightly job")\` above a \`def\` wraps every call in the header/footer. That's because it inherits from \`contextlib.ContextDecorator\` (and recreates its generator for each call).` },
    py`#### suppress — ignore specific exceptions`,
    { code: py`import os
from contextlib import suppress

with suppress(FileNotFoundError):        # same as try / except FileNotFoundError: pass
    os.remove("old_cache.tmp")

results = []
for raw in ["1", "x", "3"]:
    with suppress(ValueError):
        results.append(int(raw))
        results.append("ok")             # skipped when int() fails
print(results)                           # [1, 'ok', 3, 'ok']`, lang: 'python', title: 'suppress' },
    py`An exception ends the block immediately, so lines after the failing one are skipped. Only list the exception types you truly expect; \`suppress(Exception)\` hides bugs.`,
    py`#### redirect_stdout — capture what gets printed`,
    { code: py`import io
from contextlib import redirect_stdout

buffer = io.StringIO()
with redirect_stdout(buffer):
    help(len)                       # prints a lot...
text = buffer.getvalue()            # ...now it's a string
print(text.splitlines()[0])`, lang: 'python', title: 'redirect_stdout' },
    { callout: 'warn', title: 'It changes global state', text: py`\`redirect_stdout\` swaps \`sys.stdout\` for the **whole program** while the block runs. Other threads or asyncio tasks that print during that time are captured too. Fine in scripts and tests; avoid it in library code and servers — have functions *return* data or take an output stream instead.` },
    py`#### closing, nullcontext, chdir`,
    { code: py`import os
import sqlite3
from contextlib import chdir, closing, nullcontext

# closing: for objects that have .close() but no __exit__ that closes
with closing(sqlite3.connect(":memory:")) as conn:
    print(conn.execute("SELECT 1 + 1").fetchone())     # (2,)

# nullcontext: when a manager is optional
def export(rows, lock=None):
    with lock if lock is not None else nullcontext():
        return len(rows)

print(export([1, 2, 3]))                                # 3

# chdir (3.11+): temporarily change the working directory
os.makedirs("reports", exist_ok=True)
with chdir("reports"):
    print(os.path.basename(os.getcwd()))                # reports
print(os.path.basename(os.getcwd()))                    # back where we were`, lang: 'python', title: 'small helpers' },
    { callout: 'version', title: 'Versions', text: py`\`contextlib.chdir\` is new in **3.11**; \`nullcontext\` became usable with \`async with\` in 3.10, which also added \`aclosing\`. \`suppress\`, \`redirect_stdout\`, \`ExitStack\` and \`contextmanager\` have been around since the Python 3.3–3.4 era. Like \`redirect_stdout\`, \`chdir\` changes process-wide state — don't use it in threaded or async code.` },
    py`#### ExitStack — a dynamic number of managers`,
    { code: py`from contextlib import ExitStack

for name, text in [("a.txt", "alpha\n"), ("b.txt", "beta\n"), ("c.txt", "gamma\n")]:
    with open(name, "w") as f:
        f.write(text)

paths = ["a.txt", "b.txt", "c.txt"]          # could be 3 or 3,000 — decided at runtime

with ExitStack() as stack:
    files = [stack.enter_context(open(p)) for p in paths]
    stack.callback(print, "all files will now close")
    first_lines = [f.readline().strip() for f in files]
print(first_lines)                          # ['alpha', 'beta', 'gamma']
print(all(f.closed for f in files))         # True`, lang: 'python', title: 'opening a list of files' },
    py`- \`enter_context(cm)\` enters a manager and returns its \`as\` value; its exit is pushed onto the stack.
- \`callback(fn, *args, **kwargs)\` pushes any cleanup function (arguments are captured **now**).
- On exit, everything unwinds **last-in, first-out**, and every cleanup runs even if an earlier one raises.
- If entering the 7th file fails, the 6 already opened are closed before the exception propagates — the problem from [context managers](lesson:context-managers) where \`__exit__\` doesn't run if \`__enter__\` fails is solved.
- \`stack.pop_all()\` moves all registered cleanups to a new \`ExitStack\` and returns it — the pattern for "acquire several resources, and only *keep* them if all succeeded".`,
    py`#### AbstractContextManager and the async versions`,
    { code: py`import asyncio
from contextlib import AbstractContextManager, asynccontextmanager


class Session(AbstractContextManager):      # __enter__ (return self) comes free
    def __exit__(self, exc_type, exc, tb):
        print("session closed")
        return None


with Session() as s:
    print(type(s).__name__)


@asynccontextmanager
async def connection(name):
    print("connect", name)
    await asyncio.sleep(0)                   # setup may await
    try:
        yield f"<conn {name}>"
    finally:
        await asyncio.sleep(0)               # so may cleanup
        print("disconnect", name)


async def main():
    async with connection("db") as conn:     # async with → __aenter__ / __aexit__
        print("using", conn)

asyncio.run(main())`, lang: 'python', title: 'ABC base class and async managers' },
    py`\`AbstractContextManager\` gives you a default \`__enter__\` returning \`self\`, and \`isinstance(obj, AbstractContextManager)\` is \`True\` for **any** object with both methods (it checks structurally). For async code, \`@asynccontextmanager\`, \`AsyncExitStack\` and \`aclosing\` mirror the sync tools — see [asyncio in practice](lesson:asyncio-in-practice).`,
  ],
  walkthrough: {
    title: 'Reading the regional sales report',
    lang: 'python',
    code: REPORT,
    intro: py`This is the program in the playground below (it reads the three CSV files next to it). Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 12], text: py`\`section\` is a generator-based manager. It prints a header, yields the upper-cased title (the \`as\` value) and prints the footer in \`finally\`, so the footer appears even if the block fails.` },
      { lines: [15, 18], text: py`\`noisy_total\` stands in for library code that prints debug noise we can't remove.` },
      { lines: [23, 25], text: py`\`ExitStack\` will collect however many files we manage to open. The \`with section(...)\` around it is just a manager like any other.` },
      { lines: [26, 28], text: py`For each region, \`open\` is tried. \`west.csv\` doesn't exist, so \`open\` raises \`FileNotFoundError\`, which \`suppress\` swallows — that region is simply skipped. Successfully opened files are registered with \`enter_context\`.` },
      { lines: [29, 31], text: py`Files are read while still open. When the \`ExitStack\` block ends, all three files are closed (in reverse order) — \`all closed: True\` proves it.` },
      { lines: [33, 36], text: py`\`as heading\` receives the yielded \`"TOTALS"\`. \`redirect_stdout\` sends the debug prints into a \`StringIO\` buffer instead of the screen.` },
      { lines: [37, 38], text: py`After the redirect ends, printing goes to the screen again. The six captured debug lines are counted rather than shown.` },
    ],
  },
  playground: {
    title: 'Regional sales report',
    objective: 'Run it, then add a cleanup callback, a failing section, an optional redirect and a fourth data file.',
    files: {
      'main.py': REPORT,
      'north.csv': py`120
80
`,
      'south.csv': py`95
`,
      'east.csv': py`40
60
20
`,
    },
    expected: py`\`\`\`text
== open files ==
opened: ['north', 'south', 'east']
all closed: True
== end open files ==
== totals ==
TOTALS {'north': 200, 'south': 95, 'east': 120}
debug lines hidden: 6
== end totals ==
\`\`\``,
    experiments: [
      {
        id: 'callback',
        task: py`Right after the line \`with ExitStack() as stack:\`, register a cleanup: \`stack.callback(print, "stack unwound")\`. Predict where "stack unwound" appears.`,
        hint: py`Callbacks run when the \`ExitStack\` block ends — after "opened:" but before "all closed:".`,
        tests: [
          { name: 'the callback ran when the stack unwound', code: py`assert 'stack unwound' in output
assert output.index('opened:') < output.index('stack unwound') < output.index('all closed')` },
        ],
        explain: py`Everything pushed onto an \`ExitStack\` — file exits and plain callbacks alike — runs when its block ends, in reverse order of registration. Your callback was registered first, so it actually ran **last**, after the files had been closed.`,
      },
      {
        id: 'risky',
        task: py`At the end, add a third section, \`with section("risky"):\`, whose body raises \`ValueError("bad data")\`. Wrap that whole \`with\` in \`try/except ValueError\` that prints \`"recovered"\`. Does the footer still print?`,
        hint: py`try:\` on one line, the \`with section("risky"):\` indented under it, \`raise ValueError("bad data")\` indented again, then \`except ValueError:\` and \`print("recovered")\`.`,
        tests: [
          { name: 'the footer printed despite the error', code: py`assert '== end risky ==' in output` },
          { name: 'cleanup happened before the except ran', code: py`assert output.index('== end risky ==') < output.index('recovered')` },
        ],
        explain: py`contextlib re-raised the \`ValueError\` inside \`section\` at the \`yield\`. The \`finally\` printed the footer, then the error continued to your \`except\`. Now try deleting \`try:\` and \`finally:\` from \`section\` (keep the prints): the footer vanishes on error. That's the #1 \`@contextmanager\` bug.`,
      },
      {
        id: 'nullcontext',
        task: py`Make the redirect optional. Add \`quiet = False\` near the top, import \`nullcontext\`, and change the redirect line to \`with redirect_stdout(captured) if quiet else nullcontext():\`. Run it with \`quiet = False\`.`,
        hint: py`Add \`nullcontext\` to the \`from contextlib import ...\` line. A conditional expression can choose which manager to use.`,
        tests: [
          { name: 'quiet is False', code: py`assert ns.get('quiet') is False, 'Add quiet = False'` },
          { name: 'uses nullcontext', code: py`assert 'nullcontext' in files['main.py']` },
          { name: 'debug lines are visible now', code: py`assert 'debug: adding 120' in output` },
        ],
        explain: py`\`nullcontext()\` is a manager that does nothing, so the \`with\` statement stays the same shape whether or not you want the real manager. It beats duplicating the block in an \`if/else\`.`,
      },
      {
        id: 'west',
        task: py`Make the fourth region appear: before the first \`with section(...)\`, create \`west.csv\` from code with \`with open("west.csv", "w") as f: f.write("75\n")\`.`,
        hint: py`Put the \`with open(...)\` line right after \`REGIONS = ...\`.`,
        tests: [
          { name: 'west is opened and totalled', code: py`assert totals.get('west') == 75` },
          { name: 'all four files were closed', code: py`assert len(files) == 4 and all(f.closed for f in files.values())` },
        ],
        explain: py`The \`ExitStack\` didn't care whether it managed three files or four: the number is decided at runtime, and every file is still closed. With nested \`with\` statements you'd have to know the count when writing the code.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How @contextmanager maps a generator onto __enter__ and __exit__',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'call', label: 'section("totals")', note: 'creates a manager + generator', x: 110, y: 70, tone: 'paper' },
        { id: 'enter', label: '__enter__', note: 'next(gen) → runs to yield', x: 330, y: 70, tone: 'blue' },
        { id: 'yield', label: 'yield value', note: 'generator paused', x: 560, y: 70, tone: 'yellow' },
        { id: 'body', label: 'with body', note: 'your code runs', x: 560, y: 240, tone: 'paper' },
        { id: 'ok', label: '__exit__ (no error)', note: 'next(gen) → must finish', x: 330, y: 240, tone: 'blue' },
        { id: 'err', label: '__exit__ (error)', note: 'gen.throw(exc) at the yield', x: 110, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'call', to: 'enter', label: 'with' },
        { from: 'enter', to: 'yield', label: 'setup code' },
        { from: 'yield', to: 'body', label: 'value → as' },
        { from: 'body', to: 'ok', label: 'block finished' },
        { from: 'body', to: 'err', label: 'block raised', dashed: true },
      ],
      steps: [
        { focus: ['call'], text: py`Calling the decorated function doesn't run your code yet. It builds a helper object (a \`_GeneratorContextManager\`) holding a new generator.` },
        { focus: ['enter', 'yield'], edges: ['call->enter', 'enter->yield'], text: py`The \`with\` calls the helper's \`__enter__\`, which calls \`next(gen)\`. Your setup code runs until the \`yield\`, where the generator pauses. The yielded value is returned to \`as\`.` },
        { focus: ['body'], edges: ['yield->body'], text: py`The with-body runs while the generator is paused mid-function, its local variables intact.` },
        { focus: ['ok'], edges: ['body->ok'], text: py`No exception: \`__exit__\` calls \`next(gen)\` again. The code after \`yield\` runs and the generator must **finish** — if it yields again you get \`RuntimeError: generator didn't stop\`.` },
        { focus: ['err'], edges: ['body->err'], text: py`Exception: \`__exit__\` calls \`gen.throw(exc)\`, so the exception appears **at the \`yield\` line** inside your function. A \`finally\` runs; an \`except\` that doesn't re-raise suppresses it; otherwise it propagates as usual.` },
      ],
    },
    alt: 'Diagram: calling section("totals") creates a manager wrapping a generator. __enter__ calls next on the generator, running setup code to the yield; the yielded value becomes the as target and the generator pauses while the with body runs. If the body finishes, __exit__ calls next again and the generator must finish. If the body raises, __exit__ throws the exception into the generator at the yield.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A generator function with \`yield\` can **pause** in the middle and **resume** later, keeping its local variables (see [generators](lesson:generators)). \`@contextmanager\` exploits that: entering the \`with\` runs your function up to the pause, leaving it runs the rest.`,
      py`Compare the two styles for the same timer — the generator keeps setup, the yield and cleanup together, in reading order:`,
      { code: py`import time
from contextlib import contextmanager


class Timer:                                 # class style
    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc, tb):
        print(f"took {time.perf_counter() - self.start:.4f}s")
        return False


@contextmanager
def timer():                                 # generator style
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f"took {time.perf_counter() - start:.4f}s")


with Timer():
    sum(range(10_000))
with timer():
    sum(range(10_000))`, lang: 'python', title: 'same job, two styles' },
    ],
    technical: [
      py`#### What @contextmanager builds`,
      py`\`contextmanager(func)\` returns a function that, when called, creates a \`_GeneratorContextManager\` holding \`func(*args, **kwargs)\` — a new generator. Its methods, simplified:`,
      { code: py`class GeneratorCM:                         # simplified sketch of contextlib's helper
    def __init__(self, gen):
        self.gen = gen

    def __enter__(self):
        try:
            return next(self.gen)              # run to the yield
        except StopIteration:
            raise RuntimeError("generator didn't yield") from None

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            try:
                next(self.gen)                 # run the cleanup
            except StopIteration:
                return False
            raise RuntimeError("generator didn't stop")
        try:
            self.gen.throw(exc)                # re-raise inside the generator
        except StopIteration:
            return True                        # generator swallowed it → suppress
        except BaseException as err:
            if err is exc:
                return False                   # same exception came back → propagate
            raise
        raise RuntimeError("generator didn't stop after throw()")`, lang: 'python', title: 'the core idea (simplified — the real one handles more edge cases)' },
      py`The real implementation also handles \`StopIteration\` raised inside the block, exceptions chained by the generator, and keeps tracebacks clean. The key insight stands: **suppression = the generator finished without letting the exception out.**`,
      py`#### ExitStack's guarantees`,
      py`\`ExitStack\` keeps a deque of exit callbacks. On \`__exit__\` it pops them one by one, passing the current exception details to each manager's \`__exit__\`. If one callback raises, the new exception becomes "current" for the remaining callbacks, and every callback still runs; a callback that returns \`True\` suppresses the current exception for the ones after it. That's the same behaviour as properly nested \`with\` statements — the docs describe \`ExitStack\` as a programmatic version of nesting.`,
      { code: py`from contextlib import ExitStack


class Lock:
    def __init__(self, name, log, fail=False):
        self.name, self.log, self.fail = name, log, fail

    def __enter__(self):
        if self.fail:
            raise RuntimeError(f"cannot lock {self.name}")
        self.log.append(f"lock {self.name}")
        return self

    def __exit__(self, *exc):
        self.log.append(f"unlock {self.name}")
        return False


def lock_all(names, log, broken=None):
    """Lock every server, or none of them."""
    with ExitStack() as stack:
        for name in names:
            stack.enter_context(Lock(name, log, fail=(name == broken)))
        return stack.pop_all()          # success: hand the unlocks to the caller


log = []
try:
    lock_all(["web1", "web2", "db"], log, broken="db")
except RuntimeError as err:
    print(err, log)                     # cannot lock db ['lock web1', 'lock web2', 'unlock web2', 'unlock web1']

log = []
unlocker = lock_all(["web1", "web2"], log)
print(log)                              # ['lock web1', 'lock web2'] — still held
unlocker.close()
print(log)                              # ... 'unlock web2', 'unlock web1'`, lang: 'python', title: 'all-or-nothing acquisition with pop_all()' },
      { callout: 'note', title: 'CPython detail', text: py`\`contextlib\` is written in pure Python (\`Lib/contextlib.py\`), so a generator-based manager costs a few more Python-level calls per \`with\` than a class with \`__enter__\`/\`__exit__\`. That difference is negligible for anything touching files, locks or the network; measure with \`timeit\` before choosing a style for speed.` },
    ],
    production: [
      py`**Atomic file writes** are a classic \`@contextmanager\`: write to a temporary file, and only replace the real file when the block succeeds (\`os.replace\` is atomic on the same filesystem). Production versions put the temp file in the same directory (\`tempfile.NamedTemporaryFile(dir=..., delete=False)\`), flush and \`os.fsync\` before replacing, and clean up on failure. You'll build a simplified one in the exercises.`,
      py`**Tests love contextlib.** \`redirect_stdout\` captures CLI output; \`suppress\` and \`ExitStack\` tidy up fixtures; \`unittest.mock.patch\` is itself a context manager (and a decorator). pytest offers fixtures like \`capsys\` that do similar jobs — see [mocking](lesson:mocking).`,
      py`**Global-state managers are not thread- or async-safe.** \`redirect_stdout\`, \`chdir\` and anything that sets a module-level variable affect every thread and every asyncio task while active. For per-task state use \`contextvars\`; for output, pass a stream around.`,
      py`**Prefer explicit cleanup over \`suppress\`-everything.** \`suppress\` is for *expected*, harmless exceptions (\`FileNotFoundError\` when deleting a cache). If you need to know an error happened, catch and log it.`,
      py`**Async resources need async managers.** Database pools, HTTP sessions and locks in asyncio code expose \`async with\`. \`@asynccontextmanager\`, \`AsyncExitStack\` (with \`enter_async_context\`) and \`aclosing\` (3.10) are the async counterparts — see [asyncio in practice](lesson:asyncio-in-practice).`,
      { code: py`import httpx                                   # third-party, shown for shape only


async def fetch_all(urls):
    async with httpx.AsyncClient(timeout=10) as client:   # async context manager
        return [await client.get(url) for url in urls]`, lang: 'python', static: true, title: 'async with in real code (httpx is third-party)' },
    ],
  },
  mistakes: [
    {
      title: 'No try/finally around yield',
      wrong: { code: py`from contextlib import contextmanager

@contextmanager
def locked(log):
    log.append("acquire")
    yield
    log.append("release")          # skipped if the block raises!`, lang: 'python' },
      right: { code: py`from contextlib import contextmanager

@contextmanager
def locked(log):
    log.append("acquire")
    try:
        yield
    finally:
        log.append("release")      # always runs`, lang: 'python' },
      explanation: py`An exception in the with-block is re-raised **at the yield**. Without \`finally\`, everything after \`yield\` is skipped — the lock is never released. This is the most common \`@contextmanager\` bug.`,
    },
    {
      title: 'Catching the exception and forgetting to re-raise',
      wrong: { code: py`from contextlib import contextmanager

@contextmanager
def logged_errors():
    try:
        yield
    except Exception as err:
        print("error:", err)       # swallowed → callers think it worked`, lang: 'python' },
      right: { code: py`from contextlib import contextmanager

@contextmanager
def logged_errors():
    try:
        yield
    except Exception as err:
        print("error:", err)
        raise                      # log it, then let it continue`, lang: 'python' },
      explanation: py`In a generator-based manager, catching an exception and finishing normally **suppresses** it — just like \`__exit__\` returning \`True\`. Add a bare \`raise\` unless suppression is intended.`,
    },
    {
      title: 'Yielding more than once (e.g. in a loop or in except)',
      wrong: { code: py`from contextlib import contextmanager

@contextmanager
def retrying():
    for attempt in range(3):
        yield attempt              # RuntimeError: generator didn't stop`, lang: 'python', static: true },
      right: { code: py`def retrying(times=3):
    for attempt in range(times):
        yield attempt              # a plain generator, used with a for loop

for attempt in retrying():
    print("attempt", attempt)`, lang: 'python' },
      explanation: py`A context manager wraps **one** run of a block, so its generator must yield exactly once. You can't re-run a \`with\` body from inside the manager — retries belong in a loop or a decorator.`,
    },
    {
      title: 'Reusing a generator-based manager object',
      wrong: { code: py`cm = section("report")
with cm:
    print("first")
with cm:                           # fails: the generator was already used
    print("second")`, lang: 'python', static: true },
      right: { code: py`with section("report"):
    print("first")
with section("report"):           # call again → fresh manager
    print("second")`, lang: 'python', static: true },
      explanation: py`Each call to a \`@contextmanager\` function creates a single-use object around a single generator. Call the function each time you need a \`with\`. (Class-based managers can be designed to be reusable or reentrant.)`,
    },
    {
      title: 'Using suppress too broadly',
      wrong: { code: py`import json
from contextlib import suppress

config = {}
with suppress(Exception):          # hides typos, bugs, everything
    config = json.loads(open("config.json").read())`, lang: 'python' },
      right: { code: py`import json
from contextlib import suppress

config = {}
with suppress(FileNotFoundError):  # only "no config file yet" is fine
    with open("config.json") as f:
        config = json.load(f)`, lang: 'python' },
      explanation: py`Only suppress exceptions you expect and are happy to ignore. A malformed config file (\`json.JSONDecodeError\`) should crash loudly, not silently fall back to defaults. (The right version also closes the file.)`,
    },
  ],
  debugging: [
    {
      symptom: py`RuntimeError: generator didn't yield`,
      cause: py`The \`@contextmanager\` function returned (or hit a code path) without reaching \`yield\`.`,
      fix: py`Make sure every path through the setup reaches exactly one \`yield\`; raise an exception instead of returning early.`,
    },
    {
      symptom: py`RuntimeError: generator didn't stop`,
      cause: py`The generator yielded a second time after the block finished (a \`yield\` in a loop, or two \`yield\`s).`,
      fix: py`Keep exactly one \`yield\`. For repetition, use a loop around the \`with\` or a plain generator.`,
    },
    {
      symptom: py`RuntimeError: generator didn't stop after throw()`,
      cause: py`The generator caught the exception from the block and then yielded again (e.g. a \`yield\` inside \`except\`).`,
      fix: py`In the \`except\` branch, re-raise or finish — never yield.`,
    },
    {
      symptom: py`TypeError: 'generator' object does not support the context manager protocol (missed __exit__ method)`,
      cause: py`The generator function is missing the \`@contextmanager\` decorator, so calling it returns a plain generator.`,
      fix: py`Add \`@contextmanager\` (from \`contextlib\`) above the \`def\`.`,
    },
    {
      symptom: py`Cleanup code after yield doesn't run when the block fails (locks stay held, temp files remain)`,
      cause: py`The \`yield\` isn't inside \`try/finally\`.`,
      fix: py`Wrap \`yield\` in \`try:\` … \`finally:\` and move the cleanup into \`finally\`.`,
    },
    {
      symptom: py`Output from other parts of the program goes missing while a block runs`,
      cause: py`\`redirect_stdout\` is process-wide: concurrent threads/tasks print into your buffer.`,
      fix: py`Restrict \`redirect_stdout\` to scripts and tests, or change the code to accept an output stream.`,
    },
  ],
  bestPractices: [
    'Reach for @contextmanager for small before/after managers; use a class when the manager has rich state, methods or must be reusable/reentrant.',
    'Always put yield inside try/finally; use except only to translate or log — then re-raise.',
    'Yield exactly once, and call the decorated function anew for each with statement.',
    'Use ExitStack whenever the number of resources is decided at runtime, or for all-or-nothing acquisition with pop_all().',
    'Use suppress only for specific, expected exceptions; never suppress(Exception).',
    'Keep redirect_stdout and chdir out of library, threaded and async code — they change process-wide state.',
    'Use nullcontext instead of duplicating code when a manager is optional.',
  ],
  useCases: [
    'Timing, logging or tracing a block with a three-line generator manager.',
    'Atomic file writes: write to a temp file, replace the real one only on success.',
    'Opening a variable number of files, connections or locks with ExitStack.',
    'Capturing printed output in tests or tools with redirect_stdout.',
    'Ignoring an expected missing file when cleaning up caches with suppress.',
    'Giving with-support to objects that only have close() via closing().',
    'Temporarily switching directories in build scripts with chdir (3.11+).',
  ],
  whenToUse: {
    use: [
      'A manager is simple "setup, yield, cleanup" → @contextmanager.',
      'The number or kind of managers is only known at runtime → ExitStack.',
      'A ready-made helper says exactly what you mean → suppress, closing, nullcontext, redirect_stdout, chdir.',
    ],
    avoid: [
      'The manager must be reusable or reentrant, or exposes several methods → write a class.',
      'Tight inner loops where a class-based manager has been measured to be noticeably faster.',
      'Hiding errors: suppress and except-without-raise are not error handling.',
      'Process-wide redirects in servers, libraries, threads or async tasks.',
    ],
  },
  comparison: {
    title: 'Class-based manager vs @contextmanager',
    headers: ['', 'class with __enter__/__exit__', '@contextmanager generator'],
    rows: [
      ['code size for simple cases', 'two methods + shared state on self', 'one function, setup → yield → cleanup'],
      ['cleanup on exceptions', '__exit__ always runs', 'only if yield is inside try/finally'],
      ['suppressing an exception', '__exit__ returns True', 'catch it and don’t re-raise'],
      ['reuse', 'can be reusable or reentrant by design', 'single-use: call the function each time'],
      ['extra methods / visible state', 'easy (it’s a class)', 'awkward'],
      ['also usable as a decorator', 'only if you add ContextDecorator', 'yes, automatically'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'contextlib-q1',
      type: 'mcq',
      prompt: py`In a \`@contextmanager\` function, what does the value after \`yield\` become?`,
      options: [
        { text: 'The return value of the with statement', why: 'A with statement is not an expression and has no return value.' },
        'The value bound by "as" in the with statement',
        { text: 'The exception passed to __exit__', why: 'Exceptions are thrown into the generator at the yield; they are not the yielded value.' },
        { text: 'It is ignored; only the code around yield matters', why: 'It is exactly what __enter__ returns, so "as name" receives it.' },
      ],
      answer: 1,
      explanation: py`\`__enter__\` runs the generator to the \`yield\` and returns the yielded value, so \`with timer() as t:\` binds \`t\` to it. A bare \`yield\` gives \`None\`.`,
    },
    {
      id: 'contextlib-q2',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    try:
        yield
    finally:
        print(f"</{name}>")

try:
    with tag("p"):
        print("hello")
        raise KeyError("oops")
except KeyError:
    print("caught")`,
      options: [
        '<p>\nhello\n</p>\ncaught',
        { text: '<p>\nhello\ncaught\n</p>', why: 'The finally inside the generator runs as the exception passes through the with, before the outer except.' },
        { text: '<p>\nhello\ncaught', why: 'The yield is inside try/finally, so the closing tag is printed even though the block raised.' },
        { text: '<p>\nhello\n</p>', why: 'The generator does not catch KeyError, so it propagates to the outer except, which prints caught.' },
      ],
      answer: 0,
      explanation: py`The \`KeyError\` is thrown into the generator at \`yield\`, the \`finally\` prints \`</p>\`, and since the generator didn't catch it, it propagates to the outer \`except\`.`,
    },
    {
      id: 'contextlib-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from contextlib import suppress

results = []
for raw in ["1", "x", "3"]:
    with suppress(ValueError):
        results.append(int(raw))
        results.append("ok")
print(results)`,
      answer: "[1, 'ok', 3, 'ok']",
      accept: ["[1, 'ok', 3, 'ok']", '[1, "ok", 3, "ok"]'],
      explanation: py`For \`"x"\`, \`int(raw)\` raises before anything is appended, and the rest of that block (\`append("ok")\`) is skipped. \`suppress\` swallows the error and the loop continues.`,
    },
    {
      id: 'contextlib-q4',
      type: 'bug',
      prompt: py`Sometimes the program hangs forever waiting for a lock. Click the line that does **not** run when the with-block raises.`,
      code: py`from contextlib import contextmanager

@contextmanager
def locked(lock):
    lock.acquire()
    yield
    lock.release()

with locked(stock_lock):
    update_stock()      # sometimes raises`,
      answerLine: 7,
      explanation: py`When the block raises, the exception reappears at the \`yield\` and the function stops there — \`lock.release()\` never runs, and the next \`acquire()\` waits forever. Wrap \`yield\` in \`try:\` … \`finally: lock.release()\`.`,
    },
    {
      id: 'contextlib-q5',
      type: 'fill',
      prompt: py`Complete the code so that every path in \`paths\` is opened, and all files are closed when the block ends.`,
      code: py`from contextlib import ExitStack

with ___() as stack:
    files = [stack.___(open(p)) for p in paths]
    print([f.readline() for f in files])`,
      answer: [['ExitStack'], ['enter_context']],
      explanation: py`\`ExitStack\` collects exits; \`enter_context(cm)\` enters each file (returning the file object) and schedules its close for when the stack unwinds.`,
    },
    {
      id: 'contextlib-q6',
      type: 'mcq',
      prompt: py`\`def export(rows, lock=None)\` should hold \`lock\` while exporting — but only if a lock was given. What's the cleanest way?`,
      options: [
        { text: 'Duplicate the export code in both branches of if lock: ... else: ...', why: 'It works, but duplicated code drifts apart; contextlib has a tool for this.' },
        'with lock if lock is not None else contextlib.nullcontext(): ...',
        { text: 'with suppress(AttributeError): with lock: ...', why: 'with None raises TypeError, not AttributeError — and suppressing it would skip the export entirely.' },
        { text: 'with lock or None: ...', why: 'None is not a context manager, so this fails when no lock is given.' },
      ],
      answer: 1,
      explanation: py`\`nullcontext()\` is a context manager that does nothing, so the same \`with\` statement works whether or not a real manager is available.`,
    },
    {
      id: 'contextlib-q7',
      type: 'short',
      prompt: py`When would you use \`ExitStack\` instead of nested \`with\` statements? Give two situations.`,
      answer: py`When the number of managers is only known at runtime (open every file in a list, lock every server in a config); when some managers are optional or chosen conditionally; when you need all-or-nothing acquisition and want to keep the resources after the block (enter them all, then pop_all() to transfer the cleanup to the caller); or when you want to register arbitrary cleanup callbacks alongside managers.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'atomic-write',
      title: 'Atomic file writes',
      difficulty: 'advanced',
      prompt: py`If a program crashes halfway through writing \`settings.json\`, the file is left half-written and the app won't start again. The fix is an **atomic write**: write everything to a temporary file, and only replace the real file once writing succeeded.

Using \`@contextmanager\`, finish \`atomic_write(path)\`:

1. open \`path + ".tmp"\` for writing and **yield the file object**;
2. if the block finishes normally: close the temp file, then \`os.replace(tmp_path, path)\` (this swaps the files in one step);
3. if the block raises: close the temp file, **delete** it (\`os.remove\`) and **re-raise** — the original \`path\` must be untouched;
4. in both cases no \`.tmp\` file may be left behind.`,
      files: {
        'main.py': py`import os
from contextlib import contextmanager


@contextmanager
def atomic_write(path):
    tmp_path = path + ".tmp"
    f = open(tmp_path, "w")
    # TODO: success → close and os.replace(tmp_path, path)
    #       error   → close, os.remove(tmp_path), re-raise
    yield f
    f.close()


with atomic_write("settings.json") as f:
    f.write('{"theme": "dark"}')

print("settings.json exists:", os.path.exists("settings.json"))
`,
      },
      hints: [
        'You need different cleanup for success and failure, so use try / except / else around the yield (not just finally).',
        'except BaseException: close, os.remove(tmp_path), then a bare raise. else: close, then os.replace(tmp_path, path).',
        'Catching BaseException (not just Exception) means even Ctrl+C (KeyboardInterrupt) cleans up the temp file — and the bare raise re-raises it anyway.',
      ],
      solution: {
        explanation: py`\`try/except/else\` around \`yield\` gives two cleanup paths. On failure, the exception thrown in at the \`yield\` lands in \`except\`: we close and delete the half-written temp file, then \`raise\` re-raises the original error — no suppression. On success, \`else\` closes the file and \`os.replace\` swaps it into place, so other readers see either the old file or the complete new one, never half of one.

**Simplified:** production code creates the temp file in the same directory with a unique name (\`tempfile.NamedTemporaryFile(dir=..., delete=False)\`, so two writers can't collide), calls \`f.flush()\` and \`os.fsync(f.fileno())\` before replacing so the data is really on disk, and may also fsync the directory.`,
        files: {
          'main.py': py`import os
from contextlib import contextmanager


@contextmanager
def atomic_write(path):
    tmp_path = path + ".tmp"
    f = open(tmp_path, "w")
    try:
        yield f
    except BaseException:
        f.close()
        os.remove(tmp_path)        # throw away the half-written file
        raise                      # and let the error continue
    else:
        f.close()
        os.replace(tmp_path, path) # swap in the complete file


with atomic_write("settings.json") as f:
    f.write('{"theme": "dark"}')

print("settings.json exists:", os.path.exists("settings.json"))
`,
        },
      },
      tests: [
        { name: 'the demo created settings.json', code: py`assert "settings.json exists: True" in output` },
        {
          name: 'success writes the file and leaves no .tmp',
          code: py`import os
with atomic_write("notes.txt") as f:
    f.write("buy milk")
with open("notes.txt") as check:
    assert check.read() == "buy milk"
assert not os.path.exists("notes.txt.tmp")`,
        },
        {
          name: 'failure keeps the old file and re-raises',
          code: py`import os
with open("prefs.txt", "w") as f:
    f.write("old")
with raises(ValueError):
    with atomic_write("prefs.txt") as f:
        f.write("half-writ")
        raise ValueError("crash mid-write")
with open("prefs.txt") as check:
    assert check.read() == "old"
assert not os.path.exists("prefs.txt.tmp"), 'Delete the temp file on failure'`,
        },
      ],
    },
    {
      id: 'lock-all',
      title: 'Lock every server, or none',
      difficulty: 'advanced',
      prompt: py`A deploy script must lock a **list** of servers (any length) before working. Each server lock is a context manager (\`Resource\`, provided) that logs \`"open <name>"\` when entered and \`"close <name>"\` when exited, and returns its name from \`__enter__\`.

Write \`use_all(resources, log)\` using \`ExitStack\`:

1. enter **every** resource in order;
2. then append \`"work: "\` + the names joined with \`"+"\` to \`log\` (e.g. \`"work: a+b+c"\`);
3. return the list of names;
4. all resources must be exited after the work, in **reverse** order;
5. if entering one fails, the ones already entered must be exited, and the exception must propagate.`,
      files: {
        'main.py': py`from contextlib import ExitStack


class Resource:
    def __init__(self, name, log, fail=False):
        self.name = name
        self.log = log
        self.fail = fail

    def __enter__(self):
        if self.fail:
            raise RuntimeError(f"cannot open {self.name}")
        self.log.append(f"open {self.name}")
        return self.name

    def __exit__(self, exc_type, exc, tb):
        self.log.append(f"close {self.name}")
        return False


def use_all(resources, log):
    # TODO: enter every resource with an ExitStack, then do the "work"
    names = [r.name for r in resources]
    log.append("work: " + "+".join(names))
    return names


log = []
print(use_all([Resource(n, log) for n in ["web1", "web2", "db"]], log))
print(log)
`,
      },
      hints: [
        'Start with: with ExitStack() as stack: — everything else goes inside it.',
        'stack.enter_context(r) enters r and returns what its __enter__ returned (the name).',
        'names = [stack.enter_context(r) for r in resources], then log the work and return names — all inside the with block.',
      ],
      solution: {
        explanation: py`\`enter_context\` both enters each resource and registers its exit. Returning from inside the \`with\` still unwinds the stack, so every resource is closed — last opened, first closed — before the caller gets the names.

If entering \`b\` raises, the exception leaves the \`with ExitStack()\` block, which closes \`a\` (already registered) and lets the error propagate. That's the case a hand-written \`__enter__\` that opens several things often gets wrong. With a fixed, small number of resources you'd write nested \`with\`s; with a list decided at runtime, \`ExitStack\` is the tool.`,
        files: {
          'main.py': py`from contextlib import ExitStack


class Resource:
    def __init__(self, name, log, fail=False):
        self.name = name
        self.log = log
        self.fail = fail

    def __enter__(self):
        if self.fail:
            raise RuntimeError(f"cannot open {self.name}")
        self.log.append(f"open {self.name}")
        return self.name

    def __exit__(self, exc_type, exc, tb):
        self.log.append(f"close {self.name}")
        return False


def use_all(resources, log):
    with ExitStack() as stack:
        names = [stack.enter_context(r) for r in resources]
        log.append("work: " + "+".join(names))
        return names


log = []
print(use_all([Resource(n, log) for n in ["web1", "web2", "db"]], log))
print(log)
`,
        },
      },
      tests: [
        {
          name: 'opens all, works, closes in reverse',
          code: py`log = []
names = use_all([Resource(n, log) for n in ["a", "b", "c"]], log)
assert names == ["a", "b", "c"]
assert log == ["open a", "open b", "open c", "work: a+b+c", "close c", "close b", "close a"]`,
        },
        {
          name: 'a failure closes what was already opened',
          code: py`log = []
with raises(RuntimeError, match="cannot open b"):
    use_all([Resource("a", log), Resource("b", log, fail=True), Resource("c", log)], log)
assert log == ["open a", "close a"]`,
        },
        { name: 'works with no resources', code: py`log = []
assert use_all([], log) == []
assert log == ["work: "]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'contextlib-contextmanager-how',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How does @contextlib.contextmanager turn a generator function into a context manager?',
      answer: 'Calling the decorated function creates a helper object around a new generator. Its __enter__ calls next() to run the setup up to the single yield and returns the yielded value. Its __exit__ either calls next() again to run the cleanup (the generator must then finish), or, if the block raised, throws the exception into the generator at the yield; if the generator finishes without re-raising, the exception is suppressed.',
      explanation: py`That's why \`yield\` must be in \`try/finally\` (the exception appears at the yield), why there must be exactly one yield ("didn't yield"/"didn't stop" errors), and why each manager is single-use (one generator). The helper also inherits \`ContextDecorator\`, so the manager can be used as a decorator.`,
      whyAsked: 'Tests whether you understand generators and the with protocol well enough to see how they combine.',
      mistakes: ['Saying the generator is iterated in a loop', 'Not knowing about throw() and why try/finally is needed', 'Thinking the manager is reusable'],
      followUps: ['What happens if the generator yields twice?', 'How do you suppress an exception in a generator-based manager?', 'When would you still write a class?'],
      modelAnswer: 'The decorator wraps the function so that calling it creates a helper object holding a fresh generator. The helper\'s __enter__ calls next on the generator, which runs my setup code until the yield, and returns the yielded value to the as target. When the block ends normally, __exit__ calls next again so the code after the yield runs, and the generator must finish. If the block raised, __exit__ uses generator.throw to re-raise the exception at the yield line, so a finally there does the cleanup; if my generator catches it and finishes, the exception is suppressed. That\'s why you always put the yield inside try/finally and yield exactly once.',
    },
    {
      id: 'contextlib-redirect-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`import io
from contextlib import redirect_stdout

buf = io.StringIO()
with redirect_stdout(buf):
    print("hidden")
print("shown", repr(buf.getvalue()))` },
      options: ["hidden\nshown ''", "shown 'hidden\\n'", "shown 'hidden'", 'hidden\nshown \'hidden\\n\''],
      correctOption: 1,
      answer: "shown 'hidden\\n' — inside the block print writes to the StringIO (including the newline), and the screen sees only the second print.",
      explanation: py`\`redirect_stdout\` temporarily replaces \`sys.stdout\`. \`print\` adds \`"\n"\` at the end, so the buffer holds \`'hidden\n'\`, and \`repr\` shows the escape.`,
      whyAsked: 'Quick check of what redirect_stdout actually swaps, and attention to detail with print’s newline.',
      mistakes: ['Forgetting the trailing newline', 'Thinking the output is printed and copied'],
      followUps: ['Why is redirect_stdout unsafe in a multithreaded server?', 'How would you capture output from a subprocess instead?'],
      modelAnswer: 'It prints shown followed by the repr of the buffer, which is \'hidden\\n\'. Inside the with block, redirect_stdout points sys.stdout at the StringIO, so the first print writes "hidden" plus its newline into the buffer and nothing reaches the screen. After the block, sys.stdout is restored and the second print appears normally. Because it swaps a global, I only use it in scripts and tests, not in threaded or async code.',
    },
    {
      id: 'contextlib-patched-dict',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Using @contextmanager, write `patched_dict(d, **changes)`: inside the block `d` contains the changes (new keys added, existing keys overwritten) and the block receives `d`; afterwards `d` is restored **exactly** — overwritten keys get their old values back, added keys disappear — even if the block raises.',
      answer: 'Snapshot with saved = dict(d); d.update(changes); try: yield d; finally: d.clear(); d.update(saved).',
      explanation: py`Restoring by clearing and re-filling from a snapshot handles both overwritten and added keys, and keeps the **same dict object** (important when other code holds a reference, like \`os.environ\`). This is what \`unittest.mock.patch.dict\` does for you in tests.`,
      starter: { files: { 'main.py': py`from contextlib import contextmanager


@contextmanager
def patched_dict(d, **changes):
    # TODO: apply changes, yield d, then restore d exactly (even on errors)
    d.update(changes)
    yield d


settings = {"mode": "prod"}
with patched_dict(settings, mode="test", debug=True) as s:
    print("inside:", s)
print("after:", settings)
` } },
      tests: [
        { name: 'changes are visible inside', code: py`d = {"a": 1}
with patched_dict(d, a=2, b=3) as same:
    assert same is d and d == {"a": 2, "b": 3}` },
        { name: 'restored exactly afterwards', code: py`d = {"a": 1}
with patched_dict(d, a=2, b=3):
    pass
assert d == {"a": 1}` },
        {
          name: 'restored even when the block raises',
          code: py`d = {"a": 1}
with raises(KeyError):
    with patched_dict(d, b=2):
        raise KeyError("boom")
assert d == {"a": 1}`,
        },
        { name: 'the same dict object is kept', code: py`d = {"a": 1}
before = id(d)
with patched_dict(d, a=5):
    pass
assert id(d) == before` },
      ],
      solution: { files: { 'main.py': py`from contextlib import contextmanager


@contextmanager
def patched_dict(d, **changes):
    saved = dict(d)            # shallow snapshot of the original contents
    d.update(changes)
    try:
        yield d
    finally:
        d.clear()
        d.update(saved)        # same object, original contents


settings = {"mode": "prod"}
with patched_dict(settings, mode="test", debug=True) as s:
    print("inside:", s)
print("after:", settings)
` } },
      hints: ['Take a copy of the dict before changing it.', 'In finally: empty the dict and refill it from the copy — don’t rebind the name.'],
      whyAsked: 'Shows correct use of try/finally around yield and careful state restoration — the same idea as mock.patch.dict.',
      mistakes: ['Restoring only the changed keys and leaving added ones', 'Rebinding d = saved (callers still see the patched object)', 'No try/finally'],
      followUps: ['Is this safe if another thread reads the dict during the block?', 'How would you patch os.environ in a real test?'],
      modelAnswer: 'I take a shallow snapshot with dict(d), apply the changes with update, and yield d inside try/finally. In the finally I clear the dict and update it from the snapshot, which restores overwritten keys and removes added ones while keeping the same dict object — that matters because other code may hold a reference to it, like os.environ. Because the restore is in finally, it runs even if the block raises, and I don\'t catch anything, so errors still propagate. In real tests I would just use unittest.mock.patch.dict.',
    },
    {
      id: 'contextlib-exitstack-dynamic',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A job must open a connection to every shard listed in a config file (anywhere from 2 to 50), run a query on all of them, and guarantee every connection is closed — including when connecting to shard 17 fails. How do you structure it, and what if a helper function should acquire the connections but the caller should own them?',
      answer: 'Use ExitStack: enter_context each connection in a loop inside one with ExitStack() block, so any failure unwinds the ones already opened, in reverse. To hand ownership to a caller, open them inside a with ExitStack() in the helper and return stack.pop_all() (plus the connections) only after all succeeded; the caller then uses the returned stack in its own with.',
      explanation: py`Nested \`with\` statements need the count at coding time; \`ExitStack\` handles a runtime list. \`pop_all()\` transfers the registered cleanups to a new stack, so the helper's \`with\` exits without closing anything on success, while on failure the helper's \`with\` still cleans up. The async equivalent is \`AsyncExitStack\` with \`enter_async_context\`.`,
      code: { lang: 'python', code: py`from contextlib import ExitStack


def connect_all(shards, connect):
    with ExitStack() as stack:
        conns = [stack.enter_context(connect(s)) for s in shards]
        return conns, stack.pop_all()      # success: caller now owns the cleanup


# caller:
# conns, cleanup = connect_all(shards, connect)
# with cleanup:
#     results = [c.query(sql) for c in conns]` },
      whyAsked: 'Resource management with a dynamic number of resources is a real production problem; ExitStack knowledge is a strong senior signal.',
      mistakes: ['Opening in a loop with a list and closing in a finally loop (misses partial-failure edge cases and exceptions during close)', 'Nesting with statements via recursion'],
      followUps: ['What happens if closing one connection raises?', 'How would you do this with asyncio?'],
      modelAnswer: 'I would use contextlib.ExitStack. Inside one with ExitStack() block I loop over the shards and call enter_context on each connection, which enters it and registers its exit. If connecting to shard 17 fails, the exception leaves the block and the stack closes the sixteen already open, in reverse order, and every close runs even if one of them raises. If a helper should acquire the connections but the caller should own them, the helper does the same loop and then returns stack.pop_all(), which moves the cleanups to a new stack only once everything succeeded; the caller uses that in its own with. In async code the same pattern uses AsyncExitStack.',
    },
    {
      id: 'contextlib-class-vs-generator',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you write a context manager as a class instead of using @contextmanager?',
      answer: 'Use @contextmanager for simple setup/yield/cleanup. Use a class when the manager needs to be reusable or reentrant, carries state or methods callers interact with, needs fine control over which exceptions to suppress, is performance-critical in a hot path, or when the object itself is the resource (like a file or connection) that also supports with.',
      explanation: py`Generator-based managers are single-use and keep their state in local variables you can't reach from outside. Classes can implement reentrancy (\`RLock\`), offer methods (\`stack.callback\`), and are the natural shape when the object is the resource. Generators win on brevity and on keeping setup and cleanup next to each other.`,
      whyAsked: 'A design-judgement question: knowing both tools and their trade-offs.',
      mistakes: ['Claiming generators cannot handle exceptions', 'Always preferring one style dogmatically'],
      followUps: ['What does "reentrant" mean for a context manager?', 'How does AbstractContextManager help when writing a class?'],
      modelAnswer: 'For small "do this before, that after" managers I use @contextmanager — the setup, yield and cleanup read top to bottom and there\'s less code. I switch to a class when the manager needs to be reusable or reentrant, since generator-based ones are single-use; when it has state or methods callers use, like ExitStack.callback; when the object is itself the resource, like a connection that also supports with; or in a measured hot path where the extra generator machinery matters. With a class I often subclass AbstractContextManager to get the default __enter__.',
    },
    {
      id: 'contextlib-global-state',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A web service wraps a report generator in `with redirect_stdout(buffer):` to capture its output per request. Under load, some responses contain text from other requests and some log lines vanish. Why, and what would you do instead?',
      answer: 'redirect_stdout replaces the process-wide sys.stdout, so while one request’s block is active, every thread or asyncio task printing anywhere writes into that request’s buffer; when blocks overlap, restoring order gets mixed up too. Instead make the report function write to an explicit stream parameter (or return a string), and use logging for logs.',
      explanation: py`The docs state \`redirect_stdout\` has a global side effect and isn't suitable for library code or most threaded applications. Same for \`chdir\`. Per-request state belongs in function parameters or \`contextvars\`, not process globals.`,
      code: { lang: 'python', code: py`import io


def write_report(rows, out):           # the stream is a parameter, not a global
    for row in rows:
        print(*row, sep=",", file=out)


buffer = io.StringIO()
write_report([("tea", 3.5), ("scone", 2.25)], buffer)
print(buffer.getvalue())` },
      whyAsked: 'Separates people who know what a tool does from people who know its limits in concurrent systems.',
      mistakes: ['Adding a lock around redirect_stdout (serialises the whole server)', 'Blaming the StringIO'],
      followUps: ['What are contextvars for?', 'Which other contextlib helpers have global side effects?'],
      modelAnswer: 'redirect_stdout works by swapping sys.stdout, which is a single global for the whole process. In a server with threads or asyncio tasks, while one request is inside the block, anything printed by any other request goes into that request\'s buffer, and overlapping blocks restore stdout in the wrong order, so output leaks between responses or disappears. The fix is to stop relying on global output: make the report function take an output stream or return a string, and send diagnostics through logging. chdir has the same problem with the working directory.',
    },
  ],

  takeaways: [
    '@contextmanager turns a generator that yields once into a context manager: before yield = enter, yielded value = as target, after yield = exit.',
    'Always put yield inside try/finally — exceptions from the block are re-raised at the yield.',
    'Catching an exception in the generator without re-raising suppresses it; re-raise unless that is the point.',
    'Generator-based managers are single-use: call the function for each with. They also work as decorators.',
    'ExitStack manages a runtime-sized set of managers and callbacks, unwinding them in reverse; pop_all() transfers ownership.',
    'suppress, redirect_stdout, closing, nullcontext and chdir (3.11+) cover common needs — but redirect_stdout and chdir change process-wide state.',
    'Async code uses async with and the async twins: asynccontextmanager, AsyncExitStack, aclosing.',
  ],
}
