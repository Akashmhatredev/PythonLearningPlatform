// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const READERS = py`import io
from typing import Protocol, runtime_checkable


@runtime_checkable
class Readable(Protocol):
    """Anything with a .read() that returns text."""

    def read(self) -> str: ...


def word_count(source: Readable) -> int:
    return len(source.read().split())


class FakeDownload:
    """Pretends to be a network response. It never mentions Readable."""

    def __init__(self, body: str) -> None:
        self.body = body

    def read(self) -> str:
        return self.body


class Thermometer:
    def celsius(self) -> float:
        return 21.5


with open("notes.txt", encoding="utf-8") as notes:
    print("file:", word_count(notes))
print("memory:", word_count(io.StringIO("to be or not to be")))
print("download:", word_count(FakeDownload("hello from the network")))

for thing in [io.StringIO(""), FakeDownload(""), Thermometer(), "plain text"]:
    print(f"{type(thing).__name__:<13} Readable? {isinstance(thing, Readable)}")
`

const NOTES = py`Buy milk
Call Ada about the robot club
Finish the typing lesson
`

const CHECKER = py`"""A SIMPLIFIED structural checker, to show what @runtime_checkable skips.

isinstance() with a runtime-checkable protocol only asks "do the member
NAMES exist?". A type checker also compares parameters and return types.
This toy compares parameter names and return hints of methods only; real
checkers (mypy, pyright) handle defaults, overloads, generics, properties,
attributes and variance — and do it without running your code.
"""
import inspect
import typing
from typing import Protocol, runtime_checkable


def conforms(cls: type, proto: type) -> list[str]:
    problems = []
    for name in sorted(typing.get_protocol_members(proto)):
        if not hasattr(cls, name):
            problems.append(f"missing {name}()")
            continue
        wanted, got = getattr(proto, name), getattr(cls, name)
        want_params = list(inspect.signature(wanted).parameters)[1:]   # skip self
        got_params = list(inspect.signature(got).parameters)[1:]
        if got_params != want_params:
            problems.append(f"{name}() takes {got_params}, expected {want_params}")
        want_ret = typing.get_type_hints(wanted).get("return")
        got_ret = typing.get_type_hints(got).get("return")
        if got_ret is not want_ret:
            problems.append(f"{name}() returns {got_ret.__name__}, expected {want_ret.__name__}")
    return problems


@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...


class Download:
    def read(self) -> str:
        return "hello"


class Sensor:
    def read(self) -> float:
        return 21.5


class PagedReport:
    def read(self, page: int) -> str:
        return f"page {page}"


class Thermometer:
    def celsius(self) -> float:
        return 21.5


for cls in [Download, Sensor, PagedReport, Thermometer]:
    problems = conforms(cls, Readable)
    verdict = "OK" if not problems else "; ".join(problems)
    print(f"{cls.__name__:<12} isinstance: {isinstance(cls(), Readable)!s:<5}  checker: {verdict}")
