// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ACCOUNTS = py`class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

    def describe(self):
        return f"{type(self).__name__} of {self.owner}: {self.balance:.2f}"


class SavingsAccount(Account):
    def __init__(self, owner, balance=0, rate=0.02):
        super().__init__(owner, balance)      # let Account set owner and balance
        self.rate = rate                      # then add what is new

    def add_interest(self):                   # a brand-new method
        self.deposit(self.balance * self.rate)


class OverdraftAccount(Account):
    def __init__(self, owner, balance=0, limit=100):
        super().__init__(owner, balance)
        self.limit = limit

    def withdraw(self, amount):               # override: a different rule
        if amount > self.balance + self.limit:
            raise ValueError("over your overdraft limit")
        self.balance -= amount


accounts = [
    Account("Ada", 50),
    SavingsAccount("Ben", 200, rate=0.05),
    OverdraftAccount("Cy", 20, limit=50),
]
accounts[1].add_interest()
accounts[2].withdraw(60)                      # allowed: Cy goes to -40

for acct in accounts:
    print(acct.describe())

print(isinstance(accounts[1], Account), issubclass(OverdraftAccount, SavingsAccount))
print([cls.__name__ for cls in OverdraftAccount.__mro__])
`

export default {
  id: 'inheritance',
  title: 'Inheritance & super()',
  summary: 'A subclass starts from an existing class, inherits everything it has, and then adds new behaviour, replaces it (override) or builds on it with super().',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['classes-and-objects', 'methods-and-attributes'],
  related: ['composition', 'polymorphism-and-duck-typing', 'abstract-base-classes', 'multiple-inheritance-mro', 'custom-exceptions', 'properties-and-encapsulation', 'solid'],
  tags: ['inheritance', 'subclass', 'superclass', 'base class', 'parent class', 'child class', 'override', 'super()', 'isinstance', 'issubclass', 'object', 'mro', 'is-a', 'typing.override'],
  apis: [
    { name: 'class Child(Parent):', summary: 'Defines a subclass that inherits every attribute and method of Parent.' },
    { name: 'super()', summary: 'Inside a method: a proxy that finds the next implementation up the class chain, e.g. super().__init__(...).' },
    { name: 'isinstance(obj, cls)', summary: 'True if obj is an instance of cls or of any subclass of cls (accepts a tuple of classes).' },
    { name: 'issubclass(cls, parent)', summary: 'True if cls inherits from parent (a class counts as a subclass of itself).' },
    { name: 'Class.__mro__ / Class.mro()', summary: 'The method resolution order: the classes Python searches, in order.' },
    { name: 'Class.__bases__', summary: 'A tuple of the direct parent classes.' },
    { name: '@typing.override', summary: 'Marks a method as an override so type checkers catch typos (3.12+).' },
  ],
  docs: [
    { label: 'Python tutorial — Inheritance', url: 'https://docs.python.org/3/tutorial/classes.html#inheritance' },
    { label: 'Built-in functions — super()', url: 'https://docs.python.org/3/library/functions.html#super' },
    { label: 'Built-in functions — isinstance()', url: 'https://docs.python.org/3/library/functions.html#isinstance' },
    { label: 'Built-in functions — issubclass()', url: 'https://docs.python.org/3/library/functions.html#issubclass' },
    { label: 'typing.override (PEP 698)', url: 'https://docs.python.org/3/library/typing.html#typing.override' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Inheritance** lets you define a new class *based on* an existing one. The new class — the **subclass** (or *child*, *derived class*) — automatically gets every attribute and method of the existing class — the **base class** (or *parent*, *superclass*). Then it can:`,
    py`- **add** new methods and attributes (a savings account can \`add_interest()\`);
- **override** a method: define one with the same name to *replace* the parent's behaviour (an overdraft account has a different \`withdraw\` rule);
- **extend** a method: override it but call the parent's version with \`super()\`, then do a bit more.`,
    py`Inheritance models an **"is-a"** relationship: a savings account *is an* account, a manager *is an* employee. Everything that works with an \`Account\` should work with a \`SavingsAccount\` too.`,
    py`You've used it without noticing: every class you write inherits from \`object\`, and every exception you catch is a subclass of \`BaseException\`.`,
  ],
  why: [
    py`**Reuse without copy-paste.** Three kinds of account share \`deposit\`, \`withdraw\` and \`describe\`. Write them once in \`Account\`; fix a bug there and all subclasses get the fix.`,
    py`**Specialise only what's different.** A subclass contains just the differences — a new rate, a new rule — which makes each class short and its purpose obvious.`,
    py`**Plug into frameworks.** A lot of Python is designed around subclassing: custom exceptions (\`class OutOfStock(Exception)\`, see [custom exceptions](lesson:custom-exceptions)), \`unittest.TestCase\`, \`logging.Handler\`, \`json.JSONEncoder\`. You inherit the machinery and override one or two hooks.`,
    py`**One interface, many behaviours.** Code that loops over accounts and calls \`describe()\` works for every subclass — the essence of [polymorphism](lesson:polymorphism-and-duck-typing).`,
  ],
  eli15: [
    py`Imagine a recipe card called **Basic pancakes**. Your friend writes a new card: "**Chocolate pancakes** — make Basic pancakes, then stir in chocolate chips." She didn't copy the whole recipe; she *inherited* it and *added* one step.`,
    py`Another card says "**Fluffy pancakes** — same as Basic, **except** whisk the egg whites separately." That one step is *replaced* — that's an **override**.`,
    py`And when a card says "do what the Basic recipe says for the batter, *then* add cinnamon", that's \`super()\`: "do the parent's version first, then my extra bit". If someone improves the Basic recipe, every pancake card built on it improves too.`,
  ],
  analogy: {
    title: 'Recipe variations',
    body: [
      py`A cookbook has a master recipe and variations. Each variation points back to the master: "as above, but…". Nobody rewrites the whole thing. When you follow a variation, you look at the variation card first; any step it doesn't mention, you take from the master recipe.`,
      py`That "check the variation, then fall back to the master" habit is exactly how Python finds methods: the subclass first, then its parent, then the parent's parent, all the way up to \`object\`.`,
    ],
    mapping: [
      ['the master recipe', 'the base class (Account)'],
      ['a variation card', 'a subclass (SavingsAccount)'],
      ['"as above, plus chocolate chips"', 'adding a new method'],
      ['"except: whisk egg whites separately"', 'overriding a method'],
      ['"make the batter as above, then add cinnamon"', 'extending with super()'],
      ['looking at the variation first, then the master', 'method lookup: subclass → parent → object'],
      ['improving the master recipe', 'fixing the base class fixes every subclass'],
    ],
  },
  visual: {
    type: 'class-lookup',
    title: 'Where does obj.attr come from?',
    props: { preset: 'single' },
    alt: 'An interactive diagram of single inheritance: an instance, its class, the parent class and finally object, stacked in a chain. Looking up an attribute checks the instance\'s own __dict__ first, then its class, then the parent class, then object, and stops at the first place the name is found. If no class in the chain has it, AttributeError is raised.',
    caption: py`Pick an attribute and follow the search. Inheritance doesn't copy methods into the subclass — the subclass simply has a **parent to fall back on**. The order Python searches is the class's *method resolution order*, \`Class.__mro__\`.`,
  },
  syntax: [
    py`#### Defining a subclass`,
    { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def describe(self):
        return f"{self.name} earns {self.salary}"


class Manager(Employee):        # Manager inherits from Employee
    pass                        # nothing new yet — still a full Employee


boss = Manager("Ada", 60000)    # uses Employee.__init__
print(boss.describe())          # Ada earns 60000 — inherited method`, lang: 'python', title: 'class Child(Parent)' },
    py`Put the parent class in parentheses after the name. With an empty body, \`Manager\` behaves exactly like \`Employee\` but is a distinct type. A class with no parentheses (\`class Employee:\`) implicitly inherits from \`object\`.`,
    py`#### Adding and overriding`,
    { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def yearly_bonus(self):
        return self.salary * 0.05


class Manager(Employee):
    def approve_leave(self, person):          # ADD: only managers have this
        return f"{self.name} approved leave for {person}"

    def yearly_bonus(self):                   # OVERRIDE: replaces the parent's
        return self.salary * 0.10


ada = Manager("Ada", 60000)
print(ada.approve_leave("Ben"))   # Ada approved leave for Ben
print(ada.yearly_bonus())         # 6000.0 — Manager's version wins
print(Employee("Ben", 40000).yearly_bonus())   # 2000.0 — parent unchanged`, lang: 'python', title: 'new methods and overrides' },
    py`An override is simply a method with the **same name** in the subclass. Lookup finds the subclass's version first and stops there. The parent's method still exists — it's just not reached through a \`Manager\`.`,
    py`#### super(): extend instead of replace`,
    { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def yearly_bonus(self):
        return self.salary * 0.05


class Manager(Employee):
    def __init__(self, name, salary, reports=None):
        super().__init__(name, salary)        # parent sets name and salary
        self.reports = list(reports or [])    # then add what's new

    def yearly_bonus(self):
        base = super().yearly_bonus()         # parent's calculation...
        return base + 1000 * len(self.reports)   # ...plus a manager extra


ada = Manager("Ada", 60000, ["Ben", "Cy"])
print(ada.name, ada.reports)      # Ada ['Ben', 'Cy']
print(ada.yearly_bonus())         # 5000.0 = 3000.0 + 2 * 1000`, lang: 'python', title: 'super().__init__ and super().method()' },
    py`\`super()\` returns a helper object that looks up methods **starting from the parent** of the class you're in. \`super().__init__(name, salary)\` runs the parent's initialiser on *this* object (\`self\` is passed automatically), so the subclass doesn't duplicate that code. Use it whenever a subclass defines its own \`__init__\` — otherwise the parent's \`__init__\` never runs and its attributes never exist.`,
    { callout: 'warn', title: 'Overriding __init__ replaces it completely', text: py`If \`Manager\` defines \`__init__\` and forgets \`super().__init__(...)\`, \`Employee.__init__\` is never called: \`self.name\` doesn't exist, and the first use fails with \`AttributeError: 'Manager' object has no attribute 'name'\`.` },
    py`#### Inherited methods call overrides`,
    { code: py`class Report:
    def render(self):                          # the parent defines the steps...
        return f"[{self.title()}] {self.body()}"

    def title(self):
        return "Report"

    def body(self):
        return "(empty)"


class SalesReport(Report):
    def body(self):                            # ...a subclass fills one in
        return "sales up 4 units"


print(SalesReport().render())   # [Report] sales up 4 units`, lang: 'python', title: 'self always means the actual object' },
    py`\`render()\` lives in \`Report\`, but \`self\` is a \`SalesReport\`, so \`self.body()\` finds the subclass's version. This is how frameworks let you customise one step of a bigger process.`,
    py`#### isinstance() and issubclass()`,
    { code: py`class Employee:
    pass


class Manager(Employee):
    pass


ada = Manager()
print(isinstance(ada, Manager))          # True
print(isinstance(ada, Employee))         # True  — a Manager IS an Employee
print(type(ada) is Employee)             # False — type() is exact
print(issubclass(Manager, Employee))     # True
print(issubclass(Employee, Manager))     # False — not the other way round
print(isinstance(ada, (int, Employee)))  # True  — a tuple means "any of these"`, lang: 'python', title: 'checking types the inheritance-aware way' },
    py`Prefer \`isinstance()\` over \`type(x) == Something\`: it respects inheritance, so subclasses are accepted wherever their parent is. (Even better, often you don't need a type check at all — see [duck typing](lesson:polymorphism-and-duck-typing).)`,
    py`#### Everything inherits from object`,
    { code: py`class Employee:
    pass


print(Employee.__bases__)        # (<class 'object'>,)
print(Employee.__mro__)          # (<class '__main__.Employee'>, <class 'object'>)
print(issubclass(bool, int))     # True — even built-ins form hierarchies
print(isinstance(True, int))     # True`, lang: 'python', title: 'the root of every class' },
    py`\`object\` provides the defaults every class starts with: \`__init__\`, \`__repr__\` (the \`<... object at 0x...>\` text), \`__eq__\` (identity), \`__hash__\` and more. Defining a method with one of those names is overriding \`object\`'s version — exactly what you do when you write \`__repr__\` (see [special methods](lesson:special-methods)).`,
    py`#### When inheritance is the wrong tool`,
    py`Inheritance says "**is-a**, everywhere, forever": the subclass promises to work anywhere the parent works and takes on the parent's *whole* interface. If what you really mean is "**has-a**" or "uses-a", reach for [composition](lesson:composition) — store an object as an attribute and call it.`,
    { code: py`# Wrong tool: a Stack that "is a" list exposes insert(), sort(), [0] = ...
class ListStack(list):
    def push(self, item):
        self.append(item)


s = ListStack()
s.push(1)
s.insert(0, 99)     # allowed — but a stack should never do this
print(s)            # [99, 1] — the stack's order is broken


# Better: a Stack that HAS a list and exposes only stack operations
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        return self._items.pop()


stack = Stack()
stack.push(1)
print(stack.pop())  # 1 — and there is no insert() to misuse`, lang: 'python', title: 'is-a vs has-a' },
  ],
  walkthrough: {
    title: 'Reading the account hierarchy line by line',
    lang: 'python',
    code: ACCOUNTS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 15], text: py`\`Account\` is the base class: owner, balance, and three methods every account shares. \`describe()\` uses \`type(self).__name__\`, so it reports the *actual* class of whatever object it's called on.` },
      { lines: [18, 21], text: py`\`SavingsAccount(Account)\` inherits everything. Its \`__init__\` takes an extra \`rate\`, lets the parent store owner and balance via \`super().__init__\`, and then adds \`self.rate\`.` },
      { lines: [23, 24], text: py`A brand-new method. It calls \`self.deposit(...)\`, which isn't defined in \`SavingsAccount\` — lookup finds it on \`Account\`.` },
      { lines: [27, 35], text: py`\`OverdraftAccount\` **overrides** \`withdraw\` with a different rule: you may go below zero, down to \`-limit\`. Lookup finds this version first, so \`Account.withdraw\` is never reached for these objects.` },
      { lines: [38, 44], text: py`One list holds all three kinds. Ben earns 5% interest (200 → 210). Cy withdraws 60 from 20: the overdraft rule allows it, leaving -40 — a plain \`Account\` would have raised \`ValueError\`.` },
      { lines: [46, 47], text: py`The same call, \`describe()\`, works on every object because they all inherit it — and it prints each object's own class name.` },
      { lines: [49, 50], text: py`\`isinstance\` respects inheritance (a savings account *is an* Account). \`OverdraftAccount\` and \`SavingsAccount\` are siblings, so \`issubclass\` is \`False\`. The MRO shows the lookup order: \`OverdraftAccount → Account → object\`.` },
    ],
  },
  playground: {
    title: 'A family of bank accounts',
    objective: 'Extend a method with super(), add your own subclass, and watch a change in the base class reach every subclass.',
    files: { 'main.py': ACCOUNTS },
    expected: py`\`\`\`text
Account of Ada: 50.00
SavingsAccount of Ben: 210.00
OverdraftAccount of Cy: -40.00
True False
['OverdraftAccount', 'Account', 'object']
\`\`\``,
    experiments: [
      {
        id: 'extend-describe',
        task: py`Override \`describe()\` in \`SavingsAccount\` so it **extends** the parent's text with the rate: \`SavingsAccount of Ben: 210.00 (rate 5%)\`. Don't copy the parent's f-string — use \`super()\`.`,
        hint: py`\`return super().describe() + f" (rate {self.rate:.0%})"\` — the \`:.0%\` format turns \`0.05\` into \`5%\`.`,
        tests: [
          { name: 'Ben\'s line shows the rate', code: py`assert "SavingsAccount of Ben: 210.00 (rate 5%)" in output` },
          { name: 'other accounts are unchanged', code: py`assert "Account of Ada: 50.00\n" in output and "OverdraftAccount of Cy: -40.00" in output` },
        ],
        explain: py`\`super().describe()\` runs \`Account.describe\` on this object — note it still prints \`SavingsAccount\`, because \`self\` is the savings account. You added to the parent's behaviour without duplicating it, so a future change to \`Account.describe\` reaches savings accounts too.`,
      },
      {
        id: 'student-account',
        task: py`Add a subclass \`StudentAccount(Account)\` whose \`withdraw\` refuses any single withdrawal **over 30** with \`ValueError\`, and otherwise uses the normal \`Account\` rule (so overdrawing is still refused).`,
        hint: py`Override \`withdraw\`: \`if amount > 30: raise ValueError("student limit is 30")\`, then \`super().withdraw(amount)\` to reuse the insufficient-funds check.`,
        tests: [
          { name: 'StudentAccount is an Account', code: py`assert issubclass(ns.get("StudentAccount", object), Account), 'Define class StudentAccount(Account)'` },
          { name: 'more than 30 at once is refused', code: py`s = StudentAccount("x", 100)
with raises(ValueError):
    s.withdraw(31)
s.withdraw(30)
assert s.balance == 70` },
          { name: 'the parent\'s rule still applies', code: py`with raises(ValueError):
    StudentAccount("y", 10).withdraw(20)` },
        ],
        explain: py`The override adds one rule and then hands over to \`super().withdraw\`, so the "insufficient funds" check is still written only once, in \`Account\`. Extending beats replacing whenever the parent's behaviour is still correct.`,
      },
      {
        id: 'history',
        task: py`Give **every** account a transaction history: in \`Account.__init__\` add \`self.history = []\`, and make \`Account.deposit\` append \`("deposit", amount)\`. Don't touch the subclasses.`,
        hint: py`Two lines in \`Account\` only. Subclasses call \`super().__init__\`, so they get the list automatically.`,
        tests: [
          { name: 'every account has a history', code: py`assert all(isinstance(getattr(a, "history", None), list) for a in accounts), 'Add self.history = [] in Account.__init__'` },
          { name: 'Ben\'s interest was recorded', code: py`assert ("deposit", 10.0) in accounts[1].history` },
        ],
        explain: py`Because both subclasses call \`super().__init__\`, a new attribute in the base class reaches them for free — and \`add_interest()\` goes through the inherited \`deposit\`, so it's recorded too. If a subclass had skipped \`super().__init__\`, it would be missing \`history\` and crash on the first deposit.`,
      },
      {
        id: 'fixed-savings',
        task: py`Add \`FixedSavingsAccount(SavingsAccount)\` whose \`withdraw\` **always** raises \`ValueError("locked")\`. Add \`FixedSavingsAccount("Di", 500)\` to the end of the \`accounts\` list, then at the very end print \`[a.owner for a in accounts if isinstance(a, SavingsAccount)]\`.`,
        hint: py`A two-level chain: \`FixedSavingsAccount\` → \`SavingsAccount\` → \`Account\`. \`isinstance\` counts subclasses, so Di is included.`,
        tests: [
          { name: 'FixedSavingsAccount extends SavingsAccount', code: py`assert issubclass(ns.get("FixedSavingsAccount", object), SavingsAccount)` },
          { name: 'withdrawals are locked', code: py`with raises(ValueError):
    FixedSavingsAccount("x", 100).withdraw(1)` },
          { name: 'printed [\'Ben\', \'Di\']', code: py`assert "['Ben', 'Di']" in output` },
        ],
        explain: py`\`isinstance(a, SavingsAccount)\` is true for Di's account too, because a fixed savings account *is a* savings account. Di's account also inherited \`add_interest\` from two levels up the chain without you writing a line.`,
      },
    ],
  },
  animation: {
    type: 'class-lookup',
    title: 'Overriding: the first match wins',
    props: { preset: 'override' },
    alt: 'An animated diagram of method overriding in a two-class chain. When the subclass defines a method with the same name as its parent, attribute lookup reaches the subclass first and stops there, so the parent\'s version is skipped. Calling super() from inside the override resumes the search at the next class in the chain, so the parent\'s version runs as well.',
    caption: py`Lookup stops at the **first** class that defines the name. That's all an override is. \`super()\` doesn't mean "my parent" exactly — it means "**continue the search after my class**", which in single inheritance is the parent (with multiple inheritance it can be a sibling; see [multiple inheritance & the MRO](lesson:multiple-inheritance-mro)).`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Inheritance doesn't copy anything. \`SavingsAccount\`'s own namespace holds only what it defines; everything else is found by walking up the chain at lookup time. You can see both the chain and the "only what I define" namespace:`,
      { code: py`class Account:
    def deposit(self, amount):
        return amount


class SavingsAccount(Account):
    def add_interest(self):
        return "interest"


print(SavingsAccount.__bases__)                       # (<class '__main__.Account'>,)
print([c.__name__ for c in SavingsAccount.__mro__])   # ['SavingsAccount', 'Account', 'object']
print("deposit" in vars(SavingsAccount))              # False — not copied...
print(SavingsAccount().deposit(5))                    # 5 — ...found on Account`, lang: 'python', title: 'nothing is copied' },
      py`That's why changing a method on \`Account\` — even while the program runs — is immediately visible through every subclass.`,
    ],
    technical: [
      py`**The MRO.** When a class is created, Python computes its *method resolution order* — the list of classes to search — and stores it in \`__mro__\`. For single inheritance it's just the chain up to \`object\`. With several parents Python uses the C3 linearisation algorithm, covered in [multiple inheritance & the MRO](lesson:multiple-inheritance-mro). Attribute lookup on an instance checks data descriptors along the MRO, then the instance \`__dict__\`, then the rest of the MRO in order ([attribute access](lesson:attribute-access)).`,
      py`**How zero-argument \`super()\` works.** When a method body uses \`super\`, the compiler gives it a hidden \`__class__\` reference to the class being defined. \`super()\` with no arguments is shorthand for \`super(__class__, self)\`: a proxy that searches \`type(self).__mro__\` **starting after \`__class__\`**. That's why it breaks outside a normal method — e.g. in a \`@staticmethod\` there is no first argument, and you get \`RuntimeError: super(): no arguments\`.`,
      py`**isinstance under the hood.** \`isinstance(obj, C)\` is essentially "is \`C\` in \`type(obj).__mro__\`?", but classes can customise it with \`__instancecheck__\` / \`__subclasscheck__\` on their metaclass. That's how [abstract base classes](lesson:abstract-base-classes) like \`collections.abc.Iterable\` can say \`True\` for classes that never inherited from them.`,
      { callout: 'note', title: 'CPython detail: subclassing built-in types', text: py`Built-ins like \`dict\` and \`list\` are implemented in C in CPython, and their methods don't route through your overrides. Override \`__setitem__\` on a \`dict\` subclass and \`d["k"] = v\` uses it, but \`dict.update()\` and the \`dict(...)\` constructor bypass it. Other implementations generally behave the same way for compatibility, but it isn't a language promise. When you need consistent behaviour, subclass \`collections.UserDict\` / \`UserList\` (pure-Python wrappers) or use composition.` },
    ],
    production: [
      py`**Keep hierarchies shallow.** One or two levels is easy to follow; five levels means reading five files to understand one method. If you find yourself overriding methods to *disable* them, the hierarchy is wrong.`,
      py`**Honour the parent's contract (Liskov substitution).** Code written for \`Account\` must work with any subclass: same method names, compatible parameters, no surprise exceptions for inputs the parent accepted. A subclass may be *more* generous, not less. See [SOLID](lesson:solid).`,
      py`**Mark overrides.** \`from typing import override\` (3.12+) and decorate overriding methods with \`@override\`. Type checkers then report an error if the parent has no such method — catching typos like \`def withdrow\` that would otherwise silently add a new method.`,
      py`**Inherit to plug into frameworks; compose to reuse code.** Subclassing \`Exception\`, \`TestCase\` or a framework's base view is normal and expected. For sharing helpers between unrelated classes, prefer [composition](lesson:composition) or plain functions; deep "utility base classes" become hard to change.`,
      py`**Always call \`super().__init__\`** in an overriding \`__init__\` unless you deliberately want to skip the parent's setup — and leave a comment if you do.`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting super().__init__()',
      wrong: { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary


class Manager(Employee):
    def __init__(self, name, salary, reports):
        self.reports = reports          # Employee.__init__ never runs


m = Manager("Ada", 60000, ["Ben"])
print(m.name)   # AttributeError: 'Manager' object has no attribute 'name'`, lang: 'python', static: true },
      right: { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary


class Manager(Employee):
    def __init__(self, name, salary, reports):
        super().__init__(name, salary)
        self.reports = reports


m = Manager("Ada", 60000, ["Ben"])
print(m.name)`, lang: 'python' },
      explanation: py`Defining \`__init__\` in the subclass replaces the parent's. Nothing calls the parent's automatically — you have to, with \`super().__init__(...)\`.`,
    },
    {
      title: 'Copy-pasting the parent\'s code instead of calling it',
      wrong: { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name.strip().title()
        self.salary = salary


class Manager(Employee):
    def __init__(self, name, salary, reports):
        self.name = name.strip().title()     # duplicated...
        self.salary = salary                 # ...and will drift apart
        self.reports = reports`, lang: 'python' },
      right: { code: py`class Employee:
    def __init__(self, name, salary):
        self.name = name.strip().title()
        self.salary = salary


class Manager(Employee):
    def __init__(self, name, salary, reports):
        super().__init__(name, salary)
        self.reports = reports`, lang: 'python' },
      explanation: py`Duplicated setup means the next change to \`Employee.__init__\` (say, validating salary) silently skips managers. \`super()\` keeps one source of truth.`,
    },
    {
      title: 'A typo turns an override into a new method',
      wrong: { code: py`class Account:
    def withdraw(self, amount):
        return "normal rules"


class OverdraftAccount(Account):
    def withdrow(self, amount):          # typo: never called by anyone
        return "overdraft rules"


print(OverdraftAccount().withdraw(10))  # normal rules — the override silently failed`, lang: 'python' },
      right: { code: py`from typing import override


class Account:
    def withdraw(self, amount):
        return "normal rules"


class OverdraftAccount(Account):
    @override                            # 3.12+: type checkers verify the parent has it
    def withdraw(self, amount):
        return "overdraft rules"


print(OverdraftAccount().withdraw(10))  # overdraft rules`, lang: 'python' },
      explanation: py`Python can't know you *meant* to override. \`@typing.override\` (3.12+) records the intent so mypy/pyright report a misspelled or removed parent method. At runtime it only sets a marker attribute.`,
    },
    {
      title: 'Changing the method signature in an override',
      wrong: { code: py`class Account:
    def __init__(self):
        self.balance = 100

    def withdraw(self, amount):
        self.balance -= amount


class ATMAccount(Account):
    def withdraw(self, amount, pin):     # extra REQUIRED parameter
        self.balance -= amount


def pay_rent(account):
    account.withdraw(50)                 # works for Account...


pay_rent(ATMAccount())   # TypeError: ATMAccount.withdraw() missing 1 required positional argument: 'pin'`, lang: 'python', static: true },
      right: { code: py`class Account:
    def __init__(self):
        self.balance = 100

    def withdraw(self, amount):
        self.balance -= amount


class ATMAccount(Account):
    def __init__(self, pin=None):
        super().__init__()
        self.pin = pin                   # configuration goes in __init__

    def withdraw(self, amount):          # same signature as the parent
        self.balance -= amount


def pay_rent(account):
    account.withdraw(50)


pay_rent(ATMAccount(pin="1234"))`, lang: 'python' },
      explanation: py`Code written for the parent must work with every subclass. Adding a *required* parameter breaks that promise. Optional extras (with defaults) are fine; otherwise put the extra data in \`__init__\`.`,
    },
    {
      title: 'Inheriting just to reuse code (has-a, not is-a)',
      wrong: { code: py`class Engine:
    def start(self):
        return "vroom"


class Car(Engine):          # a car is not an engine
    pass


print(Car().start())`, lang: 'python' },
      right: { code: py`class Engine:
    def start(self):
        return "vroom"


class Car:
    def __init__(self):
        self.engine = Engine()   # a car HAS an engine

    def start(self):
        return self.engine.start()


print(Car().start())`, lang: 'python' },
      explanation: py`If "X is a Y" sounds wrong out loud, don't inherit. Composition lets you swap the engine, test the car with a fake engine and keep \`Car\`'s interface small. More in [composition over inheritance](lesson:composition).`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'Manager' object has no attribute 'name'`,
      cause: py`The subclass defines \`__init__\` but never calls \`super().__init__(...)\`, so the parent's attributes were never set.`,
      fix: py`Add \`super().__init__(name, salary)\` as the first line of the subclass's \`__init__\`.`,
    },
    {
      symptom: py`TypeError: Employee.__init__() missing 1 required positional argument: 'salary'`,
      cause: py`\`super().__init__(...)\` was called with fewer arguments than the parent's \`__init__\` needs.`,
      fix: py`Pass everything the parent requires: \`super().__init__(name, salary)\`. Don't pass \`self\` — \`super()\` supplies it.`,
    },
    {
      symptom: py`TypeError: Employee.__init__() takes 3 positional arguments but 4 were given`,
      cause: py`You passed an extra argument to a subclass that doesn't define its own \`__init__\`, so the parent's \`__init__\` received it.`,
      fix: py`Give the subclass an \`__init__\` that accepts the extra parameter, calls \`super().__init__(...)\` with the rest, and stores the extra.`,
    },
    {
      symptom: py`My overridden method never runs.`,
      cause: py`A typo in the method name, a different class than you think (\`print(type(obj))\`), or the object was created from the parent class.`,
      fix: py`Check \`type(obj).__mro__\` and \`"name" in vars(Subclass)\`. Decorate overrides with \`@typing.override\` (3.12+) so type checkers catch name mismatches.`,
    },
    {
      symptom: py`RuntimeError: super(): no arguments`,
      cause: py`Zero-argument \`super()\` was used where there is no \`self\`/\`cls\` first argument, such as a \`@staticmethod\` or a function defined outside a class.`,
      fix: py`Use \`super()\` only inside regular methods or classmethods. For a static helper, call the parent class explicitly or make it a classmethod.`,
    },
  ],
  bestPractices: [
    'Inherit only for genuine "is-a" relationships; use composition for "has-a".',
    'In an overriding __init__, call super().__init__(...) first, then add the subclass\'s own attributes.',
    'Extend with super().method() instead of copy-pasting the parent\'s code.',
    'Keep overrides compatible with the parent\'s signature and promises, so subclasses work anywhere the parent does.',
    'Use isinstance() rather than type(x) == C, and prefer no type check at all when duck typing works.',
    'Keep hierarchies shallow; mark overrides with @typing.override (3.12+) when you use a type checker.',
  ],
  useCases: [
    'Specialised versions of a domain object: SavingsAccount / OverdraftAccount from Account.',
    'Custom exception hierarchies: class PaymentError(Exception), class CardDeclined(PaymentError).',
    'Framework hooks: unittest.TestCase subclasses, logging.Handler, json.JSONEncoder.default().',
    'Template methods: a base class runs a fixed process and subclasses fill in one step.',
  ],
  whenToUse: {
    use: [
      'The subclass truly is a kind of the parent and can be used anywhere the parent is.',
      'A framework or library expects you to subclass one of its classes.',
      'Several closely related classes share most of their behaviour and differ in a few methods.',
    ],
    avoid: [
      'The relationship is "has-a" or "uses-a" — compose instead.',
      'You\'d need to disable or refuse inherited methods (a Stack subclassing list, a Square subclassing a mutable Rectangle).',
      'You only want to share one or two helper functions — use plain functions in a module.',
      'The hierarchy is getting deeper than two or three levels.',
    ],
  },
  comparison: {
    title: 'Three things a subclass can do with a parent\'s method',
    headers: ['', 'inherit as-is', 'override', 'extend with super()'],
    rows: [
      ['what you write', 'nothing', 'a method with the same name', 'a method with the same name that calls super().name(...)'],
      ['does the parent\'s code run?', 'yes', 'no', 'yes, plus your extra code'],
      ['typical use', 'shared behaviour (deposit)', 'a different rule (overdraft withdraw)', 'same rule plus a bit more (__init__, describe)'],
    ],
    note: py`When in doubt between overriding and extending, ask: is the parent's behaviour still correct, just incomplete? Then extend.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'inheritance-q1',
      type: 'mcq',
      prompt: py`What does \`class Manager(Employee):\` declare?`,
      options: [
        { text: 'Manager is a new class that contains an Employee object', why: 'That is composition (has-a). The parentheses mean inheritance (is-a).' },
        'Manager is a subclass of Employee and inherits all its methods and attributes',
        { text: 'Employee is now a subclass of Manager', why: 'It is the other way round: the class in parentheses is the parent.' },
        { text: 'Manager is a copy of Employee that can no longer change', why: 'Nothing is copied; Manager looks methods up on Employee and can add or override freely.' },
      ],
      answer: 1,
      explanation: py`The class in parentheses is the base class. \`Manager\` inherits its behaviour and can add new methods, override existing ones, or extend them with \`super()\`.`,
    },
    {
      id: 'inheritance-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Base:
    def greet(self):
        return "hello from " + self.name()

    def name(self):
        return "Base"


class Child(Base):
    def name(self):
        return "Child"


print(Child().greet())`,
      answer: 'hello from Child',
      accept: ['hello from Child'],
      explanation: py`\`greet\` is inherited from \`Base\`, but \`self\` is a \`Child\`. \`self.name()\` searches from \`Child\` first and finds its override.`,
    },
    {
      id: 'inheritance-q3',
      type: 'bug',
      prompt: 'This crashes with `AttributeError: \'Manager\' object has no attribute \'name\'`. What is the bug?',
      code: py`class Employee:
    def __init__(self, name):
        self.name = name


class Manager(Employee):
    def __init__(self, name, reports):
        self.reports = reports


m = Manager("Ada", ["Ben"])
print(m.name)`,
      options: [
        { text: 'Manager must not define its own __init__', why: 'Subclasses may define __init__; they just need to call the parent\'s too.' },
        'Manager.__init__ never calls super().__init__(name), so Employee.__init__ never sets name',
        { text: 'Employee must be defined after Manager', why: 'The parent must exist first — the order shown is correct.' },
        { text: 'reports should be a class attribute', why: 'reports is per-manager data; it belongs on self. The problem is the missing name.' },
      ],
      answer: 1,
      explanation: py`Overriding \`__init__\` replaces the parent's. Add \`super().__init__(name)\` at the top of \`Manager.__init__\` so \`Employee\` sets \`self.name\`.`,
    },
    {
      id: 'inheritance-q4',
      type: 'fill',
      prompt: 'Complete the subclass so `SavingsAccount("Ben", 200).balance` is `200` without duplicating `Account`\'s code.',
      code: py`class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance


class SavingsAccount(___):
    def __init__(self, owner, balance=0, rate=0.02):
        ___().__init__(owner, balance)
        self.rate = rate`,
      answer: [['Account'], ['super']],
      explanation: py`The parent goes in the parentheses, and \`super().__init__(owner, balance)\` runs \`Account.__init__\` on the new object.`,
    },
    {
      id: 'inheritance-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`class Animal:
    pass


class Dog(Animal):
    pass


rex = Dog()
print(isinstance(rex, Animal), type(rex) is Animal, issubclass(Dog, object))`,
      options: [
        { text: 'True True True', why: 'type() returns the exact class, Dog — not its parent.' },
        'True False True',
        { text: 'False False True', why: 'isinstance counts subclasses: a Dog is an Animal.' },
        { text: 'True False False', why: 'Every class inherits from object, directly or indirectly.' },
      ],
      answer: 1,
      explanation: py`\`isinstance\` follows inheritance, \`type()\` is exact, and every class ultimately inherits from \`object\`.`,
    },
    {
      id: 'inheritance-q6',
      type: 'mcq',
      prompt: 'You need a `Stack` with only `push()`, `pop()` and `peek()`. Which design is best?',
      options: [
        { text: 'class Stack(list) and add push/pop/peek', why: 'Inheriting from list also exposes insert(), sort(), slicing assignment and more — operations a stack must not allow.' },
        'A Stack class that stores a list in an attribute and exposes only the three methods',
        { text: 'class Stack(dict) keyed by position', why: 'Still exposes a huge unrelated interface, and a dict is the wrong structure.' },
        { text: 'Subclass list and override every unwanted method to raise an error', why: 'Disabling inherited methods is the classic sign that inheritance is the wrong tool.' },
      ],
      answer: 1,
      explanation: py`A stack *has* a list; it isn't one. Composition keeps the public interface exactly as small as the concept. See [composition](lesson:composition).`,
    },
    {
      id: 'inheritance-q7',
      type: 'short',
      prompt: 'What is the difference between overriding a method and extending it with `super()`?',
      answer: py`Overriding means defining a method with the same name in the subclass, which completely replaces the parent's version for that subclass — the parent's code no longer runs. Extending means overriding but calling super().method(...) inside, so the parent's behaviour still runs and the subclass adds to it (before or after). Extend when the parent's behaviour is still correct but incomplete, e.g. __init__.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'manager-bonus',
      title: 'Managers and interns',
      difficulty: 'intermediate',
      prompt: py`\`Employee\` is finished. Complete the two subclasses:

- \`Manager(Employee)\` takes \`(name, salary, reports=None)\`. It must let \`Employee.__init__\` set \`name\` and \`salary\` via \`super().__init__\` (replace the two copied lines), and store \`reports\` as a **new list** per manager (\`[]\` when \`None\`).
- \`Manager.yearly_bonus()\` returns the normal employee bonus (**call the parent's method with \`super()\`**) plus \`1000\` per report.
- \`Intern(Employee)\` overrides \`yearly_bonus()\` to return \`0\`.

The program must print exactly:

\`\`\`text
Ben (Employee) 2000.0
Ada (Manager) 5000.0
Cy (Intern) 0
\`\`\``,
      files: {
        'main.py': py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def yearly_bonus(self):
        return self.salary * 0.05

    def describe(self):
        return f"{self.name} ({type(self).__name__})"


class Manager(Employee):
    def __init__(self, name, salary, reports=None):
        self.name = name          # TODO: replace these two lines with super().__init__(...)
        self.salary = salary
        # TODO: store reports as a new list

    # TODO: yearly_bonus = the employee bonus + 1000 per report


class Intern(Employee):
    pass  # TODO: interns get no bonus


team = [Employee("Ben", 40000), Manager("Ada", 60000, ["Ben", "Cy"]), Intern("Cy", 18000)]
for person in team:
    print(person.describe(), person.yearly_bonus())
`,
      },
      hints: [
        'super().__init__(name, salary) runs Employee.__init__ on the new manager — it replaces both copied lines.',
        'For reports: self.reports = list(reports) if reports is not None else []. Never use a mutable default like reports=[].',
        'def yearly_bonus(self): return super().yearly_bonus() + 1000 * len(self.reports). In Intern: def yearly_bonus(self): return 0.',
      ],
      solution: {
        explanation: py`\`Manager.__init__\` delegates the shared setup to \`Employee\` with \`super().__init__\`, then adds only what's new. \`reports\` defaults to \`None\` and a fresh list is built per manager, avoiding the shared-default trap. \`Manager.yearly_bonus\` **extends** the parent: \`super().yearly_bonus()\` gives 3000.0, plus 2 × 1000 = 5000.0. \`Intern.yearly_bonus\` **overrides** it completely. \`describe()\` is inherited unchanged, and \`type(self).__name__\` makes it report each object's real class.`,
        files: {
          'main.py': py`class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def yearly_bonus(self):
        return self.salary * 0.05

    def describe(self):
        return f"{self.name} ({type(self).__name__})"


class Manager(Employee):
    def __init__(self, name, salary, reports=None):
        super().__init__(name, salary)
        self.reports = list(reports) if reports is not None else []

    def yearly_bonus(self):
        return super().yearly_bonus() + 1000 * len(self.reports)


class Intern(Employee):
    def yearly_bonus(self):
        return 0


team = [Employee("Ben", 40000), Manager("Ada", 60000, ["Ben", "Cy"]), Intern("Cy", 18000)]
for person in team:
    print(person.describe(), person.yearly_bonus())
`,
        },
      },
      tests: [
        { name: 'Manager stores reports in a new list', code: py`m = Manager("Ada", 60000, ["Ben", "Cy"])
assert (m.name, m.salary, m.reports) == ("Ada", 60000, ["Ben", "Cy"])
a, b = Manager("A", 1), Manager("B", 1)
a.reports.append("x")
assert b.reports == [], 'Each manager needs its own list'` },
        { name: 'Manager.__init__ uses super().__init__', code: py`original = Employee.__init__

def patched(self, name, salary):
    original(self, name, salary)
    self.badge = name.upper()

Employee.__init__ = patched
assert getattr(Manager("Ada", 1, []), "badge", None) == "ADA", 'Call super().__init__(name, salary) instead of setting name and salary yourself'` },
        { name: 'manager bonus = employee bonus + 1000 per report', code: py`assert Manager("Ada", 60000, ["Ben", "Cy"]).yearly_bonus() == 5000` },
        { name: 'the manager bonus builds on Employee.yearly_bonus', code: py`Employee.yearly_bonus = lambda self: 7
assert Manager("Ada", 60000, ["Ben"]).yearly_bonus() == 1007, 'Use super().yearly_bonus() instead of repeating the formula'` },
        { name: 'interns get 0', code: py`assert Intern("Cy", 18000).yearly_bonus() == 0
assert issubclass(Intern, Employee)` },
        { name: 'prints the three lines', code: py`assert output.strip() == "Ben (Employee) 2000.0\nAda (Manager) 5000.0\nCy (Intern) 0"` },
      ],
    },
    {
      id: 'media-library',
      title: 'A media library hierarchy',
      difficulty: 'intermediate',
      prompt: py`Build a three-level hierarchy and a type filter:

- \`Book(MediaItem)\` (given) stores an extra \`author\`. Override \`label()\` to **extend** the parent's: \`"Dune (1965) by Frank Herbert"\`.
- \`AudioBook(Book)\` takes \`(title, year, author, narrator)\`. Its \`__init__\` reuses \`Book\`'s via \`super()\` and stores \`narrator\`. Its \`label()\` extends \`Book\`'s: \`"... by J.R.R. Tolkien, read by Andy Serkis"\`.
- \`only(items, kind)\` returns a **list** of the items that are instances of \`kind\`, **subclasses included**, in their original order.

The program must print exactly:

\`\`\`text
Dune (1965) by Frank Herbert
The Hobbit (1937) by J.R.R. Tolkien, read by Andy Serkis
\`\`\``,
      files: {
        'main.py': py`class MediaItem:
    def __init__(self, title, year):
        self.title = title
        self.year = year

    def label(self):
        return f"{self.title} ({self.year})"


class Book(MediaItem):
    def __init__(self, title, year, author):
        super().__init__(title, year)
        self.author = author

    # TODO: override label() -> "Dune (1965) by Frank Herbert"


class AudioBook(Book):
    def __init__(self, title, year, author, narrator):
        pass  # TODO: reuse Book's __init__, then store narrator

    # TODO: override label() -> Book's label + ", read by <narrator>"


def only(items, kind):
    """Return the items that are instances of kind (subclasses included)."""
    return []  # TODO


library = [
    MediaItem("Blue Planet", 2001),
    Book("Dune", 1965, "Frank Herbert"),
    AudioBook("The Hobbit", 1937, "J.R.R. Tolkien", "Andy Serkis"),
]
for item in only(library, Book):
    print(item.label())
`,
      },
      hints: [
        'Book.label: return super().label() + f" by {self.author}". The parent already knows how to format title and year.',
        'AudioBook.__init__: super().__init__(title, year, author) runs Book.__init__ (which in turn runs MediaItem.__init__). Then self.narrator = narrator.',
        'AudioBook.label: return super().label() + f", read by {self.narrator}". For only(): return [item for item in items if isinstance(item, kind)].',
      ],
      solution: {
        explanation: py`Each \`label()\` adds one piece and delegates the rest to \`super()\`, so the format for title and year lives in exactly one place — change it in \`MediaItem\` and books and audiobooks follow. \`AudioBook.__init__\` calls \`Book.__init__\`, which calls \`MediaItem.__init__\`: a chain of \`super()\` calls, each class setting up its own part. \`only()\` uses \`isinstance\`, which accepts subclasses, so asking for \`Book\` also returns the audiobook (an audiobook *is a* book) while the documentary is skipped.`,
        files: {
          'main.py': py`class MediaItem:
    def __init__(self, title, year):
        self.title = title
        self.year = year

    def label(self):
        return f"{self.title} ({self.year})"


class Book(MediaItem):
    def __init__(self, title, year, author):
        super().__init__(title, year)
        self.author = author

    def label(self):
        return super().label() + f" by {self.author}"


class AudioBook(Book):
    def __init__(self, title, year, author, narrator):
        super().__init__(title, year, author)
        self.narrator = narrator

    def label(self):
        return super().label() + f", read by {self.narrator}"


def only(items, kind):
    """Return the items that are instances of kind (subclasses included)."""
    return [item for item in items if isinstance(item, kind)]


library = [
    MediaItem("Blue Planet", 2001),
    Book("Dune", 1965, "Frank Herbert"),
    AudioBook("The Hobbit", 1937, "J.R.R. Tolkien", "Andy Serkis"),
]
for item in only(library, Book):
    print(item.label())
`,
        },
      },
      tests: [
        { name: 'Book.label adds the author', code: py`assert Book("Dune", 1965, "Frank Herbert").label() == "Dune (1965) by Frank Herbert"` },
        { name: 'AudioBook is a Book and stores everything', code: py`a = AudioBook("T", 2000, "A", "N")
assert issubclass(AudioBook, Book)
assert (a.title, a.year, a.author, a.narrator) == ("T", 2000, "A", "N")` },
        { name: 'AudioBook.label extends Book.label', code: py`assert AudioBook("T", 2000, "A", "N").label() == "T (2000) by A, read by N"
Book.label = lambda self: "BOOK"
assert AudioBook("T", 2000, "A", "N").label() == "BOOK, read by N", 'Build on super().label()'` },
        { name: 'only() includes subclasses, in order', code: py`items = [MediaItem("m", 1), Book("b", 2, "x"), AudioBook("a", 3, "y", "z")]
assert [i.title for i in only(items, Book)] == ["b", "a"]
assert [i.title for i in only(items, MediaItem)] == ["m", "b", "a"]
assert [i.title for i in only(items, AudioBook)] == ["a"]
assert isinstance(only(items, Book), list)` },
        { name: 'prints the two labels', code: py`assert output.strip() == "Dune (1965) by Frank Herbert\nThe Hobbit (1937) by J.R.R. Tolkien, read by Andy Serkis"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'inheritance-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is inheritance, and what can a subclass do with its parent\'s methods?',
      answer: 'Inheritance creates a new class from an existing one, modelling an is-a relationship. The subclass gets all the parent\'s attributes and methods and can use them as-is, add new ones, override them (replace) or extend them by calling super(). Every class ultimately inherits from object.',
      explanation: py`Nothing is copied: lookup searches the subclass, then its parents (the MRO). Overriding is just defining the same name lower in the chain. \`super()\` continues the search above the current class, letting an override reuse the parent's behaviour.`,
      whyAsked: 'A core OOP concept; interviewers listen for is-a, override vs extend, and awareness of super().',
      mistakes: ['Saying methods are copied into the subclass', 'Not mentioning super()', 'Describing has-a relationships as inheritance'],
      followUps: ['When would you not use inheritance?', 'What does super() actually return?', 'What does every class inherit from object?'],
      modelAnswer: 'Inheritance lets me define a class in terms of an existing one: class SavingsAccount(Account) means a savings account is an account. The subclass gets all of the parent\'s attributes and methods, and then I can add new methods, override existing ones by defining the same name, or extend them by overriding and calling super() so the parent\'s behaviour still runs. Under the hood nothing is copied — Python looks up attributes on the subclass first, then the parent, up to object. I use it for genuine is-a relationships and for framework hooks, and prefer composition otherwise.',
    },
    {
      id: 'inheritance-template-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`class Animal:
    def speak(self):
        return "..."

    def intro(self):
        return f"I say {self.speak()}"


class Dog(Animal):
    def speak(self):
        return "Woof"


print(Animal().intro(), Dog().intro())` },
      options: ['I say ... I say ...', 'I say ... I say Woof', 'I say Woof I say Woof', 'AttributeError'],
      correctOption: 1,
      answer: '`I say ... I say Woof` — intro is inherited, but self.speak() is looked up on the actual object, so a Dog uses its override.',
      explanation: py`Method lookup always starts at \`type(self)\`, even when the calling method is defined in the parent. This is the *template method* pattern: the parent defines the algorithm (\`intro\`), subclasses customise a step (\`speak\`).`,
      whyAsked: 'Tests whether you understand dynamic dispatch through self — the mechanism behind framework hooks.',
      mistakes: ['Assuming a parent method always calls the parent\'s other methods', 'Confusing this with super()'],
      followUps: ['How would Dog.speak also include the parent\'s text?', 'Where have you seen the template method pattern in the standard library?'],
      modelAnswer: 'It prints "I say ..." then "I say Woof". intro is defined only in Animal, but when it calls self.speak(), the lookup starts from the actual object\'s class. For the Dog instance that finds Dog.speak, so it says Woof. That\'s dynamic dispatch, and it\'s what makes the template method pattern work: the base class defines the overall steps and subclasses override individual steps.',
    },
    {
      id: 'inheritance-missing-super-init',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A subclass of `logging.Handler`-style base class crashes later with `AttributeError: \'SlackHandler\' object has no attribute \'level\'`. The subclass defines `__init__(self, webhook)` and stores the webhook. What happened and how do you fix it?',
      answer: 'The subclass\'s __init__ replaced the parent\'s and never called super().__init__(), so the attributes the base class sets up (like level) never existed. Call super().__init__() (with any arguments the parent needs) at the start of the subclass\'s __init__.',
      explanation: py`Overriding \`__init__\` doesn't chain automatically in Python. Framework base classes rely on their \`__init__\` to set internal state (locks, levels, buffers), so skipping it fails far away from the cause. The fix is one line; the lesson is to always call \`super().__init__\` when overriding.`,
      code: { lang: 'python', code: py`import logging


class ListHandler(logging.Handler):
    def __init__(self, records, level=logging.NOTSET):
        super().__init__(level)      # the base class sets level, filters, lock...
        self.records = records

    def emit(self, record):
        self.records.append(record.getMessage())


seen = []
log = logging.getLogger("demo")
log.addHandler(ListHandler(seen))
log.warning("disk almost full")
print(seen)   # ['disk almost full']` },
      whyAsked: 'Very common real-world bug when extending library classes.',
      mistakes: ['Setting the missing attribute manually instead of calling super().__init__', 'Not passing the parent\'s required arguments'],
      followUps: ['When might you deliberately not call super().__init__?', 'Why is super() preferred over logging.Handler.__init__(self)?'],
      modelAnswer: 'Defining __init__ in the subclass completely replaces the base class\'s initialiser, and Python doesn\'t call the parent\'s automatically. The base class normally sets up state like level, filters and a lock there, so when other base-class methods later read self.level, it doesn\'t exist. The fix is to call super().__init__() first in the subclass\'s __init__, passing whatever the parent needs, and then store the webhook. I wouldn\'t patch in the missing attributes by hand, because I\'d be duplicating internals that can change between versions.',
    },
    {
      id: 'inheritance-isinstance-vs-type',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `isinstance(x, Account)` with `type(x) is Account`. Which should you use, and is there a gotcha with `bool`?',
      answer: 'isinstance respects inheritance (subclasses pass) and accepts a tuple of types; type(x) is C matches only the exact class. Prefer isinstance so subclasses work wherever the parent does. Gotcha: bool is a subclass of int, so isinstance(True, int) is True — exclude bool explicitly when it matters.',
      explanation: py`Exact type checks break the promise that a subclass can stand in for its parent. The rare legitimate use of \`type(x) is C\` is when you really must reject subclasses (e.g. serialisation of exact types). Often the best check is none at all: call the method and rely on duck typing, or use an ABC/Protocol.`,
      code: { lang: 'python', code: py`def is_count(value):
    return isinstance(value, int) and not isinstance(value, bool)


print(isinstance(True, int), is_count(True), is_count(3))   # True False True` },
      whyAsked: 'Shows awareness of substitutability and a classic Python gotcha.',
      mistakes: ['Using type(x) == Parent and breaking subclasses', 'Not knowing bool subclasses int', 'Over-using type checks instead of duck typing'],
      followUps: ['How do ABCs change what isinstance returns?', 'What does isinstance(x, int | str) do? (3.10+)'],
      modelAnswer: 'isinstance checks whether the object\'s class is the given class or any subclass of it, and it accepts a tuple of classes. type(x) is Account only matches that exact class, so a SavingsAccount would be rejected even though it is an Account. I almost always use isinstance, because subclasses should work wherever the parent does. The gotcha is that bool is a subclass of int, so isinstance(True, int) is True; when booleans must be excluded I add an explicit "and not isinstance(x, bool)". And often the cleanest code skips the check and relies on duck typing.',
    },
    {
      id: 'inheritance-responses',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Given `Response(status, body)` with `is_ok()` and `render()`, write `JSONResponse(data, status=200)` — body is `json.dumps(data)` and its class attribute `content_type` is `"application/json"` — and `NotFound(path)` — status 404, body `"Not found: <path>"`. Both must reuse `Response.__init__` via `super()`.',
      answer: 'JSONResponse overrides the content_type class attribute and calls super().__init__(status, json.dumps(data)); NotFound calls super().__init__(404, f"Not found: {path}"). is_ok and render are inherited.',
      explanation: py`Subclasses can override class attributes as well as methods: lookup finds \`JSONResponse.content_type\` before \`Response.content_type\`. Each subclass converts its own constructor arguments into what the parent needs, then delegates. No inherited method has to change.`,
      starter: { files: { 'main.py': py`import json


class Response:
    content_type = "text/plain"

    def __init__(self, status, body):
        self.status = status
        self.body = body

    def is_ok(self):
        return 200 <= self.status < 300

    def render(self):
        return f"{self.status} {self.content_type}\n{self.body}"


class JSONResponse(Response):
    pass  # TODO


class NotFound(Response):
    pass  # TODO


print(Response(200, "hi").render())
` } },
      tests: [
        { name: 'JSONResponse serialises data with status 200', code: py`r = JSONResponse({"id": 7})
assert (r.status, r.body) == (200, '{"id": 7}')
assert r.content_type == "application/json"
assert r.is_ok()` },
        { name: 'JSONResponse accepts a custom status', code: py`assert JSONResponse([], status=201).status == 201` },
        { name: 'NotFound builds a 404', code: py`r = NotFound("/users/9")
assert (r.status, r.body) == (404, "Not found: /users/9")
assert not r.is_ok()
assert r.render() == "404 text/plain\nNot found: /users/9"` },
        { name: 'both are Responses and the base is unchanged', code: py`assert isinstance(JSONResponse({}), Response) and isinstance(NotFound("/"), Response)
assert Response.content_type == "text/plain"` },
      ],
      solution: { files: { 'main.py': py`import json


class Response:
    content_type = "text/plain"

    def __init__(self, status, body):
        self.status = status
        self.body = body

    def is_ok(self):
        return 200 <= self.status < 300

    def render(self):
        return f"{self.status} {self.content_type}\n{self.body}"


class JSONResponse(Response):
    content_type = "application/json"

    def __init__(self, data, status=200):
        super().__init__(status, json.dumps(data))


class NotFound(Response):
    def __init__(self, path):
        super().__init__(404, f"Not found: {path}")


print(Response(200, "hi").render())
print(JSONResponse({"id": 7}).render())
print(NotFound("/users/9").render())
` } },
      hints: ['A class attribute in the subclass overrides the parent\'s, just like a method.', 'Each __init__ converts its own arguments and calls super().__init__(status, body).'],
      whyAsked: 'Mirrors how web frameworks structure response classes; tests overriding both data and constructors cleanly.',
      mistakes: ['Setting self.content_type in __init__ instead of overriding the class attribute', 'Re-implementing is_ok or render', 'Forgetting to pass status through'],
      followUps: ['How would you add a RedirectResponse with a Location header?', 'Would composition (a Response holding a serializer) be better here?'],
      modelAnswer: 'JSONResponse overrides the content_type class attribute with "application/json" and defines __init__(data, status=200), which turns the data into a body with json.dumps and passes status and body to super().__init__. NotFound takes a path and calls super().__init__(404, f"Not found: {path}"). Neither needs to touch is_ok or render — they\'re inherited and pick up the overridden content_type through normal attribute lookup. Each subclass just adapts its own constructor arguments to what the parent expects.',
    },
    {
      id: 'inheritance-square-rectangle',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A codebase has `class Square(Rectangle)` where `Rectangle` has settable `width` and `height`. `Square` overrides the setters to keep both sides equal. Tests for code that resizes rectangles now fail when given squares. What principle is broken, and how would you redesign it?',
      answer: 'The Liskov substitution principle: a Square can\'t honour Rectangle\'s promise that width and height change independently, so code written for Rectangle breaks. Redesign: make shapes immutable (resizing returns a new object), or don\'t relate them by inheritance — separate classes sharing a common interface (area()), or composition.',
      explanation: py`"A square is a rectangle" is true in geometry but false for *mutable* objects whose interface includes independent setters. Subclasses must accept everything the parent accepts and keep its guarantees. Options: (1) immutable value objects — \`rect.with_width(5)\` returns a new \`Rectangle\`, and a square is just a rectangle whose sides happen to match; (2) a shared abstract \`Shape\` with \`area()\` and two independent classes ([abstract base classes](lesson:abstract-base-classes)); (3) composition. See [SOLID](lesson:solid).`,
      code: { lang: 'python', code: py`class Rectangle:
    def __init__(self, width, height):
        self.width, self.height = width, height

    def area(self):
        return self.width * self.height


def stretch(rect):
    rect.width = rect.width * 2          # assumes height stays the same
    return rect.area()


class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)

    def __setattr__(self, name, value):  # keep the sides equal
        object.__setattr__(self, "width", value)
        object.__setattr__(self, "height", value)


print(stretch(Rectangle(2, 3)), stretch(Square(2)))   # 12 16 — the square broke stretch's promise` },
      whyAsked: 'The classic test of whether a candidate knows when inheritance is wrong, beyond syntax.',
      mistakes: ['Saying "a square is a rectangle, so inheritance is correct"', 'Patching stretch() with isinstance(rect, Square) checks', 'Not offering a concrete alternative'],
      followUps: ['How do immutable value objects avoid the problem?', 'How would a Protocol or ABC express the shared interface?', 'Can you give a real-world example of an LSP violation you have seen?'],
      modelAnswer: 'This breaks the Liskov substitution principle: code written against Rectangle assumes setting width leaves height alone, and Square can\'t keep that promise, so it isn\'t a safe substitute even though geometrically a square is a rectangle. Adding isinstance checks to every caller would just spread the problem. I\'d redesign either by making shapes immutable — resizing returns a new shape, so the conflict disappears — or by not relating them through inheritance at all: two classes that both implement an area() interface, expressed with an ABC or a Protocol, or composition. The rule I apply is that inheritance must preserve behaviour, not just a sentence in English.',
    },
    {
      id: 'inheritance-how-super-works',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What does `super()` actually return, and why is it better than calling `ParentClass.method(self)` directly?',
      answer: 'super() returns a proxy that looks up attributes in type(self).__mro__ starting after the class where the method was defined (zero-argument form uses the compiler-provided __class__ cell and the first argument). It avoids hard-coding the parent, keeps working if the base changes, and cooperates correctly under multiple inheritance, where "next in the MRO" may not be the direct parent.',
      explanation: py`\`super()\` ≡ \`super(__class__, self)\`. The proxy binds what it finds to \`self\`, so \`super().__init__(x)\` needs no \`self\`. Calling \`Parent.__init__(self, x)\` works for simple single inheritance but couples you to one parent name and can run a shared ancestor twice in diamond hierarchies. Details in [multiple inheritance & the MRO](lesson:multiple-inheritance-mro).`,
      code: { lang: 'python', code: py`class Base:
    def hello(self):
        return "Base"


class Child(Base):
    def hello(self):
        return "Child+" + super().hello()


print(Child().hello())                         # Child+Base
print(super(Child, Child()).hello())           # Base — the explicit two-argument form` },
      whyAsked: 'Separates people who use super() by rote from those who understand MRO-based delegation.',
      mistakes: ['Saying super() always means "the parent class"', 'Passing self explicitly: super().__init__(self, ...)', 'Thinking super() creates a parent object'],
      followUps: ['What is cooperative multiple inheritance?', 'Why do mixins usually accept **kwargs and pass them to super()?', 'Why does super() fail inside a staticmethod?'],
      modelAnswer: 'super() returns a proxy object. In a method of class C, the zero-argument form is shorthand for super(C, self), using a hidden __class__ reference the compiler adds, and the proxy searches type(self).__mro__ starting after C, binding whatever it finds to self. In single inheritance that\'s the parent, so super().__init__(x) runs the parent\'s initialiser without passing self. It\'s better than Parent.__init__(self, x) because I don\'t hard-code the parent\'s name, and more importantly it cooperates with multiple inheritance: the next class in the MRO might be a sibling, and super() makes sure every class in a diamond runs exactly once.',
    },
  ],

  takeaways: [
    'class Child(Parent) creates a subclass that inherits everything from Parent — an "is-a" relationship.',
    'A subclass can inherit methods as-is, add new ones, override them (same name replaces) or extend them with super().',
    'Overriding __init__ replaces the parent\'s; call super().__init__(...) so the parent\'s setup still runs.',
    'Lookup goes instance → class → parent → … → object (the MRO), so parent methods calling self.x() use the subclass\'s overrides.',
    'isinstance() and issubclass() respect inheritance; type(x) is C is exact. Every class inherits from object.',
    'Keep overrides compatible with the parent so subclasses work anywhere the parent does.',
    'Use inheritance for real is-a relationships and framework hooks; use composition for has-a.',
  ],
}
