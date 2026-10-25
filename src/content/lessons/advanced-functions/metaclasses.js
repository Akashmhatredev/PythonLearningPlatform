// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const EXPORTERS_TAIL = py`

class CsvExporter(Exporter, fmt="csv"):
    def export(self, rows):
        return "\n".join(",".join(str(value) for value in row) for row in rows)


class MarkdownExporter(Exporter, fmt="md"):
    def export(self, rows):
        header, *body = rows
        lines = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
        lines += ["| " + " | ".join(str(value) for value in row) + " |" for row in body]
        return "\n".join(lines)


def export(rows, fmt):
    """Find the exporter class registered for fmt and use it."""
    if fmt not in Exporter.registry:
        raise ValueError(f"no exporter for {fmt!r}; known: {sorted(Exporter.registry)}")
    return Exporter.registry[fmt]().export(rows)


rows = [("item", "qty"), ("mug", 2), ("lamp", 1)]
print("registered:", sorted(Exporter.registry))
print(export(rows, "csv"))
print(export(rows, "md"))

try:
    class XmlExporter(Exporter, fmt="xml"):
        pass                           # forgot to write export()
except TypeError as err:
    print("refused:", err)

# Classes are objects too, built by a metaclass. Which one built ours?
print(type(CsvExporter).__name__, "built CsvExporter;", type(type).__name__, "built type")
`

const EXPORTERS = py`class Exporter:
    """Base class: every subclass registers itself for one file format."""

    registry = {}

    def __init_subclass__(cls, /, fmt, **kwargs):
        super().__init_subclass__(**kwargs)    # keep other bases' hooks working
        if fmt in Exporter.registry:
            taken = Exporter.registry[fmt].__name__
            raise TypeError(f"format {fmt!r} is already handled by {taken}")
        if not callable(getattr(cls, "export", None)):
            raise TypeError(f"{cls.__name__} must define export(rows)")
        cls.fmt = fmt
        Exporter.registry[fmt] = cls
` + EXPORTERS_TAIL

const EXPORTERS_METACLASS = py`class ExporterMeta(type):
    """The same registry, built one level up: in the class of the classes."""

    registry = {}

    def __new__(mcls, name, bases, namespace, /, fmt=None, **kwargs):
        cls = super().__new__(mcls, name, bases, namespace, **kwargs)
        if fmt is None:                        # the base class itself
            return cls
        if fmt in mcls.registry:
            taken = mcls.registry[fmt].__name__
            raise TypeError(f"format {fmt!r} is already handled by {taken}")
        if not callable(getattr(cls, "export", None)):
            raise TypeError(f"{name} must define export(rows)")
        cls.fmt = fmt
        mcls.registry[fmt] = cls
        return cls


class Exporter(metaclass=ExporterMeta):
    """Base class. Exporter.registry is found on the metaclass."""
` + EXPORTERS_TAIL

const COMMANDS_STARTER = py`class Command:
    """Base class for chat-bot commands. Subclasses register themselves by name."""

    registry = {}

    def __init_subclass__(cls, /, name, **kwargs):
        super().__init_subclass__(**kwargs)
        # TODO: reject duplicate names, require a callable run(),
        #       store the name on the class and register the class


class Greet(Command, name="greet"):
    def run(self, who):
        return f"Hello, {who}!"


class Add(Command, name="add"):
    def run(self, *numbers):
        return str(sum(int(n) for n in numbers))


def dispatch(line):
    """'greet Ada' -> Greet().run('Ada'); unknown -> 'unknown command: <word>'."""
    # TODO
    return None


print(dispatch("greet Ada"))
print(dispatch("add 2 3 4"))
print(dispatch("dance"))
`

const COMMANDS_SOLUTION = py`class Command:
    """Base class for chat-bot commands. Subclasses register themselves by name."""

    registry = {}

    def __init_subclass__(cls, /, name, **kwargs):
        super().__init_subclass__(**kwargs)
        if name in Command.registry:
            raise TypeError(f"duplicate command {name!r} (already {Command.registry[name].__name__})")
        if not callable(getattr(cls, "run", None)):
            raise TypeError(f"{cls.__name__} must define run()")
        cls.name = name
        Command.registry[name] = cls


class Greet(Command, name="greet"):
    def run(self, who):
        return f"Hello, {who}!"


class Add(Command, name="add"):
    def run(self, *numbers):
        return str(sum(int(n) for n in numbers))


def dispatch(line):
    """'greet Ada' -> Greet().run('Ada'); unknown -> 'unknown command: <word>'."""
    word, *args = line.split()
    command_class = Command.registry.get(word)
    if command_class is None:
        return f"unknown command: {word}"
    return command_class().run(*args)


print(dispatch("greet Ada"))
print(dispatch("add 2 3 4"))
print(dispatch("dance"))
`

const CONSTANTS_STARTER = py`class ConstantsMeta(type):
    """Metaclass for classes that only hold constants."""

    def __new__(mcls, name, bases, namespace):
        # TODO: reject public names that are not UPPER_CASE (TypeError)
        return super().__new__(mcls, name, bases, namespace)

    def __setattr__(cls, name, value):
        # TODO: refuse to (re)assign class attributes (AttributeError)
        super().__setattr__(name, value)

    def __delattr__(cls, name):
        # TODO: refuse to delete class attributes (AttributeError)
        super().__delattr__(name)

    def __iter__(cls):
        # TODO: yield (name, value) for the class's own public names, in order
        return iter(())

    def __len__(cls):
        # TODO: how many constants?
        return 0


class Config(metaclass=ConstantsMeta):
    TIMEOUT = 30
    RETRIES = 3
    API_URL = "https://api.example.com"


print(dict(Config), len(Config))
`

const CONSTANTS_SOLUTION = py`class ConstantsMeta(type):
    """Metaclass for classes that only hold constants."""

    def __new__(mcls, name, bases, namespace):
        for key in namespace:
            if not key.startswith("_") and not key.isupper():
                raise TypeError(f"{name}.{key}: constants must be UPPER_CASE")
        return super().__new__(mcls, name, bases, namespace)

    def __setattr__(cls, name, value):
        raise AttributeError(f"cannot reassign constant {cls.__name__}.{name}")

    def __delattr__(cls, name):
        raise AttributeError(f"cannot delete constant {cls.__name__}.{name}")

    def __iter__(cls):
        for key, value in vars(cls).items():
            if not key.startswith("_"):
                yield key, value

    def __len__(cls):
        return sum(1 for _ in cls)


class Config(metaclass=ConstantsMeta):
    TIMEOUT = 30
    RETRIES = 3
    API_URL = "https://api.example.com"


print(dict(Config), len(Config))
`

const RECORD_STARTER = py`def make_record(name, field_names):
    """Build and return a new class called name, using type() — no class statement."""
    # TODO: define __init__, __repr__ and __eq__ functions here,
    #       then return type(name, (), {...})
    return None


Point = make_record("Point", ["x", "y"])
print(Point)
`

const RECORD_SOLUTION = py`def make_record(name, field_names):
    """Build and return a new class called name, using type() — no class statement."""
    fields = tuple(field_names)

    def __init__(self, *values):
        if len(values) != len(fields):
            raise TypeError(f"{name} expects {len(fields)} values, got {len(values)}")
        for field, value in zip(fields, values):
            setattr(self, field, value)

    def __repr__(self):
        inner = ", ".join(f"{field}={getattr(self, field)!r}" for field in fields)
        return f"{name}({inner})"

    def __eq__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return all(getattr(self, f) == getattr(other, f) for f in fields)

    namespace = {"fields": fields, "__init__": __init__, "__repr__": __repr__, "__eq__": __eq__}
    return type(name, (), namespace)


