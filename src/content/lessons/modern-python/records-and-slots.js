// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SENSOR_LAB = py`import tracemalloc
from collections import namedtuple
from dataclasses import dataclass
from typing import NamedTuple, TypedDict

# One sensor reading, stored seven ways
ReadingNT = namedtuple("ReadingNT", ["sensor", "celsius", "minute"])


class Reading(NamedTuple):
    sensor: str
    celsius: float
    minute: int


@dataclass
class ReadingData:
    sensor: str
    celsius: float
    minute: int


@dataclass(frozen=True, slots=True)
class ReadingFrozen:
    sensor: str
    celsius: float
    minute: int


class ReadingDict(TypedDict):
    sensor: str
    celsius: float
    minute: int


class ReadingPlain:
    def __init__(self, sensor, celsius, minute):
        self.sensor = sensor
        self.celsius = celsius
        self.minute = minute


KINDS = {
    "tuple": lambda s, c, m: (s, c, m),
    "namedtuple": ReadingNT,
    "NamedTuple": Reading,
    "dataclass": ReadingData,
    "frozen+slots": ReadingFrozen,
    "TypedDict": lambda s, c, m: ReadingDict(sensor=s, celsius=c, minute=m),
    "plain class": ReadingPlain,
}


def can_hash(record):
    try:
        hash(record)
        return True
    except TypeError:
        return False


def bytes_per_record(make, n=2000):
    """Average memory of n records, measured live with tracemalloc."""
    keep = [None] * n                  # allocated BEFORE measuring starts
    tracemalloc.start()
    for i in range(n):
        keep[i] = make("kitchen", 21.5, 7)   # keep each record alive
    used, _peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return round(used / n)


print(f"{'kind':<13}{'hashable':<10}{'== tuple':<10}bytes/record")
for kind, make in KINDS.items():
    record = make("kitchen", 21.5, 7)
    same_as_tuple = record == ("kitchen", 21.5, 7)
    print(f"{kind:<13}{str(can_hash(record)):<10}{str(same_as_tuple):<10}{bytes_per_record(make)}")

