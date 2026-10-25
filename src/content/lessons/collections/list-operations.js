// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LEADERBOARD = py`# Leaderboard tools
points = [320, 275, 410, 275, 150, 390]
players = ["ada", "Ben", "cy", "Dee", "eve", "Finn"]

ranked = sorted(points, reverse=True)      # a NEW list, highest first
top_three = ranked[:3]
print("Ranked:", ranked)
print("Original untouched:", points)

print("Top:", max(points), "| Lowest:", min(points))
average = sum(points) / len(points)
print(f"Total: {sum(points)} | Average: {average:.1f}")
print("275 appears", points.count(275), "times, first at index", points.index(275))

players.sort()                             # in place: returns None
print("Default order:", players)
players.sort(key=str.lower)                # compare lower-case versions
print("Ignoring case:", players)
print("Longest name:", max(players, key=len))

backup = points[:]                         # a copy of the whole list
points.reverse()                           # in place
print("Reversed:", points)
print("Backup:", backup)
`

export default {
  id: 'list-operations',
  title: 'Sorting, searching & list methods',
  summary: 'Sort with sort() or sorted() and a key function, search with in, index() and bisect, summarise with min/max/sum — and know which list operations get slower as the list grows.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['lists'],
  related: ['lists', 'tuples-and-unpacking', 'sets', 'collections-module', 'lambdas-and-higher-order', 'performance'],
  tags: ['sort', 'sorted', 'key function', 'reverse', 'stable sort', 'min', 'max', 'sum', 'index', 'count', 'reversed', 'copy', 'slicing', 'bisect', 'big-o', 'complexity', 'timsort'],
  apis: [
    { name: 'list.sort(key=None, reverse=False)', summary: 'Sorts the list in place (stable). Returns None.' },
    { name: 'sorted(iterable, key=None, reverse=False)', summary: 'Returns a NEW sorted list from any iterable; the input is untouched.' },
    { name: 'min() / max()', summary: 'Smallest / largest item; accept key= and default= (for empty iterables).' },
    { name: 'sum(iterable, start=0)', summary: 'Adds up numbers. Use "".join() for strings.' },
    { name: 'list.index(x[, start[, stop]])', summary: 'Position of the first item equal to x; ValueError if missing.' },
    { name: 'list.count(x)', summary: 'How many items equal x.' },
    { name: 'list.reverse()', summary: 'Reverses the list in place. Returns None.' },
    { name: 'reversed(seq)', summary: 'A lazy iterator over the items in reverse order.' },
    { name: 'list.copy() / items[:]', summary: 'A shallow copy: a new list holding the same item references.' },
    { name: 'bisect.bisect_left / bisect.insort', summary: 'Binary search in a sorted list / insert while keeping it sorted.' },
  ],
  docs: [
    { label: 'Sorting techniques (HOWTO)', url: 'https://docs.python.org/3/howto/sorting.html' },
    { label: 'Library reference — list.sort()', url: 'https://docs.python.org/3/library/stdtypes.html#list.sort' },
    { label: 'Built-in functions — sorted(), min(), max(), sum()', url: 'https://docs.python.org/3/library/functions.html#sorted' },
    { label: 'bisect — array bisection algorithm', url: 'https://docs.python.org/3/library/bisect.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Once you have a [list](lesson:lists), you will want to *ask it questions* — what's the biggest score? Where is "Ada"? How many times does 275 appear? — and *put it in order*: highest score first, names A to Z, shortest word first.`,
    py`Python gives you two ways to sort: the **method** \`items.sort()\`, which rearranges the list itself, and the **function** \`sorted(items)\`, which leaves the original alone and hands you a new sorted list. Both accept a \`key=\` — a function that says *what to compare* — and \`reverse=True\` for descending order.`,
    py`Along the way you'll learn the most useful idea in this whole level: some list operations take the same time however long the list is, and some get slower as it grows. Knowing which is which is how you pick the right tool.`,
  ],
  why: [
    py`Sorting and searching are everywhere: leaderboards, "cheapest first" product listings, alphabetical contact lists, finding the latest log entry. Writing your own sort is a classic exercise, but in real code you always use the built-in one: it is fast, well-tested and **stable** (explained below).`,
    py`The \`key=\` parameter is what makes it practical. Real data is rarely plain numbers — it is names with mixed capitals, dicts of products, strings that hold numbers. A key function lets you sort *any* data by *any* rule without changing the data.`,
  ],
  eli15: [
    py`Imagine your class lining up for a photo. \`sorted()\` is a photographer who takes a **picture** of everyone arranged by height — the real class is still standing however they were. \`.sort()\` is a teacher who actually **moves** everyone into height order.`,
    py`The \`key\` is the rule the teacher uses: "by height", "by first name", "by birthday". The students don't change — only the rule for comparing them does.`,
    py`And some jobs are quick no matter how big the class is (pointing at the 5th student), while others take longer the more students there are (asking each one, in turn, "are you Sam?").`,
  ],
  analogy: {
    title: 'Sorting a deck of cards — on the table or in a photo',
    body: [
      py`You can sort a hand of cards by physically rearranging them (\`.sort()\` — the hand itself changes), or by laying out a *second* sorted copy while the original hand stays as dealt (\`sorted()\`).`,
      py`You can sort by number, or by suit, or "hearts first, then by number" — that's the \`key\`. If two cards are equal under your rule (two sevens when sorting by number), a **stable** sort keeps them in the order they were already in.`,
      py`Adding a card to the *end* of a row on the table is instant. Squeezing one in at the *front* means sliding every other card along — and the longer the row, the longer that takes.`,
    ],
    mapping: [
      ['rearranging the hand itself', 'items.sort() — in place, returns None'],
      ['laying out a sorted copy', 'sorted(items) — returns a new list'],
      ['"sort by suit" / "sort by number"', 'key=function'],
      ['high cards first', 'reverse=True'],
      ['equal cards keep their old order', 'stable sorting (a language guarantee)'],
      ['sliding every card to make room at the front', 'insert(0, x) / pop(0) cost grows with length'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'sorted() makes a new list; sort() changes the old one',
    props: {
      code: py`scores = [70, 95, 82]
ranked = sorted(scores)
print(scores, ranked)

result = scores.sort()
print(scores, result)

names = ["bea", "Al", "cid"]
names.sort(key=str.lower, reverse=True)
print(names)

words = ["kiwi", "fig", "apple", "date"]
by_length = sorted(words, key=len)
print(by_length)
`,
      notes: {
        2: '`sorted()` builds a **second** list object. `scores` is not touched.',
        5: '`sort()` rearranges `scores` itself and returns `None` — so `result` is `None`.',
        9: '`key=str.lower` compares lower-case versions ("al", "bea", "cid"); `reverse=True` flips the order. The strings themselves are unchanged.',
        13: 'Sorting by `len`: "kiwi" and "date" both have length 4, and they keep their original relative order — the sort is **stable**.',
      },
    },
    alt: 'A step-by-step trace. sorted(scores) creates a second list object [70, 82, 95] while scores stays [70, 95, 82]. Then scores.sort() rearranges the original list in place and the name result points to None. names is sorted case-insensitively in reverse to [cid, bea, Al]. words sorted by length gives [fig, kiwi, date, apple], with kiwi still before date.',
    caption: py`Watch the object boxes: after line 2 there are **two** lists; after line 5 there is still only one \`scores\` list, now in order, and \`result\` points at \`None\`.`,
  },
  syntax: [
    py`#### sort() vs sorted()`,
    { code: py`prices = [4.5, 2.0, 9.99, 3.25]

cheapest_first = sorted(prices)          # new list; prices unchanged
dearest_first = sorted(prices, reverse=True)

prices.sort()                            # rearranges prices itself
prices.sort(reverse=True)                # descending, in place

letters = sorted("banana")               # sorted() accepts ANY iterable
print(letters)                           # ['a', 'a', 'a', 'b', 'n', 'n']`, lang: 'python', title: 'two ways to sort' },
    py`| | \`items.sort()\` | \`sorted(items)\` |
|---|---|---|
| works on | lists only | any iterable (list, tuple, string, set, dict keys…) |
| changes the original? | **yes**, in place | no |
| returns | \`None\` | a new list |
| use when | you no longer need the old order | you need both, or the input isn't a list |`,
    py`#### key= : sort by a rule`,
    py`\`key\` takes a **function of one argument**. Python calls it **once per item** and sorts by the results; the items themselves end up in the output unchanged. Pass the function *itself* — \`key=len\`, not \`key=len()\`.`,
    { code: py`words = ["kiwi", "Fig", "apple", "Date"]
sorted(words)                    # ['Date', 'Fig', 'apple', 'kiwi']  capitals first!
sorted(words, key=str.lower)     # ['apple', 'Date', 'Fig', 'kiwi']
sorted(words, key=len)           # ['Fig', 'kiwi', 'Date', 'apple']

codes = ["10", "9", "100"]
sorted(codes)                    # ['10', '100', '9']   text order
sorted(codes, key=int)           # ['9', '10', '100']   numeric order

def by_price(product):
    return product["price"]

cart = [{"name": "jam", "price": 3.2}, {"name": "tea", "price": 1.5}]
sorted(cart, key=by_price)       # tea first`, lang: 'python', title: 'key functions' },
    py`For one-off keys you will often see a **lambda** — a tiny unnamed function written inline: \`sorted(cart, key=lambda p: p["price"])\`. It means exactly the same as \`by_price\` above. Lambdas get a full lesson in [lambdas & higher-order functions](lesson:lambdas-and-higher-order).`,
    py`#### Sorting by two things`,
    py`Return a **tuple** from the key: tuples compare item by item, so the second value only matters when the first ones tie. Negate a number to flip just that part (see [tuples](lesson:tuples-and-unpacking)).`,
    { code: py`players = [
    {"name": "Cy", "score": 88},
    {"name": "Ada", "score": 92},
    {"name": "Ben", "score": 88},
]
ranked = sorted(players, key=lambda p: (-p["score"], p["name"]))
# Ada 92, then Ben 88 and Cy 88 in alphabetical order`, lang: 'python', title: 'highest score first, ties A→Z' },
    py`#### Summaries and searches`,
    { code: py`points = [320, 275, 410, 275]
max(points)               # 410
min(points)               # 275
sum(points)               # 1280
len(points)               # 4
points.count(275)         # 2   — how many equal 275
points.index(275)         # 1   — position of the FIRST 275
275 in points             # True

max(["kiwi", "fig", "banana"], key=len)   # 'banana' — key works here too
max([], default=0)                        # 0 instead of a ValueError`, lang: 'python', title: 'min, max, sum, count, index' },
    { callout: 'warn', title: 'index() raises when the item is missing', text: py`\`points.index(999)\` raises \`ValueError: list.index(x): x not in list\`. Check with \`in\` first, or catch the error (see [try/except](lesson:try-except)).` },
    py`#### Reversing and copying`,
    { code: py`items = [3, 1, 2]
items[::-1]               # [2, 1, 3]  — new reversed list
list(reversed(items))     # [2, 1, 3]  — reversed() is a lazy iterator
items.reverse()           # in place, returns None → items is [2, 1, 3]

copy1 = items[:]          # three ways to make a shallow copy
copy2 = items.copy()
copy3 = list(items)`, lang: 'python', title: 'reverse, reversed, [::-1] and copies' },
    py`These copies are **shallow**: a new outer list whose slots point at the same objects. For lists of numbers or strings that's all you need; for lists of lists, see [mutability & copying](lesson:mutability-and-copying).`,
    py`#### bisect: searching a sorted list`,
    { code: py`import bisect

times = [10, 20, 30, 40]               # must already be sorted
bisect.bisect_left(times, 25)          # 2  — where 25 would go
bisect.insort(times, 25)               # insert, keeping it sorted
print(times)                           # [10, 20, 25, 30, 40]

def grade(score):
    return "FDCBA"[bisect.bisect([60, 70, 80, 90], score)]
print(grade(77), grade(90))            # C A`, lang: 'python', title: 'binary search with bisect' },
    py`\`bisect\` finds a position by **binary search**: look at the middle, throw away the half that can't contain the answer, repeat. Each step halves the search, so even a huge sorted list needs only a few dozen comparisons. (Inserting still has to shift the later items.) The \`key=\` parameter of the bisect functions is new in Python 3.10.`,
  ],
  walkthrough: {
    title: 'Reading the leaderboard program line by line',
    lang: 'python',
    code: LEADERBOARD,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 8], text: py`\`sorted(points, reverse=True)\` builds a **new** list, highest first. Printing \`points\` afterwards proves the original order survived. \`ranked[:3]\` slices the top three into yet another new list.` },
      { lines: [10, 12], text: py`\`max\`, \`min\` and \`sum\` each walk through the whole list once. The f-string's \`:.1f\` rounds the average to one decimal place for display (see [f-strings](lesson:string-formatting)).` },
      { lines: [13], text: py`\`count(275)\` checks every item and counts matches (2). \`index(275)\` stops at the **first** match and returns its position (1).` },
      { lines: [15, 16], text: py`\`players.sort()\` rearranges the list in place. Default string order compares character codes, and every capital letter comes before every lower-case one — so "Ben", "Dee", "Finn" jump ahead of "ada".` },
      { lines: [17, 19], text: py`\`key=str.lower\` makes Python compare the lower-case version of each name, giving a natural A-to-Z order. The names keep their original capitals. \`max(players, key=len)\` returns the longest name.` },
      { lines: [21, 24], text: py`\`points[:]\` copies the list before \`reverse()\` flips the original in place, so \`backup\` still shows the old order.` },
    ],
  },
  playground: {
    title: 'Leaderboard tools',
    objective: 'Run it, then change sort orders and keys and predict each line before you run again.',
    files: { 'main.py': LEADERBOARD },
    expected: py`Ten lines:

\`\`\`text
Ranked: [410, 390, 320, 275, 275, 150]
Original untouched: [320, 275, 410, 275, 150, 390]
Top: 410 | Lowest: 150
Total: 1820 | Average: 303.3
275 appears 2 times, first at index 1
Default order: ['Ben', 'Dee', 'Finn', 'ada', 'cy', 'eve']
Ignoring case: ['ada', 'Ben', 'cy', 'Dee', 'eve', 'Finn']
Longest name: Finn
Reversed: [390, 150, 275, 410, 275, 320]
Backup: [320, 275, 410, 275, 150, 390]
\`\`\``,
    experiments: [
      {
        id: 'show-top-three',
        task: py`The program computes \`top_three\` but never prints it. Add a line that prints exactly \`Top three: [410, 390, 320]\`.`,
        hint: py`\`print("Top three:", top_three)\` — anywhere after line 6.`,
        tests: [{ name: 'prints the top three', code: py`assert "Top three: [410, 390, 320]" in output` }],
        explain: py`\`ranked\` is already sorted highest-first, so its first three items are the top three. Slicing a sorted list is the standard "top N" recipe.`,
      },
      {
        id: 'lowest-first',
        task: py`Change line 5 so \`ranked\` is sorted **lowest first**. What happens to \`top_three\`?`,
        hint: py`Remove \`reverse=True\` (or set it to \`False\`).`,
        tests: [{ name: 'ranked is ascending', code: py`assert ranked == sorted(backup), 'ranked should go from lowest to highest'` }],
        explain: py`Without \`reverse=True\`, \`sorted\` returns ascending order — and \`ranked[:3]\` now gives the three *lowest* scores. The slice doesn't know what "top" means; the order of the list decides it.`,
      },
      {
        id: 'shortest-name',
        task: py`Add a line that prints \`Shortest name: cy\` using \`min\` with a key.`,
        hint: py`\`min(players, key=len)\` — the same idea as the "Longest name" line.`,
        tests: [{ name: 'prints the shortest name', code: py`assert "Shortest name: cy" in output` }],
        explain: py`\`key=len\` makes \`min\` compare names by length. The result is the item itself ("cy"), not its length — the key is only used for comparing.`,
      },
      {
        id: 'break-the-backup',
        task: py`Break it on purpose: change \`backup = points[:]\` to \`backup = points\`. Predict the **Backup** line, then run.`,
        hint: py`Without the slice, is anything being copied?`,
        tests: [{ name: 'backup is now the same list as points', code: py`assert backup is points, 'Change backup = points[:] to backup = points'` }],
        explain: py`\`backup = points\` makes a second *name* for the same list, so \`points.reverse()\` reverses "both" — there is only one list. The \`[:]\` slice was what made an independent copy. More in [mutability & copying](lesson:mutability-and-copying).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Why the end of a list is cheap and the front is not',
    props: {
      width: 760,
      height: 280,
      nodes: [
        { id: 'a', label: '"Ada"', note: 'slot 0', x: 90, y: 190 },
        { id: 'b', label: '"Ben"', note: 'slot 1', x: 230, y: 190 },
        { id: 'c', label: '"Cy"', note: 'slot 2', x: 370, y: 190 },
        { id: 'd', label: '"Dee"', note: 'slot 3', x: 510, y: 190 },
        { id: 'spare', label: '(spare)', note: 'room to grow', x: 650, y: 190, tone: 'kraft' },
        { id: 'new', label: '"Eve"', note: 'new item', x: 370, y: 60, tone: 'yellow' },
      ],
      edges: [
        { id: 'append', from: 'new', to: 'spare', label: 'append' },
        { id: 'insert', from: 'new', to: 'a', label: 'insert(0, …)', dashed: true },
        { id: 'ab', from: 'a', to: 'b', label: 'shift' },
        { id: 'bc', from: 'b', to: 'c', label: 'shift' },
        { id: 'cd', from: 'c', to: 'd', label: 'shift' },
        { id: 'dspare', from: 'd', to: 'spare', label: 'shift' },
      ],
      steps: [
        { focus: ['a', 'b', 'c', 'd', 'spare'], text: py`A list is a row of numbered slots. In CPython the row usually has a little **spare room** at the end, so it can grow without moving. (That's an implementation detail — but every mainstream Python behaves this way.)` },
        { focus: ['new', 'spare'], edges: ['append'], text: py`\`append("Eve")\` drops the new item into the next free slot. **Nothing else moves**, so it takes about the same time for 4 items or 4 million. Occasionally the spare room runs out and the list moves to a bigger block — rare enough that we call append **amortised O(1)**: constant time on average.` },
        { focus: ['new', 'a', 'b', 'c', 'd'], edges: ['insert', 'ab', 'bc', 'cd', 'dspare'], text: py`\`insert(0, "Eve")\` needs slot 0 to be empty first, so **every** item shifts one place right. Twice the items, twice the shifting: the cost grows in proportion to the length — **O(n)**.` },
        { focus: ['a', 'b', 'c', 'd'], edges: ['ab', 'bc', 'cd'], text: py`The same is true in reverse: \`pop()\` from the end is cheap, but \`pop(0)\` or \`del items[0]\` makes every later item shift left. A loop that keeps doing \`pop(0)\` on a long list does a lot of hidden work.` },
        { focus: ['a', 'b', 'c', 'd'], text: py`\`"Dee" in names\`, \`names.index("Dee")\`, \`count\` and \`remove\` all **scan from the start**, item by item, until they find a match (or reach the end). Also O(n). For many membership checks, use a [set](lesson:sets); for a queue, use [\`collections.deque\`](lesson:collections-module).` },
      ],
    },
    alt: 'A row of five slots holding Ada, Ben, Cy, Dee and a spare empty slot, with a new item Eve above them. Append drops Eve straight into the spare slot. insert at 0 shows arrows shifting every item one slot to the right before Eve can enter slot 0. Further steps explain that pop(0) shifts items left and that in, index, count and remove scan from the start.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Sorting works by **comparing** pairs of items with \`<\`. So everything in the list must be comparable with everything else: numbers with numbers, strings with strings. Mix them and Python refuses: \`TypeError: '<' not supported between instances of 'str' and 'int'\`.`,
      py`Strings compare **character by character** using each character's code number. All capital letters have smaller codes than all lower-case letters, which is why \`"Zebra"\` sorts before \`"apple"\`. Use \`key=str.lower\` (or the more thorough \`str.casefold\`) for the order humans expect.`,
      py`A \`key\` function doesn't change your data. Python computes a "sort key" for each item, sorts using those keys, and gives you back the original items in the new order.`,
    ],
    technical: [
      py`**Stability is a language guarantee.** The docs promise that \`sort()\` and \`sorted()\` never change the relative order of items that compare equal — and that stays true with \`reverse=True\`. That lets you sort in several passes: sort by the *secondary* key first, then by the *primary* key, and ties keep the secondary order.`,
      { code: py`people = [{"name": "Cy", "team": "red"}, {"name": "Ada", "team": "blue"}, {"name": "Ben", "team": "red"}]
people.sort(key=lambda p: p["name"])      # secondary key first
people.sort(key=lambda p: p["team"])      # primary key second
print([p["name"] for p in people])        # ['Ada', 'Ben', 'Cy'] — blue first, then red A→Z`, lang: 'python', title: 'multi-pass sorting relies on stability' },
      py`The docs also guarantee that the key function is called **exactly once per item**, so an expensive key (parsing a date, say) isn't recomputed on every comparison. If a comparison fails part-way (mixed types), the error propagates and the list may be left partly reordered.`,
      py`**Big-O notation** is shorthand for "how does the work grow as the input grows?". O(1): the same however big. O(n): proportional to the length. O(n log n): a bit more than proportional — the cost of a good general-purpose sort. O(log n): barely grows — binary search.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython's sort is an adaptive, stable merge sort called **Timsort**, written by Tim Peters for CPython and later adopted by other languages. It looks for already-ordered "runs" in the data, so sorting a list that is already sorted (or nearly so) is much cheaper than sorting random data. The language only guarantees stability; the algorithm and its speed are implementation details.` },
    ],
    production: [
      py`Sort **once**, at the point where order matters, rather than re-sorting inside a loop. If you only need the top few of a large collection, \`heapq.nlargest(10, items, key=...)\` avoids sorting everything, and \`min\`/\`max\` find a single extreme in one pass.`,
      py`For data that must *stay* sorted while you keep inserting, \`bisect.insort\` keeps a list ordered (each insert still shifts items, O(n)). For heavy workloads the third-party \`sortedcontainers\` package, or a database index, is the usual answer.`,
      py`Don't guess about speed — measure. \`timeit\` and \`cProfile\` (see [profiling](lesson:profiling)) tell you whether a sort or a scan is actually your bottleneck. The big-picture cost table is the topic of [performance](lesson:performance).`,
      py`Watch out for \`None\` in data you sort: \`sorted([3, None, 1])\` raises \`TypeError\`. Filter it out, or use a key that puts missing values last: \`key=lambda x: (x is None, x)\`.`,
    ],
  },
  mistakes: [
    {
      title: 'Assigning the result of sort()',
      wrong: { code: py`prices = [4.5, 2.0, 9.99]
prices = prices.sort()
print(prices[0])     # TypeError: 'NoneType' object is not subscriptable`, lang: 'python', static: true },
      right: { code: py`prices = [4.5, 2.0, 9.99]
prices.sort()                      # in place…
print(prices[0])                   # 2.0
cheapest = sorted(prices)[0]       # …or get a new sorted list`, lang: 'python' },
      explanation: py`\`sort()\` returns \`None\` to signal "I changed the list in place". Either call it on its own line, or use \`sorted()\` when you want a value back.`,
    },
    {
      title: 'Calling sorted() and ignoring the result',
      wrong: { code: py`names = ["Cy", "Ada", "Ben"]
sorted(names)
print(names)         # ['Cy', 'Ada', 'Ben'] — unchanged`, lang: 'python' },
      right: { code: py`names = ["Cy", "Ada", "Ben"]
names = sorted(names)      # or simply names.sort()
print(names)               # ['Ada', 'Ben', 'Cy']`, lang: 'python' },
      explanation: py`\`sorted()\` never touches its input; it returns a new list. If you don't keep that list, the sorted result is thrown away.`,
    },
    {
      title: 'Numbers stored as text sort "wrongly"',
      wrong: { code: py`sizes = ["10", "9", "100"]
print(sorted(sizes))       # ['10', '100', '9']`, lang: 'python' },
      right: { code: py`sizes = ["10", "9", "100"]
print(sorted(sizes, key=int))   # ['9', '10', '100']`, lang: 'python' },
      explanation: py`Strings compare character by character, so \`"100"\` < \`"9"\` because \`"1"\` < \`"9"\`. Convert when you read the data, or sort with \`key=int\`/\`key=float\`.`,
    },
    {
      title: 'Writing key=len() instead of key=len',
      wrong: { code: py`words = ["kiwi", "fig"]
sorted(words, key=len())   # TypeError: len() takes exactly one argument (0 given)`, lang: 'python', static: true },
      right: { code: py`words = ["kiwi", "fig"]
sorted(words, key=len)     # pass the function itself`, lang: 'python' },
      explanation: py`\`key\` wants a function that Python will call for you, once per item. The parentheses would call \`len\` immediately, with no argument.`,
    },
    {
      title: 'Using pop(0) as a queue on a big list',
      wrong: { code: py`jobs = list(range(10_000))
while jobs:
    job = jobs.pop(0)      # shifts every remaining item each time`, lang: 'python' },
      right: { code: py`from collections import deque

jobs = deque(range(10_000))
while jobs:
    job = jobs.popleft()   # O(1) at both ends`, lang: 'python' },
      explanation: py`Each \`pop(0)\` shifts all remaining items, so draining the list this way does work proportional to n² in total. A [\`deque\`](lesson:collections-module) is built for adding and removing at both ends.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: '<' not supported between instances of 'str' and 'int'`,
      cause: py`The list mixes types that can't be ordered — often numbers read from a file or \`input()\` that are still strings, or \`None\` placeholders.`,
      fix: py`Print the list (or \`[type(x) for x in items]\`) to find the odd one out; convert with \`int()\`/\`float()\` when reading, or sort with \`key=int\`.`,
    },
    {
      symptom: py`ValueError: max() iterable argument is empty`,
      cause: py`\`max()\`/\`min()\` were called on an empty list — e.g. no scores recorded yet.`,
      fix: py`Pass a fallback: \`max(scores, default=0)\` — or check \`if scores:\` first. (Averages have the same problem: \`sum([]) / len([])\` raises \`ZeroDivisionError: division by zero\`.)`,
    },
    {
      symptom: py`ValueError: list.index(x): x not in list`,
      cause: py`\`index()\` didn't find the value. Older Python versions phrase it as \`ValueError: 5 is not in list\`.`,
      fix: py`Check with \`if x in items:\` first, or catch the \`ValueError\`. Look for case or whitespace differences in strings.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not subscriptable`,
      cause: py`You indexed a variable that holds \`None\` — classically after \`items = items.sort()\` or \`items = items.reverse()\`.`,
      fix: py`Don't assign the result of in-place methods. Use \`sorted(items)\` or \`items[::-1]\` if you want a new list.`,
    },
    {
      symptom: py`TypeError: sum() can't sum strings [use ''.join(seq) instead]`,
      cause: py`\`sum()\` is for numbers; it refuses strings because joining them repeatedly with \`+\` would be slow.`,
      fix: py`Do what the message says: \`"".join(words)\` or \`", ".join(words)\` (see [string methods](lesson:string-methods)).`,
    },
  ],
  bestPractices: [
    'Use sorted() when you need a new list or the input isn\'t a list; use .sort() when you no longer need the old order.',
    'Never assign the result of .sort() or .reverse() — they return None.',
    'Express ordering with key= (and reverse=True); return a tuple from the key to sort by several fields.',
    'Sort human-facing text with key=str.lower or key=str.casefold.',
    'Give max()/min() a default= when the input might be empty.',
    'Use a deque for queues and a set for repeated membership tests instead of pop(0) and in on long lists.',
    'Measure with timeit before optimising — Big-O tells you how cost grows, not how many milliseconds it takes.',
  ],
  useCases: [
    'Leaderboards and "top N" lists: sorted(scores, reverse=True)[:10].',
    'Alphabetical contact lists that ignore capitals: sorted(names, key=str.casefold).',
    'Sorting records (dicts, tuples) by a field — price, date, score — with key=.',
    'Mapping a score to a grade band with bisect.',
    'Quick statistics with min, max, sum and len.',
  ],
  comparison: {
    title: 'How list operations scale (CPython)',
    headers: ['operation', 'what happens', 'cost as the list grows'],
    rows: [
      ['items[i], items[i] = x, len(items)', 'jump straight to a slot / read a stored count', 'O(1) — constant'],
      ['append(x), pop()', 'work at the end; occasionally move to a bigger block', 'O(1) amortised'],
      ['insert(0, x), pop(0), del items[0]', 'shift every later item one place', 'O(n) — proportional'],
      ['x in items, index(x), count(x), remove(x)', 'scan from the start until found (or the end)', 'O(n)'],
      ['min(), max(), sum()', 'visit every item once', 'O(n)'],
      ['items[a:b], items.copy()', 'copy the references in the slice', 'O(k) for k copied items'],
      ['sort(), sorted()', 'compare and merge runs', 'O(n log n); faster on nearly-sorted data'],
      ['bisect_left on a sorted list', 'halve the search range each step', 'O(log n)'],
    ],
    note: py`These are the costs of CPython's list implementation, documented in the Python wiki's *TimeComplexity* page; the language itself doesn't guarantee them. Big-O describes growth, not speed — for small lists, everything is fast.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'list-operations-q1',
      type: 'mcq',
      prompt: 'What is the difference between `items.sort()` and `sorted(items)`?',
      options: [
        { text: 'sort() is faster because it uses a different algorithm', why: 'Both use the same sorting algorithm. The difference is where the result goes.' },
        'sort() rearranges the list in place and returns None; sorted() returns a new list and leaves the original alone',
        { text: 'sorted() only works on numbers', why: 'sorted() works on any iterable of comparable items — strings, tuples, dict keys…' },
        { text: 'There is no difference; they are aliases', why: 'One is a list method that mutates, the other a built-in function that builds a new list.' },
      ],
      answer: 1,
      explanation: py`\`sort()\` is a list method that mutates; \`sorted()\` is a built-in that accepts any iterable and always returns a new list.`,
    },
    {
      id: 'list-operations-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`nums = [3, 1, 2]
result = nums.sort()
print(result, nums)`,
      answer: 'None [1, 2, 3]',
      explanation: py`\`sort()\` sorts \`nums\` in place and returns \`None\`, which is what \`result\` holds.`,
    },
    {
      id: 'list-operations-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`print(sorted(["pear", "Fig", "apple"]))`,
      options: [
        { text: "['apple', 'Fig', 'pear']", why: 'That is case-insensitive order (key=str.lower). The default compares character codes, and capital letters come first.' },
        "['Fig', 'apple', 'pear']",
        { text: "['Fig', 'pear', 'apple']", why: 'That is sorted by length (key=len), not the default.' },
        { text: "['pear', 'Fig', 'apple']", why: 'sorted() does return a sorted list — this is the original order.' },
      ],
      answer: 1,
      explanation: py`Strings compare by character code, and every uppercase letter has a smaller code than every lowercase letter. So \`"Fig"\` comes first, then \`"apple"\` and \`"pear"\`. Use \`key=str.lower\` for human order.`,
    },
    {
      id: 'list-operations-q4',
      type: 'bug',
      prompt: 'This crashes with `TypeError: \'NoneType\' object is not subscriptable`. Click the line that causes the problem.',
      code: py`prices = [4.5, 2.0, 9.99]
prices = prices.sort()
cheapest = prices[0]
print("Cheapest:", cheapest)`,
      answerLine: 2,
      explanation: py`\`prices.sort()\` returns \`None\`, and line 2 re-binds \`prices\` to it. Line 3 is where the crash *appears*, but line 2 is the cause. Write \`prices.sort()\` alone, or \`prices = sorted(prices)\`.`,
    },
    {
      id: 'list-operations-q5',
      type: 'fill',
      prompt: 'Sort `words` in place so the **longest** word comes first.',
      code: py`words = ["kiwi", "fig", "banana"]
words.sort(key=___, reverse=___)
print(words)   # ['banana', 'kiwi', 'fig']`,
      answer: [['len'], ['True']],
      explanation: py`\`key=len\` compares by length (pass the function, no parentheses); \`reverse=True\` puts the biggest first.`,
    },
    {
      id: 'list-operations-q6',
      type: 'mcq',
      prompt: 'Select **all** the operations whose cost grows with the length of the list (O(n)).',
      options: [
        { text: 'items.append(x)', why: 'append works at the end and is amortised O(1): nothing has to shift.' },
        { text: 'items[500]', why: 'Indexing jumps straight to the slot — constant time.' },
        'items.insert(0, x)',
        'x in items',
        { text: 'items.pop()', why: 'pop() with no argument removes the last item — nothing shifts, O(1).' },
      ],
      answer: [2, 3],
      explanation: py`\`insert(0, x)\` shifts every existing item right, and \`in\` scans from the start until it finds a match. Working at the end (\`append\`, \`pop()\`) and indexing don't depend on the length.`,
    },
    {
      id: 'list-operations-q7',
      type: 'short',
      prompt: 'What does it mean that Python\'s sort is **stable**, and why is that useful?',
      answer: py`A stable sort keeps items that compare equal in the same relative order they had before sorting. It's useful because you can sort in stages: sort by a secondary key (e.g. name), then by the primary key (e.g. score), and people with equal scores stay in name order. It also means sorting already-grouped data won't shuffle the groups randomly. Stability is guaranteed by the language for both sort() and sorted().`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'top-n-scores',
      title: 'Top N scores',
      difficulty: 'beginner',
      prompt: py`Write \`top_n(scores, n)\` that **returns a new list** with the \`n\` highest scores, highest first.

- \`top_n([5, 9, 1, 7], 2)\` → \`[9, 7]\`
- if \`n\` is bigger than the number of scores, return them all (highest first);
- \`top_n(scores, 0)\` → \`[]\`;
- the original \`scores\` list must **not** be changed.`,
      files: {
        'main.py': py`def top_n(scores, n):
    # TODO: return the n highest scores, highest first
    return scores[:n]


game_scores = [320, 275, 410, 275, 150, 390]
print(top_n(game_scores, 3))
print(game_scores)
`,
      },
      hints: [
        'You need the scores in descending order first, then the first n of them.',
        'sorted(..., reverse=True) gives a new descending list without touching the original; a slice takes the first n.',
        'return sorted(scores, reverse=True)[:n]',
      ],
      solution: {
        explanation: py`\`sorted(scores, reverse=True)\` builds a **new** list in descending order, so the caller's list is untouched (\`scores.sort(...)\` would have reordered it — a nasty surprise for whoever called your function). Slicing \`[:n]\` takes the first \`n\` items, and slices never raise: if \`n\` is larger than the list you simply get everything, and \`[:0]\` is empty. For very large inputs where \`n\` is small, \`heapq.nlargest(n, scores)\` does the same job without sorting everything.`,
        files: {
          'main.py': py`def top_n(scores, n):
    return sorted(scores, reverse=True)[:n]


game_scores = [320, 275, 410, 275, 150, 390]
print(top_n(game_scores, 3))
print(game_scores)
`,
        },
      },
      tests: [
        { name: 'top 2 of [5, 9, 1, 7] is [9, 7]', code: py`assert top_n([5, 9, 1, 7], 2) == [9, 7]` },
        { name: 'keeps duplicates', code: py`assert top_n([3, 8, 8, 1], 3) == [8, 8, 3]` },
        { name: 'n larger than the list returns everything, sorted', code: py`assert top_n([2, 5], 10) == [5, 2]` },
        { name: 'n = 0 gives []', code: py`assert top_n([1, 2, 3], 0) == []` },
        { name: 'does not modify the input', code: py`data = [4, 1, 3]
top_n(data, 2)
assert data == [4, 1, 3], 'Use sorted(), not .sort(), so the caller\'s list is not reordered'` },
      ],
    },
    {
      id: 'rank-students',
      title: 'Rank the class',
      difficulty: 'beginner',
      prompt: py`Each student is a dict like \`{"name": "Ada", "score": 92}\`. Write \`rank_students(students)\` that **returns a list of names**:

- highest score first;
- students with the **same score** appear in **alphabetical** order;
- the input list must not be reordered.

For the starter data the result is \`['Ada', 'Ben', 'Cy', 'Dee']\`.`,
      files: {
        'main.py': py`students = [
    {"name": "Cy", "score": 88},
    {"name": "Ada", "score": 92},
    {"name": "Ben", "score": 88},
    {"name": "Dee", "score": 75},
]


def rank_students(students):
    # TODO: return the names, best score first, ties A-Z
    return []


print(rank_students(students))
`,
      },
      hints: [
        'Use sorted() with a key function. The key receives one student dict and returns what to compare.',
        'Return a tuple from the key: (-student["score"], student["name"]). The minus sign makes higher scores sort first, and the name breaks ties.',
        'def by_rank(student):\n    return (-student["score"], student["name"])\n\nnames = []\nfor student in sorted(students, key=by_rank):\n    names.append(student["name"])\nreturn names',
      ],
      solution: {
        explanation: py`The key function turns each student into the tuple \`(-score, name)\`. Tuples compare item by item: first by \`-score\` (so 92 → -92 comes before 88 → -88, i.e. highest first), and only when those tie, by name, A to Z. \`sorted()\` leaves the input list alone.

An equally correct approach uses **stability**: sort by name first, then by score with \`reverse=True\` — students with equal scores keep the alphabetical order from the first pass. The loop at the end collects just the names; in the [comprehensions](lesson:comprehensions) lesson you'll write it as \`[s["name"] for s in ordered]\`.`,
        files: {
          'main.py': py`students = [
    {"name": "Cy", "score": 88},
    {"name": "Ada", "score": 92},
    {"name": "Ben", "score": 88},
    {"name": "Dee", "score": 75},
]


def by_rank(student):
    return (-student["score"], student["name"])


def rank_students(students):
    names = []
    for student in sorted(students, key=by_rank):
        names.append(student["name"])
    return names


print(rank_students(students))
`,
        },
      },
      tests: [
        { name: 'ranks the starter class', code: py`assert rank_students(students) == ['Ada', 'Ben', 'Cy', 'Dee']` },
        { name: 'ties are alphabetical', code: py`data = [{"name": "Zoe", "score": 50}, {"name": "Amy", "score": 50}, {"name": "Max", "score": 50}]
assert rank_students(data) == ['Amy', 'Max', 'Zoe']` },
        { name: 'higher score beats alphabetical order', code: py`data = [{"name": "Amy", "score": 10}, {"name": "Zoe", "score": 99}]
assert rank_students(data) == ['Zoe', 'Amy']` },
        { name: 'does not reorder the input', code: py`data = [{"name": "B", "score": 1}, {"name": "A", "score": 2}]
rank_students(data)
assert [s["name"] for s in data] == ["B", "A"]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'list-operations-sort-vs-sorted',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'When would you use `list.sort()` and when `sorted()`?',
      answer: 'sort() mutates a list in place and returns None — use it when you own the list and don\'t need the old order. sorted() accepts any iterable and returns a new list — use it to keep the original, or when the input isn\'t a list.',
      explanation: py`Both use the same stable algorithm and accept \`key=\` and \`reverse=\`. \`sorted()\` costs a copy of the references; \`sort()\` avoids that but changes data that other code might share. Returning \`None\` from \`sort()\` is deliberate (command-query separation): it prevents chaining that would hide the mutation.`,
      whyAsked: 'It is a quick check of API fluency and of awareness that mutation affects other references.',
      mistakes: ['Saying sorted() is slower without qualification', 'Not knowing that sort() returns None', 'Forgetting sorted() works on tuples, sets, dict keys and generators'],
      followUps: ['Why does sort() return None?', 'How would you sort a dict by its values?', 'Is the sort stable?'],
      modelAnswer: 'list.sort() rearranges the list itself and returns None, so I use it when I own the list and no longer need the original order. sorted() is a built-in that takes any iterable — a tuple, a set, dict keys, a generator — and always returns a new list, leaving the input untouched, so I use it inside functions that shouldn\'t mutate their arguments. Both take the same key and reverse arguments and use the same stable algorithm. The None return value from sort() is intentional: it stops people from writing x = x.sort() and thinking they got a new list.',
    },
    {
      id: 'list-operations-complexity',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Which common list operations are O(1) and which are O(n)? Why is `pop(0)` slow, and what would you use instead?',
      answer: 'O(1): indexing, len, append and pop() at the end (append amortised). O(n): insert/pop/del near the front, in, index, count, remove. pop(0) shifts every remaining element; use collections.deque for a queue.',
      explanation: py`In CPython a list is a contiguous array of pointers. Accessing slot i is pointer arithmetic. Appending writes into pre-allocated spare capacity and only occasionally reallocates (geometric over-allocation makes the average constant). Removing from the front leaves a gap that must be closed by moving every later pointer. Searching has no index to use, so it scans. These are CPython's documented costs, not language guarantees.`,
      whyAsked: 'Choosing data structures by their cost model is a core engineering skill; this is the simplest place to show it.',
      mistakes: ['Claiming append is always O(1) without mentioning amortisation', 'Saying in is O(1) for lists (it is for sets and dicts)', 'Suggesting list.reverse() + pop() hacks instead of deque'],
      followUps: ['What does amortised mean?', 'What is the complexity of slicing?', 'How is deque implemented?'],
      modelAnswer: 'Indexing, len, and working at the end of a list — append and pop() — are constant time; append is amortised because CPython over-allocates and only occasionally has to move to a bigger block. Anything that touches the front, like insert(0, x), pop(0) or del items[0], is linear, because a list is a contiguous array and every later element has to shift. Searching operations like in, index, count and remove are also linear because they scan. So for a FIFO queue I use collections.deque, which is O(1) at both ends, and for repeated membership tests I use a set.',
    },
    {
      id: 'list-operations-stable-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`people = [("Ben", 30), ("Ada", 25), ("Cy", 30), ("Dee", 25)]
people.sort(key=lambda p: p[1])
print([name for name, age in people])` },
      options: ["['Ada', 'Dee', 'Ben', 'Cy']", "['Ada', 'Ben', 'Cy', 'Dee']", "['Dee', 'Ada', 'Cy', 'Ben']", "['Ada', 'Dee', 'Cy', 'Ben']"],
      correctOption: 0,
      answer: "`['Ada', 'Dee', 'Ben', 'Cy']`. The sort only compares ages; because it is stable, people with equal ages keep their original relative order (Ada before Dee, Ben before Cy).",
      explanation: py`The key returns only the age, so ("Ada", 25) and ("Dee", 25) compare equal; stability guarantees they stay in input order. Names are not considered at all — so the result is not alphabetical, it just happens that Ada was before Dee originally.`,
      whyAsked: 'Tests whether you know stability is guaranteed and understand that the key fully defines the comparison.',
      mistakes: ['Assuming ties are broken alphabetically by the rest of the tuple', 'Thinking ties come out in arbitrary order'],
      followUps: ['How would you break ties by name?', 'Does reverse=True preserve stability?'],
      modelAnswer: 'It prints Ada, Dee, Ben, Cy. The key only returns the age, so the 25s are equal to each other and so are the 30s. Python\'s sort is guaranteed stable, so equal items keep their original relative order: Ada came before Dee and Ben before Cy in the input. The names are never compared — if I wanted ties broken by name I would return a tuple key like (age, name). Stability also holds with reverse=True.',
    },
    {
      id: 'list-operations-median',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Write `median(values)` that returns the median of a list of numbers without modifying it. For an odd count it\'s the middle value; for an even count, the average of the two middle values. Raise `ValueError` for an empty list.',
      answer: 'Sort a copy with sorted(), find the middle index with n // 2, and average the two middle values when n is even.',
      explanation: py`\`sorted()\` gives an ordered copy so the caller's data is untouched. With \`n = len(ordered)\` and \`mid = n // 2\`: odd n → \`ordered[mid]\`; even n → \`(ordered[mid - 1] + ordered[mid]) / 2\`. In real code, \`statistics.median\` does exactly this.`,
      starter: { files: { 'main.py': py`def median(values):
    # TODO: return the median without modifying values
    return values[len(values) // 2]


print(median([7, 1, 3]))
print(median([4, 1, 3, 2]))
` } },
      tests: [
        { name: 'odd count, unsorted input', code: py`assert median([7, 1, 3]) == 3` },
        { name: 'even count averages the middle two', code: py`assert median([4, 1, 3, 2]) == 2.5` },
        { name: 'does not modify the input', code: py`data = [9, 2, 5]
median(data)
assert data == [9, 2, 5]` },
        { name: 'empty list raises ValueError', code: py`with raises(ValueError):
    median([])` },
      ],
      solution: { files: { 'main.py': py`def median(values):
    if not values:
        raise ValueError("median() of an empty list")
    ordered = sorted(values)
    n = len(ordered)
    mid = n // 2
    if n % 2 == 1:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


print(median([7, 1, 3]))
print(median([4, 1, 3, 2]))
` } },
      hints: ['A median needs sorted data — but don\'t sort the caller\'s list in place.', 'n // 2 is the middle index for odd n, and the upper-middle index for even n.'],
      whyAsked: 'A small task that checks sorting without side effects, integer division and edge cases.',
      mistakes: ['Calling values.sort() and mutating the caller\'s list', 'Forgetting the even-length case', 'Returning None instead of raising for empty input'],
      followUps: ['Could you find the median without sorting everything? (selection / heaps)', 'What does statistics.median_low do?'],
      modelAnswer: 'I would first reject an empty list with a ValueError, then sort a copy with sorted() so I don\'t mutate the caller\'s data. With n items, the middle index is n // 2: for odd n that item is the median, and for even n I average the items at mid minus one and mid. That is O(n log n) because of the sort. In production I would just call statistics.median, and if performance mattered on huge data I would mention selection algorithms that run in linear time on average.',
    },
    {
      id: 'list-operations-empty-stats',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A dashboard shows the best and average response time. On a quiet day it crashes. What went wrong and how do you fix it?',
      code: { lang: 'python', code: py`def summary(times):
    return max(times), sum(times) / len(times)

summary([])   # ValueError: max() iterable argument is empty` },
      answer: 'With no data, max() raises ValueError and the average would divide by zero. Handle the empty case explicitly: max(times, default=None) and only average when times is non-empty (or return None/0 by design).',
      explanation: py`Empty input is a real case, not an edge case to ignore. \`max(times, default=None)\` returns the default instead of raising. The average needs an explicit guard: \`sum(times) / len(times) if times else None\`. Decide what "no data" should look like to the caller (None, 0, or a clear exception) and test it.`,
      whyAsked: 'Production bugs often come from empty collections; interviewers look for defensive thinking.',
      mistakes: ['Wrapping everything in a bare except', 'Returning 0 for the maximum, which looks like a real (very fast) value', 'Only fixing max() and leaving the ZeroDivisionError'],
      followUps: ['What should the API return when there is no data?', 'How would you test this?'],
      modelAnswer: 'The function assumes there is at least one measurement. On a quiet day the list is empty, so max raises ValueError — and if it hadn\'t, the average would raise ZeroDivisionError. I would decide what "no data" means for the caller, usually None, and handle it explicitly: max(times, default=None) and the average guarded with if times. I would avoid returning zero for the maximum, because zero looks like a genuine, impossibly fast response time. Then I would add a test for the empty case.',
    },
    {
      id: 'list-operations-top-k',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You need the 10 slowest requests from a very large log, and new entries keep arriving. Compare `sorted(...)[-10:]`, `heapq.nlargest`, and keeping a sorted list with `bisect.insort`.',
      answer: 'sorted() is O(n log n) and needs everything in memory; heapq.nlargest(10, …) is O(n log k) and can consume a stream; bisect.insort keeps a full sorted list but each insert is O(n) because of shifting. For a running top-k, a bounded min-heap of size k is the usual choice.',
      explanation: py`Sorting everything does far more work than needed when k is tiny and requires the whole dataset at once. \`heapq.nlargest(k, iterable, key=...)\` keeps only k items in a heap while scanning, so memory is O(k) and it works on generators. For a continuously updated top-k, push onto a k-sized min-heap and pop the smallest when it grows past k (\`heapq.heappushpop\`). \`bisect\` finds the position in O(log n) but the list insert shifts items. Measure on real data before choosing (see [profiling](lesson:profiling)).`,
      code: { lang: 'python', code: py`import heapq

durations = [120, 45, 980, 300, 15, 760, 410]
print(heapq.nlargest(3, durations))   # [980, 760, 410]` },
      whyAsked: 'Shows whether you can match a data structure to an access pattern and reason about time and memory.',
      mistakes: ['Always reaching for sort-then-slice', 'Claiming bisect.insort is O(log n) overall', 'Inventing benchmark numbers instead of reasoning about growth'],
      followUps: ['How does a heap work?', 'What changes if you need the top k per user?', 'When would a database be the better answer?'],
      modelAnswer: 'Sorting the whole log and slicing works, but it is O(n log n) and needs everything in memory, which is wasteful when I only want ten items. heapq.nlargest scans once and keeps only k items in a heap, so it is O(n log k) with O(k) memory and works on a stream. Keeping a sorted list with bisect.insort finds the position quickly, but every insert still shifts elements, so it is O(n) per insert. For a running top-k I would maintain a min-heap of size k and use heappushpop, and I would verify the choice by profiling on realistic data.',
    },
    {
      id: 'list-operations-timsort',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What does Python guarantee about sorting, and what is a CPython implementation detail?',
      answer: 'Guaranteed: sort()/sorted() are stable, the key is computed once per item, reverse=True preserves stability, and only < comparisons are used. Implementation detail: the algorithm (Timsort in CPython), its adaptivity to pre-sorted runs, and exact performance.',
      explanation: py`The docs promise stability and that the key function is evaluated once per element. Sorting uses \`<\` (\`__lt__\`) between items, which is why custom classes only need \`__lt__\` to be sortable (see [operator overloading](lesson:operator-overloading)). CPython uses Timsort, an adaptive merge sort that detects existing runs, giving near-linear time on nearly sorted data; other implementations are free to use other stable algorithms.`,
      whyAsked: 'Senior candidates are expected to separate contracts from implementation details and know the practical consequences.',
      mistakes: ['Saying Python uses quicksort', 'Claiming stability is a CPython detail', 'Assuming key is called on every comparison'],
      followUps: ['What happens if comparisons raise mid-sort?', 'How would you sort objects that do not define <?', 'What is functools.cmp_to_key for?'],
      modelAnswer: 'The contract is that sort and sorted are stable — equal elements keep their relative order, even with reverse=True — that the key function is called exactly once per element, and that items are compared with less-than. Everything else is CPython detail: it uses Timsort, an adaptive merge sort that finds already-sorted runs, which makes nearly sorted data very cheap to sort. Because only less-than is needed, a custom class becomes sortable by defining __lt__, or I can pass a key. And if a comparison raises halfway through, the error propagates and the list may be left partially reordered.',
    },
  ],

  takeaways: [
    'items.sort() sorts in place and returns None; sorted(iterable) returns a new list and works on any iterable.',
    'key= takes a function called once per item (key=len, key=str.lower); return a tuple to sort by several fields; reverse=True for descending.',
    'Python\'s sort is guaranteed stable, so equal items keep their order and multi-pass sorts work.',
    'min, max and sum summarise a list in one pass; give min/max a default= for empty input; index() raises ValueError when the item is missing.',
    'reverse() mutates, reversed() is a lazy iterator, [::-1] and [:] make new lists (shallow copies).',
    'Indexing, len, append and pop() are cheap whatever the size; insert(0)/pop(0), in, index, count and remove grow with the length.',
    'bisect searches sorted lists by halving; use deque for queues and sets for many membership tests.',
  ],
}
