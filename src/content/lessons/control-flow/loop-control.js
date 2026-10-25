// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LOG_SCANNER = py`# Log scanner: break, continue and the loop's else clause
log_lines = [
    "# server log",
    "INFO started",
    "",
    "WARN disk 85% full",
    "INFO request ok",
    "ERROR payment timeout",
    "INFO request ok",
]

warning_count = 0
for number, line in enumerate(log_lines, start=1):
    if not line or line.startswith("#"):
        continue                     # skip blank lines and comments
    level, message = line.split(" ", 1)
    if level == "WARN":
        warning_count += 1
    elif level == "ERROR":
        print(f"Line {number}: first error -> {message}")
        break                        # stop at the first error
else:
    print("No errors found")         # runs only if the loop never hit break

print("Warnings before stopping:", warning_count)
`

export default {
  id: 'loop-control',
  title: 'break, continue & the loop else clause',
  summary: 'break leaves a loop early, continue skips to the next iteration, and a loop\'s else block runs only when the loop finished without a break.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['for-loops', 'while-loops'],
  related: ['for-loops', 'while-loops', 'if-statements', 'defining-functions', 'comprehensions', 'iterators', 'itertools', 'try-except'],
  tags: ['break', 'continue', 'else', 'for else', 'while else', 'pass', 'search', 'flag', 'early exit', 'nested loops', 'any', 'all', 'next', 'guard clause'],
  apis: [
    { name: 'break', summary: 'Leaves the innermost enclosing loop immediately; the loop\'s else block is skipped.' },
    { name: 'continue', summary: 'Skips the rest of the current iteration and goes on with the next one.' },
    { name: 'for … else / while … else', summary: 'The else block runs when the loop ends normally (items exhausted or condition false), but not after a break.' },
    { name: 'pass', summary: 'Does nothing. A placeholder where Python needs a statement.' },
    { name: 'any(iterable) / all(iterable)', summary: 'True if any / every item is truthy. Both stop as soon as the answer is known.' },
    { name: 'next(iterator, default)', summary: 'Returns the next item, or default when there is none — with a generator expression, "the first match or None".' },
  ],
  docs: [
    { label: 'Python tutorial — break and continue statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#break-and-continue-statements' },
    { label: 'Python tutorial — else clauses on loops', url: 'https://docs.python.org/3/tutorial/controlflow.html#else-clauses-on-loops' },
    { label: 'Language reference — the break statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-break-statement' },
    { label: 'Language reference — the continue statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-continue-statement' },
    { label: 'Language reference — the for statement (else clause)', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-for-statement' },
    { label: 'Built-in functions — any()', url: 'https://docs.python.org/3/library/functions.html#any' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A loop normally runs until its items run out ([\`for\`](lesson:for-loops)) or its condition turns false ([\`while\`](lesson:while-loops)). Often you want more control: **stop as soon as you've found what you're looking for**, or **skip the items you don't care about**. Python gives you two small statements for that:`,
    py`- **\`break\`** — leave the loop *right now*. Execution jumps to the first line after the loop.
- **\`continue\`** — skip the rest of *this* iteration and go straight on to the next one.`,
    { code: py`for number in [4, -1, 7, 0, 9]:
    if number < 0:
        continue          # ignore negatives, keep looping
    if number == 0:
        break             # a zero means "stop here"
    print(number)         # prints 4, then 7`, lang: 'python', title: 'skip one, stop at another' },
    py`Loops also have a little-known **\`else\`** clause that runs only if the loop finished **without** hitting \`break\` — perfect for "searched everything, found nothing". And \`pass\` is the statement that does nothing at all, for when Python needs a line but you don't. Finally, you'll see how to escape **nested** loops, where \`break\` alone isn't enough.`,
  ],
  why: [
    py`**Searching is everywhere**: find the first error in a log, the first free seat, the first user with a given email. Once found, every further iteration is wasted work — \`break\` stops it.`,
    py`**Real data is messy**: blank lines, comments, invalid rows. \`continue\` lets you dismiss them in one line at the top of the loop (a *guard clause* for loops, see [if statements](lesson:if-statements)) instead of wrapping the rest of the body in another level of \`if\`.`,
    py`**Knowing whether a search failed** is the other half of searching. Without the loop \`else\` you need an extra "found" variable; with it, the "not found" code sits right next to the loop it belongs to.`,
  ],
  eli15: [
    py`You've lost your keys and you search the house room by room.`,
    py`- The bathroom door is locked? **Skip it** and go to the next room. That's \`continue\`.
- You find the keys in the kitchen? **Stop searching** — you don't check the remaining rooms. That's \`break\`.
- You checked **every** room and never found them? *Then* you say "they're not in the house". That's the loop's \`else\`: it only happens if you never stopped early.`,
    py`\`pass\` is shrugging and doing nothing: "this room? …fine, moving on as normal."`,
  ],
  analogy: {
    title: 'Finding a seat on a train',
    body: [
      py`You board at one end of a train and walk through, carriage by carriage. A carriage is reserved for a school group? You walk straight through it without looking at a single seat (\`continue\`). You spot a free seat? You sit down — you don't walk the rest of the train (\`break\`).`,
      py`If you reach the last carriage without sitting down, you know the train is full, so you stand by the door (\`else\`). Notice: you only stand by the door if you **didn't** sit down. And if the train had several decks, sitting down ends your search on **every** deck, not just the one you're on — which is exactly what plain \`break\` can't do for nested loops.`,
    ],
    mapping: [
      ['walking carriage by carriage', 'a loop over a sequence'],
      ['walking straight through a reserved carriage', 'continue: skip the rest of this iteration'],
      ['sitting down in a free seat', 'break: leave the loop now'],
      ['reaching the end without sitting', 'the loop finishing normally'],
      ['standing by the door because the train is full', 'the loop\'s else block'],
      ['several decks, one search', 'nested loops: break only leaves the innermost one'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch continue skip, break exit and else decide',
    props: {
      code: py`orders = [12, -5, 30, 999, 8]
total = 0
for amount in orders:
    if amount < 0:
        continue          # skip refunds, go to the next order
    if amount > 500:
        print("Suspicious order:", amount)
        break             # stop processing entirely
    total += amount
else:
    print("All orders processed")   # skipped: the loop was broken
print("total:", total)

for name in ["Ada", "Ben"]:
    if name == "Zoe":
        break
else:
    print("Zoe not found")          # runs: no break happened
`,
      notes: {
        5: '`continue` jumps straight back to line 3 for the next order. Line 9 is skipped for -5.',
        8: '`break` jumps out of the loop entirely — past the `else` block — to line 12. The order `8` is never looked at.',
        12: '`total` is 12 + 30 = 42: the refund was skipped and the loop stopped before 999 and 8 were added.',
        18: 'This loop ran out of names without ever reaching `break`, so its `else` block runs.',
      },
    },
    alt: 'A step-by-step trace. For the order -5, continue jumps back to the loop header without adding it. For 999, the program prints "Suspicious order: 999" and break jumps past the else block straight to print total, which shows 42; the final order 8 is never processed. A second loop over Ada and Ben never breaks, so its else block prints "Zoe not found".',
    caption: py`Follow the highlighted line around \`continue\` and \`break\`. The first \`else\` is skipped because the loop was broken; the second \`else\` runs because the loop finished normally.`,
  },
  syntax: [
    py`#### break: leave the loop now`,
    { code: py`while True:
    command = input("> ")
    if command == "quit":
        break                  # jumps to the line after the loop
    print("You typed", command)
print("Bye!")`, lang: 'python', title: 'break in a while True loop' },
    py`\`break\` exits the **innermost** loop that contains it — only one level. It's almost always inside an \`if\`; an unconditional \`break\` would end the loop on its first iteration.`,
    py`#### continue: skip to the next iteration`,
    { code: py`for line in ["apples", "", "# a comment", "pears"]:
    if not line or line.startswith("#"):
        continue               # skip blanks and comments
    print("Item:", line)       # only real items get here`, lang: 'python', title: 'continue as a guard clause' },
    py`In a \`for\` loop, \`continue\` moves on to the next item. In a \`while\` loop it jumps back to the condition — so any update at the **bottom** of the body is skipped too (a classic infinite-loop bug; see the mistakes below).`,
    py`#### The loop else clause`,
    { code: py`menu = ["soup", "salad", "pasta"]
wanted = "pizza"
for dish in menu:
    if dish == wanted:
        print("Yes, we have", wanted)
        break
else:                          # lines up with "for", not with "if"
    print("Sorry, no", wanted) # runs: the loop never hit break`, lang: 'python', title: 'for … else' },
    py`The rule in one sentence: **the \`else\` block runs when the loop ends normally, and is skipped when the loop ends with \`break\`.** "Normally" means the \`for\` ran out of items (even zero items) or the \`while\` condition became false. Many people read it as **"no break"**.`,
    { code: py`attempts = 0
while attempts < 3:
    attempts += 1
    if input("Password: ") == "open sesame":
        print("Welcome!")
        break
else:
    print("Too many attempts — account locked")`, lang: 'python', title: 'while … else' },
    { callout: 'tip', title: 'Reading for/else', text: py`Some developers find \`else\` on a loop confusing, because \`if\`/\`else\` means "otherwise". If it helps, add a comment: \`else:  # no break\`. If your team dislikes it, a helper function with \`return\` or \`any()\` does the same job.` },
    py`#### pass: do nothing`,
    { code: py`for order in ["ok", "ok", "refund"]:
    if order == "refund":
        pass                   # TODO: handle refunds later
    print("processing", order) # still runs for every order

class EmptyForNow:
    pass                       # a block can't be empty`, lang: 'python', title: 'a placeholder statement' },
    py`\`pass\` is **not** \`continue\`: it doesn't skip anything. The rest of the body still runs. Use it as a placeholder while sketching code, or for "deliberately do nothing" branches (with a comment saying why).`,
    py`#### Search patterns compared`,
    { code: py`scores = [55, 72, 91, 64]

# 1. flag variable
found = False
for score in scores:
    if score >= 90:
        found = True
        break
print("flag:", found)

# 2. for ... else (no extra variable)
for score in scores:
    if score >= 90:
        print("else: found", score)
        break
else:
    print("else: none found")

# 3. any(): just the yes/no answer
print("any:", any(score >= 90 for score in scores))

# 4. next(): the first match, or a default
print("next:", next((s for s in scores if s >= 90), None))`, lang: 'python', title: 'four ways to ask "is there a score of 90+?"' },
    py`\`any(...)\` and \`next(...)\` take a *generator expression* — \`score >= 90 for score in scores\` is a compact loop written inside the brackets (more in [comprehensions](lesson:comprehensions)). Both stop at the first match, just like \`break\`.`,
    py`#### Breaking out of nested loops`,
    py`Python has no "break out of everything" statement: \`break\` leaves one loop. The cleanest fix is to put the loops in a function and \`return\` — which leaves **every** loop and the function at once ([defining functions](lesson:defining-functions)):`,
    { code: py`def find_seat(rows, wanted):
    for row_number, row in enumerate(rows):
        for seat_number, seat in enumerate(row):
            if seat == wanted:
                return row_number, seat_number   # exits both loops
    return None                                  # searched everything


cinema = [["X", "X", "X"], ["X", "_", "_"]]
print(find_seat(cinema, "_"))    # (1, 1)`, lang: 'python', title: 'return exits all loops at once' },
  ],
  walkthrough: {
    title: 'Reading the log scanner line by line',
    lang: 'python',
    code: LOG_SCANNER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 10], text: py`A tiny server log: a comment, a blank line, some INFO and WARN lines, and one ERROR on line 8.` },
      { lines: [13], text: py`\`enumerate(..., start=1)\` gives human line numbers alongside each line.` },
      { lines: [14, 15], text: py`A guard clause for loops: blank lines (falsy) and comments are dismissed with \`continue\`. Everything below can assume a real log line.` },
      { lines: [16], text: py`\`split(" ", 1)\` splits at the **first** space only, so \`"WARN disk 85% full"\` becomes \`"WARN"\` and \`"disk 85% full"\`.` },
      { lines: [17, 18], text: py`Count warnings and carry on — no \`break\`, so scanning continues.` },
      { lines: [19, 21], text: py`The first ERROR is reported and \`break\` leaves the loop. The INFO line after it is never read.` },
      { lines: [22, 23], text: py`The \`else\` lines up with \`for\`. It runs only if the loop got through every line without breaking — i.e. there was no error. Here it's **skipped**.` },
      { lines: [25], text: py`Runs either way. Prints \`Warnings before stopping: 1\`.` },
    ],
  },
  playground: {
    title: 'Log scanner',
    objective: 'Make the else clause run, count what continue skips, report every error, and answer a yes/no question with any().',
    files: { 'main.py': LOG_SCANNER },
    expected: py`\`\`\`text
Line 6: first error -> payment timeout
Warnings before stopping: 1
\`\`\`

The last INFO line is never scanned, and "No errors found" is not printed, because the loop ended with \`break\`.`,
    experiments: [
      {
        id: 'clean-log',
        task: py`Change the ERROR line to \`"INFO payment ok"\`. Predict the output before you run it.`,
        hint: py`With no ERROR line, the \`break\` never runs. What does that mean for the \`else\` block?`,
        tests: [
          { name: 'the log has no ERROR lines', code: py`assert not any(line.startswith("ERROR") for line in log_lines), 'Change the ERROR line to "INFO payment ok"'` },
          { name: '"No errors found" is printed by the else block', code: py`assert 'No errors found' in output` },
        ],
        explain: py`The loop ran through every line without hitting \`break\`, so it ended normally and the \`else\` block ran. That's the whole rule: **else = no break**.`,
      },
      {
        id: 'count-skipped',
        task: py`Count how many lines the \`continue\` skipped. After the loop, print \`Skipped: N\`.`,
        hint: py`Create \`skipped = 0\` before the loop, add \`skipped += 1\` just before \`continue\` (inside the same \`if\`), and print it at the end.`,
        tests: [
          { name: 'prints the number of skipped blank/comment lines', code: py`def is_noise(line):
    return not line or line.startswith("#")

before_error = 0
for line in log_lines:
    if line.startswith("ERROR"):
        break
    if is_noise(line):
        before_error += 1
everywhere = sum(1 for line in log_lines if is_noise(line))
assert f"Skipped: {before_error}" in output or f"Skipped: {everywhere}" in output` },
        ],
        explain: py`Anything you want to happen for a skipped item must come **before** \`continue\`: once it runs, the rest of the body is skipped. Counting skipped records is a good habit in data pipelines — silently dropped data is hard to notice.`,
      },
      {
        id: 'all-errors',
        task: py`Report **every** error instead of stopping at the first: delete the \`break\`, count errors in a variable named \`errors\` and print \`Errors: N\` after the loop. Add a second ERROR line to the log to check it. Then look closely: why does "No errors found" now appear? Replace the \`else:\` clause with an \`if errors == 0:\` check after the loop.`,
        hint: py`Without \`break\`, every loop ends "normally", so its \`else\` always runs. Once you no longer break, a counter is the right way to remember what happened.`,
        tests: [
          { name: 'errors counts every ERROR line', code: py`expected = sum(1 for line in log_lines if line.startswith("ERROR"))
assert ns.get('errors') == expected, 'Count errors in a variable named errors'` },
          { name: 'prints "Errors: N"', code: py`assert f"Errors: {ns.get('errors')}" in output` },
          { name: '"No errors found" only appears when there are none', code: py`if ns.get('errors'):
    assert 'No errors found' not in output, 'The loop no longer breaks, so its else always runs — use if errors == 0: instead'` },
        ],
        explain: py`The loop \`else\` is only useful **together with** \`break\`. Remove the \`break\` and the \`else\` runs every time, which is never what you want. A counter (or a list of the errors found) records the outcome instead.`,
      },
      {
        id: 'any-warning',
        task: py`After the loop, answer "does the log contain any WARN line?" in **one line** with \`any()\`, store it in \`has_warning\`, and print it.`,
        hint: py`\`has_warning = any(line.startswith("WARN") for line in log_lines)\` — then \`print("Has warnings:", has_warning)\`.`,
        tests: [
          { name: 'has_warning holds the right True/False answer', code: py`assert 'has_warning' in ns, 'Create a variable named has_warning'
assert has_warning == any(line.startswith("WARN") for line in log_lines)` },
          { name: 'the answer is printed', code: py`assert str(has_warning) in output` },
        ],
        explain: py`\`any()\` is a whole search loop with \`break\` built in: it stops at the first truthy item and returns \`True\`, or returns \`False\` after checking everything. Its partner \`all()\` stops at the first falsy item.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The four ways out of an iteration',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'next', label: 'next item?', note: 'loop header', x: 110, y: 90, tone: 'yellow' },
        { id: 'body', label: 'loop body', note: 'your code', x: 340, y: 90, tone: 'blue' },
        { id: 'cont', label: 'continue', note: 'skip the rest', x: 340, y: 250, tone: 'kraft' },
        { id: 'brk', label: 'break', note: 'leave now', x: 600, y: 90, tone: 'red' },
        { id: 'else', label: 'else block', note: 'only if no break', x: 110, y: 250, tone: 'paper' },
        { id: 'after', label: 'after the loop', note: 'next statement', x: 600, y: 250, tone: 'ink' },
      ],
      edges: [
        { from: 'next', to: 'body', label: 'an item' },
        { id: 'loopback', from: 'body', to: 'next', label: 'end of body', dashed: true },
        { from: 'body', to: 'cont' },
        { id: 'cont-back', from: 'cont', to: 'next', label: 'next iteration', dashed: true },
        { from: 'body', to: 'brk' },
        { from: 'brk', to: 'after', label: 'skips else' },
        { from: 'next', to: 'else', label: 'no items left' },
        { from: 'else', to: 'after' },
      ],
      steps: [
        { focus: ['next', 'body'], edges: ['next->body', 'loopback'], text: py`**Normal iteration**: get an item, run the whole body, go back for the next one.` },
        { focus: ['body', 'cont', 'next'], edges: ['body->cont', 'cont-back'], text: py`**continue**: abandon the rest of the body for this item and go straight back to the header. The loop itself carries on.` },
        { focus: ['body', 'brk', 'after'], edges: ['body->brk', 'brk->after'], text: py`**break**: leave the loop immediately. Execution lands **after** the loop — jumping over the \`else\` block.` },
        { focus: ['next', 'else', 'after'], edges: ['next->else', 'else->after'], text: py`**Normal end**: the items ran out (or the \`while\` condition became false). This is the only path that goes through \`else\`.` },
        { focus: ['else'], text: py`So \`else\` answers one question: *"did this loop finish without a \`break\`?"* In a search, that means *"nothing was found"*.` },
      ],
    },
    alt: 'Diagram of a loop with four paths. From "next item?" an arrow goes to the loop body, and a dashed "end of body" arrow returns. From the body, continue leads back to the header with a dashed "next iteration" arrow. From the body, break leads to "after the loop", skipping the else block. When there are no items left, the header leads to the else block and then to "after the loop".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`break\` and \`continue\` are **jumps**. \`break\` jumps to the first line after the loop (past any \`else\`); \`continue\` jumps back to the loop's header, where a \`for\` fetches its next item and a \`while\` re-checks its condition.`,
      py`They only make sense inside a loop. Outside one, Python refuses to run the file: \`SyntaxError: 'break' outside loop\` or \`SyntaxError: 'continue' not properly in loop\`.`,
      py`A \`for\` loop over zero items "finishes normally" straight away, so its \`else\` block runs. That's consistent with the search meaning: you searched everything (nothing) and found nothing.`,
    ],
    technical: [
      py`**Innermost loop only.** Both statements affect the nearest enclosing \`for\` or \`while\`. Python deliberately has no labelled \`break outer\` (a proposal for it, PEP 3136, was rejected): the recommended tools are functions with \`return\`, or restructuring the loops — e.g. \`itertools.product(rows, cols)\` turns two nested loops into one, so a single \`break\` is enough.`,
      py`**\`any()\`, \`all()\` and \`next()\` short-circuit.** \`any(gen)\` pulls items from the generator only until it finds a truthy one. That's the same early exit as a \`break\`, and it means the rest of the generator is never even computed. Note the edge cases: \`any([])\` is \`False\` and \`all([])\` is \`True\` ("every item of nothing is truthy").`,
      py`**Interaction with \`try\`/\`finally\`.** If \`break\` or \`continue\` leaves a \`try\` block, its \`finally\` clause still runs on the way out — cleanup is guaranteed (see [try/except](lesson:try-except)).`,
      { callout: 'version', title: 'Python 3.14: break/continue/return inside finally warn', text: py`PEP 765 makes Python 3.14 emit \`SyntaxWarning: 'break' in a 'finally' block\` (likewise for \`continue\` and \`return\`). A jump out of \`finally\` silently swallows any exception that was being raised, which is almost always a bug. Put the jump after the \`try\` statement instead.` },
      { callout: 'note', title: 'CPython detail', text: py`In CPython's bytecode, \`break\` and \`continue\` compile to plain jump instructions (for a \`for\` loop, \`break\` also discards the iterator). The loop \`else\` costs nothing extra: it's simply the code placed where the loop exits normally, which \`break\` jumps over. These are implementation details — the language only defines the behaviour.` },
    ],
    production: [
      py`**Use \`continue\` as a filter at the top.** "Skip invalid records first, process the rest" keeps the main logic unindented. Count or log what you skip — silently discarded data causes the nastiest reporting bugs.`,
      py`**Searching? Consider a function.** A small \`find_…()\` function that \`return\`s the match (or \`None\`) is easier to test, reuse and read than a \`break\` plus a flag, and it handles nested loops for free. For the yes/no question, \`any()\` is shortest.`,
      py`**Prefer \`for\`/\`else\` over flags — when your team reads it fluently.** It removes a variable and keeps "not found" next to the search. In codebases where it confuses people, a function with \`return\` is the universally readable alternative. Either way, put the \`else\` comment: \`# no break\`.`,
      py`**Bound \`while True\` loops.** Every \`while True: … break\` should have an obvious, reachable \`break\` (and, for loops waiting on the outside world, a maximum number of attempts) — see [while loops](lesson:while-loops).`,
      py`**Exceptions are for errors, not for control flow.** Raising an exception to escape nested loops works but hides intent and is slower than \`return\`. Keep it for genuine error conditions ([error-handling patterns](lesson:error-handling-patterns)).`,
    ],
  },
  mistakes: [
    {
      title: 'continue skipping the update in a while loop',
      wrong: { code: py`i = 0
while i < 10:
    if i % 2 == 0:
        continue       # jumps back before i += 1 → stuck at 0 forever
    print(i)
    i += 1`, lang: 'python', static: true },
      right: { code: py`i = 0
while i < 10:
    i += 1             # update first
    if i % 2 == 0:
        continue
    print(i)`, lang: 'python' },
      explanation: py`\`continue\` skips **everything** below it, including the update at the bottom of a \`while\` body. Update before any \`continue\` — or use \`for i in range(10):\`, where the loop does the updating.`,
    },
    {
      title: 'Lining the else up with the if instead of the loop',
      wrong: { code: py`fruits = ["apple", "kiwi", "plum"]
for fruit in fruits:
    if fruit == "plum":
        print("Found plum")
        break
    else:
        print("Not found")   # printed for apple AND kiwi`, lang: 'python' },
      right: { code: py`fruits = ["apple", "kiwi", "plum"]
for fruit in fruits:
    if fruit == "plum":
        print("Found plum")
        break
else:
    print("Not found")       # only if the loop never broke`, lang: 'python' },
      explanation: py`Indentation decides what \`else\` belongs to. Indented under the loop, it pairs with the \`if\` and runs for every non-matching item. Lined up with \`for\`, it runs once, only if nothing matched.`,
    },
    {
      title: 'Expecting break to leave every nested loop',
      wrong: { code: py`grid = [[1, 2], [3, 4], [5, 3]]
for row in grid:
    for value in row:
        if value == 3:
            print("found a 3")
            break          # only leaves the inner loop
# prints "found a 3" twice — the outer loop kept going`, lang: 'python' },
      right: { code: py`def contains(grid, target):
    for row in grid:
        for value in row:
            if value == target:
                return True    # leaves both loops
    return False


print(contains([[1, 2], [3, 4], [5, 3]], 3))   # True`, lang: 'python' },
      explanation: py`\`break\` leaves only the loop it's directly in. Wrap nested loops in a function and \`return\`, or for a yes/no answer use \`any(value == target for row in grid for value in row)\`.`,
    },
    {
      title: 'Using pass where you meant continue',
      wrong: { code: py`for name in ["Ada", "", "Ben"]:
    if not name:
        pass               # does nothing — the line below still runs
    print("Hello,", name)  # prints "Hello, " for the blank name`, lang: 'python' },
      right: { code: py`for name in ["Ada", "", "Ben"]:
    if not name:
        continue           # skips the rest of this iteration
    print("Hello,", name)`, lang: 'python' },
      explanation: py`\`pass\` is a no-op placeholder; it doesn't change the flow at all. \`continue\` is the one that skips.`,
    },
    {
      title: 'Keeping the loop else after removing the break',
      wrong: { code: py`for score in [55, 91, 64]:
    if score >= 90:
        print("A distinction!")
else:
    print("No distinctions")   # runs anyway: there is no break to skip it`, lang: 'python' },
      right: { code: py`distinctions = 0
for score in [55, 91, 64]:
    if score >= 90:
        distinctions += 1
if distinctions == 0:
    print("No distinctions")`, lang: 'python' },
      explanation: py`A loop \`else\` without a \`break\` in the loop always runs, so it's pointless (and misleading). Use \`else\` only for searches that \`break\`; otherwise record the outcome in a variable.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: 'break' outside loop`,
      cause: py`A \`break\` that isn't inside a \`for\` or \`while\` body — often because the indentation moved it out of the loop, or it's in an \`if\` that isn't in a loop at all.`,
      fix: py`Check the indentation: the \`break\` must be indented under the loop. To leave a function early, use \`return\`; to stop a script, let it reach the end (or call \`sys.exit()\`).`,
    },
    {
      symptom: py`SyntaxError: 'continue' not properly in loop`,
      cause: py`Same as above for \`continue\`: it's not inside a loop body.`,
      fix: py`Move it into the loop, or replace it with an \`if\`/\`else\` if there's no loop involved.`,
    },
    {
      symptom: py`Stopped: the code ran for more than 10 s. Look for a loop that never ends (or work that is too big for the browser).`,
      cause: py`A \`continue\` in a \`while\` loop skips the line that updates the loop variable — or a \`while True\` loop's \`break\` condition can never be true.`,
      fix: py`Move the update above every \`continue\`, and check that the \`break\` condition is reachable. Printing the loop variable as the first line of the body shows the loop stuck on one value.`,
    },
    {
      symptom: py`"Not found" is printed many times, once per item.`,
      cause: py`The \`else\` is indented to pair with the \`if\` inside the loop, not with the loop itself.`,
      fix: py`Dedent \`else:\` so it lines up with \`for\`/\`while\`.`,
    },
    {
      symptom: py`The loop stops after the very first item.`,
      cause: py`The \`break\` is not inside the \`if\` — it's indented at the loop-body level, so it runs unconditionally on the first iteration.`,
      fix: py`Indent the \`break\` under the \`if\` that should trigger it.`,
    },
    {
      symptom: py`SyntaxWarning: 'break' in a 'finally' block`,
      cause: py`(Python 3.14+) A \`break\`, \`continue\` or \`return\` inside a \`finally\` clause. If an exception was being raised, the jump would silently discard it.`,
      fix: py`Move the \`break\` after the \`try\` statement, and let \`finally\` contain only cleanup.`,
    },
  ],
  bestPractices: [
    'Put continue-based guard clauses at the top of the loop body to skip invalid items early.',
    'Put any update or counting a skipped item needs before the continue.',
    'Use for/else only together with break, and mark it with a "# no break" comment.',
    'For "is there any…?" use any(); for "the first one that…" use next(…, None) or a small function that returns.',
    'Escape nested loops by returning from a function, not with flags threaded through every level.',
    'Use pass only as a placeholder or for a deliberate no-op, with a comment saying why.',
  ],
  useCases: [
    'Stopping a search as soon as the item is found (first error, first free seat, matching user).',
    'Skipping blank lines, comments and invalid rows while processing data.',
    'Leaving a while True input loop when the user types a command such as quit.',
    'Reporting "not found" after a search with for/else.',
    'Limiting attempts: a for loop over range(3) that breaks on success, with else for "locked out".',
  ],
  comparison: {
    title: 'Four ways to answer "is there a match?"',
    headers: ['approach', 'gives you', 'exits nested loops?', 'best when'],
    rows: [
      ['flag + break', 'True/False in a variable', 'no — needs a check at every level', 'you are stuck with old code; otherwise prefer another option'],
      ['for … else + break', 'act on found / not found', 'no', 'the "not found" action belongs right next to the loop'],
      ['function + return', 'the match (or None)', 'yes', 'you need the item, or the search spans nested loops'],
      ['any() / next(…, None)', 'True/False, or the first match', 'yes (one generator over both levels)', 'a short condition fits on one line'],
    ],
    note: py`All four stop at the first match; none of them keeps scanning once the answer is known.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'loop-control-q1',
      type: 'mcq',
      prompt: py`When does the \`else\` block of a \`for\` loop run?`,
      options: [
        'When the loop finishes without executing break',
        { text: 'Only when the loop body never ran (an empty sequence)', why: 'It does run for an empty sequence, but also after a loop that ran normally through all its items. The rule is "no break".' },
        { text: 'When break is executed', why: 'The opposite: break skips the else block.' },
        { text: 'When an exception is raised inside the loop', why: 'An exception leaves the loop without running else, just like break.' },
      ],
      answer: 0,
      explanation: py`The \`else\` runs whenever the loop ends **normally** — items exhausted (including zero items) for \`for\`, condition false for \`while\`. \`break\` (and exceptions, and \`return\`) skip it.`,
    },
    {
      id: 'loop-control-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`for n in [3, 7, 9]:
    if n % 2 == 0:
        print("even found")
        break
else:
    print("no even numbers")`,
      answer: 'no even numbers',
      accept: ['no even numbers'],
      explanation: py`None of the numbers is even, so \`break\` never runs; the loop finishes normally and its \`else\` block prints \`no even numbers\`.`,
    },
    {
      id: 'loop-control-q3',
      type: 'output',
      prompt: 'Predict the output (`end=" "` prints a space instead of a newline).',
      code: py`n = 0
while n < 5:
    n += 1
    if n == 3:
        continue
    print(n, end=" ")`,
      options: [
        { text: '1 2', why: 'That would be break. continue only skips the current iteration; the loop carries on.' },
        '1 2 4 5',
        { text: '1 2 3 4 5', why: 'When n is 3, continue skips the print for that iteration.' },
        { text: 'It never ends', why: 'The update n += 1 comes before the continue, so the loop still makes progress.' },
      ],
      answer: 1,
      explanation: py`\`continue\` skips the \`print\` only when \`n == 3\`. Because \`n += 1\` is above the \`continue\`, the loop keeps moving and ends normally after 5.`,
    },
    {
      id: 'loop-control-q4',
      type: 'bug',
      prompt: 'This should print the odd numbers below 10, but it runs until the sandbox stops it. Click the line that causes the problem.',
      code: py`i = 0
while i < 10:
    if i % 2 == 0:
        continue
    print(i)
    i += 1`,
      answerLine: 4,
      explanation: py`When \`i\` is 0, \`continue\` jumps back to the condition **before** \`i += 1\` runs, so \`i\` stays 0 forever. Move the update above the \`continue\`, or use \`for i in range(10):\`.`,
    },
    {
      id: 'loop-control-q5',
      type: 'fill',
      prompt: 'Complete the search so that "no admin" is printed only if no user is named "admin".',
      code: py`users = ["ada", "ben", "cy"]
for user in users:
    if user == "admin":
        print("admin found")
        ___
___:
    print("no admin")`,
      answer: [['break'], ['else']],
      explanation: py`\`break\` stops the search when the admin is found, which also skips the loop's \`else\`. The \`else\` (lined up with \`for\`) runs only when the loop got through every user without breaking.`,
    },
    {
      id: 'loop-control-q6',
      type: 'output',
      prompt: 'What does this print? (`end=""` prints nothing between calls.)',
      code: py`for ch in "a-b":
    if ch == "-":
        pass
    print(ch, end="")`,
      options: [
        'a-b',
        { text: 'ab', why: 'That is what continue would do. pass does nothing, so the print still runs for "-".' },
        { text: 'a', why: 'That would be break. pass does not change the flow of the loop.' },
        { text: '-', why: 'Every character is printed; pass does not filter anything.' },
      ],
      answer: 0,
      explanation: py`\`pass\` is a statement that does nothing. The \`if\` block runs it and execution simply continues to the \`print\`, so all three characters are printed.`,
    },
    {
      id: 'loop-control-q7',
      type: 'short',
      prompt: '`break` only leaves the innermost loop. Describe two good ways to stop searching a grid (a list of lists) as soon as a value is found.',
      answer: py`1) Put the nested loops in a function and \`return\` the result (or the position) as soon as it's found — return leaves every loop at once, and \`return None\` after the loops means "not found". 2) For a yes/no answer, use \`any()\` with a generator that covers both levels: \`any(value == target for row in grid for value in row)\`, which stops at the first match. (Other options: \`itertools.product\` to turn two loops into one, or a flag checked after the inner loop — the flag is the clunkiest.)`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'pin-attempts',
      title: 'Three tries at the PIN',
      difficulty: 'beginner',
      prompt: py`A cash machine gives you **3 attempts** to type the PIN \`4321\`. Read each attempt with \`input("PIN: ")\`.

- Correct PIN → print \`Unlocked\` and **stop asking** immediately.
- Wrong PIN → print \`Wrong PIN\` and ask again (if attempts are left).
- After 3 wrong attempts → print \`Card blocked\`.

Use a \`for\` loop over \`range(3)\` with \`break\`, and the loop's \`else\` clause for the "blocked" message — no extra variables needed.

Examples: input \`1111\` then \`4321\` prints \`Wrong PIN\` then \`Unlocked\`. Input \`1\`, \`2\`, \`3\` prints \`Wrong PIN\` three times, then \`Card blocked\`.`,
      files: {
        'main.py': py`CORRECT_PIN = "4321"

# TODO: allow 3 attempts, stop on success, block the card after 3 failures
pin = input("PIN: ")
if pin == CORRECT_PIN:
    print("Unlocked")
else:
    print("Wrong PIN")
`,
      },
      hints: [
        'Wrap the input and the check in: for attempt in range(3):',
        'On success, print "Unlocked" and break. The "Card blocked" message belongs in an else: block lined up with the for — it only runs if the loop never broke.',
        'for attempt in range(3):\n    pin = input("PIN: ")\n    if pin == CORRECT_PIN:\n        print("Unlocked")\n        break\n    print("Wrong PIN")\nelse:\n    print("Card blocked")',
      ],
      solution: {
        explanation: py`\`range(3)\` gives exactly three iterations — three attempts. A correct PIN prints \`Unlocked\` and \`break\`s, which also **skips the \`else\`**, so the card is never blocked after a success and no further PIN is requested. If all three attempts fail, the loop runs out of iterations, ends normally, and its \`else\` prints \`Card blocked\`. The \`print("Wrong PIN")\` needs no \`else\` of its own, because the \`break\` already left the loop on success.`,
        files: {
          'main.py': py`CORRECT_PIN = "4321"

for attempt in range(3):
    pin = input("PIN: ")
    if pin == CORRECT_PIN:
        print("Unlocked")
        break
    print("Wrong PIN")
else:
    print("Card blocked")
`,
        },
      },
      tests: [
        { name: 'right first time → Unlocked, no "Wrong PIN"', stdin: '4321', code: py`assert 'Unlocked' in output and 'Wrong PIN' not in output and 'Card blocked' not in output` },
        { name: 'one wrong, then right → Wrong PIN, Unlocked', stdin: '1111\n4321', code: py`assert output.count('Wrong PIN') == 1 and 'Unlocked' in output and 'Card blocked' not in output` },
        { name: 'right on the third try is still accepted', stdin: '1\n2\n4321', code: py`assert output.count('Wrong PIN') == 2 and 'Unlocked' in output and 'Card blocked' not in output` },
        { name: 'three wrong → Card blocked', stdin: '1\n2\n3', code: py`assert output.count('Wrong PIN') == 3 and 'Card blocked' in output and 'Unlocked' not in output` },
        { name: 'stops asking after success', stdin: '4321\n9999\n9999', code: py`assert output.count('PIN: ') == 1, 'After the right PIN, the loop should break instead of asking again'` },
      ],
    },
    {
      id: 'first-free-seat',
      title: 'First free seat',
      difficulty: 'beginner',
      prompt: py`\`find_free_seat(rows)\` receives a cinema as a list of rows; each row is a list of seats, \`"X"\` for taken and \`"_"\` for free. Return the position of the **first** free seat in reading order (row by row, left to right) as a tuple \`(row_index, seat_index)\`, counting from 0. If every seat is taken (or there are no rows), return \`None\`.

\`\`\`python
find_free_seat([["X", "_", "_"],
                ["_", "X", "X"]])   # (0, 1)
\`\`\`

The starter uses \`break\`, but \`break\` only leaves the **inner** loop — so it keeps searching later rows and returns the wrong seat. Fix it.`,
      files: {
        'main.py': py`def find_free_seat(rows):
    found = None
    for row_index, row in enumerate(rows):
        for seat_index, seat in enumerate(row):
            if seat == "_":
                found = (row_index, seat_index)
                break   # only leaves the inner loop!
    return found


cinema = [["X", "_", "_"],
          ["_", "X", "X"]]
print(find_free_seat(cinema))   # expect (0, 1)
`,
      },
      hints: [
        'After the inner break, the outer loop moves on to the next row and overwrites found. You need to leave both loops at once.',
        'Inside a function, return leaves every loop immediately. Return the position the moment you find it.',
        'Replace the two lines found = ... and break with: return row_index, seat_index — and return None after both loops.',
      ],
      solution: {
        explanation: py`\`return\` ends the whole function, so it exits the inner loop, the outer loop and the function in one step — exactly "stop at the first match". If the loops finish without returning, nothing was free, so the last line returns \`None\`. That last line plays the same role as a loop's \`else\` block: it's only reached when the search found nothing. No flag variable, no \`break\`, and an empty cinema (\`[]\`) works automatically because the loops just don't run.`,
        files: {
          'main.py': py`def find_free_seat(rows):
    for row_index, row in enumerate(rows):
        for seat_index, seat in enumerate(row):
            if seat == "_":
                return row_index, seat_index
    return None


cinema = [["X", "_", "_"],
          ["_", "X", "X"]]
print(find_free_seat(cinema))   # expect (0, 1)
`,
        },
      },
      tests: [
        { name: 'first free seat in the first row', code: py`assert find_free_seat([["X", "_", "_"], ["_", "X", "X"]]) == (0, 1)` },
        { name: 'first free seat in a later row', code: py`assert find_free_seat([["X", "X"], ["X", "_"], ["_", "_"]]) == (1, 1)` },
        { name: 'full cinema → None', code: py`assert find_free_seat([["X", "X"], ["X", "X"]]) is None` },
        { name: 'no rows → None', code: py`assert find_free_seat([]) is None` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'loop-control-break-continue-pass',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between break, continue and pass?',
      answer: 'break exits the innermost loop immediately; continue skips the rest of the current iteration and moves to the next one; pass does nothing at all — it\'s a placeholder where a statement is required.',
      explanation: py`\`break\` and \`continue\` change control flow and only work inside loops. \`pass\` changes nothing and works anywhere a statement is required (empty functions, classes, branches). Confusing \`pass\` with \`continue\` is a common beginner bug: \`pass\` doesn't skip the rest of the body.`,
      code: { lang: 'python', code: py`for n in [1, 2, 3, 4]:
    if n == 2:
        continue      # skip 2
    if n == 4:
        break         # stop before printing 4
    print(n)          # 1, 3
else:
    pass              # placeholder: nothing to do here` },
      whyAsked: 'A quick warm-up that checks precise understanding of control flow vocabulary.',
      mistakes: ['Saying pass skips to the next iteration', 'Saying break exits all nested loops', 'Forgetting that break skips the loop else'],
      followUps: ['What happens to a loop\'s else block after break?', 'How do you exit two nested loops at once?', 'Where else is pass useful besides loops?'],
      modelAnswer: 'break leaves the innermost loop immediately, and execution continues after the loop — skipping the loop’s else clause if there is one. continue abandons the rest of the current iteration and goes on with the next one; in a while loop that means re-checking the condition. pass does nothing at all; it exists because Python’s syntax requires a statement in every block, so I use it for empty classes, stub functions or deliberately empty branches. The classic mix-up is using pass where continue was intended — pass doesn’t skip anything.',
    },
    {
      id: 'loop-control-for-else',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does the else clause on a for or while loop do, and when would you use it?',
      answer: 'It runs when the loop terminates normally — the iterable is exhausted or the while condition becomes false — and is skipped if the loop exits via break (or return/exception). It is used for searches: break on found, else handles "not found" without a flag variable.',
      explanation: py`The mental model is "else = no break". It shines in search loops, retry loops (\`for attempt in range(3): … break / else: give up\`) and validation scans. Because many developers misread it as "if the loop didn't run", teams often comment it (\`# no break\`) or prefer a function with \`return\`.`,
      code: { lang: 'python', code: py`def is_prime(n):
    if n < 2:
        return False
    for divisor in range(2, int(n ** 0.5) + 1):
        if n % divisor == 0:
            break
    else:
        return True     # no divisor found
    return False


print([n for n in range(20) if is_prime(n)])   # [2, 3, 5, 7, 11, 13, 17, 19]` },
      whyAsked: 'It is a distinctly Pythonic feature; knowing it — and its readability trade-off — signals depth.',
      mistakes: ['Saying else runs when the loop body never executed', 'Saying else runs when an exception occurs', 'Using else on a loop that has no break'],
      followUps: ['Does else run for an empty iterable?', 'Rewrite the search using any() or next().', 'Would you use it in a team codebase?'],
      modelAnswer: 'A loop’s else block runs when the loop ends normally — the for loop ran out of items, or the while condition became false — and it’s skipped if the loop was left with break, return or an exception. So the way I read it is "no break". Its main use is searching: I break when I find the item, and the else handles the not-found case right next to the loop, without a separate found flag. It only makes sense when the loop contains a break. Because some people find it unintuitive, I add a "no break" comment, or use a small function with return if the team prefers that.',
    },
    {
      id: 'loop-control-nested-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`for i in range(3):
    for j in range(3):
        if j == 1:
            break
        print(i, j)` },
      options: ['0 0 only', '0 0, 1 0, 2 0 (three lines)', '0 0, 0 1, 0 2 (three lines)', 'Nothing'],
      correctOption: 1,
      answer: 'Three lines: `0 0`, `1 0`, `2 0`. break leaves only the inner loop, so for each i the inner loop prints j = 0 and breaks at j = 1; the outer loop carries on.',
      explanation: py`\`break\` exits the innermost loop only. The outer \`for i\` keeps iterating, starting a fresh inner loop each time. To stop everything you'd need \`return\` from a function, a flag checked by the outer loop, or a single loop (e.g. via \`itertools.product\`).`,
      whyAsked: 'Tracing nested loops with break is a staple of predict-the-output rounds and exposes a very common misconception.',
      mistakes: ['Assuming break stops both loops', 'Printing j = 1 before breaking', 'Losing track of which loop is which'],
      followUps: ['How would you stop both loops at the first j == 1?', 'What changes if break becomes continue?'],
      modelAnswer: 'It prints 0 0, 1 0 and 2 0 on three lines. For each value of i the inner loop starts at j equals 0, prints, then at j equals 1 hits break — but break only leaves the inner loop, so the outer loop moves on to the next i and starts a fresh inner loop. If I wanted the first break to end everything, I’d put the loops in a function and return, or flatten them into one loop with itertools.product.',
    },
    {
      id: 'loop-control-find-pair',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Fix `find_pair(numbers, target)`: it should return the first pair (numbers[i], numbers[j]) with i < j whose sum equals target — scanning i from the left, then j after i — or None. The current version returns the wrong pair and can pair an item with itself.',
      answer: 'Start the inner loop at i + 1 so each pair uses two different positions, and return the pair as soon as it is found (return exits both loops); return None after the loops.',
      explanation: py`The starter's \`break\` only exits the inner loop, so later iterations of the outer loop overwrite the result — it ends up with the **last** match, not the first. Starting \`j\` at 0 also pairs an element with itself and counts each pair twice. The nested-loop solution is O(n²); a follow-up is the O(n) single pass with a set of numbers seen so far.`,
      starter: { files: { 'main.py': py`def find_pair(numbers, target):
    result = None
    for i in range(len(numbers)):
        for j in range(len(numbers)):
            if numbers[i] + numbers[j] == target:
                result = (numbers[i], numbers[j])
                break
    return result


print(find_pair([2, 7, 11, 15], 9))   # expect (2, 7)
` } },
      tests: [
        { name: 'finds (2, 7) in [2, 7, 11, 15] for 9', code: py`assert find_pair([2, 7, 11, 15], 9) == (2, 7)` },
        { name: 'returns the first pair in scan order', code: py`assert find_pair([1, 4, 2, 3], 5) == (1, 4)` },
        { name: 'can use equal values at two different positions', code: py`assert find_pair([3, 3], 6) == (3, 3)` },
        { name: 'never pairs an item with itself', code: py`assert find_pair([5], 10) is None` },
        { name: 'no pair → None', code: py`assert find_pair([1, 2, 3], 7) is None` },
      ],
      solution: { files: { 'main.py': py`def find_pair(numbers, target):
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] + numbers[j] == target:
                return numbers[i], numbers[j]
    return None


print(find_pair([2, 7, 11, 15], 9))   # expect (2, 7)
` } },
      hints: ['What does the outer loop do after the inner break?', 'Return the pair immediately, and start j at i + 1.'],
      whyAsked: 'A classic (two-sum) that tests early exit from nested loops, index boundaries and, in follow-ups, algorithmic improvement.',
      mistakes: ['Keeping break and adding a flag check in the outer loop (works, but clunky)', 'Starting j at 0, which pairs an item with itself', 'Not handling the "no pair" case'],
      followUps: ['Make it O(n) with a set of numbers seen so far.', 'Return indexes instead of values.', 'What if all pairs are needed?'],
      modelAnswer: 'Two bugs. The break only leaves the inner loop, so the outer loop keeps going and later matches overwrite the result — it returns the last pair, not the first. And j starts at zero, so an item can pair with itself. I start j at i plus one and return the pair the moment I find it, since return exits both loops, then return None after the loops for the not-found case. That’s quadratic; for large inputs I’d do one pass with a set of the numbers seen so far and check whether target minus the current number is in it.',
    },
    {
      id: 'loop-control-flag-refactor',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A code review shows: found = False / for order in orders: if order.total > LIMIT: found = True / if found: alert(). The loop keeps scanning after the first match. How would you improve it?',
      answer: 'Stop at the first match and drop the flag. If only a yes/no is needed: if any(order.total > LIMIT for order in orders): alert(). If the matching order is needed: first = next((o for o in orders if o.total > LIMIT), None). Or use break with for/else.',
      explanation: py`The original does unnecessary work (no early exit) and spreads one idea over five lines. \`any()\` both short-circuits and states intent. \`next(gen, None)\` gives the first match or a default. A small \`find_large_order()\` function is the most testable option when the condition is complex.`,
      code: { lang: 'python', code: py`LIMIT = 1000
orders = [{"id": 1, "total": 250}, {"id": 2, "total": 1800}, {"id": 3, "total": 90}]

if any(order["total"] > LIMIT for order in orders):
    print("alert!")

first_big = next((order for order in orders if order["total"] > LIMIT), None)
print(first_big)        # {'id': 2, 'total': 1800}` },
      whyAsked: 'It checks that you write intention-revealing loops and know the built-ins that replace boilerplate.',
      mistakes: ['Adding break but keeping the flag when any() says it directly', 'Using a list comprehension inside any(), which builds the whole list first and loses the early exit', 'Forgetting the default in next(), which raises StopIteration when nothing matches'],
      followUps: ['Why is any([...]) worse than any(...) here?', 'What does next() do without a default when nothing matches?', 'When is a flag still reasonable?'],
      modelAnswer: 'Two problems: it keeps scanning after the answer is known, and the flag spreads one question across several lines. If I just need yes or no, I’d write if any(order.total > LIMIT for order in orders) — any stops at the first match and reads like the requirement. If I need the order itself, next with a generator and a default of None gives me the first match or None. I’d avoid passing a list comprehension to any, because that builds the whole list first and loses the early exit. For a complicated condition, I’d move the search into a small, testable function that returns.',
    },
    {
      id: 'loop-control-nested-exit',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'Python has no labelled break. Compare the ways to exit nested loops early and say which you would choose.',
      answer: 'Options: (1) move the loops into a function and return — clearest, my default; (2) a flag checked after the inner loop — works but verbose; (3) the for/else-continue-break idiom — compact but obscure; (4) flatten with itertools.product or a generator so a single break suffices; (5) raise and catch an exception — works but misuses exceptions. Choose return or flattening.',
      explanation: py`A function makes the search a named, testable unit and \`return\` exits every level. Flattening (\`for r, c in itertools.product(range(rows), range(cols))\`) turns the problem into a single loop. The \`else: continue\` / \`break\` idiom (inner loop's \`else\` continues the outer loop; otherwise the outer \`break\` runs) is legal but most readers have to stop and decode it. Exceptions are for errors, and they're comparatively expensive in CPython.`,
      code: { lang: 'python', code: py`import itertools

grid = [[4, 8], [15, 16], [23, 42]]

# flattening: one loop, so one break is enough
for row, col in itertools.product(range(len(grid)), range(len(grid[0]))):
    if grid[row][col] > 10:
        print("first > 10 at", (row, col))
        break

# the for/else idiom (legal, but needs a comment to be readable)
for row in grid:
    for value in row:
        if value > 10:
            break
    else:
        continue      # inner loop didn't break: next row
    break             # inner loop broke: stop the outer loop too
print("stopped at row", row)` },
      whyAsked: 'It tests knowledge of language limits and the judgement to pick the most readable workaround.',
      mistakes: ['Claiming Python supports break with a label', 'Recommending exceptions as the default', 'Not mentioning the function/return option'],
      followUps: ['Why was labelled break (PEP 3136) rejected?', 'How would you find all matches instead of the first?', 'How does any() handle two levels of nesting?'],
      modelAnswer: 'Since break only leaves one loop, my default is to put the nested loops in a function and return as soon as I find what I need — return exits every level, and the search becomes a named, testable unit. If it reads naturally as one loop, I flatten it, for example with itertools.product, so a single break is enough. A flag checked after the inner loop works but is verbose, and the else-continue-break trick is legal but hard to read without a comment. Raising an exception to escape is possible, but it misuses exceptions for normal control flow, so I avoid it.',
    },
    {
      id: 'loop-control-finally',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How do break and continue interact with try/finally, and what changed in Python 3.14?',
      answer: 'If break or continue leaves a try block, the finally clause runs first — cleanup is guaranteed. Putting break/continue (or return) inside finally is dangerous because it silently discards an in-flight exception; since 3.14 (PEP 765) the compiler emits a SyntaxWarning for it.',
      explanation: py`\`finally\` runs on every way out of a \`try\`: normal completion, exceptions, \`return\`, \`break\` and \`continue\`. The reverse direction is the trap: a \`break\` **in** \`finally\` overrides whatever was happening — including an exception being raised — so the error vanishes. PEP 765 made that a \`SyntaxWarning: 'break' in a 'finally' block\` in Python 3.14, as a step towards forbidding it.`,
      code: { lang: 'python', code: py`def process(jobs):
    for job in jobs:
        try:
            if job == "stop":
                break
            print("processing", job)
        finally:
            print("cleanup after", job)   # runs even when we break
    return "done"


print(process(["a", "stop", "b"]))
# processing a / cleanup after a / cleanup after stop / done` },
      whyAsked: 'Resource cleanup in loops (files, locks, connections) depends on this; the 3.14 change shows you follow the language\'s evolution.',
      mistakes: ['Thinking break skips finally', 'Not knowing that a jump inside finally swallows exceptions', 'Assuming the 3.14 change is an error rather than a warning'],
      followUps: ['Why is return inside finally a bug magnet?', 'How would a with statement simplify the example?', 'What happens to the loop\'s else when break leaves through a finally?'],
      modelAnswer: 'finally always runs when control leaves its try block, and break and continue are no exception — if I break out of a loop from inside a try, the finally clause runs first, so cleanup like closing files is guaranteed. The danger is the other way round: a break, continue or return inside the finally itself overrides whatever was in progress, including an exception, so the error silently disappears. Python 3.14 implemented PEP 765, which makes the compiler emit a SyntaxWarning for those jumps out of finally. In practice I keep finally for cleanup only, and usually a with statement does that job even more cleanly.',
    },
  ],

  takeaways: [
    'break leaves the innermost loop immediately; continue skips the rest of the current iteration.',
    'A loop\'s else block runs only if the loop ended without break — think "no break".',
    'Use for/else for searches: break when found, else for "not found". Without a break, the else always runs.',
    'In a while loop, put the update before any continue, or the loop may never end.',
    'pass does nothing; it\'s a placeholder, not a skip.',
    'break only exits one loop: use a function with return, any()/next(), or flatten the loops to stop a nested search.',
  ],
}
