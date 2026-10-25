// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const RIDE_CHECKER = py`# Can this visitor ride the roller coaster?
height_cm = 132
age = 11
with_adult = False
has_ticket = True

MIN_HEIGHT = 120
MAX_HEIGHT = 195

tall_enough = MIN_HEIGHT <= height_cm <= MAX_HEIGHT    # a chained comparison
old_enough = age >= 12 or with_adult                    # either one will do
can_ride = has_ticket and tall_enough and old_enough    # all three are needed

print("Tall enough:", tall_enough)
print("Old enough:", old_enough)
print("Can ride:", can_ride)

nickname = ""
display_name = nickname or "Visitor"    # or returns the first truthy operand
print("Welcome,", display_name)
`

export default {
  id: 'booleans-and-comparisons',
  title: 'Booleans, comparisons & logical operators',
  summary: 'Comparisons produce True or False; and, or and not combine them — lazily, returning one of their operands — and chaining (0 < x < 10) reads like maths.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['numbers-and-math'],
  related: ['none-and-truthiness', 'if-statements', 'while-loops', 'type-conversion', 'operator-overloading', 'match-statement'],
  tags: ['bool', 'boolean', 'True', 'False', 'comparison', 'comparison operators', '==', '!=', '<', '>', 'chained comparison', 'and', 'or', 'not', 'logical operators', 'short-circuit', 'precedence', 'truth table', 'bitwise'],
  apis: [
    { name: 'True / False', summary: 'The two values of type bool. Capitalised keywords; bool is a subclass of int (True == 1).' },
    { name: '== and !=', summary: 'Equal and not equal: compare values. Never confuse == (compare) with = (assign).' },
    { name: '<, <=, >, >=', summary: 'Ordering comparisons for numbers, strings (alphabetical by code point) and more.' },
    { name: 'a < b < c', summary: 'Chained comparison: means a < b and b < c, with b evaluated only once.' },
    { name: 'x and y', summary: 'If x is falsy, returns x without evaluating y; otherwise returns y.' },
    { name: 'x or y', summary: 'If x is truthy, returns x without evaluating y; otherwise returns y.' },
    { name: 'not x', summary: 'Always returns a bool: True if x is falsy, False if it is truthy.' },
    { name: 'bool(x)', summary: 'Converts any value to True or False using the truthiness rules.' },
  ],
  docs: [
    { label: 'Built-in types — truth value testing, boolean operations, comparisons', url: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing' },
    { label: 'Language reference — comparisons (including chaining)', url: 'https://docs.python.org/3/reference/expressions.html#comparisons' },
    { label: 'Language reference — boolean operations', url: 'https://docs.python.org/3/reference/expressions.html#boolean-operations' },
    { label: 'Language reference — operator precedence', url: 'https://docs.python.org/3/reference/expressions.html#operator-precedence' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Programs constantly ask yes/no questions: *Is the player out of lives? Is the basket empty? Is this password long enough?* The answers are **booleans** — values of type \`bool\`, which has exactly two values: \`True\` and \`False\` (capital T and F; they're keywords).`,
    py`You get booleans from **comparisons** (\`score > 100\`, \`name == "Ada"\`) and combine them with the **logical operators** \`and\`, \`or\` and \`not\`. Python adds two treats you won't find in every language:`,
    py`- **chained comparisons** — \`0 < temperature < 30\` reads exactly like maths;
- **short-circuiting** — \`and\` and \`or\` stop as soon as they know the answer, and they hand back one of their *operands*, not necessarily \`True\` or \`False\`. That enables neat idioms like \`name = nickname or "Visitor"\`.`,
    py`Booleans drive every decision your programs will make with [if statements](lesson:if-statements) and [while loops](lesson:while-loops). The closely related idea of *truthiness* — which values count as true — gets its own lesson: [None, truthiness & identity](lesson:none-and-truthiness).`,
  ],
  why: [
    py`Every rule in a program is a boolean expression in disguise: "free shipping if the total is at least £50 **or** the customer is a member", "show the warning if the battery is low **and** not charging". Writing these correctly — with the right operator, the right grouping and the right edge cases — is a core programming skill.`,
    py`And mistakes here are sneaky: \`if answer == "y" or "yes":\` is valid Python that is *always* true. In security code, a boolean slip can mean letting the wrong person in. Understanding exactly how \`and\`/\`or\` evaluate prevents that whole class of bugs.`,
  ],
  eli15: [
    py`A boolean is a light switch: **on** (\`True\`) or **off** (\`False\`). Nothing in between.`,
    py`A **comparison** is a question that flips the switch: "is 132 at least 120?" → \`True\`.`,
    py`**and** means *both*: you can ride if you have a ticket **and** you're tall enough. **or** means *at least one*: you're old enough if you're 12+ **or** you came with an adult. **not** flips the switch the other way.`,
    py`Python is also a bit lazy, in a smart way. For "ticket **and** tall enough", if you have no ticket it doesn't bother measuring you — the answer is already no. That laziness is called **short-circuiting**, and it's surprisingly useful.`,
  ],
  analogy: {
    title: 'The theme park entrance',
    body: [
      py`At a roller coaster, a staff member checks a list of rules. With **and**, they go down the list and stop at the *first* failed rule ("no ticket? next!") — no point measuring your height. With **or**, they stop at the *first* rule that passes ("you're 12? fine, no need to ask about an adult").`,
      py`And when they answer, they don't just say "yes" or "no" — they point at the thing that decided it: the missing ticket, or the adult standing next to you. That's why \`and\`/\`or\` return an *operand*, not a fresh \`True\`/\`False\`.`,
    ],
    mapping: [
      ['a rule on the checklist', 'a comparison: height_cm >= 120'],
      ['all rules must pass', 'and'],
      ['at least one rule must pass', 'or'],
      ['"you are NOT allowed if…"', 'not'],
      ['stopping at the first failed rule', 'and short-circuits on the first falsy operand'],
      ['stopping at the first rule that passes', 'or short-circuits on the first truthy operand'],
      ['pointing at what decided it', 'and/or return the deciding operand itself'],
      ['"between 120 and 195 cm"', 'chained comparison: 120 <= h <= 195'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'How and / or decide what to return',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'left', label: 'Evaluate x', note: 'in x and y / x or y', x: 110, y: 75, tone: 'yellow' },
        { id: 'test', label: 'Is x truthy?', note: 'bool(x)', x: 390, y: 75, tone: 'ink' },
        { id: 'retx', label: 'Return x', note: 'y never runs', x: 660, y: 75, tone: 'kraft' },
        { id: 'evaly', label: 'Evaluate y', note: 'only when needed', x: 390, y: 225, tone: 'blue' },
        { id: 'rety', label: 'Return y', note: 'as it is', x: 660, y: 225, tone: 'kraft' },
      ],
      edges: [
        { from: 'left', to: 'test' },
        { from: 'test', to: 'retx', label: 'decided' },
        { from: 'test', to: 'evaly', label: 'undecided' },
        { from: 'evaly', to: 'rety' },
      ],
      steps: [
        { focus: ['left'], text: py`Both \`x and y\` and \`x or y\` start the same way: Python evaluates the **left** operand, \`x\`, first.` },
        { focus: ['test'], edges: ['left->test'], text: py`Then it asks whether \`x\` is *truthy* (counts as true). \`False\`, \`0\`, \`0.0\`, \`""\`, \`None\` and empty collections are *falsy*; almost everything else is truthy.` },
        { focus: ['retx'], edges: ['test->retx'], text: py`Sometimes \`x\` alone **decides** the answer. For \`and\`: a falsy \`x\` makes the whole thing false. For \`or\`: a truthy \`x\` makes the whole thing true. Python returns **\`x\` itself** and never even evaluates \`y\` — that's **short-circuiting**.` },
        { focus: ['evaly'], edges: ['test->evaly'], text: py`Otherwise the answer depends entirely on \`y\`, so Python evaluates it.` },
        { focus: ['rety'], edges: ['evaly->rety'], text: py`…and returns \`y\` **as it is** — no conversion to \`True\`/\`False\`.` },
        { focus: ['retx', 'rety'], text: py`Examples: \`0 and 5\` → \`0\` · \`3 and 5\` → \`5\` · \`"" or "Visitor"\` → \`"Visitor"\` · \`"Ace" or "Visitor"\` → \`"Ace"\`. With comparisons as operands (\`a > 1 and b < 2\`), the operands are already bools, so you get a bool. \`not\` is different: it always returns a real \`True\` or \`False\`.` },
      ],
    },
    alt: 'Flow diagram. Evaluate x, then ask whether x is truthy. If x alone decides the result (falsy for and, truthy for or), return x and never evaluate y. Otherwise evaluate y and return y as it is.',
    caption: py`One diagram, two operators: they differ only in *which* value of \`x\` counts as "decided" — falsy for \`and\`, truthy for \`or\`.`,
  },
  syntax: [
    py`#### Comparison operators`,
    py`| operator | meaning | example | result |
|---|---|---|---|
| \`==\` | equal to | \`3 == 3.0\` | \`True\` |
| \`!=\` | not equal to | \`"a" != "A"\` | \`True\` |
| \`<\` | less than | \`2 < 10\` | \`True\` |
| \`<=\` | less than or equal | \`2 <= 2\` | \`True\` |
| \`>\` | greater than | \`"10" > "9"\` | \`False\` (text compares character by character) |
| \`>=\` | greater than or equal | \`4 >= 5\` | \`False\` |`,
    py`- \`=\` **assigns**, \`==\` **compares**. \`if x = 1:\` is a \`SyntaxError\` (Python even asks: *Maybe you meant '==' …?*).
- Numbers of different types compare by value: \`1 == 1.0\` is \`True\`. Text never equals a number: \`"1" == 1\` is \`False\`.
- Strings compare alphabetically **by Unicode code point**, so all capitals come before all lowercase letters: \`"Zebra" < "apple"\` is \`True\`, and \`"10" < "9"\` is \`True\` because \`"1"\` comes before \`"9"\`.
- Ordering unrelated types is an error: \`"1" < 1\` raises \`TypeError: '<' not supported between instances of 'str' and 'int'\`.
- \`is\` and \`in\` are comparison operators too: \`in\` tests membership (\`"a" in "cat"\`), and \`is\` tests identity — see [None & identity](lesson:none-and-truthiness).`,
    py`#### Chained comparisons`,
    { code: py`age = 15
print(13 <= age <= 19)      # True — same as (13 <= age) and (age <= 19)
print(1 < 3 > 2)            # True — valid, but confusing: avoid
low, x, high = 0, 7, 10
print(low < x < high)       # True — x is evaluated only once`, lang: 'python', title: 'chaining reads like maths' },
    py`#### and, or, not`,
    py`| x | y | x and y | x or y | not x |
|---|---|---|---|---|
| True | True | True | True | False |
| True | False | False | True | False |
| False | True | False | True | True |
| False | False | False | False | True |`,
    { code: py`has_ticket = True
tall_enough = False

print(has_ticket and tall_enough)   # False — both needed
print(has_ticket or tall_enough)    # True  — one is enough
print(not tall_enough)              # True

# and / or return one of their operands:
print(0 or "guest")      # guest   (0 is falsy, so or moves on)
print(3 and 7)           # 7       (3 is truthy, so and moves on)
print("" and 1 / 0)      # prints an empty line: "" decides; 1 / 0 never runs`, lang: 'python', title: 'logical operators' },
    py`#### Precedence (what binds tighter)`,
    py`From tightest to loosest: arithmetic (\`**\`, \`*\`, \`+\`…) → comparisons (\`<\`, \`==\`, \`in\`, \`is\`…) → \`not\` → \`and\` → \`or\`. So:`,
    py`- \`a + 1 > b * 2\` means \`(a + 1) > (b * 2)\`;
- \`not a == b\` means \`not (a == b)\`;
- \`a or b and c\` means \`a or (b and c)\`.`,
    { callout: 'tip', title: 'When in doubt, add brackets', text: py`\`(has_ticket or vip) and tall_enough\` and \`has_ticket or (vip and tall_enough)\` are different rules. Brackets make your intent explicit to Python *and* to the next reader.` },
    { callout: 'note', title: 'bool is a kind of int', text: py`\`True == 1\` and \`False == 0\`, and \`True + True\` is \`2\`. That's why \`sum(answers_correct)\` counts the \`True\` values in a list. Handy, but don't write \`x == True\` — just write \`x\` (or \`not x\`).` },
  ],
  walkthrough: {
    title: 'Reading the ride checker line by line',
    lang: 'python',
    code: RIDE_CHECKER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 5], text: py`Inputs: two ints and two booleans. \`True\`/\`False\` are written without quotes — \`"False"\` (in quotes) would be a string, and a non-empty string counts as true!` },
      { lines: [7, 8], text: py`Constants in \`UPPER_SNAKE_CASE\` give the magic numbers names (a convention from [variables](lesson:variables-and-names)).` },
      { lines: [10], text: py`A chained comparison: \`120 <= 132\` and \`132 <= 195\` are both true, so \`tall_enough\` is \`True\`.` },
      { lines: [11], text: py`\`age >= 12\` is \`False\`, so \`or\` looks at \`with_adult\` — also \`False\`. Result: \`False\`.` },
      { lines: [12], text: py`\`and\` needs every part to be true. \`has_ticket\` and \`tall_enough\` are \`True\`, but \`old_enough\` is \`False\`, so \`can_ride\` is \`False\`.` },
      { lines: [18, 20], text: py`\`nickname\` is the empty string, which is falsy, so \`or\` returns its right operand, \`"Visitor"\`. A classic default-value idiom — with a trap we'll meet in the interview questions.` },
    ],
  },
  playground: {
    title: 'Roller coaster checker',
    objective: 'Run it, then change the rules — bring an adult, add a VIP pass (mind the precedence!), and use chaining and short-circuiting.',
    files: { 'main.py': RIDE_CHECKER },
    expected: py`\`\`\`text
Tall enough: True
Old enough: False
Can ride: False
Welcome, Visitor
\`\`\``,
    experiments: [
      {
        id: 'bring-an-adult',
        task: py`The visitor brought a parent. Change one input so they can ride.`,
        hint: py`Look at line 4.`,
        tests: [{ name: 'the visitor can ride', code: py`assert 'Can ride: True' in output, 'Set with_adult = True'` }],
        explain: py`\`age >= 12 or with_adult\` is now \`False or True\` → \`True\`, and every part of the \`and\` chain is true. One input changed, two derived booleans changed.`,
      },
      {
        id: 'vip-pass',
        task: py`Add \`vip = True\` with the other inputs. VIP visitors don't need a ticket — but they must still be tall enough and old enough. Update \`can_ride\`.`,
        hint: py`You want "(ticket **or** VIP) **and** tall **and** old". Without brackets, \`has_ticket or vip and tall_enough and old_enough\` means \`has_ticket or (vip and …)\` — a ticket-holder of any height could ride!`,
        tests: [
          {
            name: 'a VIP without a ticket can ride',
            code: py`import re

def run_with(**values):
    src = files['main.py']
    for name, value in values.items():
        src = re.sub(rf'^{name} = .*$', f'{name} = {value!r}', src, count=1, flags=re.M)
    env = {}
    capture(exec, src, env)
    return env['can_ride']

assert 'vip' in ns, 'Add a variable named vip'
assert run_with(has_ticket=False, vip=True, with_adult=True) is True`,
          },
          {
            name: 'nobody who is too short can ride (check your brackets)',
            code: py`import re

def run_with(**values):
    src = files['main.py']
    for name, value in values.items():
        src = re.sub(rf'^{name} = .*$', f'{name} = {value!r}', src, count=1, flags=re.M)
    env = {}
    capture(exec, src, env)
    return env['can_ride']

assert 'vip' in ns, 'Add a variable named vip'
assert run_with(has_ticket=True, vip=False, with_adult=True, height_cm=100) is False, 'A too-short visitor with a ticket must not ride — group (has_ticket or vip) in brackets'`,
          },
        ],
        explain: py`\`can_ride = (has_ticket or vip) and tall_enough and old_enough\`. Because \`and\` binds tighter than \`or\`, the brackets are essential: without them, the expression reads as \`has_ticket or (vip and tall_enough and old_enough)\`, and anyone with a ticket would ride regardless of height. Precedence bugs like this are silent — no error, just a wrong (and here, unsafe) answer.`,
      },
      {
        id: 'is-teen',
        task: py`Add a variable \`is_teen\` that is \`True\` when \`age\` is from 13 to 19 inclusive. Use **one chained comparison**, and print it.`,
        hint: py`\`13 <= age <= 19\``,
        tests: [
          { name: 'is_teen matches the age', code: py`assert ns.get('is_teen') == (13 <= age <= 19), 'is_teen should be 13 <= age <= 19'` },
          { name: 'is_teen is a bool', code: py`assert type(is_teen) is bool` },
        ],
        explain: py`\`13 <= age <= 19\` means \`13 <= age and age <= 19\`, with \`age\` evaluated only once. Inclusive limits use \`<=\`; for "under 20" you could write \`13 <= age < 20\` — same result for whole numbers.`,
      },
      {
        id: 'safe-average',
        task: py`Add \`visits = 0\` and \`points = 50\`, then \`print("High average:", visits > 0 and points / visits > 10)\`. It runs fine! Now try swapping the two sides of the \`and\` (just to see), and swap them back.`,
        hint: py`With the comparison on the left, \`visits > 0\` is \`False\`, so \`and\` never evaluates the division.`,
        tests: [{ name: 'prints High average: False', code: py`assert 'High average: False' in output` }],
        explain: py`Short-circuiting makes \`visits > 0 and points / visits > 10\` a **guard**: the division only runs when it's safe. Swapped (\`points / visits > 10 and visits > 0\`), the division runs first and raises \`ZeroDivisionError\`. Order matters in \`and\`/\`or\` chains: put the cheap or protective check first.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch short-circuiting skip the right-hand side',
    props: {
      code: py`def check(label, result):
    print("checking", label)
    return result

print(check("A", False) and check("B", True))
print(check("C", True) or check("D", True))
print(check("E", True) and check("F", "done"))
`,
      notes: {
        1: '`check` prints which operand is being evaluated, then returns `result`. A spy for evaluation order.',
        5: '`A` is `False`, so `and` already knows the answer. `check("B", …)` is **never called** — watch the call stack.',
        6: '`C` is truthy, so `or` is decided and returns `True` without calling `check("D", …)`.',
        7: '`E` is truthy, so `and` must evaluate `F`, and returns **F’s value itself**: the string `"done"`, not `True`.',
      },
    },
    alt: 'A step-by-step trace. Line 5 calls check A, which prints "checking A" and returns False; check B is never called, so False is printed. Line 6 calls check C, which returns True; check D is never called; True is printed. Line 7 calls check E then check F, and prints "done", the value returned by F.',
    caption: py`Count the calls: six \`check\`s are written, but only four ever run. The output shows \`False\`, \`True\` and \`done\` — \`and\`/\`or\` return operands, not freshly made booleans.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`True\` and \`False\` are the only two \`bool\` objects that exist. Every comparison produces one of them.`,
      py`\`and\` and \`or\` are not functions: they're special syntax that controls *whether* the right side is evaluated at all. That's what makes guards like \`count > 0 and total / count > 5\` safe.`,
      py`A comparison doesn't need an \`if\` to be useful — it's just an expression with a value. \`is_adult = age >= 18\` stores the answer for later.`,
    ],
    technical: [
      py`**Chaining:** \`a < b < c\` compiles to "evaluate \`a < b\`; if false, the result is that false value; otherwise evaluate \`b < c\`". \`b\` is evaluated **once** — it matters if \`b\` is a function call. Any comparison operators can be chained (\`a == b == c\`, \`a < b <= c != d\`), even odd mixes like \`1 < 3 > 2\`.`,
      py`**Precedence:** comparisons all share one level, below arithmetic and bitwise operators, above \`not\`, \`and\`, \`or\` (and the conditional expression \`x if c else y\`). A trap: the bitwise operators \`&\` and \`|\` bind tighter than comparisons, so \`x > 1 & x > 2\` parses as \`x > (1 & x) > 2\`.`,
      py`**Returning operands:** \`x and y\` evaluates to \`x\` if \`x\` is falsy, else \`y\`; \`x or y\` evaluates to \`x\` if \`x\` is truthy, else \`y\`. Only \`not\` (and \`bool()\`) always produce a real \`bool\`.`,
      py`**Rich comparisons:** \`==\`, \`<\` and friends call special methods (\`__eq__\`, \`__lt__\`…) that classes can define — see [operator overloading](lesson:operator-overloading). They *may* return non-bools: NumPy compares arrays element-wise and returns an array, which is why \`if array_a == array_b:\` raises "the truth value of an array … is ambiguous".`,
      { callout: 'note', title: 'CPython detail', text: py`\`True\` and \`False\` are singletons in every implementation (the language guarantees exactly two bool objects). How the short-circuit is compiled — CPython uses conditional jump instructions in the bytecode, which you can see with \`dis\` — is an implementation detail.` },
    ],
    production: [
      py`- **Name your conditions.** \`is_eligible = age >= 18 and has_id and not banned\` and then \`if is_eligible:\` reads far better than a three-line \`if\`. Named booleans start with \`is_\`, \`has_\`, \`can_\`, \`should_\`.
- **Use \`in\` for "one of these values"**: \`if role in {"admin", "editor"}:\` instead of a chain of \`or\`s — shorter, and immune to the \`== "a" or "b"\` bug.
- **\`any()\` / \`all()\`** answer "is at least one / is every item true?" over a whole collection and short-circuit too: \`all(score >= 50 for score in scores)\`.
- **Be careful with \`x or default\`** when a falsy value like \`0\` or \`""\` is valid input — use an explicit \`if x is None\` check instead.
- **Security-sensitive checks** (permissions, authentication) deserve tests for every combination of inputs, because precedence and \`or\` bugs fail *open* — silently granting access.`,
    ],
  },
  mistakes: [
    {
      title: 'Comparing one value with several using or',
      wrong: { code: py`answer = "no"
if answer == "y" or "yes":          # always true!
    print("Proceeding...")`, lang: 'python' },
      right: { code: py`answer = "no"
if answer in ("y", "yes"):
    print("Proceeding...")`, lang: 'python' },
      explanation: py`This reads as \`(answer == "y") or "yes"\`. The non-empty string \`"yes"\` is truthy, so the condition is always true. Repeat the comparison (\`answer == "y" or answer == "yes"\`) or, better, use \`in\`.`,
    },
    {
      title: 'Forgetting brackets when mixing and with or',
      wrong: { code: py`has_ticket, vip, tall_enough = True, False, False
can_ride = has_ticket or vip and tall_enough      # True — but they're too short!`, lang: 'python' },
      right: { code: py`has_ticket, vip, tall_enough = True, False, False
can_ride = (has_ticket or vip) and tall_enough    # False`, lang: 'python' },
      explanation: py`\`and\` binds tighter than \`or\`, so the first version means \`has_ticket or (vip and tall_enough)\`. Bracket every mixed \`and\`/\`or\` expression.`,
    },
    {
      title: 'Using = instead of ==',
      wrong: { code: py`if score = 100:
    print("Perfect!")`, lang: 'python', static: true },
      right: { code: py`score = 100
if score == 100:
    print("Perfect!")`, lang: 'python' },
      explanation: py`\`=\` assigns, \`==\` compares. Python refuses the first version: \`SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?\``,
    },
    {
      title: 'Writing == True or == False',
      wrong: { code: py`is_member = True
if is_member == True:
    print("Welcome back!")`, lang: 'python' },
      right: { code: py`is_member = True
if is_member:
    print("Welcome back!")`, lang: 'python' },
      explanation: py`A boolean already *is* the answer. \`== True\` is redundant and, for non-bool values, subtly wrong (\`2 == True\` is \`False\` even though \`2\` is truthy). Use \`if is_member:\` and \`if not is_member:\`.`,
    },
    {
      title: 'Using & and | as if they were and / or',
      wrong: { code: py`x = 5
print(x > 1 & x > 2)      # False?! & binds tighter than >`, lang: 'python' },
      right: { code: py`x = 5
print(x > 1 and x > 2)    # True`, lang: 'python' },
      explanation: py`\`&\` and \`|\` are *bitwise* operators. They don't short-circuit and they bind tighter than comparisons, so \`x > 1 & x > 2\` means \`x > (1 & x) > 2\`. Use \`and\`/\`or\` for logic. (Libraries like pandas use \`&\`/\`|\` on purpose — always with brackets around each comparison.)`,
    },
    {
      title: 'Comparing numbers stored as text',
      wrong: { code: py`high_score = "9"
new_score = "10"
print(new_score > high_score)    # False — compared as text`, lang: 'python' },
      right: { code: py`high_score = int("9")
new_score = int("10")
print(new_score > high_score)    # True`, lang: 'python' },
      explanation: py`Strings compare character by character, and \`"1"\` comes before \`"9"\`. Convert input to numbers before comparing — see [type conversion](lesson:type-conversion).`,
    },
  ],
  debugging: [
    {
      symptom: py`An if condition is always true, no matter the input.`,
      cause: py`Usually \`x == "a" or "b"\` — the bare \`"b"\` is truthy — or a comparison with a string like \`"False"\`, which is truthy.`,
      fix: py`Print the pieces separately (\`print(x == "a", bool("b"))\`), then rewrite as \`x in ("a", "b")\`.`,
    },
    {
      symptom: py`TypeError: '<' not supported between instances of 'str' and 'int'`,
      cause: py`Ordering a string against a number — often a value from \`input()\` or a file that wasn't converted.`,
      fix: py`Convert first: \`int(text) < limit\`. Note that \`==\` doesn't raise here; it just returns \`False\`, which can hide the same bug.`,
    },
    {
      symptom: py`SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?`,
      cause: py`An assignment \`=\` where a comparison was intended (\`if x = 1:\`).`,
      fix: py`Use \`==\` to compare.`,
    },
    {
      symptom: py`ZeroDivisionError in a condition such as total / count > 5`,
      cause: py`The division runs before (or without) a check that \`count\` isn't zero.`,
      fix: py`Guard it with short-circuiting, protective check first: \`count > 0 and total / count > 5\`.`,
    },
  ],
  bestPractices: [
    'Use == for value comparisons and keep = for assignment; never compare booleans with == True.',
    'Use chained comparisons for ranges: 0 <= index < len(items).',
    'Put brackets around every mixed and/or expression.',
    'Use in for "is it one of these": status in {"paid", "refunded"}.',
    'Put the cheap or protective check first in an and/or chain so short-circuiting guards the rest.',
    'Give complex conditions a name: can_checkout = basket_total > 0 and not account_locked.',
    'Use x or default only when every falsy value really means "missing".',
  ],
  useCases: [
    'Validation rules: password length, age limits, required fields.',
    'Access control: is_admin or (is_owner and not locked).',
    'Range checks with chaining: 0 <= percent <= 100.',
    'Guards that avoid errors: items and items[0] == "start".',
    'Default values: display_name = nickname or "Visitor" (when an empty name means "none").',
    'Counting matches: sum(score >= 50 for score in scores).',
  ],
  comparison: {
    title: 'and / or / not at a glance',
    headers: ['expression', 'result', 'why'],
    rows: [
      ['True and False', 'False', 'both must be true'],
      ['True or False', 'True', 'one is enough'],
      ['not True', 'False', 'flips the value'],
      ['0 and 5', '0', 'falsy left side decides; returned as is'],
      ['3 and 5', '5', 'truthy left side, so the right side is the answer'],
      ['"" or "Visitor"', '"Visitor"', 'falsy left side, so the right side is the answer'],
      ['"Ace" or "Visitor"', '"Ace"', 'truthy left side decides'],
      ['not ""', 'True', 'not always returns a real bool'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'booleans-and-comparisons-q1',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print(3 < 5 < 4, 1 < 3 > 2)`,
      options: [
        { text: '`True True`', why: '3 < 5 < 4 means 3 < 5 and 5 < 4. The second comparison is false.' },
        '`False True`',
        { text: '`True False`', why: '1 < 3 > 2 means 1 < 3 and 3 > 2 — both true. Odd-looking, but valid.' },
        { text: 'A TypeError', why: 'Chained comparisons are valid Python for any comparison operators.' },
      ],
      answer: 1,
      explanation: py`A chain \`a op1 b op2 c\` means \`(a op1 b) and (b op2 c)\`. \`3 < 5 < 4\` → \`True and False\` → \`False\`. \`1 < 3 > 2\` → \`True and True\` → \`True\`.`,
    },
    {
      id: 'booleans-and-comparisons-q2',
      type: 'output',
      prompt: 'Predict the output exactly.',
      code: py`print(0 or "guest", 3 and 7, None or 0)`,
      answer: 'guest 7 0',
      accept: ['guest 7 0'],
      explanation: py`\`and\`/\`or\` return an operand. \`0 or "guest"\`: 0 is falsy → \`"guest"\`. \`3 and 7\`: 3 is truthy → \`7\`. \`None or 0\`: None is falsy → \`0\` (even though 0 is falsy too: \`or\` returns the last operand when nothing is truthy).`,
    },
    {
      id: 'booleans-and-comparisons-q3',
      type: 'bug',
      prompt: 'This program prints "Deleting everything..." even when the user types `no`. Click the buggy line.',
      code: py`answer = input("Delete all files? ")
if answer == "y" or "yes":
    print("Deleting everything...")
else:
    print("Cancelled.")`,
      answerLine: 2,
      explanation: py`Python reads it as \`(answer == "y") or "yes"\`. The string \`"yes"\` is non-empty, so it's truthy, and the condition is always true. Fix: \`if answer in ("y", "yes"):\`.`,
    },
    {
      id: 'booleans-and-comparisons-q4',
      type: 'fill',
      prompt: 'Complete the chained comparison so `is_teen` is True for ages 13 to 19 inclusive.',
      code: py`age = 15
is_teen = 13 ___ age ___ 19`,
      answer: [['<='], ['<=']],
      explanation: py`\`13 <= age <= 19\` means \`13 <= age and age <= 19\`. Using \`<\` would exclude 13 and 19.`,
    },
    {
      id: 'booleans-and-comparisons-q5',
      type: 'mcq',
      prompt: 'What is the value of `not True == False`?',
      options: [
        { text: 'False', why: 'Comparisons bind tighter than not, so this is not (True == False). True == False is False, and not False is True.' },
        'True',
        { text: 'A SyntaxError', why: 'Mixing not with == is valid Python.' },
        { text: 'None', why: 'not always returns True or False.' },
      ],
      answer: 1,
      explanation: py`\`not\` binds more loosely than \`==\`, so this is \`not (True == False)\` → \`not False\` → \`True\`. Rule of thumb: comparisons happen first, then \`not\`, then \`and\`, then \`or\`.`,
    },
    {
      id: 'booleans-and-comparisons-q6',
      type: 'mcq',
      prompt: '`visits = 0`. Which line runs **without** raising `ZeroDivisionError`?',
      options: [
        { text: '`ok = points / visits > 10 and visits > 0`', why: 'The division is on the left, so it runs first and raises before the check is reached.' },
        '`ok = visits > 0 and points / visits > 10`',
        { text: '`ok = (points / visits > 10) or visits == 0`', why: 'The division is still evaluated first.' },
        { text: 'None of them — Python always evaluates both sides', why: 'and/or short-circuit: the right side is skipped once the left side decides the answer.' },
      ],
      answer: 1,
      explanation: py`\`visits > 0\` is \`False\`, which decides an \`and\`, so the division is never evaluated. Put the protective check first.`,
    },
    {
      id: 'booleans-and-comparisons-q7',
      type: 'short',
      prompt: 'Explain short-circuiting, and why `x or "default"` can give the wrong answer when `x` is `0`.',
      answer: py`\`and\` and \`or\` evaluate left to right and stop as soon as the result is known: \`and\` stops at the first falsy operand, \`or\` at the first truthy one, and they return that operand. So \`x or "default"\` returns \`x\` only if \`x\` is truthy. \`0\` is falsy, so a real, valid value of 0 gets replaced by "default". When 0 (or "") is legitimate, check explicitly: \`x if x is not None else "default"\`.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'leap-year',
      title: 'Leap year rule',
      difficulty: 'beginner',
      prompt: py`A year is a **leap year** if it is divisible by 4 — **except** years divisible by 100, which are not — **unless** they are also divisible by 400.

So 2024 is a leap year, 1900 is not, 2000 is, and 2023 is not.

Set \`is_leap\` to a **single boolean expression** using \`year\`, \`%\`, \`==\`/\`!=\`, \`and\` and \`or\`, then print \`Leap year: True\` (or \`False\`) with \`print("Leap year:", is_leap)\`. The tests try several years.`,
      files: {
        'main.py': py`year = 2024

# TODO: replace False with a boolean expression
is_leap = False

print("Leap year:", is_leap)
`,
      },
      hints: [
        '"Divisible by 4" is year % 4 == 0. "Not divisible by 100" is year % 100 != 0.',
        'Two ways to be a leap year: (divisible by 4 and not by 100) or (divisible by 400).',
        'is_leap = (year % 4 == 0 and year % 100 != 0) or year % 400 == 0',
      ],
      solution: {
        explanation: py`\`year % 4 == 0\` tests "divisible by 4" (the remainder is zero). The rule has two routes to "leap": divisible by 4 *and not* by 100 — **or** — divisible by 400. Brackets make the grouping obvious (they're optional here, because \`and\` binds tighter than \`or\`, but readers shouldn't have to know that). For 1900: \`True and False\` → \`False\`, then \`or 1900 % 400 == 0\` → \`False\`. For 2000: the first group is \`False\`, but \`2000 % 400 == 0\` is \`True\`. The standard library agrees: \`calendar.isleap(year)\`.`,
        files: {
          'main.py': py`year = 2024

is_leap = (year % 4 == 0 and year % 100 != 0) or year % 400 == 0

print("Leap year:", is_leap)
`,
        },
      },
      tests: [
        { name: '2024 is a leap year', code: py`assert is_leap is True and output.strip() == "Leap year: True"` },
        {
          name: '1900, 2000, 2023 and 2100',
          code: py`def leap(y):
    env = {}
    capture(exec, files['main.py'].replace('year = 2024', f'year = {y}'), env)
    return env['is_leap']

assert leap(1900) is False, '1900 is divisible by 100 but not by 400'
assert leap(2000) is True, '2000 is divisible by 400'
assert leap(2023) is False
assert leap(2100) is False`,
        },
        {
          name: 'agrees with calendar.isleap for 1890–2030',
          code: py`import calendar

def leap(y):
    env = {}
    capture(exec, files['main.py'].replace('year = 2024', f'year = {y}'), env)
    return env['is_leap']

wrong = [y for y in range(1890, 2031) if leap(y) != calendar.isleap(y)]
assert not wrong, f'Wrong for these years: {wrong[:5]}'`,
        },
      ],
    },
    {
      id: 'ticket-discount',
      title: 'Cinema discount',
      difficulty: 'beginner',
      prompt: py`A cinema gives a discount to:

- children **under 12**,
- seniors aged **65 or over**,
- **students**, but only on **weekdays** (not at the weekend).

Complete the function so it **returns** \`True\` or \`False\`. You only need to replace the expression after \`return\`. (A *function* is a reusable recipe: the values in brackets — \`age\`, \`is_student\`, \`is_weekend\` — are its inputs, and \`return\` hands back the answer.)`,
      files: {
        'main.py': py`def gets_discount(age, is_student, is_weekend):
    # TODO: replace False with a boolean expression
    return False


print(gets_discount(8, False, True))     # child: True
print(gets_discount(30, True, False))    # student on a weekday: True
print(gets_discount(30, True, True))     # student at the weekend: False
`,
      },
      hints: [
        'Write each rule as its own comparison first: age < 12, age >= 65, is_student and not is_weekend.',
        'A visitor gets the discount if ANY rule matches — join the three with or. Brackets around the student rule make it clear.',
        'return age < 12 or age >= 65 or (is_student and not is_weekend)',
      ],
      solution: {
        explanation: py`Each rule becomes one boolean expression, and \`or\` combines them because *any* one is enough. The student rule is itself an \`and\` with a \`not\`: "is a student **and not** the weekend". Brackets aren't required (\`not\` binds tighter than \`and\`, which binds tighter than \`or\`), but they mirror how a human reads the rules. Because every operand is a comparison or a bool, the result is always a real \`True\`/\`False\`.`,
        files: {
          'main.py': py`def gets_discount(age, is_student, is_weekend):
    return age < 12 or age >= 65 or (is_student and not is_weekend)


print(gets_discount(8, False, True))     # child: True
print(gets_discount(30, True, False))    # student on a weekday: True
print(gets_discount(30, True, True))     # student at the weekend: False
`,
        },
      },
      tests: [
        { name: 'children under 12', code: py`assert gets_discount(8, False, True) is True and gets_discount(11, False, False) is True` },
        { name: '12-year-olds pay full price', code: py`assert gets_discount(12, False, False) is False` },
        { name: 'seniors 65+', code: py`assert gets_discount(65, False, True) is True and gets_discount(64, False, True) is False` },
        { name: 'students only on weekdays', code: py`assert gets_discount(30, True, False) is True and gets_discount(30, True, True) is False` },
        { name: 'adults pay full price', code: py`assert gets_discount(30, False, False) is False` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'booleans-and-comparisons-and-or-return',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What do `and` and `or` return in Python? Are they guaranteed to return `True` or `False`?',
      answer: 'No. They short-circuit and return one of their operands: x and y returns x if x is falsy, otherwise y; x or y returns x if x is truthy, otherwise y. Only not (and bool()) always return a real bool.',
      explanation: py`This enables idioms like \`name = nickname or "Visitor"\` and guards like \`items and items[0]\`. When both operands are comparisons, the result happens to be a bool because the operands are bools.`,
      code: { lang: 'python', code: py`print(0 and 5)            # 0
print(3 and 5)            # 5
print("" or "Visitor")    # Visitor
print(not "")             # True` },
      whyAsked: 'Checks precise understanding of evaluation semantics, which underpins many idioms and some subtle bugs.',
      mistakes: ['Saying they always return a bool', 'Not mentioning short-circuiting', 'Confusing them with & and |'],
      followUps: ['When does x or default go wrong?', 'What does `[] or {} or 0` evaluate to?', 'How do any() and all() relate?'],
      modelAnswer: 'They return one of their operands, not necessarily a bool. Both evaluate the left operand first and short-circuit: and returns the left operand if it is falsy, otherwise it evaluates and returns the right one; or returns the left operand if it is truthy, otherwise the right one. So 3 and 5 is 5, and "" or "Visitor" is "Visitor". Only not and bool() always give True or False. That behaviour powers idioms like defaults with or, but it also means x or default replaces legitimate falsy values like 0.',
    },
    {
      id: 'booleans-and-comparisons-chain-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`print([] or {} or 0 or "end")
print(1 and [] and 3)
print((3 < 2) < 1, 3 < 2 < 1)` },
      options: ['end, [], True False', 'True, False, False False', 'end, 3, True False', 'end, [], False False'],
      correctOption: 0,
      answer: '`end`, then `[]`, then `True False`. or returns the first truthy operand (or the last one); and returns the first falsy operand (or the last one). (3 < 2) < 1 compares False < 1, i.e. 0 < 1; the chained 3 < 2 < 1 means (3 < 2) and (2 < 1).',
      explanation: py`Bracketing a comparison turns it into a bool that then takes part in the next comparison as 0 or 1 — usually not what you want. Chaining is the readable, correct form.`,
      whyAsked: 'Tests operand-returning semantics and the difference between chaining and grouping.',
      mistakes: ['Expecting and/or to output True/False', 'Thinking (a < b) < c equals a < b < c'],
      followUps: ['Why is False < 1 valid?', 'What does 1 < 2 == 2 evaluate to?'],
      modelAnswer: 'The first line prints end: or walks along until it finds a truthy operand, and the empty list, empty dict and zero are all falsy. The second prints an empty list: and stops at the first falsy operand and returns it. The third prints True then False: with brackets, (3 < 2) becomes False, which is 0 as an int, and 0 < 1 is True; without brackets, the chain means 3 < 2 and 2 < 1, which is False. Chaining and grouping look similar but mean different things.',
    },
    {
      id: 'booleans-and-comparisons-or-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'An admin page uses `if role == "admin" or "editor":`. Testers report that every user, including guests, can open it. Explain and fix.',
      answer: 'It parses as (role == "admin") or "editor"; the non-empty string "editor" is truthy, so the condition is always true. Fix: role in {"admin", "editor"} (or repeat the comparison).',
      explanation: py`This is a silent security bug — valid Python, no error, access granted to everyone. Tests for *negative* cases (a guest must be refused) catch it; linters such as Ruff and Pylint can flag a constant string used as a condition.`,
      code: { lang: 'python', code: py`ALLOWED_ROLES = {"admin", "editor"}

def can_open_admin_page(role):
    return role in ALLOWED_ROLES` },
      whyAsked: 'A classic bug with real security impact; also tests precedence and truthiness.',
      mistakes: ['Fixing it as role == ("admin" or "editor") — that is just role == "admin"', 'Not adding a test for the guest case'],
      followUps: ['Why is ("admin" or "editor") equal to "admin"?', 'How would you structure permission checks in a real app?'],
      modelAnswer: 'Python reads it as role == "admin", or the string "editor". A non-empty string is truthy, so whenever the role isn’t admin the or returns "editor", and the if always passes — everyone gets in. The fix is a membership test: role in a set of allowed roles, which is also easier to extend. A tempting wrong fix is role == ("admin" or "editor"), which is just role == "admin". I would also add a test asserting that a guest is refused, since this kind of bug fails open silently.',
    },
    {
      id: 'booleans-and-comparisons-bitwise-vs-logical',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `and`/`or` and `&`/`|`? When would you use `&`?',
      answer: 'and/or are logical operators: they short-circuit, return an operand, and have low precedence. & and | are bitwise operators (also set intersection/union, and element-wise logic in NumPy/pandas): they always evaluate both sides, cannot be overloaded to short-circuit, and bind tighter than comparisons — so each comparison needs brackets.',
      explanation: py`On ints, \`&\` works bit by bit: \`6 & 3\` is \`2\`. On sets: \`{1, 2} & {2, 3}\` is \`{2}\`. pandas uses \`(df.age > 18) & (df.city == "Leeds")\` because \`and\` would call \`bool()\` on a whole column, which is ambiguous. Without brackets, \`df.age > 18 & df.city == "Leeds"\` parses with \`&\` first and fails or misbehaves.`,
      whyAsked: 'Common source of bugs when moving between plain Python and data libraries.',
      mistakes: ['Saying they are interchangeable', 'Forgetting precedence brackets with &', 'Not knowing why pandas needs &'],
      followUps: ['Why does `if numpy_array:` raise an error?', 'What does `{1, 2} | {2, 3}` give?'],
      modelAnswer: 'and and or are boolean operators: they evaluate lazily, short-circuit, and return one of their operands; they also have very low precedence. & and | are bitwise operators on integers and union/intersection on sets, and libraries like NumPy and pandas overload them for element-wise logic on arrays. They always evaluate both sides and bind tighter than comparisons, so you must bracket each comparison: (a > 1) & (b > 2). In plain Python conditions I use and/or; I use & and | for sets, bit flags, and array masks.',
    },
    {
      id: 'booleans-and-comparisons-valid-time',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 3,
      question: 'Write `is_valid_time(hours, minutes)` that returns `True` for a valid 24-hour clock time (hours 0–23, minutes 0–59) and `False` otherwise. Use chained comparisons.',
      answer: 'return 0 <= hours < 24 and 0 <= minutes < 60',
      explanation: py`Half-open ranges (\`0 <= h < 24\`) mirror how \`range(24)\` works and avoid off-by-one mistakes. The whole expression is a bool, so it can be returned directly — no \`if ...: return True else: return False\` needed.`,
      starter: { files: { 'main.py': py`def is_valid_time(hours, minutes):
    # TODO: return True only for 00:00 to 23:59
    return True


print(is_valid_time(23, 59), is_valid_time(24, 0))
` } },
      tests: [
        { name: 'valid times', code: py`assert is_valid_time(0, 0) is True and is_valid_time(23, 59) is True and is_valid_time(12, 30) is True` },
        { name: 'hour out of range', code: py`assert is_valid_time(24, 0) is False and is_valid_time(-1, 10) is False` },
        { name: 'minute out of range', code: py`assert is_valid_time(10, 60) is False and is_valid_time(10, -5) is False` },
      ],
      solution: { files: { 'main.py': py`def is_valid_time(hours, minutes):
    return 0 <= hours < 24 and 0 <= minutes < 60


print(is_valid_time(23, 59), is_valid_time(24, 0))
` } },
      hints: ['Write one chained comparison for hours and one for minutes.', 'Combine them with and and return the result directly.'],
      whyAsked: 'Quick check of comparison fluency and of returning boolean expressions directly.',
      mistakes: ['Using <= 24 (off by one)', 'Writing if cond: return True else: return False', 'Using or instead of and'],
      followUps: ['How would you validate a "HH:MM" string?', 'Why are half-open ranges popular?'],
      modelAnswer: 'I would return 0 <= hours < 24 and 0 <= minutes < 60. Each chained comparison checks a half-open range, which matches range(24) and range(60) and avoids off-by-one errors like allowing 24. The and requires both parts to hold, and since the expression already evaluates to a bool, I return it directly instead of wrapping it in an if. For a "HH:MM" string I would split it, convert both parts with int inside a try, then call this function.',
    },
    {
      id: 'booleans-and-comparisons-chaining-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How exactly does Python evaluate `a < f() < c`? How does that differ from `a < f() and f() < c`, and what happens if the operands are NumPy arrays?',
      answer: 'A chain evaluates each middle operand once: compute a, compute f(), test a < f(); if that result is falsy, stop and return it; otherwise compute c and return f()_result < c. Writing it out with and calls f() twice. With NumPy arrays, a < b returns an array, and the implicit truth test in the chain raises "The truth value of an array with more than one element is ambiguous".',
      explanation: py`Chaining is defined in the language reference as equivalent to \`a < b and b < c\` "except that b is evaluated only once". The intermediate truth test calls \`bool()\` on the first comparison's result — fine for bools, an error for arrays whose \`__bool__\` refuses to guess. Use \`(a < b) & (b < c)\` for arrays.`,
      code: { lang: 'python', code: py`calls = 0

def reading():
    global calls
    calls += 1
    return 21

print(18 < reading() < 25, calls)                  # True 1
print(18 < reading() and reading() < 25, calls)    # True 3` },
      whyAsked: 'Distinguishes candidates who know the precise semantics (single evaluation, implicit truth test) from those who know only the syntax.',
      mistakes: ['Saying chaining is purely syntactic sugar with identical evaluation', 'Not knowing why arrays fail', 'Thinking (a < b) < c is equivalent'],
      followUps: ['What does __bool__ do?', 'How do rich comparison methods allow non-bool results?'],
      modelAnswer: 'Python evaluates a, then f(), then compares them. If a < f() is falsy, the chain stops and returns that result; otherwise it evaluates c and compares the saved f() result with it. So the middle operand is evaluated only once, whereas writing a < f() and f() < c calls f twice, which matters for side effects or expensive calls. Between the links there is an implicit truth test, which is why chaining breaks for NumPy arrays: an element-wise comparison returns an array, and its __bool__ raises the ambiguous truth value error, so you combine masks with & instead.',
    },
    {
      id: 'booleans-and-comparisons-or-default',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A service reads `timeout = config.get("timeout") or 30`. An operator sets `timeout: 0` to mean "no timeout", but the service still times out after 30 seconds. Why, and how do you fix it?',
      answer: '0 is falsy, so `or` replaces it with 30. Distinguish "missing" from "falsy": use config.get("timeout", 30) when the key may be absent, or `value if value is not None else 30` when None means missing.',
      explanation: py`\`x or default\` treats every falsy value — \`0\`, \`0.0\`, \`""\`, \`[]\`, \`False\` — as missing. That's fine for display names, wrong for numbers and flags. \`dict.get(key, default)\` only uses the default when the key is absent; an explicit \`is None\` check handles keys present with a \`None\` value. See [None & truthiness](lesson:none-and-truthiness).`,
      code: { lang: 'python', code: py`config = {"timeout": 0}

timeout = config.get("timeout") or 30          # 30 — bug
timeout = config.get("timeout", 30)            # 0  — default only if the key is missing
value = config.get("timeout")
timeout = value if value is not None else 30   # 0  — also handles an explicit None` },
      whyAsked: 'A realistic configuration bug that reveals whether you understand truthiness beyond the happy path.',
      mistakes: ['Saying or always works for defaults', 'Fixing it with a special case for 0 only'],
      followUps: ['What other falsy values could hit this?', 'How would you validate configuration types at start-up?'],
      modelAnswer: 'The or operator returns its right operand whenever the left one is falsy, and 0 is falsy, so a deliberate 0 becomes 30. The fix is to distinguish "missing" from "falsy": config.get("timeout", 30) only applies the default when the key is absent, and if the key can be present with None I would write value if value is not None else 30. More generally, or is fine for defaults only when every falsy value really means missing, like an empty display name; for numbers, booleans and lists it is a trap.',
    },
  ],

  takeaways: [
    'bool has two values, True and False; comparisons (==, !=, <, <=, >, >=) produce them. = assigns, == compares.',
    'Chained comparisons like 0 <= x < 10 mean (0 <= x) and (x < 10), evaluating x once.',
    'and needs both, or needs one, not flips; precedence is comparisons → not → and → or — bracket mixed and/or.',
    'and/or short-circuit: the right side runs only if needed, which makes guards like count > 0 and total / count safe.',
    'and/or return one of their operands, not necessarily a bool — x or default replaces every falsy x, including 0 and "".',
    'Use in for "one of these values": role in {"admin", "editor"} — never role == "admin" or "editor".',
  ],
}
