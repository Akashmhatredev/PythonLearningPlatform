// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CAFE_ORDERS = py`from collections.abc import Iterable, Mapping
from typing import Literal, NotRequired, TypedDict, get_args

Status = Literal["pending", "paid", "shipped"]


class Order(TypedDict):
    id: int
    items: list[str]
    total: float
    status: Status
    coupon: NotRequired[str]


def revenue(orders: Iterable[Order], status: Status = "paid") -> float:
    """Accepts ANY iterable of orders: list, tuple, generator..."""
    return sum(order["total"] for order in orders if order["status"] == status)


def find_order(orders: Iterable[Order], order_id: int) -> Order | None:
    for order in orders:
        if order["id"] == order_id:
            return order
    return None


def item_counts(orders: Iterable[Order]) -> dict[str, int]:
    """Returns a concrete dict, so callers can do anything with it."""
    counts: dict[str, int] = {}
    for order in orders:
        for item in order["items"]:
            counts[item] = counts.get(item, 0) + 1
    return counts


def basket_price(prices: Mapping[str, float], items: Iterable[str]) -> float:
    return sum(prices[item] for item in items)


orders: list[Order] = [
    {"id": 1, "items": ["latte", "bagel"], "total": 6.2, "status": "paid"},
    {"id": 2, "items": ["tea"], "total": 2.5, "status": "pending"},
    {"id": 3, "items": ["latte", "latte"], "total": 7.0, "status": "paid", "coupon": "TWOFOR1"},
]

print("paid revenue:", revenue(orders))
print("pending revenue:", revenue(orders, "pending"))
print("item counts:", item_counts(orders))

found = find_order(orders, 3)
if found is not None:                   # narrows Order | None to Order
    print("order 3 coupon:", found.get("coupon", "none"))
print("order 99:", find_order(orders, 99))

