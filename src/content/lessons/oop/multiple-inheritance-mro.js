// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ARTICLE = py`import json


class Model:
    def __init__(self, *, record_id, **kwargs):
        super().__init__(**kwargs)    # ends at object.__init__(), which accepts nothing extra
        self.record_id = record_id

    def describe(self):
        return [f"#{self.record_id}"]


class Timestamped(Model):
    def __init__(self, *, created="2026-01-01", **kwargs):
        super().__init__(**kwargs)
        self.created = created

    def describe(self):
        return super().describe() + [f"created={self.created}"]


class Tagged(Model):
    def __init__(self, *, tags=(), **kwargs):
        super().__init__(**kwargs)
        self.tags = list(tags)

    def describe(self):
        return super().describe() + [f"tags={','.join(self.tags) or '-'}"]


class JsonMixin:
    """Stateless helper: adds behaviour, never data."""

    def to_json(self):
        return json.dumps(vars(self), sort_keys=True)


class Article(JsonMixin, Timestamped, Tagged):
    def __init__(self, *, title, **kwargs):
        super().__init__(**kwargs)
        self.title = title

    def describe(self):
        return [f"Article {self.title!r}"] + super().describe()


print([cls.__name__ for cls in Article.__mro__])
post = Article(record_id=7, title="MRO explained", tags=["python", "oop"])
print(" | ".join(post.describe()))
print(post.to_json())
`

export default {
  id: 'multiple-inheritance-mro',
  title: 'Multiple inheritance & the MRO',
  summary: 'A class can inherit from several bases; Python orders them into one method resolution order (C3), and super() walks that order cooperatively — the basis of mixins.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['inheritance', 'composition', 'abstract-base-classes'],
  related: ['polymorphism-and-duck-typing', 'methods-and-attributes', 'function-arguments', 'operator-overloading', 'special-methods', 'attribute-access', 'descriptors', 'metaclasses', 'dataclasses', 'design-patterns', 'protocols', 'custom-exceptions', 'clean-architecture'],
  tags: ['multiple inheritance', 'MRO', 'method resolution order', 'C3 linearization', 'diamond problem', 'super()', 'cooperative inheritance', '**kwargs', 'mixin', '__mro__', 'mro()', 'consistent method resolution order', 'TypeError', 'next in line'],
  apis: [
    { name: 'cls.__mro__', summary: 'The tuple of classes Python searches, in order, when looking up attributes on instances of cls.' },
    { name: 'cls.mro()', summary: 'Returns the MRO as a list. Called once at class creation to compute __mro__ (metaclasses can override it).' },
    { name: 'super()', summary: 'A proxy that finds the next class after the current one in type(self).__mro__ — not necessarily the parent.' },
    { name: 'super(cls, obj)', summary: 'The explicit two-argument form: search obj\'s MRO starting after cls. Zero-argument super() fills both in for you.' },
    { name: 'object.__init__(self)', summary: 'The end of every cooperative __init__ chain. It rejects leftover arguments with TypeError.' },
  ],
  docs: [
    { label: 'Python tutorial — multiple inheritance', url: 'https://docs.python.org/3/tutorial/classes.html#multiple-inheritance' },
    { label: 'The Python 2.3 Method Resolution Order (the C3 algorithm, still used today)', url: 'https://docs.python.org/3/howto/mro.html' },
    { label: 'Built-in functions — super()', url: 'https://docs.python.org/3/library/functions.html#super' },
    { label: 'Data model — customizing class creation (__init_subclass__, MRO entries)', url: 'https://docs.python.org/3/reference/datamodel.html#customizing-class-creation' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Multiple inheritance** means a class lists more than one base class: \`class Article(Timestamped, Tagged):\`. The new class inherits from all of them. That raises an obvious question: if two bases both define \`describe()\`, *which one runs*?`,
    py`Python answers with the **method resolution order** (MRO): a single, straight line of classes, computed once when the class is created and stored in \`Article.__mro__\`. Every attribute lookup on an instance walks that line from left to right and stops at the first class that has the name.`,
    { code: py`class Animal: pass
class Swimmer(Animal): pass
class Flyer(Animal): pass
class Duck(Swimmer, Flyer): pass

print([cls.__name__ for cls in Duck.__mro__])
# ['Duck', 'Swimmer', 'Flyer', 'Animal', 'object']`, lang: 'python', title: 'the MRO is one ordered list' },
    py`The ordering rule is called **C3 linearization**. It guarantees that a class comes before its parents, that bases keep the left-to-right order you wrote, and that a shared ancestor like \`Animal\` appears **once**, after everyone who inherits from it. And \`super()\` turns out to mean "the **next class in this line**" — which is what makes *cooperative* multiple inheritance and **mixins** work. This lesson builds on [inheritance & super()](lesson:inheritance) and [composition](lesson:composition).`,
  ],
  why: [
    py`**Mixins.** Small classes that add one capability — \`to_json()\`, ordering, logging — can be combined into many unrelated classes: \`class Article(JsonMixin, Model)\`. The standard library does this (\`socketserver.ThreadingMixIn\`, the mixin methods of [\`collections.abc\`](lesson:abstract-base-classes)), and so do big frameworks.`,
    py`**Reading real code.** You'll meet multiple inheritance in frameworks whether you write it or not. Knowing the MRO lets you predict which method runs, why an \`__init__\` was skipped or ran twice, and why Python refused to create a class.`,
    py`**Knowing when not to.** Understanding the machinery also shows its costs: hidden coupling between classes that never mention each other. Often [composition](lesson:composition) is the clearer design, and you'll be able to explain why.`,
  ],
  eli15: [
    py`Imagine every class you inherit from lines up in **one queue**. When you ask an object for a method, Python walks down the queue and the first class that has it answers.`,
    py`The queue follows three fair rules: you're first, your parents come in the order you listed them, and a grandparent you share with someone only joins **after** all of its children. That's why, with a diamond (two parents who share a grandparent), the grandparent appears just once, at the end.`,
    py`\`super()\` means "pass this to **the next person in the queue**". Not "my mum" or "my dad" — whoever is next in line *for this particular object*. If everyone remembers to pass it on, every class gets its turn exactly once.`,
  ],
  analogy: {
    title: 'A relay race with a fixed running order',
    body: [
      py`Before the race starts, the coach writes the **running order** on the board: Article, Timestamped, Tagged, Model. It's decided once and never changes during the race (that's the MRO).`,
      py`Each runner does their leg and hands the baton to **whoever is next on the board** — even if they've never met that runner. That's \`super()\`. If one runner forgets to pass the baton, everyone after them never runs; if a runner sprints to someone out of order ("I'll just pass to Model directly"), some legs get run twice and others skipped.`,
    ],
    mapping: [
      ['the running order on the board', 'cls.__mro__, computed once by C3'],
      ['handing the baton to the next runner', 'super().method() — next class in the MRO'],
      ['a runner who doesn\'t know who runs after them', 'Timestamped calling super() and reaching Tagged'],
      ['forgetting to pass the baton', 'a method without super(): later classes never run'],
      ['running to a specific teammate', 'Base.__init__(self) called by name: skips or repeats legs'],
      ['an impossible running order', 'TypeError: Cannot create a consistent method resolution order'],
    ],
  },
  visual: {
    type: 'class-lookup',
    title: 'The diamond: one shared base, visited once',
    props: { preset: 'diamond' },
    alt: 'An interactive diagram of a diamond-shaped hierarchy: one base class at the top, two classes that each inherit from it, and a fourth class at the bottom that inherits from both. Looking up an attribute on an instance of the bottom class checks the instance\'s own __dict__ first, then the bottom class, then the left parent, then the right parent, and only then the shared base and object — the shared base is visited once, after both of its subclasses.',
    caption: py`Step through the lookup. Notice that the shared base is **not** checked right after the left parent (that was Python 2's old depth-first order). C3 waits until every class that inherits from it has been checked, so an override in the right parent still wins over the shared base.`,
  },
  syntax: [
    py`#### 1. Listing several bases`,
    { code: py`class Swimmer:
    def move(self):
        return "swims"


class Flyer:
    def move(self):
        return "flies"


class Duck(Swimmer, Flyer):     # order matters: Swimmer is searched first
    pass


print(Duck().move())            # swims
print(Duck.__mro__)             # (Duck, Swimmer, Flyer, object) as class objects`, lang: 'python', title: 'left to right' },
    py`#### 2. Inspecting the MRO`,
    { code: py`print([cls.__name__ for cls in Duck.__mro__])   # readable names
print(Duck.mro())                                  # same order, as a list
help(Duck)                                         # also lists "Method resolution order"`, lang: 'python', title: 'three ways to look', static: true },
    py`#### 3. The diamond`,
    { code: py`class Model:
    def save(self):
        return "Model.save"


class Timestamped(Model):
    def save(self):
        return "Timestamped -> " + super().save()


class Tagged(Model):
    def save(self):
        return "Tagged -> " + super().save()


class Article(Timestamped, Tagged):
    def save(self):
        return "Article -> " + super().save()


print(Article().save())
# Article -> Timestamped -> Tagged -> Model.save
print([c.__name__ for c in Article.__mro__])
# ['Article', 'Timestamped', 'Tagged', 'Model', 'object']`, lang: 'python', title: 'super() inside Timestamped reaches Tagged' },
    py`Read that output slowly: \`Timestamped\` inherits only from \`Model\`, yet its \`super().save()\` called **\`Tagged.save\`**. \`super()\` doesn't mean "my parent"; it means "the class after me in \`type(self).__mro__\`". For a plain \`Timestamped()\` object, the very same line *would* reach \`Model\`.`,
    py`#### 4. Cooperative \`__init__\`: the rules`,
    { code: py`class Model:
    def __init__(self, *, record_id, **kwargs):
        super().__init__(**kwargs)          # 3. pass on whatever isn't yours
        self.record_id = record_id


class Tagged(Model):
    def __init__(self, *, tags=(), **kwargs):   # 1. keyword-only own args
        super().__init__(**kwargs)              # 2. always call super(), once
        self.tags = list(tags)


tagged = Tagged(record_id=1, tags=["news"])`, lang: 'python', title: 'take what you need, pass on the rest' },
    py`1. Accept your own parameters as **keyword-only** (after \`*\`) plus \`**kwargs\` (see [function arguments](lesson:function-arguments)) — positions don't line up when the "next class" changes.
2. Call \`super().__init__(**kwargs)\` **exactly once**, in **every** class — never \`Base.__init__(self, ...)\` by name.
3. The chain ends at \`object.__init__()\`, which accepts no extra arguments. A misspelt keyword therefore fails loudly: \`TypeError: object.__init__() takes exactly one argument (the instance to initialize)\`.`,
    py`#### 5. Mixins`,
    { code: py`import json


class JsonMixin:
    """Adds to_json(). Needs: nothing but instance attributes."""

    def to_json(self):
        return json.dumps(vars(self), sort_keys=True)


class Product:
    def __init__(self, name, price):
        self.name = name
        self.price = price


class ApiProduct(JsonMixin, Product):     # mixins on the LEFT, the real base last
    pass


print(ApiProduct("mug", 8.5).to_json())   # {"name": "mug", "price": 8.5}`, lang: 'python', title: 'a mixin adds one capability' },
    py`A **mixin** is a small class meant to be *mixed into* others, not used alone. Good mixins are **focused** (one capability), **stateless** (no \`__init__\`, no attributes of their own, or a fully cooperative \`__init__\`), **named \`…Mixin\`**, and listed **before** the main base class so their methods take priority and their \`super()\` calls reach it.`,
    py`#### 6. When the MRO is impossible`,
    { code: py`class Animal: pass
class Pet(Animal): pass

class Dog(Animal, Pet):    # "Animal before Pet" AND "Pet before Animal"?
    pass
# TypeError: Cannot create a consistent method resolution order (MRO) for bases Animal, Pet`, lang: 'python', title: 'C3 refuses contradictory orders', static: true },
    py`You asked for \`Animal\` before \`Pet\` (the order of bases), but \`Pet\` is a subclass of \`Animal\`, so it must come first. No order satisfies both, so Python refuses to create the class. Fix: \`class Dog(Pet):\` — \`Animal\` is already inherited through \`Pet\`.`,
  ],
  walkthrough: {
    title: 'Reading the article model',
    lang: 'python',
    code: ARTICLE,
    intro: py`This is the playground program. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [4, 10], text: py`\`Model\` is the shared base. Its \`__init__\` takes \`record_id\` and passes any *other* keyword arguments on with \`super().__init__(**kwargs)\`; for \`Model\` the next class is \`object\`, which accepts none, so leftovers become an error.` },
      { lines: [13, 19], text: py`\`Timestamped\` follows the cooperative recipe: keyword-only \`created\`, \`**kwargs\` for everything else, \`super()\` first. Its \`describe()\` extends whatever the next class returns.` },
      { lines: [22, 28], text: py`\`Tagged\` is a second subclass of \`Model\` — together with \`Timestamped\` it forms a **diamond** below \`Article\`.` },
      { lines: [31, 35], text: py`\`JsonMixin\` has no \`__init__\` and no data: it only adds \`to_json()\`, built on \`vars(self)\` (the instance's attribute dict). Stateless mixins can be dropped into any class safely.` },
      { lines: [38, 44], text: py`The bases are listed mixin-first. \`Article.__init__\` handles \`title\` and forwards \`record_id\` and \`tags\` up the chain; \`describe()\` puts its own line first, then everything the rest of the MRO contributes.` },
      { lines: [47, 47], text: py`The computed MRO: \`Article, JsonMixin, Timestamped, Tagged, Model, object\`. C3 kept your left-to-right order and put \`Model\` after **both** of its subclasses.` },
      { lines: [48, 50], text: py`One \`Article(...)\` call ran every \`__init__\` once, \`Model\`'s included. In \`describe()\`, \`Timestamped\`'s \`super()\` reached \`Tagged\`, so the parts arrive as \`#7 | tags=… | created=…\` — the reverse of the MRO, because each class appends *after* calling \`super()\`.` },
    ],
  },
  playground: {
    title: 'A cooperative diamond with a mixin',
    objective: 'Add a mixin and a new cooperative class, reorder the bases, and provoke the MRO error — predicting each result first.',
    files: { 'main.py': ARTICLE },
    expected: py`\`\`\`text
['Article', 'JsonMixin', 'Timestamped', 'Tagged', 'Model', 'object']
Article 'MRO explained' | #7 | tags=python,oop | created=2026-01-01
{"created": "2026-01-01", "record_id": 7, "tags": ["python", "oop"], "title": "MRO explained"}
\`\`\``,
    experiments: [
      {
        id: 'repr-mixin',
        task: py`Write a stateless \`ReprMixin\` whose \`__repr__\` returns \`ClassName(key=value, ...)\` built from \`vars(self)\` (use \`!r\` for the values), add it to \`Article\`'s bases next to \`JsonMixin\`, and \`print(repr(post))\` at the end.`,
        hint: py`\`def __repr__(self): fields = ", ".join(f"{k}={v!r}" for k, v in vars(self).items()); return f"{type(self).__name__}({fields})"\` — then \`class Article(JsonMixin, ReprMixin, Timestamped, Tagged):\`.`,
        tests: [
          { name: 'ReprMixin is in the MRO', code: py`assert "ReprMixin" in [c.__name__ for c in Article.__mro__]` },
          { name: 'repr shows the class and fields', code: py`text = repr(post)
assert text.startswith("Article(") and "record_id=7" in text and "title='MRO explained'" in text` },
          { name: 'ReprMixin is stateless', code: py`assert "__init__" not in ReprMixin.__dict__` },
        ],
        explain: py`Because the mixin only *reads* \`vars(self)\` and \`type(self)\`, it works on any class without knowing anything about it. Using \`type(self).__name__\` (not a hard-coded name) keeps it correct for subclasses too.`,
      },
      {
        id: 'authored',
        task: py`Add a cooperative class \`Authored(Model)\` with a keyword-only \`author="anonymous"\` that appends \`author=...\` in \`describe()\`. Put it in \`Article\`'s bases **between** \`Timestamped\` and \`Tagged\`, and pass \`author="Ada"\` when creating \`post\`.`,
        hint: py`Copy \`Tagged\` as a template: \`def __init__(self, *, author="anonymous", **kwargs): super().__init__(**kwargs); self.author = author\`.`,
        tests: [
          { name: 'the MRO includes Authored in the right place', code: py`assert [c.__name__ for c in Article.__mro__] == ["Article", "JsonMixin", "Timestamped", "Authored", "Tagged", "Model", "object"]` },
          { name: 'post has an author and describes it', code: py`assert post.author == "Ada"
assert "author=Ada" in output` },
        ],
        explain: py`No other class changed. \`Timestamped\`'s \`super()\` now reaches \`Authored\`, whose \`super()\` reaches \`Tagged\`. Each class consumed its own keyword and forwarded the rest. That's the payoff of following the cooperative rules everywhere — and the cost: every class must follow them, or the chain breaks.`,
      },
      {
        id: 'swap-order',
        task: py`Predict first: swap \`Timestamped\` and \`Tagged\` in \`Article\`'s bases. How do the first two output lines change? Run it to check.`,
        hint: py`The MRO keeps your left-to-right order of bases, and \`describe()\` collects parts in reverse MRO order.`,
        tests: [
          { name: 'Tagged now comes before Timestamped', code: py`names = [c.__name__ for c in Article.__mro__]
assert names.index("Tagged") < names.index("Timestamped")` },
          { name: 'describe() order changed', code: py`assert "#7 | created=2026-01-01 | tags=python,oop" in output` },
        ],
        explain: py`Base order is a real decision: it sets the MRO, which decides which override wins and the order cooperative methods run in. That's also why mixins go on the left — so they come before the class they modify.`,
      },
      {
        id: 'mro-error',
        task: py`Provoke the MRO error safely. At the end, add a \`try\` block that defines \`class Draft(Model, Tagged): pass\` and, in \`except TypeError as error:\`, prints the error.`,
        hint: py`Class statements can go inside \`try:\` like any other statement. Then \`print(error)\` in the \`except\` block.`,
        tests: [{ name: 'the consistent-MRO error was printed', code: py`assert "Cannot create a consistent method resolution order" in output` }],
        explain: py`You asked for \`Model\` before \`Tagged\`, but \`Tagged\` is a subclass of \`Model\` and must precede it. C3 can't satisfy both, so the *class statement itself* fails — Python never builds a class with an ambiguous lookup order. \`class Draft(Tagged):\` is the fix.`,
      },
    ],
  },
  animation: {
    type: 'class-lookup',
    title: 'Cooperative super(): passing the call along the MRO',
    props: { preset: 'super' },
    alt: 'An animated diagram of cooperative super() calls in a multiple-inheritance hierarchy. Starting from the most derived class, each method does its own work and calls super(), which moves the call to the next class in the instance\'s MRO — sometimes a sibling class rather than the class\'s own parent — until the chain reaches the shared base and finally object; the results then flow back in reverse order.',
    after: py`The key move: the arrow out of a class's \`super()\` call is decided by the **instance's** MRO, not by that class's own bases. The same method can hand off to different classes depending on which class the object was created from.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every class stores its MRO in \`__mro__\`, computed once when the \`class\` statement runs. When you write \`post.describe\`, Python checks the instance's own attributes first, then each class in \`type(post).__mro__\`, in order, and uses the first match. With single inheritance the MRO is just "me, my parent, its parent… object" — multiple inheritance only makes the list more interesting. (Properties and other descriptors add a twist to "instance first" — see [attribute access](lesson:attribute-access) and [descriptors](lesson:descriptors).)`,
      py`\`super()\` inside a method of class \`X\` means: "take \`type(self).__mro__\`, find \`X\` in it, and continue searching **after** \`X\`". It's shorthand for \`super(X, self)\`. Because it starts from the *instance's* MRO, the same \`super()\` line can reach different classes for different objects.`,
      { code: py`class Model:
    def who(self):
        return "Model"


class Timestamped(Model):
    def who(self):
        return "Timestamped>" + super().who()


class Tagged(Model):
    def who(self):
        return "Tagged>" + super().who()


class Article(Timestamped, Tagged):
    pass


print(Timestamped().who())   # Timestamped>Model
print(Article().who())       # Timestamped>Tagged>Model — same line, different next class`, lang: 'python', title: 'super() depends on the object' },
    ],
    technical: [
      py`#### The C3 algorithm`,
      py`For \`class C(B1, B2, …, Bn)\`, the linearization L[C] is:`,
      py`> L[C] = C + merge(L[B1], L[B2], …, L[Bn], [B1, B2, …, Bn])`,
      py`**merge** repeatedly takes the first list's head — if that class does **not** appear in the *tail* (anything after the first element) of any list — appends it to the result, and removes it from the front of all lists. If the head is blocked, try the next list's head. If every head is blocked, there is no consistent order → \`TypeError\`.`,
      py`Worked example, the diamond \`Article(Timestamped, Tagged)\` with both inheriting \`Model\` (O = object):

| step | lists to merge | pick | why |
|---|---|---|---|
| 1 | [Timestamped, Model, O] · [Tagged, Model, O] · [Timestamped, Tagged] | Timestamped | not in any tail |
| 2 | [Model, O] · [Tagged, Model, O] · [Tagged] | Tagged | Model is blocked (in the tail of the 2nd list) |
| 3 | [Model, O] · [Model, O] | Model | free now |
| 4 | [O] · [O] | O | done |

Result: **Article, Timestamped, Tagged, Model, object**.`,
      py`C3 guarantees three properties: **children before parents**; **local precedence order** (the bases you list keep their left-to-right order); and **monotonicity** (if \`A\` comes before \`B\` in a class's MRO, it does so in every subclass's MRO too). The algorithm was introduced in Python 2.3 for new-style classes and is the only MRO in Python 3.`,
      py`#### When C3 says no`,
      { code: py`class A: pass
class B: pass
class X(A, B): pass       # says: A before B
class Y(B, A): pass       # says: B before A
# class Z(X, Y): pass     -> TypeError: Cannot create a consistent method resolution order (MRO) for bases A, B`, lang: 'python', title: 'contradictory constraints' },
      py`The error is raised by the \`class\` statement, so the problem is caught at import time — Python never builds a class whose lookup order is ambiguous.`,
      py`#### How zero-argument super() knows where it is`,
      py`When a method body uses \`super\` (or \`__class__\`), the compiler gives the function a hidden reference to the class it's defined in. At runtime \`super()\` combines that class with the method's first argument (\`self\`, or \`cls\` in a classmethod) — exactly \`super(Timestamped, self)\`. That's why zero-argument \`super()\` only works inside a method defined in a class body, not in a function attached later.`,
      py`\`super()\` returns a **proxy** that only customises *explicit attribute lookup*. Implicit special-method syntax doesn't go through it: \`super()[0]\` raises \`TypeError: 'super' object is not subscriptable\`; write \`super().__getitem__(0)\` instead.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores the MRO as a tuple on the type object and keeps a cache of attribute lookups per type, so a long MRO isn't re-scanned on every method call; the cache is invalidated when a class in the hierarchy is modified. Other implementations optimise lookups differently — the *order* is the language guarantee, the caching is not.` },
    ],
    production: [
      py`#### Mixins done right`,
      py`- **One capability per mixin**, named for it: \`JsonMixin\`, \`ComparableMixin\`, \`LoggingMixin\`.
- **Stateless**: no \`__init__\`, no attributes of its own. If a mixin truly needs setup, give it a fully cooperative \`__init__(self, *, option=…, **kwargs)\`.
- **State its requirements** in the docstring ("needs a \`sort_key()\` method"), and consider an [ABC](lesson:abstract-base-classes) or [Protocol](lesson:protocols) for them.
- **List mixins first** and the real base class last: \`class OrderView(LoginRequiredMixin, AuditMixin, View)\`. A mixin listed after the base is searched after it, so the base's methods shadow the mixin's.
- **Call \`super()\` in overridden methods** so other mixins and the base still run.`,
      py`#### Make the whole hierarchy cooperative — or don't use super() at all`,
      py`Mixing styles is where the bugs live. If one class calls \`Base.__init__(self)\` by name while others use \`super()\`, some \`__init__\`s run twice and others never run. Within one hierarchy, use \`super()\` everywhere, with keyword-only arguments and \`**kwargs\`, and keep method signatures compatible along the chain.`,
      py`#### Integrating a class that won't cooperate`,
      py`Third-party classes sometimes don't call \`super()\` or take positional arguments. Wrap them in a small adapter class that *does* cooperate, or — usually better — hold an instance of them instead of inheriting ([composition](lesson:composition)).`,
      py`#### Prefer shallow and boring`,
      py`Multiple inheritance couples classes that never mention each other: \`Timestamped\`'s behaviour now depends on whatever comes after it in some subclass's MRO. Keep hierarchies shallow, keep mixins tiny, and reach for composition, [Protocols](lesson:protocols), class decorators or \`__init_subclass__\` ([metaclasses](lesson:metaclasses)) when a mixin starts needing configuration or state. [Dataclasses](lesson:dataclasses) do support inheritance — fields are collected along the MRO — but diamonds of dataclasses with defaults get confusing fast.`,
    ],
  },
  mistakes: [
    {
      title: 'Calling base __init__ methods by name in a diamond',
      wrong: { code: py`class Device:
    def __init__(self, name):
        print("connecting", name)      # imagine opening a network connection
        self.name = name


class WiFi(Device):
    def __init__(self, name):
        Device.__init__(self, name)


class Bluetooth(Device):
    def __init__(self, name):
        Device.__init__(self, name)


class Speaker(WiFi, Bluetooth):
    def __init__(self, name):
        WiFi.__init__(self, name)
        Bluetooth.__init__(self, name)


Speaker("Echo")    # prints "connecting Echo" TWICE`, lang: 'python' },
      right: { code: py`class Device:
    def __init__(self, *, name, **kwargs):
        super().__init__(**kwargs)
        print("connecting", name)
        self.name = name


class WiFi(Device):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Bluetooth(Device):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class Speaker(WiFi, Bluetooth):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)


Speaker(name="Echo")   # "connecting Echo" once`, lang: 'python' },
      explanation: py`Explicit \`Base.__init__(self)\` calls follow the class's *own* parents, so both paths of the diamond reach \`Device\`. \`super()\` follows the instance's MRO, where \`Device\` appears exactly once.`,
    },
    {
      title: 'One class forgets super() and silently cuts the chain',
      wrong: { code: py`class Model:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.saved = False


class Timestamped(Model):
    def __init__(self, **kwargs):
        self.created = "today"          # no super() call!


class Tagged(Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.tags = []


class Article(Timestamped, Tagged):
    pass


post = Article()
print(post.created)
# print(post.tags)  -> AttributeError: 'Article' object has no attribute 'tags'`, lang: 'python' },
      right: { code: py`class Model:
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.saved = False


class Timestamped(Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)      # pass the baton
        self.created = "today"


class Tagged(Model):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.tags = []


class Article(Timestamped, Tagged):
    pass


post = Article()
print(post.created, post.tags, post.saved)`, lang: 'python' },
      explanation: py`For an \`Article\`, the class after \`Timestamped\` is \`Tagged\` — a class \`Timestamped\` has never heard of. Skipping \`super()\` skips it and \`Model\` too. The error shows up later, far from the cause.`,
    },
    {
      title: 'Positional arguments in a cooperative chain',
      wrong: { code: py`class Device:
    def __init__(self, name):
        self.name = name


class WiFi(Device):
    def __init__(self, name, ssid):
        super().__init__(name)
        self.ssid = ssid


class Bluetooth(Device):
    def __init__(self, name, pin):
        super().__init__(name)
        self.pin = pin


class Speaker(WiFi, Bluetooth):
    def __init__(self, name, ssid, pin):
        super().__init__(name, ssid)


Speaker("Echo", "home", "0000")
# TypeError: Bluetooth.__init__() missing 1 required positional argument: 'pin'`, lang: 'python', static: true },
      right: { code: py`class Device:
    def __init__(self, *, name, **kwargs):
        super().__init__(**kwargs)
        self.name = name


class WiFi(Device):
    def __init__(self, *, ssid, **kwargs):
        super().__init__(**kwargs)
        self.ssid = ssid


class Bluetooth(Device):
    def __init__(self, *, pin, **kwargs):
        super().__init__(**kwargs)
        self.pin = pin


class Speaker(WiFi, Bluetooth):
    pass


speaker = Speaker(name="Echo", ssid="home", pin="0000")
print(speaker.name, speaker.ssid, speaker.pin)`, lang: 'python' },
      explanation: py`\`WiFi\`'s \`super().__init__(name)\` was written expecting \`Device\`, but in a \`Speaker\` it reaches \`Bluetooth\`, which wants different arguments. Keyword-only arguments plus \`**kwargs\` let each class take what it needs, whoever comes next.`,
    },
    {
      title: 'Listing a mixin after the base class',
      wrong: { code: py`class Repository:
    def save(self, item):
        return f"saved {item}"


class AuditMixin:
    def save(self, item):
        return "audited, " + super().save(item)


class OrderRepository(Repository, AuditMixin):   # mixin last
    pass


print(OrderRepository().save("order-1"))   # saved order-1  (no audit!)`, lang: 'python' },
      right: { code: py`class Repository:
    def save(self, item):
        return f"saved {item}"


class AuditMixin:
    def save(self, item):
        return "audited, " + super().save(item)


class OrderRepository(AuditMixin, Repository):   # mixin first
    pass


print(OrderRepository().save("order-1"))   # audited, saved order-1`, lang: 'python' },
      explanation: py`The MRO follows the order you list bases. With the mixin last, \`Repository.save\` is found first and the mixin's override never runs. Mixins that wrap behaviour go on the left so their \`super()\` reaches the real implementation.`,
    },
    {
      title: 'Naming a base before its own subclass',
      wrong: { code: py`class Animal: pass
class Pet(Animal): pass
class Dog(Animal, Pet): pass
# TypeError: Cannot create a consistent method resolution order (MRO) for bases Animal, Pet`, lang: 'python', static: true },
      right: { code: py`class Animal: pass
class Pet(Animal): pass
class Dog(Pet): pass          # Animal comes along through Pet

print([c.__name__ for c in Dog.__mro__])   # ['Dog', 'Pet', 'Animal', 'object']`, lang: 'python' },
      explanation: py`Listing \`Animal\` first demands "Animal before Pet", while \`Pet(Animal)\` demands "Pet before Animal". Drop the redundant base, or list the subclass first.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Cannot create a consistent method resolution order (MRO) for bases Animal, Pet`,
      cause: py`The bases demand contradictory orders: a class listed before its own subclass, or two parents that order shared bases differently.`,
      fix: py`Print each base's \`__mro__\` and look for the contradiction. Remove redundant bases (a parent of another listed base) or reorder so subclasses come first.`,
    },
    {
      symptom: py`TypeError: object.__init__() takes exactly one argument (the instance to initialize)`,
      cause: py`A keyword argument reached the end of the cooperative chain unused — usually a typo (\`tag=\` instead of \`tags=\`) or a class that should have consumed it isn't in the MRO.`,
      fix: py`Check the spelling against each class's keyword-only parameters. This error is the chain doing its job: unknown arguments are never silently ignored.`,
    },
    {
      symptom: py`AttributeError: 'Article' object has no attribute 'tags'`,
      cause: py`A class earlier in the MRO didn't call \`super().__init__()\`, so later classes' \`__init__\` methods never ran.`,
      fix: py`Make sure every \`__init__\` in the hierarchy calls \`super().__init__(**kwargs)\` exactly once. Print the MRO to see which class comes before the missing one.`,
    },
    {
      symptom: py`TypeError: Bluetooth.__init__() missing 1 required positional argument: 'pin'`,
      cause: py`Positional arguments in a multiple-inheritance chain: \`super().__init__(name)\` was written for one parent but reached a sibling with a different signature.`,
      fix: py`Switch every \`__init__\` to keyword-only parameters plus \`**kwargs\`, and construct objects with keyword arguments.`,
    },
    {
      symptom: py`A base class's __init__ (or another method) runs twice — duplicate log lines, two connections, counters doubled.`,
      cause: py`Explicit \`Base.method(self)\` calls along both paths of a diamond.`,
      fix: py`Replace the explicit calls with \`super()\` everywhere in the hierarchy.`,
    },
    {
      symptom: py`A mixin's method is never called, even though the class inherits from it.`,
      cause: py`The mixin is listed after a base that defines the same method, so the base wins in the MRO.`,
      fix: py`Move the mixin to the left of the main base class, and make sure the mixin's method calls \`super()\`.`,
    },
  ],
  bestPractices: [
    'Print cls.__mro__ whenever you are unsure which method will run — never guess.',
    'Use super() in every class of a hierarchy, never Base.method(self) by name; mixing styles skips or repeats methods.',
    'Give cooperative __init__ methods keyword-only parameters plus **kwargs, and call super().__init__(**kwargs) exactly once.',
    'Keep mixins small, single-purpose and stateless; name them …Mixin and document what they require from the host class.',
    'List mixins first and the main base class last, so mixin overrides win and their super() calls reach the base.',
    'Keep hierarchies shallow; prefer composition when a "mixin" needs its own state or configuration.',
    'Wrap or compose non-cooperative third-party classes instead of dropping them into a cooperative hierarchy.',
  ],
  useCases: [
    'Mixins that add one capability to many classes: JSON/dict conversion, ordering, repr, auditing, caching.',
    'Framework extension points designed for mixing (class-based views with permission mixins, socketserver.ThreadingMixIn).',
    'Combining an interface (an ABC) with a concrete base class.',
    'Exception classes that belong to two families, e.g. class NotFoundError(AppError, KeyError).',
  ],
  whenToUse: {
    use: [
      'A small, stateless capability should be shared by unrelated classes (a mixin).',
      'A framework documents mixin classes as its extension mechanism.',
      'A class genuinely is two things at once and every class in the hierarchy cooperates via super().',
    ],
    avoid: [
      'You only want to reuse code from a class — compose it instead.',
      'The bases have their own state and conflicting __init__ signatures you cannot change.',
      'Behaviour should vary at runtime or be configured per instance — that is composition or a strategy object.',
    ],
  },
  comparison: {
    title: 'Mixin vs composition for adding a capability',
    headers: ['', 'Mixin (class Order(AuditMixin, Base))', 'Composition (self.auditor = Auditor())'],
    rows: [
      ['How it attaches', 'inherited methods, decided at class creation', 'an attribute, decided at object creation (or later)'],
      ['Access to the host', 'full: same self, can call any host method', 'only what the host passes in'],
      ['State', 'should have none', 'can hold its own configuration and state'],
      ['Swap at runtime / in tests', 'no — the class is fixed', 'yes — replace the attribute'],
      ['Order matters?', 'yes: position in the bases sets the MRO', 'no'],
      ['Good for', 'small, generic behaviours shared by many classes', 'collaborators with their own data or lifecycle'],
    ],
    note: py`A useful rule: if the "mixin" needs an \`__init__\` with options, it probably wants to be a collaborator object. See [composition](lesson:composition) and the decorator/strategy patterns in [design patterns](lesson:design-patterns). Multiple inheritance also shows up harmlessly in exception hierarchies — \`class NotFoundError(AppError, KeyError)\` — see [custom exceptions](lesson:custom-exceptions).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'multiple-inheritance-mro-q1',
      type: 'mcq',
      prompt: '`class B(A)`, `class C(A)`, `class D(B, C)`. What is `[c.__name__ for c in D.__mro__]`?',
      options: [
        { text: "['D', 'B', 'A', 'C', 'object']", why: 'That is the old depth-first order. C3 puts A only after every class that inherits from it, so C comes before A.' },
        "['D', 'B', 'C', 'A', 'object']",
        { text: "['D', 'C', 'B', 'A', 'object']", why: 'The bases keep the left-to-right order you wrote: B before C.' },
        { text: "['D', 'B', 'C', 'A']", why: 'Every MRO ends with object, the root of all classes.' },
      ],
      answer: 1,
      explanation: py`C3 keeps the local order (B before C) and puts the shared base A after both of its subclasses, then \`object\`.`,
    },
    {
      id: 'multiple-inheritance-mro-q2',
      type: 'output',
      prompt: 'Every `__init__` prints its name, then calls `super().__init__()`. What is printed?',
      code: py`class Base:
    def __init__(self):
        print("Base", end=" ")

class Left(Base):
    def __init__(self):
        print("Left", end=" ")
        super().__init__()

class Right(Base):
    def __init__(self):
        print("Right", end=" ")
        super().__init__()

class Child(Left, Right):
    def __init__(self):
        print("Child", end=" ")
        super().__init__()

Child()`,
      options: [
        { text: 'Child Left Base', why: 'For a Child instance, the class after Left in the MRO is Right, not Base. super() follows the instance\'s MRO.' },
        { text: 'Child Left Base Right Base', why: 'That happens with explicit Base.__init__(self) calls. With super(), Base appears once in the MRO and runs once.' },
        'Child Left Right Base',
        { text: 'Child Right Left Base', why: 'Bases are searched in the order they are listed: Left before Right.' },
      ],
      answer: 2,
      explanation: py`\`Child.__mro__\` is \`Child, Left, Right, Base, object\`. Each \`super().__init__()\` moves one step along that list, so every class runs exactly once — and \`Left\`'s \`super()\` reaches \`Right\`, its sibling.`,
    },
    {
      id: 'multiple-inheritance-mro-q3',
      type: 'output',
      prompt: 'An audit mixin wraps `save()`. What does this print?',
      code: py`class Base:
    def save(self):
        return "Base.save"

class AuditMixin:
    def save(self):
        return "audit + " + super().save()

class Order(Base, AuditMixin):
    pass

print(Order().save())`,
      options: [
        { text: 'audit + Base.save', why: 'That is the result with class Order(AuditMixin, Base). Here Base is listed first, so Base.save is found first.' },
        'Base.save',
        { text: 'AttributeError: \'super\' object has no attribute \'save\'', why: 'AuditMixin.save never runs here, so its super() call never happens.' },
        { text: 'TypeError: Cannot create a consistent method resolution order', why: 'Base and AuditMixin are unrelated, so any order is consistent.' },
      ],
      answer: 1,
      explanation: py`\`Order.__mro__\` is \`Order, Base, AuditMixin, object\`. \`Base.save\` is found first and doesn't call \`super()\`, so the mixin is never reached. Put mixins **before** the base class.`,
    },
    {
      id: 'multiple-inheritance-mro-q4',
      type: 'bug',
      prompt: 'Python refuses to run this file. Click the line that raises the error.',
      code: py`class Animal:
    def sound(self):
        return "..."

class Pet(Animal):
    def name_tag(self):
        return "has a name"

class Dog(Animal, Pet):
    def sound(self):
        return "Woof"

print(Dog().sound())`,
      answerLine: 9,
      explanation: py`\`class Dog(Animal, Pet)\` asks for \`Animal\` before \`Pet\`, but \`Pet\` inherits from \`Animal\` and must come first: \`TypeError: Cannot create a consistent method resolution order (MRO) for bases Animal, Pet\`. Use \`class Dog(Pet):\`.`,
    },
    {
      id: 'multiple-inheritance-mro-q5',
      type: 'fill',
      prompt: 'Complete the cooperative `__init__` so `WiFi` works in any position of any MRO.',
      code: py`class WiFi(Device):
    def __init__(self, *, ssid, ___):
        super().___(___)
        self.ssid = ssid`,
      answer: [['**kwargs'], ['__init__'], ['**kwargs']],
      explanation: py`\`WiFi\` takes only its own keyword (\`ssid\`), collects everything else in \`**kwargs\`, and forwards it with \`super().__init__(**kwargs)\` — so the next class in the MRO, whoever it is, receives its own arguments.`,
    },
    {
      id: 'multiple-inheritance-mro-q6',
      type: 'mcq',
      prompt: 'Which of these is a well-designed mixin?',
      options: [
        { text: 'class DatabaseMixin with an __init__(self, url) that opens a connection and stores it', why: 'That is state and setup with its own required argument — better as a collaborator passed in (composition).' },
        { text: 'class Helpers with 20 unrelated utility methods', why: 'Mixins should provide one focused capability, and a vague name hides what it does.' },
        'class ComparableMixin that defines __eq__/__lt__ in terms of a sort_key() method the host class provides',
        { text: 'class SaveMixin whose save() does not call super() and is listed last in the bases', why: 'Listed last, it is searched after the base, and without super() it would also cut the chain.' },
      ],
      answer: 2,
      explanation: py`A good mixin is small, stateless, named \`…Mixin\`, and documents what it needs from its host (here \`sort_key()\`). It adds one capability to any class that meets that requirement.`,
    },
    {
      id: 'multiple-inheritance-mro-q7',
      type: 'short',
      prompt: 'A colleague says "super() calls the parent class". Explain why that is not quite right, using a diamond example.',
      answer: py`super() calls the NEXT class in the MRO of the instance's class (type(self).__mro__), starting after the class where the method is defined. With class Timestamped(Model), class Tagged(Model), class Article(Timestamped, Tagged), the MRO of Article is Article, Timestamped, Tagged, Model, object — so super() inside Timestamped reaches Tagged, a sibling it doesn't inherit from, not its parent Model. For a plain Timestamped instance the same super() does reach Model. With single inheritance "next in the MRO" and "parent" coincide, which is where the misconception comes from.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'cooperative-speaker',
      title: 'Make the smart speaker cooperative',
      difficulty: 'advanced',
      prompt: py`\`SmartSpeaker\` inherits from \`WiFi\` and \`Bluetooth\`, which both inherit from \`Device\`. The starter calls parent \`__init__\` methods by name, so \`Device.__init__\` runs **twice**. Make the hierarchy cooperative:

- Every \`__init__\` takes **keyword-only** parameters for its own data plus \`**kwargs\`, calls \`super().__init__(**kwargs)\` **first**, then appends its class name to the module-level list \`calls\`, then stores its attributes.
- \`Device\` stores \`name\`, \`WiFi\` stores \`ssid\`, \`Bluetooth\` stores \`pin\`. \`SmartSpeaker\` has no data of its own but still records \`"SmartSpeaker"\`.
- After \`calls.clear()\` and \`SmartSpeaker(name="Echo", ssid="home", pin="0000")\`, \`calls\` must equal \`["Device", "Bluetooth", "WiFi", "SmartSpeaker"]\`.
- \`WiFi(name="Router", ssid="office")\` and \`Bluetooth(name="Buds", pin="1234")\` must still work on their own; positional arguments like \`WiFi("Router", "office")\` must raise \`TypeError\`.
- The program prints \`calls\` after creating the speaker.`,
      files: {
        'main.py': py`calls = []


class Device:
    def __init__(self, name):
        calls.append("Device")
        self.name = name


class WiFi(Device):
    def __init__(self, name, ssid):
        Device.__init__(self, name)
        calls.append("WiFi")
        self.ssid = ssid


class Bluetooth(Device):
    def __init__(self, name, pin):
        Device.__init__(self, name)
        calls.append("Bluetooth")
        self.pin = pin


class SmartSpeaker(WiFi, Bluetooth):
    def __init__(self, name, ssid, pin):
        WiFi.__init__(self, name, ssid)
        Bluetooth.__init__(self, name, pin)
        calls.append("SmartSpeaker")


speaker = SmartSpeaker(name="Echo", ssid="home", pin="0000")
print(calls)
`,
      },
      hints: [
        'Print SmartSpeaker.__mro__ first: SmartSpeaker, WiFi, Bluetooth, Device, object. Each class should hand over to the next one with super().',
        'Signature pattern: def __init__(self, *, ssid, **kwargs): then super().__init__(**kwargs), then calls.append("WiFi"), then self.ssid = ssid.',
        'SmartSpeaker becomes def __init__(self, **kwargs): super().__init__(**kwargs); calls.append("SmartSpeaker"). Device ends the chain with super().__init__(**kwargs) too — object.__init__ receives nothing.',
      ],
      solution: {
        explanation: py`With \`super()\` everywhere, one call walks the MRO \`SmartSpeaker → WiFi → Bluetooth → Device → object\`, so each \`__init__\` runs exactly once. Because each class calls \`super()\` *before* recording itself, the names are appended on the way back: \`Device\` first, \`SmartSpeaker\` last. Keyword-only parameters let each class pick out its own argument (\`ssid\`, \`pin\`, \`name\`) regardless of who comes next; \`**kwargs\` carries the rest. \`Device\` forwards an empty \`kwargs\` to \`object.__init__\`, so a typo such as \`colour="red"\` fails loudly. The same classes still work alone: for a plain \`WiFi\`, the next class after \`WiFi\` is simply \`Device\`.`,
        files: {
          'main.py': py`calls = []


class Device:
    def __init__(self, *, name, **kwargs):
        super().__init__(**kwargs)
        calls.append("Device")
        self.name = name


class WiFi(Device):
    def __init__(self, *, ssid, **kwargs):
        super().__init__(**kwargs)
        calls.append("WiFi")
        self.ssid = ssid


class Bluetooth(Device):
    def __init__(self, *, pin, **kwargs):
        super().__init__(**kwargs)
        calls.append("Bluetooth")
        self.pin = pin


class SmartSpeaker(WiFi, Bluetooth):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        calls.append("SmartSpeaker")


speaker = SmartSpeaker(name="Echo", ssid="home", pin="0000")
print(calls)
`,
        },
      },
      tests: [
        { name: 'every __init__ runs once, in MRO-return order', code: py`calls.clear()
SmartSpeaker(name="Echo", ssid="home", pin="0000")
assert calls == ["Device", "Bluetooth", "WiFi", "SmartSpeaker"]` },
        { name: 'the speaker has all attributes', code: py`s = SmartSpeaker(name="Echo", ssid="home", pin="0000")
assert (s.name, s.ssid, s.pin) == ("Echo", "home", "0000")` },
        { name: 'WiFi and Bluetooth still work alone', code: py`assert WiFi(name="Router", ssid="office").ssid == "office"
assert Bluetooth(name="Buds", pin="1234").name == "Buds"` },
        { name: 'arguments are keyword-only', code: py`with raises(TypeError):
    WiFi("Router", "office")` },
        { name: 'unknown keywords are rejected', code: py`with raises(TypeError):
    SmartSpeaker(name="a", ssid="b", pin="c", colour="red")` },
        { name: 'prints the call order', code: py`assert output.strip() == "['Device', 'Bluetooth', 'WiFi', 'SmartSpeaker']"` },
      ],
    },
    {
      id: 'comparable-mixin',
      title: 'A mixin done right',
      difficulty: 'advanced',
      prompt: py`Finish \`ComparableMixin\`, a **stateless** mixin that gives any class with a \`sort_key()\` method a full set of comparisons.

- Implement \`__lt__\`, \`__le__\`, \`__gt__\` and \`__ge__\` (\`__eq__\` is done). Each must return \`NotImplemented\` when \`other\` is not of exactly the same type as \`self\`, and otherwise compare \`self.sort_key()\` with \`other.sort_key()\`.
- Keep the mixin stateless: **no** \`__init__\`.
- Then replace the last line with \`print(sorted([Version(2, 0), Version(1, 10), Version(1, 2)]))\`, which must print \`[Version(1, 2), Version(1, 10), Version(2, 0)]\`.`,
      files: {
        'main.py': py`class ComparableMixin:
    """Adds ==, <, <=, >, >= to any class that defines sort_key().

    Stateless: no __init__ and no attributes of its own.
    """

    def __eq__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return self.sort_key() == other.sort_key()

    # TODO: __lt__, __le__, __gt__, __ge__


class Version(ComparableMixin):
    def __init__(self, major, minor):
        self.major = major
        self.minor = minor

    def sort_key(self):
        return (self.major, self.minor)

    def __repr__(self):
        return f"Version({self.major}, {self.minor})"


class Player(ComparableMixin):
    def __init__(self, name, score):
        self.name = name
        self.score = score

    def sort_key(self):
        return self.score


print(Version(1, 2) == Version(1, 2))
`,
      },
      hints: [
        'Each method has the same shape as __eq__: a type check that returns NotImplemented, then one comparison of the two sort keys.',
        'def __lt__(self, other): if type(other) is not type(self): return NotImplemented; return self.sort_key() < other.sort_key()',
        'Repeat for <=, > and >=, and make the last line print(sorted([Version(2, 0), Version(1, 10), Version(1, 2)])). Tuples compare item by item, so (1, 2) < (1, 10).',
      ],
      solution: {
        explanation: py`The mixin is a pure capability: it reads nothing but \`sort_key()\`, so \`Version\` (tuple keys) and \`Player\` (int keys) both gain ordering without sharing any other code. Returning \`NotImplemented\` (not \`False\`) for foreign types lets Python try the reflected operation on the other operand and, if that fails too, raise a clear \`TypeError\` such as \`'<' not supported between instances of 'Version' and 'int'\` (for \`==\` it falls back to an identity check, giving \`False\`). One subtlety: defining \`__eq__\` sets \`__hash__\` to \`None\`, so these objects are unhashable; if the keys are immutable, add \`def __hash__(self): return hash(self.sort_key())\` to the mixin. In real code, \`functools.total_ordering\` can fill in the other three from \`__eq__\` and \`__lt__\` — see [operator overloading](lesson:operator-overloading).`,
        files: {
          'main.py': py`class ComparableMixin:
    """Adds ==, <, <=, >, >= to any class that defines sort_key().

    Stateless: no __init__ and no attributes of its own.
    """

    def __eq__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return self.sort_key() == other.sort_key()

    def __lt__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return self.sort_key() < other.sort_key()

    def __le__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return self.sort_key() <= other.sort_key()

    def __gt__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return self.sort_key() > other.sort_key()

    def __ge__(self, other):
        if type(other) is not type(self):
            return NotImplemented
        return self.sort_key() >= other.sort_key()


class Version(ComparableMixin):
    def __init__(self, major, minor):
        self.major = major
        self.minor = minor

    def sort_key(self):
        return (self.major, self.minor)

    def __repr__(self):
        return f"Version({self.major}, {self.minor})"


class Player(ComparableMixin):
    def __init__(self, name, score):
        self.name = name
        self.score = score

    def sort_key(self):
        return self.score


print(sorted([Version(2, 0), Version(1, 10), Version(1, 2)]))
`,
        },
      },
      tests: [
        { name: '< and > compare sort keys', code: py`assert Version(1, 2) < Version(1, 10)
assert Version(2, 0) > Version(1, 10)` },
        { name: '<= and >= include equality', code: py`assert Version(1, 2) <= Version(1, 2) and Version(3, 0) >= Version(3, 0)
assert not (Version(1, 3) <= Version(1, 2))` },
        { name: 'works for any host class (Player)', code: py`players = [Player("Ben", 37), Player("Ada", 42), Player("Cy", 12)]
assert max(players).name == "Ada" and min(players).name == "Cy"` },
        { name: 'other types: == is False, < raises TypeError', code: py`assert (Version(1, 0) == "1.0") is False
with raises(TypeError):
    Version(1, 0) < 5` },
        { name: 'the mixin stays stateless and well named', code: py`assert "__init__" not in ComparableMixin.__dict__
assert ComparableMixin.__name__.endswith("Mixin")` },
        { name: 'prints the sorted versions', code: py`assert output.strip() == "[Version(1, 2), Version(1, 10), Version(2, 0)]"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'multiple-inheritance-mro-what-is-mro',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the method resolution order in Python, how is it computed, and how can you see it?',
      answer: 'The MRO is the ordered list of classes Python searches when looking up an attribute on an instance (after the instance\'s own __dict__). It is computed once per class with the C3 linearization, which keeps children before parents, keeps the left-to-right order of the listed bases, and places a shared base once, after all its subclasses. You can see it with Cls.__mro__ or Cls.mro().',
      explanation: py`C3 also guarantees monotonicity: an order established in a parent is preserved in every subclass. If the listed bases make that impossible, the \`class\` statement fails with \`TypeError: Cannot create a consistent method resolution order\`. \`super()\` uses the same list: it continues the search after the current class in \`type(self).__mro__\`.`,
      code: { lang: 'python', code: py`class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass

print([c.__name__ for c in D.__mro__])   # ['D', 'B', 'C', 'A', 'object']` },
      whyAsked: 'A core advanced-OOP question; it checks that you know Python uses a deterministic algorithm rather than "it depends".',
      mistakes: ['Describing the old depth-first order (D, B, A, C)', 'Saying the MRO is computed on every method call', 'Not knowing how to inspect it'],
      followUps: ['Walk me through C3 for a diamond.', 'When does Python refuse to create a class?', 'How does super() use the MRO?'],
      modelAnswer: 'The MRO, or method resolution order, is the single ordered list of classes Python searches when you look up an attribute on an instance, after checking the instance itself. It is computed once, when the class is created, using the C3 linearization. C3 guarantees that a class comes before its parents, that the bases keep the left-to-right order I wrote, and that a shared ancestor appears only once, after every class that inherits from it. I can inspect it with __mro__ or the mro() method — for the classic diamond D(B, C) it is D, B, C, A, object. If the bases make such an order impossible, Python raises a TypeError at class creation.',
    },
    {
      id: 'multiple-inheritance-mro-diamond-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`class A:
    def greet(self):
        return "A"

class B(A):
    def greet(self):
        return "B>" + super().greet()

class C(A):
    def greet(self):
        return "C>" + super().greet()

class D(B, C):
    def greet(self):
        return "D>" + super().greet()

print(D().greet(), B().greet())` },
      options: ['D>B>A B>A', 'D>B>C>A B>A', 'D>B>C>A B>C>A', 'D>C>B>A B>A'],
      correctOption: 1,
      answer: 'D>B>C>A B>A. For a D instance the MRO is D, B, C, A, so B\'s super() reaches C. For a plain B instance the MRO is B, A, so the same super() reaches A.',
      explanation: py`\`super()\` is resolved against \`type(self).__mro__\`, not against the class's own bases. That's why identical code in \`B\` behaves differently depending on the object it runs for — and why every class in a cooperative hierarchy must call \`super()\` for the chain to be complete.`,
      whyAsked: 'The most common way to test real understanding of super() — many developers expect D>B>A.',
      mistakes: ['Answering D>B>A (super() as "parent")', 'Answering B>C>A for the plain B instance', 'Thinking A.greet runs twice'],
      followUps: ['What if C.greet did not call super()?', 'What is the two-argument form of super() equivalent here?', 'Why is A.greet called only once?'],
      modelAnswer: 'It prints D>B>C>A and then B>A. The MRO of D is D, B, C, A, object. D\'s super() moves to B; B\'s super() — for a D instance — moves to the next class in D\'s MRO, which is C, not A; C\'s super() then reaches A. For a plain B object the MRO is just B, A, object, so the same super() call in B goes straight to A. The takeaway is that super() means "next in the instance\'s MRO", which is what lets every class in a diamond run exactly once.',
    },
    {
      id: 'multiple-inheritance-mro-super-not-parent',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does zero-argument super() work under the hood, and what are its limits?',
      answer: 'In a method defined in a class body, the compiler gives the function a hidden __class__ reference to that class; super() combines it with the method\'s first argument, so super() == super(ThatClass, self). The resulting proxy looks attributes up in type(self).__mro__ starting after ThatClass. Limits: it only works in functions defined inside a class body (not methods attached later), and the proxy handles explicit attribute access only — super()[i] or len(super()) fail; call super().__getitem__(i) instead.',
      explanation: py`The two-argument form \`super(Cls, obj)\` is still useful outside class bodies. For classmethods, \`super()\` binds to \`cls\`. Because the search starts in the *instance's* MRO, you can't know statically which class \`super()\` reaches — design methods so any next class with a compatible signature works.`,
      code: { lang: 'python', code: py`class Shelf(list):
    def __getitem__(self, index):
        print("reading", index)
        return super().__getitem__(index)     # not super()[index]


print(Shelf(["Dune", "Emma"])[1])` },
      whyAsked: 'Probes depth beyond "super calls the parent": compiler support, binding, and the proxy\'s special-method limitation.',
      mistakes: ['Saying super() inspects the call stack at runtime to find the class (it uses the __class__ cell)', 'Expecting super()[i] to work', 'Thinking super() can be used in a plain function attached to a class later'],
      followUps: ['What does super() do inside a classmethod?', 'When would you still write super(Cls, self)?', 'Why do special methods bypass the super proxy?'],
      modelAnswer: 'Zero-argument super() relies on the compiler. When a method in a class body mentions super, the compiler creates a hidden __class__ cell pointing at the class being defined, and at runtime super() pairs that class with the method\'s first argument, so it is exactly super(ThatClass, self). The proxy then searches type(self).__mro__ starting just after ThatClass, which is why it reaches the next class for this particular object rather than a fixed parent. Its limits follow from that: it only works in functions defined in a class body, and the proxy only intercepts explicit attribute lookups, so super()[0] raises a TypeError — I have to write super().__getitem__(0).',
    },
    {
      id: 'multiple-inheritance-mro-cooperative-init',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'In a class hierarchy with a diamond, a database connection is opened twice, and in another subclass an attribute set by one parent is missing. What is likely wrong, and what rules fix it?',
      answer: 'Mixed initialisation styles. Explicit Base.__init__(self, ...) calls along both diamond paths run the shared base twice; a class that forgets super().__init__() cuts the chain so later classes in the MRO never initialise. Fix: every __init__ in the hierarchy calls super().__init__(**kwargs) exactly once, takes its own arguments as keyword-only parameters, and passes the rest on; object.__init__ ends the chain and rejects leftovers.',
      explanation: py`Explicit calls follow each class's *static* parents; \`super()\` follows the instance's *dynamic* MRO, where the shared base appears once. Positional parameters break because the "next class" changes with the subclass; keywords and \`**kwargs\` don't care about order. Wrap non-cooperative third-party classes in adapters or use composition.`,
      code: { lang: 'python', code: py`class Storage:
    def __init__(self, *, url, **kwargs):
        super().__init__(**kwargs)
        print("connect", url)          # runs once per object
        self.url = url


class Cached(Storage):
    def __init__(self, *, cache_size=128, **kwargs):
        super().__init__(**kwargs)
        self.cache_size = cache_size


class Audited(Storage):
    def __init__(self, *, auditor="system", **kwargs):
        super().__init__(**kwargs)
        self.auditor = auditor


class ProductStore(Cached, Audited):
    pass


store = ProductStore(url="sqlite://", cache_size=64)
print(store.cache_size, store.auditor)` },
      whyAsked: 'Real-world multiple-inheritance bugs are almost always initialisation bugs; this checks you can diagnose and prevent them.',
      mistakes: ['Suggesting to add a "was_initialised" flag to the base', 'Fixing the symptom by reordering bases', 'Using positional parameters with super()'],
      followUps: ['How do you integrate a third-party class that never calls super()?', 'Why should object.__init__ receive no arguments?', 'How would you test the initialisation order?'],
      modelAnswer: 'Both symptoms point to inconsistent initialisation. If some classes call Base.__init__(self) by name, each path through the diamond reaches the base, so it runs twice — two connections. If one class skips super().__init__, every class after it in the MRO never initialises, so their attributes are missing. The fix is cooperative initialisation everywhere: each __init__ takes its own arguments as keyword-only parameters plus **kwargs, calls super().__init__(**kwargs) exactly once, and lets object.__init__ end the chain, which also rejects misspelt keywords. For a third-party class that does not cooperate, I wrap it in an adapter or hold it as a component instead of inheriting.',
    },
    {
      id: 'multiple-inheritance-mro-consistent-error',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'Why does `class Z(X, Y)` fail with "TypeError: Cannot create a consistent method resolution order (MRO) for bases A, B" when X is `class X(A, B)` and Y is `class Y(B, A)`? How do you fix it?',
      answer: 'C3 must respect the local base order of every class: X requires A before B, Y requires B before A. Merging L[X] = [X, A, B, object] and L[Y] = [Y, B, A, object] reaches a state where both heads (A and B) appear in the tail of another list, so no class can be picked. Fix by making the orders agree (both A, B), or rethinking the design — often one of the relationships should be composition.',
      explanation: py`Trace the merge: start with [X, A, B, O], [Y, B, A, O], [X, Y] → pick X, then Y. Remaining [A, B, O], [B, A, O]: A is in the tail of the second list, B in the tail of the first — deadlock. Python raises at class creation, so an inconsistent hierarchy can never exist at runtime. A common real-world version is \`class Dog(Animal, Pet)\` where \`Pet\` subclasses \`Animal\`.`,
      whyAsked: 'Shows whether you can apply the C3 rules mechanically to diagnose a real error rather than shuffling bases until it works.',
      mistakes: ['Trying random base orders without understanding the constraint', 'Claiming Python cannot handle diamonds', 'Blaming object or the metaclass'],
      followUps: ['What are the three properties C3 guarantees?', 'Show the error with just two classes.', 'Why is monotonicity worth an error at class-creation time?'],
      modelAnswer: 'C3 has to honour the order in which each class lists its bases. X says A before B, Y says B before A, and Z inherits both promises. When C3 merges X\'s and Y\'s linearizations it takes X and Y, and is then left with A, B, object and B, A, object: A cannot go next because it appears later in the second list, and B cannot go next because it appears later in the first list, so there is no consistent order and the class statement raises TypeError. The fix is to make the base orders agree, or more often to question the design — usually one of those relationships should be composition rather than inheritance.',
    },
    {
      id: 'multiple-inheritance-mro-mixin-vs-composition',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'You need auditing (who changed what) on twelve repository classes. Would you use an AuditMixin or compose an Auditor object? Justify.',
      answer: 'If auditing is a small, stateless wrapper around save()/delete() that needs the host\'s data, a cooperative AuditMixin (listed first, calling super()) is concise. If it needs configuration, its own state (a log sink, a clock, a user context), or must be swapped/faked per instance, compose an Auditor passed into the repository. Many teams prefer composition for anything with I/O because it is testable and explicit.',
      explanation: py`Mixins are fixed at class-definition time and share \`self\` with the host — great for generic behaviour, risky for stateful collaborators (name clashes, \`__init__\` coordination, ordering). Composition costs a few lines of delegation but keeps dependencies visible in the constructor and makes test doubles trivial.`,
      code: { lang: 'python', code: py`class AuditMixin:
    """Requires: self.save_row(row) on the host, self.audit_log list."""

    def save(self, row):
        self.audit_log.append(("save", row["id"]))
        return super().save(row)


class Auditor:                       # the composition alternative
    def __init__(self, sink):
        self.sink = sink

    def record(self, action, row_id):
        self.sink.append((action, row_id))` },
      whyAsked: 'Distinguishes candidates who can weigh multiple inheritance against composition instead of applying one by reflex.',
      mistakes: ['Choosing mixins because they are "less code" without considering state and testing', 'A mixin with its own __init__ that does not call super()', 'Forgetting that mixin order in the bases matters'],
      followUps: ['How would you test the mixin version?', 'What if two mixins both define save()?', 'Could a class decorator do the job instead?'],
      modelAnswer: 'It depends on whether auditing is a stateless behaviour or a collaborator. If it is just "record an entry and then call the real save", a small AuditMixin listed before the base class and calling super() is concise and works across all twelve repositories. But auditing usually needs a destination, a clock and the current user — real state and configuration — and in tests I want to swap it for a fake. In that case I compose: each repository receives an Auditor through its constructor and calls it explicitly. That keeps dependencies visible and avoids __init__ coordination and ordering issues in the MRO. So mixin for tiny, generic, stateless behaviour; composition for anything with state or I/O.',
    },
    {
      id: 'multiple-inheritance-mro-c3-coding',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Implement C3 linearization. `linearize(name, bases)` takes a class name and a dict mapping each class name to the list of its direct base names (classes with no bases map to `[]`; leave out `object`). Return the MRO as a list of names. Raise `TypeError` when no consistent order exists.',
      answer: 'Recursively linearize each base, then merge those lists plus the list of direct bases: repeatedly pick the first head that does not appear in the tail of any list, append it, remove it from the heads; if no head qualifies, raise TypeError.',
      explanation: py`This is exactly the algorithm CPython uses to compute \`__mro__\` (its C implementation adds caching and error details). The merge's "not in any tail" rule enforces children-before-parents and local precedence; the deadlock case is the "consistent MRO" error. Recursion depth is the height of the hierarchy, which is small in practice.`,
      starter: { files: { 'main.py': py`def linearize(name, bases):
    """Return the MRO of name as a list of class names (without object)."""
    # TODO: this is the old depth-first order, not C3
    order = [name]
    for parent in bases.get(name, []):
        for cls in linearize(parent, bases):
            if cls not in order:
                order.append(cls)
    return order


diamond = {"D": ["B", "C"], "B": ["A"], "C": ["A"], "A": []}
print(linearize("D", diamond))
` } },
      tests: [
        { name: 'a class with no bases', code: py`assert linearize("A", {"A": []}) == ["A"]` },
        { name: 'the diamond', code: py`assert linearize("D", {"D": ["B", "C"], "B": ["A"], "C": ["A"], "A": []}) == ["D", "B", "C", "A"]` },
        { name: 'matches Python on a larger hierarchy', code: py`h = {"Z": ["K1", "K2", "K3"], "K1": ["A", "B", "C"], "K2": ["D", "B", "E"], "K3": ["D", "A"],
     "A": [], "B": [], "C": [], "D": [], "E": []}
made = {}
def build(n):
    if n not in made:
        made[n] = type(n, tuple(build(b) for b in h[n]), {})
    return made[n]
expected = [c.__name__ for c in build("Z").__mro__][:-1]
assert linearize("Z", h) == expected` },
        { name: 'raises TypeError when no consistent order exists', code: py`with raises(TypeError):
    linearize("Z", {"Z": ["X", "Y"], "X": ["A", "B"], "Y": ["B", "A"], "A": [], "B": []})` },
      ],
      solution: { files: { 'main.py': py`def merge(sequences):
    sequences = [list(seq) for seq in sequences if seq]
    result = []
    while sequences:
        for seq in sequences:
            head = seq[0]
            if not any(head in other[1:] for other in sequences):
                break                       # found a head that no list wants later
        else:
            raise TypeError("Cannot create a consistent method resolution order")
        result.append(head)
        sequences = [seq[1:] if seq[0] == head else seq for seq in sequences]
        sequences = [seq for seq in sequences if seq]
    return result


def linearize(name, bases):
    """Return the MRO of name as a list of class names (without object)."""
    parents = bases.get(name, [])
    return [name] + merge([linearize(p, bases) for p in parents] + [list(parents)])


diamond = {"D": ["B", "C"], "B": ["A"], "C": ["A"], "A": []}
print(linearize("D", diamond))
` } },
      hints: ['L[C] = [C] + merge(L[B1], ..., L[Bn], [B1, ..., Bn]).', 'In merge: a head is "good" if it does not appear in any list\'s tail (seq[1:]). Take the first good head, remove it from the front of every list, repeat. If there is no good head, raise TypeError.'],
      whyAsked: 'An advanced exercise that proves you understand C3 well enough to implement it, not just recite its output.',
      mistakes: ['Removing the head from everywhere in the lists rather than only from the front', 'Forgetting the list of direct bases in the merge (loses local precedence order)', 'Returning silently instead of raising on deadlock'],
      followUps: ['What is the time complexity of your merge?', 'Which C3 property does the final [B1..Bn] list enforce?', 'How would you add object at the end?'],
      modelAnswer: 'I implement the definition directly. The linearization of a class is the class itself followed by a merge of its parents\' linearizations plus the list of its direct parents. The merge repeatedly looks at the head of each list and picks the first one that does not appear in the tail of any list; that rule keeps subclasses before their bases and preserves the order I listed the bases in. I append it, drop it from the front of every list, discard empty lists, and repeat. If at some point every head appears in some tail, there is no consistent order, so I raise TypeError, which is what Python does at class creation. I can check the implementation against real classes built with type().',
    },
  ],

  takeaways: [
    'A class can list several bases; Python turns them into one method resolution order, stored in cls.__mro__ and computed once with C3.',
    'C3 keeps children before parents, keeps your left-to-right base order, and places a shared base once, after all its subclasses.',
    'Contradictory base orders make the class statement fail: TypeError: Cannot create a consistent method resolution order.',
    'super() means "next class in type(self).__mro__" — in a diamond it can reach a sibling, not the parent.',
    'Cooperative __init__: keyword-only own parameters, **kwargs for the rest, super().__init__(**kwargs) exactly once in every class; object.__init__ ends the chain.',
    'Mixins: small, stateless, named …Mixin, listed before the main base, calling super() in overrides.',
    'Multiple inheritance couples classes invisibly — keep it shallow and prefer composition for anything with state or configuration.',
  ],
}
