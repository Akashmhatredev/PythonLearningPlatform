// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TRIP = py`# Trip planner: tuples as small, fixed records
home = (51.5072, -0.1276)            # (latitude, longitude)
lat, lon = home                      # unpacking
print(f"Home is at {lat}, {lon}")

stops = [("Cafe", 2.5), ("Library", 1.2), ("Park", 3.8)]
for name, km in stops:               # unpack each pair in the loop
    print(f"{name:<8}{km} km")


def nearest_and_farthest(trips):
    distances = []
    for _, km in trips:              # _ means "I don't need this part"
        distances.append(km)
    return min(distances), max(distances)    # two values -> one tuple


nearest, farthest = nearest_and_farthest(stops)
print("Nearest:", nearest, "| Farthest:", farthest)

first, *others = stops               # star-unpacking
print("First stop:", first[0], "| then", len(others), "more")

visited = {home: "Home", (48.8566, 2.3522): "Paris"}   # tuple keys
print(visited[(48.8566, 2.3522)])
`

export default {
  id: 'tuples-and-unpacking',
  title: 'Tuples & unpacking',
  summary: 'A tuple is an immutable sequence made by commas; unpacking spreads any iterable across several names — including first, *rest — which is how Python swaps values and returns several results at once.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['lists'],
  related: ['lists', 'list-operations', 'dictionaries', 'mutability-and-copying', 'collections-module', 'records-and-slots', 'function-arguments'],
  tags: ['tuple', 'tuples', 'immutable', 'unpacking', 'packing', 'star unpacking', 'starred assignment', 'swap', 'multiple return values', 'one-element tuple', 'trailing comma', 'hashable', 'dict key', 'namedtuple', 'enumerate', 'zip'],
  apis: [
    { name: '(a, b) / a, b', summary: 'A tuple literal — the commas make the tuple; parentheses only group.' },
    { name: '(x,)', summary: 'A one-element tuple: the trailing comma is required.' },
    { name: 'tuple(iterable)', summary: 'Builds a tuple from any iterable: tuple("ab") → (\'a\', \'b\').' },
    { name: 'a, b = iterable', summary: 'Unpacking: binds each name to one item; the counts must match.' },
    { name: 'first, *rest = iterable', summary: 'Starred unpacking: the starred name collects the leftover items into a list.' },
    { name: 'tuple.count(x) / tuple.index(x)', summary: 'The only two tuple methods: count matches / position of the first match.' },
    { name: 'collections.namedtuple', summary: 'A tuple subclass whose positions also have names: p.x, p.y.' },
  ],
  docs: [
    { label: 'Tutorial — tuples and sequences', url: 'https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences' },
    { label: 'Library reference — tuples', url: 'https://docs.python.org/3/library/stdtypes.html#tuples' },
    { label: 'Language reference — assignment statements (unpacking)', url: 'https://docs.python.org/3/reference/simple_stmts.html#assignment-statements' },
    { label: 'PEP 3132 — extended iterable unpacking', url: 'https://peps.python.org/pep-3132/' },
    { label: 'collections.namedtuple', url: 'https://docs.python.org/3/library/collections.html#collections.namedtuple' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **tuple** is an ordered sequence, like a [list](lesson:lists), that **can't be changed** once it is made. You write one with commas, usually wrapped in parentheses: \`home = (51.5072, -0.1276)\`.`,
    py`Tuples are perfect for small, fixed bundles of values that belong together: a coordinate \`(x, y)\`, an RGB colour \`(255, 128, 0)\`, a \`(name, score)\` pair. The position of each value *means* something — index 0 is latitude, index 1 is longitude.`,
    py`Hand in hand with tuples comes **unpacking**: \`lat, lon = home\` takes the tuple apart and binds each piece to its own name in one step. Unpacking works with any sequence, it powers the classic swap \`a, b = b, a\`, and it is how functions "return several values".`,
  ],
  why: [
    py`Some data shouldn't change. A birthday, a GPS fix, the dimensions of a screen — if code somewhere accidentally modified them, that would be a bug. Making them tuples turns the accident into an immediate \`TypeError\` instead of silently wrong data.`,
    py`Immutability also buys something practical: tuples (of immutable things) can be **dictionary keys** and **set members**, which lists can't. \`{(0, 0): "start", (3, 4): "treasure"}\` is a perfectly natural map of a grid.`,
    py`And unpacking makes code read like plain English: \`for name, score in results:\` says exactly what each part is, instead of \`result[0]\` and \`result[1]\` everywhere.`,
  ],
  eli15: [
    py`A list is a whiteboard: you can rub things out and write new ones. A tuple is a **printed ticket**: "Seat 14, Row F, 7:30 pm". Once it's printed, it's fixed. If the time changes, you get a *new* ticket.`,
    py`**Unpacking** is reading the ticket aloud into separate slots in your head: "seat = 14, row = F, time = 7:30". One line of code — \`seat, row, time = ticket\` — and each piece has its own name.`,
    py`The surprise: Python spots tuples by their **commas**, not their brackets. \`3, 4\` is already a tuple.`,
  ],
  analogy: {
    title: 'A printed concert ticket',
    body: [
      py`A ticket bundles a few facts in fixed positions: venue, date, seat. You don't edit a ticket with a pen — if something changes, a new ticket is issued. You can photocopy it, compare two tickets, and use it as a claim number at the cloakroom (a *key*).`,
      py`When you arrive, the usher reads the ticket into separate pieces — "you're in row F, seat 14" — that's unpacking. If the usher expects three pieces and the ticket has two, something is wrong, and Python complains in exactly the same way.`,
    ],
    mapping: [
      ['the printed ticket', 'a tuple: ("Arena", "F", 14)'],
      ['fixed positions on the ticket', 'indexes with a fixed meaning: ticket[1] is the row'],
      ['no editing — a new ticket is issued', 'immutability: build a new tuple instead of changing one'],
      ['reading it out into separate facts', 'unpacking: venue, row, seat = ticket'],
      ['using the ticket number at the cloakroom', 'tuples as dictionary keys'],
      ['"and the rest are guests"', 'star-unpacking: main, *guests = names'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Packing, unpacking and returning several values',
    props: {
      code: py`point = 3, 4
x, y = point
print(x, y)


def min_max(values):
    return min(values), max(values)


low, high = min_max([7, 2, 9])
first, *rest = [10, 20, 30, 40]
print(low, high, first, rest)

a, b = 1, 2
a, b = b, a
record = ("Ada", [90, 85])
record[1].append(77)
print(a, b, record)
`,
      notes: {
        1: 'No brackets needed: the **comma** packs `3, 4` into a tuple.',
        2: 'Unpacking: the tuple has exactly two items, so each name gets one.',
        7: '`return min(...), max(...)` returns **one** tuple holding two values.',
        10: 'The returned tuple is unpacked straight into `low` and `high`.',
        11: 'The starred name collects everything left over into a **new list**.',
        15: 'The right side is evaluated first (2, 1), then assigned: a swap with no temporary variable.',
        17: 'The tuple can\'t change which objects it holds — but the list inside it is mutable and can grow.',
      },
    },
    alt: 'A step-by-step trace. point is bound to a tuple (3, 4) and unpacked into x and y. Calling min_max returns a tuple (2, 9) that is unpacked into low and high. first gets 10 and rest gets a new list [20, 30, 40]. a and b are swapped from 1, 2 to 2, 1. record is a tuple holding the string Ada and a list; appending 77 to the inner list changes the list while the tuple still refers to the same two objects.',
    caption: py`Watch the arrows on line 17: the tuple's two slots keep pointing at the **same** objects. The list at the end of one arrow changes — the tuple doesn't.`,
  },
  syntax: [
    py`#### Making tuples`,
    { code: py`point = (3, 4)            # the usual way
point = 3, 4              # same thing: the comma makes the tuple
empty = ()                # the only tuple that needs just brackets
solo = ("Museum",)        # ONE item: the trailing comma is essential
not_a_tuple = ("Museum")  # just a string in brackets!
letters = tuple("abc")    # ('a', 'b', 'c') — from any iterable
nested = ((0, 0), (3, 4)) # tuples inside tuples`, lang: 'python', title: 'tuple literals' },
    py`Parentheses are needed only when the commas would mean something else — inside a function call (\`print((1, 2))\` prints one tuple; \`print(1, 2)\` prints two numbers), or to make an empty tuple.`,
    py`#### Reading tuples`,
    py`Everything that *reads* a list works on a tuple: indexing, negative indexes, slicing (which returns a new tuple), \`len()\`, \`in\`, \`for\` loops, \`+\` and \`*\` (which build new tuples), \`min\`/\`max\`/\`sum\`/\`sorted\`. Tuples have just two methods: \`count(x)\` and \`index(x)\`.`,
    { code: py`rgb = (255, 128, 0)
rgb[0]           # 255
rgb[-1]          # 0
rgb[:2]          # (255, 128)  — a new tuple
len(rgb)         # 3
128 in rgb       # True
rgb + (64,)      # (255, 128, 0, 64) — a NEW tuple; rgb is unchanged`, lang: 'python', title: 'tuples are read-only sequences' },
    py`Anything that would *change* a tuple raises an error: \`rgb[0] = 200\` → \`TypeError: 'tuple' object does not support item assignment\`. There is no \`append\`, \`remove\` or \`sort\` method.`,
    py`#### Unpacking`,
    { code: py`lat, lon = (51.5072, -0.1276)        # tuple → two names
first, second = ["gold", "silver"]   # works with ANY iterable…
a, b, c = "xyz"                      # …even a string
name, (x, y) = ("Home", (3, 4))      # nested unpacking mirrors the shape
a, b = b, a                          # swap
minutes, seconds = divmod(200, 60)   # 3, 20 — divmod returns a tuple

for index, song in enumerate(["Intro", "Sunrise"], start=1):
    print(index, song)               # enumerate yields (index, item) tuples`, lang: 'python', title: 'one assignment, several names' },
    py`The number of names on the left must match the number of items on the right — otherwise you get \`ValueError: too many values to unpack\` or \`not enough values to unpack\`.`,
    py`#### Star-unpacking: "and the rest"`,
    { code: py`first, *rest = [10, 20, 30, 40]     # 10, [20, 30, 40]
*init, last = [10, 20, 30, 40]      # [10, 20, 30], 40
head, *middle, tail = "python"      # 'p', ['y', 't', 'h', 'o'], 'n'
only, *nothing = [1]                # 1, []  — the star can collect zero items
name, *scores = "Ada,90,85".split(",")   # 'Ada', ['90', '85']`, lang: 'python', title: 'one starred name per assignment' },
    py`The starred name always gets a **list**, even when the right side is a tuple or a string, and even when it collects nothing. Only one starred name is allowed per assignment (\`*a, *b = …\` is a \`SyntaxError\`). For \`*\` and \`**\` in function calls and definitions, see [function arguments](lesson:function-arguments).`,
    py`#### Returning several values`,
    { code: py`def min_max(values):
    return min(values), max(values)   # packs a tuple

low, high = min_max([7, 2, 9])        # unpack it immediately
result = min_max([7, 2, 9])           # or keep the tuple: (2, 9)`, lang: 'python', title: 'a function returns one tuple' },
    py`A function always returns **one** object. \`return a, b\` returns one tuple that the caller can unpack — it *feels* like several return values. The \`_\` name is the convention for "I don't need this part": \`_, high = min_max(data)\`.`,
    py`#### Tuples as dictionary keys`,
    { code: py`treasure_map = {(0, 0): "start", (3, 4): "treasure"}
print(treasure_map[(3, 4)])        # treasure
print((5, 5) in treasure_map)      # False`, lang: 'python', title: 'coordinates make great keys' },
    py`Keys must be **hashable** (roughly: unchangeable, so their hash code never changes — see [dictionaries](lesson:dictionaries)). A tuple is hashable only if **everything inside it** is hashable: \`(1, 2)\` works, \`([1], 2)\` doesn't.`,
    py`#### A teaser: named tuples`,
    { code: py`from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print(p)           # Point(x=3, y=4)
print(p.x, p[1])   # 3 4 — by name or by position
x, y = p           # still unpacks like a tuple`, lang: 'python', title: 'positions with names' },
    py`When a tuple grows past two or three fields, \`t[3]\` stops meaning anything to a reader. Named tuples keep all the tuple behaviour but add field names. More in [the collections module](lesson:collections-module) and [lightweight records](lesson:records-and-slots).`,
  ],
  walkthrough: {
    title: 'Reading the trip planner line by line',
    lang: 'python',
    code: TRIP,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 4], text: py`\`home\` is a 2-tuple of floats. \`lat, lon = home\` unpacks it: the first item goes to \`lat\`, the second to \`lon\`.` },
      { lines: [6, 8], text: py`\`stops\` is a list of \`(name, km)\` tuples — the classic "list of records" shape. \`for name, km in stops:\` unpacks each tuple as the loop reaches it, so the body reads naturally.` },
      { lines: [11, 15], text: py`Inside the function, \`_\` receives the stop name we don't need. The \`return\` line packs \`min(...)\` and \`max(...)\` into one tuple.` },
      { lines: [18, 19], text: py`The caller unpacks the returned tuple straight into \`nearest\` and \`farthest\`.` },
      { lines: [21, 22], text: py`Star-unpacking: \`first\` gets the first stop (a tuple), and \`others\` collects the remaining two into a **list**.` },
      { lines: [24, 25], text: py`Coordinates make natural dictionary keys because tuples of numbers are hashable. Looking up \`(48.8566, 2.3522)\` finds "Paris".` },
    ],
  },
  playground: {
    title: 'Trip planner',
    objective: 'Run it, then add stops, move home and unpack the list in new ways.',
    files: { 'main.py': TRIP },
    expected: py`\`\`\`text
Home is at 51.5072, -0.1276
Cafe    2.5 km
Library 1.2 km
Park    3.8 km
Nearest: 1.2 | Farthest: 3.8
First stop: Cafe | then 2 more
Paris
\`\`\``,
    experiments: [
      {
        id: 'add-museum',
        task: py`Add a fourth stop, \`("Museum", 0.8)\`, to the \`stops\` list. Predict the **Nearest** and **First stop** lines before you run.`,
        hint: py`Add it inside the square brackets on line 6, after \`("Park", 3.8)\`.`,
        tests: [
          { name: 'there are four stops', code: py`assert len(stops) == 4 and ("Museum", 0.8) in stops` },
          { name: 'the museum is the nearest', code: py`assert "Nearest: 0.8" in output` },
        ],
        explain: py`The list grew, so the loop prints four lines, \`min\` finds 0.8, and \`*others\` now collects three stops. Lists are the flexible outer container; tuples are the fixed records inside.`,
      },
      {
        id: 'move-home',
        task: py`First try adding \`home[0] = 53.4808\` after line 2 and read the error. Then remove that line and **re-bind** \`home\` to a new tuple instead: \`(53.4808, -2.2426)\`.`,
        hint: py`Tuples can't be edited, but the name \`home\` can be pointed at a different tuple: change line 2.`,
        tests: [{ name: 'home is the new tuple', code: py`assert "Home is at 53.4808, -2.2426" in output` }],
        explain: py`\`home[0] = …\` raises \`TypeError: 'tuple' object does not support item assignment\`. Re-binding the *name* to a brand-new tuple is fine — the old tuple was never modified. Notice \`visited\` uses \`home\` as a key, so it now holds the new coordinates.`,
      },
      {
        id: 'last-stop',
        task: py`Add a line that uses **star-unpacking** to get the last stop, then print \`Last stop: \` followed by its name.`,
        hint: py`\`*before, last = stops\` — then \`print("Last stop:", last[0])\`.`,
        tests: [{ name: 'prints the last stop', code: py`assert f"Last stop: {stops[-1][0]}" in output` }],
        explain: py`The starred name can go anywhere: \`*before, last\` puts all but the last item into \`before\`. Here \`stops[-1]\` would be just as clear — star-unpacking shines when you need both parts.`,
      },
      {
        id: 'rome',
        task: py`Add Rome to \`visited\` using the tuple key \`(41.9028, 12.4964)\`, then print the value stored under that key as the last line.`,
        hint: py`\`visited[(41.9028, 12.4964)] = "Rome"\`, then print \`visited[(41.9028, 12.4964)]\`.`,
        tests: [
          { name: 'Rome is stored under its coordinates', code: py`assert visited.get((41.9028, 12.4964)) == "Rome"` },
          { name: 'last line is Rome', code: py`assert output.strip().splitlines()[-1] == "Rome"` },
        ],
        explain: py`A tuple of floats is hashable, so it works as a key. Try a *list* key — \`visited[[1, 2]] = "x"\` — and Python refuses because lists can change.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How first, *middle, last = [10, 20, 30, 40, 50] is matched',
    props: {
      width: 760,
      height: 280,
      nodes: [
        { id: 'first', label: 'first', note: 'plain name', x: 120, y: 60, tone: 'yellow' },
        { id: 'middle', label: '*middle', note: 'starred: collects a list', x: 380, y: 60, tone: 'blue' },
        { id: 'last', label: 'last', note: 'plain name', x: 640, y: 60, tone: 'yellow' },
        { id: 'v10', label: '10', x: 110, y: 220 },
        { id: 'v20', label: '20', x: 245, y: 220 },
        { id: 'v30', label: '30', x: 380, y: 220 },
        { id: 'v40', label: '40', x: 515, y: 220 },
        { id: 'v50', label: '50', x: 650, y: 220 },
      ],
      edges: [
        { from: 'first', to: 'v10' },
        { from: 'middle', to: 'v20' },
        { from: 'middle', to: 'v30' },
        { from: 'middle', to: 'v40' },
        { from: 'last', to: 'v50' },
      ],
      steps: [
        { focus: ['v10', 'v20', 'v30', 'v40', 'v50'], text: py`First, Python evaluates the **right-hand side** completely and gets five items. Nothing on the left has been touched yet.` },
        { focus: ['first', 'last', 'v10', 'v50'], edges: ['first->v10', 'last->v50'], text: py`The **plain** names are matched from the two ends: \`first\` takes the first item, \`last\` takes the last one.` },
        { focus: ['middle', 'v20', 'v30', 'v40'], edges: ['middle->v20', 'middle->v30', 'middle->v40'], text: py`The **starred** name takes whatever is left in the middle and stores it in a brand-new **list**: \`middle == [20, 30, 40]\`. With only two items on the right, \`middle\` would be \`[]\`.` },
        { focus: ['first', 'middle', 'last'], text: py`Rules: at most **one** starred name per assignment, and there must be at least as many items as plain names. \`first, *middle, last = [1]\` raises \`ValueError: not enough values to unpack (expected at least 2, got 1)\`.` },
      ],
    },
    alt: 'Three names on top — first, *middle and last — and five values below: 10, 20, 30, 40, 50. Arrows show first matched to 10, last matched to 50, and *middle collecting 20, 30 and 40 into a new list.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A tuple is a list that has been "sealed". You can read it as much as you like, but every operation that *seems* to change it — \`+\`, slicing, sorting with \`sorted()\` — actually builds a **new** tuple (or list) and leaves the original alone.`,
      py`The thing that makes a tuple is the **comma**. Brackets only group, exactly as in maths: \`(2 + 3) * 4\`. That's why \`("Museum")\` is a string and \`("Museum",)\` is a tuple.`,
      py`Unpacking is the reverse of packing: \`point = 3, 4\` *packs* two values into a tuple, \`x, y = point\` *unpacks* them again.`,
    ],
    technical: [
      py`**Immutability is shallow.** A tuple's slots can never be re-pointed at different objects, but if a slot points at a mutable object (a list, a dict), *that object* can still change. So \`("Ada", [90, 85])\` is an immutable tuple containing a mutable list — and it is **not hashable**, because its value could change. More in [mutability & copying](lesson:mutability-and-copying).`,
      py`**Unpacking order.** In \`targets = expression\`, the right side is evaluated completely first, then the targets are assigned **left to right**. That's what makes swaps safe — and what makes this puzzle work:`,
      { code: py`items = ["a", "b"]
i = 0
i, items[i] = 1, "x"     # i is assigned first, so items[1] is changed
print(i, items)          # 1 ['a', 'x']`, lang: 'python', title: 'targets are assigned left to right' },
      py`Tuples compare **lexicographically**, item by item: \`(1, 2) < (1, 3)\` and \`(2,) > (1, 99)\`. That's what makes them ideal sort keys: \`key=lambda s: (-s["score"], s["name"])\` (see [list operations](lesson:list-operations)).`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores a tuple's item pointers in the same memory block as the tuple header, so a tuple is a little smaller than a list with the same items (a list needs a separate, resizable array). CPython also shares a single empty tuple, recycles freed small tuples, builds constant tuples like \`(1, 2, 3)\` once at compile time, and compiles \`a, b = b, a\` to a \`SWAP\` instruction without creating a tuple at all. None of this is guaranteed by the language — don't rely on \`() is ()\` or on exact sizes.` },
    ],
    production: [
      py`Use a tuple for a **fixed-shape record** whose positions have meaning (a 2-D point, a \`(status, body)\` pair) and a list for a **variable-length collection of the same kind of thing**. Type hints say it precisely: \`tuple[float, float]\` is exactly two floats, \`tuple[int, ...]\` is any number of ints, \`list[str]\` is a list of strings.`,
      py`Returning a bare tuple is fine for two or three values that callers immediately unpack (\`low, high = min_max(data)\`). Beyond that, callers start writing \`result[3]\` and the code rots — switch to a \`NamedTuple\` or a [dataclass](lesson:dataclasses).`,
      py`Tuples make good **constants** and **default values**: \`ALLOWED_TYPES = ("png", "jpg")\` can't be accidentally appended to by another module, and a tuple default argument doesn't suffer from the mutable-default trap described in [function arguments](lesson:function-arguments).`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting the comma in a one-element tuple',
      wrong: { code: py`sizes = ("large")
print(type(sizes))      # <class 'str'>
for s in sizes:
    print(s)            # l, a, r, g, e — one letter per line`, lang: 'python' },
      right: { code: py`sizes = ("large",)
print(type(sizes))      # <class 'tuple'>`, lang: 'python' },
      explanation: py`Parentheses only group; the comma makes the tuple. Without it you have a plain string, and looping over a string gives its characters.`,
    },
    {
      title: 'An accidental trailing comma',
      wrong: { code: py`price, qty = 2.5, 4
total = price * qty,
print(total + 1)        # TypeError: can only concatenate tuple (not "int") to tuple`, lang: 'python', static: true },
      right: { code: py`price, qty = 2.5, 4
total = price * qty
print(total + 1)        # 11.0`, lang: 'python' },
      explanation: py`A stray comma at the end of a line silently turns the value into a one-element tuple. The error appears later, far from the cause. If a number unexpectedly prints as \`(10.0,)\`, look for a trailing comma.`,
    },
    {
      title: 'Trying to change a tuple in place',
      wrong: { code: py`screen = (1920, 1080)
screen[0] = 2560        # TypeError: 'tuple' object does not support item assignment`, lang: 'python', static: true },
      right: { code: py`screen = (1920, 1080)
screen = (2560, screen[1])     # build a new tuple and re-bind the name
print(screen)                  # (2560, 1080)`, lang: 'python' },
      explanation: py`Tuples can't be modified, but the *name* can be bound to a new tuple. If you find yourself doing this a lot, the data probably wants to be a list (or a dataclass).`,
    },
    {
      title: 'Unpacking a dict without .items()',
      wrong: { code: py`scores = {"Ada": 90, "Ben": 85}
for name, score in scores:      # ValueError: too many values to unpack (expected 2)
    print(name, score)`, lang: 'python', static: true },
      right: { code: py`scores = {"Ada": 90, "Ben": 85}
for name, score in scores.items():
    print(name, score)`, lang: 'python' },
      explanation: py`Looping over a dict gives its **keys** only. Python then tries to unpack the string \`"Ada"\` into two names — three letters, two names. \`.items()\` yields \`(key, value)\` tuples (see [dictionaries](lesson:dictionaries)).`,
    },
    {
      title: 'Expecting a tuple to protect what is inside it',
      wrong: { code: py`DEFAULT_TAGS = ("news", ["sport", "weather"])
DEFAULT_TAGS[1].append("politics")   # allowed!
print(DEFAULT_TAGS)`, lang: 'python' },
      right: { code: py`DEFAULT_TAGS = ("news", ("sport", "weather"))   # immutable all the way down
print(DEFAULT_TAGS)`, lang: 'python' },
      explanation: py`A tuple only freezes *which* objects it holds. A list inside it is still a list. For truly fixed data, make the inner containers immutable too (tuples, \`frozenset\`).`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: too many values to unpack (expected 2, got 3)`,
      cause: py`More items on the right than names on the left — e.g. a CSV row with an extra column, or a tuple that grew a field. (Some iterables, like strings, don't report the "got" count.)`,
      fix: py`Print the value you're unpacking. Add a name, use \`_\` for parts you don't need, or collect extras with a starred name: \`name, score, *extra = row\`.`,
    },
    {
      symptom: py`ValueError: not enough values to unpack (expected 3, got 2)`,
      cause: py`Fewer items than names — a short line in a file, an empty field after \`split()\`, or the wrong variable.`,
      fix: py`Check the data's length before unpacking, or validate rows and skip/flag bad ones.`,
    },
    {
      symptom: py`TypeError: cannot unpack non-iterable NoneType object`,
      cause: py`You unpacked the result of a function that returned \`None\` — usually a function with a code path that has no \`return\`.`,
      fix: py`Make every path return a tuple of the right size (or raise an error), and check what the function returns with \`print(repr(result))\`.`,
    },
    {
      symptom: py`TypeError: 'tuple' object does not support item assignment`,
      cause: py`Code tried \`t[i] = …\` on a tuple — sometimes on data you thought was a list (e.g. a row returned by a database driver or by \`zip\`).`,
      fix: py`Build a new tuple, or convert: \`row = list(row)\`, edit, and convert back if needed.`,
    },
    {
      symptom: py`TypeError: cannot use 'tuple' as a dict key (unhashable type: 'list')`,
      cause: py`The tuple key contains a list (or dict, or set). Python 3.14 words it this way; older versions say \`TypeError: unhashable type: 'list'\`.`,
      fix: py`Convert the inner parts to immutable equivalents: \`tuple(the_list)\` or \`frozenset(the_set)\`.`,
    },
  ],
  bestPractices: [
    'Use tuples for small fixed records (positions have meaning) and lists for collections of similar items.',
    'Always write the trailing comma for one-element tuples: ("Museum",).',
    'Unpack with meaningful names instead of indexing: for name, score in results.',
    'Use _ for values you deliberately ignore, and *rest to collect leftovers.',
    'Return a tuple for two or three closely related values; switch to a NamedTuple or dataclass beyond that.',
    'Use tuples of immutable values for constants and dictionary keys.',
  ],
  useCases: [
    'Coordinates, RGB colours, (width, height) sizes and other fixed-shape values.',
    'Returning several results from one function: return low, high.',
    'Swapping or rotating values without a temporary variable.',
    'Dictionary keys made of several parts: {(row, col): piece} or {(year, month): total}.',
    'Splitting a line into a head and the rest: command, *args = line.split().',
    'Iterating pairs from enumerate(), zip() and dict.items().',
  ],
  whenToUse: {
    use: [
      'The number of items is fixed and each position means something specific.',
      'The data shouldn\'t change after it is created (constants, configuration).',
      'You need a composite dictionary key or set member.',
      'A function returns two or three related values.',
    ],
    avoid: [
      'The collection grows or shrinks — use a list.',
      'There are many fields that readers must remember by position — use a namedtuple or dataclass.',
      'You need to look things up by name — use a dict.',
    ],
  },
  comparison: {
    title: 'tuple vs list',
    headers: ['', 'tuple', 'list'],
    rows: [
      ['literal', '(1, 2) or 1, 2 — and (1,) for one item', '[1, 2]'],
      ['changeable?', 'no — every "change" builds a new tuple', 'yes — append, insert, remove, sort…'],
      ['methods', 'count, index', 'count, index plus 9 mutating methods'],
      ['usable as a dict key / set member', 'yes, if every item is hashable', 'never'],
      ['typical meaning', 'one record of different fields', 'many items of the same kind'],
      ['type hint', 'tuple[str, int] (fixed) or tuple[int, ...]', 'list[int]'],
    ],
    note: py`Unpacking works with both — and with any other iterable, including strings, ranges, dicts and generators.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'tuples-and-unpacking-q1',
      type: 'mcq',
      prompt: 'Which of these is a tuple containing exactly one item, the string `"solo"`?',
      options: [
        { text: '("solo")', why: 'The parentheses only group the expression — this is just the string "solo".' },
        '("solo",)',
        { text: 'tuple("solo")', why: 'tuple() loops over its argument, and a string yields characters: (\'s\', \'o\', \'l\', \'o\').' },
        { text: '["solo"]', why: 'Square brackets make a list, not a tuple.' },
      ],
      answer: 1,
      explanation: py`The comma makes a tuple. A one-element tuple therefore needs a trailing comma: \`("solo",)\` — or even \`"solo",\` without brackets.`,
    },
    {
      id: 'tuples-and-unpacking-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`first, *rest = "abc"
print(first, rest)`,
      answer: "a ['b', 'c']",
      explanation: py`Unpacking works on any iterable, including strings. \`first\` gets \`"a"\` and the starred name collects the remaining characters into a **list**, even though the source was a string.`,
    },
    {
      id: 'tuples-and-unpacking-q3',
      type: 'output',
      prompt: 'What happens when this runs?',
      code: py`point = (3, 4)
x, y, z = point
print(x, y, z)`,
      options: [
        { text: '3 4 None', why: 'Python never fills missing values with None — a mismatch is an error.' },
        'ValueError: not enough values to unpack (expected 3, got 2)',
        { text: '3 4 0', why: 'There is no default; unpacking requires an exact match unless you use a starred name.' },
        { text: 'TypeError: \'tuple\' object is not callable', why: 'Nothing is being called here. The problem is the number of names.' },
      ],
      answer: 1,
      explanation: py`Three names but only two values. Unpacking must match exactly (unless one target is starred), so Python raises \`ValueError\` before binding any name.`,
    },
    {
      id: 'tuples-and-unpacking-q4',
      type: 'bug',
      prompt: 'This crashes. Click the line that causes the error.',
      code: py`settings = ("dark", 14, "en")
settings[1] = 16
theme, size, lang = settings
print(theme, size, lang)`,
      answerLine: 2,
      explanation: py`Tuples are immutable: \`TypeError: 'tuple' object does not support item assignment\`. Build a new tuple instead — \`settings = (settings[0], 16, settings[2])\` — or use a list or dict if settings change often.`,
    },
    {
      id: 'tuples-and-unpacking-q5',
      type: 'fill',
      prompt: 'Complete the function so it returns the smallest and largest value, and the program prints `2 9`.',
      code: py`def min_max(values):
    return ___(values), ___(values)

low, high = min_max([7, 2, 9])
print(low, high)`,
      answer: [['min'], ['max']],
      explanation: py`\`return min(values), max(values)\` packs both results into one tuple; \`low, high = …\` unpacks it.`,
    },
    {
      id: 'tuples-and-unpacking-q6',
      type: 'mcq',
      prompt: 'Select **all** values that can be used as a dictionary key.',
      options: [
        '(1, 2)',
        { text: '([1], 2)', why: 'The tuple contains a list, and lists are unhashable — so the whole tuple is unhashable.' },
        { text: '[1, 2]', why: 'Lists are mutable and therefore unhashable; they can never be dict keys.' },
        '("a", (1, 2))',
      ],
      answer: [0, 3],
      explanation: py`A tuple is hashable when **every** item inside it is hashable. Numbers, strings and tuples of those are fine; a list anywhere inside spoils it.`,
    },
    {
      id: 'tuples-and-unpacking-q7',
      type: 'short',
      prompt: 'You are storing a GPS position and a list of visited places. Which would you make a tuple and which a list — and why?',
      answer: py`The GPS position should be a tuple: it has a fixed shape (latitude, longitude), each position means something specific, it shouldn't be changed accidentally, and as a tuple it can be a dict key or set member. The visited places should be a list: it grows as you travel, all items are the same kind of thing, and you'll append to it.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'score-stats',
      title: 'Low, high and average',
      difficulty: 'beginner',
      prompt: py`Write \`stats(scores)\` that **returns a tuple** \`(lowest, highest, average)\` for a non-empty list of numbers.

- \`stats([60, 95, 85])\` → \`(60, 95, 80.0)\`

The program then **unpacks** the result into three names and must print exactly:

\`\`\`text
Low: 60 | High: 95 | Average: 80.0
\`\`\``,
      files: {
        'main.py': py`def stats(scores):
    # TODO: return (lowest, highest, average) as one tuple
    return 0, 0, 0


low, high, average = stats([60, 95, 85])
print(f"Low: {low} | High: {high} | Average: {average}")
`,
      },
      hints: [
        'min(), max(), sum() and len() do all the work.',
        'return a, b, c packs three values into one tuple — no brackets required.',
        'return min(scores), max(scores), sum(scores) / len(scores)',
      ],
      solution: {
        explanation: py`\`return min(scores), max(scores), sum(scores) / len(scores)\` packs three values into **one** tuple. The caller's \`low, high, average = stats(...)\` unpacks it into three names. Division with \`/\` always gives a float, so the average is \`80.0\`. Three values is about the limit for a bare tuple — with more, a named tuple makes the call site clearer.`,
        files: {
          'main.py': py`def stats(scores):
    return min(scores), max(scores), sum(scores) / len(scores)


low, high, average = stats([60, 95, 85])
print(f"Low: {low} | High: {high} | Average: {average}")
`,
        },
      },
      tests: [
        { name: 'returns (60, 95, 80.0)', code: py`assert stats([60, 95, 85]) == (60, 95, 80.0)` },
        { name: 'returns a tuple', code: py`assert isinstance(stats([1, 2]), tuple)` },
        { name: 'works for one score', code: py`assert stats([42]) == (42, 42, 42.0)` },
        { name: 'prints the summary line', code: py`assert output.strip() == "Low: 60 | High: 95 | Average: 80.0"` },
      ],
    },
    {
      id: 'parse-score-row',
      title: 'Split a score row',
      difficulty: 'beginner',
      prompt: py`Rows from a score file look like \`"Ada,90,85,77"\`: a name followed by **any number** of scores (maybe none).

Write \`parse_row(row)\` that returns a tuple \`(name, total)\` where \`total\` is the **sum of the scores as an int**.

- \`parse_row("Ada,90,85,77")\` → \`("Ada", 252)\`
- \`parse_row("Ben,70")\` → \`("Ben", 70)\`
- \`parse_row("Cy")\` → \`("Cy", 0)\`

Use **star-unpacking** to separate the name from the scores.`,
      files: {
        'main.py': py`def parse_row(row):
    parts = row.split(",")
    # TODO: unpack the name and the scores, then total the scores
    return parts[0], 0


for line in ["Ada,90,85,77", "Ben,70", "Cy"]:
    name, total = parse_row(line)
    print(name, total)
`,
      },
      hints: [
        'row.split(",") gives a list of strings. The first is the name, the rest are scores.',
        'name, *scores = row.split(",") puts the scores (still strings) in a list — empty if there are none.',
        'name, *scores = row.split(",")\ntotal = 0\nfor s in scores:\n    total += int(s)\nreturn name, total',
      ],
      solution: {
        explanation: py`\`name, *scores = row.split(",")\` binds the first field to \`name\` and collects every remaining field into the list \`scores\` — which is simply \`[]\` for \`"Cy"\`, so no special case is needed. The scores are still strings, so each is converted with \`int()\` before adding. Returning \`name, total\` packs a 2-tuple that the loop unpacks again. (Later you'll write the total as \`sum(int(s) for s in scores)\` — see [generator expressions](lesson:lazy-evaluation).)`,
        files: {
          'main.py': py`def parse_row(row):
    name, *scores = row.split(",")
    total = 0
    for s in scores:
        total += int(s)
    return name, total


for line in ["Ada,90,85,77", "Ben,70", "Cy"]:
    name, total = parse_row(line)
    print(name, total)
`,
        },
      },
      tests: [
        { name: 'several scores', code: py`assert parse_row("Ada,90,85,77") == ("Ada", 252)` },
        { name: 'one score', code: py`assert parse_row("Ben,70") == ("Ben", 70)` },
        { name: 'no scores gives 0', code: py`assert parse_row("Cy") == ("Cy", 0)` },
        { name: 'the total is an int', code: py`assert type(parse_row("Dee,1,2")[1]) is int` },
        { name: 'uses star-unpacking', code: py`assert "*" in files["main.py"].split("def parse_row")[1].split("for line")[0], 'Use name, *scores = ... inside parse_row'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'tuples-and-unpacking-tuple-vs-list',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between a tuple and a list, and how do you choose between them?',
      answer: 'Both are ordered sequences. Lists are mutable and meant for variable-length collections of similar items; tuples are immutable, can be hashable (dict keys, set members), and are meant for fixed-shape records where each position has a meaning.',
      explanation: py`The technical difference is mutability; the design difference is intent. \`list[str]\` says "some number of names"; \`tuple[float, float]\` says "exactly a latitude and a longitude". Immutability makes tuples safe to share, usable as keys, and slightly cheaper in CPython — but the main reason to choose one is meaning.`,
      whyAsked: 'A classic opener that reveals whether you think about data modelling or only syntax.',
      mistakes: ['Answering only "tuples are faster"', 'Saying tuples are always hashable', 'Ignoring the homogeneous vs heterogeneous convention'],
      followUps: ['When is a tuple not hashable?', 'Why might you return a tuple from a function?', 'When would you replace a tuple with a dataclass?'],
      modelAnswer: 'Both are ordered sequences that support indexing, slicing and iteration. The key technical difference is that lists are mutable and tuples are immutable. That leads to different uses: I use a list for a variable-length collection of the same kind of thing, like a list of usernames, and a tuple for a fixed-shape record where the position has meaning, like a latitude-longitude pair. Because tuples can\'t change, a tuple of hashable items can be a dictionary key or set member, and it is safe to share as a constant. If a tuple grows beyond two or three fields, I switch to a named tuple or a dataclass for readability.',
    },
    {
      id: 'tuples-and-unpacking-shallow-immutability',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Is `t = ("Ada", [90, 85])` immutable? Can it be a dictionary key?',
      answer: 'The tuple itself is immutable — its slots can never point to different objects — but the list inside is mutable, so t\'s overall value can change. Because of that, t is not hashable and cannot be a dict key.',
      explanation: py`\`t[1] = [...]\` raises \`TypeError\`, yet \`t[1].append(77)\` succeeds. Hashing a tuple hashes its items, and hashing a list fails: in Python 3.14, \`{t: 1}\` raises \`TypeError: cannot use 'tuple' as a dict key (unhashable type: 'list')\`. Immutability in Python is shallow by default.`,
      code: { lang: 'python', code: py`t = ("Ada", [90, 85])
t[1].append(77)
print(t)          # ('Ada', [90, 85, 77])
hash(t)           # TypeError: unhashable type: 'list'` },
      whyAsked: 'It distinguishes "can this container change which objects it holds?" from "can its value change?" — the foundation of hashing and copying.',
      mistakes: ['Saying the inner list becomes immutable', 'Saying a tuple is always hashable', 'Confusing re-binding t with mutating its contents'],
      followUps: ['How would you make it hashable?', 'What happens with t[1] += [5]?', 'How does this relate to frozen dataclasses?'],
      modelAnswer: 'The tuple is immutable in the sense that its two slots will always refer to the same two objects — I can\'t assign t[1] to something else. But the second object is a list, and the list itself is mutable, so I can append to it and the tuple\'s printed value changes. That is why Python refuses to hash it: hashing a tuple hashes each item, and lists aren\'t hashable, so it can\'t be a dict key or set member. To make it hashable I would store a tuple of scores instead of a list. In short, immutability in Python is shallow.',
    },
    {
      id: 'tuples-and-unpacking-star-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What do these three lines print?',
      code: { lang: 'python', code: py`a, *b, c = range(5)
print(a, b, c)
*d, = "hi"
print(d)
head, *tail = [1]
print(head, tail)` },
      options: ["0 [1, 2, 3] 4 / ['h', 'i'] / 1 []", '0 (1, 2, 3) 4 / hi / 1 None', "0 [1, 2, 3] 4 / ('h', 'i') / 1 []", 'SyntaxError on line 3'],
      correctOption: 0,
      answer: "`0 [1, 2, 3] 4`, then `['h', 'i']`, then `1 []`. A starred target always produces a list — even from a range or a string, and even when it collects nothing.",
      explanation: py`\`*d, = "hi"\` is legal: the trailing comma makes the left side a one-target tuple with a starred name. The starred target always builds a **list**, regardless of the source type, and it may be empty.`,
      whyAsked: 'Checks precise knowledge of extended unpacking (PEP 3132) rather than vague familiarity.',
      mistakes: ['Expecting the starred target to keep the source type (tuple/str/range)', 'Thinking *d = "hi" without the comma is valid (it is a SyntaxError)', 'Expecting None for an empty starred target'],
      followUps: ['Why is *d = "hi" (without a comma) a SyntaxError?', 'How does * work in function calls?', 'Can you use two starred targets?'],
      modelAnswer: 'The first line prints 0, then the list [1, 2, 3], then 4: plain names take items from the ends and the starred name collects the middle. The second prints [\'h\', \'i\'] — the trailing comma makes it a valid one-element target list, and starred targets always produce a list, even from a string. The third prints 1 and an empty list, because the starred name may collect zero items. The general rules are: one starred target per assignment, it always yields a list, and there must be at least as many items as plain names.',
    },
    {
      id: 'tuples-and-unpacking-dict-loop-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'This loop crashes with `ValueError: too many values to unpack (expected 2)`. With a dict like `{"Al": 90}` it doesn\'t crash but prints `A l`. Explain both.',
      code: { lang: 'python', code: py`scores = {"Ada": 90, "Ben": 85}
for name, score in scores:
    print(name, score)` },
      answer: 'Iterating a dict yields only its keys. Each key string is then unpacked character by character: "Ada" has three characters for two names (ValueError), while "Al" happens to have exactly two, so it "works" and prints A l. Use scores.items().',
      explanation: py`Unpacking accepts any iterable, and a string is iterable. So the error depends on the key length — a bug that hides with two-letter keys. \`dict.items()\` yields \`(key, value)\` tuples, which is what the loop wants.`,
      whyAsked: 'A very common real bug; the two-letter case shows whether you truly understand that unpacking works on any iterable.',
      mistakes: ['Saying dicts can\'t be looped over', 'Not explaining why the two-letter key silently "works"'],
      followUps: ['What do .keys() and .values() return?', 'How would you loop in sorted order of score?'],
      modelAnswer: 'Looping over a dict gives you its keys only, so each iteration tries to unpack a string into two names. Unpacking works on any iterable, and a string iterates character by character, so "Ada" gives three values for two names and raises ValueError. With a two-letter key like "Al" the counts happen to match, so it silently prints A and l — which is worse, because the bug hides. The fix is to iterate scores.items(), which yields key-value tuples.',
    },
    {
      id: 'tuples-and-unpacking-closest-point',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `closest(points, target)` that returns the `(x, y)` tuple from `points` nearest to the `target` tuple (straight-line distance). On a tie, return the one that appears first. Raise `ValueError` if `points` is empty.',
      answer: 'Unpack target into tx, ty and use min(points, key=...) with a key computing the squared distance; min returns the first of equal items, and raises ValueError on an empty sequence.',
      explanation: py`Squared distance \`(x - tx) ** 2 + (y - ty) ** 2\` orders points the same way as real distance without a square root. \`min\` returns the first minimal item it sees, which gives the tie rule for free, and raises \`ValueError\` for empty input.`,
      starter: { files: { 'main.py': py`def closest(points, target):
    # TODO: return the point nearest to target
    return points[0]


stations = [(0, 5), (4, 4), (-3, 1)]
print(closest(stations, (3, 3)))
` } },
      tests: [
        { name: 'finds the nearest station', code: py`assert closest([(0, 5), (4, 4), (-3, 1)], (3, 3)) == (4, 4)` },
        { name: 'works with negative coordinates', code: py`assert closest([(10, 10), (-2, -1)], (-3, -3)) == (-2, -1)` },
        { name: 'ties return the first point', code: py`assert closest([(1, 0), (-1, 0)], (0, 0)) == (1, 0)` },
        { name: 'empty input raises ValueError', code: py`with raises(ValueError):
    closest([], (0, 0))` },
      ],
      solution: { files: { 'main.py': py`def closest(points, target):
    tx, ty = target

    def squared_distance(point):
        x, y = point
        return (x - tx) ** 2 + (y - ty) ** 2

    return min(points, key=squared_distance)


stations = [(0, 5), (4, 4), (-3, 1)]
print(closest(stations, (3, 3)))
` } },
      hints: ['min() accepts a key function, just like sorted().', 'Inside the key, unpack the point: x, y = point.'],
      whyAsked: 'Combines unpacking, key functions and edge cases in a realistic task (nearest store, nearest station).',
      mistakes: ['Computing math.sqrt unnecessarily', 'Writing a manual loop with an off-by-one tie rule', 'Returning None silently for empty input'],
      followUps: ['How would you find the k nearest?', 'What if there were millions of points? (spatial indexes)', 'Could you use math.dist?'],
      modelAnswer: 'I unpack the target into tx and ty, then call min on the points with a key function that unpacks each point and returns the squared distance. Squared distance keeps the same ordering as true distance, so I skip the square root. min returns the first of several equal minimums, which satisfies the tie rule, and it raises ValueError on an empty list, which is the behaviour I want. For the k nearest I would use heapq.nsmallest, and for very large datasets a spatial index.',
    },
    {
      id: 'tuples-and-unpacking-return-shape',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A function `fetch_user()` returns a 6-tuple `(id, name, email, created, active, role)`. Callers keep writing `user[4]` and a recent change broke them. What would you do?',
      answer: 'Replace the positional tuple with a record that has field names — a typing.NamedTuple (still a tuple, so existing unpacking keeps working) or a dataclass — so callers use user.active instead of user[4].',
      explanation: py`Bare tuples encode meaning only in position; adding or reordering a field silently shifts every index. A \`NamedTuple\` is a drop-in, backward-compatible upgrade: it still indexes and unpacks, but also offers names. A [dataclass](lesson:dataclasses) is better if the record needs defaults, mutability or methods.`,
      code: { lang: 'python', code: py`from typing import NamedTuple

class User(NamedTuple):
    id: int
    name: str
    email: str
    active: bool = True

u = User(1, "Ada", "ada@example.com")
print(u.name, u.active)   # Ada True
uid, name, email, active = u   # old-style unpacking still works` },
      whyAsked: 'Tests API design sense: positional data is fragile, and good engineers migrate it without breaking callers.',
      mistakes: ['Suggesting a dict without discussing typos and missing type checking', 'Proposing a big class hierarchy', 'Ignoring backward compatibility with existing unpacking callers'],
      followUps: ['NamedTuple vs dataclass — when each?', 'How would you migrate callers gradually?', 'What do type checkers gain here?'],
      modelAnswer: 'A six-field tuple encodes meaning only by position, so user[4] is unreadable and any reordering or new field silently breaks callers. I would return a record with field names. A typing.NamedTuple is the smoothest migration because it is still a tuple — old code that indexes or unpacks keeps working — while new code can write user.active. If the record needs defaults, mutation or methods, I would choose a dataclass instead. Either way, type checkers can then catch misuse.',
    },
    {
      id: 'tuples-and-unpacking-assignment-order',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What does this print, and what does it reveal about how unpacking assignment works?',
      code: { lang: 'python', code: py`items = ["a", "b"]
i = 0
i, items[i] = 1, "x"
print(i, items)` },
      options: ["1 ['a', 'x']", "1 ['x', 'b']", "0 ['x', 'b']", 'IndexError'],
      correctOption: 0,
      answer: "`1 ['a', 'x']`. The right side is evaluated first into (1, \"x\"), then targets are assigned left to right: i becomes 1, and only then is items[i] — now items[1] — assigned.",
      explanation: py`The language reference specifies that the expression list is evaluated first and the targets are assigned from left to right. Each target expression (\`items[i]\`) is evaluated when its turn comes, so it sees the new \`i\`. In CPython, simple two- and three-name swaps are compiled to stack \`SWAP\` operations without building a tuple — an optimisation that doesn't change these semantics.`,
      whyAsked: 'Advanced candidates should know evaluation order precisely; this pattern causes subtle bugs in algorithms that swap array elements by computed index.',
      mistakes: ['Assuming all targets are computed before any assignment', 'Thinking the swap a, b = b, a needs a hidden temporary tuple in CPython (it is optimised away)'],
      followUps: ['Why is nums[i], nums[nums[i]] = ... dangerous in some algorithms?', 'How would you check the bytecode? (dis.dis)'],
      modelAnswer: 'It prints 1 and [\'a\', \'x\']. Python evaluates the whole right-hand side first, producing 1 and "x". Then it assigns the targets left to right, and each target expression is evaluated at its own turn — so i is set to 1 before items[i] is evaluated, which means items[1] gets "x". This is the documented order, and it is why swaps like nums[i], nums[j] = nums[j], nums[i] are safe but expressions where a later target depends on an earlier one can surprise you. CPython even compiles simple swaps to SWAP instructions without building a tuple, but that is an optimisation, not a semantic change.',
    },
  ],

  takeaways: [
    'A tuple is an immutable, ordered sequence; the comma makes it — ("solo",) needs its trailing comma.',
    'Tuples support every read-only sequence operation; "changing" one always builds a new tuple.',
    'Immutability is shallow: a tuple can hold a mutable list, and then it is not hashable.',
    'Unpacking binds several names from any iterable; the counts must match unless one target is starred.',
    'first, *rest = items collects leftovers into a list (possibly empty); only one starred target per assignment.',
    'return a, b returns one tuple that the caller unpacks — the Pythonic way to return several values.',
    'Tuples of hashable values make good dict keys and constants; beyond 2–3 fields, use a namedtuple or dataclass.',
  ],
}
