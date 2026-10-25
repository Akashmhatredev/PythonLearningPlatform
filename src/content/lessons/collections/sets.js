// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CLUBS = py`# Who signed up for which club?
chess = {"Ada", "Ben", "Cy", "Dee"}
coding = {"Cy", "Dee", "Eve", "Finn"}
print("Chess club:", sorted(chess))

both = chess & coding              # in both clubs
either = chess | coding            # in at least one club
only_chess = chess - coding        # chess but not coding
just_one = chess ^ coding          # in exactly one club
print("Both:", sorted(both))
print("Either:", sorted(either))
print("Only chess:", sorted(only_chess))
print("Just one:", sorted(just_one))

coding.add("Gus")                  # sets are mutable
coding.discard("Zed")              # no error if it isn't there
print("Is Eve coding?", "Eve" in coding)

signups = ["Ada", "Ben", "Ada", "Cy", "Ben", "Ada"]
unique = set(signups)
print(len(signups), "sign-ups,", len(unique), "people")
in_order = list(dict.fromkeys(signups))   # dedupe, keep first-seen order
print("In order:", in_order)
`

export default {
  id: 'sets',
  title: 'Sets: uniqueness & fast membership',
  summary: 'A set is an unordered collection of unique, hashable items — it removes duplicates, answers "is x in here?" without searching, and does union, intersection and difference in one operator.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['lists', 'tuples-and-unpacking'],
  related: ['dictionaries', 'lists', 'list-operations', 'comprehensions', 'performance', 'special-methods'],
  tags: ['set', 'sets', 'frozenset', 'unique', 'deduplicate', 'membership', 'in', 'union', 'intersection', 'difference', 'symmetric difference', 'subset', 'superset', 'hashable', 'hash', 'dict.fromkeys'],
  apis: [
    { name: 'set() / {a, b}', summary: 'Create a set. {} is an empty DICT; the empty set is set().' },
    { name: 'set.add(x)', summary: 'Adds x (no effect if already present).' },
    { name: 'set.remove(x) / set.discard(x)', summary: 'Remove x; remove raises KeyError if missing, discard does not.' },
    { name: 'a | b, a.union(…)', summary: 'Union: items in either set.' },
    { name: 'a & b, a.intersection(…)', summary: 'Intersection: items in both.' },
    { name: 'a - b, a.difference(…)', summary: 'Difference: items in a but not in b.' },
    { name: 'a ^ b, a.symmetric_difference(…)', summary: 'Items in exactly one of the two sets.' },
    { name: 'a <= b, a.issubset(…), a.isdisjoint(…)', summary: 'Subset / superset / no-overlap tests.' },
    { name: 'frozenset(iterable)', summary: 'An immutable, hashable set — usable as a dict key or set member.' },
    { name: 'dict.fromkeys(items)', summary: 'Order-preserving dedupe: list(dict.fromkeys(items)).' },
  ],
  docs: [
    { label: 'Tutorial — sets', url: 'https://docs.python.org/3/tutorial/datastructures.html#sets' },
    { label: 'Library reference — set types (set, frozenset)', url: 'https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset' },
    { label: 'Glossary — hashable', url: 'https://docs.python.org/3/glossary.html#term-hashable' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **set** is a collection where every item appears **at most once** and there is **no order**. You write it with curly braces: \`{"Ada", "Ben", "Cy"}\`. Add \`"Ada"\` again and nothing happens — she's already in.`,
    py`Sets are built for two jobs. First, **uniqueness**: \`set(signups)\` throws away every duplicate in one step. Second, **membership**: \`"Eve" in coding\` is answered by jumping straight to where "Eve" would be stored, instead of checking items one by one like a [list](lesson:lists) does.`,
    py`On top of that, sets speak the language of maths class: **union**, **intersection** and **difference** are single operators (\`|\`, \`&\`, \`-\`, \`^\`). "Who is in both clubs?" becomes \`chess & coding\`.`,
  ],
  why: [
    py`"Have I seen this before?" is one of the most common questions a program asks: has this username been taken, was this email already sent, did we visit this web page? With a list, each check scans the whole list — fine for ten items, painful for a million. A set answers in roughly the same time whatever its size.`,
    py`Comparing groups is just as common: which products are new since yesterday, which permissions does this user lack, which students did *both* tests? Sets turn each of those into one readable expression instead of nested loops.`,
  ],
  eli15: [
    py`Imagine a **guest list at a party door** with one rule: no name twice. If someone tries to get in again, the bouncer just says "you're already on the list".`,
    py`The bouncer doesn't read the whole list from the top every time. The list is split into sections by a secret rule ("names whose code is 7 go in section 7"), so they flip straight to the right section and check just a few names. That secret rule is called a **hash**.`,
    py`And if two parties merge, the bouncer can instantly tell you who's on *both* lists, *either* list, or *only one* — that's set maths.`,
  ],
  analogy: {
    title: 'A sticker album',
    body: [
      py`A sticker album has exactly one spot for each sticker. Get a duplicate and there's nowhere to put it — it doesn't go in twice. To check "do I have sticker 112?" you don't flip through every page; the number tells you exactly which page and spot to look at.`,
      py`Swap with a friend and you can quickly see which stickers you **both** have, which ones **only you** have, and which ones **either** of you has. The album has no "first" or "last" sticker in the order you got them — only "have" and "don't have".`,
    ],
    mapping: [
      ['one spot per sticker', 'each item appears at most once'],
      ['the sticker number tells you the page', 'the hash tells Python where to look'],
      ['"do I have 112?" without flipping every page', 'fast membership: x in my_set'],
      ['stickers we both have', 'intersection: a & b'],
      ['stickers either of us has', 'union: a | b'],
      ['my stickers you don\'t have', 'difference: a - b'],
      ['no "order I got them in"', 'sets are unordered'],
    ],
  },
  visual: {
    type: 'hash-table',
    title: 'Where does each item go?',
    props: { preset: 'set' },
    alt: 'An interactive, simplified hash table. Typing an item computes its hash, which picks a bucket; the item is stored in that bucket. Adding an item that is already present changes nothing, and checking membership jumps straight to one bucket instead of scanning every item.',
    caption: py`Type items and watch each one's **hash** pick a bucket. A duplicate lands in the same bucket as the original and is ignored. Checking \`x in s\` hashes \`x\` and looks in **one** bucket — that's why it doesn't slow down as the set grows. (This is a simplified model of the real thing.)`,
  },
  syntax: [
    py`#### Creating sets`,
    { code: py`colours = {"red", "green", "blue"}       # a set literal
empty = set()                             # the ONLY way to make an empty set
oops = {}                                 # this is an empty DICT!
letters = set("hello")                    # {'h', 'e', 'l', 'o'} — duplicates gone
unique_ids = set([3, 1, 3, 2, 1])         # {1, 2, 3}
lower = {w.lower() for w in ["Hi", "hi", "YO"]}   # set comprehension: {'hi', 'yo'}`, lang: 'python', title: 'literals, set() and comprehensions' },
    { callout: 'warn', title: '{} is a dictionary', text: py`\`{}\` was a dict long before sets got their own curly-brace syntax, so it stayed a dict. \`empty = {}\` followed by \`empty.add(x)\` fails with \`AttributeError: 'dict' object has no attribute 'add'\`. Always write \`set()\`.` },
    py`#### Adding and removing`,
    { code: py`tags = {"python", "beginner"}
tags.add("lists")            # add one item
tags.add("python")           # already there: nothing happens
tags.update(["sets", "loops"])   # add many (any iterable)
tags.remove("beginner")      # KeyError if it's missing
tags.discard("advanced")     # silently does nothing if missing
item = tags.pop()            # removes and returns an ARBITRARY item
tags.clear()                 # empty it`, lang: 'python', title: 'set is mutable' },
    py`Use \`remove\` when a missing item would be a bug you want to hear about, and \`discard\` when "make sure it's gone" is all you need.`,
    py`#### Membership and size`,
    { code: py`banned = {"spam_bot", "troll42"}
"troll42" in banned        # True  — fast, whatever the size
"ada" not in banned        # True
len(banned)                # 2`, lang: 'python', title: 'in, not in, len' },
    py`There is **no indexing**: \`banned[0]\` raises \`TypeError: 'set' object is not subscriptable\`, because a set has no positions. Loop over it, or convert with \`sorted(s)\` when you need an order.`,
    py`#### Set algebra`,
    py`| operation | operator | method | result for \`a = {1, 2, 3}\`, \`b = {2, 3, 4}\` |
|---|---|---|---|
| union — in either | \`a | b\` | \`a.union(b)\` | \`{1, 2, 3, 4}\` |
| intersection — in both | \`a & b\` | \`a.intersection(b)\` | \`{2, 3}\` |
| difference — in a, not b | \`a - b\` | \`a.difference(b)\` | \`{1}\` |
| symmetric difference — in exactly one | \`a ^ b\` | \`a.symmetric_difference(b)\` | \`{1, 4}\` |
| subset — all of a is in b | \`a <= b\` | \`a.issubset(b)\` | \`False\` |
| no overlap at all | — | \`a.isdisjoint(b)\` | \`False\` |`,
    { code: py`a = {1, 2, 3}
a.union([7, 8], (9,))     # methods accept ANY iterables, even several
# a | [7, 8]              # TypeError: operators need sets on both sides

a |= {4}                  # in-place versions: |=, &=, -=, ^=
a -= {1}
print(a)                  # {2, 3, 4}`, lang: 'python', title: 'operators vs methods' },
    py`#### frozenset: a set that can't change`,
    { code: py`WEEKEND = frozenset({"sat", "sun"})     # a constant nobody can modify
print("sun" in WEEKEND)                  # True
pairs = {frozenset({"Ada", "Ben"}): "project partners"}   # a set as a dict key
print(pairs[frozenset({"Ben", "Ada"})])  # order doesn't matter`, lang: 'python', title: 'frozenset is hashable' },
    py`#### Items must be hashable`,
    py`Set items must be **hashable**: they need a hash value that never changes. Numbers, strings, \`None\`, tuples of hashable things and frozensets are fine. Lists, dicts and sets are not, because they can change. \`{[1, 2]}\` raises \`TypeError: cannot use 'list' as a set element (unhashable type: 'list')\` in Python 3.14 (older versions: \`TypeError: unhashable type: 'list'\`).`,
    py`#### Removing duplicates but keeping order`,
    { code: py`signups = ["Ada", "Ben", "Ada", "Cy", "Ben"]
set(signups)                    # {'Cy', 'Ada', 'Ben'} — order is lost
list(dict.fromkeys(signups))    # ['Ada', 'Ben', 'Cy'] — first-seen order kept`, lang: 'python', title: 'order-preserving dedupe' },
    py`\`dict.fromkeys(items)\` builds a dictionary whose keys are the items. Dict keys are unique like set items, **and** dicts remember insertion order (guaranteed since Python 3.7), so converting the keys back to a list gives the de-duplicated items in first-seen order. More in [dictionaries](lesson:dictionaries).`,
  ],
  walkthrough: {
    title: 'Reading the club program line by line',
    lang: 'python',
    code: CLUBS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 4], text: py`Two set literals. We print \`sorted(chess)\` rather than \`chess\` because a set has no reliable order — sorting gives the same output every run.` },
      { lines: [6, 9], text: py`Four set operations, each building a **new** set: \`&\` both, \`|\` either, \`-\` only the left one, \`^\` exactly one. The original sets are unchanged.` },
      { lines: [15, 17], text: py`\`add\` puts "Gus" in. \`discard("Zed")\` does nothing because Zed isn't there — \`remove("Zed")\` would have raised \`KeyError\`. \`"Eve" in coding\` hashes "Eve" and checks one spot.` },
      { lines: [19, 21], text: py`\`set(signups)\` keeps one copy of each name: 6 sign-ups, 3 people.` },
      { lines: [22, 23], text: py`\`dict.fromkeys(signups)\` uses the names as dict keys — unique, and in insertion order — so the list comes out as Ada, Ben, Cy: first-seen order.` },
    ],
  },
  playground: {
    title: 'Club sign-ups',
    objective: 'Run it, then combine the clubs in new ways and watch duplicates disappear.',
    files: { 'main.py': CLUBS },
    expected: py`\`\`\`text
Chess club: ['Ada', 'Ben', 'Cy', 'Dee']
Both: ['Cy', 'Dee']
Either: ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Finn']
Only chess: ['Ada', 'Ben']
Just one: ['Ada', 'Ben', 'Eve', 'Finn']
Is Eve coding? True
6 sign-ups, 3 people
In order: ['Ada', 'Ben', 'Cy']
\`\`\`

Try printing a set directly (\`print(chess)\`): the order you see is arbitrary and, for strings, can even change between runs.`,
    experiments: [
      {
        id: 'only-coding',
        task: py`At the **end** of the program, print the people who are in the coding club but **not** the chess club, sorted, in the form \`Only coding: [...]\`.`,
        hint: py`Difference is not symmetric: \`coding - chess\` is not the same as \`chess - coding\`.`,
        tests: [{ name: 'prints the coding-only members', code: py`assert "Only coding: ['Eve', 'Finn', 'Gus']" in output` }],
        explain: py`\`coding - chess\` keeps what's in \`coding\` and drops anything also in \`chess\`. Because you printed it at the end, "Gus" (added on line 15) is included.`,
      },
      {
        id: 'subset-check',
        task: py`Add a line that prints \`Subset? True\` by checking whether every member of \`both\` is also in \`chess\`.`,
        hint: py`\`both <= chess\` (or \`both.issubset(chess)\`).`,
        tests: [{ name: 'prints Subset? True', code: py`assert "Subset? True" in output` }],
        explain: py`\`a <= b\` is True when every item of \`a\` is in \`b\`. An intersection is always a subset of both of its inputs, so this is always True here — try \`either <= chess\` for a False.`,
      },
      {
        id: 'freeze-chess',
        task: py`Make the chess club **unchangeable**: turn line 2 into a \`frozenset\`. Then try adding \`chess.add("Zed")\` and read the error — remove that line again so the program runs.`,
        hint: py`\`chess = frozenset({"Ada", "Ben", "Cy", "Dee"})\`. Set operations still work on frozensets.`,
        tests: [{ name: 'chess is a frozenset', code: py`assert isinstance(chess, frozenset), 'Wrap the set literal in frozenset(...)'` }],
        explain: py`\`chess.add(...)\` raises \`AttributeError: 'frozenset' object has no attribute 'add'\`. Every reading operation and set operator still works, and \`chess & coding\` returns a frozenset (the type of the left operand). Because it can't change, a frozenset is hashable.`,
      },
      {
        id: 'more-signups',
        task: py`Add \`"Eve"\` to the \`signups\` list **twice** (at the end). Predict both of the last two lines first.`,
        hint: py`Edit the list literal on line 19.`,
        tests: [
          { name: 'counts 8 sign-ups and 4 people', code: py`assert "8 sign-ups, 4 people" in output` },
          { name: 'Eve appears once, last', code: py`assert in_order == ['Ada', 'Ben', 'Cy', 'Eve']` },
        ],
        explain: py`The list keeps every sign-up (8); the set keeps each person once (4). \`dict.fromkeys\` keeps Eve's **first** appearance, so she lands at the end of \`in_order\`, once.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Union, intersection, difference, symmetric difference',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'chess', label: 'chess', note: '{Ada, Ben, Cy, Dee}', x: 200, y: 60, tone: 'yellow' },
        { id: 'coding', label: 'coding', note: '{Cy, Dee, Eve, Finn}', x: 560, y: 60, tone: 'blue' },
        { id: 'onlyA', label: 'Ada, Ben', note: 'only chess', x: 130, y: 220 },
        { id: 'both', label: 'Cy, Dee', note: 'both clubs', x: 380, y: 220, tone: 'kraft' },
        { id: 'onlyB', label: 'Eve, Finn', note: 'only coding', x: 630, y: 220 },
      ],
      edges: [
        { from: 'chess', to: 'onlyA' },
        { from: 'chess', to: 'both' },
        { from: 'coding', to: 'both' },
        { from: 'coding', to: 'onlyB' },
      ],
      steps: [
        { focus: ['chess', 'coding', 'onlyA', 'both', 'onlyB'], edges: ['chess->onlyA', 'chess->both', 'coding->both', 'coding->onlyB'], text: py`Every person falls into exactly one of three regions: only chess, both clubs, or only coding.` },
        { focus: ['both'], text: py`**Intersection** \`chess & coding\` → \`{Cy, Dee}\`: the middle region, people in **both**.` },
        { focus: ['onlyA', 'both', 'onlyB'], text: py`**Union** \`chess | coding\` → all six names: everyone in **at least one** club. Cy and Dee appear once, not twice.` },
        { focus: ['onlyA'], text: py`**Difference** \`chess - coding\` → \`{Ada, Ben}\`: the chess region with everything shared cut away. Order matters: \`coding - chess\` is \`{Eve, Finn}\`.` },
        { focus: ['onlyA', 'onlyB'], text: py`**Symmetric difference** \`chess ^ coding\` → \`{Ada, Ben, Eve, Finn}\`: people in **exactly one** club — the union minus the intersection.` },
      ],
    },
    alt: 'Two sets, chess and coding, split into three regions: only chess (Ada, Ben), both (Cy, Dee) and only coding (Eve, Finn). Steps highlight the middle region for intersection, all three regions for union, the left region for difference, and the two outer regions for symmetric difference.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When you add an item, Python first computes its **hash** — a whole number calculated from the item's value (\`hash("Ada")\`). The hash decides which slot in an internal table the item goes in. To check \`"Ada" in s\`, Python computes the same hash, goes straight to that slot, and compares only what's there.`,
      py`That's why items must be **hashable**: if an item could change after it was stored, its hash would change too, and Python would look in the wrong slot forever. Lists and dicts can change, so they're not allowed in sets.`,
      py`It's also why a set has **no order**: items sit wherever their hash puts them, not in the order you added them.`,
    ],
    technical: [
      py`Two items count as "the same" if they are **equal** (\`==\`). The language requires that equal objects have equal hashes, so \`1\`, \`1.0\` and \`True\` — which are all equal — collapse into one item: \`{1, 1.0, True}\` is \`{1}\` (the first one inserted is kept).`,
      py`Membership, \`add\` and \`remove\` are **O(1) on average**: their cost doesn't depend on the set's size. In the worst case — many items whose hashes collide — they degrade towards O(n), but with Python's built-in hash functions that's rare in practice. Set operations cost roughly the size of the sets involved — CPython computes \`a & b\` by looping over the smaller set and checking membership in the larger one.`,
      py`Iteration order is **not** part of the language contract. For strings it can even change from one run to the next: by default Python *salts* string and bytes hashes with a random value per process (hash randomisation), which protects servers from attackers who craft keys that all collide. If you need a stable order, sort.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython implements sets as an open-addressing hash table that is kept partly empty and grows (rehashing everything) as items are added. That spare room is why a set uses noticeably more memory than a list of the same items. Small ints hash to themselves in CPython, which is why a set of small numbers often *prints* in sorted order — a coincidence, not a feature.` },
    ],
    production: [
      py`Convert once, look up many times. \`allowed = set(load_allowed_ids())\` and then \`if user_id in allowed\` inside a loop turns a slow nested scan into fast lookups. You can measure the difference yourself with the list-vs-set demo in [performance](lesson:performance).`,
      py`Set algebra is the cleanest way to **diff** two snapshots: \`added = new - old\`, \`removed = old - new\`, \`unchanged = old & new\`. It's everywhere in sync jobs, permission checks (\`required <= granted\`) and tag filters.`,
      py`Expose constant groups as \`frozenset\`s (\`ADMIN_ROLES = frozenset({...})\`) so no module can mutate them by accident, and remember that \`set(rows)\` won't work on dicts — dedupe records by a key instead (a dict keyed by id).`,
      py`If you need both uniqueness **and** order, use a dict (\`dict.fromkeys\`) rather than a set. And when output is user-facing or tested, always \`sorted()\` a set before printing it.`,
    ],
  },
  mistakes: [
    {
      title: 'Making an empty set with {}',
      wrong: { code: py`seen = {}
seen.add("Ada")     # AttributeError: 'dict' object has no attribute 'add'`, lang: 'python', static: true },
      right: { code: py`seen = set()
seen.add("Ada")
print(seen)         # {'Ada'}`, lang: 'python' },
      explanation: py`\`{}\` is an empty dictionary. The empty set has no literal; write \`set()\`.`,
    },
    {
      title: 'set("word") when you meant {"word"}',
      wrong: { code: py`tags = set("python")
print(len(tags))     # 6 — one item per letter`, lang: 'python' },
      right: { code: py`tags = {"python"}
print(len(tags))     # 1`, lang: 'python' },
      explanation: py`\`set(x)\` loops over \`x\`, and looping over a string yields characters. Use the brace literal to make a set *containing* a string.`,
    },
    {
      title: 'Expecting order or indexes',
      wrong: { code: py`winners = {"Ada", "Ben", "Cy"}
print(winners[0])    # TypeError: 'set' object is not subscriptable`, lang: 'python', static: true },
      right: { code: py`winners = {"Ada", "Ben", "Cy"}
print(sorted(winners)[0])   # 'Ada' — sort first if you need positions`, lang: 'python' },
      explanation: py`Sets have no positions and no guaranteed order. If order matters, keep a list (or a dict) alongside, or sort when you need it.`,
    },
    {
      title: 'Deduplicating with set() and losing the order',
      wrong: { code: py`playlist = ["Intro", "Sunrise", "Intro", "Rainfall"]
playlist = list(set(playlist))   # order is now arbitrary`, lang: 'python' },
      right: { code: py`playlist = ["Intro", "Sunrise", "Intro", "Rainfall"]
playlist = list(dict.fromkeys(playlist))
print(playlist)    # ['Intro', 'Sunrise', 'Rainfall']`, lang: 'python' },
      explanation: py`A set forgets the order. \`dict.fromkeys\` removes duplicates *and* keeps first-seen order, because dicts preserve insertion order.`,
    },
    {
      title: 'Putting lists or dicts in a set',
      wrong: { code: py`visited = set()
visited.add([3, 4])    # TypeError: cannot use 'list' as a set element (unhashable type: 'list')`, lang: 'python', static: true },
      right: { code: py`visited = set()
visited.add((3, 4))    # a tuple of numbers is hashable
print((3, 4) in visited)   # True`, lang: 'python' },
      explanation: py`Only hashable values can be set items. Convert lists to tuples (and sets to frozensets) when you need to store them. See [tuples](lesson:tuples-and-unpacking).`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'dict' object has no attribute 'add'`,
      cause: py`The "set" was created with \`{}\`, which is an empty dict.`,
      fix: py`Use \`set()\` for an empty set.`,
    },
    {
      symptom: py`TypeError: 'set' object is not subscriptable`,
      cause: py`You indexed a set (\`s[0]\`) — sets have no positions.`,
      fix: py`Use \`in\` to test membership, loop over it, or convert with \`sorted(s)\` / \`list(s)\` first.`,
    },
    {
      symptom: py`KeyError: 'Zed'`,
      cause: py`\`s.remove("Zed")\` was called for an item that isn't in the set. (\`set().pop()\` similarly raises \`KeyError: 'pop from an empty set'\`.)`,
      fix: py`Use \`s.discard("Zed")\` if "missing" is fine, or check \`if "Zed" in s\` first.`,
    },
    {
      symptom: py`TypeError: cannot use 'list' as a set element (unhashable type: 'list')`,
      cause: py`You tried to put a mutable object (list, dict, set) into a set — or \`set(rows)\` where each row is a list or dict. Pre-3.14 wording: \`TypeError: unhashable type: 'list'\`.`,
      fix: py`Store an immutable version (\`tuple(row)\`, \`frozenset(tags)\`), or dedupe dicts by a key field instead.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for |: 'set' and 'list'`,
      cause: py`Set operators require sets on both sides.`,
      fix: py`Use the method form, which accepts any iterable — \`s.union(the_list)\` — or convert: \`s | set(the_list)\`.`,
    },
  ],
  bestPractices: [
    'Use a set whenever you repeatedly ask "is x in here?" over many items.',
    'Write set() for an empty set — never {}.',
    'Use discard() when a missing item is fine, remove() when it would be a bug.',
    'Sort a set before printing or comparing output so results are reproducible.',
    'Dedupe with list(dict.fromkeys(items)) when order matters.',
    'Use frozenset for constant groups and for sets that must be dict keys or set members.',
    'Diff snapshots with set algebra: added = new - old, removed = old - new.',
  ],
  useCases: [
    'Removing duplicate emails, tags or IDs.',
    'Fast "already seen?" checks when crawling pages or processing events.',
    'Finding what changed between two snapshots (added/removed items).',
    'Permission checks: required_permissions <= user_permissions.',
    'Finding common interests, mutual friends or shared tags.',
  ],
  whenToUse: {
    use: [
      'Items are unique by nature, or duplicates should be dropped.',
      'You test membership many times.',
      'You need union / intersection / difference between groups.',
    ],
    avoid: [
      'Order matters or you need indexing — use a list (or dict.fromkeys to dedupe).',
      'Items are mutable (lists, dicts) — convert them or use a dict keyed by an id.',
      'You need to count how often each item appears — use collections.Counter.',
    ],
  },
  comparison: {
    title: 'list vs set',
    headers: ['', 'list', 'set'],
    rows: [
      ['duplicates', 'kept', 'removed automatically'],
      ['order', 'insertion order, indexable', 'no order, no indexes'],
      ['x in collection', 'scans item by item — O(n)', 'one hash lookup — O(1) on average'],
      ['allowed items', 'anything', 'hashable items only'],
      ['combine groups', '+ (keeps duplicates)', '| & - ^ (set algebra)'],
      ['memory', 'compact array of references', 'larger (spare hash-table room)'],
    ],
    note: py`For "unique **and** ordered", use a dict's keys — see [dictionaries](lesson:dictionaries). To *count* duplicates rather than drop them, see \`Counter\` in [the collections module](lesson:collections-module).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'sets-q1',
      type: 'mcq',
      prompt: 'What does `items = {}` create?',
      options: [
        { text: 'An empty set', why: 'Curly braces with nothing inside mean a dict — the empty set is written set().' },
        'An empty dictionary',
        { text: 'A SyntaxError', why: '{} is perfectly valid syntax.' },
        { text: 'An empty frozenset', why: 'frozenset() creates an empty frozenset; {} is a dict.' },
      ],
      answer: 1,
      explanation: py`\`{}\` is the empty dict literal. Write \`set()\` for an empty set.`,
    },
    {
      id: 'sets-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`a = {1, 2, 3}
b = {2, 3, 4}
print(sorted(a ^ b), sorted(a - b))`,
      answer: '[1, 4] [1]',
      explanation: py`\`a ^ b\` is the items in exactly one set (1 and 4). \`a - b\` is the items in \`a\` but not in \`b\` (just 1).`,
    },
    {
      id: 'sets-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`values = {1, 1.0, True}
print(len(values))`,
      options: [
        { text: '3', why: 'They look different, but 1 == 1.0 == True, and a set keeps only one of each equal value.' },
        '1',
        { text: '2', why: 'True is not treated specially: it equals 1 too (bool is a subclass of int).' },
        { text: 'TypeError', why: 'All three are hashable, so they can go in a set.' },
      ],
      answer: 1,
      explanation: py`Set membership is decided by equality (backed by equal hashes). \`1\`, \`1.0\` and \`True\` are all equal, so the set holds just one item — the first one inserted, \`1\`.`,
    },
    {
      id: 'sets-q4',
      type: 'bug',
      prompt: 'This crashes on the first `add`. Click the line that causes the bug.',
      code: py`seen = {}
for word in ["red", "blue", "red"]:
    seen.add(word)
print(len(seen))`,
      answerLine: 1,
      explanation: py`\`seen = {}\` makes an empty **dict**, which has no \`add\` method (\`AttributeError\`). Line 3 is where it fails, but line 1 is the cause: use \`seen = set()\`.`,
    },
    {
      id: 'sets-q5',
      type: 'fill',
      prompt: 'Fill in the operators: `common` should hold people in **both** clubs and `everyone` people in **either**.',
      code: py`chess = {"Ada", "Ben", "Cy"}
coding = {"Cy", "Eve"}
common = chess ___ coding       # {'Cy'}
everyone = chess ___ coding     # {'Ada', 'Ben', 'Cy', 'Eve'}`,
      answer: [['&'], ['|']],
      explanation: py`\`&\` is intersection (both), \`|\` is union (either). The method forms are \`chess.intersection(coding)\` and \`chess.union(coding)\`.`,
    },
    {
      id: 'sets-q6',
      type: 'mcq',
      prompt: 'Why is `"Eve" in big_set` fast even when the set holds a million names?',
      options: [
        { text: 'Sets keep their items sorted and use binary search', why: 'Sets are unordered. Binary search would also need about 20 steps for a million items; a hash lookup needs about one.' },
        'Python hashes "Eve" and looks only in the slot where "Eve" would be stored',
        { text: 'Python remembers the answers to previous lookups', why: 'There is no lookup cache; every check computes the hash and inspects one slot.' },
        { text: 'Sets store fewer items because duplicates are removed', why: 'Removing duplicates helps a little, but a million unique names would still be slow to scan. Hashing is the reason.' },
      ],
      answer: 1,
      explanation: py`A set is a hash table: the item's hash points to the one place it could be, so the check costs about the same whatever the size (O(1) on average).`,
    },
    {
      id: 'sets-q7',
      type: 'short',
      prompt: 'You have a list of email addresses with duplicates, and the order matters (first sign-up first). How do you remove duplicates, and why not just use `set()`?',
      answer: py`Use \`list(dict.fromkeys(emails))\` (or a loop with a "seen" set that appends each email the first time it appears). \`set(emails)\` removes duplicates too, but sets have no order, so the first-come order would be lost. Dict keys are unique like a set's items, and dicts keep insertion order (guaranteed since Python 3.7), so \`dict.fromkeys\` keeps the first occurrence of each email in its original position.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'mutual-friends',
      title: 'Mutual friends & suggestions',
      difficulty: 'beginner',
      prompt: py`Friend lists arrive as **lists** (which may contain duplicates). Write two functions that each return a **sorted list** of names:

1. \`mutual(friends_a, friends_b)\` — names that appear in **both** lists.
2. \`suggestions(me, my_friends, their_friends)\` — people in \`their_friends\` who are **not** already in \`my_friends\` and are **not** \`me\`.

\`\`\`python
mutual(["Ada", "Ben", "Cy"], ["Cy", "Ada", "Dee"])        # ['Ada', 'Cy']
suggestions("Ada", ["Ben", "Cy"], ["Cy", "Dee", "Ada"])   # ['Dee']
\`\`\``,
      files: {
        'main.py': py`def mutual(friends_a, friends_b):
    # TODO: sorted list of names in both lists
    return []


def suggestions(me, my_friends, their_friends):
    # TODO: their friends, minus my friends, minus me — sorted
    return []


print(mutual(["Ada", "Ben", "Cy"], ["Cy", "Ada", "Dee"]))
print(suggestions("Ada", ["Ben", "Cy"], ["Cy", "Dee", "Ada", "Eve"]))
`,
      },
      hints: [
        'Convert each list to a set first with set(...). Duplicates disappear automatically.',
        'mutual is an intersection (&). suggestions is a difference: their set minus my set minus {me}. Wrap the result in sorted() to get a list.',
        'return sorted(set(friends_a) & set(friends_b))\n\nreturn sorted(set(their_friends) - set(my_friends) - {me})',
      ],
      solution: {
        explanation: py`Converting to sets removes duplicates and makes the comparisons one operator each. \`&\` keeps names in both; \`-\` removes everyone I already know, and \`- {me}\` removes me (a one-item set literal). \`sorted()\` turns the set into a list in a predictable order — important because a set's own order is arbitrary, and tests (or users) need stable output.`,
        files: {
          'main.py': py`def mutual(friends_a, friends_b):
    return sorted(set(friends_a) & set(friends_b))


def suggestions(me, my_friends, their_friends):
    return sorted(set(their_friends) - set(my_friends) - {me})


print(mutual(["Ada", "Ben", "Cy"], ["Cy", "Ada", "Dee"]))
print(suggestions("Ada", ["Ben", "Cy"], ["Cy", "Dee", "Ada", "Eve"]))
`,
        },
      },
      tests: [
        { name: 'mutual finds shared names, sorted', code: py`assert mutual(["Ada", "Ben", "Cy"], ["Cy", "Ada", "Dee"]) == ["Ada", "Cy"]` },
        { name: 'mutual ignores duplicates', code: py`assert mutual(["Ada", "Ada", "Ben"], ["Ada", "Ada"]) == ["Ada"]` },
        { name: 'suggestions excludes my friends and me', code: py`assert suggestions("Ada", ["Ben", "Cy"], ["Cy", "Dee", "Ada", "Eve"]) == ["Dee", "Eve"]` },
        { name: 'suggestions has no duplicates', code: py`assert suggestions("Ada", [], ["Ben", "Ben", "Cy"]) == ["Ben", "Cy"]` },
        { name: 'both return lists', code: py`assert type(mutual(["a"], ["a"])) is list and type(suggestions("x", [], ["y"])) is list` },
      ],
    },
    {
      id: 'first-repeat',
      title: 'The first repeated ticket',
      difficulty: 'beginner',
      prompt: py`A ticket scanner logs ticket numbers in the order they're scanned. A ticket scanned twice is a fraud warning.

Write \`first_repeat(tickets)\` that returns the **first ticket number that is scanned a second time** — the one whose *second* scan happens earliest — or \`None\` if no ticket repeats.

- \`first_repeat([5, 3, 8, 3, 5])\` → \`3\` (3's second scan comes before 5's)
- \`first_repeat([1, 2, 3])\` → \`None\`

Use a **set** to remember what you've seen, so the function stays fast for long logs.`,
      files: {
        'main.py': py`def first_repeat(tickets):
    # TODO: return the first ticket seen twice, or None
    return None


print(first_repeat([5, 3, 8, 3, 5]))
print(first_repeat([1, 2, 3]))
`,
      },
      hints: [
        'Walk through the tickets in order, remembering every ticket you have already seen.',
        'Start with seen = set(). For each ticket: if it is already in seen, that is your answer; otherwise add it.',
        'seen = set()\nfor ticket in tickets:\n    if ticket in seen:\n        return ticket\n    seen.add(ticket)\nreturn None',
      ],
      solution: {
        explanation: py`This is the classic **seen-set** pattern. Walking the log in order, each ticket is checked against \`seen\` and then added. The first time a check succeeds, that ticket is the one whose second scan came earliest, so we return immediately. Each \`in\` and \`add\` is O(1) on average, so the whole function is one pass over the log. With a *list* for \`seen\`, every check would scan the list, and long logs would get much slower.`,
        files: {
          'main.py': py`def first_repeat(tickets):
    seen = set()
    for ticket in tickets:
        if ticket in seen:
            return ticket
        seen.add(ticket)
    return None


print(first_repeat([5, 3, 8, 3, 5]))
print(first_repeat([1, 2, 3]))
`,
        },
      },
      tests: [
        { name: 'finds the earliest second scan', code: py`assert first_repeat([5, 3, 8, 3, 5]) == 3` },
        { name: 'no repeats gives None', code: py`assert first_repeat([1, 2, 3]) is None` },
        { name: 'immediate repeat', code: py`assert first_repeat([7, 7, 1, 1]) == 7` },
        { name: 'works with strings', code: py`assert first_repeat(["A1", "B2", "C3", "B2", "A1"]) == "B2"` },
        { name: 'empty log gives None', code: py`assert first_repeat([]) is None` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'sets-why-fast',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is `x in my_set` usually much faster than `x in my_list` for large collections?',
      answer: 'A set is a hash table: Python hashes x and checks the one slot where x would be, so membership is O(1) on average. A list has no index by value, so in scans items one by one — O(n).',
      explanation: py`The hash of an item determines where it's stored. Lookup recomputes the hash, probes that slot, and confirms with \`==\`. Average cost is constant; worst case (pathological collisions) is linear. The price is memory (spare table room), no ordering, and the requirement that items be hashable.`,
      whyAsked: 'Choosing the right structure for membership tests is one of the most common performance wins in real code.',
      mistakes: ['Saying sets are sorted', 'Claiming O(1) is guaranteed in every case', 'Not mentioning the hashability requirement or the memory trade-off'],
      followUps: ['What does "hashable" mean?', 'What is the worst case and when could it happen?', 'Why must equal objects have equal hashes?'],
      modelAnswer: 'A set is implemented as a hash table. When I check x in s, Python computes hash(x), jumps to the slot that hash points to and confirms with an equality check, so the cost stays roughly constant however big the set is — O(1) on average. A list has no way to find an item by value, so in has to compare items one by one, which is O(n). The trade-offs are that set items must be hashable, sets have no order, and they use more memory. So if I check membership repeatedly, I convert to a set once and look up many times.',
    },
    {
      id: 'sets-operators-vs-methods',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `a | b` and `a.union(b)`? Which line below raises an error?',
      code: { lang: 'python', code: py`a = {1, 2}
r1 = a.union([3], (4,))
r2 = a | [3]
r3 = a | frozenset({5})` },
      options: ['r1', 'r2', 'r3', 'none of them'],
      correctOption: 1,
      answer: 'r2 raises TypeError: unsupported operand type(s) for |: \'set\' and \'list\'. Operators require both operands to be sets (set or frozenset); the methods accept any iterables, and several at once.',
      explanation: py`The operator forms are deliberately strict so that typos like \`my_set | "abc"\` (which would add letters) fail loudly. Methods are permissive: \`union\`, \`intersection\`, \`difference\` and \`update\` take any number of iterables. Both return new sets; the in-place counterparts are \`|=\` / \`update()\` and so on. Mixing \`set\` and \`frozenset\` is fine; the result type follows the left operand.`,
      whyAsked: 'Shows careful knowledge of the API and the design reasoning behind it.',
      mistakes: ['Saying they are exactly equivalent', 'Not knowing the methods accept multiple iterables', 'Thinking a set and a frozenset can\'t be combined'],
      followUps: ['What type does frozenset({1}) | {2} return?', 'What is the difference between a | b and a |= b for aliasing?'],
      modelAnswer: 'They compute the same union, but the operator is strict and the method is permissive. The operator requires both sides to be sets or frozensets, so r2 — a set or-ed with a list — raises TypeError. The union method accepts any iterables, even several at once, so r1 is fine, and r3 is fine because a frozenset is a set type. I use operators when both sides are already sets because they read like maths, and methods when I am combining with lists or other iterables. Both return new sets; for in-place updates there are |= and update.',
    },
    {
      id: 'sets-equal-values',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why?',
      code: { lang: 'python', code: py`print({1, 1.0, True})
print({0.0, 0, False})` },
      options: ['{1}  and  {0.0}', '{1, 1.0, True}  and  {0.0, 0, False}', '{True}  and  {False}', 'TypeError'],
      correctOption: 0,
      answer: '`{1}` and `{0.0}`. The values are equal (1 == 1.0 == True) with equal hashes, so each set keeps only the first one inserted.',
      explanation: py`Sets (and dict keys) treat equal values as the same item. \`bool\` is a subclass of \`int\`, so \`True == 1\` and \`hash(True) == hash(1)\`; and \`1 == 1.0\` with \`hash(1) == hash(1.0)\` by language rule (numbers that compare equal must hash equal). When a "duplicate" is added, the existing element is kept.`,
      whyAsked: 'A favourite trick question that tests understanding of the hash/equality contract and numeric types.',
      mistakes: ['Expecting three items because the types differ', 'Thinking the last value inserted wins'],
      followUps: ['What would {True: "a", 1: "b"} produce?', 'Why must equal objects have equal hashes?'],
      modelAnswer: 'It prints {1} and then {0.0}. A set decides "same item" by equality, and in Python 1, 1.0 and True are all equal — bool is a subclass of int — and the language requires equal numbers to have equal hashes. So the second and third values are treated as duplicates and the element already stored, the first one inserted, is kept. The same thing happens with dict keys, where the first key is kept but the value is overwritten.',
    },
    {
      id: 'sets-sync-inventory',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `diff_inventory(old, new)` that takes two lists of product codes (possibly with duplicates) and returns a tuple `(added, removed)` of **sorted lists**: codes in `new` but not `old`, and codes in `old` but not `new`.',
      answer: 'Convert both to sets, then added = sorted(new_set - old_set) and removed = sorted(old_set - new_set).',
      explanation: py`Set difference expresses "in one snapshot but not the other" directly, removes duplicates, and runs in time proportional to the sizes of the sets rather than their product. Sorting makes the output deterministic.`,
      starter: { files: { 'main.py': py`def diff_inventory(old, new):
    # TODO: return (added, removed) as sorted lists
    return [], []


print(diff_inventory(["A1", "B2", "C3"], ["B2", "C3", "D4", "D4"]))
` } },
      tests: [
        { name: 'finds added and removed codes', code: py`assert diff_inventory(["A1", "B2", "C3"], ["B2", "C3", "D4"]) == (["D4"], ["A1"])` },
        { name: 'ignores duplicates', code: py`assert diff_inventory(["A1", "A1"], ["B2", "B2", "A1"]) == (["B2"], [])` },
        { name: 'results are sorted lists', code: py`added, removed = diff_inventory([], ["Z9", "A1", "M5"])
assert added == ["A1", "M5", "Z9"] and removed == []` },
        { name: 'no changes', code: py`assert diff_inventory(["X"], ["X"]) == ([], [])` },
      ],
      solution: { files: { 'main.py': py`def diff_inventory(old, new):
    old_set, new_set = set(old), set(new)
    added = sorted(new_set - old_set)
    removed = sorted(old_set - new_set)
    return added, removed


print(diff_inventory(["A1", "B2", "C3"], ["B2", "C3", "D4", "D4"]))
` } },
      hints: ['Two set differences — one in each direction.', 'sorted() on a set returns a list.'],
      whyAsked: 'Diffing snapshots is a daily task in sync jobs, deployments and data pipelines; it checks you reach for sets instead of nested loops.',
      mistakes: ['Nested loops with list membership (quadratic)', 'Forgetting duplicates', 'Returning sets when lists were requested'],
      followUps: ['How would you also report items whose quantity changed? (dicts)', 'What if the lists were too big for memory?'],
      modelAnswer: 'I convert both lists to sets, which removes duplicates and gives me constant-time membership. Then the added codes are the new set minus the old set, and the removed codes are the old set minus the new set. I wrap each in sorted so the result is a deterministic list. That runs in linear time overall, where a nested loop with list membership would be quadratic. If I also needed changed quantities I would use dicts keyed by product code.',
    },
    {
      id: 'sets-unhashable-records',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This dedupe fails with `TypeError: cannot use \'dict\' as a set element (unhashable type: \'dict\')`. Why, and how would you deduplicate these records?',
      code: { lang: 'python', code: py`orders = [
    {"id": 1, "item": "tea"},
    {"id": 2, "item": "jam"},
    {"id": 1, "item": "tea"},
]
unique = set(orders)` },
      answer: 'Dicts are mutable and therefore unhashable, so they can\'t be set elements. Deduplicate by a key instead: {o["id"]: o for o in orders}.values(), or track seen ids in a set while building a new list.',
      explanation: py`If a dict could live in a set, mutating it would change its hash and corrupt the table, so Python forbids it. Usually records have a natural identity (an id): dedupe by that. If the whole content defines identity, convert each record to a hashable form like \`tuple(sorted(o.items()))\` (only if the values are hashable themselves).`,
      whyAsked: 'Real data is records, not ints; this checks you understand hashability and can design around it.',
      mistakes: ['Converting dicts to strings with str() (key order and formatting make it fragile)', 'Not asking what "duplicate" means for the business', 'Losing order when it matters'],
      followUps: ['Which version of a duplicate should win — first or last?', 'How would a dataclass(frozen=True) help?'],
      modelAnswer: 'Set elements must be hashable, and dicts are mutable, so Python refuses to hash them. The right fix depends on what "duplicate" means. Usually records have an id, so I would dedupe by that — for example, keep a set of seen ids and append each order the first time its id appears, which also preserves order. If equality really is the whole record, I can convert each to a hashable form like a tuple of sorted items, or model orders as frozen dataclasses, which are hashable.',
    },
    {
      id: 'sets-frozenset-use',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a `frozenset` and when would you use one instead of a `set`?',
      answer: 'An immutable set. Because it can\'t change it is hashable, so it can be a dict key or an element of another set; it is also a safe constant that other code can\'t mutate.',
      explanation: py`frozensets support every non-mutating set operation (\`in\`, \`|\`, \`&\`, \`-\`, \`^\`, subset tests) but have no \`add\`/\`remove\`. Typical uses: module-level constants (\`ALLOWED_EXTENSIONS\`), keys that represent unordered groups (\`{frozenset({"Ada", "Ben"}): ...}\` where \`{Ada, Ben}\` and \`{Ben, Ada}\` must be the same key), and sets of sets.`,
      whyAsked: 'Probes knowledge of hashability and immutability beyond the basic containers.',
      mistakes: ['Saying frozensets are faster (no meaningful general difference)', 'Not knowing they can be dict keys'],
      followUps: ['How would you represent an undirected edge in a graph?', 'What does frozenset({1}) == {1} return? (True)'],
      modelAnswer: 'A frozenset is the immutable version of a set. It supports membership and all the set algebra but has no add or remove. Because it can\'t change, it is hashable, which unlocks two things: it can be a dictionary key or an element of another set — for example an undirected edge or a pair of people where order mustn\'t matter — and it is a safe constant, like a module-level ALLOWED_EXTENSIONS that no other code can mutate by accident. It also compares equal to a regular set with the same items.',
    },
    {
      id: 'sets-mutating-after-insert',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A custom class defines `__eq__` and `__hash__` based on a mutable `email` attribute. After adding a user to a set, code changes the user\'s email, and `user in users` becomes False. Explain and propose a design fix.',
      answer: 'The set stored the user in the slot chosen by its old hash. After the email changed, the new hash points elsewhere, so lookup misses (and the stale entry lingers). Hash only on immutable identity (e.g. a fixed user id), or make the object immutable (frozen dataclass).',
      explanation: py`The hash contract: objects that compare equal must have equal hashes, and an object's hash must not change while it's in a hash-based collection. Mutable fields used in \`__hash__\` break the second rule. Options: hash by an immutable id; use \`@dataclass(frozen=True)\` so fields can't change; or don't make the class hashable at all (\`__hash__ = None\`) and key a dict by id instead. See [special methods](lesson:special-methods).`,
      code: { lang: 'python', code: py`class User:
    def __init__(self, email):
        self.email = email
    def __eq__(self, other):
        return isinstance(other, User) and self.email == other.email
    def __hash__(self):
        return hash(self.email)

u = User("ada@old.example")
users = {u}
u.email = "ada@new.example"
print(u in users)   # False — the set looks in the wrong slot` },
      whyAsked: 'Senior engineers must reason about invariants of the data structures they rely on; this bug is subtle and real.',
      mistakes: ['Blaming the set implementation', 'Fixing it by re-adding the object (leaves a stale entry)', 'Hashing on id(self) while keeping value-based __eq__ (breaks the contract)'],
      followUps: ['Why does defining __eq__ set __hash__ to None by default?', 'How do frozen dataclasses generate __hash__?'],
      modelAnswer: 'When the user was added, the set put it in the slot chosen by hash of the old email. Changing the email changes the hash, so a later lookup goes to a different slot and misses, while the object still sits in the old slot — the set is effectively corrupted. The rule is that an object\'s hash must not change while it lives in a set or as a dict key. So I would hash on something immutable, like a user id that never changes, or make the class immutable with a frozen dataclass. If the object really needs to be mutable, I would not make it hashable at all and instead index users in a dict keyed by id.',
    },
  ],

  takeaways: [
    'A set holds unique, hashable items with no order; {} is a dict, so the empty set is set().',
    'add / update add items; remove raises KeyError when missing, discard doesn\'t.',
    'x in s is O(1) on average because the hash points straight to where x would be.',
    'Set algebra: | union, & intersection, - difference, ^ symmetric difference, <= subset; methods accept any iterable.',
    'Items must be hashable: lists and dicts can\'t go in sets; tuples and frozensets can.',
    'Sets have no reliable order — sort before printing; dedupe in order with list(dict.fromkeys(items)).',
    'frozenset is an immutable, hashable set for constants and dict keys.',
  ],
}
