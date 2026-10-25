// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const EXPORTERS = py`import json


class CsvExporter:
    extension = "csv"

    def export(self, rows):
        keys = list(rows[0])
        lines = [",".join(keys)]
        for row in rows:
            lines.append(",".join(str(row[key]) for key in keys))
        return "\n".join(lines)


class JsonExporter:
    extension = "json"

    def export(self, rows):
        return json.dumps(rows)


class MarkdownExporter:
    extension = "md"

    def export(self, rows):
        keys = list(rows[0])
        lines = ["| " + " | ".join(keys) + " |", "|---" * len(keys) + "|"]
        for row in rows:
            lines.append("| " + " | ".join(str(row[key]) for key in keys) + " |")
        return "\n".join(lines)


def print_report(rows, exporter):
    # duck typing: we never ask WHAT the exporter is, only that it can export
    text = exporter.export(rows)
    print(f"--- report.{exporter.extension} ({len(text)} characters)")
    print(text)


scores = [
    {"player": "Ada", "points": 42},
    {"player": "Ben", "points": 37},
]

for exporter in [CsvExporter(), JsonExporter(), MarkdownExporter()]:
    print_report(scores, exporter)
`

export default {
  id: 'polymorphism-and-duck-typing',
  title: 'Polymorphism & duck typing',
  summary: 'One call, many behaviours: Python picks the right method from the object at runtime, and cares only that the object can do the job — not what class it is.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['classes-and-objects', 'methods-and-attributes', 'inheritance'],
  related: ['composition', 'abstract-base-classes', 'protocols', 'error-handling-patterns', 'special-methods', 'container-protocols', 'iterators', 'context-managers', 'operator-overloading', 'functools', 'type-hints', 'multiple-inheritance-mro'],
  tags: ['polymorphism', 'duck typing', 'EAFP', 'LBYL', 'hasattr', 'isinstance', 'AttributeError', 'protocols', 'special methods', 'dunder', 'len', 'iteration', 'with', 'typing.Protocol', 'structural typing', 'dynamic dispatch', 'singledispatch'],
  apis: [
    { name: 'hasattr(obj, name)', summary: 'True if getattr(obj, name) succeeds. It works by trying the lookup and catching AttributeError.' },
    { name: 'getattr(obj, name, default)', summary: 'Fetch an attribute by name, returning default instead of raising AttributeError when it is missing.' },
    { name: 'isinstance(obj, cls)', summary: 'True if obj is an instance of cls or a subclass (or a registered virtual subclass of an ABC).' },
    { name: 'len(obj) → __len__', summary: 'Built-in functions call special methods looked up on the object\'s class: len() calls type(obj).__len__(obj).' },
    { name: 'typing.Protocol', summary: 'Describes the methods an object must have so type checkers can verify duck typing statically (3.8+).' },
    { name: 'functools.singledispatch', summary: 'Turns a function into one that picks an implementation based on the type of its first argument.' },
  ],
  docs: [
    { label: 'Glossary — duck typing', url: 'https://docs.python.org/3/glossary.html#term-duck-typing' },
    { label: 'Glossary — EAFP and LBYL', url: 'https://docs.python.org/3/glossary.html#term-EAFP' },
    { label: 'Data model — special method names', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names' },
    { label: 'typing — Protocol', url: 'https://docs.python.org/3/library/typing.html#typing.Protocol' },
    { label: 'PEP 544 — Protocols: structural subtyping (static duck typing)', url: 'https://peps.python.org/pep-0544/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Polymorphism** (Greek for "many forms") means *the same call can do different things depending on the object it's called on*. You've used it since your first day of Python:`,
    { code: py`print(len("hello"), len([1, 2]), len({"a": 1}))   # 5 2 1
print(3 + 4, "3" + "4", [3] + [4])                 # 7 34 [3, 4]`, lang: 'python', title: 'polymorphism you already know' },
    py`\`len()\` works on strings, lists and dicts; \`+\` adds numbers but joins strings and lists. Each type decides for itself what "length" or "plus" means. Your own classes join in the same way: if a \`Circle\` and a \`Square\` both have an \`area()\` method, a single loop can call \`shape.area()\` on each and get the right answer.`,
    py`Python takes this one step further with **duck typing**: *"If it walks like a duck and quacks like a duck, it's a duck."* Python never asks *what class* an object is before calling a method — it just tries the method. Any object with the right methods fits, whether or not it shares a parent class with the others. This lesson covers both ideas, the **EAFP** coding style that goes with them, the built-in *protocols* (\`len()\`, \`for\`, \`with\`) that run on duck typing, and a first look at type-checking it with \`Protocol\`.`,
  ],
  why: [
    py`Without polymorphism, code fills up with type checks: "if it's a card, do this; elif it's PayPal, do that; elif…". Every new type means editing every one of those ladders, and forgetting one is a bug.`,
    py`With polymorphism you write the *caller* once — \`method.pay(total)\` — and each type carries its own behaviour. New payment methods, shapes or exporters plug in **without touching existing code**. Design books call this being *open for extension, closed for modification* (see [SOLID](lesson:solid)).`,
    py`Duck typing adds flexibility on top: your function works with classes from other libraries, test fakes, and types that don't exist yet, as long as they have the methods you call. That's why you can pass a file, an \`io.StringIO\` or your own object with \`write()\` to \`print(..., file=...)\`.`,
  ],
  eli15: [
    py`Think of the **Play** button on different devices. On a music app it plays a song, on a video app it starts a film, on a game console it starts a level. You press the same button; each device knows what "play" means for *it*. That's polymorphism.`,
    py`Duck typing is how a talent show works. The judges don't ask for a certificate proving you're a "Singer". They say "sing!" — and if you can sing, you're in. A robot that can sing is in too. Python is the same: it doesn't check an object's family tree, it just asks it to do the thing.`,
    py`And if you *can't* sing? You find out when you're asked to — in Python that's an \`AttributeError\` at the moment the method is called.`,
  ],
  analogy: {
    title: 'Auditions, not diplomas',
    body: [
      py`A band holding auditions for a drummer doesn't check where you studied. They hand you sticks and say "play". A conservatory graduate, a self-taught teenager and a drum machine all pass if they can keep the beat.`,
      py`The band's code is written once — "drummer, play the fill" — and works with whoever turns up. Different drummers play it slightly differently (that's polymorphism), and nobody needs to share a teacher (that's duck typing).`,
    ],
    mapping: [
      ['the band calling "play the fill!"', 'calling a method: drummer.play_fill()'],
      ['each drummer\'s own style', 'each class\'s own implementation of the method'],
      ['not checking diplomas', 'not checking isinstance() before calling'],
      ['a drum machine passing the audition', 'an unrelated class (or a test fake) with the same methods'],
      ['someone who can\'t play', 'an object without the method → AttributeError'],
      ['a written job description', 'a typing.Protocol: lets a checker verify the fit before the audition'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'One call, two different methods',
    props: {
      code: py`class Circle:
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2


class Square:
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2


def total_area(shapes):
    total = 0
    for shape in shapes:
        total += shape.area()     # same call, different method
    return total


print(total_area([Circle(1), Square(2)]))
`,
      notes: {
        20: 'The line never changes, but **which** `area` runs depends on the object `shape` points to right now. Watch the new frame that opens: `Circle.area` the first time, `Square.area` the second.',
        6: 'Called through a `Circle` instance, so `self` is the circle.',
        14: 'Same method name, completely different code — and `Square` doesn\'t inherit from `Circle` or from any shared parent.',
        24: 'Prints 7.14159: 3.14159 from the circle plus 4 from the square.',
      },
    },
    alt: 'A step-by-step trace. total_area receives a list with a Circle and a Square. In the loop, the line total += shape.area() runs twice: the first time a frame for Circle.area opens and returns 3.14159, the second time a frame for Square.area opens and returns 4. The function returns 7.14159, which is printed.',
    caption: py`Step through and watch the call stack. The caller is identical both times; the object decides which code runs. Python looks the method up on \`type(shape)\` **at the moment of the call** — this is called *dynamic dispatch*.`,
  },
  syntax: [
    py`#### 1. Polymorphism by shared method names`,
    py`Give different classes methods with the **same name and compatible parameters**. Callers use the name and never check the type. No base class is required in Python.`,
    { code: py`class CreditCard:
    def pay(self, amount):
        return f"charged {amount:.2f} to card"


class GiftCard:
    def __init__(self, balance):
        self.balance = balance

    def pay(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient balance")
        self.balance -= amount
        return f"paid {amount:.2f} with gift card"


def checkout(total, method):
    return method.pay(total)        # works for ANY object with pay()


print(checkout(19.99, CreditCard()))
print(checkout(5, GiftCard(20)))`, lang: 'python', title: 'payment methods' },
    py`#### 2. Polymorphism through inheritance`,
    py`A base class can provide default behaviour that subclasses **override** (see [inheritance](lesson:inheritance)). Calls made through \`self\` inside the base class also dispatch to the subclass's version:`,
    { code: py`class Notification:
    def __init__(self, text):
        self.text = text

    def render(self):
        return f"[{self.channel()}] {self.text}"

    def channel(self):
        return "generic"


class SmsNotification(Notification):
    def channel(self):              # override
        return "sms"


print(SmsNotification("Your code is 4821").render())   # [sms] Your code is 4821`, lang: 'python', title: 'overriding: the base class calls self.channel()' },
    py`#### 3. Duck typing: ask, don't check`,
    { code: py`def save(text, target):
    target.write(text)              # a file? a StringIO? a fake? don't care


import io

buffer = io.StringIO()
save("hello", buffer)
print(buffer.getvalue())            # hello`, lang: 'python', title: 'anything with write() will do' },
    py`#### 4. When you must handle "can't do it": EAFP vs LBYL`,
    py`- **LBYL** — *Look Before You Leap*: check first (\`if hasattr(obj, "export"):\`).
- **EAFP** — *Easier to Ask Forgiveness than Permission*: just try, and handle the failure (\`try: … except AttributeError:\`). This is the usual Python style (see [EAFP vs LBYL](lesson:error-handling-patterns)).`,
    { code: py`def publish(rows, exporter):
    try:
        export = exporter.export          # only the LOOKUP is inside try
    except AttributeError:
        print(f"skipped: {type(exporter).__name__} cannot export")
        return None
    else:
        return export(rows)               # errors inside export() still surface`, lang: 'python', title: 'EAFP done right: a narrow try plus else' },
    { callout: 'warn', title: 'Keep the try block tiny', text: py`Wrapping the whole call — \`try: exporter.export(rows)\` — would also catch an \`AttributeError\` caused by a **bug inside** \`export()\`, and report a perfectly good exporter as "cannot export". Put only the lookup in \`try\` and the call in \`else\`.` },
    py`#### 5. Built-in protocols are duck typing too`,
    py`A **protocol** is an informal agreement: "implement these special methods and the built-in feature works with your object". No registration, no base class:

| you write | Python calls (on the class) | lesson |
|---|---|---|
| \`len(x)\` | \`__len__\` | [container protocols](lesson:container-protocols) |
| \`for item in x\` | \`__iter__\` (then \`__next__\` on the iterator) | [iterators](lesson:iterators) |
| \`item in x\` | \`__contains__\` (falls back to iterating) | [container protocols](lesson:container-protocols) |
| \`x[i]\` | \`__getitem__\` | [container protocols](lesson:container-protocols) |
| \`with x:\` | \`__enter__\` / \`__exit__\` | [context managers](lesson:context-managers) |
| \`str(x)\`, \`print(x)\` | \`__str__\` (else \`__repr__\`) | [special methods](lesson:special-methods) |
| \`x + y\` | \`__add__\` (then \`y.__radd__\`) | [operator overloading](lesson:operator-overloading) |
| \`if x:\` | \`__bool__\` (else \`__len__\`) | [special methods](lesson:special-methods) |`,
    py`#### 6. Type-checking duck typing with \`Protocol\` (a teaser)`,
    { code: py`from typing import Protocol


class Exporter(Protocol):
    extension: str

    def export(self, rows: list[dict]) -> str: ...


def print_report(rows: list[dict], exporter: Exporter) -> None:
    print(exporter.export(rows))`, lang: 'python', title: 'static duck typing (Protocol: 3.8+)' },
    py`A \`Protocol\` describes the *shape* an object needs. Classes don't inherit from it: a type checker such as mypy or pyright simply checks that whatever you pass has a matching \`extension\` and \`export()\`. At runtime nothing changes — it's still duck typing, just verified before you run. Full story in [protocols](lesson:protocols).`,
  ],
  walkthrough: {
    title: 'Reading the exporter program',
    lang: 'python',
    code: EXPORTERS,
    intro: py`This is the playground program. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [4, 12], text: py`\`CsvExporter\` turns a list of dicts into comma-separated lines. It has a class attribute \`extension\` and one method, \`export(rows)\`. It doesn't inherit from anything.` },
      { lines: [15, 19], text: py`\`JsonExporter\` has the **same two names** — \`extension\` and \`export\` — with completely different code. That shared shape is all the rest of the program relies on.` },
      { lines: [22, 30], text: py`A third exporter, again unrelated by inheritance. Three classes, one shape.` },
      { lines: [33, 37], text: py`\`print_report\` is written **once** and never mentions a class name. Python looks up \`export\` and \`extension\` on whatever object arrives. Even \`len(text)\` is polymorphism: \`len\` asks the string for its length.` },
      { lines: [45, 46], text: py`The loop hands each exporter to the same function. Adding a fourth format means writing one new class and adding it to this list — \`print_report\` doesn't change.` },
    ],
  },
  playground: {
    title: 'One report, many formats',
    objective: 'Add a new exporter, make the report function tolerant of odd objects (EAFP), and make your own class work with len() and for.',
    files: { 'main.py': EXPORTERS },
    expected: py`Three reports, one after another:

\`\`\`text
--- report.csv (27 characters)
player,points
Ada,42
Ben,37
--- report.json (66 characters)
[{"player": "Ada", "points": 42}, {"player": "Ben", "points": 37}]
--- report.md (55 characters)
| player | points |
|---|---|
| Ada | 42 |
| Ben | 37 |
\`\`\``,
    experiments: [
      {
        id: 'tsv-exporter',
        task: py`Add a \`TsvExporter\` class (\`extension = "tsv"\`) whose \`export\` works like the CSV one but separates values with a **tab** (\`"\t"\`). Add it to the list in the loop.`,
        hint: py`Copy \`CsvExporter\`, rename it, and replace both \`","\` with \`"\t"\`.`,
        tests: [
          { name: 'TsvExporter separates with tabs', code: py`assert ns.get('TsvExporter') is not None, 'Define a class named TsvExporter'
assert TsvExporter().export([{"a": 1, "b": 2}]) == "a\tb\n1\t2"` },
          { name: 'the TSV report was printed', code: py`assert '--- report.tsv' in output` },
        ],
        explain: py`\`print_report\` never changed. A new behaviour arrived as a new class with the same *shape* — that's the whole promise of polymorphism.`,
      },
      {
        id: 'default-extension',
        task: py`Someone hands you an exporter with an \`export()\` method but **no** \`extension\` attribute. Make \`print_report\` use \`"txt"\` as the extension in that case, so the header reads \`--- report.txt (...)\`.`,
        hint: py`\`getattr(obj, "name", default)\` returns the default instead of raising when the attribute is missing.`,
        tests: [{ name: 'falls back to .txt', code: py`class Plain:
    def export(self, rows):
        return "hi"
printed = capture(print_report, scores, Plain())
assert "--- report.txt (2 characters)" in printed` }],
        explain: py`\`getattr(exporter, "extension", "txt")\` is a tiny, safe form of "ask forgiveness": try the attribute, fall back if it's missing. Optional attributes are a common part of real duck-typed interfaces.`,
      },
      {
        id: 'eafp-skip',
        task: py`\`print_report(scores, "oops")\` crashes with \`AttributeError: 'str' object has no attribute 'export'\`. Change \`print_report\` so that an object **without** an \`export\` method makes it print exactly \`skipped: str cannot export\` (using the type's name) and return — but an \`AttributeError\` raised *inside* a real \`export()\` must still propagate.`,
        hint: py`Put only \`export = exporter.export\` inside \`try\`; handle \`except AttributeError\` by printing \`f"skipped: {type(exporter).__name__} cannot export"\` and returning; call \`export(rows)\` after the \`try\` (or in \`else\`).`,
        tests: [
          { name: 'skips objects that cannot export', code: py`assert capture(print_report, scores, "oops") == "skipped: str cannot export\n"` },
          { name: 'bugs inside export() are not hidden', code: py`class Broken:
    extension = "x"
    def export(self, rows):
        return rows.missing_attribute
with raises(AttributeError):
    print_report(scores, Broken())` },
        ],
        explain: py`This is EAFP with a *narrow* \`try\`. Only the lookup can produce the "this object can't export" error you want to handle; a bug inside \`export()\` raises its own \`AttributeError\` outside the \`try\` and reaches you with a full traceback instead of being disguised as "skipped".`,
      },
      {
        id: 'report-protocol',
        task: py`Built-in functions use duck typing too. Add a class \`Report\` whose \`__init__(self, rows)\` stores the rows, with \`__len__\` (number of rows) and \`__iter__\` (iterates over the rows), so that \`len(Report(scores)) == 2\` and \`list(Report(scores)) == scores\`.`,
        hint: py`\`def __len__(self): return len(self.rows)\` and \`def __iter__(self): return iter(self.rows)\`.`,
        tests: [
          { name: 'len() works on a Report', code: py`assert ns.get('Report') is not None, 'Define a class named Report'
assert len(Report(scores)) == 2` },
          { name: 'a for loop works on a Report', code: py`assert [row["player"] for row in Report(scores)] == ["Ada", "Ben"]` },
        ],
        explain: py`\`len()\` and \`for\` don't care that \`Report\` isn't a list — they only call \`type(report).__len__\` and \`type(report).__iter__\`. Implementing a protocol's special methods is how your objects join in with the built-in polymorphism (more in [container protocols](lesson:container-protocols)).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Built-in syntax is duck typing on special methods',
    props: {
      width: 760,
      height: 360,
      nodes: [
        { id: 'len', label: 'len(playlist)', x: 120, y: 50, tone: 'yellow' },
        { id: 'for', label: 'for song in playlist', x: 120, y: 135, tone: 'yellow' },
        { id: 'in', label: '"Hey Jude" in playlist', x: 120, y: 220, tone: 'yellow' },
        { id: 'with', label: 'with report:', x: 120, y: 305, tone: 'yellow' },
        { id: 'cls', label: 'type(obj)', note: 'looked up on the CLASS', x: 380, y: 178, tone: 'ink' },
        { id: 'dlen', label: '__len__', x: 640, y: 50, tone: 'blue' },
        { id: 'diter', label: '__iter__ / __next__', x: 640, y: 135, tone: 'blue' },
        { id: 'dcont', label: '__contains__', x: 640, y: 220, tone: 'blue' },
        { id: 'dwith', label: '__enter__ / __exit__', x: 640, y: 305, tone: 'blue' },
      ],
      edges: [
        { from: 'len', to: 'cls' },
        { from: 'for', to: 'cls' },
        { from: 'in', to: 'cls' },
        { from: 'with', to: 'cls' },
        { from: 'cls', to: 'dlen', label: 'len()' },
        { from: 'cls', to: 'diter', label: 'iter()' },
        { from: 'cls', to: 'dcont', label: 'in' },
        { from: 'cls', to: 'dwith', label: 'with' },
        { id: 'fallback', from: 'dcont', to: 'diter', label: 'missing? iterate', dashed: true },
      ],
      steps: [
        { focus: ['len', 'cls', 'dlen'], edges: ['len->cls', 'cls->dlen'], text: py`\`len(playlist)\` doesn't know about playlists. It looks up \`__len__\` on \`type(playlist)\` and calls it. Any class with \`__len__\` returning a non-negative int works with \`len()\`.` },
        { focus: ['for', 'cls', 'diter'], edges: ['for->cls', 'cls->diter'], text: py`A \`for\` loop calls \`iter()\`, which calls \`__iter__\` to get an *iterator*, then calls \`__next__\` on it until \`StopIteration\`. Lists, files, dicts and your own classes all speak this protocol (see [iterators](lesson:iterators)).` },
        { focus: ['in', 'cls', 'dcont', 'diter'], edges: ['in->cls', 'cls->dcont', 'fallback'], text: py`\`in\` tries \`__contains__\` first. If a class doesn't define it, Python falls back to iterating and comparing each item with \`==\` — slower, but it still works.` },
        { focus: ['with', 'cls', 'dwith'], edges: ['with->cls', 'cls->dwith'], text: py`\`with\` calls \`__enter__\` on the way in and \`__exit__\` on the way out — even if an exception is raised. Files, locks and database transactions all plug into the same syntax ([context managers](lesson:context-managers)).` },
        { focus: ['cls'], text: py`Every arrow goes through **the class**, not the instance. That's why sticking \`obj.__len__ = ...\` on one object doesn't make \`len(obj)\` work, and why \`__getattr__\` can't fake these methods. Define them in the class body.` },
      ],
    },
    alt: 'Diagram: four pieces of built-in syntax on the left — len(playlist), for song in playlist, "Hey Jude" in playlist and with report: — each with an arrow to a central node type(obj), labelled looked up on the class. From there arrows lead to the special methods __len__, __iter__/__next__, __contains__ and __enter__/__exit__. A dashed arrow from __contains__ to __iter__ shows that membership tests fall back to iteration.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When Python runs \`shape.area()\`, it does two things **at that moment**: look up the name \`area\` starting from the object's class (\`type(shape)\`), then call what it found with \`shape\` as \`self\`. Nothing is decided in advance — the same line can run different code on every pass through a loop. This is called *dynamic dispatch* (or *late binding*).`,
      py`Python also never checks types before a call. If the object has no \`area\`, you get \`AttributeError: 'Sq' object has no attribute 'area'\` exactly when the line runs — not before. That's both the freedom and the risk of duck typing: errors show up late, so good tests (and optionally type hints) matter.`,
    ],
    technical: [
      py`#### Special methods are looked up on the type`,
      py`For built-in operations, Python skips the instance and goes straight to the class: \`len(x)\` is roughly \`type(x).__len__(x)\`. Instance attributes with dunder names are ignored:`,
      { code: py`class Box:
    pass


b = Box()
b.__len__ = lambda: 5
print(b.__len__())       # 5 — an ordinary attribute lookup finds it
try:
    len(b)
except TypeError as error:
    print(error)         # object of type 'Box' has no len()`, lang: 'python', title: 'instance dunders don\'t count' },
      py`The language reference documents this ("special method lookup") — it lets built-ins behave consistently and lets classes themselves (which are objects too) be used without confusion.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, every type object has C-level *slots* (for example a length slot, an iteration slot, an addition slot). When a class defines \`__len__\`, CPython fills the slot, and \`len()\` calls through it directly. That's why built-in protocol calls are fast and why they bypass \`__getattr__\`. Other implementations get the same *behaviour* by different means.` },
      py`#### Operators use double dispatch`,
      py`\`a + b\` first tries \`type(a).__add__(a, b)\`. If that returns the special value \`NotImplemented\` (meaning "I don't know how to add that"), Python tries \`type(b).__radd__(b, a)\`. Both operands get a say, which is how \`2 * vector\` can work even though \`int\` knows nothing about your \`Vector\` class (details in [operator overloading](lesson:operator-overloading)).`,
      py`#### hasattr is EAFP in disguise`,
      py`\`hasattr(obj, "name")\` is implemented as "call \`getattr(obj, "name")\` and return \`False\` if it raises \`AttributeError\`". So it **runs** properties and \`__getattr__\` — and if a property has a bug that raises \`AttributeError\`, \`hasattr\` cheerfully reports \`False\` and hides the bug. An explicit \`try\` with a narrow scope gives you more control.`,
      py`#### Polymorphism for types you don't own: \`singledispatch\``,
      { code: py`from datetime import date
from functools import singledispatch


@singledispatch
def to_json_value(value):
    raise TypeError(f"cannot serialise {type(value).__name__}")


@to_json_value.register
def _(value: date):
    return value.isoformat()


@to_json_value.register
def _(value: set):
    return sorted(value)


print(to_json_value(date(2026, 3, 1)), to_json_value({3, 1, 2}))   # 2026-03-01 [1, 2, 3]`, lang: 'python', title: 'dispatch on the argument\'s type' },
      py`You can't add a \`to_json_value()\` method to \`date\` or \`set\`, but \`functools.singledispatch\` picks an implementation from the first argument's type (respecting subclasses). It's polymorphism *from the outside* — a clean replacement for an \`isinstance\` ladder (see [functools](lesson:functools)).`,
    ],
    production: [
      py`#### Duck typing + type hints = the modern default`,
      py`Duck typing's weakness is that mistakes surface at runtime. Production codebases keep the flexibility and add a safety net: annotate parameters with a \`typing.Protocol\` (structural, no inheritance needed) and run a type checker in CI ([static type checking](lesson:static-type-checking)). If you need **runtime** enforcement — "refuse to even create an exporter without \`export()\`" — use an [abstract base class](lesson:abstract-base-classes).`,
      py`#### Where \`isinstance\` still belongs`,
      py`- At **trust boundaries**, when validating untrusted input (JSON from a request) before deeper code relies on it ([input validation](lesson:input-validation)).
- Against **abstract** types, not concrete ones: \`isinstance(x, collections.abc.Mapping)\` accepts any mapping, \`type(x) is dict\` rejects \`OrderedDict\`, \`defaultdict\` and your own mappings.
- When behaviour genuinely differs by data type and you don't own the types — prefer \`singledispatch\` or [\`match\`](lesson:match-statement) class patterns to long \`if/elif\` ladders.`,
      py`#### Keep the contract consistent`,
      py`Polymorphism only works if every implementation honours the same contract: same method name, compatible parameters, same kind of return value, same exceptions for the same situations. A \`GiftCard.pay()\` that returns \`False\` on failure while \`CreditCard.pay()\` raises \`ValueError\` forces every caller back into type checks. (This is the *Liskov substitution principle* — see [SOLID](lesson:solid).) Document the contract in a docstring, a Protocol or an ABC.`,
    ],
  },
  mistakes: [
    {
      title: 'An isinstance ladder instead of a method',
      wrong: { code: py`def area(shape):
    if isinstance(shape, Circle):
        return 3.14159 * shape.radius ** 2
    elif isinstance(shape, Square):
        return shape.side ** 2
    # every new shape: edit this function (and every other ladder like it)
    raise TypeError("unknown shape")`, lang: 'python' },
      right: { code: py`class Circle:
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2


class Square:
    def __init__(self, side):
        self.side = side

    def area(self):
        return self.side ** 2


def total_area(shapes):
    return sum(shape.area() for shape in shapes)   # new shapes need no edits`, lang: 'python' },
      explanation: py`A type ladder spreads one type's behaviour across many functions and must be edited for every new type. Moving the behaviour into a method on each class keeps it together and lets callers stay type-blind.`,
    },
    {
      title: 'Checking the exact type and rejecting good inputs',
      wrong: { code: py`def average(values):
    if type(values) != list:
        raise TypeError("values must be a list")
    return sum(values) / len(values)


average((90, 85, 77))   # TypeError, although a tuple would work fine`, lang: 'python', static: true },
      right: { code: py`def average(values):
    values = list(values)          # accept any iterable: list, tuple, generator…
    if not values:
        raise ValueError("no values to average")
    return sum(values) / len(values)


print(average((90, 85, 77)))      # 84.0
print(average(n for n in [1, 2, 3]))   # 2.0`, lang: 'python' },
      explanation: py`\`type(x) != list\` rejects tuples, generators and even subclasses of \`list\`. Ask for the *behaviour* you need — here "can be iterated" — and convert or call it directly. If you must check, check against an abstract type like \`collections.abc.Iterable\`.`,
    },
    {
      title: 'A try block so wide it hides real bugs',
      wrong: { code: py`def publish(rows, exporter):
    try:
        return exporter.export(rows)       # a typo INSIDE export() lands here too
    except AttributeError:
        return "this exporter cannot export"`, lang: 'python' },
      right: { code: py`def publish(rows, exporter):
    try:
        export = exporter.export           # only the lookup is guarded
    except AttributeError:
        return "this exporter cannot export"
    return export(rows)                    # bugs inside export() raise normally`, lang: 'python' },
      explanation: py`\`except AttributeError\` around the whole call can't tell "the object has no \`export\`" from "\`export\` crashed on a typo". Guard only the operation whose failure you expect.`,
    },
    {
      title: 'Same idea, different method names or signatures',
      wrong: { code: py`class CreditCard:
    def pay(self, amount):
        return f"card: {amount}"


class PayPal:
    def make_payment(self, amount, currency):   # different name AND parameters
        return f"paypal: {amount} {currency}"


for method in [CreditCard(), PayPal()]:
    print(method.pay(10))   # AttributeError: 'PayPal' object has no attribute 'pay'`, lang: 'python', static: true },
      right: { code: py`class CreditCard:
    def pay(self, amount, currency="EUR"):
        return f"card: {amount} {currency}"


class PayPal:
    def pay(self, amount, currency="EUR"):
        return f"paypal: {amount} {currency}"


for method in [CreditCard(), PayPal()]:
    print(method.pay(10))`, lang: 'python' },
      explanation: py`Duck typing only works if the ducks quack the same way. Agree on one method name and a compatible signature for every implementation — write it down as a [Protocol](lesson:protocols) or an [ABC](lesson:abstract-base-classes) so tools can check it.`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'Sq' object has no attribute 'area'`,
      cause: py`One class in a polymorphic family named its method differently (\`get_area\`), or the object passed isn't the kind you expected at all.`,
      fix: py`Make every implementation use the same method name and signature. A Protocol plus a type checker, or an ABC, catches this before runtime.`,
    },
    {
      symptom: py`TypeError: CreditCard.pay() takes 2 positional arguments but 3 were given`,
      cause: py`The caller passes arguments that only some implementations accept — the method names match but the signatures don't.`,
      fix: py`Align the signatures across all implementations (give extra parameters defaults) or change the caller to the common subset.`,
    },
    {
      symptom: py`TypeError: object of type 'generator' has no len()`,
      cause: py`The function assumed a list and called \`len()\`, but received an iterator or generator, which can only be looped over once and has no length.`,
      fix: py`Only use the behaviour you need: loop over it, or convert first with \`list(values)\` if you really need the length.`,
    },
    {
      symptom: py`TypeError: 'Report' object is not iterable`,
      cause: py`Your class is used in a \`for\` loop (or \`list()\`, \`sum()\`, unpacking) but doesn't implement the iteration protocol.`,
      fix: py`Add \`def __iter__(self): return iter(self.rows)\` (or make it a generator method with \`yield\`).`,
    },
    {
      symptom: py`TypeError: 'Report' object does not support the context manager protocol (missed __exit__ method)`,
      cause: py`The object was used in a \`with\` statement but its class doesn't define both \`__enter__\` and \`__exit__\`. (Older Pythons word it as \`AttributeError: __enter__\`.)`,
      fix: py`Define both methods on the class, or wrap the object with \`contextlib.closing\` / a \`@contextmanager\` function.`,
    },
    {
      symptom: py`hasattr(sensor, "reading") is False, yet the class clearly defines a reading property.`,
      cause: py`The property's code raises \`AttributeError\` (for example it reads \`self._raw\`, which was never set). \`hasattr\` turns any \`AttributeError\` into \`False\`.`,
      fix: py`Access the attribute directly to see the real traceback, then fix the property. Prefer a narrow \`try\` over \`hasattr\` for properties with logic.`,
    },
  ],
  bestPractices: [
    'Call methods; don\'t check types. Let each class carry its own behaviour instead of writing isinstance ladders.',
    'Give every implementation in a polymorphic family the same method names, compatible parameters and the same error behaviour.',
    'Prefer EAFP with a narrow try (just the risky lookup) plus else, so bugs inside the called method are not swallowed.',
    'Accept the most general thing you can use: "any iterable" rather than "a list", "anything with write()" rather than "a file".',
    'Implement special methods (__len__, __iter__, __contains__, __enter__/__exit__) to make your objects work with built-in syntax.',
    'Document duck-typed interfaces with typing.Protocol and run a type checker; use an ABC when you need runtime enforcement.',
    'When you must branch on types you do not own, use functools.singledispatch or match class patterns rather than long if/elif chains.',
  ],
  useCases: [
    'Payment methods, notification channels or storage backends that all expose the same method.',
    'Exporters/serialisers (CSV, JSON, Markdown) behind one report function.',
    'Shapes, game entities or UI widgets that each draw, move or compute themselves.',
    'Passing test fakes (an object with the same methods) instead of real network or database clients.',
    'Making your own containers and resources work with len(), for, in and with.',
  ],
  whenToUse: {
    use: [
      'Several types should respond to the same request in their own way.',
      'You want callers to work with types written later, by other people, or as test fakes.',
      'You find yourself writing if isinstance(...) / elif isinstance(...) over your own classes.',
    ],
    avoid: [
      'Validating untrusted input at a boundary — check types and values explicitly there.',
      'Forcing unrelated things to share a method name when their meanings differ (a "run" that means jog vs execute).',
      'Relying on duck typing alone in a large codebase without tests or type hints to catch missing methods early.',
    ],
  },
  comparison: {
    title: 'Four ways to express "these objects can do X"',
    headers: ['', 'Duck typing', 'Inheritance + override', 'Abstract base class', 'typing.Protocol'],
    rows: [
      ['Needs a shared parent?', 'no', 'yes', 'yes (or register)', 'no'],
      ['Checked when?', 'at the call, at runtime', 'at the call, at runtime', 'at instantiation (missing abstract methods → TypeError)', 'before running, by a type checker'],
      ['Works with classes you don\'t own?', 'yes', 'no', 'via register()', 'yes'],
      ['Shares implementation?', 'no', 'yes, inherited methods', 'yes, concrete + mixin methods', 'not usually'],
      ['Lesson', 'this one', '[inheritance](lesson:inheritance)', '[abstract base classes](lesson:abstract-base-classes)', '[protocols](lesson:protocols)'],
    ],
    note: py`They combine well: duck-typed code at runtime, a Protocol for the type checker, and an ABC where you also want shared code or a hard runtime check.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'polymorphism-and-duck-typing-q1',
      type: 'mcq',
      prompt: '`def send_all(messages, channel): for m in messages: channel.send(m)`. Which objects can be passed as `channel`?',
      options: [
        { text: 'Only instances of a class named Channel', why: 'Python never checks the class name; it only looks up send when the line runs.' },
        { text: 'Only subclasses of a shared base class', why: 'Inheritance is one way to share a method, but it is not required. Duck typing only needs the method.' },
        'Any object that has a send() method accepting one argument',
        { text: 'Any object at all — Python converts it automatically', why: 'An object without send() raises AttributeError when the call runs.' },
      ],
      answer: 2,
      explanation: py`That's duck typing: the function's only requirement is the behaviour it uses. A real SMTP client, a Slack client and a test fake that records messages all qualify.`,
    },
    {
      id: 'polymorphism-and-duck-typing-q2',
      type: 'output',
      prompt: 'Predict the output. Note which class each `greet()` and `speak()` comes from.',
      code: py`class Animal:
    def speak(self):
        return "..."
    def greet(self):
        return f"I say {self.speak()}"

class Dog(Animal):
    def speak(self):
        return "Woof"

class Robot:
    def speak(self):
        return "Beep"
    def greet(self):
        return "Hello, human"

print(*[t.greet() for t in [Animal(), Dog(), Robot()]], sep=" | ")`,
      options: [
        { text: 'I say ... | I say ... | Hello, human', why: 'Inside Animal.greet, self.speak() is looked up on the actual object. For a Dog that finds Dog.speak.' },
        'I say ... | I say Woof | Hello, human',
        { text: 'I say ... | I say Woof | I say Beep', why: 'Robot defines its own greet(), and it does not inherit from Animal at all.' },
        { text: 'AttributeError', why: 'Every object in the list has a greet() method — Robot by duck typing, not inheritance.' },
      ],
      answer: 1,
      explanation: py`Dynamic dispatch happens on every call, even calls made through \`self\` inside a base class: \`Dog\` inherits \`greet\`, but \`self.speak()\` finds \`Dog.speak\`. \`Robot\` is unrelated by inheritance yet fits the same loop because it has \`greet()\`.`,
    },
    {
      id: 'polymorphism-and-duck-typing-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Cart:
    def __init__(self):
        self.items = []
    def __len__(self):
        return len(self.items)

cart = Cart()
print("empty" if not cart else "full", end=" ")
cart.items.append("apple")
print(len(cart), bool(cart))`,
      answer: 'empty 1 True',
      accept: ['empty 1 True'],
      explanation: py`\`Cart\` has no \`__bool__\`, so truth testing falls back to \`__len__\`: length 0 is falsy, so it prints \`empty\`. After one item, \`len(cart)\` is 1 and \`bool(cart)\` is \`True\`. Built-in truthiness is polymorphism on special methods.`,
    },
    {
      id: 'polymorphism-and-duck-typing-q4',
      type: 'bug',
      prompt: '`total_area` crashes with `AttributeError`. Click the line that breaks the polymorphism.',
      code: py`class Circle:
    def __init__(self, radius):
        self.radius = radius
    def area(self):
        return 3.14159 * self.radius ** 2

class Square:
    def __init__(self, side):
        self.side = side
    def get_area(self):
        return self.side ** 2

def total_area(shapes):
    return sum(s.area() for s in shapes)

print(total_area([Circle(1), Square(2)]))`,
      answerLine: 10,
      explanation: py`\`Square\` names its method \`get_area\`, so \`s.area()\` raises \`AttributeError: 'Square' object has no attribute 'area'\`. Polymorphism needs the same method name (and compatible parameters) on every type. Rename it to \`area\`.`,
    },
    {
      id: 'polymorphism-and-duck-typing-q5',
      type: 'fill',
      prompt: 'Complete this EAFP code so that objects without an `export` method are skipped, while errors raised *inside* `export()` still propagate.',
      code: py`try:
    export = exporter.___
except ___:
    print("skipped")
___:
    print(export(rows))`,
      answer: [['export'], ['AttributeError'], ['else', 'else:']],
      explanation: py`Only the attribute lookup sits inside \`try\`, and the call goes in \`else\`, which runs only if the \`try\` block raised nothing. A bug inside \`export()\` therefore raises normally instead of being mistaken for "no export method".`,
    },
    {
      id: 'polymorphism-and-duck-typing-q6',
      type: 'mcq',
      prompt: 'You annotate a parameter with a `typing.Protocol` called `Exporter`. What changes when the program **runs**?',
      options: [
        { text: 'Python raises TypeError when you pass an object that lacks export()', why: 'Annotations are not enforced at runtime. A missing method still shows up as AttributeError at the call.' },
        { text: 'Every class passed in must inherit from Exporter', why: 'The point of Protocol is structural typing: no inheritance is needed.' },
        'Nothing — the Protocol is for type checkers like mypy/pyright, which verify the shape before you run',
        { text: 'The method calls become faster because their types are known', why: 'CPython does not use annotations to speed up calls.' },
      ],
      answer: 2,
      explanation: py`A Protocol is *static* duck typing: a type checker confirms that whatever you pass has the required attributes and methods. At runtime Python behaves exactly as before. (\`@runtime_checkable\` adds a limited \`isinstance\` check — see [protocols](lesson:protocols).)`,
    },
    {
      id: 'polymorphism-and-duck-typing-q7',
      type: 'short',
      prompt: 'Explain EAFP and LBYL in your own words, and say why EAFP is usually preferred in Python.',
      answer: py`LBYL ("look before you leap") checks that an operation will work before doing it — e.g. if hasattr(obj, "export"). EAFP ("easier to ask forgiveness than permission") just tries the operation and handles the exception if it fails — try: export = obj.export / except AttributeError. EAFP is preferred because it fits duck typing (you test the exact thing you're about to use), avoids duplicate lookups, and avoids race conditions where the situation changes between the check and the use (like a file deleted after os.path.exists). The catch is to keep the try block narrow so you don't swallow unrelated bugs.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'shapes-polymorphism',
      title: 'Replace the type ladder',
      difficulty: 'intermediate',
      prompt: py`\`total_area\` uses an \`isinstance\` ladder and forgot about triangles. Make it polymorphic:

- Give each class an \`area()\` method: \`Circle\` → \`math.pi * radius ** 2\`, \`Rectangle\` → \`width * height\`, \`Triangle\` → \`base * height / 2\`.
- Rewrite \`total_area(shapes)\` so it returns the sum of \`shape.area()\` for **any** objects that have an \`area()\` method — including classes it has never heard of — and \`0\` for an empty list. No \`isinstance\` needed.
- The program should then print \`19.14\`.`,
      files: {
        'main.py': py`import math


class Circle:
    def __init__(self, radius):
        self.radius = radius


class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height


class Triangle:
    def __init__(self, base, height):
        self.base = base
        self.height = height


def total_area(shapes):
    total = 0
    for shape in shapes:
        if isinstance(shape, Circle):
            total += math.pi * shape.radius ** 2
        elif isinstance(shape, Rectangle):
            total += shape.width * shape.height
        # TODO: every new shape means another elif...
    return total


print(round(total_area([Circle(1), Rectangle(2, 3), Triangle(4, 5)]), 2))
`,
      },
      hints: [
        'Move each formula out of total_area and into a method called area(self) on the matching class.',
        'Once every class has area(), total_area only needs to add up shape.area() for each shape.',
        'def total_area(shapes): return sum(shape.area() for shape in shapes) — and Triangle.area returns self.base * self.height / 2.',
      ],
      solution: {
        explanation: py`Each class now owns its formula, so the knowledge about a shape lives in one place. \`total_area\` asks every object the same question — \`area()\` — and doesn't care about classes at all, which is why a brand-new \`Hexagon\` from someone else's code works without any edit. \`sum()\` of an empty generator is \`0\`, so the empty case is free. Total: π + 6 + 10 ≈ 19.14.`,
        files: {
          'main.py': py`import math


class Circle:
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2


class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


class Triangle:
    def __init__(self, base, height):
        self.base = base
        self.height = height

    def area(self):
        return self.base * self.height / 2


def total_area(shapes):
    return sum(shape.area() for shape in shapes)


print(round(total_area([Circle(1), Rectangle(2, 3), Triangle(4, 5)]), 2))
`,
        },
      },
      tests: [
        { name: 'Circle.area uses math.pi', code: py`import math
assert Circle(2).area() == approx(math.pi * 4)` },
        { name: 'Rectangle and Triangle areas', code: py`assert Rectangle(2, 3).area() == 6
assert Triangle(4, 5).area() == 10` },
        { name: 'total_area works with a class it has never seen', code: py`class Hexagon:
    def area(self):
        return 7
assert total_area([Hexagon(), Rectangle(1, 1)]) == 8` },
        { name: 'an empty list has total area 0', code: py`assert total_area([]) == 0` },
        { name: 'prints 19.14', code: py`assert output.strip() == "19.14"` },
      ],
    },
    {
      id: 'eafp-checkout',
      title: 'Pay with whatever works',
      difficulty: 'intermediate',
      prompt: py`A wallet holds a mix of objects. Write \`checkout(amount, methods)\` that tries them **in order** and returns the receipt string from the first one that pays:

- If an object has **no** \`pay\` attribute, skip it.
- If its \`pay(amount)\` raises \`ValueError\` (declined), skip it.
- Return the first successful \`pay(amount)\` result.
- If nothing pays, raise \`RuntimeError("payment failed")\`.
- An \`AttributeError\` raised **inside** a \`pay()\` method is a bug and must **not** be swallowed.

Don't check classes — use EAFP. The program should print \`card (Ada) paid 25.00\`.`,
      files: {
        'main.py': py`class Card:
    def __init__(self, holder):
        self.holder = holder

    def pay(self, amount):
        return f"card ({self.holder}) paid {amount:.2f}"


class GiftCard:
    def __init__(self, balance):
        self.balance = balance

    def pay(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient balance")
        self.balance -= amount
        return f"gift card paid {amount:.2f}"


class LoyaltyPoints:
    """Shows a balance but cannot pay: it has no pay() method."""

    def __init__(self, points):
        self.points = points


def checkout(amount, methods):
    # TODO: try each method in order (see the task)
    return None


wallet = [LoyaltyPoints(500), GiftCard(10), Card("Ada")]
print(checkout(25, wallet))
`,
      },
      hints: [
        'Loop over methods. You need two separate try blocks: one around the lookup, one around the call.',
        'First `try: pay = method.pay` / `except AttributeError: continue`. Then `try: return pay(amount)` / `except ValueError: continue`.',
        'After the loop ends without returning, `raise RuntimeError("payment failed")`. Because the call is not inside the AttributeError try, bugs inside pay() still propagate.',
      ],
      solution: {
        explanation: py`Two narrow \`try\` blocks express two different expectations. The first handles "this object isn't a payment method" — only the attribute **lookup** is guarded, so it can't mistake a bug for a missing method. The second handles the documented failure of a real payment method, \`ValueError\`. Anything else (an \`AttributeError\` from a typo inside \`pay\`, a \`ZeroDivisionError\`…) escapes with its traceback. The loop works with any class that has \`pay()\` — including a \`Cash\` class written later — because it never checks types. Falling out of the loop means nobody paid, so we raise.`,
        files: {
          'main.py': py`class Card:
    def __init__(self, holder):
        self.holder = holder

    def pay(self, amount):
        return f"card ({self.holder}) paid {amount:.2f}"


class GiftCard:
    def __init__(self, balance):
        self.balance = balance

    def pay(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient balance")
        self.balance -= amount
        return f"gift card paid {amount:.2f}"


class LoyaltyPoints:
    """Shows a balance but cannot pay: it has no pay() method."""

    def __init__(self, points):
        self.points = points


def checkout(amount, methods):
    for method in methods:
        try:
            pay = method.pay
        except AttributeError:
            continue                # not a payment method
        try:
            return pay(amount)
        except ValueError:
            continue                # declined: try the next one
    raise RuntimeError("payment failed")


wallet = [LoyaltyPoints(500), GiftCard(10), Card("Ada")]
print(checkout(25, wallet))
`,
        },
      },
      tests: [
        { name: 'skips objects without pay()', code: py`assert checkout(5, [LoyaltyPoints(1), Card("Bo")]) == "card (Bo) paid 5.00"` },
        { name: 'skips a declined gift card', code: py`assert checkout(25, [GiftCard(10), Card("Ada")]) == "card (Ada) paid 25.00"` },
        { name: 'uses the gift card when it has enough', code: py`assert checkout(5, [GiftCard(10), Card("Ada")]) == "gift card paid 5.00"` },
        { name: 'works with any class that has pay()', code: py`class Cash:
    def pay(self, amount):
        return "cash"
assert checkout(1, [Cash()]) == "cash"` },
        { name: 'raises RuntimeError when nothing pays', code: py`with raises(RuntimeError, match="payment failed"):
    checkout(50, [GiftCard(10), LoyaltyPoints(3)])` },
        { name: 'does not swallow bugs inside pay()', code: py`class Buggy:
    def pay(self, amount):
        return self.balanse   # typo: a real bug
with raises(AttributeError):
    checkout(5, [Buggy(), Card("Ada")])` },
        { name: 'prints the card receipt', code: py`assert output.strip() == "card (Ada) paid 25.00"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'polymorphism-and-duck-typing-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is polymorphism, and what does it look like in Python?',
      answer: 'Polymorphism means one interface, many implementations: the same call behaves differently depending on the object it is called on. In Python it shows up in built-ins (len() on str, list, dict; + on numbers and strings), in subclasses overriding methods, and in duck typing, where unrelated classes just share method names.',
      explanation: py`Python decides which method to run at call time by looking the name up on the object's type. Because there are no up-front type declarations, *any* object with the right method participates — inheritance is optional.`,
      code: { lang: 'python', code: py`class Circle:
    def __init__(self, r):
        self.r = r

    def area(self):
        return 3.14159 * self.r ** 2


class Square:
    def __init__(self, s):
        self.s = s

    def area(self):
        return self.s ** 2


for shape in [Circle(1), Square(2)]:
    print(shape.area())     # 3.14159, then 4` },
      whyAsked: 'A foundational OOP concept; interviewers listen for whether you know Python\'s version does not require inheritance.',
      mistakes: ['Defining polymorphism only as "method overriding in subclasses"', 'Confusing it with method overloading (several same-named methods with different parameters), which Python does not have', 'No concrete example'],
      followUps: ['Does Python support method overloading?', 'What is duck typing?', 'How does Python decide which method to call?'],
      modelAnswer: 'Polymorphism means one interface with many implementations — the same call does different things depending on the object. Python is full of it: len works on strings, lists and dicts, and plus adds numbers but concatenates strings. In my own code, if Circle and Square both have an area method, a single loop can call shape.area() on each and get the right result. Python decides which method to run at call time by looking the name up on the object\'s class, and it does not need a shared base class — that is duck typing. Subclass overriding is one way to get polymorphism, but in Python it is not the only one.',
    },
    {
      id: 'polymorphism-and-duck-typing-duck-vs-nominal',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare duck typing with inheritance-based (nominal) polymorphism. What are the trade-offs, and how do modern Python codebases get the best of both?',
      answer: 'Nominal polymorphism requires objects to be declared subclasses of a type; duck typing only requires the right methods. Duck typing is more flexible (works with third-party classes and test fakes, no coupling to a base class) but errors appear only at runtime and the interface is implicit. Modern code keeps duck typing at runtime and documents the interface with typing.Protocol checked by mypy/pyright, using ABCs where runtime enforcement or shared code is wanted.',
      explanation: py`Java-style polymorphism asks "is this object declared as a \`Shape\`?"; Python's default asks "does it have \`area()\`?". Protocols (PEP 544) make the implicit interface explicit for tools *without* requiring inheritance — "structural" typing — while ABCs are "nominal": you inherit or register.`,
      whyAsked: 'Tests whether you understand Python\'s design philosophy and the tools (Protocol, ABC) that address duck typing\'s weaknesses.',
      mistakes: ['Saying duck typing means "no types"', 'Claiming duck typing is unsafe without mentioning tests and type checkers', 'Not knowing Protocol exists'],
      followUps: ['What is the difference between a Protocol and an ABC?', 'What does @runtime_checkable do and what are its limits?', 'Where would you still use isinstance?'],
      modelAnswer: 'With inheritance-based, or nominal, polymorphism an object qualifies because it is declared a subclass of some type. With duck typing it qualifies simply because it has the methods you call. Duck typing is more flexible: it works with classes from other libraries and with test fakes, and it avoids coupling everything to a base class. The cost is that a missing or misnamed method only shows up at runtime, and the interface lives in people\'s heads. Modern Python keeps duck typing at runtime but writes the interface down as a typing.Protocol, so mypy or pyright verify every call site structurally. When I also want shared implementation or to refuse incomplete classes at runtime, I use an abstract base class.',
    },
    {
      id: 'polymorphism-and-duck-typing-eafp-lbyl',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'hasattr() check or try/except AttributeError — which do you prefer for duck-typed code, and what is the classic mistake with the try/except version?',
      answer: 'Usually EAFP: try the lookup and handle AttributeError. It tests exactly what you use, avoids double lookups, and avoids check-then-use races. The classic mistake is a try block that wraps the whole call, which also catches AttributeErrors raised by bugs inside the method. Guard only the lookup and call the method in else (or after the try).',
      explanation: py`\`hasattr\` itself is EAFP internally (it calls \`getattr\` and catches \`AttributeError\`), so it shares the pitfall: a property that raises \`AttributeError\` because of a bug makes \`hasattr\` return \`False\`. LBYL is still fine when the check is cheap, has no side effects, and reads more clearly — for example \`if key in mapping\`.`,
      code: { lang: 'python', code: py`# LBYL
if hasattr(exporter, "export"):
    text = exporter.export(rows)

# EAFP, narrow
try:
    export = exporter.export
except AttributeError:
    text = None
else:
    text = export(rows)` },
      whyAsked: 'EAFP is idiomatic Python; the narrow-try nuance distinguishes people who have debugged real swallowed exceptions.',
      mistakes: ['Wrapping an entire function body in try/except AttributeError', 'Using bare except:', 'Claiming LBYL is always wrong'],
      followUps: ['Why is os.path.exists() followed by open() a race condition?', 'What does hasattr do when a property raises?', 'When would you use getattr with a default instead?'],
      modelAnswer: 'In duck-typed code I usually prefer EAFP: I just try to get the attribute and handle AttributeError if it is missing. It checks exactly the thing I am about to use, avoids looking it up twice, and avoids race conditions where something changes between the check and the use. The classic mistake is wrapping the whole call in the try block, so an AttributeError caused by a typo inside the method gets reported as "this object does not support it". So I put only the lookup in try and make the call in the else branch. hasattr is fine for simple cases, but it is EAFP internally and also turns a buggy property into False.',
    },
    {
      id: 'polymorphism-and-duck-typing-hasattr-property',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why is it dangerous?',
      code: { lang: 'python', code: py`class Sensor:
    @property
    def reading(self):
        return self._raw * 2     # _raw is never set

s = Sensor()
print(hasattr(s, "reading"))` },
      options: ['True', 'False', 'AttributeError: \'Sensor\' object has no attribute \'_raw\'', 'TypeError'],
      correctOption: 1,
      answer: 'False. hasattr runs the property; the property raises AttributeError (for _raw), and hasattr converts any AttributeError into False — so a real bug looks like "this object has no reading attribute".',
      explanation: py`\`hasattr(obj, name)\` is defined as "call \`getattr(obj, name)\` and return \`False\` if it raises \`AttributeError\`". Properties and \`__getattr__\` run during that call. Since Python 3.2, *only* \`AttributeError\` is converted (other exceptions propagate), but an \`AttributeError\` from inside the property is indistinguishable from a missing attribute. Duck-typed code might then silently take a fallback path.`,
      whyAsked: 'Probes understanding of how hasattr and properties actually work, and of how exception types can carry the wrong meaning.',
      mistakes: ['Answering True because the class defines reading', 'Expecting the AttributeError about _raw to be shown', 'Not connecting it to bugs being hidden in duck-typed code'],
      followUps: ['How would you detect this bug?', 'How can a property signal "not available" without being confused with a bug?', 'What does getattr(s, "reading", None) return here?'],
      modelAnswer: 'It prints False. hasattr works by calling getattr and catching AttributeError. Accessing reading runs the property, which fails because self._raw was never set, and that failure is itself an AttributeError — so hasattr reports False, as if the attribute did not exist. That is dangerous in duck-typed code because a real bug quietly sends the program down a fallback path. To surface it I would access the attribute directly to get the traceback, and in properties I avoid letting internal AttributeErrors escape — for example by initialising fields in __init__ or raising a more specific exception.',
    },
    {
      id: 'polymorphism-and-duck-typing-payment-plugins',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Checkout code has `if isinstance(m, CreditCard): ... elif isinstance(m, PayPal): ... elif isinstance(m, ApplePay): ...` repeated in charge, refund and receipt functions. Each new provider means editing all three. How do you redesign it?',
      answer: 'Move the provider-specific code into the providers: every provider class implements the same methods (charge, refund, receipt_line) with the same signatures and error behaviour, and checkout just calls them. Describe the interface with a Protocol (for type checking) or an ABC (for runtime enforcement and shared helpers). New providers are then new classes, with no edits to checkout.',
      explanation: py`This is "replace conditional with polymorphism". The \`isinstance\` ladders spread one provider's knowledge across many functions; methods gather it in one class. Agree on a contract — names, parameters, return type, and *which exception* signals a decline — or callers will drift back to type checks. If providers are chosen by configuration ("stripe", "paypal"), a small registry dict maps names to classes.`,
      code: { lang: 'python', code: py`from typing import Protocol


class PaymentProvider(Protocol):
    def charge(self, amount_cents: int) -> str: ...      # returns a transaction id
    def refund(self, transaction_id: str) -> None: ...


def checkout(cart_total_cents: int, provider: PaymentProvider) -> str:
    return provider.charge(cart_total_cents)


PROVIDERS = {}   # e.g. {"card": CardProvider, "paypal": PayPalProvider}` },
      whyAsked: 'A practical refactoring question: it checks that you recognise type-switching as a smell and can define a clean contract.',
      mistakes: ['Keeping the ladders but moving them into a helper', 'Inconsistent error handling between providers (one returns False, another raises)', 'Forgetting how providers are selected and constructed'],
      followUps: ['Protocol or ABC here — which and why?', 'How would you test checkout without real providers?', 'Where does the registry live, and who populates it?'],
      modelAnswer: 'The isinstance ladders are a sign that each provider\'s behaviour is scattered across the codebase. I would replace the conditionals with polymorphism: every provider class implements the same small interface — charge, refund, receipt_line — with identical signatures and the same exception for a declined payment. Checkout then just calls provider.charge without knowing which provider it has. I would write the interface down as a Protocol so the type checker verifies new providers, or as an ABC if I want runtime enforcement or shared helper methods. Adding a provider becomes adding a class, and in tests I pass a fake provider that records calls.',
    },
    {
      id: 'polymorphism-and-duck-typing-playlist',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Make `Playlist` work with Python\'s built-in syntax: `len(p)`, `for song in p`, and `"song" in p` should all work (and a playlist with no songs should be falsy). Store songs in `self.songs`.',
      answer: 'Implement __len__ (return len(self.songs)), __iter__ (return iter(self.songs)) and __contains__ (return song in self.songs). Truthiness falls back to __len__ automatically.',
      explanation: py`Built-in syntax is polymorphism on special methods, looked up on the class. \`__iter__\` must return a *new* iterator each time — \`iter(self.songs)\` — so the playlist can be looped over repeatedly. \`__contains__\` is optional (Python falls back to iterating) but makes intent and speed explicit.`,
      starter: { files: { 'main.py': py`class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    # TODO: implement __len__, __iter__ and __contains__


road_trip = Playlist(["Hey Jude", "Africa", "Dancing Queen"])
print(road_trip.songs)
` } },
      tests: [
        { name: 'len() works', code: py`assert len(Playlist(["a", "b", "c"])) == 3` },
        { name: 'for loops work, more than once', code: py`p = Playlist(["a", "b"])
assert [s for s in p] == ["a", "b"]
assert list(p) == ["a", "b"]` },
        { name: 'in works', code: py`p = Playlist(["Africa"])
assert "Africa" in p and "Toxic" not in p` },
        { name: 'an empty playlist is falsy', code: py`assert not Playlist([]) and Playlist(["x"])` },
        { name: 'other built-ins work too', code: py`assert sorted(Playlist(["b", "a"])) == ["a", "b"]` },
      ],
      solution: { files: { 'main.py': py`class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    def __len__(self):
        return len(self.songs)

    def __iter__(self):
        return iter(self.songs)

    def __contains__(self, song):
        return song in self.songs


road_trip = Playlist(["Hey Jude", "Africa", "Dancing Queen"])
print(len(road_trip), "Africa" in road_trip, list(road_trip))
` } },
      hints: ['Each built-in feature looks for one special method on the class: len → __len__, for → __iter__, in → __contains__.', 'Delegate each one to self.songs: len(self.songs), iter(self.songs), song in self.songs.'],
      whyAsked: 'Shows you know that Python\'s built-in operations are protocols your own classes can implement — duck typing at the language level.',
      mistakes: ['Returning self from __iter__ without implementing __next__', 'Returning a list (not an iterator) from __iter__', 'Subclassing list just to get these behaviours'],
      followUps: ['What happens if you only define __getitem__?', 'What if __iter__ returned self and the class had a __next__?', 'How would collections.abc.Sequence help?'],
      modelAnswer: 'Python\'s built-in syntax calls special methods on the object\'s class, so I implement those three. __len__ returns len(self.songs), which also makes an empty playlist falsy because truth testing falls back to __len__. __iter__ returns iter(self.songs), a fresh iterator each time, so the playlist can be looped over repeatedly. __contains__ returns song in self.songs; it is optional because in falls back to iteration, but it states intent. Wrapping the list rather than subclassing it keeps the playlist\'s interface small.',
    },
  ],

  takeaways: [
    'Polymorphism: the same call runs different code depending on the object; Python looks the method up on type(obj) at the moment of the call.',
    'Duck typing: Python only cares that an object has the methods you call, not what class it is — no shared base class needed.',
    'Replace isinstance ladders over your own classes with a method that each class implements.',
    'Prefer EAFP with a narrow try around just the lookup (plus else); a wide try or hasattr can hide AttributeErrors from real bugs.',
    'len(), for, in, with, +, str() and truthiness are protocols: implement the special methods in the class and your objects join in.',
    'Special methods are looked up on the class, so instance-level dunders and __getattr__ cannot provide them.',
    'Document duck-typed interfaces with typing.Protocol for type checkers; use an ABC for runtime enforcement or shared code.',
  ],
}
