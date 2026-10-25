// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PROXY = py`class Thermostat:
    def __init__(self, room, target):
        self.room = room
        self.target = target

    def heat_up(self, degrees):
        self.target += degrees
        return self.target


class AuditProxy:
    """Wraps any object: logs attribute reads and blocks attribute writes."""

    def __init__(self, wrapped):
        # self._wrapped = ... would go through our own __setattr__ (and be blocked),
        # so store our own attributes with object.__setattr__
        object.__setattr__(self, "_wrapped", wrapped)
        object.__setattr__(self, "log", [])

    def __getattr__(self, name):
        # Only called when normal lookup FAILS, i.e. for names the proxy lacks
        self.log.append(name)
        return getattr(self._wrapped, name)

    def __setattr__(self, name, value):
        raise AttributeError(f"read-only proxy: cannot set {name!r}")

    def __dir__(self):
        return sorted(set(dir(self._wrapped)) | {"log"})


kitchen = Thermostat("kitchen", 20)
proxy = AuditProxy(kitchen)

print(proxy.room, proxy.target)           # forwarded by __getattr__
print(proxy.heat_up(2))                   # methods are attributes too
print(proxy.log)                          # what the proxy forwarded
print(hasattr(proxy, "humidity"))         # AttributeError inside -> False
print(getattr(proxy, "humidity", 45))     # a default instead of an error
try:
    proxy.target = 30                     # __setattr__ blocks it
except AttributeError as error:
    print("AttributeError:", error)
print(kitchen.target)                     # unchanged by the blocked write
print("heat_up" in dir(proxy))            # __dir__ helps autocompletion
`

const SLOTS_LAB = py`import sys
import tracemalloc


class PointDict:
    def __init__(self, x, y):
        self.x = x
        self.y = y


class PointSlots:
    __slots__ = ("x", "y")              # fixed attributes, no per-instance __dict__

    def __init__(self, x, y):
        self.x = x
        self.y = y


def memory_for(cls, count=10_000):
    """Measure (live, in this interpreter) the memory used by count instances."""
    tracemalloc.start()
    points = [cls(i, i) for i in range(count)]
    used, _peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return used


regular, slotted = PointDict(1, 2), PointSlots(1, 2)
print("has __dict__:", hasattr(regular, "__dict__"), hasattr(slotted, "__dict__"))
print(PointSlots.x)                      # each slot is a descriptor on the class

try:
    slotted.z = 3                        # not in __slots__
except AttributeError as error:
    print("AttributeError:", error)

