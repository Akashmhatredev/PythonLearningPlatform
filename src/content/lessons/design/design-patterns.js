// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CAFE = py`"""A coffee-shop till built from Pythonic patterns."""
from dataclasses import dataclass, field
from typing import Callable


# Strategy: a pricing rule is just a function.
def regular(total):
    return total


def happy_hour(total):
    return round(total * 0.8, 2)


# Factory: an alternative constructor builds drinks from the menu.
MENU = {"espresso": 2.0, "latte": 3.2, "mocha": 3.6}


@dataclass(frozen=True)
class Drink:
    name: str
    price: float

    @classmethod
    def from_menu(cls, name):
        if name not in MENU:
            raise ValueError(f"not on the menu: {name}")
        return cls(name, MENU[name])


# Observer: listeners are plain callbacks.
class EventBus:
    def __init__(self):
        self._listeners = {}

    def subscribe(self, event, callback):
        self._listeners.setdefault(event, []).append(callback)

    def publish(self, event, **details):
        for callback in self._listeners.get(event, []):
            callback(**details)


@dataclass
class Order:
    bus: EventBus
    pricing: Callable[[float], float] = regular
    drinks: list[Drink] = field(default_factory=list)

    def add(self, name):
        drink = Drink.from_menu(name)
        self.drinks.append(drink)
        self.bus.publish("added", drink=drink)

    def checkout(self):
        amount = self.pricing(sum(drink.price for drink in self.drinks))
        self.bus.publish("paid", amount=amount)
        return amount


bus = EventBus()
bus.subscribe("added", lambda drink: print(f"barista: making {drink.name}"))
bus.subscribe("paid", lambda amount: print(f"till: charged {amount:.2f}"))

order = Order(bus, pricing=happy_hour)
for name in ["latte", "mocha", "espresso"]:
    order.add(name)
order.checkout()
`

const OBSERVER_TRACE = py`listeners = []


def subscribe(callback):
    listeners.append(callback)
    return callback


@subscribe
def barista(drink):
    print("barista makes", drink)


@subscribe
def loyalty_card(drink):
    print("stamp for", drink)


def publish(drink):
    for callback in listeners:
        callback(drink)


