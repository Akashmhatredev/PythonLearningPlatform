// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const COFFEE = py`from enum import Enum, StrEnum, Flag, auto


class Size(Enum):
    SMALL = 250       # millilitres
    MEDIUM = 350
    LARGE = 450


class Status(StrEnum):
    PLACED = auto()
    BREWING = auto()
    READY = auto()
    COLLECTED = auto()


class Extra(Flag):
    NONE = 0
    OAT_MILK = auto()
    EXTRA_SHOT = auto()
    SYRUP = auto()


PRICES = {Size.SMALL: 2.40, Size.MEDIUM: 2.90, Size.LARGE: 3.30}
EXTRA_PRICE = 0.40
NEXT_STATUS = {
    Status.PLACED: Status.BREWING,
    Status.BREWING: Status.READY,
    Status.READY: Status.COLLECTED,
}


def price(size, extras):
    return round(PRICES[size] + len(extras) * EXTRA_PRICE, 2)


def advance(status):
    if status is Status.COLLECTED:
        raise ValueError("order already collected")
    return NEXT_STATUS[status]


def describe(status):
    match status:
        case Status.PLACED | Status.BREWING:
            return "please wait"
        case Status.READY:
            return "come and get it!"
        case Status.COLLECTED:
            return "enjoy"


size = Size["MEDIUM"]                    # look up by name
extras = Extra.OAT_MILK | Extra.SYRUP    # combine flags
print(size, size.name, size.value, "ml")
print("Extras:", extras)
print("Has syrup?", Extra.SYRUP in extras)
print("Price:", price(size, extras))

status = Status.PLACED
while status is not Status.COLLECTED:
    print(f"{status:>9} -> {describe(status)}")
    status = advance(status)
print(f"{status:>9} -> {describe(status)}")

