// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const EVIDENCE_LAB = py`# Evidence lab: every rapid-review claim backed by real output.
import copy


def check(claim, evidence):
    print(f"{claim:<36} -> {evidence}")


# 1. Tuples are immutable, so (if their items are hashable) they can be keys
point = (51.5, -0.12)
check("a tuple works as a dict key", {point: "London"}[point])

# 2. Dicts keep insertion order (a language guarantee since 3.7)
stock = {"tea": 3}
stock["cake"] = 1
stock["jam"] = 2
check("dict order = insertion order", list(stock))

# 3. Shallow copies share inner objects; deep copies don't
orders = [["tea", 2]]
shallow, deep = copy.copy(orders), copy.deepcopy(orders)
orders[0][1] = 99
check("shallow vs deep after a change", (shallow[0][1], deep[0][1]))


# 4. *args collects a tuple, **kwargs a dict
def describe(*args, **kwargs):
    return args, kwargs


check("describe(1, 2, size='L')", describe(1, 2, size="L"))


# 5. A decorator replaces a function with a wrapper
def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper


@shout
def greet(name):
    """Say hello."""
    return f"hello {name}"


check("greet('ada')", greet("ada"))
check("greet.__name__", greet.__name__)

# 6. Generators are iterators: one pass only
squares = (n * n for n in range(3))
check("iter(squares) is squares", iter(squares) is squares)
check("first pass, second pass", (list(squares), list(squares)))


# 7. __new__ creates the object, __init__ fills it in
class Tag:
    def __new__(cls, label):
        print("  Tag.__new__ creates the object")
        return super().__new__(cls)

    def __init__(self, label):
        print("  Tag.__init__ sets attributes")
        self.label = label


check("Tag('sale').label", Tag("sale").label)

# 8. Comprehension variables don't leak into the enclosing scope
x = "outer"
doubled = [x * 2 for x in range(3)]
check("x after [x * 2 for x in ...]", x)


# 9. Type hints are not checked at runtime
def area(width: int, height: int) -> int:
    return width * height


