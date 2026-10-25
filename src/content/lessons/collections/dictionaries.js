// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP = py`# A corner shop's stock, keyed by product name
stock = {"apples": 12, "bread": 3, "milk": 0}
print("Bread in stock:", stock["bread"])
print("Jam in stock:", stock.get("jam", 0))   # a default instead of KeyError

stock["jam"] = 5                 # add a new key
stock["milk"] += 6               # update an existing value
del stock["apples"]              # remove a key and its value
print("Stock now:", stock)

for product, qty in stock.items():
    print(f"{product:<6}{qty:>3}")

# Counting: how often was each product ordered?
orders = ["jam", "milk", "jam", "bread", "jam", "milk"]
counts = {}
for item in orders:
    counts[item] = counts.get(item, 0) + 1
print("Order counts:", counts)

# Grouping: fruit by first letter
fruit = ["apple", "avocado", "banana", "blueberry", "cherry"]
by_letter = {}
for name in fruit:
    by_letter.setdefault(name[0], []).append(name)
print("By letter:", by_letter)

restock = {"bread": 10, "eggs": 12}
print("After merge:", stock | restock)   # Python 3.9+
`

export default {
  id: 'dictionaries',
  title: 'Dictionaries: looking things up by key',
  summary: 'A dict maps unique, hashable keys to values, finds a value by its key without searching, keeps insertion order, and is the workhorse behind counting, grouping, configuration and JSON.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['lists', 'tuples-and-unpacking', 'sets'],
  related: ['sets', 'collections-module', 'mutability-and-copying', 'json-data', 'comprehensions', 'typing-collections-and-unions', 'dataclasses'],
  tags: ['dict', 'dictionary', 'dictionaries', 'key', 'value', 'mapping', 'hash table', 'get', 'setdefault', 'update', 'merge', '|', 'items', 'keys', 'values', 'insertion order', 'nested dict', 'counting', 'grouping', 'KeyError', 'hashable'],
  apis: [
    { name: 'd[key]', summary: 'Read the value for key; raises KeyError if the key is missing.' },
    { name: 'd[key] = value', summary: 'Add a new key, or replace the value of an existing one.' },
    { name: 'd.get(key, default=None)', summary: 'Read the value, or return default if the key is missing (never raises).' },
    { name: 'd.setdefault(key, default)', summary: 'Return d[key]; if missing, first insert key with default.' },
    { name: 'd.update(other) / d |= other', summary: 'Merge other into d in place; other\'s values win on clashes.' },
    { name: 'd | other', summary: 'A new merged dict (Python 3.9+); the right side wins on clashes.' },
    { name: 'd.pop(key[, default])', summary: 'Remove key and return its value (or default; KeyError without one).' },
    { name: 'del d[key]', summary: 'Remove a key and its value.' },
    { name: 'd.keys() / d.values() / d.items()', summary: 'Live views of the keys, the values, and (key, value) pairs.' },
    { name: 'dict.fromkeys(iterable, value=None)', summary: 'A new dict with each item as a key, all sharing one value.' },
  ],
  docs: [
    { label: 'Tutorial — dictionaries', url: 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries' },
    { label: 'Library reference — mapping types (dict)', url: 'https://docs.python.org/3/library/stdtypes.html#mapping-types-dict' },
    { label: 'PEP 584 — union operators for dict (3.9)', url: 'https://peps.python.org/pep-0584/' },
    { label: 'What\'s New in Python 3.7 — dict order is guaranteed', url: 'https://docs.python.org/3/whatsnew/3.7.html#summary-release-highlights' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **dictionary** (\`dict\`) stores values under **keys**: \`{"apples": 12, "bread": 3}\`. Each key–value pair is called an **item**. Instead of asking "what's at position 2?" like a [list](lesson:lists), you ask "what's stored under \`"bread"\`?" — \`stock["bread"]\` → \`3\`.`,
    py`Keys are **unique** (writing to an existing key replaces its value) and must be **hashable** — strings, numbers and tuples of those are the usual choices. Values can be anything at all, including lists and other dicts.`,
    py`Like a [set](lesson:sets), a dict is a **hash table**, so finding a key doesn't mean searching: Python computes where the key must live and looks there. And since Python 3.7 the language guarantees that a dict remembers the **order** in which keys were first inserted.`,
  ],
  why: [
    py`Most real data is *labelled*: a user has a name, an email and an age; a product has a price and a stock level; a config file has settings with names. A dict lets you reach each value by its label — \`user["email"]\` — instead of remembering that the email is item number 1.`,
    py`Dicts are also the standard tool for **lookup tables** (country code → country name), **counting** (word → how many times), **grouping** (house → students) and **caching** (input → already-computed result). JSON, the most common format for web APIs, maps directly onto dicts (see [JSON data](lesson:json-data)).`,
  ],
  eli15: [
    py`A dictionary is a **phone's contact list**. You don't scroll to "contact number 247" — you type a **name** and get the **number**. The name is the *key*, the phone number is the *value*.`,
    py`No two contacts can have exactly the same name (save a new number under an existing name and you overwrite the old one), and finding someone is instant however many contacts you have.`,
    py`A value can be anything — even a whole mini contact card with an email, a birthday and a list of photos. That's a dict *inside* a dict.`,
  ],
  analogy: {
    title: 'A school locker room with name tags',
    body: [
      py`Every locker has a **name tag** on the door and some stuff inside. To get Ada's things you don't open every locker — you go straight to the one labelled "Ada".`,
      py`The school assigns lockers using a rule based on the name (that's the **hash**), so the caretaker always knows which corridor to check. One name, one locker: a second "Ada" tag would just replace what's inside. And the caretaker's register lists lockers in the order they were handed out.`,
    ],
    mapping: [
      ['the name on the locker', 'the key ("Ada")'],
      ['the stuff inside', 'the value (anything — even another dict)'],
      ['going straight to the right locker', 'd["Ada"] — a hash lookup, no searching'],
      ['"Ada has no locker" — the caretaker shrugs', 'KeyError, or d.get("Ada") returning None'],
      ['putting new stuff in an existing locker', 'd["Ada"] = new_value replaces the value'],
      ['the register in hand-out order', 'insertion order (guaranteed since 3.7)'],
    ],
  },
  visual: {
    type: 'hash-table',
    title: 'Keys go through a hash to find their slot',
    props: { preset: 'dict' },
    alt: 'An interactive, simplified hash table for a dictionary. Typing a key computes its hash, which picks a bucket; the key and its value are stored together in that bucket. Looking up a key hashes it again and goes straight to that bucket, and writing to an existing key replaces its value.',
    caption: py`Add keys with values and watch each **key** (never the value) get hashed to a bucket, where the key and value are stored together. A lookup hashes the key again and goes straight to one bucket. (A simplified model of CPython's real table.)`,
  },
  syntax: [
    py`#### Creating dicts`,
    { code: py`stock = {"apples": 12, "bread": 3}         # literal: key: value pairs
empty = {}                                  # an empty dict (not a set!)
user = dict(name="Ada", age=15)             # keyword style: string keys only
pairs = dict([("x", 1), ("y", 2)])          # from (key, value) pairs
zeros = dict.fromkeys(["a", "b"], 0)        # {'a': 0, 'b': 0}
squares = {n: n * n for n in range(4)}      # dict comprehension: {0: 0, 1: 1, 2: 4, 3: 9}`, lang: 'python', title: 'five ways to build a dict' },
    py`Dict comprehensions get their own section in [comprehensions](lesson:comprehensions).`,
    py`#### Reading: [] vs get()`,
    { code: py`stock = {"apples": 12, "bread": 3}
stock["bread"]            # 3
stock["jam"]              # KeyError: 'jam'
stock.get("jam")          # None — no error
stock.get("jam", 0)       # 0 — your chosen default
"jam" in stock            # False — 'in' checks KEYS
12 in stock               # False — values are not checked
12 in stock.values()      # True`, lang: 'python', title: 'reading values' },
    py`Use \`d[key]\` when the key **must** be there — a missing key is a bug and you want the \`KeyError\`. Use \`d.get(key, default)\` when a missing key is normal ("no jam yet means 0 jam").`,
    py`#### Writing and removing`,
    { code: py`stock = {"apples": 12, "bread": 3}
stock["jam"] = 5               # add a new key
stock["bread"] = 10            # replace an existing value
stock["apples"] += 1           # read, add, write back (KeyError if missing)
stock.update({"milk": 6, "bread": 4})    # merge in place; bread becomes 4
qty = stock.pop("jam")         # remove and return the value (5)
stock.pop("tea", None)         # missing is fine when you give a default
del stock["milk"]              # remove (KeyError if missing)
stock.setdefault("eggs", 0)    # inserts eggs: 0 only if eggs is missing`, lang: 'python', title: 'add, update, remove' },
    py`#### Merging with | and |= (Python 3.9+)`,
    { code: py`defaults = {"theme": "light", "font": 14}
user_prefs = {"theme": "dark"}
settings = defaults | user_prefs     # NEW dict: {'theme': 'dark', 'font': 14}
defaults |= {"lang": "en"}           # in place, like update()`, lang: 'python', title: 'the right-hand side wins' },
    { callout: 'version', title: 'Python 3.9+', text: py`The \`|\` and \`|=\` operators for dicts arrived in Python 3.9 (PEP 584). On older versions write \`{**defaults, **user_prefs}\` or use \`update()\`.` },
    py`#### Looping`,
    { code: py`stock = {"bread": 3, "milk": 6}
for product in stock:                 # keys (same as stock.keys())
    print(product)
for qty in stock.values():            # values only
    print(qty)
for product, qty in stock.items():    # (key, value) pairs, unpacked
    print(product, qty)`, lang: 'python', title: 'keys, values, items' },
    py`Loops visit keys in **insertion order**. Re-assigning an existing key keeps its position; deleting it and adding it again moves it to the end. \`.keys()\`, \`.values()\` and \`.items()\` return *views*: live windows onto the dict that update when it changes.`,
    { callout: 'warn', title: 'Don\'t change a dict\'s size while looping over it', text: py`Adding or deleting keys inside \`for k in d:\` raises \`RuntimeError: dictionary changed size during iteration\`. Loop over a snapshot — \`for k in list(d):\` — or build a new dict with a comprehension. Changing the *values* of existing keys is fine.` },
    py`#### Nested dicts`,
    { code: py`school = {
    "Ada": {"age": 15, "scores": [90, 85]},
    "Ben": {"age": 16, "scores": [70]},
}
print(school["Ada"]["scores"][-1])     # 85 — read brackets left to right
school["Ben"]["scores"].append(88)     # change the inner list in place
school["Cy"] = {"age": 15, "scores": []}`, lang: 'python', title: 'dicts of dicts (and lists)' },
    py`#### Two everyday patterns: counting and grouping`,
    { code: py`words = ["jam", "tea", "jam"]
counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1          # {'jam': 2, 'tea': 1}

groups = {}
for name, house in [("Ada", "Red"), ("Ben", "Blue"), ("Cy", "Red")]:
    groups.setdefault(house, []).append(name)  # {'Red': ['Ada', 'Cy'], 'Blue': ['Ben']}`, lang: 'python', title: 'get(…, 0) + 1 and setdefault(…, [])' },
    py`Both patterns are so common that the standard library has dedicated tools: \`Counter\` and \`defaultdict\` in [the collections module](lesson:collections-module).`,
    py`#### Keys must be hashable`,
    py`Strings, numbers, \`None\`, booleans, tuples of hashable values and frozensets can be keys. Lists, dicts and sets can't: \`{[1, 2]: "x"}\` raises \`TypeError: cannot use 'list' as a dict key (unhashable type: 'list')\` in 3.14 (older: \`unhashable type: 'list'\`). Keys that are **equal** are the same key: \`1\`, \`1.0\` and \`True\` all land on one entry.`,
  ],
  walkthrough: {
    title: 'Reading the shop program line by line',
    lang: 'python',
    code: SHOP,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 4], text: py`A dict literal with three items. \`stock["bread"]\` returns 3. \`stock.get("jam", 0)\` returns the default \`0\` because "jam" isn't a key — square brackets would have raised \`KeyError\`.` },
      { lines: [6, 9], text: py`Assigning to a new key adds it (at the end of the order); \`+=\` on an existing key reads, adds and writes back; \`del\` removes "apples" entirely. The printed dict shows the new order: bread, milk, jam.` },
      { lines: [11, 12], text: py`\`.items()\` yields \`(key, value)\` tuples, which the \`for\` loop unpacks into \`product\` and \`qty\`. The f-string pads them into neat columns.` },
      { lines: [15, 19], text: py`The counting pattern: \`counts.get(item, 0)\` is "the count so far, or 0 the first time", then \`+ 1\` and store it back. Keys appear in the order they were first seen.` },
      { lines: [22, 26], text: py`The grouping pattern: \`setdefault(letter, [])\` returns the existing list for that letter — or inserts a fresh empty list first — and \`.append(name)\` adds to it in place.` },
      { lines: [28, 29], text: py`\`stock | restock\` builds a **new** merged dict. "bread" is in both, and the right-hand side wins (10). "eggs" is new, so it is added at the end.` },
    ],
  },
  playground: {
    title: 'Corner shop',
    objective: 'Run it, then add products, look up missing ones safely, and see which side wins a merge.',
    files: { 'main.py': SHOP },
    expected: py`\`\`\`text
Bread in stock: 3
Jam in stock: 0
Stock now: {'bread': 3, 'milk': 6, 'jam': 5}
bread   3
milk    6
jam     5
Order counts: {'jam': 3, 'milk': 2, 'bread': 1}
By letter: {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
After merge: {'bread': 10, 'milk': 6, 'jam': 5, 'eggs': 12}
\`\`\``,
    experiments: [
      {
        id: 'add-eggs',
        task: py`Add a product \`"eggs"\` with a quantity of \`12\` to \`stock\` **before** the "Stock now" line. Where does it appear in the printed dict?`,
        hint: py`\`stock["eggs"] = 12\` anywhere between line 2 and line 9.`,
        tests: [
          { name: 'eggs is in stock with 12', code: py`assert stock.get("eggs") == 12` },
          { name: 'eggs shows up in the Stock now line', code: py`line = [l for l in output.splitlines() if l.startswith("Stock now:")][0]
assert "'eggs': 12" in line` },
        ],
        explain: py`A new key is added at the **end** of the insertion order, so eggs prints last (unless you added it before \`stock["jam"] = 5\`). It also appears in the \`for\` loop's table automatically.`,
      },
      {
        id: 'missing-tea',
        task: py`First add \`print(stock["tea"])\` and run it — read the error. Then replace it with a line that prints exactly \`Tea in stock: 0\` without crashing.`,
        hint: py`\`stock.get("tea", 0)\` returns 0 for a missing key.`,
        tests: [{ name: 'prints Tea in stock: 0', code: py`assert "Tea in stock: 0" in output` }],
        explain: py`\`stock["tea"]\` raises \`KeyError: 'tea'\`. \`get\` with a default answers "how much tea?" with 0 instead. Use \`[]\` when a missing key is a bug, \`get\` when it's an ordinary situation.`,
      },
      {
        id: 'count-eggs',
        task: py`Add \`"eggs"\` to the \`orders\` list **twice**. Predict the new "Order counts" line before you run.`,
        hint: py`Edit the list on line 15.`,
        tests: [{ name: 'eggs counted twice', code: py`assert counts.get("eggs") == 2` }],
        explain: py`The counting loop doesn't need to know the products in advance: the first "eggs" finds no key, so \`get\` returns 0 and the count becomes 1; the second makes it 2.`,
      },
      {
        id: 'merge-order',
        task: py`Swap the merge on the last line to \`restock | stock\`. Predict the new **After merge** line — which value of "bread" wins, and in what order are the keys?`,
        hint: py`On a clash, the right-hand side's value wins. The key order follows the left-hand dict, then any new keys from the right.`,
        tests: [{ name: 'the merge is reversed', code: py`assert "After merge: {'bread': 3, 'eggs': 12, 'milk': 6, 'jam': 5}" in output` }],
        explain: py`\`restock | stock\` starts from a copy of \`restock\` (bread, eggs), then writes every item of \`stock\` into it. "bread" already exists, so its value is replaced by 3 but its position stays first; "milk" and "jam" are added at the end.`,
      },
    ],
  },
  animation: {
    type: 'hash-table',
    title: 'What happens when two keys want the same slot',
    props: { preset: 'collision' },
    alt: 'A simplified hash table where two different keys hash to the same bucket. The animation shows the collision being resolved so both keys are stored, and a lookup comparing keys with equality to find the right one.',
    caption: py`Different keys can produce hashes that point at the **same** slot — a *collision*. Python then probes further until it finds a free slot, and on lookup it compares keys with \`==\` to be sure it found the right one. Collisions are why lookups are O(1) *on average* rather than always.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When you write \`stock["bread"] = 3\`, Python computes \`hash("bread")\` — a big whole number calculated from the text — and uses it to pick a slot in an internal table. The key and the value are stored together in that slot.`,
      py`Later, \`stock["bread"]\` computes the same hash, goes to the same slot, checks that the key there really is \`"bread"\`, and hands you the value. No scanning through every item: that's why dicts stay fast even with millions of keys.`,
      py`This is also why keys must be **hashable** (their hash can never change). If you could use a list as a key and then append to it, its hash would change and Python would look in the wrong slot forever.`,
    ],
    technical: [
      py`**Average O(1)** for get, set, \`in\` and delete; the worst case (many collisions) is O(n). The language requires that objects which compare equal have equal hashes, so \`1\`, \`1.0\` and \`True\` share one entry: \`{1: "a", 1.0: "b", True: "c"}\` is \`{1: 'c'}\` — the first key is kept, the last value wins.`,
      py`**Order is a language guarantee since Python 3.7**: iteration follows insertion order; updating an existing key's value keeps its position. Equality ignores order, though: \`{"a": 1, "b": 2} == {"b": 2, "a": 1}\` is \`True\` (an \`OrderedDict\` comparison would say \`False\`).`,
      py`\`.keys()\` and \`.items()\` views are **set-like**: \`d1.keys() & d2.keys()\` gives the keys two dicts share. Views are live — a view created before an insert shows the new key.`,
      py`For security, string and bytes hashes are randomised per process by default (hash randomisation), so attackers can't pre-compute keys that all collide and make a web server's dicts slow.`,
      { callout: 'note', title: 'CPython detail', text: py`Since CPython 3.6, dicts are "compact": the items live in a dense array in insertion order, and a separate small index table maps hash slots to positions in that array. That layout saves memory *and* is why insertion order came for free — CPython 3.6 kept order as an implementation detail, and 3.7 made it a language guarantee. CPython also lets instances of the same class share one table of attribute names (key-sharing dicts).` },
    ],
    production: [
      py`Decide deliberately between \`d[key]\` and \`d.get(key)\`: a \`KeyError\` near the bug is far easier to debug than a \`None\` that travels through the program and crashes somewhere else. And beware \`if d.get("qty"):\` when 0 is a valid value — test presence with \`"qty" in d\`.`,
      py`Dicts are perfect for data whose keys come from the data (word counts, ids → records). For records with a **fixed set of fields** — a user always has name, email, age — prefer a [dataclass](lesson:dataclasses) or a \`TypedDict\` (see [typing collections](lesson:typing-collections-and-unions)) so typos are caught by tools.`,
      py`\`a | b\` and \`update\` are **shallow** merges: a nested dict under the same key is replaced, not merged. Layered configuration therefore needs a small recursive merge, or \`collections.ChainMap\` (see [the collections module](lesson:collections-module)). And a dict stored as a default or a module-level constant is shared — copy it before modifying (see [mutability & copying](lesson:mutability-and-copying)).`,
    ],
  },
  mistakes: [
    {
      title: 'Reading a key that might not exist with []',
      wrong: { code: py`stock = {"bread": 3}
print(stock["jam"])          # KeyError: 'jam'`, lang: 'python', static: true },
      right: { code: py`stock = {"bread": 3}
print(stock.get("jam", 0))   # 0`, lang: 'python' },
      explanation: py`Square brackets demand that the key exists. When "missing" is a normal case, use \`get\` with a sensible default.`,
    },
    {
      title: 'Testing a value with get() when 0 or "" is valid',
      wrong: { code: py`stock = {"milk": 0}
if stock.get("milk"):
    print("we stock milk")
else:
    print("we don't stock milk")     # wrong: we do, there's just none left`, lang: 'python' },
      right: { code: py`stock = {"milk": 0}
if "milk" in stock:
    print("we stock milk")           # correct`, lang: 'python' },
      explanation: py`\`0\`, \`""\`, \`[]\` and \`None\` are all *falsy* (see [truthiness](lesson:none-and-truthiness)), so \`if d.get(k):\` can't tell "missing" from "present but zero". Use \`in\` to test for a key.`,
    },
    {
      title: 'Deleting keys while looping over the dict',
      wrong: { code: py`prices = {"tea": 2.5, "jam": 3.0, "eggs": 0}
for item in prices:
    if prices[item] == 0:
        del prices[item]     # RuntimeError: dictionary changed size during iteration`, lang: 'python', static: true },
      right: { code: py`prices = {"tea": 2.5, "jam": 3.0, "eggs": 0}
prices = {item: p for item, p in prices.items() if p != 0}
print(prices)                # {'tea': 2.5, 'jam': 3.0}`, lang: 'python' },
      explanation: py`A dict can't be resized while it's being iterated. Build a new dict (a comprehension is ideal), or loop over a snapshot of the keys: \`for item in list(prices):\`.`,
    },
    {
      title: 'Indexing keys() like a list',
      wrong: { code: py`stock = {"bread": 3, "milk": 6}
first = stock.keys()[0]      # TypeError: 'dict_keys' object is not subscriptable`, lang: 'python', static: true },
      right: { code: py`stock = {"bread": 3, "milk": 6}
first = next(iter(stock))    # 'bread' — the first key in insertion order
also = list(stock)[0]        # simpler, but builds a whole list`, lang: 'python' },
      explanation: py`Views aren't sequences. Ask the dict for an iterator and take the first item, or convert to a list when the dict is small.`,
    },
    {
      title: 'Using dot access instead of brackets',
      wrong: { code: py`user = {"name": "Ada"}
print(user.name)             # AttributeError: 'dict' object has no attribute 'name'`, lang: 'python', static: true },
      right: { code: py`user = {"name": "Ada"}
print(user["name"])          # Ada`, lang: 'python' },
      explanation: py`Dict keys are not attributes (unlike objects in JavaScript). If you want \`user.name\`, you want a class — a [dataclass](lesson:dataclasses) or named tuple.`,
    },
  ],
  debugging: [
    {
      symptom: py`KeyError: 'jam'`,
      cause: py`\`d["jam"]\` (or \`del d["jam"]\`, \`d.pop("jam")\`) for a key that isn't there — often a typo, different capitalisation, or an int key \`1\` vs a string key \`"1"\` from input or JSON.`,
      fix: py`Print \`list(d)\` to see the real keys and compare with \`repr(key)\`. Use \`get\`/\`pop(key, default)\` if missing is allowed.`,
    },
    {
      symptom: py`RuntimeError: dictionary changed size during iteration`,
      cause: py`Keys were added or deleted inside a loop over the same dict.`,
      fix: py`Iterate over \`list(d)\` / \`list(d.items())\`, or build a new dict with a comprehension.`,
    },
    {
      symptom: py`TypeError: cannot use 'list' as a dict key (unhashable type: 'list')`,
      cause: py`A mutable object (list, dict, set) was used as a key. Pre-3.14 wording: \`TypeError: unhashable type: 'list'\`.`,
      fix: py`Use an immutable equivalent: \`tuple(the_list)\` or \`frozenset(the_set)\` — or a string/number id.`,
    },
    {
      symptom: py`TypeError: 'dict_keys' object is not subscriptable`,
      cause: py`\`d.keys()[0]\`, \`d.values()[0]\` or \`d.items()[0]\` — views don't support indexing.`,
      fix: py`\`next(iter(d))\` for the first key, or \`list(d.values())[0]\`.`,
    },
    {
      symptom: py`AttributeError: 'dict' object has no attribute 'name'`,
      cause: py`\`user.name\` on a dict — keys are reached with brackets.`,
      fix: py`Write \`user["name"]\`, or model the record as a class if you want attribute access.`,
    },
  ],
  bestPractices: [
    'Use d[key] when the key must exist and d.get(key, default) when missing is normal.',
    'Test for a key with in, not with the truthiness of get().',
    'Loop with .items() when you need both keys and values.',
    'Never add or delete keys while iterating; loop over list(d) or build a new dict.',
    'Use immutable, simple keys: strings, ints, tuples.',
    'Use Counter and defaultdict for counting and grouping in real code.',
    'Prefer a dataclass or TypedDict for records with a fixed set of fields.',
  ],
  useCases: [
    'Lookup tables: country code → name, product id → price.',
    'Counting occurrences: words, HTTP status codes, votes.',
    'Grouping records: students by class, orders by customer.',
    'Configuration and settings, merged from defaults and user overrides.',
    'Caching expensive results: input → computed answer.',
    'Working with JSON from web APIs (objects become dicts).',
  ],
  whenToUse: {
    use: [
      'You find things by a name or id rather than by position.',
      'You need to count or group items by some key.',
      'You need a fast "do we have X?" check and also a value for X.',
    ],
    avoid: [
      'The data is a simple ordered sequence — use a list.',
      'You only need membership, no values — use a set.',
      'Records always have the same fields and you want tool support — use a dataclass.',
    ],
  },
  comparison: {
    title: 'Reading and writing: which call when?',
    headers: ['you want to…', 'write', 'if the key is missing'],
    rows: [
      ['read a value that must exist', 'd[key]', 'KeyError'],
      ['read with a fallback', 'd.get(key, default)', 'returns default (None if omitted)'],
      ['read, inserting a default first', 'd.setdefault(key, default)', 'inserts default, returns it'],
      ['set or replace a value', 'd[key] = value', 'adds the key'],
      ['remove and get the value', 'd.pop(key) / d.pop(key, default)', 'KeyError / returns default'],
      ['remove only', 'del d[key]', 'KeyError'],
      ['merge another dict', 'd | other (new), d |= other (in place)', 'adds missing keys; right side wins clashes'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'dictionaries-q1',
      type: 'mcq',
      prompt: 'Given `stock = {"bread": 3}`, what is the difference between `stock["jam"]` and `stock.get("jam")`?',
      options: [
        { text: 'No difference — both return None', why: 'Square brackets never return a default; a missing key raises KeyError.' },
        'stock["jam"] raises KeyError; stock.get("jam") returns None',
        { text: 'stock.get("jam") adds "jam" to the dict', why: 'get() never modifies the dict. setdefault() is the one that inserts.' },
        { text: 'stock["jam"] returns 0', why: 'There is no automatic default with []. (defaultdict changes that — see the collections module.)' },
      ],
      answer: 1,
      explanation: py`\`d[key]\` insists the key exists; \`d.get(key, default=None)\` returns the default instead of raising and leaves the dict unchanged.`,
    },
    {
      id: 'dictionaries-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`stock = {"tea": 2}
stock["tea"] += 3
stock["jam"] = 1
print(stock, len(stock))`,
      answer: "{'tea': 5, 'jam': 1} 2",
      explanation: py`\`+=\` reads 2, adds 3 and stores 5 under the same key. Assigning to a new key adds a second item at the end. \`len\` counts keys: 2.`,
    },
    {
      id: 'dictionaries-q3',
      type: 'output',
      prompt: 'Predict the output (Python 3.9+).',
      code: py`a = {"x": 1, "y": 2}
b = {"y": 20, "z": 30}
print(a | b)`,
      options: [
        { text: "{'x': 1, 'y': 2, 'z': 30}", why: 'On a clash the RIGHT-hand dict wins, so y becomes 20.' },
        "{'x': 1, 'y': 20, 'z': 30}",
        { text: "{'x': 1, 'y': 2, 'y': 20, 'z': 30}", why: 'Keys are unique — a dict can never hold "y" twice.' },
        { text: 'TypeError: unsupported operand type(s) for |', why: 'Dicts support | since Python 3.9; the playground runs 3.14.' },
      ],
      answer: 1,
      explanation: py`\`a | b\` copies \`a\`, then writes every item of \`b\` into the copy. "y" keeps its position from \`a\` but takes \`b\`'s value; "z" is added at the end.`,
    },
    {
      id: 'dictionaries-q4',
      type: 'bug',
      prompt: 'This should remove products with a price of 0, but it crashes with `RuntimeError: dictionary changed size during iteration`. Click the line that causes it.',
      code: py`prices = {"tea": 2.5, "jam": 3.0, "eggs": 0}
for item in prices:
    if prices[item] == 0:
        del prices[item]
print(prices)`,
      answerLine: [4, 2],
      explanation: py`Line 4 deletes a key from the dict that the loop on line 2 is iterating over. Build a new dict instead — \`{k: v for k, v in prices.items() if v != 0}\` — or loop over \`list(prices)\`.`,
    },
    {
      id: 'dictionaries-q5',
      type: 'fill',
      prompt: 'Complete the counting pattern so `counts` ends as `{\'a\': 2, \'b\': 1}`.',
      code: py`counts = {}
for letter in ["a", "b", "a"]:
    counts[letter] = counts.___(letter, ___) + 1`,
      answer: [['get'], ['0']],
      explanation: py`\`counts.get(letter, 0)\` is "the count so far, or 0 the first time". Adding 1 and storing it back counts each occurrence.`,
    },
    {
      id: 'dictionaries-q6',
      type: 'mcq',
      prompt: 'Which of these can **not** be used as a dictionary key?',
      options: [
        { text: '("Ada", 15)', why: 'A tuple of hashable values (a string and an int) is hashable — a fine key.' },
        { text: '"email"', why: 'Strings are the most common keys of all.' },
        { text: '42', why: 'Numbers are hashable and work as keys.' },
        '["Ada", 15]',
      ],
      answer: 3,
      explanation: py`Lists are mutable, so they are unhashable and can't be keys. Convert to a tuple if you need a composite key.`,
    },
    {
      id: 'dictionaries-q7',
      type: 'short',
      prompt: 'Is the order of keys in a dict guaranteed? Explain what "insertion order" means, including what happens when you update or delete-and-re-add a key.',
      answer: py`Yes — since Python 3.7 the language guarantees that dicts preserve insertion order (CPython 3.6 already did so as an implementation detail). Iterating, printing or calling keys()/values()/items() follows the order in which keys were first added. Updating the value of an existing key keeps its original position; deleting a key and inserting it again puts it at the end. Equality between two dicts ignores order.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'word-count',
      title: 'Count the words',
      difficulty: 'beginner',
      prompt: py`Write \`count_words(text)\` that returns a **dict** mapping each word to how many times it appears.

- Words are separated by whitespace (use \`text.split()\`).
- Counting is **case-insensitive**: store the lower-case word.
- Keys must appear in the order each word was **first seen**.
- An empty string gives \`{}\`.

\`\`\`python
count_words("The cat and the hat")
# {'the': 2, 'cat': 1, 'and': 1, 'hat': 1}
\`\`\``,
      files: {
        'main.py': py`def count_words(text):
    counts = {}
    # TODO: count each lower-cased word
    return counts


print(count_words("The cat and the hat"))
`,
      },
      hints: [
        'Loop over text.split(), and lower-case each word with .lower().',
        'For each word: counts[word] = counts.get(word, 0) + 1.',
        'for word in text.split():\n    word = word.lower()\n    counts[word] = counts.get(word, 0) + 1',
      ],
      solution: {
        explanation: py`\`text.split()\` splits on any run of whitespace and ignores leading/trailing spaces. Lower-casing each word before using it as a key makes "The" and "the" the same key. The \`get(word, 0) + 1\` pattern starts each new word at 1 and increments existing ones. Because dicts keep insertion order, keys appear in first-seen order automatically. In production you'd write \`Counter(text.lower().split())\` — see [the collections module](lesson:collections-module).`,
        files: {
          'main.py': py`def count_words(text):
    counts = {}
    for word in text.split():
        word = word.lower()
        counts[word] = counts.get(word, 0) + 1
    return counts


print(count_words("The cat and the hat"))
`,
        },
      },
      tests: [
        { name: 'counts a simple sentence', code: py`assert count_words("The cat and the hat") == {"the": 2, "cat": 1, "and": 1, "hat": 1}` },
        { name: 'is case-insensitive', code: py`assert count_words("Go go GO") == {"go": 3}` },
        { name: 'keys are in first-seen order', code: py`assert list(count_words("b a b c a")) == ["b", "a", "c"]` },
        { name: 'handles extra spaces', code: py`assert count_words("  tea   jam tea ") == {"tea": 2, "jam": 1}` },
        { name: 'empty text gives {}', code: py`assert count_words("") == {}` },
      ],
    },
    {
      id: 'group-by-house',
      title: 'Sort students into houses',
      difficulty: 'beginner',
      prompt: py`Students arrive as a list of \`(name, house)\` tuples. Write \`group_by_house(pairs)\` that returns a dict mapping each **house** to a **list of names**, keeping the order in which they appear.

\`\`\`python
group_by_house([("Ada", "Red"), ("Ben", "Blue"), ("Cy", "Red")])
# {'Red': ['Ada', 'Cy'], 'Blue': ['Ben']}
\`\`\`

An empty list gives \`{}\`.`,
      files: {
        'main.py': py`students = [("Ada", "Red"), ("Ben", "Blue"), ("Cy", "Red"), ("Dee", "Green"), ("Eve", "Blue")]


def group_by_house(pairs):
    houses = {}
    # TODO: add each name to the list for its house
    return houses


print(group_by_house(students))
`,
      },
      hints: [
        'Loop with for name, house in pairs: — each tuple unpacks into two names.',
        'If the house isn\'t a key yet, it needs a new empty list; then append the name. setdefault does both in one call.',
        'for name, house in pairs:\n    houses.setdefault(house, []).append(name)',
      ],
      solution: {
        explanation: py`\`houses.setdefault(house, [])\` returns the list already stored for that house — or, the first time, stores a **new** empty list and returns it. \`.append(name)\` then adds to that list in place, so the dict sees the change without another assignment. Houses appear in the order they're first met, and names keep their input order. The same pattern with \`collections.defaultdict(list)\` reads \`houses[house].append(name)\` (see [the collections module](lesson:collections-module)).`,
        files: {
          'main.py': py`students = [("Ada", "Red"), ("Ben", "Blue"), ("Cy", "Red"), ("Dee", "Green"), ("Eve", "Blue")]


def group_by_house(pairs):
    houses = {}
    for name, house in pairs:
        houses.setdefault(house, []).append(name)
    return houses


print(group_by_house(students))
`,
        },
      },
      tests: [
        { name: 'groups the starter students', code: py`assert group_by_house(students) == {"Red": ["Ada", "Cy"], "Blue": ["Ben", "Eve"], "Green": ["Dee"]}` },
        { name: 'houses appear in first-seen order', code: py`assert list(group_by_house(students)) == ["Red", "Blue", "Green"]` },
        { name: 'names keep their input order', code: py`assert group_by_house([("Zoe", "A"), ("Amy", "A")]) == {"A": ["Zoe", "Amy"]}` },
        { name: 'each house gets its own list', code: py`g = group_by_house([("a", "X"), ("b", "Y")])
assert g["X"] is not g["Y"]` },
        { name: 'empty input gives {}', code: py`assert group_by_house([]) == {}` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'dictionaries-get-vs-brackets',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'When do you use `d[key]` and when `d.get(key)`?',
      answer: 'd[key] when the key must exist — a KeyError immediately reveals a bug. d.get(key, default) when absence is a normal case and you have a sensible default. get never raises and never inserts.',
      explanation: py`Silent defaults can hide bugs: a misspelled key returns \`None\` that crashes far away. Explicit failure is easier to debug. When absence is expected (optional settings, counts starting at 0), \`get\` keeps the code short. Watch out: \`get\` can't distinguish "missing" from "stored None" — use \`in\` when that matters.`,
      whyAsked: 'It reveals whether you think about failure modes rather than just avoiding exceptions.',
      mistakes: ['Saying "always use get to avoid errors"', 'Not knowing get accepts a default', 'Confusing get with setdefault'],
      followUps: ['What does setdefault do differently?', 'How does defaultdict change this?', 'How would you distinguish a missing key from a key whose value is None?'],
      modelAnswer: 'I use square brackets when the key has to be there — a missing key means something is wrong, and a KeyError right at that line is the best possible error. I use get with an explicit default when absence is a normal situation, like an optional setting or a counter that starts at zero. get never raises and never modifies the dict; if I want to insert the default as well, that is setdefault, or a defaultdict. And if None could be a real stored value, I check membership with in rather than relying on get.',
    },
    {
      id: 'dictionaries-ordering',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Are Python dicts ordered? Since when, and is that a language guarantee? How does that relate to `OrderedDict`?',
      answer: 'Yes: dicts preserve insertion order as a language guarantee since Python 3.7 (CPython 3.6 did it as an implementation detail). OrderedDict still differs: its equality is order-sensitive and it has move_to_end and popitem(last=False).',
      explanation: py`The compact dict layout introduced in CPython 3.6 kept insertion order as a side effect; 3.7 made it part of the language spec. Plain dict equality ignores order. \`OrderedDict\` remains useful when order is part of the meaning (order-sensitive \`==\`) or for LRU-style reordering (see [the collections module](lesson:collections-module)).`,
      whyAsked: 'Many candidates hold outdated beliefs ("dicts are unordered"); the follow-up about OrderedDict tests depth.',
      mistakes: ['Saying dicts are unordered', 'Saying order is only a CPython detail', 'Claiming OrderedDict is now pointless'],
      followUps: ['What does {"a": 1, "b": 2} == {"b": 2, "a": 1} return?', 'What happens to order when you update a key\'s value?', 'Are sets ordered too? (No.)'],
      modelAnswer: 'Yes. Since Python 3.7 the language guarantees that dicts preserve insertion order; CPython 3.6 already did it because of its compact dict implementation, but then it was only an implementation detail. Updating an existing key keeps its position, and deleting and re-inserting moves it to the end. Equality between plain dicts ignores order. OrderedDict is still useful when order is part of the meaning — its equality is order-sensitive — and for move_to_end, which makes LRU caches easy. Sets, by contrast, are still unordered.',
    },
    {
      id: 'dictionaries-merge-alias',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What do the two prints show?',
      code: { lang: 'python', code: py`a = {"x": 1}
c = a
a |= {"y": 2}
print(c)

a = {"x": 1}
c = a
a = a | {"y": 2}
print(c)` },
      options: ["{'x': 1, 'y': 2} then {'x': 1}", "{'x': 1} then {'x': 1}", "{'x': 1, 'y': 2} then {'x': 1, 'y': 2}", "{'x': 1} then {'x': 1, 'y': 2}"],
      correctOption: 0,
      answer: "`{'x': 1, 'y': 2}` then `{'x': 1}`. |= updates the existing dict in place (c is an alias, so it sees the change); a | b builds a new dict and rebinds only a.",
      explanation: py`Exactly like \`+=\` versus \`+\` on lists: the augmented form mutates, the plain operator creates a new object. Aliases (\`c\`) observe mutations but not re-binding.`,
      whyAsked: 'Combines a modern feature (3.9 merge operators) with aliasing — a frequent source of shared-state bugs.',
      mistakes: ['Assuming |= creates a new dict', 'Forgetting that c and a are the same object at first'],
      followUps: ['Which is equivalent to a.update(b)?', 'How would you merge on Python 3.8?'],
      modelAnswer: 'The first print shows x and y, the second shows only x. In the first block, c and a are the same dict, and |= is an in-place update, just like update(), so c sees the new key. In the second block, a | {"y": 2} builds a brand-new dict and then only the name a is re-bound to it, so c still refers to the original. It is the same in-place-versus-new-object distinction as += and + on lists.',
    },
    {
      id: 'dictionaries-two-sum',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `two_sum(nums, target)` that returns a tuple of the indices `(i, j)` with `i < j` of two numbers adding up to `target`, or `None` if there are none. Aim for one pass (O(n)).',
      answer: 'Walk the list once, keeping a dict from value → index of what you have seen. For each number n at index j, if target - n is in the dict, return (seen[target - n], j); otherwise store n.',
      explanation: py`The brute-force version checks every pair (O(n²)). A dict turns "have I seen the complement?" into an O(1) average lookup, so the whole scan is O(n). Checking *before* storing the current number stops an element from pairing with itself.`,
      starter: { files: { 'main.py': py`def two_sum(nums, target):
    # TODO: return (i, j) with nums[i] + nums[j] == target, or None
    return None


print(two_sum([2, 7, 11, 15], 9))
` } },
      tests: [
        { name: 'finds the classic pair', code: py`assert two_sum([2, 7, 11, 15], 9) == (0, 1)` },
        { name: 'pair not at the start', code: py`assert two_sum([3, 2, 4], 6) == (1, 2)` },
        { name: 'duplicates can pair with each other', code: py`assert two_sum([3, 3], 6) == (0, 1)` },
        { name: 'an element does not pair with itself', code: py`assert two_sum([5, 1], 10) is None` },
        { name: 'returns None when there is no pair', code: py`assert two_sum([1, 2], 10) is None` },
      ],
      solution: { files: { 'main.py': py`def two_sum(nums, target):
    seen = {}                       # value -> index
    for j, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return seen[complement], j
        seen[n] = j
    return None


print(two_sum([2, 7, 11, 15], 9))
` } },
      hints: ['For each number, the partner you need is target - n.', 'Store numbers you have already passed in a dict: value → index. Check before you store.'],
      whyAsked: 'The canonical "use a hash map to trade memory for time" question.',
      mistakes: ['Nested loops (O(n²)) without discussing the trade-off', 'Storing before checking, so 5 pairs with itself for target 10', 'Returning values instead of indices'],
      followUps: ['What if the input is sorted? (two pointers, O(1) extra space)', 'How would you return all pairs?', 'What is the memory cost?'],
      modelAnswer: 'I walk the list once with enumerate, keeping a dict that maps each value I have already seen to its index. For the current number n, the partner I need is target minus n; if that is already in the dict, I return its index and the current index. Otherwise I store n. Checking before storing prevents an element pairing with itself, and duplicates still work because the earlier copy is already stored. That is O(n) time and O(n) extra memory, versus O(n squared) for checking every pair; if the input were sorted I would use two pointers instead.',
    },
    {
      id: 'dictionaries-changed-size',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A cache-cleanup function raises `RuntimeError: dictionary changed size during iteration`. Why, and what are the clean fixes?',
      code: { lang: 'python', code: py`def evict_expired(cache, now):
    for key, entry in cache.items():
        if entry["expires"] < now:
            del cache[key]` },
      answer: 'Deleting keys while iterating over the dict (or its view) is forbidden because it would invalidate the iterator. Iterate over a snapshot — for key, entry in list(cache.items()) — or collect expired keys first and delete afterwards; or rebuild with a comprehension if callers don\'t hold a reference.',
      explanation: py`Dict iterators detect a size change and raise rather than silently skipping or repeating keys. Options: snapshot (\`list(cache.items())\`), two-phase (\`expired = [k for k, e in cache.items() if e["expires"] < now]\` then \`for k in expired: del cache[k]\`), or replace (\`cache = {...}\`) — but replacing creates a new object, which other references to the old cache won't see; mutate in place if the dict is shared.`,
      whyAsked: 'It is a very common production error; interviewers want the mechanism and an awareness of in-place vs replacement.',
      mistakes: ['Wrapping it in try/except', 'Rebuilding the dict when other code holds a reference to it', 'Thinking changing values is also forbidden (it is fine)'],
      followUps: ['Is changing values during iteration allowed?', 'How would you do this in a multi-threaded program?'],
      modelAnswer: 'Dict iterators detect that the dict changed size and raise, because continuing could skip or repeat keys. The clean fixes are to iterate over a snapshot, list(cache.items()), or do it in two phases: collect the expired keys first and then delete them. Rebuilding with a comprehension also works, but it creates a new dict object, so if other code holds a reference to this cache I would mutate in place instead. Changing the values of existing keys during iteration is fine — it is only adding or removing keys that is a problem.',
    },
    {
      id: 'dictionaries-how-lookup-works',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'How does a dict lookup work, why must keys be hashable, and what is the complexity?',
      answer: 'Python hashes the key, maps the hash to a slot in a table, and probes until it finds an entry whose stored hash and key match (identity or ==). Average O(1), worst O(n) with many collisions. Keys must be hashable with a stable hash consistent with ==; otherwise the key would be looked for in the wrong slot.',
      explanation: py`The contract is \`a == b ⇒ hash(a) == hash(b)\`, and the hash must not change while the object is a key. Collisions are resolved by probing (open addressing in CPython). String hashes are randomised per process to resist hash-flooding attacks. CPython's compact layout stores entries densely in insertion order with a separate sparse index — which is why order preservation is cheap. Mutable built-ins (list, dict, set) are unhashable to protect that invariant.`,
      whyAsked: 'Understanding hash tables underpins performance reasoning, custom __hash__/__eq__ design and security (hash flooding).',
      mistakes: ['Saying dict lookup is always O(1)', 'Saying keys are compared only by hash', 'Not knowing why lists are unhashable'],
      followUps: ['What happens if two keys have the same hash but are not equal?', 'Why does defining __eq__ disable the default __hash__?', 'What is hash flooding?'],
      modelAnswer: 'A dict is a hash table. To look up a key, Python computes its hash, maps it to a slot, and checks the entry there; if the slot holds a different key — a collision — it keeps probing until it finds a matching hash and an equal key, or an empty slot. On average that is constant time; with pathological collisions it degrades to linear. Keys must be hashable, meaning their hash never changes and equal keys have equal hashes; a list could change after insertion, so its hash would point to the wrong slot, which is why it is unhashable. CPython also randomises string hashes per process to defend against hash-flooding attacks, and stores entries in a compact, insertion-ordered array.',
    },
    {
      id: 'dictionaries-layered-config',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You merge configuration with `config = defaults | file_settings | cli_args`. A user sets only `{"db": {"port": 5433}}` in the file, and suddenly the database host is missing. Why, and how do you fix it?',
      answer: 'The | merge is shallow: the whole nested "db" dict from the file replaces the default "db" dict instead of being merged into it. Use a recursive (deep) merge for nested sections, or flatten the keys; collections.ChainMap is an option for flat layered lookups.',
      explanation: py`\`|\`, \`update\` and \`{**a, **b}\` only merge the top level. For nested config, write a small recursive merge that descends into dicts present on both sides (and copies, so defaults aren't mutated). Validate the result (e.g. required keys present) so problems fail at startup, not on first use.`,
      code: { lang: 'python', code: py`def deep_merge(base, override):
    result = dict(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

defaults = {"db": {"host": "localhost", "port": 5432}, "debug": False}
print(deep_merge(defaults, {"db": {"port": 5433}}))
# {'db': {'host': 'localhost', 'port': 5433}, 'debug': False}` },
      whyAsked: 'Configuration layering is a common real-world task where shallow-vs-deep semantics cause outages.',
      mistakes: ['Not recognising the merge is shallow', 'Mutating the defaults dict while merging', 'Skipping validation of the final config'],
      followUps: ['How would ChainMap help for flat settings?', 'How would you validate the merged config?', 'What about lists — merge or replace?'],
      modelAnswer: 'The dict union operator only merges the top level. The file\'s "db" value is a dict, so it simply replaces the default "db" dict, and the host key disappears with it. For nested configuration I would use a small recursive merge that descends into keys whose values are dicts on both sides, building new dicts so the defaults are never mutated. I would also decide explicitly whether lists merge or replace, and validate the final config at startup so missing keys fail immediately. For flat settings, ChainMap gives layered lookups without copying.',
    },
  ],

  takeaways: [
    'A dict maps unique, hashable keys to values of any type; lookups go straight to the key\'s slot (O(1) on average).',
    'd[key] raises KeyError when missing; d.get(key, default) returns a default; setdefault also inserts it.',
    'Assigning to a key adds or replaces; pop and del remove; update and |= merge in place, | builds a new dict (3.9+), right side wins.',
    'Loop with .items() for key/value pairs; never add or delete keys while iterating.',
    'Insertion order is guaranteed since Python 3.7; equality ignores order.',
    'Counting: counts.get(k, 0) + 1. Grouping: groups.setdefault(k, []).append(v).',
    'Keys must be hashable (no lists or dicts); 1, 1.0 and True are the same key.',
  ],
}
