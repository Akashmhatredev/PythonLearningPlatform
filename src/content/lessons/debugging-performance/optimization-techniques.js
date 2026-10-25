// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const INVOICES = py`import time

RATES = {"GBP": 1.0, "EUR": 0.86, "USD": 0.79}   # value of 1 unit in GBP
rate_lookups = 0


def exchange_rate(currency):
    """Stands in for a slow lookup: a file, a database, a web API."""
    global rate_lookups
    rate_lookups += 1
    return RATES[currency]


def to_gbp(amount, currency):
    return amount * exchange_rate(currency)


def make_orders(n):
    currencies = ["GBP", "EUR", "USD"]
    return [(f"A{i:05d}", i % 97 + 1, currencies[i % 3]) for i in range(n)]


def build_report(orders):
    report = ""
    for order_id, amount, currency in orders:
        report += f"{order_id},{to_gbp(amount, currency):.2f}\n"
    return report


def big_orders(orders, threshold):
    return [order for order in orders if to_gbp(order[1], order[2]) >= threshold]


def main():
    orders = make_orders(30_000)
    start = time.perf_counter()
    report = build_report(orders)
    big = big_orders(orders, 80)
    count = len(big)
    elapsed = time.perf_counter() - start
    print(report[:36], "...")
    print(f"{len(report.splitlines())} report lines, {count} big orders")
    print(f"exchange_rate() was called {rate_lookups} times")
    print(f"took {elapsed * 1000:.1f} ms")


if __name__ == "__main__":
    main()
