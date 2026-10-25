// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SAVE_STORES = py`import json
from abc import ABC, abstractmethod
from pathlib import Path


class SaveStore(ABC):
    """Where a game keeps its saves. Subclasses decide HOW."""

    @property
    @abstractmethod
    def name(self):
        """A short label shown in menus."""

    @abstractmethod
    def save(self, slot, data):
        """Store a dict of game data under a slot name."""

    @abstractmethod
    def load(self, slot):
        """Return the dict saved in slot; raise KeyError if there is none."""

    def copy_slot(self, source, target):
        # concrete: shared by EVERY store, built only on save() and load()
        self.save(target, self.load(source))
        return f"[{self.name}] copied {source} -> {target}"


class MemoryStore(SaveStore):
    name = "memory"

    def __init__(self):
        self._slots = {}

    def save(self, slot, data):
        self._slots[slot] = dict(data)

    def load(self, slot):
        return dict(self._slots[slot])


class FileStore(SaveStore):
    name = "files"

    def __init__(self, folder):
        self.folder = Path(folder)
        self.folder.mkdir(exist_ok=True)

    def save(self, slot, data):
        (self.folder / f"{slot}.json").write_text(json.dumps(data))

    def load(self, slot):
        path = self.folder / f"{slot}.json"
        if not path.exists():
            raise KeyError(slot)
        return json.loads(path.read_text())


class CloudStore(SaveStore):
    name = "cloud"

    def save(self, slot, data):
        print(f"(pretend upload of {slot})")
    # load() is missing!


progress = {"level": 3, "coins": 120}
for store in [MemoryStore(), FileStore("saves")]:
    store.save("slot1", progress)
    print(store.copy_slot("slot1", "backup"), store.load("backup"))

try:
    CloudStore()
except TypeError as error:
    print("TypeError:", error)
