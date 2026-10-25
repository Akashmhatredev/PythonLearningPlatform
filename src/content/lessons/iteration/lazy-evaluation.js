// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PIPELINE = py`from itertools import islice

stats = {"lines_read": 0}


def read_lines(path):
    """READ: yield one non-blank line at a time, counting as we go."""
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                stats["lines_read"] += 1
                yield line


def parse(line):
    date, time, level, service, message = line.split(maxsplit=4)
    return {"time": time, "level": level, "service": service, "message": message}


# 1. build the pipeline: READ -> TRANSFORM -> FILTER -> FORMAT (nothing runs yet)
records = (parse(line) for line in read_lines("server.log"))
errors = (r for r in records if r["level"] == "ERROR")
report = (f'{r["time"]} [{r["service"]}] {r["message"]}' for r in errors)
print("pipeline built; lines read so far:", stats["lines_read"])

# 2. AGGREGATE: the for loop pulls records through, one at a time
for entry in report:
    print(f"  {entry}")
print("after the report; lines read:", stats["lines_read"])

# 3. built-ins consume generators lazily, and any()/all() stop early
stats["lines_read"] = 0
has_500 = any(" 500 " in line for line in read_lines("server.log"))
print("any 500 errors?", has_500, "| lines read:", stats["lines_read"])

api_ms = (int(line.split()[-1].removesuffix("ms"))
          for line in read_lines("server.log") if " api " in line)
print("slowest API call:", max(api_ms), "ms")

# 4. islice: a lazy "slice" of the first few lines
stats["lines_read"] = 0
for line in islice(read_lines("server.log"), 2):
    print("preview:", line)
