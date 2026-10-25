// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const REGISTER = py`import copy

# One class register, several ways to "copy" it
register = {"class": "7B", "students": ["Ada", "Ben"]}

alias = register                       # same object, second name
shallow = register.copy()              # new outer dict, SAME inner list
deep = copy.deepcopy(register)         # new dict AND new list

register["students"].append("Cy")      # mutate the shared inner list
register["class"] = "8B"               # replace one value in the original

print("alias:  ", alias)
print("shallow:", shallow)
print("deep:   ", deep)
print("shallow shares the list?", shallow["students"] is register["students"])

# The grid trap
bad_grid = [[0] * 3] * 3                  # three references to ONE row
good_grid = [[0] * 3 for _ in range(3)]   # three separate rows
bad_grid[0][0] = 1
good_grid[0][0] = 1
print("bad: ", bad_grid)
print("good:", good_grid)

# += changes a list in place, but builds a new tuple
scores = [1, 2]
same = scores
scores += [3]
point = (1, 2)
also = point
point += (3,)
print(same, also)
`

export default {
  id: 'mutability-and-copying',
  title: 'Mutability, aliasing & copying',
  summary: 'Some objects can change in place and some can\'t; several names can share one object; and a copy can be shallow (new outer container) or deep (new everything) — knowing which you have prevents a whole family of bugs.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['variables-and-names', 'lists', 'tuples-and-unpacking', 'dictionaries'],
  related: ['variables-and-names', 'none-and-truthiness', 'function-arguments', 'object-model', 'functional-concepts', 'memory-management', 'dataclasses'],
  tags: ['mutable', 'immutable', 'mutability', 'aliasing', 'alias', 'reference', 'copy', 'shallow copy', 'deep copy', 'deepcopy', 'copy module', 'is', 'id', 'identity', 'grid trap', 'list multiplication', 'augmented assignment', '+=', 'mutable default argument', 'call by sharing'],
  apis: [
    { name: 'copy.copy(x)', summary: 'Shallow copy: a new outer object whose items are the SAME objects as before.' },
    { name: 'copy.deepcopy(x)', summary: 'Deep copy: recursively copies every mutable object inside, preserving shared references and cycles.' },
    { name: 'list.copy() / list(x) / x[:]', summary: 'Shallow copies of a list.' },
    { name: 'dict.copy() / dict(d)', summary: 'Shallow copies of a dict.' },
    { name: 'a is b', summary: 'True if a and b are the very same object (identity).' },
    { name: 'id(obj)', summary: 'An integer identity that is unique among objects alive at the same time.' },
    { name: 'types.MappingProxyType(d)', summary: 'A read-only view of a dict.' },
  ],
  docs: [
    { label: 'copy — shallow and deep copy operations', url: 'https://docs.python.org/3/library/copy.html' },
    { label: 'Data model — objects, values and types', url: 'https://docs.python.org/3/reference/datamodel.html#objects-values-and-types' },
    { label: 'Programming FAQ — why did changing list y also change list x?', url: 'https://docs.python.org/3/faq/programming.html#why-did-changing-list-y-also-change-list-x' },
    { label: 'Programming FAQ — how do I create a multidimensional list?', url: 'https://docs.python.org/3/faq/programming.html#how-do-i-create-a-multidimensional-list' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every Python object is either **mutable** — it can change *in place* after it's created (lists, dicts, sets) — or **immutable** — it can never change, so every "change" really builds a new object (ints, floats, strings, tuples, frozensets).`,
    py`Combine that with what you learned in [variables](lesson:variables-and-names) — names are tags on objects, and assignment never copies — and you get **aliasing**: two names, one object. With immutable objects, aliasing is harmless. With mutable ones, a change made through one name shows up through the other.`,
    py`When you *want* an independent object you have to ask for a **copy**, and there are two strengths: a **shallow** copy makes a new outer container but shares everything inside it, while a **deep** copy duplicates the whole structure, all the way down.`,
  ],
  why: [
    py`"I changed my backup and the original changed too." "Every row of my game board updates at once." "This function's default list keeps growing." These are among the most common bugs Python beginners — and plenty of professionals — hit. They all have the same root cause: two places sharing one mutable object without realising it.`,
    py`Once you can *see* which names point at which objects, these bugs become obvious, and you can choose deliberately: share when sharing is what you want (it's fast and saves memory), copy when you need independence, and prefer immutable data when you want neither to matter.`,
  ],
  eli15: [
    py`Imagine a **shared online document**. If your friend sends you the *link*, you're both looking at the same document: when they type, you see it. That's aliasing — two names, one object.`,
    py`If they **download a copy** and send you the file, you each have your own; edits don't travel. That's a copy. But if the document contains a *link to a spreadsheet*, your copy still contains the same link — open it and you're both editing the same spreadsheet. That's a **shallow** copy. A **deep** copy would duplicate the spreadsheet too.`,
    py`Immutable things are like a **printed photo**: nobody can draw on it. Sharing it is always safe.`,
  ],
  analogy: {
    title: 'A shared document, a downloaded copy, and the links inside it',
    body: [
      py`Sharing a link to a document gives two people the *same* document. Downloading a copy gives you your own document — but any links inside it (to a spreadsheet, a photo album) still point at the originals. Only a "copy everything, including linked files" export gives you a fully independent bundle.`,
      py`Python works exactly like that. A name is a link. A shallow copy duplicates the outer container but keeps the inner links. \`copy.deepcopy\` follows every link and duplicates what it finds — while being smart enough not to duplicate the same thing twice.`,
    ],
    mapping: [
      ['sharing the link to a document', 'aliasing: b = a'],
      ['a document no one can edit (a printed photo)', 'an immutable object: int, str, tuple'],
      ['downloading a copy of the document', 'a shallow copy: a.copy(), list(a), a[:], dict(d)'],
      ['links inside the copy still open the originals', 'nested objects are shared by a shallow copy'],
      ['"export with all linked files"', 'copy.deepcopy(a)'],
      ['checking whether two links open the same file', 'a is b'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Aliases, shallow copies and deep copies — drawn as arrows',
    props: {
      code: py`import copy

a = [1, 2]
b = a
b.append(3)
c = a.copy()
c.append(4)

nested = [[1], [2]]
shallow = nested.copy()
shallow[0].append(99)
deep = copy.deepcopy(nested)
deep[1].append(7)

t = (0, [5])
t[1].append(6)
print(a, c, nested, deep, t)
`,
      inline: false,
      notes: {
        4: '`b = a` copies the **arrow**: `a` and `b` now point at the same list.',
        5: 'Appending through `b` changes the one list both names share.',
        6: '`a.copy()` builds a **new** outer list — but its slots point at the same int objects. Ints are immutable, so sharing them is harmless.',
        10: 'A shallow copy of a list of lists: a new outer list whose slots point at the **same inner lists**.',
        11: 'So appending to `shallow[0]` also changes `nested[0]` — it is the same inner list.',
        12: '`deepcopy` recursively copies the inner lists too. Its arrows lead to brand-new lists.',
        13: 'Changing the deep copy\'s inner list leaves `nested` untouched.',
        16: 'The tuple can\'t change which objects it holds — but the list it holds is mutable.',
      },
    },
    alt: 'A step-by-step trace drawing every name and object, including ints, as separate boxes. a and b both point to one list, which gains 3. c points to a new list built by copy, sharing the int objects. nested and shallow are two different outer lists whose slots point to the same two inner lists, so appending 99 through shallow changes nested too. deep points to a new outer list with new inner lists, so appending 7 there does not affect nested. Finally a tuple holds a list that gains a 6.',
    caption: py`This trace draws ints and strings as separate objects (\`inline: false\`) so you can see every arrow. Follow the arrows, not the names: **two arrows into one box means a change through either is visible through both**.`,
  },
  syntax: [
    py`#### Mutable vs immutable built-ins`,
    py`| immutable (can't change in place) | mutable (can change in place) |
|---|---|
| \`int\`, \`float\`, \`complex\`, \`bool\` | \`list\` |
| \`str\`, \`bytes\` | \`dict\` |
| \`tuple\` | \`set\` |
| \`frozenset\` | \`bytearray\` |
| \`None\` | most objects of your own classes |`,
    { code: py`name = "ada"
name.upper()          # returns a NEW string 'ADA'; name is still 'ada'
name = name.upper()   # re-bind the name to get the new value

scores = [3, 1, 2]
scores.sort()         # changes THIS list in place; returns None`, lang: 'python', title: 'immutable methods return new objects; mutable ones change in place' },
    py`#### Aliasing, identity and equality`,
    { code: py`a = [1, 2]
b = a              # alias: same object
c = [1, 2]         # a different object with an equal value
print(a == c)      # True  — same value
print(a is b)      # True  — same object
print(a is c)      # False — different objects`, lang: 'python', title: 'is vs ==' },
    py`\`==\` asks "same **value**?"; \`is\` asks "same **object**?". Use \`is\` to *investigate* aliasing (and for \`None\`), and \`==\` to compare values — see [None, truthiness & identity](lesson:none-and-truthiness).`,
    py`#### Mutating vs re-binding`,
    { code: py`team = ["Ada"]
squad = team
squad.append("Ben")    # MUTATES the shared list → team sees it
squad = ["Cy"]         # RE-BINDS squad only → team is unaffected
print(team)            # ['Ada', 'Ben']`, lang: 'python', title: 'two very different operations' },
    py`#### Shallow copies`,
    { code: py`import copy

items = ["tea", "jam"]
c1 = items.copy()       # list method
c2 = list(items)        # constructor
c3 = items[:]           # full slice
c4 = copy.copy(items)   # works for any copyable object

prefs = {"theme": "dark"}
p1 = prefs.copy()       # or dict(prefs), or prefs | {}`, lang: 'python', title: 'four ways, one meaning' },
    py`A shallow copy is a **new outer container** whose slots refer to **the same objects** as the original. If those objects are immutable (numbers, strings, tuples of those), a shallow copy is all you ever need. If they're mutable (lists inside a list, dicts inside a dict), they're shared.`,
    py`#### Deep copies`,
    { code: py`import copy

class_7b = {"name": "7B", "students": ["Ada", "Ben"]}
next_year = copy.deepcopy(class_7b)
next_year["students"].append("Cy")
print(class_7b["students"])     # ['Ada', 'Ben'] — fully independent`, lang: 'python', title: 'copy.deepcopy' },
    py`\`deepcopy\` walks the whole structure and copies every mutable object it finds. It remembers what it has already copied, so an object referenced twice is copied once (the copy keeps the same sharing), and self-referencing structures don't send it into an infinite loop.`,
    py`#### The grid trap`,
    { code: py`bad = [[0] * 3] * 3          # ONE row, referenced three times
bad[0][0] = 1
print(bad)                   # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

good = [[0] * 3 for _ in range(3)]   # a NEW row built on every pass
good[0][0] = 1
print(good)                  # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]`, lang: 'python', title: '* copies references, never objects' },
    py`\`[0] * 3\` is fine — it repeats references to the immutable \`0\`. But \`[row] * 3\` repeats references to **one** mutable row. The fix is a *list comprehension*, \`[expression for _ in range(3)]\`, which evaluates \`[0] * 3\` again on each pass and so builds a fresh row each time (full story in [comprehensions](lesson:comprehensions)).`,
    py`#### += on lists vs tuples`,
    { code: py`scores = [1, 2]
same = scores
scores += [3]         # list: extends IN PLACE → same is [1, 2, 3]

point = (1, 2)
also = point
point += (3,)         # tuple: builds a NEW tuple → also is still (1, 2)`, lang: 'python', title: 'same operator, different behaviour' },
    py`\`x += y\` first asks the object to update itself in place. Lists can, so they do; tuples, strings and ints can't, so Python computes \`x + y\` as a new object and re-binds the name.`,
    py`#### Preview: the mutable default argument`,
    { code: py`def add_item(item, cart=[]):     # the [] is created ONCE, when def runs
    cart.append(item)
    return cart

print(add_item("tea"))   # ['tea']
print(add_item("jam"))   # ['tea', 'jam'] — the same list again!`, lang: 'python', title: 'a shared default object' },
    py`A default value is evaluated **once**, when the function is defined, and that one object is reused by every call that doesn't pass its own. With a mutable default, every call shares it. The standard fix (\`cart=None\`, then \`if cart is None: cart = []\`) is covered in [function arguments](lesson:function-arguments).`,
  ],
  walkthrough: {
    title: 'Reading the register program line by line',
    lang: 'python',
    code: REGISTER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 8], text: py`One dict, three "copies": \`alias\` is the same object; \`shallow\` is a new dict whose \`"students"\` value is the **same** list; \`deep\` is a new dict with a new list.` },
      { lines: [10, 11], text: py`Appending "Cy" mutates the shared list. Assigning \`register["class"]\` replaces a value in the **original dict only** — \`shallow\` has its own outer dict, so it keeps "7B".` },
      { lines: [13, 16], text: py`\`alias\` shows both changes (it *is* \`register\`). \`shallow\` shows "7B" but includes "Cy". \`deep\` shows neither. The \`is\` check confirms the shared list.` },
      { lines: [19, 24], text: py`\`[[0] * 3] * 3\` puts the same row in all three slots, so one assignment "changes every row". The comprehension builds a separate row per pass.` },
      { lines: [27, 33], text: py`\`scores += [3]\` extends the list in place, so the alias \`same\` sees it. \`point += (3,)\` can't change the tuple, so it builds a new one and re-binds \`point\` — \`also\` still has \`(1, 2)\`.` },
    ],
  },
  playground: {
    title: 'Class register copies',
    objective: 'Predict each line, then make the copies independent and fix the grid.',
    files: { 'main.py': REGISTER },
    expected: py`\`\`\`text
alias:   {'class': '8B', 'students': ['Ada', 'Ben', 'Cy']}
shallow: {'class': '7B', 'students': ['Ada', 'Ben', 'Cy']}
deep:    {'class': '7B', 'students': ['Ada', 'Ben']}
shallow shares the list? True
bad:  [[1, 0, 0], [1, 0, 0], [1, 0, 0]]
good: [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
[1, 2, 3] (1, 2)
\`\`\``,
    experiments: [
      {
        id: 'unshare-list',
        task: py`Without using \`deepcopy\`, change how \`shallow\` is made so it gets **its own** students list. The "shallow:" line should no longer include "Cy".`,
        hint: py`Copy the outer dict, then replace its \`"students"\` value with a copy of the list: \`shallow = register.copy()\` followed by \`shallow["students"] = shallow["students"].copy()\`.`,
        tests: [
          { name: 'shallow has its own list', code: py`assert shallow["students"] is not register["students"]` },
          { name: 'Cy did not leak into shallow', code: py`assert shallow["students"] == ["Ada", "Ben"]` },
        ],
        explain: py`You've hand-written a "two-level" copy: new outer dict, new inner list. That's exactly what \`deepcopy\` automates for structures of any depth. Copying by hand is fine — and faster — when you know the shape of your data.`,
      },
      {
        id: 'fix-grid',
        task: py`Fix \`bad_grid\` so that setting \`bad_grid[0][0] = 1\` changes only the first row.`,
        hint: py`Build it the same way as \`good_grid\`.`,
        tests: [{ name: 'only the first row changed', code: py`assert bad_grid == [[1, 0, 0], [0, 0, 0], [0, 0, 0]]` }],
        explain: py`The comprehension evaluates \`[0] * 3\` three separate times, producing three separate row objects. \`* 3\` on the outer list would just repeat one reference.`,
      },
      {
        id: 'identity-check',
        task: py`At the very end, print \`scores is same\` and \`point is also\` on one line. Predict both before you run.`,
        hint: py`\`print(scores is same, point is also)\``,
        tests: [{ name: 'prints True False', code: py`assert output.strip().splitlines()[-1] == "True False"` }],
        explain: py`\`scores += [3]\` mutated the list, so \`scores\` still names the same object as \`same\` (True). \`point += (3,)\` built a new tuple and re-bound \`point\` (False).`,
      },
      {
        id: 'deep-is-independent',
        task: py`At the end, append \`"Dee"\` to \`deep["students"]\`. Check that neither \`register\` nor \`shallow\` gains her.`,
        hint: py`\`deep["students"].append("Dee")\``,
        tests: [{ name: 'only deep has Dee', code: py`assert "Dee" in deep["students"]
assert "Dee" not in register["students"] and "Dee" not in shallow["students"]` }],
        explain: py`\`deepcopy\` gave \`deep\` its own list, so changes to it can't leak back. That independence is what you pay for with a deep copy: it duplicates every mutable object in the structure.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Why [[0] * 3] * 3 shares one row',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'bad', label: 'bad', note: '[[0] * 3] * 3', x: 70, y: 160, tone: 'yellow' },
        { id: 'b0', label: '[0]', note: 'slot', x: 190, y: 70 },
        { id: 'b1', label: '[1]', note: 'slot', x: 190, y: 160 },
        { id: 'b2', label: '[2]', note: 'slot', x: 190, y: 250 },
        { id: 'row', label: '[0, 0, 0]', note: 'ONE row', x: 320, y: 160, tone: 'red' },
        { id: 'good', label: 'good', note: 'comprehension', x: 450, y: 160, tone: 'yellow' },
        { id: 'g0', label: '[0]', note: 'slot', x: 560, y: 70 },
        { id: 'g1', label: '[1]', note: 'slot', x: 560, y: 160 },
        { id: 'g2', label: '[2]', note: 'slot', x: 560, y: 250 },
        { id: 'r0', label: '[0, 0, 0]', note: 'row 0', x: 690, y: 70, tone: 'blue' },
        { id: 'r1', label: '[0, 0, 0]', note: 'row 1', x: 690, y: 160, tone: 'blue' },
        { id: 'r2', label: '[0, 0, 0]', note: 'row 2', x: 690, y: 250, tone: 'blue' },
      ],
      edges: [
        { from: 'b0', to: 'row' },
        { from: 'b1', to: 'row' },
        { from: 'b2', to: 'row' },
        { from: 'g0', to: 'r0' },
        { from: 'g1', to: 'r1' },
        { from: 'g2', to: 'r2' },
      ],
      steps: [
        { focus: ['row'], text: py`\`[0] * 3\` runs **once** and builds one row object, \`[0, 0, 0]\`.` },
        { focus: ['bad', 'b0', 'b1', 'b2', 'row'], edges: ['b0->row', 'b1->row', 'b2->row'], text: py`Then \`[row] * 3\` makes a list with three slots — and \`*\` repeats **references**, so all three slots point at that same row.` },
        { focus: ['b0', 'row'], edges: ['b0->row', 'b1->row', 'b2->row'], text: py`\`bad[0][0] = 1\` follows slot 0's arrow and changes the row. Slots 1 and 2 lead to the same row, so printing gives \`[[1, 0, 0], [1, 0, 0], [1, 0, 0]]\`.` },
        { focus: ['good', 'g0', 'g1', 'g2', 'r0', 'r1', 'r2'], edges: ['g0->r0', 'g1->r1', 'g2->r2'], text: py`\`[[0] * 3 for _ in range(3)]\` evaluates \`[0] * 3\` on **every pass**, building three separate rows. Now \`good[0][0] = 1\` changes only row 0.` },
        { focus: ['bad', 'good'], text: py`The rule: \`*\` on a list never copies objects. That's harmless for immutable items (\`[0] * 3\`, \`[""] * 5\`) and a trap for mutable ones (\`[[]] * 3\`, \`[{}] * 3\`).` },
      ],
    },
    alt: 'Left: the name bad points to a list with three slots, and all three slots have arrows to a single row object [0, 0, 0]. Right: the name good points to a list whose three slots each have an arrow to its own separate row object.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every object has an **identity** (which object it is), a **type** and a **value**. Mutable objects can change their *value* while keeping their identity: after \`scores.append(4)\` it's still the same list, just longer. Immutable objects never change value, so "changing" one always gives you a new object with a new identity.`,
      py`Containers hold **references** (arrows), not objects. So "copying a container" raises a real question: copy the arrows (shallow), or also copy what they point at (deep)? Python makes you choose explicitly.`,
      { code: py`price = 10
