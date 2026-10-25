// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const REPORT = py`"""A sales report built with SOLID ideas -- the Pythonic way."""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Sale:
    region: str
    amount: float


# S: the accounting rule lives here and only here.
def summarize(sales):
    """Return the total amount per region."""
    totals = {}
    for sale in sales:
        totals[sale.region] = totals.get(sale.region, 0) + sale.amount
    return totals


# O: new formats register themselves; nothing else is edited.
FORMATTERS = {}


def formatter(name):
    """Register the decorated function as the formatter called name."""
    def register(func):
        FORMATTERS[name] = func
        return func
    return register


@formatter("text")
def as_text(totals):
    return "\n".join(f"{region:<6}{amount:>8.2f}" for region, amount in sorted(totals.items()))


@formatter("csv")
def as_csv(totals):
    rows = [f"{region},{amount:.2f}" for region, amount in sorted(totals.items())]
    return "\n".join(["region,total", *rows])


# I: the smallest interface the service needs -- one method.
class Output(Protocol):
    def write(self, text: str) -> None: ...


# L: both outputs honour the same contract, so either can stand in.
class ConsoleOutput:
    def write(self, text):
        print(text)


class MemoryOutput:
    """Keep written text in a list -- handy in tests."""

    def __init__(self):
        self.written = []

    def write(self, text):
        self.written.append(text)


# D: the service is given an Output; it never creates one itself.
class ReportService:
    def __init__(self, output: Output, fmt: str = "text"):
        self.output = output
        self.render = FORMATTERS[fmt]

    def publish(self, sales):
        self.output.write(self.render(summarize(sales)))


SALES = [Sale("north", 120.0), Sale("south", 80.5), Sale("north", 30.25)]

ReportService(ConsoleOutput()).publish(SALES)
ReportService(ConsoleOutput(), fmt="csv").publish(SALES)

memory = MemoryOutput()
ReportService(memory).publish(SALES)
print("captured for a test:", memory.written[0].splitlines()[0])
`

const LSP_TRACE = py`class Rectangle:
    def __init__(self, width, height):
        self.width, self.height = width, height

    def set_width(self, width):
        self.width = width

    def area(self):
        return self.width * self.height


class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)

    def set_width(self, width):
        self.width = self.height = width


def stretch(shape):
    shape.set_width(10)
    return shape.area()


