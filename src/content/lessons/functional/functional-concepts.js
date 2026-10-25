// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CHECKOUT = py`# The same checkout, written impurely and purely
from dataclasses import dataclass, replace

TAX_RATE = 0.2
audit_log = []


# --- impure: reads and changes things outside the function ---------------
def checkout_impure(cart, code):
    if code == "SAVE10":
        for item in cart:
            item["price"] = round(item["price"] * 0.9, 2)   # mutates the caller's dicts
    total = sum(item["price"] * item["qty"] for item in cart)
    audit_log.append(total)                               # hidden side effect
    return round(total * (1 + TAX_RATE), 2)


# --- pure: the result depends only on the arguments ----------------------
@dataclass(frozen=True)
class Item:
    name: str
    price: float
    qty: int


def apply_discount(items, code):
    if code != "SAVE10":
        return items
    return tuple(replace(item, price=round(item.price * 0.9, 2)) for item in items)


def subtotal(items):
    return sum(item.price * item.qty for item in items)


def with_tax(amount, rate=TAX_RATE):
    return round(amount * (1 + rate), 2)


def checkout(items, code):
    return with_tax(subtotal(apply_discount(items, code)))


dict_cart = [{"name": "tea", "price": 4.0, "qty": 2}, {"name": "cake", "price": 3.5, "qty": 1}]
print("impure:      ", checkout_impure(dict_cart, "SAVE10"))
print("impure again:", checkout_impure(dict_cart, "SAVE10"))
print("tea now costs", dict_cart[0]["price"], "| audit log:", audit_log)