menu = {"latte": 3.1, "bagel": 3.1, "tea": 2.5}
print("basket:", basket_price(menu, ["tea", "bagel"]))
print("statuses:", get_args(Status))
print("an Order is a", type(orders[0]).__name__)
`

export default {
  id: 'typing-collections-and-unions',
  title: 'Optional, unions, collections & TypedDict',
  summary: 'Describe real data precisely: typed lists, dicts and tuples, "this or None" with X | None, fixed choices with Literal, dict shapes with TypedDict, and flexible parameters with collections.abc.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['type-hints', 'dictionaries', 'tuples-and-unpacking'],
  related: ['generics', 'protocols', 'static-type-checking', 'none-and-truthiness', 'iterators', 'json-data', 'dataclasses', 'enums', 'lambdas-and-higher-order'],
  tags: ['typing', 'list[int]', 'dict[str, float]', 'tuple', 'Optional', 'Union', 'X | None', 'Literal', 'Final', 'Any', 'object', 'Callable', 'Iterable', 'Sequence', 'Mapping', 'TypedDict', 'NotRequired', 'Required', 'type alias', 'type statement'],
  apis: [
    { name: 'list[T], dict[K, V], set[T], tuple[...]', summary: 'Built-in generic collection hints (3.9+).' },
    { name: 'X | Y, X | None', summary: 'Union types (3.10+): a value of type X or Y; X | None means "an X or None".' },
    { name: 'typing.Optional[X], typing.Union[X, Y]', summary: 'Older spellings of X | None and X | Y.' },
    { name: 'typing.Literal[...]', summary: 'Only these exact values: Literal["r", "w"].' },
    { name: 'typing.Final', summary: 'A name a type checker will not let you reassign.' },
    { name: 'typing.Any', summary: 'Opt out of type checking for a value: everything is allowed.' },
    { name: 'collections.abc.Callable[[A, B], R]', summary: 'A function taking A and B and returning R.' },
    { name: 'collections.abc.Iterable / Sequence / Mapping', summary: 'Abstract collection types for flexible parameters.' },
    { name: 'typing.TypedDict', summary: 'Describes a dict with fixed string keys and per-key value types.' },
    { name: 'typing.NotRequired / Required', summary: '3.11+: mark individual TypedDict keys as optional or required.' },
    { name: 'type Alias = ...', summary: '3.12+: the type statement declares a (lazily evaluated) type alias.' },
  ],
  docs: [
    { label: 'typing — special forms (Union, Optional, Literal, Final…)', url: 'https://docs.python.org/3/library/typing.html#special-forms' },
    { label: 'typing.TypedDict', url: 'https://docs.python.org/3/library/typing.html#typing.TypedDict' },
    { label: 'collections.abc — abstract base classes for containers', url: 'https://docs.python.org/3/library/collections.abc.html' },
    { label: 'PEP 604 — union types as X | Y', url: 'https://peps.python.org/pep-0604/' },
    { label: 'PEP 655 — Required and NotRequired for TypedDict', url: 'https://peps.python.org/pep-0655/' },
    { label: 'mypy — type hints cheat sheet', url: 'https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [type hints: the basics](lesson:type-hints) you labelled simple values: \`int\`, \`str\`, \`float\`. Real programs pass around *structures*: a list of prices, a dict of stock levels, "a user **or** nothing", a status that can only be \`"paid"\` or \`"pending"\`. This lesson gives you the vocabulary to describe them.`,
    { code: py`from typing import Literal, TypedDict


class Order(TypedDict):
    id: int
    items: list[str]                         # a list whose items are str
    status: Literal["pending", "paid"]       # only these two strings


def find_order(orders: list[Order], order_id: int) -> Order | None:
    ...                                      # returns an Order, or None if missing`, lang: 'python', title: 'a taste of what is coming' },
    py`Each piece answers one question a reader (or a type checker) would ask: *what's inside the list?* *which keys does this dict have?* *can this be None?* The more precisely you answer, the more bugs a checker can catch — especially the all-time favourite, \`'NoneType' object has no attribute ...\`.`,
  ],
  why: [
    py`\`list\` on its own says almost nothing. \`list[str]\` lets a checker reject \`names.append(42)\` and tells your editor that \`names[0].\` should offer string methods.`,
    py`Most crashes in real Python code come from a value being something you didn't expect — usually \`None\`. Writing \`User | None\` forces every caller to handle the "no user" case, and the checker reports the places that forget.`,
    py`And choosing *flexible* parameter types (\`Iterable[Order]\` instead of \`list[Order]\`) makes functions reusable with tuples, generators and database cursors — without giving up checking.`,
  ],
  eli15: [
    py`A plain \`list\` hint is like a box labelled "STUFF". \`list[str]\` is "BOX OF WORDS" — now everyone knows what goes in and what comes out.`,
    py`\`str | None\` is a lunchbox that's "a sandwich **or** empty". Before you bite, you have to check! The type checker is the friend who says "you didn't check if it was empty" before you embarrass yourself.`,
    py`\`Literal["paid", "pending"]\` is a multiple-choice question: only those answers are allowed. And a \`TypedDict\` is a form with named boxes: *name* (text), *age* (number), *nickname* (optional).`,
  ],
  analogy: {
    title: 'A delivery company\'s labels and forms',
    body: [
      py`A courier labels crates "**12 × glass jars**" (\`list[Jar]\`), fills in forms with fixed fields — *recipient*, *address*, *phone (optional)* (\`TypedDict\` with \`NotRequired\`) — and ticks one box for the service: *standard / express / overnight* (\`Literal\`).`,
      py`Some deliveries come back as "**parcel or missed-delivery card**" (\`Parcel | None\`) — you'd better check which before you try to open it. And the van driver doesn't care whether a pile of parcels is on a trolley, a shelf or a conveyor belt, as long as they can take them one at a time (\`Iterable[Parcel]\`).`,
    ],
    mapping: [
      ['"12 × glass jars" crate label', 'list[Jar] — a collection whose items have one type'],
      ['a form with named fields', 'TypedDict — a dict with known keys and value types'],
      ['an optional field on the form', 'NotRequired[str] — a key that may be missing'],
      ['tick exactly one: standard / express / overnight', 'Literal["standard", "express", "overnight"]'],
      ['parcel or missed-delivery card', 'Parcel | None — check before you use it'],
      ['any way to hand parcels over one by one', 'Iterable[Parcel] — accept general inputs'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A TypedDict is just a dict — and None must be handled',
    props: {
      code: py`from typing import NotRequired, TypedDict


class Track(TypedDict):
    title: str
    seconds: int
    artist: NotRequired[str]


def artist_of(track: Track) -> str | None:
    return track.get("artist")


song: Track = {"title": "Intro", "seconds": 90}
cover: Track = {"title": "Hey", "seconds": 200, "artist": "Ada"}
odd: Track = {"title": "Oops", "seconds": "3:20"}   # wrong type, runs anyway

for track in (song, cover, odd):
    who = artist_of(track)
    label = who if who is not None else "unknown"
    print(track["title"], "by", label, type(track).__name__)
`,
      notes: {
        4: 'The `TypedDict` class only *describes* a shape. It is used by type checkers; at runtime it builds ordinary dicts.',
        10: '`str | None`: the caller gets a string **or** None and must handle both.',
        14: 'Plain dict literal. `artist` is `NotRequired`, so leaving it out is allowed.',
        16: '`"3:20"` is a str where an int is declared. A checker reports it; Python stores it without complaint.',
        20: 'Narrowing: inside this expression `who` is known to be a `str` when it is not None.',
        21: '`type(track).__name__` is `dict` for all three: there is no Track object at runtime.',
      },
    },
    alt: 'A trace of three Track dictionaries. Track is a TypedDict with title, seconds and an optional artist. song has no artist, cover has artist Ada, odd has seconds set to the string 3:20. The loop calls artist_of on each, which returns None, Ada and None. The label becomes unknown when who is None. Output: Intro by unknown dict, Hey by Ada dict, Oops by unknown dict.',
    caption: py`Step through with ▶. Watch \`who\` become \`None\` or a string, and notice every "Track" is a plain \`dict\` in memory.`,
  },
  syntax: [
    py`#### Collections`,
    { code: py`scores: list[int] = [70, 85, 92]
prices: dict[str, float] = {"latte": 3.1, "tea": 2.5}
tags: set[str] = {"python", "typing"}
frozen: frozenset[str] = frozenset({"admin"})

point: tuple[int, int] = (3, 4)               # exactly two ints
row: tuple[str, int, bool] = ("Ada", 36, True)  # fixed length, a type per position
readings: tuple[float, ...] = (20.5, 21.0, 19.8)  # any length, all floats
empty: tuple[()] = ()                         # the empty tuple`, lang: 'python', title: 'list, dict, set, tuple' },
    py`Lists, sets and dicts are *homogeneous*: one type for every item (or key / value). Tuples are different: \`tuple[int, str]\` describes a **record** with a type per position, while \`tuple[int, ...]\` (literally three dots) is an any-length sequence of ints.`,
    { callout: 'version', title: 'list[int] vs typing.List[int]', text: py`Writing \`list[int]\` with the built-in class works from **Python 3.9** (PEP 585). Older code imports \`List\`, \`Dict\`, \`Tuple\`, \`Set\` from \`typing\`; those still work but are deprecated aliases — use the built-ins in new code.` },
    py`#### Unions: "this or that"`,
    { code: py`def parse_age(text: str) -> int | None:      # an int, or None if text isn't a number
    return int(text) if text.isdigit() else None


def label(value: int | str) -> str:             # an int or a str
    return str(value)`, lang: 'python', title: 'X | Y (Python 3.10+)' },
    { code: py`from typing import Optional, Union


def parse_age(text: str) -> Optional[int]: ...   # same as int | None
def label(value: Union[int, str]) -> str: ...    # same as int | str`, lang: 'python', title: 'the older spelling (still common)' },
    { callout: 'warn', title: 'Optional does NOT mean "optional argument"', text: py`\`Optional[int]\` means "an int **or None**". Whether a parameter can be *left out* depends only on whether it has a default. \`def f(x: int | None)\` must still be called with an argument; \`def f(x: int = 0)\` can be called as \`f()\`. The common combination is \`def f(x: int | None = None)\`.` },
    { callout: 'note', title: 'Python 3.14 detail', text: py`From 3.14, \`Union[int, str]\` and \`int | str\` create the very same kind of object at runtime (\`typing.Union\`), and \`Optional[int]\` prints as \`int | None\`. On 3.10–3.13 they were two different runtime types that compared equal.` },
    py`#### Literal and Final`,
    { code: py`from typing import Final, Literal

Mode = Literal["r", "w", "a"]          # only these exact strings
MAX_RETRIES: Final = 3                 # a checker rejects MAX_RETRIES = 4


def open_log(path: str, mode: Mode = "r") -> None:
    print("opening", path, "in mode", mode)`, lang: 'python', title: 'fixed values and constants' },
    py`\`Literal[...]\` lists allowed *values* (strings, ints, bools, enum members, None). \`Final\` marks a name as never reassigned — the type is inferred from the value. Neither is enforced at runtime: \`MAX_RETRIES = 4\` still runs; the checker reports \`Cannot assign to final name "MAX_RETRIES"\`.`,
    py`#### Any vs object`,
    { code: py`from typing import Any


def shout_any(value: Any) -> str:
    return value.upper()       # checker allows anything on Any — even if wrong


def shout_object(value: object) -> str:
    if isinstance(value, str):  # object: you must narrow before using str methods
        return value.upper()
    return str(value)`, lang: 'python', title: 'two very different "anything" types' },
    py`\`Any\` switches checking **off** for that value: every operation is allowed, and an \`Any\` can be passed anywhere. \`object\` is the honest "anything": every value can be passed *in*, but you can only do what every object supports until you narrow it with \`isinstance\`. Prefer \`object\` when you mean "I accept anything".`,
    py`#### Callables`,
    { code: py`from collections.abc import Callable


def apply_discount(price: float, rule: Callable[[float], float]) -> float:
    return rule(price)


def on_event(handler: Callable[..., None]) -> None:   # any arguments, returns None
    handler("saved", id=7)


print(apply_discount(10.0, lambda p: p * 0.9))   # 9.0`, lang: 'python', title: 'Callable[[arg types], return type]' },
    py`#### Accept general, return specific`,
    { code: py`from collections.abc import Iterable, Mapping, Sequence


def total(prices: Iterable[float]) -> float:            # list, tuple, set, generator...
    return sum(prices)


def middle(values: Sequence[int]) -> int:               # needs len() and indexing
    return values[len(values) // 2]


def lookup(stock: Mapping[str, int], item: str) -> int:  # dict, Counter, read-only views
    return stock.get(item, 0)


def evens(numbers: Iterable[int]) -> list[int]:         # return a concrete type
    return [n for n in numbers if n % 2 == 0]`, lang: 'python', title: 'collections.abc parameter types' },
    py`| if your function only… | ask for | accepts |
|---|---|---|
| loops over it once | \`Iterable[T]\` | lists, tuples, sets, dict keys, generators, files… |
| needs \`len()\`, \`in\` and looping | \`Collection[T]\` | lists, tuples, sets, dicts… |
| indexes / slices / loops repeatedly | \`Sequence[T]\` | lists, tuples, ranges, **str** |
| reads keys and values | \`Mapping[K, V]\` | dict, Counter, defaultdict, MappingProxyType… |
| also writes into it | \`MutableMapping[K, V]\` / \`MutableSequence[T]\` | dict / list… |`,
    py`For **return** values, be specific (\`list[int]\`, \`dict[str, int]\`): callers then know they can append, sort or index the result. This "be liberal in what you accept, specific in what you return" rule keeps functions reusable.`,
    py`#### TypedDict: the shape of a dict`,
    { code: py`from typing import NotRequired, Required, TypedDict


class Movie(TypedDict):
    title: str
    year: int
    rating: NotRequired[float]      # 3.11+: this key may be missing


class SearchOptions(TypedDict, total=False):   # every key optional...
    query: Required[str]                       # ...except this one
    limit: int


m: Movie = {"title": "Up", "year": 2009}
opts: SearchOptions = {"query": "pixar"}`, lang: 'python', title: 'TypedDict, total=False, Required / NotRequired' },
    py`A \`TypedDict\` describes dicts with fixed **string keys** — perfect for JSON from an API or a config file. At runtime \`Movie(...)\` and \`{...}\` both build a plain \`dict\`; nothing is validated, and \`isinstance(x, Movie)\` raises \`TypeError\`. For keys that aren't valid identifiers, use the functional form: \`TypedDict("Row", {"first-name": str})\`.`,
    py`#### Type aliases`,
    { code: py`from typing import TypeAlias

Prices = dict[str, float]                    # implicit alias (any version)
Matrix: TypeAlias = list[list[float]]        # explicit (3.10+, deprecated since 3.12)
type JSON = dict[str, JSON] | list[JSON] | str | int | float | bool | None   # 3.12+`, lang: 'python', title: 'naming a long type' },
    py`The \`type\` statement (**3.12+**) creates a \`TypeAliasType\` whose value is evaluated lazily, so an alias can refer to itself (recursive types like \`JSON\` above) or to names defined later. Generic aliases (\`type Pair[T] = tuple[T, T]\`) are covered in [generics](lesson:generics).`,
  ],
  walkthrough: {
    title: 'Reading the café orders program',
    lang: 'python',
    code: CAFE_ORDERS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4], text: py`A \`Literal\` alias: a status can only be one of three exact strings. Naming it once means every function can reuse \`Status\`.` },
      { lines: [7, 12], text: py`The \`Order\` TypedDict describes the dicts we pass around. \`coupon\` is \`NotRequired\`: an order may not have one.` },
      { lines: [15, 17], text: py`\`revenue\` asks for \`Iterable[Order]\` — the weakest thing it needs, since it loops once. Lists, tuples and generators all work.` },
      { lines: [20, 24], text: py`\`find_order\` returns \`Order | None\`: the type itself warns callers that the order might not exist.` },
      { lines: [27, 33], text: py`\`item_counts\` returns a concrete \`dict[str, int]\` — "accept general, return specific". The empty dict on line 29 needs a hint, because a checker can't guess the types of an empty \`{}\`.` },
      { lines: [36, 37], text: py`\`Mapping[str, float]\` promises we only *read* the prices, so callers may pass a dict, a Counter or a read-only view.` },
      { lines: [50, 52], text: py`\`if found is not None:\` **narrows** \`Order | None\` to \`Order\`. Inside the block a checker knows \`found.get(...)\` is safe. \`.get("coupon", "none")\` handles the NotRequired key.` },
      { lines: [57, 58], text: py`\`get_args(Status)\` reads a Literal's values at runtime. And an "Order" is just a \`dict\` — TypedDict exists only for checkers.` },
    ],
  },
  playground: {
    title: 'Café orders',
    objective: 'See typed collections, Optional and TypedDict in a realistic program, then extend it without breaking the types.',
    files: { 'main.py': CAFE_ORDERS },
    expected: py`\`\`\`text
paid revenue: 13.2
pending revenue: 2.5
item counts: {'latte': 3, 'bagel': 1, 'tea': 1}
order 3 coupon: TWOFOR1
order 99: None
basket: 5.6
statuses: ('pending', 'paid', 'shipped')
an Order is a dict
\`\`\``,
    experiments: [
      {
        id: 'generator-input',
        task: py`\`revenue\` accepts any \`Iterable[Order]\`. Prove it: pass a **generator expression** of only the orders containing \`"latte"\`, store the result in \`latte_revenue\` and print it.`,
        hint: py`\`latte_revenue = revenue(o for o in orders if "latte" in o["items"])\``,
        tests: [{ name: 'latte_revenue is 13.2', code: py`assert ns.get('latte_revenue') == approx(13.2), 'Store revenue(<generator>) in latte_revenue'` }],
        explain: py`Because the parameter is \`Iterable[Order]\`, the function only promised to loop once — and a generator can be looped once. Had it been \`list[Order]\`, a type checker would reject the generator even though it works.`,
      },
      {
        id: 'new-status',
        task: py`The café now does refunds. Add \`"refunded"\` to \`Status\`, append an order \`{"id": 4, "items": ["tea"], "total": 3.0, "status": "refunded"}\` to the list, and print \`revenue(orders, "refunded")\`.`,
        hint: py`Edit line 4 to \`Literal["pending", "paid", "shipped", "refunded"]\` and add the new dict inside the \`orders\` list.`,
        tests: [
          { name: '"refunded" is a valid Status', code: py`from typing import get_args
assert 'refunded' in get_args(Status)` },
          { name: 'refunded revenue is 3.0', code: py`assert revenue(orders, 'refunded') == approx(3.0)` },
        ],
        explain: py`Without updating the \`Literal\`, mypy would reject the new order with \`Incompatible types (expression has type "Literal['refunded']", TypedDict item "status" has type "Literal['pending', 'paid', 'shipped']")  [typeddict-item]\`. One alias, used everywhere, means one place to change.`,
      },
      {
        id: 'coupons',
        task: py`Write \`coupons(orders: Iterable[Order]) -> set[str]\` that returns the set of coupon codes used (skip orders without one). Print \`coupons(orders)\`.`,
        hint: py`A set comprehension with a condition: \`{o["coupon"] for o in orders if "coupon" in o}\`.`,
        tests: [
          { name: 'coupons() returns {"TWOFOR1"}', code: py`assert callable(ns.get('coupons')), 'Define coupons()'
assert coupons(orders) == {'TWOFOR1'}` },
          { name: 'annotated -> set[str]', code: py`import typing
assert typing.get_type_hints(coupons).get('return') == set[str]` },
        ],
        explain: py`\`"coupon" in o\` is how you safely read a \`NotRequired\` key: type checkers understand that check and let you use \`o["coupon"]\` afterwards. Returning \`set[str]\` (specific) tells callers they get set operations.`,
      },
      {
        id: 'coupon-for',
        task: py`Write \`coupon_for(orders: Iterable[Order], order_id: int) -> str | None\`. It uses \`find_order\` and returns the order's coupon, or \`None\` if the order doesn't exist **or** has no coupon.`,
        hint: py`\`order = find_order(orders, order_id)\`, then \`if order is None: return None\`, then \`return order.get("coupon")\`.`,
        tests: [
          { name: 'order 3 -> "TWOFOR1"', code: py`assert callable(ns.get('coupon_for')), 'Define coupon_for()'
assert coupon_for(orders, 3) == 'TWOFOR1'` },
          { name: 'order without coupon -> None', code: py`assert coupon_for(orders, 1) is None` },
          { name: 'missing order -> None', code: py`assert coupon_for(orders, 99) is None` },
        ],
        explain: py`The \`is None\` check narrows \`Order | None\` to \`Order\`; skipping it would make \`order.get\` crash for id 99 — and a checker would warn: \`Item "None" of "Order | None" has no attribute "get"  [union-attr]\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Accept general, return specific',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'iterable', label: 'Iterable[T]', note: 'can loop once', x: 380, y: 40, tone: 'blue' },
        { id: 'collection', label: 'Collection[T]', note: '+ len() and in', x: 380, y: 125, tone: 'blue' },
        { id: 'sequence', label: 'Sequence[T]', note: '+ indexing, slicing', x: 200, y: 215, tone: 'blue' },
        { id: 'mapping', label: 'Mapping[K, V]', note: '+ keys → values', x: 580, y: 215, tone: 'blue' },
        { id: 'list', label: 'list', x: 70, y: 300, tone: 'yellow' },
        { id: 'tuple', label: 'tuple', x: 190, y: 300, tone: 'yellow' },
        { id: 'str', label: 'str', note: 'a Sequence[str]!', x: 320, y: 300, tone: 'red' },
        { id: 'dict', label: 'dict', x: 580, y: 300, tone: 'yellow' },
      ],
      edges: [
        { from: 'collection', to: 'iterable', label: 'is a' },
        { from: 'sequence', to: 'collection', label: 'is a' },
        { from: 'mapping', to: 'collection', label: 'is a' },
        { from: 'list', to: 'sequence' },
        { from: 'tuple', to: 'sequence' },
        { from: 'str', to: 'sequence', dashed: true },
        { from: 'dict', to: 'mapping' },
      ],
      steps: [
        { focus: ['iterable'], text: py`\`Iterable[T]\` is the weakest promise: "you can loop over me". A function that only loops once should ask for exactly this.` },
        { focus: ['collection', 'iterable'], edges: ['collection->iterable'], text: py`\`Collection[T]\` adds \`len()\` and \`in\`. Every Collection is also an Iterable — so it can be passed wherever an Iterable is expected.` },
        { focus: ['sequence', 'mapping'], edges: ['sequence->collection', 'mapping->collection'], text: py`\`Sequence[T]\` adds positions (\`x[0]\`, slicing); \`Mapping[K, V]\` adds key lookups. Both are read-only views of the data — they don't promise \`append\` or item assignment.` },
        { focus: ['list', 'tuple', 'dict'], edges: ['list->sequence', 'tuple->sequence', 'dict->mapping'], text: py`Concrete types sit at the bottom. The **higher** your parameter type, the **more** concrete types callers can pass in. That's "accept general".` },
        { focus: ['str'], edges: ['str->sequence'], text: py`Careful: \`str\` is a \`Sequence[str]\` (each character is a str). \`def tag_all(tags: Sequence[str])\` will accept \`"python"\` and loop over letters. Use \`list[str]\` when a single string must be rejected.` },
        { focus: ['list', 'dict'], text: py`For **return** values go the other way: return \`list[T]\` or \`dict[K, V]\` so callers know everything they can do with the result. That's "return specific".` },
      ],
    },
    alt: 'A hierarchy diagram. Iterable at the top, Collection below it, then Sequence and Mapping. list and tuple point up to Sequence, dict points to Mapping, and str also points to Sequence with a red warning that a str is itself a Sequence of str. Steps explain that parameters should use the higher abstract types and return values the concrete types at the bottom.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`All these hints are ordinary Python objects you can print: \`list[int]\` is a *generic alias* (a list class remembered together with \`int\`), \`int | None\` is a union object, \`Literal["r", "w"]\` remembers its values. Python stores them, but — like every hint — never checks them during a call.`,
      { code: py`from typing import Literal, get_args, get_origin

print(get_origin(dict[str, float]), get_args(dict[str, float]))
# <class 'dict'> (<class 'str'>, <class 'float'>)
print(get_args(Literal["r", "w"]))         # ('r', 'w')
print(isinstance(3, int | str))            # True: unions work in isinstance (3.10+)`, lang: 'python', title: 'peeking inside a hint' },
      py`\`get_origin\` and \`get_args\` are how runtime libraries (validators, serializers, CLI builders) take a hint apart.`,
    ],
    technical: [
      py`**Generic aliases are erased at runtime.** \`list[int]([1, 2])\` just builds a list; \`isinstance(x, list[int])\` raises \`TypeError: isinstance() argument 2 cannot be a parameterized generic\`. Checking every element would be expensive, so Python leaves that to static tools. Use \`isinstance(x, list)\` at runtime.`,
      py`**TypedDict** classes are built by a special metaclass. Instances are plain \`dict\`s; the class records \`__annotations__\`, \`__required_keys__\` and \`__optional_keys__\` (and \`__readonly_keys__\` from 3.13, for \`ReadOnly[...]\` items). \`total=False\` flips the default for every key; \`Required\`/\`NotRequired\` (3.11) override it per key.`,
      { code: py`from typing import NotRequired, TypedDict


class User(TypedDict):
    name: str
    email: NotRequired[str]


print(sorted(User.__required_keys__), sorted(User.__optional_keys__))   # ['name'] ['email']`, lang: 'python', title: 'TypedDict metadata' },
      py`**Narrowing.** A checker tracks the type of each variable *per branch*. After \`if user is None: return\`, the rest of the function sees \`User\`, not \`User | None\`. The same happens with \`isinstance\`, \`in\` on a TypedDict's optional key, comparisons with a \`Literal\`, and \`match\` cases. That's what makes unions practical; see [static type checking](lesson:static-type-checking) for the full list.`,
      py`**Why \`list[int]\` isn't a \`list[float]\`.** Even though an int is accepted where a float is expected, a \`list[int]\` variable can't be passed as \`list[float]\`: the function could \`append(2.5)\` to what the caller believes is a list of ints. \`Sequence[float]\` is read-only, so it *does* accept a \`list[int]\`. This is called *variance* — see [generics](lesson:generics).`,
      { code: py`main.py:9: error: Argument 1 to "average" has incompatible type "list[int]"; expected "list[float]"  [arg-type]
main.py:9: note: "list" is invariant -- see https://mypy.readthedocs.io/en/stable/common_issues.html#variance
main.py:9: note: Consider using "Sequence" instead, which is covariant`, lang: 'text', title: 'mypy explains the fix itself' },
    ],
    production: [
      py`**JSON and APIs.** \`dict[str, Any]\` is honest but useless to a checker. A \`TypedDict\` documents the shape and catches key typos with zero runtime cost — but it doesn't validate. For data from the outside world, validate once at the boundary (by hand, or with a library such as pydantic) and pass typed objects inward. See [JSON data](lesson:json-data) and [input validation](lesson:input-validation).`,
      py`**Optional everywhere is a smell.** If half your parameters are \`X | None\`, every function must re-check them. Push \`None\` handling to the edges: resolve the missing value early (a default, an exception, a null object) and keep the core typed with non-optional values.`,
      py`**Literal vs Enum.** \`Literal\` is lightweight and great for parameters like \`mode: Literal["r", "w"]\` that come in as strings. An [Enum](lesson:enums) gives you a real runtime type with iteration, methods and identity — better for domain concepts used throughout the code.`,
      py`**Any spreads.** A value typed \`Any\` turns off checking for everything it touches: \`x: Any\`, then \`y = x.total\` is \`Any\` too. Keep \`Any\` at the edges (raw JSON) and convert to precise types quickly. mypy's \`--warn-return-any\` and \`--disallow-any-generics\` (both part of \`--strict\`) help you find leaks.`,
    ],
  },
  mistakes: [
    {
      title: 'Reading Optional as "optional argument"',
      wrong: { code: py`def greet(name: str | None) -> str:
    return f"Hi, {name or 'friend'}"


greet()     # TypeError: greet() missing 1 required positional argument: 'name'`, lang: 'python', static: true },
      right: { code: py`def greet(name: str | None = None) -> str:
    return f"Hi, {name or 'friend'}"


print(greet())          # Hi, friend`, lang: 'python' },
      explanation: py`\`str | None\` (or \`Optional[str]\`) says what *values* are allowed. Only a default makes an argument omittable.`,
    },
    {
      title: 'Using a value that might be None without checking',
      wrong: { code: py`def find_email(users: dict[str, str], name: str) -> str | None:
    return users.get(name)


def domain(users: dict[str, str], name: str) -> str:
    return find_email(users, name).split("@")[1]   # crashes for unknown names`, lang: 'python' },
      right: { code: py`def find_email(users: dict[str, str], name: str) -> str | None:
    return users.get(name)


def domain(users: dict[str, str], name: str) -> str:
    email = find_email(users, name)
    if email is None:
        return "unknown"
    return email.split("@")[1]`, lang: 'python' },
      explanation: py`mypy reports \`Item "None" of "str | None" has no attribute "split"  [union-attr]\`. At runtime it's \`AttributeError: 'NoneType' object has no attribute 'split'\`. Check with \`is None\` to narrow.`,
    },
    {
      title: 'tuple[int] when you meant "a tuple of ints"',
      wrong: { code: py`readings: tuple[int] = (20, 21, 19)   # checker: expected a tuple of exactly ONE int`, lang: 'python' },
      right: { code: py`readings: tuple[int, ...] = (20, 21, 19)   # any number of ints`, lang: 'python' },
      explanation: py`\`tuple[int]\` is a 1-tuple. mypy: \`Incompatible types in assignment (expression has type "tuple[int, int, int]", variable has type "tuple[int]")  [assignment]\`. Use \`tuple[int, ...]\` for variable length.`,
    },
    {
      title: 'Asking for list when you only loop',
      wrong: { code: py`def total(prices: list[float]) -> float:
    return sum(prices)


total(p for p in (1.5, 2.0))   # works, but a checker rejects the generator`, lang: 'python' },
      right: { code: py`from collections.abc import Iterable


def total(prices: Iterable[float]) -> float:
    return sum(prices)


print(total(p for p in (1.5, 2.0)))   # 3.5 — and the checker agrees`, lang: 'python' },
      explanation: py`Ask for the weakest interface your function actually uses. \`list[float]\` also blocks callers with a \`list[int]\` variable (lists are invariant), while \`Iterable[float]\` accepts it.`,
    },
    {
      title: 'Sequence[str] accepting a single string',
      wrong: { code: py`from collections.abc import Sequence


def tag_all(tags: Sequence[str]) -> list[str]:
    return [f"#{t}" for t in tags]


print(tag_all("python"))   # ['#p', '#y', '#t', '#h', '#o', '#n']`, lang: 'python' },
      right: { code: py`def tag_all(tags: list[str] | tuple[str, ...]) -> list[str]:
    return [f"#{t}" for t in tags]


print(tag_all(["python"]))   # ['#python']`, lang: 'python' },
      explanation: py`A \`str\` is a sequence of one-character strings, so it type-checks as \`Sequence[str]\` (and \`Iterable[str]\`). When a lone string would be a bug, ask for a concrete \`list[str]\` (or add a runtime \`isinstance(tags, str)\` guard).`,
    },
    {
      title: 'Expecting TypedDict to validate data',
      wrong: { code: py`from typing import TypedDict


class Movie(TypedDict):
    title: str
    year: int


m = Movie(title="Up", year="2009")    # no error at runtime
print(m["year"] + 1)                  # TypeError much later`, lang: 'python', static: true },
      right: { code: py`from typing import TypedDict


class Movie(TypedDict):
    title: str
    year: int


def parse_movie(raw: dict[str, object]) -> Movie:
    title, year = raw.get("title"), raw.get("year")
    if not isinstance(title, str) or not isinstance(year, int):
        raise ValueError(f"bad movie data: {raw!r}")
    return {"title": title, "year": year}


print(parse_movie({"title": "Up", "year": 2009}))`, lang: 'python' },
      explanation: py`A TypedDict is a description for checkers. For data coming from outside, validate it once in a parsing function; after that the type is trustworthy.`,
    },
  ],
  debugging: [
    {
      symptom: py`error: Item "None" of "User | None" has no attribute "email"  [union-attr]`,
      cause: py`You used a value whose type includes \`None\` without checking it first.`,
      fix: py`Narrow it: \`if user is None: return ...\` (or raise), then use \`user.email\`. Avoid silencing it — the checker just found a real crash path.`,
    },
    {
      symptom: py`TypeError: isinstance() argument 2 cannot be a parameterized generic`,
      cause: py`\`isinstance(x, list[int])\` — runtime checks can't look inside generics.`,
      fix: py`Check the container class (\`isinstance(x, list)\`) and, if needed, the items: \`all(isinstance(i, int) for i in x)\`.`,
    },
    {
      symptom: py`TypeError: TypedDict does not support instance and class checks`,
      cause: py`\`isinstance(data, Movie)\` where \`Movie\` is a TypedDict. At runtime the data is just a \`dict\`.`,
      fix: py`Check \`isinstance(data, dict)\` and the keys / value types yourself, or validate with a library.`,
    },
    {
      symptom: py`error: Missing key "year" for TypedDict "Movie"  [typeddict-item]`,
      cause: py`A dict literal assigned to a TypedDict type lacks a required key (or has a typo in it).`,
      fix: py`Add the key, fix the spelling, or mark it \`NotRequired[...]\` if it is genuinely optional.`,
    },
    {
      symptom: py`error: Argument 1 to "average" has incompatible type "list[int]"; expected "list[float]"  [arg-type]`,
      cause: py`Lists are invariant: a \`list[int]\` isn't a \`list[float]\` because the callee could add floats to it.`,
      fix: py`If the function only reads the data, change the parameter to \`Sequence[float]\` or \`Iterable[float]\`.`,
    },
  ],
  bestPractices: [
    'Use built-in generics (list[str], dict[str, int]) and X | None on 3.10+; keep Optional/Union only for older codebases.',
    'Accept the most general abstract type your function needs (Iterable, Collection, Sequence, Mapping); return concrete types.',
    'Handle None explicitly with is None / is not None checks; don\'t silence union-attr errors.',
    'Give constrained strings a Literal alias (Status = Literal[...]) and reuse it everywhere.',
    'Prefer object over Any when you mean "anything"; keep Any at the edges of the system.',
    'Model JSON-like dicts with TypedDict; validate outside data once at the boundary.',
    'Annotate empty collections (counts: dict[str, int] = {}) — checkers can\'t infer their item types.',
  ],
  useCases: [
    'Typing API responses and config files as TypedDicts.',
    'Lookup functions that may fail: def find_user(id: int) -> User | None.',
    'Mode / status parameters with fixed values: Literal["asc", "desc"].',
    'Callbacks and strategy functions: Callable[[Order], float].',
    'Reusable data-processing functions that accept any Iterable — lists, generators, file lines.',
  ],
  comparison: {
    title: 'Choosing a type for "anything" and "maybe"',
    headers: ['', 'Any', 'object', 'X | None'],
    rows: [
      ['what can be passed in', 'anything', 'anything', 'an X or None'],
      ['what you can do with it', 'anything (checking is off)', 'only what all objects support, until you narrow', 'X\'s operations only after checking it is not None'],
      ['can it be passed to an int parameter?', 'yes — silently', 'no', 'no (not until narrowed to X)'],
      ['use it for', 'raw, unknown data at the edges; gradual migration', '"I accept any value" (e.g. a logging function)', 'values that may be missing'],
    ],
    note: py`\`Any\` is an escape hatch, not a type. If you find yourself writing it often, a TypedDict, a Protocol (see [protocols](lesson:protocols)) or a generic may describe the data better.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'typing-collections-and-unions-q1',
      type: 'mcq',
      prompt: py`Which value matches the hint \`tuple[int, ...]\`?`,
      options: [
        { text: '(1, "two", 3)', why: 'Every item must be an int; "two" is a str.' },
        '(4, 8, 15, 16, 23, 42)',
        { text: '[1, 2, 3]', why: 'That is a list, not a tuple.' },
        { text: 'Only a tuple with exactly one int, like (7,)', why: 'That would be tuple[int]. The ... means "any length".' },
      ],
      answer: 1,
      explanation: py`\`tuple[int, ...]\` is a tuple of any length whose items are all ints (including the empty tuple). \`tuple[int, str]\` would mean exactly two items: an int then a str.`,
    },
    {
      id: 'typing-collections-and-unions-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from typing import TypedDict


class Movie(TypedDict):
    title: str
    year: int


m = Movie(title="Up", year="2009")
print(m)`,
      options: [
        { text: "TypeError: year must be int", why: 'TypedDict does no runtime validation. Only a type checker would flag "2009".' },
        "{'title': 'Up', 'year': '2009'}",
        { text: "Movie(title='Up', year='2009')", why: 'There is no Movie object at runtime: calling Movie(...) builds a plain dict.' },
        { text: "{'title': 'Up', 'year': 2009}", why: 'Nothing converts the string to an int.' },
      ],
      answer: 1,
      explanation: py`A TypedDict only describes a shape for type checkers. At runtime \`Movie(...)\` is just \`dict(...)\`, so the string is stored as-is. mypy would report: \`Incompatible types (expression has type "str", TypedDict item "year" has type "int")\`.`,
    },
    {
      id: 'typing-collections-and-unions-q3',
      type: 'bug',
      prompt: 'This passes some tests but crashes for unknown users — and a type checker flags it. Click the line that needs a fix.',
      code: py`def find_email(users: dict[str, str], name: str) -> str | None:
    return users.get(name)


def domain(users: dict[str, str], name: str) -> str:
    email = find_email(users, name)
    return email.split("@")[1]`,
      answerLine: 7,
      explanation: py`\`email\` has type \`str | None\`. Calling \`.split\` on it without checking for \`None\` crashes for unknown names (\`AttributeError: 'NoneType' object has no attribute 'split'\`), and mypy reports \`Item "None" of "str | None" has no attribute "split"\`. Add \`if email is None: ...\` before line 7.`,
    },
    {
      id: 'typing-collections-and-unions-q4',
      type: 'fill',
      prompt: '`default` may be a str or None; `mode` may only be the strings "r" or "a". Fill in the blanks (Python 3.10+).',
      code: py`from typing import Literal


def read_setting(name: str, default: str ___ None = None) -> str | None:
    ...


def open_log(mode: ___["r", "a"] = "r") -> None:
    ...`,
      answer: [['|'], ['Literal']],
      explanation: py`\`str | None\` is the 3.10+ union syntax (same as \`Optional[str]\`); \`Literal["r", "a"]\` restricts the value to those exact strings.`,
    },
    {
      id: 'typing-collections-and-unions-q5',
      type: 'mcq',
      prompt: py`With which hint does a type checker accept \`value.upper()\` **without** any check, even if \`value\` might be an int?`,
      options: [
        { text: 'value: object', why: 'object only allows what every object supports. You must narrow with isinstance(value, str) first.' },
        'value: Any',
        { text: 'value: str | int', why: 'int has no upper(), so the checker reports an error until you narrow to str.' },
        { text: 'value: str | None', why: 'None has no upper(); the checker requires a None check first.' },
      ],
      answer: 1,
      explanation: py`\`Any\` turns checking off: every attribute and call is allowed. That's exactly why it's dangerous — a real \`int\` would crash at runtime with no warning beforehand.`,
    },
    {
      id: 'typing-collections-and-unions-q6',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from collections.abc import Sequence


def tag_all(tags: Sequence[str]) -> list[str]:
    return [f"#{t}" for t in tags]


print(len(tag_all("css")))`,
      answer: '3',
      accept: ['3'],
      explanation: py`\`"css"\` is itself a \`Sequence[str]\`, so it type-checks *and* runs: the loop sees \`"c"\`, \`"s"\`, \`"s"\` and builds three tags. If a lone string should be rejected, use \`list[str]\`.`,
    },
    {
      id: 'typing-collections-and-unions-q7',
      type: 'short',
      prompt: 'Explain "accept general, return specific" with an example of a parameter type and a return type.',
      answer: py`Parameters should ask for the weakest interface the function needs, so callers can pass more kinds of objects: \`def total(prices: Iterable[float])\` accepts lists, tuples, sets and generators. Return values should be concrete, so callers know everything they can do with them: return \`list[float]\` rather than \`Iterable[float]\`, so they can index, sort or append.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'book-catalogue',
      title: 'A typed book catalogue',
      difficulty: 'intermediate',
      prompt: py`A library stores books as dicts. Some books have a publication year, some don't.

1. Change the \`Book\` TypedDict so that \`title\` and \`author\` (both \`str\`) are **required** and \`year\` (an \`int\`) is **not required**.
2. Write \`describe(book: Book) -> str\` returning \`"Title by Author (1997)"\`, or \`"Title by Author (year unknown)"\` when there's no year.
3. Write \`oldest(books: Iterable[Book]) -> Book | None\` returning the book with the **smallest** year among books that have one, or \`None\` if no book has a year. It must work with any iterable, including a generator.`,
      files: {
        'main.py': py`from collections.abc import Iterable
from typing import NotRequired, TypedDict


class Book(TypedDict):
    title: str
    author: str
    year: int          # TODO: some books have no year


def describe(book: Book) -> str:
    return ""          # TODO


def oldest(books: Iterable[Book]) -> Book | None:
    return None        # TODO


shelf: list[Book] = [
    {"title": "Dune", "author": "Frank Herbert", "year": 1965},
    {"title": "Mystery Notes", "author": "Anon"},
    {"title": "Emma", "author": "Jane Austen", "year": 1815},
]
for book in shelf:
    print(describe(book))
print("oldest:", oldest(shelf))
`,
      },
      hints: [
        'Wrap the year type in NotRequired[...] — the import is already there.',
        'Read an optional key with "year" in book or book.get("year"). For oldest, first collect only the books that have a year.',
        'dated = [b for b in books if "year" in b]; return min(dated, key=lambda b: b["year"]) if dated else None',
      ],
      solution: {
        explanation: py`\`year: NotRequired[int]\` makes the key optional while \`title\` and \`author\` stay required (the default, \`total=True\`). The class's \`__required_keys__\` / \`__optional_keys__\` reflect that at runtime.

\`describe\` uses \`"year" in book\` — a check type checkers understand — before reading \`book["year"]\`. \`oldest\` loops over the iterable only **once** (building the \`dated\` list), so a generator works; then \`min(..., key=...)\` picks the smallest year. Returning \`Book | None\` forces callers to handle "no dated books".`,
        files: {
          'main.py': py`from collections.abc import Iterable
from typing import NotRequired, TypedDict


class Book(TypedDict):
    title: str
    author: str
    year: NotRequired[int]


def describe(book: Book) -> str:
    year = str(book["year"]) if "year" in book else "year unknown"
    return f"{book['title']} by {book['author']} ({year})"


def oldest(books: Iterable[Book]) -> Book | None:
    dated = [book for book in books if "year" in book]
    if not dated:
        return None
    return min(dated, key=lambda book: book["year"])


shelf: list[Book] = [
    {"title": "Dune", "author": "Frank Herbert", "year": 1965},
    {"title": "Mystery Notes", "author": "Anon"},
    {"title": "Emma", "author": "Jane Austen", "year": 1815},
]
for book in shelf:
    print(describe(book))
print("oldest:", oldest(shelf))
`,
        },
      },
      tests: [
        { name: 'title and author required, year optional', code: py`assert Book.__required_keys__ == frozenset({'title', 'author'})
assert Book.__optional_keys__ == frozenset({'year'})` },
        { name: 'describe() with a year', code: py`assert describe({"title": "Dune", "author": "Frank Herbert", "year": 1965}) == "Dune by Frank Herbert (1965)"` },
        { name: 'describe() without a year', code: py`assert describe({"title": "Notes", "author": "Anon"}) == "Notes by Anon (year unknown)"` },
        { name: 'oldest() picks the smallest year and accepts a generator', code: py`books = [{"title": "A", "author": "x", "year": 2001}, {"title": "B", "author": "y"}, {"title": "C", "author": "z", "year": 1999}]
assert oldest(b for b in books)["title"] == "C"` },
        { name: 'oldest() returns None when no book has a year', code: py`assert oldest([{"title": "B", "author": "y"}]) is None
assert oldest([]) is None` },
      ],
    },
    {
      id: 'expense-totals',
      title: 'Accept general, return specific',
      difficulty: 'intermediate',
      prompt: py`The expense report code only works with lists. Make it general:

1. \`totals_by_category(expenses)\` must accept **any iterable** of \`(category, amount)\` pairs — including a generator — and return a \`dict[str, float]\` of totals. Annotate the parameter as \`Iterable[tuple[str, float]]\` (from \`collections.abc\`).
2. Write \`top_category(totals: Mapping[str, float]) -> str | None\` returning the category with the largest total, or \`None\` if \`totals\` is empty. It must work with any mapping, e.g. \`types.MappingProxyType\`.`,
      files: {
        'main.py': py`from collections.abc import Iterable, Mapping


def totals_by_category(expenses: list[tuple[str, float]]) -> dict[str, float]:
    totals: dict[str, float] = {}
    for i in range(len(expenses)):
        category, amount = expenses[i]
        totals[category] = totals.get(category, 0.0) + amount
    return totals


def top_category(totals: Mapping[str, float]) -> str | None:
    return None   # TODO


expenses = [("food", 12.5), ("travel", 30.0), ("food", 4.0)]
totals = totals_by_category(expenses)
print(totals)
print("top:", top_category(totals))
`,
      },
      hints: [
        'A generator has no len() and no indexing — loop over it directly instead.',
        'for category, amount in expenses: ... unpacks each pair. For top_category, max() takes a key function.',
        'return max(totals, key=totals.__getitem__) if totals else None',
      ],
      solution: {
        explanation: py`Looping with \`for category, amount in expenses\` only needs iteration, so the honest parameter type is \`Iterable[tuple[str, float]]\` — and generators, tuples and file-parsing pipelines all work. The return type stays a concrete \`dict[str, float]\`.

\`top_category\` only reads, so \`Mapping[str, float]\` is right: dicts, \`Counter\`s and read-only \`MappingProxyType\` views are all accepted. \`max(totals, key=totals.__getitem__)\` iterates the keys and compares their totals; an empty mapping returns \`None\` instead of letting \`max()\` raise \`ValueError\`.`,
        files: {
          'main.py': py`from collections.abc import Iterable, Mapping


def totals_by_category(expenses: Iterable[tuple[str, float]]) -> dict[str, float]:
    totals: dict[str, float] = {}
    for category, amount in expenses:
        totals[category] = totals.get(category, 0.0) + amount
    return totals


def top_category(totals: Mapping[str, float]) -> str | None:
    if not totals:
        return None
    return max(totals, key=totals.__getitem__)


expenses = [("food", 12.5), ("travel", 30.0), ("food", 4.0)]
totals = totals_by_category(expenses)
print(totals)
print("top:", top_category(totals))
`,
        },
      },
      tests: [
        { name: 'works with a list', code: py`assert totals_by_category([("food", 12.5), ("travel", 30.0), ("food", 4.0)]) == {"food": 16.5, "travel": 30.0}` },
        { name: 'works with a generator', code: py`pairs = (("a", float(n)) for n in range(4))
assert totals_by_category(pairs) == {"a": 6.0}` },
        { name: 'parameter annotated as an Iterable', code: py`import typing, collections.abc
hint = typing.get_type_hints(totals_by_category)['expenses']
assert typing.get_origin(hint) is collections.abc.Iterable, f'expected Iterable[...], got {hint}'` },
        { name: 'top_category works with a read-only mapping', code: py`from types import MappingProxyType
assert top_category(MappingProxyType({"food": 16.5, "travel": 30.0})) == "travel"` },
        { name: 'top_category of nothing is None', code: py`assert top_category({}) is None` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'typing-collections-and-unions-optional-meaning',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does `Optional[str]` mean? Does it make a parameter optional?',
      answer: 'Optional[str] means "a str or None" — exactly str | None. It says nothing about whether the argument can be omitted; only a default value does that. The usual pattern is name: str | None = None.',
      explanation: py`The name is a historical accident that confuses many people, which is one reason the \`X | None\` syntax (3.10, PEP 604) is now preferred. Type checkers then force callers and the function body to handle the \`None\` case.`,
      code: { lang: 'python', code: py`def greet(name: str | None = None) -> str:
    if name is None:
        return "Hi there"
    return f"Hi {name}"` },
      whyAsked: 'A classic misunderstanding; also probes whether you know the modern syntax.',
      mistakes: ['Saying Optional means the argument has a default', 'Not mentioning None handling inside the function'],
      followUps: ['How do you narrow Optional[str] to str?', 'Why might too many Optional parameters be a design smell?'],
      modelAnswer: 'Optional[str] is just shorthand for Union[str, None] — the value is either a string or None. It does not make the parameter optional; that only happens if I give it a default. So the common idiom is name: str | None = None, which is both nullable and omittable. Since Python 3.10 I prefer the str | None spelling because it says exactly what it means. And once something is optional, the type checker will make me check for None before I use it as a string.',
    },
    {
      id: 'typing-collections-and-unions-any-vs-object',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `Any` and `object` as a type hint?',
      answer: 'Both accept any value, but Any switches checking off — you can call any method on it and pass it anywhere — while object is the top type: you can only do what all objects support until you narrow it with isinstance. Use object for "I accept anything", Any only as an escape hatch.',
      explanation: py`\`Any\` is *compatible in both directions*: any value can be assigned to \`Any\`, and an \`Any\` can be assigned to any type. \`object\` is compatible in one direction only: anything can go in, but an \`object\` can't be passed where an \`int\` is expected. That makes \`object\` safe and \`Any\` contagious.`,
      code: { lang: 'python', code: py`from typing import Any


def log_any(value: Any) -> None:
    print(value.upper())          # checker: fine (and may crash at runtime)


def log_object(value: object) -> None:
    print(str(value))             # value.upper() here -> error: "object" has no attribute "upper"` },
      whyAsked: 'Distinguishes people who understand the type system from those who sprinkle Any to silence errors.',
      mistakes: ['Saying they are the same', 'Using Any for "accept anything" parameters', 'Not knowing Any propagates through expressions'],
      followUps: ['How would you find places where Any leaks into a codebase?', 'What does mypy\'s --disallow-any-generics do?'],
      modelAnswer: 'Both accept any value, but they mean opposite things to a type checker. Any turns checking off: I can call anything on it and pass it anywhere, and whatever I compute from it is Any too, so errors silently spread. object is the honest top type: every value fits, but I can only use operations that every object supports until I narrow with isinstance. So for a function like a logger that genuinely accepts anything, I use object. I reserve Any for raw, unknown data at the edges or for gradual migrations, and I convert to precise types as early as possible.',
    },
    {
      id: 'typing-collections-and-unions-sequence-str',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'A function `notify(recipients: Sequence[str])` sent emails to "a", "d", "a", "@", ... in production. The type checker reported nothing. What happened, and how do you prevent it?',
      answer: 'A caller passed a single address string. str is itself a Sequence[str] (each character is a one-character string), so the call type-checks and the loop iterates characters. Use list[str] (or list[str] | tuple[str, ...]) for the parameter, and/or add a runtime guard that rejects a bare str.',
      explanation: py`This is a well-known hole: \`str\` satisfies \`Iterable[str]\`, \`Collection[str]\` and \`Sequence[str]\`. There is no standard "sequence but not str" type. Options: a concrete type (\`list[str]\`), an explicit guard (\`if isinstance(recipients, str): raise TypeError(...)\`), or an API that takes \`*recipients: str\`.`,
      code: { lang: 'python', code: py`from collections.abc import Sequence


def notify(recipients: Sequence[str]) -> list[str]:
    if isinstance(recipients, str):
        raise TypeError("pass a list of addresses, not one string")
    return [f"sent to {r}" for r in recipients]` },
      whyAsked: 'Shows awareness that "accept general" has sharp edges and that type checks complement — not replace — defensive code.',
      mistakes: ['Blaming the type checker for a bug', 'Saying Sequence excludes str', 'Proposing Any as the fix'],
      followUps: ['Would *recipients: str be a better API?', 'How would a test catch this?'],
      modelAnswer: 'Someone passed a single string. A str is a sequence of one-character strings, so it is a valid Sequence[str] — the checker had nothing to complain about, and the loop iterated over the characters. I would fix it in two ways: tighten the parameter to list[str] when the abstraction is not needed, or keep the flexible type but add a guard that raises TypeError for a bare str. Another option is a variadic API, notify(*recipients: str), where passing one string means one recipient. And a unit test with a single string would have caught it.',
    },
    {
      id: 'typing-collections-and-unions-merge-counts',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `merge_counts(*counts: Mapping[str, int]) -> dict[str, int]` that adds up any number of count mappings (dicts, Counters, read-only views) into a **new** dict without modifying the inputs.',
      answer: 'Create result: dict[str, int] = {}; for each mapping, for key, n in mapping.items(): result[key] = result.get(key, 0) + n; return result.',
      explanation: py`\`Mapping\` promises read-only access (\`items()\`, \`[]\`, \`get\`), which is all we need — so \`Counter\`, \`defaultdict\` and \`MappingProxyType\` are all accepted, and the type itself documents that inputs aren't modified. Returning a concrete \`dict\` tells callers they can mutate the result.`,
      starter: { files: { 'main.py': py`from collections.abc import Mapping


def merge_counts(*counts: Mapping[str, int]) -> dict[str, int]:
    # TODO: add up all the mappings into a new dict
    return {}


print(merge_counts({"tea": 2}, {"tea": 1, "cake": 3}))   # {'tea': 3, 'cake': 3}
` } },
      tests: [
        { name: 'adds two dicts', code: py`assert merge_counts({"tea": 2}, {"tea": 1, "cake": 3}) == {"tea": 3, "cake": 3}` },
        { name: 'accepts Counter and MappingProxyType', code: py`from collections import Counter
from types import MappingProxyType
assert merge_counts(Counter("aab"), MappingProxyType({"b": 5})) == {"a": 2, "b": 6}` },
        { name: 'does not modify inputs and returns a plain dict', code: py`first = {"x": 1}
result = merge_counts(first, {"x": 1})
assert first == {"x": 1} and type(result) is dict and result == {"x": 2}` },
        { name: 'no arguments gives an empty dict', code: py`assert merge_counts() == {}` },
      ],
      solution: { files: { 'main.py': py`from collections.abc import Mapping


def merge_counts(*counts: Mapping[str, int]) -> dict[str, int]:
    result: dict[str, int] = {}
    for mapping in counts:
        for key, n in mapping.items():
            result[key] = result.get(key, 0) + n
    return result


print(merge_counts({"tea": 2}, {"tea": 1, "cake": 3}))   # {'tea': 3, 'cake': 3}
` } },
      hints: ['*counts collects every positional argument into a tuple of mappings.', 'Start from an empty dict and use result.get(key, 0) + n.'],
      whyAsked: 'Checks that you choose abstract parameter types deliberately and return concrete ones, plus clean implementation.',
      mistakes: ['Mutating the first argument and returning it', 'Typing the parameter as dict, rejecting Counter/MappingProxyType for no reason', 'Returning a Counter when a dict was promised'],
      followUps: ['How would you do it with collections.Counter?', 'What does *counts: Mapping[str, int] mean for the type of counts inside the function?'],
      modelAnswer: 'I accept *counts typed as Mapping[str, int], because I only read from them — that lets callers pass dicts, Counters or read-only views and documents that I will not mutate them. Inside, counts is a tuple of mappings. I build a fresh dict, loop over each mapping\'s items and add with result.get(key, 0) + n, then return the dict. The return type is a concrete dict so callers know they can modify it. With Counter I could also sum them, but the explicit loop keeps the return type exactly dict.',
    },
    {
      id: 'typing-collections-and-unions-typing-json',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your service receives JSON order payloads from a partner API. How would you type them: `dict[str, Any]`, a `TypedDict`, or a dataclass / pydantic model?',
      answer: 'At the boundary the raw payload is honestly dict[str, Any] (or object). Describe its expected shape with a TypedDict for checker support with zero runtime cost, but validate it once — by hand or with pydantic — and convert it to a typed object (TypedDict you trust, dataclass or model) that the rest of the code uses.',
      explanation: py`\`dict[str, Any]\` gives no help: typos in keys and wrong value types go unnoticed. A \`TypedDict\` documents and checks key access statically, but does nothing at runtime, so it must only be applied *after* validation. A dataclass or pydantic model gives a real runtime type with attribute access; pydantic also validates and coerces using your hints. The pattern is "parse, don't validate": one function turns untrusted input into trusted types.`,
      whyAsked: 'Real systems ingest external data; this checks you understand the limit of static types and where validation belongs.',
      mistakes: ['Claiming a TypedDict validates the JSON', 'Using dict[str, Any] all the way through the codebase', 'Validating the same data repeatedly in every function'],
      followUps: ['What does "parse, don\'t validate" mean?', 'When would you choose TypedDict over a dataclass?'],
      modelAnswer: 'I would treat the raw JSON as untrusted dict[str, Any] at the boundary and convert it immediately. I like a TypedDict to describe the expected shape — it is cheap and lets the checker catch key typos — but it does not validate anything at runtime, so I only use it after checking the data. For the actual validation I would write a parse function or use pydantic, which reads type hints and validates and coerces fields. After that point the rest of the code works with typed objects, either the trusted TypedDict or a dataclass, and never sees Any. That keeps validation in one place.',
    },
    {
      id: 'typing-collections-and-unions-typeddict-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`from typing import TypedDict


class Point(TypedDict):
    x: int
    y: int


p = Point(x=1, y="2")
print(p, type(p).__name__)` },
      options: ["TypeError: y must be int", "{'x': 1, 'y': '2'} dict", "Point(x=1, y='2') Point", "{'x': 1, 'y': 2} Point"],
      correctOption: 1,
      answer: "{'x': 1, 'y': '2'} dict — a TypedDict call builds a plain dict and validates nothing.",
      explanation: py`TypedDicts exist for static checkers. At runtime the class call returns an ordinary \`dict\`, values are stored unchanged, and \`isinstance(p, Point)\` would even raise \`TypeError\`.`,
      whyAsked: 'Tests understanding of where typing stops and runtime begins.',
      mistakes: ['Expecting runtime validation', 'Expecting a custom class instance'],
      followUps: ['How could you validate p at runtime?', 'How would mypy report this line?'],
      modelAnswer: 'It prints {\'x\': 1, \'y\': \'2\'} followed by dict. Calling a TypedDict class just builds a regular dictionary — there is no Point type at runtime and no validation, so the string "2" is stored as is. A type checker would flag the call because y is declared as int. If I needed runtime guarantees I would validate the data myself or use a validation library.',
    },
    {
      id: 'typing-collections-and-unions-literal-vs-enum',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'When would you use `Literal["asc", "desc"]` and when an `Enum` for a fixed set of values?',
      answer: 'Literal is a pure typing construct: values stay plain strings/ints, great for small parameter options and data that arrives as strings (JSON, CLI flags). An Enum is a real runtime type with members, iteration, methods and identity — better for domain concepts used across the code, when you need behaviour on the values, or when you want runtime validation via Status(value).',
      explanation: py`With \`Literal\`, callers write \`sort(items, "desc")\` and a checker rejects \`"down"\`, but at runtime anything goes unless you check \`value in get_args(Order)\`. With an \`Enum\`, \`Order("down")\` raises \`ValueError\` at runtime, you can attach methods and iterate over members, and refactoring tools see one definition. Both support exhaustiveness checks with \`match\` + \`assert_never\` in type checkers.`,
      code: { lang: 'python', code: py`from enum import Enum
from typing import Literal, get_args

SortOrder = Literal["asc", "desc"]
print(get_args(SortOrder))          # ('asc', 'desc')


class Status(Enum):
    PENDING = "pending"
    PAID = "paid"


print(Status("paid"))               # Status.PAID
print([s.value for s in Status])    # ['pending', 'paid']` },
      whyAsked: 'Checks that you can pick between static-only and runtime constructs with a reason.',
      mistakes: ['Thinking Literal validates at runtime', 'Using string constants scattered through code instead of either'],
      followUps: ['How would you check exhaustiveness over a Literal in a match statement?', 'How do you serialise an Enum to JSON?'],
      modelAnswer: 'Literal is purely for the type checker: the values remain plain strings or ints, which makes it perfect for small option parameters and data that already arrives as strings, like a sort order in a query string. An Enum is a real class: it validates at runtime with Status(value), I can iterate its members, attach methods, and compare by identity. So for a light parameter option I use Literal; for a core domain concept used across modules, like an order status with behaviour, I use an Enum. Both work with match plus assert_never for exhaustiveness checks.',
    },
  ],

  takeaways: [
    'Use built-in generics: list[int], dict[str, float], set[str]; tuple[int, str] is a fixed record, tuple[int, ...] any length.',
    'X | None (3.10+, same as Optional[X]) means "an X or None" — not "optional argument"; narrow with is None before use.',
    'Literal restricts values, Final forbids reassignment, Callable[[A], R] describes functions — all checked statically, none at runtime.',
    'Any turns checking off; object accepts anything but requires narrowing. Prefer object.',
    'Accept general abstract types (Iterable, Collection, Sequence, Mapping) and return concrete ones (list, dict) — and remember str is a Sequence[str].',
    'TypedDict describes dict shapes (NotRequired/Required in 3.11+); at runtime it is a plain dict with no validation.',
    'Name long types with aliases; the 3.12+ type statement makes lazy, even recursive, aliases.',
  ],
}