`

export default {
  id: 'abstract-base-classes',
  title: 'Abstract base classes',
  summary: 'An abstract base class defines the methods every subclass must implement — Python refuses to create incomplete objects — and collections.abc gives you ready-made interfaces with free methods.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['inheritance', 'polymorphism-and-duck-typing'],
  related: ['composition', 'multiple-inheritance-mro', 'protocols', 'properties-and-encapsulation', 'container-protocols', 'special-methods', 'iterators', 'dictionaries', 'metaclasses', 'decorators', 'design-patterns', 'solid', 'typing-collections-and-unions'],
  tags: ['abc', 'ABC', 'abstractmethod', 'ABCMeta', 'abstract class', 'interface', 'abstract property', 'collections.abc', 'Sequence', 'Mapping', 'MutableMapping', 'Iterable', 'mixin methods', 'register', 'virtual subclass', '__subclasshook__', 'nominal typing', 'Protocol', 'NotImplementedError', 'template method'],
  apis: [
    { name: 'abc.ABC', summary: 'A helper base class: inherit from it to make an abstract base class (its metaclass is ABCMeta).' },
    { name: '@abc.abstractmethod', summary: 'Marks a method that subclasses must override. Classes with unimplemented abstract methods cannot be instantiated.' },
    { name: 'ABC.register(cls)', summary: 'Declares cls a "virtual subclass": isinstance/issubclass return True, but nothing is inherited or checked.' },
    { name: 'cls.__abstractmethods__', summary: 'The frozenset of names still abstract in a class; empty means the class can be instantiated.' },
    { name: 'collections.abc.Sequence', summary: 'ABC for read-only sequences. Implement __getitem__ and __len__; get __contains__, __iter__, __reversed__, index and count.' },
    { name: 'collections.abc.Mapping / MutableMapping', summary: 'ABCs for dict-like objects. Implement the core methods and get get, keys, items, values, ==, and (mutable) update, pop, setdefault.' },
    { name: 'collections.abc.Iterable', summary: 'Any object with __iter__. isinstance checks the method directly, without inheritance.' },
  ],
  docs: [
    { label: 'abc — Abstract Base Classes', url: 'https://docs.python.org/3/library/abc.html' },
    { label: 'collections.abc — ABCs for containers (with the mixin-method table)', url: 'https://docs.python.org/3/library/collections.abc.html' },
    { label: 'PEP 3119 — Introducing Abstract Base Classes', url: 'https://peps.python.org/pep-3119/' },
    { label: 'Glossary — abstract base class', url: 'https://docs.python.org/3/glossary.html#term-abstract-base-class' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`An **abstract base class** (ABC) is a class that describes *what* its subclasses must be able to do, without saying *how*. It lists required methods — **abstract methods** — and Python refuses to create an object from any class that hasn't implemented all of them.`,
    { code: py`from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        """Return the area of the shape."""


class Square(Shape):
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2


print(Square(3).area())   # 9
# Shape()  -> TypeError: Can't instantiate abstract class Shape without an implementation for abstract method 'area'`, lang: 'python', title: 'the whole idea in 15 lines' },
    py`In [polymorphism & duck typing](lesson:polymorphism-and-duck-typing) you saw that Python normally checks nothing up front: a missing method shows up as an \`AttributeError\` only when it's called. ABCs are the opt-in alternative for when you want a **written contract** that's enforced the moment an object is created.`,
    py`The standard library uses the same machinery in \`collections.abc\`: \`Sequence\`, \`Mapping\`, \`Iterable\` and friends. They let you ask "is this *any* kind of mapping?" with \`isinstance\`, and if you subclass them they hand you a pile of methods for free.`,
  ],
  why: [
    py`**Fail early, at the right place.** Without an ABC, a plugin that forgot \`load()\` gets created happily and crashes later — maybe in production, maybe far from the plugin's code. With an ABC, \`CloudStore()\` fails immediately with an error naming the missing method.`,
    py`**Document the contract in code.** The ABC *is* the list of methods a new implementation needs. A teammate writing the fifth storage backend reads one class instead of reverse-engineering the other four.`,
    py`**Share code across implementations.** An ABC can mix abstract methods with ordinary ones built on top of them (\`copy_slot()\` uses \`save()\` and \`load()\`). Every subclass inherits those for free — this is called the *template method* pattern.`,
    py`**Check capabilities, not concrete types.** \`isinstance(x, Mapping)\` accepts \`dict\`, \`OrderedDict\`, \`defaultdict\`, \`ChainMap\` and your own mapping classes; \`type(x) is dict\` rejects all but one.`,
  ],
  eli15: [
    py`Imagine a job description for "delivery driver": *must be able to pick up, drive and deliver.* The agency won't hire anyone who can't do all three — they check **at the interview**, not halfway through the first delivery.`,
    py`An abstract base class is that job description written in Python. The required skills are abstract methods. Python is the agency: if your class is missing a required method, you can't even create an object from it — you get an error right away, telling you exactly what's missing.`,
    py`The job description itself isn't a person, so you can't "hire" it either: you can't create an object directly from the ABC. You hire people who *fit* it.`,
  ],
  analogy: {
    title: 'A job description with required skills',
    body: [
      py`A company writes one job description: "Delivery driver — must: pick up parcels, drive, deliver. Everyone gets the staff handbook." Candidates bring their own way of doing each skill (van, bike, cargo bike) — but the agency checks that **all** required skills are there before signing the contract.`,
      py`Sometimes the agency accepts a recognised outside qualification without testing anything: "you're certified elsewhere? fine, you count as a driver." That's convenient but trusts the paperwork — and those drivers never received the staff handbook.`,
    ],
    mapping: [
      ['the job description', 'the abstract base class (class SaveStore(ABC))'],
      ['required skills', '@abstractmethod methods: save(), load()'],
      ['the staff handbook everyone gets', 'concrete methods in the ABC: copy_slot()'],
      ['refusing to sign an incomplete candidate', 'TypeError when instantiating a subclass with missing methods'],
      ['you can\'t hire the job description itself', 'SaveStore() raises TypeError'],
      ['accepting an outside certificate unchecked', 'SaveStore.register(Other): a virtual subclass, no checks, no inherited methods'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Complete subclasses work; incomplete ones can\'t be created',
    props: {
      code: py`from abc import ABC, abstractmethod


class Exporter(ABC):
    @abstractmethod
    def export(self, rows):
        """Return the rows as text."""

    def save(self, rows):                 # concrete, shared
        return f"saved {len(self.export(rows))} chars"


class CsvExporter(Exporter):
    def export(self, rows):
        return "\n".join(",".join(map(str, r)) for r in rows)


class BrokenExporter(Exporter):
    def exprot(self, rows):               # typo!
        return ""


print(CsvExporter().save([(1, 2), (3, 4)]))
try:
    BrokenExporter()
except TypeError as error:
    print(error)
`,
      notes: {
        5: '`@abstractmethod` marks `export` as required. The body is just a docstring — it documents the contract.',
        9: 'A **concrete** method inside the ABC. It calls `self.export(...)`, trusting every subclass to provide it.',
        23: '`CsvExporter` implements `export`, so it can be instantiated. `save()` is inherited from the ABC and calls the subclass\'s `export`.',
        25: 'Creating `BrokenExporter` fails **here, at instantiation** — the misspelt `exprot` doesn\'t count, so `export` is still abstract.',
        27: 'The message names the class and the exact missing method.',
      },
    },
    alt: 'A step-by-step trace. An abstract Exporter class with an abstract export method and a concrete save method is defined, followed by CsvExporter, which implements export, and BrokenExporter, which misspells it as exprot. CsvExporter().save is called: save runs, calls CsvExporter.export, and prints "saved 7 chars". Then BrokenExporter() raises TypeError at instantiation, which is caught, and the message "Can\'t instantiate abstract class BrokenExporter without an implementation for abstract method \'export\'" is printed.',
    caption: py`The typo is caught the moment someone tries to create a \`BrokenExporter\` — not later when \`export()\` is finally called. (The exact error wording is from Python 3.12+; older versions say "…with abstract method export".)`,
  },
  syntax: [
    py`#### 1. Define the contract`,
    { code: py`from abc import ABC, abstractmethod


class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount_cents):
        """Charge the customer; return a transaction id."""

    @abstractmethod
    def refund(self, transaction_id):
        """Refund a previous charge."""

    def charge_and_receipt(self, amount_cents):      # concrete helper
        tx = self.charge(amount_cents)
        return f"Paid {amount_cents / 100:.2f} (transaction {tx})"`, lang: 'python', title: 'abstract + concrete methods side by side' },
    py`- Inherit from \`ABC\` (or write \`class PaymentGateway(metaclass=ABCMeta)\` — same effect).
- Decorate each required method with \`@abstractmethod\`. A docstring or \`...\` is enough as a body.
- Ordinary methods are allowed and inherited as usual.`,
    py`#### 2. Implement it — completely`,
    { code: py`class FakeGateway(PaymentGateway):
    def __init__(self):
        self.charges = []

    def charge(self, amount_cents):
        self.charges.append(amount_cents)
        return f"tx-{len(self.charges)}"

    def refund(self, transaction_id):
        print("refunded", transaction_id)


print(FakeGateway().charge_and_receipt(1999))   # Paid 19.99 (transaction tx-1)`, lang: 'python', title: 'every abstract method overridden → instantiable' },
    py`A subclass that overrides only **some** abstract methods is itself still abstract. That's fine for an intermediate layer, but creating an instance raises \`TypeError\`.`,
    { callout: 'note', title: 'When does the check happen?', text: py`At **instantiation** (\`FakeGateway()\`), not when the class is defined and not when a method is called. Defining an incomplete subclass is legal — it might be an intermediate abstract layer.` },
    py`#### 3. Abstract methods can have a default body`,
    { code: py`class Plugin(ABC):
    @abstractmethod
    def setup(self, config):
        self.config = config                # sensible shared default


class SearchPlugin(Plugin):
    def setup(self, config):
        super().setup(config)               # reuse it explicitly
        self.index = {}`, lang: 'python', title: 'abstract does not mean empty', static: true },
    py`The subclass still **must** override \`setup\`, but it can call the ABC's version through \`super()\` (see [inheritance](lesson:inheritance)).`,
    py`#### 4. Abstract properties, class methods and static methods`,
    { code: py`from abc import ABC, abstractmethod


class Sensor(ABC):
    @property
    @abstractmethod                         # abstractmethod goes INNERMOST
    def unit(self):
        """e.g. "°C" or "hPa"."""

    @classmethod
    @abstractmethod
    def from_config(cls, config):
        """Build a sensor from a config dict."""


class Thermometer(Sensor):
    unit = "°C"                             # a plain class attribute satisfies an abstract property

    @classmethod
    def from_config(cls, config):
        return cls()


print(Thermometer.from_config({}).unit)    # °C`, lang: 'python', title: 'stack @abstractmethod under the other decorator' },
    { callout: 'warn', title: 'Decorator order matters', text: py`Write \`@property\` **above** \`@abstractmethod\`. The other way round raises \`AttributeError: attribute '__isabstractmethod__' of 'property' objects is not writable\` when the class is defined. The old \`abc.abstractproperty\` is deprecated (since 3.3) — use the stacked form. See [properties & encapsulation](lesson:properties-and-encapsulation) and [decorators](lesson:decorators).` },
    py`#### 5. Ready-made ABCs in \`collections.abc\``,
    { code: py`from collections.abc import Iterable, Mapping, Sequence

print(isinstance([1, 2], Sequence))           # True
print(isinstance((1, 2), Sequence))           # True
print(isinstance({"a": 1}, Mapping))          # True
print(isinstance({1, 2}, Sequence))           # False: sets have no order or indexes
print(isinstance(range(3), Iterable))         # True`, lang: 'python', title: 'isinstance against capabilities' },
    py`Subclass one and implement its abstract methods, and you inherit its **mixin methods** (ready-made methods written on top of yours):

| ABC | you implement | you get for free |
|---|---|---|
| \`Iterable\` | \`__iter__\` | — |
| \`Sequence\` | \`__getitem__\`, \`__len__\` | \`__contains__\`, \`__iter__\`, \`__reversed__\`, \`index\`, \`count\` |
| \`MutableSequence\` | + \`__setitem__\`, \`__delitem__\`, \`insert\` | + \`append\`, \`extend\`, \`pop\`, \`remove\`, \`reverse\`, \`clear\`, \`+=\` |
| \`Mapping\` | \`__getitem__\`, \`__iter__\`, \`__len__\` | \`__contains__\`, \`keys\`, \`items\`, \`values\`, \`get\`, \`==\`, \`!=\` |
| \`MutableMapping\` | + \`__setitem__\`, \`__delitem__\` | + \`pop\`, \`popitem\`, \`clear\`, \`update\`, \`setdefault\` |`,
    py`#### 6. Virtual subclasses with \`register\``,
    { code: py`from collections.abc import Sequence


class Shelf:
    """A third-party class we can't edit."""

    def __init__(self, books):
        self._books = list(books)

    def __getitem__(self, index):
        return self._books[index]

    def __len__(self):
        return len(self._books)


print(isinstance(Shelf([]), Sequence))   # False
Sequence.register(Shelf)                  # "trust me, it's a sequence"
print(isinstance(Shelf([]), Sequence))   # True
print(hasattr(Shelf([]), "index"))       # False: nothing is inherited`, lang: 'python', title: 'register: isinstance says yes, nothing else changes' },
    py`\`register()\` (also usable as a class decorator, \`@Sequence.register\`) makes \`isinstance\`/\`issubclass\` return \`True\` **without** inheritance. Python doesn't check that the methods exist and the class doesn't get any mixin methods. It's for classes you can't change — the standard library uses it to make \`tuple\`, \`str\` and \`range\` count as \`Sequence\`s.`,
  ],
  walkthrough: {
    title: 'Reading the save-store program',
    lang: 'python',
    code: SAVE_STORES,
    intro: py`This is the playground program. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [6, 7], text: py`\`SaveStore\` inherits from \`ABC\`, which turns on the abstract-method checks. The docstring states the job: subclasses decide *how* saves are stored.` },
      { lines: [9, 20], text: py`Three requirements: a \`name\` (an abstract **property**, note \`@property\` above \`@abstractmethod\`), plus \`save()\` and \`load()\`. The bodies are only docstrings — they describe the contract.` },
      { lines: [22, 25], text: py`\`copy_slot()\` is **concrete**. It's written once, using only the abstract methods, so it works for every store — memory, files, or one written next year.` },
      { lines: [28, 38], text: py`\`MemoryStore\` keeps saves in a dict. \`name = "memory"\` is a plain class attribute; that's enough to satisfy the abstract property.` },
      { lines: [41, 55], text: py`\`FileStore\` writes one JSON file per slot using [pathlib](lesson:pathlib). Different storage, same three names — callers can't tell the difference.` },
      { lines: [58, 63], text: py`\`CloudStore\` forgot \`load()\`. Defining the class is allowed…` },
      { lines: [66, 69], text: py`The loop uses both complete stores polymorphically. \`copy_slot\` comes from the ABC; \`save\`/\`load\` come from each subclass.` },
      { lines: [71, 74], text: py`…but **creating** a \`CloudStore\` raises \`TypeError\` naming the missing method. The bug is caught before any game data is trusted to it.` },
    ],
  },
  playground: {
    title: 'Pluggable save stores',
    objective: 'Complete the broken store, grow the contract, register an outside class, and get free methods from collections.abc.',
    files: { 'main.py': SAVE_STORES },
    expected: py`\`\`\`text
[memory] copied slot1 -> backup {'level': 3, 'coins': 120}
[files] copied slot1 -> backup {'level': 3, 'coins': 120}
TypeError: Can't instantiate abstract class CloudStore without an implementation for abstract method 'load'
\`\`\``,
    experiments: [
      {
        id: 'complete-cloud',
        task: py`Finish \`CloudStore\`: add a \`load(self, slot)\` method that raises \`KeyError(slot)\` (our pretend cloud is always empty). The \`TypeError\` line should disappear from the output.`,
        hint: py`Inside \`CloudStore\`, replace the \`# load() is missing!\` comment with \`def load(self, slot): raise KeyError(slot)\` (on two lines).`,
        tests: [
          { name: 'CloudStore can be created', code: py`assert CloudStore().name == "cloud"` },
          { name: 'load raises KeyError', code: py`with raises(KeyError):
    CloudStore().load("slot1")` },
          { name: 'no TypeError printed', code: py`assert "TypeError" not in output` },
        ],
        explain: py`Once every abstract method has a concrete override, \`CloudStore.__abstractmethods__\` becomes empty and instantiation is allowed. The ABC doesn't check *what* your \`load\` does — only that it exists.`,
      },
      {
        id: 'grow-contract',
        task: py`Add a new **abstract** method \`slots(self)\` to \`SaveStore\` ("return a sorted list of slot names"), then implement it in \`MemoryStore\` (\`sorted(self._slots)\`) and \`FileStore\` (sorted file stems).`,
        hint: py`In \`FileStore\`: \`return sorted(path.stem for path in self.folder.glob("*.json"))\`. Forgetting one of the two implementations makes the loop crash with a \`TypeError\` — try it!`,
        tests: [
          { name: 'slots is abstract on SaveStore', code: py`assert "slots" in SaveStore.__abstractmethods__` },
          { name: 'MemoryStore.slots() lists sorted slot names', code: py`m = MemoryStore()
m.save("b", {})
m.save("a", {})
assert m.slots() == ["a", "b"]` },
          { name: 'FileStore.slots() lists saved files', code: py`f = FileStore("exp_saves")
f.save("zeta", {})
f.save("alpha", {})
assert f.slots() == ["alpha", "zeta"]` },
        ],
        explain: py`Growing an ABC is a breaking change by design: every existing subclass that lacks the new method immediately refuses to instantiate, so you find every implementation that needs updating — instead of discovering it when \`slots()\` is first called in production.`,
      },
      {
        id: 'register-virtual',
        task: py`A teammate's class doesn't inherit from \`SaveStore\`. Paste it below the other stores, then make \`isinstance(DropboxClient(), SaveStore)\` return \`True\` **without** changing its \`class\` line:

\`\`\`python
class DropboxClient:
    name = "dropbox"

    def save(self, slot, data):
        print("uploading", slot)

    def load(self, slot):
        raise KeyError(slot)
\`\`\``,
        hint: py`Add \`SaveStore.register(DropboxClient)\` after the class (or put \`@SaveStore.register\` above it).`,
        tests: [
          { name: 'DropboxClient counts as a SaveStore', code: py`assert ns.get('DropboxClient') is not None, 'Paste the DropboxClient class'
assert isinstance(DropboxClient(), SaveStore)` },
          { name: 'it is a virtual subclass: nothing is inherited', code: py`assert SaveStore not in DropboxClient.__mro__
assert not hasattr(DropboxClient(), "copy_slot")` },
        ],
        explain: py`\`register()\` only changes what \`isinstance\`/\`issubclass\` answer. \`DropboxClient\` gains no \`copy_slot\`, and Python never verified it has \`save\`/\`load\` — delete its \`load\` and \`isinstance\` still says \`True\`. Use it for classes you can't edit, and make sure they really honour the contract.`,
      },
      {
        id: 'leaderboard-sequence',
        task: py`Get methods for free from \`collections.abc\`. Add:

\`\`\`python
from collections.abc import Sequence


class Leaderboard(Sequence):
    def __init__(self, scores):
        self._scores = sorted(scores, reverse=True)
\`\`\`

…and implement **only** \`__getitem__\` and \`__len__\`. Then check that \`in\`, \`.index()\`, \`.count()\` and \`reversed()\` work.`,
        hint: py`\`def __getitem__(self, index): return self._scores[index]\` and \`def __len__(self): return len(self._scores)\`.`,
        tests: [
          { name: 'indexing and len work', code: py`lb = Leaderboard([30, 90, 55])
assert lb[0] == 90 and len(lb) == 3` },
          { name: 'mixin methods come for free', code: py`lb = Leaderboard([30, 90, 55, 90])
assert 55 in lb and lb.index(55) == 2 and lb.count(90) == 2
assert list(reversed(lb)) == [30, 55, 90, 90]
assert "index" not in Leaderboard.__dict__, 'Let Sequence provide index()'` },
          { name: 'it is a real Sequence', code: py`from collections.abc import Sequence
assert isinstance(Leaderboard([1]), Sequence)` },
        ],
        explain: py`\`Sequence\` implements \`__contains__\`, \`__iter__\`, \`__reversed__\`, \`index\` and \`count\` using nothing but your \`__getitem__\` and \`__len__\`. Two methods written, five received — and \`isinstance(lb, Sequence)\` is genuinely \`True\` because \`Leaderboard\` inherits from it.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'collections.abc: small interfaces that build on each other',
    props: {
      width: 760,
      height: 380,
      nodes: [
        { id: 'iterable', label: 'Iterable', note: '__iter__', x: 120, y: 50, tone: 'blue' },
        { id: 'sized', label: 'Sized', note: '__len__', x: 380, y: 50, tone: 'blue' },
        { id: 'container', label: 'Container', note: '__contains__', x: 640, y: 50, tone: 'blue' },
        { id: 'collection', label: 'Collection', note: 'all three', x: 380, y: 150, tone: 'ink' },
        { id: 'sequence', label: 'Sequence', note: 'needs __getitem__, __len__', x: 210, y: 250, tone: 'yellow' },
        { id: 'mapping', label: 'Mapping', note: 'needs __getitem__, __iter__, __len__', x: 560, y: 250, tone: 'yellow' },
        { id: 'leaderboard', label: 'Leaderboard', note: 'your class', x: 210, y: 345, tone: 'paper' },
        { id: 'config', label: 'Config', note: 'your class', x: 560, y: 345, tone: 'paper' },
      ],
      edges: [
        { from: 'collection', to: 'iterable', label: 'is-a' },
        { from: 'collection', to: 'sized', label: 'is-a' },
        { from: 'collection', to: 'container', label: 'is-a' },
        { from: 'sequence', to: 'collection', label: 'is-a' },
        { from: 'mapping', to: 'collection', label: 'is-a' },
        { from: 'leaderboard', to: 'sequence', label: 'subclass' },
        { from: 'config', to: 'mapping', label: 'subclass' },
      ],
      steps: [
        { focus: ['iterable', 'sized', 'container'], text: py`The smallest ABCs ask for **one** method each. They're special: \`isinstance(x, Iterable)\` checks whether \`type(x)\` has \`__iter__\` — no inheritance or registration needed (via a hook called \`__subclasshook__\`).` },
        { focus: ['collection', 'iterable', 'sized', 'container'], edges: ['collection->iterable', 'collection->sized', 'collection->container'], text: py`\`Collection\` combines them: anything sized, iterable and supporting \`in\`. Lists, dicts, sets and strings all count.` },
        { focus: ['sequence', 'collection'], edges: ['sequence->collection'], text: py`\`Sequence\` adds *order and positions*. Its abstract methods are \`__getitem__\` and \`__len__\`; its **mixin methods** — \`__contains__\`, \`__iter__\`, \`__reversed__\`, \`index\`, \`count\` — are written in terms of those two.` },
        { focus: ['mapping', 'collection'], edges: ['mapping->collection'], text: py`\`Mapping\` is the read-only dict interface: implement \`__getitem__\`, \`__iter__\`, \`__len__\`; get \`get\`, \`keys\`, \`items\`, \`values\`, \`in\` and \`==\`. \`MutableMapping\` adds \`update\`, \`pop\`, \`setdefault\`… once you write \`__setitem__\` and \`__delitem__\`.` },
        { focus: ['leaderboard', 'config', 'sequence', 'mapping'], edges: ['leaderboard->sequence', 'config->mapping'], text: py`Your classes subclass the ABC, write the 2–3 core methods, and inherit everything else — and \`isinstance(lb, Sequence)\` is \`True\`, so code that accepts "any sequence" accepts yours. Unlike the one-method ABCs, \`Sequence\` and \`Mapping\` **don't** guess from method names: inherit or \`register()\`.` },
      ],
    },
    alt: 'Diagram of collections.abc. Top row: Iterable (__iter__), Sized (__len__) and Container (__contains__). Collection inherits from all three. Sequence (needs __getitem__ and __len__) and Mapping (needs __getitem__, __iter__ and __len__) both inherit from Collection. At the bottom, a user class Leaderboard subclasses Sequence and a user class Config subclasses Mapping.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`@abstractmethod\` doesn't do much by itself: it just sets a flag, \`__isabstractmethod__ = True\`, on the function. The real work happens when the class is created. Because \`ABC\`'s *metaclass* (the class that builds classes — see [metaclasses](lesson:metaclasses)) is \`ABCMeta\`, Python collects every name that is still flagged abstract into a frozenset called \`__abstractmethods__\`.`,
      { code: py`from abc import ABC, abstractmethod


class Exporter(ABC):
    @abstractmethod
    def export(self, rows): ...

    @abstractmethod
    def extension(self): ...


class HalfDone(Exporter):
    def export(self, rows):
        return ""


print(sorted(Exporter.__abstractmethods__))   # ['export', 'extension']
print(sorted(HalfDone.__abstractmethods__))   # ['extension']`, lang: 'python', title: 'peek at what is still missing' },
      py`When you call \`HalfDone()\`, Python sees a non-empty set and raises \`TypeError\` instead of creating the object. Override every name and the set is empty — the class becomes *concrete*.`,
      { callout: 'warn', title: 'No ABC, no check', text: py`\`@abstractmethod\` on a class that doesn't inherit from \`ABC\` (or use \`metaclass=ABCMeta\`) is silently ignored: the class can be instantiated and the "abstract" method just returns \`None\`.` },
    ],
    technical: [
      py`#### How \`isinstance\` works with ABCs`,
      py`\`ABCMeta\` overrides \`__instancecheck__\` and \`__subclasscheck__\`. \`issubclass(C, SomeABC)\` is \`True\` if any of these holds:`,
      py`1. \`SomeABC\` is in \`C.__mro__\` (real inheritance);
2. \`C\` (or a base) was registered with \`SomeABC.register(C)\` — a *virtual subclass*;
3. \`SomeABC.__subclasshook__(C)\` returns \`True\`. The one-method ABCs (\`Iterable\`, \`Sized\`, \`Container\`, \`Hashable\`, \`Callable\`…) define a hook that checks whether \`C\` has the method, which is why \`isinstance(obj, Iterable)\` works for any class with \`__iter__\`.`,
      py`Results are cached per ABC, so repeated checks don't redo the work. Composite ABCs like \`Sequence\` and \`Mapping\` deliberately have **no** structural hook: "has \`__getitem__\` and \`__len__\`" also describes a mapping, so you must say which one you mean by inheriting or registering. The standard library registers \`tuple\`, \`str\`, \`range\` and \`memoryview\` as \`Sequence\`, \`list\` as \`MutableSequence\`, and \`dict\` as \`MutableMapping\` — that's why \`Sequence\` isn't in \`list.__mro__\` yet \`isinstance([], Sequence)\` is \`True\`.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython implements \`ABCMeta\`'s bookkeeping in C (the \`_abc\` module), with a pure-Python fallback (\`_py_abc\`). The refusal to instantiate is enforced inside \`object.__new__\`, which checks a type flag set when \`__abstractmethods__\` is non-empty. The *behaviour* is guaranteed by the language docs; these mechanics are not.` },
      py`#### Abstractness is computed once`,
      py`\`__abstractmethods__\` is calculated when the class statement runs. If you later monkey-patch a method onto the class, the set isn't updated automatically — \`abc.update_abstractmethods(cls)\` (3.10+) recomputes it, which class decorators that add methods (like \`dataclass\`) rely on.`,
      py`#### \`NotImplementedError\` vs \`@abstractmethod\` vs \`NotImplemented\``,
      py`- \`raise NotImplementedError\` in a base method: the pre-ABC idiom. Instances can be created; the error appears only when the method is **called**.
- \`@abstractmethod\`: the error appears when the object is **created**.
- \`NotImplemented\` (no "Error") is a different thing entirely: a special value that binary operators like \`__eq__\` or \`__add__\` *return* to say "try the other operand" (see [operator overloading](lesson:operator-overloading)).`,
    ],
    production: [
      py`#### Where ABCs earn their keep`,
      py`- **Plugin and backend interfaces** — storage, payment, notification backends — especially when they share helper methods (template methods) and new implementations are written by other teams.
- **Custom containers**: subclassing \`Mapping\`/\`MutableMapping\`/\`Sequence\` gets you a complete, consistent API from a few methods. Unlike subclassing \`dict\`, \`MutableMapping.update()\` and \`setdefault()\` go through *your* \`__setitem__\`, so validation can't be bypassed (compare [composition](lesson:composition)).
- **Type hints for parameters**: annotate with \`collections.abc\` types — \`Iterable[str]\`, \`Sequence[float]\`, \`Mapping[str, int]\` — to accept the widest range of inputs (subscripting them works since 3.9; the \`typing.List\`-style aliases are deprecated). See [collections in type hints](lesson:typing-collections-and-unions).`,
      py`#### ABC or Protocol?`,
      py`Use an **ABC** when you own the hierarchy and want runtime enforcement or shared code. Use a [**Protocol**](lesson:protocols) when you just need to describe what a function requires, especially from classes you don't control — matching methods are enough, no inheritance. Many codebases use both: a Protocol in function signatures, an ABC as a convenient base class for their own implementations.`,
      py`#### Don't abstract too early`,
      py`An ABC with exactly one implementation is usually ceremony. Wait until you have (or are about to have) a second implementation — even if it's a test fake — then extract the interface. Keep interfaces small: several focused ABCs beat one giant one (the *interface segregation principle* in [SOLID](lesson:solid)).`,
      py`#### Metaclass conflicts`,
      py`Because \`ABC\` uses the \`ABCMeta\` metaclass, combining it with another class that has a *different* metaclass (some ORM models, \`Enum\`) can fail with \`TypeError: metaclass conflict\`. The fix is a metaclass that inherits from both, or — usually simpler — a Protocol or composition instead.`,
    ],
  },
  mistakes: [
    {
      title: 'Using @abstractmethod without inheriting from ABC',
      wrong: { code: py`from abc import abstractmethod


class Exporter:                      # no ABC!
    @abstractmethod
    def export(self, rows): ...


broken = Exporter()                  # no error...
print(broken.export([1, 2]))         # None — the "abstract" method ran`, lang: 'python' },
      right: { code: py`from abc import ABC, abstractmethod


class Exporter(ABC):
    @abstractmethod
    def export(self, rows): ...


try:
    Exporter()
except TypeError as error:
    print(error)   # Can't instantiate abstract class Exporter ...`, lang: 'python' },
      explanation: py`The check is performed by the \`ABCMeta\` metaclass. Without \`ABC\` (or \`metaclass=ABCMeta\`) the decorator only sets a flag nobody reads.`,
    },
    {
      title: 'Putting @abstractmethod above @property',
      wrong: { code: py`class Sensor(ABC):
    @abstractmethod
    @property
    def unit(self): ...
# AttributeError: attribute '__isabstractmethod__' of 'property' objects is not writable`, lang: 'python', static: true },
      right: { code: py`from abc import ABC, abstractmethod


class Sensor(ABC):
    @property
    @abstractmethod
    def unit(self): ...`, lang: 'python' },
      explanation: py`Decorators apply bottom-up. \`@abstractmethod\` must wrap the plain function first; \`@property\` then sees an abstract getter and reports itself as abstract. Same rule for \`@classmethod\` and \`@staticmethod\`.`,
    },
    {
      title: 'Relying on NotImplementedError to enforce an interface',
      wrong: { code: py`class Store:
    def load(self, slot):
        raise NotImplementedError


class CloudStore(Store):
    pass                              # forgot load()


store = CloudStore()                  # created without complaint
# ... much later, in production:
# store.load("slot1")  -> NotImplementedError`, lang: 'python' },
      right: { code: py`from abc import ABC, abstractmethod


class Store(ABC):
    @abstractmethod
    def load(self, slot): ...


class CloudStore(Store):
    pass


try:
    CloudStore()                      # fails right here, naming 'load'
except TypeError as error:
    print(error)`, lang: 'python' },
      explanation: py`\`NotImplementedError\` only fires when the missing method is finally called — maybe on a rarely used code path. \`@abstractmethod\` turns the same mistake into an immediate error at object creation.`,
    },
    {
      title: 'Expecting register() to check or provide methods',
      wrong: { code: py`from collections.abc import Sequence


class Shelf:
    def __init__(self, books):
        self.books = books


Sequence.register(Shelf)              # no __getitem__ / __len__ at all!
shelf = Shelf(["Dune"])
print(isinstance(shelf, Sequence))    # True — but it's a lie
# shelf.index("Dune")  -> AttributeError: 'Shelf' object has no attribute 'index'`, lang: 'python' },
      right: { code: py`from collections.abc import Sequence


class Shelf(Sequence):                # inherit: checked AND you get index/count
    def __init__(self, books):
        self.books = list(books)

    def __getitem__(self, index):
        return self.books[index]

    def __len__(self):
        return len(self.books)


print(Shelf(["Dune"]).index("Dune"))  # 0`, lang: 'python' },
      explanation: py`\`register()\` is a promise, not a check, and virtual subclasses inherit nothing. Inherit from the ABC whenever you can edit the class; reserve \`register()\` for classes you can't change that already honour the full interface.`,
    },
    {
      title: 'Checking for dict instead of Mapping',
      wrong: { code: py`def merge_settings(defaults, overrides):
    if not isinstance(overrides, dict):
        raise TypeError("overrides must be a dict")
    return {**defaults, **overrides}`, lang: 'python' },
      right: { code: py`from collections.abc import Mapping
from types import MappingProxyType


def merge_settings(defaults, overrides):
    if not isinstance(overrides, Mapping):
        raise TypeError("overrides must be a mapping")
    return {**defaults, **overrides}


frozen = MappingProxyType({"theme": "dark"})   # read-only, not a dict
print(merge_settings({"theme": "light"}, frozen))   # {'theme': 'dark'}`, lang: 'python' },
      explanation: py`\`isinstance(x, dict)\` rejects perfectly good mappings such as \`MappingProxyType\`, \`ChainMap\` or your own \`Mapping\` subclass. Check against the capability you need from \`collections.abc\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Can't instantiate abstract class CloudStore without an implementation for abstract method 'load'`,
      cause: py`The subclass doesn't override every abstract method — it's missing, misspelt (\`laod\`), or defined at the wrong indentation (outside the class). Before 3.12 the message reads "…with abstract method load".`,
      fix: py`Implement the named method(s) in the subclass with exactly the same name. Print \`CloudStore.__abstractmethods__\` to see everything still missing.`,
    },
    {
      symptom: py`TypeError: Can't instantiate abstract class Thermometer without an implementation for abstract method 'unit'`,
      cause: py`An abstract **property** wasn't overridden.`,
      fix: py`Define it in the subclass — as a \`@property\` or simply as a class attribute (\`unit = "°C"\`).`,
    },
    {
      symptom: py`AttributeError: attribute '__isabstractmethod__' of 'property' objects is not writable`,
      cause: py`\`@abstractmethod\` was placed above \`@property\` (or \`@classmethod\`/\`@staticmethod\`).`,
      fix: py`Swap the order: \`@property\` on top, \`@abstractmethod\` directly above the \`def\`.`,
    },
    {
      symptom: py`isinstance(obj, Sequence) is False although the class has __getitem__ and __len__.`,
      cause: py`Composite ABCs like \`Sequence\` and \`Mapping\` don't detect methods structurally (only one-method ABCs like \`Iterable\` and \`Sized\` do).`,
      fix: py`Inherit from \`Sequence\` (and get the mixin methods), or call \`Sequence.register(YourClass)\`.`,
    },
    {
      symptom: py`TypeError: metaclass conflict: the metaclass of a derived class must be a (non-strict) subclass of the metaclasses of all its bases`,
      cause: py`The class inherits from \`ABC\` and from another base that has a different metaclass.`,
      fix: py`Prefer a \`Protocol\` or composition for one side; or define a combined metaclass that inherits from both metaclasses.`,
    },
  ],
  bestPractices: [
    'Inherit from abc.ABC and mark every required method with @abstractmethod; give each a docstring describing the contract.',
    'Put shared behaviour in concrete methods built on the abstract ones (template method) so implementations stay small.',
    'Stack decorators with @abstractmethod innermost: @property / @classmethod above it.',
    'Check capabilities with collections.abc (Mapping, Sequence, Iterable) instead of concrete types like dict or list.',
    'Subclass collections.abc (Mapping, MutableMapping, Sequence) to build containers: write the core methods, inherit the rest.',
    'Use register() only for classes you cannot edit, and only when they truly implement the whole interface.',
    'Don\'t create an ABC for a single implementation; extract one when a second implementation (or a test fake) appears.',
  ],
  useCases: [
    'Backend/plugin interfaces: storage, payment gateways, notification channels, exporters.',
    'Framework base classes that require subclasses to fill in specific hooks.',
    'Custom containers: read-only configs, validated inventories, sorted leaderboards.',
    'Type checks at boundaries that accept any mapping or sequence, not just dict or list.',
    'Annotating parameters with Iterable / Sequence / Mapping to accept the widest range of inputs.',
  ],
  whenToUse: {
    use: [
      'Several implementations must provide the same methods and you want mistakes caught at object creation.',
      'Implementations should share helper methods built on the required ones.',
      'You are building a container and want the full standard API from a few methods.',
      'You need isinstance checks against a capability ("any mapping"), not a concrete class.',
    ],
    avoid: [
      'There is only one implementation and no test fake — a plain class is simpler.',
      'You only need to describe what a function accepts, including third-party classes — use a Protocol.',
      'The base would clash with another metaclass (some ORMs, Enum) — prefer a Protocol or composition.',
    ],
  },
  comparison: {
    title: 'abc.ABC vs typing.Protocol',
    headers: ['', 'abc.ABC', 'typing.Protocol'],
    rows: [
      ['Typing style', 'nominal: a class qualifies by inheriting (or being registered)', 'structural: a class qualifies by having the right methods'],
      ['Checked by', 'Python, when an object is created', 'a type checker (mypy, pyright) before the program runs'],
      ['isinstance()', 'works (inheritance, register, __subclasshook__)', 'only with @runtime_checkable — and then it only checks that the names exist'],
      ['Shared code', 'yes: concrete and mixin methods are inherited', 'only for classes that explicitly inherit the Protocol'],
      ['Third-party classes', 'need register()', 'fit automatically if the methods match'],
      ['Typical use', 'plugin base classes, frameworks, custom containers', 'describing what a function needs from its arguments'],
    ],
    note: py`They aren't rivals: \`collections.abc\` ABCs double as types in annotations, and a project can type-hint with a [Protocol](lesson:protocols) while offering an ABC as a convenient base class.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'abstract-base-classes-q1',
      type: 'mcq',
      prompt: '`CloudStore` inherits from an ABC but forgets one abstract method. When does Python raise the `TypeError`?',
      options: [
        { text: 'When the class CloudStore(...) statement runs', why: 'Defining an incomplete subclass is allowed — it might be an intermediate abstract class.' },
        'When you try to create an instance: CloudStore()',
        { text: 'When the missing method is called', why: 'That is the behaviour of the old raise NotImplementedError idiom. ABCs fail earlier, at instantiation.' },
        { text: 'When the module is imported', why: 'Importing just runs the class statement, which is allowed.' },
      ],
      answer: 1,
      explanation: py`\`ABCMeta\` records the still-abstract names in \`__abstractmethods__\` when the class is created; creating an **instance** of a class with a non-empty set raises \`TypeError\`.`,
    },
    {
      id: 'abstract-base-classes-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from abc import ABC, abstractmethod

class Plugin(ABC):
    @abstractmethod
    def run(self): ...

    def describe(self):
        return f"{type(self).__name__} ready"

class Hello(Plugin):
    def run(self):
        return "hi"

h = Hello()
print(h.describe(), h.run(), isinstance(h, Plugin))`,
      answer: 'Hello ready hi True',
      accept: ['Hello ready hi True'],
      explanation: py`\`Hello\` implements the only abstract method, so it can be instantiated. It inherits the concrete \`describe()\` from the ABC, where \`type(self).__name__\` is \`"Hello"\`, and it really is an instance of \`Plugin\`.`,
    },
    {
      id: 'abstract-base-classes-q3',
      type: 'output',
      prompt: 'A class is registered as a virtual subclass. Predict the output.',
      code: py`from abc import ABC

class Shape(ABC):
    pass

class Blob:
    pass

Shape.register(Blob)
print(isinstance(Blob(), Shape), Shape in Blob.__mro__)`,
      options: [
        { text: 'True True', why: 'register() does not change the inheritance chain; Shape is not in Blob.__mro__.' },
        'True False',
        { text: 'False False', why: 'Registering makes isinstance and issubclass answer True.' },
        { text: 'TypeError', why: 'Any class can be registered; nothing is checked.' },
      ],
      answer: 1,
      explanation: py`A virtual subclass passes \`isinstance\`/\`issubclass\` checks, but it doesn't actually inherit: the MRO is unchanged and no methods are copied in.`,
    },
    {
      id: 'abstract-base-classes-q4',
      type: 'bug',
      prompt: 'The author expects `Exporter()` to raise `TypeError`, but it creates an object happily. Click the line that causes it.',
      code: py`from abc import ABC, abstractmethod

class Exporter:
    @abstractmethod
    def export(self, rows):
        """Return rows as text."""

class CsvExporter(Exporter):
    def export(self, rows):
        return ",".join(rows)

e = Exporter()
print(e.export(["a"]))`,
      answerLine: 3,
      explanation: py`\`Exporter\` doesn't inherit from \`ABC\`, so its metaclass is plain \`type\` and \`@abstractmethod\` is ignored. Write \`class Exporter(ABC):\`. (Importing \`ABC\` on line 1 isn't enough — you have to use it.)`,
    },
    {
      id: 'abstract-base-classes-q5',
      type: 'fill',
      prompt: 'Declare `unit` as an **abstract property**, in the correct decorator order.',
      code: py`from abc import ABC, abstractmethod

class Sensor(ABC):
    ___
    ___
    def unit(self):
        """e.g. "°C" """`,
      answer: [['@property'], ['@abstractmethod', '@abc.abstractmethod']],
      explanation: py`\`@abstractmethod\` must be applied to the function first (closest to \`def\`), then \`@property\` wraps it and reports itself as abstract. The reverse order raises \`AttributeError\` at class definition.`,
    },
    {
      id: 'abstract-base-classes-q6',
      type: 'mcq',
      prompt: '`class Leaderboard(Sequence)` implements only `__getitem__` and `__len__`. Which of these work on it **for free**? (Select all that apply.)',
      options: [
        '`55 in board`',
        '`board.index(55)`',
        '`reversed(board)`',
        { text: '`board.append(70)`', why: 'append is a MutableSequence mixin, and it needs __setitem__, __delitem__ and insert. Sequence is read-only.' },
        { text: '`board.sort()`', why: 'No collections.abc class provides sort(); that is a list method.' },
        '`board.count(90)`',
      ],
      answer: [0, 1, 2, 5],
      explanation: py`\`Sequence\`'s mixin methods are \`__contains__\`, \`__iter__\`, \`__reversed__\`, \`index\` and \`count\`, all built on your \`__getitem__\` and \`__len__\`. Mutating methods come only with \`MutableSequence\`.`,
    },
    {
      id: 'abstract-base-classes-q7',
      type: 'short',
      prompt: 'Explain the difference between an abstract base class and a `typing.Protocol`, and give one situation where you would choose each.',
      answer: py`An ABC is nominal: a class counts only if it inherits from it (or is registered), Python enforces abstract methods when you create an instance, and the ABC can share concrete methods. A Protocol is structural: any class with matching methods counts, without inheriting, and the check is done by a static type checker rather than at runtime. I'd choose an ABC for a plugin base class I own where I want implementations to inherit helper methods and fail fast if incomplete (e.g. SaveStore). I'd choose a Protocol to type-hint a function parameter that should accept anything with, say, a write() method — including third-party classes I can't modify.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'shape-abc',
      title: 'From NotImplementedError to an ABC',
      difficulty: 'intermediate',
      prompt: py`The starter's \`Shape\` uses the old \`raise NotImplementedError\` idiom, so \`Rectangle\` — which forgot \`area()\` — can still be created. Upgrade it:

- Make \`Shape\` an abstract base class (inherit from \`ABC\`).
- \`name\` must be an **abstract property** and \`area()\` an **abstract method**, so \`Shape.__abstractmethods__ == frozenset({"area", "name"})\`.
- Keep \`describe()\` as a concrete method returning \`f"{self.name} with area {self.area():.2f}"\`.
- Add the missing \`Rectangle.area()\` (width × height).
- \`Shape()\` and any subclass missing \`area\` or \`name\` must raise \`TypeError\` when instantiated.

The program prints \`circle with area 3.14\`.`,
      files: {
        'main.py': py`import math


class Shape:
    """Every shape must provide a name and area()."""

    @property
    def name(self):
        raise NotImplementedError

    def area(self):
        raise NotImplementedError

    def describe(self):
        return f"{self.name} with area {self.area():.2f}"


class Circle(Shape):
    name = "circle"

    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2


class Rectangle(Shape):
    name = "rectangle"

    def __init__(self, width, height):
        self.width = width
        self.height = height
    # area() is missing - but nothing complains until describe() runs!


print(Circle(1).describe())
`,
      },
      hints: [
        'Import ABC and abstractmethod from abc, and write class Shape(ABC):.',
        'Replace each `raise NotImplementedError` body with a docstring, and add @abstractmethod — under @property for name.',
        'Rectangle needs def area(self): return self.width * self.height. describe() stays exactly as it is.',
      ],
      solution: {
        explanation: py`\`Shape(ABC)\` turns on enforcement. Stacking \`@property\` over \`@abstractmethod\` makes \`name\` an abstract property, and \`area\` is a plain abstract method, so \`__abstractmethods__\` is \`{"area", "name"}\`. \`Circle\` and \`Rectangle\` satisfy \`name\` with a simple class attribute — any non-abstract value overriding the name counts. \`describe()\` is the template method: written once, it works for every shape. Now a subclass that forgets \`area\` fails at \`Rectangle(2, 3)\` with a message naming \`area\`, instead of crashing later inside \`describe()\`.`,
        files: {
          'main.py': py`import math
from abc import ABC, abstractmethod


class Shape(ABC):
    """Every shape must provide a name and area()."""

    @property
    @abstractmethod
    def name(self):
        """A short lowercase name, e.g. "circle"."""

    @abstractmethod
    def area(self):
        """Return the area as a number."""

    def describe(self):
        return f"{self.name} with area {self.area():.2f}"


class Circle(Shape):
    name = "circle"

    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2


class Rectangle(Shape):
    name = "rectangle"

    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


print(Circle(1).describe())
`,
        },
      },
      tests: [
        { name: 'Shape is an abstract base class', code: py`from abc import ABCMeta
assert isinstance(Shape, ABCMeta), 'Make Shape inherit from ABC'` },
        { name: 'name and area are the abstract members', code: py`assert Shape.__abstractmethods__ == frozenset({"area", "name"})` },
        { name: 'Shape() cannot be instantiated', code: py`with raises(TypeError):
    Shape()` },
        { name: 'a subclass missing area() cannot be instantiated', code: py`class Blob(Shape):
    name = "blob"
with raises(TypeError, match="area"):
    Blob()` },
        { name: 'describe works for both shapes', code: py`assert Circle(1).describe() == "circle with area 3.14"
assert Rectangle(2, 3).describe() == "rectangle with area 6.00"` },
        { name: 'prints the circle description', code: py`assert output.strip() == "circle with area 3.14"` },
      ],
    },
    {
      id: 'config-mapping',
      title: 'A read-only, case-insensitive config',
      difficulty: 'intermediate',
      prompt: py`Build \`Config\`, a read-only mapping whose keys ignore case, by subclassing \`collections.abc.Mapping\`:

- \`Config(settings)\` takes a dict and stores it with **lower-cased** keys in \`self._data\`.
- Implement only \`__getitem__\` (look up the lower-cased key; a missing key raises \`KeyError\`), \`__iter__\` (iterate over the lower-cased keys) and \`__len__\`.
- Do **not** write \`get\`, \`keys\`, \`items\`, \`values\` or \`__contains__\` — \`Mapping\` provides them.
- \`cfg["x"] = 1\` must fail with \`TypeError\` (it will, as long as you don't add \`__setitem__\`).

The program should print \`localhost 8080 True\`.`,
      files: {
        'main.py': py`from collections.abc import Mapping


class Config(Mapping):
    """Read-only settings with case-insensitive keys."""

    def __init__(self, settings):
        self._data = dict(settings)    # TODO: store the keys in lower case

    def __getitem__(self, key):
        raise KeyError(key)            # TODO

    def __iter__(self):
        return iter([])                # TODO

    def __len__(self):
        return 0                       # TODO


cfg = Config({"Host": "localhost", "PORT": 8080})
print(cfg.get("HOST"), cfg.get("port"), "Port" in cfg)
`,
      },
      hints: [
        'Lower-case once, in __init__: a dict comprehension {key.lower(): value for key, value in settings.items()}.',
        '__getitem__ returns self._data[key.lower()] — a missing key raises KeyError by itself. __iter__ returns iter(self._data); __len__ returns len(self._data).',
        'Leave get, in, items etc. alone: Mapping.get calls your __getitem__ and catches KeyError; Mapping.__contains__ does the same.',
      ],
      solution: {
        explanation: py`Normalising keys once in \`__init__\` keeps every lookup simple: \`__getitem__\` lower-cases the requested key and lets the dict raise \`KeyError\`. Those three methods are all \`Mapping\` needs: its \`get()\` calls \`__getitem__\` and catches \`KeyError\`, \`__contains__\` does the same (which is why \`"Port" in cfg\` is case-insensitive too), and \`keys/items/values/==\` are built on \`__iter__\` and \`__getitem__\`. Because there's no \`__setitem__\`, item assignment raises \`TypeError: 'Config' object does not support item assignment\` — read-only for free.`,
        files: {
          'main.py': py`from collections.abc import Mapping


class Config(Mapping):
    """Read-only settings with case-insensitive keys."""

    def __init__(self, settings):
        self._data = {key.lower(): value for key, value in settings.items()}

    def __getitem__(self, key):
        return self._data[key.lower()]

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)


cfg = Config({"Host": "localhost", "PORT": 8080})
print(cfg.get("HOST"), cfg.get("port"), "Port" in cfg)
`,
        },
      },
      tests: [
        { name: 'lookups ignore case', code: py`cfg = Config({"Host": "localhost", "PORT": 8080})
assert cfg["HOST"] == cfg["host"] == "localhost" and cfg["Port"] == 8080` },
        { name: 'missing keys raise KeyError', code: py`with raises(KeyError):
    Config({"a": 1})["b"]` },
        { name: 'iteration and len use lower-cased keys', code: py`cfg = Config({"Host": "h", "PORT": 1})
assert sorted(cfg) == ["host", "port"] and len(cfg) == 2` },
        { name: 'get, in, items and == come from Mapping', code: py`cfg = Config({"Host": "h", "PORT": 1})
assert cfg.get("missing", 5) == 5 and "PoRt" in cfg
assert dict(cfg.items()) == {"host": "h", "port": 1}
assert cfg == {"host": "h", "port": 1}
assert "get" not in Config.__dict__ and "items" not in Config.__dict__, 'Let Mapping provide get() and items()'` },
        { name: 'Config is read-only', code: py`with raises(TypeError):
    Config({"a": 1})["a"] = 2` },
        { name: 'prints localhost 8080 True', code: py`assert output.strip() == "localhost 8080 True"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'abstract-base-classes-what-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is an abstract base class in Python, and why use one instead of a base class whose methods raise NotImplementedError?',
      answer: 'An ABC (a class inheriting from abc.ABC) declares required methods with @abstractmethod and cannot be instantiated itself; subclasses can only be instantiated once they implement every abstract method. Compared with NotImplementedError, the mistake is caught when the object is created, not when the missing method is eventually called, and the contract is explicit and introspectable (__abstractmethods__).',
      explanation: py`Both approaches document "subclasses must implement this". The difference is *when* you learn about a missing method. \`NotImplementedError\` waits until the call — possibly on a rare path in production. An ABC refuses \`Incomplete()\` immediately, with a message naming the missing methods. ABCs can still provide concrete helper methods, and \`collections.abc\` uses the same machinery for container interfaces.`,
      code: { lang: 'python', code: py`from abc import ABC, abstractmethod


class Notifier(ABC):
    @abstractmethod
    def send(self, to, text): ...


class SmsNotifier(Notifier):
    pass


try:
    SmsNotifier()
except TypeError as error:
    print(error)` },
      whyAsked: 'Checks that you know Python\'s tool for explicit interfaces and the practical benefit (fail-fast) over the older idiom.',
      mistakes: ['Saying Python has no interfaces at all', 'Thinking @abstractmethod works without inheriting from ABC', 'Claiming the error happens at class definition'],
      followUps: ['Can an abstract method have an implementation?', 'How do you declare an abstract property?', 'How does this compare to typing.Protocol?'],
      modelAnswer: 'An abstract base class is a class that defines an interface: I inherit from abc.ABC and mark the required methods with @abstractmethod. Python then refuses to instantiate the ABC itself, and refuses to instantiate any subclass until every abstract method is overridden, raising a TypeError that names what is missing. The older idiom of raising NotImplementedError in the base only fails when the missing method is actually called, which might be in production on a rare code path. With an ABC the mistake surfaces as soon as someone creates the object. ABCs can also carry concrete helper methods that all implementations share.',
    },
    {
      id: 'abstract-base-classes-partial-subclass',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What happens when this code runs?',
      code: { lang: 'python', code: py`from abc import ABC, abstractmethod

class Repository(ABC):
    @abstractmethod
    def get(self, key): ...
    @abstractmethod
    def add(self, key, value): ...

class ReadOnlyRepo(Repository):
    def get(self, key):
        return None

print("class defined")
repo = ReadOnlyRepo()
print("instance created")` },
      options: [
        'Prints "class defined", then raises TypeError naming add',
        'Raises TypeError before printing anything',
        'Prints "class defined" and "instance created"',
        'Prints both lines, then fails later when add() is called',
      ],
      correctOption: 0,
      answer: 'It prints "class defined", then ReadOnlyRepo() raises TypeError: Can\'t instantiate abstract class ReadOnlyRepo without an implementation for abstract method \'add\'.',
      explanation: py`Defining a partially implemented subclass is legal (it's simply still abstract). Instantiation checks \`__abstractmethods__\`, which here is \`{'add'}\`. A deliberately read-only repository is a sign the interface is too big: split it into a read interface and a write interface rather than implementing \`add\` to raise.`,
      whyAsked: 'Tests precise knowledge of when the abstract check runs, and invites a design discussion about interface size.',
      mistakes: ['Saying the class statement fails', 'Thinking a subclass only needs to implement the methods it uses', 'Fixing it by implementing add() to raise NotImplementedError without questioning the design'],
      followUps: ['How would you design read-only and read-write repositories?', 'How can you list the missing methods programmatically?', 'Does the check also apply to abstract properties?'],
      modelAnswer: 'It prints "class defined" and then raises a TypeError on ReadOnlyRepo(): Can\'t instantiate abstract class ReadOnlyRepo without an implementation for abstract method add. Defining a subclass that only implements part of the interface is allowed — it is just still abstract — and the check happens when an instance is created, using the class\'s __abstractmethods__ set. If a read-only repository is a real requirement, I would not implement add to raise; that breaks substitutability. I would split the ABC into a Reader with get and a Writer that extends it with add.',
    },
    {
      id: 'abstract-base-classes-vs-protocol',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'abc.ABC or typing.Protocol — how do you decide?',
      answer: 'ABCs are nominal and enforced at runtime: classes must inherit (or be registered), incomplete subclasses can\'t be instantiated, and the ABC can share concrete code. Protocols are structural and checked statically: any class with matching methods fits, including third-party classes, without inheritance. Choose an ABC for a hierarchy you own that benefits from shared code and fail-fast instantiation; choose a Protocol to describe what a function needs from its arguments.',
      explanation: py`A Protocol never changes runtime behaviour (unless you add \`@runtime_checkable\`, which only checks that the names exist). An ABC changes instantiation and \`isinstance\`. They combine: functions annotated with a Protocol, plus an ABC offered as a convenient base with helpers. \`collections.abc\` classes also work as annotation types.`,
      whyAsked: 'Modern typed Python uses both; interviewers check that you understand nominal vs structural typing and runtime vs static checking.',
      mistakes: ['Saying Protocol enforces methods at runtime', 'Saying ABCs are obsolete since Protocol exists', 'Not mentioning third-party classes'],
      followUps: ['What does @runtime_checkable do, and what does it not check?', 'Can a class explicitly inherit from a Protocol?', 'Why is isinstance(x, Iterable) structural even though Iterable is an ABC?'],
      modelAnswer: 'The core difference is nominal versus structural. An ABC is nominal: a class qualifies by inheriting from it or being registered, Python refuses to instantiate subclasses that miss abstract methods, and the ABC can provide shared concrete methods. A Protocol is structural: any class whose methods match qualifies, even one from a library I cannot modify, and the check is done by mypy or pyright before the code runs. So for a plugin hierarchy I own, where I want helper methods and fail-fast errors, I use an ABC. To describe what a function needs from its argument — say, anything with a read method — I use a Protocol. They work together well.',
    },
    {
      id: 'abstract-base-classes-subclasshook',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Why is `isinstance(obj, collections.abc.Iterable)` True for a class that never inherits from Iterable, while `isinstance(obj, Sequence)` is False for a class with `__getitem__` and `__len__`? How does `list` count as a Sequence?',
      answer: 'ABCMeta answers isinstance/issubclass by checking real inheritance, then the registry of virtual subclasses, then the ABC\'s __subclasshook__. One-method ABCs like Iterable define a __subclasshook__ that looks for the method (__iter__), so they are structural. Sequence has no such hook — __getitem__ plus __len__ could equally be a Mapping — so you must inherit or register. list, tuple, str and range are registered with the sequence ABCs by the standard library.',
      explanation: py`\`issubclass(C, ABC)\` → \`ABCMeta.__subclasscheck__\`: cached result? → \`ABC.__subclasshook__(C)\` (True/False/NotImplemented) → is \`ABC\` in \`C.__mro__\`? → is \`C\` a subclass of any registered class? → recursively check subclasses of the ABC. Registration is how built-in types written in C join the hierarchy without inheriting from Python ABCs. Results are cached (and the cache is invalidated when new classes are registered).`,
      code: { lang: 'python', code: py`from collections.abc import Iterable, Sequence


class Countdown:
    def __iter__(self):
        return iter([3, 2, 1])


class Pair:
    def __getitem__(self, i):
        return (10, 20)[i]

    def __len__(self):
        return 2


print(isinstance(Countdown(), Iterable))   # True  (hook finds __iter__)
print(isinstance(Pair(), Sequence))        # False (no structural hook)
print(isinstance([], Sequence), Sequence in list.__mro__)   # True False (registered)` },
      whyAsked: 'Distinguishes candidates who have used collections.abc from those who understand how ABCMeta actually decides membership.',
      mistakes: ['Assuming list inherits from collections.abc.Sequence', 'Thinking all ABCs check methods structurally', 'Believing register() verifies the interface'],
      followUps: ['How would you write a __subclasshook__ for your own one-method ABC?', 'Why must __subclasshook__ return NotImplemented rather than False in the fallback case?', 'What are the risks of structural hooks?'],
      modelAnswer: 'ABCMeta overrides isinstance and issubclass. To decide, it checks real inheritance, then a registry of virtual subclasses, and before both it asks the ABC\'s __subclasshook__. The one-method ABCs like Iterable, Sized and Hashable implement that hook to check whether the class has the relevant method, so any class with __iter__ counts as Iterable without inheriting. Sequence deliberately has no hook, because __getitem__ plus __len__ is ambiguous — a Mapping has those too — so you have to inherit or register explicitly. Built-in types like list, tuple and str are registered with the right ABCs by the standard library, which is why isinstance([], Sequence) is True even though Sequence is not in list\'s MRO.',
    },
    {
      id: 'abstract-base-classes-validated-inventory',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'The starter\'s `Inventory` subclasses `dict` and validates in `__setitem__`, but `update()` sneaks negative quantities past the check. Rewrite it with `collections.abc.MutableMapping` (storing data in a dict attribute) so that **every** way of setting a value — `inv[k] = v`, `update()`, `setdefault()` — rejects negatives with `ValueError`.',
      answer: 'Subclass MutableMapping, keep a private dict, implement __getitem__, __setitem__ (with the check), __delitem__, __iter__ and __len__. MutableMapping\'s update/setdefault are written in Python on top of __setitem__, so they go through the validation.',
      explanation: py`\`dict\`'s C methods don't call an overridden \`__setitem__\`, so validation in a \`dict\` subclass is bypassable. \`MutableMapping\` builds \`update\`, \`setdefault\`, \`pop\` and friends from your five core methods, so there's one choke point for validation. It's composition (a wrapped dict) plus an ABC that supplies the API.`,
      starter: { files: { 'main.py': py`class Inventory(dict):
    """Item -> quantity. Quantities must never be negative."""

    def __setitem__(self, item, quantity):
        if quantity < 0:
            raise ValueError(f"negative quantity for {item}: {quantity}")
        super().__setitem__(item, quantity)


stock = Inventory()
stock["apple"] = 3
stock.update(pear=-2)      # sneaks past the check!
print(dict(stock))
` } },
      tests: [
        { name: 'is a MutableMapping but not a dict subclass', code: py`from collections.abc import MutableMapping
assert issubclass(Inventory, MutableMapping) and not issubclass(Inventory, dict)` },
        { name: 'item assignment validates', code: py`inv = Inventory()
inv["apple"] = 3
assert inv["apple"] == 3
with raises(ValueError):
    inv["fig"] = -1` },
        { name: 'update() goes through the validation', code: py`inv = Inventory()
with raises(ValueError):
    inv.update(pear=-2)
inv.update(pear=2)
assert dict(inv) == {"pear": 2}` },
        { name: 'setdefault, pop, del and len work', code: py`inv = Inventory()
assert inv.setdefault("kiwi", 4) == 4
inv["lime"] = 1
assert inv.pop("lime") == 1
del inv["kiwi"]
assert len(inv) == 0
with raises(ValueError):
    inv.setdefault("plum", -5)` },
      ],
      solution: { files: { 'main.py': py`from collections.abc import MutableMapping


class Inventory(MutableMapping):
    """Item -> quantity. Quantities must never be negative."""

    def __init__(self):
        self._stock = {}

    def __getitem__(self, item):
        return self._stock[item]

    def __setitem__(self, item, quantity):
        if quantity < 0:
            raise ValueError(f"negative quantity for {item}: {quantity}")
        self._stock[item] = quantity

    def __delitem__(self, item):
        del self._stock[item]

    def __iter__(self):
        return iter(self._stock)

    def __len__(self):
        return len(self._stock)


stock = Inventory()
stock["apple"] = 3
try:
    stock.update(pear=-2)
except ValueError as error:
    print("rejected:", error)
print(dict(stock))
` } },
      hints: ['MutableMapping needs five methods: __getitem__, __setitem__, __delitem__, __iter__, __len__.', 'Store the data in self._stock = {} and forward each method to it; keep the negative check in __setitem__ only.'],
      whyAsked: 'A practical test of collections.abc plus awareness of the dict-subclassing pitfall — a real source of validation bugs.',
      mistakes: ['Overriding update() and setdefault() by hand in a dict subclass (and missing others, like the constructor)', 'Forgetting __delitem__ or __iter__, so the class stays abstract', 'Using collections.UserDict without explaining why it also works'],
      followUps: ['Would collections.UserDict work here? Why?', 'How would you make quantities integer-only?', 'What does __repr__ look like, and should you add one?'],
      modelAnswer: 'The dict subclass fails because dict\'s built-in update is implemented in C and stores items directly, never calling my __setitem__. Instead I subclass collections.abc.MutableMapping and keep the real data in a private dict. I implement the five core methods — getitem, setitem with the negative check, delitem, iter and len — and MutableMapping supplies update, setdefault, pop, popitem and clear in Python on top of them, so every write passes through my single validation point. UserDict would also work for the same reason. I would probably add a __repr__ too, because the default one is not informative.',
    },
    {
      id: 'abstract-base-classes-plugin-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design the extension point for third-party "exporters" in a reporting app. Plugins must provide a file extension and an export method; the app wants shared behaviour (writing files, naming) and to discover plugins by name. What do you build?',
      answer: 'An Exporter ABC with an abstract extension property and an abstract export(rows) method, plus concrete template methods such as write(rows, folder) that build the filename and call export. Discovery via a registry, e.g. populated in __init_subclass__ (or via packaging entry points for installed plugins). Type-hint consumers with the ABC or a matching Protocol; keep the interface small and versioned.',
      explanation: py`The ABC gives fail-fast checks for plugin authors and shared helpers; \`__init_subclass__\` runs whenever a subclass is defined, so registration is automatic (see [metaclasses](lesson:metaclasses)). For plugins in separate installed packages, entry points in \`pyproject.toml\` are the standard discovery mechanism (see [packaging](lesson:packaging)). Keep plugin-facing methods minimal: every abstract method you add later breaks all existing plugins.`,
      code: { lang: 'python', code: py`import inspect
from abc import ABC, abstractmethod
from pathlib import Path


class Exporter(ABC):
    registry = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        # __abstractmethods__ isn't computed yet at this point;
        # inspect.isabstract() handles that case by scanning the class itself
        if not inspect.isabstract(cls):
            Exporter.registry[cls.extension] = cls

    @property
    @abstractmethod
    def extension(self): ...

    @abstractmethod
    def export(self, rows): ...

    def write(self, rows, folder):                       # template method
        path = Path(folder) / f"report.{self.extension}"
        path.write_text(self.export(rows))
        return path


class CsvExporter(Exporter):
    extension = "csv"

    def export(self, rows):
        return "\n".join(",".join(map(str, row)) for row in rows)


print(Exporter.registry)    # {'csv': <class '__main__.CsvExporter'>}` },
      whyAsked: 'Plugin systems are a classic place for ABCs; the question probes interface design, discovery and evolution, not just syntax.',
      mistakes: ['Making every helper abstract, so plugins re-implement shared logic', 'Adding abstract methods in a minor release (breaks every plugin)', 'No plan for discovery or for validating plugin metadata'],
      followUps: ['How would you evolve the interface without breaking existing plugins?', 'Why use inspect.isabstract() inside __init_subclass__ instead of reading cls.__abstractmethods__?', 'When would a Protocol be better here?'],
      modelAnswer: 'I would define an Exporter abstract base class with a small required surface: an abstract extension property and an abstract export method that turns rows into text. Shared behaviour like building the filename and writing the file lives in concrete template methods on the ABC, so plugin authors only implement the format-specific part, and an incomplete plugin fails as soon as it is instantiated. For discovery inside the app I would register concrete subclasses automatically in __init_subclass__; for plugins shipped as separate packages I would use packaging entry points. Because every new abstract method breaks existing plugins, I keep the interface minimal and add new capabilities as optional concrete methods with defaults.',
    },
  ],

  takeaways: [
    'An ABC (class X(ABC)) declares required methods with @abstractmethod; neither it nor an incomplete subclass can be instantiated.',
    'The TypeError appears at instantiation and names the missing methods — earlier and clearer than raise NotImplementedError.',
    'ABCs can mix abstract and concrete methods: shared "template" methods built on the abstract ones are inherited by every implementation.',
    'Abstract properties stack @property above @abstractmethod; a plain class attribute in the subclass satisfies them.',
    'collections.abc gives ready-made interfaces: isinstance(x, Mapping) checks capabilities, and subclassing Sequence/Mapping/MutableMapping provides mixin methods for free.',
    'register() creates a virtual subclass: isinstance says True, but nothing is checked or inherited.',
    'ABCs are nominal and runtime-enforced; Protocols are structural and checked by type checkers — pick per situation, or use both.',
  ],
}
