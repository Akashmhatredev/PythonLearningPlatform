// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TOOLKIT = py`# Pattern toolkit: ten interview patterns on one small online-shop dataset.
from bisect import bisect_right
from collections import Counter, deque
import heapq

ORDERS = ["tea", "cake", "tea", "bun", "cake", "tea", "jam"]
PRICES = [2, 4, 7, 9, 11, 15]                    # already sorted
DAILY_SALES = [120, 80, 200, 150, 90, 300, 60]
MENU = [("tea", 2), ("jam", 3), ("bun", 2), ("cake", 4)]
LINKS = {
    "home": ["shop", "blog"],
    "shop": ["cart", "item"],
    "blog": ["item"],
    "item": ["cart"],
    "cart": ["checkout"],
    "checkout": [],
}


def first_repeat(items):
    """Hashing: the first item seen twice. O(n) time with a set."""
    seen = set()
    for item in items:
        if item in seen:
            return item
        seen.add(item)
    return None


def pair_with_sum(prices, target):
    """Two pointers on a sorted list: O(n) time, O(1) extra space."""
    left, right = 0, len(prices) - 1
    while left < right:
        total = prices[left] + prices[right]
        if total == target:
            return prices[left], prices[right]
        if total < target:
            left += 1
        else:
            right -= 1
    return None


def best_window(values, k):
    """Sliding window: the largest sum of k consecutive values. O(n)."""
    window = sum(values[:k])
    best = window
    for i in range(k, len(values)):
        window += values[i] - values[i - k]   # add the new day, drop the oldest
        best = max(best, window)
    return best


def balanced(text):
    """Stack: does every closing bracket match the latest opening one?"""
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack


def fewest_clicks(links, start, goal):
    """BFS with a deque: fewest steps in an unweighted graph."""
    queue = deque([(start, 0)])
    seen = {start}
    while queue:
        page, clicks = queue.popleft()
        if page == goal:
            return clicks
        for nxt in links[page]:
            if nxt not in seen:
                seen.add(nxt)
                queue.append((nxt, clicks + 1))
    return -1


def reachable(links, page, seen=None):
    """DFS with recursion: every page you can reach from page."""
    if seen is None:
        seen = set()
    seen.add(page)
    for nxt in links[page]:
        if nxt not in seen:
            reachable(links, nxt, seen)
    return seen


def top_k(counts, k):
    """Heap: the k largest counts. O(n log k)."""
    return heapq.nlargest(k, counts.items(), key=lambda pair: pair[1])


def grade(score, cutoffs=(50, 60, 70, 80), letters="FDCBA"):
    """Binary search with bisect: which band is score in? O(log n)."""
    return letters[bisect_right(cutoffs, score)]


def prefix_sums(values):
    """Prefix sums: sums[i] is the total of values[:i]."""
    sums = [0]
    for value in values:
        sums.append(sums[-1] + value)
    return sums


