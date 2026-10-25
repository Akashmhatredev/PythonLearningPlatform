// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const BANK = py`import time


class Timer:
    """Measure how long the with-block takes."""

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.elapsed = time.perf_counter() - self.start
        return False                      # never hide an error


class Transaction:
    """All-or-nothing changes to an accounts dict."""

    def __init__(self, accounts):
        self.accounts = accounts

    def __enter__(self):
        self.snapshot = dict(self.accounts)   # remember the state
        return self.accounts

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            print("  commit")
        else:
            self.accounts.clear()
            self.accounts.update(self.snapshot)   # roll back
            print(f"  rollback ({exc_type.__name__}: {exc})")
        return False                          # let the error propagate


def transfer(accounts, source, target, amount):
    with Transaction(accounts) as acc:
        acc[source] -= amount
        if acc[source] < 0:
            raise ValueError(f"{source} has insufficient funds")
        acc[target] += amount


accounts = {"ada": 100, "ben": 20}

with Timer() as timer:
    print("transfer 30 ada -> ben")
    transfer(accounts, "ada", "ben", 30)
    print("transfer 500 ben -> ada")
    try:
        transfer(accounts, "ben", "ada", 500)
    except ValueError as err:
        print("  failed:", err)

print("balances:", accounts)
print(f"took {timer.elapsed * 1000:.2f} ms")
`

export default {
  id: 'context-managers',
  title: 'Context managers & the with statement',
  summary: 'A context manager pairs setup with guaranteed cleanup: with calls __enter__ before the block and __exit__ after it — on success, on return, and even when an exception is raised.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['try-except', 'classes-and-objects'],
  related: ['contextlib', 'reading-writing-files', 'special-methods', 'raising-exceptions', 'error-handling-patterns', 'decorators', 'threading', 'sql-and-sqlite', 'database-patterns', 'asyncio-in-practice', 'memory-management', 'mocking', 'pathlib'],
  tags: ['with', 'context manager', '__enter__', '__exit__', 'cleanup', 'resources', 'try/finally', 'exception suppression', 'files', 'locks', 'transactions', 'rollback', 'timer', 'parenthesized context managers'],
  apis: [
    { name: 'with EXPR as NAME:', summary: 'Calls EXPR.__enter__(), binds its return value to NAME, runs the block, then always calls __exit__.' },
    { name: '__enter__(self)', summary: 'Setup. Its return value is what "as" binds (often self, or the resource).' },
    { name: '__exit__(self, exc_type, exc_value, traceback)', summary: 'Cleanup. Receives exception details (or three Nones); returning a true value suppresses the exception.' },
    { name: 'with A() as a, B() as b:', summary: 'Several managers in one statement: entered left to right, exited right to left.' },
    { name: 'with (A() as a, B() as b):', summary: 'Parenthesised form for long lists of managers (officially 3.10+).' },
    { name: 'decimal.localcontext()', summary: 'Temporarily change decimal precision/rounding inside a with block.' },
  ],
  docs: [
    { label: 'Language reference — the with statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-with-statement' },
    { label: 'Data model — with statement context managers', url: 'https://docs.python.org/3/reference/datamodel.html#with-statement-context-managers' },
    { label: 'Library — context manager types', url: 'https://docs.python.org/3/library/stdtypes.html#typecontextmanager' },
    { label: 'PEP 343 — the "with" statement', url: 'https://peps.python.org/pep-0343/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Lots of things in programming come in **pairs**: open a file / close it, take a lock / release it, start a database transaction / commit or roll it back, change a setting / change it back. The second half of each pair is *cleanup*, and it must happen **no matter what** — even if the code in between crashes.`,
    py`A **context manager** is an object that knows how to do both halves. The \`with\` statement uses it:`,
    { code: py`with open("notes.txt", "w") as f:     # setup: open the file
    f.write("buy milk\n")              # the body: use it
# cleanup: the file is closed here — even if write() raised`, lang: 'python', title: 'the with statement' },
    py`Under the hood, \`with\` calls the object's \`__enter__\` method before the block and its \`__exit__\` method after it. Any class that defines those two **special methods** (see [special methods](lesson:special-methods)) is a context manager — and in this lesson you'll write several: a timer, an all-or-nothing transaction, a temporary setting and an error catcher.`,
    py`The [contextlib](lesson:contextlib) lesson that follows shows shortcuts for writing them; here you learn the protocol itself, which everything else is built on.`,
  ],
  why: [
    py`Forgetting cleanup causes some of the nastiest bugs: files that never get flushed, locks that are never released (the program freezes), database connections that pile up until the server refuses new ones, temporary settings that "leak" into the rest of the program.`,
    py`You *can* guarantee cleanup with [try/finally](lesson:try-except), but you have to remember it every single time, and the setup and cleanup end up far apart. A context manager packages the pair once. Every \`with\` that uses it gets correct cleanup for free, and readers see at a glance where a resource's lifetime begins and ends.`,
    py`It also handles the hard edge cases for you: an exception in the middle, a \`return\` from inside the block, a \`break\` out of a loop. All of them still run \`__exit__\`.`,
  ],
  eli15: [
    py`Think about borrowing the school's football. You **sign it out** at the office (that's \`__enter__\`), you **play** (the body of the \`with\`), and then it **must be returned** (that's \`__exit__\`).`,
    py`A \`with\` block is like a super-strict PE teacher who stands at the door: however the game ends — the bell rings, it starts raining, someone gets hurt and everyone runs inside — the teacher makes sure the ball goes back in the cupboard.`,
    py`The teacher even hears *why* the game ended ("someone got hurt!") and could decide to keep quiet about it. But a good teacher reports it, so the right people can deal with it. In Python terms: \`__exit__\` sees the exception, and should almost always let it carry on.`,
  ],
  analogy: {
    title: 'Booking a meeting room',
    body: [
      py`At reception you **check in**: they mark the room busy and hand you a key card. You **use the room**. When you leave, reception **checks you out** and frees the room — whether the meeting ended normally, ended early, or everyone ran out because of a fire alarm.`,
      py`Reception also learns *how* you left. If it was the fire alarm, they note it and let the alarm keep ringing (the exception keeps propagating). They *could* switch the alarm off and pretend nothing happened — that's what returning \`True\` from \`__exit__\` does — but you'd only want that for alarms you know are harmless.`,
    ],
    mapping: [
      ['checking in at reception', '__enter__() runs'],
      ['the key card you are handed', 'the value bound by "as"'],
      ['using the room', 'the body of the with block'],
      ['checking out, however you leave', '__exit__() always runs'],
      ['reception hears about the fire alarm', '__exit__ receives exc_type, exc_value, traceback'],
      ['letting the alarm keep ringing', '__exit__ returns False/None → exception propagates'],
      ['switching the alarm off', '__exit__ returns True → exception suppressed (rarely right)'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'enter → body → exit, with and without an error',
    props: {
      code: py`class Room:
    def __init__(self, name):
        self.name = name
        self.booked = False

    def __enter__(self):
        self.booked = True
        print("check in:", self.name)
        return self

    def __exit__(self, exc_type, exc, tb):
        self.booked = False
        print("check out:", self.name, "| error:", exc)
        return False


with Room("Blue") as room:
    print("meeting in", room.name)

try:
    with Room("Red") as room:
        raise ValueError("fire alarm!")
except ValueError as err:
    print("caught outside:", err)
`,
      notes: {
        17: '`Room("Blue")` is created first, then Python calls its `__enter__`. Watch a new frame appear.',
        9: '`__enter__` returns `self`, so `as room` binds `room` to the Room object.',
        18: 'The body runs. When it finishes, Python calls `__exit__(None, None, None)` — three Nones mean "no error".',
        22: 'An exception is raised inside the body…',
        11: '…and **before** it escapes, `__exit__` is called with the exception type, the exception object and the traceback.',
        14: 'Returning `False` means "don\'t suppress": the exception continues outwards after cleanup.',
        24: 'The `except` outside the `with` catches it. Cleanup already happened: the room is no longer booked.',
      },
    },
    alt: 'A step-by-step trace. Room("Blue") is created; __enter__ runs, sets booked to True, prints check in and returns self, which is bound to room. The body prints meeting in Blue. __exit__ runs with exc None, sets booked to False and prints check out. Then Room("Red") is entered, the body raises ValueError, __exit__ runs with the ValueError, prints check out with the error and returns False, so the exception propagates to the except clause, which prints caught outside: fire alarm!.',
    caption: py`The key moment is the second \`__exit__\`: it runs *while the exception is in flight*, gets to see it, cleans up, and then lets it continue.`,
  },
  syntax: [
    py`#### The statement`,
    { code: py`with EXPRESSION as TARGET:    # "as TARGET" is optional
    BODY`, lang: 'python', static: true, title: 'shape' },
    py`1. \`EXPRESSION\` is evaluated to get the **context manager** object.
2. Its \`__enter__()\` is called. The return value is bound to \`TARGET\` (if there is an \`as\`).
3. \`BODY\` runs.
4. However the body ends — normally, \`return\`, \`break\`, \`continue\` or an exception — \`__exit__()\` is called.`,
    { callout: 'warn', title: '"as" binds what __enter__ returns', text: py`\`as\` doesn't bind the manager — it binds \`__enter__\`'s return value. \`open()\` returns a file whose \`__enter__\` returns the file itself, so it *looks* the same, but many managers return something else (a lock's \`__enter__\` returns \`True\`; our \`Transaction\` returns the accounts dict). If \`__enter__\` forgets to return anything, \`as\` binds \`None\`.` },
    py`#### The protocol`,
    { code: py`class Timer:
    def __enter__(self):
        import time
        self.start = time.perf_counter()
        return self                     # bound to the "as" target

    def __exit__(self, exc_type, exc_value, traceback):
        import time
        self.elapsed = time.perf_counter() - self.start
        return False                    # False/None: don't suppress exceptions


with Timer() as t:
    total = sum(range(100_000))
print(f"summed in {t.elapsed:.4f} s")`, lang: 'python', title: 'a class-based context manager' },
    py`\`__exit__\` always receives three arguments:`,
    py`| argument | no exception | an exception was raised in the body |
|---|---|---|
| \`exc_type\` | \`None\` | the exception class, e.g. \`ValueError\` |
| \`exc_value\` | \`None\` | the exception object (\`str(exc_value)\` is the message) |
| \`traceback\` | \`None\` | a traceback object (where it happened) |`,
    py`Its **return value** only matters when there was an exception: a *truthy* value tells Python to **suppress** it (carry on after the \`with\` as if nothing happened); \`False\` or \`None\` (the default when you don't return anything) lets it propagate.`,
    { callout: 'warn', title: 'Suppressing is rarely what you want', text: py`Swallowing exceptions hides bugs: the caller believes the work succeeded. Suppress only specific, expected exception types you have genuinely handled — and prefer \`contextlib.suppress(FileNotFoundError)\`, which says so explicitly (see [contextlib](lesson:contextlib)).` },
    py`#### Several managers at once`,
    { code: py`# enter left to right, exit right to left (like nested withs)
with open("in.txt", "w") as src, open("out.txt", "w") as dst:
    dst.write("copied")

# Python 3.10+: parentheses allow one manager per line
with (
    open("in.txt") as src,
    open("out.txt", "w") as dst,
):
    dst.write(src.read())`, lang: 'python', title: 'multiple managers' },
    { callout: 'version', title: 'Parenthesised context managers: 3.10', text: py`The bracketed, multi-line form is officially supported from **Python 3.10** (it happened to work in 3.9 thanks to the new parser, but wasn't documented until 3.10). Before that, long lists needed backslashes or nested \`with\` statements — or \`contextlib.ExitStack\`.` },
    py`#### Context managers you already use`,
    { code: py`import decimal
import sqlite3

with open("log.txt", "w") as f:          # file: closed on exit
    f.write("started\n")

with decimal.localcontext() as ctx:       # temporary decimal settings
    ctx.prec = 3
    print(decimal.Decimal(1) / decimal.Decimal(7))   # 0.143
print(decimal.Decimal(1) / decimal.Decimal(7))       # back to 28 digits

conn = sqlite3.connect(":memory:")
with conn:                                 # a TRANSACTION: commit on success, rollback on error
    conn.execute("CREATE TABLE stock (item TEXT, qty INTEGER)")
conn.close()                               # with conn did NOT close it`, lang: 'python', title: 'standard-library managers' },
    { code: py`import threading

balance_lock = threading.Lock()

def deposit(account, amount):
    with balance_lock:                   # acquire... (released even on error)
        account["balance"] += amount`, lang: 'python', static: true, title: 'locks (threads cannot start in this sandbox)' },
    py`Locks are the classic case: a lock that isn't released because of an exception freezes every other thread waiting for it. \`with lock:\` makes that impossible — see [threads, locks & race conditions](lesson:threading).`,
  ],
  walkthrough: {
    title: 'Reading the bank transfer program',
    lang: 'python',
    code: BANK,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 13], text: py`\`Timer\` records the clock in \`__enter__\` and computes the elapsed time in \`__exit__\`. It returns \`self\` so \`as timer\` gives access to \`timer.elapsed\` after the block.` },
      { lines: [16, 24], text: py`\`Transaction\` gets the accounts dict in \`__init__\`. \`__enter__\` takes a **snapshot** (a shallow copy) of the current state, then returns the dict itself so the body can change it.` },
      { lines: [26, 33], text: py`\`__exit__\` decides: no exception → commit (here just a message); exception → restore the snapshot. Either way it returns \`False\`, so errors still reach the caller.` },
      { lines: [36, 41], text: py`\`transfer\` does two updates. If the second step fails — or a check raises — the snapshot is restored, so money never vanishes halfway through. That's what *atomic* (all-or-nothing) means.` },
      { lines: [46, 48], text: py`The outer \`with Timer()\` wraps everything. Inside, the first transfer succeeds: you'll see "commit".` },
      { lines: [49, 53], text: py`The second transfer would leave ben at -470, so it raises. \`__exit__\` rolls back, then the \`ValueError\` continues to the \`except\` here, which reports it.` },
      { lines: [55, 56], text: py`The balances show only the successful transfer. The timer's \`__exit__\` ran when its block ended, so \`timer.elapsed\` is ready.` },
    ],
  },
  playground: {
    title: 'All-or-nothing bank transfers',
    objective: 'Run it, then break and fix the transaction to see exactly when __enter__ and __exit__ run.',
    files: { 'main.py': BANK },
    expected: py`\`\`\`text
transfer 30 ada -> ben
  commit
transfer 500 ben -> ada
  rollback (ValueError: ben has insufficient funds)
  failed: ben has insufficient funds
balances: {'ada': 70, 'ben': 50}
took 0.05 ms
\`\`\`

(The time varies.)`,
    experiments: [
      {
        id: 'missing-account',
        task: py`Inside the \`with Timer()\` block, add a transfer of 10 from \`"ada"\` to \`"cy"\` — who has no account — wrapped in \`try/except KeyError\`. Predict ada's final balance.`,
        hint: py`\`acc["ada"] -= 10\` succeeds, then \`acc["cy"] += 10\` raises \`KeyError\`. What does \`__exit__\` do with the snapshot?`,
        tests: [
          { name: 'the failed transfer was rolled back', code: py`assert 'rollback (KeyError' in output, 'Transfer to "cy" inside try/except KeyError'` },
          { name: 'ada did not lose the 10', code: py`assert accounts["ada"] == 70 and "cy" not in accounts` },
        ],
        explain: py`ada was debited *before* the error. Because \`__exit__\` restores the snapshot whenever an exception passes through, the half-finished transfer disappears. Without the context manager you'd need a \`try/except\` with manual undo code in every function that changes accounts.`,
      },
      {
        id: 'begin',
        task: py`Make \`Transaction.__enter__\` print \`"  begin"\`. Predict where the two "begin" lines appear.`,
        hint: py`Add \`print("  begin")\` before the \`return\` in \`__enter__\`.`,
        tests: [
          { name: 'two transactions began', code: py`assert output.count('begin') == 2` },
          { name: 'begin comes before commit', code: py`assert output.index('begin') < output.index('commit')` },
        ],
        explain: py`Each \`with\` calls \`__enter__\` exactly once before its body and \`__exit__\` exactly once after. Every "begin" is matched by a "commit" or a "rollback".`,
      },
      {
        id: 'exit-on-return',
        task: py`Add a function \`balance(accounts, name)\` that opens a \`Transaction\` and **returns** \`acc[name]\` from inside the \`with\` block. Call \`print(balance(accounts, "ada"))\` at the end. Does \`__exit__\` still run?`,
        hint: py`Define it above the \`accounts = ...\` line: \`def balance(accounts, name):\`, then an indented \`with Transaction(accounts) as acc:\`, then (indented again) \`return acc[name]\`.`,
        tests: [
          { name: 'balance() exists and works', code: py`assert callable(ns.get('balance')), 'Define balance(accounts, name)'
assert balance({"x": 5}, "x") == 5` },
          { name: '__exit__ ran on return (a second commit)', code: py`assert output.count('commit') == 2` },
        ],
        explain: py`\`return\` leaves the block, and leaving the block — by any route — triggers \`__exit__\`. The return value is computed first, then \`__exit__\` runs, then the function actually returns.`,
      },
      {
        id: 'swallow',
        task: py`Change \`Transaction.__exit__\` to \`return True\`. Run it. What disappeared from the output, and why is that dangerous?`,
        hint: py`Only the last line of \`Transaction.__exit__\` changes.`,
        tests: [
          { name: 'the error never reached the caller', code: py`assert 'failed:' not in output and 'rollback' in output` },
        ],
        explain: py`Returning a true value **suppresses** the exception: the rollback still happens, but the caller's \`except\` never runs, so \`transfer\` looks like it succeeded. Code that then tells the user "transfer complete" would be lying. Change it back — managers should almost always return \`False\`/\`None\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The two paths through a with statement',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'expr', label: 'Room("Red")', note: 'evaluate the manager', x: 90, y: 70, tone: 'paper' },
        { id: 'enter', label: '__enter__()', note: 'setup; result → as target', x: 290, y: 70, tone: 'blue' },
        { id: 'body', label: 'with body', note: 'your code', x: 490, y: 70, tone: 'yellow' },
        { id: 'exit', label: '__exit__(type, value, tb)', note: 'always runs', x: 490, y: 240, tone: 'blue' },
        { id: 'after', label: 'code after the with', note: 'continues normally', x: 690, y: 160, tone: 'paper' },
        { id: 'raise', label: 'exception propagates', note: 'to the nearest except', x: 200, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'expr', to: 'enter', label: 'then' },
        { from: 'enter', to: 'body', label: 'then' },
        { id: 'ok', from: 'body', to: 'exit', label: 'finished / return / error' },
        { id: 'fine', from: 'exit', to: 'after', label: 'no error, or returned True' },
        { id: 'bad', from: 'exit', to: 'raise', label: 'error and returned False/None' },
      ],
      steps: [
        { focus: ['expr'], text: py`The expression after \`with\` is evaluated to get the context manager object.` },
        { focus: ['enter'], edges: ['expr->enter'], text: py`Python looks up \`__enter__\` on the object's **type** and calls it. If \`__enter__\` itself raises, the \`with\` never starts — and \`__exit__\` is **not** called.` },
        { focus: ['body'], edges: ['enter->body'], text: py`The return value of \`__enter__\` is bound to the \`as\` target, then the body runs.` },
        { focus: ['body', 'exit'], edges: ['ok'], text: py`However the body ends, \`__exit__\` is called. On a normal finish (or \`return\`/\`break\`) it gets \`(None, None, None)\`; on an exception it gets the type, the exception object and the traceback.` },
        { focus: ['exit', 'after'], edges: ['fine'], text: py`No exception → execution continues after the \`with\`. If there *was* an exception and \`__exit__\` returned a truthy value, the exception is swallowed and execution also continues here.` },
        { focus: ['exit', 'raise'], edges: ['bad'], text: py`Exception and a falsy return (the normal case) → after cleanup, the same exception keeps travelling up to the nearest \`except\`. Cleanup happened; the error is not hidden.` },
      ],
    },
    alt: 'Flow diagram: the manager expression is evaluated, __enter__ runs, then the with body. However the body ends, __exit__(type, value, tb) runs. If there was no error, or __exit__ returned True, execution continues after the with. If there was an error and __exit__ returned False or None, the exception propagates to the nearest except.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`with\` statement is a \`try/finally\` in a nicer outfit. These two do the same job:`,
      { code: py`f = open("data.txt", "w")
try:
    f.write("hello")
finally:
    f.close()

with open("data.txt", "w") as f:
    f.write("hello")`, lang: 'python', title: 'try/finally vs with' },
      py`The difference: with \`try/finally\` *you* must remember the cleanup every time. With a context manager the object *knows* its own cleanup, so the \`with\` version can't forget.`,
    ],
    technical: [
      py`#### The exact expansion`,
      py`The language reference (following [PEP 343](https://peps.python.org/pep-0343/)) defines \`with EXPRESSION as TARGET: SUITE\` as semantically equivalent to:`,
      { code: py`manager = (EXPRESSION)
enter = type(manager).__enter__
exit = type(manager).__exit__
value = enter(manager)
hit_except = False

try:
    TARGET = value
    SUITE
except:
    hit_except = True
    if not exit(manager, *sys.exc_info()):
        raise
finally:
    if not hit_except:
        exit(manager, None, None, None)`, lang: 'python', static: true, title: 'from the language reference' },
      py`Things worth noticing:`,
      py`- \`__enter__\` and \`__exit__\` are looked up on the **type**, not the instance — like all special methods. Setting \`obj.__exit__ = ...\` on an instance has no effect.
- \`__exit__\` is fetched *before* \`__enter__\` runs, so an object without \`__exit__\` fails immediately (3.14 says: \`TypeError: 'Timer' object does not support the context manager protocol (missed __exit__ method)\`; older versions word it differently).
- If \`__enter__\` raises, we never reach the \`try\`, so \`__exit__\` is **not** called. A manager that acquires two things in \`__enter__\` must clean up the first if the second fails.
- Suppression only applies to exceptions. A \`return\` or \`break\` inside the body still returns or breaks after \`__exit__\` runs.
- If \`__exit__\` itself raises, that new exception replaces the original, which is attached as its \`__context__\` (see [exception chaining](lesson:raising-exceptions)).`,
      py`#### Single-use, reusable, reentrant`,
      py`The [contextlib docs](https://docs.python.org/3/library/contextlib.html#single-use-reusable-and-reentrant-context-managers) name three kinds. A file object is **single-use** (after it's closed you can't \`with\` it again). A \`threading.Lock\` is **reusable** (you can use it in many \`with\` statements, one after another) but not **reentrant** — acquiring it again inside its own \`with\` in the same thread deadlocks; \`threading.RLock\` is reentrant. When you design a manager, decide which kind it is and document it.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython compiles \`with\` into bytecode that loads the special methods from the type, calls \`__enter__\`, and registers an entry in the code object's exception table so that every exit path from the block — including exceptions — jumps to code that calls \`__exit__\`. You can see it with \`dis\`; the exact opcodes have changed several times across 3.x releases and differ in other implementations.` },
    ],
    production: [
      py`**Acquire in \`__enter__\`, not \`__init__\`.** If the constructor opens a connection and the \`with\` is never reached (an exception between the two), nothing cleans it up. Constructors should only store configuration.`,
      py`**Make cleanup idempotent and robust.** \`close()\` called twice should be harmless. Cleanup code should not raise unless something is truly wrong — an exception from \`__exit__\` replaces the original error, and the original one is what you need for debugging.`,
      py`**Know what the library's manager actually does.** \`with sqlite3.connect(path) as conn:\` manages a **transaction** (commit on success, rollback on error) but does **not close** the connection. Close it explicitly or wrap it in \`contextlib.closing(...)\`. Most database libraries follow similar patterns — read the docs. See [SQL & sqlite3](lesson:sql-and-sqlite) and [database patterns](lesson:database-patterns).`,
      py`**Use \`with\` for everything with a lifetime:** files, locks, sockets, HTTP sessions, temporary directories (\`tempfile.TemporaryDirectory()\`), thread pools (\`ThreadPoolExecutor\` waits for its workers on exit), \`zipfile.ZipFile\`, \`warnings.catch_warnings()\`, \`unittest.mock.patch(...)\` in tests (see [mocking](lesson:mocking)).`,
      py`**Async code uses \`async with\`**, which calls \`await obj.__aenter__()\` and \`await obj.__aexit__(...)\` — for things whose setup or cleanup has to wait on I/O, such as network connections. See [contextlib](lesson:contextlib) and [asyncio in practice](lesson:asyncio-in-practice).`,
      py`**Don't rely on \`__del__\` for cleanup.** When an object's \`__del__\` runs depends on the garbage collector — CPython usually runs it promptly thanks to reference counting, but other implementations (like PyPy) may run it much later, and reference cycles delay it even in CPython. Deterministic cleanup is exactly what \`with\` is for. See [memory management](lesson:memory-management).`,
    ],
  },
  mistakes: [
    {
      title: '__enter__ forgets to return anything',
      wrong: { code: py`class Logger:
    def __enter__(self):
        self.lines = []          # no return → returns None

    def __exit__(self, exc_type, exc, tb):
        return False

with Logger() as log:
    log.lines.append("start")   # AttributeError: 'NoneType' object has no attribute 'lines'`, lang: 'python', static: true },
      right: { code: py`class Logger:
    def __enter__(self):
        self.lines = []
        return self              # what "as log" will bind

    def __exit__(self, exc_type, exc, tb):
        return False

with Logger() as log:
    log.lines.append("start")`, lang: 'python' },
      explanation: py`\`as\` binds the return value of \`__enter__\`. A function with no \`return\` returns \`None\`.`,
    },
    {
      title: 'Accidentally suppressing every exception',
      wrong: { code: py`class Session:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return self.close()      # close() returns True → errors vanish!

    def close(self):
        print("closed")
        return True`, lang: 'python' },
      right: { code: py`class Session:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()
        return False             # explicit: never suppress

    def close(self):
        print("closed")
        return True`, lang: 'python' },
      explanation: py`Any truthy return value from \`__exit__\` suppresses the exception — even one that comes from an unrelated helper. End \`__exit__\` with an explicit \`return False\` (or no return at all).`,
    },
    {
      title: 'Using the resource after the with block',
      wrong: { code: py`with open("report.txt", "w") as f:
    f.write("Q1: 120\n")
f.write("Q2: 95\n")          # ValueError: I/O operation on closed file.`, lang: 'python', static: true },
      right: { code: py`with open("report.txt", "w") as f:
    f.write("Q1: 120\n")
    f.write("Q2: 95\n")`, lang: 'python' },
      explanation: py`The name \`f\` still exists after the block (a \`with\` doesn't create a new scope), but the file it refers to has been closed. Do all the work inside the block.`,
    },
    {
      title: 'Assuming "with connection" closes the connection',
      wrong: { code: py`import sqlite3

with sqlite3.connect(":memory:") as conn:
    conn.execute("CREATE TABLE t (x)")
# the transaction is committed — but conn is still OPEN`, lang: 'python' },
      right: { code: py`import sqlite3
from contextlib import closing

with closing(sqlite3.connect(":memory:")) as conn:
    with conn:                               # transaction
        conn.execute("CREATE TABLE t (x)")
# committed AND closed`, lang: 'python' },
      explanation: py`A context manager does whatever its author decided. For \`sqlite3.Connection\`, \`with\` means "one transaction". Leaked connections hold file locks and memory until garbage-collected.`,
    },
    {
      title: 'Acquiring the resource in __init__',
      wrong: { code: py`class Upload:
    def __init__(self, path):
        self.file = open(path, "w")   # opened before the with starts

    def __enter__(self):
        return self.file

    def __exit__(self, exc_type, exc, tb):
        self.file.close()
        return False`, lang: 'python' },
      right: { code: py`class Upload:
    def __init__(self, path):
        self.path = path              # only remember settings

    def __enter__(self):
        self.file = open(self.path, "w")
        return self.file

    def __exit__(self, exc_type, exc, tb):
        self.file.close()
        return False`, lang: 'python' },
      explanation: py`If anything goes wrong between creating the object and entering the \`with\` (or the object is created but never used in a \`with\`), the wrong version leaks an open file. Acquire in \`__enter__\`, release in \`__exit__\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'Timer' object does not support the context manager protocol (missed __exit__ method)`,
      cause: py`The class is missing \`__exit__\` (or \`__enter__\`), or the method name is misspelled (\`__exit\`, \`_exit_\`), or it was defined on the instance instead of the class.`,
      fix: py`Define both \`__enter__(self)\` and \`__exit__(self, exc_type, exc, tb)\` in the class body with exactly two underscores on each side.`,
    },
    {
      symptom: py`TypeError: Timer.__exit__() takes 1 positional argument but 4 were given`,
      cause: py`\`__exit__\` was declared as \`def __exit__(self)\`; Python always passes the three exception arguments.`,
      fix: py`Use \`def __exit__(self, exc_type, exc, tb)\` (or \`def __exit__(self, *exc_info)\`).`,
    },
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute '…' on the "as" variable`,
      cause: py`\`__enter__\` didn't return anything, so \`as\` bound \`None\`.`,
      fix: py`Return \`self\` (or the resource) from \`__enter__\`.`,
    },
    {
      symptom: py`ValueError: I/O operation on closed file.`,
      cause: py`The file object is used after its \`with\` block ended.`,
      fix: py`Move the code inside the block, or re-open the file.`,
    },
    {
      symptom: py`An error clearly happened (you saw the cleanup message) but no traceback, and the program carried on`,
      cause: py`\`__exit__\` returned a truthy value and suppressed the exception.`,
      fix: py`Return \`False\`/\`None\` from \`__exit__\`; suppress only specific expected types, explicitly.`,
    },
    {
      symptom: py`The traceback shows an error from the cleanup code instead of the real problem`,
      cause: py`\`__exit__\` raised while handling the original exception; the original is attached as context ("During handling of the above exception, another exception occurred").`,
      fix: py`Read the first traceback in the chain — that's the root cause — and make the cleanup code robust (e.g. check whether the resource was actually acquired).`,
    },
  ],
  bestPractices: [
    'Use with for every resource that has to be released: files, locks, connections, temporary state.',
    'Acquire in __enter__, release in __exit__; keep __init__ to storing settings.',
    'Return self or the resource from __enter__ — whatever the as target should be.',
    'Return False (or nothing) from __exit__ unless you deliberately handle a specific exception type.',
    'Make cleanup idempotent and avoid raising from __exit__; the original exception matters most.',
    'Read the docs for library managers — some manage transactions rather than closing (sqlite3).',
    'Combine managers in one with statement (parenthesised on 3.10+) instead of deep nesting.',
  ],
  useCases: [
    'Opening and closing files, sockets and network sessions.',
    'Acquiring and releasing locks and semaphores in threaded code.',
    'Database transactions: commit on success, roll back on error.',
    'Temporarily changing state and restoring it: settings, environment variables, decimal precision, the current directory.',
    'Timing a block of code or recording metrics around it.',
    'Patching objects in tests (unittest.mock.patch) and catching expected warnings.',
  ],
  whenToUse: {
    use: [
      'Something must be undone or released after a block, whatever happens inside it.',
      'Setup and cleanup always come as a pair and you want them defined together.',
      'You want a visible, indented region where a resource or temporary state is active.',
    ],
    avoid: [
      'There is no cleanup — a plain function call is simpler.',
      'The lifetime of the resource does not fit one block (e.g. a connection pool that lives for the whole app) — manage it at the application level, often with one with in main().',
      'You are tempted to use it to silently swallow errors.',
    ],
  },
  comparison: {
    title: 'try/finally vs a context manager',
    headers: ['', 'try / finally', 'with + context manager'],
    rows: [
      ['where cleanup is written', 'at every call site', 'once, in __exit__'],
      ['risk of forgetting cleanup', 'high — each use must remember it', 'none once the manager exists'],
      ['sees the exception', 'only if you add except', 'always: __exit__ receives it'],
      ['can suppress', 'yes, with except', 'yes, by returning True (use sparingly)'],
      ['setup and cleanup together', 'no — separated by the body', 'yes — one class/function'],
      ['best for', 'one-off cleanup in a single place', 'any resource used in more than one place'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'context-managers-q1',
      type: 'mcq',
      prompt: py`What does \`with open("log.txt", "w") as f: ...\` guarantee?`,
      options: [
        { text: 'The file is never opened if the body would raise', why: 'Python cannot know in advance what the body will do; the file is opened first.' },
        'The file is closed when the block ends — normally, by return, or by an exception',
        { text: 'Exceptions raised in the body are caught and ignored', why: 'A file’s __exit__ returns a falsy value, so exceptions propagate after the file is closed.' },
        { text: 'f is deleted after the block', why: 'The name f still exists after the block; it just refers to a closed file.' },
      ],
      answer: 1,
      explanation: py`\`open()\` returns a file object that is its own context manager; its \`__exit__\` closes the file. The \`with\` statement guarantees \`__exit__\` runs on every exit path, and doesn't suppress exceptions.`,
    },
    {
      id: 'context-managers-q2',
      type: 'output',
      prompt: 'Predict the output, line by line.',
      code: py`class Demo:
    def __enter__(self):
        print("enter")
        return "value"

    def __exit__(self, exc_type, exc, tb):
        print("exit", exc_type.__name__ if exc_type else None)
        return False

try:
    with Demo() as v:
        print(v)
        1 / 0
        print("after")
except ZeroDivisionError:
    print("handled")`,
      options: [
        'enter\nvalue\nexit ZeroDivisionError\nhandled',
        { text: 'enter\nvalue\nhandled\nexit ZeroDivisionError', why: '__exit__ runs as the exception leaves the with block — before the outer except gets it.' },
        { text: 'enter\nvalue\nexit ZeroDivisionError\nafter\nhandled', why: 'An exception stops the body immediately; "after" never runs.' },
        { text: 'enter\nvalue\nexit None\nhandled', why: '__exit__ receives the exception’s class as exc_type when the body raises.' },
      ],
      answer: 0,
      explanation: py`\`v\` is what \`__enter__\` returned (\`"value"\`). The division raises, the rest of the body is skipped, \`__exit__\` runs with \`exc_type\` = \`ZeroDivisionError\`, returns \`False\`, and the exception continues to the outer \`except\`.`,
    },
    {
      id: 'context-managers-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Box:
    def __enter__(self):
        return 42

    def __exit__(self, *exc):
        return False

with Box() as b:
    print(type(b).__name__, b)`,
      answer: 'int 42',
      accept: ['int 42'],
      explanation: py`\`as\` binds the **return value of \`__enter__\`**, not the \`Box\` object. Here that's the int \`42\`.`,
    },
    {
      id: 'context-managers-q4',
      type: 'bug',
      prompt: py`The program prints "report saved" even though writing failed with an exception. Click the line responsible.`,
      code: py`class SafeWriter:
    def __init__(self, path):
        self.path = path

    def __enter__(self):
        self.file = open(self.path, "w")
        return self.file

    def __exit__(self, exc_type, exc, tb):
        self.file.close()
        return True

with SafeWriter("report.txt") as f:
    f.write(build_report())     # raises NameError
print("report saved")`,
      answerLine: 11,
      explanation: py`\`return True\` suppresses **every** exception, so the \`NameError\` disappears and the program continues as if all was well. \`__exit__\` should close the file and return \`False\` (or nothing).`,
    },
    {
      id: 'context-managers-q5',
      type: 'fill',
      prompt: py`Fill in the two method names so that \`with Lamp() as lamp:\` prints "on" before the block and "off" after it.`,
      code: py`class Lamp:
    def ___(self):
        print("on")
        return self

    def ___(self, exc_type, exc, tb):
        print("off")
        return False`,
      answer: [['__enter__'], ['__exit__']],
      explanation: py`The context manager protocol is exactly two special methods: \`__enter__(self)\` for setup and \`__exit__(self, exc_type, exc, tb)\` for cleanup.`,
    },
    {
      id: 'context-managers-q6',
      type: 'mcq',
      prompt: py`\`__enter__\` opens a network connection and then raises because the server refuses it. What happens to \`__exit__\`?`,
      options: [
        { text: 'It runs with the ConnectionError, like any other exception', why: 'Only exceptions raised in the body are passed to __exit__. If __enter__ fails, the with statement never started.' },
        'It is not called at all — so __enter__ must clean up anything it acquired before failing',
        { text: 'It runs with three Nones', why: '__exit__ is not called at all when __enter__ raises.' },
        { text: 'Python retries __enter__ once', why: 'Python never retries anything automatically.' },
      ],
      answer: 1,
      explanation: py`The expansion calls \`__enter__\` *before* the \`try\` that guarantees \`__exit__\`. A manager that acquires several resources in \`__enter__\` must release the earlier ones itself if a later one fails — or use \`contextlib.ExitStack\`.`,
    },
    {
      id: 'context-managers-q7',
      type: 'short',
      prompt: py`Why is returning \`True\` from \`__exit__\` rarely what you want? Give one case where suppression *is* reasonable.`,
      answer: py`Returning True suppresses the exception: the caller never learns the block failed and carries on with wrong assumptions, and the bug is hidden. It is reasonable only for a specific, expected exception type that you have genuinely handled — for example ignoring FileNotFoundError when deleting a file that may already be gone (contextlib.suppress does exactly this), or a manager whose documented job is to catch and record one error type.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'temporary-attribute',
      title: 'Change a setting, then put it back',
      difficulty: 'intermediate',
      prompt: py`Tests often need to flip a setting for a moment: "run this with \`debug=True\`, then restore it". Write a class-based context manager \`TemporaryAttribute(obj, name, value)\`:

1. \`__enter__\` remembers the attribute's current value (if it has one), sets \`obj.<name> = value\`, and returns \`obj\`;
2. \`__exit__\` restores the old value — or **deletes** the attribute if it didn't exist before;
3. restoring happens **even if the block raises**, and the exception must still propagate (don't suppress it).

Use \`getattr\`, \`setattr\`, \`delattr\` with the attribute name as a string.`,
      files: {
        'main.py': py`class TemporaryAttribute:
    def __init__(self, obj, name, value):
        self.obj = obj
        self.name = name
        self.value = value

    def __enter__(self):
        # TODO: remember the old value (if any) before overwriting it
        setattr(self.obj, self.name, self.value)
        return self.obj

    def __exit__(self, exc_type, exc, tb):
        # TODO: restore the old value, or delete the attribute if it was new
        return False


class Config:
    def __init__(self):
        self.currency = "EUR"
        self.debug = False


config = Config()
with TemporaryAttribute(config, "debug", True) as cfg:
    print("inside:", cfg.debug)
print("after:", config.debug)
`,
      },
      hints: [
        'You need to tell "had no attribute" apart from "had the value None". A unique sentinel object works: _MISSING = object().',
        'In __enter__: self.old = getattr(self.obj, self.name, _MISSING). In __exit__: if self.old is _MISSING, delattr(...), else setattr(..., self.old).',
        '__exit__ always runs, even on exceptions — so the restore code there covers requirement 3. Keep return False.',
      ],
      solution: {
        explanation: py`\`getattr(obj, name, _MISSING)\` returns the sentinel when the attribute doesn't exist, so \`None\` stays a perfectly valid old value. \`__exit__\` runs on every exit path, so the restore happens after errors too, and \`return False\` lets the error continue.

A real-world caveat: if the attribute lives on the **class** (\`Config.debug = False\`), \`getattr\` finds it there, and restoring with \`setattr\` creates an *instance* attribute that shadows the class one — same value, different place. \`unittest.mock.patch.object\` handles such cases carefully; use it in real tests (see [mocking](lesson:mocking)).`,
        files: {
          'main.py': py`_MISSING = object()   # sentinel: "there was no attribute"


class TemporaryAttribute:
    def __init__(self, obj, name, value):
        self.obj = obj
        self.name = name
        self.value = value

    def __enter__(self):
        self.old = getattr(self.obj, self.name, _MISSING)
        setattr(self.obj, self.name, self.value)
        return self.obj

    def __exit__(self, exc_type, exc, tb):
        if self.old is _MISSING:
            delattr(self.obj, self.name)
        else:
            setattr(self.obj, self.name, self.old)
        return False


class Config:
    def __init__(self):
        self.currency = "EUR"
        self.debug = False


config = Config()
with TemporaryAttribute(config, "debug", True) as cfg:
    print("inside:", cfg.debug)
print("after:", config.debug)
`,
        },
      },
      tests: [
        { name: 'set inside, restored after', code: py`c = Config()
with TemporaryAttribute(c, "currency", "GBP") as same:
    assert same is c and c.currency == "GBP"
assert c.currency == "EUR"` },
        { name: 'the demo prints after: False', code: py`assert "after: False" in output` },
        {
          name: 'restored even when the block raises (and the error propagates)',
          code: py`c = Config()
with raises(ZeroDivisionError):
    with TemporaryAttribute(c, "debug", True):
        1 / 0
assert c.debug is False`,
        },
        { name: 'a brand-new attribute is removed afterwards', code: py`c = Config()
with TemporaryAttribute(c, "beta", "on"):
    assert c.beta == "on"
assert not hasattr(c, "beta"), 'Delete attributes that did not exist before'` },
        { name: 'an old value of None is restored, not deleted', code: py`c = Config()
c.theme = None
with TemporaryAttribute(c, "theme", "dark"):
    pass
assert hasattr(c, "theme") and c.theme is None` },
      ],
    },
    {
      id: 'catch-and-record',
      title: 'Catch, record, carry on',
      difficulty: 'advanced',
      prompt: py`When importing thousands of rows you don't want one bad row to stop everything — but you **do** want to know which rows failed, and you don't want to hide unexpected bugs. Write a context manager class \`Catch(*exc_types)\`:

1. \`__enter__\` returns the \`Catch\` object itself;
2. if the block raises an exception that is an instance of one of \`exc_types\` (subclasses count), store the exception object in \`self.error\` and **suppress** it;
3. any other exception must propagate (not suppressed, \`self.error\` stays \`None\`);
4. if nothing is raised, \`self.error\` is \`None\`.

Then \`import_rows(rows)\` (already written) uses it to total valid numbers and collect the bad rows: \`import_rows(["3", "x", "5"])\` returns \`(8, ["x"])\`.`,
      files: {
        'main.py': py`class Catch:
    def __init__(self, *exc_types):
        self.exc_types = exc_types
        self.error = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        # TODO: record and suppress only the listed exception types
        return False


def import_rows(rows):
    total = 0
    bad_rows = []
    for row in rows:
        with Catch(ValueError) as caught:
            total += int(row)
        if caught.error is not None:
            bad_rows.append(row)
    return total, bad_rows


try:
    print(import_rows(["3", "x", "5"]))
except ValueError as err:
    print("an error escaped the with block:", err)
`,
      },
      hints: [
        'When there is no exception, exc_type is None — return False straight away.',
        'isinstance(exc, self.exc_types) works with a tuple of classes and also matches subclasses.',
        'if exc is not None and isinstance(exc, self.exc_types): self.error = exc; return True — otherwise return False.',
      ],
      solution: {
        explanation: py`\`__exit__\` receives the live exception object as \`exc\`. \`isinstance(exc, self.exc_types)\` accepts a tuple of classes and respects inheritance, so \`Catch(ValueError)\` also catches a custom \`BadRow(ValueError)\`. Returning \`True\` suppresses; returning \`False\` lets everything else through, so a \`TypeError\` caused by a real bug still crashes loudly.

This is "suppression done right": the caller names the exact types, and the error is recorded instead of disappearing. The standard library's \`contextlib.suppress\` does the suppress half (without recording) — see [contextlib](lesson:contextlib).`,
        files: {
          'main.py': py`class Catch:
    def __init__(self, *exc_types):
        self.exc_types = exc_types
        self.error = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc is not None and isinstance(exc, self.exc_types):
            self.error = exc
            return True          # handled: suppress it
        return False             # no error, or not ours: let it propagate


def import_rows(rows):
    total = 0
    bad_rows = []
    for row in rows:
        with Catch(ValueError) as caught:
            total += int(row)
        if caught.error is not None:
            bad_rows.append(row)
    return total, bad_rows


try:
    print(import_rows(["3", "x", "5"]))
except ValueError as err:
    print("an error escaped the with block:", err)
`,
        },
      },
      tests: [
        { name: 'import_rows skips and reports bad rows', code: py`assert import_rows(["3", "x", "5"]) == (8, ["x"])` },
        { name: 'records the exception object', code: py`with Catch(KeyError) as c:
    {}["missing"]
assert isinstance(c.error, KeyError)` },
        { name: 'error is None when nothing is raised', code: py`with Catch(ValueError) as c:
    pass
assert c.error is None` },
        {
          name: 'other exceptions propagate',
          code: py`c = Catch(ValueError)
with raises(TypeError):
    with c:
        len(5)
assert c.error is None`,
        },
        {
          name: 'subclasses and several types are caught',
          code: py`class BadRow(ValueError):
    pass

with Catch(KeyError, ValueError) as c:
    raise BadRow("row 7")
assert isinstance(c.error, BadRow)`,
        },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'context-managers-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a context manager, and what does the with statement guarantee?',
      answer: 'An object with __enter__ and __exit__. with calls __enter__ before the block (binding its result to the as target) and guarantees __exit__ runs when the block ends — normally, via return/break, or because of an exception — so cleanup always happens.',
      explanation: py`It's a reusable, packaged \`try/finally\`. \`__exit__\` receives the exception details (or three \`None\`s) and can suppress the exception by returning a truthy value, which should be rare. Typical uses: files, locks, transactions, temporary state.`,
      whyAsked: 'Resource handling is fundamental to reliable programs; this checks you know the protocol, not just the file idiom.',
      mistakes: ['Saying with "catches exceptions"', 'Thinking "as" always binds the manager itself', 'Only knowing the open() example'],
      followUps: ['What does __exit__ receive?', 'What happens if __enter__ raises?', 'How would you write one without a class? (contextlib.contextmanager)'],
      modelAnswer: 'A context manager is any object with __enter__ and __exit__ methods. The with statement calls __enter__ first and binds whatever it returns to the as target, then runs the block, and then guarantees that __exit__ is called however the block ends — normally, by return or break, or because of an exception. __exit__ receives the exception type, value and traceback, or three Nones, and if it returns something truthy the exception is suppressed, which is rarely what you want. It\'s essentially a reusable try/finally, which is why we use it for files, locks, transactions and temporarily changed state.',
    },
    {
      id: 'context-managers-enter-raises',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`class Conn:
    def __enter__(self):
        print("connecting")
        raise ConnectionError("refused")

    def __exit__(self, *exc):
        print("closing")
        return False

try:
    with Conn():
        print("query")
except ConnectionError as e:
    print("error:", e)` },
      options: ['connecting / closing / error: refused', 'connecting / error: refused', 'connecting / query / closing / error: refused', 'error: refused'],
      correctOption: 1,
      answer: '"connecting" then "error: refused". __enter__ raised, so the body never ran and __exit__ was never called.',
      explanation: py`The guarantee covers the **body**. In the expansion of \`with\`, \`__enter__\` is called before the \`try\` block that ensures \`__exit__\`. So a manager must undo any partial setup itself if \`__enter__\` fails halfway.`,
      whyAsked: 'Tests precise knowledge of the protocol — a source of subtle leaks in managers that acquire several resources.',
      mistakes: ['Assuming __exit__ always runs once the with line is reached', 'Thinking the body runs'],
      followUps: ['How would you write __enter__ that opens two files safely?', 'How does ExitStack help?'],
      modelAnswer: 'It prints "connecting" and then "error: refused". The exception is raised inside __enter__, and __enter__ runs before the protected region of the with statement, so the body never runs and __exit__ is never called — "closing" never appears. That means if __enter__ acquires several resources, it must clean up the ones it already got before re-raising; contextlib.ExitStack makes that easy.',
    },
    {
      id: 'context-managers-exit-protocol',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Describe precisely what __exit__ receives and how its return value is used. What happens if __exit__ itself raises?',
      answer: 'It receives (exc_type, exc_value, traceback) — all None if the block finished without an exception. If an exception occurred and __exit__ returns a truthy value, the exception is suppressed; otherwise it is re-raised after __exit__ returns. If __exit__ raises, that new exception replaces the original, which is attached as its __context__.',
      explanation: py`The return value is ignored when there was no exception. Suppression doesn't affect \`return\`/\`break\`/\`continue\` — those still happen. Special methods are looked up on the type. The traceback argument is useful for logging (\`traceback.format_exception(exc_type, exc, tb)\`).`,
      code: { lang: 'python', code: py`class Cleanup:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        raise RuntimeError("cleanup failed")


try:
    with Cleanup():
        raise ValueError("body failed")
except RuntimeError as e:
    print(repr(e), "| context:", repr(e.__context__))
# RuntimeError('cleanup failed') | context: ValueError('body failed')` },
      whyAsked: 'Shows depth beyond the happy path: error handling inside cleanup is where production incidents hide.',
      mistakes: ['Saying __exit__ receives only the exception object', 'Believing returning None suppresses', 'Not knowing about exception context chaining'],
      followUps: ['How would you log the exception from inside __exit__ without suppressing it?', 'Why should cleanup code avoid raising?'],
      modelAnswer: '__exit__ gets three arguments: the exception class, the exception instance and the traceback, or three Nones if the block completed normally. If there was an exception, a truthy return value tells Python to swallow it and continue after the with; a falsy value, including the implicit None, means it is re-raised after __exit__ finishes. The return value is irrelevant when there was no exception. If __exit__ raises, its exception replaces the original one, and the original is attached as __context__, so you see "during handling of the above exception" in the traceback. That\'s why cleanup code should be defensive and not raise.',
    },
    {
      id: 'context-managers-indenter',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write a reusable, reentrant context manager class `Indenter`. Each nested `with ind:` increases the indent level by one, leaving the block decreases it (even on exceptions), and `ind.line(text)` returns the text prefixed with 4 spaces per level.',
      answer: 'Keep self.level; __enter__ increments it and returns self; __exit__ decrements it and returns False; line() returns "    " * self.level + text.',
      explanation: py`This manager is **reentrant**: the same object is used in nested \`with\` statements. That works because each \`__enter__\` is paired with exactly one \`__exit__\`, and the state is a simple counter. A manager storing "the" resource in a single attribute would not be reentrant.`,
      starter: { files: { 'main.py': py`class Indenter:
    def __init__(self):
        self.level = 0

    def __enter__(self):
        # TODO
        return self

    def __exit__(self, exc_type, exc, tb):
        # TODO
        return False

    def line(self, text):
        return "    " * self.level + text


ind = Indenter()
with ind:
    print(ind.line("menu"))
    with ind:
        print(ind.line("tea"))
` } },
      tests: [
        {
          name: 'nested levels',
          code: py`ind = Indenter()
with ind:
    a = ind.line("a")
    with ind:
        b = ind.line("b")
    c = ind.line("c")
assert (a, b, c) == ("    a", "        b", "    c")
assert ind.level == 0`,
        },
        {
          name: 'level restored after an exception',
          code: py`ind = Indenter()
with raises(KeyError):
    with ind:
        with ind:
            raise KeyError("x")
assert ind.level == 0`,
        },
        { name: 'with returns the indenter', code: py`ind = Indenter()
with ind as same:
    assert same is ind` },
      ],
      solution: { files: { 'main.py': py`class Indenter:
    def __init__(self):
        self.level = 0

    def __enter__(self):
        self.level += 1
        return self

    def __exit__(self, exc_type, exc, tb):
        self.level -= 1
        return False

    def line(self, text):
        return "    " * self.level + text


ind = Indenter()
with ind:
    print(ind.line("menu"))
    with ind:
        print(ind.line("tea"))
` } },
      hints: ['__enter__ increases self.level, __exit__ decreases it.', '__exit__ runs even when an exception passes through, so the decrement there is always applied.'],
      whyAsked: 'A compact test of the protocol plus the idea of reentrancy and state restoration.',
      mistakes: ['Resetting level to 0 in __exit__ (breaks nesting)', 'Returning True from __exit__', 'Forgetting to return self'],
      followUps: ['Is your Indenter thread-safe?', 'How would you write it with @contextmanager?'],
      modelAnswer: 'I keep a level counter on the object. __enter__ increments it and returns self, __exit__ decrements it and returns False so exceptions propagate, and line() prefixes four spaces per level. Because every __enter__ is paired with exactly one __exit__, even when an exception passes through, nesting the same object works and the level always returns to zero — it\'s a reentrant manager. If several threads shared one Indenter I\'d keep the level in threading.local or use one indenter per thread.',
    },
    {
      id: 'context-managers-sqlite-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A script processes 10,000 small files and for each one does `with sqlite3.connect(DB) as conn: conn.execute(...)`. Eventually it fails with "database is locked" or "too many open files". The developer insists "the with statement closes the connection". What is wrong?',
      answer: 'sqlite3.Connection’s context manager handles a transaction (commit on success, rollback on exception) — it does not close the connection. Connections pile up until garbage-collected. Close explicitly, wrap in contextlib.closing(), or better, open one connection and reuse it.',
      explanation: py`A \`with\` does whatever the class's \`__exit__\` does — read the docs. For this workload the best fix is one connection for the whole loop, with a transaction per file (\`with conn:\`), inside \`with closing(sqlite3.connect(DB)) as conn:\`.`,
      code: { lang: 'python', code: py`import sqlite3
from contextlib import closing

with closing(sqlite3.connect(":memory:")) as conn:   # closed at the end
    conn.execute("CREATE TABLE files (name TEXT)")
    for name in ["a.txt", "b.txt"]:
        with conn:                                    # one transaction per file
            conn.execute("INSERT INTO files VALUES (?)", (name,))
    print(conn.execute("SELECT count(*) FROM files").fetchone())` },
      whyAsked: 'Real-world bug that checks whether you know a context manager’s behaviour is defined by its class, not by "with" itself.',
      mistakes: ['Assuming every with closes something', 'Fixing it with gc.collect()'],
      followUps: ['Why is reusing one connection better here?', 'How do you write a transaction manager that supports nesting? (savepoints)'],
      modelAnswer: 'The with statement only calls __enter__ and __exit__, and for a sqlite3 connection __exit__ commits or rolls back the transaction — it doesn\'t close the connection. So each iteration leaks an open connection until the garbage collector gets to it, and they hold file handles and locks. I would open a single connection for the whole job inside contextlib.closing so it is closed at the end, and use with conn: per file to get one transaction each. The general lesson is to check what a library\'s context manager actually manages.',
    },
    {
      id: 'context-managers-vs-del',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Why not just close resources in __del__ instead of using context managers?',
      answer: '__del__ runs when the object is garbage-collected, which is not deterministic: CPython usually does it promptly via reference counting, but cycles, lingering references (e.g. in a traceback) and other implementations like PyPy can delay it indefinitely; exceptions in __del__ are ignored, and it may run during interpreter shutdown when modules are half torn down. with gives deterministic, visible, exception-aware cleanup.',
      explanation: py`Reference counting is a [CPython implementation detail](lesson:memory-management). Code that "works" because CPython frees objects immediately can leak file handles on PyPy. Use \`with\` for deterministic cleanup; treat \`__del__\` or \`weakref.finalize\` only as a last-resort safety net (with a warning, like \`ResourceWarning\` for unclosed files).`,
      whyAsked: 'Probes understanding of object lifetime, the difference between language guarantees and CPython behaviour, and robust resource design.',
      mistakes: ['Claiming __del__ runs "as soon as the variable goes out of scope" as a language rule', 'Not knowing exceptions in __del__ are swallowed'],
      followUps: ['What is ResourceWarning?', 'What does weakref.finalize offer over __del__?'],
      modelAnswer: 'Because __del__ is tied to garbage collection, and the language doesn\'t guarantee when that happens. In CPython reference counting usually calls it right away, but a reference cycle, an object kept alive by a traceback, or another implementation like PyPy can delay it a long time — or until shutdown, when modules may already be torn down. Exceptions raised in __del__ are only printed, not propagated. A context manager gives deterministic cleanup at a visible point, and its __exit__ even knows whether the block failed, which matters for things like transactions. I would use __del__ or weakref.finalize only as a safety net that warns.',
    },
    {
      id: 'context-managers-transaction-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design a `transaction(db)` context manager for a service layer. What should happen on success, on exception, on nested use, and what should it never do?',
      answer: 'BEGIN in __enter__; COMMIT in __exit__ when there was no exception; ROLLBACK when there was one, then let the exception propagate (return False). For nesting, either use savepoints (SAVEPOINT/RELEASE/ROLLBACK TO) per level, or make inner uses join the outer transaction. Never suppress errors, never commit after an error, and make sure a failed COMMIT is reported.',
      explanation: py`The service code becomes \`with transaction(db): debit(...); credit(...)\` — all-or-nothing. Track depth to support nesting. Keep the transaction short (no network calls inside it). The connection's lifetime (pool checkout/return) is a separate concern, often its own context manager. See [database patterns](lesson:database-patterns).`,
      code: { lang: 'python', code: py`import sqlite3


class Transaction:
    def __init__(self, conn):
        self.conn = conn
        self.depth = 0

    def __enter__(self):
        name = f"sp{self.depth}"
        self.conn.execute(f"SAVEPOINT {name}")
        self.depth += 1
        return self.conn

    def __exit__(self, exc_type, exc, tb):
        self.depth -= 1
        name = f"sp{self.depth}"
        if exc_type is None:
            self.conn.execute(f"RELEASE {name}")
        else:
            self.conn.execute(f"ROLLBACK TO {name}")
            self.conn.execute(f"RELEASE {name}")
        return False


conn = sqlite3.connect(":memory:", isolation_level=None)
conn.execute("CREATE TABLE stock (item TEXT, qty INTEGER)")
tx = Transaction(conn)
with tx:
    conn.execute("INSERT INTO stock VALUES ('tea', 5)")
    try:
        with tx:
            conn.execute("INSERT INTO stock VALUES ('scone', 2)")
            raise ValueError("bad scone")
    except ValueError:
        pass
print(conn.execute("SELECT item FROM stock").fetchall())   # [('tea',)]` },
      whyAsked: 'Combines the protocol with real system design: atomicity, error propagation and nesting.',
      mistakes: ['Returning True to "handle" errors', 'Committing in a finally block regardless of errors', 'Holding a transaction open across slow network calls'],
      followUps: ['How do savepoints work?', 'Where would connection pooling fit?', 'How would you test the rollback path?'],
      modelAnswer: 'In __enter__ I start the transaction and return the connection or a unit-of-work object. In __exit__, if no exception occurred I commit; if one did, I roll back and return False so the error still reaches the caller — the manager must never swallow it. For nesting I\'d either track depth and use savepoints, so an inner failure rolls back only its part, or let inner blocks join the outer transaction. I\'d keep transactions short, never do network calls inside them, and keep connection lifetime as a separate concern, like a pool checkout. Finally I\'d make sure a failing commit is surfaced, not hidden.',
    },
  ],

  takeaways: [
    'A context manager is an object with __enter__ and __exit__; with calls __enter__ before the block and always calls __exit__ after it.',
    '"as" binds what __enter__ returns — often self or the resource, sometimes something else.',
    '__exit__(exc_type, exc_value, traceback) gets three Nones on success, or the exception details on failure.',
    'Returning a truthy value from __exit__ suppresses the exception — almost never what you want; return False/None.',
    'If __enter__ raises, __exit__ is not called; acquire in __enter__, release in __exit__, and keep __init__ for settings.',
    'Several managers can share one with (parenthesised on 3.10+); they exit in reverse order.',
    'Library managers do what their docs say: sqlite3 connections manage transactions, not closing.',
  ],
}
