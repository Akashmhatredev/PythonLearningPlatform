// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const COFFEE_TILL = py`PRICES = {"latte": 3.20, "mocha": 3.60, "tea": 2.10}
SIZE_EXTRA = {"small": -0.30, "medium": 0.00, "large": 0.50}


def price(drink, size="medium", *, extra_shots=0):
    """Return the price of one drink. extra_shots is keyword-only."""
    return round(PRICES[drink] + SIZE_EXTRA[size] + 0.60 * extra_shots, 2)


def order_total(*prices):
    """Add up any number of prices."""
    return round(sum(prices), 2)


def receipt_header(shop, /, **details):
    """shop is positional-only; every other detail arrives in a dict."""
    header = shop
    for key, value in details.items():
        header += f" | {key}: {value}"
    return header


latte = price("latte")                            # positional + default size
mocha = price("mocha", "large", extra_shots=2)    # positional, then keyword-only
tea = price(drink="tea", size="small")            # keywords: order doesn't matter

print(receipt_header("Bean There", table=4, server="Sam"))
print("latte:", latte, "| mocha:", mocha, "| tea:", tea)
print("total:", order_total(latte, mocha, tea))

basket = [latte, mocha, tea]
print("same total:", order_total(*basket))        # * unpacks the list into arguments
`

export default {
  id: 'function-arguments',
  title: 'Arguments: defaults, keywords, *args & **kwargs',
  summary: 'Python matches arguments to parameters by position or by name, fills gaps with defaults, collects extras with *args and **kwargs — and passes every argument by sharing the object, never by copying it.',
  difficulty: 'beginner',
  minutes: 45,
  prerequisites: ['defining-functions', 'lists', 'dictionaries'],
  related: ['tuples-and-unpacking', 'mutability-and-copying', 'none-and-truthiness', 'scope', 'lambdas-and-higher-order', 'decorators', 'functools', 'variables-and-names'],
  tags: ['arguments', 'parameters', 'keyword arguments', 'positional arguments', 'default values', 'mutable default', 'None sentinel', '*args', '**kwargs', 'keyword-only', 'positional-only', 'unpacking', 'call by sharing', 'pass by reference'],
  apis: [
    { name: 'def f(a, b=1)', summary: 'b has a default value, evaluated once when the def statement runs.' },
    { name: 'def f(*args)', summary: 'Collects any extra positional arguments into a tuple named args.' },
    { name: 'def f(**kwargs)', summary: 'Collects any extra keyword arguments into a dict named kwargs (in the order they were passed).' },
    { name: 'def f(a, *, b)', summary: 'Parameters after * (or after *args) are keyword-only: they must be passed as b=….' },
    { name: 'def f(a, /, b)', summary: 'Parameters before / are positional-only (3.8+): they cannot be passed by name.' },
    { name: 'f(*items, **options)', summary: 'Call-site unpacking: spread a sequence into positional arguments and a dict into keyword arguments.' },
    { name: 'function.__defaults__', summary: 'The tuple of default values for positional parameters (keyword-only defaults are in __kwdefaults__).' },
  ],
  docs: [
    { label: 'Python tutorial — more on defining functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions' },
    { label: 'Language reference — calls', url: 'https://docs.python.org/3/reference/expressions.html#calls' },
    { label: 'Language reference — function definitions', url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions' },
    { label: 'PEP 3102 — keyword-only arguments', url: 'https://peps.python.org/pep-3102/' },
    { label: 'PEP 570 — positional-only parameters', url: 'https://peps.python.org/pep-0570/' },
    { label: 'Programming FAQ — why are default values shared between objects?', url: 'https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [defining functions](lesson:defining-functions) every parameter got exactly one argument, matched by position. Real functions need more flexibility: some inputs are optional, some are clearer when named, and some functions — like \`print\` — accept *any number* of values.`,
    py`Python gives you a small toolkit for that:`,
    py`- **keyword arguments** — pass a value by parameter name: \`price("tea", size="small")\`;
- **default values** — a parameter that can be left out: \`def price(drink, size="medium")\`;
- **\`*args\`** and **\`**kwargs\`** — collect "any number of extra" positional or keyword arguments;
- **keyword-only** (after \`*\`) and **positional-only** (before \`/\`) parameters — rules that make an API harder to misuse;
- **unpacking at the call site** — \`f(*items, **options)\` spreads a list or dict into separate arguments.`,
    py`Underneath all of it is one simple rule: calling a function **binds each parameter name to an argument object** — the same object, not a copy. That rule explains the most famous Python gotcha of all, the *mutable default argument*.`,
  ],
  why: [
    py`**Readable calls.** \`send_email("ada@example.com", "Hi", True, False)\` is a puzzle; \`send_email("ada@example.com", "Hi", urgent=True, track=False)\` explains itself. Keyword arguments carry meaning at the call site.`,
    py`**Sensible defaults.** Most callers want the usual behaviour. Defaults let \`sorted(names)\` stay short while \`sorted(names, reverse=True)\` remains possible.`,
    py`**Flexible APIs.** \`print\` takes any number of values; \`dict(name="Ada", age=36)\` takes any keywords. Wrappers like [decorators](lesson:decorators) forward *whatever* they receive with \`*args, **kwargs\`.`,
    py`**Fewer surprises.** Knowing that arguments are shared, not copied, tells you exactly when a function can change your list — and why \`def f(items=[])\` is a bug waiting to happen.`,
  ],
  eli15: [
    py`Think of ordering at a coffee shop. "**Latte, large**" — the barista knows the first word is the drink and the second is the size because of the **order** you said them in. That's **positional**.`,
    py`"**Latte, extra shots: two**" — you said the *name* of the option. That's a **keyword argument**, and it doesn't matter where in the sentence it comes.`,
    py`If you don't mention a size, you get **medium**. That's a **default**.`,
    py`Sometimes you rattle off "and also: cinnamon, caramel, sprinkles" — the barista just scoops all the extras into one pile. That's \`*args\`. Notes like "name: Sam, table: 4" go into a labelled pile — that's \`**kwargs\`.`,
    py`And when you hand over your own reusable cup, the barista fills **that cup** — they don't make a copy of it. If they scribble on it, your cup has scribbles. That's how Python passes arguments.`,
  ],
  analogy: {
    title: 'Filling in an order form',
    body: [
      py`An order form has numbered boxes (fill them in order), labelled boxes ("Size: ____"), boxes with a pre-printed suggestion ("Milk: whole — cross out to change"), a "comments" area that takes any number of free-form notes, and a few boxes that say *"write the label too, don't just put a value here"*.`,
      py`When you hand in the form, the shop doesn't photocopy the items you attach — if you attach your own cup, they use your cup.`,
    ],
    mapping: [
      ['numbered boxes filled in order', 'positional arguments'],
      ['writing "Size: large"', 'keyword argument size="large"'],
      ['pre-printed suggestion', 'a default value'],
      ['"extras" list of any length', '*args (a tuple)'],
      ['"notes: name=Sam, table=4"', '**kwargs (a dict)'],
      ['"must write the label" boxes', 'keyword-only parameters (after *)'],
      ['"just the value, no label" boxes', 'positional-only parameters (before /)'],
      ['they use your own cup, not a copy', 'arguments are passed by sharing the object'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Shared arguments and the default that never resets',
    props: {
      code: py`def add_score(scores, new):
    scores.append(new)    # mutates the caller's list
    new = 0               # rebinds a local name only


def add_item(item, cart=[]):    # the default list is built ONCE
    cart.append(item)
    return cart


team_scores = [10]
bonus = 5
add_score(team_scores, bonus)
print(team_scores, bonus)

first = add_item("apple")
second = add_item("bread")
print(first, first is second)
`,
      notes: {
        6: 'Running `def` evaluates the default `[]` **now**, once, and stores that one list on the function object.',
        13: 'The call binds `scores` to the **same list** as `team_scores` and `new` to the same int as `bonus`. Nothing is copied.',
        2: '`append` changes the shared list object, so the caller sees it.',
        3: '`new = 0` only moves the local name `new`. The caller\'s `bonus` is untouched.',
        16: 'No cart passed, so `cart` is bound to the stored default list.',
        17: 'The **same** default list again — it still holds "apple" from the first call.',
        18: '`first` and `second` are one list: `[\'apple\', \'bread\'] True`.',
      },
    },
    alt: 'A step-by-step trace. When add_score runs, its parameter scores points at the very same list object as team_scores in the Global frame, so appending 5 changes team_scores; assigning new = 0 only changes the local name. Then add_item is called twice without a cart: both calls bind cart to the same default list, so after the second call first and second point to one list containing apple and bread.',
    caption: py`Watch the arrows from the function frames: parameters point at the **caller's objects**. Mutating through a parameter is visible outside; re-binding a parameter is not. The default list is one object that every call without a \`cart\` shares.`,
  },
  syntax: [
    py`#### Positional and keyword arguments`,
    { code: py`def describe(drink, size):
    return f"{size} {drink}"


print(describe("latte", "large"))            # positional: matched by order
print(describe(size="large", drink="latte")) # keyword: matched by name, any order
print(describe("latte", size="large"))       # mixed: positional ones must come first`, lang: 'python', title: 'two ways to pass a value' },
    py`Positional arguments must come **before** keyword arguments in a call; \`describe(drink="latte", "large")\` is a \`SyntaxError\`. Each parameter can receive only one value — \`describe("latte", drink="tea")\` raises \`TypeError: describe() got multiple values for argument 'drink'\`.`,
    py`#### Default values`,
    { code: py`def greet(name, greeting="Hello", punctuation="!"):
    return f"{greeting}, {name}{punctuation}"


print(greet("Ada"))                      # Hello, Ada!
print(greet("Ben", "Hi"))                # Hi, Ben!
print(greet("Cy", punctuation="?"))      # Hello, Cy?  (skip greeting by naming punctuation)`, lang: 'python', title: 'parameters with defaults are optional' },
    py`Parameters with defaults must come after those without (\`def f(a=1, b)\` is \`SyntaxError: parameter without a default follows parameter with a default\`).`,
    { callout: 'warn', title: 'Defaults are evaluated once', text: py`The default expression runs **when the \`def\` statement runs**, not on each call. For immutable defaults (\`0\`, \`"Hello"\`, \`None\`, a tuple) that is harmless. For a mutable default like \`[]\` or \`{}\`, every call that omits the argument shares **the same list** — the mutable default trap below.` },
    py`#### The mutable default trap and the None sentinel`,
    { code: py`def add_item(item, cart=None):     # None means "no cart given"
    if cart is None:
        cart = []                      # a brand-new list on every such call
    cart.append(item)
    return cart


print(add_item("apple"))   # ['apple']
print(add_item("bread"))   # ['bread'] — no leftovers from the first call`, lang: 'python', title: 'the standard fix' },
    py`\`None\` works as a **sentinel** — a special value meaning "nothing was passed". Test it with \`is None\`, not with \`if not cart:\` (an empty list the caller passed on purpose is also falsy, and you would silently replace it). See [None & identity](lesson:none-and-truthiness).`,
    py`#### *args — any number of positional arguments`,
    { code: py`def order_total(*prices):
    print(type(prices), prices)
    return sum(prices)


order_total(3.2, 5.3, 1.8)   # <class 'tuple'> (3.2, 5.3, 1.8)
order_total()                # <class 'tuple'> ()`, lang: 'python', title: 'extras arrive as a tuple' },
    py`#### **kwargs — any number of keyword arguments`,
    { code: py`def make_profile(username, **details):
    print(username, details)


make_profile("ada", city="London", role="admin")
# ada {'city': 'London', 'role': 'admin'}`, lang: 'python', title: 'extras arrive as a dict' },
    py`The names \`args\` and \`kwargs\` are only a convention — the \`*\` and \`**\` do the work. Use descriptive names when you can (\`*prices\`, \`**details\`). Since Python 3.6, \`**kwargs\` keeps the order the caller wrote the keywords in (PEP 468).`,
    py`#### Keyword-only and positional-only parameters`,
    { code: py`def price(drink, size="medium", *, extra_shots=0):
    ...   # everything after the bare * must be passed by name


def receipt_header(shop, /, **details):
    ...   # everything before / must be passed by position


price("mocha", "large", extra_shots=2)   # OK
# price("mocha", "large", 2)             # TypeError: takes from 1 to 2 positional arguments but 3 were given`, lang: 'python', title: '* and / in a signature' },
    { callout: 'version', title: 'Positional-only needs 3.8+', text: py`The \`/\` marker arrived in **Python 3.8** (PEP 570). Built-ins used it long before — \`help(len)\` shows \`len(obj, /)\` and \`sorted\` is \`sorted(iterable, /, *, key=None, reverse=False)\`. Keyword-only parameters (\`*\`) have existed since Python 3.0 (PEP 3102).` },
    py`The complete order of a parameter list is:`,
    { code: py`def f(pos_only, /, normal, default_one=1, *args, kw_only, kw_default=2, **kwargs):
    ...`, lang: 'python', title: 'every kind, in the only order Python allows' },
    py`#### Unpacking at the call site`,
    { code: py`def describe(drink, size, *, extra_shots=0):
    return f"{size} {drink} +{extra_shots}"


order = ["mocha", "large"]
options = {"extra_shots": 2}
print(describe(*order, **options))       # large mocha +2  ==  describe("mocha", "large", extra_shots=2)

items = ["eggs", "milk", "jam"]
print(*items, sep=", ")                  # eggs, milk, jam`, lang: 'python', title: '* spreads a sequence, ** spreads a dict' },
    py`Inside a \`def\`, \`*\` and \`**\` **collect**; in a call they **spread**. Same symbols, mirror-image jobs. (More unpacking tricks live in [tuples & unpacking](lesson:tuples-and-unpacking).)`,
  ],
  walkthrough: {
    title: 'Reading the coffee till line by line',
    lang: 'python',
    code: COFFEE_TILL,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 7], text: py`\`price\` has a required parameter (\`drink\`), one with a default (\`size\`), then a bare \`*\`: \`extra_shots\` is **keyword-only**, so nobody can write \`price("mocha", "large", 2)\` and wonder what 2 means.` },
      { lines: [10, 12], text: py`\`*prices\` collects every positional argument into a tuple. \`sum\` works on any iterable, so the function handles zero, three or fifty prices.` },
      { lines: [15, 20], text: py`\`shop\` is **positional-only** (before \`/\`), and \`**details\` collects any keywords into a dict, in the order they were passed. Because \`shop\` can't be passed by name, a caller could even send a detail called \`shop=\` without a clash.` },
      { lines: [23, 25], text: py`Three ways to call \`price\`: positional with the default size (3.2), positional plus a keyword-only option (5.3), and all keywords in any order (1.8).` },
      { lines: [27, 29], text: py`\`table=4, server="Sam"\` arrive in \`details\` as \`{'table': 4, 'server': 'Sam'}\`. \`order_total(latte, mocha, tea)\` packs three arguments into the \`prices\` tuple.` },
      { lines: [31, 32], text: py`\`order_total(*basket)\` **spreads** the list into three separate arguments — exactly the same call as line 29. Without the \`*\`, \`prices\` would be a tuple holding one list, and \`sum\` would fail.` },
    ],
  },
  playground: {
    title: 'Coffee shop till',
    objective: 'Run it, then add options and see which calls Python accepts — and which it refuses with a clear TypeError.',
    files: { 'main.py': COFFEE_TILL },
    expected: py`\`\`\`text
Bean There | table: 4 | server: Sam
latte: 3.2 | mocha: 5.3 | tea: 1.8
total: 10.3
same total: 10.3
\`\`\`

Try \`price("mocha", "large", 2)\` at the bottom to see the keyword-only rule in action, then remove it.`,
    experiments: [
      {
        id: 'oat-milk',
        task: py`Add a **keyword-only** parameter \`milk="dairy"\` to \`price\`. When \`milk == "oat"\`, add 0.40 to the price. \`price("latte", milk="oat")\` should return \`3.6\`.`,
        hint: py`Put \`milk="dairy"\` after the \`*\` (next to \`extra_shots\`). Compute an \`extra\` amount with an \`if\` before the \`return\`, and add it inside \`round(...)\`.`,
        tests: [
          { name: 'oat milk costs 0.40 more', code: py`assert price("latte", milk="oat") == 3.6` },
          { name: 'the default is unchanged', code: py`assert price("latte") == 3.2` },
          { name: 'milk is keyword-only', code: py`with raises(TypeError):
    price("latte", "large", 0, "oat")` },
        ],
        explain: py`New options are safest as **keyword-only** parameters with defaults: every existing call keeps working, and new calls must say \`milk="oat"\` out loud. That's how mature libraries grow without breaking their users.`,
      },
      {
        id: 'discount',
        task: py`Give \`order_total\` a keyword-only \`discount=0\` (a fraction such as \`0.1\` for 10%). \`order_total(10, 10, discount=0.1)\` should return \`18.0\`.`,
        hint: py`Anything after \`*prices\` in the signature is automatically keyword-only: \`def order_total(*prices, discount=0):\`. Multiply the sum by \`(1 - discount)\`.`,
        tests: [
          { name: 'a 10% discount is applied', code: py`assert order_total(10, 10, discount=0.1) == 18.0` },
          { name: 'no discount by default', code: py`assert order_total(1.5, 2.5) == 4.0` },
        ],
        explain: py`After \`*prices\` there is nowhere for a positional argument to go — \`*prices\` swallows them all — so \`discount\` can only ever be passed by name. That's why parameters after \`*args\` are keyword-only without needing a bare \`*\`.`,
      },
      {
        id: 'shared-basket',
        task: py`Write \`add_to_basket(item_price, basket=None)\` that appends the price to \`basket\` and returns it, creating a **new** list when no basket is passed. Two calls without a basket must not share a list.`,
        hint: py`Use the None sentinel: \`if basket is None: basket = []\`. First try it with \`basket=[]\` and call it twice to see the bug.`,
        tests: [
          { name: 'separate calls get separate lists', code: py`a = add_to_basket(1.0)
b = add_to_basket(2.0)
assert a == [1.0] and b == [2.0], 'Each call without a basket needs its own new list'` },
          { name: 'an existing basket is extended in place', code: py`mine = [5.0]
assert add_to_basket(1.5, mine) is mine and mine == [5.0, 1.5]` },
        ],
        explain: py`With \`basket=[]\` the list is created once, when \`def\` runs, and every call shares it. With \`basket=None\` a fresh list is built inside the function on each call that needs one. Passing your own list still works — and it's shared, not copied, so the function extends *your* list.`,
      },
      {
        id: 'spread-options',
        task: py`Store the mocha's options in a dict \`options = {"size": "large", "extra_shots": 2}\` and compute \`mocha2 = price("mocha", **options)\`. Print it.`,
        hint: py`\`**options\` spreads the dict into \`size="large", extra_shots=2\`. The keys must match parameter names exactly.`,
        tests: [
          { name: 'options is a dict', code: py`assert isinstance(ns.get('options'), dict), 'Create a dict called options'` },
          { name: 'mocha2 equals the mocha price', code: py`assert ns.get('mocha2') == 5.3, 'mocha2 = price("mocha", **options)'` },
        ],
        explain: py`\`price("mocha", **options)\` is exactly \`price("mocha", size="large", extra_shots=2)\`. This is how configuration loaded from a file or a web request is passed to functions. A key that isn't a parameter name raises \`TypeError: price() got an unexpected keyword argument\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How Python matches arguments to parameters',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'call', label: 'make_pizza("L", "ham", "olives", crust="thick", note="Happy birthday")', x: 380, y: 50, tone: 'paper' },
        { id: 'size', label: 'size', note: '"L"', x: 110, y: 200, tone: 'yellow' },
        { id: 'toppings', label: '*toppings', note: '("ham", "olives")', x: 290, y: 200, tone: 'yellow' },
        { id: 'crust', label: 'crust', note: '"thick"', x: 470, y: 200, tone: 'blue' },
        { id: 'extras', label: '**extras', note: "{'note': 'Happy birthday'}", x: 650, y: 200, tone: 'blue' },
        { id: 'defaults', label: 'defaults / TypeError', note: 'anything still unbound', x: 380, y: 300, tone: 'kraft' },
      ],
      edges: [
        { from: 'call', to: 'size', label: '1st positional' },
        { from: 'call', to: 'toppings', label: 'leftover positionals' },
        { from: 'call', to: 'crust', label: 'matched by name' },
        { from: 'call', to: 'extras', label: 'unknown names' },
        { from: 'defaults', to: 'crust', dashed: true },
      ],
      steps: [
        { focus: ['call'], text: py`Signature: \`def make_pizza(size, *toppings, crust="thin", **extras)\`. Python first evaluates **every** argument in the call, left to right.` },
        { focus: ['size'], edges: ['call->size'], text: py`Positional arguments fill the ordinary parameters **in order**: \`size\` ← \`"L"\`.` },
        { focus: ['toppings'], edges: ['call->toppings'], text: py`Positional arguments left over go into the \`*toppings\` **tuple**. Without a \`*\` parameter, leftovers are an error: \`takes 1 positional argument but 3 were given\`.` },
        { focus: ['crust'], edges: ['call->crust'], text: py`Each keyword argument is matched **by name**: \`crust\` ← \`"thick"\`. A name that already got a positional value raises \`got multiple values for argument\`.` },
        { focus: ['extras'], edges: ['call->extras'], text: py`Keywords that match no parameter go into the \`**extras\` **dict**. Without a \`**\` parameter they raise \`got an unexpected keyword argument\`.` },
        { focus: ['defaults', 'crust'], edges: ['defaults->crust'], text: py`Finally, any parameter still without a value takes its **default**. If it has no default: \`missing 1 required … argument\`. Only then does the body start running.` },
      ],
    },
    alt: 'Diagram: the call make_pizza("L", "ham", "olives", crust="thick", note="Happy birthday") at the top. Arrows show "L" going to size by position, the leftover "ham" and "olives" going into the toppings tuple, crust="thick" matched by name, and the unknown keyword note going into the extras dict. A final box shows defaults filling anything still unbound, or a TypeError if a required parameter is missing.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A call is two steps: **match** the arguments to the parameters (the rules in the diagram above), then **bind** each parameter name to its object in the new frame. If matching fails, you get a \`TypeError\` *before* a single line of the body runs — that's why those errors always point at the call.`,
      py`Binding works exactly like \`=\` (see [variables](lesson:variables-and-names)): the parameter becomes another name for the caller's object. So a function can **change a mutable object** you pass in (append to your list), but it can never make **your variable** point at something else.`,
      { code: py`def rename(player):
    player = "Zed"          # moves the local name only


def promote(team):
    team.append("captain")  # changes the shared list


name = "Ada"
squad = ["Ada"]
rename(name)
promote(squad)
print(name, squad)          # Ada ['Ada', 'captain']`, lang: 'python', title: 'mutate vs re-bind' },
    ],
    technical: [
      py`Python's argument passing is often called **call by sharing** or "call by object reference": the function receives references to the very same objects the caller has. It is *not* call-by-value (no copy is made, even of a huge list) and *not* call-by-reference in the C++ sense (the function cannot re-bind the caller's variable). Whether a caller "sees changes" depends only on whether the object was **mutated**.`,
      py`Defaults are evaluated when \`def\` runs and stored on the function object: \`price.__defaults__\` is \`('medium',)\` and \`price.__kwdefaults__\` is \`{'extra_shots': 0}\`. Every call that omits the argument binds the parameter to *that stored object*. Immutable defaults can't change, so sharing them is invisible; a mutable default accumulates changes across calls. This is the documented behaviour, not a bug — the [Programming FAQ](https://docs.python.org/3/faq/programming.html#why-are-default-values-shared-between-objects) explains it.`,
      { code: py`def add_item(item, cart=[]):
    cart.append(item)
    return cart


add_item("apple")
add_item("bread")
print(add_item.__defaults__)   # (['apple', 'bread'],) — the one shared default list`, lang: 'python', title: 'look at the stored default' },
      py`\`*args\` is always a **tuple** (immutable, even if you passed a list) and \`**kwargs\` is always a **new dict** built for this call, so mutating \`kwargs\` inside the function never affects a dict the caller spread with \`**\`. Keyword names in \`**kwargs\` must be strings.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores the parameters' names and kinds in the code object (\`f.__code__.co_varnames\`, \`co_argcount\`, \`co_posonlyargcount\`, \`co_kwonlyargcount\`). The \`inspect.signature(f)\` function reads them and is the portable way to inspect a signature from code.` },
    ],
    production: [
      py`**Make flags keyword-only.** \`def export(data, *, overwrite=False, compress=True)\` forces readable calls (\`export(rows, overwrite=True)\`) and lets you add or reorder options later without breaking callers.`,
      py`**Use positional-only for parameters whose names aren't meaningful** or that you may rename later — once a parameter can be passed by keyword, its name is part of your public API. It also lets \`def f(name, /, **attrs)\` accept an attribute called \`name\` in \`attrs\`.`,
      py`**Forward with \`*args, **kwargs\` — but only when you truly forward.** Wrappers and [decorators](lesson:decorators) need it. Elsewhere, an explicit signature documents itself, gets editor autocompletion and lets type checkers catch typos; a catch-all \`**kwargs\` silently accepts \`colour=\` when you meant \`color=\`.`,
      py`**Never use mutable defaults.** Linters flag it (Ruff's \`B006\`, from flake8-bugbear). For a default that should be computed per call (a timestamp, a fresh list, a config object), use \`None\` and build it inside. For a whole set of related options, consider a [dataclass](lesson:dataclasses) instead of ten keyword arguments.`,
      py`**Don't mutate arguments by surprise.** If a function changes a list it was given, say so in the name and docstring (\`sort_in_place\`), or work on a copy and return a new list — see [mutability & copying](lesson:mutability-and-copying).`,
    ],
  },
  mistakes: [
    {
      title: 'Using a mutable default value',
      wrong: { code: py`def register(student, roster=[]):
    roster.append(student)
    return roster


class_a = register("Ada")
class_b = register("Ben")
print(class_b)    # ['Ada', 'Ben'] — Ada leaked into class B!`, lang: 'python' },
      right: { code: py`def register(student, roster=None):
    if roster is None:
        roster = []
    roster.append(student)
    return roster


class_a = register("Ada")
class_b = register("Ben")
print(class_b)    # ['Ben']`, lang: 'python' },
      explanation: py`The default \`[]\` is created once, when \`def\` runs, and shared by every call that leaves \`roster\` out. Use \`None\` as the default and create the list inside the function.`,
    },
    {
      title: 'Positional argument after a keyword argument',
      wrong: { code: py`price(drink="tea", "small")   # SyntaxError: positional argument follows keyword argument`, lang: 'python', static: true },
      right: { code: py`def price(drink, size="medium"):
    return f"{size} {drink}"


print(price("tea", size="small"))`, lang: 'python' },
      explanation: py`Once you start naming arguments, every later argument in that call must be named too. Positional arguments always come first.`,
    },
    {
      title: 'Passing a list where separate arguments are expected',
      wrong: { code: py`def order_total(*prices):
    return sum(prices)


basket = [3.2, 5.3]
order_total(basket)   # TypeError: unsupported operand type(s) for +: 'int' and 'list'`, lang: 'python', static: true },
      right: { code: py`def order_total(*prices):
    return sum(prices)


basket = [3.2, 5.3]
print(order_total(*basket))   # 8.5`, lang: 'python' },
      explanation: py`Without \`*\`, the whole list becomes **one** argument, so \`prices\` is \`([3.2, 5.3],)\` and \`sum\` tries \`0 + [3.2, 5.3]\`. The \`*\` at the call site spreads the list into separate arguments.`,
    },
    {
      title: 'A default that should be fresh on every call',
      wrong: { code: py`import datetime


def log(message, when=datetime.datetime.now()):
    return f"[{when:%H:%M:%S}] {message}"   # every call shows the SAME time`, lang: 'python' },
      right: { code: py`import datetime


def log(message, when=None):
    if when is None:
        when = datetime.datetime.now()
    return f"[{when:%H:%M:%S}] {message}"`, lang: 'python' },
      explanation: py`It isn't only mutable objects: **any** default expression runs once at definition time. The first version freezes the moment the module was loaded. Compute per-call values inside the body.`,
    },
    {
      title: 'Expecting a function to re-bind your variable',
      wrong: { code: py`def add_bonus(score):
    score = score + 10     # only the local name changes


points = 50
add_bonus(points)
print(points)              # 50`, lang: 'python' },
      right: { code: py`def add_bonus(score):
    return score + 10


points = 50
points = add_bonus(points)
print(points)              # 60`, lang: 'python' },
      explanation: py`A function can't make the caller's name point somewhere else, and ints are immutable, so there is nothing to mutate. Return the new value and let the caller re-bind its own name.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: price() got an unexpected keyword argument 'siz'. Did you mean 'size'?`,
      cause: py`A keyword argument's name doesn't match any parameter (often a typo), and the function has no \`**kwargs\` to collect it.`,
      fix: py`Fix the spelling — Python suggests the closest parameter name. Check the signature with \`help(price)\`.`,
    },
    {
      symptom: py`TypeError: price() got multiple values for argument 'drink'`,
      cause: py`The same parameter received a positional value and a keyword value, e.g. \`price("tea", drink="latte")\`.`,
      fix: py`Pass each parameter once. Remember positional arguments fill parameters from the left.`,
    },
    {
      symptom: py`TypeError: price() takes from 1 to 2 positional arguments but 3 were given`,
      cause: py`A keyword-only parameter was passed positionally (\`price("mocha", "large", 2)\`), or there are simply too many arguments.`,
      fix: py`Name the extra argument: \`price("mocha", "large", extra_shots=2)\`.`,
    },
    {
      symptom: py`TypeError: g() got some positional-only arguments passed as keyword arguments: 'a'`,
      cause: py`A parameter declared before \`/\` was passed by name.`,
      fix: py`Pass it by position: \`g(1)\` instead of \`g(a=1)\`.`,
    },
    {
      symptom: py`A list or dict "remembers" values from earlier calls.`,
      cause: py`A mutable default argument (\`def f(items=[])\`) is shared by every call that leaves it out.`,
      fix: py`Default to \`None\` and create the list or dict inside the function. Check with \`print(f.__defaults__)\`.`,
    },
    {
      symptom: py`SyntaxError: parameter without a default follows parameter with a default`,
      cause: py`A required parameter comes after an optional one: \`def f(a=1, b):\`.`,
      fix: py`Move required parameters first, or make the later one keyword-only by putting it after \`*\`: \`def f(a=1, *, b):\`.`,
    },
  ],
  bestPractices: [
    'Never use a mutable object ([], {}, set()) as a default value — default to None and create it inside.',
    'Test the sentinel with "is None", not with truthiness, so callers can still pass an empty list on purpose.',
    'Make boolean flags and rarely used options keyword-only with a bare *.',
    'Use descriptive names for collectors (*prices, **details) unless you are purely forwarding (*args, **kwargs).',
    'Use *args, **kwargs to forward arguments in wrappers; prefer explicit parameters everywhere else.',
    'Return new values rather than relying on mutating arguments; if you must mutate, say so in the name or docstring.',
    'Keep parameter lists short — five or more related options often want a dataclass or a dict.',
  ],
  useCases: [
    'Optional settings with sensible defaults: sorted(items, reverse=True), round(x, ndigits=2).',
    'Functions over any number of values: order_total(*prices), max(a, b, c).',
    'Wrappers and decorators that forward every argument: wrapper(*args, **kwargs).',
    'Passing configuration loaded from JSON into a function: connect(**settings).',
    'API safety: keyword-only flags (export(rows, overwrite=True)) and positional-only parameters you may rename later.',
  ],
  comparison: {
    title: 'Every kind of parameter at a glance',
    headers: ['kind', 'how it looks in def', 'how callers pass it', 'arrives as'],
    rows: [
      ['positional-or-keyword', 'def f(size)', 'f("L") or f(size="L")', 'one value'],
      ['with a default', 'def f(size="M")', 'may be left out', 'the default object if omitted'],
      ['*args', 'def f(*toppings)', 'any number of extra positionals', 'a tuple'],
      ['keyword-only', 'def f(*, crust) or after *args', 'by name only: f(crust="thin")', 'one value'],
      ['**kwargs', 'def f(**extras)', 'any number of extra keywords', 'a dict (in call order)'],
      ['positional-only (3.8+)', 'def f(size, /)', 'by position only: f("L")', 'one value'],
    ],
    note: py`The order in a signature is always: positional-only, \`/\`, normal, \`*args\` (or a bare \`*\`), keyword-only, \`**kwargs\`.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'function-arguments-q1',
      type: 'mcq',
      prompt: py`Inside \`def order_total(*prices):\`, what is \`prices\` when you call \`order_total(3, 4, 5)\`?`,
      options: [
        { text: 'The list [3, 4, 5]', why: '*args always collects into a tuple, never a list.' },
        'The tuple (3, 4, 5)',
        { text: 'Just 3 — the other values are ignored', why: 'Nothing is ignored: * collects every leftover positional argument.' },
        { text: 'A dict {0: 3, 1: 4, 2: 5}', why: 'That would be closer to **kwargs, which collects keyword arguments into a dict keyed by name.' },
      ],
      answer: 1,
      explanation: py`A \`*\` parameter collects all remaining positional arguments into a **tuple**. With no extra arguments it is the empty tuple \`()\`.`,
    },
    {
      id: 'function-arguments-q2',
      type: 'output',
      prompt: 'What does the last line print?',
      code: py`def add(item, bag=[]):
    bag.append(item)
    return bag


add("apple")
print(add("bread"))`,
      options: [
        { text: "['bread']", why: 'That would be true if the default list were rebuilt on each call. It is built once, when def runs.' },
        "['apple', 'bread']",
        { text: "['bread', 'apple']", why: 'append adds to the end, so apple (added first) stays first.' },
        { text: 'TypeError', why: 'A list is a perfectly legal default value — that is what makes this bug so sneaky.' },
      ],
      answer: 1,
      explanation: py`The default list is created once and shared. The first call appends \`"apple"\` to it; the second call appends \`"bread"\` to **the same list**.`,
    },
    {
      id: 'function-arguments-q3',
      type: 'output',
      prompt: 'Predict the exact output.',
      code: py`def show(*args, **kwargs):
    print(args, kwargs)


show(1, 2, colour="red")`,
      answer: py`(1, 2) {'colour': 'red'}`,
      accept: [py`(1,2) {'colour':'red'}`],
      explanation: py`Positional extras go into the tuple \`args\`; keyword extras go into the dict \`kwargs\`. \`print\` shows the tuple and dict reprs separated by a space.`,
    },
    {
      id: 'function-arguments-q4',
      type: 'bug',
      prompt: 'This program crashes with a TypeError. Click the line that causes it.',
      code: py`def send_email(to, *, subject, urgent=False):
    flag = "[URGENT] " if urgent else ""
    return f"To {to}: {flag}{subject}"


message = send_email("ada@example.com", "Lunch?")
print(message)`,
      answerLine: 6,
      explanation: py`\`subject\` comes after the bare \`*\`, so it is **keyword-only**. The call passes it positionally: \`TypeError: send_email() takes 1 positional argument but 2 were given\`. Fix: \`send_email("ada@example.com", subject="Lunch?")\`.`,
    },
    {
      id: 'function-arguments-q5',
      type: 'fill',
      prompt: 'Complete the standard fix for the mutable default trap.',
      code: py`def add_tag(tag, tags=___):
    if tags is ___:
        tags = []
    tags.append(tag)
    return tags`,
      answer: [['None'], ['None']],
      explanation: py`\`None\` is the sentinel meaning "no list was given". Checking \`is None\` (not truthiness) still lets a caller pass an empty list of their own.`,
    },
    {
      id: 'function-arguments-q6',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`def reset(numbers):
    numbers = []


def clear(numbers):
    numbers.clear()


a = [1, 2]
b = [1, 2]
reset(a)
clear(b)
print(a, b)`,
      options: [
        { text: '[] []', why: 'reset only re-binds its local name numbers; the caller’s a still points at the original list.' },
        { text: '[1, 2] [1, 2]', why: 'clear() mutates the very list object that b refers to, so b sees the change.' },
        '[1, 2] []',
        { text: '[] [1, 2]', why: 'It is the other way round: re-binding is invisible to the caller, mutating is visible.' },
      ],
      answer: 2,
      explanation: py`Arguments are passed by sharing. \`numbers = []\` re-binds a local name — invisible to the caller. \`numbers.clear()\` mutates the shared list — visible through \`b\`.`,
    },
    {
      id: 'function-arguments-q7',
      type: 'short',
      prompt: 'Why is `def f(items=[])` a bug, while `def f(count=0)` is fine — even though both defaults are evaluated only once?',
      answer: py`Both defaults are created once, when def runs, and every call that omits the argument receives the same object. 0 is immutable: no call can change it, so sharing is invisible. A list is mutable: a call that appends to it changes the one shared default, so later calls see leftover items. The fix is to default to None and create a new list inside the function.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'greeting-card',
      title: 'Greeting card maker',
      difficulty: 'beginner',
      prompt: py`Write \`make_greeting(name, greeting="Hello", *, punctuation="!")\` that **returns** a string like \`"Hello, Ada!"\`.

- \`greeting\` is optional (default \`"Hello"\`) and may be passed by position or keyword.
- \`punctuation\` is optional (default \`"!"\`) and must be **keyword-only**.

The tests check: \`make_greeting("Ada") == "Hello, Ada!"\`, \`make_greeting("Ben", "Hi") == "Hi, Ben!"\`, \`make_greeting("Cy", punctuation="?") == "Hello, Cy?"\`, \`make_greeting(greeting="Hey", name="Di") == "Hey, Di!"\`, and that \`make_greeting("Cy", "Hi", "?")\` raises \`TypeError\`.`,
      files: {
        'main.py': py`def make_greeting(name):
    # TODO: add the greeting and punctuation parameters
    return "Hello, " + name + "!"


print(make_greeting("Ada"))
`,
      },
      hints: [
        'Defaults go in the def line: greeting="Hello".',
        'A bare * in the parameter list makes everything after it keyword-only.',
        'def make_greeting(name, greeting="Hello", *, punctuation="!"):  then return f"{greeting}, {name}{punctuation}"',
      ],
      solution: {
        explanation: py`The signature does all the work. \`greeting="Hello"\` makes the second argument optional. The bare \`*\` means \`punctuation\` can only be passed as \`punctuation=...\`, so \`make_greeting("Cy", "Hi", "?")\` is rejected with \`TypeError: make_greeting() takes from 1 to 2 positional arguments but 3 were given\` — a mistake a reader of the call could never spot otherwise. Keyword arguments can arrive in any order, so \`greeting="Hey", name="Di"\` works too.`,
        files: {
          'main.py': py`def make_greeting(name, greeting="Hello", *, punctuation="!"):
    """Return a greeting such as 'Hello, Ada!'."""
    return f"{greeting}, {name}{punctuation}"


print(make_greeting("Ada"))
print(make_greeting("Ben", "Hi"))
print(make_greeting("Cy", punctuation="?"))
`,
        },
      },
      tests: [
        { name: 'make_greeting("Ada") uses both defaults', code: py`assert make_greeting("Ada") == "Hello, Ada!"` },
        { name: 'greeting can be passed by position', code: py`assert make_greeting("Ben", "Hi") == "Hi, Ben!"` },
        { name: 'punctuation can be passed by keyword', code: py`assert make_greeting("Cy", punctuation="?") == "Hello, Cy?"` },
        { name: 'keywords work in any order', code: py`assert make_greeting(greeting="Hey", name="Di") == "Hey, Di!"` },
        { name: 'punctuation is keyword-only', code: py`with raises(TypeError):
    make_greeting("Cy", "Hi", "?")` },
      ],
    },
    {
      id: 'no-shared-shopping-list',
      title: 'The leaking shopping list',
      difficulty: 'beginner',
      prompt: py`\`add_items(*items, to=...)\` should add any number of items to a shopping list and return it. If no list is passed with \`to=\`, it must start a **new, empty** list. The starter has the mutable-default bug: the second call returns items from the first call too.

Fix it so that:

- \`add_items("eggs", "milk")\` returns \`["eggs", "milk"]\`;
- a following \`add_items("tea")\` returns \`["tea"]\` (nothing leaks between calls);
- \`add_items("jam", to=mine)\` appends to \`mine\` **in place** and returns that same list object;
- \`add_items()\` with no items returns an empty list.`,
      files: {
        'main.py': py`def add_items(*items, to=[]):
    for item in items:
        to.append(item)
    return to


print(add_items("eggs", "milk"))
print(add_items("tea"))        # should be ['tea']
`,
      },
      hints: [
        'Run it and look at the second line. Which list is to bound to on the second call?',
        'Change the default to None, and create the list inside the function when nothing was passed.',
        'def add_items(*items, to=None):  then  if to is None: to = []  before the loop.',
      ],
      solution: {
        explanation: py`The starter's \`[]\` default is evaluated once, when \`def\` runs, so every call without \`to=\` appends to the same list. Defaulting to \`None\` and writing \`if to is None: to = []\` builds a fresh list for each such call. When the caller *does* pass a list, \`to\` is bound to their object (no copy), so it is extended in place and returned — the caller can use either the return value or their own variable. \`to\` sits after \`*items\`, so it is automatically keyword-only: \`add_items("a", "b")\` can never mistake \`"b"\` for the list.`,
        files: {
          'main.py': py`def add_items(*items, to=None):
    """Append items to the given list (or a new one) and return it."""
    if to is None:
        to = []
    for item in items:
        to.append(item)
    return to


print(add_items("eggs", "milk"))
print(add_items("tea"))        # ['tea']
`,
        },
      },
      tests: [
        { name: 'collects the items into a list', code: py`assert add_items("eggs", "milk") == ["eggs", "milk"]` },
        { name: 'nothing leaks between calls', code: py`add_items("eggs")
assert add_items("tea") == ["tea"], 'A call without to= must start from a new empty list'` },
        { name: 'extends a given list in place', code: py`mine = ["bread"]
result = add_items("jam", to=mine)
assert result is mine and mine == ["bread", "jam"]` },
        { name: 'no items gives an empty list', code: py`assert add_items() == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'function-arguments-mutable-default',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A function `def add_event(event, log=[])` returns events from previous calls. Explain exactly why, and how you would fix it.',
      answer: 'Default values are evaluated once, when the def statement runs, and stored on the function object (__defaults__). Every call that omits log binds it to that same list, so appends accumulate. Fix: default to None and create a new list inside: if log is None: log = [].',
      explanation: py`The behaviour is documented: defaults are part of the function object, not re-evaluated per call. Immutable defaults are safe because nobody can change them. Linters flag mutable defaults (flake8-bugbear B006 / Ruff B006). Use \`is None\` rather than \`if not log\` so a caller's intentionally empty list isn't replaced.`,
      code: { lang: 'python', code: py`def add_event(event, log=None):
    if log is None:
        log = []
    log.append(event)
    return log` },
      whyAsked: 'It is the most famous Python gotcha; the explanation reveals whether you understand def as a runtime statement and objects vs names.',
      mistakes: ['Saying "Python keeps the variable between calls" (it is the object, stored in __defaults__)', 'Fixing it with if not log: (replaces a caller’s empty list)', 'Thinking only lists are affected (dicts, sets, any mutable object, and even datetime.now() defaults are evaluated once)'],
      followUps: ['Where is the default stored? (f.__defaults__ / f.__kwdefaults__)', 'When might a shared default be used on purpose? (a simple cache — though functools.lru_cache is better)', 'What if None is a valid value for the argument? (use a private sentinel object())'],
      modelAnswer: 'Default expressions are evaluated once, when the def statement executes, and the resulting objects are stored on the function, in __defaults__. Every call that leaves log out binds the parameter to that one list, so each append mutates the shared default and later calls see earlier events. Immutable defaults like 0 or None are fine because they cannot change. The standard fix is to default to None and create a fresh list inside with "if log is None: log = []". If None is itself a meaningful value, I use a private sentinel like _MISSING = object() instead.',
    },
    {
      id: 'function-arguments-call-by-sharing',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Is Python pass-by-value or pass-by-reference?',
      answer: 'Neither, exactly: it is call by sharing (call by object reference). The parameter is bound to the same object the caller passed. Mutating that object is visible to the caller; re-binding the parameter is not.',
      explanation: py`Pass-by-value would copy the object (Python never does). Pass-by-reference would let the function re-bind the caller's variable (Python can't). What actually happens is the same as assignment: \`param = argument_object\`. So \`def f(x): x.append(1)\` changes the caller's list, while \`def f(x): x = [1]\` does not.`,
      code: { lang: 'python', code: py`def mutate(items):
    items.append(99)


def rebind(items):
    items = [99]


data = [1]
mutate(data)
rebind(data)
print(data)   # [1, 99]` },
      whyAsked: 'Distinguishes candidates who reason from the object model from those who map Python onto C/Java vocabulary.',
      mistakes: ['Answering "by reference" and then failing to explain why rebinding has no effect', 'Answering "by value for ints, by reference for lists" — the mechanism is identical; only mutability differs'],
      followUps: ['How would you avoid mutating a caller’s list?', 'Why does += on a list parameter change the caller’s list but += on an int doesn’t?', 'How does this relate to the mutable default trap?'],
      modelAnswer: 'Neither label fits exactly; the usual term is call by sharing. When I call f(data), the parameter is simply bound to the same object data refers to — no copy, just like an assignment. If the function mutates that object, say appends to a list, the caller sees the change. If the function re-binds the parameter to a new object, only its local name moves and the caller is unaffected. So the behaviour difference people notice between ints and lists is about mutability, not about two different passing mechanisms.',
    },
    {
      id: 'function-arguments-args-kwargs',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What do *args and **kwargs do in a function definition, and where are they most useful?',
      answer: '*args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict. They are most useful for functions that take a variable number of values and for wrappers/decorators that forward arguments to another function unchanged.',
      explanation: py`The names are conventions; the stars matter. In a **call**, the same symbols do the opposite — they spread a sequence or dict into separate arguments — which is how a wrapper passes everything on: \`return func(*args, **kwargs)\`.`,
      code: { lang: 'python', code: py`def logged(func):
    def wrapper(*args, **kwargs):
        print("calling", func.__name__, args, kwargs)
        return func(*args, **kwargs)
    return wrapper` },
      whyAsked: 'Ubiquitous in real code (decorators, subclass __init__ forwarding, APIs) and a check of definition-vs-call semantics.',
      mistakes: ['Saying *args is a list', 'Not knowing the call-site meaning of * and **', 'Using **kwargs everywhere instead of explicit parameters, losing typo detection'],
      followUps: ['What order must they appear in a signature?', 'What happens to a parameter declared after *args?', 'What are the downsides of accepting **kwargs?'],
      modelAnswer: 'In a definition, *args gathers any extra positional arguments into a tuple and **kwargs gathers any extra keyword arguments into a dict, keeping the order they were passed. The names are just convention. In a call, the stars do the reverse and spread a sequence or a dict into separate arguments. Their classic use is forwarding: a decorator’s wrapper accepts *args, **kwargs and calls the original function with the same. I avoid them in ordinary functions, because an explicit signature documents itself and catches typos that **kwargs would silently swallow.',
    },
    {
      id: 'function-arguments-signature-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`def f(a, b=2, *args, c=4, **kw):
    print(a, b, args, c, kw)


f(1, 3, 5, 6, d=7)` },
      options: ["1 2 (3, 5, 6) 4 {'d': 7}", "1 3 (5, 6) 4 {'d': 7}", "1 3 (5, 6) 7 {}", 'TypeError'],
      correctOption: 1,
      answer: "1 3 (5, 6) 4 {'d': 7}",
      explanation: py`Positionals fill \`a\` and \`b\` in order (so \`b\`'s default is overridden by 3), the leftovers \`5, 6\` go to \`args\`. \`c\` is keyword-only (it comes after \`*args\`) and wasn't passed, so it keeps 4. The unknown keyword \`d\` lands in \`kw\`.`,
      whyAsked: 'Tests precise knowledge of the matching rules, including the implicit keyword-only status after *args.',
      mistakes: ['Thinking b keeps its default because it has one', 'Thinking d=7 is assigned to c'],
      followUps: ['How would you call f so that c is 10?', 'What would f(1, b=3, 5) do? (SyntaxError)'],
      modelAnswer: 'It prints 1 3 (5, 6) 4 and the dict with d: 7. Positional arguments fill the ordinary parameters from the left, so a is 1 and b is 3 — a default only applies when nothing is passed. The remaining positionals 5 and 6 are collected into the args tuple. c comes after *args, so it is keyword-only; nobody passed c=, so it keeps its default 4. Finally d doesn’t match any parameter, so it goes into the kw dict.',
    },
    {
      id: 'function-arguments-api-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You maintain a widely used library function `export(data, path, overwrite, compress)`. How would you use keyword-only and positional-only parameters to make it safer to call and easier to evolve?',
      answer: 'Make the flags keyword-only with defaults — def export(data, path, /, *, overwrite=False, compress=True) — so calls read export(rows, "out.csv", overwrite=True) and new options can be added or reordered without breaking anyone. Make data and path positional-only if their names are not meaningful API, so you can rename them freely and callers cannot depend on the names.',
      explanation: py`Positional booleans are unreadable (\`export(rows, p, True, False)\`) and fragile: inserting a new parameter shifts every later position. Keyword-only parameters remove both problems. Positional-only parameters (3.8+) stop callers from writing \`data=...\`, which means renaming \`data\` to \`rows\` later is not a breaking change, and lets a \`**options\` catch-all accept a key that happens to be called \`path\`. Migrating an existing function needs a deprecation period: accept the old style, emit a \`DeprecationWarning\`, then remove.`,
      code: { lang: 'python', code: py`def export(data, path, /, *, overwrite=False, compress=True):
    """Write data to path. Flags must be passed by name."""
    ...


export([1, 2], "out.csv", overwrite=True)` },
      whyAsked: 'Senior engineers are expected to design APIs that are hard to misuse and that can change without breaking callers.',
      mistakes: ['Only talking about defaults, not about call-site readability or evolution', 'Making everything keyword-only including the obvious primary argument', 'Changing an existing public signature without a deprecation path'],
      followUps: ['How would you migrate existing callers who pass the flags positionally?', 'When would you use a config dataclass instead?', 'How do built-ins like sorted() use these markers?'],
      modelAnswer: 'I would turn the boolean flags into keyword-only parameters with sensible defaults, using a bare star. That forces readable calls like export(rows, "out.csv", overwrite=True) and means I can add or reorder options later without shifting anyone’s positions. For the primary arguments, I would consider positional-only with a slash: their names then are not part of the public API, so I can rename them, and a **options catch-all could never collide with them. Because this changes an existing public function, I would ship it with a deprecation period — accept the old positional style for a release while emitting a DeprecationWarning — and if the options keep growing I would group them into a dataclass.',
    },
    {
      id: 'function-arguments-make-tag',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `make_tag(name, *children, **attrs)` that returns an HTML string: `make_tag("a", "Home", href="/home")` → `<a href="/home">Home</a>`. Children are joined with no separator; attributes appear in the order they were passed. (Simplified: real HTML generation must escape text with `html.escape`.)',
      answer: 'Build the attribute string from attrs.items() (kwargs preserve call order), join the children, and wrap them in the opening and closing tags.',
      explanation: py`\`*children\` collects any number of child strings into a tuple and \`**attrs\` collects attributes into a dict whose order matches the call (guaranteed since 3.6, PEP 468). Each attribute becomes \` key="value"\` with a leading space so that a tag with no attributes is just \`<p>\`. This is a **simplified** builder: production code must escape \`<\`, \`&\` and quotes in text and attribute values (\`html.escape\`) to avoid HTML injection.`,
      starter: { files: { 'main.py': py`def make_tag(name, *children, **attrs):
    # TODO: return "<name attr="value">children</name>"
    return ""


print(make_tag("a", "Home", href="/home"))
` } },
      tests: [
        { name: 'a simple tag with one child', code: py`assert make_tag("p", "Hello") == "<p>Hello</p>"` },
        { name: 'attributes become key="value"', code: py`assert make_tag("a", "Home", href="/home") == '<a href="/home">Home</a>'` },
        { name: 'several children are joined', code: py`assert make_tag("ul", "<li>1</li>", "<li>2</li>") == "<ul><li>1</li><li>2</li></ul>"` },
        { name: 'attributes keep the call order', code: py`assert make_tag("img", src="cat.png", alt="A cat") == '<img src="cat.png" alt="A cat"></img>'` },
      ],
      solution: { files: { 'main.py': py`def make_tag(name, *children, **attrs):
    """Return an HTML element string (simplified: no escaping)."""
    attr_text = ""
    for key, value in attrs.items():
        attr_text += f' {key}="{value}"'
    return f"<{name}{attr_text}>{''.join(children)}</{name}>"


print(make_tag("a", "Home", href="/home"))
` } },
      hints: ['attrs is a dict — loop over attrs.items() and build \' key="value"\' pieces.', 'children is a tuple of strings: "".join(children).'],
      whyAsked: 'Exercises *args/**kwargs together, ordering guarantees, and string building — and lets the interviewer probe security awareness (escaping).',
      mistakes: ['Forgetting the leading space before each attribute', 'Assuming kwargs order is random (it is preserved)', 'Not mentioning escaping when asked if it is production-ready'],
      followUps: ['How would you support the attribute name "class", which is a keyword? (accept class_ and strip the underscore)', 'How would you escape values safely?', 'How would you support boolean attributes like disabled?'],
      modelAnswer: 'The signature does most of the work: *children gives me a tuple of child strings and **attrs a dict of attributes in the order the caller wrote them, which Python guarantees since 3.6. I loop over attrs.items() to build a string of space-prefixed key="value" pairs, join the children with an empty string, and wrap them in the opening and closing tags. As written it is a simplified builder — for real HTML I would pass every text and attribute value through html.escape to prevent injection, and I would handle the keyword class with a trailing-underscore convention.',
    },
  ],

  takeaways: [
    'Arguments are matched by position first, then by name; positional arguments must come before keyword arguments in a call.',
    'Default values are evaluated once, when def runs — never use a mutable default; use None and create the object inside.',
    '*args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict (in call order).',
    'Parameters after * (or after *args) are keyword-only; parameters before / are positional-only (3.8+).',
    'In a call, * spreads a sequence and ** spreads a dict into separate arguments: f(*items, **options).',
    'Arguments are passed by sharing: the parameter is bound to the caller’s object. Mutations are visible to the caller; re-binding the parameter is not.',
    'Make flags keyword-only, keep signatures explicit, and use *args, **kwargs mainly for forwarding.',
  ],
}
