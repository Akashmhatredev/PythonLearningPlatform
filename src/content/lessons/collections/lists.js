// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PLAYLIST = py`# Build and edit a playlist
playlist = ["Intro", "Sunrise", "Rainfall"]
print("Start:", playlist)
print("Songs:", len(playlist))

playlist.append("Night Drive")      # add to the end
playlist.insert(1, "Wake Up")       # squeeze in at index 1
print("After adding:", playlist)

print("First:", playlist[0], "| Last:", playlist[-1])
print("Middle three:", playlist[1:4])

playlist.remove("Rainfall")         # remove by value
skipped = playlist.pop()            # remove the last item and get it back
print("Skipped:", skipped)

playlist[0] = "Intro (Remix)"       # replace by index
print("Final:", playlist)
print("Has 'Sunrise'?", "Sunrise" in playlist)
`

export default {
  id: 'lists',
  title: 'Lists: ordered, changeable collections',
  summary: 'A list is an ordered, changeable sequence of references to objects — you can index it, slice it and grow or shrink it in place.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['variables-and-names', 'strings-basics'],
  related: ['list-operations', 'tuples-and-unpacking', 'mutability-and-copying', 'dictionaries', 'for-loops', 'comprehensions'],
  tags: ['list', 'lists', 'index', 'indexing', 'slicing', 'append', 'insert', 'remove', 'pop', 'del', 'extend', 'slice assignment', 'nested lists', 'list of dicts', 'len', 'in', 'sequence', 'mutable'],
  apis: [
    { name: 'list.append(x)', summary: 'Adds one item to the end of the list, in place. Returns None.' },
    { name: 'list.extend(iterable)', summary: 'Adds every item from another iterable to the end, in place.' },
    { name: 'list.insert(i, x)', summary: 'Inserts x before position i, shifting later items one place right.' },
    { name: 'list.remove(x)', summary: 'Removes the first item equal to x; ValueError if there is none.' },
    { name: 'list.pop(i=-1)', summary: 'Removes and returns the item at position i (the last item by default).' },
    { name: 'del items[i] / del items[a:b]', summary: 'Deletes an item or a whole slice by position.' },
    { name: 'items[a:b] = other', summary: 'Slice assignment: replaces a slice with the items of another iterable (sizes may differ).' },
    { name: 'len(items)', summary: 'Number of items in the list.' },
    { name: 'x in items', summary: 'True if any item equals x (checks items one by one).' },
    { name: 'list(iterable)', summary: 'Builds a new list from any iterable: list("abc") → [\'a\', \'b\', \'c\'].' },
  ],
  docs: [
    { label: 'Python tutorial — lists', url: 'https://docs.python.org/3/tutorial/introduction.html#lists' },
    { label: 'Tutorial — more on lists', url: 'https://docs.python.org/3/tutorial/datastructures.html#more-on-lists' },
    { label: 'Library reference — sequence types (list, tuple, range)', url: 'https://docs.python.org/3/library/stdtypes.html#sequence-types-list-tuple-range' },
    { label: 'Library reference — mutable sequence operations', url: 'https://docs.python.org/3/library/stdtypes.html#mutable-sequence-types' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **list** is an ordered collection of values written in square brackets: \`["Intro", "Sunrise", "Rainfall"]\`. Each value in it is called an **item** (or *element*), and each item has a numbered position called its **index**, starting from **0**.`,
    py`Lists are **mutable** — you can change them after they are made: add items, remove items, replace items, all *in place* (the same list object changes, no new list is built). That makes a list the natural home for anything that grows and shrinks while your program runs: a shopping cart, a playlist, the scores in a game.`,
    py`You already know how to index and slice strings from [strings, indexing & slicing](lesson:strings-basics). Lists use exactly the same \`[ ]\` syntax — the big difference is that strings are frozen and lists are not.`,
  ],
  why: [
    py`Real programs rarely deal with one value at a time. A to-do app has *many* tasks, a grade book has *many* scores, a log file has *many* lines. Creating a separate variable for each (\`song1\`, \`song2\`, \`song3\`…) falls apart the moment you don't know how many there will be.`,
    py`A list gives you **one name for many values**, keeps them **in the order you put them**, and lets you **process them all** with a single loop. It is the most-used container in Python — the default choice whenever you have "a bunch of things in order".`,
  ],
  eli15: [
    py`Think of a list as a **numbered row of lockers**. Locker 0 is the first one, locker 1 is next to it, and so on. Each locker holds one thing — a word, a number, even another row of lockers.`,
    py`You can open any locker by its number (\`row[2]\`), count backwards from the end (\`row[-1]\` is the last locker), add a new locker to the end (\`append\`), squeeze one in the middle (\`insert\`) and the rest shuffle along, or take one away (\`pop\`, \`remove\`).`,
    py`The row is *yours to change*. That's the big deal: unlike a string, which is printed in ink, a list is written in pencil.`,
  ],
  analogy: {
    title: 'A train with numbered carriages',
    body: [
      py`Picture a train. Each carriage carries one passenger, and the carriages are numbered from the engine: 0, 1, 2… You can ask "who is in carriage 3?", hook a new carriage onto the back, or uncouple one from the middle — the carriages behind it simply move up one number.`,
      py`A Python list works the same way. The carriages are slots, the passengers are the objects, and the carriage numbers are indexes. A carriage doesn't *become* the passenger — it just carries them, which is why one passenger could even ride in two trains at once.`,
    ],
    mapping: [
      ['the train', 'the list object'],
      ['carriage number (from the engine, starting at 0)', 'the index: items[0], items[1], …'],
      ['counting carriages from the back', 'negative indexes: items[-1] is the last item'],
      ['hooking a carriage onto the back', 'items.append(x)'],
      ['inserting a carriage in the middle — everything behind shifts', 'items.insert(i, x)'],
      ['uncoupling a carriage', 'items.pop(i), items.remove(x), del items[i]'],
      ['a passenger (not the carriage itself)', 'the object a slot refers to'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a shopping cart list change in place',
    props: {
      code: py`cart = []
cart.append("apples")
cart.append("bread")
cart.insert(0, "milk")
cart[1] = "pears"
removed = cart.pop()
cart.extend(["eggs", "tea"])
del cart[0]
cart[1:] = ["jam"]
print(cart, removed)

orders = [cart, ["soap"]]
orders[0].append("honey")
print(orders)
print(cart)
`,
      notes: {
        1: '`[]` creates an **empty** list object and binds `cart` to it.',
        2: '`append` adds one item to the end of the **same** list — no new list is created.',
        4: '`insert(0, …)` puts "milk" before position 0, so every existing item shifts one place right.',
        5: 'Index assignment replaces the item in slot 1 ("apples" → "pears").',
        6: '`pop()` removes the **last** item and hands it back, so `removed` refers to "bread".',
        7: '`extend` adds each item of the other list one by one.',
        8: '`del cart[0]` deletes the item in slot 0 — nothing is returned.',
        9: 'Slice assignment swaps everything from index 1 onward for the items of `["jam"]`. The sizes don\'t have to match.',
        12: '`orders` holds a reference to the very same `cart` list — it is not a copy.',
        13: 'Appending through `orders[0]` changes `cart` too, because it *is* `cart`.',
      },
    },
    alt: 'A step-by-step trace. The name cart points to one list object that changes on every line: it starts empty, gains "apples" and "bread", "milk" is inserted at the front, slot 1 is replaced by "pears", pop removes "bread" into the name removed, extend adds "eggs" and "tea", del removes "milk", and slice assignment replaces the tail with "jam". Then a list called orders is created whose first slot points at the same cart list, so appending "honey" through orders[0] also changes cart.',
    caption: py`Step through with ▶. Notice that \`cart\` keeps pointing at **one** list object the whole time — every method changes it in place. At the end, \`orders[0]\` and \`cart\` are two routes to the same list.`,
  },
  syntax: [
    py`#### Creating lists`,
    { code: py`empty = []                          # an empty list
scores = [72, 85, 90]               # items separated by commas
mixed = [1, "two", 3.0, None]       # any types can be mixed
grid = [[1, 2], [3, 4]]             # lists can contain lists
letters = list("abc")               # ['a', 'b', 'c'] — from any iterable
numbers = list(range(5))            # [0, 1, 2, 3, 4]
row = ["."] * 3                     # ['.', '.', '.'] — repetition
both = [1, 2] + [3]                 # [1, 2, 3] — concatenation (a new list)`, lang: 'python', title: 'list literals and list()' },
    py`A trailing comma is allowed (\`[1, 2, 3,]\`), and long lists can be split over several lines inside the brackets — handy for diffs in version control.`,
    py`#### Reading: indexing, slicing, len and in`,
    { code: py`songs = ["Intro", "Sunrise", "Rainfall", "Night Drive"]
songs[0]          # 'Intro'        first item
songs[-1]         # 'Night Drive'  last item (negative = from the end)
songs[1:3]        # ['Sunrise', 'Rainfall']  start included, stop excluded
songs[:2]         # ['Intro', 'Sunrise']     from the start
songs[2:]         # ['Rainfall', 'Night Drive']  to the end
songs[::2]        # ['Intro', 'Rainfall']    every 2nd item
songs[::-1]       # reversed copy
len(songs)        # 4
"Sunrise" in songs      # True
"sunrise" in songs      # False — comparison is exact`, lang: 'python', title: 'the same rules as strings' },
    py`**Indexing** (\`songs[1]\`) returns one *item*. **Slicing** (\`songs[1:3]\`) returns a *new list*. An index past the end raises \`IndexError\`, but a slice past the end just stops early: \`songs[2:100]\` is fine.`,
    py`#### Changing a list in place`,
    py`| you want to… | write | returns |
|---|---|---|
| add one item at the end | \`items.append(x)\` | \`None\` |
| add many items at the end | \`items.extend(other)\` or \`items += other\` | \`None\` |
| insert before position \`i\` | \`items.insert(i, x)\` | \`None\` |
| replace the item at \`i\` | \`items[i] = x\` | — (a statement) |
| remove the first item equal to \`x\` | \`items.remove(x)\` | \`None\` |
| remove by position **and get the item back** | \`items.pop(i)\` (\`pop()\` = last) | the item |
| delete by position or slice | \`del items[i]\`, \`del items[a:b]\` | — (a statement) |
| replace a whole slice (any size) | \`items[a:b] = other\` | — |
| empty the list | \`items.clear()\` | \`None\` |`,
    { callout: 'warn', title: 'Mutating methods return None', text: py`\`append\`, \`extend\`, \`insert\`, \`remove\`, \`clear\` (and \`sort\`, \`reverse\`) change the list and return \`None\`. Writing \`cart = cart.append("milk")\` throws your list away and leaves \`cart\` bound to \`None\`. Just call the method: \`cart.append("milk")\`.` },
    py`#### Slice assignment`,
    { code: py`nums = [1, 2, 3, 4, 5]
nums[1:4] = ["x"]        # replace three items with one  → [1, 'x', 5]
nums[1:1] = [7, 8]       # empty slice = pure insertion   → [1, 7, 8, 'x', 5]
nums[-1:] = []           # replace with nothing = delete  → [1, 7, 8, 'x']
nums[:] = [0]            # replace everything, same list object → [0]`, lang: 'python', title: 'items[a:b] = iterable' },
    py`Slice assignment is the most flexible edit a list has: it can grow, shrink or replace a region in one step. With a *step* (\`nums[::2] = …\`) the sizes must match exactly, otherwise you get a \`ValueError\`.`,
    py`#### Nested lists and lists of dicts`,
    { code: py`seats = [
    [".", "X", "."],
    ["X", "X", "."],
]
print(seats[1][0])          # 'X'  — row 1, then seat 0
seats[0][2] = "X"           # book a seat

students = [
    {"name": "Ada", "scores": [90, 85]},
    {"name": "Ben", "scores": [70]},
]
print(students[1]["name"])          # Ben
students[1]["scores"].append(88)    # Ben's scores become [70, 88]`, lang: 'python', title: 'chain the brackets left to right' },
    py`Read chained brackets **left to right**: \`students[1]\` is a dictionary, \`["scores"]\` picks a list out of it, \`.append(88)\` changes that list. A *dictionary* (written with \`{key: value}\`) stores values under labels instead of numbers — it gets a whole lesson in [dictionaries](lesson:dictionaries). A list of dicts is the everyday shape of "rows of records": the result of reading a CSV or a JSON API is very often exactly this.`,
  ],
  walkthrough: {
    title: 'Reading the playlist program line by line',
    lang: 'python',
    code: PLAYLIST,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 4], text: py`A list literal creates one list object with three string items; \`len()\` counts them: \`Songs: 3\`.` },
      { lines: [6, 7], text: py`\`append\` hooks "Night Drive" onto the end. \`insert(1, …)\` places "Wake Up" **before** index 1, so "Sunrise" and everything after it moves one position right.` },
      { lines: [10, 11], text: py`\`playlist[0]\` is the first item, \`playlist[-1]\` the last. The slice \`[1:4]\` returns a **new** list with the items at indexes 1, 2 and 3 — the stop index 4 is not included.` },
      { lines: [13, 15], text: py`\`remove\` deletes by **value** (the first "Rainfall" it finds). \`pop()\` deletes by **position** — the last one by default — and returns the removed item, which we keep in \`skipped\`.` },
      { lines: [17, 18], text: py`Index assignment replaces whatever was in slot 0. The list is still the same object; only one of its slots now refers to a different string.` },
      { lines: [19], text: py`\`in\` checks whether any item equals \`"Sunrise"\`. It compares items one by one from the start — fine for short lists, and the reason [sets](lesson:sets) exist for big ones.` },
    ],
  },
  playground: {
    title: 'Playlist builder',
    objective: 'Run it, predict each printed line, then edit the playlist with append, insert, pop and slices.',
    files: { 'main.py': PLAYLIST },
    expected: py`Eight lines:

\`\`\`text
Start: ['Intro', 'Sunrise', 'Rainfall']
Songs: 3
After adding: ['Intro', 'Wake Up', 'Sunrise', 'Rainfall', 'Night Drive']
First: Intro | Last: Night Drive
Middle three: ['Wake Up', 'Sunrise', 'Rainfall']
Skipped: Night Drive
Final: ['Intro (Remix)', 'Wake Up', 'Sunrise']
Has 'Sunrise'? True
\`\`\`

Lists print with square brackets and quotes around strings — that's the list's *repr*, the "developer view" of the value.`,
    experiments: [
      {
        id: 'golden-hour',
        task: py`Add the song \`"Golden Hour"\` to the **end** of the playlist, just before the \`print("Final:", playlist)\` line.`,
        hint: py`One method call: \`playlist.append(...)\`.`,
        tests: [
          { name: '"Golden Hour" is the last song', code: py`assert playlist[-1] == "Golden Hour", 'Append "Golden Hour" before the Final print'` },
          { name: 'it appears in the Final line', code: py`assert "Golden Hour" in [l for l in output.splitlines() if l.startswith("Final:")][0]` },
        ],
        explain: py`\`append\` always adds at the end — wherever the end is at that moment. Because you added it before the print, the Final line shows it.`,
      },
      {
        id: 'skip-first',
        task: py`Change the \`pop()\` call so it removes the **first** song instead of the last. Predict what \`Skipped:\` prints.`,
        hint: py`\`pop\` takes an optional index: \`pop(0)\`.`,
        tests: [{ name: 'the first song was skipped', code: py`assert skipped == "Intro"` }],
        explain: py`\`pop(i)\` removes and returns the item at index \`i\`. \`pop(0)\` returns "Intro" — and every remaining item shifts one place left, which is why removing from the *front* of a big list is slower than from the back (more in [list operations](lesson:list-operations)).`,
      },
      {
        id: 'slice-swap',
        task: py`At the very end of the program, replace the **first two** songs with the three songs \`"Ocean"\`, \`"Tide"\` and \`"Shore"\` in **one line**, then print the playlist.`,
        hint: py`Slice assignment: \`playlist[0:2] = [...]\` — the new slice may be longer than the old one.`,
        tests: [
          { name: 'the playlist starts with Ocean, Tide, Shore', code: py`assert playlist[:3] == ["Ocean", "Tide", "Shore"]` },
          { name: '"Intro (Remix)" was replaced', code: py`assert "Intro (Remix)" not in playlist` },
        ],
        explain: py`\`playlist[0:2] = ["Ocean", "Tide", "Shore"]\` removes two items and inserts three in their place, all in one operation. The list grows by one, and it is still the same list object.`,
      },
      {
        id: 'albums',
        task: py`Make a nested list at the end: \`albums = [["Intro", "Sunrise"], ["Rainfall", "Night Drive"]]\`. Then print **only** the second song of the second album as the last line.`,
        hint: py`Two indexes, left to right: first pick the album, then the song. Remember both start at 0.`,
        tests: [
          { name: 'albums exists', code: py`assert ns.get('albums') == [["Intro", "Sunrise"], ["Rainfall", "Night Drive"]]` },
          { name: 'last line is Night Drive', code: py`assert output.strip().splitlines()[-1] == "Night Drive"` },
        ],
        explain: py`\`albums[1]\` is the inner list \`["Rainfall", "Night Drive"]\`; \`albums[1][1]\` is its second item. Every extra level of nesting is just one more pair of brackets.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Indexes, negative indexes and slices',
    props: {
      width: 760,
      height: 240,
      nodes: [
        { id: 'i0', label: '"P"', note: '[0]  ·  [-6]', x: 80, y: 120, tone: 'paper' },
        { id: 'i1', label: '"Y"', note: '[1]  ·  [-5]', x: 200, y: 120, tone: 'paper' },
        { id: 'i2', label: '"T"', note: '[2]  ·  [-4]', x: 320, y: 120, tone: 'paper' },
        { id: 'i3', label: '"H"', note: '[3]  ·  [-3]', x: 440, y: 120, tone: 'paper' },
        { id: 'i4', label: '"O"', note: '[4]  ·  [-2]', x: 560, y: 120, tone: 'paper' },
        { id: 'i5', label: '"N"', note: '[5]  ·  [-1]', x: 680, y: 120, tone: 'paper' },
      ],
      edges: [],
      steps: [
        { focus: ['i0', 'i1', 'i2', 'i3', 'i4', 'i5'], text: py`\`word = ["P", "Y", "T", "H", "O", "N"]\` — six slots in a row. Each slot has **two** addresses: a positive index counted from the front (starting at 0) and a negative one counted from the back (starting at -1).` },
        { focus: ['i0'], text: py`\`word[0]\` → \`"P"\`. The first item is at index **0**, because the index means "how many steps from the start".` },
        { focus: ['i5'], text: py`\`word[-1]\` → \`"N"\`. Negative indexes count from the end, so \`-1\` is always the last item, whatever the length. Much nicer than \`word[len(word) - 1]\`.` },
        { focus: ['i1', 'i2', 'i3'], text: py`\`word[1:4]\` → \`["Y", "T", "H"]\`. A slice includes the **start** and stops **before** the stop. A handy check: the slice has \`4 - 1 = 3\` items.` },
        { focus: ['i0', 'i2', 'i4'], text: py`\`word[::2]\` → \`["P", "T", "O"]\`. The third number is the **step**: take every 2nd item. \`word[::-1]\` walks backwards and gives a reversed copy.` },
        { focus: ['i4', 'i5'], text: py`\`word[6]\` raises \`IndexError: list index out of range\` — there is no slot 6. But \`word[4:100]\` quietly returns \`["O", "N"]\`: slices clip to the list's edges instead of crashing.` },
      ],
    },
    alt: 'Six boxes in a row containing the letters P, Y, T, H, O, N, each labelled with its positive index 0 to 5 and its negative index -6 to -1. Successive steps highlight index 0, index -1, the slice 1:4 (Y, T, H), the step slice ::2 (P, T, O) and the last two items to explain out-of-range behaviour.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A list doesn't store the objects *inside* itself. Each slot holds a **reference** — an arrow pointing at an object that lives elsewhere in memory, exactly like a variable name does (see [variables](lesson:variables-and-names)).`,
      py`That one fact explains three things you will see in practice:`,
      py`- a list can mix any types, because every slot is just an arrow;
