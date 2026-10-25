// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LEGACY = py`# legacy.py -- the original checkout code, kept only to compare against.
# This is the "before" picture: don't copy its style.
def calc(d, t, f):
    # calc
    if d != None:
        if len(d) > 0:
            s = 0
            for i in range(len(d)):
                s = s + d[i][1] * d[i][2]
            if t == 1:
                if s > 100:
                    s = s - s * 0.1
            if f:
                s = s + 4.99
            return round(s, 2)
        else:
            return 0
    else:
        return 0
`

const CHECKOUT = py`"""Refactoring a messy checkout function, protected by characterization tests."""
from legacy import calc

MEMBER_DISCOUNT_RATE = 0.10
MEMBER_DISCOUNT_THRESHOLD = 100
EXPRESS_DELIVERY_FEE = 4.99


def subtotal(items):
    return sum(price * quantity for _name, price, quantity in items)


def apply_member_discount(amount):
    """Return amount minus the member discount, if the amount qualifies."""
    if amount <= MEMBER_DISCOUNT_THRESHOLD:
        return amount
    return amount - amount * MEMBER_DISCOUNT_RATE


def order_total(items, is_member=False, express=False):
    """Return what to charge for an order, rounded to cents.

    items is a list of (name, unit_price, quantity) tuples. Members get
    10% off subtotals over 100; express delivery adds a flat fee.
    """
    if not items:  # also covers None: the legacy code charged 0 for both
        return 0
    total = subtotal(items)
    if is_member:
        total = apply_member_discount(total)
    if express:
        total += EXPRESS_DELIVERY_FEE
    return round(total, 2)


# Characterization tests: each case goes through BOTH versions.
# (items, legacy customer type, express?) -- type 1 meant "member".
CASES = [
    (None, 0, False),
    ([], 1, True),
    ([("pen", 1.5, 4)], 0, False),
    ([("pen", 1.5, 4)], 0, True),
    ([("chair", 60.0, 1)], 1, False),
    ([("lamp", 45.0, 2), ("bulb", 3.25, 4)], 1, False),
    ([("lamp", 45.0, 2), ("bulb", 3.25, 4)], 1, True),
]


def find_mismatches(cases):
    """Run every case through old and new code; return the ones that differ."""
    mismatches = []
    for items, customer_type, express in cases:
        expected = calc(items, customer_type, express)
        actual = order_total(items, is_member=(customer_type == 1), express=express)
        if actual != expected:
            mismatches.append((items, expected, actual))
        print(f"legacy {expected:>7}   new {actual:>7}")
    return mismatches


mismatched = find_mismatches(CASES)
if mismatched:
    print("MISMATCH:", mismatched)
else:
    print(f"all {len(CASES)} cases match the legacy behaviour")
`

const NESTED_CHECKOUT = py`def checkout_problem(user, cart):
    """Return why this checkout can't go ahead, or "ok"."""
    if user is not None:
        if user["verified"]:
            if cart:
                if all(quantity > 0 for quantity in cart.values()):
                    return "ok"
                else:
                    return "invalid quantity"
            else:
                return "empty cart"
        else:
            return "unverified account"
    else:
        return "not logged in"


ada = {"name": "Ada", "verified": True}
print(checkout_problem(ada, {"pen": 2}))
print(checkout_problem(None, {"pen": 2}))
`

const FLAT_CHECKOUT = py`def checkout_problem(user, cart):
    """Return why this checkout can't go ahead, or "ok"."""
    if user is None:
        return "not logged in"
    if not user["verified"]:
        return "unverified account"
    if not cart:
        return "empty cart"
    if any(quantity <= 0 for quantity in cart.values()):
        return "invalid quantity"
    return "ok"


ada = {"name": "Ada", "verified": True}
print(checkout_problem(ada, {"pen": 2}))
print(checkout_problem(None, {"pen": 2}))
`

const IF_DEPTH_TEST = py`import ast
tree = ast.parse(files['main.py'])
func = next(node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef) and node.name == 'checkout_problem')

def if_depth(node, level=0):
    deepest = level
    for child in ast.iter_child_nodes(node):
        is_elif = isinstance(node, ast.If) and node.orelse == [child]
        step = 1 if isinstance(child, ast.If) and not is_elif else 0
        deepest = max(deepest, if_depth(child, level + step))
    return deepest

