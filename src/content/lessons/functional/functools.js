// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHIPPING = py`from datetime import date
from functools import cached_property, lru_cache, partial, singledispatch, wraps

calls = []


def logged(func):
    @wraps(func)                       # copy func's name, docstring, etc.
    def wrapper(*args, **kwargs):
        calls.append(func.__name__)
        return func(*args, **kwargs)
    return wrapper


@lru_cache(maxsize=32)
def zone_distance(origin, destination):
    """Pretend this is slow: a database query or an API call."""
    calls.append(f"lookup {origin}->{destination}")
    return abs(len(origin) - len(destination)) * 100 + 50


@logged
def shipping_cost(weight_kg, distance_km, rate_per_kg_km):
    """Cost in pence."""
    return round(weight_kg * distance_km * rate_per_kg_km)


standard = partial(shipping_cost, rate_per_kg_km=0.5)
express = partial(shipping_cost, rate_per_kg_km=1.25)


class Parcel:
    def __init__(self, label, weight_kg, origin, destination):
        self.label = label
        self.weight_kg = weight_kg
        self.origin = origin
        self.destination = destination

    @cached_property
    def distance_km(self):
        return zone_distance(self.origin, self.destination)

    def quote(self, service=standard):
        return service(self.weight_kg, self.distance_km)


@singledispatch
def fmt(value):
    return str(value)


@fmt.register
def _(value: int):
    return f"£{value / 100:.2f}"       # pence -> pounds


@fmt.register
def _(value: date):
    return value.strftime("%d %b")


@fmt.register(list)
def _(value):
    return ", ".join(fmt(item) for item in value)


parcels = [
    Parcel("books", 2.0, "London", "Leeds"),
    Parcel("lamp", 1.2, "London", "Leeds"),
    Parcel("tent", 4.0, "Bristol", "Edinburgh"),
]
for parcel in parcels:
    print(f"{parcel.label:<6} standard {fmt(parcel.quote())}  express {fmt(parcel.quote(express))}")