`

export default {
  id: 'optimization-techniques',
  title: 'Optimization techniques: caching, built-ins & laziness',
  summary: 'Once a profile points at a real hotspot, a handful of techniques — built-ins, str.join, hoisting, caching, generators and the right data structure — make Python code faster without making it unreadable.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['profiling', 'performance', 'generators', 'decorators'],
  related: ['functools', 'lazy-evaluation', 'generators', 'string-methods', 'comprehensions', 'itertools', 'bytecode', 'memory-management', 'records-and-slots', 'multiprocessing', 'gil-and-free-threading'],
  tags: ['optimization', 'optimisation', 'performance', 'caching', 'memoization', 'lru_cache', 'functools.cache', 'str.join', 'built-ins', 'hoisting', 'generators', 'lazy evaluation', 'local variables', 'NumPy', 'Cython', 'PyPy', 'premature optimization'],
  apis: [
    { name: '"".join(iterable)', summary: 'Concatenates many strings in one pass — the reliable way to build a big string.' },
    { name: '@functools.lru_cache(maxsize=128)', summary: 'Memoizes a function: remembers results for recent argument combinations (arguments must be hashable).' },
    { name: '@functools.cache', summary: 'An unbounded cache, the same as lru_cache(maxsize=None) (3.9+).' },
    { name: 'func.cache_info() / cache_clear()', summary: 'Hit/miss statistics of an lru_cache-decorated function, and a way to empty it.' },
    { name: '@functools.cached_property', summary: 'Computes an attribute once per instance and stores it on the instance (3.8+).' },
    { name: 'sum() / min() / max() / any() / all() / sorted()', summary: 'Built-ins that loop in C; any/all stop at the first decisive item.' },
    { name: '(expr for x in items)', summary: 'A generator expression: produces values one at a time instead of building a list.' },
    { name: 'collections.Counter / itertools', summary: 'Standard-library building blocks that replace hand-written counting and looping code.' },
  ],
  docs: [
    { label: 'Programming FAQ — My program is too slow. How do I speed it up?', url: 'https://docs.python.org/3/faq/programming.html#my-program-is-too-slow-how-do-i-speed-it-up' },
    { label: 'Programming FAQ — the most efficient way to concatenate many strings', url: 'https://docs.python.org/3/faq/programming.html#what-is-the-most-efficient-way-to-concatenate-many-strings-together' },
    { label: 'functools — lru_cache, cache, cached_property', url: 'https://docs.python.org/3/library/functools.html' },
    { label: 'PEP 8 — programming recommendations (string concatenation)', url: 'https://peps.python.org/pep-0008/#programming-recommendations' },
    { label: 'Extending Python with C or C++', url: 'https://docs.python.org/3/extending/index.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Optimisation** means changing code so it uses less time or memory *while doing exactly the same job*. It comes **after** two other steps: [profiling](lesson:profiling) to find where the time actually goes, and [choosing the right algorithm and data structure](lesson:performance). Only then do the techniques in this lesson pay off.`,
    py`The toolbox, roughly from biggest and safest win to smallest:`,
    py`1. **Let built-ins and the standard library do the looping** — \`sum\`, \`sorted\`, \`Counter\`, \`str.join\`, set operations. Their loops run in C.
2. **Don't repeat work** — move unchanging work out of loops (*hoisting*) and remember results you've already computed (*caching* / *memoization* with \`functools.lru_cache\`).
3. **Be lazy** — [generators](lesson:generators) produce values one at a time, so you never hold a million items in memory just to add them up.
4. **Micro-optimisations** — CPython details like local-variable lookups. Real, small, rarely worth the readability cost.
5. **Leave pure Python** — NumPy, C extensions, Cython, PyPy, multiple processes — when a profile proves the hot loop must go faster than Python can.`,
  ],
  why: [
    py`Most Python code is fast enough. But some parts — the loop over every row, the function called a million times — decide how long the whole program takes. Making *those* parts efficient can turn a job that takes an hour into one that takes minutes, or let one server do the work of several.`,
    py`Donald Knuth's famous warning applies in both directions: *"We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%."* Optimising code that isn't hot just makes it harder to read. Optimising the code that **is** hot is one of the most valuable things you can do.`,
  ],
  eli15: [
    py`Imagine making sandwiches for a class party.`,
    py`- **Hoisting:** don't walk to the fridge for every single slice of cheese — bring the whole pack to the table once.
- **Built-ins:** use the bread slicer instead of cutting each slice by hand.
- **Caching:** after asking "who's vegetarian?" once, write the answer down instead of asking again for every sandwich.
- **Laziness:** make sandwiches as people arrive instead of making 300 at once and running out of table space.`,
    py`None of these tricks change *what* you make — the same sandwiches come out. They just stop you doing pointless extra work. That's optimisation.`,
  ],
  analogy: {
    title: 'A restaurant kitchen',
    body: [
      py`A good kitchen is fast not because the cooks move their hands faster, but because they avoid wasted work. Ingredients are chopped before service starts (*mise en place*). Machines do the repetitive jobs. Popular sauces are made once and kept ready. Dishes are cooked to order, not all at once. And when a dish truly needs special equipment, they buy the equipment — they don't ask the cooks to stir faster.`,
    ],
    mapping: [
      ['chopping onions before service, not per dish', 'hoisting invariant work out of a loop'],
      ['the food processor', 'built-ins and C-implemented library functions'],
      ['a pot of sauce kept ready', 'a cache: lru_cache remembers computed results'],
      ['cooking to order', 'generators: produce each value only when it is needed'],
      ['stirring faster', 'micro-optimisations: small, tiring, rarely decisive'],
      ['buying a pizza oven', 'NumPy, C extensions, PyPy — specialised tools for a proven hot spot'],
      ['tasting before changing the recipe', 'profiling before and after every change'],
    ],
  },
  visual: {
    type: 'performance',
    title: 'Building a long string three ways, measured live',
    props: { demo: 'string-building' },
    alt: 'A live measurement, run by real Python in the browser, comparing three ways to build a string from n small pieces: s = s + piece with a second reference (copies every time), s += piece (which CPython can sometimes extend in place), and "".join(pieces), for several values of n.',
    caption: py`Strings are immutable, so \`s = s + piece\` copies everything built so far on each step — the total work grows like n². CPython can sometimes grow \`s += piece\` in place (an implementation detail that one extra reference defeats). \`"".join(pieces)\` is reliably linear on every Python.`,
  },
  syntax: [
    py`#### 1. Let C do the loop: built-ins and the standard library`,
    { code: py`from collections import Counter

prices = [3.5, 8.0, 12.0, 3.5]
words = "the cat sat on the mat".split()

total = sum(prices)                                  # not: a for loop with +=
cheapest = min(prices)
has_free = any(p == 0 for p in prices)              # stops at the first match
by_length = sorted(words, key=len)
counts = Counter(words)                             # not: if w in d: d[w] += 1 ...
unique = set(words)
print(total, cheapest, has_free, by_length[:2], counts["the"], len(unique))`, lang: 'python', title: 'built-ins replace hand-written loops' },
    py`A Python \`for\` loop executes several bytecode instructions per item; \`sum(prices)\` runs its whole loop inside the interpreter's C code. The built-in version is usually both **shorter and faster** — the best kind of optimisation. Comprehensions are also typically faster than an equivalent loop calling \`.append\` (see [comprehensions](lesson:comprehensions)).`,
    py`#### 2. Build strings with join`,
    { code: py`rows = [("tea", 3.5), ("mug", 8.0), ("cake", 12.0)]

# Quadratic in general: each + copies everything built so far
csv_text = ""
for name, price in rows:
    csv_text = csv_text + f"{name},{price:.2f}\n"

# Linear: collect the pieces, join once
csv_text = "".join(f"{name},{price:.2f}\n" for name, price in rows)
print(csv_text)`, lang: 'python', title: 'repeated + vs str.join' },
    py`#### 3. Don't repeat work: hoist it`,
    { code: py`import re

BANNED = ["SPAM", "Scam", "free money"]
messages = ["Hello", "FREE MONEY now", "Lunch?"]

# Before: lower-cases every banned word and compiles a pattern for every message
def flagged_slow(messages):
    return [m for m in messages
            if re.search("|".join(w.lower() for w in BANNED), m.lower())]

# After: work that doesn't depend on the message happens once
BANNED_RE = re.compile("|".join(re.escape(w) for w in BANNED), re.IGNORECASE)

def flagged(messages):
    return [m for m in messages if BANNED_RE.search(m)]

print(flagged(messages))`, lang: 'python', title: 'move invariant work out of the loop' },
    py`#### 4. Don't repeat work: cache it`,
    { code: py`from functools import cache, lru_cache

@lru_cache(maxsize=1024)          # keeps the 1024 most recently used results
def shipping_cost(country, weight_kg):
    print(f"  computing {country} {weight_kg}")   # shows when real work happens
    return 5 + weight_kg * (2 if country == "UK" else 4)

shipping_cost("UK", 2)
shipping_cost("UK", 2)            # cache hit: no "computing" line
print(shipping_cost.cache_info())  # CacheInfo(hits=1, misses=1, maxsize=1024, currsize=1)

@cache                            # unbounded: lru_cache(maxsize=None), 3.9+
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(80))`, lang: 'python', title: 'memoization with functools' },
    py`Caching is safe only for **pure** functions: same arguments → same result, no side effects. Arguments must be **hashable** (they become dict keys). See [functools](lesson:functools) for \`cached_property\` and more.`,
    py`#### 5. Be lazy: generators instead of lists`,
    { code: py`readings = range(1_000_000)

total_list = sum([r * r for r in readings])   # builds a million-item list first
total_lazy = sum(r * r for r in readings)     # one value at a time, tiny memory
print(total_list == total_lazy)

def large_values(lines):                       # a generator function
    for line in lines:
        value = float(line)
        if value > 100:
            yield value

first = next(large_values(["12", "250", "99", "400"]))   # stops after finding 250
print(first)`, lang: 'python', title: 'same result, very different peak memory' },
    py`#### 6. Micro-optimisations (CPython details)`,
    { code: py`import math

def distances_plain(points):
    result = []
    for x, y in points:
        result.append(math.sqrt(x * x + y * y))   # global + attribute lookups each time
    return result

def distances_local(points):
    sqrt = math.sqrt                    # bind once to a local name
    result = []
    append = result.append
    for x, y in points:
        append(sqrt(x * x + y * y))
    return result

def distances_idiomatic(points):
    return [math.hypot(x, y) for x, y in points]   # clearer — and a built-in does the maths`, lang: 'python', title: 'local-name binding: real, small, usually not worth it' },
    { callout: 'note', title: 'CPython detail', text: py`In CPython, local variables are read from a fixed array slot while globals and built-ins are looked up by name, and \`obj.attr\` is a lookup on every use. Binding them to local names can shave time off a hot loop — but since 3.11 the specialising adaptive interpreter (PEP 659) caches many of these lookups, so the gain is smaller than old blog posts suggest. Measure it in the playground before you uglify code for it.` },
    py`#### 7. Beyond pure Python`,
    { code: py`# These need a real environment — not the browser sandbox.

# NumPy: whole-array operations run in C (pip install numpy)
import numpy as np
prices = np.array([3.5, 8.0, 12.0] * 100_000)
print((prices * 1.2).sum())          # no Python-level loop at all

# Multiple processes for CPU-bound work (each has its own interpreter and GIL)
from concurrent.futures import ProcessPoolExecutor
with ProcessPoolExecutor() as pool:
    results = list(pool.map(expensive_function, chunks))`, lang: 'python', static: true },
    { code: py`pypy3 report.py              # an alternative interpreter with a JIT compiler
cythonize -i fastpath.pyx    # Cython: Python-like code compiled to a C extension
mypyc fastpath.py            # mypyc: type-annotated Python compiled to a C extension`, lang: 'bash', title: 'static: other ways out of the interpreter loop' },
  ],
  walkthrough: {
    title: 'An invoice report with three kinds of waste',
    lang: 'python',
    code: INVOICES,
    intro: py`The playground program. Press **Guide** there to follow these steps in the editor.`,
    steps: [
      { lines: [7, 15], text: py`\`exchange_rate\` stands in for something genuinely slow — a database or web request. \`to_gbp\` calls it for **every** order, although there are only three currencies. That's repeated work a cache can remove.` },
      { lines: [23, 27], text: py`\`report += ...\` builds a 30,000-line string by repeated concatenation. Strings are immutable, so in general each step may copy everything so far. CPython often optimises this exact pattern — but only as an implementation detail.` },
      { lines: [30, 31], text: py`\`big_orders\` builds a full list just so \`main\` can count it. If you only need to iterate once (or count), a generator avoids storing the matches.` },
      { lines: [34, 44], text: py`\`main\` times the work with \`perf_counter\` and reports how many times the "slow" lookup ran. The counter is the number to watch: it doesn't depend on how fast your machine is.` },
    ],
  },
  playground: {
    title: 'Speed up an invoice report',
    objective: 'Remove repeated work with a cache, build the report with join, make big_orders lazy — and measure what each change bought you.',
    files: { 'main.py': INVOICES },
    expected: py`The first report lines, a summary, the lookup counter and a live timing (your milliseconds will differ):

\`\`\`text
A00000,1.00
A00001,1.72
A00002,2.37
 ...
30000 report lines, 2266 big orders
exchange_rate() was called 60000 times
took … ms
\`\`\`

60,000 "slow" lookups to find out three exchange rates is the obvious waste.`,
    experiments: [
      {
        id: 'cache-rates',
        task: py`Make \`exchange_rate\` remember its answers so it is really called only **once per currency** (3 times in total). The report must not change.`,
        hint: py`Add \`from functools import lru_cache\` and put \`@lru_cache(maxsize=None)\` (or \`@cache\`) on the line above \`def exchange_rate\`.`,
        tests: [
          { name: 'only 3 real lookups', code: py`assert rate_lookups == 3, f"exchange_rate ran {rate_lookups} times; cache its results"` },
          { name: 'the numbers are unchanged', code: py`assert "30000 report lines, 2266 big orders" in output` },
        ],
        explain: py`The cache is a dict from arguments to results. The first call per currency is a *miss* and runs the function; the other 59,997 are *hits*. This is only correct because the rates don't change during a run — for real exchange rates you'd need the cache to expire (and \`cache_clear()\` exists for exactly that).`,
      },
      {
        id: 'join-report',
        task: py`Rewrite \`build_report\` to collect the lines and \`"".join(...)\` them once, instead of \`report += ...\`. The returned text must be identical.`,
        hint: py`\`return "".join(f"{order_id},{to_gbp(amount, currency):.2f}\\n" for order_id, amount, currency in orders)\``,
        tests: [
          { name: 'uses str.join', code: py`import inspect
assert ".join(" in inspect.getsource(build_report), 'Build the string with "".join(...)'` },
          { name: 'same report text', code: py`orders = make_orders(5)
expected = "".join(f"{o},{to_gbp(a, c):.2f}\n" for o, a, c in orders)
assert build_report(orders) == expected` },
        ],
        explain: py`\`join\` adds up the lengths of all pieces, allocates the result once and copies each piece once — linear on every Python implementation. Your timing may barely move here, because CPython already optimises \`report += …\` when nothing else refers to \`report\`. That's the point: \`join\` doesn't depend on an implementation detail (PEP 8 recommends it for exactly this reason).`,
      },
      {
        id: 'lazy-big-orders',
        task: py`Make \`big_orders\` **lazy**: return a generator expression instead of a list, and change \`main\` to count the matches without building a list.`,
        hint: py`Swap the square brackets for parentheses in \`big_orders\`; in \`main\`, \`count = sum(1 for _ in big)\`.`,
        tests: [
          { name: 'big_orders returns a generator', code: py`import types
assert isinstance(big_orders(make_orders(10), 0), types.GeneratorType)` },
          { name: 'the count is unchanged', code: py`assert "2266 big orders" in output` },
        ],
        explain: py`The generator yields one matching order at a time and keeps no list, so memory stays flat however many orders match. The trade-off: you can iterate it only **once**, and \`len()\` doesn't work. If you need the matches several times, a list is the right tool.`,
      },
      {
        id: 'measure-each',
        task: py`Undo and redo your changes one at a time (or comment them out), running each time. Which change moved the "took … ms" line the most? Which changed the *counter* the most? Were you right before you measured?`,
        explain: py`Here the cache removes tens of thousands of function calls, so it usually dominates; \`join\` and laziness matter more for memory and for other Python implementations than for this timing. Measuring each change separately is how you learn which techniques matter for *your* code.`,
      },
    ],
  },
  animation: {
    type: 'performance',
    title: 'Memoization: recursive Fibonacci with and without @lru_cache',
    props: { demo: 'memoization' },
    alt: 'A live measurement comparing recursive Fibonacci with and without functools.lru_cache for several values of n: the number of calls of the plain version grows explosively while the cached version makes about n calls, with timings measured in the browser.',
    caption: py`Plain recursion recomputes the same sub-problems again and again; the cached version computes each \`fib(k)\` once. Trading a little memory for a lot of time is what caching is. The \`@\` syntax is a [decorator](lesson:decorators).`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Your Python code is compiled to **bytecode** — small instructions such as "load this variable", "add", "call this function" — which the interpreter executes one at a time (see [bytecode](lesson:bytecode)). Every instruction has a little overhead. A loop that adds a million numbers in Python runs millions of instructions; \`sum(numbers)\` runs one call whose loop is written in C. That's the whole secret of "use the built-ins".`,
      py`Caching works because computers are faster at **looking up** an answer than recomputing it — as long as the question repeats. Laziness works because many programs only need to look at each item once, so storing all of them is wasted memory.`,
    ],
    technical: [
      py`**Why join is linear.** \`str.join\` makes one pass to add up the lengths, allocates the result string once, and copies each piece into it. \`s = s + piece\` must allocate a new string and copy the old contents every time, so n pieces cost O(n²) character copies in general. CPython has a special case: if \`s\` is the only reference to the string, \`s += piece\` may resize it in place. PEP 8 explicitly warns not to rely on that — it's fragile even in CPython and absent elsewhere.`,
      py`**How lru_cache works.** The decorator builds a key from the positional and keyword arguments and stores results in a dict, plus a linked list that tracks recency so the least recently used entry can be evicted when \`maxsize\` is reached. CPython implements it in C. \`f(1, 2)\` and \`f(a=1, b=2)\` are cached separately; with \`typed=True\`, \`f(3)\` and \`f(3.0)\` are too. The wrapped function is available as \`f.__wrapped__\`.`,
      py`**cached_property** (3.8+) computes the value on first access and stores it in the instance's \`__dict__\`, so later reads are plain attribute lookups. It needs a writable \`__dict__\` (it doesn't work with \`__slots__\`-only classes; see [records & slots](lesson:records-and-slots)).`,
      py`**Generators** keep their frame (local variables and position) suspended between values, so memory doesn't grow with the number of items. Each resume has a small cost, so for small data a list comprehension is often slightly faster — laziness is mainly a *memory* optimisation (see [lazy evaluation](lesson:lazy-evaluation)).`,
      { callout: 'note', title: 'CPython detail: what makes lookups cheaper', text: py`Local variables compile to \`LOAD_FAST\` (an array index); globals and built-ins to \`LOAD_GLOBAL\` (dictionary lookups); attributes to \`LOAD_ATTR\`. Since 3.11, the specialising adaptive interpreter rewrites hot instructions into specialised forms with inline caches, and 3.12 inlined comprehensions (PEP 709). Each version shifts which micro-tricks matter, which is why you measure on the version you run.` },
    ],
    production: [
      py`**Order of attack.** (1) Is the work necessary at all? Skip it, batch it or do it once. (2) Is the algorithm right? (3) Are built-ins and the right data structures used? (4) Can results be cached? (5) Only then micro-optimise or leave Python. Re-profile after each step: the hotspot moves.`,
      py`**Caching in real systems.** In-process caches (\`lru_cache\`) are per process and vanish on restart; shared caches (Redis, memcached) serve many processes. Every cache needs an answer to "when is this stale?" — a time-to-live, explicit invalidation, or data that never changes. Bound your caches: an unbounded \`@cache\` on a function called with ever-new arguments is a memory leak. Caching methods with \`lru_cache\` keeps every \`self\` alive in the cache; prefer \`cached_property\` or a cache keyed by an id.`,
      py`**I/O dominates CPU** in most business code. One query that returns 1,000 rows beats 1,000 queries; one HTTP request with a batch beats a loop of requests. For waiting on many I/O operations at once, see [asyncio](lesson:asyncio-basics).`,
      py`**When Python isn't enough.** For numeric arrays, NumPy (and pandas/Polars on top of it) moves loops into compiled code. For a custom hot loop, Cython or mypyc compile Python-like code to C extensions, and the C API lets you write one directly. PyPy's JIT speeds up many pure-Python programs unchanged (check your dependencies support it). For CPU-bound work on many cores, use [multiple processes](lesson:multiprocessing) — or, on 3.14's officially supported free-threaded build, threads (see [the GIL](lesson:gil-and-free-threading)). CPython 3.13+ also ships an experimental JIT, off by default.`,
    ],
  },
  mistakes: [
    {
      title: 'Building a big string with + in a loop',
      wrong: { code: py`lines = ["a", "b", "c"] * 1000
text = ""
for line in lines:
    text = text + line + "\n"`, lang: 'python' },
      right: { code: py`lines = ["a", "b", "c"] * 1000
text = "".join(line + "\n" for line in lines)
# or: "\n".join(lines) + "\n"`, lang: 'python' },
      explanation: py`Each \`+\` creates a new string and copies the old one: O(n²) in general. \`join\` is O(n) everywhere. For text built in many places, \`io.StringIO\` is the other linear option.`,
    },
    {
      title: 'Recomputing the same thing in every iteration',
      wrong: { code: py`orders = [{"total": 120}, {"total": 40}]
settings = {"vip_threshold": "100.0"}
vip = [o for o in orders if o["total"] > float(settings["vip_threshold"])]`, lang: 'python' },
      right: { code: py`orders = [{"total": 120}, {"total": 40}]
settings = {"vip_threshold": "100.0"}
threshold = float(settings["vip_threshold"])      # once
vip = [o for o in orders if o["total"] > threshold]`, lang: 'python' },
      explanation: py`Anything inside a loop that doesn't depend on the loop variable can move above the loop. It's often clearer too: the name \`threshold\` documents what the value is.`,
    },
    {
      title: 'Caching a function that isn’t pure',
      wrong: { code: py`from functools import cache
import datetime

@cache
def greeting(name):
    hour = datetime.datetime.now().hour      # depends on the time, not just name
    return f"Good {'morning' if hour < 12 else 'afternoon'}, {name}"`, lang: 'python' },
      right: { code: py`import datetime

def greeting(name, now=None):
    hour = (now or datetime.datetime.now()).hour
    return f"Good {'morning' if hour < 12 else 'afternoon'}, {name}"`, lang: 'python' },
      explanation: py`A cache returns the first answer forever. Only cache functions whose result depends solely on their arguments and that have no side effects (printing, writing, sending).`,
    },
    {
      title: 'Using a one-shot generator twice',
      wrong: { code: py`temps = (float(t) for t in ["18.5", "21.0", "19.5"])
average = sum(temps) / 3
highest = max(temps)          # ValueError: max() iterable argument is empty`, lang: 'python', static: true },
      right: { code: py`temps = [float(t) for t in ["18.5", "21.0", "19.5"]]   # need two passes → a list
average = sum(temps) / len(temps)
highest = max(temps)`, lang: 'python' },
      explanation: py`A generator is exhausted after one pass. Use one when you iterate once; materialise a list when you need several passes, \`len()\` or indexing — or compute everything in a single loop.`,
    },
    {
      title: 'Unreadable micro-optimisations without measuring',
      wrong: { code: py`def total_weight(items, _sum=sum, _getattr=getattr):   # "faster" default-arg tricks
    return _sum(_getattr(i, "weight") for i in items)`, lang: 'python' },
      right: { code: py`def total_weight(items):
    return sum(item.weight for item in items)`, lang: 'python' },
      explanation: py`Tricks like this save little — sometimes nothing on modern CPython — and cost every future reader. Keep the clear version unless a profile proves this exact line is the bottleneck and a measurement proves the trick helps.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: unhashable type: 'list' — when calling a function decorated with @lru_cache`,
      cause: py`lru_cache uses the arguments as dict keys, so every argument must be hashable.`,
      fix: py`Pass tuples or frozensets instead (\`total_price(tuple(basket))\`), or cache a helper that takes hashable ids.`,
    },
    {
      symptom: py`Memory grows steadily after adding @cache (or @lru_cache(maxsize=None)).`,
      cause: py`An unbounded cache keeps every distinct argument combination and its result forever.`,
      fix: py`Give it a bound (\`@lru_cache(maxsize=4096)\`), check \`cache_info().currsize\`, and call \`cache_clear()\` when the underlying data changes.`,
    },
    {
      symptom: py`ValueError: max() iterable argument is empty — after sum() worked on the same variable.`,
      cause: py`The variable holds a generator, and the first pass exhausted it.`,
      fix: py`Turn it into a list if you need several passes, or compute all results in one loop.`,
    },
    {
      symptom: py`The "optimised" version isn't any faster.`,
      cause: py`The change wasn't on the hot path, CPython already optimised the original, or the measurement is dominated by noise.`,
      fix: py`Profile first, time with repeats and compare minimums (see [profiling](lesson:profiling)). Revert changes that don't measurably help.`,
    },
  ],
  bestPractices: [
    'Profile first; optimise only the code the profile points at, and re-measure after each change.',
    'Fix the algorithm and data structure before reaching for any technique in this lesson.',
    'Prefer built-ins, comprehensions and the standard library over hand-written loops — they are usually faster and clearer.',
    'Build strings with "".join(), not repeated +.',
    'Hoist work that doesn’t depend on the loop variable out of the loop.',
    'Cache only pure functions with hashable arguments; bound caches and know when they go stale.',
    'Use generators for single-pass pipelines over large data; use lists when you need several passes.',
    'Treat CPython micro-optimisations as a last resort — measure them on the version you run.',
  ],
  whenToUse: {
    use: [
      'A profile shows one function or loop dominating the run time.',
      'The same expensive computation is repeated with the same inputs (caching).',
      'Data is too large to hold in memory at once (generators, streaming).',
      'A numeric workload is dominated by Python-level loops (NumPy, compiled extensions).',
    ],
    avoid: [
      'Code that isn’t on the hot path — keep it simple.',
      'Caching functions with side effects or time-dependent results.',
      'Tricks that make code harder to read without a measured benefit.',
      'Rewriting in another language before fixing the algorithm.',
    ],
  },
  comparison: {
    title: 'Techniques at a glance',
    headers: ['technique', 'what it saves', 'cost / risk', 'typical use'],
    rows: [
      ['built-ins & stdlib', 'interpreter overhead per item', 'almost none — usually clearer', 'sum, sorted, Counter, set operations'],
      ['str.join', 'repeated copying of strings', 'none', 'building text, CSV, HTML'],
      ['hoisting', 'repeating loop-invariant work', 'none', 'parsing config, compiling regexes, building sets'],
      ['lru_cache / cache', 'recomputing repeated calls', 'memory; stale data; hashable args only', 'pure, expensive, repeated lookups'],
      ['generators', 'memory for intermediate lists', 'one pass only; no len()', 'pipelines over big files or streams'],
      ['local-name binding', 'a few lookups per iteration', 'readability; often negligible on 3.11+', 'measured, very hot inner loops'],
      ['NumPy / Cython / PyPy / processes', 'Python-level loop overhead', 'dependencies, build steps, complexity', 'heavy numeric or CPU-bound work'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'optimization-techniques-q1',
      type: 'mcq',
      prompt: 'A nightly job got slow. What should you do before applying any technique from this lesson?',
      options: [
        { text: 'Replace every for loop with a comprehension', why: 'That may help a little somewhere, but you don’t yet know where the time goes.' },
        'Profile it on realistic data, and check the hot spot’s algorithm and data structures',
        { text: 'Add @lru_cache to every function', why: 'Caching impure functions gives wrong answers, and caching cold functions only costs memory.' },
        { text: 'Rewrite it in C', why: 'A rewrite is the most expensive option and may not be needed once the real hotspot is fixed.' },
      ],
      answer: 1,
      explanation: py`Measure, then fix the algorithm, then optimise the remaining hot code. Most slowdowns come from one place, often an O(n²) pattern (see [performance](lesson:performance)).`,
    },
    {
      id: 'optimization-techniques-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from functools import lru_cache

calls = 0

@lru_cache(maxsize=None)
def square(n):
    global calls
    calls += 1
    return n * n

total = sum(square(n % 3) for n in range(10))
print(total, calls, square.cache_info().hits)`,
      answer: '15 3 7',
      accept: ['15 3 7'],
      explanation: py`\`n % 3\` cycles 0, 1, 2, … for ten values, so the squares sum to 0+1+4 three times plus one more 0 = 15. Only the three distinct arguments run the function body (3 misses); the other 7 calls are cache hits.`,
    },
    {
      id: 'optimization-techniques-q3',
      type: 'bug',
      prompt: 'This crashes with `TypeError: unhashable type: \'list\'`. Click the line that triggers it.',
      code: py`from functools import lru_cache

@lru_cache(maxsize=None)
def total_price(items):
    return sum(price for _, price in items)

basket = [("tea", 3.5), ("mug", 8.0)]
print(total_price(basket))`,
      answerLine: 8,
      explanation: py`lru_cache turns the arguments into a dict key, and a list is unhashable. Pass \`tuple(basket)\` — or don't cache a function whose input is a changing basket at all.`,
    },
    {
      id: 'optimization-techniques-q4',
      type: 'fill',
      prompt: 'Cache the 128 most recent results, and build the line of text in one linear pass.',
      code: py`import functools

@functools.___(maxsize=128)
def shipping_cost(country):
    return 5 if country == "UK" else 12

countries = ["UK", "FR", "UK"]
line = ", ".___(f"{c}: {shipping_cost(c)}" for c in countries)`,
      answer: [['lru_cache'], ['join']],
      explanation: py`\`functools.lru_cache(maxsize=128)\` evicts the least recently used results beyond 128. \`", ".join(...)\` concatenates the generated strings with a separator in one pass.`,
    },
    {
      id: 'optimization-techniques-q5',
      type: 'output',
      prompt: 'What are the two printed lines?',
      code: py`squares = (n * n for n in range(4))
print(sum(squares))
print(sum(squares))`,
      options: [
        { text: '14 and 14', why: 'A generator can only be iterated once; the second sum gets nothing.' },
        '14 and 0',
        { text: '14, then a TypeError', why: 'Summing an exhausted generator is not an error — it is just an empty iteration, and sum of nothing is 0.' },
      ],
      answer: 1,
      explanation: py`0 + 1 + 4 + 9 = 14. The first \`sum\` exhausts the generator, so the second sees no values and returns its start value, 0.`,
    },
    {
      id: 'optimization-techniques-q6',
      type: 'mcq',
      prompt: 'Why is `sum(x * x for x in data)` often faster than an explicit `for` loop that does `total += x * x`?',
      options: [
        { text: 'Generators are compiled to machine code', why: 'CPython doesn’t compile generators to machine code; the expression part still runs as bytecode.' },
        'The adding-up loop runs inside sum()’s C code, so fewer bytecode instructions run per item',
        { text: 'sum() uses multiple CPU cores', why: 'sum() runs on one thread like ordinary code.' },
      ],
      answer: 1,
      explanation: py`The multiplication still runs as bytecode in the generator, but the loop control and accumulation happen in C. Fewer interpreted instructions per item means less overhead — measure it if it matters.`,
    },
    {
      id: 'optimization-techniques-q7',
      type: 'short',
      prompt: 'Explain the trade-off of `@functools.cache`. When does it help, and when does it hurt?',
      answer: py`It trades memory for time: results are stored in a dict keyed by the arguments, so repeated calls with the same arguments return instantly. It helps for pure, expensive functions called repeatedly with a limited set of hashable arguments (recursive sub-problems, lookups). It hurts when arguments rarely repeat (memory grows with no hits), when the function has side effects or depends on time/state (stale results), when arguments are unhashable, and when caching methods keeps objects alive. Use lru_cache(maxsize=...) to bound it.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'grid-paths-cache',
      title: 'Count grid paths with a cache',
      difficulty: 'intermediate',
      prompt: py`A delivery robot moves through a grid of \`rows\` × \`cols\` blocks from the top-left to the bottom-right corner, only ever moving **right** or **down**. \`count_paths(rows, cols)\` returns how many different routes exist.

The starter is correct but exponential: it recomputes the same sub-grids over and over. Make it fast **with \`functools\` caching**, keeping the recursion and the line that counts calls in the global \`calls\`. Tests check the answers and that \`count_paths(8, 8)\` runs the function body at most about once per sub-grid (≤ 74 calls).`,
      files: {
        'main.py': py`calls = 0


def count_paths(rows, cols):
    global calls
    calls += 1
    if rows == 1 or cols == 1:
        return 1
    return count_paths(rows - 1, cols) + count_paths(rows, cols - 1)


if __name__ == "__main__":
    print(count_paths(3, 3), count_paths(8, 8))
    print("calls:", calls)
`,
      },
      hints: [
        'The answer depends only on (rows, cols), and the same pairs come up again and again — a perfect fit for memoization.',
        'Import cache (or lru_cache) from functools and decorate count_paths.',
        '@cache on the line directly above def count_paths(rows, cols):',
      ],
      solution: {
        explanation: py`\`count_paths\` is pure and its arguments are two ints, so caching is safe. Without the cache, \`count_paths(8, 8)\` makes thousands of calls because every sub-grid is reached by many routes; with it, each of the at most 64 distinct \`(rows, cols)\` pairs is computed once, so the work drops from exponential to O(rows × cols). (The closed form is the binomial coefficient \`math.comb(rows + cols - 2, rows - 1)\` — the best optimisation is sometimes maths.)`,
        files: {
          'main.py': py`from functools import cache

calls = 0


@cache
def count_paths(rows, cols):
    global calls
    calls += 1
    if rows == 1 or cols == 1:
        return 1
    return count_paths(rows - 1, cols) + count_paths(rows, cols - 1)


if __name__ == "__main__":
    print(count_paths(3, 3), count_paths(8, 8))
    print("calls:", calls)
`,
        },
      },
      tests: [
        { name: 'small grids', code: py`assert count_paths(1, 5) == 1
assert count_paths(3, 3) == 6
assert count_paths(10, 10) == 48620` },
        { name: 'count_paths(8, 8) == 3432 with very few calls', code: py`clear = getattr(count_paths, "cache_clear", None)
if clear:
    clear()
ns["calls"] = 0
assert count_paths(8, 8) == 3432
assert ns["calls"] <= 74, f"{ns['calls']} calls: cache the results"` },
      ],
    },
    {
      id: 'streaming-stats',
      title: 'Stream sensor readings lazily',
      difficulty: 'advanced',
      prompt: py`Sensor logs can be far bigger than memory. Write two functions that never hold all readings at once:

1. \`read_temperatures(lines)\` — a **generator**: for each line, skip blank lines and lines starting with \`#\`, and **yield** \`float(line)\` for the rest. It must be lazy: asking for the first reading must not read further than needed.
2. \`summary(readings)\` — takes **any iterable, including a one-shot generator**, makes a **single pass**, and returns \`{"count": n, "min": lo, "max": hi, "mean": average}\`. For no readings return \`{"count": 0, "min": None, "max": None, "mean": None}\`.

Example: \`summary(read_temperatures(["# sensor 7", "18.5", "", "21.0", "19.5"]))\` → \`{"count": 3, "min": 18.5, "max": 21.0, "mean": 19.666…}\`.`,
      files: {
        'main.py': py`def read_temperatures(lines):
    readings = []
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#"):
            readings.append(float(line))
    return readings


def summary(readings):
    if not readings:
        return {"count": 0, "min": None, "max": None, "mean": None}
    return {
        "count": len(readings),
        "min": min(readings),
        "max": max(readings),
        "mean": sum(readings) / len(readings),
    }


if __name__ == "__main__":
    log = ["# sensor 7", "18.5", "", "21.0", "19.5"]
    print(summary(read_temperatures(log)))
`,
      },
      hints: [
        'Turn read_temperatures into a generator: replace the list and append with yield float(line).',
        'summary can’t call len(), min() and max() separately on a generator — each would consume it. Keep running count, total, lo and hi in one for loop.',
        'Start with count = 0, total = 0.0, lo = hi = None; in the loop: count += 1, total += r, lo = r if lo is None else min(lo, r) (same for hi).',
      ],
      solution: {
        explanation: py`\`read_temperatures\` now **yields** each value, so it reads only as far as its consumer asks — the test feeds it a source that explodes if read too far. \`summary\` keeps four running values (count, total, min, max), so it needs one pass and constant memory however many readings stream through, and it works on lists and one-shot generators alike. Chained together they form a lazy pipeline: one line is read, parsed and folded into the summary before the next is touched (see [lazy evaluation](lesson:lazy-evaluation)).`,
        files: {
          'main.py': py`def read_temperatures(lines):
    for line in lines:
        line = line.strip()
        if line and not line.startswith("#"):
            yield float(line)


def summary(readings):
    count, total, lo, hi = 0, 0.0, None, None
    for r in readings:
        count += 1
        total += r
        lo = r if lo is None else min(lo, r)
        hi = r if hi is None else max(hi, r)
    mean = total / count if count else None
    return {"count": count, "min": lo, "max": hi, "mean": mean}


if __name__ == "__main__":
    log = ["# sensor 7", "18.5", "", "21.0", "19.5"]
    print(summary(read_temperatures(log)))
`,
        },
      },
      tests: [
        { name: 'summary of a list', code: py`s = summary([18.5, 21.0, 19.5])
assert (s["count"], s["min"], s["max"]) == (3, 18.5, 21.0)
assert s["mean"] == approx(59 / 3)` },
        { name: 'summary works on a one-shot generator', code: py`s = summary(x for x in [4.0, 1.0, 7.0])
assert s == {"count": 3, "min": 1.0, "max": 7.0, "mean": 4.0}` },
        { name: 'empty input', code: py`assert summary(iter([])) == {"count": 0, "min": None, "max": None, "mean": None}` },
        { name: 'read_temperatures skips comments and blanks', code: py`assert list(read_temperatures(["# t", "1.5", "  ", "2"])) == [1.5, 2.0]` },
        { name: 'read_temperatures is lazy', code: py`def source():
    yield "12.5"
    raise RuntimeError("read too far: the generator must be lazy")

assert next(iter(read_temperatures(source()))) == 12.5` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'optimization-techniques-premature',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is “premature optimisation”, and how do you decide when optimising is worth it?',
      answer: 'Optimising code before you know it matters — sacrificing clarity for speed you haven’t measured or don’t need. Optimise when there’s a concrete requirement (a deadline, latency target, cost), a profile shows where the time goes, and the change measurably helps the hot path.',
      explanation: py`Knuth's point is about proportion: most code doesn't affect speed, a small part does. Clear code is easier to optimise later — once you know which part to optimise.`,
      whyAsked: 'Interviewers want engineers who balance readability and performance with evidence.',
      mistakes: ['Saying you should never optimise', 'Optimising everything “to be safe”'],
      followUps: ['What would you measure first?', 'Give an example of an optimisation that is never premature.'],
      modelAnswer: 'Premature optimisation is making code more complicated for speed before knowing that speed matters there. Most code isn’t on the hot path, so tricks there only cost readability. I optimise when there’s a real requirement — a slow page, a job that misses its window, a big cloud bill — and a profile tells me where the time goes. Then I fix the algorithm or data structure first, use built-ins and caching, and measure before and after. Choosing a set over a list for repeated lookups isn’t premature — it’s simply the right tool and no harder to read.',
    },
    {
      id: 'optimization-techniques-join',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Why is `"".join(parts)` recommended over `s += part` in a loop, given that CPython often makes `+=` fast?',
      answer: 'Strings are immutable, so concatenation generally creates a new string and copies the old content: O(n²) overall. CPython can resize in place when the string has a single reference, but that’s an implementation detail that another reference or another interpreter defeats. join computes the total size, allocates once and copies each part once — linear everywhere.',
      explanation: py`PEP 8 makes the same recommendation for performance-sensitive code. \`io.StringIO\` is the other reliable option when text is written piece by piece from many places.`,
      whyAsked: 'Tests understanding of immutability and the difference between language guarantees and CPython optimisations.',
      mistakes: ['Claiming += is always quadratic in CPython', 'Not knowing why join is linear'],
      followUps: ['What breaks CPython’s in-place optimisation?', 'When would you use io.StringIO?'],
      modelAnswer: 'Strings are immutable, so in general s += part has to build a new string and copy everything accumulated so far, which makes the whole loop quadratic. CPython has an optimisation that resizes the string in place when nothing else references it, so in simple cases += looks fine — but that’s an implementation detail: a second reference, or PyPy, or a different pattern defeats it, and PEP 8 warns against relying on it. join measures all the pieces, allocates the result once and copies each piece once, so it’s linear on every implementation. So I collect pieces in a list or generator and join once.',
    },
    {
      id: 'optimization-techniques-cache-pitfalls',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A colleague adds `@lru_cache(maxsize=None)` to several functions, including a method `Report.render(self)` and `get_user(user_id)` that reads from the database. What could go wrong?',
      answer: 'Stale data: get_user keeps returning old rows after the database changes. Unbounded memory: maxsize=None never evicts. On the method, self is part of the key, so every Report instance stays alive as long as the cache does (a leak), and results are shared at class level. Arguments must be hashable, and side effects only happen on cache misses.',
      explanation: py`Fixes: bound the cache, add invalidation (\`cache_clear()\`, a TTL cache, or a version in the key), use \`functools.cached_property\` for per-instance values, and only cache pure functions. Measure the hit rate with \`cache_info()\` — a cache with no hits is pure overhead.`,
      code: { lang: 'python', code: py`from functools import cached_property


class Report:
    def __init__(self, rows):
        self.rows = rows

    @cached_property                 # stored on this instance, freed with it
    def total(self):
        return sum(r["amount"] for r in self.rows)` },
      whyAsked: 'Caching bugs (staleness, leaks) are common in production; this checks practical judgment.',
      mistakes: ['Only mentioning memory, not staleness', 'Not knowing lru_cache on methods keeps instances alive'],
      followUps: ['How would you add a time-to-live?', 'How do you know a cache is helping?'],
      modelAnswer: 'Three problems. First, get_user reads mutable data, so the cache will keep serving old user records after they change — caching needs an invalidation story, like a time-to-live or clearing the cache on writes. Second, maxsize=None never evicts, so with many distinct ids memory grows forever. Third, on render the cache key includes self, so the cache holds a reference to every Report and they’re never freed; for per-instance values cached_property is the better tool. I’d also check cache_info to confirm there are real hits, and only cache pure functions with hashable arguments.',
    },
    {
      id: 'optimization-techniques-beyond-python',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A data-processing service is CPU-bound. You’ve fixed the algorithm and used built-ins, and the profile still shows a Python loop over millions of numbers dominating. What are your options?',
      answer: 'Vectorise with NumPy (or pandas/Polars) so the loop runs in compiled code; compile the hot function with Cython, mypyc or a C/Rust extension; try PyPy if dependencies allow; parallelise across cores with multiprocessing / ProcessPoolExecutor (or threads on the free-threaded 3.14 build); or move the work to a database or specialised engine. Choose by how much code changes, deployment complexity, and measured gain.',
      explanation: py`Vectorisation is usually the first stop for numeric data. Compiled extensions suit a small, stable hot function. Parallelism multiplies throughput but adds overhead (pickling data between processes). Each option adds dependencies or build steps — justify it with measurements.`,
      whyAsked: 'Senior engineers should know the escape hatches and their trade-offs, not just “rewrite it in C”.',
      mistakes: ['Suggesting threads for CPU-bound work on standard CPython without mentioning the GIL', 'Jumping to a rewrite before vectorising'],
      followUps: ['Why don’t threads speed up CPU-bound Python on a standard build?', 'What is the cost of sending data to worker processes?'],
      modelAnswer: 'If the hot loop is numeric, I’d first try to vectorise it with NumPy, so the whole operation runs in compiled code instead of one interpreted step per element. If it’s custom logic that doesn’t vectorise, I’d compile just that function — Cython, mypyc, or a small C or Rust extension — keeping the rest in Python. PyPy is worth a test run if our dependencies support it. To use more cores, I’d split the work across processes with ProcessPoolExecutor, because on the standard build the GIL stops threads running Python code in parallel; on the free-threaded 3.14 build threads become an option. I’d pick based on measured gains versus the extra build and deployment complexity.',
    },
    {
      id: 'optimization-techniques-local-names',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'Old performance guides recommend `append = result.append` before a hot loop. Why can that be faster in CPython, and would you do it today?',
      answer: 'Local names are accessed by array index (LOAD_FAST), while result.append needs an attribute lookup each iteration and globals/built-ins need dictionary lookups. Binding once removes repeated lookups. Since 3.11, specialisation caches many of these lookups, so the gain is smaller; I’d only do it in a measured, very hot loop — usually a comprehension or built-in is both clearer and faster.',
      explanation: py`It's a CPython implementation detail, not a language guarantee, and its benefit changes between versions. \`dis.dis\` shows the instructions; \`timeit\` shows whether the trick matters on your version.`,
      whyAsked: 'Probes knowledge of CPython internals and the judgment to not over-apply them.',
      mistakes: ['Presenting it as a general best practice', 'Not knowing why it works'],
      followUps: ['What does LOAD_FAST do?', 'How would you verify the gain?'],
      modelAnswer: 'In CPython, local variables live in a fixed array, so reading one is just an index, while result.append means an attribute lookup on every iteration and globals or built-ins mean dictionary lookups. Binding the method to a local once avoids repeating that work, which is why the trick could help in tight loops. Since 3.11 the specialising interpreter caches many of these lookups, so the gain is much smaller and varies by version. Today I’d write a comprehension or use a built-in, which is clearer and usually faster, and only use the local-binding trick if timeit proves it matters in a measured hot loop.',
    },
    {
      id: 'optimization-techniques-memoize',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement a `memoize` decorator by hand (no functools caching): it should cache results by positional arguments in a dict, expose that dict as `wrapper.cache`, and preserve the wrapped function’s name with `functools.wraps`.',
      answer: 'def memoize(func): cache = {}; @functools.wraps(func) def wrapper(*args): if args not in cache: cache[args] = func(*args); return cache[args]; wrapper.cache = cache; return wrapper.',
      explanation: py`The tuple of arguments is the dict key, which is why arguments must be hashable. Because recursive calls go through the module-level name, which now refers to the wrapper, every sub-problem is cached too. \`functools.lru_cache\` does the same in C, plus keyword arguments, size limits and statistics.`,
      starter: { files: { 'main.py': py`import functools


def memoize(func):
    cache = {}

    def wrapper(*args):
        # TODO: look in cache first; store new results
        return func(*args)

    wrapper.cache = cache
    return wrapper


calls = 0


@memoize
def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)


if __name__ == "__main__":
    print(fib(30), calls)
` } },
      tests: [
        { name: 'fib(20) is correct and each n is computed once', code: py`fib.cache.clear()
ns["calls"] = 0
assert fib(20) == 6765
assert ns["calls"] == 21, f"{ns['calls']} calls: store and reuse results"` },
        { name: 'results are stored in wrapper.cache', code: py`fib.cache.clear()
fib(5)
assert fib.cache[(5,)] == 5` },
        { name: 'keeps the function name', code: py`assert fib.__name__ == "fib", 'Use @functools.wraps(func) on the wrapper'` },
      ],
      solution: { files: { 'main.py': py`import functools


def memoize(func):
    cache = {}

    @functools.wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    wrapper.cache = cache
    return wrapper


calls = 0


@memoize
def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)


if __name__ == "__main__":
    print(fib(30), calls)
` } },
      hints: ['The tuple args can be used directly as a dict key.', 'Check `if args not in cache:` before calling func, then return cache[args].', 'Decorate the inner wrapper with @functools.wraps(func).'],
      whyAsked: 'Combines closures, decorators and caching — and shows you understand what lru_cache does for you.',
      mistakes: ['Creating the cache inside wrapper (a new empty dict every call)', 'Forgetting functools.wraps', 'Using a list argument as a key'],
      followUps: ['How would you support keyword arguments?', 'How would you add a maximum size?', 'Why is the recursion cached too?'],
      modelAnswer: 'The decorator creates one dict in its enclosing scope, so every call to the wrapper shares it through the closure. The wrapper takes *args, which is already a tuple and therefore usable as a dict key: if the key isn’t there it calls the original function and stores the result, then returns the cached value. I decorate the wrapper with functools.wraps so the name and docstring survive, and attach the dict as wrapper.cache so it can be inspected or cleared. Recursive calls hit the cache because the name fib now refers to the wrapper. In real code I’d use functools.lru_cache, which adds keyword support, size limits and statistics in C.',
    },
  ],

  takeaways: [
    'Optimise last: profile, fix the algorithm and data structures, then apply techniques to the measured hot path.',
    'Built-ins and the standard library run their loops in C — they are usually both clearer and faster.',
    'Build strings with "".join(); CPython’s in-place += is an implementation detail.',
    'Hoist loop-invariant work, and cache pure, repeated computations with lru_cache / cache (bounded, hashable args, watch staleness).',
    'Generators save memory in single-pass pipelines; materialise a list when you need several passes.',
    'Local-name binding and similar micro-optimisations are CPython details with shrinking benefits — measure before using them.',
    'For heavy CPU work, step outside the interpreter loop: NumPy, Cython/mypyc, C extensions, PyPy or multiple processes.',
  ],
}
