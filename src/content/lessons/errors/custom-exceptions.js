// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ERRORS_PY = py`"""Every exception the shop can raise. Catch ShopError to handle them all."""


class ShopError(Exception):
    """Base class for every shop error."""


class UnknownProductError(ShopError, LookupError):
    """The product code is not in the catalogue."""

    def __init__(self, code):
        super().__init__(code)
        self.code = code

    def __str__(self):
        return f"no product with code {self.code!r}"


class OutOfStockError(ShopError):
    """Not enough units left to fulfil a request."""

    def __init__(self, code, requested, available):
        super().__init__(code, requested, available)
        self.code = code
        self.requested = requested
        self.available = available

    def __str__(self):
        return f"wanted {self.requested} x {self.code}, only {self.available} left"


class InvalidQuantityError(ShopError, ValueError):
    """The quantity is not a positive whole number."""
`

const INVENTORY_PY = py`from errors import InvalidQuantityError, OutOfStockError, UnknownProductError

STOCK = {"PEN-01": 40, "NOTE-02": 3, "BAG-03": 0}


def reserve(code, quantity):
    """Take units out of stock and return how many are left, or raise a ShopError."""
    if not isinstance(quantity, int) or quantity < 1:
        raise InvalidQuantityError(f"quantity must be a positive int, got {quantity!r}")
    if code not in STOCK:
        raise UnknownProductError(code)
    available = STOCK[code]
    if quantity > available:
        raise OutOfStockError(code, quantity, available)
    STOCK[code] = available - quantity
    return STOCK[code]
`

const MAIN_PY = py`from errors import OutOfStockError, ShopError
from inventory import STOCK, reserve

requests = [("PEN-01", 5), ("NOTE-02", 10), ("LAMP-99", 1), ("PEN-01", 0), ("BAG-03", 1)]

for code, quantity in requests:
    try:
        left = reserve(code, quantity)
    except OutOfStockError as err:
        # a specific handler can use the extra fields
        print(f"BACKORDER {err}  -> order {err.requested - err.available} more")
    except ShopError as err:
        # the base class catches every other shop problem
        print(f"REJECTED  {type(err).__name__}: {err}")
    else:
        print(f"RESERVED  {quantity} x {code}, {left} left")

print("stock now:", STOCK)
`

export default {
  id: 'custom-exceptions',
  title: 'Custom exceptions & hierarchies',
  summary: 'Define your own exception classes — named, grouped under one base class and carrying useful fields — so callers can catch exactly the failures they care about.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['raising-exceptions', 'inheritance'],
  related: ['try-except', 'error-handling-patterns', 'exception-groups', 'classes-and-objects', 'special-methods', 'multiple-inheritance-mro', 'modules-and-imports', 'serialization'],
  tags: ['custom exceptions', 'exception hierarchy', 'subclassing Exception', 'Error suffix', 'base exception', 'exception attributes', '__str__', 'super().__init__', 'args', 'pickle', 'library design', 'errors.py'],
  apis: [
    { name: 'class MyError(Exception)', summary: 'Define a new exception type by subclassing Exception (never BaseException).' },
    { name: 'super().__init__(*args)', summary: 'Store the constructor arguments in exc.args — needed for a sensible default message, copying and pickling.' },
    { name: '__str__(self)', summary: 'Controls the message shown by str(exc), print(exc) and the last line of a traceback.' },
    { name: 'exc.args', summary: 'Tuple of the arguments passed to the exception; used by the default __str__, __repr__ and pickling.' },
    { name: 'class Specific(Base, ValueError)', summary: 'Mix in a built-in so existing except ValueError / except LookupError code still catches it.' },
  ],
  docs: [
    { label: 'Python tutorial — user-defined exceptions', url: 'https://docs.python.org/3/tutorial/errors.html#user-defined-exceptions' },
    { label: 'Built-in exceptions — BaseException and args', url: 'https://docs.python.org/3/library/exceptions.html#BaseException' },
    { label: 'PEP 8 — exception names', url: 'https://peps.python.org/pep-0008/#exception-names' },
    { label: 'PEP 249 — the DB-API exception hierarchy (a classic example)', url: 'https://peps.python.org/pep-0249/#exceptions' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`The built-in exceptions you've been [catching](lesson:try-except) and [raising](lesson:raising-exceptions) describe *Python's* problems: a bad value, a missing key, a missing file. But your program has its own vocabulary: an order can be **out of stock**, a card can be **declined**, a user can be **not found**. A **custom exception** is a class you write that names one of those situations:`,
    { code: py`class OutOfStockError(Exception):
    """Not enough units left to fulfil a request."""


def reserve(stock, code, quantity):
    if quantity > stock.get(code, 0):
        raise OutOfStockError(f"only {stock.get(code, 0)} x {code} left")
    stock[code] -= quantity


try:
    reserve({"PEN": 3}, "PEN", 5)