print("lines read for the preview:", stats["lines_read"])
`

const SERVER_LOG = py`2026-10-01 09:00:01 INFO auth user=ada login ok
2026-10-01 09:00:07 WARN disk usage=81%
2026-10-01 09:01:12 ERROR db timeout after 30s
2026-10-01 09:01:15 INFO auth user=ben login ok
2026-10-01 09:02:40 ERROR auth user=cy bad password
2026-10-01 09:03:02 INFO api GET /orders 200 120ms
2026-10-01 09:03:05 INFO api GET /orders 200 95ms
2026-10-01 09:03:09 ERROR api GET /report 500 2300ms
2026-10-01 09:04:00 INFO api POST /orders 201 310ms
2026-10-01 09:04:30 WARN api GET /search 200 1800ms
`

export default {
  id: 'lazy-evaluation',
  title: 'Generator expressions & lazy pipelines',
  summary: 'Generator expressions and chained generators process data one item at a time, so pipelines over huge or endless data use almost no memory and stop as soon as they have an answer.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['generators', 'comprehensions'],
  related: ['iterators', 'itertools', 'map-filter-reduce', 'reading-writing-files', 'csv-data', 'optimization-techniques', 'profiling', 'project-log-analyzer', 'closures'],
  tags: ['generator expression', 'genexp', 'lazy evaluation', 'pipeline', 'streaming', 'memory', 'any', 'all', 'sum', 'next', 'short-circuit', 'islice', 'late binding', 'PEP 289'],
  apis: [
    { name: '(expr for x in iterable if cond)', summary: 'Generator expression: a lazy, single-use iterator — a comprehension in round brackets.' },
    { name: 'sum(genexp) / max() / min()', summary: 'Consume an iterable one item at a time; max/min accept default= for empty input.' },
    { name: 'any(iterable) / all(iterable)', summary: 'Short-circuit: any stops at the first truthy item, all at the first falsy item.' },
    { name: 'next(genexp, default)', summary: 'Returns the first item a generator produces — the idiomatic "find first match".' },
    { name: 'itertools.islice(iterable, stop) / (it, start, stop[, step])', summary: 'Lazily takes a slice of any iterator; no negative indexes.' },
    { name: 'map(func, it) / filter(pred, it)', summary: 'Built-in lazy transform and filter stages, equivalent to simple generator expressions.' },
  ],
  docs: [
    { label: 'Language reference — generator expressions', url: 'https://docs.python.org/3/reference/expressions.html#generator-expressions' },
    { label: 'Functional programming HOWTO — generator expressions', url: 'https://docs.python.org/3/howto/functional.html#generator-expressions-and-list-comprehensions' },
    { label: 'itertools.islice', url: 'https://docs.python.org/3/library/itertools.html#itertools.islice' },
    { label: 'Built-in functions — any(), all(), sum(), next()', url: 'https://docs.python.org/3/library/functions.html#any' },
    { label: 'PEP 289 — generator expressions', url: 'https://peps.python.org/pep-0289/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Swap the square brackets of a [list comprehension](lesson:comprehensions) for round ones and you get a **generator expression**:`,
    { code: py`prices = [4.0, 12.5, 3.2]

eager = [p * 1.2 for p in prices]   # a list: every value computed NOW
lazy = (p * 1.2 for p in prices)    # a generator: values computed WHEN ASKED

print(eager)        # [4.8, 15.0, 3.84]
print(lazy)         # <generator object <genexpr> at 0x...>
print(sum(lazy))    # 23.64 — computed one value at a time as sum() asked`, lang: 'python', title: 'one bracket changes everything' },
    py`That's **lazy evaluation**: don't compute a value until someone actually needs it. A generator expression is a tiny, anonymous [generator](lesson:generators) — it produces one value per \`next()\` and never holds the whole result.`,
    py`The real power appears when you **chain** lazy stages into a **pipeline**: read → filter → transform → aggregate. Each item flows through every stage before the next item is even read, so a 50 GB log file can be analysed with the memory of a single line — and a search can stop the moment it finds what it wants.`,
  ],
  why: [
    py`**Memory.** \`sum([x * x for x in range(10_000_000)])\` builds a ten-million-item list just to add it up and throw it away. \`sum(x * x for x in range(10_000_000))\` keeps one number at a time. Same answer, a tiny fraction of the memory.`,
    py`**Speed to the answer.** \`any(...)\`, \`all(...)\` and \`next(...)\` stop as soon as they know the result. With a lazy input, the work after that point is never done. With a list, it was all done up front for nothing.`,
    py`**Endless or slow sources.** Sensor feeds, paginated APIs, \`itertools.count()\` — data that never ends or arrives slowly can only be processed lazily.`,
    py`**Clean design.** Each stage is a small, focused, testable piece that takes an iterable and returns one. You compose them like LEGO bricks instead of writing one giant loop.`,
  ],
  eli15: [
    py`Imagine making toast for 200 people. The **eager** way: toast all 200 slices, stack them on a giant pile, then butter them all, then serve them all. You need a table big enough for 200 slices, and the first person waits for everything.`,
    py`The **lazy** way is an assembly line: one slice goes in the toaster, gets buttered, gets served — then the next. You only ever need space for one slice, and the first person eats almost immediately. If people stop being hungry after 30 slices, you just stop — the other 170 were never toasted.`,
    py`A generator expression is one station on that assembly line. A pipeline is several stations connected together.`,
  ],
  analogy: {
    title: 'The sushi conveyor belt',
    body: [
      py`At a conveyor-belt sushi bar, the chef doesn't make every dish on the menu in advance. Plates are made and sent round one at a time, and each diner takes what they want as it passes.`,
      py`Each station on the belt does one job — the chef makes, a checker removes anything not fresh, a server adds the sauce — and a plate passes through *all* stations before the next one starts. When the diner is full and says stop, nothing more is made.`,
    ],
    mapping: [
      ['the chef making one plate at a time', 'the source: a generator reading one line at a time'],
      ['the freshness checker', 'a filter stage: (r for r in records if r.ok)'],
      ['the sauce station', 'a transform stage: (fix(r) for r in records)'],
      ['the diner eating', 'the consumer: a for loop, sum(), max(), any()'],
      ['"I\'m full!"', 'short-circuiting: any() / next() / break stops the whole line'],
      ['a buffet with every dish pre-made', 'an eager list: everything computed and held at once'],
    ],
  },
  visual: {
    type: 'performance',
    title: 'List vs generator: measure the memory yourself',
    props: { demo: 'generator-memory' },
    alt: 'An interactive lab that runs real Python in the browser and measures the memory used by a list comprehension and by an equivalent generator expression for the same number of items, showing that the list grows with the number of items while the generator stays small.',
    caption: py`Every number here is measured live by Python in your browser — try several sizes. The list's memory grows with the number of items; the generator's stays flat, because it only ever holds its paused frame and the current item.`,
    after: [
      { callout: 'note', title: 'CPython detail', text: py`Memory figures come from tools like \`sys.getsizeof\` and \`tracemalloc\`, which report CPython's own bookkeeping. Exact byte counts differ between Python versions, platforms and implementations — the *shape* of the result (one grows, one doesn't) is what carries over. See [profiling](lesson:profiling) to measure your own code.` },
    ],
  },
  syntax: [
    py`#### Generator expressions`,
    { code: py`readings = [12.5, 18.0, 7.25, 30.5]

warm = (r for r in readings if r > 10)            # filter
doubled = (r * 2 for r in readings)               # transform
labels = (f"{r:.1f}°C" for r in readings)         # format

print(next(warm), next(warm))    # 12.5 18.0 — one at a time
print(list(labels))              # ['12.5°C', '18.0°C', '7.2°C', '30.5°C']`, lang: 'python', title: 'same clauses as a comprehension' },
    py`Everything you know about comprehensions applies — \`for\`, \`if\`, several \`for\` clauses, conditional expressions. The differences: round brackets, the result is a lazy **[iterator](lesson:iterators)**, and it can be consumed only **once**.`,
    py`#### The bracket shortcut`,
    { code: py`readings = [12.5, 18.0, 7.25, 30.5]

total = sum(r for r in readings)                         # sole argument: brackets optional
warmest = max((r for r in readings if r > 10), default=None)   # more arguments: brackets required
top = sorted((r for r in readings), reverse=True)        # same here`, lang: 'python', title: 'when you can drop the parentheses' },
    py`When a generator expression is the **only** argument of a call, its own parentheses can be dropped. With any other argument, it must be wrapped, otherwise you get \`SyntaxError: Generator expression must be parenthesized\`.`,
    py`#### Consumers: who pulls the items through`,
    { code: py`orders = [25.0, 140.0, 60.0, 310.0]

sum(o for o in orders)                    # 535.0 — adds as it goes
max(o for o in orders if o < 100)         # 60.0
any(o > 300 for o in orders)              # True  — stops at 310.0
all(o > 20 for o in orders)               # True  — would stop at the first False
next((o for o in orders if o > 100), None)  # 140.0 — first match, or None
", ".join(f"£{o:.0f}" for o in orders)    # '£25, £140, £60, £310'`, lang: 'python', title: 'built-ins that accept any iterable' },
    py`- **Lazy and one-pass:** \`sum\`, \`min\`, \`max\`, \`any\`, \`all\`, \`next\`, \`"".join\`, \`for\` loops, \`collections.Counter\`, \`dict()\`, \`set()\`.
- **Short-circuit:** \`any\` stops at the first truthy item, \`all\` at the first falsy one, \`next\` after one item.
- **Must see everything first:** \`sorted\`, \`list\`, \`tuple\`, \`reversed(list(...))\`, \`len(list(...))\` — laziness ends here.`,
    py`#### itertools.islice: slicing for iterators`,
    { code: py`from itertools import count, islice

squares = (n * n for n in count(1))         # infinite!
print(list(islice(squares, 5)))             # [1, 4, 9, 16, 25] — first five
print(list(islice("abcdefgh", 2, 6)))       # ['c', 'd', 'e', 'f'] — like [2:6]
print(list(islice(range(20), 0, 10, 3)))    # [0, 3, 6, 9] — with a step`, lang: 'python', title: 'take, skip and step lazily' },
    py`You can't write \`gen[:5]\` — generators have no indexes. \`islice(iterable, stop)\` or \`islice(iterable, start, stop, step)\` gives the same effect lazily. It *consumes* the items it skips, and it doesn't support negative values (an iterator has no "end" to count back from). More in [itertools](lesson:itertools).`,
    py`#### A pipeline`,
    { code: py`log = [
    "INFO boot ok",
    "ERROR disk full",
    "INFO user login",
    "ERROR net timeout",
]

lines = (line.strip() for line in log)                    # read
errors = (line for line in lines if line.startswith("ERROR"))   # filter
parts = (line.split(maxsplit=2) for line in errors)       # transform
messages = (msg for _level, _area, msg in parts)          # transform

print(list(messages))   # ['full', 'timeout'] — aggregate`, lang: 'python', title: 'read → filter → transform → aggregate' },
    py`Each line *defines* a stage; nothing runs until the final \`list()\` pulls. In real code the first stage would read a file or a database cursor, and the stages are often generator functions with names.`,
  ],
  walkthrough: {
    title: 'Reading the log pipeline line by line',
    lang: 'python',
    code: PIPELINE,
    intro: py`This is the program in the playground below (it reads \`server.log\`). Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [6, 13], text: py`The **source** stage: a generator function that opens the file and yields one stripped line at a time. It bumps a counter so we can *see* how much of the file each consumer really reads.` },
      { lines: [16, 18], text: py`\`parse\` is a plain function that turns one line into a dict. Pipelines mix ordinary functions (per-item logic) with generators (the flow).` },
      { lines: [22, 25], text: py`Three generator expressions, each feeding the next. Creating them calls \`iter()\` on the source but reads **nothing**: the program prints \`lines read so far: 0\`.` },
      { lines: [28, 30], text: py`The \`for\` loop asks \`report\` for an item → \`report\` asks \`errors\` → \`errors\` asks \`records\` until one is an ERROR → \`records\` asks \`read_lines\` for lines. Each line travels the whole pipeline before the next is read. By the end, all 10 lines were read.` },
      { lines: [33, 35], text: py`\`any()\` stops at the first \`True\`. The first \`" 500 "\` is on line 8 of the log, so lines 9 and 10 are never read: \`lines read: 8\`.` },
      { lines: [37, 39], text: py`A generator expression can span lines inside its brackets. \`max()\` pulls every API timing through and keeps only the largest so far — one number in memory, not a list of timings.` },
      { lines: [42, 45], text: py`\`islice(..., 2)\` stops after two items, so only two lines are read from the file. The preview costs the same whether the log has ten lines or ten million.` },
    ],
  },
  playground: {
    title: 'Lazy log pipeline',
    objective: 'Run it and watch the "lines read" counter: it proves which consumers read the whole file and which stop early.',
    files: { 'main.py': PIPELINE, 'server.log': SERVER_LOG },
    expected: py`\`\`\`text
pipeline built; lines read so far: 0
  09:01:12 [db] timeout after 30s
  09:02:40 [auth] user=cy bad password
  09:03:09 [api] GET /report 500 2300ms
after the report; lines read: 10
any 500 errors? True | lines read: 8
slowest API call: 2300 ms
preview: 2026-10-01 09:00:01 INFO auth user=ada login ok
preview: 2026-10-01 09:00:07 WARN disk usage=81%
lines read for the preview: 2
\`\`\``,
    experiments: [
      {
        id: 'count-level',
        task: py`Write a function \`count_level(path, level)\` that returns how many lines of the log have that level (\`"INFO"\`, \`"WARN"\` or \`"ERROR"\`). Use \`sum()\` with a generator expression over \`read_lines(path)\`.`,
        hint: py`Count by summing ones: \`sum(1 for line in read_lines(path) if parse(line)["level"] == level)\`.`,
        tests: [
          { name: 'counts each level', code: py`assert callable(ns.get('count_level')), 'Define count_level(path, level)'
assert count_level("server.log", "INFO") == 5
assert count_level("server.log", "WARN") == 2
assert count_level("server.log", "ERROR") == 3` },
        ],
        explain: py`\`sum(1 for ...)\` is the lazy way to count matches: it never builds a list of matching lines, just adds 1 per match. (\`sum(... == level for ...)\` also works, because \`True\` counts as 1.)`,
      },
      {
        id: 'first-slow',
        task: py`Create a variable \`first_slow\` holding the **first** log line from the \`api\` service whose time is over 1000 ms, or \`None\` if there isn't one. Use \`next()\` with a generator expression and a default.`,
        hint: py`\`next((line for line in read_lines("server.log") if " api " in line and int(line.split()[-1].removesuffix("ms")) > 1000), None)\``,
        tests: [
          { name: 'first_slow is the 2300 ms line', code: py`assert ns.get('first_slow') == "2026-10-01 09:03:09 ERROR api GET /report 500 2300ms"` },
        ],
        explain: py`\`next(genexp, default)\` is Python's "find first" idiom. It pulls items until the condition matches, then stops — so only the first 8 lines are read. The extra parentheses around the generator expression are required because \`next\` gets a second argument.`,
      },
      {
        id: 'preview-function',
        task: py`Write \`preview(path, n)\` that returns a **list** of the first \`n\` lines of the file using \`islice\` — and reads no more than \`n\` lines.`,
        hint: py`\`return list(islice(read_lines(path), n))\``,
        tests: [
          { name: 'returns the first 3 lines', code: py`assert callable(ns.get('preview')), 'Define preview(path, n)'
result = preview("server.log", 3)
assert len(result) == 3 and result[0].startswith("2026-10-01 09:00:01")` },
          { name: 'reads only n lines', code: py`stats["lines_read"] = 0
preview("server.log", 4)
assert stats["lines_read"] == 4, f'read {stats["lines_read"]} lines instead of 4'` },
        ],
        explain: py`\`islice\` asks its source for exactly \`n\` items and then stops, so \`read_lines\` stays paused after line \`n\`. Compare with \`list(read_lines(path))[:n]\`, which reads the entire file and then throws most of it away.`,
      },
      {
        id: 'exhausted',
        task: py`After the report loop, add \`print(list(report))\` and \`print(list(errors))\`. Predict, then run. Then try printing \`stats["lines_read"]\` right after building a *second* pipeline but before consuming it.`,
        hint: py`What happens to a generator after something has consumed it?`,
        explain: py`Both lists are \`[]\`: the \`for\` loop already drained \`report\`, which drained \`errors\` and \`records\`. Generator expressions are single-use, like every generator. And building a new pipeline still reads 0 lines — work only happens when something pulls.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch one item flow through every stage',
    props: {
      code: py`def read(lines):
    for line in lines:
        print("  read:", line)
        yield line


log = ["INFO boot", "ERROR disk", "INFO ok", "ERROR net"]
errors = (line for line in read(log) if line.startswith("ERROR"))
codes = (line.split()[1].upper() for line in errors)
print("pipeline built, nothing read yet")
print("first:", next(codes))
print("rest:", list(codes))
`,
      notes: {
        8: 'Creating the generator expression calls `read(log)` (the outermost iterable is evaluated immediately) but reads **nothing** — `read` is itself a generator.',
        10: 'Two generator objects exist, both *created*, and no "read:" line has been printed.',
        11: '`next(codes)` asks `codes` → which asks `errors` → which asks `read`. Watch three generator frames stack up.',
        4: '`read` yields one line and pauses. `errors` checks it: "INFO boot" fails the filter, so `errors` asks `read` for another.',
        12: '`list()` keeps pulling until every stage is exhausted. Each line still travels the whole chain on its own.',
      },
    },
    alt: 'A step-by-step trace of a three-stage lazy pipeline. After the two generator expressions are created, nothing has been read. next(codes) stacks three generator frames — codes, errors and read. read yields "INFO boot", which errors rejects, then "ERROR disk", which errors passes to codes, which yields "DISK". list(codes) then resumes the chain, which reads "INFO ok" (rejected) and "ERROR net" (passed, giving "NET"), until read is exhausted and all generators close.',
    caption: py`Watch the call stack: one \`next()\` call reaches through **all** the stages, and each item is read, filtered and transformed before the next one is touched.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A generator expression is shorthand for a generator function that is defined and called in one go. These two are equivalent:`,
      { code: py`readings = [12.5, 18.0, 7.25]

warm = (r * 2 for r in readings if r > 10)


def _warm(iterable):
    for r in iterable:
        if r > 10:
            yield r * 2


warm_too = _warm(readings)
print(list(warm), list(warm_too))   # [25.0, 36.0] [25.0, 36.0]`, lang: 'python', title: 'what a generator expression really is' },
      py`Notice that \`readings\` is *passed in* when the generator is created. That detail explains the biggest laziness surprise — next section.`,
    ],
    technical: [
      py`**Two evaluation times.** In a generator expression, the **outermost iterable** (after the first \`in\`) is evaluated **immediately**, and \`iter()\` is called on it right away — that's why \`(x for x in 5)\` raises \`TypeError\` at once. **Everything else** — the expression, the \`if\` conditions, any inner \`for\` iterables — runs later, each time an item is requested, using whatever the variables hold **at that moment**:`,
      { code: py`limit = 10
small = (n for n in [5, 15, 8] if n < limit)
limit = 6                 # changed BEFORE anyone consumed the generator
print(list(small))        # [5] — the filter saw limit == 6, not 10`, lang: 'python', title: 'late binding in action' },
      py`This "late binding" is the same rule as for [closures](lesson:closures): the generator looks names up when it runs, not when it was written. It bites hardest when you create several generators in a loop that all use the loop variable.`,
      py`**Short-circuiting is real.** \`any(gen)\` calls \`next()\` until an item is truthy and then stops — the rest of the generator (and every stage behind it) is simply never resumed. With \`any([...])\` the list comprehension has already done all the work before \`any\` starts.`,
      py`**islice consumes what it skips.** \`islice(it, 5, 10)\` must call \`next()\` five times and discard the results to reach item 5 — iterators can't jump. On a shared iterator, those items are gone.`,
      { callout: 'note', title: 'CPython detail', text: py`Each generator expression creates a real generator object with its own suspended frame; CPython 3.12's comprehension inlining (PEP 709) deliberately does **not** apply to generator expressions, because they must be able to pause. Resuming a frame for every item has a small per-item cost, which is why, for small inputs that you consume completely, a list comprehension can be slightly faster. Measure with \`timeit\` before optimising either way.` },
    ],
    production: [
      py`**Design pipelines as stages.** Write each stage as a function that takes an iterable and returns an iterator (usually a generator function). Stages stay small, reusable and easy to test with a plain list as input:`,
      { code: py`def non_blank(lines):
    return (line.strip() for line in lines if line.strip())


def parse_csv_rows(lines):
    for line in lines:
        name, score = line.split(",")
        yield name, int(score)


def passing(rows, threshold=50):
    return ((name, score) for name, score in rows if score >= threshold)


# testing a stage needs no file at all:
assert list(passing([("ada", 91), ("ben", 47)])) == [("ada", 91)]
print(list(passing(parse_csv_rows(non_blank(["ada,91", "", "ben,47"])))))   # [('ada', 91)]`, lang: 'python', title: 'composable, testable stages' },
      py`**Know where laziness ends.** Sorting, \`len()\`, reversing and grouping by key need all the data. Keep the lazy part as long as possible and reduce early: \`collections.Counter(gen)\` holds only distinct keys, \`heapq.nlargest(10, gen)\` holds ten items, \`max(gen)\` holds one.`,
      py`**Debug with a peek, not a dump.** \`list(stage)\` inside a pipeline consumes the stage and breaks everything downstream. To look at a few items, print \`list(islice(stage, 3))\` on a *fresh* pipeline, or add a small pass-through stage that logs each item.`,
      py`**Laziness moves side effects and errors.** A pipeline built at line 10 may raise its \`ValueError\` at line 200, where it's consumed, and a file opened by its first stage stays open until the pipeline finishes or is closed. Keep construction and consumption close together, and see [generators](lesson:generators#internals) on resource lifetime.`,
      py`**Where this leads.** The same ideas power real streaming tools: CSV readers ([CSV files](lesson:csv-data)), database cursors, and the [log analyzer project](lesson:project-log-analyzer). The [optimization techniques](lesson:optimization-techniques) lesson puts laziness alongside caching and built-ins.`,
    ],
  },
  mistakes: [
    {
      title: 'Feeding a list comprehension to sum/any/all',
      wrong: { code: py`orders = range(1, 1_000_001)
total = sum([o * 1.2 for o in orders])            # builds a million-item list first
has_big = any([o > 10 for o in orders])           # computes ALL million booleans`, lang: 'python' },
      right: { code: py`orders = range(1, 1_000_001)
total = sum(o * 1.2 for o in orders)              # one value at a time
has_big = any(o > 10 for o in orders)             # stops at the 11th order`, lang: 'python' },
      explanation: py`The square brackets force all the work and all the memory up front — and throw away \`any\`/\`all\`'s ability to stop early. Drop them.`,
    },
    {
      title: 'Using a generator expression twice',
      wrong: { code: py`scores = [70, 85, 90]
curved = (s + 5 for s in scores)
print(max(curved))           # 95
print(sum(curved))           # 0 — already used up`, lang: 'python' },
      right: { code: py`scores = [70, 85, 90]
curved = [s + 5 for s in scores]   # need it twice? make a list
print(max(curved))           # 95
print(sum(curved))           # 260`, lang: 'python' },
      explanation: py`A generator expression is a one-shot iterator. If you need the values more than once (or need \`len()\`), use a list comprehension — or rebuild the generator for each pass.`,
    },
    {
      title: 'Expecting side effects to happen when the generator is created',
      wrong: { code: py`sent = []


def send(email):
    sent.append(email)


emails = ["ada@x.io", "ben@y.io"]
jobs = (send(e) for e in emails)   # nothing is sent!
print(sent)                        # []`, lang: 'python' },
      right: { code: py`sent = []


def send(email):
    sent.append(email)


emails = ["ada@x.io", "ben@y.io"]
for e in emails:                   # actions belong in a loop
    send(e)
print(sent)                        # ['ada@x.io', 'ben@y.io']`, lang: 'python' },
      explanation: py`A generator expression does nothing until it is consumed. Using one "for its side effects" means they may never happen at all. Use a \`for\` loop for actions.`,
    },
    {
      title: 'Changing a variable the generator depends on',
      wrong: { code: py`threshold = 100
big_orders = (o for o in [80, 120, 150] if o > threshold)
threshold = 130                      # someone "reuses" the name
print(list(big_orders))              # [150] — not [120, 150]`, lang: 'python' },
      right: { code: py`def orders_over(orders, threshold):
    return (o for o in orders if o > threshold)   # threshold is fixed per call


big_orders = orders_over([80, 120, 150], 100)
print(list(big_orders))              # [120, 150]`, lang: 'python' },
      explanation: py`Conditions are evaluated lazily, with the variable's value at consumption time. Wrapping the generator in a function freezes the values as parameters of that call.`,
    },
    {
      title: 'Leaving out the parentheses next to another argument',
      wrong: { code: py`scores = [70, 85, 90]
ranked = sorted(s for s in scores, reverse=True)   # SyntaxError`, lang: 'python', static: true },
      right: { code: py`scores = [70, 85, 90]
ranked = sorted((s for s in scores), reverse=True)
print(ranked)    # [90, 85, 70]`, lang: 'python' },
      explanation: py`The bracket-free form is only allowed when the generator expression is the sole argument. Otherwise Python can't tell where it ends: \`SyntaxError: Generator expression must be parenthesized\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: Generator expression must be parenthesized`,
      cause: py`A bare generator expression was passed together with another argument: \`max(x for x in xs, default=0)\`.`,
      fix: py`Add its own brackets: \`max((x for x in xs), default=0)\`.`,
    },
    {
      symptom: py`TypeError: object of type 'generator' has no len()`,
      cause: py`\`len()\` was called on a generator expression, often to compute an average: \`sum(g) / len(g)\`.`,
      fix: py`Count while consuming in one pass (\`total, count\` in a loop), or materialise a list once if the data is small: \`values = list(g)\`.`,
    },
    {
      symptom: py`<generator object <genexpr> at 0x10b2f3a00> printed instead of values`,
      cause: py`Round brackets made a generator, not a tuple or list.`,
      fix: py`Wrap it: \`list(...)\`, \`tuple(...)\`, or \`", ".join(...)\` for strings.`,
    },
    {
      symptom: py`The second consumer (a loop, sum(), max()) sees nothing — or max() raises ValueError: max() iterable argument is empty`,
      cause: py`The generator expression (or a stage feeding it) was already consumed — sometimes by a debug \`print(list(stage))\`.`,
      fix: py`Rebuild the pipeline for each pass, or materialise once with \`list()\` when you need several passes.`,
    },
    {
      symptom: py`ValueError: Stop argument for islice() must be None or an integer: 0 <= x <= sys.maxsize.`,
      cause: py`A negative index was passed to \`islice\`, e.g. to get "the last 3".`,
      fix: py`Iterators can't count back from an end they haven't reached. Use \`collections.deque(iterable, maxlen=3)\` to keep the last three items while streaming.`,
    },
    {
      symptom: py`A pipeline "does nothing": no output, no errors, no writes.`,
      cause: py`Nothing ever consumed it. Generator expressions, \`map()\` and \`filter()\` only work when pulled.`,
      fix: py`Make sure something iterates the last stage: a \`for\` loop, \`sum()\`, \`list()\`, a file write loop.`,
    },
  ],
  bestPractices: [
    'Pass generator expressions straight into sum, min, max, any, all, next and str.join — no square brackets.',
    'Use next((x for x in items if cond), default) to find the first match.',
    'Use itertools.islice to take or skip items from iterators; never list() an unbounded source.',
    'Build pipelines from small stages that each take an iterable and return an iterator.',
    'Keep pipeline construction and consumption close together, and don\'t mutate the variables a pending generator depends on.',
    'Switch to a list when you need several passes, len() or indexing — laziness is a tool, not a religion.',
    'Reduce early: Counter, heapq.nlargest or a running total instead of collecting everything.',
  ],
  useCases: [
    'Summarising large files: totals, counts and maxima over millions of lines.',
    'Finding the first matching record without scanning the rest.',
    'Validating data with all() / any() that stop at the first problem.',
    'ETL pipelines: read → clean → transform → write, one record at a time.',
    'Previewing or sampling the head of a big data source with islice.',
  ],
  whenToUse: {
    use: [
      'The result is consumed once by a loop or an aggregating built-in.',
      'The input is large, slow to produce, or infinite.',
      'You may be able to stop early (any, all, next, break).',
    ],
    avoid: [
      'You need the results more than once, or need len()/indexing — use a list.',
      'The data is tiny and readability or debugging is easier with a list you can print.',
      'Variables used by the generator will change before it is consumed.',
    ],
  },
  comparison: {
    title: 'List comprehension vs generator expression vs map/filter',
    headers: ['', '[x * 2 for x in xs]', '(x * 2 for x in xs)', 'map(lambda x: x * 2, xs)'],
    rows: [
      ['result', 'list', 'generator (iterator)', 'map object (iterator)'],
      ['work done', 'all of it, immediately', 'one item per next()', 'one item per next()'],
      ['memory', 'grows with the input', 'constant', 'constant'],
      ['reusable', 'yes', 'no — single pass', 'no — single pass'],
      ['len(), indexing', 'yes', 'no', 'no'],
      ['filtering', 'if clause', 'if clause', 'needs filter()'],
      ['best for', 'results you keep or reuse', 'feeding sum/any/next or a pipeline', 'applying an existing function: map(str.strip, lines)'],
    ],
    note: py`\`map\` and \`filter\` are covered in [map, filter & reduce](lesson:map-filter-reduce). With a ready-made function, \`map(str.upper, words)\` reads well; with a lambda, a generator expression is usually clearer.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'lazy-evaluation-q1',
      type: 'mcq',
      prompt: 'What does `(len(w) for w in words)` evaluate to?',
      options: [
        { text: 'A tuple of lengths', why: 'There is no tuple comprehension. Round brackets around a for clause create a generator; use tuple(...) for a tuple.' },
        'A generator object that computes the lengths when asked',
        { text: 'A list of lengths', why: 'Square brackets would make a list. Round ones make a lazy generator.' },
        { text: 'A SyntaxError', why: 'This is a valid generator expression.' },
      ],
      answer: 1,
      explanation: py`A generator expression produces a lazy, single-use iterator. No length is computed until something calls \`next()\` on it.`,
    },
    {
      id: 'lazy-evaluation-q2',
      type: 'output',
      prompt: 'Predict all three lines.',
      code: py`nums = [3, 8, 12, 5]
evens = (n for n in nums if n % 2 == 0)
print(next(evens))
print(list(evens))
print(list(evens))`,
      answer: py`8
[12]
[]`,
      accept: ['8 [12] []'],
      explanation: py`\`next\` takes the first even number, \`8\`. \`list\` takes what's left, \`[12]\`. The generator is now exhausted, so the last \`list\` is empty.`,
    },
    {
      id: 'lazy-evaluation-q3',
      type: 'output',
      prompt: 'How many "checking" lines are printed before `True`?',
      code: py`def check(n):
    print("checking", n)
    return n > 2


print(any(check(n) for n in [1, 3, 5]))`,
      options: [
        { text: 'Three: checking 1, 3 and 5', why: 'That would happen with any([...]) — the list comprehension evaluates everything first. With a generator, any() stops at the first True.' },
        'Two: checking 1 and checking 3',
        { text: 'One: checking 1', why: 'check(1) returns False, so any() must keep looking.' },
        { text: 'None — any() only checks truthiness of the generator object', why: 'any() iterates its argument; a generator object is consumed item by item.' },
      ],
      answer: 1,
      explanation: py`\`check(1)\` is False, \`check(3)\` is True — \`any\` stops there and \`check(5)\` is never called. Output: \`checking 1\`, \`checking 3\`, \`True\`.`,
    },
    {
      id: 'lazy-evaluation-q4',
      type: 'output',
      prompt: 'Laziness trap: what is printed?',
      code: py`limit = 10
small = (n for n in [5, 15, 8] if n < limit)
limit = 6
print(list(small))`,
      options: [
        { text: '[5, 8]', why: 'That assumes the condition was evaluated when the generator was created. It is evaluated when items are pulled — after limit became 6.' },
        '[5]',
        { text: '[]', why: '5 < 6 is still True, so 5 is kept.' },
        { text: 'NameError', why: 'limit exists in the enclosing scope; the generator can read it.' },
      ],
      answer: 1,
      explanation: py`Only the outermost iterable \`[5, 15, 8]\` is evaluated immediately. The condition \`n < limit\` runs during \`list()\`, when \`limit\` is already 6, so only \`5\` passes.`,
    },
    {
      id: 'lazy-evaluation-q5',
      type: 'bug',
      prompt: 'This should print the average score but crashes. Click the line that fails.',
      code: py`raw = ["70", "85", "90"]
scores = (int(s) for s in raw)
total = sum(scores)
average = total / len(scores)
print(average)`,
      answerLine: 4,
      explanation: py`\`len(scores)\` raises \`TypeError: object of type 'generator' has no len()\`. (Even if it didn't, \`sum\` already consumed the generator.) Use a list — \`scores = [int(s) for s in raw]\` — or count while summing.`,
    },
    {
      id: 'lazy-evaluation-q6',
      type: 'fill',
      prompt: 'Fill the blanks: compute the cart total lazily, then take the first two items of an iterator without slicing syntax.',
      code: py`from itertools import islice

cart = [(2.50, 4), (0.99, 10), (5.00, 1)]
total = ___(price * qty for price, qty in cart)
first_two = list(___(iter(cart), 2))`,
      answer: [['sum'], ['islice']],
      explanation: py`\`sum\` consumes the generator expression one product at a time. \`islice(iterator, 2)\` lazily takes the first two items — the iterator equivalent of \`[:2]\`.`,
    },
    {
      id: 'lazy-evaluation-q7',
      type: 'short',
      prompt: 'Name three ways laziness can surprise you, with a one-line example or fix for each.',
      answer: py`(1) Exhaustion: a generator is single-use, so a second \`sum(g)\` returns 0 — rebuild it or use a list. (2) Late side effects and errors: nothing runs until consumed, so \`(send(x) for x in xs)\` sends nothing and a \`ValueError\` appears where the pipeline is consumed — use a loop for actions, validate early. (3) Late binding: conditions read variables at consumption time, so changing \`limit\` after creating \`(n for n in xs if n < limit)\` changes the result — wrap it in a function to freeze the values. (Also: files closed too early or held open too long by paused generators.)`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'sales-pipeline',
      title: 'Lazy sales report',
      difficulty: 'intermediate',
      prompt: py`Sales arrive as text lines like \`"north,widget,12.50"\`. The first line may be the header \`"region,product,amount"\`, and blank lines can appear. Write:

1. \`parse_sales(lines)\` — a **generator function** yielding \`(region, product, amount)\` tuples with \`amount\` as a \`float\`, skipping the header line and blank lines.
2. \`total_for(lines, region)\` — returns the total amount for one region, using \`sum()\` and a generator expression over \`parse_sales\`. Unknown region → \`0\`.
3. \`has_big_sale(lines, threshold)\` — returns \`True\` if any sale's amount is **≥ threshold**, using \`any()\`. It must **stop reading lines** as soon as it finds one.`,
      files: {
        'main.py': py`SAMPLE = [
    "region,product,amount",
    "north,widget,12.50",
    "south,gadget,99.99",
    "",
    "north,gizmo,7.25",
]


def parse_sales(lines):
    # TODO: yield (region, product, float(amount)), skipping header and blanks
    return []


def total_for(lines, region):
    # TODO: sum(...) over parse_sales(lines)
    return 0


def has_big_sale(lines, threshold):
    # TODO: any(...) over parse_sales(lines)
    return False


print(list(parse_sales(SAMPLE)))
print(total_for(SAMPLE, "north"))
print(has_big_sale(SAMPLE, 50))
`,
      },
      hints: [
        'In parse_sales, loop over lines, strip each one, and continue if it is empty or equals the header. Split the rest on "," into three parts.',
        'total_for: sum(amount for region_, product, amount in parse_sales(lines) if region_ == region). has_big_sale: any(amount >= threshold for ...).',
        'Because parse_sales is a generator and any() stops at the first True, the short-circuit comes for free — as long as you never call list() on the lines.',
      ],
      solution: {
        explanation: py`\`parse_sales\` is the reading/cleaning stage: it yields one tidy tuple per real data line and is the only place that knows the text format. \`total_for\` and \`has_big_sale\` are tiny consumers built from a generator expression plus an aggregating built-in. Because every stage is lazy, \`has_big_sale\` stops pulling lines the moment \`any()\` sees a big sale — the remaining lines (perhaps millions) are never even parsed. Note that \`sum()\` of an empty generator is \`0\`, which handles the unknown-region case.`,
        files: {
          'main.py': py`SAMPLE = [
    "region,product,amount",
    "north,widget,12.50",
    "south,gadget,99.99",
    "",
    "north,gizmo,7.25",
]
HEADER = "region,product,amount"


def parse_sales(lines):
    for line in lines:
        line = line.strip()
        if not line or line == HEADER:
            continue
        region, product, amount = line.split(",")
        yield region, product, float(amount)


def total_for(lines, region):
    return sum(amount for reg, _product, amount in parse_sales(lines) if reg == region)


def has_big_sale(lines, threshold):
    return any(amount >= threshold for _reg, _product, amount in parse_sales(lines))


print(list(parse_sales(SAMPLE)))
print(total_for(SAMPLE, "north"))
print(has_big_sale(SAMPLE, 50))
`,
        },
      },
      tests: [
        { name: 'parse_sales is a generator function', code: py`import inspect
assert inspect.isgeneratorfunction(parse_sales), 'parse_sales should use yield'` },
        { name: 'parses lines, skipping header and blanks', code: py`assert list(parse_sales(SAMPLE)) == [("north", "widget", 12.5), ("south", "gadget", 99.99), ("north", "gizmo", 7.25)]` },
        { name: 'total_for adds one region', code: py`assert total_for(SAMPLE, "north") == approx(19.75)
assert total_for(SAMPLE, "east") == 0` },
        { name: 'has_big_sale answers correctly', code: py`assert has_big_sale(SAMPLE, 50) is True
assert has_big_sale(SAMPLE, 100) is False` },
        { name: 'has_big_sale stops reading early', code: py`pulled = []


def feed():
    for line in ["region,product,amount", "north,a,10", "south,b,500", "east,c,1", "west,d,2"]:
        pulled.append(line)
        yield line


assert has_big_sale(feed(), 100) is True
assert len(pulled) == 3, f'read {len(pulled)} lines; any() should stop at the first big sale'` },
      ],
    },
    {
      id: 'prime-hunter',
      title: 'Prime hunter',
      difficulty: 'intermediate',
      prompt: py`\`is_prime(n)\` is written for you. Using lazy tools only:

1. \`primes()\` returns an **infinite** iterator of prime numbers \`2, 3, 5, 7, …\` — use a generator expression over \`itertools.count(2)\`.
2. \`first_primes(n)\` returns a **list** of the first \`n\` primes, using \`islice\`. \`first_primes(5)\` → \`[2, 3, 5, 7, 11]\`.
3. \`first_prime_over(limit)\` returns the smallest prime **greater than** \`limit\`, using \`next()\`. \`first_prime_over(100)\` → \`101\`.`,
      files: {
        'main.py': py`from itertools import count, islice


def is_prime(n):
    if n < 2:
        return False
    return all(n % d for d in range(2, int(n ** 0.5) + 1))


def primes():
    # TODO: an infinite generator expression over count(2)
    return iter([])


def first_primes(n):
    # TODO: islice
    return []


def first_prime_over(limit):
    # TODO: next() with a generator expression
    return None


print(first_primes(5))
print(first_prime_over(100))
`,
      },
      hints: [
        'count(2) yields 2, 3, 4, … forever. Filter it with is_prime inside a generator expression.',
        'first_primes: list(islice(primes(), n)). first_prime_over: next(p for p in primes() if p > limit).',
        'Never call list() on primes() itself — it never ends. islice and next are what make the infinite source safe.',
      ],
      solution: {
        explanation: py`\`primes()\` is an infinite pipeline: \`count(2)\` produces candidates forever and the generator expression keeps only primes. That's only safe because every consumer is lazy: \`islice(..., n)\` stops after \`n\` primes, and \`next(...)\` stops after the first prime over the limit. Even \`is_prime\` is lazy inside: \`all(n % d for d ...)\` stops at the first divisor (a remainder of 0 is falsy), so most composite numbers are rejected after a check or two. Each call to \`primes()\` returns a fresh generator, so the functions don't interfere with each other.`,
        files: {
          'main.py': py`from itertools import count, islice


def is_prime(n):
    if n < 2:
        return False
    return all(n % d for d in range(2, int(n ** 0.5) + 1))


def primes():
    return (n for n in count(2) if is_prime(n))


def first_primes(n):
    return list(islice(primes(), n))


def first_prime_over(limit):
    return next(p for p in primes() if p > limit)


print(first_primes(5))
print(first_prime_over(100))
`,
        },
      },
      tests: [
        { name: 'first_primes(5)', code: py`assert first_primes(5) == [2, 3, 5, 7, 11]` },
        { name: 'first_primes(0) is empty', code: py`assert first_primes(0) == []` },
        { name: 'first_prime_over', code: py`assert first_prime_over(100) == 101 and first_prime_over(7) == 11 and first_prime_over(1) == 2` },
        { name: 'primes() is an endless iterator', code: py`g = primes()
assert iter(g) is g, 'primes() should return an iterator (e.g. a generator expression)'
assert [next(g) for _ in range(10)][-1] == 29` },
        { name: 'each call starts fresh', code: py`a, b = primes(), primes()
next(a); next(a)
assert next(b) == 2` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'lazy-evaluation-genexp-vs-listcomp',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `[x * 2 for x in data]` and `(x * 2 for x in data)`? When do you use each?',
      answer: 'The first builds a complete list immediately; the second creates a lazy generator that computes one value per next() and can be consumed once. Use the generator when the result is consumed once (sum, any, join, a loop) or the data is large/infinite; use the list when you need to reuse, index or measure the result.',
      explanation: py`Same syntax and semantics for the clauses; different evaluation strategy. Generators give constant memory and short-circuiting; lists give reuse, \`len()\`, indexing and easy debugging. Small data consumed fully can even be marginally faster as a list comprehension in CPython — clarity and memory usually decide.`,
      code: { lang: 'python', code: py`data = range(1, 6)
print(sum(x * 2 for x in data))       # 30 — no list built
doubled = [x * 2 for x in data]       # kept for reuse
print(doubled, len(doubled))          # [2, 4, 6, 8, 10] 5` },
      whyAsked: 'A basic but telling question about memory awareness and Pythonic idioms.',
      mistakes: ['Calling the generator expression a "tuple comprehension"', 'Saying generators are always faster', 'Forgetting that the generator is single-use'],
      followUps: ['When can you drop the parentheses?', 'What does any([...]) lose compared with any(...)?', 'How would you measure the memory difference?'],
      modelAnswer: 'The square-bracket version is a list comprehension: it runs the whole loop immediately and gives me a list in memory. The round-bracket version is a generator expression: it gives me a lazy iterator that computes one value each time something asks, so memory stays constant and consumers like any or next can stop early. The trade-off is that a generator can only be consumed once and has no len or indexing. So I use a generator expression when I feed the values straight into sum, max, any, join or a single loop, or when the data is big or infinite, and a list when I need to keep, reuse or inspect the results.',
    },
    {
      id: 'lazy-evaluation-any-cost',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: '`fetch(user)` makes a slow network call. How many calls does each line make for 1,000 users if the 3rd user is the first admin?',
      code: { lang: 'python', code: py`calls = 0


def fetch(user):
    global calls
    calls += 1
    return user == "u3"          # pretend: "is this user an admin?"


users = [f"u{i}" for i in range(1, 1001)]
any([fetch(u) for u in users]); print(calls)
calls = 0
any(fetch(u) for u in users); print(calls)` },
      options: ['1000 and 1000', '3 and 3', '1000 and 3', '3 and 1000'],
      correctOption: 2,
      answer: 'The list version makes 1000 calls (the list comprehension runs completely before any() starts); the generator version makes 3, because any() stops at the first True and the remaining items are never computed.',
      explanation: py`Short-circuiting only helps if the input is lazy. With square brackets, \`any\` receives a finished list of 1000 booleans. With a generator, each \`fetch\` happens only when \`any\` asks for the next item.`,
      whyAsked: 'Shows whether you understand that short-circuiting depends on laziness — a common performance bug with expensive calls.',
      mistakes: ['Assuming any() makes both equivalent', 'Not noticing the extra brackets'],
      followUps: ['What about all()?', 'How does next((u for u in users if is_admin(u)), None) compare?'],
      modelAnswer: 'The first line makes a thousand calls and the second makes three. In the first, the square brackets build the entire list of results before any even starts, so every user is fetched. In the second, any pulls one value at a time from the generator and stops at the first True, which is the third user, so the other 997 fetches never happen. Short-circuiting only saves work when the input is lazy — so with expensive checks I always pass a generator expression to any, all or next.',
    },
    {
      id: 'lazy-evaluation-late-binding',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A report builds one generator per multiplier in a loop, but every generator multiplies by 2. Explain and fix.',
      code: { lang: 'python', code: py`data = [1, 2, 3]
gens = [(x * i for x in data) for i in range(3)]
print([list(g) for g in gens])   # [[2, 4, 6], [2, 4, 6], [2, 4, 6]]` },
      answer: 'Only the outermost iterable (data) is evaluated when each generator is created; the expression x * i is evaluated later, when the generators are consumed — by then the loop has finished and i is 2. Bind i at creation time, e.g. with a helper function scale(data, i) that returns the generator, or use a list comprehension if eager is fine.',
      explanation: py`Generator expressions follow late binding like closures: free variables are looked up when the body runs. Fixes: \`def scale(values, k): return (x * k for x in values)\` then \`[scale(data, i) for i in range(3)]\` — the parameter \`k\` is a new variable per call; or nest the iterable so it's evaluated eagerly: \`(x * i for i in [i] for x in data)\` (works, but cryptic); or make them lists.`,
      whyAsked: 'Tests precise knowledge of generator-expression evaluation rules, which causes subtle production bugs.',
      mistakes: ['Saying generators "copy" variables when created', 'Blaming the list comprehension', 'Fixing it with a default-argument lambda without explaining why it works'],
      followUps: ['Why does (x for x in 5) fail immediately but (1/0 for x in data) does not?', 'How is this related to the closure late-binding gotcha?'],
      modelAnswer: 'A generator expression evaluates only its outermost iterable immediately; everything else, including the expression x * i, runs later when the generator is consumed, and it looks names up at that time. The outer comprehension finishes the loop before any generator is consumed, so i is 2 for all of them. It is the same late-binding rule as with closures. The clean fix is a small function such as scale(values, k) that returns the generator, because each call gets its own k; alternatively, if eagerness is fine, use inner list comprehensions.',
    },
    {
      id: 'lazy-evaluation-big-log-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design a Python job that reads a 50 GB access log and reports the 10 slowest endpoints by average response time. Memory is limited to a few hundred MB. Which parts can be lazy, and where must you hold state?',
      answer: 'Stream the file line by line through lazy stages (read → parse → filter bad lines → extract endpoint and time), then reduce into a small dict of running totals per endpoint (sum and count). Only that dict — one entry per distinct endpoint — is held in memory. At the end compute averages and use heapq.nlargest(10, ...). Sorting or collecting all lines would defeat the purpose.',
      explanation: py`Lazy stages keep per-line memory constant. Aggregation is where state is unavoidable — but it's proportional to the number of distinct endpoints, not lines. Use running sums (not lists of times), handle malformed lines in the parse stage, normalise endpoints (strip IDs/query strings) to keep the key space small, and test each stage with small lists. If it's too slow, the next steps are profiling, splitting the file into chunks processed in parallel by separate processes ([multiprocessing](lesson:multiprocessing)) and merging the partial dicts.`,
      code: { lang: 'python', code: py`import heapq


def endpoint_times(lines):
    for line in lines:
        parts = line.split()
        if len(parts) >= 3 and parts[-1].endswith("ms"):
            yield parts[1], int(parts[-1].removesuffix("ms"))


def slowest(lines, n=10):
    totals = {}                                   # endpoint -> [sum, count]
    for endpoint, ms in endpoint_times(lines):
        t = totals.setdefault(endpoint, [0, 0])
        t[0] += ms
        t[1] += 1
    averages = ((s / c, ep) for ep, (s, c) in totals.items())
    return heapq.nlargest(n, averages)


sample = ["GET /a 120ms", "GET /b 900ms", "GET /a 80ms", "broken line"]
print(slowest(sample, 2))   # [(900.0, '/b'), (100.0, '/a')]` },
      whyAsked: 'Checks that you can apply laziness to a realistic data-engineering problem and know where streaming ends.',
      mistakes: ['Reading the whole file with f.read() or readlines()', 'Storing every response time per endpoint', 'Sorting all endpoints when only the top 10 are needed', 'Not handling malformed lines'],
      followUps: ['How would you parallelise it?', 'What if the number of distinct endpoints is also huge?', 'How would you test this without a 50 GB file?'],
      modelAnswer: 'I would stream the file: open it and iterate line by line, through small generator stages that parse each line, drop malformed ones and yield an endpoint and a response time. Memory per line stays constant no matter how big the file is. The only state I keep is a dictionary of running totals per endpoint — a sum and a count — which grows with the number of distinct endpoints, not lines; normalising URLs keeps that small. At the end I compute averages lazily and use heapq.nlargest to get the top ten without sorting everything. Each stage can be unit-tested with a short list of strings, and if it is too slow I would profile, then split the file across processes and merge the partial totals.',
    },
    {
      id: 'lazy-evaluation-first-matches',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 4,
      question: 'Write `first_matches(lines, keyword, n)` that returns a **list** of the first `n` lines containing `keyword`. It must work on an infinite iterator and must not read more lines than necessary.',
      answer: 'return list(islice((line for line in lines if keyword in line), n))',
      explanation: py`The generator expression filters lazily, and \`islice\` stops after \`n\` matches, so no extra lines are pulled from the source. With \`n == 0\`, \`islice\` returns immediately without reading anything.`,
      starter: { files: { 'main.py': py`from itertools import islice


def first_matches(lines, keyword, n):
    # TODO: lazy filter + islice
    return [line for line in lines if keyword in line][:n]


print(first_matches(["ok", "ERROR a", "ok", "ERROR b", "ERROR c"], "ERROR", 2))
` } },
      tests: [
        { name: 'returns the first n matches', code: py`assert first_matches(["ok", "ERROR a", "ok", "ERROR b", "ERROR c"], "ERROR", 2) == ["ERROR a", "ERROR b"]` },
        { name: 'fewer matches than n', code: py`assert first_matches(["x", "ERROR"], "ERROR", 5) == ["ERROR"]` },
        { name: 'does not read extra lines', code: py`pulled = []


def feed():
    for line in ["ERROR 1", "ok", "ERROR 2", "ERROR 3", "ok"]:
        pulled.append(line)
        yield line


assert first_matches(feed(), "ERROR", 2) == ["ERROR 1", "ERROR 2"]
assert len(pulled) == 3, f"pulled {len(pulled)} lines, expected 3"` },
      ],
      solution: { files: { 'main.py': py`from itertools import islice


def first_matches(lines, keyword, n):
    return list(islice((line for line in lines if keyword in line), n))


print(first_matches(["ok", "ERROR a", "ok", "ERROR b", "ERROR c"], "ERROR", 2))
` } },
      hints: ['The starter reads every line before slicing — that is the bug on large or infinite input.', 'Filter with a generator expression, then let islice stop after n items.'],
      whyAsked: 'A small task that distinguishes eager from lazy thinking; the "pulled" test catches eager solutions.',
      mistakes: ['Slicing a list built from the whole input', 'Using a loop with a counter but forgetting to stop reading at n'],
      followUps: ['How would you return the LAST n matches lazily?', 'What happens when n is 0?'],
      modelAnswer: 'I would combine a generator expression with itertools.islice: list(islice((line for line in lines if keyword in line), n)). The generator expression filters one line at a time, and islice stops asking for more as soon as it has n matches, so on an infinite stream the function still returns and never reads more than needed. For the last n matches I would stream through a collections.deque with maxlen=n instead, since you cannot know the last ones without reading to the end.',
    },
    {
      id: 'lazy-evaluation-nothing-happened',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A data-migration script finished in a second with no errors, but no rows were updated. The key line is `results = map(migrate_row, rows)` (or `(migrate_row(r) for r in rows)`). What happened?',
      answer: 'map() and generator expressions are lazy: they describe the work but don\'t do it until something iterates them. Nothing consumed results, so migrate_row was never called. Use a for loop for side effects (or consume the iterator explicitly) and check the results.',
      explanation: py`In Python 3, \`map\`, \`filter\` and \`zip\` return iterators. A lazy pipeline with no consumer does nothing — no errors either, because \`migrate_row\` never runs. For actions, write \`for row in rows: migrate_row(row)\` and count successes/failures. Adding a check (e.g. "rows updated == rows expected") would have caught it.`,
      whyAsked: 'A realistic production incident caused by not understanding laziness — also tests debugging approach and safeguards.',
      mistakes: ['Blaming the database transaction first', 'Fixing it with list(map(...)) without discussing that a loop is clearer for side effects'],
      followUps: ['How would you make the migration report failures per row?', 'Why did map return a list in Python 2?'],
      modelAnswer: 'map in Python 3, like a generator expression, is lazy: it creates an iterator that will call migrate_row when someone asks for the next value. The script never iterated results, so migrate_row was never called — no work, and no errors either. The fix is to use a plain for loop, because this is a side effect, not a transformation: for row in rows, migrate the row and record success or failure. I would also add a sanity check at the end comparing the number of migrated rows with the number expected, so a silent no-op cannot pass again.',
    },
  ],

  takeaways: [
    'A generator expression (x for x in xs) is a lazy, single-use iterator — a comprehension that computes one item per next().',
    'Chain lazy stages into pipelines (read → filter → transform → aggregate); each item flows through every stage before the next is read.',
    'Feed generators straight into sum, max, min, any, all, next and join — any/all/next short-circuit and skip the rest of the work.',
    'Use itertools.islice to take or skip items lazily; never list() an infinite source.',
    'Only the outermost iterable is evaluated immediately; conditions and expressions run at consumption time (late binding).',
    'Laziness moves side effects and errors to consumption time, and generators are exhausted after one pass.',
  ],
}
