// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PRODUCT = py`class Product:
    tax_rate = 0.20             # class attribute: shared by every product
    created = 0                 # how many products have been made

    def __init__(self, name, price):
        self.name = name        # instance attributes: one set per product
        self.price = price
        Product.created += 1

    @classmethod
    def from_csv(cls, line):
        """Alternative constructor: build a Product from 'name,price'."""
        name, price = line.split(",")
        return cls(name.strip(), float(price))

    @staticmethod
    def is_valid_price(value):
        return value >= 0

    def price_with_tax(self):
        return round(self.price * (1 + self.tax_rate), 2)


mug = Product("mug", 8.00)
lamp = Product.from_csv("desk lamp, 25.50")
print(mug.price_with_tax(), lamp.price_with_tax())

lamp.tax_rate = 0.05            # shadows the class attribute for lamp only
print(mug.tax_rate, lamp.tax_rate, Product.tax_rate)
print(Product.created, Product.is_valid_price(-3))

buy = mug.price_with_tax        # a bound method: it remembers mug
print(buy())
`

export default {
  id: 'methods-and-attributes',
  title: 'Instance, class & static methods',
  summary: 'Attributes can live on the instance or on the class; methods can receive the instance (self), the class (cls) or nothing at all — and choosing right avoids some classic bugs.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['classes-and-objects'],
  related: ['properties-and-encapsulation', 'inheritance', 'descriptors', 'attribute-access', 'decorators', 'mutability-and-copying', 'modules-and-imports'],
  tags: ['class attribute', 'instance attribute', 'classmethod', 'staticmethod', 'cls', 'self', 'alternative constructor', 'from_string', 'bound method', 'attribute lookup', 'shadowing', 'shared mutable', 'oop'],
  apis: [
    { name: '@classmethod', summary: 'Makes a method receive the class (cls) instead of an instance; used for alternative constructors.' },
    { name: '@staticmethod', summary: 'Makes a method receive neither the instance nor the class — a plain function stored on the class.' },
    { name: 'cls', summary: 'Conventional name for the first parameter of a classmethod: the class it was called on.' },
    { name: 'method.__self__ / method.__func__', summary: 'A bound method\'s remembered object and its underlying function.' },
    { name: 'vars(Class)', summary: 'The class namespace: methods and class attributes (a read-only mappingproxy).' },
    { name: 'type(self).attr', summary: 'Reach the class of an instance, e.g. to update a class-level counter.' },
  ],
  docs: [
    { label: 'Python tutorial — class and instance variables', url: 'https://docs.python.org/3/tutorial/classes.html#class-and-instance-variables' },
    { label: 'Built-in functions — classmethod', url: 'https://docs.python.org/3/library/functions.html#classmethod' },
    { label: 'Built-in functions — staticmethod', url: 'https://docs.python.org/3/library/functions.html#staticmethod' },
    { label: 'Data model — instance methods', url: 'https://docs.python.org/3/reference/datamodel.html#instance-methods' },
    { label: 'PEP 8 — method arguments (self and cls)', url: 'https://peps.python.org/pep-0008/#function-and-method-arguments' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [classes & objects](lesson:classes-and-objects) every attribute lived on an instance (\`self.owner\`) and every method received that instance as \`self\`. That's the common case, but not the only one.`,
    py`- A **class attribute** is a variable defined in the class body. It lives once, on the class, and every instance can read it — perfect for shared settings like a tax rate.
- A **class method** (\`@classmethod\`) receives the *class* instead of an instance. Its main job: **alternative constructors** such as \`Product.from_csv("mug, 8.00")\`.
- A **static method** (\`@staticmethod\`) receives nothing automatically. It's a plain function that lives inside the class for organisation.`,
    py`To use these well you need one rule about how Python *finds* attributes: it looks on the **instance first, then the class**. That one rule explains shared settings, "shadowing", and a famous bug where every object secretly shares one list.`,
  ],
  why: [
    py`**Some data belongs to the concept, not to one object.** A tax rate, a default colour or a counter of how many objects were created is the same for every product. Storing it on each instance wastes space and makes "change it for everyone" impossible.`,
    py`**Objects come from many places.** Products arrive as CSV lines, JSON dicts and database rows. One \`__init__\` can't take all those shapes cleanly, so Python code uses named alternative constructors: \`dict.fromkeys()\`, \`datetime.fromisoformat()\`, \`int.from_bytes()\`. You'll write your own with \`@classmethod\`.`,
    py`**Understanding lookup prevents real bugs.** The shared-mutable-class-attribute trap and the "counter that never counts" bug both come from not knowing where Python reads and writes attributes. Both are favourite interview questions too.`,
  ],
  eli15: [
    py`Picture a classroom. There's one **whiteboard** at the front that everybody can read: "Homework due Friday". That's a *class attribute*. Each student also has their **own notebook**: their name, their marks. Those are *instance attributes*.`,
    py`When a student wants to know something, they check their own notebook first; if it isn't there, they look at the whiteboard. If a student writes "homework due Monday" in their *own notebook*, only they see Monday — the whiteboard still says Friday for everyone else.`,
    py`Now the methods. A normal method is a job for **one student** ("hand in *your* homework"). A class method is a job for the **class as a whole** ("enrol a new student from this form"). A static method is just a **useful poster on the wall** — "how to convert inches to centimetres" — that doesn't need to know about any student at all.`,
  ],
  analogy: {
    title: 'The whiteboard and the notebooks',
    body: [
      py`A shared whiteboard everyone can read, plus a personal notebook for each student. Reading checks your notebook first, then the whiteboard. Writing always goes in your own notebook, never on the whiteboard — unless the teacher walks up and changes the board itself.`,
      py`The danger: if the whiteboard holds a *shared box* of pencils, and one student takes a pencil out of the box, the box is emptier for everybody. That's a mutable class attribute.`,
    ],
    mapping: [
      ['the whiteboard', 'the class namespace (class attributes and methods)'],
      ['each student\'s notebook', 'an instance\'s own __dict__'],
      ['check notebook, then the board', 'attribute lookup: instance first, then class'],
      ['writing in your own notebook', 'obj.attr = value always writes to the instance'],
      ['the teacher changing the board', 'Class.attr = value changes it for everyone'],
      ['a shared box of pencils on the board', 'a mutable class attribute (list/dict) shared by all instances'],
      ['"enrol a student from this form"', 'a classmethod alternative constructor'],
      ['a conversion poster on the wall', 'a staticmethod'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Class attributes, shadowing and a shared list',
    props: {
      code: py`class Dog:
    species = "canine"      # class attribute
    tricks = []             # ALSO shared by every dog (trap!)

    def __init__(self, name):
        self.name = name    # instance attribute

    def add_trick(self, trick):
        self.tricks.append(trick)


rex = Dog("Rex")
fido = Dog("Fido")
print(rex.species)          # found on the class
fido.species = "good boy"   # creates an instance attribute
print(fido.species, rex.species)
rex.add_trick("roll over")
print(fido.tricks)          # surprise
`,
      notes: {
        1: 'The class object gets two **class attributes** — `species` and `tricks` — plus its methods. Look inside the class box.',
        12: 'Each instance stores only `name` in its own `__dict__`.',
        14: '`rex` has no `species` of its own, so Python looks on the class and finds `"canine"`.',
        15: 'Assignment through an instance **always writes to that instance**. `fido` now has its own `species` that *shadows* the class one.',
        16: '`fido` finds its own value first; `rex` still falls through to the class.',
        17: '`self.tricks` is not on `rex`, so lookup finds the **class\'s** list — and `.append` mutates that one shared list.',
        18: '`fido.tricks` finds the same class-level list. Every dog sees "roll over". The fix: create `self.tricks = []` in `__init__`.',
      },
    },
    alt: 'A step-by-step trace. The Dog class box shows species "canine", tricks pointing to an empty list, and two methods. rex and fido instances each hold only a name. After fido.species = "good boy", fido gains its own species attribute while rex still reads canine from the class. rex.add_trick appends to the list on the class, so printing fido.tricks shows ["roll over"].',
    caption: py`Watch which box changes. Reading falls through from instance to class; **writing** with \`=\` lands on the instance; **mutating** with \`.append()\` changes whatever object lookup found — here, the class's shared list.`,
  },
  syntax: [
    py`#### Instance attributes vs class attributes`,
    { code: py`class Product:
    tax_rate = 0.20               # class attribute: defined in the class body

    def __init__(self, name, price):
        self.name = name          # instance attributes: set on self
        self.price = price


mug = Product("mug", 8.00)
lamp = Product("lamp", 25.50)
print(mug.tax_rate, lamp.tax_rate)   # 0.2 0.2 — both read the class's value
Product.tax_rate = 0.10              # change it on the class...
print(mug.tax_rate, lamp.tax_rate)   # 0.1 0.1 — ...and every instance sees it
print(vars(mug))                     # {'name': 'mug', 'price': 8.0} — no tax_rate here`, lang: 'python', title: 'one shared value, many own values' },
    py`#### How Python finds an attribute`,
    py`- **Reading** \`obj.x\`: look in \`obj.__dict__\`; if not there, look in the class (then its parent classes — see [inheritance](lesson:inheritance)); if still not found, raise \`AttributeError\`.
- **Writing** \`obj.x = value\`: always stores in \`obj.__dict__\`. It never searches and never changes the class.
- **Mutating** \`obj.x.append(...)\`: first *reads* \`obj.x\` (with the search above), then changes **that** object in place.`,
    { code: py`class Product:
    tax_rate = 0.20


lamp = Product()
lamp.tax_rate = 0.05        # instance attribute now shadows the class one
print(lamp.tax_rate)        # 0.05
print(Product.tax_rate)     # 0.2 — the class is untouched
del lamp.tax_rate           # remove the instance's own value...
print(lamp.tax_rate)        # 0.2 — ...and the class value shows through again`, lang: 'python', title: 'shadowing a class attribute' },
    { callout: 'warn', title: 'The shared mutable class attribute trap', text: py`\`tricks = []\` in the class body creates **one** list on the class. \`self.tricks.append(...)\` reads that list (it's not on the instance) and mutates it — so every instance shares it. Rule: class attributes are for values that are **immutable** (numbers, strings, tuples) or deliberately shared. Anything per-object, especially lists, dicts and sets, goes in \`__init__\`: \`self.tricks = []\`.` },
    py`#### Updating a class-level counter`,
    { code: py`class Product:
    created = 0

    def __init__(self, name):
        self.name = name
        Product.created += 1          # write to the CLASS
        # self.created += 1 would read 0 from the class, then
        # write 1 onto the instance — the class count never moves


Product("mug")
Product("lamp")
print(Product.created)   # 2`, lang: 'python', title: 'write class state through the class' },
    py`\`type(self).created += 1\` also works; it updates whichever class the object actually belongs to, which matters once subclasses exist.`,
    py`#### @classmethod: methods that receive the class`,
    { code: py`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    @classmethod
    def from_csv(cls, line):              # cls is the class it was called on
        name, price = line.split(",")
        return cls(name.strip(), float(price))   # cls(...) — not Product(...)


lamp = Product.from_csv("desk lamp, 25.50")
print(lamp.name, lamp.price)              # desk lamp 25.5


class SaleProduct(Product):              # a subclass (see the inheritance lesson)
    pass


deal = SaleProduct.from_csv("kettle, 19.99")
print(type(deal).__name__)                # SaleProduct — thanks to cls`, lang: 'python', title: 'an alternative constructor' },
    py`The \`@classmethod\` line is a **decorator**: it wraps the function so Python passes the class as the first argument, named \`cls\` by convention. Call it on the class (\`Product.from_csv(...)\`); calling it on an instance works too and still passes the class. Using \`cls(...)\` instead of hard-coding \`Product(...)\` means subclasses get instances of *themselves*. Decorators in general are covered in [decorators](lesson:decorators).`,
    py`#### @staticmethod: no automatic first argument`,
    { code: py`class Product:
    def __init__(self, name, price):
        if not Product.is_valid_price(price):
            raise ValueError(f"price must be >= 0, got {price}")
        self.name = name
        self.price = price

    @staticmethod
    def is_valid_price(value):        # no self, no cls
        return value >= 0


print(Product.is_valid_price(-3))     # False
print(Product("pen", 1.5).price)      # 1.5`, lang: 'python', title: 'a helper that lives on the class' },
    { callout: 'tip', title: 'Often a module-level function is better', text: py`A static method is just a function that happens to live in the class's namespace. If it is useful without the class — parsing a date, converting units — a plain function in the module is simpler, easier to import and easier to test. Use \`@staticmethod\` when the helper is tightly tied to the class and callers naturally reach it through the class (or when subclasses might override it).` },
    py`#### \`self\` and \`cls\` are conventions`,
    py`Python passes the instance (or class) **positionally** as the first argument; the parameter's name is up to you. \`def total(this):\` works. But PEP 8 says to always use \`self\` for instance methods and \`cls\` for class methods, every tool and reader expects them, and using anything else just confuses people.`,
    py`#### Bound methods`,
    { code: py`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    def price_with_tax(self):
        return round(self.price * 1.2, 2)


mug = Product("mug", 8.00)
buy = mug.price_with_tax        # no () — get the method itself
print(buy)                      # <bound method Product.price_with_tax of <...>>
print(buy())                    # 9.6 — it remembered mug
print(buy.__self__ is mug)      # True: the remembered object
print(buy.__func__ is Product.price_with_tax)   # True: the plain function`, lang: 'python', title: 'obj.method without calling it' },
    py`\`mug.price_with_tax\` (no parentheses) produces a **bound method**: a small object that packs together the function and the instance. Calling it later supplies \`self\` automatically. That's why you can pass \`button.on_click(cart.checkout)\` or \`sorted(items, key=pricer.price_of)\` and it just works. \`Product.price_with_tax\` on the class is the plain function and needs the instance passed explicitly.`,
  ],
  walkthrough: {
    title: 'Reading the Product class line by line',
    lang: 'python',
    code: PRODUCT,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 3], text: py`Two **class attributes**, created once when the class body runs. Every product can read them; nothing is stored on the instances yet.` },
      { lines: [5, 8], text: py`\`__init__\` sets the per-product data on \`self\`. \`Product.created += 1\` deliberately writes through the **class**, so the counter is shared.` },
      { lines: [10, 14], text: py`\`@classmethod\` makes Python pass the class as \`cls\`. The method parses a CSV line and returns \`cls(...)\` — a new instance, built through the normal \`__init__\`.` },
      { lines: [16, 18], text: py`\`@staticmethod\`: no \`self\`, no \`cls\`. It's an ordinary function kept on the class because it's about products.` },
      { lines: [20, 21], text: py`A normal instance method. \`self.tax_rate\` isn't on the instance, so it is read from the class — unless the instance has shadowed it.` },
      { lines: [24, 26], text: py`One product made with \`__init__\`, one with the alternative constructor. Both are ordinary \`Product\` instances: \`9.6 30.6\`.` },
      { lines: [28, 29], text: py`\`lamp.tax_rate = 0.05\` writes onto \`lamp\` only. \`mug\` and the class still say \`0.2\`.` },
      { lines: [30], text: py`The counter reached 2 (one per \`__init__\` call, including the one inside \`from_csv\`). The static method is called through the class.` },
      { lines: [32, 33], text: py`\`mug.price_with_tax\` without parentheses is a **bound method** that remembers \`mug\`. Calling \`buy()\` later still uses \`mug\` as \`self\`.` },
    ],
  },
  playground: {
    title: 'Products, prices and tax',
    objective: 'See where each attribute lives, then add your own class method, a validation rule, and fix a shared-list trap.',
    files: { 'main.py': PRODUCT },
    expected: py`\`\`\`text
9.6 30.6
0.2 0.05 0.2
2 False
9.6
\`\`\`

Try \`print(vars(lamp))\` and \`print(vars(mug))\`: only \`lamp\` has a \`tax_rate\` of its own.`,
    experiments: [
      {
        id: 'global-tax',
        task: py`The tax rate drops to 10% for everyone. Add **one line** (anywhere after the class) that changes it for every product that hasn't overridden it. Predict: what will \`lamp\` use?`,
        hint: py`Change the attribute on the class itself: \`Product.tax_rate = 0.10\`.`,
        tests: [
          { name: 'the class rate is 0.10', code: py`assert Product.tax_rate == approx(0.10)` },
          { name: 'mug now costs 8.8 with tax', code: py`assert mug.price_with_tax() == approx(8.8)` },
          { name: 'lamp keeps its own override', code: py`assert lamp.tax_rate == approx(0.05)` },
        ],
        explain: py`Changing a class attribute affects every instance that reads it from the class. \`lamp\` has its own \`tax_rate\` in its \`__dict__\`, found first, so it keeps \`0.05\`. That's shadowing.`,
      },
      {
        id: 'from-dict',
        task: py`Add a second alternative constructor: \`@classmethod from_dict(cls, data)\` that builds a product from \`{"name": "pen", "price": 1.5}\`. It must return \`cls(...)\` so subclasses work.`,
        hint: py`Copy the shape of \`from_csv\`: \`return cls(data["name"], float(data["price"]))\`.`,
        tests: [
          { name: 'from_dict builds a Product', code: py`p = Product.from_dict({"name": "pen", "price": 1.5})
assert isinstance(p, Product) and (p.name, p.price) == ("pen", 1.5)` },
          { name: 'a subclass gets its own type back', code: py`class Gift(Product):
    pass

assert type(Gift.from_dict({"name": "card", "price": 2})) is Gift, 'Use cls(...), not Product(...)'` },
        ],
        explain: py`Because \`from_dict\` receives the class it was called on, \`Gift.from_dict(...)\` builds a \`Gift\`. Hard-coding \`Product(...)\` would silently hand subclasses the wrong type.`,
      },
      {
        id: 'validate-price',
        task: py`Make \`__init__\` raise \`ValueError\` when the price is negative, using the existing static method \`is_valid_price\`.`,
        hint: py`At the top of \`__init__\`: \`if not Product.is_valid_price(price): raise ValueError("price must be >= 0")\`.`,
        tests: [
          { name: 'a negative price raises ValueError', code: py`with raises(ValueError):
    Product("broken", -1)` },
          { name: 'normal products still work', code: py`assert Product("ok", 0).price == 0` },
        ],
        explain: py`The static method keeps the rule in one named place, and \`__init__\` enforces it, so no invalid product can exist. Because \`from_csv\` goes through \`cls(...)\`, it is validated too — for free.`,
      },
      {
        id: 'reviews-trap',
        task: py`Add a class attribute \`reviews = []\` next to \`tax_rate\`, and a method \`add_review(self, text)\` that does \`self.reviews.append(text)\`. Call \`mug.add_review("Great mug!")\` and \`print(lamp.reviews)\`. Surprised? Now **fix it** so every product has its own list.`,
        hint: py`Delete the class-level \`reviews = []\` and put \`self.reviews = []\` inside \`__init__\` instead.`,
        tests: [
          { name: 'add_review exists', code: py`assert hasattr(Product, "add_review"), 'Define add_review(self, text) in the class'` },
          { name: 'reviews are per product', code: py`a = Product("a", 1)
b = Product("b", 2)
a.add_review("great")
assert b.reviews == [], 'Each product needs its own list: self.reviews = [] in __init__'
assert "reviews" in vars(a)` },
        ],
        explain: py`With \`reviews = []\` on the class, \`self.reviews\` finds the one class-level list and \`.append\` mutates it for everyone — \`lamp\` saw the mug's review. Creating the list in \`__init__\` gives each product its own.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How Python resolves obj.attr',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'expr', label: 'rex.species', note: 'reading an attribute', x: 100, y: 90, tone: 'yellow' },
        { id: 'inst', label: 'rex.__dict__', note: "{'name': 'Rex'}", x: 300, y: 90 },
        { id: 'cls', label: 'Dog.__dict__', note: 'species, tricks, methods', x: 500, y: 90, tone: 'blue' },
        { id: 'base', label: 'object', note: 'parent classes, in order', x: 680, y: 90, tone: 'kraft' },
        { id: 'err', label: 'AttributeError', note: 'not found anywhere', x: 680, y: 250, tone: 'red' },
        { id: 'write', label: 'fido.species = …', note: 'assignment', x: 100, y: 250, tone: 'yellow' },
        { id: 'fido', label: 'fido.__dict__', note: 'gets its own species', x: 300, y: 250 },
      ],
      edges: [
        { from: 'expr', to: 'inst', label: '1. look here' },
        { from: 'inst', to: 'cls', label: '2. not found' },
        { from: 'cls', to: 'base', label: '3. not found' },
        { from: 'base', to: 'err', label: '4. give up' },
        { from: 'write', to: 'fido', label: 'always here' },
      ],
      steps: [
        { focus: ['expr'], text: py`Reading \`rex.species\` starts a search. Python never copies class attributes into instances — it *looks them up* each time.` },
        { focus: ['expr', 'inst'], edges: ['expr->inst'], text: py`Step 1: the instance's own \`__dict__\`. If \`species\` were there (because someone assigned \`rex.species = ...\`), the search would stop here.` },
        { focus: ['inst', 'cls'], edges: ['inst->cls'], text: py`Step 2: the class. \`Dog.__dict__\` has \`species = "canine"\`, so that value is returned. Methods are found here the same way — a function found on the class comes back as a **bound method** with \`self\` filled in.` },
        { focus: ['cls', 'base'], edges: ['cls->base'], text: py`Step 3: the parent classes, in method resolution order, ending with \`object\`. That's how [inheritance](lesson:inheritance) works.` },
        { focus: ['base', 'err'], edges: ['base->err'], text: py`Nothing anywhere? \`AttributeError: 'Dog' object has no attribute 'species'\`.` },
        { focus: ['write', 'fido'], edges: ['write->fido'], text: py`**Writing is different**: \`fido.species = "good boy"\` doesn't search at all. It stores the value in \`fido.__dict__\`, which then *shadows* the class attribute for \`fido\` only. (Properties, in the next lesson, are the exception that can intercept writes.)` },
      ],
    },
    alt: 'Diagram of attribute lookup. Reading rex.species checks rex.__dict__ first, then Dog.__dict__ where species is found, then the parent classes ending at object, and finally raises AttributeError if nothing matches. A separate path shows that assignment fido.species = ... always writes into fido.__dict__, shadowing the class attribute.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A class body is a namespace too. \`vars(Product)\` shows its contents: class attributes *and* methods (methods are just functions stored there). \`vars(mug)\` shows only the instance's own data.`,
      { code: py`class Product:
    tax_rate = 0.2

    def __init__(self, name):
        self.name = name

    def label(self):
        return self.name.title()


