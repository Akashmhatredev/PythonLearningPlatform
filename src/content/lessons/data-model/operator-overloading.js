// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const MONEY = py`from functools import total_ordering


@total_ordering
class Money:
    """An amount in whole cents, so there are no float rounding errors."""

    def __init__(self, cents, currency="EUR"):
        self.cents = cents
        self.currency = currency

    def __repr__(self):
        return f"Money({self.cents}, {self.currency!r})"

    def __str__(self):
        return f"{self.cents / 100:.2f} {self.currency}"

    def _same_currency(self, other):
        if other.currency != self.currency:
            raise ValueError(f"cannot mix {self.currency} and {other.currency}")

    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented           # let Python try other.__radd__
        self._same_currency(other)
        return Money(self.cents + other.cents, self.currency)

    def __radd__(self, other):
        if other == 0:                      # sum() starts from 0
            return self
        return NotImplemented

    def __mul__(self, times):
        if not isinstance(times, int):
            return NotImplemented           # Money * 1.5 has no clear meaning
        return Money(self.cents * times, self.currency)

    __rmul__ = __mul__                      # so 3 * price works as well

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return (self.cents, self.currency) == (other.cents, other.currency)

    def __lt__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        self._same_currency(other)
        return self.cents < other.cents


coffee = Money(350)
cake = Money(425)

print(coffee * 2 + cake)                    # __mul__, then __add__
print(3 * coffee)                           # int says no, so Money.__rmul__
print(sum([coffee, cake, Money(100)]))      # 0 + coffee -> Money.__radd__
print(sorted([cake, coffee, Money(100)]))   # sorted() only needs <
print(cake > coffee, cake <= coffee)        # > and <= come from total_ordering

try:
    coffee + 5
except TypeError as error:
    print("TypeError:", error)
