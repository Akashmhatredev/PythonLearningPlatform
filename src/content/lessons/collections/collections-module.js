// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LOG_MAIN = py`from collections import Counter, defaultdict, deque, namedtuple

Hit = namedtuple("Hit", ["time", "method", "path", "status", "user"])


def parse(line):
    time, method, path, status, user = line.split()
    return Hit(time, method, path, int(status), user)


hits = []
with open("access.log") as log:          # read the file line by line
    for line in log:
        if line.strip():
            hits.append(parse(line))

status_counts = Counter()                # missing keys count as 0
path_counts = Counter()
users_by_path = defaultdict(set)         # missing keys get a new set()
recent_errors = deque(maxlen=3)          # keeps only the newest 3

for hit in hits:
    status_counts[hit.status] += 1
    path_counts[hit.path] += 1
    users_by_path[hit.path].add(hit.user)
    if hit.status >= 400:
        recent_errors.append(f"{hit.time} {hit.path} {hit.status}")

print("Requests:", len(hits))
print("Status codes:", status_counts)
print("Top 2 paths:", path_counts.most_common(2))
print("Users on /home:", sorted(users_by_path["/home"]))
print("Last errors:", list(recent_errors))
print("First hit:", hits[0])
`

const ACCESS_LOG = py`10:00:01 GET /home 200 ada
10:00:02 GET /about 200 ben
10:00:05 POST /login 401 cy
10:00:07 GET /home 200 cy
10:00:09 GET /cart 500 ada
10:00:12 POST /login 200 cy
10:00:15 GET /home 304 ben
10:00:18 GET /cart 500 dee
10:00:21 GET /home 200 dee
10:00:25 GET /missing 404 ada
`

export default {
  id: 'collections-module',
  title: 'collections: Counter, defaultdict, deque & namedtuple',
  summary: 'The collections module adds specialised containers — Counter for counting, defaultdict for grouping, deque for queues and sliding windows, namedtuple for readable records, plus OrderedDict and ChainMap — each beating a plain dict or list for one specific job.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['dictionaries', 'tuples-and-unpacking', 'list-operations'],
  related: ['dictionaries', 'sets', 'list-operations', 'records-and-slots', 'dataclasses', 'functools', 'performance', 'project-log-analyzer'],
  tags: ['collections', 'Counter', 'most_common', 'defaultdict', 'default_factory', 'deque', 'queue', 'appendleft', 'popleft', 'maxlen', 'sliding window', 'namedtuple', 'NamedTuple', 'OrderedDict', 'move_to_end', 'LRU cache', 'ChainMap', 'multiset', 'grouping', 'counting'],
  apis: [
    { name: 'Counter(iterable)', summary: 'A dict subclass mapping items to counts; missing items read as 0.' },
    { name: 'Counter.most_common(n)', summary: 'The n most common (item, count) pairs, highest first; ties keep first-seen order.' },
    { name: 'Counter.update() / subtract() / total()', summary: 'Add counts, subtract counts (may go negative), sum of all counts (3.10+).' },
    { name: 'defaultdict(factory)', summary: 'A dict that calls factory() to create a value for a missing key on d[key].' },
    { name: 'deque(iterable, maxlen=None)', summary: 'A double-ended queue: O(1) appends and pops at both ends; maxlen keeps only the newest items.' },
    { name: 'deque.appendleft / popleft / rotate', summary: 'Work at the left end; rotate(n) shifts items round in a circle.' },
    { name: 'namedtuple(name, fields)', summary: 'Creates a tuple subclass whose positions have names: p.x, p.y.' },
    { name: 'OrderedDict.move_to_end(key, last=True)', summary: 'Moves a key to either end — the building block of LRU caches.' },
    { name: 'ChainMap(*maps)', summary: 'A single view over several dicts; lookups search them in order.' },
  ],
  docs: [
    { label: 'collections — container datatypes', url: 'https://docs.python.org/3/library/collections.html' },
    { label: 'collections.Counter', url: 'https://docs.python.org/3/library/collections.html#collections.Counter' },
    { label: 'collections.deque', url: 'https://docs.python.org/3/library/collections.html#collections.deque' },
    { label: 'typing.NamedTuple', url: 'https://docs.python.org/3/library/typing.html#typing.NamedTuple' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You can count words with a plain [dict](lesson:dictionaries), group orders with \`setdefault\`, and use a [list](lesson:lists) as a queue. It works — but each needs a little boilerplate, and the list-as-queue quietly gets slow. The standard library's \`collections\` module packages these patterns as ready-made containers:`,
    py`| tool | in one sentence |
|---|---|
| \`Counter\` | a dict that counts things; missing items count as 0 |
| \`defaultdict\` | a dict that creates a starting value for any missing key |
| \`deque\` | a list-like queue that is fast at **both** ends and can cap its length |
| \`namedtuple\` | a tuple whose positions also have names |
| \`OrderedDict\` | a dict with extra tools for *reordering* keys |
| \`ChainMap\` | one view that looks through several dicts in order |`,
    py`None of them is magic: each is a small, well-tested specialisation of a container you already know. The skill is recognising the *pattern* in your code that one of them replaces.`,
  ],
  why: [
    py`Boilerplate hides intent. \`counts[w] = counts.get(w, 0) + 1\` is a counting pattern you have to *recognise*; \`Counter(words)\` *says* "count these". \`groups.setdefault(k, []).append(v)\` becomes \`groups[k].append(v)\`. Code that says what it means has fewer bugs.`,
    py`Some of these are also about **performance**. Removing from the front of a list shifts every other item, so a list used as a first-in-first-out queue does more and more hidden work as it grows. A \`deque\` removes from the front in constant time. Choosing the right container is often the easiest optimisation there is (see [performance](lesson:performance)).`,
  ],
  eli15: [
    py`Think of the \`collections\` module as a **toolbox of special containers**:`,
    py`- \`Counter\` is a **tally sheet**: write a name, add a mark. Ask about someone with no marks and the answer is just "0".
- \`defaultdict\` is a **filing cabinet that makes new folders by itself**: open a drawer for a name that doesn't exist yet and an empty folder appears, ready to use.
- \`deque\` is a **queue at a ticket counter** with doors at both ends — people join and leave quickly at either end. Give it a maximum size and it becomes a "last 3 things" list: when a fourth arrives, the oldest leaves.
- \`namedtuple\` is a **form with labelled boxes**: instead of "box 3", you write \`entry.status\`.`,
  ],
  analogy: {
    title: 'A school office\'s specialised stationery',
    body: [
      py`A school office could do everything with plain notebooks. But it keeps a **tally sheet** for votes, a **filing cabinet** that sprouts a new folder whenever a new pupil's name is used, a **ticket roll** at the canteen (first in, first served — with a "last 3 orders" display), and **pre-printed forms** with labelled boxes.`,
      py`Each one does a single job better than a notebook. The office still uses notebooks for everything else — and you'll still use plain dicts and lists for most things.`,
    ],
    mapping: [
      ['the tally sheet', 'Counter — counts, most_common(), "0" for anyone not on the sheet'],
      ['a cabinet that creates empty folders for new names', 'defaultdict(list) — groups[key].append(item)'],
      ['the canteen ticket queue', 'deque — append() at the back, popleft() at the front, both fast'],
      ['the "last 3 orders" display board', 'deque(maxlen=3) — the oldest drops off automatically'],
      ['a pre-printed form with labelled boxes', 'namedtuple — hit.status instead of hit[3]'],
      ['checking the class list, then the school list', 'ChainMap — look in the first dict, then the next'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Counter, defaultdict and deque in action',
    props: {
      code: py`from collections import Counter, defaultdict, deque

votes = ["tea", "coffee", "tea", "juice", "tea"]
tally = Counter(votes)
print(tally["tea"], tally["water"])
print(tally.most_common(2))

seats = defaultdict(list)
for i, drink in enumerate(votes):
    seats[drink].append(i)
print(dict(seats))

recent = deque(maxlen=3)
for drink in votes:
    recent.append(drink)
print(recent)
`,
      notes: {
        4: '`Counter(votes)` counts every item in one call.',
        5: 'A missing item reads as **0** — no `KeyError`, and nothing is inserted.',
        6: '`most_common(2)` returns the top two `(item, count)` pairs, highest first.',
        8: '`defaultdict(list)`: the first time a key is used, `list()` builds an empty list for it.',
        10: 'No `setdefault` needed — `seats[drink]` always gives you a list to append to.',
        13: '`maxlen=3`: once full, every append pushes the oldest item out of the other end.',
        15: 'Watch `recent` hold at most three drinks as the loop runs.',
      },
    },
    alt: 'A step-by-step trace. tally is a Counter built from five votes, giving tea 3, coffee 1 and juice 1; reading water returns 0. seats is a defaultdict of lists that gains a new empty list for each new drink, then the vote positions are appended. recent is a deque with maxlen 3 that fills with the first three drinks and then drops the oldest drink each time a new one is appended, ending as tea, juice, tea.',
    caption: py`Step through and watch \`seats\` sprout a new list the first time each drink appears, and \`recent\` never grow past three items.`,
  },
  syntax: [
    py`#### Counter: counting made obvious`,
    { code: py`from collections import Counter

votes = Counter(["tea", "coffee", "tea", "juice", "tea"])
print(votes)                    # Counter({'tea': 3, 'coffee': 1, 'juice': 1})
print(votes["tea"], votes["water"])   # 3 0 — missing items read as 0
print(votes.most_common(1))     # [('tea', 3)]

votes["water"] += 1             # no KeyError: 0 + 1
votes.update(["coffee", "coffee"])     # add more counts
print(votes.total())            # 8 — the sum of all counts (3.10+)

letters = Counter("banana")     # any iterable: counts characters
words = Counter("the cat the hat".split())`, lang: 'python', title: 'build, read, update' },
    py`\`most_common(n)\` sorts by count (highest first); equal counts keep the order in which items were first seen. Without \`n\` it returns everything.`,
    { code: py`from collections import Counter

stock = Counter(tea=3, jam=1)
sold = Counter(tea=1, jam=2)
print(stock + sold)    # Counter({'tea': 4, 'jam': 3})  add counts
print(stock - sold)    # Counter({'tea': 2})            jam dropped: zero/negative results vanish
print(stock & sold)    # Counter({'tea': 1, 'jam': 1})  min of each
print(stock | sold)    # Counter({'tea': 3, 'jam': 2})  max of each

stock.subtract(sold)   # in place, and KEEPS negatives
print(stock)           # Counter({'tea': 2, 'jam': -1})`, lang: 'python', title: 'Counter arithmetic (multisets)' },
    { callout: 'version', title: 'Counter in Python 3.10+', text: py`\`Counter.total()\` arrived in Python 3.10. Since 3.10, \`==\` also treats missing items as zero (\`Counter(a=1) == Counter(a=1, b=0)\` is \`True\`), and \`<=\`/\`>=\` test "is every count less than or equal".` },
    py`#### defaultdict: missing keys build their own value`,
    { code: py`from collections import defaultdict

by_house = defaultdict(list)            # factory: list → missing keys get []
for name, house in [("Ada", "Red"), ("Ben", "Blue"), ("Cy", "Red")]:
    by_house[house].append(name)
print(dict(by_house))                   # {'Red': ['Ada', 'Cy'], 'Blue': ['Ben']}

visits = defaultdict(int)               # int() is 0 → a counter
visits["/home"] += 1

tags = defaultdict(set)                 # unique values per key
tags["post-1"].add("python")

labels = defaultdict(lambda: "n/a")     # any zero-argument function works
print(labels["missing"])                # n/a`, lang: 'python', title: 'pass the factory, not a value' },
    py`You pass a **factory**: something Python can *call with no arguments* to build a fresh value — \`list\`, \`int\`, \`set\`, \`dict\`, or a \`lambda\`. Pass \`list\`, never \`[]\` (that's \`TypeError: first argument must be callable or None\`).`,
    { callout: 'warn', title: 'Reading a missing key inserts it', text: py`Only \`d[key]\` triggers the factory — and when it does, the new value is **stored**. So \`if d["x"]:\` quietly adds an empty \`"x"\` entry. Use \`"x" in d\` or \`d.get("x")\` to look without creating. Convert with \`dict(d)\` before handing the result to code that shouldn't have this behaviour.` },
    py`#### deque: a fast queue and a sliding window`,
    { code: py`from collections import deque

line = deque(["Ada", "Ben"])
line.append("Cy")            # join at the back
first = line.popleft()       # serve from the front: 'Ada' — O(1)
line.appendleft("VIP")       # push in at the front
last = line.pop()            # leave from the back: 'Cy'
print(line)                  # deque(['VIP', 'Ben'])

last_three = deque(maxlen=3) # a bounded window
for n in range(10):
    last_three.append(n)     # when full, the oldest drops off the other end
print(list(last_three))      # [7, 8, 9]

ring = deque([1, 2, 3, 4])
ring.rotate(1)               # deque([4, 1, 2, 3]) — shift round in a circle`, lang: 'python', title: 'both ends are fast' },
    py`A deque supports \`len\`, \`in\`, iteration and indexing (\`d[0]\`, \`d[-1]\`), but **not slicing**, and indexing gets slower towards the middle. Popping from an empty deque raises \`IndexError: pop from an empty deque\`.`,
    py`#### namedtuple: records with names`,
    { code: py`from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print(p)                       # Point(x=3, y=4)
print(p.x, p[1])               # 3 4 — by name or position
x, y = p                       # unpacks like any tuple
moved = p._replace(x=10)       # tuples are immutable: get a modified copy
print(moved._asdict())         # {'x': 10, 'y': 4}

Hit = namedtuple("Hit", ["path", "status"], defaults=[200])
print(Hit("/home"))            # Hit(path='/home', status=200)`, lang: 'python', title: 'a tuple subclass with field names' },
    py`The modern, type-hinted spelling is a class: \`class Point(typing.NamedTuple): x: int; y: int = 0\`. Both create the same kind of object. When a record needs mutability, methods or validation, move up to a [dataclass](lesson:dataclasses) — compared in detail in [lightweight records](lesson:records-and-slots).`,
    py`#### OrderedDict: when reordering is the point`,
    { code: py`from collections import OrderedDict

recent = OrderedDict(a=1, b=2, c=3)
recent.move_to_end("a")            # a becomes the newest
print(list(recent))                # ['b', 'c', 'a']
oldest = recent.popitem(last=False)   # remove from the FRONT: ('b', 2)

print(OrderedDict(a=1, b=2) == OrderedDict(b=2, a=1))   # False — order matters here
print(dict(a=1, b=2) == dict(b=2, a=1))                 # True — plain dicts ignore order`, lang: 'python', title: 'move_to_end and popitem(last=False)' },
    py`Plain dicts have kept insertion order since Python 3.7, so you don't need \`OrderedDict\` just to *remember* order. Reach for it when you need to **move** keys around cheaply (LRU caches), pop from the front, or compare with order-sensitive equality.`,
    py`#### ChainMap: layered lookups without copying`,
    { code: py`from collections import ChainMap

defaults = {"theme": "light", "font": 14, "lang": "en"}
user = {"theme": "dark"}
settings = ChainMap(user, defaults)   # search user first, then defaults
print(settings["theme"], settings["font"])   # dark 14
settings["font"] = 16                 # writes go to the FIRST mapping only
print(user)                           # {'theme': 'dark', 'font': 16}`, lang: 'python', title: 'first match wins' },
    py`A ChainMap is a **live view**: change \`defaults\` and \`settings\` sees it immediately. That's the difference from \`defaults | user\`, which builds a one-off merged copy.`,
  ],
  walkthrough: {
    title: 'Reading the log analyzer line by line',
    lang: 'python',
    code: LOG_MAIN,
    intro: py`This is \`main.py\` from the playground below (it reads \`access.log\`, the second file). Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [3], text: py`\`namedtuple\` creates a new record type, \`Hit\`, with five named fields. Each parsed log line becomes one immutable \`Hit\`.` },
      { lines: [6, 8], text: py`\`line.split()\` gives five strings, unpacked into five names. The status is converted with \`int()\` so we can compare it with \`>= 400\`.` },
      { lines: [11, 15], text: py`\`with open(...)\` opens the file and closes it automatically afterwards (see [reading & writing files](lesson:reading-writing-files)). Looping over the file gives one line at a time; blank lines are skipped.` },
      { lines: [17, 20], text: py`Four specialised containers: two \`Counter\`s (missing keys read as 0), a \`defaultdict(set)\` (missing keys get a fresh empty set), and a \`deque\` capped at 3 items.` },
      { lines: [22, 27], text: py`One pass does everything. \`status_counts[hit.status] += 1\` works even the first time a status appears. \`users_by_path[hit.path].add(...)\` never needs a "does this key exist?" check. Each error is appended to the deque, which silently drops the oldest once it holds three.` },
      { lines: [29, 34], text: py`\`most_common(2)\` ranks paths by count (ties keep first-seen order, so \`/login\` beats \`/cart\`). The deque holds only the three newest errors, and printing a \`Hit\` shows every field by name.` },
    ],
  },
  playground: {
    title: 'Access-log analyzer',
    objective: 'Run it, then add new statistics with Counter and defaultdict, resize the error window, and edit the log file itself.',
    files: { 'main.py': LOG_MAIN, 'access.log': ACCESS_LOG },
    expected: py`\`\`\`text
Requests: 10
Status codes: Counter({200: 5, 500: 2, 401: 1, 304: 1, 404: 1})
Top 2 paths: [('/home', 4), ('/login', 2)]
Users on /home: ['ada', 'ben', 'cy', 'dee']
Last errors: ['10:00:09 /cart 500', '10:00:18 /cart 500', '10:00:25 /missing 404']
First hit: Hit(time='10:00:01', method='GET', path='/home', status=200, user='ada')
\`\`\`

There are four errors in the log, but the deque only remembers the newest three.`,
    experiments: [
      {
        id: 'most-active',
        task: py`Add a \`Counter\` called \`user_counts\` that counts hits per user (inside the loop), and print the busiest user as \`Most active: ('ada', 3)\`.`,
        hint: py`Create \`user_counts = Counter()\` next to the other counters, add \`user_counts[hit.user] += 1\` in the loop, then \`print("Most active:", user_counts.most_common(1)[0])\`.`,
        tests: [
          { name: 'user_counts is a Counter', code: py`from collections import Counter
assert isinstance(ns.get('user_counts'), Counter), 'Create user_counts = Counter()'` },
          { name: 'prints the most active user', code: py`assert "Most active: ('ada', 3)" in output` },
        ],
        explain: py`Ada and Cy both have 3 hits; \`most_common\` breaks ties by first appearance, and Ada's first hit comes first. \`most_common(1)\` returns a list with one pair, hence the \`[0]\`.`,
      },
      {
        id: 'bigger-window',
        task: py`Change the deque so it remembers **all** the errors in this log, not just the last three.`,
        hint: py`Raise \`maxlen\` (or remove it — \`deque()\` with no maxlen is unbounded).`,
        tests: [{ name: 'all the errors are kept', code: py`assert len(recent_errors) >= 4, 'Raise maxlen so every error fits'` }],
        explain: py`With \`maxlen=5\` (or none), nothing is pushed out. A bounded deque is perfect for "the last N things" — memory stays fixed however long the log gets.`,
      },
      {
        id: 'count-methods',
        task: py`Count HTTP methods: add \`method_counts = Counter()\`, count \`hit.method\` inside the loop, and print it.`,
        hint: py`Same pattern as \`status_counts\`: \`method_counts[hit.method] += 1\`.`,
        tests: [{ name: 'GET and POST are counted', code: py`from collections import Counter
mc = ns.get('method_counts')
assert isinstance(mc, Counter), 'Create method_counts = Counter()'
assert mc["POST"] == 2 and mc["GET"] >= 8` }],
        explain: py`Every \`Counter\` follows the same recipe: create it empty, then \`+= 1\` per item. You could also build it in one line from a generator expression — \`Counter(hit.method for hit in hits)\` — once you've met [generator expressions](lesson:lazy-evaluation).`,
      },
      {
        id: 'new-log-line',
        task: py`Open **access.log** and add a new line at the end: \`10:00:30 GET /cart 500 eve\`. Predict how *Requests*, *Top 2 paths* and *Last errors* change.`,
        hint: py`Switch to the access.log tab in the editor; each line is: time method path status user.`,
        tests: [
          { name: 'the log has the new line', code: py`assert "10:00:30 GET /cart 500 eve" in files["access.log"]` },
          { name: 'the newest error is the new one', code: py`assert recent_errors[-1] == "10:00:30 /cart 500"` },
        ],
        explain: py`The program has no hard-coded data, so it adapts: 11 requests, \`/cart\` now has 3 hits and overtakes \`/login\`, and the newest error pushes the oldest one out of the 3-item deque.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'deque(maxlen=3): a sliding window',
    props: {
      width: 760,
      height: 260,
      nodes: [
        { id: 'gone', label: 'dropped', note: 'falls off', x: 80, y: 130, tone: 'kraft' },
        { id: 's0', label: 'oldest', note: 'left end', x: 240, y: 130 },
        { id: 's1', label: 'middle', x: 380, y: 130 },
        { id: 's2', label: 'newest', note: 'right end', x: 520, y: 130 },
        { id: 'new', label: 'append(x)', note: 'new item', x: 680, y: 130, tone: 'yellow' },
      ],
      edges: [
        { id: 'in', from: 'new', to: 's2', label: 'append' },
        { id: 'shift1', from: 's2', to: 's1', label: 'slides' },
        { id: 'shift2', from: 's1', to: 's0', label: 'slides' },
        { id: 'out', from: 's0', to: 'gone', label: 'oldest out', dashed: true },
      ],
      steps: [
        { focus: ['s0', 's1', 's2'], text: py`\`recent = deque(maxlen=3)\` holds at most three items. Both ends are "open": you can add or remove at the left or the right in constant time.` },
        { focus: ['new', 's2'], edges: ['in'], text: py`The first three \`append\` calls simply fill it up: \`deque(['a', 'b', 'c'], maxlen=3)\`.` },
        { focus: ['new', 's2', 's1', 's0', 'gone'], edges: ['in', 'shift1', 'shift2', 'out'], text: py`A fourth \`append("d")\` doesn't raise and doesn't grow the deque: the **oldest** item ("a") drops off the left end → \`['b', 'c', 'd']\`. That's a sliding window over a stream.` },
        { focus: ['s0', 'gone'], text: py`It works in the other direction too: \`appendleft(x)\` on a full deque pushes the item at the **right** end out. And \`popleft()\` removes the oldest without shifting anything — unlike \`list.pop(0)\`.` },
        { focus: ['s0', 's1', 's2'], text: py`Uses: "last N log lines" (like \`tail\`), moving averages, undo history with a limit, recently viewed items. Memory stays fixed however long the input is.` },
      ],
    },
    alt: 'Three slots labelled oldest, middle and newest, with a new item arriving at the right and a dropped area on the left. When the deque is full, appending pushes each item one slot left and the oldest item falls off the left end.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every tool in \`collections\` is built from ideas you already know. \`Counter\`, \`defaultdict\` and \`OrderedDict\` **are** dictionaries (subclasses of \`dict\`), so everything you know about dicts still works on them: \`in\`, \`.items()\`, \`len()\`, hashable keys. A \`namedtuple\` **is** a tuple. A \`deque\` behaves like a list that's fast at both ends.`,
      py`Because they're subclasses, you can pass a \`Counter\` or \`defaultdict\` anywhere a dict is expected — \`json.dumps\` happily writes them out, and \`isinstance(c, dict)\` is \`True\`.`,
      { code: py`from collections import Counter, defaultdict
import json

c = Counter("hello")
print(isinstance(c, dict))           # True
print(json.dumps(c))                 # {"h": 1, "e": 1, "l": 2, "o": 1}
print(json.dumps(defaultdict(int)))  # {}`, lang: 'python', title: 'they are still dicts' },
    ],
    technical: [
      py`**The \`__missing__\` hook.** When \`d[key]\` doesn't find a key, a dict subclass's \`__missing__(key)\` method is called. \`Counter.__missing__\` returns \`0\` **without inserting** anything — that's why \`c["water"]\` is 0 but \`"water" in c\` stays \`False\`. \`defaultdict.__missing__\` calls \`default_factory()\`, **stores** the result under the key, and returns it. Only \`[]\` lookups trigger \`__missing__\`; \`get()\`, \`in\` and \`setdefault()\` never do.`,
      py`**Counter maths.** \`+\`, \`-\`, \`&\` and \`|\` treat Counters as multisets and **drop** results that are zero or negative; \`update()\` and \`subtract()\` work in place and keep negatives. Unary \`+c\` strips non-positive counts. \`most_common()\` sorts by count; ties stay in insertion order because sorting is stable.`,
      py`**deque complexity (documented).** Appends and pops at either end are O(1). The docs note that indexed access is O(1) at both ends but slows to O(n) in the middle, and slicing isn't supported at all — a deque is for ends, not random access.`,
      py`**namedtuple** generates a real class at runtime: a \`tuple\` subclass with a read-only property per field and \`__slots__ = ()\`, so instances have no per-instance \`__dict__\` and use no more memory than a plain tuple. Assigning \`p.x = 5\` fails (\`AttributeError\`), and \`json.dumps(p)\` writes a JSON **list**, because it *is* a tuple.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython implements \`deque\` in C as a doubly-linked list of fixed-size blocks, which is why both ends are cheap and the middle isn't. \`OrderedDict\` keeps a separate linked ordering of its keys, so \`move_to_end\` and \`popitem(last=False)\` are O(1) — at the cost of more memory than a plain dict. These layouts are implementation details; the documented complexities are what you can rely on.` },
    ],
    production: [
      py`**Default to plain dicts and lists**, and switch when the pattern appears: counting → \`Counter\`; grouping or nested accumulation → \`defaultdict\`; queues, BFS and "last N" windows → \`deque\`; fixed small records → \`NamedTuple\` or a [dataclass](lesson:dataclasses); reordering → \`OrderedDict\`; layered configuration or scopes → \`ChainMap\`.`,
      py`**Don't leak \`defaultdict\` across API boundaries.** A caller doing an innocent \`result["typo"]\` silently creates entries. Return \`dict(result)\` from functions that build one internally.`,
      py`**Queues and threads.** The docs state that deque appends and pops from either end are thread-safe, which makes it a common building block. When producers and consumers need to *wait* for items, use \`queue.Queue\` (threads) or \`asyncio.Queue\` (async code) instead — see [threading](lesson:threading) and [asyncio in practice](lesson:asyncio-in-practice).`,
      py`**Caching.** For memoising a function, \`functools.lru_cache\` / \`functools.cache\` (see [functools](lesson:functools)) are better than a hand-rolled \`OrderedDict\` cache; build your own only when you need custom eviction or inspection.`,
      py`**Type hints.** Since Python 3.9 these classes are generic: \`Counter[str]\`, \`defaultdict[str, list[int]]\`, \`deque[float]\`, \`OrderedDict[str, int]\`. Prefer \`typing.NamedTuple\` over \`namedtuple()\` in typed code — the fields carry types.`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting a lookup on a defaultdict to leave it unchanged',
      wrong: { code: py`from collections import defaultdict

graph = defaultdict(list)
graph["a"].append("b")
if graph["c"]:              # creates graph["c"] = []
    print("c has neighbours")
print(len(graph))           # 2 — a phantom node appeared`, lang: 'python' },
      right: { code: py`from collections import defaultdict

graph = defaultdict(list)
graph["a"].append("b")
if graph.get("c"):          # get() never calls the factory
    print("c has neighbours")
print(len(graph))           # 1`, lang: 'python' },
      explanation: py`Every \`d[key]\` on a missing key stores a new default. Use \`in\` or \`.get()\` for read-only checks.`,
    },
    {
      title: 'Passing a value instead of a factory',
      wrong: { code: py`from collections import defaultdict

groups = defaultdict([])     # TypeError: first argument must be callable or None`, lang: 'python', static: true },
      right: { code: py`from collections import defaultdict

groups = defaultdict(list)   # the class itself: called to make each new []
zeroes = defaultdict(lambda: 0.0)`, lang: 'python' },
      explanation: py`\`defaultdict\` needs something it can *call* each time a key is missing, so that every key gets its **own** new object. A single \`[]\` would be one shared list — exactly the aliasing problem from [mutability & copying](lesson:mutability-and-copying).`,
    },
    {
      title: 'Using a list as a FIFO queue',
      wrong: { code: py`tasks = ["build", "test", "deploy"]
while tasks:
    task = tasks.pop(0)      # shifts every remaining item each time
    print(task)`, lang: 'python' },
      right: { code: py`from collections import deque

tasks = deque(["build", "test", "deploy"])
while tasks:
    task = tasks.popleft()   # O(1)
    print(task)`, lang: 'python' },
      explanation: py`For three items nobody notices; for a big work queue or a breadth-first search over a large graph, \`pop(0)\` makes the total work grow with the square of the size. \`deque.popleft()\` is constant time.`,
    },
    {
      title: 'Expecting Counter subtraction to keep negatives',
      wrong: { code: py`from collections import Counter

stock = Counter(apples=5, pears=2)
after = stock - Counter(apples=7)
print(after)       # Counter({'pears': 2}) — the -2 apples vanished`, lang: 'python' },
      right: { code: py`from collections import Counter

stock = Counter(apples=5, pears=2)
stock.subtract(Counter(apples=7))
print(stock)       # Counter({'pears': 2, 'apples': -2}) — the shortfall is visible`, lang: 'python' },
      explanation: py`The \`-\` operator is multiset difference and drops non-positive results. If a negative count *means* something (an overdraft, missing stock), use \`subtract()\`.`,
    },
    {
      title: 'Trying to change a namedtuple field',
      wrong: { code: py`from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
p.x = 10           # AttributeError: can't set attribute`, lang: 'python', static: true },
      right: { code: py`from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
p = p._replace(x=10)     # a new Point with x changed
print(p)                 # Point(x=10, y=4)`, lang: 'python' },
      explanation: py`Named tuples are tuples, so they're immutable. Use \`_replace\` for a modified copy — or a dataclass if the record genuinely needs to change in place.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: first argument must be callable or None`,
      cause: py`\`defaultdict([])\`, \`defaultdict(0)\` or \`defaultdict(list())\` — a value was passed instead of a factory.`,
      fix: py`Pass the type or function itself: \`defaultdict(list)\`, \`defaultdict(int)\`, \`defaultdict(lambda: "n/a")\`.`,
    },
    {
      symptom: py`My defaultdict has extra keys with empty values.`,
      cause: py`Somewhere a read used \`d[key]\` on a missing key (an \`if d[k]\`, a \`print(d[k])\`, a loop over candidate keys), and the factory stored a default.`,
      fix: py`Use \`key in d\` / \`d.get(key)\` for reads, and convert to \`dict(d)\` before returning it from a function.`,
    },
    {
      symptom: py`IndexError: pop from an empty deque`,
      cause: py`\`popleft()\` or \`pop()\` on an empty deque — usually a loop that doesn't check for emptiness.`,
      fix: py`Loop with \`while queue:\`, or check \`if queue:\` before popping.`,
    },
    {
      symptom: py`TypeError: sequence index must be integer, not 'slice'`,
      cause: py`Slicing a deque (\`d[1:3]\`) — deques don't support slices.`,
      fix: py`Use \`itertools.islice(d, 1, 3)\`, or \`list(d)[1:3]\` for small deques. If you need slicing a lot, a list may be the better structure.`,
    },
    {
      symptom: py`AttributeError: can't set attribute`,
      cause: py`Assigning to a field of a named tuple.`,
      fix: py`Build a new one with \`._replace(field=value)\`, or switch to a dataclass.`,
    },
    {
      symptom: py`KeyError: "Key not found in the first mapping: 'lang'"`,
      cause: py`\`del\` (or \`pop\`) on a \`ChainMap\` key that exists only in a later mapping — deletes only affect the first mapping.`,
      fix: py`Delete from the specific dict (\`defaults.pop("lang")\`), or design the first mapping to hold every override you might remove.`,
    },
  ],
  bestPractices: [
    'Use Counter for counting and top-N questions; use most_common(n) instead of sorting a dict by hand.',
    'Use defaultdict(list/set/int) for grouping and accumulating; read with in or get(), and return dict(d) from functions.',
    'Use deque for FIFO queues, BFS and bounded "last N" windows; never list.pop(0) in a loop.',
    'Prefer typing.NamedTuple (or a dataclass) for small records instead of bare tuples indexed by position.',
    'Use plain dicts for ordering; reach for OrderedDict only for move_to_end, popitem(last=False) or order-sensitive equality.',
    'Use ChainMap for layered lookups that must stay live; use | when you want a one-off merged copy.',
  ],
  useCases: [
    'Word frequencies, vote tallies, HTTP status-code counts (Counter).',
    'Grouping orders by customer or log lines by IP address (defaultdict(list)).',
    'Building adjacency lists for graphs (defaultdict(list)) and exploring them breadth-first (deque).',
    'Keeping the last N log lines, readings or undo steps (deque(maxlen=N)).',
    'Readable records from CSV rows or database results (namedtuple / NamedTuple).',
    'LRU caches with OrderedDict.move_to_end; layered settings with ChainMap.',
  ],
  whenToUse: {
    use: [
      'You are writing the counting or grouping pattern by hand.',
      'You add or remove at the front of a sequence.',
      'You only need the most recent N items of a stream.',
      'You index tuples by position and readers have to remember what [3] means.',
    ],
    avoid: [
      'A plain dict or list already expresses the intent clearly.',
      'You need random access or slicing in the middle — use a list, not a deque.',
      'Records need mutation, validation or methods — use a dataclass rather than a namedtuple.',
      'You only want insertion order — plain dicts already keep it (3.7+).',
    ],
  },
  comparison: {
    title: 'Which collections tool, and what it replaces',
    headers: ['tool', 'replaces this plain-Python pattern', 'watch out for'],
    rows: [
      ['Counter', 'd[k] = d.get(k, 0) + 1, then sorting by value', 'missing keys read as 0 but aren\'t stored; - drops non-positive counts'],
      ['defaultdict', 'd.setdefault(k, []).append(v)', 'reading a missing key inserts it'],
      ['deque', 'list.pop(0) / list.insert(0, x); a list trimmed to the last N', 'no slicing; slow indexing in the middle'],
      ['namedtuple', 'tuples read as t[0], t[3]…', 'immutable; JSON writes it as a list'],
      ['OrderedDict', 'manual re-insertion to move a key to the end', 'not needed just for order since 3.7'],
      ['ChainMap', 'merging several dicts into a copy for lookups', 'writes and deletes affect only the first mapping'],
    ],
    note: py`All six live in the standard library — no installation needed — and all accept the same type-hint syntax as the built-ins (\`Counter[str]\`, \`deque[int]\`, 3.9+).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'collections-module-q1',
      type: 'mcq',
      prompt: 'Given `c = Counter(["tea", "tea", "jam"])`, what does `c["water"]` return?',
      options: [
        { text: 'It raises KeyError', why: 'That is plain dict behaviour. Counter defines __missing__ to return 0 instead.' },
        '0',
        { text: 'None', why: 'Counter returns a count, and the count of something never seen is 0, not None.' },
        { text: '0, and "water" is added to the Counter', why: 'Counter reports 0 without inserting the key — "water" in c is still False. (defaultdict, by contrast, does insert.)' },
      ],
      answer: 1,
      explanation: py`A Counter treats missing items as having a count of zero, which is why \`c[k] += 1\` works without any setup. Reading doesn't insert the key.`,
    },
    {
      id: 'collections-module-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from collections import Counter
print(Counter("banana").most_common(2))`,
      answer: "[('a', 3), ('n', 2)]",
      explanation: py`"banana" has three a's, two n's and one b. \`most_common(2)\` returns the top two \`(item, count)\` pairs as a list of tuples, highest count first.`,
    },
    {
      id: 'collections-module-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from collections import defaultdict
d = defaultdict(list)
if d["x"]:
    print("has x")
print(len(d))`,
      options: [
        { text: '0', why: 'Reading d["x"] on a defaultdict calls list() and stores the empty list under "x".' },
        '1',
        { text: 'has x, then 1', why: 'The stored value is an empty list, which is falsy, so "has x" is not printed.' },
        { text: 'KeyError: \'x\'', why: 'defaultdict never raises KeyError on [] lookups while it has a factory.' },
      ],
      answer: 1,
      explanation: py`\`d["x"]\` triggers the factory: an empty list is created **and stored**. The empty list is falsy, so nothing is printed, but the dict now has one key. Use \`"x" in d\` to check without inserting.`,
    },
    {
      id: 'collections-module-q4',
      type: 'bug',
      prompt: 'This should serve customers in the order they arrived ("a" first), but it prints `c`. Click the buggy line.',
      code: py`from collections import deque
queue = deque(["a", "b"])
queue.append("c")
first = queue.pop()
print(first)`,
      answerLine: 4,
      explanation: py`\`pop()\` removes from the **right** (newest) end. A first-in-first-out queue appends on the right and removes from the left: \`queue.popleft()\`.`,
    },
    {
      id: 'collections-module-q5',
      type: 'fill',
      prompt: 'Complete the code so the deque only ever keeps the three most recent numbers and the program prints `[7, 8, 9]`.',
      code: py`from collections import deque
last_three = deque(___=3)
for n in range(10):
    last_three.append(n)
print(list(last_three))`,
      answer: [['maxlen']],
      explanation: py`\`deque(maxlen=3)\` is bounded: when it's full, each \`append\` discards the item at the opposite (left) end.`,
    },
    {
      id: 'collections-module-q6',
      type: 'mcq',
      prompt: 'You need to group online orders by customer id: `{customer_id: [order, order, ...]}`. Which tool fits best?',
      options: [
        'defaultdict(list)',
        { text: 'Counter', why: 'Counter stores counts (numbers), not lists of orders. It would tell you how many orders each customer has, not which ones.' },
        { text: 'deque', why: 'A deque is a sequence for queue-like access at the ends; it doesn\'t map keys to values.' },
        { text: 'namedtuple', why: 'A namedtuple could describe one order, but it doesn\'t group many orders by key.' },
      ],
      answer: 0,
      explanation: py`\`groups = defaultdict(list)\` then \`groups[order.customer_id].append(order)\` — every new customer automatically gets an empty list.`,
    },
    {
      id: 'collections-module-q7',
      type: 'short',
      prompt: 'Plain dicts have kept insertion order since Python 3.7. When would you still choose `OrderedDict`?',
      answer: py`When reordering is part of the job or order is part of the meaning. OrderedDict has move_to_end(key, last=True/False) and popitem(last=False), which make it easy to move keys to either end and remove the oldest — the classic building blocks of an LRU cache. Its equality is order-sensitive (OrderedDict(a=1, b=2) != OrderedDict(b=2, a=1)), whereas plain dict equality ignores order. Just to remember insertion order, a plain dict is enough.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'top-words',
      title: 'Most frequent words',
      difficulty: 'intermediate',
      prompt: py`Write \`top_words(text, n)\` that returns the \`n\` most common words as a **list of \`(word, count)\` tuples**, most common first.

- Compare words case-insensitively (lower-case them).
- Strip these punctuation characters from the ends of each word: \`.,!?;:\`
- Ignore anything that becomes empty after stripping.
- Ties keep the order in which the words were first seen.

\`\`\`python
top_words("The cat. The hat! the end", 1)   # [('the', 3)]
top_words("b a b a c", 2)                   # [('b', 2), ('a', 2)]
\`\`\``,
      files: {
        'main.py': py`from collections import Counter


def top_words(text, n):
    # TODO: clean the words, count them, return the n most common
    return []


review = "Great tea. Great cake! The tea was hot, the cake was great."
print(top_words(review, 3))
`,
      },
      hints: [
        'Split with text.lower().split(), then clean each word with word.strip(".,!?;:").',
        'Collect the cleaned, non-empty words in a list and pass it to Counter(...). Counter has a method that returns the top n pairs.',
        'words = []\nfor raw in text.lower().split():\n    word = raw.strip(".,!?;:")\n    if word:\n        words.append(word)\nreturn Counter(words).most_common(n)',
      ],
      solution: {
        explanation: py`Lower-casing first makes "The" and "the" the same key. \`str.strip(chars)\` removes any of the listed characters from **both ends** only, so "don't" keeps its apostrophe and "end!" becomes "end". \`Counter(words)\` does the counting, and \`most_common(n)\` returns a list of \`(word, count)\` tuples sorted by count; because sorting is stable, ties stay in first-seen order. If \`n\` exceeds the number of distinct words you simply get them all, and an empty text gives \`[]\`.`,
        files: {
          'main.py': py`from collections import Counter


def top_words(text, n):
    words = []
    for raw in text.lower().split():
        word = raw.strip(".,!?;:")
        if word:
            words.append(word)
    return Counter(words).most_common(n)


review = "Great tea. Great cake! The tea was hot, the cake was great."
print(top_words(review, 3))
`,
        },
      },
      tests: [
        { name: 'counts case-insensitively and strips punctuation', code: py`assert top_words("The cat. The hat! the end", 1) == [("the", 3)]` },
        { name: 'ties keep first-seen order', code: py`assert top_words("b a b a c", 2) == [("b", 2), ("a", 2)]` },
        { name: 'ignores punctuation-only tokens', code: py`assert top_words("Hi, hi! ... yo", 5) == [("hi", 2), ("yo", 1)]` },
        { name: 'empty text gives []', code: py`assert top_words("", 3) == []` },
        { name: 'the review example', code: py`assert top_words("Great tea. Great cake! The tea was hot, the cake was great.", 3) == [("great", 3), ("tea", 2), ("cake", 2)]` },
      ],
    },
    {
      id: 'moving-averages',
      title: 'Smooth a noisy sensor',
      difficulty: 'intermediate',
      prompt: py`A temperature sensor is noisy. Write \`moving_averages(values, window)\` that returns a list with one float per reading: the **average of the most recent \`window\` readings** up to and including that one. At the start, when fewer than \`window\` readings exist, average the ones you have.

\`\`\`python
moving_averages([10, 20, 30, 40], 2)   # [10.0, 15.0, 25.0, 35.0]
moving_averages([3, 6, 9, 12], 3)      # [3.0, 4.5, 6.0, 9.0]
\`\`\`

Use a \`deque\` with \`maxlen\` to hold the window.`,
      files: {
        'main.py': py`from collections import deque


def moving_averages(values, window):
    # TODO: keep the last "window" readings in a deque(maxlen=window)
    return []


readings = [21.0, 21.4, 25.9, 21.2, 21.1, 20.8]
print(moving_averages(readings, 3))
`,
      },
      hints: [
        'Create recent = deque(maxlen=window) before the loop.',
        'For each value: append it to recent (the deque drops the oldest automatically), then append sum(recent) / len(recent) to your result list.',
        'recent = deque(maxlen=window)\naverages = []\nfor v in values:\n    recent.append(v)\n    averages.append(sum(recent) / len(recent))\nreturn averages',
      ],
      solution: {
        explanation: py`\`deque(maxlen=window)\` *is* the sliding window: each \`append\` adds the newest reading, and once the deque is full the oldest reading falls out the other end — no index arithmetic, no slicing. Dividing by \`len(recent)\` (rather than \`window\`) handles the start, when the window isn't full yet. Memory use stays at \`window\` readings however long the input is, which is what you want for a stream from a real sensor. (For very large windows you could keep a running total instead of calling \`sum\` each time.)`,
        files: {
          'main.py': py`from collections import deque


def moving_averages(values, window):
    recent = deque(maxlen=window)
    averages = []
    for v in values:
        recent.append(v)
        averages.append(sum(recent) / len(recent))
    return averages


readings = [21.0, 21.4, 25.9, 21.2, 21.1, 20.8]
print(moving_averages(readings, 3))
`,
        },
      },
      tests: [
        { name: 'window of 2', code: py`assert moving_averages([10, 20, 30, 40], 2) == [10.0, 15.0, 25.0, 35.0]` },
        { name: 'window of 3, partial at the start', code: py`assert moving_averages([3, 6, 9, 12], 3) == [3.0, 4.5, 6.0, 9.0]` },
        { name: 'window of 1 returns the values as floats', code: py`assert moving_averages([5, 7], 1) == [5.0, 7.0]` },
        { name: 'empty input gives []', code: py`assert moving_averages([], 3) == []` },
        { name: 'uses a bounded deque', code: py`src = files["main.py"]
assert "deque(" in src and "maxlen" in src, 'Use deque(maxlen=window) for the window'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'collections-module-counter-vs-dict',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Why use `Counter` instead of counting with a plain dict?',
      answer: 'Counter expresses intent in one call, returns 0 for missing items (so c[k] += 1 just works), offers most_common(n), update/subtract, total(), and multiset arithmetic (+, -, &, |). It is still a dict subclass, so it works anywhere a dict does.',
      explanation: py`The plain-dict version (\`d[k] = d.get(k, 0) + 1\`, then \`sorted(d.items(), key=..., reverse=True)[:n]\`) is longer and easier to get wrong. \`Counter\` also documents *what* the dict holds. Caveats: the \`-\` operator drops non-positive counts, and reading a missing key returns 0 without storing it.`,
      whyAsked: 'Shows standard-library fluency and a preference for intention-revealing code.',
      mistakes: ['Not knowing most_common', 'Thinking Counter raises KeyError like dict', 'Re-implementing top-N with manual sorting'],
      followUps: ['How would you find the 3 least common items?', 'What does Counter("aab") - Counter("abb") return?', 'How do you merge counts from many files?'],
      modelAnswer: 'Counter is a dict subclass designed for counting. It builds counts from any iterable in one call, treats missing items as zero so incrementing never needs a check, and gives me most_common for top-N queries, update and subtract to adjust counts, total since 3.10, and multiset operators like plus, minus, and, or. The plain-dict version needs get with a default plus manual sorting, which is longer and hides the intent. Two things I keep in mind: the minus operator drops zero and negative counts — I use subtract if negatives matter — and reading a missing key returns zero without inserting it.',
    },
    {
      id: 'collections-module-counter-arith',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`from collections import Counter
a = Counter(tea=3, jam=1)
b = Counter(tea=1, jam=2)
print(a - b, a + b)` },
      options: [
        "Counter({'tea': 2}) Counter({'tea': 4, 'jam': 3})",
        "Counter({'tea': 2, 'jam': -1}) Counter({'tea': 4, 'jam': 3})",
        "Counter({'tea': 2, 'jam': 0}) Counter({'tea': 4, 'jam': 3})",
        'TypeError: unsupported operand type(s)',
      ],
      correctOption: 0,
      answer: "`Counter({'tea': 2}) Counter({'tea': 4, 'jam': 3})`. The - operator keeps only positive results, so jam (1 - 2 = -1) disappears; + adds counts.",
      explanation: py`Counter's binary operators implement multiset semantics and discard counts that are zero or negative. To keep negative values, use the in-place \`a.subtract(b)\`, which leaves \`jam: -1\`.`,
      whyAsked: 'A precise-semantics question that separates people who have used Counter from those who only know its name.',
      mistakes: ['Expecting a negative count from -', 'Expecting a zero entry to remain'],
      followUps: ['What do & and | do?', 'What does unary +c do?'],
      modelAnswer: 'It prints a Counter with tea 2, and a Counter with tea 4 and jam 3. Counter\'s operators are multiset operations: plus adds counts, and minus subtracts but then drops anything that is zero or negative, so jam, which would be minus one, disappears. If I need to keep negative counts — say, to show a stock shortfall — I use the subtract method, which works in place and keeps negatives. Ampersand and pipe give the minimum and maximum of each count.',
    },
    {
      id: 'collections-module-defaultdict-pitfall',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A service builds `index = defaultdict(list)` mapping tags to post ids and returns it as JSON. Clients report lots of tags with empty lists that nobody ever used. What is happening?',
      code: { lang: 'python', code: py`from collections import defaultdict

def build_index(posts):
    index = defaultdict(list)
    for post in posts:
        for tag in post["tags"]:
            index[tag].append(post["id"])
    return index

def has_posts(index, tag):
    return len(index[tag]) > 0      # called for every searched tag` },
      answer: 'index[tag] on a missing key calls list() and stores the empty list, so every lookup of an unknown tag (via has_posts) adds an entry. Use tag in index or index.get(tag, []) for reads, and return dict(index) so callers get a normal dict.',
      explanation: py`\`defaultdict.__missing__\` inserts the default; only \`[]\` triggers it. Read-only helpers should use \`in\` / \`.get()\`. Converting to \`dict\` at the boundary removes the auto-insert behaviour entirely for consumers.`,
      whyAsked: 'A subtle, very common real-world bug — it grows memory and pollutes output without raising anything.',
      mistakes: ['Blaming JSON serialisation', 'Fixing it by deleting empty keys afterwards instead of not creating them', 'Not considering memory growth from arbitrary user-supplied tags'],
      followUps: ['Could this be a denial-of-service vector?', 'When is auto-insertion exactly what you want?'],
      modelAnswer: 'A defaultdict inserts a default value whenever you read a missing key with square brackets. has_posts does index[tag] for every searched tag, so each unknown tag creates an empty list that stays in the index and later shows up in the JSON. With user-supplied tags that also means unbounded memory growth. The fix is to read with membership or get — tag in index, or index.get(tag, []) — and to return dict(index) from build_index so callers get a plain dict without the auto-insert behaviour. Auto-insertion is great while building the index, not while querying it.',
    },
    {
      id: 'collections-module-deque-vs-list',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'When should you use a `deque` instead of a list? What are the complexity differences?',
      answer: 'Use a deque when you add or remove at both ends (queues, BFS, sliding windows). deque: O(1) append/appendleft/pop/popleft; indexing O(1) at the ends but O(n) toward the middle; no slicing. list: O(1) amortised append/pop at the end, O(n) insert/pop at the front, O(1) indexing anywhere, slicing supported.',
      explanation: py`A list is a contiguous array, so the front is expensive and random access is cheap. A deque is the opposite trade-off. \`maxlen\` adds a bounded-window behaviour lists don't have. Thread-safety: deque appends/pops are documented as thread-safe; for blocking producer/consumer use \`queue.Queue\`.`,
      code: { lang: 'python', code: py`from collections import deque

def bfs_order(graph, start):
    seen, queue, order = {start}, deque([start]), []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph.get(node, []):
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    return order

print(bfs_order({"a": ["b", "c"], "b": ["d"]}, "a"))   # ['a', 'b', 'c', 'd']` },
      whyAsked: 'Queue choice is a classic performance and correctness question, and BFS is a staple of coding interviews.',
      mistakes: ['Using list.pop(0) in BFS', 'Claiming deque indexing is O(1) everywhere', 'Forgetting deques do not support slicing'],
      followUps: ['How is deque implemented in CPython?', 'What does rotate do?', 'When would heapq be the right queue instead?'],
      modelAnswer: 'I use a deque whenever I need efficient operations at both ends — FIFO queues, breadth-first search, or a bounded sliding window with maxlen. Appending and popping at either end of a deque is constant time, whereas on a list inserting or popping at the front is linear because every element shifts. The trade-off is random access: a list indexes anywhere in constant time and supports slicing; a deque is fast only near the ends and has no slicing. For a priority queue I would use heapq instead, and for blocking producer-consumer code queue.Queue.',
    },
    {
      id: 'collections-module-lru-cache',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement an `LRUCache` class with a fixed `capacity`, `get(key, default=None)` and `put(key, value)`. Reading or writing a key makes it the most recently used; when a `put` exceeds the capacity, evict the **least** recently used key. Use `OrderedDict`.',
      answer: 'Keep an OrderedDict ordered from least to most recently used. get: if present, move_to_end(key) and return it. put: assign, move_to_end(key), then if len > capacity, popitem(last=False).',
      explanation: py`\`move_to_end\` and \`popitem(last=False)\` are O(1) on an \`OrderedDict\`, so both operations are O(1). The order of the dict *is* the recency order: front = least recent, end = most recent. For caching a pure function, \`functools.lru_cache\` already does this (see [functools](lesson:functools)).`,
      starter: { files: { 'main.py': py`from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()

    def get(self, key, default=None):
        # TODO: mark the key as most recently used
        return self.data.get(key, default)

    def put(self, key, value):
        # TODO: mark as most recent and evict the least recent when over capacity
        self.data[key] = value


cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
cache.get("a")          # a is now the most recent
cache.put("c", 3)       # evicts b
print(list(cache.data))
` } },
      tests: [
        { name: 'evicts the least recently used key', code: py`c = LRUCache(2)
c.put("a", 1); c.put("b", 2); c.put("c", 3)
assert c.get("a") is None and c.get("b") == 2 and c.get("c") == 3` },
        { name: 'get refreshes recency', code: py`c = LRUCache(2)
c.put("a", 1); c.put("b", 2)
c.get("a")
c.put("c", 3)
assert c.get("b") is None and c.get("a") == 1` },
        { name: 'updating a key refreshes it and keeps size', code: py`c = LRUCache(2)
c.put("a", 1); c.put("b", 2); c.put("a", 10); c.put("c", 3)
assert c.get("a") == 10 and c.get("b") is None and len(c.data) == 2` },
        { name: 'get on a missing key returns the default', code: py`c = LRUCache(1)
assert c.get("x", "miss") == "miss"` },
      ],
      solution: { files: { 'main.py': py`from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = OrderedDict()      # least recent first, most recent last

    def get(self, key, default=None):
        if key not in self.data:
            return default
        self.data.move_to_end(key)
        return self.data[key]

    def put(self, key, value):
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)


cache = LRUCache(2)
cache.put("a", 1)
cache.put("b", 2)
cache.get("a")          # a is now the most recent
cache.put("c", 3)       # evicts b
print(list(cache.data))
` } },
      hints: ['Treat the OrderedDict\'s order as "least recently used first".', 'move_to_end(key) marks a key as newest; popitem(last=False) removes the oldest.'],
      whyAsked: 'LRU caches are a classic design question combining data-structure choice, complexity and edge cases.',
      mistakes: ['Forgetting that get must update recency', 'Evicting before inserting and getting the size wrong on updates', 'Using a list to track order (O(n) updates)'],
      followUps: ['How would you make it thread-safe?', 'How does functools.lru_cache differ?', 'How would you add time-based expiry?'],
      modelAnswer: 'I keep an OrderedDict whose order is the recency order — oldest at the front, newest at the end. In get, if the key exists I call move_to_end so it becomes the most recent and return the value; otherwise I return the default. In put, I assign the value, move the key to the end, and if the size now exceeds the capacity I call popitem with last=False to evict the least recently used entry. Both operations are constant time because OrderedDict supports O(1) reordering. For memoising a pure function I would just use functools.lru_cache, and for concurrent use I would add a lock.',
    },
    {
      id: 'collections-module-records',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `collections.namedtuple`, `typing.NamedTuple` and `@dataclass` for representing a parsed log entry.',
      answer: 'namedtuple and typing.NamedTuple create the same thing — an immutable tuple subclass with named fields (NamedTuple adds type annotations and class syntax). A dataclass is a regular class: mutable by default (frozen=True optional), not a tuple, supports defaults, methods, validation in __post_init__ and more flexible equality/ordering options.',
      explanation: py`Named tuples are lightweight, unpackable, hashable when their fields are, and serialise like tuples (JSON writes a list). Dataclasses are better for richer domain objects. For a parsed log line that never changes, a \`NamedTuple\` is a great fit; if you'd add behaviour or validation, use a dataclass. Details in [lightweight records](lesson:records-and-slots).`,
      code: { lang: 'python', code: py`from typing import NamedTuple

class Hit(NamedTuple):
    path: str
    status: int = 200

h = Hit("/home")
path, status = h        # still a tuple
print(h, h.status)      # Hit(path='/home', status=200) 200` },
      whyAsked: 'Choosing a record type is a frequent design decision; it shows awareness of immutability, typing and serialisation trade-offs.',
      mistakes: ['Saying NamedTuple and namedtuple are different kinds of objects', 'Claiming dataclasses are immutable by default', 'Forgetting that named tuples compare equal to plain tuples with the same values'],
      followUps: ['Why might tuple equality be a problem? (Hit("/a", 200) == ("/a", 200) is True)', 'When would you add __slots__ to a dataclass?'],
      modelAnswer: 'collections.namedtuple and typing.NamedTuple produce the same kind of object: an immutable tuple subclass whose positions have names. NamedTuple is the class-based spelling with type annotations and defaults, so I prefer it in typed code. A dataclass is an ordinary class — mutable unless frozen, not a tuple, and it supports methods, validation in __post_init__, and options for ordering and slots. For a parsed log entry that never changes and that I may unpack, a NamedTuple is ideal; for a domain object with behaviour I would choose a dataclass. One gotcha with named tuples is that they compare equal to plain tuples with the same values.',
    },
    {
      id: 'collections-module-chainmap-config',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A CLI tool reads settings from command-line flags, environment variables and a defaults dict, in that priority order. How would `ChainMap` help, and what are its pitfalls compared with `defaults | env | cli`?',
      answer: 'ChainMap(cli, env, defaults) gives one live mapping that looks up each key in priority order without copying. Pitfalls: writes and deletes only affect the first mapping, lookups cost one probe per layer, len/iteration de-duplicate across layers, and nested dicts are not merged. The | merge builds a snapshot instead (right side wins, so the order is reversed: defaults | env | cli).',
      explanation: py`ChainMap is ideal when layers can change later and you want lookups to see the change (or for scopes, via \`new_child()\`). A merged copy is simpler to pass around and serialise, and lookups hit a single dict. Neither performs a deep merge of nested sections.`,
      code: { lang: 'python', code: py`from collections import ChainMap

defaults = {"verbose": False, "color": "auto", "retries": 3}
env = {"color": "never"}
cli = {"verbose": True}
settings = ChainMap(cli, env, defaults)
print(settings["verbose"], settings["color"], settings["retries"])  # True never 3

snapshot = defaults | env | cli          # note the reversed order: right side wins
print(snapshot == dict(settings))        # True` },
      whyAsked: 'Configuration layering is common in tooling; the question probes understanding of views vs copies and precedence rules.',
      mistakes: ['Getting the precedence order of | backwards', 'Expecting writes to reach the layer where a key lives', 'Assuming nested sections merge'],
      followUps: ['How would new_child() model nested scopes?', 'How would you validate the final settings?', 'How would argparse defaults interact with this?'],
      modelAnswer: 'I would build ChainMap(cli, env, defaults): a single mapping that looks each key up in the CLI flags first, then the environment, then the defaults, without copying anything — and because it is a live view, later changes to any layer are visible. The pitfalls are that writes and deletes only touch the first mapping, every lookup may probe several dicts, and nested sections aren\'t merged. The alternative, defaults | env | cli, builds a snapshot where the right-hand side wins, so the order is reversed; it is simpler to serialise and pass around. I would choose ChainMap for scopes or live layering and a merged dict for a one-off resolved config, validating the result either way.',
    },
  ],

  takeaways: [
    'collections offers specialised containers; each replaces a common plain-dict or plain-list pattern.',
    'Counter counts anything iterable, reads missing items as 0, ranks with most_common(n), and does multiset maths (- drops non-positive counts; subtract() keeps them).',
    'defaultdict(factory) builds a value for missing keys on d[key] — and stores it; read with in/get() and return dict(d).',
    'deque gives O(1) appends and pops at both ends; maxlen turns it into a sliding window of the newest N items; it has no slicing.',
    'namedtuple / typing.NamedTuple add field names to immutable tuples; use _replace for changes, a dataclass for richer records.',
    'OrderedDict still matters for move_to_end, popitem(last=False) and order-sensitive equality (LRU caches).',
    'ChainMap is a live, layered view over several dicts: lookups search in order, writes go to the first mapping.',
  ],
}