print("sys.getsizeof:", sys.getsizeof(regular), sys.getsizeof(slotted))  # shallow!
dict_bytes, slot_bytes = memory_for(PointDict), memory_for(PointSlots)
print("10,000 points with __dict__ :", dict_bytes, "bytes")
print("10,000 points with __slots__:", slot_bytes, "bytes")
print("slots used less memory:", slot_bytes < dict_bytes)
`

export default {
  id: 'attribute-access',
  title: 'Attribute access: __getattr__, __setattr__ & __slots__',
  summary: 'Customise what obj.name does: __getattr__ for missing attributes, __getattribute__ for every read, __setattr__/__delattr__ for writes, __dir__ for discovery, and __slots__ for fixed, compact instances.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['special-methods', 'properties-and-encapsulation'],
  related: ['descriptors', 'properties-and-encapsulation', 'inheritance', 'multiple-inheritance-mro', 'records-and-slots', 'composition', 'design-patterns', 'object-model', 'memory-management', 'mocking', 'metaclasses', 'container-protocols', 'injection-attacks'],
  tags: ['attribute access', 'attribute lookup', '__getattr__', '__getattribute__', '__setattr__', '__delattr__', '__dir__', '__slots__', '__dict__', 'getattr', 'setattr', 'hasattr', 'delattr', 'vars', 'proxy', 'wrapper', 'delegation', 'descriptors', 'memory', 'tracemalloc'],
  apis: [
    { name: '__getattr__(self, name)', summary: 'Called only when normal attribute lookup fails. Return a value or raise AttributeError.' },
    { name: '__getattribute__(self, name)', summary: 'Called for every attribute read. Delegate to object.__getattribute__(self, name) to avoid infinite recursion. Rarely needed.' },
    { name: '__setattr__(self, name, value) / __delattr__(self, name)', summary: 'Called for every obj.name = value and del obj.name, including inside __init__. Store with super().__setattr__(name, value).' },
    { name: '__dir__(self)', summary: 'Returns the names dir(obj) shows — useful for dynamic attributes and autocompletion.' },
    { name: '__slots__', summary: 'Class attribute listing the allowed instance attributes. Instances get fixed slots instead of a __dict__, use less memory, and can\'t gain new attributes.' },
    { name: 'getattr(obj, name[, default])', summary: 'Reads an attribute whose name is a string; returns default instead of raising AttributeError if given.' },
    { name: 'setattr(obj, name, value) / delattr(obj, name)', summary: 'Assign or delete an attribute by string name — the same as obj.name = value / del obj.name.' },
    { name: 'hasattr(obj, name)', summary: 'True if getattr(obj, name) succeeds; it only catches AttributeError.' },
    { name: 'vars(obj)', summary: 'Returns obj.__dict__ (TypeError for objects without one, e.g. slotted instances).' },
  ],
  docs: [
    { label: 'Data model — customizing attribute access', url: 'https://docs.python.org/3/reference/datamodel.html#customizing-attribute-access' },
    { label: 'Data model — __slots__', url: 'https://docs.python.org/3/reference/datamodel.html#slots' },
    { label: 'Descriptor HowTo Guide (how lookup really works)', url: 'https://docs.python.org/3/howto/descriptor.html' },
    { label: 'Built-in functions — getattr()', url: 'https://docs.python.org/3/library/functions.html#getattr' },
    { label: 'PEP 562 — module __getattr__ and __dir__', url: 'https://peps.python.org/pep-0562/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`The dot is the most-used operator in Python. \`order.total\`, \`self.name\`, \`math.pi\`, \`text.upper\` — every one of them is an **attribute lookup**: "find the thing called *this name* on *this object*". Writing \`order.total = 10\` is an attribute **assignment**, and \`del order.total\` an attribute **deletion**.`,
    py`Like \`len()\` and \`+\`, the dot is driven by special methods. Normally you never see them, because \`object\` provides sensible defaults. But you can hook in:`,
    py`- \`__getattr__\` — runs only when an attribute **can't be found**. Perfect for defaults, proxies and dynamic APIs.
- \`__getattribute__\` — runs on **every** read. Powerful, slow, and easy to get stuck in infinite recursion.
- \`__setattr__\` / \`__delattr__\` — run on every write / delete. For validation, read-only objects and change tracking.
- \`__dir__\` — controls what \`dir(obj)\` (and autocompletion) shows.
- \`__slots__\` — not a method but a declaration: "instances only ever have these attributes", which saves memory and catches typos.`,
    py`This lesson also covers the built-ins that do the same thing with names held in strings — \`getattr\`, \`setattr\`, \`hasattr\`, \`delattr\` — and builds a **proxy** that wraps another object. How properties and methods plug into the same machinery is the subject of [descriptors](lesson:descriptors).`,
  ],
  why: [
    py`Some objects can't know their attributes in advance. A config object loaded from JSON, a client for a web API with hundreds of endpoints, a test double that should accept any method call (that's how \`unittest.mock.Mock\` works — see [mocking](lesson:mocking)) — all of them answer \`obj.whatever\` on the fly with \`__getattr__\`.`,
    py`Others need to *control* attributes: reject a negative price at the moment it's assigned, freeze an object after creation, log every change for an audit trail, or wrap an object and forward calls to it ([composition](lesson:composition) without writing a hundred one-line methods).`,
    py`And when you create millions of small objects — points, sensor readings, game entities — \`__slots__\` can cut their memory noticeably and stop typos like \`reading.temprature = 21\` from silently creating a brand-new attribute.`,
  ],
  eli15: [
    py`Imagine every object has a backpack (its \`__dict__\`) and belongs to a club (its class). When you ask for \`obj.colour\`, Python checks the backpack first, then the club's notice board, then the notice boards of bigger clubs it belongs to (the parent classes).`,
    py`\`__getattr__\` is a helpful friend who only speaks up when all those places come up empty: "No colour in the backpack or on any board? Fine — I'll make something up, or go ask somebody else." \`__getattribute__\` is a security guard who intercepts *every* question before anyone even looks in the backpack. \`__setattr__\` is a bouncer standing at the backpack's zip: everything you try to put in has to get past them.`,
    py`\`__slots__\` swaps the backpack for a pencil case with exactly three labelled compartments. It's lighter, and there's simply nowhere to put a fourth thing.`,
  ],
  analogy: {
    title: 'A hotel reception desk',
    body: [
      py`A guest asks reception for "the spa". The receptionist first checks the guest's own booking (instance \`__dict__\`), then the hotel's facility list (the class), then the hotel chain's shared services (parent classes). That's normal attribute lookup.`,
      py`If nothing matches, a well-run hotel has a concierge (\`__getattr__\`) who can still help — "we don't have a spa, but I can book one next door" — which is exactly what a proxy does. A paranoid hotel might route *every* request through a supervisor first (\`__getattribute__\`): thorough, but everything slows down, and if the supervisor has to ask reception to check *their own* name badge, the queue loops forever. Changing a booking goes through the front desk's rules (\`__setattr__\`). And a capsule hotel (\`__slots__\`) gives every guest the same fixed lockers — cheap and compact, but you can't ask for an extra cupboard.`,
    ],
    mapping: [
      ['the guest\'s own booking', 'the instance __dict__'],
      ['the hotel\'s facility list, then the chain\'s', 'the class, then base classes in MRO order'],
      ['the concierge who helps when nothing matched', '__getattr__ — only on a failed lookup'],
      ['a supervisor who intercepts every request', '__getattribute__ — runs on every read'],
      ['front-desk rules for changing a booking', '__setattr__ / __delattr__'],
      ['capsule-hotel lockers', '__slots__ — fixed attribute storage, no extras'],
      ['"we can\'t help you" at the end', 'AttributeError'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: '__setattr__ on every write, __getattr__ only on a miss',
    props: {
      code: py`class Preferences:
    def __init__(self, theme):
        self.theme = theme                # runs __setattr__ too

    def __setattr__(self, name, value):
        print("set", name, "=", value)
        super().__setattr__(name, value)  # actually store it

    def __getattr__(self, name):
        print("missing:", name)
        if name.startswith("_"):
            raise AttributeError(name)
        return "default"


prefs = Preferences("dark")
print(prefs.theme)
print(prefs.font)
prefs.font = "mono"
print(prefs.font)
print(hasattr(prefs, "_secret"))
`,
      notes: {
        3: 'Even inside `__init__`, `self.theme = theme` goes through **your** `__setattr__`. Watch a new frame open.',
        7: '`super().__setattr__` is `object.__setattr__`: it does the real work of putting `theme` into the instance `__dict__`. Writing `self.theme = value` here would call this method again, forever.',
        17: '`theme` is found in the instance dict, so `__getattr__` is **not** called — no frame opens.',
        18: '`font` doesn\'t exist yet. Normal lookup fails, so Python calls `__getattr__("font")`, which returns `"default"`.',
        20: 'Now `font` is a real attribute (set on line 19), so `__getattr__` stays quiet.',
        21: '`hasattr` calls `getattr` and catches `AttributeError`. Our `__getattr__` raises it for private names, so the answer is `False`.',
      },
    },
    alt: 'A step-by-step trace of a Preferences class. Creating the object calls __setattr__ for theme. Reading prefs.theme finds it in the instance dictionary without calling __getattr__. Reading prefs.font calls __getattr__, which prints missing: font and returns default. Assigning prefs.font calls __setattr__ again. Reading prefs.font afterwards finds the real attribute. hasattr(prefs, "_secret") calls __getattr__, which raises AttributeError, so hasattr returns False.',
    caption: py`Count the frames: \`__setattr__\` opens for **every** assignment, while \`__getattr__\` opens only when a name is genuinely missing. That asymmetry is the most important fact in this lesson.`,
  },
  syntax: [
    py`#### The hooks`,
    { code: py`class Example:
    def __getattr__(self, name):          # obj.name — only if NOT found normally
        raise AttributeError(f"{type(self).__name__!r} object has no attribute {name!r}")

    def __getattribute__(self, name):     # obj.name — EVERY read (rarely needed)
        return super().__getattribute__(name)

    def __setattr__(self, name, value):   # obj.name = value — every write
        super().__setattr__(name, value)

    def __delattr__(self, name):          # del obj.name
        super().__delattr__(name)

    def __dir__(self):                    # dir(obj)
        return sorted(super().__dir__())`, lang: 'python', title: 'each hook, doing exactly what the default does' },
    py`Three rules keep you out of trouble:`,
    py`1. **Raise \`AttributeError\`** for names you can't provide — never \`KeyError\`, never \`return None\`. \`hasattr()\` and \`getattr(obj, name, default)\` only understand \`AttributeError\`.
2. **Never use \`self.something\` the normal way inside \`__getattribute__\` or \`self.x = …\` inside \`__setattr__\`** — it calls the same hook again, forever (\`RecursionError\`). Delegate to \`super()\` / \`object\` instead.
3. **Special methods ignore these hooks.** \`len(obj)\`, \`obj + 1\` and \`for x in obj\` look up \`__len__\`, \`__add__\`, \`__iter__\` directly on the class — \`__getattr__\` and \`__getattribute__\` never see them ([special methods](lesson:special-methods)).`,
    py`#### Attributes by name: getattr, setattr, hasattr, delattr`,
    { code: py`class Thermostat:
    def __init__(self):
        self.target = 20


t = Thermostat()
field = "target"                        # a name held in a string
print(getattr(t, field))                # 20 — same as t.target
print(getattr(t, "humidity", 45))       # 45 — default instead of AttributeError
setattr(t, field, 22)                   # same as t.target = 22
print(hasattr(t, "target"), t.target)   # True 22
delattr(t, "target")                    # same as del t.target
print(hasattr(t, "target"))             # False`, lang: 'python', title: 'the dynamic built-ins' },
    { callout: 'warn', title: 'Never getattr() with untrusted names', text: py`\`getattr(handler, request_name)()\` lets whoever controls \`request_name\` call *any* attribute — private helpers, \`__class__\`, \`__init__\`. Map allowed names to functions explicitly (\`ACTIONS = {"start": handler.start}\`) or check against an allowlist first. See [injection attacks](lesson:injection-attacks).` },
    py`#### __slots__`,
    { code: py`class Reading:
    __slots__ = ("sensor", "celsius")      # the only attributes instances may have

    def __init__(self, sensor, celsius):
        self.sensor = sensor
        self.celsius = celsius


r = Reading("kitchen", 21.5)
r.celsius = 22.0                           # fine: values can still change
# r.temprature = 23                        # AttributeError: 'Reading' object has no attribute
#                                          # 'temprature' and no __dict__ for setting new attributes
print(hasattr(r, "__dict__"))              # False`, lang: 'python', title: 'fixed attributes, no per-instance __dict__' },
    { callout: 'version', title: 'dataclass(slots=True) — Python 3.10+', text: py`\`@dataclass(slots=True)\` generates \`__slots__\` from your fields, so you don't repeat the names. Combine it with \`frozen=True\` for compact, immutable records — see [records & slots](lesson:records-and-slots).` },
  ],
  walkthrough: {
    title: 'Reading the AuditProxy line by line',
    lang: 'python',
    code: PROXY,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 8], text: py`An ordinary class. The proxy will wrap an instance of it without the thermostat knowing.` },
      { lines: [14, 18], text: py`The proxy blocks *all* writes (line 25), including its own — so it stores its two private attributes with \`object.__setattr__\`, the default implementation, bypassing its own hook.` },
      { lines: [20, 23], text: py`\`__getattr__\` runs only for names the proxy doesn't have itself. \`self.log\` and \`self._wrapped\` exist, so using them here doesn't re-enter \`__getattr__\`. Everything else is logged and forwarded with \`getattr(self._wrapped, name)\`.` },
      { lines: [25, 26], text: py`\`__setattr__\` runs for every assignment to the proxy and refuses them all. Raising \`AttributeError\` matches what Python does for read-only attributes.` },
      { lines: [28, 29], text: py`\`__dir__\` combines the wrapped object's names with \`log\`, so \`dir(proxy)\` and editor autocompletion show what really works.` },
      { lines: [35, 37], text: py`\`room\`, \`target\` and \`heat_up\` are forwarded. \`proxy.heat_up\` returns the thermostat's **bound method**, so calling it changes the real thermostat.` },
      { lines: [38, 39], text: py`For \`humidity\`, \`getattr(self._wrapped, …)\` raises \`AttributeError\`, which flows out of \`__getattr__\` — exactly what \`hasattr\` and \`getattr(…, default)\` need.` },
      { lines: [40, 45], text: py`The write is blocked, the thermostat keeps \`22\`, and \`dir()\` lists \`heat_up\` thanks to \`__dir__\`.` },
    ],
  },
  playground: {
    title: 'An audit proxy',
    objective: 'Run it, trace which hook handles each line, then teach the proxy new tricks — and try the __slots__ memory lab variant.',
    files: { 'main.py': PROXY },
    variants: [{ id: 'slots-lab', label: '__slots__ memory lab', files: { 'main.py': SLOTS_LAB } }],
    expected: py`\`\`\`text
kitchen 20
22
['room', 'target', 'heat_up']
False
45
AttributeError: read-only proxy: cannot set 'target'
22
True
\`\`\`

In the **__slots__ memory lab** variant the byte counts are measured live by \`tracemalloc\` in your browser, so the exact numbers depend on the interpreter — but the slotted points always use less.`,
    experiments: [
      {
        id: 'allow-target',
        task: py`Let the proxy accept writes to \`target\` **only**, forwarding them to the wrapped object (\`proxy.target = 25\` should change the real thermostat). Every other name must still raise \`AttributeError\`.`,
        hint: py`In \`__setattr__\`: \`if name == "target": setattr(self._wrapped, name, value)\` — otherwise raise as before.`,
        tests: [
          { name: 'writes to target reach the wrapped object', code: py`p = AuditProxy(Thermostat("hall", 18))
p.target = 21
assert p._wrapped.target == 21 and p.target == 21
assert "target" not in vars(p), 'Forward the write; do not store it on the proxy'` },
          { name: 'other writes are still blocked', code: py`p = AuditProxy(Thermostat("hall", 18))
with raises(AttributeError):
    p.room = "loft"` },
        ],
        explain: py`\`setattr(self._wrapped, name, value)\` runs the *thermostat's* normal assignment, so the value lands in the thermostat's \`__dict__\`. The proxy's own \`__dict__\` stays empty apart from \`_wrapped\` and \`log\` — that's what makes it a transparent wrapper.`,
      },
      {
        id: 'forward-len',
        task: py`Wrap a list: add \`shopping = AuditProxy(["eggs", "milk"])\`, then \`shopping.append("tea")\` and \`print(len(shopping))\`. \`append\` works but \`len()\` crashes. Fix it by giving \`AuditProxy\` a \`__len__\` that returns the wrapped object's length.`,
        hint: py`\`def __len__(self): return len(self._wrapped)\` — special methods must be defined on the proxy class itself.`,
        tests: [
          { name: 'len() works on a proxied list', code: py`assert len(AuditProxy([1, 2, 3])) == 3` },
          { name: '__len__ is defined on AuditProxy', code: py`assert '__len__' in AuditProxy.__dict__` },
        ],
        explain: py`\`len(proxy)\` looks for \`__len__\` on the proxy's **class** and skips \`__getattr__\` entirely — implicit special-method lookup never goes through the attribute hooks. Real proxy libraries define every dunder they want to forward (\`__len__\`, \`__iter__\`, \`__eq__\`, …) explicitly.`,
      },
      {
        id: 'slots-typo',
        task: py`Give \`Thermostat\` the line \`__slots__ = ("room", "target")\`. Then, at the end of the file, try a typo inside \`try\`/\`except AttributeError\`: \`kitchen.tagret = 25\`, printing the error.`,
        hint: py`Put \`__slots__\` directly under \`class Thermostat:\`. The \`try\` block mirrors the existing one that tests \`proxy.target = 30\`.`,
        tests: [
          { name: 'Thermostat declares __slots__', code: py`assert '__slots__' in Thermostat.__dict__` },
          { name: 'instances have no __dict__', code: py`assert not hasattr(kitchen, "__dict__")` },
          { name: 'the typo was rejected and printed', code: py`assert "tagret" in output and not hasattr(kitchen, "tagret")` },
        ],
        explain: py`Without \`__slots__\`, \`kitchen.tagret = 25\` silently creates a new attribute and the real \`target\` never changes — a bug that can hide for weeks. With \`__slots__\` there's no \`__dict__\` to put it in, so Python raises immediately. The proxy still works: \`getattr\` doesn't care how the wrapped object stores its attributes.`,
      },
      {
        id: 'apply-settings',
        task: py`Write a function \`apply_settings(obj, changes)\` that uses \`setattr\` to copy every key/value pair from the dict \`changes\` onto \`obj\`, and returns \`obj\`. Try it on a new \`Thermostat\`.`,
        hint: py`\`for name, value in changes.items(): setattr(obj, name, value)\` then \`return obj\`.`,
        tests: [
          { name: 'apply_settings sets every attribute', code: py`t = Thermostat("a", 1)
result = apply_settings(t, {"room": "studio", "target": 23})
assert (t.room, t.target) == ("studio", 23)
assert result is t` },
        ],
        explain: py`\`setattr(obj, "room", v)\` is exactly \`obj.room = v\`, but the name comes from data. That's handy for loading settings — and dangerous with untrusted input: a request could set \`is_admin\` or overwrite a method. In real code, check each name against an allowlist first.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What obj.name actually does',
    props: {
      width: 760,
      height: 360,
      nodes: [
        { id: 'expr', label: 'obj.name', note: 'you write', x: 100, y: 60, tone: 'yellow' },
        { id: 'ga', label: '__getattribute__', note: 'object\'s default version', x: 330, y: 60, tone: 'blue' },
        { id: 'dd', label: 'data descriptor?', note: 'property, __slots__ member', x: 590, y: 60 },
        { id: 'inst', label: 'obj.__dict__', note: 'instance attributes', x: 590, y: 180 },
        { id: 'cls', label: 'class, then bases', note: 'methods, class attributes (MRO)', x: 590, y: 300 },
        { id: 'getattr', label: '__getattr__', note: 'only if the class defines it', x: 330, y: 300, tone: 'kraft' },
        { id: 'err', label: 'AttributeError', x: 100, y: 300, tone: 'red' },
      ],
      edges: [
        { from: 'expr', to: 'ga', label: 'every read' },
        { from: 'ga', to: 'dd', label: '1' },
        { from: 'dd', to: 'inst', label: 'no' },
        { from: 'inst', to: 'cls', label: 'not there' },
        { from: 'cls', to: 'getattr', label: 'not found' },
        { from: 'getattr', to: 'err', label: 'not defined / raises' },
      ],
      steps: [
        { focus: ['expr', 'ga'], edges: ['expr->ga'], text: py`Every \`obj.name\` read calls \`type(obj).__getattribute__(obj, "name")\`. Almost every class uses the version inherited from \`object\`, which runs the steps below. Override it and you replace *all* of them.` },
        { focus: ['dd'], edges: ['ga->dd'], text: py`First it searches the class and its bases (in [MRO](lesson:multiple-inheritance-mro) order) for \`name\`. If it finds a **data descriptor** — an object with \`__set__\` or \`__delete__\`, like a \`property\` or a \`__slots__\` member — that wins immediately. That's why a property can't be shadowed by an instance attribute.` },
        { focus: ['inst'], edges: ['dd->inst'], text: py`Otherwise it checks the instance's own \`__dict__\` — the attributes you set with \`self.x = …\`.` },
        { focus: ['cls'], edges: ['inst->cls'], text: py`Not there? It uses what it found on the class: a plain class attribute is returned as is, and a function becomes a **bound method** (functions are *non-data* descriptors). Details: [descriptors](lesson:descriptors).` },
        { focus: ['getattr'], edges: ['cls->getattr'], text: py`Nothing anywhere? \`__getattribute__\` raises \`AttributeError\` — and if the class defines \`__getattr__\`, Python catches that and calls \`__getattr__(obj, "name")\` as a last resort.` },
        { focus: ['err'], edges: ['getattr->err'], text: py`No \`__getattr__\`, or it raised \`AttributeError\` itself: the error reaches your code — \`'Thermostat' object has no attribute 'humidity'\`.` },
        { focus: ['expr', 'ga', 'dd', 'inst', 'cls', 'getattr', 'err'], text: py`Writes are simpler: \`obj.name = v\` calls \`__setattr__\`, which uses a data descriptor's \`__set__\` if there is one (a property setter, a slot), otherwise stores into \`obj.__dict__\`. And remember: \`len(obj)\` and other implicit special-method lookups skip this whole diagram.` },
      ],
    },
    alt: 'Flow diagram of attribute lookup. obj.name calls __getattribute__. It first checks the class hierarchy for a data descriptor such as a property, then the instance __dict__, then class attributes and methods along the MRO. If nothing is found and the class defines __getattr__, that is called; otherwise AttributeError is raised.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Instance attributes really do live in a dictionary. \`vars(obj)\` (or \`obj.__dict__\`) shows it, and class attributes live in the class's own \`__dict__\`:`,
      { code: py`class Player:
    team = "Blue"                     # class attribute: shared

    def __init__(self, name):
        self.name = name              # instance attribute: per object


ada = Player("Ada")
print(vars(ada))                      # {'name': 'Ada'}
print(ada.team)                       # Blue — not in vars(ada), found on the class
ada.team = "Red"                      # creates an INSTANCE attribute that shadows it
print(vars(ada), Player.team)         # {'name': 'Ada', 'team': 'Red'} Blue`, lang: 'python', title: 'instance first, then class' },
      py`That "instance, then class, then parent classes" search is what the [inheritance](lesson:inheritance) lessons visualise. The hooks in this lesson let you add your own steps to it.`,
    ],
    technical: [
      py`**The precise read order** (implemented by \`object.__getattribute__\`; simplified here — the [Descriptor HowTo](https://docs.python.org/3/howto/descriptor.html) has the full version):`,
      py`1. Look \`name\` up along \`type(obj).__mro__\`. If the result is a **data descriptor** (defines \`__set__\` or \`__delete__\`), return \`descriptor.__get__(obj, type(obj))\`.
2. Else, if \`name\` is in \`obj.__dict__\`, return that value.
3. Else, if step 1 found a **non-data descriptor** (only \`__get__\`, e.g. a function), return \`__get__(obj, type(obj))\` — a bound method; if it found a plain value, return it.
4. Else raise \`AttributeError\` — and if the class defines \`__getattr__\`, call it instead.`,
      { code: py`class Lamp:
    @property
    def state(self):                  # property = data descriptor
        return "from property"

    def switch(self):                 # function = non-data descriptor
        return "from method"


lamp = Lamp()
lamp.__dict__["state"] = "from instance"
lamp.__dict__["switch"] = lambda: "from instance"
print(lamp.state)       # from property — data descriptors beat the instance dict
print(lamp.switch())    # from instance — the instance dict beats methods`, lang: 'python', title: 'precedence you can observe' },
      py`**__getattr__ is a fallback, so it can hide bugs.** If a property's code raises \`AttributeError\` by accident (say, a typo inside it), Python treats that like "attribute not found" and calls \`__getattr__\`. The real error disappears and you get a misleading message about the *property's* name:`,
      { code: py`class Order:
    def __init__(self, items):
        self.items = items

    @property
    def total(self):
        return sum(item.price for item in self.items)   # ints have no .price!

    def __getattr__(self, name):
        raise AttributeError(f"Order has no field {name!r}")


try:
    Order([1, 2]).total
except AttributeError as error:
    print(error)        # Order has no field 'total' — the real cause is gone`, lang: 'python', title: 'a masked error' },
      py`**Writes.** \`object.__setattr__\` looks for a data descriptor on the class (a property with a setter, a slot) and calls its \`__set__\`; otherwise it writes to \`obj.__dict__\`. A property *without* a setter raises \`AttributeError\`, which is how read-only properties work ([properties](lesson:properties-and-encapsulation)).`,
      py`**\`__slots__\`** makes the class statement create one **member descriptor** per name (\`PointSlots.x\` prints \`<member 'x' of 'PointSlots' objects>\`) and reserve a fixed position for each value inside every instance. No \`__dict__\` is created unless you list \`"__dict__"\` in the slots, and weak references need \`"__weakref__"\` in the slots too. A subclass without its own \`__slots__\` gets a \`__dict__\` again.`,
      py`**Modules have hooks too.** Since Python 3.7 (PEP 562) a module can define a top-level \`__getattr__(name)\` and \`__dir__()\` — often used to emit deprecation warnings for renamed names or to import heavy submodules lazily.`,
      { callout: 'note', title: 'CPython detail: instance memory', text: py`CPython has steadily made ordinary instances cheaper: instances of one class share their dict's key table (PEP 412), and recent versions store attribute values inline, creating a real \`__dict__\` object only when something asks for it. Slots still use less memory, but the gap depends on the version — measure with \`tracemalloc\` (try the *__slots__ memory lab* variant) instead of trusting old numbers. \`sys.getsizeof\` is **shallow**: it reports the object's own block, not the values or dict it points to, and can show the same size for both kinds of instance. The playground is a 32-bit WebAssembly build, so absolute sizes also differ from a 64-bit desktop Python.` },
      { callout: 'note', title: 'CPython detail: fast paths', text: py`Since 3.11 the specialising interpreter caches how to find an attribute (instance dict, slot, class method) at each \`obj.name\` site in your bytecode. A class with a custom \`__getattribute__\` can't use most of these fast paths, so *every* attribute access on it pays for a Python function call. With only \`__getattr__\` defined, most fast paths still apply; its extra cost shows up mainly on misses.` },
    ],
    production: [
      py`**Reach for the narrowest tool.** One computed or validated attribute → a \`property\`. Several attributes sharing the same validation → a descriptor ([descriptors](lesson:descriptors)). Unknown or dynamic names → \`__getattr__\`. Validation of all writes or immutability → \`__setattr__\`, or better, \`@dataclass(frozen=True)\`. \`__getattribute__\` is almost never the right answer outside debugging tools and proxies that must intercept everything.`,
      py`**Proxies and delegation.** \`__getattr__\` forwarding is how lazy-loading objects, remote-API clients, \`unittest.mock.Mock\` and many ORMs work. Remember that dunders aren't forwarded, \`isinstance(proxy, Wrapped)\` is \`False\`, and that \`copy\`, \`pickle\` and \`deepcopy\` create instances *without* calling \`__init__\` — a \`__getattr__\` that touches \`self._wrapped\` then recurses forever. Guard with \`if name.startswith("_"): raise AttributeError(name)\`.`,
      py`**Static tools can't see dynamic attributes.** Type checkers and IDEs know nothing about names produced by \`__getattr__\`. Prefer explicit attributes where possible; when you must be dynamic, annotate \`def __getattr__(self, name: str) -> Any\`, implement \`__dir__\`, and document the available names.`,
      py`**\`__slots__\` in practice.** Worth it for classes with many instances (records, points, events) or when you want typo protection. Costs: no ad-hoc attributes (some libraries and monkey-patching tests expect a \`__dict__\`), every class in a hierarchy must declare \`__slots__\` to keep the benefit, two bases with non-empty slots can't be combined (\`TypeError: multiple bases have instance lay-out conflict\`), and slot names can't also be class attributes, so defaults go in \`__init__\`. \`@dataclass(slots=True)\` handles most of this for you.`,
      py`**Security.** \`getattr(obj, name)\` and \`setattr(obj, name, value)\` with names from requests, files or users are a privilege-escalation risk (setting \`is_admin\`, reaching dunders). Use explicit mappings or allowlists.`,
    ],
  },
  mistakes: [
    {
      title: 'Assigning with self.x inside __setattr__',
      wrong: { code: py`class Account:
    def __setattr__(self, name, value):
        if name == "balance" and value < 0:
            raise ValueError("balance cannot be negative")
        self.name = value            # calls __setattr__ again -> RecursionError`, lang: 'python' },
      right: { code: py`class Account:
    def __setattr__(self, name, value):
        if name == "balance" and value < 0:
            raise ValueError("balance cannot be negative")
        super().__setattr__(name, value)   # object's real storage logic`, lang: 'python' },
      explanation: py`Every \`self.x = …\` and every \`setattr(self, …)\` *is* a call to \`__setattr__\`. Inside the hook itself, hand the real work to \`super().__setattr__\` (or \`object.__setattr__(self, name, value)\`). Note the wrong version also stores the value under the literal name \`"name"\` — a second bug.`,
    },
    {
      title: 'Touching self normally inside __getattribute__',
      wrong: { code: py`class Traced:
    def __getattribute__(self, name):
        self.reads += 1              # self.reads -> __getattribute__ -> self.reads -> ...
        return object.__getattribute__(self, name)`, lang: 'python' },
      right: { code: py`class Traced:
    def __init__(self):
        object.__setattr__(self, "reads", 0)

    def __getattribute__(self, name):
        if name != "reads":
            reads = object.__getattribute__(self, "reads")
            object.__setattr__(self, "reads", reads + 1)
        return object.__getattribute__(self, name)`, lang: 'python' },
      explanation: py`\`__getattribute__\` intercepts *every* read — including \`self.reads\`, \`self.__dict__\` and \`self.some_method\` inside its own body. Fetch anything you need with \`object.__getattribute__(self, ...)\`. If you don't truly need to see every access, use \`__getattr__\` instead.`,
    },
    {
      title: '__getattr__ that raises KeyError or returns None',
      wrong: { code: py`class Config:
    def __init__(self, data):
        self._data = data

    def __getattr__(self, name):
        return self._data[name]      # KeyError for missing names


cfg = Config({"debug": True})
# hasattr(cfg, "port")              -> KeyError escapes! (hasattr only catches AttributeError)`, lang: 'python' },
      right: { code: py`class Config:
    def __init__(self, data):
        self._data = data

    def __getattr__(self, name):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(f"no setting named {name!r}") from None


cfg = Config({"debug": True})
print(hasattr(cfg, "port"), getattr(cfg, "port", 8080))   # False 8080`, lang: 'python' },
      explanation: py`\`hasattr\`, \`getattr(..., default)\`, \`copy\`, \`pickle\` and many libraries probe attributes and expect \`AttributeError\` for "not there". Returning \`None\` is worse: every typo (\`cfg.debgu\`) silently becomes \`None\`.`,
    },
    {
      title: 'A proxy whose __getattr__ recurses when _wrapped is missing',
      wrong: { code: py`class Proxy:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def __getattr__(self, name):
        return getattr(self._wrapped, name)
# copy.copy(proxy) or pickle builds a Proxy WITHOUT calling __init__:
# self._wrapped is missing -> __getattr__("_wrapped") -> self._wrapped -> ... RecursionError`, lang: 'python' },
      right: { code: py`class Proxy:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def __getattr__(self, name):
        if name.startswith("_"):            # never forward private/dunder names
            raise AttributeError(name)
        return getattr(self._wrapped, name)`, lang: 'python' },
      explanation: py`Code that creates instances without \`__init__\` (copying, unpickling, some ORMs) asks for attributes like \`__setstate__\` or \`_wrapped\` on a half-built object. A guard for underscore names breaks the loop and keeps the proxy from leaking private internals.`,
    },
    {
      title: 'Giving a slot a default with a class attribute',
      wrong: { code: py`class Reading:
    __slots__ = ("sensor", "celsius")
    celsius = 0.0          # ValueError: 'celsius' in __slots__ conflicts with class variable`, lang: 'python', static: true },
      right: { code: py`class Reading:
    __slots__ = ("sensor", "celsius")

    def __init__(self, sensor, celsius=0.0):
        self.sensor = sensor
        self.celsius = celsius`, lang: 'python' },
      explanation: py`Each slot name becomes a descriptor stored on the class under that name, so a class attribute with the same name would overwrite it. Put defaults in \`__init__\` (or use \`@dataclass(slots=True)\`, which handles field defaults for you).`,
    },
    {
      title: 'Calling methods by an untrusted name',
      wrong: { code: py`def handle(bot, command, arg):
    return getattr(bot, command)(arg)      # command comes from a chat message!`, lang: 'python' },
      right: { code: py`ALLOWED = {"greet", "weather", "help"}


def handle(bot, command, arg):
    if command not in ALLOWED:
        return f"unknown command {command!r}"
    return getattr(bot, command)(arg)`, lang: 'python' },
      explanation: py`With the wrong version, a user can type \`shutdown\`, \`_reset_database\` or \`__init__\` and call it. Allowlist the names (or map them to functions in a dict) before any dynamic lookup.`,
    },
  ],
  debugging: [
    {
      symptom: py`RecursionError: maximum recursion depth exceeded (traceback full of __setattr__ / __getattribute__ / __getattr__)`,
      cause: py`A hook uses the normal dot syntax on \`self\` for the very operation it intercepts — \`self.x = v\` in \`__setattr__\`, \`self.anything\` in \`__getattribute__\`, or a missing \`self._wrapped\` inside \`__getattr__\`.`,
      fix: py`Use \`super().__setattr__(name, value)\` / \`object.__getattribute__(self, name)\`, and guard \`__getattr__\` against private names.`,
    },
    {
      symptom: py`AttributeError: 'Reading' object has no attribute 'temprature' and no __dict__ for setting new attributes`,
      cause: py`The class uses \`__slots__\` and the name isn't one of them — usually a typo, which is exactly what slots catch.`,
      fix: py`Fix the spelling, or add the name to \`__slots__\` if the attribute is genuinely new.`,
    },
    {
      symptom: py`ValueError: 'celsius' in __slots__ conflicts with class variable`,
      cause: py`A slot name is also assigned as a class attribute (often a default value).`,
      fix: py`Remove the class attribute; set the default in \`__init__\`.`,
    },
    {
      symptom: py`TypeError: cannot create weak reference to 'Reading' object`,
      cause: py`Slotted classes have no \`__weakref__\` slot unless you ask for one.`,
      fix: py`Add \`"__weakref__"\` to \`__slots__\` (or \`weakref_slot=True\` with \`@dataclass(slots=True)\`, 3.11+).`,
    },
    {
      symptom: py`TypeError: multiple bases have instance lay-out conflict`,
      cause: py`Two base classes both define non-empty \`__slots__\`, so their fixed memory layouts can't be merged.`,
      fix: py`Give mixins empty \`__slots__ = ()\` and keep real slots in one base, or drop slots from one side.`,
    },
    {
      symptom: py`AttributeError naming a property that obviously exists (e.g. "Order has no field 'total'")`,
      cause: py`Code *inside* the property raised \`AttributeError\`; Python treated it as "not found" and fell back to \`__getattr__\`, whose message hides the real cause.`,
      fix: py`Run the property's body directly or temporarily remove \`__getattr__\` to see the original error; inside properties, catch \`AttributeError\` and re-raise it as a different exception type.`,
    },
    {
      symptom: py`TypeError: object of type 'AuditProxy' has no len() (while proxy.append(...) works)`,
      cause: py`Implicit special-method lookup ignores \`__getattr__\`, so dunders aren't forwarded by a proxy.`,
      fix: py`Define each needed dunder on the proxy class explicitly: \`def __len__(self): return len(self._wrapped)\`.`,
    },
  ],
  bestPractices: [
    'Use the narrowest hook: property for one attribute, __getattr__ for missing names, __setattr__ for all writes, __getattribute__ almost never.',
    'Always raise AttributeError (never KeyError or None) for attributes you can\'t provide.',
    'Inside hooks, delegate with super().__setattr__ / object.__getattribute__ — never self.x.',
    'Guard __getattr__ against names starting with an underscore so copy/pickle and half-built objects don\'t recurse.',
    'Implement __dir__ when attributes are dynamic, so dir() and autocompletion stay truthful.',
    'Prefer @dataclass(frozen=True) over a hand-written read-only __setattr__.',
    'Use __slots__ (or @dataclass(slots=True)) for classes with many instances; measure memory with tracemalloc, not sys.getsizeof.',
    'Never pass untrusted strings to getattr/setattr without an allowlist.',
  ],
  useCases: [
    'Proxies and wrappers: logging, access control, lazy loading, remote objects.',
    'Attribute-style access to dynamic data: config.database.host from a JSON file.',
    'Validation and read-only objects: reject invalid assignments at the moment they happen.',
    'Change tracking: record which fields were modified so only those are saved to a database.',
    'Memory-lean records: millions of points, readings or events with __slots__.',
    'Deprecation shims: module-level __getattr__ that warns when old names are used.',
  ],
  comparison: {
    title: 'Choosing an attribute hook',
    headers: ['', '__getattr__', '__getattribute__', '__setattr__ / __delattr__', 'property / descriptor'],
    rows: [
      ['runs when', 'normal lookup failed', 'every read, even self.x inside methods', 'every write / delete, including in __init__', 'one specific attribute name'],
      ['typical use', 'proxies, defaults, dynamic APIs', 'tracing, access control (rare)', 'validation, read-only objects, change tracking', 'computed, validated or read-only fields'],
      ['recursion risk', 'low — guard private names', 'high — use object.__getattribute__', 'high — use super().__setattr__', 'none'],
      ['performance cost', 'only on misses', 'every attribute read', 'every attribute write', 'only that attribute'],
    ],
    note: py`Special methods (\`len(x)\`, \`x + y\`, \`for\`) bypass all of these hooks — they're looked up directly on the class.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'attribute-access-q1',
      type: 'mcq',
      prompt: py`A class defines \`__getattr__\`. When does Python call it?`,
      options: [
        { text: 'On every attribute read', why: 'That is __getattribute__. __getattr__ is the fallback.' },
        'Only when normal lookup (data descriptors, instance __dict__, class and bases) fails with AttributeError',
        { text: 'Only for names that start with an underscore', why: 'Names play no role — only whether normal lookup found the attribute.' },
        { text: 'When you call len(obj) or obj + 1 and the method is missing', why: 'Implicit special-method lookup goes straight to the class and never calls __getattr__.' },
      ],
      answer: 1,
      explanation: py`\`__getattr__\` is the "last resort" hook. Existing attributes never reach it, which is why it's cheap and why proxies built on it can still use \`self._wrapped\` freely.`,
    },
    {
      id: 'attribute-access-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Box:
    color = "red"

    def __init__(self):
        self.size = 3

    def __getattr__(self, name):
        return f"no {name}"


b = Box()
print(b.size, b.color, b.weight)`,
      answer: '3 red no weight',
      accept: ['3 red no weight'],
      explanation: py`\`size\` is in the instance dict and \`color\` on the class, so both are found normally and \`__getattr__\` never runs for them. Only \`weight\` is missing, so \`__getattr__("weight")\` returns \`"no weight"\`.`,
    },
    {
      id: 'attribute-access-q3',
      type: 'bug',
      prompt: 'Creating an `Account` crashes with `RecursionError`. Click the line that causes it.',
      code: py`class Account:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def __setattr__(self, name, value):
        if name == "balance" and value < 0:
            raise ValueError("balance cannot be negative")
        setattr(self, name, value)


acct = Account("Ada", 100)`,
      answerLine: 9,
      explanation: py`\`setattr(self, name, value)\` is the same as \`self.<name> = value\`, which calls \`__setattr__\` again… forever. Store the value with \`super().__setattr__(name, value)\`.`,
    },
    {
      id: 'attribute-access-q4',
      type: 'fill',
      prompt: 'Fill in the blanks: restrict `Pixel` to exactly three attributes, then read an attribute whose name is chosen at runtime.',
      code: py`class Pixel:
    ___ = ("x", "y", "color")

    def __init__(self, x, y, color):
        self.x, self.y, self.color = x, y, color


p = Pixel(0, 0, "red")
field = "color"
print(___(p, field))      # red`,
      answer: [['__slots__'], ['getattr']],
      explanation: py`\`__slots__\` fixes the set of instance attributes (and drops the per-instance \`__dict__\`). \`getattr(obj, "color")\` is the dynamic form of \`obj.color\`.`,
    },
    {
      id: 'attribute-access-q5',
      type: 'output',
      prompt: 'Both names are planted directly into the instance `__dict__`. What is printed?',
      code: py`class Lamp:
    @property
    def state(self):
        return "from property"

    def switch(self):
        return "from method"


lamp = Lamp()
lamp.__dict__["state"] = "from instance"
lamp.__dict__["switch"] = lambda: "from instance"
print(lamp.state)
print(lamp.switch())`,
      options: [
        { text: 'from instance\nfrom instance', why: 'A property is a data descriptor, and data descriptors on the class beat the instance __dict__.' },
        { text: 'from property\nfrom method', why: 'Methods are non-data descriptors (functions only have __get__), so the instance __dict__ wins over them.' },
        'from property\nfrom instance',
        { text: 'from instance\nfrom method', why: 'It\'s the other way round: property wins, method loses.' },
      ],
      answer: 2,
      explanation: py`Lookup order: data descriptors on the class (property) → instance \`__dict__\` → non-data descriptors (functions) and plain class attributes. See [descriptors](lesson:descriptors).`,
    },
    {
      id: 'attribute-access-q6',
      type: 'mcq',
      prompt: 'Which statement about `__slots__` is true?',
      options: [
        { text: 'It makes instances immutable', why: 'Slot values can still be reassigned; you just can\'t add new attribute names.' },
        { text: 'Subclasses automatically inherit the "no __dict__" behaviour', why: 'A subclass without its own __slots__ gets a __dict__ again.' },
        'Instances get fixed storage for the listed names and no per-instance __dict__, so new attribute names raise AttributeError',
        { text: 'It speeds up every method call on the class', why: 'Slots change how instance attributes are stored, not how methods are called.' },
      ],
      answer: 2,
      explanation: py`Slots replace the per-instance dict with fixed, descriptor-backed storage. Benefits: less memory per instance and typo protection. Values remain mutable; use \`frozen=True\` dataclasses for immutability.`,
    },
    {
      id: 'attribute-access-q7',
      type: 'short',
      prompt: 'Why must `__getattr__` raise `AttributeError` — rather than `KeyError` or returning `None` — for names it can\'t provide?',
      answer: py`\`AttributeError\` is the agreed signal for "this attribute doesn't exist". \`hasattr()\`, \`getattr(obj, name, default)\`, \`copy\`, \`pickle\` and many libraries catch exactly that exception. A \`KeyError\` escapes from \`hasattr\` and crashes callers; returning \`None\` turns every typo into a silent \`None\` value.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'validated-product',
      title: 'A product that validates every assignment',
      difficulty: 'intermediate',
      prompt: py`Write \`Product.__setattr__\` so that **every** assignment — including the ones in \`__init__\` — is validated:

- \`name\` must be a non-empty \`str\`, otherwise raise \`ValueError\`.
- \`price\` must be an \`int\` or \`float\` that is \`>= 0\`, otherwise raise \`ValueError\`.
- \`stock\` must be an \`int\` that is \`>= 0\`, otherwise raise \`ValueError\`.
- Any other attribute name raises \`AttributeError\` (this catches typos like \`p.prise = 4\`).
- Valid values are stored with \`super().__setattr__(name, value)\`. A rejected assignment must leave the old value unchanged.`,
      files: {
        'main.py': py`class Product:
    def __init__(self, name, price, stock=0):
        self.name = name
        self.price = price
        self.stock = stock

    # TODO: __setattr__ that validates name, price and stock


tea = Product("Green tea", 3.5, stock=12)
print(tea.name, tea.price, tea.stock)
`,
      },
      hints: [
        'Write def __setattr__(self, name, value): with one if/elif branch per allowed name and an else that raises AttributeError.',
        'Check types with isinstance: isinstance(value, str) and value for the name; isinstance(value, (int, float)) and value >= 0 for the price.',
        'Raise before storing, and only call super().__setattr__(name, value) at the very end — then a failed check never changes the old value.',
      ],
      solution: {
        explanation: py`Because \`__init__\` uses ordinary assignments, it goes through \`__setattr__\` too — so a \`Product\` can never even be *created* in an invalid state. All checks run **before** \`super().__setattr__\`, so a rejected value leaves the previous one in place. The final \`else\` turns unknown names (including typos) into \`AttributeError\`, the same error \`__slots__\` would give. For a single field a \`property\` would be simpler; \`__setattr__\` shines when one place should guard every write.`,
        files: {
          'main.py': py`class Product:
    def __init__(self, name, price, stock=0):
        self.name = name
        self.price = price
        self.stock = stock

    def __setattr__(self, name, value):
        if name == "name":
            if not isinstance(value, str) or not value:
                raise ValueError("name must be a non-empty string")
        elif name == "price":
            if not isinstance(value, (int, float)) or value < 0:
                raise ValueError("price must be a number >= 0")
        elif name == "stock":
            if not isinstance(value, int) or value < 0:
                raise ValueError("stock must be an int >= 0")
        else:
            raise AttributeError(f"Product has no field {name!r}")
        super().__setattr__(name, value)


tea = Product("Green tea", 3.5, stock=12)
print(tea.name, tea.price, tea.stock)
try:
    tea.price = -1
except ValueError as error:
    print("rejected:", error, "| price is still", tea.price)
`,
        },
      },
      tests: [
        { name: 'valid products work', code: py`p = Product("Tea", 3.5, 10)
assert (p.name, p.price, p.stock) == ("Tea", 3.5, 10)
p.price = 4
p.stock = 0
assert p.price == 4 and p.stock == 0` },
        { name: '__init__ is validated too', code: py`with raises(ValueError):
    Product("", 1)
with raises(ValueError):
    Product("Tea", -1)
with raises(ValueError):
    Product("Tea", 1, stock=-3)` },
        { name: 'bad assignments raise and keep the old value', code: py`p = Product("Tea", 3.5, 10)
with raises(ValueError):
    p.price = -5
assert p.price == 3.5
with raises(ValueError):
    p.stock = 2.5
assert p.stock == 10
with raises(ValueError):
    p.name = 42` },
        { name: 'unknown attributes raise AttributeError', code: py`p = Product("Tea", 3.5)
with raises(AttributeError):
    p.prise = 4
with raises(AttributeError):
    p.colour = "green"` },
      ],
    },
    {
      id: 'attr-config',
      title: 'Dot-access configuration',
      difficulty: 'advanced',
      prompt: py`\`Config\` wraps a (possibly nested) dict loaded from a settings file. Add \`__getattr__\` and \`__dir__\` so that:

- \`cfg.debug\` returns \`data["debug"]\`; nested dicts come back wrapped in \`Config\`, so \`cfg.database.port\` works.
- A missing key raises \`AttributeError\` — so \`hasattr(cfg, "missing")\` is \`False\` and \`getattr(cfg, "missing", 1)\` returns \`1\`.
- Names starting with \`_\` are **never** looked up in the data: raise \`AttributeError\` for them (this prevents infinite recursion when \`_data\` doesn't exist yet).
- \`dir(cfg)\` includes every key of the data (and the normal attributes).`,
      files: {
        'main.py': py`class Config:
    def __init__(self, data):
        self._data = data

    # TODO: __getattr__ (wrap nested dicts) and __dir__


settings = Config({"debug": True, "database": {"host": "localhost", "port": 5432}})
print(settings._data["database"]["host"])
`,
      },
      hints: [
        '__getattr__ only runs for names Config doesn\'t have, so self._data inside it is found normally. Start with: if name.startswith("_"): raise AttributeError(name).',
        'Look the key up in a try block and convert KeyError into AttributeError (raise AttributeError(...) from None). If the value is a dict, return Config(value).',
        '__dir__: return sorted(set(super().__dir__()) | set(self._data)).',
      ],
      solution: {
        explanation: py`\`__getattr__\` is the right hook because real attributes (\`_data\`, methods) must keep working normally — it only sees names that weren't found. Translating \`KeyError\` into \`AttributeError\` (with \`from None\` to hide the noisy chained traceback) makes \`hasattr\` and \`getattr(..., default)\` behave. Wrapping nested dicts on the way out gives chained dot access. The underscore guard matters in real life: \`copy.copy\` and \`pickle\` create a \`Config\` without running \`__init__\`, and without the guard \`self._data\` would call \`__getattr__("_data")\`, which reads \`self._data\`… forever. \`__dir__\` merges the normal names with the data keys so REPLs and editors can autocomplete them.`,
        files: {
          'main.py': py`class Config:
    def __init__(self, data):
        self._data = data

    def __getattr__(self, name):
        if name.startswith("_"):              # private/dunder names: never from data
            raise AttributeError(name)
        try:
            value = self._data[name]
        except KeyError:
            raise AttributeError(f"config has no setting {name!r}") from None
        if isinstance(value, dict):
            return Config(value)              # nested sections get dot access too
        return value

    def __dir__(self):
        return sorted(set(super().__dir__()) | set(self._data))


settings = Config({"debug": True, "database": {"host": "localhost", "port": 5432}})
print(settings.database.host, settings.database.port, settings.debug)
print(getattr(settings, "timeout", 30), "database" in dir(settings))
`,
        },
      },
      tests: [
        { name: 'top-level keys work', code: py`cfg = Config({"debug": True, "name": "shop"})
assert cfg.debug is True and cfg.name == "shop"` },
        { name: 'nested dicts support dot access', code: py`cfg = Config({"database": {"host": "localhost", "port": 5432}})
assert cfg.database.host == "localhost" and cfg.database.port == 5432` },
        { name: 'missing keys raise AttributeError', code: py`cfg = Config({"debug": True})
with raises(AttributeError):
    cfg.missing
assert hasattr(cfg, "missing") is False
assert getattr(cfg, "missing", 1) == 1` },
        { name: 'underscore names are never read from the data', code: py`cfg = Config({"_secret": "hunter2", "ok": 1})
with raises(AttributeError):
    cfg._secret
assert cfg.ok == 1` },
        { name: 'dir() lists the keys', code: py`cfg = Config({"debug": True, "database": {}})
names = dir(cfg)
assert "debug" in names and "database" in names` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'attribute-access-getattr-vs-getattribute',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between __getattr__ and __getattribute__? When would you use each?',
      answer: '__getattribute__ runs on every attribute read and implements normal lookup; __getattr__ runs only after normal lookup fails with AttributeError. Use __getattr__ for defaults, proxies and dynamic attributes; override __getattribute__ only when you must intercept every access, delegating to object.__getattribute__ to avoid recursion.',
      explanation: py`\`object.__getattribute__\` performs the descriptor / instance-dict / class lookup. If it raises \`AttributeError\` and the class defines \`__getattr__\`, Python calls that. Overriding \`__getattribute__\` slows every access and makes \`self.x\` inside it recursive. Neither hook is used for implicit special-method lookup.`,
      whyAsked: 'The names are confusingly similar; the answer reveals whether you know the lookup machinery and its performance and recursion implications.',
      mistakes: ['Swapping the two', 'Saying __getattr__ runs for every access', 'Not mentioning the recursion trap in __getattribute__'],
      followUps: ['What happens if a property raises AttributeError and the class has __getattr__?', 'Do these hooks affect len(obj)?', 'How does unittest.mock.Mock create attributes on demand?'],
      modelAnswer: '__getattribute__ is called for every attribute read; object\'s version is what implements normal lookup — data descriptors, then the instance dict, then the class and its bases. __getattr__ is only a fallback: Python calls it when that normal lookup raised AttributeError. So __getattr__ is cheap and safe for things like proxies, defaults and dynamic APIs. I\'d override __getattribute__ only if I truly need to see every access, such as tracing, and then I must fetch everything through object.__getattribute__, because self.anything inside it would recurse. Neither hook is consulted for implicit dunder calls like len().',
    },
    {
      id: 'attribute-access-lookup-order',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Describe the full lookup order for obj.attr, and explain why an instance attribute can shadow a method but not a property.',
      answer: 'object.__getattribute__ first finds attr on the type\'s MRO; if it is a data descriptor (has __set__/__delete__, e.g. property, slot) it wins. Otherwise the instance __dict__ is checked; otherwise a non-data descriptor (functions → bound methods) or plain class attribute is used; otherwise AttributeError, then __getattr__ if defined. Properties are data descriptors, methods are non-data descriptors — hence the asymmetry.',
      explanation: py`This ordering lets properties enforce read-only or validated access even though the instance has a dict, while still allowing per-instance overrides of methods (useful in tests). Assignment mirrors it: a data descriptor's \`__set__\` handles the write, otherwise the value goes to the instance dict. The [descriptors](lesson:descriptors) lesson implements this in pure Python.`,
      whyAsked: 'A senior-level question; knowing descriptor precedence explains properties, methods, slots, functools.cached_property and ORMs.',
      mistakes: ['Saying "instance dict always wins"', 'Forgetting the MRO search', 'Not knowing what makes a descriptor "data"'],
      followUps: ['Why does functools.cached_property work by writing to the instance dict?', 'Where do __slots__ fit in this order?', 'What does type.__getattribute__ do differently for class attribute access?'],
      modelAnswer: 'Python calls type(obj).__getattribute__, and object\'s default does this: first it searches the class and its bases in MRO order. If what it finds is a data descriptor — something with __set__ or __delete__, like a property or a __slots__ member — it calls its __get__ and returns that. Otherwise it checks the instance __dict__. If that misses, it uses the class-level result: a function becomes a bound method because functions are non-data descriptors, and a plain value is returned as is. If nothing matched it raises AttributeError, and if the class has __getattr__, Python calls it as the last resort. That precedence is why an instance attribute can shadow a method but never a property.',
    },
    {
      id: 'attribute-access-setattr-recursion',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate\'s class adds validation in __setattr__ and now every instantiation fails with RecursionError. What is likely wrong, and what is the fix?',
      answer: 'Inside __setattr__ they assign with self.x = value or setattr(self, ...), which calls __setattr__ again. Store the value with super().__setattr__(name, value) (or object.__setattr__). It fails at instantiation because __init__\'s assignments also go through __setattr__.',
      explanation: py`Every attribute assignment on the instance — including those in \`__init__\` — is dispatched to \`type(obj).__setattr__\`. The hook must hand the actual storage to the parent implementation. Writing into \`self.__dict__[name]\` directly also avoids recursion but skips data descriptors such as properties and slots, so \`super().__setattr__\` is the better default.`,
      code: { lang: 'python', code: py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius            # goes through __setattr__

    def __setattr__(self, name, value):
        if name == "celsius" and value < -273.15:
            raise ValueError("below absolute zero")
        super().__setattr__(name, value)  # not self.celsius = value


print(Temperature(21).celsius)` },
      whyAsked: 'A very common real bug with attribute hooks; tests debugging skills and understanding of where hooks fire.',
      mistakes: ['Suggesting self.__dict__ writes without mentioning they bypass properties and slots', 'Not realising __init__ triggers __setattr__'],
      followUps: ['Why might self.__dict__[name] = value be wrong for a class with __slots__?', 'Would a property be a better fit here?'],
      modelAnswer: 'Almost certainly the hook stores the value with self.name = value or setattr(self, name, value). Both are attribute assignments, so they call __setattr__ again, which recurses until RecursionError. It happens at instantiation because __init__ does attribute assignments too, and they go through the same hook. The fix is to validate and then call super().__setattr__(name, value), which uses object\'s real storage logic — including properties and slots. If only one or two attributes need validation, I\'d suggest properties instead.',
    },
    {
      id: 'attribute-access-proxy-dunders',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What happens on the last two lines?',
      code: { lang: 'python', code: py`class Proxy:
    def __init__(self, wrapped):
        self._wrapped = wrapped

    def __getattr__(self, name):
        return getattr(self._wrapped, name)


items = Proxy(["a", "b"])
items.append("c")
print(items.__len__())
print(len(items))` },
      options: [
        'Prints 3, then 3',
        "Prints 3, then TypeError: object of type 'Proxy' has no len()",
        'AttributeError on items.append',
        "TypeError on both lines",
      ],
      correctOption: 1,
      answer: "items.__len__() is an ordinary attribute lookup that falls through to __getattr__ and is forwarded, printing 3. len(items) looks up __len__ on the Proxy class directly, bypassing __getattr__, so it raises TypeError: object of type 'Proxy' has no len().",
      explanation: py`Implicit special-method lookup skips the instance and every attribute hook. Proxies must define each dunder they want to support (\`__len__\`, \`__iter__\`, \`__getitem__\`, \`__eq__\`, \`__repr__\`…) on the class. Libraries such as \`wrapt\` exist largely to do that thoroughly.`,
      whyAsked: 'Connects attribute hooks with special-method lookup — the classic proxy pitfall.',
      mistakes: ['Assuming __getattr__ makes the proxy fully transparent', 'Thinking the explicit call also fails'],
      followUps: ['How would you forward all arithmetic operators without writing each by hand?', 'Why does isinstance(items, list) return False?'],
      modelAnswer: 'The explicit items.__len__() is a normal attribute read: Proxy has no __len__, so __getattr__ forwards it to the list and it prints 3. But len(items) uses implicit special-method lookup, which goes straight to type(items) and never consults __getattr__, so it raises TypeError: object of type Proxy has no len(). Any proxy that needs to support len, iteration, comparisons or operators has to define those dunders on its class explicitly.',
    },
    {
      id: 'attribute-access-slots-tradeoffs',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your service keeps millions of small `Reading` objects in memory and is running out of RAM. Would you use __slots__? What are the trade-offs?',
      answer: 'Yes, it is a good candidate: __slots__ (or @dataclass(slots=True)) removes the per-instance __dict__ and stores attributes in fixed slots, cutting memory per object and catching typos. Trade-offs: no dynamic attributes, every class in the hierarchy needs __slots__, no weakrefs unless "__weakref__" is listed, slot names can\'t double as class-level defaults, and multiple inheritance with slotted bases is restricted. Measure before and after with tracemalloc.',
      explanation: py`For many tiny records the per-instance dictionary machinery is a significant share of memory. Measure it with \`tracemalloc\` rather than \`sys.getsizeof\`, which is shallow. Consider also whether you need objects at all — tuples, \`array\`, or columnar structures may be smaller still. Recent CPython versions made plain instances cheaper, so the actual saving depends on the version.`,
      whyAsked: 'Tests practical performance judgement and awareness of slots\' sharp edges.',
      mistakes: ['Quoting a fixed percentage saving as a rule', 'Using sys.getsizeof to compare', 'Forgetting that a subclass without __slots__ brings back __dict__'],
      followUps: ['How do you measure memory for a million objects?', 'How does @dataclass(slots=True) differ from writing __slots__?', 'When would a NamedTuple be a better fit?'],
      modelAnswer: 'Yes — millions of small, fixed-shape objects is exactly where __slots__ pays off. Declaring the attribute names gives each instance fixed storage instead of a per-instance __dict__, which saves memory and also turns typos into immediate AttributeErrors. I\'d likely use @dataclass(slots=True) so the fields are declared once. The trade-offs are that you can\'t add attributes dynamically, subclasses must declare __slots__ too or they get a dict back, weak references need a __weakref__ slot, defaults can\'t be class attributes with the same name, and combining slotted bases in multiple inheritance can fail. I\'d measure before and after with tracemalloc, since sys.getsizeof is shallow and the saving varies by Python version.',
    },
    {
      id: 'attribute-access-getattr-dispatch',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'A chat bot dispatches commands with `getattr(self, "cmd_" + command)(args)`, where `command` comes from user messages. Is this safe? How would you design command dispatch?',
      answer: 'The prefix limits the reachable names, so it is safer than raw getattr(self, command) — but any method that later gets a cmd_ prefix becomes public, errors leak as AttributeError, and the set of commands isn\'t visible. Prefer an explicit registry (a dict of name → function, filled by a decorator), validate the name against it, and return a friendly error for unknown commands.',
      explanation: py`Dynamic attribute lookup with untrusted strings is a classic injection surface: without a prefix, users could reach \`__class__\`, private helpers or destructive methods. A registry makes the allowed surface explicit, testable and documentable; it also avoids relying on naming conventions for security.`,
      code: { lang: 'python', code: py`class Bot:
    commands = {}

    @classmethod
    def command(cls, name):
        def register(func):
            cls.commands[name] = func
            return func
        return register

    def handle(self, name, arg):
        func = self.commands.get(name)
        if func is None:
            return f"unknown command {name!r}"
        return func(self, arg)


@Bot.command("greet")
def greet(bot, arg):
    return f"Hello, {arg}!"


bot = Bot()
print(bot.handle("greet", "Ada"))       # Hello, Ada!
print(bot.handle("__init__", "x"))      # unknown command '__init__'` },
      whyAsked: 'Probes security awareness around reflection-style APIs, which appear in CLIs, RPC frameworks and bots.',
      mistakes: ['Calling getattr with the raw user string', 'Relying only on a naming prefix as the security boundary', 'Catching AttributeError broadly and hiding real bugs'],
      followUps: ['How would you add per-command permissions?', 'How do frameworks like Click or FastAPI register handlers?', 'How would you test that no private method is reachable?'],
      modelAnswer: 'The prefix helps — users can only reach methods whose names start with cmd_ — but it makes security depend on a naming convention, and raw getattr on user input in general can reach dunders and private helpers. I\'d replace reflection with an explicit registry: a dict from command name to handler, filled by a decorator. Dispatch then becomes a dict lookup with a clear "unknown command" path, the list of commands is visible and testable, and adding per-command permissions or help text is easy. That is essentially how CLI and web frameworks register handlers.',
    },
    {
      id: 'attribute-access-change-tracking',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement `Record(**fields)` that sets each keyword as an attribute, then tracks which attributes are assigned or deleted afterwards. `record.changed` returns that set of names (empty right after creation).',
      answer: 'Store the initial fields and an internal _changed set with object.__setattr__ (bypassing tracking), override __setattr__/__delattr__ to call super() and then add the name to _changed, and expose changed as a property returning a copy.',
      explanation: py`This is the core of "dirty tracking" in ORMs: only modified fields are written back to the database. The key detail is distinguishing initial population from later changes — writing the initial values with \`object.__setattr__\` skips the hook. Returning a copy from \`changed\` keeps the internal set private.`,
      starter: { files: { 'main.py': py`class Record:
    def __init__(self, **fields):
        self.__dict__.update(fields)

    @property
    def changed(self):
        return set()

    # TODO: track assignments and deletions made after __init__


user = Record(name="Ada", email="ada@example.com")
user.email = "ada@lovelace.dev"
print(user.email, user.changed)
` } },
      tests: [
        { name: 'fields are set and nothing is changed yet', code: py`r = Record(name="Ada", email="a@x.dev")
assert r.name == "Ada" and r.email == "a@x.dev"
assert r.changed == set()` },
        { name: 'assignments are tracked', code: py`r = Record(name="Ada", email="a@x.dev")
r.email = "b@x.dev"
r.email = "c@x.dev"
r.age = 36
assert r.changed == {"email", "age"} and r.email == "c@x.dev"` },
        { name: 'deletions are tracked', code: py`r = Record(name="Ada", email="a@x.dev")
del r.name
assert "name" in r.changed
with raises(AttributeError):
    r.name` },
        { name: 'changed returns a copy', code: py`r = Record(name="Ada")
r.name = "Grace"
r.changed.add("hacked")
assert r.changed == {"name"}` },
      ],
      solution: { files: { 'main.py': py`class Record:
    def __init__(self, **fields):
        # Initial values are not "changes": bypass our own __setattr__
        object.__setattr__(self, "_changed", set())
        for name, value in fields.items():
            object.__setattr__(self, name, value)

    @property
    def changed(self):
        return set(self._changed)            # a copy keeps the internal set private

    def __setattr__(self, name, value):
        super().__setattr__(name, value)
        self._changed.add(name)

    def __delattr__(self, name):
        super().__delattr__(name)            # raises AttributeError if missing
        self._changed.add(name)


user = Record(name="Ada", email="ada@example.com")
user.email = "ada@lovelace.dev"
print(user.email, user.changed)
` } },
      hints: ['Use object.__setattr__(self, ...) in __init__ so the initial values (and the _changed set itself) are not tracked.', 'In __setattr__ and __delattr__, call super() first (so failures don\'t mark anything), then add the name to self._changed.'],
      whyAsked: 'A realistic use of __setattr__/__delattr__ that also tests recursion avoidance and encapsulation.',
      mistakes: ['Tracking the _changed attribute itself', 'Recording the change before the assignment succeeds', 'Returning the internal set so callers can corrupt it'],
      followUps: ['How would you also record old values?', 'How would you reset tracking after saving?', 'How do ORMs like SQLAlchemy track changes?'],
      modelAnswer: 'In __init__ I use object.__setattr__ to create a private _changed set and to store the initial fields, because those aren\'t changes and I don\'t want them going through my hook. Then __setattr__ calls super().__setattr__ to store the value and, only if that succeeded, adds the name to _changed; __delattr__ does the same with super().__delattr__, which also raises AttributeError for missing names. The changed property returns a copy of the set so callers can\'t modify my internal state. This is the core of dirty tracking in ORMs.',
    },
  ],

  takeaways: [
    'obj.name calls type(obj).__getattribute__: data descriptors (property, slots) → instance __dict__ → methods and class attributes (MRO) → __getattr__ → AttributeError.',
    '__getattr__ runs only when normal lookup fails — ideal for proxies, defaults and dynamic attributes; __getattribute__ runs on every read and is rarely worth it.',
    '__setattr__ / __delattr__ run on every write and delete, including in __init__; store values with super().__setattr__ to avoid infinite recursion.',
    'Raise AttributeError for missing names so hasattr() and getattr(obj, name, default) work.',
    'Special methods (len, +, for) bypass all attribute hooks — proxies must define the dunders they forward.',
    '__slots__ gives fixed attribute storage without a per-instance __dict__: less memory, typo protection, but no new attributes and some inheritance caveats.',
    'getattr/setattr/hasattr/delattr work with names held in strings — never with untrusted names without an allowlist.',
  ],
}
