// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP_TOOLS = py`def make_discount(percent):
    """Return a function that takes percent % off a price."""
    def apply(price):
        return round(price * (1 - percent / 100), 2)
    return apply


def make_counter(label):
    """Return a function that counts how many times it is called."""
    count = 0

    def click():
        nonlocal count
        count += 1
        return f"{label}: {count}"

    return click


student = make_discount(10)
black_friday = make_discount(40)
print(student(50), black_friday(50))

likes = make_counter("likes")
shares = make_counter("shares")
print(likes(), likes(), shares())

print("student remembers:", student.__closure__[0].cell_contents)
`

export default {
  id: 'closures',
  title: 'Closures: functions that remember',
  summary: 'A closure is an inner function that keeps access to variables from the function that created it — even after that function has returned — which lets you build function factories and small pieces of private state.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['scope', 'defining-functions'],
  related: ['lambdas-and-higher-order', 'decorators', 'advanced-decorators', 'functools', 'classes-and-objects', 'functional-concepts', 'generators', 'function-arguments'],
  tags: ['closures', 'nested functions', 'inner functions', 'free variables', 'cells', '__closure__', 'cell_contents', 'factory functions', 'nonlocal', 'late binding', 'lambda default argument', 'state', 'callbacks'],
  apis: [
    { name: 'function.__closure__', summary: 'A tuple of cell objects holding the free variables the function captured, or None if it captured nothing.' },
    { name: 'cell.cell_contents', summary: 'The object a closure cell currently refers to.' },
    { name: 'function.__code__.co_freevars', summary: 'The names of the variables a function uses from enclosing function scopes.' },
    { name: 'nonlocal name', summary: 'Lets an inner function re-bind a captured variable instead of creating a local one.' },
    { name: 'functools.partial(func, *args, **kwargs)', summary: 'Builds a new callable with some arguments pre-filled — often a clearer alternative to a hand-written closure.' },
  ],
  docs: [
    { label: 'Execution model — naming and binding', url: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding' },
    { label: 'Data model — user-defined functions (__closure__)', url: 'https://docs.python.org/3/reference/datamodel.html#user-defined-functions' },
    { label: 'Programming FAQ — lambdas in a loop all return the same result', url: 'https://docs.python.org/3/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result' },
    { label: 'PEP 227 — statically nested scopes', url: 'https://peps.python.org/pep-0227/' },
    { label: 'PEP 3104 — access to names in outer scopes (nonlocal)', url: 'https://peps.python.org/pep-3104/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You already know that a function's local variables vanish when the call returns ([scope](lesson:scope)). Closures are the exception that makes Python's functions so powerful.`,
    py`A **nested function** is a \`def\` inside another \`def\`. If the inner function *uses* a variable from the outer one, and the outer function **returns** the inner function, something surprising happens: the inner function keeps that variable alive and can keep using it, long after the outer call has finished. That inner function together with the variables it remembers is a **closure**.`,
    { code: py`def make_discount(percent):
    def apply(price):
        return price * (1 - percent / 100)   # uses percent from the outer call
    return apply                              # return the function itself, not a call


student = make_discount(10)    # make_discount has returned...
print(student(50))             # ...but apply still knows percent is 10 → 45.0`, lang: 'python', title: 'a function that remembers' },
    py`\`make_discount\` is a **factory**: a function that builds and returns other functions, each pre-configured with its own remembered values. You'll meet this pattern everywhere — callbacks, configuration, and above all [decorators](lesson:decorators), which are closures with a special syntax.`,
  ],
  why: [
    py`**Configure once, use many times.** \`make_discount(10)\` bakes in the 10%; every caller afterwards just passes a price. No need to pass the percentage around or store it in a global.`,
    py`**Private state without a class.** A counter, a running total, a "last value seen" — a closure can hold it where nothing else can reach it, behind a single function.`,
    py`**Functions as building blocks.** APIs like \`sorted(key=...)\`, \`map\`, event handlers and retry helpers take *functions* as arguments. Closures let you build those functions on the fly with the data they need ([higher-order functions](lesson:lambdas-and-higher-order)).`,
    py`**The machinery behind decorators.** Every decorator you'll write is a closure. Understanding cells and late binding now makes decorators a small step later.`,
  ],
  eli15: [
    py`Imagine a vending machine factory. You tell the factory "*make me a machine that sells everything at 10% off*". The factory builds the machine, sets a little dial inside it to **10%**, ships it to you — and then the factory closes for the day.`,
    py`The machine still works! Every time you put in a price, it uses the dial that was set when it was built. Order another machine with "40% off" and it gets **its own dial**. The factory is the outer function, the machine is the inner function, and the dial is the remembered variable.`,
    py`Some machines have a **counter** inside that goes up each time someone buys something. Only the machine can see or change it — that's private state. To change the dial from inside, the machine needs a special permission slip: \`nonlocal\`.`,
  ],
  analogy: {
    title: 'A backpack packed by the outer function',
    body: [
      py`When the outer function creates the inner function, it gives it a **backpack** containing every outer variable the inner function mentions. The outer function then leaves, but the inner function walks off carrying the backpack.`,
      py`The backpack holds the *variables themselves* (little boxes), not photocopies of their values. If something changes what's in a box before the inner function looks inside, the inner function sees the new value — that's the "late binding" surprise later in this lesson.`,
    ],
    mapping: [
      ['the outer function (factory)', 'make_discount(percent)'],
      ['the inner function walking away', 'the returned apply function'],
      ['the backpack', 'apply.__closure__ — a tuple of cells'],
      ['a box inside the backpack', 'a cell object holding one captured variable'],
      ['looking inside a box', 'cell.cell_contents'],
      ['two machines from the same factory', 'two separate calls → two separate sets of cells'],
      ['a permission slip to swap what\'s in a box', 'nonlocal'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch closure cells travel with the function',
    props: {
      code: py`def make_multiplier(factor):
    def multiply(n):
        return n * factor     # factor is a free variable
    return multiply


double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5), triple(5))


def make_counter():
    count = 0

    def tick():
        nonlocal count
        count += 1
        return count

    return tick


tick = make_counter()
tick()
print(tick())
`,
      notes: {
        2: 'Each time this line runs, a **new** `multiply` function object is created, with a cell for `factor` attached.',
        4: 'The function is returned. The `make_multiplier` frame is about to disappear — but the cell holding `factor` survives inside `multiply`.',
        7: 'Look at `double` in the objects area: a function whose **closure** shows `factor → 2`.',
        8: 'A second call builds a second function with its **own** cell: `factor → 3`.',
        3: '`factor` isn\'t local to `multiply` and isn\'t global — Python reads it from the closure cell.',
        17: '`nonlocal count` lets `tick` re-bind the variable in its cell, so the new value is still there on the next call.',
        25: 'The second call returns 2: the count survived between calls, hidden inside `tick`.',
      },
    },
    alt: 'A step-by-step trace. make_multiplier(2) runs in its own frame, creates a function object multiply and returns it; the frame disappears but the Global frame name double points to a function whose closure shows factor = 2. A second call creates triple with its own closure factor = 3. Calling double(5) shows a frame for multiply reading factor from the closure, returning 10; triple(5) returns 15. Then make_counter returns tick, whose closure holds count; each call increases count, so the final print shows 2.',
    caption: py`Watch the function objects on the right: each one carries a **closure** listing the captured variables. The outer frames are long gone, yet \`factor\` and \`count\` live on inside the functions that use them.`,
  },
  syntax: [
    py`#### The three ingredients of a closure`,
    py`1. a **nested function** (\`def\` inside \`def\`);
2. that **uses a variable** of the enclosing function (a *free variable*);
3. and **outlives** the enclosing call (usually because it's returned, stored, or passed somewhere).`,
    { code: py`def make_greeter(greeting):        # 1. outer function with a local: greeting
    def greet(name):               # 2. nested function...
        return f"{greeting}, {name}!"   # ...using the outer variable
    return greet                   # 3. returned: it outlives make_greeter's call


hello = make_greeter("Hello")
hola = make_greeter("Hola")
print(hello("Ada"), hola("Ben"))   # Hello, Ada! Hola, Ben!
print(hello.__code__.co_freevars)  # ('greeting',)`, lang: 'python', title: 'a factory function' },
    { callout: 'warn', title: 'Return the function, not a call', text: py`\`return greet\` hands back the function object. \`return greet()\` would *call* it right away (here crashing with \`missing 1 required positional argument: 'name'\`). Parentheses mean "call".` },
    py`#### Changing captured state: nonlocal`,
    py`Reading a captured variable needs nothing special. **Re-binding** it (\`=\`, \`+=\`) needs \`nonlocal\`, otherwise the assignment creates a new local and you get \`UnboundLocalError\` (see [scope](lesson:scope)).`,
    { code: py`def make_counter(label):
    count = 0

    def click():
        nonlocal count            # re-bind the captured count
        count += 1
        return f"{label}: {count}"

    return click


likes = make_counter("likes")
print(likes(), likes())          # likes: 1 likes: 2`, lang: 'python', title: 'a counter with private state' },
    py`*Mutating* a captured object needs no declaration, because the name itself isn't re-bound:`,
    { code: py`def make_logger():
    history = []

    def log(message):
        history.append(message)   # mutating the list: no nonlocal needed
        return len(history)

    return log


log = make_logger()
log("start")
print(log("stop"))                # 2`, lang: 'python', title: 'mutation vs re-binding' },
    py`#### Late binding: closures capture variables, not values`,
    py`A closure looks up the **current** value of a captured variable each time it runs. When closures are created in a loop, they all share the loop's one variable — and by the time you call them, the loop has finished:`,
    { code: py`def make_greeters(names):
    greeters = []
    for name in names:
        def greet():
            return "Hi " + name     # name is looked up when greet() RUNS
        greeters.append(greet)
    return greeters


for greet in make_greeters(["Ada", "Ben", "Cy"]):
    print(greet())                  # Hi Cy, Hi Cy, Hi Cy`, lang: 'python', title: 'the loop gotcha' },
    py`Three standard fixes — each one gives every function **its own** binding:`,
    { code: py`# 1. A default argument is evaluated when def runs — it freezes the current value
def make_greeters(names):
    greeters = []
    for name in names:
        def greet(name=name):
            return "Hi " + name
        greeters.append(greet)
    return greeters


# 2. A factory call creates a new scope (and a new cell) for every function
def make_greeter(name):
    def greet():
        return "Hi " + name
    return greet


# 3. The same default-argument trick with a lambda (a one-line function)
callbacks = []
for i in range(3):
    callbacks.append(lambda i=i: i * 10)
print(callbacks[0](), callbacks[2]())   # 0 20`, lang: 'python', title: 'binding the value early' },
    py`A \`lambda\` is just a small, unnamed function written in one expression: \`lambda i=i: i * 10\` is the same as \`def f(i=i): return i * 10\`. They get their own lesson next: [lambdas & higher-order functions](lesson:lambdas-and-higher-order). The factory version (fix 2) is the clearest in real code; \`functools.partial\` is another good option ([functools](lesson:functools)).`,
  ],
  walkthrough: {
    title: 'Reading the shop tools line by line',
    lang: 'python',
    code: SHOP_TOOLS,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 5], text: py`\`make_discount\` defines \`apply\` inside itself. \`apply\` uses \`percent\`, which belongs to the outer call — so Python stores \`percent\` in a **cell** that \`apply\` carries with it. Line 5 returns the function object, without calling it.` },
      { lines: [8, 17], text: py`\`make_counter\` captures two variables: \`label\` (only read) and \`count\` (re-bound, so it needs \`nonlocal\`). Each call to \`make_counter\` creates fresh cells.` },
      { lines: [20, 22], text: py`Two factory calls, two independent functions: \`student\` remembers 10, \`black_friday\` remembers 40. \`student(50)\` is 45.0 and \`black_friday(50)\` is 30.0.` },
      { lines: [24, 26], text: py`\`likes\` and \`shares\` each have their own \`count\`. Calling \`likes\` twice gives 1 then 2; \`shares\` starts at 1 — no shared state.` },
      { lines: [28, 28], text: py`\`__closure__\` is a tuple of **cell** objects; \`cell_contents\` peeks inside one. You'd rarely do this in real code, but it proves the value really travels with the function.` },
    ],
  },
  playground: {
    title: 'Shop tools: discount and counter factories',
    objective: 'Build new functions from factories, give them state, and see the late-binding gotcha for yourself.',
    files: { 'main.py': SHOP_TOOLS },
    expected: py`\`\`\`text
45.0 30.0
likes: 1 likes: 2 shares: 1
student remembers: 10
\`\`\``,
    experiments: [
      {
        id: 'vip',
        task: py`Create \`vip = make_discount(25)\` and print \`vip(80)\`. Predict the answer first.`,
        hint: py`No new function definition is needed — the factory builds it for you.`,
        tests: [
          { name: 'vip exists and is a function', code: py`assert callable(ns.get('vip')), 'Create vip = make_discount(25)'` },
          { name: 'vip(80) is 60.0', code: py`assert vip(80) == 60.0` },
          { name: 'vip remembers 25', code: py`assert vip.__closure__[0].cell_contents == 25` },
        ],
        explain: py`One factory, many configured functions. \`vip\` has its own cell holding 25; \`student\` still holds 10. This is why factories beat copy-pasting near-identical functions.`,
      },
      {
        id: 'step',
        task: py`Give \`make_counter\` a second parameter \`step=1\` so each click adds \`step\`: \`make_counter("points", step=5)\` returns \`"points: 5"\`, then \`"points: 10"\`.`,
        hint: py`\`step\` is just another captured variable. Only \`count\` is re-bound, so only \`count\` needs \`nonlocal\`.`,
        tests: [
          { name: 'a step of 5 counts in fives', code: py`points = make_counter("points", step=5)
assert points() == "points: 5" and points() == "points: 10"` },
          { name: 'the default step is still 1', code: py`c = make_counter("c")
c()
assert c() == "c: 2"` },
        ],
        explain: py`Parameters of the outer function are captured exactly like other locals. \`step\` is only read, so it needs no declaration; \`count\` is re-bound, so it does.`,
      },
      {
        id: 'deal-list',
        task: py`Using a \`for\` loop over \`[10, 20, 30]\`, build a list \`deals\` containing one discount function per percentage — call \`make_discount\` inside the loop.`,
        hint: py`\`deals = []\`, then \`for p in [10, 20, 30]: deals.append(make_discount(p))\`.`,
        tests: [
          { name: 'deals holds three functions', code: py`assert len(ns.get('deals', [])) == 3, 'Create a list called deals with three functions'` },
          { name: 'each deal keeps its own percentage', code: py`assert [deal(100) for deal in deals] == [90.0, 80.0, 70.0]` },
        ],
        explain: py`Each \`make_discount(p)\` call creates a **new** scope with its own \`percent\` cell, so the loop's later values can't affect earlier functions. Now try \`deals.append(lambda price: price * (1 - p / 100))\` in the loop instead: every lambda reads the one shared \`p\` when called, so they would all apply 30% — late binding.`,
      },
      {
        id: 'logger',
        task: py`Write a new factory \`make_logger(prefix)\` returning a function \`log(message)\` that **returns** the text \`"[prefix] message"\` — for example \`make_logger("db")("connected")\` returns \`"[db] connected"\`.`,
        hint: py`Same shape as \`make_discount\`: define \`log\` inside, use \`prefix\` in an f-string, and \`return log\`.`,
        tests: [
          { name: 'make_logger builds a working logger', code: py`assert make_logger("db")("connected") == "[db] connected"` },
          { name: 'each logger keeps its own prefix', code: py`web = make_logger("web")
auth = make_logger("auth")
assert web("up") == "[web] up" and auth("ok") == "[auth] ok"` },
        ],
        explain: py`Every factory follows the same three steps: take configuration as parameters, define an inner function that uses it, return the inner function. Real logging libraries attach prefixes with a similar idea (see [logging](lesson:logging)).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Where a captured variable lives',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'frame', label: 'make_discount frame', note: 'percent → cell', x: 140, y: 90, tone: 'blue' },
        { id: 'cell', label: 'cell', note: 'a tiny box', x: 400, y: 90, tone: 'kraft' },
        { id: 'value', label: '10', note: 'int object', x: 640, y: 90, tone: 'paper' },
        { id: 'fn', label: 'apply function', note: '__closure__ = (cell,)', x: 400, y: 240, tone: 'yellow' },
        { id: 'name', label: 'student', note: 'global name', x: 140, y: 240, tone: 'yellow' },
      ],
      edges: [
        { from: 'frame', to: 'cell', label: 'percent' },
        { from: 'cell', to: 'value', label: 'contents' },
        { from: 'fn', to: 'cell', label: 'closure' },
        { from: 'name', to: 'fn' },
      ],
      steps: [
        { focus: ['frame'], text: py`\`make_discount(10)\` starts. The compiler already knows \`percent\` is used by an inner function, so instead of a plain local slot, \`percent\` gets a **cell** — a tiny box that can be shared.` },
        { focus: ['cell', 'value'], edges: ['frame->cell', 'cell->value'], text: py`The cell refers to the int \`10\`. The frame reaches \`percent\` *through* the cell.` },
        { focus: ['fn', 'cell'], edges: ['fn->cell'], text: py`\`def apply\` runs and creates a function object whose \`__closure__\` tuple contains **the same cell** — not a copy of 10.` },
        { focus: ['name', 'fn'], edges: ['name->fn'], text: py`The function is returned and bound to \`student\`. The \`make_discount\` frame is discarded…` },
        { focus: ['fn', 'cell', 'value'], edges: ['fn->cell', 'cell->value'], text: py`…but the cell survives, because \`apply\` still refers to it. Every \`student(price)\` call reads \`percent\` from the cell. With \`nonlocal\`, the inner function can put a new object into the cell.` },
      ],
    },
    alt: 'Diagram: the make_discount frame refers to a cell, which refers to the int 10. The apply function object’s closure refers to the same cell, and the global name student refers to the apply function. When the frame disappears, the cell and value remain reachable through the function.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Normally a function's local variables are thrown away when it returns. But when Python compiles \`make_discount\`, it notices that the inner \`apply\` uses \`percent\`. So \`percent\` is stored in a small shareable box called a **cell**, and the new \`apply\` function keeps a reference to that box. Because something still refers to the box, it isn't thrown away.`,
      { code: py`def make_discount(percent):
    def apply(price):
        return price * (1 - percent / 100)
    return apply


student = make_discount(10)
print(student.__closure__)                   # (<cell at 0x...: int object at 0x...>,)
print(student.__closure__[0].cell_contents)  # 10
print(make_discount.__closure__)             # None — top-level functions capture nothing`, lang: 'python', title: 'look inside the backpack' },
      py`Each call to the outer function makes **new** cells, so every function it returns has its own private copy of the variables.`,
    ],
    technical: [
      py`Closures come from Python's **static** (lexical) scoping, introduced by PEP 227: the compiler decides from the source text which names are free variables. In the outer function they are *cell variables* (\`make_counter.__code__.co_cellvars\`), in the inner function *free variables* (\`click.__code__.co_freevars\`). When \`def\` runs inside the outer call, the new function object receives a tuple of the current cells in \`__closure__\`.`,
      py`Cells hold **variables, not values**. Reading a free variable reads the cell's *current* contents; \`nonlocal x; x = …\` stores a new object in the cell. Two consequences, both language guarantees:`,
      py`- **Late binding** — closures created in a loop share the loop variable's single cell, so they all see its final value.
- **Shared cells** — two inner functions defined in the same call share the same cells, so one can update what the other reads:`,
      { code: py`def make_account():
    balance = 0

    def deposit(amount):
        nonlocal balance
        balance += amount

    def get_balance():
        return balance

    return deposit, get_balance


deposit, get_balance = make_account()
deposit(30)
deposit(12)
print(get_balance())                                              # 42
print(deposit.__closure__[0] is get_balance.__closure__[0])       # True: one shared cell`, lang: 'python', title: 'two closures, one cell' },
      py`Global names are **not** captured — a function simply keeps a reference to its module's namespace (\`__globals__\`) and looks globals up at call time. Only variables of enclosing *functions* become cells.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython 3.14, \`dis.dis(make_multiplier)\` shows \`MAKE_CELL (factor)\` at the start of the outer function and \`SET_FUNCTION_ATTRIBUTE 8 (closure)\` when the inner function is built; the inner function begins with \`COPY_FREE_VARS\` and reads the variable with \`LOAD_DEREF\`. Opcode names change between versions, and other implementations may represent closures differently — \`__closure__\` and \`cell_contents\` are the documented interface.` },
    ],
    production: [
      py`**Where you'll meet closures in real code:** [decorators](lesson:decorators) (the wrapper captures the decorated function), callbacks and event handlers that need context ("when *this* button is clicked, delete *this* item"), retry/timeout helpers configured once and called many times, and test helpers that build fake functions.`,
      py`**Prefer the standard tools when they fit:** \`functools.partial(send_email, sender="noreply@example.com")\` pre-fills arguments with a readable \`repr\` and no hand-written nesting; \`functools.lru_cache\` replaces a home-made memoizing closure ([functools](lesson:functools)).`,
      py`**Know the limits:** closures can't be pickled by the standard \`pickle\` module (\`PicklingError: Can't pickle local object\`), which matters when sending work to other processes ([multiprocessing](lesson:multiprocessing)). Their state is hidden, which is great for encapsulation and bad for debugging and introspection.`,
      py`**Closures keep captured objects alive.** A long-lived callback that captured a huge list (or \`self\`) keeps it in memory for as long as the callback exists — a classic source of leaks in event-driven code ([memory management](lesson:memory-management)).`,
      py`**When state grows, switch to a class.** One or two captured variables and a single behaviour: closure. Several pieces of state, several operations, a need to inspect or reset the state, or a useful \`repr\`: write a small class ([classes & objects](lesson:classes-and-objects)).`,
    ],
  },
  mistakes: [
    {
      title: 'Creating closures in a loop and expecting each to keep its own value',
      wrong: { code: py`handlers = []
for item in ["eggs", "milk", "jam"]:
    def remove():
        return "removed " + item
    handlers.append(remove)

print(handlers[0]())    # removed jam — not eggs!`, lang: 'python' },
      right: { code: py`def make_remover(item):
    def remove():
        return "removed " + item
    return remove


handlers = []
for item in ["eggs", "milk", "jam"]:
    handlers.append(make_remover(item))

print(handlers[0]())    # removed eggs`, lang: 'python' },
      explanation: py`Every \`remove\` looks up \`item\` when it *runs*, and by then the loop has finished on \`"jam"\`. A factory call (or a default argument \`def remove(item=item):\`) gives each function its own binding.`,
    },
    {
      title: 'Forgetting nonlocal when updating captured state',
      wrong: { code: py`def make_counter():
    count = 0

    def tick():
        count += 1          # UnboundLocalError: count is local to tick
        return count

    return tick`, lang: 'python', static: true },
      right: { code: py`def make_counter():
    count = 0

    def tick():
        nonlocal count
        count += 1
        return count

    return tick


tick = make_counter()
print(tick(), tick())   # 1 2`, lang: 'python' },
      explanation: py`\`count += 1\` assigns, which makes \`count\` local to \`tick\` unless you declare it \`nonlocal\`. Reading alone would have worked.`,
    },
    {
      title: 'Calling the inner function instead of returning it',
      wrong: { code: py`def make_greeter(greeting):
    def greet(name):
        return f"{greeting}, {name}!"
    return greet()      # TypeError: make_greeter.<locals>.greet() missing 1 required positional argument: 'name'`, lang: 'python', static: true },
      right: { code: py`def make_greeter(greeting):
    def greet(name):
        return f"{greeting}, {name}!"
    return greet


hello = make_greeter("Hello")
print(hello("Ada"))`, lang: 'python' },
      explanation: py`A factory returns the function object — no parentheses. The parentheses come later, when the caller uses it.`,
    },
    {
      title: 'Forgetting to return the inner function at all',
      wrong: { code: py`def make_doubler():
    def double(n):
        return n * 2


doubler = make_doubler()
doubler(4)      # TypeError: 'NoneType' object is not callable`, lang: 'python', static: true },
      right: { code: py`def make_doubler():
    def double(n):
        return n * 2
    return double


doubler = make_doubler()
print(doubler(4))   # 8`, lang: 'python' },
      explanation: py`Without \`return double\`, the factory returns \`None\` and the error only appears when you try to call the result.`,
    },
    {
      title: 'Expecting a closure to take a snapshot of a mutable object',
      wrong: { code: py`def make_report(scores):
    def report():
        return f"{len(scores)} scores"
    return report


scores = [70, 80]
report = make_report(scores)
scores.append(90)
print(report())     # 3 scores — it sees the change`, lang: 'python' },
      right: { code: py`def make_report(scores):
    frozen = tuple(scores)      # take a copy now if you need a snapshot
    def report():
        return f"{len(frozen)} scores"
    return report


scores = [70, 80]
report = make_report(scores)
scores.append(90)
print(report())     # 2 scores`, lang: 'python' },
      explanation: py`The closure captures the *name* \`scores\`, which refers to the caller's list (arguments are shared, not copied). Mutations to that list are visible. Copy explicitly when you need a frozen snapshot.`,
    },
  ],
  debugging: [
    {
      symptom: py`All the callbacks created in a loop return the value from the LAST iteration.`,
      cause: py`Late binding: every closure shares the loop variable and reads it when called, after the loop has ended.`,
      fix: py`Bind the value per function: a factory function (\`make_handler(item)\`), a default argument (\`def handler(item=item):\` / \`lambda item=item: ...\`), or \`functools.partial\`.`,
    },
    {
      symptom: py`UnboundLocalError: cannot access local variable 'count' where it is not associated with a value`,
      cause: py`The inner function assigns to a captured variable without declaring it \`nonlocal\`.`,
      fix: py`Add \`nonlocal count\` as the first line of the inner function.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not callable`,
      cause: py`The factory forgot \`return inner\`, so it returned \`None\`, and the caller then tried to call it.`,
      fix: py`Make sure the outer function ends with \`return inner\` (no parentheses).`,
    },
    {
      symptom: py`NameError: cannot access free variable 'rate' where it is not associated with a value in enclosing scope`,
      cause: py`The inner function was called before the outer function assigned the captured variable (for example, a helper called near the top of the outer function, with the assignment further down).`,
      fix: py`Assign every captured variable before the inner function can run.`,
    },
    {
      symptom: py`_pickle.PicklingError: Can't pickle local object <function make_discount.<locals>.apply at 0x...>`,
      cause: py`Closures and other nested functions can't be pickled, which is required to send them to another process (multiprocessing, some task queues).`,
      fix: py`Use a module-level function plus \`functools.partial\`, or a small class instance with the configuration as attributes.`,
    },
  ],
  bestPractices: [
    'Use a closure for one behaviour plus a little configuration or state; switch to a class when state or operations grow.',
    'Return the inner function object (return inner), never a call (return inner()).',
    'Declare nonlocal only for variables you re-bind; reading or mutating needs no declaration.',
    'Never rely on a loop variable inside a closure created in that loop — use a factory, a default argument or functools.partial.',
    'Prefer functools.partial for simple "pre-fill these arguments" cases; it is clearer and picklable when the function is module-level.',
    'Name factories make_… or create_… so readers know they return functions.',
    'Be mindful of what a long-lived closure captures — it keeps those objects alive.',
  ],
  useCases: [
    'Function factories: make_discount(10), make_validator(min_len=8), make_multiplier(3).',
    'Callbacks with context: a delete-button handler that remembers which item it deletes.',
    'Small private state: counters, rate limiters, running averages.',
    'Decorators: the wrapper function is a closure over the function it decorates.',
    'Building key functions for sorted/min/max on the fly.',
  ],
  whenToUse: {
    use: [
      'You need many similar functions that differ only by a few configuration values.',
      'A callback needs extra data that the caller of the callback won\'t pass.',
      'You want a tiny piece of private state behind a single function.',
    ],
    avoid: [
      'The state has several parts or needs several operations (reset, inspect, save) — use a class.',
      'The function must be pickled or sent to another process — use a module-level function + partial.',
      'Deeply nested closures that re-bind each other\'s variables — refactor into a class or plain functions.',
    ],
  },
  comparison: {
    title: 'Closure vs small class for a click counter',
    headers: ['', 'closure', 'class'],
    rows: [
      ['code', 'def make_counter(): count = 0; def click(): nonlocal count …; return click', 'class Counter: def __init__(self): self.count = 0; def click(self): …'],
      ['state lives in', 'cells, hidden inside the function', 'attributes, visible as counter.count'],
      ['operations', 'one (calling the function)', 'as many methods as you like (click, reset, …)'],
      ['inspect / debug', 'awkward (__closure__)', 'easy (counter.count, a custom __repr__)'],
      ['pickling', 'not picklable', 'picklable if the class is module-level'],
      ['best for', 'one behaviour + small config/state', 'richer state and behaviour'],
    ],
    note: py`Both are valid tools. A good rule: start with a closure for a single callable; the moment you want a second operation or to look at the state from outside, it's a class.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'closures-q1',
      type: 'mcq',
      prompt: 'Which statement best describes a closure?',
      options: [
        { text: 'Any function defined inside a class', why: 'That is a method. A closure is about nested functions capturing variables from an enclosing function.' },
        'An inner function that keeps access to variables of its enclosing function, even after that function has returned',
        { text: 'A function that has finished running and closed its frame', why: 'Every function frame closes when it returns; a closure is special because something from the frame survives.' },
        { text: 'A function that only uses global variables', why: 'Globals are not captured at all — a closure captures variables of enclosing functions.' },
      ],
      answer: 1,
      explanation: py`A closure = a function + the enclosing variables it uses (stored in cells). It lets the inner function keep working with those variables after the outer call is over.`,
    },
    {
      id: 'closures-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def make_adder(n):
    def add(x):
        return x + n
    return add


add5 = make_adder(5)
add10 = make_adder(10)
print(add5(1), add10(1), add5(add10(0)))`,
      answer: '6 11 15',
      explanation: py`Each call to \`make_adder\` creates a separate closure. \`add5(1)\` is 6, \`add10(1)\` is 11, and \`add5(add10(0))\` is \`add5(10)\` = 15.`,
    },
    {
      id: 'closures-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`callbacks = []
for i in range(3):
    callbacks.append(lambda: i)

print([f() for f in callbacks])`,
      options: [
        { text: '[0, 1, 2]', why: 'That is what people expect — but each lambda looks up i when it is called, after the loop has finished.' },
        '[2, 2, 2]',
        { text: '[3, 3, 3]', why: 'range(3) stops at 2, so the loop variable’s final value is 2, not 3.' },
        { text: 'NameError', why: 'i still exists after the loop (loops do not create a scope), so the lambdas find it.' },
      ],
      answer: 1,
      explanation: py`All three lambdas refer to the same variable \`i\` and read it at call time; its final value is 2. Fix with \`lambda i=i: i\`, which evaluates \`i\` when each lambda is created.`,
    },
    {
      id: 'closures-q4',
      type: 'bug',
      prompt: 'This program crashes. Click the line that causes the problem.',
      code: py`def make_greeter(greeting):
    def greet(name):
        return f"{greeting}, {name}!"
    return greet()


hello = make_greeter("Hello")
print(hello("Ada"))`,
      answerLine: 4,
      explanation: py`\`return greet()\` *calls* \`greet\` immediately with no arguments: \`TypeError: make_greeter.<locals>.greet() missing 1 required positional argument: 'name'\`. A factory must \`return greet\` — the function object.`,
    },
    {
      id: 'closures-q5',
      type: 'fill',
      prompt: 'Fix the late-binding bug so that `buttons[0]()` returns "clicked save".',
      code: py`buttons = []
for label in ["save", "open"]:
    def on_click(label=___):
        return "clicked " + label
    buttons.append(on_click)`,
      answer: [['label']],
      explanation: py`A default value is evaluated when \`def\` runs — once per loop iteration — so each \`on_click\` stores the label of its own iteration.`,
    },
    {
      id: 'closures-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def outer():
    x = 1

    def show():
        return x

    x = 2
    return show


print(outer()())`,
      options: [
        { text: '1', why: 'show doesn’t store the value 1 — it captures the variable x and reads it when called.' },
        '2',
        { text: 'UnboundLocalError', why: 'show only reads x, it never assigns it, so x is a free variable, not a local.' },
        { text: 'None', why: 'show returns x, which is bound to an int when show is called.' },
      ],
      answer: 1,
      explanation: py`Closures capture **variables**, not values. By the time \`show()\` runs, the cell for \`x\` holds 2.`,
    },
    {
      id: 'closures-q7',
      type: 'short',
      prompt: 'When would you choose a small class instead of a closure to hold state? Give two reasons.',
      answer: py`Choose a class when you need more than one operation on the state (e.g. click() and reset()), when the state should be visible or inspectable (counter.count, a helpful __repr__ for debugging and logging), when the object must be pickled or sent to another process, or when the state has several related parts that deserve names. A closure is best for a single behaviour with a little configuration or state.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'range-checker',
      title: 'Range-checker factory',
      difficulty: 'intermediate',
      prompt: py`Write a factory \`make_range_checker(low, high)\` that **returns a function**. The returned function takes one number and returns \`True\` if \`low <= number <= high\`, otherwise \`False\`.

\`\`\`python
is_teen = make_range_checker(13, 19)
is_teen(15)    # True
is_teen(20)    # False
\`\`\`

The tests check the examples above, that the boundaries are included, that two checkers are independent, and that the returned function really is a closure (it captures \`low\` and \`high\`).`,
      files: {
        'main.py': py`def make_range_checker(low, high):
    # TODO: define an inner function and return it
    pass


is_teen = make_range_checker(13, 19)
print(is_teen)
`,
      },
      hints: [
        'Define a nested function, e.g. def check(number):, inside make_range_checker.',
        'The inner function can use low and high directly; Python chains comparisons: low <= number <= high.',
        'def check(number): return low <= number <= high — then return check (no parentheses).',
      ],
      solution: {
        explanation: py`\`check\` uses \`low\` and \`high\`, which belong to the enclosing call, so Python stores them in cells attached to \`check.__closure__\`. Returning \`check\` (without calling it) hands back a configured function; each call to the factory creates a new pair of cells, so \`is_teen\` and \`is_valid_percent\` never interfere. No \`nonlocal\` is needed because nothing is re-bound — the captured values are only read.`,
        files: {
          'main.py': py`def make_range_checker(low, high):
    """Return a function that tests whether a number is in low..high."""
    def check(number):
        return low <= number <= high
    return check


is_teen = make_range_checker(13, 19)
is_valid_percent = make_range_checker(0, 100)
print(is_teen(15), is_teen(20), is_valid_percent(100))
`,
        },
      },
      tests: [
        { name: 'returns a function', code: py`assert callable(make_range_checker(1, 2)), 'make_range_checker must return a function'` },
        { name: 'is_teen(15) is True and is_teen(20) is False', code: py`is_teen = make_range_checker(13, 19)
assert is_teen(15) is True and is_teen(20) is False` },
        { name: 'boundaries are included', code: py`check = make_range_checker(0, 100)
assert check(0) and check(100) and not check(-1)` },
        { name: 'two checkers are independent', code: py`a = make_range_checker(1, 5)
b = make_range_checker(10, 20)
assert a(3) and not b(3) and b(15) and not a(15)` },
        { name: 'the function captures low and high', code: py`check = make_range_checker(1, 5)
assert set(check.__code__.co_freevars) == {"low", "high"}, 'The inner function should use low and high from the factory'` },
      ],
    },
    {
      id: 'fix-the-buttons',
      title: 'Fix the toolbar buttons',
      difficulty: 'intermediate',
      prompt: py`\`make_buttons(labels)\` should return a list of click handlers: calling the handler at index \`i\` returns \`"clicked "\` + \`labels[i]\`. Right now **every** handler says the last label.

Fix the late-binding bug. The tests check \`make_buttons(["save", "open", "quit"])\` gives handlers returning \`"clicked save"\`, \`"clicked open"\` and \`"clicked quit"\`, and that an empty list of labels gives an empty list.`,
      files: {
        'main.py': py`def make_buttons(labels):
    buttons = []
    for label in labels:
        def on_click():
            return "clicked " + label
        buttons.append(on_click)
    return buttons


toolbar = make_buttons(["save", "open", "quit"])
for button in toolbar:
    print(button())
`,
      },
      hints: [
        'Run it: all three print "clicked quit". When does on_click look up label — when it is defined or when it is called?',
        'You need each handler to have its own binding of label. A default argument is evaluated when def runs.',
        'def on_click(label=label):   — or move the inner def into a separate factory make_handler(label) and append make_handler(label).',
      ],
      solution: {
        explanation: py`Each \`on_click\` in the starter is a closure over the **same** variable \`label\` — the loop's single variable — and reads it when called, after the loop has ended on \`"quit"\`. Writing \`def on_click(label=label):\` evaluates the default *at definition time*, once per iteration, so each handler stores its own label. The alternative fix, a separate factory \`make_handler(label)\`, works because every factory call creates a fresh scope with its own cell; it's often clearer in real code because the handler can't be called with a different label by accident.`,
        files: {
          'main.py': py`def make_handler(label):
    def on_click():
        return "clicked " + label
    return on_click


def make_buttons(labels):
    buttons = []
    for label in labels:
        buttons.append(make_handler(label))
    return buttons


toolbar = make_buttons(["save", "open", "quit"])
for button in toolbar:
    print(button())
`,
        },
      },
      tests: [
        { name: 'the first button says save', code: py`assert make_buttons(["save", "open", "quit"])[0]() == "clicked save"` },
        { name: 'every button keeps its own label', code: py`buttons = make_buttons(["save", "open", "quit"])
assert [b() for b in buttons] == ["clicked save", "clicked open", "clicked quit"]` },
        { name: 'no labels gives no buttons', code: py`assert make_buttons([]) == []` },
        { name: 'prints each label once', code: py`assert output.split() == ["clicked", "save", "clicked", "open", "clicked", "quit"]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'closures-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a closure in Python? Give a small example.',
      answer: 'A closure is a nested function that remembers variables from its enclosing function’s scope even after the outer function has returned. Example: make_multiplier(3) returns a function multiply(n) that uses factor=3 from the outer call.',
      explanation: py`The captured variables live in cell objects attached to the function (\`__closure__\`). Each call to the outer function creates new cells, so every returned function has its own state.`,
      code: { lang: 'python', code: py`def make_multiplier(factor):
    def multiply(n):
        return n * factor
    return multiply


triple = make_multiplier(3)
print(triple(7))   # 21` },
      whyAsked: 'Closures underpin decorators, callbacks and factories; this checks the candidate can explain them clearly.',
      mistakes: ['Calling any nested function a closure even when it uses no outer variables', 'Saying the closure copies the values', 'Not being able to give an example'],
      followUps: ['How do you modify a captured variable?', 'What is the late-binding gotcha?', 'Where are the captured variables stored?'],
      modelAnswer: 'A closure is an inner function that keeps access to variables from the function that created it, even after that outer function has returned. For example, make_multiplier(factor) defines multiply(n) that returns n times factor and returns multiply; triple = make_multiplier(3) is then a function that still knows factor is 3. Python stores the captured variables in cell objects attached to the function, and each call to the factory gets its own cells, so triple and double are independent. It is the mechanism behind function factories, callbacks with context and decorators.',
    },
    {
      id: 'closures-late-binding',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, why, and how do you fix it?',
      code: { lang: 'python', code: py`multipliers = []
for factor in [1, 2, 3]:
    multipliers.append(lambda n: n * factor)

print([m(10) for m in multipliers])` },
      options: ['[10, 20, 30]', '[30, 30, 30]', '[10, 10, 10]', 'NameError'],
      correctOption: 1,
      answer: '[30, 30, 30]. Every lambda reads the single variable factor when it is called, after the loop ended with factor = 3. Fix: lambda n, factor=factor: n * factor, a factory function, or functools.partial(operator.mul, factor).',
      explanation: py`Closures (and functions reading globals) bind **late**: they look up the variable when they run, not when they're created. A default argument is evaluated at definition time, so it freezes each iteration's value. A factory call creates a fresh scope per value. The FAQ in the docs covers this exact case.`,
      whyAsked: 'One of the most common Python gotchas in real code (callbacks, GUI handlers, task lists).',
      mistakes: ['Answering [10, 20, 30]', 'Blaming lambda specifically — def has the same behaviour', 'Fixing it by copying the list instead of binding the value'],
      followUps: ['Why does the default-argument trick work?', 'Does a list comprehension of lambdas behave the same way?', 'How would functools.partial fix it?'],
      modelAnswer: 'It prints [30, 30, 30]. The lambdas don’t capture the value of factor, they refer to the variable factor, and they look it up only when they’re called. By then the loop is over and factor is 3, so all three multiply by 3. Lambda isn’t the culprit — a def would behave the same. To bind each value I can use a default argument, lambda n, factor=factor: n * factor, because defaults are evaluated when the function is created; or I call a small factory function per value, which creates a fresh scope each time; or I use functools.partial.',
    },
    {
      id: 'closures-vs-classes',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Closures and classes can both hold state. How do you choose between them?',
      answer: 'Use a closure for a single behaviour with a little configuration or state — it is short and keeps the state private. Use a class when there are several operations, several pieces of state, a need to inspect/reset/serialize the state, or a useful repr; classes are also picklable and easier to extend and test.',
      explanation: py`A closure is effectively an object with one method (\`__call__\`). The moment you want a second method, or to read the state from outside, the closure gets awkward (\`__closure__[0].cell_contents\`). A class can also define \`__call__\` if you want callable objects with visible state.`,
      whyAsked: 'Tests design judgement rather than syntax knowledge.',
      mistakes: ['Claiming closures are always faster or always "more functional"', 'Using a closure with many nonlocal variables and nested helpers instead of a class', 'Not knowing that closures cannot be pickled'],
      followUps: ['How would you make a class instance callable? (__call__)', 'How do decorators use closures?', 'What does functools.partial give you over a closure?'],
      modelAnswer: 'I see a closure as an object with exactly one method. If I need one callable with a bit of configuration or private state — a discount function, a counter, a decorator’s wrapper — a closure is concise and keeps the state hidden. Once I need more than one operation, like click and reset, or I want to inspect the state, log a meaningful repr, pickle it to another process, or subclass it, a small class is clearer. And if I want both, a class with __call__ gives me a callable object with visible attributes.',
    },
    {
      id: 'closures-cells',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How are closures implemented? What exactly does a closure capture, and what follows from that?',
      answer: 'The compiler marks variables of an enclosing function that inner functions use as cell variables; the inner function lists them as free variables. At runtime they live in cell objects, and the inner function object stores a tuple of those cells in __closure__. Because cells hold variables rather than values, closures see later re-bindings (late binding), sibling closures share the same cells, and nonlocal stores into the cell.',
      explanation: py`\`outer.__code__.co_cellvars\` and \`inner.__code__.co_freevars\` name the variables; \`inner.__closure__[i].cell_contents\` shows the current object. In CPython the outer function creates the cells with \`MAKE_CELL\`, and reads and writes go through \`LOAD_DEREF\` / \`STORE_DEREF\`. Each call of the outer function makes new cells. Globals are never captured — functions reference their module namespace via \`__globals__\`.`,
      code: { lang: 'python', code: py`def make_account():
    balance = 0

    def deposit(amount):
        nonlocal balance
        balance += amount

    def get_balance():
        return balance

    return deposit, get_balance


deposit, get_balance = make_account()
deposit(5)
print(get_balance())                                          # 5
print(deposit.__closure__[0] is get_balance.__closure__[0])   # True` },
      whyAsked: 'Senior-level understanding of the execution model; explains late binding and shared state from first principles.',
      mistakes: ['Saying the closure copies the outer frame or the values', 'Saying globals are captured', 'Not connecting cells to late binding'],
      followUps: ['Why can’t closures be pickled?', 'What keeps a captured object alive?', 'How do co_cellvars and co_freevars differ?'],
      modelAnswer: 'When Python compiles a function, it works out which of its locals are used by nested functions; those become cell variables, and in the inner function they are free variables. At runtime each such variable lives in a cell, a small box object, and when the inner def runs, the new function object gets a tuple of those cells as __closure__. The key consequence is that a closure captures the variable, not its value: it sees later re-bindings, which is the late-binding gotcha in loops, and two inner functions from the same call share the same cells, so one can update what the other reads via nonlocal. Every outer call creates fresh cells, and globals are never captured — they’re looked up through __globals__ at call time.',
    },
    {
      id: 'closures-averager',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `make_averager()` that returns a function `add(value)`. Each call records the value and returns the average of all values recorded so far by that averager.',
      answer: 'Keep total and count in the enclosing scope, declare them nonlocal in add, update both, and return total / count.',
      explanation: py`Two numbers are enough — no need to keep every value. Both are re-bound, so both need \`nonlocal\`. Each \`make_averager()\` call creates its own cells, so averagers are independent. (Keeping a list and calling \`sum\` each time also works, but grows memory and time with every call.)`,
      starter: { files: { 'main.py': py`def make_averager():
    # TODO: keep a running total and count, return a function add(value)
    def add(value):
        return value
    return add


avg = make_averager()
print(avg(10), avg(20), avg(30))   # should print 10.0 15.0 20.0
` } },
      tests: [
        { name: 'the first value is the average', code: py`avg = make_averager()
assert avg(10) == 10` },
        { name: 'averages accumulate', code: py`avg = make_averager()
avg(10)
avg(20)
assert avg(30) == 20` },
        { name: 'averagers are independent', code: py`a = make_averager()
b = make_averager()
a(100)
assert b(2) == 2` },
      ],
      solution: { files: { 'main.py': py`def make_averager():
    total = 0
    count = 0

    def add(value):
        nonlocal total, count
        total += value
        count += 1
        return total / count

    return add


avg = make_averager()
print(avg(10), avg(20), avg(30))   # 10.0 15.0 20.0
` } },
      hints: ['You need two pieces of state in the enclosing scope: total and count.', 'nonlocal total, count — one statement can list several names.'],
      whyAsked: 'A classic closure exercise: checks nonlocal, independent state per factory call, and a sensible memory trade-off.',
      mistakes: ['Forgetting nonlocal and hitting UnboundLocalError', 'Storing state in globals so averagers interfere', 'Keeping a growing list when two numbers suffice'],
      followUps: ['How would you add a reset operation? (that’s the point to switch to a class)', 'How would you make it handle no values yet?', 'How would you write the class version?'],
      modelAnswer: 'I keep two variables in the factory’s scope, total and count, both starting at zero. The inner add function declares them nonlocal, since it re-binds them, adds the value to total, increments count and returns total divided by count. Each call to make_averager creates fresh cells, so separate averagers never share data. I store just two numbers rather than every value, so each call is constant time and memory. If the requirements grew — say a reset or reading the current count — I would switch to a small class.',
    },
    {
      id: 'closures-real-world',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You are building a retry helper: callers configure the number of attempts and the exceptions to retry once, then use it to call many different functions. How could closures help, and what would you watch out for?',
      answer: 'Write a factory make_retrier(attempts, exceptions) that returns a function retry(func, *args, **kwargs); the configuration lives in the closure. Watch out for capturing large or mutable objects, late binding if retriers are built in loops, the fact that closures can’t be pickled, and that this is essentially a decorator in disguise.',
      explanation: py`This is the same pattern as decorators (a closure that wraps a call). The configuration is captured once; each \`retry(...)\` call uses it. Real implementations add backoff delays, logging, and re-raise the last exception. Retrying must only be applied to operations that are safe to repeat (idempotent).`,
      code: { lang: 'python', code: py`def make_retrier(attempts, exceptions):
    def retry(func, *args, **kwargs):
        for attempt in range(1, attempts + 1):
            try:
                return func(*args, **kwargs)
            except exceptions:
                if attempt == attempts:
                    raise
    return retry


retry_io = make_retrier(3, (ConnectionError, TimeoutError))` },
      whyAsked: 'Checks the candidate can apply closures to a realistic design and discuss trade-offs and safety.',
      mistakes: ['Using a global for the configuration', 'Forgetting to re-raise after the last attempt', 'Retrying non-idempotent operations such as payments without care'],
      followUps: ['How would you turn this into a decorator with arguments?', 'How would you add exponential backoff?', 'Why should only idempotent operations be retried?'],
      modelAnswer: 'I would write a factory, make_retrier(attempts, exceptions), that returns an inner retry function. The configuration is captured in the closure once, and retry(func, *args, **kwargs) calls the target in a loop, catching only the configured exception types and re-raising after the last attempt. It’s really the same shape as a decorator with arguments, so I might expose it that way too. Things I’d watch: don’t capture large mutable objects that keep memory alive, avoid late binding if retriers are created in a loop, remember closures can’t be pickled if work goes to other processes, and only retry operations that are safe to repeat.',
    },
  ],

  takeaways: [
    'A closure is an inner function plus the enclosing-function variables it uses; it keeps them alive after the outer call returns.',
    'Factories return configured functions: make_discount(10) returns a function that remembers 10. Return the function, not a call.',
    'Captured variables live in cells (function.__closure__); each outer call makes new cells, so returned functions are independent.',
    'Closures capture variables, not values (late binding). Closures made in a loop all see the final value unless you bind it per function: factory, default argument (lambda i=i: …) or functools.partial.',
    'Reading or mutating a captured object needs nothing; re-binding it needs nonlocal.',
    'Use a closure for one behaviour with small state; switch to a class when you need several operations, visible state or pickling.',
  ],
}
