// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const EXPENSE_LOGGER = py`# Expense logger: type one amount per line, then "done"
total = 0.0
count = 0

while True:
    entry = input("Amount (or done): ")
    if entry == "done":
        break                    # the sentinel: leave the loop now
    total += float(entry)
    count += 1

print(f"Expenses: {count}")
print(f"Total: {total:.2f}")
if count > 0:
    print(f"Average: {total / count:.2f}")
`

export default {
  id: 'while-loops',
  title: 'while loops',
  summary: 'A while loop repeats its block for as long as a condition stays true — ideal when you can\'t know in advance how many repetitions you need.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['if-statements'],
  related: ['if-statements', 'for-loops', 'loop-control', 'first-program', 'type-conversion', 'try-except', 'iterators', 'project-number-game'],
  tags: ['while', 'loop', 'repeat', 'iteration', 'counter', 'accumulator', 'sentinel', 'while True', 'break', 'infinite loop', 'off-by-one', 'input validation'],
  apis: [
    { name: 'while condition:', summary: 'Checks the condition; if truthy, runs the block and checks again. Stops as soon as the condition is falsy.' },
    { name: 'while True: … break', summary: 'A loop with no built-in exit; break inside an if ends it. Common for input loops.' },
    { name: 'break', summary: 'Leaves the innermost loop immediately.' },
    { name: 'input(prompt)', summary: 'Shows the prompt and returns one line typed by the user, as a str (without the newline).' },
  ],
  docs: [
    { label: 'Language reference — the while statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-while-statement' },
    { label: 'Python tutorial — first steps towards programming (a while loop)', url: 'https://docs.python.org/3/tutorial/introduction.html#first-steps-towards-programming' },
    { label: 'Language reference — the break statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-break-statement' },
    { label: 'Built-in functions — input()', url: 'https://docs.python.org/3/library/functions.html#input' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **loop** makes Python run the same block of code again and again. The \`while\` loop is the simplest kind: it's an [\`if\`](lesson:if-statements) that keeps coming back.`,
    { code: py`lives = 3
while lives > 0:
    print("Lives left:", lives)
    lives -= 1
print("Game over")`, lang: 'python', title: 'check, run, check again' },
    py`Each time round — each **iteration** — Python checks the condition. If it's true, the indented body runs, then Python jumps back up and checks again. The moment the condition is false, Python skips the body and carries on after the loop.`,
    py`That makes \`while\` the right tool when you **don't know how many repetitions you'll need**: keep asking until the user types a valid answer, keep reading until they type \`done\`, keep doubling until the number passes a million. When you already have a collection to walk through, a [\`for\` loop](lesson:for-loops) is usually better.`,
  ],
  why: [
    py`Computers are great at repetition, and many problems are naturally "keep going until…": a game keeps running until the player quits, an app re-asks for a password until it's right, a download retries until it succeeds or gives up.`,
    py`Without loops you'd copy and paste the same lines — and you still couldn't handle "as many times as needed", because the number of copies would be fixed when you wrote the program.`,
    py`\`while\` also teaches the most important loop skill of all: making sure a loop **ends**. Every \`while\` loop needs something in its body that eventually makes the condition false (or a \`break\`). Forget it and you've written an *infinite loop*.`,
  ],
  eli15: [
    py`Picture a little kid on a car trip: *"Are we there yet?" "No." "Are we there yet?" "No."…* until the answer is finally *"Yes!"* — and the questions stop.`,
    py`A \`while\` loop is that kid. Before each round it asks a yes/no question (\`while not_there_yet:\`). "Yes, keep going" → it does the indented stuff again. "No" → it stops and moves on to the next line.`,
    py`The one rule: something inside the loop must change, so that one day the answer flips. If the car never moves, the kid asks forever — that's an **infinite loop**, and your program gets stuck.`,
  ],
  analogy: {
    title: 'Stirring porridge until it thickens',
    body: [
      py`A recipe says: *"While the porridge is runny, stir for one minute."* So you check it. Runny? Stir a minute. Check again. Still runny? Stir again. The moment it's thick, you stop stirring and move on to serving.`,
      py`Two things make this work. First, the **check comes before each round of stirring** — if the porridge is already thick when you start, you don't stir at all. Second, **the heat is changing the porridge** while you stir. If you forgot to switch the stove on, it would never thicken and you'd stir until the end of time. Sensible cooks also have a backup rule: *"…but stop after 20 minutes no matter what."*`,
    ],
    mapping: [
      ['"is the porridge still runny?"', 'the loop condition, checked before every iteration'],
      ['one minute of stirring', 'one run of the loop body (an iteration)'],
      ['the heat thickening the porridge', 'the body changing the variables the condition depends on'],
      ['already thick at the start', 'the condition is false at once, so the body runs zero times'],
      ['forgetting to switch the stove on', 'an infinite loop: nothing ever makes the condition false'],
      ['"stop after 20 minutes no matter what"', 'a safety limit: a counter in the condition, or break'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch the condition get checked every round',
    props: {
      code: py`height = 1
day = 0
while height < 10:
    height += 3
    day += 1
    print("day", day, "height", height)
print("Ready to repot on day", day)
`,
      notes: {
        3: 'The condition is checked **before every iteration**. Watch this line light up four times: three times `True`, the last time `False`.',
        4: 'This update is what makes the loop end: every iteration moves `height` closer to 10.',
        5: '`day` is a **counter**: it records how many times the body has run.',
        7: 'Reached only when `height < 10` is finally `False` (10 is not less than 10).',
      },
    },
    alt: 'A step-by-step trace of a plant-growing loop. height starts at 1 and day at 0. Each time the while line runs, it checks height < 10; while true, height grows by 3 and day increases by 1, printing day 1 height 4, day 2 height 7, day 3 height 10. On the fourth check, 10 < 10 is false, so the loop ends and "Ready to repot on day 3" is printed.',
    caption: py`Step with ▶ and keep an eye on line 3. The loop body ran **3** times, but the condition was checked **4** times — the last check is the one that says "stop".`,
  },
  syntax: [
    py`#### The shape`,
    { code: py`countdown = 3
while countdown > 0:      # header: keyword, condition, colon
    print(countdown)      # body: indented, runs once per iteration
    countdown -= 1        # update: moves towards the exit
print("Liftoff!")         # first line after the loop`, lang: 'python', title: 'while condition: body' },
    py`- The condition is any expression; Python uses its **truthiness**, exactly as in an \`if\`. \`while basket:\` means "while the basket isn't empty".
- The condition is checked **before** each iteration, including the first — so the body can run **zero** times.
- Python never checks the condition halfway through the body. It only checks when the body has finished and execution jumps back up.`,
    py`#### The three parts of a counting loop`,
    { code: py`pushups = 0                 # 1. initialise: set up the variable before the loop
while pushups < 5:          # 2. test: decide whether to go round again
    pushups += 1            # 3. update: change the variable inside the body
    print("Push-up", pushups)`, lang: 'python', title: 'initialise → test → update' },
    py`Forget the **initialise** and you get a \`NameError\`. Forget the **update** and the loop never ends. Get the **test** wrong by one (\`<\` vs \`<=\`) and you do one round too many or too few — an *off-by-one error*.`,
    py`#### Accumulators: building up a result`,
    py`An **accumulator** is a variable that collects a result across iterations — a running total, a count, the largest value so far. Initialise it *before* the loop with a neutral value (\`0\` for sums, \`""\` for text, \`[]\` for lists).`,
    { code: py`balance = 1000
years = 0
while balance < 2000:                 # how long until the money doubles at 7%?
    balance = balance * 107 // 100    # whole coins only (// is integer division)
    years += 1
print(years, "years, balance", balance)   # 11 years, balance 2098`, lang: 'python', title: 'repeat until a target is reached' },
    py`#### Sentinel loops: read until a stop value`,
    py`A **sentinel** is a special value that means "stop", like typing \`done\` or \`quit\`. There are two classic shapes. The first reads once before the loop (the *priming read*) and again at the end of the body:`,
    { code: py`word = input("Word (or quit): ")
while word != "quit":
    print(word.upper())
    word = input("Word (or quit): ")   # don't forget to read again!`, lang: 'python', title: 'priming read' },
    py`The second puts a single \`input()\` at the top of a \`while True:\` loop and leaves with \`break\`. It avoids writing the \`input()\` line twice, which is why many Python programmers prefer it:`,
    { code: py`while True:
    word = input("Word (or quit): ")
    if word == "quit":
        break                  # jump straight past the loop
    print(word.upper())`, lang: 'python', title: 'while True + break' },
    { callout: 'version', title: 'Python 3.8+: the walrus operator', text: py`\`while (word := input("Word: ")) != "quit":\` assigns and tests in one line using an *assignment expression* (\`:=\`). It's neat for short loops; the \`while True\` version is easier for beginners to read.` },
    py`#### Validation loops: ask until the answer is good`,
    { code: py`age_text = input("Age: ")
while not age_text.isdigit():
    print("Please type a whole number.")
    age_text = input("Age: ")
age = int(age_text)`, lang: 'python', title: 'keep asking until valid' },
    py`\`break\`, \`continue\` and the loop's own \`else:\` clause get a whole lesson: [loop control](lesson:loop-control).`,
  ],
  walkthrough: {
    title: 'Reading the expense logger line by line',
    lang: 'python',
    code: EXPENSE_LOGGER,
    intro: py`This is the program in the playground below. Its **Input** tab already holds four lines — \`4.50\`, \`12\`, \`3.25\` and \`done\` — and each \`input()\` call takes the next one. Press **Guide** there to follow these steps in the editor.`,
    steps: [
      { lines: [2, 3], text: py`Two **accumulators**, initialised before the loop: a running \`total\` (a float, since amounts have pennies) and a \`count\` of entries.` },
      { lines: [5], text: py`\`while True:\` has a condition that's always true, so the loop's only exit is the \`break\` inside it. We don't know how many amounts the user will type — exactly the job for \`while\`.` },
      { lines: [6], text: py`Each iteration reads **one** line. \`input()\` always returns a \`str\`, so the first time round \`entry\` is \`"4.50"\`, not a number.` },
      { lines: [7, 8], text: py`The sentinel check comes **before** converting to a number. If it came after, \`float("done")\` would crash with \`ValueError\`. \`break\` jumps straight to line 12.` },
      { lines: [9, 10], text: py`Convert and accumulate. These two lines are skipped on the iteration that read \`done\`, because \`break\` already left the loop.` },
      { lines: [12, 13], text: py`After the loop: \`count\` is 3 and \`total\` is 19.75. \`:.2f\` formats with two decimals.` },
      { lines: [14, 15], text: py`A guard: if the user typed \`done\` straight away, \`count\` is 0 and \`total / count\` would raise \`ZeroDivisionError\`. The loop body running **zero times** is a case you must always think about.` },
    ],
  },
  playground: {
    title: 'Expense logger',
    objective: 'Feed the loop different input lines and make it robust: blank lines, "DONE" in capitals, and a maximum number of entries.',
    files: { 'main.py': EXPENSE_LOGGER },
    stdin: '4.50\n12\n3.25\ndone',
    expected: py`After the four prompts:

\`\`\`text
Expenses: 3
Total: 19.75
Average: 6.58
\`\`\`

Edit the **Input** tab (one amount per line) and run again. What happens if the first line is \`done\`? What if you delete \`done\` altogether?`,
    experiments: [
      {
        id: 'skip-blank',
        task: py`Typing an empty line (just pressing Enter) crashes the program with \`ValueError: could not convert string to float: ''\`. Make the loop **ignore blank lines** and keep asking.`,
        hint: py`Right after the sentinel check, add \`if entry == "":\` with \`continue\` inside it. \`continue\` jumps back to the top of the loop for the next \`input()\`. (Alternatively, put the two adding lines inside \`if entry != "":\`.)`,
        tests: [
          { name: 'blank lines are skipped: 5, (blank), 2, done → 2 expenses, total 7.00', code: py`out = run_program('5\n\n2\ndone')
assert 'Expenses: 2' in out and 'Total: 7.00' in out` },
        ],
        explain: py`\`continue\` ends the current iteration early and goes straight back to the condition — here \`while True\`, so the next \`input()\` runs. Validating input **before** using it is the core job of most input loops.`,
      },
      {
        id: 'sentinel-case',
        task: py`Users type \`Done\` or \`DONE\` too, and the program crashes. Make the sentinel check **case-insensitive**.`,
        hint: py`Compare a lower-cased copy: \`if entry.lower() == "done":\`. Adding \`.strip()\` also forgives stray spaces.`,
        tests: [
          { name: '"Done" ends the loop', code: py`out = run_program('3\nDone')
assert 'Expenses: 1' in out` },
          { name: '"DONE" ends the loop', code: py`out = run_program('2\n8\nDONE')
assert 'Expenses: 2' in out and 'Total: 10.00' in out` },
        ],
        explain: py`The loop condition (here, the \`if\` that triggers \`break\`) decides when the loop ends. Making it more forgiving is safer than making the user type exactly the right thing. \`.lower()\` builds a new lower-case string; the original \`entry\` is untouched.`,
      },
      {
        id: 'max-entries',
        task: py`Add a safety limit: the loop must stop after **5** amounts even if nobody types \`done\`.`,
        hint: py`Change \`while True:\` to \`while count < 5:\`. The \`break\` for \`done\` still works as an early exit.`,
        tests: [
          { name: 'seven amounts and no "done" → stops after 5', code: py`out = run_program('1\n1\n1\n1\n1\n1\n1')
assert 'Expenses: 5' in out and 'Total: 5.00' in out` },
          { name: '"done" still ends it early', code: py`out = run_program('2\ndone')
assert 'Expenses: 1' in out` },
        ],
        explain: py`Now the loop has **two** exits: the condition \`count < 5\` becoming false, and the \`break\`. Real programs add limits like this — a maximum number of retries, a timeout — so that unexpected input can never keep a loop running forever.`,
      },
      {
        id: 'largest',
        task: py`Track the **largest** expense and print it after the total as \`Largest: 12.00\` (two decimals).`,
        hint: py`Initialise \`largest = 0.0\` before the loop. Inside, store the converted number in a variable (\`amount = float(entry)\`), then \`if amount > largest: largest = amount\`. Print with \`f"Largest: {largest:.2f}"\`.`,
        tests: [
          { name: 'prints "Largest: 12.00" for the default input', code: py`assert 'Largest: 12.00' in output` },
        ],
        explain: py`\`largest\` is another accumulator, but instead of adding it **keeps the best so far**. Each iteration compares one new value against it. (The built-in \`max()\` does this for you once the values are in a list.)`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The shape of every while loop',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'init', label: 'count = 0', note: 'set up before the loop', x: 110, y: 160, tone: 'paper' },
        { id: 'test', label: 'while count < 3', note: 'checked every round', x: 330, y: 160, tone: 'yellow' },
        { id: 'body', label: 'body', note: 'print(count); count += 1', x: 330, y: 280, tone: 'blue' },
        { id: 'after', label: 'after the loop', note: 'the next statement', x: 620, y: 160, tone: 'ink' },
        { id: 'forever', label: 'no update?', note: 'condition never changes', x: 620, y: 50, tone: 'red' },
      ],
      edges: [
        { from: 'init', to: 'test' },
        { from: 'test', to: 'body', label: 'True' },
        { id: 'back', from: 'body', to: 'test', label: 'jump back', dashed: true },
        { from: 'test', to: 'after', label: 'False' },
        { id: 'stuck', from: 'test', to: 'forever', label: 'always True', dashed: true },
      ],
      steps: [
        { focus: ['init'], text: py`**Initialise**: the variables the condition uses must exist before the loop starts.` },
        { focus: ['init', 'test'], edges: ['init->test'], text: py`**Test**: Python evaluates \`count < 3\` → \`0 < 3\` → \`True\`.` },
        { focus: ['test', 'body'], edges: ['test->body', 'back'], text: py`**Body**, then jump back. The body prints and **updates** \`count\`. Python never checks the condition mid-body — only when it jumps back up.` },
        { focus: ['test', 'body'], edges: ['test->body', 'back'], text: py`Round and round: \`count\` becomes 1, 2, 3. Each time Python returns to the test with the new value.` },
        { focus: ['test', 'after'], edges: ['test->after'], text: py`\`3 < 3\` is \`False\`: the body is skipped and execution continues **after** the loop. The body ran 3 times; the test ran 4 times.` },
        { focus: ['forever'], edges: ['stuck'], text: py`If the body never changes anything the condition depends on, the test is \`True\` forever: an **infinite loop**. In this sandbox a run is stopped after 10 seconds; on your own computer press **Ctrl+C**.` },
      ],
    },
    alt: 'A loop diagram. "count = 0" leads to the test "while count < 3". A True arrow goes down to the body, and a dashed "jump back" arrow returns from the body to the test. A False arrow leads right to "after the loop". A red node "no update?" is reached by a dashed "always True" arrow, showing an infinite loop.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`while\` loop is really just two jumps. At the top: *"if the condition is false, jump past the loop."* At the bottom of the body: *"jump back to the top."* Nothing else is special about it.`,
      py`Variables created or changed inside the loop **still exist after it**. Python has no separate "loop scope": after the plant-growing loop, \`height\` and \`day\` keep their final values, which is exactly why we can print \`day\` afterwards.`,
      py`If a loop never ends, your program looks "frozen": nothing more is printed and it never finishes. In this playground the run is stopped after **10 seconds** with *"Stopped: the code ran for more than 10 s"*. On your own computer, press **Ctrl+C** in the terminal, which raises \`KeyboardInterrupt\` and stops the program.`,
    ],
    technical: [
      py`The condition is re-evaluated **from scratch** before every iteration, using the same truth-testing rules as \`if\` (\`__bool__\`, then \`__len__\`). That's why \`while queue:\` works for a list you keep popping from: the length is checked fresh each time.`,
      py`\`while\` also accepts an \`else:\` block, which runs when the condition becomes false — but **not** when the loop is left by \`break\`. It's rarely needed with \`while\`; see [loop control](lesson:loop-control) for when it shines.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython compiles a \`while\` loop to a test followed by \`POP_JUMP_IF_FALSE\` (exit the loop) and a \`JUMP_BACKWARD\` instruction at the end of the body. A \`for i in range(n)\` loop instead uses a single \`FOR_ITER\` instruction that asks the \`range\` iterator (implemented in C) for the next number. That's why a counting loop written with \`while\` and \`i += 1\` does more work per iteration than the \`for\` version in CPython. The exact opcodes change between versions; measure with \`timeit\` rather than guessing.` },
      { code: py`  4   L1:     LOAD_FAST_BORROW_LOAD_FAST_BORROW 16 (i, n)
              COMPARE_OP              18 (bool(<))
              POP_JUMP_IF_FALSE       12 (to L2)
              NOT_TAKEN

  5           LOAD_FAST_BORROW         1 (i)
              LOAD_SMALL_INT           1
              BINARY_OP               13 (+=)
              STORE_FAST               1 (i)
              JUMP_BACKWARD           17 (to L1)`, lang: 'text', title: 'dis output for "while i < n: i += 1" (CPython 3.14)' },
      py`**Floats and \`!=\` don't mix.** \`0.1\` can't be stored exactly in binary, so adding it ten times gives \`0.9999999999999999\`, not \`1.0\`. A loop that waits for \`x != 1.0\` never ends. Use \`<\` / \`<=\`, or count with integers and convert. See [numbers & math](lesson:numbers-and-math).`,
    ],
    production: [
      py`**Every \`while\` needs an exit plan.** In production code, loops that wait for something external — a file to appear, a job to finish, a server to answer — always get a **maximum** (attempts or time). Unbounded retry loops are a classic cause of hung services and runaway costs.`,
      py`**Wait between retries.** A loop that retries a failing network call as fast as possible hammers the server. Real code sleeps between attempts, often with *exponential backoff* (wait 1 s, 2 s, 4 s…), and measures elapsed time with \`time.monotonic()\`, which never jumps backwards when the system clock changes.`,
      { code: py`import time

def wait_for_job(check_status, timeout_seconds=30):
    """Poll check_status() until it returns "done" or time runs out (simplified)."""
    deadline = time.monotonic() + timeout_seconds
    delay = 0.5
    while time.monotonic() < deadline:
        if check_status() == "done":
            return True
        time.sleep(delay)
        delay = min(delay * 2, 5)     # exponential backoff, capped at 5 s
    return False`, lang: 'python', title: 'a bounded polling loop (simplified: real code would also log and handle errors)' },
      py`**Long-running programs are while loops.** Game loops, servers and event loops (like [asyncio's](lesson:asyncio-basics)) are, at heart, \`while running:\` loops that wait for the next event, handle it and go round again. Their exit is a flag or a shutdown signal.`,
      py`**Prefer \`for\` for collections.** If you're writing \`i = 0; while i < len(items): …; i += 1\`, a [\`for\` loop](lesson:for-loops) does the same with no counter to forget, no off-by-one, and less work per iteration.`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting to update the condition variable',
      wrong: { code: py`attempts = 0
while attempts < 3:
    print("Trying to connect...")
    # attempts never changes, so this loop never ends`, lang: 'python', static: true },
      right: { code: py`attempts = 0
while attempts < 3:
    print("Trying to connect...")
    attempts += 1`, lang: 'python' },
      explanation: py`The condition only changes if the body changes something it depends on. Before running a new loop, point at the line that moves it towards the exit. If you can't find one, it's an infinite loop.`,
    },
    {
      title: 'Using != with a step that jumps over the target',
      wrong: { code: py`countdown = 10
while countdown != 0:
    print(countdown)
    countdown -= 3       # 10, 7, 4, 1, -2, -5 … never exactly 0`, lang: 'python', static: true },
      right: { code: py`countdown = 10
while countdown > 0:
    print(countdown)
    countdown -= 3`, lang: 'python' },
      explanation: py`\`!=\` only stops on one exact value. If the variable can skip past it (steps bigger than 1, floats with rounding), the loop runs forever. A range test (\`>\`, \`<\`, \`<=\`) stops as soon as you cross the line.`,
    },
    {
      title: 'Off by one: < vs <=',
      wrong: { code: py`# print the numbers 1 to 5
n = 1
while n < 5:
    print(n)       # prints 1, 2, 3, 4 — one short
    n += 1`, lang: 'python' },
      right: { code: py`# print the numbers 1 to 5
n = 1
while n <= 5:
    print(n)       # prints 1, 2, 3, 4, 5
    n += 1`, lang: 'python' },
      explanation: py`Check the **first** and **last** iteration by hand: what's the value on the first round, and on the last round before the condition fails? Most loop bugs are at the edges, not in the middle.`,
    },
    {
      title: 'Priming read without reading again',
      wrong: { code: py`command = input("> ")
while command != "quit":
    print("Running", command)
    # forgot to ask again: repeats the first command forever`, lang: 'python', static: true },
      right: { code: py`while True:
    command = input("> ")
    if command == "quit":
        break
    print("Running", command)`, lang: 'python' },
      explanation: py`With a priming read, the body must end with the same \`input()\` line. Writing a single \`input()\` at the top of \`while True:\` removes the duplication — and the bug.`,
    },
    {
      title: 'Converting before checking the sentinel',
      wrong: { code: py`total = 0
while True:
    amount = float(input("Amount: "))   # crashes on "done"
    if amount == "done":
        break
    total += amount`, lang: 'python', static: true },
      right: { code: py`total = 0
while True:
    entry = input("Amount: ")
    if entry == "done":
        break
    total += float(entry)`, lang: 'python' },
      explanation: py`The sentinel is text, so compare the raw string first, then convert. In the wrong version \`float("done")\` raises \`ValueError\` before the check ever runs — and even if it didn't, a float could never equal the string \`"done"\`.`,
    },
    {
      title: 'Using while + an index to walk a list',
      wrong: { code: py`songs = ["Intro", "Anthem", "Outro"]
i = 0
while i < len(songs):
    print(songs[i])
    i += 1`, lang: 'python' },
      right: { code: py`songs = ["Intro", "Anthem", "Outro"]
for song in songs:
    print(song)`, lang: 'python' },
      explanation: py`It works, but it gives you three chances to make a mistake (start, test, update) for no benefit. When you're visiting every item of a collection, use [\`for\`](lesson:for-loops).`,
    },
  ],
  debugging: [
    {
      symptom: py`Stopped: the code ran for more than 10 s. Look for a loop that never ends (or work that is too big for the browser).`,
      cause: py`An infinite loop: the condition never becomes false. Usually the update line is missing, is inside an \`if\` that doesn't run, moves the wrong way (\`+=\` instead of \`-=\`), or uses \`!=\` and jumps over the target.`,
      fix: py`Add \`print(...)\` of the condition's variables as the first line of the body and run again (stop it quickly). Check that each iteration moves them towards the exit. Add a safety limit while debugging: \`while count < 1000 and ...\`.`,
    },
    {
      symptom: py`KeyboardInterrupt`,
      cause: py`On your own computer you pressed Ctrl+C to stop a program that seemed stuck — Python raises \`KeyboardInterrupt\` at whatever line was running.`,
      fix: py`Read the traceback: the last line it shows is inside the loop that was running. That's the loop to inspect.`,
    },
    {
      symptom: py`ValueError: could not convert string to float: 'done'`,
      cause: py`The text was converted to a number **before** checking for the sentinel (or the user typed something that isn't a number, like an empty line).`,
      fix: py`Check for the sentinel (and blank lines) on the raw string first, then convert. For fully robust input use \`try\`/\`except ValueError\` — see [try/except](lesson:try-except).`,
    },
    {
      symptom: py`EOFError: EOF when reading a line`,
      cause: py`\`input()\` was called but there was no more input. In this sandbox that means the **Input** tab ran out of lines before your sentinel appeared; on a terminal it happens if input is piped from a file that ended.`,
      fix: py`Make sure the input ends with the sentinel (\`done\`). In programs that read piped input, treat end-of-input as "stop" (\`except EOFError: break\`).`,
    },
    {
      symptom: py`NameError: name 'total' is not defined`,
      cause: py`The accumulator was never initialised before the loop, so the first \`total += …\` has nothing to add to.`,
      fix: py`Initialise every accumulator and counter **before** the \`while\` line: \`total = 0\`.`,
    },
    {
      symptom: py`The loop body never runs at all.`,
      cause: py`The condition was already false on the very first check — e.g. \`while n > 10:\` with \`n = 0\`, or a sentinel variable initialised to the stop value.`,
      fix: py`Print the condition's value just before the loop. Remember that \`while\` checks **first**; the body can run zero times.`,
    },
  ],
  bestPractices: [
    'Use while when the number of repetitions depends on something that happens during the loop; use for to visit the items of a collection.',
    'Before running a loop, identify the line that moves it towards its exit.',
    'Prefer range tests (<, <=, >) over != for loop conditions.',
    'Initialise counters and accumulators right before the loop.',
    'Check the sentinel on the raw input before converting it.',
    'Give loops that wait on the outside world a limit: maximum attempts or a timeout.',
    'Test the edges: zero iterations, exactly one, and the last iteration.',
  ],
  useCases: [
    'Reading user input until a sentinel such as "done" or "quit".',
    'Re-asking for input until it is valid.',
    'Game loops and menus: while the player hasn\'t quit.',
    'Repeating a calculation until a target is reached (savings goals, population growth).',
    'Retrying an operation a limited number of times, waiting between attempts.',
    'Processing a queue or stack until it is empty: while tasks: task = tasks.pop().',
  ],
  whenToUse: {
    use: [
      'You can\'t know the number of iterations in advance.',
      'You loop until an event: a sentinel, valid input, a target value, an empty queue.',
      'Long-running loops with an explicit stop flag (games, servers).',
    ],
    avoid: [
      'Walking through every item of a list, string or dict — use for.',
      'Repeating something a known number of times — for _ in range(n) is shorter and safer.',
      'Waiting on the outside world with no limit — always add a maximum.',
    ],
  },
  comparison: {
    title: 'while vs for',
    headers: ['', 'while', 'for'],
    rows: [
      ['repeats…', 'as long as a condition is true', 'once for each item of an iterable'],
      ['number of iterations', 'often unknown in advance', 'known: one per item'],
      ['you manage', 'initialise, test and update yourself', 'nothing — the iterable drives it'],
      ['main risk', 'infinite loops, off-by-one', 'modifying the collection while looping over it'],
      ['typical use', 'input loops, retries, "until" calculations', 'lists, strings, dicts, files, range(n)'],
    ],
    note: py`Both support \`break\`, \`continue\` and an \`else:\` clause — see [loop control](lesson:loop-control). Next up: [for loops](lesson:for-loops).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'while-loops-q1',
      type: 'mcq',
      prompt: py`When does Python check a \`while\` loop's condition?`,
      options: [
        'Before every iteration, including the first',
        { text: 'After every iteration, so the body always runs at least once', why: 'That is a "do-while" loop, which Python does not have. Python checks first, so the body can run zero times.' },
        { text: 'Continuously — the loop stops the instant the condition becomes false', why: 'The condition is only checked when execution jumps back to the top. The rest of the current iteration still runs.' },
        { text: 'Only once, when the loop starts', why: 'Then it could never stop. The condition is re-evaluated every time round.' },
      ],
      answer: 0,
      explanation: py`Python evaluates the condition, runs the whole body if it's truthy, then jumps back and evaluates it again. If it's false the first time, the body never runs.`,
    },
    {
      id: 'while-loops-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`count = 0
total = 0
while count < 5:
    count += 1
    total += count
print(count, total)`,
      answer: '5 15',
      accept: ['5 15'],
      explanation: py`\`count\` is updated *before* it's added, so \`total\` gets 1 + 2 + 3 + 4 + 5 = 15. When \`count\` reaches 5, the condition \`5 < 5\` is false and the loop ends.`,
    },
    {
      id: 'while-loops-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`i = 1
while i <= 10:
    i *= 2
print(i)`,
      options: [
        { text: '8', why: '8 <= 10 is still true, so the body runs once more and doubles it.' },
        { text: '10', why: 'i only ever holds powers of two: 1, 2, 4, 8, 16.' },
        '16',
        { text: '32', why: 'After i becomes 16, the condition 16 <= 10 is false, so it is not doubled again.' },
      ],
      answer: 2,
      explanation: py`\`i\` goes 1 → 2 → 4 → 8 → 16. The check \`8 <= 10\` passes, so it's doubled to 16; then \`16 <= 10\` fails and the loop ends. The loop variable usually ends up **past** the limit, not at it.`,
    },
    {
      id: 'while-loops-q4',
      type: 'bug',
      prompt: 'This countdown never prints "Liftoff!" — it runs until the sandbox stops it. Click the line that causes it.',
      code: py`countdown = 10
while countdown != 0:
    print(countdown)
    countdown -= 3
print("Liftoff!")`,
      answerLine: 2,
      explanation: py`\`countdown\` goes 10, 7, 4, 1, -2… and never equals exactly 0, so \`!= 0\` stays true forever. Use \`while countdown > 0:\` — a range test stops as soon as the value crosses the line.`,
    },
    {
      id: 'while-loops-q5',
      type: 'fill',
      prompt: 'Complete the sentinel loop: it should repeat forever until the user types `quit`.',
      code: py`while ___:
    line = input("> ")
    if line == "quit":
        ___
    print("You said", line)`,
      answer: [['True'], ['break']],
      explanation: py`\`while True:\` loops with no built-in exit; \`break\` leaves the loop immediately when the sentinel arrives, so the \`print\` is skipped for \`quit\`.`,
    },
    {
      id: 'while-loops-q6',
      type: 'mcq',
      prompt: 'Which task is the best fit for a `while` loop rather than a `for` loop?',
      options: [
        { text: 'Printing every name in a list of players', why: 'You are visiting every item of a collection — that is exactly what for does, with no counter to manage.' },
        'Asking for a password until the user gets it right',
        { text: 'Repeating a greeting exactly 3 times', why: 'A known number of repetitions is for _ in range(3).' },
        { text: 'Adding up the numbers in a list', why: 'Again, one step per item of a collection: for (or the built-in sum()).' },
      ],
      answer: 1,
      explanation: py`You can't know in advance how many attempts the user will need. "Repeat until something happens" is \`while\`'s job; "do this for each item" is \`for\`'s.`,
    },
    {
      id: 'while-loops-q7',
      type: 'short',
      prompt: 'Name the three parts of a counter-controlled while loop and what goes wrong if you get each one wrong.',
      answer: py`1) **Initialise** the counter before the loop — forget it and you get a NameError (or a stale value from earlier). 2) **Test** it in the condition — use the wrong comparison (< vs <=) and you do one iteration too many or too few, an off-by-one error. 3) **Update** it inside the body — forget it (or move it the wrong way) and the condition never becomes false: an infinite loop.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'savings-goal',
      title: 'Savings goal',
      difficulty: 'beginner',
      prompt: py`The program reads two whole numbers: a savings **goal** and how much is saved **weekly** (both input lines are already written). Starting from \`savings = 0\` and \`weeks = 0\`:

- If \`weekly\` is **0 or less**, the goal can never be reached: print exactly \`Goal unreachable\` and **don't** start the loop.
- Otherwise, use a \`while\` loop to add \`weekly\` to \`savings\` (and 1 to \`weeks\`) until savings are **at least** the goal, then print \`Weeks needed: N\` (use \`print("Weeks needed:", weeks)\`).

Examples: goal \`100\`, weekly \`30\` → \`Weeks needed: 4\` (30, 60, 90, 120). Goal \`90\`, weekly \`30\` → \`Weeks needed: 3\`. Goal \`0\` → \`Weeks needed: 0\`.`,
      files: {
        'main.py': py`goal = int(input("Goal: "))
weekly = int(input("Weekly saving: "))
savings = 0
weeks = 0

# TODO: if weekly is 0 or less, print "Goal unreachable".
#       Otherwise, while savings are below the goal, add weekly to savings
#       and 1 to weeks — then print "Weeks needed:" and weeks.
print("Weeks needed:", weeks)
`,
      },
      hints: [
        'Why the first rule? If weekly is 0, savings never change, so "while savings < goal" would be true forever.',
        'Use if weekly <= 0: ... else: and put the while loop inside the else. The loop condition is savings < goal.',
        'else:\n    while savings < goal:\n        savings += weekly\n        weeks += 1\n    print("Weeks needed:", weeks)',
      ],
      solution: {
        explanation: py`The guard \`if weekly <= 0\` protects against an infinite loop: with nothing added each week, \`savings < goal\` would never become false. Inside the loop, each iteration is one week: add the saving, count the week. The condition is \`savings < goal\` (not \`<=\`) because reaching the goal **exactly** is enough — that's why 90 at 30 a week needs 3 weeks, not 4. A goal of 0 makes the condition false straight away, so the body runs zero times and \`weeks\` stays 0.`,
        files: {
          'main.py': py`goal = int(input("Goal: "))
weekly = int(input("Weekly saving: "))
savings = 0
weeks = 0

if weekly <= 0:
    print("Goal unreachable")
else:
    while savings < goal:
        savings += weekly
        weeks += 1
    print("Weeks needed:", weeks)
`,
        },
      },
      tests: [
        { name: 'goal 100 at 30 a week → 4 weeks', stdin: '100\n30', code: py`assert 'Weeks needed: 4' in output` },
        { name: 'goal 90 at 30 a week → exactly 3 weeks', stdin: '90\n30', code: py`assert 'Weeks needed: 3' in output` },
        { name: 'goal 0 → 0 weeks (the body never runs)', stdin: '0\n10', code: py`assert 'Weeks needed: 0' in output` },
        { name: 'saving 0 a week → "Goal unreachable" and no loop', stdin: '50\n0', code: py`assert 'Goal unreachable' in output and 'Weeks needed' not in output` },
        { name: 'a negative weekly amount is also unreachable', stdin: '50\n-5', code: py`assert 'Goal unreachable' in output` },
      ],
    },
    {
      id: 'pick-a-number',
      title: 'Ask until valid',
      difficulty: 'beginner',
      prompt: py`Ask the user to pick a number with \`input("Pick 1-10: ")\`. **Keep asking** until the answer is a whole number from 1 to 10 (inclusive).

- After each invalid answer — not a whole number (like \`seven\`), or out of range (like \`0\` or \`11\`) — print exactly \`Try again\`.
- When the answer is valid, print \`You picked N\` (use \`print("You picked", number)\`).

Invalid text must **not** crash the program. The string method \`.isdigit()\` returns \`True\` only if a string is made entirely of digits: \`"7".isdigit()\` is \`True\`, \`"seven".isdigit()\` and \`"-3".isdigit()\` are \`False\`.`,
      files: {
        'main.py': py`answer = input("Pick 1-10: ")

# TODO: keep asking while the answer is not a whole number from 1 to 10.
#       Print "Try again" after each invalid answer.

print("You picked", answer)
`,
      },
      hints: [
        'Use the priming-read pattern: one input() before the loop, and the same input() again at the end of the loop body.',
        'The loop should run while the answer is NOT valid. Valid means: answer.isdigit() and 1 <= int(answer) <= 10. Because and short-circuits, int() is only called when isdigit() was True.',
        'while not (answer.isdigit() and 1 <= int(answer) <= 10):\n    print("Try again")\n    answer = input("Pick 1-10: ")',
      ],
      solution: {
        explanation: py`The condition describes a **bad** answer: "not (all digits and between 1 and 10)". The loop body complains and reads again, so it repeats exactly as many times as there are bad answers — zero if the first one is fine. \`and\` short-circuits: for \`"seven"\`, \`isdigit()\` is \`False\`, so \`int("seven")\` is never attempted and nothing crashes. After the loop, the answer is guaranteed to be valid. (For fuller robustness — signs, spaces, unusual Unicode digits — real programs call \`int()\` inside \`try\`/\`except ValueError\`; see [try/except](lesson:try-except).)`,
        files: {
          'main.py': py`answer = input("Pick 1-10: ")

while not (answer.isdigit() and 1 <= int(answer) <= 10):
    print("Try again")
    answer = input("Pick 1-10: ")

print("You picked", int(answer))
`,
        },
      },
      tests: [
        { name: 'a valid first answer is accepted straight away', stdin: '7', code: py`assert 'You picked 7' in output and 'Try again' not in output` },
        { name: '0 and 11 are rejected, then 4 is accepted', stdin: '0\n11\n4', code: py`assert output.count('Try again') == 2 and 'You picked 4' in output` },
        { name: 'text like "seven" is rejected without crashing', stdin: 'seven\n3', code: py`assert output.count('Try again') == 1 and 'You picked 3' in output` },
        { name: '10 (the upper boundary) is valid', stdin: '10', code: py`assert 'You picked 10' in output and 'Try again' not in output` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'while-loops-while-vs-for',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'When would you use a while loop instead of a for loop in Python?',
      answer: 'Use while when the loop should continue until a condition changes and you can\'t know the number of iterations up front (input loops, retries, "until" calculations). Use for to visit each item of an iterable or to repeat a known number of times.',
      explanation: py`\`for\` is driven by an iterable — it ends when the items run out, so it can't loop forever by accident on a normal collection. \`while\` is driven by a condition you manage yourself, which is more flexible and more error-prone: you must initialise, test and update correctly.`,
      whyAsked: 'It checks whether you pick the right tool and understand the trade-off between flexibility and safety.',
      mistakes: ['Saying while is "for when you need an index"', 'Not mentioning the risk of infinite loops', 'Claiming the two are interchangeable with no trade-offs'],
      followUps: ['Rewrite a counting while loop as a for loop.', 'Can a for loop be infinite? (yes, over an infinite iterator such as itertools.count())', 'Does Python have a do-while loop?'],
      modelAnswer: 'I use a while loop when I need to repeat until something happens and I don’t know how many iterations that will take — reading input until a sentinel, retrying until success or a limit, or iterating until a value converges. A for loop is for walking through an iterable or repeating a known number of times, and I prefer it whenever it fits, because the iterable controls when it ends, so there’s no counter to forget and no off-by-one risk. With while I’m responsible for initialising, testing and updating the condition correctly, so I always check that each iteration makes progress toward the exit.',
    },
    {
      id: 'while-loops-stack-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`stack = [1, 2, 3]
while stack:
    print(stack.pop(), end=" ")` },
      options: ['1 2 3 ', '3 2 1 ', '3 2 1 0 ', 'It loops forever'],
      correctOption: 1,
      answer: '`3 2 1 ` — pop() removes and returns the last item, and the loop stops when the list is empty because an empty list is falsy.',
      explanation: py`\`while stack:\` re-checks the list's truthiness before each iteration. Each \`pop()\` shrinks the list, so after three iterations it's empty (falsy) and the loop ends. This "process until empty" pattern drives stack- and queue-based algorithms like depth-first search.`,
      whyAsked: 'It combines truthiness, mutation inside a loop condition and list semantics — and shows whether you trace code accurately.',
      mistakes: ['Thinking pop() removes the first item', 'Forgetting that the condition is re-evaluated each time', 'Expecting a trailing 0 or an IndexError'],
      followUps: ['How would you process items in first-in, first-out order efficiently? (collections.deque with popleft())', 'What happens if the body also appends to the list?'],
      modelAnswer: 'It prints 3 2 1 with spaces. The condition while stack uses the list’s truthiness: a non-empty list is truthy and an empty one is falsy. Each iteration pops the last item, so we get 3, then 2, then 1, and after that the list is empty, the condition is false and the loop ends without any error. This "while there’s work left, take one item" pattern is how stack-based algorithms like iterative depth-first search are written; for first-in-first-out I’d use a deque and popleft.',
    },
    {
      id: 'while-loops-collatz',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `collatz_steps(n)` for a positive integer n: while n is not 1, halve it if it is even, otherwise replace it with 3n + 1. Return how many steps it takes to reach 1.',
      answer: 'Keep a step counter and loop while n != 1, applying the rule and incrementing the counter each time; return the counter. n = 1 returns 0.',
      explanation: py`Nobody can tell you in advance how many steps a starting number needs — it's a famous unsolved problem (the Collatz conjecture says every positive start reaches 1, but it hasn't been proven). That's the perfect fit for \`while\`. Use integer division \`//\` so \`n\` stays an \`int\`; \`/\` would turn it into a float. Here \`!=\` is safe because the values are integers and 1 is the target itself.`,
      starter: { files: { 'main.py': py`def collatz_steps(n):
    steps = 0
    # TODO: loop until n is 1, counting each step
    return steps


print(collatz_steps(6))    # expect 8
` } },
      tests: [
        { name: 'collatz_steps(1) == 0', code: py`assert collatz_steps(1) == 0` },
        { name: 'collatz_steps(6) == 8', code: py`assert collatz_steps(6) == 8` },
        { name: 'collatz_steps(7) == 16', code: py`assert collatz_steps(7) == 16` },
        { name: 'collatz_steps(27) == 111', code: py`assert collatz_steps(27) == 111` },
      ],
      solution: { files: { 'main.py': py`def collatz_steps(n):
    steps = 0
    while n != 1:
        if n % 2 == 0:
            n = n // 2
        else:
            n = 3 * n + 1
        steps += 1
    return steps


print(collatz_steps(6))    # expect 8
` } },
      hints: ['The loop condition is n != 1.', 'Inside: an if/else for even/odd, then steps += 1. Use // for halving.'],
      whyAsked: 'A short problem where the iteration count is unknowable up front — it checks loop structure, integer arithmetic and edge cases (n = 1).',
      mistakes: ['Using / and producing floats', 'Counting the starting number as a step', 'Not considering what happens for n <= 0 (it never reaches 1 — validate input)'],
      followUps: ['What happens for n = 0 or negative n, and how would you guard against it?', 'How would you cache results for many starting values? (memoisation with a dict or functools.lru_cache)'],
      modelAnswer: 'I keep a steps counter at zero and loop while n is not 1. Inside, if n is even I halve it with integer division so it stays an int, otherwise I set it to 3n plus 1, and I increment steps once per iteration. When the loop ends, I return steps — so for n equal to 1 the body never runs and I return 0. A while loop is right here because the number of steps can’t be known in advance. In production I’d validate that n is a positive integer first, since zero or negatives would never reach 1 and the loop wouldn’t terminate.',
    },
    {
      id: 'while-loops-retry-hang',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A background worker sometimes hangs forever. Its code is `while not upload(file): pass`. What is wrong and how would you fix it?',
      answer: 'It retries an unreliable operation with no limit and no delay: if upload keeps failing, the loop never ends and it hammers the server. Bound it (max attempts and/or a deadline), wait between attempts with backoff, and report failure when the limit is reached.',
      explanation: py`A \`while\` loop waiting on the outside world must assume the outside world can fail forever. Fixes: a counter in the condition (\`attempts < 5\`), a deadline measured with \`time.monotonic()\`, \`time.sleep()\` between tries (growing exponentially, often with random *jitter*), and an explicit failure path — raise an exception or log and return \`False\` so the caller knows.`,
      code: { lang: 'python', code: py`import time

def upload_with_retry(upload, file, max_attempts=5):
    attempt = 1
    while attempt <= max_attempts:
        if upload(file):
            return True
        time.sleep(2 ** attempt * 0.1)   # back off: 0.2 s, 0.4 s, 0.8 s, ...
        attempt += 1
    return False                          # caller decides: log, alert, re-queue` },
      whyAsked: 'Unbounded retry loops cause real outages; interviewers look for limits, backoff and a failure path.',
      mistakes: ['Only adding time.sleep() — still unbounded', 'Retrying errors that will never succeed (e.g. "file not found") instead of failing fast', 'Swallowing the final failure silently'],
      followUps: ['Why add random jitter to the backoff?', 'Which errors should not be retried at all?', 'How would you test this without really sleeping? (inject a fake sleep function)'],
      modelAnswer: 'The loop has no exit other than success. If upload keeps failing — the network is down, credentials expired — the worker spins forever, and with no delay it hammers the server as fast as it can. I’d bound it with a maximum number of attempts or a deadline measured with time.monotonic, sleep between attempts with exponential backoff and some jitter, and make the failure explicit — return False or raise — so the caller can log or re-queue it. I’d also only retry errors that are plausibly temporary, like timeouts, and fail fast on permanent ones.',
    },
    {
      id: 'while-loops-sentinel-styles',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare three ways to read lines until the user types "quit": a priming read with a condition, while True with break, and the walrus operator.',
      answer: 'All three behave the same. The priming read duplicates the input() call (easy to forget the second one); while True + break has one input() and an explicit exit but hides the stop condition inside the body; the walrus form (3.8+) puts read-and-test in the loop header — concise, but denser for beginners.',
      explanation: py`Choose by readability. \`while True\` + \`break\` is the most common in real Python code because it keeps the read in one place and allows several exits. The walrus version is great for short loops; avoid cramming complex logic into the header.`,
      code: { lang: 'python', code: py`# 1. priming read
line = input("> ")
while line != "quit":
    print(line)
    line = input("> ")

# 2. while True + break
while True:
    line = input("> ")
    if line == "quit":
        break
    print(line)

# 3. assignment expression (Python 3.8+)
while (line := input("> ")) != "quit":
    print(line)` },
      whyAsked: 'It tests fluency with common loop idioms and the ability to discuss readability trade-offs rather than declaring one "correct".',
      mistakes: ['Saying while True is always bad style', 'Forgetting the parentheses in (line := input()) != "quit"', 'Not knowing the walrus operator needs Python 3.8+'],
      followUps: ['What happens without the parentheses around the walrus expression?', 'How would you also stop at end-of-input (EOFError)?'],
      modelAnswer: 'All three read until "quit". The priming read uses the condition as the exit but duplicates the input call, and forgetting the second one causes an infinite loop. while True with break keeps a single input call and makes the exit explicit, which is why it’s the most common style in Python, though the stopping condition lives in the body. The walrus operator, available since 3.8, reads and tests in the header, which is compact for short loops — but it needs parentheses and can be harder for newcomers to read. I pick whichever keeps that particular loop clearest.',
    },
    {
      id: 'while-loops-cpython-speed',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'In CPython, why is `i = 0; while i < n: ...; i += 1` typically slower than `for i in range(n): ...` for the same work?',
      answer: 'The while version executes several bytecode instructions per iteration in the interpreter loop (load, compare, conditional jump, load, add, store, jump back), each creating or touching Python int objects. The for version runs one FOR_ITER per iteration that asks the C-implemented range iterator for the next value. Less interpreted work per iteration means faster loops — measure with timeit to confirm for your case.',
      explanation: py`This is a CPython implementation detail, not a language rule: other implementations (e.g. PyPy's JIT compiler) can optimise both forms. The general principle — push work into C-implemented built-ins (\`range\`, \`sum\`, \`enumerate\`, comprehensions) rather than spelling it out in Python bytecode — is a recurring CPython performance theme. Never quote speed-ups without measuring: \`timeit\` is in the standard library.`,
      code: { lang: 'python', code: py`import timeit

def with_while(n=100_000):
    i = 0
    while i < n:
        i += 1

def with_for(n=100_000):
    for i in range(n):
        pass

print("while:", timeit.timeit(with_while, number=20))
print("for:  ", timeit.timeit(with_for, number=20))` },
      whyAsked: 'It probes whether you understand how the interpreter executes loops and can reason about performance without inventing numbers.',
      mistakes: ['Claiming a specific speed-up without measuring', 'Saying while loops are slow in every Python implementation', 'Not knowing that dis can show the bytecode'],
      followUps: ['How would you see the bytecode? (dis.dis)', 'Why do built-ins like sum() beat a hand-written loop?', 'Would this matter in an I/O-bound program?'],
      modelAnswer: 'In CPython the interpreter executes bytecode one instruction at a time. A hand-written while counter needs several instructions per iteration — load i, load n, compare, conditional jump, then load, add, store and jump back — and each step manipulates Python int objects. A for loop over range uses one FOR_ITER instruction that asks range’s C-implemented iterator for the next number, so far less interpreted work happens per iteration. That’s an implementation detail — a JIT like PyPy can optimise both — so I’d confirm with timeit rather than quote a number, and in an I/O-bound program it rarely matters.',
    },
    {
      id: 'while-loops-game-loop',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Sketch how you would structure the main loop of a long-running program — a game or a simple job-processing service — so that it can stop cleanly.',
      answer: 'A while loop driven by a running flag (or a shutdown event), where each iteration waits for or polls the next event with a timeout, handles it, and checks for a stop request. Cleanup (saving, closing connections) happens after the loop, ideally in a finally block, so it runs however the loop ends.',
      explanation: py`The loop shouldn't busy-wait: waiting calls (\`queue.get(timeout=…)\`, \`time.sleep\`, \`select\`, or an async event loop) let the CPU rest. A flag set by a signal handler or a "quit" event lets the current iteration finish before exiting, which avoids half-processed jobs. Putting cleanup in \`finally\` ([try/except](lesson:try-except)) guarantees it also runs after \`KeyboardInterrupt\` or an unexpected error.`,
      code: { lang: 'python', code: py`import queue

def run_worker(jobs, handle):
    """Process jobs until a None 'poison pill' arrives (simplified)."""
    running = True
    processed = 0
    try:
        while running:
            try:
                job = jobs.get(timeout=1.0)   # wait, don't spin
            except queue.Empty:
                continue                      # nothing yet: check the flag again
            if job is None:
                running = False               # stop request
            else:
                handle(job)
                processed += 1
    finally:
        print("worker stopped after", processed, "jobs")   # cleanup always runs


jobs = queue.Queue()
for job in ["resize photo", "send email", None]:
    jobs.put(job)
run_worker(jobs, print)` },
      whyAsked: 'Senior roles involve services that run for weeks; interviewers want to hear about stop conditions, not busy-waiting, and guaranteed cleanup.',
      mistakes: ['A bare while True with no way to stop except killing the process', 'Busy-waiting (polling in a tight loop without sleeping)', 'Doing cleanup only on the happy path'],
      followUps: ['How would you handle SIGTERM from a container orchestrator?', 'How does asyncio change this design?', 'How do you avoid losing a job that was in progress at shutdown?'],
      modelAnswer: 'I’d write the main loop as while running, where each iteration blocks on the next unit of work with a timeout — a queue get, a socket select, or an await in an event loop — so the process sleeps instead of spinning. After handling a job, the loop re-checks the running flag, which a signal handler or a special "stop" message can clear, so the current job finishes before we exit. All cleanup — flushing, closing connections, saving state — goes in a finally block after the loop, so it runs on a normal stop, on Ctrl+C or on an unexpected exception.',
    },
  ],

  takeaways: [
    'while repeats its body as long as the condition is truthy, checking before every iteration — so the body can run zero times.',
    'Every loop needs initialise → test → update; the update is what eventually makes the condition false.',
    'Prefer range tests (<, <=) over != so a step that jumps past the target still stops the loop.',
    'Sentinel loops read until a stop value; while True + break keeps the input() call in one place.',
    'Check the sentinel on the raw string before converting it to a number.',
    'An infinite loop freezes the program: the sandbox stops runs after 10 s; on your computer press Ctrl+C.',
    'Off-by-one bugs live at the edges — trace the first and last iteration by hand.',
  ],
}