check("area('ab', 3)", area("ab", 3))
`

export default {
  id: 'rapid-review',
  title: 'Rapid review: the questions that come up most',
  summary: 'Crisp, accurate answers to the Python questions interviewers ask most — collections, copying, functions, decorators, generators, OOP, errors, tooling, concurrency, memory and what\'s new — each backed by evidence you can run.',
  difficulty: 'advanced',
  minutes: 75,
  prerequisites: ['tuples-and-unpacking', 'dictionaries', 'decorators', 'generators', 'classes-and-objects'],
  related: ['answering-framework', 'coding-patterns', 'debugging-scenarios', 'mutability-and-copying', 'function-arguments', 'iterators', 'methods-and-attributes', 'special-methods', 'polymorphism-and-duck-typing', 'context-managers', 'comprehensions', 'error-handling-patterns', 'virtual-environments', 'testing-fundamentals', 'type-hints', 'concurrency-concepts', 'choosing-concurrency', 'gil-and-free-threading', 'memory-management', 'modern-features'],
  tags: ['interview', 'rapid review', 'cheat sheet', 'list vs tuple', 'dict internals', 'deep copy', 'shallow copy', 'args', 'kwargs', 'decorators', 'generators', 'iterators', 'GIL', '__new__', '__init__', 'classmethod', 'staticmethod', 'duck typing', 'context managers', 'comprehensions', 'exceptions', 'virtual environments', 'testing', 'type hints', 'asyncio', 'threads', 'processes', 'memory management', 'whats new'],
  apis: [
    { name: 'functools.wraps', summary: 'Copies __name__, __doc__ and other metadata from the wrapped function onto a decorator\'s wrapper.' },
    { name: 'copy.copy() / copy.deepcopy()', summary: 'Shallow copy (new container, shared contents) vs recursive deep copy.' },
    { name: 'object.__new__(cls)', summary: 'Creates (allocates) a new instance; __init__ then initialises it.' },
    { name: '@classmethod / @staticmethod', summary: 'A method that receives the class (cls) / a plain function namespaced in the class.' },
    { name: 'contextlib.contextmanager', summary: 'Turn a generator with one yield into a context manager; code after yield is the cleanup.' },
    { name: 'asyncio.to_thread()', summary: 'Run a blocking function in a worker thread from async code without blocking the event loop.' },
    { name: 'sys._is_gil_enabled()', summary: 'CPython 3.13+: whether the GIL is active (False only on a free-threaded build with the GIL disabled).' },
  ],
  docs: [
    { label: 'Python glossary', url: 'https://docs.python.org/3/glossary.html' },
    { label: 'Data model (special methods, __new__, __init__)', url: 'https://docs.python.org/3/reference/datamodel.html' },
    { label: 'Programming FAQ', url: 'https://docs.python.org/3/faq/programming.html' },
    { label: "What's New in Python 3.14", url: 'https://docs.python.org/3/whatsnew/3.14.html' },
    { label: 'Python HOWTO: free-threading', url: 'https://docs.python.org/3/howto/free-threading-python.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`This is the lesson to reread the night before an interview. It collects the questions that come up again and again — "list or tuple?", "what's the GIL?", "\`__new__\` vs \`__init__\`?" — with **crisp answers**: one or two accurate sentences you can say out loud, plus a link to the full lesson when you want depth.`,
    py`Crisp doesn't mean shallow. Each answer separates *language guarantees* (true in every Python), *CPython implementation details* (true in the standard interpreter, labelled), and *conventions*. Interviewers notice that precision.`,
    py`The playground is an **evidence lab**: every claim is backed by a line of real output, so you can prove your answers instead of just reciting them. Use the [answering framework](lesson:answering-framework) to expand any crisp answer into a full one.`,
  ],
  why: [
    py`Interviews mix deep dives with quick-fire checks. In the quick-fire part, a rambling or slightly wrong answer costs more than a short, exact one — and many "easy" questions hide a trap (dict order *since when?*, does the GIL make \`+=\` thread-safe?).`,
    py`Reviewing everything in one place also shows the connections: decorators rely on closures, generators are iterators, context managers rely on exceptions, \`__new__\` explains immutable types, and the GIL explains the asyncio/threads/processes choice. Seeing the links lets you answer follow-ups you didn't prepare for.`,
  ],
  eli15: [
    py`Think of revision cards before an exam. Each card has a question on the front and a short, correct answer on the back. You don't write an essay on the card — just the key idea, maybe a tiny example, and a note saying where to read more.`,
    py`This lesson is a stack of those cards for Python. The trick is to make each answer **short and true**: "a tuple is an immutable sequence, so it can be a dict key if its items are hashable" beats a minute of waffle.`,
    py`And when you're not sure a card is right, you test it — that's what the evidence lab is for.`,
  ],
  analogy: {
    title: 'A pilot\'s checklist',
    body: [
      py`Pilots know how to fly, yet they still run a checklist before take-off. The checklist isn't the knowledge — it's a fast, reliable way to make sure nothing important is forgotten under pressure.`,
      py`This rapid review is your pre-flight checklist. Each item is short because the deep understanding lives in the topic lessons; the checklist makes sure it's at your fingertips when the interviewer asks.`,
    ],
    mapping: [
      ['the checklist item', 'a crisp answer you can say in one breath'],
      ['the flight manual', 'the topic lesson linked from each answer'],
      ['checking the instruments', 'verifying a claim with two lines of code'],
      ['"confirm, don\'t assume"', 'label CPython details vs language guarantees'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A decorator, *args and **kwargs in one trace',
    props: {
      code: py`import functools


def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print("calling", func.__name__, args, kwargs)
        return func(*args, **kwargs)
    return wrapper


@logged
def total(*prices, discount=0):
    return sum(prices) - discount


print(total(3, 4, discount=2))
print(total.__name__)
`,
      notes: {
        4: '`logged` receives the original function and returns a new one, `wrapper`, which closes over `func`.',
        12: '`@logged` means `total = logged(total)`: the name `total` now refers to `wrapper`.',
        7: '`args` is the tuple `(3, 4)`; `kwargs` is the dict `{\'discount\': 2}`.',
        8: '`func(*args, **kwargs)` unpacks them again and calls the original — and the wrapper **returns** its result.',
        18: '`functools.wraps` copied the metadata, so the name is still `total`, not `wrapper`.',
      },
    },
    alt: 'A step-by-step trace of a logging decorator. The decorator logged is applied to total, so the name total refers to the inner wrapper function, which closes over the original function. Calling total(3, 4, discount=2) packs the positional arguments into the tuple (3, 4) and the keyword argument into a dict, prints them, forwards them to the original function and returns 5. Printing total.__name__ shows total because functools.wraps copied the metadata.',
    caption: py`Three rapid-review topics in one picture: decorators are closures that replace a name, \`*args\`/\`**kwargs\` pack and unpack arguments, and \`functools.wraps\` keeps the metadata honest.`,
  },
  syntax: [
    py`#### Crisp answers — data structures`,
    py`| question | crisp answer | more |
|---|---|---|
| list vs tuple? | A list is a mutable sequence for collections that change; a tuple is an immutable sequence for fixed records. Tuples of hashable items are hashable, so they can be dict keys or set members. | [tuples](lesson:tuples-and-unpacking) |
| how does a dict work? | A hash table: \`hash(key)\` picks a slot, then equality confirms the match, so lookups are O(1) on average (O(n) worst case). Keys must be hashable and their hash must not change while stored. | [dictionaries](lesson:dictionaries) |
| are dicts ordered? | Yes: iteration follows insertion order — a language guarantee since 3.7 (a CPython 3.6 implementation detail before that). Sets are **not** ordered. | [dictionaries](lesson:dictionaries) |
| shallow vs deep copy? | A shallow copy (\`copy.copy\`, \`list(x)\`, \`x.copy()\`, \`x[:]\`) makes a new container holding the *same* inner objects; \`copy.deepcopy\` recursively copies the contents too (handling cycles with a memo). | [mutability & copying](lesson:mutability-and-copying) |
| comprehensions? | A concise expression that builds a list/dict/set (or a lazy generator with \`(...)\`) from an iterable, with optional filtering. Its loop variable is local to the comprehension in Python 3. | [comprehensions](lesson:comprehensions) |`,
    py`#### Crisp answers — functions`,
    py`| question | crisp answer | more |
|---|---|---|
| \`*args\` / \`**kwargs\`? | In a definition, \`*args\` collects extra positional arguments into a tuple and \`**kwargs\` collects extra keyword arguments into a dict; in a call, \`*\` and \`**\` unpack. A bare \`*\` makes later parameters keyword-only; \`/\` makes earlier ones positional-only (3.8+). | [arguments](lesson:function-arguments) |
| decorator? | A callable that takes a function and returns a replacement, applied with \`@\` (\`f = deco(f)\`). Production decorators use \`functools.wraps\`, forward \`*args, **kwargs\` and return the result. | [decorators](lesson:decorators) |
| iterator vs generator? | An iterable can produce an iterator (\`__iter__\`); an iterator returns items via \`__next__\` and raises \`StopIteration\` when done. A generator is an iterator created by a function containing \`yield\`; it's lazy and single-pass. | [iterators](lesson:iterators), [generators](lesson:generators) |`,
    py`#### Crisp answers — objects`,
    py`| question | crisp answer | more |
|---|---|---|
| \`__new__\` vs \`__init__\`? | \`__new__(cls, ...)\` creates and returns the instance; \`__init__(self, ...)\` initialises it and returns \`None\`. Override \`__new__\` for immutable subclasses (str, int, tuple), instance caching or singletons. | [special methods](lesson:special-methods) |
| \`@classmethod\` vs \`@staticmethod\`? | A classmethod receives the class as \`cls\` — ideal for alternative constructors that also work for subclasses; a staticmethod receives nothing implicit — a plain function grouped with the class. | [methods](lesson:methods-and-attributes) |
| duck typing? | Code depends on what an object *can do* (its methods), not its class: anything with \`.read()\` can be a "file". Type checkers formalise this with \`typing.Protocol\`. | [duck typing](lesson:polymorphism-and-duck-typing) |
| context manager? | An object with \`__enter__\`/\`__exit__\` used by \`with\` to guarantee set-up and clean-up, even on exceptions (files, locks, transactions). \`contextlib.contextmanager\` builds one from a generator. | [context managers](lesson:context-managers) |`,
    py`#### Crisp answers — errors, tooling, runtime`,
    py`| question | crisp answer | more |
|---|---|---|
| exception best practices? | Catch the narrowest exception you can handle, keep \`try\` blocks small, use \`raise NewError(...) from err\` to keep the cause, define a small custom hierarchy for your domain, clean up with \`with\`/\`finally\`, and log unexpected errors with a traceback. | [error handling](lesson:error-handling-patterns) |
| virtual environment? | An isolated directory with its own interpreter link and \`site-packages\`, so each project has its own dependency versions. Create with \`python -m venv .venv\`; pin dependencies for reproducibility. | [virtual environments](lesson:virtual-environments) |
| testing? | Automated checks that code behaves as specified: many fast unit tests, fewer integration tests, a few end-to-end tests. pytest is the de facto standard; mock only at boundaries (network, time, randomness). | [testing](lesson:testing-fundamentals) |
| type hints? | Annotations for tools (mypy, pyright, IDEs) and readers; Python doesn't enforce them at runtime. Since 3.14 annotations are evaluated lazily (PEP 649/749). | [type hints](lesson:type-hints) |
| the GIL? | In standard CPython, a lock that lets only one thread execute Python bytecode at a time, so threads don't speed up pure-Python CPU-bound work; I/O and many C extensions release it. A free-threaded build is experimental in 3.13 and officially supported (still optional) in 3.14. | [GIL](lesson:gil-and-free-threading) |
| asyncio vs threads vs processes? | asyncio: thousands of concurrent I/O waits in one thread with \`await\`. Threads: blocking I/O libraries. Processes: CPU-bound work on several cores. | [choosing](lesson:choosing-concurrency) |
| memory management? | CPython frees most objects immediately by reference counting, and a cyclic garbage collector finds unreachable reference cycles. You never free memory manually; \`del\` removes a name, not an object. | [memory](lesson:memory-management) |`,
    { callout: 'note', title: 'CPython details to label as such', text: py`Reference counting, the cyclic GC's thresholds, the GIL, the small-int cache, string interning and \`id()\` being an address are **CPython implementation details**. PyPy, for example, uses a tracing garbage collector instead of reference counting. Say "in CPython…" when you mention them.` },
    { callout: 'version', title: 'Version-labelled facts', text: py`Dict insertion order guaranteed: 3.7. Positional-only \`/\`: 3.8. \`match\`, \`X | Y\` unions: 3.10. \`ExceptionGroup\`/\`except*\`, \`TaskGroup\`, \`tomllib\`, \`typing.Self\`: 3.11. PEP 695 generics and the \`type\` statement: 3.12. New REPL, experimental free-threaded build: 3.13. Lazy annotations, t-strings, \`except A, B:\` without brackets, supported free-threaded build: 3.14.` },
  ],
  walkthrough: {
    title: 'Reading the evidence lab',
    lang: 'python',
    code: EVIDENCE_LAB,
    intro: py`Each block in the playground proves one rapid-review claim. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [9, 11], text: py`A tuple of floats is hashable, so it can be a dict key. A list in the same place would raise \`TypeError: unhashable type: 'list'\`.` },
      { lines: [13, 17], text: py`Iteration follows insertion order: \`['tea', 'cake', 'jam']\`. Guaranteed by the language since 3.7.` },
      { lines: [19, 23], text: py`After changing the original's inner list, the shallow copy sees \`99\` (shared inner list) while the deep copy still has \`2\`.` },
      { lines: [26, 31], text: py`\`*args\` packs extra positional arguments into a **tuple**; \`**kwargs\` packs keyword arguments into a **dict**.` },
      { lines: [34, 48], text: py`The decorator works — but \`greet.__name__\` is now \`'wrapper'\`. That breaks logging, debugging and tools that rely on names. The first experiment fixes it with \`functools.wraps\`.` },
      { lines: [50, 53], text: py`\`iter(gen) is gen\`: generators are their own iterators. The second \`list()\` gets nothing — a single pass only.` },
      { lines: [56, 67], text: py`Calling \`Tag("sale")\` runs \`__new__\` (create) and then \`__init__\` (initialise) with the same arguments. Most classes only need \`__init__\`.` },
      { lines: [69, 72], text: py`The comprehension's \`x\` is local to the comprehension, so the outer \`x\` is untouched. (A plain \`for\` loop *would* rebind \`x\`.)` },
      { lines: [75, 80], text: py`Hints document intent for tools; at runtime \`"ab" * 3\` happily returns \`'ababab'\`. A type checker would flag this call.` },
    ],
  },
  playground: {
    title: 'Evidence lab',
    objective: 'Run every claim, then upgrade the evidence: fix the decorator\'s metadata, prove what is (not) hashable, and make the squares reusable.',
    files: { 'main.py': EVIDENCE_LAB },
    expected: py`\`\`\`text
a tuple works as a dict key          -> London
dict order = insertion order         -> ['tea', 'cake', 'jam']
shallow vs deep after a change       -> (99, 2)
describe(1, 2, size='L')             -> ((1, 2), {'size': 'L'})
greet('ada')                         -> HELLO ADA
greet.__name__                       -> wrapper
iter(squares) is squares             -> True
first pass, second pass              -> ([0, 1, 4], [])
  Tag.__new__ creates the object
  Tag.__init__ sets attributes
Tag('sale').label                    -> sale
x after [x * 2 for x in ...]         -> outer
area('ab', 3)                        -> ababab
\`\`\`

Two lines are "bugs" on purpose: \`greet.__name__\` should be \`greet\`, and the second pass over \`squares\` is empty.`,
    experiments: [
      {
        id: 'wraps',
        task: py`Fix the decorator so \`greet.__name__\` is \`"greet"\` and \`greet.__doc__\` is \`"Say hello."\`, while \`greet("ada")\` still returns \`"HELLO ADA"\`.`,
        hint: py`\`import functools\` and put \`@functools.wraps(func)\` on the line above \`def wrapper\`.`,
        tests: [
          { name: 'the name is preserved', code: py`assert greet.__name__ == "greet"` },
          { name: 'the docstring is preserved', code: py`assert greet.__doc__ == "Say hello."` },
          { name: 'the behaviour is unchanged', code: py`assert greet("ada") == "HELLO ADA"` },
        ],
        explain: py`\`functools.wraps\` copies \`__name__\`, \`__qualname__\`, \`__doc__\`, \`__module__\` and more onto the wrapper, and sets \`__wrapped__\` so tools can reach the original. Every production decorator should use it.`,
      },
      {
        id: 'is-hashable',
        task: py`Add a function \`is_hashable(obj)\` that returns \`True\` if \`hash(obj)\` works and \`False\` if it raises \`TypeError\`. Use it to show that \`(1, [2])\` — a tuple containing a list — is **not** hashable.`,
        hint: py`\`try: hash(obj)\` / \`except TypeError: return False\` / \`return True\`.`,
        tests: [
          { name: 'is_hashable exists', code: py`assert callable(ns.get('is_hashable')), 'Define is_hashable(obj)'` },
          { name: 'tuples of hashable items are hashable', code: py`assert is_hashable((1, 2)) is True
assert is_hashable("tea") is True` },
          { name: 'lists, and tuples containing lists, are not', code: py`assert is_hashable([1]) is False
assert is_hashable((1, [2])) is False` },
        ],
        explain: py`A tuple's hash combines its items' hashes, so one unhashable item makes the whole tuple unhashable. "Tuples are hashable" is only true when everything inside them is — a precise detail that impresses interviewers.`,
      },
      {
        id: 'reusable-squares',
        task: py`Change only the line that creates \`squares\` so that both passes print \`[0, 1, 4]\`.`,
        hint: py`Square brackets instead of parentheses: a list can be iterated as many times as you like.`,
        tests: [
          { name: 'both passes see the data', code: py`assert '([0, 1, 4], [0, 1, 4])' in output, 'Both passes should print [0, 1, 4]'` },
        ],
        explain: py`A list comprehension stores its results, so it can be iterated many times; a generator expression produces them lazily, once. Notice the other line changes too: \`iter(squares) is squares\` becomes \`False\`, because a list is an *iterable*, not an *iterator*.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The rapid-review map',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'data', label: 'Data structures', note: 'list/tuple, dict, copies', tone: 'yellow' },
        { id: 'funcs', label: 'Functions', note: '*args, decorators, generators', tone: 'blue' },
        { id: 'objects', label: 'Objects', note: '__new__, methods, duck typing, with', tone: 'paper' },
        { id: 'quality', label: 'Quality', note: 'exceptions, tests, hints, venvs', tone: 'kraft' },
        { id: 'runtime', label: 'Runtime', note: 'GIL, concurrency, memory', tone: 'red' },
        { id: 'versions', label: 'Versions', note: "what's new 3.10–3.14", tone: 'ink' },
      ],
      edges: [
        { from: 'data', to: 'funcs', label: 'mutability → defaults' },
        { from: 'funcs', to: 'objects', label: 'closures → methods' },
        { from: 'objects', to: 'quality', label: 'with → cleanup' },
        { from: 'quality', to: 'runtime', label: 'testing concurrency' },
        { from: 'runtime', to: 'versions', label: 'free-threading' },
      ],
      steps: [
        { focus: ['data'], text: py`**Data structures.** Mutable vs immutable is the root idea: it explains list vs tuple, why dict keys must be hashable, and why copies can share inner objects.` },
        { focus: ['funcs'], edges: ['data->funcs'], text: py`**Functions.** Functions are objects: they can be passed to decorators, closed over, and replaced. Generators are functions that pause at \`yield\`.` },
        { focus: ['objects'], edges: ['funcs->objects'], text: py`**Objects.** Construction (\`__new__\` then \`__init__\`), method kinds (instance/class/static), protocols (duck typing) and \`with\`.` },
        { focus: ['quality'], edges: ['objects->quality'], text: py`**Quality.** Narrow exception handling, tests at the right level, type hints checked by tools, and isolated, pinned environments.` },
        { focus: ['runtime'], edges: ['quality->runtime'], text: py`**Runtime.** The GIL decides between asyncio, threads and processes; reference counting plus a cycle collector manages memory (CPython).` },
        { focus: ['versions'], edges: ['runtime->versions'], text: py`**Versions.** Know a few headline changes per recent version — and say which version you're talking about.` },
      ],
    },
    alt: 'Six boxes in a grid — Data structures, Functions, Objects, Quality, Runtime, Versions — joined in sequence by labelled arrows showing how topics connect: mutability leads to defaults, closures to methods, with-statements to cleanup, testing to concurrency, and free-threading to version changes.',
    caption: py`Six areas, one chain of ideas. If a question surprises you, place it on this map and reason from its neighbours.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A crisp answer has three ingredients: the **precise term** ("immutable", "hashable", "iterator"), **one consequence** ("so it can be a dict key"), and **one condition** ("if its items are hashable"). Practise turning each table row above into a single spoken sentence.`,
      py`When an interviewer pushes ("are you sure?"), don't argue — demonstrate. Two lines in a REPL settle most questions, which is why this lesson's playground is a set of experiments rather than a list of facts.`,
    ],
    technical: [
      py`**Dicts.** CPython's dict (since 3.6) stores entries in a compact, insertion-ordered array plus a separate sparse index table of slots; the hash picks a slot, and collisions are resolved by probing. Lookups compare identity first, then \`==\`. The compact layout is an implementation detail; the ordering is guaranteed since 3.7.`,
      py`**Construction.** \`Cls(args)\` calls \`type(Cls).__call__\`, which calls \`Cls.__new__(Cls, args)\` and, if that returns an instance of \`Cls\`, \`instance.__init__(args)\`. Immutable built-ins have their value fixed in \`__new__\`, which is why subclassing \`str\` to normalise input must override \`__new__\`.`,
      py`**Generators.** A generator object keeps its frame (local variables and position) alive between \`next()\` calls; \`return\` inside a generator raises \`StopIteration\` with the value, and \`yield from\` delegates to a sub-iterator.`,
      py`**Memory (CPython).** Each object has a reference count; when it drops to zero the object is freed immediately. Reference cycles (an object referring to itself through others) never reach zero, so the \`gc\` module periodically finds unreachable cycles. Small objects come from the pymalloc allocator, which keeps memory in arenas and can return an arena to the operating system only when it is entirely empty.`,
      py`**The GIL (CPython).** It protects the interpreter's internal state (such as reference counts). It does **not** make your code thread-safe: \`counter += 1\` is several bytecode steps and a thread switch can happen between them. The free-threaded build (PEP 703; supported but optional in 3.14 per PEP 779) removes the GIL and uses other mechanisms, at some single-thread cost.`,
    ],
    production: [
      py`**Precision wins senior interviews.** "Dicts are ordered" vs "dict iteration order is insertion order, guaranteed since 3.7, but equality ignores order and sets have no order" — the second answer anticipates three follow-ups.`,
      py`**Connect answers to experience.** After each crisp answer, add one sentence about where you used it: "we used a classmethod \`from_row\` to build models from CSV rows", "we hit the GIL in a pure-Python scoring job and moved it to a process pool". That's what turns a review answer into evidence of seniority.`,
      py`**Keep a personal cheat sheet.** Copy the tables above into your own notes and add your own examples and project stories. Review a section a day in the week before interviews; use the [debugging drills](lesson:debugging-scenarios) and [coding patterns](lesson:coding-patterns) for active practice.`,
    ],
  },
  mistakes: [
    {
      title: '"Tuples are always hashable"',
      wrong: { code: py`point = ("warehouse", [3, 4])
locations = {point: "A1"}     # TypeError: unhashable type: 'list'`, lang: 'python', static: true },
      right: { code: py`point = ("warehouse", (3, 4))  # every item hashable
locations = {point: "A1"}
print(locations[point])`, lang: 'python' },
      explanation: py`A tuple is hashable only if all its items are. Say "a tuple of hashable items is hashable".`,
    },
    {
      title: 'A decorator that loses the return value and metadata',
      wrong: { code: py`def log_calls(func):
    def wrapper(*args):
        print("calling", func.__name__)
        func(*args)              # result dropped; **kwargs rejected
    return wrapper`, lang: 'python' },
      right: { code: py`import functools

def log_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper`, lang: 'python' },
      explanation: py`Forward \`*args, **kwargs\`, return the result, and use \`functools.wraps\`. Those three lines are the checklist for every decorator.`,
    },
    {
      title: '"The GIL makes my code thread-safe"',
      wrong: { code: py`# two threads run this at the same time
counter += 1      # read, add, write: a switch can happen in between`, lang: 'python', static: true },
      right: { code: py`import threading

lock = threading.Lock()
counter = 0

def increment():
    global counter
    with lock:            # make the read-modify-write atomic
        counter += 1`, lang: 'python' },
      explanation: py`The GIL protects CPython's internals, not your invariants. Shared mutable state still needs a lock, a queue, or no sharing at all.`,
    },
    {
      title: 'Overriding __init__ to change an immutable value',
      wrong: { code: py`class Sku(str):
    def __init__(self, raw):
        self = raw.strip().upper()   # does nothing useful

print(repr(Sku(" ab-1 ")))          # ' ab-1 ' - unchanged`, lang: 'python' },
      right: { code: py`class Sku(str):
    def __new__(cls, raw):
        return super().__new__(cls, raw.strip().upper())

print(Sku(" ab-1 "))                # AB-1`, lang: 'python' },
      explanation: py`By the time \`__init__\` runs, the string's value already exists and can't change. Immutable types must be customised in \`__new__\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: unhashable type: 'list'`,
      cause: py`A list (or a dict, set, or a tuple containing one) was used as a dict key or set member.`,
      fix: py`Convert it to a tuple (\`tuple(items)\`) or a frozenset, or rethink the key.`,
    },
    {
      symptom: py`A decorated function returns None, or tracebacks/logs show "wrapper" instead of the function name.`,
      cause: py`The wrapper doesn't \`return\` the wrapped function's result, or \`functools.wraps\` is missing.`,
      fix: py`\`return func(*args, **kwargs)\` and decorate the wrapper with \`@functools.wraps(func)\`.`,
    },
    {
      symptom: py`TypeError: f() missing 1 required positional argument: 'a' — even though you passed a=1.`,
      cause: py`\`a\` is positional-only (declared before \`/\`); the keyword went into \`**kwargs\` or was rejected.`,
      fix: py`Pass it positionally, or remove the \`/\` if callers legitimately need the keyword.`,
    },
    {
      symptom: py`error: externally-managed-environment when running pip install`,
      cause: py`Your OS Python is marked as externally managed (PEP 668); installing into it could break system tools.`,
      fix: py`Create a project environment: \`python -m venv .venv\`, activate it, and install there.`,
    },
    {
      symptom: py`A multi-threaded CPU-bound job is no faster than the single-threaded version.`,
      cause: py`On the standard (GIL) build, only one thread runs Python bytecode at a time.`,
      fix: py`Use \`ProcessPoolExecutor\`/\`multiprocessing\`, vectorised C libraries, or evaluate the free-threaded build (3.13+, supported in 3.14).`,
    },
  ],
  bestPractices: [
    'Answer in one precise sentence, then add one consequence and one condition.',
    'Label CPython details ("in CPython…") and version-specific facts ("since 3.7").',
    'Back claims with a two-line demonstration when challenged.',
    'Use functools.wraps, forward *args/**kwargs and return the result in every decorator.',
    'Create mutable state in __init__; customise immutable types in __new__.',
    'Prefer classmethods for alternative constructors so subclasses work.',
    'Catch narrow exceptions, chain with raise ... from, and log unexpected errors with tracebacks.',
    'Isolate every project in a virtual environment and pin dependencies.',
    'Pick asyncio for many I/O waits, threads for blocking I/O libraries, processes for CPU-bound work.',
  ],
  useCases: [
    'Last-minute review before a technical screen.',
    'Building your personal one-page cheat sheet.',
    'Calibrating answer length: practise saying each crisp answer in under 20 seconds.',
    'Finding weak spots: any row you can\'t explain links to the lesson to revisit.',
  ],
  whenToUse: {
    use: [
      'Quick-fire rounds and phone screens with many short questions.',
      'As the first sentence of a longer answer, before expanding with the five-part framework.',
      'To check your understanding is precise (versions, guarantees vs details).',
    ],
    avoid: [
      'Memorising sentences without being able to demonstrate them in code.',
      'Stopping at the crisp answer when the interviewer clearly wants depth — expand.',
      'Reciting CPython details as if they were language rules.',
    ],
  },
  comparison: {
    title: 'asyncio vs threads vs processes',
    headers: ['', 'asyncio', 'threads', 'processes'],
    rows: [
      ['best for', 'many concurrent I/O waits (sockets, HTTP)', 'blocking I/O libraries, simple background work', 'CPU-bound pure-Python work'],
      ['parallel Python bytecode?', 'no (one thread)', 'no on the GIL build; yes on the free-threaded build', 'yes (one interpreter per process)'],
      ['switching', 'cooperative, only at await', 'preemptive, any time', 'separate OS processes'],
      ['shared state', 'easy, few races (switches only at await)', 'shared memory: needs locks', 'no shared memory by default: pickled messages'],
      ['cost per unit', 'very small (a task object)', 'an OS thread', 'a whole interpreter'],
      ['stdlib entry point', 'asyncio.run, TaskGroup (3.11+)', 'concurrent.futures.ThreadPoolExecutor', 'concurrent.futures.ProcessPoolExecutor'],
    ],
    note: py`Mixing is common: \`asyncio.to_thread\` runs a blocking call from async code, and \`loop.run_in_executor\` can hand CPU work to a process pool.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'rapid-review-q1',
      type: 'mcq',
      prompt: '`def word_count(source): return len(source.read().split())`. Which statement best describes how this function uses **duck typing**?',
      options: [
        { text: 'It only works with objects created by open()', why: 'Nothing checks the type. Any object with a read() method that returns a string works.' },
        'It works with any object whose read() returns a string — a file, io.StringIO, or your own class',
        { text: 'It needs source to inherit from io.IOBase', why: 'Duck typing ignores inheritance; only the behaviour (a read method) matters.' },
        { text: 'Python checks the argument type when the function is called', why: 'Python never checks parameter types at runtime; a missing read() fails with AttributeError when it is called.' },
      ],
      answer: 1,
      explanation: py`"If it walks like a duck…": the function relies on behaviour, not class. That makes it easy to test with \`io.StringIO("a b c")\`. A \`typing.Protocol\` with a \`read(self) -> str\` method lets a type checker verify callers without requiring inheritance.`,
    },
    {
      id: 'rapid-review-q2',
      type: 'output',
      prompt: 'What does this print in Python 3?',
      code: py`x = "outer"
doubled = [x * 2 for x in range(3)]
print(x, doubled)`,
      answer: 'outer [0, 2, 4]',
      explanation: py`A comprehension's loop variable is local to the comprehension, so the outer \`x\` is untouched. (In Python 2 list comprehensions leaked it. A plain \`for\` loop still rebinds the name.)`,
    },
    {
      id: 'rapid-review-q3',
      type: 'bug',
      prompt: 'This prints `calling add` and then `None`. Click the buggy line.',
      code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        func(*args, **kwargs)
    return wrapper


@log_calls
def add(a, b):
    return a + b


print(add(2, 3))`,
      answerLine: 4,
      explanation: py`The wrapper calls \`func\` but throws its result away, so the wrapper returns \`None\`. It must be \`return func(*args, **kwargs)\`. Add \`@functools.wraps(func)\` too.`,
    },
    {
      id: 'rapid-review-q4',
      type: 'fill',
      prompt: 'Complete the decorator so it keeps the wrapped function\'s metadata, and the alternative constructor so subclasses get instances of themselves.',
      code: py`def traced(func):
    @functools.___(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f):
        return ___((f - 32) * 5 / 9)`,
      answer: [['wraps'], ['cls']],
      explanation: py`\`functools.wraps(func)\` copies the name, docstring and more onto the wrapper. Calling \`cls(...)\` (rather than hard-coding \`Temperature(...)\`) makes \`SubClass.from_fahrenheit(...)\` return a \`SubClass\`.`,
    },
    {
      id: 'rapid-review-q5',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def area(width: int, height: int) -> int:
    return width * height


print(area("ab", 3))`,
      options: [
        { text: 'TypeError: width must be int', why: 'Python does not check annotations at runtime. Only external tools (mypy, pyright) would complain.' },
        'ababab',
        { text: '6', why: '"ab" is a string; multiplying a string by 3 repeats it.' },
        { text: 'None', why: 'The function returns width * height, which is "ab" * 3.' },
      ],
      answer: 1,
      explanation: py`Type hints are stored as metadata and checked by tools, not by the interpreter. \`"ab" * 3\` is valid string repetition. Runtime validation needs explicit checks or a library (e.g. pydantic, third-party).`,
    },
    {
      id: 'rapid-review-q6',
      type: 'mcq',
      prompt: 'Which of these is a **language guarantee** (true in every Python 3.7+ implementation), rather than a CPython detail or a myth?',
      options: [
        'Iterating over a dict yields keys in insertion order',
        { text: 'Integers from -5 to 256 are cached, so `a is b` is True for them', why: 'That is a CPython implementation detail. Never rely on it.' },
        { text: 'Dict lookups are O(1) even in the worst case', why: 'They are O(1) on average; heavy hash collisions can make them O(n).' },
        { text: 'Sets iterate in sorted order', why: 'Sets have no defined order; small ints may look sorted in CPython by coincidence of hashing.' },
      ],
      answer: 0,
      explanation: py`Insertion order became part of the language specification in 3.7 (it was already true, as an implementation detail, in CPython 3.6). The small-int cache is CPython-specific, hashing complexity is average-case, and sets are unordered.`,
    },
    {
      id: 'rapid-review-q7',
      type: 'short',
      prompt: 'In one or two sentences each: what is an iterable, an iterator, and a generator?',
      answer: py`An iterable is any object you can loop over: it can produce an iterator via __iter__ (lists, dicts, strings, files). An iterator is the object that does the looping: __next__ returns the next item and raises StopIteration when finished, and its __iter__ returns itself, so it is single-pass. A generator is an iterator created by calling a function that contains yield (or by a generator expression); it produces values lazily and keeps its local state between next() calls.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'merge-settings',
      title: 'Deep-merge settings without sharing',
      difficulty: 'intermediate',
      prompt: py`Write \`merge_settings(defaults, overrides)\` that returns a **new** dict:

- keys from \`overrides\` win over \`defaults\`;
- when **both** values for a key are dicts, merge them recursively (so overriding \`{"editor": {"wrap": True}}\` keeps \`editor.tabs\` from the defaults);
- otherwise the override value replaces the default (even a dict replaced by a non-dict);
- neither input is modified, and the result shares **no** mutable objects with the inputs (changing a list in the result must not change the defaults).`,
      files: {
        'main.py': py`import copy


def merge_settings(defaults, overrides):
    # TODO: deep merge - this shallow version replaces whole nested dicts
    result = dict(defaults)
    result.update(overrides)
    return result


DEFAULTS = {"theme": "light", "editor": {"tabs": 4, "wrap": False}, "plugins": ["spellcheck"]}
print(merge_settings(DEFAULTS, {"editor": {"wrap": True}}))
`,
      },
      hints: [
        'Start from a deep copy of defaults so nothing in the result is shared.',
        'Loop over overrides.items(). If value is a dict and result.get(key) is a dict, recurse; otherwise assign a deep copy of value.',
        'result[key] = merge_settings(result[key], value) for the nested case.',
      ],
      solution: {
        explanation: py`\`copy.deepcopy(defaults)\` gives a result with no shared mutable objects. For each override, if both sides are dicts the function calls itself to merge one level down; otherwise the override (deep-copied) replaces the value. \`dict.update\` or \`{**a, **b}\` / \`a | b\` (3.9+) are all **shallow**: they replace a nested dict wholesale and share inner lists — the bug in the starter.`,
        files: {
          'main.py': py`import copy


def merge_settings(defaults, overrides):
    result = copy.deepcopy(defaults)
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge_settings(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


DEFAULTS = {"theme": "light", "editor": {"tabs": 4, "wrap": False}, "plugins": ["spellcheck"]}
print(merge_settings(DEFAULTS, {"editor": {"wrap": True}}))
`,
        },
      },
      tests: [
        { name: 'nested dicts are merged, not replaced', code: py`merged = merge_settings({"theme": "light", "editor": {"tabs": 4, "wrap": False}}, {"editor": {"wrap": True}})
assert merged == {"theme": "light", "editor": {"tabs": 4, "wrap": True}}` },
        { name: 'new keys are added and non-dicts replace dicts', code: py`assert merge_settings({"a": {"b": 1}}, {"a": 5, "c": 2}) == {"a": 5, "c": 2}` },
        { name: 'inputs are not modified', code: py`d = {"editor": {"tabs": 4}}
o = {"editor": {"tabs": 2}}
merge_settings(d, o)
assert d == {"editor": {"tabs": 4}} and o == {"editor": {"tabs": 2}}` },
        { name: 'the result shares no lists with the defaults', code: py`d = {"plugins": ["spellcheck"]}
merged = merge_settings(d, {})
merged["plugins"].append("vim")
assert d["plugins"] == ["spellcheck"]` },
      ],
    },
    {
      id: 'temporary-setting',
      title: 'A context manager that always restores',
      difficulty: 'intermediate',
      prompt: py`Write \`temporary_setting(settings, key, value)\` with \`@contextmanager\`:

- on entry, set \`settings[key] = value\` and **yield the settings dict**;
- on exit — **including when the block raises** — restore the previous value, or **delete the key** if it didn't exist before;
- never swallow the exception: it must propagate to the caller.

Tip: a key could legitimately hold \`None\`, so use a private sentinel object to remember "missing".`,
      files: {
        'main.py': py`from contextlib import contextmanager


@contextmanager
def temporary_setting(settings, key, value):
    # TODO: restore even on errors, and remove keys that didn't exist
    old = settings.get(key)
    settings[key] = value
    yield settings
    settings[key] = old


config = {"debug": False}
with temporary_setting(config, "debug", True):
    print("inside:", config)
print("after:", config)
`,
      },
      hints: [
        'Code after a bare yield is skipped when the with-block raises. Which statement always runs?',
        'Wrap the yield in try/finally and restore in the finally block.',
        'Create _MISSING = object() at module level; old = settings.get(key, _MISSING); in finally: if old is _MISSING: del settings[key] else: settings[key] = old.',
      ],
      solution: {
        explanation: py`When the \`with\` block raises, \`contextmanager\` throws the exception into the generator at the \`yield\`. Without \`try/finally\`, the restore line never runs. \`finally\` runs on both paths and, because it doesn't catch anything, the exception still propagates. The sentinel \`_MISSING = object()\` is a unique object, compared with \`is\`, so a stored \`None\` isn't confused with "no key".`,
        files: {
          'main.py': py`from contextlib import contextmanager

_MISSING = object()


@contextmanager
def temporary_setting(settings, key, value):
    old = settings.get(key, _MISSING)
    settings[key] = value
    try:
        yield settings
    finally:
        if old is _MISSING:
            del settings[key]
        else:
            settings[key] = old


config = {"debug": False}
with temporary_setting(config, "debug", True):
    print("inside:", config)
print("after:", config)
`,
        },
      },
      tests: [
        { name: 'sets inside, restores after', code: py`s = {"debug": False}
with temporary_setting(s, "debug", True):
    assert s["debug"] is True
assert s == {"debug": False}` },
        { name: 'restores after an exception, which still propagates', code: py`s = {"debug": False}
with raises(RuntimeError):
    with temporary_setting(s, "debug", True):
        raise RuntimeError("boom")
assert s == {"debug": False}` },
        { name: 'a key that did not exist is removed afterwards', code: py`s = {}
with temporary_setting(s, "mode", "test"):
    assert s == {"mode": "test"}
assert s == {}` },
        { name: 'a stored None is restored, not deleted', code: py`s = {"proxy": None}
with temporary_setting(s, "proxy", "http://cache"):
    pass
assert s == {"proxy": None}` },
        { name: 'yields the settings dict', code: py`s = {}
with temporary_setting(s, "x", 1) as t:
    assert t is s` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'rapid-review-list-or-tuple',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 3,
      question: 'Lightning round — list or tuple, and why? (1) the items in a shopping cart, (2) a GPS coordinate used as a dict key, (3) the `(min, max)` returned by a function, (4) the RGB colour of a brand constant.',
      answer: '(1) list — it grows and shrinks; (2) tuple — immutable and hashable, so it can be a key; (3) tuple — a fixed-size record, unpacked by the caller; (4) tuple — a constant that must not be mutated. Rule: list for a changing collection of similar things, tuple for a fixed record.',
      explanation: py`The deciding question is "will this change, and does position carry meaning?" Tuples signal intent (a fixed record), are hashable when their items are, and protect against accidental mutation. For records with many fields, a \`NamedTuple\` or frozen \`dataclass\` adds names. Speed and memory differences exist but are small — choose by meaning.`,
      code: { lang: 'python', code: py`cart = ["tea", "cake"]
cart.append("jam")                        # collections change

depots = {(51.5, -0.12): "London"}        # tuple as a key

def price_range(prices):
    return min(prices), max(prices)       # a fixed (min, max) record

low, high = price_range([3, 9, 4])
BRAND_RED = (200, 16, 46)                 # constant` },
      whyAsked: 'The most-asked Python question; a scenario format checks you can apply the difference, not just define it.',
      mistakes: ['Answering only "tuples are immutable" without saying when that matters', 'Claiming tuples are always hashable', 'Choosing tuples "because they are faster"'],
      followUps: ['Is ("a", [1]) hashable?', 'When would you use a NamedTuple or dataclass instead?', 'Can you change a list inside a tuple?'],
      modelAnswer: 'The cart is a list because it changes as people add and remove items. The GPS coordinate is a tuple: it\'s a fixed pair, and being immutable and hashable lets it be a dict key. The min-max result is a tuple too — a small fixed record the caller unpacks. And the brand colour is a tuple because it\'s a constant nobody should mutate. My rule is a list for a changing collection of similar items and a tuple for a fixed record whose positions mean something; if the record gets bigger, I\'d switch to a NamedTuple or a frozen dataclass for names.',
    },
    {
      id: 'rapid-review-signature-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What do the two calls produce?',
      code: { lang: 'python', code: py`def order(a, /, b, *args, c, d=4, **kwargs):
    return a, b, args, c, d, kwargs


print(order(1, 2, 3, c=5, e=6))
print(order(a=1, b=2, c=3))` },
      options: [
        "(1, 2, (3,), 5, 4, {'e': 6}) then (1, 2, (), 3, 4, {})",
        "(1, 2, (3,), 5, 4, {'e': 6}) then TypeError: order() missing 1 required positional argument: 'a'",
        "(1, 2, 3, 5, 4, {'e': 6}) then TypeError",
        "TypeError for both calls",
      ],
      correctOption: 1,
      answer: "First: (1, 2, (3,), 5, 4, {'e': 6}). Second: TypeError: order() missing 1 required positional argument: 'a' — a is positional-only, so a=1 doesn't fill it (it lands in **kwargs instead), and a is missing.",
      explanation: py`Parameters before \`/\` are positional-only (3.8+); after \`*args\` (or a bare \`*\`), parameters are keyword-only. Extra positionals go into the \`args\` tuple, unknown keywords into the \`kwargs\` dict. Because \`**kwargs\` exists, a keyword named \`a\` is collected there instead of raising "unexpected keyword" — that's how \`dict(**kw)\`-style APIs can accept a key with the same name as a positional-only parameter.`,
      whyAsked: 'Checks precise knowledge of the full parameter syntax, a common source of API-design questions.',
      mistakes: ['Thinking args is a list', 'Forgetting that c is keyword-only', 'Expecting a=1 to bind to a positional-only parameter'],
      followUps: ['Why would a library make a parameter positional-only?', 'What does a bare * do?', 'How do you forward all arguments to another function?'],
      modelAnswer: 'The first call gives a as 1, b as 2, args as the tuple containing 3, c as 5, d keeps its default 4, and kwargs holds e equals 6. The second call fails: a is positional-only because it\'s before the slash, so the keyword a=1 can\'t fill it — it\'s collected into kwargs — and Python reports that the required positional argument a is missing. Parameters after *args are keyword-only, which is why c had to be passed by name. Libraries use positional-only parameters so they can rename them later without breaking callers.',
    },
    {
      id: 'rapid-review-decorator-review',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Code review: list everything wrong with this timing decorator and give the fixed version.',
      code: { lang: 'python', code: py`import time


def timed(func):
    def wrapper(*args):
        start = time.perf_counter()
        func(*args)
        print(f"{func.__name__} took {time.perf_counter() - start:.3f}s")
    return wrapper` },
      answer: '(1) It drops the return value; (2) it rejects keyword arguments (no **kwargs); (3) it loses metadata (no functools.wraps), so the function\'s name and docstring become "wrapper"; (4) if func raises, nothing is printed — use try/finally. Fixed: @functools.wraps(func); def wrapper(*args, **kwargs): start = ...; try: return func(*args, **kwargs) finally: print(...).',
      explanation: py`These four points are the review checklist for any decorator. In production you'd also prefer logging to \`print\`, and make the decorator configurable (a decorator factory) if it needs a threshold or logger.`,
      whyAsked: 'Decorators are a top interview topic; reviewing a flawed one tests practical understanding rather than recall.',
      mistakes: ['Spotting only the missing return', 'Using time.time() for durations (perf_counter is monotonic and higher resolution)', 'Putting the print after return, where it never runs'],
      followUps: ['How would you add a threshold argument?', 'How do you decorate async functions?', 'What does __wrapped__ give you?'],
      modelAnswer: 'I see four problems. The wrapper calls func but doesn\'t return its result, so every decorated function returns None. It only accepts *args, so keyword arguments raise TypeError. Without functools.wraps, the decorated function\'s name and docstring become the wrapper\'s, which hurts logs and debugging. And if func raises, the timing line is skipped. The fix is wraps, *args and **kwargs, and a try/finally that returns func\'s result and logs the duration in the finally block.',
    },
    {
      id: 'rapid-review-countdown-two-ways',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement a countdown from `start` down to 1 **two ways**: an iterator class `Countdown(start)` (with `__iter__` and `__next__`) and a generator function `countdown(start)`. Both yield `start, start-1, ..., 1`; an instance of `Countdown` is single-pass, like any iterator.',
      answer: 'Countdown: store current; __iter__ returns self; __next__ raises StopIteration at 0, else returns current and decrements. Generator: while start > 0: yield start; start -= 1. The generator writes the iterator protocol for you.',
      explanation: py`The comparison is the point: the class needs explicit state and the \`StopIteration\` signal; the generator keeps state in its paused frame and stops when the function returns. Both are single-pass iterators (\`iter(x) is x\`). To make a *reusable* iterable, give a class an \`__iter__\` that returns a **new** iterator (or is itself a generator method).`,
      starter: { files: { 'main.py': py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return iter([])        # TODO: an iterator returns itself

    def __next__(self):
        raise StopIteration    # TODO


def countdown(start):
    # TODO: use yield
    return []


print(list(Countdown(3)), list(countdown(3)))
` } },
      tests: [
        { name: 'the class counts down', code: py`assert list(Countdown(3)) == [3, 2, 1]` },
        { name: 'the class is a single-pass iterator', code: py`c = Countdown(2)
assert iter(c) is c
assert list(c) == [2, 1]
assert list(c) == []` },
        { name: 'the generator counts down', code: py`assert list(countdown(3)) == [3, 2, 1]
assert list(countdown(0)) == []` },
        { name: 'countdown is a generator function', code: py`import inspect
assert inspect.isgeneratorfunction(countdown), 'Use yield in countdown()'` },
      ],
      solution: { files: { 'main.py': py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value


def countdown(start):
    while start > 0:
        yield start
        start -= 1


print(list(Countdown(3)), list(countdown(3)))
` } },
      hints: ['An iterator\'s __iter__ returns self.', '__next__ must raise StopIteration when there is nothing left.', 'The generator version is a while loop with yield.'],
      whyAsked: 'Shows you understand the iterator protocol and what generators automate — a classic "explain the difference by building both".',
      mistakes: ['Returning a new iterator from an iterator\'s __iter__ (that makes it an iterable, not an iterator)', 'Returning None instead of raising StopIteration', 'Raising StopIteration inside a generator (it becomes RuntimeError since 3.7) — just return'],
      followUps: ['How would you make Countdown reusable across loops?', 'What happens if a generator raises StopIteration explicitly?', 'How would you add a step parameter?'],
      modelAnswer: 'For the class, I store the current value; __iter__ returns self because an iterator is its own iterator; and __next__ raises StopIteration when we reach zero, otherwise returns the current value and decrements it. The generator is just a while loop that yields start and decrements — Python builds the same protocol for me, keeping the state in the paused frame and raising StopIteration when the function ends. Both are single-pass: looping twice gives nothing the second time. If I wanted something reusable I\'d make an iterable whose __iter__ returns a fresh generator.',
    },
    {
      id: 'rapid-review-gil-statements',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'A teammate says: "Python can\'t use multiple cores because of the GIL, so threads are useless." Which correction is most accurate?',
      options: [
        'True: Python can never run on more than one core',
        'In standard CPython the GIL stops threads from running Python bytecode in parallel, but threads still help with I/O (the GIL is released while waiting), C extensions can release it for heavy computation, processes use many cores, and the free-threaded build (3.13+, supported in 3.14) removes the GIL',
        'False: the GIL was removed in Python 3.12',
        'The GIL makes Python code thread-safe, so threads are fine for everything',
      ],
      correctOption: 1,
      answer: 'Half right. On the default CPython build only one thread executes Python bytecode at a time, so threads don\'t speed up pure-Python CPU-bound loops. But threads are useful for I/O-bound work (the GIL is released during blocking I/O), many C extensions release the GIL during heavy work, multiprocessing uses all cores, and the free-threaded build (experimental 3.13, officially supported but optional in 3.14) has no GIL.',
      explanation: py`Precision points: the GIL is a CPython implementation detail (Jython and IronPython never had one); it protects the interpreter, not your data races; and \`sys._is_gil_enabled()\` (3.13+) reports whether it's active. Free-threading is a separate build (often named \`python3.14t\`) and some C extensions still need updates to support it.`,
      whyAsked: 'GIL myths are everywhere; correcting one precisely shows depth and up-to-date knowledge.',
      mistakes: ['Saying the GIL makes code thread-safe', 'Saying the GIL was removed for everyone', 'Ignoring I/O-bound workloads where threads help'],
      followUps: ['Why does counter += 1 still race under the GIL?', 'What does a free-threaded build cost?', 'How would you parallelise a CPU-bound pure-Python job today?'],
      modelAnswer: 'It\'s half right. In standard CPython, the global interpreter lock means only one thread runs Python bytecode at a time, so threads won\'t speed up a pure-Python CPU-bound loop. But threads are still great for I/O, because the GIL is released while a thread waits on the network or disk, and libraries like NumPy release it during heavy computation. For CPU-bound Python I\'d use processes, which use every core. And since 3.13 there\'s a free-threaded build without the GIL, officially supported in 3.14 but still optional, so I\'d check extension support before relying on it.',
    },
    {
      id: 'rapid-review-sku-new',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 6,
      question: 'Create `Sku`, a `str` subclass whose value is the input stripped and upper-cased: `Sku(" ab-1 ") == "AB-1"`. An input that is empty after stripping must raise `ValueError`. Explain why `__init__` can\'t do this.',
      answer: 'Override __new__: cleaned = raw.strip().upper(); raise ValueError if empty; return super().__new__(cls, cleaned). str is immutable, so its value is fixed by the time __init__ runs.',
      explanation: py`\`__new__\` is a static method (special-cased, no decorator needed) that receives the class and must return the new object. For immutable built-ins (\`str\`, \`int\`, \`tuple\`, \`frozenset\`) the value is set there, so normalisation must happen before calling \`super().__new__\`. Other uses of \`__new__\`: instance caching/interning and singletons. Most classes never need it.`,
      starter: { files: { 'main.py': py`class Sku(str):
    def __init__(self, raw):
        # TODO: too late - the str value already exists
        self.cleaned = raw.strip().upper()


print(repr(Sku(" ab-1 ")))
` } },
      tests: [
        { name: 'normalises the value', code: py`assert Sku(" ab-1 ") == "AB-1"` },
        { name: 'is still a str and an Sku', code: py`s = Sku("x9")
assert isinstance(s, str) and type(s) is Sku` },
        { name: 'works as a dict key like the plain string', code: py`stock = {Sku(" ab-1 "): 3}
assert stock["AB-1"] == 3` },
        { name: 'empty input raises ValueError', code: py`with raises(ValueError):
    Sku("   ")` },
      ],
      solution: { files: { 'main.py': py`class Sku(str):
    def __new__(cls, raw):
        cleaned = raw.strip().upper()
        if not cleaned:
            raise ValueError("SKU cannot be empty")
        return super().__new__(cls, cleaned)


print(repr(Sku(" ab-1 ")))
` } },
      hints: ['Which method runs first when you call Sku(...)?', 'str\'s value is decided when the object is created.', 'def __new__(cls, raw): return super().__new__(cls, raw.strip().upper())'],
      whyAsked: 'The cleanest real example of why __new__ exists — far more convincing than reciting "__new__ creates, __init__ initialises".',
      mistakes: ['Assigning to self in __init__', 'Forgetting to return the object from __new__', 'Using __new__ when __init__ would do'],
      followUps: ['When is __init__ not called after __new__?', 'How would you cache instances so equal SKUs are the same object?', 'Why does hash(Sku("ab")) equal hash("AB")?'],
      modelAnswer: 'Calling Sku runs __new__ to create the object and then __init__ to initialise it. Because str is immutable, its value is fixed inside __new__ — by the time __init__ runs, there\'s nothing left to change. So I override __new__: strip and upper-case the raw input, raise ValueError if the result is empty, and return super().__new__(cls, cleaned). The result is a real str, so it compares and hashes like "AB-1" and works as a dict key. For ordinary mutable classes I\'d just use __init__.',
    },
    {
      id: 'rapid-review-temperature-classmethod',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Fix `Temperature`: `from_fahrenheit(f)` must be an alternative constructor that returns an instance of **whatever class it\'s called on** (subclasses included), and `is_valid(celsius)` a helper callable without an instance. `Temperature(c)` must raise `ValueError` below -273.15.',
      answer: '@classmethod def from_fahrenheit(cls, f): return cls((f - 32) * 5 / 9) — cls makes it subclass-friendly. @staticmethod def is_valid(celsius): return celsius >= -273.15 — needs neither instance nor class. __init__ calls self.is_valid and raises ValueError.',
      explanation: py`Hard-coding \`Temperature(...)\` inside the constructor breaks subclasses: \`LabTemp.from_fahrenheit(...)\` would return a plain \`Temperature\`. A classmethod receives the class actually used. A staticmethod is a plain function stored in the class namespace — appropriate when the logic belongs with the class but uses no class or instance state. Calling it via \`self.is_valid\` still lets a subclass override it.`,
      starter: { files: { 'main.py': py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @staticmethod
    def from_fahrenheit(fahrenheit):
        # TODO: should build an instance of the class it is called on
        return Temperature((fahrenheit - 32) * 5 / 9)

    def is_valid(self, celsius):
        # TODO: should be callable without an instance
        return celsius >= -273.15


print(Temperature.from_fahrenheit(212).celsius)
` } },
      tests: [
        { name: 'converts Fahrenheit', code: py`assert Temperature.from_fahrenheit(212).celsius == approx(100)` },
        { name: 'subclasses get their own type', code: py`class LabTemp(Temperature):
    pass

assert type(LabTemp.from_fahrenheit(32)) is LabTemp` },
        { name: 'is_valid works on the class', code: py`assert Temperature.is_valid(20) is True
assert Temperature.is_valid(-300) is False` },
        { name: 'impossible temperatures are rejected', code: py`with raises(ValueError):
    Temperature(-300)` },
      ],
      solution: { files: { 'main.py': py`class Temperature:
    def __init__(self, celsius):
        if not self.is_valid(celsius):
            raise ValueError(f"{celsius} is below absolute zero")
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, fahrenheit):
        return cls((fahrenheit - 32) * 5 / 9)

    @staticmethod
    def is_valid(celsius):
        return celsius >= -273.15


print(Temperature.from_fahrenheit(212).celsius)
` } },
      hints: ['Which decorator passes the class in as the first argument?', 'Build the instance with cls(...), not Temperature(...).', 'is_valid uses no self or cls — make it a @staticmethod and call it from __init__.'],
      whyAsked: 'Turns the classic classmethod-vs-staticmethod question into code, including the subclass behaviour that justifies classmethods.',
      mistakes: ['Hard-coding the class name in an alternative constructor', 'Making everything a staticmethod "because it doesn\'t use self"', 'Validating only in the alternative constructor, not in __init__'],
      followUps: ['Name a classmethod constructor in the standard library (dict.fromkeys, datetime.fromisoformat).', 'When would you choose a module-level function over a staticmethod?', 'How do classmethods interact with inheritance and super()?'],
      modelAnswer: 'from_fahrenheit should be a classmethod: it receives cls, the class it was called on, and returns cls of the converted value, so a subclass like LabTemp gets a LabTemp back — the standard library does the same with dict.fromkeys and datetime.fromisoformat. is_valid needs neither the instance nor the class, so it\'s a staticmethod — a function that lives with the class because it belongs to its domain. I\'d call it from __init__ so every construction path is validated and raise ValueError below absolute zero. Calling it through self also lets subclasses override the rule.',
    },
    {
      id: 'rapid-review-exception-review',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Review this error handling and rewrite it following best practices.',
      code: { lang: 'python', code: py`import json


class ConfigError(Exception):
    """Raised when the configuration file is missing or invalid."""


def load_config(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise Exception("bad config: " + str(e))


def load_config_better(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError as err:
        raise ConfigError(f"config file not found: {path}") from err
    except json.JSONDecodeError as err:
        raise ConfigError(f"{path} is not valid JSON (line {err.lineno})") from err` },
      answer: 'Problems: catches every Exception (including bugs), re-raises a generic Exception callers can\'t catch specifically, and loses the original cause/traceback chain. Fix: catch the specific expected errors (FileNotFoundError, json.JSONDecodeError), raise a domain exception (ConfigError) with a useful message, and chain with `from err`.',
      explanation: py`\`raise ... from err\` sets \`__cause__\`, so the traceback shows both errors ("The above exception was the direct cause of…"). A small exception hierarchy lets callers write \`except ConfigError\`. Other best practices: keep \`try\` blocks tight, use \`else\` for code that should run only on success, \`finally\`/\`with\` for clean-up, and log unexpected errors once at the top level with \`logger.exception\`.`,
      whyAsked: 'Exception handling quality is a strong signal of production experience.',
      mistakes: ['Keeping `except Exception` and only improving the message', 'Using a bare `raise Exception`', 'Logging and re-raising at every level (duplicate logs)'],
      followUps: ['What is the difference between __cause__ and __context__?', 'When is catching Exception acceptable?', 'What does `raise ... from None` do?'],
      modelAnswer: 'Three problems: it catches every Exception, so even programming errors become "bad config"; it re-raises a plain Exception, which callers can\'t catch selectively; and it drops the original exception as a cause. I\'d catch only what I expect — FileNotFoundError and json.JSONDecodeError — and raise a domain ConfigError with a clear message, chained with from err so the traceback shows the root cause. Anything unexpected propagates to a top-level handler that logs it once with the traceback.',
    },
    {
      id: 'rapid-review-with-order-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Two context managers in one `with` statement, and an exception. What is printed, in order?',
      code: { lang: 'python', code: py`from contextlib import contextmanager


@contextmanager
def step(name):
    print("enter", name)
    try:
        yield
    finally:
        print("exit", name)


try:
    with step("db"), step("cache"):
        raise ValueError("boom")
except ValueError as e:
    print("caught", e)` },
      options: [
        'enter db, enter cache, exit db, exit cache, caught boom',
        'enter db, enter cache, exit cache, exit db, caught boom',
        'enter db, enter cache, caught boom, exit cache, exit db',
        'enter db, enter cache, caught boom',
      ],
      correctOption: 1,
      answer: 'enter db, enter cache, exit cache, exit db, caught boom — managers enter left to right and exit in reverse (LIFO), running their finally blocks while the exception propagates; the outer except runs last.',
      explanation: py`\`with a, b:\` is equivalent to nesting \`with a:\` around \`with b:\`. Clean-up happens innermost first — just like closing a cache before the database it depends on. The context managers don't suppress the error (their generators re-raise it from \`yield\`), so the outer handler catches it. A manager suppresses an exception only if \`__exit__\` returns a true value.`,
      whyAsked: 'Tests the guarantee that makes context managers valuable — clean-up during exceptions — and the order of nested exits.',
      mistakes: ['Thinking exits run in entry order', 'Thinking the except runs before the clean-up', 'Thinking a @contextmanager with try/finally swallows the exception'],
      followUps: ['How would a context manager suppress the exception?', 'How do you manage a dynamic number of contexts? (contextlib.ExitStack)', 'What changes if step had no try/finally?'],
      modelAnswer: 'It prints enter db, enter cache, then exit cache, exit db, and finally caught boom. Multiple managers in one with statement behave like nested withs, so they enter left to right and exit in reverse order. When the ValueError is raised, it propagates outwards, running each manager\'s finally block on the way — inner first — and since neither suppresses it, the outer except catches it last. That LIFO clean-up is exactly what you want for resources that depend on each other.',
    },
    {
      id: 'rapid-review-concurrency-pick',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Pick asyncio, threads or processes for each and justify: (1) download 2,000 product images from an API, (2) compute a pure-Python similarity score for 10 million pairs, (3) call a blocking third-party SDK from inside a FastAPI (async) endpoint, (4) a simple script that reads three slow network shares with a blocking library.',
      answer: '(1) asyncio (with an async HTTP client and a semaphore to limit concurrency) — many I/O waits; (2) processes (ProcessPoolExecutor) — CPU-bound pure Python is limited by the GIL on the standard build; (3) asyncio.to_thread (a thread) so the blocking call doesn\'t freeze the event loop; (4) threads (ThreadPoolExecutor) — blocking I/O with no async library.',
      explanation: py`Decide by the bottleneck: waiting (I/O) vs computing (CPU), and whether the libraries are async. Bound concurrency in every case (semaphores, pool sizes) to respect rate limits and memory. Measure before and after; for CPU-heavy numeric work, a vectorised library may beat any concurrency. See [choosing concurrency](lesson:choosing-concurrency).`,
      code: { lang: 'python', code: py`import asyncio
import time


def blocking_sdk_call(order_id):
    time.sleep(0.01)                  # stands in for a blocking third-party call
    return f"order {order_id} synced"


async def endpoint(order_id):
    # run the blocking call in a worker thread; the event loop stays free
    return await asyncio.to_thread(blocking_sdk_call, order_id)` },
      whyAsked: 'Shows you can map workloads to concurrency models rather than reciting definitions.',
      mistakes: ['Using threads for CPU-bound pure Python on the GIL build', 'Calling blocking functions directly inside async def', 'Launching unbounded concurrent requests'],
      followUps: ['How would you limit (1) to 20 concurrent downloads?', 'How would the free-threaded build change (2)?', 'What happens if you call time.sleep inside a coroutine?'],
      modelAnswer: 'For two thousand downloads I\'d use asyncio with an async HTTP client and a semaphore, because the work is almost all waiting. The similarity scores are CPU-bound pure Python, so on the standard build I\'d use a ProcessPoolExecutor to use every core. Inside an async endpoint, a blocking SDK call would freeze the event loop, so I\'d wrap it in asyncio.to_thread. And a small script with a blocking library is simplest with a ThreadPoolExecutor, since the threads release the GIL while waiting. In all cases I\'d cap concurrency and measure.',
    },
    {
      id: 'rapid-review-memory-not-freed',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does CPython manage memory? A service builds a huge list, then `del`s it, but the process\'s memory usage barely drops. Why might that be?',
      answer: 'CPython frees an object as soon as its reference count reaches zero, and a cyclic garbage collector reclaims unreachable reference cycles. But del only removes a name — the object lives on if other references exist (a cache, a global, a traceback, a closure). And even freed memory may stay with the process: the small-object allocator returns an arena to the OS only when it\'s completely empty, so fragmentation keeps the footprint high.',
      explanation: py`Investigate with \`tracemalloc\` (where allocations came from), \`gc.get_referrers\` (who still refers to an object), and \`sys.getrefcount\`. Common hidden references: module-level caches, \`functools.lru_cache\` without a size bound, exception tracebacks holding frames, and long-lived closures. For truly large one-off jobs, doing the work in a subprocess guarantees memory goes back to the OS when it exits. All of this is CPython-specific; PyPy uses a different garbage collector.`,
      code: { lang: 'python', code: py`import gc
import sys

report = [str(i) for i in range(1000)]
alias = report                      # a second reference
print(sys.getrefcount(report))      # CPython detail; the exact count varies by version
del report                          # removes a name; the list is still alive via alias
print(len(alias))                   # 1000
del alias                           # last reference gone: freed immediately (CPython)
print(gc.isenabled())               # the cycle collector runs automatically` },
      whyAsked: 'Distinguishes "Python has a garbage collector" from a real understanding of reference counting, cycles and allocator behaviour — useful for production debugging.',
      mistakes: ['Saying del frees memory', 'Saying Python only uses a tracing GC', 'Assuming freed memory always returns to the OS'],
      followUps: ['What is a reference cycle and how is it collected?', 'How would you find a memory leak in a long-running service?', 'What do weak references help with?'],
      modelAnswer: 'CPython uses reference counting: every object counts the references to it and is freed the moment that count hits zero, and a separate cyclic garbage collector finds groups of objects that only refer to each other. del only removes a name, so if a cache, a global or an exception traceback still references the list, it stays alive. And even when it is freed, CPython\'s small-object allocator keeps memory in arenas and can only hand an arena back to the operating system when it\'s completely empty, so fragmentation keeps the process large. I\'d use tracemalloc and gc.get_referrers to find what\'s holding on, and for huge one-off jobs run them in a subprocess.',
    },
    {
      id: 'rapid-review-professional-setup',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'You\'re starting a new Python service with a team. In two minutes, describe how you\'d set up environments, dependencies, tests, type checking and error handling.',
      answer: 'One virtual environment per project (python -m venv .venv or a tool like uv); dependencies declared in pyproject.toml with a lock file or pinned requirements for reproducible installs; pytest with fast unit tests plus a few integration tests, run in CI on every push; Ruff for lint/format and mypy or pyright in CI with type hints on public functions; a small domain exception hierarchy, narrow excepts, raise ... from, and one top-level handler that logs with tracebacks.',
      explanation: py`An architecture answer is a list of decisions with reasons. Isolation prevents version clashes (and PEP 668 blocks global installs on many systems anyway). Lock files make CI and production identical. Tests and type checks catch different bugs. Consistent error handling turns failures into actionable logs. Mention the Python version you'd target and how you'd upgrade it. Third-party tools (uv, Poetry, pytest, Ruff, mypy) aren't in the standard library — name them as choices, not requirements.`,
      code: { lang: 'bash', code: py`python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install -e ".[dev]"  # project + dev tools from pyproject.toml
python -m pytest                   # tests
python -m mypy src                 # type checking` },
      whyAsked: 'Tests whether you know the professional workflow around the code — essential for any role beyond junior.',
      mistakes: ['Installing packages globally', 'No pinned/locked versions', 'Only end-to-end tests, or none', 'Adding type hints but never running a checker'],
      followUps: ['How do you keep dependencies up to date safely?', 'What runs in CI, in which order?', 'Where do you draw the line between unit and integration tests?'],
      modelAnswer: 'I\'d give the project its own virtual environment so its dependencies never clash with others, and declare dependencies in pyproject.toml with a lock file or pinned requirements so developers, CI and production install identical versions. For testing I\'d use pytest with many fast unit tests and a few integration tests around the database and external APIs, all running in CI on every push. I\'d add type hints to public functions and run mypy or pyright plus Ruff in CI. For errors, a small domain exception hierarchy, narrow excepts with raise from, and one top-level handler that logs with tracebacks, so failures are visible and actionable.',
    },
    {
      id: 'rapid-review-whats-new',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Lightning round: name one change per version from 3.10 to 3.14 that affects how you write or run Python, with the version attached.',
      answer: '3.10: structural pattern matching (match) and X | Y union types. 3.11: ExceptionGroup/except*, asyncio.TaskGroup, tomllib, typing.Self, and a much faster interpreter. 3.12: PEP 695 generics (def f[T]) and the type statement, more flexible f-strings (PEP 701), itertools.batched. 3.13: new interactive REPL, experimental free-threaded build and experimental JIT. 3.14: lazily evaluated annotations (PEP 649/749), template strings t"..." (PEP 750), except A, B: without brackets (PEP 758), and the free-threaded build officially supported.',
      explanation: py`Interviewers ask this to check you keep up, and to see whether you know what actually matters day to day. Attach versions precisely and avoid invented performance numbers ("noticeably faster", not "60% faster"). If a codebase supports older versions, say how that limits you (e.g. no \`type\` statement before 3.12). See [modern features](lesson:modern-features) and the official What's New pages.`,
      code: { lang: 'python', code: py`# 3.10: match
def describe(event):
    match event:
        case {"type": "click", "x": x, "y": y}:
            return f"click at {x},{y}"
        case _:
            return "unknown"


# 3.12: type parameters and the type statement
type Pair[T] = tuple[T, T]


def swap[T](pair: Pair[T]) -> Pair[T]:
    return pair[1], pair[0]


print(describe({"type": "click", "x": 3, "y": 4}), swap((1, 2)))` },
      whyAsked: 'Checks that your knowledge is current and that you label version-specific features correctly.',
      mistakes: ['Attaching features to the wrong version', 'Quoting made-up speed-up percentages', 'Listing features without saying why they matter'],
      followUps: ['Which of these can you use if you must support 3.10?', 'What problem do t-strings solve that f-strings don\'t?', 'Would you run production on the free-threaded build today?'],
      modelAnswer: 'In 3.10, structural pattern matching with match, and union types written as X | Y. In 3.11, exception groups with except*, asyncio.TaskGroup, tomllib, and a significantly faster interpreter. In 3.12, the new generics syntax with def f[T] and the type statement, plus more flexible f-strings. In 3.13, the new REPL and an experimental free-threaded build without the GIL. And in 3.14, annotations are evaluated lazily, template strings arrived with t-prefixed literals, except can list several exceptions without brackets, and the free-threaded build became officially supported, though it\'s still optional.',
    },
  ],

  takeaways: [
    'Crisp answer = precise term + one consequence + one condition; expand with the five-part framework when invited.',
    'List for changing collections, tuple for fixed records; tuples are hashable only if their items are.',
    'Dicts are hash tables: O(1) average lookups, insertion order guaranteed since 3.7; sets are unordered.',
    'Shallow copies share inner objects; deepcopy copies recursively.',
    'Decorators: functools.wraps, forward *args/**kwargs, return the result.',
    'Generators are single-pass iterators produced by functions with yield.',
    '__new__ creates (customise immutable types there), __init__ initialises; classmethods build instances of cls, staticmethods are plain functions.',
    'The GIL limits parallel bytecode in standard CPython: asyncio for many I/O waits, threads for blocking I/O, processes for CPU work; free-threading is supported but optional in 3.14.',
    'CPython frees objects by reference counting plus a cycle collector; del removes names, not objects.',
    'Label versions and CPython details — precision is what makes a short answer impressive.',
  ],
}