except OutOfStockError as err:
    print("Sorry:", err)        # Sorry: only 3 x PEN left`, lang: 'python', title: 'two lines make a new exception type' },
    py`That's it — a [class](lesson:classes-and-objects) that inherits from \`Exception\`, with a docstring as its body. In this lesson you'll go further: group related errors under a **base class**, attach **fields** (the product code, how many were requested) so handlers don't have to parse messages, control the message with \`__str__\`, and learn when a custom exception is the **wrong** choice.`,
  ],
  why: [
    py`**Callers can catch exactly what they mean.** \`except ValueError\` catches *every* \`ValueError\` — including ones from a bug three calls deeper. \`except OutOfStockError\` catches one specific business situation and nothing else.`,
    py`**Handlers get data, not strings.** A handler that needs "how many short are we?" can read \`err.requested - err.available\` instead of parsing \`"only 3 x PEN left"\` with a regular expression that breaks when someone rewords the message.`,
    py`**Libraries get a stable contract.** Every serious package (requests, SQLAlchemy, the standard library's [\`sqlite3\`](lesson:sql-and-sqlite)) defines a base exception so users can write \`except ThatLibraryError\` once. When the library adds a new failure later, existing handlers keep working.`,
  ],
  eli15: [
    py`Imagine a school with only one kind of note home: "Your child had a problem today." Not very useful! Was it a missed homework, a sports injury, or winning a prize-giving argument? Parents can't react sensibly.`,
    py`Better schools have **different forms**: a Homework Slip, an Injury Report, a Detention Notice — all of them in the "School Notice" family. Each form has **boxes to fill in** (which subject, which date, how many minutes). A parent can say "I deal with Injury Reports right away; any other School Notice can wait until dinner."`,
    py`Custom exceptions are those forms. The **class** is the kind of form, the **base class** is the family ("School Notice"), and the **fields** are the boxes.`,
  ],
  analogy: {
    title: 'Hospital triage categories',
    body: [
      py`An emergency department doesn't log every arrival as "patient has a problem". Triage sorts people into **categories** with a hierarchy: *Injury* → *Fracture*, *Burn*; *Illness* → *Infection*. Each record has **fields** — which bone, what percentage burned — so the right specialist can act without re-examining the patient.`,
      py`Specialists catch narrow categories (the burns unit takes *Burn*). The front desk catches the broad one (*any Injury* goes to the injuries wing). And a new category can be added — *Sports injury* under *Injury* — without retraining the front desk.`,
    ],
    mapping: [
      ['"patient has a problem"', 'raise Exception("something went wrong")'],
      ['a triage category such as Burn', 'a custom exception class: class BurnError(InjuryError)'],
      ['the category family "Injury"', 'a base class: class InjuryError(HospitalError)'],
      ['fields on the triage record', 'attributes on the exception: err.percent, err.location'],
      ['the burns unit', 'except BurnError — a specific handler'],
      ['the front desk handling any injury', 'except InjuryError — catching the base class'],
      ['adding "Sports injury" later', 'a new subclass that existing handlers catch automatically'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'A small, useful hierarchy',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'exc', label: 'Exception', note: 'built-in', x: 380, y: 45, tone: 'paper' },
        { id: 'lookup', label: 'LookupError', note: 'built-in', x: 120, y: 150, tone: 'kraft' },
        { id: 'shop', label: 'ShopError', note: 'your base class', x: 380, y: 150, tone: 'yellow' },
        { id: 'value', label: 'ValueError', note: 'built-in', x: 640, y: 150, tone: 'kraft' },
        { id: 'unknown', label: 'UnknownProductError', note: '.code', x: 150, y: 280, tone: 'blue' },
        { id: 'stock', label: 'OutOfStockError', note: '.code .requested .available', x: 380, y: 280, tone: 'blue' },
        { id: 'qty', label: 'InvalidQuantityError', note: 'message only', x: 610, y: 280, tone: 'blue' },
      ],
      edges: [
        { from: 'shop', to: 'exc', label: 'inherits' },
        { from: 'lookup', to: 'exc' },
        { from: 'value', to: 'exc' },
        { from: 'unknown', to: 'shop' },
        { from: 'stock', to: 'shop' },
        { from: 'qty', to: 'shop' },
        { from: 'unknown', to: 'lookup', dashed: true },
        { from: 'qty', to: 'value', dashed: true },
      ],
      steps: [
        { focus: ['exc'], text: py`Every custom exception inherits (directly or indirectly) from \`Exception\` — **never** from \`BaseException\`, which is reserved for "stop the program" signals like Ctrl+C.` },
        { focus: ['shop'], edges: ['shop->exc'], text: py`One **base class** for the whole app or library: \`class ShopError(Exception)\`. Callers can write \`except ShopError\` to handle *every* shop failure in one place.` },
        { focus: ['unknown', 'stock', 'qty'], edges: ['unknown->shop', 'stock->shop', 'qty->shop'], text: py`A few **specific subclasses** — only for failures a caller might want to handle *differently*. Each can carry fields: \`OutOfStockError\` knows the code, how many were requested and how many are available.` },
        { focus: ['unknown', 'lookup', 'qty', 'value'], edges: ['unknown->lookup', 'qty->value'], text: py`Optional **mix-ins**: \`UnknownProductError(ShopError, LookupError)\` is *also* a \`LookupError\`, so older code that catches \`LookupError\` still works. \`InvalidQuantityError\` is also a \`ValueError\`.` },
        { focus: ['stock', 'shop', 'exc'], text: py`Catching is \`isinstance\`: \`except OutOfStockError\` catches one class; \`except ShopError\` catches all three; \`except Exception\` would catch everything, including bugs — too broad for normal handlers.` },
      ],
    },
    alt: 'Class diagram. Exception at the top. Below it LookupError, ShopError and ValueError. Under ShopError are UnknownProductError, OutOfStockError and InvalidQuantityError. Dashed lines show UnknownProductError also inheriting from LookupError and InvalidQuantityError also inheriting from ValueError.',
    caption: py`Step through it. A good hierarchy is **shallow**: one base class, a handful of meaningful subclasses, optional built-in mix-ins. That's the shape used by \`sqlite3\` (\`sqlite3.Error\` → \`DatabaseError\` → \`IntegrityError\`) and \`json\` (\`JSONDecodeError\` is a \`ValueError\`).`,
  },
  syntax: [
    py`#### The minimum`,
    { code: py`class PaymentError(Exception):
    """Raised when a payment cannot be completed."""`, lang: 'python', title: 'a docstring is a complete body' },
    py`- Inherit from \`Exception\` (or from one of your own exception classes).
- Name it with the **\`Error\` suffix** when it represents an error (PEP 8): \`PaymentError\`, \`NotFoundError\`, \`InvalidQuantityError\`.
- A docstring is enough — no \`pass\` needed — and it documents when the exception is raised.`,
    py`#### A hierarchy for a library or app`,
    { code: py`class ShopError(Exception):
    """Base class for every shop error."""


class UnknownProductError(ShopError, LookupError):
    """The product code is not in the catalogue."""


class OutOfStockError(ShopError):
    """Not enough units left to fulfil a request."""


class PaymentError(ShopError):
    """The payment step failed."""


class CardDeclinedError(PaymentError):
    """The card issuer refused the charge."""`, lang: 'python', title: 'one base, a few meaningful leaves' },
    py`Callers choose their level of detail: \`except CardDeclinedError\` (ask for another card), \`except PaymentError\` (any payment trouble), \`except ShopError\` (anything from the shop, e.g. at the top of a request handler).`,
    py`#### Adding fields and a message`,
    { code: py`class OutOfStockError(ShopError):
    """Not enough units left to fulfil a request."""

    def __init__(self, code, requested, available):
        super().__init__(code, requested, available)   # keep every argument in .args
        self.code = code
        self.requested = requested
        self.available = available

    def __str__(self):                                  # what print(err) and tracebacks show
        return f"wanted {self.requested} x {self.code}, only {self.available} left"`, lang: 'python', static: true, title: 'fields + __str__' },
    py`Two rules make this robust:`,
    py`1. **Pass all constructor arguments to \`super().__init__()\`.** \`BaseException\` stores them in \`self.args\`, and copying or pickling an exception re-creates it by calling \`YourError(*self.args)\`. If \`args\` doesn't match your \`__init__\` signature, \`copy.copy(err)\` and \`pickle.loads(...)\` crash with \`TypeError: … missing 1 required positional argument\`. (Pickling happens more than you'd think: [\`multiprocessing\`](lesson:multiprocessing), task queues, some logging handlers — see [serialization](lesson:serialization).)
2. **Build the message in \`__str__\`**, from the fields ([special methods](lesson:special-methods)). Without it, an exception created with several arguments prints as a tuple: \`('NOTE-02', 10, 3)\`.`,
    py`#### How default messages work`,
    { code: py`class SyncError(Exception):
    """Syncing with the server failed."""


print(repr(str(SyncError())))                    # ''  (no args: empty message)
print(str(SyncError("timeout after 30s")))       # timeout after 30s
print(str(SyncError("timeout", 30)))             # ('timeout', 30)
print(repr(SyncError("timeout", 30)))            # SyncError('timeout', 30)`, lang: 'python', title: 'str() and repr() of an exception' },
    py`#### Where exceptions live`,
    py`Put a package's exceptions in their own module — \`errors.py\` or \`exceptions.py\` — that imports nothing else from the package. Every other module can import from it without circular imports, and users find them in one place: \`from shop.errors import ShopError\`. See [packages](lesson:packages).`,
    { callout: 'tip', title: 'Not every failure deserves a class', text: py`If a built-in already says it precisely — a negative \`amount\` is a \`ValueError\`, a wrong argument type is a \`TypeError\` — use the built-in. Create a custom exception when callers need to **catch it separately**, when it needs **fields**, or when it belongs to your library's public **contract**.` },
  ],
  walkthrough: {
    title: 'Reading the shop program',
    lang: 'python',
    code: MAIN_PY,
    intro: py`This is \`main.py\` from the playground; open \`errors.py\` and \`inventory.py\` there too. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [1, 2], text: py`\`main.py\` imports only what it handles: one specific exception and the base class. It doesn't need to know about \`UnknownProductError\` or \`InvalidQuantityError\` — the base class covers them.` },
      { lines: [4, 4], text: py`Five requests, chosen to trigger every path: a good one, two out-of-stock, an unknown code and an invalid quantity.` },
      { lines: [7, 8], text: py`\`reserve()\` (in \`inventory.py\`) raises a different \`ShopError\` subclass for each problem — with fields where they're useful.` },
      { lines: [9, 11], text: py`The **specific** handler comes first and uses the fields directly: \`err.requested - err.available\`. No message parsing.` },
      { lines: [12, 14], text: py`The **base-class** handler catches every other shop problem. \`type(err).__name__\` shows which subclass it was. A \`KeyError\` from a bug in \`reserve()\` would *not* be caught here — it isn't a \`ShopError\`.` },
      { lines: [15, 18], text: py`\`else\` runs only for successful reservations. Finally the remaining stock is printed: only the first request changed it.` },
    ],
  },
  playground: {
    title: 'Shop errors',
    objective: 'Run it, then add a new exception type and see which handlers pick it up — without touching the handlers.',
    files: { 'main.py': MAIN_PY, 'errors.py': ERRORS_PY, 'inventory.py': INVENTORY_PY },
    expected: py`\`\`\`text
RESERVED  5 x PEN-01, 35 left
BACKORDER wanted 10 x NOTE-02, only 3 left  -> order 7 more
REJECTED  UnknownProductError: no product with code 'LAMP-99'
REJECTED  InvalidQuantityError: quantity must be a positive int, got 0
BACKORDER wanted 1 x BAG-03, only 0 left  -> order 1 more
stock now: {'PEN-01': 35, 'NOTE-02': 3, 'BAG-03': 0}
\`\`\``,
    experiments: [
      {
        id: 'discontinued',
        task: py`The bag is discontinued. In \`errors.py\` add \`class DiscontinuedError(ShopError)\` with a docstring. In \`inventory.py\` add \`DISCONTINUED = {"BAG-03"}\` and make \`reserve()\` raise \`DiscontinuedError(...)\` (with a message of your choice) for those codes **before** the stock check. Don't change \`main.py\` — predict what it prints for the bag.`,
        hint: py`Import the new class in \`inventory.py\`, then add \`if code in DISCONTINUED: raise DiscontinuedError(f"{code} is discontinued")\` right after the unknown-code check.`,
        tests: [
          { name: 'DiscontinuedError is a ShopError', code: py`errors = module("errors")
assert hasattr(errors, "DiscontinuedError"), "Define DiscontinuedError in errors.py"
assert issubclass(errors.DiscontinuedError, errors.ShopError)` },
          { name: 'reserve("BAG-03", 1) raises DiscontinuedError', code: py`with raises(module("errors").DiscontinuedError):
    reserve("BAG-03", 1)` },
          { name: 'main.py reports it without any change', code: py`assert "REJECTED  DiscontinuedError" in output` },
        ],
        explain: py`This is the payoff of a base class: \`main.py\`'s \`except ShopError\` handler caught the new exception **without being edited**. Adding a subclass is a backwards-compatible change to your library; callers only need to change if they want to treat it specially.`,
      },
      {
        id: 'catch-as-lookup',
        task: py`At the end of \`main.py\`, call \`reserve("LAMP-99", 1)\` inside a \`try\` and catch it with \`except LookupError as err:\` — a **built-in** class. Print \`lookup failed:\` followed by the error.`,
        hint: py`\`try:\` / \`    reserve("LAMP-99", 1)\` / \`except LookupError as err:\` / \`    print("lookup failed:", err)\``,
        tests: [
          { name: 'a LookupError handler catches UnknownProductError', code: py`assert "lookup failed: no product with code 'LAMP-99'" in output` },
        ],
        explain: py`\`UnknownProductError(ShopError, LookupError)\` inherits from both, so it's caught by \`except ShopError\` **and** by \`except LookupError\`. Mixing in a built-in lets your exception slot into code that was written for the standard ones — the same reason \`json.JSONDecodeError\` subclasses \`ValueError\`.`,
      },
      {
        id: 'shortfall',
        task: py`Give \`OutOfStockError\` a read-only \`shortfall\` property that returns \`requested - available\`, then use \`err.shortfall\` in \`main.py\` instead of doing the subtraction there.`,
        hint: py`Inside the class: \`@property\` / \`def shortfall(self):\` / \`    return self.requested - self.available\`.`,
        tests: [
          { name: 'OutOfStockError has a shortfall property', code: py`err = module("errors").OutOfStockError("PEN-01", 5, 2)
assert err.shortfall == 3` },
          { name: 'main.py still reports the right shortfall', code: py`assert "order 7 more" in output` },
        ],
        explain: py`Exceptions are ordinary classes, so they can have [properties](lesson:properties-and-encapsulation) and methods. Putting derived facts on the exception keeps that logic in one place instead of repeating it in every handler. (Keep them cheap and side-effect free — exceptions are data, not services.)`,
      },
      {
        id: 'no-str',
        task: py`Comment out the \`__str__\` method of \`OutOfStockError\` and run. What do the BACKORDER lines look like now, and why? Put it back afterwards.`,
        hint: py`What did we pass to \`super().__init__()\`?`,
        explain: py`Without \`__str__\`, \`BaseException.__str__\` is used: with one argument it shows that argument, with several it shows the whole \`args\` tuple — \`('NOTE-02', 10, 3)\`. Keeping all the arguments in \`args\` is right (copying and pickling need it), so the readable message belongs in \`__str__\`.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Raise a custom exception, catch it by its base class',
    props: {
      code: py`class ShopError(Exception):
    """Base class for every shop error."""


class OutOfStockError(ShopError):
    def __init__(self, code, requested, available):
        super().__init__(code, requested, available)
        self.code = code
        self.requested = requested
        self.available = available

    def __str__(self):
        return f"only {self.available} x {self.code} left"


def reserve(stock, code, quantity):
    if quantity > stock[code]:
        raise OutOfStockError(code, quantity, stock[code])
    stock[code] -= quantity


stock = {"PEN": 3}
try:
    reserve(stock, "PEN", 5)
except ShopError as err:
    print(type(err).__name__, "-", err, "- short by", err.requested - err.available)
`,
      notes: {
        1: 'Defining an exception class is just defining a class: a `class` object appears in the global frame.',
        18: 'Asking for 5 when only 3 are left: Python builds an OutOfStockError object, which runs `__init__`…',
        7: '`super().__init__(...)` stores all three arguments in `err.args` (needed for copying and pickling).',
        8: 'Then the fields are attached as ordinary attributes.',
        25: 'The exception unwinds out of `reserve()`. `except ShopError` matches because OutOfStockError **is a** ShopError.',
        26: 'Printing `err` calls our `__str__`; the handler also reads the fields directly.',
      },
    },
    alt: 'Step-by-step trace: two classes are defined, ShopError and OutOfStockError. reserve() is called with a quantity of 5 when only 3 are in stock, so it creates an OutOfStockError; its __init__ runs, storing args and setting code, requested and available. The exception leaves reserve() and is caught by except ShopError, which prints "OutOfStockError - only 3 x PEN left - short by 2".',
    caption: py`Watch \`__init__\` run when the exception is **created**, then the frame for \`reserve()\` disappear when it is **raised**. The handler names the base class, yet receives the full subclass instance with all its fields.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`There is nothing magic about exception classes. \`raise OutOfStockError(...)\` creates an instance like any other object; \`except ShopError\` asks "is this object an instance of \`ShopError\` (or a subclass)?" — exactly what \`isinstance(err, ShopError)\` checks. Inheritance *is* the grouping mechanism.`,
      py`So everything you know about classes applies: attributes, methods, properties, inheritance, \`super()\`. See [inheritance & super()](lesson:inheritance).`,
    ],
    technical: [
      py`**\`args\` and the default methods.** \`BaseException\` keeps the constructor arguments in \`self.args\`. Its \`__str__\` returns \`''\` for no arguments, \`str(arg)\` for one, and \`str(args)\` for several; its \`__repr__\` is \`ClassName(*args)\`. Overriding \`__str__\` changes the message everywhere: \`print(err)\`, f-strings, logging, and the last line of a traceback.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, \`BaseException.__new__\` stores the arguments in \`args\` *before* \`__init__\` runs, so even an \`__init__\` that forgets \`super().__init__()\` ends up with \`args\` set — but calling \`super().__init__(message)\` with **different** arguments overwrites them. Don't rely on the \`__new__\` behaviour; always pass the full argument list explicitly.` },
      py`**Copying and pickling** use \`BaseException.__reduce__\`, which returns \`(type(self), self.args, self.__dict__)\`: re-create with \`YourError(*args)\`, then restore attributes. That's why \`args\` must be valid constructor arguments.`,
      { code: py`import pickle


class BadError(Exception):
    def __init__(self, code, requested):
        super().__init__(f"cannot take {requested} x {code}")   # args no longer match __init__
        self.code, self.requested = code, requested


class GoodError(Exception):
    def __init__(self, code, requested):
        super().__init__(code, requested)                        # args match __init__
        self.code, self.requested = code, requested

    def __str__(self):
        return f"cannot take {self.requested} x {self.code}"


for cls in (GoodError, BadError):
    try:
        copy_ = pickle.loads(pickle.dumps(cls("PEN", 5)))
        print(cls.__name__, "round-trips:", copy_)
    except TypeError as err:
        print(cls.__name__, "breaks:", err)`, lang: 'python', title: 'why super().__init__ needs all the arguments' },
      py`**Traceback names.** For classes defined outside \`__main__\` and \`builtins\`, the last traceback line shows the module too: \`errors.OutOfStockError: wanted 10 x NOTE-02, only 3 left\`. That's a hint to readers about where to look.`,
      py`**Multiple inheritance.** \`class UnknownProductError(ShopError, LookupError)\` has the MRO *UnknownProductError → ShopError → LookupError → Exception → BaseException → object*. It works because both bases ultimately share \`Exception\`. Some pairs of *built-in* exception bases can't be combined because their C-level layouts differ — CPython rejects, for example, \`class X(OSError, SyntaxError)\` with \`TypeError: multiple bases have instance lay-out conflict\`. Mixing your own classes with one built-in, as here, is always fine. See [MRO](lesson:multiple-inheritance-mro).`,
      py`**Class attributes as metadata.** Subclasses can override class-level facts that handlers read generically: \`retryable = True\`, \`http_status = 404\`. A web layer can then map *any* \`ShopError\` to an HTTP response without a long \`if\`/\`elif\` chain.`,
    ],
    production: [
      py`**One base class per distribution**, exported from a stable location (\`yourlib.errors\` or the package root). Document which functions raise which subclasses — the exception classes are part of your public API, just like function signatures.`,
      py`**Evolve compatibly.** Adding a new subclass under an existing base is safe: old handlers still catch it. Renaming, moving or re-parenting an exception breaks users' \`except\` clauses — keep an alias (\`OldName = NewName\`) for a deprecation period.`,
      py`**Translate at the boundary** and chain the cause: a storage layer catches \`sqlite3.IntegrityError\` and raises \`DuplicateOrderError(order_id) from err\`. Callers depend on your exception, debugging still shows the database error ([raising exceptions](lesson:raising-exceptions), [error-handling patterns](lesson:error-handling-patterns)).`,
      py`**Keep exceptions dumb.** No I/O, logging or network calls in \`__init__\` or \`__str__\` — an exception may be created on a hot path, during shutdown, or inside another failure. And never store secrets (passwords, tokens, full card numbers) in fields: exceptions end up in logs and error trackers.`,
      py`**Machine-readable fields** (\`code="OUT_OF_STOCK"\`, \`status=409\`) let an API return structured errors without parsing messages ([building APIs](lesson:building-apis)), and let monitoring group errors reliably even when the human-readable message changes.`,
    ],
  },
  mistakes: [
    {
      title: 'Inheriting from BaseException',
      wrong: { code: py`class PaymentError(BaseException):
    """Raised when a card payment fails."""`, lang: 'python' },
      right: { code: py`class PaymentError(Exception):
    """Raised when a card payment fails."""`, lang: 'python' },
      explanation: py`\`BaseException\` is for signals that should stop the program (\`KeyboardInterrupt\`, \`SystemExit\`). A subclass of it slips past every \`except Exception\` handler — including the top-level one that would have logged it.`,
    },
    {
      title: 'super().__init__ with different arguments',
      wrong: { code: py`class OutOfStockError(Exception):
    def __init__(self, code, available):
        super().__init__(f"only {available} x {code} left")
        self.code = code
        self.available = available`, lang: 'python' },
      right: { code: py`class OutOfStockError(Exception):
    def __init__(self, code, available):
        super().__init__(code, available)
        self.code = code
        self.available = available

    def __str__(self):
        return f"only {self.available} x {self.code} left"`, lang: 'python' },
      explanation: py`The wrong version works until someone copies or pickles the exception (multiprocessing, task queues): Python calls \`OutOfStockError("only 2 x PEN left")\` and crashes with \`TypeError: … missing 1 required positional argument: 'available'\`. Keep \`args\` equal to the constructor arguments and format the message in \`__str__\`.`,
    },
    {
      title: 'Raising the base class instead of a specific one',
      wrong: { code: py`if quantity > available:
    raise ShopError("out of stock")`, lang: 'python', static: true },
      right: { code: py`if quantity > available:
    raise OutOfStockError(code, quantity, available)`, lang: 'python', static: true },
      explanation: py`The base class exists for *catching* groups. If you raise it directly, no caller can tell "out of stock" from "card declined" without reading the message.`,
    },
    {
      title: 'One class per tiny variation',
      wrong: { code: py`class NotFound404Error(ApiError): ...
class Gone410Error(ApiError): ...
class TooManyRequests429Error(ApiError): ...
# ...forty more, one per HTTP status`, lang: 'python', static: true },
      right: { code: py`class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(status, message)
        self.status = status
        self.message = message


class NotFoundError(ApiError):
    """404 — callers often handle this one specially."""


class ServerError(ApiError):
    """5xx — usually worth retrying."""`, lang: 'python' },
      explanation: py`Make a subclass only when callers will catch it **separately**. Everything else is a field (\`err.status\`). A huge hierarchy is hard to learn and every class is a public API you must keep forever.`,
    },
    {
      title: 'Doing work inside the exception',
      wrong: { code: py`class PaymentError(Exception):
    def __init__(self, order_id):
        super().__init__(order_id)
        send_alert_email(order_id)      # I/O while an error is already happening!`, lang: 'python', static: true },
      right: { code: py`class PaymentError(Exception):
    def __init__(self, order_id):
        super().__init__(order_id)
        self.order_id = order_id

# the handler decides whether to alert:
# except PaymentError as err: alerts.notify(err.order_id)`, lang: 'python', static: true },
      explanation: py`Creating an exception should be cheap and can't fail. Side effects in \`__init__\` run even when a caller was about to handle the error quietly, and if the email server is down you now have two failures.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: OutOfStockError.__init__() missing 1 required positional argument: 'available'`,
      cause: py`Appears when copying or unpickling the exception (e.g. sending it between processes). \`__init__\` passed a different argument list (usually one message string) to \`super().__init__()\`, so \`args\` can't rebuild the object.`,
      fix: py`Call \`super().__init__(code, available)\` with the same arguments \`__init__\` receives, and move the message formatting into \`__str__\`.`,
    },
    {
      symptom: py`My top-level except Exception handler doesn't catch our PaymentError.`,
      cause: py`The class (or one of its bases) inherits from \`BaseException\` instead of \`Exception\`.`,
      fix: py`Change the base to \`Exception\` (or to your library's base class, which itself inherits from \`Exception\`).`,
    },
    {
      symptom: py`print(err) shows a tuple like ('NOTE-02', 10, 3)`,
      cause: py`The exception was created with several arguments and has no \`__str__\`, so the default \`str(self.args)\` is used.`,
      fix: py`Add a \`__str__\` that builds a sentence from the fields.`,
    },
    {
      symptom: py`ImportError: cannot import name 'ShopError' from partially initialized module 'shop.orders' (most likely due to a circular import)`,
      cause: py`Exceptions are defined in a module that also imports the modules that use them.`,
      fix: py`Move all exceptions into a leaf module (\`shop/errors.py\`) that imports nothing from your package, and import them from there everywhere.`,
    },
  ],
  bestPractices: [
    'Inherit from Exception (or your own base class), never from BaseException.',
    'Give each library or app one base exception class and a few meaningful subclasses.',
    'Name exceptions with the Error suffix and give each a docstring saying when it is raised.',
    'Store context as attributes, pass all constructor arguments to super().__init__(), and format the message in __str__.',
    'Create a subclass only when callers will handle it differently; otherwise use a field or a built-in.',
    'Mix in a built-in (ValueError, LookupError) when your error is a special case of it.',
    'Keep exceptions in their own module, free of side effects and secrets.',
  ],
  whenToUse: {
    use: [
      'Callers need to catch this failure separately from others (OutOfStockError vs CardDeclinedError).',
      'Handlers need structured data about the failure (codes, ids, amounts, status).',
      'You publish a library and want users to catch all of its errors with one base class.',
      'Translating low-level errors (database, HTTP, file system) into your domain at a boundary.',
    ],
    avoid: [
      'A built-in already says it precisely: bad argument value → ValueError, wrong type → TypeError.',
      'Inside a small script or private helper where nobody will catch the error specially.',
      'One class per message or per status code — use a field instead.',
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'custom-exceptions-q1',
      type: 'mcq',
      prompt: 'Which class should a custom exception for your application normally inherit from?',
      options: [
        { text: 'BaseException', why: 'BaseException is reserved for exceptions that should normally stop the program (KeyboardInterrupt, SystemExit). Subclasses of it escape except Exception handlers.' },
        'Exception (or a custom base class that inherits from Exception)',
        { text: 'object', why: 'Only BaseException subclasses can be raised: raise on a plain object gives TypeError.' },
        { text: 'Error', why: 'There is no built-in class called Error. (Error is a naming suffix convention.)' },
      ],
      answer: 1,
      explanation: py`\`Exception\` is the root of all "ordinary" errors. Inheriting from it — usually via your own \`AppError\` base — means generic handlers and logging catch your errors as expected.`,
    },
    {
      id: 'custom-exceptions-q2',
      type: 'output',
      prompt: 'Predict the three lines.',
      code: py`class AppError(Exception): pass
class NotFoundError(AppError): pass
class PermissionDeniedError(AppError): pass

for exc in (NotFoundError("user 7"), PermissionDeniedError("admin only"), KeyError("id")):
    try:
        raise exc
    except NotFoundError:
        print("404")
    except AppError as e:
        print("app:", e)
    except Exception as e:
        print("other:", type(e).__name__)`,
      answer: py`404
app: admin only
other: KeyError`,
      explanation: py`The first matching clause wins. \`NotFoundError\` hits the specific handler. \`PermissionDeniedError\` is an \`AppError\`, so the base-class handler catches it. \`KeyError\` isn't an \`AppError\`, so only \`except Exception\` matches.`,
    },
    {
      id: 'custom-exceptions-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class OutOfStockError(Exception):
    def __init__(self, code, available):
        super().__init__(code, available)
        self.code = code

print(OutOfStockError("PEN", 2))`,
      options: [
        "('PEN', 2)",
        { text: 'PEN', why: 'The default __str__ only shows a single argument on its own. With two arguments it shows the whole args tuple.' },
        { text: 'OutOfStockError: PEN 2', why: 'That format appears on the last line of a traceback, not from print(). And the args are shown as a tuple.' },
        { text: 'An empty line', why: 'The message is empty only when the exception has no arguments at all.' },
      ],
      answer: 0,
      explanation: py`With no \`__str__\`, \`BaseException.__str__\` returns \`str(self.args)\` when there are several arguments. Add a \`__str__\` that builds a readable sentence from the fields.`,
    },
    {
      id: 'custom-exceptions-q4',
      type: 'bug',
      prompt: 'The friendly "payment failed" message never appears — the program crashes with a traceback instead. Click the line that causes it.',
      code: py`class PaymentError(BaseException):
    """Raised when a card payment fails."""

def pay(amount):
    raise PaymentError(f"card declined for {amount}")

try:
    pay(20)
except Exception:
    print("payment failed, please try another card")`,
      answerLine: 1,
      explanation: py`\`PaymentError\` inherits from \`BaseException\`, which is *above* \`Exception\` in the hierarchy, so \`except Exception\` doesn't match it. Inherit from \`Exception\`.`,
    },
    {
      id: 'custom-exceptions-q5',
      type: 'fill',
      prompt: 'Complete the hierarchy: a base class for the shop, and a subclass that keeps both arguments in `args` (so it can be copied and pickled).',
      code: py`class ___(Exception):
    """Base class for every error raised by the shop."""


class OutOfStockError(ShopError):
    def __init__(self, code, requested):
        ___.__init__(code, requested)
        self.code = code
        self.requested = requested`,
      answer: [['ShopError'], ['super()']],
      explanation: py`The base class must be called \`ShopError\` because the subclass inherits from it. \`super().__init__(code, requested)\` stores both arguments in \`self.args\`.`,
    },
    {
      id: 'custom-exceptions-q6',
      type: 'mcq',
      prompt: 'In which situation is a custom exception class the **least** useful?',
      options: [
        { text: 'A payments library wants users to catch all its errors at once', why: 'That is exactly what a library base class (PaymentsError) is for.' },
        { text: 'A handler needs the order id and amount of a failed charge', why: 'Fields on a custom exception give handlers structured data.' },
        'A private helper receives a negative number where only positives make sense',
        { text: 'Callers must treat "card declined" differently from "network timeout"', why: 'Separate handling is the main reason to create separate classes.' },
      ],
      answer: 2,
      explanation: py`A bad argument value is precisely what \`ValueError\` means, and nobody will catch it specially. Inventing \`NegativeNumberError\` adds API surface with no benefit.`,
    },
    {
      id: 'custom-exceptions-q7',
      type: 'short',
      prompt: 'Why should a library define one base exception class that all its other exceptions inherit from?',
      answer: py`So users can catch every error from the library with one clause (except MyLibError) without also catching unrelated errors or bugs (which except Exception would). It also makes the library easier to evolve: new subclasses added later are still caught by existing handlers, and it documents in one place what the library can raise.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'bank-errors',
      title: 'Bank account errors',
      difficulty: 'intermediate',
      prompt: py`Build a small exception hierarchy and use it in \`withdraw(account, amount)\`. An account is a dict like \`{"id": "ACC-1", "balance": 50, "frozen": False}\`.

1. \`BankError(Exception)\` — the base class (already there).
2. \`AccountFrozenError(BankError)\` — raised when \`account["frozen"]\` is true.
3. \`InsufficientFundsError(BankError)\` — created as \`InsufficientFundsError(balance, amount)\`. It must have attributes \`balance\` and \`amount\`, a \`shortfall\` property (\`amount - balance\`), and \`str(err)\` must be exactly \`cannot withdraw 80: balance is 50 (short by 30)\` for balance 50 and amount 80.

\`withdraw\` checks, in this order: \`amount <= 0\` → raise a **built-in** \`ValueError\` (a bad argument is not a banking situation); frozen → \`AccountFrozenError\`; not enough money → \`InsufficientFundsError\`. Otherwise subtract the amount and return the new balance.`,
      files: {
        'main.py': py`class BankError(Exception):
    """Base class for every banking error."""


# TODO: AccountFrozenError and InsufficientFundsError


def withdraw(account, amount):
    """Subtract amount from the balance and return the new balance, or raise."""
    # TODO: validate the amount, then the account state
    account["balance"] -= amount
    return account["balance"]


account = {"id": "ACC-1", "balance": 50, "frozen": False}
print(withdraw(account, 20))
`,
      },
      hints: [
        'AccountFrozenError needs nothing but a docstring. InsufficientFundsError needs __init__(self, balance, amount), a @property and __str__.',
        'In __init__, call super().__init__(balance, amount) before setting self.balance and self.amount.',
        'def __str__(self):\n    return f"cannot withdraw {self.amount}: balance is {self.balance} (short by {self.shortfall})"',
      ],
      solution: {
        explanation: py`\`AccountFrozenError\` carries only a message, so a docstring is its whole body. \`InsufficientFundsError\` carries data: \`super().__init__(balance, amount)\` keeps \`args\` aligned with the constructor (so copying and pickling work), the attributes give handlers the numbers, \`shortfall\` derives a value in one place, and \`__str__\` builds the sentence. A non-positive amount is a plain bad argument, so the built-in \`ValueError\` is the honest choice — and because it isn't a \`BankError\`, a handler for banking situations won't accidentally treat a programming mistake as "insufficient funds".`,
        files: {
          'main.py': py`class BankError(Exception):
    """Base class for every banking error."""


class AccountFrozenError(BankError):
    """The account is frozen, so no money can leave it."""


class InsufficientFundsError(BankError):
    """The balance is lower than the amount requested."""

    def __init__(self, balance, amount):
        super().__init__(balance, amount)
        self.balance = balance
        self.amount = amount

    @property
    def shortfall(self):
        return self.amount - self.balance

    def __str__(self):
        return f"cannot withdraw {self.amount}: balance is {self.balance} (short by {self.shortfall})"


def withdraw(account, amount):
    """Subtract amount from the balance and return the new balance, or raise."""
    if amount <= 0:
        raise ValueError(f"amount must be positive, got {amount}")
    if account["frozen"]:
        raise AccountFrozenError(f"account {account['id']} is frozen")
    if amount > account["balance"]:
        raise InsufficientFundsError(account["balance"], amount)
    account["balance"] -= amount
    return account["balance"]


account = {"id": "ACC-1", "balance": 50, "frozen": False}
print(withdraw(account, 20))
try:
    withdraw(account, 80)
except BankError as err:
    print(type(err).__name__, "-", err)
`,
        },
      },
      tests: [
        { name: 'the hierarchy is right', code: py`assert issubclass(BankError, Exception)
assert issubclass(AccountFrozenError, BankError)
assert issubclass(InsufficientFundsError, BankError)` },
        { name: 'a normal withdrawal returns the new balance', code: py`acct = {"id": "A", "balance": 100, "frozen": False}
assert withdraw(acct, 30) == 70
assert acct["balance"] == 70` },
        { name: 'insufficient funds: fields, shortfall and message', code: py`acct = {"id": "A", "balance": 50, "frozen": False}
with raises(InsufficientFundsError) as caught:
    withdraw(acct, 80)
err = caught.value
assert (err.balance, err.amount, err.shortfall) == (50, 80, 30)
assert str(err) == "cannot withdraw 80: balance is 50 (short by 30)"
assert acct["balance"] == 50, "the balance must not change when the withdrawal fails"` },
        { name: 'a frozen account raises AccountFrozenError', code: py`acct = {"id": "A", "balance": 500, "frozen": True}
with raises(AccountFrozenError):
    withdraw(acct, 10)
assert acct["balance"] == 500` },
        { name: 'a non-positive amount is a ValueError, not a BankError', code: py`acct = {"id": "A", "balance": 50, "frozen": False}
with raises(ValueError) as caught:
    withdraw(acct, -5)
assert not isinstance(caught.value, BankError)` },
        { name: 'InsufficientFundsError survives copying', code: py`import copy
err = copy.copy(InsufficientFundsError(10, 25))
assert err.shortfall == 15` },
      ],
    },
    {
      id: 'api-errors',
      title: 'Errors for an API client',
      difficulty: 'intermediate',
      prompt: py`You're writing a client for a web API. Design its exceptions:

- \`ApiError(Exception)\`, created as \`ApiError(status, message)\`, with attributes \`status\` and \`message\`, \`str(err)\` == \`"<status>: <message>"\` (e.g. \`404: no such user\`), and a **class attribute** \`retryable = False\`.
- Subclasses \`NotFoundError\`, \`RateLimitedError\` and \`ServerError\`; the last two set \`retryable = True\`.
- \`error_for(status, message)\` **returns** (doesn't raise) the right instance: 404 → \`NotFoundError\`, 429 → \`RateLimitedError\`, 500–599 → \`ServerError\`, anything else → plain \`ApiError\`.
- Every error must survive a \`pickle\` round trip with its type, status and message intact — so pass **all** constructor arguments to \`super().__init__()\`.

Write everything in **\`api_errors.py\`** — exceptions belong in their own module (and \`pickle\` finds a class by its module path, so the tests import it from there). \`main.py\` just tries it out.`,
      files: {
        'main.py': py`from api_errors import error_for

print(error_for(404, "no such user"))
`,
        'api_errors.py': py`class ApiError(Exception):
    """Base class for errors returned by the API."""

    def __init__(self, status, message):
        super().__init__(f"{status}: {message}")
        self.status = status
        self.message = message


# TODO: retryable flag, NotFoundError, RateLimitedError, ServerError


def error_for(status, message):
    """Return (don't raise) the right ApiError subclass for an HTTP status."""
    return ApiError(status, message)
`,
      },
      hints: [
        'Class attributes are written in the class body: retryable = False in ApiError, retryable = True in the two retryable subclasses.',
        'The starter passes one formatted string to super().__init__, which breaks pickling (ApiError would be re-created with one argument). Pass status and message, and add __str__.',
        'In error_for, pick the class first (if status == 404: cls = NotFoundError ...), then return cls(status, message).',
      ],
      solution: {
        explanation: py`The hierarchy is deliberately small: only the statuses callers handle differently get a class, and everything else is described by the \`status\` field. \`retryable\` is a class attribute, so a retry loop can ask \`err.retryable\` instead of maintaining its own list of types — and a future \`GatewayTimeoutError(ServerError)\` inherits \`True\` automatically. Passing \`(status, message)\` to \`super().__init__()\` makes \`args\` match the constructor, so \`pickle\` (which re-creates the exception as \`cls(*args)\`) works; \`__str__\` produces the human-readable form. \`error_for\` returns rather than raises so the caller decides when to raise, and can add \`from err\` if there's an underlying cause.`,
        files: {
          'main.py': py`from api_errors import error_for

print(error_for(404, "no such user"))
for status in (404, 429, 503, 418):
    err = error_for(status, "example")
    print(status, type(err).__name__, "retryable" if err.retryable else "final")
`,
          'api_errors.py': py`class ApiError(Exception):
    """Base class for errors returned by the API."""

    retryable = False

    def __init__(self, status, message):
        super().__init__(status, message)
        self.status = status
        self.message = message

    def __str__(self):
        return f"{self.status}: {self.message}"


class NotFoundError(ApiError):
    """404: the resource does not exist."""


class RateLimitedError(ApiError):
    """429: too many requests; try again later."""

    retryable = True


class ServerError(ApiError):
    """5xx: the server failed; trying again may work."""

    retryable = True


def error_for(status, message):
    """Return (don't raise) the right ApiError subclass for an HTTP status."""
    if status == 404:
        cls = NotFoundError
    elif status == 429:
        cls = RateLimitedError
    elif 500 <= status <= 599:
        cls = ServerError
    else:
        cls = ApiError
    return cls(status, message)
`,
        },
      },
      tests: [
        { name: 'the classes exist and inherit from ApiError', code: py`api = module("api_errors")
for name in ("NotFoundError", "RateLimitedError", "ServerError"):
    assert hasattr(api, name), f"Define {name} in api_errors.py"
    assert issubclass(getattr(api, name), api.ApiError)` },
        { name: '404 gives a NotFoundError with fields and message', code: py`api = module("api_errors")
err = api.error_for(404, "no such user")
assert type(err).__name__ == "NotFoundError"
assert (err.status, err.message) == (404, "no such user")
assert str(err) == "404: no such user"` },
        { name: 'other statuses map correctly', code: py`api = module("api_errors")
assert type(api.error_for(429, "slow down")).__name__ == "RateLimitedError"
assert type(api.error_for(503, "unavailable")).__name__ == "ServerError"
assert type(api.error_for(500, "oops")).__name__ == "ServerError"
assert type(api.error_for(418, "teapot")) is api.ApiError` },
        { name: 'retryable flags', code: py`api = module("api_errors")
assert api.error_for(429, "x").retryable is True
assert api.error_for(502, "x").retryable is True
assert api.error_for(404, "x").retryable is False
assert api.error_for(400, "x").retryable is False` },
        { name: 'errors survive a pickle round trip', code: py`import pickle
api = module("api_errors")
err = pickle.loads(pickle.dumps(api.error_for(404, "gone")))
assert type(err).__name__ == "NotFoundError"
assert (err.status, err.message, str(err)) == (404, "gone", "404: gone")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'custom-exceptions-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why would you define a custom exception instead of raising ValueError or Exception with a message?',
      answer: 'So callers can catch that specific failure without catching unrelated ones, handlers can read structured fields instead of parsing messages, and a library can offer one base class as a stable contract. Use built-ins when they already describe the problem precisely.',
      explanation: py`\`except ValueError\` also catches \`ValueError\`s from bugs deep in the call stack. \`except OutOfStockError\` is unambiguous. Fields (\`err.requested\`, \`err.available\`) survive message rewording; a base class (\`ShopError\`) lets users handle everything from your code in one clause.`,
      whyAsked: 'Checks whether you design errors as part of an API rather than as afterthoughts.',
      mistakes: ['Saying custom exceptions are "more professional" without a concrete benefit', 'Suggesting a custom class for every possible error'],
      followUps: ['When would you NOT create one?', 'What would you put in the base class?', 'How do you add data to an exception?'],
      modelAnswer: 'A custom exception gives a failure its own type, and types are what except clauses match on. If I raise ValueError for "out of stock", a caller catching ValueError would also catch genuine bugs, and they would have to parse my message to get details. With OutOfStockError the caller catches exactly that situation and reads fields like requested and available directly. For a library I also define one base class, so users can catch everything from my library in one place. But if a built-in like ValueError already describes a bad argument precisely, I just use the built-in.',
    },
    {
      id: 'custom-exceptions-sdk-hierarchy',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 6,
      question: 'Design the exception hierarchy for a payments SDK used by other teams. What classes, what fields, and how do you keep it maintainable?',
      answer: 'One base PaymentsError(Exception); a few subclasses for situations callers handle differently — e.g. CardDeclinedError (with decline_code), AuthenticationError, RateLimitedError (retry_after), ApiConnectionError (retryable), InvalidRequestError (also a ValueError). Common fields on the base (http_status, request_id), message via __str__, all args passed to super().__init__, a retryable class attribute, low-level errors translated with raise … from, exceptions in a payments.errors module and documented per function.',
      explanation: py`Good hierarchies are shallow and driven by **caller decisions**: "ask for another card", "fix credentials", "back off and retry", "fix the request". Everything else is fields. Stability matters because every class is public API: add subclasses freely, never rename or re-parent without an alias.`,
      code: { lang: 'python', code: py`class PaymentsError(Exception):
    """Base class for every error raised by the payments SDK."""

    retryable = False

    def __init__(self, message, *, http_status=None, request_id=None):
        super().__init__(message)
        self.http_status = http_status
        self.request_id = request_id


class CardDeclinedError(PaymentsError):
    """The issuer declined the card; ask the customer for another one."""


class RateLimitedError(PaymentsError):
    """Too many requests; wait and retry."""

    retryable = True


class InvalidRequestError(PaymentsError, ValueError):
    """The request was malformed; retrying will not help."""` },
      whyAsked: 'Library and service design questions show seniority: they combine API design, backwards compatibility and operational concerns.',
      mistakes: ['One class per HTTP status code', 'No common base class', 'Leaking third-party exceptions (requests.ConnectionError) to users', 'Putting card numbers or API keys in exception fields'],
      followUps: ['How do you handle a new error type the API starts returning?', 'Should network errors be wrapped?', 'How would users write a retry loop with this design?'],
      modelAnswer: 'I start from what callers will do differently. A declined card means "ask for another card"; an authentication error means "fix configuration"; rate limiting and connection errors mean "retry later"; an invalid request means "fix the code". Each of those gets a subclass of a single PaymentsError base, which inherits from Exception. Common context like http_status and request_id lives on the base, and a retryable class attribute lets callers write generic retry logic. Low-level errors from the HTTP library are translated at the boundary with raise from, so users never depend on our transport. Everything lives in a payments.errors module, is documented per function, and new subclasses are added under existing ones so old handlers keep working.',
    },
    {
      id: 'custom-exceptions-pickle-bug',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: py`Our task queue reports \`TypeError: QuotaExceededError.__init__() missing 1 required positional argument: 'limit'\` whenever a job fails with \`QuotaExceededError\`. The class works fine in a normal \`try/except\`. What's going on?`,
      code: { lang: 'python', code: py`class QuotaExceededError(Exception):
    def __init__(self, user, limit):
        super().__init__(f"{user} exceeded their quota of {limit}")
        self.user = user
        self.limit = limit` },
      answer: 'The queue pickles the exception to send it between processes. Exceptions pickle as (type, self.args, __dict__) and are rebuilt by calling QuotaExceededError(*args). args holds only the formatted message, so the rebuild calls __init__ with one argument. Fix: super().__init__(user, limit) and build the message in __str__.',
      explanation: py`\`BaseException.__reduce__\` re-creates the exception from \`args\`, then restores \`__dict__\`. Any mismatch between \`args\` and the \`__init__\` signature breaks \`pickle\`, \`copy.copy\` and \`copy.deepcopy\` — which is why it only appears in multiprocessing, task queues or code that copies exceptions.`,
      whyAsked: 'A real production bug that only appears across process boundaries; it tests knowledge of how exceptions are serialised.',
      mistakes: ['Blaming the task queue', 'Adding a default value limit=None (hides the bug, loses data)', 'Not knowing exceptions are pickled via args'],
      followUps: ['How could you write a test that catches this?', 'What about keyword-only arguments in __init__?', 'Would a dataclass-based exception have the same issue?'],
      modelAnswer: 'The exception is fine locally, but the task queue sends it to another process, which means pickling it. Exceptions pickle through BaseException.__reduce__, which records the class, self.args and the instance dict, and on the other side calls the class with *args. Here __init__ passed a single formatted message to super().__init__, so args is a one-element tuple and the rebuild calls __init__ with one argument — missing limit. The fix is to pass user and limit to super().__init__ so args matches the signature, and move the message into __str__. I would add a unit test that pickles and unpickles every custom exception.',
    },
    {
      id: 'custom-exceptions-builtin-mixin',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Should `InvalidQuantityError` inherit only from your `ShopError`, or from both `ShopError` and `ValueError`? Compare the options.',
      answer: 'Inheriting from both makes it catchable as a ShopError and as a ValueError, so generic code (and code written before your exception existed) still works — the approach json.JSONDecodeError takes with ValueError. The cost is that broad except ValueError handlers will catch it too. Mix in a built-in when your error genuinely is a special case of it.',
      explanation: py`Multiple inheritance with exceptions is common and safe when the built-in is a plain \`Exception\` subclass (\`ValueError\`, \`LookupError\`, \`TypeError\`). It helps migrations: a function that used to raise \`ValueError\` can start raising \`InvalidQuantityError(ShopError, ValueError)\` without breaking callers.`,
      code: { lang: 'python', code: py`class ShopError(Exception):
    """Base class for every shop error."""


class InvalidQuantityError(ShopError, ValueError):
    """The quantity is not a positive whole number."""


for handler in (ShopError, ValueError):
    try:
        raise InvalidQuantityError("quantity must be positive, got 0")
    except handler as err:
        print(f"caught by except {handler.__name__}: {err}")` },
      whyAsked: 'Tests practical judgement about API compatibility and multiple inheritance.',
      mistakes: ['Thinking exceptions cannot use multiple inheritance', 'Mixing in a built-in that does not describe the error just to make it "catchable"'],
      followUps: ['Can any two built-in exception classes be combined as bases?', 'What does the MRO look like?', 'How does this help a migration from ValueError to a custom error?'],
      modelAnswer: 'If the error really is a kind of bad value, I inherit from both. Then callers can catch it as part of my library with except ShopError, and generic code that already catches ValueError keeps working — json.JSONDecodeError does the same thing. It is especially useful when migrating: a function that used to raise ValueError can switch to the custom type without breaking anyone. The trade-off is that broad ValueError handlers will also catch it, so I only mix in a built-in when the "is a" relationship is genuinely true.',
    },
    {
      id: 'custom-exceptions-validation-error',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: py`Write \`ValidationError\`, a subclass of \`ValueError\`, created with a dict of field errors: \`ValidationError({"email": "missing @", "age": "must be >= 0"})\`. It must expose the dict as \`.errors\`, and \`str(err)\` lists the problems **sorted by field name**, joined by \`"; "\`: \`age: must be >= 0; email: missing @\`. Then write \`validate_user(data)\` that checks **all** rules and raises one \`ValidationError\` with every problem, or returns \`data\` if it is valid. Rules: \`name\` must be a non-empty string (\`"required"\`), \`email\` must contain \`@\` (\`"missing @"\`), \`age\` must be an int ≥ 0 (\`"must be >= 0"\`).`,
      answer: 'Store the dict, pass it to super().__init__ (so args matches), and build __str__ from sorted(self.errors.items()). validate_user collects problems in a dict and raises once at the end if it is non-empty.',
      explanation: py`Collecting errors before raising gives users every problem in one round trip. Subclassing \`ValueError\` keeps generic "bad input" handlers working. The single exception carries structured data, so an API layer can turn \`err.errors\` straight into a JSON response.`,
      starter: { files: { 'main.py': py`class ValidationError(ValueError):
    """The input data broke one or more rules."""


def validate_user(data):
    """Return data if valid; otherwise raise ValidationError listing every problem."""
    # TODO
    return data


print(validate_user({"name": "Ada", "email": "ada@example.com", "age": 36}))
` } },
      tests: [
        { name: 'ValidationError is a ValueError with an errors dict', code: py`err = ValidationError({"email": "missing @", "age": "must be >= 0"})
assert isinstance(err, ValueError)
assert err.errors == {"email": "missing @", "age": "must be >= 0"}` },
        { name: 'str() lists problems sorted by field', code: py`err = ValidationError({"email": "missing @", "age": "must be >= 0"})
assert str(err) == "age: must be >= 0; email: missing @"` },
        { name: 'valid data is returned unchanged', code: py`user = {"name": "Ada", "email": "ada@example.com", "age": 36}
assert validate_user(user) == user` },
        { name: 'every problem is reported at once', code: py`with raises(ValidationError) as caught:
    validate_user({"name": "", "email": "ada.example.com", "age": -1})
assert caught.value.errors == {"name": "required", "email": "missing @", "age": "must be >= 0"}` },
        { name: 'only the broken fields are reported', code: py`with raises(ValidationError) as caught:
    validate_user({"name": "Ben", "email": "ben@example.com", "age": -3})
assert caught.value.errors == {"age": "must be >= 0"}` },
      ],
      solution: { files: { 'main.py': py`class ValidationError(ValueError):
    """The input data broke one or more rules."""

    def __init__(self, errors):
        super().__init__(errors)
        self.errors = errors

    def __str__(self):
        return "; ".join(f"{field}: {problem}" for field, problem in sorted(self.errors.items()))


def validate_user(data):
    """Return data if valid; otherwise raise ValidationError listing every problem."""
    errors = {}
    name = data.get("name")
    if not isinstance(name, str) or not name.strip():
        errors["name"] = "required"
    if "@" not in str(data.get("email", "")):
        errors["email"] = "missing @"
    age = data.get("age")
    if not isinstance(age, int) or age < 0:
        errors["age"] = "must be >= 0"
    if errors:
        raise ValidationError(errors)
    return data


print(validate_user({"name": "Ada", "email": "ada@example.com", "age": 36}))
try:
    validate_user({"name": "", "email": "nope", "age": -1})
except ValidationError as err:
    print("invalid:", err)
` } },
      hints: ['Give ValidationError an __init__(self, errors) that calls super().__init__(errors) and stores self.errors.', 'In __str__, use "; ".join(...) over sorted(self.errors.items()).', 'In validate_user, fill an errors dict rule by rule and raise once at the end if it is not empty.'],
      whyAsked: 'A realistic pattern from web frameworks: one exception carrying many structured problems.',
      mistakes: ['Raising on the first problem only', 'Formatting the message in __init__ and losing the dict', 'Not sorting, making the message order unpredictable'],
      followUps: ['How would you map this to an HTTP 400 JSON response?', 'How could nested objects report errors (address.city)?', 'Would you make it pickle-safe?'],
      modelAnswer: 'I subclass ValueError so generic bad-input handlers still work. The constructor takes the dict of field errors, passes it to super().__init__ so args matches the signature, and stores it as errors for handlers that want structure. __str__ joins "field: problem" pairs sorted by field name, so the message is stable. validate_user runs every rule, collecting problems in a dict instead of raising on the first one, and raises a single ValidationError at the end if the dict is not empty — so the user sees all their mistakes at once.',
    },
  ],

  takeaways: [
    'A custom exception is a class that inherits from Exception (never BaseException); a docstring is a complete body.',
    'Give a library or app one base class plus a few subclasses for failures callers handle differently; except Base catches them all.',
    'Name them with the Error suffix, keep them in their own errors module, and treat them as public API.',
    'Store context as attributes, pass every constructor argument to super().__init__() (copying and pickling rebuild from args), and build the message in __str__.',
    'Mix in a built-in (ValueError, LookupError) when your error is genuinely a special case of it.',
    'Don\'t create a class when a built-in already fits or nobody will catch it separately — use fields instead of class explosions.',
  ],
}