sums = prefix_sums(DAILY_SALES)
print("1 hash     first repeat:", first_repeat(ORDERS))
print("2 pointers pair for 20:", pair_with_sum(PRICES, 20))
print("3 window   best 3 days:", best_window(DAILY_SALES, 3))
print("4 stack    balanced:", balanced("{[()]}"), balanced("(]"))
print("5 bfs      clicks to checkout:", fewest_clicks(LINKS, "home", "checkout"))
print("6 dfs      reachable from blog:", sorted(reachable(LINKS, "blog")))
print("7 heap     top 2:", top_k(Counter(ORDERS), 2))
print("8 bisect   grades:", [grade(s) for s in (45, 62, 75, 80)])
print("9 sort key cheapest:", sorted(MENU, key=lambda item: (item[1], item[0]))[:2])
print("10 prefix  days 2-4:", sums[5] - sums[2])
`

export default {
  id: 'coding-patterns',
  title: 'Coding interview patterns in Python',
  summary: 'Ten reusable patterns — hashing, two pointers, sliding window, stack, BFS, DFS, heaps, binary search, sort keys and prefix sums — written the idiomatic Python way, with their complexity.',
  difficulty: 'advanced',
  minutes: 75,
  prerequisites: ['dictionaries', 'sets', 'collections-module', 'recursion'],
  related: ['answering-framework', 'debugging-scenarios', 'rapid-review', 'list-operations', 'comprehensions', 'lambdas-and-higher-order', 'performance', 'functools', 'generators'],
  tags: ['coding interview', 'algorithms', 'data structures', 'big-o', 'complexity', 'hashing', 'two pointers', 'sliding window', 'stack', 'queue', 'bfs', 'dfs', 'heapq', 'top-k', 'binary search', 'bisect', 'sorting', 'prefix sums', 'leetcode'],
  apis: [
    { name: 'collections.Counter', summary: 'A dict subclass for counting hashable items; most_common(n) returns the n most frequent.' },
    { name: 'collections.defaultdict', summary: 'A dict that creates missing values with a factory, e.g. defaultdict(list) for grouping.' },
    { name: 'collections.deque', summary: 'A double-ended queue with O(1) append/pop at both ends — the right tool for BFS queues.' },
    { name: 'heapq.heappush() / heappop()', summary: 'Maintain a min-heap in a plain list: push and pop the smallest in O(log n).' },
    { name: 'heapq.nlargest(k, it, key=)', summary: 'The k largest items, O(n log k) — top-k without sorting everything.' },
    { name: 'bisect.bisect_left() / bisect_right()', summary: 'Binary search for an insertion point in a sorted list, O(log n).' },
    { name: 'sorted(it, key=, reverse=)', summary: 'Stable sort into a new list; key extracts what to compare, tuples sort by several fields.' },
    { name: 'itertools.accumulate()', summary: 'Running totals — a one-line way to build prefix sums.' },
  ],
  docs: [
    { label: 'collections — Counter, deque, defaultdict', url: 'https://docs.python.org/3/library/collections.html' },
    { label: 'heapq — heap queue algorithm', url: 'https://docs.python.org/3/library/heapq.html' },
    { label: 'bisect — array bisection algorithm', url: 'https://docs.python.org/3/library/bisect.html' },
    { label: 'Sorting techniques (HOWTO)', url: 'https://docs.python.org/3/howto/sorting.html' },
    { label: 'itertools.accumulate', url: 'https://docs.python.org/3/library/itertools.html#itertools.accumulate' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Coding interviews look endlessly varied, but most problems are a handful of **patterns** in disguise. A *pattern* is a reusable shape of solution: "keep a set of what I've seen", "move two indexes towards each other", "slide a window along the list".`,
    py`Python is a great interview language because the standard library already contains the data structures behind those patterns: \`dict\`/\`set\` for hashing, \`collections.deque\` for queues, \`heapq\` for priority queues, \`bisect\` for binary search, and \`sorted(key=...)\` for flexible ordering.`,
    py`For every pattern you'll learn the **signal** in the problem statement that suggests it, the idiomatic Python, and the **complexity** to say out loud. *Complexity* (Big-O) describes how the running time or memory grows as the input grows: O(n) means "doubling the input roughly doubles the work".`,
    py`Pair this with the [answering framework](lesson:answering-framework) (clarify → examples → approach → code → test → complexity) and the [debugging drills](lesson:debugging-scenarios).`,
  ],
  why: [
    py`Interviewers rarely want an algorithm you memorised; they want to see you **recognise** the shape of a problem, pick the right data structure, and explain the trade-off. Patterns give you a short checklist to run through when you're stuck: "Is there a sorted input? A contiguous range? A shortest path?"`,
    py`Patterns are also everyday engineering: de-duplicating records (hashing), rate limiters (sliding window + deque), schedulers (heaps), bucketing scores into bands (bisect), dashboards with range totals (prefix sums). The interview version is just the small, clean core.`,
    py`Finally, knowing the cost of Python's built-ins prevents the classic interview slip: an innocent-looking \`if x in some_list\` inside a loop that quietly makes the solution O(n²).`,
  ],
  eli15: [
    py`Think of patterns like moves in a sport. A footballer doesn't invent a new way to pass every time — they recognise the situation ("defender on my left, teammate free on the right") and pick a move they've practised.`,
    py`Coding problems are the same. "Find two prices that add up to £20 in a sorted list" → *two pointers*: one finger at the cheapest, one at the most expensive, move them inwards. "Best 3-day sales streak" → *sliding window*: a frame you slide one day at a time, adding the new day and dropping the oldest. "Fewest clicks from home page to checkout" → *BFS*: explore everything one click away, then two clicks, and so on.`,
    py`Learn ten moves, practise spotting when each fits, and most "new" problems stop being new.`,
  ],
  analogy: {
    title: 'A toolbox and the jobs it fits',
    body: [
      py`A plumber's toolbox has a few tools, each matched to a kind of job: a wrench for nuts, a plunger for blockages, a torch for dark cupboards. An apprentice learns *which job calls for which tool* — and that using a hammer on a pipe makes things worse.`,
      py`Coding patterns are your toolbox. The skill isn't owning the tools (Python gives you all of them for free); it's reading the job description and reaching for the right one quickly.`,
    ],
    mapping: [
      ['"Have I seen this before?"', 'hashing with a set or dict'],
      ['"Sorted list, find a pair"', 'two pointers'],
      ['"Best contiguous stretch"', 'sliding window'],
      ['"Most recent unmatched thing"', 'stack (list append/pop)'],
      ['"Fewest steps"', 'BFS with collections.deque'],
      ['"Explore every path"', 'DFS with recursion or an explicit stack'],
      ['"Top k / next smallest"', 'heapq'],
      ['"Where does this fit in sorted data?"', 'bisect'],
      ['"Total of any range, many times"', 'prefix sums'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Two pointers closing in on a target',
    props: {
      code: py`def pair_with_sum(prices, target):
    left, right = 0, len(prices) - 1
    while left < right:
        total = prices[left] + prices[right]
        if total == target:
            return prices[left], prices[right]
        if total < target:
            left += 1      # need a bigger sum
        else:
            right -= 1     # need a smaller sum
    return None


print(pair_with_sum([2, 4, 7, 9, 11, 15], 20))
`,
      notes: {
        2: 'One index at each end of the **sorted** list.',
        4: 'Look at the smallest and largest remaining prices together.',
        7: 'Too small: the only way to grow the sum is to move `left` right (towards bigger prices).',
        9: 'Too big: move `right` left (towards smaller prices). Each step rules out one price for good.',
        6: 'Found it — at most n - 1 steps in total, so O(n) time and O(1) extra space.',
      },
    },
    alt: 'A step-by-step trace of pair_with_sum on the sorted list 2, 4, 7, 9, 11, 15 with target 20. left starts at index 0 and right at index 5. The sums 17 and 19 are too small so left moves right; 22 is too big so right moves left; 18 is too small so left moves right; 9 plus 11 equals 20 and the function returns (9, 11).',
    caption: py`Watch \`left\` and \`right\` move. The sortedness is what makes it work: every comparison safely throws away one candidate, so the loop runs at most n - 1 times.`,
  },
  syntax: [
    py`#### The cost of Python's building blocks (say these out loud)`,
    py`| operation | typical cost | note |
|---|---|---|
| \`lst.append(x)\`, \`lst.pop()\` | O(1) amortised | the end of a list is cheap |
| \`lst.insert(0, x)\`, \`lst.pop(0)\` | O(n) | everything shifts — use \`deque\` for queues |
| \`x in lst\` | O(n) | a scan |
| \`x in st\`, \`d[key]\` | O(1) average | hashing; O(n) worst case |
| \`sorted(it)\`, \`lst.sort()\` | O(n log n) | stable |
| \`heapq.heappush\` / \`heappop\` | O(log n) | min-heap in a list |
| \`heapq.heapify(lst)\` | O(n) | |
| \`heapq.nlargest(k, it)\` | O(n log k) | |
| \`bisect.bisect_left(lst, x)\` | O(log n) | the list must be sorted |
| \`bisect.insort(lst, x)\` | O(n) | search is O(log n), but inserting shifts items |
| \`lst[a:b]\` | O(b - a) | slicing copies |`,
    { callout: 'note', title: 'CPython detail', text: py`These costs describe CPython's implementations (dynamic arrays for lists, hash tables for dicts and sets, a doubly linked list of blocks for \`deque\`). The language docs mostly don't promise complexities, but every mainstream implementation behaves this way, and interviewers expect you to know them.` },
    py`#### The ten patterns at a glance`,
    { code: py`from bisect import bisect_left
from collections import Counter, defaultdict, deque
from itertools import accumulate
import heapq

words = ["tea", "cake", "tea", "jam"]
counts = Counter(words)                       # hashing: counts["tea"] == 2
groups = defaultdict(list)                    # hashing: group by a key
for w in words:
    groups[len(w)].append(w)

stack = []                                    # stack: append + pop
stack.append("("); stack.pop()

queue = deque(["home"])                       # queue/BFS: append + popleft
queue.append("shop"); queue.popleft()

heap = [5, 1, 4]                              # heap: smallest at heap[0]
heapq.heapify(heap)
smallest = heapq.heappop(heap)

prices = [2, 4, 7, 9]
i = bisect_left(prices, 7)                    # binary search: index 2

people = [("ada", 30), ("ben", 25)]
by_age = sorted(people, key=lambda p: p[1])   # sorting with a key

running = list(accumulate([3, 1, 4], initial=0))   # prefix sums: [0, 3, 4, 8]`, lang: 'python', title: 'the tools behind the patterns' },
    { callout: 'version', title: 'Version notes', text: py`\`accumulate(..., initial=0)\` needs Python 3.8+. \`heapq\` is a **min**-heap; Python 3.14 adds max-heap functions (\`heapq.heappush_max\`, \`heappop_max\`, \`heapify_max\`, …). On older versions, push negated numbers (\`-score\`) to simulate a max-heap — the version-proof trick interviewers still expect.` },
    py`#### Recognising the pattern`,
    py`- **"Seen before?", "count", "group by", "pair adds to"** → hashing (\`set\`, \`dict\`, \`Counter\`, \`defaultdict\`).
- **Sorted input + pair/triplet, or "in place"** → two pointers.
- **"Contiguous", "substring", "subarray", "streak", "window of k"** → sliding window.
- **"Matching brackets", "undo", "next greater"** → stack.
- **"Fewest steps", "levels", "nearest"** in an unweighted graph or grid → BFS with \`deque\`.
- **"All paths", "connected", "explore", tree recursion** → DFS.
- **"Top k", "k-th largest", "merge k sorted", "schedule by priority"** → heap.
- **"Sorted data, find position/first ≥ x", "minimum value that works"** → binary search / \`bisect\`.
- **"Order by several things", "intervals"** → sort with a \`key\`, then one pass.
- **"Sum of any range, many queries", "subarray sums to k"** → prefix sums (often + a dict).`,
  ],
  walkthrough: {
    title: 'A tour of the toolkit',
    lang: 'python',
    code: TOOLKIT,
    intro: py`The playground runs every pattern on the same tiny shop dataset. Press **Guide** in the playground to step through these notes in the editor.`,
    steps: [
      { lines: [20, 27], text: py`**Hashing.** A \`set\` answers "seen it?" in O(1) on average, so one pass is O(n). The same check against a list would be O(n) per item — O(n²) overall.` },
      { lines: [30, 41], text: py`**Two pointers.** Only valid because \`PRICES\` is sorted. Each comparison discards one price permanently, so the loop runs at most n - 1 times.` },
      { lines: [44, 51], text: py`**Sliding window.** Instead of re-summing every window (O(n·k)), add the new value and subtract the one leaving: O(n) total.` },
      { lines: [54, 64], text: py`**Stack.** A list used with \`append\`/\`pop\` is a stack: the most recent opening bracket must match the next closing one. An empty stack at the end means everything matched.` },
      { lines: [67, 79], text: py`**BFS.** \`deque.popleft()\` is O(1) (a list's \`pop(0)\` is O(n)). Marking pages as seen *when queued* prevents duplicates. Exploring in waves guarantees the first time we reach the goal is via the fewest clicks.` },
      { lines: [82, 90], text: py`**DFS.** Recursion goes as deep as possible before backtracking. Note the safe default: \`seen=None\`, then a fresh set — a mutable default (\`seen=set()\`) would be shared between calls (see [debugging drills](lesson:debugging-scenarios)).` },
      { lines: [93, 95], text: py`**Heap.** \`nlargest(k, ...)\` keeps only k candidates in a heap: O(n log k) instead of sorting all n items.` },
      { lines: [98, 100], text: py`**Binary search.** \`bisect_right\` finds how many cutoffs are ≤ the score in O(log n); that count indexes straight into the letters.` },
      { lines: [103, 108], text: py`**Prefix sums.** One O(n) pass, then the total of any range \`values[a:b]\` is \`sums[b] - sums[a]\` in O(1).` },
      { lines: [111, 121], text: py`Each line prints one pattern's result. Line 120 is **sorting with a key**: a tuple key \`(price, name)\` sorts by price, then alphabetically to break ties.` },
    ],
  },
  playground: {
    title: 'Pattern toolkit',
    objective: 'Run all ten patterns, then extend the toolkit: add a counter, guard the window, rebuild a BFS path and count with bisect.',
    files: { 'main.py': TOOLKIT },
    expected: py`One line per pattern:

\`\`\`text
1 hash     first repeat: tea
2 pointers pair for 20: (9, 11)
3 window   best 3 days: 540
4 stack    balanced: True False
5 bfs      clicks to checkout: 3
6 dfs      reachable from blog: ['blog', 'cart', 'checkout', 'item']
7 heap     top 2: [('tea', 3), ('cake', 2)]
8 bisect   grades: ['F', 'C', 'B', 'A']
9 sort key cheapest: [('bun', 2), ('tea', 2)]
10 prefix  days 2-4: 440
\`\`\``,
    experiments: [
      {
        id: 'most-common',
        task: py`Add \`most_common_item(orders)\` that returns the item ordered most often, using \`Counter\`. Print it for \`ORDERS\`.`,
        hint: py`\`Counter(orders).most_common(1)\` returns a list with one \`(item, count)\` pair.`,
        tests: [
          { name: 'most_common_item exists', code: py`assert callable(ns.get('most_common_item')), 'Define most_common_item(orders)'` },
          { name: 'finds the most common item', code: py`assert most_common_item(["jam", "bun", "jam"]) == "jam"
assert most_common_item(ORDERS) == "tea"` },
        ],
        explain: py`\`Counter(orders).most_common(1)[0][0]\` counts in O(n). \`most_common()\` with no argument sorts everything; with an argument \`k\` it uses a heap — the same idea as \`top_k\`.`,
      },
      {
        id: 'window-guard',
        task: py`\`best_window(values, k)\` silently returns nonsense when \`k\` is 0 or larger than the list. Make it raise \`ValueError\` when \`k < 1\` or \`k > len(values)\`.`,
        hint: py`Put the check at the very top of \`best_window\`, before \`sum(values[:k])\`.`,
        tests: [
          { name: 'k bigger than the list raises', code: py`with raises(ValueError):
    best_window([1, 2], 5)` },
          { name: 'k of 0 raises', code: py`with raises(ValueError):
    best_window([1, 2], 0)` },
          { name: 'normal windows still work', code: py`assert best_window(DAILY_SALES, 3) == 540` },
        ],
        explain: py`\`values[:5]\` on a 2-item list doesn't fail — slicing is forgiving — so the bug would hide. Clarifying edge cases (empty input, k out of range) and validating them is exactly what the [answering framework](lesson:answering-framework) asks for.`,
      },
      {
        id: 'bfs-route',
        task: py`Write \`shortest_route(links, start, goal)\` that returns the **list of pages** on a shortest route (e.g. \`["home", "shop", "cart", "checkout"]\`), or \`None\` if the goal can't be reached.`,
        hint: py`Copy \`fewest_clicks\`, but keep a \`parent = {start: None}\` dict instead of a seen set. When you reach the goal, follow \`parent\` back to the start and reverse the list.`,
        tests: [
          { name: 'shortest_route exists', code: py`assert callable(ns.get('shortest_route')), 'Define shortest_route(links, start, goal)'` },
          { name: 'finds the route', code: py`assert shortest_route(LINKS, "home", "checkout") == ["home", "shop", "cart", "checkout"]` },
          { name: 'start == goal', code: py`assert shortest_route(LINKS, "cart", "cart") == ["cart"]` },
          { name: 'unreachable gives None', code: py`assert shortest_route(LINKS, "checkout", "home") is None` },
        ],
        explain: py`A \`parent\` dict doubles as the seen set *and* records how you reached each node. Walking back from the goal rebuilds the path in O(length). BFS explores in order of distance, so the first path found is a shortest one.`,
      },
      {
        id: 'count-between',
        task: py`Add \`count_between(sorted_values, low, high)\` that returns how many values are **between low and high inclusive**, using \`bisect_left\` and \`bisect_right\` (O(log n), no loop).`,
        hint: py`Import \`bisect_left\` too. The answer is \`bisect_right(values, high) - bisect_left(values, low)\`.`,
        tests: [
          { name: 'count_between exists', code: py`assert callable(ns.get('count_between')), 'Define count_between(sorted_values, low, high)'` },
          { name: 'counts duplicates at the edges', code: py`assert count_between([1, 3, 3, 5, 8], 3, 5) == 3` },
          { name: 'empty range', code: py`assert count_between([1, 2], 5, 9) == 0` },
        ],
        explain: py`\`bisect_left(values, low)\` is the index of the first value ≥ low; \`bisect_right(values, high)\` is the index just past the last value ≤ high. Their difference counts the values in between — two O(log n) searches, whatever the size of the range.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Pattern picker: signal → tool',
    props: {
      layout: 'grid',
      cols: 5,
      nodes: [
        { id: 'hash', label: 'Hashing', note: 'set / dict / Counter', tone: 'yellow' },
        { id: 'two', label: 'Two pointers', note: 'sorted input', tone: 'blue' },
        { id: 'window', label: 'Sliding window', note: 'contiguous range', tone: 'blue' },
        { id: 'stack', label: 'Stack', note: 'list append/pop', tone: 'paper' },
        { id: 'bfs', label: 'BFS', note: 'deque', tone: 'kraft' },
        { id: 'dfs', label: 'DFS', note: 'recursion / stack', tone: 'kraft' },
        { id: 'heap', label: 'Heap', note: 'heapq', tone: 'red' },
        { id: 'bisect', label: 'Binary search', note: 'bisect', tone: 'ink' },
        { id: 'sort', label: 'Sort + key', note: 'sorted(key=...)', tone: 'paper' },
        { id: 'prefix', label: 'Prefix sums', note: 'accumulate', tone: 'yellow' },
      ],
      steps: [
        { focus: ['hash'], text: py`**"Have I seen it? How many? Which ones pair up?"** → hashing. Trade O(n) memory for O(1)-average lookups. Most O(n²) brute forces become O(n) here.` },
        { focus: ['two'], text: py`**Sorted input, find a pair/triplet, or compact in place** → two pointers. O(n) time, O(1) extra space. If the input isn't sorted, sorting first costs O(n log n) — or use hashing instead.` },
        { focus: ['window'], text: py`**"Longest/shortest/best contiguous stretch"** → sliding window. Grow the right edge, shrink the left while the window is invalid. Each index enters and leaves once: O(n).` },
        { focus: ['stack'], text: py`**"Most recent unmatched", brackets, undo, "next greater element"** → stack. Python's list is the stack: \`append\` and \`pop\` are O(1).` },
        { focus: ['bfs'], text: py`**"Fewest steps" in an unweighted graph or grid** → BFS with \`collections.deque\`. O(V + E): every node and edge is handled once.` },
        { focus: ['dfs'], text: py`**"Explore everything", connected regions, all paths, tree recursion** → DFS. Recursion is shortest to write; switch to an explicit stack for very deep inputs (CPython's default recursion limit is 1000).` },
        { focus: ['heap'], text: py`**"Top k", "k-th largest", "always process the smallest next"** → \`heapq\`. Push/pop O(log n); \`nlargest(k)\` is O(n log k).` },
        { focus: ['bisect'], text: py`**Sorted data: "where would x go?", "first value ≥ x", "how many in a range?"** → \`bisect\`. O(log n) per query.` },
        { focus: ['sort'], text: py`**"Order by several criteria", intervals, "group adjacent"** → \`sorted\` with a tuple \`key\`, then a single pass. O(n log n), and Python's sort is stable.` },
        { focus: ['prefix'], text: py`**"Sum of any range, many times", "subarray sums to k"** → prefix sums, often paired with a dict of earlier sums. O(n) set-up, O(1) per range.` },
      ],
    },
    alt: 'A grid of ten boxes, one per pattern: Hashing, Two pointers, Sliding window, Stack, BFS, DFS, Heap, Binary search, Sort plus key, Prefix sums. Each step highlights one box and states the wording in a problem that signals it, the Python tool, and its typical complexity.',
    caption: py`Use this as a checklist when you're stuck: read the prompt again and look for the signal words.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`**Big-O** is a way to describe how work grows with input size *n*, ignoring constant factors. O(1): same work whatever the size. O(log n): grows very slowly (each step halves the problem, like guessing a number with "higher/lower"). O(n): one pass. O(n log n): sorting. O(n²): a loop inside a loop over the same data.`,
      py`Most pattern wins come from swapping a hidden inner loop for a data structure. \`if x in my_list\` is a loop in disguise; \`if x in my_set\` is a hash lookup. That one change often turns O(n²) into O(n).`,
      { code: py`orders = ["tea", "cake", "jam", "bun"]
trending = ["jam", "tea"]

# O(len(orders) * len(trending)): 'in' scans the list each time
hot = [o for o in orders if o in trending]

# O(len(orders) + len(trending)): build a set once, then O(1)-average checks
trending_set = set(trending)
hot = [o for o in orders if o in trending_set]
print(hot)   # ['tea', 'jam']`, lang: 'python', title: 'the most common speed-up in interviews' },
    ],
    technical: [
      py`**Hash tables.** \`dict\` and \`set\` hash the key to find a slot directly, so lookups are O(1) on *average*. Many colliding hashes degrade them towards O(n), which is why keys must have good, stable hashes — and must be immutable (hashable). See [sets](lesson:sets) and [dictionaries](lesson:dictionaries).`,
      py`**Lists are dynamic arrays.** Appending at the end is amortised O(1) (the array occasionally grows by more than one slot), but inserting or removing at the front shifts every element: O(n). That's why BFS uses \`deque\`, whose \`popleft()\` is O(1).`,
      py`**\`heapq\` is a binary min-heap stored in a list**: \`heap[0]\` is always the smallest, and each parent at index i is ≤ its children at 2i+1 and 2i+2. The list as a whole is **not** sorted. Tuples compare element by element, so \`(priority, name)\` pairs work — but if priorities tie and the second items aren't comparable (dicts, custom objects), you get a \`TypeError\`; add a counter as a tie-breaker: \`(priority, next(counter), task)\`.`,
      py`**Sorting.** \`sorted\` and \`list.sort\` are guaranteed **stable** (equal keys keep their original order), which lets you sort by several keys in passes or with a tuple key. CPython uses an adaptive merge sort (Timsort-derived) that is very fast on partially sorted data — a CPython detail; stability is the language guarantee. See [sorting & searching](lesson:list-operations).`,
      py`**Recursion depth.** Each recursive call adds a frame. CPython limits the depth (\`sys.getrecursionlimit()\`, 1000 by default) and raises \`RecursionError\` beyond it. Python doesn't optimise tail calls, so DFS over a very deep structure (a 10,000-node linked chain) should use an explicit stack. See [recursion](lesson:recursion).`,
    ],
    production: [
      py`**Reach for the standard library first.** \`Counter\`, \`defaultdict\`, \`deque(maxlen=...)\`, \`heapq\`, \`bisect\`, \`itertools\` and \`functools.cache\` are implemented in C in CPython, well tested and idiomatic. In interviews, using them is a plus — just be ready to explain what they do underneath.`,
      py`**Real-world equivalents:** de-duplicating events (hashing), API rate limiters (a deque of timestamps — a sliding window over time), job schedulers and "next deadline" timers (heaps), mapping scores or prices to bands (\`bisect\`), dashboards answering "revenue between two dates" (prefix sums or a database index), dependency resolution (DFS / \`graphlib.TopologicalSorter\`).`,
      py`**Measure, don't guess.** Big-O tells you how things scale; actual speed depends on constants, data shape and memory. Use \`timeit\` for micro-benchmarks and a profiler for programs ([profiling](lesson:profiling), [performance](lesson:performance)). Say this in interviews too: "asymptotically this is better; for small inputs I'd measure".`,
      py`**Readability still matters.** A clear O(n log n) solution with \`sorted\` often beats a clever O(n) one nobody can maintain. State both, pick deliberately, and explain why.`,
    ],
  },
  mistakes: [
    {
      title: 'Using a list as a queue',
      wrong: { code: py`queue = ["home"]
while queue:
    page = queue.pop(0)     # O(n): shifts every remaining item
    print(page)`, lang: 'python' },
      right: { code: py`from collections import deque

queue = deque(["home"])
while queue:
    page = queue.popleft()  # O(1)
    print(page)`, lang: 'python' },
      explanation: py`\`list.pop(0)\` moves every other element one slot left. On a BFS over a big graph this turns O(V + E) into something much slower. \`deque\` is designed for both ends.`,
    },
    {
      title: 'Membership tests against a list inside a loop',
      wrong: { code: py`def common(a, b):
    return [x for x in a if x in b]        # O(len(a) * len(b))`, lang: 'python' },
      right: { code: py`def common(a, b):
    b_set = set(b)                         # O(len(b)) once
    return [x for x in a if x in b_set]    # O(len(a)) on average`, lang: 'python' },
      explanation: py`The hidden inner loop is the most common accidental O(n²). Converting to a set keeps \`a\`'s order and duplicates while making each check O(1) on average.`,
    },
    {
      title: 'Treating a heap list as sorted',
      wrong: { code: py`import heapq

h = []
for x in [5, 1, 4, 2, 3]:
    heapq.heappush(h, x)
print(h[-1])    # 3, not the largest!`, lang: 'python' },
      right: { code: py`import heapq

h = []
for x in [5, 1, 4, 2, 3]:
    heapq.heappush(h, x)
print(h[0], max(h), heapq.nlargest(1, h))   # 1 5 [5]`, lang: 'python' },
      explanation: py`Only \`h[0]\` is guaranteed (the smallest). The rest of the list is in heap order — \`[1, 2, 4, 5, 3]\` here — not sorted order.`,
    },
    {
      title: 'Binary search on unsorted data',
      wrong: { code: py`from bisect import bisect_left

scores = [70, 20, 90, 40]
print(bisect_left(scores, 40))   # meaningless: the list isn't sorted`, lang: 'python' },
      right: { code: py`from bisect import bisect_left

scores = sorted([70, 20, 90, 40])   # [20, 40, 70, 90]
print(bisect_left(scores, 40))      # 1`, lang: 'python' },
      explanation: py`\`bisect\` doesn't check sortedness — it just returns a wrong answer. Sort once (O(n log n)) when you will search many times; for a single lookup, a linear scan is cheaper than sorting.`,
    },
    {
      title: 'Forgetting to mark nodes as visited',
      wrong: { code: py`from collections import deque

def bfs(links, start):
    queue = deque([start])
    while queue:
        page = queue.popleft()
        queue.extend(links[page])   # cycles => never ends`, lang: 'python', static: true },
      right: { code: py`from collections import deque

def bfs(links, start):
    seen = {start}
    queue = deque([start])
    while queue:
        page = queue.popleft()
        for nxt in links[page]:
            if nxt not in seen:      # mark when queued
                seen.add(nxt)
                queue.append(nxt)
    return seen`, lang: 'python' },
      explanation: py`Real graphs have cycles (A links to B, B links back to A). Without a \`seen\` set, BFS or DFS revisits nodes forever or blows up the queue. Marking on enqueue also avoids queueing the same node twice.`,
    },
  ],
  debugging: [
    {
      symptom: py`RecursionError: maximum recursion depth exceeded`,
      cause: py`Recursive DFS on a very deep structure (or a missing base case). CPython's default limit is 1000 frames.`,
      fix: py`Check the base case first. If the input is legitimately deep, rewrite with an explicit stack (\`stack = [start]; while stack: node = stack.pop()\`) rather than raising the limit.`,
    },
    {
      symptom: py`TypeError: '<' not supported between instances of 'dict' and 'dict'`,
      cause: py`Pushing \`(priority, payload)\` tuples onto a heap: when two priorities tie, Python compares the payloads.`,
      fix: py`Add a unique tie-breaker: \`heapq.heappush(h, (priority, next(counter), payload))\` with \`counter = itertools.count()\`.`,
    },
    {
      symptom: py`IndexError: list index out of range in a two-pointer or window loop`,
      cause: py`An off-by-one boundary: \`right = len(items)\` instead of \`len(items) - 1\`, or reading \`items[i + 1]\` on the last index.`,
      fix: py`Write the loop invariant in a comment ("left and right are valid indexes, left < right") and test with lists of length 0, 1 and 2.`,
    },
    {
      symptom: py`KeyError: 'checkout' while traversing a graph`,
      cause: py`A node with no outgoing edges isn't a key in the adjacency dict.`,
      fix: py`Use \`links.get(page, ())\`, or build the graph with \`defaultdict(list)\` so every node exists.`,
    },
    {
      symptom: py`The solution is correct but times out on big inputs.`,
      cause: py`A hidden O(n²): \`in\` on a list, \`list.pop(0)\`, \`insert(0, ...)\`, slicing or \`sum()\` inside a loop, or string \`+=\` in a loop.`,
      fix: py`Find the inner loop (including hidden ones) and replace it with a set/dict, a deque, a running total, or \`"".join()\`.`,
    },
  ],
  bestPractices: [
    'Say the brute force and its complexity first, then the pattern that improves it.',
    'Name the signal: "contiguous range, so a sliding window".',
    'Use the standard library: Counter, defaultdict, deque, heapq, bisect, sorted(key=...).',
    'Use sets/dicts for membership; never `in` on a list inside a loop over large data.',
    'Use deque for queues; list append/pop for stacks.',
    'Mark graph nodes as seen when you enqueue them.',
    'Prefer an explicit stack over deep recursion for inputs that can be thousands of levels deep.',
    'Test with empty input, one element, duplicates, and negative numbers where they are allowed.',
    'State time and space complexity, including average vs worst case for hashing.',
  ],
  useCases: [
    'De-duplicating and counting events, words, products or log lines (hashing, Counter).',
    'Rate limiting requests within a time window (sliding window with a deque).',
    'Finding the nearest location or fewest hops in a network (BFS).',
    'Resolving dependencies or detecting cycles (DFS).',
    'Leaderboards, schedulers and "next job" queues (heapq).',
    'Mapping scores, prices or timestamps into bands (bisect).',
    'Range totals for dashboards and reports (prefix sums).',
  ],
  whenToUse: {
    use: [
      'Hashing when you need fast "seen before?", counting or grouping.',
      'Two pointers when the input is sorted (or sorting it is acceptable).',
      'A sliding window for contiguous subarrays/substrings with a condition you can update incrementally.',
      'BFS for shortest paths in unweighted graphs; a heap-based search (Dijkstra) when edges have weights.',
      'Prefix sums when you answer many range-sum queries over unchanging data.',
    ],
    avoid: [
      'Sliding windows when values can be negative and the condition depends on the sum — use prefix sums + a dict instead.',
      'BFS for weighted shortest paths: it ignores weights.',
      'Recursion for inputs that can be very deep.',
      'Sorting everything when you only need the top k — use heapq.nlargest.',
      'Clever patterns for tiny inputs where a clear loop is fast enough and easier to read.',
    ],
  },
  comparison: {
    title: 'Pattern cheat sheet',
    headers: ['pattern', 'signal in the prompt', 'Python tool', 'typical time / extra space'],
    rows: [
      ['hashing', 'seen? count? group? pair sums to k?', 'set, dict, Counter, defaultdict', 'O(n) / O(n)'],
      ['two pointers', 'sorted input, pair, in place', 'two indexes in a while loop', 'O(n) / O(1)'],
      ['sliding window', 'contiguous, substring, streak, window of k', 'two indexes + running state', 'O(n) / O(k) or O(1)'],
      ['stack', 'brackets, undo, next greater', 'list append/pop', 'O(n) / O(n)'],
      ['BFS', 'fewest steps, levels, nearest', 'collections.deque + seen set', 'O(V + E) / O(V)'],
      ['DFS', 'explore all, connected, paths, trees', 'recursion or list as stack', 'O(V + E) / O(V)'],
      ['heap', 'top k, k-th largest, next by priority', 'heapq', 'O(n log k) / O(k)'],
      ['binary search', 'sorted, first ≥ x, count in range', 'bisect', 'O(log n) per query'],
      ['sort + key', 'order by several fields, intervals', 'sorted(key=...)', 'O(n log n) / O(n)'],
      ['prefix sums', 'many range sums, subarray sums to k', 'itertools.accumulate, list, dict', 'O(n) set-up, O(1) per query'],
    ],
    note: py`Hashing costs are averages; worst case is O(n) per operation. Space for sorting is CPython's merge-sort buffer; \`sorted\` also returns a new list.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'coding-patterns-q1',
      type: 'mcq',
      prompt: '"Find the longest stretch of consecutive days on which a shop sold at least 100 items." Which pattern fits best?',
      options: [
        { text: 'Binary search with bisect', why: 'Nothing is sorted here, and you are looking for a contiguous stretch, not a position.' },
        'Sliding window',
        { text: 'BFS with a deque', why: 'BFS finds shortest paths in graphs; there is no graph in this problem.' },
        { text: 'A heap of the best days', why: 'A heap finds the top days, but they need not be consecutive.' },
      ],
      answer: 1,
      explanation: py`"Longest stretch of **consecutive** days" = longest contiguous subarray satisfying a condition: a sliding window. Grow the right edge; when a day breaks the rule, move the left edge past it. O(n).`,
    },
    {
      id: 'coding-patterns-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from bisect import bisect_left, bisect_right

scores = [10, 20, 20, 30]
print(bisect_left(scores, 20), bisect_right(scores, 20))`,
      answer: '1 3',
      explanation: py`\`bisect_left\` returns the position *before* any existing 20s (index 1); \`bisect_right\` returns the position *after* them (index 3). Their difference, 2, is how many 20s there are.`,
    },
    {
      id: 'coding-patterns-q3',
      type: 'bug',
      prompt: '`contains([3], 3)` returns `False`. Click the line with the bug.',
      code: py`def contains(sorted_items, target):
    lo, hi = 0, len(sorted_items) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if sorted_items[mid] == target:
            return True
        if sorted_items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False`,
      answerLine: 3,
      explanation: py`With an *inclusive* \`hi\` (the last valid index), the search range \`lo..hi\` still holds one candidate when \`lo == hi\`. The loop must be \`while lo <= hi\`. With \`lo < hi\`, single-element lists and the last remaining candidate are never checked. In real code, prefer \`bisect\`, which gets the boundaries right for you.`,
    },
    {
      id: 'coding-patterns-q4',
      type: 'fill',
      prompt: 'Complete the sliding-window update (drop the value leaving the window) and the Counter call that returns the two most frequent words.',
      code: py`for i in range(k, len(values)):
    window += values[i] - values[___]

top_two = Counter(words).___(2)`,
      answer: [['i - k', 'i-k'], ['most_common']],
      explanation: py`When index \`i\` enters a window of size k, index \`i - k\` leaves it. \`Counter.most_common(n)\` returns the n most frequent \`(item, count)\` pairs.`,
    },
    {
      id: 'coding-patterns-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from collections import deque

q = deque([1, 2, 3])
q.append(4)
q.appendleft(0)
q.popleft()
q.pop()
q.rotate(1)
print(list(q), q[0])`,
      options: [
        { text: '[1, 2, 3] 1', why: 'You stopped before rotate(1), which moves the last item to the front.' },
        '[3, 1, 2] 3',
        { text: '[2, 3, 1] 2', why: 'That is rotate(-1). A positive rotate moves items to the right, wrapping the last one to the front.' },
        { text: '[0, 1, 2, 3] 0', why: 'popleft() removed the 0 that appendleft added, and pop() removed the 4.' },
      ],
      answer: 1,
      explanation: py`After the appends: \`[0, 1, 2, 3, 4]\`. \`popleft()\` removes 0, \`pop()\` removes 4: \`[1, 2, 3]\`. \`rotate(1)\` moves the last item to the front: \`[3, 1, 2]\`, so \`q[0]\` is 3.`,
    },
    {
      id: 'coding-patterns-q6',
      type: 'mcq',
      prompt: 'For each of n orders you check `if order_id in refunded_ids`, where `refunded_ids` is a **list** of m ids. What is the total time, and how do you fix it?',
      options: [
        { text: 'O(n) — `in` is a single operation', why: '`in` on a list scans it: O(m) per check.' },
        'O(n·m); convert refunded_ids to a set once, making it O(n + m) on average',
        { text: 'O(n log m); sort the list first', why: 'Sorting alone does not speed up `in`; you would also need bisect. A set is simpler and faster on average.' },
        { text: 'O(m); the loop is over n but the work is in the list', why: 'Each of the n checks scans up to m items, so the costs multiply.' },
      ],
      answer: 1,
      explanation: py`Each list membership test is a linear scan. Building a set costs O(m) once; then each check is O(1) on average. Total O(n + m).`,
    },
    {
      id: 'coding-patterns-q7',
      type: 'short',
      prompt: 'Why does BFS find the fewest steps in an unweighted graph, and why would DFS not?',
      answer: py`BFS explores in waves: all nodes 1 step away, then all nodes 2 steps away, and so on, using a FIFO queue. So the first time it reaches the goal, no shorter path can exist — shorter paths would have been explored in an earlier wave. DFS goes as deep as possible along one branch first, so the first path it finds can be long. DFS is great for "explore everything" or "is it reachable?", but not for shortest paths. With weighted edges you'd need Dijkstra's algorithm (a heap) instead of BFS.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'longest-unique-run',
      title: 'Longest run of different songs',
      difficulty: 'intermediate',
      prompt: py`A playlist is a list (or string) of song ids. Write \`longest_unique_run(playlist)\` that returns the **length** of the longest **contiguous** stretch with **no repeated song**.

- \`longest_unique_run(["a", "b", "c", "a", "b", "d"])\` → \`4\` (\`c a b d\`)
- \`longest_unique_run(["a", "b", "c", "c", "d"])\` → \`3\`
- \`longest_unique_run("abcabcbb")\` → \`3\`
- An empty playlist → \`0\`.

Aim for **O(n)**: a sliding window plus a dict of where each song was last seen.`,
      files: {
        'main.py': py`def longest_unique_run(playlist):
    # TODO: sliding window - grow the right edge, jump the left edge past repeats
    return 0


print(longest_unique_run(["a", "b", "c", "a", "b", "d"]))
`,
      },
      hints: [
        'Keep a window [start, i]. When playlist[i] already appears inside the window, the window must start after that earlier position.',
        'Store last_seen[song] = index. A repeat only matters if last_seen[song] >= start (it is inside the current window).',
        'for i, song in enumerate(playlist): if song in last_seen and last_seen[song] >= start: start = last_seen[song] + 1; then last_seen[song] = i; best = max(best, i - start + 1)',
      ],
      solution: {
        explanation: py`The window \`[start, i]\` always holds distinct songs. When the new song was last seen *inside* the window, \`start\` jumps just past that earlier position — never backwards, which is why the \`>= start\` check matters (\`["a", "b", "b", "a"]\` would otherwise move \`start\` back to 1). Each index is visited once and dict operations are O(1) on average, so it's O(n) time and O(k) space for k distinct songs.`,
        files: {
          'main.py': py`def longest_unique_run(playlist):
    last_seen = {}
    start = best = 0
    for i, song in enumerate(playlist):
        if song in last_seen and last_seen[song] >= start:
            start = last_seen[song] + 1
        last_seen[song] = i
        best = max(best, i - start + 1)
    return best


print(longest_unique_run(["a", "b", "c", "a", "b", "d"]))
`,
        },
      },
      tests: [
        { name: 'example from the prompt', code: py`assert longest_unique_run(["a", "b", "c", "a", "b", "d"]) == 4` },
        { name: 'a repeat in the middle', code: py`assert longest_unique_run(["a", "b", "c", "c", "d"]) == 3` },
        { name: 'works on strings', code: py`assert longest_unique_run("abcabcbb") == 3` },
        { name: 'the left edge never moves backwards', code: py`assert longest_unique_run(["a", "b", "b", "a"]) == 2` },
        { name: 'empty and all-same playlists', code: py`assert longest_unique_run([]) == 0
assert longest_unique_run(["x", "x", "x"]) == 1` },
      ],
    },
    {
      id: 'days-until-warmer',
      title: 'Days until a warmer day',
      difficulty: 'advanced',
      prompt: py`Given daily temperatures, write \`days_until_warmer(temps)\` that returns a list where entry \`i\` is the number of days you must wait after day \`i\` for a **strictly warmer** temperature, or \`0\` if no warmer day follows.

- \`days_until_warmer([20, 22, 21, 19, 25])\` → \`[1, 3, 2, 1, 0]\`
- \`days_until_warmer([20, 20, 21])\` → \`[2, 1, 0]\` (equal isn't warmer)
- \`[]\` → \`[]\`

Don't modify \`temps\`. Aim for **O(n)** with a *monotonic stack*: a stack of day indexes still waiting for a warmer day.`,
      files: {
        'main.py': py`def days_until_warmer(temps):
    # TODO: keep a stack of indexes whose warmer day hasn't been found yet
    return [0] * len(temps)


print(days_until_warmer([20, 22, 21, 19, 25]))
`,
      },
      hints: [
        'The brute force checks every later day for each day: O(n²). Instead, process days left to right and remember the days that are still waiting.',
        'When today is warmer than the day on top of the stack, that day\'s answer is today\'s index minus its index. Pop it and check the new top — today may answer several days at once.',
        'for i, temp in enumerate(temps): while stack and temps[stack[-1]] < temp: j = stack.pop(); answer[j] = i - j. Then stack.append(i).',
      ],
      solution: {
        explanation: py`The stack holds indexes of days still waiting, and their temperatures are non-increasing from bottom to top (that's what *monotonic* means). A warmer day pops every cooler day on top and fills in their answers. Each index is pushed once and popped at most once, so despite the nested \`while\`, the total work is O(n). Days left on the stack at the end never found a warmer day, so they keep \`0\`.`,
        files: {
          'main.py': py`def days_until_warmer(temps):
    answer = [0] * len(temps)
    stack = []   # indexes of days still waiting for a warmer day
    for i, temp in enumerate(temps):
        while stack and temps[stack[-1]] < temp:
            j = stack.pop()
            answer[j] = i - j
        stack.append(i)
    return answer


print(days_until_warmer([20, 22, 21, 19, 25]))
`,
        },
      },
      tests: [
        { name: 'example from the prompt', code: py`assert days_until_warmer([20, 22, 21, 19, 25]) == [1, 3, 2, 1, 0]` },
        { name: 'equal temperatures are not warmer', code: py`assert days_until_warmer([20, 20, 21]) == [2, 1, 0]` },
        { name: 'never warmer', code: py`assert days_until_warmer([30, 25, 20]) == [0, 0, 0]` },
        { name: 'empty input', code: py`assert days_until_warmer([]) == []` },
        { name: 'input is not modified', code: py`temps = [3, 1, 2]
days_until_warmer(temps)
assert temps == [3, 1, 2]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'coding-patterns-complexity-out-loud',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'State the time complexity of `common_tags` out loud, then improve it.',
      code: { lang: 'python', code: py`def common_tags(post_tags, trending):
    return [tag for tag in post_tags if tag in trending]   # trending is a list` },
      options: [
        'O(n) whatever trending is',
        'O(n·m) with a list; O(n + m) on average after converting trending to a set once',
        'O(log n) if trending is a set',
        'O(n²) with a set, O(n) with a list',
      ],
      correctOption: 1,
      answer: 'With n post tags and m trending tags in a list, each `in` is an O(m) scan, so O(n·m). Build `trending_set = set(trending)` once (O(m)) and each check becomes O(1) on average: O(n + m) time, O(m) extra space.',
      explanation: py`Say it with names and reasons: "n is the number of post tags, m the number of trending tags; the comprehension runs n times and each \`in\` scans up to m items." Then the fix and its cost, including the extra memory and the *average-case* caveat for hashing. Keeping the comprehension preserves the post's order and duplicates, which a plain set intersection wouldn't.`,
      whyAsked: 'Complexity talk is expected after every coding answer; this checks you can spot a hidden inner loop.',
      mistakes: ['Saying "O(n)" without defining n', 'Forgetting the cost of building the set', 'Using set(post_tags) & set(trending) without noticing it loses order and duplicates'],
      followUps: ['What is the worst case for set lookups?', 'When would the list version actually be fine?', 'What if trending changes every second?'],
      modelAnswer: 'Let n be the number of post tags and m the number of trending tags. The comprehension runs n times and, because trending is a list, each in check scans up to m items, so it is O(n times m). I would build a set from trending once, which costs O(m), and then each membership test is O(1) on average, giving O(n plus m) time and O(m) extra space. I would keep the comprehension rather than a set intersection so the post\'s tag order and duplicates are preserved. For a handful of tags either version is fine, but the set version scales.',
    },
    {
      id: 'coding-patterns-group-anagrams',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Write `group_anagrams(words)` that groups words that are anagrams of each other. Return a list of groups (lists); groups appear in order of their first word, and words keep their input order.',
      answer: 'Use a canonical key — the sorted letters — and a defaultdict(list): groups["".join(sorted(word))].append(word); return list(groups.values()). O(n·k log k) for n words of length k.',
      explanation: py`Anagrams share the same multiset of letters, so sorting each word's letters gives the same key for every member of a group. A \`defaultdict(list)\` avoids "if key not in dict" boilerplate, and because dicts keep insertion order (3.7+), groups come out in first-appearance order. An alternative key is a 26-count tuple of letter frequencies, O(k) per word instead of O(k log k).`,
      starter: { files: { 'main.py': py`from collections import defaultdict


def group_anagrams(words):
    # TODO: group words by a key that is the same for all anagrams
    return [words]


print(group_anagrams(["listen", "silent", "enlist", "google", "gogole", "cat"]))
` } },
      tests: [
        { name: 'groups anagrams in first-appearance order', code: py`assert group_anagrams(["listen", "silent", "enlist", "google", "gogole", "cat"]) == [["listen", "silent", "enlist"], ["google", "gogole"], ["cat"]]` },
        { name: 'empty input', code: py`assert group_anagrams([]) == []` },
        { name: 'no anagrams: one group per word', code: py`assert group_anagrams(["tea", "bun"]) == [["tea"], ["bun"]]` },
      ],
      solution: { files: { 'main.py': py`from collections import defaultdict


def group_anagrams(words):
    groups = defaultdict(list)
    for word in words:
        groups["".join(sorted(word))].append(word)
    return list(groups.values())


print(group_anagrams(["listen", "silent", "enlist", "google", "gogole", "cat"]))
` } },
      hints: ['What do "listen" and "silent" have in common if you sort their letters?', 'Use the sorted letters as a dict key: "".join(sorted(word)).', 'defaultdict(list) lets you append without checking whether the key exists.'],
      whyAsked: 'The classic "canonical key + hashing" pattern: turning a pairwise comparison problem into a grouping problem.',
      mistakes: ['Comparing every pair of words (O(n²·k))', 'Using the sorted list as a key (lists are unhashable — join it or use a tuple)', 'Forgetting that dict order makes the output deterministic'],
      followUps: ['How would you ignore case and spaces?', 'Can you make the key O(k) instead of O(k log k)?', 'What if the word list doesn\'t fit in memory?'],
      modelAnswer: 'Anagrams contain exactly the same letters, so if I sort each word\'s letters I get a canonical key that is identical for every word in a group. I loop once over the words and append each one to a defaultdict(list) under that key, then return the dict\'s values; dicts keep insertion order, so groups appear in the order of their first word. Sorting each word costs O(k log k), so overall it\'s O(n times k log k) time and O(n times k) space. If words were long I could use a tuple of 26 letter counts as the key to make it O(k) per word.',
    },
    {
      id: 'coding-patterns-sort-key-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this leaderboard code print?',
      code: { lang: 'python', code: py`players = [("ada", 30), ("ben", 25), ("cy", 30), ("di", 25)]
ranked = sorted(players, key=lambda p: (-p[1], p[0]))
print([name for name, _ in ranked])` },
      options: [
        "['ada', 'cy', 'ben', 'di']",
        "['ben', 'di', 'ada', 'cy']",
        "['cy', 'ada', 'di', 'ben']",
        "['ada', 'ben', 'cy', 'di']",
      ],
      correctOption: 0,
      answer: "['ada', 'cy', 'ben', 'di'] — highest score first (negated score), ties broken alphabetically by name.",
      explanation: py`Tuple keys compare element by element. \`-p[1]\` turns "highest score first" into ascending order (-30 before -25), and \`p[0]\` breaks ties alphabetically. Negation only works for numbers; for strings in descending order, sort twice using stability (secondary key first, then primary with \`reverse=True\`).`,
      whyAsked: 'Sorting by several criteria comes up constantly (leaderboards, intervals, scheduling); the tuple-key idiom is a fluency check.',
      mistakes: ['Using reverse=True, which also reverses the name order of ties', 'Writing a cmp-style comparison function instead of a key', 'Forgetting that sorted returns a new list while list.sort() returns None'],
      followUps: ['How would you sort by name descending but score ascending?', 'Why is sort stability useful here?', 'How would operator.itemgetter help?'],
      modelAnswer: 'It prints ada, cy, ben, di. The key is a tuple, and tuples compare element by element: negating the score makes higher scores sort first in ascending order, and the name breaks ties alphabetically, so ada comes before cy at 30, and ben before di at 25. If I needed to reverse a non-numeric field, I couldn\'t negate it, so I\'d rely on stability and sort twice, secondary key first.',
    },
    {
      id: 'coding-patterns-rpn',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `eval_rpn(tokens)` that evaluates an expression in Reverse Polish Notation, e.g. `["3", "4", "+", "2", "*"]` → `14.0`. Operators: `+ - * /` (true division). Convert numbers with `float()`. Raise `ValueError` if an operator lacks two operands or if the expression leaves anything other than exactly one value.',
      answer: 'A stack: push numbers; on an operator pop right then left, push left op right. At the end exactly one value must remain. O(n) time and space.',
      explanation: py`In RPN, an operator applies to the two most recent values — a textbook stack. Order matters: the **first** pop is the right operand (\`["8", "3", "-"]\` is 8 - 3). A dict mapping symbols to \`operator.add\`, \`operator.sub\`, … keeps the loop tidy and avoids \`eval\` (never \`eval\` untrusted input).`,
      starter: { files: { 'main.py': py`import operator

OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}


def eval_rpn(tokens):
    # TODO: use a list as a stack
    return 0.0


print(eval_rpn(["3", "4", "+", "2", "*"]))
` } },
      tests: [
        { name: 'simple expression', code: py`assert eval_rpn(["3", "4", "+", "2", "*"]) == 14` },
        { name: 'operand order for - and /', code: py`assert eval_rpn(["8", "3", "-"]) == 5
assert eval_rpn(["10", "4", "/"]) == 2.5` },
        { name: 'longer expression', code: py`assert eval_rpn(["5", "1", "2", "+", "4", "*", "+", "3", "-"]) == 14` },
        { name: 'missing operand raises ValueError', code: py`with raises(ValueError):
    eval_rpn(["1", "+"])` },
        { name: 'leftover values raise ValueError', code: py`with raises(ValueError):
    eval_rpn(["1", "2"])` },
      ],
      solution: { files: { 'main.py': py`import operator

OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}


def eval_rpn(tokens):
    stack = []
    for token in tokens:
        if token in OPS:
            if len(stack) < 2:
                raise ValueError(f"not enough operands for {token!r}")
            right = stack.pop()
            left = stack.pop()
            stack.append(OPS[token](left, right))
        else:
            stack.append(float(token))
    if len(stack) != 1:
        raise ValueError("malformed expression")
    return stack[0]


print(eval_rpn(["3", "4", "+", "2", "*"]))
` } },
      hints: ['Numbers go onto a stack; operators take the top two values off.', 'The first value you pop is the RIGHT operand.', 'Check len(stack) before popping and at the very end.'],
      whyAsked: 'A clean stack problem with operand-order and validation traps — and a chance to avoid eval().',
      mistakes: ['Popping in the wrong order so 8 3 - gives -5', 'Using eval() on the tokens', 'Not validating malformed input'],
      followUps: ['How would you support unary minus or functions like max?', 'How would you convert infix to RPN? (shunting-yard algorithm)', 'Why not just use eval?'],
      modelAnswer: 'RPN puts operators after their operands, so a stack is the natural fit. I scan the tokens; numbers are converted with float and pushed; for an operator I pop twice — the first pop is the right operand, the second the left — apply the operator from a dict of operator-module functions, and push the result. I validate that there are at least two values before an operator and exactly one at the end, raising ValueError otherwise. It\'s O(n) time and O(n) space, and it never uses eval, which would be dangerous on untrusted input.',
    },
    {
      id: 'coding-patterns-maze-bfs',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'A warehouse map is a list of strings: `"."` is floor, `"#"` is a shelf. Write `shortest_path(grid, start, goal)` that returns the fewest moves (up/down/left/right) from `start` to `goal` (both `(row, col)` tuples), or `-1` if unreachable.',
      answer: 'BFS from start with a deque of ((row, col), steps) and a seen set; check bounds and shelves for the four neighbours; return steps when the goal is popped. O(R·C) time and space.',
      explanation: py`Each move costs the same, so the grid is an unweighted graph and BFS gives the shortest path. Mark cells as seen when you **enqueue** them so no cell is queued twice. Return \`-1\` when the queue empties. Checking \`0 <= nr < rows\` *before* indexing avoids both \`IndexError\` and Python's negative-index wrap-around (\`grid[-1]\` silently reads the last row!).`,
      starter: { files: { 'main.py': py`from collections import deque


def shortest_path(grid, start, goal):
    # TODO: breadth-first search over floor cells
    return -1


warehouse = ["..#.",
             ".##.",
             "...."]
print(shortest_path(warehouse, (0, 0), (0, 3)))
` } },
      tests: [
        { name: 'goes around the shelves', code: py`assert shortest_path(["..#.", ".##.", "...."], (0, 0), (0, 3)) == 7` },
        { name: 'start equals goal', code: py`assert shortest_path(["..", ".."], (1, 1), (1, 1)) == 0` },
        { name: 'unreachable goal', code: py`assert shortest_path([".#", "#."], (0, 0), (1, 1)) == -1` },
        { name: 'open floor uses the direct distance', code: py`assert shortest_path(["....", "....", "...."], (0, 0), (2, 3)) == 5` },
      ],
      solution: { files: { 'main.py': py`from collections import deque


def shortest_path(grid, start, goal):
    rows, cols = len(grid), len(grid[0])
    queue = deque([(start, 0)])
    seen = {start}
    while queue:
        (r, c), steps = queue.popleft()
        if (r, c) == goal:
            return steps
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append(((nr, nc), steps + 1))
    return -1


warehouse = ["..#.",
             ".##.",
             "...."]
print(shortest_path(warehouse, (0, 0), (0, 3)))
` } },
      hints: ['Fewest moves with equal-cost moves → BFS.', 'Queue items can be ((row, col), steps). Use deque.popleft().', 'Check bounds first, then the shelf, then the seen set, before enqueueing.'],
      whyAsked: 'Grid BFS is one of the most common medium problems and tests queue choice, bounds checking and visited-set discipline.',
      mistakes: ['Using DFS, which finds a path but not the shortest', 'Marking cells seen only when popped (cells get queued many times)', 'Letting negative indexes wrap around to the other side of the grid'],
      followUps: ['How would you return the path itself?', 'What if moves had different costs? (Dijkstra with heapq)', 'How could you speed it up for one start and one goal? (bidirectional BFS, A*)'],
      modelAnswer: 'Every move costs the same, so this is shortest path in an unweighted graph, which means BFS. I keep a deque of positions with their step counts and a seen set containing the start. I pop from the left; if it\'s the goal I return the steps; otherwise I try the four neighbours, skipping anything out of bounds, a shelf, or already seen, and I mark cells seen as I enqueue them. If the queue empties, the goal is unreachable and I return -1. Each cell is processed at most once, so it\'s O(rows times columns) time and space.',
    },
    {
      id: 'coding-patterns-merge-bookings',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Room bookings are `(start, end)` hour pairs in any order. Write `merge_bookings(bookings)` that merges overlapping **or touching** bookings (a start ≤ the previous end) and returns a list of tuples sorted by start. Don\'t modify the input.',
      answer: 'Sort by start, then one pass: if the next start ≤ the last merged end, extend that end with max(); otherwise start a new block. O(n log n) for the sort, O(n) for the pass.',
      explanation: py`Sorting puts every booking that could overlap next to each other, so a single pass suffices. \`max(last_end, end)\` handles a booking fully inside another (\`(1, 10)\` and \`(2, 3)\`). Keep merged blocks as lists so you can update the end, then convert to tuples. \`sorted()\` returns a new list, so the caller's data is untouched.`,
      starter: { files: { 'main.py': py`def merge_bookings(bookings):
    # TODO: sort, then merge in one pass
    return sorted(bookings)


print(merge_bookings([(9, 10), (13, 15), (10, 11), (14, 16), (17, 18)]))
` } },
      tests: [
        { name: 'merges overlapping and touching bookings', code: py`assert merge_bookings([(9, 10), (13, 15), (10, 11), (14, 16), (17, 18)]) == [(9, 11), (13, 16), (17, 18)]` },
        { name: 'a booking inside another', code: py`assert merge_bookings([(1, 10), (2, 3)]) == [(1, 10)]` },
        { name: 'empty input', code: py`assert merge_bookings([]) == []` },
        { name: 'input is not modified', code: py`data = [(5, 6), (1, 2)]
merge_bookings(data)
assert data == [(5, 6), (1, 2)]` },
      ],
      solution: { files: { 'main.py': py`def merge_bookings(bookings):
    merged = []
    for start, end in sorted(bookings):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return [tuple(block) for block in merged]


print(merge_bookings([(9, 10), (13, 15), (10, 11), (14, 16), (17, 18)]))
` } },
      hints: ['After sorting by start time, which bookings can overlap the current block?', 'Compare each start with the end of the last merged block.', 'Use max() for the new end — the next booking might be entirely inside the current one.'],
      whyAsked: 'Interval problems test "sort first, then scan" thinking and careful boundary handling (touching vs overlapping).',
      mistakes: ['Not sorting first', 'Setting the end to the new booking\'s end instead of max(...)', 'Mutating the caller\'s list with .sort()'],
      followUps: ['How many rooms are needed for all bookings at once? (sweep or heap of end times)', 'What changes if touching bookings should stay separate?', 'How would you insert one new booking into an already merged list?'],
      modelAnswer: 'I\'d first confirm that touching bookings merge and that the input is unsorted. Then I sort by start time, which costs O(n log n) and guarantees anything that overlaps the current block comes right after it. In one pass I compare each booking\'s start with the end of the last merged block: if it\'s less than or equal, I extend the end using max, because the booking could sit entirely inside the block; otherwise I start a new block. sorted returns a new list, so the input is untouched, and the pass is O(n), giving O(n log n) overall.',
    },
    {
      id: 'coding-patterns-heap-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A task queue uses `heapq`. What does this print?',
      code: { lang: 'python', code: py`import heapq

tasks = [(2, "email"), (1, "deploy"), (3, "lunch"), (1, "backup")]
heapq.heapify(tasks)
print(tasks[0], [heapq.heappop(tasks)[1] for _ in range(2)])` },
      options: [
        "(1, 'backup') ['backup', 'deploy']",
        "(1, 'deploy') ['deploy', 'backup']",
        "(2, 'email') ['email', 'deploy']",
        "(1, 'deploy') ['deploy', 'email']",
      ],
      correctOption: 0,
      answer: "(1, 'backup') ['backup', 'deploy'] — tuples compare by priority first, then by name, so 'backup' beats 'deploy' at priority 1.",
      explanation: py`\`heapify\` rearranges the list in O(n) so the smallest item is at index 0. With equal priorities, tuple comparison moves to the second element: \`"backup" < "deploy"\`. That tie-break is convenient here but surprising in production — and it crashes with a \`TypeError\` if the second elements can't be compared. Add a counter, \`(priority, next(counter), task)\`, for FIFO order among equal priorities.`,
      whyAsked: 'Checks understanding of heap invariants and tuple comparison — a frequent source of production bugs in schedulers.',
      mistakes: ['Assuming insertion order breaks ties', 'Assuming the whole heap list is sorted', 'Forgetting that heapq is a min-heap'],
      followUps: ['How would you make ties first-in-first-out?', 'How would you build a max-heap before Python 3.14?', 'What is the complexity of heapify vs pushing n items?'],
      modelAnswer: 'It prints the tuple 1, backup, then the list backup, deploy. heapify turns the list into a min-heap, and tuples compare element by element, so among the two priority-1 tasks the names decide, and backup is alphabetically smaller. That tie-breaking is accidental; in a real scheduler I\'d push priority, then a counter from itertools.count, then the task, so equal priorities come out first-in-first-out and payloads never get compared.',
    },
    {
      id: 'coding-patterns-bfs-vs-dfs',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare BFS and DFS: which would you use to (a) find the fewest hops between two users in a social graph and (b) check whether a package\'s dependency graph contains a cycle?',
      options: [
        '(a) BFS, (b) DFS',
        '(a) DFS, (b) BFS',
        'DFS for both',
        'BFS for both',
      ],
      correctOption: 0,
      answer: '(a) BFS: it explores in distance order, so the first time it reaches the target is via the fewest hops. (b) DFS: tracking nodes on the current recursion path ("visiting") detects a back edge, i.e. a cycle. Both are O(V + E).',
      explanation: py`BFS uses a FIFO queue (\`deque\`) and finds shortest paths in unweighted graphs; memory grows with the widest level. DFS uses recursion or a LIFO stack, goes deep first, and naturally tracks "the path I'm on", which is what cycle detection and topological ordering need. For dependency graphs, the standard library offers \`graphlib.TopologicalSorter\`, which raises \`CycleError\` on cycles.`,
      whyAsked: 'Choosing the traversal by the question being asked is a core graph skill.',
      mistakes: ['Saying DFS finds shortest paths', 'Forgetting the visited set in either', 'Claiming one is always faster — both are O(V + E)'],
      followUps: ['How do you detect a cycle with three colours (unvisited, visiting, done)?', 'What would you use with weighted edges?', 'How does graphlib.TopologicalSorter report a cycle?'],
      modelAnswer: 'For fewest hops I\'d use BFS: it explores everyone one hop away, then two hops, so the first time it reaches the target is via a shortest path. For cycle detection in dependencies I\'d use DFS, marking nodes as visiting while they\'re on the current path and done when finished; meeting a visiting node again means a cycle. Both are O(V plus E) with a visited set. In Python I\'d use collections.deque for BFS, and for dependencies specifically graphlib.TopologicalSorter, which raises CycleError for me.',
    },
    {
      id: 'coding-patterns-window-shrink-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: '`shortest_over([1, 1, 1, 1, 10], 10)` should return `1` (just `[10]`) but returns `5`. What\'s the fix?',
      code: { lang: 'python', code: py`def shortest_over(values, target):
    """Length of the shortest run whose sum is at least target (0 if none)."""
    start = total = 0
    best = len(values) + 1
    for end, value in enumerate(values):
        total += value
        if total >= target:
            best = min(best, end - start + 1)
            total -= values[start]
            start += 1
    return best if best <= len(values) else 0


print(shortest_over([1, 1, 1, 1, 10], 10))   # 5` },
      options: [
        'Change `if total >= target:` to `while total >= target:`',
        'Initialise best to 0',
        'Use `end - start` instead of `end - start + 1`',
        'Sort values before the loop',
      ],
      correctOption: 0,
      answer: 'The window shrinks at most one step per new value. When 10 arrives, the window [1, 1, 1, 1, 10] is valid and should keep shrinking while it stays valid; `while total >= target` lets it shrink to [10] and record length 1.',
      explanation: py`Sliding-window rule: **grow** the right edge once per step, **shrink** the left edge *as long as* the window still satisfies (or violates) the condition. One \`if\` means the window can lag behind. Sorting would destroy contiguity. Note the window technique relies on non-negative values; with negatives, use prefix sums.`,
      whyAsked: 'The if-vs-while shrink bug is the most common sliding-window mistake, and it passes many simple tests.',
      mistakes: ['Testing only inputs where the answer is the whole list', 'Shrinking before recording the candidate length', 'Applying the technique to arrays with negative numbers'],
      followUps: ['Why does the window approach require non-negative values?', 'What is the complexity with the while loop — isn\'t it nested?', 'Which test case would you add to catch this bug?'],
      modelAnswer: 'The problem is the if on the shrink step: the left edge can move at most once per new value, so when the large 10 arrives the window stays five long. It should be while total is at least target: record the length, drop the leftmost value, and repeat while the window is still valid, which shrinks it to just the 10 and records 1. Even with the nested while it\'s O(n), because each index enters and leaves the window once. I\'d add a test where one big value at the end should give length 1, because simple tests often hide this bug.',
    },
    {
      id: 'coding-patterns-recognise',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Rapid pattern recognition. Name the pattern for each: (1) "the 5 most-viewed videos from a stream of a million views", (2) "is this string of brackets valid?", (3) "the first timestamp ≥ 09:00 in a sorted log", (4) "how many subarrays sum to exactly k (values can be negative)", (5) "the minimum number of bus changes between two stops".',
      answer: '(1) hashing to count, then a heap (Counter + heapq.nlargest / most_common(5)); (2) stack; (3) binary search with bisect_left; (4) prefix sums + a dict of earlier sums; (5) BFS over a graph whose nodes are bus routes or stops.',
      explanation: py`Spot the signal words: *top k* → heap; *matching/nesting* → stack; *sorted + first ≥* → bisect; *subarray sums with negatives* → prefix sums (a sliding window breaks with negatives because adding a value can make the sum smaller); *minimum number of steps* → BFS. Saying the signal out loud ("sorted, so binary search") is itself a strong interview habit.`,
      code: { lang: 'python', code: py`from bisect import bisect_left
from collections import Counter

views = ["v1", "v2", "v1", "v3", "v1", "v2"]
print(Counter(views).most_common(2))            # [('v1', 3), ('v2', 2)]

log_times = ["08:55", "08:59", "09:00", "09:07"]   # sorted HH:MM strings
print(log_times[bisect_left(log_times, "09:00")])  # 09:00` },
      whyAsked: 'Many interviews open with "how would you approach this?" before any code. Fast, justified pattern recognition shows experience.',
      mistakes: ['Naming a pattern without the reason', 'Proposing a sliding window when values can be negative', 'Sorting a million views just to take the top 5'],
      followUps: ['For (1), what if the stream never ends? (approximate counting, periodic top-k)', 'For (5), what are the nodes and edges?', 'For (3), what if the log isn\'t sorted?'],
      modelAnswer: 'For the top five videos I\'d count views with a Counter, then take the top k with a heap, which is O(n log k) rather than sorting everything. Valid brackets is a stack: push openers, pop and match on closers. First timestamp at or after nine in a sorted log is a binary search, bisect_left. Counting subarrays that sum to k with negative values needs prefix sums and a dict of how often each earlier sum occurred, because a sliding window assumes sums only grow. And minimum bus changes is BFS, where each node is a route and an edge means you can change between them.',
    },
    {
      id: 'coding-patterns-subarray-sum',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Write `count_subarrays(values, k)` returning how many **contiguous** subarrays sum to exactly `k`. Values may be negative or zero. Aim for O(n).',
      answer: 'Prefix sums + a Counter of earlier prefix sums: a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k, so at each step add seen[total - k] to the count, then record total. Start with seen[0] = 1.',
      explanation: py`The brute force tries every (start, end) pair: O(n²) with a running sum. The insight is algebraic: \`sum(values[i:j]) == prefix[j] - prefix[i]\`. So for each running total, the number of valid starts is the number of earlier prefixes equal to \`total - k\` — a dict lookup. \`seen = Counter({0: 1})\` represents the empty prefix, so subarrays starting at index 0 are counted. A sliding window can't do this: with negatives, shrinking the window doesn't reliably reduce the sum.`,
      starter: { files: { 'main.py': py`from collections import Counter


def count_subarrays(values, k):
    # TODO: running total + Counter of earlier running totals
    return 0


print(count_subarrays([1, 1, 1], 2))
` } },
      tests: [
        { name: 'basic case', code: py`assert count_subarrays([1, 1, 1], 2) == 2` },
        { name: 'subarray starting at index 0', code: py`assert count_subarrays([1, 2, 3], 3) == 2` },
        { name: 'zeros count as separate subarrays', code: py`assert count_subarrays([0, 0], 0) == 3` },
        { name: 'negative values', code: py`assert count_subarrays([2, -1, 1], 2) == 2` },
        { name: 'matches brute force on a mixed list', code: py`data = [3, 4, -7, 3, 1, 3, 1, -4, -2, -2]
brute = sum(1 for i in range(len(data)) for j in range(i + 1, len(data) + 1) if sum(data[i:j]) == 7)
assert count_subarrays(data, 7) == brute` },
      ],
      solution: { files: { 'main.py': py`from collections import Counter


def count_subarrays(values, k):
    seen = Counter({0: 1})   # the empty prefix
    total = count = 0
    for value in values:
        total += value
        count += seen[total - k]
        seen[total] += 1
    return count


print(count_subarrays([1, 1, 1], 2))
` } },
      hints: ['sum(values[i:j]) equals prefix[j] - prefix[i].', 'At each position you need: how many earlier prefix sums equal total - k?', 'Initialise seen = Counter({0: 1}) so a subarray starting at index 0 is counted; look up before you record the current total.'],
      whyAsked: 'Combines two patterns (prefix sums + hashing) and tests whether you know when a sliding window does not apply.',
      mistakes: ['Using a sliding window with negative numbers', 'Forgetting the initial {0: 1}', 'Recording the current total before looking up total - k (counts empty subarrays when k == 0)'],
      followUps: ['How would you return the longest such subarray instead of the count?', 'What changes if you only need to know whether one exists?', 'What is the space complexity?'],
      modelAnswer: 'The brute force checks every start and end, which is O(n squared). Instead I keep a running prefix sum: a subarray from i to j sums to k exactly when prefix j minus prefix i equals k. So at each position, the number of subarrays ending here is how many earlier prefix sums equal total minus k, which I keep in a Counter, seeded with zero once for the empty prefix. I look up before recording the current total so I never count an empty subarray. That\'s O(n) time and O(n) space, and unlike a sliding window it works with negative values.',
    },
    {
      id: 'coding-patterns-recursion-depth',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'This recursive function works in tests but crashes in production on a linked chain of 5,000 nodes with `RecursionError: maximum recursion depth exceeded`. Why, and how do you fix it?',
      code: { lang: 'python', code: py`def chain_length(node):
    if node is None:
        return 0
    return 1 + chain_length(node["next"])


def chain_length_iterative(node):
    count = 0
    while node is not None:      # no call stack growth
        count += 1
        node = node["next"]
    return count` },
      answer: 'Each recursive call adds a stack frame, and CPython caps the depth (sys.getrecursionlimit(), 1000 by default); Python doesn\'t optimise tail calls. Rewrite iteratively (a loop, or an explicit stack for trees/graphs) rather than raising the limit.',
      explanation: py`Tests used short chains, so the limit never showed. Raising the limit with \`sys.setrecursionlimit\` is a band-aid: deep enough recursion can still exhaust the underlying C stack and crash the process. For tree or graph DFS, replace recursion with \`stack = [root]\` and \`while stack: node = stack.pop()\`. The recursion limit and its default are CPython details.`,
      whyAsked: 'Separates candidates who know Python\'s recursion limits from those who port recursive solutions from other languages unchanged.',
      mistakes: ['Saying "just raise the recursion limit"', 'Claiming Python does tail-call optimisation', 'Not testing with realistically sized input'],
      followUps: ['How would you convert a recursive tree DFS to an explicit stack while keeping the same visiting order?', 'When is recursion still the better choice?', 'What does functools.cache do to the recursion depth of a memoised function?'],
      modelAnswer: 'Every recursive call pushes a frame, and CPython limits the depth — a thousand by default — and Python never optimises tail calls, so a 5,000-node chain exceeds the limit even though the logic is correct. The tests passed because they only used short chains. I\'d rewrite it as a loop that walks node to node, or for trees and graphs, use an explicit list as a stack. I wouldn\'t just raise the recursion limit, because very deep recursion can overflow the C stack and crash the interpreter outright.',
    },
    {
      id: 'coding-patterns-rate-limiter',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement `RateLimiter(limit, window)` with `allow(now)` → `bool`: allow at most `limit` requests in any `window` seconds. A request at time `now` counts against earlier **accepted** requests with timestamps `> now - window`. Rejected requests are not recorded. Timestamps arrive in non-decreasing order.',
      answer: 'A sliding window over time with a deque of accepted timestamps: pop from the left while the oldest is <= now - window, then accept if len(deque) < limit (append now) else reject. Amortised O(1) per call, O(limit) memory.',
      explanation: py`Because timestamps arrive in order, expired entries are always at the left: \`popleft()\` removes them in O(1) each, and each timestamp is appended and removed once (amortised O(1)). Storing only accepted requests caps memory at \`limit\`. This is the "sliding log" design; production systems often use token buckets or fixed-window counters in a shared store (e.g. Redis) when several servers must share one limit.`,
      starter: { files: { 'main.py': py`from collections import deque


class RateLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.hits = deque()

    def allow(self, now):
        # TODO: drop expired timestamps, then decide
        return True


limiter = RateLimiter(limit=2, window=10)
print([limiter.allow(t) for t in (0, 1, 2, 10, 10.5, 11)])
` } },
      tests: [
        { name: 'blocks the third request inside the window', code: py`rl = RateLimiter(2, 10)
assert [rl.allow(t) for t in (0, 1, 2)] == [True, True, False]` },
        { name: 'requests expire after the window', code: py`rl = RateLimiter(2, 10)
assert [rl.allow(t) for t in (0, 1, 2, 10, 10.5, 11)] == [True, True, False, True, False, True]` },
        { name: 'rejected requests are not recorded', code: py`rl = RateLimiter(1, 5)
assert [rl.allow(t) for t in (0, 1, 2, 3, 4, 5)] == [True, False, False, False, False, True]` },
        { name: 'memory stays bounded by the limit', code: py`rl = RateLimiter(3, 1)
for t in range(1000):
    rl.allow(t / 10)
assert len(rl.hits) <= 3` },
      ],
      solution: { files: { 'main.py': py`from collections import deque


class RateLimiter:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.hits = deque()

    def allow(self, now):
        while self.hits and self.hits[0] <= now - self.window:
            self.hits.popleft()
        if len(self.hits) < self.limit:
            self.hits.append(now)
            return True
        return False


limiter = RateLimiter(limit=2, window=10)
print([limiter.allow(t) for t in (0, 1, 2, 10, 10.5, 11)])
` } },
      hints: ['Only timestamps newer than now - window matter.', 'Timestamps arrive in order, so the oldest is always at the left of the deque.', 'while self.hits and self.hits[0] <= now - self.window: self.hits.popleft()'],
      whyAsked: 'A realistic design-meets-coding question: a sliding window over time, the right data structure, and boundary semantics.',
      mistakes: ['Recording rejected requests, so a flood locks users out forever', 'Using a list and pop(0)', 'Off-by-one on the window boundary (< vs <=) without stating the rule'],
      followUps: ['How would this work across several servers?', 'How does a token bucket differ?', 'What if timestamps can arrive out of order?'],
      modelAnswer: 'I\'d keep a deque of the timestamps of accepted requests. On each call, I pop from the left every timestamp that\'s at or before now minus the window, because those no longer count. Then if fewer than limit remain, I append now and return True; otherwise I return False without recording it, so rejected traffic doesn\'t extend the lockout. Each timestamp is appended and popped once, so it\'s amortised O(1) per call with at most limit timestamps stored. Across several servers I\'d move the state to a shared store or use a token bucket, which needs only a count and a last-refill time.',
    },
  ],

  takeaways: [
    'Most interview problems are a few patterns in disguise: learn the signal words that point to each.',
    'Hashing (set, dict, Counter, defaultdict) turns hidden O(n²) scans into O(n) on average.',
    'Two pointers need sorted input; sliding windows need contiguous ranges (and non-negative values for sum conditions).',
    'Stacks are lists (append/pop); queues are deques (append/popleft); never pop(0) a big list.',
    'BFS finds fewest steps in unweighted graphs; DFS explores and detects cycles; mark nodes seen.',
    'heapq is a min-heap: nlargest for top-k, a counter as tie-breaker; bisect needs sorted data.',
    'Prefix sums answer range sums in O(1) and, with a dict, count subarrays that sum to k even with negatives.',
    'Always state time and space complexity, define n, and mention average vs worst case for hashing.',
  ],
}