print([s.value for s in Status])
print(Status("ready") is Status.READY)   # look up by value
`

export default {
  id: 'enums',
  title: 'Enums',
  summary: 'An enum gives a fixed set of related constants their own type — named, comparable with is, iterable, and impossible to misspell silently.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['classes-and-objects', 'match-statement'],
  related: ['dataclasses', 'records-and-slots', 'match-statement', 'dictionaries', 'json-data', 'type-hints', 'none-and-truthiness', 'metaclasses', 'special-methods', 'clean-code'],
  tags: ['enum', 'Enum', 'IntEnum', 'StrEnum', 'Flag', 'IntFlag', 'auto', 'unique', 'constants', 'members', 'name', 'value', 'bit flags', 'match', 'magic strings'],
  apis: [
    { name: 'enum.Enum', summary: 'Base class for enumerations: a fixed set of named, unique member objects.' },
    { name: 'enum.auto()', summary: 'Generates member values automatically (1, 2, 3… for Enum; powers of two for Flag; lowercase names for StrEnum).' },
    { name: 'member.name / member.value', summary: 'The member\'s name as a string ("RED") and the value it was assigned (1, "stop", …).' },
    { name: 'EnumClass(value) / EnumClass[name]', summary: 'Look up a member by value (ValueError if missing) or by name (KeyError if missing).' },
    { name: 'enum.IntEnum', summary: 'Enum whose members are also ints: they compare equal to ints and work in arithmetic.' },
    { name: 'enum.StrEnum', summary: '(3.11+) Enum whose members are also strings; str() and format() give the value.' },
    { name: 'enum.Flag / IntFlag', summary: 'Members that combine with |, &, ^ and ~ into sets of options stored as bits.' },
    { name: '@enum.unique', summary: 'Class decorator that raises ValueError if two members share a value (no aliases).' },
    { name: 'EnumClass.__members__', summary: 'Read-only mapping of every name (including aliases) to its member.' },
  ],
  docs: [
    { label: 'enum — Support for enumerations', url: 'https://docs.python.org/3/library/enum.html' },
    { label: 'Enum HOWTO', url: 'https://docs.python.org/3/howto/enum.html' },
    { label: 'PEP 435 — Adding an Enum type to the standard library', url: 'https://peps.python.org/pep-0435/' },
    { label: 'PEP 663 — StrEnum and enum improvements (3.11)', url: 'https://peps.python.org/pep-0663/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Some values come from a small, **fixed** menu: a traffic light is red, amber or green; an order is placed, brewing, ready or collected; a T-shirt is S, M or L. You *could* use plain strings like \`"ready"\` — until someone types \`"Ready"\` or \`"redy"\` and nothing complains.`,
    py`An **enumeration** (*enum*) turns such a menu into its own type. Each option is a **member**: a unique object with a \`name\` and a \`value\`.`,
    { code: py`from enum import Enum


class Light(Enum):
    RED = "stop"
    AMBER = "wait"
    GREEN = "go"


print(Light.RED)          # Light.RED
print(Light.RED.name)     # RED
print(Light.RED.value)    # stop
print(Light("go"))        # Light.GREEN   (look up by value)
print(Light["AMBER"])     # Light.AMBER   (look up by name)`, lang: 'python', title: 'an enum in eight lines' },
    py`Misspell a member (\`Light.GREN\`) and you get an \`AttributeError\` straight away instead of a silent wrong answer. Python also ships special enums: \`IntEnum\` and \`StrEnum\` (members that are also ints or strings) and \`Flag\` (options you can combine). Enums pair beautifully with [match](lesson:match-statement) and with [dataclasses](lesson:dataclasses).`,
  ],
  why: [
    py`**Typos become errors.** With strings, \`if status == "redy":\` is simply never true. With an enum, \`Status.REDY\` raises \`AttributeError\` the moment that line runs — and editors and type checkers flag it before you even run.`,
    py`**One source of truth.** The set of valid options lives in one class. You can loop over it to build a menu, check whether a value is valid with \`Status(value)\`, and add a new option in one place.`,
    py`**Meaning, not magic numbers.** \`Priority.HIGH\` explains itself; \`3\` doesn't. Debug output shows \`<Priority.HIGH: 3>\`, not a bare number you have to look up.`,
  ],
  eli15: [
    py`Think of a school canteen menu with exactly four meals. If you let people write their order on a blank note, you'll get "pizza", "Pizza", "piza" and "the cheesy one" — and the kitchen has to guess.`,
    py`An enum is a **printed tick-box menu**. There are only four boxes, each has an official name (\`PIZZA\`) and a code the kitchen uses (\`1\`). You can't tick a box that doesn't exist, and the kitchen can always list every option.`,
    py`In code, \`Meal.PIZZA\` is that tick-box. There's only one of it in the whole program, so you can check "is this the pizza box?" with \`is\`.`,
  ],
  analogy: {
    title: 'A printed tick-box menu',
    body: [
      py`A form with tick-boxes ("☐ Small ☐ Medium ☐ Large") is much safer than a blank line where people write whatever they like. Every box has a printed label and, often, a code used by the back office.`,
      py`An \`Enum\` class is the printed form; each member is one box. A \`Flag\` is a form where you may tick *several* boxes ("☐ oat milk ☐ extra shot ☐ syrup").`,
    ],
    mapping: [
      ['the printed form', 'the enum class, e.g. Size'],
      ['one tick-box', 'a member, e.g. Size.MEDIUM'],
      ['the printed label on a box', 'member.name → "MEDIUM"'],
      ['the back-office code', 'member.value → 350'],
      ['finding a box from its code', 'Size(350) → Size.MEDIUM'],
      ['a form where several boxes can be ticked', 'a Flag: Extra.OAT_MILK | Extra.SYRUP'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Members are unique objects',
    props: {
      code: py`from enum import Enum


class Light(Enum):
    RED = "stop"
    AMBER = "wait"
    GREEN = "go"


current = Light.RED
same = Light("stop")
print(current is same)
print(current.name, current.value)

for light in Light:
    print(light.name, "->", light.value)

current = Light["GREEN"]
print(current == "go", current.value == "go")
`,
      notes: {
        4: 'The class body runs like any class body, then the enum machinery turns `RED`, `AMBER` and `GREEN` into **member objects**, each created exactly once.',
        10: '`Light.RED` is the member object itself — not the string `"stop"`.',
        11: '`Light("stop")` doesn\'t create anything: it **looks up** the existing member whose value is `"stop"`.',
        12: 'Both names point to the very same object, so `is` is `True`. That\'s why `is` is the idiomatic way to compare members.',
        15: 'Iterating the class yields the members in definition order.',
        18: '`Light["GREEN"]` looks a member up by **name**.',
        19: 'A plain `Enum` member is not equal to its value: `Light.GREEN == "go"` is `False`. Compare `.value` (or use `StrEnum`) when you need the raw value.',
      },
    },
    alt: 'A step-by-step trace. The Light enum is defined with three members. current is bound to Light.RED and same is bound to the result of Light("stop"); both arrows point to the same member object, and current is same prints True. A loop prints each member name and value. current is rebound to Light.GREEN, and the final line prints False True because the member is not equal to the string "go" but its value is.',
    caption: py`Members are created once, when the class is defined. Every lookup — by attribute, by value or by name — hands back one of those same objects.`,
  },
  syntax: [
    py`#### Defining an enum`,
    { code: py`from enum import Enum, auto


class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class Direction(Enum):     # values you don't care about
    NORTH = auto()         # 1
    EAST = auto()          # 2
    SOUTH = auto()         # 3
    WEST = auto()          # 4`, lang: 'python', title: 'class syntax with explicit or automatic values' },
    py`- Member names are \`UPPER_CASE\` by convention (they are constants).
- Values can be anything: ints, strings, tuples. Use \`auto()\` when only the identity matters.
- Two names with the **same value** make the second an **alias** of the first. Add \`@unique\` to forbid that.`,
    py`#### Using members`,
    { code: py`from enum import Enum


class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


p = Priority.HIGH
print(p.name, p.value)            # HIGH 3
print(Priority(2))                # Priority.MEDIUM   (by value)
print(Priority["LOW"])            # Priority.LOW      (by name)
print(p is Priority.HIGH)         # True — compare members with is (or ==)
print(list(Priority))             # all members, in definition order
print(len(Priority))              # 3
print(Priority.LOW in Priority)   # True
print(2 in Priority)              # True on 3.12+ (checks values)`, lang: 'python', title: 'name, value, lookup, iteration, membership' },
    { callout: 'version', title: 'Membership tests with raw values', text: py`On **3.12+**, \`2 in Priority\` checks whether 2 is a member's *value*. On older versions a non-member on the left raised \`TypeError\`. Portable code uses \`try: Priority(value)\` and catches \`ValueError\`.` },
    py`#### IntEnum and StrEnum — members that are also ints / strings`,
    { code: py`from enum import IntEnum, StrEnum, auto


class HttpStatus(IntEnum):
    OK = 200
    NOT_FOUND = 404


class Role(StrEnum):         # 3.11+
    ADMIN = auto()           # value "admin" (lowercased name)
    GUEST = auto()           # value "guest"


print(HttpStatus.OK == 200)         # True — it IS an int
print(HttpStatus.NOT_FOUND > 400)   # True
print(Role.ADMIN == "admin")        # True — it IS a str
print(f"role={Role.GUEST}")         # role=guest`, lang: 'python', title: 'mixed-in enums interoperate with plain values' },
    py`#### Flag — combinable options`,
    { code: py`from enum import Flag, auto


class Permission(Flag):
    READ = auto()      # 1
    WRITE = auto()     # 2
    DELETE = auto()    # 4


editor = Permission.READ | Permission.WRITE
print(editor)                          # Permission.READ|WRITE
print(Permission.WRITE in editor)      # True
print(Permission.DELETE in editor)     # False
print(list(editor))                    # [<Permission.READ: 1>, <Permission.WRITE: 2>]  (3.11+)
print(bool(Permission(0)))             # False — no options set`, lang: 'python', title: 'Flag members combine with |, test with in' },
    py`#### Enums in match statements (3.10+)`,
    { code: py`from enum import Enum


class Light(Enum):
    RED = "stop"
    AMBER = "wait"
    GREEN = "go"


def action(light):
    match light:
        case Light.RED | Light.AMBER:      # dotted names are VALUE patterns
            return "brake"
        case Light.GREEN:
            return "drive"


print(action(Light.AMBER))   # brake`, lang: 'python', title: 'always use the dotted name in a case' },
    { callout: 'warn', title: 'Dotted names only', text: py`\`case RED:\` with a bare name is a *capture pattern*: it matches **anything** and binds it to a variable called \`RED\`. Python refuses to compile it when more cases follow (\`SyntaxError: name capture 'RED' makes remaining patterns unreachable\`). Write \`case Light.RED:\`.` },
    py`#### Members can have methods`,
    { code: py`from enum import Enum


class Planet(Enum):
    MERCURY = (3.303e23, 2.4397e6)    # (mass kg, radius m)
    EARTH = (5.976e24, 6.37814e6)

    def __init__(self, mass, radius):  # receives the unpacked tuple value
        self.mass = mass
        self.radius = radius

    @property
    def surface_gravity(self):
        G = 6.673e-11
        return G * self.mass / (self.radius ** 2)


print(round(Planet.EARTH.surface_gravity, 2))   # 9.8`, lang: 'python', title: 'behaviour lives next to the data (example adapted from the Python docs)' },
  ],
  walkthrough: {
    title: 'Reading the coffee-shop program',
    lang: 'python',
    code: COFFEE,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [4, 7], text: py`\`Size\` is a plain \`Enum\` whose values carry real data (millilitres). The values aren't just labels — the program uses them.` },
      { lines: [10, 14], text: py`\`Status\` is a \`StrEnum\` (3.11+): \`auto()\` makes each value the lowercase member name, so \`Status.READY.value\` is \`"ready"\`. Members are real strings, which is handy for JSON and f-strings.` },
      { lines: [17, 21], text: py`\`Extra\` is a \`Flag\`: \`auto()\` gives powers of two (1, 2, 4) so options can be combined bit by bit. \`NONE = 0\` names the "nothing selected" value.` },
      { lines: [24, 31], text: py`Members are hashable, so they make perfect dictionary keys. These two dicts are lookup tables keyed by enum members — no \`if\`/\`elif\` chain needed.` },
      { lines: [34, 35], text: py`\`len(extras)\` counts how many options are set in a combined flag (3.11+). Two extras → \`2 * 0.40\` on top of the base price.` },
      { lines: [38, 41], text: py`\`status is Status.COLLECTED\` — each member exists exactly once, so identity is the clearest comparison.` },
      { lines: [44, 51], text: py`In a \`match\`, **dotted** names like \`Status.READY\` are value patterns. \`|\` combines alternatives.` },
      { lines: [54, 58], text: py`Lookup by name with \`Size["MEDIUM"]\`, combine flags with \`|\`, test a flag with \`in\`.` },
      { lines: [60, 64], text: py`The loop walks the order through its life cycle. \`f"{status:>9}"\` right-aligns the string value — StrEnum members format as their value.` },
      { lines: [66, 67], text: py`Iterating the class lists every member; \`Status("ready")\` looks one up by value, returning the same object as \`Status.READY\`.` },
    ],
  },
  playground: {
    title: 'Coffee-shop orders',
    objective: 'Run the order workflow, then add a size, a new status and a safe lookup function.',
    files: { 'main.py': COFFEE },
    expected: py`\`\`\`text
Size.MEDIUM MEDIUM 350 ml
Extras: Extra.OAT_MILK|SYRUP
Has syrup? True
Price: 3.7
   placed -> please wait
  brewing -> please wait
    ready -> come and get it!
collected -> enjoy
['placed', 'brewing', 'ready', 'collected']
True
\`\`\``,
    experiments: [
      {
        id: 'extra-large',
        task: py`Add an \`EXTRA_LARGE\` size of **550** ml that costs **3.70**. Don't forget the price table!`,
        hint: py`Add \`EXTRA_LARGE = 550\` to \`Size\` and \`Size.EXTRA_LARGE: 3.70\` to \`PRICES\`.`,
        tests: [
          { name: 'Size.EXTRA_LARGE has the value 550', code: py`assert Size.EXTRA_LARGE.value == 550` },
          { name: 'an extra-large with no extras costs 3.7', code: py`assert price(Size.EXTRA_LARGE, Extra.NONE) == 3.7` },
        ],
        explain: py`Adding a member is one line, and \`list(Size)\` now includes it automatically. Forget the \`PRICES\` entry and \`price()\` raises \`KeyError: <Size.EXTRA_LARGE: 550>\` — loud and specific, which is exactly what you want. (Tests that loop over \`Size\` and check \`PRICES\` covers every member catch this early.)`,
      },
      {
        id: 'cancelled',
        task: py`Orders can be cancelled. Add \`CANCELLED = auto()\` to \`Status\`; make \`describe(Status.CANCELLED)\` return \`"order cancelled"\` and make \`advance(Status.CANCELLED)\` raise \`ValueError\`.`,
        hint: py`Add a \`case Status.CANCELLED:\` branch. In \`advance\`, check \`if status in (Status.COLLECTED, Status.CANCELLED):\`.`,
        tests: [
          { name: 'describe() handles CANCELLED', code: py`assert describe(Status.CANCELLED) == "order cancelled"` },
          { name: 'a cancelled order cannot advance', code: py`with raises(ValueError):
    advance(Status.CANCELLED)` },
          { name: 'the value is the lowercase name', code: py`assert Status.CANCELLED == "cancelled"` },
        ],
        explain: py`Without a \`case\` for the new member, \`describe\` would silently return \`None\`. Type checkers can catch that: add \`case _: typing.assert_never(status)\` (3.11+) and a checker such as mypy reports any member you forgot to handle.`,
      },
      {
        id: 'safe-lookup',
        task: py`Customers type sizes as millilitres. Write \`size_from_ml(ml)\` that returns the matching \`Size\` member, or \`None\` if there isn't one.`,
        hint: py`\`Size(ml)\` looks a member up by value and raises \`ValueError\` when no member has that value. Wrap it in \`try\`/\`except ValueError\`.`,
        tests: [
          { name: 'finds a size by its value', code: py`assert size_from_ml(450) is Size.LARGE` },
          { name: 'returns None for an unknown value', code: py`assert size_from_ml(300) is None` },
        ],
        explain: py`\`EnumClass(value)\` is the standard way to convert raw data (a form field, a JSON value, a database column) into a member. Catching \`ValueError\` at that boundary turns bad input into a clean decision instead of a crash deep inside the program.`,
      },
      {
        id: 'alias',
        task: py`Add \`GRANDE = 450\` to \`Size\` and print \`list(Size)\` and \`Size.GRANDE\`. Then put \`@unique\` (from \`enum\`) above the class and run again.`,
        hint: py`Import it with \`from enum import Enum, StrEnum, Flag, auto, unique\`.`,
        explain: py`\`GRANDE\` has the same value as \`LARGE\`, so it becomes an **alias**: \`Size.GRANDE is Size.LARGE\`, and iteration skips it. That's useful for alternative spellings, but usually an accident. \`@unique\` turns it into an error at class creation: \`ValueError: duplicate values found in <enum 'Size'>: GRANDE -> LARGE\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How Flag combines options as bits',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'read', label: 'READ = 1', note: 'binary 001', x: 130, y: 60, tone: 'blue' },
        { id: 'write', label: 'WRITE = 2', note: 'binary 010', x: 130, y: 160, tone: 'blue' },
        { id: 'delete', label: 'DELETE = 4', note: 'binary 100', x: 130, y: 260, tone: 'blue' },
        { id: 'editor', label: 'READ|WRITE = 3', note: 'binary 011', x: 420, y: 110, tone: 'yellow' },
        { id: 'check', label: 'WRITE in editor?', note: '011 & 010 = 010 → True', x: 640, y: 110, tone: 'paper' },
        { id: 'missing', label: 'DELETE in editor?', note: '011 & 100 = 000 → False', x: 640, y: 260, tone: 'red' },
      ],
      edges: [
        { from: 'read', to: 'editor', label: '|' },
        { from: 'write', to: 'editor', label: '|' },
        { from: 'editor', to: 'check', label: '&' },
        { from: 'editor', to: 'missing', label: '&', dashed: true },
      ],
      steps: [
        { focus: ['read', 'write', 'delete'], text: py`\`auto()\` in a \`Flag\` hands out **powers of two**: 1, 2, 4… In binary each one switches on a *different single bit*, like separate light switches.` },
        { focus: ['read', 'write', 'editor'], edges: ['read->editor', 'write->editor'], text: py`\`Permission.READ | Permission.WRITE\` combines them with bitwise OR: \`001 | 010 = 011\`, value 3. Python shows it as \`Permission.READ|WRITE\`.` },
        { focus: ['editor', 'check'], edges: ['editor->check'], text: py`\`Permission.WRITE in editor\` checks the bits with AND: \`011 & 010 = 010\`, which equals WRITE, so the answer is \`True\`.` },
        { focus: ['editor', 'missing', 'delete'], edges: ['editor->missing'], text: py`For DELETE the AND gives \`000\`: that bit isn't set, so the answer is \`False\`. One small integer can hold many yes/no options — that's why flags are used for permissions and file modes.` },
      ],
    },
    alt: 'Diagram of three flag members READ = 1, WRITE = 2 and DELETE = 4 shown as binary 001, 010 and 100. READ and WRITE are combined with | into READ|WRITE = 3 (binary 011). Checking WRITE in that combination ANDs the bits to get 010, which is True; checking DELETE ANDs to 000, which is False.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When Python runs \`class Light(Enum):\`, the enum machinery collects the names assigned in the body and replaces each one with a **member object** — an instance of \`Light\` that remembers its \`name\` and \`value\`. This happens once. After that, nothing can create new members: \`Light()\` with no value is an error, and \`Light("stop")\` just finds the existing one.`,
      py`Because every member is unique, \`Light.RED is Light("stop")\` is \`True\`. That's a language guarantee for enums, not an implementation accident — so \`is\` is safe and idiomatic here (unlike with numbers or strings; see [None, truthiness & identity](lesson:none-and-truthiness)).`,
      py`Members are also **read-only**: \`Light.RED = "halt"\` raises \`AttributeError: cannot reassign member 'RED'\`.`,
    ],
    technical: [
      py`**The metaclass.** \`type(Light)\` is \`enum.EnumType\` (called \`EnumMeta\` before 3.11; the old name is still an alias). A [metaclass](lesson:metaclasses) is "the class of a class": it controls how the class is built. \`EnumType\` turns the body's assignments into members, records them in \`__members__\` (a read-only mapping, aliases included), and implements \`Light(value)\`, \`Light[name]\`, \`len(Light)\`, iteration and \`in\` on the class itself.`,
      py`**Equality and hashing.** Plain \`Enum\` members compare by identity and are hashable, so they work as dict keys and set members. Mixed-in enums inherit the comparison of their data type: an \`IntEnum\` member *is* an int, so \`HttpStatus.OK == 200\` is \`True\` and \`hash(HttpStatus.OK) == hash(200)\`. That is the whole point of \`IntEnum\` — and also its risk: two unrelated \`IntEnum\`s with value 1 compare equal.`,
      py`**auto().** \`auto()\` asks the class's \`_generate_next_value_\` method for a value. \`Enum\` counts up from 1, \`Flag\` hands out the next power of two, and \`StrEnum\` uses the member name in lowercase. You can override \`_generate_next_value_\` to change the scheme.`,
      py`**Lookup hooks.** \`EnumClass(value)\` first tries an exact value match; if that fails it calls the classmethod \`_missing_(value)\`, which you can override — for example to accept \`"RED"\` and \`"red"\`, or to map unknown values to an \`UNKNOWN\` member.`,
      { code: py`from enum import Enum


class Color(Enum):
    RED = "red"
    GREEN = "green"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            for member in cls:
                if member.value == value.lower():
                    return member
        return None          # None means "still not found" -> ValueError


print(Color("RED"), Color("Green"))   # Color.RED Color.GREEN`, lang: 'python', title: '_missing_ for case-insensitive lookup' },
      py`**Flags.** A \`Flag\` value is an integer bit mask. \`|\`, \`&\`, \`^\` and \`~\` produce members for combinations on demand (\`Permission.READ|WRITE\` is a real \`Permission\` instance with value 3). Since 3.11, iterating a combined flag yields its single-bit members, \`len()\` counts them, and iterating the class skips the zero value and multi-bit aliases.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython's \`enum\` module is written in Python. Value lookups go through a private dict (\`_value2member_map_\`) when values are hashable, which makes \`Color(value)\` fast; unhashable values fall back to a linear search. These are private implementation details — use the public API.` },
    ],
    production: [
      py`**Convert at the boundary.** Data from JSON, forms and databases arrives as plain strings and ints. Convert it once, where it enters (\`Status(payload["status"])\`), and handle \`ValueError\` there. Inside the program pass members around; convert back with \`.value\` when you write data out. See [input validation](lesson:input-validation).`,
      py`**Persist values, deliberately.** Storing \`.value\` lets you rename members freely; storing \`.name\` lets you change values. Pick one, document it, and never change the stored side without a data migration. String values (\`StrEnum\`) are much easier to read in a database or log than \`3\`.`,
      py`**Be wary of IntEnum.** Use \`IntEnum\`/\`IntFlag\` only when you need drop-in compatibility with existing integer APIs (HTTP status codes, OS flags). Otherwise the int behaviour hides bugs: \`Size.SMALL == Priority.LOW\` can be \`True\`, and \`Priority.HIGH + 1\` is just \`4\`.`,
      py`**Exhaustiveness.** Type checkers understand enums. In a \`match\` (or \`if\`/\`elif\`) over all members, end with \`case _: typing.assert_never(status)\` (3.11+); mypy and pyright then report any member you forgot when someone adds a new one. \`typing.Literal["a", "b"]\` is a lighter alternative when you only need static checking of a few strings — see [unions & literals](lesson:typing-collections-and-unions).`,
      py`**JSON.** \`json.dumps(Color.RED)\` fails for plain enums (\`TypeError: Object of type Color is not JSON serializable\`). \`StrEnum\` and \`IntEnum\` members serialise as their value because they *are* strings/ints. For plain enums, convert explicitly (\`member.value\`) or pass \`default=\` to \`json.dumps\` — see [JSON](lesson:json-data).`,
    ],
  },
  mistakes: [
    {
      title: 'Comparing a plain Enum member with its raw value',
      wrong: { code: py`from enum import Enum


class Status(Enum):
    ACTIVE = "active"
    BANNED = "banned"


user_status = Status.ACTIVE
if user_status == "active":         # always False!
    print("welcome")`, lang: 'python' },
      right: { code: py`from enum import Enum


class Status(Enum):
    ACTIVE = "active"
    BANNED = "banned"


user_status = Status.ACTIVE
if user_status is Status.ACTIVE:    # compare members with members
    print("welcome")`, lang: 'python' },
      explanation: py`A plain \`Enum\` member is not equal to its value, so the condition is silently false. Compare members with members, convert raw input with \`Status(raw)\` first, or use \`StrEnum\` if members genuinely need to equal strings.`,
    },
    {
      title: 'A bare name in a case pattern',
      wrong: { code: py`match light:
    case RED:            # captures ANYTHING into a variable named RED
        print("stop")
    case GREEN:
        print("go")`, lang: 'python', static: true },
      right: { code: py`from enum import Enum


class Light(Enum):
    RED = "stop"
    GREEN = "go"


light = Light.GREEN
match light:
    case Light.RED:      # dotted name = value pattern
        print("stop")
    case Light.GREEN:
        print("go")`, lang: 'python' },
      explanation: py`In a \`case\`, a bare name is a *capture pattern* that matches everything. Python rejects the wrong version with \`SyntaxError: name capture 'RED' makes remaining patterns unreachable\`. Only dotted names (\`Light.RED\`) are compared by value.`,
    },
    {
      title: 'Passing an Enum straight to json.dumps',
      wrong: { code: py`import json
from enum import Enum


class Color(Enum):
    RED = "red"


json.dumps({"color": Color.RED})   # TypeError: Object of type Color is not JSON serializable`, lang: 'python', static: true },
      right: { code: py`import json
from enum import Enum, StrEnum


class Color(Enum):
    RED = "red"


class Theme(StrEnum):
    DARK = "dark"


print(json.dumps({"color": Color.RED.value}))   # {"color": "red"}
print(json.dumps({"theme": Theme.DARK}))        # {"theme": "dark"} — StrEnum is a str`, lang: 'python' },
      explanation: py`The \`json\` module only knows built-in types. Send \`.value\` for plain enums, or use \`StrEnum\`/\`IntEnum\` when the member should serialise as its value.`,
    },
    {
      title: 'Using IntEnum just because the values are ints',
      wrong: { code: py`from enum import IntEnum


class Size(IntEnum):
    SMALL = 1
    LARGE = 2


class Priority(IntEnum):
    LOW = 1
    HIGH = 2


print(Size.SMALL == Priority.LOW)   # True — two unrelated concepts are "equal"`, lang: 'python' },
      right: { code: py`from enum import Enum


class Size(Enum):
    SMALL = 1
    LARGE = 2


class Priority(Enum):
    LOW = 1
    HIGH = 2


print(Size.SMALL == Priority.LOW)   # False`, lang: 'python' },
      explanation: py`\`IntEnum\` members are ints, so they equal any int with the same value — including members of other enums. Reach for it only when you need to pass members to code that expects plain ints.`,
    },
    {
      title: 'Accidental aliases from copy-pasted values',
      wrong: { code: py`from enum import Enum


class Job(Enum):
    QUEUED = 1
    RUNNING = 2
    DONE = 3
    FAILED = 3        # copy-paste slip: FAILED is now an alias of DONE


print(Job.FAILED)     # Job.DONE`, lang: 'python' },
      right: { code: py`from enum import Enum, unique


@unique
class Job(Enum):
    QUEUED = 1
    RUNNING = 2
    DONE = 3
    FAILED = 4`, lang: 'python' },
      explanation: py`Same value → alias. A failed job would be reported as done. \`@unique\` makes duplicates a \`ValueError\` at class creation; \`auto()\` avoids the slip in the first place.`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: 7 is not a valid Color`,
      cause: py`\`Color(7)\` was called with a value no member has — often unvalidated input or a typo in the data.`,
      fix: py`Validate at the boundary: \`try: Color(raw) except ValueError: …\`, or override \`_missing_\` to map unknown values to a default member.`,
    },
    {
      symptom: py`KeyError: 'PINK'`,
      cause: py`\`Color["PINK"]\` looks members up by **name**, and there is no member called \`PINK\` (names are case-sensitive).`,
      fix: py`Check the spelling and case (\`Color[name.upper()]\`), or use \`Color.__members__.get(name)\` to get \`None\` instead of an error.`,
    },
    {
      symptom: py`TypeError: Object of type Color is not JSON serializable`,
      cause: py`A plain \`Enum\` member was passed to \`json.dumps\`.`,
      fix: py`Use \`member.value\`, switch to \`StrEnum\`/\`IntEnum\`, or pass \`default=lambda o: o.value\` to \`json.dumps\`.`,
    },
    {
      symptom: py`TypeError: '<' not supported between instances of 'Priority' and 'Priority'`,
      cause: py`Plain \`Enum\` members have no ordering, so \`sorted()\`, \`max()\` and \`<\` fail.`,
      fix: py`Sort by value: \`sorted(items, key=lambda p: p.value)\`, or use \`IntEnum\` if numeric ordering is part of the meaning.`,
    },
    {
      symptom: py`AttributeError: cannot reassign member 'RED'`,
      cause: py`Code tried to change a member: \`Color.RED = …\`.`,
      fix: py`Members are constants. Store changing state in a variable that *refers* to a member: \`current = Color.GREEN\`.`,
    },
    {
      symptom: py`SyntaxError: name capture 'RED' makes remaining patterns unreachable`,
      cause: py`A bare name was used in a \`case\` clause instead of the dotted member name.`,
      fix: py`Write \`case Color.RED:\`. Bare names in patterns always capture.`,
    },
  ],
  bestPractices: [
    'Use an enum whenever a value must be one of a small, fixed set of options.',
    'Name members in UPPER_CASE; use auto() when the values themselves do not matter.',
    'Compare members with is (or ==) — never with their raw values.',
    'Convert raw data to members once, at the boundary, with EnumClass(value), and handle ValueError there.',
    'Prefer plain Enum; use StrEnum (3.11+) for string-valued APIs and JSON, IntEnum only for int-compatible APIs.',
    'Add @unique unless you want aliases on purpose.',
    'Use Flag for sets of yes/no options that combine, such as permissions.',
    'Use dotted names (Color.RED) in match cases, and assert_never for exhaustiveness checks.',
  ],
  useCases: [
    'Order, ticket and job states: PLACED, PAID, SHIPPED; QUEUED, RUNNING, DONE.',
    'Configuration choices: log levels, themes, environments (DEV, STAGING, PROD).',
    'Permissions and feature toggles combined as a Flag.',
    'Wrapping protocol constants: http.HTTPStatus is an IntEnum in the standard library.',
    'Game state: directions, card suits, chess pieces.',
  ],
  whenToUse: {
    use: [
      'The set of possible values is fixed and known when you write the code.',
      'You keep comparing against the same handful of strings or numbers.',
      'You want typos to fail loudly and editors to autocomplete the options.',
    ],
    avoid: [
      'Open-ended values that grow with data (product names, user ids) — those belong in a database or dict.',
      'Values defined at runtime by users or configuration files.',
      'Only static checking of a couple of strings is needed — typing.Literal may be lighter.',
    ],
  },
  comparison: {
    title: 'Choosing an enum flavour',
    headers: ['', 'equals its raw value?', 'combinable?', 'typical use'],
    rows: [
      ['string constants', 'it is the raw value', 'no', 'quick scripts; typos go unnoticed'],
      ['Enum', 'no (Light.RED != "stop")', 'no', 'the default choice for a fixed set of options'],
      ['StrEnum (3.11+)', 'yes, it is a str', 'no', 'string values in JSON, HTTP, CLI arguments'],
      ['IntEnum', 'yes, it is an int', 'no', 'replacing integer constants in existing APIs'],
      ['Flag', 'no', 'yes, with | & ^ ~', 'sets of options: permissions, styles'],
      ['IntFlag', 'yes, it is an int', 'yes', 'OS / protocol bit masks that must stay ints'],
    ],
    note: py`\`Enum\` (3.4), \`auto\`, \`Flag\` and \`IntFlag\` (3.6), \`StrEnum\` (3.11). Since 3.11, \`str()\` of an \`IntEnum\`/\`StrEnum\` member gives its value (\`"200"\`, \`"admin"\`), while \`repr()\` still shows the member.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'enums-q1',
      type: 'mcq',
      prompt: py`\`Priority\` has \`LOW = 1\`, \`MEDIUM = 2\`, \`HIGH = 3\`. What does \`Priority(2)\` do?`,
      options: [
        { text: 'Creates a new Priority member with value 2', why: 'Enum classes never create new members after definition. Calling the class looks up an existing one.' },
        'Returns the existing member Priority.MEDIUM',
        { text: 'Returns the integer 2', why: 'It returns the member object; its .value is 2.' },
        { text: 'Raises TypeError because enums cannot be called', why: 'Calling an enum class with a value is the standard lookup-by-value.' },
      ],
      answer: 1,
      explanation: py`\`EnumClass(value)\` finds the member with that value (or raises \`ValueError\`). \`EnumClass[name]\` finds it by name.`,
    },
    {
      id: 'enums-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from enum import Enum

class Status(Enum):
    ACTIVE = "active"
    BANNED = "banned"

s = Status("active")
print(s == "active", s is Status.ACTIVE, s.value == "active")`,
      answer: 'False True True',
      accept: ['False True True'],
      explanation: py`A plain \`Enum\` member is not equal to its value, so the first is \`False\`. \`Status("active")\` returns the existing \`ACTIVE\` member, so \`is\` is \`True\`, and its \`.value\` is the string \`"active"\`.`,
    },
    {
      id: 'enums-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from enum import Enum

class Coin(Enum):
    PENNY = 1
    CENT = 1
    NICKEL = 5

print(len(Coin), Coin.CENT.name)`,
      options: [
        { text: '3 CENT', why: 'CENT has the same value as PENNY, so it is an alias, not a separate member.' },
        '2 PENNY',
        { text: '2 CENT', why: 'Coin.CENT is the PENNY member, so its name is PENNY.' },
        { text: 'ValueError: duplicate values', why: 'Duplicates are only an error with @unique.' },
      ],
      answer: 1,
      explanation: py`A second name with an existing value becomes an **alias**: \`Coin.CENT is Coin.PENNY\`. Aliases don't count in \`len()\` or iteration, and the member's \`name\` is the first name, \`PENNY\`.`,
    },
    {
      id: 'enums-q4',
      type: 'bug',
      prompt: 'This file fails to compile. Click the line that causes the problem.',
      code: py`from enum import Enum

class Light(Enum):
    RED = "stop"
    GREEN = "go"

def action(light):
    match light:
        case RED:
            return "brake"
        case Light.GREEN:
            return "drive"`,
      answerLine: 9,
      explanation: py`\`case RED:\` is a bare name, i.e. a *capture pattern* that matches anything. Because it would make the next case unreachable, Python raises \`SyntaxError: name capture 'RED' makes remaining patterns unreachable\`. Use \`case Light.RED:\`.`,
    },
    {
      id: 'enums-q5',
      type: 'fill',
      prompt: 'Combine two permissions, then check whether writing is allowed.',
      code: py`from enum import Flag, auto

class Perm(Flag):
    READ = auto()
    WRITE = auto()

editor = Perm.READ ___ Perm.WRITE
if Perm.WRITE ___ editor:
    print("can write")`,
      answer: [['|'], ['in']],
      explanation: py`\`|\` combines flag members (bitwise OR); \`in\` tests whether a flag is part of a combination (it checks the bits with \`&\`).`,
    },
    {
      id: 'enums-q6',
      type: 'output',
      prompt: 'What does this print? (Python 3.11+)',
      code: py`from enum import StrEnum, auto

class Role(StrEnum):
    ADMIN = auto()
    GUEST = auto()

print(Role.ADMIN, Role.ADMIN == "admin", f"[{Role.GUEST}]")`,
      options: [
        { text: 'Role.ADMIN True [Role.GUEST]', why: 'For StrEnum, str() and format() return the value, not "Class.MEMBER".' },
        'admin True [guest]',
        { text: 'ADMIN False [GUEST]', why: 'auto() in a StrEnum produces the lowercase member name, and members are real strings, so == "admin" is True.' },
        { text: '1 False [2]', why: 'StrEnum\'s auto() generates strings, not numbers.' },
      ],
      answer: 1,
      explanation: py`\`auto()\` in a \`StrEnum\` gives the lowercase member name as the value. Members are \`str\` instances, so they equal their value and print/format as it.`,
    },
    {
      id: 'enums-q7',
      type: 'short',
      prompt: 'Give two concrete reasons an enum beats plain string constants like "placed" and "ready".',
      answer: py`(1) Typos fail loudly: \`Status.REDY\` raises AttributeError (and editors/type checkers flag it), while \`status == "redy"\` is just silently False. (2) The set of valid values lives in one place: you can iterate it, validate input with \`Status(raw)\`, and add a member in one line. Bonus: members are unique objects with readable reprs, work in match statements, and type checkers can verify every case is handled.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'traffic-lights',
      title: 'Traffic-light controller',
      difficulty: 'intermediate',
      prompt: py`Build a tiny traffic-light controller.

1. Define \`Light(Enum)\` with members \`RED = "stop"\`, \`GREEN = "go"\`, \`AMBER = "slow down"\`.
2. Write \`next_light(light)\` that returns the next member in the cycle **RED → GREEN → AMBER → RED**.
3. Write \`parse_light(text)\` that turns user input into a member **by name**, ignoring case and surrounding spaces (\`" green "\` → \`Light.GREEN\`). For an unknown name it must raise \`ValueError\` (not \`KeyError\`).

The tests call \`next_light\` on every member, check the values, and call \`parse_light\` with valid and invalid input.`,
      files: {
        'main.py': py`from enum import Enum


class Light(Enum):
    RED = "stop"
    # TODO: add GREEN and AMBER


def next_light(light):
    # TODO: return the next light in the cycle
    return light


def parse_light(text):
    # TODO: look the member up by name, case-insensitively
    return Light.RED


print(next_light(Light.RED))
`,
      },
      hints: [
        'A dict keyed by members is a neat way to describe the cycle: {Light.RED: Light.GREEN, ...}.',
        'Light[name] looks a member up by name and raises KeyError when it is missing. Normalise with text.strip().upper() first.',
        'Catch the KeyError and raise ValueError(f"unknown light: {text!r}") from None.',
      ],
      solution: {
        explanation: py`The cycle is data, so a dict keyed by members describes it with no \`if\` chain. \`Light[name]\` looks up by **name**; normalising with \`strip().upper()\` makes it forgiving, and converting \`KeyError\` to \`ValueError\` gives callers the conventional "bad value" exception (\`from None\` hides the internal \`KeyError\` from the traceback). Notice that \`next_light\` returns members, not strings — the rest of the program keeps working with the enum.`,
        files: {
          'main.py': py`from enum import Enum


class Light(Enum):
    RED = "stop"
    GREEN = "go"
    AMBER = "slow down"


CYCLE = {Light.RED: Light.GREEN, Light.GREEN: Light.AMBER, Light.AMBER: Light.RED}


def next_light(light):
    return CYCLE[light]


def parse_light(text):
    try:
        return Light[text.strip().upper()]
    except KeyError:
        raise ValueError(f"unknown light: {text!r}") from None


light = Light.RED
for _ in range(4):
    print(light.name, "-", light.value)
    light = next_light(light)
print(parse_light(" green "))
`,
        },
      },
      tests: [
        { name: 'members have the right values', code: py`assert Light.RED.value == "stop"
assert Light.GREEN.value == "go"
assert Light.AMBER.value == "slow down"` },
        { name: 'next_light follows RED → GREEN → AMBER → RED', code: py`assert next_light(Light.RED) is Light.GREEN
assert next_light(Light.GREEN) is Light.AMBER
assert next_light(Light.AMBER) is Light.RED` },
        { name: 'parse_light ignores case and spaces', code: py`assert parse_light("red") is Light.RED
assert parse_light(" Green ") is Light.GREEN
assert parse_light("AMBER") is Light.AMBER` },
        { name: 'parse_light raises ValueError for unknown names', code: py`with raises(ValueError):
    parse_light("purple")` },
      ],
    },
    {
      id: 'permission-flags',
      title: 'Permission flags',
      difficulty: 'intermediate',
      prompt: py`Model file-sharing permissions with a \`Flag\`.

1. Define \`Permission(Flag)\` with \`READ\`, \`WRITE\`, \`SHARE\` (use \`auto()\`), plus \`NONE = 0\` and \`OWNER = READ | WRITE | SHARE\`.
2. \`can(perms, needed)\` → \`True\` if **every** permission in \`needed\` is present in \`perms\` (\`needed\` may itself be a combination).
3. \`grant(perms, extra)\` → a new value with \`extra\` added.
4. \`describe(perms)\` → the names of the single permissions that are set, sorted alphabetically and joined with \`"+"\` (e.g. \`"READ+WRITE"\`), or \`"NONE"\` when nothing is set.

Tests check each function, including \`can(Permission.OWNER, Permission.READ | Permission.SHARE)\` and \`describe(Permission.NONE)\`.`,
      files: {
        'main.py': py`from enum import Flag, auto


class Permission(Flag):
    NONE = 0
    READ = auto()
    # TODO: WRITE, SHARE and OWNER


def can(perms, needed):
    return False


def grant(perms, extra):
    return perms


def describe(perms):
    return ""


print(describe(Permission.READ))
`,
      },
      hints: [
        'Inside the class body you can refer to members defined above: OWNER = READ | WRITE | SHARE.',
        'needed in perms is True only when all of needed\'s bits are set in perms. grant is just perms | extra.',
        'Iterating a flag value (3.11+) yields its single members: names = sorted(p.name for p in perms); return "+".join(names) or "NONE".',
      ],
      solution: {
        explanation: py`Each \`auto()\` member gets its own bit (1, 2, 4), so combinations never collide. \`OWNER\` is defined from the other members — a multi-bit alias, which iteration of the class skips. \`needed in perms\` checks that *all* bits of \`needed\` are present, so it works for single and combined permissions alike. \`|\` returns a new flag value without touching the old one. Iterating a combined flag (3.11+) yields its single members, which makes \`describe\` a one-liner; an empty flag yields nothing, so \`or "NONE"\` handles it.`,
        files: {
          'main.py': py`from enum import Flag, auto


class Permission(Flag):
    NONE = 0
    READ = auto()
    WRITE = auto()
    SHARE = auto()
    OWNER = READ | WRITE | SHARE


def can(perms, needed):
    return needed in perms


def grant(perms, extra):
    return perms | extra


def describe(perms):
    return "+".join(sorted(p.name for p in perms)) or "NONE"


guest = Permission.READ
editor = grant(guest, Permission.WRITE)
print(describe(guest), "|", describe(editor), "|", describe(Permission.OWNER))
print(can(editor, Permission.SHARE), can(Permission.OWNER, Permission.READ | Permission.SHARE))
`,
        },
      },
      tests: [
        { name: 'members are distinct bits and OWNER combines them', code: py`assert len({Permission.READ.value, Permission.WRITE.value, Permission.SHARE.value}) == 3
assert Permission.OWNER == Permission.READ | Permission.WRITE | Permission.SHARE` },
        { name: 'can() checks single permissions', code: py`assert can(Permission.READ | Permission.WRITE, Permission.WRITE) is True
assert can(Permission.READ, Permission.SHARE) is False` },
        { name: 'can() checks combined permissions', code: py`assert can(Permission.OWNER, Permission.READ | Permission.SHARE) is True
assert can(Permission.READ | Permission.WRITE, Permission.READ | Permission.SHARE) is False` },
        { name: 'grant() adds permissions without changing the original', code: py`guest = Permission.READ
editor = grant(guest, Permission.WRITE)
assert editor == Permission.READ | Permission.WRITE
assert guest == Permission.READ` },
        { name: 'describe() lists sorted names or NONE', code: py`assert describe(Permission.WRITE | Permission.READ) == "READ+WRITE"
assert describe(Permission.OWNER) == "READ+SHARE+WRITE"
assert describe(Permission.NONE) == "NONE"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'enums-why-over-strings',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is an Enum in Python, and why use one instead of string or integer constants?',
      answer: 'An Enum is a class whose members are a fixed set of unique, named constants, each with a name and a value. Compared with raw constants it catches typos (AttributeError), keeps the valid options in one iterable place, gives readable reprs, and lets type checkers and match statements reason about every case.',
      explanation: py`Members are singletons created once when the class is defined, so \`is\` comparisons are reliable. You can look members up by value (\`Status("ready")\`) or by name (\`Status["READY"]\`), iterate them, and attach methods. String constants offer none of that: any string is accepted, and misspellings silently compare unequal.`,
      whyAsked: 'A quick check of code-quality instincts: do you model fixed sets of options as types?',
      mistakes: ['Saying enums are "just constants" without mentioning validation and uniqueness', 'Claiming plain Enum members equal their values'],
      followUps: ['How do you convert a string from a JSON payload to a member?', 'When would you use StrEnum?', 'How do you prevent duplicate values?'],
      modelAnswer: 'An Enum is a class that defines a fixed set of named constants — the members — and each member is a unique object with a name and a value. I use enums whenever a value must be one of a known set of options, like order states. Compared with string constants, a typo such as Status.REDY fails immediately instead of silently comparing unequal, the valid values live in one place that I can iterate and validate against with Status(raw), and logs show readable reprs. They also work well with match statements and type checkers, which can tell me if I forgot to handle a member.',
    },
    {
      id: 'enums-equality-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why?',
      code: { lang: 'python', code: py`from enum import Enum, IntEnum


class Color(Enum):
    RED = 1


class Level(IntEnum):
    LOW = 1


print(Color.RED == 1, Level.LOW == 1, Color.RED == Level.LOW)` },
      options: ['True True True', 'False True False', 'False False False', 'False True True'],
      correctOption: 1,
      answer: 'False True False. A plain Enum member is only equal to itself; an IntEnum member is an int, so it equals 1; and Color.RED is not an int, so it is not equal to Level.LOW.',
      explanation: py`\`Enum\` uses identity-based equality. \`IntEnum\` subclasses \`int\`, so it inherits int's \`__eq__\` (and hash). The last comparison: \`Color.RED.__eq__\` doesn't know about ints, and \`Level.LOW\` (an int) is compared against a non-int member, so the result is \`False\`. Two *IntEnum*s with equal values, however, would compare \`True\`.`,
      whyAsked: 'Distinguishes candidates who understand mixed-in types from those who memorised syntax.',
      mistakes: ['Assuming all enums compare equal to their values', 'Assuming IntEnum members are not ints'],
      followUps: ['What would Level.LOW == OtherIntEnum.ONE give?', 'What does str(Level.LOW) return on 3.11+?'],
      modelAnswer: 'It prints False, True, False. A plain Enum member compares by identity, so Color.RED is not equal to the integer 1. IntEnum subclasses int, so Level.LOW really is the integer 1 and compares equal to it. Color.RED versus Level.LOW is False because the plain enum member is not an int and has no value-based equality. The flip side is that two different IntEnums with the same value would compare equal, which is why I default to plain Enum.',
    },
    {
      id: 'enums-intenum-risk',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A codebase uses IntEnum for everything. A bug report says a "small" order was treated as "low priority". How could IntEnum cause that, and what would you change?',
      answer: 'IntEnum members are ints, so members of unrelated enums with the same value compare equal and hash equal — Size.SMALL == Priority.LOW, and they collide as dict keys. Switch to plain Enum (or StrEnum where a string API is needed); keep IntEnum only where int compatibility is genuinely required.',
      explanation: py`Because \`hash(Size.SMALL) == hash(Priority.LOW)\` and they are equal, a dict keyed by mixed members treats them as the same key, and comparisons across concepts silently succeed. Arithmetic also works (\`Priority.HIGH + 1 == 4\`), which hides mistakes. Plain \`Enum\` members are only equal to themselves, so type confusion surfaces as a failed comparison or a type-checker error.`,
      whyAsked: 'Shows judgement about type safety and an ability to debug subtle equality/hashing issues.',
      mistakes: ['Blaming the dict', 'Fixing it by changing the numeric values so they no longer collide', 'Not mentioning hashing'],
      followUps: ['Where in the standard library is IntEnum the right choice?', 'How would you migrate stored integer values?'],
      modelAnswer: 'IntEnum members are real ints, so a Size.SMALL with value 1 is equal to Priority.LOW with value 1 and has the same hash. Any code that compares across those concepts, or a dict that stores both as keys, treats them as the same thing — exactly the bug in the report. I would switch these to plain Enum, where members are only equal to themselves, so mixing them up becomes visible, and type checkers can flag it. IntEnum stays only where we must pass members to APIs that want ints, like HTTP status codes; if the database stores the integers, I convert at the boundary with Priority(row_value).',
    },
    {
      id: 'enums-persisting',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'How would you store enum values in a database or JSON API, and what happens when an external system sends a value you do not recognise?',
      answer: 'Store the value (or the name) consistently — strings via StrEnum are the most readable — and convert at the boundary with Status(raw). For unknown values, decide explicitly: reject with a validation error, or map them to an UNKNOWN member via _missing_ so old code survives new upstream values.',
      explanation: py`Storing \`.value\` decouples the stored data from member names (you can rename \`Status.DONE\` to \`Status.COMPLETED\`), while storing \`.name\` decouples it from values. Never let both drift without a migration. \`_missing_\` is the hook \`EnumClass(value)\` calls when no member matches: returning a member there handles aliases, case differences or a catch-all.`,
      code: { lang: 'python', code: py`from enum import StrEnum


class Status(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    UNKNOWN = "unknown"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN       # tolerate values added upstream later


print(Status("active"), Status("archived"))   # active unknown` },
      whyAsked: 'Real systems exchange enum values across services and versions; the candidate should think about compatibility.',
      mistakes: ['Storing str(member), which differs across versions and enum types', 'Silently mapping unknowns without logging them', 'Renaming members whose names are stored'],
      followUps: ['How does this interact with a database CHECK constraint?', 'How do you add a new member safely across services?'],
      modelAnswer: 'I convert at the edges: incoming strings or ints become members with Status(raw), and outgoing data uses member.value. I usually choose StrEnum so stored values are readable, and I treat the stored value as a contract — renaming a member is fine, changing its value needs a migration. For unknown values I make a deliberate choice: for user input I reject it with a validation error; for data from another service that may add states before we deploy, I override _missing_ to return an UNKNOWN member and log it, so we degrade gracefully instead of crashing.',
    },
    {
      id: 'enums-weekday-coding',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `Weekday(Enum)` with MONDAY…SUNDAY valued 1…7, an `is_weekend` property, and a classmethod `from_text(text)` that accepts "mon", "Monday" or "MONDAY" (the first three letters decide) and raises ValueError otherwise.',
      answer: 'Define the seven members, add a @property returning self in (SATURDAY, SUNDAY) — or self.value >= 6 — and a @classmethod that compares text[:3].upper() with each member name\'s first three letters.',
      explanation: py`Enum classes can hold properties and classmethods like any class. A classmethod receives the enum class itself, so it can iterate the members. Raising \`ValueError\` mirrors what \`Weekday(99)\` would do.`,
      starter: { files: { 'main.py': py`from enum import Enum


class Weekday(Enum):
    MONDAY = 1
    # TODO: TUESDAY ... SUNDAY

    # TODO: is_weekend property and from_text classmethod


print(Weekday.MONDAY)
` } },
      tests: [
        { name: 'seven members valued 1..7', code: py`assert [d.value for d in Weekday] == [1, 2, 3, 4, 5, 6, 7]
assert Weekday(7).name == "SUNDAY"` },
        { name: 'is_weekend property', code: py`assert Weekday.SATURDAY.is_weekend and Weekday.SUNDAY.is_weekend
assert not Weekday.FRIDAY.is_weekend` },
        { name: 'from_text accepts several spellings', code: py`assert Weekday.from_text("mon") is Weekday.MONDAY
assert Weekday.from_text("Wednesday") is Weekday.WEDNESDAY
assert Weekday.from_text("SUNDAY") is Weekday.SUNDAY` },
        { name: 'from_text rejects unknown text', code: py`with raises(ValueError):
    Weekday.from_text("someday")` },
      ],
      solution: { files: { 'main.py': py`from enum import Enum


class Weekday(Enum):
    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6
    SUNDAY = 7

    @property
    def is_weekend(self):
        return self in (Weekday.SATURDAY, Weekday.SUNDAY)

    @classmethod
    def from_text(cls, text):
        prefix = text.strip()[:3].upper()
        for day in cls:
            if day.name.startswith(prefix) and len(prefix) == 3:
                return day
        raise ValueError(f"not a weekday: {text!r}")


print(Weekday.from_text("sat"), Weekday.from_text("sat").is_weekend)
` } },
      hints: ['Properties and classmethods work in enums exactly as in normal classes.', 'Iterate cls inside the classmethod and compare day.name[:3] with text[:3].upper().'],
      whyAsked: 'Checks that the candidate sees enums as full classes and can write clean parsing code at a boundary.',
      mistakes: ['Hard-coding a dict of all spellings', 'Returning the name string instead of the member', 'Returning None instead of raising for bad input'],
      followUps: ['How would you use datetime.date.isoweekday() with this enum?', 'Could _missing_ replace from_text?'],
      modelAnswer: 'I define the seven members with values one to seven, matching ISO weekday numbers so Weekday(date.isoweekday()) works. is_weekend is a property that checks whether self is Saturday or Sunday. from_text is a classmethod: it normalises the input to its first three letters in upper case, loops over the members and returns the one whose name starts with that prefix, otherwise raises ValueError — the same exception the enum itself uses for a bad value. Callers always get a member back, never a raw string.',
    },
    {
      id: 'enums-flag-vs-set',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'For a user\'s notification preferences (email, SMS, push), would you use a Flag or a set of Enum members?',
      answer: 'Both work. A Flag packs the options into one small integer with fast bitwise operations and a compact storage format — good for permissions and when the value is stored or sent as a number. A frozenset of Enum members is more explicit and flexible (any number of members, no bit arithmetic, natural set operations) — good when readability matters more than compactness.',
      explanation: py`\`Flag\` gives you \`|\`, \`&\`, \`in\` and a single int to persist. A \`set[Channel]\` gives you the same operations through set methods, prints readably, and serialises naturally as a list of strings. Flags shine when the representation must be a bit mask (OS flags, protocols, compact columns).`,
      whyAsked: 'Tests whether the candidate can weigh representation trade-offs rather than defaulting to one tool.',
      mistakes: ['Hand-rolling bit masks with plain ints', 'Claiming flags are always faster without measuring'],
      followUps: ['How would you store each option in a database?', 'How would you migrate if a fourth channel is added?'],
      modelAnswer: 'I would weigh representation. A Flag stores the whole preference set as one integer: combining and testing options with | and in is concise, and it is compact to store or send, which is why flags suit permissions and protocol bit masks. A frozenset of Enum members is more explicit: it prints readably, serialises as a list of names, and has no bit arithmetic to get wrong. For user preferences shown in a UI and stored as JSON I would probably pick the set of members; if they had to be stored as a single integer column or matched an external bit mask, a Flag.',
    },
    {
      id: 'enums-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does Python turn `RED = 1` inside an Enum class body into a member, and why can you not create new members afterwards?',
      answer: 'Enum classes are built by the EnumType metaclass. While creating the class, it takes each eligible name in the body, creates one instance of the enum class per value (aliases share it), stores them in __members__, and then forbids reassigning or adding members. Calling the class with a value performs a lookup instead of construction.',
      explanation: py`\`EnumType\` (formerly \`EnumMeta\`) uses a special class-body namespace that tracks assignments, creates members in \`__new__\`, and overrides \`__call__\` so \`Color(1)\` finds an existing member (falling back to \`_missing_\`). It also overrides \`__setattr__\` on the class so \`Color.RED = 5\` raises \`AttributeError\`, and defines \`__iter__\`, \`__len__\`, \`__contains__\` and \`__getitem__\` on the class. Names that are descriptors (methods, properties) or start with an underscore are not turned into members.`,
      whyAsked: 'Probes knowledge of metaclasses through a concrete, familiar example.',
      mistakes: ['Thinking members are created on each access', 'Saying enums are implemented in C (CPython\'s enum is mostly Python)', 'Not knowing that methods are not members'],
      followUps: ['How would you exclude a constant from becoming a member? (enum.nonmember, 3.11+)', 'What is _generate_next_value_?'],
      modelAnswer: 'The work is done by the metaclass, EnumType. When Python executes the class body, it collects the plain assignments like RED = 1, and when the class is created the metaclass makes one instance of the enum class per distinct value, sets its name and value, and records it in __members__; a repeated value becomes an alias of the first member. Methods, properties and underscore names are left alone. The metaclass also overrides calling the class, so Color(1) is a lookup rather than a construction, and it blocks setting attributes, so members cannot be reassigned. That is what makes members singletons you can safely compare with is.',
    },
  ],

  takeaways: [
    'An Enum defines a fixed set of unique member objects, each with a .name and a .value.',
    'Look members up by value with Color(value) and by name with Color["NAME"]; iterate the class to list them.',
    'Members are singletons — compare them with is (or ==); a plain Enum member is never equal to its raw value.',
    'auto() picks values for you; same value twice makes an alias unless you add @unique.',
    'IntEnum and StrEnum (3.11+) members are real ints/strings — convenient for APIs and JSON, risky for type safety.',
    'Flag members combine with | and are tested with in — ideal for permission-style options.',
    'In match statements always use dotted names: case Color.RED.',
  ],
}