Point = make_record("Point", ["x", "y"])
print(Point, Point(1, 2), Point(1, 2) == Point(1, 2))
`

export default {
  id: 'metaclasses',
  title: 'Metaclasses, __init_subclass__ & class creation',
  summary: 'Classes are objects built at runtime by a metaclass (normally type); knowing the creation steps — __prepare__, running the body, the metaclass __new__/__init__, __set_name__ and __init_subclass__ — lets you pick the simplest hook: a class decorator, __init_subclass__ or, rarely, a metaclass.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['classes-and-objects', 'inheritance', 'descriptors'],
  related: ['descriptors', 'object-model', 'advanced-decorators', 'decorators', 'abstract-base-classes', 'enums', 'dataclasses', 'inheritance', 'multiple-inheritance-mro', 'attribute-access', 'special-methods', 'design-patterns', 'protocols', 'type-hints', 'modules-and-imports', 'packaging'],
  tags: ['metaclass', 'metaclasses', 'type', 'type()', 'class creation', '__prepare__', '__new__', '__init__', '__call__', '__init_subclass__', '__set_name__', 'class decorators', 'plugin registry', 'class keyword arguments', 'metaclass conflict', 'ABCMeta', 'EnumType', 'types.new_class', 'singleton', '__classcell__', 'annotationlib'],
  apis: [
    { name: 'type(name, bases, namespace, **kwargs)', summary: 'Creates a new class at runtime; keyword arguments go to __init_subclass__ like class keywords.' },
    { name: 'type(obj)', summary: 'With one argument: the class of obj. type(SomeClass) is its metaclass.' },
    { name: 'object.__init_subclass__(cls, **kwargs)', summary: 'Called on the parent class whenever a subclass is created (3.6+); implicitly a classmethod; receives the class keywords.' },
    { name: 'object.__set_name__(self, owner, name)', summary: 'Called by type.__new__ on each attribute in the new class namespace that defines it (3.6+).' },
    { name: 'metaclass.__prepare__(name, bases, **kwargs)', summary: 'Classmethod on the metaclass returning the mapping the class body runs in (default: a new dict).' },
    { name: 'metaclass.__new__(mcls, name, bases, namespace, **kwargs)', summary: 'Builds the class object; must call type.__new__ (via super) and return the class.' },
    { name: 'metaclass.__call__(cls, *args, **kwargs)', summary: 'Runs when the class is called (Cls(...)); type.__call__ calls __new__ then __init__.' },
    { name: 'types.new_class(name, bases=(), kwds=None, exec_body=None)', summary: 'Creates a class dynamically using the full class-statement machinery (metaclass resolution, __prepare__).' },
    { name: 'types.prepare_class(name, bases=(), kwds=None)', summary: 'Returns (metaclass, namespace, kwds) — the first steps of a class statement.' },
  ],
  docs: [
    { label: 'Data model — customizing class creation', url: 'https://docs.python.org/3/reference/datamodel.html#customizing-class-creation' },
    { label: 'Data model — metaclasses', url: 'https://docs.python.org/3/reference/datamodel.html#metaclasses' },
    { label: 'Built-in functions — type', url: 'https://docs.python.org/3/library/functions.html#type' },
    { label: 'types.new_class and prepare_class', url: 'https://docs.python.org/3/library/types.html#dynamic-type-creation' },
    { label: 'PEP 3115 — metaclasses in Python 3000 (__prepare__)', url: 'https://peps.python.org/pep-3115/' },
    { label: 'PEP 487 — simpler customisation of class creation', url: 'https://peps.python.org/pep-0487/' },
    { label: 'Annotations best practices (3.14 annotationlib)', url: 'https://docs.python.org/3/howto/annotations.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In Python a **class is an object** like any other. You can store it in a variable, put it in a dictionary, pass it to a function — and, like every object, it was *made* by something. The thing that makes classes is called a **metaclass**: the class of a class. For almost every class you've written, that metaclass is the built-in \`type\`.`,
    py`When Python runs a \`class\` statement it follows a fixed recipe: pick the metaclass, prepare a namespace, run the class body, ask the metaclass to build the class object, let descriptors learn their names (\`__set_name__\`), tell the parent class a new subclass was born (\`__init_subclass__\`), then apply class decorators. Each step is a **hook** you can customise.`,
    py`This lesson walks through that recipe and the three tools that plug into it, from simplest to most powerful:`,
    py`1. **class decorators** — change one finished class ([advanced decorators](lesson:advanced-decorators));
2. **\`__init_subclass__\`** — a parent reacting to every new subclass: plugin registries, validation, class keywords;
3. **metaclasses** — control over the whole creation process and over how the *class object itself* behaves (\`len(Color)\`, \`isinstance\` hooks).`,
    py`Metaclasses have a reputation for being magic. By the end you'll see they're ordinary classes that inherit from \`type\` — and you'll know why, most of the time, you shouldn't need one.`,
  ],
  why: [
    py`**Frameworks are built on class creation.** \`enum.Enum\`, \`abc.ABC\`, \`dataclasses\`, ORMs and web frameworks all do work *when your class is defined*: turning \`RED = 1\` into an enum member, recording abstract methods, generating \`__init__\`, mapping fields to database columns. Understanding the creation steps turns that "magic" into readable code.`,
    py`**Plugin systems need it.** "Every subclass of \`Exporter\` should be found automatically by its file format" is a class-creation problem. \`__init_subclass__\` solves it in a few lines, with errors raised at *definition* time instead of in production.`,
    py`**Choosing the lightest tool matters.** A metaclass can do everything, but it is harder to read and clashes with other metaclasses (\`TypeError: metaclass conflict\`). Knowing exactly what each hook can and can't do lets you pick a decorator or \`__init_subclass__\` and keep your code friendly to other libraries.`,
  ],
  eli15: [
    py`Think of objects as cookies and a class as the **cookie cutter** that makes them. But someone had to make the cookie cutter too — a little factory that bends metal into cutter shapes. That factory is the **metaclass**. Normally Python uses its standard factory, \`type\`, for every cutter.`,
    py`When you write \`class Exporter:\`, you're sending an order to the factory: "here's a name, here's what it's based on, and here's a list of what goes inside". The factory follows the same steps every time, and at a few of those steps it lets you add your own instructions.`,
    py`Most of the time you don't need your own factory. If you just want "whenever someone makes a new cutter based on mine, write it down in my catalogue", the parent class can do that itself with \`__init_subclass__\`. You build a custom factory (a metaclass) only when you need to change the factory's actual machinery.`,
  ],
  analogy: {
    title: 'The cookie-cutter factory',
    body: [
      py`A bakery (your program) makes cookies (objects) with cookie cutters (classes). Cutters come from a factory (the metaclass). The standard factory, \`type\`, takes an order form — a name, the cutters it's based on, and the list of features — and produces a cutter.`,
      py`The factory's process has fixed stations: it hands you a blank order form (\`__prepare__\`), you fill it in (the class body), the machine stamps the cutter (\`__new__\`), each part gets its label engraved (\`__set_name__\`), the parent design's owner is notified (\`__init_subclass__\`), final checks run (\`__init__\`), and afterwards a shop can still add a sticker to the finished cutter (a class decorator).`,
      py`If you only want to be told about every new design based on yours, you ask to be notified — you don't build a new factory. A custom factory is for when the *cutter itself* must behave differently, like a cutter that can count the shapes it's allowed to make.`,
    ],
    mapping: [
      ['cookies', 'instances (objects made from a class)'],
      ['cookie cutter', 'a class'],
      ['the factory that makes cutters', 'a metaclass (normally type)'],
      ['the order form: name, base designs, features', 'type(name, bases, namespace)'],
      ['the blank order form', '__prepare__ returns the namespace'],
      ['stamping the cutter', 'metaclass __new__ → type.__new__'],
      ['engraving each part’s label', '__set_name__ on descriptors'],
      ['notifying the owner of the parent design', '__init_subclass__ on the parent class'],
      ['a sticker added in the shop afterwards', 'a class decorator'],
      ['a custom factory', 'class Meta(type): ... — only when type’s machinery must change'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a class being created, hook by hook',
    props: {
      code: py`class Meta(type):
    @classmethod
    def __prepare__(mcls, name, bases):
        print("__prepare__:", name)
        return {}

    def __new__(mcls, name, bases, namespace):
        print("Meta.__new__:", name)
        return super().__new__(mcls, name, bases, namespace)

    def __init__(cls, name, bases, namespace):
        print("Meta.__init__:", name)
        super().__init__(name, bases, namespace)


class Base(metaclass=Meta):
    def __init_subclass__(cls):
        print("Base.__init_subclass__:", cls.__name__)


class Plugin(Base):
    print("running the body of Plugin")
    version = 1
`,
      notes: {
        3: '`__prepare__` runs **before** the body: it returns the mapping the body will fill. It is a classmethod on the metaclass.',
        7: '`Meta.__new__` receives the finished namespace and must call `type.__new__` (through `super()`) to build the real class object.',
        9: 'Inside `type.__new__`: the class object is created, `__set_name__` runs on descriptors, then the **parent’s** `__init_subclass__` is called.',
        11: '`Meta.__init__` runs last, on the already-built class.',
        16: '`metaclass=Meta` chooses the factory. Creating `Base` runs prepare → new → init; `Base` has no parent with a custom hook.',
        17: '`__init_subclass__` is implicitly a classmethod. It does **not** run for `Base` itself — only for classes created *from* it.',
        21: '`Plugin` inherits its metaclass from `Base`, so `Meta` builds it too.',
        22: 'The class body is ordinary code, executed once, top to bottom, inside the namespace `__prepare__` returned.',
      },
    },
    alt: 'A step-by-step trace of two class statements. For Base, Meta.__prepare__ runs, then the body defines __init_subclass__, then Meta.__new__ calls type.__new__, then Meta.__init__. For Plugin, Meta.__prepare__ runs, then the class body prints a message and sets version, then Meta.__new__ calls type.__new__, which calls Base.__init_subclass__ with Plugin, and finally Meta.__init__ runs.',
    caption: py`Step through with ▶ and read the printed order: **prepare → body → Meta.__new__ → (inside type.__new__) parent's __init_subclass__ → Meta.__init__**. Watch the call stack when \`Base.__init_subclass__\` runs: it's called from inside \`Meta.__new__\`.`,
  },
  syntax: [
    py`#### Classes are objects, made by type`,
    { code: py`class Point:
    x = 0


print(type(Point))            # <class 'type'>   — Point is an instance of type
print(type(type))             # <class 'type'>   — type is its own metaclass
registry = {"point": Point}   # classes can be stored like any other object

# The class statement above is (roughly) this call:
Point2 = type("Point2", (), {"x": 0})
print(Point2.__name__, Point2.x)   # Point2 0`, lang: 'python', title: 'type(name, bases, namespace) creates a class' },
    py`\`type\` has two jobs: with **one** argument it tells you an object's class; with **three** (name, a tuple of base classes, a dict of attributes) it *creates* a class. Extra keyword arguments are passed on exactly like class keywords: \`type("TsvExporter", (Exporter,), ns, fmt="tsv")\`.`,
    py`#### __init_subclass__: the parent hears about each subclass (3.6+)`,
    { code: py`class Plugin:
    registry = {}

    def __init_subclass__(cls, /, name, **kwargs):   # implicitly a classmethod
        super().__init_subclass__(**kwargs)          # stay cooperative
        cls.name = name
        Plugin.registry[name] = cls


class CsvPlugin(Plugin, name="csv"):                # class keyword -> __init_subclass__
    pass


print(Plugin.registry)   # {'csv': <class '__main__.CsvPlugin'>}`, lang: 'python', title: 'class keywords and __init_subclass__' },
    py`- It runs for every **subclass** (children, grandchildren…), never for the class that defines it.
- Keyword arguments in the class line (\`name="csv"\`) are delivered to it. Consume the ones you know and forward the rest with \`super().__init_subclass__(**kwargs)\`; \`object.__init_subclass__\` raises \`TypeError\` for any leftovers.
- The \`/\` makes \`cls\` positional-only, so a class keyword can never clash with it.`,
    py`#### A metaclass is a subclass of type`,
    { code: py`class Meta(type):
    @classmethod
    def __prepare__(mcls, name, bases, **kwargs):       # optional: the namespace mapping
        return {}

    def __new__(mcls, name, bases, namespace, **kwargs):  # build (and return!) the class
        cls = super().__new__(mcls, name, bases, namespace, **kwargs)
        return cls

    def __init__(cls, name, bases, namespace, **kwargs):  # optional: finish it
        super().__init__(name, bases, namespace, **kwargs)

    def __call__(cls, *args, **kwargs):                 # optional: runs on Cls(...)
        return super().__call__(*args, **kwargs)


class Model(metaclass=Meta):    # choose the metaclass with the metaclass= keyword
    pass


class User(Model):              # subclasses inherit the metaclass
    pass


print(type(User).__name__)      # Meta`, lang: 'python', title: 'the shape of a metaclass' },
    py`Naming conventions: in a metaclass, the first parameter of \`__new__\`/\`__prepare__\` is the metaclass (\`mcls\`, \`mcs\` or \`metacls\`), and in ordinary methods it's the class being built (\`cls\`) — because instances of a metaclass *are* classes.`,
    py`#### Which hook runs when`,
    py`| step | hook | who defines it |
|---|---|---|
| 1. choose the metaclass | \`metaclass=\` keyword, else the most-derived metaclass of the bases | you / the base classes |
| 2. prepare the namespace | \`__prepare__(name, bases, **kw)\` | metaclass |
| 3. run the class body | your code fills the namespace | you |
| 4. build the class | \`Meta.__new__\` → \`type.__new__\` | metaclass |
| 4a. (inside type.__new__) | \`__set_name__(owner, name)\` on attributes | descriptors |
| 4b. (inside type.__new__) | \`__init_subclass__(**kw)\` of the **parent** | the parent class |
| 5. finish the class | \`Meta.__init__\` | metaclass |
| 6. decorate | \`@decorator\` lines, bottom-up | you |
| 7. bind the name | \`Plugin = <the result>\` | Python |`,
    { callout: 'version', title: 'Version notes', text: py`\`metaclass=\` and \`__prepare__\` come from [PEP 3115](https://peps.python.org/pep-3115/) (Python 3.0 — Python 2's \`__metaclass__\` attribute is silently ignored by Python 3). \`__init_subclass__\` and \`__set_name__\` arrived in 3.6 ([PEP 487](https://peps.python.org/pep-0487/)), as did the guarantee that the class namespace keeps definition order. In **3.14**, the namespace passed to a metaclass no longer contains \`__annotations__\` (annotations are evaluated lazily, PEP 649/749) — read them from the finished class instead (see Internals).` },
  ],
  walkthrough: {
    title: 'Reading the exporter registry',
    lang: 'python',
    code: EXPORTERS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [6, 7], text: py`\`__init_subclass__\` is the parent's "a new subclass was created" hook — implicitly a classmethod, so \`cls\` is the **new subclass**. \`fmt\` arrives from the class keyword; \`super().__init_subclass__(**kwargs)\` passes anything else along so other base classes' hooks still run.` },
      { lines: [8, 12], text: py`Validation at **definition time**: a duplicate format or a missing \`export\` method raises \`TypeError\` while the class statement runs — usually at import, long before a user clicks "Export".` },
      { lines: [13, 14], text: py`The subclass is stamped with its format and stored in the registry. Classes are objects, so a dict of classes is perfectly ordinary.` },
      { lines: [17, 19], text: py`\`class CsvExporter(Exporter, fmt="csv")\` — the class keyword \`fmt\` flows to \`Exporter.__init_subclass__\`. The subclass doesn't call anything; registration happens automatically.` },
      { lines: [22, 27], text: py`A second exporter registers itself the same way. Adding a format never requires editing \`Exporter\` or \`export()\` — the *open/closed* idea in practice.` },
      { lines: [30, 34], text: py`\`export()\` looks the class up by name and instantiates it. This is the "plugin lookup" half of the pattern.` },
      { lines: [42, 46], text: py`A class statement can fail. The \`TypeError\` comes out of \`__init_subclass__\` while \`XmlExporter\` is being created, so the name \`XmlExporter\` is never bound and nothing is registered.` },
      { lines: [49, 49], text: py`\`type(CsvExporter)\` is \`type\`: the metaclass that built it. And \`type(type)\` is \`type\` too — the loop is wired into the interpreter. The *Metaclass version* variant builds the same registry with a custom metaclass; compare the two.` },
    ],
  },
  playground: {
    title: 'Self-registering exporters',
    objective: 'Run it, add new exporters (including one built without a class statement), and compare the __init_subclass__ version with the metaclass variant.',
    files: { 'main.py': EXPORTERS },
    expected: py`\`\`\`text
registered: ['csv', 'md']
item,qty
mug,2
lamp,1
| item | qty |
|---|---|
| mug | 2 |
| lamp | 1 |
refused: XmlExporter must define export(rows)
type built CsvExporter; type built type
\`\`\`

Switch to the **Metaclass version** variant: the output is identical except the last line, which now says \`ExporterMeta built CsvExporter\`.`,
    variants: [
      { id: 'metaclass', label: 'Metaclass version', files: { 'main.py': EXPORTERS_METACLASS } },
    ],
    experiments: [
      {
        id: 'json-exporter',
        task: py`Add a \`JsonExporter\` registered as \`"json"\`. Its \`export(rows)\` returns \`json.dumps\` of a list with one dict per data row, keyed by the header — for the sample rows: \`[{"item": "mug", "qty": 2}, {"item": "lamp", "qty": 1}]\`. Don't forget \`import json\` at the top.`,
        hint: py`\`header, *body = rows\`, then \`json.dumps([dict(zip(header, row)) for row in body])\`. Declare it with \`class JsonExporter(Exporter, fmt="json"):\`.`,
        tests: [
          { name: 'json is registered', code: py`assert "json" in Exporter.registry, 'Register a class with fmt="json"'` },
          { name: 'exports one dict per row', code: py`import json as _json
assert _json.loads(export([("item", "qty"), ("mug", 2)], "json")) == [{"item": "mug", "qty": 2}]` },
        ],
        explain: py`You added a feature without touching \`Exporter\` or \`export()\`: defining the class *was* the registration. That's why plugin systems love \`__init_subclass__\` — new behaviour arrives by adding code, not by editing a central list.`,
      },
      {
        id: 'duplicate-format',
        task: py`Prove the duplicate check works. At the end, define another class registered for \`fmt="csv"\` (with an \`export\` method) inside \`try:\`, catch the \`TypeError\` and print it with \`print("refused:", err)\`.`,
        hint: py`Copy the \`XmlExporter\` block, rename the class, give it \`fmt="csv"\` and a one-line \`export\` method.`,
        tests: [
          { name: 'the duplicate was refused', code: py`assert "already handled by CsvExporter" in output, 'Print the TypeError raised for the duplicate "csv" class'` },
          { name: 'the original csv exporter is still registered', code: py`assert Exporter.registry["csv"] is CsvExporter` },
        ],
        explain: py`The check runs before the class is registered, so the original \`CsvExporter\` keeps its slot. Failing loudly at definition time beats discovering at runtime that one plugin silently replaced another.`,
      },
      {
        id: 'no-class-statement',
        task: py`Create \`TsvExporter\` **without a \`class\` statement**: write a function \`tsv_export(self, rows)\` that joins values with tabs (\`"\t"\`) and rows with newlines, then call \`type(...)\` with a name, a bases tuple, a namespace dict and the class keyword \`fmt="tsv"\`.`,
        hint: py`\`TsvExporter = type("TsvExporter", (Exporter,), {"export": tsv_export}, fmt="tsv")\` — the keyword goes to \`__init_subclass__\` exactly like \`fmt=\` in a class line.`,
        tests: [
          { name: 'tsv is registered', code: py`assert "tsv" in Exporter.registry, 'Pass fmt="tsv" to type(...)'` },
          { name: 'exports tab-separated text', code: py`assert export([("a", "b"), (1, 2)], "tsv") == "a\tb\n1\t2"` },
          { name: 'no class statement was used for it', code: py`assert "class TsvExporter" not in files["main.py"], 'Build TsvExporter with type(...), not a class statement'` },
        ],
        explain: py`A class statement is mostly syntax for \`type(name, bases, namespace, **keywords)\`: the same metaclass, the same \`__init_subclass__\`, the same registry. Dynamic class creation is how tools build classes from configuration or schemas.`,
      },
      {
        id: 'inherited-hook',
        task: py`Subclass an exporter: \`class SemicolonExporter(CsvExporter, fmt="ssv")\` whose \`export\` joins values with \`";"\` instead of \`","\`. Check that it registers too — even though its direct parent is \`CsvExporter\`, not \`Exporter\`.`,
        hint: py`Copy \`CsvExporter.export\` and change the separator. \`__init_subclass__\` is inherited, so \`Exporter\`'s hook still runs for grandchildren.`,
        tests: [
          { name: 'SemicolonExporter is registered as ssv', code: py`assert ns.get("SemicolonExporter") is not None, "Define SemicolonExporter"
assert Exporter.registry.get("ssv") is SemicolonExporter` },
          { name: 'it uses semicolons', code: py`assert export([("a", "b"), (1, 2)], "ssv") == "a;b\n1;2"` },
          { name: 'it really is a CsvExporter subclass', code: py`assert issubclass(SemicolonExporter, CsvExporter)` },
        ],
        explain: py`\`__init_subclass__\` is looked up through the MRO like any method, so it fires for every descendant. A class decorator on \`CsvExporter\` would **not** do that — decorators affect only the class they're written on.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The life of a class statement',
    props: {
      width: 760,
      height: 350,
      nodes: [
        { id: 'stmt', label: 'class statement', note: 'class Plugin(Base, fmt="csv"):', x: 95, y: 60, tone: 'yellow' },
        { id: 'meta', label: 'pick the metaclass', note: 'metaclass= or type(Base)', x: 285, y: 60 },
        { id: 'prepare', label: '__prepare__', note: 'returns the namespace', x: 475, y: 60 },
        { id: 'body', label: 'run the body', note: 'fills the namespace', x: 665, y: 60, tone: 'blue' },
        { id: 'new', label: 'Meta.__new__', note: 'calls type.__new__', x: 665, y: 185, tone: 'red' },
        { id: 'setname', label: '__set_name__', note: 'on each descriptor', x: 475, y: 185 },
        { id: 'initsub', label: '__init_subclass__', note: 'on the parent', x: 285, y: 185 },
        { id: 'init', label: 'Meta.__init__', note: 'the class is finished', x: 95, y: 185, tone: 'red' },
        { id: 'deco', label: 'class decorators', note: 'applied bottom-up', x: 95, y: 300, tone: 'kraft' },
        { id: 'bind', label: 'Plugin = …', note: 'the name is bound', x: 285, y: 300, tone: 'ink' },
      ],
      edges: [
        { from: 'stmt', to: 'meta' },
        { from: 'meta', to: 'prepare' },
        { from: 'prepare', to: 'body' },
        { from: 'body', to: 'new', label: 'name, bases, namespace' },
        { from: 'new', to: 'setname' },
        { from: 'setname', to: 'initsub' },
        { from: 'initsub', to: 'init' },
        { from: 'init', to: 'deco' },
        { from: 'deco', to: 'bind' },
      ],
      steps: [
        { focus: ['stmt'], text: py`Python meets \`class Plugin(Base, fmt="csv"):\`. It evaluates the bases (\`Base\`) and collects the keywords (\`fmt="csv"\`) — but the body hasn't run yet.` },
        { focus: ['meta'], edges: ['stmt->meta'], text: py`**Pick the metaclass**: an explicit \`metaclass=\` keyword, otherwise the metaclass of the bases (normally \`type\`). If two bases have unrelated metaclasses, Python raises \`TypeError: metaclass conflict\`.` },
        { focus: ['prepare'], edges: ['meta->prepare'], text: py`**Prepare the namespace**: \`Meta.__prepare__("Plugin", (Base,), fmt="csv")\` returns the mapping the body will run in — a plain \`dict\` by default. \`enum\` uses this step to watch every assignment in the body.` },
        { focus: ['body'], edges: ['prepare->body'], text: py`**Run the body** once, top to bottom, inside that namespace. Every \`def\` and assignment adds a key. The compiler also adds bookkeeping names such as \`__module__\` and \`__qualname__\`.` },
        { focus: ['new'], edges: ['body->new'], text: py`**Build the class**: Python calls \`Meta("Plugin", (Base,), namespace, fmt="csv")\`. Calling a class runs \`type.__call__\`, which calls \`Meta.__new__\` — and that must call \`type.__new__\` to create the real class object.` },
        { focus: ['setname'], edges: ['new->setname'], text: py`**Inside \`type.__new__\`**: every namespace value with a \`__set_name__\` method is told its owner and name — this is how [descriptors](lesson:descriptors) like \`price = Positive()\` learn they're called \`price\`.` },
        { focus: ['initsub'], edges: ['setname->initsub'], text: py`**Still inside \`type.__new__\`**: the parent's \`__init_subclass__(**kwargs)\` runs with the new class and the class keywords (\`fmt="csv"\`). Registries and validation usually live here.` },
        { focus: ['init'], edges: ['initsub->init'], text: py`Back in the metaclass: \`Meta.__new__\` returns the class and \`Meta.__init__\` runs on it. Most custom metaclasses only need one of the two.` },
        { focus: ['deco'], edges: ['init->deco'], text: py`**Class decorators** run on the finished class, bottom-up, and their return value replaces it — the hook [dataclasses](lesson:dataclasses) uses.` },
        { focus: ['bind'], edges: ['deco->bind'], text: py`Finally the name \`Plugin\` is bound in the surrounding namespace. If any step raised, the name is never bound.` },
      ],
    },
    alt: 'A pipeline diagram of a class statement: choose the metaclass, call __prepare__ to get a namespace, run the class body, call Meta.__new__ which calls type.__new__, which in turn calls __set_name__ on descriptors and then the parent’s __init_subclass__, then Meta.__init__ runs, class decorators are applied, and finally the class name is bound.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Three facts make metaclasses click:`,
      py`1. **Everything is an object, including classes.** \`Point\` is an object you can store, pass around and inspect ([everything is an object](lesson:object-model)).
2. **Every object has a type.** \`type(3)\` is \`int\`; \`type(Point)\` is \`type\`. So \`type\` is "the class of classes" — a metaclass.
3. **A class statement is a call.** Python gathers a name, the bases and the body's names into a dict, and calls the metaclass with them. \`type("Point", (), {"x": 0})\` does the same thing by hand.`,
      { code: py`def make_greeter(greeting):
    """Classes are created at runtime, so a function can build one."""
    def greet(self, name):
        return f"{greeting}, {name}!"
    return type("Greeter", (), {"greet": greet})


Hello = make_greeter("Hello")
Hola = make_greeter("Hola")
print(Hello().greet("Ada"), Hola().greet("Ada"))   # Hello, Ada! Hola, Ada!
print(Hello is Hola)                                # False — two separate classes`, lang: 'python', title: 'classes are made at runtime' },
      py`Because classes are made by running code, you can hook into that moment — and that's all \`__init_subclass__\` and metaclasses are.`,
    ],
    technical: [
      py`**The class statement, step by step.** CPython compiles a class statement into a call of the built-in \`__build_class__\`, which does what the [data model](https://docs.python.org/3/reference/datamodel.html#customizing-class-creation) describes. The \`types\` module exposes the same steps, so a class statement can be written out (**simplified**: the compiler also adds \`__module__\`, \`__qualname__\` and other bookkeeping names):`,
      { code: py`import types


class Base:
    def __init_subclass__(cls, /, tag="none", **kwargs):
        super().__init_subclass__(**kwargs)
        cls.tag = tag


# class Plugin(Base, tag="beta"):
#     version = 1
# is roughly:
meta, namespace, kwds = types.prepare_class("Plugin", (Base,), {"tag": "beta"})
namespace["version"] = 1                              # what running the body does
Plugin = meta("Plugin", (Base,), namespace, **kwds)   # type.__call__ -> __new__, __init__
print(Plugin.version, Plugin.tag, type(Plugin))       # 1 beta <class 'type'>`, lang: 'python', title: 'a class statement, written out' },
      py`**Choosing the metaclass.** Python takes the explicit \`metaclass=\` (or \`type\`) and the metaclass of every base, and picks the **most derived** one — the one that is a subclass of all the others. If none is, you get \`TypeError: metaclass conflict: the metaclass of a derived class must be a (non-strict) subclass of the metaclasses of all its bases\`. That's why mixing \`abc.ABC\` (metaclass \`ABCMeta\`) with \`enum.Enum\` (metaclass \`EnumType\`) fails, and why a library that ships a metaclass forces every user who mixes in another one to write a combined metaclass.`,
      py`**Metaclass \`__new__\` vs \`__init__\` vs \`__call__\`.** A metaclass is a class whose instances are classes, so the usual rules apply one level up: \`Meta(name, bases, ns)\` runs \`type.__call__\`, which calls \`Meta.__new__\` then \`Meta.__init__\`. Use \`__new__\` when you need to change the namespace or bases *before* the class exists; \`__init__\` when you only inspect or register the finished class. And \`Meta.__call__\` runs whenever the **class** is called — \`User(...)\` — so overriding it intercepts instance creation for the whole hierarchy (singletons, caches, instance registries).`,
      py`**Metaclass methods and attributes belong to the class, not its instances.** Lookup on a class (\`type.__getattribute__\`) also searches the metaclass, so \`Exporter.registry\` in the playground's metaclass variant finds \`ExporterMeta.registry\`. Instances never see metaclass attributes. Special methods on the metaclass make operators work **on the class itself**:`,
      { code: py`class Countable(type):
    def __len__(cls):
        return len(cls.items)

    def describe(cls):
        return f"{cls.__name__} with {len(cls)} items"


class Menu(metaclass=Countable):
    items = ["tea", "toast"]


print(len(Menu))                     # 2 — len() of a CLASS, via the metaclass
print(Menu.describe())               # Menu with 2 items
print(hasattr(Menu(), "describe"))   # False — instances don't see metaclass methods`, lang: 'python', title: 'metaclass methods act on classes' },
      py`That is exactly how the standard library's metaclasses work: \`enum.EnumType\` gives enum *classes* \`len()\`, iteration, \`in\` and \`Color["RED"]\`, and uses a custom \`__prepare__\` mapping to turn body assignments into members ([enums](lesson:enums)). \`abc.ABCMeta\` records abstract methods when the class is built and implements \`__instancecheck__\`/\`__subclasscheck__\`, which is how \`isinstance(x, Iterable)\` can be \`True\` without inheritance ([abstract base classes](lesson:abstract-base-classes)).`,
      py`**\`__classcell__\` and zero-argument \`super()\`.** When a method uses \`super()\` or \`__class__\`, the compiler puts a \`__classcell__\` entry in the namespace; \`type.__new__\` fills it with the new class. A metaclass that builds a *fresh* namespace dict and drops that entry breaks every \`super()\` call: \`RuntimeError: __class__ not set defining 'W' as <class '__main__.W'>. Was __classcell__ propagated to type.__new__?\` Modify the namespace you were given, or copy all its keys.`,
      { callout: 'version', title: 'Python 3.14: annotations in the class namespace', text: py`With deferred evaluation of annotations (PEP 649/749, 3.14), the class body no longer stores an \`__annotations__\` dict in the namespace; it stores an annotate function instead (under a private key — in this runtime, \`__annotate_func__\`). Metaclass code that does \`namespace["__annotations__"]\` now raises \`KeyError\`. Create the class first and read \`inspect.get_annotations(cls)\` (3.10+; an alias of \`annotationlib.get_annotations\` in 3.14), or, if you must work on the raw namespace, use \`annotationlib.get_annotate_from_class_namespace(namespace)\` (3.14+).` },
      { callout: 'note', title: 'CPython detail', text: py`\`type\` and \`type.__new__\` are implemented in C, and \`type(type) is type\` is wired up when the interpreter starts — you couldn't build that loop in Python. The class statement becomes a \`LOAD_BUILD_CLASS\` instruction that calls \`builtins.__build_class__\` (look with \`dis.dis\`, see [bytecode](lesson:bytecode)). In 3.13+ the compiler also adds \`__firstlineno__\` and \`__static_attributes__\` to the namespace. Other implementations follow the same documented protocol but may differ in these details.` },
    ],
    production: [
      py`**The ladder of tools.** Climb only as high as you need:`,
      py`1. **Plain code** — a function or an explicit \`register(cls)\` call. Boring and obvious is good.
2. **A class decorator** — modify or register *one* class after it's built (\`@dataclass\`, \`@app.route\`-style registries). Not inherited by subclasses.
3. **\`__init_subclass__\` + \`__set_name__\`** — react to *every* subclass, validate it, accept class keywords, let descriptors learn their names. No metaclass conflicts, readable, cooperative with \`super()\`.
4. **A metaclass** — only when you must (a) customise the namespace with \`__prepare__\`, (b) give the *class object* behaviour (\`len(Cls)\`, \`iter(Cls)\`, \`Cls[...]\` beyond \`__class_getitem__\`, \`isinstance\` hooks), (c) intercept every \`Cls(...)\` call with \`__call__\`, or (d) change bases or the namespace before \`type.__new__\` runs.`,
      py`**Metaclasses in the wild.** \`ABCMeta\`, \`EnumType\` and \`typing.Protocol\`'s metaclass in the standard library; Django's \`ModelBase\` turns model class bodies into database mappings. Notice what's *not* a metaclass: \`dataclasses\` is a decorator, and much plugin code written today uses \`__init_subclass__\`. Since PEP 487 (3.6), many uses that once needed metaclasses no longer do.`,
      py`**Registries only see imported code.** \`__init_subclass__\` runs when the class statement runs — so a plugin in a module nobody imports never registers. Import plugin modules explicitly (e.g. in the package's \`__init__.py\`), or for third-party plugins use packaging *entry points* (\`importlib.metadata.entry_points\`) — see [modules & imports](lesson:modules-and-imports) and [packaging](lesson:packaging).`,
      py`**Registries are global state.** Tests that define throwaway subclasses pollute them (and may trip duplicate checks on re-runs). Give the registry a reset/unregister function for tests, or make it an explicit object passed around instead of a class attribute.`,
      py`**Type checkers.** Static checkers understand \`__init_subclass__\` keywords, and for libraries that generate dataclass-like classes from a base class, decorator or metaclass, \`typing.dataclass_transform\` (3.11+, [PEP 681](https://peps.python.org/pep-0681/)) tells them which \`__init__\` to expect. Heavily metaclass-driven APIs are otherwise hard for checkers and IDEs to follow — another reason to prefer simpler hooks ([static type checking](lesson:static-type-checking)).`,
      py`**Cost.** Class creation runs once, at import, so hooks there are essentially free at runtime. A metaclass \`__call__\` override, however, runs on **every** instantiation — measure ([profiling](lesson:profiling)) before putting logic there in hot paths.`,
    ],
  },
  mistakes: [
    {
      title: 'Writing a metaclass for a job __init_subclass__ does',
      wrong: { code: py`class PluginMeta(type):
    registry = {}

    def __init__(cls, name, bases, namespace):
        super().__init__(name, bases, namespace)
        if bases:                               # skip the base class itself
            PluginMeta.registry[name.lower()] = cls


class Plugin(metaclass=PluginMeta):
    pass`, lang: 'python' },
      right: { code: py`class Plugin:
    registry = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Plugin.registry[cls.__name__.lower()] = cls`, lang: 'python' },
      explanation: py`Both register every subclass. The \`__init_subclass__\` version is shorter, needs no "skip the base" trick, and can't cause a \`metaclass conflict\` when someone combines \`Plugin\` with \`ABC\`, \`Enum\` or another library's base class.`,
    },
    {
      title: 'Forgetting to return the class from a metaclass __new__',
      wrong: { code: py`class Registry(type):
    classes = []

    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        Registry.classes.append(cls)          # ...and returns None


class Model(metaclass=Registry):
    pass

print(Model)   # None`, lang: 'python' },
      right: { code: py`class Registry(type):
    classes = []

    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        Registry.classes.append(cls)
        return cls`, lang: 'python' },
      explanation: py`Whatever the metaclass call returns is bound to the class name. Without \`return cls\`, \`Model\` is \`None\` and the first \`Model()\` fails with \`TypeError: 'NoneType' object is not callable\`. The same applies to class decorators.`,
    },
    {
      title: 'Not consuming or not forwarding class keywords',
      wrong: { code: py`class Plugin:
    registry = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)        # forwards name=... to object
        Plugin.registry[kwargs["name"]] = cls


class CsvPlugin(Plugin, name="csv"):   # TypeError: CsvPlugin.__init_subclass__() takes no keyword arguments
    pass`, lang: 'python', static: true },
      right: { code: py`class Plugin:
    registry = {}

    def __init_subclass__(cls, /, name, **kwargs):  # consume name...
        super().__init_subclass__(**kwargs)        # ...forward the rest
        Plugin.registry[name] = cls


class CsvPlugin(Plugin, name="csv"):
    pass`, lang: 'python' },
      explanation: py`\`object.__init_subclass__\` accepts no keywords, so any keyword that reaches it is an error. Take your own keywords as named parameters and forward only the leftovers. Skipping the \`super()\` call altogether is the opposite bug: in multiple inheritance, other bases' \`__init_subclass__\` hooks silently stop running.`,
    },
    {
      title: 'Expecting a class decorator to cover subclasses',
      wrong: { code: py`REGISTRY = {}

def register(cls):
    REGISTRY[cls.__name__] = cls
    return cls


@register
class Exporter:
    pass


class CsvExporter(Exporter):    # not registered: the decorator only saw Exporter
    pass`, lang: 'python' },
      right: { code: py`REGISTRY = {}


class Exporter:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        REGISTRY[cls.__name__] = cls


class CsvExporter(Exporter):    # registered automatically
    pass`, lang: 'python' },
      explanation: py`A decorator is a one-time function call on one class; it isn't inherited. \`__init_subclass__\` is a method, found through the MRO, so it runs for every descendant.`,
    },
    {
      title: 'Rebuilding the namespace and losing __classcell__',
      wrong: { code: py`class Lowercase(type):
    def __new__(mcls, name, bases, namespace):
        clean = {k: v for k, v in namespace.items() if not k.startswith("__")}
        return super().__new__(mcls, name, bases, clean)   # drops __module__, __classcell__...`, lang: 'python' },
      right: { code: py`class Lowercase(type):
    def __new__(mcls, name, bases, namespace):
        clean = dict(namespace)                    # keep every bookkeeping entry
        for key in [k for k in namespace if not k.startswith("_")]:
            clean[key.lower()] = clean.pop(key)
        return super().__new__(mcls, name, bases, clean)`, lang: 'python' },
      explanation: py`The namespace contains entries the interpreter needs: \`__module__\`, \`__qualname__\` and, when a method uses \`super()\`, \`__classcell__\`. Dropping it causes \`RuntimeError: __class__ not set defining ...\`. Transform a copy that keeps everything you don't deliberately change.`,
    },
    {
      title: 'Reading __annotations__ from the namespace (3.14)',
      wrong: { code: py`class FieldsMeta(type):
    def __new__(mcls, name, bases, namespace):
        fields = tuple(namespace["__annotations__"])   # KeyError on 3.14
        cls = super().__new__(mcls, name, bases, namespace)
        cls.field_names = fields
        return cls`, lang: 'python' },
      right: { code: py`import inspect


class FieldsMeta(type):
    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        cls.field_names = tuple(inspect.get_annotations(cls))   # works on 3.10+
        return cls`, lang: 'python' },
      explanation: py`Python 3.14 evaluates annotations lazily (PEP 649/749), so the class body stores an annotate function rather than an \`__annotations__\` dict. Build the class, then ask for its annotations through \`inspect.get_annotations\` / \`annotationlib.get_annotations\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: metaclass conflict: the metaclass of a derived class must be a (non-strict) subclass of the metaclasses of all its bases`,
      cause: py`Two bases have unrelated metaclasses — e.g. \`class Exporter(ABC, metaclass=PluginMeta)\`, or mixing \`Enum\` with \`ABC\`.`,
      fix: py`Replace your metaclass with \`__init_subclass__\` if you can. Otherwise define a combined metaclass, \`class PluginABCMeta(PluginMeta, ABCMeta): pass\`, and use it explicitly.`,
    },
    {
      symptom: py`TypeError: CsvPlugin.__init_subclass__() takes no keyword arguments`,
      cause: py`A class keyword (\`name="csv"\`) reached \`object.__init_subclass__\`: the base doesn't define \`__init_subclass__\`, or it forwards the keyword instead of consuming it.`,
      fix: py`Declare the keyword as a parameter — \`def __init_subclass__(cls, /, name, **kwargs)\` — and forward only \`**kwargs\`.`,
    },
    {
      symptom: py`TypeError: Plugin.__init_subclass__() missing 1 required positional argument: 'fmt'`,
      cause: py`A subclass was defined without the required class keyword (\`class X(Plugin):\`). Intermediate abstract subclasses hit this too.`,
      fix: py`Pass the keyword (\`class X(Plugin, fmt="x")\`), or give it a default such as \`fmt=None\` and skip registration when it's \`None\`.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not callable (when instantiating a class)`,
      cause: py`A metaclass \`__new__\` or a class decorator didn't \`return\` the class, so the class name is bound to \`None\`.`,
      fix: py`End metaclass \`__new__\` with \`return cls\` and every class decorator with \`return cls\`.`,
    },
    {
      symptom: py`RuntimeError: __class__ not set defining 'W' as <class '__main__.W'>. Was __classcell__ propagated to type.__new__?`,
      cause: py`A metaclass passed \`type.__new__\` a new namespace dict without the \`__classcell__\` entry; methods that use zero-argument \`super()\` need it.`,
      fix: py`Pass the original namespace (modified in place) or a copy that keeps all keys.`,
    },
    {
      symptom: py`KeyError: '__annotations__' (inside a metaclass, on Python 3.14)`,
      cause: py`Annotations are evaluated lazily in 3.14; the namespace holds an annotate function, not an \`__annotations__\` dict.`,
      fix: py`Create the class first, then use \`inspect.get_annotations(cls)\` (or \`annotationlib.get_annotations\`).`,
    },
    {
      symptom: py`ValueError: no exporter for 'pdf' — but PdfExporter exists in plugins/pdf.py`,
      cause: py`Registration happens when the class statement runs; the module defining the plugin was never imported.`,
      fix: py`Import plugin modules explicitly at start-up (or via entry points for installable plugins), then look them up.`,
    },
  ],
  bestPractices: [
    'Climb the ladder: plain code → class decorator → __init_subclass__ (+ __set_name__) → metaclass, stopping at the first tool that works.',
    'In __init_subclass__, take your class keywords as named parameters (after cls, /) and forward the rest with super().__init_subclass__(**kwargs).',
    'Validate subclasses at definition time (missing methods, duplicate names) so mistakes fail at import, not in production.',
    'If you write a metaclass: inherit from type, call super() in every hook, always return the class from __new__, and keep the namespace’s bookkeeping entries.',
    'Avoid shipping a metaclass in a library unless it is essential — it forces users into metaclass conflicts with ABC, Enum or Protocol.',
    'Make registries easy to inspect and reset (for tests), and import plugin modules explicitly so they register.',
    'Read annotations from the finished class with inspect.get_annotations(cls), not from the namespace (3.14 changed it).',
    'Prefer type(name, bases, ns, **kw) or types.new_class for dynamic classes over exec-ing generated source code.',
  ],
  useCases: [
    'Plugin registries: exporters, commands, parsers or payment providers that register by subclassing (__init_subclass__).',
    'Validating subclasses when they are defined: required methods, naming rules, unique keys.',
    'Declarative models: ORMs and serializers that turn class bodies into schemas (descriptors + __init_subclass__, or a metaclass).',
    'Class-level behaviour: enum-like classes with len()/iteration, abstract base classes with isinstance hooks (metaclasses).',
    'Building classes dynamically from data or configuration with type() or types.new_class.',
  ],
  whenToUse: {
    use: [
      '__init_subclass__ — every subclass must be registered, validated or configured with class keywords.',
      'A metaclass — the namespace itself must be customised (__prepare__), e.g. to detect duplicate names or capture order.',
      'A metaclass — the class object must support operators or iteration (len(Cls), iter(Cls), "x" in Cls) or custom isinstance/issubclass checks.',
      'A metaclass — every Cls(...) call in a hierarchy must be intercepted (__call__), and you have ruled out a factory function.',
    ],
    avoid: [
      'Registration or validation of subclasses — __init_subclass__ does it without conflicts.',
      'Per-attribute behaviour — descriptors with __set_name__.',
      'Adding methods or boilerplate to one class — a class decorator or @dataclass.',
      'Singletons — a module-level instance or a cached factory function is simpler and easier to test.',
      'Library base classes that users will combine with ABC, Enum, Protocol or other frameworks.',
      'Anything where the main benefit is looking clever — the next reader pays for it.',
    ],
  },
  comparison: {
    title: 'Three ways to customise classes',
    headers: ['', 'class decorator', '__init_subclass__', 'metaclass'],
    rows: [
      ['runs when', 'after the class is fully built', 'inside type.__new__, for each new subclass', 'around the whole creation (before and after type.__new__)'],
      ['affects subclasses', 'no — only the decorated class', 'yes, automatically (it is inherited)', 'yes (the metaclass is inherited)'],
      ['can change the namespace before the class exists', 'no', 'no', 'yes (__prepare__, __new__)'],
      ['can give the class object behaviour (len(Cls), Cls(...) logic)', 'no', 'no', 'yes — methods on the metaclass'],
      ['accepts class keywords', 'no (use decorator arguments)', 'yes', 'yes'],
      ['plays well with other libraries', 'yes — stack decorators', 'yes — cooperative super()', 'risk of metaclass conflicts'],
      ['typical use', '@dataclass, one-off registration', 'plugin registries, subclass validation', 'Enum, ABCMeta, ORMs (framework internals)'],
    ],
    note: py`They compose: a framework might use descriptors for fields, \`__init_subclass__\` to collect them, and a class decorator for optional extras — no metaclass required.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'metaclasses-q1',
      type: 'mcq',
      prompt: 'Given `class Cart: pass`, what is `type(Cart)`?',
      options: [
        { text: 'object', why: 'object is the base class of Cart (issubclass(Cart, object) is True), not its type.' },
        'type',
        { text: 'Cart', why: 'type(Cart()) is Cart. The class itself is an instance of something else.' },
        { text: 'class', why: 'class is a keyword, not an object.' },
      ],
      answer: 1,
      explanation: py`Ordinary classes are instances of \`type\`, the default metaclass. Keep "instance of" (follow \`type()\`) and "subclass of" (follow \`__bases__\`) apart: \`Cart\` is an *instance* of \`type\` and a *subclass* of \`object\`.`,
    },
    {
      id: 'metaclasses-q2',
      type: 'output',
      prompt: 'In what order do the hooks fire? Type the four printed lines.',
      code: py`class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        print("init_subclass", cls.__name__)


class Field:
    def __set_name__(self, owner, name):
        print("set_name", name)


def register(cls):
    print("decorator", cls.__name__)
    return cls


@register
class Plugin(Base):
    print("body")
    size = Field()`,
      answer: 'body\nset_name size\ninit_subclass Plugin\ndecorator Plugin',
      accept: ['body\nset_name size\ninit_subclass Plugin\ndecorator Plugin'],
      explanation: py`The body runs first (and creates the \`Field\`). Then \`type.__new__\` builds the class: it calls \`__set_name__\` on the descriptors, then the parent's \`__init_subclass__\`. The decorator only sees the finished class.`,
    },
    {
      id: 'metaclasses-q3',
      type: 'bug',
      prompt: '`print(Model)` prints `None`. What is the bug?',
      code: py`class Registry(type):
    classes = []

    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        Registry.classes.append(cls)


class Model(metaclass=Registry):
    pass


print(Model)`,
      options: [
        '__new__ never returns the new class, so the class statement binds Model to None',
        { text: 'super().__new__ must not be passed mcls', why: '__new__ is a static method, so mcls must be passed explicitly — that line is correct.' },
        { text: 'classes should be stored on each class, not on the metaclass', why: 'A shared registry on the metaclass is fine; the class was created and appended correctly.' },
        { text: 'a metaclass must also define __init__', why: 'Metaclass __init__ is optional; type.__init__ is used when you leave it out.' },
      ],
      answer: 0,
      explanation: py`The value returned by the metaclass call is what the class name is bound to. Without \`return cls\`, \`Model\` is \`None\` even though the class was built and registered. Add \`return cls\`.`,
    },
    {
      id: 'metaclasses-q4',
      type: 'fill',
      prompt: 'Complete the hook so that `class CsvExporter(Exporter, fmt="csv")` registers the class and other keywords are passed on.',
      code: py`class Exporter:
    registry = {}

    def __init_subclass__(cls, /, ___, **kwargs):
        super().__init_subclass__(___)
        Exporter.registry[fmt] = cls`,
      answer: [['fmt', 'fmt=None'], ['**kwargs']],
      explanation: py`The class keyword \`fmt\` must be a named parameter so it is consumed here; everything else is forwarded with \`**kwargs\`. Forwarding \`fmt\` to \`object.__init_subclass__\` would raise \`TypeError: ... takes no keyword arguments\`.`,
    },
    {
      id: 'metaclasses-q5',
      type: 'mcq',
      prompt: 'Every subclass of `Exporter` — including subclasses of subclasses — must be registered automatically. Which tool is the best fit?',
      options: [
        { text: 'A class decorator on Exporter', why: 'A decorator runs once, on the class it decorates; it is not inherited, so subclasses are not registered.' },
        '__init_subclass__ on Exporter',
        { text: 'A custom metaclass', why: 'It works, but it is heavier, harder to read and can cause metaclass conflicts — __init_subclass__ was added (3.6) precisely for this.' },
        { text: 'A descriptor', why: 'Descriptors customise access to one attribute; they are not told about new subclasses.' },
      ],
      answer: 1,
      explanation: py`\`__init_subclass__\` is inherited and runs for every descendant, accepts class keywords, and avoids metaclass conflicts.`,
    },
    {
      id: 'metaclasses-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`Point = type("Point", (), {"x": 0, "show": lambda self: f"Point at {self.x}"})
p = Point()
p.x = 3
print(type(Point).__name__, Point.__name__, p.show())`,
      options: [
        'type Point Point at 3',
        { text: 'type Point Point at 0', why: 'p.x = 3 creates an instance attribute, which wins over the class attribute x = 0.' },
        { text: 'object Point Point at 3', why: 'type(Point) is the metaclass that created it — type — not its base class.' },
        { text: 'TypeError: lambdas cannot be methods', why: 'Any function in the class namespace becomes a method; lambdas are functions too.' },
      ],
      answer: 0,
      explanation: py`\`type(name, bases, namespace)\` builds a normal class: \`show\` is a function in the namespace, so it binds like any method. \`type(Point)\` is \`type\`.`,
    },
    {
      id: 'metaclasses-q7',
      type: 'short',
      prompt: 'When would you genuinely need a metaclass rather than `__init_subclass__` or a class decorator? Give two situations.',
      answer: py`When the class *object itself* must behave differently — e.g. \`len(Color)\`, iterating over a class, \`"RED" in Color\`, or custom \`isinstance\`/\`issubclass\` checks — because those special methods are looked up on the class's type, i.e. the metaclass. And when you must customise the class *namespace* before the class exists, with \`__prepare__\` (enum detects members and duplicate names this way), or intercept every \`Cls(...)\` call with \`__call__\`. Registration, validation and class keywords don't need one.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'command-registry',
      title: 'Self-registering chat-bot commands',
      difficulty: 'advanced',
      prompt: py`A chat bot has commands such as \`greet\` and \`add\`. Finish \`Command.__init_subclass__\` and \`dispatch\` so that commands register themselves:

- \`__init_subclass__(cls, /, name, **kwargs)\` (already declared) must:
  - raise \`TypeError\` whose message contains \`duplicate command\` if \`name\` is already registered;
  - raise \`TypeError\` whose message contains \`must define run\` if the class has no callable \`run\`;
  - otherwise set \`cls.name = name\` and add \`Command.registry[name] = cls\`.
  Rejected classes must **not** be registered. \`Command\` itself is never registered.
- \`dispatch(line)\` splits the line into words: the first word is the command name, the rest are arguments. Return \`Command.registry[name]().run(*args)\`, or \`"unknown command: <word>"\` if the name isn't registered.

Examples: \`dispatch("greet Ada")\` → \`"Hello, Ada!"\`, \`dispatch("add 2 3 4")\` → \`"9"\`, \`dispatch("dance")\` → \`"unknown command: dance"\`. Subclasses of commands (e.g. \`class Shout(Greet, name="shout")\`) must register too.`,
      files: { 'main.py': COMMANDS_STARTER },
      hints: [
        'Everything happens in __init_subclass__, which Python calls with each new subclass as cls and the class keyword as name.',
        'Check in this order: name in Command.registry → TypeError; not callable(getattr(cls, "run", None)) → TypeError; only then cls.name = name and Command.registry[name] = cls.',
        'dispatch: word, *args = line.split(); command_class = Command.registry.get(word); return f"unknown command: {word}" if it is None, else command_class().run(*args).',
      ],
      solution: {
        explanation: py`Python calls \`Command.__init_subclass__\` while each subclass is being created, passing the new class as \`cls\` and the class keyword as \`name\`. Checking for duplicates and for \`run\` **before** registering means a rejected class never lands in the registry, and the error appears at definition (import) time. \`super().__init_subclass__(**kwargs)\` keeps the hook cooperative with other base classes. Because the hook is inherited, \`class Shout(Greet, name="shout")\` registers too — a class decorator could not do that. \`dispatch\` is the lookup half: a dict from names to classes, instantiated on demand.`,
        files: { 'main.py': COMMANDS_SOLUTION },
      },
      tests: [
        { name: 'subclasses register themselves (and Command does not)', code: py`assert Command.registry == {"greet": Greet, "add": Add}` },
        { name: 'each class knows its name', code: py`assert Greet.name == "greet" and Add.name == "add"` },
        { name: 'dispatch runs the right command', code: py`assert dispatch("greet Ada") == "Hello, Ada!"
assert dispatch("add 2 3 4") == "9"` },
        { name: 'unknown commands are reported', code: py`assert dispatch("dance") == "unknown command: dance"` },
        { name: 'duplicate names are rejected', code: py`with raises(TypeError, match="duplicate command"):
    class Hello(Command, name="greet"):
        def run(self, who):
            return "hi"
assert Command.registry["greet"] is Greet` },
        { name: 'run() is required, and rejected classes are not registered', code: py`with raises(TypeError, match="must define run"):
    class Broken(Command, name="broken"):
        pass
assert "broken" not in Command.registry` },
        { name: 'subclasses of commands register too', code: py`class Shout(Greet, name="shout"):
    def run(self, who):
        return super().run(who).upper()
assert Command.registry["shout"] is Shout
assert dispatch("shout ada") == "HELLO, ADA!"` },
      ],
    },
    {
      id: 'constants-metaclass',
      title: 'A metaclass for read-only constants',
      difficulty: 'advanced',
      prompt: py`Some jobs really need a metaclass: here the **class object itself** must refuse assignments and support \`len()\` and iteration. Finish \`ConstantsMeta\` so that:

- \`__new__\` raises \`TypeError\` with the message \`"<Class>.<name>: constants must be UPPER_CASE"\` (e.g. \`Limits.max_users: constants must be UPPER_CASE\`) for any name in the class body that doesn't start with \`_\` and isn't upper-case (\`name.isupper()\`);
- assigning a class attribute (\`Config.TIMEOUT = 5\`, or a new name) raises \`AttributeError("cannot reassign constant Config.TIMEOUT")\`;
- deleting one (\`del Config.RETRIES\`) raises \`AttributeError("cannot delete constant Config.RETRIES")\`;
- iterating the class yields \`(name, value)\` pairs for the class's **own** names that don't start with \`_\`, in definition order, so \`dict(Config)\` works;
- \`len(Config)\` is the number of those constants.

Don't change \`Config\`.`,
      files: { 'main.py': CONSTANTS_STARTER },
      hints: [
        'Special methods for the CLASS (len(Config), iter(Config), Config.X = 1) are looked up on its type — the metaclass. In these methods, the first parameter is the class (cls).',
        'In __new__, loop over namespace (keys in definition order) before calling super().__new__. vars(cls) gives the class’s own namespace for __iter__.',
        '__setattr__/__delattr__: just raise AttributeError(f"cannot reassign constant {cls.__name__}.{name}"). __iter__: for key, value in vars(cls).items(): if not key.startswith("_"): yield key, value. __len__: return sum(1 for _ in cls).',
      ],
      solution: {
        explanation: py`\`Config.TIMEOUT = 5\` calls \`type(Config).__setattr__(Config, "TIMEOUT", 5)\` — the *metaclass's* \`__setattr__\` — just as \`len(Config)\` calls \`type(Config).__len__\` and \`dict(Config)\` iterates via \`type(Config).__iter__\`. That's the one thing only a metaclass can provide: behaviour for the class object itself. Validation in \`__new__\` runs before the class exists, and \`type.__new__\` builds the class from the namespace directly, so the blocking \`__setattr__\` doesn't interfere with creation. Iteration uses \`vars(cls)\`, which preserves definition order and skips dunder bookkeeping (\`__module__\`, \`__qualname__\`, …) thanks to the underscore check. Note that instances aren't frozen — \`Config().TIMEOUT = 1\` sets an *instance* attribute; the metaclass only governs the class. In real code, \`enum.Enum\` or a frozen dataclass instance is often the better choice for constants.`,
        files: { 'main.py': CONSTANTS_SOLUTION },
      },
      tests: [
        { name: 'constants are readable', code: py`assert Config.TIMEOUT == 30 and Config.API_URL == "https://api.example.com"` },
        { name: 'reassigning raises AttributeError and keeps the value', code: py`with raises(AttributeError, match="cannot reassign constant Config.TIMEOUT"):
    Config.TIMEOUT = 5
assert Config.TIMEOUT == 30` },
        { name: 'adding a new name is refused too', code: py`with raises(AttributeError):
    Config.NEW_SETTING = 1
assert not hasattr(Config, "NEW_SETTING")` },
        { name: 'deleting raises AttributeError', code: py`with raises(AttributeError, match="cannot delete constant Config.RETRIES"):
    del Config.RETRIES
assert Config.RETRIES == 3` },
        { name: 'iterating yields (name, value) pairs in order', code: py`assert list(Config) == [("TIMEOUT", 30), ("RETRIES", 3), ("API_URL", "https://api.example.com")]` },
        { name: 'len() counts the constants', code: py`assert len(Config) == 3` },
        { name: 'lower-case names are rejected at class creation', code: py`with raises(TypeError, match="Limits.max_users: constants must be UPPER_CASE"):
    class Limits(metaclass=ConstantsMeta):
        max_users = 10` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'metaclasses-what-is-a-metaclass',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a metaclass, and how does it relate to `type`?',
      answer: 'A metaclass is the class of a class: the object that creates and configures class objects. type is the default metaclass — every ordinary class is an instance of type — and custom metaclasses are subclasses of type that override hooks such as __prepare__, __new__, __init__ or __call__.',
      explanation: py`A class statement gathers the name, bases and namespace and calls the metaclass with them: \`type("Point", (), {"x": 0})\` is the hand-written equivalent. Because a metaclass is just a class whose instances are classes, its methods act on classes: \`Meta.__call__\` runs on \`Cls()\`, \`Meta.__len__\` on \`len(Cls)\`. \`type(type) is type\` closes the loop.`,
      code: { lang: 'python', code: py`class Point:
    pass


print(type(Point))          # <class 'type'>
print(isinstance(Point, type), issubclass(Point, object))   # True True
Dynamic = type("Dynamic", (Point,), {"z": 1})
print(Dynamic.__mro__)      # (<class '__main__.Dynamic'>, <class '__main__.Point'>, <class 'object'>)` },
      whyAsked: 'It checks whether you understand that classes are runtime objects and where class-level behaviour comes from.',
      mistakes: ['Confusing the metaclass with the base class (object)', 'Describing metaclasses as magic without mentioning type', 'Saying you need a metaclass for any class customisation'],
      followUps: ['What does type(name, bases, namespace) do?', 'What happens, step by step, when a class statement runs?', 'When would you use __init_subclass__ instead?'],
      modelAnswer: 'A metaclass is the class of a class — the thing that builds class objects. In Python every class is an object, and by default it is an instance of type; that is why type(SomeClass) returns type. When a class statement runs, Python collects the name, the bases and the namespace produced by the body, and calls the metaclass with them, so type("Point", (), {"x": 0}) is the manual version. A custom metaclass is just a subclass of type that overrides hooks like __new__, __init__, __prepare__ or __call__. In practice I reach for __init_subclass__ or a class decorator first, and only use a metaclass when the class object itself needs special behaviour.',
    },
    {
      id: 'metaclasses-creation-order',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What does this print, and why in that order?',
      code: { lang: 'python', code: py`class Meta(type):
    def __new__(mcls, name, bases, ns):
        print("meta new", name)
        return super().__new__(mcls, name, bases, ns)

    def __init__(cls, name, bases, ns):
        print("meta init", name)
        super().__init__(name, bases, ns)


class Base(metaclass=Meta):
    def __init_subclass__(cls):
        print("init_subclass", cls.__name__)


class Field:
    def __set_name__(self, owner, name):
        print("set_name", name)


class Plugin(Base):
    size = Field()` },
      options: [
        'meta new Base / meta init Base / meta new Plugin / set_name size / init_subclass Plugin / meta init Plugin',
        'meta new Base / meta init Base / init_subclass Plugin / set_name size / meta new Plugin / meta init Plugin',
        'meta new Base / meta init Base / meta new Plugin / meta init Plugin / set_name size / init_subclass Plugin',
        'meta new Base / init_subclass Base / meta init Base / meta new Plugin / set_name size / meta init Plugin',
      ],
      correctOption: 0,
      answer: 'meta new Base, meta init Base, meta new Plugin, set_name size, init_subclass Plugin, meta init Plugin. __set_name__ and __init_subclass__ are both called inside type.__new__ (reached through super().__new__ in Meta.__new__), and Meta.__init__ runs after __new__ returns. Base itself gets no __init_subclass__ call.',
      explanation: py`Creating \`Base\`: \`Meta.__new__\` then \`Meta.__init__\`; \`object.__init_subclass__\` is silent. Creating \`Plugin\`: \`Meta.__new__\` prints first, then its \`super().__new__\` call enters \`type.__new__\`, which builds the class, runs \`__set_name__\` on \`size\`, then calls the parent's \`__init_subclass__\`. Only after \`__new__\` returns does \`Meta.__init__\` run.`,
      whyAsked: 'Ordering questions reveal whether you know the class-creation protocol rather than just the hook names.',
      mistakes: ['Putting __init_subclass__ after Meta.__init__', 'Expecting __init_subclass__ to run for Base itself', 'Thinking __set_name__ runs when the Field object is created'],
      followUps: ['Where would a class decorator run in this sequence?', 'What does __prepare__ add to the front of the sequence?', 'Why might a framework prefer Meta.__init__ over Meta.__new__?'],
      modelAnswer: 'It prints meta new and meta init for Base, then meta new Plugin, set_name size, init_subclass Plugin and meta init Plugin. The key is that type.__new__ does more than allocate the class: after creating it, it calls __set_name__ on every descriptor in the namespace and then the parent class’s __init_subclass__. Meta.__new__ reaches type.__new__ through super(), so those two hooks fire in the middle of Meta.__new__, and Meta.__init__ runs only after __new__ returns. Base itself doesn’t trigger __init_subclass__, because that hook belongs to the parent of the class being created.',
    },
    {
      id: 'metaclasses-dynamic-record-factory',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement `make_record(name, field_names)` that builds and returns a new class with `type()` (no class statement). Instances take exactly one positional value per field (else `TypeError`), store them as attributes, have `repr` like `Point(x=1, y=2)`, compare equal when they are the same record class with equal values, and the class has a `fields` attribute holding the field names as a tuple.',
      answer: 'Define __init__, __repr__ and __eq__ as closures over name and the fields tuple, then return type(name, (), {"fields": fields, "__init__": __init__, "__repr__": __repr__, "__eq__": __eq__}).',
      explanation: py`Functions placed in the namespace become methods, exactly as in a class body. Closures capture \`name\` and \`fields\` per call, so each generated class is independent. \`__eq__\` returns \`NotImplemented\` for other types so Python can try the reflected comparison. Defining \`__eq__\` sets \`__hash__\` to \`None\` — fine for a mutable record. This is the core idea behind \`collections.namedtuple\` and \`dataclasses.make_dataclass\`.`,
      starter: { files: { 'main.py': RECORD_STARTER } },
      tests: [
        { name: 'returns a class with the given name', code: py`P = make_record("Point", ["x", "y"])
assert isinstance(P, type) and P.__name__ == "Point"` },
        { name: 'stores values as attributes', code: py`p = make_record("Point", ["x", "y"])(1, 2)
assert (p.x, p.y) == (1, 2)` },
        { name: 'repr shows the fields', code: py`P = make_record("Point", ["x", "y"])
assert repr(P(1, 2)) == "Point(x=1, y=2)"
assert repr(make_record("User", ["name"])("Ada")) == "User(name='Ada')"` },
        { name: 'equality compares values', code: py`P = make_record("Point", ["x", "y"])
assert P(1, 2) == P(1, 2) and P(1, 2) != P(2, 1)` },
        { name: 'the wrong number of values raises TypeError', code: py`P = make_record("Point", ["x", "y"])
with raises(TypeError):
    P(1)` },
        { name: 'fields is a tuple, and classes are independent', code: py`P = make_record("Point", ["x", "y"])
Q = make_record("Pair", ["a", "b"])
assert P.fields == ("x", "y") and Q.fields == ("a", "b")` },
      ],
      solution: { files: { 'main.py': RECORD_SOLUTION } },
      hints: ['type(name, bases, namespace): bases can be an empty tuple.', 'Define the methods as nested functions so they can use name and fields.', 'In __init__, zip(fields, values) and setattr(self, field, value).'],
      whyAsked: 'It tests whether you really understand that a class statement is a call to the metaclass and that functions in a namespace become methods.',
      mistakes: ['Using exec on generated source code', 'Sharing one mutable fields list between generated classes', 'Returning False instead of NotImplemented from __eq__ for foreign types'],
      followUps: ['How does collections.namedtuple do this?', 'How would you make the records immutable?', 'What would types.new_class add over type()?'],
      modelAnswer: 'A class statement is really a call to type with a name, a tuple of bases and a namespace dict, so I build that dict myself. Inside make_record I convert the field names to a tuple and define __init__, __repr__ and __eq__ as nested functions that close over name and fields. __init__ checks the count and sets each attribute, __repr__ formats name(field=value), and __eq__ returns NotImplemented for other types. Then I return type(name, (), namespace). It is the same idea behind namedtuple and dataclasses.make_dataclass, and it avoids exec-ing generated source.',
    },
    {
      id: 'metaclasses-conflict',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'Your library\'s `Plugin` base uses `metaclass=PluginMeta`. A user writes `class Exporter(Plugin, ABC):` and gets `TypeError: metaclass conflict: the metaclass of a derived class must be a (non-strict) subclass of the metaclasses of all its bases`. Explain the error and give two fixes.',
      answer: 'A class has exactly one metaclass, and it must be a subclass of every base\'s metaclass. PluginMeta and ABCMeta are unrelated, so Python cannot pick one. Fix 1: replace PluginMeta with __init_subclass__ on Plugin (no metaclass, no conflict). Fix 2: define a combined metaclass, class PluginABCMeta(PluginMeta, ABCMeta), and use it explicitly.',
      explanation: py`Python resolves the metaclass by picking the most derived one among the explicit \`metaclass=\` and the metaclasses of all bases. With \`PluginMeta\` and \`ABCMeta\` neither derives from the other. A combined metaclass works if both cooperate via \`super()\`, but every user who mixes in another metaclass (Enum, Protocol, a framework base) hits the same wall. That's the strongest argument for \`__init_subclass__\` in libraries.`,
      code: { lang: 'python', code: py`from abc import ABC, ABCMeta, abstractmethod


class PluginMeta(type):
    pass


class PluginABCMeta(PluginMeta, ABCMeta):   # a subclass of both metaclasses
    pass


class Exporter(ABC, metaclass=PluginABCMeta):
    @abstractmethod
    def export(self, rows): ...


print([m.__name__ for m in PluginABCMeta.__mro__])
# ['PluginABCMeta', 'PluginMeta', 'ABCMeta', 'type', 'object']` },
      whyAsked: 'Metaclass conflicts are the most common real-world metaclass failure, and the fix shows judgement about API design.',
      mistakes: ['Suggesting to drop ABC without understanding why', 'Writing a combined metaclass whose hooks do not call super()', 'Not mentioning __init_subclass__ as the root-cause fix'],
      followUps: ['How does Python choose the metaclass of a class with several bases?', 'Why does Enum + ABC fail the same way?', 'What breaks if the combined metaclass\'s __new__ skips super()?'],
      modelAnswer: 'Every class has exactly one metaclass, and Python requires it to be a subclass of the metaclasses of all the bases. Plugin brings PluginMeta and ABC brings ABCMeta; neither inherits from the other, so Python refuses to guess and raises the conflict. The quick fix is a combined metaclass, class PluginABCMeta(PluginMeta, ABCMeta), as long as both cooperate through super(). The better fix, since it is our library, is to drop the metaclass and move the logic into Plugin.__init_subclass__, which never conflicts with anyone else\'s metaclass.',
    },
    {
      id: 'metaclasses-singleton',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate proposes a `SingletonMeta` metaclass so that `Settings()` always returns the same object. How does it work, and what would you suggest instead?',
      answer: 'The metaclass overrides __call__, which runs on Settings(); it creates the instance once via super().__call__ and returns the cached one afterwards. It works, but it hides global state behind a constructor, makes tests share state, and adds a metaclass to the hierarchy. Prefer a module-level instance (settings = Settings()) or a cached factory (functools.cache on get_settings()).',
      explanation: py`\`Settings(...)\` is a call on the class, so Python runs \`type(Settings).__call__\` — normally \`type.__call__\`, which runs \`__new__\` and \`__init__\`. Overriding it lets a metaclass return a cached instance. But modules are already singletons in Python: an object created at import time is shared by every importer. Dependency injection (passing \`settings\` in) keeps code testable ([clean architecture](lesson:clean-architecture)).`,
      code: { lang: 'python', code: py`import functools


class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class Settings(metaclass=SingletonMeta):
    def __init__(self):
        self.debug = False


print(Settings() is Settings())   # True


# Simpler alternatives:
class AppSettings:
    def __init__(self):
        self.debug = False


settings = AppSettings()          # module-level instance: import it where needed


@functools.cache
def get_settings():
    return AppSettings()          # lazily created once, easy to reset with get_settings.cache_clear()` },
      whyAsked: 'Singletons are a classic metaclass example; the interviewer wants to see you know both the mechanism and why it is usually not worth it.',
      mistakes: ['Implementing it with __new__ in the class and forgetting __init__ runs again on every call', 'Not mentioning test isolation', 'Claiming modules are not singletons'],
      followUps: ['Why does __init__ run again with a __new__-based singleton but not with the metaclass version?', 'How would you reset it between tests?', 'Is the metaclass version thread-safe?'],
      modelAnswer: 'Calling Settings() actually calls the metaclass’s __call__, which normally runs __new__ and __init__. A SingletonMeta overrides __call__ to create the instance on the first call and return the cached one afterwards. It works, but it makes global state look like a normal constructor, tests end up sharing the same object, and it adds a metaclass that may conflict with other bases. In Python a module-level instance is already a singleton, and a functools.cache-decorated factory gives lazy creation plus an easy cache_clear for tests, so I would suggest one of those — ideally passing settings in explicitly.',
    },
    {
      id: 'metaclasses-hook-choice',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare a class decorator, `__init_subclass__` and a metaclass. For each, give one task it is the best tool for.',
      answer: 'Class decorator: modifies one finished class, not inherited — e.g. @dataclass generating __init__. __init_subclass__: runs for every subclass with class keywords — e.g. a plugin registry with validation. Metaclass: controls creation and the class object\'s own behaviour — e.g. Enum\'s custom namespace and len()/iteration over the class.',
      explanation: py`Decorators run after \`type.__new__\` on a single class and can return a replacement. \`__init_subclass__\` runs inside \`type.__new__\` for each new subclass, inherited through the MRO. A metaclass wraps the whole process (\`__prepare__\`, \`__new__\`, \`__init__\`) and supplies methods for the class object (\`__call__\`, \`__len__\`, \`__iter__\`, \`__instancecheck__\`). Power grows down the list; so do complexity and conflict risk.`,
      whyAsked: 'It shows whether you can choose the least powerful tool that does the job — a key senior-level skill.',
      mistakes: ['Saying they are interchangeable', 'Forgetting that decorators are not inherited', 'Not mentioning metaclass conflicts'],
      followUps: ['Can a class decorator replace the class with a different object?', 'Where does __set_name__ fit?', 'Why was __init_subclass__ added in 3.6?'],
      modelAnswer: 'A class decorator is a function applied once to a finished class; it is great for adding or generating things on that one class, like @dataclass, but it is not inherited. __init_subclass__ is a hook on a parent class that runs for every subclass, receives class keywords, and is perfect for plugin registries and validating subclasses. A metaclass controls the entire creation process and the behaviour of the class object itself, which is what Enum needs for its custom namespace and len or iteration over the class. I pick the least powerful one that works, because metaclasses add complexity and can conflict with other libraries.',
    },
    {
      id: 'metaclasses-framework-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You are designing a declarative API: `class Order(Model): id = Integer(); status = Choice("new", "paid")` should validate fields, produce a schema with `Order.schema()`, and support `len(Order)` (number of fields). Which parts need descriptors, `__init_subclass__` or a metaclass?',
      answer: 'Fields: descriptors with __set_name__ (validation per attribute). Collecting fields and building the schema: __init_subclass__ on Model, storing an ordered _fields mapping; schema() can be a classmethod. Only len(Order) truly needs a metaclass (__len__ must live on type(Order)) — so either accept a small metaclass for it, or offer Order.field_count() / len(Order.schema()) and avoid the metaclass entirely.',
      explanation: py`Implicit special-method lookup (\`len(x)\`) goes to \`type(x)\`; for a class, that is its metaclass, so no class-level \`__len__\` can make \`len(Order)\` work. Everything else fits lighter tools: descriptors handle per-attribute behaviour, \`__init_subclass__\` sees every model class with its finished namespace, and classmethods expose the schema. Weigh the API nicety of \`len(Order)\` against the metaclass-conflict cost for users who mix \`Model\` with \`ABC\` or other frameworks.`,
      whyAsked: 'It tests whether you can split a framework design across the right hooks and recognise the one requirement that forces a metaclass.',
      mistakes: ['Putting everything in a metaclass by default', 'Thinking a classmethod named __len__ makes len(Order) work', 'Ignoring metaclass conflicts for users of the framework'],
      followUps: ['How would Order.status > "new" produce a query object?', 'How would you support field inheritance and overrides?', 'How would a type checker learn the generated __init__? (dataclass_transform)'],
      modelAnswer: 'I would make each field a descriptor with __set_name__, so it knows its name and validates on every assignment. Model would use __init_subclass__ to walk the MRO, collect the Field objects in definition order into a _fields mapping, and a schema() classmethod would build the output from it. The only requirement that forces a metaclass is len(Order), because len looks up __len__ on the type of the object, and the type of a class is its metaclass. I would question whether that nicety is worth a metaclass, which can conflict with ABC or other bases users bring — Order.schema() or a field_count() classmethod gives the same information without one.',
    },
  ],

  takeaways: [
    'Classes are objects; their type is a metaclass — type by default. type(name, bases, namespace, **kw) creates a class at runtime.',
    'A class statement runs: pick the metaclass → __prepare__ → run the body → Meta.__new__ (→ type.__new__ → __set_name__ → parent __init_subclass__) → Meta.__init__ → decorators → bind the name.',
    '__init_subclass__ (3.6+) runs for every subclass, receives class keywords, and is the right tool for registries and subclass validation; consume your keywords and forward **kwargs to super().',
    'Class decorators modify one finished class and are not inherited; metaclasses are inherited and control the whole creation.',
    'Metaclass methods act on classes: __call__ runs on Cls(), __len__/__iter__ on len(Cls)/iter(Cls); instances never see metaclass attributes.',
    'Metaclasses bring conflicts (TypeError: metaclass conflict) and complexity — use one only for custom namespaces, class-object behaviour or intercepting Cls().',
    'On 3.14 the class namespace has no __annotations__; read annotations from the finished class with inspect.get_annotations().',
  ],
}
