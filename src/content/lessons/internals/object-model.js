// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const INSPECTOR = py`# Object inspector: every value has an identity, a type and a value
import sys

labels = {}   # id(obj) -> short label, so the output stays readable


def tag(obj):
    """Return a short name for an object's identity: #1, #2, ..."""
    key = id(obj)
    if key not in labels:
        labels[key] = f"#{len(labels) + 1}"
    return labels[key]


def show(name, obj):
    value = getattr(obj, "__name__", None) or repr(obj)
    print(f"{name:<12} id {tag(obj):<4} type {type(obj).__name__:<9} value {value}")


basket = ["apple", "pear"]
same_basket = basket          # a second name for the same object
copy_basket = list(basket)    # a new object with an equal value

show("basket", basket)
show("same_basket", same_basket)
show("copy_basket", copy_basket)
print("same is basket:", same_basket is basket)
print("copy == basket:", copy_basket == basket, "| copy is basket:", copy_basket is basket)

basket.append("plum")         # mutate: identity stays, value changes
show("basket", basket)
print("same_basket sees it:", same_basket)

prices = (3, 4)
show("prices", prices)
prices += (5,)                # tuples can't change: += builds a new tuple
show("prices", prices)


def total(amounts):
    return sum(amounts)


show("total", total)          # functions are objects
show("int", int)              # classes are objects
show("sys", sys)              # modules are objects
print("type(type) is type:", type(type) is type)
`

export default {
  id: 'object-model',
  title: 'Everything is an object: identity, type & value',
  summary: 'Every Python value — ints, functions, classes, even modules — is an object with an identity, a type and a value, and knowing which one `is`, `==` and `type()` look at (and which facts are CPython-only) prevents a whole family of bugs.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['variables-and-names', 'mutability-and-copying', 'classes-and-objects'],
  related: ['none-and-truthiness', 'memory-management', 'bytecode', 'special-methods', 'metaclasses', 'attribute-access', 'records-and-slots', 'descriptors', 'gil-and-free-threading'],
  tags: ['object model', 'objects', 'identity', 'id()', 'is', 'type()', 'value', 'isinstance', 'mutability', 'interning', 'sys.intern', 'small int cache', 'immortal objects', 'sys.getsizeof', 'metaclass', 'type and object', 'first-class functions', 'CPython detail', 'PyPy'],
  apis: [
    { name: 'id(obj)', summary: 'An integer that is unique and constant for this object while it is alive. In CPython it happens to be the memory address.' },
    { name: 'type(obj)', summary: 'The class of an object. With three arguments, type(name, bases, ns) creates a new class.' },
    { name: 'a is b / a is not b', summary: 'Identity test: True when both names refer to the very same object.' },
    { name: 'isinstance(obj, cls)', summary: 'True if obj is an instance of cls or of any subclass of it.' },
    { name: 'sys.getsizeof(obj)', summary: 'Shallow size in bytes of the object itself — not of the objects it refers to. Platform- and version-specific.' },
    { name: 'sys.intern(s)', summary: 'Returns the canonical (interned) copy of string s, so equal interned strings are one object.' },
    { name: 'vars(obj) / obj.__dict__', summary: 'The namespace dict that stores an object’s attributes (when it has one).' },
    { name: 'obj.__class__', summary: 'The class the object belongs to — the same thing type(obj) returns.' },
  ],
  docs: [
    { label: 'Data model — objects, values and types', url: 'https://docs.python.org/3/reference/datamodel.html#objects-values-and-types' },
    { label: 'Built-in functions — id()', url: 'https://docs.python.org/3/library/functions.html#id' },
    { label: 'Built-in functions — type()', url: 'https://docs.python.org/3/library/functions.html#type' },
    { label: 'Expressions — identity comparisons (is)', url: 'https://docs.python.org/3/reference/expressions.html#is-not' },
    { label: 'sys.getsizeof() and sys.intern()', url: 'https://docs.python.org/3/library/sys.html#sys.getsizeof' },
    { label: 'PEP 683 — Immortal objects', url: 'https://peps.python.org/pep-0683/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In Python, **every value is an object**. Not just lists and your own class instances: the number \`42\`, the string \`"Ada"\`, \`None\`, a function you defined, the class \`int\` itself and the \`math\` module are all objects. An *object* is a thing that lives in the computer's memory and carries three pieces of information:`,
    py`1. an **identity** — which object it is. It never changes while the object exists. \`id(obj)\` shows it as a number and \`a is b\` compares it;
2. a **type** — what kind of object it is (\`int\`, \`list\`, \`function\`…). The type decides which operations work. \`type(obj)\` returns it;
3. a **value** — what it currently holds. \`a == b\` compares values. Only **mutable** objects (lists, dicts, most class instances) can change their value in place.`,
    py`That small model explains a surprising amount: why \`is\` and \`==\` disagree, why a "copy" sometimes isn't one, why you can store a function in a dict, and why the answer to \`type(type)\` is \`type\`.`,
    py`This is the *internals* level, so we will be strict about one more thing: which facts are **language guarantees** (true in every Python) and which are **CPython implementation details** — true of the standard interpreter, and of this playground, but not promised. CPython is the reference interpreter written in C that you download from python.org. Others exist: PyPy, GraalPy, MicroPython. You first met names and objects in [variables](lesson:variables-and-names) and aliasing in [mutability & copying](lesson:mutability-and-copying); this lesson goes one layer down.`,
  ],
  why: [
    py`**It prevents real bugs.** \`if status is "done":\` can pass every test on your laptop and fail in production, because \`is\` asks "same object?" and equal strings are often *different* objects. The same goes for numbers, caches keyed by \`id()\`, and tuples that "can't change" but whose contents do.`,
    py`**It unlocks advanced Python.** Decorators, plugin registries, dependency injection, metaclasses and mocking all depend on the fact that functions, classes and modules are ordinary objects you can pass around, store and inspect (see [decorators](lesson:decorators) and [metaclasses](lesson:metaclasses)).`,
    py`**It makes memory reasoning possible.** "How big is this dict?" has a trap answer (\`sys.getsizeof\`) and a real one. Knowing that containers hold *references* to other objects is the first step to understanding [memory management](lesson:memory-management).`,
  ],
  eli15: [
    py`Picture a giant warehouse. **Everything** in it is an item: numbers, words, lists, even the machines that make items. Every item has a **serial number** stamped on it (its identity), a **label** saying what kind of item it is (its type), and **contents** (its value).`,
    py`Two mugs can look identical — same colour, same picture (\`==\` is \`True\`) — but they have different serial numbers (\`is\` is \`False\`). Only if two name tags hang on the *same* mug does \`is\` say \`True\`.`,
    py`Some items are sealed boxes (immutable: ints, strings, tuples) — to "change" one you must make a new box. Others are open trays (mutable: lists, dicts) — you can swap their contents and the serial number stays the same.`,
    py`And the weird bit: the *machine* that makes mugs (the class) is also an item in the warehouse, with its own serial number. The master machine that makes machines is called \`type\` — and it was built by… itself.`,
  ],
  analogy: {
    title: 'Serial numbers in a warehouse',
    body: [
      py`A warehouse tracks every item by a serial number that is never reused *while the item is on the shelves*. Once an item is scrapped, its serial number can be printed on a brand-new item. Each item also has a label with its kind ("mug", "box") and some contents.`,
      py`Python objects work the same way. \`id()\` reads the serial number, \`type()\` reads the label, \`==\` compares contents and \`is\` asks "is this literally the same item?". A class is like a mould: an item itself, which stamps out other items.`,
    ],
    mapping: [
      ['an item on the shelves', 'an object in memory'],
      ['its serial number', 'its identity: id(obj)'],
      ['the label saying what kind of item', 'its type: type(obj)'],
      ['what is inside it', 'its value'],
      ['"is this the very same item?"', 'a is b'],
      ['"do these hold the same thing?"', 'a == b'],
      ['a mould that stamps out mugs', 'a class such as int or list'],
      ['the master machine that builds moulds', 'type, the metaclass of all built-in classes'],
      ['a serial number reused after an item is scrapped', 'an id() reused after an object is freed'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Shared objects: one list in two places, one function under two names',
    props: {
      code: py`row = [0, 0]
grid = [row, row]
grid[0][1] = 5
print(grid)

fresh = [[0, 0] for _ in range(2)]
fresh[0][1] = 5
print(fresh)

def greet(name):
    return "Hi " + name

say = greet
tools = {"hello": say}
print(tools["hello"]("Ada"))
print(say is greet, type(greet).__name__)
`,
      inline: false,
      notes: {
        1: 'A list object is created; its two slots refer to the int object `0`.',
        2: '`grid` is a new list whose **two slots point at the same** `row` list. Nothing is copied.',
        3: 'Writing through `grid[0]` changes the one shared list, so `grid[1]` shows the change too.',
        6: 'The comprehension builds a **new** inner list on each pass: two different identities.',
        7: 'Only the first inner list changes this time.',
        10: '`def` creates a **function object** and binds the name `greet` to it.',
        13: '`say = greet` adds a second name for the same function object — exactly like aliasing a list.',
        14: 'A dict can hold a reference to a function like any other value.',
        15: 'Looking the function up in the dict and calling it runs the same object.',
        16: '`is` confirms it: one function object, three references (`greet`, `say`, the dict).',
      },
    },
    alt: 'A step-by-step trace. row points to a list of two zeros. grid points to a list whose two slots both have arrows to that same row list, so setting grid[0][1] = 5 shows up in both rows when grid is printed. fresh points to a list of two separate inner lists, so only the first changes. greet points to a function object; say and the dict entry "hello" point to the same function object; the final print shows True function.',
    caption: py`Step through with ▶. With \`inline: false\` even ints are drawn as separate objects, so you can see that names, list slots and dict values all hold **references** to objects — and that a function is just another object on the right-hand side.`,
  },
  syntax: [
    py`#### Three questions you can ask any object`,
    py`| question | tool | answers with |
|---|---|---|
| *Which* object is it? | \`id(obj)\`, \`a is b\` | identity |
| *What kind* of object is it? | \`type(obj)\`, \`isinstance(obj, cls)\` | type |
| *What does it hold?* | \`a == b\`, \`repr(obj)\` | value |`,
    { code: py`scores = [70, 85]
backup = scores           # same object
snapshot = list(scores)   # new object, equal value

print(scores is backup)       # True  - same identity
print(scores is snapshot)     # False - different objects
print(scores == snapshot)     # True  - equal values
print(type(scores))           # <class 'list'>
print(isinstance(True, int))  # True  - bool is a subclass of int`, lang: 'python', title: 'identity, type and value side by side' },
    py`#### Identity rules (language guarantees)`,
    py`- An object's identity **never changes** while it is alive.
- Two objects that are alive **at the same time** never have the same \`id()\`.
- After an object is freed, its id **may be reused** by a new object. Ids are only meaningful for living objects.
- \`a is b\` is equivalent to \`id(a) == id(b)\` while both are alive.`,
    { callout: 'note', title: 'CPython detail', text: py`In CPython, \`id(obj)\` is the object's memory address, and objects never move once created. Neither fact is promised: PyPy's garbage collector *moves* objects, so PyPy computes ids another way. Never do arithmetic with ids or print them for users — treat an id as an opaque token.` },
    py`#### Type rules`,
    py`- \`type(obj)\` returns the object's class; \`obj.__class__\` is the same thing.
- \`isinstance(obj, cls)\` also accepts subclasses — prefer it for type checks. Use \`type(obj) is cls\` only when you need the *exact* class.
- The type of an object is fixed for its lifetime (assigning \`__class__\` is possible for some user-defined classes, but it is rare and has strict rules).`,
    py`#### Everything really is an object`,
    { code: py`import math

def greet(name):
    return "Hi " + name

for thing in [42, "Ada", None, len, greet, int, math]:
    print(f"{type(thing).__name__:<28} {thing!r:.40}")`, lang: 'python', title: 'one loop, seven kinds of object' },
    py`| expression | its type | notes |
|---|---|---|
| \`42\` | \`int\` | immutable |
| \`"Ada"\` | \`str\` | immutable |
| \`None\` | \`NoneType\` | a singleton: there is exactly one \`None\` |
| \`len\` | \`builtin_function_or_method\` | a function written in C |
| \`greet\` | \`function\` | has attributes: \`__name__\`, \`__code__\`, \`__defaults__\`… |
| \`int\` | \`type\` | a class is an object whose type is a *metaclass* |
| \`math\` | \`module\` | a module object; its globals live in \`math.__dict__\` |`,
    py`#### The loop at the top: \`type\` and \`object\``,
    { code: py`print(type(42))            # <class 'int'>
print(type(int))           # <class 'type'>  - classes are instances of type
print(type(type))          # <class 'type'>  - type is an instance of itself
print(int.__bases__)       # (<class 'object'>,) - every class inherits from object
print(type.__bases__)      # (<class 'object'>,) - even type
print(object.__bases__)    # ()  - object is the root
print(isinstance(object, type), isinstance(type, object))   # True True`, lang: 'python', title: 'two different relationships' },
    py`Keep the two relationships apart: **"is an instance of"** (follow \`type()\`) and **"is a subclass of"** (follow \`__bases__\`). Every class is an instance of \`type\` (or of a custom [metaclass](lesson:metaclasses)), and every class is a subclass of \`object\`. \`type\` and \`object\` are wired to each other inside the interpreter at startup — you could not create that loop in Python code.`,
    py`#### Comparing correctly`,
    { code: py`result = None
if result is None:          # identity: correct for singletons
    print("no result yet")

status = "done"
if status == "done":        # value: correct for strings, numbers, lists...
    print("finished")`, lang: 'python', title: 'is for singletons, == for values' },
    py`Use \`is\` for **singletons** — objects of which only one can exist: \`None\`, \`NotImplemented\`, \`Ellipsis\`, enum members, and sentinel objects you create with \`_MISSING = object()\`. Use \`==\` for everything else. More on this in [None, truthiness & identity](lesson:none-and-truthiness).`,
  ],
  walkthrough: {
    title: 'Reading the object inspector',
    lang: 'python',
    code: INSPECTOR,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 12], text: py`\`tag()\` turns an \`id()\` into a short label like \`#1\`. Raw ids are big, platform-specific numbers; labels make the output readable and stable. The labels are only trustworthy because every object we tag stays alive — a freed object's id may be reused.` },
      { lines: [15, 17], text: py`\`show()\` prints all three properties: the identity label, \`type(obj).__name__\`, and the value. Objects with a \`__name__\` (functions, classes, modules) show their name instead of a long repr.` },
      { lines: [20, 22], text: py`\`same_basket = basket\` binds a second name to the **same** list. \`list(basket)\` builds a **new** list with an equal value.` },
      { lines: [24, 28], text: py`The output shows \`#1\`, \`#1\`, \`#2\`: two names share identity #1, the copy is #2. \`is\` and \`==\` disagree for the copy — equal value, different object.` },
      { lines: [30, 32], text: py`\`append\` changes the list's **value** in place. Its identity (#1) stays the same, so the alias \`same_basket\` sees the new item.` },
      { lines: [34, 37], text: py`Tuples are immutable, so \`prices += (5,)\` cannot change the tuple. Python builds a **new** tuple and re-binds the name: the label changes from #3 to #4.` },
      { lines: [40, 47], text: py`A function, a class and a module go through exactly the same \`show()\` — they have identities and types like any other object. The last line proves the loop at the top of the type system: \`type(type) is type\`.` },
    ],
  },
  playground: {
    title: 'Object inspector',
    objective: 'Run it and match every #label to the objects it describes, then change how objects are shared and watch identities move.',
    files: { 'main.py': INSPECTOR },
    expected: py`Thirteen lines. The ids are shown as labels so they are readable:

\`\`\`text
basket       id #1   type list      value ['apple', 'pear']
same_basket  id #1   type list      value ['apple', 'pear']
copy_basket  id #2   type list      value ['apple', 'pear']
same is basket: True
copy == basket: True | copy is basket: False
basket       id #1   type list      value ['apple', 'pear', 'plum']
same_basket sees it: ['apple', 'pear', 'plum']
prices       id #3   type tuple     value (3, 4)
prices       id #4   type tuple     value (3, 4, 5)
total        id #5   type function  value total
int          id #6   type type      value int
sys          id #7   type module    value sys
type(type) is type: True
\`\`\`

Try \`print(id(basket))\` too: the raw number differs between runs and machines — that is exactly why it should never appear in program logic.`,
    experiments: [
      {
        id: 'real-copy',
        task: py`Change the line that creates \`same_basket\` so it becomes an **independent copy** instead of an alias. Predict which labels change before you run it.`,
        hint: py`Use the same technique as \`copy_basket\`: \`list(basket)\` or \`basket.copy()\`.`,
        tests: [
          { name: 'same_basket is a different object', code: py`assert same_basket is not basket, 'same_basket still refers to the same list as basket'` },
          { name: 'the copy did not receive "plum"', code: py`assert "plum" not in same_basket` },
        ],
        explain: py`A copy is a new object, so it gets its own identity label and the later \`append\` on \`basket\` no longer shows up through it. Note that \`same is basket\` now prints \`False\` even though the two lists started out equal.`,
      },
      {
        id: 'function-attribute',
        task: py`Functions are objects, so they can carry attributes. Right after the \`def total\` block, add \`total.currency = "EUR"\`, then print \`total.currency\`.`,
        hint: py`Attributes on functions are stored in \`total.__dict__\`, exactly like attributes on instances.`,
        tests: [
          { name: 'total has a currency attribute', code: py`assert getattr(total, "currency", None) == "EUR", 'Set total.currency = "EUR"'` },
          { name: 'EUR was printed', code: py`assert "EUR" in output` },
        ],
        explain: py`A function object has a \`__dict__\` just like an instance of your own class. Libraries use this to attach metadata (\`functools.wraps\` copies \`__name__\`, \`__doc__\` and \`__dict__\` onto a wrapper; test frameworks mark functions this way).`,
      },
      {
        id: 'bool-chain',
        task: py`Add \`show("True", True)\` and \`print(type(True).__mro__)\` at the end. Which classes does \`bool\` inherit from?`,
        hint: py`\`__mro__\` (method resolution order) lists a class followed by all its base classes, ending with \`object\`.`,
        tests: [
          { name: 'True is shown as a bool', code: py`assert "type bool" in output` },
          { name: 'the MRO of bool is printed', code: py`assert "(<class 'bool'>, <class 'int'>, <class 'object'>)" in output` },
        ],
        explain: py`\`bool\` is a subclass of \`int\` (that is why \`True + True == 2\`), and like every class it ends at \`object\`. \`True\` itself is a singleton: there is exactly one \`True\` object, so \`flag is True\` is reliable — though PEP 8 prefers plain \`if flag:\`.`,
      },
      {
        id: 'intern',
        task: py`Strings built at runtime are new objects. At the end, create \`k1 = sys.intern("-".join(["order", "42"]))\` and \`k2 = sys.intern("-".join(["order", "42"]))\` and print \`k1 is k2\`. Then try it without \`sys.intern\`.`,
        hint: py`\`sys.intern(s)\` returns the one canonical string object equal to \`s\`, creating it the first time.`,
        tests: [
          { name: 'k1 and k2 equal "order-42"', code: py`assert ns.get("k1") == ns.get("k2") == "order-42"` },
          { name: 'k1 and k2 are one object', code: py`assert ns.get("k1") is ns.get("k2"), 'Wrap both strings in sys.intern(...)'` },
        ],
        explain: py`\`sys.intern\` guarantees that equal interned strings are the same object. Without it, \`"-".join(...)\` builds a fresh string each time and \`is\` is \`False\` while \`==\` is \`True\`. Interning is a memory and speed optimisation for many repeated strings (think column names in a big CSV) — it is never a reason to compare strings with \`is\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Instance-of vs subclass-of: the type/object loop',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'n42', label: '42', note: 'an int object', x: 110, y: 80, tone: 'paper' },
        { id: 'rex', label: 'rex', note: 'a Dog instance', x: 110, y: 260, tone: 'paper' },
        { id: 'int', label: 'int', note: 'a class', x: 380, y: 80, tone: 'blue' },
        { id: 'dog', label: 'Dog', note: 'your class', x: 380, y: 260, tone: 'blue' },
        { id: 'object', label: 'object', note: 'root of every class', x: 650, y: 80, tone: 'yellow' },
        { id: 'type', label: 'type', note: 'the default metaclass', x: 650, y: 260, tone: 'red' },
      ],
      edges: [
        { id: 'i42', from: 'n42', to: 'int', label: 'type()' },
        { id: 'irex', from: 'rex', to: 'dog', label: 'type()' },
        { id: 'iint', from: 'int', to: 'type', label: 'type()' },
        { id: 'idog', from: 'dog', to: 'type', label: 'type()' },
        { id: 'bint', from: 'int', to: 'object', label: 'base class', dashed: true },
        { id: 'bdog', from: 'dog', to: 'object', label: 'base class', dashed: true },
        { id: 'btype', from: 'type', to: 'object', label: 'base class', dashed: true },
        { id: 'iobj', from: 'object', to: 'type', label: 'type()' },
      ],
      steps: [
        { focus: ['n42', 'int'], edges: ['i42'], text: py`Solid arrows mean **"is an instance of"**. \`type(42)\` is \`int\`: every object carries a reference to its class.` },
        { focus: ['rex', 'dog'], edges: ['irex'], text: py`Your own classes work the same way: after \`class Dog: ...\` and \`rex = Dog()\`, \`type(rex)\` is \`Dog\`.` },
        { focus: ['int', 'dog', 'type'], edges: ['iint', 'idog'], text: py`Classes are objects too, so they have a type. For ordinary classes that type is \`type\` — the **metaclass** that builds classes. \`type(int)\` and \`type(Dog)\` are both \`type\`.` },
        { focus: ['int', 'dog', 'object'], edges: ['bint', 'bdog'], text: py`Dashed arrows mean **"is a subclass of"** (follow \`__bases__\`). Every class ultimately inherits from \`object\`, which is where default methods like \`__repr__\` and \`__eq__\` come from.` },
        { focus: ['type', 'object'], edges: ['btype'], text: py`\`type\` is itself a class, so it too inherits from \`object\`: \`issubclass(type, object)\` is \`True\`.` },
        { focus: ['object', 'type'], edges: ['iobj', 'btype'], text: py`And \`object\` is a class, so its type is \`type\`. Finally \`type(type) is type\`: the chain of "instance of" ends in a loop. The interpreter wires this up in C at startup — it is a language-level fact, true in every Python.` },
      ],
    },
    alt: 'Diagram with six boxes: the int object 42 and the instance rex on the left, the classes int and Dog in the middle, object and type on the right. Solid arrows labelled type() go from 42 to int, rex to Dog, int and Dog to type, and object to type. Dashed arrows labelled base class go from int, Dog and type to object.',
    caption: py`Two relationships, two arrow styles. Follow solid arrows with \`type()\`, dashed arrows with \`__bases__\` / \`__mro__\`.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A name never holds an object directly — it holds a **reference** (an arrow) to it. So do list slots, dict values, attributes and function arguments. That is why one object can show up in many places at once, and why changing a mutable object "everywhere" happens without any copying.`,
      py`Every object also points to its **type**. When you write \`basket.append("plum")\`, Python follows \`basket\` to the list object, follows the list object to its type \`list\`, finds \`append\` there and calls it. Attribute lookup always starts from the object and its class — see [attribute access](lesson:attribute-access) and the [class lookup rules](lesson:inheritance).`,
      { code: py`class Playlist:
    pass

road_trip = Playlist()
road_trip.songs = ["Hey Jude"]

print(road_trip.__class__ is Playlist)   # the object knows its class
print(vars(road_trip))                   # {'songs': ['Hey Jude']}
print(Playlist.__name__, type(Playlist)) # Playlist <class 'type'>`, lang: 'python', title: 'objects know their class; instances keep attributes in a dict' },
      py`Immutable objects (ints, floats, strings, tuples, frozensets) can never change their value, so any "change" builds a new object and re-binds the name. Mutable objects (lists, dicts, sets, most instances) change in place and keep their identity. A tuple is immutable even if it contains a list: the tuple will always refer to *the same* list, but that list can still change.`,
    ],
    technical: [
      py`**Object layout (CPython detail).** Every CPython object starts with the same header: a *reference count* (how many references point at it — see [memory management](lesson:memory-management)) and a pointer to its *type object*. Variable-size objects such as tuples and ints add a size field. \`type(obj)\` simply reads that type pointer, which is why it is fast and why the type can't be changed casually.`,
      { callout: 'note', title: 'CPython detail', text: py`\`id()\` is the address of that header in memory. CPython never moves objects, so the address is stable for the object's life — and is free to be reused once the object is gone. PyPy, GraalPy and MicroPython make their own choices: on PyPy, objects move during garbage collection, \`id()\` is not an address, and \`is\` between equal ints or floats behaves like value equality.` },
      py`**The small-int cache.** CPython creates the ints from -5 to 256 once, at startup, and hands out those same objects whenever such a value is produced. Since CPython 3.12 they are also **immortal** (PEP 683): their reference count never changes, which avoids memory writes and helps multi-threaded builds. \`None\`, \`True\` and \`False\` are immortal too.`,
      { code: py`a = int("256")
b = int("256")
print(a is b)        # True in CPython: both come from the small-int cache

c = int("1000")
d = int("1000")
print(c is d)        # False in CPython: two separate int objects
print(c == d)        # True everywhere: same value`, lang: 'python', title: 'runtime ints: cached vs fresh (CPython)' },
      py`**Constants are shared within one compilation.** When CPython compiles a file, equal constants in the same code object are stored once. That is why \`x = 1000; y = 1000; print(x is y)\` usually prints \`True\` in a script (one compilation) but \`False\` when typed on separate lines in the interactive REPL (separate compilations). Same code, different answer — the clearest sign you are looking at an implementation detail. You'll see the constant table (\`co_consts\`) in the [bytecode lesson](lesson:bytecode).`,
      py`**String interning (CPython detail).** CPython automatically interns some strings — string constants that look like identifiers, attribute and variable names, keyword argument names — so dictionary lookups on names can compare pointers first. Strings created at runtime (\`input()\`, \`join\`, slicing, reading files) are generally *not* interned. The exact rules have changed between versions. \`sys.intern(s)\` is the only interning you can rely on.`,
      { code: py`import sys

key_a = "-".join(["user", "42"])
key_b = "-".join(["user", "42"])
print(key_a == key_b, key_a is key_b)        # True False

key_a, key_b = sys.intern(key_a), sys.intern(key_b)
print(key_a is key_b)                        # True: guaranteed by sys.intern`, lang: 'python', title: 'interning on purpose' },
      { callout: 'warn', title: 'Python warns you', text: py`Because \`is\` with a literal is almost always a bug, the compiler emits \`SyntaxWarning: "is" with 'str' literal. Did you mean "=="?\` (and the same for \`int\` literals). Treat that warning as an error.` },
      py`**\`sys.getsizeof\` is shallow.** It returns the size of the object's own memory block (it calls \`__sizeof__\` and adds the garbage collector's per-object overhead for container objects). A list's size covers its header and its array of *references*, not the objects those references point to. Replace a short string in a list with a 100 KB one and the list's \`getsizeof\` does not change at all.`,
      { code: py`import struct
import sys

row = ["a", "b", "c"]
before = sys.getsizeof(row)
row[0] = "x" * 100_000                      # a huge string...
print(before == sys.getsizeof(row))         # True: the list only stores a reference
print(sys.getsizeof(row[0]) > 100_000)      # True: the string is big on its own
print("pointer size:", struct.calcsize("P"), "bytes")`, lang: 'python', title: 'shallow size in action' },
      { callout: 'note', title: 'CPython detail: sizes depend on the build', text: py`The playground runs CPython 3.14 compiled to **32-bit WebAssembly**, where a pointer is 4 bytes. A typical desktop CPython is 64-bit with 8-byte pointers, so every \`sys.getsizeof\` number you see here is smaller than on your laptop, and numbers also change between Python versions. Compare sizes *relative to each other* on one interpreter; never hard-code them in tests.` },
    ],
    production: [
      py`**Reserve \`is\` for singletons and sentinels.** \`x is None\`, \`result is NotImplemented\`, \`color is Color.RED\` (enum members are singletons) and a module-level \`_MISSING = object()\` sentinel are all correct. Everything else gets \`==\`. Linters such as Ruff flag \`is\` with literals.`,
      py`**Ids are only valid while you hold the object.** Caching or de-duplicating by \`id(obj)\` is safe only if the cache also keeps the object alive (or uses a \`weakref.WeakKeyDictionary\`, which removes entries when objects die). A dict keyed by bare ids silently mixes up a dead object with a new one that got its address. Prefer caching by value (\`functools.lru_cache\` on hashable arguments).`,
      py`**Measure memory for real.** For "how much memory does my data use?", \`sys.getsizeof\` on the top-level container is misleading. Use \`tracemalloc\` snapshots (built in, see [profiling](lesson:profiling)), the process's resident memory from your monitoring, or a deep-size tool such as the third-party \`pympler.asizeof\`. Remember that shared objects (interned strings, small ints, a list referenced twice) are only paid for once.`,
      py`**Shrink millions of small objects.** Per-instance \`__dict__\`s are the usual culprit. \`__slots__\` or \`@dataclass(slots=True)\` (3.10+) store attributes in fixed slots instead (see [records & slots](lesson:records-and-slots)); tuples and \`NamedTuple\`s are compact; \`array.array\` and NumPy store numbers unboxed, without one object per value. Interning repeated strings read from files can also save a lot.`,
      py`**Write portable code.** Your code may one day run on PyPy (for speed), GraalPy (on the JVM), MicroPython (on a microcontroller) or CPython compiled to WebAssembly (in a browser, like this playground). Code that only relies on language guarantees runs correctly on all of them.`,
    ],
  },
  mistakes: [
    {
      title: 'Using is to compare strings or numbers',
      wrong: { code: py`def is_admin(role):
    return role is "admin"      # SyntaxWarning, and wrong at runtime

print(is_admin("".join(["ad", "min"])))   # False!`, lang: 'python' },
      right: { code: py`def is_admin(role):
    return role == "admin"

print(is_admin("".join(["ad", "min"])))   # True`, lang: 'python' },
      explanation: py`\`is\` compares identity. A string built at runtime is a new object, so \`is\` is \`False\` even when the text matches. It may "work" in quick tests because of interning and constant sharing — then fail on real input. Always compare values with \`==\`.`,
    },
    {
      title: 'Checking the exact type and rejecting subclasses',
      wrong: { code: py`from collections import OrderedDict

def count_keys(data):
    if type(data) == dict:          # OrderedDict is rejected!
        return len(data)
    raise TypeError("expected a dict")

print(count_keys(OrderedDict(a=1)))`, lang: 'python', static: true },
      right: { code: py`from collections import OrderedDict

def count_keys(data):
    if isinstance(data, dict):      # accepts dict and its subclasses
        return len(data)
    raise TypeError("expected a dict")

print(count_keys(OrderedDict(a=1)))   # 1`, lang: 'python' },
      explanation: py`\`type(x) == dict\` only matches the exact class. \`isinstance\` follows inheritance, which is almost always what you want. (Even better, accept any mapping with \`collections.abc.Mapping\` — see [abstract base classes](lesson:abstract-base-classes).)`,
    },
    {
      title: 'Trusting sys.getsizeof for a container',
      wrong: { code: py`import sys

log_lines = ["x" * 10_000 for _ in range(100)]
print(sys.getsizeof(log_lines), "bytes")   # tiny: only the list of references`, lang: 'python' },
      right: { code: py`import sys

log_lines = ["x" * 10_000 for _ in range(100)]
total = sys.getsizeof(log_lines) + sum(sys.getsizeof(s) for s in log_lines)
print(total, "bytes, including the strings")`, lang: 'python' },
      explanation: py`\`getsizeof\` measures one object, not the objects it refers to. For nested data you must walk the references (taking care to count shared objects once), or use \`tracemalloc\` to measure allocations directly.`,
    },
    {
      title: 'Thinking a tuple’s contents can never change',
      wrong: { code: py`settings = ("dark", ["en"])
settings[1].append("fr")       # works: the list inside is mutable
cache = {settings: "ok"}       # TypeError: cannot use 'tuple' as a dict key`, lang: 'python', static: true },
      right: { code: py`settings = ("dark", ("en",))   # immutable all the way down
cache = {settings: "ok"}
print(cache)`, lang: 'python' },
      explanation: py`A tuple is immutable in the sense that it always refers to the *same* objects. If one of them is mutable, the tuple's value can still change — and the tuple becomes unhashable. Use tuples of immutable values (or frozen dataclasses) for keys and constants.`,
    },
    {
      title: 'Keying a cache by id() of a temporary object',
      wrong: { code: py`_results = {}

def word_count(lines):
    key = id(lines)                       # identity of a temporary list
    if key not in _results:
        _results[key] = sum(len(line.split()) for line in lines)
    return _results[key]`, lang: 'python' },
      right: { code: py`from functools import lru_cache

@lru_cache(maxsize=1024)
def word_count(lines):                    # lines must be hashable: pass a tuple
    return sum(len(line.split()) for line in lines)

print(word_count(("a b", "c")))           # 3`, lang: 'python' },
      explanation: py`Once the first list is freed, a new list can be created at the same address and get the same id — and the cache returns the old answer for different data. Ids identify *living* objects only. Cache by value, or keep the object alive alongside its id.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxWarning: "is" with 'str' literal. Did you mean "=="?`,
      cause: py`An identity comparison against a literal, e.g. \`if command is "quit":\`. It might appear to work for short constant strings and fail for runtime strings such as \`input()\`.`,
      fix: py`Replace \`is\` with \`==\` (and \`is not\` with \`!=\`). Keep \`is\` only for \`None\`, sentinels and other singletons.`,
    },
    {
      symptom: py`TypeError: cannot use 'tuple' as a dict key (unhashable type: 'list')`,
      cause: py`A tuple used as a dict key (or set element) contains a mutable object such as a list, so the tuple cannot be hashed.`,
      fix: py`Make the key immutable all the way down: convert inner lists to tuples (\`tuple(tags)\`) or sets to \`frozenset\`.`,
    },
    {
      symptom: py`AttributeError: 'int' object has no attribute 'label' and no __dict__ for setting new attributes`,
      cause: py`You tried to attach an attribute to an instance of a built-in type (or of a class with \`__slots__\`). These objects have no per-instance \`__dict__\`.`,
      fix: py`Store the extra data next to the object (a dict, a dataclass wrapping the value) or subclass the type if you really need attributes.`,
    },
    {
      symptom: py`Two different objects printed the same id() — "but ids are unique!"`,
      cause: py`The first object was already freed when the second was created, e.g. \`id([]) == id([])\` is often \`True\` in CPython. Ids are only unique among objects alive *at the same time*.`,
      fix: py`Keep both objects alive (bind them to names) before comparing, and compare with \`a is b\` rather than storing ids.`,
    },
  ],
  bestPractices: [
    'Compare values with == and reserve is for None, sentinels, enum members and other singletons.',
    'Prefer isinstance(obj, cls) (or an ABC/Protocol) over type(obj) == cls so subclasses are accepted.',
    'Treat id() as an opaque token that is only valid while the object is alive — never store or print it as data.',
    'Know which facts are CPython details (id = address, small-int cache, interning, getsizeof numbers) and keep them out of program logic.',
    'Use sys.intern only as a memory optimisation for many repeated runtime strings, never to make is-comparisons work.',
    'Measure memory with tracemalloc or a deep-size tool; sys.getsizeof is shallow and platform-specific.',
    'Make dictionary keys and shared constants immutable all the way down (tuples of immutables, frozenset, frozen dataclasses).',
  ],
  useCases: [
    'Plugin registries and command dispatch tables that store functions or classes in dicts.',
    'Sentinel objects (_MISSING = object()) to tell "no argument given" apart from None.',
    'Debugging aliasing bugs by checking whether two names are the same object.',
    'Estimating and reducing the memory footprint of large in-memory datasets.',
    'Writing code that behaves the same on CPython, PyPy, GraalPy and WebAssembly builds.',
  ],
  comparison: {
    title: 'Guarantee or implementation detail?',
    headers: ['Fact', 'Language guarantee?', 'CPython (this playground)', 'Other implementations'],
    rows: [
      ['Every value is an object with identity, type and value', 'Yes', 'Yes', 'Yes'],
      ['id() is unique among objects alive at the same time', 'Yes', 'Yes', 'Yes'],
      ['type(type) is type; every class inherits from object', 'Yes', 'Yes', 'Yes'],
      ['id() is a memory address', 'No', 'Yes', 'Not on PyPy (objects move)'],
      ['Ints from -5 to 256 are shared objects', 'No', 'Yes, and immortal since 3.12', 'May differ; PyPy makes is on equal ints True'],
      ['Identifier-like string constants are interned', 'No', 'Yes; rules vary by version', 'May differ'],
      ['sys.getsizeof() numbers', 'No (and always shallow)', 'Depend on version and 32/64-bit build', 'May be very different or unsupported'],
    ],
    note: py`Only the first three rows are safe to build program logic on. The rest are worth knowing for debugging and performance work.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'object-model-q1',
      type: 'mcq',
      prompt: 'Which statement is a **language guarantee** — true in every Python implementation?',
      options: [
        { text: '`id(obj)` is the memory address of the object', why: 'That is how CPython implements id(), not a rule of the language. PyPy’s garbage collector moves objects, so its ids are not addresses.' },
        { text: 'The ints from -5 to 256 are cached, so `count is 100` is reliable', why: 'The small-int cache is a CPython optimisation. Other implementations may differ, and Python even warns about `is` with a literal.' },
        'Two objects that are alive at the same time never have the same `id()`',
        { text: 'Equal strings are always the same object', why: 'Strings built at runtime (input, join, slicing) are usually new objects. Equal strings share one object only after interning, which is mostly a CPython detail.' },
      ],
      answer: 2,
      explanation: py`The data model promises that an object's identity is unique and constant *while it is alive*. How ids are computed, and which objects are cached or interned, is up to the implementation.`,
    },
    {
      id: 'object-model-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`a = [1, 2]
b = a
c = [1, 2]
print(a == c, a is c, a is b)`,
      answer: 'True False True',
      accept: ['True False True'],
      explanation: py`\`a\` and \`c\` hold equal values but are two separate list objects (\`==\` is \`True\`, \`is\` is \`False\`). \`b = a\` binds a second name to the same list, so \`a is b\` is \`True\`.`,
    },
    {
      id: 'object-model-q3',
      type: 'output',
      prompt: 'Predict the three printed values.',
      code: py`print(type(type(42)) is type)
print(isinstance(type, object))
print(issubclass(object, type))`,
      options: [
        'True, True, False',
        { text: 'False, True, False', why: 'type(42) is int, and type(int) is type — so the first line is True.' },
        { text: 'True, False, False', why: 'type is a class, and every class is an instance of object (everything is an object).' },
        { text: 'True, True, True', why: 'object is an *instance* of type, but not a *subclass* of it: object.__bases__ is empty.' },
      ],
      answer: 0,
      explanation: py`\`type(type(42))\` is \`type(int)\`, which is \`type\`. Everything — including \`type\` — is an instance of \`object\`. But \`object\` is the root of the class hierarchy and has no bases, so it is not a subclass of \`type\`. Keep "instance of" and "subclass of" apart.`,
    },
    {
      id: 'object-model-q4',
      type: 'bug',
      prompt: 'This admin check passes a quick test with a typed-in constant but rejects real users. Click the buggy line.',
      code: py`def is_admin(role):
    return role is "admin"

role = input("Role: ").strip()
if is_admin(role):
    print("Welcome, admin")
else:
    print("Access denied")`,
      answerLine: 2,
      explanation: py`\`role\` comes from \`input()\` and \`.strip()\`: a new string object built at runtime. \`is\` compares identity, so it is \`False\` even when the text is \`"admin"\`. Python also warns: \`SyntaxWarning: "is" with 'str' literal\`. Use \`role == "admin"\`.`,
    },
    {
      id: 'object-model-q5',
      type: 'fill',
      prompt: 'Fill in the right comparison operator for each blank.',
      code: py`def describe_price(prices, item):
    price = prices.get(item)
    if price ___ None:
        return "not stocked"
    if price ___ 0:
        return "free sample"
    return f"{price} EUR"`,
      answer: [['is'], ['==']],
      explanation: py`\`None\` is a singleton, so \`price is None\` is the idiomatic, reliable test. \`0\` is an ordinary value: compare it with \`==\` (and \`price is 0\` would trigger a \`SyntaxWarning\`).`,
    },
    {
      id: 'object-model-q6',
      type: 'output',
      prompt: 'Tuples are immutable… so what does this print?',
      code: py`t = ([1], 2)
t[0].append(3)
print(t)`,
      options: [
        { text: '([1], 2)', why: 'The tuple still refers to the same list, but that list was mutated in place.' },
        '([1, 3], 2)',
        { text: 'TypeError: \'tuple\' object does not support item assignment', why: 'There is no item assignment here: t[0] is only read, then .append() mutates the list it refers to.' },
      ],
      answer: 1,
      explanation: py`Immutability is shallow: the tuple can never refer to different objects, but a mutable object inside it can still change its own value. This is also why such a tuple is unhashable.`,
    },
    {
      id: 'object-model-q7',
      type: 'short',
      prompt: 'A list holds 1,000 strings of 10 KB each, yet `sys.getsizeof(the_list)` reports only a few kilobytes. Explain why, and how you would measure the real footprint.',
      answer: py`A list stores references (pointers) to its items, not the items themselves, and sys.getsizeof is shallow: it measures only the list object (header + array of references). The 10 MB of string data lives in 1,000 separate string objects. To measure everything, walk the references and add up getsizeof for each object once (tracking ids to avoid double counting shared objects), or measure allocations directly with tracemalloc. Exact numbers also depend on the platform (32- vs 64-bit) and the Python version.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'identity-report',
      title: 'Same object or just equal?',
      difficulty: 'intermediate',
      prompt: py`Write \`compare(a, b)\` that returns exactly one of three strings:

- \`"same object"\` if \`a\` and \`b\` are the very same object,
- \`"equal values"\` if they are different objects with equal values,
- \`"different"\` otherwise.

Check identity **first**. One test uses \`float("nan")\` — a value that is not even equal to itself — so think about what each check really asks.`,
      files: {
        'main.py': py`def compare(a, b):
    # TODO: return "same object", "equal values" or "different"
    return None


basket = ["apple"]
print(compare(basket, basket))
print(compare(basket, ["apple"]))
print(compare(basket, ["pear"]))
`,
      },
      hints: [
        'Identity is checked with is, value equality with ==.',
        'Order matters: test is before ==, so the same object always reports "same object" — even a NaN, which is never == to itself.',
        'if a is b: return "same object"\nif a == b: return "equal values"\nreturn "different"',
      ],
      solution: {
        explanation: py`\`a is b\` answers "same object?" without calling any method, so it must come first. Only then does \`a == b\` compare values (calling \`__eq__\`). NaN shows why the order matters: \`nan == nan\` is \`False\`, but a single NaN object is still identical to itself. Python's own containers use the same "identity first" shortcut, which is why \`[nan] == [nan]\` is \`True\` when both lists hold the same NaN object.`,
        files: {
          'main.py': py`def compare(a, b):
    if a is b:
        return "same object"
    if a == b:
        return "equal values"
    return "different"


basket = ["apple"]
print(compare(basket, basket))
print(compare(basket, ["apple"]))
print(compare(basket, ["pear"]))
`,
        },
      },
      tests: [
        { name: 'an alias is the same object', code: py`cart = [1, 2]
alias = cart
assert compare(cart, alias) == "same object"` },
        { name: 'an equal copy has equal values', code: py`cart = [1, 2]
assert compare(cart, list(cart)) == "equal values"` },
        { name: 'different values are different', code: py`assert compare([1], [2]) == "different"` },
        { name: 'one NaN object is the same object as itself', code: py`nan = float("nan")
assert compare(nan, nan) == "same object"` },
        { name: 'two NaN objects are different', code: py`assert compare(float("nan"), float("nan")) == "different"` },
      ],
    },
    {
      id: 'deep-size',
      title: 'A deep sys.getsizeof',
      difficulty: 'advanced',
      prompt: py`\`sys.getsizeof\` is shallow. Write \`deep_size(obj)\` that returns the total \`sys.getsizeof\` of \`obj\` **plus every object reachable through it**, following:

- items of \`list\`, \`tuple\`, \`set\` and \`frozenset\`,
- **keys and values** of \`dict\`.

Rules:

- count each object **once**, even if it is referenced several times (track the \`id()\`s you have already counted — safe here because every object stays alive during the call);
- don't loop forever on self-referencing containers;
- everything else (ints, strings, …) is a leaf: just its own \`getsizeof\`.

The tests compare against \`sys.getsizeof\` computed on the same interpreter, so you never need to know real byte counts.`,
      files: {
        'main.py': py`import sys


def deep_size(obj):
    # TODO: follow the references and count each object once
    return sys.getsizeof(obj)


orders = {"ada": ["tea", "cake"], "ben": ["tea"]}
print("shallow:", sys.getsizeof(orders))
print("deep:   ", deep_size(orders))
`,
      },
      hints: [
        'Keep a set of ids you have already counted, and a list (stack) of objects still to visit.',
        'Pop an object; if its id is in the set, skip it. Otherwise add its getsizeof, record the id, and push its children: list(obj) for list/tuple/set/frozenset, and both keys and values for dict.',
        'seen = set(); stack = [obj]; total = 0\nwhile stack:\n    item = stack.pop()\n    if id(item) in seen: continue\n    seen.add(id(item)); total += sys.getsizeof(item)\n    if isinstance(item, dict): stack.extend(item.keys()); stack.extend(item.values())\n    elif isinstance(item, (list, tuple, set, frozenset)): stack.extend(item)',
      ],
      solution: {
        explanation: py`An explicit stack visits every reachable object without recursion (so very deep nesting can't hit the recursion limit), and the \`seen\` set of ids guarantees each object is counted once — which also stops the self-referencing list from looping forever. Using ids is correct here only because \`obj\` keeps every reachable object alive for the whole call. This is still **simplified**: real tools (like the third-party \`pympler.asizeof\`) also follow instance \`__dict__\`s and \`__slots__\`, and skip shared objects such as interned strings and immortal small ints that you don't really "own".`,
        files: {
          'main.py': py`import sys


def deep_size(obj):
    seen = set()
    stack = [obj]
    total = 0
    while stack:
        item = stack.pop()
        if id(item) in seen:
            continue
        seen.add(id(item))
        total += sys.getsizeof(item)
        if isinstance(item, dict):
            stack.extend(item.keys())
            stack.extend(item.values())
        elif isinstance(item, (list, tuple, set, frozenset)):
            stack.extend(item)
    return total


orders = {"ada": ["tea", "cake"], "ben": ["tea"]}
print("shallow:", sys.getsizeof(orders))
print("deep:   ", deep_size(orders))
`,
        },
      },
      tests: [
        { name: 'a leaf is just its own size', code: py`import sys
word = "x" * 300
assert deep_size(word) == sys.getsizeof(word)` },
        { name: 'list items are included', code: py`import sys
items = ["a" * 100, "b" * 200]
assert deep_size(items) == sys.getsizeof(items) + sys.getsizeof(items[0]) + sys.getsizeof(items[1])` },
        { name: 'a shared object is counted once', code: py`import sys
s = "z" * 500
pair = [s, s]
assert deep_size(pair) == sys.getsizeof(pair) + sys.getsizeof(s)` },
        { name: 'dict keys and values are included', code: py`import sys
key = "k" * 50
inner = [1000, 2000]
d = {key: inner}
expected = sys.getsizeof(d) + sys.getsizeof(key) + sys.getsizeof(inner) + sys.getsizeof(inner[0]) + sys.getsizeof(inner[1])
assert deep_size(d) == expected` },
        { name: 'a self-referencing list does not loop forever', code: py`import sys
loop = []
loop.append(loop)
assert deep_size(loop) == sys.getsizeof(loop)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'object-model-identity-type-value',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Every Python object has an identity, a type and a value. What is each one, and which of them can change during the object’s life?',
      answer: 'Identity says which object it is (id(), compared with is) and never changes while the object lives. Type is its class (type(obj)), which decides the operations it supports, and is fixed. Value is what it holds (compared with ==); it can change only for mutable objects such as lists, dicts and most instances.',
      explanation: py`The language reference defines objects exactly this way. Assignment and argument passing only ever copy *references*, so identity is what names share. Mutation changes the value but keeps the identity; operations on immutable objects create new objects with new identities. (Assigning \`obj.__class__\` is an obscure, restricted exception to "the type is fixed".)`,
      code: { lang: 'python', code: py`playlist = ["intro"]
before = id(playlist)
playlist.append("outro")            # value changes...
print(id(playlist) == before)       # True: ...identity does not

count = 1
before = id(count)
count += 1                          # ints are immutable: a new object
print(id(count) == before)          # False` },
      whyAsked: 'It is the foundation for every question about aliasing, copying, hashing and is vs ==.',
      mistakes: ['Saying a variable "contains" the value', 'Claiming ints are mutable because x += 1 works', 'Mixing up identity and equality'],
      followUps: ['Why must dict keys be immutable (hashable)?', 'Can a tuple’s value change?', 'What does id() return in CPython vs PyPy?'],
      modelAnswer: 'Every object has three properties. Its identity says which object it is — id() shows it and the is operator compares it — and it never changes while the object exists. Its type is its class, returned by type(), which decides what you can do with it, and it is fixed as well. Its value is what it holds, compared with ==. Only mutable objects like lists and dicts can change their value in place; immutable ones like ints, strings and tuples produce a new object, with a new identity, whenever you "change" them. That is why appending to a list is visible through every alias, but count += 1 just moves the name to a new int.',
    },
    {
      id: 'object-model-id-reuse',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'In CPython, what do these two lines typically print, and why are they different?',
      code: { lang: 'python', code: py`print(id([]) == id([]))

a = []
b = []
print(id(a) == id(b))` },
      options: ['True, then True', 'False, then False', 'True, then False (typically)', 'False, then True'],
      correctOption: 2,
      answer: 'Typically True, then False. In the first line each empty list is freed as soon as id() returns, so the second list can be allocated at the same address and gets the same id. In the second case both lists are alive at once, so their ids must differ.',
      explanation: py`Ids are unique only among objects that are alive *at the same time*. The first comparison involves two temporaries with non-overlapping lifetimes; CPython frees the first immediately (reference count 0) and its allocator often hands the same memory block to the next list. That reuse is an implementation detail — on another interpreter the first line may print \`False\` — but the second line's \`False\` is guaranteed.`,
      whyAsked: 'It checks whether you know the precise guarantee behind id() and that object lifetime matters.',
      mistakes: ['Saying "ids are always unique, so it must print False"', 'Claiming the True result is guaranteed by the language'],
      followUps: ['Why is a cache keyed by id(obj) dangerous?', 'When is an object freed in CPython?', 'How would you compare identity safely?'],
      modelAnswer: 'Typically the first line prints True and the second prints False. The guarantee is only that two objects alive at the same time have different ids. In the first line, the first empty list is created, id() reads it, and then it is freed immediately because nothing refers to it any more; CPython then usually reuses that same memory for the second list, so the ids match. In the second case a and b keep both lists alive, so the ids must differ. The practical lesson is that ids are only meaningful while you hold a reference to the object.',
    },
    {
      id: 'object-model-type-of-type',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What is `type(type)`? Explain how `type` and `object` relate to each other and to an ordinary class.',
      answer: 'type(type) is type. There are two relationships: "instance of" (follow type()) and "subclass of" (follow __bases__). Every class, including object and type, is an instance of type (the default metaclass); every class, including type, is a subclass of object. object has no bases. The interpreter wires the type/object loop up in C at startup.',
      explanation: py`For \`class Dog: pass\`: \`type(Dog) is type\` (classes are created by their metaclass) and \`Dog.__bases__ == (object,)\`. For the two built-ins: \`type(object) is type\`, \`type.__bases__ == (object,)\`, \`object.__bases__ == ()\`. So \`isinstance(object, type)\` and \`isinstance(type, object)\` are both \`True\`, while \`issubclass(object, type)\` is \`False\`. Custom metaclasses subclass \`type\` to customise class creation (see [metaclasses](lesson:metaclasses)).`,
      code: { lang: 'python', code: py`class Dog:
    pass

print(type(Dog) is type, Dog.__bases__)       # True (<class 'object'>,)
print(type(object) is type, object.__bases__) # True ()
print(type(type) is type, type.__bases__)     # True (<class 'object'>,)` },
      whyAsked: 'It reveals whether you understand classes as runtime objects, which underlies metaclasses, decorators on classes and frameworks like Django or SQLAlchemy.',
      mistakes: ['Confusing the instance-of chain with inheritance', 'Saying type inherits from itself', 'Claiming the loop can be built in pure Python'],
      followUps: ['What is a metaclass and when would you write one?', 'What does type(name, bases, namespace) do?', 'How does __init_subclass__ reduce the need for metaclasses?'],
      modelAnswer: 'type(type) is type. I separate two relationships. "Instance of" is what type() returns: 42 is an instance of int, and int — like every class — is an instance of type, which is the default metaclass that builds classes. "Subclass of" is what __bases__ shows: every class inherits from object, and type is a class too, so it inherits from object. object itself has no bases, but it is a class, so its type is type. That little loop between type and object cannot be expressed in Python; the interpreter sets it up in C at startup, and it holds in every Python implementation.',
    },
    {
      id: 'object-model-id-cache-bug',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A memoisation helper caches results in a dict keyed by `id(arg)`. In production it occasionally returns the result for a *different* input. What is wrong, and how do you fix it?',
      code: { lang: 'python', code: py`_results = {}

def word_count(lines):
    key = id(lines)
    if key not in _results:
        _results[key] = sum(len(line.split()) for line in lines)
    return _results[key]` },
      answer: 'id() is only unique among living objects. The cache stores the id but not the object, so once the argument is freed a new object can be allocated at the same address, get the same id, and hit the stale entry. Cache by value (hashable arguments, functools.lru_cache), or keep a reference to the object (or use a weakref.WeakKeyDictionary that drops entries when objects die).',
      explanation: py`In CPython, freed memory is reused quickly, so short-lived arguments (temporary lists built per request) make collisions likely but unpredictable — the worst kind of bug. Storing \`(obj, result)\` keeps the object alive and makes ids safe but leaks memory; \`WeakKeyDictionary\` keys on the object itself, needs hashable, weak-referenceable objects, and cleans up automatically (see [memory management](lesson:memory-management)). Usually the cleanest fix is to make the input hashable (a tuple) and cache by value.`,
      whyAsked: 'Identity-based caching bugs are subtle production issues; the question tests precise knowledge of object lifetime.',
      mistakes: ['Blaming hash collisions', 'Fixing it by storing the object forever without noticing the memory leak', 'Assuming ids are unique for the whole program run'],
      followUps: ['Why can’t lists be used as WeakKeyDictionary keys?', 'How does functools.lru_cache build its keys?', 'Would this bug appear on PyPy?'],
      modelAnswer: 'The bug is that id() is only unique among objects that are alive at the same time. The cache remembers the id but not the object, so after the first argument is garbage-collected, CPython can allocate a new object at the same address with the same id, and the lookup returns the stale result for completely different data. I would cache by value instead — make the argument hashable, for example a tuple, and use functools.lru_cache — or, if identity really is the right key, use a WeakKeyDictionary so the entry disappears when the object dies. Keeping strong references to every argument would also fix correctness, but it turns the cache into a memory leak.',
    },
    {
      id: 'object-model-group-aliases',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `group_aliases(names)` that takes a dict mapping variable names to objects and returns the groups of names that refer to the **same object**: a list of lists, each inner list sorted, groups of size ≥ 2 only, and the outer list sorted. Objects may be unhashable (lists, dicts).',
      answer: 'Group names by id(obj) — which works for unhashable objects — then keep groups with two or more names, sort each group and sort the result. Using id() is safe because the input dict keeps every object alive during the call.',
      explanation: py`You can't use the objects themselves as dict keys (lists are unhashable, and equal-but-different objects would merge). \`id(obj)\` is exactly "which object", and it is reliable here because every object is referenced by \`names\` for the whole call. Equal lists that are different objects stay in separate groups.`,
      starter: { files: { 'main.py': py`def group_aliases(names):
    # TODO: group the names that refer to the same object
    return []


cart = ["tea"]
print(group_aliases({"cart": cart, "basket": cart, "other": ["tea"]}))
` } },
      tests: [
        { name: 'two names for one list form a group', code: py`cart = ["tea"]
assert group_aliases({"cart": cart, "basket": cart, "other": ["tea"]}) == [["basket", "cart"]]` },
        { name: 'equal but distinct objects are not grouped', code: py`assert group_aliases({"x": [1], "y": [1]}) == []` },
        { name: 'several groups come back sorted', code: py`a, b = {}, []
names = {"z1": b, "m": a, "z2": b, "c": a, "solo": []}
assert group_aliases(names) == [["c", "m"], ["z1", "z2"]]` },
      ],
      solution: { files: { 'main.py': py`def group_aliases(names):
    groups = {}
    for name, obj in names.items():
        groups.setdefault(id(obj), []).append(name)
    return sorted(sorted(group) for group in groups.values() if len(group) > 1)


cart = ["tea"]
print(group_aliases({"cart": cart, "basket": cart, "other": ["tea"]}))
` } },
      hints: ['You need a key that means "this exact object" and works for unhashable objects.', 'groups.setdefault(id(obj), []).append(name), then filter and sort.'],
      whyAsked: 'It tests whether you can use identity deliberately and know when id() is safe to use as a key.',
      mistakes: ['Using the objects as dict keys (TypeError for lists, and equal objects merge)', 'Comparing with == instead of is', 'Not explaining why id() is safe in this context'],
      followUps: ['When would id-based grouping give wrong results?', 'How would you find aliases inside nested data structures?', 'How do debuggers and the code tracer above draw shared objects?'],
      modelAnswer: 'I group names by id of the object, because id means "this exact object" and it works even for unhashable objects like lists, whereas using the objects themselves as keys would either fail or merge equal-but-different objects. I build a dict from id to a list of names with setdefault, keep only groups with two or more names, sort each group and then the outer list so the result is deterministic. Using id is safe here because the input dict holds a reference to every object for the whole call, so no id can be reused mid-way.',
    },
    {
      id: 'object-model-measure-memory',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A service keeps a dict of a million user records in memory. The process uses far more RAM than `sys.getsizeof(users)` suggests. How do you measure the real footprint and reduce it?',
      answer: 'getsizeof is shallow: it counts the dict’s hash table, not the record objects, their attribute dicts and strings. Measure with tracemalloc snapshots (or process RSS) and a deep-size tool, then shrink: __slots__ / dataclass(slots=True) or tuples instead of per-instance dicts, interning or de-duplicating repeated strings, compact numeric storage (array, NumPy), or moving the data out of process (a database, a cache server).',
      explanation: py`Each record is several objects: the instance, its \`__dict__\`, the key strings, the value objects. Per-instance dicts dominate when there are many small objects. Interning repeated values (country codes, statuses) shares one string object. Numbers in a list are one object each; \`array.array\` or NumPy store raw values. And sometimes the right answer is not to hold everything in memory at all — stream, paginate or use SQLite (see [SQL & sqlite3](lesson:sql-and-sqlite)).`,
      whyAsked: 'Memory blow-ups are a common production incident; the question checks you can measure before optimising and know the object-level causes.',
      mistakes: ['Trusting sys.getsizeof on the container', 'Optimising without measuring', 'Forgetting that sizes differ between 32- and 64-bit builds and Python versions'],
      followUps: ['How does __slots__ save memory, and what do you lose?', 'How would you find which line allocates the most memory?', 'When would you switch to a columnar or database-backed store?'],
      modelAnswer: 'First I would not trust sys.getsizeof on the dict, because it is shallow: it measures the dict’s own table of references, not the million record objects, their attribute dictionaries and all their strings. I would measure with tracemalloc snapshots to see which lines allocate the memory, and watch the process’s resident memory. Typical fixes are giving the record class __slots__ or using dataclass with slots=True so there is no per-instance dict, using tuples or NamedTuples, de-duplicating repeated strings with sys.intern, and storing numbers in array or NumPy instead of one object per value. If it is still too big, the data probably belongs in a database or should be streamed rather than held in memory.',
    },
    {
      id: 'object-model-interning',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'You parse a 5-million-row log file where the `status` column only ever holds a dozen distinct values. A colleague suggests `sys.intern` — and then comparing statuses with `is` "because it’s faster". What do you say?',
      answer: 'Interning is a good idea here: each repeated status becomes one shared string object, which saves memory and makes dict lookups slightly cheaper. But keep comparing with ==. CPython’s string equality already short-circuits when both sides are the same object, so == costs almost nothing extra, while is breaks the moment any non-interned string sneaks in.',
      explanation: py`\`sys.intern\` guarantees that equal interned strings are identical. Strings read from files are not interned automatically, so without it every row holds its own copy. Comparing with \`is\` couples correctness to an optimisation: one code path that forgets to intern (a test fixture, a new parser) silently produces wrong answers. \`==\` is correct in every case and the identity shortcut keeps it fast.`,
      whyAsked: 'It tests judgement: using an implementation-level optimisation without letting it leak into program logic.',
      mistakes: ['Saying is is always faster so it should be used', 'Claiming strings from files are interned automatically', 'Dismissing interning entirely when there are many duplicates'],
      followUps: ['Which strings does CPython intern automatically?', 'Would a dict mapping raw value to a canonical string work just as well?', 'How would you measure the memory saved?'],
      modelAnswer: 'Interning is a reasonable optimisation here: with millions of rows and only a dozen distinct statuses, sys.intern makes every repeated value share one string object, which cuts memory and keeps dictionary lookups cheap. But I would still compare with ==. CPython’s string comparison already checks identity first, so == on interned strings is essentially as fast as is, and it stays correct even if some string was not interned — a test fixture, a new code path. Using is would tie the program’s correctness to an optimisation, which is exactly the kind of bug that appears only in production.',
    },
  ],

  takeaways: [
    'Every value — ints, strings, None, functions, classes, modules — is an object with an identity, a type and a value.',
    'is compares identity, == compares values, type()/isinstance() look at the type; use is only for None, sentinels and other singletons.',
    'Identity is constant and unique only among living objects; a freed object’s id can be reused.',
    'Mutation changes an object’s value but not its identity; “changing” an immutable object always creates a new one.',
    'type(type) is type and every class inherits from object: keep “instance of” and “subclass of” apart.',
    'id() as an address, the small-int cache, string interning and immortal objects are CPython details — never build logic on them.',
    'sys.getsizeof is shallow and platform-specific (this playground is 32-bit WebAssembly); measure real memory with tracemalloc or a deep walk.',
  ],
}
