// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP = py`import time


def log_calls(func):
    """Print each call to func: its arguments and what it returned."""
    def wrapper(*args, **kwargs):
        shown = [repr(a) for a in args] + [f"{k}={v!r}" for k, v in kwargs.items()]
        print(f"calling {func.__name__}({', '.join(shown)})")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result!r}")
        return result
    return wrapper


def count_calls(func):
    """Count how many times func has been called."""
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper


def timed(func):
    """Print how long each call to func took, even if it raises."""
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            print(f"{func.__name__} took {elapsed_ms:.0f} ms")
    return wrapper


@log_calls
def add_item(cart, name, price, qty=1):
    cart[name] = cart.get(name, 0) + price * qty
    return len(cart)


@count_calls
def apply_discount(total, percent):
    return round(total * (1 - percent / 100), 2)


@timed
def checkout(cart):
    time.sleep(0.02)  # pretend to wait for a payment service
    return round(sum(cart.values()), 2)


def receipt_line(name, amount):
    return f"{name:<8}{amount:>6.2f}"


cart = {}
add_item(cart, "tea", 3.5)
add_item(cart, "scone", 2.25, qty=2)
for item, amount in cart.items():
    print(receipt_line(item, amount))
total = checkout(cart)
print("total:", total)
print("10% off:", apply_discount(total, 10))
print("apply_discount calls:", apply_discount.calls)
print("checkout is really:", checkout.__name__)
`

export default {
  id: 'decorators',
  title: 'Decorators',
  summary: 'A decorator is a function that takes a function and returns a replacement — usually a wrapper that adds behaviour before and after every call — and @decorator is shorthand for f = decorator(f).',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['closures', 'function-arguments'],
  related: ['advanced-decorators', 'closures', 'lambdas-and-higher-order', 'scope', 'functools', 'properties-and-encapsulation', 'methods-and-attributes', 'context-managers', 'logging', 'profiling', 'dataclasses', 'asyncio-basics', 'object-model'],
  tags: ['decorators', '@', 'decorator syntax', 'wrapper', 'higher-order functions', 'first-class functions', 'closures', '*args', '**kwargs', 'logging', 'timing', 'call counting', 'definition time', 'cross-cutting concerns'],
  apis: [
    { name: '@decorator', summary: 'Placed above def/class: after the function is created, Python calls decorator(function) and binds the name to the result.' },
    { name: 'def wrapper(*args, **kwargs)', summary: 'A wrapper that accepts any arguments and forwards them unchanged with func(*args, **kwargs).' },
    { name: 'function.__name__', summary: 'The name a function was defined with (a wrapper reports "wrapper" unless you copy the metadata).' },
    { name: 'function.__closure__', summary: 'Tuple of cells holding the variables a nested function captured — for a wrapper, the original func.' },
    { name: 'time.perf_counter()', summary: 'A high-resolution clock for measuring short durations (only differences between two readings are meaningful).' },
    { name: 'functools.wraps', summary: 'A decorator for wrappers that copies __name__, __doc__ and friends from the wrapped function (see the next lesson).' },
  ],
  docs: [
    { label: 'Glossary — decorator', url: 'https://docs.python.org/3/glossary.html#term-decorator' },
    { label: 'Language reference — function definitions (decorators)', url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions' },
    { label: 'PEP 318 — decorators for functions and methods', url: 'https://peps.python.org/pep-0318/' },
    { label: 'PEP 614 — relaxing grammar restrictions on decorators (3.9)', url: 'https://peps.python.org/pep-0614/' },
    { label: 'functools.wraps', url: 'https://docs.python.org/3/library/functools.html#functools.wraps' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **decorator** is a function that takes another function and returns a replacement for it. Most of the time the replacement is a **wrapper**: a small new function that does something extra *before* and/or *after* calling the original — print a log line, start a stopwatch, check a password, count calls.`,
    py`Python gives this pattern its own syntax. Writing \`@timed\` on the line above a \`def\`:`,
    { code: py`@timed
def checkout(cart):
    ...`, lang: 'python', static: true, title: 'decorator syntax' },
    py`means exactly "define \`checkout\`, then immediately run \`checkout = timed(checkout)\`". From then on, every call to \`checkout(...)\` goes through the wrapper that \`timed\` returned.`,
    py`Decorators are built from three ideas you already know: **functions are objects** (you can pass them around like any value), [higher-order functions](lesson:lambdas-and-higher-order) (functions that take or return functions) and [closures](lesson:closures) (an inner function that remembers variables from the function that built it). Put the three together and you get one of Python's most-used features — \`@property\`, \`@staticmethod\`, \`@dataclass\`, \`@functools.cache\` and the \`@app.route(...)\` of web frameworks are all decorators.`,
  ],
  why: [
    py`Real programs have **cross-cutting concerns**: jobs that touch many functions but aren't the point of any of them. Logging, timing, permission checks, retries, caching and input validation are the classic examples.`,
    py`Without decorators you copy-paste the same five lines into forty functions. The business logic gets buried, and when the log format changes you edit forty places (and miss two). With a decorator you write the extra behaviour **once**, give it a name, and attach it with one line: \`@log_calls\`. Remove the line and the behaviour is gone.`,
    py`Decorators also let a framework *find* your functions. \`@app.route("/cart")\` doesn't change the function at all — it records "this function handles /cart" in a table the moment the module is loaded. That "do something at definition time" trick powers routing, plugin systems, CLI commands and test fixtures.`,
  ],
  eli15: [
    py`Imagine you have a favourite hoodie (your function). It does its job: keeps you warm. Now it's raining, so you put a **raincoat over it**. You're still wearing the same hoodie — but now anyone who reaches you has to go through the raincoat first, and the raincoat adds something (it keeps you dry).`,
    py`A decorator is the person who hands you the raincoat. You give them the hoodie-wearing you, and they give back "you, in a raincoat". \`@raincoat\` above a function means: "whenever someone calls this function, they actually reach the raincoat first; the raincoat then lets the call through to the real function inside."`,
    py`The raincoat can do things on the way in ("write down who called") and on the way out ("write down how long it took"). And the important bit: the raincoat gets put on **once**, when the function is created — not every time it's used.`,
  ],
  analogy: {
    title: 'Gift wrapping at the shop counter',
    body: [
      py`You buy a present. At the counter, the assistant takes it, puts it in a box, adds a ribbon and a card, and hands you back **the wrapped package**. The present inside hasn't changed — but whoever receives the package has to open the wrapping before they reach the present.`,
      py`A decorator is the wrapping counter. You hand it a function (the present); it hands back a wrapper (the package) that still contains the original. People "open" the wrapper by calling it, and the wrapper decides what happens around the present: show the card first, play a tune afterwards… and at the end it always hands over the present itself.`,
    ],
    mapping: [
      ['the present', 'the original function (func)'],
      ['the wrapping counter', 'the decorator function: def timed(func): ...'],
      ['the wrapped package you get back', 'the wrapper function the decorator returns'],
      ['the present still inside the package', 'the closure: wrapper remembers func'],
      ['the card read before opening', 'code in the wrapper before func(*args, **kwargs)'],
      ['the tune that plays after opening', 'code in the wrapper after the call (or in finally)'],
      ['wrapping happens once, at the counter', 'decorators run at definition time, not on each call'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch the name move to the wrapper',
    props: {
      code: py`def shout(func):
    def wrapper(name):
        text = func(name)
        return text.upper() + "!"
    return wrapper


def greet(name):
    return "hello, " + name


greet = shout(greet)      # decorate by hand
print(greet("ada"))


@shout                    # the same thing, with @
def farewell(name):
    return "bye, " + name


print(farewell("ben"))
`,
      notes: {
        1: '`def shout` only creates a function object. Nothing inside it runs yet.',
        8: 'A plain function object, `greet`, is created.',
        12: '`shout(greet)` runs **now**: inside it, `func` refers to the original `greet`. It builds `wrapper` and returns it, and the name `greet` is re-bound to that wrapper. Look at the objects: the wrapper\'s **closure** shows `func →` the original function.',
        13: 'Calling `greet("ada")` really calls **wrapper**, which calls the original through `func` and then shouts the result.',
        3: 'Inside the wrapper, `func` is read from the closure — it is the original, undecorated function.',
        16: '`@shout` above `def` does the same three things in one go: create `farewell`, pass it to `shout`, bind the name `farewell` to whatever comes back.',
        21: 'Another call through a wrapper. Each decorated function gets its **own** wrapper with its own `func` cell.',
      },
    },
    alt: 'A step-by-step trace. shout and greet are created as function objects in the Global frame. When greet = shout(greet) runs, a frame for shout appears with func pointing at the original greet function; it creates a wrapper function whose closure shows func pointing at that original, returns it, and the global name greet now points at the wrapper. Calling greet("ada") opens a wrapper frame, which calls the original greet, receives "hello, ada" and returns "HELLO, ADA!". The @shout version does the same for farewell, printing "BYE, BEN!".',
    caption: py`Watch the objects area: after decoration the **name** points at a function called \`shout.<locals>.wrapper\`, and that wrapper's closure holds the original. This wrapper only accepts one argument to keep the picture small — real decorators use \`*args, **kwargs\`, as you'll see below.`,
  },
  syntax: [
    py`#### Functions are objects`,
    py`Before decorators make sense, one fact must feel normal: a function is an **object**, just like a list or a string. \`def\` creates a function object and binds a name to it. You can pass it to other functions, return it, store it in a dict, and even give it attributes.`,
    { code: py`def greet(name):
    return f"hi {name}"

say = greet                 # a second name for the same function object
print(say("Ada"))           # hi Ada
print(greet.__name__)       # greet  (the name it was defined with)

handlers = {"hello": greet}
print(handlers["hello"]("Ben"))   # hi Ben

greet.calls = 0             # functions can carry attributes
print(greet.calls)          # 0`, lang: 'python', title: 'functions are first-class objects' },
    py`#### The decorator template`,
    py`Nearly every decorator you'll ever write has this shape. Learn it by heart:`,
    { code: py`def my_decorator(func):              # 1. receives the original function
    def wrapper(*args, **kwargs):      # 2. defines a replacement that accepts anything
        # ... before the call ...
        result = func(*args, **kwargs) # 3. calls the original with the same arguments
        # ... after the call ...
        return result                  # 4. hands back the original's result
    return wrapper                     # 5. returns the wrapper (NOT wrapper())`, lang: 'python', title: 'the shape of a decorator' },
    py`- \`*args\` collects any positional arguments into a tuple and \`**kwargs\` collects keyword arguments into a dict (see [function arguments](lesson:function-arguments)). Calling \`func(*args, **kwargs)\` unpacks them again, so the wrapper works for **any** signature.
- The wrapper must **return** the result, or every decorated function silently returns \`None\`.
- The decorator returns the wrapper **object** — \`return wrapper\`, not \`return wrapper()\`.
- The wrapper is a [closure](lesson:closures): it remembers \`func\` long after \`my_decorator\` has returned.`,
    py`#### Applying it`,
    { code: py`def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper


# Option A: by hand
def greet(name):
    return f"hello {name}"
greet = shout(greet)

# Option B: with @ — identical result, and the intent is visible at the def
@shout
def farewell(name):
    return f"bye {name}"

print(greet("ada"), farewell("ben"))   # HELLO ADA BYE BEN`, lang: 'python', title: '@shout is sugar for farewell = shout(farewell)' },
    py`The \`@\` line must sit directly above the \`def\` (or above another decorator line, or a \`class\` statement). Since **Python 3.9** the thing after \`@\` can be any expression (\`@plugins["save"]\`, \`@app.route("/")\`); before that it had to be a dotted name with an optional call.`,
    { callout: 'version', title: 'Python 3.9: any expression after @', text: py`[PEP 614](https://peps.python.org/pep-0614/) relaxed the grammar so a decorator can be any valid expression, e.g. \`@buttons[0].on_click\`. Older code that needed \`on_click = buttons[0].on_click\` first still works.` },
    py`#### When does a decorator run?`,
    py`The decorator itself runs **once, when the \`def\` statement executes** — normally when the module is imported. The *wrapper* runs on every call. Code in the decorator's body (outside the wrapper) is setup; code inside the wrapper is per-call behaviour.`,
    { code: py`def register(func):
    print("registering", func.__name__)   # runs at definition time
    return func                             # returns the SAME function: no wrapper

print("start")

@register
def ping():
    print("pong")

print("defined")
ping()
# start
# registering ping
# defined
# pong`, lang: 'python', title: 'definition time vs call time' },
    py`Notice that \`register\` doesn't wrap anything: a decorator may return the original function unchanged (to *record* it somewhere), a wrapper, or any other object. \`@property\` returns a property object, for example — see [properties](lesson:properties-and-encapsulation).`,
    { callout: 'tip', title: 'One line every real decorator adds', text: py`Because the name now points at \`wrapper\`, \`checkout.__name__\` reports \`"wrapper"\` and the docstring disappears. Production decorators add \`@functools.wraps(func)\` above \`def wrapper\` to copy the original's name, docstring and more. It's the first topic of [advanced decorators](lesson:advanced-decorators); this lesson leaves it out only so you can see the raw mechanism first.` },
  ],
  walkthrough: {
    title: 'Reading the shop decorators line by line',
    lang: 'python',
    code: SHOP,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 12], text: py`\`log_calls\` is a decorator: it takes \`func\` and returns \`wrapper\`. The wrapper builds a readable list of the arguments, prints them, calls the original with \`func(*args, **kwargs)\`, prints the result and — crucially — **returns** it.` },
      { lines: [15, 21], text: py`\`count_calls\` keeps state *on the wrapper itself*: \`wrapper.calls = 0\` runs once at decoration time, and each call does \`wrapper.calls += 1\`. Because the name \`apply_discount\` will point at this wrapper, \`apply_discount.calls\` reads the counter.` },
      { lines: [24, 33], text: py`\`timed\` reads a high-resolution clock before the call and prints the difference afterwards. The \`finally\` block runs even if the original raises, so slow *failing* calls are still measured — and the exception still propagates, because nothing catches it.` },
      { lines: [36, 39], text: py`\`@log_calls\` above \`def add_item\` means: create \`add_item\`, then run \`add_item = log_calls(add_item)\`. The name now refers to the wrapper; the original lives on inside the wrapper's closure.` },
      { lines: [42, 50], text: py`The other two decorators are applied the same way, each at the moment its \`def\` runs. No timing or counting has happened yet — only wrapping.` },
      { lines: [53, 54], text: py`\`receipt_line\` is an ordinary, undecorated function. Calls to it are not logged (one of the experiments changes that).` },
      { lines: [57, 61], text: py`Each \`add_item(...)\` call goes through the logging wrapper first, so you see a "calling" line, the real work, then a "returned" line. Note \`qty=2\` arrives in \`kwargs\` and is shown as a keyword.` },
      { lines: [62, 65], text: py`\`checkout\` is timed, \`apply_discount\` is counted. The counter lives on the wrapper, so after one call \`apply_discount.calls\` is \`1\`.` },
      { lines: [66, 66], text: py`The proof that the name was re-bound: \`checkout.__name__\` is \`"wrapper"\`, not \`"checkout"\`. \`functools.wraps\` fixes that cosmetic (but important) problem — next lesson.` },
    ],
  },
  playground: {
    title: 'Shop decorators: log, count, time',
    objective: 'Run it, match every output line to the decorator that printed it, then change which functions are decorated.',
    files: { 'main.py': SHOP },
    expected: py`Something like this (the time varies a little each run):

\`\`\`text
calling add_item({}, 'tea', 3.5)
add_item returned 1
calling add_item({'tea': 3.5}, 'scone', 2.25, qty=2)
add_item returned 2
tea       3.50
scone     4.50
checkout took 20 ms
total: 8.0
10% off: 7.2
apply_discount calls: 1
checkout is really: wrapper
\`\`\`

The receipt lines are not logged because \`receipt_line\` isn't decorated.`,
    experiments: [
      {
        id: 'log-receipt',
        task: py`Add \`@log_calls\` directly above \`def receipt_line\`. Predict how many new lines appear in the output before you run it.`,
        hint: py`Decorators go on the line immediately above \`def\`. \`receipt_line\` is called once per cart item.`,
        tests: [
          { name: 'receipt_line calls are logged', code: py`assert "calling receipt_line('tea', 3.5)" in output, 'Decorate receipt_line with @log_calls'` },
          { name: 'the receipt still prints', code: py`assert 'tea       3.50' in output` },
        ],
        explain: py`Two items → two calls → four new lines (a "calling" and a "returned" line each). You changed the behaviour of every call by adding **one line** and without touching the function body — that's the whole point of decorators.`,
      },
      {
        id: 'count-twice',
        task: py`Call \`apply_discount\` a second time (say, 20% off) **before** the line that prints \`apply_discount calls:\`. What will the counter show?`,
        hint: py`Add a line such as \`print("20% off:", apply_discount(total, 20))\` above the \`calls\` print.`,
        tests: [
          { name: 'apply_discount was called twice', code: py`assert apply_discount.calls == 2, f"calls is {apply_discount.calls}"` },
          { name: 'the counter line shows 2', code: py`assert 'apply_discount calls: 2' in output` },
        ],
        explain: py`The counter lives on the wrapper object (\`wrapper.calls\`), which is what the name \`apply_discount\` points to. The wrapper was created once, so its counter persists across calls — like a closure's state, but visible from outside.`,
      },
      {
        id: 'by-hand',
        task: py`Remove the \`@timed\` line and decorate \`checkout\` **by hand** instead: right after the \`checkout\` function, add \`checkout = timed(checkout)\`. The output should not change.`,
        hint: py`The line must come after the whole \`def checkout\` block and before \`checkout(cart)\` is called.`,
        tests: [
          { name: 'no @timed line any more', code: py`assert '@timed' not in files['main.py'], 'Delete the @timed line'` },
          { name: 'decorated by hand', code: py`assert 'checkout = timed(checkout)' in files['main.py']` },
          { name: 'checkout is still timed', code: py`assert 'checkout took' in output and checkout.__name__ == 'wrapper'` },
        ],
        explain: py`\`@timed\` is pure syntax sugar for \`checkout = timed(checkout)\`. The only differences are readability (the decorator is visible at the top of the function) and that with \`@\` the undecorated function is never bound to the name, even briefly.`,
      },
      {
        id: 'definition-time',
        task: py`Add \`print(f"decorating {func.__name__}")\` as the **first line inside \`count_calls\`** (above \`def wrapper\`, not inside it). Where does the line appear in the output, and how many times?`,
        hint: py`Indent it 4 spaces — the same level as \`def wrapper\`. Then look at the very top of the output.`,
        tests: [
          { name: 'printed once', code: py`assert output.count('decorating apply_discount') == 1` },
          { name: 'printed before any call is logged', code: py`assert output.index('decorating apply_discount') < output.index('calling add_item')` },
        ],
        explain: py`The decorator body runs **once, when \`def apply_discount\` executes** — before the shop code at the bottom even starts. Only the code *inside* the wrapper runs per call. Mixing these two up is the most common decorator bug.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What @decorator does, step by step',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'orig', label: 'original function', note: 'def farewell(name): …', x: 130, y: 250, tone: 'paper' },
        { id: 'deco', label: 'shout(func)', note: 'runs once, right after def', x: 380, y: 250, tone: 'blue' },
        { id: 'wrapper', label: 'wrapper', note: 'closure: func → original', x: 630, y: 250, tone: 'yellow' },
        { id: 'name', label: 'farewell', note: 'the name in the module', x: 630, y: 70, tone: 'ink' },
        { id: 'call', label: 'farewell("ben")', note: 'a call, any time later', x: 250, y: 70, tone: 'red' },
      ],
      edges: [
        { id: 'pass', from: 'orig', to: 'deco', label: 'passed in as func' },
        { id: 'ret', from: 'deco', to: 'wrapper', label: 'returns' },
        { id: 'bind', from: 'name', to: 'wrapper', label: 'name bound to' },
        { id: 'lookup', from: 'call', to: 'name', label: 'looks up' },
        { id: 'inner', from: 'wrapper', to: 'orig', label: 'func(*args, **kwargs)', dashed: true },
      ],
      steps: [
        { focus: ['orig'], text: py`\`def farewell(name): ...\` compiles the body and creates a **function object**. Because a decorator line is above it, the name \`farewell\` is *not* bound to it yet.` },
        { focus: ['orig', 'deco'], edges: ['pass'], text: py`Python calls the decorator with the new function: \`shout(<function farewell>)\`. Inside \`shout\`, the parameter \`func\` refers to the original. This happens **once**, at definition time.` },
        { focus: ['deco', 'wrapper'], edges: ['ret'], text: py`\`shout\` defines \`wrapper\` and returns it. The wrapper is a closure: it carries a cell holding \`func\`, so the original stays alive inside it.` },
        { focus: ['name', 'wrapper'], edges: ['bind'], text: py`Python binds the name \`farewell\` to whatever the decorator returned — the wrapper. The original function now has no name of its own in the module; it's reachable only through the wrapper's closure.` },
        { focus: ['call', 'name', 'wrapper'], edges: ['lookup', 'bind'], text: py`Later, \`farewell("ben")\` looks up the name and finds the **wrapper**. The wrapper's "before" code runs first.` },
        { focus: ['wrapper', 'orig'], edges: ['inner'], text: py`The wrapper calls \`func(*args, **kwargs)\` — the original runs with the same arguments. Its result flows back to the wrapper, which may change it, log it, time it… and finally returns it to the caller.` },
      ],
    },
    alt: 'Diagram: the original function is passed into shout(func), which returns a wrapper whose closure points back at the original. The module name farewell is bound to the wrapper. A later call farewell("ben") looks up the name, reaches the wrapper, and the wrapper calls the original via func(*args, **kwargs).',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A decorator doesn't change your function's code. It **replaces the name**. After \`@shout\`, the name \`farewell\` points at a different function object (the wrapper), and the original is tucked away inside the wrapper's closure.`,
      py`You can see the hidden original yourself. A closure keeps its captured variables in *cells*, listed in \`__closure__\`; the matching names are in \`__code__.co_freevars\`:`,
      { code: py`def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper


@shout
def farewell(name):
    return f"bye {name}"


print(farewell.__name__)                              # wrapper
print(farewell.__code__.co_freevars)                  # ('func',)
original = farewell.__closure__[0].cell_contents
print(original.__name__, original("ben"))             # farewell bye ben`, lang: 'python', title: 'digging the original out of the wrapper' },
      py`That's the whole trick: a function, wrapped in another function, which remembers it.`,
    ],
    technical: [
      py`#### The exact equivalence`,
      py`The language reference defines a decorated \`def\` as roughly equivalent to calling the decorator on the new function and binding the result — with one subtlety: the original is **never** bound to the name, not even for a moment.`,
      { code: py`def plain(func):
    return func

# This...
@plain
def report():
    return "ok"

# ...is roughly this (but without the brief moment where report is undecorated):
def report():
    return "ok"
report = plain(report)`, lang: 'python', title: 'roughly equivalent forms' },
      py`The decorator *expression* (the part after \`@\`) is evaluated **before** the function object is created, in the scope that contains the \`def\`. That matters when the expression is a call such as \`@app.route("/cart")\`: \`app.route("/cart")\` runs first and must return the real decorator. That's "decorators with arguments" — the next lesson.`,
      { callout: 'note', title: 'CPython detail: what the bytecode does', text: py`Disassembling a decorated \`def\` with \`dis\` in CPython 3.14 shows the order: \`LOAD_NAME shout\` (evaluate the decorator), \`MAKE_FUNCTION\` (build the function object), \`CALL\` (pass it to the decorator), \`STORE_NAME greet\` (bind the result). Opcode names change between CPython versions and other implementations compile differently — but every Python follows the same evaluation order, because the language reference specifies it.` },
      py`#### What a decorator may return`,
      py`Anything. The language only says "the name is bound to the result":`,
      py`| decorator returns | example | effect |
|---|---|---|
| a wrapper function | \`log_calls\`, \`timed\` | adds behaviour around every call |
| the same function | \`register\`, \`@app.route\` | records the function somewhere, behaviour unchanged |
| a callable object | \`functools.cache\`, \`functools.lru_cache\` | a cache object that also behaves like the function |
| a descriptor | \`property\`, \`staticmethod\`, \`classmethod\` | changes how the attribute behaves on a class — see [descriptors](lesson:descriptors) |
| a modified class | \`@dataclass\` | class decorators: the next lesson |`,
      py`#### Why \`*args, **kwargs\``,
      py`A wrapper that declares fixed parameters (\`def wrapper(x)\`) only fits functions with that exact shape and fails on others with \`TypeError: …wrapper() takes 1 positional argument but 2 were given\`. \`*args, **kwargs\` accepts every combination of positional and keyword arguments and \`func(*args, **kwargs)\` forwards them unchanged — including keyword-only and defaulted parameters, which the original still validates.`,
      py`#### State: closure variable or function attribute?`,
      py`\`count_calls\` stores its counter as an **attribute on the wrapper** (\`wrapper.calls\`). Functions have a \`__dict__\`, so this works, and it has a bonus: callers can read \`apply_discount.calls\`. The alternative is a closure variable updated with \`nonlocal\` — private, but invisible from outside. For richer state (reset, report, configure) a class with \`__call__\` is clearer; [advanced decorators](lesson:advanced-decorators) shows that version.`,
    ],
    production: [
      py`**Always use \`functools.wraps\`.** Without it, logs, tracebacks, \`help()\`, documentation tools and debuggers all see \`wrapper\` instead of the real name and docstring. One line fixes it — see [advanced decorators](lesson:advanced-decorators).`,
      py`**Log with \`logging\`, not \`print\`.** A real \`log_calls\` uses \`logging.getLogger(func.__module__)\` and a level such as \`DEBUG\`, so it can be switched off in production without removing decorators. Never log arguments that may contain secrets (passwords, tokens, card numbers) — see [logging](lesson:logging).`,
      py`**Don't swallow exceptions.** A decorator that catches everything and returns \`None\` turns crashes into mysterious wrong answers. Use \`try/finally\` for "always do this" (timing, cleanup), and re-raise if you catch something only to log it.`,
      py`**Overhead is real but small.** Each decorated call adds one more Python function call (the wrapper) plus argument packing and unpacking. For I/O-bound work this is noise; in a tight numeric loop called millions of times it can show up. Measure with \`timeit\` before worrying — see [profiling](lesson:profiling).`,
      py`**Async functions need an async wrapper.** Calling an \`async def\` function only *creates* a coroutine, so a plain timing wrapper measures roughly nothing and logs a coroutine object as the "result". Write \`async def wrapper(...)\` with \`return await func(...)\` for coroutine functions (\`inspect.iscoroutinefunction(func)\` tells you which you have). See [async/await](lesson:asyncio-basics).`,
      py`**Keep definition-time work cheap.** Decorator bodies run at import time. A decorator that opens a database connection or reads a large file makes *importing* your module slow and fragile — and makes tests hard. Do that work lazily, inside the wrapper or on first use.`,
      { code: py`from flask import Flask
import pytest
from functools import cache

app = Flask(__name__)

@app.route("/cart")          # registers the view: behaviour unchanged
def show_cart():
    return "your cart"

@pytest.fixture               # marks a function as a test fixture
def empty_cart():
    return {}

@cache                         # wraps with a memoising cache object
def shipping_cost(country):
    ...`, lang: 'python', static: true, title: 'decorators you will meet in real code (Flask and pytest are third-party)' },
    ],
  },
  mistakes: [
    {
      title: 'Returning wrapper() instead of wrapper',
      wrong: { code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper()      # calls the wrapper NOW, with no arguments`, lang: 'python' },
      right: { code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper        # return the function object itself`, lang: 'python' },
      explanation: py`The decorator must return a *function*. \`wrapper()\` calls it immediately — at definition time — usually crashing with \`TypeError: add() missing 2 required positional arguments\`, or, if the function takes no arguments, binding the name to its *return value*.`,
    },
    {
      title: 'Forgetting to return the result',
      wrong: { code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        func(*args, **kwargs)          # result thrown away
    return wrapper

@log_calls
def add(a, b):
    return a + b

print(add(2, 3))   # None`, lang: 'python' },
      right: { code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)   # pass the result back
    return wrapper`, lang: 'python' },
      explanation: py`A function without a \`return\` returns \`None\`. The original computed 5, but the wrapper dropped it on the floor. Every wrapper should end with \`return result\` (or \`return func(...)\`).`,
    },
    {
      title: 'A wrapper with a fixed signature',
      wrong: { code: py`def log_calls(func):
    def wrapper(x):                    # only fits one-argument functions
        print("calling", func.__name__)
        return func(x)
    return wrapper`, lang: 'python' },
      right: { code: py`def log_calls(func):
    def wrapper(*args, **kwargs):      # fits any function
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper`, lang: 'python' },
      explanation: py`Decorate a two-argument function with the wrong version and calls fail with \`TypeError: log_calls.<locals>.wrapper() takes 1 positional argument but 2 were given\`. Forward everything with \`*args, **kwargs\`.`,
    },
    {
      title: 'Putting per-call work in the decorator body',
      wrong: { code: py`import time

def timed(func):
    start = time.perf_counter()        # runs ONCE, at definition time
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        print(time.perf_counter() - start)   # time since the def, not since the call!
        return result
    return wrapper`, lang: 'python' },
      right: { code: py`import time

def timed(func):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()    # runs on EVERY call
        result = func(*args, **kwargs)
        print(time.perf_counter() - start)
        return result
    return wrapper`, lang: 'python' },
      explanation: py`Code in the decorator's body runs once when the function is decorated. Code that must happen per call belongs **inside** the wrapper. The wrong version reports ever-growing "durations".`,
    },
    {
      title: 'Adding () to a decorator that takes no arguments',
      wrong: { code: py`@log_calls()          # TypeError: log_calls() missing 1 required positional argument: 'func'
def add(a, b):
    return a + b`, lang: 'python', static: true },
      right: { code: py`@log_calls
def add(a, b):
    return a + b`, lang: 'python', static: true },
      explanation: py`\`@log_calls()\` first *calls* \`log_calls\` with no arguments, then tries to use the result as the decorator. Only decorators **built** to take arguments (\`@retry(times=3)\`) use parentheses — see [advanced decorators](lesson:advanced-decorators).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'NoneType' object is not callable — when calling a decorated function`,
      cause: py`The decorator forgot \`return wrapper\`, so it returned \`None\` and the function's name is now bound to \`None\`.`,
      fix: py`Make the last line of the decorator \`return wrapper\` (indented at the decorator's level, not inside the wrapper).`,
    },
    {
      symptom: py`A decorated function suddenly returns None`,
      cause: py`The wrapper calls \`func(*args, **kwargs)\` but doesn't return its result.`,
      fix: py`Use \`return func(*args, **kwargs)\`, or store it in \`result\` and \`return result\` after the "after" code.`,
    },
    {
      symptom: py`TypeError: log_calls.<locals>.wrapper() takes 1 positional argument but 2 were given`,
      cause: py`The wrapper's parameter list doesn't match the decorated function.`,
      fix: py`Declare the wrapper as \`def wrapper(*args, **kwargs)\` and forward with \`func(*args, **kwargs)\`.`,
    },
    {
      symptom: py`TypeError: log_calls() missing 1 required positional argument: 'func'`,
      cause: py`You wrote \`@log_calls()\` with parentheses, but \`log_calls\` takes the function directly.`,
      fix: py`Remove the parentheses, or rewrite it as a decorator factory if you really need arguments.`,
    },
    {
      symptom: py`Tracebacks, logs or help() mention "wrapper" instead of the real function name`,
      cause: py`The wrapper replaced the function and its metadata wasn't copied.`,
      fix: py`Add \`@functools.wraps(func)\` above \`def wrapper\` (see [advanced decorators](lesson:advanced-decorators)).`,
    },
    {
      symptom: py`Something in the decorator happens once instead of on every call (or at import time when it shouldn't)`,
      cause: py`The code sits in the decorator body rather than inside the wrapper.`,
      fix: py`Move per-call code into the wrapper. Keep only one-time setup in the decorator body.`,
    },
  ],
  bestPractices: [
    'Use the standard template: def deco(func): def wrapper(*args, **kwargs): ... return func(*args, **kwargs) ... return wrapper.',
    'Always return the wrapped function’s result, and never return wrapper() — return wrapper.',
    'Add @functools.wraps(func) to every wrapper in real code so names, docstrings and __wrapped__ survive.',
    'Use try/finally for work that must happen after the call even when it raises (timing, cleanup); don’t swallow exceptions.',
    'Keep decorators focused on one cross-cutting concern each; name them for what they add (@timed, @require_login).',
    'Do cheap, deterministic work at definition time; anything slow or side-effectful belongs inside the wrapper.',
    'Prefer logging over print in reusable decorators, and never log secrets passed as arguments.',
  ],
  useCases: [
    'Logging calls and results while debugging or auditing.',
    'Timing functions to find slow spots (then confirm with a profiler).',
    'Access control: refusing calls from users who are not logged in or lack a permission.',
    'Retrying flaky operations such as network calls a few times before giving up.',
    'Registering functions in a table: URL routes, CLI commands, plugins, event handlers.',
    'Caching results of expensive pure functions (functools.cache / lru_cache).',
    'Validating arguments before the real function runs.',
  ],
  whenToUse: {
    use: [
      'The same before/after behaviour is needed by many unrelated functions.',
      'You want the extra behaviour to be visible at the definition site and removable with one line.',
      'A framework needs to discover functions (routes, commands, handlers) when a module is imported.',
    ],
    avoid: [
      'The extra logic is specific to one function — just write it in that function.',
      'The decorator would silently change what the function returns or hide its exceptions; surprising behaviour behind a one-word line is hard to debug.',
      'A hot inner loop where the extra call per invocation has been measured to matter.',
      'When an explicit helper call (with_retry(fetch, url)) is clearer for the people reading the code.',
    ],
  },
  comparison: {
    title: 'Copy-pasted logging vs a decorator',
    headers: ['', 'Logging lines pasted into every function', 'A @log_calls decorator'],
    rows: [
      ['where the logging code lives', 'repeated in every function body', 'in one place: the decorator'],
      ['adding logging to a new function', 'copy 3–5 lines and adapt them', 'add one @log_calls line'],
      ['changing the log format', 'edit every copy (and miss some)', 'edit the decorator once'],
      ['reading the business logic', 'mixed with logging noise', 'the body contains only the real work'],
      ['turning it off', 'delete lines everywhere', 'remove the decorator, or make it check a setting'],
      ['cost', 'none extra', 'one extra function call per call'],
    ],
    note: py`Decorators are an application of the *open/closed* idea: extend behaviour without editing the function. See [SOLID principles](lesson:solid) and [design patterns](lesson:design-patterns) for the bigger picture.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'decorators-q1',
      type: 'mcq',
      prompt: py`Which line is equivalent to putting \`@timed\` directly above \`def checkout(cart): ...\`?`,
      options: [
        'checkout = timed(checkout)',
        { text: 'timed(checkout)() on every call', why: 'The decorator runs once, when the def runs. Afterwards each call goes to the wrapper it returned.' },
        { text: 'checkout = timed', why: 'That would make checkout another name for the decorator itself, so calling checkout(cart) would run timed(cart).' },
        { text: 'timed = checkout(timed)', why: 'It is the other way round: the decorator receives the function.' },
      ],
      answer: 0,
      explanation: py`The decorator is called with the freshly created function, and the name is bound to whatever it returns. The only difference from writing it by hand is that with \`@\` the undecorated function is never bound to the name, not even briefly.`,
    },
    {
      id: 'decorators-q2',
      type: 'output',
      prompt: 'Predict the output, line by line.',
      code: py`def register(func):
    print("registering", func.__name__)
    return func

print("start")

@register
def ping():
    print("pong")

print("defined")
ping()`,
      options: [
        'start\nregistering ping\ndefined\npong',
        { text: 'start\ndefined\nregistering ping\npong', why: 'This assumes the decorator runs when ping() is called. It runs when the def statement executes, which is before print("defined").' },
        { text: 'registering ping\nstart\ndefined\npong', why: 'The decorator runs when its def is reached, and the def comes after print("start").' },
        { text: 'start\nregistering ping\ndefined\nregistering ping\npong', why: 'register returned the original function unchanged, so calling ping() never goes through register again.' },
      ],
      answer: 0,
      explanation: py`Python runs top to bottom. \`print("start")\` runs, then the \`def\` creates \`ping\` and immediately calls \`register(ping)\`, printing "registering ping". \`register\` returns the same function, so \`ping()\` just prints "pong".`,
    },
    {
      id: 'decorators-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def double_result(func):
    def wrapper(*args):
        return func(*args) * 2
    return wrapper

@double_result
def add(a, b):
    return a + b

print(add(2, 3), add.__name__)`,
      answer: '10 wrapper',
      accept: ['10 wrapper'],
      explanation: py`\`add\` now refers to the wrapper: it calls the original (5) and doubles it (10). And because the name points at the wrapper, \`add.__name__\` is \`"wrapper"\` — the reason \`functools.wraps\` exists.`,
    },
    {
      id: 'decorators-q4',
      type: 'bug',
      prompt: py`After decorating, \`print(add(2, 3))\` prints \`None\` instead of 5. Click the line with the bug.`,
      code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        func(*args, **kwargs)
    return wrapper

@log_calls
def add(a, b):
    return a + b

print(add(2, 3))`,
      answerLine: 4,
      explanation: py`The wrapper calls the original but throws its result away, and a function with no \`return\` returns \`None\`. Line 4 should be \`return func(*args, **kwargs)\`.`,
    },
    {
      id: 'decorators-q5',
      type: 'fill',
      prompt: py`Complete the decorator so that \`greet("Ada")\` prints \`Starting greet\` and then returns \`"hi Ada"\`.`,
      code: py`def announce(func):
    def wrapper(*args, **kwargs):
        print("Starting", func.__name__)
        return ___(*args, **kwargs)
    return ___

@announce
def greet(name):
    return "hi " + name`,
      answer: [['func'], ['wrapper']],
      explanation: py`Inside the wrapper, \`func\` is the original function (captured by the closure), so \`return func(*args, **kwargs)\` runs it and passes the result back. The decorator returns the wrapper **object** — no parentheses.`,
    },
    {
      id: 'decorators-q6',
      type: 'mcq',
      prompt: py`Why do almost all wrappers use \`def wrapper(*args, **kwargs)\` and \`func(*args, **kwargs)\`?`,
      options: [
        { text: 'It makes the wrapped function run faster', why: 'Packing and unpacking arguments costs a little time; it is about flexibility, not speed.' },
        'So one decorator works on functions with any parameters, forwarding every argument unchanged',
        { text: 'Python requires decorators to use exactly those parameter names', why: 'The names are a convention. Any names work; the * and ** are what matter.' },
        { text: 'It stops the original function from validating its arguments', why: 'The original still receives the arguments and raises TypeError for wrong ones, just as before.' },
      ],
      answer: 1,
      explanation: py`\`*args\` gathers positional arguments into a tuple and \`**kwargs\` gathers keyword arguments into a dict; \`func(*args, **kwargs)\` spreads them back out. The wrapper doesn't need to know the original's signature.`,
    },
    {
      id: 'decorators-q7',
      type: 'short',
      prompt: py`A teammate's \`@timed\` decorator reports durations that keep growing (0.5 s, 3 s, 9 s…) even though the function is fast. Their code starts the stopwatch on the first line of \`timed\`, above \`def wrapper\`. Explain the bug.`,
      answer: py`The decorator body runs only once, when the function is decorated (at definition/import time). So \`start\` is recorded once and every call measures "time since the function was defined". Per-call work, like reading the clock, must happen inside the wrapper, which runs on every call.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'require-login',
      title: 'Bouncer at the door',
      difficulty: 'intermediate',
      prompt: py`A tiny web app passes the current user as the **first argument** of every view function. \`user\` is a dict like \`{"name": "Ada"}\` when someone is logged in, and \`None\` when nobody is.

Write a decorator \`require_login(func)\` that:

1. returns the string \`"401 Unauthorized"\` **without calling the view** when the first argument is \`None\`;
2. otherwise calls the view with **all** the original arguments (positional and keyword) and returns its result.

\`view_profile\` is already decorated for you. The tests also decorate new view functions with different parameters.`,
      files: {
        'main.py': py`def require_login(func):
    # TODO: return a wrapper that refuses anonymous users (user is None)
    return func


@require_login
def view_profile(user, tab="overview"):
    return f"{user['name']}'s profile ({tab})"


print(view_profile({"name": "Ada"}))
print(view_profile({"name": "Ben"}, tab="photos"))
`,
      },
      hints: [
        'Start from the template: def wrapper(*args, **kwargs): ... return wrapper. The user is args[0].',
        'Check the first positional argument before calling func. If it is None, return "401 Unauthorized" straight away.',
        'Name the first parameter explicitly: def wrapper(user, *args, **kwargs): if user is None: return "401 Unauthorized" / return func(user, *args, **kwargs)',
      ],
      solution: {
        explanation: py`The wrapper names the first parameter \`user\` and collects everything else in \`*args\` and \`**kwargs\`. If \`user is None\` it returns early, so the view never runs (no side effects for anonymous users). Otherwise it forwards **all** arguments unchanged and returns the view's result.

Using \`is None\` rather than \`not user\` matters: an empty dict is falsy, but it isn't "nobody". In a real framework you would also add \`@functools.wraps(func)\` and probably return a proper response object or raise an exception the framework turns into a 401.`,
        files: {
          'main.py': py`def require_login(func):
    def wrapper(user, *args, **kwargs):
        if user is None:
            return "401 Unauthorized"
        return func(user, *args, **kwargs)
    return wrapper


@require_login
def view_profile(user, tab="overview"):
    return f"{user['name']}'s profile ({tab})"


print(view_profile({"name": "Ada"}))
print(view_profile({"name": "Ben"}, tab="photos"))
`,
        },
      },
      tests: [
        { name: 'logged-in users see the profile', code: py`assert view_profile({"name": "Ada"}) == "Ada's profile (overview)"` },
        { name: 'anonymous users get "401 Unauthorized"', code: py`assert view_profile(None) == "401 Unauthorized"` },
        { name: 'keyword arguments are forwarded', code: py`assert view_profile({"name": "Ben"}, tab="photos") == "Ben's profile (photos)"` },
        {
          name: 'the view is not called for anonymous users',
          code: py`deleted = []

@require_login
def delete_account(user):
    deleted.append(user)
    return "deleted"

assert delete_account(None) == "401 Unauthorized"
assert deleted == [], 'The view ran even though user was None'`,
        },
        {
          name: 'works on views with other parameters',
          code: py`@require_login
def settings(user, theme, *, beta=False):
    return (user["name"], theme, beta)

assert settings({"name": "Cy"}, "dark", beta=True) == ("Cy", "dark", True)`,
        },
      ],
    },
    {
      id: 'retry-three-times',
      title: 'Try again (up to three times)',
      difficulty: 'intermediate',
      prompt: py`Network calls sometimes fail for no good reason. Write a decorator \`retry_three_times(func)\` that:

1. calls \`func\` with the same arguments;
2. if the call raises an \`Exception\`, tries again — **at most 3 attempts in total**;
3. returns the result of the first attempt that succeeds;
4. if all 3 attempts fail, **re-raises** the last exception (don't return \`None\`, don't wrap it).

The program at the bottom simulates a price server that fails twice and then answers. With your decorator it should print \`tea costs 3.5 (took 3 attempts)\`.`,
      files: {
        'main.py': py`def retry_three_times(func):
    # TODO: call func up to 3 times; re-raise the last error if every attempt fails
    return func


attempts = 0


@retry_three_times
def fetch_price(item):
    global attempts
    attempts += 1
    if attempts < 3:
        raise ConnectionError("price server busy")
    return {"tea": 3.5, "scone": 2.25}[item]


try:
    price = fetch_price("tea")
    print(f"tea costs {price} (took {attempts} attempts)")
except ConnectionError as err:
    print("gave up:", err)
`,
      },
      hints: [
        'The wrapper needs a loop that runs at most 3 times, with a try/except inside it.',
        'Inside the loop: try: return func(*args, **kwargs). A successful return leaves the loop (and the wrapper) immediately.',
        'for attempt in range(3): try: return func(*args, **kwargs) / except Exception: if attempt == 2: raise   — a bare raise re-raises the exception being handled.',
      ],
      solution: {
        explanation: py`The loop gives the function three chances. \`return func(*args, **kwargs)\` inside \`try\` exits the wrapper as soon as an attempt works. When an attempt raises, the \`except\` block checks whether that was the last attempt; if so, a bare \`raise\` re-raises the *same* exception with its original traceback, so callers see the real error.

Catching \`Exception\` (not a bare \`except:\`) lets \`KeyboardInterrupt\` and \`SystemExit\` through — you never want Ctrl+C to be "retried". Production retry code goes further: it retries only specific exceptions (\`ConnectionError\`, timeouts), waits between attempts with growing delays (*exponential backoff*), logs each failure, and is only used for operations that are safe to repeat. Making the attempt count configurable — \`@retry(times=5)\` — needs a decorator **with arguments**, which is the next lesson.`,
        files: {
          'main.py': py`def retry_three_times(func):
    def wrapper(*args, **kwargs):
        for attempt in range(3):
            try:
                return func(*args, **kwargs)
            except Exception:
                if attempt == 2:      # that was the last attempt
                    raise
    return wrapper


attempts = 0


@retry_three_times
def fetch_price(item):
    global attempts
    attempts += 1
    if attempts < 3:
        raise ConnectionError("price server busy")
    return {"tea": 3.5, "scone": 2.25}[item]


try:
    price = fetch_price("tea")
    print(f"tea costs {price} (took {attempts} attempts)")
except ConnectionError as err:
    print("gave up:", err)
`,
        },
      },
      tests: [
        { name: 'the demo succeeds on the third attempt', code: py`assert "tea costs 3.5 (took 3 attempts)" in output` },
        {
          name: 'retries until it works',
          code: py`count = {"n": 0}

@retry_three_times
def flaky():
    count["n"] += 1
    if count["n"] < 3:
        raise ValueError("not yet")
    return "ok"

assert flaky() == "ok"
assert count["n"] == 3`,
        },
        {
          name: 'gives up after exactly 3 attempts and re-raises',
          code: py`count = {"n": 0}

@retry_three_times
def broken():
    count["n"] += 1
    raise ConnectionError("down")

with raises(ConnectionError, match="down"):
    broken()
assert count["n"] == 3, f"expected 3 attempts, got {count['n']}"`,
        },
        {
          name: 'does not retry a call that succeeds',
          code: py`count = {"n": 0}

@retry_three_times
def fine(a, b=0):
    count["n"] += 1
    return a + b

assert fine(2, b=3) == 5
assert count["n"] == 1`,
        },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'decorators-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a decorator in Python, and what does the @ syntax actually do?',
      answer: 'A decorator is a callable that takes a function (or class) and returns a replacement. `@deco` above `def f` means "create f, then bind f = deco(f)". Usually the replacement is a wrapper closure that adds behaviour before/after calling the original.',
      explanation: py`It relies on functions being first-class objects and on closures: the wrapper remembers the original \`func\`. The decorator runs once, at definition time; the wrapper runs on every call. A decorator can also return the function unchanged (registration) or a different object entirely (\`property\`, a cache object).`,
      code: { lang: 'python', code: py`def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper

@shout                 # greet = shout(greet)
def greet(name):
    return f"hi {name}"

print(greet("ada"))    # HI ADA` },
      whyAsked: 'Decorators appear in almost every Python codebase (frameworks, tests, caching), so interviewers check you understand the mechanism rather than just the syntax.',
      mistakes: ['Saying a decorator "modifies the function\'s code"', 'Not knowing when the decorator runs (definition time vs call time)', 'Forgetting that the wrapper must return the result'],
      followUps: ['What does functools.wraps do?', 'How would you write a decorator that takes arguments?', 'In what order are stacked decorators applied?'],
      modelAnswer: 'A decorator is just a callable that takes a function and returns something to use in its place. The @ syntax is sugar: putting @timed above def checkout means Python creates the checkout function and then immediately rebinds checkout = timed(checkout). Typically the decorator defines an inner wrapper that accepts *args and **kwargs, does something before and after calling the original, returns the result, and the decorator returns that wrapper. It works because functions are objects and the wrapper is a closure that remembers the original. The decorator itself runs once at definition time, while the wrapper runs on every call.',
    },
    {
      id: 'decorators-import-time',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'This module is imported by another file, which never calls any of its functions. What does the importer see printed, and what is in ROUTES afterwards?',
      code: { lang: 'python', code: py`ROUTES = {}

def route(func):
    print("adding", func.__name__)
    ROUTES["/" + func.__name__] = func
    return func

@route
def home():
    return "Home page"

@route
def cart():
    return "Your cart"` },
      options: [
        'Nothing is printed and ROUTES is empty until the functions are called',
        '"adding home" and "adding cart" are printed; ROUTES has /home and /cart',
        'Only "adding home" is printed; the second decorator waits for the first call',
        'An error, because route does not return a wrapper',
      ],
      correctOption: 1,
      answer: 'Both "adding home" and "adding cart" are printed during the import, and ROUTES maps "/home" and "/cart" to the functions — decorators run when each def executes.',
      explanation: py`Importing a module executes it top to bottom. Each \`def\` with a decorator calls the decorator right away. \`route\` returns the original function, which is perfectly valid — a decorator doesn't have to wrap anything. This is how frameworks discover routes, commands and plugins.`,
      whyAsked: 'Registration decorators and import-time side effects are a common source of "why is my route missing" bugs (the module was never imported).',
      mistakes: ['Thinking decorators run lazily on the first call', 'Believing a decorator must return a new function'],
      followUps: ['Why might a route be missing if its module is never imported?', 'What problems do import-time side effects cause in tests?', 'How would you register functions under a custom URL instead of the function name?'],
      modelAnswer: 'Both lines print during the import, and ROUTES ends up with /home and /cart. A decorator runs at the moment its def statement executes, and importing a module executes its top-level code, so each decorator is called once, immediately. route doesn\'t wrap anything — it records the function in a dict and returns it unchanged, which is a valid decorator. That is exactly how frameworks like Flask register routes. The flip side is that if nobody imports the module, nothing gets registered, and any heavy work in a decorator slows down every import.',
    },
    {
      id: 'decorators-wrapper-call-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This module crashes on import with `TypeError: add() missing 2 required positional arguments: \'a\' and \'b\'`, even though nothing calls add. Find and fix the bug.',
      code: { lang: 'python', code: py`def log_calls(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper()

try:
    @log_calls
    def add(a, b):
        return a + b
except TypeError as err:
    print(err)` },
      answer: 'The decorator returns wrapper() — it calls the wrapper at decoration time with no arguments, which calls add() with none. It must return the function object: return wrapper.',
      explanation: py`Decoration happens at import time, so any call made in the decorator body happens then too. \`wrapper()\` forwards zero arguments to \`add\`, which raises. If the function took no arguments, the bug would be quieter: the name would be bound to the function's *return value*, and the first call would fail with "object is not callable".`,
      whyAsked: 'Distinguishing a function object from a call to it is fundamental, and this bug shows whether the candidate understands decoration time.',
      mistakes: ['Blaming the arguments of add', 'Not noticing that the error happens at import time, not call time'],
      followUps: ['What would happen if add took no parameters?', 'How would you test that a decorator preserves return values?'],
      modelAnswer: 'The bug is the last line of the decorator: return wrapper() calls the wrapper immediately instead of returning it. Because decorators run when the def executes — here at import — the wrapper runs right away with no arguments and forwards those zero arguments to add, which raises TypeError. The fix is return wrapper, without parentheses, so the name add is bound to the wrapper function and the real call happens later. If add took no parameters this would fail more confusingly: add would be bound to its return value and the first call would say the object is not callable.',
    },
    {
      id: 'decorators-non-negative',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write a decorator `non_negative(func)` that raises `ValueError` before calling func if **any** int or float argument — positional or keyword — is negative. Other argument types are ignored; otherwise the call goes through unchanged.',
      answer: 'A wrapper that loops over args and kwargs.values(), raises ValueError for any negative int/float, then returns func(*args, **kwargs).',
      explanation: py`Collecting positional and keyword values together (\`[*args, *kwargs.values()]\`) checks both kinds in one loop. Including the function's name in the error message makes failures easier to trace. A real version would add \`functools.wraps\`, and for serious validation you'd use type hints plus a validation library or explicit checks at your trust boundary.`,
      starter: { files: { 'main.py': py`def non_negative(func):
    # TODO: raise ValueError if any int/float argument is negative
    return func


@non_negative
def area(width, height):
    return width * height


print(area(2, 3))
` } },
      tests: [
        { name: 'valid calls work', code: py`assert area(2, 3) == 6` },
        { name: 'negative positional argument', code: py`with raises(ValueError):
    area(-2, 3)` },
        { name: 'negative keyword argument', code: py`with raises(ValueError):
    area(width=2, height=-1)` },
        {
          name: 'non-numbers are ignored and the function is not called on bad input',
          code: py`seen = []

@non_negative
def label(text, size):
    seen.append(text)
    return f"{text}:{size}"

assert label("box", 4) == "box:4"
with raises(ValueError):
    label("bad", -0.5)
assert seen == ["box"]`,
        },
      ],
      solution: { files: { 'main.py': py`def non_negative(func):
    def wrapper(*args, **kwargs):
        for value in [*args, *kwargs.values()]:
            if isinstance(value, (int, float)) and value < 0:
                raise ValueError(f"{func.__name__}() got a negative argument: {value}")
        return func(*args, **kwargs)
    return wrapper


@non_negative
def area(width, height):
    return width * height


print(area(2, 3))
` } },
      hints: ['Positional arguments are in args (a tuple), keyword ones in kwargs.values().', 'Check everything first, and only call func if nothing was negative.'],
      whyAsked: 'A short, test-graded decorator checks fluency with *args/**kwargs forwarding and the wrapper template under time pressure.',
      mistakes: ['Only checking positional arguments', 'Calling func before validating', 'Swallowing the error and returning None'],
      followUps: ['How would you make the allowed minimum configurable? (decorator with arguments)', 'How could inspect.signature bind arguments to parameter names for better error messages?'],
      modelAnswer: 'I would write the standard wrapper with *args and **kwargs. Before calling the function I loop over both the positional values and kwargs.values(), and if any of them is an int or float below zero I raise ValueError naming the function and the value. Only if everything passes do I return func(*args, **kwargs), so the original is never called with bad input. In production I would add functools.wraps, and if I wanted error messages with parameter names I would use inspect.signature(func).bind(*args, **kwargs).',
    },
    {
      id: 'decorators-async-timer',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your `@timed` decorator works for normal functions, but on `async def fetch_orders()` it always logs about 0 ms and the logged "result" is a coroutine object. Why, and how do you fix it?',
      answer: 'Calling an async function only creates a coroutine; the work happens when it is awaited, after the wrapper has returned. Write an async wrapper (async def wrapper: ... return await func(...)) for coroutine functions, choosing with inspect.iscoroutinefunction.',
      explanation: py`A plain wrapper times \`func(*args, **kwargs)\`, which for an \`async def\` function just builds a coroutine object instantly. The caller awaits it later, outside the timing window. The async wrapper awaits inside the timed region. A decorator meant for both kinds checks \`inspect.iscoroutinefunction(func)\` at decoration time and returns the right wrapper.`,
      code: { lang: 'python', code: py`import asyncio
import functools
import inspect
import time


def timed(func):
    if inspect.iscoroutinefunction(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                return await func(*args, **kwargs)
            finally:
                print(f"{func.__name__} took {time.perf_counter() - start:.2f}s")
        return async_wrapper

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__} took {time.perf_counter() - start:.2f}s")
    return wrapper


@timed
async def fetch_orders():
    await asyncio.sleep(0.1)
    return ["order-1"]


print(asyncio.run(fetch_orders()))` },
      whyAsked: 'Async code is everywhere in modern services; this tests whether you understand both decorators and what calling a coroutine function really does.',
      mistakes: ['Suggesting asyncio.run inside the wrapper (it fails inside a running event loop)', 'Making every wrapper async, which breaks normal functions'],
      followUps: ['What does calling an async def function return?', 'How do libraries like tenacity support both sync and async functions?'],
      modelAnswer: 'Calling an async def function doesn\'t run it — it just creates a coroutine object, almost instantly. My wrapper measured that creation and returned the coroutine, and the real work happened later when the caller awaited it, outside my timer. The fix is an async wrapper: async def wrapper that awaits func inside the timed region and returns the awaited result. To support both kinds, the decorator checks inspect.iscoroutinefunction(func) once at decoration time and returns either the async or the sync wrapper, both with functools.wraps.',
    },
    {
      id: 'decorators-vs-gof-pattern',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'How do Python decorators relate to the "Decorator" design pattern from object-oriented design books? When would you use each?',
      answer: 'Both add behaviour by wrapping instead of editing. The design pattern wraps an object behind the same interface at runtime (per instance); Python decorators wrap functions or classes at definition time via @. Use @-decorators for cross-cutting behaviour on functions; use object wrapping (composition) when you need to add behaviour to particular objects at runtime.',
      explanation: py`The classic pattern: \`LoggingStorage(storage)\` implements the same methods as \`storage\` and forwards to it, adding logging — you can wrap only *some* instances, and decide at runtime. Python's \`@\` syntax wraps a function once, when it's defined, for every caller. They share a goal (open for extension, closed for modification) but differ in *when* and *what* they wrap. See [composition](lesson:composition) and [design patterns](lesson:design-patterns).`,
      whyAsked: 'Distinguishes candidates who know the name from those who understand the idea, and checks design vocabulary.',
      mistakes: ['Saying they are the same thing', 'Claiming the @ syntax works on individual objects at runtime'],
      followUps: ['How would you add caching to one specific repository instance only?', 'What is a proxy object and how does __getattr__ help build one?'],
      modelAnswer: 'They share an idea — add behaviour by wrapping instead of changing the original — but they work at different levels. The design pattern wraps an object at runtime: a LoggingRepository holds a real repository, exposes the same methods and forwards calls, so I can decorate only some instances and choose at runtime. Python\'s @ decorators wrap a function or class once, at definition time, for every caller. I use @-decorators for cross-cutting concerns on functions, like timing or auth checks, and object wrapping through composition when the behaviour depends on runtime configuration or applies to specific instances.',
    },
    {
      id: 'decorators-cost',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'What does a wrapper-style decorator cost at runtime, and how would you decide whether that matters?',
      answer: 'Each call goes through one extra Python function call plus packing and unpacking *args/**kwargs (and whatever the wrapper does). That is negligible for I/O-bound or coarse-grained functions, but can be measurable in very hot, tiny functions. Measure with timeit or a profiler before optimising.',
      explanation: py`There's no runtime cost at definition beyond calling the decorator once. Per call, the wrapper frame, argument handling and the wrapper's own work add overhead. Exact costs depend on the interpreter version (CPython has made calls cheaper in recent releases) and the machine, so measure with \`timeit\` rather than guessing. If it matters, decorate a higher-level function instead of the inner one, or move the hot loop inside a single decorated call.`,
      whyAsked: 'Probes whether the candidate reasons about performance with measurement instead of folklore.',
      mistakes: ['Quoting invented numbers', 'Claiming decorators are free', 'Removing all decorators "for speed" without profiling'],
      followUps: ['How would you measure the overhead?', 'Does functools.wraps add per-call overhead? (No — it copies attributes once, at decoration time.)'],
      modelAnswer: 'A wrapper decorator costs one extra Python function call per invocation, plus collecting and re-spreading the arguments, plus whatever the wrapper itself does, like logging. For a function that does I/O or real work, that is noise. For a tiny function called millions of times in a loop it can show up. I would never guess: I would measure the decorated and undecorated versions with timeit or look at a profile, and if it matters I would apply the decorator at a coarser level or move the loop inside one decorated call. functools.wraps itself doesn\'t add per-call cost because it only copies attributes once.',
    },
  ],

  takeaways: [
    'A decorator is a callable that takes a function and returns a replacement; @deco above def f means f = deco(f).',
    'The usual replacement is a wrapper closure: def wrapper(*args, **kwargs) that does work before/after, calls func(*args, **kwargs) and returns its result.',
    'Decorators run once, when the def executes (often at import time); wrappers run on every call.',
    'Return wrapper (the function), never wrapper(); and always return the original’s result from the wrapper.',
    'A decorator may also return the same function (registration) or another object (property, a cache).',
    'After decoration the name points at the wrapper, so __name__ and the docstring are lost — functools.wraps fixes that (next lesson).',
  ],
}