reading = Reading("kitchen", 21.5, 7)
sensor, celsius, minute = reading          # NamedTuples unpack like tuples
warmer = reading._replace(celsius=23.0)    # "changing" = building a new record
print(reading.celsius, "->", warmer.celsius)
`

export default {
  id: 'records-and-slots',
  title: 'Lightweight records: NamedTuple, frozen data & __slots__',
  summary: 'Pick the right shape for a bundle of fields — tuple, namedtuple, NamedTuple, dataclass (frozen, slots), TypedDict or dict — by weighing names, immutability, hashability and memory you measure yourself.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['tuples-and-unpacking', 'dictionaries', 'classes-and-objects', 'dataclasses'],
  related: ['dataclasses', 'collections-module', 'attribute-access', 'typing-collections-and-unions', 'mutability-and-copying', 'special-methods', 'json-data', 'memory-management', 'profiling', 'enums', 'match-statement', 'sets'],
  tags: ['record', 'namedtuple', 'NamedTuple', 'typing.NamedTuple', 'dataclass', 'frozen', 'slots', '__slots__', 'TypedDict', 'dict', 'immutability', 'hashable', 'value object', 'memory', 'tracemalloc', '_replace', 'weakref_slot', 'struct'],
  apis: [
    { name: 'collections.namedtuple(typename, field_names, *, defaults=None, rename=False)', summary: 'Builds a tuple subclass whose items can also be read by name.' },
    { name: 'typing.NamedTuple', summary: 'Class syntax for a named tuple with type annotations, defaults, docstrings and methods.' },
    { name: 'somenamedtuple._replace(**changes)', summary: 'Returns a new named tuple with some fields replaced (the original is unchanged).' },
    { name: 'somenamedtuple._asdict() / ._fields / ._make(iterable)', summary: 'Convert to a dict, list the field names, build from any iterable.' },
    { name: '@dataclass(frozen=True, slots=True)', summary: 'Immutable, hashable dataclass whose instances store fields in fixed slots instead of a __dict__ (slots: 3.10+).' },
    { name: 'typing.TypedDict', summary: 'Describes the keys and value types of a plain dict for type checkers; does nothing at runtime.' },
    { name: '__slots__', summary: 'Class attribute listing the only instance attributes allowed; removes the per-instance __dict__.' },
    { name: 'tracemalloc.start() / get_traced_memory()', summary: 'Trace Python memory allocations and read (current, peak) bytes — the way to measure record sizes.' },
  ],
  docs: [
    { label: 'collections.namedtuple', url: 'https://docs.python.org/3/library/collections.html#collections.namedtuple' },
    { label: 'typing.NamedTuple', url: 'https://docs.python.org/3/library/typing.html#typing.NamedTuple' },
    { label: 'typing.TypedDict', url: 'https://docs.python.org/3/library/typing.html#typing.TypedDict' },
    { label: 'dataclasses — frozen and slots', url: 'https://docs.python.org/3/library/dataclasses.html' },
    { label: 'Data model — __slots__', url: 'https://docs.python.org/3/reference/datamodel.html#slots' },
    { label: 'Glossary — hashable', url: 'https://docs.python.org/3/glossary.html#term-hashable' },
    { label: 'tracemalloc — trace memory allocations', url: 'https://docs.python.org/3/library/tracemalloc.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **record** is a small bundle of named values that belong together: one sensor reading (\`sensor\`, \`celsius\`, \`minute\`), one price (\`amount\`, \`currency\`), one row of a spreadsheet. Records hold data; they usually have little or no behaviour.`,
    py`Python gives you at least six ways to build one, and they are *not* interchangeable:`,
    py`- a plain **tuple** — \`("kitchen", 21.5, 7)\`;
- a **named tuple** — \`collections.namedtuple\` or its typed cousin \`typing.NamedTuple\`: a tuple whose items also have names;
- a **dataclass** — a normal class with generated methods ([dataclasses](lesson:dataclasses)), optionally \`frozen=True\` and \`slots=True\`;
- a plain **dict**, optionally described by a **TypedDict** for type checkers;
- a hand-written class, optionally with **\`__slots__\`**.`,
    py`This lesson is about *choosing*. Four questions decide almost every case: Do I want to access fields by name? Must the record be unchangeable (**immutable**)? Must it work as a dict key or set member (**hashable**)? Will there be so many of them that **memory** matters? You'll answer the last one with real measurements, not folklore.`,
  ],
  why: [
    py`The wrong record type causes real bugs. A plain dict accepts a typo like \`reading["celcius"] = 22\` without complaint. A mutable object used as a cache key can change after it was stored. A named tuple compares equal to any tuple with the same values, so \`Point(1, 2) == Size(1, 2)\` is \`True\`.`,
    py`The right record type documents intent. A reader who sees \`@dataclass(frozen=True)\` knows "this is a value, it never changes". A \`TypedDict\` says "this is JSON-shaped data and here are its keys". A \`NamedTuple\` says "this unpacks like a tuple".`,
    py`And at scale it matters for memory: a service holding millions of small objects can use far less RAM with a leaner record type. How much less depends on the interpreter — so you'll learn to measure it with \`tracemalloc\` instead of trusting numbers from old blog posts.`,
  ],
  eli15: [
    py`Think of filling in information about something — say, one temperature reading.`,
    py`A **tuple** is like scribbling \`kitchen, 21.5, 7\` on a sticky note. Short, but you must *remember* that the second thing is the temperature. A **named tuple** is the same note with little labels printed above each value, and it's written in pen: you can't change it, only write a new one.`,
    py`A **dataclass** is a proper form with labelled boxes, written in pencil — you can rub out and correct a box. Make it **frozen** and it's written in pen again.`,
    py`A **dict** is a ring binder: you can add any page with any title, even a misspelled one, and nobody stops you. A **TypedDict** is a checklist a teacher uses to check your binder later — the binder itself still accepts anything.`,
    py`**Slots** are like a lunchbox with exactly three moulded compartments: it's smaller than a bag, but nothing extra fits in.`,
  ],
  analogy: {
    title: 'Forms, sticky notes and lunchboxes',
    body: [
      py`An office handles the same information in different containers. Quick notes go on sticky notes; official records go on printed forms; some forms are filled in pencil so they can be corrected, others in pen so nobody can tamper with them; a filing cabinet with a fixed number of drawers takes less space than an open shelf where people can add whatever they like.`,
      py`Each container trades flexibility for safety or space. Python's record types make exactly the same trades.`,
    ],
    mapping: [
      ['sticky note: kitchen, 21.5, 7', 'plain tuple — values in order, no labels'],
      ['printed form filled in pen', 'NamedTuple / frozen dataclass — labelled and unchangeable'],
      ['printed form filled in pencil', 'regular @dataclass — labelled and editable'],
      ['writing a corrected copy of a pen form', '_replace() / dataclasses.replace() — a new record, the old one untouched'],
      ['ring binder: add any page with any title', 'plain dict — any keys, typos included'],
      ['the teacher\'s checklist for the binder', 'TypedDict — checked by tools, not at runtime'],
      ['lunchbox with fixed compartments', '__slots__ — fixed attributes, no room for extras, smaller'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A NamedTuple is a tuple with names',
    props: {
      code: py`from typing import NamedTuple

class Point(NamedTuple):
    x: int
    y: int

start = Point(1, 2)
x, y = start
moved = start._replace(x=5)
print(start, moved)
print(start == (1, 2))
visited = {start, moved, Point(1, 2)}
print(len(visited))
`,
      notes: {
        3: 'The class statement builds a **tuple subclass**. Each annotated name becomes a field, in order.',
        7: '`Point(1, 2)` creates one immutable object holding two items, readable as `start.x` or `start[0]`.',
        8: 'Because it *is* a tuple, it unpacks like one.',
        9: '`_replace` never modifies `start` — it builds and returns a **new** Point.',
        11: 'Named tuples compare like plain tuples: same values in the same order means equal.',
        12: 'Immutable and made of hashable values, so it can go in a set. The duplicate `Point(1, 2)` collapses into `start`.',
      },
    },
    alt: 'A step-by-step trace. A Point class is defined as a NamedTuple with x and y. start is Point(1, 2); unpacking gives x = 1 and y = 2. _replace creates a separate object moved = Point(5, 2) while start is unchanged. The program prints both points, then True because start equals the plain tuple (1, 2), then 2 because the set holds start and moved, and the second Point(1, 2) is a duplicate.',
    caption: py`Watch \`_replace\` produce a second object instead of changing the first. That is how you "edit" any immutable record.`,
  },
  syntax: [
    py`#### Plain tuple and collections.namedtuple`,
    { code: py`from collections import namedtuple

reading = ("kitchen", 21.5, 7)          # plain tuple: position only
print(reading[1])                        # 21.5 — but what was index 1 again?

Reading = namedtuple("Reading", ["sensor", "celsius", "minute"])
r = Reading("kitchen", 21.5, 7)
print(r.celsius, r[1])                   # 21.5 21.5 — by name or position

Pixel = namedtuple("Pixel", "x y colour", defaults=["black"])  # defaults fill from the right
print(Pixel(3, 4))                       # Pixel(x=3, y=4, colour='black')`, lang: 'python', title: 'tuples with and without names' },
    py`#### typing.NamedTuple — the class syntax`,
    { code: py`from typing import NamedTuple

class Reading(NamedTuple):
    """One temperature reading."""
    sensor: str
    celsius: float
    minute: int = 0                  # fields with defaults come last

    def fahrenheit(self) -> float:   # methods are allowed
        return self.celsius * 9 / 5 + 32

r = Reading("kitchen", 21.5)
print(r, r.fahrenheit())
print(r._fields)                      # ('sensor', 'celsius', 'minute')
print(r._asdict())                    # {'sensor': 'kitchen', 'celsius': 21.5, 'minute': 0}
print(r._replace(minute=8))           # a NEW Reading
print(Reading._make(["hall", 19.0, 3]))   # build from any iterable`, lang: 'python', title: 'typing.NamedTuple' },
    py`The leading underscore on \`_replace\`, \`_asdict\`, \`_fields\` and \`_make\` is there to avoid clashing with *your* field names — they are public, documented API, not private. (That's also why field names themselves may not start with an underscore.)`,
    py`#### Frozen and slotted dataclasses`,
    { code: py`from dataclasses import dataclass, replace

@dataclass(frozen=True, slots=True)     # slots=True needs 3.10+
class Money:
    amount_pence: int
    currency: str = "GBP"

price = Money(450)
print(price)                            # Money(amount_pence=450, currency='GBP')
print({price: "coffee"}[Money(450)])    # hashable: equal values find the same key
cheaper = replace(price, amount_pence=400)   # a new object
print(price.amount_pence, cheaper.amount_pence)`, lang: 'python', title: 'value objects with @dataclass' },
    py`#### TypedDict — a type-checker description of a dict`,
    { code: py`from typing import NotRequired, TypedDict

class ReadingJSON(TypedDict):
    sensor: str
    celsius: float
    note: NotRequired[str]        # may be missing (3.11+)

payload: ReadingJSON = {"sensor": "kitchen", "celsius": 21.5}
print(type(payload))              # <class 'dict'> — it IS a plain dict`, lang: 'python', title: 'TypedDict' },
    py`#### \`__slots__\` on a hand-written class`,
    { code: py`class Pixel:
    __slots__ = ("x", "y", "colour")     # the only attributes instances may have

    def __init__(self, x, y, colour):
        self.x = x
        self.y = y
        self.colour = colour

p = Pixel(1, 2, "red")
print(p.colour)
# p.alpha = 0.5  -> AttributeError: 'Pixel' object has no attribute 'alpha'
#                   and no __dict__ for setting new attributes`, lang: 'python', title: '__slots__' },
    { callout: 'version', title: 'Which Python?', text: py`\`collections.namedtuple\` is ancient; its \`defaults=\` parameter arrived in **3.7**, like \`@dataclass\`. \`typing.TypedDict\` is **3.8+**; \`Required\`/\`NotRequired\` are **3.11+** and \`ReadOnly\` is **3.13+**. \`@dataclass(slots=True)\` is **3.10+** and \`weakref_slot=True\` **3.11+**. \`copy.replace()\` (works on named tuples and dataclasses alike) is **3.13+**.` },
  ],
  walkthrough: {
    title: 'Reading the sensor lab',
    lang: 'python',
    code: SENSOR_LAB,
    intro: py`This is the program in the playground below — one sensor reading stored seven ways, compared side by side. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [7, 7], text: py`\`namedtuple()\` is a *function* that builds and returns a new class. The first argument is the class name used in its repr; the list gives the field names in order.` },
      { lines: [10, 13], text: py`\`typing.NamedTuple\` builds the same kind of tuple subclass, but with class syntax and type annotations. Annotations are documentation for tools; they are not checked at runtime.` },
      { lines: [16, 20], text: py`A regular dataclass: a normal mutable class whose \`__init__\`, \`__repr__\` and \`__eq__\` are generated. Because it defines \`__eq__\` without being frozen, Python sets its \`__hash__\` to \`None\` — instances are **unhashable**.` },
      { lines: [23, 27], text: py`\`frozen=True\` blocks assignment and makes a hash from the fields; \`slots=True\` replaces the per-instance \`__dict__\` with fixed storage for exactly these three fields.` },
      { lines: [30, 33], text: py`A TypedDict class only *describes* a dict. Calling \`ReadingDict(...)\` simply returns an ordinary \`dict\`.` },
      { lines: [36, 40], text: py`A hand-written class for comparison. Without \`__eq__\` it compares and hashes by **identity** — hashable, but two equal-looking readings are different keys.` },
      { lines: [43, 51], text: py`A dict of *factories*: each value is something you can call with \`(sensor, celsius, minute)\` to make one record. Classes are callable, so they fit right in next to the lambdas.` },
      { lines: [62, 70], text: py`The memory measurement. The list that keeps records alive is created **before** tracing starts, and every record is stored in it — otherwise each record would be freed immediately and you'd measure almost nothing. The same field values are reused, so only the record containers themselves are counted.` },
      { lines: [73, 77], text: py`One row per kind: is it hashable, does it equal a plain tuple, and how many bytes does one record cost *in this interpreter*.` },
      { lines: [79, 82], text: py`NamedTuples unpack like tuples, and \`_replace\` returns a new record with one field changed — \`reading\` itself still says \`21.5\`.` },
    ],
  },
  playground: {
    title: 'Sensor lab: one reading, seven record types',
    objective: 'Run it, read the table, then change the record types and watch hashability, equality and memory change.',
    files: { 'main.py': SENSOR_LAB },
    expected: py`A table with one row per record type, then \`21.5 -> 23.0\`. The *hashable* and *== tuple* columns are the same on every Python:

\`\`\`text
kind         hashable  == tuple  bytes/record
tuple        True      True      …
namedtuple   True      True      …
NamedTuple   True      True      …
dataclass    False     False     …
frozen+slots True      False     …
TypedDict    False     False     …
plain class  True      False     …
21.5 -> 23.0
\`\`\`

The **bytes/record** numbers are measured live in your browser (CPython 3.14 compiled to 32-bit WebAssembly). Expect different numbers on a 64-bit desktop Python — compare the *relative* sizes, never copy the absolute ones.`,
    experiments: [
      {
        id: 'freeze-it',
        task: py`The \`dataclass\` row says *hashable: False*. Make \`ReadingData\` hashable so readings can be stored in a set — without writing \`__hash__\` yourself.`,
        hint: py`Change \`@dataclass\` to \`@dataclass(frozen=True)\` on line 16.`,
        tests: [
          { name: 'ReadingData can be hashed', code: py`r = ReadingData("kitchen", 21.5, 7)
try:
    hash(r)
except TypeError:
    raise AssertionError('ReadingData is still unhashable: freeze it with @dataclass(frozen=True)')` },
          { name: 'equal readings collapse in a set', code: py`assert len({ReadingData("a", 1.0, 1), ReadingData("a", 1.0, 1)}) == 1` },
        ],
        explain: py`A dataclass generates \`__eq__\`. Python's rule is that equal objects must have equal hashes, and a hash must never change while the object sits in a set — impossible to promise for a mutable object, so \`eq=True\` alone sets \`__hash__ = None\`. With \`frozen=True\` the fields can't change, so the dataclass generates a \`__hash__\` built from them.`,
      },
      {
        id: 'slot-the-plain-class',
        task: py`Add \`__slots__ = ("sensor", "celsius", "minute")\` to \`ReadingPlain\` and run again. Compare its bytes/record with before, and check that a typo such as \`ReadingPlain("k", 1.0, 1).celcius = 3\` now raises an error.`,
        hint: py`Put the \`__slots__\` line directly under \`class ReadingPlain:\`, above \`__init__\`.`,
        tests: [
          { name: 'instances have no __dict__', code: py`assert not hasattr(ReadingPlain("k", 1.0, 1), "__dict__"), 'Add __slots__ to ReadingPlain'` },
          { name: 'typos raise AttributeError', code: py`with raises(AttributeError):
    ReadingPlain("k", 1.0, 1).celcius = 3` },
        ],
        explain: py`With \`__slots__\` each instance has room for exactly three references and no \`__dict__\`. That usually saves memory per instance (your table shows how much *here*), and it turns attribute typos into immediate \`AttributeError\`s instead of silently creating new attributes.`,
      },
      {
        id: 'add-a-field',
        task: py`Add a field \`unit: str = "C"\` (with that default) at the end of the \`Reading\` NamedTuple. Run it: something **breaks**. Fix the broken line so the program finishes again.`,
        hint: py`Line 80 unpacks a Reading into three names. A Reading now has four items, so add a fourth name (for example \`unit\`), or stop unpacking and use \`reading.sensor\` etc.`,
        tests: [
          { name: 'Reading has a unit field defaulting to "C"', code: py`assert Reading("kitchen", 21.5, 7).unit == "C"` },
          { name: 'the unit can be given explicitly', code: py`assert Reading("porch", 70.0, 1, "F").unit == "F"` },
          { name: 'the program runs to the end', code: py`assert "21.5 -> 23.0" in output` },
        ],
        explain: py`Adding a field to a named tuple changes its *length*, so every caller that unpacks it positionally breaks with \`ValueError: too many values to unpack (expected 3)\`. That's the hidden cost of tuple behaviour: callers come to depend on the order and count of fields. Dataclasses don't unpack, so adding a defaulted field to one rarely breaks callers.`,
      },
      {
        id: 'trust-the-typeddict',
        task: py`At the end, create \`bad = ReadingDict(sensor="attic", celsius="hot", minute=3)\` and print it. Before running: will Python reject \`"hot"\` as a celsius value?`,
        tests: [
          { name: 'bad exists and kept the wrong value', code: py`assert ns.get('bad') == {"sensor": "attic", "celsius": "hot", "minute": 3}, 'Create bad = ReadingDict(sensor="attic", celsius="hot", minute=3)'` },
        ],
        explain: py`No error at all. A TypedDict is a plain \`dict\` at runtime — the annotations are read only by type checkers such as mypy or pyright, which would flag this line *before* the program runs. If data comes from outside (JSON, a form, a file), you still need runtime validation — see [input validation](lesson:input-validation).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Choosing a record type',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'start', label: 'A bundle of fields', note: 'what do you need?', x: 380, y: 40, tone: 'ink' },
        { id: 'json', label: 'dict / TypedDict', note: 'JSON in & out, dynamic keys', x: 110, y: 170, tone: 'kraft' },
        { id: 'tuple', label: 'NamedTuple', note: 'unpacks like a tuple', x: 300, y: 170, tone: 'yellow' },
        { id: 'dc', label: '@dataclass', note: 'mutable domain object', x: 480, y: 170, tone: 'blue' },
        { id: 'frozen', label: 'frozen=True', note: 'value object, dict key', x: 660, y: 170, tone: 'blue' },
        { id: 'slots', label: 'slots=True / __slots__', note: 'many instances: measure!', x: 570, y: 290, tone: 'red' },
      ],
      edges: [
        { from: 'start', to: 'json', label: 'shape from outside' },
        { from: 'start', to: 'tuple', label: 'positional' },
        { from: 'start', to: 'dc', label: 'behaviour' },
        { from: 'dc', to: 'frozen', label: 'must not change' },
        { from: 'dc', to: 'slots', label: 'millions of them', dashed: true },
        { from: 'frozen', to: 'slots', dashed: true },
      ],
      steps: [
        { focus: ['start'], text: py`Start from what the code *needs*, not from habit. Most choices come down to four questions: names, immutability, hashability and memory.` },
        { focus: ['json'], edges: ['start->json'], text: py`Data that arrives as JSON and leaves as JSON (an API payload, a config file) can stay a **dict**. Describe its keys with a **TypedDict** so type checkers catch typos — but validate it at runtime yourself.` },
        { focus: ['tuple'], edges: ['start->tuple'], text: py`A function returning several values, a CSV row, a coordinate — things that are naturally *ordered* and should unpack: **NamedTuple**. Remember it also equals any plain tuple with the same values.` },
        { focus: ['dc'], edges: ['start->dc'], text: py`An object with behaviour (methods, validation in \`__post_init__\`, defaults, inheritance) that your program updates: a regular **dataclass**.` },
        { focus: ['frozen'], edges: ['dc->frozen'], text: py`A *value* — money, a date range, a cache key — that must never change after creation and should work in sets and as dict keys: **frozen dataclass**. "Changing" it means \`replace()\`.` },
        { focus: ['slots'], edges: ['dc->slots', 'frozen->slots'], text: py`Holding hundreds of thousands of instances? Add **slots** — but measure before and after with \`tracemalloc\`. Slots also forbid new attributes and need care with inheritance.` },
      ],
    },
    alt: 'A decision diagram. From "a bundle of fields", an arrow labelled "shape from outside" leads to dict / TypedDict, "positional" leads to NamedTuple, and "behaviour" leads to @dataclass. From @dataclass, "must not change" leads to frozen=True, and dashed arrows from both dataclass boxes labelled "millions of them" lead to slots=True / __slots__, with the note "measure!".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`**Hashable** means "has a hash value that never changes during its lifetime, and equal objects have equal hashes". Dicts and sets use the hash to jump straight to the right bucket instead of searching — see [sets](lesson:sets) and [dictionaries](lesson:dictionaries). That's why only things that can't change are safe as keys.`,
      py`A tuple is hashable only if **everything inside it** is hashable: \`("kitchen", 21.5)\` is, \`("kitchen", [21.5])\` is not. The same rule applies to named tuples and frozen dataclasses — they hash their fields.`,
      { code: py`print(hash(("kitchen", 21.5)) == hash(("kitchen", 21.5)))   # True
try:
    hash(("kitchen", [21.5]))
except TypeError as err:
    print(err)                                                # unhashable type: 'list'`, lang: 'python', title: 'hashable all the way down' },
      py`**Immutable is shallow.** A frozen record stops you from *re-binding* its fields (\`order.items = []\`), but if a field holds a list, the list itself can still change (\`order.items.append(...)\`). Store tuples or frozensets inside records you mean to freeze — see [mutability & copying](lesson:mutability-and-copying).`,
    ],
    technical: [
      py`**Named tuples are real tuples.** \`namedtuple()\` generates a subclass of \`tuple\` with \`__slots__ = ()\` (so no per-instance \`__dict__\`), a \`__new__\` that takes the fields, and a read-only property for each field name that simply returns \`self[i]\`. Every record costs exactly what a plain tuple of the same length costs; the names live once, on the class. \`typing.NamedTuple\` produces the same kind of class from class syntax.`,
      py`Because they are tuples, they inherit *everything* tuples do: \`len()\`, indexing, iteration, \`+\`, ordering comparisons and equality with any other tuple. That's convenient (they sort lexicographically for free) and occasionally dangerous (\`Point(1, 2) == Size(1, 2)\`).`,
      py`**\`__slots__\` changes the instance layout.** When a class with \`__slots__\` is *created*, Python reserves a fixed array of references in every instance — one per name — and puts a small **member descriptor** on the class for each slot (\`type(Pixel.__dict__["x"])\` is \`member_descriptor\`). \`p.x\` asks that descriptor, which reads the right position directly. No \`__dict__\` is created, unless a base class without \`__slots__\` already provides one — see [descriptors](lesson:descriptors) and [attribute access](lesson:attribute-access).`,
      py`Since slots are fixed at class creation, \`@dataclass(slots=True)\` cannot just add them to your class: it builds and returns a **new class** with the same fields. \`frozen=True\` generates \`__setattr__\`/\`__delattr__\` that raise \`FrozenInstanceError\` (a subclass of \`AttributeError\`) and a \`__hash__\` that hashes the tuple of fields; the generated \`__init__\` sets fields with \`object.__setattr__\` to get past its own lock.`,
      py`**TypedDict is erased at runtime.** \`ReadingDict(sensor=…)\` returns a plain \`dict\`; the class keeps \`__annotations__\`, \`__required_keys__\` and \`__optional_keys__\` for tools, and \`isinstance(x, ReadingDict)\` raises \`TypeError\` because there is nothing to check against.`,
      { callout: 'note', title: 'CPython detail: ordinary instances got cheaper', text: py`Since CPython 3.3 instances of one class can share the key table of their \`__dict__\` (PEP 412), and CPython 3.11 creates instance dicts lazily. So the gap between a plain instance and a slotted one is smaller than older articles suggest — and it differs between 32-bit and 64-bit builds and between versions. Other implementations (PyPy, for example) lay out objects completely differently. Measure in your own runtime; never quote a fixed byte count.` },
    ],
    production: [
      py`**Measure memory with \`tracemalloc\`, not \`sys.getsizeof\`.** \`getsizeof\` is shallow: it doesn't follow references, and for a plain instance it doesn't include the attribute storage. Snapshot \`tracemalloc.get_traced_memory()\` before and after building *many* records (and keep them alive in a list), then divide. The playground does exactly that; [profiling](lesson:profiling) goes further with snapshots and diffs.`,
      py`**Edges vs core.** A common, healthy layout: dicts (described by TypedDicts) at the edges where JSON comes in and goes out, validated on entry; frozen dataclasses or named tuples inside the program where values move around; regular dataclasses for objects with a lifecycle. Converting at the boundary (\`Reading(**payload)\`, \`dataclasses.asdict(reading)\`, \`reading._asdict()\`) keeps the core typo-proof.`,
      py`**Evolving a record type.** Adding a defaulted field to a dataclass is usually backwards compatible. Adding one to a named tuple can break every caller that unpacks or indexes it. Public APIs that return named tuples (\`os.stat()\`, \`urllib.parse.urlsplit()\`) therefore tend to add new data as attributes that are *not* part of the tuple. If you only wanted names, not tuple behaviour, prefer a frozen dataclass.`,
      py`**Slots and libraries.** Slotted classes can't use \`functools.cached_property\` (it stores results in \`__dict__\`), can't be weakly referenced unless \`"__weakref__"\` is a slot (\`@dataclass(slots=True, weakref_slot=True)\`, 3.11+), and every class in an inheritance chain needs its own \`__slots__\` or the savings disappear. Two base classes that both define non-empty slots can't be combined (\`TypeError: multiple bases have instance lay-out conflict\`).`,
    ],
  },
  mistakes: [
    {
      title: 'Thinking frozen means deeply immutable',
      wrong: { code: py`from dataclasses import dataclass

@dataclass(frozen=True)
class Order:
    order_id: int
    items: list

order = Order(1, ["tea"])
order.items.append("cake")     # allowed! the list is mutable
print(order)                   # Order(order_id=1, items=['tea', 'cake'])`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass

@dataclass(frozen=True)
class Order:
    order_id: int
    items: tuple[str, ...]

order = Order(1, ("tea",))
print(hash(order) == hash(Order(1, ("tea",))))   # True: fully hashable`, lang: 'python' },
      explanation: py`\`frozen=True\` blocks assigning to fields, not mutating the objects they refer to. A list field also makes the record unhashable (\`TypeError: unhashable type: 'list'\`). Store tuples or frozensets inside value objects.`,
    },
    {
      title: 'Comparing named tuples of different kinds',
      wrong: { code: py`from typing import NamedTuple

class Point(NamedTuple):
    x: int
    y: int

class Size(NamedTuple):
    width: int
    height: int

print(Point(1, 2) == Size(1, 2))   # True — tuples compare by value only`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: int
    y: int

@dataclass(frozen=True)
class Size:
    width: int
    height: int

print(Point(1, 2) == Size(1, 2))   # False — different classes`, lang: 'python' },
      explanation: py`Named tuples inherit tuple equality, which ignores the class and the field names. If two record kinds must never be confused, use dataclasses: their \`__eq__\` returns \`NotImplemented\` for other classes, so the comparison is \`False\`.`,
    },
    {
      title: 'Forgetting __slots__ in a subclass',
      wrong: { code: py`class Event:
    __slots__ = ("timestamp",)

class Click(Event):            # no __slots__ here
    def __init__(self, timestamp, button):
        self.timestamp = timestamp
        self.button = button   # silently stored in a new __dict__

print(hasattr(Click(1, "left"), "__dict__"))   # True — savings gone`, lang: 'python' },
      right: { code: py`class Event:
    __slots__ = ("timestamp",)

class Click(Event):
    __slots__ = ("button",)    # only the NEW names
    def __init__(self, timestamp, button):
        self.timestamp = timestamp
        self.button = button

print(hasattr(Click(1, "left"), "__dict__"))   # False`, lang: 'python' },
      explanation: py`A subclass without \`__slots__\` gets a \`__dict__\` back, so instances are no smaller and typos are accepted again. Each subclass lists only the names it adds; repeating a parent's slot wastes space.`,
    },
    {
      title: 'Giving a slot a default with a class attribute',
      wrong: { code: py`class Pixel:
    __slots__ = ("x", "y", "colour")
    colour = "black"     # ValueError: 'colour' in __slots__ conflicts with class variable`, lang: 'python', static: true },
      right: { code: py`class Pixel:
    __slots__ = ("x", "y", "colour")

    def __init__(self, x, y, colour="black"):
        self.x = x
        self.y = y
        self.colour = colour`, lang: 'python' },
      explanation: py`Each slot is a descriptor stored on the class under that name, so a class attribute with the same name would collide. Put defaults in \`__init__\` — or use \`@dataclass(slots=True)\`, which handles field defaults for you.`,
    },
    {
      title: 'Expecting TypedDict to check anything at runtime',
      wrong: { code: py`from typing import TypedDict

class User(TypedDict):
    name: str
    age: int

def load(payload: dict) -> User:
    return User(**payload)         # no checks at all

user = load({"name": "Ada", "age": "thirty-six"})
print(user["age"] + 1)             # TypeError much later`, lang: 'python', static: true },
      right: { code: py`from typing import TypedDict

class User(TypedDict):
    name: str
    age: int

def load(payload: dict) -> User:
    name, age = payload["name"], payload["age"]
    if not isinstance(name, str) or not isinstance(age, int):
        raise ValueError(f"bad user payload: {payload!r}")
    return User(name=name, age=age)

print(load({"name": "Ada", "age": 36}))`, lang: 'python' },
      explanation: py`TypedDict is a promise to type checkers, not a validator. For untrusted data, check types yourself (or use a validation library such as pydantic) at the boundary, then hand the checked data to the rest of the program.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: unhashable type: 'ReadingData'`,
      cause: py`A regular \`@dataclass\` (or any class defining \`__eq__\` without \`__hash__\`) was used as a dict key or put in a set.`,
      fix: py`If the object really is a value that never changes, use \`@dataclass(frozen=True)\` (or a NamedTuple). If it must stay mutable, key the dict by an immutable id field instead (\`by_id[reading.sensor]\`).`,
    },
    {
      symptom: py`AttributeError: can't set attribute`,
      cause: py`Assigning to a field of a named tuple: \`reading.celsius = 22\`. Named tuples are immutable.`,
      fix: py`Build a new record: \`reading = reading._replace(celsius=22)\`. If the object genuinely needs to change in place, use a regular dataclass instead.`,
    },
    {
      symptom: py`dataclasses.FrozenInstanceError: cannot assign to field 'celsius'`,
      cause: py`Assigning to a field of a \`frozen=True\` dataclass, often inside a method or \`__post_init__\`.`,
      fix: py`Use \`dataclasses.replace(obj, celsius=22)\` (or \`copy.replace\`, 3.13+). Inside \`__post_init__\`, \`object.__setattr__(self, "name", value)\` is the documented escape hatch for derived fields.`,
    },
    {
      symptom: py`AttributeError: 'Pixel' object has no attribute 'alpha' and no __dict__ for setting new attributes`,
      cause: py`The class uses \`__slots__\` and the name isn't listed — often a typo, sometimes a library (or your own code) trying to attach extra data.`,
      fix: py`Fix the typo, or add the name to \`__slots__\`. If arbitrary attributes are genuinely needed, slots are the wrong tool for that class.`,
    },
    {
      symptom: py`TypeError: TypedDict does not support instance and class checks`,
      cause: py`Calling \`isinstance(data, MyTypedDict)\`. At runtime there is no TypedDict type, only \`dict\`.`,
      fix: py`Check \`isinstance(data, dict)\` and validate the required keys and value types yourself.`,
    },
  ],
  bestPractices: [
    'Choose the record type from what the code needs — names, immutability, hashability, memory — not from habit.',
    'Use frozen dataclasses for values (money, coordinates, keys); make every field immutable too, so the record is really hashable.',
    'Use NamedTuple when tuple behaviour (unpacking, ordering, positional access) is a feature; otherwise prefer a frozen dataclass.',
    'Keep JSON-shaped data as dicts described by TypedDict at the edges, validate it on entry, and convert it to records inside.',
    '"Change" immutable records with _replace(), dataclasses.replace() or copy.replace() (3.13+).',
    'Add slots only where there are many instances, list them in every subclass, and confirm the saving with tracemalloc.',
    'Never hard-code object sizes in code, tests or docs: they differ between versions, builds and implementations.',
  ],
  whenToUse: {
    use: [
      'NamedTuple: small, fixed, ordered records that should unpack, sort and print nicely.',
      'Frozen dataclass: value objects, dict keys, shared configuration.',
      'Regular dataclass: domain objects that change over their lifetime.',
      'TypedDict: dicts that cross a JSON boundary but deserve type checking.',
      '__slots__ / slots=True: classes with very many instances (after measuring).',
    ],
    avoid: [
      'Plain tuples once there are more than two or three fields — readers will forget what [3] means.',
      'NamedTuple for records that will grow new fields, or that must never equal plain tuples.',
      'Bare dicts deep inside business logic, where key typos fail silently.',
      'Slots on classes that need dynamic attributes, cached_property or easy multiple inheritance.',
      'Treating TypedDict as validation of untrusted data.',
    ],
  },
  comparison: {
    title: 'Record types side by side',
    headers: ['', 'tuple', 'namedtuple / NamedTuple', '@dataclass', '@dataclass(frozen=True, slots=True)', 'dict / TypedDict'],
    rows: [
      ['read a field', 'by position: r[1]', 'by name or position: r.celsius, r[1]', 'by name: r.celsius', 'by name: r.celsius', 'by key: r["celsius"]'],
      ['change a field', 'no', 'no — copy with _replace()', 'yes: r.celsius = 22', 'no (FrozenInstanceError) — copy with replace()', 'yes, and any new key too'],
      ['hashable', 'yes, if every item is', 'yes, if every field is', 'no (eq=True sets __hash__ to None)', 'yes, if every field is', 'no'],
      ['equals a plain tuple with the same values', 'yes', 'yes (often a surprise)', 'no', 'no', 'no'],
      ['unpacks: a, b, c = r', 'yes', 'yes', 'no', 'no', 'only its keys'],
      ['defaults, methods, validation', 'no', 'defaults and methods; no custom __init__', 'all, plus __post_init__', 'all, plus __post_init__', 'no methods; NotRequired keys'],
      ['typo like r.celcius = 1', 'n/a', 'AttributeError', 'silently adds an attribute', 'error', 'silently adds a key'],
      ['runtime type checks', 'none', 'none', 'none', 'none', 'none (TypedDict is for tools)'],
      ['memory per record (measure!)', 'lean', 'same as a tuple', 'object + attribute storage', 'lean: fixed slots', 'largest: a hash table each'],
    ],
    note: py`No record type validates field types at runtime — annotations are for readers and type checkers. The memory row is qualitative: run the playground to see real numbers for *this* interpreter.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'records-and-slots-q1',
      type: 'mcq',
      prompt: 'Which record is hashable (usable as a dict key) **without any extra options**?',
      options: [
        { text: 'An instance of a regular @dataclass', why: 'A dataclass generates __eq__, and with eq=True and frozen=False Python sets __hash__ to None, so instances are unhashable.' },
        'An instance of a typing.NamedTuple whose fields are str and int',
        { text: 'A TypedDict value', why: 'At runtime a TypedDict value is a plain dict, and dicts are unhashable.' },
        { text: 'A tuple containing a list', why: 'A tuple is hashable only if every item inside it is; a list is not.' },
      ],
      answer: 1,
      explanation: py`A named tuple is a tuple, and a tuple of hashable values is hashable. Dataclasses become hashable with \`frozen=True\`.`,
    },
    {
      id: 'records-and-slots-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from typing import NamedTuple

class Point(NamedTuple):
    x: int
    y: int

p = Point(2, 3)
print(p == (2, 3), p._replace(y=9), p)`,
      answer: 'True Point(x=2, y=9) Point(x=2, y=3)',
      accept: ['True Point(x=2, y=9) Point(x=2, y=3)'],
      explanation: py`A named tuple equals a plain tuple with the same values. \`_replace\` returns a **new** Point; \`p\` itself is unchanged.`,
    },
    {
      id: 'records-and-slots-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from typing import TypedDict

class User(TypedDict):
    name: str
    age: int

u = User(name="Ada", age="36")
print(type(u).__name__, u["age"] + "!")`,
      options: [
        { text: 'TypeError: age must be int', why: 'TypedDict never checks types at runtime — only type checkers read the annotations.' },
        'dict 36!',
        { text: 'User 36!', why: 'Calling a TypedDict class returns a plain dict, so type(u) is dict.' },
        { text: 'TypeError: can only concatenate str (not "int") to str', why: 'The value stored is the string "36", so "36" + "!" works fine.' },
      ],
      answer: 1,
      explanation: py`\`User(...)\` just builds a \`dict\`; the wrong type goes straight in. A type checker would flag \`age="36"\` before running, but Python itself doesn't.`,
    },
    {
      id: 'records-and-slots-q4',
      type: 'bug',
      prompt: 'The team added `__slots__` to save memory, but profiling shows `Point3D` instances still carry a `__dict__` and use about as much memory as before. Click the line of the class that is missing its slots.',
      code: py`class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y


class Point3D(Point):
    def __init__(self, x, y, z):
        super().__init__(x, y)
        self.z = z`,
      answerLine: 9,
      explanation: py`A subclass without its own \`__slots__\` gets a \`__dict__\` again, so \`self.z\` lands there. Add \`__slots__ = ("z",)\` to \`Point3D\` — only the new name.`,
    },
    {
      id: 'records-and-slots-q5',
      type: 'fill',
      prompt: 'Make `Money` immutable and hashable (first blank) and remove the per-instance `__dict__` (second blank).',
      code: py`from dataclasses import dataclass

@dataclass(___=True, ___=True)
class Money:
    amount_pence: int
    currency: str`,
      answer: [['frozen'], ['slots']],
      explanation: py`\`frozen=True\` blocks assignment and generates \`__hash__\`; \`slots=True\` (3.10+) builds the class with \`__slots__\` for the fields.`,
    },
    {
      id: 'records-and-slots-q6',
      type: 'output',
      prompt: 'What happens when this runs?',
      code: py`from dataclasses import dataclass

@dataclass(frozen=True)
class Order:
    order_id: int
    items: list

o = Order(1, ["tea"])
o.items.append("cake")
print(o.items)
print(hash(o))`,
      options: [
        { text: 'FrozenInstanceError on the append line', why: 'frozen blocks assigning to fields (o.items = …). append mutates the list the field refers to, which is allowed.' },
        "It prints ['tea', 'cake'], then raises TypeError: unhashable type: 'list'",
        { text: "It prints ['tea', 'cake'] and then a number", why: 'The generated __hash__ hashes the tuple of fields, and a list inside makes that impossible.' },
        { text: "It prints ['tea'] because frozen objects copy their fields", why: 'Nothing is copied: the field refers to the very list you passed in.' },
      ],
      answer: 1,
      explanation: py`Freezing is shallow, and hashing is deep. Use \`items: tuple[str, ...]\` for a truly immutable, hashable order.`,
    },
    {
      id: 'records-and-slots-q7',
      type: 'short',
      prompt: 'You receive user profiles as JSON from an API and pass them to many functions. When would you keep them as a TypedDict, and when convert them to a frozen dataclass?',
      answer: py`Keep a TypedDict when the data is mostly passed through (read a few keys, send it on, serialise it again) — it stays a cheap, JSON-native dict and type checkers still catch key typos. Convert to a frozen dataclass when the rest of the program works with it as a domain value: you get attribute access, methods, immutability, hashability and a single place (a factory or \`__post_init__\`) to validate. Either way, validate the untrusted JSON when it enters.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'stock-keys',
      title: 'Stock counts keyed by SKU',
      difficulty: 'intermediate',
      prompt: py`A shop's stock rows look like \`("tee", "M", "red", 4)\`: product, size, colour, quantity. The same product/size/colour can appear on several rows.

1. Turn \`Sku\` into a record type with fields \`product\`, \`size\`, \`colour\` (in that order) that is
   - **immutable** — assigning \`sku.size = "L"\` raises \`AttributeError\` (a frozen dataclass's \`FrozenInstanceError\` counts),
   - **compared by value** and **hashable** — two \`Sku("tee", "M", "red")\` objects are equal and find the same dict key,
   - **unpackable** — \`product, size, colour = sku\` works.
2. Write \`stock_by_sku(rows)\` that returns a dict mapping each \`Sku\` to its **total** quantity.

The tests also check that \`Sku("tee", "M", "red").colour == "red"\`.`,
      files: {
        'main.py': py`# TODO: make Sku immutable, hashable, compared by value and unpackable
class Sku:
    def __init__(self, product, size, colour):
        self.product = product
        self.size = size
        self.colour = colour


def stock_by_sku(rows):
    """Return {Sku: total quantity} for rows of (product, size, colour, qty)."""
    totals = {}
    # TODO: add each row's quantity to the right Sku
    return totals


rows = [
    ("tee", "M", "red", 4),
    ("tee", "L", "red", 2),
    ("tee", "M", "red", 3),
    ("cap", "-", "blue", 5),
]
print(stock_by_sku(rows))
`,
      },
      hints: [
        'Which record type is immutable, hashable, compared by value AND unpacks like a tuple? Only one of them does all four out of the box.',
        'class Sku(NamedTuple): with three str fields. Then loop: for product, size, colour, qty in rows: … use a dict with .get(key, 0).',
        'sku = Sku(product, size, colour); totals[sku] = totals.get(sku, 0) + qty',
      ],
      solution: {
        explanation: py`A \`typing.NamedTuple\` is the one record type that gives all four properties for free: tuples are immutable (\`AttributeError: can't set attribute\`), compare by value, hash by value when their items are hashable, and unpack. Because equal SKUs hash equally, \`totals.get(sku, 0)\` finds the running total for a SKU built from a different row. A frozen dataclass would also be immutable and hashable, but it doesn't unpack — you'd have to write \`__iter__\` yourself. The plain class in the starter compared and hashed by **identity**, so every row became a separate key.`,
        files: {
          'main.py': py`from typing import NamedTuple


class Sku(NamedTuple):
    product: str
    size: str
    colour: str


def stock_by_sku(rows):
    """Return {Sku: total quantity} for rows of (product, size, colour, qty)."""
    totals = {}
    for product, size, colour, qty in rows:
        sku = Sku(product, size, colour)
        totals[sku] = totals.get(sku, 0) + qty
    return totals


rows = [
    ("tee", "M", "red", 4),
    ("tee", "L", "red", 2),
    ("tee", "M", "red", 3),
    ("cap", "-", "blue", 5),
]
print(stock_by_sku(rows))
`,
        },
      },
      tests: [
        { name: 'equal SKUs are equal and hash the same', code: py`a, b = Sku("tee", "M", "red"), Sku("tee", "M", "red")
assert a == b, 'Two Sku objects with the same fields must be equal'
assert hash(a) == hash(b), 'Equal Sku objects must have equal hashes'` },
        { name: 'fields are readable by name', code: py`assert Sku("tee", "M", "red").colour == "red"` },
        { name: 'Sku is immutable', code: py`with raises(AttributeError):
    Sku("tee", "M", "red").size = "L"` },
        { name: 'Sku unpacks into three names', code: py`product, size, colour = Sku("cap", "-", "blue")
assert (product, size, colour) == ("cap", "-", "blue")` },
        { name: 'quantities are totalled per SKU', code: py`totals = stock_by_sku([("tee", "M", "red", 4), ("tee", "L", "red", 2), ("tee", "M", "red", 3)])
assert totals == {Sku("tee", "M", "red"): 7, Sku("tee", "L", "red"): 2}` },
      ],
    },
    {
      id: 'measure-slots',
      title: 'Measure it yourself',
      difficulty: 'intermediate',
      prompt: py`Never trust a memory number you didn't measure. Build a tiny measuring tool.

1. Give \`Pixel\` a \`__slots__\` for \`x\`, \`y\` and \`colour\`, so instances have **no \`__dict__\`** and assigning an unknown attribute raises \`AttributeError\`.
2. Write \`bytes_per_object(factory, n=1000)\` that calls \`factory()\` (no arguments) \`n\` times, **keeps every object alive** while measuring, and returns the average number of bytes per object as an \`int\` (use \`round\`), measured with \`tracemalloc\`. It must **stop** tracing before returning.

The tests check those rules, that the result is a positive \`int\` for Pixels, and that a dict with the same three keys measures **larger** than a slotted Pixel.`,
      files: {
        'main.py': py`import tracemalloc


class Pixel:
    # TODO: add __slots__
    def __init__(self, x, y, colour):
        self.x = x
        self.y = y
        self.colour = colour


def bytes_per_object(factory, n=1000):
    """Average bytes per object for n objects made by factory()."""
    # TODO: measure with tracemalloc
    return 0


print("Pixel:", bytes_per_object(lambda: Pixel(0, 0, "red")))
print("dict: ", bytes_per_object(lambda: {"x": 0, "y": 0, "colour": "red"}))
`,
      },
      hints: [
        'Slots: __slots__ = ("x", "y", "colour") directly inside the class. For measuring, look at tracemalloc.start(), get_traced_memory() and stop().',
        'Create the list that holds the objects BEFORE starting tracemalloc, so its own memory isn\'t counted; store every object in it so none is freed early.',
        'keep = [None] * n; tracemalloc.start(); for i in range(n): keep[i] = factory(); used, _ = tracemalloc.get_traced_memory(); tracemalloc.stop(); return round(used / n)',
      ],
      solution: {
        explanation: py`\`__slots__\` gives each Pixel three fixed reference slots and no \`__dict__\`. The measuring function allocates its holding list *before* tracing, so the only traced allocations are the objects themselves; keeping them in the list stops CPython freeing each one as soon as the next is created (otherwise you'd measure roughly one object, not \`n\`). \`get_traced_memory()\` returns \`(current, peak)\` bytes of traced memory; dividing \`current\` by \`n\` gives an average. \`stop()\` turns tracing off and clears the traces — important because tracing slows every allocation. The absolute numbers depend on the interpreter; the ordering (a dict bigger than a slotted object) is robust.`,
        files: {
          'main.py': py`import tracemalloc


class Pixel:
    __slots__ = ("x", "y", "colour")

    def __init__(self, x, y, colour):
        self.x = x
        self.y = y
        self.colour = colour


def bytes_per_object(factory, n=1000):
    """Average bytes per object for n objects made by factory()."""
    keep = [None] * n                 # allocate the holder before tracing
    tracemalloc.start()
    try:
        for i in range(n):
            keep[i] = factory()       # keep every object alive
        used, _peak = tracemalloc.get_traced_memory()
    finally:
        tracemalloc.stop()
    return round(used / n)


print("Pixel:", bytes_per_object(lambda: Pixel(0, 0, "red")))
print("dict: ", bytes_per_object(lambda: {"x": 0, "y": 0, "colour": "red"}))
`,
        },
      },
      tests: [
        { name: 'Pixel instances have no __dict__', code: py`assert not hasattr(Pixel(1, 2, "red"), "__dict__"), 'Add __slots__ = ("x", "y", "colour")'` },
        { name: 'unknown attributes are rejected', code: py`with raises(AttributeError):
    Pixel(1, 2, "red").alpha = 0.5` },
        { name: 'returns a positive int', code: py`result = bytes_per_object(lambda: Pixel(0, 0, "red"))
assert isinstance(result, int) and result > 0, f'Expected a positive int, got {result!r}'` },
        { name: 'a dict measures larger than a slotted Pixel', code: py`assert bytes_per_object(lambda: {"x": 0, "y": 0, "colour": "red"}) > bytes_per_object(lambda: Pixel(0, 0, "red"))` },
        { name: 'tracing is stopped afterwards', code: py`import tracemalloc
bytes_per_object(lambda: Pixel(0, 0, "red"), n=10)
assert not tracemalloc.is_tracing(), 'Call tracemalloc.stop() before returning'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'records-and-slots-hashable',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does it mean for an object to be hashable, and why is a tuple hashable only sometimes?',
      answer: 'Hashable means the object has a hash that never changes during its lifetime and equal objects have equal hashes, so it can be a dict key or set member. A tuple hashes by combining its items’ hashes, so it is hashable only if every item is: ("a", 1) is, ("a", [1]) is not.',
      explanation: py`Dicts and sets store items by hash. If a key's hash changed after insertion, lookups would look in the wrong bucket. So mutable built-ins (list, dict, set) are unhashable, and containers like tuples, named tuples and frozen dataclasses are hashable only "all the way down". Plain class instances are hashable by identity unless they define \`__eq__\` without \`__hash__\`.`,
      code: { lang: 'python', code: py`print(hash(("tea", 2)) == hash(("tea", 2)))   # True
try:
    hash(("tea", [2]))
except TypeError as err:
    print(err)                                   # unhashable type: 'list'` },
      whyAsked: 'Hashability underpins dicts, sets, caching and value objects; confusing "immutable" with "hashable" causes real bugs.',
      mistakes: ['Saying "all tuples are hashable"', 'Equating immutability of the container with immutability of its contents', 'Not knowing the rule "equal objects must have equal hashes"'],
      followUps: ['Why does defining __eq__ make a class unhashable?', 'Is a frozenset hashable? A frozen dataclass with a list field?', 'What goes wrong if a key changes after being inserted?'],
      modelAnswer: 'An object is hashable if it has a hash value that never changes while it is alive, and objects that compare equal have equal hashes. That is what lets dicts and sets find keys by jumping to a bucket instead of searching. A tuple computes its hash from its items, so it is only hashable if every item is hashable — a tuple holding a list is not. The same applies to named tuples and frozen dataclasses: freezing the outer object does not freeze a list inside it. So I think of hashability as "immutable all the way down".',
    },
    {
      id: 'records-and-slots-choose',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Pick a record type for each and justify it: (1) the return value of a function that computes mean, median and max; (2) a currency amount used as a dict key; (3) a JSON order payload that is validated and forwarded to another service; (4) a simulation holding a few million particles with x, y, vx, vy.',
      answer: '(1) NamedTuple — small, fixed, callers may unpack it. (2) Frozen dataclass — a value object: immutable, hashable, not equal to a bare tuple. (3) dict described by a TypedDict — it is JSON in and out; validate on entry. (4) A slotted class or @dataclass(slots=True), after measuring memory — or, at that scale, consider arrays of numbers instead of objects.',
      explanation: py`Each choice follows from the four questions: names, immutability, hashability, memory. Named tuples are ideal when tuple behaviour is a feature; frozen dataclasses for values with identity-free equality; TypedDicts when the data's natural form is a dict; slots when the count of instances makes per-object overhead dominate. For millions of numeric records, array-based storage (the \`array\` module, or NumPy outside the standard library) often beats any per-object design.`,
      whyAsked: 'It tests judgement rather than syntax: can you map requirements to the right tool and explain the trade-offs?',
      mistakes: ['Using one record type for everything', 'Choosing slots without mentioning measurement', 'Forgetting that NamedTuples equal plain tuples', 'Treating TypedDict as validation'],
      followUps: ['How would you measure the memory difference in (4)?', 'What breaks if (1) later gains a fourth field?', 'Where would you convert (3) into internal objects, if at all?'],
      modelAnswer: 'For the statistics result I would use a NamedTuple: it is small and fixed, callers can write mean, median, top = stats, and it prints nicely. For money as a dict key I want a value object, so a frozen dataclass — immutable, hashable, and it will not accidentally equal a plain tuple. The JSON payload I would keep as a dict described by a TypedDict, because it goes straight back out as JSON; I would validate it on entry since TypedDict checks nothing at runtime. For millions of particles, per-object overhead matters, so a slotted class or dataclass with slots=True — but I would measure with tracemalloc first, and at that scale I would also consider storing the numbers in arrays instead of objects.',
    },
    {
      id: 'records-and-slots-slots-inheritance',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'A team added `__slots__ = ("timestamp", "source")` to a base `Event` class to save memory. Two problems: memory for `ClickEvent(Event)` objects barely changed, and adding a mixin `class Audited: __slots__ = ("audit_id",)` as a second base raised `TypeError: multiple bases have instance lay-out conflict`. Explain both.',
      answer: 'ClickEvent has no __slots__ of its own, so its instances get a __dict__ again — every class in the chain must declare __slots__ (listing only new names). The layout conflict happens because two bases each define non-empty slots, i.e. two incompatible fixed instance layouts; only one base in a multiple-inheritance chain may contribute non-empty slots — give mixins __slots__ = ().',
      explanation: py`Slots work by giving instances a fixed C-level layout. A subclass without \`__slots__\` extends that layout with a \`__dict__\` (and \`__weakref__\`), so new attributes go into the dict and the saving is lost. With multiple inheritance, CPython must merge the bases' layouts; two bases that each add their own slot storage can't both sit at the same offsets, hence the conflict. The convention is that mixins declare \`__slots__ = ()\` and the concrete class declares the actual slots.`,
      code: { lang: 'python', code: py`class Event:
    __slots__ = ("timestamp", "source")

class Audited:
    __slots__ = ()                  # mixins: empty slots

class ClickEvent(Event, Audited):
    __slots__ = ("button", "audit_id")   # only the new names

e = ClickEvent()
print(hasattr(e, "__dict__"))       # False` },
      whyAsked: 'Slots are a common memory optimisation, and the inheritance rules are where real code goes wrong.',
      mistakes: ['Thinking __slots__ is inherited and automatically extended', 'Repeating parent slot names in the child', 'Not knowing that mixins should use empty __slots__'],
      followUps: ['How do you allow weak references to a slotted class?', 'Why does functools.cached_property fail on it?', 'How would you verify the memory saving?'],
      modelAnswer: 'Slots replace the per-instance __dict__ with a fixed layout, but only if every class in the hierarchy declares __slots__. ClickEvent did not, so Python gave its instances a __dict__ again and the attributes went there — memory barely changed. The fix is to add __slots__ to ClickEvent listing only the names it adds. The layout conflict comes from multiple inheritance: two bases each define their own non-empty slot layout, and CPython cannot merge two fixed layouts. The convention is that mixins use __slots__ = () and the concrete class declares the real slots. Then I would confirm the saving with tracemalloc rather than assume it.',
    },
    {
      id: 'records-and-slots-version',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `Version` with fields `major`, `minor`, `patch` (patch defaults to 0). It must be immutable, hashable, and ordered numerically (`1.2.0 < 1.10.0`). Add a classmethod `Version.parse("1.10.0")`, a method `bump_minor()` that returns a **new** Version with minor + 1 and patch reset to 0, and `str(v)` returning `"1.10.0"`.',
      answer: 'A typing.NamedTuple gives immutability, hashing and numeric ordering for free; add a parse classmethod, a bump_minor that uses _replace, and __str__.',
      explanation: py`Tuple ordering compares field by field as ints, so \`Version(1, 2, 0) < Version(1, 10, 0)\` is correct where string comparison would not be. \`_replace\` returns a new record, keeping the original intact. A frozen dataclass with \`order=True\` works just as well and avoids tuple equality with plain tuples.`,
      starter: { files: { 'main.py': py`class Version:
    """TODO: make this an immutable, ordered, hashable record."""

    def __init__(self, major, minor, patch=0):
        self.major = major
        self.minor = minor
        self.patch = patch

    @classmethod
    def parse(cls, text):
        # TODO: turn "1.10.0" into Version(1, 10, 0)
        return None

    def bump_minor(self):
        # TODO: return a NEW Version with minor + 1 and patch 0
        return self


print(Version.parse("1.10.0"))
` } },
      tests: [
        { name: 'parse builds the right version', code: py`assert Version.parse("1.10.0") == Version(1, 10, 0)` },
        { name: 'patch defaults to 0', code: py`assert Version(2, 1) == Version(2, 1, 0)` },
        { name: 'ordering is numeric', code: py`assert Version.parse("1.2.0") < Version.parse("1.10.0")` },
        { name: 'str gives dotted text', code: py`assert str(Version(2, 0, 1)) == "2.0.1"` },
        { name: 'bump_minor returns a new version', code: py`v = Version(1, 4, 2)
w = v.bump_minor()
assert w == Version(1, 5, 0)
assert v == Version(1, 4, 2), 'The original must not change'` },
        { name: 'hashable and immutable', code: py`assert len({Version(1, 0, 0), Version.parse("1.0.0")}) == 1
with raises(AttributeError):
    Version(1, 0, 0).major = 2` },
      ],
      solution: { files: { 'main.py': py`from typing import NamedTuple


class Version(NamedTuple):
    major: int
    minor: int
    patch: int = 0

    @classmethod
    def parse(cls, text):
        major, minor, patch = (int(part) for part in text.split("."))
        return cls(major, minor, patch)

    def bump_minor(self):
        return self._replace(minor=self.minor + 1, patch=0)

    def __str__(self):
        return f"{self.major}.{self.minor}.{self.patch}"


print(Version.parse("1.10.0"))
` } },
      hints: ['Which record type is ordered field by field for free?', 'class Version(NamedTuple): major: int; minor: int; patch: int = 0 — then parse with text.split(".") and int().', 'bump_minor: return self._replace(minor=self.minor + 1, patch=0)'],
      whyAsked: 'A compact test of choosing a record type for its properties, plus classmethod factories and immutable updates.',
      mistakes: ['Comparing versions as strings ("1.10" < "1.2" is True)', 'Mutating self in bump_minor', 'Forgetting int() when parsing'],
      followUps: ['How would you support pre-release tags like 1.0.0rc1?', 'Why might you prefer a frozen dataclass with order=True here?'],
      modelAnswer: 'I would make Version a typing.NamedTuple with major, minor and patch defaulting to zero. Being a tuple, it is immutable and hashable, and it compares field by field as integers, so 1.2.0 sorts before 1.10.0 — which string comparison gets wrong. parse is a classmethod that splits on dots and converts each part with int. bump_minor uses _replace to return a new record with minor plus one and patch zero, leaving the original untouched, and __str__ joins the parts with dots. If I did not want versions to equal plain tuples, I would use a frozen dataclass with order=True instead.',
    },
    {
      id: 'records-and-slots-boundaries',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'In a service that receives JSON over HTTP, applies business rules and stores results, where would you use dicts/TypedDicts, frozen dataclasses and regular dataclasses — and where would you convert between them?',
      answer: 'Dicts (typed with TypedDict) at the edges, where JSON is parsed and produced; validate there and convert into frozen dataclasses (values) and regular dataclasses (entities with a lifecycle) for the core. Convert back with asdict()/explicit serialisers on the way out. The core never touches raw dicts.',
      explanation: py`This keeps untrusted, loosely shaped data at the boundary and gives the business logic typo-proof, well-typed objects. Value objects (Money, EmailAddress, DateRange) are frozen and hashable; entities (Order, Account) are regular dataclasses whose state changes. Conversion is explicit and in one place, which also makes it the natural spot for validation and versioning of the wire format — see [clean architecture](lesson:clean-architecture).`,
      whyAsked: 'Shows whether you can reason about data representations across layers, not just within one function.',
      mistakes: ['Passing request dicts deep into domain code', 'Assuming TypedDict validates', 'Making entities frozen and then fighting replace() everywhere'],
      followUps: ['Where does validation live?', 'How do you handle a new optional field in the JSON?', 'Would you use pydantic here, and in which layer?'],
      modelAnswer: 'I treat the representation as a boundary decision. At the HTTP edge the data is JSON, so I keep it as a dict and describe it with a TypedDict so the parsing code is type-checked. Right there I validate it and convert it into domain objects: frozen dataclasses for values like money or an address, which are immutable and hashable, and regular dataclasses for entities like an order whose status changes. The business rules only see those objects, so key typos and type confusion can’t leak in. On the way out I convert back explicitly, with asdict or a small serialiser, which is also where I version the wire format. A validation library like pydantic fits naturally at that edge too.',
    },
  ],

  takeaways: [
    'Choose a record type by four questions: field names, immutability, hashability, memory.',
    'Named tuples are real tuples: immutable, hashable, unpackable, ordered — and equal to any plain tuple with the same values.',
    'A regular dataclass is unhashable; frozen=True makes it immutable and hashable. Freezing is shallow — store tuples, not lists.',
    'TypedDict describes a plain dict for type checkers only; it checks nothing at runtime.',
    '__slots__ (or slots=True, 3.10+) removes the per-instance __dict__: less memory, no new attributes, rules for inheritance and weakrefs.',
    '"Change" immutable records with _replace(), dataclasses.replace() or copy.replace() (3.13+).',
    'Measure memory with tracemalloc on many live objects — sizes differ between versions, builds and implementations.',
  ],
}