- putting the **same** list into another list twice means two arrows to one object — change it once and you "see" the change twice;
- \`b = a\` gives you a second name for the same list, not a copy. Copying properly is the topic of [mutability & copying](lesson:mutability-and-copying).`,
      { code: py`row = ["."] * 3
grid = [row, row]          # two arrows to ONE inner list
grid[0][0] = "X"
print(grid)                # [['X', '.', '.'], ['X', '.', '.']]`, lang: 'python', title: 'two slots, one object' },
    ],
    technical: [
      py`A list is a **sequence**: it supports \`len()\`, indexing, slicing, \`in\`, iteration, \`+\` and \`*\`. It is also a **mutable sequence**, which adds item and slice assignment, \`del\`, and the methods \`append\`, \`extend\`, \`insert\`, \`remove\`, \`pop\`, \`clear\`, \`reverse\` and \`sort\`. The same operations work on any type that implements those protocols — that's why \`for\` loops, \`len()\` and slicing feel identical on lists, strings and tuples.`,
      py`Equality is item-by-item: \`[1, 2] == [1, 2]\` is \`True\` even though they are two different objects (\`is\` would be \`False\`). Comparison with \`<\` is *lexicographic*, like words in a dictionary: \`[1, 9] < [2]\` is \`True\` because \`1 < 2\` decides it.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython a list is a **dynamic array**: one contiguous block of pointers to objects, plus a length. Indexing is a constant-time jump to "start + i", which is why \`items[500_000]\` is as fast as \`items[0]\`. The array is allocated with some spare room, so most \`append\` calls don't need to move anything; inserting or removing near the **front** has to shift every later pointer. The language reference doesn't promise these costs — other implementations may differ — but every mainstream Python behaves this way. The full cost table is in [list operations](lesson:list-operations).` },
    ],
    production: [
      py`Lists are the right default for ordered data that you append to and loop over. Reach for something else when the access pattern changes: a [set](lesson:sets) for "have I seen this?" checks on many items, a [dict](lesson:dictionaries) to look records up by an id, and a [\`deque\`](lesson:collections-module) for a queue that you pop from the front.`,
      py`Lists of dicts are a fine *transport* format (they map directly to JSON), but inside a larger program, records with a fixed set of fields are clearer as [dataclasses](lesson:dataclasses) or named tuples: typos in field names become errors instead of silent \`KeyError\`s at runtime.`,
      py`Never change a list's length while you loop over it — items get skipped silently (see the mistakes below). Build a new list instead, usually with a [comprehension](lesson:comprehensions): \`passed = [s for s in scores if s >= 50]\`.`,
    ],
  },
  mistakes: [
    {
      title: 'Saving the result of append',
      wrong: { code: py`cart = ["eggs"]
cart = cart.append("milk")
print(cart)        # None — the list is gone`, lang: 'python' },
      right: { code: py`cart = ["eggs"]
cart.append("milk")
print(cart)        # ['eggs', 'milk']`, lang: 'python' },
      explanation: py`Methods that change a list in place return \`None\` on purpose, to remind you that no new list was made. Assigning that \`None\` back to \`cart\` loses the list, and the next \`cart.append\` fails with \`AttributeError: 'NoneType' object has no attribute 'append'\`.`,
    },
    {
      title: 'Using append when you meant extend',
      wrong: { code: py`basket = ["apples"]
basket.append(["bread", "jam"])
print(basket)      # ['apples', ['bread', 'jam']] — 2 items, one is a list`, lang: 'python' },
      right: { code: py`basket = ["apples"]
basket.extend(["bread", "jam"])
print(basket)      # ['apples', 'bread', 'jam']`, lang: 'python' },
      explanation: py`\`append\` always adds exactly **one** item — if that item is a list, you get a list inside your list. \`extend\` (or \`+=\`) adds each item of the other iterable separately.`,
    },
    {
      title: 'Removing items while looping over the same list',
      wrong: { code: py`scores = [55, 40, 38, 90, 20]
for s in scores:
    if s < 50:
        scores.remove(s)
print(scores)      # [55, 38, 90] — 38 survived!`, lang: 'python' },
      right: { code: py`scores = [55, 40, 38, 90, 20]
scores = [s for s in scores if s >= 50]
print(scores)      # [55, 90]`, lang: 'python' },
      explanation: py`The loop walks forward by index. When 40 (index 1) is removed, 38 slides into index 1 — but the loop has already moved on to index 2, so 38 is never checked. Build a new list (a [comprehension](lesson:comprehensions) is ideal), or loop over a copy: \`for s in scores[:]:\`.`,
    },
    {
      title: 'Reaching one past the end',
      wrong: { code: py`songs = ["Intro", "Sunrise", "Rainfall"]
last = songs[len(songs)]     # IndexError`, lang: 'python' },
      right: { code: py`songs = ["Intro", "Sunrise", "Rainfall"]
last = songs[-1]             # 'Rainfall'`, lang: 'python' },
      explanation: py`With 3 items the valid indexes are 0, 1 and 2 — \`len(songs)\` is one too far. Use \`-1\` for the last item; it works for any length (except an empty list, which has no last item at all).`,
    },
    {
      title: 'list("word") vs ["word"]',
      wrong: { code: py`tags = list("python")
print(tags)        # ['p', 'y', 't', 'h', 'o', 'n']`, lang: 'python' },
      right: { code: py`tags = ["python"]
print(tags)        # ['python']`, lang: 'python' },
      explanation: py`\`list(x)\` loops over \`x\` and collects every item — and looping over a string gives you its characters. To make a list *containing* one string, use the bracket literal.`,
    },
  ],
  debugging: [
    {
      symptom: py`IndexError: list index out of range`,
      cause: py`You asked for an index that doesn't exist: \`items[len(items)]\`, an off-by-one in a loop counter, or reading \`items[0]\` from an empty list.`,
      fix: py`Print \`len(items)\` and the index just before the failing line. Valid indexes run from \`0\` to \`len(items) - 1\` (or \`-len(items)\` to \`-1\`). Guard empty lists with \`if items:\` before reading \`items[0]\` or \`items[-1]\`.`,
    },
    {
      symptom: py`ValueError: list.remove(x): x not in list`,
      cause: py`\`remove\` couldn't find any item equal to the value — often a capitalisation or whitespace difference (\`"milk "\` vs \`"milk"\`), or the item was already removed.`,
      fix: py`Check first (\`if item in items: items.remove(item)\`) or print \`repr(item)\` and the list to spot invisible differences.`,
    },
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute 'append'`,
      cause: py`The variable you call \`.append\` on is \`None\` — almost always because an earlier line did \`items = items.append(...)\` or \`items = items.sort()\`.`,
      fix: py`Search for \`= <name>.append\` / \`.sort()\` assignments and drop the \`name =\` part: in-place methods return \`None\`.`,
    },
    {
      symptom: py`TypeError: list indices must be integers or slices, not str`,
      cause: py`You indexed a list with a string — e.g. a number read with \`input()\` (\`"2"\`), or you treated a list of dicts as if it were one dict (\`students["name"]\`).`,
      fix: py`Convert with \`int()\` first, or pick an item before the key: \`students[0]["name"]\`.`,
    },
    {
      symptom: py`TypeError: can only concatenate list (not "str") to list`,
      cause: py`\`items + "milk"\` — \`+\` joins two lists; it can't glue a single string onto a list.`,
      fix: py`Use \`items.append("milk")\`, or wrap it: \`items + ["milk"]\`.`,
    },
  ],
  bestPractices: [
    'Name lists with plural nouns (songs, scores, open_orders) so the singular is free for loop variables: for song in songs.',
    'Use items[-1] for the last item, never items[len(items) - 1].',
    'Call in-place methods (append, extend, sort…) on their own line; never assign their None result.',
    'Use extend (or +=) to add many items, append to add exactly one.',
    'Never add or remove items from a list while looping over it — build a new list instead.',
    'Keep the items of one list the same kind of thing (all prices, all songs); use a dict, dataclass or tuple for a record of different fields.',
  ],
  useCases: [
    'A shopping cart or to-do list that grows and shrinks while the program runs.',
    'Collecting results in a loop (append each one), then printing or saving them.',
    'Rows read from a CSV file or records returned by a JSON API (often a list of dicts).',
    'A 2-D grid such as a game board or seat map (a list of lists).',
    'A history or undo stack: append to push, pop() to undo the latest action.',
  ],
  whenToUse: {
    use: [
      'You need the items in a specific order and want to keep that order.',
      'Items can repeat (two identical scores are both kept).',
      'The collection will change — items added, removed or replaced.',
      'You mostly loop over everything or work at the end of the sequence.',
    ],
    avoid: [
      'You mostly ask "is x in here?" on a large collection — use a set.',
      'You look items up by a name or id — use a dict.',
      'The values form a fixed record that should not change — use a tuple (or a dataclass).',
      'You add and remove at the front a lot — use collections.deque.',
    ],
  },
  comparison: {
    title: 'Python\'s four built-in containers at a glance',
    headers: ['', 'list', 'tuple', 'set', 'dict'],
    rows: [
      ['literal', '[1, 2, 2]', '(1, 2, 2)', '{1, 2}', '{"a": 1}'],
      ['ordered?', 'yes', 'yes', 'no', 'yes — insertion order (3.7+)'],
      ['changeable?', 'yes', 'no', 'yes', 'yes'],
      ['duplicates?', 'allowed', 'allowed', 'never', 'keys unique, values may repeat'],
      ['look up by', 'position', 'position', 'membership only', 'key'],
      ['typical use', 'a sequence that changes', 'a fixed record', 'unique items, fast "in"', 'labelled data'],
    ],
    note: py`Each one gets its own lesson in this level: [tuples](lesson:tuples-and-unpacking), [sets](lesson:sets) and [dictionaries](lesson:dictionaries).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'lists-q1',
      type: 'mcq',
      prompt: 'Which expression creates a list containing exactly one item, the string `"hello"`?',
      options: [
        { text: 'list("hello")', why: 'list() loops over its argument, and looping over a string gives characters: [\'h\', \'e\', \'l\', \'l\', \'o\'].' },
        '["hello"]',
        { text: '("hello")', why: 'Parentheses around a single value just group it — this is the string "hello", not a list (and not even a tuple).' },
        { text: '[] + "hello"', why: 'You can only concatenate a list with another list: TypeError: can only concatenate list (not "str") to list.' },
      ],
      answer: 1,
      explanation: py`Square brackets around comma-separated values build a list literal, so \`["hello"]\` is a one-item list. \`list(...)\` is for converting a whole iterable into a list.`,
    },
    {
      id: 'lists-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`nums = [10, 20, 30, 40, 50]
print(nums[1:3], nums[-2])`,
      answer: '[20, 30] 40',
      explanation: py`\`nums[1:3]\` takes indexes 1 and 2 (the stop, 3, is excluded) → \`[20, 30]\`. \`nums[-2]\` is the second item from the end → \`40\`.`,
    },
    {
      id: 'lists-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`letters = ["a", "b", "c"]
letters.append(["d", "e"])
print(len(letters))`,
      options: [
        { text: '5', why: 'That is what extend would give. append adds its argument as ONE item — here, a whole list.' },
        '4',
        { text: '3', why: 'append does change the list in place; it gains one item.' },
        { text: 'TypeError', why: 'A list can hold any object, including another list.' },
      ],
      answer: 1,
      explanation: py`The list becomes \`['a', 'b', 'c', ['d', 'e']]\` — four items, the last one being a list. Use \`extend\` to add \`"d"\` and \`"e"\` separately.`,
    },
    {
      id: 'lists-q4',
      type: 'bug',
      prompt: 'This should remove every failing score (below 50), but it prints `[55, 38, 90]`. Click the line that causes the bug.',
      code: py`scores = [55, 40, 38, 90, 20]
for s in scores:
    if s < 50:
        scores.remove(s)
print(scores)`,
      answerLine: [4, 2],
      explanation: py`Line 4 removes items from the very list the loop on line 2 is walking through. After 40 is removed, 38 shifts into its slot and the loop skips past it. Build a new list instead: \`scores = [s for s in scores if s >= 50]\`.`,
    },
    {
      id: 'lists-q5',
      type: 'fill',
      prompt: 'Complete the code so it adds `"milk"` to the end of the cart and prints `2`.',
      code: py`cart = ["eggs"]
cart.___("milk")
print(___(cart))`,
      answer: [['append'], ['len']],
      explanation: py`\`append\` adds one item to the end in place, and \`len()\` returns the number of items: 2.`,
    },
    {
      id: 'lists-q6',
      type: 'mcq',
      prompt: 'Given `items = ["a", "b", "c"]`, which expression raises an error?',
      options: [
        { text: 'items[-3]', why: 'Negative indexes go down to -len(items): -3 is the first item, "a".' },
        { text: 'items[1:10]', why: 'Slices never raise for out-of-range bounds — they clip to the list, giving [\'b\', \'c\'].' },
        'items[3]',
        { text: 'items[3:]', why: 'A slice starting at the end is simply empty: [].' },
      ],
      answer: 2,
      explanation: py`Valid indexes are 0, 1, 2 (and -1, -2, -3). \`items[3]\` raises \`IndexError: list index out of range\`. Slices are forgiving; indexing is strict.`,
    },
    {
      id: 'lists-q7',
      type: 'short',
      prompt: 'Explain the difference between `items.pop(0)` and `items.remove(items[0])` — and when you would choose `del items[0]` instead.',
      answer: py`All three remove the first item here, but they work differently. \`pop(0)\` removes **by position** and **returns** the removed item, so you can use it. \`remove(x)\` removes **by value**: it searches for the first item equal to x (which might not be at index 0 if there are duplicates earlier — here it is) and returns None. \`del items[0]\` removes by position (or a whole slice) and returns nothing — use it when you don't need the item back.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'shopping-list-edits',
      title: 'Edit the shopping list',
      difficulty: 'beginner',
      prompt: py`The program starts with \`shopping = ["bread", "milk", "eggs", "crisps"]\`. Using **list operations** (not by retyping the list), make these changes in order:

1. remove \`"crisps"\`;
2. put \`"apples"\` at the very **start**;
3. replace \`"milk"\` with \`"oat milk"\` using **index assignment**;
4. add \`"tea"\` to the **end**.

The final list must be \`['apples', 'bread', 'oat milk', 'eggs', 'tea']\`, and the program must print exactly:

\`\`\`text
5 items: ['apples', 'bread', 'oat milk', 'eggs', 'tea']
\`\`\`

Keep the first line (\`shopping = [...]\`) as it is and don't write a second \`shopping = [\` list — the tests check that.`,
      files: {
        'main.py': py`shopping = ["bread", "milk", "eggs", "crisps"]

# TODO: 1. remove "crisps"
# TODO: 2. put "apples" at the start
# TODO: 3. replace "milk" with "oat milk" (index assignment)
# TODO: 4. add "tea" to the end

print(len(shopping), "items:", shopping)
`,
      },
      hints: [
        'You need four different operations: remove(), insert(), item assignment (shopping[i] = ...) and append().',
        'Work out where "milk" is AFTER step 2: inserting "apples" at index 0 pushes everything one place right.',
        'shopping.remove("crisps")\nshopping.insert(0, "apples")\nshopping[2] = "oat milk"\nshopping.append("tea")',
      ],
      solution: {
        explanation: py`\`remove("crisps")\` deletes by value. \`insert(0, "apples")\` adds before index 0, shifting the other items right — so "milk", which started at index 1, is now at index **2**, and \`shopping[2] = "oat milk"\` replaces it. \`append("tea")\` adds at the end. Each step changes the same list object in place; nothing is retyped, so the program would still work if the starting list were loaded from a file.`,
        files: {
          'main.py': py`shopping = ["bread", "milk", "eggs", "crisps"]

shopping.remove("crisps")
shopping.insert(0, "apples")
shopping[2] = "oat milk"
shopping.append("tea")

print(len(shopping), "items:", shopping)
`,
        },
      },
      tests: [
        { name: 'the final list is correct', code: py`assert shopping == ['apples', 'bread', 'oat milk', 'eggs', 'tea']` },
        { name: 'prints the count and the list', code: py`assert output.strip() == "5 items: ['apples', 'bread', 'oat milk', 'eggs', 'tea']"` },
        { name: 'the list was edited, not retyped', code: py`src = files['main.py']
assert src.count('shopping = [') == 1, 'Keep only the original shopping = [...] line and edit the list with methods'
assert 'shopping = ["bread", "milk", "eggs", "crisps"]' in src, 'Keep the first line unchanged'` },
      ],
    },
    {
      id: 'seat-map',
      title: 'Cinema seat map',
      difficulty: 'beginner',
      prompt: py`A cinema's seats are a **list of rows**, and each row is a list of seats: \`"."\` means free, \`"X"\` means taken.

The function skeletons are already written for you (a *function* is a named, reusable piece of code — \`def\` creates it and \`return\` hands back its result; you'll study them in [defining functions](lesson:defining-functions)). Fill in their bodies:

1. \`count_free(seats)\` — **return** the number of free seats (\`"."\`) in the whole map, as an int.
2. \`book(seats, row, seat)\` — if \`seats[row][seat]\` is free, change it to \`"X"\` **in place** and return \`True\`; if it is already taken, leave it alone and return \`False\`.

For the map in the starter, \`count_free(seats)\` is \`6\`.`,
      files: {
        'main.py': py`seats = [
    [".", "X", "."],
    ["X", "X", "."],
    [".", ".", "."],
]


def count_free(seats):
    # TODO: return how many "." are in the whole map
    return 0


def book(seats, row, seat):
    # TODO: book the seat if it is free; return True/False
    return False


print("Free seats:", count_free(seats))
print("Book row 0, seat 0:", book(seats, 0, 0))
print("Book row 0, seat 0 again:", book(seats, 0, 0))
print("Free seats now:", count_free(seats))
`,
      },
      hints: [
        'For count_free you need to visit every row, and inside each row every seat: a for loop over seats gives you one row (a list) at a time.',
        'Lists have a count() method: row.count(".") tells you how many free seats one row has. Add those up. For book, read seats[row][seat] first, compare it with ".", then assign.',
        'free = 0\nfor row in seats:\n    free += row.count(".")\nreturn free\n\n# book:\nif seats[row][seat] == ".":\n    seats[row][seat] = "X"\n    return True\nreturn False',
      ],
      solution: {
        explanation: py`\`count_free\` loops over the outer list — each \`row\` is one inner list — and adds up \`row.count(".")\`. (A \`for\` loop runs its indented block once per item; see [for loops](lesson:for-loops).)

\`book\` reads the seat with two chained indexes, \`seats[row][seat]\`: the first picks the row list, the second the seat inside it. Assigning \`seats[row][seat] = "X"\` changes the inner list **in place**, so the caller's \`seats\` map is updated too — no need to return the map. Returning a \`True\`/\`False\` lets the caller react to a seat that was already taken.`,
        files: {
          'main.py': py`seats = [
    [".", "X", "."],
    ["X", "X", "."],
    [".", ".", "."],
]


def count_free(seats):
    free = 0
    for row in seats:
        free += row.count(".")
    return free


def book(seats, row, seat):
    if seats[row][seat] == ".":
        seats[row][seat] = "X"
        return True
    return False


print("Free seats:", count_free(seats))
print("Book row 0, seat 0:", book(seats, 0, 0))
print("Book row 0, seat 0 again:", book(seats, 0, 0))
print("Free seats now:", count_free(seats))
`,
        },
      },
      tests: [
        { name: 'counts the free seats in a fresh map', code: py`m = [[".", "X", "."], ["X", "X", "."], [".", ".", "."]]
assert count_free(m) == 6` },
        { name: 'works for a different map', code: py`assert count_free([["."] * 4, ["X"] * 4]) == 4
assert count_free([["X"]]) == 0` },
        { name: 'booking a free seat returns True and marks it', code: py`m = [[".", "."]]
assert book(m, 0, 1) is True
assert m == [[".", "X"]]` },
        { name: 'booking a taken seat returns False and changes nothing', code: py`m = [["X", "."]]
assert book(m, 0, 0) is False
assert m == [["X", "."]]` },
        { name: 'free count drops after booking', code: py`m = [[".", "."], [".", "X"]]
book(m, 1, 0)
assert count_free(m) == 2` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'lists-what-is-a-list',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a Python list, and what does it actually store?',
      answer: 'An ordered, mutable sequence. It stores references to objects (not the objects themselves), so it can hold mixed types, grow and shrink, and contain the same object more than once.',
      explanation: py`A list keeps items in insertion order and lets you change them in place (append, insert, remove, slice assignment). Each slot is a reference, like a variable name: that's why \`[x, x]\` holds one object twice and why nested lists can share inner lists. In CPython the list is implemented as a dynamic array of pointers.`,
      code: { lang: 'python', code: py`row = [0, 0]
grid = [row, row]
grid[0][0] = 9
print(grid)   # [[9, 0], [9, 0]] — both slots refer to one list` },
      whyAsked: 'It checks whether you know the container you will use most, and whether you understand reference semantics.',
      mistakes: ['Saying a list "contains copies" of the values', 'Confusing lists with arrays that hold one fixed type', 'Forgetting that lists are mutable while tuples are not'],
      followUps: ['How is a list different from a tuple?', 'Why is items[i] fast but x in items slow for big lists?', 'What does [[0] * 3] * 3 create?'],
      modelAnswer: 'A list is Python\'s built-in ordered, mutable sequence. It keeps items in the order I add them and lets me change it in place — append, insert, remove, pop, or replace a slice. What it stores are references to objects, not the objects themselves, which is why one list can mix ints, strings and other lists, and why the same object can appear in two slots. In CPython it is a dynamic array of pointers, so indexing by position is constant time and appending is cheap. When I need something fixed I use a tuple instead, and for fast membership tests a set.',
    },
    {
      id: 'lists-append-extend-plus',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `items.append(x)`, `items.extend(x)`, `items += x` and `items = items + x`. What does this print?',
      code: { lang: 'python', code: py`a = [1]
b = a
a.append([2, 3])
a.extend([4, 5])
a += [6]
a = a + [7]
print(len(b), len(a))` },
      options: ['5 6', '6 7', '4 5', '7 8'],
      correctOption: 0,
      answer: 'It prints `5 6`. append adds one item (the whole [2, 3]), extend and += add each item in place, while a = a + [7] builds a new list and re-binds only a.',
      explanation: py`After \`append\`, \`a\` is \`[1, [2, 3]]\` (2 items). \`extend([4, 5])\` → 4 items. \`a += [6]\` is in place → 5 items, still the same object as \`b\`. \`a = a + [7]\` creates a **new** 6-item list and re-binds \`a\`; \`b\` still refers to the old 5-item list.`,
      whyAsked: 'It separates people who know the API names from people who understand in-place mutation versus building new objects.',
      mistakes: ['Thinking append unpacks a list argument', 'Assuming a += x and a = a + x are identical for lists', 'Forgetting that b is an alias of the original list'],
      followUps: ['What does a.extend("hi") do?', 'Which of these work on a tuple?', 'Why does += on a list accept any iterable but + does not?'],
      modelAnswer: 'append adds exactly one object to the end, even if that object is a list, so you get nesting. extend takes any iterable and adds its items one by one, in place. items += x behaves like extend — it mutates the existing list — whereas items = items + x builds a brand-new list and re-binds the name. That difference matters with aliases: here b still sees the in-place changes but not the final concatenation, so the output is 5 and 6. In practice I use append for one item and extend for many.',
    },
    {
      id: 'lists-modify-while-iterating',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A colleague removes expired coupons with this loop, but some expired coupons survive. Explain the bug and give two fixes.',
      code: { lang: 'python', code: py`coupons = ["OLD1", "OLD2", "NEW1", "OLD3", "NEW2"]
for c in coupons:
    if c.startswith("OLD"):
        coupons.remove(c)
print(coupons)   # ['OLD2', 'NEW1', 'NEW2']` },
      answer: 'The loop iterates by index while remove() shifts later items left, so the item after each removed one is skipped. Build a new list (a comprehension) or iterate over a copy.',
      explanation: py`A list iterator just keeps an index. Removing "OLD1" at index 0 moves "OLD2" into index 0, but the iterator moves on to index 1 ("NEW1"), so "OLD2" is never examined. Fixes: \`coupons = [c for c in coupons if not c.startswith("OLD")]\` (clearest, and linear time), \`for c in coupons[:]: …\` (iterate over a snapshot), or iterate backwards by index. Rebinding vs mutating matters if other code holds a reference: \`coupons[:] = [...]\` replaces the contents in place.`,
      whyAsked: 'This is one of the most common real-world list bugs; interviewers want to see that you can explain the mechanism, not just the fix.',
      mistakes: ['Saying Python "gets confused" without explaining the index shift', 'Fixing it with a while loop and manual index juggling that is still buggy', 'Not noticing that remove() is also O(n) per call, making the loop quadratic'],
      followUps: ['What happens if you do the same with a dict? (RuntimeError: dictionary changed size during iteration)', 'How would you keep the same list object for other references?', 'What is the time complexity of the remove-in-a-loop approach?'],
      modelAnswer: 'The for loop walks the list by position. When remove deletes an item, everything after it shifts one place left, so the next item slides into the slot the loop has just processed and is never checked — that is why OLD2 survives. The clean fix is to build a new list with a comprehension that keeps only what I want; it is also linear time, while repeated remove calls are quadratic. If other code holds a reference to the same list, I assign back with slice assignment, coupons[:] = [...], so the original object is updated. Iterating over a copy, coupons[:], also works for small lists.',
    },
    {
      id: 'lists-slice-assignment-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`nums = [1, 2, 3, 4, 5]
nums[1:4] = ["x"]
print(nums)
nums[1:1] = [7, 8]
print(nums)` },
      options: ["[1, 'x', 5] then [1, 7, 8, 'x', 5]", "[1, 'x', 'x', 'x', 5] then [1, 7, 8, 5]", "[1, 'x', 4, 5] then [1, 7, 8, 'x', 4, 5]", 'ValueError: sizes must match'],
      correctOption: 0,
      answer: "`[1, 'x', 5]` then `[1, 7, 8, 'x', 5]`. Slice assignment replaces the slice with the new items, whatever their count; an empty slice [1:1] means pure insertion.",
      explanation: py`\`nums[1:4]\` covers 2, 3, 4; replacing them with one item shrinks the list. \`nums[1:1]\` is an empty slice *before* index 1, so assigning to it inserts without removing anything. Only *extended* slices with a step (\`nums[::2] = …\`) require the sizes to match.`,
      whyAsked: 'Slice assignment is a powerful, lesser-known tool; it also probes whether you understand half-open ranges.',
      mistakes: ['Assuming the replacement must be the same length', 'Thinking [1:1] selects the item at index 1', 'Confusing simple slices with extended (stepped) slices'],
      followUps: ['How would you delete a slice? (del nums[1:3] or nums[1:3] = [])', 'What does nums[:] = other do that nums = other does not?'],
      modelAnswer: 'The first print shows [1, \'x\', 5]: the slice 1 to 4 covers the items 2, 3 and 4, and slice assignment replaces that whole region with the items on the right, even if there are fewer of them. The second print shows [1, 7, 8, \'x\', 5], because the slice 1 to 1 is empty — it sits just before index 1 — so assigning to it is a pure insertion. Sizes only have to match for extended slices with a step. I find nums[:] = new_items useful when other code holds a reference and I want to replace the contents in place.',
    },
    {
      id: 'lists-chunk',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `chunk(items, size)` that splits a list into consecutive sub-lists of length `size` (the last one may be shorter). `chunk([1, 2, 3, 4, 5, 6, 7], 3)` → `[[1, 2, 3], [4, 5, 6], [7]]`. An empty list gives `[]`. Don\'t modify the input.',
      answer: 'Step through the start indexes with range(0, len(items), size) and slice items[i:i + size] at each one.',
      explanation: py`\`range(0, len(items), size)\` yields 0, 3, 6… — the start of every chunk. Slicing never raises for an end past the list, so the final short chunk needs no special case. Slices create new lists, so the input is untouched. On Python 3.12+, \`itertools.batched(items, size)\` does the same lazily, yielding tuples (see [itertools](lesson:itertools)).`,
      starter: { files: { 'main.py': py`def chunk(items, size):
    # TODO: return a list of sub-lists, each at most size long
    return []


print(chunk([1, 2, 3, 4, 5, 6, 7], 3))
` } },
      tests: [
        { name: 'splits 7 items into chunks of 3', code: py`assert chunk([1, 2, 3, 4, 5, 6, 7], 3) == [[1, 2, 3], [4, 5, 6], [7]]` },
        { name: 'exact multiple has no empty chunk', code: py`assert chunk(["a", "b", "c", "d"], 2) == [["a", "b"], ["c", "d"]]` },
        { name: 'size larger than the list', code: py`assert chunk([1, 2], 5) == [[1, 2]]` },
        { name: 'empty list gives []', code: py`assert chunk([], 3) == []` },
        { name: 'does not modify the input', code: py`data = [1, 2, 3]
chunk(data, 2)
assert data == [1, 2, 3]` },
      ],
      solution: { files: { 'main.py': py`def chunk(items, size):
    chunks = []
    for start in range(0, len(items), size):
        chunks.append(items[start:start + size])
    return chunks


print(chunk([1, 2, 3, 4, 5, 6, 7], 3))
` } },
      hints: ['range(start, stop, step) can count in steps of size.', 'A slice like items[i:i + size] never raises, even near the end.'],
      whyAsked: 'Batching (pagination, bulk database inserts, API rate limits) is an everyday task; it tests slicing fluency and edge cases.',
      mistakes: ['Producing an empty trailing chunk for exact multiples', 'Mutating the input with pop() in a loop', 'Off-by-one errors with manual index arithmetic'],
      followUps: ['How would you do it lazily for a huge input?', 'What should happen if size is 0 or negative?', 'How does itertools.batched differ? (3.12+, yields tuples)'],
      modelAnswer: 'I loop over the chunk start positions with range from zero to the length in steps of size, and at each start I take the slice items[start:start + size]. Slices clip at the end of the list, so the last, shorter chunk comes out naturally and an exact multiple doesn\'t produce an empty chunk. Slicing builds new lists, so the input is left untouched. For very large or streaming input I would make it a generator, or on 3.12 and later use itertools.batched. I would also validate that size is a positive integer.',
    },
    {
      id: 'lists-parallel-vs-records',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A script keeps student data in three parallel lists: `names`, `ages`, `grades`, where index i in each list is the same student. What problems does this cause, and how would you restructure it?',
      answer: 'Parallel lists drift out of sync (an append or sort on one list but not the others silently mismatches data). Keep one list of records instead — a list of dicts, named tuples or dataclasses — so each student\'s fields travel together.',
      explanation: py`With parallel lists, every operation (append, delete, sort) must be repeated on all three in the same way; forgetting once corrupts the data without any error. A list of records keeps related fields together: sorting by grade moves the whole record. Dicts are quick and map directly to JSON; [dataclasses](lesson:dataclasses) add field names checked by tools and a readable repr.`,
      code: { lang: 'python', code: py`students = [
    {"name": "Ada", "age": 15, "grade": 91},
    {"name": "Ben", "age": 16, "grade": 78},
]
students.sort(key=lambda s: s["grade"], reverse=True)
print(students[0]["name"])   # Ada — the whole record moved together` },
      whyAsked: 'It tests data-modelling judgement, not just syntax: real codebases are full of structures that are easy to get out of sync.',
      mistakes: ['Suggesting zip() as the fix without addressing the data model', 'Jumping to a database or class hierarchy for a tiny script', 'Not mentioning sorting or deleting as the operations that break parallel lists'],
      followUps: ['When would you pick a dataclass over a dict?', 'How would you look a student up by name quickly?', 'How does this map to JSON?'],
      modelAnswer: 'Parallel lists rely on every operation being applied identically to all of them. The moment someone sorts the grades list, or deletes from names but not ages, the indexes stop matching and the data is silently wrong — no error is raised. I would store one list of records, where each record keeps a student\'s fields together: a list of dicts is fine for a script and maps straight to JSON, and in a bigger codebase I would use a dataclass so field names are checked by tools. Sorting or filtering then moves whole records, and if I need lookups by name I would add a dict keyed by name.',
    },
    {
      id: 'lists-getsizeof',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Why does `sys.getsizeof(["a" * 1000])` report a small number, and why can one list hold ints, strings and other lists at the same time?',
      answer: 'Because a list stores references, not the objects. getsizeof measures only the list object itself — its header and its array of pointers — not the objects those pointers refer to. Every slot is the same size whatever it points at, so mixed types are free.',
      explanation: py`In CPython a list is a header plus a separately allocated array of \`PyObject*\` pointers. \`sys.getsizeof\` is *shallow*: it reports the memory of that one object (CPython includes the pointer array), not the 1000-character string. To measure a whole structure you must walk it (or use \`tracemalloc\`). Because all slots are uniform pointers, the list doesn't care about item types — type checks happen when you *use* the items. This is a CPython implementation detail; the language only guarantees the behaviour, not the layout.`,
      whyAsked: 'It probes understanding of reference semantics at the memory level, useful when reasoning about memory usage and copying.',
      mistakes: ['Assuming getsizeof is recursive', 'Saying lists are "typed" like C arrays', 'Presenting CPython layout as a language guarantee'],
      followUps: ['How would you measure the full memory of a nested structure?', 'Why does a list of a million small ints use more memory than array.array of ints?', 'What does over-allocation mean for append?'],
      modelAnswer: 'A list does not contain its items, it contains references to them. In CPython that is an array of pointers, and sys.getsizeof is shallow: it reports the list object and its pointer array, not the big string the pointer leads to. Because every slot is just a pointer of the same size, a list can mix any types — the type only matters when you use an item. If I need the real footprint of a nested structure I walk it or measure with tracemalloc. And I would flag that this layout is a CPython detail; the language guarantees the behaviour, not the memory representation.',
    },
  ],

  takeaways: [
    'A list is an ordered, mutable sequence written with square brackets; indexes start at 0 and negative indexes count from the end.',
    'Indexing returns one item and raises IndexError when out of range; slicing returns a new list and clips quietly.',
    'append adds one item, extend/+= add many, insert adds at a position, remove deletes by value, pop deletes by position and returns the item, del deletes by position or slice.',
    'In-place methods return None — never write items = items.append(x).',
    'Slice assignment (items[a:b] = other) can replace, insert or delete a whole region in one step.',
    'Lists hold references: nested lists and lists of dicts are chains of brackets read left to right, and the same object can appear in several slots.',
    'Never change a list\'s length while looping over it; build a new list instead.',
  ],
}