publish("latte")
`

export default {
  id: 'design-patterns',
  title: 'Design patterns, the Pythonic way',
  summary: 'Classic design patterns — Strategy, Factory, Observer, Adapter, Decorator, Singleton, Command, Iterator and Template Method — and the much lighter forms they take in Python, plus when to skip them entirely.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['solid', 'lambdas-and-higher-order', 'decorators'],
  related: ['solid', 'clean-code', 'clean-architecture', 'closures', 'iterators', 'generators', 'composition', 'methods-and-attributes', 'functools', 'modules-and-imports', 'memory-management'],
  tags: ['design patterns', 'Gang of Four', 'strategy', 'factory', 'registry', 'observer', 'callbacks', 'adapter', 'decorator pattern', 'singleton', 'command', 'undo', 'iterator', 'template method', 'composition', 'classmethod', 'plugin'],
  apis: [
    { name: '@classmethod', summary: 'A method that receives the class (cls) — the idiomatic way to write alternative constructors (factories).' },
    { name: 'functools.partial(func, *args)', summary: 'Freezes some arguments of a function: a ready-made command or strategy.' },
    { name: 'functools.cache', summary: 'Memoises a function — on a no-argument getter it gives a lazily created, shared instance.' },
    { name: 'weakref.WeakMethod', summary: 'A weak reference to a bound method, so registering a callback doesn\'t keep its object alive.' },
    { name: 'yield / yield from', summary: 'Generators: Python\'s built-in Iterator pattern.' },
  ],
  docs: [
    { label: 'Python tutorial — Classes, iterators and generators', url: 'https://docs.python.org/3/tutorial/classes.html#iterators' },
    { label: 'Built-in functions — classmethod', url: 'https://docs.python.org/3/library/functions.html#classmethod' },
    { label: 'functools — partial, cache, singledispatch', url: 'https://docs.python.org/3/library/functools.html' },
    { label: 'weakref — WeakMethod', url: 'https://docs.python.org/3/library/weakref.html#weakref.WeakMethod' },
    { label: 'Glossary — decorator', url: 'https://docs.python.org/3/glossary.html#term-decorator' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **design pattern** is a named, reusable solution to a problem that keeps coming up in software design — like "let the caller choose the algorithm" (*Strategy*) or "tell several objects when something happens" (*Observer*). The classic catalogue is the 1994 book *Design Patterns* by Gamma, Helm, Johnson and Vlissides, nicknamed the **Gang of Four (GoF)** book.`,
    py`Those patterns were described for C++ and Smalltalk, and are often taught in Java. Many of them exist to work around missing language features. Python *has* many of those features — functions are objects, classes are objects, modules are created once, \`for\` loops speak the iterator protocol — so the Python version of a pattern is often a function, a dict or a decorator rather than a family of classes.`,
    py`This lesson tours the patterns that actually matter in day-to-day Python, shows the heavyweight classic form only for contrast, and spends real time on the most important skill: knowing when *not* to use one.`,
  ],
  why: [
    py`Patterns give you a **vocabulary**. "Make the export a strategy" or "the UI observes the order" communicates a whole design in a few words.`,
    py`They are **proven shapes** for flexibility: adding a pricing rule, a notification channel or an undo button without rewriting what works — the open/closed idea from [SOLID](lesson:solid).`,
    py`And you'll **read them everywhere**: \`sorted(key=...)\` is Strategy, \`logging\` handlers and \`atexit.register\` are observer-style callbacks, \`datetime.fromisoformat\` is a factory, every generator is an iterator. Recognising the shape makes unfamiliar code familiar.`,
  ],
  eli15: [
    py`Imagine you and your friends keep solving the same Lego problems: "how do I make a door that opens?", "how do I attach wheels so they spin?". After a while you give the good solutions names — the *hinge trick*, the *axle trick* — so you can say "use the hinge trick here" instead of explaining from scratch.`,
    py`Design patterns are those named tricks for code. The fun twist in Python: some tricks that need ten bricks in other languages need one brick here, because Python already ships the special pieces. Passing a function around, for example, is a whole "pattern" in some languages and just normal Python.`,
  ],
  analogy: {
    title: 'A coffee shop runs on patterns',
    body: [
      py`Watch a busy coffee shop. The till applies whatever **pricing rule** is active — normal, happy hour, loyalty (Strategy). The barista makes a drink from just its **name on the menu** (Factory). When an order comes in, the barista, the receipt printer and the loyalty card all **get notified** (Observer).`,
      py`A travel **plug adapter** lets a foreign kettle use the local socket (Adapter). A **cup sleeve** wraps a cup without changing it, and you can add two (Decorator). Each order ticket is a **written instruction** the barista can queue, or tear up to cancel (Command). There's one **shop clock** everyone reads (a Singleton — and it's just *on the wall*, not something special).`,
    ],
    mapping: [
      ['the active pricing rule', 'Strategy: a function passed in, like pricing=happy_hour'],
      ['making a drink from its menu name', 'Factory: Drink.from_menu("latte")'],
      ['everyone hearing "order up!"', 'Observer: callbacks subscribed to an event'],
      ['a travel plug adapter', 'Adapter: a wrapper that translates one interface into another'],
      ['a cup sleeve on a cup', 'Decorator pattern: a wrapper with the same interface that adds behaviour'],
      ['an order ticket you can queue or cancel', 'Command: an object (or callable) representing an action, with undo'],
      ['the one clock on the wall', 'Singleton: in Python, just a module-level object'],
    ],
  },
  visual: {
    type: 'comparison',
    title: 'Strategy: classic vs Pythonic',
    props: {
      left: {
        label: 'Classic (class per strategy)',
        lang: 'python',
        code: py`from abc import ABC, abstractmethod


class PricingStrategy(ABC):
    @abstractmethod
    def price(self, total): ...


class Regular(PricingStrategy):
    def price(self, total):
        return total


class HappyHour(PricingStrategy):
    def price(self, total):
        return round(total * 0.8, 2)


class Till:
    def __init__(self, strategy: PricingStrategy):
        self.strategy = strategy

    def charge(self, total):
        return self.strategy.price(total)


print(Till(HappyHour()).charge(10.0))`,
      },
      right: {
        label: 'Pythonic (functions)',
        lang: 'python',
        code: py`def regular(total):
    return total


def happy_hour(total):
    return round(total * 0.8, 2)


def charge(total, pricing=regular):
    return pricing(total)


print(charge(10.0, happy_hour))`,
      },
      points: [
        'Both print 8.0 and have the same flexibility: the caller picks the rule.',
        'A one-method interface is just "a callable" — functions are objects, so pass the function itself.',
        'No base class, no subclasses, no instance creation: less code to read and test.',
        'Use the class form when a strategy needs configuration and several methods, or state between calls (a closure or functools.partial often covers configuration).',
      ],
    },
    alt: 'Two code panels. Left: an abstract PricingStrategy class, Regular and HappyHour subclasses each with a price method, and a Till class that stores a strategy object. Right: two plain functions, regular and happy_hour, and a charge function that takes the pricing function as an argument.',
  },
  syntax: [
    py`#### Strategy — pass a function`,
    py`*Problem:* let the caller choose an algorithm. *Python form:* a parameter that takes a function. You've used this all along: \`sorted(players, key=lambda p: p.score)\`, \`max(words, key=len)\`. Need a configurable strategy? Return one from a function (a [closure](lesson:closures)) or use \`functools.partial\`.`,
    { code: py`def percent_off(percent):
    def strategy(total):
        return total * (100 - percent) / 100
    return strategy


staff_price = percent_off(30)      # a configured strategy
print(staff_price(10.0))           # 7.0`, lang: 'python', title: 'a strategy factory (closure)' },
    py`#### Factory — functions, classmethods and registries`,
    py`*Problem:* create objects without the caller knowing the exact class or construction details. *Python forms:* a plain function; a \`@classmethod\` **alternative constructor** (the stdlib's \`datetime.fromisoformat\`, \`dict.fromkeys\`, \`int.from_bytes\`); or a **registry** dict mapping names to classes when the choice is made at runtime.`,
    { code: py`import json


class Settings:
    def __init__(self, theme, font_size):
        self.theme, self.font_size = theme, font_size

    @classmethod
    def from_json(cls, text):            # alternative constructor
        data = json.loads(text)
        return cls(data["theme"], data["font_size"])


PARSERS = {}                              # registry: runtime choice


def parser(extension):
    def register(cls):
        PARSERS[extension] = cls
        return cls
    return register


@parser(".json")
class JsonParser:
    def parse(self, text):
        return json.loads(text)


def parser_for(filename):
    extension = filename[filename.rfind("."):]
    return PARSERS[extension]()            # the factory


print(Settings.from_json('{"theme": "dark", "font_size": 14}').theme)
print(parser_for("scores.json").parse('{"ada": 91}'))`, lang: 'python', title: 'classmethod factory + registry' },
    py`Using \`cls(...)\` (not \`Settings(...)\`) means subclasses inherit a factory that builds *them*. The GoF "Abstract Factory" — a family of factories — is rarely needed: pass a module, a dict of callables, or a class.`,
    py`#### Observer — callbacks`,
    py`*Problem:* when something happens, notify interested parties without the source knowing who they are. *Python form:* keep a list of callables and call them. The source depends only on "something callable", so new listeners never require editing it.`,
    { code: py`class Thermostat:
    def __init__(self):
        self._listeners = []

    def subscribe(self, callback):
        self._listeners.append(callback)

    def set_temperature(self, celsius):
        for callback in self._listeners:
            callback(celsius)


def alarm(celsius):
    if celsius > 30:
        print("alarm: too hot!")


thermostat = Thermostat()
thermostat.subscribe(lambda celsius: print(f"display: {celsius} °C"))
thermostat.subscribe(alarm)
thermostat.set_temperature(31)`, lang: 'python', title: 'observer with callbacks' },
    py`Production concerns: what if a listener raises (should the others still run?), in what order do listeners run, and who unsubscribes? Bound-method listeners keep their objects alive — see *internals*.`,
    py`#### Adapter — translate an interface`,
    py`*Problem:* existing code expects one interface; a class (often third-party) offers another. *Python form:* a small wrapper class that holds the foreign object and exposes the expected methods. Duck typing means the wrapper doesn't need to inherit from anything.`,
    { code: py`class LegacyPrinter:                       # third-party: can't edit
    def print_text(self, text, copies):
        print(f"{text} x{copies}")


class PrinterAdapter:                      # what our code expects: write(text)
    def __init__(self, printer):
        self._printer = printer

    def write(self, text):
        self._printer.print_text(text, copies=1)


PrinterAdapter(LegacyPrinter()).write("receipt #42")`, lang: 'python', title: 'adapter' },
    py`#### Decorator pattern vs Python's @decorator`,
    py`They share a name and an idea (wrap something to add behaviour) but are different tools:`,
    py`| | Decorator **pattern** (GoF) | Python **@decorator** |
|---|---|---|
| wraps | an **object** | a **function** or **class** |
| when | at runtime, per instance | once, at definition time |
| how | a class with the same interface that delegates | \`f = decorator(f)\` syntax |
| stackable | yes: \`Logging(Caching(store))\` | yes: several \`@\` lines |`,
    { code: py`class Store:
    def save(self, key, value):
        print(f"saved {key}")


class LoggingStore:                        # decorator PATTERN: wraps an object
    def __init__(self, inner):
        self.inner = inner

    def save(self, key, value):
        print(f"about to save {key}")
        self.inner.save(key, value)


store = LoggingStore(Store())              # chosen at runtime, per object
store.save("user:1", {"name": "Ada"})`, lang: 'python', title: 'the decorator pattern' },
    py`Python's \`@\` syntax is covered in [decorators](lesson:decorators). Use the object-wrapping pattern when you need to add behaviour to *some instances* chosen at runtime, such as wrapping one repository with caching.`,
    py`#### Singleton — just use a module`,
    py`*Problem:* exactly one shared instance (config, a connection pool). *Python form:* a **module**. A module runs once on first import and is cached in \`sys.modules\`, so a module-level object *is* a singleton. If creation must be lazy, a \`functools.cache\`-decorated getter does it:`,
    { code: py`import functools


class Settings:
    def __init__(self):
        print("loading settings once")
        self.theme = "dark"


@functools.cache
def get_settings():
    return Settings()


print(get_settings() is get_settings())    # True, and "loading" printed once`, lang: 'python', title: 'a lazy, shared instance' },
    { callout: 'warn', title: 'Prefer passing it in', text: py`Singletons are global state: they make tests depend on each other and hide dependencies. Create the one instance in \`main()\` and pass it to the code that needs it ([dependency inversion](lesson:solid)). Avoid \`__new__\`-based singletons — they surprise readers and \`__init__\` still runs on every call (see the quiz).` },
    py`#### Command — actions as objects`,
    py`*Problem:* treat an action as data — queue it, log it, retry it, **undo** it. *Python form:* any callable works for "do later" (\`functools.partial(send_email, to="ada@example.com")\`). When you need **undo**, use small objects with \`do()\` and \`undo()\` and keep a history list. The exercise builds an undoable editor.`,
    py`#### Iterator — built into the language`,
    py`*Problem:* walk through a collection without exposing how it's stored. *Python form:* the iterator protocol (\`__iter__\`/\`__next__\`), which every \`for\` loop uses — and you almost never write it by hand, because a **generator** function creates one for you. See [iterators](lesson:iterators) and [generators](lesson:generators).`,
    { code: py`def countdown(start):
    while start > 0:
        yield start
        start -= 1


print(list(countdown(3)))   # [3, 2, 1]`, lang: 'python', title: 'a complete iterator' },
    py`#### Template Method vs composition`,
    py`*Template Method:* a base class defines the steps of an algorithm and subclasses override "hook" steps. The standard library uses it (\`unittest.TestCase.setUp\`, \`json.JSONEncoder.default\`). It's fine for shallow, framework-style hooks — but deep hierarchies get rigid. The composition alternative passes the varying step in:`,
    { code: py`# Template Method: subclass to change one step
class Report:
    def render(self, rows):
        return "\n".join([self.header(), *map(self.row, rows)])

    def header(self):
        return "REPORT"

    def row(self, item):
        return str(item)


class ShoutyReport(Report):
    def header(self):
        return "REPORT!!!"


# Composition: pass the varying step instead
def render(rows, header="REPORT", row=str):
    return "\n".join([header, *map(row, rows)])


print(ShoutyReport().render([1, 2]))
print(render([1, 2], row=lambda n: f"- {n}"))`, lang: 'python', title: 'inheritance hooks vs passed-in steps' },
    py`#### When not to use a pattern`,
    py`- **One variant only.** A strategy interface with one strategy is just a function call with extra steps.
- **The language already does it.** Don't write an iterator class when a generator works, or a singleton class when a module works.
- **To sound professional.** \`AbstractNotificationStrategyFactory\` for one email is complexity with a name.
- **Before the need exists.** Patterns are refactoring *targets*: when the third pricing rule arrives, *then* extract the strategy ([clean code](lesson:clean-code)).`,
  ],
  walkthrough: {
    title: 'Three patterns in one till',
    lang: 'python',
    code: CAFE,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [6, 12], text: py`**Strategy.** Each pricing rule is a plain function with the same shape: total in, total out. No base class is needed — "callable with one argument" *is* the interface.` },
      { lines: [15, 28], text: py`**Factory.** \`Drink.from_menu("latte")\` is an alternative constructor: callers name a drink and the factory looks up the price, validates, and calls \`cls(...)\`. Bad names fail loudly with a \`ValueError\`.` },
      { lines: [31, 41], text: py`**Observer.** The bus maps event names to lists of callbacks. \`publish\` calls each one with keyword arguments; the bus knows nothing about baristas or tills.` },
      { lines: [44, 48], text: py`The order is *given* its collaborators: a bus and a pricing strategy (defaulting to \`regular\`). \`field(default_factory=list)\` gives every order its own list.` },
      { lines: [50, 58], text: py`\`add\` uses the factory and announces the drink; \`checkout\` applies whichever strategy was injected and announces the payment.` },
      { lines: [61, 63], text: py`Listeners subscribe from the outside. Adding a receipt printer or a loyalty card means one more \`subscribe\` call — \`Order\` is never edited.` },
      { lines: [65, 68], text: py`Choose the strategy at runtime and run the order: three "making" lines, then the happy-hour total (8.80 × 0.8 = 7.04).` },
    ],
  },
  playground: {
    title: 'The pattern-powered till',
    objective: 'Extend each pattern — a new strategy, a new listener, a new menu item and an unsubscribe — without editing the Order class.',
    files: { 'main.py': CAFE },
    expected: py`\`\`\`text
barista: making latte
barista: making mocha
barista: making espresso
till: charged 7.04
\`\`\``,
    experiments: [
      {
        id: 'loyalty-strategy',
        task: py`**Strategy:** write \`loyalty(total)\` that takes 1.00 off totals of 5.00 or more (smaller totals are unchanged), and use it as the order's pricing instead of \`happy_hour\`.`,
        hint: py`\`def loyalty(total): return total - 1 if total >= 5 else total\`, then \`Order(bus, pricing=loyalty)\`.`,
        tests: [
          { name: 'loyalty takes 1.00 off big totals', code: py`assert callable(ns.get('loyalty')), 'Define a function named loyalty'
assert loyalty(8.8) == approx(7.8)` },
          { name: 'small totals are unchanged', code: py`assert loyalty(4.0) == 4.0` },
          { name: 'the order uses the loyalty strategy', code: py`assert order.pricing is loyalty and 'till: charged 7.80' in output` },
        ],
        explain: py`You added behaviour by writing a function and passing it in — \`Order\` didn't change. That's the whole Strategy pattern in Python: "accept a callable".`,
      },
      {
        id: 'stamp-card',
        task: py`**Observer:** subscribe a third listener to \`"added"\` that prints \`stamp card: +1\` for every drink.`,
        hint: py`\`bus.subscribe("added", lambda drink: print("stamp card: +1"))\` next to the other subscriptions.`,
        tests: [{ name: 'one stamp per drink', code: py`assert output.count('stamp card: +1') == 3` }],
        explain: py`The event source (\`Order\`) has no idea a loyalty system exists. Listeners run in subscription order — notice your stamp line appears right after each barista line.`,
      },
      {
        id: 'flat-white',
        task: py`**Factory:** put a \`"flat white"\` at 3.00 on the menu and add one to the order.`,
        hint: py`Add \`"flat white": 3.0\` to \`MENU\`, and \`"flat white"\` to the list in the \`for\` loop.`,
        tests: [
          { name: 'the factory can build a flat white', code: py`assert Drink.from_menu("flat white") == Drink("flat white", 3.0)` },
          { name: 'it was ordered', code: py`assert 'barista: making flat white' in output` },
        ],
        explain: py`The factory centralises "how a drink is created", so a new product is a data change. Try ordering \`"flat whte"\` to see the factory's validation catch a typo.`,
      },
      {
        id: 'unsubscribe',
        task: py`Add an \`unsubscribe(event, callback)\` method to \`EventBus\` that removes a previously subscribed callback, so it's no longer called.`,
        hint: py`\`self._listeners.get(event, []).remove(callback)\` — or rebuild the list without it.`,
        tests: [
          { name: 'an unsubscribed listener is not called', code: py`bus = EventBus()
seen = []

def listener(**details):
    seen.append(details)

bus.subscribe("added", listener)
bus.unsubscribe("added", listener)
bus.publish("added", drink="latte")
assert seen == []` },
          { name: 'other listeners still run', code: py`bus = EventBus()
seen = []

def first(**details):
    seen.append("first")

def second(**details):
    seen.append("second")

bus.subscribe("paid", first)
bus.subscribe("paid", second)
bus.unsubscribe("paid", first)
bus.publish("paid", amount=1)
assert seen == ["second"]` },
        ],
        explain: py`Unsubscribing matters in long-running programs: a subscribed callback is a reference, and references keep objects alive. Forgetting to unsubscribe is the classic observer memory leak.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Observer: one event, many callbacks',
    props: {
      code: OBSERVER_TRACE,
      notes: {
        1: 'The "subject" keeps a plain list of callables.',
        5: '`subscribe` is used as a decorator: it registers the function and returns it unchanged.',
        9: '`@subscribe` runs `barista = subscribe(barista)` — the function lands in `listeners`.',
        20: '`publish` doesn\'t know who is listening; it just calls everything in the list, in order.',
        24: 'One event, two reactions — and adding a third listener would never touch `publish`.',
      },
    },
    alt: 'A step-by-step trace. Two functions, barista and loyalty_card, are registered into the listeners list by the subscribe decorator. publish("latte") loops over the list and calls each function, printing "barista makes latte" and then "stamp for latte".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Patterns are not libraries you install or code you copy — they're *shapes* of solutions. Two programs can both use Strategy and share no code at all.`,
      py`Python makes several patterns nearly invisible because **everything is an object**: a function can be stored in a variable, put in a list or dict, passed to another function and returned from one. Once functions are values, "an object with one method" is usually just "a function".`,
      py`Peter Norvig made this point in a 1996 talk, arguing that 16 of the 23 GoF patterns become simpler or disappear in dynamic languages such as Lisp and Dylan. Python sits firmly in that camp.`,
    ],
    technical: [
      py`**Why a module is a singleton:** \`import settings\` executes \`settings.py\` once and stores the module object in \`sys.modules\`; later imports return that same object. Module-level names are therefore shared, created-once state. (The exception: importing one file under two different names — for example running it as \`__main__\` *and* importing it — creates two modules.)`,
      py`**Why decorators make registries easy:** \`@parser(".json")\` above \`class JsonParser\` is evaluated when the module is imported, as \`JsonParser = parser(".json")(JsonParser)\`. Registration happens as a side effect of import — so a plug-in module must actually be imported for its entries to exist.`,
      py`**Why observers leak:** \`bus.subscribe(handler.on_event)\` stores a **bound method**, which holds a strong reference to \`handler\`. As long as the bus lives, every handler ever subscribed stays alive. \`weakref.WeakMethod\` stores the callback without keeping its object alive:`,
      { code: py`import weakref


class Handler:
    def on_event(self):
        return "handled"


handler = Handler()
callback = weakref.WeakMethod(handler.on_event)
print(callback()())    # handled
del handler
print(callback())      # None: the handler was freed`, lang: 'python', title: 'a weak callback' },
      { callout: 'note', title: 'CPython detail', text: py`The second \`print\` shows \`None\` immediately because CPython frees an object as soon as its reference count drops to zero. Other implementations (such as PyPy) free it at a later garbage collection, so code must treat a dead weak reference as possible at any time — not at a predictable moment. See [memory management](lesson:memory-management).` },
      py`**Iterator protocol:** \`for x in obj\` calls \`iter(obj)\` (→ \`__iter__\`) once, then \`next()\` (→ \`__next__\`) until \`StopIteration\`. A generator function returns an object implementing both, with its local state frozen between \`yield\`s — the GoF Iterator, built in.`,
    ],
    production: [
      py`**Patterns in the standard library:** \`sorted(key=)\` and \`concurrent.futures.Executor\` (Strategy); \`logging.Handler\` subclasses attached to loggers and \`atexit.register\` (observer-style callbacks); \`datetime.fromtimestamp\` and \`dict.fromkeys\` (factories); \`unittest.TestCase.setUp\` and \`json.JSONEncoder.default\` (Template Method hooks); \`contextlib.ExitStack.callback\` (queued commands); \`functools.singledispatch\` (type-based dispatch, a lightweight alternative to Visitor).`,
      py`**Plug-in registries at scale:** inside one codebase a decorator-filled dict is enough. Across packages, use *entry points*: a plug-in declares them in its \`pyproject.toml\`, and the host finds them with \`importlib.metadata.entry_points(group=...)\`. This is how pytest discovers plug-ins.`,
      py`**Observer in services:** decide on error isolation (wrap each callback in \`try/except\` and log, so one bad listener doesn't break the others), ordering guarantees, and whether events are synchronous. Between processes, the same idea becomes a message queue or pub/sub system — with retries and delivery guarantees that an in-memory list doesn't have.`,
      py`**Name for the domain, not the pattern.** \`PricingRule\` and \`OrderEvents\` tell readers what the code is about; \`PricingStrategyFactoryImpl\` tells them only which book you read. Mention the pattern in a docstring if it helps.`,
    ],
  },
  mistakes: [
    {
      title: 'Java-style strategy classes with one method',
      wrong: { code: py`class SortByScore:
    def key(self, player):
        return player["score"]


players = [{"name": "Ada", "score": 91}, {"name": "Ben", "score": 78}]
ranked = sorted(players, key=SortByScore().key)`, lang: 'python' },
      right: { code: py`from operator import itemgetter

players = [{"name": "Ada", "score": 91}, {"name": "Ben", "score": 78}]
ranked = sorted(players, key=itemgetter("score"))`, lang: 'python' },
      explanation: py`A class whose only job is to hold one method is a function in disguise. Pass the function — or a ready-made one from \`operator\`.`,
    },
    {
      title: 'A __new__ singleton that resets itself',
      wrong: { code: py`class Config:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.settings = {}     # runs on EVERY Config() call`, lang: 'python' },
      right: { code: py`# config.py -- the module is the singleton
settings = {"theme": "light"}

# elsewhere:  import config;  config.settings["theme"] = "dark"`, lang: 'python' },
      explanation: py`\`Config()\` returns the same object, but Python still calls \`__init__\` on it every time, wiping the settings. A module (or one instance created in \`main()\` and passed around) is simpler and has no such trap.`,
    },
    {
      title: 'Writing an iterator class when a generator will do',
      wrong: { code: py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1`, lang: 'python' },
      right: { code: py`def countdown(start):
    while start > 0:
        yield start
        start -= 1`, lang: 'python' },
      explanation: py`Same behaviour, a third of the code and no off-by-one juggling. Write a class only when the iterable needs extra methods or must be re-iterable (then \`__iter__\` can itself be a generator method).`,
    },
    {
      title: 'One failing listener silences the rest',
      wrong: { code: py`def publish(listeners, event):
    for callback in listeners:
        callback(event)          # one exception stops the loop`, lang: 'python' },
      right: { code: py`import logging

logger = logging.getLogger(__name__)


def publish(listeners, event):
    for callback in listeners:
        try:
            callback(event)
        except Exception:
            logger.exception("listener %r failed", callback)`, lang: 'python' },
      explanation: py`A broken analytics listener shouldn't stop the receipt from printing. Decide deliberately: isolate and log each failure (common), or let the first one propagate (when listeners are part of a transaction).`,
    },
    {
      title: 'Deep Template Method hierarchies',
      wrong: { code: py`class Exporter: ...
class FileExporter(Exporter): ...
class CsvFileExporter(FileExporter): ...
class GzippedCsvFileExporter(CsvFileExporter): ...
class GzippedCsvFileExporterWithHeader(GzippedCsvFileExporter): ...`, lang: 'python' },
      right: { code: py`def export(rows, *, encode, compress=None, header=None):
    ...   # each varying step is passed in and can be combined freely`, lang: 'python' },
      explanation: py`Each new combination of features needs a new subclass, and behaviour is smeared across five files. Composing small parts ([composition over inheritance](lesson:composition)) scales without the explosion.`,
    },
  ],
  debugging: [
    {
      symptom: py`KeyError: '.yaml' from a registry lookup such as PARSERS[extension]`,
      cause: py`The module that registers the \`.yaml\` parser was never imported, so its decorator never ran — or the key is spelled differently (\`"yaml"\` vs \`".yaml"\`).`,
      fix: py`Import plug-in modules explicitly at start-up (or via entry points), and replace the bare lookup with a clear error listing the known keys.`,
    },
    {
      symptom: py`Memory keeps growing in a long-running service; objects you thought were finished are still alive`,
      cause: py`Bound methods subscribed to a long-lived event bus keep their objects (and everything those objects reference) alive.`,
      fix: py`Unsubscribe when the object is done (a \`with\` block or \`try/finally\` helps), or store \`weakref.WeakMethod\` references. \`tracemalloc\` or \`gc.get_referrers\` can confirm who holds the object.`,
    },
    {
      symptom: py`Settings changed in one place are mysteriously reset`,
      cause: py`A \`__new__\`-based singleton returns the same instance, but \`__init__\` runs again on every construction and re-initialises its attributes.`,
      fix: py`Replace it with a module-level object or a \`functools.cache\` getter — or create one instance in \`main()\` and pass it in.`,
    },
    {
      symptom: py`TypeError: <lambda>() got an unexpected keyword argument 'drink'`,
      cause: py`An observer callback's parameters don't match what the event publishes (here, \`publish("added", drink=...)\` but the lambda takes \`item\`).`,
      fix: py`Document each event's payload in one place and match it in every listener, or accept \`**details\` in listeners that only need part of it.`,
    },
  ],
  bestPractices: [
    'Reach for the language feature first: functions for Strategy and Command, modules for Singleton, generators for Iterator.',
    'Use @classmethod alternative constructors (from_json, from_menu) for factories, and build with cls(...) so subclasses work.',
    'Use a decorator-filled registry when the set of variants grows or comes from plug-ins; fail with a clear error for unknown keys.',
    'Give observers an unsubscribe path, isolate listener failures, and beware bound methods keeping objects alive.',
    'Prefer composition (passing steps in) over deep Template Method inheritance.',
    'Name classes and functions for the domain, not the pattern; mention the pattern in a docstring if it helps readers.',
    'Treat patterns as refactoring targets: introduce one when the second or third variant appears, not up front.',
  ],
  whenToUse: {
    use: [
      'Strategy: callers need to swap algorithms (pricing, sorting, retry policies).',
      'Factory / registry: object creation depends on runtime data (file extension, config value, message type).',
      'Observer: several independent parts must react to one event without the source knowing them.',
      'Adapter: integrating a third-party or legacy class whose interface doesn\'t match yours.',
      'Command: you need undo/redo, queues, retries or an audit log of actions.',
    ],
    avoid: [
      'Only one variant exists and no second one is planned.',
      'The pattern recreates something Python already has (iterator classes, singleton classes, one-method strategy classes).',
      'Observer chains so long that nobody can tell what happens when an event fires — sometimes a direct call is clearer.',
      'Adding a pattern to make code look "enterprise-ready" rather than to solve a present problem.',
    ],
  },
  comparison: {
    title: 'Classic pattern → Pythonic form',
    headers: ['pattern', 'classic form', 'Pythonic form', 'seen in the stdlib'],
    rows: [
      ['Strategy', 'interface + one class per algorithm', 'pass a function (closure / partial to configure)', 'sorted(key=...), max(key=...)'],
      ['Factory', 'factory class hierarchy', 'function, @classmethod constructor, registry dict', 'datetime.fromisoformat, dict.fromkeys'],
      ['Observer', 'Subject / Observer interfaces', 'list of callbacks', 'atexit.register, logging handlers'],
      ['Adapter', 'adapter class implementing target interface', 'small wrapper class (duck typed)', 'io.TextIOWrapper (bytes → text)'],
      ['Decorator', 'wrapper class, same interface', 'wrapper object — or @decorator for functions', 'functools.lru_cache (function form)'],
      ['Singleton', 'private constructor + getInstance()', 'a module, or a functools.cache getter', 'every imported module'],
      ['Command', 'Command interface with execute()', 'callable / partial; do-undo objects for undo', 'contextlib.ExitStack.callback'],
      ['Iterator', 'Iterator class with hasNext()/next()', 'generator function', 'every for loop'],
      ['Template Method', 'abstract base with hook methods', 'pass steps in (composition); shallow hooks are fine', 'unittest.TestCase.setUp'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'design-patterns-q1',
      type: 'mcq',
      prompt: 'What is the most Pythonic way to let callers choose how a list of orders is ranked?',
      options: [
        { text: 'An abstract RankingStrategy class with one subclass per ranking', why: 'Works, but a one-method interface is just a callable in Python — this is the Java-shaped version.' },
        'Accept a key function parameter, like sorted(orders, key=...)',
        { text: 'An if/elif chain on a ranking_name string', why: 'Every new ranking means editing the function — the opposite of open/closed.' },
        { text: 'A global variable that holds the current ranking', why: 'Global state makes behaviour depend on hidden context and breaks concurrent use and tests.' },
      ],
      answer: 1,
      explanation: py`Functions are objects, so the strategy *is* a function. \`sorted\`, \`max\`, \`min\` and \`heapq\` all take \`key=\` for exactly this reason.`,
    },
    {
      id: 'design-patterns-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`listeners = []

def subscribe(fn):
    listeners.append(fn)
    return fn

@subscribe
def log(event):
    print("log:", event)

@subscribe
def email(event):
    print("email:", event)

for listener in listeners:
    listener("signup")`,
      options: [
        'log: signup\nemail: signup',
        { text: 'email: signup\nlog: signup', why: 'Decorators run top to bottom as the module executes, so log is appended first.' },
        { text: 'Nothing — decorated functions are never called', why: 'The loop at the bottom calls every registered listener.' },
        { text: 'TypeError: \'NoneType\' object is not callable', why: 'subscribe returns fn, so the names log and email still refer to the functions.' },
      ],
      answer: 0,
      explanation: py`Each \`@subscribe\` runs at definition time, appending the function and returning it unchanged. Callbacks then run in registration order.`,
    },
    {
      id: 'design-patterns-q3',
      type: 'bug',
      prompt: 'This "singleton" returns the same object every time, yet `print(b.settings)` shows `{}`. Click the line responsible.',
      code: py`class Config:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.settings = {}

a = Config()
a.settings["theme"] = "dark"
b = Config()
print(b.settings)`,
      answerLine: 10,
      explanation: py`Calling \`Config()\` runs \`__new__\` *and then* \`__init__\` on whatever \`__new__\` returned. The shared instance is re-initialised on every call. Use a module-level object instead.`,
    },
    {
      id: 'design-patterns-q4',
      type: 'fill',
      prompt: 'Complete the alternative constructor so it also works for subclasses.',
      code: py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @___
    def from_fahrenheit(___, degrees):
        return cls((degrees - 32) * 5 / 9)`,
      answer: [['classmethod'], ['cls']],
      explanation: py`A \`@classmethod\` receives the class it was called on as \`cls\`. Calling \`cls(...)\` means \`Kelvinish.from_fahrenheit(...)\` on a subclass builds a subclass instance.`,
    },
    {
      id: 'design-patterns-q5',
      type: 'output',
      prompt: 'Predict the output of these stacked wrappers (the decorator *pattern*).',
      code: py`class Storage:
    def save(self, key, value):
        print(f"saved {key}")

class LoggingStorage:
    def __init__(self, inner):
        self.inner = inner

    def save(self, key, value):
        print(f"about to save {key}")
        self.inner.save(key, value)

store = LoggingStorage(LoggingStorage(Storage()))
store.save("user:1", {"name": "Ada"})`,
      options: [
        { text: 'about to save user:1\nsaved user:1', why: 'There are two LoggingStorage layers, and each prints before delegating.' },
        'about to save user:1\nabout to save user:1\nsaved user:1',
        { text: 'saved user:1\nabout to save user:1\nabout to save user:1', why: 'Each wrapper prints *before* calling the inner object, so the real save happens last.' },
      ],
      answer: 1,
      explanation: py`Wrappers share the same interface, so they stack: outer logs, delegates to the inner logger, which logs and delegates to the real storage.`,
    },
    {
      id: 'design-patterns-q6',
      type: 'mcq',
      prompt: 'You need to walk a deeply nested folder tree lazily, one file at a time. What is the idiomatic Iterator implementation?',
      options: [
        { text: 'A class with has_next() and next() methods', why: 'That\'s the Java shape. Python\'s protocol is __iter__/__next__, and you rarely write it by hand.' },
        { text: 'Collect every path into a list, then return the list', why: 'That isn\'t lazy: it walks the whole tree and holds everything in memory first.' },
        'A generator function that yields files and uses yield from for subfolders',
        { text: 'A global index variable advanced by a function', why: 'Hidden global state; two walks at once would interfere.' },
      ],
      answer: 2,
      explanation: py`A generator *is* an iterator: it pauses at each \`yield\`, and \`yield from\` delegates to the recursive walk of a subfolder. (\`pathlib.Path.rglob\` already does this for real folders.)`,
    },
    {
      id: 'design-patterns-q7',
      type: 'short',
      prompt: 'Give two signs that adding a design pattern would make code worse, not better.',
      answer: py`(1) There's only one variant and no concrete second one coming — the pattern adds indirection without flexibility. (2) Python already provides the behaviour (a function instead of a one-method strategy class, a module instead of a singleton class, a generator instead of an iterator class). Other signs: the pattern makes the data flow hard to follow, or it's being added to look "enterprise" rather than to solve a present problem.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'undo-commands',
      title: 'Command pattern: an editor with undo',
      difficulty: 'advanced',
      prompt: py`Build undo for a tiny text editor using the Command pattern. \`Append\` is done for you. Implement:

1. \`DeleteLast(count).do(doc)\` — remove the last \`count\` characters of \`doc.text\` (or all of them if there are fewer), **remembering what was removed** in \`self.removed\`.
2. \`DeleteLast.undo(doc)\` — put the removed text back.
3. \`Document.undo()\` — undo the **most recent** executed command and drop it from \`history\`. With an empty history it does nothing (no error).

Undo must work in reverse order through several commands.`,
      files: {
        'main.py': py`class Append:
    """Command: add text to the end of the document."""

    def __init__(self, text):
        self.text = text

    def do(self, doc):
        doc.text += self.text

    def undo(self, doc):
        doc.text = doc.text[: len(doc.text) - len(self.text)]


class DeleteLast:
    """Command: remove the last count characters."""

    def __init__(self, count):
        self.count = count
        self.removed = ""

    def do(self, doc):
        pass  # TODO: remember what you remove, then remove it

    def undo(self, doc):
        pass  # TODO: put the removed text back


class Document:
    def __init__(self):
        self.text = ""
        self.history = []

    def execute(self, command):
        command.do(self)
        self.history.append(command)

    def undo(self):
        pass  # TODO: undo the most recent command (do nothing if there is none)


doc = Document()
doc.execute(Append("Hello, world"))
doc.execute(DeleteLast(7))
print(doc.text)
doc.undo()
print(doc.text)
`,
      },
      hints: [
        'A command must store everything it needs to reverse itself. For a delete, that is the text it removed.',
        'Work out where to cut: `cut = max(0, len(doc.text) - self.count)`. Then `self.removed = doc.text[cut:]` and `doc.text = doc.text[:cut]`.',
        'Document.undo: `if self.history: self.history.pop().undo(self)` — pop() takes the most recent command.',
      ],
      solution: {
        explanation: py`Each command object carries the data needed to reverse itself: \`Append\` knows its text, \`DeleteLast\` records what it removed *at the moment it ran*. The document keeps a history stack; \`undo\` pops the latest command and asks it to reverse itself, so repeated undos walk back in reverse order. \`max(0, ...)\` handles deleting more characters than exist — and avoids the trap that \`text[-0:]\` is the *whole* string. The document never needs to know what kinds of commands exist, so adding \`Uppercase\` or \`Replace\` later means writing one new class.`,
        files: {
          'main.py': py`class Append:
    """Command: add text to the end of the document."""

    def __init__(self, text):
        self.text = text

    def do(self, doc):
        doc.text += self.text

    def undo(self, doc):
        doc.text = doc.text[: len(doc.text) - len(self.text)]


class DeleteLast:
    """Command: remove the last count characters."""

    def __init__(self, count):
        self.count = count
        self.removed = ""

    def do(self, doc):
        cut = max(0, len(doc.text) - self.count)
        self.removed = doc.text[cut:]
        doc.text = doc.text[:cut]

    def undo(self, doc):
        doc.text += self.removed


class Document:
    def __init__(self):
        self.text = ""
        self.history = []

    def execute(self, command):
        command.do(self)
        self.history.append(command)

    def undo(self):
        if self.history:
            self.history.pop().undo(self)


doc = Document()
doc.execute(Append("Hello, world"))
doc.execute(DeleteLast(7))
print(doc.text)
doc.undo()
print(doc.text)
`,
        },
      },
      tests: [
        { name: 'DeleteLast removes the last characters', code: py`doc = Document()
doc.execute(Append("Hello, world"))
doc.execute(DeleteLast(7))
assert doc.text == "Hello"` },
        { name: 'undo restores deleted text', code: py`doc = Document()
doc.execute(Append("Hello, world"))
doc.execute(DeleteLast(7))
doc.undo()
assert doc.text == "Hello, world"` },
        { name: 'undo walks back in reverse order', code: py`doc = Document()
doc.execute(Append("ab"))
doc.execute(Append("cd"))
doc.execute(DeleteLast(1))
doc.undo()
assert doc.text == "abcd"
doc.undo()
assert doc.text == "ab"
doc.undo()
assert doc.text == "" and doc.history == []` },
        { name: 'undo with no history does nothing', code: py`doc = Document()
doc.undo()
assert doc.text == ""` },
        { name: 'deleting more than exists empties the text, and undo restores it', code: py`doc = Document()
doc.execute(Append("hi"))
doc.execute(DeleteLast(5))
assert doc.text == ""
doc.undo()
assert doc.text == "hi"` },
      ],
    },
    {
      id: 'probe-adapter',
      title: 'Adapter: plug in a Fahrenheit probe',
      difficulty: 'intermediate',
      prompt: py`\`average_celsius(sensors)\` works with any object that has \`read_celsius()\`. A third-party \`FahrenheitProbe\` (which you **must not edit**) only has \`get_temp_f()\`, in Fahrenheit.

Complete \`ProbeAdapter(probe)\` so that \`read_celsius()\` returns the probe's **current** reading converted with \`(f - 32) * 5 / 9\`. The adapter must ask the probe each time it's read (don't store a converted number in \`__init__\`), and \`average_celsius\` must work unchanged on a mix of sensors.`,
      files: {
        'main.py': py`class CelsiusSensor:
    """Our own sensor: the rest of the app expects read_celsius()."""

    def __init__(self, celsius):
        self.celsius = celsius

    def read_celsius(self):
        return self.celsius


class FahrenheitProbe:
    """Third-party class we cannot edit: different method, different unit."""

    def __init__(self, fahrenheit):
        self._fahrenheit = fahrenheit

    def get_temp_f(self):
        return self._fahrenheit


def average_celsius(sensors):
    """Return the mean reading of sensors that have read_celsius()."""
    readings = [sensor.read_celsius() for sensor in sensors]
    return sum(readings) / len(readings)


class ProbeAdapter:
    """Make a FahrenheitProbe look like a Celsius sensor."""

    def __init__(self, probe):
        pass  # TODO

    def read_celsius(self):
        pass  # TODO


adapted = ProbeAdapter(FahrenheitProbe(212.0))
print("adapted reading:", adapted.read_celsius())
`,
      },
      hints: [
        'An adapter holds the object it adapts. Store the probe in __init__.',
        'read_celsius() should call the probe\'s own method every time: `self._probe.get_temp_f()`.',
        '`return (self._probe.get_temp_f() - 32) * 5 / 9`',
      ],
      solution: {
        explanation: py`The adapter wraps the foreign object and exposes the interface our code expects, translating both the method name and the unit. Because it delegates on every call instead of converting once in \`__init__\`, it always reflects the probe's live reading. Neither \`FahrenheitProbe\` nor \`average_celsius\` changed — duck typing means the adapter only needs a \`read_celsius()\` method, no base class.`,
        files: {
          'main.py': py`class CelsiusSensor:
    """Our own sensor: the rest of the app expects read_celsius()."""

    def __init__(self, celsius):
        self.celsius = celsius

    def read_celsius(self):
        return self.celsius


class FahrenheitProbe:
    """Third-party class we cannot edit: different method, different unit."""

    def __init__(self, fahrenheit):
        self._fahrenheit = fahrenheit

    def get_temp_f(self):
        return self._fahrenheit


def average_celsius(sensors):
    """Return the mean reading of sensors that have read_celsius()."""
    readings = [sensor.read_celsius() for sensor in sensors]
    return sum(readings) / len(readings)


class ProbeAdapter:
    """Make a FahrenheitProbe look like a Celsius sensor."""

    def __init__(self, probe):
        self._probe = probe

    def read_celsius(self):
        return (self._probe.get_temp_f() - 32) * 5 / 9


adapted = ProbeAdapter(FahrenheitProbe(212.0))
print("adapted reading:", adapted.read_celsius())
print("average:", average_celsius([CelsiusSensor(20.0), adapted]))
`,
        },
      },
      tests: [
        { name: 'boiling point converts to 100 °C', code: py`assert ProbeAdapter(FahrenheitProbe(212.0)).read_celsius() == approx(100)` },
        { name: 'freezing point converts to 0 °C', code: py`assert ProbeAdapter(FahrenheitProbe(32.0)).read_celsius() == approx(0)` },
        { name: 'average_celsius works on a mix of sensors', code: py`assert average_celsius([CelsiusSensor(20.0), ProbeAdapter(FahrenheitProbe(212.0))]) == approx(60)` },
        { name: 'the adapter reads the probe live', code: py`probe = FahrenheitProbe(50.0)
adapter = ProbeAdapter(probe)
probe._fahrenheit = 212.0
assert adapter.read_celsius() == approx(100), 'Call get_temp_f() inside read_celsius(), not in __init__'` },
        { name: 'the third-party class was not edited', code: py`assert 'read_celsius' not in vars(FahrenheitProbe), 'Adapt FahrenheitProbe from the outside; do not add methods to it'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'design-patterns-what-and-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a design pattern, and why do many classic patterns look different — or disappear — in Python?',
      answer: 'A design pattern is a named, reusable solution to a recurring design problem. Many GoF patterns compensate for features missing from C++/Java; Python has first-class functions, modules, decorators and generators, so Strategy becomes a function argument, Singleton a module, Iterator a generator.',
      explanation: py`The GoF book (1994) catalogued 23 patterns. Their *intent* still matters in Python — swap algorithms, notify listeners, adapt interfaces — but the *structure* often collapses. Peter Norvig argued in 1996 that most of them become simpler or invisible in dynamic languages. What remains valuable is the vocabulary and the recognition of when a design problem is the one a pattern solves.`,
      whyAsked: 'It checks whether you understand patterns as ideas rather than class diagrams to copy — a common gap in candidates who learned them in Java.',
      mistakes: ['Describing patterns as code libraries', 'Only giving Java-style class implementations', 'Claiming patterns are useless in Python'],
      followUps: ['Which pattern do you use most in Python?', 'Name a pattern in the standard library.', 'When did a pattern make your code worse?'],
      modelAnswer: 'A design pattern is a named solution to a design problem that keeps recurring, like letting callers swap an algorithm or notifying several parts of a system when something happens. The classic catalogue is the Gang of Four book, written with C++ and Smalltalk in mind, and many of its patterns work around features those languages lacked. Python has first-class functions, modules that are created once, decorators and generators, so the same intent takes far less code: a strategy is just a function argument, a singleton is a module, an iterator is a generator. So I value patterns for the vocabulary and the problem recognition, but I implement them in the lightest Python form.',
    },
    {
      id: 'design-patterns-singleton',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'How would you implement a Singleton in Python — and should you?',
      answer: 'The idiomatic singleton is a module-level object (modules are created once and cached in sys.modules), or a functools.cache getter for lazy creation. But prefer creating one instance in main() and passing it in: singletons are global state that hide dependencies and couple tests.',
      explanation: py`Options compared: (1) module-level instance — simple, eager; (2) \`@functools.cache\` getter — lazy, easy to reset with \`cache_clear()\` in tests; (3) \`__new__\` override — surprising, \`__init__\` re-runs; (4) metaclass — heavy machinery for a simple need. The underlying question is usually "how do many parts share one resource?", and dependency injection answers that without global state.`,
      code: { lang: 'python', code: py`import functools


class ConnectionPool:
    def __init__(self, size):
        self.size = size


@functools.cache
def get_pool():
    return ConnectionPool(size=10)


assert get_pool() is get_pool()
get_pool.cache_clear()          # tests can reset it` },
      whyAsked: 'Singleton is the most over-used pattern; the answer shows whether you know Python\'s import model and the costs of global state.',
      mistakes: ['Leading with a metaclass or __new__ implementation', 'Not mentioning that modules are already singletons', 'Ignoring testability'],
      followUps: ['Why is a __new__-based singleton surprising?', 'How do you reset a singleton between tests?', 'Is None a singleton?'],
      modelAnswer: 'The Pythonic singleton is a module: a module runs once and is cached in sys.modules, so any object created at module level is shared by everyone who imports it. If creation should be lazy, a functools.cache getter does it and can even be reset in tests with cache_clear. I avoid overriding __new__ because __init__ still runs on every call, and a metaclass is heavy machinery for a simple need. More importantly, I question whether I need a singleton at all — usually I just create one instance in main and pass it to whoever needs it, which keeps dependencies visible and tests independent.',
    },
    {
      id: 'design-patterns-decorator-vs-decorator',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between the Decorator design pattern and a Python @decorator?',
      options: [
        'They are the same thing with different names',
        'The pattern wraps an object at runtime behind the same interface; @decorator is syntax that replaces a function or class at definition time with the result of calling a function on it',
        'The pattern only works with classes; @decorator only works with methods',
        '@decorator is the Python implementation of the Adapter pattern',
      ],
      correctOption: 1,
      answer: 'The pattern wraps an individual object at runtime with another object of the same interface that adds behaviour (LoggingStore(store)). A Python @decorator is syntax: @d above def f means f = d(f), applied once when the function or class is defined.',
      explanation: py`Both "wrap to add behaviour" and both stack. The differences are the target (object vs function/class), the timing (runtime per instance vs definition time for all calls) and the mechanism (delegation through a shared interface vs a higher-order function, usually returning a closure with \`functools.wraps\`). A \`@functools.lru_cache\` decorator and a \`CachingRepository(repo)\` wrapper solve similar problems at different levels.`,
      whyAsked: 'The shared name confuses many developers; a clear answer shows precise understanding of both.',
      mistakes: ['Saying they are identical', 'Not knowing that @d is just f = d(f)', 'Forgetting that the pattern can be applied selectively per instance'],
      followUps: ['When would you wrap an object instead of decorating its class?', 'What does functools.wraps do?'],
      modelAnswer: 'They share an idea — wrap something to add behaviour — but they are different tools. The Decorator pattern wraps an individual object at runtime with another object that has the same interface and delegates to it, like LoggingStore wrapping a store; I can choose per instance whether to wrap and stack several wrappers. A Python decorator is syntax: putting @d above a function means f equals d of f, evaluated once when the function is defined, so every call goes through it. So the pattern targets objects at runtime, and the syntax targets functions or classes at definition time.',
    },
    {
      id: 'design-patterns-strategy-coding',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Implement pricing strategies as functions: `percent_off(percent)` returns a strategy, `cheapest_free(prices)` makes the cheapest item free when there are 3 or more items, and `checkout_total(prices, strategy=no_discount)` applies the strategy and rounds to 2 decimals.',
      answer: 'percent_off returns a closure computing sum(prices) * (100 - percent) / 100; cheapest_free subtracts min(prices) when len(prices) >= 3; checkout_total returns round(strategy(prices), 2).',
      explanation: py`Each strategy has the same shape — list of prices in, total out — so \`checkout_total\` can accept any of them. \`percent_off\` is a *factory of strategies*: it captures \`percent\` in a closure and returns a configured function. New promotions never touch \`checkout_total\`.`,
      starter: { files: { 'main.py': py`def no_discount(prices):
    return sum(prices)


def percent_off(percent):
    """Return a strategy that takes percent % off the total."""
    pass  # TODO


def cheapest_free(prices):
    """With 3 or more items, the cheapest one is free."""
    pass  # TODO


def checkout_total(prices, strategy=no_discount):
    pass  # TODO: apply the strategy and round to 2 decimals


print(checkout_total([10.0, 20.0]))
` } },
      tests: [
        { name: 'no discount by default', code: py`assert checkout_total([10.0, 20.0]) == 30.0` },
        { name: 'percent_off returns a working strategy', code: py`assert callable(percent_off(25))
assert percent_off(25)([100.0]) == 75.0
assert checkout_total([10.0, 20.0], percent_off(10)) == 27.0` },
        { name: 'cheapest item free with 3 or more items', code: py`assert checkout_total([5.0, 8.0, 3.0], cheapest_free) == 13.0
assert checkout_total([5.0, 8.0], cheapest_free) == 13.0` },
        { name: 'totals are rounded to 2 decimals', code: py`assert checkout_total([0.1, 0.2]) == 0.3` },
      ],
      solution: { files: { 'main.py': py`def no_discount(prices):
    return sum(prices)


def percent_off(percent):
    """Return a strategy that takes percent % off the total."""
    def strategy(prices):
        return sum(prices) * (100 - percent) / 100
    return strategy


def cheapest_free(prices):
    """With 3 or more items, the cheapest one is free."""
    if len(prices) < 3:
        return sum(prices)
    return sum(prices) - min(prices)


def checkout_total(prices, strategy=no_discount):
    return round(strategy(prices), 2)


print(checkout_total([10.0, 20.0]))
print(checkout_total([10.0, 20.0], percent_off(10)))
` } },
      hints: ['A strategy is any function prices -> total.', 'percent_off defines an inner function that uses percent, then returns it (a closure).', 'checkout_total just calls strategy(prices) and rounds.'],
      whyAsked: 'A practical check that you reach for first-class functions and closures instead of class hierarchies.',
      mistakes: ['Writing one class per strategy', 'Having percent_off compute a total instead of returning a function', 'Rounding inside each strategy instead of once in checkout_total'],
      followUps: ['How would you combine two strategies?', 'When would you switch to strategy objects instead of functions?'],
      modelAnswer: 'I treat a strategy as any function from a list of prices to a total, so checkout_total just calls the strategy it is given and rounds once. no_discount and cheapest_free are plain functions; cheapest_free subtracts the minimum when there are at least three items. percent_off is a factory of strategies: it defines an inner function that closes over percent and returns it, so percent_off(10) is a ready-to-use strategy. Adding a promotion never touches checkout_total. I would switch to objects only if a strategy needed several methods or a description to show customers.',
    },
    {
      id: 'design-patterns-observer-leak',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'A long-running service subscribes `handler.on_config_change` to a global event bus for every request. Memory grows steadily. Explain the leak and two fixes.',
      code: { lang: 'python', code: py`class EventBus:
    def __init__(self):
        self.listeners = []

    def subscribe(self, callback):
        self.listeners.append(callback)


bus = EventBus()


class RequestHandler:
    def __init__(self, request_id):
        self.request_id = request_id
        self.buffer = bytearray(1_000_000)
        bus.subscribe(self.on_config_change)

    def on_config_change(self, config):
        pass` },
      answer: 'A bound method holds a strong reference to its object, so the global bus keeps every RequestHandler (and its buffer) alive forever. Fix by unsubscribing when the handler is done (try/finally or a context manager), or by storing weakref.WeakMethod references so the bus doesn\'t keep handlers alive.',
      explanation: py`\`self.on_config_change\` is a bound-method object with \`__self__\` pointing at the handler. The bus's list references the bound method, which references the handler, which references its 1 MB buffer. Nothing is ever removed, so reference counts never reach zero. Other fixes: subscribe once at a higher level (one listener for the whole service, not one per request), or use a \`weakref.WeakSet\`-style registry. Diagnose with \`tracemalloc\` snapshots or \`gc.get_referrers(handler)\`.`,
      whyAsked: 'The observer pattern\'s classic production bug; it tests knowledge of references, bound methods and object lifetime.',
      mistakes: ['Blaming the garbage collector', 'Calling gc.collect() as the fix', 'Not realising a bound method references its instance'],
      followUps: ['What happens to a WeakMethod when its object dies?', 'How would you find this leak in production?', 'Why would weak references be a bad idea for lambda listeners?'],
      modelAnswer: 'Each handler subscribes a bound method, and a bound method keeps a strong reference to its instance. The bus is global and never forgets a listener, so every RequestHandler ever created — with its megabyte buffer — stays reachable and can never be freed; calling gc.collect would not help because nothing is garbage. The cleanest fix is lifecycle management: unsubscribe when the request finishes, ideally in a finally block or a context manager. Alternatively the bus can store weakref.WeakMethod references and drop dead ones, so it never keeps handlers alive. I would also question the design — one service-level listener is better than one per request — and confirm the fix with tracemalloc snapshots.',
    },
    {
      id: 'design-patterns-plugin-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design a plug-in system for a CLI tool so other teams can add export formats (PDF, XLSX, …) without changing the tool\'s code.',
      answer: 'Define a small Exporter protocol (name, export(rows) -> bytes). Inside the codebase, a decorator-filled registry maps format names to factories. For third-party packages, discover plug-ins via importlib.metadata entry points in a named group, load them lazily, validate them against the protocol, and fail with a clear error listing available formats.',
      explanation: py`Patterns combined: **Strategy** (each exporter), **Factory/registry** (name → exporter), **Open/closed** (new formats are new packages). Entry points let a plug-in package declare itself in its \`pyproject.toml\`; the host calls \`importlib.metadata.entry_points(group="mytool.exporters")\` and \`.load()\` only the one requested, so a broken plug-in doesn't break everything. Production details: version the protocol, isolate plug-in errors, document the contract with a test kit plug-in authors can run.`,
      code: { lang: 'python', code: py`from importlib.metadata import entry_points
from typing import Protocol


class Exporter(Protocol):
    def export(self, rows: list[dict]) -> bytes: ...


BUILT_IN: dict[str, type] = {}


def exporter_for(name: str) -> Exporter:
    if name in BUILT_IN:
        return BUILT_IN[name]()
    for entry in entry_points(group="mytool.exporters"):
        if entry.name == name:
            return entry.load()()
    raise ValueError(f"unknown format {name!r}")` },
      whyAsked: 'It combines several patterns with packaging knowledge and tests whether you can design an extension point other people will use.',
      mistakes: ['Hard-coding an if/elif per format', 'Importing every plug-in eagerly at start-up', 'No contract or validation for plug-ins', 'Ignoring what happens when a plug-in crashes'],
      followUps: ['How do you version the plug-in interface?', 'How would you test third-party plug-ins?', 'What are the security implications of loading plug-ins?'],
      modelAnswer: 'I would make each format a strategy behind a small Exporter protocol — basically export(rows) returning bytes. Inside the tool, built-in formats register themselves in a registry through a decorator. For external teams I would use packaging entry points: a plug-in package declares an entry point in a group like mytool.exporters in its pyproject, and the tool discovers it with importlib.metadata.entry_points, loading only the one the user asked for. Unknown names give a clear error listing available formats, and plug-in failures are caught and reported with the plug-in name. I would version the protocol and ship a small contract-test helper so plug-in authors can check their exporter.',
    },
    {
      id: 'design-patterns-overuse-review',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A PR adds `NotificationStrategy` (abstract), `EmailNotificationStrategy`, `NotificationStrategyFactory` and `NotificationContext` — to send one welcome email. What feedback do you give?',
      answer: 'Suggest replacing the four classes with one function, send_welcome_email(user, mailer), with the mailer injected for testing. Explain that Strategy and Factory pay off when there are several interchangeable variants chosen at runtime; with one variant they add indirection. Note the trigger that would justify them later.',
      explanation: py`Patterns have a cost: more files, more names, harder navigation. The benefit — swappability — only exists when there are variants. Python makes later extraction cheap: when SMS arrives, a \`notify(user, channel)\` with a dict of functions is a ten-minute refactoring, under tests.`,
      whyAsked: 'Shows judgement and the ability to give constructive review, which matter more for senior roles than reciting patterns.',
      mistakes: ['Approving because "it is extensible"', 'Dismissing patterns entirely', 'Giving feedback without a concrete simpler alternative'],
      followUps: ['What would make you accept this design?', 'How would you add SMS later?'],
      modelAnswer: 'I would point out that there is exactly one variant, so the strategy interface, factory and context add four names and several files without giving us any real flexibility. I would suggest one function, send_welcome_email taking the user and a mailer, with the mailer injected so it is easy to test. Then I would explain when the patterns would pay off: when we really have several channels chosen at runtime — email, SMS, push — a dict of functions or a small strategy registry is a quick refactoring under tests. That keeps the code simple today without blocking tomorrow.',
    },
  ],

  takeaways: [
    'A design pattern is a named solution to a recurring design problem — the intent matters more than the class diagram.',
    'Strategy and Command are usually just functions (closures and functools.partial configure them); use objects when you need undo or several methods.',
    'Factories are functions, @classmethod alternative constructors (built with cls(...)), or decorator-filled registries.',
    'Observer is a list of callbacks — give it unsubscribe, isolate listener errors, and remember bound methods keep objects alive.',
    'Adapters and the Decorator pattern wrap objects; Python\'s @decorator is definition-time syntax for wrapping functions and classes.',
    'Singleton: use a module or a cached getter — better still, create one instance and pass it in. Iterator: write a generator.',
    'Prefer composition over deep Template Method hierarchies, and introduce patterns only when a real second variant appears.',
  ],
}
