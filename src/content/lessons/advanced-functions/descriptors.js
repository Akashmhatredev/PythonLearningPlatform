// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP_FIELDS = py`class Field:
    """A reusable, validated attribute. Subclasses override validate()."""

    def __set_name__(self, owner, name):
        # Runs once, when the class body has finished: name is "price", "title", ...
        self.name = name
        self.storage = "_" + name          # where each instance keeps its own value

    def __get__(self, instance, owner=None):
        if instance is None:               # looked up on the class: Product.price
            return self
        return getattr(instance, self.storage)

    def __set__(self, instance, value):
        value = self.validate(value)       # raise, or hand back the value to store
        setattr(instance, self.storage, value)

    def validate(self, value):
        return value

    def __repr__(self):
        return f"<{type(self).__name__} field {self.name!r}>"


class Positive(Field):
    def validate(self, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be a number, got {type(value).__name__}")
        if value <= 0:
            raise ValueError(f"{self.name} must be > 0, got {value}")
        return value


class BoundedString(Field):
    def __init__(self, max_length):
        self.max_length = max_length

    def validate(self, value):
        if not isinstance(value, str):
            raise TypeError(f"{self.name} must be a str, got {type(value).__name__}")
        if not 1 <= len(value) <= self.max_length:
            raise ValueError(f"{self.name} must be 1-{self.max_length} characters, got {len(value)}")
        return value


class Product:
    title = BoundedString(max_length=20)
    price = Positive()

    def __init__(self, title, price):
        self.title = title      # calls BoundedString.__set__
        self.price = price      # calls Positive.__set__

    def __repr__(self):
        return f"Product({self.title!r}, {self.price})"


mug = Product("Mug", 4.5)
lamp = Product("Desk lamp", 19.99)
print(mug, lamp)
print("mug stores:", vars(mug))
print("on the class:", Product.price)

mug.price = 5.25                # validated on every assignment, not only in __init__
print("mug:", mug.price, "| lamp:", lamp.price)

attempts = [("", 3), ("Kettle", -2), ("Kettle", "9.99"), ("Extra-large ceramic mug", 8)]
for title, price in attempts:
    try:
        Product(title, price)
    except (TypeError, ValueError) as err:
        print(f"rejected {type(err).__name__}: {err}")
`

const BOUNDED_STARTER = py`class Bounded:
    """A number that must stay between low and high (inclusive)."""

    def __init__(self, low, high):
        self.low = low
        self.high = high

    def __set_name__(self, owner, name):
        # TODO: remember the attribute name and pick a per-instance storage name
        pass

    def __get__(self, instance, owner=None):
        # TODO: return the descriptor itself on class access, else this instance's value
        return None

    def __set__(self, instance, value):
        # TODO: check the type, then the range, then store the value on the instance
        pass


class Thermostat:
    target = Bounded(5, 30)
    fan_speed = Bounded(0, 5)

    def __init__(self, target, fan_speed):
        self.target = target
        self.fan_speed = fan_speed


living_room = Thermostat(21, 2)
bedroom = Thermostat(18, 1)
print(living_room.target, bedroom.target)
`

const BOUNDED_SOLUTION = py`class Bounded:
    """A number that must stay between low and high (inclusive)."""

    def __init__(self, low, high):
        self.low = low
        self.high = high

    def __set_name__(self, owner, name):
        self.name = name
        self.storage = "_" + name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return getattr(instance, self.storage)

    def __set__(self, instance, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be a number, got {type(value).__name__}")
        if not self.low <= value <= self.high:
            raise ValueError(f"{self.name} must be between {self.low} and {self.high}, got {value}")
        setattr(instance, self.storage, value)


class Thermostat:
    target = Bounded(5, 30)
    fan_speed = Bounded(0, 5)

    def __init__(self, target, fan_speed):
        self.target = target
        self.fan_speed = fan_speed


living_room = Thermostat(21, 2)
bedroom = Thermostat(18, 1)
print(living_room.target, bedroom.target)
`

const LAZY_STARTER = py`class lazy:
    """Compute an attribute once per instance, then cache it (like functools.cached_property)."""

    def __init__(self, func):
        self.func = func

    def __set_name__(self, owner, name):
        # TODO: remember the attribute name
        pass

    def __get__(self, instance, owner=None):
        # Works, but recomputes on every access. TODO: return self on class access,
        # and cache the result so the next lookup never reaches this method.
        return self.func(instance)


class Report:
    def __init__(self, sales):
        self.sales = sales
        self.calls = 0

    @lazy
    def total(self):
        self.calls += 1
        return sum(self.sales)


report = Report([120, 80, 45])
print(report.total, report.total, "computed", report.calls, "time(s)")
`

const LAZY_SOLUTION = py`class lazy:
    """Compute an attribute once per instance, then cache it (like functools.cached_property)."""

    def __init__(self, func):
        self.func = func

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        value = self.func(instance)
        instance.__dict__[self.name] = value   # next time, the instance dict answers first
        return value


class Report:
    def __init__(self, sales):
        self.sales = sales
        self.calls = 0

    @lazy
    def total(self):
        self.calls += 1
        return sum(self.sales)


report = Report([120, 80, 45])
print(report.total, report.total, "computed", report.calls, "time(s)")
`

const PROPERTY_STARTER = py`class SimpleProperty:
    """A pure-Python version of the built-in property (getter + optional setter)."""

    def __init__(self, fget, fset=None):
        self.fget = fget
        self.fset = fset

    def __get__(self, instance, owner=None):
        # TODO: return self on class access, else call the getter
        return None

    def __set__(self, instance, value):
        # TODO: call the setter, or raise AttributeError if there is none
        pass

    def setter(self, fset):
        # TODO: return a NEW SimpleProperty with the same getter and this setter
        return self


class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    @SimpleProperty
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @SimpleProperty
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32


room = Temperature(21)
print(room.celsius, room.fahrenheit)
`

const PROPERTY_SOLUTION = py`class SimpleProperty:
    """A pure-Python version of the built-in property (getter + optional setter)."""

    def __init__(self, fget, fset=None):
        self.fget = fget
        self.fset = fset

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return self.fget(instance)

    def __set__(self, instance, value):
        if self.fset is None:
            raise AttributeError(f"{self.fget.__name__!r} is read-only")
        self.fset(instance, value)

    def setter(self, fset):
        return type(self)(self.fget, fset)


class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    @SimpleProperty
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @SimpleProperty
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32


room = Temperature(21)
print(room.celsius, room.fahrenheit)
`

export default {
  id: 'descriptors',
  title: 'Descriptors: how properties & methods really work',
  summary: 'A descriptor is an object stored on a class whose type defines __get__, __set__ or __delete__, so it takes over attribute access for that name — the one mechanism behind property, methods, classmethod, staticmethod, __slots__ and reusable validated fields.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['properties-and-encapsulation', 'attribute-access'],
  related: ['properties-and-encapsulation', 'attribute-access', 'methods-and-attributes', 'classes-and-objects', 'advanced-decorators', 'decorators', 'metaclasses', 'dataclasses', 'records-and-slots', 'functools', 'object-model', 'multiple-inheritance-mro', 'input-validation', 'database-patterns', 'protocols'],
  tags: ['descriptors', 'descriptor protocol', '__get__', '__set__', '__delete__', '__set_name__', 'data descriptor', 'non-data descriptor', 'property', 'bound method', 'staticmethod', 'classmethod', 'cached_property', 'validation', 'validated fields', 'attribute lookup', 'precedence', '__slots__', 'ORM fields', 'getattr_static'],
  apis: [
    { name: 'object.__get__(self, instance, owner=None)', summary: 'Called for instance.attr (instance is the object) and Owner.attr (instance is None). Returns the attribute value.' },
    { name: 'object.__set__(self, instance, value)', summary: 'Called for instance.attr = value. Defining it (or __delete__) makes a data descriptor.' },
    { name: 'object.__delete__(self, instance)', summary: 'Called for del instance.attr.' },
    { name: 'object.__set_name__(self, owner, name)', summary: 'Called once by type.__new__ when the owning class is created, telling the descriptor its class and attribute name (3.6+).' },
    { name: 'property(fget=None, fset=None, fdel=None, doc=None)', summary: 'Built-in data descriptor that calls your getter/setter/deleter functions.' },
    { name: 'functools.cached_property(func)', summary: 'Non-data descriptor (3.8+) that computes a value once per instance and stores it in the instance __dict__.' },
    { name: 'types.MethodType(func, obj)', summary: 'Builds a bound method — what function.__get__(obj, cls) returns.' },
    { name: 'inspect.getattr_static(obj, name)', summary: 'Finds an attribute without triggering descriptors or __getattr__ — handy for inspecting descriptors.' },
    { name: 'weakref.WeakKeyDictionary', summary: 'A dict whose keys are weak references: an option for per-instance descriptor storage that does not keep instances alive.' },
  ],
  docs: [
    { label: 'Descriptor HowTo Guide', url: 'https://docs.python.org/3/howto/descriptor.html' },
    { label: 'Data model — implementing descriptors', url: 'https://docs.python.org/3/reference/datamodel.html#implementing-descriptors' },
    { label: 'Data model — invoking descriptors', url: 'https://docs.python.org/3/reference/datamodel.html#invoking-descriptors' },
    { label: 'Built-in functions — property', url: 'https://docs.python.org/3/library/functions.html#property' },
    { label: 'functools.cached_property', url: 'https://docs.python.org/3/library/functools.html#functools.cached_property' },
    { label: 'inspect.getattr_static', url: 'https://docs.python.org/3/library/inspect.html#inspect.getattr_static' },
    { label: 'PEP 487 — __set_name__ and __init_subclass__', url: 'https://peps.python.org/pep-0487/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [properties & encapsulation](lesson:properties-and-encapsulation) you turned \`celsius\` into a validated attribute with \`@property\`. In [attribute access](lesson:attribute-access) you saw that \`obj.name\` follows a lookup order. This lesson connects the two: the thing that makes properties work is a small protocol called the **descriptor protocol**, and you can use it directly.`,
    py`A **descriptor** is an object that lives on a **class** (as a class attribute) and whose type defines at least one of these special methods:`,
    py`- \`__get__(self, instance, owner)\` — runs when someone *reads* the attribute;
- \`__set__(self, instance, value)\` — runs when someone *assigns* to it;
- \`__delete__(self, instance)\` — runs on \`del\`;
- plus the optional \`__set_name__(self, owner, name)\`, which tells the descriptor which attribute name it was given.`,
    py`Once such an object sits on a class, \`instance.name\` no longer just looks in the instance's own storage — Python hands the request to the descriptor. That one rule explains a surprising amount of Python: where \`self\` comes from in methods, how \`@property\`, \`@classmethod\`, \`@staticmethod\`, \`functools.cached_property\` and \`__slots__\` work, and how ORM libraries let you write \`price = Column(Float)\`.`,
    py`You'll build a reusable validated field — \`price = Positive()\`, \`title = BoundedString(max_length=20)\` — learn the precedence rules that decide who wins when a descriptor and an instance attribute share a name, and see how to store per-instance data correctly.`,
  ],
  why: [
    py`**Properties don't scale across attributes.** A product with \`price\`, \`weight\`, \`stock\` and \`discount\` that must all be positive needs four nearly identical getter/setter pairs. A descriptor writes the rule once and reuses it: \`price = Positive()\`, \`weight = Positive()\`, in as many classes as you like.`,
    py`**It explains everyday Python.** Why does \`mug.describe()\` pass \`mug\` as \`self\` automatically? Why is \`mug.describe is mug.describe\` \`False\`? Why can an instance attribute hide a method but not a property? All three answers are "descriptors".`,
    py`**Frameworks are built on it.** ORMs, form and serialization libraries, \`dataclasses\` features, \`enum\` and the standard library's own \`property\`/\`cached_property\` use descriptors. Reading or debugging that code is much easier once you know the protocol.`,
  ],
  eli15: [
    py`Every object carries a backpack with its own values in it (its \`__dict__\`). Normally \`mug.price\` means "look in mug's backpack for *price*".`,
    py`A **descriptor** is a helper that the *class* puts in charge of one name. When you ask for \`mug.price\`, Python first checks with the class: "is anyone in charge of *price*?" If a strict helper is, the helper takes over — it can check the value (no negative prices!), work it out, or refuse to change it. You write the helper once and can put copies of it in charge of many names.`,
    py`The fun part: you have been using descriptors since your first class. Every method is one. When you write \`mug.describe\`, the function's helper hands you back \`describe\` with \`mug\` already filled in as \`self\`.`,
  ],
  analogy: {
    title: 'Lockers and hall monitors',
    body: [
      py`At a school, every student has a locker with their own stuff in it. The school can also post a **hall monitor** at one locker label — say "price" — with a rule card.`,
      py`A **strict** monitor checks every deposit and every withdrawal for that label, even if the student already has something in the locker with that name: you can't get round them. A **relaxed** monitor only steps in when your locker has nothing with that label — for example, by handing you the school's form with your name already filled in, or by fetching something once and leaving it in your locker so next time you just take it yourself.`,
      py`One rule: the monitor's own notebook is shared by every student. If the monitor wrote each student's item in their notebook instead of putting it in the student's locker, everyone would see the last student's item. Per-student things go in per-student lockers.`,
    ],
    mapping: [
      ['the school', 'the class (Product)'],
      ["a student's locker", "an instance's __dict__ (vars(mug))"],
      ['a hall monitor posted at the "price" label', 'a descriptor stored as the class attribute price'],
      ['the rule card', '__set__ / __get__: validation, conversion, computing'],
      ['strict monitor (checks even if the locker has the item)', 'data descriptor (has __set__/__delete__): beats the instance dict'],
      ['relaxed monitor (only if the locker is empty)', 'non-data descriptor (only __get__): functions, cached_property'],
      ['a form with your name pre-filled', 'a bound method: the function with self filled in'],
      ['being told your label on the first day', '__set_name__(owner, name) at class creation'],
      ["the monitor's own notebook", "attributes on the descriptor object — shared by all instances"],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A descriptor at work: __set_name__, __set__ and __get__',
    props: {
      code: py`class Positive:
    def __set_name__(self, owner, name):
        self.storage = "_" + name          # "_price"

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.storage)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"price must be > 0, got {value}")
        setattr(obj, self.storage, value)


class Item:
    price = Positive()       # __set_name__ runs when the class is built

    def __init__(self, price):
        self.price = price   # not a plain store: calls Positive.__set__


mug = Item(4.5)
print(mug.price)             # calls Positive.__get__
mug.price = -1               # rejected by __set__
`,
      expectError: true,
      notes: {
        2: '`type.__new__` calls `__set_name__` once the `Item` class body has run, passing the class and the attribute name `"price"`.',
        5: '`mug.price` lands here: `obj` is `mug`, `objtype` is `Item`. On `Item.price`, `obj` would be `None`.',
        10: 'Assignment to `mug.price` lands here because `Positive` defines `__set__` — it is a **data descriptor**.',
        13: 'The value is stored on the **instance**, under a different name (`_price`), so each item keeps its own price.',
        16: 'A descriptor is just an object placed in the class namespace. Watch the call to `__set_name__` that follows.',
        19: '`self.price = price` looks like a plain store, but Python finds a data descriptor on the class and calls its `__set__`.',
        23: 'Reading goes through `__get__`, which fetches `_price` from the instance.',
        24: 'The rule runs on *every* assignment, not just in `__init__`: `ValueError` propagates out of `__set__` and nothing is stored.',
      },
    },
    alt: 'A step-by-step trace. Defining class Item creates a Positive object and calls its __set_name__ with the name "price", which stores "_price" on the descriptor. Creating Item(4.5) runs __init__, whose assignment self.price = price jumps into Positive.__set__, which checks the value and stores it on the instance as _price. print(mug.price) jumps into Positive.__get__, which returns 4.5. Finally mug.price = -1 jumps into __set__ again, which raises ValueError.',
    caption: py`Step through with ▶ and watch the call stack: plain-looking reads and writes of \`mug.price\` turn into calls to \`__get__\` and \`__set__\`. The last line raises on purpose — that's the validation working.`,
  },
  syntax: [
    py`#### The protocol`,
    { code: py`class Descriptor:
    def __set_name__(self, owner, name):      # once, when the owner class is created (3.6+)
        ...

    def __get__(self, instance, owner=None):  # obj.attr  — and Owner.attr with instance=None
        ...

    def __set__(self, instance, value):       # obj.attr = value
        ...

    def __delete__(self, instance):           # del obj.attr
        ...


class Owner:
    attr = Descriptor()   # must be a CLASS attribute to have any effect`, lang: 'python', title: 'the four descriptor methods' },
    py`Rules worth memorising:`,
    py`- A descriptor only works as a **class attribute** (on the instance's class or one of its bases). Stored in an instance's \`__dict__\` it is just an ordinary object.
- Python looks the methods up on the descriptor's **type**: it calls \`type(d).__get__(d, obj, type(obj))\`. Sticking a \`__get__\` attribute onto one object does nothing.
- You only need the methods you use. Any one of \`__get__\`, \`__set__\`, \`__delete__\` makes an object a descriptor.
- In \`__get__\`, \`instance is None\` means "accessed on the class" (\`Product.price\`). The convention is to **return the descriptor itself** then.`,
    py`#### Data vs non-data descriptors`,
    py`| kind | defines | examples | can a value in \`obj.__dict__\` hide it? |
|---|---|---|---|
| **data descriptor** | \`__get__\` plus \`__set__\` and/or \`__delete__\` | \`property\`, \`__slots__\` members, validated fields | **No** — it beats the instance dict |
| **non-data descriptor** | only \`__get__\` | functions (methods), \`classmethod\`, \`staticmethod\`, \`functools.cached_property\` | **Yes** — an instance value with the same name wins |`,
    py`That gives the precedence for reading \`obj.x\`: **data descriptor on the class → instance \`__dict__\` → non-data descriptor or plain class attribute → \`__getattr__\` / \`AttributeError\`**. Writing \`obj.x = v\` asks a data descriptor's \`__set__\` if there is one, otherwise stores in \`obj.__dict__\` — non-data descriptors are never consulted for writes.`,
    py`#### Who calls what`,
    py`| you write | Python calls (d is the descriptor found on the class) |
|---|---|
| \`obj.x\` | \`type(d).__get__(d, obj, type(obj))\` |
| \`Owner.x\` | \`type(d).__get__(d, None, Owner)\` |
| \`obj.x = v\` | \`type(d).__set__(d, obj, v)\` — data descriptors only |
| \`del obj.x\` | \`type(d).__delete__(d, obj)\` — data descriptors only |
| \`super().x\` | \`__get__(obj, type(obj))\` on the next match after the current class in the [MRO](lesson:multiple-inheritance-mro) |`,
    { callout: 'version', title: '__set_name__ is 3.6+', text: py`\`__set_name__\` arrived with [PEP 487](https://peps.python.org/pep-0487/) in Python 3.6 (together with \`__init_subclass__\`, covered in [metaclasses](lesson:metaclasses)). Older descriptor code passes the name twice — \`price = Positive("price")\` — which you may still meet in legacy projects.` },
    py`#### Methods are descriptors too`,
    { code: py`class Mug:
    def describe(self):
        return "a mug"


mug = Mug()
func = Mug.__dict__["describe"]              # the raw function stored on the class
bound = func.__get__(mug, Mug)               # what mug.describe does behind the scenes
print(bound())                               # a mug
print(bound.__self__ is mug, bound.__func__ is func)   # True True
print(func.__get__(None, Mug) is func)       # True: Mug.describe is the plain function`, lang: 'python', title: 'function.__get__ builds a bound method' },
  ],
  walkthrough: {
    title: 'Reading the validated product fields',
    lang: 'python',
    code: SHOP_FIELDS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 7], text: py`\`__set_name__\` runs **once per field**, when the \`Product\` class statement finishes. It receives the class and the attribute name (\`"title"\`, \`"price"\`) and decides where each instance will keep its value: \`_title\`, \`_price\`.` },
      { lines: [9, 12], text: py`\`__get__\` handles reads. \`instance is None\` means someone wrote \`Product.price\` — we return the descriptor itself, which is handy for introspection. Otherwise we fetch the value from *that* instance.` },
      { lines: [14, 16], text: py`\`__set__\` handles every assignment: validate first, then store **on the instance**. Because \`Field\` defines \`__set__\`, it is a *data descriptor*, so nothing can sneak a value past it through \`mug.__dict__\`.` },
      { lines: [25, 31], text: py`\`Positive\` reuses all of that machinery and only overrides \`validate\`. Error messages use \`self.name\`, which \`__set_name__\` filled in, so they say *which* field was wrong.` },
      { lines: [34, 43], text: py`\`BoundedString\` takes settings in \`__init__\`. Storing \`max_length\` on the descriptor is fine — it is the same for every product. Per-product values must never go there.` },
      { lines: [46, 52], text: py`The class attributes are descriptor objects. Inside \`__init__\`, \`self.title = title\` is not a plain store: Python finds the data descriptor on the class and calls \`BoundedString.__set__(descriptor, self, title)\`.` },
      { lines: [58, 62], text: py`\`vars(mug)\` shows the real storage: \`{'_title': 'Mug', '_price': 4.5}\`. \`Product.price\` (class access) returns the descriptor, printed by its \`__repr__\`.` },
      { lines: [64, 65], text: py`Re-assigning \`mug.price\` is validated again, and \`lamp\` keeps its own price — proof that the value lives on each instance, not on the shared descriptor.` },
      { lines: [67, 72], text: py`Four bad products, four clear errors from \`validate\`. The objects are never created because \`__init__\` raises before it returns.` },
    ],
  },
  playground: {
    title: 'Validated product fields',
    objective: 'Run it, then reuse, extend and deliberately break the Field descriptors to see where each value really lives.',
    files: { 'main.py': SHOP_FIELDS },
    expected: py`\`\`\`text
Product('Mug', 4.5) Product('Desk lamp', 19.99)
mug stores: {'_title': 'Mug', '_price': 4.5}
on the class: <Positive field 'price'>
mug: 5.25 | lamp: 19.99
rejected ValueError: title must be 1-20 characters, got 0
rejected ValueError: price must be > 0, got -2
rejected TypeError: price must be a number, got str
rejected ValueError: title must be 1-20 characters, got 23
\`\`\`

Notice that \`vars(mug)\` holds \`_title\` and \`_price\`, while \`title\` and \`price\` themselves live on the class as descriptors.`,
    experiments: [
      {
        id: 'strip-titles',
        task: py`Shoppers type sloppy titles like \`"  Mug  "\`. Make \`BoundedString\` strip spaces from both ends **before** checking the length and return the stripped text, so \`Product("  Mug  ", 4.5).title\` is \`"Mug"\` and a title made only of spaces is rejected with \`ValueError\`.`,
        hint: py`In \`BoundedString.validate\`, after the \`isinstance\` check, add \`value = value.strip()\`. The method already returns \`value\`, and \`__set__\` stores whatever \`validate\` returns.`,
        tests: [
          { name: 'surrounding spaces are removed', code: py`assert Product("  Mug  ", 4.5).title == "Mug"` },
          { name: 'a blank title is rejected', code: py`with raises(ValueError):
    Product("    ", 4.5)` },
        ],
        explain: py`Because \`__set__\` stores the value that \`validate\` *returns*, a descriptor can normalise data (strip, lower-case, convert units) as well as check it. Every class that uses \`BoundedString\` gets the fix at once — that's the payoff of putting the rule in one reusable object.`,
      },
      {
        id: 'reuse-on-order',
        task: py`Reuse the descriptors in a second class. Create \`OrderLine\` with \`product = BoundedString(max_length=20)\` and \`quantity = Positive()\` as class attributes, and an \`__init__(self, product, quantity)\` that assigns both. \`OrderLine("Mug", 0)\` must raise \`ValueError\`.`,
        hint: py`Copy the shape of \`Product\`: two class attributes, then \`self.product = product\` and \`self.quantity = quantity\` in \`__init__\`.`,
        tests: [
          { name: 'OrderLine stores valid values', code: py`assert callable(ns.get("OrderLine")), "Define a class named OrderLine"
line = OrderLine("Mug", 3)
assert line.product == "Mug" and line.quantity == 3` },
          { name: 'a zero quantity is rejected, naming the field', code: py`assert callable(ns.get("OrderLine")), "Define a class named OrderLine"
with raises(ValueError, match="quantity"):
    OrderLine("Mug", 0)` },
          { name: 'quantity is a Positive descriptor on the class', code: py`assert isinstance(vars(OrderLine)["quantity"], Positive)` },
        ],
        explain: py`Two new validated attributes, zero new validation code. \`__set_name__\` ran again for the new class, so the error says \`quantity must be > 0\` — the descriptor learned its new name automatically.`,
      },
      {
        id: 'one-of',
        task: py`Write a new descriptor \`OneOf(Field)\` whose \`__init__(self, *choices)\` saves the allowed values and whose \`validate\` raises \`ValueError\` for anything else. Add \`category = OneOf("kitchen", "office", "garden")\` to \`Product\` (leave \`__init__\` alone) and try \`mug.category = "kitchen"\`.`,
        hint: py`\`def __init__(self, *choices): self.choices = choices\`, then in \`validate\`: \`if value not in self.choices: raise ValueError(...)\` and \`return value\`.`,
        tests: [
          { name: 'an allowed category is stored', code: py`p = Product("Lamp", 20)
p.category = "office"
assert p.category == "office"` },
          { name: 'other categories raise ValueError', code: py`p = Product("Lamp", 20)
with raises(ValueError):
    p.category = "weapons"` },
          { name: 'Product.category is the descriptor itself', code: py`assert isinstance(Product.category, Field), "Product.category should return the OneOf descriptor"` },
        ],
        explain: py`\`OneOf\` inherits \`__set_name__\`, \`__get__\` and \`__set__\` from \`Field\`, so a whole new kind of validated attribute is three lines of real logic. This is exactly how form and ORM libraries offer dozens of field types.`,
      },
      {
        id: 'shared-bug',
        task: py`Break it on purpose. In \`Field\`, change the last line of \`__get__\` to \`return self.value\` and the last line of \`__set__\` to \`self.value = value\`. Run it and compare the first two printed lines with before. Then undo the change.`,
        hint: py`Both products are created before the first \`print\`. Which \`Positive\` object handles \`mug.price\`, and which handles \`lamp.price\`?`,
        explain: py`There is only **one** \`Positive\` object for \`price\`, shared by every \`Product\`. Storing the value on it means the last write wins for everyone: both products now print as \`Product('Desk lamp', 19.99)\`, and \`vars(mug)\` is empty. The descriptor's own attributes are for configuration (\`max_length\`, \`name\`); per-instance values belong on the instance.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Who answers mug.price?',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'expr', label: 'mug.price', note: 'attribute read', x: 80, y: 170, tone: 'yellow' },
        { id: 'mro', label: 'search the class', note: 'type(mug).__mro__', x: 250, y: 170 },
        { id: 'data', label: 'data descriptor?', note: 'has __set__ or __delete__', x: 460, y: 55, tone: 'red' },
        { id: 'inst', label: 'mug.__dict__', note: "the instance's own values", x: 460, y: 170, tone: 'blue' },
        { id: 'nondata', label: 'non-data descriptor?', note: 'only __get__ (or a plain value)', x: 460, y: 285, tone: 'kraft' },
        { id: 'answer', label: 'the value', note: 'returned to your code', x: 670, y: 170, tone: 'ink' },
        { id: 'miss', label: 'AttributeError', note: 'then __getattr__, if defined', x: 670, y: 285 },
      ],
      edges: [
        { from: 'expr', to: 'mro', label: '__getattribute__' },
        { from: 'mro', to: 'data', label: 'found it' },
        { from: 'data', to: 'answer', label: 'yes: __get__(mug, Product)' },
        { from: 'data', to: 'inst', label: 'no' },
        { from: 'inst', to: 'answer', label: 'there: as is' },
        { from: 'inst', to: 'nondata', label: 'not there' },
        { from: 'nondata', to: 'answer', label: '__get__ or plain value' },
        { from: 'nondata', to: 'miss', label: 'nothing at all' },
      ],
      steps: [
        { focus: ['expr', 'mro'], edges: ['expr->mro'], text: py`Reading \`mug.price\` calls \`type(mug).__getattribute__(mug, "price")\` — normally \`object.__getattribute__\`. First it searches \`Product\` and its bases, in [MRO](lesson:multiple-inheritance-mro) order, for \`price\`. Nothing is called yet; Python just remembers what it found.` },
        { focus: ['data', 'answer'], edges: ['mro->data', 'data->answer'], text: py`If the class attribute's **type** defines \`__set__\` or \`__delete__\`, it is a **data descriptor**: Python calls \`__get__(mug, Product)\` and returns the result. The instance dict is never consulted. \`property\`, \`__slots__\` members and the playground's \`Positive\` live here.` },
        { focus: ['inst', 'answer'], edges: ['data->inst', 'inst->answer'], text: py`Otherwise Python checks \`mug.__dict__\` and returns a value stored there as is. Ordinary instance attributes live here — and so do values cached by \`functools.cached_property\`.` },
        { focus: ['nondata', 'answer'], edges: ['inst->nondata', 'nondata->answer'], text: py`Otherwise, if the class attribute is a **non-data descriptor** (only \`__get__\`), Python calls \`__get__(mug, Product)\`: a function becomes a bound method, a \`classmethod\` binds to the class, a \`staticmethod\` hands back the plain function. A plain class attribute (\`tax_rate = 0.2\`) is returned unchanged.` },
        { focus: ['miss'], edges: ['nondata->miss'], text: py`Nothing anywhere → \`AttributeError\`. Only then does Python try \`__getattr__\`, if the class defines one (see [attribute access](lesson:attribute-access)).` },
        { focus: ['expr', 'data', 'inst'], text: py`**Writes** use a shorter list: \`mug.price = 5\` calls the data descriptor's \`__set__\` if there is one, otherwise the value goes into \`mug.__dict__\`. Non-data descriptors are never asked — which is why an instance attribute can hide a method but never a property.` },
      ],
    },
    alt: 'Flow diagram for reading mug.price. The expression calls __getattribute__, which searches the class and its bases. If the found object is a data descriptor (has __set__ or __delete__), its __get__ produces the value. If not, mug.__dict__ is checked and a value there is returned. If not there, a non-data descriptor’s __get__ or a plain class attribute supplies the value. If nothing is found, AttributeError is raised and __getattr__ is tried.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When you write \`mug.price\`, Python doesn't only open mug's own storage. It **asks the class first**: "do you have something called *price*?" If the class has an object there with a \`__get__\` method, Python lets that object produce the answer.`,
      { code: py`class Positive:
    def __get__(self, instance, owner=None):
        return 42


class Product:
    price = Positive()


mug = Product()
print(mug.price)                     # 42 — Positive.__get__ answered
print(vars(Product)["price"])        # the Positive object stored on the class
print(vars(mug))                     # {} — nothing stored on mug at all`, lang: 'python', title: 'the smallest descriptor' },
      py`Nothing magic happens to the class body: \`price = Positive()\` simply puts a \`Positive\` object into the class namespace. The magic is in the lookup rule, which checks the class for objects with \`__get__\`/\`__set__\` before (or after) looking at the instance.`,
      py`So "a property", "a method" and "a validated field" are the same idea with different rule cards: an object on the class that Python consults whenever that name is used on an instance.`,
    ],
    technical: [
      py`**The read algorithm, in Python.** \`object.__getattribute__\` is written in C, but its logic fits in a short function. This is a **simplified** model — the real one also handles \`__getattr__\`, \`__slots__\` without a \`__dict__\`, and caches type lookups:`,
      { code: py`_MISSING = object()


def find_attribute(obj, name):
    """Simplified pure-Python model of object.__getattribute__."""
    owner = type(obj)
    found = _MISSING
    for klass in owner.__mro__:                       # 1. search the class chain
        if name in vars(klass):
            found = vars(klass)[name]
            break
    kind = type(found)                                # methods are looked up on the TYPE
    if hasattr(kind, "__get__") and (hasattr(kind, "__set__") or hasattr(kind, "__delete__")):
        return kind.__get__(found, obj, owner)        # 2. data descriptor wins
    if name in getattr(obj, "__dict__", {}):
        return obj.__dict__[name]                     # 3. instance dict
    if hasattr(kind, "__get__"):
        return kind.__get__(found, obj, owner)        # 4. non-data descriptor
    if found is not _MISSING:
        return found                                  # 5. plain class attribute
    raise AttributeError(f"{owner.__name__!r} object has no attribute {name!r}")`, lang: 'python', title: 'find_attribute: what obj.name does (simplified)' },
      py`Class access (\`Product.price\`) goes through \`type.__getattribute__\` instead: it checks the *metaclass* for data descriptors, then searches the class's own MRO and calls \`__get__(None, Product)\` on any descriptor it finds. That's why \`__get__\` receives \`None\` for class access, and why returning \`self\` then is the convention. \`super().attr\` is a third caller: it starts the search *after* the current class and binds with \`__get__(obj, type(obj))\`.`,
      py`**Writes and deletes.** \`object.__setattr__\` looks up the name on the type; if the found object's type has \`__set__\`, it is called; otherwise the value goes into \`obj.__dict__\`. \`del obj.x\` mirrors that with \`__delete__\`. A \`property\` defines both methods even without a setter — they raise \`AttributeError: property 'total' of 'Cart' object has no setter\` — which is how read-only properties stay read-only.`,
      py`**The built-ins, re-implemented** (simplified versions of what the [Descriptor HowTo](https://docs.python.org/3/howto/descriptor.html) shows):`,
      { code: py`import types


class Function:
    """How a plain function binds (simplified)."""
    def __get__(self, instance, owner=None):
        if instance is None:
            return self                                # Mug.describe -> the function
        return types.MethodType(self, instance)        # mug.describe -> bound method


class StaticMethod:
    def __init__(self, func):
        self.func = func

    def __get__(self, instance, owner=None):
        return self.func                               # never binds anything


class ClassMethod:
    def __init__(self, func):
        self.func = func

    def __get__(self, instance, owner=None):
        if owner is None:
            owner = type(instance)
        return types.MethodType(self.func, owner)      # binds the CLASS`, lang: 'python', title: 'binding, staticmethod and classmethod in pure Python' },
      py`All three define only \`__get__\`, so they are **non-data** descriptors: assigning \`mug.describe = something\` puts a value in the instance dict that then hides the method. A pure-Python \`property\` (with \`__set__\`) is the coding interview question at the end of this lesson.`,
      py`**When \`__set_name__\` runs.** After \`type.__new__\` has created the class object, it walks the class namespace and calls \`__set_name__(cls, name)\` on every value whose type defines it, in definition order; then it calls the parent's \`__init_subclass__\` ([metaclasses](lesson:metaclasses) covers the full sequence). It is **not** called for descriptors attached later (\`Product.weight = Positive()\`) — call \`Product.weight.__set_name__(Product, "weight")\` yourself in that case.`,
      { callout: 'note', title: 'CPython detail', text: py`Each access to \`mug.describe\` builds a new bound-method object, which is why \`mug.describe is mug.describe\` is \`False\` (but \`==\` is \`True\`). For the common pattern \`mug.describe()\`, CPython's compiler and interpreter skip creating the bound method and call the function with \`mug\` directly. \`property\`, \`classmethod\`, \`staticmethod\`, functions and \`__slots__\` members are implemented in C (\`type(Point.x)\` is \`member_descriptor\`). Other implementations, such as PyPy, may optimise differently — the observable behaviour is the same.` },
      { callout: 'version', title: 'Version notes', text: py`\`functools.cached_property\` arrived in 3.8; its internal lock was removed in 3.12, so under threads the getter may run more than once. \`staticmethod\` objects became directly callable in 3.10. Wrapping another descriptor in \`classmethod\` (e.g. \`@classmethod\` over \`@property\`) worked in 3.9–3.10, was deprecated in 3.11 and removed in 3.13 — today \`Cls.name\` just gives a bound method around the property object.` },
    ],
    production: [
      py`**Where you'll meet descriptors.** \`property\` and \`functools.cached_property\` everywhere; methods, \`classmethod\`, \`staticmethod\` and \`__slots__\` members in every class; ORMs and declarative libraries (SQLAlchemy's mapped attributes are \`InstrumentedAttribute\` descriptors, Django uses descriptors such as \`ForwardManyToOneDescriptor\` for related objects). Knowing the protocol makes their stack traces readable.`,
      py`**Choosing where per-instance values live** — the most important design decision in a descriptor:`,
      py`| strategy | how | trade-offs |
|---|---|---|
| private name on the instance | \`setattr(instance, "_" + name, value)\` | simple, visible in \`vars()\`; works with \`__slots__\` if the slot \`_price\` exists |
| same name in the instance dict | \`instance.__dict__[self.name] = value\` | tidy \`vars()\`; only safe for **data** descriptors (they win over the dict); needs a \`__dict__\` |
| \`weakref.WeakKeyDictionary\` on the descriptor | \`self.values[instance] = value\` | works for objects you can't add attributes to; instances must be hashable and weak-referenceable |
| attribute on the descriptor | \`self.value = value\` | **bug**: shared by every instance |
| plain dict keyed by instance or \`id()\` | \`self.values[id(instance)] = value\` | **bug**: keeps instances alive (memory leak) or mixes up recycled ids |`,
      py`**Dataclasses and descriptors.** A descriptor can be a dataclass field: \`price: Positive = Positive()\`. The dataclass calls \`Positive.__get__(None, Item)\` to find the default — and because that returns the descriptor itself, \`Item("Mug")\` passes the *descriptor* to \`__set__\` and fails with \`TypeError: price must be a number, got Positive\`. Either always pass the argument, or have \`__get__\` return a real default (or raise \`AttributeError\` for "no default") on class access. See [dataclasses](lesson:dataclasses).`,
      py`**Type checkers** read \`__get__\`'s return annotation. Use overloads so \`Product.price\` is typed as the descriptor and \`mug.price\` as a float:`,
      { code: py`from typing import Self, overload


class Positive:
    def __set_name__(self, owner: type, name: str) -> None:
        self.storage = "_" + name

    @overload
    def __get__(self, instance: None, owner: type | None = None) -> Self: ...
    @overload
    def __get__(self, instance: object, owner: type | None = None) -> float: ...
    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return getattr(instance, self.storage)

    def __set__(self, instance: object, value: float) -> None:
        if value <= 0:
            raise ValueError("must be > 0")
        setattr(instance, self.storage, value)`, lang: 'python', title: 'typed descriptor (typing.Self is 3.11+)' },
      py`**Debugging.** \`inspect.getattr_static(mug, "price")\` returns the descriptor object *without* calling \`__get__\` — useful when \`__get__\` itself is broken. \`vars(type(mug))\` shows the class namespace, \`vars(mug)\` the instance storage.`,
      py`**Cost.** A descriptor written in Python runs a Python function on every access, so it is slower than a plain attribute. That only matters in very hot loops — measure with [timeit](lesson:profiling) before trading clarity for speed. \`cached_property\` pays the cost once, then reads are plain dict lookups.`,
      py`**Collecting fields.** Frameworks usually pair descriptors with \`__init_subclass__\`: the base class scans \`vars(cls)\` for \`Field\` objects to generate \`__init__\`, schemas or SQL. That's the bridge to [metaclasses & class creation](lesson:metaclasses).`,
    ],
  },
  mistakes: [
    {
      title: 'Storing per-instance values on the descriptor',
      wrong: { code: py`class Positive:
    def __get__(self, instance, owner=None):
        return self.value                 # one value for ALL instances

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("must be > 0")
        self.value = value`, lang: 'python' },
      right: { code: py`class Positive:
    def __set_name__(self, owner, name):
        self.storage = "_" + name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return getattr(instance, self.storage)

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("must be > 0")
        setattr(instance, self.storage, value)`, lang: 'python' },
      explanation: py`A class has **one** descriptor object per attribute, shared by every instance. Anything stored on \`self\` inside \`__get__\`/\`__set__\` is shared: the last product created sets the price for all of them. Store per-instance data on \`instance\`.`,
    },
    {
      title: 'Storing under the public name with setattr (infinite recursion)',
      wrong: { code: py`class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("must be > 0")
        setattr(instance, self.name, value)   # calls __set__ again... and again`, lang: 'python', static: true },
      right: { code: py`class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return instance.__dict__[self.name]

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("must be > 0")
        instance.__dict__[self.name] = value   # bypasses the descriptor`, lang: 'python' },
      explanation: py`\`setattr(instance, "price", v)\` is the same as \`instance.price = v\`, which finds the data descriptor and calls \`__set__\` again → \`RecursionError\`. Either use a different storage name (\`_price\`) or write straight into \`instance.__dict__\`. (Shown as static code: recursion through C-level attribute machinery can crash the browser sandbox.)`,
    },
    {
      title: 'Forgetting class access (instance is None)',
      wrong: { code: py`class Positive:
    def __set_name__(self, owner, name):
        self.storage = "_" + name

    def __get__(self, instance, owner=None):
        return getattr(instance, self.storage)   # Product.price -> getattr(None, "_price")`, lang: 'python' },
      right: { code: py`class Positive:
    def __set_name__(self, owner, name):
        self.storage = "_" + name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return getattr(instance, self.storage)`, lang: 'python' },
      explanation: py`\`Product.price\` calls \`__get__(None, Product)\`. Without the check you get \`AttributeError: 'NoneType' object has no attribute '_price'\` — and not only when *you* write \`Product.price\`: \`help()\`, \`inspect\`, \`dataclasses\`, mocking with autospec and documentation tools all access attributes on the class.`,
    },
    {
      title: 'Creating the descriptor on the instance',
      wrong: { code: py`class Product:
    def __init__(self, price):
        self.price = Positive()     # just an object in the instance dict
        self.price = price          # silently replaces it: no validation`, lang: 'python' },
      right: { code: py`class Product:
    price = Positive()              # class attribute: the protocol applies

    def __init__(self, price):
        self.price = price          # goes through Positive.__set__`, lang: 'python' },
      explanation: py`Python only looks for descriptors on the **class** (and its bases). An instance attribute that happens to have \`__get__\` is never called; the second assignment simply overwrites it, so \`Product(-5)\` is accepted.`,
    },
    {
      title: 'Attaching a descriptor after the class exists',
      wrong: { code: py`class Product:
    price = Positive()

Product.weight = Positive()      # __set_name__ never runs for weight
item = Product()
item.weight = 2                  # AttributeError: 'Positive' object has no attribute 'storage'`, lang: 'python' },
      right: { code: py`class Product:
    price = Positive()
    weight = Positive()          # define descriptors in the class body…

# …or, when you really must add one later, finish the job yourself:
volume = Positive()
volume.__set_name__(Product, "volume")
Product.volume = volume`, lang: 'python' },
      explanation: py`\`__set_name__\` is called once, by \`type.__new__\`, for the names present when the class is created. Later assignments are plain \`setattr\` calls on the class, so a descriptor that relies on \`__set_name__\` is left half-configured.`,
    },
    {
      title: 'Using a plain dict keyed by instance',
      wrong: { code: py`class Positive:
    def __init__(self):
        self.values = {}                     # keeps every instance alive forever

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return self.values[instance]

    def __set__(self, instance, value):
        self.values[instance] = value`, lang: 'python' },
      right: { code: py`import weakref


class Positive:
    def __init__(self):
        self.values = weakref.WeakKeyDictionary()   # entries vanish with their instance

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return self.values[instance]

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("must be > 0")
        self.values[instance] = value`, lang: 'python' },
      explanation: py`A normal dict holds a strong reference to each key, so every instance ever created stays in memory as long as the class exists — a slow leak in a long-running service. It also requires hashable instances. Prefer storing on the instance; use \`WeakKeyDictionary\` only when you can't (e.g. classes with \`__slots__\` and \`__weakref__\`).`,
    },
  ],
  debugging: [
    {
      symptom: py`RecursionError: maximum recursion depth exceeded (inside __set__ or __get__)`,
      cause: py`The descriptor stores or reads its value through the public attribute name — \`setattr(instance, self.name, value)\` or \`getattr(instance, self.name)\` — which re-enters the same descriptor.`,
      fix: py`Store under a different name (\`"_" + name\`) or use \`instance.__dict__[self.name]\` directly, which bypasses the descriptor.`,
    },
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute '_price'`,
      cause: py`Something accessed the attribute on the **class** (\`Product.price\`, \`help(Product)\`, a dataclass or doc tool) and \`__get__\` didn't handle \`instance is None\`.`,
      fix: py`Start \`__get__\` with \`if instance is None: return self\`.`,
    },
    {
      symptom: py`AttributeError: 'Positive' object has no attribute 'storage'`,
      cause: py`\`__set_name__\` never ran: the descriptor was attached after class creation, or a subclass overrode \`__set_name__\` without calling \`super().__set_name__(owner, name)\`.`,
      fix: py`Define the descriptor in the class body, call \`__set_name__\` manually when attaching later, and call \`super()\` in overrides.`,
    },
    {
      symptom: py`Every instance reports the same value — the one set last.`,
      cause: py`Per-instance data is stored on the descriptor (\`self.value = value\`), which is shared by the whole class.`,
      fix: py`Store on the instance: \`setattr(instance, self.storage, value)\` or \`instance.__dict__[self.name] = value\`.`,
    },
    {
      symptom: py`TypeError: No '__dict__' attribute on 'Point' instance to cache 'area' property.`,
      cause: py`\`functools.cached_property\` stores its result in the instance \`__dict__\`, and the class uses \`__slots__\` without \`"__dict__"\`.`,
      fix: py`Add \`"__dict__"\` to \`__slots__\`, compute the value eagerly in \`__init__\`, or use a plain \`property\` with your own cache slot.`,
    },
    {
      symptom: py`TypeError: cannot use 'weakref.ReferenceType' as a dict key (unhashable type: 'Point')`,
      cause: py`The descriptor keeps values in a \`WeakKeyDictionary\`, but the owner class defines \`__eq__\` without \`__hash__\`, so its instances are unhashable. (This is the Python 3.14 wording.)`,
      fix: py`Store values on the instance instead, or give the class a \`__hash__\` consistent with \`__eq__\` (see [special methods](lesson:special-methods)).`,
    },
    {
      symptom: py`TypeError: price must be a number, got Positive (when creating a dataclass without that argument)`,
      cause: py`The dataclass asked the descriptor for a default via \`__get__(None, cls)\`, got the descriptor itself, and passed it to \`__set__\`.`,
      fix: py`Make the argument required (no default), or return a real default / raise \`AttributeError\` from \`__get__\` on class access.`,
    },
  ],
  bestPractices: [
    'Reach for property for one attribute on one class; write a descriptor when the same rule repeats across attributes or classes.',
    'Implement __set_name__ so the descriptor knows its attribute name — never make callers type the name twice.',
    'Return self from __get__ when instance is None, so class access, help() and introspection work.',
    'Keep per-instance values on the instance (private name or instance __dict__); keep only configuration on the descriptor.',
    'Make validating descriptors data descriptors (define __set__) so the instance __dict__ cannot bypass them.',
    'Raise clear TypeError/ValueError messages that name the attribute, and let __set__ store what validate returns so you can normalise values.',
    'Inspect with vars(type(obj)), vars(obj) and inspect.getattr_static when a descriptor misbehaves.',
    'Add typing overloads to __get__ in shared libraries so type checkers know the class-access and instance-access types.',
  ],
  useCases: [
    'Reusable validated fields: Positive(), BoundedString(max_length=50), OneOf("draft", "published").',
    'Declarative models in ORMs, form libraries and serializers (name = Column(String)).',
    'Lazy or cached attributes computed once per instance (functools.cached_property).',
    'Read-only or write-once attributes, unit conversion, and type coercion on assignment.',
    'Understanding and debugging methods, classmethod, staticmethod, property and __slots__.',
  ],
  whenToUse: {
    use: [
      'The same get/set rule applies to several attributes or several classes.',
      'You are building a library or framework with declarative, self-describing fields.',
      'A value is expensive to compute and should be cached on each instance (cached_property, or your own non-data descriptor).',
      'You need to explain or customise how methods bind (e.g. making a class-based decorator work on methods).',
    ],
    avoid: [
      'One computed or validated attribute on one class — a property is clearer.',
      'Plain data with types — a dataclass (with __post_init__ checks) or a validation library is less code.',
      'Attribute names that are only known at runtime — use __getattr__ (see attribute access).',
      'A rule for every attribute write (freezing, logging) — use __setattr__ or @dataclass(frozen=True).',
      'Very hot inner loops where a Python call per access matters — measure first.',
    ],
  },
  comparison: {
    title: 'Four ways to control an attribute',
    headers: ['', 'property', 'custom descriptor', 'functools.cached_property', '__setattr__ override'],
    rows: [
      ['controls', 'one attribute of one class', 'one attribute, reusable in any class', 'one computed attribute, once per instance', 'every attribute write on the class'],
      ['descriptor kind', 'data (always has __set__/__delete__)', 'your choice: data or non-data', 'non-data (only __get__)', 'not a descriptor: a method on the class'],
      ['knows its attribute name', 'no — written by hand per attribute', 'yes, via __set_name__', 'yes, via __set_name__', 'gets the name as an argument'],
      ['cost per access', 'a Python call on every read', 'a Python call on every read/write', 'first read only; then a dict lookup', 'a Python call on every write'],
      ['typical use', 'computed or validated attribute', 'fields in models, forms, ORMs', 'expensive values that do not change', 'freezing, auditing, proxies'],
    ],
    note: py`They combine well: libraries often use descriptors for fields, \`cached_property\` for derived data and \`__init_subclass__\` to collect the fields ([metaclasses](lesson:metaclasses)).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'descriptors-q1',
      type: 'mcq',
      prompt: 'What makes a descriptor a **data** descriptor?',
      options: [
        { text: 'It defines __get__', why: 'Every descriptor that can be read defines __get__ — functions do too, and they are non-data descriptors.' },
        'Its type defines __set__ or __delete__',
        { text: 'It stores data on the instance', why: 'Where it keeps values is a design choice; the classification depends only on which methods its type defines.' },
        { text: 'It defines __set_name__', why: '__set_name__ only tells the descriptor its name at class creation. It does not affect precedence.' },
      ],
      answer: 1,
      explanation: py`Data descriptors define \`__set__\` and/or \`__delete__\` (usually alongside \`__get__\`). They take priority over the instance \`__dict__\`; non-data descriptors (only \`__get__\`) don't.`,
    },
    {
      id: 'descriptors-q2',
      type: 'output',
      prompt: 'Both descriptors return the same text, and the instance dict holds a value under both names. What is printed?',
      code: py`class Loud:
    def __get__(self, obj, objtype=None):
        return "from descriptor"


class Strict(Loud):
    def __set__(self, obj, value):
        raise AttributeError("read-only")


class Box:
    a = Loud()
    b = Strict()


box = Box()
box.__dict__["a"] = "from instance"
box.__dict__["b"] = "from instance"
print(box.a, box.b)`,
      options: [
        { text: 'from descriptor from descriptor', why: 'Loud only defines __get__, so it is a non-data descriptor — the instance dict wins over it.' },
        'from instance from descriptor',
        { text: 'from instance from instance', why: 'Strict defines __set__, making it a data descriptor, which beats the instance dict.' },
        { text: 'AttributeError: read-only', why: '__set__ only runs on assignment through the attribute. Writing into box.__dict__ directly bypasses it, and reading never calls __set__.' },
      ],
      answer: 1,
      explanation: py`Precedence: data descriptor → instance dict → non-data descriptor. \`Strict\` (has \`__set__\`) wins over \`box.__dict__["b"]\`; \`Loud\` (only \`__get__\`) loses to \`box.__dict__["a"]\`.`,
    },
    {
      id: 'descriptors-q3',
      type: 'bug',
      prompt: 'After `cheap = Product(5)` and `pricey = Product(90)`, `cheap.price` is 90. Click a line that causes the bug.',
      code: py`class Positive:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return self.value

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be > 0")
        self.value = value


class Product:
    price = Positive()

    def __init__(self, price):
        self.price = price`,
      answerLine: [8, 13],
      explanation: py`There is one \`Positive\` object for the whole \`Product\` class. \`self.value = value\` (line 13) stores the price on that shared object, and line 8 reads it back, so the last product created overwrites everyone's price. Store on the instance: \`setattr(instance, "_" + self.name, value)\` and read it back with \`getattr\`.`,
    },
    {
      id: 'descriptors-q4',
      type: 'fill',
      prompt: 'Complete `__get__` so that `Product.price` returns the descriptor itself while `mug.price` returns the stored value.',
      code: py`class Positive:
    def __set_name__(self, owner, name):
        self.storage = "_" + name

    def __get__(self, instance, owner=None):
        if instance is ___:
            return ___
        return getattr(instance, self.storage)`,
      answer: [['None'], ['self']],
      explanation: py`Class access calls \`__get__(None, Product)\`. Returning \`self\` (the descriptor) then is the convention used by \`property\`, functions and almost every library descriptor.`,
    },
    {
      id: 'descriptors-q5',
      type: 'output',
      prompt: 'Predict the output exactly.',
      code: py`import functools


class Report:
    runs = 0

    @functools.cached_property
    def total(self):
        Report.runs += 1
        return 42


r = Report()
print(r.total, r.total, Report.runs, "total" in vars(r))`,
      answer: '42 42 1 True',
      accept: ['42 42 1 True'],
      explanation: py`The first read finds no \`total\` in \`r.__dict__\`, so the non-data descriptor's \`__get__\` runs the function once and stores 42 in \`r.__dict__["total"]\`. The second read finds it in the instance dict, which beats non-data descriptors — the function never runs again.`,
    },
    {
      id: 'descriptors-q6',
      type: 'mcq',
      prompt: 'When is `__set_name__` called?',
      options: [
        'Once per descriptor, when the class that contains it is created',
        { text: 'Every time the attribute is assigned', why: 'Assignments call __set__. __set_name__ runs only once, at class creation.' },
        { text: 'When the first instance of the class is created', why: 'It runs earlier: type.__new__ calls it while building the class, before any instance exists.' },
        { text: 'Whenever a descriptor is assigned to any class attribute, even after the class exists', why: 'Attaching a descriptor later (Product.weight = Positive()) does NOT call __set_name__ — you must call it yourself.' },
      ],
      answer: 0,
      explanation: py`\`type.__new__\` calls \`__set_name__(owner, name)\` on every object in the new class's namespace whose type defines it, right after creating the class (3.6+).`,
    },
    {
      id: 'descriptors-q7',
      type: 'short',
      prompt: 'Why must a caching descriptor like `functools.cached_property` be a **non-data** descriptor?',
      answer: py`It caches by writing the result into the instance \`__dict__\` under the attribute's own name. Later reads must find that cached value without calling the descriptor again. Only a non-data descriptor loses to the instance dict, so the stored value wins from then on. A data descriptor would keep being called on every read, and the cache would be ignored. As a bonus, \`del obj.attr\` removes the cached value, so the next read recomputes it.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'bounded-number',
      title: 'A Bounded(low, high) field',
      difficulty: 'advanced',
      prompt: py`Smart-home thermostats need two numeric settings with different limits. Finish the data descriptor \`Bounded(low, high)\` so that \`Thermostat\` works:

- \`__set_name__\` remembers the attribute name and chooses a per-instance storage name.
- \`__get__\` returns the **descriptor itself** on class access (\`isinstance(Thermostat.target, Bounded)\`), otherwise the value stored for that instance.
- \`__set__\` raises \`TypeError\` if the value is not an \`int\` or \`float\`, and raises \`ValueError\` with the message \`"<name> must be between <low> and <high>, got <value>"\` (e.g. \`target must be between 5 and 30, got 40\`) when it is outside the range. Both limits are **inclusive**.
- Rejected values must not be stored; each thermostat keeps its own values.

Don't change the \`Thermostat\` class.`,
      files: { 'main.py': BOUNDED_STARTER },
      hints: [
        'Use the descriptor from the playground as your model: __set_name__ saves self.name and self.storage = "_" + name.',
        'In __set__, check isinstance(value, (int, float)) first, then the chained comparison self.low <= value <= self.high. Only call setattr(instance, self.storage, value) after both checks pass.',
        'raise ValueError(f"{self.name} must be between {self.low} and {self.high}, got {value}") — and in __get__: if instance is None: return self, else return getattr(instance, self.storage).',
      ],
      solution: {
        explanation: py`\`__set_name__\` runs twice when \`Thermostat\` is created — once for \`target\`, once for \`fan_speed\` — so each \`Bounded\` object knows its own name and storage slot (\`_target\`, \`_fan_speed\`). The limits are configuration, the same for every thermostat, so they live on the descriptor. The values are per-thermostat, so \`__set__\` stores them on the instance, *after* validation, which means a rejected value never replaces a good one. Because \`Bounded\` defines \`__set__\`, it is a data descriptor: even \`__init__\`'s assignments are validated, and nothing in the instance dict can shadow it.`,
        files: { 'main.py': BOUNDED_SOLUTION },
      },
      tests: [
        { name: 'stores and returns both values', code: py`t = Thermostat(21, 2)
assert t.target == 21 and t.fan_speed == 2` },
        { name: 'each thermostat keeps its own values', code: py`a = Thermostat(20, 1)
b = Thermostat(25, 3)
assert (a.target, b.target, a.fan_speed, b.fan_speed) == (20, 25, 1, 3)` },
        { name: 'out of range raises ValueError with the exact message', code: py`t = Thermostat(21, 2)
with raises(ValueError, match="target must be between 5 and 30, got 40"):
    t.target = 40` },
        { name: 'the message names the right field', code: py`t = Thermostat(21, 2)
with raises(ValueError, match="fan_speed must be between 0 and 5, got 9"):
    t.fan_speed = 9` },
        { name: 'non-numbers raise TypeError', code: py`t = Thermostat(21, 2)
with raises(TypeError):
    t.target = "warm"` },
        { name: 'limits are inclusive and bad values are not stored', code: py`t = Thermostat(5, 0)
t.target = 30
t.fan_speed = 5
try:
    t.target = 31
except ValueError:
    pass
assert (t.target, t.fan_speed) == (30, 5)` },
        { name: 'class access returns the descriptor', code: py`assert isinstance(Thermostat.target, Bounded)` },
      ],
    },
    {
      id: 'lazy-attribute',
      title: 'Build your own cached_property',
      difficulty: 'advanced',
      prompt: py`\`Report.total\` is expensive, so it should be computed **once per report**. The starter's \`lazy\` descriptor works but recomputes on every read. Fix it so that:

- the first read of \`report.total\` calls the function, stores the result in \`report.__dict__["total"]\` and returns it;
- later reads do **not** call the function (\`report.calls\` stays \`1\`);
- \`del report.total\` clears the cache, so the next read computes again;
- \`Report.total\` (class access) returns the \`lazy\` descriptor itself;
- \`lazy\` stays a **non-data** descriptor: it must not define \`__set__\` or \`__delete__\`.

Each report has its own cached value. Don't change \`Report\`.`,
      files: { 'main.py': LAZY_STARTER },
      hints: [
        'Which wins: a value in the instance __dict__, or a descriptor that only has __get__? Use that to your advantage.',
        'Save the name in __set_name__ (self.name = name). In __get__, compute the value, then write it into instance.__dict__[self.name].',
        'if instance is None: return self — then value = self.func(instance); instance.__dict__[self.name] = value; return value. del works automatically, because it just deletes the dict entry.',
      ],
      solution: {
        explanation: py`The trick is precedence. \`lazy\` defines only \`__get__\`, so it is a **non-data** descriptor, which loses to the instance dict. The first read finds nothing in \`report.__dict__\`, so \`__get__\` runs, computes the total and stores it under the attribute's own name. Every later read finds \`report.__dict__["total"]\` first and never reaches the descriptor — the cache costs nothing after the first access. \`del report.total\` deletes that dict entry (non-data descriptors have no \`__delete__\`, so Python deletes from the instance dict), and the next read falls through to \`__get__\` again. This is essentially how \`functools.cached_property\` works (it also handles classes without a \`__dict__\` with a clear error).`,
        files: { 'main.py': LAZY_SOLUTION },
      },
      tests: [
        { name: 'returns the computed value', code: py`assert Report([1, 2, 3]).total == 6` },
        { name: 'computes only once per instance', code: py`r = Report([1, 2])
r.total
r.total
r.total
assert r.calls == 1` },
        { name: 'caches in the instance __dict__', code: py`r = Report([4, 5])
r.total
assert vars(r).get("total") == 9` },
        { name: 'each report has its own value', code: py`a = Report([1])
b = Report([5, 5])
assert (a.total, b.total) == (1, 10)` },
        { name: 'del clears the cache', code: py`r = Report([2, 2])
r.total
del r.total
assert r.total == 4 and r.calls == 2` },
        { name: 'class access returns the descriptor', code: py`assert isinstance(Report.total, lazy)` },
        { name: 'lazy is a non-data descriptor', code: py`assert not hasattr(lazy, "__set__") and not hasattr(lazy, "__delete__")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'descriptors-what-is-a-descriptor',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a descriptor in Python? Name four built-in features implemented as descriptors.',
      answer: 'An object stored as a class attribute whose type defines __get__, __set__ or __delete__; attribute access on instances is routed through those methods. property, functions (bound methods), classmethod, staticmethod, __slots__ members and functools.cached_property are all descriptors.',
      explanation: py`The descriptor protocol is how Python customises attribute access per name. \`object.__getattribute__\` checks the class for a descriptor before and after the instance dict, depending on whether it is a data descriptor (\`__set__\`/\`__delete__\`) or non-data (\`__get__\` only). \`__set_name__\` (3.6+) lets a descriptor learn its attribute name when the class is created.`,
      code: { lang: 'python', code: py`class Mug:
    size = "large"

    def describe(self):
        return "a mug"


mug = Mug()
print(type(vars(Mug)["describe"]))          # <class 'function'>
print(mug.describe)                         # <bound method Mug.describe of ...>
print(hasattr(type(vars(Mug)["describe"]), "__get__"))   # True: functions are descriptors` },
      whyAsked: 'It checks whether you understand the mechanism behind methods and properties rather than treating them as special syntax.',
      mistakes: ['Saying descriptors are "the same as properties"', 'Forgetting that descriptors only work as class attributes', 'Not knowing that plain functions are descriptors'],
      followUps: ['What is the difference between a data and a non-data descriptor?', 'Why does __get__ receive None sometimes?', 'How does a function become a bound method?'],
      modelAnswer: 'A descriptor is any object, stored as a class attribute, whose type defines __get__, __set__ or __delete__. When you access that name on an instance, Python calls those methods instead of simply reading or writing the instance dictionary. Descriptors are everywhere: property is a data descriptor, every function is a non-data descriptor whose __get__ returns a bound method — that is where self comes from — and classmethod, staticmethod, cached_property and __slots__ members are descriptors too. I write my own when the same rule, like validation, has to apply to many attributes or classes.',
    },
    {
      id: 'descriptors-shared-state-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A `Positive` descriptor validates prices. After `Product(5)` and `Product(9)` are created, both report a price of 9. What is wrong, and how do you fix it?',
      code: { lang: 'python', code: py`class Positive:
    def __get__(self, instance, owner=None):
        return self.value

    def __set__(self, instance, value):
        if value <= 0:
            raise ValueError("price must be > 0")
        self.value = value


class Product:
    price = Positive()

    def __init__(self, price):
        self.price = price` },
      answer: 'The descriptor is created once, in the class body, and shared by every Product. self.value stores the price on that shared object, so the last write wins. Store per-instance data on the instance (a private attribute via __set_name__, or instance.__dict__), and handle instance is None.',
      explanation: py`\`self\` in \`__get__\`/\`__set__\` is the descriptor, not the product. Fix: add \`__set_name__\` to compute \`self.storage = "_" + name\`, then \`setattr(instance, self.storage, value)\` and \`getattr(instance, self.storage)\`, returning \`self\` when \`instance is None\`. Alternatives: \`instance.__dict__[self.name]\` (data descriptors only) or a \`WeakKeyDictionary\` for objects without a \`__dict__\`.`,
      whyAsked: 'This is the most common descriptor bug; spotting it shows you know a descriptor is one object per class attribute, not per instance.',
      mistakes: ['Fixing it with a dict keyed by instance (memory leak, hashability)', 'Using setattr(instance, "price", value), which recurses forever', 'Moving the descriptor into __init__, which disables it'],
      followUps: ['What happens if you store under the same public name with setattr?', 'When would you use a WeakKeyDictionary?', 'Why must __get__ handle instance is None?'],
      modelAnswer: 'The class body runs once, so there is exactly one Positive object for the price attribute, shared by all products. Inside __set__, self is that shared descriptor, so self.value = value overwrites the same slot for every instance and the last product wins. The fix is to keep configuration on the descriptor but values on the instance: implement __set_name__ to learn the attribute name, store with setattr(instance, "_price", value) or directly in instance.__dict__, and read it back in __get__ — returning the descriptor itself when instance is None. I would avoid a plain dict keyed by instance because it keeps every instance alive.',
    },
    {
      id: 'descriptors-static-vs-classmethod-binding',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`class Clock:
    @staticmethod
    def now():
        return "12:00"

    @classmethod
    def create(cls):
        return cls()


raw = Clock.__dict__["now"]
print(type(raw).__name__, raw is Clock.now, Clock.create.__self__ is Clock)` },
      options: ['function True True', 'staticmethod False True', 'staticmethod True False', 'function False False'],
      correctOption: 1,
      answer: '`staticmethod False True`. The class dict stores a staticmethod object; looking it up through the class calls its __get__, which returns the underlying function (a different object). classmethod.__get__ returns a method bound to the class, so __self__ is Clock.',
      explanation: py`\`@staticmethod\` and \`@classmethod\` replace the function in the class namespace with wrapper objects. Both are non-data descriptors: \`staticmethod.__get__\` returns the raw function (no binding), \`classmethod.__get__(obj, cls)\` returns \`MethodType(func, cls)\`. That's why \`vars(Clock)["now"]\` and \`Clock.now\` are different objects.`,
      whyAsked: 'It tests whether you know that the decorators are descriptor objects and that lookup through the class transforms them.',
      mistakes: ['Assuming the class __dict__ and attribute access return the same object', 'Thinking staticmethod "does nothing"', 'Believing classmethods bind to the instance'],
      followUps: ['How would you write staticmethod in pure Python?', 'Why is Clock.create.__self__ Clock even when called via an instance?', 'What does inspect.getattr_static(Clock, "now") return?'],
      modelAnswer: 'It prints staticmethod False True. The decorators replace the functions in the class namespace with staticmethod and classmethod objects, so the raw dict entry is a staticmethod. Accessing Clock.now goes through the descriptor protocol: staticmethod.__get__ hands back the plain underlying function, which is a different object from the wrapper, hence False. classmethod.__get__ returns a method bound to the class — whether you look it up on the class or an instance — so its __self__ is Clock.',
    },
    {
      id: 'descriptors-pure-python-property',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement `SimpleProperty`, a pure-Python version of `property` with a getter and an optional setter. Class access returns the descriptor; without a setter, assignment raises `AttributeError`; `.setter(fset)` returns a **new** `SimpleProperty` with the same getter; and it must be a data descriptor (an instance dict entry cannot shadow it).',
      answer: '__get__ returns self when instance is None, else fget(instance). __set__ calls fset(instance, value) or raises AttributeError when fset is None — defining __set__ is what makes it a data descriptor. setter returns type(self)(self.fget, fset).',
      explanation: py`Defining \`__set__\` (even one that only raises) makes the object a data descriptor, so reads go through \`__get__\` even if \`obj.__dict__\` has the same key — exactly why the real \`property\` can't be shadowed. \`setter\` must return a new object because the decorator syntax rebinds the name: \`@celsius.setter\` evaluates \`celsius.setter(func)\` and binds the result to \`celsius\`. Returning a copy also keeps subclasses that extend a parent's property from mutating the parent's.`,
      starter: { files: { 'main.py': PROPERTY_STARTER } },
      tests: [
        { name: 'the getter runs on reads', code: py`assert Temperature(21).celsius == 21` },
        { name: 'computed read-only value', code: py`assert Temperature(100).fahrenheit == 212` },
        { name: 'the setter runs and validates', code: py`t = Temperature(21)
t.celsius = 25
assert t.celsius == 25
with raises(ValueError):
    t.celsius = -300` },
        { name: 'no setter means read-only', code: py`t = Temperature(21)
with raises(AttributeError):
    t.fahrenheit = 100` },
        { name: 'class access returns the descriptor', code: py`assert isinstance(Temperature.celsius, SimpleProperty)` },
        { name: 'data descriptor: the instance dict cannot shadow it', code: py`t = Temperature(21)
t.__dict__["celsius"] = 999
assert t.celsius == 21` },
        { name: 'setter() returns a new SimpleProperty', code: py`p = SimpleProperty(lambda self: 1)
q = p.setter(lambda self, value: None)
assert q is not p and p.fset is None and q.fget is p.fget and q.fset is not None` },
      ],
      solution: { files: { 'main.py': PROPERTY_SOLUTION } },
      hints: ['Class access passes instance=None.', 'Read-only still needs __set__ — it just raises AttributeError.', 'setter: return type(self)(self.fget, fset).'],
      whyAsked: 'Re-implementing property proves you understand descriptors, precedence and how decorator syntax rebinds names.',
      mistakes: ['Leaving out __set__ for read-only properties (then the instance dict can shadow it)', 'Mutating self in setter() instead of returning a new object', 'Forgetting the instance is None case'],
      followUps: ['How would you add a deleter?', 'How does functools.cached_property differ?', 'Why does property copy itself in setter() instead of mutating?'],
      modelAnswer: 'I store fget and fset. __get__ returns the descriptor itself on class access and otherwise calls fget with the instance. __set__ calls fset, or raises AttributeError when there is no setter — and having __set__ at all is what makes this a data descriptor, so an entry in the instance dict can never shadow it. setter returns a brand-new SimpleProperty with the same getter and the new setter, because @celsius.setter rebinds the name celsius to whatever setter returns. That mirrors how the built-in property works, minus the deleter and docstring handling.',
    },
    {
      id: 'descriptors-storage-strategies',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Where should a reusable descriptor keep each instance\'s value? Compare an attribute on the descriptor, a dict on the descriptor keyed by instance, the instance\'s own `__dict__`, and a `weakref.WeakKeyDictionary`.',
      answer: 'On the instance whenever possible (private name, or instance.__dict__ under the same name for data descriptors). WeakKeyDictionary is the fallback for objects without a __dict__; it needs hashable, weak-referenceable instances. An attribute on the descriptor is shared by all instances (bug), and a plain dict keyed by instance leaks memory.',
      explanation: py`Instance storage gives each object its own value, dies with the object, shows up in \`vars()\` and pickles naturally. Writing to \`instance.__dict__[name]\` under the public name is fast and tidy but only correct for data descriptors (a non-data descriptor would be bypassed — which is exactly what \`cached_property\` wants). \`WeakKeyDictionary\` works for \`__slots__\` classes that include \`__weakref__\`, but classes that define \`__eq__\` without \`__hash__\` fail with \`unhashable type\`. Keying a normal dict by \`id(instance)\` is worse still: ids are reused after objects die.`,
      whyAsked: 'Storage is where real descriptor implementations go wrong; the answer shows awareness of memory, hashing and precedence.',
      mistakes: ['Choosing a dict keyed by id() and not considering id reuse', 'Forgetting that __slots__ classes have no __dict__', 'Using the same name in __dict__ for a non-data descriptor and wondering why __get__ stops running'],
      followUps: ['How would you support __slots__ classes?', 'What does pickling do with each strategy?', 'How does cached_property use the instance dict?'],
      modelAnswer: 'My default is to store on the instance: either a private attribute such as _price derived in __set_name__, or the instance __dict__ under the same name, which is safe for data descriptors because they win over the dict. That keeps values per object, frees them with the object, and makes vars() and pickling behave. If the class has no __dict__, I fall back to a WeakKeyDictionary on the descriptor, accepting that instances must be hashable and weak-referenceable. Storing the value on the descriptor itself is a bug because it is shared, and a plain dict keyed by instance or id leaks memory or mixes up reused ids.',
    },
    {
      id: 'descriptors-cached-property-tradeoffs',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A `Report.summary` attribute is expensive to compute. A teammate proposes `@functools.cached_property`. Explain how it works and name situations where it is a poor fit.',
      answer: 'It is a non-data descriptor: the first read runs the function and stores the result in the instance __dict__ under the same name; later reads hit the dict directly. Poor fits: classes with __slots__ and no __dict__ (TypeError), values that depend on mutable state (stale unless you del the attribute), and multi-threaded first access (no lock since 3.12, so it may compute twice).',
      explanation: py`Because the cached value lives in the instance dict, \`del report.summary\` invalidates it. The cache lasts as long as the instance, so big results on long-lived objects hold memory. It caches per instance, not per arguments — use \`functools.lru_cache\` on a function for that (and beware caching methods, see [advanced decorators](lesson:advanced-decorators)).`,
      code: { lang: 'python', code: py`import functools


class Report:
    def __init__(self, rows):
        self.rows = rows

    @functools.cached_property
    def summary(self):
        print("computing...")
        return sum(self.rows)


r = Report([3, 4])
print(r.summary, r.summary)   # computing... once, then 7 7
r.rows.append(10)
print(r.summary)              # still 7 — stale!
del r.summary                 # invalidate
print(r.summary)              # computing... 17` },
      whyAsked: 'cached_property is common in production code; knowing its mechanism and failure modes shows practical depth.',
      mistakes: ['Thinking it caches across instances', 'Not knowing how to invalidate', 'Assuming it is thread-safe'],
      followUps: ['Why does it have to be a non-data descriptor?', 'How would you make invalidation automatic when rows change?', 'What is the difference from lru_cache?'],
      modelAnswer: 'cached_property is a non-data descriptor. On the first read nothing is in the instance dict, so its __get__ runs the method and stores the result in the instance __dict__ under the same name; from then on the dict wins, so reads cost a plain lookup. It fits values that are expensive and do not change for the life of the object. It is a poor fit if the inputs are mutable, because the value goes stale until you del the attribute; for classes with __slots__ and no __dict__, where it raises TypeError; and under threads, since 3.12 removed its lock and two threads may compute it twice.',
    },
    {
      id: 'descriptors-orm-field-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design the field system for a small declarative model layer: `class User(Model): name = String(max_length=50); age = Integer(min_value=0)`. How do fields learn their names, validate, store values, and how does `Model` find all its fields to build `__init__(**kwargs)`?',
      answer: 'Make each field a data descriptor subclassing a Field base: __set_name__ records the name, __set__ validates and stores on the instance, __get__ returns the field on class access. Model.__init_subclass__ collects Field objects from the MRO into cls._fields, and Model.__init__ assigns each keyword through the descriptors, rejecting unknown or missing names.',
      explanation: py`Data descriptors guarantee validation on every assignment, not only in \`__init__\`. Returning the field on class access gives introspection (\`User.age.min_value\`) and lets query builders overload operators on class attributes (\`User.age > 18\`), which is the style SQLAlchemy uses. Collect fields with \`__init_subclass__\` rather than a metaclass — it's simpler and composes with other base classes (see [metaclasses](lesson:metaclasses)). Iterate the MRO in reverse so subclasses can override parents' fields while keeping definition order.`,
      code: { lang: 'python', code: py`class Field:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return instance.__dict__[self.name]

    def __set__(self, instance, value):
        instance.__dict__[self.name] = self.validate(value)

    def validate(self, value):
        return value


class Model:
    _fields = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        fields = {}
        for klass in reversed(cls.__mro__):
            fields.update({k: v for k, v in vars(klass).items() if isinstance(v, Field)})
        cls._fields = fields

    def __init__(self, **values):
        unknown = values.keys() - self._fields.keys()
        if unknown:
            raise TypeError(f"unknown fields: {sorted(unknown)}")
        for name in self._fields:
            setattr(self, name, values[name])   # KeyError if missing: simplified` },
      whyAsked: 'It combines descriptors with class-creation hooks — the core of every ORM and serialization library — and shows design judgement.',
      mistakes: ['Validating only in __init__ (later assignments bypass checks)', 'Using a metaclass when __init_subclass__ suffices', 'Storing values on the field objects'],
      followUps: ['How would you support defaults and optional fields?', 'How would User.age > 18 build a query?', 'Would you use dataclasses or a library such as pydantic instead?'],
      modelAnswer: 'I would make a Field base class that is a data descriptor: __set_name__ records the attribute name, __set__ calls a validate hook and stores the cleaned value in the instance dict, and __get__ returns the field itself on class access so the model is introspectable. String and Integer just override validate. The Model base uses __init_subclass__ to walk the MRO and collect every Field into a _fields mapping, and its generic __init__ assigns keyword arguments through the descriptors, rejecting unknown or missing ones. Because they are data descriptors, every later assignment is validated too. In a real project I would check whether dataclasses with __post_init__ or an existing validation library already cover the need before building this.',
    },
  ],

  takeaways: [
    'A descriptor is an object on a class whose type defines __get__, __set__ or __delete__; Python routes instance.attr through it.',
    'Data descriptors (__set__/__delete__) beat the instance __dict__; non-data descriptors (only __get__) lose to it. Writes only consult data descriptors.',
    'property is a data descriptor; functions, classmethod, staticmethod and cached_property are non-data descriptors — function.__get__ is where self comes from.',
    '__set_name__ (3.6+) runs once at class creation and tells the descriptor its name; it is not called for descriptors attached later.',
    'Return self from __get__ when instance is None, so class access and introspection work.',
    'One descriptor serves every instance: keep configuration on it, but store per-instance values on the instance (or a WeakKeyDictionary).',
    'Use property for one-offs and descriptors when the same rule repeats; pair them with __init_subclass__ to build declarative models.',
  ],
}
