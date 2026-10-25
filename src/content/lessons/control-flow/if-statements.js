// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TICKET_BOOTH = py`# Cinema ticket booth: every decision is an if statement
age = 15
has_student_card = True
day = "Saturday"

# 1. One question, several possible answers: if / elif / else.
#    Python checks top to bottom and runs ONLY the first match.
if age < 5:
    price = 0
elif age < 18:
    price = 6
elif age >= 65:
    price = 7
else:
    price = 10

# 2. A separate question gets its own, independent if.
if has_student_card and price > 0:
    price -= 1

# 3. A conditional expression picks one of two values.
day_type = "weekend" if day in ("Saturday", "Sunday") else "weekday"

print(f"Age {age} on a {day_type}: the ticket costs {price}")
`

export default {
  id: 'if-statements',
  title: 'Making decisions: if, elif & else',
  summary: 'An if statement runs a block of code only when a condition is true; elif and else add alternatives, and exactly one branch of a chain wins.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['booleans-and-comparisons', 'none-and-truthiness'],
  related: ['booleans-and-comparisons', 'none-and-truthiness', 'while-loops', 'loop-control', 'match-statement', 'defining-functions', 'error-handling-patterns', 'clean-code'],
  tags: ['if', 'elif', 'else', 'conditions', 'branching', 'indentation', 'blocks', 'truthiness', 'conditional expression', 'ternary', 'guard clause', 'early return', 'nested if'],
  apis: [
    { name: 'if / elif / else', summary: 'Runs the first block whose condition is truthy; else runs when none of them were.' },
    { name: 'x if condition else y', summary: 'Conditional expression: evaluates to x when the condition is truthy, otherwise to y. Only one side is evaluated.' },
    { name: 'bool(obj)', summary: 'The truth value Python uses for a condition: False for None, 0, empty strings and empty containers; True for almost everything else.' },
    { name: 'pass', summary: 'A statement that does nothing — a placeholder where Python requires a block.' },
  ],
  docs: [
    { label: 'Python tutorial — if statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#if-statements' },
    { label: 'Language reference — the if statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-if-statement' },
    { label: 'Language reference — conditional expressions', url: 'https://docs.python.org/3/reference/expressions.html#conditional-expressions' },
    { label: 'Library reference — truth value testing', url: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing' },
    { label: 'Language reference — indentation', url: 'https://docs.python.org/3/reference/lexical_analysis.html#indentation' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`So far every program you've written runs the same lines, top to bottom, every time. Real programs need to **decide**: show the "game over" screen only when lives reach zero, charge delivery only on small orders, let someone in only if the password matches.`,
    py`The **if statement** is how Python makes a decision. It checks a **condition** — an expression that is either true or false, like \`lives == 0\` — and runs a **block** of code (a group of indented lines) only when the condition is true. Add \`elif\` ("else if") for more alternatives and \`else\` for "none of the above".`,
    { code: py`lives = 0
if lives == 0:
    print("Game over")
else:
    print("Keep playing")`, lang: 'python', title: 'your first decision' },
    py`Two ideas carry the whole lesson: Python checks conditions **from top to bottom and runs only the first match**, and **indentation is syntax** — the spaces at the start of a line tell Python which lines belong to which branch. You'll also meet the one-line *conditional expression* and the *guard clause*, a habit that keeps decision-heavy code flat and readable.`,
  ],
  why: [
    py`Without branching, a program is a recipe with no "if the sauce is too thick, add water" steps — it can't react to its input. Every useful program reacts: to what the user typed, to what's in a file, to whether a network call worked.`,
    py`\`if\` is also the foundation for everything else in this level. A [\`while\` loop](lesson:while-loops) is "repeat while a condition is true", [\`break\`](lesson:loop-control) is almost always inside an \`if\`, and [\`match\`](lesson:match-statement) is a specialised way of choosing a branch.`,
    py`Finally, how you *arrange* conditions matters for humans. Two programs can make identical decisions while one is a tangle of nested blocks and the other reads like a checklist. Learning to keep conditions flat and well-named is one of the first steps from "it works" to "it's good code".`,
  ],
  eli15: [
    py`Think of a "choose your own adventure" book: *"If you open the door, turn to page 12. Otherwise, turn to page 30."* You only read **one** of those pages — the other one is skipped.`,
    py`An \`if\` statement is that instruction for the computer. It asks a yes/no question (\`is it raining?\`). If the answer is yes, it reads the indented lines underneath. If not, it skips them — or reads the \`else\` lines instead.`,
    py`With \`elif\` you get a list of questions: *"Under 5? Free. Under 18? Child ticket. 65 or over? Senior. Otherwise: adult."* Python asks them **in order** and stops at the first "yes". Even if a later question would also be "yes", it never gets asked.`,
  ],
  analogy: {
    title: 'The ticket desk with a checklist',
    body: [
      py`At a cinema ticket desk, the cashier has a laminated checklist: *Under 5 → free. Under 18 → child price. 65 or over → senior price. Anyone else → adult price.* For each customer they read the list **from the top** and stop at the **first line that fits**. A 3-year-old matches "under 5" and also "under 18", but the cashier never reads that far.`,
      py`If the checklist has no "anyone else" line, some customers match nothing — the cashier just does nothing special for them. And a *separate* sign next to the till ("students get 1 off") is a different question asked for **everyone**, no matter which line of the checklist they matched.`,
    ],
    mapping: [
      ['the checklist', 'an if / elif / elif / else chain'],
      ['one line of the checklist', 'one condition and its block'],
      ['reading from the top, stopping at the first fit', 'Python tests conditions in order and runs only the first true one'],
      ['"anyone else"', 'else: runs when no condition was true'],
      ['the separate student sign', 'a second, independent if statement'],
      ['a customer who matches nothing', 'a chain without else, where no block runs'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch Python pick a branch',
    props: {
      code: py`temperature = 22
if temperature > 30:
    advice = "Hot: grab water"
elif temperature > 15:
    advice = "Mild: T-shirt weather"
else:
    advice = "Cold: bring a jacket"
print(advice)

basket = []
if basket:
    print("Items:", basket)
else:
    print("Your basket is empty")

basket.append("apples")
if basket:
    print("Items:", basket)
`,
      notes: {
        2: '`22 > 30` is `False`, so Python **skips** line 3 and jumps to the next test.',
        4: '`22 > 15` is `True`: this is the first match, so line 5 runs…',
        5: '…and after it Python jumps straight past the `else` block. Line 7 never runs.',
        8: 'Exactly one of the three blocks ran, so `advice` is guaranteed to exist here.',
        11: 'An empty list is **falsy** — it counts as `False` in a condition — so the `else` block runs.',
        17: 'Now the list holds one item, which makes it **truthy**: the block runs.',
      },
    },
    alt: 'A step-by-step trace. With temperature 22, the first condition temperature > 30 is false and line 3 is skipped; the elif condition temperature > 15 is true, so advice is set to "Mild: T-shirt weather" and the else block is skipped. An empty basket list makes the next if false, so "Your basket is empty" is printed. After appending "apples", the same condition is true and the items are printed.',
    caption: py`Press ▶ to step. Watch the highlighted line **jump over** the blocks whose conditions were false — skipped lines are never executed.`,
  },
  syntax: [
    py`#### The three shapes`,
    { code: py`balance = 120
price = 80

# 1. if alone: run the block, or do nothing
if balance < 0:
    print("Your account is overdrawn")

# 2. if / else: exactly one of two blocks runs
if balance >= price:
    print("Purchase approved")
else:
    print("Insufficient funds")

# 3. if / elif / else: the first true condition wins
if balance >= 1000:
    tier = "gold"
elif balance >= 100:
    tier = "silver"
else:
    tier = "bronze"
print(tier)   # silver`, lang: 'python', title: 'if, if/else, if/elif/else' },
    py`The rules:

- Each header line ends with a **colon** \`:\`.
- The block under it is **indented** — PEP 8 says 4 spaces. Every line of the block uses the same indentation; the first line that goes back out ends the block.
- \`elif\` and \`else\` line up exactly with their \`if\`. You can have any number of \`elif\`s, and at most one \`else\`, which must come last.
- A block can't be empty. If you need a placeholder, write \`pass\` (a statement that does nothing).`,
    { callout: 'note', title: 'Indentation is syntax', text: py`In many languages, braces \`{ }\` mark blocks and indentation is just decoration. In Python the indentation **is** the structure: move a line four spaces left and it leaves the block. Mixing tabs and spaces can raise \`TabError\`, so let your editor insert 4 spaces when you press Tab.` },
    py`#### What can go in a condition`,
    py`Anything that produces a value. Most often a comparison or a combination of comparisons (see [booleans & comparisons](lesson:booleans-and-comparisons)):

| you write | means |
|---|---|
| \`a == b\`, \`a != b\` | equal / not equal |
| \`a < b\`, \`a <= b\`, \`a > b\`, \`a >= b\` | ordering |
| \`0 <= score <= 100\` | chained comparison: \`0 <= score and score <= 100\` |
| \`item in basket\`, \`item not in basket\` | membership |
| \`x is None\`, \`x is not None\` | identity check, used for \`None\` |
| \`cond1 and cond2\`, \`cond1 or cond2\`, \`not cond\` | combining conditions |`,
    py`#### Truthiness: conditions that aren't True or False`,
    py`A condition doesn't have to be a \`bool\`. Python asks any object "do you count as true?" — its **truthiness**. These are **falsy** (count as false): \`None\`, \`False\`, \`0\`, \`0.0\`, \`""\`, \`[]\`, \`()\`, \`{}\`, \`set()\` and \`range(0)\`. Almost everything else is **truthy**, including \`"0"\`, \`" "\` and \`[0]\`. See [None & truthiness](lesson:none-and-truthiness).`,
    { code: py`basket = ["apples"]
if basket:                 # same as: if len(basket) > 0:
    print("Ready to check out")

nickname = ""
if not nickname:           # empty string is falsy
    nickname = "Player 1"
print(nickname)`, lang: 'python', title: 'idiomatic truthiness checks' },
    py`#### The conditional expression (one-line if/else)`,
    py`When you only need to **choose a value**, not run statements, use a *conditional expression* (other languages call it a "ternary operator"):`,
    { code: py`age = 16
status = "adult" if age >= 18 else "minor"
print(status)                                  # minor
print("1 item" if 1 == 1 else "many items")    # 1 item`, lang: 'python', title: 'value_if_true if condition else value_if_false' },
    py`Read it as plain English: *"adult if age is at least 18, else minor"*. The \`else\` part is **mandatory** (a value must always come out), and only the chosen side is evaluated.`,
    py`#### Nested vs flat`,
    py`An \`if\` can live inside another \`if\`'s block. That's *nesting*. Two levels can be fine; more becomes hard to follow. Often you can flatten nested ifs by combining conditions with \`and\`:`,
    { code: py`age = 20
has_ticket = True

# nested
if age >= 18:
    if has_ticket:
        print("Welcome to the concert")

# flat — same decision, one level
if age >= 18 and has_ticket:
    print("Welcome to the concert")`, lang: 'python', title: 'flattening with and' },
    py`#### Guard clauses`,
    py`A **guard clause** checks for a problem *first* and leaves early, so the main logic doesn't have to sit inside an ever-deeper pyramid of \`if\`s. It needs a way to "leave" — inside a function that's \`return\` (you'll learn functions properly in [defining functions](lesson:defining-functions); for now: \`def\` names a reusable block, and \`return\` hands back an answer and **exits the function immediately**). In loops, \`continue\` plays the same role ([loop control](lesson:loop-control)).`,
    { code: py`def withdraw(balance, amount):
    if amount <= 0:
        return "Amount must be positive"     # guard
    if amount > balance:
        return "Insufficient funds"          # guard
    return f"New balance: {balance - amount}"   # the happy path, not indented


print(withdraw(100, 30))    # New balance: 70
print(withdraw(100, 300))   # Insufficient funds`, lang: 'python', title: 'guards first, happy path last' },
  ],
  walkthrough: {
    title: 'Reading the ticket booth line by line',
    lang: 'python',
    code: TICKET_BOOTH,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 4], text: py`Three inputs to our decisions: an int, a bool and a string. Change them in the playground to send the program down different branches.` },
      { lines: [8, 9], text: py`Python evaluates \`age < 5\` → \`15 < 5\` → \`False\`, so line 9 is **skipped**. The chain continues with the next \`elif\`.` },
      { lines: [10, 11], text: py`\`15 < 18\` is \`True\` — the first match. Line 11 runs and binds \`price\` to \`6\`. From here Python jumps **past the whole rest of the chain**.` },
      { lines: [12, 15], text: py`Never evaluated for a 15-year-old — the chain already matched. Order matters: put a broad test such as \`age >= 0\` at the top and it would catch every customer, making every branch below it unreachable.` },
      { lines: [18, 19], text: py`A **new, independent** \`if\`. It's asked for everyone, whatever branch above ran. Both parts must be true: the student card, and \`price > 0\` — which stops a free toddler ticket becoming \`-1\`.` },
      { lines: [22], text: py`A conditional expression chooses between two **values**. \`day in ("Saturday", "Sunday")\` is \`True\`, so \`day_type\` becomes \`"weekend"\`.` },
      { lines: [24], text: py`An f-string reports the result: \`Age 15 on a weekend: the ticket costs 5\`.` },
    ],
  },
  playground: {
    title: 'Cinema ticket booth',
    objective: 'Change the age, card and day to send the program down every branch — predict each price before you run.',
    files: { 'main.py': TICKET_BOOTH },
    expected: py`One line:

\`\`\`text
Age 15 on a weekend: the ticket costs 5
\`\`\`

Try ages 3, 15, 30 and 70 and predict each price first. Open the **Variables** tab after a run to see \`price\` and \`day_type\`.`,
    experiments: [
      {
        id: 'senior',
        task: py`Set \`age\` to **70** and \`has_student_card\` to **False**. Predict the price, then run it.`,
        hint: py`Walk the chain yourself: \`70 < 5\`? \`70 < 18\`? \`70 >= 65\`? The first \`True\` wins.`,
        tests: [
          { name: 'age is 65 or more and there is no student card', code: py`assert age >= 65 and not has_student_card, 'Set age = 70 and has_student_card = False'` },
          { name: 'the senior price (7) is printed', code: py`assert 'costs 7' in output` },
        ],
        explain: py`The first two conditions are false, \`age >= 65\` is true, so \`price = 7\` runs and the \`else\` is never reached. The student check is false (no card), so the price stays 7.`,
      },
      {
        id: 'weekend-surcharge',
        task: py`Keep \`day = "Saturday"\`. Add a weekend surcharge: after \`day_type\` is worked out and **before** the \`print\`, add an \`if\` that adds **2** to \`price\` when \`day_type\` is \`"weekend"\`.`,
        hint: py`Two new lines just above \`print\`: \`if day_type == "weekend":\` and, indented, \`price += 2\`.`,
        tests: [
          { name: 'day is still a weekend day', code: py`assert day_type == "weekend", 'Keep day as "Saturday" (or "Sunday") for this experiment'` },
          { name: 'the price includes the +2 surcharge', code: py`base = 10
if age < 5:
    base = 0
elif age < 18:
    base = 6
elif age >= 65:
    base = 7
if has_student_card and base > 0:
    base -= 1
assert price == base + 2, 'Add 2 to price when day_type == "weekend"'` },
          { name: 'the printed line shows the new price', code: py`assert f"costs {price}" in output` },
        ],
        explain: py`The surcharge is a separate question, so it gets its own \`if\` — not an \`elif\` attached to the age chain. It must come after \`day_type\` exists (Python runs top to bottom) and before \`print\`, or the printed price would be stale.`,
      },
      {
        id: 'ticket-type',
        task: py`Add a variable \`ticket_type\` that is \`"child"\` when \`age\` is under 18 and \`"adult"\` otherwise — in **one line**, using a conditional expression. Then include it in the printed line.`,
        hint: py`\`ticket_type = "child" if age < 18 else "adult"\` — then add \`{ticket_type}\` inside the f-string.`,
        tests: [
          { name: 'ticket_type is "child" or "adult" to match the age', code: py`assert ns.get('ticket_type') == ("child" if age < 18 else "adult"), 'Create ticket_type with a conditional expression'` },
          { name: 'ticket_type appears in the output', code: py`assert str(ns.get('ticket_type')) in output` },
        ],
        explain: py`A conditional expression produces a **value**, so it fits on the right of \`=\` and even inside an f-string. Use it for simple two-way choices; switch back to a full \`if\` statement when either side needs more than a value.`,
      },
      {
        id: 'toddler-guard',
        task: py`Set \`age = 3\` and keep \`has_student_card = True\`. Predict the price. Then delete \`and price > 0\` from the student-discount line, run again and look at the price. Put the check back before you finish.`,
        hint: py`Without the guard, a free ticket (0) minus a 1 discount is -1. The \`and price > 0\` part protects against that.`,
        tests: [
          { name: 'age is under 5', code: py`assert age < 5, 'Set age = 3'` },
          { name: 'the price never goes negative', code: py`assert price >= 0, 'A free ticket became negative: put "and price > 0" back'` },
        ],
        explain: py`\`and\` needs **both** sides to be true. For a toddler the price is 0, so \`price > 0\` is false and the discount is skipped. Edge cases like "free" or "empty" are exactly where conditions break — always test them.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How an if / elif / else chain flows',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'c1', label: 'if temp > 30', note: 'test 1', x: 120, y: 60, tone: 'yellow' },
        { id: 'c2', label: 'elif temp > 15', note: 'test 2', x: 400, y: 60, tone: 'yellow' },
        { id: 'b1', label: 'block 1', note: '"Hot"', x: 120, y: 170, tone: 'blue' },
        { id: 'b2', label: 'block 2', note: '"Mild"', x: 400, y: 170, tone: 'blue' },
        { id: 'b3', label: 'else block', note: '"Cold"', x: 660, y: 170, tone: 'blue' },
        { id: 'after', label: 'next line', note: 'print(advice)', x: 400, y: 280, tone: 'ink' },
      ],
      edges: [
        { from: 'c1', to: 'b1', label: 'True' },
        { from: 'c1', to: 'c2', label: 'False', dashed: true },
        { from: 'c2', to: 'b2', label: 'True' },
        { from: 'c2', to: 'b3', label: 'False', dashed: true },
        { from: 'b1', to: 'after' },
        { from: 'b2', to: 'after' },
        { from: 'b3', to: 'after' },
      ],
      steps: [
        { focus: ['c1'], text: py`Python evaluates the first condition and turns the result into a truth value: \`True\` or \`False\`.` },
        { focus: ['c1', 'b1', 'after'], edges: ['c1->b1', 'b1->after'], text: py`If it's **True**, block 1 runs — and then Python jumps straight to the line after the whole chain. Test 2 is never even evaluated.` },
        { focus: ['c1', 'c2', 'b2', 'after'], edges: ['c1->c2', 'c2->b2', 'b2->after'], text: py`If test 1 is **False**, Python moves on to the \`elif\`. If *that* is True, block 2 runs, then the chain is over.` },
        { focus: ['c2', 'b3', 'after'], edges: ['c2->b3', 'b3->after'], text: py`Only if **every** condition was False does the \`else\` block run. It has no condition of its own.` },
        { focus: ['after'], text: py`However you got here, **exactly one** block ran (with an \`else\`) — or at most one (without). That's the promise of a chain, and the difference from writing several separate \`if\`s.` },
      ],
    },
    alt: 'A flowchart. "if temp > 30" has a True arrow to block 1 and a dashed False arrow to "elif temp > 15". The elif has a True arrow to block 2 and a dashed False arrow to the else block. All three blocks have arrows to "next line". The steps highlight each path, showing that exactly one block runs before execution continues after the chain.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When Python reaches an \`if\`, it evaluates the condition, gets an answer that counts as true or false, and then **jumps**: either into the block, or over it to the next \`elif\`/\`else\`, or past the whole chain.`,
      py`Lines in a branch that isn't taken are **never executed**. Even a line that would crash is harmless if its branch is skipped:`,
      { code: py`debug = False
if debug:
    print(1 / 0)      # would raise ZeroDivisionError — but never runs
print("survived")`, lang: 'python', title: 'skipped code does not run' },
      py`Skipped code is still **read** by Python, though. Before running anything, Python checks the whole file's syntax, so a missing colon in a branch that would never run still stops the whole program with a \`SyntaxError\` before a single line runs.`,
    ],
    technical: [
      py`**Truth testing.** For \`if x:\` Python calls the equivalent of \`bool(x)\`. For your own classes it asks \`x.__bool__()\`; if that's not defined it uses \`len(x) != 0\` via \`__len__\`; if neither exists, the object is truthy. That's why empty containers are falsy and why a custom \`Playlist\` class with \`__len__\` "just works" in conditions (see [special methods](lesson:special-methods)).`,
      py`**\`elif\` is a nested \`else: if\`.** The language reference defines the chain so that \`if a: … elif b: … else: …\` behaves exactly like \`if a: … else:\` followed by an indented \`if b: … else: …\`. \`elif\` just saves you the indentation.`,
      py`**Short-circuiting.** \`and\` stops at the first falsy operand and \`or\` stops at the first truthy one, and both return that *operand* (not necessarily \`True\`/\`False\`). This makes guards like \`if items and items[0] == "urgent":\` safe: when \`items\` is empty, \`items[0]\` is never evaluated, so there's no \`IndexError\`.`,
      py`**The conditional expression** \`a if cond else b\` evaluates \`cond\` first, then only **one** of \`a\` or \`b\`. It has the lowest precedence of any operator except \`lambda\` (and \`:=\`), so \`x = 1 + 2 if flag else 0\` means \`x = (1 + 2) if flag else 0\`. Add parentheses whenever you mix it with other operators.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython compiles an \`if\` into *bytecode* with conditional jump instructions. In 3.14, \`dis.dis\` shows a comparison followed by \`POP_JUMP_IF_FALSE\` that skips the block. Opcode names change between versions and other implementations (PyPy, GraalPy) work differently — it's a peek behind the curtain, not something to rely on. See [bytecode](lesson:bytecode).` },
      { code: py`  3           LOAD_FAST_BORROW         0 (temp)
              LOAD_SMALL_INT          30
              COMPARE_OP             148 (bool(>))
              POP_JUMP_IF_FALSE        3 (to L1)
              NOT_TAKEN

  4           LOAD_CONST               1 ('hot')
              RETURN_VALUE`, lang: 'text', title: 'part of dis.dis() output for "if temp > 30: return \'hot\'" (CPython 3.14)' },
    ],
    production: [
      py`**Prefer guard clauses to pyramids.** Code that nests four \`if\`s deep ("arrow code") hides the main logic at the far right. Check invalid cases first and \`return\`, \`continue\` or \`raise\` early, then write the normal path unindented. Reviewers read it as a checklist.`,
      py`**Be explicit when 0 or "" are valid.** \`if not quantity:\` treats \`0\` exactly like "missing". When \`None\` means "not provided", say so: \`if quantity is None:\`. This single habit prevents a classic bug where a legitimate zero is replaced by a default.`,
      py`**Name complicated conditions.** \`is_weekend = day in ("Saturday", "Sunday")\` and then \`if is_weekend and not is_holiday:\` documents intent and gives you something to print while debugging.`,
      py`**Don't use a chain as a lookup table.** Ten \`elif\`s that each map a value to another value are better as a dictionary: \`PRICES = {"small": 2.5, "medium": 3.0, "large": 3.5}\` and \`PRICES.get(size)\`. For branching on the *shape* of data, Python 3.10+ has [\`match\`](lesson:match-statement).`,
      py`**Every branch is a path to test.** Each \`if\` doubles the ways a function can run. Write tests for each branch and its **boundaries** (\`17\`, \`18\`, \`19\` for an "18 or over" rule) — off-by-one bugs live there. Linters such as Ruff can flag collapsible nested \`if\`s and \`if\`/\`else\` blocks that could be a single conditional expression ([code quality tools](lesson:code-quality-tools)).`,
    ],
  },
  mistakes: [
    {
      title: 'Using = instead of ==',
      wrong: { code: py`pin = "1234"
if pin = "1234":
    print("Unlocked")`, lang: 'python', static: true },
      right: { code: py`pin = "1234"
if pin == "1234":
    print("Unlocked")`, lang: 'python' },
      explanation: py`\`=\` binds a name; \`==\` compares. Python refuses the first version with \`SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?\` — so this one, at least, can't slip through silently.`,
    },
    {
      title: 'Writing x == a or b',
      wrong: { code: py`answer = "no"
if answer == "yes" or "y":
    print("Continuing...")   # runs even for "no"!`, lang: 'python' },
      right: { code: py`answer = "no"
if answer in ("yes", "y"):
    print("Continuing...")`, lang: 'python' },
      explanation: py`Python reads the wrong version as \`(answer == "yes") or ("y")\`. The non-empty string \`"y"\` is truthy, so the whole condition is always true. Compare against each value, or — cleaner — use \`in\` with a tuple or set.`,
    },
    {
      title: 'Separate ifs where you meant one chain',
      wrong: { code: py`score = 95
if score >= 90:
    print("A")
if score >= 80:
    print("B")      # also printed!
else:
    print("C or below")`, lang: 'python' },
      right: { code: py`score = 95
if score >= 90:
    print("A")
elif score >= 80:
    print("B")
else:
    print("C or below")`, lang: 'python' },
      explanation: py`Each plain \`if\` starts a new, independent question, so several can run. When the answers are **alternatives** ("which grade?"), connect them with \`elif\` so exactly one runs. Also note: in the wrong version the \`else\` belongs only to the second \`if\`.`,
    },
    {
      title: 'Putting the broad condition first',
      wrong: { code: py`score = 95
if score >= 50:
    grade = "pass"
elif score >= 90:
    grade = "distinction"   # unreachable: anything >= 90 is also >= 50
print(grade)`, lang: 'python' },
      right: { code: py`score = 95
if score >= 90:
    grade = "distinction"
elif score >= 50:
    grade = "pass"
print(grade)`, lang: 'python' },
      explanation: py`The first true condition wins, so the most **specific** (narrowest) test must come first. A good check: for each branch, ask "can any value actually reach this line?"`,
    },
    {
      title: 'Treating a valid 0 as "missing"',
      wrong: { code: py`discount = 0          # a real value: no discount
if not discount:
    discount = 10     # oops — overwrote a valid 0
print(discount)       # 10`, lang: 'python' },
      right: { code: py`discount = 0
if discount is None:  # only replace a value that is genuinely missing
    discount = 10
print(discount)       # 0`, lang: 'python' },
      explanation: py`Truthiness lumps \`0\`, \`""\`, \`[]\` and \`None\` together. That's great for "is this list empty?" and wrong for "was this value provided?". Use \`is None\` when zero or empty are legitimate values.`,
    },
    {
      title: 'Writing else if',
      wrong: { code: py`level = 3
if level == 1:
    print("easy")
else if level == 2:
    print("medium")`, lang: 'python', static: true },
      right: { code: py`level = 3
if level == 1:
    print("easy")
elif level == 2:
    print("medium")
else:
    print("hard")`, lang: 'python' },
      explanation: py`Python's keyword is \`elif\`. \`else if\` (from C, Java or JavaScript) is a \`SyntaxError: expected ':'\` because \`else\` must be followed directly by a colon.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: expected ':'`,
      cause: py`The header line of an \`if\`, \`elif\` or \`else\` is missing its colon — or you wrote \`else if\` instead of \`elif\`.`,
      fix: py`Add the colon at the end of the line the error points to: \`if lives == 0:\`. Replace \`else if\` with \`elif\`.`,
    },
    {
      symptom: py`IndentationError: expected an indented block after 'if' statement on line 2`,
      cause: py`The line after \`if …:\` isn't indented, so the \`if\` has an empty block — or the block contains only a comment.`,
      fix: py`Indent the block by 4 spaces. If you don't have code for it yet, put \`pass\` there as a placeholder.`,
    },
    {
      symptom: py`IndentationError: unindent does not match any outer indentation level`,
      cause: py`A line was moved back out to a position that doesn't line up with any enclosing block (e.g. 2 spaces when the blocks use 0 and 4). Mixed tabs and spaces cause the related \`TabError: inconsistent use of tabs and spaces in indentation\`.`,
      fix: py`Make every line of a block start at the same column, and configure your editor to insert 4 spaces for Tab.`,
    },
    {
      symptom: py`TypeError: '>' not supported between instances of 'str' and 'int'`,
      cause: py`You compared text from \`input()\` (always a \`str\`) with a number: \`if age > 17:\` where \`age = input()\`.`,
      fix: py`Convert first: \`age = int(input("Age? "))\`. See [type conversion](lesson:type-conversion).`,
    },
    {
      symptom: py`No error, but a branch never runs (or the wrong one always does).`,
      cause: py`Usually an ordering problem (a broad condition above a narrow one), an \`x == a or b\` condition that's always true, or a truthiness surprise (\`"0"\` and \`" "\` are truthy).`,
      fix: py`Print the condition's value right before the \`if\`: \`print(repr(answer), answer == "yes")\`. Then walk the chain by hand for that value — or step through it in the code tracer.`,
    },
    {
      symptom: py`SyntaxError: expected 'else' after 'if' expression`,
      cause: py`A conditional expression without its \`else\` part: \`label = "big" if size > 10\`.`,
      fix: py`A conditional expression must always produce a value: add \`else …\`. If you really only want to act when the condition is true, use an \`if\` statement instead.`,
    },
  ],
  bestPractices: [
    'Order an elif chain from the most specific condition to the most general.',
    'Use elif for mutually exclusive alternatives and separate ifs for independent questions.',
    'Prefer guard clauses (check-and-leave early) over deeply nested ifs.',
    'Use truthiness for "is it empty?" checks, and is None when 0 or "" are valid values.',
    'Use in with a tuple or set to compare against several values: if day in ("Sat", "Sun").',
    'Keep conditional expressions short and simple; switch to a full if statement when they need nesting.',
    'Give complex conditions a name (is_eligible = ...) before the if.',
  ],
  useCases: [
    'Validating input before using it (empty name, negative quantity, out-of-range score).',
    'Choosing a price, label, tier or message from rules (tickets, grades, shipping).',
    'Handling special cases in a calculation (divide only when the count is not zero).',
    'Feature flags and settings: if config["dark_mode"]: ...',
    'Game logic: if lives == 0: show the game-over screen.',
  ],
  whenToUse: {
    use: [
      'if / elif / else for decisions based on conditions, ranges and combinations of facts.',
      'A conditional expression to choose between two simple values.',
      'Guard clauses at the top of a function to reject invalid cases early.',
    ],
    avoid: [
      'Long elif chains that only map one value to another — use a dictionary lookup.',
      'Branching on the shape of nested data (lists of a certain length, dicts with certain keys) — match (3.10+) is clearer.',
      'Nesting deeper than two or three levels — flatten with and, guard clauses or helper functions.',
    ],
  },
  comparison: {
    title: 'Four ways to choose',
    headers: ['', 'if / elif / else', 'conditional expression', 'dict lookup', 'match (3.10+)'],
    rows: [
      ['is a…', 'statement', 'expression (produces a value)', 'expression', 'statement'],
      ['best for', 'conditions, ranges, combinations', 'picking one of two values', 'mapping known keys to values', 'the structure/shape of data'],
      ['can run several lines per branch', 'yes', 'no', 'no (values only, unless they are functions)', 'yes'],
      ['example', 'if t > 30: … elif t > 15: …', '"hot" if t > 30 else "ok"', 'PRICES.get(size, 0)', 'case {"type": "click"}: …'],
    ],
    note: py`Start with \`if\`. Reach for the others when they make the code *shorter and clearer* — see [match](lesson:match-statement) and [dictionaries](lesson:dictionaries).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'if-statements-q1',
      type: 'mcq',
      prompt: py`A chain has one \`if\`, two \`elif\`s and an \`else\`. How many of its four blocks run each time the chain is reached?`,
      options: [
        'Exactly one',
        { text: 'Every block whose condition is true', why: 'That describes separate if statements. In a chain, Python stops at the first true condition.' },
        { text: 'Zero or one', why: 'With an else, something always runs: else catches the case where every condition was false. Without an else, zero would be possible.' },
        { text: 'At least two: the if and the else', why: 'The else runs only when every condition above it was false, so it never runs together with another block of the same chain.' },
      ],
      answer: 0,
      explanation: py`Python tests the conditions top to bottom and runs the **first** block whose condition is true, then skips the rest. If none is true, the \`else\` block runs. So with an \`else\`, exactly one block runs.`,
    },
    {
      id: 'if-statements-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`score = 85
if score >= 50:
    print("pass")
elif score >= 80:
    print("merit")
else:
    print("fail")`,
      answer: 'pass',
      accept: ['pass', '"pass"'],
      explanation: py`\`85 >= 50\` is true, so the first block runs and the chain is over. The \`elif score >= 80\` is never checked — it's unreachable for any score of 80 or more. The fix is to put the narrower test (\`>= 80\`) first.`,
    },
    {
      id: 'if-statements-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`temp = 35
if temp > 30:
    print("hot")
if temp > 20:
    print("warm")
else:
    print("cold")`,
      options: [
        { text: 'hot', why: 'That would be true for an if/elif chain. Here the second if is a separate statement, so it is checked too.' },
        'hot, then warm (two lines)',
        { text: 'hot, then cold (two lines)', why: 'The else belongs to the second if. Since 35 > 20 is true, its else does not run.' },
        { text: 'warm', why: 'The first if is independent and its condition is true, so "hot" is printed first.' },
      ],
      answer: 1,
      explanation: py`Two separate \`if\` statements are two separate questions. Both conditions are true, so both blocks run. The \`else\` is attached only to the second \`if\`.`,
    },
    {
      id: 'if-statements-q4',
      type: 'bug',
      prompt: 'Whatever the user types — even "no" — this program prints "Continuing...". Click the line with the bug.',
      code: py`answer = input("Continue? ")
if answer == "yes" or "y":
    print("Continuing...")
else:
    print("Stopped.")`,
      answerLine: 2,
      explanation: py`Python reads it as \`(answer == "yes") or "y"\`. When the first part is false, \`or\` returns \`"y"\`, a non-empty string — which is truthy. Write \`if answer in ("yes", "y"):\` or \`if answer == "yes" or answer == "y":\`.`,
    },
    {
      id: 'if-statements-q5',
      type: 'fill',
      prompt: 'Complete the conditional expression so that it prints `minor`.',
      code: py`age = 16
status = "adult" ___ age >= 18 ___ "minor"
print(status)`,
      answer: [['if'], ['else']],
      explanation: py`The shape is \`value_if_true if condition else value_if_false\`. \`16 >= 18\` is false, so the expression evaluates to \`"minor"\`.`,
    },
    {
      id: 'if-statements-q6',
      type: 'mcq',
      prompt: 'Select **all** values that are falsy (would make `if value:` skip its block).',
      options: [
        '0',
        '"" (empty string)',
        { text: '"0" (a string containing zero)', why: 'Any non-empty string is truthy, whatever characters it contains.' },
        '[] (empty list)',
        { text: '" " (a single space)', why: 'A space is a character, so the string is not empty — it is truthy. Use .strip() first if you mean "blank".' },
        'None',
        { text: '[0] (a list holding a zero)', why: 'The list has one item, so it is not empty. Truthiness of a list depends on its length, not on its contents.' },
      ],
      answer: [0, 1, 3, 5],
      explanation: py`Falsy values are \`None\`, \`False\`, numeric zeros, and **empty** strings and containers. Everything else is truthy — including \`"0"\`, \`" "\` and \`[0]\`.`,
    },
    {
      id: 'if-statements-q7',
      type: 'short',
      prompt: 'Why do experienced developers prefer guard clauses (check-and-return early) over nesting the main logic inside several ifs?',
      answer: py`Guard clauses deal with the special or invalid cases first and leave immediately, so the normal "happy path" sits at the left margin instead of four levels deep. Each condition is read once, in order, like a checklist; there's no need to match up distant else blocks; and adding a new rule means adding one more guard rather than another level of nesting.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'letter-grade',
      title: 'Letter grades',
      difficulty: 'beginner',
      prompt: py`The program reads a whole-number test score with \`score = int(input("Score: "))\` (already written). Make it print the result:

- If the score is **below 0 or above 100**, print exactly \`Invalid score\` and no grade.
- Otherwise print \`Grade: X\`, where X is:

| score | grade |
|---|---|
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| below 60 | F |

For example, input \`85\` prints \`Grade: B\`. The tests try boundary scores such as 90, 89 and 101, so check your \`>=\` and \`>\` carefully. Set the **Input** tab to a score to try it.`,
      files: {
        'main.py': py`score = int(input("Score: "))

# TODO: print "Invalid score" for scores outside 0-100,
#       otherwise print "Grade: X" using an if / elif / else chain
print("Grade: ?")
`,
      },
      hints: [
        'Handle the invalid case first: if score < 0 or score > 100. Then chain the grades with elif.',
        'Order matters: test score >= 90 before score >= 80, and so on down. The else catches everything below 60.',
        'if score < 0 or score > 100:\n    print("Invalid score")\nelif score >= 90:\n    print("Grade: A")\nelif score >= 80:\n    ...',
      ],
      solution: {
        explanation: py`The invalid check comes first, so out-of-range scores never reach the grade tests. After that, the chain goes from the highest band down: because the first true condition wins, \`elif score >= 80\` only runs for scores that already failed \`>= 90\` — so it means "80 to 89" without writing an upper limit. \`else\` catches everything left (0–59). The first condition can also be written \`if not 0 <= score <= 100:\` using a chained comparison.`,
        files: {
          'main.py': py`score = int(input("Score: "))

if score < 0 or score > 100:
    print("Invalid score")
elif score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
elif score >= 60:
    print("Grade: D")
else:
    print("Grade: F")
`,
        },
      },
      tests: [
        { name: '95 is an A', stdin: '95', code: py`assert 'Grade: A' in output` },
        { name: '90 (the boundary) is still an A', stdin: '90', code: py`assert 'Grade: A' in output` },
        { name: '89 is a B, not an A', stdin: '89', code: py`assert 'Grade: B' in output and 'Grade: A' not in output` },
        { name: '70 is a C', stdin: '70', code: py`assert 'Grade: C' in output` },
        { name: '42 is an F', stdin: '42', code: py`assert 'Grade: F' in output` },
        { name: '101 is invalid and shows no grade', stdin: '101', code: py`assert 'Invalid score' in output and 'Grade' not in output` },
        { name: '-3 is invalid', stdin: '-3', code: py`assert 'Invalid score' in output and 'Grade' not in output` },
      ],
    },
    {
      id: 'delivery-fee',
      title: 'Delivery fee with guard clauses',
      difficulty: 'beginner',
      prompt: py`A grocery app works out its delivery fee with these rules, **checked in this order**:

1. \`distance_km\` **more than 50** → no delivery: return \`None\`
2. the customer \`is_member\`, **or** \`order_total\` is **40 or more** → free: return \`0\`
3. \`distance_km\` **10 or less** → return \`3\`
4. anything else → return \`5\`

Complete the function \`delivery_fee(order_total, is_member, distance_km)\`. The \`def\` line is written for you — you only fill in the body. \`return value\` hands the answer back and **leaves the function immediately**, so each rule can be a guard clause: one \`if\` with a \`return\`, no \`elif\` or nesting needed.`,
      files: {
        'main.py': py`def delivery_fee(order_total, is_member, distance_km):
    # TODO: one guard clause (if ... return ...) per rule, in order
    return 5


print(delivery_fee(25, False, 4))    # expect 3
print(delivery_fee(25, False, 70))   # expect None
print(delivery_fee(55, False, 20))   # expect 0
`,
      },
      hints: [
        'Write the rules in the same order as the list. Each one is an if followed by an indented return.',
        'Rule 2 combines two facts with or: if is_member or order_total >= 40: return 0. Rule 4 needs no if at all — it is the last line.',
        'if distance_km > 50:\n    return None\nif is_member or order_total >= 40:\n    return 0\nif distance_km <= 10:\n    return 3\nreturn 5',
      ],
      solution: {
        explanation: py`Because \`return\` exits immediately, each \`if\` only runs when every rule above it didn't apply — the same "first match wins" behaviour as an \`elif\` chain, but flat. Order matters: the distance limit comes first, so even a member can't get delivery 70 km away. The final \`return 5\` is the "anything else" case and needs no condition. Note the boundaries: \`> 50\` lets exactly 50 km through, \`>= 40\` makes exactly 40 free, and \`<= 10\` makes exactly 10 km cost 3.`,
        files: {
          'main.py': py`def delivery_fee(order_total, is_member, distance_km):
    if distance_km > 50:
        return None
    if is_member or order_total >= 40:
        return 0
    if distance_km <= 10:
        return 3
    return 5


print(delivery_fee(25, False, 4))    # expect 3
print(delivery_fee(25, False, 70))   # expect None
print(delivery_fee(55, False, 20))   # expect 0
`,
        },
      },
      tests: [
        { name: 'more than 50 km away → None, even for members', code: py`assert delivery_fee(100, True, 51) is None` },
        { name: 'members get free delivery', code: py`assert delivery_fee(10, True, 30) == 0` },
        { name: 'an order of exactly 40 is free', code: py`assert delivery_fee(40, False, 30) == 0` },
        { name: 'exactly 10 km costs 3', code: py`assert delivery_fee(39.99, False, 10) == 3` },
        { name: 'exactly 50 km still delivers, for 5', code: py`assert delivery_fee(20, False, 50) == 5` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'if-statements-if-vs-elif',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between a chain of if / elif statements and several separate if statements?',
      answer: 'In an if/elif chain Python runs only the first block whose condition is true and skips the rest; separate ifs are independent statements, so every one whose condition is true runs.',
      explanation: py`Use a chain when the cases are **alternatives** (exactly one grade, one price tier). Use separate \`if\`s for **independent** questions (apply a discount, and also add a surcharge). Mixing them up causes double-handling bugs, and in a chain the order of conditions decides which branch wins.`,
      code: { lang: 'python', code: py`n = 15
if n % 3 == 0:
    print("divisible by 3")
elif n % 5 == 0:
    print("divisible by 5")      # skipped: the chain already matched

if n % 3 == 0:
    print("divisible by 3")
if n % 5 == 0:
    print("divisible by 5")      # runs: an independent question` },
      whyAsked: 'It checks that you understand control flow precisely rather than pattern-matching syntax, and it predicts whether you will write double-processing bugs.',
      mistakes: ['Saying elif is just a shorter way of writing if', 'Not mentioning that order matters in a chain', 'Forgetting that an else binds only to the nearest if'],
      followUps: ['When does the order of elif branches matter?', 'How would you rewrite a long elif chain that maps values to values?', 'What does else attach to when there are two separate ifs before it?'],
      modelAnswer: 'An if/elif/else chain is a single statement that picks one branch: Python evaluates the conditions in order and runs only the first block whose condition is truthy, then skips everything else in the chain. Separate if statements are independent, so each condition is checked and every true one runs. I use a chain for mutually exclusive alternatives, like choosing a grade, and separate ifs for independent rules, like a discount and a surcharge that can both apply. With a chain I also order the conditions from most specific to most general, because a broad condition first would make later branches unreachable.',
    },
    {
      id: 'if-statements-truthiness-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`print(bool("False"), bool([0]), bool(0.0), bool(" "))` },
      options: ['False False False False', 'True True False True', 'False True False False', 'True False False True'],
      correctOption: 1,
      answer: '`True True False True`. Non-empty strings are truthy regardless of their text, a list with one item is truthy, 0.0 is a numeric zero (falsy), and a space is a non-empty string.',
      explanation: py`\`bool()\` doesn't read meaning into values. Strings and containers are falsy only when **empty**; numbers only when **zero**. The string \`"False"\` has five characters, so it's truthy — a common bug when reading booleans from config files or forms, where you must compare text explicitly: \`value.lower() == "true"\`.`,
      whyAsked: 'Truthiness surprises are a frequent source of real bugs (config parsing, empty-vs-missing checks); this quickly shows whether you know the actual rules.',
      mistakes: ['Thinking "False" or "0" strings are falsy', 'Thinking a list containing only falsy items is falsy', 'Guessing based on what the value "means" rather than the rules'],
      followUps: ['How would you parse "true"/"false" strings from an environment variable?', 'How do you make your own class falsy?', 'Why is if x is None different from if not x?'],
      modelAnswer: 'It prints True True False True. Python’s truth rules are mechanical: None, False, numeric zeros, and empty strings or containers are falsy, and almost everything else is truthy. The string "False" is not empty, so it’s truthy; [0] has one element, so it’s truthy; 0.0 is a zero, so it’s falsy; and " " contains a space, so it’s truthy. In practice this matters when reading booleans from text, like environment variables — I compare the text explicitly instead of relying on bool().',
    },
    {
      id: 'if-statements-or-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A command-line tool asks "Delete all files? (y/n)" and deletes them whatever the user answers. The check is `if reply == "y" or "Y":`. What is wrong and how do you fix it?',
      answer: 'The condition parses as (reply == "y") or "Y"; the second operand is a non-empty string, which is always truthy. Fix: if reply in ("y", "Y"): — or normalise first: if reply.strip().lower() == "y":',
      explanation: py`\`or\` combines two complete conditions; it doesn't distribute \`==\` over both values. When \`reply == "y"\` is false, \`or\` returns its right operand \`"Y"\`, which is truthy, so the block runs. Normalising the input with \`.strip().lower()\` also handles \`" y"\` and \`"Y"\`, and for a destructive action you should default to **not** acting unless the answer is exactly yes.`,
      code: { lang: 'python', code: py`reply = "n"
print(reply == "y" or "Y")              # Y   (truthy!)
print(reply in ("y", "Y"))              # False
print(reply.strip().lower() == "y")     # False` },
      whyAsked: 'It is one of the most common beginner bugs, and the fix reveals whether you understand operator precedence, short-circuit return values and safe defaults.',
      mistakes: ['Adding parentheses like reply == ("y" or "Y") — that is just reply == "y"', 'Saying "or is broken"', 'Not mentioning that dangerous actions should require an explicit yes'],
      followUps: ['What value does the expression reply == "y" or "Y" actually return?', 'Why would a set be preferable to a tuple for a large list of accepted answers?', 'How would you make the prompt re-ask on invalid input? (a while loop)'],
      modelAnswer: 'The condition doesn’t mean what it looks like. Python reads it as (reply == "y") or "Y", and when the comparison is false, or returns its right-hand operand, the string "Y", which is truthy — so the block always runs. I’d fix it with membership, if reply in ("y", "Y"), or better, normalise the input with reply.strip().lower() == "y". Because this guards a destructive action, I’d also make sure anything other than an explicit yes means no.',
    },
    {
      id: 'if-statements-fizzbuzz',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'This `fizzbuzz(n)` should return "FizzBuzz" for multiples of both 3 and 5, "Fizz" for multiples of 3, "Buzz" for multiples of 5, and otherwise the number as a string. It returns "Fizz" for 15. Fix it.',
      answer: 'Check the most specific case first: if n % 15 == 0 (or n % 3 == 0 and n % 5 == 0) must come before the separate 3 and 5 checks.',
      explanation: py`In an \`if\`/\`elif\` chain the first true condition wins. 15 is a multiple of 3, so the \`n % 3 == 0\` branch catches it and the "FizzBuzz" branch is unreachable. Moving the combined condition to the top fixes it.`,
      starter: { files: { 'main.py': py`def fizzbuzz(n):
    if n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    elif n % 3 == 0 and n % 5 == 0:
        return "FizzBuzz"
    return str(n)


print(fizzbuzz(9), fizzbuzz(10), fizzbuzz(15), fizzbuzz(7))
` } },
      tests: [
        { name: 'fizzbuzz(15) == "FizzBuzz"', code: py`assert fizzbuzz(15) == "FizzBuzz"` },
        { name: 'fizzbuzz(30) == "FizzBuzz"', code: py`assert fizzbuzz(30) == "FizzBuzz"` },
        { name: 'fizzbuzz(9) == "Fizz"', code: py`assert fizzbuzz(9) == "Fizz"` },
        { name: 'fizzbuzz(10) == "Buzz"', code: py`assert fizzbuzz(10) == "Buzz"` },
        { name: 'fizzbuzz(7) == "7" (a string)', code: py`assert fizzbuzz(7) == "7"` },
      ],
      solution: { files: { 'main.py': py`def fizzbuzz(n):
    if n % 3 == 0 and n % 5 == 0:
        return "FizzBuzz"
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    return str(n)


print(fizzbuzz(9), fizzbuzz(10), fizzbuzz(15), fizzbuzz(7))
` } },
      hints: ['Which branch catches 15 first?', 'Move the combined check to the top. Since each branch returns, you can use plain ifs (guard clauses) instead of elif.'],
      whyAsked: 'FizzBuzz is a classic screening question; the twist here tests whether you understand that branch order decides the result.',
      mistakes: ['Adding a fourth branch at the bottom instead of reordering', 'Returning the int n instead of str(n)', 'Using n % 15 without being able to explain why it is equivalent'],
      followUps: ['Why is n % 15 == 0 equivalent to checking both 3 and 5?', 'How would you add "Bazz" for multiples of 7 without an explosion of branches? (build the string piece by piece)'],
      modelAnswer: 'The bug is ordering. In an if/elif chain the first true condition wins, and 15 is a multiple of 3, so it returns "Fizz" before the FizzBuzz check is ever reached — that branch is unreachable. I move the most specific condition, divisible by both 3 and 5, to the top. Because each branch returns, I can write the checks as flat guard clauses, and the final line returns str(n) for everything else. If the rules kept growing, I’d build the result string piece by piece instead of adding a branch for every combination.',
    },
    {
      id: 'if-statements-arrow-code',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'In a code review you see a checkout function nested five ifs deep: if user: if user.is_active: if cart: if cart.total > 0: if payment_ok: ... with an else at each level. How would you refactor it?',
      answer: 'Invert each condition into a guard clause that handles the failure and returns (or raises) early, so the happy path ends up unindented at the bottom. Behaviour stays the same, but each rule reads once, in order, next to its own error.',
      explanation: py`Deep nesting ("arrow code") separates each condition from its \`else\` by many lines, which makes it easy to attach handling to the wrong level. Guard clauses invert the logic: *if this precondition fails, deal with it now and leave.* After all guards, the remaining code can assume everything is valid. In a function that reports errors with exceptions, guards \`raise\`; in a loop they \`continue\`.`,
      code: { lang: 'python', code: py`def checkout(user, cart, payment_ok):
    if user is None:
        return "Please log in"
    if not user["active"]:
        return "Account suspended"
    if not cart:
        return "Your cart is empty"
    if not payment_ok:
        return "Payment declined"
    return f"Order placed: {len(cart)} item(s)"


print(checkout({"active": True}, ["tea", "cake"], True))   # Order placed: 2 item(s)` },
      whyAsked: 'Interviewers want to see that you care about readability and can restructure control flow safely without changing behaviour.',
      mistakes: ['Combining all conditions into one giant and-expression, losing the specific error messages', 'Changing behaviour while refactoring (e.g. reordering checks that have side effects)', 'Not mentioning tests to prove the refactor is safe'],
      followUps: ['How do you make sure the refactor did not change behaviour?', 'When would you raise an exception instead of returning an error string?', 'Is there ever a case for a single return point per function?'],
      modelAnswer: 'I’d turn each nested condition into a guard clause. Instead of "if the user exists, then if they are active, then…", I write "if there is no user, return the login error", "if they are not active, return the suspension error", and so on. Each check sits right next to its own failure handling, and once all the guards have passed, the happy path runs at the left margin. Behaviour stays the same as long as I keep the checks in the same order, and I’d lock that in with a test for each branch before refactoring. Depending on the codebase, guards might raise exceptions rather than return messages.',
    },
    {
      id: 'if-statements-truth-protocol',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What exactly does Python do to decide whether `if obj:` runs its block, for an arbitrary object?',
      answer: 'It performs truth value testing: it calls type(obj).__bool__ if defined (which must return a bool); otherwise it calls __len__ and treats 0 as false; if the class defines neither, the object is truthy.',
      explanation: py`This is why built-in containers are falsy when empty (they implement \`__len__\`) and why plain objects are always truthy. A class can opt out by raising in \`__bool__\` — NumPy arrays do that for arrays with more than one element ("The truth value of an array with more than one element is ambiguous"), forcing you to say \`.any()\` or \`.all()\`. In CPython the check compiles to a \`TO_BOOL\`/conditional-jump sequence, with fast paths for exact \`bool\`, ints, strings and lists — an implementation detail.`,
      code: { lang: 'python', code: py`class Playlist:
    def __init__(self, songs):
        self.songs = songs

    def __len__(self):
        return len(self.songs)


print(bool(Playlist([])), bool(Playlist(["Song A"])), bool(object()))
# False True True` },
      whyAsked: 'It probes knowledge of the data model behind everyday syntax, and whether you can predict how custom and third-party objects behave in conditions.',
      mistakes: ['Saying Python compares obj == True', 'Forgetting the __len__ fallback', 'Not knowing that __bool__ must return an actual bool (returning 1 raises TypeError)'],
      followUps: ['Why does if numpy_array: raise ValueError?', 'Why is it risky to give a class a __len__ that can be 0 if callers write if obj:?', 'How do and/or use truth testing, and what do they return?'],
      modelAnswer: 'Python runs truth value testing on the object. It first looks for __bool__ on the object’s type and uses that result, which must be a real bool. If there’s no __bool__, it falls back to __len__ and treats a length of zero as false. If neither exists, the object is truthy. That’s why empty lists and strings are falsy and arbitrary objects are truthy. Libraries can use this deliberately — NumPy raises an error for multi-element arrays because "is this array true?" is ambiguous, so you must say any() or all().',
    },
    {
      id: 'if-statements-defaults',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare these ways of applying a default: `timeout = timeout or 30`, `timeout = 30 if timeout is None else timeout`, and a full if statement. When is each appropriate?',
      answer: 'x or default replaces every falsy value (0, "", [], None); the is None conditional expression replaces only a missing value; a full if statement is for when the default needs several steps or side effects. For values where 0 or "" are valid, use the is None form.',
      explanation: py`\`or\` returns its first truthy operand, so \`timeout or 30\` turns a deliberate \`0\` ("no waiting") into \`30\` — a real-world bug. \`30 if timeout is None else timeout\` is precise about "not provided". A full \`if\` statement reads best when computing the default takes more than one expression or logs something.`,
      code: { lang: 'python', code: py`timeout = 0
print(timeout or 30)                          # 30 — the valid 0 was lost
print(30 if timeout is None else timeout)     # 0  — only None is replaced` },
      whyAsked: 'It reveals whether you understand short-circuit return values and the difference between "falsy" and "missing" — a subtle but common production bug.',
      mistakes: ['Claiming x or default and the is None version are equivalent', 'Using == None instead of is None', 'Writing a four-line if/else for a simple default'],
      followUps: ['Where is x or default perfectly fine? (e.g. a display name that must not be empty)', 'How would you apply defaults to many dictionary keys at once? (dict.get, {**defaults, **options})'],
      modelAnswer: 'They differ in what counts as missing. timeout or 30 replaces any falsy value, so a deliberate 0 or empty string gets overwritten — fine for something like a display name that must never be empty, but a bug for a timeout where 0 is meaningful. 30 if timeout is None else timeout replaces only None, which is the precise "not provided" check. And if computing the default takes several steps or I want to log it, a full if timeout is None: block is clearer than cramming it into one line.',
    },
  ],

  takeaways: [
    'if runs its block only when the condition is truthy; elif adds alternatives; else catches "none of the above".',
    'In a chain, Python tests top to bottom and runs only the first match — order conditions from most specific to most general.',
    'Indentation is syntax: the colon opens a block and the indented lines are its body.',
    'Conditions use truthiness: None, 0, "" and empty containers are falsy; "0", " " and [0] are truthy.',
    'Separate ifs are independent questions; use elif when the answers are alternatives.',
    'x if condition else y chooses a value in one line — keep it short.',
    'Guard clauses handle bad cases first and leave early, keeping the main path flat.',
  ],
}
