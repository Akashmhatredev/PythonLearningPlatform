// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CART = py`class ShoppingCart:
    """One customer's cart: who owns it and what is in it."""

    def __init__(self, owner):
        self.owner = owner      # data stored on this cart
        self.items = []         # a brand-new list for every cart

    def add(self, name, price, quantity=1):
        self.items.append((name, price, quantity))

    def total(self):
        return sum(price * qty for name, price, qty in self.items)

    def summary(self):
        return f"{self.owner}: {len(self.items)} line(s), total {self.total():.2f}"


ada_cart = ShoppingCart("Ada")
ben_cart = ShoppingCart("Ben")

ada_cart.add("notebook", 3.50, 2)
ada_cart.add("pen", 1.20)
ben_cart.add("headphones", 25.00)

print(ada_cart.summary())
print(ben_cart.summary())
print(vars(ben_cart))
print(ada_cart.items is ben_cart.items)
print(type(ada_cart).__name__, isinstance(ada_cart, ShoppingCart))
`

export default {
  id: 'classes-and-objects',
  title: 'Classes & objects',
  summary: 'A class bundles data and the functions that work on it into one new type; every object you create from it carries its own attributes.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['defining-functions', 'dictionaries'],
  related: ['methods-and-attributes', 'properties-and-encapsulation', 'inheritance', 'special-methods', 'dataclasses', 'object-model', 'composition'],
  tags: ['class', 'object', 'instance', 'oop', 'object-oriented', '__init__', 'self', 'attribute', 'method', '__dict__', 'vars', 'isinstance', 'blueprint'],
  apis: [
    { name: 'class Name:', summary: 'Defines a new class (a new type) and binds Name to the class object.' },
    { name: '__init__(self, ...)', summary: 'The initialiser: runs automatically on every new instance to set its starting attributes.' },
    { name: 'self', summary: 'The first parameter of a method: the instance the method was called on.' },
    { name: 'obj.__dict__ / vars(obj)', summary: 'The dictionary holding an instance\'s own attributes.' },
    { name: 'isinstance(obj, cls)', summary: 'True if obj is an instance of cls (or of a subclass of it).' },
    { name: 'type(obj)', summary: 'Returns the class an object was created from.' },
  ],
  docs: [
    { label: 'Python tutorial — Classes', url: 'https://docs.python.org/3/tutorial/classes.html' },
    { label: 'Language reference — class definitions', url: 'https://docs.python.org/3/reference/compound_stmts.html#class-definitions' },
    { label: 'Data model — object.__init__', url: 'https://docs.python.org/3/reference/datamodel.html#object.__init__' },
    { label: 'PEP 8 — class names', url: 'https://peps.python.org/pep-0008/#class-names' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`So far your data and your functions have lived apart: a dict holds a shopping cart, and separate functions like \`add_item(cart, ...)\` and \`cart_total(cart)\` work on it. A **class** lets you put the two together.`,
    py`A class is a *blueprint for a new type of object*. It describes two things:`,
    py`- **attributes** — the data each object carries (a cart's \`owner\` and \`items\`);
- **methods** — functions that belong to the class and work on that data (\`add()\`, \`total()\`).`,
    py`Each object built from the class is called an **instance**. \`ShoppingCart("Ada")\` and \`ShoppingCart("Ben")\` are two instances of one class: same methods, separate data.`,
    py`You have been using classes all along. \`str\`, \`list\` and \`dict\` are classes, \`"hello"\` is an instance of \`str\`, and \`"hello".upper()\` calls a method. Now you'll write your own.`,
  ],
  why: [
    py`**Keep data and behaviour together.** With a dict and loose functions, nothing stops someone writing \`cart["itmes"]\` or passing a playlist dict into \`cart_total()\`. A class gives the data a home and puts the code that's allowed to touch it right next to it.`,
    py`**Many independent copies.** One class can produce as many instances as you need, and each keeps its own state. Ada's cart never sees Ben's headphones.`,
    py`**Readable code that matches the problem.** \`cart.add("pen", 1.20)\` reads like a sentence about the thing you're modelling. Large programs are built from such objects: users, orders, sensors, game characters.`,
    py`Classes are also the entry ticket to the rest of this level: [methods & attributes](lesson:methods-and-attributes), [properties](lesson:properties-and-encapsulation), [inheritance](lesson:inheritance) and [composition](lesson:composition).`,
  ],
  eli15: [
    py`Think about a video game. Every character has a name and health, and every character can take damage. The game designers don't write that separately for each of the 500 characters. They write one **character design sheet** — that's the class.`,
    py`When the game spawns a goblin, it builds a real character *from* the sheet — that's an **object** (an instance). Spawn another goblin and you get a second, separate object. Hit one goblin and only *its* health drops.`,
    py`In code, the sheet says "every character has \`self.health\`" and "here's how \`take_damage()\` works". \`self\` just means "this particular character" — the one you're talking to right now.`,
  ],
  analogy: {
    title: 'A blueprint and the houses built from it',
    body: [
      py`An architect draws one blueprint. It says every house has a front door, three windows and a paint colour, and it describes what you can do with a house: open the door, repaint the walls.`,
      py`Builders then put up many houses from that one blueprint. Each house is a real, separate building. Painting number 12 blue doesn't paint number 14. And the blueprint itself is a real sheet of paper too — you can photocopy it, hand it to someone, or file it in a drawer. In Python, the class is also a real object you can pass around.`,
    ],
    mapping: [
      ['the blueprint', 'the class (class House: ...)'],
      ['building a house from it', 'calling the class: House("blue")'],
      ['one particular house', 'an instance (an object)'],
      ['that house\'s paint colour and furniture', 'its instance attributes (self.colour)'],
      ['"how to open the door" written on the blueprint', 'a method, defined once on the class'],
      ['"this house" in the instructions', 'self'],
      ['the blueprint is itself a sheet of paper you can pass around', 'a class is an object too'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a class make two separate objects',
    props: {
      code: py`class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance


ada = BankAccount("Ada", 100)
ben = BankAccount("Ben")
ada.deposit(50)
print(ada.balance, ben.balance)
print(ada.__dict__)
`,
      notes: {
        1: 'The `class` statement runs once. Python builds a **class object** holding the functions `__init__` and `deposit`, then binds the name `BankAccount` to it. No account exists yet.',
        3: '`self` is the brand-new, empty instance. `self.owner = owner` stores a value **on that instance** — watch it appear inside the object.',
        11: 'Calling the class creates a new empty instance, then runs `__init__` with `self` pointing at it. The finished instance is bound to `ada`.',
        12: 'A second, completely separate instance. `balance` falls back to its default `0`.',
        13: '`ada.deposit(50)` is really `BankAccount.deposit(ada, 50)` — inside the method, `self` is `ada`.',
        14: 'Each instance kept its own `balance`: depositing into `ada` never touched `ben`.',
        15: '`__dict__` is the instance\'s own attribute dictionary. Methods are not in it — they live on the class.',
      },
    },
    alt: 'A step-by-step trace. The class BankAccount appears as an object listing the methods __init__ and deposit. Calling BankAccount("Ada", 100) creates an instance; inside __init__ the attributes owner and balance appear on it. A second instance for Ben gets owner Ben and balance 0. After ada.deposit(50), only Ada\'s balance changes to 150. The program prints 150 0 and then the dictionary of Ada\'s attributes.',
    caption: py`Step with ▶. The class box holds the **methods** (shared by every instance); each instance box holds only its **own data**. That split — behaviour on the class, state on the instance — is the core idea of this lesson.`,
  },
  syntax: [
    py`#### Defining a class`,
    { code: py`class BankAccount:                     # CapWords name, then a colon
    """A person's account with a balance."""   # optional docstring

    def __init__(self, owner, balance=0):     # runs on every new instance
        self.owner = owner                    # instance attribute
        self.balance = balance

    def deposit(self, amount):                # a method: first parameter is self
        self.balance += amount
        return self.balance`, lang: 'python', title: 'the shape of a class' },
    py`- \`class\` + a name in **CapWords** (PEP 8) + a colon. The indented block is the **class body**.
- Functions defined in the body are **methods**. Their first parameter receives the instance and is called \`self\` by universal convention.
- \`__init__\` (two underscores each side, "dunder init") is the **initialiser**. Python calls it automatically right after creating a new instance, so it's where you give every attribute its starting value.
- \`self.name = value\` creates or updates an **instance attribute** — a variable that belongs to that one object.`,
    py`#### Creating instances and using them`,
    { code: py`class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance


ada = BankAccount("Ada", 100)   # call the class like a function
print(ada.owner)                # read an attribute: Ada
ada.deposit(25)                 # call a method; don't pass self
print(ada.balance)              # 125
ada.balance = 0                 # attributes can be reassigned from outside
print(isinstance(ada, BankAccount), type(ada).__name__)   # True BankAccount`, lang: 'python', title: 'instances, attributes and methods' },
    py`Notice that you **never pass \`self\` yourself**. \`ada.deposit(25)\` is translated by Python into \`BankAccount.deposit(ada, 25)\`: the object before the dot becomes \`self\`. That's why a method is defined with one more parameter than you pass when calling it.`,
    py`#### Every instance has its own \`__dict__\``,
    py`An instance stores its attributes in a dictionary called \`__dict__\`. \`vars(obj)\` returns the same dictionary. Methods are *not* in there — they live once, on the class, and every instance shares them.`,
    { code: py`class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance


ada = BankAccount("Ada", 100)
ben = BankAccount("Ben")
print(vars(ada))   # {'owner': 'Ada', 'balance': 100}
print(vars(ben))   # {'owner': 'Ben', 'balance': 0}
ben.nickname = "Benji"          # you CAN add attributes later...
print(vars(ben))   # {'owner': 'Ben', 'balance': 0, 'nickname': 'Benji'}
print(hasattr(ada, "nickname")) # ...but only that one instance gets it: False`, lang: 'python', title: 'separate data per instance' },
    { callout: 'tip', title: 'Create every attribute in __init__', text: py`Python lets you bolt attributes on anywhere, but don't. If every attribute is set in \`__init__\` (even to \`None\` or \`[]\`), anyone reading the class sees the full shape of the object in one place, editors can autocomplete, and you never hit an \`AttributeError\` because a method ran "too early".` },
    py`#### A class is an object too`,
    py`The \`class\` statement creates a **class object** and binds a name to it, just like \`=\` binds a name to a list. So a class can be stored in a variable, put in a dict or passed to a function. Its own type is \`type\` — the class that makes classes.`,
    { code: py`class BankAccount:
    def __init__(self, owner):
        self.owner = owner


print(BankAccount)            # <class '__main__.BankAccount'>
print(type(BankAccount))      # <class 'type'>
print(BankAccount.__name__)   # BankAccount

Account = BankAccount         # a second name for the same class object
kinds = {"bank": BankAccount} # classes can live in data structures
acct = kinds["bank"]("Cy")    # ...and be called from there
print(acct.owner, type(acct) is Account)   # Cy True`, lang: 'python', title: 'classes are first-class objects' },
    py`#### A nicer printout: \`__repr__\` (teaser)`,
    py`Print an instance and you get something like \`<__main__.BankAccount object at 0x...>\` — not very helpful. Define a special method called \`__repr__\` that returns a string, and Python uses it whenever it needs to show your object (in \`print\`, the REPL, lists and error messages). The full story is in [special methods](lesson:special-methods).`,
    { code: py`class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def __repr__(self):
        return f"BankAccount(owner={self.owner!r}, balance={self.balance})"


print(BankAccount("Ada", 100))   # BankAccount(owner='Ada', balance=100)
print([BankAccount("Ben")])      # [BankAccount(owner='Ben', balance=0)]`, lang: 'python', title: '__repr__ makes objects readable' },
    py`#### An empty class`,
    py`A class body can't be empty, so use \`pass\` (or a docstring) as a placeholder: \`class Placeholder: pass\`. That's legal, and instances of it accept any attribute you set — handy for quick experiments, not for real code.`,
  ],
  walkthrough: {
    title: 'Reading the shopping cart class line by line',
    lang: 'python',
    code: CART,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 2], text: py`\`class ShoppingCart:\` starts the class body. When Python reaches this line it runs the body *once*, collecting the functions into a new class object, and binds the name \`ShoppingCart\` to it. The docstring describes what one instance represents.` },
      { lines: [4, 6], text: py`\`__init__\` runs automatically every time a cart is created. \`self\` is the new, empty cart; \`self.owner = owner\` and \`self.items = []\` store data on it. Because \`[]\` runs inside \`__init__\`, every cart gets its **own** new list.` },
      { lines: [8, 9], text: py`\`add\` is a method. It receives the cart as \`self\` and appends a tuple to *that* cart's \`items\`. The default \`quantity=1\` works exactly as in any function.` },
      { lines: [11, 15], text: py`Methods can use other methods through \`self\`: \`summary()\` calls \`self.total()\`. Nothing here is computed until someone calls the method.` },
      { lines: [18, 19], text: py`Calling the class builds instances. Two calls → two separate cart objects, each with its own \`owner\` and \`items\`.` },
      { lines: [21, 23], text: py`\`ada_cart.add("notebook", 3.50, 2)\` becomes \`ShoppingCart.add(ada_cart, "notebook", 3.50, 2)\`. Only Ada's list changes; Ben's cart is untouched by Ada's calls.` },
      { lines: [25, 29], text: py`The summaries prove each cart kept its own data. \`vars(ben_cart)\` shows Ben's \`__dict__\`. \`ada_cart.items is ben_cart.items\` is \`False\`: two different lists. Finally \`type()\` and \`isinstance()\` confirm what the object is.` },
    ],
  },
  playground: {
    title: 'Shopping carts',
    objective: 'Run it, then extend the class with new methods and watch every cart gain them at once.',
    files: { 'main.py': CART },
    expected: py`\`\`\`text
Ada: 2 line(s), total 8.20
Ben: 1 line(s), total 25.00
{'owner': 'Ben', 'items': [('headphones', 25.0, 1)]}
False
ShoppingCart True
\`\`\`

Open the **Variables** tab: \`ShoppingCart\` is a class, and \`ada_cart\` / \`ben_cart\` are two instances with their own attributes.`,
    experiments: [
      {
        id: 'third-cart',
        task: py`Create a third cart for yourself (any variable name, any owner), add **at least two** items to it, and print its \`summary()\`.`,
        hint: py`Copy the pattern of lines 18–23: \`my_cart = ShoppingCart("Cy")\`, then \`my_cart.add(...)\` twice, then \`print(my_cart.summary())\`.`,
        tests: [
          { name: 'there are at least three carts', code: py`carts = [v for v in ns.values() if isinstance(v, ShoppingCart)]
assert len(carts) >= 3, 'Create a third ShoppingCart instance'` },
          { name: 'the new cart has at least two items', code: py`carts = [v for v in ns.values() if isinstance(v, ShoppingCart) and v.owner not in ("Ada", "Ben")]
assert carts and len(carts[0].items) >= 2, 'Give your cart a new owner and add two items'` },
          { name: 'its summary was printed', code: py`assert output.count("line(s)") >= 3, 'Print the third summary'` },
        ],
        explain: py`One class, three instances. You didn't write any new methods — your cart got \`add\`, \`total\` and \`summary\` for free because methods live on the class and every instance shares them.`,
      },
      {
        id: 'item-count',
        task: py`Add a method \`item_count(self)\` that returns the total **quantity** of things in the cart (Ada's cart holds 2 notebooks + 1 pen = 3).`,
        hint: py`Sum the third element of each tuple: \`return sum(qty for name, price, qty in self.items)\`.`,
        tests: [
          { name: 'ada_cart.item_count() is 3', code: py`assert hasattr(ShoppingCart, "item_count"), 'Define item_count inside the class'
assert ada_cart.item_count() == 3` },
          { name: 'an empty cart counts 0', code: py`assert ShoppingCart("Zed").item_count() == 0` },
        ],
        explain: py`A new method defined once on the class is instantly available on every instance, including carts that already exist. \`self.items\` makes the same code count Ada's items or Ben's, depending on which cart you call it on.`,
      },
      {
        id: 'remove',
        task: py`Add a method \`remove(self, name)\` that removes **every** line whose item name equals \`name\`. Then call \`ada_cart.remove("pen")\` before the prints.`,
        hint: py`Rebuild the list without that name: \`self.items = [line for line in self.items if line[0] != name]\`.`,
        tests: [
          { name: 'remove() deletes matching lines', code: py`c = ShoppingCart("T")
c.add("pen", 1.0)
c.add("ink", 2.0)
c.add("pen", 1.0, 3)
c.remove("pen")
assert c.items == [("ink", 2.0, 1)]` },
          { name: 'Ada\'s pen is gone', code: py`assert all(line[0] != "pen" for line in ada_cart.items), 'Call ada_cart.remove("pen")'` },
        ],
        explain: py`\`self.items = [...]\` re-binds the attribute **on this instance only** to a new list. Ada's summary drops to \`total 7.00\` while Ben's cart is unaffected.`,
      },
      {
        id: 'repr',
        task: py`Add a \`__repr__(self)\` method returning exactly \`ShoppingCart('Ada')\` for Ada's cart (use \`!r\` on the owner), then add \`print(ada_cart)\` at the end.`,
        hint: py`\`return f"ShoppingCart({self.owner!r})"\` — \`!r\` puts quotes around the string.`,
        tests: [
          { name: 'repr shows the owner', code: py`assert repr(ShoppingCart("Zed")) == "ShoppingCart('Zed')"` },
          { name: 'printed the cart', code: py`assert "ShoppingCart('Ada')" in output` },
        ],
        explain: py`\`print()\` falls back to \`__repr__\` when there is no \`__str__\`. A good \`__repr__\` looks like the code that would rebuild the object, which makes debugging and logs far more readable. More in [special methods](lesson:special-methods).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What happens when you call ShoppingCart("Ada")',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'call', label: 'ShoppingCart("Ada")', note: 'calling the class', x: 120, y: 70, tone: 'yellow' },
        { id: 'cls', label: 'class ShoppingCart', note: 'methods live here', x: 390, y: 70, tone: 'blue' },
        { id: 'new', label: 'empty instance', note: 'made by __new__', x: 650, y: 70 },
        { id: 'init', label: '__init__(self, "Ada")', note: 'fills in attributes', x: 650, y: 240, tone: 'kraft' },
        { id: 'obj', label: "{'owner': 'Ada', 'items': []}", note: 'the instance __dict__', x: 390, y: 240 },
        { id: 'name', label: 'ada_cart', note: 'name bound to it', x: 120, y: 240, tone: 'yellow' },
      ],
      edges: [
        { from: 'call', to: 'cls', label: 'call' },
        { from: 'cls', to: 'new', label: '__new__' },
        { from: 'new', to: 'init', label: 'self = it' },
        { from: 'init', to: 'obj', label: 'self.x = …' },
        { from: 'name', to: 'obj', label: 'ada_cart = …', dashed: true },
      ],
      steps: [
        { focus: ['call', 'cls'], edges: ['call->cls'], text: py`A class is callable, like a function. Calling it is the only way you normally create an instance.` },
        { focus: ['cls', 'new'], edges: ['cls->new'], text: py`First Python creates a **new, empty instance** of the class (the special method \`__new__\` does this; you almost never write it yourself). The object knows its class, but has no attributes yet.` },
        { focus: ['new', 'init'], edges: ['new->init'], text: py`Then Python calls \`__init__\`, passing the new object as \`self\` and your arguments after it: \`__init__(new_object, "Ada")\`.` },
        { focus: ['init', 'obj'], edges: ['init->obj'], text: py`Each \`self.something = value\` line adds an entry to the instance's own \`__dict__\`. \`__init__\` must return \`None\` — it fills in an object, it doesn't produce one.` },
        { focus: ['name', 'obj'], edges: ['name->obj'], text: py`The call expression evaluates to the finished instance, and assignment binds \`ada_cart\` to it — exactly like any other assignment. Call the class again and the whole process repeats with a fresh object.` },
      ],
    },
    alt: 'Diagram of instance creation. Calling ShoppingCart("Ada") goes to the class object, which creates an empty instance with __new__. __init__ receives that instance as self and fills its dictionary with owner Ada and an empty items list. Finally the name ada_cart is bound to the finished instance.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Two kinds of namespace (name → object tables) are at work. The **class** has one holding its methods. Each **instance** has its own \`__dict__\` holding its data. When you write \`ada_cart.total\`, Python first looks in \`ada_cart.__dict__\`; if the name isn't there, it looks in the class. That's how every instance can use \`total\` while storing only its own data. The exact lookup rules are in [methods & attributes](lesson:methods-and-attributes).`,
      { code: py`class Cart:
    def __init__(self, owner):
        self.owner = owner

    def hello(self):
        return "hi " + self.owner


c = Cart("Ada")
print("owner" in vars(c))         # True  — data lives on the instance
print("hello" in vars(c))         # False — not on the instance...
print("hello" in vars(Cart))      # True  — ...but on the class
print(c.hello() == Cart.hello(c)) # True  — the same call, two spellings`, lang: 'python', title: 'instance data vs class methods' },
    ],
    technical: [
      py`**The class statement executes.** Python runs the class body top to bottom in a fresh namespace, like a tiny module. Every \`def\` there creates a plain function object. When the body finishes, Python calls the class's *metaclass* — normally \`type\` — as \`type("ShoppingCart", bases, namespace)\` to build the class object, then binds the name. You can watch it: a \`print()\` inside a class body runs at definition time, not when you create instances.`,
      py`**Calling a class** runs \`type.__call__\`, which does two things: \`cls.__new__(cls, ...)\` allocates and returns a new instance, then \`instance.__init__(...)\` initialises it. If \`__init__\` returns anything other than \`None\`, you get \`TypeError: __init__() should return None, not 'int'\`. So "constructor" is loose talk: \`__new__\` constructs, \`__init__\` initialises.`,
      py`**Methods are functions stored on the class.** \`ShoppingCart.add\` is an ordinary function. Looking it up through an instance (\`ada_cart.add\`) produces a **bound method** that remembers the instance and passes it as the first argument — that's why \`self\` appears. The machinery behind this (functions are *descriptors*) is explained in [descriptors](lesson:descriptors).`,
      { callout: 'version', title: 'Python 3.13+: __static_attributes__', text: py`Since 3.13 every class has a \`__static_attributes__\` tuple listing the names assigned as \`self.<name>\` anywhere in the class body's methods. It's a cheap way for tools to see an instance's intended attributes without creating one.` },
      { callout: 'note', title: 'CPython detail', text: py`CPython shares the *keys* of instance dictionaries between instances of the same class (PEP 412, "key-sharing dictionaries"), and since 3.11 it can store instance attributes without building a full \`__dict__\` until something asks for it. These are memory optimisations; to your code \`obj.__dict__\` always behaves like a normal dict. Other implementations (PyPy, GraalPy) use different layouts.` },
    ],
    production: [
      py`**Set every attribute in \`__init__\`** and keep \`__init__\` cheap and side-effect free: no network calls, file reads or long computations. Objects that are expensive or risky to create are hard to test. If construction needs I/O, write a separate factory function or a \`@classmethod\` like \`from_file()\` (see [methods & attributes](lesson:methods-and-attributes)).`,
      py`**Give classes a \`__repr__\`.** Log lines and test failures that say \`ShoppingCart(owner='Ada', items=3)\` instead of \`<object at 0x7f...>\` save real debugging time.`,
      py`**Don't write a class when a function will do.** A class with only \`__init__\` and one other method is usually a function wearing a costume. If a class only *holds* data, a [dataclass](lesson:dataclasses) writes \`__init__\`, \`__repr__\` and \`__eq__\` for you. Reach for a hand-written class when there is state *and* behaviour that must stay consistent.`,
      py`**Type hints document the shape.** Annotating \`def __init__(self, owner: str) -> None\` and attributes lets mypy/pyright catch typos like \`self.ownr\` before runtime — see [type hints](lesson:type-hints).`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting self in the method definition',
      wrong: { code: py`class Dog:
    def bark():                 # no self
        return "Woof"


rex = Dog()
rex.bark()   # TypeError: Dog.bark() takes 0 positional arguments but 1 was given`, lang: 'python', static: true },
      right: { code: py`class Dog:
    def bark(self):
        return "Woof"


rex = Dog()
print(rex.bark())`, lang: 'python' },
      explanation: py`\`rex.bark()\` silently passes \`rex\` as the first argument. A method with no parameter to receive it fails with the confusing "1 was given" error — the 1 is the instance.`,
    },
    {
      title: 'Assigning to a local variable instead of self.attribute',
      wrong: { code: py`class Player:
    def __init__(self, name):
        name = name             # just re-binds the local parameter
        self.score = 0


p = Player("Ada")
print(p.name)   # AttributeError: 'Player' object has no attribute 'name'`, lang: 'python', static: true },
      right: { code: py`class Player:
    def __init__(self, name):
        self.name = name
        self.score = 0


p = Player("Ada")
print(p.name)`, lang: 'python' },
      explanation: py`Inside a method, a bare name is a local variable that vanishes when the method returns. Only \`self.name = ...\` stores data on the object.`,
    },
    {
      title: 'Misspelling __init__',
      wrong: { code: py`class Cart:
    def __int__(self, owner):   # __int__, not __init__!
        self.owner = owner


Cart("Ada")   # TypeError: Cart() takes no arguments`, lang: 'python', static: true },
      right: { code: py`class Cart:
    def __init__(self, owner):
        self.owner = owner


Cart("Ada")`, lang: 'python' },
      explanation: py`Python only calls a method named exactly \`__init__\` (two underscores on each side). \`__int__\` is a different special method (used by \`int(obj)\`), so the class falls back to the default initialiser, which accepts no arguments. Single underscores (\`_init_\`) fail the same way.`,
    },
    {
      title: 'Forgetting the parentheses when creating an instance',
      wrong: { code: py`class Cart:
    def __init__(self):
        self.items = []

    def add(self, name):
        self.items.append(name)


cart = Cart           # the class itself, not an instance
cart.add("pen")       # TypeError: Cart.add() missing 1 required positional argument: 'name'`, lang: 'python', static: true },
      right: { code: py`class Cart:
    def __init__(self):
        self.items = []

    def add(self, name):
        self.items.append(name)


cart = Cart()         # call the class
cart.add("pen")`, lang: 'python' },
      explanation: py`Without \`()\`, \`cart\` is just another name for the class object. Calling \`add\` on the class doesn't supply \`self\`, so \`"pen"\` lands in \`self\` and \`name\` is missing.`,
    },
    {
      title: 'A mutable default argument in __init__',
      wrong: { code: py`class Cart:
    def __init__(self, owner, items=[]):   # one list, created once
        self.owner = owner
        self.items = items


a = Cart("Ada")
b = Cart("Ben")
a.items.append("pen")
print(b.items)   # ['pen'] — Ben got Ada's pen!`, lang: 'python' },
      right: { code: py`class Cart:
    def __init__(self, owner, items=None):
        self.owner = owner
        self.items = [] if items is None else list(items)


a = Cart("Ada")
b = Cart("Ben")
a.items.append("pen")
print(b.items)   # []`, lang: 'python' },
      explanation: py`Default values are evaluated **once**, when the \`def\` runs, so every cart created without \`items\` shares one list. Use \`None\` as the default and build a fresh list inside \`__init__\`. Copying with \`list(items)\` also stops the cart sharing a list the caller still holds. See [function arguments](lesson:function-arguments).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Dog.bark() takes 0 positional arguments but 1 was given`,
      cause: py`The method was defined without \`self\`, but calling it through an instance always passes the instance as the first argument.`,
      fix: py`Add \`self\` as the first parameter: \`def bark(self):\`.`,
    },
    {
      symptom: py`AttributeError: 'Player' object has no attribute 'name'`,
      cause: py`The attribute was never set on this instance: a typo (\`self.nmae\`), a plain local variable instead of \`self.name\`, or a method that sets it hasn't run yet.`,
      fix: py`Check \`__init__\` sets \`self.name\`. Print \`vars(p)\` to see exactly which attributes the instance has. Python's message often adds *Did you mean: …?* when it spots a near-miss.`,
    },
    {
      symptom: py`TypeError: Cart() takes no arguments`,
      cause: py`Python didn't find an \`__init__\` method, almost always because of a typo like \`__int__\` or \`_init_\`, or because \`__init__\` was indented outside the class.`,
      fix: py`Spell it \`__init__\` with two underscores on each side and indent it inside the class body.`,
    },
    {
      symptom: py`TypeError: Cart.__init__() missing 1 required positional argument: 'owner'`,
      cause: py`The class was called without an argument that \`__init__\` requires.`,
      fix: py`Pass it (\`Cart("Ada")\`), or give the parameter a sensible default in \`__init__\`.`,
    },
    {
      symptom: py`Printing an object shows <__main__.Cart object at 0x...>`,
      cause: py`That is the default representation inherited from \`object\`. It isn't an error.`,
      fix: py`Define \`__repr__\` (and optionally \`__str__\`) to return a readable string — see [special methods](lesson:special-methods).`,
    },
  ],
  bestPractices: [
    'Name classes in CapWords (ShoppingCart) and methods/attributes in snake_case (add_item, owner).',
    'Set every instance attribute in __init__, even if only to None or an empty list.',
    'Keep __init__ fast and free of I/O; put expensive or fallible setup in a factory.',
    'Never use a mutable value ([] or {}) as a default argument; default to None and create it inside.',
    'Give every class you write a __repr__ so it is readable in logs, tests and the REPL.',
    'Prefer a plain function or a dataclass when there is no behaviour that needs to protect the data.',
  ],
  useCases: [
    'Domain objects in an application: User, Order, Invoice, Product.',
    'Game entities with their own state and actions: Player, Enemy, Board.',
    'Wrapping a resource with behaviour: a Logger, a DatabaseConnection, a RateLimiter.',
    'Stateful helpers: a running statistics tracker, a shopping cart, a cache.',
  ],
  whenToUse: {
    use: [
      'Data and the functions that work on it belong together and you pass them around as a unit.',
      'You need many independent objects of the same kind, each with its own state.',
      'There are rules the data must always obey (a balance can\'t go negative) and you want one place to enforce them.',
    ],
    avoid: [
      'One function with no state does the job — write the function.',
      'You only need to hold a few fields with no behaviour — use a dataclass, NamedTuple or dict.',
      'You are grouping unrelated helper functions — that is what a module is for.',
    ],
  },
  comparison: {
    title: 'Same cart, two designs',
    headers: ['', 'dict + loose functions', 'class'],
    rows: [
      ['create one', 'cart = {"owner": "Ada", "items": []}', 'cart = ShoppingCart("Ada")'],
      ['add an item', 'add_item(cart, "pen", 1.2)', 'cart.add("pen", 1.2)'],
      ['where the rules live', 'scattered across functions anywhere', 'in the methods, next to the data'],
      ['typo in a field name', 'cart["itmes"] silently creates a new key or raises KeyError later', 'AttributeError at the typo, and linters/type checkers can flag it'],
      ['shape of the data', 'whatever keys someone happened to add', 'documented once in __init__'],
    ],
    note: py`Both are valid Python. Dicts are great for loose, JSON-like data; classes shine when behaviour and invariants matter. For "just data with names", see [dataclasses](lesson:dataclasses).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'classes-and-objects-q1',
      type: 'mcq',
      prompt: py`In \`ada_cart.add("pen", 1.20)\`, what is \`self\` inside \`add\`?`,
      options: [
        { text: 'The ShoppingCart class', why: 'The class is where add is defined, but self is the object before the dot.' },
        'The instance ada_cart',
        { text: 'The string "pen"', why: '"pen" is the first argument you passed, but Python inserts the instance before it, so "pen" goes to the next parameter.' },
        { text: 'A new copy of ada_cart', why: 'No copy is made — self is the very same object, so changes made through self are visible through ada_cart.' },
      ],
      answer: 1,
      explanation: py`Calling a method through an instance passes that instance as the first argument: \`ada_cart.add("pen", 1.20)\` runs \`ShoppingCart.add(ada_cart, "pen", 1.20)\`.`,
    },
    {
      id: 'classes-and-objects-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Counter:
    def __init__(self):
        self.count = 0

    def click(self):
        self.count += 1


a = Counter()
b = Counter()
a.click()
a.click()
b.click()
print(a.count, b.count)`,
      answer: '2 1',
      accept: ['2 1'],
      explanation: py`Each call to \`Counter()\` builds a separate instance whose \`count\` starts at 0. \`a\` was clicked twice and \`b\` once; neither affects the other.`,
    },
    {
      id: 'classes-and-objects-q3',
      type: 'bug',
      prompt: 'This crashes with `AttributeError: \'Player\' object has no attribute \'name\'`. Click the line that causes it.',
      code: py`class Player:
    def __init__(self, name):
        name = name
        self.score = 0


p = Player("Ada")
print(p.name, p.score)`,
      answerLine: 3,
      explanation: py`\`name = name\` re-binds the local parameter to itself and is forgotten when \`__init__\` returns. To store it on the object, write \`self.name = name\`. Line 8 is where the error *appears*, but line 3 is the cause.`,
    },
    {
      id: 'classes-and-objects-q4',
      type: 'fill',
      prompt: 'Complete the class so that `Song("Yellow").title` is `"Yellow"`.',
      code: py`class Song:
    def ___(self, title):
        ___.title = title`,
      answer: [['__init__'], ['self']],
      explanation: py`The initialiser must be named exactly \`__init__\`, and data is stored on the instance through \`self\`.`,
    },
    {
      id: 'classes-and-objects-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`class Dog:
    pass


print(type(Dog))`,
      options: [
        { text: "<class 'Dog'>", why: 'That would be type(Dog()) — the type of an instance — and it would show the module too: <class \'__main__.Dog\'>.' },
        { text: "<class '__main__.Dog'>", why: 'This is what you get for type(Dog()) or print(Dog). Here we ask for the type of the class itself.' },
        "<class 'type'>",
        { text: "<class 'object'>", why: 'Every class inherits from object, but its type (the class that made it) is type.' },
      ],
      answer: 2,
      explanation: py`A class is an object too, and the class that creates classes is \`type\`. So \`type(Dog)\` is \`type\`, while \`type(Dog())\` is \`Dog\`.`,
    },
    {
      id: 'classes-and-objects-q6',
      type: 'mcq',
      prompt: py`After \`cart = ShoppingCart\` (no parentheses), what is \`cart\`?`,
      options: [
        { text: 'A new, empty ShoppingCart instance', why: 'Only calling the class — ShoppingCart(...) — creates an instance.' },
        { text: 'None, because nothing was returned', why: 'Nothing was called, so nothing returned None. The right side is the class object itself.' },
        'A second name for the ShoppingCart class object',
        { text: 'A SyntaxError', why: 'Binding a name to a class is perfectly legal — classes are ordinary objects.' },
      ],
      answer: 2,
      explanation: py`A class is an object like any other, so plain assignment binds another name to it. \`cart.add(...)\` would then fail because no instance is supplied as \`self\`.`,
    },
    {
      id: 'classes-and-objects-q7',
      type: 'short',
      prompt: 'Why might you write a `ShoppingCart` class instead of using a dict plus separate functions like `add_item(cart, ...)`?',
      answer: py`A class keeps the cart's data and the code allowed to change it in one place. Every instance gets the same methods but its own data, the shape of the data is documented in __init__, rules (like "quantity must be positive") can be enforced in the methods, and call sites read naturally: cart.add("pen", 1.2). Typos in attribute names fail loudly, and tools can check them.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'book-progress',
      title: 'Reading tracker',
      difficulty: 'beginner',
      prompt: py`Finish the \`Book\` class:

- \`Book(title, pages)\` stores \`title\` and \`pages\` as attributes and sets \`current_page\` to \`0\`.
- \`read(n)\` moves \`current_page\` forward by \`n\` but **never past \`pages\`**, and returns the new \`current_page\`.
- \`progress()\` returns the percentage read as a whole number (\`int\`), rounded down: 100 of 300 pages → \`33\`.

The program at the bottom must print exactly \`The Hobbit 25\`. Each book must keep its own progress.`,
      files: {
        'main.py': py`class Book:
    def __init__(self, title, pages):
        self.title = title
        # TODO: store pages, and start current_page at 0

    def read(self, n):
        # TODO: move forward by n (never past the last page), return the new page
        return None

    def progress(self):
        # TODO: whole-number percentage of the book read
        return 0


novel = Book("The Hobbit", 300)
novel.read(75)
print(novel.title, novel.progress())
`,
      },
      hints: [
        'Every piece of data that must survive between method calls has to be stored on self: self.pages, self.current_page.',
        'For "never past the end", min() is handy: min(self.current_page + n, self.pages).',
        'progress() is self.current_page * 100 // self.pages — // divides and rounds down to an int.',
      ],
      solution: {
        explanation: py`\`__init__\` gives every new book three attributes, so each instance has its own \`current_page\`. \`read\` uses \`min()\` to clamp the page number at the end of the book and returns it. \`progress\` multiplies before dividing and uses floor division \`//\`, which keeps the result an \`int\` and rounds down (100 × 100 // 300 = 33). Because all state lives on \`self\`, two \`Book\` objects never interfere.`,
        files: {
          'main.py': py`class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages
        self.current_page = 0

    def read(self, n):
        self.current_page = min(self.current_page + n, self.pages)
        return self.current_page

    def progress(self):
        return self.current_page * 100 // self.pages


novel = Book("The Hobbit", 300)
novel.read(75)
print(novel.title, novel.progress())
`,
        },
      },
      tests: [
        { name: 'a new book starts on page 0', code: py`b = Book("Dune", 400)
assert (b.title, b.pages, b.current_page) == ("Dune", 400, 0)` },
        { name: 'read() moves forward and returns the new page', code: py`b = Book("Dune", 400)
assert b.read(30) == 30
assert b.read(20) == 50` },
        { name: 'read() never goes past the last page', code: py`b = Book("Dune", 100)
assert b.read(150) == 100
assert b.current_page == 100` },
        { name: 'progress() is a whole-number percentage, rounded down', code: py`b = Book("Dune", 300)
b.read(100)
assert b.progress() == 33
assert isinstance(b.progress(), int)` },
        { name: 'two books keep separate progress', code: py`a = Book("A", 100)
b = Book("B", 100)
a.read(10)
assert b.current_page == 0` },
        { name: 'prints "The Hobbit 25"', code: py`assert output.strip() == "The Hobbit 25"` },
      ],
    },
    {
      id: 'virtual-pet',
      title: 'Virtual pet',
      difficulty: 'intermediate',
      prompt: py`Build a \`Pet\` class:

- \`Pet(name, species)\` stores \`name\` and \`species\`; \`hunger\` starts at \`5\`.
- \`feed()\` lowers \`hunger\` by 3, but never below \`0\`.
- \`play()\` raises \`hunger\` by 2, but never above \`10\`.
- \`mood()\` returns \`"happy"\` when hunger is 3 or less, \`"peckish"\` when it is 4–7, otherwise \`"starving"\`.
- \`describe()\` returns e.g. \`"Biscuit the hamster is happy"\` (name, " the ", species, " is ", mood).

The program must print exactly:

\`\`\`text
Biscuit the hamster is happy
Rex the dog is starving
\`\`\``,
      files: {
        'main.py': py`class Pet:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        self.hunger = 5

    def feed(self):
        pass  # TODO

    def play(self):
        pass  # TODO

    def mood(self):
        return "happy"  # TODO: depends on self.hunger

    def describe(self):
        return ""  # TODO


biscuit = Pet("Biscuit", "hamster")
rex = Pet("Rex", "dog")
biscuit.feed()
rex.play()
rex.play()
print(biscuit.describe())
print(rex.describe())
`,
      },
      hints: [
        'feed() and play() change self.hunger; max() and min() keep it inside 0..10.',
        'mood() is an if / elif / else on self.hunger. describe() can call self.mood() — methods can call each other through self.',
        'self.hunger = max(self.hunger - 3, 0) · self.hunger = min(self.hunger + 2, 10) · return f"{self.name} the {self.species} is {self.mood()}"',
      ],
      solution: {
        explanation: py`All the pet's state lives in \`self.hunger\`, so \`feed\` and \`play\` just update that one attribute, clamped with \`max\`/\`min\`. \`mood\` *derives* a value from the state instead of storing it, so it can never go stale. \`describe\` reuses \`mood()\` through \`self\` rather than duplicating the thresholds. Biscuit: 5 − 3 = 2 → happy. Rex: 5 + 2 + 2 = 9 → starving.`,
        files: {
          'main.py': py`class Pet:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        self.hunger = 5

    def feed(self):
        self.hunger = max(self.hunger - 3, 0)

    def play(self):
        self.hunger = min(self.hunger + 2, 10)

    def mood(self):
        if self.hunger <= 3:
            return "happy"
        elif self.hunger <= 7:
            return "peckish"
        return "starving"

    def describe(self):
        return f"{self.name} the {self.species} is {self.mood()}"


biscuit = Pet("Biscuit", "hamster")
rex = Pet("Rex", "dog")
biscuit.feed()
rex.play()
rex.play()
print(biscuit.describe())
print(rex.describe())
`,
        },
      },
      tests: [
        { name: 'a new pet has hunger 5', code: py`assert Pet("A", "cat").hunger == 5` },
        { name: 'feed() lowers hunger by 3, never below 0', code: py`p = Pet("A", "cat")
p.feed()
assert p.hunger == 2
p.feed()
assert p.hunger == 0` },
        { name: 'play() raises hunger by 2, never above 10', code: py`p = Pet("A", "cat")
p.play()
assert p.hunger == 7
for _ in range(5):
    p.play()
assert p.hunger == 10` },
        { name: 'mood() follows the thresholds', code: py`p = Pet("A", "cat")
moods = []
for h in (0, 3, 4, 7, 8, 10):
    p.hunger = h
    moods.append(p.mood())
assert moods == ["happy", "happy", "peckish", "peckish", "starving", "starving"]` },
        { name: 'describe() builds the sentence', code: py`assert Pet("Mochi", "cat").describe() == "Mochi the cat is peckish"` },
        { name: 'pets are independent', code: py`a = Pet("A", "cat")
b = Pet("B", "dog")
a.play()
assert b.hunger == 5` },
        { name: 'prints the two descriptions', code: py`assert output.strip() == "Biscuit the hamster is happy\nRex the dog is starving"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'classes-and-objects-class-vs-instance',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between a class and an instance (object)?',
      answer: 'A class is a blueprint that defines a new type: its methods and how instances are initialised. An instance is one concrete object made by calling the class; it has its own attribute values but shares the class\'s methods.',
      explanation: py`\`class Car:\` creates one class object. \`Car("red")\` and \`Car("blue")\` create two instances. Each instance stores its own data in its \`__dict__\`; the methods are stored once on the class and looked up from there. In Python the class is itself an object (an instance of \`type\`), so you can pass it around like any value.`,
      code: { lang: 'python', code: py`class Car:
    def __init__(self, colour):
        self.colour = colour

    def describe(self):
        return f"a {self.colour} car"


red, blue = Car("red"), Car("blue")
print(red.describe(), "|", blue.describe())
print(type(red) is Car, type(Car) is type)   # True True` },
      whyAsked: 'It is the foundation of every OOP discussion; vague answers here predict confusion about state and sharing later.',
      mistakes: ['Saying instances get their own copy of every method', 'Treating "class" and "object" as synonyms', 'Not mentioning that each instance has separate state'],
      followUps: ['Where are methods stored?', 'Is a class an object in Python? What is its type?', 'What is __dict__?'],
      modelAnswer: 'A class is the blueprint: it defines a new type, the methods that type has, and how a new object gets initialised in __init__. An instance is one concrete object created by calling the class, like Car("red"). Each instance has its own data — stored in its own __dict__ — but the methods live once on the class and are shared. So two cars can have different colours while using the same describe method. In Python the class is itself an object too, an instance of type, which is why you can store classes in variables or pass them to functions.',
    },
    {
      id: 'classes-and-objects-what-is-self',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is `self`, and why does Python make you write it explicitly?',
      answer: 'self is the instance a method was called on. obj.method(x) is turned into Class.method(obj, x), so the method needs a first parameter to receive obj. It is explicit because methods are ordinary functions stored on the class; "self" is only a naming convention.',
      explanation: py`Python doesn't have a hidden \`this\`. A method is a plain function; when you look it up through an instance, Python creates a *bound method* that inserts the instance as the first argument. Writing \`self.x\` makes it obvious which names are attributes and which are locals ("explicit is better than implicit"). The name \`self\` isn't a keyword — any name works — but every Python programmer and tool expects \`self\`.`,
      code: { lang: 'python', code: py`class Greeter:
    def __init__(self, name):
        self.name = name

    def hello(self, other):
        return f"{self.name} says hi to {other}"


g = Greeter("Ada")
print(g.hello("Ben"))
print(Greeter.hello(g, "Ben"))   # identical call, spelled out` },
      whyAsked: 'Shows whether you understand how method calls actually work instead of treating self as magic syntax.',
      mistakes: ['Calling self a keyword', 'Saying self is "the class"', 'Not knowing obj.m() and Class.m(obj) are equivalent'],
      followUps: ['What is a bound method?', 'What happens if you forget self in a method definition?', 'How do classmethods differ?'],
      modelAnswer: 'self is simply the instance the method is being called on. When I write cart.add("pen"), Python looks up add on the class and calls it as ShoppingCart.add(cart, "pen") — the object before the dot is passed in as the first argument, and by convention we name that parameter self. Python makes it explicit because methods are just ordinary functions stored on the class; there is no hidden this variable. The benefit is clarity: self.total is obviously an attribute, total is obviously a local. And self is only a convention, not a keyword, though everyone follows it.',
    },
    {
      id: 'classes-and-objects-alias-instance',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`class Robot:
    def __init__(self, name):
        self.name = name
        self.log = []

    def say(self, msg):
        self.log.append(msg)
        return f"{self.name}: {msg}"


r1 = Robot("R1")
r2 = r1
r2.name = "R2"
r2.say("hi")
print(r1.name, len(r1.log))` },
      options: ['R1 0', 'R1 1', 'R2 0', 'R2 1'],
      correctOption: 3,
      answer: '`R2 1` — r2 = r1 does not copy the robot; both names refer to one instance, so the rename and the log entry are visible through r1.',
      explanation: py`Instances follow the same rules as every other object: assignment binds another name to the same object. There is still only one \`Robot\`, so changing an attribute or mutating its list through \`r2\` is visible through \`r1\`. To get an independent robot, create one (\`Robot("R2")\`) or copy it with \`copy.copy\` / \`copy.deepcopy\`.`,
      whyAsked: 'Aliasing bugs with objects passed between functions or stored in several places are common in real code.',
      mistakes: ['Assuming assignment clones an object', 'Thinking a copy.copy() would also copy the log list (it shares it)'],
      followUps: ['How would you make an independent copy?', 'What is the difference between copy.copy and copy.deepcopy for this class?'],
      modelAnswer: 'It prints R2 1. r2 = r1 does not create a second robot — it just binds another name to the same instance, exactly like with lists. So setting r2.name changes the one robot, and say appends to that robot\'s single log list. If I wanted an independent robot I would construct a new one, or use copy.deepcopy; a shallow copy.copy would get its own name attribute but still share the same log list.',
    },
    {
      id: 'classes-and-objects-missing-self',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A junior gets `TypeError: Timer.start() takes 0 positional arguments but 1 was given` from `t.start()`. They passed no arguments. Explain.',
      answer: 'start was defined without a self parameter. Calling it through the instance t passes t automatically as the first argument, so "1 was given" refers to the instance. Add self: def start(self):.',
      explanation: py`\`t.start()\` is \`Timer.start(t)\`. A method that should work on instances needs a parameter to receive \`t\`. If the method genuinely doesn't need the instance, it may belong outside the class or be a \`@staticmethod\` (see [methods & attributes](lesson:methods-and-attributes)).`,
      code: { lang: 'python', code: py`class Timer:
    def start(self):          # self receives t
        self.running = True


t = Timer()
t.start()
print(t.running)` },
      whyAsked: 'Reading error messages precisely and knowing how method calls pass the instance is basic OOP fluency.',
      mistakes: ['Suggesting calling Timer.start() instead', 'Not explaining where the "1" comes from'],
      followUps: ['When would a @staticmethod be appropriate?', 'What error would you get calling Timer.start() on the class with self defined?'],
      modelAnswer: 'The "1 was given" is the instance itself. When you call t.start(), Python calls Timer.start(t), passing the object before the dot as the first argument. The method was written as def start(): with no parameter to receive it, so Python complains. The fix is def start(self):. If the function really never needs the instance, that is a hint it should be a module-level function or a staticmethod instead.',
    },
    {
      id: 'classes-and-objects-sensor-log',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write a `SensorLog` class: `SensorLog(sensor_id)` stores the id and an empty `readings` list; `record(value)` appends a reading; `average()` returns the mean (or `None` if there are no readings); `peak()` returns the largest reading (or `None`). Each log must keep its own readings.',
      answer: 'Store sensor_id and a fresh list in __init__; record appends; average returns sum/len guarded for empty; peak returns max guarded for empty.',
      explanation: py`Creating \`self.readings = []\` *inside* \`__init__\` gives every instance its own list. Returning \`None\` for an empty log avoids \`ZeroDivisionError\` and \`ValueError: max() iterable argument is empty\` — and makes "no data" explicit for the caller.`,
      starter: { files: { 'main.py': py`class SensorLog:
    def __init__(self, sensor_id):
        self.sensor_id = sensor_id
        # TODO: an empty list of readings

    def record(self, value):
        pass  # TODO

    def average(self):
        return None  # TODO

    def peak(self):
        return None  # TODO


log = SensorLog("greenhouse-1")
for value in [21.0, 22.5, 24.0]:
    log.record(value)
print(log.sensor_id, log.average(), log.peak())
` } },
      tests: [
        { name: 'stores the id and an empty readings list', code: py`s = SensorLog("x")
assert s.sensor_id == "x" and s.readings == []` },
        { name: 'record() appends', code: py`s = SensorLog("x")
s.record(1.5)
s.record(2.5)
assert s.readings == [1.5, 2.5]` },
        { name: 'average() and peak()', code: py`s = SensorLog("x")
for v in (10, 20, 60):
    s.record(v)
assert s.average() == 30 and s.peak() == 60` },
        { name: 'an empty log returns None', code: py`s = SensorLog("x")
assert s.average() is None and s.peak() is None` },
        { name: 'logs do not share readings', code: py`a, b = SensorLog("a"), SensorLog("b")
a.record(5)
assert b.readings == []` },
      ],
      solution: { files: { 'main.py': py`class SensorLog:
    def __init__(self, sensor_id):
        self.sensor_id = sensor_id
        self.readings = []

    def record(self, value):
        self.readings.append(value)

    def average(self):
        if not self.readings:
            return None
        return sum(self.readings) / len(self.readings)

    def peak(self):
        return max(self.readings, default=None)


log = SensorLog("greenhouse-1")
for value in [21.0, 22.5, 24.0]:
    log.record(value)
print(log.sensor_id, log.average(), log.peak())
` } },
      hints: ['Create the list inside __init__ so each instance gets a new one.', 'Guard the empty case before dividing; max() accepts default=None.'],
      whyAsked: 'A quick check that you can design a small stateful class, keep state per instance and handle empty edge cases.',
      mistakes: ['Putting readings = [] at class level, so every log shares one list', 'Dividing by len() without checking for an empty list', 'Printing results instead of returning them'],
      followUps: ['How would you cap the log at the last 100 readings? (collections.deque(maxlen=100))', 'How would you make readings read-only from outside?'],
      modelAnswer: 'In __init__ I store the sensor id and create a fresh empty list, self.readings = [], so each log has its own list. record just appends. average checks for an empty list first and returns None, otherwise sum divided by len. peak uses max with default=None so it also handles the empty case. I return values rather than printing them so callers and tests can use them. If memory mattered I would switch the list to a deque with a maxlen.',
    },
    {
      id: 'classes-and-objects-call-a-class',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Walk through what happens when Python executes `cart = ShoppingCart("Ada")`. Is `__init__` a constructor?',
      answer: 'The class is callable (it is an instance of type). type.__call__ runs ShoppingCart.__new__(ShoppingCart, "Ada") to create an empty instance, then calls instance.__init__("Ada") to initialise it, and returns the instance, which is bound to cart. __init__ is an initialiser, not a constructor: the object already exists, and __init__ must return None.',
      explanation: py`The \`class\` statement built a class object by running the body and calling the metaclass \`type(name, bases, namespace)\`. Calling that object goes through \`type.__call__\`: \`__new__\` allocates (inherited from \`object\` unless overridden — you override it mainly for immutable types or caching), then \`__init__\` sets attributes. Returning a value from \`__init__\` raises \`TypeError: __init__() should return None, not 'int'\`. If \`__new__\` returns an object that isn't an instance of the class, \`__init__\` is skipped.`,
      code: { lang: 'python', code: py`class Dog:
    def __init__(self, name):
        self.name = name


obj = object.__new__(Dog)     # step 1: an empty Dog
print(vars(obj))              # {}
Dog.__init__(obj, "Rex")      # step 2: initialise it
print(vars(obj))              # {'name': 'Rex'}
print(type(Dog))              # <class 'type'>` },
      whyAsked: 'Separates people who use classes from people who understand the object model — useful before metaclasses, singletons or immutable subclasses.',
      mistakes: ['Calling __init__ the constructor without qualification', 'Not knowing __new__ exists', 'Thinking __init__ can return a different object'],
      followUps: ['When would you override __new__?', 'What is a metaclass?', 'Why must subclasses of tuple use __new__ rather than __init__?'],
      modelAnswer: 'A class in Python is itself an object, an instance of type, and calling it goes through type.__call__. That first calls __new__, which allocates a new, empty instance — normally the one inherited from object. Then it calls __init__ on that instance with my arguments, and __init__ fills in the attributes. Finally the call returns the instance and it gets bound to cart. So strictly __init__ is an initialiser, not a constructor: the object exists before it runs, and it must return None. I would only override __new__ for things like subclassing immutable types or controlling instance creation.',
    },
    {
      id: 'classes-and-objects-class-or-not',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate turns every helper into a class: `class PriceFormatter` with `__init__(self, price)` and a single `format()` method, used as `PriceFormatter(p).format()`. Is that good design? When is a class justified?',
      answer: 'Probably not: a class with __init__ and one method and no lasting state is a function in disguise — format_price(p) is simpler. Write a class when there is state that persists across several operations, behaviour that must keep that state consistent, or many instances of a concept.',
      explanation: py`Each class adds a concept readers must learn and an object they must create. Python modules already group functions, and closures or \`functools.partial\` cover "pre-configured function" cases. Classes earn their place when objects live for a while and have several operations on shared state (a cart, a connection pool, a game board), or when you need polymorphism. Pure data → [dataclass](lesson:dataclasses).`,
      code: { lang: 'python', code: py`# a class that is really a function
class PriceFormatter:
    def __init__(self, price):
        self.price = price

    def format(self):
        return f"{self.price:,.2f}"


# simpler and just as testable
def format_price(price):
    return f"{price:,.2f}"


print(PriceFormatter(1234.5).format(), format_price(1234.5))` },
      whyAsked: 'Interviewers want to see design judgement, not just syntax — over-engineering is as costly as under-engineering.',
      mistakes: ['Saying "classes are always more professional"', 'Saying "never use classes" — both are dogma', 'Ignoring dataclasses for data-only types'],
      followUps: ['When would you choose a dataclass instead?', 'How do modules act as namespaces?', 'What about a class holding configuration for several methods?'],
      modelAnswer: 'In that case I would just write a function, format_price(price). A class whose instances are created, used once and thrown away, with a single method and no state that persists, adds ceremony without benefit. I reach for a class when there is state that lives across several operations and behaviour that has to keep that state valid — a shopping cart, a connection, a game board — or when I need many instances of the same concept or polymorphism. If it is purely data, a dataclass gives me __init__ and __repr__ for free. And for grouping related helpers, a module is already the right tool.',
    },
  ],

  takeaways: [
    'A class bundles data (attributes) and behaviour (methods) into a new type; calling the class creates an instance.',
    '__init__ runs automatically on each new instance to set its starting attributes; it must return None.',
    'self is the instance a method was called on: obj.method(x) runs Class.method(obj, x). It is a convention, not a keyword.',
    'Store data with self.name = value; a bare name inside a method is just a local variable.',
    'Each instance has its own __dict__ of attributes; methods live once on the class and are shared.',
    'A class is an object too (an instance of type): you can bind it to names, store it and pass it around.',
    'Add a __repr__ so your objects print helpfully — more in the special methods lesson.',
  ],
}
