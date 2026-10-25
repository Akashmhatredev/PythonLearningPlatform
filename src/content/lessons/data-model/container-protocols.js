// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PLAYLIST = py`class Playlist:
    """An ordered collection of song titles that behaves like a sequence."""

    def __init__(self, name, songs=()):
        self.name = name
        self._songs = list(songs)           # composition: a Playlist *has* a list

    def __len__(self):
        return len(self._songs)

    def __getitem__(self, index):
        if isinstance(index, slice):        # playlist[1:3] passes slice(1, 3, None)
            return Playlist(f"{self.name} (part)", self._songs[index])
        return self._songs[index]           # ints, including negative ones

    def __iter__(self):
        return iter(self._songs)            # a fresh iterator for every loop

    def __contains__(self, title):
        return title in self._songs

    def __reversed__(self):
        return reversed(self._songs)

    def __repr__(self):
        return f"Playlist({self.name!r}, {self._songs!r})"


road_trip = Playlist("Road trip", ["Africa", "Fast Car", "Dreams", "Golden Hour"])

print(len(road_trip))                       # __len__
print(road_trip[0], "...", road_trip[-1])   # __getitem__ with ints
print(road_trip[1:3])                       # __getitem__ with a slice
print("Dreams" in road_trip)                # __contains__
for number, title in enumerate(road_trip, start=1):   # __iter__
    print(number, title)
print(list(reversed(road_trip)))            # __reversed__
print(sorted(road_trip))                    # sorted() accepts any iterable
if road_trip:                               # truthiness comes from __len__
    print("Ready to play!")