mug = Product("mug")
print(vars(mug))                                   # {'name': 'mug'}
print([k for k in vars(Product) if not k.startswith("__")])   # ['tax_rate', 'label']`, lang: 'python', title: 'two namespaces' },
      py`\`mug.label()\` works because Python looks up \`label\`, doesn't find it on \`mug\`, finds it on \`Product\`, and passes \`mug\` in as \`self\`.`,
    ],
    technical: [
      py`**Methods are descriptors.** A function stored on a class has a \`__get__\` method. When the lookup \`mug.label\` finds it on the class, Python calls \`function.__get__(mug, Product)\`, which returns a *bound method* (\`types.MethodType\`) carrying \`__func__\` and \`__self__\`. \`classmethod\` and \`staticmethod\` are wrapper objects with their own \`__get__\`: \`classmethod\` binds to the class, \`staticmethod\` returns the raw function. The full mechanism is in [descriptors](lesson:descriptors).`,
      { code: py`class Product:
    @classmethod
    def make(cls):
        return cls()

    @staticmethod
    def helper():
        return "help"

    def regular(self):
        return self


raw = vars(Product)
print(type(raw["make"]).__name__, type(raw["helper"]).__name__, type(raw["regular"]).__name__)
# classmethod staticmethod function
print(Product.make)    # <bound method Product.make of <class '__main__.Product'>>`, lang: 'python', title: 'what the decorators really store' },
      py`**The real lookup rule** is slightly richer than "instance, then class". For \`obj.x\`, \`object.__getattribute__\` first searches the class's MRO; if it finds a **data descriptor** (one that defines \`__set__\`, like a \`property\`), that wins *even over the instance dict*. Otherwise the instance \`__dict__\` is checked, then any non-data descriptor or plain class attribute found earlier. That's why a property can't be shadowed by an instance attribute but a method can. See [attribute access](lesson:attribute-access).`,
      py`**A new bound method per lookup.** The reference says the function → bound-method transformation happens *each time* the attribute is retrieved, so \`mug.label is mug.label\` is \`False\` (two separate objects) while \`mug.label == mug.label\` is \`True\` (same function, same instance).`,
      { callout: 'note', title: 'CPython detail', text: py`For a direct call like \`mug.label()\`, CPython's bytecode avoids creating the bound-method object at all (it loads the function and the instance side by side). CPython also caches attribute lookups on types to make the class search cheap. And \`id(mug.label) == id(mug.label)\` can print \`True\`: the first temporary bound method is freed and its memory reused by the second. All implementation details — don't rely on them.` },
    ],
    production: [
      py`**Use class attributes for constants and defaults** that are immutable: \`MAX_RETRIES = 3\`, \`default_timeout = 30\`, \`content_type = "application/json"\`. Annotate them with \`typing.ClassVar[int]\` so type checkers (and [dataclasses](lesson:dataclasses), which treat un-annotated vs annotated names differently) know they are not per-instance fields.`,
      py`**Name alternative constructors \`from_<source>\`** and keep \`__init__\` as the single, simple, validated path. Real-world examples: \`datetime.fromisoformat()\`, \`dict.fromkeys()\`, \`int.from_bytes()\`, \`pathlib.Path.home()\`. Factories that read files or call APIs belong in classmethods so constructing from raw values stays cheap in tests.`,
      py`**Prefer module-level functions to \`@staticmethod\`** unless the function is genuinely part of the class's interface. Linters such as pylint flag methods that never use \`self\` ("could be a function"), which is a useful nudge.`,
      py`**Bound methods hold a strong reference** to their instance. Registering \`obj.handle\` as a callback in a long-lived registry keeps \`obj\` alive. When that matters, store a \`weakref.WeakMethod\` instead — see [memory management](lesson:memory-management).`,
    ],
  },
  mistakes: [
    {
      title: 'A mutable class attribute shared by every instance',
      wrong: { code: py`class Team:
    members = []                    # ONE list on the class

    def __init__(self, name):
        self.name = name

    def join(self, person):
        self.members.append(person)


red, blue = Team("red"), Team("blue")
red.join("Ada")
print(blue.members)   # ['Ada'] — blue never recruited anyone!`, lang: 'python' },
      right: { code: py`class Team:
    def __init__(self, name):
        self.name = name
        self.members = []           # a new list per team

    def join(self, person):
        self.members.append(person)


red, blue = Team("red"), Team("blue")
red.join("Ada")
print(blue.members)   # []`, lang: 'python' },
      explanation: py`\`self.members\` finds the class's list because the instance has none, and \`.append\` mutates it. Per-object mutable state must be created in \`__init__\`.`,
    },
    {
      title: 'Incrementing a class counter through self',
      wrong: { code: py`class Visitor:
    count = 0

    def __init__(self):
        self.count += 1     # reads 0 from the class, writes 1 onto self


Visitor()
Visitor()
print(Visitor.count)  # 0`, lang: 'python' },
      right: { code: py`class Visitor:
    count = 0

    def __init__(self):
        type(self).count += 1   # or Visitor.count += 1


Visitor()
Visitor()
print(Visitor.count)  # 2`, lang: 'python' },
      explanation: py`\`self.count += 1\` is \`self.count = self.count + 1\`: the read falls through to the class, but the write creates an instance attribute. The class value never changes. Write class state through the class.`,
    },
    {
      title: 'Hard-coding the class name in a classmethod',
      wrong: { code: py`class Product:
    def __init__(self, name):
        self.name = name

    @classmethod
    def from_csv(cls, line):
        return Product(line.strip())    # ignores cls


class Gift(Product):
    pass


print(type(Gift.from_csv("card")).__name__)   # Product — wrong type!`, lang: 'python' },
      right: { code: py`class Product:
    def __init__(self, name):
        self.name = name

    @classmethod
    def from_csv(cls, line):
        return cls(line.strip())


class Gift(Product):
    pass


print(type(Gift.from_csv("card")).__name__)   # Gift`, lang: 'python' },
      explanation: py`The whole point of receiving \`cls\` is that subclasses inherit a constructor that builds *their* type. Always construct with \`cls(...)\`.`,
    },
    {
      title: 'Forgetting the @classmethod decorator',
      wrong: { code: py`class Product:
    def __init__(self, name):
        self.name = name

    def from_csv(cls, line):            # no decorator
        return cls(line.strip())


Product.from_csv("mug")   # TypeError: Product.from_csv() missing 1 required positional argument: 'line'`, lang: 'python', static: true },
      right: { code: py`class Product:
    def __init__(self, name):
        self.name = name

    @classmethod
    def from_csv(cls, line):
        return cls(line.strip())


print(Product.from_csv("mug").name)`, lang: 'python' },
      explanation: py`Naming a parameter \`cls\` does nothing on its own. Without the decorator it's a plain function: called on the class, \`"mug"\` goes into \`cls\` and \`line\` is missing.`,
    },
    {
      title: 'Using a method without calling it',
      wrong: { code: py`class Cart:
    def __init__(self):
        self.items = [3.5, 1.2]

    def total(self):
        return sum(self.items)


cart = Cart()
print("Total:", cart.total)   # Total: <bound method Cart.total of <...>>`, lang: 'python' },
      right: { code: py`class Cart:
    def __init__(self):
        self.items = [3.5, 1.2]

    def total(self):
        return sum(self.items)


cart = Cart()
print("Total:", cart.total())   # Total: 4.7`, lang: 'python' },
      explanation: py`Without \`()\` you get the bound method object itself. Worse, \`if cart.is_empty:\` is *always* true because a method object is truthy. If you want attribute-style access to a computed value, make it a property — see [properties](lesson:properties-and-encapsulation).`,
    },
  ],
  debugging: [
    {
      symptom: py`All instances show the same list/dict contents.`,
      cause: py`The list or dict is a class attribute (defined in the class body), so every instance reads and mutates the same object.`,
      fix: py`Create it in \`__init__\` (\`self.items = []\`). Check with \`"items" in vars(obj)\` — if it's \`False\`, the instance is using the class's object.`,
    },
    {
      symptom: py`A class-level counter stays at 0 although __init__ increments it.`,
      cause: py`\`self.count += 1\` creates an instance attribute instead of updating the class.`,
      fix: py`Use \`type(self).count += 1\` or \`ClassName.count += 1\`.`,
    },
    {
      symptom: py`TypeError: Product.from_csv() missing 1 required positional argument: 'line'`,
      cause: py`The method has a \`cls\` parameter but no \`@classmethod\` decorator, so nothing fills \`cls\` automatically.`,
      fix: py`Add \`@classmethod\` directly above the \`def\`.`,
    },
    {
      symptom: py`AttributeError: type object 'Product' has no attribute 'name'`,
      cause: py`An instance attribute was read through the class (\`Product.name\`). Instance attributes only exist on instances, after \`__init__\` ran.`,
      fix: py`Read it from an instance (\`mug.name\`). If every product really shares the value, define it as a class attribute.`,
    },
    {
      symptom: py`Output shows <bound method Cart.total of <__main__.Cart object at 0x...>>`,
      cause: py`The method was referenced but not called (missing parentheses).`,
      fix: py`Add \`()\`: \`cart.total()\`. Or turn it into a \`@property\` if it should read like an attribute.`,
    },
  ],
  bestPractices: [
    'Put per-instance state (especially lists, dicts and sets) in __init__; keep class attributes for constants, defaults and deliberately shared state.',
    'Update class-level state through the class (type(self).x or ClassName.x), never with self.x = ….',
    'Name alternative constructors from_<source> and always build instances with cls(...).',
    'Keep __init__ simple and do parsing or I/O in classmethod factories.',
    'Prefer a module-level function to a @staticmethod unless it truly belongs to the class\'s interface.',
    'Always name the first parameter self (instance methods) or cls (class methods).',
    'Annotate class-level constants with typing.ClassVar when you use type hints.',
  ],
  useCases: [
    'Alternative constructors: Order.from_json(data), Config.from_file(path), Color.from_hex("#ff8800").',
    'Shared configuration on the class: default timeouts, API base URLs, tax rates.',
    'Class-wide bookkeeping: counting instances or handing out sequential ids.',
    'Validation helpers kept next to the class they validate (@staticmethod).',
    'Passing bound methods as callbacks: sorted(items, key=pricer.price_of), button.on_click(cart.checkout).',
  ],
  whenToUse: {
    use: [
      'Instance method — the behaviour reads or changes one object\'s data (the default choice).',
      '@classmethod — you need the class itself: alternative constructors or class-wide state that subclasses may override.',
      '@staticmethod — a helper conceptually owned by the class that needs neither self nor cls.',
    ],
    avoid: [
      'A mutable class attribute for data that should be per-instance.',
      '@staticmethod for a general utility that other modules would like to import — make it a function.',
      'Calling the class by name inside a classmethod — use cls.',
    ],
  },
  comparison: {
    title: 'Four places to put a function',
    headers: ['', 'instance method', '@classmethod', '@staticmethod', 'module function'],
    rows: [
      ['first argument', 'self (the instance)', 'cls (the class)', 'nothing automatic', 'nothing automatic'],
      ['can use instance data', 'yes', 'no', 'no', 'no'],
      ['can use class data', 'yes, via self or type(self)', 'yes, via cls', 'only by naming the class', 'only by naming the class'],
      ['typical call', 'cart.total()', 'Product.from_csv(line)', 'Product.is_valid_price(9)', 'is_valid_price(9)'],
      ['typical use', 'behaviour of one object', 'alternative constructors, class-wide state', 'helper tightly tied to the class', 'reusable utility'],
    ],
    note: py`Default to an instance method. Reach for \`@classmethod\` when you need the class, and question every \`@staticmethod\`: would a plain function be clearer?`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'methods-and-attributes-q1',
      type: 'mcq',
      prompt: py`\`species\` is a class attribute of \`Dog\`. What does \`fido.species = "good boy"\` do?`,
      options: [
        { text: 'Changes species for every Dog', why: 'Assignment through an instance never touches the class. To change it for all, assign Dog.species.' },
        'Creates an instance attribute on fido that shadows the class attribute',
        { text: 'Raises AttributeError because species belongs to the class', why: 'Python happily lets you set any attribute on a normal instance.' },
        { text: 'Changes both the class and fido', why: 'Only fido.__dict__ is written. The class still holds its original value.' },
      ],
      answer: 1,
      explanation: py`Writes go to the instance's \`__dict__\`. From now on \`fido.species\` finds its own value first; every other dog still reads \`Dog.species\`.`,
    },
    {
      id: 'methods-and-attributes-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Lamp:
    watts = 60


a = Lamp()
b = Lamp()
a.watts = 100
Lamp.watts = 40
print(a.watts, b.watts)`,
      answer: '100 40',
      accept: ['100 40'],
      explanation: py`\`a\` has its own \`watts\` (100) that shadows the class. \`b\` has none, so it reads the class attribute, which was changed to 40.`,
    },
    {
      id: 'methods-and-attributes-q3',
      type: 'bug',
      prompt: 'Adding a song to one playlist shows up in every playlist. Click the line that causes it.',
      code: py`class Playlist:
    songs = []

    def __init__(self, name):
        self.name = name

    def add(self, song):
        self.songs.append(song)


road_trip = Playlist("Road trip")
study = Playlist("Study")
road_trip.add("Bohemian Rhapsody")
print(study.songs)`,
      answerLine: 2,
      explanation: py`\`songs = []\` creates a single list on the class. \`self.songs.append\` finds that shared list because no instance has its own. Move it into \`__init__\` as \`self.songs = []\`.`,
    },
    {
      id: 'methods-and-attributes-q4',
      type: 'fill',
      prompt: 'Complete the alternative constructor so `Point.from_string("3,4")` returns a `Point` — and a subclass would get its own type.',
      code: py`class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    @___
    def from_string(cls, text):
        x, y = text.split(",")
        return ___(float(x), float(y))`,
      answer: [['classmethod'], ['cls']],
      explanation: py`\`@classmethod\` makes Python pass the class as \`cls\`, and \`cls(...)\` builds an instance of whichever class the method was called on.`,
    },
    {
      id: 'methods-and-attributes-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`class Visitor:
    count = 0

    def __init__(self):
        self.count += 1


a = Visitor()
b = Visitor()
print(Visitor.count, a.count)`,
      options: [
        { text: '2 2', why: 'That would need the class attribute to be updated. self.count += 1 writes to the instance, not the class.' },
        { text: '2 1', why: 'The class counter never changes — the write lands on each instance.' },
        '0 1',
        { text: 'AttributeError', why: 'Reading self.count works: it falls back to the class attribute 0.' },
      ],
      answer: 2,
      explanation: py`For each visitor, \`self.count += 1\` reads \`0\` from the class and writes \`1\` onto the instance. \`Visitor.count\` stays \`0\`; \`a.count\` is \`1\`. Use \`type(self).count += 1\` to count on the class.`,
    },
    {
      id: 'methods-and-attributes-q6',
      type: 'mcq',
      prompt: 'Which statement about `@staticmethod` is correct?',
      options: [
        { text: 'It receives the class as its first argument', why: 'That describes @classmethod.' },
        { text: 'It can only be called on the class, never on an instance', why: 'Both Product.helper() and mug.helper() work.' },
        'It receives no automatic first argument; it is a plain function stored on the class',
        { text: 'It runs faster than any module-level function', why: 'There is no meaningful speed benefit; the choice is about organisation.' },
      ],
      answer: 2,
      explanation: py`A static method gets exactly the arguments you pass. It lives on the class for organisation; if it isn't really part of the class, a module-level function is often clearer.`,
    },
    {
      id: 'methods-and-attributes-q7',
      type: 'short',
      prompt: 'Inside a classmethod alternative constructor, why write `return cls(...)` instead of `return Product(...)`?',
      answer: py`cls is the class the method was actually called on. If a subclass such as SaleProduct calls the inherited from_csv, cls is SaleProduct, so it gets a SaleProduct back. Hard-coding Product would always build the parent type and silently break subclasses.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'temperature-constructors',
      title: 'Temperatures from anywhere',
      difficulty: 'intermediate',
      prompt: py`\`Temperature\` stores a value in \`celsius\`. Add two **class methods** (alternative constructors):

- \`Temperature.from_fahrenheit(f)\` → a temperature whose \`celsius\` is \`(f - 32) * 5 / 9\`.
- \`Temperature.from_string(text)\` → accepts strings like \`"21.5C"\`, \`"70F"\`, \`" 212f "\` (surrounding spaces and lower-case units allowed). Any other unit raises \`ValueError\`.

Both must build the object with \`cls(...)\`, so a subclass calling them gets an instance of the subclass. The program must print exactly \`200.0 39.2\`.`,
      files: {
        'main.py': py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, fahrenheit):
        return cls(0)  # TODO

    @classmethod
    def from_string(cls, text):
        return cls(0)  # TODO: "21.5C" or "70F"

    def to_fahrenheit(self):
        return self.celsius * 9 / 5 + 32


oven = Temperature.from_string("392F")
fridge = Temperature.from_string("4C")
print(oven.celsius, fridge.to_fahrenheit())
`,
      },
      hints: [
        'from_fahrenheit only needs the formula, then cls(...) with the result.',
        'In from_string, clean the text with .strip().upper(), then split it into the number (text[:-1]) and the unit (text[-1]).',
        'If the unit is "C" return cls(number); if "F" return cls.from_fahrenheit(number) — reuse the other classmethod; otherwise raise ValueError(f"unknown unit: {unit}").',
      ],
      solution: {
        explanation: py`Both constructors return \`cls(...)\`, so \`__init__\` stays the single place that stores \`celsius\`, and subclasses get their own type. \`from_string\` normalises the input with \`strip().upper()\`, splits off the last character as the unit, and delegates the Fahrenheit case to \`cls.from_fahrenheit\` instead of repeating the formula. \`float()\` turns \`"392"\` into \`392.0\`: (392 − 32) × 5 / 9 = 200.0, and 4 °C is 4 × 9 / 5 + 32 = 39.2 °F.`,
        files: {
          'main.py': py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, fahrenheit):
        return cls((fahrenheit - 32) * 5 / 9)

    @classmethod
    def from_string(cls, text):
        text = text.strip().upper()
        number, unit = float(text[:-1]), text[-1]
        if unit == "C":
            return cls(number)
        if unit == "F":
            return cls.from_fahrenheit(number)
        raise ValueError(f"unknown unit: {unit}")

    def to_fahrenheit(self):
        return self.celsius * 9 / 5 + 32


oven = Temperature.from_string("392F")
fridge = Temperature.from_string("4C")
print(oven.celsius, fridge.to_fahrenheit())
`,
        },
      },
      tests: [
        { name: 'from_fahrenheit converts', code: py`assert Temperature.from_fahrenheit(212).celsius == approx(100)
assert Temperature.from_fahrenheit(32).celsius == approx(0)` },
        { name: 'from_string reads Celsius', code: py`assert Temperature.from_string("21.5C").celsius == approx(21.5)` },
        { name: 'from_string reads Fahrenheit with spaces and lower case', code: py`assert Temperature.from_string(" 212f ").celsius == approx(100)` },
        { name: 'an unknown unit raises ValueError', code: py`with raises(ValueError):
    Temperature.from_string("300K")` },
        { name: 'subclasses get their own type', code: py`class Reading(Temperature):
    pass

assert type(Reading.from_fahrenheit(50)) is Reading, 'Build the object with cls(...)'
assert type(Reading.from_string("20C")) is Reading` },
        { name: 'prints "200.0 39.2"', code: py`assert output.strip() == "200.0 39.2"` },
      ],
    },
    {
      id: 'chat-rooms',
      title: 'Chat rooms that don\'t leak',
      difficulty: 'intermediate',
      prompt: py`The \`ChatRoom\` class has a bug: a message posted in one room shows up in every room. Fix it, and finish the room counter:

- Each room must keep **its own** \`messages\` list (an instance attribute).
- \`max_length\` stays a **class attribute** (\`20\`): \`post()\` cuts each message's text to that many characters, and changing \`ChatRoom.max_length\` affects every room.
- \`rooms_created\` is a **class attribute** that \`__init__\` increments on the class (not on the instance).

The program must print exactly:

\`\`\`text
['ada: hello everyone, welc']
['ben: cats or dogs?']
2
\`\`\``,
      files: {
        'main.py': py`class ChatRoom:
    max_length = 20          # shared setting for every room
    rooms_created = 0        # TODO: count rooms in __init__
    messages = []

    def __init__(self, name):
        self.name = name

    def post(self, user, text):
        self.messages.append(f"{user}: {text[:self.max_length]}")

    def latest(self, n=3):
        return self.messages[-n:]


general = ChatRoom("general")
random_room = ChatRoom("random")
general.post("ada", "hello everyone, welcome to the chat")
random_room.post("ben", "cats or dogs?")
print(general.latest())
print(random_room.latest())
print(ChatRoom.rooms_created)
`,
      },
      hints: [
        'Use vars(general) to see which attributes really live on the instance. Is messages there?',
        'Move messages into __init__ as self.messages = []. Leave max_length where it is — it is meant to be shared and is an immutable int.',
        'Count with ChatRoom.rooms_created += 1 (or type(self).rooms_created += 1) inside __init__. self.rooms_created += 1 would only create an instance attribute.',
      ],
      solution: {
        explanation: py`The list moves into \`__init__\`, so every room gets a fresh one. \`max_length\` stays on the class: it's an immutable int that rooms only read, so sharing it is exactly what we want, and \`ChatRoom.max_length = 50\` changes it for all rooms at once. The counter is written through the class (\`type(self).rooms_created += 1\`), so the class value really goes up; \`self.rooms_created += 1\` would have created a per-room copy.`,
        files: {
          'main.py': py`class ChatRoom:
    max_length = 20          # shared setting for every room
    rooms_created = 0

    def __init__(self, name):
        self.name = name
        self.messages = []
        type(self).rooms_created += 1

    def post(self, user, text):
        self.messages.append(f"{user}: {text[:self.max_length]}")

    def latest(self, n=3):
        return self.messages[-n:]


general = ChatRoom("general")
random_room = ChatRoom("random")
general.post("ada", "hello everyone, welcome to the chat")
random_room.post("ben", "cats or dogs?")
print(general.latest())
print(random_room.latest())
print(ChatRoom.rooms_created)
`,
        },
      },
      tests: [
        { name: 'rooms keep separate messages', code: py`a, b = ChatRoom("a"), ChatRoom("b")
a.post("x", "hi")
assert b.messages == []` },
        { name: 'messages is an instance attribute', code: py`assert "messages" in vars(ChatRoom("t"))` },
        { name: 'max_length is still a shared class attribute', code: py`r = ChatRoom("t")
assert "max_length" in vars(ChatRoom) and "max_length" not in vars(r)
ChatRoom.max_length = 5
r.post("u", "abcdefgh")
assert r.messages[-1] == "u: abcde"` },
        { name: 'rooms_created counts on the class', code: py`before = ChatRoom.rooms_created
r = ChatRoom("x")
ChatRoom("y")
assert ChatRoom.rooms_created == before + 2
assert "rooms_created" not in vars(r), 'Increment the class attribute, not self.rooms_created'` },
        { name: 'prints the expected three lines', code: py`assert output.strip() == "['ada: hello everyone, welc']\n['ben: cats or dogs?']\n2"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'methods-and-attributes-class-vs-instance-attrs',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between a class attribute and an instance attribute?',
      answer: 'A class attribute is defined in the class body and stored once on the class; all instances can read it. An instance attribute is set on self (usually in __init__) and stored in that one object\'s __dict__. Reading obj.x checks the instance first, then the class.',
      explanation: py`Class attributes suit constants and shared defaults; instance attributes hold per-object state. Assigning \`obj.x = ...\` creates an instance attribute that shadows the class one; assigning \`Class.x = ...\` changes it for every instance that hasn't shadowed it.`,
      code: { lang: 'python', code: py`class Config:
    timeout = 30                 # class attribute

    def __init__(self, url):
        self.url = url           # instance attribute


a, b = Config("a.example"), Config("b.example")
a.timeout = 5                    # shadows for a only
print(a.timeout, b.timeout, Config.timeout)   # 5 30 30` },
      whyAsked: 'It is the basis of the shared-mutable trap and of how methods are found; weak answers here lead to real bugs.',
      mistakes: ['Saying class attributes are copied into each instance', 'Not knowing that obj.x = ... never modifies the class', 'Using class attributes for per-object lists'],
      followUps: ['What happens if a class attribute is a list and you append through an instance?', 'How do you update a class attribute from inside a method?', 'What is typing.ClassVar for?'],
      modelAnswer: 'A class attribute is defined directly in the class body, so it lives once on the class object and every instance can read it — good for constants and shared defaults. An instance attribute is assigned on self, normally in __init__, and lives in that object\'s own __dict__. When I read obj.x, Python checks the instance first and then the class. When I assign obj.x, it always writes to the instance, which shadows the class value for that one object. The classic trap is a mutable class attribute like a list: appending through any instance mutates the one shared list.',
    },
    {
      id: 'methods-and-attributes-shared-list',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print, and how would you fix it?',
      code: { lang: 'python', code: py`class Dog:
    tricks = []

    def __init__(self, name):
        self.name = name

    def add_trick(self, trick):
        self.tricks.append(trick)


a = Dog("Rex")
b = Dog("Fido")
a.add_trick("roll over")
print(b.tricks)` },
      options: ['[]', "['roll over']", 'AttributeError', "[['roll over']]"],
      correctOption: 1,
      answer: "`['roll over']` — tricks is one list on the class; self.tricks finds it and append mutates it for every dog. Fix: self.tricks = [] in __init__.",
      explanation: py`Neither instance has \`tricks\` in its \`__dict__\`, so \`self.tricks\` resolves to the class attribute. \`append\` mutates that shared object. (This exact example appears in the official Python tutorial.) Creating the list in \`__init__\` gives each dog its own.`,
      whyAsked: 'One of the most common real-world OOP bugs in Python; checks understanding of lookup plus mutation.',
      mistakes: ['Answering [] because "each object has its own attributes"', 'Fixing it by copying the list in add_trick instead of initialising per instance'],
      followUps: ['Why does the same pattern work fine for a class attribute that is an int?', 'How does this relate to mutable default arguments?'],
      modelAnswer: 'It prints a list containing "roll over". tricks is defined in the class body, so there is exactly one list, on the class. Neither dog has its own tricks attribute, so self.tricks finds the class list, and append mutates it in place — every dog sees it. With an int it would behave differently, because self.count = ... assigns rather than mutates, creating an instance attribute. The fix is to create self.tricks = [] inside __init__ so each dog gets its own list.',
    },
    {
      id: 'methods-and-attributes-classmethod-vs-staticmethod',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare instance methods, @classmethod and @staticmethod. When would you use each?',
      answer: 'Instance methods get self and work on one object\'s data (the default). Classmethods get cls and are for alternative constructors and class-wide state; they respect subclasses. Staticmethods get nothing automatically — a function namespaced in the class; often a module-level function is better.',
      explanation: py`All three are functions stored on the class; the decorators change what \`__get__\` returns when you look them up. A classmethod called on a subclass receives the subclass, which is why \`cls(...)\` constructors are inheritance-friendly. Static methods can be overridden in subclasses and called via \`self.helper()\`, which is their main advantage over a module function.`,
      code: { lang: 'python', code: py`class Order:
    def __init__(self, items):
        self.items = items

    def total(self):                       # instance method
        return sum(self.items)

    @classmethod
    def from_csv(cls, line):               # alternative constructor
        return cls([float(x) for x in line.split(",")])

    @staticmethod
    def is_valid_amount(x):                # helper, no self/cls
        return x >= 0


print(Order.from_csv("1.5,2.5").total(), Order.is_valid_amount(-1))` },
      whyAsked: 'Shows whether you can choose the right tool and explain decorators beyond memorised definitions.',
      mistakes: ['Saying staticmethods are "faster"', 'Using classmethod when nothing touches cls', 'Hard-coding the class name inside classmethods'],
      followUps: ['Why does from_csv return cls(...) rather than Order(...)?', 'Can a static method be overridden in a subclass?', 'How do these decorators work internally?'],
      modelAnswer: 'An instance method receives self and works with one object\'s data — that is the default. A classmethod receives cls, the class it was called on; I use it for alternative constructors like from_csv or from_json, and for class-wide state. Because cls is the actual class, a subclass calling it gets an instance of the subclass. A staticmethod receives nothing automatically; it is just a function namespaced inside the class. I use it only when the helper really belongs to the class interface — otherwise a module-level function is simpler to import and test.',
    },
    {
      id: 'methods-and-attributes-ticket-ids',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Every `Ticket` should get a unique, sequential `id` (1, 2, 3, …) from a class-level counter `next_id`. The starter gives every ticket id 1. Fix `__init__` and implement `@classmethod reset_ids()` that restarts numbering at 1.',
      answer: 'Read and update the counter on the class: self.id = Ticket.next_id; Ticket.next_id += 1. reset_ids sets cls.next_id = 1.',
      explanation: py`The starter's \`self.next_id += 1\` reads 1 from the class and writes 2 onto the *instance*, so the class counter never moves and every ticket gets id 1. Writing through the class fixes it. The classmethod receives the class and resets the shared counter.`,
      starter: { files: { 'main.py': py`class Ticket:
    next_id = 1

    def __init__(self, title):
        self.title = title
        self.id = self.next_id
        self.next_id += 1

    @classmethod
    def reset_ids(cls):
        pass  # TODO


tickets = [Ticket("login broken"), Ticket("typo on homepage"), Ticket("slow search")]
for t in tickets:
    print(t.id, t.title)
` } },
      tests: [
        { name: 'ids are sequential', code: py`Ticket.reset_ids()
a, b, c = Ticket("a"), Ticket("b"), Ticket("c")
assert (a.id, b.id, c.id) == (1, 2, 3)` },
        { name: 'the counter lives on the class only', code: py`Ticket.reset_ids()
t = Ticket("x")
assert Ticket.next_id == 2
assert "next_id" not in vars(t), 'Do not create next_id on the instance'` },
        { name: 'reset_ids restarts at 1', code: py`Ticket("x"); Ticket("y")
Ticket.reset_ids()
assert Ticket("z").id == 1` },
      ],
      solution: { files: { 'main.py': py`class Ticket:
    next_id = 1

    def __init__(self, title):
        self.title = title
        self.id = Ticket.next_id
        Ticket.next_id += 1

    @classmethod
    def reset_ids(cls):
        cls.next_id = 1


tickets = [Ticket("login broken"), Ticket("typo on homepage"), Ticket("slow search")]
for t in tickets:
    print(t.id, t.title)
` } },
      hints: ['Print vars(t) on a starter ticket: where did next_id end up?', 'Write the counter through the class name; in the classmethod, use cls.'],
      whyAsked: 'Tests the read-from-class / write-to-instance subtlety in a realistic setting.',
      mistakes: ['Keeping self.next_id += 1', 'Using a global variable instead of class state', 'Resetting with self in a classmethod'],
      followUps: ['Ticket.next_id vs type(self).next_id — what changes with subclasses?', 'Is this counter safe if tickets are created from several threads? (No — use itertools.count or a lock.)'],
      modelAnswer: 'The bug is that self.next_id += 1 reads the class value but writes a new attribute onto the instance, so the class counter stays at 1 forever. I read and increment it through the class: self.id = Ticket.next_id, then Ticket.next_id += 1. reset_ids is a classmethod that sets cls.next_id = 1. I used the class name deliberately so subclasses share one sequence; type(self) would give each subclass its own counter once it increments. In threaded code I would protect this with a lock or use itertools.count.',
    },
    {
      id: 'methods-and-attributes-bound-methods',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What is a bound method? Why is `obj.method is obj.method` False, and what are the practical consequences?',
      answer: 'Looking up a function through an instance creates a bound method object holding __func__ (the function) and __self__ (the instance); calling it prepends the instance. A new one is created on every lookup, so two lookups are equal (==) but not identical (is). It keeps a strong reference to the instance.',
      explanation: py`Functions are non-data descriptors: \`Class.__dict__["m"].__get__(obj, Class)\` returns \`types.MethodType(func, obj)\`. Consequences: you can pass \`obj.m\` as a callback; comparing callbacks must use \`==\`, not \`is\`; registries of bound methods keep objects alive (use \`weakref.WeakMethod\`); and caching \`f = obj.m\` before a hot loop skips repeated lookups.`,
      code: { lang: 'python', code: py`class Light:
    def toggle(self):
        return "click"


lamp = Light()
f = lamp.toggle
print(f.__self__ is lamp, f.__func__ is Light.toggle)   # True True
print(lamp.toggle is lamp.toggle)    # False — two new bound-method objects
print(lamp.toggle == lamp.toggle)    # True  — same function, same instance` },
      whyAsked: 'Probes understanding of the descriptor protocol and of real issues with callbacks, event handlers and memory.',
      mistakes: ['Thinking methods are copied into each instance', 'Removing a callback with is-comparison', 'Not realising callbacks keep their object alive'],
      followUps: ['How does @classmethod change the binding?', 'What is weakref.WeakMethod for?', 'Why might id(obj.m) == id(obj.m) print True in CPython?'],
      modelAnswer: 'A method is just a function stored on the class. When I access it through an instance, the function\'s __get__ creates a bound method — a small object with __func__, the function, and __self__, the instance — and calling it inserts the instance as the first argument. That is what lets me pass obj.method around as a callback. A fresh bound method is created on every attribute access, so obj.m is obj.m is False, though they compare equal with ==. Practically, I compare callbacks with ==, and I remember a bound method holds a strong reference to its object, so a long-lived registry can keep objects alive — WeakMethod solves that. In CPython even id(obj.m) == id(obj.m) can be True, simply because the first temporary was freed and its memory reused.',
    },
    {
      id: 'methods-and-attributes-del-reveals-class',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'A test does `client.timeout = 5`, later `del client.timeout`, and then `client.timeout` returns 30 instead of raising AttributeError. Another test then sets `HttpClient.timeout = 1` and unrelated tests start timing out. Explain both effects.',
      answer: 'timeout is a class attribute (30). Setting client.timeout shadowed it on the instance; del removed only the instance attribute, so lookup falls back to the class value. Assigning HttpClient.timeout changes the class for every instance that has not shadowed it — global state shared between tests.',
      explanation: py`Reading checks the instance \`__dict__\` and then the class. \`del obj.x\` deletes from the instance only (and raises \`AttributeError\` if the instance has no own \`x\`, even when the class does). Mutating class attributes in tests leaks state across tests; use \`unittest.mock.patch.object(HttpClient, "timeout", 1)\`, which restores the original automatically — see [mocking](lesson:mocking).`,
      code: { lang: 'python', code: py`class HttpClient:
    timeout = 30


client = HttpClient()
client.timeout = 5
del client.timeout
print(client.timeout)       # 30 — the class value shows through
other = HttpClient()
HttpClient.timeout = 1
print(other.timeout)        # 1 — every instance is affected` },
      whyAsked: 'Shared class-level state leaking between tests or requests is a real production debugging scenario.',
      mistakes: ['Thinking del removes the attribute everywhere', 'Fixing flaky tests by adding sleeps instead of isolating state'],
      followUps: ['What does del client.timeout raise if the instance never set it?', 'How does mock.patch.object restore state?', 'How would you design the client to avoid shared mutable defaults?'],
      modelAnswer: 'timeout is a class attribute. Assigning client.timeout = 5 created an instance attribute that shadowed it; del client.timeout removed only that instance entry, so the lookup falls back to the class and returns 30 again. The second effect is because assigning HttpClient.timeout modifies the class itself, which every instance without its own override reads — so one test changed global state for the others. In tests I would use mock.patch.object, which restores the value afterwards, or pass the timeout into __init__ so each client owns its configuration.',
    },
    {
      id: 'methods-and-attributes-staticmethod-or-function',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'In code review you see `class StringUtils:` with ten `@staticmethod`s and no other members, used as `StringUtils.slugify(title)`. What would you suggest?',
      answer: 'Replace the class with a module (string_utils.py) of plain functions. A class with only static methods is a namespace imitation; Python modules are already namespaces, and functions are easier to import, test and reuse.',
      explanation: py`This pattern comes from languages where every function must live in a class. In Python, \`from string_utils import slugify\` or \`import string_utils\` gives the same grouping without a class that's never instantiated. Keep \`@staticmethod\` for helpers that are part of a real class's interface — for example, ones subclasses may override and the class calls via \`self.helper()\`. See [modules & imports](lesson:modules-and-imports).`,
      code: { lang: 'python', code: py`# string_utils.py — a module is the namespace
import re


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


print(slugify("Hello, World!"))   # hello-world` },
      whyAsked: 'Checks Pythonic design sense, especially for candidates coming from Java or C#.',
      mistakes: ['Defending the class because it "groups related functions"', 'Converting them all to classmethods'],
      followUps: ['When is a staticmethod genuinely the better choice?', 'How would you organise a large set of helpers into a package?'],
      modelAnswer: 'I would turn StringUtils into a module, string_utils.py, with ten plain functions. A class that is never instantiated and only holds static methods is imitating a namespace, and in Python a module already is one: callers can import string_utils or import slugify directly, and the functions are simpler to test. I keep staticmethods for helpers that genuinely belong to a class\'s interface — for example something the class calls via self.helper() that a subclass might want to override.',
    },
  ],

  takeaways: [
    'Class attributes live once on the class and are shared; instance attributes live in each object\'s __dict__.',
    'Reading obj.x looks at the instance first, then the class (then parent classes); writing obj.x = v always writes to the instance and can shadow the class.',
    'Never use a mutable class attribute for per-object data — create lists and dicts in __init__.',
    'Update class-level state through the class (type(self).count += 1), not through self.',
    '@classmethod receives cls; use it for alternative constructors like from_csv and always build with cls(...).',
    '@staticmethod receives nothing automatically; a plain module-level function is often the better choice.',
    'self and cls are conventions; obj.method without () is a bound method that remembers obj.',
  ],
}
