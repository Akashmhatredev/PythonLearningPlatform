// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const HERO = py`class Sword:
    name = "sword"

    def damage(self):
        return 10


class Bow:
    name = "bow"

    def damage(self):
        return 7


class Backpack:
    def __init__(self, capacity):
        self.capacity = capacity
        self.items = []

    def add(self, item):
        if len(self.items) >= self.capacity:
            return False
        self.items.append(item)
        return True

    def __len__(self):
        return len(self.items)


class Hero:
    def __init__(self, name, weapon, backpack):
        self.name = name
        self.weapon = weapon        # a Hero HAS-A weapon
        self.backpack = backpack    # ...and HAS-A backpack

    def attack(self):
        # delegation: the hero asks its weapon how hard it hits
        return f"{self.name} hits with a {self.weapon.name} for {self.weapon.damage()} damage"

    def pick_up(self, item):
        if self.backpack.add(item):     # delegate to the backpack
            return f"{self.name} picked up {item}"
        return f"{self.name}'s backpack is full, {item} stays on the floor"


hero = Hero("Ada", Sword(), Backpack(capacity=2))
print(hero.attack())
for item in ["potion", "map", "rope"]:
    print(hero.pick_up(item))

hero.weapon = Bow()     # swap a part while the program runs
print(hero.attack())
print("items carried:", len(hero.backpack))
`

export default {
  id: 'composition',
  title: 'Composition over inheritance',
  summary: 'Build objects out of other objects (has-a) and delegate work to them, instead of stretching an inheritance tree (is-a) to reuse code.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['classes-and-objects', 'methods-and-attributes', 'inheritance'],
  related: ['polymorphism-and-duck-typing', 'abstract-base-classes', 'multiple-inheritance-mro', 'properties-and-encapsulation', 'attribute-access', 'clean-architecture', 'solid', 'design-patterns', 'mocking', 'dataclasses', 'protocols'],
  tags: ['composition', 'has-a', 'is-a', 'delegation', '__getattr__', 'composition over inheritance', 'fragile base class', 'class explosion', 'dependency injection', 'refactoring', 'wrapper', 'aggregation', 'strategy'],
  apis: [
    { name: 'object.__getattr__(self, name)', summary: 'Called only when normal attribute lookup fails; lets a wrapper forward unknown attributes to the object it wraps.' },
    { name: 'getattr(obj, name[, default])', summary: 'Looks up an attribute by its string name, e.g. getattr(engine, "start"). Returns default instead of raising AttributeError if given.' },
    { name: 'collections.UserDict / UserList', summary: 'Pure-Python dict/list wrappers whose methods route through your overrides — safer to customise than subclassing dict or list.' },
    { name: 'dataclasses.field(default_factory=...)', summary: 'Gives each dataclass instance its own freshly built part (a new list, a new Backpack) instead of one shared default.' },
  ],
  docs: [
    { label: 'Python tutorial — classes', url: 'https://docs.python.org/3/tutorial/classes.html' },
    { label: 'Data model — customizing attribute access (__getattr__)', url: 'https://docs.python.org/3/reference/datamodel.html#customizing-attribute-access' },
    { label: 'Data model — special method lookup', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-lookup' },
    { label: 'collections — UserDict and UserList', url: 'https://docs.python.org/3/library/collections.html#collections.UserDict' },
    { label: 'Built-in functions — getattr()', url: 'https://docs.python.org/3/library/functions.html#getattr' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Composition** means building an object out of other objects. A \`Car\` doesn't *become* an engine — it *has* an engine, stored as an attribute (a name that belongs to the object, like \`car.engine\`). When the car needs to start, it asks its engine to do the work. Passing a job on to a part like that is called **delegation**.`,
    py`In [inheritance](lesson:inheritance) you met the other way to reuse code: a subclass *is a* more specific kind of its parent (\`class ElectricCar(Car)\`). Both are useful, but they describe different relationships:`,
    py`- **is-a** → inheritance: an \`ElectricCar\` *is a* \`Car\`.
- **has-a** → composition: a \`Car\` *has an* \`Engine\`, *has* four \`Wheel\`s, *has a* \`Radio\`.`,
    py`The famous design advice **"favour composition over inheritance"** (popularised by the 1994 *Design Patterns* book) says: when you're unsure, reach for has-a. You get small, swappable parts instead of deep family trees that break when someone edits the top of them. This lesson shows why, how to delegate cleanly, and how to refactor a tangled hierarchy into composed parts.`,
  ],
  why: [
    py`Inheritance glues a subclass to *every detail* of its parent — including details the parent's author thinks are private and may change. Composition only depends on the part's **public methods**, so each part can change on its own.`,
    py`Composition also avoids the **class explosion**. If a logger can write *text or JSON* to *the console or a file*, inheritance needs one subclass per combination (2 × 2 = 4). Add a CSV format and a network destination and you need 3 × 3 = 9. With composition you write 3 formatters and 3 destinations — 6 small classes — and combine them freely.`,
    py`Finally, parts that are **passed in** can be swapped: a different weapon at runtime, a real email sender in production, a fake one in tests. That last idea — handing an object its collaborators instead of letting it build them — is called **dependency injection**, and it's the backbone of [clean architecture](lesson:clean-architecture).`,
  ],
  eli15: [
    py`Think of LEGO. You can build a spaceship from a cockpit piece, two wing pieces and an engine piece. Want a faster ship? Pop the engine off and click a bigger one on. You don't melt the whole ship down and pour a new one.`,
    py`That's composition: an object is **made of parts**, and each part does one job. The spaceship doesn't know *how* the engine works — it just says "engine, go!" and the engine handles it.`,
    py`Inheritance is more like a family resemblance: a "racing ship" *is a* kind of spaceship and inherits everything about it, good and bad. That's fine when it's truly the same kind of thing — but if you only wanted to borrow the engine, building the ship from parts is simpler and safer.`,
  ],
  analogy: {
    title: 'A band, not a family tree',
    body: [
      py`A band *has* a singer, a guitarist and a drummer. When the song needs a drum fill, the band doesn't learn to drum — it lets the drummer do it. If the drummer leaves, you hire a new one who can play the same parts, and the band carries on.`,
      py`Now imagine instead that the band *inherited* from "Drummer", "Singer" and "Guitarist" all at once — it would have to be all three, forever. Changing drummers would mean redesigning the band. That's the trap composition avoids.`,
    ],
    mapping: [
      ['the band', 'the composed object (Hero, Car, Logger)'],
      ['band members', 'parts stored as attributes (self.weapon, self.engine)'],
      ['"drummer, play the fill!"', 'delegation: self.engine.start()'],
      ['hiring a new drummer who knows the songs', 'swapping in any part with the same methods'],
      ['a session drummer for rehearsals', 'a fake part injected in tests'],
      ['"the band IS a drummer"', 'misusing inheritance for a has-a relationship'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A car that has an engine',
    props: {
      code: py`class Engine:
    def __init__(self, horsepower):
        self.horsepower = horsepower

    def start(self):
        return "vroom"


class Car:
    def __init__(self, model, engine):
        self.model = model
        self.engine = engine        # Car HAS-A Engine

    def start(self):
        return f"{self.model}: {self.engine.start()}"   # delegate


v8 = Engine(400)
car = Car("Roadster", v8)
print(car.start())
car.engine = Engine(150)            # swap the part
print(car.engine.horsepower, v8.horsepower)
`,
      notes: {
        18: 'An `Engine` object is created on its own — it exists before any car does.',
        19: 'The engine is **passed in**. `car.engine` now refers to the very same object as `v8`: the car holds a reference, not a copy.',
        15: 'Delegation: `Car.start` doesn\'t know how engines work. It asks `self.engine` and wraps the answer.',
        21: 'Swapping a part is just re-binding an attribute. No new class, no inheritance.',
        22: 'The old engine still exists (`v8` points to it) and is unchanged — the car simply stopped referring to it.',
      },
    },
    alt: 'A step-by-step trace. An Engine object with horsepower 400 is created and bound to v8. A Car object is created whose engine attribute points to the same Engine object as v8. Calling car.start() opens Car.start, which calls Engine.start on the engine part and returns "Roadster: vroom". Then car.engine is re-bound to a new Engine with horsepower 150, while v8 still points to the original 400-horsepower engine, so the program prints 150 400.',
    caption: py`Step through with ▶ and watch the arrow from the car's \`engine\` attribute: first to the shared \`v8\` engine, then to a brand-new one. Composition is just *attributes that refer to other objects*.`,
  },
  syntax: [
    py`#### 1. Store parts as attributes`,
    { code: py`class Engine:
    def start(self):
        return "vroom"


class Car:
    def __init__(self, model, engine):
        self.model = model
        self.engine = engine          # the part, passed in from outside


car = Car("Roadster", Engine())`, lang: 'python', title: 'has-a: a part is just an attribute' },
    py`There's no special keyword for composition. A part is an ordinary attribute set in \`__init__\` (see [classes & objects](lesson:classes-and-objects)). Passing it in as a parameter, rather than creating it inside, is what makes it swappable.`,
    py`#### 2. Delegate explicitly`,
    { code: py`class Car:
    def __init__(self, model, engine):
        self.model = model
        self.engine = engine

    def start(self):                  # the car's own, small public method...
        return self.engine.start()    # ...that forwards the work to its part`, lang: 'python', title: 'explicit delegation' },
    py`Explicit forwarding methods are the default choice: they're readable, an editor can autocomplete them, and the car's public interface stays exactly what you chose — no more, no less.`,
    py`#### 3. The is-a / has-a test`,
    py`Say the sentence out loud. If "*A is a B*" is true in every situation, inheritance may fit. If "*A has a B*" or "*A uses a B*" sounds right, compose.

| sentence | true? | tool |
|---|---|---|
| A \`SavingsAccount\` is an \`Account\` | yes | inheritance |
| A \`Car\` is an \`Engine\` | no — it *has* one | composition |
| A \`Stack\` is a \`list\` | no — a stack must *not* allow \`insert(0, x)\` | composition (a stack *uses* a list) |
| A \`Logger\` is a \`JsonFormatter\` | no — it *uses* a formatter | composition |`,
    py`#### 4. Default parts without sharing them`,
    { code: py`class Hero:
    def __init__(self, name, backpack=None):
        self.name = name
        # build a fresh part per hero when none is given
        self.backpack = backpack if backpack is not None else Backpack()`, lang: 'python', title: 'never write backpack=Backpack() in the signature', static: true },
    { callout: 'warn', title: 'Default values are created once', text: py`A default like \`backpack=Backpack()\` is evaluated **once**, when \`def\` runs — so every hero would share a single backpack. Use \`None\` and build the part inside, or \`field(default_factory=Backpack)\` in a [dataclass](lesson:dataclasses). Same rule as mutable defaults in [function arguments](lesson:function-arguments).` },
    py`#### 5. Delegation with \`__getattr__\` (a teaser)`,
    { code: py`class LoggedList:
    """Wraps a list and reports every attribute used on it (simplified)."""

    def __init__(self, items):
        self._items = items

    def __getattr__(self, name):          # runs ONLY when normal lookup fails
        print(f"-> list.{name}")
        return getattr(self._items, name)


tasks = LoggedList(["write", "test"])
tasks.append("ship")          # -> list.append
print(tasks.count("test"))    # -> list.count, then 1`, lang: 'python', title: 'automatic forwarding' },
    py`\`__getattr__\` is a *special method* (a "dunder" — double underscore — method Python calls for you) that runs only when an attribute **isn't found** the normal way. Forwarding everything is handy for wrappers and proxies, but it has sharp edges — \`len(tasks)\` still fails — covered in **Under the hood** and in depth in [attribute access](lesson:attribute-access).`,
  ],
  walkthrough: {
    title: 'Reading the hero program',
    lang: 'python',
    code: HERO,
    intro: py`This is the playground program. Press **Guide** in the playground to follow the steps inside the editor.`,
    steps: [
      { lines: [1, 12], text: py`Two small weapon classes. Neither inherits from anything special — they just both have a \`name\` and a \`damage()\` method. Anything with those two can be a hero's weapon (that's [duck typing](lesson:polymorphism-and-duck-typing)).` },
      { lines: [15, 27], text: py`\`Backpack\` owns its own rule: it refuses items beyond its \`capacity\`. The hero will never touch \`items\` directly; it asks the backpack.` },
      { lines: [30, 34], text: py`The hero **receives** its parts as arguments and stores them as attributes. This is composition: a Hero *has a* weapon and *has a* backpack.` },
      { lines: [36, 38], text: py`Delegation: \`attack()\` doesn't know any damage numbers. It asks \`self.weapon\` for its name and damage and builds a sentence.` },
      { lines: [40, 43], text: py`Same idea for items: \`self.backpack.add(item)\` decides whether there's room. The hero only reacts to the \`True\`/\`False\` answer.` },
      { lines: [46, 49], text: py`Ada starts with a sword and a backpack that holds 2 items, so the third pick-up is refused.` },
      { lines: [51, 53], text: py`\`hero.weapon = Bow()\` swaps a part at runtime. With inheritance you'd need a different *class* (\`SwordHero\`, \`BowHero\`…); with composition it's one assignment. \`len(hero.backpack)\` works because \`Backpack\` defines \`__len__\`.` },
    ],
  },
  playground: {
    title: 'A hero built from parts',
    objective: 'Run it, then add new parts, change a part, and add a delegating method — all without touching inheritance.',
    files: { 'main.py': HERO },
    expected: py`Six lines:

\`\`\`text
Ada hits with a sword for 10 damage
Ada picked up potion
Ada picked up map
Ada's backpack is full, rope stays on the floor
Ada hits with a bow for 7 damage
items carried: 2
\`\`\``,
    experiments: [
      {
        id: 'new-weapon',
        task: py`Add a new weapon class \`Staff\` (\`name = "staff"\`, \`damage()\` returns **12**) and, at the end of the program, equip it and print another attack.`,
        hint: py`Copy the \`Bow\` class, rename it, change the two values. Then \`hero.weapon = Staff()\` and \`print(hero.attack())\`.`,
        tests: [
          { name: 'Staff exists and hits for 12', code: py`assert ns.get('Staff') is not None, 'Define a class named Staff'
assert Staff().damage() == 12` },
          { name: 'the hero attacked with the staff', code: py`assert 'hits with a staff for 12 damage' in output` },
        ],
        explain: py`\`Hero\` didn't change at all. Any object with a \`name\` and a \`damage()\` method can be plugged in — composition plus duck typing means new parts cost one small class each.`,
      },
      {
        id: 'bigger-backpack',
        task: py`Give Ada a backpack big enough that the rope fits too.`,
        hint: py`The capacity is decided where the backpack is *created*, on the \`hero = Hero(...)\` line.`,
        tests: [{ name: 'the rope was picked up', code: py`assert 'Ada picked up rope' in output
assert len(hero.backpack) == 3` }],
        explain: py`The rule ("refuse when full") lives inside \`Backpack\`; the *setting* (capacity) is chosen by whoever builds the hero. Changing a part's configuration never requires editing \`Hero\`.`,
      },
      {
        id: 'delegate-inventory',
        task: py`Add a method \`Hero.inventory()\` that **returns a copy** of the items in the backpack (a new list), by delegating to the backpack.`,
        hint: py`Inside \`Hero\`: \`def inventory(self): return list(self.backpack.items)\`.`,
        tests: [
          { name: 'inventory() returns the carried items', code: py`assert hero.inventory() == ["potion", "map"]` },
          { name: 'it is a copy, not the backpack list itself', code: py`assert hero.inventory() is not hero.backpack.items, 'Return list(...) so callers cannot change the backpack directly'` },
        ],
        explain: py`Callers ask the hero, the hero asks its part. Returning a copy keeps the backpack in charge of its own list — nobody can sneak items past the capacity check by appending to the returned list. That's encapsulation (see [properties & encapsulation](lesson:properties-and-encapsulation)) working together with composition.`,
      },
      {
        id: 'default-fists',
        task: py`Make the \`weapon\` parameter optional: add a \`Fists\` class (\`name = "fists"\`, damage **1**) and use a fresh \`Fists()\` when no weapon is passed. \`Hero("Cy", backpack=Backpack(1)).attack()\` should then work.`,
        hint: py`Change the signature to \`def __init__(self, name, weapon=None, backpack=None)\` and set \`self.weapon = weapon if weapon is not None else Fists()\`. Do the same for the backpack if you like.`,
        tests: [{ name: 'a hero without a weapon uses fists', code: py`cy = Hero("Cy", backpack=Backpack(1))
assert cy.attack() == "Cy hits with a fists for 1 damage"` }],
        explain: py`\`None\` as the default plus "build the part inside" gives every hero its *own* default part. Writing \`weapon=Fists()\` in the signature would create a single \`Fists\` object when the function is defined and share it between all heroes — harmless for a stateless weapon, a real bug for a backpack.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'From class explosion to composed parts',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'base', label: 'Logger', note: 'base class', x: 190, y: 45, tone: 'ink' },
        { id: 'tc', label: 'TextConsoleLogger', x: 95, y: 150, tone: 'red' },
        { id: 'jc', label: 'JsonConsoleLogger', x: 285, y: 150, tone: 'red' },
        { id: 'tf', label: 'TextFileLogger', x: 95, y: 245, tone: 'red' },
        { id: 'jf', label: 'JsonFileLogger', x: 285, y: 245, tone: 'red' },
        { id: 'logger', label: 'Logger', note: 'has a formatter + a destination', x: 575, y: 45, tone: 'yellow' },
        { id: 'fmt', label: 'formatter', note: 'Text · JSON · CSV', x: 480, y: 165, tone: 'blue' },
        { id: 'dest', label: 'destination', note: 'Console · File · Network', x: 670, y: 165, tone: 'blue' },
        { id: 'fake', label: 'MemoryDestination', note: 'a fake for tests', x: 670, y: 290, tone: 'paper' },
      ],
      edges: [
        { from: 'tc', to: 'base', label: 'is-a' },
        { from: 'jc', to: 'base', label: 'is-a' },
        { from: 'tf', to: 'base', label: 'is-a' },
        { from: 'jf', to: 'base', label: 'is-a' },
        { from: 'logger', to: 'fmt', label: 'has-a' },
        { from: 'logger', to: 'dest', label: 'has-a' },
        { id: 'inject', from: 'fake', to: 'dest', label: 'swapped in', dashed: true },
      ],
      steps: [
        { focus: ['base', 'tc', 'jc', 'tf', 'jf'], edges: ['tc->base', 'jc->base', 'tf->base', 'jf->base'], text: py`**Inheritance:** each *combination* of format and destination becomes a subclass. 2 formats × 2 destinations = 4 classes, each re-implementing a slice of the same logic.` },
        { focus: ['tc', 'jc', 'tf', 'jf'], text: py`Add a CSV format and a network destination and you need 3 × 3 = **9** subclasses. Every new option *multiplies* the class count. That's the **class explosion**.` },
        { focus: ['logger', 'fmt', 'dest'], edges: ['logger->fmt', 'logger->dest'], text: py`**Composition:** one \`Logger\` that *has a* formatter and *has a* destination. 3 formatters + 3 destinations = 6 small classes cover all 9 combinations. New options *add* instead of multiply.` },
        { focus: ['logger', 'dest'], edges: ['logger->dest'], text: py`Because the parts are just attributes, you can swap one at runtime: \`logger.destination = FileDestination("app.log")\`. No new class, no restart.` },
        { focus: ['fake', 'dest', 'logger'], edges: ['inject', 'logger->dest'], text: py`And in tests you **inject** a fake destination that stores lines in a list, so tests check output without touching real files. Handing an object its parts from outside is *dependency injection* — see [clean architecture](lesson:clean-architecture).` },
      ],
    },
    alt: 'Left: a Logger base class with four subclasses — TextConsoleLogger, JsonConsoleLogger, TextFileLogger and JsonFileLogger — each linked to the base by an is-a arrow, illustrating one subclass per combination. Right: a single Logger with has-a arrows to a formatter part (Text, JSON, CSV) and a destination part (Console, File, Network), plus a MemoryDestination fake that can be swapped in for tests.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`An object's attributes are stored as **references** — arrows to other objects — exactly like variables (see [variables](lesson:variables-and-names)). So "a car has an engine" literally means: the car's attribute table contains the name \`engine\` with an arrow to an \`Engine\` object.`,
      { code: py`class Engine:
    pass


class Car:
    def __init__(self, engine):
        self.engine = engine


v8 = Engine()
car = Car(v8)
print(vars(car))               # {'engine': <__main__.Engine object at 0x...>}
print(car.engine is v8)        # True: a reference, not a copy`, lang: 'python', title: 'a part is a reference in the instance dict' },
      py`Two consequences follow. **Parts can be shared** — two cars built with the same \`v8\` share one engine, and tuning it through one car is visible through the other. And **parts outlive the whole** if anything else still refers to them. Some design books split this into *composition* (the whole owns its parts; they live and die together) and *aggregation* (parts are shared or outlive the whole). Python doesn't distinguish them — both are just references — so you decide by who creates and who keeps the part.`,
    ],
    technical: [
      py`#### Why inheritance is "fragile"`,
      py`A subclass depends on *how* its parent works internally, not just on *what* it promises. If a parent method quietly calls another overridable method, the subclass inherits that hidden coupling. This is the **fragile base class problem**:`,
      { code: py`class Inventory:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)

    def add_many(self, items):
        for item in items:
            self.add(item)          # hidden detail: reuses add()


class CountingInventory(Inventory):
    def __init__(self):
        super().__init__()
        self.added = 0

    def add(self, item):
        self.added += 1
        super().add(item)

    def add_many(self, items):
        self.added += len(items)
        super().add_many(items)     # ...which calls OUR add() again


inv = CountingInventory()
inv.add_many(["apple", "pear", "fig"])
print(inv.added)                    # 6, not 3`, lang: 'python', title: 'double counting through a hidden self-call' },
      py`Worse: if the base author later "optimises" \`add_many\` to \`self.items.extend(items)\`, the count silently becomes correct — and a subclass that *relied* on the old behaviour breaks. The subclass's correctness depends on private implementation choices it can't see. The composed version doesn't have this problem, because the inner \`Inventory\` calls its *own* \`add\`, never ours:`,
      { code: py`class CountingInventory:
    def __init__(self):
        self._inventory = Inventory()     # has-a, not is-a
        self.added = 0

    def add(self, item):
        self.added += 1
        self._inventory.add(item)

    def add_many(self, items):
        self.added += len(items)
        self._inventory.add_many(items)   # inner add() is Inventory.add`, lang: 'python', title: 'the composed version counts 3 whatever Inventory does inside', static: true },
      py`Built-in types show the same effect. Subclass \`dict\` and override \`__setitem__\`, and \`d["k"] = v\` uses your override — but \`d.update(...)\` and the constructor don't. The C code behind \`dict\` doesn't promise to route through your method. \`collections.UserDict\` is written in Python on top of a wrapped dict (composition!) and *does* call your \`__setitem__\` from \`update\`, which is why the docs suggest it for customised dicts.`,
      { callout: 'note', title: 'CPython detail', text: py`Which built-in methods call which other methods is an implementation choice of the C code in CPython, not a language guarantee. Other implementations try to match CPython, but code that relies on it is relying on internals. Wrapping (or \`UserDict\` / \`UserList\`) gives you behaviour you control.` },
      py`#### How \`__getattr__\` delegation really works`,
      py`When you write \`obj.name\`, Python looks in the instance's \`__dict__\`, then the class and its bases in [MRO](lesson:multiple-inheritance-mro) order. Only if all of that fails does it call \`type(obj).__getattr__(obj, "name")\`. That makes \`__getattr__\` a perfect "everything else, ask the wrapped object" hook — your own methods still win.`,
      py`Three sharp edges:`,
      py`1. **Implicit special methods skip it.** \`len(proxy)\`, \`proxy[0]\`, \`for x in proxy\` and \`with proxy:\` look up \`__len__\`, \`__getitem__\`, \`__iter__\` and \`__enter__\` on the **type**, not the instance, and never call \`__getattr__\`. You get \`TypeError: object of type 'Proxy' has no len()\` even though \`proxy.__len__()\` works. You must define the dunders you need explicitly.
2. **Recursion when the wrapped attribute is missing.** If \`self._wrapped\` isn't set yet (a typo in \`__init__\`, or an object being rebuilt by \`copy\`/\`pickle\` without calling \`__init__\`), looking it up inside \`__getattr__\` calls \`__getattr__\` again → \`RecursionError\`.
3. **It hides the interface.** Editors, type checkers and \`dir()\` can't see the forwarded methods, and \`isinstance(proxy, list)\` is \`False\`. Explicit delegation is usually the better default; reach for \`__getattr__\` for genuinely generic wrappers (logging proxies, lazy loaders, remote objects).`,
    ],
    production: [
      py`#### Constructor injection is the everyday form of DI`,
      py`Production code composes services from collaborators: an \`OrderService\` *has a* repository, *has a* payment gateway, *has a* clock. Accept them as constructor parameters (with sensible defaults if you like) instead of creating them inside. Then the application's start-up code wires the real parts together, and tests pass fakes — no monkey-patching needed (compare [mocking](lesson:mocking)).`,
      { code: py`from datetime import datetime, timezone


class SystemClock:
    def now(self):
        return datetime.now(timezone.utc)


class FixedClock:
    """A fake for tests: always returns the same moment."""

    def __init__(self, moment):
        self.moment = moment

    def now(self):
        return self.moment


class InvoiceService:
    def __init__(self, clock=None):
        self.clock = clock if clock is not None else SystemClock()

    def stamp(self, invoice_id):
        return f"{invoice_id} issued {self.clock.now():%Y-%m-%d}"


fake = FixedClock(datetime(2026, 1, 15, tzinfo=timezone.utc))
print(InvoiceService(clock=fake).stamp("INV-7"))   # INV-7 issued 2026-01-15`, lang: 'python', title: 'injecting a clock makes time testable' },
      py`#### Composition is a guideline, not a law`,
      py`Inheritance is still the right tool when the relationship really is *is-a* and the base class was **designed to be extended**: exception hierarchies ([custom exceptions](lesson:custom-exceptions)), \`unittest.TestCase\`, abstract interfaces ([ABCs](lesson:abstract-base-classes)), framework base classes that document their extension points. Many good designs use both: inherit an *interface*, compose the *implementation*.`,
      py`#### Keep delegation shallow`,
      py`Long chains like \`order.customer.wallet.card.charge(total)\` mean the caller knows the whole internal structure — change any link and every caller breaks. Prefer asking the nearest object to do the job (\`order.charge(total)\`) and let it delegate one step at a time. (This guideline is sometimes called the *Law of Demeter*.)`,
      py`Each delegated call costs one extra attribute lookup and method call. That's negligible next to almost any real work — don't flatten a good design for it without measuring first (see [profiling](lesson:profiling)).`,
    ],
  },
  mistakes: [
    {
      title: 'Inheriting from list to build a Stack',
      wrong: { code: py`class Stack(list):
    def push(self, item):
        self.append(item)


plates = Stack()
plates.push("blue")
plates.push("red")
plates.insert(0, "green")   # allowed! the stack rule is broken
plates.sort()               # also allowed
print(plates)               # ['blue', 'green', 'red']`, lang: 'python' },
      right: { code: py`class Stack:
    def __init__(self):
        self._items = []           # a stack USES a list

    def push(self, item):
        self._items.append(item)

    def pop(self):
        return self._items.pop()

    def __len__(self):
        return len(self._items)


plates = Stack()
plates.push("blue")
print(hasattr(plates, "insert"))   # False: only stack operations exist`, lang: 'python' },
      explanation: py`Inheriting gives the subclass **every** public method of the parent — about a dozen for \`list\` — including ones that break your invariant (a rule that must always hold, here "only the top can change"). Composition exposes exactly the operations you choose.`,
    },
    {
      title: 'Sharing one part between every instance',
      wrong: { code: py`class Backpack:
    def __init__(self):
        self.items = []


class Hero:
    def __init__(self, name, backpack=Backpack()):   # built ONCE
        self.name = name
        self.backpack = backpack


ada, ben = Hero("Ada"), Hero("Ben")
ada.backpack.items.append("potion")
print(ben.backpack.items)    # ['potion'] — Ben has Ada's potion!`, lang: 'python' },
      right: { code: py`class Backpack:
    def __init__(self):
        self.items = []


class Hero:
    def __init__(self, name, backpack=None):
        self.name = name
        self.backpack = backpack if backpack is not None else Backpack()


ada, ben = Hero("Ada"), Hero("Ben")
ada.backpack.items.append("potion")
print(ben.backpack.items)    # []`, lang: 'python' },
      explanation: py`Default argument values are evaluated once, when \`def\` runs. Every hero created without a backpack gets the same \`Backpack\` object. Use \`None\` and create the part inside \`__init__\` (or \`field(default_factory=Backpack)\` in a dataclass).`,
    },
    {
      title: 'Hard-wiring parts inside __init__',
      wrong: { code: py`class EmailSender:
    def send(self, to, text):
        print(f"(really emailing {to})")


class SignupService:
    def __init__(self):
        self.sender = EmailSender()     # can't be replaced from outside

    def register(self, email):
        self.sender.send(email, "Welcome!")`, lang: 'python' },
      right: { code: py`class EmailSender:
    def send(self, to, text):
        print(f"(really emailing {to})")


class SignupService:
    def __init__(self, sender):
        self.sender = sender            # injected: real or fake

    def register(self, email):
        self.sender.send(email, "Welcome!")


class RecordingSender:                  # a fake for tests
    def __init__(self):
        self.sent = []

    def send(self, to, text):
        self.sent.append((to, text))


fake = RecordingSender()
SignupService(fake).register("ada@example.com")
print(fake.sent)    # [('ada@example.com', 'Welcome!')]`, lang: 'python' },
      explanation: py`Creating the collaborator inside the class *is* composition, but it's locked: tests would send real emails, and switching providers means editing the class. Accepting the part as a parameter (dependency injection) keeps the class honest about what it needs.`,
    },
    {
      title: 'A __getattr__ that recurses forever',
      wrong: { code: py`class Proxy:
    def __init__(self, wrapped):
        self.wraped = wrapped               # typo!

    def __getattr__(self, name):
        return getattr(self._wrapped, name)  # _wrapped is missing -> __getattr__ again


Proxy([1, 2]).append(3)    # RecursionError: maximum recursion depth exceeded`, lang: 'python', static: true },
      right: { code: py`class Proxy:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def __getattr__(self, name):
        if name == "_wrapped":              # guard: never forward our own field
            raise AttributeError(name)
        return getattr(self._wrapped, name)


p = Proxy([1, 2])
p.append(3)
print(p._wrapped)    # [1, 2, 3]`, lang: 'python' },
      explanation: py`Inside \`__getattr__\`, \`self._wrapped\` is itself an attribute lookup. If it fails, Python calls \`__getattr__("_wrapped")\`, which looks up \`self._wrapped\` again… forever. Guard your own field names, and remember \`copy\`/\`pickle\` can create instances without running \`__init__\`.`,
    },
    {
      title: 'Reaching through a chain of parts',
      wrong: { code: py`def checkout(order):
    order.customer.wallet.balance -= order.total   # knows 3 levels of internals`, lang: 'python' },
      right: { code: py`class Customer:
    def __init__(self, wallet):
        self.wallet = wallet

    def pay(self, amount):
        self.wallet.pay(amount)        # Wallet.pay enforces "no overspending"


def checkout(order_total, customer):
    customer.pay(order_total)          # ask, don't reach in`, lang: 'python' },
      explanation: py`Composition hides parts *behind* an object's methods. If callers dig through \`a.b.c.d\`, every caller breaks when the structure changes, and the rules (like "can't overspend") get skipped. Give each object a method that delegates one level down.`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'Hero' object has no attribute 'damage'`,
      cause: py`Calling a part's method on the whole object — \`hero.damage()\` instead of \`hero.weapon.damage()\`. With composition the method lives on the part, not the container.`,
      fix: py`Either call through the part (\`hero.weapon.damage()\`) or, if callers really need it, add a small delegating method \`def damage(self): return self.weapon.damage()\`.`,
    },
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute 'damage'`,
      cause: py`A part was never provided: the parameter defaulted to \`None\` and \`__init__\` stored it without building a replacement.`,
      fix: py`Build a default part when \`None\` is passed (\`weapon if weapon is not None else Fists()\`), or make the parameter required so the mistake fails at construction time.`,
    },
    {
      symptom: py`RecursionError: maximum recursion depth exceeded (inside __getattr__)`,
      cause: py`\`__getattr__\` looks up an attribute that doesn't exist on the wrapper (often the wrapped object's own field, misspelt or not yet set), which triggers \`__getattr__\` again.`,
      fix: py`Check the spelling in \`__init__\`; raise \`AttributeError\` for the wrapper's own private names inside \`__getattr__\`; use \`object.__getattribute__(self, "_wrapped")\` if you must bypass the hook.`,
    },
    {
      symptom: py`TypeError: object of type 'Proxy' has no len()`,
      cause: py`Implicit special-method calls (\`len()\`, indexing, iteration, \`with\`) look the dunder up on the class and never consult \`__getattr__\`.`,
      fix: py`Define the special methods you need on the wrapper explicitly: \`def __len__(self): return len(self._wrapped)\`.`,
    },
    {
      symptom: py`Two objects mysteriously share state — adding an item to one shows up in the other.`,
      cause: py`Both were given the same part object: a shared default argument, or the same instance passed to both constructors.`,
      fix: py`Print \`a.backpack is b.backpack\` to confirm. Create a fresh part per owner (\`None\` default, \`default_factory\`) unless sharing is intentional.`,
    },
  ],
  bestPractices: [
    'Ask "is-a or has-a?" before writing class X(Y). Inherit only for genuine, permanent is-a relationships with a base class designed for extension.',
    'Pass parts into __init__ (dependency injection) so they can be swapped at runtime and replaced by fakes in tests.',
    'Default an optional part to None and build a fresh one inside __init__ — never put a part object in the signature.',
    'Prefer explicit delegating methods; keep __getattr__ forwarding for truly generic wrappers, and define needed dunders explicitly.',
    'Keep each part small with one job (a formatter formats, a destination writes); combine them instead of subclassing per combination.',
    'Let objects delegate one level at a time instead of making callers reach through chains like a.b.c.d.',
    'Wrap built-in containers (or use UserDict/UserList) when you need to customise them, instead of subclassing dict or list.',
  ],
  useCases: [
    'Game entities built from components: weapon, armour, movement, AI behaviour.',
    'Loggers and exporters that combine a format (text, JSON, CSV) with a destination (console, file, network).',
    'Services that receive a repository, a payment gateway or a clock, so tests can inject fakes.',
    'Wrappers that add behaviour around an object: caching, retrying, logging, access control.',
    'Restricting an interface: a Stack or Queue built on a list that exposes only the safe operations.',
  ],
  whenToUse: {
    use: [
      'The relationship is has-a or uses-a (a car has an engine, a report uses a formatter).',
      'Behaviour needs to vary independently along several dimensions (format × destination).',
      'You want to swap behaviour at runtime or replace a collaborator in tests.',
      'You want to reuse code from a class you do not control or that was not designed for subclassing.',
    ],
    avoid: [
      'The relationship really is is-a and the base class was designed to be extended (exceptions, TestCase, ABC interfaces).',
      'A framework requires subclassing its base class to plug in (follow the framework).',
      'You would need to forward dozens of methods one by one just to look like the parent — that may genuinely be is-a.',
    ],
  },
  comparison: {
    title: 'Inheritance vs composition',
    headers: ['', 'Inheritance (is-a)', 'Composition (has-a)'],
    rows: [
      ['Relationship', 'ElectricCar is a Car', 'Car has an Engine'],
      ['Coupling', 'to the parent\'s public AND internal behaviour', 'only to the part\'s public methods'],
      ['Interface you get', 'every parent method, wanted or not', 'only the methods you choose to expose'],
      ['Change behaviour at runtime', 'no — the class is fixed when the object is made', 'yes — re-bind an attribute'],
      ['Combining options', 'one subclass per combination (multiplies)', 'one part per option (adds)'],
      ['Testing', 'often needs patching the parent', 'inject a fake part'],
      ['Best for', 'genuine type hierarchies, framework extension points', 'assembling behaviour from reusable parts'],
    ],
    note: py`Most real designs mix both: inherit (or implement) an *interface* such as an [abstract base class](lesson:abstract-base-classes) or a [Protocol](lesson:protocols), and compose the *implementation* from parts.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'composition-q1',
      type: 'mcq',
      prompt: 'Which design describes a **has-a** relationship that should be modelled with composition?',
      options: [
        { text: 'class SavingsAccount(Account)', why: 'A savings account genuinely IS an account — that is a reasonable is-a relationship.' },
        'A Playlist with a self.songs list attribute and an add_song() method',
        { text: 'class Square(Shape)', why: 'A square IS a shape. Inheritance (or implementing a shape interface) fits.' },
        { text: 'class ValidationError(ValueError)', why: 'Exception hierarchies are a classic, correct use of inheritance: a ValidationError IS a ValueError.' },
      ],
      answer: 1,
      explanation: py`A playlist *has* songs; it is not itself a list of everything a list can do. Storing the songs as a part and exposing \`add_song()\` is composition.`,
    },
    {
      id: 'composition-q2',
      type: 'output',
      prompt: 'Two cars are built with the same engine object. What does this print?',
      code: py`class Engine:
    def __init__(self, hp):
        self.hp = hp

class Car:
    def __init__(self, engine):
        self.engine = engine

shared = Engine(100)
a = Car(shared)
b = Car(shared)
a.engine.hp += 50
b.engine = Engine(80)
print(a.engine.hp, b.engine.hp, shared.hp)`,
      options: [
        { text: '150 80 100', why: 'a.engine IS shared — the same object — so tuning it through a also changes shared.hp.' },
        '150 80 150',
        { text: '150 150 150', why: 'b.engine was re-bound to a brand-new Engine(80) before printing.' },
        { text: '150 80 130', why: 'Re-binding b.engine creates a new engine; it never changes the old one.' },
      ],
      answer: 1,
      explanation: py`Both cars start with references to one engine. \`a.engine.hp += 50\` mutates that shared engine (so \`shared.hp\` is 150 too). \`b.engine = Engine(80)\` only moves *b's* attribute to a new object.`,
    },
    {
      id: 'composition-q3',
      type: 'bug',
      prompt: 'After this runs, Ben somehow owns Ada\'s potion. Click the line that causes it.',
      code: py`class Backpack:
    def __init__(self):
        self.items = []

class Hero:
    def __init__(self, name, backpack=Backpack()):
        self.name = name
        self.backpack = backpack

ada = Hero("Ada")
ben = Hero("Ben")
ada.backpack.items.append("potion")
print(ben.backpack.items)`,
      answerLine: 6,
      explanation: py`\`Backpack()\` in the signature runs **once**, when \`def\` executes, so both heroes get the same backpack. Use \`backpack=None\` and create \`Backpack()\` inside \`__init__\`.`,
    },
    {
      id: 'composition-q4',
      type: 'fill',
      prompt: 'Complete the wrapper so that any attribute not defined on `Logged` is forwarded to the wrapped object.',
      code: py`class Logged:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def ___(self, name):
        print("forwarding", name)
        return ___(self._wrapped, name)`,
      answer: [['__getattr__'], ['getattr']],
      explanation: py`\`__getattr__\` runs only when normal lookup fails, and \`getattr(obj, name)\` fetches an attribute by its string name. Together they forward everything the wrapper doesn't define itself.`,
    },
    {
      id: 'composition-q5',
      type: 'output',
      prompt: 'The subclass counts items as they are added. What does it print?',
      code: py`class Inventory:
    def __init__(self):
        self.items = []
    def add(self, item):
        self.items.append(item)
    def add_many(self, items):
        for item in items:
            self.add(item)

class CountingInventory(Inventory):
    def __init__(self):
        super().__init__()
        self.added = 0
    def add(self, item):
        self.added += 1
        super().add(item)
    def add_many(self, items):
        self.added += len(items)
        super().add_many(items)

inv = CountingInventory()
inv.add_many(["apple", "pear", "fig"])
print(inv.added)`,
      options: [
        { text: '3', why: 'add_many adds 3, but the parent\'s add_many then calls self.add — which is the subclass\'s add — three more times.' },
        '6',
        { text: '0', why: 'Both overridden methods increase the counter.' },
        { text: 'RecursionError', why: 'super().add() calls Inventory.add, which only appends; there is no loop.' },
      ],
      answer: 1,
      explanation: py`This is the **fragile base class** problem. \`Inventory.add_many\` internally calls \`self.add\`, and \`self\` is a \`CountingInventory\`, so each item is counted twice. The subclass silently depends on a private implementation detail of its parent.`,
    },
    {
      id: 'composition-q6',
      type: 'mcq',
      prompt: '`Proxy` forwards attributes with `__getattr__` to a wrapped list. `p.count(2)` works, but `len(p)` raises `TypeError`. Why?',
      options: [
        { text: '__getattr__ only works for methods with arguments', why: 'It works for any attribute name, with or without arguments.' },
        'len() looks up __len__ on the class, bypassing __getattr__ on the instance',
        { text: 'Lists do not have a __len__ method', why: 'They do — p.__len__() even works through the proxy, because that is a normal attribute lookup.' },
        { text: 'The proxy must inherit from list to be wrapped', why: 'Wrapping needs no inheritance; the problem is only how special methods are looked up.' },
      ],
      answer: 1,
      explanation: py`Implicit special-method calls (\`len()\`, \`[]\`, \`for\`, \`with\`) look the dunder up on the **type** and never call \`__getattr__\`. A delegating wrapper must define \`__len__\` and friends explicitly.`,
    },
    {
      id: 'composition-q7',
      type: 'short',
      prompt: 'In your own words: what does "favour composition over inheritance" mean, and give one situation where inheritance is still the right choice.',
      answer: py`It means: when you want to reuse behaviour, prefer giving an object parts (attributes holding other objects) and delegating to them, rather than subclassing. Composition couples you only to a part's public methods, lets you swap parts at runtime and in tests, and avoids one-subclass-per-combination explosions. Inheritance is still right for a genuine, stable is-a relationship with a base class designed for extension — for example custom exceptions (class PaymentError(Exception)) or implementing an abstract base class.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'stack-by-composition',
      title: 'A stack that is not a list',
      difficulty: 'intermediate',
      prompt: py`The starter's \`Stack\` inherits from \`list\`, so users can call \`insert\`, \`sort\` or \`remove\` and break the "last in, first out" rule. Rewrite it with **composition**:

- \`class Stack\` must **not** inherit from \`list\`; store the items in a list attribute named \`_items\`.
- \`push(item)\` adds an item to the top (returns \`None\`).
- \`pop()\` removes and returns the top item. On an empty stack raise \`IndexError("pop from empty stack")\`.
- \`peek()\` returns the top item **without** removing it. On an empty stack raise \`IndexError("peek from empty stack")\`.
- \`is_empty()\` returns \`True\`/\`False\`, and \`len(stack)\` returns the number of items (define \`__len__\`).
- A \`Stack\` must have **no** \`insert\` attribute.`,
      files: {
        'main.py': py`class Stack(list):
    """Last in, first out. TODO: use composition instead of inheriting from list."""

    def push(self, item):
        self.append(item)

    def peek(self):
        return self[-1]

    def is_empty(self):
        return len(self) == 0


plates = Stack()
plates.push("blue")
plates.push("red")
print(plates.peek(), len(plates))
`,
      },
      hints: [
        'Remove (list) from the class line and add an __init__ that creates self._items = [].',
        'Every method now forwards to self._items: append for push, pop() for pop, self._items[-1] for peek, len(self._items) for __len__.',
        'For the empty case, check `if not self._items:` first and `raise IndexError("pop from empty stack")` (and the peek message for peek).',
      ],
      solution: {
        explanation: py`\`Stack\` now *has a* list instead of *being* one. Each public method delegates one job to \`self._items\`, and anything we didn't write — \`insert\`, \`sort\`, \`remove\` — simply doesn't exist, so the LIFO invariant can't be broken from outside. The empty checks turn the list's generic \`IndexError: pop from empty list\` into messages that talk about stacks, which is what callers think they're using. \`__len__\` makes the built-in \`len()\` work (see [container protocols](lesson:container-protocols)).`,
        files: {
          'main.py': py`class Stack:
    """Last in, first out, built on a list it owns."""

    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        if not self._items:
            raise IndexError("peek from empty stack")
        return self._items[-1]

    def is_empty(self):
        return not self._items

    def __len__(self):
        return len(self._items)


plates = Stack()
plates.push("blue")
plates.push("red")
print(plates.peek(), len(plates))
`,
        },
      },
      tests: [
        { name: 'Stack does not inherit from list', code: py`assert not issubclass(Stack, list), 'Remove (list): a Stack should HAVE a list, not BE one'` },
        { name: 'items live in _items', code: py`s = Stack()
s.push(1)
assert s._items == [1]` },
        { name: 'pop returns items last-in, first-out', code: py`s = Stack()
for x in ["a", "b", "c"]:
    s.push(x)
assert [s.pop(), s.pop(), s.pop()] == ["c", "b", "a"]` },
        { name: 'peek does not remove the top item', code: py`s = Stack()
s.push("x")
assert s.peek() == "x" and len(s) == 1` },
        { name: 'is_empty and len work', code: py`s = Stack()
assert s.is_empty() is True and len(s) == 0
s.push(5)
assert s.is_empty() is False and len(s) == 1` },
        { name: 'empty pop and peek raise IndexError with stack messages', code: py`with raises(IndexError, match="pop from empty stack"):
    Stack().pop()
with raises(IndexError, match="peek from empty stack"):
    Stack().peek()` },
        { name: 'no insert method leaks through', code: py`assert not hasattr(Stack(), "insert")` },
      ],
    },
    {
      id: 'composed-logger',
      title: 'Refactor the logger explosion',
      difficulty: 'intermediate',
      prompt: py`Instead of four subclasses (\`TextConsoleLogger\`, \`JsonFileLogger\`…), build one \`Logger\` from two parts. The starter already has the parts; finish the job:

- \`TextFormatter().format(level, message)\` returns \`"[LEVEL] message"\`, e.g. \`"[INFO] server started"\` (already done).
- \`JsonFormatter().format(level, message)\` must return \`json.dumps({"level": level, "message": message})\`.
- \`ConsoleDestination().write(line)\` prints the line (done); \`MemoryDestination().write(line)\` appends it to its \`lines\` list (done).
- \`Logger(formatter, destination)\` stores the parts as \`self.formatter\` and \`self.destination\`; \`log(level, message)\` formats the message with the formatter and writes the result to the destination.
- \`Logger\` must inherit from nothing but \`object\`.`,
      files: {
        'main.py': py`import json


class TextFormatter:
    def format(self, level, message):
        return f"[{level}] {message}"


class JsonFormatter:
    def format(self, level, message):
        return ""   # TODO: return a JSON string with "level" and "message"


class ConsoleDestination:
    def write(self, line):
        print(line)


class MemoryDestination:
    def __init__(self):
        self.lines = []

    def write(self, line):
        self.lines.append(line)


class Logger:
    def __init__(self, formatter, destination):
        pass   # TODO: store both parts

    def log(self, level, message):
        pass   # TODO: format, then write


logger = Logger(TextFormatter(), ConsoleDestination())
logger.log("INFO", "server started")
`,
      },
      hints: [
        'Logger only needs two attributes and one line of real work. The parts do the rest.',
        'In __init__: self.formatter = formatter and self.destination = destination. In log: build line = self.formatter.format(level, message).',
        'self.destination.write(self.formatter.format(level, message)) — and JsonFormatter returns json.dumps({"level": level, "message": message}).',
      ],
      solution: {
        explanation: py`\`Logger\` knows *that* messages get formatted and written, but not *how*. Those decisions live in the parts, so 2 formatters × 2 destinations give 4 behaviours from 4 small classes plus one \`Logger\` — and a CSV formatter would be one more class, not two more subclasses. \`MemoryDestination\` is a test double: injecting it lets tests read the output from a list instead of capturing the console. Swapping \`logger.formatter\` at runtime works because a part is just an attribute.`,
        files: {
          'main.py': py`import json


class TextFormatter:
    def format(self, level, message):
        return f"[{level}] {message}"


class JsonFormatter:
    def format(self, level, message):
        return json.dumps({"level": level, "message": message})


class ConsoleDestination:
    def write(self, line):
        print(line)


class MemoryDestination:
    def __init__(self):
        self.lines = []

    def write(self, line):
        self.lines.append(line)


class Logger:
    def __init__(self, formatter, destination):
        self.formatter = formatter
        self.destination = destination

    def log(self, level, message):
        self.destination.write(self.formatter.format(level, message))


logger = Logger(TextFormatter(), ConsoleDestination())
logger.log("INFO", "server started")
`,
        },
      },
      tests: [
        { name: 'text + memory stores a formatted line', code: py`mem = MemoryDestination()
Logger(TextFormatter(), mem).log("INFO", "server started")
assert mem.lines == ["[INFO] server started"]` },
        { name: 'JsonFormatter returns valid JSON', code: py`import json
assert json.loads(JsonFormatter().format("ERROR", "disk full")) == {"level": "ERROR", "message": "disk full"}` },
        { name: 'json + memory works', code: py`import json
mem = MemoryDestination()
Logger(JsonFormatter(), mem).log("WARN", "slow request")
assert json.loads(mem.lines[0]) == {"level": "WARN", "message": "slow request"}` },
        { name: 'text + console prints the line', code: py`printed = capture(Logger(TextFormatter(), ConsoleDestination()).log, "WARN", "disk almost full")
assert printed == "[WARN] disk almost full\n"` },
        { name: 'parts can be swapped at runtime', code: py`mem = MemoryDestination()
lg = Logger(TextFormatter(), mem)
lg.log("INFO", "a")
lg.formatter = JsonFormatter()
lg.log("INFO", "b")
assert mem.lines[0] == "[INFO] a" and mem.lines[1].startswith("{")` },
        { name: 'Logger uses composition, not inheritance', code: py`assert Logger.__bases__ == (object,)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'composition-is-a-has-a',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between an is-a and a has-a relationship, and how does each look in Python?',
      answer: 'is-a means one type is a specialised kind of another and is modelled with inheritance (class SavingsAccount(Account)). has-a means an object contains or uses another object and is modelled with composition: the part is stored as an attribute (self.engine = engine) and the owner delegates work to it.',
      explanation: py`Saying the sentence out loud is a good test. "A savings account is an account" — inheritance. "A car is an engine" — clearly false; a car *has* an engine, so it stores one and calls \`self.engine.start()\`. In Python there's no special syntax for composition: it's just attributes referring to other objects.`,
      code: { lang: 'python', code: py`class Account:
    def __init__(self, balance=0):
        self.balance = balance


class SavingsAccount(Account):          # is-a
    rate = 0.03


class Engine:
    def start(self):
        return "vroom"


class Car:
    def __init__(self, engine):
        self.engine = engine            # has-a

    def start(self):
        return self.engine.start()      # delegation` },
      whyAsked: 'It is the entry point to every OOP design discussion; interviewers check you choose the relationship deliberately rather than reaching for inheritance by default.',
      mistakes: ['Saying composition needs special syntax or a library', 'Using inheritance for code reuse when the sentence "X is a Y" is false', 'Not mentioning delegation'],
      followUps: ['Why is a Stack not a good subclass of list?', 'Can an object use both inheritance and composition?', 'What is delegation?'],
      modelAnswer: 'An is-a relationship means one type is a more specific version of another — a savings account is an account — and in Python I model it with inheritance, class SavingsAccount(Account). A has-a relationship means an object is built from or uses another object — a car has an engine — and I model it with composition: I pass the engine into the constructor, store it as self.engine, and the car delegates by calling self.engine.start(). My quick test is to say the sentence out loud; if "X is a Y" is not true in every situation, I compose. Most real classes use both: they implement an interface by inheritance and assemble their behaviour from parts.',
    },
    {
      id: 'composition-why-over-inheritance',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Why do people say "favour composition over inheritance"? Give concrete problems inheritance causes.',
      answer: 'Inheritance couples a subclass to its parent\'s implementation (the fragile base class problem), exposes every parent method whether you want it or not, fixes behaviour at class-definition time, and multiplies classes when behaviour varies along several dimensions. Composition depends only on a part\'s public interface, exposes just what you choose, can be swapped at runtime and in tests, and adds one class per option instead of one per combination.',
      explanation: py`Four concrete problems: (1) **fragile base class** — a parent method that internally calls an overridable method makes subclasses depend on that hidden detail; (2) **interface leakage** — \`class Stack(list)\` inherits \`insert\` and \`sort\`; (3) **rigidity** — an object can't change its class at runtime, but it can change a part; (4) **class explosion** — formats × destinations subclasses. Composition solves each, at the cost of writing small forwarding methods.`,
      whyAsked: 'Checks that you know the reasons behind a famous rule instead of repeating the slogan, and that you know its limits.',
      mistakes: ['Saying inheritance is always bad', 'Only saying "composition is more flexible" without a concrete failure mode', 'Forgetting the cost of composition (forwarding boilerplate)'],
      followUps: ['When is inheritance clearly the better tool?', 'How would you refactor a 3-level hierarchy into composition?', 'What is the fragile base class problem exactly?'],
      modelAnswer: 'Inheritance is the tightest coupling you can create between two classes: the subclass depends not just on what the parent promises but on how it is implemented. If a parent method quietly calls another method the subclass overrides, changing that detail can break the subclass — that is the fragile base class problem. Inheritance also hands you every parent method, so a Stack that subclasses list suddenly has insert and sort. And when behaviour varies along two axes, like format and destination, you end up with one subclass per combination. With composition I give the object parts and delegate to them, so I depend only on their public methods, expose exactly what I want, can swap parts at runtime or inject fakes in tests, and new options add a class instead of multiplying them. The trade-off is a few forwarding methods, and inheritance is still right for real is-a hierarchies like exceptions.',
    },
    {
      id: 'composition-dict-subclass',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this print in CPython, and what does it tell you about subclassing built-ins?',
      code: { lang: 'python', code: py`class UpperDict(dict):
    def __setitem__(self, key, value):
        super().__setitem__(key, value.upper())

d = UpperDict()
d["a"] = "x"
d.update(b="y")
print(d)` },
      options: ["{'a': 'X', 'b': 'Y'}", "{'a': 'X', 'b': 'y'}", "{'a': 'x', 'b': 'y'}", 'TypeError'],
      correctOption: 1,
      answer: "{'a': 'X', 'b': 'y'} — d[\"a\"] = ... calls the override, but dict.update (implemented in C) stores items directly without calling your __setitem__.",
      explanation: py`The built-in \`dict\`'s methods don't promise to route through each other, so overriding one method doesn't change the others (\`update\`, \`setdefault\`, the constructor). That's the fragile base class problem in miniature. Fixes: subclass \`collections.UserDict\` (pure Python, it calls \`__setitem__\` from \`update\`), or wrap a dict with composition and expose only the methods you control.`,
      whyAsked: 'A classic trap that reveals whether you understand that inheriting from a class couples you to its implementation, not just its documented behaviour.',
      mistakes: ['Assuming every dict method goes through __setitem__', 'Calling it a Python bug rather than a documented-by-omission implementation choice', 'Not knowing UserDict exists'],
      followUps: ['How does collections.UserDict avoid this?', 'Which other dict methods bypass the override?', 'How would a composition-based version look?'],
      modelAnswer: "It prints {'a': 'X', 'b': 'y'}. The square-bracket assignment calls my overridden __setitem__, so 'a' is upper-cased, but dict.update is implemented in C in CPython and inserts directly, never calling my method, so 'b' stays lower-case. The constructor and setdefault behave the same way. The lesson is that subclassing couples me to how the parent is implemented, not just to its interface. If I need a customised mapping I subclass collections.UserDict, which is written in Python and routes update through __setitem__, or I wrap a dict and expose only the operations I control.",
    },
    {
      id: 'composition-getattr-proxy',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate wrote a generic proxy with `__getattr__`. `proxy.append(1)` works, but `len(proxy)` raises `TypeError`, and in another code path copying a proxy crashes with `RecursionError`. Explain both.',
      code: { lang: 'python', code: py`class Proxy:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def __getattr__(self, name):
        return getattr(self._wrapped, name)` },
      answer: 'len() looks up __len__ on the type, not the instance, so __getattr__ never runs — special methods must be defined explicitly. copy.copy creates the new instance without running __init__, so _wrapped is missing; looking it up inside __getattr__ calls __getattr__ again, recursing forever. Guard the wrapper\'s own names (raise AttributeError for "_wrapped") or define __copy__.',
      explanation: py`\`__getattr__\` is only a fallback for *explicit* attribute lookups (\`proxy.name\`) that fail. Implicit dunder calls skip it. During copying and unpickling, Python builds the object with \`__new__\`/\`__reduce_ex__\` and may probe attributes (such as \`__setstate__\`) before any instance state exists; if your \`__getattr__\` reads \`self._wrapped\` unguarded, that probe recurses. A guard like \`if name.startswith("_"): raise AttributeError(name)\` (or at least for \`_wrapped\`) fixes it.`,
      whyAsked: 'Generic proxies appear in ORMs, mocks and RPC clients; the two failure modes are well-known and show real understanding of attribute lookup.',
      mistakes: ['Suggesting __getattribute__ as the fix without explaining it intercepts everything', 'Not knowing special methods are looked up on the type', 'Adding try/except RecursionError instead of fixing the cause'],
      followUps: ['What is the difference between __getattr__ and __getattribute__?', 'How would you forward __len__, __iter__ and __getitem__?', 'Why might explicit delegation be better here?'],
      modelAnswer: 'Both bugs come from how __getattr__ works: it is only a fallback, called when a normal attribute lookup fails. len(proxy) does not do a normal instance lookup — implicit special-method calls look __len__ up on the class — so __getattr__ never runs and we get a TypeError; the fix is to define __len__ and any other dunders explicitly. The recursion happens because copy creates the new object without calling __init__, so _wrapped does not exist yet; when copy probes an attribute, __getattr__ runs, reads self._wrapped, which fails and calls __getattr__ again, forever. I guard the wrapper\'s own names by raising AttributeError for them, and honestly I would consider explicit delegation, which avoids both traps and keeps the interface visible to tools.',
    },
    {
      id: 'composition-notifications-design',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 6,
      question: 'You have EmailNotifier and SmsNotifier. Product now wants retries, rate limiting and audit logging, each optional per channel, plus a Slack channel. How do you design it?',
      answer: 'Do not create a subclass per combination. Define one small channel interface (send(recipient, text)) with Email, Sms and Slack implementations, and add retries, rate limiting and audit logging as wrappers that hold another channel and delegate to it. Compose them at start-up: AuditLog(Retry(RateLimit(SmsChannel()))). Inject the composed channel into the service that sends notifications.',
      explanation: py`With inheritance, 3 channels × every on/off combination of 3 features is 3 × 8 = 24 classes. With composition, each feature is a wrapper class that *has a* channel and is itself a channel, so they stack in any order: 3 channels + 3 wrappers = 6 classes. This is the *decorator pattern* (not the same as Python's \`@decorator\` syntax, though the idea is related) — see [design patterns](lesson:design-patterns).`,
      code: { lang: 'python', code: py`class SmsChannel:
    def send(self, recipient, text):
        print(f"SMS to {recipient}: {text}")


class Retry:
    def __init__(self, channel, attempts=3):
        self.channel = channel
        self.attempts = attempts

    def send(self, recipient, text):
        for attempt in range(1, self.attempts + 1):
            try:
                return self.channel.send(recipient, text)
            except ConnectionError:
                if attempt == self.attempts:
                    raise


class AuditLog:
    def __init__(self, channel, log):
        self.channel = channel
        self.log = log

    def send(self, recipient, text):
        self.log.append((recipient, text))
        return self.channel.send(recipient, text)


audit = []
channel = AuditLog(Retry(SmsChannel()), audit)
channel.send("+44 7700 900123", "Your code is 4821")
print(audit)` },
      whyAsked: 'A realistic design question that tests whether you recognise combinatorial explosion and know the composition-based patterns (decorator/wrapper, strategy) that solve it.',
      mistakes: ['Proposing a subclass per combination', 'Putting if/else flags for every feature inside each notifier', 'Forgetting how the pieces are wired and injected'],
      followUps: ['Does the order of wrappers matter? (retry inside or outside rate limiting?)', 'How would you test Retry without a real network?', 'How would you type-hint "anything with send()"? (Protocol)'],
      modelAnswer: 'I would avoid a subclass per combination, because three channels times every on/off combination of three features is already 24 classes. Instead I define a tiny channel interface — one send method — and implement it for email, SMS and Slack. Each cross-cutting feature, like retries, rate limiting or audit logging, becomes a wrapper that holds another channel and is itself a channel, so they stack: AuditLog(Retry(SmsChannel())). That is the decorator pattern built with composition, and it means six small classes instead of dozens. The notification service receives the composed channel through its constructor, so in tests I inject a fake channel that records messages. I would also think about ordering, for example whether a retry should count against the rate limit.',
    },
    {
      id: 'composition-cached-fetcher',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `CachedFetcher(fetcher)`: it wraps any object that has a `fetch(key)` method and exposes its own `fetch(key)` that calls the wrapped fetcher only the first time each key is requested, returning the cached value afterwards. Store the wrapped object as `self.fetcher`.',
      answer: 'Store the wrapped fetcher and a dict; in fetch, call the wrapped fetch only if the key is not in the dict, then return the cached value.',
      explanation: py`This is composition plus delegation: \`CachedFetcher\` *has a* fetcher and adds behaviour around it. Because it only relies on \`fetch(key)\`, it works with a real HTTP client, a database reader or a test fake — and tests can prove caching by counting calls on a fake. Production versions add cache expiry and a size limit (see \`functools.lru_cache\` in [functools](lesson:functools)).`,
      starter: { files: { 'main.py': py`class WeatherService:
    """Pretend this is slow (a network call)."""

    def fetch(self, city):
        print(f"fetching {city}...")
        return {"city": city, "temp_c": 18}


class CachedFetcher:
    def __init__(self, fetcher):
        self.fetcher = fetcher

    def fetch(self, key):
        # TODO: only call the wrapped fetcher once per key
        return self.fetcher.fetch(key)


weather = CachedFetcher(WeatherService())
print(weather.fetch("Paris"))
print(weather.fetch("Paris"))
` } },
      tests: [
        { name: 'returns what the wrapped fetcher returns', code: py`class Upper:
    def fetch(self, key):
        return key.upper()
assert CachedFetcher(Upper()).fetch("abc") == "ABC"` },
        { name: 'calls the wrapped fetcher only once per key', code: py`class Fake:
    def __init__(self):
        self.calls = []
    def fetch(self, key):
        self.calls.append(key)
        return len(key)
fake = Fake()
c = CachedFetcher(fake)
assert [c.fetch("ab"), c.fetch("ab"), c.fetch("abc"), c.fetch("ab")] == [2, 2, 3, 2]
assert fake.calls == ["ab", "abc"]` },
        { name: 'keeps the wrapped object as self.fetcher', code: py`class Fake:
    def fetch(self, key):
        return key
f = Fake()
assert CachedFetcher(f).fetcher is f` },
        { name: 'the demo fetches Paris only once', code: py`assert output.count("fetching Paris") == 1` },
      ],
      solution: { files: { 'main.py': py`class WeatherService:
    """Pretend this is slow (a network call)."""

    def fetch(self, city):
        print(f"fetching {city}...")
        return {"city": city, "temp_c": 18}


class CachedFetcher:
    def __init__(self, fetcher):
        self.fetcher = fetcher
        self._cache = {}

    def fetch(self, key):
        if key not in self._cache:
            self._cache[key] = self.fetcher.fetch(key)
        return self._cache[key]


weather = CachedFetcher(WeatherService())
print(weather.fetch("Paris"))
print(weather.fetch("Paris"))
` } },
      hints: ['You need somewhere to remember results: a dict created in __init__.', 'In fetch: if the key is not in the dict, ask the wrapped fetcher and store the answer. Then return the stored answer.'],
      whyAsked: 'Wrapping a collaborator to add behaviour (caching, retry, logging) is the most common real use of composition, and the fake-based test shows you think about testability.',
      mistakes: ['Subclassing WeatherService instead of wrapping it, so the cache only works for one class', 'Checking `if self._cache.get(key)` — falsy cached values like 0 or "" would be fetched again', 'Making the cache a class attribute shared by all instances'],
      followUps: ['How would you add expiry (time-to-live)?', 'How would you bound the cache size?', 'Is this thread-safe?'],
      modelAnswer: 'I would make CachedFetcher hold the wrapped fetcher plus a dictionary. Its fetch method checks whether the key is already in the dictionary; if not, it delegates to the wrapped fetcher and stores the result, then returns the stored value. I use "key not in cache" rather than a truthiness check, so falsy results like zero are cached too. Because it depends only on a fetch method, it works with any fetcher — a real client in production, a fake that counts calls in tests. For production I would add a size limit and expiry, or use functools.lru_cache when the inputs are hashable function arguments.',
      challenge: 'Add a `ttl_seconds` parameter and an injectable `clock` with a `now()` method so cached entries expire; test it with a fake clock.',
    },
  ],

  takeaways: [
    'Composition = building objects from other objects (has-a); inheritance = specialising a type (is-a). Say the sentence out loud to choose.',
    'A part is just an attribute that refers to another object; delegation is a method that forwards the work to that part.',
    'Inheritance couples a subclass to its parent\'s implementation (fragile base class) and exposes every parent method; composition depends only on the part\'s public methods.',
    'Varying behaviour along several dimensions with subclasses multiplies classes; with composition each option is one small part.',
    'Pass parts in (dependency injection) so they can be swapped at runtime and replaced by fakes in tests; default to None and build a fresh part inside __init__.',
    '__getattr__ can forward unknown attributes automatically, but implicit dunder calls like len() bypass it and an unguarded lookup can recurse — prefer explicit delegation.',
    'Composition over inheritance is a guideline: genuine is-a hierarchies (exceptions, ABC interfaces, framework base classes) still use inheritance.',
  ],
}