`

export default {
  id: 'protocols',
  title: 'Protocols & structural typing',
  summary: 'A Protocol describes what an object can do — "anything with a .read() returning str" — and type checkers accept every class with matching members, no inheritance required.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['type-hints', 'polymorphism-and-duck-typing', 'generics'],
  related: ['abstract-base-classes', 'static-type-checking', 'typing-collections-and-unions', 'inheritance', 'composition', 'container-protocols', 'special-methods', 'mocking', 'solid', 'clean-architecture', 'context-managers'],
  tags: ['Protocol', 'structural typing', 'nominal typing', 'duck typing', 'runtime_checkable', 'isinstance', 'ABC', 'interface', 'callback protocol', '__call__', 'typing.Self', 'PEP 544', 'PEP 673', 'SupportsRead', 'get_protocol_members'],
  apis: [
    { name: 'class P(Protocol):', summary: 'Declares a protocol: the methods and attributes an object needs, checked structurally by type checkers (3.8+).' },
    { name: '@typing.runtime_checkable', summary: 'Allows isinstance()/issubclass() against a protocol; checks only that the member names exist.' },
    { name: 'typing.get_protocol_members(P)', summary: 'Python 3.13+: the frozenset of member names a protocol declares.' },
    { name: 'typing.is_protocol(obj)', summary: 'Python 3.13+: True if obj is a Protocol class.' },
    { name: 'def __call__(self, ...) -> R (in a Protocol)', summary: 'A callback protocol: describes a callable with keyword arguments, defaults or overloads that Callable[...] cannot express.' },
    { name: 'typing.Self', summary: 'Python 3.11+: "the type of the current instance" — for methods that return self, including in subclasses.' },
    { name: 'typing.SupportsInt / SupportsIndex / SupportsAbs ...', summary: 'Ready-made runtime-checkable protocols for objects with a single special method.' },
  ],
  docs: [
    { label: 'typing — Protocol', url: 'https://docs.python.org/3/library/typing.html#typing.Protocol' },
    { label: 'typing — runtime_checkable', url: 'https://docs.python.org/3/library/typing.html#typing.runtime_checkable' },
    { label: 'typing — Self', url: 'https://docs.python.org/3/library/typing.html#typing.Self' },
    { label: 'PEP 544 — Protocols: structural subtyping', url: 'https://peps.python.org/pep-0544/' },
    { label: 'PEP 673 — Self type', url: 'https://peps.python.org/pep-0673/' },
    { label: 'mypy — protocols and structural subtyping', url: 'https://mypy.readthedocs.io/en/stable/protocols.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Python has always run on **duck typing**: "if it walks like a duck and quacks like a duck, it's a duck". A function that calls \`source.read()\` works with an open file, an \`io.StringIO\`, or your own class — anything with a \`read()\` method. Nobody has to inherit from anything. (See [polymorphism & duck typing](lesson:polymorphism-and-duck-typing).)`,
    py`But how do you write the *type hint* for "anything with a \`read()\`"? Not \`TextIOWrapper\` — that rejects \`StringIO\` and your test fakes. Not \`object\` — that has no \`read()\`. You need a way to describe a **shape**. That's a **protocol**:`,
    { code: py`from typing import Protocol


class Readable(Protocol):
    def read(self) -> str: ...


def word_count(source: Readable) -> int:
    return len(source.read().split())`, lang: 'python', title: 'a protocol is a described shape' },
    py`\`Readable\` lists the members an object must have; the \`...\` bodies mean "no implementation here". A type checker now accepts \`word_count(any_object)\` if that object's class has a compatible \`read()\` — whether or not it ever heard of \`Readable\`. This is **structural typing**: compatibility comes from *structure* (which members exist, with which types), not from *names* in an inheritance tree (**nominal typing**, as with base classes and [abstract base classes](lesson:abstract-base-classes)).`,
  ],
  why: [
    py`Protocols bring duck typing and static checking together. You keep Python's flexibility — any object with the right methods works — and still get editor autocomplete and a checker that catches \`word_count(42)\` before you run anything.`,
    py`They also decouple code. The module that *uses* a capability defines a small protocol for it; classes that *provide* it don't need to import that module or inherit from anything. Standard-library classes, third-party classes and your test fakes all qualify automatically — you can't add a base class to \`io.StringIO\`, but it already matches \`Readable\`.`,
    py`The standard library's own typing is built this way: \`Iterable\`, \`Sized\`, \`SupportsInt\` and the many "Supports…" protocols in typeshed are what let \`len()\`, \`sorted()\` and \`for\` loops accept your classes.`,
  ],
  eli15: [
    py`Imagine a job ad that says "**must be able to drive a car**". It doesn't say "must be a member of the Drivers' Club". Anyone who can drive qualifies — a taxi driver, your aunt, a racing champion.`,
    py`A protocol is that job ad for objects: "must have a \`read()\` that gives back text". Any object that can do that gets the job. A regular base class is the club membership: you only qualify if you joined. Protocols check *what you can do*, not *which club you're in*.`,
  ],
  analogy: {
    title: 'Phone chargers and the USB-C port',
    body: [
      py`Your phone doesn't care which company made a charger. It cares that the plug is **USB-C shaped** and delivers the right power. Any charger with that shape works — even one designed before your phone existed, by a company that's never heard of it.`,
      py`A protocol is the description of the port's shape. A class "fits" when it has the right members with the right types. A type checker is the engineer who looks at a plug and says "that fits" or "the pins are wrong" *before* you plug it in. And \`@runtime_checkable\` is a quick glance at runtime — it only sees that *there is* a plug with the right name, not that the pins carry the right voltage.`,
    ],
    mapping: [
      ['the USB-C port specification', 'class Readable(Protocol): def read(self) -> str'],
      ['any charger with a matching plug', 'any class with a compatible read() method'],
      ['no "official partner" sticker needed', 'no inheritance needed: structural typing'],
      ['an engineer checking the pins', 'mypy / pyright comparing signatures and return types'],
      ['a quick glance: "it has a plug"', 'isinstance() with @runtime_checkable — member names only'],
      ['a charger with the plug but the wrong voltage', 'a read() that returns float: passes the glance, fails the checker'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Structure, not inheritance',
    props: {
      code: py`from typing import Protocol, runtime_checkable


@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...


class Note:
    def read(self) -> str:
        return "buy milk"


class Sensor:
    def read(self) -> float:
        return 21.5


def shout(source: Readable) -> str:
    return source.read().upper()


loud = shout(Note())
checks = isinstance(Note(), Readable), isinstance(Sensor(), Readable)
print(loud, checks, Readable in Note.__mro__)
`,
      notes: {
        5: 'A protocol lists the members something must have. `@runtime_checkable` additionally allows `isinstance()` checks.',
        9: '`Note` never mentions `Readable`. Having a matching `read()` is enough — that is *structural* typing.',
        14: '`Sensor.read` returns a float, so a type checker says `Sensor` does **not** match `Readable`.',
        19: 'The hint accepts anything shaped like `Readable`. At runtime Python simply calls `.read()` — plain duck typing.',
        24: 'Runtime checks only look for a member called `read`. Both pass — even `Sensor`, whose `read()` returns the wrong type.',
        25: '`Readable` is not in `Note.__mro__` (its list of classes to search): no inheritance was involved.',
      },
    },
    alt: 'A step-by-step trace. A runtime-checkable protocol Readable with read() -> str is defined, then two unrelated classes: Note, whose read returns "buy milk", and Sensor, whose read returns 21.5. shout(Note()) calls read and upper-cases it. isinstance checks of Note() and Sensor() against Readable are both True. The program prints BUY MILK (True, True) False — the False showing Readable is not a base class of Note.',
    caption: py`Step through with ▶. Line 24 is the key lesson: \`isinstance\` with a protocol checks **names only**. The type checker is what compares signatures.`,
  },
  syntax: [
    py`#### Declaring a protocol`,
    { code: py`from typing import Protocol


class SupportsClose(Protocol):
    def close(self) -> None: ...


class Named(Protocol):
    name: str                         # a read-write attribute


class HasArea(Protocol):
    @property
    def area(self) -> float: ...      # read-only: a property or a plain attribute both match`, lang: 'python', title: 'methods, attributes and properties' },
    py`- Inherit from \`Protocol\` (3.8+). The class body lists **members**: methods (body \`...\`), annotated attributes, and properties.
- A class matches if it has **every** member with a **compatible type**: same or more general parameters, same or more specific return type. Extra members are fine.
- \`name: str\` means "readable **and writable**". If implementers may expose it read-only, declare a \`@property\` instead.
- Keep protocols small — one to three members is typical. Name them after the capability: \`SupportsClose\`, \`Readable\`, \`HasArea\`.`,
    py`#### Using it`,
    { code: py`import io


def close_all(resources: list[SupportsClose]) -> None:
    for resource in resources:
        resource.close()


close_all([io.StringIO(), open("log.txt", "w", encoding="utf-8")])   # both match`, lang: 'python', title: 'any object with close() is accepted' },
    py`When something doesn't fit, the checker tells you exactly why:`,
    { code: py`main.py:12: error: Argument 1 to "word_count" has incompatible type "Thermometer"; expected "Readable"  [arg-type]
main.py:12: note: "Thermometer" is missing following "Readable" protocol member:
main.py:12: note:     read
main.py:13: error: Argument 1 to "word_count" has incompatible type "Sensor"; expected "Readable"  [arg-type]
main.py:13: note: Following member(s) of "Sensor" have conflicts:
main.py:13: note:     Expected:
main.py:13: note:         def read(self) -> str
main.py:13: note:     Got:
main.py:13: note:         def read(self) -> float`, lang: 'text', title: 'mypy explains protocol mismatches' },
    py`#### Runtime checks: \`@runtime_checkable\``,
    { code: py`import io
from typing import Protocol, runtime_checkable


@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...


print(isinstance(io.StringIO("hi"), Readable))   # True
print(isinstance(io.BytesIO(b"hi"), Readable))   # True!  read() returns bytes — not checked
print(isinstance(42, Readable))                  # False: no read at all`, lang: 'python', title: 'isinstance() with a protocol' },
    py`Without the decorator, \`isinstance(x, Readable)\` raises \`TypeError\`. With it, Python checks only that **each member name exists** on the object — not the parameters, not the return type, not even whether it's callable. Use it for coarse routing ("does this plugin have a \`close\`?"), never as validation. \`issubclass()\` works too, but only for protocols whose members are all methods.`,
    py`#### Callback protocols: typing functions with keyword arguments`,
    { code: py`from typing import Protocol


class OnProgress(Protocol):
    def __call__(self, done: int, total: int, *, label: str = "") -> None: ...


def copy_files(paths: list[str], on_progress: OnProgress) -> None:
    for number, path in enumerate(paths, start=1):
        on_progress(number, len(paths), label=path)


def print_progress(done: int, total: int, *, label: str = "") -> None:
    print(f"[{done}/{total}] {label}")


copy_files(["a.txt", "b.txt"], print_progress)        # OK: same shape
# copy_files(["a.txt"], lambda done, total: None)     # rejected: can't take label=`, lang: 'python', title: 'a protocol with __call__' },
    py`\`Callable[[int, int], None]\` can only describe positional parameters. A protocol with \`__call__\` can describe **keyword-only arguments, defaults, overloads** and even extra attributes on the callable. Functions, lambdas, bound methods and objects with \`__call__\` all match if their signature fits.`,
    py`#### \`typing.Self\` (3.11+): "returns an instance of whatever class I'm in"`,
    { code: py`from typing import Self


class Query:
    def __init__(self) -> None:
        self.filters: list[str] = []

    def where(self, condition: str) -> Self:     # not -> "Query"
        self.filters.append(condition)
        return self


class UserQuery(Query):
    def active(self) -> Self:
        return self.where("active")


q = UserQuery().where("age >= 18").active()      # checker: UserQuery, so .active() is allowed`, lang: 'python', title: 'fluent methods with Self' },
    py`With \`-> "Query"\`, \`UserQuery().where(...)\` would be typed as a plain \`Query\` and \`.active()\` would be an error (\`"Query" has no attribute "active"\`). \`Self\` means "the type of \`self\`", so subclasses keep their own type. It's common in protocols too: \`def __enter__(self) -> Self\`, \`def copy(self) -> Self\`.`,
    py`#### Generic protocols`,
    { code: py`from typing import Protocol


class SupportsRead[T](Protocol):
    def read(self, size: int = -1, /) -> T: ...


def read_header[T](source: SupportsRead[T]) -> T:
    return source.read(16)          # str for text streams, bytes for binary ones`, lang: 'python', title: 'a protocol with a type parameter (3.12+ syntax)' },
    py`Protocols combine naturally with [generics](lesson:generics): \`SupportsRead[str]\` accepts text streams, \`SupportsRead[bytes]\` binary ones. A protocol also makes an excellent **bound**: \`def largest[T: SupportsLessThan](...)\`.`,
    { callout: 'version', title: 'Which Python versions?', text: py`\`Protocol\` and \`@runtime_checkable\` are **3.8+** (PEP 544). \`typing.Self\` is **3.11+** (PEP 673). In **3.12**, runtime protocol checks switched to \`inspect.getattr_static\` (no more triggering properties or \`__getattr__\`) and a protocol's member list is frozen when the class is created. \`get_protocol_members\` and \`is_protocol\` are **3.13+**. The \`class SupportsRead[T](Protocol)\` syntax is **3.12+**; older code writes \`class SupportsRead(Protocol[T])\`.` },
  ],
  walkthrough: {
    title: 'Reading the word counter line by line',
    lang: 'python',
    code: READERS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 9], text: py`The protocol. Inheriting from \`Protocol\` makes it a *shape* rather than a base class; \`read(self) -> str: ...\` is the one member. \`@runtime_checkable\` lets us use it with \`isinstance\` at the bottom.` },
      { lines: [12, 13], text: py`\`word_count\` accepts *anything* Readable. Its body only uses \`.read()\`, so the hint asks for exactly that and nothing more.` },
      { lines: [16, 23], text: py`\`FakeDownload\` never imports or inherits \`Readable\`, yet matches it: \`read()\` returns a \`str\`. This is how you write test fakes without touching the real code.` },
      { lines: [26, 28], text: py`\`Thermometer\` has no \`read()\`. A type checker would reject \`word_count(Thermometer())\` before the program runs.` },
      { lines: [31, 32], text: py`A real file object from \`open()\` matches too — the standard library never heard of our protocol, and doesn't need to.` },
      { lines: [33, 34], text: py`An in-memory \`io.StringIO\` and our fake: three unrelated classes, one function, fully type-checked.` },
      { lines: [36, 37], text: py`Runtime checks: \`isinstance\` looks for a member named \`read\`. The string has none (\`str\` has no \`read\` method), and neither does the thermometer.` },
    ],
  },
  playground: {
    title: 'Anything with .read()',
    objective: 'Run it, add your own Readable class, then discover exactly what isinstance() does — and doesn\'t — check.',
    files: { 'main.py': READERS, 'notes.txt': NOTES },
    expected: py`Seven lines:

\`\`\`text
file: 12
memory: 6
download: 4
StringIO      Readable? True
FakeDownload  Readable? True
Thermometer   Readable? False
str           Readable? False
\`\`\`

Three unrelated classes all work with \`word_count\`. Switch to the **Simplified checker** variant to see what a type checker notices that \`isinstance\` misses.`,
    experiments: [
      {
        id: 'clipboard',
        task: py`Add a class \`Clipboard\` with \`__init__(self, text: str)\` and a \`read(self) -> str\` method that returns the text. Don't inherit from anything. Print \`word_count(Clipboard("copy and paste me"))\`.`,
        hint: py`Copy the shape of \`FakeDownload\`: store the text in \`__init__\`, return it from \`read\`.`,
        tests: [
          { name: 'Clipboard works with word_count', code: py`assert isinstance(ns.get('Clipboard'), type), 'Define a class named Clipboard'
assert word_count(Clipboard("copy and paste me")) == 4` },
          { name: 'Clipboard matches Readable without inheriting it', code: py`assert isinstance(Clipboard("x"), Readable)
assert Readable not in Clipboard.__mro__, 'Do not inherit from Readable — let the structure do the work'` },
        ],
        explain: py`\`Clipboard\` matches because of its *structure*: a \`read()\` that returns \`str\`. A type checker accepts \`word_count(Clipboard(...))\` for the same reason. No import, no base class, no registration.`,
      },
      {
        id: 'names-only',
        task: py`Give \`Thermometer\` a \`read(self) -> float\` method that returns \`self.celsius()\`. Run it: what does the \`isinstance\` loop say now? Then try \`word_count(Thermometer())\` at the end and read the error.`,
        hint: py`Add the method inside \`class Thermometer\`. Then the call \`word_count(Thermometer())\` crashes — comment it out again once you've seen why.`,
        tests: [
          { name: 'Thermometer now passes isinstance', code: py`assert isinstance(Thermometer(), Readable), 'Add a read() method to Thermometer'` },
          { name: 'its read() returns a float', code: py`assert isinstance(Thermometer().read(), float)` },
          { name: 'and word_count still fails on it', code: py`with raises(AttributeError):
    word_count(Thermometer())` },
        ],
        explain: py`\`isinstance\` said **True**, yet \`word_count\` crashes with \`AttributeError: 'float' object has no attribute 'split'\`. Runtime protocol checks only look for a member *named* \`read\`. A type checker compares the signature and reports \`Expected: def read(self) -> str / Got: def read(self) -> float\` before you ever run it.`,
      },
      {
        id: 'add-close',
        task: py`Add a second member to the protocol: \`def close(self) -> None: ...\`. Run it — \`FakeDownload\` is no longer Readable. Fix **FakeDownload** (not the protocol) so it matches again.`,
        hint: py`Give \`FakeDownload\` a \`close(self) -> None\` method. Its body can simply be \`pass\` (or clear \`self.body\`).`,
        tests: [
          { name: 'the protocol has read and close', code: py`import typing
assert sorted(typing.get_protocol_members(Readable)) == ['close', 'read'], 'Add def close(self) -> None: ... to Readable'` },
          { name: 'FakeDownload matches again', code: py`assert isinstance(FakeDownload("x"), Readable), 'Give FakeDownload a close() method'` },
        ],
        explain: py`A protocol is a contract: add a member and every implementer must follow. Files and \`StringIO\` already had \`close()\`, so they kept matching. \`typing.get_protocol_members\` (3.13+) lists the contract. A type checker would have pointed at every \`word_count(FakeDownload(...))\` call with \`"FakeDownload" is missing following "Readable" protocol member: close\`.`,
      },
      {
        id: 'self-type',
        task: py`Import \`Self\` from \`typing\` and give \`FakeDownload\` a method \`shouted(self) -> Self\` that returns a **new** object of the same class with the body upper-cased. Print \`FakeDownload("quiet please").shouted().read()\`.`,
        hint: py`\`type(self)(...)\` builds a new instance of whatever class \`self\` is — so subclasses get their own type back: \`return type(self)(self.body.upper())\`.`,
        tests: [
          { name: 'shouted() returns an upper-cased copy', code: py`original = FakeDownload("quiet please")
loud = original.shouted()
assert loud.read() == "QUIET PLEASE" and original.read() == "quiet please" and loud is not original` },
          { name: 'shouted is annotated -> Self', code: py`import typing
assert typing.get_type_hints(FakeDownload.shouted).get('return') is typing.Self, 'Annotate the return as Self'` },
        ],
        explain: py`\`-> Self\` tells checkers "an instance of the same class as \`self\`". A subclass \`class GzipDownload(FakeDownload)\` would get a \`GzipDownload\` back from \`shouted()\` — and \`type(self)(...)\` makes the runtime agree with that promise.`,
      },
    ],
    variants: [
      { id: 'checker', label: 'Simplified checker: names vs signatures', files: { 'main.py': CHECKER } },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How a class is matched against a protocol',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'proto', label: 'Readable (Protocol)', note: 'read(self) -> str', x: 130, y: 70, tone: 'yellow' },
        { id: 'cls', label: 'class Sensor', note: 'read(self) -> float', x: 130, y: 250, tone: 'paper' },
        { id: 'names', label: '1. member names', note: 'is there a read?', x: 400, y: 70, tone: 'blue' },
        { id: 'sigs', label: '2. parameters', note: 'callable as read()?', x: 400, y: 165, tone: 'blue' },
        { id: 'types', label: '3. types', note: 'returns a str?', x: 400, y: 260, tone: 'blue' },
        { id: 'runtime', label: 'isinstance()', note: 'stops after step 1: True', x: 650, y: 70, tone: 'kraft' },
        { id: 'checker', label: 'mypy / pyright', note: 'all three steps: mismatch', x: 650, y: 260, tone: 'red' },
      ],
      edges: [
        { from: 'proto', to: 'names', label: 'members' },
        { from: 'cls', to: 'names', label: 'compare' },
        { from: 'names', to: 'sigs' },
        { from: 'sigs', to: 'types' },
        { from: 'names', to: 'runtime', label: 'runtime check', dashed: true },
        { from: 'types', to: 'checker', label: 'static check' },
      ],
      steps: [
        { focus: ['proto', 'cls'], text: py`A protocol and an unrelated class. \`Sensor\` doesn't inherit from \`Readable\`; whether it "is" one depends only on its members.` },
        { focus: ['names'], edges: ['proto->names', 'cls->names'], text: py`**Step 1 — names.** For every protocol member (\`read\`), does the class have a member with that name? \`Sensor\` does.` },
        { focus: ['runtime'], edges: ['names->runtime'], text: py`\`isinstance(Sensor(), Readable)\` with \`@runtime_checkable\` stops **here**: every name exists, so it returns \`True\`. Fast enough to be practical, but shallow.` },
        { focus: ['sigs'], edges: ['names->sigs'], text: py`**Step 2 — parameters.** Could you call \`sensor.read()\` exactly the way the protocol allows? Extra parameters must have defaults; positional/keyword kinds must line up. Here: yes.` },
        { focus: ['types'], edges: ['sigs->types'], text: py`**Step 3 — types.** Parameters must accept at least what the protocol promises; the return type must be what it promises (or more specific). \`float\` is not \`str\`.` },
        { focus: ['checker'], edges: ['types->checker'], text: py`A type checker runs all three steps — without running your code — and reports \`Following member(s) of "Sensor" have conflicts\`. That's why protocols are mainly a *static* tool.` },
      ],
    },
    alt: 'Diagram: a protocol Readable with read() -> str and a class Sensor with read() -> float feed into three checks: member names, parameters, and types. A dashed arrow from the first check leads to isinstance(), which stops after step 1 and returns True. The full chain leads to mypy / pyright, which runs all three steps and reports a mismatch.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A protocol is still a class, but a special one. You can't create instances of it (\`Readable()\` raises \`TypeError: Protocols cannot be instantiated\`), and ordinary classes don't need to inherit from it. Its job is to be *read*: by type checkers (always) and by \`isinstance\` (only with \`@runtime_checkable\`).`,
      py`At runtime, calling \`source.read()\` is plain duck typing: Python looks the attribute up on the object when the line runs, exactly as it would without any hints. The protocol changes nothing about how the code executes — it lets tools prove ahead of time that the lookup will succeed and return the right kind of thing.`,
    ],
    technical: [
      py`#### What Python stores`,
      { code: py`import typing
from typing import Protocol, runtime_checkable


@runtime_checkable
class Named(Protocol):
    name: str

    def greet(self) -> str: ...


print(type(Named).__name__)                        # _ProtocolMeta
print(sorted(typing.get_protocol_members(Named)))  # ['greet', 'name']  (3.13+)
print(typing.is_protocol(Named))                   # True (3.13+)`, lang: 'python', title: 'protocols at runtime' },
      py`Protocol classes are built by a metaclass that records the member names when the class is created (since 3.12 that set is frozen at that moment). \`@runtime_checkable\` installs an \`isinstance\` hook that walks that set and looks each name up with \`inspect.getattr_static\` — so it **doesn't** run properties and **doesn't** trigger \`__getattr__\`. A member set to \`None\` on the class counts as "explicitly not implemented". Signatures, return types and even callability are never inspected.`,
      { code: py`class Dynamic:
    def __getattr__(self, name):           # fakes every attribute
        return lambda: "anything"


print(hasattr(Dynamic(), "read"))           # True
print(isinstance(Dynamic(), Readable))      # False on 3.12+: getattr_static ignores __getattr__`, lang: 'python', title: 'static lookup, not hasattr()', static: true },
      py`\`issubclass(cls, Proto)\` only works for protocols whose members are **all methods**: with a data member such as \`name: str\` it raises \`TypeError: Protocols with non-method members don't support issubclass()\`, because instance attributes are usually set in \`__init__\` and simply don't exist on the class.`,
      py`#### How checkers compare a class to a protocol`,
      py`For each member: the class must have it; a method must be callable in every way the protocol's method can be (parameters at least as general — contravariant — and return type at least as specific — covariant); a plain attribute \`name: str\` must be both readable and writable with exactly \`str\` (it's invariant, like a list); a \`@property\` member only requires reading. Class variables are declared with \`ClassVar[...]\`. A generic protocol infers or declares variance just like any [generic class](lesson:generics).`,
      py`#### Explicit subclassing is allowed`,
      py`\`class FakeDownload(Readable):\` is legal. The class then *also* inherits normally: it gets any methods the protocol implements, it appears in the MRO, and checkers treat the protocol's empty \`...\` methods as abstract — instantiating a subclass that forgot one is reported (\`Cannot instantiate abstract class "FakeDownload" with abstract attribute "read"\`). Subclassing a protocol does **not** make your class a protocol; only listing \`Protocol\` itself in the bases does that.`,
      py`#### ABCs with \`__subclasshook__\`: the older runtime version of the idea`,
      { code: py`from collections.abc import Iterable, Sized


class Playlist:
    def __iter__(self):
        return iter(["Intro", "Halo"])

    def __len__(self) -> int:
        return 2


print(isinstance(Playlist(), Iterable), isinstance(Playlist(), Sized))   # True True
print(Iterable in Playlist.__mro__)                                        # False`, lang: 'python', title: 'one-method ABCs are structural at runtime' },
      py`Long before \`Protocol\`, the one-method ABCs in \`collections.abc\` (\`Iterable\`, \`Sized\`, \`Hashable\`, \`Container\`…) used \`__subclasshook__\` to recognise classes by their methods. Type checkers treat them as protocols too. Bigger ABCs like \`Sequence\` or \`Mapping\` are nominal: you must inherit or \`register()\`.`,
      { callout: 'note', title: 'CPython detail', text: py`The protocol machinery lives in \`typing.py\` (a \`_ProtocolMeta\` metaclass with private attributes such as \`__protocol_attrs__\`). Those names are implementation details and have changed between versions; use the public \`typing.get_protocol_members()\` and \`typing.is_protocol()\` (3.13+) instead.` },
    ],
    production: [
      py`**Define protocols where they are consumed.** The module that needs "something that can send an email" declares \`class EmailSender(Protocol)\`. Implementations live elsewhere and never import it. This is the "ports" idea from [clean architecture](lesson:clean-architecture) and the interface-segregation principle from [SOLID](lesson:solid): many small protocols instead of one big interface.`,
      py`**Tests get simpler.** A hand-written fake with the right methods satisfies the protocol automatically and is fully type-checked — often clearer than a \`Mock\` (see [mocking](lesson:mocking)), and the checker tells you when the real interface changes and the fake didn't.`,
      py`**Don't use \`isinstance\` with protocols as validation.** It checks names only, and the docs warn that \`isinstance\` against a runtime-checkable protocol can be surprisingly slow compared with ordinary classes. In hot paths prefer a normal class check, \`hasattr\`, or simply calling the method and handling the error ([EAFP](lesson:error-handling-patterns)).`,
      py`**Reuse before you write.** \`collections.abc\` (\`Iterable\`, \`Sized\`, \`Callable\`…) and \`typing\` (\`SupportsInt\`, \`SupportsIndex\`, \`SupportsAbs\`…) already define common ones. typeshed has more (\`_typeshed.SupportsRead\`, \`SupportsWrite\`…), but \`_typeshed\` exists only for type checkers — import it under \`if TYPE_CHECKING:\` (see [static type checking](lesson:static-type-checking)) or copy the three-line protocol into your code.`,
      py`**Protocol vs ABC is a design decision, not a style choice.** Protocols for small capabilities and for types you don't own. ABCs when you want shared implementation, runtime enforcement at instantiation, and an explicit "this class is a Plugin" relationship. Many codebases use both: a protocol for the type hint, an ABC as an optional convenience base class.`,
    ],
  },
  mistakes: [
    {
      title: 'isinstance() against a protocol without @runtime_checkable',
      wrong: { code: py`from typing import Protocol


class SupportsClose(Protocol):
    def close(self) -> None: ...


def shutdown(things: list[object]) -> None:
    for thing in things:
        if isinstance(thing, SupportsClose):   # TypeError at runtime
            thing.close()`, lang: 'python' },
      right: { code: py`from typing import Protocol, runtime_checkable


@runtime_checkable
class SupportsClose(Protocol):
    def close(self) -> None: ...


def shutdown(things: list[object]) -> None:
    for thing in things:
        if isinstance(thing, SupportsClose):   # OK (checks the name "close" only)
            thing.close()`, lang: 'python' },
      explanation: py`Plain protocols are for type checkers only; Python refuses \`isinstance\` with \`TypeError: Instance and class checks can only be used with @runtime_checkable protocols\`. Add the decorator — and remember it checks names, not signatures.`,
    },
    {
      title: 'Trusting a runtime protocol check as validation',
      wrong: { code: py`@runtime_checkable
class Plugin(Protocol):
    def run(self, config: dict[str, str]) -> str: ...


def load(candidate: object) -> Plugin:
    if isinstance(candidate, Plugin):
        return candidate               # a run(self) with no parameters also gets here
    raise TypeError("not a plugin")`, lang: 'python', static: true },
      right: { code: py`import inspect
from typing import cast


def load(candidate: object) -> Plugin:
    run = getattr(candidate, "run", None)
    if not callable(run):
        raise TypeError("plugin has no run() method")
    inspect.signature(run).bind({})    # raises TypeError if it can't take one config argument
    return cast(Plugin, candidate)     # we validated by hand, so tell the checker`, lang: 'python', static: true },
      explanation: py`\`isinstance\` only proved that an attribute called \`run\` exists. For objects arriving at runtime (plugins, user classes), validate what you actually depend on, or run a smoke test. For your own code, rely on the static checker.`,
    },
    {
      title: 'Declaring an attribute when implementers expose a read-only property',
      wrong: { code: py`from typing import Protocol


class Named(Protocol):
    name: str                      # means: readable AND writable


class Product:
    def __init__(self, sku: str) -> None:
        self._sku = sku

    @property
    def name(self) -> str:
        return self._sku.title()


def label(item: Named) -> str:
    return item.name


label(Product("tea"))   # mypy: Protocol member Named.name expected settable variable, got read-only attribute`, lang: 'python' },
      right: { code: py`from typing import Protocol


class Named(Protocol):
    @property
    def name(self) -> str: ...     # only reading is required


class Product:
    def __init__(self, sku: str) -> None:
        self._sku = sku

    @property
    def name(self) -> str:
        return self._sku.title()


def label(item: Named) -> str:
    return item.name


label(Product("tea"))   # OK — and a plain attribute name: str also matches`, lang: 'python' },
      explanation: py`An annotated attribute in a protocol promises callers they can *assign* to it, so a read-only property can't satisfy it. If you only read the attribute, declare it as a property in the protocol; then both properties and plain attributes match.`,
    },
    {
      title: 'Expecting implementers to inherit the protocol\'s method bodies',
      wrong: { code: py`from typing import Protocol


class Greeter(Protocol):
    def name(self) -> str: ...

    def greet(self) -> str:
        return f"Hello, {self.name()}"     # a default implementation


class Robot:                                # matches structurally
    def name(self) -> str:
        return "R2"


Robot().greet()   # AttributeError: 'Robot' object has no attribute 'greet'`, lang: 'python' },
      right: { code: py`from typing import Protocol


class Greeter(Protocol):
    def name(self) -> str: ...

    def greet(self) -> str:
        return f"Hello, {self.name()}"


class Robot(Greeter):                       # explicit subclass: inherits greet()
    def name(self) -> str:
        return "R2"


print(Robot().greet())   # Hello, R2`, lang: 'python' },
      explanation: py`Default implementations in a protocol are only inherited by classes that **explicitly** subclass it — structural matching doesn't copy code. And worse, the structural \`Robot\` doesn't even match: \`greet\` is a protocol member too. If you want shared code, inherit explicitly (or use an ABC); keep pure protocols free of implementations.`,
    },
    {
      title: 'One giant protocol instead of small ones',
      wrong: { code: py`from typing import Protocol


class Storage(Protocol):
    def read(self, key: str) -> bytes: ...
    def write(self, key: str, data: bytes) -> None: ...
    def delete(self, key: str) -> None: ...
    def list_keys(self) -> list[str]: ...


def show_logo(store: Storage) -> bytes:     # only ever reads
    return store.read("logo.png")`, lang: 'python' },
      right: { code: py`from typing import Protocol


class Reader(Protocol):
    def read(self, key: str) -> bytes: ...


def show_logo(store: Reader) -> bytes:      # a read-only cache now fits too
    return store.read("logo.png")`, lang: 'python' },
      explanation: py`Ask for exactly what the function uses. A smaller protocol accepts more implementations (read-only caches, CDN clients, test fakes) and documents the real dependency.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Instance and class checks can only be used with @runtime_checkable protocols`,
      cause: py`\`isinstance()\` or \`issubclass()\` against a protocol that isn't decorated with \`@runtime_checkable\`.`,
      fix: py`Add \`@runtime_checkable\` above the protocol — or, better, drop the runtime check and let the type checker enforce the protocol statically.`,
    },
    {
      symptom: py`TypeError: Protocols cannot be instantiated`,
      cause: py`Calling the protocol class itself, e.g. \`Readable()\`, often while trying to build a default or a test object.`,
      fix: py`Instantiate a concrete class that matches the protocol. Protocols describe shapes; they're never objects you create.`,
    },
    {
      symptom: py`TypeError: Protocols with non-method members don't support issubclass(). Non-method members: 'name'.`,
      cause: py`\`issubclass(cls, Named)\` where the protocol has a data member. Instance attributes don't exist on the class, so Python can't decide.`,
      fix: py`Use \`isinstance(obj, Named)\` on an instance, or turn the member into a method / property if class-level checks are essential.`,
    },
    {
      symptom: py`error: Argument 1 to "word_count" has incompatible type "Thermometer"; expected "Readable"  [arg-type]  — note: "Thermometer" is missing following "Readable" protocol member: read`,
      cause: py`The class lacks a member the protocol requires (or it's misspelled).`,
      fix: py`Add the member with a compatible signature, or pass an adapter object that wraps the class and provides it.`,
    },
    {
      symptom: py`isinstance(obj, MyProtocol) is True, but calling the method later raises TypeError or AttributeError`,
      cause: py`Runtime protocol checks only confirm that the member *names* exist; the signature or return type is wrong.`,
      fix: py`Run mypy/pyright on the implementing code, and validate signatures explicitly (e.g. \`inspect.signature(...).bind(...)\`) for objects you load at runtime.`,
    },
    {
      symptom: py`error: "Query" has no attribute "active"  [attr-defined]  on UserQuery().where(...).active()`,
      cause: py`A fluent method is annotated \`-> "Query"\`, so the subclass type is lost after the first call in the chain.`,
      fix: py`Annotate it \`-> Self\` (3.11+; \`typing_extensions.Self\` before that).`,
    },
  ],
  bestPractices: [
    'Type parameters by capability: accept a small Protocol (or a collections.abc type) instead of a concrete class.',
    'Keep protocols small — usually one to three members — and name them after the capability (SupportsClose, Readable).',
    'Define a protocol in the module that consumes it; implementers should not need to import it.',
    'Declare read-only attributes as @property in the protocol so both properties and plain attributes match.',
    'Use @runtime_checkable only for coarse routing; it checks member names, not signatures or return types.',
    'Use a callback protocol (__call__) when a callable needs keyword arguments, defaults or overloads.',
    'Return Self from fluent and copy-style methods so subclasses keep their own type.',
    'Reach for an ABC instead when you need shared implementation or instantiation-time enforcement.',
  ],
  useCases: [
    'Accepting any file-like object: open files, io.StringIO, network responses, test fakes.',
    'Dependency injection: a PaymentGateway or EmailSender port with real and fake implementations.',
    'Typed callbacks and event handlers with keyword arguments (on_progress, on_error).',
    'Plugin systems where third-party classes should not need to import your base classes.',
    'Bounding generic functions: largest[T: SupportsLessThan](items) -> T.',
  ],
  whenToUse: {
    use: [
      'You care about what an object can do, not what it inherits from.',
      'Implementations include classes you don\'t own (standard library, third-party).',
      'You want lightweight, fully type-checked test fakes.',
      'A callable needs a precise signature with keyword arguments.',
    ],
    avoid: [
      'You need shared implementation for all implementers — use an ABC or a base class.',
      'You need to reject incomplete implementations at runtime — an ABC raises at instantiation.',
      'You need trustworthy runtime validation — isinstance with a protocol checks names only.',
      'There will only ever be one implementation and no tests need a fake — just use the class.',
    ],
  },
  comparison: {
    title: 'Protocol vs abstract base class',
    headers: ['', 'Protocol (structural)', 'ABC (nominal)'],
    rows: [
      ['A class qualifies by…', 'having compatible members', 'inheriting from it (or being registered)'],
      ['Implementers import it?', 'no', 'yes'],
      ['Works for classes you don\'t own?', 'yes, automatically', 'only via ABC.register()'],
      ['isinstance()', 'only with @runtime_checkable; checks member names', 'always; checks the inheritance / registration'],
      ['Incomplete implementation', 'reported by the type checker; not prevented at runtime', 'TypeError: Can\'t instantiate abstract class …'],
      ['Shared method implementations', 'only for explicit subclasses', 'yes, inherited by every subclass'],
      ['Typical use', 'small capabilities, callbacks, ports, test fakes', 'frameworks, plugin base classes, class hierarchies'],
    ],
    note: py`They combine well: hint with the protocol, and offer an optional ABC base class with helpers for people who want them. See [abstract base classes](lesson:abstract-base-classes).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'protocols-q1',
      type: 'mcq',
      prompt: py`Given \`class SupportsClose(Protocol): def close(self) -> None: ...\`, which classes does a **type checker** accept as \`SupportsClose\`? (Select all that apply.)`,
      options: [
        'class Socket: with def close(self) -> None — no base class',
        'class Db(SupportsClose): with def close(self) -> None',
        { text: 'class Door: with def close(self, force: bool) -> None', why: 'The protocol promises callers they can call close() with no arguments. A required force parameter breaks that promise. (With a default, force: bool = False, it would match.)' },
        { text: 'class Shop: with def shut(self) -> None', why: 'Structural typing compares member names too: there is no close member.' },
      ],
      answer: [0, 1],
      explanation: py`Matching is structural: any class with a compatible \`close()\` qualifies, with or without inheritance. Explicitly subclassing the protocol is also allowed. Compatible means "callable the way the protocol allows" — extra parameters must have defaults.`,
    },
    {
      id: 'protocols-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from typing import Protocol, runtime_checkable


@runtime_checkable
class Readable(Protocol):
    def read(self) -> str: ...


class Sensor:
    def read(self) -> float:
        return 21.5


class Door:
    read = None


print(isinstance(Sensor(), Readable), isinstance(Door(), Readable), isinstance("txt", Readable))`,
      options: [
        { text: 'False False False', why: 'Runtime protocol checks do not compare return types, so Sensor passes: it has a member named read.' },
        'True False False',
        { text: 'True True False', why: 'A member set to None on the class is treated as "not implemented" by runtime protocol checks (the same convention as __hash__ = None).' },
        { text: 'True False True', why: 'str has no read attribute at all.' },
      ],
      answer: 1,
      explanation: py`\`@runtime_checkable\` only checks that each member **name** exists: \`Sensor\` passes despite returning a float. A member set to \`None\` on the class counts as "not implemented" (the same convention as \`__hash__ = None\`), so \`Door\` doesn't match. \`str\` has no \`read\`.`,
    },
    {
      id: 'protocols-q3',
      type: 'bug',
      prompt: py`Running this raises \`TypeError: Instance and class checks can only be used with @runtime_checkable protocols\`. Click the line that raises it.`,
      code: py`from typing import Protocol


class SupportsClose(Protocol):
    def close(self) -> None: ...


def shutdown(things: list[object]) -> int:
    closed = 0
    for thing in things:
        if isinstance(thing, SupportsClose):
            thing.close()
            closed += 1
    return closed`,
      answerLine: 11,
      explanation: py`The \`isinstance\` call raises, because \`SupportsClose\` isn't decorated with \`@runtime_checkable\`. The fix is to add the decorator above line 4 — and remember that the runtime check only confirms a \`close\` attribute exists.`,
    },
    {
      id: 'protocols-q4',
      type: 'fill',
      prompt: 'Complete the callback protocol so a checker accepts any function callable as `on_save(path, size=1024)`.',
      code: py`from typing import ___


class OnSave(Protocol):
    def ___(self, path: str, *, size: int) -> None: ...`,
      answer: [['Protocol'], ['__call__']],
      explanation: py`A **callback protocol** is a protocol whose single member is \`__call__\`. Its signature — including the keyword-only \`size\` — describes the callables it accepts, which \`Callable[[str, int], None]\` can't express.`,
    },
    {
      id: 'protocols-q5',
      type: 'mcq',
      prompt: 'You are designing a plugin system. All plugins should share a `setup()` helper you implement once, and a plugin class missing `run()` should fail loudly the moment someone instantiates it. What fits best?',
      options: [
        { text: 'A Protocol listing setup() and run()', why: 'Structural implementers do not inherit setup(), and nothing stops an incomplete plugin from being instantiated at runtime.' },
        'An ABC with a concrete setup() and an @abstractmethod run()',
        { text: 'A @runtime_checkable Protocol plus isinstance checks', why: 'The runtime check only confirms that names exist and still gives no shared implementation.' },
        { text: 'typing.Self on every method', why: 'Self describes return types; it neither shares code nor enforces implementation.' },
      ],
      answer: 1,
      explanation: py`Shared implementation and instantiation-time enforcement are exactly what [abstract base classes](lesson:abstract-base-classes) provide: \`Plugin()\` subclasses missing \`run\` raise \`TypeError: Can't instantiate abstract class …\`. You can still *type* the plugin parameters with a small protocol if third-party plugins shouldn't have to inherit.`,
    },
    {
      id: 'protocols-q6',
      type: 'mcq',
      prompt: py`\`class Query\` has \`def where(self, condition: str) -> "Query": ... return self\`. \`class UserQuery(Query)\` adds \`active()\`. What does a type checker say about \`UserQuery().where("age > 18").active()\`, and what fixes it?`,
      options: [
        { text: 'Nothing — it is fine as written', why: 'where() is annotated to return Query, and Query has no active() method, so the checker reports an error even though the code runs.' },
        '"Query" has no attribute "active" — annotate where() with -> Self',
        { text: 'It raises AttributeError at runtime — return a new UserQuery', why: 'At runtime where() returns self, which really is a UserQuery, so active() works. The problem is purely in the annotation.' },
        { text: '"Query" has no attribute "active" — make Query a Protocol', why: 'A protocol would not change the declared return type of where().' },
      ],
      answer: 1,
      explanation: py`\`-> Self\` (3.11+) means "the type of the object the method was called on", so the chain keeps the \`UserQuery\` type. The runtime was always fine; only the static type was lost.`,
    },
    {
      id: 'protocols-q7',
      type: 'short',
      prompt: py`Why does \`@runtime_checkable\` check only member *names*, while mypy checks full signatures?`,
      answer: py`At runtime Python would have to inspect and compare signatures and return types on every \`isinstance\` call — slow, and often impossible (return types are only promises; unannotated methods have none, C functions may not expose signatures, and the real type depends on what the method returns later). A type checker works on the source code before anything runs, so it can compare every parameter and return type precisely at no runtime cost. That's why the runtime check is a cheap, shallow glance and the static check is the real verification.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'export-plugins',
      title: 'Exporter plugins',
      difficulty: 'intermediate',
      prompt: py`Build a tiny export system around a protocol.

1. Make \`Exporter\` a **runtime-checkable** protocol with two members: an attribute \`extension: str\` and a method \`export(self, rows: list[Row]) -> str\`.
2. Finish \`CsvExporter.export\`: a header line made of the first row's keys joined by commas, then one line per row with the values (\`str()\`) joined by commas, all lines joined by \`"\n"\`. An empty list returns \`""\`. For the sample orders it returns \`"item,qty\ntea,2\nmilk,1"\`.
3. Write \`export_all(rows, exporters)\`: return a dict mapping each exporter's \`extension\` to its exported text, **skipping** any object that isn't an \`Exporter\` (use \`isinstance\`).

\`CsvExporter\` and \`JsonExporter\` must **not** inherit from \`Exporter\` — they should match structurally.`,
      files: {
        'main.py': py`import json
from collections.abc import Iterable
from typing import Protocol

Row = dict[str, object]


class Exporter(Protocol):
    # TODO: an extension: str attribute and an export() method; make it runtime-checkable
    pass


class CsvExporter:
    extension = "csv"

    def export(self, rows: list[Row]) -> str:
        # TODO: header from the first row's keys, then one line per row
        return ""


class JsonExporter:
    extension = "json"

    def export(self, rows: list[Row]) -> str:
        return json.dumps(rows)


def export_all(rows: list[Row], exporters: Iterable[object]) -> dict[str, str]:
    # TODO: skip anything that isn't an Exporter; map extension -> exported text
    return {}


orders: list[Row] = [{"item": "tea", "qty": 2}, {"item": "milk", "qty": 1}]
for extension, text in export_all(orders, [CsvExporter(), JsonExporter(), "not an exporter"]).items():
    print(f"--- orders.{extension}")
    print(text)
`,
      },
      hints: [
        'Inside the protocol, write the attribute as an annotation (extension: str) and the method with a ... body. Put @runtime_checkable (imported from typing) above the class.',
        'For the CSV: header = ",".join(rows[0]); each row is ",".join(str(value) for value in row.values()). Return early with "" when rows is empty.',
        'export_all: return {e.extension: e.export(rows) for e in exporters if isinstance(e, Exporter)}',
      ],
      solution: {
        explanation: py`\`Exporter\` lists the two things \`export_all\` relies on: an \`extension\` attribute and an \`export\` method. Neither exporter class mentions it, yet both match — the checker compares members, and so does \`isinstance\` (names only) thanks to \`@runtime_checkable\`. The string \`"not an exporter"\` has neither member, so it's skipped. Because the protocol has a data member, \`issubclass(CsvExporter, Exporter)\` would raise \`TypeError\`; \`isinstance\` on instances is the check that works. Adding a third format later (a \`MarkdownExporter\`) needs no change to \`Exporter\` or \`export_all\`.`,
        files: {
          'main.py': py`import json
from collections.abc import Iterable
from typing import Protocol, runtime_checkable

Row = dict[str, object]


@runtime_checkable
class Exporter(Protocol):
    extension: str

    def export(self, rows: list[Row]) -> str: ...


class CsvExporter:
    extension = "csv"

    def export(self, rows: list[Row]) -> str:
        if not rows:
            return ""
        lines = [",".join(rows[0])]
        lines += [",".join(str(value) for value in row.values()) for row in rows]
        return "\n".join(lines)


class JsonExporter:
    extension = "json"

    def export(self, rows: list[Row]) -> str:
        return json.dumps(rows)


def export_all(rows: list[Row], exporters: Iterable[object]) -> dict[str, str]:
    return {e.extension: e.export(rows) for e in exporters if isinstance(e, Exporter)}


orders: list[Row] = [{"item": "tea", "qty": 2}, {"item": "milk", "qty": 1}]
for extension, text in export_all(orders, [CsvExporter(), JsonExporter(), "not an exporter"]).items():
    print(f"--- orders.{extension}")
    print(text)
`,
        },
      },
      tests: [
        { name: 'Exporter is a protocol with extension and export', code: py`import typing
assert typing.is_protocol(Exporter), 'Exporter must inherit from Protocol'
assert typing.get_protocol_members(Exporter) == {'extension', 'export'}, 'Declare extension: str and def export(...)'` },
        { name: 'Exporter is runtime-checkable and the exporters match it structurally', code: py`assert isinstance(CsvExporter(), Exporter) and isinstance(JsonExporter(), Exporter), 'Decorate Exporter with @runtime_checkable'
assert Exporter not in CsvExporter.__mro__ and Exporter not in JsonExporter.__mro__, 'Do not inherit from Exporter'` },
        { name: 'CSV export', code: py`rows = [{"item": "tea", "qty": 2}, {"item": "milk", "qty": 1}]
assert CsvExporter().export(rows) == "item,qty\ntea,2\nmilk,1"
assert CsvExporter().export([]) == ""` },
        { name: 'export_all maps extensions to text and skips non-exporters', code: py`rows = [{"item": "tea", "qty": 2}]
result = export_all(rows, [CsvExporter(), JsonExporter(), "nope", 42])
assert sorted(result) == ['csv', 'json']
assert result['json'] == '[{"item": "tea", "qty": 2}]'` },
      ],
    },
    {
      id: 'progress-callbacks',
      title: 'A callback protocol for progress reports',
      difficulty: 'advanced',
      prompt: py`Type a progress callback precisely — including a keyword-only argument, which \`Callable[...]\` can't describe.

1. \`OnProgress\` is a protocol whose only member is \`__call__(self, done: int, total: int, *, label: str = "") -> None\`.
2. \`process(items: list[str], on_progress: OnProgress) -> int\` calls \`on_progress(number, total, label=item)\` after each item (\`number\` counts from 1, \`total\` is \`len(items)\`) and returns how many items it processed. **Pass \`label\` by keyword.**
3. \`ProgressLog\` instances are callbacks: \`__init__\` creates \`self.lines = []\`; \`__call__\` (same signature as the protocol) appends \`f"{done}/{total} {label}"\`.
4. \`print_progress(done, total, *, label="")\` prints \`f"[{done}/{total}] {label}"\`.

The tests also check that \`process\`'s \`on_progress\` parameter is annotated with \`OnProgress\`.`,
      files: {
        'main.py': py`from typing import Protocol


class OnProgress(Protocol):
    # TODO: declare __call__(self, done: int, total: int, *, label: str = "") -> None
    pass


def process(items: list[str], on_progress) -> int:
    # TODO: call on_progress(number, total, label=item) after each item
    return 0


class ProgressLog:
    def __init__(self) -> None:
        self.lines: list[str] = []

    # TODO: __call__ with the same signature as OnProgress


def print_progress(done: int, total: int, *, label: str = "") -> None:
    pass  # TODO: print "[done/total] label"


log = ProgressLog()
process(["intro.mp3", "halo.mp3"], log)
print(log.lines)
process(["backup.zip"], print_progress)
`,
      },
      hints: [
        'The protocol member is a method named __call__ with a ... body. In process, use enumerate(items, start=1).',
        'Call on_progress(number, len(items), label=item) — label must be a keyword because the protocol makes it keyword-only.',
        'ProgressLog.__call__(self, done: int, total: int, *, label: str = "") -> None: self.lines.append(f"{done}/{total} {label}")',
      ],
      solution: {
        explanation: py`The callback protocol describes the *call signature*: two positional ints and a keyword-only \`label\` with a default. A plain function (\`print_progress\`) and an object with \`__call__\` (\`ProgressLog\`) both match, because the checker compares their signatures with \`__call__\`. \`process\` passes \`label=item\` by keyword, which is exactly what the protocol promises callbacks will receive — a callback that only took \`(done, total)\` would be rejected by the checker before it could crash with \`TypeError: got an unexpected keyword argument 'label'\`. Stateful callbacks as objects (\`ProgressLog\`) are handy in tests: you can assert on \`log.lines\` afterwards.`,
        files: {
          'main.py': py`from typing import Protocol


class OnProgress(Protocol):
    def __call__(self, done: int, total: int, *, label: str = "") -> None: ...


def process(items: list[str], on_progress: OnProgress) -> int:
    for number, item in enumerate(items, start=1):
        on_progress(number, len(items), label=item)
    return len(items)


class ProgressLog:
    def __init__(self) -> None:
        self.lines: list[str] = []

    def __call__(self, done: int, total: int, *, label: str = "") -> None:
        self.lines.append(f"{done}/{total} {label}")


def print_progress(done: int, total: int, *, label: str = "") -> None:
    print(f"[{done}/{total}] {label}")


log = ProgressLog()
process(["intro.mp3", "halo.mp3"], log)
print(log.lines)
process(["backup.zip"], print_progress)
`,
        },
      },
      tests: [
        { name: 'OnProgress is a protocol whose only member is __call__', code: py`import typing
assert typing.is_protocol(OnProgress), 'OnProgress must inherit from Protocol'
assert typing.get_protocol_members(OnProgress) == {'__call__'}, 'Declare def __call__(...) in OnProgress'` },
        { name: 'process reports each item and returns the count', code: py`log = ProgressLog()
assert process(["a.txt", "b.txt"], log) == 2
assert log.lines == ["1/2 a.txt", "2/2 b.txt"]
assert process([], ProgressLog()) == 0` },
        { name: 'label is passed by keyword', code: py`seen = []


def strict(done, total, *, label):
    seen.append((done, total, label))


process(["x.txt"], strict)
assert seen == [(1, 1, "x.txt")]` },
        { name: 'print_progress prints [done/total] label', code: py`assert capture(process, ["backup.zip"], print_progress) == "[1/1] backup.zip\n"` },
        { name: 'on_progress is annotated with OnProgress', code: py`import typing
assert typing.get_type_hints(process).get('on_progress') is OnProgress, 'Annotate on_progress: OnProgress'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'protocols-structural-typing',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is structural typing, and how does typing.Protocol relate to duck typing?',
      answer: 'Structural typing decides compatibility by an object\'s members (names and types), not by its inheritance. Protocol lets you write that shape as a type, so a checker can verify duck-typed code statically: any class with compatible members matches, without inheriting.',
      explanation: py`Duck typing is the *runtime* behaviour: Python just calls \`obj.read()\` and it works if the method exists. Nominal typing (classes, ABCs) says a type matches only if it inherits. A \`Protocol\` is the static description of a duck: \`class Readable(Protocol): def read(self) -> str: ...\`. Files, \`StringIO\` and your fakes all match without changes.`,
      code: { lang: 'python', code: py`from typing import Protocol


class Readable(Protocol):
    def read(self) -> str: ...


class FakeDownload:              # no inheritance
    def read(self) -> str:
        return "hello"


def word_count(source: Readable) -> int:
    return len(source.read().split())


word_count(FakeDownload())       # accepted by the checker` },
      whyAsked: 'Protocols are how modern Python types duck-typed code; interviewers want to hear the nominal vs structural distinction.',
      mistakes: ['Saying protocols enforce anything at runtime', 'Confusing Protocol with ABC', 'Thinking the implementing class must inherit from the protocol'],
      followUps: ['What does @runtime_checkable add?', 'Which collections.abc types behave structurally?', 'When would you still choose an ABC?'],
      modelAnswer: 'Structural typing means a type is compatible if it has the right members with the right types, regardless of what it inherits from; nominal typing means it must explicitly inherit. Python has always been duck-typed at runtime — if an object has a read method, calling read just works. typing.Protocol lets me write that expectation down as a type, for example a Readable protocol with read returning str. A type checker then accepts any class whose members match — open files, StringIO, a test fake — without them ever importing my protocol. So protocols give me static checking for duck typing without forcing inheritance.',
    },
    {
      id: 'protocols-vs-abc',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Protocol or abstract base class — how do you choose?',
      answer: 'Use a Protocol for small capabilities, types you don\'t own, callbacks and test fakes: matching is structural and static. Use an ABC when you need shared implementation, runtime enforcement at instantiation, or an explicit "is-a" relationship. They can be combined.',
      explanation: py`ABCs are nominal: classes inherit (or \`register()\`), get inherited helper methods, and instantiating a subclass that misses an \`@abstractmethod\` raises \`TypeError\`. Protocols are structural: nothing to inherit, nothing enforced at runtime, but checkers verify every call site, and classes from other libraries qualify automatically. A common pattern: hint parameters with a protocol, and offer an optional ABC with helpers.`,
      whyAsked: 'Tests design judgment rather than syntax recall.',
      mistakes: ['Claiming one always replaces the other', 'Forgetting that protocol default methods are only inherited by explicit subclasses', 'Not mentioning runtime enforcement as the ABC advantage'],
      followUps: ['How do collections.abc ABCs like Iterable recognise classes that don\'t inherit?', 'Can a class explicitly inherit from a Protocol?', 'What happens if you instantiate an ABC subclass that misses an abstract method?'],
      modelAnswer: 'I choose by what I need. A Protocol is structural: any class with matching members qualifies, including classes I do not own and simple test fakes, and the type checker verifies it statically — but nothing is enforced at runtime and there is no shared code unless someone explicitly subclasses. An ABC is nominal: implementers inherit from it, get shared helper methods, and Python refuses to instantiate a subclass that misses an abstract method. So for small capabilities like "can close" or "can send email", and for callbacks, I use protocols; for a framework base class with shared behaviour and runtime guarantees, I use an ABC. Often I combine them: the type hints use the protocol, and an ABC exists as an optional convenience base.',
    },
    {
      id: 'protocols-runtime-check-incident',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'A plugin loader does `if isinstance(obj, Plugin): obj.run(config)` with a `@runtime_checkable` Plugin protocol declaring `def run(self, config: Config) -> Report`. A third-party `SlackPlugin` defines `def run(self) -> None`; it passed the check and crashed in production with `TypeError: SlackPlugin.run() takes 1 positional argument but 2 were given`. Explain and fix.',
      answer: 'Runtime protocol checks only verify that member names exist — not parameters, return types or even callability. Validate what you depend on when loading (e.g. inspect.signature(obj.run).bind(config)), fail fast with a clear error, and type-check plugins statically against the protocol in their own CI.',
      explanation: py`\`@runtime_checkable\` adds an \`isinstance\` hook that looks up each member name with \`inspect.getattr_static\`. A method with a different signature still has the right name, so the check passes. Signatures aren't compared because that would be slow and often impossible at runtime. For untrusted, runtime-loaded code, validate explicitly at load time (signature binding, a smoke-test call in a sandbox, or a version handshake), and publish the protocol so plugin authors can run mypy/pyright against it.`,
      code: { lang: 'python', code: py`import inspect


def load_plugin(obj: object, config: object) -> object:
    run = getattr(obj, "run", None)
    if not callable(run):
        raise TypeError(f"{type(obj).__name__} has no callable run()")
    try:
        inspect.signature(run).bind(config)
    except TypeError as exc:
        raise TypeError(f"{type(obj).__name__}.run() cannot accept a config: {exc}") from exc
    return obj` },
      whyAsked: 'Shows whether you know the real limits of runtime protocol checks — a common production trap.',
      mistakes: ['Believing isinstance verified the signature', 'Blaming the plugin author only', 'Adding broad try/except around run() instead of validating at load time'],
      followUps: ['Why does Python not compare signatures at runtime?', 'What changed about runtime protocol checks in 3.12?', 'How would you version a plugin interface?'],
      modelAnswer: 'The isinstance check with a runtime-checkable protocol only confirms that each member name exists on the object; it does not look at parameters, return types, or even whether the attribute is callable. The plugin had a run attribute, so it passed, and the mismatch only surfaced when we called it with a config. For code loaded at runtime I would validate what I actually depend on when the plugin is loaded — check that run is callable and that inspect.signature(run).bind(config) succeeds — and reject it with a clear error. Statically, I would publish the protocol so plugin authors can run mypy or pyright against it in their CI, which compares the full signature.',
    },
    {
      id: 'protocols-self-builder',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'The fluent `Message` builder below loses the subclass type: checkers report `"Message" has no attribute "escalate"` on `UrgentMessage().to("ops@example.com").escalate()`. Annotate `to`, `titled` and `escalate` with `typing.Self`, and implement `UrgentMessage.escalate()` so it sets `priority` to `"high"` and returns `self`.',
      answer: 'Import Self from typing (3.11+) and annotate each fluent method -> Self; escalate sets self.priority = "high" and returns self. Self means "the type of the instance the method was called on", so chains on UrgentMessage stay UrgentMessage.',
      explanation: py`With \`-> "Message"\` the checker types \`UrgentMessage().to(...)\` as \`Message\`, which has no \`escalate\`. \`Self\` is bound to the receiver's type, so the chain keeps \`UrgentMessage\` all the way through. The runtime already worked (each method returns the real object); \`Self\` fixes the static type. Before 3.11, use \`typing_extensions.Self\` or a TypeVar bound to the class.`,
      starter: { files: { 'main.py': py`class Message:
    def __init__(self) -> None:
        self.recipients: list[str] = []
        self.subject = ""
        self.priority = "normal"

    def to(self, address: str) -> "Message":
        self.recipients.append(address)
        return self

    def titled(self, subject: str) -> "Message":
        self.subject = subject
        return self

    def render(self) -> str:
        return f"[{self.priority}] {self.subject} -> {', '.join(self.recipients)}"


class UrgentMessage(Message):
    def escalate(self) -> "UrgentMessage":
        # TODO: set priority to "high" and return self
        return self


alert = UrgentMessage().to("ops@example.com").escalate().titled("Disk full")
print(alert.render())
` } },
      tests: [
        { name: 'escalate() marks the message high priority', code: py`m = UrgentMessage().to("ops@example.com").escalate().titled("Disk full")
assert m.render() == "[high] Disk full -> ops@example.com"` },
        { name: 'chaining keeps the subclass', code: py`assert type(UrgentMessage().to("a").titled("b")) is UrgentMessage` },
        { name: 'fluent methods return Self', code: py`import typing
for method in (Message.to, Message.titled, UrgentMessage.escalate):
    assert typing.get_type_hints(method).get('return') is typing.Self, f'Annotate {method.__name__}() with -> Self'` },
      ],
      solution: { files: { 'main.py': py`from typing import Self


class Message:
    def __init__(self) -> None:
        self.recipients: list[str] = []
        self.subject = ""
        self.priority = "normal"

    def to(self, address: str) -> Self:
        self.recipients.append(address)
        return self

    def titled(self, subject: str) -> Self:
        self.subject = subject
        return self

    def render(self) -> str:
        return f"[{self.priority}] {self.subject} -> {', '.join(self.recipients)}"


class UrgentMessage(Message):
    def escalate(self) -> Self:
        self.priority = "high"
        return self


alert = UrgentMessage().to("ops@example.com").escalate().titled("Disk full")
print(alert.render())
` } },
      hints: ['from typing import Self — then replace each quoted return annotation with Self.', 'escalate needs one line before return self: self.priority = "high".'],
      whyAsked: 'Fluent builders and copy-style methods are common; Self is the modern, correct way to type them.',
      mistakes: ['Returning a new Message() inside methods, which loses the subclass at runtime too', 'Annotating with the base class name', 'Using Self in a staticmethod, where there is no self'],
      followUps: ['How did people type this before 3.11?', 'How would you write a copy() method that returns Self without mutating?', 'Can Self be used in a Protocol?'],
      modelAnswer: 'The fluent methods were annotated to return Message, so after the first call in the chain the checker only knows it has a Message, which has no escalate method. typing.Self, available since 3.11, means "the type of the object this method was called on", so I annotate to, titled and escalate with -> Self and the chain stays an UrgentMessage. escalate itself sets priority to high and returns self. At runtime nothing changes — the methods already returned the real object — it is the static type that is fixed. Before 3.11 I would use typing_extensions.Self or a TypeVar bound to Message on the self parameter.',
    },
    {
      id: 'protocols-callback-vs-callable',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your retry helper takes `on_retry: Callable[[int, Exception], None]`. The team now wants handlers to receive an optional keyword argument `delay: float`, and some handlers are objects that keep counters. How do you type it?',
      answer: 'Use a callback protocol: class OnRetry(Protocol): def __call__(self, attempt: int, error: Exception, *, delay: float = 0.0) -> None: ... — Callable can\'t express keyword arguments or defaults. Functions, lambdas and objects with a matching __call__ all satisfy it.',
      explanation: py`\`Callable[[int, Exception], None]\` describes positional parameters only. A protocol with \`__call__\` can describe keyword-only parameters, defaults, \`*args\`, overloads, and extra attributes. Stateful handler objects match as long as their \`__call__\` signature is compatible, and checkers will reject handlers that can't accept \`delay=\`.`,
      code: { lang: 'python', code: py`from typing import Protocol


class OnRetry(Protocol):
    def __call__(self, attempt: int, error: Exception, *, delay: float = 0.0) -> None: ...


class RetryCounter:
    def __init__(self) -> None:
        self.count = 0

    def __call__(self, attempt: int, error: Exception, *, delay: float = 0.0) -> None:
        self.count += 1` },
      whyAsked: 'Typed callbacks show up in every event, retry and progress API; knowing Callable\'s limits matters.',
      mistakes: ['Falling back to Callable[..., None], which accepts anything', 'Forgetting that a handler with a required extra parameter does not match', 'Thinking objects with __call__ cannot satisfy a callable type'],
      followUps: ['Can a callback protocol have attributes too?', 'How would you type a handler that may be sync or async?', 'What does ParamSpec add when wrapping callbacks?'],
      modelAnswer: 'Callable can only describe positional parameters and a return type, so it can\'t say "and an optional keyword argument delay". I would define a callback protocol — a Protocol whose only member is __call__ with the exact signature, including the keyword-only delay with a default. Plain functions, lambdas and objects with a matching __call__ method all satisfy it, so the stateful counter handlers work too. The checker then rejects handlers that couldn\'t accept delay before they fail at runtime. I would avoid Callable of dot-dot-dot, because that silently accepts any callable.',
    },
    {
      id: 'protocols-explicit-vs-implicit',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`from typing import Protocol


class Greeter(Protocol):
    def greet(self) -> str:
        return "hello"


class Explicit(Greeter):
    pass


class Implicit:
    def greet(self) -> str:
        return "hi"


print(Explicit().greet(), Implicit().greet())
print(Greeter in Explicit.__mro__, Greeter in Implicit.__mro__)` },
      options: ['hello hi / True False', 'hello hi / True True', 'TypeError: Protocols cannot be instantiated', 'hi hi / False False'],
      correctOption: 0,
      answer: '`hello hi` then `True False`. Explicit subclasses a protocol like any base class and inherits its method; Implicit only matches structurally and has no inheritance link.',
      explanation: py`Subclassing a protocol explicitly is ordinary inheritance: \`Explicit\` gets \`greet\` from \`Greeter\`, and it's not itself a protocol, so it can be instantiated. \`Implicit\` matches \`Greeter\` for a type checker, but structure doesn't create inheritance — \`Greeter\` isn't in its MRO and it wouldn't get any default methods.`,
      whyAsked: 'Probes whether you understand the runtime reality of protocols beyond the type-checker view.',
      mistakes: ['Thinking subclasses of a protocol are protocols too', 'Expecting structural matches to inherit default implementations'],
      followUps: ['When would you explicitly subclass a protocol?', 'What does a checker report if an explicit subclass forgets a method?'],
      modelAnswer: 'It prints "hello hi" and then "True False". Explicit inherits from the protocol like from any other class, so it gets the greet implementation and the protocol is in its MRO; only classes that list Protocol itself as a base are protocols, so Explicit can be instantiated. Implicit has its own greet and matches the protocol structurally for a type checker, but there is no inheritance relationship, so the protocol isn\'t in its MRO and it would not receive any default methods.',
    },
    {
      id: 'protocols-ports-and-fakes',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Your order service calls Stripe directly from business logic, which makes tests slow and couples the core to a vendor SDK. How would you use protocols to restructure it?',
      answer: 'Define a small PaymentGateway protocol in the core (the port), depend only on it in the business logic, implement a StripeGateway adapter in an outer module, and inject it at startup. Tests pass an in-memory fake that matches the protocol structurally and is fully type-checked.',
      explanation: py`This is ports-and-adapters / dependency inversion: the core owns the interface it needs, expressed as a protocol, so it never imports the vendor SDK. The adapter translates between the protocol and Stripe's API. Because matching is structural, the fake doesn't import anything from production code, and the type checker flags it when the protocol changes. Keep the protocol minimal (what the core actually calls) and in domain terms (\`charge(order_id, amount_pence) -> PaymentResult\`), not vendor terms.`,
      code: { lang: 'python', code: py`from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PaymentResult:
    ok: bool
    reference: str


class PaymentGateway(Protocol):                       # the port, owned by the core
    def charge(self, order_id: str, amount_pence: int) -> PaymentResult: ...


def checkout(order_id: str, total_pence: int, payments: PaymentGateway) -> str:
    result = payments.charge(order_id, total_pence)
    return "paid" if result.ok else "declined"


class FakeGateway:                                    # in tests: no inheritance, no SDK
    def __init__(self) -> None:
        self.charges: list[tuple[str, int]] = []

    def charge(self, order_id: str, amount_pence: int) -> PaymentResult:
        self.charges.append((order_id, amount_pence))
        return PaymentResult(ok=True, reference="fake-1")` },
      whyAsked: 'Protocols are the idiomatic Python way to express dependency inversion; this checks architecture skills, not just typing syntax.',
      mistakes: ['Putting the protocol in the adapter module (the core would then import it)', 'Mirroring the whole vendor SDK in the protocol', 'Relying on Mock without types, so tests keep passing after the interface changes'],
      followUps: ['Where should the protocol live?', 'How would you test the Stripe adapter itself?', 'When would you prefer an ABC here?'],
      modelAnswer: 'I would invert the dependency. The core defines a small PaymentGateway protocol in its own terms — say, charge with an order id and an amount in pence returning a PaymentResult — and the business logic depends only on that. A StripeGateway adapter in an outer layer implements it by calling the SDK, and it is wired in at startup. Because protocols are structural, the adapter does not even need to import the protocol, and the tests use a simple in-memory fake that records charges and is fully type-checked, so the checker tells me when the fake drifts from the interface. The adapter itself gets a few focused integration tests against Stripe\'s test mode.',
    },
  ],

  takeaways: [
    'A Protocol describes a shape — the members an object needs — and type checkers accept any class with compatible members, no inheritance needed (structural typing).',
    'Protocols are the static form of duck typing: files, StringIO, third-party classes and test fakes all match automatically.',
    '@runtime_checkable enables isinstance(), but it checks only that member names exist — never signatures, return types or callability. Don\'t use it as validation.',
    'Protocol vs ABC: protocols for small capabilities, callbacks and types you don\'t own; ABCs for shared implementation and instantiation-time enforcement.',
    'Callback protocols (a __call__ member) type callables with keyword arguments, defaults and overloads that Callable[...] can\'t express.',
    'typing.Self (3.11+) types methods that return self, so subclasses keep their own type in fluent chains.',
    'Declare read-only protocol attributes as @property; keep protocols small and define them where they\'re consumed.',
  ],
}
