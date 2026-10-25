// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WEATHER = py`import functools

CALL_LOG = []


def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        CALL_LOG.append(func.__name__)
        return func(*args, **kwargs)
    return wrapper


def retry(times=3, exceptions=(Exception,)):
    """Decorator factory: retry(...) builds and returns the real decorator."""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as err:
                    print(f"  {func.__name__}: attempt {attempt} failed ({err})")
                    if attempt == times:
                        raise
        return wrapper
    return decorator


def memoize(func):
    cache = {}

    @functools.wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper


failures = {"Oslo": 2}   # Oslo's server fails twice before answering


@logged
@retry(times=3, exceptions=(ConnectionError,))
def fetch_temperature(city):
    """Ask the (pretend) weather server for a city's temperature."""
    if failures.get(city, 0) > 0:
        failures[city] -= 1
        raise ConnectionError("server busy")
    return {"Oslo": -3, "Lima": 19, "Pune": 31}[city]


@memoize
def feels_like(temp, wind):
    print(f"  computing feels_like({temp}, {wind})")
    return round(temp - wind * 0.7)


print("Oslo:", fetch_temperature("Oslo"))
print("Lima:", fetch_temperature("Lima"))
print("feels like:", feels_like(-3, 10), feels_like(-3, 10))
print("name:", fetch_temperature.__name__)
print("doc:", fetch_temperature.__doc__)
print("log:", CALL_LOG)
`

export default {
  id: 'advanced-decorators',
  title: 'Decorators with arguments, functools.wraps & class decorators',
  summary: 'Production decorators preserve metadata with functools.wraps, take configuration through a decorator factory, stack in a predictable order, decorate classes and methods, and can be stateful objects — or just functools.lru_cache.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['decorators'],
  related: ['decorators', 'closures', 'functools', 'descriptors', 'metaclasses', 'methods-and-attributes', 'properties-and-encapsulation', 'dataclasses', 'special-methods', 'optimization-techniques', 'memory-management', 'generics', 'multiprocessing', 'design-patterns'],
  tags: ['decorators', 'functools.wraps', 'update_wrapper', '__wrapped__', 'decorator factory', 'decorators with arguments', 'stacking decorators', 'class decorators', 'registry', '__call__', 'stateful decorator', 'lru_cache', 'cache', 'memoization', 'ParamSpec'],
  apis: [
    { name: 'functools.wraps(wrapped)', summary: 'Decorator for a wrapper: copies __name__, __qualname__, __doc__, __module__, annotations and __dict__ from wrapped, and sets __wrapped__.' },
    { name: 'functools.update_wrapper(wrapper, wrapped)', summary: 'The function behind wraps; use it directly in class-based decorators: update_wrapper(self, func).' },
    { name: '__wrapped__', summary: 'Attribute set by wraps that points to the original function; inspect.signature() and inspect.unwrap() follow it.' },
    { name: 'inspect.unwrap(func)', summary: 'Follows the __wrapped__ chain to the innermost original function.' },
    { name: 'functools.lru_cache(maxsize=128, typed=False)', summary: 'Memoising decorator with a bounded least-recently-used cache, cache_info() and cache_clear().' },
    { name: 'functools.cache', summary: 'Unbounded memoising decorator (3.9+), same as lru_cache(maxsize=None).' },
    { name: 'object.__call__(self, ...)', summary: 'Makes instances callable — the basis of class-based, stateful decorators.' },
  ],
  docs: [
    { label: 'functools.wraps and update_wrapper', url: 'https://docs.python.org/3/library/functools.html#functools.update_wrapper' },
    { label: 'functools.lru_cache', url: 'https://docs.python.org/3/library/functools.html#functools.lru_cache' },
    { label: 'Language reference — function definitions (decorators)', url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions' },
    { label: 'Language reference — class definitions (class decorators)', url: 'https://docs.python.org/3/reference/compound_stmts.html#class-definitions' },
    { label: 'PEP 3129 — class decorators', url: 'https://peps.python.org/pep-3129/' },
    { label: 'PEP 612 — ParamSpec (typing decorators)', url: 'https://peps.python.org/pep-0612/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [decorators](lesson:decorators) you built the basic wrapper: a function that takes \`func\` and returns \`wrapper\`. That's enough to understand the idea — but real-world decorators need five more things, and this lesson covers each:`,
    py`1. **\`functools.wraps\`** — so the wrapper still *looks like* the original (name, docstring, signature) to logs, debuggers, docs and tests.
2. **Arguments** — \`@retry(times=3)\` needs one more layer: a *decorator factory* that builds the decorator.
3. **Stacking** — several decorators on one function, applied bottom-up and called top-down.
4. **Classes** — decorating a whole class (to register it or add to it), and decorating methods inside a class.
5. **State** — decorators written as classes with \`__call__\`, and the ready-made stateful decorator you should usually reach for instead: \`functools.lru_cache\`.`,
    py`By the end you'll be able to read the decorator-heavy code of web frameworks, test suites and libraries — and write decorators that behave like good citizens.`,
  ],
  why: [
    py`A naive wrapper **lies about who it is**. After \`@timed\`, \`checkout.__name__\` says \`"wrapper"\`, \`help(checkout)\` shows no docstring and \`inspect.signature\` says \`(*args, **kwargs)\`. Logs become useless ("wrapper took 2 s"), documentation generators lose your docs, and frameworks that inspect signatures (CLI builders, web routers, test fixtures) break.`,
    py`Real decorators need **settings**: how many retries, which exceptions, which permission, which URL. Hard-coding \`retry_three_times\` doesn't scale; \`@retry(times=5, exceptions=(TimeoutError,))\` does.`,
    py`And real code **stacks** decorators (\`@app.get("/report")\` + \`@require_role("admin")\` + \`@cache\`). The order changes behaviour — sometimes it's the difference between a working permission check and a security hole.`,
  ],
  eli15: [
    py`Think about getting dressed for snow. You put on a T-shirt, then a hoodie, then a coat. The order you **put them on** is inside-out: closest layer first. But when a friend gives you a hug, they **touch** the coat first, then the hoodie, then the T-shirt. Stacked decorators work exactly like that: applied from the bottom line up, but a call goes through the top one first.`,
    py`A **decorator with arguments** is like ordering a custom coat: first you tell the shop "make it blue, size M" (that's \`@coat(colour="blue")\`), they hand you a coat-making machine set up that way, and *that* machine wraps you. One extra step, because you gave settings first.`,
    py`And \`functools.wraps\` is like sewing your name tag onto the **outside** of the coat. Without it, everyone sees a coat that just says "COAT". With it, they can still see it's you inside.`,
  ],
  analogy: {
    title: 'Layers of winter clothing',
    body: [
      py`Getting dressed is applying decorators: the layer written lowest (nearest the \`def\`) goes on first, and each new layer goes over everything before it. Someone reaching you has to go through the outermost layer first — just as a call enters the top decorator's wrapper first and reaches the original function last.`,
      py`Ordering a coat "in blue, with a hood" is a decorator **factory**: your choices are remembered by the coat-maker, which then makes the actual layer. And the name tag on the outside of the coat is \`functools.wraps\` — so people (and tools) still know who's inside.`,
    ],
    mapping: [
      ['the person', 'the original function'],
      ['putting layers on, inside first', 'decorators are applied bottom-up'],
      ['a hug reaches the coat first', 'a call enters the top wrapper first'],
      ['ordering a coat in blue, size M', '@retry(times=3): the factory captures the settings'],
      ['the coat-maker set up with your order', 'the decorator returned by the factory'],
      ['a name tag sewn on the outside', 'functools.wraps copies __name__, __doc__, sets __wrapped__'],
      ['a coat with a step counter in the pocket', 'a stateful class-based decorator with __call__'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Two stacked decorators, one with arguments, both using wraps',
    props: {
      code: py`import functools


def bold(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return "<b>" + func(*args, **kwargs) + "</b>"
    return wrapper


def repeat(times):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return " ".join([func(*args, **kwargs) for _ in range(times)])
        return wrapper
    return decorator


@bold
@repeat(times=2)
def cheer(name):
    return "go " + name + "!"


print(cheer("ada"))
print(cheer.__wrapped__.__wrapped__("ben"))
`,
      notes: {
        11: '`repeat` is a **factory**: it takes the settings, not the function.',
        20: 'Decorator expressions are evaluated top-down first: `bold` is looked up, then `repeat(times=2)` is **called** and returns `decorator` (whose closure remembers `times = 2`).',
        21: 'Then the function is created and decorated **bottom-up**: `decorator(cheer)` first, then `bold(...)` around that result.',
        13: '`functools.wraps(func)` copies the name, docstring and more onto the new wrapper and sets `wrapper.__wrapped__ = func`. That is why every function in the objects area is labelled `cheer`: tell them apart by their closures and `__wrapped__` arrows.',
        26: 'The call enters the **outer** wrapper (bold) first, which calls the inner wrapper (repeat), which calls the original twice. Results flow back out: joined, then wrapped in `<b>`.',
        27: '`__wrapped__` lets you walk back through the layers to the undecorated original — handy in tests.',
      },
    },
    alt: 'A step-by-step trace. bold and repeat are defined. At the decorated def, repeat(times=2) runs first and returns a decorator whose closure holds times = 2. The original cheer function is created, passed to that decorator, which returns an inner wrapper whose closure holds func (the original) and times; then bold wraps that, returning an outer wrapper whose closure holds func (the inner wrapper). All three function objects are labelled cheer because functools.wraps copied the name, and each wrapper shows a __wrapped__ arrow to the layer below. Calling cheer("ada") goes outer wrapper, inner wrapper, original twice, and prints <b>go ada! go ada!</b>. The last line follows __wrapped__ twice to call the original directly, printing go ben!.',
    caption: py`Follow the arrows: the global name \`cheer\` → bold's wrapper → repeat's wrapper → the original. \`functools.wraps\` adds a \`__wrapped__\` link at each layer.`,
  },
  syntax: [
    py`#### 1. functools.wraps: keep the original's identity`,
    { code: py`import functools
import inspect


def plain(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


def polite(func):
    @functools.wraps(func)            # copy metadata from func onto wrapper
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@plain
def total(prices: list[float]) -> float:
    """Sum a list of prices."""
    return sum(prices)


@polite
def average(prices: list[float]) -> float:
    """Average of a list of prices."""
    return sum(prices) / len(prices)


print(total.__name__, total.__doc__)           # wrapper None
print(average.__name__, average.__doc__)       # average Average of a list of prices.
print(inspect.signature(total))                # (*args, **kwargs)
print(inspect.signature(average))              # (prices: list[float]) -> float
print(average.__wrapped__)                     # <function average at 0x...>: the original`, lang: 'python', title: 'with and without wraps' },
    py`\`functools.wraps(func)\` is itself a decorator (with an argument!). It calls \`functools.update_wrapper(wrapper, func)\`, which:`,
    py`- copies \`__module__\`, \`__name__\`, \`__qualname__\`, \`__doc__\`, the annotations and \`__type_params__\` (3.12+) from \`func\` to \`wrapper\`;
- **updates** \`wrapper.__dict__\` with \`func.__dict__\` (so custom attributes survive);
- sets \`wrapper.__wrapped__ = func\`, which \`inspect.signature()\`, \`inspect.unwrap()\` and \`help()\` follow to show the *real* signature.`,
    { callout: 'version', title: 'Python 3.14: annotations are lazy', text: py`With deferred evaluation of annotations (PEP 649/749) in 3.14, \`wraps\` copies \`__annotate__\` (the function that computes annotations on demand) instead of the \`__annotations__\` dict. You don't need to change any code — \`average.__annotations__\` still works.` },
    py`#### 2. Decorators with arguments: three levels`,
    py`\`@retry(times=3)\` has parentheses, so Python **calls** \`retry(times=3)\` first and uses whatever it returns as the decorator. So \`retry\` isn't a decorator — it's a **decorator factory**: a function that returns a decorator.`,
    { code: py`import functools


def retry(times=3, exceptions=(Exception,)):     # level 1: takes the SETTINGS
    def decorator(func):                           # level 2: takes the FUNCTION
        @functools.wraps(func)
        def wrapper(*args, **kwargs):              # level 3: takes the CALL'S ARGUMENTS
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if attempt == times:
                        raise
        return wrapper
    return decorator


@retry(times=5, exceptions=(ConnectionError,))
def fetch_rates():
    return {"EUR": 1.0}

# ...is the same as:
# fetch_rates = retry(times=5, exceptions=(ConnectionError,))(fetch_rates)
print(fetch_rates())`, lang: 'python', title: 'a decorator factory' },
    py`Each level is a closure over the one outside it: \`wrapper\` sees \`func\` (from \`decorator\`) **and** \`times\`/\`exceptions\` (from \`retry\`). Read it as: *settings → function → call*.`,
    { callout: 'tip', title: 'Supporting both @retry and @retry(times=5)', text: py`A common trick: make the function optional and the settings keyword-only. \`def retry(func=None, *, times=3):\` — if \`func is None\` you were called with settings, so \`return functools.partial(retry, times=times)\`; otherwise decorate \`func\` directly. The keyword-only \`*\` prevents \`@retry(5)\` from being mistaken for a function.` },
    { code: py`import functools


def retry(func=None, *, times=3):
    if func is None:                                   # used as @retry(times=...)
        return functools.partial(retry, times=times)

    @functools.wraps(func)                             # used as plain @retry
    def wrapper(*args, **kwargs):
        for attempt in range(times):
            try:
                return func(*args, **kwargs)
            except Exception:
                if attempt == times - 1:
                    raise
    return wrapper


@retry
def ping():
    return "pong"


@retry(times=5)
def pong():
    return "ping"


print(ping(), pong())   # pong ping`, lang: 'python', title: 'optional arguments (advanced pattern)' },
    py`#### 3. Stacking: applied bottom-up, called top-down`,
    { code: py`@logged                                           # applied 2nd → outermost layer
@retry(times=3, exceptions=(ConnectionError,))    # applied 1st → innermost layer
def fetch_temperature(city):
    ...

# equivalent to:
# fetch_temperature = logged(retry(times=3, exceptions=(ConnectionError,))(fetch_temperature))`, lang: 'python', static: true, title: 'stacking order' },
    py`- **Evaluation:** the decorator *expressions* (\`logged\`, \`retry(times=3, ...)\`) are evaluated top-down, before the function exists.
- **Application:** the decorator nearest the \`def\` wraps first; each one above wraps the result of the one below.
- **Calls:** the outermost (top) wrapper runs first. Here \`logged\` records **one** entry per call, however many retries happen inside. Swap the lines and every *attempt* is logged.`,
    { callout: 'warn', title: 'Order can be a security bug', text: py`Put access checks **outside** (above) caches. With \`@cache\` above \`@require_admin\`, the first admin's call stores the report, and later calls are answered from the cache — *without running the permission check at all*.` },
    py`#### 4. Decorating methods and classes`,
    py`A function decorator works on methods unchanged: the wrapper is a plain function, so it becomes a method too, and \`self\` simply arrives as \`args[0]\` (or name it explicitly: \`def wrapper(self, *args, **kwargs)\`).`,
    py`A **class decorator** receives the class object after the \`class\` body has run, and returns a class (normally the same one). Use it to register classes or add attributes/methods. \`@dataclass\` and \`@functools.total_ordering\` are class decorators you already use.`,
    { code: py`EXPORTERS = {}


def exporter(fmt):                       # a factory, so it can take the format name
    def register(cls):                   # the class decorator itself
        EXPORTERS[fmt] = cls
        cls.format = fmt                 # decorators may add attributes
        return cls                       # return the class (unchanged otherwise)
    return register


@exporter("csv")
class CsvExporter:
    def export(self, rows):
        return "\n".join(",".join(map(str, row)) for row in rows)


print(EXPORTERS)                          # {'csv': <class '__main__.CsvExporter'>}
print(CsvExporter.format)                 # csv
print(EXPORTERS["csv"]().export([(1, 2), (3, 4)]))`, lang: 'python', title: 'a class decorator that registers plugins' },
    py`#### 5. Stateful decorators as classes`,
    py`Any object with a \`__call__\` method can be called like a function — so a class can be a decorator: \`__init__\` receives the function, \`__call__\` runs on every call, and the instance holds the state as ordinary attributes.`,
    { code: py`import functools


class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)   # wraps() for objects
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

    def reset(self):
        self.count = 0


@CountCalls
def scan(barcode):
    """Look up a product by barcode."""
    return f"item {barcode}"


scan("123")
scan("456")
print(scan.count, scan.__name__, scan.__doc__)   # 2 scan Look up a product by barcode.`, lang: 'python', title: 'a class-based decorator' },
    { callout: 'warn', title: 'Class-based decorators and methods', text: py`Put \`@CountCalls\` on a *method* and \`self\` goes missing: \`Greeter().greet("ada")\` fails with \`TypeError: Greeter.greet() missing 1 required positional argument: 'name'\` ("ada" arrived as \`self\`). Plain functions turn into bound methods because they are **descriptors** (they have \`__get__\`); your \`CountCalls\` instance isn't. Add a \`__get__\` that returns \`types.MethodType(self, instance)\` — [descriptors](lesson:descriptors) explains why that works.` },
    py`#### 6. Caching: your own memoize vs functools.lru_cache`,
    py`*Memoization* means remembering the result for each set of arguments so repeated calls are answered instantly. A hand-rolled version is a great exercise; in real code use the standard library:`,
    py`| | hand-rolled \`memoize\` (dict) | \`functools.lru_cache(maxsize=128)\` / \`functools.cache\` (3.9+) |
|---|---|---|
| memory | grows forever | bounded: evicts the least recently used entry (\`cache\` is unbounded) |
| keyword arguments | usually ignored or mishandled | part of the key (keyword order can create separate entries) |
| introspection | none | \`cache_info()\` (hits, misses, size), \`cache_clear()\` |
| \`1\` vs \`1.0\` | same key | same by default; \`typed=True\` separates them |
| thread safety | your problem | structure stays consistent under threads (the function may still run twice for one key concurrently) |
| speed | a Python wrapper | CPython uses a C implementation |`,
    py`Both need **hashable** arguments (no lists or dicts) and only make sense for **pure** functions — same inputs, same output, no side effects. See [functools](lesson:functools) and [optimization techniques](lesson:optimization-techniques).`,
  ],
  walkthrough: {
    title: 'Reading the weather service',
    lang: 'python',
    code: WEATHER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [6, 11], text: py`\`logged\` is a simple decorator, but with \`@functools.wraps(func)\` on its wrapper so the wrapper keeps the original's name, docstring and a \`__wrapped__\` link.` },
      { lines: [14, 16], text: py`\`retry\` is a **factory**: its parameters are settings with defaults. It returns \`decorator\`, which is the real decorator waiting for a function.` },
      { lines: [17, 25], text: py`The wrapper loops through attempts. \`except exceptions as err\` catches only the exception types the caller chose (a tuple works with \`except\`). On the final attempt a bare \`raise\` re-raises the error unchanged.` },
      { lines: [30, 38], text: py`\`memoize\` keeps a dict in its closure. The key is the \`args\` tuple, so the arguments must be hashable. It handles only positional arguments — one reason to prefer \`functools.lru_cache\`.` },
      { lines: [44, 46], text: py`Two stacked decorators. \`retry(...)\` is evaluated and called first to get its decorator; then the function is wrapped bottom-up: \`retry\`'s wrapper first, \`logged\` around it. The name \`fetch_temperature\` ends up pointing at the **logged** wrapper.` },
      { lines: [60, 61], text: py`Calling Oslo enters \`logged\` (one log entry), then \`retry\`, which sees two \`ConnectionError\`s and succeeds on attempt 3. Lima succeeds first time.` },
      { lines: [62, 62], text: py`The first \`feels_like(-3, 10)\` computes and prints "computing…"; the second is answered from the cache, so "computing" appears only once.` },
      { lines: [63, 65], text: py`Thanks to \`wraps\` on **both** layers, the outer wrapper reports the original name and docstring. The log has 2 entries — one per outer call — because \`logged\` sits outside \`retry\`.` },
    ],
  },
  playground: {
    title: 'Weather service: retry, log, cache',
    objective: 'Run it, then change the stacking order, remove a wraps and swap in lru_cache — and predict each change before you run it.',
    files: { 'main.py': WEATHER },
    expected: py`\`\`\`text
  fetch_temperature: attempt 1 failed (server busy)
  fetch_temperature: attempt 2 failed (server busy)
Oslo: -3
Lima: 19
  computing feels_like(-3, 10)
feels like: -10 -10
name: fetch_temperature
doc: Ask the (pretend) weather server for a city's temperature.
log: ['fetch_temperature', 'fetch_temperature']
\`\`\``,
    experiments: [
      {
        id: 'swap-order',
        task: py`Swap the two decorator lines on \`fetch_temperature\` so \`@retry(...)\` is on top and \`@logged\` is directly above the \`def\`. How many entries will \`CALL_LOG\` have now?`,
        hint: py`Now \`logged\` wraps the original and \`retry\` wraps \`logged\`. Every retry attempt goes through the logging wrapper.`,
        tests: [
          { name: 'every attempt is logged now', code: py`assert len(CALL_LOG) == 4, f"CALL_LOG has {len(CALL_LOG)} entries"` },
          { name: 'still works', code: py`assert 'Oslo: -3' in output` },
        ],
        explain: py`Decorators are applied bottom-up, so the one nearest the \`def\` becomes the innermost layer. With \`logged\` inside \`retry\`, the three Oslo attempts and the one Lima attempt are all logged: 4 entries. Order is behaviour.`,
      },
      {
        id: 'more-retries',
        task: py`Make Oslo's server fail **3** times (\`failures = {"Oslo": 3}\`) and change the decorator's settings so the program still prints \`Oslo: -3\`.`,
        hint: py`With 3 failures you need at least 4 attempts: \`@retry(times=4, exceptions=(ConnectionError,))\`.`,
        tests: [
          { name: 'Oslo failed three times', code: py`assert 'attempt 3 failed' in output` },
          { name: 'and still succeeded', code: py`assert 'Oslo: -3' in output` },
        ],
        explain: py`The factory's arguments are captured in the closure of the decorator it returns, and from there in every wrapper it creates. Different functions can use different settings: \`@retry(times=2)\` here, \`@retry(times=10)\` there.`,
      },
      {
        id: 'no-wraps',
        task: py`Delete the \`@functools.wraps(func)\` line inside \`retry\` (keep the one in \`logged\`). Before running: what will \`name:\`, \`doc:\` and \`log:\` show?`,
        hint: py`\`logged\` copies metadata from the function **it** received — which is now retry's bare wrapper.`,
        tests: [
          { name: 'the name is lost', code: py`assert fetch_temperature.__name__ == 'wrapper'` },
          { name: 'the log now records "wrapper"', code: py`assert CALL_LOG[0] == 'wrapper'` },
        ],
        explain: py`\`wraps\` only copies from the layer directly below. One layer without it breaks the chain for every layer above: the name becomes \`wrapper\`, the docstring \`None\`, and even the log entries are wrong. Every wrapper needs its own \`@functools.wraps(func)\`.`,
      },
      {
        id: 'lru-cache',
        task: py`Replace \`@memoize\` with \`@functools.lru_cache(maxsize=128)\` and add \`print(feels_like.cache_info())\` at the end.`,
        hint: py`\`functools\` is already imported. \`cache_info()\` returns a named tuple with hits, misses, maxsize and currsize.`,
        tests: [
          { name: 'uses lru_cache', code: py`assert hasattr(feels_like, 'cache_info'), 'Decorate feels_like with @functools.lru_cache(maxsize=128)'` },
          { name: 'one miss then one hit', code: py`info = feels_like.cache_info()
assert (info.hits, info.misses) == (1, 1)
assert 'CacheInfo(hits=1, misses=1' in output` },
        ],
        explain: py`\`lru_cache\` does what \`memoize\` did — plus a size limit, keyword-argument support, statistics and \`cache_clear()\`. Hand-rolled caches are for learning; the standard library's is for shipping.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Stacked decorators: on bottom-up, through top-down',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'name', label: 'fetch_temperature', note: 'the module name', x: 90, y: 90, tone: 'ink' },
        { id: 'log', label: 'logged wrapper', note: 'outer layer (top line)', x: 300, y: 90, tone: 'yellow' },
        { id: 'retry', label: 'retry wrapper', note: 'inner layer (line above def)', x: 510, y: 90, tone: 'blue' },
        { id: 'orig', label: 'original function', note: 'the def body', x: 680, y: 240, tone: 'paper' },
        { id: 'factory', label: 'retry(times=3, …)', note: 'factory, called first', x: 300, y: 240, tone: 'kraft' },
      ],
      edges: [
        { id: 'make', from: 'factory', to: 'retry', label: 'its decorator builds', dashed: true },
        { id: 'r2o', from: 'retry', to: 'orig', label: 'func' },
        { id: 'l2r', from: 'log', to: 'retry', label: 'func' },
        { id: 'n2l', from: 'name', to: 'log', label: 'bound to' },
      ],
      steps: [
        { focus: ['factory'], text: py`Decorator **expressions** are evaluated top-down first: \`logged\` is looked up, then \`retry(times=3, exceptions=...)\` is *called* and returns the real decorator, remembering the settings in its closure.` },
        { focus: ['orig'], text: py`Next the \`def\` body becomes a function object. It has no name binding yet.` },
        { focus: ['factory', 'retry', 'orig'], edges: ['make', 'r2o'], text: py`Application starts at the **bottom**: retry's decorator wraps the original. The new wrapper's closure holds \`func\` → original plus the settings.` },
        { focus: ['log', 'retry'], edges: ['l2r'], text: py`Then \`logged\` wraps **that** wrapper. Thanks to \`functools.wraps\`, each layer copies the name and docstring from the layer below and stores a \`__wrapped__\` link to it.` },
        { focus: ['name', 'log'], edges: ['n2l'], text: py`Finally the name \`fetch_temperature\` is bound to the outermost wrapper.` },
        { focus: ['name', 'log', 'retry', 'orig'], edges: ['n2l', 'l2r', 'r2o'], text: py`A call travels **top-down**: logged's wrapper runs first (one log entry), calls retry's wrapper (which may loop several times), which calls the original. Results — or exceptions — travel back out the same way.` },
      ],
    },
    alt: 'Diagram of a decorated function. The factory call retry(times=3) runs first and produces a decorator. The original function is wrapped by the retry wrapper, which is then wrapped by the logged wrapper; the module name fetch_temperature is bound to the logged wrapper. A call goes from the name to the logged wrapper, then to the retry wrapper, then to the original.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`functools.wraps\` doesn't change *behaviour* at all — the wrapper still runs. It changes the wrapper's **labels**: name, docstring, module, annotations. Think of it as relabelling the box so it matches what's inside.`,
      py`The \`__wrapped__\` attribute is the most useful extra: it's a direct link to the function underneath. Tests can call the undecorated logic, and \`inspect.unwrap\` follows the links all the way down:`,
      { code: py`import functools
import inspect


def shout(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper


@shout
@shout
def greet(name):
    return f"hi {name}"


print(greet("ada"))                       # HI ADA
print(greet.__wrapped__.__wrapped__("ada"))   # hi ada (the original)
print(inspect.unwrap(greet)("ada"))       # hi ada (follows every __wrapped__)`, lang: 'python', title: 'unwrapping' },
    ],
    technical: [
      py`#### What update_wrapper really does`,
      py`\`functools.wraps(func)\` returns \`functools.partial(update_wrapper, wrapped=func)\`. \`update_wrapper\` loops over \`functools.WRAPPER_ASSIGNMENTS\` and copies each attribute that exists on \`func\` (missing ones are skipped), then updates each dict named in \`WRAPPER_UPDATES\` (just \`__dict__\`), and finally sets \`__wrapped__\`. On CPython 3.14 the assignments are \`('__module__', '__name__', '__qualname__', '__doc__', '__annotate__', '__type_params__')\`. Because it only uses \`setattr\`, it works on any object that accepts attributes — including your class-based decorator's instances.`,
      py`Copying \`__qualname__\` has a practical effect: **pickle** finds functions by module + qualified name. A wrapper without \`wraps\` is named \`plain.<locals>.wrapper\`, which can't be found again, so pickling it fails ("Can't pickle local object"). With \`wraps\`, the qualified name resolves to the module-level name, which points at the wrapper — so it pickles. That matters when you send decorated functions to other processes with [multiprocessing](lesson:multiprocessing).`,
      py`#### Exact evaluation order`,
      { code: py`def deco(label):
    print("making", label)
    def decorator(func):
        print("applying", label)
        return func
    return decorator


@deco("A")
@deco("B")
def hello():
    pass
# making A
# making B
# applying B
# applying A`, lang: 'python', title: 'expressions top-down, application bottom-up' },
      py`#### Why functions bind and decorator objects don't`,
      py`\`obj.method\` works because function objects implement the **descriptor protocol**: \`function.__get__(obj, cls)\` returns a *bound method* that inserts \`obj\` as the first argument. A wrapper function is still a function, so it binds normally. An instance of \`CountCalls\` has \`__call__\` but no \`__get__\`, so looking it up on an instance returns the object itself and \`self\` is never inserted. Adding \`__get__\` fixes it — the whole story is in [descriptors](lesson:descriptors).`,
      { code: py`import functools
import types


class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

    def __get__(self, instance, owner=None):
        if instance is None:              # accessed on the class: Greeter.greet
            return self
        return types.MethodType(self, instance)   # bind like a normal method


class Greeter:
    @CountCalls
    def greet(self, name):
        return f"hi {name}"


g = Greeter()
print(g.greet("ada"), g.greet("ben"), Greeter.greet.count)   # hi ada hi ben 2`, lang: 'python', title: 'making a class-based decorator work on methods' },
      { callout: 'note', title: 'CPython detail', text: py`In CPython, \`functools.lru_cache\` is implemented in C (the \`_functools\` module), with a pure-Python fallback in \`functools.py\` used by implementations without it. The behaviour is specified by the documentation; the speed of the C version is an implementation detail. Note the documented caveat: calls that differ only in keyword order, like \`f(a=1, b=2)\` and \`f(b=2, a=1)\`, may get separate cache entries.` },
    ],
    production: [
      py`**Rule one: every wrapper gets \`@functools.wraps(func)\`.** Linters can flag decorators without it, and code review should too.`,
      py`**Type your decorators with \`ParamSpec\`** (3.10+) so type checkers keep the decorated function's signature instead of degrading it to \`(*args, **kwargs) -> Any\`:`,
      { code: py`import functools
from collections.abc import Callable


def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]:    # 3.12+ type parameter syntax
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper


@logged
def add(a: int, b: int) -> int:
    return a + b


print(add(2, 3))     # a type checker now knows add(a: int, b: int) -> int`, lang: 'python', title: 'a typed decorator (see generics)' },
      py`**Order your stack deliberately.** Typical order from top to bottom: routing/registration, authentication/authorisation, rate limiting, caching, retries, timing/logging, then the function. Write the reason in a comment when the order matters.`,
      py`**\`lru_cache\` on methods is a memory trap.** The cache lives on the *function*, shared by all instances, and its keys include \`self\` — so every instance that was ever used is kept alive by the cache. Prefer \`functools.cached_property\` for per-instance values, a cache stored on the instance, or a module-level cached function keyed by plain values. See [memory management](lesson:memory-management).`,
      py`**Caches return the same object every time.** If a cached function returns a list or dict and a caller mutates it, every later caller sees the change. Return immutable values (tuples, frozensets) from cached functions, and call \`cache_clear()\` between tests.`,
      py`**Class decorators vs alternatives.** A class decorator affects only the class it's applied to (not subclasses). If every subclass must be registered or validated automatically, \`__init_subclass__\` is usually the better tool — see [metaclasses](lesson:metaclasses).`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting functools.wraps',
      wrong: { code: py`def timed(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper`, lang: 'python' },
      right: { code: py`import functools

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper`, lang: 'python' },
      explanation: py`Without \`wraps\`, every decorated function is called "wrapper" in logs, tracebacks and \`help()\`, its docstring disappears, \`inspect.signature\` shows \`(*args, **kwargs)\`, and pickling fails. One line fixes all of it.`,
    },
    {
      title: 'Using a decorator factory without parentheses',
      wrong: { code: py`@retry                  # retry(func) is treated as retry(times=func)!
def fetch():
    ...`, lang: 'python', static: true },
      right: { code: py`@retry(times=3)         # call the factory, then decorate
def fetch():
    ...`, lang: 'python', static: true },
      explanation: py`A factory expects settings. \`@retry\` passes the *function* as the first setting and binds \`fetch\` to the inner \`decorator\`; calling \`fetch()\` then fails with \`TypeError: retry.<locals>.decorator() missing 1 required positional argument: 'func'\`. Use parentheses — or support both forms with the \`func=None\` pattern.`,
    },
    {
      title: 'Caching outside the permission check',
      wrong: { code: py`@functools.cache
@require_admin
def monthly_report(month):
    ...`, lang: 'python', static: true },
      right: { code: py`@require_admin
@functools.cache
def monthly_report(month):
    ...`, lang: 'python', static: true },
      explanation: py`Stacked decorators run top-down. With the cache on top, a cached report is returned **before** \`require_admin\` ever runs — any user gets it. Checks that must run on every call go on the outside.`,
    },
    {
      title: 'A class-based decorator on a method',
      wrong: { code: py`class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)


class Greeter:
    @CountCalls
    def greet(self, name):
        return f"hi {name}"

# Greeter().greet("ada") -> TypeError: Greeter.greet() missing 1 required positional argument: 'name'`, lang: 'python' },
      right: { code: py`import types


class CountCalls:
    def __init__(self, func):
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

    def __get__(self, instance, owner=None):
        return self if instance is None else types.MethodType(self, instance)`, lang: 'python' },
      explanation: py`Only objects with \`__get__\` (like functions) become bound methods. Without it, the instance is never passed, so \`"ada"\` lands in \`self\`. Either add \`__get__\` or write the decorator as a function with a closure.`,
    },
    {
      title: 'Memoizing with unhashable or changing arguments',
      wrong: { code: py`import functools

@functools.lru_cache(maxsize=None)
def total(prices):
    return sum(prices)

total([3.5, 2.25])   # TypeError: unhashable type: 'list'`, lang: 'python', static: true },
      right: { code: py`import functools

@functools.lru_cache(maxsize=None)
def total(prices):
    return sum(prices)

print(total((3.5, 2.25)))   # pass a tuple: hashable and immutable`, lang: 'python' },
      explanation: py`Caches use the arguments as dictionary keys, so they must be hashable. That restriction is also protection: a list could change after being cached, making the stored answer wrong.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: retry.<locals>.decorator() missing 1 required positional argument: 'func'`,
      cause: py`A decorator factory was used without calling it: \`@retry\` instead of \`@retry(...)\`, so the name is bound to the inner decorator.`,
      fix: py`Add parentheses (\`@retry()\` for defaults), or make the factory accept both forms with \`def retry(func=None, *, times=3)\`.`,
    },
    {
      symptom: py`TypeError: Greeter.greet() missing 1 required positional argument: 'name'`,
      cause: py`A class-based decorator (an object with \`__call__\`) was applied to a method; it has no \`__get__\`, so \`self\` is never passed.`,
      fix: py`Implement \`__get__\` returning \`types.MethodType(self, instance)\`, or use a function-based decorator.`,
    },
    {
      symptom: py`TypeError: unhashable type: 'list' — when calling an lru_cache'd function`,
      cause: py`Cache keys are built from the arguments, which must be hashable.`,
      fix: py`Pass tuples/frozensets, or convert inside a small uncached front function before calling the cached one.`,
    },
    {
      symptom: py`_pickle.PicklingError: Can't pickle local object <function plain.<locals>.wrapper …>`,
      cause: py`A decorated function without \`functools.wraps\` has a qualified name that pickle can't look up again (common with multiprocessing).`,
      fix: py`Add \`@functools.wraps(func)\` so the qualified name matches the module-level name.`,
    },
    {
      symptom: py`A cached function returns stale or mutated data`,
      cause: py`The function isn't pure (it reads changing state), or a caller mutated a returned list/dict that the cache shares with everyone.`,
      fix: py`Only cache pure functions; return immutable values; call \`func.cache_clear()\` when the underlying data changes and between tests.`,
    },
    {
      symptom: py`Logs or permission checks run the wrong number of times`,
      cause: py`Stacking order: decorators apply bottom-up and run top-down.`,
      fix: py`Write out the equivalent \`f = a(b(c(f)))\` and check which layer is outermost; move checks that must always run to the top.`,
    },
  ],
  bestPractices: [
    'Put @functools.wraps(func) on every function wrapper; use functools.update_wrapper(self, func) in class-based decorators.',
    'Use a decorator factory (settings → decorator → wrapper) for configurable decorators, with keyword-only settings.',
    'Know the stacking rule: applied bottom-up, called top-down; keep security checks outermost and document order-sensitive stacks.',
    'Prefer functools.lru_cache / functools.cache over hand-rolled memoization, and only cache pure functions with hashable arguments.',
    'Avoid lru_cache on methods of long-lived objects; use cached_property or per-instance caches.',
    'Make class decorators return the class; use them for registration or small additions, not to rewrite classes wholesale.',
    'Type decorators with ParamSpec so type checkers keep the original signature.',
  ],
  useCases: [
    'Configurable retries, rate limits and timeouts: @retry(times=5), @rate_limit(per_minute=60).',
    'Role checks in web apps: @require_role("admin").',
    'Plugin and handler registries: @exporter("csv") on a class, @command("deploy") on a function.',
    'Memoizing expensive pure computations with @functools.lru_cache.',
    'Generating boilerplate on classes: @dataclass, @functools.total_ordering.',
    'Counting or profiling calls with a stateful class-based decorator.',
  ],
  whenToUse: {
    use: [
      'A wrapper needs per-use configuration → decorator factory.',
      'Several independent concerns apply to one function → stack small decorators.',
      'You need to register or lightly augment specific classes → class decorator.',
      'The decorator must keep inspectable state (counters, stats, reset) → class with __call__.',
    ],
    avoid: [
      'Deep stacks where the order is subtle and undocumented — consider one explicit decorator that does both jobs.',
      'Class decorators that replace the class with a different one — isinstance checks and subclassing get confusing.',
      'Hand-rolled caches in production code when lru_cache/cache fits.',
      'Every subclass must be processed automatically → __init_subclass__ instead of remembering to decorate each one.',
    ],
  },
  comparison: {
    title: 'Four shapes of decorator',
    headers: ['', 'Function decorator', 'Decorator factory', 'Class-based decorator', 'Class decorator'],
    rows: [
      ['used as', '@timed', '@retry(times=3)', '@CountCalls', '@exporter("csv") above class'],
      ['receives', 'a function', 'settings, then a function', 'a function (in __init__)', 'a class'],
      ['returns', 'a wrapper function', 'a decorator', 'itself (a callable object)', 'usually the same class'],
      ['state lives in', 'closure / wrapper attributes', 'closure (settings)', 'instance attributes', 'the class or a registry'],
      ['works on methods', 'yes (functions bind)', 'yes', 'only with __get__', 'n/a'],
      ['metadata', 'functools.wraps', 'functools.wraps', 'functools.update_wrapper(self, func)', 'class keeps its own'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'advanced-decorators-q1',
      type: 'mcq',
      prompt: py`What does \`@functools.wraps(func)\` on a wrapper do?`,
      options: [
        { text: 'Makes the wrapper run faster by skipping the extra call', why: 'wraps never changes how calls work; the wrapper still runs on every call.' },
        'Copies the original’s name, docstring, module, annotations and __dict__ onto the wrapper and sets wrapper.__wrapped__',
        { text: 'Turns any function into a decorator', why: 'wraps is applied to a wrapper inside a decorator; it does not create decorators.' },
        { text: 'Prevents the original function from being called directly', why: 'The opposite: __wrapped__ makes the original easier to reach.' },
      ],
      answer: 1,
      explanation: py`\`wraps\` is a convenience for \`functools.update_wrapper\`. It changes the wrapper's metadata, not its behaviour, and adds the \`__wrapped__\` link that \`inspect.signature\` and \`inspect.unwrap\` follow.`,
    },
    {
      id: 'advanced-decorators-q2',
      type: 'output',
      prompt: 'Predict all seven lines of output.',
      code: py`def deco(label):
    print("making", label)
    def decorator(func):
        print("applying", label)
        def wrapper():
            print("enter", label)
            return func()
        return wrapper
    return decorator

@deco("A")
@deco("B")
def hello():
    print("hello")

hello()`,
      options: [
        'making A\nmaking B\napplying B\napplying A\nenter A\nenter B\nhello',
        { text: 'making A\napplying A\nmaking B\napplying B\nenter A\nenter B\nhello', why: 'Both factory calls happen before any decorator is applied — the function does not even exist yet when deco("A") and deco("B") are evaluated.' },
        { text: 'making B\napplying B\nmaking A\napplying A\nenter B\nenter A\nhello', why: 'Decorator expressions are evaluated top-down, and calls enter the outermost (top) wrapper first.' },
        { text: 'making A\nmaking B\napplying A\napplying B\nenter B\nenter A\nhello', why: 'Application is bottom-up (B wraps the function first), so A ends up outermost and is entered first.' },
      ],
      answer: 0,
      explanation: py`Three phases: the decorator **expressions** \`deco("A")\` and \`deco("B")\` are evaluated top-down; the decorators are **applied** bottom-up (B wraps \`hello\`, then A wraps that); a **call** enters the outermost layer, A, first.`,
    },
    {
      id: 'advanced-decorators-q3',
      type: 'output',
      prompt: 'What does the last line print?',
      code: py`import functools

def plain(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def polite(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@plain
def a():
    "Docs for a."

@polite
def b():
    "Docs for b."

print(a.__name__, a.__doc__, b.__name__, b.__doc__)`,
      answer: 'wrapper None b Docs for b.',
      accept: ['wrapper None b Docs for b.'],
      explanation: py`\`a\` is bound to a bare wrapper with no docstring, so it reports \`wrapper\` and \`None\`. \`b\`'s wrapper had the metadata copied over by \`wraps\`.`,
    },
    {
      id: 'advanced-decorators-q4',
      type: 'bug',
      prompt: py`Calling \`cheer()\` raises \`TypeError: repeat.<locals>.decorator() missing 1 required positional argument: 'func'\`. Click the line to fix.`,
      code: py`def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat
def cheer():
    print("hip hip hooray")

cheer()`,
      answerLine: 9,
      explanation: py`\`repeat\` is a factory that expects a number. \`@repeat\` calls \`repeat(cheer)\` — \`times\` becomes the function! — and binds \`cheer\` to \`decorator\`, which then needs a \`func\` argument. Write \`@repeat(3)\`.`,
    },
    {
      id: 'advanced-decorators-q5',
      type: 'fill',
      prompt: py`Complete the decorator factory so \`@prefix(">> ")\` adds the prefix to the function's result and keeps its metadata.`,
      code: py`import functools

def prefix(text):
    def decorator(func):
        @functools.wraps(___)
        def wrapper(*args, **kwargs):
            return text + func(*args, **kwargs)
        return ___
    return ___`,
      answer: [['func'], ['wrapper'], ['decorator']],
      explanation: py`Settings → function → call. \`wraps\` copies from \`func\`; \`decorator\` returns \`wrapper\`; the factory returns \`decorator\`.`,
    },
    {
      id: 'advanced-decorators-q6',
      type: 'mcq',
      prompt: py`A class-based decorator with \`__call__\` works on plain functions but breaks on methods (\`self\` goes missing). Why?`,
      options: [
        { text: 'Methods cannot be decorated in Python', why: '@staticmethod, @property and wrapper-function decorators all work on methods.' },
        'Its instances have no __get__ method, so they never become bound methods and the instance is not passed in',
        { text: '__call__ is not allowed to take *args', why: '__call__ can take any parameters; the instance simply never arrives in them.' },
        { text: 'update_wrapper deletes the self parameter', why: 'update_wrapper only copies attributes like __name__ and __doc__.' },
      ],
      answer: 1,
      explanation: py`Methods work because functions are descriptors: \`function.__get__\` returns a bound method that passes the instance. An object with only \`__call__\` is returned as-is when looked up on an instance. Add \`__get__\` to bind it.`,
    },
    {
      id: 'advanced-decorators-q7',
      type: 'short',
      prompt: py`Give three reasons to use \`functools.lru_cache\` instead of your own dict-based \`memoize\` decorator in production code.`,
      answer: py`It bounds memory with maxsize (least-recently-used eviction) instead of growing forever; it handles keyword arguments in the key; it provides cache_info() for statistics and cache_clear() for tests and invalidation; it keeps its data structure consistent under threads; it has a typed option; and in CPython it is implemented in C. It is also familiar to every reader.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'html-tag',
      title: 'HTML tag decorator',
      difficulty: 'intermediate',
      prompt: py`Write a **decorator factory** \`tag(name)\`. Decorating a function with \`@tag("b")\` must wrap the string the function returns in \`<b>…</b>\`:

\`\`\`python
@tag("b")
def greet(person):
    """Say hi."""
    return f"hi {person}"

greet("Ada")   # '<b>hi Ada</b>'
\`\`\`

Requirements (the tests check each one):

1. the result is wrapped in \`<name>\` and \`</name>\`;
2. positional **and** keyword arguments are forwarded;
3. the decorated function keeps its \`__name__\` and \`__doc__\`, and has \`__wrapped__\` (use \`functools.wraps\`);
4. stacking works: \`@tag("p")\` above \`@tag("em")\` produces \`<p><em>…</em></p>\`.`,
      files: {
        'main.py': py`import functools


def tag(name):
    def decorator(func):
        # TODO: return a wrapper that wraps func's result in <name>...</name>
        return func
    return decorator


@tag("b")
def greet(person):
    """Say hi."""
    return f"hi {person}"


print(greet("Ada"))
`,
      },
      hints: [
        'You already have the two outer levels. Add the third: a wrapper(*args, **kwargs) inside decorator, and return it.',
        'Build the result with an f-string: f"<{name}>{func(*args, **kwargs)}</{name}>". The wrapper sees name (from tag) and func (from decorator).',
        'Put @functools.wraps(func) on the line above def wrapper, and make decorator return wrapper instead of func.',
      ],
      solution: {
        explanation: py`Three levels, three jobs: \`tag(name)\` captures the tag name, \`decorator(func)\` captures the function, and \`wrapper(*args, **kwargs)\` runs on every call, building the string from both captured values. \`@functools.wraps(func)\` copies the metadata and sets \`__wrapped__\`.

Stacking works because each layer only sees "a function that returns a string": \`@tag("em")\` is applied first (inner), so its tags end up inside; \`@tag("p")\` wraps the result, so its tags are outermost.

In real HTML generation you must also **escape** the text (\`html.escape\`) to avoid injection — see [injection attacks](lesson:injection-attacks).`,
        files: {
          'main.py': py`import functools


def tag(name):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return f"<{name}>{func(*args, **kwargs)}</{name}>"
        return wrapper
    return decorator


@tag("b")
def greet(person):
    """Say hi."""
    return f"hi {person}"


print(greet("Ada"))
`,
        },
      },
      tests: [
        { name: 'wraps the result in <b>', code: py`assert greet("Ada") == "<b>hi Ada</b>"` },
        { name: 'forwards keyword arguments', code: py`assert greet(person="Ben") == "<b>hi Ben</b>"` },
        { name: 'keeps __name__ and __doc__', code: py`assert greet.__name__ == "greet" and greet.__doc__ == "Say hi."` },
        { name: 'has __wrapped__ (uses functools.wraps)', code: py`assert hasattr(greet, "__wrapped__"), 'Use @functools.wraps(func) on the wrapper'
assert greet.__wrapped__("Cy") == "hi Cy"` },
        {
          name: 'stacks in the right order',
          code: py`@tag("p")
@tag("em")
def note():
    return "careful"

assert note() == "<p><em>careful</em></p>"`,
        },
      ],
    },
    {
      id: 'exporter-registry',
      title: 'Plugin registry with a class decorator',
      difficulty: 'advanced',
      prompt: py`An app can export reports in several formats. Each exporter is a class registered with a **class decorator factory** \`exporter(fmt)\`:

1. \`@exporter("csv")\` stores the class in the module-level dict \`EXPORTERS\` under \`"csv"\`, sets a class attribute \`format = "csv"\` on it, and **returns the class itself**;
2. registering a second class for a format that already exists raises \`ValueError\`;
3. \`create_exporter(fmt)\` returns a **new instance** of the registered class, and raises \`ValueError\` (with the format name in the message) for unknown formats.

\`CsvExporter\` and \`JsonExporter\` are already written and decorated.`,
      files: {
        'main.py': py`import json

EXPORTERS = {}


def exporter(fmt):
    def register(cls):
        # TODO: reject duplicates, store cls in EXPORTERS, set cls.format
        return cls
    return register


def create_exporter(fmt):
    # TODO: return a new instance of the registered class (ValueError if unknown)
    return None


@exporter("csv")
class CsvExporter:
    def export(self, rows):
        return "\n".join(",".join(str(v) for v in row) for row in rows)


@exporter("json")
class JsonExporter:
    def export(self, rows):
        return json.dumps(rows)


ROWS = [["tea", 3.5], ["scone", 2.25]]
for fmt in sorted(EXPORTERS):
    print(fmt, "->", create_exporter(fmt).export(ROWS))
`,
      },
      hints: [
        'Inside register: check "if fmt in EXPORTERS", then EXPORTERS[fmt] = cls and cls.format = fmt, then return cls.',
        'raise ValueError(f"duplicate exporter for {fmt!r}") stops the second registration.',
        'create_exporter: if fmt not in EXPORTERS: raise ValueError(f"unknown format: {fmt!r}") — otherwise return EXPORTERS[fmt]() (note the call: a new instance).',
      ],
      solution: {
        explanation: py`The factory captures \`fmt\`; the class decorator \`register\` runs once per decorated class, right after its \`class\` body executes. It validates, records the class, adds an attribute and returns the **same** class, so \`CsvExporter\` is still a normal class you can instantiate, subclass and \`isinstance\`-check.

\`create_exporter\` turns a format string (say, from a command-line flag) into an object without any \`if fmt == "csv"\` chains — adding a new format means writing one decorated class. This is the *registry* pattern. Note the registry only fills when the module defining the classes is **imported**. If you want every subclass of a base class registered automatically, \`__init_subclass__\` does it without a decorator — see [metaclasses](lesson:metaclasses).`,
        files: {
          'main.py': py`import json

EXPORTERS = {}


def exporter(fmt):
    def register(cls):
        if fmt in EXPORTERS:
            raise ValueError(f"duplicate exporter for {fmt!r}")
        EXPORTERS[fmt] = cls
        cls.format = fmt
        return cls
    return register


def create_exporter(fmt):
    if fmt not in EXPORTERS:
        raise ValueError(f"unknown format: {fmt!r}")
    return EXPORTERS[fmt]()


@exporter("csv")
class CsvExporter:
    def export(self, rows):
        return "\n".join(",".join(str(v) for v in row) for row in rows)


@exporter("json")
class JsonExporter:
    def export(self, rows):
        return json.dumps(rows)


ROWS = [["tea", 3.5], ["scone", 2.25]]
for fmt in sorted(EXPORTERS):
    print(fmt, "->", create_exporter(fmt).export(ROWS))
`,
        },
      },
      tests: [
        { name: 'both classes are registered', code: py`assert EXPORTERS == {"csv": CsvExporter, "json": JsonExporter}` },
        { name: 'the decorator sets the format attribute', code: py`assert CsvExporter.format == "csv" and JsonExporter.format == "json"` },
        { name: 'the decorator returns the class itself', code: py`assert isinstance(CsvExporter, type) and CsvExporter.__name__ == "CsvExporter"` },
        {
          name: 'duplicate formats are rejected',
          code: py`with raises(ValueError):
    @exporter("csv")
    class AnotherCsv:
        pass
assert EXPORTERS["csv"] is CsvExporter`,
        },
        { name: 'create_exporter returns a new instance', code: py`a = create_exporter("json")
b = create_exporter("json")
assert isinstance(a, JsonExporter) and a is not b
assert a.export([[1, 2]]) == "[[1, 2]]"` },
        { name: 'unknown formats raise ValueError', code: py`with raises(ValueError, match="xml"):
    create_exporter("xml")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'advanced-decorators-why-wraps',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does functools.wraps do, and what concretely breaks if you leave it out?',
      answer: 'It copies the wrapped function’s __module__, __name__, __qualname__, __doc__, annotations and __dict__ onto the wrapper and sets __wrapped__. Without it, logs and tracebacks say "wrapper", docstrings vanish, inspect.signature shows (*args, **kwargs), tools that inspect signatures misbehave, and pickling the function fails.',
      explanation: py`\`wraps(func)\` is \`partial(update_wrapper, wrapped=func)\`. \`__wrapped__\` lets \`inspect.signature\`, \`inspect.unwrap\` and \`help()\` see through the wrapper. Frameworks that read signatures (CLI generators, dependency injection in web frameworks, pytest fixtures) rely on that.`,
      whyAsked: 'It separates people who have written production decorators from people who have only seen tutorials.',
      mistakes: ['Saying it is purely cosmetic', 'Thinking it changes call behaviour or performance', 'Not knowing about __wrapped__'],
      followUps: ['How do you get the undecorated function in a test?', 'How do you preserve metadata in a class-based decorator?', 'Why does qualname matter for pickling?'],
      modelAnswer: 'functools.wraps is a decorator I put on the inner wrapper. It copies the original function\'s name, qualified name, module, docstring and annotations onto the wrapper, merges its __dict__, and sets __wrapped__ pointing at the original. Without it, every decorated function is called "wrapper" in logs and tracebacks, help shows no docs, and inspect.signature reports *args and **kwargs, which breaks frameworks that read signatures. Pickling breaks too, because pickle finds functions by qualified name, which affects multiprocessing. With it, tests can also reach the original through __wrapped__.',
    },
    {
      id: 'advanced-decorators-stack-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`def bold(func):
    return lambda: "<b>" + func() + "</b>"

def italic(func):
    return lambda: "<i>" + func() + "</i>"

@bold
@italic
def title():
    return "Menu"

print(title())` },
      options: ['<i><b>Menu</b></i>', '<b><i>Menu</i></b>', '<b>Menu</b><i>Menu</i>', 'Menu'],
      correctOption: 1,
      answer: '<b><i>Menu</i></b> — italic is applied first (innermost), bold wraps it, so the call enters bold first and its tags end up outermost.',
      explanation: py`\`title = bold(italic(title))\`. The innermost layer produces \`<i>Menu</i>\` and bold surrounds that. The code-level order matches the output order: top decorator = outer tags.`,
      whyAsked: 'Quick check of the stacking rule, which matters for auth, caching and logging order in real services.',
      mistakes: ['Thinking the top decorator is applied first', 'Mixing up application order with call order'],
      followUps: ['Where would you place @cache relative to @require_login?', 'In what order are the decorator expressions themselves evaluated?'],
      modelAnswer: 'It prints <b><i>Menu</i></b>. Stacked decorators are applied bottom-up, so this is title = bold(italic(title)): italic wraps the original first and bold wraps that. A call enters the outermost wrapper — bold — first, which calls italic, which calls the original; the strings come back out with italic\'s tags inside bold\'s. The handy rule is: the top decorator is the outermost layer, and that\'s why authentication checks belong above caches.',
    },
    {
      id: 'advanced-decorators-three-levels',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Why does a decorator that takes arguments, like @retry(times=3), need three nested functions? Walk through what happens at definition time and at call time.',
      answer: 'Because @retry(times=3) is an expression that is called first: retry(times=3) must return the actual decorator, which receives the function and returns the wrapper, which receives each call’s arguments. Levels: settings → function → call.',
      explanation: py`At definition time: \`retry(times=3)\` runs and returns \`decorator\` (closing over \`times\`); then \`decorator(fetch)\` runs and returns \`wrapper\` (closing over \`func\` and \`times\`); the name is bound to \`wrapper\`. At call time only \`wrapper\` runs. A class with \`__init__(self, times)\` and \`__call__(self, func)\` is an equivalent two-method alternative.`,
      code: { lang: 'python', code: py`import functools

def retry(times):                       # definition time, step 1
    def decorator(func):                # definition time, step 2
        @functools.wraps(func)
        def wrapper(*args, **kwargs):   # every call
            for attempt in range(times):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
        return wrapper
    return decorator

# fetch = retry(times=3)(fetch)` },
      whyAsked: 'Decorator factories appear in every framework (routes, permissions, retries); explaining the levels shows real understanding of closures.',
      mistakes: ['Saying Python "passes the arguments to the decorator" without the factory call', 'Being unable to say when each level runs'],
      followUps: ['How would you support both @retry and @retry(times=5)?', 'How would you write the same thing as a class?'],
      modelAnswer: 'Because the thing after the @ is evaluated as an expression first. retry(times=3) is a normal call that returns the real decorator, a function that closes over times. Python then calls that decorator with the function being defined, and it returns the wrapper, which closes over both func and times. The name is bound to the wrapper. So at definition time the outer two levels run once each, and at call time only the wrapper runs. I think of it as settings, then function, then call.',
    },
    {
      id: 'advanced-decorators-count-calls',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement a class-based decorator `CountCalls`: each decorated function gets a `count` attribute (calls so far) and a `reset()` method, return values pass through, and `__name__`/`__doc__` are preserved.',
      answer: 'Store func and count = 0 in __init__ and call functools.update_wrapper(self, func); in __call__ increment count and return self.func(*args, **kwargs); reset() sets count back to 0.',
      explanation: py`Using a class makes the state public and gives room for methods like \`reset()\`. \`update_wrapper(self, func)\` is \`wraps\` for objects. To use it on methods too, add \`__get__\` returning \`types.MethodType(self, instance)\`.`,
      starter: { files: { 'main.py': py`import functools


class CountCalls:
    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
        # TODO: count the call
        return self.func(*args, **kwargs)

    # TODO: reset()


@CountCalls
def scan(barcode):
    """Look up a product by barcode."""
    return f"item {barcode}"


print(scan("123"))
` } },
      tests: [
        { name: 'counts calls', code: py`scan("1"); scan("2")
assert scan.count == 3, f"count is {getattr(scan, 'count', None)}"` },
        { name: 'returns the original result', code: py`assert scan("42") == "item 42"` },
        { name: 'reset() sets the count to 0', code: py`scan.reset()
assert scan.count == 0` },
        { name: 'keeps __name__ and __doc__', code: py`assert scan.__name__ == "scan" and scan.__doc__ == "Look up a product by barcode."` },
        {
          name: 'separate counters per function',
          code: py`@CountCalls
def other():
    return 1

other()
assert other.count == 1 and other.__name__ == "other"`,
        },
      ],
      solution: { files: { 'main.py': py`import functools


class CountCalls:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

    def reset(self):
        self.count = 0


@CountCalls
def scan(barcode):
    """Look up a product by barcode."""
    return f"item {barcode}"


print(scan("123"))
` } },
      hints: ['State lives in instance attributes: self.count = 0 in __init__.', 'functools.update_wrapper(self, func) copies __name__ and __doc__ onto the instance.'],
      whyAsked: 'Tests knowledge of __call__, update_wrapper and when a class beats a closure for decorator state.',
      mistakes: ['Storing count as a class attribute (shared by every decorated function)', 'Forgetting update_wrapper', 'Not returning the result'],
      followUps: ['What happens if you decorate a method with it?', 'How would you make it thread-safe?'],
      modelAnswer: 'I would make CountCalls store the function and a count of zero in __init__, and call functools.update_wrapper(self, func) so the instance carries the original name and docstring. __call__ increments self.count and returns self.func(*args, **kwargs), and reset sets the count back to zero. Because the count is an instance attribute, every decorated function has its own counter. If I needed it on methods I would add __get__ returning types.MethodType(self, instance), and for threads I would guard the increment with a lock.',
    },
    {
      id: 'advanced-decorators-method-binding',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'After switching a function-based @timed decorator to a class-based `Timed` (with `__init__` and `__call__`), every decorated method fails with `TypeError: Report.render() missing 1 required positional argument: \'fmt\'`. Plain functions still work. Explain and fix.',
      answer: 'Functions become bound methods via their __get__ (descriptor protocol); a Timed instance has no __get__, so report.render returns the Timed object itself and the instance is never passed — the first real argument lands in self. Add __get__ returning types.MethodType(self, instance) (or go back to a function-based decorator).',
      explanation: py`Attribute lookup on an instance finds \`render\` in the class \`__dict__\`. If that object defines \`__get__\`, Python calls it with the instance — that's how functions bind. Without \`__get__\` the object is returned unchanged. So \`report.render("pdf")\` calls \`Timed.__call__("pdf")\`, which calls the original with \`self="pdf"\` and no \`fmt\`.`,
      code: { lang: 'python', code: py`import functools
import types


class Timed:
    def __init__(self, func):
        functools.update_wrapper(self, func)
        self.func = func

    def __call__(self, *args, **kwargs):
        return self.func(*args, **kwargs)

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return types.MethodType(self, instance)   # the fix


class Report:
    @Timed
    def render(self, fmt):
        return f"report as {fmt}"


print(Report().render("pdf"))` },
      whyAsked: 'Connects decorators to the descriptor protocol — a classic senior-level question.',
      mistakes: ['Saying class-based decorators cannot be used on methods', 'Patching around it by passing self manually at call sites'],
      followUps: ['What does instance is None mean inside __get__?', 'Why do plain function wrappers not have this problem?', 'How does staticmethod use the same mechanism?'],
      modelAnswer: 'Methods work because functions are descriptors: when you look up render on an instance, Python finds the function in the class and calls its __get__, which returns a bound method with the instance filled in as self. My Timed instance only has __call__, no __get__, so the lookup returns the Timed object itself and the instance is never passed. The call then forwards "pdf" as self and fmt is missing. The fix is to add __get__ that returns types.MethodType(self, instance) when accessed on an instance, and self when accessed on the class — or simply use a function-based decorator, which binds naturally.',
    },
    {
      id: 'advanced-decorators-cache-methods',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A long-running service puts `@functools.lru_cache(maxsize=None)` on a method `PriceService.quote(self, sku)`. Memory grows steadily, and PriceService objects that should be gone are never garbage-collected. What is happening and what would you do instead?',
      answer: 'The cache belongs to the function (shared by all instances) and its keys include self, so it holds a strong reference to every instance ever used; with maxsize=None it never evicts. Use functools.cached_property for per-instance values, a per-instance cache (e.g. a dict or an lru_cache created in __init__), or a module-level cached function keyed by plain values — and always bound the size.',
      explanation: py`\`lru_cache\` builds keys from all arguments, including \`self\`. While a key is in the cache, \`self\` can't be freed. Unbounded \`maxsize=None\` (or \`functools.cache\`) means nothing is ever evicted. Options: \`self._quote = functools.lru_cache(maxsize=1024)(self._quote_uncached)\` in \`__init__\` (the cache dies with the instance), \`cached_property\` for zero-argument values, or a module-level function \`quote(sku)\` if the result doesn't depend on the instance. See [memory management](lesson:memory-management).`,
      whyAsked: 'A real production memory leak that tests understanding of how caching decorators build keys and keep references.',
      mistakes: ['Blaming the garbage collector', 'Suggesting gc.collect() as a fix', 'Not noticing that the cache is shared across instances'],
      followUps: ['How would you measure the leak? (tracemalloc, cache_info().currsize)', 'What does cached_property store, and where?', 'How does weakref help here?'],
      modelAnswer: 'lru_cache stores results in a dict on the decorated function, which is shared by all instances, and the key includes every argument — including self. So each PriceService that ever called quote stays referenced from the cache, and with maxsize=None nothing is ever evicted; that\'s a leak. I would first check cache_info().currsize to confirm. Then, depending on the case, I\'d use a per-instance cache created in __init__ so it dies with the object, cached_property for a value without arguments, or a module-level cached function keyed only by sku if the price doesn\'t depend on the instance. Either way I would set a maxsize.',
    },
  ],

  takeaways: [
    'Put @functools.wraps(func) on every wrapper: it keeps __name__, __doc__, annotations and adds __wrapped__ (class-based: functools.update_wrapper(self, func)).',
    'A decorator with arguments is a factory with three levels: settings → decorator(func) → wrapper(*args, **kwargs).',
    'Stacked decorators: expressions evaluated top-down, applied bottom-up, and calls enter the top (outermost) wrapper first.',
    'Function decorators work on methods because functions are descriptors; class-based decorators need __get__ to bind self.',
    'Class decorators receive the finished class and usually return it — perfect for registries and small additions.',
    'Prefer functools.lru_cache/cache to hand-rolled memoization; cache only pure functions with hashable arguments, and beware caching methods.',
  ],
}
