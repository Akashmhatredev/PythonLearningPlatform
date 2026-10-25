// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CHECK_IN = py`import time


def make_codes(n):
    return [f"T{i:05d}" for i in range(n)]


def check_in(guest_list, scans):
    """Count (admitted, rejected, repeats) for a stream of ticket scans."""
    admitted = rejected = repeats = 0
    inside = []
    for code in scans:
        if code not in guest_list:      # a list: compared with ticket after ticket
            rejected += 1
        elif code in inside:            # another list scan
            repeats += 1
        else:
            inside.append(code)
            admitted += 1
    return admitted, rejected, repeats


def repeated_codes(scans):
    """Codes scanned more than once, sorted."""
    return sorted({code for code in scans if scans.count(code) > 1})


def serve(people):
    """Let people in, first come first served; return the order."""
    queue = list(people)
    order = []
    while queue:
        order.append(queue.pop(0))      # removing the first item shifts all the rest
    return order


def measure(n):
    guests = make_codes(n)
    scans = guests[::2] + ["FAKE-1", "FAKE-2"] + guests[:3]
    start = time.perf_counter()
    counts = check_in(guests, scans)
    repeated = repeated_codes(scans)
    served = serve(scans)
    elapsed = time.perf_counter() - start
    return counts, len(repeated), len(served), elapsed


for n in (1000, 2000, 4000):
    counts, n_repeated, n_served, seconds = measure(n)
    print(f"n={n:>4}  admitted/rejected/repeats={counts}  repeated={n_repeated}  "
          f"served={n_served}  {seconds * 1000:7.1f} ms")
`

// Test helper: a hashable, orderable value that counts how often == is used on it.
const TICKET = py`class Ticket:
    eq_calls = 0
    def __init__(self, n):
        self.n = n
    def __hash__(self):
        return hash(self.n)
    def __eq__(self, other):
        Ticket.eq_calls += 1
        return isinstance(other, Ticket) and self.n == other.n
    def __lt__(self, other):
        return self.n < other.n
`

export default {
  id: 'performance',
  title: 'Performance: Big-O & choosing data structures',
  summary: 'Big-O describes how a program’s work grows with its input; choosing the right data structure — list, dict, set, deque, heap — is usually the biggest performance decision you make.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['lists', 'sets', 'dictionaries', 'profiling'],
  related: ['collections-module', 'list-operations', 'sets', 'dictionaries', 'optimization-techniques', 'profiling', 'recursion', 'functools', 'coding-patterns'],
  tags: ['performance', 'big-o', 'time complexity', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'data structures', 'list', 'dict', 'set', 'deque', 'heapq', 'bisect', 'amortized', 'hash table'],
  apis: [
    { name: 'x in list', summary: 'O(n): compares x with the elements one by one until it finds a match.' },
    { name: 'x in set / key in dict', summary: 'O(1) on average: hashes x and jumps to its slot.' },
    { name: 'list.append() / list.pop()', summary: 'O(1) (append is amortised): work at the end of a list is cheap.' },
    { name: 'list.insert(0, x) / list.pop(0)', summary: 'O(n): every other element has to shift by one place.' },
    { name: 'collections.deque', summary: 'A double-ended queue: append/pop at either end in O(1); indexing the middle is O(n).' },
    { name: 'sorted() / list.sort()', summary: 'O(n log n) comparisons in the worst case; faster on partly sorted data.' },
    { name: 'bisect.bisect_left(a, x)', summary: 'O(log n) binary search in a sorted list (insort still costs O(n) to insert).' },
    { name: 'heapq.heappush() / heappop()', summary: 'O(log n) priority queue on a plain list; heap[0] is always the smallest item.' },
  ],
  docs: [
    { label: 'Python wiki — TimeComplexity (CPython operation costs)', url: 'https://wiki.python.org/moin/TimeComplexity' },
    { label: 'Design FAQ — how are lists and dicts implemented?', url: 'https://docs.python.org/3/faq/design.html#how-are-lists-implemented-in-cpython' },
    { label: 'collections.deque', url: 'https://docs.python.org/3/library/collections.html#collections.deque' },
    { label: 'bisect — array bisection algorithm', url: 'https://docs.python.org/3/library/bisect.html' },
    { label: 'heapq — heap queue algorithm', url: 'https://docs.python.org/3/library/heapq.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`How fast a program runs depends mostly on **how much work it does as its input grows** — and that depends on the *algorithm* (the method) and the *data structure* (how the data is organised). **Big-O notation** is the shorthand programmers use for that growth.`,
    py`Call the size of the input **n** — the number of tickets, users or lines. Big-O answers: *if n doubles, roughly what happens to the work?*`,
    py`| Big-O | name | if n doubles… | everyday example |
