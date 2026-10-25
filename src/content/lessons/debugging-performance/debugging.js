// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const DASHBOARD = py`# Review dashboard: one product shows an impossible rating.
# Debug it methodically: reproduce, isolate, hypothesise, test, fix, add a test.


def parse_review(line):
    """'kettle, 4' -> ('kettle', 4)"""
    product, stars = line.split(",")
    return product.strip(), int(stars)


def average_by_product(lines):
    totals = {}
    counts = {}
    for line in lines:
        product, stars = parse_review(line)
        totals[product] = totals.get(product, 0) + stars
        counts[product] = 1
    return {product: totals[product] / counts[product] for product in totals}


REVIEWS = [
    "kettle, 4",
    "toaster, 5",
    "kettle, 2",
    "lamp, 3",
    "kettle, 5",
]

averages = average_by_product(REVIEWS)
for product, avg in averages.items():
    print(f"{product:<8} {avg:.1f} stars")
`

const SCRIPTED_PDB = py`# The same bug, inspected with a *scripted* pdb session.
# pdb is the real debugger; its commands come from COMMANDS instead of
# your keyboard, so you can read exactly what each command shows.
import bdb
import io
import pdb
import sys


def parse_review(line):
    product, stars = line.split(",")
    return product.strip(), int(stars)


def average_by_product(lines):
    totals = {}
    counts = {}
    for line in lines:
        product, stars = parse_review(line)
        totals[product] = totals.get(product, 0) + stars
        counts[product] = 1
    return {product: totals[product] / counts[product] for product in totals}


REVIEWS = ["kettle, 4", "toaster, 5", "kettle, 2"]

# One pdb command per line. n = next line, s = step into a call,
# w = where (call stack), u/d = up/down a frame, p = print,
# r = run until this function returns, b = breakpoint (with a condition),
# c = continue, cl = clear a breakpoint. Edit them and run again!
COMMANDS = """\
n
n
n
s
w
u
p line
d
r
n
b 21, product == "kettle"
c
p totals, counts
c
p totals, counts
cl 1
c
"""


class TypedCommands(io.StringIO):
    """Hands pdb one command at a time and echoes it, like a real session."""

    def readline(self, *args):
        line = super().readline(*args) or "continue\n"
        sys.stdout.write(line)
        return line


debugger = pdb.Pdb(stdin=TypedCommands(COMMANDS), stdout=sys.stdout, readrc=False)
try:
    result = debugger.runcall(average_by_product, REVIEWS)
    print("result:", result)
except bdb.BdbQuit:
    print("(you quit the debugger with q)")