`

export default {
  id: 'operator-overloading',
  title: 'Operator overloading & rich comparisons',
  summary: 'Define __add__, __mul__, __lt__ and friends so +, *, < and sorted() work on your own types — returning NotImplemented whenever you should let the other operand answer.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['special-methods'],
  related: ['special-methods', 'container-protocols', 'attribute-access', 'functools', 'numbers-and-math', 'booleans-and-comparisons', 'list-operations', 'dataclasses', 'mutability-and-copying', 'polymorphism-and-duck-typing', 'map-filter-reduce', 'pathlib'],
  tags: ['operator overloading', 'dunder', 'data model', '__add__', '__radd__', '__iadd__', '__mul__', '__rmul__', '__neg__', '__lt__', 'rich comparisons', 'total_ordering', 'NotImplemented', 'reflected operands', 'in-place operators', 'Money', 'Vector'],
  apis: [
    { name: '__add__(self, other) / __radd__ / __iadd__', summary: 'a + b calls a.__add__(b); if that returns NotImplemented, b.__radd__(a); a += b tries a.__iadd__(b) first, then falls back to __add__.' },
    { name: '__sub__, __mul__, __truediv__, __floordiv__, __mod__, __pow__, __matmul__', summary: 'The other binary arithmetic operators: -, *, /, //, %, ** and @. Each has an r-version (reflected) and an i-version (in-place).' },
    { name: '__neg__, __pos__, __abs__', summary: 'Unary minus (-a), unary plus (+a) and abs(a).' },
    { name: '__lt__, __le__, __gt__, __ge__, __eq__, __ne__', summary: 'Rich comparisons for <, <=, >, >=, ==, !=. The reflection of a < b is b > a.' },
    { name: 'functools.total_ordering', summary: 'Class decorator: define __eq__ and one of __lt__/__le__/__gt__/__ge__, and it fills in the other three.' },
    { name: 'NotImplemented', summary: 'Return it (never raise it) from a binary special method to say "I can\'t handle this operand type — ask the other side".' },
    { name: 'operator module', summary: 'Function versions of operators (operator.add, operator.lt, operator.mul) that follow exactly the same dispatch rules.' },
  ],
  docs: [
    { label: 'Data model — emulating numeric types', url: 'https://docs.python.org/3/reference/datamodel.html#emulating-numeric-types' },
    { label: 'Data model — rich comparison methods', url: 'https://docs.python.org/3/reference/datamodel.html#object.__lt__' },
    { label: 'functools.total_ordering', url: 'https://docs.python.org/3/library/functools.html#functools.total_ordering' },
    { label: 'numbers — implementing the arithmetic operations', url: 'https://docs.python.org/3/library/numbers.html#implementing-the-arithmetic-operations' },
    { label: 'operator — standard operators as functions', url: 'https://docs.python.org/3/library/operator.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [special methods](lesson:special-methods) you saw that \`len(x)\` and \`x == y\` are really method calls. Operators work the same way. \`a + b\` is \`a.__add__(b)\`, \`a * b\` is \`a.__mul__(b)\`, \`a < b\` is \`a.__lt__(b)\`. Even \`1 + 2\` is \`int.__add__\`, and \`"ab" * 3\` is \`str.__mul__\`.`,
    py`**Operator overloading** means giving your own class those methods, so its objects can be added, multiplied, negated or sorted with the normal symbols. A \`Money\` class can then write \`price * 3 + delivery\`; a \`Vector2\` in a game can write \`position + velocity * dt\`.`,
    py`The interesting part isn't the methods themselves — it's the **negotiation** between the two operands. When \`a\` doesn't know how to add \`b\`, it returns a special value, \`NotImplemented\`, and Python asks \`b\` instead via a *reflected* method such as \`__radd__\`. Getting that handshake right is what separates a class that "sort of works" from one that works with \`sum()\`, \`sorted()\`, \`max()\` and other people's types.`,
  ],
  why: [
    py`Code is read far more often than it is written. Compare \`total = subtotal.add(shipping).multiply(quantity)\` with \`total = (subtotal + shipping) * quantity\`. For things that genuinely behave like numbers — amounts of money, durations, vectors, fractions, matrices — operators make code read like the maths it represents.`,
    py`Operators also unlock the standard library. \`sum()\` needs \`+\` (and \`__radd__\`, as you'll see). \`sorted()\`, \`min()\`, \`max()\`, \`heapq\` and \`bisect\` need \`<\`. Define two or three methods and a whole toolbox starts working with your type.`,
    py`Finally, the standard library itself is built this way: \`Fraction\`, \`Decimal\`, \`datetime\` arithmetic (\`deadline - now\`), set algebra (\`a | b\`, \`a & b\`) and \`pathlib\`'s \`Path("data") / "scores.csv"\` are all ordinary classes with operator methods. Knowing the protocol lets you read — and write — that kind of API.`,
  ],
  eli15: [
    py`Think of \`+\` as a question Python asks out loud: "can someone add these two things?" First it asks the thing on the **left**: "coffee, can you add a cake to yourself?" If the left one says "no idea, not my job" (that's \`NotImplemented\`), Python turns to the thing on the **right**: "cake, can *you* handle being added to a coffee?" Only if both shrug do you get an error.`,
    py`That's why \`3 * price\` can work even though the number \`3\` has never heard of your \`Money\` class: \`3\` shrugs, and \`Money\` steps in through its "right-hand" method \`__rmul__\`.`,
    py`Comparisons work the same way: \`a < b\` asks \`a\` first, and if \`a\` shrugs Python flips it around and asks \`b\` "are you **greater** than \`a\`?".`,
  ],
  analogy: {
    title: 'Two shop assistants and a currency exchange',
    body: [
      py`You walk up to a counter holding euros and a bag of pesos and ask, "can you add these up?" The first assistant (the left operand) only handles euros, so she says "not my department" — she doesn't throw you out, she just steps aside. The second assistant (the right operand) does handle mixed currencies, so he does the sum. If neither can, the manager (Python) tells you it's not possible — that's the \`TypeError\`.`,
      py`Saying "not my department" is returning \`NotImplemented\`. Throwing you out of the shop is raising an exception yourself — rude, because the second assistant never got the chance to help.`,
    ],
    mapping: [
      ['asking the first assistant', 'a.__add__(b) — the left operand goes first'],
      ['"not my department"', 'return NotImplemented'],
      ['asking the second assistant', 'b.__radd__(a) — the reflected method'],
      ['the manager saying "impossible"', 'TypeError: unsupported operand type(s) for +'],
      ['throwing you out immediately', 'raising TypeError inside __add__ — the other side never gets a say'],
      ['a senior colleague who always goes first', 'a subclass on the right whose reflected method overrides the parent’s gets priority'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch +, * and the reflected __rmul__',
    props: {
      code: py`class Vector2:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        if not isinstance(other, Vector2):
            return NotImplemented
        return Vector2(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vector2(self.x * k, self.y * k)

    __rmul__ = __mul__

    def __repr__(self):
        return f"Vector2({self.x}, {self.y})"


position = Vector2(1, 2)
velocity = Vector2(3, 0)
position = position + velocity
step = 2 * velocity
print(position, step)
`,
      notes: {
        16: '`__rmul__ = __mul__` makes the class attribute `__rmul__` refer to the very same function. Multiplying by a number is commutative, so one implementation serves both sides.',
        24: '`position + velocity` calls `Vector2.__add__` with `self = position`. It builds and returns a **new** Vector2 — neither operand is changed.',
        25: '`2 * velocity`: Python first asks `int.__mul__(2, velocity)`, which returns `NotImplemented` (C code, so the tracer can\'t show it). Then it calls `velocity.__rmul__(2)` — watch `self` be the vector and `k` be 2.',
        26: '`print` uses `__repr__` here, because Vector2 has no `__str__`.',
      },
    },
    alt: 'A step-by-step trace. Two Vector2 objects are created. position + velocity enters __add__, which creates a third Vector2(4, 2) and rebinds position to it. 2 * velocity enters __mul__ through the __rmul__ alias with self as the velocity vector and k equal to 2, returning Vector2(6, 0). The final print shows Vector2(4, 2) Vector2(6, 0).',
    caption: py`Watch the frames: \`+\` lands in \`__add__\`, and \`2 * velocity\` lands in the same \`__mul__\` function through \`__rmul__\` — with the vector as \`self\`, even though it was on the right.`,
  },
  syntax: [
    py`#### The arithmetic methods`,
    { code: py`class Vector2:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):        # self + other
        if not isinstance(other, Vector2):
            return NotImplemented
        return Vector2(self.x + other.x, self.y + other.y)

    def __sub__(self, other):        # self - other
        if not isinstance(other, Vector2):
            return NotImplemented
        return Vector2(self.x - other.x, self.y - other.y)

    def __mul__(self, k):            # self * k
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vector2(self.x * k, self.y * k)

    def __rmul__(self, k):           # k * self  (reflected)
        return self.__mul__(k)

    def __neg__(self):               # -self
        return Vector2(-self.x, -self.y)

    def __abs__(self):               # abs(self)
        return (self.x ** 2 + self.y ** 2) ** 0.5`, lang: 'python', title: 'a small vector type' },
    py`Every binary operator has three methods: the normal one, a **reflected** \`r\` version (called on the *right* operand) and an **in-place** \`i\` version (for \`+=\`, \`*=\` …):`,
    py`| operator | normal | reflected | in-place |
|---|---|---|---|
| \`+\` | \`__add__\` | \`__radd__\` | \`__iadd__\` |
| \`-\` | \`__sub__\` | \`__rsub__\` | \`__isub__\` |
| \`*\` | \`__mul__\` | \`__rmul__\` | \`__imul__\` |
| \`/\` | \`__truediv__\` | \`__rtruediv__\` | \`__itruediv__\` |
| \`//\` | \`__floordiv__\` | \`__rfloordiv__\` | \`__ifloordiv__\` |
| \`%\` | \`__mod__\` | \`__rmod__\` | \`__imod__\` |
| \`**\` | \`__pow__\` | \`__rpow__\` | \`__ipow__\` |
| \`@\` | \`__matmul__\` | \`__rmatmul__\` | \`__imatmul__\` |
| \`&\` \`^\` \`<<\` \`>>\` | \`__and__\` \`__xor__\` \`__lshift__\` \`__rshift__\` | \`__rand__\` … | \`__iand__\` … |`,
    py`The bitwise *or* operator follows the same pattern with \`__or__\`, \`__ror__\` and \`__ior__\`. Unary operators have one method each: \`-a\` → \`__neg__\`, \`+a\` → \`__pos__\`, \`~a\` → \`__invert__\`, \`abs(a)\` → \`__abs__\`.`,
    py`#### The rules`,
    py`- Return a **new object**; never change \`self\` or \`other\` inside \`__add__\`, \`__mul__\`, etc. (\`a + b\` must not modify \`a\`.)
- If you don't support \`other\`'s type, **return** \`NotImplemented\`. Don't raise, don't return \`None\`.
- \`__iadd__\` and friends *may* modify \`self\` in place — and must then **return \`self\`**. Leave them out for immutable types; Python falls back to \`__add__\`.
- Reflected methods are only tried when the operands are of **different** types.`,
    { callout: 'warn', title: 'NotImplemented is not NotImplementedError', text: py`\`NotImplemented\` is a special value you **return** from operator methods ("try the other operand"). \`NotImplementedError\` is an exception you **raise** in methods a subclass must override ("this isn't written yet"). Writing \`raise NotImplemented\` gives \`TypeError: exceptions must derive from BaseException\`.` },
    py`#### Rich comparisons`,
    py`| you write | Python calls | reflection if that returns \`NotImplemented\` |
|---|---|---|
| \`a < b\` | \`a.__lt__(b)\` | \`b.__gt__(a)\` |
| \`a <= b\` | \`a.__le__(b)\` | \`b.__ge__(a)\` |
| \`a > b\` | \`a.__gt__(b)\` | \`b.__lt__(a)\` |
| \`a >= b\` | \`a.__ge__(b)\` | \`b.__le__(a)\` |
| \`a == b\` | \`a.__eq__(b)\` | \`b.__eq__(a)\`, then identity |
| \`a != b\` | \`a.__ne__(b)\` | \`b.__ne__(a)\`; default inverts \`__eq__\` |`,
    py`Python does **not** work out \`<=\` from \`<\` and \`==\` on its own (only \`!=\` is derived from \`==\`). Writing all four ordering methods by hand is tedious, so the standard library offers a shortcut:`,
    { code: py`from functools import total_ordering


@total_ordering
class Grade:
    def __init__(self, score):
        self.score = score

    def __eq__(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.score == other.score

    def __lt__(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.score < other.score


print(Grade(70) <= Grade(70), Grade(90) > Grade(80))   # True True
print(max([Grade(55), Grade(91), Grade(78)]).score)     # 91`, lang: 'python', title: 'total_ordering fills in <=, > and >=' },
    { callout: 'tip', title: 'sorted() only needs <', text: py`\`sorted()\`, \`list.sort()\`, \`min()\` and \`max()\` compare items with \`<\` only, so a lone \`__lt__\` is enough to sort. Still use \`total_ordering\` (or \`@dataclass(order=True)\`) so \`<=\` and \`>\` don't surprise the next person.` },
  ],
  walkthrough: {
    title: 'Reading the Money class line by line',
    lang: 'python',
    code: MONEY,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [8, 10], text: py`Money is stored in whole **cents** as an \`int\`. Floats can't represent most decimal fractions exactly (\`0.1 + 0.2\` isn't \`0.3\`), so serious money code uses integer cents or \`decimal.Decimal\` — see [numbers](lesson:numbers-and-math).` },
      { lines: [18, 20], text: py`Adding euros to dollars isn't a type problem — both are \`Money\` — it's a *value* problem, so it raises \`ValueError\` instead of returning \`NotImplemented\`.` },
      { lines: [22, 26], text: py`\`__add__\` returns \`NotImplemented\` for non-Money operands and otherwise builds a **new** \`Money\`. Neither \`self\` nor \`other\` changes.` },
      { lines: [28, 31], text: py`\`sum()\` starts its running total at \`0\`, so the first step is \`0 + coffee\`. \`int.__add__\` returns \`NotImplemented\`, Python calls \`coffee.__radd__(0)\`, and we return \`self\` unchanged. Any other left operand still gets \`NotImplemented\`.` },
      { lines: [33, 38], text: py`\`__mul__\` accepts whole numbers only — what would \`Money * 1.5\` round to? \`__rmul__ = __mul__\` reuses the same function for \`3 * coffee\`, because multiplication by a number is commutative.` },
      { lines: [40, 49], text: py`\`__eq__\` and \`__lt__\` are all that \`@total_ordering\` (line 4) needs to generate \`<=\`, \`>\` and \`>=\`. (Defining \`__eq__\` also made Money unhashable — fine here; see [special methods](lesson:special-methods).)` },
      { lines: [55, 57], text: py`\`coffee * 2 + cake\` → \`__mul__\` then \`__add__\`. \`3 * coffee\` goes through \`__rmul__\`. \`sum([...])\` relies on \`__radd__\` for its first step and \`__add__\` for the rest.` },
      { lines: [58, 59], text: py`\`sorted()\` uses only \`<\`. \`cake > coffee\` and \`cake <= coffee\` work because \`total_ordering\` filled in \`__gt__\` and \`__le__\`.` },
      { lines: [61, 64], text: py`\`coffee + 5\`: \`Money.__add__\` returns \`NotImplemented\`, then \`int\` has no idea what to do with Money either, so Python raises \`TypeError: unsupported operand type(s) for +: 'Money' and 'int'\` — a clear message we got for free.` },
    ],
  },
  playground: {
    title: 'Café till with Money',
    objective: 'Run it, connect each output line to the special methods involved, then extend Money with new operators.',
    files: { 'main.py': MONEY },
    expected: py`Six lines:

\`\`\`text
11.25 EUR
10.50 EUR
8.75 EUR
[Money(100, 'EUR'), Money(350, 'EUR'), Money(425, 'EUR')]
True False
TypeError: unsupported operand type(s) for +: 'Money' and 'int'
\`\`\``,
    experiments: [
      {
        id: 'subtract',
        task: py`Add a \`__sub__\` method so \`cake - coffee\` returns \`Money(75, 'EUR')\`. Follow the same pattern as \`__add__\`: \`NotImplemented\` for non-Money, a currency check, and a **new** object.`,
        hint: py`Copy \`__add__\`, rename it to \`__sub__\` and change \`+\` to \`-\` in the return line.`,
        tests: [
          { name: 'cake - coffee == Money(75)', code: py`assert cake - coffee == Money(75)` },
          { name: 'subtracting a plain number raises TypeError', code: py`with raises(TypeError):
    coffee - 5` },
          { name: 'currencies are still checked', code: py`with raises(ValueError):
    coffee - Money(100, "USD")` },
          { name: 'the operands are not changed', code: py`a, b = Money(500), Money(200)
a - b
assert a == Money(500) and b == Money(200)` },
        ],
        explain: py`Same recipe as \`+\`. Because you returned \`NotImplemented\` for the int, Python asked \`int.__rsub__\`, which also declined, so you got the standard \`TypeError\` message without writing it.`,
      },
      {
        id: 'plus-equals',
        task: py`At the very end of the file, add a running total with \`+=\`:

\`\`\`python
total = Money(0)
for item in [coffee, cake, Money(100)]:
    total += item
print(total)
\`\`\`

Money has no \`__iadd__\`. Predict whether this works before you run it.`,
        hint: py`Paste the four lines after the \`try\`/\`except\` block, with no indentation on the first and last lines.`,
        tests: [
          { name: 'total is Money(875)', code: py`assert ns.get('total') == Money(875), 'Build total with += in a loop'` },
          { name: 'the last printed line is 8.75 EUR', code: py`assert output.splitlines()[-1] == "8.75 EUR"` },
        ],
        explain: py`With no \`__iadd__\`, \`total += item\` falls back to \`total = total + item\`: \`__add__\` builds a new Money and the name \`total\` is re-bound to it. That's exactly what an *immutable* value should do — like \`int\` and \`str\`, Money never changes in place.`,
      },
      {
        id: 'sum-start',
        task: py`Delete the whole \`__radd__\` method and run: \`sum()\` now crashes. Fix the \`sum([...])\` line **without** bringing \`__radd__\` back, by giving \`sum()\` a starting value.`,
        hint: py`\`sum(iterable, start)\` uses \`start\` instead of \`0\` for the first addition: \`sum([...], Money(0))\`.`,
        tests: [
          { name: '__radd__ was removed', code: py`assert '__radd__' not in Money.__dict__, 'Delete the __radd__ method'` },
          { name: 'the sum still prints 8.75 EUR', code: py`assert output.splitlines()[2] == "8.75 EUR"` },
        ],
        explain: py`\`sum()\` computes \`start + first + second + …\` with \`start=0\` by default. Without \`__radd__\`, \`0 + coffee\` has no taker: \`TypeError: unsupported operand type(s) for +: 'int' and 'Money'\`. Passing \`Money(0)\` as the start makes every step \`Money + Money\`. Supporting \`0\` in \`__radd__\` is still kinder to users — they won't need to know this trick.`,
      },
      {
        id: 'currency-mismatch',
        task: py`Add \`print(coffee + Money(100, "USD"))\` at the end and run. Read the error, then remove the line. Why is this a \`ValueError\` and not a \`TypeError\` like \`coffee + 5\`?`,
        explain: py`\`TypeError\` (via \`NotImplemented\`) means "these *types* can't be combined". Both operands here *are* Money — the type is fine, but the *values* are incompatible, which is what \`ValueError\` is for. Returning \`NotImplemented\` here would be wrong: it would invite the other operand to try, and produce a misleading message.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How Python evaluates a + b',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'expr', label: 'a + b', note: 'what you write', x: 100, y: 170, tone: 'yellow' },
        { id: 'add', label: 'a.__add__(b)', note: 'left operand first', x: 360, y: 80, tone: 'blue' },
        { id: 'radd', label: 'b.__radd__(a)', note: 'only if types differ', x: 360, y: 260, tone: 'blue' },
        { id: 'result', label: 'result', note: 'any value but NotImplemented', x: 640, y: 80 },
        { id: 'error', label: 'TypeError', note: 'unsupported operand type(s)', x: 640, y: 260, tone: 'red' },
      ],
      edges: [
        { from: 'expr', to: 'add', label: 'try' },
        { from: 'add', to: 'result', label: 'value' },
        { from: 'add', to: 'radd', label: 'NotImplemented' },
        { from: 'radd', to: 'result', label: 'value' },
        { from: 'radd', to: 'error', label: 'NotImplemented' },
      ],
      steps: [
        { focus: ['expr'], text: py`Python sees \`a + b\`. The same steps run for \`1 + 2\`, \`"ab" + "c"\` and \`Money + Money\` — built-in types just implement their methods in C.` },
        { focus: ['expr', 'add'], edges: ['expr->add'], text: py`It asks the **left** operand first: \`type(a).__add__(a, b)\`. (Like all special methods, it's looked up on the class.)` },
        { focus: ['add', 'result'], edges: ['add->result'], text: py`If \`__add__\` returns any normal value, that's the answer. Done — \`b\` is never consulted.` },
        { focus: ['add', 'radd'], edges: ['add->radd'], text: py`If \`a\` has no \`__add__\`, or it returns \`NotImplemented\`, and \`b\` is a different type, Python tries the **reflected** method \`b.__radd__(a)\`. Example: \`sum()\` starting at \`0\` — \`int.__add__(0, coffee)\` declines, so \`coffee.__radd__(0)\` runs.` },
        { focus: ['radd', 'result'], edges: ['radd->result'], text: py`If \`__radd__\` returns a value, that's the answer.` },
        { focus: ['radd', 'error'], edges: ['radd->error'], text: py`If both sides decline, Python raises \`TypeError: unsupported operand type(s) for +: 'A' and 'B'\`. You never need to raise this yourself.` },
        { focus: ['radd'], text: py`One twist: if \`type(b)\` is a **subclass** of \`type(a)\` and overrides \`__radd__\`, Python calls \`b.__radd__(a)\` *first*. That lets a more specialised type take control of mixed operations with its parent.` },
      ],
    },
    alt: 'Flow diagram for a + b. Python first calls a.__add__(b). If it returns a value, that is the result. If it returns NotImplemented and the operands are of different types, Python calls b.__radd__(a). If that returns a value, it is the result; if it also returns NotImplemented, Python raises TypeError: unsupported operand type(s).',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Built-in types play by the same rules as your classes. You can watch an \`int\` decline:`,
      { code: py`print((3).__mul__([1, 2]))   # NotImplemented: int doesn't know lists
print(3 * [1, 2])            # [1, 2, 1, 2, 1, 2]: list.__rmul__ stepped in
print([1, 2] * 3)            # [1, 2, 1, 2, 1, 2]: list.__mul__ directly`, lang: 'python', title: 'int and list negotiating' },
      py`So "operator overloading" isn't a special feature bolted on for advanced users — it's *how every operator in Python works*. Your class just joins in.`,
    ],
    technical: [
      py`**The full algorithm for \`a + b\`:**`,
      py`1. If \`type(b)\` is a proper subclass of \`type(a)\` and provides a *different* \`__radd__\`, call \`b.__radd__(a)\` first.
2. Otherwise call \`type(a).__add__(a, b)\`.
3. If that's missing or returns \`NotImplemented\`, and the types differ, call \`type(b).__radd__(b, a)\`.
4. If everything declined, raise \`TypeError\`.`,
      py`**In-place operators.** \`x += y\` is compiled as roughly \`x = type(x).__iadd__(x, y)\` if \`__iadd__\` exists, otherwise \`x = x + y\` (the full algorithm above). Notice the **assignment always happens** — the result is bound back to \`x\`. That's why \`__iadd__\` must return \`self\`, and it explains a famous puzzle:`,
      { code: py`scores = ([90, 85],)
try:
    scores[0] += [70]          # list.__iadd__ mutates the list... then tuple item assignment fails
except TypeError as error:
    print(error)               # 'tuple' object does not support item assignment
print(scores)                  # ([90, 85, 70],) — the list changed anyway!`, lang: 'python', title: 'the tuple += puzzle' },
      py`**Comparisons reflect differently.** There's no \`__rlt__\`. The reflection of \`a < b\` is \`b > a\`, so Python tries \`b.__gt__(a)\`. For \`==\` and \`!=\`, if both sides decline, Python falls back to identity instead of raising. Chained comparisons \`a < b < c\` mean \`a < b and b < c\` (with \`b\` evaluated once).`,
      py`**Rich comparisons may return anything.** The language doesn't force \`__lt__\` to return a \`bool\`; \`if\` then calls \`bool()\` on whatever came back. Libraries use this deliberately — NumPy's \`array == other\` returns an array of booleans, and SQLAlchemy's \`User.age > 18\` returns an SQL expression object. Your own value types should return plain booleans.`,
      py`**\`total_ordering\` mechanics.** Given \`__eq__\` and, say, \`__lt__\`, it adds \`__le__\` as "\`a < b or a == b\`", \`__gt__\` as "not \`a < b\` and not \`a == b\`", and so on, passing \`NotImplemented\` through. The documentation notes the derived methods are slower and give deeper tracebacks than hand-written ones; in hot code, write all four.`,
      { callout: 'note', title: 'CPython detail', text: py`\`a + b\` compiles to a single \`BINARY_OP\` bytecode instruction no matter what \`a\` and \`b\` are. Since CPython 3.11 the *specialising adaptive interpreter* rewrites such instructions at runtime into fast versions for common cases (two ints, two floats, two strs). For your class it calls the slot that wraps \`__add__\` — a full Python function call, so user-defined arithmetic is noticeably slower than built-in arithmetic. Other implementations, like PyPy's JIT, optimise differently. Try \`import dis; dis.dis("a + b")\` to see the instruction.` },
    ],
    production: [
      py`**Overload only what reads like maths.** Good candidates: money, durations, vectors, matrices, fractions, units of measure, sets of permissions (\`|\`, \`&\`), and query/path builders where the symbol has a widely understood meaning (\`Path("logs") / "app.log"\`). If a newcomer would have to look up what \`order * user\` means, use a named method instead.`,
      py`**Keep value types immutable.** Operators that return new objects compose safely: \`a + b\` never surprises another variable that points at \`a\`. Implement \`__iadd__\` only for mutable containers where in-place update is the point (like \`list\`, or \`collections.Counter\`).`,
      py`**Be strict about types, explicit about edge cases.** Money shouldn't silently mix currencies or accept floats. Division of money needs a rounding policy, so an explicit \`allocate(3)\` method that returns parts summing exactly to the total beats a \`__truediv__\` that quietly loses a cent.`,
      py`**Type hints.** Annotate \`def __add__(self, other: "Money") -> "Money":\` — type checkers know that \`NotImplemented\` is allowed as a return value of binary dunders. For subclass-friendly returns, \`typing.Self\` (3.11+) helps. See [type hints](lesson:type-hints).`,
      py`**Performance.** Each overloaded operator is a Python-level call. For heavy numeric work (millions of vector operations), use array libraries such as NumPy, which overload operators to work on whole arrays at once in C. Measure before optimising — see [profiling](lesson:profiling).`,
      { code: py`import numpy as np                     # third-party: not available in the playground

prices = np.array([3.5, 4.25, 1.0])
print(prices * 2)                      # [7.  8.5 2. ]  — one operator, whole array
print(prices > 2)                      # [ True  True False] — == and > return arrays!
# if prices > 2: ...                   # ValueError: truth value of an array ... is ambiguous`, lang: 'python', static: true, title: 'NumPy: operator overloading at scale (static example)' },
    ],
  },
  mistakes: [
    {
      title: 'Raising TypeError instead of returning NotImplemented',
      wrong: { code: py`class Money:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        if not isinstance(other, Money):
            raise TypeError("can only add Money")   # slams the door
        return Money(self.cents + other.cents)`, lang: 'python' },
      right: { code: py`class Money:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented                   # lets other.__radd__ try
        return Money(self.cents + other.cents)`, lang: 'python' },
      explanation: py`Raising stops the negotiation: a type from another library whose \`__radd__\` *does* understand Money never gets asked. Return \`NotImplemented\` and Python produces the standard \`TypeError\` anyway when nobody can help.`,
    },
    {
      title: 'Forgetting __radd__, so sum() crashes',
      wrong: { code: py`total = sum([Money(350), Money(425)])
# TypeError: unsupported operand type(s) for +: 'int' and 'Money'`, lang: 'python', static: true },
      right: { code: py`class Money:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return Money(self.cents + other.cents)

    def __radd__(self, other):
        if other == 0:          # the 0 that sum() starts with
            return self
        return NotImplemented


total = sum([Money(350), Money(425)])`, lang: 'python' },
      explanation: py`\`sum()\` begins with \`0 + first_item\`. Either support \`0\` in \`__radd__\`, or call \`sum(items, Money(0))\` with an explicit start.`,
    },
    {
      title: 'Mutating self inside __add__',
      wrong: { code: py`class Wallet:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        self.cents += other.cents      # changes the left operand!
        return self`, lang: 'python' },
      right: { code: py`class Wallet:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        if not isinstance(other, Wallet):
            return NotImplemented
        return Wallet(self.cents + other.cents)   # a brand-new object`, lang: 'python' },
      explanation: py`\`together = mine + yours\` must leave \`mine\` alone. Nobody expects \`x + 1\` to change \`x\`. In-place updates belong in \`__iadd__\`, and only for types meant to be mutable.`,
    },
    {
      title: '__iadd__ that forgets to return self',
      wrong: { code: py`class Basket:
    def __init__(self):
        self.items = []

    def __iadd__(self, item):
        self.items.append(item)        # returns None implicitly


basket = Basket()
basket += "apples"                     # basket is now None!`, lang: 'python' },
      right: { code: py`class Basket:
    def __init__(self):
        self.items = []

    def __iadd__(self, item):
        self.items.append(item)
        return self


basket = Basket()
basket += "apples"`, lang: 'python' },
      explanation: py`\`basket += x\` means \`basket = basket.__iadd__(x)\`. Whatever \`__iadd__\` returns is bound to the name — \`None\` if you forget the \`return\`. The *next* \`+=\` then fails with \`TypeError: unsupported operand type(s) for +=: 'NoneType' and 'str'\`, far from the real bug.`,
    },
    {
      title: 'Defining only __lt__ and using <=',
      wrong: { code: py`class Grade:
    def __init__(self, score):
        self.score = score

    def __lt__(self, other):
        return self.score < other.score


print(Grade(70) <= Grade(80))   # TypeError: '<=' not supported ...`, lang: 'python' },
      right: { code: py`from functools import total_ordering


@total_ordering
class Grade:
    def __init__(self, score):
        self.score = score

    def __eq__(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.score == other.score

    def __lt__(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.score < other.score


print(Grade(70) <= Grade(80))   # True`, lang: 'python' },
      explanation: py`Python never combines \`<\` and \`==\` into \`<=\` for you. \`@total_ordering\` does, as long as you give it \`__eq__\` and one ordering method. \`@dataclass(order=True)\` is another option when field-by-field ordering is what you want.`,
    },
    {
      title: 'Overloading an operator with a surprising meaning',
      wrong: { code: py`report + "pdf"           # export? append text? concatenate files?
user * 3                 # ???
order - customer         # remove the customer from the order?`, lang: 'python', static: true },
      right: { code: py`report.export("pdf")
order.remove_customer(customer)`, lang: 'python', static: true },
      explanation: py`Operators carry expectations from maths: \`+\` combines like with like, \`a + b == b + a\` usually holds, nothing gets mutated. If those expectations don't fit, a well-named method is clearer. \`pathlib\`'s \`/\` is a rare widely accepted exception, because it looks exactly like a path separator.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'int' and 'Money'`,
      cause: py`Usually \`sum(list_of_money)\`: the hidden starting \`0\` is on the left and Money has no \`__radd__\` that accepts it.`,
      fix: py`Add \`__radd__\` that returns \`self\` when \`other == 0\`, or call \`sum(items, Money(0))\`.`,
    },
    {
      symptom: py`TypeError: '<=' not supported between instances of 'Grade' and 'Grade'`,
      cause: py`The class defines \`__lt__\` (maybe \`__eq__\`) but not \`__le__\`. Python doesn't derive it.`,
      fix: py`Decorate the class with \`@functools.total_ordering\` (needs \`__eq__\` plus one ordering method), or write all four.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +=: 'NoneType' and 'str' (on the second +=)`,
      cause: py`\`__iadd__\` doesn't \`return self\`, so the first \`+=\` re-bound the variable to \`None\`.`,
      fix: py`End every \`__i*__\` method with \`return self\`.`,
    },
    {
      symptom: py`TypeError: exceptions must derive from BaseException`,
      cause: py`\`raise NotImplemented\` — \`NotImplemented\` is a value, not an exception class.`,
      fix: py`In operator methods: \`return NotImplemented\`. In abstract methods: \`raise NotImplementedError\`.`,
    },
    {
      symptom: py`AttributeError: 'int' object has no attribute 'cents' (inside __add__ or __lt__)`,
      cause: py`The method assumes \`other\` is the same class and reaches for its attributes.`,
      fix: py`Guard with \`if not isinstance(other, Money): return NotImplemented\` as the first line.`,
    },
    {
      symptom: py`a + b changes a (an unrelated variable updates "by itself")`,
      cause: py`\`__add__\` mutates \`self\` and returns it, so every name pointing at \`a\` sees the change.`,
      fix: py`Build and return a new instance in \`__add__\`; reserve mutation for \`__iadd__\` on mutable types.`,
    },
  ],
  bestPractices: [
    'Overload operators only when the meaning is obvious to a reader who has never seen your class.',
    'Return NotImplemented (never raise, never return None) when the other operand\'s type is unsupported.',
    'Return a new object from binary operators; never mutate self or other.',
    'Add __radd__ that accepts 0 if your type should work with sum(); add __rmul__ for scalar * value.',
    'Implement __iadd__ only for mutable types, and always return self from it.',
    'Use @functools.total_ordering (or @dataclass(order=True)) instead of hand-writing four comparison methods.',
    'Raise ValueError for valid types with incompatible values (EUR + USD), not NotImplemented.',
    'Prefer explicit methods for operations that need a policy (rounding, conversions, allocation).',
  ],
  useCases: [
    'Money, durations and quantities with units: price * 3 + delivery.',
    'Geometry and games: position + velocity * dt with a Vector2 class.',
    'Sortable domain objects: sorted(tasks), max(bids), heapq of priorities.',
    'Set-like algebra: permissions_a | permissions_b, tags & wanted_tags.',
    'Builders that read naturally: Path("data") / "scores.csv".',
  ],
  whenToUse: {
    use: [
      'The type behaves like a number, vector, matrix or set, and the operator means what it means in maths.',
      'You want the type to work with sum(), sorted(), min(), max(), heapq or bisect.',
      'The operation is cheap, has no side effects, and needs no extra parameters (rounding mode, locale, …).',
    ],
    avoid: [
      'The meaning would be a guess (report + "pdf", user * 3).',
      'The operation mutates something or performs I/O — operators should feel pure.',
      'The operation needs options — use a method with keyword arguments instead.',
      '== that returns something other than a bool, unless you are deliberately building a library DSL.',
    ],
  },
  comparison: {
    title: 'Ways to make a class sortable',
    headers: ['', 'only __lt__', '@total_ordering', '@dataclass(order=True)'],
    rows: [
      ['what you write', 'one method', '__eq__ + one ordering method', 'just the fields, in comparison order'],
      ['sorted(), min(), max()', 'work', 'work', 'work'],
      ['<=, >, >=', 'TypeError', 'generated', 'generated'],
      ['ordering rule', 'any you like', 'any you like', 'fields compared as a tuple, in order'],
      ['cost', '—', 'derived methods are a little slower', 'generated methods, no extra wrapper layer'],
    ],
    note: py`\`@dataclass(order=True)\` also needs the other side to be the **same class**; comparing with anything else returns \`NotImplemented\`. See [dataclasses](lesson:dataclasses).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'operator-overloading-q1',
      type: 'mcq',
      prompt: py`Your \`Vector2.__add__\` receives \`other = "north"\` (a string). What should it do?`,
      options: [
        { text: 'raise TypeError("can only add Vector2")', why: 'Raising stops Python from asking the other operand (str.__radd__ or a third-party type). Python raises the right TypeError for you if nobody can handle it.' },
        { text: 'return None', why: 'None is a normal value — Python would treat it as the result, and v + "north" would quietly evaluate to None.' },
        'return NotImplemented',
        { text: 'raise NotImplementedError', why: 'NotImplementedError is for abstract methods that subclasses must override. It escapes as an error instead of letting Python try the other operand.' },
      ],
      answer: 2,
      explanation: py`Returning \`NotImplemented\` tells Python "not my job". It then tries \`"north".__radd__(v)\` (strings don't have one) and, when every option is exhausted, raises \`TypeError: unsupported operand type(s) for +: 'Vector2' and 'str'\`.`,
    },
    {
      id: 'operator-overloading-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`class Meters:
    def __init__(self, n):
        self.n = n

    def __add__(self, other):
        if isinstance(other, Meters):
            return Meters(self.n + other.n)
        return NotImplemented

    def __radd__(self, other):
        if other == 0:
            return self
        return NotImplemented

    def __repr__(self):
        return f"Meters({self.n})"


print(sum([Meters(2), Meters(3)]))
print(Meters(1) + Meters(1))`,
      options: [
        { text: 'TypeError: unsupported operand type(s) for +: \'int\' and \'Meters\'', why: 'That would happen without __radd__. Here __radd__ handles the 0 that sum() starts with.' },
        'Meters(5)\nMeters(2)',
        { text: '5\n2', why: 'The results are Meters objects, and print uses their __repr__.' },
        { text: 'Meters(5)\nTypeError', why: 'Meters + Meters is handled directly by __add__ — reflected methods are not involved.' },
      ],
      answer: 1,
      explanation: py`\`sum()\` computes \`0 + Meters(2)\` → \`int\` declines → \`Meters(2).__radd__(0)\` returns \`Meters(2)\`; then \`Meters(2) + Meters(3)\` uses \`__add__\` → \`Meters(5)\`. The second line is a plain \`__add__\`.`,
    },
    {
      id: 'operator-overloading-q3',
      type: 'bug',
      prompt: 'After `together = mine + yours`, the program reports that `mine` holds 800 cents. Click the line with the bug.',
      code: py`class Wallet:
    def __init__(self, cents):
        self.cents = cents

    def __add__(self, other):
        if not isinstance(other, Wallet):
            return NotImplemented
        self.cents += other.cents
        return self


mine = Wallet(500)
yours = Wallet(300)
together = mine + yours
print(mine.cents)   # 800?!`,
      answerLine: 8,
      explanation: py`\`__add__\` mutates the left operand and returns it, so \`together\` and \`mine\` are the same object. A binary operator must build a new object: \`return Wallet(self.cents + other.cents)\`.`,
    },
    {
      id: 'operator-overloading-q4',
      type: 'fill',
      prompt: 'Fill in the blanks so that `<`, `<=`, `>` and `>=` all work on `Grade` while you write only two comparison methods.',
      code: py`from functools import ___


@total_ordering
class Grade:
    def __init__(self, score):
        self.score = score

    def __eq__(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.score == other.score

    def ___(self, other):
        if not isinstance(other, Grade):
            return NotImplemented
        return self.score < other.score`,
      answer: [['total_ordering'], ['__lt__']],
      explanation: py`\`functools.total_ordering\` needs \`__eq__\` plus one of \`__lt__\`, \`__le__\`, \`__gt__\` or \`__ge__\`. The body uses \`<\`, so the method is \`__lt__\`.`,
    },
    {
      id: 'operator-overloading-q5',
      type: 'output',
      prompt: 'Only `__lt__` is defined. What does this print?',
      code: py`class Price:
    def __init__(self, cents):
        self.cents = cents

    def __lt__(self, other):
        print("lt called")
        return self.cents < other.cents


a, b = Price(5), Price(9)
print(b > a)`,
      options: [
        { text: "TypeError: '>' not supported between instances of 'Price' and 'Price'", why: 'Python tries the reflection of > before giving up: b > a can be answered by a < b.' },
        { text: 'True', why: 'Close — but __lt__ prints "lt called" when it runs, and it does run.' },
        'lt called\nTrue',
        { text: 'lt called\nFalse', why: '__lt__ is called on a with b as the argument: 5 < 9 is True.' },
      ],
      answer: 2,
      explanation: py`\`b > a\` tries \`b.__gt__(a)\`; \`Price\` inherits \`object.__gt__\`, which returns \`NotImplemented\`. The reflection of \`>\` is \`<\` with swapped operands, so Python calls \`a.__lt__(b)\`: prints \`lt called\`, returns \`5 < 9\` → \`True\`.`,
    },
    {
      id: 'operator-overloading-q6',
      type: 'mcq',
      prompt: 'Which of these is the **weakest** case for operator overloading?',
      options: [
        { text: 'Duration + Duration → Duration', why: 'Adding durations is exactly like adding numbers — a great fit.' },
        { text: 'Vector2 * 2.5 → a scaled Vector2', why: 'Scalar multiplication is standard maths notation for vectors.' },
        'Order + Customer → assigns the customer to the order',
        { text: 'Permissions | Permissions → the union of both', why: '| already means union for Python sets, so readers will guess correctly.' },
      ],
      answer: 2,
      explanation: py`\`+\` suggests combining two things of the same kind, symmetrically, without side effects. "Assign a customer to an order" is none of those — \`order.assign(customer)\` says what it does.`,
    },
    {
      id: 'operator-overloading-q7',
      type: 'short',
      prompt: 'Why does `sum(list_of_money)` need `Money.__radd__`, even though every item in the list is a Money?',
      answer: py`\`sum()\` starts its running total at \`0\`, so the very first step is \`0 + first_item\` — an int on the left. \`int.__add__\` returns \`NotImplemented\` for Money, so Python calls the reflected \`first_item.__radd__(0)\`. Without \`__radd__\` that step raises \`TypeError\`. (Alternatively pass a start value: \`sum(items, Money(0))\`.)`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'vector2-operators',
      title: 'Vector maths for a game',
      difficulty: 'intermediate',
      prompt: py`Give \`Vector2\` the operators a 2-D game needs. \`__init__\`, \`__repr__\` and \`__eq__\` are done. Add:

- \`v + w\` and \`v - w\` → a **new** \`Vector2\` (component by component).
- \`v * k\` **and** \`k * v\` for an \`int\` or \`float\` \`k\` → a new, scaled \`Vector2\`.
- \`-v\` → \`Vector2(-x, -y)\`.
- \`abs(v)\` → the length as a float: \`abs(Vector2(3, 4)) == 5.0\` (use \`math.hypot(x, y)\`).

For unsupported operand types, the binary methods must **return \`NotImplemented\`**, so \`Vector2(1, 2) + 5\` and \`Vector2(1, 2) * Vector2(1, 2)\` raise \`TypeError\`. No operator may change its operands.`,
      files: {
        'main.py': py`import math


class Vector2:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vector2({self.x}, {self.y})"

    def __eq__(self, other):
        if not isinstance(other, Vector2):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

    # TODO: __add__, __sub__, __mul__, __rmul__, __neg__, __abs__


ship = Vector2(3, 4)
print(ship)
`,
      },
      hints: [
        'Each binary method starts with an isinstance check and returns NotImplemented when it fails; then it returns Vector2(...) built from both operands.',
        'For __mul__ check isinstance(k, (int, float)). For k * v, Python calls v.__rmul__(k) — multiplication by a number is commutative, so __rmul__ can simply return self * k (or be an alias: __rmul__ = __mul__).',
        '__neg__(self) returns Vector2(-self.x, -self.y); __abs__(self) returns math.hypot(self.x, self.y).',
      ],
      solution: {
        explanation: py`Each binary method follows the same three-step recipe: check the operand's type, return \`NotImplemented\` if unsupported, otherwise build a **new** vector. \`__rmul__ = __mul__\` reuses the function for \`2 * v\`, because Python calls it on the vector (as \`self\`) with the number as the argument. \`__neg__\` and \`__abs__\` are unary, so they only take \`self\`. Because nothing ever assigns to \`self.x\`/\`self.y\` after \`__init__\`, operands are never changed.`,
        files: {
          'main.py': py`import math


class Vector2:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vector2({self.x}, {self.y})"

    def __eq__(self, other):
        if not isinstance(other, Vector2):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

    def __add__(self, other):
        if not isinstance(other, Vector2):
            return NotImplemented
        return Vector2(self.x + other.x, self.y + other.y)

    def __sub__(self, other):
        if not isinstance(other, Vector2):
            return NotImplemented
        return Vector2(self.x - other.x, self.y - other.y)

    def __mul__(self, k):
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vector2(self.x * k, self.y * k)

    __rmul__ = __mul__

    def __neg__(self):
        return Vector2(-self.x, -self.y)

    def __abs__(self):
        return math.hypot(self.x, self.y)


ship = Vector2(3, 4)
print(ship)
print(ship + Vector2(1, 1), ship - Vector2(1, 1))
print(2 * ship, -ship, abs(ship))
`,
        },
      },
      tests: [
        { name: 'v + w adds component by component', code: py`assert Vector2(1, 2) + Vector2(3, 4) == Vector2(4, 6)` },
        { name: 'v - w subtracts', code: py`assert Vector2(5, 5) - Vector2(1, 2) == Vector2(4, 3)` },
        { name: 'v * k and k * v both scale', code: py`assert Vector2(1, 2) * 3 == Vector2(3, 6)
assert 3 * Vector2(1, 2) == Vector2(3, 6)
assert Vector2(2, 4) * 0.5 == Vector2(1.0, 2.0)` },
        { name: '-v negates', code: py`assert -Vector2(3, -4) == Vector2(-3, 4)` },
        { name: 'abs(v) is the length', code: py`assert abs(Vector2(3, 4)) == 5.0` },
        { name: 'unsupported operands return NotImplemented', code: py`assert Vector2(1, 2).__add__(5) is NotImplemented
with raises(TypeError):
    Vector2(1, 2) + 5
with raises(TypeError):
    Vector2(1, 2) * Vector2(1, 2)` },
        { name: 'operands are not modified', code: py`a, b = Vector2(1, 2), Vector2(3, 4)
a + b
a - b
a * 2
assert a == Vector2(1, 2) and b == Vector2(3, 4)` },
      ],
    },
    {
      id: 'track-durations',
      title: 'Sortable, summable track durations',
      difficulty: 'advanced',
      prompt: py`\`Duration(seconds)\` represents the length of a song. Make it work with the standard toolbox:

1. \`str(Duration(185))\` is \`"3:05"\` (minutes, colon, two-digit seconds); \`str(Duration(9))\` is \`"0:09"\`.
2. \`Duration + Duration\` returns a new \`Duration\`, and \`sum(list_of_durations)\` works **without** a start value.
3. All six comparisons work (\`<\`, \`<=\`, \`>\`, \`>=\`, \`==\`, \`!=\`), so \`sorted()\`, \`min()\` and \`max()\` work. Use \`functools.total_ordering\`.
4. For non-\`Duration\` operands, \`__add__\`, \`__eq__\` and \`__lt__\` return \`NotImplemented\` — so \`Duration(5) < 5\` raises \`TypeError\`.

\`__repr__\` is already written: \`Duration(185)\`.`,
      files: {
        'main.py': py`class Duration:
    def __init__(self, seconds):
        self.seconds = seconds

    def __repr__(self):
        return f"Duration({self.seconds})"

    # TODO: __str__, __add__, __radd__, __eq__, __lt__ (+ total_ordering)


tracks = [Duration(185), Duration(242), Duration(98)]
print(tracks)
`,
      },
      hints: [
        'divmod(self.seconds, 60) gives (minutes, seconds); format the seconds with :02d.',
        'sum() starts with 0 + first_track, so __radd__ must return self when other == 0. For ordering, decorate the class with @total_ordering and write __eq__ and __lt__.',
        'Every binary method begins with: if not isinstance(other, Duration): return NotImplemented — except __radd__, which first checks other == 0.',
      ],
      solution: {
        explanation: py`\`divmod\` splits seconds into minutes and the remainder, and \`:02d\` pads it to two digits. \`__add__\` builds a new Duration; \`__radd__\` handles the \`0\` that \`sum()\` starts with. \`@total_ordering\` turns \`__eq__\` + \`__lt__\` into the full set of comparisons, which is what \`sorted\`, \`min\` and \`max\` need (strictly they only use \`<\`). Every method returns \`NotImplemented\` for foreign types, so Python raises a proper \`TypeError\` for \`Duration(5) < 5\`.`,
        files: {
          'main.py': py`from functools import total_ordering


@total_ordering
class Duration:
    def __init__(self, seconds):
        self.seconds = seconds

    def __repr__(self):
        return f"Duration({self.seconds})"

    def __str__(self):
        minutes, seconds = divmod(self.seconds, 60)
        return f"{minutes}:{seconds:02d}"

    def __add__(self, other):
        if not isinstance(other, Duration):
            return NotImplemented
        return Duration(self.seconds + other.seconds)

    def __radd__(self, other):
        if other == 0:
            return self
        return NotImplemented

    def __eq__(self, other):
        if not isinstance(other, Duration):
            return NotImplemented
        return self.seconds == other.seconds

    def __lt__(self, other):
        if not isinstance(other, Duration):
            return NotImplemented
        return self.seconds < other.seconds


tracks = [Duration(185), Duration(242), Duration(98)]
print(tracks)
print("total:", sum(tracks))
print("longest:", max(tracks))
print("shortest first:", [str(t) for t in sorted(tracks)])
`,
        },
      },
      tests: [
        { name: 'str() formats m:ss', code: py`assert str(Duration(185)) == "3:05"
assert str(Duration(60)) == "1:00"
assert str(Duration(9)) == "0:09"` },
        { name: '+ returns a new Duration', code: py`assert Duration(60) + Duration(5) == Duration(65)` },
        { name: 'sum() works without a start value', code: py`assert sum([Duration(60), Duration(30), Duration(5)]) == Duration(95)` },
        { name: 'all comparisons work', code: py`assert Duration(30) < Duration(60) and Duration(90) > Duration(60)
assert Duration(60) <= Duration(60) and Duration(60) >= Duration(60)
assert Duration(1) != Duration(2)` },
        { name: 'sorted, min and max work', code: py`ds = [Duration(7), Duration(3), Duration(10)]
assert sorted(ds) == [Duration(3), Duration(7), Duration(10)]
assert max(ds) == Duration(10) and min(ds) == Duration(3)` },
        { name: 'foreign types get NotImplemented', code: py`assert Duration(5).__lt__(5) is NotImplemented
assert Duration(5).__add__("x") is NotImplemented
with raises(TypeError):
    Duration(5) < 5` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'operator-overloading-dispatch',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Walk me through exactly what Python does to evaluate `a + b` when a and b are instances of your classes.',
      answer: 'It calls type(a).__add__(a, b). If that is missing or returns NotImplemented and the types differ, it calls type(b).__radd__(b, a). If that also declines, it raises TypeError. Exception: if b\'s type is a subclass of a\'s type that overrides __radd__, b.__radd__(a) is tried first.',
      explanation: py`Everything is looked up on the types, not the instances. Reflected methods are skipped when both operands have the same type. The subclass rule lets a more specialised type control mixed operations with its base class. Built-ins follow the same protocol, which is why \`3 * [1]\` works via \`list.__rmul__\`.`,
      whyAsked: 'It checks whether you understand the operand negotiation rather than just knowing that __add__ exists — the root of most bugs with sum(), mixed types and NotImplemented.',
      mistakes: ['Forgetting the reflected step entirely', 'Saying __radd__ is called when both operands have the same type', 'Not knowing the subclass-priority rule'],
      followUps: ['What changes for a += b?', 'How do comparisons reflect, given there is no __rlt__?', 'Why should __add__ return NotImplemented rather than raise?'],
      modelAnswer: 'Python first asks the left operand: it looks up __add__ on type(a) and calls it with b. If the method exists and returns a real value, that\'s the result. If it\'s missing or returns the NotImplemented sentinel, and the operands are of different types, Python asks the right operand through the reflected method, type(b).__radd__(b, a). If that also returns NotImplemented, Python raises TypeError: unsupported operand types. There\'s one twist: if b\'s type is a subclass of a\'s type and overrides __radd__, Python tries b\'s reflected method first, so subclasses can take control. Built-in types follow exactly the same protocol.',
    },
    {
      id: 'operator-overloading-notimplemented',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare returning NotImplemented, raising NotImplementedError, and raising TypeError inside __add__.',
      answer: 'Return NotImplemented to say "I can\'t handle this type — ask the other operand"; Python raises TypeError itself if nobody can. NotImplementedError is an exception for abstract or unfinished methods, not for operator dispatch. Raising TypeError yourself works but blocks the other operand\'s reflected method.',
      explanation: py`\`NotImplemented\` is a singleton value, the only correct "decline" signal for binary special methods. \`raise NotImplemented\` is itself an error (\`TypeError: exceptions must derive from BaseException\`), and \`NotImplemented\` used in a boolean context is a \`TypeError\` in 3.14 — so it must never leak out of the dunder.`,
      whyAsked: 'The names are confusingly similar; mixing them up is a frequent bug, and the answer reveals whether you understand cooperative dispatch.',
      mistakes: ['Treating NotImplemented and NotImplementedError as interchangeable', 'Writing raise NotImplemented', 'Returning False or None for unsupported types'],
      followUps: ['What does a == b do if both __eq__ methods return NotImplemented?', 'Where is NotImplementedError the right choice?'],
      modelAnswer: 'They mean different things. NotImplemented is a special value that a binary dunder returns to say "this operand type isn\'t mine"; Python then tries the reflected method on the other operand and raises the standard TypeError only if nobody handles it. NotImplementedError is an exception you raise from a method a subclass must override — it has nothing to do with operator dispatch. Raising TypeError yourself does give an error, but it slams the door on a third-party type whose __radd__ might have known what to do. So inside operator methods I always return NotImplemented for unknown types.',
    },
    {
      id: 'operator-overloading-tuple-iadd',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What happens here, and what is `t` afterwards?',
      code: { lang: 'python', code: py`t = ([1],)
try:
    t[0] += [2]
except TypeError as error:
    print(error)
print(t)` },
      options: [
        "Prints ([1, 2],) only — no error",
        "Prints the TypeError, then ([1],)",
        "Prints 'tuple' object does not support item assignment, then ([1, 2],)",
        'Raises an uncaught TypeError',
      ],
      correctOption: 2,
      answer: "It prints 'tuple' object does not support item assignment and then ([1, 2],). list.__iadd__ extends the list in place, then the assignment back into the tuple fails — but the mutation already happened.",
      explanation: py`\`t[0] += [2]\` runs as: fetch \`t[0]\`; call \`list.__iadd__\` on it (mutates and returns the same list); then store the result with \`t[0] = …\`, which tuples forbid. The store is part of every augmented assignment, even when \`__iadd__\` returned \`self\`. Run \`dis.dis\` on the line to see the separate in-place op and store steps.`,
      whyAsked: 'A classic that reveals whether you know augmented assignment is "call __iadd__, then assign the result" rather than a single atomic operation.',
      mistakes: ['Assuming the failed assignment rolls back the mutation', 'Thinking += on a list inside a tuple simply works', 'Not knowing that += always rebinds'],
      followUps: ['Why must __iadd__ return self?', 'How would you append safely? (t[0].append(2) or t[0].extend([2]))'],
      modelAnswer: 'It prints the TypeError message, and then t is ([1, 2],). Augmented assignment is two steps: first Python calls list.__iadd__ on the inner list, which extends it in place and returns it; then it assigns that result back with t[0] = result. The second step fails because tuples don\'t support item assignment, but the list has already been mutated. That two-step design is also why __iadd__ must return self — whatever it returns is assigned back to the target.',
    },
    {
      id: 'operator-overloading-total-ordering',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does functools.total_ordering do, what does it require, and when would you not use it?',
      answer: 'It is a class decorator that, given __eq__ and one of __lt__/__le__/__gt__/__ge__, generates the remaining ordering methods. Skip it when comparisons are performance-critical (derived methods are slower), when a dataclass with order=True fits, or when the ordering is only partial.',
      explanation: py`Python never derives \`<=\` from \`<\` and \`==\` by itself. \`total_ordering\` adds the missing methods using the one you wrote and \`__eq__\`, propagating \`NotImplemented\`. It assumes a *total* order — every pair is comparable — so it's wrong for things like sets (subset ordering), where \`not a < b\` doesn't imply \`a >= b\`.`,
      whyAsked: 'Tests practical knowledge of the stdlib and of the assumptions behind comparisons.',
      mistakes: ['Thinking Python derives <= from < automatically', 'Forgetting that __eq__ is required', 'Using it for partial orders'],
      followUps: ['What does sorted() actually need?', 'How does @dataclass(order=True) compare instances?', 'Why is set ordering partial?'],
      modelAnswer: 'functools.total_ordering is a class decorator: I write __eq__ and one ordering method, usually __lt__, and it fills in __le__, __gt__ and __ge__ in terms of those two. Python itself never derives one comparison from another, apart from != from ==, so without it <= would raise TypeError. I skip it in hot loops because the derived methods are slower and produce deeper tracebacks, and I never use it for partial orders like subset comparison, since it assumes any two values are comparable. If ordering is just "compare these fields in order", @dataclass(order=True) is simpler.',
    },
    {
      id: 'operator-overloading-tally',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement `Tally` (word counts in a dict) so that `a + b` returns a NEW merged Tally without changing either operand, while `a += b` updates `a` in place (same object) and returns it. Non-Tally operands must get NotImplemented.',
      answer: '__add__ copies self.counts into a new Tally and merges other into it; __iadd__ merges other into self.counts and returns self. Both start with an isinstance check that returns NotImplemented.',
      explanation: py`This is exactly the \`list\` behaviour: \`+\` creates a new object, \`+=\` mutates in place. With \`__iadd__\`, every alias sees the change; without it, \`+=\` would fall back to \`__add__\` and rebind the name to a new object, leaving aliases unchanged. \`collections.Counter\` works the same way (its \`+\` also drops counts ≤ 0).`,
      starter: { files: { 'main.py': py`class Tally:
    def __init__(self, counts=None):
        self.counts = dict(counts or {})

    def __eq__(self, other):
        if not isinstance(other, Tally):
            return NotImplemented
        return self.counts == other.counts

    def __repr__(self):
        return f"Tally({self.counts!r})"

    # TODO: __add__ (new object) and __iadd__ (in place, return self)


monday = Tally({"tea": 2})
tuesday = Tally({"tea": 1, "cake": 3})
print(monday, tuesday)
` } },
      tests: [
        { name: 'a + b merges into a new Tally', code: py`a, b = Tally({"tea": 2}), Tally({"tea": 1, "cake": 3})
c = a + b
assert c == Tally({"tea": 3, "cake": 3})
assert c is not a and c is not b` },
        { name: 'a + b leaves both operands unchanged', code: py`a, b = Tally({"tea": 2}), Tally({"cake": 1})
a + b
assert a.counts == {"tea": 2} and b.counts == {"cake": 1}` },
        { name: 'a += b updates the same object', code: py`a = Tally({"tea": 2})
alias = a
a += Tally({"tea": 1, "cake": 1})
assert a is alias
assert alias.counts == {"tea": 3, "cake": 1}` },
        { name: 'non-Tally operands get NotImplemented', code: py`assert Tally().__add__(5) is NotImplemented
assert Tally().__iadd__(5) is NotImplemented
with raises(TypeError):
    Tally() + 5` },
      ],
      solution: { files: { 'main.py': py`class Tally:
    def __init__(self, counts=None):
        self.counts = dict(counts or {})

    def __eq__(self, other):
        if not isinstance(other, Tally):
            return NotImplemented
        return self.counts == other.counts

    def __repr__(self):
        return f"Tally({self.counts!r})"

    def __add__(self, other):
        if not isinstance(other, Tally):
            return NotImplemented
        result = Tally(self.counts)          # a copy: self stays untouched
        result += other                      # reuse the in-place logic
        return result

    def __iadd__(self, other):
        if not isinstance(other, Tally):
            return NotImplemented
        for word, count in other.counts.items():
            self.counts[word] = self.counts.get(word, 0) + count
        return self                          # += binds the name to this


monday = Tally({"tea": 2})
tuesday = Tally({"tea": 1, "cake": 3})
print(monday + tuesday)
monday += tuesday
print(monday)
` } },
      hints: ['__add__ can build a copy (Tally(self.counts)) and merge into the copy.', '__iadd__ loops over other.counts.items(), updates self.counts with dict.get(word, 0) + count, and must end with return self.'],
      whyAsked: 'Shows you understand the difference between value-returning and in-place operators, aliasing, and the __iadd__ return contract.',
      mistakes: ['Mutating self in __add__', 'Forgetting return self in __iadd__', 'Sharing the same dict between the copy and the original (Tally(self.counts) must copy)'],
      followUps: ['What happens to aliases if you delete __iadd__?', 'How does collections.Counter differ?', 'Should an immutable type define __iadd__?'],
      modelAnswer: 'I implement __iadd__ as the core: check the type and return NotImplemented if it\'s not a Tally, then loop over the other tally and add each count into self.counts, and finally return self, because += assigns whatever __iadd__ returns back to the name. __add__ then makes a copy of self — the constructor copies the dict — and merges other into that copy, so neither operand changes. This mirrors list: + builds a new object, += mutates in place, which is why aliases see the += update but not the + result.',
    },
    {
      id: 'operator-overloading-money-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You are designing a Money type for a payments service. Which operators would you overload, which would you deliberately not, and how do you handle currencies and rounding?',
      answer: 'Overload +, - (Money with Money of the same currency), * by an int, unary -, and ordering/equality within a currency; make it immutable and hashable. Don\'t overload / or * by float — use explicit methods like allocate(n) or apply_rate(rate, rounding=...). Store amounts as integer minor units or Decimal; raise a ValueError-style error for currency mismatches.',
      explanation: py`The guiding rule is "operators for unambiguous, lossless operations; methods for anything needing a policy". Adding two EUR amounts is lossless. Splitting 10.00 three ways is not — someone must get the extra cent, so \`allocate(3)\` returning \`[3.34, 3.33, 3.33]\` makes the policy explicit. Currency mismatch is a value error, not a type error, so it shouldn't use \`NotImplemented\`. Immutability (frozen dataclass) makes Money safe as a dict key and safe to share.`,
      code: { lang: 'python', code: py`from dataclasses import dataclass


@dataclass(frozen=True, order=True)
class Money:
    currency: str
    cents: int

    def allocate(self, parts):
        """Split into parts that add up exactly (simplified: equal shares)."""
        base, extra = divmod(self.cents, parts)
        return [Money(self.currency, base + (1 if i < extra else 0)) for i in range(parts)]


print([m.cents for m in Money("EUR", 1000).allocate(3)])   # [334, 333, 333]` },
      whyAsked: 'Money is the canonical value object; interviewers want to see judgement about where operators help and where they hide decisions.',
      mistakes: ['Using float for money', 'Silently converting currencies inside __add__', 'Overloading / and losing cents to rounding', 'Making Money mutable'],
      followUps: ['Why is order=True on this dataclass questionable across currencies?', 'How would you support Decimal amounts and banker\'s rounding?', 'Where should currency conversion live?'],
      modelAnswer: 'I\'d make Money an immutable value object storing integer minor units, or a Decimal, plus a currency code. I\'d overload the operations that are lossless and unambiguous: adding and subtracting Money of the same currency, multiplying by an integer, negation, and equality and ordering within one currency. Mixing currencies raises a ValueError, because the types are fine but the values aren\'t compatible. I would not overload division or float multiplication, because they need a rounding policy — instead I\'d expose allocate(n) that returns parts summing exactly to the total, or apply_rate with an explicit rounding mode. Conversions belong in a separate service that knows exchange rates.',
    },
    {
      id: 'operator-overloading-dsl',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate proposes `query = User.age > 18` in your own mini query builder, where `>` returns a filter object instead of a bool. What are the benefits and the risks?',
      answer: 'Benefit: a readable DSL (as in SQLAlchemy). Risks: comparisons no longer return bools, so `if User.age > 18:` silently treats the filter object as true, `==` returning a non-bool can break hashing/containers, and newcomers are surprised. Mitigate by making __bool__ raise, documenting it, and keeping such classes out of general-purpose code.',
      explanation: py`Rich comparisons may legally return any object, which is what makes DSLs possible. But Python then calls \`bool()\` on the result in \`if\`, \`and\`, \`or\` and \`in\`. A filter object that's always truthy hides bugs; NumPy and SQLAlchemy defend by raising in \`__bool__\` ("truth value is ambiguous"). Overriding \`__eq__\` to return non-bools also breaks \`x in list\` and dict lookups, which need real equality.`,
      code: { lang: 'python', code: py`class Column:
    def __init__(self, name):
        self.name = name

    def __gt__(self, value):
        return Filter(f"{self.name} > {value!r}")


class Filter:
    def __init__(self, sql):
        self.sql = sql

    def __bool__(self):
        raise TypeError("a Filter has no truth value; pass it to .where()")


print((Column("age") > 18).sql)    # age > 18` },
      whyAsked: 'Probes judgement: knowing a feature exists is different from knowing when it makes code worse.',
      mistakes: ['Assuming comparisons must return bool', 'Ignoring what happens in if/and/or', 'Overloading == for the DSL without considering containers and hashing'],
      followUps: ['Why can\'t you overload and/or/not?', 'How does NumPy handle `if array > 0`?', 'What is __bool__ used for besides if?'],
      modelAnswer: 'Python allows rich comparisons to return any object, so a DSL like User.age > 18 producing a filter is legal and reads nicely — SQLAlchemy is built on it. The risk is that everything else in Python expects comparisons to be booleans. In an if statement the filter object would just be truthy, so a mistaken if User.age > 18 silently passes. I\'d make the filter\'s __bool__ raise a clear TypeError, like NumPy does, avoid overloading == unless necessary because containers and dict lookups depend on it, and keep the DSL confined to the query layer where everyone knows the rules.',
    },
  ],

  takeaways: [
    'Every operator is a method call: a + b → a.__add__(b), a < b → a.__lt__(b); built-in types follow the same rules.',
    'Return NotImplemented (never raise, never None) for operand types you don\'t support — Python then tries the other operand and raises TypeError only if nobody can help.',
    'Reflected methods (__radd__, __rmul__, …) run on the right operand when the left one declines; __radd__ accepting 0 makes sum() work.',
    'Binary operators return new objects; __iadd__ may mutate self but must return self — and += always assigns the result back.',
    'Python never derives <= from < and ==; use functools.total_ordering or @dataclass(order=True). sorted(), min() and max() only need <.',
    'Overload only where the meaning is obvious and lossless; use named methods for operations that need a policy (rounding, conversions).',
  ],
}
