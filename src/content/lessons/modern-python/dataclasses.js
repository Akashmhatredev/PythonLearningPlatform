// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP = py`from dataclasses import dataclass, field, asdict, replace


@dataclass(frozen=True)
class Product:
    sku: str
    name: str
    price: float


@dataclass
class OrderLine:
    product: Product
    quantity: int = 1

    def __post_init__(self):
        if self.quantity < 1:
            raise ValueError(f"quantity must be at least 1, got {self.quantity}")

    @property
    def subtotal(self):
        return round(self.product.price * self.quantity, 2)


@dataclass
class Order:
    customer: str
    lines: list[OrderLine] = field(default_factory=list)

    def add(self, product, quantity=1):
        self.lines.append(OrderLine(product, quantity))

    def total(self):
        return round(sum(line.subtotal for line in self.lines), 2)


pen = Product("P-01", "Gel pen", 1.25)
pad = Product("N-07", "Notebook", 3.5)

order = Order("Ada")
order.add(pen, 4)
order.add(pad)
print(order)
print("Total:", order.total())

print(pen == Product("P-01", "Gel pen", 1.25))
sale_pen = replace(pen, price=0.99)
print(sale_pen, "| original:", pen.price)
print(asdict(order)["lines"][0])

second = Order("Ben")
print("Ben's lines:", second.lines)
`

export default {
  id: 'dataclasses',
  title: 'Dataclasses',
  summary: 'The @dataclass decorator writes __init__, __repr__ and __eq__ for you from a list of annotated fields — plus optional immutability, ordering, slots and validation hooks.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['classes-and-objects', 'special-methods'],
  related: ['records-and-slots', 'enums', 'special-methods', 'decorators', 'type-hints', 'mutability-and-copying', 'serialization', 'attribute-access', 'match-statement', 'properties-and-encapsulation'],
  tags: ['dataclass', 'dataclasses', 'field', 'default_factory', 'frozen', 'order', '__post_init__', 'slots', 'kw_only', 'asdict', 'astuple', 'replace', 'InitVar', 'FrozenInstanceError', 'boilerplate', 'value object', 'record'],
  apis: [
    { name: '@dataclass', summary: 'Class decorator that generates __init__, __repr__ and __eq__ (and optionally ordering, hashing, slots) from annotated class attributes.' },
    { name: 'dataclasses.field()', summary: 'Customises one field: default, default_factory, init, repr, compare, hash, kw_only, metadata.' },
    { name: '__post_init__()', summary: 'Hook the generated __init__ calls after assigning fields — the place for validation and derived values.' },
    { name: 'dataclasses.asdict() / astuple()', summary: 'Recursively convert a dataclass instance (and nested dataclasses, lists, dicts) to dicts or tuples.' },
    { name: 'dataclasses.replace()', summary: 'Return a new instance with some fields changed; the usual way to "modify" a frozen dataclass.' },
    { name: 'copy.replace()', summary: '(3.13+) Generic version of replace() that works for dataclasses, named tuples and other types that support it.' },
    { name: 'dataclasses.fields()', summary: 'Return the Field objects of a dataclass or instance, in definition order.' },
    { name: 'dataclasses.InitVar', summary: 'Annotation for an __init__-only parameter that is passed to __post_init__ but not stored as a field.' },
    { name: 'dataclasses.KW_ONLY', summary: '(3.10+) Sentinel annotation: every field after it is keyword-only.' },
    { name: 'dataclasses.FrozenInstanceError', summary: 'Raised when you assign to a field of a frozen dataclass.' },
  ],
  docs: [
    { label: 'dataclasses — Data Classes', url: 'https://docs.python.org/3/library/dataclasses.html' },
    { label: 'PEP 557 — Data Classes', url: 'https://peps.python.org/pep-0557/' },
    { label: 'copy.replace() (3.13+)', url: 'https://docs.python.org/3/library/copy.html#copy.replace' },
    { label: 'Data model — __hash__ and __eq__', url: 'https://docs.python.org/3/reference/datamodel.html#object.__hash__' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Lots of classes exist mainly to **hold data**: a product with a SKU and a price, a player with a name and a score, a point with x and y. Writing them by hand means typing every field name three or four times — in \`__init__\`, in \`__repr__\`, in \`__eq__\` — and keeping all those copies in sync.`,
    py`A **dataclass** fixes that. You list the fields once, as *annotated* class attributes (an **annotation** is the \`: type\` part after a name), and the \`@dataclass\` **decorator** — a function that receives your class and returns an improved one — writes the boring methods for you:`,
    { code: py`from dataclasses import dataclass


@dataclass
class Product:
    sku: str
    name: str
    price: float = 0.0


pen = Product("P-01", "Gel pen", 1.25)
print(pen)                                        # Product(sku='P-01', name='Gel pen', price=1.25)
print(pen == Product("P-01", "Gel pen", 1.25))    # True`, lang: 'python', title: 'a complete, working class in five lines' },
    py`It is still a completely normal class: you can add methods, properties and inheritance. Options on the decorator add more: \`frozen=True\` for read-only objects, \`order=True\` for sorting, \`slots=True\` for leaner instances. If you haven't met special ("dunder") methods yet, skim [special methods](lesson:special-methods) first — dataclasses generate them.`,
  ],
  why: [
    py`**Less code, fewer bugs.** A hand-written data class repeats every field name in several methods. Add a field, forget to update \`__eq__\`, and two "equal" objects suddenly compare unequal. A dataclass derives everything from one list, so it can't drift out of sync.`,
    py`**Better defaults.** A plain class prints as \`<__main__.Product object at 0x7f…>\` and compares by identity. A dataclass prints its fields (great for debugging and logs) and compares by value, which is what you almost always want for data.`,
    py`**Clear intent.** Seeing \`@dataclass(frozen=True)\` tells a reader "this is a value: it holds data and never changes" before they read a single method. Type checkers and IDEs understand dataclasses too, so they autocomplete and check the constructor's arguments.`,
  ],
  eli15: [
    py`Imagine you run a sports club and keep a card for every member. Each card has the same boxes: *name*, *age*, *team*. Writing a class by hand is like drawing every card from scratch with a ruler — boxes, labels, and a separate rule sheet for "how do I tell if two cards are the same?".`,
    py`A dataclass is a **card template**. You write the list of boxes once (\`name: str\`, \`age: int\`, \`team: str\`). Python then prints blank cards for you (\`__init__\`), knows how to read a card out loud (\`__repr__\`), and checks whether two cards have the same writing in every box (\`__eq__\`).`,
    py`Want laminated cards that nobody can scribble on? That's \`frozen=True\`. Want cards that sort themselves by the boxes in order? That's \`order=True\`. You describe the card; Python does the paperwork.`,
  ],
  analogy: {
    title: 'A form template at the print shop',
    body: [
      py`You give a print shop a list of the boxes your form needs: *name*, *email*, *quantity (default 1)*. The shop does the rest — prints blank forms with those boxes in that order, adds a summary strip at the bottom that lists every box, and gives you a checklist for comparing two filled-in forms box by box.`,
      py`Change the list of boxes and every one of those things updates automatically. That's exactly the relationship between your annotated fields and the methods \`@dataclass\` generates.`,
    ],
    mapping: [
      ['the list of boxes you hand in', 'annotated class attributes: name: str, quantity: int = 1'],
      ['a printed blank form', 'the generated __init__(self, name, email, quantity=1)'],
      ['the summary strip listing every box', 'the generated __repr__: Order(name=..., email=..., quantity=1)'],
      ['comparing two forms box by box', 'the generated __eq__, which compares the fields in order'],
      ['a laminated form nobody can edit', 'frozen=True — assigning a field raises FrozenInstanceError'],
      ['a staff member who checks each form as it arrives', '__post_init__, which runs right after __init__ for validation'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A dataclass at work',
    props: {
      code: py`from dataclasses import dataclass, field


@dataclass
class Player:
    name: str
    score: int = 0
    badges: list[str] = field(default_factory=list)

    def award(self, badge):
        self.badges.append(badge)
        self.score += 10


ada = Player("Ada")
ben = Player("Ben", 5)
ada.award("first-win")
print(ada)
print(ben)
print(ada == Player("Ada", 10, ["first-win"]))
`,
      notes: {
        4: 'The class body runs first, then `@dataclass` receives the finished class and adds methods to it. In Python 3.14 annotations are evaluated lazily, so you may see the tracer step into a hidden `__annotate__` function when the decorator asks for them.',
        6: 'An annotation with **no default** is a required field: it becomes a required `__init__` parameter.',
        7: 'A default value makes the parameter optional: `score=0`.',
        8: '`default_factory=list` means "call `list()` for every new object", so each player gets **their own** empty list.',
        15: 'This calls the **generated** `__init__(self, name, score=0, badges=<new list>)`. The tracer does not step into it because Python wrote that code, not you.',
        17: 'A normal method — dataclasses are ordinary classes, so you add behaviour as usual.',
        18: 'The generated `__repr__` lists every field: `Player(name=\'Ada\', score=10, badges=[\'first-win\'])`.',
        19: 'Ben\'s `badges` list is empty: the factory gave him a separate list from Ada\'s.',
        20: 'The generated `__eq__` compares the fields in order, so a separately built player with the same data is equal.',
      },
    },
    alt: 'A step-by-step trace. The Player class is created and decorated. ada = Player("Ada") creates an instance with name Ada, score 0 and an empty badges list; ben = Player("Ben", 5) creates a second instance with its own separate empty list. ada.award appends first-win to Ada\'s list only and raises her score to 10. The prints show the generated repr of both players and True for the equality check.',
    caption: py`Watch the two instances in the **heap**: each has its own \`badges\` list. That is what \`field(default_factory=list)\` buys you.`,
  },
  syntax: [
    py`#### Declaring fields`,
    { code: py`from dataclasses import dataclass, field


@dataclass
class Song:
    title: str                                    # required
    artist: str                                   # required
    seconds: int = 0                              # optional, simple default
    tags: list[str] = field(default_factory=list) # optional, fresh list per object
    plays: int = field(default=0, repr=False)     # hidden from the repr
    cached_lyrics: str = field(default="", compare=False, repr=False)`, lang: 'python', title: 'fields are annotated class attributes' },
    py`Rules worth memorising:`,
    py`- Only **annotated** names become fields. \`count = 0\` without \`: int\` is just a class attribute.
- Fields **without** defaults must come before fields **with** defaults (the same rule as function parameters). Otherwise: \`TypeError: non-default argument 'y' follows default argument 'x'\`.
- Mutable defaults (\`[]\`, \`{}\`, \`set()\`) are refused with a \`ValueError\` — use \`field(default_factory=list)\`.
- Annotations are **not checked** at runtime. \`Song(title=42, artist=None)\` works. Type checkers like mypy catch it before you run; see [type hints](lesson:type-hints).`,
    py`#### Options on the decorator`,
    { code: py`@dataclass(
    init=True,         # generate __init__
    repr=True,         # generate __repr__
    eq=True,           # generate __eq__ (compares fields as a tuple)
    order=False,       # True: also __lt__, __le__, __gt__, __ge__
    frozen=False,      # True: assigning to fields raises FrozenInstanceError
    unsafe_hash=False, # True: force a __hash__ even if not frozen (rarely right)
    match_args=True,   # 3.10+: generate __match_args__ for match/case
    kw_only=False,     # 3.10+: True makes every field keyword-only
    slots=False,       # 3.10+: True generates __slots__ (no per-instance __dict__)
)
class Example:
    value: int`, lang: 'python', title: 'every option shown with its default' },
    { callout: 'version', title: 'Which Python?', text: py`\`@dataclass\` itself arrived in **3.7**. \`slots=\`, \`kw_only=\`, \`match_args=\` and the \`KW_ONLY\` marker are **3.10+**. \`weakref_slot=\` is **3.11+**. \`copy.replace()\` (a generic \`replace\`) is **3.13+**.` },
    py`#### Validation and derived values: \`__post_init__\``,
    { code: py`from dataclasses import dataclass, field


@dataclass
class Rectangle:
    width: float
    height: float
    area: float = field(init=False)          # not an __init__ parameter

    def __post_init__(self):                 # called by the generated __init__
        if self.width <= 0 or self.height <= 0:
            raise ValueError("sides must be positive")
        self.area = self.width * self.height


print(Rectangle(2, 3))   # Rectangle(width=2, height=3, area=6)`, lang: 'python', title: '__post_init__ runs right after the fields are set' },
    py`#### Keyword-only fields (3.10+)`,
    { code: py`from dataclasses import dataclass, KW_ONLY


@dataclass
class Request:
    url: str
    _: KW_ONLY                 # everything below must be passed by keyword
    timeout: float = 5.0
    retries: int = 3


Request("https://example.com", retries=1)     # OK
# Request("https://example.com", 2.0)         # TypeError: too many positional arguments`, lang: 'python', title: 'KW_ONLY or kw_only=True' },
    py`#### Helper functions`,
    { code: py`from dataclasses import dataclass, asdict, astuple, replace, fields, is_dataclass


@dataclass(frozen=True)
class Point:
    x: int
    y: int


p = Point(1, 2)
print(asdict(p))                    # {'x': 1, 'y': 2}
print(astuple(p))                   # (1, 2)
print(replace(p, y=5))              # Point(x=1, y=5) — a NEW object
print([f.name for f in fields(p)])  # ['x', 'y']
print(is_dataclass(p))              # True`, lang: 'python', title: 'asdict, astuple, replace, fields' },
    py`#### Init-only values: \`InitVar\``,
    { code: py`from dataclasses import dataclass, InitVar


@dataclass
class Temperature:
    celsius: float
    unit: InitVar[str] = "C"       # passed to __init__ and __post_init__, never stored

    def __post_init__(self, unit):
        if unit == "F":
            self.celsius = (self.celsius - 32) * 5 / 9


print(Temperature(212, "F"))       # Temperature(celsius=100.0)`, lang: 'python', title: 'InitVar parameters go to __post_init__' },
    py`Dataclasses also work with [structural pattern matching](lesson:match-statement): the generated \`__match_args__\` lets you write \`case Point(x, 0):\`.`,
  ],
  walkthrough: {
    title: 'Reading the order program',
    lang: 'python',
    code: SHOP,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [4, 8], text: py`\`Product\` is a **frozen** dataclass: three required fields and no methods of our own. It gets \`__init__\`, \`__repr__\`, \`__eq__\` — and, because it is frozen and compares by value, a \`__hash__\` too.` },
      { lines: [11, 14], text: py`\`OrderLine\` holds a product and a quantity. \`quantity: int = 1\` gives that parameter a default, so it must come after the required \`product\` field.` },
      { lines: [16, 18], text: py`The generated \`__init__\` assigns the fields and then calls \`__post_init__\`. That's where validation belongs: a quantity of 0 is refused with a clear \`ValueError\`.` },
      { lines: [20, 22], text: py`Properties and methods work exactly as in any class. \`subtotal\` is computed from the fields each time you read it.` },
      { lines: [25, 28], text: py`\`field(default_factory=list)\` calls \`list()\` for each new \`Order\`, so every order has its own list of lines. Writing \`= []\` here would raise \`ValueError\` when the class is created.` },
      { lines: [37, 45], text: py`Building and printing an order. The repr is generated recursively: \`Order(...)\` shows its lines, each line shows its \`Product(...)\`.` },
      { lines: [47, 49], text: py`\`==\` compares field by field, so a separately built product with the same data is equal. \`replace()\` returns a **new** frozen product with one field changed; the original keeps its price.` },
      { lines: [50, 53], text: py`\`asdict()\` turns the whole object tree into plain dicts and lists — ready for \`json.dumps\`. The second order starts with its own empty list.` },
    ],
  },
  playground: {
    title: 'Online shop order',
    objective: 'Run it, read each line of output, then add validation, ordering and a hidden field to the dataclasses.',
    files: { 'main.py': SHOP },
    expected: py`Six lines (the first is long because the repr is recursive):

\`\`\`text
Order(customer='Ada', lines=[OrderLine(product=Product(sku='P-01', name='Gel pen', price=1.25), quantity=4), OrderLine(product=Product(sku='N-07', name='Notebook', price=3.5), quantity=1)])
Total: 8.5
True
Product(sku='P-01', name='Gel pen', price=0.99) | original: 1.25
{'product': {'sku': 'P-01', 'name': 'Gel pen', 'price': 1.25}, 'quantity': 4}
Ben's lines: []
\`\`\``,
    experiments: [
      {
        id: 'no-negative-prices',
        task: py`Products with a negative price shouldn't exist. Add a \`__post_init__\` method to \`Product\` that raises \`ValueError\` when \`price\` is below 0.`,
        hint: py`Inside \`Product\`, add \`def __post_init__(self):\` and \`if self.price < 0: raise ValueError("price cannot be negative")\`. Reading fields is fine on a frozen class — only assigning is blocked.`,
        tests: [
          { name: 'a negative price raises ValueError', code: py`with raises(ValueError):
    Product("X-1", "Broken", -1.0)` },
          { name: 'normal products still work', code: py`assert Product("A-1", "Eraser", 0.5).price == 0.5` },
        ],
        explain: py`The generated \`__init__\` sets every field and then calls \`__post_init__\` if you defined one. Raising there means an invalid \`Product\` can never be created — the error appears at the line that tried to build it, not later when the bad price breaks a total.`,
      },
      {
        id: 'sortable',
        task: py`Make products sortable: change the decorator to \`@dataclass(frozen=True, order=True)\`. Then predict: is \`pad < pen\` true or false? (Remember the field order: sku, name, price.)`,
        hint: py`\`order=True\` compares the fields as a tuple, in definition order. The first field is \`sku\`: \`"N-07"\` vs \`"P-01"\`.`,
        tests: [{ name: 'products can be compared with <', code: py`assert pad < pen
assert sorted([pen, pad]) == [pad, pen]` }],
        explain: py`\`order=True\` generates \`__lt__\`, \`__le__\`, \`__gt__\` and \`__ge__\` that compare \`(sku, name, price)\` tuples. \`"N-07" < "P-01"\`, so the notebook sorts first — even though it's more expensive. If you want to sort by price, use \`sorted(products, key=lambda p: p.price)\` instead of relying on field order.`,
      },
      {
        id: 'secret-coupon',
        task: py`Add a field \`coupon\` to \`Order\` that defaults to \`None\` and is **hidden from the repr** (coupon codes shouldn't end up in logs).`,
        hint: py`It has a default, so it goes after \`lines\`: \`coupon: str | None = field(default=None, repr=False)\`.`,
        tests: [{ name: 'coupon is stored but not printed', code: py`o = Order("Cy", coupon="SECRET10")
assert o.coupon == "SECRET10"
assert "SECRET10" not in repr(o), 'Use field(default=None, repr=False)'` }],
        explain: py`\`field(repr=False)\` keeps the field in \`__init__\` and \`__eq__\` but leaves it out of \`__repr__\`. It's a simple way to keep passwords, tokens and personal data out of log lines and error messages (though it is not a security boundary — \`asdict()\` still includes it).`,
      },
      {
        id: 'shared-list',
        task: py`Break it on purpose: change \`lines: list[OrderLine] = field(default_factory=list)\` to \`lines: list[OrderLine] = []\` and run. Read the error, then put the \`default_factory\` back.`,
        hint: py`The error appears before any order is created — while the class itself is being built.`,
        explain: py`You get \`ValueError: mutable default <class 'list'> for field lines is not allowed: use default_factory\`. A default value is created **once** and stored on the class, so every order would share one list. Dataclasses refuse unhashable defaults (lists, dicts, sets) to save you from that bug; \`default_factory\` creates a fresh list per object.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Hand-written class vs dataclass',
    props: {
      left: {
        label: 'Hand-written: every field typed 4+ times',
        lang: 'python',
        code: py`class Player:
    def __init__(self, name, score=0, badges=None):
        self.name = name
        self.score = score
        self.badges = [] if badges is None else badges

    def __repr__(self):
        return (f"Player(name={self.name!r}, "
                f"score={self.score!r}, badges={self.badges!r})")

    def __eq__(self, other):
        if other.__class__ is not self.__class__:
            return NotImplemented
        return (self.name, self.score, self.badges) == (
            other.name, other.score, other.badges)`,
      },
      right: {
        label: '@dataclass: every field typed once',
        lang: 'python',
        code: py`from dataclasses import dataclass, field


@dataclass
class Player:
    name: str
    score: int = 0
    badges: list[str] = field(default_factory=list)`,
      },
      points: [
        'Both classes behave the same: same constructor, same repr, same value-based ==.',
        'Adding a field is one line on the right; on the left you must edit __init__, __repr__ and __eq__ and not forget any of them.',
        'The generated __eq__ returns NotImplemented for objects of other classes, exactly like the careful hand-written version.',
        'Both are unhashable: defining __eq__ without __hash__ sets __hash__ to None. Use frozen=True on the dataclass to get a matching __hash__.',
        'The dataclass also records its fields (dataclasses.fields()), which powers asdict(), replace() and type-checker support.',
      ],
    },
    alt: 'Side-by-side code. Left: a hand-written Player class with an __init__ handling a None default for badges, a __repr__ built with an f-string, and an __eq__ comparing tuples of fields. Right: the same class as a dataclass in five lines with name, score and badges fields. Bullet points explain that both behave the same, but the dataclass lists each field only once.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`@dataclass\` runs **once**, when the class is defined — not every time you create an object. It reads the class's annotations in order, builds a description of each field, writes the methods, and attaches them to your class. After that, creating an instance is just calling a normal \`__init__\`.`,
      { code: py`import inspect
from dataclasses import dataclass, fields


@dataclass
class Player:
    name: str
    score: int = 0


print(inspect.signature(Player))         # (name: str, score: int = 0) -> None
print([f.name for f in fields(Player)])  # ['name', 'score']
print(Player.__eq__)                     # a real function, attached to the class`, lang: 'python', title: 'you can inspect what was generated' },
      py`Because the methods are ordinary, everything you know about classes still applies: you can add methods and properties, inherit from a dataclass, and override any generated method by writing your own.`,
    ],
    technical: [
      py`**Finding fields.** The decorator reads the class's annotations. A name annotated with \`typing.ClassVar[...]\` is a class variable, not a field; one annotated with \`InitVar[...]\` becomes an \`__init__\` parameter passed to \`__post_init__\` but is never stored. A plain class attribute without an annotation is ignored. Inherited fields come first, in base-class order.`,
      py`**Defaults.** A simple default (\`score: int = 0\`) stays on the class as a class attribute and becomes the parameter default. That is fine for immutable values, but a list default would be one list shared by every instance — the same trap as [mutable default arguments](lesson:function-arguments). So the decorator raises \`ValueError\` for **unhashable** defaults (\`list\`, \`dict\`, \`set\` and friends), using "unhashable" as a cheap stand-in for "mutable" (3.11+; earlier versions only checked for \`list\`, \`dict\` and \`set\` exactly). \`default_factory\` stores a function that \`__init__\` calls for each object instead.`,
      py`**Equality and hashing.** The generated \`__eq__\` returns \`NotImplemented\` unless \`other\` is the *same class*, then compares the field tuples. The \`__hash__\` rules follow the [data model](lesson:special-methods): objects that compare equal must hash equal, and a mutable object's hash must not change. So:`,
      py`| \`eq\` | \`frozen\` | \`unsafe_hash\` | result |
|---|---|---|---|
| \`True\` (default) | \`False\` | \`False\` | \`__hash__ = None\` → instances are **unhashable** |
| \`True\` | \`True\` | \`False\` | \`__hash__\` generated from the fields |
| \`False\` | – | \`False\` | \`__hash__\` inherited from \`object\` (identity) |
| any | any | \`True\` | \`__hash__\` generated anyway — only safe if you never mutate after hashing |`,
      py`**Frozen.** \`frozen=True\` adds \`__setattr__\` and \`__delattr__\` methods that raise \`FrozenInstanceError\`. The generated \`__init__\` sidesteps them with \`object.__setattr__\`, which is also the documented escape hatch for setting a derived field inside \`__post_init__\` of a frozen class. Freezing is **shallow**: a frozen object holding a list can't swap the list, but the list itself can still be appended to.`,
      py`**Slots.** \`__slots__\` must exist when a class is *created*, so \`slots=True\` can't just patch your class — the decorator builds and returns a **new class** with \`__slots__\` and the same fields. Instances then have no \`__dict__\`, so you can't add stray attributes. See [records & slots](lesson:records-and-slots) and [attribute access](lesson:attribute-access).`,
      { callout: 'note', title: 'Implementation detail', text: py`CPython's \`dataclasses\` module is plain Python. It builds the source code of \`__init__\`, \`__repr__\`, \`__eq__\` and friends as text and compiles it with \`exec()\` when your class is decorated — that's why the generated methods run as fast as hand-written ones, and why the tracer can't step into them. Other implementations may generate them differently; only the behaviour is specified.` },
      { callout: 'version', title: '3.14: lazy annotations', text: py`Since Python 3.14 annotations are evaluated lazily (PEP 649/749). The decorator only needs to know *which* names are fields (and spot \`ClassVar\`/\`InitVar\`), so it reads annotations in a format that tolerates names defined later in the file — a field annotated with a class declared further down no longer needs quotes.` },
    ],
    production: [
      py`**Dataclasses don't validate types.** At a trust boundary (HTTP requests, config files, user input) either validate in \`__post_init__\` or use a library built for parsing, such as *pydantic* or *attrs* with validators. Inside your program, rely on a type checker. See [input validation](lesson:input-validation).`,
      { code: py`# third-party (pip install pydantic) — shown for comparison, not runnable here
from pydantic import BaseModel

class Product(BaseModel):
    sku: str
    price: float

Product(sku="P-01", price="1.25")   # converts "1.25" to 1.25
Product(sku="P-01", price="cheap")  # raises ValidationError`, lang: 'python', static: true, title: 'pydantic validates and converts at runtime' },
      py`**Prefer \`frozen=True\` for values** — money, coordinates, IDs, configuration. Frozen objects can be dict keys and set members, can be shared between parts of the program (and threads) without defensive copies, and "changing" them is explicit with \`replace()\` (or \`copy.replace()\` on 3.13+). Store \`tuple\`s rather than \`list\`s inside them so the freeze goes all the way down.`,
      py`**Use \`kw_only=True\` for classes with many fields.** \`Config(host="db", port=5432, timeout=3)\` survives a reordering of fields; \`Config("db", 5432, 3)\` silently breaks. It also fixes the classic inheritance error where a subclass adds a required field after a base field with a default.`,
      py`**Serialisation.** \`asdict()\` deep-copies recursively — convenient for small objects, but it walks the whole tree, so for large structures or hot paths build the dict you need yourself. JSON can't encode \`datetime\`, \`Decimal\` or enums by default; convert them explicitly ([JSON](lesson:json-data), [serialization](lesson:serialization)).`,
      py`**Static tooling.** mypy and pyright understand \`@dataclass\` natively and check constructor calls. Libraries that create dataclass-like classes (attrs, pydantic, SQLAlchemy models) use \`typing.dataclass_transform\` (PEP 681) so checkers treat them the same way.`,
    ],
  },
  mistakes: [
    {
      title: 'A mutable default value',
      wrong: { code: py`from dataclasses import dataclass


@dataclass
class Playlist:
    name: str
    songs: list = []    # ValueError when the class is created`, lang: 'python', static: true },
      right: { code: py`from dataclasses import dataclass, field


@dataclass
class Playlist:
    name: str
    songs: list[str] = field(default_factory=list)`, lang: 'python' },
      explanation: py`A default is evaluated once and shared by every instance. Dataclasses refuse unhashable defaults to save you from shared-list bugs. \`default_factory\` takes a function (here \`list\`) and calls it for each new object.`,
    },
    {
      title: 'Expecting the annotations to be enforced',
      wrong: { code: py`from dataclasses import dataclass


@dataclass
class Player:
    name: str
    score: int = 0


p = Player(name=42, score="lots")   # no error!
print(p)`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass


@dataclass
class Player:
    name: str
    score: int = 0

    def __post_init__(self):
        if not isinstance(self.score, int):
            raise TypeError(f"score must be an int, got {type(self.score).__name__}")`, lang: 'python' },
      explanation: py`Annotations describe intent; the dataclass machinery uses them only to find fields. Use a type checker during development and explicit checks (or a validation library) where untrusted data enters.`,
    },
    {
      title: 'Forgetting the annotation',
      wrong: { code: py`from dataclasses import dataclass


@dataclass
class Player:
    name: str
    score = 0          # no annotation: NOT a field


Player("Ada", 5)       # TypeError: takes 2 positional arguments but 3 were given`, lang: 'python', static: true },
      right: { code: py`from dataclasses import dataclass


@dataclass
class Player:
    name: str
    score: int = 0`, lang: 'python' },
      explanation: py`Without \`: type\`, \`score\` is an ordinary class attribute. It won't appear in \`__init__\`, \`__repr__\` or \`__eq__\`. If you really want an untyped field, annotate it with \`typing.Any\`.`,
    },
    {
      title: 'Writing __init__ when you meant __post_init__',
      wrong: { code: py`from dataclasses import dataclass


@dataclass
class Account:
    owner: str
    balance: float = 0.0

    def __init__(self, owner, balance=0.0):   # replaces the generated one
        if balance < 0:
            raise ValueError("negative balance")
        self.owner = owner
        # forgot self.balance = balance!`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass


@dataclass
class Account:
    owner: str
    balance: float = 0.0

    def __post_init__(self):
        if self.balance < 0:
            raise ValueError("negative balance")`, lang: 'python' },
      explanation: py`If the class defines \`__init__\` itself, \`@dataclass\` keeps yours and doesn't call \`__post_init__\`. You're back to hand-writing the assignments (and forgetting one). Keep the generated \`__init__\` and put extra logic in \`__post_init__\`.`,
    },
    {
      title: 'Thinking frozen means deeply immutable',
      wrong: { code: py`from dataclasses import dataclass


@dataclass(frozen=True)
class Team:
    name: str
    members: list[str]


t = Team("Owls", ["Ada"])
t.members.append("Ben")   # works: the list itself is mutable
print(t)`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass


@dataclass(frozen=True)
class Team:
    name: str
    members: tuple[str, ...]


t = Team("Owls", ("Ada",))
print(t, hash(t) == hash(Team("Owls", ("Ada",))))`, lang: 'python' },
      explanation: py`\`frozen=True\` stops you re-binding the *fields*; it can't stop the objects inside from changing. A frozen dataclass containing a list is also unhashable in practice (\`hash()\` fails on the list). Use tuples and frozensets inside frozen dataclasses.`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: mutable default <class 'list'> for field items is not allowed: use default_factory`,
      cause: py`A field has a list, dict or set (or another unhashable object) as its default.`,
      fix: py`Replace \`items: list = []\` with \`items: list = field(default_factory=list)\` (and \`dict\`/\`set\` likewise).`,
    },
    {
      symptom: py`TypeError: non-default argument 'y' follows default argument 'x'`,
      cause: py`A field without a default comes after a field with one — often because a subclass added a required field after a base class's defaulted field.`,
      fix: py`Reorder the fields, give the later one a default, or make fields keyword-only with \`kw_only=True\` / \`KW_ONLY\` (3.10+).`,
    },
    {
      symptom: py`dataclasses.FrozenInstanceError: cannot assign to field 'price'`,
      cause: py`Assigning to a field of a frozen dataclass — including inside \`__post_init__\`.`,
      fix: py`Create a modified copy with \`replace(obj, price=…)\`. To set a derived field during \`__post_init__\` of a frozen class, use \`object.__setattr__(self, "area", value)\`, or make it a \`@property\`.`,
    },
    {
      symptom: py`TypeError: unhashable type: 'Player'`,
      cause: py`A normal (non-frozen) dataclass has \`__hash__ = None\` because it defines \`__eq__\` and is mutable, so it can't go in a set or be a dict key.`,
      fix: py`Use \`frozen=True\` for value objects, or key the dict by an immutable field (\`players[p.name]\`).`,
    },
    {
      symptom: py`TypeError: '<' not supported between instances of 'Version' and 'Version'`,
      cause: py`\`sorted()\`, \`min()\`, \`max()\` or \`<\` on dataclasses without \`order=True\`.`,
      fix: py`Add \`order=True\` (compares fields in order) or pass \`key=\` to \`sorted\`, e.g. \`sorted(items, key=lambda v: v.price)\`.`,
    },
    {
      symptom: py`AttributeError: 'Point' object has no attribute 'z' and no __dict__ for setting new attributes`,
      cause: py`The dataclass uses \`slots=True\`, so instances can't grow new attributes (often a typo like \`p.lenght = 3\`).`,
      fix: py`Fix the typo, or declare the attribute as a field. This error is a feature: it catches misspelt attribute names.`,
    },
  ],
  bestPractices: [
    'Reach for @dataclass whenever a class mainly holds data; keep plain classes for objects that are mostly behaviour.',
    'Use field(default_factory=list/dict/set) for every mutable default.',
    'Make value objects frozen=True, store tuples (not lists) inside them, and "modify" them with replace().',
    'Validate in __post_init__; never re-write __init__ by hand in a dataclass.',
    'Use kw_only=True (3.10+) when a class has more than three or four fields, so call sites name every argument.',
    'Hide secrets and huge values from logs with field(repr=False); exclude caches from equality with field(compare=False).',
    'Prefer sorted(key=...) over order=True unless the field order really is the natural order of your values.',
  ],
  useCases: [
    'Value objects: Money, Point, DateRange, Version — usually frozen.',
    'Records loaded from CSV/JSON rows or database queries, before they flow through your program.',
    'Configuration objects with defaults (frozen, keyword-only).',
    'Messages and events passed between parts of an application (OrderPlaced, UserSignedUp).',
    'Test fixtures: readable, comparable objects whose failures print every field.',
  ],
  whenToUse: {
    use: [
      'A class whose main job is to group named fields.',
      'You want readable repr output and value-based equality for free.',
      'You want immutability and hashability with one flag (frozen=True).',
    ],
    avoid: [
      'Untrusted input that needs parsing and type conversion — use a validation layer (or pydantic) in front.',
      'Classes that are mostly behaviour with little state (services, controllers) — the generated methods add nothing.',
      'When you need a tuple anyway (unpacking, positional access): a NamedTuple fits better — see records & slots.',
    ],
  },
  comparison: {
    title: 'What each decorator option changes',
    headers: ['option', 'default', 'effect', 'since'],
    rows: [
      ['init', 'True', 'generates __init__ from the fields (skipped if you write your own)', '3.7'],
      ['repr', 'True', 'generates __repr__ listing every field with repr=True', '3.7'],
      ['eq', 'True', 'generates __eq__ comparing field tuples of the same class; sets __hash__ to None unless frozen', '3.7'],
      ['order', 'False', 'adds <, <=, >, >= comparing field tuples in definition order', '3.7'],
      ['frozen', 'False', 'assigning or deleting fields raises FrozenInstanceError; with eq, generates __hash__', '3.7'],
      ['unsafe_hash', 'False', 'forces a field-based __hash__ even when mutable', '3.7'],
      ['match_args', 'True', 'generates __match_args__ for positional patterns in match/case', '3.10'],
      ['kw_only', 'False', 'makes every field keyword-only in __init__', '3.10'],
      ['slots', 'False', 'returns a new class with __slots__ (no per-instance __dict__)', '3.10'],
      ['weakref_slot', 'False', 'with slots=True, adds a __weakref__ slot so instances can be weakly referenced', '3.11'],
    ],
    note: py`Per-field control lives in \`field()\`: \`default\`, \`default_factory\`, \`init\`, \`repr\`, \`compare\`, \`hash\`, \`kw_only\` and \`metadata\` (a read-only dict for your own tools).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'dataclasses-q1',
      type: 'mcq',
      prompt: py`Which methods does a plain \`@dataclass\` (no options) generate?`,
      options: [
        { text: '__init__ only', why: 'It also generates __repr__ and __eq__ — that is most of the point.' },
        '__init__, __repr__ and __eq__',
        { text: '__init__, __repr__, __eq__ and __hash__', why: 'With eq=True and frozen=False it sets __hash__ to None, making instances unhashable. A hash is only generated with frozen=True (or unsafe_hash=True).' },
        { text: '__init__, __repr__, __eq__ and __lt__', why: 'Ordering methods need order=True.' },
      ],
      answer: 1,
      explanation: py`The defaults are \`init=True, repr=True, eq=True, order=False, frozen=False\`. Because \`__eq__\` is defined and the object is mutable, \`__hash__\` is set to \`None\`.`,
    },
    {
      id: 'dataclasses-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    password: str = field(repr=False)

u = User("ada", "hunter2")
print(u)
print(u == User("ada", "hunter2"))`,
      options: [
        { text: "User(name='ada', password='hunter2')\nTrue", why: 'field(repr=False) removes the field from the generated __repr__.' },
        "User(name='ada')\nTrue",
        { text: "User(name='ada')\nFalse", why: 'repr=False only affects the repr. The password still takes part in == (compare=True by default), and both passwords match.' },
        { text: 'TypeError', why: 'A field with field(repr=False) and no default is still a normal required field.' },
      ],
      answer: 1,
      explanation: py`\`repr=False\` hides the field from \`__repr__\` only. It's still an \`__init__\` parameter and still compared by \`__eq__\`.`,
    },
    {
      id: 'dataclasses-q3',
      type: 'bug',
      prompt: 'Python raises an error as soon as this class is defined. Click the line responsible.',
      code: py`from dataclasses import dataclass

@dataclass
class Playlist:
    name: str
    songs: list = []

    def add(self, song):
        self.songs.append(song)`,
      answerLine: 6,
      explanation: py`\`songs: list = []\` raises \`ValueError: mutable default <class 'list'> for field songs is not allowed: use default_factory\`. Use \`songs: list = field(default_factory=list)\`.`,
    },
    {
      id: 'dataclasses-q4',
      type: 'fill',
      prompt: 'Complete the field so every `Basket` gets its own, fresh empty list.',
      code: py`from dataclasses import dataclass, field

@dataclass
class Basket:
    owner: str
    items: list[str] = ___(default_factory=___)`,
      answer: [['field'], ['list']],
      explanation: py`\`field(default_factory=list)\` stores the *function* \`list\`; the generated \`__init__\` calls it once per object. (A \`lambda: []\` would also work, but \`list\` is the idiom.)`,
    },
    {
      id: 'dataclasses-q5',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: int
    y: int

seen = {Point(1, 2), Point(1, 2), Point(2, 1)}
print(len(seen))`,
      answer: '2',
      explanation: py`A frozen dataclass gets a \`__hash__\` built from its fields, consistent with its value-based \`__eq__\`. The two \`Point(1, 2)\` objects are equal, so the set keeps only one of them.`,
    },
    {
      id: 'dataclasses-q6',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from dataclasses import dataclass

@dataclass(order=True)
class Version:
    major: int
    minor: int
    label: str = ""

print(max([Version(1, 4), Version(2, 0, "beta"), Version(2, 0)]))`,
      options: [
        { text: 'Version(major=2, minor=0, label=\'\')', why: 'The label is compared too: "" < "beta", so the beta version counts as larger.' },
        "Version(major=2, minor=0, label='beta')",
        { text: 'Version(major=1, minor=4, label=\'\')', why: 'Fields are compared in order: major first, and 2 > 1.' },
        { text: 'TypeError', why: 'order=True generates the comparison methods max() needs.' },
      ],
      answer: 1,
      explanation: py`\`order=True\` compares \`(major, minor, label)\` tuples. Both 2.0 versions tie on the numbers, then \`"beta" > ""\` decides. That's a real bug in naive version sorting — which is why ordering by field order needs thought (exclude a field with \`field(compare=False)\`).`,
    },
    {
      id: 'dataclasses-q7',
      type: 'short',
      prompt: 'Why should validation in a dataclass go in `__post_init__` rather than in a hand-written `__init__`?',
      answer: py`If you write your own \`__init__\`, \`@dataclass\` keeps it instead of generating one, so you have to assign every field yourself (and keep it in sync when fields change), and \`__post_init__\` is no longer called. \`__post_init__\` runs after the generated \`__init__\` has set all the fields, so you only write the extra checks and derived values.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'book-record',
      title: 'A book record',
      difficulty: 'intermediate',
      prompt: py`Turn \`Book\` into a dataclass with these fields, in this order:

- \`title: str\`
- \`author: str\`
- \`pages: int\`
- \`tags: list[str]\` — defaults to a **new empty list** for every book

Keep the method \`is_long()\` but make it return \`True\` when the book has **400 pages or more**.

The tests check that:
- \`repr(Book("Dune", "Frank Herbert", 412))\` is exactly \`Book(title='Dune', author='Frank Herbert', pages=412, tags=[])\`
- two books with the same data are equal (\`==\`)
- adding a tag to one book does not change another book's tags
- \`is_long()\` works on both sides of 400`,
      files: {
        'main.py': py`from dataclasses import dataclass, field


# TODO: make Book a dataclass with title, author, pages and tags
class Book:
    def is_long(self):
        return False


print("Book is ready to be built")
`,
      },
      hints: [
        'Put @dataclass above the class and declare each field as an annotated class attribute: title: str.',
        'A list default needs field(default_factory=list) — a plain [] raises ValueError.',
        'tags: list[str] = field(default_factory=list), and is_long returns self.pages >= 400.',
      ],
      solution: {
        explanation: py`\`@dataclass\` generates \`__init__(self, title, author, pages, tags=<new list>)\`, a \`__repr__\` that lists all four fields, and an \`__eq__\` that compares them in order. \`field(default_factory=list)\` calls \`list()\` for each book, so tags are never shared. The method is unchanged except for its logic — dataclasses are ordinary classes, and methods work as usual.`,
        files: {
          'main.py': py`from dataclasses import dataclass, field


@dataclass
class Book:
    title: str
    author: str
    pages: int
    tags: list[str] = field(default_factory=list)

    def is_long(self):
        return self.pages >= 400


dune = Book("Dune", "Frank Herbert", 412)
dune.tags.append("sci-fi")
print(dune)
print(dune.is_long())
`,
        },
      },
      tests: [
        { name: 'repr shows all four fields', code: py`assert repr(Book("Dune", "Frank Herbert", 412)) == "Book(title='Dune', author='Frank Herbert', pages=412, tags=[])"` },
        { name: 'books with the same data are equal', code: py`assert Book("Emma", "Jane Austen", 474) == Book("Emma", "Jane Austen", 474)
assert Book("Emma", "Jane Austen", 474) != Book("Emma", "Jane Austen", 475)` },
        { name: 'each book has its own tags list', code: py`a = Book("A", "X", 10)
b = Book("B", "Y", 20)
a.tags.append("new")
assert b.tags == [], 'Use field(default_factory=list) so books do not share one list'` },
        { name: 'is_long() uses 400 pages as the limit', code: py`assert Book("Big", "Z", 400).is_long() is True
assert Book("Small", "Z", 399).is_long() is False` },
      ],
    },
    {
      id: 'frozen-money',
      title: 'Immutable money',
      difficulty: 'intermediate',
      prompt: py`\`Money\` should be a **value object**: frozen, hashable and always valid.

1. Make it \`@dataclass(frozen=True)\` with fields \`cents: int\` and \`currency: str = "EUR"\`.
2. Add \`__post_init__\` that raises \`ValueError\` if \`cents\` is negative, or if \`currency\` is not exactly **3 uppercase letters** (\`"EUR"\` ✓, \`"eur"\` ✗, \`"EURO"\` ✗).
3. Add \`add(self, other)\` that returns a **new** \`Money\` with the cents summed. Raise \`ValueError\` if the currencies differ.
4. Add \`__str__\` returning the amount with two decimals and the currency: \`str(Money(1250))\` → \`"12.50 EUR"\`.

Tests check: assigning \`m.cents = 5\` raises \`FrozenInstanceError\`; equal amounts hash equal (a set of two \`Money(100)\` has length 1); the validation; \`add\` leaves both originals unchanged; and the \`__str__\` format.`,
      files: {
        'main.py': py`from dataclasses import dataclass


@dataclass
class Money:
    cents: int
    currency: str = "EUR"

    # TODO: make the class frozen, validate in __post_init__,
    # and add add() and __str__()


print(Money(1250))
`,
      },
      hints: [
        'frozen=True goes in the decorator. Reading fields inside __post_init__ is fine; only assigning is blocked.',
        'For the currency check: len(self.currency) == 3 and self.currency.isalpha() and self.currency.isupper().',
        'In add(): if other.currency != self.currency: raise ValueError(...); return Money(self.cents + other.cents, self.currency). For __str__: f"{self.cents / 100:.2f} {self.currency}".',
      ],
      solution: {
        explanation: py`\`frozen=True\` blocks assignment after construction and, together with the generated \`__eq__\`, gives \`Money\` a field-based \`__hash__\` — so equal amounts collapse in a set. \`__post_init__\` runs after the fields are set, so every \`Money\` that exists has passed validation. \`add\` never mutates: it returns a new object, which is the only way to "change" a frozen value. \`__str__\` is for humans; the generated \`__repr__\` stays available for debugging.`,
        files: {
          'main.py': py`from dataclasses import dataclass


@dataclass(frozen=True)
class Money:
    cents: int
    currency: str = "EUR"

    def __post_init__(self):
        if self.cents < 0:
            raise ValueError(f"cents cannot be negative: {self.cents}")
        if not (len(self.currency) == 3 and self.currency.isalpha() and self.currency.isupper()):
            raise ValueError(f"currency must be 3 uppercase letters: {self.currency!r}")

    def add(self, other):
        if other.currency != self.currency:
            raise ValueError(f"cannot add {other.currency} to {self.currency}")
        return Money(self.cents + other.cents, self.currency)

    def __str__(self):
        return f"{self.cents / 100:.2f} {self.currency}"


lunch = Money(1250)
print(lunch, "+ tip =", lunch.add(Money(150)))
print(repr(lunch))
`,
        },
      },
      tests: [
        { name: 'Money is frozen', code: py`from dataclasses import FrozenInstanceError
m = Money(100)
with raises(FrozenInstanceError):
    m.cents = 5` },
        { name: 'equal amounts are equal and hash equal', code: py`assert Money(100) == Money(100, "EUR")
assert len({Money(100), Money(100)}) == 1` },
        { name: 'negative cents are rejected', code: py`with raises(ValueError):
    Money(-1)` },
        { name: 'bad currency codes are rejected', code: py`for bad in ["eur", "EURO", "E1R", ""]:
    with raises(ValueError):
        Money(100, bad)` },
        { name: 'add() returns a new Money and leaves both unchanged', code: py`a, b = Money(1000), Money(250)
total = a.add(b)
assert total == Money(1250)
assert a == Money(1000) and b == Money(250)` },
        { name: 'add() refuses mixed currencies', code: py`with raises(ValueError):
    Money(100, "EUR").add(Money(100, "USD"))` },
        { name: 'str() shows two decimals and the currency', code: py`assert str(Money(1250)) == "12.50 EUR"
assert str(Money(5, "USD")) == "0.05 USD"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'dataclasses-what-generated',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a dataclass, and what does @dataclass actually do?',
      answer: 'A normal class decorated with @dataclass. When the class is defined, the decorator reads the annotated class attributes (the fields) and generates __init__, __repr__ and __eq__ from them; options add ordering, immutability, hashing, slots and keyword-only parameters.',
      explanation: py`It is code generation at class-creation time, not a new kind of object. The generated methods are ordinary functions attached to the class, and you can add your own methods, properties and base classes. Annotations are used to discover fields but are not enforced.`,
      whyAsked: 'Dataclasses are everywhere in modern Python codebases; interviewers check you know what they generate and what they do not (validation).',
      mistakes: ['Saying dataclasses check types at runtime', 'Thinking a dataclass is a different kind of object from a normal class', 'Claiming dataclasses are hashable by default'],
      followUps: ['Why is a default dataclass unhashable?', 'How would you validate fields?', 'How does a dataclass differ from a NamedTuple?'],
      modelAnswer: 'A dataclass is an ordinary class that I decorate with @dataclass. When Python creates the class, the decorator reads the annotated class attributes in order — those are the fields — and writes __init__, __repr__ and __eq__ for me, so each field is declared once instead of being repeated in three methods. Options add more: order=True for comparisons, frozen=True for immutability plus a hash, slots=True and kw_only=True since 3.10. It does not validate types — annotations are only used to find the fields — so I validate in __post_init__ or at the boundary. Otherwise it is a normal class: methods, properties and inheritance all work.',
    },
    {
      id: 'dataclasses-mutable-default',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate writes `tags: list = []` in a dataclass and gets a ValueError. Why does Python refuse it, and what is the fix?',
      code: { lang: 'python', code: py`from dataclasses import dataclass, field


@dataclass
class Article:
    title: str
    tags: list[str] = field(default_factory=list)   # the fix


a, b = Article("A"), Article("B")
a.tags.append("python")
print(b.tags)   # []` },
      answer: 'A default is created once and shared by every instance, so a list default would be one list shared by all objects. Dataclasses reject unhashable defaults with ValueError; field(default_factory=list) calls list() per instance instead.',
      explanation: py`Defaults become class attributes and parameter defaults, evaluated once at class creation — the same reason \`def f(x=[])\` is a classic bug. Since 3.11 the check rejects any unhashable default (using unhashability as a proxy for mutability); before that it checked for list, dict and set. Note the check is a heuristic: a mutable but hashable object (like a plain class instance) slips through, so the rule of thumb is "anything mutable → default_factory".`,
      whyAsked: 'It links dataclasses to the mutable-default-argument trap and shows whether the candidate understands evaluation time.',
      mistakes: ['Using `field(default=[])` (same error)', 'Using None and fixing it in __post_init__ when default_factory is cleaner', 'Saying Python copies the default for each instance'],
      followUps: ['What does a function with def f(items=[]) do wrong?', 'How would you give each instance a default dict with preset keys?', 'Why is unhashability used as the test?'],
      modelAnswer: 'Default values are evaluated once, when the class is created, and then shared — so a list default would be one list that every instance appends to. Dataclasses protect you from that by refusing unhashable defaults like lists, dicts and sets with a ValueError. The fix is field(default_factory=list): the dataclass stores the function and the generated __init__ calls it for each new object, so every instance gets its own list. It is the same root cause as the def f(items=[]) bug, and the general rule is that anything mutable should come from a factory.',
    },
    {
      id: 'dataclasses-hash-rules',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Why can you not put a normal dataclass instance in a set, and what do frozen=True and unsafe_hash=True change?',
      options: [
        'Dataclasses never support hashing',
        'eq=True on a mutable class sets __hash__ to None; frozen=True generates a field-based hash; unsafe_hash=True forces one even though the object is mutable',
        'frozen=True only blocks assignment; hashing is controlled by order=True',
        'unsafe_hash=True makes hashing faster but less secure',
      ],
      correctOption: 1,
      answer: 'Equal objects must have equal hashes, and an object\'s hash must not change while it is in a set. A mutable dataclass with value equality cannot promise that, so eq=True sets __hash__ = None. frozen=True makes the fields read-only, so a hash from the fields is safe and is generated. unsafe_hash=True forces a field hash anyway — correct only if you never mutate those fields after hashing.',
      explanation: py`This mirrors the plain-class rule: defining \`__eq__\` without \`__hash__\` makes a class unhashable. If a mutable object were hashed by its fields and then mutated, it would sit in the wrong bucket of a set or dict, and lookups would silently fail. With \`eq=False\` the dataclass keeps \`object.__hash__\` (identity). \`field(hash=False)\` or \`compare=False\` removes individual fields from the hash.`,
      whyAsked: 'Tests understanding of the hash/eq contract, which matters for dict keys, caching and sets.',
      mistakes: ['Saying frozen objects are "more secure"', 'Using unsafe_hash=True to silence the error on a mutable class', 'Forgetting that a frozen dataclass holding a list still fails to hash'],
      followUps: ['What breaks if you mutate a key after inserting it in a dict?', 'How would you hash a frozen dataclass that contains a list?', 'What does functools.lru_cache require of its arguments?'],
      modelAnswer: 'The rule is that objects that compare equal must have equal hashes, and an object\'s hash must not change while it is in a set or used as a dict key. A normal dataclass compares by its fields but is mutable, so a field-based hash could change under the set\'s feet; the decorator therefore sets __hash__ to None and the instances are unhashable. With frozen=True the fields can no longer be reassigned, so it generates a hash from the fields. unsafe_hash=True forces a field-based hash on a mutable class — that is only safe if I guarantee I never mutate the object after hashing, so I almost never use it. For value objects I just use frozen=True and keep tuples inside.',
    },
    {
      id: 'dataclasses-vs-alternatives',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare @dataclass, typing.NamedTuple and pydantic models. When would you pick each?',
      answer: 'NamedTuple: an immutable tuple with names — positional access, unpacking, very light, no validation. Dataclass: a normal class with generated methods — mutable or frozen, methods, defaults, inheritance, no validation. Pydantic: a third-party model that parses and validates input at runtime — use at trust boundaries (APIs, config).',
      explanation: py`Choose by need: tuple behaviour (unpacking, being a tuple) → NamedTuple; an internal domain object → dataclass; untrusted external data → a validation library. They mix well: parse input with pydantic, then hand dataclasses to the rest of the program. More detail in [records & slots](lesson:records-and-slots).`,
      whyAsked: 'Senior engineers are expected to pick the right record type and explain trade-offs, not just know one tool.',
      mistakes: ['Saying NamedTuple is "the old dataclass"', 'Using pydantic models deep inside domain logic for no reason', 'Forgetting that a NamedTuple compares equal to a plain tuple with the same values'],
      followUps: ['What surprising equality does a NamedTuple have?', 'How would you make a dataclass behave more like a tuple?', 'What is attrs and why does it still exist?'],
      modelAnswer: 'A NamedTuple is literally a tuple with field names: immutable, unpackable, cheap, but it also compares equal to any plain tuple with the same values, which can surprise you. A dataclass is a normal class with generated methods: I get defaults, methods, inheritance, and I choose mutable or frozen; I use it for internal domain objects. Neither validates types. At trust boundaries — an HTTP body or a config file — I use a validation library like pydantic, which converts and checks input and gives good error messages. A common design is pydantic at the edge and plain dataclasses inside.',
    },
    {
      id: 'dataclasses-config-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your service loads settings once at start-up and passes them everywhere. Bugs keep appearing because some code changes settings in place. How would you model the settings with dataclasses?',
      code: { lang: 'python', code: py`from dataclasses import dataclass, replace


@dataclass(frozen=True, kw_only=True)
class Settings:
    db_url: str
    timeout_seconds: float = 5.0
    allowed_hosts: tuple[str, ...] = ("localhost",)

    def __post_init__(self):
        if self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be positive")


base = Settings(db_url="sqlite:///app.db")
test_settings = replace(base, timeout_seconds=0.5)
print(base.timeout_seconds, test_settings.timeout_seconds)` },
      answer: 'A frozen, keyword-only dataclass with tuple (not list) fields and validation in __post_init__. Nobody can mutate it, it is hashable, tests derive variants with replace(), and invalid settings fail at start-up.',
      explanation: py`\`frozen=True\` turns accidental mutation into an immediate \`FrozenInstanceError\`. Tuples make the freeze deep. \`kw_only=True\` keeps call sites readable and order-independent. \`replace()\` creates modified copies for tests or per-request overrides without touching the shared object.`,
      whyAsked: 'Shared mutable configuration is a real source of production bugs; the answer shows design judgement, not just syntax.',
      mistakes: ['Keeping lists inside a frozen dataclass', 'Using a module-level dict for settings', 'Copying the settings defensively everywhere instead of making them immutable'],
      followUps: ['How would you load these from environment variables?', 'How would you validate URLs properly?', 'What about secrets in the repr?'],
      modelAnswer: 'I would make settings a frozen, keyword-only dataclass. Frozen means any code that tries to change a setting fails immediately with FrozenInstanceError instead of silently affecting everyone else. I would store collections as tuples so the immutability goes all the way down, validate values in __post_init__ so a bad config fails at start-up, and mark secrets with field(repr=False) so they don\'t end up in logs. Tests or special cases get their own copy with dataclasses.replace. That makes the settings a safe value that can be shared freely.',
    },
    {
      id: 'dataclasses-task-ordering',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write a `Task` dataclass that sorts by `priority` (lower first) and then by `title`, but where the `done` flag and the `notes` list do not affect ordering or equality.',
      answer: 'Use @dataclass(order=True), put priority and title first, and declare done and notes with field(..., compare=False); notes needs default_factory=list.',
      explanation: py`\`order=True\` compares the tuple of fields with \`compare=True\`, in definition order. Excluding \`done\` and \`notes\` with \`compare=False\` removes them from \`__eq__\` *and* the ordering methods, so ticking a task off doesn't change where it sorts or what it equals.`,
      starter: { files: { 'main.py': py`from dataclasses import dataclass, field


@dataclass
class Task:
    priority: int
    title: str
    done: bool = False
    notes: list[str] = field(default_factory=list)


tasks = [Task(2, "write tests"), Task(1, "fix bug"), Task(2, "deploy")]
print(tasks)
` } },
      tests: [
        { name: 'sorts by priority, then title', code: py`ordered = sorted([Task(2, "write tests"), Task(1, "fix bug"), Task(2, "deploy")])
assert [t.title for t in ordered] == ["fix bug", "deploy", "write tests"]` },
        { name: 'done does not affect equality', code: py`assert Task(1, "a", done=True) == Task(1, "a")` },
        { name: 'notes do not affect equality and are per task', code: py`a, b = Task(1, "a"), Task(1, "a")
a.notes.append("remember")
assert a == b and b.notes == []` },
      ],
      solution: { files: { 'main.py': py`from dataclasses import dataclass, field


@dataclass(order=True)
class Task:
    priority: int
    title: str
    done: bool = field(default=False, compare=False)
    notes: list[str] = field(default_factory=list, compare=False)


tasks = [Task(2, "write tests"), Task(1, "fix bug"), Task(2, "deploy")]
for task in sorted(tasks):
    print(task.priority, task.title)
` } },
      hints: ['order=True generates <, <=, >, >= from the fields in order.', 'field(compare=False) removes a field from both == and the ordering.'],
      whyAsked: 'Checks practical fluency with field() options, which come up constantly in real dataclass code.',
      mistakes: ['Writing __lt__ by hand', 'Forgetting that compare=False also removes the field from ==', 'Using order=True and then wondering why a later field breaks ties unexpectedly'],
      followUps: ['How would you sort by priority descending?', 'When would sorted(key=...) be better than order=True?'],
      modelAnswer: 'I would use @dataclass(order=True) and declare priority and title first, because the generated comparisons use the fields as a tuple in definition order. done and notes get field(compare=False) so they are excluded from both equality and ordering — notes also needs default_factory=list so tasks don\'t share one list. That way completing a task or adding notes never changes how it sorts. If the sort order varied by screen, I would skip order=True and pass a key function to sorted instead.',
    },
    {
      id: 'dataclasses-frozen-derived',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'This frozen dataclass crashes with FrozenInstanceError when created. Why, and what are the clean fixes?',
      code: { lang: 'python', code: py`from dataclasses import dataclass, field


@dataclass(frozen=True)
class Circle:
    radius: float
    area: float = field(init=False)

    def __post_init__(self):
        # self.area = 3.14159 * self.radius ** 2   # FrozenInstanceError!
        object.__setattr__(self, "area", 3.14159 * self.radius ** 2)


print(Circle(2.0))` },
      answer: 'Frozen dataclasses block every assignment through __setattr__, including the one in __post_init__. Either compute the value as a @property (no stored field), or set it with object.__setattr__(self, "area", ...) inside __post_init__, which is the documented escape hatch the generated __init__ uses too.',
      explanation: py`The frozen class overrides \`__setattr__\` to raise. The generated \`__init__\` itself uses \`object.__setattr__\` to bypass that during construction. A \`@property\` is usually simplest and keeps the data minimal; a stored field is useful when the value is expensive or must appear in the repr/equality. (\`functools.cached_property\` also works on frozen, non-slots dataclasses because it writes directly to the instance \`__dict__\`.)`,
      whyAsked: 'It reveals whether the candidate understands how frozen is implemented, not just that it exists.',
      mistakes: ['Removing frozen=True to make the error go away', 'Using unsafe_hash or a mutable class instead', 'Not knowing why object.__setattr__ works'],
      followUps: ['Does cached_property work with slots=True?', 'Is frozen a real guarantee — can determined code still mutate the object?'],
      modelAnswer: 'frozen=True is implemented by a __setattr__ that always raises FrozenInstanceError, and that applies inside __post_init__ too, so self.area = ... fails. The generated __init__ gets around it by calling object.__setattr__ directly, and I can do the same in __post_init__ for a derived field — that is documented and fine. Often a @property is cleaner, because the area is computed from the radius and there is no extra state to keep consistent. So frozen is a strong convention enforced by __setattr__, not a memory-level lock: object.__setattr__ can still bypass it, which is why it is used only during construction.',
    },
  ],

  takeaways: [
    '@dataclass reads annotated class attributes (fields) and generates __init__, __repr__ and __eq__ once, when the class is defined.',
    'Annotations are not checked at runtime — validate in __post_init__ or at the boundary.',
    'Mutable defaults raise ValueError; use field(default_factory=list).',
    'frozen=True blocks assignment and gives value objects a hash; "change" them with replace(). Freezing is shallow, so store tuples.',
    'A normal dataclass is unhashable because eq=True sets __hash__ to None.',
    'order=True compares fields as a tuple in definition order; exclude fields with field(compare=False).',
    'slots=True, kw_only=True and KW_ONLY are 3.10+; copy.replace() is 3.13+.',
  ],
}
