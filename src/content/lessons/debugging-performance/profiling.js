// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const REPORT = py`import cProfile
import io
import pstats


def make_orders(n):
    """Fake order data: (order_id, customer, amount_in_pence)."""
    return [(i, f"customer-{i % (n // 2)}", (i * 37) % 5000) for i in range(n)]


def to_pounds(pence):
    return pence / 100


def unique_customers(orders):
    seen = []
    for _, customer, _ in orders:
        if customer not in seen:        # seen is a list: each check scans it
            seen.append(customer)
    return seen


def total_revenue(orders):
    return sum(to_pounds(amount) for _, _, amount in orders)


def report(orders):
    customers = unique_customers(orders)
    revenue = total_revenue(orders)
    return f"{len(orders)} orders, {len(customers)} customers, revenue {revenue:.2f}"


def main():
    orders = make_orders(3000)

    with cProfile.Profile() as profiler:     # record every function call
        summary = report(orders)
    print(summary)

    out = io.StringIO()
    stats = pstats.Stats(profiler, stream=out).strip_dirs()
    stats.sort_stats("cumulative").print_stats(6)
    print(out.getvalue())


if __name__ == "__main__":
    main()
`

export default {
  id: 'profiling',
  title: 'Measuring: timeit, cProfile & tracemalloc',
  summary: 'Profiling replaces guesses with measurements: timeit for small snippets, cProfile for where a program spends its time, tracemalloc for where its memory goes.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['debugging', 'defining-functions', 'comprehensions'],
  related: ['performance', 'optimization-techniques', 'logging', 'memory-management', 'lazy-evaluation', 'functools', 'context-managers', 'bytecode', 'mocking'],
  tags: ['profiling', 'benchmark', 'timeit', 'perf_counter', 'cProfile', 'pstats', 'tottime', 'cumtime', 'tracemalloc', 'memory', 'snapshot', 'py-spy', 'scalene', 'flame graph', 'observer effect'],
  apis: [
    { name: 'time.perf_counter()', summary: 'A monotonic, high-resolution clock for measuring short durations; only differences between two readings are meaningful.' },
    { name: 'timeit.timeit(stmt, setup, number, globals)', summary: 'Runs stmt number times and returns the total seconds. stmt can be a string or a callable.' },
    { name: 'timeit.repeat(..., repeat=5, number=...)', summary: 'Repeats the timeit measurement and returns a list of totals — report min().' },
    { name: 'cProfile.Profile()', summary: 'A deterministic profiler: records every function call and return. Usable as a context manager (3.8+).' },
    { name: 'pstats.Stats(...).sort_stats(key).print_stats(n)', summary: 'Sorts and prints profile results; keys include "cumulative", "tottime", "calls".' },
    { name: 'tracemalloc.start() / take_snapshot()', summary: 'Starts tracing Python memory allocations; a snapshot records which lines allocated the live memory.' },
    { name: 'Snapshot.compare_to(old, "lineno")', summary: 'Differences between two snapshots, biggest growth first — the leak finder.' },
    { name: 'tracemalloc.get_traced_memory()', summary: 'Returns (current, peak) traced memory in bytes.' },
  ],
  docs: [
    { label: 'The Python Profilers (cProfile, pstats)', url: 'https://docs.python.org/3/library/profile.html' },
    { label: 'timeit — measure execution time of small code snippets', url: 'https://docs.python.org/3/library/timeit.html' },
    { label: 'tracemalloc — trace memory allocations', url: 'https://docs.python.org/3/library/tracemalloc.html' },
    { label: 'time.perf_counter', url: 'https://docs.python.org/3/library/time.html#time.perf_counter' },
    { label: 'Python support for the Linux perf profiler (3.12+)', url: 'https://docs.python.org/3/howto/perf_profiling.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Profiling** means *measuring* where a program spends its time and memory, instead of guessing. A **profiler** is a tool that watches your program run and reports, for each function (or line), how often it ran and how long it took.`,
    py`You have four standard-library tools, each answering a different question:`,
    py`- \`time.perf_counter()\` — a stopwatch: *how long did this block take?*
- \`timeit\` — a careful stopwatch for small snippets: *which of these two expressions is faster?*
- \`cProfile\` + \`pstats\` — *which functions does my whole program spend its time in?*
- \`tracemalloc\` — *which lines allocated the memory my program is holding?*`,
    py`Outside the standard library, **sampling profilers** such as py-spy and Scalene can watch a program that is already running, with little slowdown. This lesson shows when to reach for each — and the golden rule behind all of them: **measure first, optimise second, measure again**. What to *do* with the results is the subject of [performance](lesson:performance) and [optimization techniques](lesson:optimization-techniques).`,
  ],
  why: [
    py`Programmers are famously bad at guessing where time goes. The loop you suspect is often fine, while a one-line \`in\` check on a list, or a helper called a million times, quietly dominates. Rob Pike's first rule of programming says it well: you can't tell where a program is going to spend its time, so don't add speed hacks until you've proven where the bottleneck is.`,
    py`Optimising the wrong thing costs twice: the program doesn't get faster, and the code gets harder to read. A five-minute profile tells you which 5% of the code deserves your attention — and a second profile afterwards proves the change helped.`,
    py`Memory matters too: a service that slowly grows until it's killed, or a script that runs out of RAM on the big file, needs evidence about *which line* is holding memory. \`tracemalloc\` gives exactly that.`,
  ],
  eli15: [
    py`Imagine your phone battery dies by lunchtime. You *could* guess — "it must be the game!" — and delete it. Or you could open **Settings → Battery**, which shows exactly which apps used the most power. Often it's something you never suspected, like a chat app running in the background.`,
    py`A profiler is that battery screen for your program. Instead of guessing which part is slow, you run it once with the profiler watching, and it tells you: "80% of the time was spent in \`unique_customers\`". Then you fix *that*, run the profiler again, and check the number really went down.`,
  ],
  analogy: {
    title: 'Where did my money go? Bank statements and receipts',
    body: [
      py`You're sure you overspend on big things — the new headphones, the concert. Then you read your **itemised bank statement** and discover forty small coffees add up to more than both. Each was cheap; together they dominate.`,
      py`That's a profile. \`cProfile\` is the itemised statement (every function, how many times, how much in total). \`timeit\` is comparing the price of two coffee shops by buying the same coffee many times. \`tracemalloc\` is checking which room the clutter in your house came from. And a sampling profiler is glancing at your spending every hour instead of keeping every receipt — less exact, but it doesn't slow your day down.`,
    ],
    mapping: [
      ['guessing where the money went', 'optimising without measuring'],
      ['itemised bank statement', 'cProfile’s table: ncalls, tottime, cumtime per function'],
      ['forty small coffees', 'a cheap function called a huge number of times'],
      ['buying the same coffee 100 times to compare shops', 'timeit repeating a snippet to compare two versions'],
      ['which room the clutter came from', 'tracemalloc: which line allocated the memory'],
      ['checking spending once an hour', 'a sampling profiler (py-spy, Scalene)'],
      ['keeping every receipt slows you down', 'the observer effect: measuring adds overhead'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The measure → change → re-measure loop',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'goal', label: 'Set a goal', note: '"report in < 1 s"', x: 90, y: 80, tone: 'yellow' },
        { id: 'measure', label: 'Measure', note: 'perf_counter / timeit', x: 280, y: 80 },
        { id: 'profile', label: 'Profile', note: 'cProfile / tracemalloc', x: 470, y: 80, tone: 'blue' },
        { id: 'hotspot', label: 'Find the hotspot', note: 'highest tottime', x: 660, y: 80, tone: 'red' },
        { id: 'change', label: 'Change one thing', note: 'algorithm first', x: 470, y: 230 },
        { id: 'verify', label: 'Re-measure + test', note: 'faster AND still correct?', x: 280, y: 230, tone: 'kraft' },
        { id: 'done', label: 'Stop', note: 'goal met', x: 90, y: 230, tone: 'ink' },
      ],
      edges: [
        { from: 'goal', to: 'measure' },
        { from: 'measure', to: 'profile', label: 'too slow' },
        { from: 'profile', to: 'hotspot' },
        { from: 'hotspot', to: 'change' },
        { from: 'change', to: 'verify' },
        { from: 'verify', to: 'measure', label: 'not yet', dashed: true },
        { from: 'verify', to: 'done', label: 'goal met' },
      ],
      steps: [
        { focus: ['goal'], text: py`Decide what "fast enough" means — a number, measured on realistic data. Without a goal, optimisation never ends.` },
        { focus: ['measure'], edges: ['goal->measure'], text: py`Time the whole task with \`time.perf_counter()\`. If it already meets the goal, stop: you're done.` },
        { focus: ['profile'], edges: ['measure->profile'], text: py`Too slow? Run it under \`cProfile\` (time) or \`tracemalloc\` (memory) to see *where* the cost is.` },
        { focus: ['hotspot'], edges: ['profile->hotspot'], text: py`Look for functions with a large **tottime** (time in their own code) or a huge **ncalls**. Usually one or two dominate.` },
        { focus: ['change'], edges: ['hotspot->change'], text: py`Change **one** thing — ideally the algorithm or data structure (see [performance](lesson:performance)) — so you know what caused any difference.` },
        { focus: ['verify'], edges: ['change->verify'], text: py`Run the tests (still correct?) and measure again (actually faster?). Many "optimisations" turn out to make no difference.` },
        { focus: ['done', 'measure'], edges: ['verify->measure', 'verify->done'], text: py`Repeat until the goal is met — then stop, and keep the readable version of everything else.` },
      ],
    },
    alt: 'A loop diagram: set a goal, measure, profile, find the hotspot, change one thing, then re-measure and run tests. If the goal is not met, loop back to measuring; if it is, stop.',
    caption: py`Profiling is a loop, not a one-off. The **re-measure** step is the one people skip — and the one that catches changes that didn't help.`,
  },
  syntax: [
    py`#### 1. A stopwatch: time.perf_counter()`,
    { code: py`import time

start = time.perf_counter()
total = sum(i * i for i in range(100_000))
elapsed = time.perf_counter() - start
print(f"took {elapsed * 1000:.2f} ms")`, lang: 'python', title: 'time one block' },
    py`\`perf_counter\` is **monotonic** (never jumps backwards) and has the best available resolution. Don't use \`time.time()\` for durations: it's the wall clock, which can be adjusted while you measure. \`time.process_time()\` measures CPU time of the process instead of elapsed time.`,
    py`#### 2. timeit: fair comparisons of small snippets`,
    { code: py`import timeit

words = ["tea", "mug", "cake"] * 1000

# a callable: no string, no globals problems
best = min(timeit.repeat(lambda: "".join(words), number=200, repeat=5))
print(f"join: {best / 200 * 1e6:.2f} µs per call")

# a string statement needs setup= or globals= to see your names
t = timeit.timeit("sorted(words)", globals=globals(), number=200)
print(f"sorted: {t / 200 * 1e6:.2f} µs per call")`, lang: 'python', title: 'timeit.repeat and timeit.timeit' },
    py`\`number\` is how many times the snippet runs per measurement (the total is returned, so divide); \`repeat\` is how many measurements. **Report the minimum**: the fastest run is the one least disturbed by everything else the computer was doing. timeit also switches the garbage collector off while timing, so results are steadier (add \`gc.enable()\` to \`setup\` if GC is part of what you want to measure).`,
    { code: py`python -m timeit -s "words = ['tea'] * 1000" "''.join(words)"
# prints: N loops, best of 5: T usec per loop`, lang: 'bash', title: 'from the terminal (picks number automatically)' },
    py`#### 3. cProfile + pstats: where does the program spend its time?`,
    { code: py`import cProfile
import io
import pstats

def work():
    return sorted(str(i) for i in range(20_000))

with cProfile.Profile() as profiler:      # context manager: 3.8+
    work()

out = io.StringIO()
stats = pstats.Stats(profiler, stream=out).strip_dirs()
stats.sort_stats("cumulative").print_stats(5)   # top 5 by cumtime
print(out.getvalue())`, lang: 'python', title: 'profiling a function from code' },
    { code: py`python -m cProfile -s cumulative report.py     # profile a whole script
python -m cProfile -o report.prof report.py    # save results for later
python -m pstats report.prof                   # browse them interactively`, lang: 'bash', title: 'profiling a whole script' },
    py`Reading the table (this is real output from the playground below in this sandbox — your numbers will differ):`,
    { code: py`         7509 function calls in 0.126 seconds

   Ordered by: cumulative time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.001    0.001    0.125    0.125 main.py:27(report)
        1    0.103    0.103    0.109    0.109 main.py:15(unique_customers)
        1    0.000    0.000    0.016    0.016 main.py:23(total_revenue)
     3001    0.011    0.000    0.013    0.000 main.py:24(<genexpr>)`, lang: 'text' },
    py`| column | meaning |
|---|---|
| \`ncalls\` | how many times it was called; \`25/1\` means 25 calls in total, 1 of them "primitive" (not recursive) |
| \`tottime\` | time spent in the function's **own** code, excluding functions it called |
| \`percall\` | tottime ÷ ncalls |
| \`cumtime\` | **cumulative** time: own code **plus** everything it called |
| \`percall\` | cumtime ÷ primitive calls |`,
    py`Sort by \`"cumulative"\` to see *which call chains* are expensive (top-level functions float up), and by \`"tottime"\` to see *which code itself* is slow. Here \`report\` has the largest cumtime but almost no tottime — it's just the caller. \`unique_customers\` has a big tottime: that's the hotspot. \`print_stats("main.py")\` restricts output to matching lines; \`print_callers()\`/\`print_callees()\` show who calls whom.`,
    py`#### 4. tracemalloc: where does the memory go?`,
    { code: py`import tracemalloc

tracemalloc.start()
before = tracemalloc.take_snapshot()

cache = {i: str(i) * 20 for i in range(10_000)}   # something that holds memory

after = tracemalloc.take_snapshot()
for stat in after.compare_to(before, "lineno")[:3]:
    print(stat)          # file:line: size=... (+...), count=... (+...)

current, peak = tracemalloc.get_traced_memory()
print(f"current {current / 1024:.0f} KiB, peak {peak / 1024:.0f} KiB")
tracemalloc.stop()       # tracing has overhead: switch it off when done`, lang: 'python', title: 'snapshots and comparisons' },
    py`\`snapshot.statistics("lineno")\` ranks lines by the memory they currently hold; \`compare_to\` ranks by **growth** between two snapshots — perfect for leaks. Group by \`"traceback"\` (after \`tracemalloc.start(25)\` to keep 25 frames) to see the whole call path that led to an allocation. \`tracemalloc.reset_peak()\` (3.9+) lets you measure the peak of one phase at a time.`,
    py`#### 5. Sampling profilers (outside the standard library)`,
    { code: py`pip install py-spy scalene

py-spy record -o profile.svg -- python report.py   # flame graph of a whole run
py-spy top --pid 12345                             # live "top" view of a running process
py-spy dump --pid 12345                            # what is every thread doing right now?
scalene report.py                                  # line-level CPU + memory, Python vs native time`, lang: 'bash', title: 'static: these need a real machine, not the browser sandbox' },
    { callout: 'version', title: 'Version notes', text: py`\`cProfile.Profile\` as a context manager: 3.8+. \`pstats.SortKey\` constants: 3.7+. \`Stats.get_stats_profile()\` and \`tracemalloc.reset_peak()\`: 3.9+. Since 3.12, only one profiler can be active at a time — enabling a second raises \`ValueError: Another profiling tool is already active\`. 3.12 also added support for the Linux \`perf\` profiler (\`python -X perf\`).` },
  ],
  walkthrough: {
    title: 'Reading the profiled report',
    lang: 'python',
    code: REPORT,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [6, 8], text: py`Fake, deterministic test data: 3000 orders from 1500 distinct customers. Profiling on realistic sizes matters — a quadratic bug is invisible with 10 orders.` },
      { lines: [15, 20], text: py`The suspect: \`customer not in seen\` on a **list** compares against every element seen so far. With n orders that's roughly n × (number of customers) comparisons — but it's written in C inside \`list.__contains__\`, so cProfile charges it to \`unique_customers\`' own **tottime**.` },
      { lines: [23, 24], text: py`\`to_pounds\` is called once per order. Each call is cheap, but cProfile records every one — watch its \`ncalls\` column.` },
      { lines: [36, 37], text: py`\`with cProfile.Profile() as profiler:\` switches profiling on only around the code you care about, not the data set-up.` },
      { lines: [40, 43], text: py`\`pstats.Stats\` turns raw data into a table. \`strip_dirs()\` shortens file paths, \`sort_stats("cumulative")\` orders by cumtime, \`print_stats(6)\` keeps the top six rows. Writing to a \`StringIO\` lets us print it with the rest of the output.` },
    ],
  },
  playground: {
    title: 'Find the hotspot in a sales report',
    objective: 'Profile the report, read the table, fix the real hotspot, and add timing and memory measurements of your own.',
    files: { 'main.py': REPORT },
    expected: py`A summary line, then a cProfile table. Timings differ on every run and every machine; the **shape** doesn't:

\`\`\`text
3000 orders, 1500 customers, revenue 74445.00
         7509 function calls in … seconds

   Ordered by: cumulative time
   …
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    …        …        …        …     main.py:27(report)
        1    …        …        …        …     main.py:15(unique_customers)
        …
\`\`\`

\`unique_customers\` should own most of the time — in its own code (\`tottime\`), not in anything it calls.`,
    experiments: [
      {
        id: 'sort-tottime',
        task: py`Sort the table by **own time** instead of cumulative time. Which function is at the top now, and is it the same one as before?`,
        hint: py`Change \`sort_stats("cumulative")\` to \`sort_stats("tottime")\`.`,
        tests: [{ name: 'the table is ordered by internal time', code: py`assert "Ordered by: internal time" in output, 'Sort by "tottime"'` }],
        explain: py`Sorted by tottime, callers like \`report\` drop away and the function whose **own code** is slow rises to the top: \`unique_customers\`. Cumulative order answers "which branch of the call tree is expensive?"; tottime answers "which code should I actually change?".`,
      },
      {
        id: 'fix-hotspot',
        task: py`Make \`unique_customers\` fast **without changing its result** (same customers, first-seen order). Then run again and compare its tottime.`,
        hint: py`Keep the \`seen\` list for the order, but also keep a \`set\` for the membership check — or return \`list(dict.fromkeys(customer for _, customer, _ in orders))\`.`,
        tests: [
          { name: 'same result, first-seen order', code: py`orders = make_orders(10)
assert unique_customers(orders) == ["customer-0", "customer-1", "customer-2", "customer-3", "customer-4"]` },
          { name: 'membership no longer scans a list', code: py`class Counted:
    eq_calls = 0
    def __init__(self, v):
        self.v = v
    def __hash__(self):
        return hash(self.v)
    def __eq__(self, other):
        Counted.eq_calls += 1
        return isinstance(other, Counted) and self.v == other.v

orders = [(i, Counted(i % 500), 0) for i in range(1000)]
result = unique_customers(orders)
assert [c.v for c in result] == list(range(500))
assert Counted.eq_calls < 5000, f"{Counted.eq_calls} comparisons: use a set (or dict) for the 'seen' check"` },
        ],
        explain: py`A \`set\` (or dict) finds an item by its hash in roughly constant time instead of comparing it with every element, so the work drops from about n × customers comparisons to about n hash lookups. The test counts \`==\` comparisons instead of timing — timings are noisy, operation counts are not. This is an *algorithmic* fix: see [performance](lesson:performance).`,
      },
      {
        id: 'best-of',
        task: py`At the end of \`main()\`, measure \`report(orders)\` with \`timeit.repeat(lambda: report(orders), number=1, repeat=5)\` and print the fastest run as \`best: <milliseconds> ms\` (e.g. \`best: 3.142 ms\`).`,
        hint: py`\`import timeit\` at the top, then \`best = min(timeit.repeat(...))\` and \`print(f"best: {best * 1000:.3f} ms")\`.`,
        tests: [{ name: 'prints "best: … ms"', code: py`import re
assert re.search(r"best: [0-9.]+ ms", output), 'Print a line like "best: 3.142 ms"'` }],
        explain: py`Notice the profiled run in the table is slower than your timeit best: cProfile adds work to every function call (the **observer effect**). Use the profiler to find *where* time goes and a plain timer to measure *how much*.`,
      },
      {
        id: 'peak-memory',
        task: py`Measure the memory used while building the data: wrap \`orders = make_orders(3000)\` with \`tracemalloc.start()\` … \`tracemalloc.get_traced_memory()\`, print \`peak: <KiB> KiB\`, and stop tracing afterwards.`,
        hint: py`\`current, peak = tracemalloc.get_traced_memory()\`, then \`print(f"peak: {peak / 1024:.1f} KiB")\` and \`tracemalloc.stop()\`.`,
        tests: [
          { name: 'prints "peak: … KiB"', code: py`import re
assert re.search(r"peak: [0-9.]+ KiB", output), 'Print a line like "peak: 412.3 KiB"'` },
          { name: 'tracing is switched off afterwards', code: py`import tracemalloc
assert not tracemalloc.is_tracing(), 'Call tracemalloc.stop() when you are done'` },
        ],
        explain: py`3000 tuples, 3000 f-strings and a list to hold them: tracemalloc counts every allocation made through Python's allocators while tracing is on. Stopping it matters — tracing slows every allocation and its own bookkeeping uses memory.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Own time vs cumulative time, on the call stack',
    props: {
      code: py`import time


def parse(line):
    return [int(x) for x in line.split(",")]


def load(lines):
    rows = []
    for line in lines:
        rows.append(parse(line))
    return rows


def main():
    start = time.perf_counter()
    rows = load(["1,2", "3,4"])
    elapsed = time.perf_counter() - start
    print(len(rows), "rows loaded")


main()
`,
      notes: {
        5: 'While this line runs, `parse` is on top of the stack. A profiler charges this time to **parse’s tottime** — and to the **cumtime** of parse, load and main, which are all still waiting below it.',
        11: '`load` is running its own loop code here: that time is load’s **tottime**. When it calls `parse`, the clock for load’s own time pauses.',
        16: '`perf_counter()` reads a high-resolution clock. A single reading means nothing; only the difference between two readings does.',
        17: 'Step into `load` and watch the stack grow: main → load → parse.',
        18: '`elapsed` covers everything between the two readings — the equivalent of main’s cumtime for that line.',
      },
    },
    alt: 'A step-by-step trace of main calling load, which calls parse for each line. The call stack grows to three frames while parse runs. Notes explain that time on parse’s lines counts as parse’s own time and as cumulative time for every function below it on the stack, and that elapsed is the difference between two perf_counter readings.',
    caption: py`**tottime** = time while the function is on *top* of the stack. **cumtime** = time while it is *anywhere* on the stack. That's the whole difference.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`There are two ways to profile. A **deterministic** (tracing) profiler like \`cProfile\` gets a callback on *every* function call and return and reads the clock each time, so it knows exact call counts. A **sampling** profiler like py-spy wakes up many times a second, looks at what the program is doing at that instant, and builds a statistical picture — less exact, far less overhead.`,
      py`\`tracemalloc\` works like a deterministic profiler for memory: while tracing, every allocation made through Python's memory allocator is recorded together with the line (and optionally the call path) that made it.`,
    ],
    technical: [
      py`**Function granularity.** cProfile measures functions, not lines. Time spent in a C-level operation inside your function — \`x in some_list\`, \`str.join\`, arithmetic — is charged to *your* function's tottime, because no Python function was called. Built-in functions that are called explicitly appear as their own rows, e.g. \`{built-in method builtins.sum}\` or \`{method 'append' of 'list' objects}\`. Generator expressions appear as \`<genexpr>\` rows with one call per value produced (+1 for the end).`,
      py`**Recursion.** \`ncalls\` shows \`total/primitive\`: \`15/1\` for \`fib(5)\` means 15 calls, one of which wasn't recursive. cumtime is computed from primitive calls so recursive time isn't counted several times.`,
      py`**cProfile vs profile.** \`cProfile\` is a C extension (\`_lsprof\`); the pure-Python \`profile\` module does the same job with much higher overhead — use it only to extend the profiler in Python.`,
      py`**timeit's choices.** It uses \`time.perf_counter\`, disables garbage collection during timing, runs the statement \`number\` times in a tight loop to dwarf the timer's own overhead, and returns totals. \`Timer.autorange()\` picks \`number\` so one measurement takes at least 0.2 s. The docs recommend looking at \`min()\` of the repeats: higher values are usually caused by other processes interfering, not by variation in Python's speed.`,
      py`**tracemalloc's view.** It hooks Python's memory allocator functions, so it sees objects, buffers and anything else allocated through them — but not memory a C library allocates directly with the system allocator. Snapshots are filtered and grouped by \`"filename"\`, \`"lineno"\` or \`"traceback"\`; \`Filter\` objects can exclude noise like \`<frozen importlib._bootstrap>\`.`,
      { callout: 'note', title: 'CPython detail', text: py`Everything about *speed* is an implementation detail: the same code can rank differently on PyPy (a JIT compiler that needs warm-up runs) or on another CPython version. Profile on the interpreter, version and data you actually run in production. Since 3.12, cProfile is built on the \`sys.monitoring\` API, which is why only one profiling tool can be active at a time.` },
    ],
    production: [
      py`**The observer effect.** Measuring changes what you measure. cProfile adds a fixed cost to *every* Python function call, so code made of many tiny calls looks relatively slower under the profiler than code that spends its time inside a few big built-ins. tracemalloc slows allocation-heavy code and uses memory for its records. Treat profiles as a map of *where* time goes, then confirm improvements with a plain timer and no profiler.`,
      py`**Realistic conditions.** Profile with production-sized inputs (quadratic code hides in small tests), a warm cache if production has one, and the same Python version. For stable benchmark numbers, tools such as *pyperf* calibrate loops and spawn worker processes; *pytest-benchmark* and *asv* track performance in CI so regressions are caught like bugs.`,
      py`**Profiling live services.** You can't restart production under cProfile. Sampling profilers attach to a running process: \`py-spy dump --pid\` shows what every thread is doing right now (great for a "hung" worker), \`py-spy record\` produces a **flame graph** — a picture where each bar is a function and its width is the share of samples it appeared in. Scalene adds line-level CPU *and* memory, separating time in Python from time in native code. Continuous-profiling services do this all the time at low sampling rates.`,
      py`**Memory leaks.** In a long-running process, take a tracemalloc snapshot, let traffic run, take another, and \`compare_to\`: lines whose size keeps growing are holding references — typically an unbounded cache, a list that only grows, or a global registry. Tools like *memray* also track native allocations. See [memory management](lesson:memory-management) for how references keep objects alive.`,
    ],
  },
  mistakes: [
    {
      title: 'Optimising by gut feeling',
      wrong: { code: py`# "String formatting must be slow" — hours spent rewriting f-strings,
# while the real cost was a list membership test in a loop.`, lang: 'python' },
      right: { code: py`import cProfile
cProfile.run("main()", sort="tottime")   # find out first`, lang: 'python', static: true },
      explanation: py`A profile takes minutes and points at the real hotspot. Optimising code that isn't on the hot path makes it harder to read for no gain.`,
    },
    {
      title: 'Timing something you never called',
      wrong: { code: py`import time

start = time.perf_counter()
result = sorted                        # forgot the call: measures nothing
elapsed = time.perf_counter() - start`, lang: 'python' },
      right: { code: py`import time

data = list(range(10_000, 0, -1))
start = time.perf_counter()
result = sorted(data)
elapsed = time.perf_counter() - start`, lang: 'python' },
      explanation: py`A suspiciously tiny time usually means the work didn't happen — a missing \`()\`, a generator that was never consumed, or a cached result. Check the result as well as the time.`,
    },
    {
      title: 'One run, wall clock, no repeats',
      wrong: { code: py`import time

t0 = time.time()
build_index(docs)
print(time.time() - t0)       # one noisy sample from an adjustable clock`, lang: 'python', static: true },
      right: { code: py`import timeit

runs = timeit.repeat(lambda: build_index(docs), number=1, repeat=5)
print(f"best of 5: {min(runs):.4f} s")`, lang: 'python', static: true },
      explanation: py`A single run includes noise from everything else the machine is doing, and the first run may include one-off costs (imports, cold caches). Use \`perf_counter\`, repeat, and report the minimum.`,
    },
    {
      title: 'Leaving the setup inside the timed statement',
      wrong: { code: py`import timeit

timeit.timeit("sorted(list(range(10_000)))", number=100)   # times building the list too`, lang: 'python' },
      right: { code: py`import timeit

timeit.timeit("sorted(data)", setup="data = list(range(10_000))", number=100)`, lang: 'python' },
      explanation: py`\`setup\` runs once per measurement and isn't timed. Put data preparation there so you compare only the operation you care about.`,
    },
    {
      title: 'Leaving tracemalloc (or a profiler) switched on',
      wrong: { code: py`import tracemalloc

def build_cache():
    tracemalloc.start()
    cache = {i: str(i) for i in range(1000)}
    print(tracemalloc.get_traced_memory())
    return cache        # tracing stays on for the rest of the program`, lang: 'python' },
      right: { code: py`import tracemalloc

def build_cache():
    tracemalloc.start()
    try:
        cache = {i: str(i) for i in range(1000)}
        print(tracemalloc.get_traced_memory())
    finally:
        tracemalloc.stop()
    return cache`, lang: 'python' },
      explanation: py`Tracing slows every allocation and keeps records in memory. Use \`try/finally\` (or a [context manager](lesson:context-managers)) so measurement code always cleans up, even on errors.`,
    },
  ],
  debugging: [
    {
      symptom: py`NameError: name 'slugify' is not defined (from inside timeit)`,
      cause: py`A string statement runs in timeit's own namespace, which can't see your module's names.`,
      fix: py`Pass a callable (\`timeit.timeit(lambda: slugify(title), number=1000)\`), or \`globals=globals()\`, or import the names in \`setup="from __main__ import slugify, title"\`.`,
    },
    {
      symptom: py`RuntimeError: the tracemalloc module must be tracing memory allocations to take a snapshot`,
      cause: py`\`take_snapshot()\` was called before \`tracemalloc.start()\` or after \`stop()\`.`,
      fix: py`Call \`tracemalloc.start()\` first (as early as possible, so the allocations you care about are traced), and only stop after the last snapshot.`,
    },
    {
      symptom: py`ValueError: Another profiling tool is already active`,
      cause: py`Since 3.12 only one profiler can run at a time: you enabled a second \`cProfile.Profile\` (or a debugger/coverage tool is using the same hooks).`,
      fix: py`Disable the first profiler before enabling another, and don't nest profiling blocks.`,
    },
    {
      symptom: py`The same benchmark gives very different numbers each run.`,
      cause: py`Noise: other programs, CPU frequency changes, caches, garbage collection, or a measurement too short for the clock's resolution.`,
      fix: py`Increase \`number\` so each measurement takes at least a few hundred milliseconds, repeat, compare **minimums**, and close other heavy programs. For serious work use pyperf.`,
    },
    {
      symptom: py`The cProfile table is dominated by main() and other top-level functions.`,
      cause: py`It's sorted by cumulative time, so callers that merely *contain* the slow code rise to the top.`,
      fix: py`Sort by \`"tottime"\` to find the code that is itself slow, or use \`print_callees("main")\` to drill down the call tree.`,
    },
  ],
  bestPractices: [
    'Set a measurable goal first, then measure before changing anything.',
    'Profile with realistic data sizes and the Python version you run in production.',
    'Use cProfile sorted by tottime to find hotspots, and cumtime to find expensive call chains.',
    'Confirm improvements with a plain timer (perf_counter or timeit) — not with the profiler’s own numbers.',
    'With timeit, keep setup out of the timed statement, repeat, and compare minimums.',
    'Change one thing at a time and re-run the tests: faster and wrong is not an optimisation.',
    'Turn measurement off when done (tracemalloc.stop(), profiler.disable()); use try/finally.',
    'Never write tests that depend on exact timings — assert on results or operation counts.',
  ],
  whenToUse: {
    use: [
      'perf_counter: timing one block or one request, or logging durations in production.',
      'timeit: choosing between two small implementations of the same thing.',
      'cProfile: “the whole program is slow and I don’t know why”.',
      'tracemalloc: memory keeps growing, or a job runs out of memory.',
      'py-spy / Scalene: profiling a running service or a long job without restarting it.',
    ],
    avoid: [
      'Micro-benchmarking code that isn’t on the hot path.',
      'Comparing timings taken on different machines, Python versions or data.',
      'Leaving cProfile or tracemalloc enabled in production code paths.',
      'Treating profiler percentages as exact — the observer effect distorts them.',
    ],
  },
  comparison: {
    title: 'Which measuring tool?',
    headers: ['tool', 'answers', 'granularity', 'overhead', 'in this sandbox'],
    rows: [
      ['time.perf_counter', 'how long did this block take?', 'whatever you wrap', 'negligible', 'yes'],
      ['timeit', 'which snippet is faster?', 'one statement', 'none on the snippet itself', 'yes'],
      ['cProfile + pstats', 'which functions take the time?', 'function', 'noticeable on call-heavy code', 'yes'],
      ['tracemalloc', 'which lines hold memory?', 'line / traceback', 'noticeable on allocation-heavy code', 'yes'],
      ['py-spy', 'what is this running process doing?', 'function / line (sampled)', 'low', 'no (static)'],
      ['Scalene', 'CPU and memory per line, Python vs native', 'line (sampled)', 'low to moderate', 'no (static)'],
    ],
    note: py`Overheads are described qualitatively on purpose: they depend on the workload. Measure them yourself if they matter.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'profiling-q1',
      type: 'mcq',
      prompt: 'Which clock should you use to measure how long a block of code takes?',
      options: [
        { text: 'time.time()', why: 'That’s the wall clock: it can be adjusted (e.g. by time synchronisation) during your measurement, and may have lower resolution.' },
        'time.perf_counter()',
        { text: 'datetime.now()', why: 'Also wall-clock time, with extra object overhead — fine for timestamps, not for measuring durations.' },
        { text: 'time.process_time()', why: 'That measures CPU time of the process, not elapsed time — it would ignore time spent waiting on I/O.' },
      ],
      answer: 1,
      explanation: py`\`perf_counter\` is monotonic and has the highest available resolution. Its value has no meaning on its own — subtract two readings.`,
    },
    {
      id: 'profiling-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import cProfile
import pstats

def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

with cProfile.Profile() as profiler:
    fib(5)

profile = pstats.Stats(profiler).get_stats_profile()
print(profile.func_profiles["fib"].ncalls)`,
      answer: '15/1',
      accept: ['15/1'],
      explanation: py`\`fib(5)\` makes 15 calls in total; only the first one is **primitive** (not made from inside another \`fib\` call). pstats writes that as \`total/primitive\` — the same notation as the \`ncalls\` column of the printed table.`,
    },
    {
      id: 'profiling-q3',
      type: 'bug',
      prompt: 'This benchmark crashes with a NameError. Click the line that causes it.',
      code: py`import timeit

def slugify(title):
    return title.lower().replace(" ", "-")

title = "Ten Tips For Faster Python"
seconds = timeit.timeit("slugify(title)", number=10_000)
print(f"{seconds / 10_000 * 1e6:.2f} µs per call")`,
      answerLine: 7,
      explanation: py`A string statement is compiled and run inside timeit's own namespace, where \`slugify\` and \`title\` don't exist: \`NameError: name 'slugify' is not defined\`. Pass \`globals=globals()\`, or time a callable: \`timeit.timeit(lambda: slugify(title), number=10_000)\`.`,
    },
    {
      id: 'profiling-q4',
      type: 'fill',
      prompt: 'Complete the code: show the 10 functions with the largest time **including the functions they call**, then start memory tracing.',
      code: py`stats = pstats.Stats(profiler).strip_dirs()
stats.sort_stats("___").print_stats(10)

tracemalloc.___()
before = tracemalloc.take_snapshot()`,
      answer: [['cumulative', 'cumtime'], ['start']],
      explanation: py`\`"cumulative"\` (alias \`"cumtime"\`) sorts by time including sub-calls. \`tracemalloc.start()\` must run before \`take_snapshot()\`, otherwise you get a RuntimeError.`,
    },
    {
      id: 'profiling-q5',
      type: 'mcq',
      prompt: '`main()` has cumtime 2.0 s and tottime 0.01 s. `score()` has cumtime 1.6 s and tottime 1.5 s. Where should you look first?',
      options: [
        { text: 'main(), because it has the largest cumtime', why: 'main’s cumtime is large only because it contains everything else; its own code took 0.01 s.' },
        'score(), because most of the time is spent in its own code',
        { text: 'Neither: cumtime and tottime should add up, so the profile is broken', why: 'They aren’t meant to add up: cumtime includes sub-calls, tottime doesn’t.' },
      ],
      answer: 1,
      explanation: py`High **tottime** marks code that is itself slow. A caller with a high cumtime but tiny tottime is just a container for the expensive work.`,
    },
    {
      id: 'profiling-q6',
      type: 'mcq',
      prompt: 'Under cProfile, a function made of thousands of tiny helper calls looks much slower than a loop of the same total work done inside one built-in. Why?',
      options: [
        { text: 'cProfile only measures Python code, so built-ins are reported as zero', why: 'Built-in calls appear as their own rows with their own times.' },
        'cProfile adds overhead to every function call, so call-heavy code is inflated more — the observer effect',
        { text: 'Helper functions are always slower in Python, profiler or not', why: 'Calls do cost something, but the profiler exaggerates the difference; measure without it to know the real gap.' },
      ],
      answer: 1,
      explanation: py`Every call and return triggers profiler bookkeeping. That distorts relative costs, which is why you confirm a hotspot's improvement with a plain timer afterwards.`,
    },
    {
      id: 'profiling-q7',
      type: 'short',
      prompt: 'Why does the timeit documentation suggest looking at the minimum of several repeats rather than the average?',
      answer: py`Python itself doesn't get randomly faster or slower; slower runs are mostly caused by other things interfering — other processes, interrupts, caches being cold. The fastest run is the one closest to the code's true cost on that machine, so min() is the most reproducible number. The average mixes in noise.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'best-time',
      title: 'A best-of-N stopwatch',
      difficulty: 'intermediate',
      prompt: py`Write \`best_time(func, repeat=5)\` that:

1. calls \`func()\` exactly \`repeat\` times;
2. times **each** call with \`time.perf_counter()\` — read it once right before and once right after the call (use \`import time\` and call \`time.perf_counter()\`, so the tests can replace the clock);
3. returns the **smallest** duration in seconds;
4. raises \`ValueError\` if \`repeat\` is less than 1.

The tests use a fake clock, so they never depend on how fast your computer is.`,
      files: {
        'main.py': py`import time


def best_time(func, repeat=5):
    # TODO: repeat, keep the fastest, validate repeat
    start = time.perf_counter()
    func()
    return time.perf_counter() - start


if __name__ == "__main__":
    data = list(range(20_000, 0, -1))
    print(f"sorted(): {best_time(lambda: sorted(data)) * 1000:.3f} ms")
`,
      },
      hints: [
        'Check repeat first and raise ValueError("repeat must be at least 1") if it is too small.',
        'Loop repeat times; inside, read the clock, call func(), read the clock again, and remember the duration.',
        'best = min(best, time.perf_counter() - start), starting from best = float("inf") — or collect durations in a list and return min(durations).',
      ],
      solution: {
        explanation: py`Each iteration measures one call between two \`perf_counter()\` readings, and the function keeps the minimum — the run least disturbed by the rest of the system. Calling \`time.perf_counter()\` through the module (not \`from time import perf_counter\`) means a test can swap the clock with \`unittest.mock.patch\` and feed it fixed numbers: that's how you test timing code without flaky sleeps (see [mocking](lesson:mocking)). This is a simplified version of what \`timeit.repeat(..., number=1)\` does; timeit also disables garbage collection and lets you run each measurement many times.`,
        files: {
          'main.py': py`import time


def best_time(func, repeat=5):
    if repeat < 1:
        raise ValueError("repeat must be at least 1")
    best = float("inf")
    for _ in range(repeat):
        start = time.perf_counter()
        func()
        best = min(best, time.perf_counter() - start)
    return best


if __name__ == "__main__":
    data = list(range(20_000, 0, -1))
    print(f"sorted(): {best_time(lambda: sorted(data)) * 1000:.3f} ms")
`,
        },
      },
      tests: [
        { name: 'calls func exactly `repeat` times', code: py`calls = []
best_time(lambda: calls.append(1), repeat=3)
assert len(calls) == 3` },
        { name: 'repeats 5 times by default', code: py`calls = []
best_time(lambda: calls.append(1))
assert len(calls) == 5` },
        { name: 'returns the fastest run (fake clock: runs of 3 s, 2 s, 5 s)', code: py`from unittest import mock
with mock.patch("time.perf_counter", side_effect=[0.0, 3.0, 10.0, 12.0, 20.0, 25.0]):
    assert best_time(lambda: None, repeat=3) == 2.0` },
        { name: 'rejects repeat < 1', code: py`with raises(ValueError):
    best_time(lambda: None, repeat=0)` },
      ],
    },
    {
      id: 'call-counts',
      title: 'Count calls with cProfile',
      difficulty: 'advanced',
      prompt: py`Write \`call_counts(func)\` that profiles **one** call of \`func()\` with \`cProfile\` and returns a dict mapping **function name → total number of calls**, for functions defined in \`main.py\` only.

- Use \`pstats.Stats(profiler).get_stats_profile().func_profiles\`: a dict of \`name → FunctionProfile\`, where each profile has \`.file_name\` and \`.ncalls\`.
- Keep only entries whose \`file_name\` ends with \`"main.py"\`.
- \`ncalls\` is a **string**: \`"4"\`, or \`"25/1"\` for recursive functions (total/primitive). Store the **total** as an \`int\`.

For example \`call_counts(checkout)\` returns \`{"checkout": 1, "price_of": 4, "apply_discount": 1}\`.`,
      files: {
        'main.py': py`import cProfile
import pstats

PRICES = {"tea": 3.5, "mug": 8.0, "cake": 12.0}


def price_of(item):
    return PRICES[item]


def apply_discount(total):
    return total * 0.9 if total > 20 else total


def checkout():
    basket = ["tea", "mug", "cake", "tea"]
    return apply_discount(sum(price_of(item) for item in basket))


def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def call_counts(func):
    # TODO: profile func(), then build {name: total_calls} for main.py functions
    return {}


if __name__ == "__main__":
    print(call_counts(checkout))
    print(call_counts(lambda: fib(6)))
`,
      },
      hints: [
        'with cProfile.Profile() as profiler: func() — then stats = pstats.Stats(profiler).get_stats_profile().',
        'Loop over stats.func_profiles.items() and skip profiles whose file_name does not end with "main.py".',
        'int(profile.ncalls.split("/")[0]) turns both "4" and "25/1" into the total.',
      ],
      solution: {
        explanation: py`\`get_stats_profile()\` (3.9+) exposes the same data as the printed table in a structured form, so you can assert on it — handy for performance regression tests that count calls instead of timing them. Filtering by file keeps out rows for built-ins (\`{built-in method builtins.sum}\`) and the profiler's own \`__exit__\`. The \`"25/1"\` notation is pstats' way of reporting recursion: 25 calls in total, 1 primitive call that started it. Note how \`<genexpr>\` appears too: the generator expression in \`checkout\` runs as its own frame.`,
        files: {
          'main.py': py`import cProfile
import pstats

PRICES = {"tea": 3.5, "mug": 8.0, "cake": 12.0}


def price_of(item):
    return PRICES[item]


def apply_discount(total):
    return total * 0.9 if total > 20 else total


def checkout():
    basket = ["tea", "mug", "cake", "tea"]
    return apply_discount(sum(price_of(item) for item in basket))


def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def call_counts(func):
    with cProfile.Profile() as profiler:
        func()
    profile = pstats.Stats(profiler).get_stats_profile()
    counts = {}
    for name, fp in profile.func_profiles.items():
        if fp.file_name.endswith("main.py"):
            counts[name] = int(fp.ncalls.split("/")[0])
    return counts


if __name__ == "__main__":
    print(call_counts(checkout))
    print(call_counts(lambda: fib(6)))
`,
        },
      },
      tests: [
        { name: 'checkout calls price_of 4 times', code: py`counts = call_counts(checkout)
assert counts.get("checkout") == 1
assert counts.get("price_of") == 4
assert counts.get("apply_discount") == 1` },
        { name: 'recursive calls are counted in total ("25/1" → 25)', code: py`assert call_counts(lambda: fib(6)).get("fib") == 25` },
        { name: 'only functions from main.py are included', code: py`counts = call_counts(checkout)
assert counts, 'Return the counts dict'
assert not any("built-in" in name or name == "__exit__" for name in counts), 'Filter by file_name'` },
        { name: 'values are ints', code: py`assert all(type(v) is int for v in call_counts(checkout).values())` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'profiling-measure-first',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Someone says “this endpoint is slow, let’s rewrite it in a faster style”. What do you do first?',
      answer: 'Measure. Define what fast enough means, time the endpoint on realistic data, then profile to find where the time actually goes before changing anything — and re-measure afterwards.',
      explanation: py`Intuition about hotspots is unreliable; a profile usually points at one or two functions. Optimising elsewhere adds complexity without benefit.`,
      whyAsked: 'Checks engineering discipline: evidence before effort.',
      mistakes: ['Jumping straight to micro-optimisations', 'Measuring with toy data', 'Not re-measuring after the change'],
      followUps: ['Which tools would you use?', 'How do you know when to stop?'],
      modelAnswer: 'Before touching the code I’d agree on a target — say, p95 under 300 milliseconds — and measure the endpoint as it is, with realistic data. If it misses the target, I profile it, with cProfile locally or a sampling profiler like py-spy against a real process, to see where the time goes. Usually one or two functions dominate, often because of an algorithm or a slow query rather than coding style. I change one thing, run the tests, and measure again; when we hit the target, I stop.',
    },
    {
      id: 'profiling-read-table',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Here is part of a cProfile table sorted by cumulative time. Which function do you investigate first, and why?',
      code: { lang: 'text', code: py`   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.002    0.002    4.210    4.210 app.py:88(handle_request)
        1    0.010    0.010    4.100    4.100 app.py:40(build_report)
   120000    3.600    0.000    3.900    0.000 app.py:12(normalise)
   120000    0.300    0.000    0.300    0.000 {method 'lower' of 'str' objects}` },
      options: ['handle_request — biggest cumtime', 'build_report — it calls everything else', 'normalise — most of the time is its own code, across 120,000 calls', 'str.lower — it is a built-in'],
      correctOption: 2,
      answer: 'normalise: it has 3.6 s of tottime, so its own code is the cost, and it is called 120,000 times — either make each call cheaper or (often better) call it far fewer times, e.g. by caching or normalising once.',
      explanation: py`The two callers have big cumtime but tiny tottime — they just contain the work. With a hot function called very often, ask both "why is each call slow?" and "why is it called so many times?" (see [optimization techniques](lesson:optimization-techniques)).`,
      whyAsked: 'Reading a profile correctly is the practical skill behind performance work.',
      mistakes: ['Picking the top row of a cumulative sort', 'Ignoring ncalls'],
      followUps: ['How would you check who calls normalise 120,000 times?', 'Would lru_cache help here?'],
      modelAnswer: 'I’d look at normalise. handle_request and build_report have big cumulative times but almost no time in their own code, so they’re just callers. normalise has about 3.6 seconds of tottime and 120,000 calls, so its own code is the cost. There are two levers: make each call cheaper, or call it less — for example normalise each value once, or cache results if inputs repeat. I’d use print_callers to see where the calls come from, and confirm the gain with a plain timer, because cProfile’s per-call overhead inflates call-heavy functions.',
    },
    {
      id: 'profiling-timeit-min',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare timing code with time.time() around one call versus timeit.repeat(). What does timeit do differently, and why report the minimum?',
      answer: 'timeit uses perf_counter (monotonic, high resolution), runs the statement many times per measurement to swamp timer overhead, keeps setup out of the timing, disables GC while timing, and repeats the measurement. The minimum is the least disturbed run, so it is the most reproducible.',
      explanation: py`A single \`time.time()\` sample uses an adjustable wall clock and includes whatever else the machine was doing. Slower repeats reflect interference, not Python getting slower, so \`min()\` is the stable statistic; for distributions of real workloads (latency percentiles), you do want the spread.`,
      whyAsked: 'Distinguishes people who benchmark carefully from those who trust one noisy number.',
      mistakes: ['Reporting the mean of noisy runs as "the" speed', 'Including setup in the timed statement'],
      followUps: ['When is the minimum the wrong statistic?', 'Why might the first run be slower?'],
      modelAnswer: 'time.time() around one call gives a single sample from an adjustable wall clock, polluted by anything else the machine was doing. timeit uses perf_counter, runs the snippet many times per measurement so timer overhead is negligible, keeps setup out of the timing, turns off garbage collection while timing, and repeats the whole measurement. I report the minimum, because slower runs come from interference rather than Python itself, so the fastest is the most reproducible. For real request latency I’d look at percentiles instead, because there the variation is what users feel.',
    },
    {
      id: 'profiling-memory-growth',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A long-running worker’s memory grows steadily until it is killed. How do you find the cause with the standard library?',
      answer: 'Start tracemalloc early (with enough frames), take a snapshot after warm-up, let it process work, take another, and compare_to the first grouped by lineno or traceback. Lines whose size keeps growing hold references — typically an unbounded cache, an ever-growing list or a registry. Fix the ownership, then confirm growth stops.',
      explanation: py`Growth between snapshots is the signal, not absolute size. Group by \`"traceback"\` to see which caller path allocates. Fixes include bounding caches (\`lru_cache(maxsize=...)\`), clearing per-request state and using weak references. tracemalloc doesn't see native allocations made outside Python's allocator.`,
      code: { lang: 'python', code: py`import tracemalloc

tracemalloc.start(25)
baseline = tracemalloc.take_snapshot()
# ... process a few thousand jobs ...
current = tracemalloc.take_snapshot()
for stat in current.compare_to(baseline, "traceback")[:5]:
    print(stat)
    for line in stat.traceback.format()[-4:]:
        print("   ", line)` },
      whyAsked: 'Memory leaks in services are a real operational problem; this tests a methodical approach.',
      mistakes: ['Calling gc.collect() and hoping', 'Looking at one snapshot instead of growth between two', 'Forgetting tracemalloc only sees Python-allocator memory'],
      followUps: ['What if tracemalloc shows nothing growing but RSS still rises?', 'How can an lru_cache cause a leak?'],
      modelAnswer: 'I’d start tracemalloc as early as possible, with something like 25 frames so I get call paths, take a baseline snapshot once the worker is warmed up, let it process real work, and take a second snapshot. compare_to sorted by growth, grouped by traceback, shows which call paths keep accumulating memory — usually an unbounded cache, a list that only grows, or objects registered globally and never removed. I fix the ownership — bound the cache, clear per-job state, maybe use weak references — then repeat the snapshots to confirm the growth has stopped. If tracemalloc shows nothing but process memory still rises, the growth is probably native, and I’d reach for a tool like memray.',
    },
    {
      id: 'profiling-deterministic-vs-sampling',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare deterministic profilers like cProfile with sampling profilers like py-spy. When would you use each?',
      answer: 'cProfile hooks every call and return: exact call counts, function-level times, but overhead that distorts call-heavy code, and you must run the program under it. Sampling profilers inspect the stack periodically: statistical, low overhead, line-level, can attach to running production processes and produce flame graphs. Use cProfile locally to understand a reproducible workload; use sampling in production or for long or hard-to-reproduce slowness.',
      explanation: py`The observer effect is the key trade-off: tracing measures everything but changes timings; sampling barely changes timings but misses very short events and gives estimates.`,
      whyAsked: 'Senior engineers must choose tools that fit the environment, especially production.',
      mistakes: ['Claiming cProfile numbers are exact wall-clock costs', 'Not knowing you can profile a live process'],
      followUps: ['What does a flame graph show?', 'How does the observer effect change cProfile results?'],
      modelAnswer: 'cProfile is deterministic: it hooks every function call and return, so call counts are exact and I get tottime and cumtime per function — but its per-call overhead inflates code with many small calls, and I have to run the program under it. A sampling profiler like py-spy looks at the call stack many times a second from outside the process; results are statistical, but overhead is low, it can attach to a running production process, and it produces flame graphs. So I use cProfile to dig into a workload I can reproduce locally, and a sampling profiler when the problem only shows up in production or in long jobs. Either way, I confirm improvements with plain timing.',
    },
    {
      id: 'profiling-memory-peak',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `memory_peak(func)` that returns `(result, peak_bytes)`: the value `func()` returned and the peak traced memory while it ran. Tracing must be switched off afterwards — even if `func` raises.',
      answer: 'tracemalloc.start(); try: result = func(); peak = tracemalloc.get_traced_memory()[1]; finally: tracemalloc.stop(); return result, peak.',
      explanation: py`\`get_traced_memory()\` returns \`(current, peak)\`. Temporary objects freed before \`func\` returns don't show in *current* but do in *peak*, so peak is the right measure of "how much memory did this need". \`try/finally\` guarantees \`stop()\` runs on errors.`,
      starter: { files: { 'main.py': py`import tracemalloc


def memory_peak(func):
    tracemalloc.start()
    result = func()
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return result, current     # TODO: right number? what if func() raises?


if __name__ == "__main__":
    result, peak = memory_peak(lambda: sum([i * i for i in range(50_000)]))
    print(result, f"{peak / 1024:.0f} KiB")
` } },
      tests: [
        { name: 'returns what func returned', code: py`assert memory_peak(lambda: 42)[0] == 42` },
        { name: 'reports the peak, including temporaries already freed', code: py`result, peak = memory_peak(lambda: len([0] * 100_000))
assert result == 100_000
assert peak >= 100_000 * 4, f"peak was only {peak} bytes: return the peak, not current"` },
        { name: 'tracing stops even if func raises', code: py`import tracemalloc
try:
    memory_peak(lambda: 1 / 0)
except ZeroDivisionError:
    pass
still_tracing = tracemalloc.is_tracing()
tracemalloc.stop()
assert not still_tracing, 'Use try/finally so tracemalloc.stop() always runs'` },
      ],
      solution: { files: { 'main.py': py`import tracemalloc


def memory_peak(func):
    tracemalloc.start()
    try:
        result = func()
        _, peak = tracemalloc.get_traced_memory()
    finally:
        tracemalloc.stop()
    return result, peak


if __name__ == "__main__":
    result, peak = memory_peak(lambda: sum([i * i for i in range(50_000)]))
    print(result, f"{peak / 1024:.0f} KiB")
` } },
      hints: ['get_traced_memory() returns a (current, peak) tuple.', 'Put the call and the measurement inside try:, and tracemalloc.stop() in finally:.'],
      whyAsked: 'Tests knowledge of tracemalloc plus robust resource handling.',
      mistakes: ['Returning current instead of peak', 'Leaving tracing on when func raises'],
      followUps: ['How would you turn this into a context manager?', 'What allocations would tracemalloc not see?'],
      modelAnswer: 'I start tracemalloc, then in a try block call func and read get_traced_memory, which gives current and peak. I want the peak, because temporaries that were freed before func returned still counted towards what it needed. The stop call goes in a finally block so tracing is switched off even if func raises — tracing has a real overhead and shouldn’t leak into the rest of the program. Then I return the result and the peak. As a refinement I’d wrap it in a context manager, and remember that tracemalloc only sees memory allocated through Python’s allocators.',
    },
  ],

  takeaways: [
    'Measure before optimising: set a goal, time it, profile, change one thing, re-measure and re-test.',
    'time.perf_counter() times a block; timeit compares small snippets — keep setup out, repeat, and report the minimum.',
    'cProfile + pstats show per-function ncalls, tottime (own code) and cumtime (own code + callees); hotspots have high tottime or huge ncalls.',
    'ncalls "25/1" means 25 calls in total, 1 primitive (non-recursive) call.',
    'tracemalloc snapshots and compare_to show which lines hold — and keep adding — memory; stop tracing when done.',
    'Profilers change what they measure (the observer effect): use them to find where, plain timers to confirm how much.',
    'Sampling profilers like py-spy and Scalene profile running programs with low overhead; tests should never depend on exact timings.',
  ],
}
