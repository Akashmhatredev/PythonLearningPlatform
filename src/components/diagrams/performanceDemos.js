// Benchmarks for the performance lab. Each is real Python that measures itself
// and prints one JSON line; the component draws whatever the interpreter reports.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

export const PERFORMANCE_DEMOS = {
  membership: {
    title: '`x in list` vs `x in set`',
    question: 'How long does it take to check whether an item is missing?',
    unit: 'µs per lookup',
    series: [
      { key: 'list_us', label: 'list' },
      { key: 'set_us', label: 'set' },
    ],
    code: py`import json, timeit

rows = []
for n in (1_000, 10_000, 50_000):
    items = list(range(n))
    lookup = set(items)
    list_reps = max(20, 200_000 // n)
    set_reps = 100_000  # set lookups are so fast they need many repeats to rise above timer resolution
    list_time = timeit.timeit(lambda: -1 in items, number=list_reps) / list_reps
    set_time = timeit.timeit(lambda: -1 in lookup, number=set_reps) / set_reps
    rows.append({"n": n, "list_us": list_time * 1e6, "set_us": set_time * 1e6})
print(json.dumps(rows))
`,
    explain: py`A list has to compare the item with every element before it can say "not found", so the time grows with the length (**O(n)**). A set hashes the item and jumps straight to one bucket, so the time stays flat (**O(1)** on average). See [sets](lesson:sets) and [performance](lesson:performance).`,
  },
  'string-building': {
    title: 'Building a string: `+` vs `"".join()`',
    question: 'How long does it take to glue n small strings together?',
    unit: 'ms',
    series: [
      { key: 'plus_ms', label: 's = s + piece (copies every time)' },
      { key: 'inplace_ms', label: 's += piece (CPython shortcut)' },
      { key: 'join_ms', label: '"".join(pieces)' },
    ],
    code: py`import json, timeit

def plus(pieces):
    s = ""
    for p in pieces:
        s = s + p
        keep = s  # a second reference: CPython can't extend s in place
    return s

def inplace(pieces):
    s = ""
    for p in pieces:
        s += p
    return s

rows = []
for n in (2_000, 5_000, 10_000):
    pieces = [f"{i:05d}" for i in range(n)]
    rows.append({
        "n": n,
        "plus_ms": timeit.timeit(lambda: plus(pieces), number=1) * 1e3,
        "inplace_ms": timeit.timeit(lambda: inplace(pieces), number=3) / 3 * 1e3,
        "join_ms": timeit.timeit(lambda: "".join(pieces), number=3) / 3 * 1e3,
    })
print(json.dumps(rows))
`,
    explain: py`Strings are immutable, so \`s = s + piece\` builds a brand-new string and copies everything so far — the total work grows with **n²**. CPython has an optimisation that can grow \`s += piece\` in place when nothing else refers to \`s\`, but it's an implementation detail (other Pythons, or a second reference, defeat it). \`"".join()\` measures the total once and copies each piece once: reliably linear.`,
  },
  memoization: {
    title: 'Recursive Fibonacci with and without `@lru_cache`',
    question: 'How many calls does fib(n) make, and how long does it take?',
    unit: 'calls',
    series: [
      { key: 'plain_calls', label: 'plain recursion' },
      { key: 'cached_calls', label: '@lru_cache' },
    ],
    extra: [
      { key: 'plain_ms', label: 'plain ms' },
      { key: 'cached_ms', label: 'cached ms' },
    ],
    code: py`import json, time
from functools import lru_cache

calls = 0

def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)

@lru_cache(maxsize=None)
def fib_cached(n):
    global calls
    calls += 1
    return n if n < 2 else fib_cached(n - 1) + fib_cached(n - 2)

rows = []
for n in (15, 20, 24):
    calls = 0
    start = time.perf_counter()
    fib(n)
    plain_ms, plain_calls = (time.perf_counter() - start) * 1e3, calls
    fib_cached.cache_clear()
    calls = 0
    start = time.perf_counter()
    fib_cached(n)
    cached_ms, cached_calls = (time.perf_counter() - start) * 1e3, calls
    rows.append({"n": n, "plain_calls": plain_calls, "cached_calls": cached_calls, "plain_ms": plain_ms, "cached_ms": cached_ms})
print(json.dumps(rows))
`,
    explain: py`Plain recursion recomputes the same sub-problems over and over, so the number of calls explodes exponentially. \`@lru_cache\` remembers each result, so every \`fib(k)\` is computed once: about n calls. That trade — memory for time — is **memoization**. See [functools](lesson:functools).`,
  },
  'generator-memory': {
    title: 'A list vs a generator for `sum(i * i for …)`',
    question: 'How much memory does it take to add up n squares?',
    unit: 'KB (peak while summing)',
    series: [
      { key: 'list_kb', label: 'sum([i * i for i in range(n)])' },
      { key: 'gen_kb', label: 'sum(i * i for i in range(n))' },
    ],
    code: py`import json, tracemalloc

rows = []
for n in (1_000, 50_000, 200_000):
    tracemalloc.start()
    sum([i * i for i in range(n)])
    list_peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    tracemalloc.start()
    sum(i * i for i in range(n))
    gen_peak = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    rows.append({"n": n, "list_kb": list_peak / 1024, "gen_kb": gen_peak / 1024})
print(json.dumps(rows))
`,
    explain: py`The list comprehension builds all n results before \`sum()\` sees the first one, so peak memory grows with n. The generator expression hands \`sum()\` one value at a time and keeps almost nothing, so its peak stays tiny and flat. Same answer, same code shape — that's **lazy evaluation**. See [lazy evaluation](lesson:lazy-evaluation).`,
  },
}
