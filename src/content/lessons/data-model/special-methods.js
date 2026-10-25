// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CATALOGUE = py`class Book:
    """A book in a library catalogue, identified by its ISBN."""

    def __init__(self, isbn, title, author):
        self.isbn = isbn
        self.title = title
        self.author = author

    def __repr__(self):
        # For developers: unambiguous, looks like the code that builds it
        return f"Book({self.isbn!r}, {self.title!r}, {self.author!r})"

    def __str__(self):
        # For readers: short and friendly
        return f"{self.title} by {self.author}"

    def __eq__(self, other):
        if not isinstance(other, Book):
            return NotImplemented   # "I don't know how to compare with that"
        return self.isbn == other.isbn

    def __hash__(self):
        # Equal books must have equal hashes, so hash what __eq__ compares
        return hash(self.isbn)


class ReadingList:
    def __init__(self, owner):
        self.owner = owner
        self.books = []

    def add(self, book):
        if book not in self.books:      # \`in\` on a list calls __eq__
            self.books.append(book)

    def __repr__(self):
        return f"<ReadingList owner={self.owner!r} books={len(self.books)}>"


dune = Book("978-0441013593", "Dune", "Frank Herbert")
dune_copy = Book("978-0441013593", "Dune", "Frank Herbert")
hobbit = Book("978-0547928227", "The Hobbit", "J.R.R. Tolkien")

print(dune)                     # print() calls str(), which calls __str__
print(repr(dune))               # repr() calls __repr__
print([dune, hobbit])           # a list shows each item's __repr__
print(dune == dune_copy)        # == calls __eq__: same ISBN
print(dune is dune_copy)        # ...but still two separate objects
print(len({dune, dune_copy, hobbit}))   # the set keeps only one Dune

