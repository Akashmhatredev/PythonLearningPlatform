// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GOTCHA_LAB = py`# Gotcha lab: five functions, five classic Python bugs.
# Run it, compare each line with what it SHOULD print ("want"),
# then fix one bug per experiment.


def add_tag(tag, tags=[]):
    """Return a list of tags with tag added."""
    tags.append(tag)
    return tags


def make_multipliers():
    """Return three functions: x*0, x*1 and x*2."""
    return [lambda x: x * n for n in range(3)]


def empty_board(size):
    """Return a size x size grid of zeros."""
    return [[0] * size] * size


def drop_short(words):
    """Return the words with at least 4 letters."""
    for word in words:
        if len(word) < 4:
            words.remove(word)
    return words


def stats(readings):
    """Return (total, count) of the non-negative readings."""
    valid = (r for r in readings if r >= 0)
    return sum(valid), sum(1 for _ in valid)


add_tag("urgent")
print("1 tags:", add_tag("billing"), "| want ['billing']")
print("2 multipliers:", [f(10) for f in make_multipliers()], "| want [0, 10, 20]")
board = empty_board(3)
board[0][0] = 1
print("3 board:", board, "| want only row 0 changed")
print("4 long words:", drop_short(["ox", "cat", "lion", "emu", "bee"]), "| want ['lion']")
print("5 stats:", stats([3, -1, 4]), "| want (7, 2)")
`

export default {
  id: 'debugging-scenarios',
  title: 'Debugging & predict-the-output drills',
  summary: 'Drill the classic Python gotchas interviewers love — shared mutable defaults, late binding, is vs ==, aliasing, exhausted iterators, float surprises, scope errors, swallowed exceptions and forgotten awaits.',
  difficulty: 'advanced',
  minutes: 70,
  prerequisites: ['mutability-and-copying', 'scope', 'closures', 'generators', 'try-except'],
  related: ['answering-framework', 'coding-patterns', 'rapid-review', 'function-arguments', 'none-and-truthiness', 'numbers-and-math', 'methods-and-attributes', 'error-handling-patterns', 'asyncio-basics', 'debugging', 'iterators'],
  tags: ['gotchas', 'pitfalls', 'predict the output', 'debugging', 'interview', 'mutable default argument', 'late binding', 'closures', 'is vs ==', 'shallow copy', 'aliasing', 'generator exhaustion', 'float precision', 'UnboundLocalError', 'class attributes', 'exception swallowing', 'dict order', 'set order', 'await', 'coroutine never awaited'],
  apis: [
    { name: 'copy.copy() / copy.deepcopy()', summary: 'Shallow copy (new outer container, shared contents) vs deep copy (recursively copied contents).' },
    { name: 'functools.partial()', summary: 'Freeze some arguments of a function now — a clean fix for late-binding callbacks.' },
    { name: 'decimal.Decimal', summary: 'Exact decimal arithmetic with explicit rounding modes, for money.' },
    { name: 'math.isclose()', summary: 'Compare floats with a tolerance instead of ==.' },
    { name: 'logging.exception()', summary: 'Log an error message plus the current traceback from inside an except block.' },
    { name: 'asyncio.create_task()', summary: 'Schedule a coroutine to run concurrently; keep a reference to the returned task.' },
  ],
  docs: [
    { label: 'Programming FAQ — why are default values shared between objects?', url: 'https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects' },
    { label: 'Programming FAQ — why do lambdas defined in a loop all return the same result?', url: 'https://docs.python.org/3/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result' },
    { label: 'Programming FAQ — UnboundLocalError', url: 'https://docs.python.org/3/faq/programming.html#why-am-i-getting-an-unboundlocalerror-when-the-variable-has-a-value' },
    { label: 'Tutorial — floating-point arithmetic: issues and limitations', url: 'https://docs.python.org/3/tutorial/floatingpoint.html' },
    { label: 'asyncio — developing with asyncio (common mistakes)', url: 'https://docs.python.org/3/library/asyncio-dev.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **gotcha** is code that looks right, runs without crashing, and does something surprising. Interviewers love them because you can't bluff: you either know *why* \`def f(items=[])\` remembers old calls, or you don't.`,
    py`This lesson is a drill hall. Each gotcha comes with a **predict-the-output** or **find-the-bug** exercise, the one-sentence explanation you should be able to say out loud, and the fix a professional would write.`,
    py`The good news: nearly all of them come from a few root ideas you already know — *names point to objects* ([variables](lesson:variables-and-names)), *mutable objects can be shared* ([mutability & copying](lesson:mutability-and-copying)), *functions look names up when they run* ([closures](lesson:closures), [scope](lesson:scope)), and *iterators are one-shot* ([generators](lesson:generators)). Learn the root idea and you can explain gotchas you've never seen.`,
  ],
  why: [
    py`"What does this print?" questions test **precise mental models** in seconds. A candidate who predicts the output *and explains the mechanism* demonstrates deeper understanding than one who recites definitions.`,
    py`These are also real production bugs: shared default lists leaking data between web requests, callbacks all firing for the last button, reports that silently count zero rows, money that's off by a cent, and errors swallowed by \`except Exception: pass\` until a customer notices.`,
    py`Practising them trains the debugging habit that matters most: **predict, run, compare, explain**. When the output surprises you, the gap between your prediction and reality is exactly what you need to learn.`,
  ],
  eli15: [
    py`Imagine a shared whiteboard in a classroom. If the teacher writes "Homework:" on it once at the start of the year and every class adds to the *same* board, by Friday it's full of everyone's homework. That's the **mutable default argument**: the default list is made once, and every call writes on the same one.`,
    py`Or imagine three friends who each agree to "meet at whatever time is on the clock when we leave". They all read the clock at the *same* moment — the end — so they all get the same time. That's **late binding**: functions made in a loop look up the loop variable when they're *called*, not when they're made.`,
    py`Each gotcha in this lesson is a little story like that. Learn the story and you'll spot the bug instantly.`,
  ],
  analogy: {
    title: 'A detective with a casebook',
    body: [
      py`Experienced detectives don't solve each crime from scratch — they recognise patterns: "forced window but no footprints? Inside job." Their casebook maps *clues* to *likely causes*.`,
      py`Debugging Python is the same. "Every call returns old data" → a shared mutable object. "All callbacks act like the last one" → late binding. "The second loop does nothing" → an exhausted iterator. "A typo'd key returns \`None\` instead of crashing" → a swallowed exception. This lesson is your casebook.`,
    ],
    mapping: [
      ['"Old data shows up in new calls"', 'a mutable default or class attribute shared between calls/instances'],
      ['"Everything acts like the last one"', 'late-binding closures in a loop'],
      ['"Changing one row changes them all"', '[[0] * n] * n aliasing or a shallow copy'],
      ['"The second pass is empty"', 'an exhausted generator, map, zip or file object'],
      ['"Works in the REPL, fails in production"', 'is vs ==, set order, float equality'],
      ['"No error, just wrong results"', 'a swallowed exception or a coroutine never awaited'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'The default list is created once',
    props: {
      code: py`def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags


first = add_tag("urgent")
second = add_tag("billing")
print(first is second, second)


def add_tag_safe(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags


a = add_tag_safe("urgent")
b = add_tag_safe("billing")
print(a is b, b)
`,
      notes: {
        1: 'The `def` statement runs **once**: Python evaluates `[]` right now and stores that one list as the default.',
        2: 'With no `tags` argument, `tags` refers to the stored default list — the same object every call.',
        7: 'The second call appends to the *same* list. `first` and `second` are two names for it.',
        12: '`None` is immutable, so it is a safe default. A **new** list is made inside the call.',
        19: 'Each call now gets its own list: `False [\'billing\']`.',
      },
    },
    alt: 'A step-by-step trace. add_tag is defined with a default list created once. The first call appends "urgent" to it and returns it; the second call appends "billing" to the same list, so first and second point to one list containing both tags and the program prints True and the two-item list. add_tag_safe uses None as the default and creates a new list inside each call, so a and b are different lists and it prints False and a list with only "billing".',
    caption: py`Watch the arrows: both calls to \`add_tag\` return arrows to **one** list object. Default values are evaluated when the function is *defined*, not when it's called.`,
  },
  syntax: [
    py`#### The twelve gotchas and their one-line fixes`,
    py`| gotcha | symptom | fix |
|---|---|---|
| mutable default \`def f(x=[])\` | old data in new calls | \`x=None\`, then \`if x is None: x = []\` |
| late-binding closures in a loop | every callback uses the last value | bind now: \`lambda n=n: ...\` or \`functools.partial\` |
| \`is\` vs \`==\` | "equal" values compare \`False\` | \`==\` for values; \`is\` only for \`None\` and other singletons |
| \`[[0] * 3] * 3\`, shallow copies | changing one row changes all | \`[[0] * 3 for _ in range(3)]\`, \`copy.deepcopy\` |
| modifying a list/dict while iterating | skipped items / \`RuntimeError\` | build a new collection, or iterate over a copy |
| generator / iterator exhaustion | the second pass is empty | \`list(...)\` once, or recreate the iterator |
| float precision, \`/\` vs \`//\` | \`0.1 + 0.2 != 0.3\`, \`-7 // 2 == -4\` | \`math.isclose\`, \`Decimal\`, integer cents; know floor division |
| \`UnboundLocalError\` | "cannot access local variable" | don't rebind globals; pass values in, return results |
| class vs instance attributes | instances share a list | create mutable state in \`__init__\` |
| swallowed exceptions | wrong results, no error | catch specific exceptions; log and re-raise |
| order assumptions | flaky tests | sets are unordered; dicts keep insertion order (3.7+) |
| async function not awaited | nothing happens + \`RuntimeWarning\` | \`await\` it, or \`create_task\` and keep the task |`,
    { code: py`import functools

def add_tag(tag, tags=None):                 # mutable default: use None
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

handlers = [lambda x, n=n: x * n for n in range(3)]           # bind now
handlers = [functools.partial(pow, exp=n) for n in range(3)]  # or partial

board = [[0] * 3 for _ in range(3)]          # three separate rows
long_words = [w for w in ["ox", "lion"] if len(w) >= 4]   # don't remove while looping
values = list(r for r in [3, -1, 4] if r >= 0)            # materialise to reuse`, lang: 'python', title: 'the fixes in code' },
    { callout: 'tip', title: 'How to answer a predict-the-output question', text: py`Trace **out loud**, one line at a time, naming objects and names separately: "the list is created once, at definition time; \`tags\` points to it…". If you're unsure between two outputs, say which mechanism decides it. The explanation earns as much credit as the answer. See the [answering framework](lesson:answering-framework).` },
  ],
  walkthrough: {
    title: 'Five bugs in the gotcha lab',
    lang: 'python',
    code: GOTCHA_LAB,
    intro: py`This is the playground program. Each function has a classic bug; each printed line shows what you got and what you wanted. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [6, 9], text: py`**Mutable default.** \`tags=[]\` is evaluated once, when \`def\` runs. Every call without \`tags\` appends to that one list, so the second call sees \`"urgent"\` too.` },
      { lines: [12, 14], text: py`**Late binding.** Each lambda refers to the *variable* \`n\`, not its value at creation. They run after the loop, when \`n\` is 2, so every function multiplies by 2.` },
      { lines: [17, 19], text: py`**Aliasing.** \`[[0] * size] * size\` repeats a reference to *one* inner list. Writing \`board[0][0]\` changes "every" row because there is only one row.` },
      { lines: [22, 27], text: py`**Removing while iterating.** The list iterator walks by index. Removing \`"ox"\` shifts \`"cat"\` into index 0, which the loop has already passed — so \`"cat"\` is skipped.` },
      { lines: [30, 33], text: py`**Exhausted generator.** \`sum(valid)\` consumes every item. The second \`sum\` finds nothing, so the count is 0. (Exercise 1 fixes a bigger version of this.)` },
      { lines: [36, 43], text: py`The calls and expected values. Fix the functions one by one and rerun: each line should match its "want".` },
    ],
  },
  playground: {
    title: 'Gotcha lab',
    objective: 'Predict each line before running, then fix the bugs one at a time.',
    files: { 'main.py': GOTCHA_LAB },
    expected: py`Five wrong answers — each one a classic gotcha:

\`\`\`text
1 tags: ['urgent', 'billing'] | want ['billing']
2 multipliers: [20, 20, 20] | want [0, 10, 20]
3 board: [[1, 0, 0], [1, 0, 0], [1, 0, 0]] | want only row 0 changed
4 long words: ['cat', 'lion', 'bee'] | want ['lion']
5 stats: (7, 0) | want (7, 2)
\`\`\``,
    experiments: [
      {
        id: 'fix-tags',
        task: py`Fix \`add_tag\` so each call without a \`tags\` argument starts from a fresh, empty list — while still appending to a list the caller passes in.`,
        hint: py`Use \`tags=None\` as the default, then \`if tags is None: tags = []\` inside the function.`,
        tests: [
          { name: 'a fresh list for every call', code: py`assert add_tag("x") == ["x"]
first = add_tag("a")
second = add_tag("b")
assert first == ["a"] and second == ["b"]` },
          { name: 'a list passed in is still extended', code: py`mine = ["vip"]
assert add_tag("new", mine) == ["vip", "new"]` },
        ],
        explain: py`Default values are evaluated once, when the \`def\` statement runs, and stored on the function (\`add_tag.__defaults__\`). \`None\` is immutable, so it is safe to share; the real list is created per call.`,
      },
      {
        id: 'fix-multipliers',
        task: py`Fix \`make_multipliers\` so it returns functions that multiply by 0, 1 and 2.`,
        hint: py`Bind the current value as a default argument: \`lambda x, n=n: x * n\`.`,
        tests: [
          { name: 'each function keeps its own n', code: py`assert [f(10) for f in make_multipliers()] == [0, 10, 20]` },
        ],
        explain: py`Default arguments are evaluated when each lambda is *created*, capturing the value of \`n\` at that moment. Without it, all three closures share the comprehension's single variable \`n\`, looked up when called — after the loop finished at 2. \`functools.partial\` is the other clean fix.`,
      },
      {
        id: 'fix-board',
        task: py`Fix \`empty_board\` so that each row is a separate list.`,
        hint: py`Build a new row on every iteration: \`[[0] * size for _ in range(size)]\`.`,
        tests: [
          { name: 'rows are independent', code: py`b = empty_board(3)
b[0][0] = 1
assert b == [[1, 0, 0], [0, 0, 0], [0, 0, 0]]` },
          { name: 'still a size x size grid of zeros', code: py`assert empty_board(2) == [[0, 0], [0, 0]]` },
        ],
        explain: py`The comprehension evaluates \`[0] * size\` once per row, creating a new list each time. \`[0] * size\` itself is fine: it repeats references to the immutable \`0\`, which can't be changed in place.`,
      },
      {
        id: 'fix-long-words',
        task: py`Fix \`drop_short\` so it returns \`['lion']\` for the sample — **without modifying** the list passed in.`,
        hint: py`Build a new list with a comprehension instead of removing from the one you're looping over.`,
        tests: [
          { name: 'keeps only words with 4+ letters', code: py`assert drop_short(["ox", "cat", "lion", "emu", "bee"]) == ["lion"]` },
          { name: 'does not modify the input', code: py`words = ["ox", "lion"]
drop_short(words)
assert words == ["ox", "lion"]` },
        ],
        explain: py`\`[w for w in words if len(w) >= 4]\` reads the original list from start to end without changing it. Removing items while a \`for\` loop walks the same list shifts later items into positions the loop has already visited, so some are skipped.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Twelve gotchas, six root causes',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'shared', label: 'Shared mutable object', note: 'defaults, [[0]*3]*3, class attrs, shallow copy', tone: 'red' },
        { id: 'late', label: 'Names looked up later', note: 'late binding, UnboundLocalError', tone: 'blue' },
        { id: 'oneshot', label: 'One-shot iterators', note: 'generators, map, zip, files', tone: 'yellow' },
        { id: 'identity', label: 'Identity vs value', note: 'is vs ==', tone: 'paper' },
        { id: 'numbers', label: 'Number representation', note: 'floats, //, round()', tone: 'kraft' },
        { id: 'silent', label: 'Silent failures', note: 'swallowed errors, no await, order', tone: 'ink' },
      ],
      steps: [
        { focus: ['shared'], text: py`**Shared mutable objects.** A default \`[]\`, a class-level list, \`[[0] * 3] * 3\` and the inner lists of a shallow copy are all *one object reachable through several names*. Mutate it through one name, see it everywhere. Ask: "how many objects are there really?"` },
        { focus: ['late'], text: py`**Names are looked up when code runs.** Closures read the loop variable at call time (late binding). The compiler decides a name is *local* if it's assigned anywhere in the function — so reading it before that assignment raises \`UnboundLocalError\`.` },
        { focus: ['oneshot'], text: py`**Iterators are one-shot.** Generators, \`map\`, \`filter\`, \`zip\`, file objects and \`csv.reader\` produce each item once. A second pass finds them empty — no error, just nothing.` },
        { focus: ['identity'], text: py`**Identity vs value.** \`is\` asks "same object?", \`==\` asks "equal value?". Small ints and some strings *happen* to be shared in CPython, so \`is\` sometimes appears to work — until it doesn't.` },
        { focus: ['numbers'], text: py`**Representation.** Binary floats can't store 0.1 exactly; \`round()\` rounds halves to even and works on the stored binary value; \`//\` floors towards negative infinity. All documented, all surprising.` },
        { focus: ['silent'], text: py`**Silent failures.** \`except Exception: pass\` turns crashes into wrong answers; calling an \`async def\` function without \`await\` creates a coroutine that never runs; code that assumes a set's order passes on one machine and fails on another.` },
      ],
    },
    alt: 'Six boxes in a grid naming the root causes behind common Python gotchas: shared mutable object, names looked up later, one-shot iterators, identity versus value, number representation, and silent failures. Each step explains which gotchas belong to that root cause and why they happen.',
    caption: py`When a new gotcha appears in an interview, ask which of these six ideas it belongs to — the explanation usually follows.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Most gotchas disappear once you draw **names and objects separately**. Write each name on the left, each object on the right, and arrows between them. Then ask: when this line runs, which *object* changes, and which *names* point to it?`,
      py`The second habit: notice **when** each piece of code runs. A \`def\` line runs once (so its defaults are made once). A lambda body runs when it's called (so it reads variables then). A generator expression runs as it's consumed (so it can only be consumed once).`,
      py`The code tracer above, and the one in [variables](lesson:variables-and-names), make both visible. Use it on any drill that surprises you.`,
    ],
    technical: [
      py`**Defaults** are stored on the function object (\`func.__defaults__\`, \`__kwdefaults__\`), evaluated once at definition time — a language rule, documented in the [reference](https://docs.python.org/3/reference/compound_stmts.html#function-definitions).`,
      py`**Closures** capture *variables* (cells), not values. All lambdas created in one comprehension share the comprehension's \`n\` cell. Default arguments or \`functools.partial\` copy the current *value* instead.`,
      py`**Local or not is decided at compile time.** If a function assigns to a name anywhere (including \`+=\`, \`for x in\`, \`import x\`, \`except E as x\`), that name is local for the *whole* function. Reading it before the assignment raises \`UnboundLocalError\` (a subclass of \`NameError\`). See [scope](lesson:scope).`,
      py`**Attribute lookup** checks the instance's \`__dict__\` before the class. Reading \`self.items\` finds the class attribute; *assigning* \`self.total = ...\` creates an instance attribute that shadows it. \`self.tags += [...]\` does both: \`list.__iadd__\` mutates the shared class list in place, then the result is assigned to the instance. See [methods & attributes](lesson:methods-and-attributes).`,
      py`**Floats** are IEEE 754 binary doubles on every mainstream platform: \`0.1\` is stored as the nearest binary fraction. \`round()\` uses round-half-to-even on the *stored* value, so \`round(2.675, 2)\` is \`2.67\` (the stored value is slightly below 2.675). \`//\` and \`%\` floor towards negative infinity so that \`(a // b) * b + a % b == a\` always holds.`,
      { callout: 'note', title: 'CPython details behind "sometimes" bugs', text: py`Small ints (-5…256) are cached and some strings are interned, so \`is\` can accidentally return \`True\`; string hashes are randomised per process (see \`PYTHONHASHSEED\`), so a set of strings can iterate in a different order on every run. Neither behaviour is a language guarantee — which is exactly why code that depends on them is flaky.` },
    ],
    production: [
      py`**Linters catch many gotchas before review.** Ruff/Pylint/flake8-bugbear flag mutable defaults (B006), loop-variable closures (B023), bare \`except:\` (E722), \`is\` with literals (F632) and blind \`except Exception\` (BLE001). CPython itself emits \`SyntaxWarning: "is" with 'str' literal\` and \`RuntimeWarning: coroutine '…' was never awaited\`. Treat warnings as bugs; see [code quality tools](lesson:code-quality-tools).`,
      py`**Tests that exercise the second call catch shared-state bugs.** Many gotchas only appear on the second call, second instance, second pass or second process. Write tests that call things twice, create two objects, and run under different hash seeds.`,
      py`**Never silence errors you didn't expect.** Catch the narrowest exception that you know how to handle, and let the rest propagate to a top-level handler that logs the traceback (\`logger.exception\`). See [error handling patterns](lesson:error-handling-patterns).`,
      py`**Money is never a float.** Store integer cents or \`decimal.Decimal\`, and pick an explicit rounding mode — the one your accountants or regulators specify.`,
    ],
  },
  mistakes: [
    {
      title: 'Fixing a mutable default with a truthiness check',
      wrong: { code: py`def add_tag(tag, tags=None):
    tags = tags or []        # a caller's EMPTY list is replaced!
    tags.append(tag)
    return tags

mine = []
add_tag("x", mine)
print(mine)                  # [] - the caller's list was never touched`, lang: 'python' },
      right: { code: py`def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags

mine = []
add_tag("x", mine)
print(mine)                  # ['x']`, lang: 'python' },
      explanation: py`An empty list is falsy, so \`tags or []\` throws away a perfectly valid empty list the caller wanted filled. Test for \`None\` explicitly.`,
    },
    {
      title: 'Copying the outer list and thinking the data is safe',
      wrong: { code: py`orders = [["tea", 2], ["cake", 1]]
backup = orders.copy()       # shallow
orders[0][1] = 99
print(backup[0])             # ['tea', 99]`, lang: 'python' },
      right: { code: py`import copy

orders = [["tea", 2], ["cake", 1]]
backup = copy.deepcopy(orders)
orders[0][1] = 99
print(backup[0])             # ['tea', 2]`, lang: 'python' },
      explanation: py`A shallow copy makes a new outer list holding the *same* inner lists. Use \`deepcopy\` (or immutable inner values such as tuples) when the nested data must be independent.`,
    },
    {
      title: 'Comparing floats with ==',
      wrong: { code: py`total = 0.1 + 0.2
if total == 0.3:
    print("balanced")        # never prints`, lang: 'python' },
      right: { code: py`import math

total = 0.1 + 0.2
if math.isclose(total, 0.3):
    print("balanced")`, lang: 'python' },
      explanation: py`Binary floats approximate decimal fractions. Compare with a tolerance, or use \`Decimal\` / integer cents when exact decimal results matter.`,
    },
    {
      title: 'Bare except that hides the real bug',
      wrong: { code: py`def unit_price(item):
    try:
        return item["price"] / item["qty"]
    except:
        return 0`, lang: 'python' },
      right: { code: py`def unit_price(item):
    if item["qty"] == 0:
        raise ValueError(f"item {item.get('name')!r} has zero quantity")
    return item["price"] / item["qty"]`, lang: 'python' },
      explanation: py`The bare \`except\` also catches \`KeyError\` from a typo, \`TypeError\` from bad data — even \`KeyboardInterrupt\`. Returning \`0\` turns all of them into silently wrong prices. Handle the one case you expect and let real bugs surface.`,
    },
    {
      title: 'Using is to compare values',
      wrong: { code: py`def is_admin(role):
    return role is "admin"     # SyntaxWarning, and wrong for built strings`, lang: 'python', static: true },
      right: { code: py`def is_admin(role):
    return role == "admin"`, lang: 'python' },
      explanation: py`A role read from a file, a database or \`input()\` is a different string object from the literal, so \`is\` returns \`False\` even when the text matches. Use \`is\` only for singletons such as \`None\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`UnboundLocalError: cannot access local variable 'total' where it is not associated with a value`,
      cause: py`The function assigns to \`total\` somewhere (e.g. \`total += amount\`), so \`total\` is local everywhere in that function — including the line that reads it first.`,
      fix: py`Pass the value in and return the new one, or keep state in an object. Use \`global\`/\`nonlocal\` only when you truly mean to rebind the outer name.`,
    },
    {
      symptom: py`RuntimeError: dictionary changed size during iteration`,
      cause: py`Adding or deleting keys while looping over the dict (or its \`.items()\` view).`,
      fix: py`Loop over a snapshot (\`for key in list(d):\`) or build a new dict with a comprehension: \`{k: v for k, v in d.items() if v}\`.`,
    },
    {
      symptom: py`RuntimeWarning: coroutine 'save' was never awaited`,
      cause: py`An \`async def\` function was called like a normal function. Calling it only creates a coroutine object; the body never runs.`,
      fix: py`\`await save(order)\`, or schedule it with \`asyncio.create_task(save(order))\` and keep a reference to the task (or use a \`TaskGroup\`, 3.11+).`,
    },
    {
      symptom: py`SyntaxWarning: "is" with 'str' literal. Did you mean "=="?`,
      cause: py`Comparing a value to a literal with \`is\`, which checks identity.`,
      fix: py`Use \`==\`. Keep \`is\` for \`None\`, \`True\`/\`False\` sentinels and your own sentinel objects.`,
    },
    {
      symptom: py`A count, total or second loop is unexpectedly 0 or empty — no error.`,
      cause: py`An iterator (generator, \`map\`, \`filter\`, \`zip\`, file, \`csv.reader\`) was consumed by an earlier pass.`,
      fix: py`Materialise once with \`list(...)\` if the data fits in memory, recreate the iterator, or compute everything in a single pass.`,
    },
    {
      symptom: py`A test passes locally but fails in CI with the same items in a different order.`,
      cause: py`The code relies on the iteration order of a set (string hashes are randomised per process), or compares lists built from sets.`,
      fix: py`Sort before comparing (\`sorted(result)\`), compare sets to sets, or keep order explicitly with \`dict.fromkeys\` / lists.`,
    },
  ],
  bestPractices: [
    'Use None as the default for mutable parameters and create the object inside the function.',
    'Bind loop values explicitly in callbacks (default argument or functools.partial).',
    'Use == for values, is only for None and other singletons.',
    'Create nested lists with a comprehension; deep-copy nested data that must be independent.',
    'Never add or remove items from a collection while iterating over it — build a new one.',
    'Treat generators, map, zip and files as one-shot; materialise with list() when you need two passes.',
    'Use Decimal or integer cents for money; math.isclose for float comparisons.',
    'Create mutable instance state in __init__, not as class attributes.',
    'Catch specific exceptions, log unexpected ones with a traceback, and re-raise.',
    'Await every coroutine or keep a reference to its task; heed RuntimeWarnings.',
    'Write tests that call functions twice and create two instances.',
  ],
  useCases: [
    'Predict-the-output rounds in technical screens.',
    'Code-review interviews: "what\'s wrong with this function?"',
    'Debugging production incidents: leaked state between requests, silent data loss, flaky tests.',
    'Writing lint rules and review checklists for a team.',
  ],
  whenToUse: {
    use: [
      'Default arguments only for immutable values (numbers, strings, tuples, None).',
      'Class attributes for constants and shared configuration that is never mutated.',
      'is for None, sentinels and identity checks you mean.',
      'Shallow copies for flat data or immutable contents; deepcopy for nested mutable data.',
    ],
    avoid: [
      'Mutable defaults, unless you deliberately want a cache and document it (functools.cache is clearer).',
      'except Exception: pass — or a bare except — anywhere outside a top-level handler that logs.',
      'Relying on set iteration order, float equality, or CPython\'s small-int/string caching.',
      'Calling async functions without await in "fire and forget" style.',
    ],
  },
  comparison: {
    title: 'Looks the same, behaves differently',
    headers: ['pair', 'first', 'second', 'why'],
    rows: [
      ['defaults', 'def f(x=[]) — one list shared by all calls', 'def f(x=None) — a new list per call', 'defaults are evaluated once at def time'],
      ['grids', '[[0] * 3] * 3 — one row, three references', '[[0] * 3 for _ in range(3)] — three rows', 'the comprehension re-evaluates the row expression'],
      ['copies', 'lst.copy() — new outer, shared inner', 'copy.deepcopy(lst) — everything new', 'shallow copies copy references'],
      ['closures', 'lambda: n — reads n when called', 'lambda n=n: n — value captured now', 'closures capture variables, defaults capture values'],
      ['identity', 'a is b — same object?', 'a == b — equal values?', 'equal values can be different objects'],
      ['division', '-7 // 2 == -4 (floor)', 'int(-7 / 2) == -3 (truncate)', '// floors towards negative infinity'],
      ['class attrs', 'self.count += 1 — creates an instance attribute', 'self.items.append(x) — mutates the shared class list', 'assignment binds on the instance, mutation changes the shared object'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'debugging-scenarios-q1',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Team:
    members = []

    def __init__(self, name):
        self.name = name

    def join(self, person):
        self.members.append(person)


red = Team("red")
blue = Team("blue")
red.join("Ada")
print(blue.members)`,
      answer: "['Ada']",
      accept: ['["Ada"]'],
      explanation: py`\`members\` is a **class** attribute: one list shared by every \`Team\`. \`self.members.append\` finds it on the class (the instance has no \`members\`) and mutates it, so \`blue\` sees Ada too. Fix: \`self.members = []\` in \`__init__\`.`,
    },
    {
      id: 'debugging-scenarios-q2',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`print(-7 // 2, -7 % 2, int(-7 / 2))`,
      options: [
        { text: '-3 -1 -3', why: 'That is truncation towards zero (C, Java). Python\'s // floors towards negative infinity.' },
        '-4 1 -3',
        { text: '-4 -1 -4', why: 'The remainder takes the sign of the divisor (2), so it is 1; and int() truncates towards zero, giving -3.' },
        { text: '-3.5 1 -3', why: '// on two ints returns an int, never -3.5.' },
      ],
      answer: 1,
      explanation: py`\`-7 // 2\` floors -3.5 down to -4. Python keeps \`(a // b) * b + a % b == a\`, so \`-7 % 2\` is \`1\`. \`int()\` truncates towards zero: \`int(-3.5)\` is -3. Watch for this when splitting negative amounts or computing time offsets.`,
    },
    {
      id: 'debugging-scenarios-q3',
      type: 'bug',
      prompt: 'Calling `add_sale(5)` raises `UnboundLocalError`. Click the line that makes `total_sales` local.',
      code: py`total_sales = 0


def add_sale(amount):
    if amount > 0:
        total_sales += amount
    return total_sales`,
      answerLine: 6,
      explanation: py`\`total_sales += amount\` is an assignment, so the compiler makes \`total_sales\` local to the whole function. Reading it (the right-hand side of \`+=\`) before it has a local value raises \`UnboundLocalError\`. Even \`add_sale(-1)\` fails, on line 7. Better design: \`def add_sale(total, amount): return total + amount\`.`,
    },
    {
      id: 'debugging-scenarios-q4',
      type: 'fill',
      prompt: 'Fix both gotchas: bind each `n` when the lambda is created, and test for the "no list given" default correctly.',
      code: py`multipliers = [lambda x, n=___: x * n for n in range(3)]

def add_item(item, items=None):
    if items is ___:
        items = []
    items.append(item)
    return items`,
      answer: [['n'], ['None']],
      explanation: py`\`n=n\` evaluates the current \`n\` when each lambda is created and stores it as that lambda's default. \`items is None\` (not \`if not items\`) keeps a caller's empty list.`,
    },
    {
      id: 'debugging-scenarios-q5',
      type: 'mcq',
      prompt: 'Inside an `async def main()`, someone writes `send_email(user)` instead of `await send_email(user)`, where `send_email` is an `async def` function. What happens?',
      options: [
        { text: 'The email is sent in the background', why: 'Calling an async function only creates a coroutine object. Nothing schedules it, so its body never runs.' },
        { text: 'A TypeError is raised immediately', why: 'Creating a coroutine is legal; Python only warns when it is garbage-collected without being awaited.' },
        'A coroutine object is created but never run; Python later warns "RuntimeWarning: coroutine \'send_email\' was never awaited"',
        { text: 'The program blocks until the email is sent', why: 'Nothing runs at all — that is the bug.' },
      ],
      answer: 2,
      explanation: py`Calling an \`async def\` function returns a coroutine; only \`await\`, \`asyncio.create_task\` or \`asyncio.run\` actually execute it. The warning appears when the unawaited coroutine is garbage-collected. See [asyncio basics](lesson:asyncio-basics).`,
    },
    {
      id: 'debugging-scenarios-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print(0.1 + 0.2 == 0.3, round(2.675, 2), round(2.5))`,
      options: [
        { text: 'True 2.68 3', why: 'All three are classic surprises: binary floats, the stored value of 2.675, and round-half-to-even.' },
        { text: 'False 2.68 3', why: '2.675 is stored as slightly less than 2.675, so it rounds down; and round() sends halves to the even neighbour.' },
        'False 2.67 2',
        { text: 'False 2.67 3', why: 'round(2.5) uses banker\'s rounding (round half to even), giving 2.' },
      ],
      answer: 2,
      explanation: py`\`0.1 + 0.2\` is \`0.30000000000000004\`. \`2.675\` is stored as a binary value just below 2.675, so it rounds to \`2.67\`. \`round(2.5)\` rounds half to even: \`2\`. For money, use \`Decimal\` with an explicit rounding mode.`,
    },
    {
      id: 'debugging-scenarios-q7',
      type: 'short',
      prompt: 'Why is `except Exception: pass` (or `return None`) around a big block dangerous? What would you write instead?',
      answer: py`It catches every ordinary error — including bugs like a mistyped dict key (KeyError), a None where an object was expected (AttributeError) or bad data (TypeError) — and turns them into silent wrong results, with no traceback to debug from. Instead, catch only the specific exception you expect and know how to handle (e.g. ValueError from int()), keep the try block small, and let everything else propagate to a top-level handler that logs it with logger.exception and either re-raises or returns an error response.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'sensor-report',
      title: 'Debug the sensor report',
      difficulty: 'intermediate',
      prompt: py`\`report(readings, log=None)\` should summarise sensor readings, ignoring glitches (\`None\` or negative values). It has **two** bugs: the count is always 0, and log lines from earlier calls leak into later reports.

Fix it so that \`report\` returns a dict with:

- \`"count"\` — number of valid readings, \`"total"\` — their sum, \`"average"\` — total / count, or \`0.0\` when there are none;
- \`"log"\` — the log list. If the caller passes a list as \`log\`, append one line to **that** list and return it; otherwise use a **new** list for this call only. The line is \`f"{count} readings, average {average:.1f}"\`.

Keep \`valid_readings\` as a generator function.`,
      files: {
        'main.py': py`def valid_readings(readings):
    """Yield the readings that are not None and not negative."""
    return (r for r in readings if r is not None and r >= 0)


def report(readings, log=[]):
    valid = valid_readings(readings)
    total = sum(valid)
    count = sum(1 for _ in valid)
    average = total / count if count else 0.0
    log.append(f"{count} readings, average {average:.1f}")
    return {"count": count, "total": total, "average": average, "log": log}


print(report([3, None, -1, 4]))
print(report([10]))
`,
      },
      hints: [
        'Two bugs, two root causes: a one-shot iterator is consumed twice, and a mutable default is shared between calls.',
        'Turn the generator into a list once: valid = list(valid_readings(readings)), then use len(valid).',
        'Change the signature to log=None and add: if log is None: log = []',
      ],
      solution: {
        explanation: py`\`sum(valid)\` consumed the generator, so the second pass counted nothing. Materialising it once with \`list(...)\` allows both \`len\` and \`sum\` (or compute both in one loop for huge data). The default \`log=[]\` was created once when \`def\` ran, so every call appended to the same list; \`log=None\` plus a fresh list per call fixes that while still honouring a list the caller passes in.`,
        files: {
          'main.py': py`def valid_readings(readings):
    """Yield the readings that are not None and not negative."""
    return (r for r in readings if r is not None and r >= 0)


def report(readings, log=None):
    if log is None:
        log = []
    valid = list(valid_readings(readings))
    count = len(valid)
    total = sum(valid)
    average = total / count if count else 0.0
    log.append(f"{count} readings, average {average:.1f}")
    return {"count": count, "total": total, "average": average, "log": log}


print(report([3, None, -1, 4]))
print(report([10]))
`,
        },
      },
      tests: [
        { name: 'counts and averages valid readings', code: py`r = report([3, None, -1, 4])
assert r["count"] == 2
assert r["total"] == 7
assert r["average"] == 3.5` },
        { name: 'no readings gives an average of 0.0', code: py`r = report([None, -5])
assert r["count"] == 0 and r["average"] == 0.0` },
        { name: 'log lines do not leak between calls', code: py`report([1])
assert report([2])["log"] == ["1 readings, average 2.0"]` },
        { name: 'a log passed in is appended to and returned', code: py`shared = []
report([1], shared)
result = report([3], shared)
assert result["log"] is shared
assert shared == ["1 readings, average 1.0", "1 readings, average 3.0"]` },
      ],
    },
    {
      id: 'leaderboard-state',
      title: 'Fix the leaderboard',
      difficulty: 'intermediate',
      prompt: py`Two game rooms each have their own \`Leaderboard\`, yet points scored in one room appear in the other, and a "snapshot" saved for the results page keeps changing. Fix the class so that:

- each \`Leaderboard()\` instance has its **own** \`scores\` dict;
- \`add(name, points)\` adds points to a player (starting from 0);
- \`snapshot()\` returns an **independent copy** of the scores (later \`add\` calls must not change it, and changing it must not change the board);
- \`leader()\` returns the name with the most points, or \`None\` for an empty board.`,
      files: {
        'main.py': py`class Leaderboard:
    scores = {}

    def add(self, name, points):
        self.scores[name] = self.scores.get(name, 0) + points

    def snapshot(self):
        return self.scores

    def leader(self):
        return max(self.scores, key=self.scores.get) if self.scores else None


room_a = Leaderboard()
room_b = Leaderboard()
room_a.add("ada", 5)
print(room_b.snapshot(), room_b.leader())
`,
      },
      hints: [
        'Where does scores live? A dict written in the class body is created once and shared by every instance.',
        'Add an __init__ that sets self.scores = {}.',
        'snapshot() should return dict(self.scores) (a shallow copy is enough: the values are immutable ints).',
      ],
      solution: {
        explanation: py`A dict in the class body is a **class attribute**: one object shared by all instances, and \`self.scores[...] = ...\` mutates it rather than creating a per-instance dict. Creating it in \`__init__\` gives each board its own. \`snapshot()\` returned the live dict (an alias), so it changed with the board; \`dict(self.scores)\` returns a new dict. A shallow copy is enough because the values are ints, which are immutable.`,
        files: {
          'main.py': py`class Leaderboard:
    def __init__(self):
        self.scores = {}

    def add(self, name, points):
        self.scores[name] = self.scores.get(name, 0) + points

    def snapshot(self):
        return dict(self.scores)

    def leader(self):
        return max(self.scores, key=self.scores.get) if self.scores else None


room_a = Leaderboard()
room_b = Leaderboard()
room_a.add("ada", 5)
print(room_b.snapshot(), room_b.leader())
`,
        },
      },
      tests: [
        { name: 'boards are independent', code: py`a = Leaderboard()
b = Leaderboard()
a.add("ada", 5)
assert b.snapshot() == {}
assert b.leader() is None` },
        { name: 'points accumulate', code: py`board = Leaderboard()
board.add("ada", 5)
board.add("ben", 3)
board.add("ada", 1)
assert board.snapshot() == {"ada": 6, "ben": 3}
assert board.leader() == "ada"` },
        { name: 'a snapshot does not change later', code: py`board = Leaderboard()
board.add("ada", 5)
saved = board.snapshot()
board.add("ada", 10)
assert saved == {"ada": 5}` },
        { name: 'changing a snapshot does not change the board', code: py`board = Leaderboard()
board.add("ada", 5)
board.snapshot()["ada"] = 999
assert board.snapshot() == {"ada": 5}` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'debugging-scenarios-status-is',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A login check `if status is "active":` passes in a quick REPL test but rejects real users whose status, read from the database, is `"active"`. Explain.',
      code: { lang: 'python', code: py`status = "".join(["act", "ive"])   # built at runtime, like data from a DB
print(status == "active")           # True: same text
# status is "active" would be False here: a different str object
# (and Python emits SyntaxWarning: "is" with 'str' literal)` },
      answer: '`is` checks identity (same object), not equal text. Literals typed in the REPL may be the same interned object, but strings built at runtime — from a database, file or input() — are separate objects. Use `==`; keep `is` for None and other singletons.',
      explanation: py`CPython interns some strings (such as identifier-like literals in compiled code), so \`is\` can *appear* to work in a quick test. That's an implementation detail, not a language rule. Python even warns at compile time: \`SyntaxWarning: "is" with 'str' literal. Did you mean "=="?\` See [None, truthiness & identity](lesson:none-and-truthiness).`,
      whyAsked: 'A quick check of identity vs equality using a realistic bug rather than a definition.',
      mistakes: ['Saying "is is faster, so it\'s fine"', 'Blaming the database driver', 'Not knowing why it sometimes works'],
      followUps: ['When is `is` the right operator?', 'What is string interning?', 'Why does `x is None` beat `x == None`?'],
      modelAnswer: 'The bug is using is, which asks whether both sides are the very same object, instead of ==, which compares the text. In the REPL, literal strings can be interned, so they happen to be the same object and the test passes. A status loaded from the database is a new string object with the same characters, so is returns False. Python even warns about is with a string literal. The fix is ==, and I keep is for singletons like None.',
    },
    {
      id: 'debugging-scenarios-dict-delete-loop',
      difficulty: 'beginner',
      type: 'output',
      minutes: 3,
      question: 'This code removes sold-out items from a stock dict. What happens?',
      code: { lang: 'python', code: py`stock = {"tea": 0, "cake": 4, "jam": 0}
for item, qty in stock.items():
    if qty == 0:
        del stock[item]
print(stock)` },
      options: [
        "It prints {'cake': 4}",
        'RuntimeError: dictionary changed size during iteration',
        "It prints {'cake': 4, 'jam': 0} with no error",
        'KeyError: \'tea\'',
      ],
      correctOption: 1,
      answer: 'RuntimeError: dictionary changed size during iteration — raised on the next loop step after "tea" is deleted. Fix: build a new dict, `stock = {k: q for k, q in stock.items() if q}`, or loop over `list(stock.items())`.',
      explanation: py`Dicts detect structural changes during iteration and raise rather than silently skipping (lists don't — they just skip items). After the error, "tea" is already deleted and "jam" isn't: \`{'cake': 4, 'jam': 0}\`, a half-done change. A comprehension is clearer and atomic from the reader's view.`,
      whyAsked: 'Mutation during iteration is a classic bug; the dict version raises, the list version silently skips — interviewers like to probe both.',
      mistakes: ['Assuming it silently works like it "should"', 'Thinking lists raise the same error', 'Fixing it with a try/except around the loop'],
      followUps: ['What happens with a list and remove() instead?', 'Is changing a value (not a key) during iteration allowed?', 'Why does a dict raise but a list doesn\'t?'],
      modelAnswer: 'It raises RuntimeError: dictionary changed size during iteration. The first sold-out item, tea, is deleted, and on the next step the dict iterator notices the size changed and stops with an error, leaving the dict half-updated. Updating the value of an existing key is fine, but adding or removing keys isn\'t. I\'d build a new dict with a comprehension that keeps items with a non-zero quantity, or iterate over a list copy of the items if I must mutate in place.',
    },
    {
      id: 'debugging-scenarios-signup-errors',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A sign-up validator returns errors for valid requests — but only after an invalid one has been processed. What does `second` contain, and why?',
      code: { lang: 'python', code: py`def validate(request, errors=[]):
    if not request.get("email"):
        errors.append("email missing")
    return errors


first = validate({})
second = validate({"email": "ada@example.com"})
print(second)` },
      options: ["[]", "['email missing']", "['email missing', 'email missing']", 'None'],
      correctOption: 1,
      answer: "['email missing'] — the default list was created once when `def` ran, and the first call appended to it. The second call, though valid, returns that same list. Fix: `errors=None` and `if errors is None: errors = []`.",
      explanation: py`In a web app this leaks one user's validation errors into another user's response, and the list grows for the life of the process. \`first is second\` is \`True\`. Linters flag it (Ruff/bugbear B006). Prefer returning a fresh list rather than mutating an argument at all.`,
      whyAsked: 'Mutable defaults are the single most famous Python gotcha; framing it as a request handler checks you see the production impact.',
      mistakes: ['Saying the default is re-created on every call', 'Fixing with errors = errors or [] (drops a caller\'s empty list)', 'Not mentioning the memory leak and cross-request data leak'],
      followUps: ['Where is the default stored? (validate.__defaults__)', 'Is a mutable default ever intentional?', 'How would you catch this automatically?'],
      modelAnswer: 'second contains email missing, even though that request was valid. Default values are evaluated once, when the def statement runs, and stored on the function, so every call that omits errors shares one list. The first call appended to it and the second call returned the same object. In a server that leaks errors between users and grows forever. The fix is a None default and creating a new list inside the function — or simply building and returning a fresh list without an errors parameter.',
    },
    {
      id: 'debugging-scenarios-menu-callbacks',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A GUI builds one click handler per menu item. What does this print?',
      code: { lang: 'python', code: py`handlers = {name: lambda: f"clicked {name}" for name in ["save", "load", "quit"]}
print(handlers["save"](), handlers["load"]())` },
      options: ['clicked save clicked load', 'clicked quit clicked quit', 'clicked save clicked save', 'NameError: name \'name\' is not defined'],
      correctOption: 1,
      answer: 'clicked quit clicked quit — every lambda closes over the same `name` variable of the comprehension, read when the handler is called, after the loop has finished on "quit". Fix with `lambda name=name: ...` or `functools.partial(on_click, name)`.',
      explanation: py`The dict *keys* are right ("save", "load", "quit") because they're evaluated during the loop; the lambda *bodies* run later. Comprehensions have their own scope, so \`name\` survives inside the closures' shared cell even though it's not visible outside — no \`NameError\`. \`partial\` is often clearer than a default argument because the extra parameter can't be overridden by accident.`,
      whyAsked: 'Late binding appears in callbacks, GUI code, retry loops and task scheduling; this checks you can predict it in a dict-comprehension form.',
      mistakes: ['Predicting NameError because the comprehension variable "doesn\'t exist"', 'Thinking keys and values bind at different times without explaining why', 'Fixing it with a global variable'],
      followUps: ['Why are the keys right but the handlers wrong?', 'How does functools.partial fix it?', 'Does the same happen with a generator expression?'],
      modelAnswer: 'It prints clicked quit twice. The keys are evaluated during the loop so they\'re correct, but each lambda body only runs when it\'s called, and it looks up name then. All three lambdas share the comprehension\'s single name variable, which ended on quit. To capture the value at creation time I\'d use a default argument, lambda name=name, or better functools.partial with a real handler function, which makes the bound value explicit.',
    },
    {
      id: 'debugging-scenarios-nested-settings',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Each user gets a copy of the default editor settings. What is printed?',
      code: { lang: 'python', code: py`import copy

defaults = {"theme": "light", "plugins": ["spellcheck"]}
user = copy.copy(defaults)
user["theme"] = "dark"
user["plugins"].append("vim")
print(defaults)` },
      options: [
        "{'theme': 'light', 'plugins': ['spellcheck']}",
        "{'theme': 'dark', 'plugins': ['spellcheck', 'vim']}",
        "{'theme': 'light', 'plugins': ['spellcheck', 'vim']}",
        "{'theme': 'dark', 'plugins': ['spellcheck']}",
      ],
      correctOption: 2,
      answer: "{'theme': 'light', 'plugins': ['spellcheck', 'vim']} — the shallow copy has its own keys, so rebinding \"theme\" only affects `user`, but both dicts share the same plugins list, so the append shows up in the defaults.",
      explanation: py`\`copy.copy\` (like \`dict(d)\` or \`d.copy()\`) creates a new outer dict whose values are the *same* objects. Assigning a key rebinds it in one dict; mutating a shared value is visible from both. Use \`copy.deepcopy(defaults)\` or a factory function that builds fresh nested values per user.`,
      whyAsked: 'The half-right result (theme correct, plugins wrong) distinguishes candidates who really understand shallow copies.',
      mistakes: ['Predicting that a copy is fully independent', 'Predicting that the theme also changed', 'Reaching for deepcopy everywhere without explaining the cost'],
      followUps: ['How does deepcopy handle cycles? (a memo dict)', 'How would you make the defaults read-only?', 'When is a shallow copy enough?'],
      modelAnswer: 'It prints theme light with plugins spellcheck and vim. copy.copy makes a new outer dict, so assigning a new theme only changes the user\'s dict. But the values are the same objects, so both dicts point at one plugins list, and appending vim mutates it for everyone. I\'d deep-copy the defaults or, better, build them fresh in a function so every user gets new nested lists.',
    },
    {
      id: 'debugging-scenarios-file-read-twice',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'An import job counts the lines of a CSV, then parses them — but always imports nothing. Why?',
      code: { lang: 'python', code: py`with open("orders.csv", encoding="utf-8") as f:
    count = sum(1 for _ in f)                    # reads to the end
    rows = [line.split(",") for line in f]       # [] - nothing left
print(count, rows)` },
      answer: 'A file object is an iterator: the first loop read it to the end, so the second loop gets nothing — no error. Read once (`lines = f.readlines()` or `list(f)` for small files), do everything in a single pass, or `f.seek(0)` before re-reading.',
      explanation: py`Generators, \`map\`, \`filter\`, \`zip\`, \`csv.reader\` and file objects are all one-shot iterators. An empty second pass never raises, so the symptom is just "nothing happened". For large files, a single pass that both counts and parses keeps memory constant; \`f.seek(0)\` works for real files but not for streams like \`sys.stdin\` or network responses.`,
      whyAsked: 'Iterator exhaustion causes silent data loss in ETL jobs; this checks you recognise file objects as iterators.',
      mistakes: ['Thinking the file is "closed" after the first loop', 'Loading a huge file into memory to fix it', 'Not knowing that seek(0) can\'t rewind every stream'],
      followUps: ['How would you count and parse in one pass?', 'Which built-ins return iterators rather than lists?', 'How can you tell if an object is an iterator? (iter(x) is x)'],
      modelAnswer: 'The file object is an iterator over lines. The first generator expression reads it all the way to the end to count, so when the comprehension iterates again there\'s nothing left, and it silently produces an empty list. Small files I\'d read once into a list; big files I\'d process in a single pass, counting while parsing. f.seek(0) also works for a real file, but not for streams such as stdin, so a single pass is the more robust fix.',
    },
    {
      id: 'debugging-scenarios-invoice-rounding',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'An invoicing service computes `round(price * qty * 1.2, 2)` with floats. Finance reports totals that are sometimes a cent off, and a check `total == expected` occasionally fails. What\'s going on and how do you fix it?',
      code: { lang: 'python', code: py`from decimal import Decimal, ROUND_HALF_UP

print(sum([0.1] * 3))          # 0.30000000000000004
print(round(2.675, 2))         # 2.67: 2.675 is stored just below 2.675
print(round(2.5))              # 2: round half to even

total = Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
print(total)                   # 2.68` },
      answer: 'Binary floats can\'t represent most decimal fractions exactly, so sums drift and == fails; round() uses round-half-to-even on the stored binary value. Use decimal.Decimal built from strings (or integer cents) with an explicit rounding mode, round once at the defined point, and compare money exactly in that representation.',
      explanation: py`Three separate surprises: representation error (\`0.1\` isn't exact), *where* you round (rounding each line vs the total gives different answers — the business must choose), and *how* you round (\`round()\` is banker's rounding; invoices often require half-up). \`Decimal("0.1")\` is exact; \`Decimal(0.1)\` copies the float's error. See [numbers & math](lesson:numbers-and-math).`,
      whyAsked: 'Money bugs are expensive and common; the answer reveals whether you know float representation and rounding rules precisely.',
      mistakes: ['Saying "Python floats are buggy"', 'Constructing Decimal from a float', 'Fixing equality with round(x, 2) == y, which still uses floats', 'Not asking finance which rounding rule applies'],
      followUps: ['Round per line or on the total?', 'Why is Decimal(0.1) different from Decimal("0.1")?', 'How would you store amounts in a database?'],
      modelAnswer: 'Floats are binary, so values like 0.1 or 2.675 are stored as the nearest binary fraction; sums drift slightly, exact equality fails, and round works on that stored value — and it rounds halves to even, which isn\'t what invoices usually want. For money I\'d use Decimal created from strings, or integer cents, and apply an explicit rounding mode such as ROUND_HALF_UP with quantize. I\'d also confirm with finance whether to round each line or only the total, because that changes the result. Then comparisons are exact, and floats stay for measurements where tiny errors don\'t matter.',
    },
    {
      id: 'debugging-scenarios-late-assignment',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What happens when `load()` is called?',
      code: { lang: 'python', code: py`config = {"debug": False}


def load():
    if config["debug"]:
        print("debug on")
    config = {"debug": True}
    return config


load()` },
      options: [
        'It returns {\'debug\': True}',
        'It prints "debug on"',
        "UnboundLocalError: cannot access local variable 'config' where it is not associated with a value",
        "NameError: name 'config' is not defined",
      ],
      correctOption: 2,
      answer: "UnboundLocalError on the `if` line. Because `config` is assigned later in the function, the compiler treats it as local for the entire function, so the earlier read finds a local with no value yet.",
      explanation: py`Scope is decided when the function is compiled, not line by line as it runs. Any assignment to a name in a function body (here \`config = …\`) makes it local everywhere in that body. Fixes: rename the local (\`new_config = …\`), or pass the config in and return the new one. The message shown is the modern wording (3.11+); older versions say "local variable 'config' referenced before assignment".`,
      whyAsked: 'Tests the compile-time nature of scope with an assignment *after* the read — a twist on the usual counter example.',
      mistakes: ['Expecting Python to use the global until the assignment line', 'Predicting NameError', 'Reaching for global as the first fix'],
      followUps: ['How can you see which names are local? (load.__code__.co_varnames)', 'What would `global config` change?', 'Why is UnboundLocalError a subclass of NameError?'],
      modelAnswer: 'It raises UnboundLocalError on the if line. Python decides scope when it compiles the function: because config is assigned somewhere in load, it\'s a local name for the whole function, even on lines before the assignment. So reading config["debug"] looks for a local that doesn\'t have a value yet. I\'d fix it by using a different local name or by passing the config in and returning the new one, rather than adding a global statement.',
    },
    {
      id: 'debugging-scenarios-class-attr-augmented',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'Predict the output, and explain why the two attributes behave differently.',
      code: { lang: 'python', code: py`class Settings:
    total = 0
    tags = []


a = Settings()
b = Settings()
a.total += 1
a.tags += ["x"]
print(b.total, b.tags, Settings.total)` },
      options: ["0 [] 0", "1 ['x'] 1", "0 ['x'] 0", "1 [] 0"],
      correctOption: 2,
      answer: "0 ['x'] 0. `a.total += 1` reads the class's 0, computes 1, and assigns it as a new instance attribute on `a`. `a.tags += [\"x\"]` calls list.__iadd__, which mutates the shared class list in place, then assigns that same list to `a.tags`. b sees the mutated list but the class total is untouched.",
      explanation: py`Augmented assignment on an attribute is "get, in-place operate, set". For an immutable int the operation makes a new object and the *set* creates an instance attribute that shadows the class one. For a list, \`__iadd__\` mutates the existing object (the shared class list) and returns it; the *set* then binds \`a.tags\` to that same list. Afterwards both \`"total"\` and \`"tags"\` are in \`vars(a)\`.`,
      whyAsked: 'Combines attribute lookup order, augmented assignment and mutability — a favourite advanced output question.',
      mistakes: ['Assuming += on an attribute modifies the class', 'Assuming both behave like the int', 'Not knowing that a.tags becomes an instance attribute too'],
      followUps: ['What is in vars(a) afterwards?', 'How would you count instances correctly in a class attribute? (Settings.total += 1)', 'What happens with a tuple class attribute?'],
      modelAnswer: 'It prints 0, a list containing x, and 0. For a.total += 1, Python reads total — found on the class, zero — adds one to make a new int, and then assigns it to a.total, which creates an instance attribute and leaves the class alone. For a.tags += ["x"], it reads the class\'s list and calls list.__iadd__, which extends that shared list in place, then assigns the same list to a.tags. So b sees the extra tag, but neither b nor the class sees a new total. The rule is: create mutable state in __init__, and update class-level counters through the class name.',
    },
    {
      id: 'debugging-scenarios-swallowed-keyerror',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A pricing function returns `None` for every product after a refactor, with no errors in the logs. Find the bug and explain why it was hard to see.',
      code: { lang: 'python', code: py`def price_of(item, catalogue):
    try:
        return catalogue[item]["prise"]      # typo: should be "price"
    except Exception:
        return None                          # hides the KeyError


print(price_of("tea", {"tea": {"price": 3}}))   # None` },
      answer: 'The typo raises KeyError, which the broad `except Exception` converts into None — the same value used for "unknown product". Catch only the expected failure (a missing product), let other errors surface, and log unexpected ones with a traceback.',
      explanation: py`A try block that's too big plus an exception type that's too broad turns programming errors into data. A better version checks \`if item not in catalogue: return None\` (or raises a domain error), then reads \`catalogue[item]["price"]\` outside any try. At service boundaries, log with \`logger.exception(...)\` and re-raise or return an error response. See [error handling patterns](lesson:error-handling-patterns).`,
      whyAsked: 'Exception swallowing is a top cause of "silently wrong" production behaviour; interviewers want to hear narrow excepts and logging.',
      mistakes: ['Only fixing the typo and keeping the broad except', 'Replacing it with a bare except:', 'Logging without the traceback'],
      followUps: ['Where should a catch-all handler live?', 'What does logger.exception add?', 'When is `except Exception` acceptable?'],
      modelAnswer: 'The key typo raises KeyError, but the try block wraps the whole lookup and catches Exception, so the error is turned into None — exactly what the function returns for an unknown product. That\'s why nothing appeared in the logs and every price looked missing. I\'d fix the typo, but also narrow the handling: check whether the product exists and return None only for that case, and let any other error propagate. A catch-all belongs at the top of the request or job, where it logs with logger.exception so we keep the traceback.',
    },
    {
      id: 'debugging-scenarios-flaky-set-order',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A test `assert list(unique_tags(post)) == ["python", "tips", "async"]` passes on your laptop and fails randomly in CI. `unique_tags` returns `set(tags)`. Explain and fix — and say what you *can* rely on for dict order.',
      code: { lang: 'python', code: py`tags = ["python", "tips", "python", "async"]

print(sorted(set(tags)))            # deterministic: ['async', 'python', 'tips']
print(list(dict.fromkeys(tags)))    # first-seen order: ['python', 'tips', 'async']

print({"a": 1, "b": 2} == {"b": 2, "a": 1})               # True: dict equality ignores order
print(list({"a": 1, "b": 2}) == list({"b": 2, "a": 1}))   # False: iteration order differs` },
      answer: 'Sets are unordered, and string hashes are randomised per process by default, so a set of strings can iterate in a different order on every run. Compare as sets, sort, or use dict.fromkeys(tags) to de-duplicate while keeping first-seen order. Dicts (3.7+) guarantee insertion order for iteration, but dict equality ignores order.',
      explanation: py`Hash randomisation (controlled by \`PYTHONHASHSEED\`) protects servers against hash-flooding attacks; it's why string sets reorder between runs while small-int sets often look sorted. Fix the *test's intent*: if order doesn't matter, \`assert set(result) == {...}\`; if it does, make the function return an ordered type. Also beware \`json.dumps\` output order (insertion order unless \`sort_keys=True\`) when comparing serialized data.`,
      whyAsked: 'Flaky tests from order assumptions are common; the answer shows whether you know which orders are guaranteed.',
      mistakes: ['Setting PYTHONHASHSEED=0 in CI to "fix" the test', 'Claiming dicts are unordered', 'Claiming sets are ordered "since 3.7"'],
      followUps: ['Why are string hashes randomised?', 'Is OrderedDict still useful?', 'How would you compare two lists ignoring order but not duplicates? (Counter or sorted)'],
      modelAnswer: 'The function returns a set, and sets have no defined order. In CPython, string hashes are randomised per process, so the same set of strings can come out in a different order on each run, which is why the test is flaky. If order doesn\'t matter, the test should compare sets or sorted lists; if it does matter, the function should return dict.fromkeys(tags) as a list, which de-duplicates and keeps first-seen order. Dicts are guaranteed to preserve insertion order since 3.7, but dict equality ignores order, so I\'d be explicit about which property a test checks.',
    },
    {
      id: 'debugging-scenarios-unawaited-coroutine',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'An async order service "saves" orders but the database stays empty. The logs show `RuntimeWarning: coroutine \'save\' was never awaited`. Find both bugs in this handler.',
      code: { lang: 'python', code: py`import asyncio


async def save(order):
    await asyncio.sleep(0.01)          # pretend database write
    print("saved", order)


async def handle(order):
    save(order)                         # bug 1: never awaited
    asyncio.create_task(save(order))    # bug 2: task reference not kept
    return "ok"


async def handle_fixed(order):
    await save(order)                   # or: keep the task / use a TaskGroup
    return "ok"


print(asyncio.run(handle_fixed("A1")))` },
      answer: 'Bug 1: calling an async function without await only creates a coroutine; it never runs. Bug 2: create_task schedules it, but the handler doesn\'t keep a reference or wait for it — the event loop holds only weak references, so the task can be garbage-collected mid-way, and the handler returns "ok" before the save finishes (or fails). Await it, or keep the task and await it later / use asyncio.TaskGroup (3.11+).',
      explanation: py`\`create_task\` is for concurrency, not for fire-and-forget without supervision. The asyncio docs explicitly warn to save a reference to tasks. Errors inside an unsupervised task are only reported as "Task exception was never retrieved". A \`TaskGroup\` waits for all its tasks and propagates their errors. Run with \`PYTHONASYNCIODEBUG=1\` or \`asyncio.run(main(), debug=True)\` to surface such mistakes. See [asyncio basics](lesson:asyncio-basics).`,
      whyAsked: 'Async bugs are silent; interviewers check that you know what actually schedules a coroutine and how tasks are supervised.',
      mistakes: ['Thinking calling an async function starts it', 'Using create_task without keeping the task or awaiting it', 'Wrapping in a thread to "make it run"'],
      followUps: ['What does a TaskGroup do if one task fails?', 'How do you add a timeout? (asyncio.timeout, 3.11+)', 'What does asyncio debug mode report?'],
      modelAnswer: 'First, save(order) without await just builds a coroutine object, which is never run — hence the warning. Second, create_task does schedule it, but the handler neither keeps the task nor awaits it; the loop only holds weak references, so it can be garbage-collected, and either way the handler reports ok before the write finished and any error is lost. If the response depends on the save, I simply await it. If I want several saves concurrently, I use a TaskGroup so they\'re all awaited and failures propagate, and I\'d enable asyncio debug mode in development to catch these early.',
    },
    {
      id: 'debugging-scenarios-build-index',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Fix `build_index(docs)`, which maps each lower-cased word to the list of document ids containing it. Two bugs: results leak between calls, and a document appears twice when a word repeats in it. Each call must return a new dict; ids appear once per word, in `docs` order.',
      answer: 'Remove the mutable default (create `index = {}` inside), and only append a doc id if it isn\'t already the last id for that word (docs are processed in order, so checking ids[-1] is enough).',
      explanation: py`Two gotchas in one function: \`index={}\` is created once at definition time and shared between calls, and \`setdefault(...).append\` runs once per *occurrence*, not once per document. Because each document is processed completely before the next, a repeated id can only be the last element, so \`ids[-1] != doc_id\` is an O(1) check. Alternatives: a set per word (loses order) or \`dict.fromkeys\` per document's words.`,
      starter: { files: { 'main.py': py`def build_index(docs, index={}):
    for doc_id, text in docs.items():
        for word in text.lower().split():
            index.setdefault(word, []).append(doc_id)
    return index


print(build_index({"d1": "Tea and cake", "d2": "tea tea"}))
` } },
      tests: [
        { name: 'one id per word per document', code: py`assert build_index({"d1": "Tea and cake", "d2": "tea tea"}) == {"tea": ["d1", "d2"], "and": ["d1"], "cake": ["d1"]}` },
        { name: 'calls do not share state', code: py`build_index({"a": "x"})
assert build_index({"b": "y"}) == {"y": ["b"]}` },
        { name: 'empty input gives an empty dict', code: py`assert build_index({}) == {}` },
      ],
      solution: { files: { 'main.py': py`def build_index(docs):
    index = {}
    for doc_id, text in docs.items():
        for word in text.lower().split():
            ids = index.setdefault(word, [])
            if not ids or ids[-1] != doc_id:
                ids.append(doc_id)
    return index


print(build_index({"d1": "Tea and cake", "d2": "tea tea"}))
` } },
      hints: ['Run it twice in a row. Where does the second call\'s data come from?', 'Create the dict inside the function.', 'A repeated word within one document would append the same doc id again — check the last id before appending.'],
      whyAsked: 'A realistic code-review fix with two independent gotchas; it checks that you test the second call.',
      mistakes: ['Fixing only one bug', 'Using `if doc_id not in ids` (correct but O(n) per check)', 'Switching to sets and losing the required order'],
      followUps: ['How would you strip punctuation?', 'How would you support removing a document?', 'What is the complexity?'],
      modelAnswer: 'There are two bugs. The default index dict is created once when the function is defined, so every call adds to the same dict and results leak between calls; I create it inside the function instead. And the inner loop appends the document id for every occurrence of a word, so "tea tea" adds d2 twice; since documents are processed one at a time, a duplicate can only be the last id in the list, so I append only when the last id differs. That keeps ids unique and in document order with an O(1) check, and the whole build is linear in the total number of words.',
    },
    {
      id: 'debugging-scenarios-parse-prices',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Rewrite `parse_prices(lines)` so it stops swallowing errors. Return a tuple `(prices, errors)`: skip blank (whitespace-only) lines silently; for lines that aren\'t valid numbers, record `(line_number, stripped_text)` with 1-based line numbers; if an item isn\'t a `str` at all, raise `TypeError` — that\'s a programming error, not bad data.',
      answer: 'Loop with enumerate(lines, start=1); raise TypeError for non-strings; strip; skip empty; try float(text) except ValueError: record the error. Only ValueError — the one failure we expect from bad data — is caught.',
      explanation: py`The original \`except: pass\` treated three different situations the same way: expected bad data (should be reported), blank lines (should be skipped), and caller bugs like \`None\` in the list (should crash loudly). Separating them makes the function honest: callers get usable prices, a list of problems to show the user, and an exception when they misuse the API. Keeping the \`try\` around just \`float(text)\` ensures nothing else gets caught by accident.`,
      starter: { files: { 'main.py': py`def parse_prices(lines):
    prices = []
    for line in lines:
        try:
            prices.append(float(line))
        except:
            pass
    return prices


print(parse_prices(["1.5", "", "abc", " 2 "]))
` } },
      tests: [
        { name: 'returns prices and errors', code: py`assert parse_prices(["1.5", "", "abc", " 2 "]) == ([1.5, 2.0], [(3, "abc")])` },
        { name: 'blank lines are skipped silently', code: py`assert parse_prices(["   ", "4"]) == ([4.0], [])` },
        { name: 'non-strings raise TypeError', code: py`with raises(TypeError):
    parse_prices(["1", None])` },
        { name: 'error text is stripped', code: py`assert parse_prices(["  12,50  "]) == ([], [(1, "12,50")])` },
      ],
      solution: { files: { 'main.py': py`def parse_prices(lines):
    prices, errors = [], []
    for number, line in enumerate(lines, start=1):
        if not isinstance(line, str):
            raise TypeError(f"line {number} is not a string: {line!r}")
        text = line.strip()
        if not text:
            continue
        try:
            prices.append(float(text))
        except ValueError:
            errors.append((number, text))
    return prices, errors


print(parse_prices(["1.5", "", "abc", " 2 "]))
` } },
      hints: ['Separate the three cases: blank, bad data, programming error.', 'enumerate(lines, start=1) gives 1-based line numbers.', 'Wrap only float(text) in try, and catch only ValueError.'],
      whyAsked: 'Shows whether you can turn "swallow everything" code into explicit, testable error handling.',
      mistakes: ['Catching Exception instead of ValueError', 'Putting the whole loop body inside try', 'Returning None for bad lines so errors are invisible'],
      followUps: ['How would you report errors to a user uploading a file?', 'Should "nan" or "inf" be accepted? (float() accepts them)', 'When would you raise on the first bad line instead?'],
      modelAnswer: 'The original bare except treats blank lines, bad data and caller bugs identically and hides them all. I\'d separate them: with enumerate starting at one, I first raise TypeError if an item isn\'t a string, because that\'s a programming error; then strip and skip blank lines; then wrap only float(text) in a try that catches ValueError and records the line number and text. The function returns prices and errors, so callers can show the problems to the user. One thing I\'d ask about is whether nan and inf should be allowed, since float accepts them.',
    },
  ],

  takeaways: [
    'Default argument values are evaluated once, at def time: use None for mutable defaults.',
    'Closures read variables when called (late binding): capture values with a default argument or functools.partial.',
    'is compares identity, == compares values; use is only for None and singletons.',
    '[[0] * n] * n and shallow copies share inner objects; build rows in a comprehension, deep-copy nested data.',
    'Never add/remove items while iterating: lists skip items, dicts raise RuntimeError.',
    'Generators, map, zip, csv readers and files are one-shot: the second pass is silently empty.',
    'Floats are binary approximations; round() rounds half to even; // floors; use Decimal or cents for money.',
    'Assigning a name anywhere in a function makes it local everywhere in it — hence UnboundLocalError.',
    'Mutable class attributes are shared by all instances; create state in __init__.',
    'Catch narrow exceptions, log unexpected ones, never pass silently — and always await coroutines.',
  ],
}