|---|---|---|---|
| **O(1)** | constant | same work | opening a locker with its number |
| **O(log n)** | logarithmic | one more step | guessing a number 1–100 with "higher/lower" |
| **O(n)** | linear | twice the work | reading every name on a list |
| **O(n log n)** | "n log n" | a bit more than twice | sorting a deck of cards well |
| **O(n²)** | quadratic | **four times** the work | everyone in a room shaking hands with everyone |`,
    py`In Python, the same one-line check — \`code in tickets\` — is O(n) if \`tickets\` is a [list](lesson:lists) and O(1) on average if it is a [set](lesson:sets). Knowing which operations are cheap on which structure is most of practical performance work. [Profiling](lesson:profiling) tells you *where* the time goes; this lesson tells you *why* — and what to change.`,
  ],
  why: [
    py`Programs that are fine on test data often fall over on real data. A quadratic loop over 100 items does about 10,000 steps — instant. Over 1,000,000 items it's about 10¹² steps: that's not "slow", it's "never finishes". No amount of clever micro-tuning rescues the wrong algorithm; switching to the right data structure often does.`,
    py`Big-O also gives you a shared language: "that lookup is O(n) inside a loop, so the whole thing is O(n²)" is a code-review comment everyone understands, without anyone running a benchmark.`,
  ],
  eli15: [
    py`You need to find your friend's phone number. Three ways:`,
    py`- **A messy pile of paper slips.** You check them one by one. Twice as many slips, twice as long. That's **O(n)** — a Python list with \`in\`.
- **A phone book sorted by name.** Open the middle, see if you're too early or too late, throw away half, repeat. Even a huge book takes only about 20 halvings. That's **O(log n)** — binary search.
- **Lockers with name tags painted on.** A rule turns "Maya" straight into locker 47; you walk there directly. Size doesn't matter. That's **O(1)** — a Python set or dict.`,
    py`Big-O is just a label for "how badly does this get worse when there's more stuff?"`,
  ],
  analogy: {
    title: 'A library, a catalogue and a bakery queue',
    body: [
      py`A library with books in a heap on the floor: finding one means checking every book (**list scan**). Books on shelves in alphabetical order: you can jump to the right shelf and halve your way in (**sorted list + bisect**). A catalogue that maps each title straight to its shelf number: one look-up (**dict / set**).`,
      py`Next door, a bakery queue: people join at the back and leave from the front. If everyone had to shuffle forward one step each time the front person left, a long queue would be slow (**list.pop(0)**). Real queues just move the "front" marker (**deque.popleft()**).`,
    ],
    mapping: [
      ['books in a heap, check each one', 'x in list — O(n)'],
      ['alphabetical shelves, halve the search', 'bisect on a sorted list — O(log n)'],
      ['catalogue: title → shelf number', 'dict / set lookup by hash — O(1) on average'],
      ['everyone shuffles forward', 'list.pop(0) / insert(0, x) — O(n)'],
      ['the front of the queue just moves', 'deque.popleft() — O(1)'],
      ['the time on a stopwatch', 'actual speed — depends on the machine; Big-O ignores it'],
    ],
  },
  visual: {
    type: 'performance',
    title: '`in` on a list vs a set, measured live',
    props: { demo: 'membership' },
    alt: 'A live measurement, run by real Python in the browser, of how long it takes to check that a missing item is not in a list versus a set, for lists of increasing size. The list time grows with the size; the set time stays flat.',
    caption: py`Measured in your browser right now — the numbers depend on your machine, the **shape** doesn't. The list line climbs with n (O(n)); the set line stays flat (O(1) on average).`,
  },
  syntax: [
    py`#### Reading Big-O from code`,
    { code: py`def total(prices):                    # O(n): one pass
    result = 0
    for p in prices:
        result += p
    return result

def has_pair(prices, budget):        # O(n²): a loop inside a loop over the same data
    for a in prices:
        for b in prices:
            if a + b == budget:
                return True
    return False

def count_known(words, known_list):  # O(n × k): "in" on a list is a hidden loop
    return sum(1 for w in words if w in known_list)`, lang: 'python', title: 'spot the loops — including hidden ones' },
    py`Rules of thumb:`,
    py`- One loop over the input → **O(n)**. A loop inside a loop over the same input → **O(n²)**.
- Some operations *are* loops in disguise: \`x in list\`, \`list.index\`, \`list.count\`, \`list.remove\`, \`list.insert(0, …)\`, \`list.pop(0)\`, slicing a copy, \`sorted()\`.
- Halving the problem each step → **O(log n)**. Sorting → **O(n log n)**.
- Keep only the biggest term and drop constant factors: \`3n² + 10n + 7\` is **O(n²)**. Big-O describes growth, not seconds.`,
    py`#### What common operations cost`,
    py`Average costs in **CPython**, from the [Python wiki TimeComplexity page](https://wiki.python.org/moin/TimeComplexity) (n = size of the container, k = size of the other argument):`,
    py`| operation | list | dict / set | deque |
|---|---|---|---|
| \`x in c\` | **O(n)** | **O(1)** | O(n) |
| add at the end (\`append\`, \`d[k] = v\`, \`s.add\`) | O(1)\* | O(1)\* | O(1) |
| remove from the end (\`pop()\`) | O(1) | — | O(1) |
| add/remove at the **front** | **O(n)** | — | **O(1)** (\`appendleft\`, \`popleft\`) |
| get by index / key | O(1) | O(1) | O(1) at the ends, O(n) in the middle |
| delete a given value (\`remove\`, \`del d[k]\`) | O(n) | O(1) | O(n) |
| \`len(c)\` | O(1) | O(1) | O(1) |
| iterate | O(n) | O(n) | O(n) |
| \`sorted(c)\` | O(n log n) | O(n log n) | O(n log n) |`,
    py`\* *Amortised*: occasionally a resize copies everything, but averaged over many operations each one costs O(1). Set operations: \`s | t\` is O(len(s) + len(t)), \`s & t\` is O(min(len(s), len(t))) on average.`,
    py`#### The tools for the job`,
    { code: py`from collections import Counter, deque
import bisect
import heapq

queue = deque(["ada", "ben"])          # a FIFO queue
queue.append("cy")                     # O(1) join at the back
first = queue.popleft()                # O(1) leave from the front

valid = set(["T001", "T002"])          # membership: O(1) average
price = {"tea": 3.5}["tea"]            # lookup by key: O(1) average
counts = Counter("mississippi")        # counting in one O(n) pass

scores = [12, 30, 45, 61, 88]          # must be sorted for bisect
pos = bisect.bisect_left(scores, 50)   # O(log n): where 50 would go → 3

tasks = []
heapq.heappush(tasks, (2, "email"))    # O(log n)
heapq.heappush(tasks, (1, "deploy"))
print(heapq.heappop(tasks))            # (1, 'deploy'): smallest first, O(log n)`, lang: 'python', title: 'deque, set, dict, Counter, bisect and heapq' },
    { callout: 'note', title: 'Language guarantee or CPython detail?', text: py`The language reference doesn't promise any of these costs. They describe **CPython's** implementation (and the docs of \`deque\`, \`bisect\` and \`heapq\` state their complexities). Other implementations such as PyPy behave the same way for these core structures in practice, but the table is a description of CPython, not a law of Python.` },
  ],
  walkthrough: {
    title: 'Three hidden loops at the festival gate',
    lang: 'python',
    code: CHECK_IN,
    intro: py`The playground program, step by step. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [8, 20], text: py`One visible loop over the scans… but \`code not in guest_list\` is a second, hidden loop over up to n tickets, and \`code in inside\` a third. Scans × tickets: **O(n²)** overall.` },
      { lines: [23, 25], text: py`A set comprehension that looks O(n) — except \`scans.count(code)\` walks the *whole* list for every code. Another **O(n²)**.` },
      { lines: [28, 34], text: py`\`queue.pop(0)\` removes the first element, so every remaining element moves one place to the left. n pops × up to n moves = **O(n²)** — although the moving is done by fast C code, so it shows up later than the others.` },
      { lines: [37, 45], text: py`\`measure\` builds n tickets and about n/2 scans (plus two fakes and three repeat scans), and times the three functions with \`perf_counter\`.` },
      { lines: [48, 51], text: py`Watch the last column: every time n **doubles**, a quadratic program takes roughly **four times** as long (once n is big enough for the n² part to dominate). After your fixes it should roughly double instead.` },
    ],
  },
  playground: {
    title: 'Festival check-in',
    objective: 'Watch quadratic code slow down as n doubles, then fix each hidden loop with the right data structure.',
    files: { 'main.py': CHECK_IN },
    expected: py`Three lines, one per n. The counts are always the same; the milliseconds are measured live and depend on your machine:

\`\`\`text
n=1000  admitted/rejected/repeats=(501, 2, 2)  repeated=2  served=505      … ms
n=2000  admitted/rejected/repeats=(1001, 2, 2)  repeated=2  served=1005      … ms
n=4000  admitted/rejected/repeats=(2001, 2, 2)  repeated=2  served=2005      … ms
\`\`\`

Compare consecutive times: with the original code each doubling of n multiplies the time by roughly four.`,
    experiments: [
      {
        id: 'sets-for-membership',
        task: py`Make \`check_in\` use **sets** for both membership checks, without changing the counts it returns.`,
        hint: py`Build \`valid = set(guest_list)\` once before the loop and test \`code not in valid\`; make \`inside = set()\` and use \`inside.add(code)\`.`,
        tests: [
          { name: 'same counts as before', code: py`guests = make_codes(10)
scans = guests[::2] + ["FAKE"] + guests[:1]
assert check_in(guests, scans) == (5, 1, 1)` },
          { name: 'membership uses hashing, not comparisons', code: TICKET + py`guests = [Ticket(i) for i in range(400)]
scans = [Ticket(i) for i in range(0, 400, 2)] + [Ticket(-1), Ticket(0)]
assert check_in(guests, scans) == (200, 1, 1)
assert Ticket.eq_calls < 2000, f"{Ticket.eq_calls} == comparisons: use sets for both checks"` },
        ],
        explain: py`A set hashes \`code\` and looks in one slot, so each check costs about the same however many tickets exist. The test counts \`==\` comparisons instead of timing: with lists it's tens of thousands, with sets a few hundred. Building the set is O(n) once — do it **before** the loop, never inside it.`,
      },
      {
        id: 'counter',
        task: py`Rewrite \`repeated_codes\` so it counts every code in **one pass** with \`collections.Counter\`, returning the same sorted list.`,
        hint: py`\`counts = Counter(scans)\` then \`return sorted(code for code, n in counts.items() if n > 1)\`. Don't forget the import.`,
        tests: [
          { name: 'same result', code: py`assert repeated_codes(["a", "b", "a", "c", "b", "a"]) == ["a", "b"]` },
          { name: 'no longer counts by scanning the list for every code', code: TICKET + py`scans = [Ticket(i % 100) for i in range(300)]
result = repeated_codes(scans)
assert [t.n for t in result] == list(range(100))
assert Ticket.eq_calls < 2000, f"{Ticket.eq_calls} == comparisons: count in one pass"` },
        ],
        explain: py`\`scans.count(code)\` is O(n) and was called n times: O(n²). \`Counter\` makes a single O(n) pass, adding 1 to a dict entry per code (see [collections](lesson:collections-module)). "Count things" almost always means "use a dict".`,
      },
      {
        id: 'deque-queue',
        task: py`Make \`serve\` use a \`collections.deque\` and \`popleft()\` instead of \`list.pop(0)\`. The order must stay the same.`,
        hint: py`\`queue = deque(people)\` and \`order.append(queue.popleft())\`.`,
        tests: [
          { name: 'first come, first served', code: py`assert serve(["ada", "ben", "cy"]) == ["ada", "ben", "cy"]` },
          { name: 'uses deque.popleft() instead of pop(0)', code: py`import inspect
source = inspect.getsource(serve)
assert "popleft" in source and "pop(0)" not in source` },
        ],
        explain: py`A deque keeps its items in linked blocks and just moves its "front" marker, so \`popleft()\` is O(1). A list stores items in one contiguous array, so removing the first item shifts all the others.`,
      },
      {
        id: 'growth',
        task: py`After your fixes, change the sizes to \`(4000, 8000, 16000)\` and run again. How does the time change when n doubles now? Compare with the original code's growth.`,
        explain: py`With sets, a Counter and a deque every function is O(n) (plus the O(n log n) sort of a few repeated codes), so doubling n roughly doubles the time — bigger inputs than before, in less time. That's an algorithmic win: no clever tricks, just the right structure for each job.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Linear search vs binary search, step by step',
    props: {
      code: py`def linear_search(items, target):
    steps = 0
    for item in items:
        steps += 1
        if item == target:
            break
    return steps


def binary_search(items, target):
    lo, hi, steps = 0, len(items) - 1, 0
    while lo <= hi:
        steps += 1
        mid = (lo + hi) // 2
        if items[mid] == target:
            break
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return steps


numbers = list(range(1, 17))
print(linear_search(numbers, 13), binary_search(numbers, 13))
`,
      notes: {
        3: 'Linear search looks at the items in order. To find 13 it has to check 13 items — O(n).',
        11: 'Binary search needs **sorted** data. `lo` and `hi` mark the part of the list that could still contain the target.',
        14: 'Check the middle item…',
        17: '…and throw away the half that can’t contain the target. Each step halves the range: O(log n).',
        24: 'Prints 13 and 4. With a million sorted items, binary search needs at most about 20 steps.',
      },
    },
    alt: 'A step-by-step trace of two search functions on the sorted numbers 1 to 16. Linear search loops through the items one at a time and takes 13 steps to find 13. Binary search keeps lo and hi bounds, checks the middle element and halves the range each time, finding 13 in 4 steps.',
    caption: py`Same answer, very different amounts of work. The standard library's [bisect](https://docs.python.org/3/library/bisect.html) module does binary search for you.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Why can a set answer \`in\` without looking at everything? It computes a **hash** of the value — a number derived from the value (\`hash("T00042")\`) — and uses it to pick a slot in an internal table. To check membership it computes the hash again and looks in that one slot. A list has no such shortcut: the value could be anywhere, so it compares one by one.`,
      py`That's also why set elements and dict keys must be **hashable** (immutable built-ins such as str, int, tuple): if a value could change, its hash would change and it would be in the "wrong" slot.`,
      { code: py`tickets = {"T001", "T002"}
print("T002" in tickets)      # True — one hash, one slot

seen = set()
seen.add(("ada", 2024))       # tuples are hashable
# seen.add(["ada", 2024])     # TypeError: cannot use 'list' as a set element (unhashable type: 'list')`, lang: 'python', title: 'hashable values only' },
    ],
    technical: [
      py`**Lists** are dynamic arrays: one block of memory holding references in order. Index access is a multiplication and an addition — O(1). Appending usually fills spare room; when it runs out, CPython allocates a bigger block with extra space and copies, so the *average* append stays O(1) (**amortised**). Inserting or removing anywhere but the end shifts everything after that position: O(n).`,
      py`**Dicts and sets** are hash tables using open addressing: a hash picks a slot; if it's taken by a different key, a probing sequence tries other slots. With a good hash and a table that is resized before it gets too full, lookups touch a small constant number of slots — **O(1) on average**. In the worst case (many keys with colliding hashes) a lookup degrades to O(n).`,
      py`**Deques** are a doubly linked list of fixed-size blocks, so both ends are O(1) but \`d[i]\` in the middle must walk blocks: O(n). **Heaps** (\`heapq\`) are binary trees stored in a plain list: push and pop are O(log n), \`heap[0]\` is the minimum in O(1), \`heapify\` is O(n). \`bisect\` searches a sorted list in O(log n), but \`insort\` still pays O(n) to insert.`,
      py`**Sorting** in CPython uses Timsort, an adaptive merge sort: O(n log n) in the worst case, close to O(n) when the data already contains long sorted runs. It is also **stable** — equal items keep their original order.`,
      { callout: 'note', title: 'CPython detail', text: py`Hashes of \`str\` and \`bytes\` are randomised per process by default (see \`PYTHONHASHSEED\`), so an attacker can't pre-compute thousands of colliding keys and turn your O(1) dict into an O(n) one (a "hash-flooding" denial-of-service). It's also why set iteration order of strings can differ between runs. Never rely on it.` },
    ],
    production: [
      py`**Know your n.** Big-O matters when n is large or grows over time: users, log lines, rows. For a list of 5 config values, \`in\` on a list is perfectly fine — and clearer. Ask "how big can this get in a year?"`,
      py`**Constants still matter.** Big-O hides constant factors. Code that runs inside a C built-in (\`sum\`, \`sorted\`, \`set\` operations, \`str.join\`) does each step far faster than a Python-level loop, which is why a "worse" built-in can beat a "better" hand-written loop for small inputs. Measure (see [profiling](lesson:profiling)) when the difference matters.`,
      py`**Time vs memory.** Sets and dicts trade memory for speed: a set of a million strings uses noticeably more memory than a list of the same strings. Indexes, caches and lookup tables are all this trade. Make it consciously, and see [optimization techniques](lesson:optimization-techniques) for caching.`,
      py`**Amortised isn't worst-case.** An occasional resize copies the whole list or dict. For most programs that's invisible; for latency-sensitive code it can be a spike. Pre-building the container at its final size (\`[None] * n\`, \`dict.fromkeys(keys)\`) avoids repeated growth.`,
      py`**Databases follow the same rules.** A query filtering on an unindexed column is a full scan (O(n)); an index (usually a B-tree, O(log n)) is the database's version of a sorted shelf. "N+1 queries" — one query per item in a loop — is the network version of a hidden nested loop.`,
    ],
  },
  mistakes: [
    {
      title: 'Membership tests on a list inside a loop',
      wrong: { code: py`banned = ["spam@x.com", "bot@y.com"]  # imagine 100,000 entries
emails = ["ada@z.com", "bot@y.com"]
allowed = [e for e in emails if e not in banned]   # O(len(emails) × len(banned))`, lang: 'python' },
      right: { code: py`banned = {"spam@x.com", "bot@y.com"}
emails = ["ada@z.com", "bot@y.com"]
allowed = [e for e in emails if e not in banned]   # O(len(emails))`, lang: 'python' },
      explanation: py`If you test membership more than a handful of times, store the collection as a set (or dict). The rest of the code doesn't change.`,
    },
    {
      title: 'Building the set inside the loop',
      wrong: { code: py`banned_list = ["spam@x.com", "bot@y.com"]
emails = ["ada@z.com", "bot@y.com"]
allowed = [e for e in emails if e not in set(banned_list)]   # rebuilt every time: still O(n × k)`, lang: 'python' },
      right: { code: py`banned_list = ["spam@x.com", "bot@y.com"]
emails = ["ada@z.com", "bot@y.com"]
banned = set(banned_list)                                     # O(k), once
allowed = [e for e in emails if e not in banned]`, lang: 'python' },
      explanation: py`\`set(...)\` itself is O(k). Converting inside the loop pays that cost on every iteration — worse than the plain list scan. Build it once, outside.`,
    },
    {
      title: 'Using a list as a queue',
      wrong: { code: py`jobs = ["resize", "upload", "email"]
while jobs:
    job = jobs.pop(0)        # O(n) each time`, lang: 'python' },
      right: { code: py`from collections import deque

jobs = deque(["resize", "upload", "email"])
while jobs:
    job = jobs.popleft()     # O(1)`, lang: 'python' },
      explanation: py`Lists are fast at the end and slow at the front. If you add or remove at the front, use \`deque\`. (For a *priority* queue — always take the smallest — use \`heapq\`.)`,
    },
    {
      title: 'Sorting again and again to find the smallest',
      wrong: { code: py`tasks = [(3, "backup"), (1, "deploy")]
tasks.append((2, "email"))
tasks.sort()                  # O(n log n) after every insert
next_task = tasks.pop(0)      # plus an O(n) shift`, lang: 'python' },
      right: { code: py`import heapq

tasks = [(3, "backup"), (1, "deploy")]
heapq.heapify(tasks)          # O(n), once
heapq.heappush(tasks, (2, "email"))   # O(log n)
next_task = heapq.heappop(tasks)      # O(log n)`, lang: 'python' },
      explanation: py`If you only ever need the smallest (or largest) item, a heap keeps just enough order to give it to you cheaply. For a single max or min, \`max()\`/\`min()\` is O(n) — no sort needed at all.`,
    },
    {
      title: 'Micro-optimising a quadratic algorithm',
      wrong: { code: py`def common(a, b):
    b_contains = b.__contains__      # "faster" attribute lookup...
    return [x for x in a if b_contains(x)]   # ...still O(len(a) × len(b))`, lang: 'python' },
      right: { code: py`def common(a, b):
    b_set = set(b)
    return [x for x in a if x in b_set]      # O(len(a) + len(b))`, lang: 'python' },
      explanation: py`Shaving a constant factor off each step can't compete with doing fewer steps. Fix the algorithm first; only then, if a profile still says so, consider micro-optimisations.`,
    },
  ],
  debugging: [
    {
      symptom: py`The script finishes instantly on the test file but runs for hours on the real one.`,
      cause: py`Almost always a hidden O(n²): \`in\`, \`.count()\`, \`.index()\`, \`.remove()\` or \`.pop(0)\` on a list inside a loop, or nested loops over the same data.`,
      fix: py`Profile with a medium-sized input (see [profiling](lesson:profiling)); look at the function with the biggest tottime and search it for hidden loops. Replace list membership with a set, counting with Counter, front-removal with deque.`,
    },
    {
      symptom: py`TypeError: cannot use 'list' as a set element (unhashable type: 'list')`,
      cause: py`Sets and dict keys need hashable values; lists and dicts are mutable and unhashable. (Before 3.14 the message is just \`unhashable type: 'list'\`.)`,
      fix: py`Convert to a tuple (\`tuple(row)\`) or a frozenset, or key the dict by an immutable id such as \`row["id"]\`.`,
    },
    {
      symptom: py`bisect returns positions that make no sense.`,
      cause: py`The list isn't sorted (or is sorted by a different key than the one you search with). Binary search silently assumes sorted input.`,
      fix: py`Sort first (once), keep it sorted with \`bisect.insort\`, and pass the same \`key=\` (3.10+) to bisect that the list is sorted by.`,
    },
    {
      symptom: py`Memory usage jumped after switching a big list to a set or dict.`,
      cause: py`Hash tables keep spare empty slots so lookups stay fast; they use more memory per item than a list.`,
      fix: py`That's the trade-off. If memory matters more than lookup speed, keep a sorted list and use \`bisect\` (O(log n)), or store compact ids instead of full objects.`,
    },
  ],
  bestPractices: [
    'Think about how big n can get before choosing a structure; optimise for the realistic worst case.',
    'Use a set for membership tests and uniqueness, a dict for lookups by key, Counter for counting.',
    'Use deque for queues (add/remove at the front), heapq for “always the smallest next”, bisect for searching sorted data.',
    'Hunt hidden loops: in / count / index / remove / pop(0) on lists inside loops.',
    'Build lookup structures once, outside the loop.',
    'Fix the algorithm before micro-optimising — and measure both before and after.',
    'Prefer clear code when n is small; Big-O matters when n is large or growing.',
  ],
  whenToUse: {
    use: [
      'Choosing a data structure for data that will grow (users, events, rows).',
      'Reviewing loops that call in / count / index / remove on lists.',
      'Explaining why a program is slow on big inputs but fine on small ones.',
      'Comparing two algorithms before writing either.',
    ],
    avoid: [
      'Predicting exact run time — Big-O ignores constants, hardware and caching; measure instead.',
      'Agonising over tiny collections where any approach is instant.',
      'Picking a “faster” structure that makes the code harder to read when n stays small.',
    ],
  },
  comparison: {
    title: 'Choosing a data structure',
    headers: ['structure', 'great at', 'slow at', 'notes'],
    rows: [
      ['list', 'ordered data, index access, add/remove at the end', 'x in list, add/remove at the front or middle', 'the default sequence'],
      ['tuple', 'fixed records, dict keys', 'any change (immutable)', 'hashable if its items are'],
      ['set', 'membership, uniqueness, set algebra', 'order, indexing', 'items must be hashable'],
      ['dict', 'lookup / update by key, counting, grouping', 'searching by value', 'keeps insertion order (3.7+)'],
      ['deque', 'add/remove at both ends, sliding windows (maxlen)', 'index access in the middle', 'collections.deque'],
      ['heapq (list)', 'repeatedly taking the smallest item', 'searching, full sorted order', 'O(log n) push/pop'],
      ['sorted list + bisect', 'range queries, nearest value, low memory', 'inserting (O(n) shift)', 'must stay sorted'],
    ],
    note: py`More specialised tools — [Counter, defaultdict, deque](lesson:collections-module), [functools caches](lesson:functools) — build on these same few structures.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'performance-q1',
      type: 'mcq',
      prompt: 'An algorithm is O(n²). It takes 1 second for n = 1,000. Roughly how long would you expect for n = 2,000 (assuming the n² part dominates)?',
      options: [
        { text: 'About 2 seconds', why: 'That’s linear growth, O(n). For n², doubling n multiplies the work by 2² = 4.' },
        'About 4 seconds',
        { text: 'About 1,000 seconds', why: 'n² grows fast, but doubling n multiplies n² by 4, not by 1,000.' },
        { text: 'About 1 second — Big-O is about memory', why: 'Big-O can describe time or memory; here it describes how the amount of work grows.' },
      ],
      answer: 1,
      explanation: py`(2n)² = 4n². Big-O tells you the growth, not exact seconds — real timings also depend on constants and the machine, which is why you still measure.`,
    },
    {
      id: 'performance-q2',
      type: 'output',
      prompt: 'How many times can you halve one million before you reach 1? What does this print?',
      code: py`n = 1_000_000
steps = 0
while n > 1:
    n //= 2
    steps += 1
print(steps)`,
      answer: '19',
      accept: ['19'],
      explanation: py`2¹⁹ = 524,288 and 2²⁰ = 1,048,576, so a million halves 19 times before integer division reaches 1. That's why binary search over a million sorted items needs only about 20 steps: O(log n).`,
    },
    {
      id: 'performance-q3',
      type: 'bug',
      prompt: 'This works, but gets painfully slow with 100,000 users. Click the line whose cost grows with the number of users seen so far.',
      code: py`def unique_by_email(users):
    seen = []
    result = []
    for user in users:
        email = user["email"].lower()
        if email not in seen:
            seen.append(email)
            result.append(user)
    return result`,
      answerLine: 6,
      explanation: py`\`email not in seen\` scans the \`seen\` list — up to n comparisons, n times: O(n²). Make \`seen\` a set (\`seen = set()\`, \`seen.add(email)\`) and the check becomes O(1) on average, so the function is O(n).`,
    },
    {
      id: 'performance-q4',
      type: 'fill',
      prompt: 'Complete the queue so that both adding and removing are O(1).',
      code: py`from collections import ___

line = ___(["ada", "ben"])
line.append("cy")
first = line.___()`,
      answer: [['deque'], ['deque'], ['popleft']],
      explanation: py`\`deque\` supports O(1) \`append\` at the back and \`popleft\` at the front. A list's \`pop(0)\` would shift every remaining item.`,
    },
    {
      id: 'performance-q5',
      type: 'mcq',
      prompt: 'Which of these is O(1) on average in CPython?',
      options: [
        { text: 'item in my_list', why: 'A list has to compare item with its elements one by one: O(n).' },
        { text: 'my_list.insert(0, item)', why: 'Every existing element shifts one place right: O(n).' },
        'key in my_dict',
        { text: 'sorted(my_list)', why: 'Sorting is O(n log n).' },
      ],
      answer: 2,
      explanation: py`Dict (and set) membership hashes the key and inspects one slot (plus rare probes) — O(1) on average, O(n) only in pathological collision cases.`,
    },
    {
      id: 'performance-q6',
      type: 'mcq',
      prompt: 'You need the 10 highest scores out of a list that is updated rarely but read constantly. Which approach fits best?',
      options: [
        { text: 'Call sorted(scores, reverse=True)[:10] on every read', why: 'That re-sorts all n scores (O(n log n)) on every read, even though the data rarely changes.' },
        'Compute the top 10 when the scores change (e.g. heapq.nlargest) and reuse that result for reads',
        { text: 'Store the scores in a set for O(1) access', why: 'A set has no order at all, so it can’t give you the highest ones.' },
      ],
      answer: 1,
      explanation: py`Do the expensive work when the data changes, not on every read. \`heapq.nlargest(10, scores)\` is O(n log 10); after that each read is O(1). Choosing *when* to do work is as important as choosing the structure.`,
    },
    {
      id: 'performance-q7',
      type: 'short',
      prompt: 'Sets have O(1) membership and lists O(n). Give two situations where a list is still the better choice.',
      answer: py`When order or duplicates matter (a playlist, a sequence of events), when you need index access or slicing, when the items are unhashable (lists, dicts), when the collection is tiny and only checked once or twice (building a set costs O(n) itself), and when memory is tight — a list uses less memory per item than a set.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'mutual-friends',
      title: 'Mutual friends, fast',
      difficulty: 'beginner',
      prompt: py`\`mutual_friends(a, b)\` receives two lists of names and must return a **set** of the names that appear in both.

The starter is correct but compares every name in \`a\` with every name in \`b\` — O(len(a) × len(b)). Make it O(len(a) + len(b)) using sets. A test counts how many \`==\` comparisons your code makes on large lists, so the list-scanning version fails.`,
      files: {
        'main.py': py`def mutual_friends(a, b):
    return {name for name in a if name in b}


if __name__ == "__main__":
    print(sorted(mutual_friends(["ada", "ben", "cy"], ["cy", "dee", "ada"])))
`,
      },
      hints: [
        'Which data structure answers “is this name in there?” without scanning?',
        'Convert at least one list to a set before checking membership — and do it once, not inside the comprehension.',
        'return set(a) & set(b)',
      ],
      solution: {
        explanation: py`\`set(a)\` and \`set(b)\` each take one pass (O(len(a)) and O(len(b))). The intersection \`&\` then loops over the smaller set and does an O(1) average lookup in the other, so the whole function is linear. The original \`name in b\` scanned the list for every name — fine for three friends, painful for two accounts with 50,000 followers each.`,
        files: {
          'main.py': py`def mutual_friends(a, b):
    return set(a) & set(b)


if __name__ == "__main__":
    print(sorted(mutual_friends(["ada", "ben", "cy"], ["cy", "dee", "ada"])))
`,
        },
      },
      tests: [
        { name: 'finds the names in both lists', code: py`assert mutual_friends(["ada", "ben", "cy"], ["cy", "dee", "ada"]) == {"ada", "cy"}` },
        { name: 'returns a set', code: py`assert isinstance(mutual_friends(["a"], ["a"]), set)` },
        { name: 'nothing in common gives an empty set', code: py`assert mutual_friends(["ada"], ["ben"]) == set()` },
        { name: 'uses hashing, not pairwise comparisons', code: TICKET + py`a = [Ticket(i) for i in range(300)]
b = [Ticket(i) for i in range(150, 450)]
result = mutual_friends(a, b)
assert sorted(t.n for t in result) == list(range(150, 300))
assert Ticket.eq_calls < 3000, f"{Ticket.eq_calls} == comparisons: convert to sets"` },
      ],
    },
    {
      id: 'spend-per-customer',
      title: 'One pass instead of one pass per customer',
      difficulty: 'intermediate',
      prompt: py`\`spend_per_customer(orders, customers)\` gets a list of \`(customer, amount_in_pence)\` tuples and a list of customer names. Return a dict mapping **every** name in \`customers\` to the total they spent (\`0\` if they have no orders). Orders from customers not in the list are ignored.

The starter loops over **all** orders once for **each** customer: O(orders × customers). Rewrite it so that it goes through \`orders\` **exactly once** — a test counts how many times \`orders\` is iterated.`,
      files: {
        'main.py': py`def spend_per_customer(orders, customers):
    totals = {}
    for name in customers:
        totals[name] = sum(amount for customer, amount in orders if customer == name)
    return totals


if __name__ == "__main__":
    orders = [("ada", 350), ("ben", 800), ("ada", 1200), ("zoe", 99)]
    print(spend_per_customer(orders, ["ada", "ben", "cy"]))
`,
      },
      hints: [
        'Start with a dict that already contains every customer with a total of 0.',
        'Then loop over orders once and add each amount to the right entry — if that customer is one you were asked about.',
        'totals = dict.fromkeys(customers, 0); for customer, amount in orders: if customer in totals: totals[customer] += amount',
      ],
      solution: {
        explanation: py`\`dict.fromkeys(customers, 0)\` creates every entry in one pass over the customers. A single pass over the orders then does an O(1) average dict lookup (\`customer in totals\`) and an update per order. Total work: O(orders + customers) instead of O(orders × customers). This "group by key in one pass" pattern — a dict of accumulators — is one of the most useful in Python; \`collections.defaultdict(int)\` and \`Counter\` are shortcuts for it.`,
        files: {
          'main.py': py`def spend_per_customer(orders, customers):
    totals = dict.fromkeys(customers, 0)
    for customer, amount in orders:
        if customer in totals:
            totals[customer] += amount
    return totals


if __name__ == "__main__":
    orders = [("ada", 350), ("ben", 800), ("ada", 1200), ("zoe", 99)]
    print(spend_per_customer(orders, ["ada", "ben", "cy"]))
`,
        },
      },
      tests: [
        { name: 'totals per customer, 0 for no orders, others ignored', code: py`orders = [("ada", 350), ("ben", 800), ("ada", 1200), ("zoe", 99)]
assert spend_per_customer(orders, ["ada", "ben", "cy"]) == {"ada": 1550, "ben": 800, "cy": 0}` },
        { name: 'no customers gives an empty dict', code: py`assert spend_per_customer([("ada", 5)], []) == {}` },
        { name: 'iterates over orders exactly once', code: py`class CountingList(list):
    iterations = 0
    def __iter__(self):
        CountingList.iterations += 1
        return super().__iter__()

orders = CountingList([("c%d" % (i % 50), i) for i in range(500)])
customers = ["c%d" % i for i in range(50)]
result = spend_per_customer(orders, customers)
assert result["c0"] == sum(range(0, 500, 50))
assert CountingList.iterations == 1, f"orders was iterated {CountingList.iterations} times; loop over it once"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'performance-big-o-meaning',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does Big-O notation tell you about an algorithm — and what doesn’t it tell you?',
      answer: 'It describes how the work (or memory) grows as the input size n grows, keeping only the dominant term and ignoring constant factors. It doesn’t give actual run time, doesn’t show constants (a C built-in vs a Python loop), and usually describes the worst or average case for large n — so small inputs can behave differently.',
      explanation: py`O(n) means "proportional to n", O(n²) "proportional to n squared". Two O(n) functions can differ a lot in speed; an O(n²) function can beat an O(n log n) one for tiny n. Big-O is for reasoning about scaling; profiling is for actual numbers.`,
      whyAsked: 'A foundation question that shows whether you can reason about scale without hand-waving.',
      mistakes: ['Equating Big-O with seconds', 'Forgetting that constants matter for small n'],
      followUps: ['What is the complexity of x in list vs x in set?', 'What does amortised O(1) mean?'],
      modelAnswer: 'Big-O describes how the amount of work grows as the input gets bigger, keeping only the dominant term — so 3n² + 5n is just O(n²). It’s great for reasoning about scale: if I double n, an O(n) algorithm does roughly twice the work and an O(n²) one four times. What it doesn’t tell me is actual time: constant factors are dropped, so a C-implemented built-in can beat a hand-written loop with a better Big-O on small inputs. It usually describes the average or worst case for large n. So I use Big-O to choose an approach and a profiler to get real numbers.',
    },
    {
      id: 'performance-list-set-dict',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Compare a list, a set and a dict for checking whether a value is present. When would you pick each?',
      answer: 'list: O(n) membership, keeps order and duplicates, any values. set: O(1) average membership, unique hashable values, no order. dict: O(1) average key lookup with an associated value, insertion-ordered. Pick a list for small or ordered sequences, a set for repeated membership/uniqueness, a dict when you need to look something up by key.',
      explanation: py`Sets and dicts are hash tables — they trade extra memory for constant-time lookups and require hashable keys. Lists are compact and ordered but must be scanned.`,
      whyAsked: 'Data-structure choice is the most common practical performance decision.',
      mistakes: ['Saying sets are always better', 'Forgetting the hashability requirement'],
      followUps: ['What does it cost to build the set?', 'Why can’t a list be a dict key?'],
      modelAnswer: 'A list keeps order and duplicates and can hold anything, but checking membership means scanning, so it’s O(n). A set is a hash table: membership is O(1) on average, but items must be hashable, duplicates disappear and there’s no order. A dict is the same idea with a value attached to each key, and it keeps insertion order. So for a small list I check once, I just use the list; for repeated membership checks or de-duplication I convert to a set once; and when I need to find a record by an id, I use a dict. The price of the hash structures is extra memory.',
    },
    {
      id: 'performance-hidden-quadratic',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'What is the time complexity of this function, and how would you improve it?',
      code: { lang: 'python', code: py`def remove_blocked(messages, blocked_users):
    result = []
    for msg in messages:
        if msg["user"] not in blocked_users:   # blocked_users is a list
            result.append(msg)
    return result` },
      options: ['O(n)', 'O(n log n)', 'O(n × k) — n messages times k blocked users', 'O(1)'],
      correctOption: 2,
      answer: 'O(n × k): for each of n messages, `not in` scans the k-element list. Convert blocked_users to a set once before the loop to make it O(n + k).',
      explanation: py`The visible loop is O(n); the hidden one is the list membership test. One \`blocked = set(blocked_users)\` before the loop turns each check into O(1) on average.`,
      whyAsked: 'Spotting loops hidden inside operators is the core skill behind most real-world performance bugs.',
      mistakes: ['Answering O(n) because there is only one for loop', 'Converting to a set inside the loop'],
      followUps: ['What if blocked_users had only three entries?', 'What other list methods hide a loop?'],
      modelAnswer: 'It looks linear, but it’s O(n times k): for each of the n messages, not in on a list compares the user with up to k blocked users. I’d convert the list to a set once, before the loop, so each check is O(1) on average and the function becomes O(n plus k). It’s important to build the set outside the loop — rebuilding it per message would be even worse. Similar hidden loops are count, index, remove and pop(0) on lists. If blocked_users only ever has a handful of entries, the list is fine; it matters when k can grow.',
    },
    {
      id: 'performance-queue',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A job runner keeps pending jobs in a list, appends new jobs and takes the next one with `jobs.pop(0)`. With large backlogs it gets slow. Why, and what would you use instead — including if jobs had priorities?',
      answer: 'list.pop(0) is O(n) because every remaining element shifts left. Use collections.deque with append/popleft (both O(1)). For priorities use heapq (push/pop O(log n)) with (priority, counter, job) tuples; for multi-threaded producers/consumers use queue.Queue or queue.PriorityQueue.',
      explanation: py`The counter in the heap tuple breaks ties so jobs with the same priority come out in insertion order and the job objects themselves never have to be compared.`,
      code: { lang: 'python', code: py`import heapq
import itertools

order = itertools.count()
pending = []
heapq.heappush(pending, (2, next(order), "send email"))
heapq.heappush(pending, (1, next(order), "deploy"))
print(heapq.heappop(pending)[2])   # deploy` },
      whyAsked: 'Queues show up everywhere; knowing deque and heapq is expected of intermediate Python developers.',
      mistakes: ['Suggesting list.insert(0, ...) and pop() instead (still O(n))', 'Sorting the list after every insert'],
      followUps: ['Why include a counter in the heap tuple?', 'What does deque(maxlen=100) do?'],
      modelAnswer: 'A list is a contiguous array, so pop(0) has to shift every remaining job one place left — O(n) per job, O(n²) to drain a backlog. A collections.deque supports append at the back and popleft at the front in constant time, so that’s the drop-in fix. If jobs have priorities, I’d use heapq: push and pop are O(log n) and the smallest priority comes out first; I store (priority, counter, job) so ties keep insertion order and jobs never get compared. If several threads produce and consume, I’d use queue.Queue or queue.PriorityQueue, which add locking.',
    },
    {
      id: 'performance-dict-worst-case',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Dict lookups are “O(1)”. When are they not, and what does CPython do to protect against the worst case?',
      answer: 'O(1) is the average case; if many keys collide (same slot sequence), lookups degrade toward O(n). Badly designed __hash__ methods (e.g. returning a constant) cause it accidentally; attackers can cause it deliberately with crafted keys. CPython randomises str/bytes hashes per process (PYTHONHASHSEED) so collisions can’t be precomputed, and resizes tables before they get too full. Resizing makes insertion amortised O(1).',
      explanation: py`A custom class whose \`__hash__\` returns the same number for every instance turns every dict or set of them into a linear scan. Keep \`__hash__\` consistent with \`__eq__\` and based on the same immutable fields (see [special methods](lesson:special-methods)).`,
      code: { lang: 'python', code: py`class BadKey:
    def __init__(self, n):
        self.n = n
    def __hash__(self):
        return 42                  # every key collides
    def __eq__(self, other):
        return self.n == other.n

slow = {BadKey(i): i for i in range(500)}   # each insert probes past earlier keys` },
      whyAsked: 'Tests whether you understand hash tables rather than memorising “O(1)”.',
      mistakes: ['Claiming dict lookups are always constant time', 'Not knowing why hash randomisation exists'],
      followUps: ['What makes a good __hash__?', 'Why must equal objects have equal hashes?'],
      modelAnswer: 'Dicts are hash tables, so a lookup hashes the key and probes a few slots — constant time on average. If many keys produce colliding hashes, each lookup has to probe past all of them and it degrades toward linear time. That can happen by accident, with a custom __hash__ that returns the same value for everything, or on purpose, if an attacker sends thousands of keys designed to collide. CPython defends against the second by randomising string and bytes hashes per process, and it resizes the table before it gets too full, which keeps insertion amortised O(1). For my own classes I base __hash__ on the same immutable fields as __eq__.',
    },
    {
      id: 'performance-pair-total',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `pair_with_total(prices, budget)` that returns the indexes `(i, j)`, `i < j`, of two prices adding up to `budget`, or `None`. Return the pair that is **completed first** scanning left to right (smallest j); if the matching price appears more than once before j, use its first index. It must make a **single pass** over `prices` — the tests count how often your code iterates over or indexes the list.',
      answer: 'Keep a dict price → first index. For each j, price: if budget - price is in the dict, return (dict[budget - price], j); otherwise store the price (setdefault keeps the first index). O(n) time, O(n) extra memory.',
      explanation: py`The brute-force version checks every pair: O(n²). Remembering what you've seen in a dict turns "is there an earlier price that completes this one?" into an O(1) average lookup.`,
      starter: { files: { 'main.py': py`def pair_with_total(prices, budget):
    # Brute force: correct, but O(n²). Make it a single pass.
    for j in range(len(prices)):
        for i in range(j):
            if prices[i] + prices[j] == budget:
                return i, j
    return None


if __name__ == "__main__":
    print(pair_with_total([8, 3, 5, 12, 7], 15))
` } },
      tests: [
        { name: 'returns the first completed pair', code: py`assert pair_with_total([8, 3, 5, 12, 7], 15) == (1, 3)` },
        { name: 'same price twice', code: py`assert pair_with_total([5, 1, 5], 10) == (0, 2)` },
        { name: 'no pair gives None', code: py`assert pair_with_total([1, 2, 3], 100) is None` },
        { name: 'a single pass over prices', code: py`class Watched(list):
    touches = 0
    def __iter__(self):
        Watched.touches += 1
        return super().__iter__()
    def __getitem__(self, index):
        Watched.touches += 1
        return super().__getitem__(index)

prices = Watched(range(0, 400, 2))
assert pair_with_total(prices, 1) is None
assert Watched.touches <= len(prices), f"prices was iterated/indexed {Watched.touches} times"` },
      ],
      solution: { files: { 'main.py': py`def pair_with_total(prices, budget):
    first_index = {}
    for j, price in enumerate(prices):
        i = first_index.get(budget - price)
        if i is not None:
            return i, j
        first_index.setdefault(price, j)
    return None


if __name__ == "__main__":
    print(pair_with_total([8, 3, 5, 12, 7], 15))
` } },
      hints: ['For each price, which other price would complete the budget?', 'Remember the prices you have already seen in a dict: price → first index.', 'Check for the complement before storing the current price, so a price can’t pair with itself.'],
      whyAsked: 'A classic: trading O(n) memory for going from O(n²) to O(n) time with a dict.',
      mistakes: ['Storing the price before checking (pairs a price with itself)', 'Overwriting the first index with later duplicates'],
      followUps: ['What if prices were sorted — can you do it with O(1) extra memory?', 'How would you return all pairs?'],
      modelAnswer: 'The brute-force approach checks every pair, which is O(n squared). Instead I walk the list once and keep a dict from each price I’ve seen to its first index. For each new price at position j, the price that would complete the budget is budget minus price; if that’s in the dict, I return its index and j. Otherwise I store the current price with setdefault, so the earliest index wins. Checking before storing stops a price pairing with itself. That’s O(n) time and O(n) extra memory; if the list were sorted, two pointers from both ends would also work in O(n) with constant memory.',
    },
  ],

  takeaways: [
    'Big-O describes how work grows with input size n: O(1) < O(log n) < O(n) < O(n log n) < O(n²).',
    'Doubling n doubles O(n) work but quadruples O(n²) work — quadratic code is fine on test data and fails on real data.',
    'x in list is O(n); x in set and key in dict are O(1) on average (CPython hash tables).',
    'Lists are fast at the end, slow at the front: use deque for queues, heapq for “smallest next”, bisect for sorted searches.',
    'Watch for hidden loops: in / count / index / remove / pop(0) on lists inside a loop.',
    'Algorithmic wins (the right structure) beat micro-optimisations; Big-O ignores constants, so measure the result.',
    'Hash tables trade memory for speed and require hashable keys.',
  ],
}