depth = if_depth(func)
assert depth <= 1, f'ifs are nested {depth} levels deep: use guard clauses so no if sits inside another if'`

export default {
  id: 'clean-code',
  title: 'Clean, readable Python: naming, PEP 8 & refactoring',
  summary: 'Clean code is code the next reader understands quickly and can change safely — PEP 8, honest names, small functions, guard clauses and refactoring under tests get you there.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['defining-functions', 'function-arguments'],
  related: ['code-quality-tools', 'solid', 'design-patterns', 'clean-architecture', 'variables-and-names', 'testing-fundamentals', 'tdd', 'type-hints', 'enums', 'error-handling-patterns'],
  tags: ['clean code', 'readability', 'PEP 8', 'PEP 20', 'Zen of Python', 'import this', 'naming', 'refactoring', 'guard clause', 'early return', 'flag argument', 'docstring', 'PEP 257', 'comments', 'magic numbers', 'characterization tests', 'keyword-only arguments', 'linter', 'formatter'],
  apis: [
    { name: 'import this', summary: 'Prints PEP 20, "The Zen of Python" — 19 aphorisms about Python\'s design taste.' },
    { name: 'help(obj)', summary: 'Shows an object\'s signature and docstring in the REPL.' },
    { name: 'obj.__doc__', summary: 'The docstring of a module, class or function (None if it has none).' },
    { name: 'inspect.getdoc(obj)', summary: 'Returns a cleaned-up docstring, inherited from a base class if the object has none.' },
    { name: 'def f(a, *, flag=False)', summary: 'A bare * makes every parameter after it keyword-only, so callers must write flag=True.' },
  ],
  docs: [
    { label: 'PEP 8 — Style Guide for Python Code', url: 'https://peps.python.org/pep-0008/' },
    { label: 'PEP 20 — The Zen of Python', url: 'https://peps.python.org/pep-0020/' },
    { label: 'PEP 257 — Docstring Conventions', url: 'https://peps.python.org/pep-0257/' },
    { label: 'Python tutorial — Intermezzo: coding style', url: 'https://docs.python.org/3/tutorial/controlflow.html#intermezzo-coding-style' },
    { label: 'Glossary — keyword-only parameter', url: 'https://docs.python.org/3/glossary.html#term-parameter' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Clean code** is code that the next person — very often *you*, three months from now — can read, understand and change without fear. It isn't about being clever or short. It's about making the code's *intent* obvious.`,
    py`PEP 8 (Python's official style guide) puts it in one line: *"code is read much more often than it is written."* A function is written once, then read during every bug hunt, code review and new feature. Every minute spent making it clearer is paid back many times.`,
    py`In this lesson you'll learn the habits that make Python code clean: following **PEP 8** and the spirit of **PEP 20** (the Zen of Python), choosing honest **names**, writing **small focused functions**, flattening logic with **guard clauses**, avoiding **flag arguments**, writing useful **docstrings** and **comments**, and — most importantly — **refactoring** messy code step by step while **tests** prove nothing broke. A *refactoring* is a change to the structure of code that doesn't change what it does.`,
  ],
  why: [
    py`Bugs hide in code that is hard to read. If you can't tell at a glance what \`calc(d, t, f)\` does, you also can't tell whether it's *right*.`,
    py`Messy code is expensive to change. Each new feature takes longer because you must first decode what's already there — and every change risks breaking something you didn't understand.`,
    py`Code is teamwork. Consistent style means reviewers talk about *logic* instead of spaces and quote marks, and newcomers can move around the codebase quickly. Tools can enforce most of the style automatically — see [formatters, linters & pre-commit](lesson:code-quality-tools).`,
  ],
  eli15: [
    py`Imagine two recipes for the same cake. One says: *"Mix stuff. Add the thing. Bake it until done, unless it's the other kind."* The other says: *"If you have no eggs, stop — you can't make this cake. Mix 200 g flour with 100 g sugar. Bake for 25 minutes at 180 °C."*`,
    py`Both describe the same cake. Only one can be followed by someone who has never seen you bake. Clean code is the second recipe: clear names (*flour*, not *stuff*), one instruction per step, the "stop now" checks at the top, and exact numbers with labels instead of mystery values.`,
    py`And when you improve a recipe, you taste the cake after every small change. In code, the "taste test" is running your tests after every small change.`,
  ],
  analogy: {
    title: 'A recipe anyone can follow',
    body: [
      py`A good recipe has a clear title, a list of ingredients with amounts, numbered steps that each do one thing, and warnings *before* you start ("needs an oven at 180 °C"). Its side notes explain *why* ("rest the dough so it doesn't shrink"), not *what* — the steps already say what.`,
      py`When a chef tweaks a recipe, they change one thing at a time and taste after each change. If it suddenly tastes wrong, they know exactly which change caused it.`,
    ],
    mapping: [
      ['recipe title', 'a function name that says what it does: order_total()'],
      ['ingredients with amounts', 'named constants instead of magic numbers: EXPRESS_DELIVERY_FEE = 4.99'],
      ['one step per line', 'small functions that each do one job'],
      ['"no eggs? stop here" at the top', 'guard clauses: handle bad cases first, then the main path'],
      ['a side note explaining why', 'a comment that explains a reason, not what the line does'],
      ['standard recipe-card layout', 'PEP 8: the shared layout every Python reader expects'],
      ['tasting after each tweak', 'running tests after each small refactoring step'],
    ],
  },
  visual: {
    type: 'comparison',
    title: 'Same behaviour, very different reading experience',
    props: {
      left: { label: 'Before: legacy.py', lang: 'python', code: LEGACY },
      right: {
        label: 'After: order_total()',
        lang: 'python',
        code: py`MEMBER_DISCOUNT_RATE = 0.10
MEMBER_DISCOUNT_THRESHOLD = 100
EXPRESS_DELIVERY_FEE = 4.99


def order_total(items, *, is_member=False, express=False):
    """Return what to charge for an order, rounded to cents."""
    if not items:
        return 0
    total = subtotal(items)
    if is_member:
        total = apply_member_discount(total)
    if express:
        total += EXPRESS_DELIVERY_FEE
    return round(total, 2)`,
      },
      points: [
        'Names say what things are: items, is_member, express instead of d, t, f.',
        'Magic numbers (0.1, 100, 4.99) became named constants that explain themselves.',
        'The nested "arrow" of ifs became one guard clause and a straight main path.',
        'Index juggling (d[i][1] * d[i][2]) moved into a small subtotal() helper with tuple unpacking.',
        'The cryptic t == 1 became a readable keyword-only option: is_member=True.',
        'A docstring replaced the useless "# calc" comment — and help(order_total) now shows it.',
      ],
    },
    alt: 'Side-by-side code. Left: the legacy calc(d, t, f) function with four levels of nested if statements, index-based loops and unexplained numbers 0.1, 100 and 4.99. Right: order_total(items, *, is_member, express) with named constants, a docstring, one early return for empty orders and a flat sequence of steps.',
    caption: py`Both functions return exactly the same numbers for every input — the playground below proves it with *characterization tests*.`,
  },
  syntax: [
    py`#### PEP 8: the shared layout`,
    py`PEP 8 is a *convention*, not a rule the interpreter enforces — Python will happily run ugly code. But every experienced Python developer expects this layout, so following it makes your code instantly familiar.`,
    { code: py`"""Module docstring: one line saying what this file is for."""
import json                     # 1. standard library imports
from pathlib import Path

MAX_RETRIES = 3                 # constants: UPPER_SNAKE_CASE


class InvoiceStore:             # classes: CapWords
    """Load and save invoices as JSON files."""

    def __init__(self, folder):
        self.folder = Path(folder)

    def load(self, invoice_id):            # methods: one blank line apart
        path = self.folder / f"{invoice_id}.json"
        return json.loads(path.read_text())


def total_due(invoices):        # functions: snake_case, two blank lines around
    return sum(invoice["amount"] for invoice in invoices if not invoice["paid"])`, lang: 'python', title: 'the PEP 8 shape of a module' },
    py`- **4 spaces** per indentation level, never tabs.
- **Line length:** PEP 8 says 79 characters; many teams agree on a longer limit (the Black and Ruff formatters default to 88). Pick one and let the tool enforce it.
- **Imports** at the top, grouped: standard library, then third-party, then your own modules, with a blank line between groups.
- **Blank lines:** two around top-level functions and classes, one between methods.
- **Spaces** around \`=\`, \`==\`, \`+\` in statements, but not around \`=\` in keyword arguments: \`connect(host, timeout=5)\`.
- **Comparisons:** \`if user is None:\` (never \`== None\`), \`if not items:\` for "empty", \`if is_ready:\` (never \`== True\`).`,
    { callout: 'tip', title: 'Let a tool do the boring part', text: py`Don't hand-format. A *formatter* (Ruff format or Black) rewrites layout automatically, and a *linter* (Ruff) flags bugs and smells like unused imports or \`== None\`. Set them up once — see [code quality tools](lesson:code-quality-tools) — and spend your attention on names and structure, which no tool can fix for you.` },
    py`#### PEP 20: the Zen of Python`,
    py`Python ships with its own design philosophy. Run this anywhere:`,
    { code: py`import this`, lang: 'python', title: 'prints PEP 20' },
    { code: py`>>> import this
The Zen of Python, by Tim Peters

Beautiful is better than ugly.
Explicit is better than implicit.
Simple is better than complex.
...
Readability counts.
...
Errors should never pass silently.
Unless explicitly silenced.
In the face of ambiguity, refuse the temptation to guess.
...`, lang: 'pycon', title: 'the first lines (19 aphorisms in total)' },
    py`Treat the Zen as *tie-breakers*, not laws. In practice: **"Explicit is better than implicit"** → pass \`is_member=True\` instead of a mystery \`1\`. **"Flat is better than nested"** → guard clauses. **"Errors should never pass silently"** → no bare \`except: pass\` (see [error-handling patterns](lesson:error-handling-patterns)). **"Readability counts"** → everything in this lesson.`,
    { callout: 'note', title: 'Why import this only prints once', text: py`A module's code runs the first time it is imported; later imports reuse the cached module from \`sys.modules\`. So a second \`import this\` in the same program prints nothing — the same caching you meet in [modules & imports](lesson:modules-and-imports).` },
    py`#### Names that reveal intent`,
    py`| instead of | write | why |
|---|---|---|
| \`d\`, \`data2\`, \`lst\` | \`unpaid_invoices\` | say *what it is*, not its type |
| \`t\` | \`timeout_seconds\` | include the **unit** when it matters |
| \`flag\`, \`check\` | \`is_member\`, \`has_stock\` | booleans read as yes/no questions |
| \`process()\`, \`handle()\` | \`send_receipt()\`, \`parse_row()\` | functions are **verbs** that say what they do |
| \`0.2\` scattered in code | \`VAT_RATE = 0.2\` | a named constant explains a **magic number** |
| \`l\`, \`O\`, \`I\` | anything else | PEP 8: they look like 1 and 0 |`,
    py`Short names are fine for tiny scopes (\`for i in range(3)\`, \`x, y\` in a maths formula). The wider a name's reach, the more descriptive it should be.`,
    py`#### Small, focused functions and guard clauses`,
    py`A function should do **one job** at **one level of detail**. A useful test: describe it in one sentence. If the sentence needs "and" (*"validates the order **and** charges the card **and** emails a receipt"*), split it.`,
    py`A **guard clause** is an early \`return\` (or \`raise\`) that handles a special or invalid case at the top, so the main logic isn't buried inside nested \`if\`s:`,
    { code: py`def shipping_cost(order):
    if order is None:
        raise ValueError("order is required")
    if order["total"] >= 50:
        return 0            # free shipping: decided, done
    if order["express"]:
        return 9.99
    return 4.99`, lang: 'python', title: 'guard clauses keep the main path flat' },
    py`#### Avoid flag arguments`,
    py`A **flag argument** is a boolean that switches a function between different behaviours. At the call site it's unreadable — what does \`export(rows, True)\` do? Two fixes:`,
    { code: py`# 1. The flag selects two different jobs -> make two functions
def to_csv(rows): ...
def to_table(rows): ...

# 2. The flag is a small option on ONE job -> make it keyword-only with *
def order_total(items, *, is_member=False, express=False): ...

order_total(cart, express=True)       # reads clearly
# order_total(cart, False, True)      # TypeError: must use keywords`, lang: 'python', title: 'two ways out' },
    py`The standard library uses the second form: \`sorted(scores, reverse=True)\` — \`reverse\` is keyword-only. When an option has more than two values, use an [Enum](lesson:enums) instead of several booleans.`,
    py`#### Docstrings (PEP 257) and comments`,
    py`A **docstring** is a string literal that is the *first statement* of a module, class or function. Python stores it in \`__doc__\`, and \`help()\` and editors show it.`,
    { code: py`def order_total(items, *, is_member=False, express=False):
    """Return what to charge for an order, rounded to cents.

    items is a list of (name, unit_price, quantity) tuples. Members get
    10% off subtotals over 100; express delivery adds a flat fee.
    """


print(order_total.__doc__.splitlines()[0])   # Return what to charge for an order, rounded to cents.`, lang: 'python', title: 'PEP 257 shape' },
    py`PEP 257 conventions: triple double quotes; a **one-line summary** in the imperative mood ("Return…", not "Returns…" or "This function…") ending in a period; for longer docstrings, a blank line and then the details.`,
    py`**Comments explain *why*, not *what*.** The code already says what; a comment should capture what the code can't: a business reason, a workaround, a warning.`,
    { code: py`# Bad: repeats the code
retries += 1  # add one to retries

# Good: explains a decision the code can't
# The payment API sometimes drops the first request after a deploy,
# so we retry once before reporting a failure.
retries += 1`, lang: 'python', title: 'what vs why', static: true },
  ],
  walkthrough: {
    title: 'Reading the refactored checkout',
    lang: 'python',
    code: CHECKOUT,
    intro: py`This is \`main.py\` from the playground. \`legacy.py\` (the original messy \`calc\`) sits next to it so we can prove the new code behaves identically. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [4, 6], text: py`The **magic numbers** from \`calc\` (\`0.1\`, \`100\`, \`4.99\`) become named constants. Now a reader knows what each number *means*, and a price change touches one line.` },
      { lines: [9, 10], text: py`\`subtotal\` replaces \`for i in range(len(d))\` and \`d[i][1] * d[i][2]\` with tuple unpacking. The names \`price\` and \`quantity\` document the tuple's shape; \`_name\` says "unused on purpose".` },
      { lines: [13, 17], text: py`One rule, one function. The early \`return amount\` is a guard clause for "doesn't qualify", so the discount itself sits on the flat main path.` },
      { lines: [20, 25], text: py`The signature now explains itself: \`is_member\` instead of \`t == 1\`, \`express\` instead of \`f\`. The PEP 257 docstring starts with a one-line, imperative summary.` },
      { lines: [26, 27], text: py`One guard clause replaces the legacy's two nested \`else: return 0\` branches. \`not items\` is true for both \`None\` and \`[]\` — and the comment explains *why* that's deliberate.` },
      { lines: [28, 33], text: py`The main path reads like the business rule, top to bottom: subtotal, member discount, delivery fee, round.` },
      { lines: [36, 46], text: py`**Characterization tests** pin down what the old code *actually does* (not what it should do), including odd cases like \`None\` and an empty express order.` },
      { lines: [49, 58], text: py`Every case runs through both versions. Any difference is collected as a mismatch — that's the safety net that lets you refactor boldly.` },
      { lines: [61, 65], text: py`If all cases match, the refactoring preserved behaviour. In a real project these checks would live in a test file run by [pytest](lesson:pytest-basics).` },
    ],
  },
  playground: {
    title: 'Refactoring the checkout safely',
    objective: 'Run it, then improve the code further — after every change, re-run and make sure every case still matches the legacy behaviour.',
    files: { 'main.py': CHECKOUT, 'legacy.py': LEGACY },
    expected: py`One line per case, then the verdict:

\`\`\`text
legacy       0   new       0
legacy       0   new       0
legacy     6.0   new     6.0
legacy   10.99   new   10.99
legacy    60.0   new    60.0
legacy    92.7   new    92.7
legacy   97.69   new   97.69
all 7 cases match the legacy behaviour
\`\`\``,
    experiments: [
      {
        id: 'docstring',
        task: py`\`subtotal()\` is the only function left without a docstring. Give it a PEP 257 one-line docstring (triple double quotes, imperative mood, ending with a period).`,
        hint: py`Something like \`"""Return the sum of unit_price * quantity for every item."""\` as the first line inside the function.`,
        tests: [
          { name: 'subtotal has a docstring', code: py`assert subtotal.__doc__, 'Add a docstring as the first statement of subtotal()'` },
          { name: 'the summary line ends with a period', code: py`assert subtotal.__doc__.strip().splitlines()[0].endswith('.'), 'PEP 257: end the summary line with a period'` },
        ],
        explain: py`The docstring is now stored in \`subtotal.__doc__\`, so \`help(subtotal)\` and every editor tooltip show it. A comment above the function would have been invisible to those tools.`,
      },
      {
        id: 'boundary-case',
        task: py`The member discount applies only to subtotals **over** 100. Add a characterization case to \`CASES\` for a member whose subtotal is **exactly** 100, and check that it still matches.`,
        hint: py`Add a tuple such as \`([("desk", 100.0, 1)], 1, False)\` to the \`CASES\` list.`,
        tests: [
          { name: 'a member case with a subtotal of exactly 100 exists', code: py`assert any(items and customer_type == 1 and subtotal(items) == 100 for items, customer_type, _express in CASES), 'Add a case for a member (type 1) whose subtotal is exactly 100'` },
          { name: 'every case still matches the legacy code', code: py`assert 'MISMATCH' not in output` },
        ],
        explain: py`Boundaries are where refactorings break: \`>\` versus \`>=\` is a one-character difference. Try changing \`<=\` to \`<\` in \`apply_member_discount\` and run again — your new case reports a MISMATCH. Then put it back.`,
      },
      {
        id: 'keyword-only',
        task: py`Make \`is_member\` and \`express\` **keyword-only**, so \`order_total(cart, True, False)\` raises a \`TypeError\` and callers have to write \`is_member=True\`.`,
        hint: py`Put a bare \`*\` before them: \`def order_total(items, *, is_member=False, express=False):\`.`,
        tests: [
          { name: 'positional flags are rejected', code: py`with raises(TypeError):
    order_total([("pen", 1.5, 4)], True, False)` },
          { name: 'keyword flags still work', code: py`assert order_total([("pen", 1.5, 4)], express=True) == 10.99` },
        ],
        explain: py`Everything after a bare \`*\` must be passed by name. The call sites can no longer hide meaning behind \`True, False\`, and the characterization tests still pass because \`find_mismatches\` already used keywords.`,
      },
      {
        id: 'negative-guard',
        task: py`New rule: an item with a quantity below 1 is a programming error. Add a **guard clause** to \`order_total\` that raises \`ValueError\` if any quantity is less than 1.`,
        hint: py`After the \`if not items\` guard: \`if any(quantity < 1 for _name, _price, quantity in items): raise ValueError("quantity must be at least 1")\`.`,
        tests: [
          { name: 'a negative quantity raises ValueError', code: py`with raises(ValueError):
    order_total([("pen", 1.5, -2)])` },
          { name: 'a zero quantity raises ValueError', code: py`with raises(ValueError):
    order_total([("pen", 1.5, 0)])` },
          { name: 'valid orders are unchanged', code: py`assert order_total([("pen", 1.5, 4)]) == 6.0 and 'MISMATCH' not in output` },
        ],
        explain: py`This *is* a behaviour change (the legacy code silently charged negative amounts), so it belongs in its own commit, separate from the pure refactoring. Guard clauses at the top keep the main path untouched.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The refactoring loop',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'green', label: 'Tests pass', note: 'behaviour pinned down', x: 110, y: 160, tone: 'blue' },
        { id: 'change', label: 'One small change', note: 'rename · extract · guard', x: 320, y: 60, tone: 'yellow' },
        { id: 'run', label: 'Run the tests', note: 'seconds, not minutes', x: 530, y: 160, tone: 'paper' },
        { id: 'red', label: 'Red?', note: 'undo or fix now', x: 680, y: 60, tone: 'red' },
        { id: 'commit', label: 'Commit', note: 'a safe point', x: 320, y: 265, tone: 'kraft' },
      ],
      edges: [
        { from: 'green', to: 'change', label: 'pick one' },
        { from: 'change', to: 'run' },
        { from: 'run', to: 'red', label: 'fails' },
        { from: 'red', to: 'change', label: 'undo', dashed: true },
        { from: 'run', to: 'commit', label: 'passes' },
        { from: 'commit', to: 'green', label: 'repeat' },
      ],
      steps: [
        { focus: ['green'], text: py`Start from **green**: tests that pin down the current behaviour. If the code has none, write **characterization tests** first — they record what it *does* today, quirks included.` },
        { focus: ['change'], edges: ['green->change'], text: py`Make **one** small, behaviour-preserving change: rename a variable, extract a function, add a guard clause, name a magic number. Not three at once.` },
        { focus: ['run'], edges: ['change->run'], text: py`Run the tests straight away. Fast tests make this loop pleasant; slow ones make people skip it.` },
        { focus: ['red'], edges: ['run->red', 'red->change'], text: py`**Red?** You know exactly which tiny change broke behaviour. Undo it (or fix it) before doing anything else — never pile new changes on a red build.` },
        { focus: ['commit'], edges: ['run->commit'], text: py`**Green?** Commit. Each commit is a safe point you can return to, and a reviewer can follow the story step by step.` },
        { focus: ['green', 'change', 'run', 'commit'], edges: ['commit->green'], text: py`Repeat. Many tiny safe steps beat one heroic rewrite — and you can stop at any point with working code.` },
      ],
    },
    alt: 'A loop diagram. "Tests pass" leads to "One small change", which leads to "Run the tests". If they fail, an arrow goes to "Red? undo or fix now" and a dashed arrow returns to "One small change". If they pass, an arrow goes to "Commit", which loops back to "Tests pass".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`**PEP** stands for *Python Enhancement Proposal*: a design document for the Python community. PEP 8 (style), PEP 20 (the Zen) and PEP 257 (docstrings) are *informational* — they describe conventions rather than language features. That's why breaking them never causes an error; it just makes code harder for other Python developers to read.`,
      py`Comments cost nothing when the program runs: Python throws them away while reading your source. Long, descriptive names cost nothing measurable either. Clarity is free at runtime — it's only "expensive" while typing, and editors autocomplete for you.`,
      py`"Refactoring" doesn't mean "rewriting". It means a sequence of small changes that each keep the behaviour identical, checked by tests after every step. If a step changes behaviour, it isn't a refactoring — it's a feature or a bug fix, and it deserves its own commit.`,
    ],
    technical: [
      py`A docstring is only a docstring when it is the **first statement** of the body. The compiler stores it in \`__doc__\`; a string anywhere else is just an expression that is evaluated and discarded. Running Python with \`-OO\` strips docstrings to save memory, so never put logic that the program needs in a docstring.`,
      { code: py`def report():
    """Summarise last week's sales."""

def broken():
    total = 0
    """Not a docstring: it isn't the first statement."""

print(report.__doc__)   # Summarise last week's sales.
print(broken.__doc__)   # None`, lang: 'python', title: 'position matters' },
      { callout: 'version', title: 'Python 3.13+', text: py`The compiler now strips the common leading indentation from docstrings, so \`__doc__\` no longer contains the method's indentation on every line. \`inspect.getdoc()\` has always cleaned this up, and also falls back to a base class's docstring.` },
      py`Keyword-only parameters (PEP 3102) are everything after a bare \`*\` (or after \`*args\`). Positional-only parameters (PEP 570, Python 3.8+) are everything before a \`/\`. Together they let a function's signature say *how* it must be called — a readability feature enforced by the interpreter.`,
      py`Even "obviously equivalent" rewrites can change behaviour. Since Python 3.12, \`sum()\` of floats uses compensated summation, so it can differ in the last digits from a hand-written \`+=\` loop:`,
      { code: py`total = 0
for amount in [0.1] * 10:
    total += amount
print(total)              # 0.9999999999999999
print(sum([0.1] * 10))    # 1.0 on Python 3.12+`, lang: 'python', title: 'a refactoring that changes floats' },
      py`In the playground, \`round(..., 2)\` hides that difference for every case — but you only *know* that because the characterization tests check it. For money in production, use \`decimal.Decimal\` or integer cents so these questions never arise.`,
    ],
    production: [
      py`**Automate style, review design.** Teams run a formatter and a linter on save, in a pre-commit hook and in CI ([code quality tools](lesson:code-quality-tools)). Code review then spends its time on names, boundaries and tests — the things no tool can judge.`,
      py`**Refactor in separate commits.** Mixing "move code around" with "change behaviour" in one diff makes reviews nearly impossible and \`git bisect\` useless. A common rhythm: *make the change easy (refactor), then make the easy change (feature)*.`,
      py`**Characterization tests before touching legacy code.** When code has no tests, record its current outputs for a broad set of inputs (a "golden master") and assert the refactored code matches. Fix real bugs *after* the refactoring, deliberately, with their own tests — see [test-driven development](lesson:tdd).`,
      py`**Deprecate, don't break.** Renaming a public function? Keep the old name as a thin wrapper that calls \`warnings.warn(..., DeprecationWarning, stacklevel=2)\` for a release or two (see [ExceptionGroup, except* & warnings](lesson:exception-groups)).`,
      py`**Pick one docstring style per project** — Google style, NumPy style or reStructuredText (Sphinx) — so documentation tools can render parameters and return values consistently. Type hints ([type hints](lesson:type-hints)) document types better than prose can, and checkers keep them honest.`,
      py`**The Boy Scout rule:** leave each file a little cleaner than you found it — rename one confusing variable, extract one function — as part of the work you were doing anyway. Small, continuous clean-ups beat a "big refactor" that never gets scheduled.`,
    ],
  },
  mistakes: [
    {
      title: 'Refactoring without a safety net',
      wrong: { code: py`# "I'll just tidy this up" -- rewrites the whole function from memory,
# changes > to >= by accident, ships it. No test noticed.
def apply_member_discount(amount):
    if amount >= 100:
        return amount * 0.9
    return amount`, lang: 'python' },
      right: { code: py`# First pin the current behaviour, including the boundary:
assert calc([("desk", 100.0, 1)], 1, False) == 100.0
assert calc([("desk", 100.5, 1)], 1, False) == 90.45
# ...then refactor in small steps, re-running these after each one.`, lang: 'python', static: true },
      explanation: py`Without tests, "cleaning up" is guessing. Characterization tests turn a risky rewrite into a series of verified steps — and they're cheap to write: call the old code, record what it returns.`,
    },
    {
      title: 'Comments that repeat the code (or are dead code)',
      wrong: { code: py`# loop over the orders
for order in orders:
    # check if paid
    if order.paid:
        # add to total
        total += order.amount
# old_total = sum(o.amount for o in orders if o.paid and not o.refunded)`, lang: 'python', static: true },
      right: { code: py`# Refunded orders stay "paid" in the payment system, so they are
# filtered out here rather than at the source.
total = sum(order.amount for order in orders if order.paid and not order.refunded)`, lang: 'python', static: true },
      explanation: py`"What" comments drift out of date and add noise. Commented-out code confuses readers ("is this needed?") — version control already remembers it. Keep comments for *why*.`,
    },
    {
      title: 'Positional boolean flags',
      wrong: { code: py`def send_report(report, as_pdf, urgent):
    ...

send_report(weekly, True, False)   # which True means what?`, lang: 'python' },
      right: { code: py`def send_report(report, *, as_pdf=False, urgent=False):
    ...

send_report(weekly, as_pdf=True)`, lang: 'python' },
      explanation: py`A reader of the call site can't decode \`True, False\`. Keyword-only options fix the readability; if the flag actually switches between two different jobs, split it into two functions.`,
    },
    {
      title: 'Clever one-liners',
      wrong: { code: py`emails = [u["email"].lower() for g in groups for u in g["users"] if u.get("active") and (d := u.get("email")) and "@" in d]`, lang: 'python' },
      right: { code: py`emails = []
for group in groups:
    for user in group["users"]:
        email = user.get("email")
        if user.get("active") and email and "@" in email:
            emails.append(email.lower())`, lang: 'python' },
      explanation: py`Comprehensions are great for one simple transformation. Once there are two loops, a filter and a walrus, a plain loop with good names is easier to read and debug (you can put a breakpoint inside it). "Sparse is better than dense."`,
    },
    {
      title: 'Names that lie',
      wrong: { code: py`def get_user(user_id):
    user = database.fetch(user_id)
    user.last_seen = now()
    database.save(user)        # a "get" that writes!
    return user`, lang: 'python', static: true },
      right: { code: py`def record_visit(user_id):
    user = database.fetch(user_id)
    user.last_seen = now()
    database.save(user)
    return user`, lang: 'python', static: true },
      explanation: py`Readers trust names. A function called \`get_…\` that also writes data will be called somewhere it shouldn't be. If a name is hard to choose, the function is probably doing two jobs.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: order_total() takes 1 positional argument but 3 were given`,
      cause: py`The parameters were made keyword-only with \`*\`, and an old call site still passes the options positionally: \`order_total(cart, True, False)\`.`,
      fix: py`Update the call to use keywords: \`order_total(cart, is_member=True, express=False)\`. This error is the point of keyword-only parameters — it finds every unclear call for you.`,
    },
    {
      symptom: py`help(my_function) shows no description, and my_function.__doc__ is None`,
      cause: py`The "docstring" isn't the first statement in the body (something comes before it), or it was written as a \`#\` comment.`,
      fix: py`Move the triple-quoted string to be the very first line of the body. Comments are never stored; only a leading string literal becomes \`__doc__\`.`,
    },
    {
      symptom: py`E711 Comparison to \`None\` should be \`cond is None\``,
      cause: py`A linter (Ruff, or flake8's pycodestyle rules) found \`x == None\` or \`x != None\`.`,
      fix: py`Write \`x is None\` / \`x is not None\`. Many linters can auto-fix this with \`ruff check --fix\`.`,
    },
    {
      symptom: py`A characterization test reports a MISMATCH after a "harmless" cleanup`,
      cause: py`The cleanup changed behaviour: a boundary (\`>\` vs \`>=\`), the order of operations on floats, or a special case such as \`None\` that the old code handled implicitly.`,
      fix: py`Undo the last step and redo it in smaller pieces. If the old behaviour was actually a bug, finish the refactoring first, then fix the bug in a separate, deliberate commit with its own test.`,
    },
  ],
  bestPractices: [
    'Name things for what they mean (unpaid_invoices, timeout_seconds), not their type (data, lst) — include units when they matter.',
    'Keep functions to one job at one level of detail; if the one-sentence description needs "and", split it.',
    'Handle invalid and special cases first with guard clauses, so the main path is flat.',
    'Replace magic numbers with named UPPER_SNAKE_CASE constants.',
    'Make boolean options keyword-only (def f(x, *, verbose=False)); split a flag that selects two different jobs into two functions.',
    'Give every public module, class and function a PEP 257 docstring with a one-line imperative summary.',
    'Write comments that explain why; delete comments that restate the code and commented-out code.',
    'Never refactor without tests — write characterization tests first when there are none.',
    'Keep refactorings and behaviour changes in separate commits.',
    'Let a formatter and linter enforce PEP 8 automatically; spend human attention on names and structure.',
  ],
  whenToUse: {
    use: [
      'Before adding a feature to code you find hard to understand: make the change easy first, then make the easy change.',
      'When a function has grown past one screen, takes several boolean flags, or nests ifs three or more levels deep.',
      'When you had to read a piece of code twice to understand it — rename or restructure it while you still remember what it does.',
      'Code that many people read or that changes often (shared libraries, core business rules).',
    ],
    avoid: [
      'Refactoring code with no tests and no time to write them — add tests first or leave it alone.',
      'Splitting a clear 10-line function into five 2-line functions: indirection has a reading cost too.',
      'Reformatting a whole legacy file inside a bug-fix commit — it buries the real change in noise.',
      'Throwaway scripts and one-off notebooks you will genuinely delete tomorrow.',
    ],
  },
  comparison: {
    title: 'Where should this information live?',
    headers: ['information', 'best home', 'example'],
    rows: [
      ['what a value means', 'the name', 'seconds_until_retry, not t'],
      ['what type a value has', 'a type hint', 'def total(items: list[Item]) -> float:'],
      ['what a function promises callers', 'the docstring', '"""Return the total in cents, never negative."""'],
      ['why the code does something odd', 'a comment', '# The API rejects batches over 500, so we chunk.'],
      ['that behaviour must not change', 'a test', 'assert order_total(cart) == 97.69'],
      ['what changed and why, historically', 'the commit message', 'Extract subtotal() from calc(); no behaviour change'],
    ],
    note: py`Prefer the homes higher in the table when they can do the job: names and types are checked or seen on every use, while comments can silently go stale.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'clean-code-q1',
      type: 'mcq',
      prompt: py`Which line follows PEP 8 for checking that \`user\` is missing?`,
      options: [
        { text: 'if user == None:', why: 'It usually works, but == can be overridden by a class. PEP 8 says compare singletons like None with is.' },
        'if user is None:',
        { text: 'if not user:', why: 'That is also true for 0, "", [] and other falsy values, so it means "empty or missing", not "missing".' },
        { text: 'if user is not None == False:', why: 'This is a chained comparison: (user is not None) and (None == False). The second part is always False, so the whole condition is always False.' },
      ],
      answer: 1,
      explanation: py`\`None\` is a singleton (there is only ever one \`None\` object), so identity — \`is\` — is the precise, idiomatic test. Linters flag \`== None\` as E711.`,
    },
    {
      id: 'clean-code-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def area(width, height):
    # Return the area of a rectangle.
    return width * height

def perimeter(width, height):
    """Return the perimeter of a rectangle."""
    return 2 * (width + height)

print(area.__doc__)
print(perimeter.__doc__)`,
      options: [
        { text: 'Return the area of a rectangle.\nReturn the perimeter of a rectangle.', why: 'A # comment is discarded when Python reads the source. It never becomes __doc__.' },
        'None\nReturn the perimeter of a rectangle.',
        { text: 'An AttributeError for area.__doc__', why: 'Every function has a __doc__ attribute; it is simply None when there is no docstring.' },
      ],
      answer: 1,
      explanation: py`Only a string literal that is the first statement of the body becomes the docstring. Comments are thrown away, so \`area.__doc__\` is \`None\` and \`help(area)\` shows no description.`,
    },
    {
      id: 'clean-code-q3',
      type: 'bug',
      prompt: 'Someone "cleaned up" this function with a guard clause and broke it. Click the buggy line.',
      code: py`def average_score(scores):
    """Return the mean score, or 0.0 for an empty list."""
    if scores:
        return 0.0
    return sum(scores) / len(scores)`,
      answerLine: 3,
      explanation: py`The guard is inverted: it returns \`0.0\` for every **non-empty** list, and an empty list falls through to \`sum([]) / len([])\` → \`ZeroDivisionError\`. It should be \`if not scores:\`. A single test such as \`assert average_score([80, 90]) == 85\` would have caught it immediately.`,
    },
    {
      id: 'clean-code-q4',
      type: 'fill',
      prompt: 'Make `include_header` keyword-only, and check for a missing value the PEP 8 way.',
      code: py`def export_report(rows, ___, include_header=True):
    """Return the rows as CSV text."""
    if rows ___ None:
        raise ValueError("rows is required")
    ...`,
      answer: [['*'], ['is']],
      explanation: py`A bare \`*\` makes every following parameter keyword-only, so callers must write \`include_header=False\`. \`is None\` is the identity check PEP 8 recommends for singletons.`,
    },
    {
      id: 'clean-code-q5',
      type: 'mcq',
      prompt: 'Which comment adds the most value?',
      options: [
        { text: '# increment retries by one', why: 'It repeats exactly what retries += 1 already says.' },
        { text: '# loop over orders', why: 'The for statement already says that. "What" comments are noise.' },
        '# The courier API rejects requests made within 1 s of each other, so we wait before retrying.',
        { text: '# TODO: fix', why: 'A TODO without what or why gives the next reader nothing to act on.' },
      ],
      answer: 2,
      explanation: py`Good comments record what the code cannot express: reasons, constraints, external quirks. A reader who wants to remove the wait now knows why it's there.`,
    },
    {
      id: 'clean-code-q6',
      type: 'output',
      prompt: 'Predict the output (one line).',
      code: py`def grade(score):
    if score < 0 or score > 100:
        return "invalid"
    if score >= 90:
        return "A"
    if score >= 50:
        return "pass"
    return "fail"

print(grade(95), grade(50), grade(101), grade(49))`,
      answer: 'A pass invalid fail',
      accept: ['A pass invalid fail'],
      explanation: py`Guard clauses are checked top to bottom and the first \`return\` wins: 95 → \`A\`, 50 → \`pass\` (the check is \`>=\`), 101 → \`invalid\` (caught by the first guard), 49 → falls through to \`fail\`.`,
    },
    {
      id: 'clean-code-q7',
      type: 'short',
      prompt: 'Why should you write (or check for) tests *before* refactoring a messy function, rather than after?',
      answer: py`A refactoring must not change behaviour, and tests are the only reliable way to know it didn't. Tests written before the change record what the code actually does today — including odd edge cases — so after each small step you can prove nothing changed. Tests written afterwards would be based on the new code, so they would happily confirm any behaviour you accidentally changed.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'flatten-the-arrow',
      title: 'Flatten the arrow with guard clauses',
      difficulty: 'intermediate',
      prompt: py`\`checkout_problem(user, cart)\` works, but its nested \`if\`/\`else\` blocks form an "arrow" that's hard to read. Refactor it **without changing what it returns**:

- \`None\` user → \`"not logged in"\`
- user whose \`"verified"\` is false → \`"unverified account"\`
- empty cart (an empty dict) → \`"empty cart"\`
- any quantity \`<= 0\` → \`"invalid quantity"\`
- otherwise → \`"ok"\`

The checks must keep this order (a missing user wins over an empty cart, and so on).

**Structure rule (checked by a test):** no \`if\` may be nested inside another \`if\` in \`checkout_problem\` — use guard clauses that \`return\` early.`,
      files: { 'main.py': NESTED_CHECKOUT },
      hints: [
        'Turn each condition around and handle the "bad" case first: what is the opposite of `if user is not None:`?',
        'Each guard clause is `if <problem>: return "<message>"`. Because it returns, no `else` is needed after it.',
        'The quantity check becomes `if any(quantity <= 0 for quantity in cart.values()): return "invalid quantity"`, and the function ends with `return "ok"`.',
      ],
      solution: {
        explanation: py`Each nested \`if X: ... else: return msg\` is inverted into \`if not X: return msg\`. Because every guard returns, the following code only runs when the earlier checks passed — so the nesting disappears without changing behaviour. \`all(q > 0 ...)\` becomes its negation \`any(q <= 0 ...)\` (De Morgan's law). The happy path, \`return "ok"\`, is now the last line instead of being buried four levels deep. The behaviour tests passed on the starter *and* the solution — that's what makes this a refactoring.`,
        files: { 'main.py': FLAT_CHECKOUT },
      },
      tests: [
        { name: 'a valid checkout returns "ok"', code: py`assert checkout_problem({"verified": True}, {"pen": 2, "ink": 1}) == "ok"` },
        { name: 'no user → "not logged in"', code: py`assert checkout_problem(None, {"pen": 2}) == "not logged in"` },
        { name: 'unverified user → "unverified account"', code: py`assert checkout_problem({"verified": False}, {"pen": 2}) == "unverified account"` },
        { name: 'empty cart → "empty cart"', code: py`assert checkout_problem({"verified": True}, {}) == "empty cart"` },
        { name: 'zero or negative quantity → "invalid quantity"', code: py`assert checkout_problem({"verified": True}, {"pen": 0}) == "invalid quantity"
assert checkout_problem({"verified": True}, {"pen": 1, "ink": -1}) == "invalid quantity"` },
        { name: 'checks keep their original order', code: py`assert checkout_problem(None, {}) == "not logged in"
assert checkout_problem({"verified": False}, {}) == "unverified account"` },
        { name: 'no if is nested inside another if', code: IF_DEPTH_TEST },
      ],
    },
    {
      id: 'split-the-flag',
      title: 'Split a flag argument into two functions',
      difficulty: 'intermediate',
      prompt: py`\`export(rows, flag)\` does two different jobs depending on a boolean. Split it:

1. Write \`to_csv(rows)\` → returns the header \`name,score\` followed by one \`name,score\` line per row, joined with \`"\\n"\` (no trailing newline).
2. Write \`to_table(rows)\` → one line per row: the name left-aligned in 10 characters, then the score right-aligned in 5, joined with \`"\\n"\`.
3. Give **both** functions a PEP 257 docstring whose first line ends with a period.
4. Keep \`export(rows, flag)\` working for old callers by making it simply return \`to_csv(rows)\` when \`flag\` is true and \`to_table(rows)\` otherwise.

\`rows\` is a list of \`(name, score)\` tuples — unpack them with good names instead of \`r[0]\` and \`r[1]\`.`,
      files: {
        'main.py': py`def export(rows, flag):
    if flag:
        lines = ["name,score"]
        for r in rows:
            lines.append(r[0] + "," + str(r[1]))
        return "\n".join(lines)
    else:
        lines = []
        for r in rows:
            lines.append(r[0].ljust(10) + str(r[1]).rjust(5))
        return "\n".join(lines)


def to_csv(rows):
    pass  # TODO


def to_table(rows):
    pass  # TODO


scores = [("Ada", 91), ("Ben", 78)]
print(export(scores, True))
print(export(scores, False))
`,
      },
      hints: [
        'Move each branch of export() into its own function, then make export() call them.',
        'Unpack while looping: `for name, score in rows:`. An f-string can align: `f"{name:<10}{score:>5}"`.',
        'to_csv can be `return "\\n".join(["name,score"] + [f"{name},{score}" for name, score in rows])`.',
      ],
      solution: {
        explanation: py`Each function now does exactly one job and its name says which — callers write \`to_csv(scores)\` instead of the cryptic \`export(scores, True)\`. Tuple unpacking (\`for name, score in rows\`) replaces \`r[0]\`/\`r[1]\` and documents the row shape. The f-string format specs \`<10\` and \`>5\` do the same as \`ljust(10)\` and \`rjust(5)\`. \`export\` stays as a thin wrapper so existing callers keep working; in a real codebase you might add a \`DeprecationWarning\` to it and remove it later.`,
        files: {
          'main.py': py`def to_csv(rows):
    """Return the rows as CSV text with a name,score header."""
    lines = ["name,score"] + [f"{name},{score}" for name, score in rows]
    return "\n".join(lines)


def to_table(rows):
    """Return the rows as an aligned plain-text table."""
    return "\n".join(f"{name:<10}{score:>5}" for name, score in rows)


def export(rows, flag):
    """Return CSV if flag is true, else a text table (kept for old callers)."""
    return to_csv(rows) if flag else to_table(rows)


scores = [("Ada", 91), ("Ben", 78)]
print(to_csv(scores))
print(to_table(scores))
`,
        },
      },
      tests: [
        { name: 'to_csv returns header + rows', code: py`assert to_csv([("Ada", 91), ("Ben", 78)]) == "name,score\nAda,91\nBen,78"` },
        { name: 'to_csv of no rows is just the header', code: py`assert to_csv([]) == "name,score"` },
        { name: 'to_table aligns name (10) and score (5)', code: py`assert to_table([("Ada", 91), ("Ben", 78)]) == "Ada          91\nBen          78"` },
        { name: 'both functions have a docstring ending with a period', code: py`for func in (to_csv, to_table):
    assert func.__doc__, f'{func.__name__} needs a docstring'
    assert func.__doc__.strip().splitlines()[0].endswith('.'), f'end the summary line of {func.__name__} with a period'` },
        { name: 'export still works and delegates', code: py`rows = [("Cy", 5)]
assert export(rows, True) == to_csv(rows)
assert export(rows, False) == to_table(rows)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'clean-code-definition',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does "clean code" mean to you, specifically in Python?',
      answer: 'Code whose intent is obvious to the next reader and that is safe to change: PEP 8 layout, names that reveal meaning, small single-purpose functions, flat control flow, docstrings for contracts, comments for reasons — and tests that protect behaviour.',
      explanation: py`"Clean" is about the *reader's* cost, not the writer's cleverness. In Python that means following shared conventions (PEP 8, PEP 257), using the idiomatic tool (\`enumerate\`, comprehensions, \`with\`), preferring explicit over implicit (PEP 20), and keeping tests so the code can keep improving.`,
      whyAsked: 'It reveals whether a candidate thinks about maintainability and teamwork, or only about getting code to run.',
      mistakes: ['Equating clean code with short code or one-liners', 'Only mentioning formatting (which tools handle) and nothing about names or structure', 'Forgetting tests — clean code that can\'t be changed safely isn\'t clean for long'],
      followUps: ['How do you keep a codebase clean as a team grows?', 'Can code be too "clean" — for example, too many tiny functions?', 'What does "Pythonic" add on top of general clean-code advice?'],
      modelAnswer: 'For me clean code is code the next person can understand quickly and change without fear. In Python that starts with the shared conventions — PEP 8 layout, enforced by a formatter, and PEP 257 docstrings — so nobody wastes time on style. The bigger wins are human ones: names that say what a value means, functions that do one job, guard clauses instead of deep nesting, and comments that explain why rather than what. And it has to be backed by tests, because the whole point is that we can keep refactoring safely. I also try not to overdo it — five two-line functions can be harder to follow than one clear ten-line one.',
    },
    {
      id: 'clean-code-docstring-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A colleague says "my docstring doesn\'t show up in help()". Why does `total.__doc__` print `None` here?',
      code: { lang: 'python', code: py`def total(prices):
    prices = list(prices)
    """Return the sum of prices."""
    return sum(prices)

print(total.__doc__)   # None` },
      options: ['Docstrings must use single quotes', 'The docstring must be the first statement in the function body', 'help() only shows docstrings for classes', 'The string needs a # in front of it'],
      correctOption: 1,
      answer: 'A docstring is only recognised when it is the first statement of the body. Here an assignment comes first, so the string is just an expression that is evaluated and thrown away.',
      explanation: py`The compiler looks at the first statement of a module, class or function body; if it is a string literal, that becomes \`__doc__\`. Move the string above \`prices = list(prices)\`. Linters catch this too (for example Ruff's pydocstyle rules report missing docstrings).`,
      whyAsked: 'A quick check that you know how docstrings actually work, not just that they exist.',
      mistakes: ['Thinking any triple-quoted string in a function is a docstring', 'Believing comments are stored somewhere at runtime'],
      followUps: ['What does python -OO do to docstrings?', 'What is the difference between __doc__ and inspect.getdoc()?'],
      modelAnswer: 'Python only treats a string as a docstring when it is the very first statement of the body. In this function an assignment comes first, so the triple-quoted string is just an expression statement that gets evaluated and discarded, and __doc__ stays None. The fix is to move the string to the top of the body. Related detail: running Python with -OO strips docstrings entirely, so programs should never depend on them for behaviour.',
    },
    {
      id: 'clean-code-flag-argument-review',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'In code review you see `notify(user, True, False)`. The signature is `def notify(user, by_sms, urgent)`, and `by_sms` switches between two completely different delivery code paths. What is the best change?',
      options: [
        'Add a comment at every call site explaining the booleans',
        'Split it into notify_by_email(user, *, urgent=False) and notify_by_sms(user, *, urgent=False)',
        'Replace the booleans with 1 and 0 to make them shorter',
        'Leave it — booleans are the simplest possible type',
      ],
      correctOption: 1,
      answer: 'by_sms selects two different jobs, so split the function in two; urgent is a small option on one job, so keep it but make it keyword-only.',
      explanation: py`A flag that chooses between different behaviours means the function does two things — split it, and each half becomes simpler and separately testable. A flag that tweaks one behaviour is fine if it's keyword-only, so call sites read \`notify_by_sms(user, urgent=True)\`. If a choice has more than two values, use an \`Enum\`.`,
      whyAsked: 'It tests practical judgement about API design and readability at the call site, not just rule recall.',
      mistakes: ['Saying "never use booleans" — the stdlib uses keyword-only flags like sorted(reverse=True)', 'Fixing it with comments instead of changing the API', 'Forgetting that existing callers need a migration path'],
      followUps: ['How would you migrate existing callers without breaking them?', 'When would you use an Enum instead?', 'What does a bare * do in a signature?'],
      modelAnswer: 'The positional booleans are unreadable at the call site, and by_sms is actually choosing between two different jobs, which means the function has two responsibilities. I would split it into notify_by_email and notify_by_sms. urgent is just a small option on one job, so I would keep it but make it keyword-only with a bare star, so callers have to write urgent=True. To avoid breaking existing callers I would keep the old notify for a release as a wrapper that emits a DeprecationWarning. If there were more than two delivery channels I would use an Enum rather than more booleans.',
    },
    {
      id: 'clean-code-intent-names',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Make this function reveal its intent. Rename it to `passing_students(students, pass_mark=50)` returning the names (in input order) of students whose mark is at least `pass_mark`. Add a docstring, and use no single-letter names (`_` is allowed).',
      answer: 'def passing_students(students, pass_mark=50):\n    """Return the names of students who scored at least pass_mark."""\n    return [name for name, mark in students if mark >= pass_mark]',
      explanation: py`The behaviour is identical to \`calc\`; only the *communication* changed. \`students\` and \`pass_mark\` say what the arguments are, tuple unpacking (\`name, mark\`) replaces \`x[0]\`/\`x[1]\`, and the comprehension replaces the manual accumulator loop. The docstring states the contract, including that the boundary is inclusive ("at least").`,
      starter: { files: { 'main.py': py`def calc(l, t=50):
    r = []
    for x in l:
        if x[1] >= t:
            r.append(x[0])
    return r


print(calc([("Ada", 91), ("Ben", 42), ("Cy", 50)]))
` } },
      tests: [
        { name: 'passing_students exists', code: py`assert callable(ns.get('passing_students')), 'Define a function named passing_students()'` },
        { name: 'returns names at or above 50 in order', code: py`assert passing_students([("Ada", 91), ("Ben", 42), ("Cy", 50)]) == ["Ada", "Cy"]` },
        { name: 'respects a custom pass_mark', code: py`assert passing_students([("Ada", 91), ("Ben", 42)], pass_mark=95) == []` },
        { name: 'parameters are named students and pass_mark', code: py`import inspect
assert list(inspect.signature(passing_students).parameters) == ['students', 'pass_mark']` },
        { name: 'no single-letter variable names', code: py`short = [n for n in passing_students.__code__.co_varnames if len(n) == 1 and n != '_']
assert short == [], f'rename these: {short}'` },
        { name: 'has a docstring', code: py`assert passing_students.__doc__, 'Add a docstring'` },
      ],
      solution: { files: { 'main.py': py`def passing_students(students, pass_mark=50):
    """Return the names of students who scored at least pass_mark."""
    return [name for name, mark in students if mark >= pass_mark]


print(passing_students([("Ada", 91), ("Ben", 42), ("Cy", 50)]))
` } },
      hints: ['Start with the signature: def passing_students(students, pass_mark=50):', 'Unpack each tuple in the loop: for name, mark in students:', 'A list comprehension with an if filter replaces the accumulator.'],
      whyAsked: 'Interviewers use small rename-and-tidy tasks to see whether you notice unclear names, indexing into tuples and missing documentation.',
      mistakes: ['Changing behaviour while renaming (for example > instead of >=)', 'Choosing names that describe types (lst, tup) instead of meaning', 'Writing a docstring that repeats the name ("Passing students function.")'],
      followUps: ['How would you type-annotate this function?', 'What if students were dataclass objects instead of tuples?'],
      modelAnswer: 'First I keep the behaviour fixed — mark greater than or equal to the threshold, in input order — and only change the communication. I rename the function and parameters to say what they are: passing_students, students and pass_mark. I unpack each tuple into name and mark instead of indexing, which documents the data shape, and replace the accumulator loop with a list comprehension. Finally a one-line docstring states the contract, including that the boundary is inclusive. In a real codebase I would add type hints too, like list[tuple[str, int]] in and list[str] out.',
    },
    {
      id: 'clean-code-legacy-refactor',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 6,
      question: 'You inherit a 400-line `process_payroll()` function with no tests. It is business-critical, and you must add a new tax rule next sprint. How do you approach it?',
      answer: 'Don\'t rewrite it. First write characterization tests that record its current outputs for realistic and edge-case inputs. Then refactor in small, committed, behaviour-preserving steps (extract functions, name constants, add guard clauses) until the place for the new rule is obvious. Add the tax rule as a separate, test-driven change.',
      explanation: py`The key moves: (1) find a **seam** — a place where you can call the code with controlled inputs (maybe by extracting the pure calculation away from database and file access); (2) **golden-master / characterization tests** that compare outputs before and after; (3) **tiny refactoring steps**, each followed by a test run and a commit; (4) only then **change behaviour**, test first. Prioritise refactoring the area you need to change, not the whole function. Keep refactor and feature in separate commits or PRs so reviewers and \`git bisect\` can follow.`,
      whyAsked: 'Real jobs are full of legacy code. This shows whether you can improve it safely instead of either fearing it or rewriting it recklessly.',
      mistakes: ['Proposing a full rewrite from scratch', 'Refactoring and adding the tax rule in one big change', 'Writing tests based on what the code "should" do instead of what it does', 'Planning to refactor all 400 lines before delivering anything'],
      followUps: ['What if the function writes to the database directly?', 'How do you pick inputs for characterization tests?', 'What if you discover the existing behaviour is a bug?'],
      modelAnswer: 'I would not rewrite it — a rewrite of untested, business-critical code is how payroll goes wrong. First I would get it under test: find a seam where I can call it with known inputs, possibly by extracting the pure calculation away from the database calls, and write characterization tests that record what it currently outputs for realistic employees and edge cases. Then I would refactor in small steps around the area I need to change — extract functions, name the magic numbers, add guard clauses — running the tests and committing after each step. Once the right place for the new rule is obvious, I would add it test-first as a separate change. If I found an existing bug, I would flag it and fix it deliberately in its own commit rather than silently changing payroll numbers.',
    },
    {
      id: 'clean-code-team-standards',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You lead a team of eight whose codebase is getting messier every month. What systems would you put in place so code stays clean without endless style arguments?',
      answer: 'Automate everything mechanical (formatter, linter, type checker, tests) in pre-commit and CI with one shared config; keep human review for design, naming and tests; agree a short written standard; make small continuous refactoring part of normal work; and track hotspots instead of scheduling big rewrites.',
      explanation: py`Layers that work in practice: a formatter (Ruff format/Black) ends whitespace debates; a linter with an agreed rule set catches smells; a type checker documents and checks interfaces; CI blocks merges that fail. Code review checklists focus on intent: names, function size, error handling, tests. Refactoring is budgeted into features ("make the change easy, then make the easy change") and the Boy Scout rule. Introduce strict rules gradually on legacy code (only on changed files, or with a baseline) so the team isn't buried in warnings. See [code quality tools](lesson:code-quality-tools).`,
      whyAsked: 'Senior roles are judged on how they raise the quality of a whole team\'s output, not just their own code.',
      mistakes: ['Relying on code review alone to catch style issues', 'Turning on every lint rule at once on a legacy codebase', 'Scheduling a "refactoring sprint" instead of continuous improvement', 'Writing a 30-page style guide nobody reads'],
      followUps: ['How do you introduce a linter to a codebase with thousands of existing violations?', 'What would you put on a code review checklist?', 'How do you measure whether quality is improving?'],
      modelAnswer: 'I would separate what machines can enforce from what needs judgement. Formatting, linting, type checking and tests run automatically — locally through pre-commit and again in CI with the same configuration — so nobody argues about quotes or spacing in review. For a legacy codebase I would roll rules out gradually, for example only on changed files, so the signal is not drowned in old warnings. Human review then focuses on names, responsibilities, error handling and whether the tests prove the behaviour. Finally I would make refactoring continuous: small improvements as part of each feature, and extra attention for the files that change most often, rather than a big rewrite that never gets scheduled.',
    },
  ],

  takeaways: [
    'Code is read far more than it is written: optimise for the next reader, and let tools enforce PEP 8 layout.',
    'The Zen of Python (import this) gives tie-breakers: explicit over implicit, flat over nested, readability counts.',
    'Names should reveal meaning and units; replace magic numbers with named constants.',
    'Small functions that do one job, plus guard clauses for special cases, keep the main path flat and obvious.',
    'Avoid positional boolean flags: split two-job functions, and make small options keyword-only with *.',
    'Docstrings (PEP 257) state the contract and must be the first statement; comments explain why, not what.',
    'Refactoring means changing structure without changing behaviour — pin behaviour with (characterization) tests first, then move in small, committed steps.',
  ],
}