ada = ReadingList("Ada")
ada.add(dune)
ada.add(dune_copy)              # equal to dune, so it is skipped
print(ada)
`

export default {
  id: 'special-methods',
  title: 'Special methods: __repr__, __str__, __eq__ & __hash__',
  summary: 'Special ("dunder") methods are hooks Python calls for you — len(x) runs x.__len__(), x == y runs x.__eq__(y) — so your own classes can behave like built-in types.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['classes-and-objects', 'methods-and-attributes'],
  related: ['operator-overloading', 'container-protocols', 'attribute-access', 'dataclasses', 'object-model', 'none-and-truthiness', 'sets', 'dictionaries', 'polymorphism-and-duck-typing', 'records-and-slots', 'properties-and-encapsulation'],
  tags: ['special methods', 'dunder', 'magic methods', 'data model', '__repr__', '__str__', '__eq__', '__hash__', '__bool__', '__len__', 'NotImplemented', 'hashable', 'equality', 'truthiness', 'repr', 'value object'],
  apis: [
    { name: 'repr(obj) → obj.__repr__()', summary: 'The developer-facing text for an object: unambiguous, ideally looks like the code that would rebuild it. Used by the REPL, debuggers, logs and containers.' },
    { name: 'str(obj) → obj.__str__()', summary: 'The reader-facing text for an object. Used by print() and f-strings. Falls back to __repr__ when a class defines no __str__.' },
    { name: '__eq__(self, other)', summary: 'Called for x == y. Return True/False, or NotImplemented when you do not know how to compare with other\'s type.' },
    { name: 'hash(obj) → obj.__hash__()', summary: 'Returns an int used to place the object in dicts and sets. Objects that compare equal must have equal hashes.' },
    { name: 'bool(obj) → obj.__bool__()', summary: 'Decides truthiness for if/while/and/or. Falls back to __len__() != 0, and finally to True.' },
    { name: 'len(obj) → obj.__len__()', summary: 'Must return an int ≥ 0. Also used for truthiness when __bool__ is missing.' },
    { name: 'NotImplemented', summary: 'A special singleton a binary special method returns to say "not my job" so Python can try the other operand. Not the same as NotImplementedError.' },
  ],
  docs: [
    { label: 'Data model — special method names', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names' },
    { label: 'Data model — basic customization (__repr__, __str__, __eq__, __hash__, __bool__)', url: 'https://docs.python.org/3/reference/datamodel.html#basic-customization' },
    { label: 'Data model — special method lookup', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-lookup' },
    { label: 'Glossary — hashable', url: 'https://docs.python.org/3/glossary.html#term-hashable' },
    { label: 'Built-in functions — repr()', url: 'https://docs.python.org/3/library/functions.html#repr' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You have been using special methods since your first day of Python without seeing them. When you write \`len(playlist)\`, Python actually runs \`playlist.__len__()\`. When you write \`a == b\`, it runs \`a.__eq__(b)\`. When you \`print(score)\`, it asks the object for \`score.__str__()\`.`,
    py`A **special method** is a method whose name starts and ends with two underscores — \`__len__\`, \`__eq__\`, \`__repr__\`. People call them **dunder methods** ("**d**ouble **under**score") or, informally, *magic methods*. The important part: **you define them, but Python calls them** — in response to syntax (\`==\`, \`+\`, \`for\`, \`if\`) and built-in functions (\`len()\`, \`str()\`, \`hash()\`).`,
    py`The full list of these hooks and the rules for them is called Python's **data model**. It is why a class you write can feel exactly like a built-in type: printable, comparable, usable as a dict key, truthy or falsy. This lesson covers the four you will write most — \`__repr__\`, \`__str__\`, \`__eq__\`, \`__hash__\` — plus \`__bool__\` and \`__len__\` for truthiness. Arithmetic and \`<\` come next in [operator overloading](lesson:operator-overloading), \`[]\` and \`for\` in [container protocols](lesson:container-protocols), and the dot in \`obj.attr\` in [attribute access](lesson:attribute-access).`,
  ],
  why: [
    py`Without special methods your objects are second-class citizens. Print one and you get \`<__main__.Book object at 0x10a3f2b50>\` — useless in a log file at 3 a.m. Compare two books with the same ISBN and Python says they are different, because by default \`==\` only checks "is this the very same object?".`,
    py`Special methods let you plug your class into the language instead of inventing your own vocabulary. Nobody wants to remember \`book.is_same_as(other)\`, \`cart.item_count()\` and \`order.describe()\` — every Python programmer already knows \`==\`, \`len()\` and \`print()\`. This shared vocabulary is a big part of what people mean by **Pythonic** code.`,
    py`They also carry contracts. Dicts and sets rely on the rule "equal objects have equal hashes". Get it wrong and items silently go missing — one of the nastiest bugs you can write, because nothing crashes.`,
  ],
  eli15: [
    py`Imagine Python as a robot butler. You never tell your phone "please run your length-counting procedure". You just ask the butler: "how long is this playlist?" — \`len(playlist)\`. The butler knows a secret: every object that can be measured has a little button labelled \`__len__\`. The butler walks over and presses it.`,
    py`Writing a special method is like **installing that button** on your own objects. Install \`__len__\` and the butler can measure them. Install \`__eq__\` and the butler can tell whether two of them count as "the same". Install \`__repr__\` and the butler can describe them properly instead of saying "some object, somewhere in memory".`,
    py`One rule: you install the buttons, but you let the butler press them. You write \`len(x)\`, not \`x.__len__()\`.`,
  ],
  analogy: {
    title: 'Standard sockets on a wall',
    body: [
      py`A wall socket has a standard shape. Any lamp, phone charger or toaster with the matching plug works with it — the socket doesn't need to know what the device is. The house's wiring (Python) supplies power through those standard sockets, and devices (your classes) just have to fit the shape.`,
      py`Special methods are the standard plugs. Python's syntax and built-ins are the sockets. If your class has a \`__len__\` "plug", it fits the \`len()\` socket. If it has \`__eq__\`, it fits \`==\`. You don't rewire the house — you just give your device the right plug.`,
    ],
    mapping: [
      ['the wall socket', 'syntax or a built-in: len(), ==, print(), hash(), if'],
      ['the plug shape', 'a special method name such as __len__ or __eq__'],
      ['a device with the right plug', 'a class that defines that special method'],
      ['the house wiring choosing which socket to use', 'Python deciding which special method to call'],
      ['a plug that fits but is wired wrong', 'a special method that breaks its contract (e.g. __eq__ and __hash__ disagree)'],
      ['you never touch the wires directly', 'you call len(x), not x.__len__()'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch Python call your special methods',
    props: {
      code: py`class Book:
    def __init__(self, isbn, title):
        self.isbn = isbn
        self.title = title

    def __repr__(self):
        return f"Book({self.isbn!r}, {self.title!r})"

    def __str__(self):
        return self.title

    def __eq__(self, other):
        if not isinstance(other, Book):
            return NotImplemented
        return self.isbn == other.isbn

    def __hash__(self):
        return hash(self.isbn)


paperback = Book("978-0441013593", "Dune")
hardback = Book("978-0441013593", "Dune (hardback)")
print(paperback)
print([paperback])
print(paperback == hardback)
print(len({paperback, hardback}))
`,
      notes: {
        21: 'Creating an instance runs `__init__` — a special method you already know. Watch a new frame appear on the call stack.',
        23: '`print()` calls `str(paperback)`, which jumps into **your** `__str__`. You never called it yourself.',
        24: 'A list prints its items with `repr()`, so this time Python jumps into `__repr__`.',
        25: '`==` jumps into `__eq__` with `self = paperback` and `other = hardback`. Same ISBN, so `True`.',
        26: 'Building a set calls `__hash__` for each book. The hashes match, so Python then asks `__eq__` — equal, so the second book is dropped and the set has 1 item.',
      },
    },
    alt: 'A step-by-step trace. Two Book objects are created with the same ISBN. print(paperback) enters the __str__ frame and prints Dune. print([paperback]) enters __repr__ and prints the list with Book(...) text. paperback == hardback enters __eq__ and returns True. Building a set calls __hash__ twice, then __eq__ once, and the set length printed is 1.',
    caption: py`Step through with ▶ and watch the call stack: every \`print\`, \`==\` and set operation opens a frame for one of *your* methods. That's the data model at work — syntax on the outside, method calls on the inside.`,
  },
  syntax: [
    py`#### Defining special methods`,
    py`They are ordinary methods with special names, defined in the class body. Python looks them up **on the class** (more on that in *Under the hood*).`,
    { code: py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def __repr__(self):              # repr(t), REPL echo, inside containers, {t!r}
        return f"Temperature({self.celsius!r})"

    def __str__(self):               # str(t), print(t), f"{t}"
        return f"{self.celsius}°C"

    def __eq__(self, other):         # t == other  (and, inverted, t != other)
        if not isinstance(other, Temperature):
            return NotImplemented
        return self.celsius == other.celsius

    def __hash__(self):              # hash(t), dict keys, set members
        return hash(self.celsius)

    def __bool__(self):              # bool(t), if t:, while t:, t and x
        return self.celsius != 0`, lang: 'python', title: 'the core special methods' },
    py`#### Who calls what`,
    py`| you write | Python calls | if the method is missing |
|---|---|---|
| \`repr(x)\`, \`{x!r}\`, typing \`x\` in the REPL, \`print([x])\` | \`type(x).__repr__(x)\` | \`<__main__.X object at 0x…>\` |
| \`str(x)\`, \`print(x)\`, \`f"{x}"\` | \`type(x).__str__(x)\` | falls back to \`__repr__\` |
| \`x == y\` | \`x.__eq__(y)\`, then \`y.__eq__(x)\` | identity: \`x is y\` |
| \`x != y\` | \`x.__ne__(y)\` | the default inverts \`__eq__\` — rarely write it |
| \`hash(x)\`, \`{x}\`, \`d[x] = …\` | \`type(x).__hash__(x)\` | identity-based hash — **or none at all if you defined \`__eq__\`** |
| \`bool(x)\`, \`if x:\`, \`while x:\`, \`x or y\` | \`type(x).__bool__(x)\` | \`len(x) != 0\`, else always \`True\` |
| \`len(x)\` | \`type(x).__len__(x)\` | \`TypeError: object of type 'X' has no len()\` |`,
    py`#### The rules each one must follow`,
    py`- \`__repr__\` and \`__str__\` must **return** a \`str\` (not print it).
- \`__eq__\` returns \`True\`/\`False\` — or the special value **\`NotImplemented\`** when \`other\` is a type it doesn't understand. Never raise for a foreign type.
- \`__hash__\` returns an \`int\`, and **objects that compare equal must have equal hashes**.
- \`__bool__\` must return exactly \`True\` or \`False\`; \`__len__\` must return an \`int\` that is \`>= 0\`.`,
    { callout: 'warn', title: 'Defining __eq__ removes __hash__', text: py`If a class defines \`__eq__\` but not \`__hash__\`, Python sets \`__hash__ = None\` for it. Its instances become **unhashable**: they can't go in a set or be dict keys. This is deliberate — the default identity hash would break the "equal objects, equal hashes" rule. Define \`__hash__\` yourself only if the fields you compare never change.` },
    py`#### repr conventions`,
    py`Two styles are common, and both are fine:`,
    { code: py`class Book:
    def __init__(self, isbn, title):
        self.isbn = isbn
        self.title = title

    def __repr__(self):
        # Style 1: looks like a constructor call you could paste back in
        return f"Book({self.isbn!r}, {self.title!r})"


class Connection:
    def __init__(self, host):
        self.host = host

    def __repr__(self):
        # Style 2: angle brackets when the object can't be rebuilt from text
        return f"<Connection host={self.host!r}>"


print(Book("978-0441013593", "Dune"))     # Book('978-0441013593', 'Dune')
print(Connection("db.local"))             # <Connection host='db.local'>`, lang: 'python', title: '!r puts quotes around strings' },
    py`Notice \`{self.title!r}\`: the \`!r\` conversion calls \`repr()\` on the value, so strings get quotes and \`Book('42', 'Dune')\` can never be confused with \`Book(42, Dune)\`.`,
    { callout: 'tip', title: 'Dataclasses write these for you', text: py`\`@dataclass\` generates \`__init__\`, \`__repr__\` and \`__eq__\` from your field list, and \`@dataclass(frozen=True)\` adds a matching \`__hash__\`. Write them by hand when you need custom behaviour (compare by ISBN only, hide a secret from the repr). See [dataclasses](lesson:dataclasses).` },
  ],
  walkthrough: {
    title: 'Reading the library catalogue line by line',
    lang: 'python',
    code: CATALOGUE,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 7], text: py`A normal class. \`__init__\` is a special method too: \`Book(...)\` creates an object and Python calls \`__init__\` on it for you.` },
      { lines: [9, 11], text: py`\`__repr__\` returns the *developer* view. \`!r\` wraps each string in quotes, so the text looks like the code that would rebuild this book.` },
      { lines: [13, 15], text: py`\`__str__\` returns the *reader* view. \`print()\` uses this one.` },
      { lines: [17, 20], text: py`\`__eq__\` says two books are equal when their ISBNs match — the same edition of the same book, even if they are two separate objects. For anything that isn't a \`Book\` it returns \`NotImplemented\`, which tells Python "ask the other object, or fall back to identity".` },
      { lines: [22, 24], text: py`Because we defined \`__eq__\`, Python would have removed hashing. We put it back, hashing **exactly the field \`__eq__\` compares**, so equal books get equal hashes.` },
      { lines: [32, 34], text: py`\`book not in self.books\` walks the list and calls \`__eq__\` on each item, so an equal copy counts as "already there".` },
      { lines: [44, 46], text: py`\`print(dune)\` → \`__str__\`; \`repr(dune)\` → \`__repr__\`; printing a list uses each *item's* \`__repr__\` — which is why \`__repr__\` is the one you can't skip.` },
      { lines: [47, 49], text: py`\`==\` says equal (same ISBN) while \`is\` says different objects. The set calls \`__hash__\`, finds the two Dunes in the same spot, confirms with \`__eq__\` and keeps one: 2 items in total.` },
      { lines: [51, 54], text: py`The second \`add\` is skipped because it is equal to a book already in the list. \`print(ada)\` has no \`__str__\` to call, so it falls back to \`__repr__\`.` },
    ],
  },
  playground: {
    title: 'Library catalogue',
    objective: 'Run it, match each printed line to the special method that produced it, then add your own special methods to ReadingList.',
    files: { 'main.py': CATALOGUE },
    expected: py`Seven lines:

\`\`\`text
Dune by Frank Herbert
Book('978-0441013593', 'Dune', 'Frank Herbert')
[Book('978-0441013593', 'Dune', 'Frank Herbert'), Book('978-0547928227', 'The Hobbit', 'J.R.R. Tolkien')]
True
False
2
<ReadingList owner='Ada' books=1>
\`\`\`

Line 1 came from \`__str__\`, lines 2–3 from \`__repr__\`, line 4 from \`__eq__\`, line 6 from \`__hash__\` + \`__eq__\`, and the last line from \`ReadingList.__repr__\` (there is no \`__str__\`, so \`print\` fell back to it).`,
    experiments: [
      {
        id: 'reading-list-len',
        task: py`Give \`ReadingList\` a \`__len__\` method that returns how many books it holds. Then \`len(ada)\` works — and an **empty** reading list becomes falsy (\`if not reading_list:\`) without writing \`__bool__\`.`,
        hint: py`\`def __len__(self): return len(self.books)\` — inside, call the built-in \`len()\` on the list.`,
        tests: [
          { name: 'len() of a new reading list is 0', code: py`assert len(ReadingList("Ben")) == 0` },
          { name: "len(ada) is 1", code: py`assert len(ada) == 1` },
          { name: 'an empty reading list is falsy', code: py`assert not ReadingList("Ben"), 'With __len__ defined, an empty list should be falsy'` },
        ],
        explain: py`\`len()\` calls \`__len__\`. Truthiness asks \`__bool__\` first; when a class has none, Python uses \`__len__() != 0\`. So one method gave you both \`len(ada)\` and \`if ada:\` — exactly how lists, dicts and strings behave.`,
      },
      {
        id: 'reading-list-str',
        task: py`Add a \`__str__\` to \`ReadingList\` so that \`print(ada)\` shows \`Ada's list: Dune\`. With several books, separate titles with a comma and a space: \`Cy's list: Dune, The Hobbit\`. Keep the \`__repr__\` as it is.`,
        hint: py`\`", ".join(book.title for book in self.books)\` builds the titles part. Return \`f"{self.owner}'s list: {titles}"\`.`,
        tests: [
          { name: "str(ada) is \"Ada's list: Dune\"", code: py`assert str(ada) == "Ada's list: Dune"` },
          { name: 'titles are joined with ", "', code: py`r = ReadingList("Cy")
r.add(dune)
r.add(hobbit)
assert str(r) == "Cy's list: Dune, The Hobbit"` },
          { name: '__repr__ is unchanged', code: py`assert repr(ada) == "<ReadingList owner='Ada' books=1>"` },
        ],
        explain: py`\`print()\` now finds a \`__str__\` and uses it, while \`repr(ada)\` — what a debugger or a log line with \`%r\` shows — still gives the unambiguous developer view. Two audiences, two methods.`,
      },
      {
        id: 'no-repr',
        task: py`Comment out \`Book.__repr__\` (all three lines) and run again. Look at output lines 2 and 3. Then put it back.`,
        hint: py`Put \`#\` in front of the \`def __repr__\`, the comment and the \`return\` line.`,
        tests: [{ name: 'the default repr appears', code: py`assert 'object at 0x' in output, 'Comment out Book.__repr__ to see the default repr'` }],
        explain: py`Without \`__repr__\`, Python uses \`object.__repr__\`: the class name and a memory address. \`print(dune)\` still looks fine because \`__str__\` exists — but the list and \`repr()\` became useless. Lists, dicts, tracebacks, debuggers and logs all use \`repr\`, so it's the first special method to write for any class.`,
      },
      {
        id: 'no-hash',
        task: py`Now comment out \`Book.__hash__\` and run. Read the error carefully, then restore it. Why did removing a method make the set **crash** rather than just behave differently?`,
        hint: py`Look at line 49: building a set needs each element's hash.`,
        explain: py`You get \`TypeError: cannot use 'Book' as a set element (unhashable type: 'Book')\`. Because the class defines \`__eq__\`, Python set \`Book.__hash__ = None\` instead of inheriting the identity-based hash from \`object\`. That default would give two equal Dunes *different* hashes, breaking the dict/set contract — so Python refuses to hash them at all until you supply a consistent \`__hash__\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Syntax on the outside, special methods on the inside',
    props: {
      width: 760,
      height: 420,
      nodes: [
        { id: 'len', label: 'len(cart)', note: 'built-in function', x: 150, y: 50, tone: 'yellow' },
        { id: 'print', label: 'print(book)', note: 'or str(book), f"{book}"', x: 150, y: 130, tone: 'yellow' },
        { id: 'eq', label: 'a == b', note: 'comparison', x: 150, y: 210, tone: 'yellow' },
        { id: 'hash', label: '{book} / d[book]', note: 'set member, dict key', x: 150, y: 290, tone: 'yellow' },
        { id: 'if', label: 'if cart:', note: 'truth test', x: 150, y: 370, tone: 'yellow' },
        { id: 'dlen', label: '__len__(cart)', note: 'must return int >= 0', x: 590, y: 50, tone: 'blue' },
        { id: 'dstr', label: '__str__(book)', note: 'missing? use __repr__', x: 590, y: 130, tone: 'blue' },
        { id: 'deq', label: 'a.__eq__(b)', note: 'NotImplemented? try b.__eq__(a)', x: 590, y: 210, tone: 'blue' },
        { id: 'dhash', label: '__hash__(book)', note: 'then __eq__ on a match', x: 590, y: 290, tone: 'blue' },
        { id: 'dbool', label: '__bool__(cart)', note: 'missing? use __len__', x: 590, y: 370, tone: 'blue' },
      ],
      edges: [
        { from: 'len', to: 'dlen', label: 'type(cart).__len__' },
        { from: 'print', to: 'dstr', label: 'type(book).__str__' },
        { from: 'eq', to: 'deq', label: 'rich comparison' },
        { from: 'hash', to: 'dhash', label: 'type(book).__hash__' },
        { from: 'if', to: 'dbool', label: 'type(cart).__bool__' },
      ],
      steps: [
        { focus: ['len', 'print', 'eq', 'hash', 'if'], text: py`On the left: ordinary Python you write every day. None of these mention a special method — yet each one is translated into a method call on the object's **class**.` },
        { focus: ['len', 'dlen'], edges: ['len->dlen'], text: py`\`len(cart)\` becomes \`type(cart).__len__(cart)\`. Python checks the result really is an int \`>= 0\` before handing it back to you — one reason to call \`len()\`, not \`__len__\`.` },
        { focus: ['print', 'dstr'], edges: ['print->dstr'], text: py`\`print(book)\` calls \`str(book)\`, which calls \`__str__\`. If the class has no \`__str__\`, the one inherited from \`object\` simply calls \`__repr__\`.` },
        { focus: ['eq', 'deq'], edges: ['eq->deq'], text: py`\`a == b\` tries \`a.__eq__(b)\`. If that returns \`NotImplemented\`, Python tries \`b.__eq__(a)\`; if that also gives up, it falls back to identity (\`a is b\`).` },
        { focus: ['hash', 'dhash'], edges: ['hash->dhash'], text: py`Putting a book in a set or using it as a dict key calls \`__hash__\` to pick a slot. If another object already sits in a matching slot, Python calls \`__eq__\` to decide whether they are "the same key".` },
        { focus: ['if', 'dbool'], edges: ['if->dbool'], text: py`\`if cart:\` asks \`__bool__\`. No \`__bool__\`? Python uses \`__len__() != 0\`. Neither? Every object is truthy.` },
        { focus: ['dlen', 'dstr', 'deq', 'dhash', 'dbool'], text: py`That's the **data model**: a published list of hooks. Define the right method and your class plugs into syntax that was there all along.` },
      ],
    },
    alt: 'Diagram with five pieces of everyday syntax on the left (len(cart), print(book), a == b, putting a book in a set or dict, if cart:) and the special method each one calls on the right (__len__, __str__ with fallback to __repr__, __eq__ with reflected fallback, __hash__ followed by __eq__, __bool__ with fallback to __len__). Each step highlights one pair.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Python keeps a long published list of special-method names — the **data model**. Every piece of syntax that works on objects is defined in terms of that list. \`len(x)\` isn't magic built into lists; it's "call the \`__len__\` that \`x\`'s class provides". Lists, strings and dicts simply ship with those methods already written (in C, inside CPython).`,
      py`That is also why the default behaviour exists: every class inherits from \`object\`, and \`object\` provides basic versions of \`__repr__\`, \`__str__\`, \`__eq__\`, \`__hash__\` and friends. You override the ones you need.`,
      { code: py`class Plain:
    pass

p = Plain()
print("__repr__" in dir(p))      # True: inherited from object
print(p == p, p == Plain())      # True False: default equality is identity
print(bool(p))                   # True: no __bool__ or __len__, so truthy`, lang: 'python', title: 'every object starts with defaults' },
    ],
    technical: [
      py`**Special methods are looked up on the type, not the instance.** The language reference guarantees implicit calls only work when the method is defined on the class. So \`len(x)\` behaves like \`type(x).__len__(x)\`: it skips the instance's \`__dict__\` and even skips \`__getattribute__\`. Sticking a method on one object does nothing for syntax:`,
      { code: py`class Basket:
    pass

b = Basket()
b.__len__ = lambda: 3        # stored on the instance only
print(b.__len__())           # 3 — a normal attribute lookup finds it
# len(b)  -> TypeError: object of type 'Basket' has no len()

Basket.__len__ = lambda self: 3   # on the class: now syntax sees it
print(len(b))                     # 3`, lang: 'python', title: 'implicit lookup goes to the class' },
      py`**How \`==\` really works.** For \`a == b\` Python: (1) if \`type(b)\` is a proper subclass of \`type(a)\`, tries the reflected \`b.__eq__(a)\` first, so subclasses get the first say; (2) otherwise tries \`a.__eq__(b)\`; (3) if the answer is \`NotImplemented\`, tries the reflected \`b.__eq__(a)\`; (4) if both give up, falls back to identity — \`a is b\`. That's why returning \`NotImplemented\` matters: it keeps the door open for the other object. \`!=\` uses \`__ne__\`, whose default calls \`__eq__\` and inverts the result.`,
      py`**Containers shortcut with identity.** \`x in some_list\` and \`list.index\`/\`count\` check \`item is x or item == x\`. That's why \`nan in [nan]\` is \`True\` even though \`nan == nan\` is \`False\`.`,
      py`**Dicts and sets use \`__hash__\` then \`__eq__\`.** The hash picks a slot; an object already in that slot is compared by identity first and then with \`__eq__\`. So the contract is one-directional: *equal ⇒ equal hashes*. Unequal objects *may* share a hash (a "collision" — handled correctly, just slower). Interactive version: [dictionaries](lesson:dictionaries) and [sets](lesson:sets).`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores pointers to common special methods in C-level **slots** on each type object (\`tp_repr\`, \`tp_hash\`, \`tp_richcompare\`, \`nb_bool\`, \`sq_length\`/\`mp_length\`, …). When your class defines \`__len__\`, CPython fills the slot with a small wrapper that calls your Python function, and \`len()\` goes straight to the slot. Assigning a dunder on the class later updates the slot; assigning on an instance can't. Other implementations (PyPy, GraalPy) achieve the same behaviour differently.` },
      { callout: 'note', title: 'CPython detail: hash values', text: py`The default \`object.__hash__\` is derived from \`id()\`. \`hash(-1)\` is \`-2\` because \`-1\` is reserved as an error signal in CPython's C code. And the hashes of \`str\` and \`bytes\` are salted with a random value per process (see \`PYTHONHASHSEED\`) to defend against attacks that flood a dict with colliding keys — so **never store \`hash()\` values** in files or databases; use \`hashlib\` for stable digests.` },
      { callout: 'version', title: 'Python 3.14: NotImplemented is not a boolean', text: py`Treating \`NotImplemented\` as true/false (for example \`if a.__eq__(b):\`) raised a \`DeprecationWarning\` from 3.9 and is a \`TypeError\` in 3.14: \`NotImplemented should not be used in a boolean context\`. Use \`a == b\`, which handles \`NotImplemented\` for you.` },
    ],
    production: [
      py`**Give every class a useful \`__repr__\`.** Logs, tracebacks, debuggers, test failure messages and the REPL all show \`repr\`. A good repr turns "something went wrong with an object" into "something went wrong with \`Order(id=4512, status='pending')\`". Keep it cheap and make sure it can never raise — a crashing \`__repr__\` hides the original error you were trying to log.`,
      py`**Keep secrets out of reprs.** Passwords, API tokens and personal data in a \`__repr__\` end up in logs and error trackers. Hide them (\`<User id=7 email=***>\`), or with dataclasses use \`field(repr=False)\`.`,
      py`**Value objects vs entities.** A *value object* (money amount, ISBN, coordinate) is defined by its data: give it \`__eq__\` + \`__hash__\` and make it immutable — \`@dataclass(frozen=True)\` or a \`NamedTuple\` ([records & slots](lesson:records-and-slots)). An *entity* (a user account, a database row being edited) changes over time: keep the default identity equality, or compare by a stable primary key and never by mutable fields.`,
      py`**Equality should be symmetric and transitive.** If \`a == b\` then \`b == a\`; return \`NotImplemented\` (not \`False\`) for unknown types so the other side gets a say. Avoid making instances equal to plain strings or ints — \`Book(...) == "978-…"\` seems handy, but then hashing must match \`hash("978-…")\` too, and \`{book, "978-…"}\` behaves strangely.`,
      py`**Self-referencing containers.** If a \`__repr__\` might print an object that contains itself, \`reprlib.recursive_repr()\` prevents infinite recursion by printing \`...\` for the repeat — the same trick \`list\` uses for \`a = []; a.append(a)\`.`,
    ],
  },
  mistakes: [
    {
      title: 'Defining __eq__ and expecting sets and dict keys to keep working',
      wrong: { code: py`class Ingredient:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        if not isinstance(other, Ingredient):
            return NotImplemented
        return self.name == other.name


pantry = {Ingredient("flour")}   # TypeError: ... (unhashable type: 'Ingredient')`, lang: 'python' },
      right: { code: py`class Ingredient:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        if not isinstance(other, Ingredient):
            return NotImplemented
        return self.name == other.name

    def __hash__(self):
        return hash(self.name)      # same field __eq__ compares


pantry = {Ingredient("flour")}`, lang: 'python' },
      explanation: py`Defining \`__eq__\` sets \`__hash__\` to \`None\`. If the compared fields never change, add a \`__hash__\` that hashes **exactly** those fields (a tuple of them for several: \`hash((self.a, self.b))\`). If they can change, leave the class unhashable on purpose.`,
    },
    {
      title: 'Hashing fields that can change',
      wrong: { code: py`class Tag:
    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        return isinstance(other, Tag) and self.name == other.name

    def __hash__(self):
        return hash(self.name)


t = Tag("python")
tags = {t}
t.name = "Python"     # mutated while inside the set
print(t in tags)      # False — the set can't find its own member`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass


@dataclass(frozen=True)       # fields can't be reassigned, so the hash is stable
class Tag:
    name: str


tags = {Tag("python")}
print(Tag("python") in tags)  # True`, lang: 'python' },
      explanation: py`A set filed \`t\` under the hash of \`"python"\`. After the mutation, \`t\` hashes to a different slot, so lookups search the wrong place. Nothing crashes — the item is just silently lost. Hashable objects should be immutable, at least in every field that \`__eq__\`/\`__hash__\` use.`,
    },
    {
      title: 'Printing inside __str__ or __repr__ instead of returning',
      wrong: { code: py`class Order:
    def __init__(self, order_id):
        self.order_id = order_id

    def __str__(self):
        print(f"Order #{self.order_id}")   # returns None!`, lang: 'python' },
      right: { code: py`class Order:
    def __init__(self, order_id):
        self.order_id = order_id

    def __str__(self):
        return f"Order #{self.order_id}"`, lang: 'python' },
      explanation: py`\`str()\` needs a string back. The wrong version prints something and then crashes with \`TypeError: __str__ returned non-string (type NoneType)\`.`,
    },
    {
      title: 'Crashing (or returning False) when the other object is a different type',
      wrong: { code: py`class Book:
    def __init__(self, isbn):
        self.isbn = isbn

    def __eq__(self, other):
        return self.isbn == other.isbn   # book == None -> AttributeError`, lang: 'python' },
      right: { code: py`class Book:
    def __init__(self, isbn):
        self.isbn = isbn

    def __eq__(self, other):
        if not isinstance(other, Book):
            return NotImplemented          # let Python try other.__eq__, then identity
        return self.isbn == other.isbn`, lang: 'python' },
      explanation: py`Code like \`if book == None\` or \`book in mixed_list\` compares your object with all sorts of things. \`NotImplemented\` (a special value, *not* the exception \`NotImplementedError\`) tells Python to ask the other object and finally fall back to identity, which gives a clean \`False\`. Returning \`False\` directly also avoids the crash but shuts the other type out of the decision.`,
    },
    {
      title: 'Calling special methods directly',
      wrong: { code: py`if book.__eq__(other):        # may be NotImplemented: TypeError in 3.14
    print("same")
size = playlist.__len__()      # skips len()'s checks`, lang: 'python', static: true },
      right: { code: py`if book == other:
    print("same")
size = len(playlist)`, lang: 'python', static: true },
      explanation: py`The built-ins and operators do more than the raw method: \`==\` handles \`NotImplemented\` and the reflected call, \`len()\` validates the result, \`hash()\` normalises it. Call dunders directly only in narrow cases — \`super().__init__(...)\`, or \`super().__eq__(other)\` inside your own implementation.`,
    },
    {
      title: 'A __repr__ that calls str(self) when there is no __str__',
      wrong: { code: py`class Sensor:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Sensor<{self}>"     # f"{self}" -> str(self) -> __repr__ -> ...`, lang: 'python' },
      right: { code: py`class Sensor:
    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return f"Sensor({self.name!r})"`, lang: 'python' },
      explanation: py`With no \`__str__\`, \`str(self)\` falls back to \`__repr__\`, which calls \`str(self)\` again — \`RecursionError: maximum recursion depth exceeded\`. Build reprs from the object's *fields*, never from \`self\` itself.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: cannot use 'Book' as a set element (unhashable type: 'Book')`,
      cause: py`The class defines \`__eq__\` without \`__hash__\`, so Python set \`__hash__\` to \`None\`. (Older Python versions print just \`unhashable type: 'Book'\`; dict keys say \`as a dict key\`.)`,
      fix: py`If the compared fields are immutable, add \`def __hash__(self): return hash((self.field1, self.field2))\`. If they can change, don't put these objects in sets/dict keys — key by an immutable id instead.`,
    },
    {
      symptom: py`TypeError: __str__ returned non-string (type NoneType)`,
      cause: py`\`__str__\` (or \`__repr__\`) printed instead of returning, or has a code path with no \`return\`.`,
      fix: py`\`return\` an f-string on every path. Don't call \`print()\` inside these methods.`,
    },
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute 'isbn' (raised inside __eq__)`,
      cause: py`\`__eq__\` assumes \`other\` is the same class and reaches for its attributes. Comparing with \`None\` or a string blows up.`,
      fix: py`Start with \`if not isinstance(other, Book): return NotImplemented\`.`,
    },
    {
      symptom: py`An object is in a set (you added it), but \`obj in the_set\` is False.`,
      cause: py`A field used by \`__hash__\` changed after the object was added, so it now hashes to a different slot. Or \`__hash__\` uses different fields than \`__eq__\`.`,
      fix: py`Hash exactly the fields \`__eq__\` compares, and make those fields immutable (\`frozen=True\` dataclass, read-only properties).`,
    },
    {
      symptom: py`TypeError: __bool__ should return bool, returned int`,
      cause: py`\`__bool__\` returned something like \`len(self.items)\` instead of a real boolean.`,
      fix: py`Return \`len(self.items) > 0\` — or delete \`__bool__\` and define \`__len__\`; Python derives truthiness from it.`,
    },
    {
      symptom: py`TypeError: NotImplemented should not be used in a boolean context`,
      cause: py`Code calls \`a.__eq__(b)\` directly and uses the result in \`if\`. When \`__eq__\` returns \`NotImplemented\`, 3.14 refuses to treat it as true/false.`,
      fix: py`Use the operator: \`if a == b:\`. Operators handle \`NotImplemented\` and try the reflected method.`,
    },
  ],
  bestPractices: [
    'Write __repr__ for every class you create; aim for Name(field=value, ...) or <Name key=value> and use !r for the fields.',
    'Add __str__ only when end users need a different, friendlier text than the repr.',
    'In __eq__, return NotImplemented for types you do not handle — never raise and never assume other has your attributes.',
    'Hash exactly the fields __eq__ compares, usually hash((self.a, self.b)), and only if those fields never change.',
    'Prefer @dataclass / @dataclass(frozen=True) when the generated __repr__, __eq__ and __hash__ are what you want.',
    'Let truthiness come from __len__ for container-like classes; write __bool__ only for non-containers.',
    'Use the built-ins and operators (len(x), x == y, repr(x)) — not x.__len__() — in normal code.',
    'Never include passwords, tokens or personal data in __repr__ output.',
  ],
  useCases: [
    'Readable log lines and test failures: Order(id=4512, status=\'pending\') instead of <Order object at 0x…>.',
    'Value objects that compare by content: ISBNs, money amounts, coordinates, version numbers.',
    'De-duplicating domain objects with a set, or using them as dict keys (seat → booking).',
    'Container-like classes (cart, playlist, inbox) that work with len() and if cart:.',
  ],
  whenToUse: {
    use: [
      '__repr__: always — it is the cheapest debugging win in Python.',
      '__eq__ when two separate objects can represent "the same thing" (same ISBN, same coordinates).',
      '__hash__ alongside __eq__ when the object is immutable and you want it in sets or as a dict key.',
      '__bool__ / __len__ when "empty" or "nothing" is a meaningful state for the object.',
    ],
    avoid: [
      'A custom __eq__ for objects whose identity is what matters (open connections, workers, mutable entities being edited).',
      '__hash__ on mutable objects whose compared fields can change.',
      '__bool__ with a surprising meaning (an Order that is falsy when unpaid) — use an explicit method like is_paid().',
      'Making your objects equal to built-in types (Book == "978-…") — it breaks symmetry with hashing.',
    ],
  },
  comparison: {
    title: '__repr__ vs __str__',
    headers: ['', '__repr__', '__str__'],
    rows: [
      ['audience', 'developers: logs, debuggers, REPL, tracebacks', 'end users: UI text, reports, print()'],
      ['called by', 'repr(x), {x!r}, REPL echo, printing a container of x', 'str(x), print(x), f"{x}", format(x)'],
      ['goal', 'unambiguous; ideally looks like code that rebuilds the object', 'readable and friendly'],
      ['if missing', 'object default: <module.Class object at 0x…>', 'falls back to __repr__'],
      ['example for a Book', "Book('978-0441013593', 'Dune')", 'Dune by Frank Herbert'],
    ],
    note: py`If you only have time for one, write \`__repr__\` — \`__str__\` falls back to it, but not the other way round.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'special-methods-q1',
      type: 'mcq',
      prompt: py`\`cart\` is an instance of your class \`Cart\`. What does \`len(cart)\` do?`,
      options: [
        { text: 'Counts the attributes stored on cart', why: 'len() knows nothing about attributes — it only asks the object for its length via a special method.' },
        'Calls Cart.__len__(cart) — the __len__ defined on the object\'s class — and checks it returned an int ≥ 0',
        { text: 'Calls cart.len()', why: 'There is no method called len. The hook has the special name __len__.' },
        { text: 'Looks for __len__ in cart.__dict__ first, then in the class', why: 'Implicit special-method lookup skips the instance and goes straight to the type. A __len__ stored on the instance is ignored by len().' },
      ],
      answer: 1,
      explanation: py`Built-ins and operators look special methods up on the **type**. \`len()\` also validates the result, raising \`TypeError\` for a non-int and \`ValueError\` for a negative number.`,
    },
    {
      id: 'special-methods-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Temp:
    def __init__(self, c):
        self.c = c

    def __str__(self):
        return f"{self.c}°C"

    def __repr__(self):
        return f"Temp({self.c})"


readings = [Temp(21), Temp(19)]
print(readings[0])
print(readings)
print(f"{readings[1]!r}")`,
      options: [
        { text: '21°C\n[21°C, 19°C]\n19°C', why: 'A list always shows its items with repr(), not str() — so the second line uses __repr__. And !r forces repr() too.' },
        '21°C\n[Temp(21), Temp(19)]\nTemp(19)',
        { text: 'Temp(21)\n[Temp(21), Temp(19)]\nTemp(19)', why: 'print(obj) uses str(), and Temp defines __str__, so the first line is 21°C.' },
        { text: '21°C\n[Temp(21), Temp(19)]\n19°C', why: 'The !r conversion in an f-string calls repr(), so the last line is Temp(19).' },
      ],
      answer: 1,
      explanation: py`\`print(x)\` uses \`__str__\`. Printing a list calls \`str()\` on the *list*, and the list builds its text from each item's \`repr()\`. \`{x!r}\` explicitly asks for \`repr()\`.`,
    },
    {
      id: 'special-methods-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`class Box:
    def __init__(self, n):
        self.n = n

    def __eq__(self, other):
        return self.n == other.n


a, b = Box(1), Box(1)
print(a == b, a is b, a != b)`,
      answer: 'True False False',
      accept: ['True False False'],
      explanation: py`\`a == b\` calls \`__eq__\` → \`True\`. \`is\` checks identity: two separate objects → \`False\`. Python 3's default \`__ne__\` calls \`__eq__\` and inverts it, so \`a != b\` is \`False\` without you writing \`__ne__\`.`,
    },
    {
      id: 'special-methods-q4',
      type: 'bug',
      prompt: 'A shop de-duplicates products with a set, but after a price change the set holds two "TEA-01" products. Click the line with the bug.',
      code: py`class Product:
    def __init__(self, sku, price):
        self.sku = sku
        self.price = price

    def __eq__(self, other):
        if not isinstance(other, Product):
            return NotImplemented
        return self.sku == other.sku

    def __hash__(self):
        return hash((self.sku, self.price))


old = Product("TEA-01", 3.50)
new = Product("TEA-01", 3.75)
print(old == new, len({old, new}))   # True 2 ?!`,
      answerLine: 12,
      explanation: py`\`__eq__\` says products with the same SKU are equal, but \`__hash__\` also mixes in the price. Equal objects then get different hashes, which breaks the contract: the set puts them in different slots and never even calls \`__eq__\`. Hash exactly what \`__eq__\` compares: \`return hash(self.sku)\`.`,
    },
    {
      id: 'special-methods-q5',
      type: 'fill',
      prompt: 'Complete the class so that `len(cart)` works **and** an empty cart is falsy, using a single special method.',
      code: py`class Cart:
    def __init__(self):
        self.items = []

    def ___(self):
        return ___(self.items)


cart = Cart()
if not cart:
    print("Your cart is empty")`,
      answer: [['__len__'], ['len']],
      explanation: py`\`__len__\` powers \`len(cart)\`, and when there's no \`__bool__\`, truthiness uses \`__len__() != 0\`. (Writing \`__bool__\` here instead would fail: it must return a real \`bool\`, not the int from \`len()\`.)`,
    },
    {
      id: 'special-methods-q6',
      type: 'mcq',
      prompt: 'A class defines `__eq__` but not `__hash__`. What happens when you try `{obj}`?',
      options: [
        { text: 'It works, using the identity hash inherited from object', why: 'That inherited hash would give equal objects different hashes, so Python deliberately removes it when you define __eq__.' },
        { text: 'It works, and Python auto-generates a hash from the attributes', why: 'Plain classes never auto-generate __hash__. Only dataclass(frozen=True) or similar tools do that.' },
        'TypeError: the class\'s __hash__ was set to None, so instances are unhashable',
        { text: 'It works, but every object goes into the same bucket', why: 'No — Python refuses to hash it at all.' },
      ],
      answer: 2,
      explanation: py`\`class X: def __eq__(...)\` implicitly sets \`X.__hash__ = None\`. Any attempt to hash an instance raises \`TypeError\` (in 3.14: \`cannot use 'X' as a set element (unhashable type: 'X')\`).`,
    },
    {
      id: 'special-methods-q7',
      type: 'short',
      prompt: 'Explain why an object whose `__eq__` depends on fields that can change should not define `__hash__`.',
      answer: py`A dict or set files each key under its hash when it is inserted. If a field used by \`__hash__\` changes afterwards, the object now hashes to a different slot, so lookups search the wrong place and the object is effectively lost — no error, just wrong answers. Only objects whose compared fields never change (immutable value objects) should be hashable.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'sensor-reading-text',
      title: 'Two faces of a sensor reading',
      difficulty: 'intermediate',
      prompt: py`A smart-home app logs temperature readings. Give the \`Reading\` class two text forms:

- \`repr(Reading("kitchen", 21.5))\` must return exactly \`Reading('kitchen', 21.5)\` — note the quotes around the room (use \`!r\`).
- \`str(Reading("kitchen", 21.5))\` must return exactly \`kitchen: 21.5°C\`.

The program at the bottom must then print exactly:

\`\`\`text
kitchen: 21.5°C
[Reading('kitchen', 21.5)]
\`\`\``,
      files: {
        'main.py': py`class Reading:
    def __init__(self, room, celsius):
        self.room = room
        self.celsius = celsius

    # TODO: add __repr__ (for developers) and __str__ (for people)


kitchen = Reading("kitchen", 21.5)
print(kitchen)
print([kitchen])
`,
      },
      hints: [
        'print(x) uses __str__; a list prints its items using __repr__.',
        'Both methods take only self and must return a string. Inside an f-string, {value!r} inserts repr(value).',
        'return f"Reading({self.room!r}, {self.celsius!r})"   and   return f"{self.room}: {self.celsius}°C"',
      ],
      solution: {
        explanation: py`\`__repr__\` uses \`!r\` on each field, so the room appears as \`'kitchen'\` with quotes — the output is unambiguous and even looks like the call that builds the object. \`__str__\` is the friendly version a user would see. \`print(kitchen)\` picks \`__str__\`; \`print([kitchen])\` prints a list, and lists always display their items with \`repr\`.`,
        files: {
          'main.py': py`class Reading:
    def __init__(self, room, celsius):
        self.room = room
        self.celsius = celsius

    def __repr__(self):
        return f"Reading({self.room!r}, {self.celsius!r})"

    def __str__(self):
        return f"{self.room}: {self.celsius}°C"


kitchen = Reading("kitchen", 21.5)
print(kitchen)
print([kitchen])
`,
        },
      },
      tests: [
        { name: "repr is Reading('kitchen', 21.5)", code: py`assert repr(Reading("kitchen", 21.5)) == "Reading('kitchen', 21.5)"` },
        { name: 'repr quotes any room name', code: py`assert repr(Reading("hall", 19)) == "Reading('hall', 19)"` },
        { name: 'str is "kitchen: 21.5°C"', code: py`assert str(Reading("kitchen", 21.5)) == "kitchen: 21.5°C"` },
        { name: 'prints both lines exactly', code: py`assert output.splitlines() == ["kitchen: 21.5°C", "[Reading('kitchen', 21.5)]"]` },
      ],
    },
    {
      id: 'cinema-seat',
      title: 'Hashable cinema seats',
      difficulty: 'advanced',
      prompt: py`A cinema stores booked seats in a **set**. Finish the \`Seat\` class so that:

1. \`Seat("A", 3) == Seat("A", 3)\` is \`True\`; a different row or number is not equal.
2. Comparing with anything that isn't a \`Seat\` doesn't crash: \`__eq__\` returns \`NotImplemented\`, so \`Seat("A", 3) == ("A", 3)\` is \`False\`.
3. Seats are hashable and consistent with \`__eq__\`: \`len({Seat("A", 3), Seat("A", 3), Seat("B", 1)}) == 2\`.
4. \`repr(Seat("A", 3))\` is exactly \`Seat('A', 3)\`.
5. Seats are read-only: \`seat.row = "B"\` (or \`seat.number = 9\`) raises \`AttributeError\`. Keep \`seat.row\` and \`seat.number\` readable.

The program at the bottom should keep printing \`True\`.`,
      files: {
        'main.py': py`class Seat:
    def __init__(self, row, number):
        self.row = row
        self.number = number

    def __eq__(self, other):
        return self.row == other.row and self.number == other.number


booked = [Seat("A", 3), Seat("A", 4)]
print(Seat("A", 3) in booked)
`,
      },
      hints: [
        'Start with __eq__: check isinstance(other, Seat) first and return NotImplemented otherwise. Then add __hash__ and __repr__.',
        'Hash a tuple of the same fields __eq__ compares: hash((self.row, self.number)). For read-only fields, store them as self._row / self._number and expose them with @property (no setter).',
        'Write @property above def row(self): return self._row (same for number). With no setter, assigning seat.row raises AttributeError.',
      ],
      solution: {
        explanation: py`\`__eq__\` compares the \`(row, number)\` tuples and politely returns \`NotImplemented\` for other types, so Python falls back to identity and \`Seat("A", 3) == ("A", 3)\` is simply \`False\`. \`__hash__\` hashes **the same tuple**, so equal seats always land in the same slot of a set. Because a hash must never change while the seat sits inside a set, the fields are made read-only with properties that have no setter ([properties](lesson:properties-and-encapsulation)). In real code, \`@dataclass(frozen=True)\` would generate all of this in two lines.`,
        files: {
          'main.py': py`class Seat:
    """A cinema seat. Immutable, so it is safe to hash."""

    def __init__(self, row, number):
        self._row = row
        self._number = number

    @property
    def row(self):
        return self._row

    @property
    def number(self):
        return self._number

    def __repr__(self):
        return f"Seat({self.row!r}, {self.number!r})"

    def __eq__(self, other):
        if not isinstance(other, Seat):
            return NotImplemented
        return (self.row, self.number) == (other.row, other.number)

    def __hash__(self):
        return hash((self.row, self.number))


booked = {Seat("A", 3), Seat("A", 4)}
print(Seat("A", 3) in booked)
`,
        },
      },
      tests: [
        { name: 'equal seats compare equal', code: py`assert Seat("A", 3) == Seat("A", 3)
assert Seat("A", 3) != Seat("A", 4) and Seat("A", 3) != Seat("B", 3)` },
        { name: '__eq__ returns NotImplemented for other types', code: py`assert Seat("A", 3).__eq__(("A", 3)) is NotImplemented
assert (Seat("A", 3) == ("A", 3)) is False` },
        { name: 'a set de-duplicates equal seats', code: py`assert len({Seat("A", 3), Seat("A", 3), Seat("B", 1)}) == 2` },
        { name: 'seats can be found in a set and used as dict keys', code: py`assert Seat("A", 3) in {Seat("A", 3)}
assert {Seat("C", 7): "Ada"}[Seat("C", 7)] == "Ada"` },
        { name: "repr is Seat('A', 3)", code: py`assert repr(Seat("A", 3)) == "Seat('A', 3)"` },
        { name: 'fields are read-only', code: py`s = Seat("A", 3)
assert s.row == "A" and s.number == 3
with raises(AttributeError):
    s.row = "B"
with raises(AttributeError):
    s.number = 9` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'special-methods-what-are-they',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What are special (dunder) methods, and who calls them?',
      answer: 'Methods with double-underscore names (__len__, __eq__, __repr__) that implement Python\'s data model. You define them on a class; Python calls them implicitly when you use syntax or built-ins — len(x) calls type(x).__len__(x), x == y calls x.__eq__(y).',
      explanation: py`They are the hooks that let user-defined classes integrate with the language. Implicit lookup happens on the class, not the instance, and the built-ins add checks around the raw call. Normal code uses the built-ins; dunders are called directly only in rare cases such as \`super().__init__()\`.`,
      code: { lang: 'python', code: py`class Inbox:
    def __init__(self, messages):
        self.messages = list(messages)

    def __len__(self):
        return len(self.messages)


inbox = Inbox(["hi", "invoice"])
print(len(inbox))     # 2  — Python called Inbox.__len__(inbox)
print(bool(inbox))    # True — truthiness fell back to __len__` },
      whyAsked: 'It is the entry point to the data model; the answer shows whether you know that syntax maps onto methods and who is responsible for calling them.',
      mistakes: ['Saying you should call obj.__len__() directly', 'Calling them "private methods" — the double underscores at both ends are not name mangling', 'Not knowing that they are looked up on the type'],
      followUps: ['Why does assigning obj.__len__ on an instance not affect len(obj)?', 'What does Python do if __bool__ is missing?', 'What is name mangling and how is it different?'],
      modelAnswer: 'Special methods, or dunder methods, are methods with names like __len__, __eq__ and __repr__ that make up Python\'s data model. I define them on my class, but I don\'t call them — Python does, whenever someone uses the matching syntax or built-in. So len(x) becomes type(x).__len__(x), x == y becomes x.__eq__(y), and print(x) ends up in __str__. That is what lets my own classes feel like built-in types. In normal code I always use the built-in or operator, because those add checks and fallbacks that the raw method call skips.',
    },
    {
      id: 'special-methods-repr-vs-str',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between __repr__ and __str__, and which one would you implement first?',
      answer: '__repr__ is the unambiguous developer view (REPL, logs, debuggers, items inside containers); __str__ is the readable end-user view used by print() and f-strings. Implement __repr__ first: __str__ falls back to it, but not vice versa.',
      explanation: py`A good \`__repr__\` looks like a constructor call (\`Book('978-…', 'Dune')\`) or uses angle brackets for objects that can't be rebuilt (\`<Connection host='db'>\`). Containers always display items with \`repr\`, so a class without one prints as \`<… object at 0x…>\` inside every list, dict and log message.`,
      whyAsked: 'Distinguishes people who have debugged real systems from those who memorised definitions; it also tests knowledge of the fallback rule.',
      mistakes: ['"__str__ is for strings and __repr__ is for everything else"', 'Implementing only __str__ and wondering why lists print <object at 0x…>', 'Leaving out !r so string fields lose their quotes'],
      followUps: ['What does {x!r} do in an f-string?', 'What should a __repr__ never contain? (secrets)', 'How do you stop a __repr__ from recursing forever on a self-referencing structure? (reprlib.recursive_repr)'],
      modelAnswer: '__repr__ is the developer-facing representation: it should be unambiguous, and ideally look like the code that would recreate the object, like Book(\'978-0441013593\', \'Dune\'). __str__ is the user-facing one, used by print and f-strings. If a class has no __str__, str() falls back to __repr__, but there\'s no fallback the other way, and containers always show their items with repr. So I implement __repr__ first on basically every class — it pays off in logs, tracebacks and test failures — and add __str__ only when users need friendlier text. I use !r for the fields and keep secrets out of it.',
    },
    {
      id: 'special-methods-eq-hash-contract',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Explain the contract between __eq__ and __hash__. Why does defining __eq__ make a class unhashable?',
      answer: 'If a == b then hash(a) must equal hash(b), and an object\'s hash must not change while it is in a dict or set. Defining __eq__ alone sets __hash__ to None because the inherited identity-based hash would give equal objects different hashes.',
      explanation: py`Dicts and sets use the hash to choose a slot and \`__eq__\` to confirm a match. If equal objects had different hashes, they'd land in different slots and \`__eq__\` would never be asked — duplicates and failed lookups follow. Python protects you by removing the default hash; you opt back in with a \`__hash__\` over the same fields \`__eq__\` compares, ideally on an immutable object.`,
      code: { lang: 'python', code: py`class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))    # same fields as __eq__` },
      whyAsked: 'The contract underpins every dict and set; violating it causes silent data loss, so interviewers check you know it precisely.',
      mistakes: ['Stating the converse ("equal hashes mean equal objects") — collisions are allowed', 'Hashing extra or different fields than __eq__ uses', 'Saying Python generates a hash automatically'],
      followUps: ['Can two unequal objects have the same hash?', 'What does @dataclass do with __hash__ when eq=True and frozen=False?', 'Why is hash(1) == hash(1.0)?'],
      modelAnswer: 'The rule is one-directional: objects that compare equal must have the same hash, and the hash must stay stable while the object is used as a key. Unequal objects are allowed to collide. Dicts and sets rely on this — the hash picks the slot and __eq__ confirms the match — so if equal objects hashed differently, they\'d end up in different slots and lookups would fail silently. That\'s why, when you define __eq__ without __hash__, Python sets __hash__ to None: the inherited identity hash would break the rule. If I want instances in sets, I hash a tuple of exactly the fields __eq__ compares and make those fields immutable — usually with a frozen dataclass.',
    },
    {
      id: 'special-methods-lost-key',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A service caches results in a dict keyed by `Query` objects. After a teammate added a `query.limit = 50` line in one handler, cache lookups started missing and the cache keeps growing. Nothing crashes. What is happening and how do you fix it?',
      answer: 'Query hashes a field that is being mutated after the object is used as a dict key. The key now hashes to a different slot, so lookups miss and new entries pile up. Make Query immutable (frozen dataclass / NamedTuple), or build a new Query instead of mutating, and key the cache only by immutable values.',
      explanation: py`The dict stored the entry under the hash computed at insertion time. Mutating \`limit\` changes \`hash(query)\` (and maybe equality), so a later lookup with an equal-looking query goes to a different slot, or finds the old key but \`__eq__\` disagrees. The old entry is unreachable but still holds memory — a leak. Fixes: \`@dataclass(frozen=True)\` and \`dataclasses.replace(query, limit=50)\` to derive a new key; or key by a tuple of primitive values.`,
      code: { lang: 'python', code: py`from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Query:
    table: str
    limit: int = 10


q = Query("orders")
cache = {q: ["...rows..."]}
bigger = replace(q, limit=50)    # a new key; q is untouched
print(q in cache, bigger in cache)   # True False` },
      whyAsked: 'Tests whether you can connect the abstract hash contract to a real production symptom (cache misses + memory growth) and propose a structural fix.',
      mistakes: ['Blaming the dict implementation', 'Fixing it by removing __hash__ (then the cache crashes instead)', 'Suggesting a random or id()-based hash, which breaks equal-key lookups'],
      followUps: ['How would you detect this kind of bug in tests?', 'Why are tuples hashable but lists not?', 'How does functools.lru_cache build its keys?'],
      modelAnswer: 'This is a broken hash contract caused by mutation. The dict filed each Query under the hash it had when it was inserted; once someone sets query.limit afterwards, the object hashes differently, so lookups go to the wrong slot and miss. The old entries are still in the dict but unreachable, so the cache grows like a leak. Nothing crashes, which is why it\'s nasty. I\'d make Query a frozen dataclass so mutation raises immediately, and use dataclasses.replace to derive a new query with a different limit. The general rule: only immutable values should be dict keys.',
    },
    {
      id: 'special-methods-instance-lookup',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why?',
      code: { lang: 'python', code: py`class Basket:
    pass

b = Basket()
b.__len__ = lambda: 3
print(b.__len__())
print(len(b))` },
      options: [
        '3, then 3',
        "3, then TypeError: object of type 'Basket' has no len()",
        "TypeError for both lines",
        'AttributeError on line 5',
      ],
      correctOption: 1,
      answer: 'The explicit call prints 3, because normal attribute lookup finds the function in the instance __dict__. len(b) raises TypeError: object of type \'Basket\' has no len(), because implicit special-method lookup only consults the type.',
      explanation: py`The language reference says implicit invocations of special methods are only guaranteed to work when the method is defined on the object's type. In CPython, \`len()\` reads a C-level slot on the type; instance attributes never reach it. Setting \`Basket.__len__ = lambda self: 3\` on the class would work. This rule also makes dunder dispatch faster and prevents odd behaviour with classes themselves (e.g. \`hash(int)\` must call \`type.__hash__\`, not \`int.__hash__\`).`,
      whyAsked: 'A sharp check of data-model depth: candidates who really know special-method lookup explain the type-level rule and its reasons.',
      mistakes: ['Answering "3 and 3" because Python is "dynamic"', 'Thinking the lambda is missing a self argument (on an instance attribute, no self is passed)'],
      followUps: ['Why does Python bypass the instance for special methods?', 'Does implicit lookup go through __getattribute__? (No)', 'How do proxies that wrap arbitrary objects support len()?'],
      modelAnswer: 'It prints 3, then raises TypeError: object of type Basket has no len(). The explicit b.__len__() is an ordinary attribute lookup, which finds the lambda in the instance dictionary. But len() uses implicit special-method lookup, which goes straight to the type — the language only guarantees dunders work when they\'re defined on the class. In CPython that\'s a slot on the type object, so it\'s fast and it can\'t be hijacked per instance. If I put the method on the class instead, len() would work.',
    },
    {
      id: 'special-methods-version-equality',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write a `Version` class where `Version("1.2") == Version("1.2.0")` (trailing `.0` parts don\'t matter), instances are hashable consistently with `__eq__`, `repr(Version("1.2"))` is `Version(\'1.2\')`, and comparing with a non-Version returns `NotImplemented`.',
      answer: 'Normalise once: split on ".", convert to ints, strip trailing zeros, store as a tuple. Compare and hash that tuple; keep the original text for the repr.',
      explanation: py`Equality with normalisation is the classic trap: if \`__eq__\` normalises but \`__hash__\` hashes the raw text, \`"1.2"\` and \`"1.2.0"\` are equal but hash differently. Computing one normalised key and using it in **both** methods keeps them in sync.`,
      starter: { files: { 'main.py': py`class Version:
    def __init__(self, text):
        self.text = text

    # TODO: __repr__, __eq__ (ignoring trailing .0 parts) and a matching __hash__


print(Version("1.2") == Version("1.2.0"))
print(len({Version("1.2"), Version("1.2.0"), Version("1.10")}))
` } },
      tests: [
        { name: '1.2 == 1.2.0 == 1.2.0.0', code: py`assert Version("1.2") == Version("1.2.0") == Version("1.2.0.0")` },
        { name: '1.2 != 1.20 and 1.2 != 1.2.1', code: py`assert Version("1.2") != Version("1.20")
assert Version("1.2") != Version("1.2.1")` },
        { name: 'equal versions hash equally', code: py`assert hash(Version("1.2")) == hash(Version("1.2.0"))
assert len({Version("1.2"), Version("1.2.0"), Version("1.10")}) == 2` },
        { name: "repr keeps the original text", code: py`assert repr(Version("1.2")) == "Version('1.2')"` },
        { name: 'non-Version comparison returns NotImplemented', code: py`assert Version("1.2").__eq__("1.2") is NotImplemented
assert (Version("1.2") == "1.2") is False` },
      ],
      solution: { files: { 'main.py': py`class Version:
    def __init__(self, text):
        self.text = text
        parts = [int(part) for part in text.split(".")]
        while len(parts) > 1 and parts[-1] == 0:
            parts.pop()                     # "1.2.0" -> [1, 2]
        self._key = tuple(parts)

    def __repr__(self):
        return f"Version({self.text!r})"

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self._key == other._key

    def __hash__(self):
        return hash(self._key)               # same key as __eq__


print(Version("1.2") == Version("1.2.0"))
print(len({Version("1.2"), Version("1.2.0"), Version("1.10")}))
` } },
      hints: ['Turn "1.2.0" into a tuple of ints, then drop trailing zeros.', 'Store that tuple once in __init__ and use it in both __eq__ and __hash__.'],
      whyAsked: 'Checks that you can implement the eq/hash pair correctly when equality is not just "all fields are identical" — a frequent real-world need (case-insensitive emails, normalised URLs).',
      mistakes: ['Hashing self.text while comparing normalised parts', 'Comparing strings, so "1.10" < "1.9" style bugs creep in', 'Raising TypeError for non-Version comparisons'],
      followUps: ['How would you add ordering (<, >)? (see operator overloading and functools.total_ordering)', 'Why keep the original text?', 'What would packaging.version.Version add?'],
      modelAnswer: 'I normalise the version once in __init__: split on dots, convert to ints, strip trailing zeros, and store the result as a tuple. __eq__ returns NotImplemented for non-Versions and otherwise compares the tuples; __hash__ hashes exactly the same tuple, so the equal-means-equal-hash contract holds automatically. __repr__ shows the original text with !r. The key design point is having a single normalised key used by both methods, because the classic bug is normalising in __eq__ and forgetting in __hash__.',
    },
    {
      id: 'special-methods-dataclass-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'When would you hand-write __eq__/__hash__/__repr__ instead of using @dataclass, and what does @dataclass generate for hashing by default?',
      answer: '@dataclass (eq=True) generates __eq__ comparing all fields as a tuple and sets __hash__ to None; frozen=True also generates a field-based __hash__. Hand-write when equality must use a subset or normalised form of the data, when entities should keep identity semantics, or when the repr must hide sensitive fields in a custom way.',
      explanation: py`Dataclasses compare instances of the **same class** by all fields in order. That's ideal for value objects. It's wrong when, say, a \`Book\` should be equal by ISBN even if a typo in the title was fixed, or a \`User\` row being edited should keep identity. \`field(compare=False)\` and \`field(repr=False)\` cover many cases; \`unsafe_hash=True\` forces a hash on a mutable class and is usually a smell.`,
      code: { lang: 'python', code: py`from dataclasses import dataclass, field


@dataclass(frozen=True)
class Book:
    isbn: str
    title: str = field(compare=False)     # equality and hash use the ISBN only
    api_token: str = field(default="", repr=False, compare=False)


a = Book("978-0441013593", "Dune")
b = Book("978-0441013593", "Dune (2nd ed.)")
print(a == b, hash(a) == hash(b))   # True True
print(a)                            # Book(isbn='978-0441013593', title='Dune')` },
      whyAsked: 'Senior engineers are expected to choose between generated and handwritten behaviour deliberately and to know the hashing rules of dataclasses.',
      mistakes: ['Assuming @dataclass instances are hashable by default', 'Reaching for unsafe_hash=True on mutable classes', 'Writing boilerplate dunders that a dataclass would generate correctly'],
      followUps: ['What is the difference between frozen=True and unsafe_hash=True?', 'How do entity and value-object equality differ?', 'Would you use attrs or Pydantic instead? Why?'],
      modelAnswer: 'By default @dataclass generates __init__, __repr__ and an __eq__ that compares all fields as a tuple, and because it defines __eq__ on a mutable class, it sets __hash__ to None. With frozen=True it also generates a matching field-based hash. For value objects that is exactly what I want, and field(compare=False) or field(repr=False) handle most tweaks. I hand-write the methods when equality needs normalisation — case-insensitive emails, versions with trailing zeros — or when an entity should keep identity semantics. I avoid unsafe_hash=True, because hashing a mutable object is the classic way to lose dict entries.',
    },
  ],

  takeaways: [
    'Special (dunder) methods are hooks: you define them on the class, Python calls them for syntax and built-ins — len(x) → type(x).__len__(x).',
    'Implicit lookup goes to the type, not the instance, and the built-ins add checks — so call len(x), not x.__len__().',
    '__repr__ is for developers (unambiguous, used by containers, logs, the REPL); __str__ is for users and falls back to __repr__. Write __repr__ first.',
    '__eq__ returns True/False, or NotImplemented for types it doesn\'t understand; Python then tries the other operand and finally identity.',
    'Equal objects must have equal hashes. Defining __eq__ sets __hash__ to None; add a __hash__ over the same fields only if they never change.',
    'Truthiness: __bool__ first, then __len__() != 0, otherwise every object is truthy.',
    'Dataclasses generate __repr__ and __eq__ (and __hash__ when frozen=True) — hand-write them only when you need different rules.',
  ],
}