print("formatted:", fmt([date(2025, 3, 14), 1250]), "|", fmt(True))
print(shipping_cost.__name__, "-", shipping_cost.__doc__)
print("standard =", standard.func.__name__, standard.keywords)
print(zone_distance.cache_info())
print("shipping_cost ran", calls.count("shipping_cost"), "times; lookups:", [c for c in calls if c.startswith("lookup")])
`

export default {
  id: 'functools',
  title: 'functools: partial, lru_cache & singledispatch',
  summary: 'The standard library’s toolbox for working with functions: pre-fill arguments with partial, remember results with lru_cache/cache and cached_property, pick an implementation by type with singledispatch — plus reduce, total_ordering and wraps.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['decorators', 'closures', 'map-filter-reduce', 'functional-concepts'],
  related: ['advanced-decorators', 'operator-overloading', 'decorators', 'closures', 'map-filter-reduce', 'functional-concepts', 'recursion', 'properties-and-encapsulation', 'descriptors', 'optimization-techniques', 'polymorphism-and-duck-typing', 'special-methods', 'lambdas-and-higher-order', 'profiling'],
  tags: ['functools', 'partial', 'partialmethod', 'Placeholder', 'lru_cache', 'cache', 'cache_info', 'cache_clear', 'memoization', 'cached_property', 'singledispatch', 'singledispatchmethod', 'generic function', 'reduce', 'total_ordering', 'wraps', 'cmp_to_key', 'hashable arguments'],
  apis: [
    { name: 'functools.partial(func, /, *args, **keywords)', summary: 'A new callable that calls func with some arguments already filled in; .func, .args, .keywords show them.' },
    { name: '@functools.lru_cache(maxsize=128, typed=False)', summary: 'Memoizes a function: results are stored by argument values (which must be hashable), keeping at most maxsize, evicting the least recently used.' },
    { name: '@functools.cache (3.9)', summary: 'Same as lru_cache(maxsize=None): an unbounded cache that never evicts.' },
    { name: 'f.cache_info() / f.cache_clear()', summary: 'CacheInfo(hits, misses, maxsize, currsize) statistics, and emptying the cache.' },
    { name: '@functools.cached_property (3.8)', summary: 'Computes an attribute once per instance and stores it in the instance __dict__; del obj.attr forces a recompute.' },
    { name: '@functools.singledispatch', summary: 'Turns a function into a generic function that picks an implementation by the type of its first argument; add implementations with .register.' },
    { name: '@functools.singledispatchmethod (3.8)', summary: 'singledispatch for methods: dispatches on the first argument after self/cls.' },
    { name: 'functools.reduce(function, iterable[, initial])', summary: 'Left fold of an iterable into one value — see map, filter & reduce.' },
    { name: '@functools.total_ordering', summary: 'Given __eq__ and one of __lt__/__le__/__gt__/__ge__, fills in the other comparison methods.' },
    { name: '@functools.wraps(wrapped)', summary: 'Decorator for wrapper functions: copies __name__, __doc__, __qualname__, __module__, __dict__ and sets __wrapped__.' },
    { name: 'functools.cmp_to_key(func)', summary: 'Converts an old-style comparison function (returns <0, 0, >0) into a key function.' },
  ],
  docs: [
    { label: 'functools — higher-order functions and operations on callable objects', url: 'https://docs.python.org/3/library/functools.html' },
    { label: 'functools.lru_cache', url: 'https://docs.python.org/3/library/functools.html#functools.lru_cache' },
    { label: 'functools.singledispatch', url: 'https://docs.python.org/3/library/functools.html#functools.singledispatch' },
    { label: 'PEP 443 — Single-dispatch generic functions', url: 'https://peps.python.org/pep-0443/' },
    { label: 'Glossary — hashable', url: 'https://docs.python.org/3/glossary.html#term-hashable' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`\`functools\` is a standard-library module of tools that **take functions and give back better functions**. You've met two already: \`reduce\` in [map, filter & reduce](lesson:map-filter-reduce) and \`wraps\` in [decorators with arguments](lesson:advanced-decorators). This lesson covers the rest of the everyday kit:`,
    py`- **\`partial\`** — make a new function from an old one with some arguments already filled in.
- **\`lru_cache\` / \`cache\`** — *memoization*: remember what a function returned for given arguments, so asking again is instant.
- **\`cached_property\`** — the same idea for an attribute computed once per object.
- **\`singledispatch\`** — one function name, several implementations, picked by the **type** of the first argument.
- **\`total_ordering\`**, **\`wraps\`**, **\`cmp_to_key\`** — small helpers that save boilerplate.`,
    py`All of them are built on the idea from [functional thinking](lesson:functional-concepts) that functions are values: you can pass them in, wrap them and get new functions out.`,
  ],
  why: [
    py`**Speed without rewriting.** Many slow programs recompute the same thing again and again — the same database lookup, the same recursive sub-problem. One decorator line, \`@cache\`, can turn exponential work into linear work, as the measurement below shows.`,
    py`**Fewer one-off lambdas and wrapper functions.** \`partial(send, retries=3)\` says exactly what it is and can be inspected and pickled; a lambda can't.`,
    py`**Extensible code without if/elif chains.** \`singledispatch\` lets you — or another module — add support for a new type by registering a function, instead of editing a growing \`if isinstance(...)\` ladder.`,
  ],
  eli15: [
    py`**partial** is like a coffee machine with a "my usual" button: you set "large, oat milk" once, and from then on one press does it.`,
    py`**lru_cache** is a notebook next to a slow calculator. Before working something out, you check the notebook; if the answer's already written there, you just read it. The notebook has limited pages, so when it's full you tear out the page you haven't looked at for the longest time — that's "least recently used".`,
    py`**singledispatch** is a post-room sorter: one slot for letters, one for parcels, one for magazines. You drop anything in the same machine, and it routes it to the right handler based on *what kind of thing* it is.`,
  ],
  analogy: {
    title: 'A busy café counter',
    body: [
      py`A café has a "regulars" board with pre-set orders (partial), a whiteboard of answers to questions customers keep asking — "Is the oat milk vegan?" — so staff don't have to check the supplier every time (lru_cache), and a counter where every kind of order (coffee, sandwich, cake) goes to the right station automatically (singledispatch).`,
      py`The whiteboard has rules: it only works for questions that always have the same answer (pure functions), and the question has to be written down exactly (hashable arguments). If the supplier changes the milk, someone must wipe the board (cache_clear).`,
    ],
    mapping: [
      ['"my usual" pre-set order', 'partial(order, size="large", milk="oat")'],
      ['the whiteboard of answers', 'lru_cache: results stored by arguments'],
      ['reading an answer from the board', 'a cache hit'],
      ['checking with the supplier', 'a cache miss: the function actually runs'],
      ['wiping the board when facts change', 'cache_clear()'],
      ['limited board space, erase the stalest answer', 'maxsize with least-recently-used eviction'],
      ['orders routed to coffee / food / cake stations', 'singledispatch picking an implementation by type'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'partial pre-fills; cache remembers',
    props: {
      code: py`from functools import cache, partial

def power(base, exponent):
    return base ** exponent

square = partial(power, exponent=2)
cube = partial(power, exponent=3)
print(square(5), cube(2))

@cache
def slow_double(n):
    print("computing", n)
    return n * 2

print(slow_double(4))
print(slow_double(4))
print(slow_double.cache_info())
`,
      notes: {
        6: '`partial` returns a new callable object. Nothing is computed yet — it just remembers `power` and `exponent=2`.',
        8: '`square(5)` calls `power(5, exponent=2)`.',
        15: 'First call with 4: a **miss**. The body runs, prints "computing 4", and the result is stored under the key `(4,)`.',
        16: 'Second call with 4: a **hit**. The stored result is returned; the body never runs, so nothing is printed.',
        17: '`cache_info()` reports 1 hit, 1 miss, and 1 stored result.',
      },
    },
    alt: 'A step-by-step trace. square and cube are partial objects wrapping power with exponent 2 and 3; printing square(5) and cube(2) shows 25 and 8. slow_double(4) runs its body once, printing computing 4 and returning 8. The second slow_double(4) returns 8 without running the body. cache_info shows hits=1, misses=1, maxsize=None, currsize=1.',
    caption: py`Watch the second \`slow_double(4)\`: no new frame, no "computing" line. The cache answered.`,
  },
  syntax: [
    py`#### partial — pre-fill arguments`,
    { code: py`from functools import partial

def send(message, channel, retries=0):
    return f"[{channel}] {message} (retries={retries})"

alert = partial(send, channel="#alerts", retries=3)   # keyword pre-filled
print(alert("disk full"))                             # [#alerts] disk full (retries=3)
print(alert("cpu hot", retries=1))                    # call-time keywords win

to_int = partial(int, base=2)                          # works with built-ins too
print(to_int("1011"))                                  # 11
print(alert.func.__name__, alert.args, alert.keywords)`, lang: 'python', title: 'partial(func, *args, **kwargs)' },
    py`Positional arguments given to \`partial\` fill from the **left**: \`partial(pow, 2)\` is \`lambda x: pow(2, x)\`. In **3.14+**, \`functools.Placeholder\` can leave a positional slot open: \`partial(str.replace, Placeholder, " ", "-")\` replaces spaces in whatever string you pass. For methods inside a class body, use \`partialmethod\`.`,
    py`#### lru_cache and cache — memoization`,
    { code: py`from functools import cache, lru_cache

@lru_cache(maxsize=256)          # keep up to 256 results, evict least recently used
def exchange_rate(currency):
    print("fetching", currency)  # pretend: a slow API call
    return {"EUR": 1.17, "USD": 1.27}.get(currency, 1.0)

exchange_rate("EUR"); exchange_rate("EUR"); exchange_rate("USD")
print(exchange_rate.cache_info())   # CacheInfo(hits=1, misses=2, maxsize=256, currsize=2)
exchange_rate.cache_clear()          # e.g. when rates change

@cache                           # 3.9+: unbounded, same as lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(80))                   # instant: each fib(k) is computed once`, lang: 'python', title: '@lru_cache and @cache' },
    py`The rules that matter:`,
    py`- **Arguments must be hashable** — numbers, strings, tuples of those, frozen dataclasses. A list or dict argument raises \`TypeError: unhashable type: 'list'\`.
- **The function should be pure** (see [functional thinking](lesson:functional-concepts)): if the answer can change for the same arguments — time, a database, a file — the cache will serve stale results.
- **Results are shared.** Every caller gets the *same* object back; if it's a list or dict and someone mutates it, the cache is corrupted. Return immutable values (tuples, frozensets).
- \`f(1, 2)\` and \`f(1, b=2)\` are different argument patterns and may be cached separately. \`typed=True\` also separates \`f(1)\` from \`f(1.0)\`.`,
    py`#### cached_property — compute an attribute once per object`,
    { code: py`from functools import cached_property

class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property
    def total(self):
        print("summing...")
        return sum(self.rows)

report = Report([120, 80, 45])
print(report.total, report.total)   # "summing..." appears once
report.rows.append(5)
print(report.total)                 # still 245 — the cache doesn't know rows changed
del report.total                    # forget the cached value
print(report.total)                 # summing... 250`, lang: 'python', title: '@cached_property (3.8+)' },
    py`The first access runs the method and stores the result in the instance's \`__dict__\` under the same name; later accesses find it there and never call the method again. That needs a \`__dict__\`, so it fails on classes with \`__slots__\` (see [records & slots](lesson:records-and-slots)). Use it for values that don't change after they're computed.`,
    py`#### singledispatch — choose an implementation by type`,
    { code: py`from datetime import date
from decimal import Decimal
from functools import singledispatch

@singledispatch
def describe(value):                 # the fallback for any other type
    return f"something: {value!r}"

@describe.register
def _(value: int):                   # dispatch type taken from the annotation
    return f"an integer: {value}"

@describe.register
def _(value: date):
    return f"a date: {value:%d %B %Y}"

@describe.register(Decimal)          # or pass the type explicitly
def _(value):
    return f"money: {value:.2f}"

@describe.register
def _(value: list | tuple):          # union types: 3.11+
    return f"a sequence of {len(value)}"

for item in (42, date(2025, 3, 14), Decimal("9.5"), [1, 2], "hi", True):
    print(describe(item))`, lang: 'python', title: '@singledispatch' },
    py`Dispatch follows the class hierarchy (the MRO): \`True\` is a \`bool\`, and \`bool\` is a subclass of \`int\`, so it uses the \`int\` version unless you register \`bool\` too. Only the **first** argument's type counts. For methods, use \`@singledispatchmethod\` (3.8+), which dispatches on the first argument after \`self\`.`,
    py`#### reduce, total_ordering, wraps and cmp_to_key`,
    { code: py`from functools import cmp_to_key, reduce, total_ordering, wraps
from operator import mul

print(reduce(mul, [2, 3, 4], 1))     # 24 — see the map/filter/reduce lesson

@total_ordering
class Grade:
    ORDER = "FEDCBA"

    def __init__(self, letter):
        self.letter = letter

    def __eq__(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.letter == other.letter

    def __lt__(self, other):         # define == and ONE ordering method...
        if not isinstance(other, Grade):
            return NotImplemented
        return self.ORDER.index(self.letter) < self.ORDER.index(other.letter)

print(Grade("B") >= Grade("C"))     # ...total_ordering supplies >=, >, <=

def logged(func):
    @wraps(func)                     # keeps __name__, __doc__, sets __wrapped__
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper

def by_length_then_alpha(a, b):      # old-style comparison: negative, 0, positive
    return (len(a) - len(b)) or ((a > b) - (a < b))

print(sorted(["pear", "fig", "apple", "kiwi"], key=cmp_to_key(by_length_then_alpha)))`, lang: 'python', title: 'the smaller helpers' },
    py`\`total_ordering\` and comparison methods are covered in depth in [operator overloading](lesson:operator-overloading); \`wraps\` and why decorators need it in [decorators with arguments](lesson:advanced-decorators).`,
    { callout: 'version', title: 'Which Python?', text: py`\`lru_cache\` (3.2), \`singledispatch\` (3.4), \`cached_property\` and \`singledispatchmethod\` (**3.8**), \`cache\` and \`cache_parameters()\` (**3.9**), union types in \`register\` (**3.11**), \`Placeholder\` for \`partial\` (**3.14**).` },
  ],
  walkthrough: {
    title: 'Reading the shipping quote service',
    lang: 'python',
    code: SHIPPING,
    intro: py`The playground is a tiny shipping-quote service that uses five \`functools\` tools at once. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [7, 12], text: py`A logging decorator. \`@wraps(func)\` copies the wrapped function's name and docstring onto \`wrapper\`, so \`shipping_cost.__name__\` is still \`"shipping_cost"\` (line 76 proves it).` },
      { lines: [15, 19], text: py`\`zone_distance\` stands in for a slow lookup. \`@lru_cache(maxsize=32)\` stores each answer keyed by \`(origin, destination)\`; both are strings, so they're hashable. It records each *real* lookup in \`calls\` so you can see which calls hit the cache.` },
      { lines: [22, 25], text: py`\`shipping_cost\` is wrapped by \`logged\`, so every call is recorded too. It's pure: the price depends only on the three arguments.` },
      { lines: [28, 29], text: py`Two **partial** objects: the same function with the rate pre-filled. \`standard(2.0, 150)\` is \`shipping_cost(2.0, 150, rate_per_kg_km=0.5)\`.` },
      { lines: [39, 41], text: py`\`@cached_property\`: the first time \`parcel.distance_km\` is read, it calls \`zone_distance\` and stores the result on that parcel. The second quote (express) reuses it without even reaching the LRU cache.` },
      { lines: [43, 44], text: py`A partial object is just a callable, so it works as a default argument and can be passed around like any function.` },
      { lines: [47, 64], text: py`\`fmt\` is a **generic function**. The base version handles any type; \`register\` adds versions for \`int\` (pence → pounds), \`date\` and \`list\` (which formats each item recursively with \`fmt\`).` },
      { lines: [72, 73], text: py`Each parcel is quoted twice. "lamp" goes London → Leeds like "books", so its distance comes from the **LRU cache** (a hit) — but it still needs its own \`cached_property\` value, because that cache is per object.` },
      { lines: [75, 75], text: py`\`fmt(True)\` prints \`£0.01\`: \`bool\` is a subclass of \`int\`, so the \`int\` implementation is chosen. One of the experiments fixes that.` },
      { lines: [77, 79], text: py`Introspection: a partial exposes \`.func\` and \`.keywords\`; \`cache_info()\` shows 1 hit and 2 misses — only two real lookups for three parcels.` },
    ],
  },
  playground: {
    title: 'Shipping quotes with functools',
    objective: 'Run it, read the cache statistics, then add parcels, partials and dispatch rules and predict how the statistics change.',
    files: { 'main.py': SHIPPING },
    expected: py`\`\`\`text
books  standard £1.50  express £3.75
lamp   standard £0.90  express £2.25
tent   standard £5.00  express £12.50
formatted: 14 Mar, £12.50 | £0.01
shipping_cost - Cost in pence.
standard = shipping_cost {'rate_per_kg_km': 0.5}
CacheInfo(hits=1, misses=2, maxsize=32, currsize=2)
shipping_cost ran 6 times; lookups: ['lookup London->Leeds', 'lookup Bristol->Edinburgh']
\`\`\``,
    experiments: [
      {
        id: 'fourth-parcel',
        task: py`Add a fourth parcel, \`Parcel("mug", 0.5, "London", "Leeds")\`, to the list. Before running, predict the new \`hits\` and \`misses\`.`,
        hint: py`London → Leeds has already been looked up once.`,
        tests: [
          { name: 'there are four parcels', code: py`assert len(parcels) == 4` },
          { name: 'the new parcel was a cache hit', code: py`info = zone_distance.cache_info()
assert (info.hits, info.misses) == (2, 2)` },
        ],
        explain: py`Same arguments, same cache key \`("London", "Leeds")\` → a hit. The number of real lookups depends on the number of *distinct* routes, not the number of parcels. That's exactly why caching pays off for repeated lookups.`,
      },
      {
        id: 'next-day',
        task: py`Create \`next_day = partial(shipping_cost, rate_per_kg_km=2.0)\` and print the books parcel's next-day quote with \`fmt(parcels[0].quote(next_day))\`.`,
        tests: [
          { name: 'next_day is a partial with rate 2.0', code: py`from functools import partial
assert isinstance(ns.get('next_day'), partial), 'next_day = partial(shipping_cost, rate_per_kg_km=2.0)'
assert next_day.keywords == {"rate_per_kg_km": 2.0}` },
          { name: 'the books quote is £6.00', code: py`assert "£6.00" in output` },
        ],
        explain: py`A new service level is one line — no new function, no lambda. Because \`quote\` accepts any callable, partials, plain functions and lambdas are all interchangeable there.`,
      },
      {
        id: 'register-bool',
        task: py`\`fmt(True)\` prints \`£0.01\` because \`bool\` is a subclass of \`int\`. Register a \`bool\` implementation so \`fmt(True)\` is \`"yes"\` and \`fmt(False)\` is \`"no"\`.`,
        hint: py`Add \`@fmt.register\` above \`def _(value: bool): return "yes" if value else "no"\`. Order of registration doesn't matter — dispatch picks the most specific class.`,
        tests: [
          { name: 'booleans are yes/no', code: py`assert fmt(True) == "yes" and fmt(False) == "no"` },
          { name: 'ints still format as money', code: py`assert fmt(250) == "£2.50"` },
        ],
        explain: py`\`singledispatch\` walks the argument's MRO (\`bool → int → object\`) and uses the first registered class it finds. Registering \`bool\` puts a more specific match in front of \`int\`.`,
      },
      {
        id: 'clear-cache',
        task: py`At the very end, call \`zone_distance.cache_clear()\` and print \`zone_distance.cache_info()\` again. What do the numbers reset to?`,
        tests: [
          { name: 'the cache is empty', code: py`assert zone_distance.cache_info().currsize == 0` },
          { name: 'printed the cleared statistics', code: py`assert "CacheInfo(hits=0, misses=0, maxsize=32, currsize=0)" in output` },
        ],
        explain: py`\`cache_clear()\` throws away every stored result *and* resets the statistics. In a real service you'd call it when the underlying data changes (new rate tables), or use a cache with an expiry time instead. Note that \`cached_property\` values already stored on parcels are **not** affected — they live on the objects.`,
      },
    ],
  },
  animation: {
    type: 'performance',
    title: 'Memoization measured live: fib(n) with and without @lru_cache',
    props: { demo: 'memoization' },
    alt: 'A live measurement comparing recursive Fibonacci with and without functools.lru_cache for several values of n: the plain version makes a rapidly growing number of calls while the cached version makes roughly n calls, with the timings measured in the browser.',
    caption: py`Plain recursion recomputes the same \`fib(k)\` again and again, so the call count explodes. With \`@lru_cache\` each \`fib(k)\` runs once and every repeat is a cache hit. The numbers are measured by real Python in your browser — run it and compare the call counts. The trade: memory for the stored results in exchange for time.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A cache is just a dictionary. The *key* is built from the arguments, the *value* is the result. "Hit" means the key was found; "miss" means the function had to run and the result was added.`,
      { code: py`def memoize(func):           # simplified: positional args only, no size limit
    results = {}
    def wrapper(*args):
        if args not in results:          # miss
            results[args] = func(*args)
        return results[args]             # hit (or the fresh result)
    return wrapper

@memoize
def slow_square(n):
    print("computing", n)
    return n * n

print(slow_square(9), slow_square(9))`, lang: 'python', title: 'a simplified memoize decorator' },
      py`That's why arguments must be **hashable**: they become dictionary keys. The real \`lru_cache\` adds keyword arguments, a size limit, statistics and thread-safety on top of the same idea.`,
    ],
    technical: [
      py`**LRU eviction.** With \`maxsize=N\`, \`lru_cache\` keeps the N most recently *used* results. Every hit moves an entry to the "most recent" end; when a miss would exceed N, the entry at the "least recent" end is dropped. Both operations are O(1) (the CPython implementation combines a dict with a doubly linked list). \`maxsize=None\` (or \`@cache\`) skips the bookkeeping and never evicts.`,
      py`**What the key contains.** The positional arguments, the keyword arguments *as passed* (so \`f(1, b=2)\` and \`f(a=1, b=2)\` are separate entries), and with \`typed=True\` the argument types. The decorated function also gets \`cache_info()\`, \`cache_clear()\`, \`cache_parameters()\` (3.9+) and \`__wrapped__\` (the original, uncached function).`,
      py`**\`partial\` objects** store \`func\`, \`args\` and \`keywords\` and merge them on each call: pre-filled positionals come first, call-time keywords override pre-filled ones. Because they're plain objects (not closures), they have a useful \`repr\`, can be compared and are picklable when the wrapped function is.`,
      py`**\`cached_property\` is a descriptor** without \`__set__\` (a *non-data* descriptor — see [descriptors](lesson:descriptors)). On first access it computes the value and writes it into \`instance.__dict__\`. Instance attributes beat non-data descriptors in attribute lookup, so later reads never reach the descriptor at all — the cached value is an ordinary attribute.`,
      py`**\`singledispatch\`** keeps a \`registry\` dict from class to implementation. On each call it looks up \`type(first_arg)\`, finds the best match along that class's MRO (also honouring abstract base classes registered with \`abc\`), and caches the decision per type. \`describe.dispatch(bool)\` shows which implementation a type would get.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, \`lru_cache\`, \`partial\` and \`reduce\` are implemented in C, with pure-Python fallbacks in \`functools.py\` used by other implementations. Since 3.12, \`cached_property\` no longer holds a lock, so two threads can compute the value at the same time on first access; \`lru_cache\` keeps its own data structures consistent across threads, but the wrapped function may still run more than once for the same key under concurrent calls.` },
    ],
    production: [
      py`**Bound your caches.** \`@cache\` on a function whose arguments are unbounded (user ids, URLs, timestamps) is a memory leak with good intentions. Use \`lru_cache(maxsize=...)\` and watch \`cache_info()\` in metrics; a hit rate near zero means the cache only costs memory.`,
      py`**Caching methods.** \`@lru_cache\` on a method includes \`self\` in the key, which keeps every instance alive as long as the cache does and shares one cache across all instances. Prefer \`cached_property\`, a per-instance dict, or a module-level cached function taking plain values — the details are in [decorators with arguments](lesson:advanced-decorators).`,
      py`**Stale data and expiry.** \`lru_cache\` has no time-to-live. For data that changes (prices, permissions, feature flags), either call \`cache_clear()\` when it changes, include a version or time bucket in the arguments, or use a cache library/service with expiry. Never cache anything security-sensitive that must reflect revocation immediately.`,
      py`**singledispatch as an extension point.** Libraries expose a generic function (\`to_json\`, \`render\`) and let *users* register their own types without touching library code — open for extension, closed for modification. Prefer ordinary methods and duck typing (see [polymorphism](lesson:polymorphism-and-duck-typing)) when you own all the classes.`,
    ],
  },
  mistakes: [
    {
      title: 'Caching a function that takes a list',
      wrong: { code: py`from functools import cache

@cache
def total_weight(weights):
    return sum(weights)

total_weight([2, 3, 5])     # TypeError: unhashable type: 'list'`, lang: 'python', static: true },
      right: { code: py`from functools import cache

@cache
def total_weight(weights: tuple[float, ...]) -> float:
    return sum(weights)

print(total_weight(tuple([2, 3, 5])))   # 10 — tuples are hashable`, lang: 'python' },
      explanation: py`The cache uses the arguments as a dictionary key, so they must be hashable. Convert lists to tuples (and dicts to \`frozenset(d.items())\` or a frozen dataclass) at the call site, or expose a thin uncached wrapper that converts.`,
    },
    {
      title: 'Returning a mutable object from a cached function',
      wrong: { code: py`from functools import cache

@cache
def default_tags(category):
    return ["new", category]

tags = default_tags("books")
tags.append("sale")              # mutates the CACHED list
print(default_tags("books"))     # ['new', 'books', 'sale'] — corrupted for everyone`, lang: 'python' },
      right: { code: py`from functools import cache

@cache
def default_tags(category):
    return ("new", category)     # immutable: callers can't change the cached value

tags = list(default_tags("books")) + ["sale"]   # callers copy if they need a list
print(default_tags("books"))     # ('new', 'books')`, lang: 'python' },
      explanation: py`Every caller receives the very same object from the cache. Return tuples, frozensets or frozen dataclasses — or return a copy — so one caller can't change what the next one gets.`,
    },
    {
      title: 'Caching a function whose answer changes',
      wrong: { code: py`from datetime import datetime
from functools import cache

@cache
def greeting(name):
    hour = datetime.now().hour        # hidden input: the clock
    return f"Good {'morning' if hour < 12 else 'afternoon'}, {name}"`, lang: 'python' },
      right: { code: py`from functools import cache

@cache
def greeting(name, is_morning):     # the changing input is now part of the key
    return f"Good {'morning' if is_morning else 'afternoon'}, {name}"

print(greeting("Ada", True), greeting("Ada", False))`, lang: 'python' },
      explanation: py`A cached function returns the first answer forever. Only cache pure functions — make anything that changes (time, configuration, database state) an argument so it becomes part of the key, or don't cache.`,
    },
    {
      title: 'Expecting cached_property to notice changes',
      wrong: { code: py`from functools import cached_property

class Cart:
    def __init__(self):
        self.prices = []

    @cached_property
    def total(self):
        return sum(self.prices)

cart = Cart()
print(cart.total)        # 0 — computed and stored
cart.prices.append(5)
print(cart.total)        # still 0!`, lang: 'python' },
      right: { code: py`class Cart:
    def __init__(self):
        self.prices = []

    @property            # recomputed on every access
    def total(self):
        return sum(self.prices)

cart = Cart()
cart.prices.append(5)
print(cart.total)        # 5`, lang: 'python' },
      explanation: py`\`cached_property\` is for values that never change after the first computation. For derived values of mutable state, use a plain \`@property\` — or invalidate explicitly with \`del obj.total\` when the inputs change.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: unhashable type: 'list'`,
      cause: py`A list, dict or set was passed to a function decorated with \`@cache\`/\`@lru_cache\`; the cache can't build a dictionary key from it.`,
      fix: py`Pass a tuple/frozenset instead, or put the cache on an inner helper that receives hashable values.`,
    },
    {
      symptom: py`A cached function keeps returning an old value after the data changed.`,
      cause: py`The function isn't pure: it reads something (a file, the clock, a database, a global) that isn't part of its arguments.`,
      fix: py`Call \`func.cache_clear()\` when the data changes, add a version/time-bucket argument, or stop caching that function.`,
    },
    {
      symptom: py`TypeError: No '__dict__' attribute on 'Slotted' instance to cache 'total' property.`,
      cause: py`\`@cached_property\` stores results in the instance \`__dict__\`, and the class uses \`__slots__\` (or \`@dataclass(slots=True)\`).`,
      fix: py`Use a plain \`@property\`, add a slot and cache manually, or drop \`__slots__\` for that class.`,
    },
    {
      symptom: py`TypeError: Invalid first argument to \`register()\`: <function _ at 0x...>. Use either \`@register(some_class)\` or plain \`@register\` on an annotated function.`,
      cause: py`A \`singledispatch\` implementation was registered with plain \`@fmt.register\` but its first parameter has no type annotation.`,
      fix: py`Annotate the first parameter (\`def _(value: int):\`) or pass the type: \`@fmt.register(int)\`.`,
    },
    {
      symptom: py`Memory grows steadily in a long-running process; cache_info() shows currsize climbing and few hits.`,
      cause: py`An unbounded \`@cache\`/\`lru_cache(maxsize=None)\` on a function called with ever-new arguments (ids, timestamps), or a cached method keeping instances alive.`,
      fix: py`Set a \`maxsize\`, cache at a level with repeating arguments, and avoid \`lru_cache\` on methods. Monitor hits vs misses.`,
    },
  ],
  bestPractices: [
    'Cache only pure functions with hashable arguments, and return immutable results from them.',
    'Prefer lru_cache(maxsize=...) over unbounded @cache when arguments come from outside (user ids, URLs).',
    'Check cache_info() to confirm a cache actually gets hits; remove caches that only cost memory.',
    'Use partial instead of one-off lambdas for pre-filled arguments — it is inspectable and picklable.',
    'Use cached_property for per-object values that never change; use property for values derived from mutable state.',
    'Use singledispatch for type-based behaviour that other modules should be able to extend; use methods when you own the classes.',
    'Always decorate wrapper functions with @wraps(func).',
  ],
  whenToUse: {
    use: [
      'lru_cache/cache: expensive pure computations, recursive sub-problems, repeated lookups of slowly changing reference data.',
      'partial: callbacks and key functions with fixed settings, adapting a function to an API that expects fewer arguments.',
      'cached_property: expensive derived attributes of immutable-ish objects (parsed headers, computed statistics).',
      'singledispatch: serialisers, formatters and visitors that must handle many unrelated types.',
      'total_ordering: classes that need all comparisons but have one natural ordering.',
    ],
    avoid: [
      'Caching functions with side effects or answers that change over time.',
      'lru_cache on instance methods in long-lived processes.',
      'singledispatch for dispatching on values (use a dict) or on several arguments (it only looks at the first).',
      'cached_property on classes with __slots__ or on values that must stay in sync with mutable state.',
    ],
  },
  comparison: {
    title: 'Which caching tool?',
    headers: ['', '@lru_cache(maxsize=N)', '@cache', '@cached_property', 'hand-written dict'],
    rows: [
      ['caches', 'a function’s results by arguments', 'same, unbounded', 'one attribute per instance', 'whatever you decide'],
      ['size limit', 'yes: evicts least recently used', 'no', 'one value per object', 'up to you'],
      ['arguments must be hashable', 'yes', 'yes', 'n/a (no arguments)', 'keys must be'],
      ['invalidate', 'cache_clear() (all entries)', 'cache_clear()', 'del obj.attr', 'any way you like'],
      ['statistics', 'cache_info()', 'cache_info()', 'none', 'your own'],
      ['since', '3.2', '3.9', '3.8', 'always'],
    ],
    note: py`For time-based expiry, per-key invalidation or sharing between processes, use a dedicated cache (a library, or a service such as Redis) — \`functools\` caches live in one process's memory.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'functools-q1',
      type: 'mcq',
      prompt: 'What is `two_to_the = partial(pow, 2)`?',
      options: [
        { text: 'The number 4', why: 'partial never calls the function; it returns a new callable with an argument pre-filled.' },
        'A callable where two_to_the(x) computes pow(2, x)',
        { text: 'A callable where two_to_the(x) computes pow(x, 2)', why: 'Positional arguments given to partial fill from the left, so 2 becomes the base.' },
        { text: 'A TypeError: pow needs two arguments', why: 'The second argument is supplied later, at call time.' },
      ],
      answer: 1,
      explanation: py`\`partial(pow, 2)(10)\` is \`pow(2, 10)\` → 1024. Pre-filled positional arguments come first.`,
    },
    {
      id: 'functools-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from functools import lru_cache

@lru_cache(maxsize=None)
def square(n):
    print("computing", n)
    return n * n

square(3)
square(3)
square(4)
print(square.cache_info())`,
      options: [
        'computing 3\ncomputing 4\nCacheInfo(hits=1, misses=2, maxsize=None, currsize=2)',
        { text: 'computing 3\ncomputing 3\ncomputing 4\nCacheInfo(hits=0, misses=3, maxsize=None, currsize=3)', why: 'The second square(3) is a cache hit: the body (and its print) does not run.' },
        { text: 'computing 3\ncomputing 4\nCacheInfo(hits=2, misses=2, maxsize=None, currsize=2)', why: 'Only one call was answered from the cache.' },
        { text: 'CacheInfo(hits=1, misses=2, maxsize=None, currsize=2)', why: 'The first call with each new argument runs the body, which prints.' },
      ],
      answer: 0,
      explanation: py`Two distinct arguments → two misses (each prints once). The repeated \`square(3)\` is one hit. \`currsize\` counts stored results.`,
    },
    {
      id: 'functools-q3',
      type: 'bug',
      prompt: 'This raises `TypeError: unhashable type: \'list\'`. Click the line where the exception is raised.',
      code: py`from functools import cache

@cache
def total_weight(weights):
    return sum(weights)

print(total_weight([2, 3, 5]))`,
      answerLine: 7,
      explanation: py`The cache builds a key from the arguments *before* calling the function, and a list can't be hashed. Call it with \`(2, 3, 5)\`, or cache a helper that takes a tuple.`,
    },
    {
      id: 'functools-q4',
      type: 'fill',
      prompt: 'Keep the decorated function’s `__name__` and `__doc__` on the wrapper.',
      code: py`from functools import ___

def logged(func):
    @___(func)
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper`,
      answer: [['wraps'], ['wraps']],
      explanation: py`\`@wraps(func)\` copies \`__name__\`, \`__qualname__\`, \`__doc__\`, \`__module__\` and \`__dict__\` from \`func\` and sets \`wrapper.__wrapped__ = func\`.`,
    },
    {
      id: 'functools-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from functools import singledispatch

@singledispatch
def kind(value):
    return "something"

@kind.register
def _(value: int):
    return "int"

@kind.register
def _(value: str):
    return "str"

print(kind(3), kind(True), kind(2.5), kind("x"))`,
      options: [
        'int int something str',
        { text: 'int something something str', why: 'bool is a subclass of int, so True dispatches to the int implementation.' },
        { text: 'int bool something str', why: 'No bool implementation is registered; dispatch walks the MRO bool → int → object.' },
        { text: 'int int int str', why: 'float is not a subclass of int, so 2.5 falls back to the base implementation.' },
      ],
      answer: 0,
      explanation: py`Dispatch uses the type of the first argument and its MRO. \`bool\` inherits from \`int\`; \`float\` doesn't, so it uses the fallback.`,
    },
    {
      id: 'functools-q6',
      type: 'mcq',
      prompt: 'Which statement about `@cached_property` is true?',
      options: [
        'It computes the value on first access and stores it in that instance’s __dict__',
        { text: 'The value is computed once and shared by all instances of the class', why: 'It caches per instance: each object computes and stores its own value.' },
        { text: 'It recomputes automatically when the attributes it uses change', why: 'It has no idea what the method reads; delete the attribute (del obj.name) to force a recompute.' },
        { text: 'It works on classes that use __slots__', why: 'It needs an instance __dict__ to store the value; slotted classes raise TypeError.' },
      ],
      answer: 0,
      explanation: py`After the first access, the stored instance attribute shadows the descriptor, so the method is never called again for that object.`,
    },
    {
      id: 'functools-q7',
      type: 'short',
      prompt: 'Why should a function decorated with `@lru_cache` be pure, and what goes wrong if it isn’t?',
      answer: py`The cache assumes the same arguments always produce the same result, and it skips calling the function on a hit. If the function depends on hidden inputs (the clock, a database, a global) the cache keeps serving the first answer — stale data. If it has side effects (logging, sending an email, writing a file) those effects silently stop happening on cache hits. And if it returns a mutable object, callers share and can corrupt the cached value.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'grid-paths',
      title: 'Memoised grid paths',
      difficulty: 'intermediate',
      prompt: py`A robot starts in the top-left cell of a grid with \`rows\` × \`cols\` cells and may only move **right** or **down**. Write \`grid_paths(rows, cols)\` that returns how many different paths lead to the bottom-right cell.

- A grid with only one row or one column has exactly **1** path.
- Otherwise the number of paths is \`grid_paths(rows - 1, cols) + grid_paths(rows, cols - 1)\` (the last move came from above or from the left).
- Decorate it with \`@cache\` or \`@lru_cache\` so that \`grid_paths(18, 18)\` returns instantly (\`2333606220\`).

The tests check results, that the function has \`cache_info()\`, and that computing \`grid_paths(10, 10)\` from an empty cache needs **at most 100** misses (one per distinct sub-problem).`,
      files: {
        'main.py': py`from functools import cache


def grid_paths(rows, cols):
    # TODO: recursion + memoization
    return 0


print(grid_paths(3, 3))
`,
      },
      hints: [
        'Base case first: if rows == 1 or cols == 1, return 1.',
        'The recursive case adds the paths that arrive from above (rows - 1) and from the left (cols - 1).',
        'Put @cache directly above def grid_paths(rows, cols): — without it, (18, 18) makes billions of calls.',
      ],
      solution: {
        explanation: py`The recursion splits every grid into two smaller grids — and those overlap massively: \`grid_paths(17, 17)\` is needed by both \`(18, 17)\` and \`(17, 18)\`, and so on down. Without a cache the number of calls grows exponentially (the result itself is over two billion, and plain recursion makes at least that many calls). With \`@cache\` each distinct \`(rows, cols)\` pair is computed once, so \`grid_paths(18, 18)\` needs at most 18 × 18 = 324 real calls and \`(10, 10)\` at most 100 misses. Both arguments are ints, so they're hashable — exactly what the cache needs.`,
        files: {
          'main.py': py`from functools import cache


@cache
def grid_paths(rows, cols):
    if rows == 1 or cols == 1:
        return 1
    return grid_paths(rows - 1, cols) + grid_paths(rows, cols - 1)


print(grid_paths(3, 3))
`,
        },
      },
      tests: [
        { name: 'one row or column has one path', code: py`assert grid_paths(1, 7) == 1 and grid_paths(5, 1) == 1` },
        { name: 'a 3x3 grid has 6 paths', code: py`assert grid_paths(3, 3) == 6` },
        { name: 'the function is cached', code: py`assert hasattr(grid_paths, "cache_info"), 'Decorate grid_paths with @cache or @lru_cache'` },
        { name: '18x18 is fast and correct', code: py`assert grid_paths(18, 18) == 2333606220` },
        { name: 'each sub-problem is computed once', code: py`grid_paths.cache_clear()
grid_paths(10, 10)
assert grid_paths.cache_info().misses <= 100` },
      ],
    },
    {
      id: 'json-safe',
      title: 'A JSON-safe converter with singledispatch',
      difficulty: 'intermediate',
      prompt: py`\`json.dumps\` can't handle dates, Decimals or sets. Write a **singledispatch** function \`to_jsonable(value)\` that converts values (recursively) into things \`json\` understands:

| input | output |
|---|---|
| \`date\` / \`datetime\` | \`value.isoformat()\` |
| \`Decimal\` | \`str(value)\` |
| \`set\` / \`frozenset\` | a **sorted** list of converted items |
| \`list\` / \`tuple\` | a list of converted items |
| \`dict\` | a dict with \`str(key)\` keys and converted values |
| anything else | returned unchanged |

The tests check each row, nested data, that \`json.dumps(to_jsonable(data))\` works, and that \`to_jsonable\` is a singledispatch function (it has \`.register\`).`,
      files: {
        'main.py': py`import json
from datetime import date, datetime
from decimal import Decimal
from functools import singledispatch


def to_jsonable(value):
    # TODO: make this a singledispatch function and register the types
    return value


order = {
    "id": 1001,
    "placed": date(2025, 3, 14),
    "total": Decimal("12.50"),
    "tags": {"gift", "fragile"},
    "items": [("tea", 2), ("cake", 1)],
}
print(json.dumps(to_jsonable(order)) if order else "")
`,
      },
      hints: [
        'Decorate the base function with @singledispatch and make it return value unchanged. Then add @to_jsonable.register functions, one per row of the table.',
        'Use annotations (def _(value: date):) — datetime is a subclass of date, so one implementation covers both. Union types work too: value: list | tuple.',
        'Containers recurse: return [to_jsonable(item) for item in value]; for sets: sorted(to_jsonable(item) for item in value); for dicts: {str(k): to_jsonable(v) for k, v in value.items()}.',
      ],
      solution: {
        explanation: py`\`@singledispatch\` makes the base function the fallback (return the value unchanged), and each \`register\` adds a type-specific version. Dispatch follows the MRO, so the \`date\` implementation also handles \`datetime\` — and \`frozenset\` needs its own registration because it isn't a subclass of \`set\`. Containers call \`to_jsonable\` on their items, so nesting of any depth works, and each nested value is dispatched on its own type. The sets are sorted so the output is deterministic. A big advantage over an \`if isinstance\` chain: another module could add \`@to_jsonable.register\` for its own classes without editing this file.`,
        files: {
          'main.py': py`import json
from datetime import date, datetime
from decimal import Decimal
from functools import singledispatch


@singledispatch
def to_jsonable(value):
    return value


@to_jsonable.register
def _(value: date):              # also handles datetime (a subclass of date)
    return value.isoformat()


@to_jsonable.register
def _(value: Decimal):
    return str(value)


@to_jsonable.register
def _(value: set | frozenset):
    return sorted(to_jsonable(item) for item in value)


@to_jsonable.register
def _(value: list | tuple):
    return [to_jsonable(item) for item in value]


@to_jsonable.register
def _(value: dict):
    return {str(key): to_jsonable(item) for key, item in value.items()}


order = {
    "id": 1001,
    "placed": date(2025, 3, 14),
    "total": Decimal("12.50"),
    "tags": {"gift", "fragile"},
    "items": [("tea", 2), ("cake", 1)],
}
print(json.dumps(to_jsonable(order)) if order else "")
`,
        },
      },
      tests: [
        { name: 'is a singledispatch function', code: py`assert hasattr(to_jsonable, "register"), 'Decorate to_jsonable with @singledispatch'` },
        { name: 'dates and datetimes', code: py`assert to_jsonable(date(2025, 3, 14)) == "2025-03-14"
assert to_jsonable(datetime(2025, 3, 14, 9, 30)) == "2025-03-14T09:30:00"` },
        { name: 'Decimal becomes a string', code: py`assert to_jsonable(Decimal("12.50")) == "12.50"` },
        { name: 'sets become sorted lists', code: py`assert to_jsonable({"b", "a"}) == ["a", "b"] and to_jsonable(frozenset({3, 1})) == [1, 3]` },
        { name: 'nested containers are converted', code: py`data = {"items": [("tea", Decimal("4.5"))], 1: {date(2025, 1, 2)}}
assert to_jsonable(data) == {"items": [["tea", "4.5"]], "1": ["2025-01-02"]}` },
        { name: 'json.dumps accepts the result', code: py`import json
text = json.dumps(to_jsonable(order))
assert '"placed": "2025-03-14"' in text and '"tags": ["fragile", "gift"]' in text` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'functools-lru-cache-how',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How does functools.lru_cache work, and what conditions must a function meet to be cached safely?',
      answer: 'It wraps the function with a dictionary keyed by the call’s arguments; on a hit it returns the stored result without calling the function, on a miss it calls and stores. With maxsize it evicts the least recently used entry. The function should be pure (same arguments → same result, no side effects that must happen every call), arguments must be hashable, and results should be immutable because they are shared.',
      explanation: py`Extras: \`cache_info()\` for hit/miss statistics, \`cache_clear()\` to reset, \`typed=True\` to separate \`1\` and \`1.0\`, \`@cache\` (3.9) for unbounded. Keyword vs positional patterns are separate keys. On methods, \`self\` becomes part of the key — usually a bad idea in long-lived processes.`,
      whyAsked: 'Caching is the most common quick performance win; misuse causes stale data and memory leaks.',
      mistakes: ['Not mentioning hashable arguments', 'Caching impure functions', 'Ignoring memory growth with maxsize=None', 'Forgetting that results are shared objects'],
      followUps: ['How is the LRU order maintained in O(1)?', 'What happens with f(1, 2) vs f(1, b=2)?', 'How would you add expiry?'],
      modelAnswer: 'lru_cache wraps a function with a dictionary from the call’s arguments to its result. On a hit it returns the stored result without running the function; on a miss it runs it and stores the result. With a maxsize it also tracks recency and evicts the least recently used entry when full, and cache_info shows hits and misses. For that to be safe, the function should be pure — the same arguments must always give the same answer and nothing important should happen as a side effect — the arguments must be hashable because they form the key, and the result should be immutable, because every caller gets the same object back.',
    },
    {
      id: 'functools-partial-vs-lambda',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `partial(send, retries=3)` with `lambda msg: send(msg, retries=3)`. When would you pick each?',
      answer: 'Both pre-fill arguments. partial binds the values when it is created, keeps the full signature flexible (callers can still pass or override other arguments), is introspectable (.func, .args, .keywords, useful repr) and picklable. A lambda evaluates its body’s names at call time (late binding), can reorder or transform arguments, but is opaque and not picklable.',
      explanation: py`Late binding is the classic trap: \`[lambda: send(m) for m in messages]\` all use the last \`m\`; \`[partial(send, m) for m in messages]\` captures each value. Pick a lambda when you need to rearrange arguments or compute something; pick \`partial\` for plain pre-filling — especially for callbacks sent to other processes (\`multiprocessing\` pickles them).`,
      code: { lang: 'python', code: py`from functools import partial

def send(message):
    return message.upper()

lazy = [lambda: send(m) for m in ["a", "b"]]
bound = [partial(send, m) for m in ["a", "b"]]
print([f() for f in lazy], [f() for f in bound])   # ['B', 'B'] ['A', 'B']` },
      whyAsked: 'It checks closures, late binding and practical API design in one question.',
      mistakes: ['Saying they are identical', 'Not knowing about late binding in lambdas', 'Not knowing partial objects can be pickled'],
      followUps: ['How do you fix the lambda version without partial?', 'What does partialmethod do?'],
      modelAnswer: 'Both give me a function with some arguments filled in. partial captures the values right away, so in a loop each partial keeps its own value, whereas a lambda looks names up when it is called, so lambdas created in a loop all see the last value. partial objects are also introspectable — func, args and keywords — have a readable repr and can be pickled, which matters for multiprocessing. A lambda is more flexible: it can reorder or transform arguments. So I use partial for straightforward pre-filling and a lambda or small def when I need to reshape the call.',
    },
    {
      id: 'functools-shared-mutable-result',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'A web app caches `@cache def permissions_for(role): return load_permissions(role)` which returns a list. After a while some users of the "viewer" role can delete posts. Nobody changed the permission table. What happened?',
      answer: 'The cached list is shared by every caller. Some code path appended "delete" (e.g. to grant a temporary permission to one admin request) to the list it got back, which mutated the cached object, so every later "viewer" lookup returns the modified list. Return an immutable frozenset/tuple from the cached function, and copy when a caller needs to modify.',
      explanation: py`Memoization returns the same object on every hit. With mutable results, "local" modifications become global, and the bug appears far away from its cause. Also consider whether permissions should be cached forever at all — role changes need \`cache_clear()\` or an expiry.`,
      code: { lang: 'python', code: py`from functools import cache

@cache
def permissions_for(role):
    return frozenset({"read"} if role == "viewer" else {"read", "write", "delete"})

perms = set(permissions_for("viewer")) | {"delete"}   # a private copy for this request
print(sorted(permissions_for("viewer")), sorted(perms))` },
      whyAsked: 'A realistic, security-relevant bug that tests understanding of object identity and caching.',
      mistakes: ['Blaming the database', 'Fixing by disabling caching entirely without understanding', 'Returning a copy but leaving the cached object mutable'],
      followUps: ['How would you invalidate the cache when roles change?', 'Would deepcopy on every hit be a good fix?'],
      modelAnswer: 'A cache returns the very same object on every hit, so the list became shared global state. Somewhere a request took the list from permissions_for and appended "delete" for its own purpose; that mutated the cached object, and every later viewer lookup got the modified list. The database is fine. The fix is to return an immutable value — a frozenset — so nobody can modify it, and make callers copy it if they need a variant. I would also add invalidation, because permission changes should not wait for a restart, and I would be careful caching security decisions at all.',
    },
    {
      id: 'functools-cached-property',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `@property`, `@cached_property` and putting `@lru_cache` on a method for an expensive computed attribute.',
      answer: '@property recomputes on every access — always fresh. @cached_property computes once per instance and stores the value in the instance __dict__ — fast, but stale if inputs change, and it needs a __dict__. @lru_cache on a method caches by (self, args) in one shared cache that keeps instances alive and requires self to be hashable — usually the wrong tool for per-instance attributes.',
      explanation: py`Choose by mutability: immutable inputs → \`cached_property\`; mutable inputs → \`property\` (or explicit invalidation with \`del obj.attr\`). \`lru_cache\` belongs on functions of plain values; for methods, its memory behaviour is covered in [decorators with arguments](lesson:advanced-decorators).`,
      whyAsked: 'Shows whether you understand where cached values live and how they are invalidated.',
      mistakes: ['Using cached_property for values derived from mutable state', 'Not knowing cached_property fails with __slots__', 'Putting lru_cache on methods in services'],
      followUps: ['How does cached_property avoid calling the method a second time?', 'Is cached_property thread-safe?'],
      modelAnswer: 'A plain property runs the method on every access, so it’s always correct but pays the cost every time. cached_property runs it once per instance and stores the result in that instance’s __dict__; after that it’s just a normal attribute, so it’s fast — but it won’t notice if the inputs change, and it needs a __dict__, so it doesn’t work with slots. lru_cache on a method puts self into one shared cache key, which keeps instances alive and requires them to be hashable, so I avoid it for per-object values. My rule: immutable inputs, cached_property; mutable inputs, property or explicit invalidation.',
    },
    {
      id: 'functools-singledispatch-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your library has a `render(value)` function with a growing `if isinstance(...)` chain, and users keep asking you to support their own classes. How would `singledispatch` help, and what are its limits compared with methods or protocols?',
      answer: 'Make render a singledispatch generic function: the library registers built-in types, and users register their own types with @render.register without editing the library. Dispatch follows the MRO and ABC registration. Limits: it dispatches only on the first argument’s type, it is a global registry (registration order and import side effects matter), and when you own the classes a method or a Protocol is often simpler.',
      explanation: py`This is the classic "expression problem" trade-off: methods make it easy to add types (each class implements \`render\`), generic functions make it easy to add operations over types you don't own (\`int\`, \`date\`, third-party classes). \`singledispatch\` gives external extensibility without monkey-patching. Document the extension point and keep registrations in an imported module so they're active.`,
      whyAsked: 'Tests API design: extensibility, coupling and knowing the limits of a tool.',
      mistakes: ['Suggesting monkey-patching user classes', 'Not mentioning first-argument-only dispatch', 'Ignoring import-time registration'],
      followUps: ['How does singledispatch pick between a registered base class and an ABC?', 'How would you dispatch on two arguments?'],
      modelAnswer: 'I would turn render into a singledispatch generic function. The base implementation is the fallback, the library registers implementations for the types it knows, and users can call render.register for their own classes from their own code — no edits to the library, no growing isinstance chain. Dispatch follows the class hierarchy, so subclasses are handled, and ABCs work too. The limits: it only looks at the first argument’s type, the registry is global so registrations happen at import time and must actually be imported, and if I own all the classes, a render method or a Protocol is simpler and more discoverable.',
    },
    {
      id: 'functools-memoize',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement a `memoize` decorator from scratch (no lru_cache): cache results by positional arguments, preserve the wrapped function’s `__name__` and `__doc__`, and give the wrapper a `cache_clear()` method.',
      answer: 'Keep a dict in the decorator’s closure keyed by the args tuple; on a miss call the function and store; decorate the wrapper with @wraps(func); attach wrapper.cache_clear = cache.clear.',
      explanation: py`\`args\` is already a tuple, so it's a ready-made key (hashable as long as the arguments are). \`@wraps\` copies the metadata. Functions are objects, so you can attach attributes like \`cache_clear\` to the wrapper. The real \`lru_cache\` adds keyword support, size limits, statistics and thread-safety.`,
      starter: { files: { 'main.py': py`CALLS = []


def memoize(func):
    # TODO: cache by positional args, keep func's name/doc, add cache_clear()
    def wrapper(*args):
        return func(*args)
    return wrapper


@memoize
def slow_square(n):
    """Square n (slowly)."""
    CALLS.append(n)
    return n * n


print(slow_square(4), slow_square(4), len(CALLS))
` } },
      tests: [
        { name: 'returns correct results', code: py`assert slow_square(4) == 16 and slow_square(5) == 25` },
        { name: 'repeated calls use the cache', code: py`before = len(CALLS)
slow_square(7)
slow_square(7)
assert len(CALLS) == before + 1, 'The second call with the same argument should not run the function'` },
        { name: 'keeps the name and docstring', code: py`assert slow_square.__name__ == "slow_square" and slow_square.__doc__ == "Square n (slowly)."` },
        { name: 'cache_clear() empties the cache', code: py`slow_square(9)
slow_square.cache_clear()
before = len(CALLS)
slow_square(9)
assert len(CALLS) == before + 1` },
      ],
      solution: { files: { 'main.py': py`from functools import wraps

CALLS = []


def memoize(func):
    cache = {}

    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    wrapper.cache_clear = cache.clear
    return wrapper


@memoize
def slow_square(n):
    """Square n (slowly)."""
    CALLS.append(n)
    return n * n


print(slow_square(4), slow_square(4), len(CALLS))
` } },
      hints: ['Create the dict inside memoize, outside wrapper, so it persists between calls (a closure).', 'if args not in cache: cache[args] = func(*args)', 'Decorate wrapper with @wraps(func) and set wrapper.cache_clear = cache.clear.'],
      whyAsked: 'A classic that combines closures, decorators, hashing and function attributes.',
      mistakes: ['Creating the cache inside wrapper (it resets on every call)', 'Forgetting @wraps', 'Using a list instead of a dict (O(n) lookups)', 'Using "if cache.get(args)" which fails for falsy results like 0'],
      followUps: ['How would you support keyword arguments?', 'How would you add a size limit?', 'Is this thread-safe?'],
      modelAnswer: 'Inside memoize I create a dictionary — it lives in the closure, so it persists between calls. The wrapper takes *args, which is already a tuple and therefore usable as a key; if the key isn’t in the dict, it calls the function and stores the result, then returns the stored value. I decorate the wrapper with functools.wraps so the name and docstring survive, and attach cache_clear as an attribute pointing at the dict’s clear method. I check membership rather than truthiness so results like 0 or None are cached correctly. lru_cache adds keyword support, a size limit, statistics and thread-safety.',
    },
  ],

  takeaways: [
    'partial pre-fills arguments and returns an inspectable, picklable callable; Placeholder (3.14+) leaves positional gaps.',
    'lru_cache/cache memoize by argument values: arguments must be hashable, the function should be pure, results should be immutable.',
    'cache_info() shows hits and misses; cache_clear() resets; maxsize bounds memory with least-recently-used eviction.',
    'cached_property computes once per instance and stores the value in __dict__ — fast, but stale if inputs change, and no __slots__.',
    'singledispatch chooses an implementation by the first argument’s type (following the MRO); register types with annotations or register(type).',
    'reduce folds, total_ordering fills in comparisons from __eq__ + one ordering, wraps preserves wrapped-function metadata.',
  ],
}
