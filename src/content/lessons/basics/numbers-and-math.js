// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PIZZA_PLANNER = py`# Pizza party planner
import math

guests = 13
slices_per_guest = 3
slices_per_pizza = 8
price_per_pizza = 11.99

slices_needed = guests * slices_per_guest               # an int
pizzas = math.ceil(slices_needed / slices_per_pizza)    # round UP
spare = pizzas * slices_per_pizza - slices_needed
total = pizzas * price_per_pizza                        # int * float -> float
each = total / guests                                   # / always gives a float

print("Slices needed:", slices_needed)
print("Pizzas to order:", pizzas)
print("Spare slices:", spare)
print("Total cost:", total)
print("Each guest pays:", round(each, 2))
`

export default {
  id: 'numbers-and-math',
  title: 'Numbers: int, float & arithmetic',
  summary: 'Python ints are exact and never overflow; floats are fast binary approximations — learn the operators (/, //, %, **), rounding rules and when to reach for math, decimal or fractions.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['variables-and-names'],
  related: ['type-conversion', 'booleans-and-comparisons', 'string-formatting', 'variables-and-names', 'object-model', 'performance'],
  tags: ['numbers', 'int', 'float', 'arithmetic', 'operators', 'division', 'floor division', 'modulo', 'remainder', 'power', 'exponent', 'divmod', 'round', 'banker’s rounding', 'abs', 'math', 'floating point', 'IEEE 754', 'precision', 'decimal', 'fractions', 'underscores', 'isclose'],
  apis: [
    { name: '+, -, *, /', summary: 'Add, subtract, multiply, and true division (/ always returns a float).' },
    { name: '// and %', summary: 'Floor division (round down to the nearest whole number) and the remainder (modulo).' },
    { name: '**', summary: 'Power: 2 ** 10 is 1024. Binds tighter than unary minus: -2 ** 2 is -4.' },
    { name: 'divmod(a, b)', summary: 'Returns the pair (a // b, a % b) in one call.' },
    { name: 'round(x, ndigits=None)', summary: 'Rounds half to even: round(2.5) is 2. Without ndigits returns an int.' },
    { name: 'abs(x)', summary: 'Absolute value (distance from zero).' },
    { name: 'math.ceil / math.floor / math.trunc', summary: 'Round up, round down, or chop off the fractional part.' },
    { name: 'math.sqrt, math.pi, math.isclose', summary: 'Square root, π, and a safe way to compare floats.' },
    { name: 'decimal.Decimal', summary: 'Exact decimal arithmetic — the right tool for money.' },
    { name: 'fractions.Fraction', summary: 'Exact rational numbers such as 1/3.' },
  ],
  docs: [
    { label: 'Built-in types — numeric types int, float, complex', url: 'https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex' },
    { label: 'Tutorial — floating-point arithmetic: issues and limitations', url: 'https://docs.python.org/3/tutorial/floatingpoint.html' },
    { label: 'math — mathematical functions', url: 'https://docs.python.org/3/library/math.html' },
    { label: 'Built-in functions — round()', url: 'https://docs.python.org/3/library/functions.html#round' },
    { label: 'decimal — decimal fixed-point and floating-point arithmetic', url: 'https://docs.python.org/3/library/decimal.html' },
    { label: 'fractions — rational numbers', url: 'https://docs.python.org/3/library/fractions.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Python has two everyday kinds of number:`,
    py`- **\`int\`** (*integer*) — whole numbers: \`7\`, \`-3\`, \`0\`, \`1_000_000\`. They are **exact** and can be as big as your memory allows.
- **\`float\`** (*floating-point number*) — numbers with a decimal point: \`3.5\`, \`-0.25\`, \`2.0\`, \`1e6\`. They are **fast approximations**, stored in binary, which is why \`0.1 + 0.2\` prints \`0.30000000000000004\`.`,
    py`You'll learn the arithmetic operators — including three that surprise people: \`/\` (always a float), \`//\` (floor division) and \`%\` (remainder) — plus \`**\`, \`round()\` and its "round half to even" rule, the \`math\` module, and two exact alternatives for when floats aren't good enough: \`decimal\` and \`fractions\`.`,
    py`Remember from [variables](lesson:variables-and-names) that every value is an object: \`price = 11.99\` binds the name \`price\` to a float object. Numbers are **immutable** — arithmetic always makes *new* number objects.`,
  ],
  why: [
    py`Almost every program counts or measures something: scores, prices, distances, times, sensor readings. Getting the arithmetic *exactly* right matters — a rounding bug in a shop charges real money, a wrong remainder breaks a calendar, an off-by-one pizza leaves a guest hungry.`,
    py`Knowing the difference between int and float — and why floats are approximate — is the difference between "my program is haunted" and "of course it prints 0.30000000000000004; I'll compare with \`math.isclose\`".`,
  ],
  eli15: [
    py`**Ints are like counting marbles.** You either have 7 marbles or 8 — never "7.0000001". And you can count as high as you like: Python ints never run out of room.`,
    py`**Floats are like measuring with a ruler.** Super useful for lengths and averages, but every measurement is a tiny bit approximate. Computers store floats in binary (base 2), and some simple decimals — like 0.1 — can't be written exactly in binary, the same way 1/3 can't be written exactly in decimal (0.3333… forever). So Python stores the closest value it can, and tiny errors can show up: \`0.1 + 0.2\` → \`0.30000000000000004\`.`,
    py`And division has flavours: \`/\` is "share exactly" (17 slices / 5 friends = 3.4 each), \`//\` is "whole slices each" (3), and \`%\` is "what's left in the box" (2).`,
  ],
  analogy: {
    title: 'Sharing pizza slices',
    body: [
      py`17 slices, 5 friends. A maths teacher says each gets **3.4** slices (\`17 / 5\`). A practical friend says "everyone gets **3** whole slices" (\`17 // 5\`) "and there are **2** left over" (\`17 % 5\`). Both are right — they answer different questions.`,
      py`Ordering pizza asks a third question: "how many boxes do we need to have *enough*?" — that's rounding **up** (\`math.ceil\`), because 4.875 pizzas means buying 5.`,
    ],
    mapping: [
      ['exact share: 3.4 slices each', '17 / 5 → 3.4 (true division, always a float)'],
      ['whole slices each: 3', '17 // 5 → 3 (floor division)'],
      ['slices left in the box: 2', '17 % 5 → 2 (remainder / modulo)'],
      ['both answers at once', 'divmod(17, 5) → (3, 2)'],
      ['boxes needed to have enough', 'math.ceil(39 / 8) → 5 (round up)'],
      ['counting slices (always whole)', 'int — exact'],
      ['weighing the cheese', 'float — approximate'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch ints and floats being made',
    props: {
      code: py`slices = 17
friends = 5
each = slices // friends       # whole slices each
left_over = slices % friends   # what's left in the box
exact = slices / friends       # / always gives a float
print(each, left_over, exact)

big = 2 ** 100                 # ints never overflow
print(big)
print(0.1 + 0.2)               # floats are binary approximations
`,
      notes: {
        3: '`//` divides and rounds **down** to a whole number: 17 // 5 is 3, an **int**.',
        4: '`%` gives the remainder after that division: 17 − 3 × 5 = 2.',
        5: '`/` is true division. The answer is a **float** (3.4) even when both inputs are ints.',
        8: '2 to the power 100 is a 31-digit number. Python ints grow as needed — no overflow, no rounding.',
        10: 'Neither 0.1 nor 0.2 can be stored exactly in binary, so their sum is a hair above 0.3.',
      },
    },
    alt: 'A step-by-step trace. slices is 17 and friends is 5. each = 17 // 5 is the int 3, left_over = 17 % 5 is 2, exact = 17 / 5 is the float 3.4; the program prints 3 2 3.4. Then big = 2 ** 100 is the exact integer 1267650600228229401496703205376, and printing 0.1 + 0.2 shows 0.30000000000000004.',
    caption: py`Step through and watch the **Variables** panel: \`each\` and \`left_over\` are ints, \`exact\` is a float. The type of the result depends on the *operator*, not just the inputs.`,
  },
  syntax: [
    py`#### Number literals`,
    { code: py`count = 42            # int
temperature = -3      # int
population = 8_100_000_000   # underscores group digits (any number of them, between digits)
price = 11.99         # float
whole_float = 2.0     # still a float: it has a decimal point
distance = 1.5e3      # scientific notation: 1.5 × 10³ = 1500.0 (always a float)
tiny = 2.5e-3         # 0.0025
mask = 0b1010         # binary literal: 10
colour = 0xFF         # hexadecimal literal: 255`, lang: 'python', title: 'writing numbers' },
    py`#### Arithmetic operators`,
    py`| operator | meaning | example | result |
|---|---|---|---|
| \`+\` | add | \`7 + 2\` | \`9\` |
| \`-\` | subtract | \`7 - 2\` | \`5\` |
| \`*\` | multiply | \`7 * 2\` | \`14\` |
| \`/\` | true division (always float) | \`7 / 2\`, \`8 / 2\` | \`3.5\`, \`4.0\` |
| \`//\` | floor division (round **down**) | \`7 // 2\`, \`-7 // 2\` | \`3\`, \`-4\` |
| \`%\` | remainder (modulo) | \`7 % 2\`, \`-7 % 2\` | \`1\`, \`1\` |
| \`**\` | power | \`2 ** 10\`, \`9 ** 0.5\` | \`1024\`, \`3.0\` |`,
    py`**Mixing types:** if either operand is a float, the result is a float (\`3 + 2.0\` → \`5.0\`). An int never silently becomes a float except through \`/\` or by meeting a float.`,
    py`**Precedence** (what happens first), highest to lowest: \`**\` → unary minus (\`-x\`) → \`*\`, \`/\`, \`//\`, \`%\` → \`+\`, \`-\`. Same level runs left to right — except \`**\`, which runs right to left: \`2 ** 3 ** 2\` is \`2 ** 9\` = \`512\`. And \`-2 ** 2\` is \`-(2 ** 2)\` = \`-4\`. When in doubt, add brackets: they cost nothing and help readers.`,
    { code: py`score = 10
score += 5     # score = score + 5   -> 15
score -= 3     # 12
score *= 2     # 24
score /= 4     # 6.0  (now a float!)
score //= 4    # 1.0
score **= 3    # 1.0
score %= 2     # 1.0`, lang: 'python', title: 'augmented assignment works for every operator' },
    py`#### Built-in helpers`,
    { code: py`print(abs(-7))            # 7       distance from zero
print(round(3.14159, 2))  # 3.14    round to 2 decimal places (returns a float)
print(round(2.5))         # 2       no ndigits -> returns an int; halves go to EVEN
print(round(3.5))         # 4
print(divmod(7384, 3600)) # (2, 184) -> 2 hours and 184 seconds left over
print(pow(2, 10))         # 1024    same as 2 ** 10
print(max(3, 9, 4), min(2.5, 1))   # 9 1`, lang: 'python', title: 'abs, round, divmod, pow, min, max' },
    { callout: 'warn', title: 'round() rounds half to even', text: py`\`round(2.5)\` is \`2\`, \`round(3.5)\` is \`4\`, \`round(-2.5)\` is \`-2\`. Exact halves go to the nearest **even** number ("banker's rounding"), which avoids an upward bias when you round many values. Also, \`round(2.675, 2)\` gives \`2.67\` — not because of that rule, but because 2.675 is stored as 2.67499999… in binary. For school-style "half up" rounding of money, use \`decimal\` (below).` },
    py`#### The math module`,
    { code: py`import math

print(math.sqrt(16))        # 4.0
print(math.isqrt(17))       # 4      integer square root (rounded down)
print(math.pi)              # 3.141592653589793
print(math.ceil(4.2))       # 5      round UP to an int
print(math.floor(-4.2))     # -5     round DOWN (toward minus infinity)
print(math.trunc(-4.2))     # -4     chop off the fraction (toward zero) - same as int(-4.2)
print(math.isclose(0.1 + 0.2, 0.3))   # True   the right way to compare floats
print(math.prod([2, 3, 4])) # 24     multiply everything`, lang: 'python', title: 'a few math favourites' },
    py`#### Exact alternatives: decimal and fractions`,
    { code: py`from decimal import Decimal
from fractions import Fraction

print(Decimal("0.1") + Decimal("0.2"))       # 0.3   exact decimal arithmetic
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))   # True
print(Fraction(1, 3) + Fraction(1, 6))       # 1/2   exact fractions`, lang: 'python', title: 'when "approximately" isn’t good enough' },
    { callout: 'tip', title: 'Create Decimals from strings', text: py`\`Decimal("0.1")\` is exactly one tenth. \`Decimal(0.1)\` copies the *float* 0.1, binary error and all: \`0.1000000000000000055511151231257827021181583404541015625\`.` },
  ],
  walkthrough: {
    title: 'Reading the pizza planner line by line',
    lang: 'python',
    code: PIZZA_PLANNER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2], text: py`\`import math\` makes the standard \`math\` module available as \`math\`. We need it for rounding up.` },
      { lines: [4, 7], text: py`Inputs. Three ints (counts are whole numbers) and one float (a price). Note the names carry units: *per guest*, *per pizza*.` },
      { lines: [9], text: py`\`13 * 3\` is the int \`39\`: int × int stays an int.` },
      { lines: [10], text: py`\`39 / 8\` is \`4.875\` — but you can't buy 0.875 of a pizza. \`math.ceil\` rounds **up** to \`5\`. (\`//\` would round *down* to 4 and leave someone hungry.)` },
      { lines: [11], text: py`5 pizzas × 8 slices = 40 slices; 40 − 39 = 1 spare slice. All ints, all exact.` },
      { lines: [12, 13], text: py`Int × float gives a float: \`5 * 11.99\` is \`59.95\`. Then \`/\` always produces a float: \`59.95 / 13\` is \`4.611538461538462\`.` },
      { lines: [19], text: py`\`round(each, 2)\` rounds to 2 decimal places *for display*: \`4.61\`. Keep full precision in calculations and round at the end.` },
    ],
  },
  playground: {
    title: 'Pizza party planner',
    objective: 'Run it, then change the inputs and add // , %, cents and Decimal versions of the calculation.',
    files: { 'main.py': PIZZA_PLANNER },
    expected: py`\`\`\`text
Slices needed: 39
Pizzas to order: 5
Spare slices: 1
Total cost: 59.95
Each guest pays: 4.61
\`\`\`

Open the **Variables** tab: \`slices_needed\`, \`pizzas\` and \`spare\` are ints; \`total\` and \`each\` are floats.`,
    experiments: [
      {
        id: 'more-guests',
        task: py`Seven more friends are coming: set \`guests\` to **20**. Predict the number of pizzas before you run it.`,
        hint: py`20 × 3 = 60 slices. 60 / 8 = 7.5. What does \`math.ceil\` do with 7.5?`,
        tests: [
          { name: 'guests is 20', code: py`assert guests == 20` },
          { name: 'orders 8 pizzas', code: py`assert 'Pizzas to order: 8' in output` },
        ],
        explain: py`\`math.ceil(7.5)\` is \`8\` — always round **up** when you need *enough*. With 8 pizzas there are 4 spare slices, and each guest pays \`round(95.92 / 20, 2)\` = \`4.8\`. (\`round\` doesn't add trailing zeros; formatting with \`f"{each:.2f}"\` would show \`4.80\` — see [f-strings](lesson:string-formatting).)`,
      },
      {
        id: 'full-and-left-over',
        task: py`Add two variables after \`slices_needed\`: \`full_pizzas\`, the number of pizzas the slices **completely** fill, and \`left_over\`, the slices that don't fill a whole pizza. Use \`//\` and \`%\`, then print them.`,
        hint: py`\`full_pizzas = slices_needed // slices_per_pizza\` and \`left_over = slices_needed % slices_per_pizza\`. For 39 slices: 4 full pizzas and 7 slices left over.`,
        tests: [
          { name: 'full_pizzas uses floor division', code: py`assert ns.get('full_pizzas') == slices_needed // slices_per_pizza, 'full_pizzas should be slices_needed // slices_per_pizza'` },
          { name: 'left_over uses the remainder', code: py`assert ns.get('left_over') == slices_needed % slices_per_pizza, 'left_over should be slices_needed % slices_per_pizza'` },
          { name: 'both are ints', code: py`assert type(full_pizzas) is int and type(left_over) is int` },
        ],
        explain: py`\`//\` and \`%\` are partners: \`full_pizzas * slices_per_pizza + left_over == slices_needed\` is always true. \`divmod(slices_needed, slices_per_pizza)\` gives both at once: \`(4, 7)\`. They're how you convert seconds into minutes and seconds, pence into pounds and pence, or a list position into a row and column.`,
      },
      {
        id: 'cents',
        task: py`Shops store money as whole **cents** to avoid float errors. Add \`total_cents = round(total * 100)\` and print it.`,
        hint: py`\`round()\` with no second argument returns an int.`,
        tests: [
          { name: 'total_cents is an int', code: py`assert type(ns.get('total_cents')) is int, 'Create total_cents with round(total * 100)'` },
          { name: 'total_cents matches the total', code: py`assert total_cents == round(total * 100)` },
        ],
        explain: py`Why \`round\` and not \`int\`? Because \`4.35 * 100\` is \`434.99999999999994\` in binary floating point, and \`int()\` simply chops off the fraction: \`434\` — a lost cent. \`round(4.35 * 100)\` is \`435\`. Better still, keep money as cents (ints) or \`Decimal\` from the very start.`,
      },
      {
        id: 'decimal-price',
        task: py`Switch the price to exact decimal arithmetic: add \`from decimal import Decimal\` under \`import math\` and set \`price_per_pizza = Decimal("11.99")\`. Run it — everything still works.`,
        hint: py`Use a **string** inside \`Decimal(...)\`. Decimal × int and Decimal / int both work.`,
        tests: [{ name: 'total is a Decimal', code: py`from decimal import Decimal
assert isinstance(total, Decimal), 'Make price_per_pizza a Decimal("11.99")'` }],
        explain: py`Now \`total\` is exactly \`Decimal('59.95')\` and \`round(each, 2)\` gives \`Decimal('4.61')\` — no binary approximation anywhere. That's why finance code uses \`Decimal\` (or integer cents). The trade-off: Decimal arithmetic is slower than float, and you can't mix Decimal with float directly (\`Decimal("1.5") + 0.5\` raises \`TypeError\`).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Why 0.1 + 0.2 isn’t exactly 0.3',
    props: {
      width: 760,
      height: 370,
      nodes: [
        { id: 't01', label: '0.1', note: 'what you type', x: 100, y: 60, tone: 'yellow' },
        { id: 's01', label: 'stored 0.1', note: 'a hair above 0.1', x: 330, y: 60, tone: 'blue' },
        { id: 't02', label: '0.2', note: 'what you type', x: 100, y: 180, tone: 'yellow' },
        { id: 's02', label: 'stored 0.2', note: 'a hair above 0.2', x: 330, y: 180, tone: 'blue' },
        { id: 'sum', label: 'add, then round', note: 'a hair above 0.3', x: 590, y: 120, tone: 'ink' },
        { id: 't03', label: '0.3', note: 'typed directly', x: 100, y: 305, tone: 'yellow' },
        { id: 's03', label: 'stored 0.3', note: 'a hair below 0.3', x: 330, y: 305, tone: 'blue' },
        { id: 'cmp', label: '== ?', note: 'different values: False', x: 590, y: 305, tone: 'red' },
      ],
      edges: [
        { from: 't01', to: 's01', label: 'nearest' },
        { from: 't02', to: 's02', label: 'nearest' },
        { from: 's01', to: 'sum' },
        { from: 's02', to: 'sum' },
        { from: 't03', to: 's03', label: 'nearest' },
        { from: 'sum', to: 'cmp' },
        { from: 's03', to: 'cmp' },
      ],
      steps: [
        { focus: ['t01'], text: py`You type \`0.1\`. In decimal that's simple. But floats are stored in **binary** (base 2), where one tenth is an endlessly repeating fraction — like 1/3 = 0.3333… in decimal.` },
        { focus: ['s01'], edges: ['t01->s01'], text: py`So Python stores the **nearest** value a float can hold: exactly \`0.1000000000000000055511151231257827021181583404541015625\`. (Ask \`Decimal(0.1)\` and it will show you.)` },
        { focus: ['t02', 's02'], edges: ['t02->s02'], text: py`\`0.2\` gets the same treatment: stored as \`0.200000000000000011102230246251565…\`, also a hair too big.` },
        { focus: ['sum'], edges: ['s01->sum', 's02->sum'], text: py`Adding them gives a value that must be rounded to the nearest float again: \`0.3000000000000000444089209850062616…\`.` },
        { focus: ['t03', 's03'], edges: ['t03->s03'], text: py`But typing \`0.3\` directly stores its own nearest float: \`0.299999999999999988897769753748434…\` — a hair *below* 0.3.` },
        { focus: ['cmp'], edges: ['sum->cmp', 's03->cmp'], text: py`Two different floats, so \`0.1 + 0.2 == 0.3\` is **False**. When Python prints a float it shows the *shortest* text that maps back to the same float: \`0.30000000000000004\` for the sum, \`0.3\` for the other.` },
        { focus: ['sum', 's03', 'cmp'], text: py`The fix depends on the job: compare with \`math.isclose(a, b)\`; round for *display*; use \`Decimal\` or integer cents for money; use \`Fraction\` for exact ratios. This isn't a Python bug — every language using IEEE 754 floats behaves the same way.` },
      ],
    },
    alt: 'Three rows. Typing 0.1 and 0.2 each stores the nearest binary float, slightly above the true value. Adding the two stored values and rounding gives a float slightly above 0.3. Typing 0.3 directly stores a float slightly below 0.3. Comparing the sum with the stored 0.3 using == gives False because they are different floats.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`**Ints are exact.** Python stores as many digits as the number needs. \`2 ** 100\` is computed exactly, and so is \`2 ** 10_000\` (about three thousand digits). There's no "largest int".`,
      py`**Floats are approximate.** A float has a fixed size, so it can only hold about **15–17 significant digits**, and only numbers that are sums of powers of two are stored exactly (0.5, 0.25, 0.75 are exact; 0.1, 0.2, 0.3 aren't). Whole numbers are exact in a float up to 2⁵³ (9,007,199,254,740,992).`,
      py`**Rule of thumb:** count with ints, measure with floats, and handle money with integer cents or \`Decimal\`.`,
    ],
    technical: [
      py`Python's \`float\` is an IEEE 754 *binary64* ("double precision") number on essentially every platform: 1 sign bit, 11 exponent bits and 52 stored fraction bits (53 bits of precision). \`sys.float_info\` reports the limits: max ≈ \`1.7976931348623157e+308\`, \`epsilon\` (the gap between 1.0 and the next float) ≈ \`2.22e-16\`. Beyond the max you get \`inf\`; undefined results such as \`inf - inf\` give \`nan\` ("not a number"), which isn't even equal to itself.`,
      py`\`repr(x)\` for a float prints the **shortest** decimal string that converts back to exactly the same float. That's why \`0.1\` *displays* as \`0.1\` even though it's stored as 0.1000000000000000055…`,
      py`\`//\` and \`%\` are defined so that \`a == (a // b) * b + a % b\` always holds, with \`//\` rounding toward **minus infinity**. So \`-7 // 2\` is \`-4\` and \`-7 % 2\` is \`1\` (the remainder takes the sign of the divisor). \`int(-3.5)\` and \`math.trunc\` instead round toward **zero** (\`-3\`). Many other languages truncate toward zero for integer division, so ported code can differ for negative numbers.`,
      py`\`bool\` is a subclass of \`int\`: \`True + True\` is \`2\`. That's what lets \`sum(flags)\` count the \`True\`s — more in [booleans](lesson:booleans-and-comparisons).`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores an int as a sign plus an array of 30-bit "digits", so big ints use more memory and arithmetic on them gets slower as they grow. \`float\` is a C \`double\`. Small ints from -5 to 256 are pre-created and shared (see [variables](lesson:variables-and-names)). Other implementations may store numbers differently; the *results* of arithmetic are the same.` },
    ],
    production: [
      py`- **Money:** use \`Decimal\` (built from strings) or integers counting the smallest unit (cents). Never store currency in floats in a database or API. \`Decimal.quantize\` rounds to a fixed number of places with an explicit rounding mode, e.g. \`ROUND_HALF_UP\`.
- **Comparing measurements:** \`math.isclose(a, b, rel_tol=1e-9, abs_tol=0.0)\`; set \`abs_tol\` when comparing to zero, since a *relative* tolerance of a zero target is zero.
- **Summing many floats:** \`math.fsum\` gives a correctly rounded total. Since 3.12, the built-in \`sum()\` of floats also uses a more accurate algorithm on most builds, but a hand-written \`total += x\` loop still accumulates error.
- **Huge-number safety:** since 3.11, converting an int with more than 4300 digits to or from a decimal string raises \`ValueError: Exceeds the limit (4300 digits) for integer string conversion\` — a protection against denial-of-service attacks using giant numbers in input. \`sys.set_int_max_str_digits()\` changes it when you genuinely need more.
- **Heavy numeric work:** loops over millions of floats belong in NumPy or similar libraries, which work on arrays in compiled code. Beware: NumPy's fixed-size ints *can* overflow, unlike Python's.`,
    ],
  },
  mistakes: [
    {
      title: 'Comparing floats with ==',
      wrong: { code: py`total = 0.1 + 0.2
print(total == 0.3)          # False`, lang: 'python' },
      right: { code: py`import math

total = 0.1 + 0.2
print(math.isclose(total, 0.3))   # True`, lang: 'python' },
      explanation: py`Floats are approximations, so tiny errors are normal. Compare with a tolerance (\`math.isclose\`), or use \`Decimal\`/ints when you need exact equality.`,
    },
    {
      title: 'Using ^ for "to the power of"',
      wrong: { code: py`area = 4 ^ 2
print(area)    # 6 ?!`, lang: 'python' },
      right: { code: py`area = 4 ** 2
print(area)    # 16`, lang: 'python' },
      explanation: py`In Python, \`^\` is *bitwise XOR*, an operation on the binary digits — not power. It silently gives a wrong answer. Power is \`**\` (or \`pow()\`).`,
    },
    {
      title: 'Converting money to cents with int()',
      wrong: { code: py`price = 4.35
cents = int(price * 100)
print(cents)    # 434 — a cent disappeared`, lang: 'python' },
      right: { code: py`price = 4.35
cents = round(price * 100)
print(cents)    # 435`, lang: 'python' },
      explanation: py`\`4.35 * 100\` is \`434.99999999999994\` in binary floating point, and \`int()\` chops the fraction off. \`round()\` goes to the nearest whole number. Best of all, avoid floats for money in the first place.`,
    },
    {
      title: 'Expecting round() to always round .5 up',
      wrong: { code: py`print(round(2.5))       # expecting 3, prints 2
print(round(2.675, 2))  # expecting 2.68, prints 2.67`, lang: 'python' },
      right: { code: py`from decimal import Decimal, ROUND_HALF_UP

price = Decimal("2.675")
print(price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))   # 2.68`, lang: 'python' },
      explanation: py`\`round()\` uses round-half-to-even, and many decimal halves aren't exactly representable as floats anyway. When a rule like "half up" is a requirement (invoices, grades), use \`Decimal\` with an explicit rounding mode.`,
    },
    {
      title: 'Using / where a whole number is required',
      wrong: { code: py`half = 10 / 2
for i in range(half):    # TypeError: 'float' object cannot be interpreted as an integer
    print(i)`, lang: 'python' },
      right: { code: py`half = 10 // 2
for i in range(half):
    print(i)`, lang: 'python' },
      explanation: py`\`/\` always returns a float (\`5.0\`), even when the division is exact. \`range()\`, list positions and repetition counts need ints — use \`//\`.`,
    },
    {
      title: 'Forgetting that ** beats unary minus',
      wrong: { code: py`x = -3
print(-3 ** 2)   # -9`, lang: 'python' },
      right: { code: py`x = -3
print(x ** 2)       # 9
print((-3) ** 2)    # 9`, lang: 'python' },
      explanation: py`\`-3 ** 2\` means \`-(3 ** 2)\`. Use brackets to square a negative literal. (A variable that *holds* \`-3\` is fine: \`x ** 2\` is \`9\`.)`,
    },
  ],
  debugging: [
    {
      symptom: py`ZeroDivisionError: division by zero`,
      cause: py`Dividing by zero with \`/\`, \`//\` or \`%\` — usually an empty list (\`len(items) == 0\`) or a count that hasn't been set yet.`,
      fix: py`Check the divisor before dividing and decide what *should* happen (a default, or a clear \`ValueError\`). See [reading errors](lesson:reading-errors).`,
    },
    {
      symptom: py`TypeError: 'float' object cannot be interpreted as an integer`,
      cause: py`A float was passed where an int is required — \`range(10 / 2)\`, \`"-" * (width / 2)\`.`,
      fix: py`Use \`//\` for whole-number division, or convert deliberately with \`int()\`, \`round()\`, \`math.floor()\` or \`math.ceil()\`.`,
    },
    {
      symptom: py`Output like 0.30000000000000004 or 9.899999999999999`,
      cause: py`Normal floating-point representation error, made visible because \`print\` shows the shortest exact representation.`,
      fix: py`Round for display (\`round(x, 2)\` or \`f"{x:.2f}"\`), compare with \`math.isclose\`, and use \`Decimal\` where exact decimals matter.`,
    },
    {
      symptom: py`ValueError: expected a nonnegative input, got -1.0`,
      cause: py`\`math.sqrt\` of a negative number (in older Pythons the message is \`math domain error\`).`,
      fix: py`Check your inputs, use \`abs()\` if the sign is irrelevant, or \`cmath.sqrt\` if you really want complex numbers.`,
    },
    {
      symptom: py`ValueError: Exceeds the limit (4300 digits) for integer string conversion; use sys.set_int_max_str_digits() to increase the limit`,
      cause: py`Printing or \`str()\`-ing an enormous int (3.11+ safety limit).`,
      fix: py`Usually a sign of a runaway calculation. If the size is genuine, raise the limit with \`sys.set_int_max_str_digits()\`.`,
    },
  ],
  bestPractices: [
    'Use ints for counting, floats for measurements, and Decimal or integer cents for money.',
    'Never compare floats with ==; use math.isclose.',
    'Round only for display, at the end — keep full precision in the calculation.',
    'Use // and % (or divmod) for "how many whole …" and "how many left over" questions.',
    'Add brackets whenever precedence might confuse a reader, especially with ** and negatives.',
    'Write large literals with underscores: 1_000_000 is easier to check than 1000000.',
    'Create Decimal values from strings, never from floats.',
  ],
  useCases: [
    'Converting units: seconds → hours/minutes/seconds with divmod.',
    'Shopping carts and invoices with integer cents or Decimal.',
    'Statistics and measurements (averages, temperatures) with float and math.',
    'Checking even/odd and cycling through positions with % (n % 2, i % len(items)).',
    'Cryptography and exact combinatorics with Python’s arbitrary-precision ints.',
  ],
  comparison: {
    title: 'Which number type?',
    headers: ['', 'int', 'float', 'Decimal', 'Fraction'],
    rows: [
      ['example', '42', '3.14', 'Decimal("19.99")', 'Fraction(1, 3)'],
      ['exact?', 'yes', 'no — binary approximation', 'yes, for decimal values', 'yes, for any ratio'],
      ['range', 'unlimited', 'about ±1.8e308, 15–17 significant digits', 'configurable precision', 'unlimited'],
      ['speed', 'fast', 'fastest (hardware)', 'slower', 'slower'],
      ['use for', 'counts, positions, IDs, cents', 'measurements, science, graphics', 'money, invoices, tax', 'exact ratios, maths teaching'],
    ],
    note: py`Mixing int with float gives a float. Decimal mixes with int but not with float (\`TypeError\`), which stops accidental precision loss.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'numbers-and-math-q1',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print(7 / 2, 7 // 2, 7 % 2)`,
      answer: '3.5 3 1',
      accept: ['3.5 3 1'],
      explanation: py`\`/\` is true division (\`3.5\`, a float). \`//\` floors to a whole number (\`3\`). \`%\` is the remainder: \`7 - 3 * 2 = 1\`.`,
    },
    {
      id: 'numbers-and-math-q2',
      type: 'output',
      prompt: 'Predict the output — careful with the negative number.',
      code: py`print(-7 // 2, -7 % 2)`,
      options: [
        { text: '`-3 -1`', why: 'That is truncation toward zero (what C or Java do). Python’s // rounds toward minus infinity.' },
        '`-4 1`',
        { text: '`-3.5 1`', why: '// never gives a fractional answer; that would be / .' },
        { text: '`-4 -1`', why: 'In Python, % takes the sign of the divisor (2 is positive), so the remainder is 1.' },
      ],
      answer: 1,
      explanation: py`\`-7 / 2\` is \`-3.5\`; flooring goes *down* to \`-4\`. Then \`-7 % 2\` is whatever makes \`(-4) * 2 + r == -7\` true: \`r = 1\`.`,
    },
    {
      id: 'numbers-and-math-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print(round(2.5), round(3.5), round(-2.5))`,
      options: [
        { text: '`3 4 -3`', why: 'Python does not round halves away from zero. It rounds exact halves to the nearest even number.' },
        '`2 4 -2`',
        { text: '`2.0 4.0 -2.0`', why: 'round() with no second argument returns an int, not a float.' },
        { text: '`3 4 -2`', why: '2.5 is exactly halfway between 2 and 3; the even neighbour is 2.' },
      ],
      answer: 1,
      explanation: py`Round half to **even**: 2.5 → 2, 3.5 → 4, -2.5 → -2. Over many values this avoids always pushing results upward.`,
    },
    {
      id: 'numbers-and-math-q4',
      type: 'bug',
      prompt: 'A checkout says the 10%-discounted total "isn’t 0.3" even though the maths is right. Click the line with the real problem.',
      code: py`subtotal = 0.1 + 0.2
target = 0.3
if subtotal == target:
    print("Totals match")
else:
    print("Mismatch!")`,
      answerLine: 3,
      explanation: py`Comparing floats with \`==\` fails because \`0.1 + 0.2\` is \`0.30000000000000004\`. Use \`math.isclose(subtotal, target)\` — or, for money, \`Decimal\` or integer cents so the values are exact.`,
    },
    {
      id: 'numbers-and-math-q5',
      type: 'fill',
      prompt: 'Fill the blank so the program prints `2 5` (125 minutes is 2 hours and 5 minutes) using one built-in function.',
      code: py`hours, minutes = ___(125, 60)
print(hours, minutes)`,
      answer: [['divmod']],
      explanation: py`\`divmod(125, 60)\` returns \`(125 // 60, 125 % 60)\` = \`(2, 5)\`, and the tuple is unpacked into two names.`,
    },
    {
      id: 'numbers-and-math-q6',
      type: 'mcq',
      prompt: 'What is the value of `2 ** 3 ** 2`?',
      options: [
        { text: '64', why: 'That would be (2 ** 3) ** 2. But ** is right-associative: it groups from the right.' },
        '512',
        { text: '36', why: '** is power, not multiplication — and it groups from the right.' },
        { text: 'A SyntaxError', why: 'Chaining ** is valid Python.' },
      ],
      answer: 1,
      explanation: py`\`**\` groups right to left: \`2 ** (3 ** 2)\` = \`2 ** 9\` = \`512\`. Every other arithmetic operator groups left to right. Use brackets to make your intent obvious.`,
    },
    {
      id: 'numbers-and-math-q7',
      type: 'short',
      prompt: 'Explain why `0.1 + 0.2 == 0.3` is `False` in Python, and name two ways to deal with it.',
      answer: py`Floats are stored in binary, and 0.1, 0.2 and 0.3 have no exact binary representation, so each is stored as the nearest float. The rounding errors don't cancel out: 0.1 + 0.2 lands on a float slightly above 0.3, while the literal 0.3 is slightly below. Ways to deal with it: compare with math.isclose(); round for display only; use decimal.Decimal (from strings) or integer cents for money; use fractions.Fraction for exact ratios.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'time-splitter',
      title: 'Seconds to h/min/s',
      difficulty: 'beginner',
      prompt: py`\`total_seconds = 7384\` is the length of a film. Compute:

- \`hours\` — the whole hours;
- \`minutes\` — the whole minutes left after the hours;
- \`seconds\` — the seconds left after that.

Then print exactly \`2 h 3 min 4 s\` (use \`print(hours, "h", minutes, "min", seconds, "s")\`).

All three must be **ints**, and the tests also try another value of \`total_seconds\`, so compute from the name.`,
      files: {
        'main.py': py`total_seconds = 7384

# TODO: split total_seconds into hours, minutes and seconds
hours = 0
minutes = 0
seconds = 0

print(hours, "h", minutes, "min", seconds, "s")
`,
      },
      hints: [
        'There are 3600 seconds in an hour and 60 in a minute. Which operator gives "how many whole hours"? Which gives "what is left over"?',
        'hours = total_seconds // 3600; the remaining seconds are total_seconds % 3600 — split those into minutes and seconds the same way.',
        'hours, rest = divmod(total_seconds, 3600)\nminutes, seconds = divmod(rest, 60)',
      ],
      solution: {
        explanation: py`\`divmod(7384, 3600)\` returns \`(2, 184)\`: 2 whole hours and 184 seconds left over. \`divmod(184, 60)\` splits that into \`(3, 4)\`: 3 minutes and 4 seconds. Floor division and remainder are the natural tools for "how many whole units, and what's left over". Because \`//\` and \`%\` on ints give ints, the results are exact — no rounding needed. (With \`/\` you'd get floats like \`2.051111…\`.)`,
        files: {
          'main.py': py`total_seconds = 7384

hours, rest = divmod(total_seconds, 3600)
minutes, seconds = divmod(rest, 60)

print(hours, "h", minutes, "min", seconds, "s")
`,
        },
      },
      tests: [
        { name: '7384 s is 2 h 3 min 4 s', code: py`assert (hours, minutes, seconds) == (2, 3, 4)` },
        { name: 'all three are ints', code: py`assert all(type(v) is int for v in (hours, minutes, seconds)), 'Use // and % (or divmod) so the results stay ints'` },
        { name: 'prints the exact line', code: py`assert output.strip() == "2 h 3 min 4 s"` },
        {
          name: 'works for 3661 seconds',
          code: py`check = {}
capture(exec, files['main.py'].replace('total_seconds = 7384', 'total_seconds = 3661'), check)
assert (check['hours'], check['minutes'], check['seconds']) == (1, 1, 1), 'Compute from total_seconds instead of typing the answers'`,
        },
      ],
    },
    {
      id: 'paint-calculator',
      title: 'Paint calculator',
      difficulty: 'beginner',
      prompt: py`You're painting a wall \`width = 4.5\` metres wide and \`height = 2.4\` metres high. One tin of paint covers \`coverage = 5\` square metres.

1. Set \`area\` to the wall's area **rounded to 2 decimal places** (use \`round\`).
2. Set \`tins\` to the number of tins to buy — an **int**, rounded **up** (you can't buy part of a tin).
3. Print exactly:

\`\`\`text
Area: 10.8 m2
Tins: 3
\`\`\`

The tests also try other wall sizes.`,
      files: {
        'main.py': py`import math

width = 4.5
height = 2.4
coverage = 5

# TODO: compute area (rounded to 2 places) and tins (rounded up)
area = 0
tins = 0

print("Area:", area, "m2")
print("Tins:", tins)
`,
      },
      hints: [
        'Run width * height on its own first: 4.5 * 2.4 is 10.799999999999999 as a float. That is why the task asks you to round the area.',
        'area = round(width * height, 2). For tins you need to round area / coverage UP — the math module has a function for that.',
        'area = round(width * height, 2)\ntins = math.ceil(area / coverage)',
      ],
      solution: {
        explanation: py`\`4.5 * 2.4\` is \`10.799999999999999\` in binary floating point, so \`round(..., 2)\` cleans it to \`10.8\` for display. \`10.8 / 5\` is \`2.16\` tins — but shops sell whole tins, and 2 wouldn't be enough, so \`math.ceil\` rounds **up** to \`3\` and returns an int. (\`round(2.16)\` would give 2 and \`//\` would also round down — both leave a patch of bare wall.)`,
        files: {
          'main.py': py`import math

width = 4.5
height = 2.4
coverage = 5

area = round(width * height, 2)
tins = math.ceil(area / coverage)

print("Area:", area, "m2")
print("Tins:", tins)
`,
        },
      },
      tests: [
        { name: 'area is 10.8', code: py`assert area == 10.8` },
        { name: 'tins is the int 3', code: py`assert tins == 3 and type(tins) is int` },
        { name: 'prints both lines', code: py`assert output == "Area: 10.8 m2\nTins: 3\n"` },
        {
          name: 'a 3 m × 2 m wall needs 2 tins',
          code: py`check = {}
src = files['main.py'].replace('width = 4.5', 'width = 3').replace('height = 2.4', 'height = 2')
capture(exec, src, check)
assert check['area'] == 6 and check['tins'] == 2, 'Compute from width, height and coverage'`,
        },
        {
          name: 'exactly 10 m² needs exactly 2 tins',
          code: py`check = {}
src = files['main.py'].replace('width = 4.5', 'width = 5').replace('height = 2.4', 'height = 2')
capture(exec, src, check)
assert check['tins'] == 2, 'Round up only when there is a remainder (math.ceil does this)'`,
        },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'numbers-and-math-float-precision',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why does `0.1 + 0.2` print `0.30000000000000004` in Python? Is it a bug?',
      answer: 'Not a bug. Python floats are IEEE 754 binary64 numbers; 0.1 and 0.2 have no exact binary representation, so each is stored as the nearest representable value, and their sum rounds to a float just above 0.3. Every language using IEEE 754 doubles does the same. Compare with math.isclose and use Decimal for exact decimal work.',
      explanation: py`Just as 1/3 can't be written exactly in decimal, 1/10 can't be written exactly in binary. Python's \`repr\` prints the shortest string that round-trips to the same float, so the tiny error becomes visible in the last digit. \`Decimal(0.1)\` reveals the exact stored value.`,
      whyAsked: 'A classic screen for understanding how computers represent numbers — relevant to finance, data and testing.',
      mistakes: ['Calling it a Python bug', 'Suggesting round() fixes comparisons in general', 'Suggesting Decimal(0.1) instead of Decimal("0.1")'],
      followUps: ['How would you compare two floats safely?', 'How would you store prices?', 'Why does print(0.1) show 0.1 if it isn’t exact?'],
      modelAnswer: 'It is expected floating-point behaviour, not a bug. Python’s float is an IEEE 754 double, which stores numbers in binary with 53 bits of precision, and decimal fractions like 0.1 and 0.2 have no exact binary form — like one third in decimal. So each is stored as the nearest representable value, the sum is rounded again, and it ends up just above 0.3, while the literal 0.3 is just below. Python prints the shortest string that maps back to that float, so you see 0.30000000000000004. In practice I compare floats with math.isclose and use Decimal or integer cents for money.',
    },
    {
      id: 'numbers-and-math-floor-negative',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why might a C or Java programmer expect something else?',
      code: { lang: 'python', code: py`print(-7 // 2, -7 % 2, int(-7 / 2))` },
      options: ['-3 -1 -3', '-4 1 -3', '-4 1 -4', '-3 1 -3'],
      correctOption: 1,
      answer: '-4 1 -3. Python’s // floors toward minus infinity and % takes the sign of the divisor, keeping a == (a // b) * b + a % b. int() truncates toward zero. C and Java integer division truncate toward zero, giving -3 and -1.',
      explanation: py`Python chose floor semantics so that \`%\` with a positive divisor always returns a value in \`range(b)\` — handy for things like "day of week" calculations with negative offsets. \`math.fmod\` gives the C-style remainder if you need it.`,
      whyAsked: 'Off-by-one errors with negative numbers are a real source of bugs when porting code between languages.',
      mistakes: ['Assuming // truncates', 'Thinking int() and // round the same way'],
      followUps: ['What does math.fmod(-7, 2) return?', 'Why is floor semantics useful for modular arithmetic like clock times?'],
      modelAnswer: 'It prints -4, 1 and -3. In Python, floor division rounds toward minus infinity, so -3.5 floors to -4, and the modulo is defined so that (a // b) * b + a % b equals a — which makes -7 % 2 equal to 1, taking the sign of the divisor. int() is different: it truncates toward zero, so int(-3.5) is -3. C and Java truncate integer division toward zero, so they would give -3 and -1; when porting code I watch for that, and math.fmod gives the C-style remainder.',
    },
    {
      id: 'numbers-and-math-money-types',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare float, Decimal and Fraction. Which would you use for a shopping cart, a physics simulation, and an exact probability calculation?',
      answer: 'Shopping cart: Decimal (built from strings) or integer cents — exact decimal amounts and explicit rounding rules. Physics: float — fast hardware arithmetic, and measurements are approximate anyway. Exact probability: Fraction — exact rationals like 1/3 with no rounding at all.',
      explanation: py`Float is fast but binary and approximate. Decimal is exact for decimal values, lets you set precision and rounding (\`quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)\`), but is slower. Fraction stores numerator/denominator exactly but denominators can grow large. Decimal refuses to mix with float, which prevents silent precision loss.`,
      code: { lang: 'python', code: py`from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction

print(Decimal("19.99") * 3)                                          # 59.97
print(Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 2.68
print(Fraction(1, 6) + Fraction(1, 3))                              # 1/2` },
      whyAsked: 'Choosing numeric types correctly prevents real financial and correctness bugs.',
      mistakes: ['Using float for currency', 'Creating Decimal from a float', 'Not mentioning rounding modes'],
      followUps: ['How would you store money in a database?', 'What is the default rounding mode of Decimal? (ROUND_HALF_EVEN)', 'Why not just round floats to 2 places everywhere?'],
      modelAnswer: 'For a shopping cart I would use Decimal created from strings, or store integer cents, because money must be exact and needs explicit rounding rules like half-up on invoices. For a physics simulation I would use float: it is hardware-fast and the inputs are approximate measurements anyway, so I just compare with tolerances. For exact probabilities I would use Fraction, which keeps numerators and denominators exactly, so one third stays one third. The trade-off is speed: Decimal and Fraction are much slower than float, so I use them where exactness actually matters.',
    },
    {
      id: 'numbers-and-math-split-cents',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `split_cents(total_cents, people)` that splits a bill into a list of integer shares that add up **exactly** to the total, with shares differing by at most 1 cent (larger shares first). `split_cents(1000, 3)` → `[334, 333, 333]`.',
      answer: 'base, extra = divmod(total_cents, people); return [base + 1] * extra + [base] * (people - extra)',
      explanation: py`Dividing 1000 by 3 can't be exact, so someone pays a cent more. \`divmod\` gives the base share and how many cents are left over; giving one extra cent to the first \`extra\` people distributes the remainder. Integer arithmetic guarantees the sum equals the total — something \`round(total / people, 2)\` with floats can't promise.`,
      starter: { files: { 'main.py': py`def split_cents(total_cents, people):
    # TODO: return a list of int shares that add up exactly to total_cents
    share = total_cents / people
    return [share] * people


print(split_cents(1000, 3))
` } },
      tests: [
        { name: 'split_cents(1000, 3)', code: py`assert split_cents(1000, 3) == [334, 333, 333]` },
        { name: 'shares add up exactly', code: py`assert sum(split_cents(1001, 4)) == 1001` },
        { name: 'shares are ints differing by at most 1', code: py`shares = split_cents(1001, 4)
assert all(type(s) is int for s in shares) and max(shares) - min(shares) <= 1` },
        { name: 'even split', code: py`assert split_cents(900, 3) == [300, 300, 300]` },
      ],
      solution: { files: { 'main.py': py`def split_cents(total_cents, people):
    base, extra = divmod(total_cents, people)
    return [base + 1] * extra + [base] * (people - extra)


print(split_cents(1000, 3))
` } },
      hints: ['divmod(total_cents, people) gives the base share and the number of leftover cents.', 'Give one extra cent to as many people as there are leftover cents.'],
      whyAsked: 'Tests integer arithmetic, divmod and awareness that money must add up exactly.',
      mistakes: ['Using float division and rounding each share, so the total drifts', 'Giving the whole remainder to one person', 'Returning floats'],
      followUps: ['How would you split by weights (e.g. 50/30/20) exactly? (largest remainder method)', 'How would you do this with Decimal amounts?'],
      modelAnswer: 'I work in integer cents so everything stays exact. divmod(total_cents, people) gives the base share and the number of cents left over, which is always less than the number of people. Then I return a list where the first extra people get base plus one and the rest get base, so the shares differ by at most a cent and the sum is exactly the total. Using float division and rounding each share would break that guarantee, which is exactly the kind of bug that makes invoices not add up.',
    },
    {
      id: 'numbers-and-math-big-ints',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Python ints "never overflow". How is that possible, and what are the costs and limits?',
      answer: 'Python ints are arbitrary precision: CPython stores them as a variable-length array of 30-bit digits and grows it as needed. Costs: more memory per int than a machine integer, slower arithmetic as numbers grow, and every int is a heap object. Since 3.11 there is also a default 4300-digit limit on int↔decimal-string conversion to prevent denial-of-service.',
      explanation: py`Arbitrary precision is a language guarantee; the storage layout is a CPython detail. Small ints (-5..256) are cached. Very large multiplications use faster algorithms (Karatsuba) in CPython, but conversion of huge ints to decimal strings was quadratic, which is why untrusted input like \`int("9" * 1_000_000)\` became a DoS vector and the limit was introduced (\`sys.set_int_max_str_digits\`).`,
      code: { lang: 'python', code: py`import sys
print((2 ** 100).bit_length())        # 101 bits — no overflow
print(sys.getsizeof(1), sys.getsizeof(2 ** 100))   # CPython: bigger ints use more bytes
print(sys.get_int_max_str_digits())   # 4300 by default (3.11+)` },
      whyAsked: 'Shows depth: language guarantee vs implementation, performance awareness, and a real security issue.',
      mistakes: ['Saying ints are 64-bit like in C', 'Not knowing the string-conversion limit', 'Assuming NumPy ints behave the same (they can overflow)'],
      followUps: ['Why are bools ints?', 'How do NumPy integers differ?', 'Why was the conversion limit treated as a security fix?'],
      modelAnswer: 'Python ints are arbitrary precision: the language guarantees they grow as large as needed, and CPython implements that by storing a sign and a variable-length array of 30-bit digits. The cost is that every int is a heap object, larger values use more memory, and arithmetic slows down as the numbers grow, unlike fixed 64-bit machine integers. There is also a safety limit since 3.11: converting an int with more than 4300 digits to or from a decimal string raises ValueError, because that conversion is quadratic and was usable for denial-of-service; sys.set_int_max_str_digits adjusts it. Libraries like NumPy use fixed-size integers that can overflow, so that guarantee stops at the library boundary.',
    },
    {
      id: 'numbers-and-math-rounding-bug',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A customer complains that an invoice line of 2.675 was rounded to 2.67 instead of 2.68, and another of 0.125 to 0.12. The code uses `round(amount, 2)`. Explain and fix.',
      answer: 'Two effects: round() uses round-half-to-even (0.125 → 0.12, which is exactly representable), and 2.675 is stored as 2.67499999… in binary so it rounds down. Store amounts as Decimal from strings and use quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), or work in integer cents.',
      explanation: py`\`round(0.125, 2)\` hits an exact binary half and applies banker's rounding. \`round(2.675, 2)\` never sees a half at all. Business rules ("round half up") must be implemented explicitly — Decimal makes the rule visible in the code and testable.`,
      code: { lang: 'python', code: py`from decimal import Decimal, ROUND_HALF_UP

def to_cents(amount_text):
    return Decimal(amount_text).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

print(to_cents("2.675"), to_cents("0.125"))   # 2.68 0.13` },
      whyAsked: 'A realistic money bug that tests both float representation and rounding-mode knowledge.',
      mistakes: ['Blaming only one of the two causes', 'Adding a tiny epsilon before rounding', 'Converting the float to Decimal (Decimal(2.675)) instead of using the string'],
      followUps: ['What is the default rounding mode for Decimal?', 'Where should rounding happen — per line or on the total?'],
      modelAnswer: 'There are two separate causes. round uses round-half-to-even, so an exact half like 0.125 goes to the even neighbour 0.12. And 2.675 isn’t an exact half at all as a float — it is stored as 2.67499 and so on — so it rounds down. The fix is to stop using floats for money: parse amounts into Decimal from strings and use quantize with ROUND_HALF_UP, or keep integer cents. I would also agree with the business where rounding happens, per line or on the total, and cover it with tests.',
    },
    {
      id: 'numbers-and-math-modulo-uses',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Give three practical uses of the `%` operator.',
      answer: 'Even/odd checks (n % 2 == 0); wrapping around a cycle, such as the next player or day of the week ((i + 1) % len(players)); and splitting units with //, e.g. seconds into minutes and seconds (secs // 60, secs % 60). Also "every Nth item" (i % 10 == 0).',
      explanation: py`\`%\` answers "what's left over?". With a positive divisor, Python guarantees the result is in \`range(divisor)\`, even for negative numbers, which makes wrap-around safe: \`(0 - 1) % 7\` is \`6\`.`,
      code: { lang: 'python', code: py`days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
today = 6                                 # Sun
print(days[(today + 1) % 7])              # Mon — wraps around
print(days[(0 - 1) % 7])                  # Sun — works backwards too` },
      whyAsked: 'Checks practical fluency with an operator that appears in many algorithm questions.',
      mistakes: ['Only knowing even/odd', 'Not knowing how % behaves with negatives'],
      followUps: ['What does (0 - 1) % 7 give in Python, and in C?', 'How would you format seconds as mm:ss?'],
      modelAnswer: 'The most common is parity: n % 2 == 0 means even. Another is wrapping around a cycle — the next player is (i + 1) % len(players), and the day after Sunday is index (6 + 1) % 7, which is 0. A third is unit conversion together with floor division: seconds // 60 minutes and seconds % 60 left over, or divmod to get both. In Python the result with a positive divisor is always between 0 and the divisor minus one, even for negative numbers, so going backwards with (i - 1) % n is safe too.',
    },
  ],

  takeaways: [
    'int is exact and unlimited; float is a fast IEEE 754 binary approximation with about 15–17 significant digits.',
    '/ always returns a float; // floors toward minus infinity; % is the matching remainder; divmod gives both.',
    '** binds tighter than unary minus (-2 ** 2 is -4) and groups right to left (2 ** 3 ** 2 is 512).',
    'round() rounds exact halves to even and returns an int without ndigits; floats like 2.675 aren’t what they look like.',
    'Never compare floats with ==; use math.isclose. Round only for display.',
    'Use Decimal (from strings) or integer cents for money, Fraction for exact ratios, and math for ceil, floor, sqrt and friends.',
  ],
}