`

export default {
  id: 'container-protocols',
  title: 'Building containers: __len__, __getitem__, __iter__ & __contains__',
  summary: 'Implement the container protocols — __len__, __getitem__, __iter__, __contains__ and friends — so len(), indexing, slicing, for and in work on your own collection classes.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['special-methods', 'iterators'],
  related: ['abstract-base-classes', 'iterators', 'generators', 'lists', 'dictionaries', 'strings-basics', 'collections-module', 'operator-overloading', 'attribute-access', 'composition', 'polymorphism-and-duck-typing', 'protocols', 'performance'],
  tags: ['containers', 'sequence protocol', 'mapping', '__len__', '__getitem__', '__setitem__', '__delitem__', '__iter__', '__contains__', '__reversed__', 'slicing', 'slice object', 'collections.abc', 'Sequence', 'MutableMapping', 'UserDict', 'iteration', 'duck typing'],
  apis: [
    { name: '__len__(self)', summary: 'len(c). Must return an int ≥ 0. Also gives truthiness and is needed by reversed()\'s fallback.' },
    { name: '__getitem__(self, key)', summary: 'c[key]. Receives an int, a slice object (c[1:3]), a tuple (c[1, 2]) or any key. Raise IndexError (sequences) or KeyError (mappings) for missing items.' },
    { name: '__setitem__(self, key, value) / __delitem__(self, key)', summary: 'c[key] = value and del c[key].' },
    { name: '__iter__(self)', summary: 'iter(c) and for loops. Return a new iterator each time — a generator method is the easiest way.' },
    { name: '__contains__(self, item)', summary: 'item in c. Falls back to iterating and comparing with is / == when missing.' },
    { name: '__reversed__(self)', summary: 'reversed(c). Falls back to __len__ + __getitem__ when missing.' },
    { name: 'slice(start, stop, step) / slice.indices(length)', summary: 'The object c[a:b:c] passes to __getitem__; .indices(len) turns it into concrete (start, stop, step) values.' },
    { name: 'collections.abc.Sequence / MutableSequence / Mapping / MutableMapping', summary: 'Abstract base classes: implement a few abstract methods, inherit the rest (index, count, get, items, update, pop…) as mixins.' },
    { name: 'collections.UserDict / UserList', summary: 'Pure-Python wrappers around dict / list, designed to be subclassed safely.' },
  ],
  docs: [
    { label: 'Data model — emulating container types', url: 'https://docs.python.org/3/reference/datamodel.html#emulating-container-types' },
    { label: 'collections.abc — abstract base classes for containers', url: 'https://docs.python.org/3/library/collections.abc.html' },
    { label: 'Built-in functions — iter() and the sequence protocol', url: 'https://docs.python.org/3/library/functions.html#iter' },
    { label: 'Expressions — membership test operations (in)', url: 'https://docs.python.org/3/reference/expressions.html#membership-test-operations' },
    { label: 'Glossary — sequence', url: 'https://docs.python.org/3/glossary.html#term-sequence' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **container** is an object that holds other objects: a list of songs, a dict of settings, a deck of cards, a shopping basket. Python's built-in containers all speak the same language — \`len(x)\`, \`x[0]\`, \`x[1:3]\`, \`for item in x\`, \`item in x\` — and with a handful of special methods, your own classes can speak it too.`,
    py`Each piece of that language is a small **protocol**: an agreed set of special methods. \`len()\` needs \`__len__\`. Square brackets need \`__getitem__\` (and \`__setitem__\` / \`__delitem__\` to change things). \`for\` needs \`__iter__\`. \`in\` needs \`__contains__\`. \`reversed()\` needs \`__reversed__\`. Python doesn't care what your class *is* — only which of these methods it has. That's [duck typing](lesson:polymorphism-and-duck-typing) at work.`,
    py`You'll build a \`Playlist\` that behaves like a real sequence, discover the surprising **fallbacks** Python uses when a method is missing, and learn when to let \`collections.abc\` write most of the methods for you (see [abstract base classes](lesson:abstract-base-classes)).`,
  ],
  why: [
    py`Domain objects are often collections in disguise: an order *has* line items, a playlist *has* songs, a sensor *has* a history of readings. If \`Playlist\` makes users write \`playlist.songs[0]\` and \`len(playlist.songs)\`, every caller depends on your internal list. Make \`Playlist\` itself a container and you can later swap the list for a database cursor or a \`deque\` without breaking anyone.`,
    py`Implementing the protocols also plugs your class into the whole ecosystem for free: \`sorted()\`, \`sum()\`, \`enumerate()\`, \`zip()\`, \`random.choice()\`, list comprehensions, unpacking (\`first, *rest = playlist\`) — they only need iteration or indexing, not a real \`list\`.`,
    py`And you can add rules a plain list can't: a reading history that keeps only the last 100 values, a deck that refuses duplicate cards, headers that ignore upper/lower case. The class still *looks* like a normal container from the outside.`,
  ],
  eli15: [
    py`Imagine a vending machine. You don't open it up and rummage around — you use the buttons on the front: "how many snacks are left?", "give me the snack in slot B3", "is there any chocolate?". The machine decides how to answer each button.`,
    py`Your container class is the vending machine, and Python's syntax is the buttons. \`len(machine)\` presses the "how many?" button, which runs your \`__len__\`. \`machine[3]\` presses "give me slot 3" — your \`__getitem__\`. \`"chocolate" in machine\` presses "do you have…?" — your \`__contains__\`. \`for snack in machine\` asks it to hand out snacks one at a time — your \`__iter__\`.`,
    py`What's inside (a list, a dict, a database) is your business. The buttons on the front are the same for every machine, so everybody already knows how to use yours.`,
  ],
  analogy: {
    title: 'A library front desk',
    body: [
      py`At a library you never walk into the stacks. You ask the front desk: "how many books do you have?", "can I have book number 42?", "do you have *Dune*?", "can I see all the cookbooks, one at a time?". Behind the desk the books might be on shelves, in a basement or in another building — you don't need to know.`,
      py`Container special methods are that front desk. The questions are standard; your class decides how to answer them. And if the desk can only answer "give me book number N", a clever visitor (Python) can still go through the whole collection by asking for book 0, 1, 2… until the librarian says "there's no such book" — that's the old **sequence-protocol fallback**.`,
    ],
    mapping: [
      ['"how many books?"', 'len(c) → __len__'],
      ['"book number 42, please"', 'c[42] → __getitem__(42)'],
      ['"books 10 to 20"', 'c[10:20] → __getitem__(slice(10, 20, None))'],
      ['"do you have Dune?"', '"Dune" in c → __contains__'],
      ['"show me them one at a time"', 'for book in c → __iter__'],
      ['"there\'s no such book"', 'raising IndexError (or KeyError for a mapping)'],
      ['the stacks behind the desk', 'the private list/dict your class wraps'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'One __getitem__, many jobs',
    props: {
      code: py`class Shelf:
    def __init__(self, *books):
        self.books = list(books)

    def __len__(self):
        return len(self.books)

    def __getitem__(self, index):
        print("  __getitem__ got", repr(index))
        return self.books[index]


shelf = Shelf("Dune", "Emma", "Ulysses")
print(len(shelf))
print(shelf[-1])
print(shelf[0:2])
for title in shelf:
    print(title)
`,
      notes: {
        14: '`len(shelf)` calls `__len__`, which simply asks the wrapped list.',
        15: '`shelf[-1]` calls `__getitem__(-1)`. The list handles negative indexes for us.',
        16: '`shelf[0:2]` builds a **slice object** — watch `index` become `slice(0, 2, None)` in the frame.',
        17: 'Shelf has **no `__iter__`**! Python falls back to the old sequence protocol: it calls `__getitem__(0)`, `(1)`, `(2)`… ',
        18: '…until `__getitem__(3)` raises `IndexError`. The `for` loop treats that as "no more items" and ends quietly.',
      },
    },
    alt: 'A step-by-step trace of a Shelf class with only __len__ and __getitem__. len(shelf) enters __len__ and prints 3. shelf[-1] enters __getitem__ with index -1 and prints Ulysses. shelf[0:2] enters __getitem__ with index equal to slice(0, 2, None) and prints a list of two titles. The for loop enters __getitem__ with 0, 1 and 2, printing each title, then with 3, where the list raises IndexError and the loop ends.',
    caption: py`The \`print\` inside \`__getitem__\` is only there so you can see every call in the output. Notice the last call, \`__getitem__ got 3\`, with no title after it: that \`IndexError\` is how the fallback knows to stop.`,
  },
  syntax: [
    py`#### Syntax → special method`,
    py`| you write | Python calls | if missing |
|---|---|---|
| \`len(c)\` | \`c.__len__()\` | \`TypeError: object of type 'C' has no len()\` |
| \`c[i]\`, \`c[a:b]\`, \`c[r, col]\` | \`c.__getitem__(key)\` | \`TypeError: 'C' object is not subscriptable\` |
| \`c[k] = v\` | \`c.__setitem__(k, v)\` | \`TypeError: 'C' object does not support item assignment\` |
| \`del c[k]\` | \`c.__delitem__(k)\` | \`TypeError: 'C' object doesn't support item deletion\` |
| \`for x in c\`, \`list(c)\`, \`iter(c)\` | \`c.__iter__()\` | **falls back** to \`__getitem__(0)\`, \`(1)\`, … until \`IndexError\` |
| \`x in c\` | \`c.__contains__(x)\` | **falls back** to iterating and comparing with \`is\` / \`==\` |
| \`reversed(c)\` | \`c.__reversed__()\` | **falls back** to \`__len__\` + \`__getitem__\` |
| \`bool(c)\`, \`if c:\` | \`c.__bool__()\` | **falls back** to \`__len__() != 0\` |`,
    py`#### What arrives in __getitem__`,
    { code: py`class Spy:
    def __getitem__(self, key):
        return key          # just show us what Python passed in


s = Spy()
print(s[3])           # 3
print(s[-1])          # -1  (negative numbers arrive as-is: you handle them)
print(s[1:4])         # slice(1, 4, None)
print(s[::2])         # slice(None, None, 2)
print(s[2, 5])        # (2, 5)  — a tuple: handy for grids
print(s["volume"])    # volume — any hashable key, like a dict`, lang: 'python', title: 'square brackets pass one object' },
    py`So a sequence-like \`__getitem__\` usually has two branches:`,
    { code: py`def __getitem__(self, index):
    if isinstance(index, slice):
        return Playlist(self.name, self._songs[index])   # slicing returns the same type
    return self._songs[index]                            # int: one item (IndexError if out of range)`, lang: 'python', static: true, title: 'the usual shape (method body only)' },
    py`#### Error rules`,
    py`- Sequence out of range → raise **\`IndexError\`**. (The \`for\` fallback stops on it.)
- Mapping key missing → raise **\`KeyError\`**.
- Wrong kind of key (a string for a sequence) → raise **\`TypeError\`**.
- Delegating to an inner \`list\` or \`dict\` gives you all three for free.`,
    py`#### __iter__: return a fresh iterator`,
    { code: py`class Basket:
    def __init__(self, items):
        self._items = list(items)

    def __iter__(self):
        return iter(self._items)       # delegate to the list's iterator

    # ...or write it as a generator method — also returns a new iterator each call:
    # def __iter__(self):
    #     for item in self._items:
    #         yield item


for item in Basket(["eggs", "milk"]):
    print(item)`, lang: 'python', title: 'two easy ways to implement __iter__' },
    { callout: 'tip', title: 'Let collections.abc write the boring parts', text: py`Inherit from \`collections.abc.Sequence\` and implement just \`__getitem__\` and \`__len__\`: you get \`__iter__\`, \`__contains__\`, \`__reversed__\`, \`.index()\` and \`.count()\` for free. \`MutableMapping\` needs five methods and gives you \`get\`, \`keys\`, \`items\`, \`values\`, \`pop\`, \`update\`, \`setdefault\`, \`==\` and more. Details in *Under the hood*.` },
  ],
  walkthrough: {
    title: 'Reading the Playlist line by line',
    lang: 'python',
    code: PLAYLIST,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 6], text: py`**Composition**: the playlist *has* a private list (\`_songs\`) rather than *being* a list. \`list(songs)\` makes our own copy, so the caller's list can't change our playlist behind our back.` },
      { lines: [8, 9], text: py`\`__len__\` delegates to the list. It also makes an empty playlist falsy, because there's no \`__bool__\`.` },
      { lines: [11, 14], text: py`Square brackets always call \`__getitem__\` with **one** argument. For \`road_trip[1:3]\` that's a \`slice\` object; we slice the inner list and wrap the result in a new \`Playlist\`, just as slicing a list returns a list. Ints (negative ones too) go straight to the list, which raises \`IndexError\` when out of range.` },
      { lines: [16, 17], text: py`\`__iter__\` returns a **new** iterator each time it's called, so two loops over the same playlist (even nested ones) don't interfere.` },
      { lines: [19, 23], text: py`\`__contains__\` and \`__reversed__\` delegate too. Python could work both out from the other methods, but defining them lets us use the list's fast C implementations.` },
      { lines: [31, 33], text: py`\`len()\`, indexing with \`0\` and \`-1\`, and slicing — the slice comes back as a \`Playlist\`, printed with its \`__repr__\`.` },
      { lines: [34, 38], text: py`\`in\`, \`for\` (here through \`enumerate\`), \`reversed()\` and \`sorted()\` all work. \`sorted()\` never knew it was dealing with a Playlist — it just iterated.` },
      { lines: [39, 40], text: py`\`if road_trip:\` — no \`__bool__\`, so Python used \`__len__() != 0\`.` },
    ],
  },
  playground: {
    title: 'Road-trip playlist',
    objective: 'Run it, match each line to the special method behind it, then make the playlist mutable and explore the fallbacks.',
    files: { 'main.py': PLAYLIST },
    expected: py`\`\`\`text
4
Africa ... Golden Hour
Playlist('Road trip (part)', ['Fast Car', 'Dreams'])
True
1 Africa
2 Fast Car
3 Dreams
4 Golden Hour
['Golden Hour', 'Dreams', 'Fast Car', 'Africa']
['Africa', 'Dreams', 'Fast Car', 'Golden Hour']
Ready to play!
\`\`\``,
    experiments: [
      {
        id: 'mutable',
        task: py`Make the playlist editable. Add \`__setitem__\` so \`road_trip[0] = "Take On Me"\` replaces a song, and \`__delitem__\` so \`del road_trip[1]\` removes one. Out-of-range positions must raise \`IndexError\`.`,
        hint: py`Delegate both: \`self._songs[index] = title\` and \`del self._songs[index]\`. The list raises \`IndexError\` for you.`,
        tests: [
          { name: 'setting an item replaces it', code: py`p = Playlist("t", ["a", "b", "c"])
p[0] = "z"
assert list(p) == ["z", "b", "c"]` },
          { name: 'deleting an item removes it', code: py`p = Playlist("t", ["a", "b", "c"])
del p[1]
assert list(p) == ["a", "c"] and len(p) == 2` },
          { name: 'out-of-range raises IndexError', code: py`p = Playlist("t", ["a"])
with raises(IndexError):
    p[5] = "x"
with raises(IndexError):
    del p[5]` },
        ],
        explain: py`\`c[k] = v\` calls \`__setitem__(k, v)\` and \`del c[k]\` calls \`__delitem__(k)\`. Because you delegated, slices work too: \`road_trip[0:2] = ["x", "y"]\` and \`del road_trip[::2]\` pass slice objects straight to the list.`,
      },
      {
        id: 'remove-iter',
        task: py`Delete \`__iter__\`, \`__contains__\` and \`__reversed__\` (lines 16–23) and run. Before you do: will the \`for\` loop, \`in\` and \`reversed()\` still work?`,
        hint: py`Remove the three method definitions completely. Keep \`__len__\` and \`__getitem__\`.`,
        tests: [
          { name: 'the three methods are gone', code: py`assert not {'__iter__', '__contains__', '__reversed__'} & set(Playlist.__dict__), 'Delete __iter__, __contains__ and __reversed__'` },
          { name: 'everything still works', code: py`assert "4 Golden Hour" in output
assert "['Golden Hour', 'Dreams', 'Fast Car', 'Africa']" in output
assert "True" in output` },
        ],
        explain: py`Python fell back on the **sequence protocol**. \`for\` and \`in\` called \`__getitem__(0)\`, \`(1)\`, … until \`IndexError\`; \`reversed()\` used \`__len__\` to find the end and walked backwards with \`__getitem__\`. Fallbacks are convenient, but they're linear walks through Python-level calls — defining the methods is clearer and usually faster.`,
      },
      {
        id: 'sequence-abc',
        task: py`Make \`Playlist\` inherit from \`collections.abc.Sequence\` (add \`from collections.abc import Sequence\` at the top and change the first line to \`class Playlist(Sequence):\`). Then print \`road_trip.index("Dreams")\` and \`road_trip.count("Africa")\` — methods you never wrote.`,
        hint: py`Two edits at the top of the file, and one \`print(...)\` line at the bottom.`,
        tests: [
          { name: 'Playlist is a Sequence', code: py`from collections.abc import Sequence
assert issubclass(Playlist, Sequence), 'Inherit from collections.abc.Sequence'` },
          { name: 'index() and count() work', code: py`assert road_trip.index("Dreams") == 2
assert road_trip.count("Africa") == 1` },
        ],
        explain: py`\`Sequence\` is an abstract base class: it requires \`__getitem__\` and \`__len__\`, and provides \`index\`, \`count\`, \`__contains__\`, \`__iter__\` and \`__reversed__\` built on top of them. Your own definitions still win (normal inheritance), and \`isinstance(road_trip, Sequence)\` is now \`True\`.`,
      },
      {
        id: 'string-key',
        task: py`Add \`print(road_trip["Dreams"])\` at the end and run it. Read the error, then remove the line. Whose error message is it, really?`,
        explain: py`\`TypeError: list indices must be integers or slices, not str\` — raised by the *inner list*, because \`__getitem__\` passed the string along. Delegation gives correct exception types for free, but the message leaks your implementation. Production classes often check the key type and raise their own \`TypeError("Playlist indices must be integers or slices")\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The container protocols and their fallbacks',
    props: {
      width: 760,
      height: 470,
      nodes: [
        { id: 'len', label: 'len(c)', x: 140, y: 45, tone: 'yellow' },
        { id: 'idx', label: 'c[i]  c[a:b]', note: 'also c[k] = v, del c[k]', x: 140, y: 120, tone: 'yellow' },
        { id: 'for', label: 'for x in c', note: 'list(c), sorted(c)…', x: 140, y: 200, tone: 'yellow' },
        { id: 'in', label: 'x in c', x: 140, y: 280, tone: 'yellow' },
        { id: 'rev', label: 'reversed(c)', x: 140, y: 355, tone: 'yellow' },
        { id: 'bool', label: 'if c:', x: 140, y: 430, tone: 'yellow' },
        { id: 'dlen', label: '__len__', x: 600, y: 45, tone: 'blue' },
        { id: 'dget', label: '__getitem__', note: 'int, slice, tuple or key', x: 600, y: 120, tone: 'blue' },
        { id: 'diter', label: '__iter__', note: 'returns a new iterator', x: 600, y: 200, tone: 'blue' },
        { id: 'dcont', label: '__contains__', x: 600, y: 280, tone: 'blue' },
        { id: 'drev', label: '__reversed__', x: 600, y: 355, tone: 'blue' },
        { id: 'dbool', label: '__bool__', x: 600, y: 430, tone: 'blue' },
      ],
      edges: [
        { from: 'len', to: 'dlen' },
        { from: 'idx', to: 'dget' },
        { from: 'for', to: 'diter' },
        { from: 'in', to: 'dcont' },
        { from: 'rev', to: 'drev' },
        { from: 'bool', to: 'dbool' },
        { id: 'for-fb', from: 'for', to: 'dget', label: 'fallback: 0, 1, 2… until IndexError', dashed: true },
        { id: 'in-fb', from: 'in', to: 'diter', label: 'fallback: loop + ==', dashed: true },
        { id: 'rev-fb', from: 'rev', to: 'dlen', label: 'fallback: __len__ + __getitem__', dashed: true },
        { id: 'bool-fb', from: 'bool', to: 'dlen', label: 'fallback: len != 0', dashed: true },
      ],
      steps: [
        { focus: ['len', 'idx', 'dlen', 'dget'], edges: ['len->dlen', 'idx->dget'], text: py`The two core methods. \`len(c)\` → \`__len__\`; square brackets → \`__getitem__\` with whatever was inside them (an int, a \`slice\`, a tuple, a key). Writing and deleting use \`__setitem__\` and \`__delitem__\`.` },
        { focus: ['for', 'diter'], edges: ['for->diter'], text: py`Every kind of iteration — \`for\`, \`list()\`, \`sorted()\`, unpacking, comprehensions — starts with \`iter(c)\`, which calls \`__iter__\`.` },
        { focus: ['for', 'dget'], edges: ['for-fb'], text: py`No \`__iter__\`? If there's a \`__getitem__\`, Python builds an iterator that calls \`__getitem__(0)\`, \`(1)\`, \`(2)\`… and stops at the first \`IndexError\`. This is the old **sequence protocol**, from before \`__iter__\` existed.` },
        { focus: ['in', 'dcont'], edges: ['in->dcont'], text: py`\`x in c\` calls \`__contains__\` — your chance to answer quickly, e.g. with a set or dict lookup.` },
        { focus: ['in', 'diter'], edges: ['in-fb'], text: py`No \`__contains__\`? Python iterates (via \`__iter__\`, or the \`__getitem__\` fallback) and checks each item with \`is\` and then \`==\`. Correct, but a linear scan.` },
        { focus: ['rev', 'drev', 'dlen'], edges: ['rev->drev', 'rev-fb'], text: py`\`reversed(c)\` uses \`__reversed__\`, or else needs **both** \`__len__\` (to find the end) and \`__getitem__\` (to walk backwards).` },
        { focus: ['bool', 'dbool', 'dlen'], edges: ['bool->dbool', 'bool-fb'], text: py`Truthiness uses \`__bool__\`, or else \`__len__() != 0\`. So most containers never write \`__bool__\` — define \`__len__\` and empty containers are automatically falsy.` },
      ],
    },
    alt: 'Diagram mapping six pieces of syntax on the left to container special methods on the right: len to __len__, indexing to __getitem__, for to __iter__, in to __contains__, reversed to __reversed__, and if to __bool__. Dashed fallback arrows show for falling back to __getitem__ until IndexError, in falling back to iteration, reversed falling back to __len__ plus __getitem__, and truthiness falling back to __len__.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Python never checks "is this a list?" before running \`len(x)\` or \`for item in x\`. It just looks for the right special method on \`x\`'s class. That's why strings, lists, dicts, sets, files, \`range\` objects and your \`Playlist\` all work in a \`for\` loop: each has an \`__iter__\` (or a usable \`__getitem__\`).`,
      py`Most container classes don't store items themselves — they **wrap** a list, dict or deque and *delegate*: \`__len__\` returns \`len(self._items)\`, \`__getitem__\` returns \`self._items[index]\`. You write a tiny amount of code and inherit the speed and correctness of the built-in.`,
    ],
    technical: [
      py`**Slices.** \`c[a:b:s]\` creates \`slice(a, b, s)\` (any part may be \`None\`) and passes it as the single key. If you store items in something that doesn't understand slices, \`key.indices(len(self))\` converts the slice into concrete \`(start, stop, step)\` numbers, with negatives and \`None\` resolved: \`slice(-3, None).indices(10)\` → \`(7, 10, 1)\`, ready for \`range(*...)\`. Commas create tuples, so \`grid[2, 5]\` passes \`(2, 5)\` and \`grid[1:3, 0]\` passes \`(slice(1, 3, None), 0)\`.`,
      py`**Iteration.** \`iter(c)\` calls \`type(c).__iter__(c)\`, which must return an **iterator** — an object with \`__next__\` (and an \`__iter__\` returning itself). If there's no \`__iter__\` but there is \`__getitem__\`, \`iter()\` returns a built-in sequence iterator that calls \`__getitem__\` with 0, 1, 2… and stops at \`IndexError\` (any other exception, such as \`KeyError\`, propagates). Setting \`__iter__ = None\` in a class explicitly disables iteration, fallback included. See [iterators](lesson:iterators) and [generators](lesson:generators).`,
      py`**Membership.** \`x in c\` calls \`__contains__\` and converts the result to \`bool\`. Without it, Python iterates and tests \`item is x or item == x\` for each item. For a container backed by a set or dict, a custom \`__contains__\` turns a linear scan into a hash lookup — see [performance](lesson:performance).`,
      py`**ABCs.** \`collections.abc\` splits the protocols into small interfaces. Some are *structural*: \`isinstance(x, Sized)\` is \`True\` for any class with \`__len__\`; \`Iterable\`, \`Container\`, \`Reversible\` and \`Hashable\` work the same way. The richer ones (\`Sequence\`, \`Mapping\`) are **nominal** — your class must inherit from them or be registered with \`Sequence.register(MyClass)\`. Note that \`Iterable\` only checks for \`__iter__\`: a class iterable through the \`__getitem__\` fallback is *not* detected, so the documentation recommends calling \`iter(x)\` to test iterability.`,
      { code: py`from collections.abc import MutableMapping


class Settings(MutableMapping):
    """A dict-like object that stores keys in lower case."""

    def __init__(self, data=()):
        self._data = {}
        self.update(data)             # update() is a free mixin method

    def __getitem__(self, key):
        return self._data[key.lower()]

    def __setitem__(self, key, value):
        self._data[key.lower()] = value

    def __delitem__(self, key):
        del self._data[key.lower()]

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)


s = Settings({"Theme": "dark"})
s.setdefault("FONT", "mono")          # mixin, uses our __getitem__/__setitem__
print(dict(s.items()), "THEME" in s)  # {'theme': 'dark', 'font': 'mono'} True`, lang: 'python', title: 'five methods in, a full mapping out' },
      { callout: 'note', title: 'CPython detail', text: py`CPython has two C-level slots for indexing: one for sequences (\`sq_item\`) and one for mappings (\`mp_subscript\`). A Python class that defines \`__getitem__\` fills both with the same wrapper, which is why one method serves \`c[0]\` and \`c["key"]\` alike. \`len()\` must return a value that fits in a C \`Py_ssize_t\`; a \`__len__\` returning something bigger than \`sys.maxsize\` raises \`OverflowError: cannot fit 'int' into an index-sized integer\`. Other implementations organise this differently but expose the same Python behaviour.` },
    ],
    production: [
      py`**Prefer composition or \`collections.abc\` over subclassing \`list\`/\`dict\`.** The built-ins' own methods are written in C and generally don't call your overrides: a \`dict\` subclass with a custom \`__setitem__\` is silently bypassed by \`dict.__init__\`, \`update()\` and \`setdefault()\`. If you need dict-like behaviour with custom rules, use \`MutableMapping\` (every mixin goes through your five methods) or \`collections.UserDict\` / \`UserList\`, which are designed for subclassing.`,
      py`**The mixins are generic, not fast.** \`Sequence.__contains__\` and \`.index()\` scan from the start; \`Sequence.__iter__\` calls \`__getitem__\` once per item. Override them with delegating versions when performance matters.`,
      py`**Be careful when returning internals.** \`def items(self): return self._items\` hands out your private list — callers can mutate it. Return a copy, a tuple, or an iterator.`,
      py`**Type hints.** The ABCs are generic: \`class Playlist(Sequence[str])\` documents the item type and lets type checkers check \`playlist[0].upper()\`. For "anything with \`__len__\` and \`__getitem__\`" use the ABCs or a \`typing.Protocol\` — see [protocols](lesson:protocols) and [generics](lesson:generics).`,
      py`**Don't change a container while iterating it.** Built-in dicts and sets detect this and raise \`RuntimeError: dictionary changed size during iteration\`; lists silently skip items. Your own containers inherit whatever their inner storage does — document it, or iterate over a snapshot.`,
    ],
  },
  mistakes: [
    {
      title: 'Subclassing dict and expecting every write to go through your __setitem__',
      wrong: { code: py`class LowerDict(dict):
    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)


d = LowerDict(Theme="dark")      # __init__ bypasses __setitem__
d.update(Font="mono")            # so does update()
d["Size"] = 12
print(d)                         # {'Theme': 'dark', 'Font': 'mono', 'size': 12}`, lang: 'python' },
      right: { code: py`from collections import UserDict


class LowerDict(UserDict):
    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)


d = LowerDict(Theme="dark")
d.update(Font="mono")
d["Size"] = 12
print(d)                         # {'theme': 'dark', 'font': 'mono', 'size': 12}`, lang: 'python' },
      explanation: py`\`dict\`'s C methods write to the hash table directly. \`UserDict\` and \`MutableMapping\` implement \`update\`, \`setdefault\` and the constructor *in terms of* \`__setitem__\`, so your rule is applied everywhere.`,
    },
    {
      title: '__getitem__ that never raises IndexError',
      wrong: { code: py`class Countdown:
    def __init__(self, start):
        self.start = start

    def __getitem__(self, index):
        if index <= self.start:
            return self.start - index
        return None                    # "nothing here" — but for-loops never stop!

# for n in Countdown(3): ...           # 3, 2, 1, 0, None, None, None, ... forever`, lang: 'python' },
      right: { code: py`class Countdown:
    def __init__(self, start):
        self.start = start

    def __getitem__(self, index):
        if index <= self.start:
            return self.start - index
        raise IndexError("countdown finished")


for n in Countdown(3):
    print(n)                           # 3 2 1 0`, lang: 'python' },
      explanation: py`The sequence-protocol fallback only stops on \`IndexError\`. Returning \`None\` (or raising \`KeyError\`/\`ValueError\`) turns \`for\`, \`list()\` and \`in\` into an infinite loop or a crash.`,
    },
    {
      title: 'Bounds-checking a key that might be a slice',
      wrong: { code: py`class Playlist:
    def __init__(self, songs):
        self._songs = list(songs)

    def __getitem__(self, index):
        if index >= len(self._songs):          # slice >= int -> TypeError
            raise IndexError("no song there")
        return self._songs[index]`, lang: 'python' },
      right: { code: py`class Playlist:
    def __init__(self, songs):
        self._songs = list(songs)

    def __getitem__(self, index):
        if isinstance(index, slice):
            return Playlist(self._songs[index])
        return self._songs[index]               # the list already raises IndexError`, lang: 'python' },
      explanation: py`\`playlist[0:2]\` passes a \`slice\` object, and \`slice >= int\` raises \`TypeError: '>=' not supported between instances of 'slice' and 'int'\`. Branch on \`isinstance(index, slice)\` first — and let the inner list do the range checking.`,
    },
    {
      title: '__iter__ that returns self from a container',
      wrong: { code: py`class Queue:
    def __init__(self, jobs):
        self.jobs = list(jobs)
        self.position = 0

    def __iter__(self):
        return self                     # the container is its own iterator...

    def __next__(self):
        if self.position >= len(self.jobs):
            raise StopIteration
        self.position += 1
        return self.jobs[self.position - 1]


q = Queue(["a", "b"])
print(list(q), list(q))                 # ['a', 'b'] [] — second loop is empty`, lang: 'python' },
      right: { code: py`class Queue:
    def __init__(self, jobs):
        self.jobs = list(jobs)

    def __iter__(self):
        yield from self.jobs            # generator: a new iterator per loop


q = Queue(["a", "b"])
print(list(q), list(q))                 # ['a', 'b'] ['a', 'b']`, lang: 'python' },
      explanation: py`An **iterable** (a container) should hand out a *fresh* iterator each time; an **iterator** is a one-shot cursor. Mixing the two means the position is shared: a second loop, or a nested loop, sees an exhausted container.`,
    },
    {
      title: 'Exposing the inner list instead of being a container',
      wrong: { code: py`class Order:
    def __init__(self):
        self.items = []

order = Order()
order.items.append("tea")              # every caller depends on .items being a list
print(len(order.items))`, lang: 'python' },
      right: { code: py`class Order:
    def __init__(self):
        self._items = []

    def add(self, item):
        self._items.append(item)

    def __len__(self):
        return len(self._items)

    def __iter__(self):
        return iter(self._items)


order = Order()
order.add("tea")
print(len(order))`, lang: 'python' },
      explanation: py`Once callers reach into \`order.items\`, you can never change the storage (or add validation in \`add\`) without breaking them. A small container interface keeps the inside private.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'Playlist' object is not subscriptable`,
      cause: py`The class has no \`__getitem__\`, so \`playlist[0]\` can't work.`,
      fix: py`Add \`def __getitem__(self, index): return self._songs[index]\` (handle slices if you want them to return a Playlist).`,
    },
    {
      symptom: py`TypeError: 'Playlist' object is not iterable`,
      cause: py`Neither \`__iter__\` nor \`__getitem__\` is defined (or \`__iter__ = None\`).`,
      fix: py`Add \`def __iter__(self): return iter(self._songs)\` or a generator method.`,
    },
    {
      symptom: py`TypeError: argument of type 'Playlist' is not a container or iterable`,
      cause: py`\`x in playlist\` found no \`__contains__\`, \`__iter__\` or \`__getitem__\`.`,
      fix: py`Define \`__contains__\` (fast) or at least \`__iter__\`.`,
    },
    {
      symptom: py`TypeError: '>=' not supported between instances of 'slice' and 'int'`,
      cause: py`\`__getitem__\` compares the key with a number, but slicing passed a \`slice\` object.`,
      fix: py`Check \`isinstance(index, slice)\` first, or skip manual bounds checks and delegate to the inner list.`,
    },
    {
      symptom: py`A for loop over your object never ends (or yields endless None values).`,
      cause: py`No \`__iter__\`, so Python uses \`__getitem__(0, 1, 2, …)\` — and your \`__getitem__\` never raises \`IndexError\`.`,
      fix: py`Raise \`IndexError\` when the index is past the end, or define \`__iter__\`.`,
    },
    {
      symptom: py`TypeError: Can't instantiate abstract class Headers without an implementation for abstract methods '__delitem__', '__iter__'`,
      cause: py`You inherited from a \`collections.abc\` class (here \`MutableMapping\`) but haven't implemented all of its abstract methods.`,
      fix: py`Implement every method listed in the error. The table in the \`collections.abc\` docs lists them per ABC.`,
    },
    {
      symptom: py`KeyError: 0 when looping over a dict-like object`,
      cause: py`The class has \`__getitem__\` but no \`__iter__\`, so \`for\` tried \`obj[0]\`, \`obj[1]\`… on a mapping.`,
      fix: py`Define \`__iter__\` (yield the keys), or inherit from \`collections.abc.Mapping\`.`,
    },
  ],
  bestPractices: [
    'Wrap a built-in container and delegate (composition) instead of subclassing list or dict.',
    'Handle slices explicitly in __getitem__ and return an instance of your own class, like list slicing returns a list.',
    'Raise IndexError for out-of-range positions, KeyError for missing keys, TypeError for the wrong kind of key.',
    'Make __iter__ return a fresh iterator each call — delegate with iter(self._items) or write a generator method.',
    'Define __contains__ when you can answer faster than a linear scan (set or dict lookup).',
    'Inherit from collections.abc.Sequence / MutableMapping to get correct mixin methods and isinstance support for free.',
    'Use UserDict / UserList when you really need to subclass a dict or list and override its methods.',
    'Don\'t hand out your internal list or dict; return copies, tuples or iterators.',
  ],
  useCases: [
    'Domain collections: Playlist, Deck, Order with line items, Inventory.',
    'Bounded histories: the last N sensor readings, an undo stack, a log tail.',
    'Dict-like objects with rules: case-insensitive HTTP headers, settings with defaults, a cache with expiry.',
    'Lazy or virtual sequences: a paged API result, a file of fixed-size records, a range-like object.',
    'Grids and matrices addressed with grid[row, col].',
  ],
  comparison: {
    title: 'Four ways to build a custom container',
    headers: ['', 'plain class wrapping a list/dict', 'collections.abc base class', 'UserList / UserDict', 'subclass list / dict'],
    rows: [
      ['you write', 'every method you want', 'only the abstract methods', 'only the methods you change', 'only the methods you change'],
      ['free extras', 'none', 'index, count, get, items, update, pop…', 'the whole list/dict API', 'the whole list/dict API'],
      ['your overrides respected?', 'yes (it is all your code)', 'yes — mixins call your methods', 'yes — written in Python on top of your methods', 'often not: C methods bypass them'],
      ['isinstance(x, list/dict)', 'False', 'False (but True for the ABC)', 'False (but True for the ABC)', 'True'],
      ['speed', 'built-in speed for delegated calls', 'mixins are generic and slower', 'a little slower than the built-in', 'built-in speed'],
    ],
    note: py`Default choice: a plain class or an ABC. Subclass \`list\`/\`dict\` only to *add* methods, not to change how storing or reading works.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'container-protocols-q1',
      type: 'mcq',
      prompt: py`What does Python pass to \`Playlist.__getitem__\` when you write \`playlist[1:3]\`?`,
      options: [
        { text: 'Two arguments: 1 and 3', why: 'Square brackets always pass exactly one key. A slice expression is packed into one object.' },
        { text: 'The list [1, 2]', why: 'Python doesn\'t expand the range for you — your method decides what the slice means.' },
        'A slice object: slice(1, 3, None)',
        { text: 'It calls a separate __getslice__ method', why: '__getslice__ existed in Python 2 and was removed in Python 3. Slices now go through __getitem__.' },
      ],
      answer: 2,
      explanation: py`\`a:b:c\` inside brackets creates \`slice(a, b, c)\`; missing parts are \`None\`. Your \`__getitem__\` checks \`isinstance(index, slice)\` to tell slicing from indexing.`,
    },
    {
      id: 'container-protocols-q2',
      type: 'output',
      prompt: '`Squares` has no `__iter__` and no `__contains__`. What does this print?',
      code: py`class Squares:
    def __getitem__(self, i):
        if i >= 4:
            raise IndexError(i)
        return i * i


print(list(Squares()))
print(9 in Squares(), 5 in Squares())`,
      options: [
        { text: "TypeError: 'Squares' object is not iterable", why: 'With no __iter__, Python falls back to calling __getitem__ with 0, 1, 2, … until IndexError.' },
        '[0, 1, 4, 9]\nTrue False',
        { text: '[0, 1, 4, 9, 16]\nTrue False', why: '__getitem__(4) raises IndexError, which ends the iteration — 16 is never produced.' },
        { text: "[0, 1, 4, 9]\nTypeError: argument of type 'Squares' is not a container or iterable", why: '`in` uses the same __getitem__ fallback: it scans 0, 1, 4, 9 comparing with ==.' },
      ],
      answer: 1,
      explanation: py`The old sequence protocol: \`list()\` calls \`__getitem__(0..3)\` and stops at \`IndexError\`. \`in\` scans the same way: it finds \`9\`, and for \`5\` it reaches the end and returns \`False\`.`,
    },
    {
      id: 'container-protocols-q3',
      type: 'bug',
      prompt: '`mix[0]` works, but `mix[0:2]` crashes with a TypeError. Click the line that causes it.',
      code: py`class Playlist:
    def __init__(self, songs):
        self._songs = list(songs)

    def __len__(self):
        return len(self._songs)

    def __getitem__(self, index):
        if index >= len(self):
            raise IndexError("no song at that position")
        return self._songs[index]


mix = Playlist(["Africa", "Dreams", "Fast Car"])
print(mix[0])
print(mix[0:2])`,
      answerLine: 9,
      explanation: py`\`mix[0:2]\` passes \`slice(0, 2, None)\`, and \`slice >= int\` raises \`TypeError: '>=' not supported between instances of 'slice' and 'int'\`. The check is also unnecessary: the inner list already raises \`IndexError\`. Branch on \`isinstance(index, slice)\` instead.`,
    },
    {
      id: 'container-protocols-q4',
      type: 'fill',
      prompt: 'Fill in the blanks so `Shelf` gets `.index()`, `.count()`, `in` and `reversed()` for free while defining only two methods.',
      code: py`from collections.abc import Sequence


class Shelf(___):
    def __init__(self, books):
        self._books = list(books)

    def __len__(self):
        return len(self._books)

    def ___(self, index):
        return self._books[index]


shelf = Shelf(["Dune", "Emma"])
print(shelf.index("Emma"), "Dune" in shelf)`,
      answer: [['Sequence'], ['__getitem__']],
      explanation: py`\`collections.abc.Sequence\` has two abstract methods, \`__getitem__\` and \`__len__\`, and builds \`__contains__\`, \`__iter__\`, \`__reversed__\`, \`index\` and \`count\` on top of them. The program prints \`1 True\`.`,
    },
    {
      id: 'container-protocols-q5',
      type: 'output',
      prompt: 'Predict the output. (Careful with the second value.)',
      code: py`from collections.abc import Iterable


class Countdown:
    def __getitem__(self, i):
        if i > 2:
            raise IndexError
        return 2 - i


c = Countdown()
print(list(c), isinstance(c, Iterable))`,
      answer: '[2, 1, 0] False',
      accept: ['[2, 1, 0] False'],
      explanation: py`\`list(c)\` works through the \`__getitem__\` fallback. But \`Iterable\` only recognises classes that define \`__iter__\`, so the \`isinstance\` check says \`False\`. That's why the docs say the reliable test for "can I iterate this?" is to call \`iter(x)\` and catch \`TypeError\`.`,
    },
    {
      id: 'container-protocols-q6',
      type: 'mcq',
      prompt: 'You need a dict whose keys are always stored in lower case. Why is `class LowerDict(dict)` with an overridden `__setitem__` a poor choice?',
      options: [
        { text: 'Because dict cannot be subclassed', why: 'It can — and adding new methods to a dict subclass works fine.' },
        "Because dict's own methods (__init__, update, setdefault) are implemented in C and don't call your __setitem__, so some keys slip through unchanged",
        { text: 'Because __setitem__ is read-only on dict subclasses', why: 'You can override it; the problem is that other dict methods ignore your override.' },
        { text: 'Because subclasses of dict are always slower than UserDict', why: 'Speed isn\'t the issue — correctness is.' },
      ],
      answer: 1,
      explanation: py`\`LowerDict(Theme="dark")\` and \`d.update(Font="mono")\` store \`'Theme'\` and \`'Font'\` unchanged. \`collections.UserDict\` or \`collections.abc.MutableMapping\` route every write through \`__setitem__\`.`,
    },
    {
      id: 'container-protocols-q7',
      type: 'short',
      prompt: 'Why should a container\'s `__iter__` return a new iterator each time instead of returning `self`?',
      answer: py`An iterator is a one-shot cursor that remembers its position. If the container is its own iterator, every loop shares that position: after one full loop the container looks empty, and nested loops (\`for a in c: for b in c:\`) interfere. Returning a fresh iterator — \`iter(self._items)\` or a generator method — gives each loop its own independent position.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'reading-history',
      title: 'A sensor history that remembers the last N readings',
      difficulty: 'intermediate',
      prompt: py`\`ReadingHistory(size)\` keeps only the most recent \`size\` temperature readings; \`add()\` is already written. Make it a proper container:

- \`len(h)\` → how many readings are stored (never more than \`size\`); an empty history is falsy.
- \`h[i]\` → a reading by position, **oldest first** (\`h[0]\` oldest, \`h[-1]\` newest); out of range raises \`IndexError\`.
- \`h[a:b]\` → a plain **list** of readings.
- \`for r in h\` → oldest to newest; \`r in h\` → \`True\`/\`False\`.
- \`reversed(h)\` → newest to oldest.`,
      files: {
        'main.py': py`class ReadingHistory:
    def __init__(self, size):
        self.size = size
        self._readings = []

    def add(self, value):
        self._readings.append(value)
        if len(self._readings) > self.size:
            self._readings.pop(0)          # forget the oldest reading

    # TODO: __len__, __getitem__, __iter__, __contains__, __reversed__


history = ReadingHistory(3)
for value in [19.5, 20.0, 21.5, 22.0]:
    history.add(value)
print(history._readings)
`,
      },
      hints: [
        'Every method can delegate to self._readings — it already keeps the right items in the right order.',
        'The inner list already returns a list for slices and raises IndexError, so __getitem__ can be one line. __iter__ can return iter(self._readings).',
        '__contains__: return value in self._readings. __reversed__: return reversed(self._readings).',
      ],
      solution: {
        explanation: py`The history already stores readings oldest-first in a list, so each protocol method is a one-line delegation. The list handles negative indexes, slices (returning a list, as required) and \`IndexError\`. \`__len__\` also gives truthiness, so an empty history is falsy without writing \`__bool__\`. (For large sizes, \`collections.deque(maxlen=size)\` would forget old readings faster than \`list.pop(0)\`, but deques don't support slicing — a classic trade-off.)`,
        files: {
          'main.py': py`class ReadingHistory:
    def __init__(self, size):
        self.size = size
        self._readings = []

    def add(self, value):
        self._readings.append(value)
        if len(self._readings) > self.size:
            self._readings.pop(0)          # forget the oldest reading

    def __len__(self):
        return len(self._readings)

    def __getitem__(self, index):
        return self._readings[index]       # ints, negatives and slices

    def __iter__(self):
        return iter(self._readings)

    def __contains__(self, value):
        return value in self._readings

    def __reversed__(self):
        return reversed(self._readings)


history = ReadingHistory(3)
for value in [19.5, 20.0, 21.5, 22.0]:
    history.add(value)
print(len(history), history[0], history[-1], history[0:2])
print(list(reversed(history)), 22.0 in history)
`,
        },
      },
      tests: [
        { name: 'len() is capped at size; empty is falsy', code: py`h = ReadingHistory(3)
assert len(h) == 0 and not h
for v in [1, 2, 3, 4, 5]:
    h.add(v)
assert len(h) == 3 and h` },
        { name: 'indexing: oldest first, negatives work', code: py`h = ReadingHistory(3)
for v in [10, 20, 30, 40]:
    h.add(v)
assert h[0] == 20 and h[-1] == 40` },
        { name: 'out of range raises IndexError', code: py`h = ReadingHistory(2)
h.add(1)
with raises(IndexError):
    h[5]` },
        { name: 'slicing returns a list', code: py`h = ReadingHistory(4)
for v in [1, 2, 3, 4]:
    h.add(v)
assert h[1:3] == [2, 3] and isinstance(h[1:3], list)` },
        { name: 'iteration and in', code: py`h = ReadingHistory(3)
for v in [5, 6, 7, 8]:
    h.add(v)
assert list(h) == [6, 7, 8]
assert 8 in h and 5 not in h` },
        { name: 'reversed() is newest first', code: py`h = ReadingHistory(3)
for v in [1, 2, 3]:
    h.add(v)
assert list(reversed(h)) == [3, 2, 1]` },
      ],
    },
    {
      id: 'case-insensitive-headers',
      title: 'Case-insensitive HTTP headers with MutableMapping',
      difficulty: 'advanced',
      prompt: py`HTTP header names are case-insensitive: \`Content-Type\` and \`content-type\` are the same header. Build \`Headers\` by inheriting from \`collections.abc.MutableMapping\` and implementing its five abstract methods: \`__getitem__\`, \`__setitem__\`, \`__delitem__\`, \`__iter__\`, \`__len__\`.

Requirements:

- Lookups, \`in\`, \`del\` and assignment ignore case: after \`h["Content-Type"] = "json"\`, \`h["CONTENT-TYPE"] == "json"\`.
- Iterating yields each header name **with the casing used the last time it was set**: after \`h["accept"] = "a"\` then \`h["Accept"] = "b"\`, \`list(h) == ["Accept"]\`.
- Missing names raise \`KeyError\`.
- \`Headers({"Accept": "*/*"})\` fills the headers from a dict (the constructor argument is optional).
- Mixin methods — \`get\`, \`update\`, \`pop\`, \`items\`, \`setdefault\` — must work (they will, if your five methods are right).`,
      files: {
        'main.py': py`from collections.abc import MutableMapping


class Headers(MutableMapping):
    def __init__(self, data=None):
        self._store = {}       # lower-case name -> (original name, value)
        # TODO: copy data in (hint: a mixin method can do it)

    # TODO: __getitem__, __setitem__, __delitem__, __iter__, __len__


print(Headers.__abstractmethods__)
`,
      },
      hints: [
        'Store self._store[name.lower()] = (name, value). Reading looks up name.lower() and returns the value part of the tuple.',
        '__iter__ yields the original names: for original, _ in self._store.values(): yield original. __len__ is len(self._store).',
        'In __init__, call self.update(data) when data is given — update() is a MutableMapping mixin that calls your __setitem__ for each pair.',
      ],
      solution: {
        explanation: py`The private dict is keyed by the **lower-cased** name, so every lookup, assignment and deletion that lower-cases its argument hits the same entry. Each value is stored together with the most recent original spelling, which \`__iter__\` yields. Because \`MutableMapping\` builds \`get\`, \`pop\`, \`update\`, \`setdefault\`, \`items\`, \`__contains__\` and \`__eq__\` on top of these five methods, they all become case-insensitive automatically — unlike a \`dict\` subclass, where C methods would bypass your rules. (The popular \`requests\` library ships a similar \`CaseInsensitiveDict\`.)`,
        files: {
          'main.py': py`from collections.abc import MutableMapping


class Headers(MutableMapping):
    def __init__(self, data=None):
        self._store = {}       # lower-case name -> (original name, value)
        if data is not None:
            self.update(data)  # mixin: calls __setitem__ for each pair

    def __getitem__(self, name):
        return self._store[name.lower()][1]

    def __setitem__(self, name, value):
        self._store[name.lower()] = (name, value)

    def __delitem__(self, name):
        del self._store[name.lower()]

    def __iter__(self):
        for original, _ in self._store.values():
            yield original

    def __len__(self):
        return len(self._store)

    def __repr__(self):
        return f"Headers({dict(self.items())!r})"


h = Headers({"Accept": "*/*"})
h["content-type"] = "application/json"
print(h["CONTENT-TYPE"], "accept" in h, h)
`,
        },
      },
      tests: [
        { name: 'lookups ignore case', code: py`h = Headers()
h["Content-Type"] = "json"
assert h["content-type"] == "json" and h["CONTENT-TYPE"] == "json"
assert "content-TYPE" in h` },
        { name: 'iteration keeps the latest casing', code: py`h = Headers()
h["accept"] = "a"
h["Accept"] = "b"
assert list(h) == ["Accept"] and h["ACCEPT"] == "b" and len(h) == 1` },
        { name: 'delete ignores case; missing names raise KeyError', code: py`h = Headers({"X-Token": "abc"})
del h["x-token"]
assert len(h) == 0
with raises(KeyError):
    h["X-Token"]
with raises(KeyError):
    del h["nope"]` },
        { name: 'constructor accepts a dict', code: py`h = Headers({"Accept": "*/*", "Host": "example.com"})
assert h["host"] == "example.com" and len(h) == 2` },
        { name: 'mixin methods work', code: py`h = Headers({"Accept": "*/*"})
assert h.get("ACCEPT") == "*/*" and h.get("missing", "none") == "none"
h.update({"HOST": "a.example"})
assert h["host"] == "a.example"
assert h.setdefault("accept", "x") == "*/*"
assert h.pop("Host") == "a.example" and "host" not in h
assert dict(h.items()) == {"Accept": "*/*"}` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'container-protocols-slicing',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How does `obj[2:8:2]` reach your class, and how should __getitem__ handle slices?',
      answer: 'Python builds slice(2, 8, 2) and calls type(obj).__getitem__(obj, that_slice). Check isinstance(key, slice); delegate to an inner sequence or use key.indices(len(self)) to get concrete start/stop/step, and return an instance of your own class. Ints go down the other branch; raise IndexError when out of range.',
      explanation: py`There is no separate slicing method in Python 3 (\`__getslice__\` was removed). Multi-dimensional keys like \`grid[1:3, 0]\` arrive as a tuple containing a slice. \`slice.indices()\` resolves negatives and \`None\` against the length, ready for \`range(*key.indices(n))\`.`,
      whyAsked: 'Slicing is where many hand-written containers break; it also shows whether you know about slice objects and indices().',
      mistakes: ['Mentioning __getslice__ (Python 2 only)', 'Comparing the key with ints before checking for slices', 'Returning a plain list from slicing a custom sequence without thinking about it'],
      followUps: ['What does grid[1, 2] pass?', 'How would you support slicing on a linked list?', 'Should slicing copy or create a view?'],
      modelAnswer: 'Square brackets always pass one object to __getitem__. For obj[2:8:2] Python creates slice(2, 8, 2), with None for any missing part, and calls type(obj).__getitem__ with it. So my __getitem__ first checks isinstance(key, slice). If I wrap a list, I just slice the list and wrap the result in my own class, the way list slicing returns a list. If my storage can\'t slice, key.indices(len(self)) gives me normalised start, stop and step for a range. Integers go to the other branch, and out-of-range positions raise IndexError.',
    },
    {
      id: 'container-protocols-mapping-iteration',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What happens when this loop runs, and why?',
      code: { lang: 'python', code: py`class Config:
    def __init__(self, data):
        self._data = dict(data)

    def __getitem__(self, key):
        return self._data[key]


config = Config({"host": "db", "port": 5432})
print(config["host"])
for key in config:
    print(key)` },
      options: [
        'Prints db, then host and port',
        'Prints db, then raises KeyError: 0',
        "Prints db, then raises TypeError: 'Config' object is not iterable",
        'Prints db, then the loop runs forever',
      ],
      correctOption: 1,
      answer: 'It prints db, then raises KeyError: 0. With no __iter__, for falls back to the sequence protocol and calls __getitem__(0); the dict lookup raises KeyError, and only IndexError would end the loop quietly.',
      explanation: py`Having \`__getitem__\` makes an object iterable via the old sequence protocol, which assumes integer positions from 0. That's wrong for mappings. Fix: define \`__iter__\` (yielding keys), or inherit from \`collections.abc.Mapping\`, which provides \`__iter__\`-based \`keys\`, \`items\`, \`__contains__\` and \`get\`.`,
      whyAsked: 'Shows deep knowledge of iteration fallbacks — and an understanding of why mapping-like classes need __iter__.',
      mistakes: ['Answering TypeError: not iterable', 'Believing the loop would iterate over the dict keys automatically'],
      followUps: ['Which exceptions end the sequence-protocol iteration?', 'How do you make a class explicitly non-iterable? (__iter__ = None)', 'What does Mapping require?'],
      modelAnswer: 'It prints db and then raises KeyError: 0. The class has __getitem__ but no __iter__, so the for loop uses the old sequence protocol: it calls __getitem__ with 0, 1, 2 and stops only on IndexError. Here __getitem__(0) looks up the key 0 in the dict, which raises KeyError, and that propagates out of the loop. A mapping-like class needs an __iter__ that yields its keys — or should inherit from collections.abc.Mapping, which also gives keys, items, get and in for free.',
    },
    {
      id: 'container-protocols-dict-subclass',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate subclassed dict to strip whitespace from keys by overriding __setitem__. In production some keys still have spaces. Why, and what do you recommend?',
      answer: 'dict\'s C-implemented methods — the constructor, update(), setdefault(), and others — write to the table directly and don\'t call the overridden __setitem__. Use collections.UserDict or collections.abc.MutableMapping, where every write path goes through __setitem__.',
      explanation: py`CPython's built-in types are optimised C code; their methods call internal C functions, not your Python overrides. That's not a promise the language makes either way, so code must not rely on it. \`UserDict\` stores data in \`self.data\` and implements its API in Python on top of your special methods; \`MutableMapping\` mixins likewise call \`self[key] = value\`.`,
      code: { lang: 'python', code: py`class StripDict(dict):
    def __setitem__(self, key, value):
        super().__setitem__(key.strip(), value)


d = StripDict({" host ": "db"})
d.update({" port ": 5432})
d[" user "] = "ada"
print(list(d))      # [' host ', ' port ', 'user']` },
      whyAsked: 'A real-world bug that tests knowledge of the gap between built-in types and Python-level subclasses.',
      mistakes: ['Fixing only update() and missing setdefault() and the constructor', 'Assuming super() calls route back through the override'],
      followUps: ['Which list methods have the same problem?', 'When is subclassing dict still fine? (adding methods, __missing__)', 'What does __missing__ do?'],
      modelAnswer: 'The override only runs for d[key] = value. dict\'s constructor, update, setdefault and friends are implemented in C and store items directly, so they never call the Python-level __setitem__ — keys passed through them keep their spaces. I\'d rewrite it on collections.abc.MutableMapping, implementing the five abstract methods around a private dict; then every mixin method routes through my __setitem__. UserDict is the other option if we want the full dict API with minimal code. Subclassing dict is fine for adding new methods or using __missing__, but not for changing how items are stored.',
    },
    {
      id: 'container-protocols-contains-speed',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your `Blocklist` class wraps a list of 200,000 email addresses and only defines __iter__. Checks like `email in blocklist` are slow. Why, and how do you fix it without changing callers?',
      answer: 'Without __contains__, `in` falls back to iterating and comparing every item — a linear scan in Python-level iteration. Store the addresses in a set (or keep a set alongside the list) and define __contains__ to do a hash lookup.',
      explanation: py`Membership fallbacks are O(n). A set lookup hashes the value and checks one bucket, on average O(1). The interface (\`email in blocklist\`) stays the same; only the internals change — exactly the benefit of being a container instead of exposing \`.emails\`. Normalise (lower-case) emails on the way in so lookups are consistent.`,
      code: { lang: 'python', code: py`class Blocklist:
    def __init__(self, emails):
        self._emails = {email.lower() for email in emails}

    def __contains__(self, email):
        return email.lower() in self._emails       # hash lookup

    def __iter__(self):
        return iter(sorted(self._emails))

    def __len__(self):
        return len(self._emails)


blocked = Blocklist(["spam@example.com", "Bot@Example.com"])
print("bot@example.com" in blocked, len(blocked))   # True 2` },
      whyAsked: 'Connects protocol fallbacks to algorithmic complexity — a common performance interview angle.',
      mistakes: ['Suggesting a faster loop instead of a different data structure', 'Forgetting that sets require hashable items', 'Changing the callers to use a new method name'],
      followUps: ['What if items aren\'t hashable?', 'How would you keep insertion order as well? (dict keys)', 'How would you measure the difference? (timeit)'],
      modelAnswer: 'Because there\'s no __contains__, Python answers email in blocklist by iterating through all 200,000 items and comparing each with ==, so every check is a linear scan. I\'d store the addresses in a set, normalised to lower case, and define __contains__ to do a hash lookup, which is constant time on average. Callers keep writing email in blocklist, so nothing else changes — that\'s the benefit of implementing the protocol instead of exposing the raw list. I\'d confirm the improvement with timeit.',
    },
    {
      id: 'container-protocols-abc-vs-manual',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare implementing a sequence by hand, inheriting from collections.abc.Sequence, and subclassing list.',
      answer: 'By hand: full control, only what you write exists. Sequence ABC: write __getitem__ and __len__, get __iter__, __contains__, __reversed__, index and count, plus isinstance(x, Sequence); mixins are generic linear scans. Subclassing list: the whole list API at C speed, but your overrides are bypassed by other list methods and the object is a list everywhere.',
      explanation: py`ABCs are the sweet spot for most custom containers: correct, consistent and recognisable via \`isinstance\`. Override mixins only where you can do better. Subclass \`list\` mainly to add behaviour, not to change how items are stored.`,
      whyAsked: 'Tests design judgement and knowledge of the standard library\'s container toolkit.',
      mistakes: ['Thinking ABCs provide storage', 'Not knowing which methods are abstract', 'Ignoring the override-bypass problem with list/dict subclasses'],
      followUps: ['What does MutableSequence require?', 'What is Sequence.register for?', 'How do typing Protocols relate to ABCs?'],
      modelAnswer: 'Writing everything by hand gives me full control but I have to implement each method myself. Inheriting from collections.abc.Sequence means I write __getitem__ and __len__ and get __iter__, __contains__, __reversed__, index and count for free, and isinstance(x, Sequence) works — though the mixins are generic and do linear scans, so I override them when I can do better. Subclassing list gives me the full list API at C speed, but list\'s own methods don\'t call my overrides, and my object is a list everywhere, which can leak the wrong behaviour. For most domain containers I choose the ABC.',
    },
    {
      id: 'container-protocols-grid',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `Grid(rows, cols, fill=".")` addressed as `grid[row, col]` for reading and writing. Out-of-bounds or negative positions raise IndexError; `len(grid)` is rows × cols; `"X" in grid` tells whether any cell holds that value.',
      answer: 'Store a list of row lists. __getitem__/__setitem__ unpack the (row, col) tuple key, validate both against the bounds, then index. __len__ returns rows * cols; __contains__ checks each row.',
      explanation: py`\`grid[1, 2]\` passes the tuple \`(1, 2)\` as one key, so \`row, col = key\` unpacks it. Negative indexes are rejected explicitly, because for a grid "-1" is more likely a bug than "last column".`,
      starter: { files: { 'main.py': py`class Grid:
    def __init__(self, rows, cols, fill="."):
        self.rows = rows
        self.cols = cols
        self._cells = [[fill] * cols for _ in range(rows)]

    # TODO: __getitem__, __setitem__ (key is a (row, col) tuple), __len__, __contains__


board = Grid(3, 3)
print(board._cells)
` } },
      tests: [
        { name: 'get and set with (row, col)', code: py`g = Grid(2, 3)
assert g[0, 0] == "."
g[1, 2] = "X"
assert g[1, 2] == "X" and g[0, 2] == "."` },
        { name: 'out of bounds raises IndexError', code: py`g = Grid(2, 2)
for bad in [(2, 0), (0, 2), (-1, 0), (0, -1)]:
    with raises(IndexError):
        g[bad]
with raises(IndexError):
    g[5, 5] = "X"` },
        { name: 'len is rows * cols', code: py`assert len(Grid(3, 4)) == 12` },
        { name: 'in checks cell values', code: py`g = Grid(2, 2)
assert "X" not in g
g[0, 1] = "X"
assert "X" in g` },
      ],
      solution: { files: { 'main.py': py`class Grid:
    def __init__(self, rows, cols, fill="."):
        self.rows = rows
        self.cols = cols
        self._cells = [[fill] * cols for _ in range(rows)]

    def _check(self, key):
        row, col = key
        if not (0 <= row < self.rows and 0 <= col < self.cols):
            raise IndexError(f"cell {key} is outside a {self.rows}x{self.cols} grid")
        return row, col

    def __getitem__(self, key):
        row, col = self._check(key)
        return self._cells[row][col]

    def __setitem__(self, key, value):
        row, col = self._check(key)
        self._cells[row][col] = value

    def __len__(self):
        return self.rows * self.cols

    def __contains__(self, value):
        return any(value in row for row in self._cells)


board = Grid(3, 3)
board[1, 1] = "X"
print(board[1, 1], "X" in board, len(board))
` } },
      hints: ['grid[1, 2] calls __getitem__ with the tuple (1, 2): unpack it with row, col = key.', 'Write one helper that validates both coordinates (0 <= row < rows) and raises IndexError; use it in both __getitem__ and __setitem__.'],
      whyAsked: 'Checks that you know what square brackets actually pass and can design a clean, validated container interface.',
      mistakes: ['Expecting __getitem__(self, row, col) with two parameters', 'Allowing negative indexes to wrap silently', 'Using [[fill] * cols] * rows, which shares one row list between all rows'],
      followUps: ['How would you support grid[1] returning a whole row?', 'How would you add slicing like grid[0:2, 1]?', 'Why is [[fill] * cols] * rows a bug?'],
      modelAnswer: 'Square brackets pass a single key, so grid[1, 2] hands __getitem__ the tuple (1, 2). I store a list of rows, built with a comprehension so each row is a separate list, and write a small _check helper that unpacks the tuple, rejects anything outside 0 to rows or cols — including negatives, which in a grid are almost always bugs — and raises IndexError. __getitem__ and __setitem__ both use it. __len__ returns rows times cols, and __contains__ checks whether any row contains the value.',
    },
    {
      id: 'container-protocols-iterable-vs-iterator',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between an iterable and an iterator, and which one should a container class be?',
      answer: 'An iterable has __iter__ that returns an iterator; an iterator has __next__ (and __iter__ returning itself) and keeps the current position. A container should be an iterable whose __iter__ returns a fresh iterator each time — never itself — so multiple and nested loops work.',
      explanation: py`Iterators are deliberately one-shot (files, generators). Containers must support many independent passes. A generator method as \`__iter__\` is the simplest correct implementation: each call creates a new generator object with its own position. See [iterators](lesson:iterators).`,
      code: { lang: 'python', code: py`class Deck:
    def __init__(self, cards):
        self._cards = list(cards)

    def __iter__(self):                 # iterable: a new generator every call
        for card in self._cards:
            yield card


deck = Deck(["A", "K"])
print([(a, b) for a in deck for b in deck])   # all 4 pairs` },
      whyAsked: 'Fundamental to designing containers and to debugging "my second loop is empty" bugs.',
      mistakes: ['Saying they are the same thing', 'Making the container its own iterator', 'Forgetting that generators are iterators (one-shot)'],
      followUps: ['Why do iterators implement __iter__ at all?', 'What does iter() do with a class that only has __getitem__?', 'How do you make a re-iterable lazy object?'],
      modelAnswer: 'An iterable is anything you can ask for an iterator: it has __iter__, or the old __getitem__ protocol. An iterator is the cursor itself: __next__ returns the next item or raises StopIteration, and its __iter__ returns itself so it can be used in for loops. Iterators are one-shot by design. A container should be an iterable whose __iter__ hands out a fresh iterator every time, so two loops — or nested loops — each have their own position. The simplest way is to write __iter__ as a generator method, or return iter(self._items).',
    },
  ],

  takeaways: [
    'Containers are protocols, not a base class: __len__, __getitem__, __setitem__, __delitem__, __iter__, __contains__ and __reversed__ plug into len(), [], for, in and reversed().',
    'Square brackets pass one key: an int, a slice object (c[1:3]), a tuple (c[1, 2]) or any key — handle slices explicitly.',
    'Raise IndexError for bad positions and KeyError for missing keys; the for-loop fallback stops only on IndexError.',
    'Fallbacks: no __iter__ → __getitem__(0, 1, 2…); no __contains__ → a linear scan; no __reversed__ → __len__ + __getitem__; no __bool__ → __len__.',
    '__iter__ should return a fresh iterator each time (iter(self._items) or a generator method).',
    'Wrap a list/dict (composition) or inherit from collections.abc / UserDict — subclassing dict or list lets C methods bypass your overrides.',
  ],
}