cart = (Item("tea", 4.0, 2), Item("cake", 3.5, 1))
print("pure:        ", checkout(cart, "SAVE10"))
print("pure again:  ", checkout(cart, "SAVE10"))
print("tea still costs", cart[0].price)
`

export default {
  id: 'functional-concepts',
  title: 'Functional thinking: pure functions & immutability',
  summary: 'Write functions whose result depends only on their arguments and that change nothing outside themselves — then compose them, push side effects to the edges, and enjoy code that is easy to test and reason about.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['defining-functions', 'scope', 'mutability-and-copying', 'lambdas-and-higher-order'],
  related: ['map-filter-reduce', 'functools', 'closures', 'lambdas-and-higher-order', 'comprehensions', 'generators', 'lazy-evaluation', 'recursion', 'dataclasses', 'records-and-slots', 'testing-fundamentals', 'decorators', 'clean-architecture', 'mutability-and-copying'],
  tags: ['functional programming', 'pure function', 'side effect', 'immutability', 'referential transparency', 'first-class functions', 'higher-order functions', 'composition', 'compose', 'pipeline', 'shared mutable state', 'functional core imperative shell', 'MappingProxyType', 'frozen dataclass', 'testing'],
  apis: [
    { name: 'sorted(iterable)', summary: 'Returns a NEW sorted list; the pure counterpart of list.sort().' },
    { name: 'dataclasses.replace(obj, **changes)', summary: 'Returns a new dataclass instance with some fields changed — the way to "update" frozen data.' },
    { name: 'tuple / frozenset', summary: 'Immutable built-in sequence and set types.' },
    { name: 'types.MappingProxyType(mapping)', summary: 'A read-only view of a dict: lookups work, assignment raises TypeError.' },
    { name: 'dict | dict, {**d, key: value}', summary: 'Build a new dict with changes instead of mutating the original.' },
    { name: 'callable(obj)', summary: 'True if obj can be called — functions are ordinary objects you can pass and store.' },
  ],
  docs: [
    { label: 'Functional Programming HOWTO', url: 'https://docs.python.org/3/howto/functional.html' },
    { label: 'Glossary — immutable', url: 'https://docs.python.org/3/glossary.html#term-immutable' },
    { label: 'types.MappingProxyType', url: 'https://docs.python.org/3/library/types.html#types.MappingProxyType' },
    { label: 'dataclasses.replace', url: 'https://docs.python.org/3/library/dataclasses.html#dataclasses.replace' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Functional programming** is a style of writing programs mostly out of *functions that compute values*, rather than steps that change things. Its central idea is the **pure function**: a function whose result depends **only on its arguments**, and which **changes nothing** outside itself.`,
    py`Anything a function does besides returning a value is a **side effect**: printing, writing a file, changing a global variable, modifying a list it was given, reading the clock or a random number. Side effects aren't evil — a program with none would be useless — but they make code harder to test and reason about. Functional thinking means *keeping them few and keeping them at the edges*.`,
    py`Python isn't a pure functional language: lists and dicts are mutable, and loops are perfectly normal. But it borrows the best functional ideas — first-class functions, [comprehensions](lesson:comprehensions), [generators](lesson:generators), immutable tuples and frozen dataclasses, [map, filter & reduce](lesson:map-filter-reduce), [functools](lesson:functools) — and good Python code uses them all the time.`,
  ],
  why: [
    py`**Predictability.** A pure function gives the same answer for the same input, every time, in every order. You can understand it by reading *just that function*, without wondering what some other code did to a global first.`,
    py`**Testability.** Testing a pure function is "call it, compare the result". No setup, no cleanup, no mocks, no "this test fails only when run after that test".`,
    py`**Safety when sharing.** Data that never changes can be passed anywhere — to another function, another module, another thread — without anyone being surprised by a change they didn't make.`,
    py`**Reuse by composition.** Small pure functions snap together like building blocks: \`checkout = with_tax ∘ subtotal ∘ apply_discount\`.`,
  ],
  eli15: [
    py`A **pure function** is like a calculator button. Press "square" with 4 and you get 16 — today, tomorrow, whoever presses it. The button doesn't secretly change your other numbers or post anything online.`,
    py`An **impure** function is like a vending machine that sometimes gives you a different snack for the same coins, because someone else's earlier purchase changed what's inside. To understand it, you need to know its whole history.`,
    py`Functional thinking says: build most of your program from calculator buttons, and keep the vending-machine parts (printing, saving files, talking to the internet) in a few clearly marked places.`,
  ],
  analogy: {
    title: 'A recipe card vs. cooking in someone else\'s kitchen',
    body: [
      py`A recipe card is pure: "200 g flour + 2 eggs → batter". It doesn't care who reads it or when, and reading it never changes the ingredients you own. Follow it twice with the same ingredients and you get the same batter.`,
      py`Cooking in a shared kitchen is impure: you grab "the flour", but someone already used half; you season "the soup", but it was someone else's soup. The result depends on what happened before you arrived — and you've changed things for whoever comes next.`,
    ],
    mapping: [
      ['recipe card', 'a pure function'],
      ['ingredients you hand to the recipe', 'the arguments'],
      ['the dish that comes out', 'the return value'],
      ['using "the flour" from the shared shelf', 'reading a global variable'],
      ['seasoning someone else\'s soup', 'mutating an argument or shared object'],
      ['cooking a fresh portion instead of altering the pot', 'returning a new value (sorted(), replace())'],
      ['the restaurant front door, where orders come in and food goes out', 'the "imperative shell" where side effects live'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Returning a new list vs changing the caller\'s list',
    props: {
      code: py`def add_bonus_pure(scores, bonus):
    return [s + bonus for s in scores]

def add_bonus_impure(scores, bonus):
    for i in range(len(scores)):
        scores[i] += bonus
    return scores

original = [70, 80]
curved = add_bonus_pure(original, 5)
print(original, curved)

again = add_bonus_impure(original, 5)
print(original, again is original)
`,
      notes: {
        2: 'The comprehension builds a **brand-new** list. `scores` (the caller\'s list) is only read.',
        6: 'Writing `scores[i]` changes the list object the caller passed in — the parameter is just another name for it.',
        10: 'After the pure call there are two lists: the original is untouched.',
        13: '`again` and `original` are names for the **same** list, now changed. The caller\'s data was modified behind its back.',
      },
    },
    alt: 'A step-by-step trace. original refers to the list [70, 80]. add_bonus_pure builds a separate list [75, 85] for curved, leaving original unchanged. add_bonus_impure receives a reference to the original list and adds 5 to each item in place, so afterwards original prints [75, 85] and again is the very same object.',
    caption: py`Inside a function, a parameter is a second name for the caller's object (see [mutability & copying](lesson:mutability-and-copying)). Mutating through it is a side effect the caller can see.`,
  },
  syntax: [
    py`There's no special syntax for functional programming — it's a way of using ordinary Python. These are the core moves.`,
    py`#### 1. Pure functions: everything they need comes in as arguments`,
    { code: py`# Impure: depends on a global that can change and on the clock
from datetime import datetime

DISCOUNT = 0.1

def price_today(price):
    if datetime.now().weekday() == 5:          # hidden input: the clock
        return price * (1 - DISCOUNT)          # hidden input: a global
    return price

# Pure: every input is a parameter; the caller decides "now"
def price_on(price, day_of_week, discount=0.1):
    return price * (1 - discount) if day_of_week == 5 else price

print(price_on(10.0, 5), price_on(10.0, 2))   # 9.0 10.0 — always`, lang: 'python', title: 'make hidden inputs explicit' },
    py`#### 2. Return new values instead of mutating`,
    { code: py`scores = [55, 92, 78]
ranked = sorted(scores, reverse=True)      # new list; scores unchanged
more = scores + [61]                       # new list
settings = {"theme": "light"}
dark = settings | {"theme": "dark"}        # new dict (3.9+); or {**settings, "theme": "dark"}
point = (3, 4)
moved = (point[0] + 1, point[1])           # tuples can't change, so build another
print(scores, ranked, settings, dark, moved)`, lang: 'python', title: 'build, don\'t modify' },
    py`#### 3. Functions are values: pass them, return them, store them`,
    { code: py`def shout(text):
    return text.upper() + "!"

def whisper(text):
    return text.lower() + "..."

styles = {"loud": shout, "quiet": whisper}     # stored in a dict

def apply_twice(func, value):                  # passed as an argument
    return func(func(value))

def make_greeter(greeting):                    # returned from a function (a closure)
    return lambda name: f"{greeting}, {name}"

print(styles["loud"]("hi"), apply_twice(whisper, "OK"), make_greeter("Hello")("Ada"))`, lang: 'python', title: 'first-class functions' },
    py`Functions that take or return functions are **higher-order functions** — \`sorted(key=...)\`, \`map\`, decorators. Functions that remember values from where they were created are [closures](lesson:closures).`,
    py`#### 4. Compose small functions`,
    { code: py`def compose(*functions):
    """compose(f, g, h)(x) == f(g(h(x))) — right to left, like maths."""
    def composed(value):
        for func in reversed(functions):
            value = func(value)
        return value
    return composed

normalise = compose(str.title, str.strip)
print(normalise("   ada lovelace  "))     # Ada Lovelace`, lang: 'python', title: 'composition' },
    { callout: 'tip', title: 'Functional core, imperative shell', text: py`Structure programs as a **pure core** (parse, validate, compute — all pure functions on immutable data) wrapped in a thin **imperative shell** that does the I/O: read input, call the core, print or save the result. The core gets unit tests; the shell stays so small it barely needs them.` },
  ],
  walkthrough: {
    title: 'Reading the two checkouts',
    lang: 'python',
    code: CHECKOUT,
    intro: py`The playground program computes the same discounted, taxed total two ways. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [4, 5], text: py`Module-level state: a tax rate and an audit log list. Any function that reads or changes these has inputs or outputs that don't appear in its signature.` },
      { lines: [9, 12], text: py`\`checkout_impure\` loops over the caller's dicts and **overwrites** their prices. The caller's cart is now permanently discounted — call it again and the discount is applied on top.` },
      { lines: [13, 15], text: py`It also appends to the global \`audit_log\` and reads the global \`TAX_RATE\`. Two hidden effects: one output nobody asked for, one input nobody passed.` },
      { lines: [19, 23], text: py`A frozen dataclass: an \`Item\` can't be changed after it's created, so no function *can* mutate the caller's data by accident.` },
      { lines: [26, 29], text: py`\`apply_discount\` returns a **new** tuple of new Items built with \`replace()\`. If the code doesn't apply it returns the input unchanged — safe, because nobody can modify it.` },
      { lines: [32, 37], text: py`Two tiny pure functions. \`with_tax\` takes the rate as a parameter with a default, so a test can pass any rate without touching a global.` },
      { lines: [40, 41], text: py`\`checkout\` is just a **composition**: discount, then subtotal, then tax. Each piece can be tested alone, and the whole is obviously correct if the pieces are.` },
      { lines: [44, 47], text: py`Calling the impure version twice gives **two different totals** for the same arguments, and the cart and log have changed.` },
      { lines: [49, 52], text: py`The pure version gives the same answer every time and leaves the cart exactly as it was.` },
    ],
  },
  playground: {
    title: 'Two checkouts: impure vs pure',
    objective: 'Run it, compare the two "again" lines, then refactor the impure parts and extend the pure ones.',
    files: { 'main.py': CHECKOUT },
    expected: py`\`\`\`text
impure:       12.42
impure again: 11.17
tea now costs 3.24 | audit log: [10.35, 9.31]
pure:         12.42
pure again:   12.42
tea still costs 4.0
\`\`\`

The impure checkout gives a different total the second time because the first call changed the cart.`,
    experiments: [
      {
        id: 'fix-impure',
        task: py`Fix \`checkout_impure\` so calling it twice with the same cart gives the same total and **never changes the caller's dicts**. Compute the discounted prices without assigning into \`item\`. (Leave \`audit_log\` alone for now.)`,
        hint: py`Work out a local \`discount = 0.9 if code == "SAVE10" else 1.0\`, then \`total = sum(round(item["price"] * discount, 2) * item["qty"] for item in cart)\`.`,
        tests: [
          { name: 'same cart, same total', code: py`cart_a = [{"name": "tea", "price": 4.0, "qty": 2}, {"name": "cake", "price": 3.5, "qty": 1}]
first = checkout_impure(cart_a, "SAVE10")
second = checkout_impure(cart_a, "SAVE10")
assert first == second == 12.42` },
          { name: 'the caller\'s dicts are not modified', code: py`cart_b = [{"name": "tea", "price": 4.0, "qty": 2}]
checkout_impure(cart_b, "SAVE10")
assert cart_b[0]["price"] == 4.0, 'Do not assign to item["price"]'` },
        ],
        explain: py`Reading the arguments and building new values (here, just numbers) instead of writing into them removes the worst side effect. The function still appends to \`audit_log\` and reads \`TAX_RATE\`, so it isn't fully pure yet — but the result now depends only on the arguments and the (unchanging) rate.`,
      },
      {
        id: 'add-item',
        task: py`Write a pure function \`add_item(items, item)\` that returns a **new tuple** with \`item\` at the end. The original tuple must be unchanged.`,
        hint: py`Tuples support \`+\`: \`items + (item,)\` — note the comma that makes a one-item tuple.`,
        tests: [
          { name: 'returns a new tuple with the item', code: py`start = (Item("tea", 4.0, 2),)
result = add_item(start, Item("jam", 2.5, 1))
assert isinstance(result, tuple) and len(result) == 2 and result[-1].name == "jam"` },
          { name: 'the original is unchanged', code: py`start = (Item("tea", 4.0, 2),)
add_item(start, Item("jam", 2.5, 1))
assert len(start) == 1` },
        ],
        explain: py`\`items + (item,)\` builds a new tuple that *shares* the existing Item objects — safe because they're frozen. Sharing unchanged parts instead of deep-copying is how immutable data stays cheap.`,
      },
      {
        id: 'half-price',
        task: py`Teach \`apply_discount\` a second code, \`"HALF"\`, that halves every price (rounded to 2 places). Keep it pure. Then check: what should \`checkout(cart, "HALF")\` be?`,
        hint: py`Add an \`if code == "HALF":\` branch that returns a new tuple built with \`replace(item, price=round(item.price / 2, 2))\`.`,
        tests: [
          { name: 'HALF halves every price', code: py`assert checkout(cart, "HALF") == 6.9` },
          { name: 'SAVE10 still works', code: py`assert checkout(cart, "SAVE10") == 12.42` },
          { name: 'the cart is unchanged', code: py`checkout(cart, "HALF")
assert cart[0].price == 4.0` },
        ],
        explain: py`Because each piece is pure, you changed one small function and everything that composes it (\`checkout\`) picked up the new behaviour — with no risk to other callers. Tea 2.00 × 2 + cake 1.75 = 5.75, plus 20% tax = 6.90.`,
      },
      {
        id: 'explicit-shell',
        task: py`Move the side effect to the edge: write \`audited_checkout(items, code, log)\` that calls the pure \`checkout\`, appends the total to the \`log\` list it was **given**, and returns the total.`,
        tests: [
          { name: 'returns the total and logs it', code: py`log = []
assert audited_checkout(cart, "SAVE10", log) == 12.42
assert log == [12.42]` },
          { name: 'does not touch the global audit_log', code: py`before = list(audit_log)
audited_checkout(cart, "SAVE10", [])
assert audit_log == before, 'Append to the log parameter, not the global audit_log'` },
        ],
        explain: py`The side effect still exists — logging is useful! — but it's now *visible in the signature*: the caller hands over the log, so a test can pass an empty list and inspect it. The calculation itself stays pure in \`checkout\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Functional core, imperative shell',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'input', label: 'Read input', note: 'files, input(), HTTP', x: 110, y: 90, tone: 'kraft' },
        { id: 'core', label: 'Pure core', note: 'parse → validate → compute', x: 380, y: 90, tone: 'yellow' },
        { id: 'output', label: 'Write output', note: 'print, save, send', x: 650, y: 90, tone: 'kraft' },
        { id: 'tests', label: 'Unit tests', note: 'call the core directly', x: 380, y: 240, tone: 'blue' },
      ],
      edges: [
        { from: 'input', to: 'core', label: 'plain data' },
        { from: 'core', to: 'output', label: 'plain data' },
        { from: 'tests', to: 'core', label: 'inputs → expected outputs', dashed: true },
      ],
      steps: [
        { focus: ['input'], text: py`The **shell** starts by doing the impure work of *getting* data: reading a file, calling \`input()\`, receiving a request. It turns it into plain values (strings, numbers, tuples, frozen dataclasses).` },
        { focus: ['core'], edges: ['input->core'], text: py`The **core** is a set of pure functions: same input, same output, no I/O, no globals. This is where the real logic — and most of the bugs — live.` },
        { focus: ['output'], edges: ['core->output'], text: py`The shell takes the core's result and performs the side effects: print it, save it, send it. This part is thin and boring on purpose.` },
        { focus: ['tests', 'core'], edges: ['tests->core'], text: py`Tests talk to the core directly: no temporary files, no fake network, no mocks. Fast and reliable. See [testing fundamentals](lesson:testing-fundamentals).` },
      ],
    },
    alt: 'Diagram with three boxes in a row: Read input (files, input, HTTP) feeds plain data into a Pure core (parse, validate, compute), which passes plain data to Write output (print, save, send). Below the core, a Unit tests box points at it with a dashed arrow labelled inputs to expected outputs.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`**How to spot a side effect:** ask "if I deleted the return value, would anything still have changed?" If yes — something printed, a list grew, a file appeared, a global moved — the function has side effects.`,
      py`**How to spot a hidden input:** ask "could this function return something different tomorrow with the same arguments?" Reading globals, the clock (\`datetime.now()\`), random numbers, environment variables, files or the network are all hidden inputs. Make them parameters, and the function becomes pure and testable.`,
      py`**Referential transparency** is the fancy name for the payoff: a call to a pure function can be replaced by its result without changing the program. \`with_tax(10.0)\` is always \`12.0\`, so you can reason about code like algebra.`,
    ],
    technical: [
      py`**Python passes references.** A parameter is a new name for the caller's object (see [mutability & copying](lesson:mutability-and-copying)). That's why mutating an argument is visible outside, and why returning new objects is the main tool for purity. Python's own naming convention helps: methods that mutate in place usually return \`None\` (\`list.sort\`, \`list.append\`, \`dict.update\`), while functions that return new objects are often named as adjectives or nouns (\`sorted\`, \`reversed\`).`,
      py`**Immutability tools.** \`tuple\` and \`frozenset\` are immutable containers; \`str\`, \`int\`, \`float\`, \`bytes\` are immutable values; \`@dataclass(frozen=True)\` and \`NamedTuple\` give immutable records (see [records & slots](lesson:records-and-slots)); \`types.MappingProxyType(d)\` is a read-only *view* of a dict. All of these are **shallow**: a tuple holding a list can still have that list changed.`,
      py`**Cost of "copy on change".** Python's built-in collections aren't *persistent* data structures (structures that share most of their memory between versions). \`old + [x]\` or \`d | {k: v}\` copies the whole container — O(n). For small data that's irrelevant; inside a tight loop building a big list, appending to a local list you own is fine and still keeps the *function* pure from the outside.`,
      py`**Local mutation is allowed.** Purity is about what callers can observe. A function that creates a list, fills it with a loop and returns it is pure: nobody else could see the list until it was returned.`,
      { callout: 'note', title: 'Where Python stops being functional', text: py`- **No tail-call optimisation.** Each recursive call uses a new stack frame, and CPython raises \`RecursionError\` beyond a limit (\`sys.getrecursionlimit()\`, 1000 by default). Write loops, not deep recursion — see [recursion](lesson:recursion).
- **\`lambda\` is limited to one expression** — no statements, no assignments with \`=\`. Use \`def\` for anything bigger.
- **Mutable by default.** Lists, dicts, sets and most objects can change; immutability is a discipline, not a guarantee.
- **Comprehensions and generators are the idiomatic functional tools**, more often than \`map\`/\`filter\` — see [map, filter & reduce](lesson:map-filter-reduce).` },
    ],
    production: [
      py`**Make time and randomness parameters.** \`def is_expired(token, now)\` beats \`datetime.now()\` inside the function: tests pass fixed times, and the shell passes \`datetime.now(timezone.utc)\`. Same for \`random.Random(seed)\` objects and configuration.`,
      py`**Immutable configuration.** Load settings once in the shell into a frozen dataclass or a \`MappingProxyType\`, then pass them down. "Who changed the config?" bugs disappear.`,
      py`**Concurrency.** Shared mutable state is the root of race conditions. Immutable messages passed between tasks, threads or processes need no locks — one reason functional style is popular in concurrent systems (see [concurrency concepts](lesson:concurrency-concepts)).`,
      py`**Don't be dogmatic.** Logging, metrics and caching are side effects that real services need. Keep them explicit (passed in, or in the shell) and don't contort code into deep recursion or unreadable lambda chains just to look functional. Readability wins.`,
    ],
  },
  mistakes: [
    {
      title: 'Mutating an argument the caller still uses',
      wrong: { code: py`def top_three(scores):
    scores.sort(reverse=True)     # reorders the CALLER'S list
    return scores[:3]

results = [55, 92, 78, 99, 61]
print(top_three(results), results)   # results is now sorted too`, lang: 'python' },
      right: { code: py`def top_three(scores):
    return sorted(scores, reverse=True)[:3]   # new list

results = [55, 92, 78, 99, 61]
print(top_three(results), results)   # results keeps its order`, lang: 'python' },
      explanation: py`A caller rarely expects a "get" function to rearrange their data. Use the non-mutating version (\`sorted\`, slicing, comprehensions) unless changing the argument is the documented purpose of the function.`,
    },
    {
      title: 'Hidden inputs: globals, the clock, randomness',
      wrong: { code: py`import random

PASS_MARK = 50

def passed(score):
    return score >= PASS_MARK          # depends on a global someone may change

def pick_winner(names):
    return random.choice(names)        # different answer every call`, lang: 'python' },
      right: { code: py`import random

def passed(score, pass_mark=50):
    return score >= pass_mark

def pick_winner(names, rng):
    return rng.choice(names)

print(passed(55), pick_winner(["Ada", "Ben"], random.Random(42)))   # repeatable`, lang: 'python' },
      explanation: py`Pass the value in. Defaults keep the call short, and tests can pass anything — including a seeded \`random.Random\` for repeatable "random" results.`,
    },
    {
      title: 'Using map() or a comprehension for side effects',
      wrong: { code: py`names = ["ada", "ben"]
[print(name.title()) for name in names]     # builds a useless list of None
list(map(print, names))                     # same, and harder to read`, lang: 'python' },
      right: { code: py`names = ["ada", "ben"]
for name in names:
    print(name.title())`, lang: 'python' },
      explanation: py`Comprehensions and \`map\` are for *computing values*. For actions (printing, saving, sending), a plain \`for\` loop says what you mean and doesn't build a throwaway list.`,
    },
    {
      title: 'Writing deep recursion to "be functional"',
      wrong: { code: py`def total(items):
    if not items:
        return 0
    return items[0] + total(items[1:])   # one frame per item, plus a copy each time

total(list(range(5000)))   # RecursionError: maximum recursion depth exceeded`, lang: 'python', static: true },
      right: { code: py`def total(items):
    return sum(items)          # or a loop with a local accumulator

print(total(list(range(5000))))`, lang: 'python' },
      explanation: py`CPython has no tail-call optimisation and a default recursion limit of 1000. In Python, loops, built-ins (\`sum\`, \`max\`, \`any\`) and \`functools.reduce\` are the functional-friendly way to fold a sequence.`,
    },
    {
      title: 'Assigning the result of a mutating method',
      wrong: { code: py`scores = [3, 1, 2]
scores = scores.sort()     # sort() returns None!
print(scores)              # None`, lang: 'python' },
      right: { code: py`scores = [3, 1, 2]
ordered = sorted(scores)   # new list
print(ordered, scores)`, lang: 'python' },
      explanation: py`Mutating methods return \`None\` precisely so you don't confuse them with functions that return a new value. Pick one style: mutate (\`scores.sort()\`) or build (\`sorted(scores)\`).`,
    },
  ],
  debugging: [
    {
      symptom: py`Tests pass one at a time but fail when the whole suite runs (or in a different order).`,
      cause: py`Shared mutable state: a module-level list/dict/cache, a mutable default argument or a class attribute that one test (or function) changes and another reads.`,
      fix: py`Find the shared object (search for module-level mutable values and \`global\`). Pass state in as parameters, return new values, or create fresh state per call/test.`,
    },
    {
      symptom: py`A function returns different results for the same arguments.`,
      cause: py`A hidden input: a global, the current time, random numbers, an environment variable, a file or an argument that some other code mutated in between.`,
      fix: py`Make every input a parameter (inject \`now\`, a seeded \`random.Random\`, config). Freeze shared data with tuples/frozen dataclasses so nobody can change it underneath you.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not subscriptable`,
      cause: py`The result of a mutating method was assigned and used: \`items = items.sort()\` or \`data = data.append(x)\` — those methods return \`None\`.`,
      fix: py`Either call the method on its own line (\`items.sort()\`) or use the value-returning version (\`items = sorted(items)\`, \`data = data + [x]\`).`,
    },
    {
      symptom: py`RecursionError: maximum recursion depth exceeded`,
      cause: py`A recursive "functional" solution over a long list or deep structure. Python doesn't optimise tail calls.`,
      fix: py`Rewrite with a loop, a built-in (\`sum\`, \`max\`, \`any\`) or \`functools.reduce\`. Raising the recursion limit only moves the cliff.`,
    },
    {
      symptom: py`TypeError: 'mappingproxy' object does not support item assignment`,
      cause: py`Code tried to change a read-only \`MappingProxyType\` view — usually shared configuration that was frozen on purpose.`,
      fix: py`Build a new dict with the change (\`dict(config) | {"debug": True}\`) and pass that along, instead of modifying the shared one.`,
    },
  ],
  bestPractices: [
    'Write most logic as pure functions: all inputs as parameters, the result as the return value.',
    'Return new values (sorted, comprehensions, replace(), d | {...}) instead of mutating arguments.',
    'Inject time, randomness and configuration as parameters so functions stay deterministic and testable.',
    'Keep side effects (I/O, logging, saving) in a thin shell around a pure core.',
    'Use immutable data (tuples, frozensets, frozen dataclasses) for values that are shared.',
    'Mutating a local object you just created is fine — purity is about what callers can see.',
    'Prefer loops, comprehensions and built-ins over deep recursion; readability beats purity points.',
  ],
  whenToUse: {
    use: [
      'Business rules and calculations (prices, scores, validation) — pure functions make them easy to test.',
      'Data transformations and pipelines: parse → clean → summarise.',
      'Shared configuration and messages between parts of a program or between tasks.',
      'Code that will be called from many places, where surprises are expensive.',
    ],
    avoid: [
      'Forcing everything immutable inside hot loops that build huge collections — mutate a local, return it.',
      'Replacing clear loops with deep recursion or nested lambdas.',
      'Hiding necessary side effects instead of making them explicit at the edges.',
    ],
  },
  comparison: {
    title: 'Mutate in place vs return a new value',
    headers: ['', 'mutate in place', 'return a new value'],
    rows: [
      ['examples', 'list.sort(), list.append(), dict.update(), obj.attr = x', 'sorted(), lst + [x], d | {...}, replace(obj, attr=x)'],
      ['return value', 'usually None', 'the new object'],
      ['caller\'s data', 'changed — everyone sharing it sees the change', 'untouched'],
      ['cost', 'no copy', 'a copy of the container (O(n)); contents are shared'],
      ['safe to share across functions, threads, caches', 'only with care', 'yes, if the contents are immutable too'],
      ['testing', 'check state before and after', 'compare the result'],
    ],
    note: py`Both are legitimate. The functional habit is to *default* to returning new values and to mutate only objects you own (locals) or when changing state is the documented job of the function.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'functional-concepts-q1',
      type: 'mcq',
      prompt: 'Which function is **pure**?',
      options: [
        { text: 'def log_score(s): scores.append(s); return len(scores)', why: 'It changes a global list (a side effect) and its result depends on how many times it was called before.' },
        'def area(width, height): return width * height',
        { text: 'def roll(): return random.randint(1, 6)', why: 'Same (no) input, different outputs: randomness is a hidden input.' },
        { text: 'def greet(name): print("Hi", name)', why: 'Printing is a side effect — the function changes the outside world (the screen) and returns None.' },
      ],
      answer: 1,
      explanation: py`\`area\` reads only its arguments and changes nothing: same input, same output, no side effects.`,
    },
    {
      id: 'functional-concepts-q2',
      type: 'output',
      prompt: 'What does this print? (Then ask yourself: could you replace `next_id("order")` with its value?)',
      code: py`counter = 0

def next_id(prefix):
    global counter
    counter += 1
    return f"{prefix}-{counter}"

print(next_id("order"), next_id("order"))`,
      answer: 'order-1 order-2',
      accept: ['order-1 order-2'],
      explanation: py`Same argument, different results: the function reads and changes a global. It is **not referentially transparent** — you can't replace a call with "its value", because it doesn't have a single value.`,
    },
    {
      id: 'functional-concepts-q3',
      type: 'bug',
      prompt: 'After calling `top_three`, the caller finds `results` reordered. Click the line that causes it.',
      code: py`def top_three(scores):
    scores.sort(reverse=True)
    return scores[:3]

results = [55, 92, 78, 99, 61]
podium = top_three(results)
print(results)`,
      answerLine: 2,
      explanation: py`\`scores\` is another name for the caller's list, and \`.sort()\` reorders it in place. Use \`sorted(scores, reverse=True)[:3]\` to leave it alone.`,
    },
    {
      id: 'functional-concepts-q4',
      type: 'fill',
      prompt: 'Make `top_three` pure by building a new sorted list instead of sorting the argument.',
      code: py`def top_three(scores):
    return ___(scores, reverse=True)[:3]`,
      answer: [['sorted']],
      explanation: py`\`sorted()\` accepts any iterable and returns a new list, leaving its input untouched.`,
    },
    {
      id: 'functional-concepts-q5',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`def make_multiplier(n):
    return lambda x: x * n

double, triple = make_multiplier(2), make_multiplier(3)
ops = {"double": double, "triple": triple}
print(ops["triple"](ops["double"](5)))`,
      options: [
        '30',
        { text: '15', why: 'The inner call runs first: double(5) is 10, then triple(10).' },
        { text: '25', why: 'Each lambda remembers its own n (2 and 3); nothing adds 5 + 5 + ….' },
        { text: 'TypeError: \'function\' object is not subscriptable', why: 'ops is a dict holding functions; ops["triple"] looks up a function, which is then called.' },
      ],
      answer: 0,
      explanation: py`Functions are values: stored in a dict, looked up, called. \`double(5)\` → 10, \`triple(10)\` → 30. Each lambda is a closure remembering its own \`n\`.`,
    },
    {
      id: 'functional-concepts-q6',
      type: 'mcq',
      prompt: 'In CPython with default settings, what happens when you call this with `n = 5000`?\n\n```python\ndef count_down(n):\n    return n if n == 0 else count_down(n - 1)\n```',
      options: [
        { text: 'It returns 0: the recursive call is the last thing the function does, so Python reuses the frame', why: 'That optimisation (tail-call elimination) exists in some languages, but CPython does not do it.' },
        'RecursionError: maximum recursion depth exceeded',
        { text: 'It returns 0 but slowly', why: 'Each call needs a new frame; past the recursion limit (1000 by default) CPython stops with an error.' },
        { text: 'SyntaxError', why: 'The code is valid; the problem only appears at runtime.' },
      ],
      answer: 1,
      explanation: py`Python has no tail-call optimisation. Write it as a loop — or, here, notice it just returns 0.`,
    },
    {
      id: 'functional-concepts-q7',
      type: 'short',
      prompt: 'What is referential transparency, and why does it make testing easier?',
      answer: py`An expression is referentially transparent if you can replace it with its value without changing the program — true for calls to pure functions, because the same arguments always give the same result and nothing else changes. Tests then become simple input → expected output checks: no setup of global state, no cleanup, no mocks, and tests can run in any order (or in parallel) without affecting each other.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'pure-gradebook',
      title: 'A pure grade book',
      difficulty: 'intermediate',
      prompt: py`Write three **pure** functions — no printing, no globals, no changes to their arguments.

1. \`curve(grades, bonus)\` — \`grades\` is a dict \`{name: score}\`. Return a **new** dict with \`bonus\` added to every score, **capped at 100**. The input dict must not change.
2. \`letter(score)\` — return \`"A"\` for 90 and above, \`"B"\` for 80+, \`"C"\` for 70+, otherwise \`"F"\`.
3. \`report(grades)\` — return a list of strings \`"name: score (letter)"\`, **sorted by name**, e.g. \`["ada: 96 (A)", "ben: 83 (B)"]\`.

The program at the bottom (the "shell") prints the report.`,
      files: {
        'main.py': py`def curve(grades, bonus):
    """Return a NEW dict with bonus added to every score, capped at 100."""
    # TODO
    return grades


def letter(score):
    # TODO: "A" for 90+, "B" for 80+, "C" for 70+, otherwise "F"
    return "F"


def report(grades):
    """Return ["name: score (letter)", ...] sorted by name."""
    # TODO
    return []


grades = {"cy": 98, "ada": 91, "ben": 78}
for line in report(curve(grades, 5)):
    print(line)
`,
      },
      hints: [
        'A dict comprehension builds a new dict: {name: ... for name, score in grades.items()}.',
        'Cap with min(score + bonus, 100). For the report, loop over sorted(grades.items()) and use an f-string.',
        'return [f"{name}: {score} ({letter(score)})" for name, score in sorted(grades.items())]',
      ],
      solution: {
        explanation: py`\`curve\` uses a dict comprehension, which always builds a **new** dict, so the caller's \`grades\` is untouched. \`letter\` is a pure mapping from a number to a string — checking from the top grade down means each \`if\` only needs a lower bound. \`report\` composes the other pure pieces: \`sorted(grades.items())\` gives \`(name, score)\` pairs in name order without mutating anything. Only the last two lines do I/O; every function above them can be tested with a single \`assert\`.`,
        files: {
          'main.py': py`def curve(grades, bonus):
    """Return a NEW dict with bonus added to every score, capped at 100."""
    return {name: min(score + bonus, 100) for name, score in grades.items()}


def letter(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    return "F"


def report(grades):
    """Return ["name: score (letter)", ...] sorted by name."""
    return [f"{name}: {score} ({letter(score)})" for name, score in sorted(grades.items())]


grades = {"cy": 98, "ada": 91, "ben": 78}
for line in report(curve(grades, 5)):
    print(line)
`,
        },
      },
      tests: [
        { name: 'curve adds the bonus and caps at 100', code: py`assert curve({"ada": 91, "cy": 98}, 5) == {"ada": 96, "cy": 100}` },
        { name: 'curve does not modify its input', code: py`original = {"ada": 91}
curve(original, 5)
assert original == {"ada": 91}, 'Build a new dict instead of changing grades'` },
        { name: 'curve prints nothing', code: py`assert capture(curve, {"ada": 91}, 5) == ""` },
        { name: 'letter boundaries', code: py`assert [letter(s) for s in (90, 89, 80, 79, 70, 69)] == ["A", "B", "B", "C", "C", "F"]` },
        { name: 'report is sorted by name', code: py`assert report({"ben": 83, "ada": 96}) == ["ada: 96 (A)", "ben: 83 (B)"]` },
        { name: 'the program prints the curved report', code: py`assert output.splitlines() == ["ada: 96 (A)", "ben: 83 (B)", "cy: 100 (A)"]` },
      ],
    },
    {
      id: 'compose-pipeline',
      title: 'compose() and pipeline()',
      difficulty: 'intermediate',
      prompt: py`Write two higher-order functions that combine one-argument functions into one:

- \`compose(*functions)\` applies them **right to left**: \`compose(f, g, h)(x) == f(g(h(x)))\`.
- \`pipeline(*functions)\` applies them **left to right**: \`pipeline(f, g, h)(x) == h(g(f(x)))\`.
- With **no** functions, both return a function that gives back its argument unchanged.

Then define \`slugify = pipeline(str.strip, str.lower, ...)\` so that \`slugify("  Hello World ")\` returns \`"hello-world"\` (spaces inside become \`-\`).`,
      files: {
        'main.py': py`def compose(*functions):
    """compose(f, g)(x) == f(g(x))"""
    # TODO
    return None


def pipeline(*functions):
    """pipeline(f, g)(x) == g(f(x))"""
    # TODO
    return None


slugify = None   # TODO: build it with pipeline()

print(slugify("  Hello World ") if callable(slugify) else "slugify is not ready yet")
`,
      },
      hints: [
        'Both should return a new inner function (a closure) that loops over the functions, feeding each result into the next.',
        'pipeline: for func in functions: value = func(value). compose: the same loop over reversed(functions) — or simply return pipeline(*reversed(functions)).',
        'slugify = pipeline(str.strip, str.lower, lambda text: text.replace(" ", "-"))',
      ],
      solution: {
        explanation: py`\`pipeline\` returns a closure that remembers the tuple of functions and threads a value through them in order; with no functions the loop doesn't run and the value comes back unchanged (the *identity* function). \`compose\` is the same idea in reverse order, so it can simply reuse \`pipeline\`. Methods like \`str.strip\` are ordinary one-argument functions when accessed on the class (\`str.strip("  x ")\`), which is why they slot straight into the pipeline. The same fold can be written with \`functools.reduce\` — see [map, filter & reduce](lesson:map-filter-reduce).`,
        files: {
          'main.py': py`def compose(*functions):
    """compose(f, g)(x) == f(g(x))"""
    return pipeline(*reversed(functions))


def pipeline(*functions):
    """pipeline(f, g)(x) == g(f(x))"""
    def run(value):
        for func in functions:
            value = func(value)
        return value
    return run


slugify = pipeline(str.strip, str.lower, lambda text: text.replace(" ", "-"))

print(slugify("  Hello World ") if callable(slugify) else "slugify is not ready yet")
`,
        },
      },
      tests: [
        { name: 'compose applies right to left', code: py`assert compose(str.upper, str.strip)("  hi ") == "HI"
assert compose(lambda n: n + 1, lambda n: n * 10)(2) == 21` },
        { name: 'pipeline applies left to right', code: py`assert pipeline(lambda n: n + 1, lambda n: n * 10)(2) == 30` },
        { name: 'no functions means identity', code: py`assert compose()(42) == 42 and pipeline()("same") == "same"` },
        { name: 'slugify works', code: py`assert slugify("  Hello World ") == "hello-world"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'functional-concepts-pure',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a pure function? Give two examples of side effects.',
      answer: 'A function whose return value depends only on its arguments and which has no side effects. Side effects: printing or writing files, mutating an argument or a global, sending network requests; hidden inputs like the clock or random numbers also break purity.',
      explanation: py`Pure functions are deterministic and leave the world unchanged, so they can be tested with plain asserts, cached, reordered and run in parallel safely. Real programs need side effects; the goal is to isolate them, not eliminate them.`,
      whyAsked: 'A basic check that you understand the vocabulary behind testable, maintainable code.',
      mistakes: ['Saying a pure function "has no variables"', 'Forgetting hidden inputs like time and randomness', 'Claiming side effects are always bad'],
      followUps: ['Is a function that builds and returns a local list pure?', 'How do you test a function that needs the current time?'],
      modelAnswer: 'A pure function always returns the same result for the same arguments and doesn’t change anything outside itself. Side effects are things like printing, writing to a file or database, modifying a list that was passed in, or changing a global. Reading the clock or a random number generator breaks purity too, because it’s a hidden input. Pure functions are easy to test — call and compare — and safe to cache or run in parallel. Real programs need side effects, so I keep them at the edges and make the core logic pure.',
    },
    {
      id: 'functional-concepts-flaky-tests',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A pricing module’s tests pass individually, but when the whole suite runs, `test_vip_discount` fails about half the time depending on order. The module has `_rules = []` at top level and `def add_rule(rule): _rules.append(rule)`. What is going on and how do you fix the design?',
      answer: 'Shared mutable module state: tests (and production code) register rules into one global list, so each test sees rules left behind by earlier tests. Make pricing a pure function of its inputs — pass the rules in (or build a fresh Pricing object per use) — so no call can affect another.',
      explanation: py`Module-level mutable objects live for the whole process. Every \`add_rule\` call leaks into every later test. Short-term you can reset the list in a fixture, but the real fix is to make the dependency explicit: \`price(order, rules)\`, where \`rules\` is a tuple built by the caller. Then tests construct exactly the rules they need.`,
      code: { lang: 'python', code: py`def price(order_total, rules):
    for rule in rules:                # rules: a tuple of functions
        order_total = rule(order_total)
    return round(order_total, 2)

vip = lambda total: total * 0.9
print(price(100.0, (vip,)), price(100.0, ()))   # 90.0 100.0 — no shared state` },
      whyAsked: 'Order-dependent tests are a classic real-world symptom of hidden shared state.',
      mistakes: ['Only resetting the list in a test fixture without fixing the design', 'Blaming the test framework', 'Adding sleeps or retries'],
      followUps: ['How would you detect order dependence automatically?', 'What other places hide global state (class attributes, default arguments, singletons)?'],
      modelAnswer: 'The tests are sharing a mutable global: the _rules list lives for the whole test process, so rules added by one test are still there for the next, and the result depends on the order tests run in. Resetting it in a fixture would hide the symptom, but the design problem is the hidden dependency. I would make pricing take the rules as a parameter — price(order, rules) with an immutable tuple — or create a fresh Pricing object per use. Then each test passes exactly the rules it needs, and production code becomes easier to reason about too.',
    },
    {
      id: 'functional-concepts-immutability-tools',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Python has no `const` and its main collections are mutable. What tools do you have for immutable data, and what are their limits and costs?',
      answer: 'Immutable built-ins (int, str, tuple, frozenset, bytes), frozen dataclasses and NamedTuples for records, and MappingProxyType for read-only dict views. All are shallow — a tuple can hold a mutable list — and "changing" them means building a copy (O(n) for containers) because the standard library has no persistent data structures.',
      explanation: py`Pick by need: tuples/frozensets for collections, frozen dataclasses for records, \`MappingProxyType\` to expose internal dicts read-only. Make contents immutable too if you need hashability or true safety. Copy cost is usually irrelevant for small data; for large, frequently updated collections, mutate a private local and expose an immutable result. \`typing.Final\` only tells type checkers a name must not be rebound.`,
      whyAsked: 'Tests practical knowledge of Python’s immutability story beyond "tuples are immutable".',
      mistakes: ['Thinking tuple contents are deeply immutable', 'Not knowing MappingProxyType', 'Believing Final is enforced at runtime'],
      followUps: ['How would you expose a class’s internal dict without letting callers change it?', 'What are persistent data structures?'],
      modelAnswer: 'For values I have the immutable built-ins: ints, strings, tuples, frozensets and bytes. For records, frozen dataclasses and NamedTuples. For dicts there is no frozen dict built in, but types.MappingProxyType gives a read-only view, which is great for exposing internal state. Typing.Final only stops type checkers from allowing a name to be rebound. The limits: all of these are shallow, so a tuple containing a list is not really immutable, and every "change" means building a new container, which costs O(n) because there are no persistent data structures in the standard library. In practice that is fine for typical data sizes.',
    },
    {
      id: 'functional-concepts-is-python-functional',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Is Python a functional programming language? Which functional features does it support well, and where does it fall short?',
      answer: 'It is a multi-paradigm language with good functional support: first-class functions, closures, lambdas, comprehensions, generators, map/filter/reduce, functools and immutable types. It falls short on tail-call optimisation, multi-statement lambdas, immutability by default and persistent data structures — so idiomatic Python mixes functional style with loops and objects.',
      explanation: py`Comprehensions and generator expressions are the idiomatic replacement for many \`map\`/\`filter\` uses, \`functools\` provides \`partial\`, \`reduce\`, \`lru_cache\` and \`singledispatch\`, and \`itertools\` offers lazy combinators. Missing: TCO (recursion depth is limited), expression-only lambdas, enforced immutability. Python also lacks a pipe operator, so composition is done with helper functions or plain nested calls.`,
      whyAsked: 'Probes depth and judgement: knowing the language’s design trade-offs rather than repeating slogans.',
      mistakes: ['Answering simply "yes" or "no"', 'Not knowing about the recursion limit', 'Overlooking comprehensions and generators as functional tools'],
      followUps: ['Why do you think Python favours comprehensions over map/filter?', 'How would you write a fold over a million items?'],
      modelAnswer: 'Python is multi-paradigm rather than a functional language, but it supports the core functional ideas well. Functions are first-class objects, closures and lambdas exist, comprehensions and generators give declarative, lazy data processing, and functools and itertools provide partial, reduce, caching and lazy combinators. Where it falls short: no tail-call optimisation, so deep recursion hits RecursionError; lambdas are limited to one expression; data is mutable by default and there are no persistent collections built in. So in practice I write a functional core with pure functions and immutable data, but I happily use loops and objects where they read better.',
    },
    {
      id: 'functional-concepts-update-in',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `update_in(data, path, value)` that returns a **new** nested dict with `value` set at the key `path` (a tuple of keys), creating missing dicts along the way. The original must not change, and branches that were not on the path must be **shared**, not copied.',
      answer: 'Recursively copy only the dicts along the path: return {**data, key: update_in(data.get(key, {}), rest, value)}, with the base case {**data, key: value}.',
      explanation: py`This is *structural sharing*: only the dicts on the path are rebuilt (O(depth) copies of those dicts), and everything else is reused by reference. Because no existing dict is mutated, the old version stays valid — the core trick behind persistent data structures.`,
      starter: { files: { 'main.py': py`def update_in(data, path, value):
    """Return a new dict like data, with value set at path (a tuple of keys)."""
    # TODO: don't modify data!
    node = data
    for key in path[:-1]:
        node = node.setdefault(key, {})
    node[path[-1]] = value
    return data


config = {"db": {"host": "localhost", "port": 5432}, "debug": False}
print(update_in(config, ("db", "port"), 6543))
print(config)
` } },
      tests: [
        { name: 'sets a nested value', code: py`result = update_in({"db": {"port": 5432}}, ("db", "port"), 6543)
assert result == {"db": {"port": 6543}}` },
        { name: 'the original is unchanged', code: py`config = {"db": {"host": "localhost", "port": 5432}}
update_in(config, ("db", "port"), 6543)
assert config == {"db": {"host": "localhost", "port": 5432}}` },
        { name: 'creates missing levels', code: py`assert update_in({}, ("a", "b", "c"), 1) == {"a": {"b": {"c": 1}}}` },
        { name: 'untouched branches are shared', code: py`config = {"db": {"port": 5432}, "cache": {"size": 10}}
result = update_in(config, ("db", "port"), 1)
assert result["cache"] is config["cache"], 'Reuse branches that are not on the path'
assert result["db"] is not config["db"]` },
      ],
      solution: { files: { 'main.py': py`def update_in(data, path, value):
    """Return a new dict like data, with value set at path (a tuple of keys)."""
    key, *rest = path
    if not rest:
        return {**data, key: value}
    return {**data, key: update_in(data.get(key, {}), rest, value)}


config = {"db": {"host": "localhost", "port": 5432}, "debug": False}
print(update_in(config, ("db", "port"), 6543))
print(config)
` } },
      hints: ['{**data, key: new_value} builds a new dict that shares all other values with data.', 'Recurse one level per key: the new value for key is update_in(data.get(key, {}), rest, value).', 'Base case: when the path has one key left, return {**data, key: value}.'],
      whyAsked: 'Tests immutable updates, recursion on nested data and understanding of copying vs sharing.',
      mistakes: ['Using setdefault or assignment on the original', 'Deep-copying the whole structure (correct but wasteful, and loses sharing)', 'Forgetting to create missing levels'],
      followUps: ['What is the cost of each update?', 'How would you write delete_in?', 'Why is sharing safe here?'],
      modelAnswer: 'I would rebuild only the dicts along the path. Split the path into the first key and the rest; if there is no rest, return {**data, key: value} — a new dict that shares every other value with the original. Otherwise, the new value for that key is update_in applied to data.get(key, {}) with the rest of the path, which also handles missing levels. No existing dict is ever mutated, so the original stays valid, and branches off the path are shared by reference — that is structural sharing, the idea behind persistent data structures. Each update costs copies of the dicts on the path, not the whole tree.',
    },
    {
      id: 'functional-concepts-core-shell',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You are writing a CLI that reads a CSV of transactions, flags suspicious ones by several rules, prints a summary and emails a report. How would you apply "functional core, imperative shell"?',
      answer: 'The shell reads the file, parses rows into immutable records, calls a pure core (validate, apply each rule — themselves pure functions — summarise), then prints and emails the results. Time, thresholds and configuration are passed into the core. The core is unit-tested with plain data; the shell gets a couple of integration tests with fakes.',
      explanation: py`Rules become a tuple of pure functions \`Transaction -> Flag | None\`, so adding a rule is adding a function. Summaries are pure folds over the flags. The email client is passed into the shell (dependency injection) so it can be faked. This makes the expensive-to-test parts tiny and keeps business logic deterministic — see [clean architecture](lesson:clean-architecture).`,
      whyAsked: 'Shows whether you can turn the principle into a concrete, testable design.',
      mistakes: ['Reading files or calling datetime.now() inside rule functions', 'Making rules mutate the transaction', 'Mocking everything instead of separating the pure parts'],
      followUps: ['How would you add a rule that needs data from a database?', 'Where do errors in parsing go?'],
      modelAnswer: 'I would split it into a thin shell and a pure core. The shell does all the I/O: it reads the CSV, parses each row into a frozen Transaction record, reads configuration and the current time, and at the end prints the summary and sends the email through a client object it was given. The core is pure: each rule is a function from a transaction to an optional flag, the rules are a tuple I can extend, and summarising is a fold over the results. Thresholds and "now" are parameters, so the core is deterministic. Unit tests then call the core with hand-made transactions, and a couple of integration tests run the shell with a fake email client.',
    },
  ],

  takeaways: [
    'A pure function’s result depends only on its arguments, and it changes nothing outside itself.',
    'Side effects (I/O, mutation, globals) and hidden inputs (time, randomness) make code harder to test — keep them at the edges.',
    'Return new values (sorted, comprehensions, replace(), d | {...}) instead of mutating arguments; mutating your own locals is fine.',
    'Functions are values: pass them, return them, store them, and compose small ones into bigger ones.',
    'Immutable data (tuples, frozensets, frozen dataclasses, MappingProxyType) is safe to share — but only shallowly.',
    'Python is multi-paradigm: no tail-call optimisation, one-expression lambdas — use loops, comprehensions and built-ins where they read better.',
  ],
}
