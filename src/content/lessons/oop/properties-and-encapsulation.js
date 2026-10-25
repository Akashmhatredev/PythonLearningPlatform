// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PLAYER = py`class Player:
    MAX_HEALTH = 100

    def __init__(self, name, health=100):
        self.name = name          # goes through the name setter
        self.health = health      # goes through the health setter
        self._xp = 0              # internal: "please don't touch"

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        value = value.strip()
        if not value:
            raise ValueError("name cannot be empty")
        self._name = value

    @property
    def health(self):
        return self._health

    @health.setter
    def health(self, value):
        self._health = max(0, min(value, self.MAX_HEALTH))   # clamp to 0..100

    @property
    def is_alive(self):           # computed and read-only
        return self._health > 0

    @property
    def level(self):              # computed from internal state
        return 1 + self._xp // 100

    def gain_xp(self, amount):
        self._xp += amount


hero = Player("  Ada ")
hero.health -= 30                 # read, subtract, write: both go through the property
print(hero.name, hero.health, hero.is_alive)
hero.health = 500                 # the setter clamps it
print(hero.health)
hero.gain_xp(250)
print("level", hero.level)
try:
    hero.level = 99
except AttributeError as err:
    print("AttributeError:", err)
print(vars(hero))
`

export default {
  id: 'properties-and-encapsulation',
  title: 'Properties & encapsulation',
  summary: 'Python has no private keyword: it relies on naming conventions, name mangling and @property to protect an object\'s data while keeping plain attribute syntax.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['methods-and-attributes'],
  related: ['classes-and-objects', 'descriptors', 'attribute-access', 'inheritance', 'decorators', 'dataclasses', 'input-validation'],
  tags: ['property', '@property', 'getter', 'setter', 'deleter', 'encapsulation', 'private', 'underscore', 'name mangling', 'read-only', 'computed attribute', 'validation', 'consenting adults', 'cached_property'],
  apis: [
    { name: '@property', summary: 'Turns a method into a managed attribute: reading obj.x calls the getter.' },
    { name: '@x.setter', summary: 'Adds a setter to property x: obj.x = value calls it (validate, convert, store).' },
    { name: '@x.deleter', summary: 'Adds a deleter to property x: del obj.x calls it.' },
    { name: 'property(fget, fset, fdel, doc)', summary: 'The built-in class behind the decorator syntax.' },
    { name: '_name / __name', summary: 'Single underscore: internal by convention. Double underscore: name-mangled to _ClassName__name.' },
    { name: 'functools.cached_property', summary: 'A computed attribute calculated once per instance, then stored (3.8+).' },
  ],
  docs: [
    { label: 'Built-in functions — property', url: 'https://docs.python.org/3/library/functions.html#property' },
    { label: 'Python tutorial — private variables and name mangling', url: 'https://docs.python.org/3/tutorial/classes.html#private-variables' },
    { label: 'PEP 8 — designing for inheritance (public vs non-public)', url: 'https://peps.python.org/pep-0008/#designing-for-inheritance' },
    { label: 'Descriptor HowTo Guide — properties', url: 'https://docs.python.org/3/howto/descriptor.html#properties' },
    { label: 'functools.cached_property', url: 'https://docs.python.org/3/library/functools.html#functools.cached_property' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Encapsulation** means an object looks after its own data: outsiders use a small, stable *interface* (its public methods and attributes) and don't depend on the *implementation* behind it. That lets the object protect its rules — health never goes below zero, a price is never negative — and lets you change the inside later without breaking callers.`,
    py`Many languages enforce this with \`private\` and \`public\` keywords. Python doesn't. Instead it gives you three tools:`,
    py`1. **Naming conventions** — a leading underscore (\`_xp\`) means "internal, don't rely on this".
2. **Name mangling** — two leading underscores (\`__token\`) make Python rename the attribute to avoid clashes with subclasses.
3. **Properties** — \`@property\` lets an attribute *look* like plain data (\`hero.health\`) while running your code on every read and write.`,
    py`Properties are the star: they're how Python code validates data, computes values on demand and evolves a class without ever writing Java-style \`get_health()\` / \`set_health()\` methods.`,
  ],
  why: [
    py`**Objects need rules.** If anyone can write \`hero.health = -50\` or \`product.price = "free"\`, every part of the program has to double-check the data. A setter that validates or clamps once, in one place, means the object is *always* valid.`,
    py`**Interfaces need to stay stable.** You start with a plain attribute because it's simplest. Months later you need validation. With a property, the change is invisible: \`item.price = 10\` keeps working in all 40 places that use it. That's why Python programmers don't write getters and setters "just in case".`,
    py`**Some values should be calculated, not stored.** A rectangle's area or a player's level depends on other data. A computed property can never go stale, and callers don't need to know it isn't stored.`,
  ],
  eli15: [
    py`Imagine your phone's volume. You press "+" and "-", and the phone shows a number from 0 to 100. You can't make it 250, because the phone checks every change. You don't see *how* it stores the volume inside — you just use the buttons.`,
    py`A **property** is that volume control for an object. From the outside, \`phone.volume = 250\` looks like plain assignment, but secretly a little function runs, says "too loud — I'll make that 100", and stores the real value somewhere internal.`,
    py`And the underscore? Writing \`_volume\` is like a sticker on a panel saying "staff only". Nothing physically stops you opening it, but if you do and break something, that's on you. Python trusts you — "we're all consenting adults here", as Python programmers like to say.`,
  ],
  analogy: {
    title: 'A shop counter',
    body: [
      py`In a shop you ask at the counter and the shopkeeper fetches things from the stockroom. The counter is the *public interface*. The stockroom is the *implementation*: the shop can reorganise its shelves any time, and you never notice.`,
      py`The shopkeeper also enforces rules: "only two per customer", "you must be 18". In a Python shop, the stockroom door has a "staff only" sign but no lock — you *could* walk in. Polite customers don't, because the shop promises nothing about what's behind it.`,
    ],
    mapping: [
      ['the counter', 'the public interface: properties and methods'],
      ['asking for something at the counter', 'reading a property (getter runs)'],
      ['handing something over the counter', 'assigning a property (setter runs, can refuse)'],
      ['the stockroom', 'internal attributes such as _health'],
      ['the "staff only" sign without a lock', 'the _underscore convention'],
      ['reorganising the stockroom', 'changing internals without breaking callers'],
      ['"two per customer" rule', 'validation in a setter'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'An assignment that runs code',
    props: {
      code: py`class Thermostat:
    def __init__(self, celsius):
        self.celsius = celsius        # runs the setter below

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < 5 or value > 30:
            raise ValueError("keep it between 5 and 30")
        self._celsius = value

    @property
    def fahrenheit(self):             # computed on demand
        return self._celsius * 9 / 5 + 32


home = Thermostat(20)
home.celsius = 22
print(home.celsius, home.fahrenheit)
try:
    home.celsius = 99
except ValueError as err:
    print("rejected:", err)
`,
      notes: {
        3: 'This looks like a plain assignment, but `celsius` is a **property** on the class, so Python calls the setter function instead. Watch a new frame appear.',
        11: 'The setter checks the value before anything is stored.',
        13: 'The real data is stored under a different name, `_celsius`. That is what appears inside the instance.',
        20: 'Assignment from outside goes through the very same setter — callers cannot skip the check.',
        21: 'Reading `home.celsius` calls the getter; `home.fahrenheit` computes a value. No parentheses, yet code runs.',
        23: '99 is out of range: the setter raises `ValueError` and `_celsius` keeps its old value, 22.',
      },
    },
    alt: 'A step-by-step trace. The Thermostat class lists celsius and fahrenheit as properties. Creating Thermostat(20) runs __init__, whose line self.celsius = celsius calls the setter function, which validates and stores _celsius = 20 on the instance. home.celsius = 22 calls the setter again. Printing calls the getter and the fahrenheit property, printing 22 71.6. Assigning 99 raises ValueError inside the setter, which is caught and printed, and _celsius stays 22.',
    caption: py`The instance only ever holds \`_celsius\`. \`celsius\` and \`fahrenheit\` live on the class as **properties** — every read and write of them is really a method call.`,
  },
  syntax: [
    py`#### Naming conventions: public, _internal, __mangled`,
    py`| name | meaning | enforced? |
|---|---|---|
| \`balance\` | public — part of the interface | — |
| \`_balance\` | internal: "implementation detail, may change without notice" | no; a convention (PEP 8). Linters warn when you touch someone else's \`_name\` |
| \`__balance\` | name-mangled: Python renames it to \`_Account__balance\` | the renaming is real; the privacy isn't |
| \`__init__\` | special ("dunder") name reserved for Python | names with two trailing underscores are **not** mangled |
| \`class_\` | trailing underscore: avoids clashing with a keyword | — |`,
    { callout: 'note', title: 'Convention, not enforcement', text: py`A single underscore is a **convention**: Python itself doesn't stop anyone reading \`hero._xp\`. It's a contract with other programmers: public names are promised to stay stable, underscore names aren't. At module level, \`from module import *\` skips underscore names, which is the only place the language itself treats them specially.` },
    py`#### @property: a getter`,
    { code: py`class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def diameter(self):          # read like an attribute, computed like a method
        return self.radius * 2


c = Circle(3)
print(c.diameter)    # 6 — no parentheses
c.radius = 10
print(c.diameter)    # 20 — always up to date`, lang: 'python', title: 'a computed, read-only property' },
    py`\`@property\` replaces the method with a **property object** of the same name. Reading \`c.diameter\` calls the function; you never write \`c.diameter()\`. With only a getter, the property is **read-only**: \`c.diameter = 5\` raises \`AttributeError: property 'diameter' of 'Circle' object has no setter\` (older Pythons say \`can't set attribute\`).`,
    py`#### @name.setter: validate on every write`,
    { code: py`class Thermostat:
    def __init__(self, celsius):
        self.celsius = celsius               # uses the setter: validated from day one

    @property
    def celsius(self):
        return self._celsius                 # the real data lives in _celsius

    @celsius.setter                          # same name as the property!
    def celsius(self, value):
        if not 5 <= value <= 30:
            raise ValueError(f"{value} is outside 5..30")
        self._celsius = value


t = Thermostat(20)
t.celsius = 25        # setter runs, value accepted
print(t.celsius)      # 25
try:
    Thermostat(40)    # rejected in __init__ too
except ValueError as err:
    print(err)        # 40 is outside 5..30`, lang: 'python', title: 'getter + setter' },
    py`Three rules make this work:`,
    py`1. The setter function **must have the same name** as the property (\`celsius\`), decorated with \`@celsius.setter\`.
2. Store the value under a **different** name (\`self._celsius\`). Writing \`self.celsius = value\` inside the setter would call the setter again, forever (\`RecursionError\`).
3. In \`__init__\`, assign through the property (\`self.celsius = celsius\`) so new objects are validated too.`,
    py`#### Refactoring a public attribute into a property`,
    py`This is the move that makes properties special. Start simple:`,
    { code: py`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price          # plain public attribute — perfectly fine`, lang: 'python', title: 'version 1: plain attribute' },
    py`Later, negative prices start appearing. Turn \`price\` into a property — **callers don't change at all**:`,
    { code: py`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price          # now goes through the setter

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError("price cannot be negative")
        self._price = round(value, 2)


item = Product("mug", 8)
item.price = item.price * 0.9      # exactly the same caller code as before
print(item.price)                  # 7.2`, lang: 'python', title: 'version 2: same interface, now validated' },
    { callout: 'tip', title: 'Don\'t write getters and setters "just in case"', text: py`In Java, fields are wrapped in \`getPrice()\`/\`setPrice()\` from day one, because changing a field to a method later breaks every caller. In Python that problem doesn't exist: start with a plain attribute and promote it to a property only when you need logic.` },
    py`#### Name mangling with __double_underscore`,
    { code: py`class Account:
    def __init__(self, token):
        self.__token = token        # stored as _Account__token


acct = Account("s3cr3t")
print(vars(acct))                   # {'_Account__token': 's3cr3t'}
print(hasattr(acct, "__token"))     # False
print(acct._Account__token)         # s3cr3t — still reachable`, lang: 'python', title: 'renamed, not hidden' },
    py`Inside a class body, any name written \`__something\` (at least two leading underscores, at most one trailing) is rewritten by the compiler to \`_ClassName__something\`. Its real purpose is to stop **subclasses accidentally overwriting** a parent's internal attribute — a \`Child\` class's \`self.__token\` becomes \`_Child__token\`, a different name. It is *not* a security feature: the value is one \`vars()\` away.`,
    py`#### Deleters (rare)`,
    { code: py`class Profile:
    def __init__(self):
        self._avatar = "cat.png"

    @property
    def avatar(self):
        return self._avatar

    @avatar.deleter
    def avatar(self):                 # runs on: del profile.avatar
        self._avatar = "default.png"


p = Profile()
del p.avatar
print(p.avatar)   # default.png`, lang: 'python', title: '@x.deleter' },
  ],
  walkthrough: {
    title: 'Reading the Player class line by line',
    lang: 'python',
    code: PLAYER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 7], text: py`\`__init__\` assigns \`self.name\` and \`self.health\` — but both are properties, so their setters run and the values are cleaned and checked from the start. \`_xp\` is a plain internal attribute.` },
      { lines: [9, 11], text: py`\`@property\` makes \`name\` a managed attribute. Reading \`hero.name\` returns the internal \`_name\`.` },
      { lines: [13, 18], text: py`The setter strips spaces and refuses empty names. Only valid data ever reaches \`self._name\`.` },
      { lines: [24, 26], text: py`The health setter **clamps** instead of rejecting: anything below 0 becomes 0, anything above \`MAX_HEALTH\` becomes 100.` },
      { lines: [28, 34], text: py`Two **computed, read-only** properties: \`is_alive\` and \`level\` are derived from other data every time they're read, so they can never disagree with it.` },
      { lines: [40, 42], text: py`\`"  Ada "\` is stripped to \`"Ada"\`. \`hero.health -= 30\` reads through the getter (100), subtracts, then writes 70 through the setter.` },
      { lines: [43, 44], text: py`500 is clamped to 100 by the setter. The caller wrote plain assignment and never needed to know a rule exists.` },
      { lines: [45, 50], text: py`250 XP → level 3. \`level\` has no setter, so assigning it raises \`AttributeError: property 'level' of 'Player' object has no setter\`.` },
      { lines: [51], text: py`\`vars(hero)\` reveals the implementation: only \`_name\`, \`_health\` and \`_xp\` are stored. Everything else is computed or managed by properties on the class.` },
    ],
  },
  playground: {
    title: 'A game character with rules',
    objective: 'See setters validate and clamp, then add your own validated and read-only properties.',
    files: { 'main.py': PLAYER },
    expected: py`\`\`\`text
Ada 70 True
100
level 3
AttributeError: property 'level' of 'Player' object has no setter
{'_name': 'Ada', '_health': 100, '_xp': 250}
\`\`\``,
    experiments: [
      {
        id: 'knockout',
        task: py`At the very end, hit the hero with \`hero.health -= 999\` and then \`print(hero.is_alive)\`. Predict \`hero.health\` before running.`,
        hint: py`Two lines at the bottom. The setter's \`max(0, ...)\` decides what happens.`,
        tests: [
          { name: 'health is clamped to 0', code: py`assert hero.health == 0` },
          { name: 'printed False last', code: py`assert output.strip().endswith("False")` },
        ],
        explain: py`\`100 - 999\` is \`-899\`, but the setter clamps it to \`0\`, and \`is_alive\` — computed from \`_health\` — immediately says \`False\`. No caller can ever produce negative health.`,
      },
      {
        id: 'long-name',
        task: py`Add a rule to the \`name\` setter: names longer than **12** characters (after stripping spaces) raise \`ValueError\`.`,
        hint: py`After \`value = value.strip()\`: \`if len(value) > 12: raise ValueError("name too long")\`.`,
        tests: [
          { name: 'a 13-character name is rejected', code: py`with raises(ValueError):
    Player("Maximilianus-the-Great")` },
          { name: 'a 12-character name is fine', code: py`assert Player("x" * 12).name == "x" * 12` },
          { name: 'renaming is validated too', code: py`p = Player("Ada")
with raises(ValueError):
    p.name = "y" * 13
assert p.name == "Ada"` },
        ],
        explain: py`Because \`__init__\` assigns through the property, one rule in one setter covers both new players and renames. And a rejected assignment leaves the old value untouched.`,
      },
      {
        id: 'mana',
        task: py`Add a \`mana\` property that starts at **50** and is clamped to **0..50** by its setter, just like \`health\`.`,
        hint: py`In \`__init__\`: \`self.mana = 50\`. Then a \`@property def mana(self): return self._mana\` and a \`@mana.setter\` that stores \`max(0, min(value, 50))\` in \`self._mana\`.`,
        tests: [
          { name: 'mana is a property starting at 50', code: py`assert isinstance(vars(Player).get("mana"), property), 'Define mana with @property'
assert Player("x").mana == 50` },
          { name: 'mana is clamped to 0..50', code: py`p = Player("x")
p.mana = 80
assert p.mana == 50
p.mana = -5
assert p.mana == 0` },
        ],
        explain: py`Same pattern, new rule: the public name \`mana\`, the private storage \`_mana\`, and a setter that guarantees the invariant. Spells can now subtract mana freely without checking anything.`,
      },
      {
        id: 'xp-readonly',
        task: py`Expose experience points as a **read-only** property \`xp\`, so other code can read \`hero.xp\` but can only change it via \`gain_xp()\`.`,
        hint: py`A getter only: \`@property def xp(self): return self._xp\`. No setter means assignment raises \`AttributeError\`.`,
        tests: [
          { name: 'xp is a read-only property', code: py`assert isinstance(vars(Player).get("xp"), property), 'Define xp with @property'
p = Player("x")
p.gain_xp(40)
assert p.xp == 40
with raises(AttributeError):
    p.xp = 9999` },
        ],
        explain: py`Read-only properties publish data without giving away control of it. The only way to change XP is \`gain_xp()\`, which is where you'd later add rules like "XP can't be negative".`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What home.celsius = 99 really does',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'assign', label: 'home.celsius = 99', note: 'looks like plain assignment', x: 110, y: 80, tone: 'yellow' },
        { id: 'cls', label: 'Thermostat.celsius', note: 'a property object', x: 380, y: 80, tone: 'blue' },
        { id: 'setter', label: 'setter(home, 99)', note: 'your function', x: 650, y: 80, tone: 'kraft' },
        { id: 'store', label: "home.__dict__['_celsius']", note: 'valid values only', x: 650, y: 240 },
        { id: 'err', label: 'ValueError', note: 'invalid: nothing stored', x: 380, y: 240, tone: 'red' },
        { id: 'read', label: 'home.celsius', note: 'reading', x: 110, y: 240, tone: 'yellow' },
      ],
      edges: [
        { from: 'assign', to: 'cls', label: '1. found on the class' },
        { from: 'cls', to: 'setter', label: '2. calls fset' },
        { from: 'setter', to: 'store', label: '3a. ok' },
        { from: 'setter', to: 'err', label: '3b. reject' },
        { from: 'read', to: 'store', label: 'getter returns it', dashed: true },
      ],
      steps: [
        { focus: ['assign'], text: py`Normally \`obj.x = value\` just writes into the instance's \`__dict__\` (see [methods & attributes](lesson:methods-and-attributes)).` },
        { focus: ['assign', 'cls'], edges: ['assign->cls'], text: py`But first Python checks the **class**. It finds \`celsius\` there and it's a \`property\` — an object that defines what reading and writing mean. Properties take priority over the instance dict.` },
        { focus: ['cls', 'setter'], edges: ['cls->setter'], text: py`So instead of storing anything, Python calls the property's setter function with the instance and the new value: \`setter(home, 99)\`.` },
        { focus: ['setter', 'err'], edges: ['setter->err'], text: py`99 breaks the rule, so the setter raises \`ValueError\`. Nothing was stored; the object is still valid.` },
        { focus: ['setter', 'store'], edges: ['setter->store'], text: py`For a valid value the setter stores it under the *internal* name \`_celsius\`.` },
        { focus: ['read', 'store'], edges: ['read->store'], text: py`Reading \`home.celsius\` calls the getter, which returns \`self._celsius\`. The mechanism behind all this — the descriptor protocol — is explained in [descriptors](lesson:descriptors).` },
      ],
    },
    alt: 'Diagram: the assignment home.celsius = 99 finds a property object named celsius on the Thermostat class, which calls the setter function with home and 99. The setter either rejects the value by raising ValueError, storing nothing, or stores a valid value in the instance dictionary under _celsius. Reading home.celsius calls the getter, which returns _celsius.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A property lives on the **class**, not the instance. \`vars(Thermostat)["celsius"]\` is a \`property\` object holding up to three functions: \`fget\`, \`fset\` and \`fdel\`. The instance only stores the real data, under the underscore name.`,
      { code: py`class Thermostat:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        self._celsius = value


t = Thermostat(20)
prop = vars(Thermostat)["celsius"]
print(type(prop).__name__)           # property
print(prop.fget(t))                  # 20 — the getter is a plain function
print(vars(t))                       # {'_celsius': 20}`, lang: 'python', title: 'peeking at the property object' },
    ],
    technical: [
      py`**\`@property\` is just a call.** \`@property\` over \`def celsius\` means \`celsius = property(celsius)\`. \`@celsius.setter\` calls the existing property's \`.setter()\` method, which returns a **new** property with the same getter plus the setter — and that new object is bound to the name \`celsius\`. That's why the setter function must reuse the property's name: a different name would leave the original property without a setter and add a second one.`,
      py`**Properties are data descriptors.** \`property\` defines \`__get__\`, \`__set__\` and \`__delete__\`. For \`obj.x\`, Python checks the class first: a *data* descriptor found there wins over anything in \`obj.__dict__\`, so instance attributes can't shadow a property. That's the opposite of plain class attributes and methods. Details in [descriptors](lesson:descriptors) and [attribute access](lesson:attribute-access).`,
      py`**Name mangling is a compile-time text rewrite.** Inside a class body, any identifier like \`__token\` is rewritten to \`_ClassName__token\` — in \`self.__token\`, in \`other.__token\`, even in a plain local name. Leading underscores of the class name are dropped (\`class _Vault\` → \`_Vault__token\`). Strings aren't rewritten, so \`getattr(self, "__token")\` does **not** find the mangled attribute.`,
      { callout: 'note', title: 'CPython detail', text: py`Reading a property costs a Python function call, so it is slower than reading a plain attribute (the difference only matters in very hot loops; measure with [timeit](lesson:profiling) before worrying). \`functools.cached_property\` (3.8+) computes the value once and stores it in the instance \`__dict__\`; because it's a *non-data* descriptor, later reads find the stored value directly.` },
    ],
    production: [
      py`**Start with plain attributes.** Promote to a property when you need validation, conversion, a computed value or backward compatibility. That's the whole reason properties exist.`,
      py`**Keep properties cheap and predictable.** Readers expect \`obj.total\` to be fast and side-effect free. No network calls, database queries or file I/O behind a property — make those explicit methods (\`fetch_total()\`) so the cost is visible at the call site. For an expensive value that doesn't change, use \`functools.cached_property\`.`,
      py`**Validate at the boundary, keep the object valid.** Setters plus assigning through them in \`__init__\` guarantee the invariant for the object's whole life. For classes that are mostly data, [dataclasses](lesson:dataclasses) with \`__post_init__\` or a validation library (pydantic — third-party) may be a better fit than many hand-written properties.`,
      py`**Underscores are not security.** \`_secret\` and \`__secret\` are fully readable through \`vars()\`, debuggers and logging. Never assume an attribute is "hidden"; keep real secrets out of objects that get printed, and override \`__repr__\` so tokens don't end up in logs — see [secrets management](lesson:secrets-and-passwords).`,
      py`**Prefer \`_single\` over \`__double\`.** Use name mangling only when you're writing a class designed for subclassing and need to protect an internal name from accidental clashes. Elsewhere it just makes debugging and testing awkward.`,
    ],
  },
  mistakes: [
    {
      title: 'The setter assigns to itself (infinite recursion)',
      wrong: { code: py`class Thermostat:
    @property
    def celsius(self):
        return self.celsius          # calls the getter again...

    @celsius.setter
    def celsius(self, value):
        self.celsius = value         # calls the setter again... RecursionError`, lang: 'python', static: true },
      right: { code: py`class Thermostat:
    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        self._celsius = value`, lang: 'python' },
      explanation: py`Inside the property, \`self.celsius\` *is* the property, so it calls itself forever until Python raises \`RecursionError: maximum recursion depth exceeded\`. Always store the data under a different name, conventionally the same name with a leading underscore.`,
    },
    {
      title: 'Giving the setter a different name',
      wrong: { code: py`class Account:
    def __init__(self):
        self._balance = 0

    @property
    def balance(self):
        return self._balance

    @balance.setter
    def set_balance(self, value):     # wrong name!
        self._balance = value


Account().balance = 5   # AttributeError: property 'balance' of 'Account' object has no setter`, lang: 'python', static: true },
      right: { code: py`class Account:
    def __init__(self):
        self._balance = 0

    @property
    def balance(self):
        return self._balance

    @balance.setter
    def balance(self, value):
        self._balance = value


acct = Account()
acct.balance = 5
print(acct.balance)`, lang: 'python' },
      explanation: py`\`@balance.setter\` returns a *new* property that has the setter, and binds it to whatever name the \`def\` uses. With \`set_balance\`, you end up with two properties: \`balance\` (read-only) and \`set_balance\`.`,
    },
    {
      title: 'Bypassing the setter in __init__',
      wrong: { code: py`class Product:
    def __init__(self, price):
        self._price = price          # skips validation!

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError("negative price")
        self._price = value


print(Product(-5).price)   # -5 — an invalid object was created`, lang: 'python' },
      right: { code: py`class Product:
    def __init__(self, price):
        self.price = price           # goes through the setter

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError("negative price")
        self._price = value


try:
    Product(-5)
except ValueError as err:
    print(err)   # negative price`, lang: 'python' },
      explanation: py`Validation that only runs on later updates still lets invalid objects be born. Assign through the property in \`__init__\`.`,
    },
    {
      title: 'Java-style getters and setters',
      wrong: { code: py`class Player:
    def __init__(self, name):
        self._name = name

    def get_name(self):
        return self._name

    def set_name(self, value):
        self._name = value


p = Player("Ada")
p.set_name(p.get_name().upper())`, lang: 'python' },
      right: { code: py`class Player:
    def __init__(self, name):
        self.name = name             # plain attribute until it needs rules


p = Player("Ada")
p.name = p.name.upper()`, lang: 'python' },
      explanation: py`Trivial getters and setters add noise and protect nothing. In Python a plain attribute can become a property later without changing any caller, so there's no reason to pre-wrap it.`,
    },
    {
      title: 'Treating __double_underscore as private or secure',
      wrong: { code: py`class Vault:
    def __init__(self, code):
        self.__code = code          # "nobody can read this now"


v = Vault("0000")
print(vars(v))                       # {'_Vault__code': '0000'} — oops`, lang: 'python' },
      right: { code: py`class Vault:
    def __init__(self, code):
        self._code = code           # internal by convention

    def __repr__(self):
        return "Vault(code=***)"    # don't leak it in logs


print(Vault("0000"))`, lang: 'python' },
      explanation: py`Name mangling only renames the attribute to prevent clashes with subclasses. It hides nothing. Use a single underscore for "internal", and treat real secrets as data that must be kept out of logs and reprs.`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: property 'level' of 'Player' object has no setter`,
      cause: py`You assigned to a read-only property, or the setter was defined under a different name than the property. (Older Python versions phrase this as \`can't set attribute\`.)`,
      fix: py`If it should be writable, add \`@level.setter\` with a function named exactly \`level\`. If it's deliberately computed, change the underlying data instead.`,
    },
    {
      symptom: py`RecursionError: maximum recursion depth exceeded`,
      cause: py`A getter returns \`self.x\` or a setter assigns \`self.x\`, where \`x\` is the property itself, so it keeps calling itself.`,
      fix: py`Store and read the data under a different name: \`self._x\`.`,
    },
    {
      symptom: py`AttributeError: 'Account' object has no attribute '__pin'`,
      cause: py`The attribute was created as \`self.__pin\` inside the class, so it was name-mangled to \`_Account__pin\`. Code outside the class (or in a subclass) using \`__pin\` looks for a different name.`,
      fix: py`Use a single underscore (\`_pin\`) unless you specifically need mangling; add a public method or property if outside code legitimately needs the value.`,
    },
    {
      symptom: py`TypeError: 'int' object is not callable`,
      cause: py`A property was called like a method: \`hero.health()\`. The getter already ran and returned an int, which you then tried to call.`,
      fix: py`Drop the parentheses: \`hero.health\`.`,
    },
    {
      symptom: py`An object holds an invalid value even though the setter validates.`,
      cause: py`Some code writes the internal attribute directly (\`self._price = ...\` in \`__init__\` or another method), skipping the setter.`,
      fix: py`Assign through the property everywhere except inside the setter itself. Search the class for direct writes to the underscore name.`,
    },
  ],
  bestPractices: [
    'Start with plain public attributes; convert to @property only when you need logic — callers won\'t change.',
    'Store a property\'s data under the same name with a leading underscore (_price) and only touch it inside the property.',
    'Assign through the property in __init__ so objects are valid from the moment they exist.',
    'Use a single underscore for internal details; reserve __double_underscore for avoiding clashes in classes designed for subclassing.',
    'Keep getters fast and side-effect free; put I/O and expensive work in explicit methods or functools.cached_property.',
    'Name computed values like data (area, is_alive, full_name) and actions like verbs (gain_xp(), withdraw()).',
    'Never rely on underscores for security, and keep secrets out of __repr__ and logs.',
  ],
  useCases: [
    'Validating input: prices can\'t be negative, ages must be 0–150, emails must contain @.',
    'Normalising data on the way in: stripping whitespace, lower-casing emails, rounding money.',
    'Computed attributes: area, full_name, is_overdue, total.',
    'Read-only views of internal state: account.balance changes only through deposit()/withdraw().',
    'Keeping backward compatibility when a stored attribute becomes computed or validated.',
  ],
  whenToUse: {
    use: [
      'An attribute needs validation, conversion or clamping on every write.',
      'A value can be derived from other attributes and must never go stale.',
      'You want outsiders to read a value but change it only through methods (read-only property).',
      'A public attribute must gain behaviour without breaking existing callers.',
    ],
    avoid: [
      'A trivial getter/setter pair that just reads and writes — use a plain attribute.',
      'Anything slow or with side effects (network, database, files) — use a named method.',
      'Huge data classes full of properties — consider a dataclass or a validation library.',
    ],
  },
  comparison: {
    title: 'Three ways to expose a value',
    headers: ['', 'plain attribute', 'get_x() / set_x() methods', '@property'],
    rows: [
      ['read', 'item.price', 'item.get_price()', 'item.price'],
      ['write', 'item.price = 9', 'item.set_price(9)', 'item.price = 9'],
      ['validation possible?', 'no', 'yes', 'yes'],
      ['can add logic later without changing callers?', 'yes — by turning it into a property', 'already methods', 'yes'],
      ['Pythonic?', 'yes, the default', 'rarely; noisy', 'yes, when logic is needed'],
    ],
    note: py`The plain attribute and the property share one interface. That's why Python code starts simple and upgrades only when needed.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'properties-and-encapsulation-q1',
      type: 'mcq',
      prompt: py`What does a single leading underscore, as in \`self._cache\`, mean?`,
      options: [
        { text: 'Python makes the attribute private and blocks outside access', why: 'Python enforces no privacy here: obj._cache works from anywhere.' },
        'It is a convention meaning "internal — don\'t rely on this from outside"',
        { text: 'Python renames it to _ClassName_cache', why: 'Renaming (name mangling) happens only with two leading underscores.' },
        { text: 'It marks the attribute as read-only', why: 'Read-only behaviour needs a property without a setter.' },
      ],
      answer: 1,
      explanation: py`A single underscore is a PEP 8 convention. It signals "implementation detail" to humans and linters; the interpreter doesn't enforce anything (apart from \`from module import *\` skipping such names at module level).`,
    },
    {
      id: 'properties-and-encapsulation-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Account:
    def __init__(self):
        self.__pin = "1234"


acct = Account()
print(hasattr(acct, "__pin"), hasattr(acct, "_Account__pin"))`,
      answer: 'False True',
      accept: ['False True'],
      explanation: py`Inside the class, \`self.__pin\` is rewritten to \`self._Account__pin\`. From outside, \`"__pin"\` is just a string that doesn't match the stored name.`,
    },
    {
      id: 'properties-and-encapsulation-q3',
      type: 'bug',
      prompt: 'Creating a `Thermostat` never finishes — it ends in `RecursionError`. Click the line that causes it.',
      code: py`class Thermostat:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        self.celsius = value`,
      answerLine: 11,
      explanation: py`Inside the setter, \`self.celsius = value\` triggers the setter again, endlessly. It should store the data under the internal name: \`self._celsius = value\`. Line 3 is correct — assigning through the property in \`__init__\` is exactly what you want.`,
    },
    {
      id: 'properties-and-encapsulation-q4',
      type: 'fill',
      prompt: 'Complete the code so that `p.price = -1` raises `ValueError` while `p.price` reads the stored value.',
      code: py`class Product:
    @___
    def price(self):
        return self._price

    @price.___
    def price(self, value):
        if value < 0:
            raise ValueError("negative price")
        self._price = value`,
      answer: [['property'], ['setter']],
      explanation: py`\`@property\` creates the getter; \`@price.setter\` attaches a setter to that same property. Both functions are named \`price\`.`,
    },
    {
      id: 'properties-and-encapsulation-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`class Rect:
    def __init__(self, w, h):
        self.w, self.h = w, h

    @property
    def area(self):
        return self.w * self.h


r = Rect(2, 3)
r.w = 10
print(r.area)`,
      options: [
        { text: '6', why: 'area isn\'t stored at creation time — it is recomputed on every read, using the current w.' },
        '30',
        { text: '<bound method Rect.area of ...>', why: 'That is what you would see without @property. A property runs the function when read.' },
        { text: 'TypeError', why: 'Reading a property without parentheses is exactly how properties are meant to be used.' },
      ],
      answer: 1,
      explanation: py`A computed property runs its getter on every access, so it always reflects the latest data: \`10 * 3 = 30\`.`,
    },
    {
      id: 'properties-and-encapsulation-q6',
      type: 'mcq',
      prompt: 'What is name mangling (`self.__x`) mainly designed for?',
      options: [
        { text: 'Keeping passwords and tokens secure', why: 'The value is still readable as obj._ClassName__x and via vars(). It is not a security feature.' },
        'Preventing subclasses from accidentally overwriting a parent class\'s internal attributes',
        { text: 'Making attributes read-only', why: 'Mangled attributes can still be assigned (under their mangled name). Read-only needs a property.' },
        { text: 'Speeding up attribute access', why: 'Mangling is a compile-time rename with no performance purpose.' },
      ],
      answer: 1,
      explanation: py`Because the name gets the class name baked in (\`_Base__x\` vs \`_Child__x\`), a parent and a child can both use \`__x\` without clobbering each other.`,
    },
    {
      id: 'properties-and-encapsulation-q7',
      type: 'short',
      prompt: 'Why do Python developers usually start with plain public attributes instead of writing getter and setter methods from the beginning?',
      answer: py`Because a plain attribute can later be turned into a @property with the same name without changing any calling code: item.price keeps working for reads and writes, and the property adds validation or computation. Writing get_price()/set_price() upfront adds noise and protects nothing; in languages without properties you'd need them to avoid breaking callers later, but Python doesn't have that problem.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'validated-rectangle',
      title: 'A rectangle that stays valid',
      difficulty: 'intermediate',
      prompt: py`Finish \`Rectangle\`:

- \`width\` and \`height\` are **properties** whose setters raise \`ValueError\` for values \`<= 0\`. Store the data in \`_width\` / \`_height\`.
- \`__init__\` must go through the setters, so \`Rectangle(0, 5)\` raises \`ValueError\` too. A rejected assignment must leave the old value unchanged.
- \`area\` and \`perimeter\` are **read-only computed** properties (assigning them raises \`AttributeError\`).

The program must print exactly \`20 18\`.`,
      files: {
        'main.py': py`class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    # TODO: width and height properties that reject values <= 0

    @property
    def area(self):
        return 0  # TODO

    @property
    def perimeter(self):
        return 0  # TODO


box = Rectangle(3, 4)
box.width = 5
print(box.area, box.perimeter)
`,
      },
      hints: [
        'Each validated attribute needs two functions with the same name: one under @property (return self._width) and one under @width.setter.',
        'In the setter, check first and raise before storing: if value <= 0: raise ValueError(...). Only then self._width = value.',
        'area is self.width * self.height and perimeter is 2 * (self.width + self.height). With no setter they are automatically read-only.',
      ],
      solution: {
        explanation: py`\`__init__\` assigns \`self.width\` and \`self.height\`, which run the setters — so validation covers creation and later changes alike. Each setter raises *before* storing, which is why a rejected value leaves the old one in place. \`area\` and \`perimeter\` have only getters, so they're read-only and always computed from the current sides: 5 × 4 = 20 and 2 × (5 + 4) = 18.`,
        files: {
          'main.py': py`class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError(f"width must be positive, got {value}")
        self._width = value

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        if value <= 0:
            raise ValueError(f"height must be positive, got {value}")
        self._height = value

    @property
    def area(self):
        return self.width * self.height

    @property
    def perimeter(self):
        return 2 * (self.width + self.height)


box = Rectangle(3, 4)
box.width = 5
print(box.area, box.perimeter)
`,
        },
      },
      tests: [
        { name: 'width and height are properties', code: py`assert isinstance(vars(Rectangle).get("width"), property), 'Make width a @property'
assert isinstance(vars(Rectangle).get("height"), property), 'Make height a @property'` },
        { name: 'invalid sides are rejected on creation', code: py`with raises(ValueError):
    Rectangle(0, 5)
with raises(ValueError):
    Rectangle(3, -1)` },
        { name: 'a rejected assignment keeps the old value', code: py`r = Rectangle(2, 2)
with raises(ValueError):
    r.width = -4
assert r.width == 2` },
        { name: 'area and perimeter follow the sides', code: py`r = Rectangle(3, 4)
assert (r.area, r.perimeter) == (12, 14)
r.height = 10
assert (r.area, r.perimeter) == (30, 26)` },
        { name: 'area is read-only', code: py`with raises(AttributeError):
    Rectangle(1, 1).area = 99` },
        { name: 'prints "20 18"', code: py`assert output.strip() == "20 18"` },
      ],
    },
    {
      id: 'refactor-price',
      title: 'Refactor without breaking callers',
      difficulty: 'intermediate',
      prompt: py`\`Product.price\` is a plain attribute, and \`apply_discount()\` (pretend it's used all over the app) reads and writes it directly. Make prices safe **without changing \`apply_discount\` or the lines below it**:

- \`price\` becomes a property stored in \`_price\`.
- The setter raises \`ValueError\` for negative prices (on creation too).
- The setter stores the value rounded to 2 decimals: \`round(value, 2)\`.

The program must still print \`desk lamp 34.0\`.`,
      files: {
        'main.py': py`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    # TODO: turn price into a validated, rounding property


# --- existing code used all over the app: do not change ---
def apply_discount(product, percent):
    product.price = product.price * (100 - percent) / 100


lamp = Product("desk lamp", 40)
apply_discount(lamp, 15)
print(lamp.name, lamp.price)
`,
      },
      hints: [
        'Keep self.price = price in __init__ — once price is a property, that line runs your setter.',
        'Add @property def price(self): return self._price, then @price.setter def price(self, value): ...',
        'In the setter: if value < 0: raise ValueError("price cannot be negative"), then self._price = round(value, 2).',
      ],
      solution: {
        explanation: py`The class's *interface* — \`product.price\` for reading and writing — is unchanged, so \`apply_discount\` and every other caller keep working. Behind it, the property validates and rounds on every write, including the one in \`__init__\`. \`10 * 67 / 100\` is \`6.7\`; \`9.999\` rounds to \`10.0\`; and \`-1\` is refused before anything is stored. This is the refactor that makes "start with a plain attribute" safe in Python.`,
        files: {
          'main.py': py`class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, value):
        if value < 0:
            raise ValueError("price cannot be negative")
        self._price = round(value, 2)


# --- existing code used all over the app: do not change ---
def apply_discount(product, percent):
    product.price = product.price * (100 - percent) / 100


lamp = Product("desk lamp", 40)
apply_discount(lamp, 15)
print(lamp.name, lamp.price)
`,
        },
      },
      tests: [
        { name: 'price is a property stored in _price', code: py`assert isinstance(vars(Product).get("price"), property), 'Make price a @property'
assert "_price" in vars(Product("x", 1))` },
        { name: 'prices are rounded to 2 decimals', code: py`p = Product("x", 9.999)
assert p.price == 10.0
p.price = 1.234
assert p.price == 1.23` },
        { name: 'negative prices raise ValueError', code: py`with raises(ValueError):
    Product("x", -1)
p = Product("x", 5)
with raises(ValueError):
    p.price = -0.01
assert p.price == 5` },
        { name: 'apply_discount still works unchanged', code: py`assert "product.price = product.price * (100 - percent) / 100" in files["main.py"], 'Do not change apply_discount'
p = Product("x", 10)
apply_discount(p, 33)
assert p.price == 6.7` },
        { name: 'prints "desk lamp 34.0"', code: py`assert output.strip() == "desk lamp 34.0"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'properties-and-encapsulation-private',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Does Python have private attributes? How do Python programmers achieve encapsulation?',
      answer: 'No enforced privacy. Python relies on conventions: a leading underscore marks internals; double underscores trigger name mangling to avoid subclass clashes; properties control reads and writes behind a stable public interface. "We\'re all consenting adults."',
      explanation: py`Encapsulation is about a stable interface and protected invariants, not about locks. Python provides the interface tools (properties, methods, \`__repr__\`) and documents intent with naming. Anyone *can* read \`obj._x\`, but they accept the risk that it changes.`,
      whyAsked: 'Candidates from Java/C# often assume private exists or try to emulate it; this checks Pythonic thinking.',
      mistakes: ['Claiming __x makes an attribute private or secure', 'Saying Python has no encapsulation at all', 'Recommending getters/setters for every field'],
      followUps: ['What exactly does name mangling do?', 'When would you use a property?', 'How do linters help enforce the underscore convention?'],
      modelAnswer: 'Python has no enforced private attributes. Encapsulation is handled by convention and design: a single leading underscore says "internal, don\'t depend on this", and tools and code reviewers respect that. Two leading underscores trigger name mangling, which renames the attribute with the class name — but that\'s to avoid clashes in subclasses, not for secrecy. The real encapsulation tool is the property: I can expose a clean public attribute and still validate or compute behind it, and change the internals later without breaking callers. The community phrase is "we\'re all consenting adults".',
    },
    {
      id: 'properties-and-encapsulation-mangling-output',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`class Base:
    def __init__(self):
        self.__id = "base"

    def base_id(self):
        return self.__id


class Child(Base):
    def __init__(self):
        super().__init__()
        self.__id = "child"


c = Child()
print(c.base_id(), sorted(vars(c)))` },
      options: ["child ['__id']", "child ['_Child__id']", "base ['_Base__id', '_Child__id']", "base ['__id']"],
      correctOption: 2,
      answer: "`base ['_Base__id', '_Child__id']` — each class's __id is mangled with its own name, so the child's assignment creates a separate attribute and Base.base_id still reads _Base__id.",
      explanation: py`Mangling happens at compile time inside each class body: in \`Base\`, \`self.__id\` becomes \`self._Base__id\`; in \`Child\`, it becomes \`self._Child__id\`. The instance ends up with both. That's precisely the purpose: \`Child\` can't accidentally clobber \`Base\`'s internal state. With a single underscore, the child would have overwritten it and \`base_id()\` would return \`"child"\`.`,
      whyAsked: 'Tests precise knowledge of what mangling does and why it exists.',
      mistakes: ['Thinking mangling is per-instance or runtime', 'Thinking the child "overrides" the parent\'s __id', 'Believing mangled names can\'t be accessed at all'],
      followUps: ['What would change with self._id instead?', 'Is getattr(self, "__id") mangled?', 'What happens with a class named _Base?'],
      modelAnswer: 'It prints base and the list _Base__id, _Child__id. Inside each class body the compiler rewrites __id with that class\'s name, so Base writes _Base__id and Child writes _Child__id — two separate attributes on the same instance. base_id was compiled in Base, so it reads _Base__id and returns "base". That is exactly what mangling is for: letting a parent keep internal names that a subclass can\'t accidentally overwrite. With a single underscore, the child would have replaced it and we\'d see "child".',
    },
    {
      id: 'properties-and-encapsulation-property-vs-getters',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare a plain attribute, explicit get_x()/set_x() methods and @property. Which would you use, and when?',
      answer: 'Default to a plain attribute. Use @property when you need validation, conversion, computation or read-only access — it keeps attribute syntax, so you can switch later without changing callers. Explicit getter/setter methods are rarely Pythonic; use named methods only when the operation is expensive, has side effects or needs extra arguments.',
      explanation: py`A property and a plain attribute share an interface, which is what makes "start simple" safe. Methods signal "this does work": \`fetch_balance()\` warns the caller about I/O, whereas \`account.balance\` promises a cheap read. So the line isn't getters vs properties — it's "cheap, attribute-like" vs "an action".`,
      code: { lang: 'python', code: py`class User:
    def __init__(self, email):
        self.email = email

    @property
    def email(self):
        return self._email

    @email.setter
    def email(self, value):
        if "@" not in value:
            raise ValueError("invalid email")
        self._email = value.strip().lower()


u = User("  Ada@Example.COM ")
print(u.email)   # ada@example.com` },
      whyAsked: 'Shows whether you write idiomatic Python and understand the interface-stability argument.',
      mistakes: ['Wrapping every field in a property', 'Hiding slow I/O behind a property', 'Not knowing properties can be added later transparently'],
      followUps: ['What is functools.cached_property for?', 'Can a property take arguments?', 'How does property interact with dataclasses?'],
      modelAnswer: 'My default is a plain attribute — it\'s the simplest interface. When I need rules, like validating an email or keeping a value read-only, I switch to a property. Because a property is accessed with the same syntax, that switch doesn\'t break any caller, so there\'s no reason to write get_x and set_x methods up front the way you would in Java. I do use explicit methods when the operation is expensive, has side effects or takes arguments — something like fetch_balance() makes the cost visible, whereas a property should feel like a cheap read.',
    },
    {
      id: 'properties-and-encapsulation-email-refactor',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: '`user.email` is a plain attribute assigned in about 40 places. Duplicate accounts appear because some code stores "Ada@Example.com" and some "ada@example.com". How do you fix it with minimal risk?',
      answer: 'Turn email into a property whose setter normalises (strip + lower) and validates, storing into _email; assign through it in __init__. All 40 call sites keep working unchanged and every write is normalised. Then migrate existing stored data and add a test.',
      explanation: py`The property centralises the rule at the only place all writes pass through. Because the interface is identical, there is no need to touch call sites, which keeps the change small and reviewable. Existing records in the database still need a one-off migration, and a uniqueness constraint on the normalised column prevents regressions.`,
      whyAsked: 'A realistic refactoring task that tests whether you know the "promote to property" pattern and think about data already stored.',
      mistakes: ['Proposing to edit all 40 call sites', 'Forgetting __init__ must go through the setter', 'Forgetting existing data in storage'],
      followUps: ['How would you find code that writes _email directly?', 'Where else should validation live (database constraints)?', 'Would you raise or silently normalise invalid input?'],
      modelAnswer: 'I would convert email into a property. The getter returns self._email, and the setter strips whitespace, lower-cases and validates the value before storing it in _email; __init__ assigns through the property so new users are normalised too. Since the public interface stays user.email, all 40 call sites keep working without edits, which keeps the change low-risk. Then I would write a one-off migration for emails already stored, add a database uniqueness constraint on the normalised value, and add tests for mixed-case input.',
    },
    {
      id: 'properties-and-encapsulation-temperature',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Make `Temperature` store a single value, celsius. Add a validated `celsius` property (below -273.15 raises ValueError) and a `fahrenheit` property whose getter converts and whose setter converts back and stores celsius — reusing the same validation.',
      answer: 'celsius: getter returns _celsius, setter validates then stores. fahrenheit: getter returns celsius * 9/5 + 32; setter does self.celsius = (value - 32) * 5/9 so the celsius setter validates it.',
      explanation: py`Storing one source of truth (\`_celsius\`) means the two views can never disagree. The fahrenheit setter assigns \`self.celsius\`, not \`self._celsius\`, so absolute-zero validation is written once and applies to both units.`,
      starter: { files: { 'main.py': py`class Temperature:
    def __init__(self, celsius=0.0):
        self.celsius = celsius

    @property
    def fahrenheit(self):
        return None  # TODO


t = Temperature(25)
print(t.celsius, t.fahrenheit)
` } },
      tests: [
        { name: 'fahrenheit converts from celsius', code: py`assert Temperature(100).fahrenheit == approx(212)` },
        { name: 'setting fahrenheit updates celsius', code: py`t = Temperature()
t.fahrenheit = 32
assert t.celsius == approx(0)
t.fahrenheit = 212
assert t.celsius == approx(100)` },
        { name: 'below absolute zero is rejected in both units', code: py`with raises(ValueError):
    Temperature(-300)
t = Temperature(10)
with raises(ValueError):
    t.fahrenheit = -500
assert t.celsius == approx(10)` },
        { name: 'only one value is stored', code: py`assert list(vars(Temperature(5))) == ["_celsius"], 'Store only _celsius'` },
      ],
      solution: { files: { 'main.py': py`class Temperature:
    def __init__(self, celsius=0.0):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self.celsius = (value - 32) * 5 / 9


t = Temperature(25)
print(t.celsius, t.fahrenheit)
` } },
      hints: ['Store one value only: _celsius. Everything else is computed.', 'In the fahrenheit setter, assign to self.celsius so the existing validation runs.'],
      whyAsked: 'Checks fluency with getters/setters, single source of truth and reusing validation.',
      mistakes: ['Storing both _celsius and _fahrenheit (they can drift apart)', 'Writing self._celsius in the fahrenheit setter and skipping validation', 'Returning self.celsius inside the celsius getter (recursion)'],
      followUps: ['How would you add kelvin?', 'Would you make Temperature immutable instead? (frozen dataclass)'],
      modelAnswer: 'I keep a single source of truth, _celsius. The celsius property returns it, and its setter rejects anything below -273.15 before storing. The fahrenheit property is computed: the getter converts celsius to fahrenheit, and the setter converts the incoming value back and assigns it to self.celsius — not _celsius — so the absolute-zero check runs for both units. That way the two views can never disagree, and adding kelvin later is just one more computed property.',
    },
    {
      id: 'properties-and-encapsulation-recursion',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A developer adds a property `balance` and immediately gets `RecursionError: maximum recursion depth exceeded` when creating an account. The getter is `return self.balance` and the setter does `self.balance = value`. What\'s wrong?',
      answer: 'Inside the property, self.balance refers to the property itself, so the getter and setter call themselves forever. Store and read the data under a separate name, self._balance.',
      explanation: py`Properties live on the class and take priority over the instance dictionary. Every \`self.balance\` — read or write — goes back through the property. The backing attribute must have a different name; a leading underscore is the convention.`,
      code: { lang: 'python', code: py`class Account:
    def __init__(self, balance):
        self.balance = balance          # through the setter: good

    @property
    def balance(self):
        return self._balance            # backing attribute

    @balance.setter
    def balance(self, value):
        if value < 0:
            raise ValueError("negative balance")
        self._balance = value` },
      whyAsked: 'A very common first-property bug; the fix shows whether you understand where property data actually lives.',
      mistakes: ['Removing the assignment in __init__ instead of fixing the name', 'Raising the recursion limit'],
      followUps: ['Why can\'t an instance attribute named balance shadow the property?', 'Where does the actual value live?'],
      modelAnswer: 'The property and the data have the same name. Inside the setter, self.balance = value doesn\'t store anything — it calls the setter again, and the getter\'s return self.balance calls the getter again, until Python hits the recursion limit. The property is only the interface; the value has to live in a different attribute, conventionally self._balance. Keeping self.balance = balance in __init__ is correct, because that\'s how new objects get validated.',
    },
    {
      id: 'properties-and-encapsulation-how-property-works',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does `@property` work under the hood, and why can\'t an instance attribute override it when it can override a method?',
      answer: 'property is a class implementing the descriptor protocol (__get__, __set__, __delete__). Defining __set__ makes it a data descriptor, and attribute lookup gives data descriptors on the class priority over the instance __dict__. Functions only define __get__ (non-data descriptors), so an instance attribute with the same name wins over a method.',
      explanation: py`\`obj.x\` runs \`type(obj).__getattribute__\`: search the MRO for \`x\`; if it's a data descriptor, call its \`__get__\`; else if \`x\` is in \`obj.__dict__\`, return that; else use the non-data descriptor or plain class attribute. Writes follow the same priority: a data descriptor's \`__set__\` handles \`obj.x = v\`. \`@x.setter\` returns a copy of the property with \`fset\` filled in. A read-only property still defines \`__set__\` (it raises), which is why it's still a data descriptor. See [descriptors](lesson:descriptors).`,
      code: { lang: 'python', code: py`class Demo:
    @property
    def size(self):
        return 1

    def label(self):
        return "method"


d = Demo()
d.__dict__["size"] = 99     # sneak a value into the instance dict
d.__dict__["label"] = "shadowed"
print(d.size, d.label)      # 1 shadowed — the property wins, the method loses` },
      whyAsked: 'Distinguishes candidates who know the descriptor protocol and attribute precedence — the basis of ORMs, cached_property and many frameworks.',
      mistakes: ['Saying property is "special syntax" handled by the compiler', 'Not knowing the data vs non-data descriptor distinction', 'Thinking a read-only property has no __set__'],
      followUps: ['How does functools.cached_property differ (non-data descriptor)?', 'Write a minimal property-like descriptor', 'How do ORMs like SQLAlchemy use descriptors?'],
      modelAnswer: 'property is just a built-in class that implements the descriptor protocol — __get__, __set__ and __delete__ — and the decorator syntax creates an instance of it on the class, with @x.setter returning a copy that also has the setter. When Python looks up obj.x, it first searches the class: if it finds a data descriptor, meaning one with __set__ or __delete__, that wins over the instance dictionary. Functions only have __get__, so they are non-data descriptors, and an instance attribute with the same name shadows them. Even a read-only property defines __set__ — it just raises — so it can\'t be shadowed. cached_property deliberately is a non-data descriptor, so after the first computation the value in the instance dict takes over.',
    },
  ],

  takeaways: [
    'Encapsulation = a stable public interface that protects the object\'s rules; Python achieves it by convention and properties, not by enforcement.',
    '_name means "internal" by convention; __name is name-mangled to _ClassName__name to avoid subclass clashes — it is not security.',
    '@property makes reading obj.x call a getter; @x.setter makes obj.x = v call a setter that can validate, convert or clamp.',
    'Store a property\'s data under a different name (_x), and assign through the property in __init__ so objects are valid from birth.',
    'A property with only a getter is read-only; computed properties never go stale.',
    'Start with plain attributes — you can turn one into a property later without changing any caller.',
    'Keep properties fast and side-effect free; property works through the descriptor protocol (see the descriptors lesson).',
  ],
}