print(stretch(Rectangle(2, 5)), stretch(Square(5)))
`

export default {
  id: 'solid',
  title: 'SOLID principles in Python',
  summary: 'Five design principles — single responsibility, open/closed, Liskov substitution, interface segregation and dependency inversion — and the lightweight, Pythonic way to apply each one (and when not to).',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['inheritance', 'composition', 'polymorphism-and-duck-typing'],
  related: ['clean-code', 'design-patterns', 'clean-architecture', 'protocols', 'abstract-base-classes', 'composition', 'decorators', 'functools', 'mocking', 'dataclasses'],
  tags: ['SOLID', 'single responsibility', 'SRP', 'open/closed', 'OCP', 'Liskov substitution', 'LSP', 'interface segregation', 'ISP', 'dependency inversion', 'DIP', 'dependency injection', 'Protocol', 'registry', 'strategy', 'object-oriented design'],
  apis: [
    { name: 'typing.Protocol', summary: 'Defines a structural interface: any class with matching methods satisfies it, no inheritance needed.' },
    { name: 'abc.ABC / @abstractmethod', summary: 'Nominal interfaces: subclasses must implement the abstract methods before they can be instantiated.' },
    { name: '@typing.runtime_checkable', summary: 'Lets isinstance() check a Protocol — but only that the methods exist, not their signatures.' },
    { name: 'functools.singledispatch', summary: 'Adds type-specific implementations to a function from outside, without editing it.' },
  ],
  docs: [
    { label: 'typing — Protocols', url: 'https://docs.python.org/3/library/typing.html#typing.Protocol' },
    { label: 'PEP 544 — Protocols: structural subtyping', url: 'https://peps.python.org/pep-0544/' },
    { label: 'abc — Abstract Base Classes', url: 'https://docs.python.org/3/library/abc.html' },
    { label: 'functools.singledispatch', url: 'https://docs.python.org/3/library/functools.html#functools.singledispatch' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**SOLID** is an acronym for five object-oriented design principles that help code stay easy to change as it grows. They were popularised by Robert C. Martin; the acronym itself was coined later by Michael Feathers.`,
    py`| letter | principle | in one sentence |
|---|---|---|
| **S** | Single Responsibility | a module or class should have **one reason to change** |
| **O** | Open/Closed | add new behaviour by **adding code**, not by editing working code |
| **L** | Liskov Substitution | a subtype must be usable **anywhere** its base type is expected |
| **I** | Interface Segregation | depend on **small interfaces** that contain only what you use |
| **D** | Dependency Inversion | high-level code depends on **abstractions**, and is *given* the concrete parts |`,
    py`The principles were written with Java-style languages in mind. Python gets many of them almost for free — functions are objects, duck typing replaces most interface declarations, and \`typing.Protocol\` describes "anything with a \`write()\` method" without inheritance. This lesson shows each principle in its Pythonic form, and is honest about when it's overkill.`,
  ],
  why: [
    py`Software that works is constantly asked to change: a new export format, a new payment provider, a new rule from accounting. Code designed without these principles tends to change in *many* places for each request — and each edit risks breaking something unrelated.`,
    py`SOLID also makes code **testable**. A class that is *given* its database or its clock can be tested with a fake; a class that builds them itself can't be tested without the real thing.`,
    py`Finally, SOLID gives teams a shared vocabulary for design reviews: "this class has two reasons to change" is a quicker, kinder comment than "this feels messy".`,
  ],
  eli15: [
    py`Think of a games console. The console doesn't care *which* controller you plug in, as long as it fits the port (**D**: depend on the port, not a specific controller). Any controller that fits must actually work like a controller — one that fits but explodes when you press A breaks the deal (**L**).`,
    py`The port is small — power and buttons — not "power, buttons, printer and toaster" (**I**). New games arrive on new cartridges; nobody opens up the console to add them (**O**). And the console's job is running games, not also being a fridge (**S**).`,
    py`That's SOLID: small, clear jobs, connected through simple sockets, so you can swap and add parts without opening everything up.`,
  ],
  analogy: {
    title: 'Plugs, sockets and adapters',
    body: [
      py`Your house's wiring doesn't know about your phone charger, your lamp or your laptop. It offers a standard **socket**. Anything with the right plug works, and you add new devices by plugging them in — never by rewiring the walls.`,
      py`The socket is deliberately small (live, neutral, earth). And if a device has the right plug but catches fire when switched on, the socket's promise is broken — "fits the plug" must also mean "behaves like a device".`,
    ],
    mapping: [
      ['each appliance does one job', 'S: a class or module with one reason to change'],
      ['adding a device without rewiring', 'O: register a new formatter instead of editing old code'],
      ['every plugged-in device behaves safely', 'L: subclasses keep the base class\'s promises'],
      ['a small, standard socket', 'I: a tiny Protocol with only the methods callers use'],
      ['the wall offers a socket, not a specific lamp', 'D: depend on an abstraction; the concrete thing is passed in'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'SOLID in the report service',
    props: {
      width: 820,
      height: 320,
      nodes: [
        { id: 'service', label: 'ReportService', note: 'coordinates, owns no details', x: 380, y: 160, tone: 'ink' },
        { id: 'summarize', label: 'summarize()', note: 'S: the accounting rule', x: 140, y: 70, tone: 'yellow' },
        { id: 'registry', label: 'FORMATTERS', note: 'O: text, csv, … add more', x: 140, y: 250, tone: 'blue' },
        { id: 'port', label: 'Output (Protocol)', note: 'I: just write(text)', x: 590, y: 160, tone: 'kraft' },
        { id: 'console', label: 'ConsoleOutput', note: 'prints', x: 720, y: 60 },
        { id: 'memory', label: 'MemoryOutput', note: 'records, for tests', x: 720, y: 260 },
      ],
      edges: [
        { from: 'service', to: 'summarize', label: 'calls' },
        { from: 'service', to: 'registry', label: 'looks up a format' },
        { from: 'service', to: 'port', label: 'depends on' },
        { from: 'console', to: 'port', label: 'satisfies', dashed: true },
        { from: 'memory', to: 'port', label: 'satisfies', dashed: true },
      ],
      steps: [
        { focus: ['summarize'], edges: ['service->summarize'], text: py`**S** — the rule "total per region" lives in one function. When accounting changes the rule, *only* \`summarize()\` changes; formatting and output are untouched.` },
        { focus: ['registry'], edges: ['service->registry'], text: py`**O** — formats live in a registry. A new JSON format is a new decorated function; \`ReportService\` is never edited.` },
        { focus: ['port'], edges: ['service->port'], text: py`**I** — the service needs exactly one capability, \`write(text)\`, so the interface (a \`Protocol\`) has exactly one method.` },
        { focus: ['console', 'memory', 'port'], edges: ['console->port', 'memory->port'], text: py`**L** — both outputs honour the same contract, so either can be substituted without the service noticing.` },
        { focus: ['service', 'port', 'console', 'memory'], edges: ['service->port', 'console->port', 'memory->port'], text: py`**D** — the arrows point *at the abstraction*. The service depends on \`Output\`; the concrete classes depend on it too. Which one is used is decided outside, when the service is created.` },
      ],
    },
    alt: 'Diagram: ReportService in the centre has arrows to summarize() (labelled S, the accounting rule), to a FORMATTERS registry (labelled O) and to an Output protocol (labelled I). ConsoleOutput and MemoryOutput both have dashed arrows pointing to the Output protocol, showing that both satisfy it and that dependencies point at the abstraction.',
    caption: py`This is the playground program. Step through to see where each letter shows up.`,
  },
  syntax: [
    py`#### S — Single Responsibility: one reason to change`,
    py`"Responsibility" means a **reason to change** — usually one group of people who will ask for changes. A report class that computes totals (accounting's rules), renders HTML (designers' taste) and emails PDFs (IT's mail setup) will be edited for three unrelated reasons.`,
    { code: py`# Before: one class, three reasons to change
class SalesReport:
    def __init__(self, sales): ...
    def totals(self): ...                 # accounting rules
    def to_html(self): ...                # presentation
    def email_to(self, address): ...      # delivery`, lang: 'python', title: 'a class with three jobs' },
    { code: py`# After: each job in its own small piece -- functions are fine!
def summarize(sales): ...                 # accounting rules
def as_html(totals): ...                  # presentation
class EmailOutput:                        # delivery
    def write(self, text): ...`, lang: 'python', title: 'one reason to change each' },
    py`In Python the unit of responsibility is often a **function** or a **module**, not a class. Don't create a class just to hold one method.`,
    py`#### O — Open/Closed: extend without editing`,
    py`A module is *open* for extension and *closed* for modification when new cases can be added **beside** the existing code. Python's tools: pass a function (strategy), a **registry** dict filled by a decorator, polymorphism ("every shape has \`area()\`"), or \`functools.singledispatch\`.`,
    { code: py`FORMATTERS = {}

def formatter(name):
    def register(func):
        FORMATTERS[name] = func
        return func
    return register

@formatter("json")              # a new format: added, nothing edited
def as_json(totals):
    import json
    return json.dumps(totals, sort_keys=True)`, lang: 'python', title: 'a registry' },
    py`Compare with an \`if fmt == "text": … elif fmt == "csv": …\` chain that must be edited (and re-tested) for every format. A three-branch \`if\` that never grows is fine, though — reach for a registry when the list of cases keeps growing or comes from plug-ins.`,
    py`#### L — Liskov Substitution: subtypes keep the promises`,
    py`Named after Barbara Liskov. If code works with a \`Base\`, it must keep working when handed any subclass. Concretely, a subclass must not:`,
    py`- demand **more** from callers (stricter arguments, extra required calls),
- promise **less** (return a different kind of thing, skip a side effect),
- raise **new kinds of errors** callers can't expect (\`NotImplementedError\` for an inherited method is the classic smell),
- break the base's **invariants** — the facts that are always true about it.`,
    py`The famous violation is a \`Square\` subclass of \`Rectangle\`: to stay square, \`set_width\` must also change the height, which breaks the promise "changing the width leaves the height alone". Watch it in the animation below. The fix is usually *not* to inherit: make \`Square\` and \`Rectangle\` separate classes that share a small \`Shape\` protocol with \`area()\`.`,
    py`#### I — Interface Segregation: small interfaces`,
    py`Clients shouldn't be forced to depend on methods they don't use. In Python, describe exactly what a function needs with a small \`Protocol\` (PEP 544, Python 3.8+) — a class satisfies it just by having the methods, no inheritance required. See [protocols](lesson:protocols).`,
    { code: py`from typing import Protocol


class Reader(Protocol):
    def get(self, key: str) -> bytes | None: ...


class Writer(Protocol):
    def put(self, key: str, data: bytes) -> None: ...


def build_report(store: Reader) -> str:         # only needs to read
    data = store.get("sales.csv")
    return "no data" if data is None else data.decode()


def import_files(store: Writer, files: dict[str, bytes]) -> None:   # only writes
    for name, data in files.items():
        store.put(name, data)`, lang: 'python', title: 'two small Protocols instead of one fat interface' },
    py`One storage class can satisfy both protocols; but a read-only cache, or a fake in a test, only needs \`get()\`.`,
    py`#### D — Dependency Inversion: depend on abstractions, receive the details`,
    py`High-level policy ("publish the report") shouldn't depend on low-level details ("print to the terminal", "talk to SMTP"). Both should depend on an abstraction. In practice you **inject** the detail: pass it in through the constructor or as an argument, instead of creating it inside.`,
    { code: py`class ReportService:
    def __init__(self, output):          # given an Output -- any Output
        self.output = output


# A plain function can take a dependency too -- often all you need:
def publish(totals, write=print):
    write(f"{len(totals)} regions")


publish({"north": 150.25})                     # prints
lines = []
publish({"north": 150.25}, write=lines.append) # captured, e.g. in a test
print(lines)`, lang: 'python', title: 'injection by constructor or by argument' },
    { callout: 'tip', title: 'Dependency inversion vs dependency injection', text: py`*Inversion* is the design principle (point dependencies at abstractions). *Injection* is the technique (pass the dependency in). You rarely need a DI framework in Python — constructor parameters and default arguments go a long way. The [clean architecture](lesson:clean-architecture) lesson builds a whole app this way.` },
  ],
  walkthrough: {
    title: 'Finding the five letters in the report service',
    lang: 'python',
    code: REPORT,
    intro: py`This is the playground program. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [6, 9], text: py`A frozen [dataclass](lesson:dataclasses) holds one sale. Plain data, no behaviour — nothing here will change when formats or outputs change.` },
      { lines: [12, 18], text: py`**S**: the only place that knows *how totals are computed*. A new accounting rule (say, ignore refunds) touches these lines and nothing else.` },
      { lines: [21, 30], text: py`**O**: a registry plus a [decorator](lesson:decorators) that fills it. \`formatter("text")\` returns \`register\`, which stores the function under its name and returns it unchanged.` },
      { lines: [33, 41], text: py`Two formats are registered. Adding a third means writing another decorated function — \`ReportService\` is never opened.` },
      { lines: [44, 46], text: py`**I**: the service needs one capability, so the \`Protocol\` declares one method. The \`...\` body is normal for protocols: it only describes the shape.` },
      { lines: [49, 62], text: py`**L**: neither class inherits from \`Output\`; they *structurally* match it. Each honours the same contract — accept a string, return nothing — so they're interchangeable.` },
      { lines: [65, 72], text: py`**D**: the service receives its \`output\` and looks up its renderer. It never names \`ConsoleOutput\`, so it can't be tied to the terminal.` },
      { lines: [77, 82], text: py`The *caller* decides the concrete pieces. Swapping in \`MemoryOutput\` captures the report instead of printing it — exactly what a test needs.` },
    ],
  },
  playground: {
    title: 'A SOLID report service',
    objective: 'Extend the service in four ways — and notice how few existing lines each change touches.',
    files: { 'main.py': REPORT },
    expected: py`\`\`\`text
north   150.25
south    80.50
region,total
north,150.25
south,80.50
captured for a test: north   150.25
\`\`\`

The third report went into \`MemoryOutput\` instead of the screen; only its first line is printed.`,
    experiments: [
      {
        id: 'json-format',
        task: py`**O**: add a \`"json"\` format that returns \`json.dumps(totals, sort_keys=True)\` — by registering a new function, without editing \`ReportService\` or the other formatters. Use it with \`ReportService(ConsoleOutput(), fmt="json")\`.`,
        hint: py`Add \`import json\` at the top, then a function decorated with \`@formatter("json")\` next to \`as_csv\`.`,
        tests: [
          { name: 'a json formatter is registered', code: py`assert 'json' in FORMATTERS, 'Register a formatter called "json"'` },
          { name: 'it produces valid JSON totals', code: py`import json
assert json.loads(FORMATTERS['json']({'north': 10.0})) == {'north': 10.0}` },
        ],
        explain: py`The new behaviour was *added*: one decorated function. Nothing that already worked was edited, so nothing that already worked needs re-testing. That's open/closed in its most Pythonic form.`,
      },
      {
        id: 'ignore-refunds',
        task: py`**S**: accounting says refunds (negative amounts) must be **ignored** in the totals. Make the change in the one place responsible for it.`,
        hint: py`Only \`summarize()\` should change: skip a sale when \`sale.amount < 0\`.`,
        tests: [
          { name: 'refunds are ignored', code: py`assert summarize([Sale("north", 10.0), Sale("north", -4.0)]) == {"north": 10.0}` },
          { name: 'normal sales still add up', code: py`assert summarize(SALES) == {"north": 150.25, "south": 80.5}` },
        ],
        explain: py`One rule changed, one function changed. The formatters and outputs didn't move — they have different reasons to change. When a single business request forces edits across many classes, that's an SRP smell.`,
      },
      {
        id: 'file-output',
        task: py`**D**: write a \`FileOutput\` class whose \`__init__(self, path)\` stores a path and whose \`write(text)\` **appends** the text plus a newline to that file. Then publish a report with it.`,
        hint: py`\`with open(self.path, "a", encoding="utf-8") as file: file.write(text + "\\n")\` inside \`write\`.`,
        tests: [
          { name: 'FileOutput writes the report to a file', code: py`from pathlib import Path
assert ns.get('FileOutput'), 'Define a class named FileOutput'
target = Path('test_report.txt')
target.unlink(missing_ok=True)
ReportService(FileOutput('test_report.txt'), fmt='csv').publish([Sale('east', 5.0)])
assert 'east,5.00' in target.read_text()` },
        ],
        explain: py`\`ReportService\` didn't change at all, yet it now writes files. It only ever depended on "something with \`write()\`", so any new output — a file, a Slack message, an S3 upload — plugs in the same way.`,
      },
      {
        id: 'memory-test',
        task: py`**D pays off in testing**: write a function \`test_csv_report()\` that publishes \`[Sale("east", 5.0)]\` in CSV format into a \`MemoryOutput\` and asserts that \`written\` equals \`["region,total\\neast,5.00"]\`.`,
        hint: py`Create \`memory = MemoryOutput()\`, pass it to \`ReportService(memory, fmt="csv")\`, call \`publish(...)\`, then \`assert memory.written == [...]\`.`,
        tests: [
          { name: 'test_csv_report exists and uses MemoryOutput', code: py`assert callable(ns.get('test_csv_report')), 'Define a function named test_csv_report()'
assert 'MemoryOutput' in test_csv_report.__code__.co_names, 'Use MemoryOutput inside the test'` },
          { name: 'test_csv_report passes', code: py`test_csv_report()` },
        ],
        explain: py`No printing to capture, no files to clean up, no mocks: the test hands the service a fake that records what it was given. Being able to write this test in four lines is the practical payoff of dependency inversion.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch a Square break the Rectangle\'s promise (LSP)',
    props: {
      code: LSP_TRACE,
      notes: {
        3: 'A rectangle stores two independent sides.',
        6: 'The promise callers rely on: `set_width` changes the width **only**.',
        14: 'A square is built as a rectangle with equal sides…',
        17: '…but to stay square it must change **both** sides. The subclass quietly breaks the base class\'s promise.',
        21: '`stretch` was written against `Rectangle`: "set the width to 10, keep the height".',
        25: 'Rectangle(2, 5) → 10 × 5 = 50, as expected. Square(5) → 10 × 10 = 100: the same code gives a surprising answer for a subtype.',
      },
    },
    alt: 'A step-by-step trace. stretch(Rectangle(2, 5)) sets the width to 10 while the height stays 5 and returns 50. stretch(Square(5)) calls the overridden set_width, which sets both width and height to 10, so it returns 100 — showing that Square is not substitutable for Rectangle.',
    caption: py`The program doesn't crash — that's what makes LSP violations nasty. The fix is not a cleverer \`Square\`; it's to stop claiming a square *is a* mutable rectangle.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`SOLID is a set of **guidelines**, not rules the computer checks. Breaking them doesn't cause errors; it causes code that is painful to change later. That's why they matter more as a program and its team grow.`,
      py`The ideas are older than the acronym. Open/closed comes from Bertrand Meyer's 1988 book *Object-Oriented Software Construction*; the substitution principle from a 1987 talk by Barbara Liskov; Robert C. Martin collected and refined the five in the early 2000s.`,
      py`Python changes *how* you apply them. Java needs an \`interface\` keyword and a class per strategy; Python has duck typing, first-class functions, decorators and modules, so the same ideas often take a few lines.`,
    ],
    technical: [
      py`**Two kinds of interface.** An ABC (\`abc.ABC\` + \`@abstractmethod\`) is *nominal*: a class must inherit from it, and instantiating a subclass that misses an abstract method raises \`TypeError\`. A \`Protocol\` is *structural*: any class with matching methods satisfies it, checked by a static type checker such as mypy or pyright. Protocols suit ISP and DIP especially well, because the concrete class doesn't even need to import the abstraction.`,
      { code: py`from typing import Protocol, runtime_checkable


@runtime_checkable
class Output(Protocol):
    def write(self, text: str) -> None: ...


class Shouty:
    def write(self, volume):          # different meaning, same name
        return volume * 2


print(isinstance(Shouty(), Output))   # True -- only the name is checked`, lang: 'python', title: 'runtime_checkable checks names, not behaviour' },
      py`\`isinstance\` against a protocol only checks that the methods *exist*. Signatures, return types and behaviour — the LSP part — are checked by static type checkers and by your tests, not at runtime.`,
      py`**LSP, precisely.** The contract-based version: a subtype may *weaken* preconditions (accept more) and *strengthen* postconditions (promise more), never the reverse, and must preserve the base's invariants. Type checkers enforce the type-level part: mypy reports an override whose parameters are narrower than the base's as incompatible with the supertype.`,
      py`**OCP without classes.** \`functools.singledispatch\` lets other modules add implementations for new types to an existing function — extension without modification, even for types you don't own. See [functools](lesson:functools).`,
    ],
    production: [
      py`**DI in real apps.** Most Python services wire dependencies by hand in one place — the *composition root*, usually \`main()\` or an app factory. Frameworks offer helpers (FastAPI's \`Depends\`, pytest's fixtures), but the principle is the same: build concrete objects at the edge, pass them inward.`,
      py`**Plug-in systems are OCP at scale.** Packages can advertise plug-ins through *entry points* in \`pyproject.toml\`, and the host discovers them with \`importlib.metadata.entry_points()\` — that's how pytest finds its plug-ins. The host never changes to support a new plug-in.`,
      py`**Know when it's overkill.** An interface with exactly one implementation and no tests that need a fake is ceremony. Many teams follow the *rule of three*: write it directly the first time, tolerate duplication the second time, abstract on the third. Python makes it cheap to introduce an abstraction *later* — a Protocol can be added without touching the existing class.`,
      py`**Testing is the real driver.** In practice, DIP and ISP are adopted mainly because they make unit tests fast and simple. If you find yourself patching module internals with \`unittest.mock.patch\` everywhere, that's a hint a dependency should be injected instead — see [mocking](lesson:mocking).`,
    ],
  },
  mistakes: [
    {
      title: 'Creating dependencies inside the class',
      wrong: { code: py`class InvoiceService:
    def __init__(self):
        self.mailer = SmtpMailer("smtp.example.com")   # hard-wired

    def send(self, invoice):
        self.mailer.send(invoice.email, invoice.render())`, lang: 'python', static: true },
      right: { code: py`class InvoiceService:
    def __init__(self, mailer):        # any object with send(to, body)
        self.mailer = mailer

    def send(self, invoice):
        self.mailer.send(invoice.email, invoice.render())


# production: InvoiceService(SmtpMailer("smtp.example.com"))
# tests:      InvoiceService(FakeMailer())`, lang: 'python', static: true },
      explanation: py`The wrong version can't be tested without a real mail server and can't switch providers without editing the class. Passing the mailer in costs one parameter.`,
    },
    {
      title: 'A subclass that refuses an inherited method',
      wrong: { code: py`class Bird:
    def fly(self):
        return "flap flap"


class Penguin(Bird):
    def fly(self):
        raise NotImplementedError("penguins can't fly")`, lang: 'python' },
      right: { code: py`class Bird:
    def move(self):
        return "flap flap"


class Penguin(Bird):
    def move(self):
        return "waddle"


# Or model the capability separately: only flying birds have fly().`, lang: 'python' },
      explanation: py`Any code that loops over birds calling \`fly()\` explodes on a penguin — the subclass violates LSP. Either the base promises something every subtype can do, or the capability lives in a separate, smaller interface.`,
    },
    {
      title: 'A fat interface that forces dummy methods',
      wrong: { code: py`from abc import ABC, abstractmethod


class Storage(ABC):
    @abstractmethod
    def get(self, key): ...
    @abstractmethod
    def put(self, key, data): ...
    @abstractmethod
    def delete(self, key): ...
    @abstractmethod
    def list_keys(self): ...


class ReadOnlyCache(Storage):
    def get(self, key): ...
    def put(self, key, data): raise NotImplementedError
    def delete(self, key): raise NotImplementedError
    def list_keys(self): raise NotImplementedError`, lang: 'python' },
      right: { code: py`from typing import Protocol


class Reader(Protocol):
    def get(self, key: str) -> bytes | None: ...


class ReadOnlyCache:          # satisfies Reader -- nothing else required
    def get(self, key):
        return None`, lang: 'python' },
      explanation: py`Implementers shouldn't have to stub out methods they can't support (that's an LSP violation waiting to happen), and callers shouldn't depend on methods they never call. Split the interface along how it's used.`,
    },
    {
      title: 'Applying every principle to a 50-line script',
      wrong: { code: py`class AbstractGreetingProvider(ABC): ...
class DefaultGreetingProvider(AbstractGreetingProvider): ...
class GreetingProviderFactory: ...
class GreetingService:
    def __init__(self, provider_factory: GreetingProviderFactory): ...`, lang: 'python', static: true },
      right: { code: py`def greet(name):
    return f"Hello, {name}!"`, lang: 'python' },
      explanation: py`SOLID is a response to *change pressure*. With one implementation, one caller and no test pain, every abstraction is pure overhead. Add seams when a second implementation or a hard-to-test dependency actually appears.`,
    },
    {
      title: 'Growing an if/elif chain for every new type',
      wrong: { code: py`def area(shape):
    if shape["kind"] == "circle":
        return 3.14159 * shape["r"] ** 2
    elif shape["kind"] == "rect":
        return shape["w"] * shape["h"]
    # ...edited again for every new shape, in every function like this`, lang: 'python' },
      right: { code: py`import math
from dataclasses import dataclass


@dataclass
class Circle:
    radius: float

    def area(self):
        return math.pi * self.radius ** 2


def total_area(shapes):
    return sum(shape.area() for shape in shapes)   # never edited again`, lang: 'python' },
      explanation: py`When the same type-switch appears in several functions, every new type means editing all of them. Polymorphism (each type knows its own \`area()\`) or a registry keeps the change in one new place.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Can't instantiate abstract class ReadOnlyCache without an implementation for abstract method 'delete'`,
      cause: py`The class inherits from an ABC with more abstract methods than it can sensibly implement — often a sign of a fat interface (ISP).`,
      fix: py`If the class genuinely can't support those methods, split the ABC into smaller ones (or use small Protocols) instead of adding methods that raise \`NotImplementedError\`.`,
    },
    {
      symptom: py`A test sends real emails, writes real files or hits a real API`,
      cause: py`The code under test creates its dependencies internally (\`self.mailer = SmtpMailer(...)\`), so the test can't substitute a fake.`,
      fix: py`Inject the dependency via the constructor or a parameter with a production default. The test then passes a fake object with the same methods.`,
    },
    {
      symptom: py`error: Argument 1 of "write" is incompatible with supertype "Output"; supertype defines the argument type as "str"`,
      cause: py`A mypy error: an override accepts a *narrower* type than the base method — callers that follow the base's contract could break (an LSP violation found statically).`,
      fix: py`Make the override accept at least everything the base accepts. If it truly can't, it shouldn't be a subtype.`,
    },
    {
      symptom: py`KeyError: 'pdf' when creating ReportService(output, fmt="pdf")`,
      cause: py`The registry has no formatter with that name — usually the module that registers it was never imported, so its decorator never ran.`,
      fix: py`Import the plug-in module at start-up (or discover plug-ins via entry points), and turn the lookup into a clear error: \`raise ValueError(f"unknown format {fmt!r}; known: {sorted(FORMATTERS)}")\`.`,
    },
  ],
  bestPractices: [
    'Think of a responsibility as a reason to change; split code that changes for unrelated reasons.',
    'In Python, a function or module is often the right unit of responsibility — not every job needs a class.',
    'Use registries, passed-in functions and polymorphism for cases that keep growing; keep a short if/elif for cases that don\'t.',
    'Only inherit when the subclass can keep every promise of the base class; otherwise compose.',
    'Describe what a function needs with a small typing.Protocol rather than a big base class.',
    'Pass dependencies in (constructor or parameter with a sensible default) and create concrete objects at the program\'s edge.',
    'Introduce an abstraction when a second implementation or a testing need appears — not before.',
  ],
  whenToUse: {
    use: [
      'Code that will live for years and be changed by several people.',
      'Boundaries with things that change or are slow to test: databases, HTTP APIs, email, clocks, file systems.',
      'Places where new variants keep arriving: export formats, payment providers, discount rules, plug-ins.',
      'Class hierarchies — check every subclass against LSP before shipping it.',
    ],
    avoid: [
      'Small scripts, prototypes and notebooks where one straightforward function does the job.',
      'Abstract base classes or Protocols with exactly one implementation and no test that needs a fake.',
      'Splitting code into many tiny classes "for SRP" when they always change together.',
      'Wrapping the standard library in interfaces "in case we switch" with no concrete plan to switch.',
    ],
  },
  comparison: {
    title: 'The five principles, the Python way',
    headers: ['principle', 'Pythonic tool', 'smell when violated', 'often overkill when…'],
    rows: [
      ['S — single responsibility', 'small functions and modules', 'one feature request edits many unrelated classes', 'the "jobs" always change together'],
      ['O — open/closed', 'pass a function, registry + decorator, polymorphism, singledispatch', 'the same if/elif type-switch edited again and again', 'the set of cases is small and stable'],
      ['L — Liskov substitution', 'composition, small protocols, mypy override checks', 'subclass raises NotImplementedError or needs isinstance checks', 'you aren\'t using inheritance at all'],
      ['I — interface segregation', 'typing.Protocol with one or two methods', 'implementers stub out methods; tests must fake huge objects', 'there is one caller and one implementation'],
      ['D — dependency inversion', 'constructor/parameter injection, defaults like write=print', 'tests need real databases, mail servers or patching', 'the dependency is pure, fast and never swapped (e.g. math)'],
    ],
    note: py`Duck typing means Python code often satisfies I and D without declaring anything. Declaring the Protocol anyway documents the expectation and lets type checkers verify it.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'solid-q1',
      type: 'mcq',
      prompt: py`A \`Payroll\` class has \`calculate_pay()\`, \`save_to_database()\` and \`render_payslip_html()\`. Which principle does it most directly violate?`,
      options: [
        'Single responsibility',
        { text: 'Liskov substitution', why: 'LSP is about subclasses keeping their base class\'s promises. There is no inheritance here.' },
        { text: 'Interface segregation', why: 'ISP is about clients depending on interfaces bigger than they need. The issue here is one class having three reasons to change.' },
        { text: 'None — grouping payroll code together is cohesive', why: 'Pay rules (finance), storage (database admins) and HTML (designers) change for different reasons, so they are three responsibilities.' },
      ],
      answer: 0,
      explanation: py`Pay rules, persistence and presentation change for different reasons and at different times. Splitting them means a new payslip design can't break the pay calculation.`,
    },
    {
      id: 'solid-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Rectangle:
    def __init__(self, width, height):
        self.width, self.height = width, height
    def set_width(self, width):
        self.width = width
    def area(self):
        return self.width * self.height

class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)
    def set_width(self, width):
        self.width = self.height = width

for shape in [Rectangle(3, 4), Square(3)]:
    shape.set_width(5)
    print(shape.area())`,
      options: [
        { text: '20 then 20', why: 'Square.set_width overrides the base method and also sets the height to 5, so the square\'s area is 5 × 5.' },
        '20 then 25',
        { text: '12 then 9', why: 'set_width(5) runs before area() for both shapes, so the original sizes no longer apply.' },
        { text: 'TypeError', why: 'Square inherits area() and overrides set_width with the same signature, so every call is valid.' },
      ],
      answer: 1,
      explanation: py`Rectangle: 5 × 4 = 20. Square: \`set_width(5)\` sets both sides, so 5 × 5 = 25. Code written for rectangles ("height is unchanged") gets a different answer for the subtype — an LSP violation.`,
    },
    {
      id: 'solid-q3',
      type: 'bug',
      prompt: 'Click the line that makes this class impossible to unit-test without a real mail server.',
      code: py`class InvoiceService:
    def __init__(self):
        self.mailer = SmtpMailer("smtp.example.com")

    def send(self, invoice):
        body = invoice.render()
        self.mailer.send(invoice.customer_email, body)`,
      answerLine: 3,
      explanation: py`The class builds its own concrete dependency. Inject it instead: \`def __init__(self, mailer): self.mailer = mailer\`, so tests can pass a fake mailer that just records messages.`,
    },
    {
      id: 'solid-q4',
      type: 'fill',
      prompt: 'Complete the structural interface: any class with a matching `send` method should satisfy it.',
      code: py`from typing import ___


class Notifier(Protocol):
    def send(self, to: str, message: str) -> None: ___`,
      answer: [['Protocol'], ['...', 'pass']],
      explanation: py`\`typing.Protocol\` defines a structural interface. Its method bodies are just placeholders (\`...\` by convention) — implementers don't inherit from it, they simply have a matching \`send\`.`,
    },
    {
      id: 'solid-q5',
      type: 'mcq',
      prompt: 'A `Storage` base class has 12 abstract methods. A nightly report job only ever calls `get(key)`. What does interface segregation suggest?',
      options: [
        { text: 'Make the report job inherit from Storage', why: 'The job uses storage; it isn\'t storage. Inheriting would make it depend on all 12 methods.' },
        'Type the job\'s dependency as a small Reader protocol with just get()',
        { text: 'Add a 13th method, get_for_report()', why: 'That makes the fat interface fatter and couples it to one client.' },
        { text: 'Nothing — Python has no interfaces', why: 'Python has duck typing, ABCs and Protocols; ISP is about what a client depends on, which still matters for tests and readers.' },
      ],
      answer: 1,
      explanation: py`The job should depend only on what it uses. A one-method \`Reader\` protocol documents that, and lets tests pass a tiny fake with just \`get()\`.`,
    },
    {
      id: 'solid-q6',
      type: 'mcq',
      prompt: 'When is adding an abstract interface most likely overkill?',
      options: [
        { text: 'The code talks to a payment provider you may switch next year', why: 'External services are exactly where an abstraction helps — for switching and for testing.' },
        { text: 'Unit tests need to replace a slow database', why: 'Testing is the most common, legitimate reason to introduce an abstraction.' },
        'A small script with one implementation that nothing needs to fake',
        { text: 'Several teams contribute export formats as plug-ins', why: 'A plug-in system is open/closed at its best: the interface is what plug-ins implement.' },
      ],
      answer: 2,
      explanation: py`Abstractions earn their keep when there are several implementations, a testing need or a real boundary. One implementation with no test pain is just extra indirection — add the seam later if needed.`,
    },
    {
      id: 'solid-q7',
      type: 'short',
      prompt: 'Explain dependency inversion in your own words, with a tiny Python example.',
      answer: py`High-level code (the business logic) shouldn't depend directly on low-level details like printing, databases or email; both should depend on an abstraction, and the concrete detail is passed in from outside. For example \`ReportService(output)\` only calls \`output.write(text)\` — in production it gets a \`ConsoleOutput\`, in tests a \`MemoryOutput\`, and the service never changes.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'discount-registry',
      title: 'Open/closed discounts with a registry',
      difficulty: 'intermediate',
      prompt: py`Every new discount currently means editing \`price_after_discount\`'s if/elif chain. Make it open for extension:

1. Create a dict \`DISCOUNTS\` and a decorator factory \`discount(name)\` that registers the decorated function under \`name\` and **returns the function unchanged**.
2. Register three discount functions, each taking a price and returning the new price: \`"none"\` (unchanged), \`"student"\` (15% off), \`"black_friday"\` (50% off).
3. \`price_after_discount(price, kind)\` looks the rule up in \`DISCOUNTS\`, returns the result **rounded to 2 decimals**, and raises \`ValueError\` for an unknown kind.

The tests register a brand-new discount from outside your code and expect \`price_after_discount\` to use it without any edits.`,
      files: {
        'main.py': py`def price_after_discount(price, kind):
    if kind == "none":
        return price
    elif kind == "student":
        return round(price * 0.85, 2)
    elif kind == "black_friday":
        return round(price * 0.5, 2)
    return price


print(price_after_discount(40.0, "student"))
`,
      },
      hints: [
        'Copy the shape of the formatter registry from the playground: a dict plus a decorator factory that stores the function.',
        '`discount(name)` returns an inner `register(func)` that does `DISCOUNTS[name] = func` and `return func`.',
        'In price_after_discount: `rule = DISCOUNTS.get(kind)`; if it is None raise ValueError(f"unknown discount: {kind}"); otherwise `return round(rule(price), 2)`.',
      ],
      solution: {
        explanation: py`The if/elif chain becomes data: a dict from names to functions. The decorator fills it at import time, so adding a discount means writing one new decorated function — \`price_after_discount\` is closed for modification. Returning \`func\` from \`register\` keeps the decorated function usable on its own. Unknown names raise a clear \`ValueError\` instead of silently charging full price, which the old \`return price\` did.`,
        files: {
          'main.py': py`DISCOUNTS = {}


def discount(name):
    """Register the decorated function as the discount called name."""
    def register(func):
        DISCOUNTS[name] = func
        return func
    return register


@discount("none")
def no_discount(price):
    return price


@discount("student")
def student(price):
    return price * 0.85


@discount("black_friday")
def black_friday(price):
    return price * 0.5


def price_after_discount(price, kind):
    """Return the price after the named discount, rounded to cents."""
    rule = DISCOUNTS.get(kind)
    if rule is None:
        raise ValueError(f"unknown discount: {kind}")
    return round(rule(price), 2)


print(price_after_discount(40.0, "student"))
`,
        },
      },
      tests: [
        { name: 'the three discounts work', code: py`assert price_after_discount(40.0, "student") == 34.0
assert price_after_discount(30.0, "black_friday") == 15.0
assert price_after_discount(12.5, "none") == 12.5` },
        { name: 'DISCOUNTS holds the registered functions', code: py`assert isinstance(ns.get('DISCOUNTS'), dict), 'Create a dict named DISCOUNTS'
assert {"none", "student", "black_friday"} <= set(DISCOUNTS)` },
        { name: 'a new discount plugs in without edits', code: py`@discount("staff")
def staff(price):
    return price - 5

assert price_after_discount(20.0, "staff") == 15.0` },
        { name: 'the decorator returns the function unchanged', code: py`@discount("double")
def double(price):
    return price * 2

assert double(3) == 6` },
        { name: 'unknown discounts raise ValueError', code: py`with raises(ValueError):
    price_after_discount(10.0, "mystery")` },
      ],
    },
    {
      id: 'inject-the-clock',
      title: 'Dependency inversion: inject the clock',
      difficulty: 'intermediate',
      prompt: py`\`Greeter.greeting(name)\` calls \`datetime.now()\` directly, so you can't test the evening greeting in the morning. Invert the dependency:

- \`Greeter.__init__(self, clock=datetime.now)\` stores the clock — any **callable that returns a \`datetime\`**.
- \`greeting(name)\` uses \`self.clock()\` instead of \`datetime.now()\`:
  - hour before 12 → \`"Good morning, <name>"\`
  - hour before 18 → \`"Good afternoon, <name>"\`
  - otherwise → \`"Good evening, <name>"\`
- \`Greeter()\` with no argument must still use the real clock.`,
      files: {
        'main.py': py`from datetime import datetime


class Greeter:
    def greeting(self, name):
        hour = datetime.now().hour
        if hour < 12:
            return f"Good morning, {name}"
        if hour < 18:
            return f"Good afternoon, {name}"
        return f"Good evening, {name}"


print(Greeter().greeting("Ada"))
`,
      },
      hints: [
        'The dependency is "where the current time comes from". Make it a constructor parameter.',
        'A function is a perfectly good dependency: `def __init__(self, clock=datetime.now): self.clock = clock` (no parentheses — pass the function, not its result).',
        'In greeting: `hour = self.clock().hour`. In a test: `Greeter(clock=lambda: datetime(2026, 1, 1, 20))`.',
      ],
      solution: {
        explanation: py`The class no longer reaches out for the time — it is *given* a clock. Production code keeps working unchanged because the default is the real \`datetime.now\` (passed as a function, not called). Tests pass a lambda that returns a fixed \`datetime\`, so every branch can be tested at any time of day, with no mocking library. Note the default is evaluated once, at definition time — fine here because \`datetime.now\` is a function, not a value.`,
        files: {
          'main.py': py`from datetime import datetime


class Greeter:
    def __init__(self, clock=datetime.now):
        self.clock = clock

    def greeting(self, name):
        hour = self.clock().hour
        if hour < 12:
            return f"Good morning, {name}"
        if hour < 18:
            return f"Good afternoon, {name}"
        return f"Good evening, {name}"


print(Greeter().greeting("Ada"))
print(Greeter(clock=lambda: datetime(2026, 1, 1, 20)).greeting("Ben"))
`,
        },
      },
      tests: [
        { name: 'morning with a fake clock', code: py`from datetime import datetime
assert Greeter(clock=lambda: datetime(2026, 1, 1, 9)).greeting("Ada") == "Good morning, Ada"` },
        { name: 'noon counts as afternoon', code: py`from datetime import datetime
assert Greeter(clock=lambda: datetime(2026, 1, 1, 12)).greeting("Ada") == "Good afternoon, Ada"` },
        { name: '18:00 counts as evening', code: py`from datetime import datetime
assert Greeter(clock=lambda: datetime(2026, 1, 1, 18, 30)).greeting("Cy") == "Good evening, Cy"` },
        { name: 'defaults to the real clock', code: py`from datetime import datetime
assert Greeter().clock == datetime.now, 'Use datetime.now (without calling it) as the default clock'
assert Greeter().greeting("Ada").endswith(", Ada")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'solid-overview',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does SOLID stand for? Give a one-sentence meaning for each letter.',
      answer: 'Single responsibility: one reason to change. Open/closed: extend by adding code, not editing it. Liskov substitution: subtypes must work wherever the base type works. Interface segregation: depend on small interfaces. Dependency inversion: depend on abstractions and receive concrete details from outside.',
      explanation: py`They're five guidelines for keeping object-oriented code easy to change. In Python they're often satisfied with lightweight tools: functions and modules (S), registries and passed-in functions (O), composition and protocols (L, I), constructor parameters (D).`,
      whyAsked: 'A standard warm-up for design discussions; the follow-ups test whether you can apply them, not just recite them.',
      mistakes: ['Reciting names without explaining any of them', 'Saying SRP means "a class should have only one method"', 'Treating them as rules that must always be applied'],
      followUps: ['Which principle do you find most useful in Python, and why?', 'How does duck typing change interface segregation?', 'Give an example of applying one of them in your own code.'],
      modelAnswer: 'SOLID is five design guidelines for code that stays easy to change. Single responsibility means a module or class should have one reason to change. Open/closed means I can add new behaviour by adding code — a new strategy or plug-in — rather than editing code that works. Liskov substitution means any subclass must be usable wherever its base class is expected without surprises. Interface segregation means clients depend on small interfaces containing only what they use. Dependency inversion means high-level logic depends on abstractions, and the concrete pieces are passed in. In Python I usually apply them with light tools: functions, registries, Protocols and constructor parameters.',
    },
    {
      id: 'solid-srp-reason-to-change',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'SRP is often quoted as "a class should do one thing". Why is that a misleading summary, and what is a better one?',
      answer: '"One thing" is too vague and leads to fragmenting code into tiny classes. The better formulation is "one reason to change" — or, in Robert C. Martin\'s later wording, responsible to one actor: code that serves different people with different change requests should be separated.',
      explanation: py`A \`PayCalculator\` with ten methods can still have one responsibility (all the rules finance owns). A two-method class that both computes pay *and* formats the payslip has two. The test is: *who would ask for this to change?* If two unrelated groups would, split; if things always change together, keep them together — splitting them adds coordination cost.`,
      whyAsked: 'It separates people who memorised slogans from people who use the principle to make real decisions.',
      mistakes: ['Counting methods or lines as the measure of responsibility', 'Splitting code that always changes together', 'Not being able to give a concrete example'],
      followUps: ['How do you spot an SRP violation in code review?', 'Can a module violate SRP even if every class in it follows it?'],
      modelAnswer: '"Do one thing" is too vague — everything does one thing at some level of abstraction, and taken literally it leads to dozens of tiny classes. The better framing is "one reason to change": if a class would be edited because finance changed a pay rule and also because designers changed the payslip layout, it has two responsibilities and those should live apart. Robert Martin later phrased it as being responsible to one actor. The flip side matters too: code that always changes together should stay together. In review I ask "who would request a change to this?" — if the answer is two different teams, I suggest a split.',
    },
    {
      id: 'solid-lsp-readonly-list',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate wrote `ReadOnlyList(list)` that overrides `append` to raise `TypeError`. Code that accepts "a list" now crashes in production. What principle is broken, and what is the fix?',
      code: { lang: 'python', code: py`class ReadOnlyList(list):
    def append(self, item):
        raise TypeError("read-only")


def add_default(tags: list) -> list:
    tags.append("untagged")
    return tags


add_default(["a"])                    # fine
# add_default(ReadOnlyList(["a"]))    # TypeError: read-only` },
      options: ['Single responsibility', 'Liskov substitution', 'Open/closed', 'Nothing — raising is the correct behaviour'],
      correctOption: 1,
      answer: 'Liskov substitution: a ReadOnlyList claims to be a list (isinstance passes, type checkers accept it) but refuses part of the list contract. Don\'t inherit from list; expose a read-only type such as a tuple or a collections.abc.Sequence implementation.',
      explanation: py`Subclassing says "usable anywhere a \`list\` is". Raising on \`append\` strengthens the precondition (you may not mutate), which callers can't anticipate. Better options: return a \`tuple\`, wrap the data in a class that implements \`collections.abc.Sequence\` (read-only by design), or use \`types.MappingProxyType\` for dicts. Also note this subclass doesn't cover \`extend\`, \`insert\`, \`+=\`… — another sign the inheritance is wrong.`,
      whyAsked: 'LSP violations are subtle — the code type-checks and runs until a specific path hits the override. Interviewers want to see you reason about contracts.',
      mistakes: ['Blaming the caller for not checking the type', 'Fixing it by overriding more list methods', 'Thinking LSP only matters in statically typed languages'],
      followUps: ['What would you use instead of subclassing list?', 'How can a type checker help detect LSP problems?', 'Is a frozen dataclass subclass of a mutable dataclass an LSP violation?'],
      modelAnswer: 'That breaks the Liskov substitution principle. By inheriting from list, ReadOnlyList promises it can be used anywhere a list can — isinstance and type checkers agree — but then it refuses append, so perfectly valid code like add_default blows up at runtime. Overriding more methods would just paper over it; extend, insert and += would still leak. The fix is to stop claiming to be a list: return a tuple, or implement collections.abc.Sequence, which is read-only by contract. Then callers that need mutation won\'t type-check, which is exactly the feedback we want.',
    },
    {
      id: 'solid-ocp-shapes',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: '`total_area` uses an isinstance chain, so every new shape means editing it. Refactor so each shape has an `area()` method and `total_area(shapes)` works for any object with `area()` — including shapes written later — without edits.',
      answer: 'Give Circle and Rect an area() method and write total_area as `return sum(shape.area() for shape in shapes)`.',
      explanation: py`Polymorphism moves the type-specific knowledge into each type. \`total_area\` now depends only on the "has \`area()\`" protocol, so a \`Triangle\` defined anywhere — even in a test — just works. The original silently skipped unknown shapes; the new version fails loudly with \`AttributeError\` if something has no \`area()\`, which is better.`,
      starter: { files: { 'main.py': py`import math


class Circle:
    def __init__(self, radius):
        self.radius = radius


class Rect:
    def __init__(self, width, height):
        self.width = width
        self.height = height


def total_area(shapes):
    total = 0
    for shape in shapes:
        if isinstance(shape, Circle):
            total += math.pi * shape.radius ** 2
        elif isinstance(shape, Rect):
            total += shape.width * shape.height
    return total


print(round(total_area([Circle(1), Rect(2, 3)]), 2))
` } },
      tests: [
        { name: 'Circle has area()', code: py`import math
assert Circle(1).area() == approx(math.pi)` },
        { name: 'Rect has area()', code: py`assert Rect(2, 3).area() == 6` },
        { name: 'total_area adds them up', code: py`import math
assert total_area([Circle(1), Rect(2, 3)]) == approx(math.pi + 6)
assert total_area([]) == 0` },
        { name: 'a new shape works without editing total_area', code: py`class Triangle:
    def __init__(self, base, height):
        self.base, self.height = base, height
    def area(self):
        return self.base * self.height / 2

assert total_area([Triangle(4, 3), Rect(1, 1)]) == approx(7)` },
      ],
      solution: { files: { 'main.py': py`import math


class Circle:
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2


class Rect:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


def total_area(shapes):
    return sum(shape.area() for shape in shapes)


print(round(total_area([Circle(1), Rect(2, 3)]), 2))
` } },
      hints: ['Move each branch of the if/elif into the class it checks for.', 'Once every shape has area(), total_area doesn\'t need to know any shape types.', 'sum(shape.area() for shape in shapes)'],
      whyAsked: 'Replacing a type switch with polymorphism is the most common practical application of open/closed.',
      mistakes: ['Adding an elif for Triangle instead of removing the chain', 'Making shapes inherit from an ABC when duck typing (or a Protocol) is enough', 'Keeping a silent fallback that ignores unknown shapes'],
      followUps: ['How would you do this for types you cannot modify? (functools.singledispatch)', 'Would you add a Shape Protocol? What does it buy you?'],
      modelAnswer: 'The isinstance chain means total_area knows every shape, so each new shape forces an edit — it is closed to extension. I move the knowledge into the shapes: Circle and Rect each get an area method, and total_area becomes a one-liner summing shape.area() for every shape. Now a Triangle written anywhere, even in a test, works without touching total_area. I would add a small Shape Protocol with area() for type checkers, and if the types were from a library I could not modify, I would use functools.singledispatch to register area implementations from outside.',
    },
    {
      id: 'solid-dip-vs-di',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare dependency inversion, dependency injection and DI containers. Do you need a container in Python?',
      answer: 'Dependency inversion is the principle (high- and low-level code both depend on abstractions). Dependency injection is a technique for it (pass dependencies in rather than creating them). A DI container automates wiring. In Python you usually don\'t need one: constructor parameters and a hand-written composition root in main() are enough for most apps.',
      explanation: py`Python's dynamic typing, default arguments, first-class functions and modules make manual wiring short and explicit. Containers (third-party libraries exist) can help in very large apps with many object lifetimes, but add magic and indirection. Frameworks often include a light injector — FastAPI's \`Depends\`, pytest fixtures — which is usually all the "container" a Python project needs.`,
      code: { lang: 'python', code: py`class Clock:
    def now(self):
        from datetime import datetime
        return datetime.now()


class Greeter:
    def __init__(self, clock):        # injection: the clock is passed in
        self.clock = clock


def main():                            # composition root: wiring by hand
    greeter = Greeter(Clock())
    return greeter


main()` },
      whyAsked: 'The terms are commonly confused; senior candidates should separate principle, technique and tooling and justify their tooling choice.',
      mistakes: ['Using the three terms interchangeably', 'Claiming DI requires a framework', 'Using module-level globals or monkeypatching as the "injection" mechanism everywhere'],
      followUps: ['What is a composition root?', 'How do you inject configuration?', 'When does monkeypatching in tests indicate a design problem?'],
      modelAnswer: 'Dependency inversion is the design principle: business logic should depend on abstractions, not on concrete details like a specific database. Dependency injection is the everyday technique that achieves it: instead of a class creating its database client, the client is passed in through the constructor or a parameter. A DI container is a tool that automates that wiring. In Python I rarely need one — I wire objects by hand in a composition root such as main() or an app factory, which keeps it explicit and easy to follow. Framework helpers like FastAPI\'s Depends or pytest fixtures cover the remaining cases.',
    },
    {
      id: 'solid-overkill',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A junior engineer submits a PR for a 60-line CSV clean-up script with an abstract `DataSource` base class, a `DataSourceFactory`, a `CleanerStrategy` interface and one implementation of each. How do you review it?',
      answer: 'Kindly push back: every abstraction has exactly one implementation and nothing needs to be faked, so they add indirection without benefit. Suggest plain functions (read, clean, write) with clear names and a couple of tests, and explain when the abstractions would earn their place.',
      explanation: py`SOLID responds to change pressure — multiple implementations, plug-ins, slow or external dependencies that tests must replace. None of those exist here. Python makes it cheap to add an abstraction later (a Protocol can be introduced without touching existing classes), so YAGNI ("you aren't gonna need it") wins. Frame the review as teaching: name the trigger that would justify each abstraction.`,
      whyAsked: 'Seniority shows in knowing when *not* to apply a principle, and in reviewing helpfully.',
      mistakes: ['Approving because "it follows SOLID"', 'Rejecting without explaining the reasoning or the alternative', 'Saying abstractions are always bad'],
      followUps: ['What signals would make you add the DataSource abstraction?', 'What is the rule of three?'],
      modelAnswer: 'I would thank them for thinking about design and then explain that each abstraction here has exactly one implementation and no test needs to swap it, so they cost reading time without buying flexibility. For a 60-line script I would suggest three well-named functions — read, clean, write — and a couple of tests on the cleaning function, which is pure. I would also say when the abstractions would earn their place: a second data source, a plug-in requirement, or a slow dependency that tests need to fake. Python makes it easy to introduce a Protocol later, so we lose nothing by waiting.',
    },
    {
      id: 'solid-isp-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'A service has a read-heavy reporting job, a write API and an admin tool that deletes data, all using one 15-method `Repository` class. How would you apply ISP and DIP to its dependencies?',
      answer: 'Define small role-based Protocols (e.g. OrderReader, OrderWriter, OrderAdmin) describing what each client uses; type each client against only its protocol; keep one concrete repository (or several) satisfying them; wire them in the composition root. Reporting can then use a read replica or cache, and tests fake only a few methods.',
      explanation: py`Role interfaces let each consumer declare its needs. Benefits: reporting can be pointed at a read-only replica or cached implementation without touching the writer; the delete capability is only available where it's wired in (least privilege); tests need tiny fakes. One class can still implement all three protocols structurally — no inheritance changes. This is also a gentle step toward CQRS (separating reads from writes) without committing to it.`,
      code: { lang: 'python', code: py`from typing import Protocol


class OrderReader(Protocol):
    def get(self, order_id: str) -> dict: ...
    def totals_by_day(self) -> dict[str, float]: ...


class OrderWriter(Protocol):
    def add(self, order: dict) -> None: ...


class DailyReport:
    def __init__(self, orders: OrderReader):   # can't write, by design
        self.orders = orders` },
      whyAsked: 'Tests whether you can apply principles to real system boundaries — read/write splits, permissions and testability — not just toy classes.',
      mistakes: ['Splitting the concrete class into many classes when only the interfaces need splitting', 'Creating one protocol per method mechanically', 'Ignoring the testing and permission benefits'],
      followUps: ['How would you route the reporting job to a read replica?', 'Where do transactions fit in?', 'How does this relate to CQRS?'],
      modelAnswer: 'I would design the interfaces around the roles of the clients rather than around the storage. The reporting job gets an OrderReader protocol with just the queries it runs, the API gets an OrderWriter, and the admin tool gets an OrderAdmin that includes delete. The existing repository can satisfy all three structurally, so no class hierarchy changes. Each client is typed against only its protocol and the wiring happens in the composition root. That gives least privilege — only the admin tool can delete — lets me point reporting at a read replica or a cache later, and makes tests small because each fake implements two or three methods.',
    },
  ],

  takeaways: [
    'SOLID is five guidelines for code that stays easy to change; they matter more as code and teams grow.',
    'S: one reason to change — in Python, often a function or module rather than a class.',
    'O: add behaviour by adding code — registries, passed-in functions, polymorphism or singledispatch.',
    'L: a subclass must keep every promise of its base; if it can\'t (Square/Rectangle, read-only list), don\'t inherit.',
    'I: depend on small interfaces — typing.Protocol describes exactly what a client needs, without inheritance.',
    'D: depend on abstractions and inject the concrete pieces; it\'s what makes code testable with simple fakes.',
    'Every principle has a cost: add abstractions when a second implementation or a testing need appears, not before.',
  ],
}