old_price = price
price += 5              # ints are immutable: price now names a NEW object 15
print(old_price)        # 10 — untouched

basket = ["tea"]
old_basket = basket
basket += ["jam"]       # lists are mutable: the same list grows
print(old_basket)       # ['tea', 'jam']`, lang: 'python', title: 'the same += with two outcomes' },
    ],
    technical: [
      py`**Arguments are passed by object reference** ("call by sharing"). A function receives references to the caller's objects — no copy is made. So a function can *mutate* a caller's list (\`names.append(...)\` is visible outside), but *re-binding* its parameter (\`names = [...]\`) only changes the function's local name.`,
      { code: py`def enrol(names):
    names.append("Zed")    # visible to the caller
    names = ["new"]        # only the local name moves

roster = ["Ada"]
enrol(roster)
print(roster)              # ['Ada', 'Zed']`, lang: 'python', title: 'mutation travels, re-binding doesn\'t' },
      py`**How \`copy\` works:** \`copy.copy\` uses an object's \`__copy__\` method if it has one (otherwise the pickle protocol's \`__reduce_ex__\`). \`copy.deepcopy\` keeps a *memo* dict of objects already copied: shared references stay shared in the copy and cycles terminate. Immutable atoms (ints, strs) aren't copied at all — sharing them is safe — and a tuple is only rebuilt if something inside it needed copying. Objects that can't be copied meaningfully raise: \`copy.deepcopy(threading.Lock())\` → \`TypeError: cannot pickle '_thread.lock' object\`.`,
      py`**The tuple-\`+=\` puzzle.** \`t = ([1],)\` then \`t[0] += [2]\` does two things: the list's \`__iadd__\` extends it in place (succeeds), then Python tries to store the result back with \`t[0] = …\` (fails: \`TypeError: 'tuple' object does not support item assignment\`). You get an error *and* \`t\` is now \`([1, 2],)\`. Use \`t[0].extend([2])\` instead.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython \`id(obj)\` is the object's memory address, and some immutable objects are shared behind your back — small ints from -5 to 256, many short strings, the empty tuple. That's why \`a is b\` can be \`True\` for two "separate" equal numbers. It's an optimisation that's only safe *because* those objects are immutable; never rely on it, and compare values with \`==\`. See [the object model](lesson:object-model).` },
    ],
    production: [
      py`**Prefer immutable data** where you can: tuples instead of lists for fixed records, \`frozenset\` for constant groups, \`@dataclass(frozen=True)\` for value objects (see [dataclasses](lesson:dataclasses)), \`types.MappingProxyType\` for a read-only view of a dict you must share. Immutable values can be shared freely, used as keys, and reasoned about locally — ideas explored further in [functional concepts](lesson:functional-concepts).`,
      py`**Copy at boundaries.** If a class stores a list it was given, store \`list(items)\` (or a tuple) so the caller can't change your internals later; if you return internal state, return a copy or an immutable view. This "defensive copy" habit prevents spooky action at a distance.`,
      py`**Choose the cheapest correct copy.** Shallow copies only duplicate the outer container. \`deepcopy\` walks the entire structure, calling Python-level machinery for every object, so it is much slower on big data — use it when you genuinely need full independence, and prefer building new objects with only the parts you change ("copy what you modify").`,
      py`**Name your mutations.** The standard library's convention is that in-place methods return \`None\` (\`list.sort\`) and copying functions return the new object (\`sorted\`). Follow it in your own APIs so callers can tell from the signature whether their data will be changed.`,
    ],
  },
  mistakes: [
    {
      title: 'Thinking b = a makes a copy',
      wrong: { code: py`original = ["tea", "jam"]
backup = original
original.clear()
print(backup)           # [] — the "backup" was the same list`, lang: 'python' },
      right: { code: py`original = ["tea", "jam"]
backup = original.copy()
original.clear()
print(backup)           # ['tea', 'jam']`, lang: 'python' },
      explanation: py`Assignment binds another name to the same object. Ask for a copy explicitly whenever you need independence.`,
    },
    {
      title: 'A shallow copy of nested data',
      wrong: { code: py`import copy

template = {"title": "", "tags": []}
post = copy.copy(template)
post["tags"].append("python")
print(template)         # {'title': '', 'tags': ['python']} — template polluted`, lang: 'python' },
      right: { code: py`import copy

template = {"title": "", "tags": []}
post = copy.deepcopy(template)
post["tags"].append("python")
print(template)         # {'title': '', 'tags': []}`, lang: 'python' },
      explanation: py`A shallow copy creates a new outer dict but shares the inner list. For nested mutable data, use \`deepcopy\` — or build fresh inner objects yourself (\`{"title": "", "tags": []}\` from a factory function).`,
    },
    {
      title: 'Building a grid with * on a list of lists',
      wrong: { code: py`board = [[" "] * 3] * 3
board[1][1] = "X"
print(board)            # an X in the middle of EVERY row`, lang: 'python' },
      right: { code: py`board = [[" "] * 3 for _ in range(3)]
board[1][1] = "X"
print(board)            # only row 1 has the X`, lang: 'python' },
      explanation: py`Multiplying the outer list repeats one reference to one row. Build each row separately.`,
    },
    {
      title: 'A function that secretly mutates its argument',
      wrong: { code: py`def normalise(scores):
    scores.sort()                 # reorders the CALLER'S list
    return scores

raw = [70, 95, 82]
top = normalise(raw)
print(raw)                        # [70, 82, 95] — surprise`, lang: 'python' },
      right: { code: py`def normalise(scores):
    return sorted(scores)         # new list; caller's data untouched

raw = [70, 95, 82]
top = normalise(raw)
print(raw)                        # [70, 95, 82]`, lang: 'python' },
      explanation: py`Functions receive references, not copies. Unless mutating the argument is the documented purpose of the function, work on a copy or return a new object.`,
    },
    {
      title: 'A mutable default argument',
      wrong: { code: py`def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

print(add_tag("a"), add_tag("b"))   # ['a', 'b'] ['a', 'b'] — shared!`, lang: 'python' },
      right: { code: py`def add_tag(tag, tags=None):
    if tags is None:
        tags = []                   # a fresh list on every call
    tags.append(tag)
    return tags

print(add_tag("a"), add_tag("b"))   # ['a'] ['b']`, lang: 'python' },
      explanation: py`The default list is created once, when \`def\` runs, and reused by every call. Use \`None\` as the default and create the list inside. Full details in [function arguments](lesson:function-arguments).`,
    },
  ],
  debugging: [
    {
      symptom: py`Changing one variable unexpectedly changes another.`,
      cause: py`Both names refer to the same mutable object (aliasing) — via \`b = a\`, passing it into a function, or storing it in two containers.`,
      fix: py`Print \`a is b\` (or compare \`id(a)\` and \`id(b)\`) to confirm, find where the second reference was created, and copy there.`,
    },
    {
      symptom: py`Every row of my grid changes at the same time.`,
      cause: py`The grid was built with \`[[value] * cols] * rows\`, so every row is the same list.`,
      fix: py`Build rows separately: \`[[value] * cols for _ in range(rows)]\`. Check with \`grid[0] is grid[1]\`.`,
    },
    {
      symptom: py`My "copy" still changes when I edit the original's nested lists or dicts.`,
      cause: py`It's a shallow copy (\`.copy()\`, \`list()\`, \`[:]\`, \`dict()\`, \`copy.copy\`) — inner objects are shared.`,
      fix: py`Use \`copy.deepcopy\`, or copy the inner objects you intend to change.`,
    },
    {
      symptom: py`TypeError: 'tuple' object does not support item assignment — but the list inside the tuple changed anyway.`,
      cause: py`\`t[i] += [...]\` on a tuple holding a list: the in-place extend succeeds, then storing back into the tuple fails.`,
      fix: py`Mutate the inner list directly with \`t[i].extend([...])\` / \`t[i].append(...)\`, or use a list instead of a tuple.`,
    },
    {
      symptom: py`A function's default list or dict "remembers" values from previous calls.`,
      cause: py`A mutable default argument is created once and shared by all calls.`,
      fix: py`Use \`None\` as the default and create a new object inside the function.`,
    },
  ],
  bestPractices: [
    'Remember that assignment and argument passing never copy; copy explicitly when you need independence.',
    'Use a shallow copy for flat data and copy.deepcopy (or a hand-built copy) for nested mutable data.',
    'Build 2-D grids with a comprehension, never with [[x] * n] * m.',
    'Prefer immutable types (tuple, frozenset, frozen dataclasses) for data that shouldn\'t change.',
    'Don\'t mutate function arguments unless that is the function\'s documented job; return new objects instead.',
    'Never use a mutable object as a default argument value; use None.',
    'Use is to investigate aliasing and == to compare values.',
  ],
  useCases: [
    'Taking a backup of user data before an edit so it can be undone.',
    'Creating per-user settings from a shared defaults template.',
    'Game boards and spreadsheets as lists of lists with independent rows.',
    'Defensive copies inside classes so callers can\'t change internal state.',
    'Snapshotting state in tests to compare "before" and "after".',
  ],
  comparison: {
    title: 'Three ways to get "another" list',
    headers: ['', 'b = a', 'b = a.copy()', 'b = copy.deepcopy(a)'],
    rows: [
      ['new outer list?', 'no — same object', 'yes', 'yes'],
      ['new inner lists/dicts?', 'no', 'no — shared', 'yes'],
      ['a.append(x) visible in b?', 'yes', 'no', 'no'],
      ['a[0].append(x) visible in b?', 'yes', 'yes', 'no'],
      ['cost', 'nothing', 'copies the outer references', 'walks and copies the whole structure'],
    ],
    note: py`For immutable contents (numbers, strings, tuples of those), \`a.copy()\` and \`deepcopy\` behave the same — there's nothing inside that could change.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'mutability-and-copying-q1',
      type: 'mcq',
      prompt: 'Select **all** the immutable types.',
      options: [
        'int',
        'str',
        'tuple',
        { text: 'list', why: 'Lists can be changed in place: append, sort, item assignment…' },
        { text: 'dict', why: 'Dicts are mutable: you can add, change and delete keys.' },
        'frozenset',
      ],
      answer: [0, 1, 2, 5],
      explanation: py`Numbers, strings, tuples and frozensets never change in place; every "change" builds a new object. Lists, dicts and sets are mutable.`,
    },
    {
      id: 'mutability-and-copying-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`a = [1, 2]
b = a
a = a + [3]
b.append(4)
print(a, b)`,
      answer: '[1, 2, 3] [1, 2, 4]',
      explanation: py`\`a + [3]\` builds a **new** list and re-binds \`a\` to it, so after line 3 \`a\` and \`b\` are different lists. \`b.append(4)\` changes only the original list, which \`b\` still names.`,
    },
    {
      id: 'mutability-and-copying-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`grid = [[0] * 2] * 2
grid[0][1] = 5
print(grid)`,
      options: [
        { text: '[[0, 5], [0, 0]]', why: 'That is what you would get if the rows were separate lists. Here both slots refer to ONE row.' },
        '[[0, 5], [0, 5]]',
        { text: '[[5, 5], [0, 0]]', why: 'grid[0][1] changes one position within the row, not the whole row.' },
        { text: 'TypeError', why: 'Multiplying lists is allowed; the problem is shared references, not an error.' },
      ],
      answer: 1,
      explanation: py`\`[[0] * 2] * 2\` repeats a reference to one row. Changing that row through \`grid[0]\` shows up through \`grid[1]\` as well.`,
    },
    {
      id: 'mutability-and-copying-q4',
      type: 'bug',
      prompt: 'The template should stay empty, but this prints `{\'name\': \'\', \'tags\': [\'python\']}`. Click the line with the bug.',
      code: py`import copy
template = {"name": "", "tags": []}
post = copy.copy(template)
post["tags"].append("python")
print(template)`,
      answerLine: 3,
      explanation: py`\`copy.copy\` is shallow: \`post\` is a new dict, but \`post["tags"]\` is the **same** list as \`template["tags"]\`. Use \`copy.deepcopy(template)\` (or build a fresh dict) on line 3.`,
    },
    {
      id: 'mutability-and-copying-q5',
      type: 'fill',
      prompt: 'Make `independent` a fully independent copy of `nested`, so changing its inner lists never affects `nested`.',
      code: py`import copy
nested = [[1, 2], [3]]
independent = copy.___(nested)`,
      answer: [['deepcopy']],
      explanation: py`\`copy.deepcopy\` copies the outer list **and** the inner lists. \`copy.copy\` (or \`nested.copy()\`) would share the inner lists.`,
    },
    {
      id: 'mutability-and-copying-q6',
      type: 'mcq',
      prompt: 'Given `t = (1, [2])`, which statement runs **without** an error?',
      options: [
        { text: 't[0] = 5', why: 'Tuples don\'t support item assignment: TypeError.' },
        't[1].append(3)',
        { text: 't.append(4)', why: 'Tuples have no append method: AttributeError.' },
        { text: 'del t[1]', why: 'Tuples don\'t support item deletion: TypeError.' },
      ],
      answer: 1,
      explanation: py`\`t[1]\` is a list, and lists are mutable. The tuple still holds the same two objects; one of them just changed. Afterwards \`t\` is \`(1, [2, 3])\`.`,
    },
    {
      id: 'mutability-and-copying-q7',
      type: 'short',
      prompt: 'Explain the difference between a shallow copy and a deep copy, using a list of lists as the example.',
      answer: py`A shallow copy (\`outer.copy()\`, \`list(outer)\`, \`outer[:]\`, \`copy.copy(outer)\`) creates a new outer list, but its slots point at the same inner lists as the original — so appending to \`copy[0]\` also changes \`original[0]\`, while appending a new row to the copy does not affect the original. A deep copy (\`copy.deepcopy(outer)\`) also creates new inner lists (recursively, all the way down), so nothing is shared and changes to either side never affect the other.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'add-score-safely',
      title: 'Update a grade book without touching the original',
      difficulty: 'beginner',
      prompt: py`A grade book is a dict mapping names to **lists** of scores: \`{"Ada": [90, 85], "Ben": [70]}\`.

Write \`add_score(book, name, score)\` that **returns a new grade book** in which \`score\` has been added to the end of \`name\`'s list (a new student starts with \`[score]\`).

The original \`book\` — **including its inner lists** — must not change. (That way the program can keep the old version for an "undo" button.)`,
      files: {
        'main.py': py`def add_score(book, name, score):
    # TODO: return a NEW grade book; don't modify book or its lists
    book.setdefault(name, []).append(score)
    return book


before = {"Ada": [90, 85], "Ben": [70]}
after = add_score(before, "Ada", 77)
print("before:", before)
print("after: ", after)
`,
      },
      hints: [
        'The starter mutates the caller\'s dict and list. You need a new outer dict AND a new list for the student you change.',
        'dict(book) makes a new outer dict (shallow). For the changed student, build a new list with + instead of append: book.get(name, []) + [score].',
        'new_book = dict(book)\nnew_book[name] = book.get(name, []) + [score]\nreturn new_book',
      ],
      solution: {
        explanation: py`\`dict(book)\` is a **shallow** copy: a new outer dict whose values are the same lists as before. That's fine for the students we *don't* touch — we never mutate their lists, so sharing them is safe and cheap. For the student we change, \`book.get(name, []) + [score]\` builds a **brand-new** list with \`+\` (no \`append\`!) and stores it in the new dict only. The original dict and every original list are untouched. This "copy only what you change" approach is how immutable-style updates work in real code, and it's much cheaper than \`copy.deepcopy(book)\` on a large grade book.`,
        files: {
          'main.py': py`def add_score(book, name, score):
    new_book = dict(book)                          # new outer dict
    new_book[name] = book.get(name, []) + [score]  # new inner list
    return new_book


before = {"Ada": [90, 85], "Ben": [70]}
after = add_score(before, "Ada", 77)
print("before:", before)
print("after: ", after)
`,
        },
      },
      tests: [
        { name: 'the new book has the score', code: py`assert add_score({"Ada": [90]}, "Ada", 77) == {"Ada": [90, 77]}` },
        { name: 'a new student starts a list', code: py`assert add_score({}, "Cy", 50) == {"Cy": [50]}` },
        { name: 'the original dict is unchanged', code: py`book = {"Ada": [90]}
add_score(book, "Ben", 60)
assert book == {"Ada": [90]}` },
        { name: 'the original inner list is unchanged', code: py`book = {"Ada": [90]}
add_score(book, "Ada", 77)
assert book["Ada"] == [90], 'You changed the original list — build a new one'` },
        { name: 'returns a different dict object', code: py`book = {"Ada": [90]}
assert add_score(book, "Ada", 1) is not book` },
      ],
    },
    {
      id: 'make-grid',
      title: 'An honest grid',
      difficulty: 'beginner',
      prompt: py`Write \`make_grid(rows, cols, fill)\` that returns a list of \`rows\` lists, each containing \`cols\` copies of \`fill\`. Every row must be a **separate** list, so changing one cell changes only that cell.

\`\`\`python
g = make_grid(2, 3, ".")
g[0][0] = "X"
print(g)   # [['X', '.', '.'], ['.', '.', '.']]
\`\`\``,
      files: {
        'main.py': py`def make_grid(rows, cols, fill):
    # TODO: every row must be its own list
    return [[fill] * cols] * rows


g = make_grid(2, 3, ".")
g[0][0] = "X"
print(g)
`,
      },
      hints: [
        'The starter repeats ONE row. You need to build a new row once per row.',
        'Use a loop that appends [fill] * cols to a list rows times — or a list comprehension.',
        'grid = []\nfor _ in range(rows):\n    grid.append([fill] * cols)\nreturn grid',
      ],
      solution: {
        explanation: py`The loop evaluates \`[fill] * cols\` once **per row**, so each row is a new list object. (\`[fill] * cols\` itself is fine as long as \`fill\` is immutable, like \`"."\` or \`0\`.) The one-line version is a list comprehension: \`[[fill] * cols for _ in range(rows)]\`. If \`fill\` were itself mutable — say an empty list per cell — you'd need \`[[[] for _ in range(cols)] for _ in range(rows)]\` to make every cell independent too.`,
        files: {
          'main.py': py`def make_grid(rows, cols, fill):
    grid = []
    for _ in range(rows):
        grid.append([fill] * cols)
    return grid


g = make_grid(2, 3, ".")
g[0][0] = "X"
print(g)
`,
        },
      },
      tests: [
        { name: 'has the right shape and fill', code: py`assert make_grid(2, 3, 0) == [[0, 0, 0], [0, 0, 0]]` },
        { name: 'changing one cell changes only that cell', code: py`g = make_grid(3, 2, ".")
g[0][0] = "X"
assert g == [["X", "."], [".", "."], [".", "."]]` },
        { name: 'rows are different objects', code: py`g = make_grid(2, 2, 0)
assert g[0] is not g[1]` },
        { name: 'zero rows gives []', code: py`assert make_grid(0, 5, 0) == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'mutability-and-copying-mutable-immutable',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between mutable and immutable objects in Python? Give examples and explain why it matters.',
      answer: 'Mutable objects can change their value in place while keeping their identity (list, dict, set); immutable ones can\'t, so operations return new objects (int, float, str, tuple, frozenset). It matters for aliasing, hashing (only immutable-style objects can be dict keys) and function arguments.',
      explanation: py`Because names are references, aliasing a mutable object means changes are visible through every reference. Immutability makes sharing safe and enables hashing. Note that immutability of a container is shallow: a tuple holding a list can still "change" through the list.`,
      whyAsked: 'It is foundational: aliasing bugs, mutable default arguments, dict keys and thread-safety discussions all build on it.',
      mistakes: ['Saying strings are mutable because s += "x" works', 'Calling tuples deeply immutable', 'Not connecting immutability to hashability'],
      followUps: ['Why can\'t a list be a dict key?', 'Is a tuple containing a list hashable?', 'What does s += "x" actually do for a string?'],
      modelAnswer: 'A mutable object can change its value in place while staying the same object — lists, dicts, sets and most class instances. An immutable object can never change, so anything that looks like a change, such as s += "x" on a string, actually builds a new object and re-binds the name — that is the case for ints, floats, strings, tuples and frozensets. It matters because names are references: if two names share a mutable object, a change through one is visible through the other. It also matters for hashing — dict keys and set members must not change — and immutability is shallow, so a tuple holding a list is not truly frozen.',
    },
    {
      id: 'mutability-and-copying-shallow-deep',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `b = a`, `b = a.copy()` and `b = copy.deepcopy(a)` for `a = [[1, 2], [3]]`. After `a[0].append(9)` and `a.append([4])`, what is `b` in each case?',
      answer: 'b = a: [[1, 2, 9], [3], [4]] (same object). a.copy(): [[1, 2, 9], [3]] — new outer list, shared inner lists. deepcopy: [[1, 2], [3]] — nothing shared.',
      explanation: py`Assignment shares everything; a shallow copy shares the inner objects but not the outer container; a deep copy shares nothing mutable. Choose the cheapest one that gives the independence you need.`,
      code: { lang: 'python', code: py`import copy
a = [[1, 2], [3]]
alias, shallow, deep = a, a.copy(), copy.deepcopy(a)
a[0].append(9)
a.append([4])
print(alias)     # [[1, 2, 9], [3], [4]]
print(shallow)   # [[1, 2, 9], [3]]
print(deep)      # [[1, 2], [3]]` },
      whyAsked: 'It tests whether you can reason precisely about levels of sharing instead of reciting definitions.',
      mistakes: ['Saying a.copy() is fully independent', 'Forgetting that the alias also sees the new row', 'Using deepcopy reflexively without considering cost'],
      followUps: ['How would you copy only two levels deep by hand?', 'What does deepcopy do with shared references inside a?'],
      modelAnswer: 'With b = a there is only one list, so b shows both changes: the 9 in the first row and the new row. a.copy() makes a new outer list whose slots point at the same inner lists, so b sees the 9 — that mutation happened inside a shared inner list — but not the new row, which was appended only to a\'s outer list. deepcopy duplicates the inner lists too, so b shows neither change. In practice I pick the cheapest copy that gives me the independence I need: shallow for flat data, deep or a targeted manual copy for nested data.',
    },
    {
      id: 'mutability-and-copying-tuple-iadd',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What happens when this runs, and what is `t` afterwards?',
      code: { lang: 'python', code: py`t = ([1],)
try:
    t[0] += [2]
except TypeError as e:
    print("error:", e)
print(t)` },
      options: [
        "error: 'tuple' object does not support item assignment, then ([1, 2],)",
        "error: 'tuple' object does not support item assignment, then ([1],)",
        '([1, 2],) with no error',
        "([1],) with no error",
      ],
      correctOption: 0,
      answer: 'It raises TypeError, yet t becomes ([1, 2],). t[0] += [2] first calls list.__iadd__, which extends the list in place, then tries to assign the result back to t[0], which fails because tuples are immutable.',
      explanation: py`Augmented assignment on a subscription is "get item, in-place operate, set item". The in-place step succeeds on the mutable list; the set-item step fails on the immutable tuple. The Python FAQ documents this exact case. Avoid it with \`t[0].extend([2])\`, which has no assignment step.`,
      whyAsked: 'A well-known puzzle that reveals whether you understand how += is executed and the shallow nature of tuple immutability.',
      mistakes: ['Assuming the operation is atomic (all-or-nothing)', 'Thinking the list stays [1] because the statement failed'],
      followUps: ['How would you inspect the steps? (dis.dis)', 'Does the same happen with t[0] = t[0] + [2]? (No: + builds a new list, and the assignment fails before anything changes)'],
      modelAnswer: 'It prints the TypeError and then shows the tuple containing [1, 2]. The statement t[0] += [2] is executed as three steps: get t[0], call the list\'s in-place add, then store the result back into t[0]. The in-place add succeeds because lists are mutable, so the list now holds 1 and 2. Then the store fails, because tuples don\'t support item assignment. So we get an error and a side effect. If I just want to extend the inner list, I call t[0].extend([2]), which has no assignment step.',
    },
    {
      id: 'mutability-and-copying-call-by-sharing',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Does Python pass arguments by value or by reference?',
      answer: 'Neither in the classic sense: it passes references to objects by value ("call by sharing" / pass by object reference). The function can mutate a mutable argument and the caller sees it, but re-binding the parameter name inside the function never affects the caller\'s variable.',
      explanation: py`The parameter becomes a new local name bound to the caller's object. Mutation goes through the shared object; re-binding only moves the local name. That's why \`def f(x): x += 1\` doesn't change the caller's int (ints are immutable, \`+=\` re-binds) while \`def f(xs): xs += [1]\` does change the caller's list.`,
      code: { lang: 'python', code: py`def f(n, items):
    n += 1          # re-binds local n
    items += [1]    # mutates the shared list

count, data = 0, []
f(count, data)
print(count, data)  # 0 [1]` },
      whyAsked: 'Candidates from other languages often answer with C++/Java vocabulary; precise reasoning here prevents mutation bugs in APIs.',
      mistakes: ['Saying "by reference" and claiming re-assignment inside affects the caller', 'Saying "by value" and claiming lists are copied', 'Not distinguishing mutation from re-binding'],
      followUps: ['How would you write a function that must not mutate its input?', 'Why is this related to the mutable default argument problem?'],
      modelAnswer: 'Python passes object references, and the reference itself is passed by value — often called call by sharing. Inside the function, the parameter is a new local name bound to the very same object the caller passed. If the object is mutable and the function mutates it, for example appending to a list, the caller sees the change. But if the function re-binds the parameter — assigns a new object to it, or uses += on an immutable int — only the local name moves and the caller is unaffected. So the useful rule is: mutation is shared, re-binding is local.',
    },
    {
      id: 'mutability-and-copying-implement-deepcopy',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Without the `copy` module, write `clone(data)` that deep-copies nested structures made of dicts, lists and immutable values (numbers, strings, None, tuples of immutables). The result must be equal to the input but share no list or dict with it.',
      answer: 'Recurse: for a dict, build a new dict with cloned values; for a list, a new list of cloned items; anything else is immutable and can be returned as-is.',
      explanation: py`Immutable leaves can be shared safely, so the recursion only needs to rebuild the mutable containers. This simplified version doesn't handle shared references or cycles — \`copy.deepcopy\` adds a memo dict for that, plus support for sets, custom classes and more.`,
      starter: { files: { 'main.py': py`def clone(data):
    # TODO: return a deep copy of nested dicts/lists
    return data


config = {"name": "app", "servers": [{"host": "a", "ports": [80, 443]}]}
copy_ = clone(config)
copy_["servers"][0]["ports"].append(8080)
print(config["servers"][0]["ports"])   # should still be [80, 443]
` } },
      tests: [
        { name: 'the clone is equal', code: py`src = {"a": [1, {"b": [2, 3]}], "c": "x"}
assert clone(src) == src` },
        { name: 'outer dict is a new object', code: py`src = {"a": 1}
assert clone(src) is not src` },
        { name: 'nested lists and dicts are new objects', code: py`src = {"a": [1, {"b": [2]}]}
c = clone(src)
assert c["a"] is not src["a"]
assert c["a"][1] is not src["a"][1]
assert c["a"][1]["b"] is not src["a"][1]["b"]` },
        { name: 'mutating the clone leaves the source alone', code: py`src = [[1], [2]]
c = clone(src)
c[0].append(99)
assert src == [[1], [2]]` },
      ],
      solution: { files: { 'main.py': py`def clone(data):
    if isinstance(data, dict):
        return {key: clone(value) for key, value in data.items()}
    if isinstance(data, list):
        return [clone(item) for item in data]
    return data   # immutable: safe to share


config = {"name": "app", "servers": [{"host": "a", "ports": [80, 443]}]}
copy_ = clone(config)
copy_["servers"][0]["ports"].append(8080)
print(config["servers"][0]["ports"])   # should still be [80, 443]
` } },
      hints: ['Check the type with isinstance(data, dict) / isinstance(data, list).', 'Call clone() on every value inside — recursion handles any depth.'],
      whyAsked: 'Shows you understand what "deep" means, can write a small recursive function, and know the limits of a simplified implementation.',
      mistakes: ['Returning data.copy() (only one level deep)', 'Copying immutable leaves unnecessarily', 'Not mentioning shared references and cycles'],
      followUps: ['How would you handle a list that contains itself?', 'How would you preserve shared references (the same list used twice)?', 'Why does copy.deepcopy use a memo dict?'],
      modelAnswer: 'I write a recursive function: if the value is a dict, I return a new dict whose values are cloned; if it is a list, a new list of cloned items; and anything else, being immutable in this data model, I return as is, since sharing immutable values is safe. That rebuilds every mutable container at every depth, so the result is equal but shares nothing mutable. It is a simplified version: it would loop forever on a cycle and it duplicates an object that appears twice. copy.deepcopy solves both with a memo dictionary keyed by object id, and it also supports sets, tuples containing mutables and custom classes.',
    },
    {
      id: 'mutability-and-copying-defensive-copy',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A `Playlist` class stores the list of songs passed to its constructor and exposes it via a `songs` attribute. Users report that playlists change "by themselves". What is happening and how would you design it?',
      answer: 'The class keeps a reference to the caller\'s list (and hands out its own list), so outside code mutates the playlist\'s internal state. Copy on the way in (list(songs) or tuple(songs)), and on the way out return a copy or an immutable tuple, mutating only via methods.',
      explanation: py`Storing \`self.songs = songs\` aliases the caller's list: when they reuse or clear it, the playlist changes. Returning \`self.songs\` gives everyone a handle to internal state. Defensive copies (or immutable tuples) at both boundaries make the class own its data; expose changes through methods like \`add(song)\` so invariants can be enforced.`,
      code: { lang: 'python', code: py`class Playlist:
    def __init__(self, songs):
        self._songs = list(songs)      # copy in

    @property
    def songs(self):
        return tuple(self._songs)      # read-only view out

    def add(self, song):
        self._songs.append(song)

mine = ["Intro"]
p = Playlist(mine)
mine.clear()
print(p.songs)   # ('Intro',)` },
      whyAsked: 'Encapsulation bugs caused by aliasing are common in real codebases; the answer shows design maturity.',
      mistakes: ['Blaming "global variables"', 'Only copying on the way in but returning the internal list', 'Deep-copying everything without considering cost'],
      followUps: ['When is it OK to skip the copy?', 'How would a frozen dataclass help?', 'What is a property? (see properties & encapsulation)'],
      modelAnswer: 'The class is aliasing the caller\'s list: self.songs is the very list the caller passed in, so when the caller later clears or appends to it, the playlist changes too. Exposing the same list as an attribute makes it worse, because any user can mutate the internals. I would copy on the way in, storing list(songs), and on the way out return a tuple or a copy, so callers get a snapshot. Changes go through methods like add, which also lets the class validate input. If the data never needs to change, I would store a tuple from the start.',
    },
    {
      id: 'mutability-and-copying-deepcopy-memo',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does `copy.deepcopy` handle an object referenced twice, and a list that contains itself? What can\'t it copy?',
      answer: 'It keeps a memo dict from id(original) → copy. An object seen again is replaced by its existing copy, so shared references stay shared and cycles terminate. Objects tied to external resources (locks, open files, generators, sockets) can\'t be deep-copied and raise TypeError unless they define __deepcopy__.',
      explanation: py`For \`pair = [shared, shared]\`, \`deepcopy(pair)\` gives a new pair whose two slots are the *same new* list — the structure's shape is preserved. For \`x = [1]; x.append(x)\`, the copy also contains itself. Classes can customise behaviour with \`__deepcopy__(self, memo)\` / \`__copy__\`; by default copying falls back to the pickle protocol, which is why errors read like \`TypeError: cannot pickle 'generator' object\`.`,
      code: { lang: 'python', code: py`import copy

shared = [0]
pair = [shared, shared]
dp = copy.deepcopy(pair)
print(dp[0] is dp[1], dp[0] is shared)   # True False

x = [1]
x.append(x)
y = copy.deepcopy(x)
print(y[1] is y)                          # True — the cycle is preserved` },
      whyAsked: 'Tests depth beyond "deepcopy copies everything": memoisation, structure preservation and failure modes.',
      mistakes: ['Saying deepcopy recurses forever on cycles', 'Saying deepcopy duplicates a shared object twice', 'Assuming every object can be deep-copied'],
      followUps: ['How would you implement __deepcopy__ for a class holding a database connection?', 'Why is deepcopy slow on large structures?'],
      modelAnswer: 'deepcopy keeps a memo dictionary mapping the id of each original object to its copy. Whenever it meets an object it has already copied, it reuses that copy, so two references to one list in the original become two references to one new list in the copy — the shape is preserved — and a list that contains itself is copied into a list that contains itself instead of recursing forever. Some objects can\'t be meaningfully copied, such as locks, open files, sockets and generators; by default copy falls back to the pickle protocol, so you get a TypeError saying it cannot pickle the object. Classes can control this with __deepcopy__ and __copy__.',
    },
  ],

  takeaways: [
    'Mutable objects (list, dict, set) change in place; immutable ones (int, str, tuple, frozenset) never do — every "change" builds a new object.',
    'Assignment and argument passing never copy: several names can share one object (aliasing). Use is to check.',
    'Mutating an object is visible through every reference; re-binding a name moves only that name.',
    'Shallow copies (.copy(), list(), [:], dict(), copy.copy) make a new outer container that shares its contents; copy.deepcopy copies everything mutable, preserving shared references and cycles.',
    '[[x] * n] * m repeats one row; build grids with a comprehension.',
    '+= mutates lists in place but builds new tuples/strings/ints; t[0] += [x] on a tuple both mutates and raises.',
    'Default argument values are created once — never use a mutable default (see function arguments).',
  ],
}