`

export default {
  id: 'debugging',
  title: 'Debugging with print, pdb & breakpoint()',
  summary: 'Find bugs with a method instead of luck: reproduce, isolate, hypothesise, test, fix — using tracebacks, f"{x=}" prints, assertions, breakpoint() and pdb.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['reading-errors', 'try-except', 'defining-functions'],
  related: ['raising-exceptions', 'logging', 'testing-fundamentals', 'pytest-basics', 'string-formatting', 'profiling', 'tdd', 'debugging-scenarios'],
  tags: ['debugging', 'pdb', 'breakpoint', 'traceback', 'print debugging', 'f-string =', 'assert', 'post-mortem', 'bisect', 'git bisect', 'rubber duck', 'regression test', 'stack trace', 'debugger'],
  apis: [
    { name: 'breakpoint()', summary: 'Pause the program here and open the debugger (pdb by default). Calls sys.breakpointhook(). (3.7+)' },
    { name: 'pdb.set_trace()', summary: 'The pre-3.7 way to open pdb at the current line; breakpoint() calls it for you.' },
    { name: 'pdb.post_mortem(tb_or_exc)', summary: 'Open pdb inside the frame where an exception was raised, after the crash.' },
    { name: 'pdb.pm()', summary: 'Post-mortem on the last uncaught exception (handy after python -i script.py).' },
    { name: 'python -m pdb script.py', summary: 'Run a whole script under the debugger; add -c continue to run until it crashes.' },
    { name: 'f"{expr=}"', summary: 'Self-documenting f-string: prints the expression text, =, and its repr. (3.8+)' },
    { name: 'assert condition, message', summary: 'Raises AssertionError(message) if condition is false. Removed when Python runs with -O.' },
    { name: 'traceback.print_exc()', summary: 'Print the current exception’s full traceback without stopping the program.' },
    { name: 'sys.breakpointhook', summary: 'The function breakpoint() calls. Controlled by the PYTHONBREAKPOINT environment variable.' },
  ],
  docs: [
    { label: 'pdb — the Python debugger', url: 'https://docs.python.org/3/library/pdb.html' },
    { label: 'Built-in breakpoint()', url: 'https://docs.python.org/3/library/functions.html#breakpoint' },
    { label: 'PEP 553 — built-in breakpoint()', url: 'https://peps.python.org/pep-0553/' },
    { label: 'f-strings and the = specifier', url: 'https://docs.python.org/3/reference/lexical_analysis.html#f-strings' },
    { label: 'The assert statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement' },
    { label: 'traceback — print or retrieve a stack traceback', url: 'https://docs.python.org/3/library/traceback.html' },
    { label: 'git bisect (Git documentation)', url: 'https://git-scm.com/docs/git-bisect' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **bug** is any difference between what your program *should* do and what it *actually* does. **Debugging** is the work of finding *why* — and it is a skill you can learn, not a talent you're born with.`,
    py`Beginners debug by staring and guessing. Professionals debug with a **method**:`,
    py`1. **Reproduce** — make the bug happen on demand, with the smallest input you can.
2. **Isolate** — narrow down *where* it goes wrong (which function, which line, which value).
3. **Hypothesise** — say out loud what you think is wrong.
4. **Test** — check the hypothesis with evidence: a print, an assertion, a debugger.
5. **Fix** — change the code, only once you know the cause.
6. **Lock it in** — add a *regression test* (a test that fails if this exact bug ever comes back).`,
    py`Your tools for steps 2–4 are this lesson: reading **tracebacks** (see [reading errors](lesson:reading-errors)), **print debugging** with \`f"{x=}"\`, **assertions** as tripwires, and the debugger **pdb**, which you open with \`breakpoint()\`.`,
  ],
  why: [
    py`Every program you write will have bugs. The difference between a junior and a senior developer is rarely *how many* bugs they write — it's how *quickly and calmly* they find them.`,
    py`Guessing doesn't scale. Changing random lines until the output looks right ("shotgun debugging") often hides the bug instead of fixing it, and adds new ones. A method turns a frustrating mystery into a short checklist.`,
    py`Debugging is also how you *learn* a codebase. Stepping through someone else's code in a debugger shows you what really happens — which functions call which, and what every value is at each moment.`,
  ],
  eli15: [
    py`Imagine your bike makes a weird clicking noise. You don't randomly replace parts. You ride it until it clicks again (**reproduce**). You lift the back wheel and spin the pedals by hand — still clicking? Then it's not the front wheel (**isolate**). "I bet the pedal is loose" (**hypothesise**). You wiggle the pedal: it moves! (**test**). You tighten it (**fix**). Next week you check the pedal again (**regression test**).`,
    py`Debugging code is exactly that. A *traceback* is the bike telling you where it hurts. A *print* is putting your ear next to a part. A *debugger* is a magic pause button: you freeze time mid-ride and look at every part while it's moving.`,
  ],
  analogy: {
    title: 'Finding the click in a bike',
    body: [
      py`A good mechanic doesn't swap parts at random — that's expensive and might not fix anything. They make the noise happen, rule out parts one by one, form a theory, check it, fix the one broken part, and test-ride the bike before handing it back.`,
      py`Your program is the bike. The debugger is a work stand that lets you turn the pedals slowly and watch every part. Print statements are listening at one spot. A regression test is the test ride that proves the click is gone — and the note in the service book that makes sure it gets checked again.`,
    ],
    mapping: [
      ['riding until it clicks again', 'reproduce: a small input that triggers the bug every time'],
      ['spinning the wheel by hand', 'isolate: call one function on its own, comment parts out, bisect'],
      ['"I bet the pedal is loose"', 'hypothesis: one specific, testable guess'],
      ['wiggling the pedal', 'evidence: a print, an assert, or a look in the debugger'],
      ['the work stand', 'pdb: pause the program and inspect it line by line'],
      ['the test ride after the repair', 'a regression test that fails if the bug returns'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Step through a buggy function',
    props: {
      code: py`def average_rating(ratings):
    total = 0
    for i in range(1, len(ratings)):
        total += ratings[i]
    return total / len(ratings)


reviews = [5, 3, 4]
avg = average_rating(reviews)
print(f"{avg=:.2f}")   # expected avg=4.00
`,
      notes: {
        1: 'Python defines the function — nothing inside it runs yet.',
        8: 'Three ratings: the average *should* be (5 + 3 + 4) / 3 = 4.0.',
        9: 'Watch the call: a new frame for `average_rating` appears on the call stack.',
        3: 'Look at `i` on the **first** pass: it is 1, not 0. That’s the moment the bug happens.',
        4: 'Only `ratings[1]` and `ratings[2]` are added. `ratings[0]` (the 5) is never touched.',
        5: '`total` is 7, but we divide by 3 — the answer is too low.',
        10: 'The `=` specifier prints the expression and its value: `avg=2.33`. The symptom is far from the cause.',
      },
    },
    alt: 'A step-by-step trace of average_rating([5, 3, 4]). The loop variable i starts at 1 instead of 0, so only the ratings 3 and 4 are added; total ends at 7, which is divided by 3, and the program prints avg=2.33 instead of the expected 4.00.',
    caption: py`Step with ▶ and watch \`i\` and \`total\` in the frame. The bug is an **off-by-one error**: \`range(1, …)\` skips index 0. Stepping line by line and watching values is exactly what a debugger like pdb does — this tracer is a visual one.`,
  },
  syntax: [
    py`#### 1. Read the traceback (bottom-up)`,
    py`A **traceback** is Python's report of a crash: the chain of function calls (the *call stack*) that was active when the exception happened. Read it **from the bottom**: the last line is the exception type and message; the lines above it show where, with the innermost call last.`,
    { code: py`Traceback (most recent call last):
  File "/home/ada/reviews/main.py", line 14, in <module>
    print(report("lamp", []))
          ~~~~~~^^^^^^^^^^^^
  File "/home/ada/reviews/main.py", line 10, in report
    avg = average_rating(ratings)
  File "/home/ada/reviews/main.py", line 6, in average_rating
    return total / len(ratings)
           ~~~~~~^~~~~~~~~~~~~~
ZeroDivisionError: division by zero`, lang: 'text', title: 'bottom line = what; frame above it = where; frames higher up = how we got there' },
    py`**Chained** tracebacks contain two (or more) tracebacks. The joining sentence tells you how they're related:`,
    py`- *"The above exception was the direct cause of the following exception:"* — someone wrote \`raise New(...) from err\` on purpose. The **top** one is the root cause.
- *"During handling of the above exception, another exception occurred:"* — a *second* bug happened inside an \`except\` block. Often the bottom one is the bug in your error handling, and the top one is what triggered it.`,
    { code: py`Traceback (most recent call last):
  File "/home/ada/shop/config.py", line 3, in parse
    return cfg["port"]
           ~~~^^^^^^^^
KeyError: 'port'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/ada/shop/main.py", line 7, in <module>
    parse({"PORT": "eighty"})
    ~~~~~^^^^^^^^^^^^^^^^^^^^
  File "/home/ada/shop/config.py", line 5, in parse
    return int(cfg["PORT"])
ValueError: invalid literal for int() with base 10: 'eighty'`, lang: 'text', title: 'two problems: the key is spelled differently, and the fallback value is not a number' },
    py`See [raising & chaining exceptions](lesson:raising-exceptions) for \`from\`, \`__cause__\` and \`__context__\`.`,
    py`#### 2. Print debugging, done well`,
    py`A print is the quickest probe there is. Make every probe **labelled** and **unambiguous** with the \`=\` specifier (3.8+): \`f"{expr=}"\` prints the expression text, \`=\`, and the value's \`repr()\` — so \`"5"\` (a string) and \`5\` (an int) look different.`,
    { code: py`product, stars = "kettle", "4"
counts = {"kettle": 1}
print(f"{product=} {stars=}")              # product='kettle' stars='4'  <- stars is a str!
print(f"{counts[product]=}")               # counts[product]=1
print(f"{len(counts) = }")                 # spaces are kept: len(counts) = 1
print(f"{3.14159=:.2f}")                   # a format spec still works: 3.14159=3.14`, lang: 'python', title: 'f"{x=}" — the self-documenting print' },
    py`Good print-debugging habits: print **before and after** the suspicious line; print \`type(x)\` when a value "looks right" but behaves wrong; mark probes (\`# DEBUG\`) so you can find and delete them; and when you need the probes to stay, switch to [logging](lesson:logging).`,
    py`#### 3. Assertions as tripwires`,
    py`An \`assert\` states something you believe is *always* true at that point. If it's ever false, the program stops right there — close to the cause — instead of carrying a bad value into some faraway line.`,
    { code: py`def average_rating(ratings):
    assert ratings, "average_rating() needs at least one rating"
    avg = sum(ratings) / len(ratings)
    assert 1 <= avg <= 5, f"impossible average {avg!r} from {ratings!r}"
    return avg`, lang: 'python', title: 'assert condition, message' },
    { callout: 'warn', title: 'Asserts are for bugs, not for users', text: py`Running Python with \`-O\` deletes every \`assert\`. Use them to catch *programmer* mistakes ("this can't happen"), never to validate user input or permissions — raise a real exception for those (see [raising exceptions](lesson:raising-exceptions)). And never wrap the condition and message in parentheses: \`assert (x > 0, "msg")\` asserts a non-empty tuple, which is always true.` },
    py`#### 4. \`breakpoint()\` and pdb`,
    py`\`breakpoint()\` (3.7+) **pauses** your program and opens **pdb**, Python's built-in debugger, at that line. You can then look at every variable, walk up and down the call stack, and run the program one line at a time. Since Python 3.13 it stops on the \`breakpoint()\` line itself.`,
    { code: py`def average_rating(ratings):
    total = 0
    for i in range(1, len(ratings)):
        breakpoint()          # pause here on every pass of the loop
        total += ratings[i]
    return total / len(ratings)`, lang: 'python', title: 'add one line, run the script normally' },
    py`A real session (what you'd see in a terminal; you type after \`(Pdb)\`):`,
    { code: py`$ python main.py
> /home/ada/reviews/main.py(4)average_rating()
-> breakpoint()
(Pdb) p i, ratings[i]
(1, 3)
(Pdb) pp locals()
{'i': 1, 'ratings': [5, 3, 4], 'total': 0}
(Pdb) w
  /home/ada/reviews/main.py(14)<module>()
-> print(report("kettle", [5, 3, 4]))
  /home/ada/reviews/main.py(10)report()
-> avg = average_rating(ratings)
> /home/ada/reviews/main.py(4)average_rating()
-> breakpoint()
(Pdb) u
> /home/ada/reviews/main.py(10)report()
-> avg = average_rating(ratings)
(Pdb) p product
'kettle'
(Pdb) d
> /home/ada/reviews/main.py(4)average_rating()
-> breakpoint()
(Pdb) n
> /home/ada/reviews/main.py(5)average_rating()
-> total += ratings[i]
(Pdb) c
> /home/ada/reviews/main.py(4)average_rating()
-> breakpoint()
(Pdb) p i, total
(2, 3)
(Pdb) c
kettle: 2.3 stars`, lang: 'text', title: 'pdb transcript — the very first p already shows the bug: i starts at 1', static: true },
    py`The commands you'll use 95% of the time:`,
    py`| command | meaning |
|---|---|
| \`n\` (next) | run the current line, **stepping over** any function calls in it |
| \`s\` (step) | run the current line, **stepping into** a function call |
| \`c\` (continue) | run until the next breakpoint (or the end) |
| \`r\` (return) | run until the current function returns |
| \`p expr\` / \`pp expr\` | print / pretty-print any expression |
| \`l\` / \`ll\` | list source around the current line / the whole function |
| \`w\` (where) | show the call stack; \`>\` marks the frame you're looking at |
| \`u\` / \`d\` | move **up** to the caller's frame / back **down** |
| \`b 21\`, \`b func\`, \`b 21, x > 3\` | set a breakpoint (optionally with a condition) |
| \`cl 1\` | clear breakpoint 1 |
| \`q\` | quit (stops the program with \`bdb.BdbQuit\`) |
| \`h cmd\` | help on any command |`,
    { callout: 'note', title: 'Why the browser shows transcripts', text: py`pdb waits for you to type commands in a terminal. The playground's **Scripted pdb** variant runs the real pdb with commands read from a string, so you can still see exactly what each command prints.` },
    py`#### 5. Post-mortem: debug *after* the crash`,
    py`Sometimes you don't know where to put a breakpoint — the program just crashes. **Post-mortem debugging** opens pdb *inside the frame that raised*, with every local variable still there:`,
    { code: py`$ python -m pdb -c continue main.py     # run under pdb; stop when it crashes
$ python -i main.py                      # or: crash, then stay in the REPL...
>>> import pdb; pdb.pm()                 # ...and inspect the last exception`, lang: 'bash', title: 'two ways in' },
    { code: py`> /home/ada/reviews/main.py(6)average_rating()
-> return total / len(ratings)
(Pdb) p ratings, total
([], 0)
(Pdb) u
> /home/ada/reviews/main.py(10)report()
-> avg = average_rating(ratings)
(Pdb) p product
'lamp'`, lang: 'text', title: 'the lamp has no reviews yet — that is the bug', static: true },
    py`#### 6. Ideas that need no tools`,
    py`- **Rubber-duck debugging:** explain the code, line by line, out loud, to someone — or to a rubber duck. Saying "and then this adds every rating…" is often when you hear yourself say the wrong thing.
- **Bisecting:** if you can split the search space in half, do. Comment out half the pipeline, or halve the input file. \`git bisect\` does it for history: give it a good commit and a bad one and it checks out the middle until it finds the commit that introduced the bug — you'll write the same algorithm in an exercise below.`,
    { code: py`git bisect start
git bisect bad                 # the current commit has the bug
git bisect good v1.4           # this release did not
# git checks out a commit halfway between; test it, then say:
git bisect good                # or: git bisect bad
# ...repeat until git prints "<sha> is the first bad commit"
git bisect reset`, lang: 'bash', title: 'git bisect — binary search through history' },
  ],
  walkthrough: {
    title: 'Debugging the review dashboard, step by step',
    lang: 'python',
    code: DASHBOARD,
    intro: py`This is the playground program below. The kettle shows **11.0 stars** out of 5 — an impossible value. Here's how to hunt it down methodically. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [30, 32], text: py`**Reproduce.** Run it: \`kettle 11.0 stars\`. It happens every run, so it's reproducible. The other products look fine — a useful clue: only the kettle has *more than one* review.` },
      { lines: [21, 27], text: py`**Shrink the input.** Five reviews is already small, but two is smaller: \`average_by_product(["mug, 2", "mug, 4"])\` should give \`{'mug': 3.0}\`. It gives \`{'mug': 6.0}\` — the sum, not the average. Now the bug fits on one line of output.` },
      { lines: [5, 8], text: py`**Isolate.** Is parsing the problem? Call it alone: \`parse_review("kettle, 4")\` returns \`('kettle', 4)\` — a proper int. (\`int()\` ignores surrounding spaces.) Rule it out.` },
      { lines: [16, 17], text: py`**Hypothesise.** Average = total ÷ count. The total is 6, the answer is 6.0, so the count must be 1. Hypothesis: *\`counts\` is never more than 1.*` },
      { lines: [17, 17], text: py`**Test.** Print \`f"{counts[product]=}"\` after this line, or pause here with \`breakpoint()\`: it prints \`1\` every time. Hypothesis confirmed — this line *overwrites* the count instead of adding to it. **Fix:** \`counts[product] = counts.get(product, 0) + 1\`.` },
      { lines: [18, 18], text: py`**Lock it in.** Write \`test_average_by_product()\` asserting the mug example gives \`3.0\`. If anyone reintroduces the bug, the test fails immediately — that's a *regression test*.` },
    ],
  },
  playground: {
    title: 'Review dashboard bug hunt',
    objective: 'Run it, notice the impossible rating, and work through the method: reproduce small, probe with f"{x=}", fix, then add a regression test.',
    files: { 'main.py': DASHBOARD },
    expected: py`Three lines — and one of them is impossible for a 5-star scale:

\`\`\`text
kettle   11.0 stars
toaster  5.0 stars
lamp     3.0 stars
\`\`\`

Switch to the **Scripted pdb** variant to watch the real debugger inspect the same function.`,
    experiments: [
      {
        id: 'reproduce',
        task: py`**Reproduce small.** At the end of the file add \`print(average_by_product(["mug, 2", "mug, 4"]))\`. Predict the answer you *should* get, then run it.`,
        hint: py`Two reviews of 2 and 4 should average 3.0.`,
        tests: [{ name: 'printed the tiny reproduction', code: py`assert "'mug'" in output, 'Print average_by_product(["mug, 2", "mug, 4"])'` }],
        explain: py`It prints \`{'mug': 6.0}\`: the sum, not the average. A two-line input that shows the bug every time is the best gift you can give yourself (and anyone you ask for help).`,
      },
      {
        id: 'probe',
        task: py`**Probe.** Inside the loop, right after \`counts[product] = 1\`, add \`print(f"{product=} {counts[product]=}")\`. Run it and read the probe lines.`,
        hint: py`Indent the print to the same level as the line above it so it runs on every pass.`,
        tests: [{ name: 'a labelled probe shows the counts', code: py`import re
assert re.search(r"counts(\[product\])?\s?=", output), 'Add a print with the = specifier showing counts'` }],
        explain: py`Every probe line says \`counts[product]=1\` — even for the third kettle review. Evidence beats intuition: the count never grows. Delete the probe once you've learnt what you needed.`,
      },
      {
        id: 'fix',
        task: py`**Fix** the counting line so each review adds one to that product's count. The kettle should show **3.7 stars**.`,
        hint: py`Use the same pattern as the totals line: \`counts.get(product, 0) + 1\`.`,
        tests: [
          { name: 'two mug reviews average 3.0', code: py`assert average_by_product(["mug, 2", "mug, 4"]) == {"mug": 3.0}` },
          { name: 'the kettle shows 3.7 stars', code: py`assert "kettle   3.7 stars" in output` },
        ],
        explain: py`\`counts[product] = counts.get(product, 0) + 1\` reads the current count (0 if missing) and adds one. The kettle is now (4 + 2 + 5) / 3 ≈ 3.67. Notice we only changed code *after* we had evidence of the cause.`,
      },
      {
        id: 'regression',
        task: py`**Lock it in.** Write a function \`test_average_by_product()\` that asserts \`average_by_product(["mug, 2", "mug, 4"]) == {"mug": 3.0}\` (add more cases if you like). Call it at the bottom of the file.`,
        hint: py`A test is just a function with \`assert\` statements: \`def test_average_by_product():\` then an indented assert.`,
        tests: [
          { name: 'test_average_by_product() exists and passes', code: py`test_fn = ns.get("test_average_by_product")
assert callable(test_fn), "Define a function named test_average_by_product()"
test_fn()` },
          { name: 'your test catches the original bug', code: py`def buggy(lines):
    totals, counts = {}, {}
    for line in lines:
        product, stars = parse_review(line)
        totals[product] = totals.get(product, 0) + stars
        counts[product] = 1
    return {p: totals[p] / counts[p] for p in totals}

fixed = ns["average_by_product"]
ns["average_by_product"] = buggy
try:
    try:
        ns["test_average_by_product"]()
        caught = False
    except Exception:
        caught = True
finally:
    ns["average_by_product"] = fixed
assert caught, "Your test still passes on the buggy version: test a product with two or more reviews"` },
        ],
        explain: py`The second check swapped the buggy function back in and ran *your* test against it — and your test failed, as it should. That's what makes it a **regression test**: it would have caught this bug, so it will catch it if it ever returns. In real projects this lives in a test file run by [pytest](lesson:pytest-basics).`,
      },
    ],
    variants: [
      { id: 'scripted-pdb', label: 'Scripted pdb session', files: { 'main.py': SCRIPTED_PDB } },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The debugging loop',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'reproduce', label: 'Reproduce', note: 'make it happen on demand', x: 120, y: 80, tone: 'yellow' },
        { id: 'isolate', label: 'Isolate', note: 'where does it go wrong?', x: 380, y: 80, tone: 'yellow' },
        { id: 'hypothesise', label: 'Hypothesise', note: 'one testable guess', x: 640, y: 80, tone: 'blue' },
        { id: 'test', label: 'Test it', note: 'print · assert · pdb', x: 640, y: 240, tone: 'blue' },
        { id: 'fix', label: 'Fix', note: 'change the cause', x: 380, y: 240, tone: 'kraft' },
        { id: 'regress', label: 'Regression test', note: 'never again', x: 120, y: 240, tone: 'ink' },
      ],
      edges: [
        { from: 'reproduce', to: 'isolate', label: 'smallest input' },
        { from: 'isolate', to: 'hypothesise', label: 'narrowed down' },
        { from: 'hypothesise', to: 'test', label: 'predict' },
        { id: 'retry', from: 'test', to: 'isolate', label: 'wrong guess', dashed: true },
        { from: 'test', to: 'fix', label: 'confirmed' },
        { from: 'fix', to: 'regress', label: 'prove it' },
      ],
      steps: [
        { focus: ['reproduce'], text: py`**Reproduce.** Find inputs that trigger the bug *every time*, then shrink them. "The kettle shows 11 stars" becomes "two mug reviews give 6.0". A bug you can't reproduce, you can't confirm you've fixed.` },
        { focus: ['isolate'], edges: ['reproduce->isolate'], text: py`**Isolate.** Narrow the search: read the traceback, call functions on their own, comment out halves, bisect. Each check should cut the suspects roughly in half.` },
        { focus: ['hypothesise'], edges: ['isolate->hypothesise'], text: py`**Hypothesise.** State one specific guess that *predicts* something: "counts never exceeds 1, so the third kettle review will show count 1".` },
        { focus: ['test'], edges: ['hypothesise->test'], text: py`**Test.** Gather evidence: an \`f"{x=}"\` print, an \`assert\`, or a pause in pdb. Does reality match your prediction?` },
        { focus: ['isolate', 'test'], edges: ['retry'], text: py`If the evidence says *no*, that's progress too — you've ruled something out. Go back, narrow further, and form a new hypothesis. Don't "fix" anything yet.` },
        { focus: ['fix'], edges: ['test->fix'], text: py`**Fix** only once the cause is confirmed. Change as little as possible, and re-run the reproduction to see the bug disappear.` },
        { focus: ['regress'], edges: ['fix->regress'], text: py`**Regression test.** Turn the reproduction into an automated test. It fails on the old code and passes on the new — and it stands guard forever after.` },
      ],
    },
    alt: 'A loop of six boxes: Reproduce, Isolate, Hypothesise, Test it, Fix and Regression test. Arrows go round in that order; a dashed arrow from Test it back to Isolate is labelled "wrong guess".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When Python calls a function it creates a **frame**: a little workspace holding that call's local variables and the line it's on. Frames stack up — \`<module>\` calls \`report()\` calls \`average_rating()\`. That stack is the *call stack*, and a traceback is simply a printout of it at the moment of the crash.`,
      py`A debugger shows you the same stack *while the program is still alive*. \`w\` prints it, \`u\` and \`d\` move between frames, and \`p\` evaluates any expression inside the frame you're looking at — which is why \`p product\` failed in one frame and worked one level up.`,
      { callout: 'tip', title: 'The bug is usually in your code', text: py`If a traceback ends deep inside the standard library or a third-party package, scroll up to the **last frame that's in your own files**. That's almost always where the wrong value was passed in.` },
    ],
    technical: [
      py`**How \`breakpoint()\` works** (PEP 553): it calls \`sys.breakpointhook()\`, which by default reads the \`PYTHONBREAKPOINT\` environment variable. Unset → \`pdb.set_trace()\`. \`PYTHONBREAKPOINT=0\` → \`breakpoint()\` does nothing (useful in CI). \`PYTHONBREAKPOINT=ipdb.set_trace\` → use another debugger with no code changes.`,
      py`**How pdb pauses your program:** pdb is built on the \`bdb\` module, which registers a *trace function* with \`sys.settrace()\`. The interpreter calls it on every function call, line and return; pdb checks "is there a breakpoint here, or did the user ask to stop?" and, if so, reads commands. Python 3.14 adds an optional backend built on the lower-overhead \`sys.monitoring\` API (\`pdb.set_default_backend("monitoring")\`); \`"settrace"\` remains the default.`,
      py`**Tracebacks are objects.** A caught exception carries \`exc.__traceback__\`, a linked list of traceback entries (\`tb_frame\`, \`tb_lineno\`, \`tb_next\`). Follow \`tb_next\` to the end and you reach the frame that raised — with its local variables in \`tb_frame.f_locals\`. That's exactly what \`pdb.post_mortem()\` uses.`,
      { code: py`import traceback

def parse_price(text):
    return float(text)

try:
    parse_price("12,50")
except ValueError as exc:
    tb = exc.__traceback__
    while tb.tb_next is not None:     # walk to the innermost frame
        tb = tb.tb_next
    print(tb.tb_frame.f_code.co_name, tb.tb_lineno, dict(tb.tb_frame.f_locals))
    traceback.print_exc()             # full traceback, program keeps running`, lang: 'python', title: 'a traceback is a chain of frames you can walk' },
      py`**The \`=\` specifier** is compiled into the f-string: \`f"{x=}"\` becomes the literal text \`x=\` followed by \`repr(x)\`. Add a conversion or format spec to change that: \`f"{x=!s}"\` uses \`str()\`, \`f"{x=:.2f}"\` formats the value.`,
      { callout: 'note', title: 'CPython detail', text: py`Since Python 3.13, \`frame.f_locals\` on a *function* frame returns a write-through proxy (PEP 667) instead of a snapshot dict; wrap it in \`dict(...)\` if you want to keep a copy. pdb uses this so that \`!x = 5\` in the debugger really changes \`x\`. Other implementations (PyPy, GraalPy) provide frames and debuggers too, but their internals differ.` },
    ],
    production: [
      py`**You can't pause a server.** In production, your debugger is [logging](lesson:logging): log enough context (ids, inputs, the exception with \`logger.exception\`) to reproduce the bug locally. Error trackers such as Sentry capture tracebacks *with local variables* — automated post-mortems.`,
      py`**Never commit \`breakpoint()\`.** A forgotten breakpoint freezes a web worker or a CI job waiting for input that never comes. Linters catch it (Ruff's \`T100\` rule flags \`breakpoint()\` and \`pdb.set_trace()\`), and setting \`PYTHONBREAKPOINT=0\` in CI makes stray ones harmless.`,
      py`**Attach to a running process (3.14+).** PEP 768 added a safe external-debugger interface: \`python -m pdb -p <PID>\` attaches pdb to a live Python 3.14 process. IDE debuggers (VS Code's debugpy, PyCharm) offer the same steps, breakpoints and frames with a GUI — the concepts in this lesson transfer directly.`,
      py`**Hard crashes.** If Python itself dies (a segfault in a C extension, a deadlock), enable \`faulthandler\` (\`python -X faulthandler\`) to dump every thread's Python stack. \`python -X dev\` turns on extra runtime checks and warnings during development.`,
      py`**Bisect automatically.** \`git bisect run python -m pytest tests/test_reviews.py\` lets Git run your regression test on each candidate commit and find the culprit without you.`,
    ],
  },
  mistakes: [
    {
      title: 'Shotgun debugging: changing things until the output looks right',
      wrong: { code: py`def average(ratings):
    # "it was too low, so I added 1" — the symptom moved, the bug stayed
    return sum(ratings[1:]) / len(ratings) + 1`, lang: 'python' },
      right: { code: py`def average(ratings):
    # evidence first: ratings[1:] skipped the first rating
    return sum(ratings) / len(ratings)`, lang: 'python' },
      explanation: py`Patching the output hides the cause and breaks other inputs. Form a hypothesis, check it with evidence, then fix the actual cause.`,
    },
    {
      title: 'Unlabelled prints that lie about types',
      wrong: { code: py`stars = "4"
print(stars)         # 4 — looks like a number`, lang: 'python' },
      right: { code: py`stars = "4"
print(f"{stars=}")   # stars='4' — the quotes reveal a string`, lang: 'python' },
      explanation: py`\`print(x)\` uses \`str()\`, which hides quotes, so \`"4"\` and \`4\` look identical. \`f"{x=}"\` shows the name and the \`repr()\`, so you know what you're looking at.`,
    },
    {
      title: 'An assert that can never fail',
      wrong: { code: py`stock = -1
assert (stock >= 0, "stock went negative")   # SyntaxWarning, never fires`, lang: 'python' },
      right: { code: py`stock = 3
assert stock >= 0, "stock went negative"`, lang: 'python' },
      explanation: py`With parentheses the condition is a two-item tuple, and any non-empty tuple is truthy. Python warns: \`SyntaxWarning: assertion is always true, perhaps remove parentheses?\`.`,
    },
    {
      title: 'Swallowing the traceback',
      wrong: { code: py`def load_reviews(text):
    try:
        return [int(x) for x in text.split(",")]
    except Exception:
        return []          # the evidence is thrown away`, lang: 'python' },
      right: { code: py`import logging

logger = logging.getLogger(__name__)

def load_reviews(text):
    try:
        return [int(x) for x in text.split(",")]
    except ValueError:
        logger.exception("could not parse reviews %r", text)
        raise`, lang: 'python' },
      explanation: py`A bare \`except Exception: return []\` turns a loud, located crash into a silent wrong answer somewhere else. Catch only what you can handle, and keep the traceback — log it with \`logger.exception\` and re-raise.`,
    },
    {
      title: 'A debug print that changes the program',
      wrong: { code: py`rows = (line.strip() for line in open("reviews.txt"))
print("DEBUG", list(rows))    # consumes the generator!
for row in rows:              # ...so this loop sees nothing
    print(row)`, lang: 'python', static: true },
      right: { code: py`rows = [line.strip() for line in open("reviews.txt")]
print("DEBUG", rows[:5])      # a list can be read many times
for row in rows:
    print(row)`, lang: 'python', static: true },
      explanation: py`Generators and iterators can be read only once (see [generators](lesson:generators)). Printing \`list(rows)\` uses them up, so the "fix" you're debugging now behaves differently. Probe a copy, or a slice of a list.`,
    },
  ],
  debugging: [
    {
      symptom: py`*** NameError: name 'product' is not defined   (inside pdb)`,
      cause: py`You're looking at a different frame from the one where that variable lives — e.g. you stepped into a helper whose locals don't include it.`,
      fix: py`Type \`w\` to see the stack and which frame is current (marked \`>\`), then \`u\` / \`d\` to move to the frame that owns the variable.`,
    },
    {
      symptom: py`Typing \`c\` or \`n\` in pdb runs a command instead of showing your variable named c or n.`,
      cause: py`Single letters are pdb commands, and commands win over variable names.`,
      fix: py`Use \`p c\` to print it, or prefix a Python statement with \`!\`: \`!n = 10\`.`,
    },
    {
      symptom: py`bdb.BdbQuit appears at the bottom of a traceback.`,
      cause: py`You typed \`q\` in pdb. Quitting stops the program by raising \`BdbQuit\`.`,
      fix: py`That's expected. Use \`c\` to let the program finish instead of quitting.`,
    },
    {
      symptom: py`SyntaxWarning: assertion is always true, perhaps remove parentheses?`,
      cause: py`\`assert (condition, "message")\` asserts a tuple, which is always truthy.`,
      fix: py`Write \`assert condition, "message"\` without the outer parentheses.`,
    },
    {
      symptom: py`The bug disappears when you add a print (a "heisenbug").`,
      cause: py`The probe changed behaviour: it consumed an iterator, called a method with side effects, or changed timing in concurrent code.`,
      fix: py`Make probes side-effect free (print a copy or a slice), or use a debugger / logging that doesn't touch the values.`,
    },
  ],
  bestPractices: [
    'Reproduce first, then shrink the reproduction until it is as small as possible.',
    'Change one thing at a time, and predict the result before you run.',
    'Read tracebacks bottom-up and look for the last frame in your own code.',
    'Use f"{expr=}" for print probes so every value is labelled and shown with repr().',
    'Use assert for "this can never happen" tripwires, never for validating input.',
    'Reach for breakpoint() when you need to look at many values or walk the call stack.',
    'Write a failing regression test before (or right after) the fix, and keep it.',
    'Remove debug prints and breakpoints before committing; keep useful diagnostics as logging.',
  ],
  whenToUse: {
    use: [
      'print / f"{x=}" — a quick look at one or two values, especially in a loop.',
      'assert — documenting and enforcing internal assumptions so bugs fail early.',
      'breakpoint() / pdb — exploring unfamiliar code, many variables, or the call stack.',
      'post-mortem (python -m pdb -c continue, pdb.pm()) — the program crashes and you don’t know where to look.',
      'git bisect — "it used to work": find the commit that broke it.',
    ],
    avoid: [
      'Print debugging in production code paths — use logging with levels instead.',
      'Interactive debuggers on servers or CI — nobody is there to type commands.',
      'assert for checks that must survive python -O (validation, permissions).',
      'Stepping line by line through thousands of iterations — set a conditional breakpoint instead.',
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'debugging-q1',
      type: 'mcq',
      prompt: 'A user reports: "the total on my invoice is sometimes wrong". What should you do first?',
      options: [
        { text: 'Rewrite the total calculation so it is cleaner', why: 'Without knowing the cause, a rewrite may keep the bug or add new ones.' },
        'Find an input that produces the wrong total every time, then make it as small as possible',
        { text: 'Add try/except around the calculation', why: 'There is no exception to catch — the result is just wrong. Catching would hide evidence anyway.' },
        { text: 'Open the debugger and step through the whole program', why: 'Stepping without a reproduction means you might never see the bug happen.' },
      ],
      answer: 1,
      explanation: py`**Reproduce** first. A small, reliable reproduction lets you test hypotheses quickly, prove the fix works, and becomes your regression test.`,
    },
    {
      id: 'debugging-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`price = 2.5
qty = 3
item = "tea"
print(f"{item=} {price * qty = }")`,
      answer: "item='tea' price * qty = 7.5",
      accept: ["item='tea' price * qty = 7.5"],
      explanation: py`The \`=\` specifier prints the expression text exactly as written (including spaces around \`=\`), then the value's \`repr()\` — so the string keeps its quotes.`,
    },
    {
      id: 'debugging-q3',
      type: 'bug',
      prompt: 'This tripwire never fires, even when the balance is negative. Click the buggy line.',
      code: py`def withdraw(balance, amount):
    balance -= amount
    assert (balance >= 0, "balance went negative")
    return balance

print(withdraw(10, 25))`,
      answerLine: 3,
      explanation: py`The parentheses make a tuple \`(False, "balance went negative")\`, and a non-empty tuple is always truthy. Python even warns: *assertion is always true, perhaps remove parentheses?* Write \`assert balance >= 0, "balance went negative"\`.`,
    },
    {
      id: 'debugging-q4',
      type: 'mcq',
      prompt: 'A traceback has two parts joined by *"The above exception was the direct cause of the following exception:"*. Which part shows the original problem?',
      options: [
        'The upper part — it happened first, and the code deliberately raised the second one "from" it',
        { text: 'The lower part, because the last line of a traceback is always the root cause', why: 'The last line is the exception that ended the program, but with explicit chaining the root cause is printed first, above the joining sentence.' },
        { text: 'Neither: it means two unrelated bugs happened at the same time', why: '"Direct cause" means someone wrote raise New(...) from err — the two are linked on purpose.' },
      ],
      answer: 0,
      explanation: py`\`raise New(...) from err\` sets \`__cause__\`, and Python prints the cause first. The lower exception is the higher-level "what failed"; the upper one is the "why".`,
    },
    {
      id: 'debugging-q5',
      type: 'fill',
      prompt: 'You are paused in pdb. Fill in the command for each comment.',
      code: py`(Pdb) ___ order         # print the value of the variable order
(Pdb) ___               # run this line, stepping OVER any function calls
(Pdb) ___               # move up to the caller's frame`,
      answer: [['p', 'pp', 'print'], ['n', 'next'], ['u', 'up']],
      explanation: py`\`p\` prints an expression, \`n\` runs to the next line without entering calls (\`s\` would step into them), and \`u\` moves one frame up the call stack (\`d\` comes back down).`,
    },
    {
      id: 'debugging-q6',
      type: 'output',
      prompt: 'A developer adds a debug print to see the rows. What does the program print now?',
      code: py`rows = (line.upper() for line in ["a", "b"])
print("debug:", list(rows))
for row in rows:
    print("row:", row)
print("done")`,
      options: [
        { text: "debug: ['A', 'B']\nrow: A\nrow: B\ndone", why: 'That would be true for a list. A generator can be consumed only once, and list(rows) already did it.' },
        "debug: ['A', 'B']\ndone",
        { text: 'debug: <generator object <genexpr> at 0x...>\nrow: A\nrow: B\ndone', why: 'list(rows) turns the generator into a list of its items, so the items are printed.' },
      ],
      answer: 1,
      explanation: py`\`list(rows)\` pulled every item out of the generator, so the \`for\` loop finds it empty. The probe changed the program's behaviour — a classic "heisenbug".`,
    },
    {
      id: 'debugging-q7',
      type: 'short',
      prompt: 'You have just fixed a bug. Why is it worth writing a regression test for it, even though you already checked the fix by hand?',
      answer: py`A regression test fails if this exact bug ever comes back — after a refactor, a merge or someone else's change — and it documents the bug for future readers. A hand check proves the fix once; a test keeps proving it automatically every time the suite runs. Writing it to fail on the old code also confirms you really fixed the cause.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'fix-median',
      title: 'Fix the median — and prove it stays fixed',
      difficulty: 'intermediate',
      prompt: py`\`median(numbers)\` has bugs. Users report that \`median([4, 1, 3, 2])\` returns \`3\` instead of \`2.5\`, and that calling it **re-orders their list**.

Fix \`median\` so that:

1. for an odd count it returns the middle value of the sorted numbers;
2. for an even count it returns the **average of the two middle values** (\`median([4, 1, 3, 2]) == 2.5\`);
3. it does **not modify** the list it is given;
4. it raises \`ValueError\` for an empty list.

Then fill in \`test_median()\` with \`assert\` statements that pass on your fixed code **and would have failed on the original code**. The checker runs your test against the original buggy function to make sure it catches it.`,
      files: {
        'main.py': py`def median(numbers):
    """Return the middle value (the mean of the two middle values for an even count)."""
    numbers.sort()
    middle = len(numbers) // 2
    return numbers[middle]


def test_median():
    # TODO: add asserts that would have caught the bug
    pass


print(median([3, 1, 2]))
print(median([4, 1, 3, 2]))
`,
      },
      hints: [
        'Reproduce first: print median([4, 1, 3, 2]) and median of a list you then print again — what changed?',
        'sorted(numbers) returns a new sorted list and leaves the original alone. For an even length n, the two middle indexes are n // 2 - 1 and n // 2.',
        'ordered = sorted(numbers); mid = len(ordered) // 2; return ordered[mid] if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2 — and in test_median, assert an even-length case plus that the input list is unchanged.',
      ],
      solution: {
        explanation: py`Two separate bugs had one root: the function trusted \`len // 2\` for every length and sorted in place.

- \`sorted(numbers)\` builds a new list, so the caller's list is untouched (\`list.sort()\` mutates and returns \`None\`).
- For an even length \`n\`, the middle pair sits at \`n // 2 - 1\` and \`n // 2\`; their mean is the median.
- An empty list has no median, so we raise a clear \`ValueError\` instead of an obscure \`IndexError\`.

The test includes an **even-length** case and an **unchanged input** check — exactly the two things the original code got wrong — so it fails on the old version and passes on the new one. That's what makes it a regression test.`,
        files: {
          'main.py': py`def median(numbers):
    """Return the middle value (the mean of the two middle values for an even count)."""
    if not numbers:
        raise ValueError("median() needs at least one number")
    ordered = sorted(numbers)
    middle = len(ordered) // 2
    if len(ordered) % 2 == 1:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def test_median():
    assert median([3, 1, 2]) == 2
    assert median([4, 1, 3, 2]) == 2.5
    data = [3, 1, 2]
    median(data)
    assert data == [3, 1, 2], "median() must not reorder the caller's list"


test_median()
print(median([3, 1, 2]))
print(median([4, 1, 3, 2]))
`,
        },
      },
      tests: [
        { name: 'odd count: middle value', code: py`assert median([5, 1, 3]) == 3` },
        { name: 'even count: mean of the two middle values', code: py`assert median([4, 1, 3, 2]) == 2.5` },
        { name: 'does not modify the input list', code: py`data = [9, 2, 7]
median(data)
assert data == [9, 2, 7], "median() reordered the list it was given"` },
        { name: 'empty list raises ValueError', code: py`with raises(ValueError):
    median([])` },
        { name: 'test_median() passes on your code', code: py`test_median()` },
        { name: 'test_median() catches the original bug', code: py`def original(numbers):
    numbers.sort()
    return numbers[len(numbers) // 2]

fixed = ns["median"]
ns["median"] = original
try:
    try:
        ns["test_median"]()
        caught = False
    except Exception:
        caught = True
finally:
    ns["median"] = fixed
assert caught, "test_median() still passes on the buggy median: add an even-length case or an unchanged-input check"` },
      ],
    },
    {
      id: 'first-bad-commit',
      title: 'Bisect: find the first bad commit',
      difficulty: 'intermediate',
      prompt: py`\`git bisect\` finds the commit that introduced a bug by **binary search**. Write the same algorithm.

\`first_bad(commits, is_bad)\` receives a list of commit names, oldest first. Every commit before the culprit is good; the culprit and **every commit after it** are bad; the **last commit is known to be bad**. \`is_bad(commit)\` "checks out and tests" a commit and returns \`True\` if it has the bug.

Return the first bad commit, calling \`is_bad\` **at most 7 times for 100 commits** (the starter calls it once per commit, which is far too slow when each test run takes minutes). For a single commit, return it without calling \`is_bad\`.`,
      files: {
        'main.py': py`def first_bad(commits, is_bad):
    """Return the first commit for which is_bad(commit) is True."""
    for commit in commits:          # works, but tests every commit in turn
        if is_bad(commit):
            return commit
    return commits[-1]


history = [f"c{n:02d}" for n in range(20)]
print(first_bad(history, lambda commit: commit >= "c13"))   # c13
`,
      },
      hints: [
        'Keep two indexes: low (the first commit that might be the culprit) and high (a commit you know is bad). At the start, high is the last index.',
        'Test the middle commit. If it is bad, the culprit is at mid or before it (high = mid). If it is good, the culprit is after it (low = mid + 1).',
        'while low < high: mid = (low + high) // 2; then move low or high. When they meet, commits[low] is the answer.',
      ],
      solution: {
        explanation: py`Binary search keeps an interval \`[low, high]\` that always contains the first bad commit — \`high\` starts at the last commit because we *know* it's bad.

Each check of the middle commit halves the interval: bad → the culprit is \`mid\` or earlier (\`high = mid\`); good → it's later (\`low = mid + 1\`). When \`low == high\` only one candidate is left.

Halving 100 candidates takes at most ⌈log₂ 100⌉ = 7 checks, against up to 100 for the linear scan. That's why \`git bisect\` can search thousands of commits in a dozen steps — and why "can I cut the search space in half?" is a great debugging question in general.`,
        files: {
          'main.py': py`def first_bad(commits, is_bad):
    """Return the first commit for which is_bad(commit) is True."""
    low, high = 0, len(commits) - 1     # commits[high] is known to be bad
    while low < high:
        mid = (low + high) // 2
        if is_bad(commits[mid]):
            high = mid                  # culprit is mid or earlier
        else:
            low = mid + 1               # culprit is after mid
    return commits[low]


history = [f"c{n:02d}" for n in range(20)]
print(first_bad(history, lambda commit: commit >= "c13"))   # c13
`,
        },
      },
      tests: [
        { name: 'finds c13 in the example history', code: py`history = [f"c{n:02d}" for n in range(20)]
assert first_bad(history, lambda c: c >= "c13") == "c13"` },
        { name: 'works when the culprit is first or last', code: py`commits = [f"c{n:03d}" for n in range(100)]
assert first_bad(commits, lambda c: True) == "c000"
assert first_bad(commits, lambda c: c >= "c099") == "c099"` },
        { name: 'at most 7 checks for 100 commits, wherever the culprit is', code: py`commits = [f"c{n:03d}" for n in range(100)]
worst = 0
for culprit in range(100):
    calls = 0
    def is_bad(c, culprit=culprit):
        global calls
        calls += 1
        return int(c[1:]) >= culprit
    assert first_bad(commits, is_bad) == commits[culprit]
    worst = max(worst, calls)
assert worst <= 7, f"needed {worst} checks in the worst case; binary search needs at most 7"` },
        { name: 'a single commit needs no checks', code: py`def never(c):
    raise AssertionError("is_bad should not be called for a single commit")
assert first_bad(["only"], never) == "only"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'debugging-method',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Walk me through how you debug a problem when the cause isn’t obvious.',
      answer: 'Reproduce it reliably with the smallest input; isolate where it goes wrong (traceback, calling pieces separately, bisecting); form one testable hypothesis; gather evidence with prints, assertions or a debugger; fix the confirmed cause; add a regression test.',
      explanation: py`Interviewers want a *process*, not a list of tools. The key ideas: a reproduction you can run in seconds, narrowing the search space, changing one thing at a time, and finishing with a test so the bug can't silently return.`,
      whyAsked: 'It reveals whether you work systematically or by trial and error — which matters far more than knowing pdb commands.',
      mistakes: ['Jumping straight to "I add print statements everywhere"', 'Fixing the symptom without confirming the cause', 'Forgetting the regression test'],
      followUps: ['What if you can’t reproduce it?', 'How do you narrow down a bug in a 5,000-line codebase?', 'When do you use a debugger instead of prints?'],
      modelAnswer: 'I start by reproducing the bug reliably, and then I shrink the input until the reproduction is as small as I can make it. Next I isolate where it goes wrong: I read the traceback from the bottom, call the suspect functions on their own, or bisect — comment out half, or use git bisect if it used to work. Then I state one specific hypothesis and test it with evidence, usually an f-string print with the equals specifier, an assertion, or a breakpoint to inspect the state. Only when the evidence confirms the cause do I fix it, and I finish by turning my reproduction into a regression test, so the same bug can never come back unnoticed.',
    },
    {
      id: 'debugging-cant-reproduce',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'An order-processing job fails in production about once a day with a KeyError, but you cannot reproduce it locally. What do you do?',
      answer: 'Get evidence from production: the full traceback plus context (order id, the input that failed) via logging or an error tracker. Compare that input with what you test locally — differences in data, configuration, timing or versions. Reproduce with the captured input, then fix and add a regression test using it.',
      explanation: py`"Can't reproduce" almost always means "I don't have the same input or environment". So you collect it: \`logger.exception()\` with identifying context, error-tracking tools that capture locals, or temporary extra logging around the failing path. Then you replay that input locally. Look for things that differ: rare data shapes (a missing key on legacy records), time zones, concurrency, dependency versions, environment variables.`,
      whyAsked: 'Real-world debugging is mostly about bugs you can’t see happen. This tests observability thinking.',
      mistakes: ['Adding try/except KeyError and moving on', 'Attaching an interactive debugger to a production server', 'Guessing at fixes and deploying them to "see if it helps"'],
      followUps: ['What would you log, and what must you never log?', 'How could a race condition cause this?', 'How do you make sure the fix worked?'],
      modelAnswer: 'If I can’t reproduce it, I’m missing information, so the first step is collecting evidence from production. I make sure the failure is logged with logger.exception, so I get the full traceback, plus context like the order id and the shape of the record — without logging secrets or personal data. With that I usually find the input differs from my test data, for example an old record missing a field. I replay that exact input locally to reproduce the KeyError, fix the cause — maybe the data, maybe a .get with a sensible default — and add a regression test built from that input. Then I watch the logs to confirm it no longer happens.',
    },
    {
      id: 'debugging-fstring-equals',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`name = "Ada"
cart = ["tea", "jam", "bread"]
print(f"{name=}, {len(cart) = }")` },
      options: ["name=Ada, len(cart)=3", "name='Ada', len(cart) = 3", "Ada, 3", "name='Ada', len(cart)=3"],
      correctOption: 1,
      answer: "`name='Ada', len(cart) = 3` — the = specifier repeats the expression text exactly (spaces included) and shows the value's repr().",
      explanation: py`Added in Python 3.8 for exactly this kind of debugging. The text before \`=\` (with any spaces) is copied literally; the value uses \`repr()\` unless you add \`!s\` or a format spec such as \`:.2f\`.`,
      whyAsked: 'A quick check of practical debugging fluency and of str() vs repr().',
      mistakes: ['Expecting str() formatting (no quotes)', 'Forgetting that spaces around = are preserved'],
      followUps: ['How would you print the value with str() instead?', 'Why is repr() the better default for debugging?'],
      modelAnswer: "It prints name='Ada', len(cart) = 3. The equals specifier in an f-string, available since 3.8, prints the expression exactly as written — including the spaces around the equals sign — followed by the value. It uses repr() by default, which is why Ada keeps its quotes. That's deliberate: repr makes the type visible, so I can tell the string '4' from the integer 4 while debugging.",
    },
    {
      id: 'debugging-assert-tuple',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate added `assert (len(batch) <= 100, "batch too big")` but oversized batches still get through. Why — and is assert the right tool here at all?',
      code: { lang: 'python', code: py`def send(batch):
    assert (len(batch) <= 100, "batch too big")
    ...` },
      answer: 'The parentheses make the condition a two-item tuple, which is always truthy, so the assert never fires (Python emits a SyntaxWarning). Fix: `assert len(batch) <= 100, "batch too big"`. But if this protects against real input, use `if len(batch) > 100: raise ValueError(...)`, because asserts are removed under `python -O`.',
      explanation: py`\`assert\` is a statement, not a function: \`assert expr, msg\`. Wrapping both in parentheses creates a tuple. Separately, asserts document *internal* invariants; anything that must be enforced at runtime (limits, validation, permissions) needs an explicit exception.`,
      whyAsked: 'It tests precise knowledge of assert syntax and judgement about when assertions are appropriate.',
      mistakes: ['Saying assert needs parentheses like print', 'Not mentioning that -O strips asserts'],
      followUps: ['What warning does Python give?', 'When is assert the right choice?'],
      modelAnswer: 'The problem is the parentheses: assert is a statement, so the whole thing becomes one tuple of a boolean and a string, and a non-empty tuple is always truthy — the check can never fail. Python even emits a SyntaxWarning saying the assertion is always true. The syntax fix is assert len(batch) <= 100, "batch too big". But I would also question using assert here: asserts are stripped when Python runs with -O, so for a limit that protects a real system I would raise a ValueError explicitly and keep asserts for internal "this can never happen" invariants.',
    },
    {
      id: 'debugging-breakpoint-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'What actually happens when Python executes `breakpoint()`, and how does pdb manage to stop at later lines?',
      answer: 'breakpoint() calls sys.breakpointhook(), which by default consults the PYTHONBREAKPOINT environment variable and then calls pdb.set_trace(). pdb (built on bdb) installs a trace function with sys.settrace — or, optionally in 3.14, uses sys.monitoring — so the interpreter calls it on line, call and return events, and pdb pauses when a breakpoint or step condition matches.',
      explanation: py`\`PYTHONBREAKPOINT=0\` turns every \`breakpoint()\` into a no-op; \`PYTHONBREAKPOINT=pkg.func\` imports and calls a different debugger. You can also assign \`sys.breakpointhook\` yourself. Once tracing is on, the interpreter invokes the trace function for events in traced frames, which is how \`n\`, \`s\`, \`r\` and line breakpoints work. Tracing has overhead, which is why code runs slower under a debugger; 3.14's optional \`sys.monitoring\` backend reduces it.`,
      code: { lang: 'python', code: py`import sys

def quiet_hook(*args, **kwargs):
    frame = sys._getframe(1)   # the caller of breakpoint() (CPython detail)
    print("breakpoint hit in", frame.f_code.co_name)

sys.breakpointhook = quiet_hook

def checkout():
    breakpoint()               # calls quiet_hook instead of pdb

checkout()
sys.breakpointhook = sys.__breakpointhook__   # restore the default` },
      whyAsked: 'Senior candidates are expected to understand their tools: hooks, tracing and their costs.',
      mistakes: ['Thinking breakpoint() is special syntax', 'Not knowing how to disable it', 'Assuming debugging has no runtime cost'],
      followUps: ['How would you make CI ignore stray breakpoints?', 'Why are programs slower under a debugger?', 'How does coverage.py relate to this?'],
      modelAnswer: 'breakpoint() is an ordinary built-in from PEP 553. It calls sys.breakpointhook, and the default hook reads the PYTHONBREAKPOINT environment variable: if it is 0 nothing happens, if it names another function that one is imported and called, and otherwise pdb.set_trace runs. pdb is built on the bdb module, which registers a trace function through sys.settrace, so the interpreter reports every call, line and return in traced frames, and pdb decides whether to pause. That’s also why programs run slower under a debugger. Python 3.14 adds an optional backend based on sys.monitoring, which is designed to have lower overhead, but settrace is still the default.',
    },
    {
      id: 'debugging-crash-report',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: py`Write \`crash_report(func, *args)\` — a tiny automated post-mortem. Call \`func(*args)\`. If it returns normally, return \`None\`. If it raises an \`Exception\`, return a dict with \`"error"\` (the exception class name), \`"line"\` (the line number where the exception was raised, in the innermost frame) and \`"locals"\` (a plain \`dict\` copy of that frame's local variables).`,
      answer: 'Catch the exception, follow exc.__traceback__ through tb_next to the last entry, and read tb_lineno and tb_frame.f_locals (copied with dict()).',
      explanation: py`A traceback is a linked list from the outermost frame (where you caught it) to the innermost (where it was raised). The last entry's frame is the one \`pdb.post_mortem()\` would open. Copying \`f_locals\` with \`dict()\` matters: since 3.13 a function frame's \`f_locals\` is a live proxy, not a snapshot.`,
      starter: { files: { 'main.py': py`def crash_report(func, *args):
    try:
        func(*args)
    except Exception as exc:
        # TODO: find the innermost traceback entry and report on it
        return {"error": type(exc).__name__}
    return None


def apply_discount(price, code):
    rates = {"SAVE10": 0.10, "HALF": 0.5}
    rate = rates[code]
    return price * (1 - rate)


print(crash_report(apply_discount, 40, "SAVE20"))
` } },
      tests: [
        { name: 'returns None when nothing goes wrong', code: py`assert crash_report(apply_discount, 40, "HALF") is None` },
        { name: 'reports the error name and the raising line', code: py`report = crash_report(apply_discount, 40, "SAVE20")
assert report["error"] == "KeyError"
expected = files["main.py"].splitlines().index("    rate = rates[code]") + 1
assert report["line"] == expected, "line should be where rates[code] raised"` },
        { name: 'locals come from the innermost frame, as a dict', code: py`report = crash_report(apply_discount, 40, "SAVE20")
assert type(report["locals"]) is dict
assert report["locals"]["code"] == "SAVE20" and report["locals"]["price"] == 40
assert "rate" not in report["locals"], "rate was never assigned"` },
        { name: 'follows the traceback into nested calls', code: py`def inner(values):
    total = sum(values)
    return total / len(values)

def outer():
    return inner([])

report = crash_report(outer)
assert report["error"] == "ZeroDivisionError"
assert report["locals"] == {"values": [], "total": 0}` },
      ],
      solution: { files: { 'main.py': py`def crash_report(func, *args):
    try:
        func(*args)
    except Exception as exc:
        tb = exc.__traceback__
        while tb.tb_next is not None:      # walk to the frame that raised
            tb = tb.tb_next
        return {
            "error": type(exc).__name__,
            "line": tb.tb_lineno,
            "locals": dict(tb.tb_frame.f_locals),
        }
    return None


def apply_discount(price, code):
    rates = {"SAVE10": 0.10, "HALF": 0.5}
    rate = rates[code]
    return price * (1 - rate)


print(crash_report(apply_discount, 40, "SAVE20"))
` } },
      hints: ['exc.__traceback__ is the first entry; each entry has tb_next, tb_lineno and tb_frame.', 'Loop while tb.tb_next is not None.', 'dict(tb.tb_frame.f_locals) makes a plain copy.'],
      whyAsked: 'Shows you understand that tracebacks and frames are real objects — the foundation of debuggers, error trackers and test frameworks.',
      mistakes: ['Using the first traceback entry (the frame that caught it, not the one that raised it)', 'Returning the live f_locals proxy instead of a copy', 'Catching BaseException and swallowing KeyboardInterrupt'],
      followUps: ['How does pdb.post_mortem use this?', 'Why can keeping tracebacks around cause memory leaks?', 'How would you include every frame, like traceback.extract_tb?'],
      modelAnswer: 'I call the function inside try/except Exception. The exception object carries __traceback__, which is a linked list of traceback entries starting at the frame where I caught it, so I follow tb_next until it is None to reach the innermost entry — the frame that actually raised. From that entry I take tb_lineno for the line, and tb_frame.f_locals for the variables, wrapped in dict() because since 3.13 a function frame’s f_locals is a live proxy rather than a snapshot. That’s exactly the frame pdb.post_mortem would drop me into. One caution: tracebacks keep frames and all their locals alive, so I wouldn’t store them long-term.',
    },
  ],

  takeaways: [
    'Debug with a method: reproduce → isolate → hypothesise → test → fix → add a regression test.',
    'Read tracebacks bottom-up; with chaining, "direct cause" puts the root cause on top, "during handling" means your error handler failed too.',
    'f"{expr=}" makes print probes labelled and unambiguous (it uses repr()); delete probes afterwards or turn them into logging.',
    'assert is a tripwire for impossible states — never wrap it in parentheses and never use it to validate input (python -O removes it).',
    'breakpoint() opens pdb: n/s/c/r to move, p/pp to inspect, l/ll to read code, w/u/d to walk the stack, b to set (conditional) breakpoints.',
    'Post-mortem debugging (python -m pdb -c continue, pdb.pm()) lets you inspect the exact frame that crashed.',
    'Rubber-ducking and bisecting (including git bisect) are powerful, tool-free ways to narrow a bug down.',
  ],
}
