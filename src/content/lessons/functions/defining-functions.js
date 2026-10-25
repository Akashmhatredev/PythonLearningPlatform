// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GRADE_BOOK = py`def average(scores):
    """Return the mean of a list of numbers."""
    return sum(scores) / len(scores)


def letter_grade(score):
    """Turn a score from 0 to 100 into a letter grade."""
    if score >= 90:
        return "A"
    if score >= 75:
        return "B"
    if score >= 60:
        return "C"
    return "F"


def print_report(name, scores):
    """Print one student's report line. Returns nothing (None)."""
    avg = average(scores)
    print(f"{name}: average {avg:.1f}, grade {letter_grade(avg)}")


print_report("Ada", [92, 88, 95])
print_report("Ben", [70, 65, 81])

result = print_report("Cy", [55, 61, 58])
print("print_report gave back:", result)
`

export default {
  id: 'defining-functions',
  title: 'Defining functions & returning values',
  summary: 'A function is a named, reusable block of code: def builds it, a call runs it in a fresh frame on the call stack, and return hands a value back.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['variables-and-names', 'if-statements', 'for-loops'],
  related: ['function-arguments', 'scope', 'recursion', 'lambdas-and-higher-order', 'none-and-truthiness', 'functional-concepts', 'type-hints', 'main-guard-and-scripts', 'testing-fundamentals'],
  tags: ['functions', 'def', 'return', 'parameters', 'arguments', 'docstring', 'call stack', 'frames', 'None', 'side effects', 'pure functions', 'print vs return', 'pass'],
  apis: [
    { name: 'def', summary: 'Creates a function object and binds it to a name. The body runs only when the function is called.' },
    { name: 'return', summary: 'Ends the current call and hands a value back to the caller. Without a value (or without a return at all) the call gives back None.' },
    { name: 'help(function)', summary: 'Shows a function\'s signature and docstring.' },
    { name: 'function.__doc__', summary: 'The docstring: the string literal written as the first statement of the function body.' },
    { name: 'pass', summary: 'A statement that does nothing — a placeholder body for a function you will write later.' },
  ],
  docs: [
    { label: 'Python tutorial — defining functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' },
    { label: 'Language reference — function definitions', url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions' },
    { label: 'Language reference — the return statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-return-statement' },
    { label: 'Glossary — parameter vs argument', url: 'https://docs.python.org/3/glossary.html#term-parameter' },
    { label: 'PEP 257 — docstring conventions', url: 'https://peps.python.org/pep-0257/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **function** is a named block of code that does one job. You write it once with \`def\`, and then you can run it — *call* it — as many times as you like, from anywhere in your program, by writing its name followed by parentheses.`,
    py`You have been calling functions since your first program: \`print("hi")\`, \`len(scores)\`, \`input("Name? ")\`. Now you get to build your own:`,
    { code: py`def average(scores):
    return sum(scores) / len(scores)


print(average([92, 88, 95]))   # 91.66666666666667`, lang: 'python', title: 'your first function' },
    py`Three new words carry the whole lesson:`,
    py`- a **parameter** is a name in the \`def\` line (\`scores\`) — a placeholder for the input;
- an **argument** is the actual value you pass in when you call it (\`[92, 88, 95]\`);
- \`return\` sends a result **back** to whoever called the function.`,
    py`Underneath, every call gets its own private workspace called a **frame**, stacked on top of the caller's frame on the **call stack**. Understanding that stack is what makes [scope](lesson:scope), [recursion](lesson:recursion) and every error traceback make sense.`,
  ],
  why: [
    py`**Don't repeat yourself.** If you compute an average in five places and then discover a bug, you fix it in five places — and miss one. With a function you fix it once.`,
    py`**Name an idea.** \`letter_grade(avg)\` tells a reader *what* happens; the eight lines of \`if\` statements inside tell them *how*. Readers can trust the name and skip the details, which is how big programs stay understandable.`,
    py`**Test in isolation.** A function that takes inputs and returns an output can be checked on its own: \`assert letter_grade(95) == "A"\`. That is the foundation of [testing](lesson:testing-fundamentals) — and of the exercises on this platform.`,
    py`**Build bigger things from smaller ones.** Programs are functions calling functions. \`print_report\` uses \`average\` and \`letter_grade\`; a web server is the same idea, many layers deep.`,
  ],
  eli15: [
    py`A function is a **recipe card**. Writing the card (\`def make_pancakes(eggs):\`) doesn't cook anything — it just puts the card in the kitchen drawer with a title on it.`,
    py`*Calling* the function (\`make_pancakes(2)\`) is someone actually cooking from the card, using the ingredients you hand them — here, 2 eggs. The blank on the card ("eggs") is the **parameter**; the real eggs you hand over are the **argument**.`,
    py`When they're done they hand you the pancakes — that's \`return\`. If the recipe only says "shout *pancakes are ready!*" and never hands you a plate, you get shouting (\`print\`) but nothing to eat (Python gives you \`None\`).`,
    py`And if a recipe says "first make the batter (see the batter card)", the cook puts the pancake card down, follows the batter card, then picks the pancake card back up exactly where they left off. That pile of cards-in-progress is the **call stack**.`,
  ],
  analogy: {
    title: 'A recipe card and a kitchen',
    body: [
      py`A recipe card has a title, a list of blanks for ingredients and a set of steps. Writing it doesn't make food. Following it does — and every time you follow it you start fresh, with this time's ingredients, on a clean bit of counter.`,
      py`When one recipe needs another ("make the sauce first"), you put the current card down, follow the sauce card to the end, bring the sauce back and carry on with the first card from the step where you paused. Python manages function calls exactly like that.`,
    ],
    mapping: [
      ['writing a recipe card', 'def creates a function object and binds its name'],
      ['the blanks on the card ("eggs")', 'parameters'],
      ['the real ingredients you hand over', 'arguments'],
      ['a clean bit of counter for this cooking session', 'a new frame with its own local variables'],
      ['handing back the finished dish', 'return value'],
      ['a recipe that only shouts "done!"', 'a function that prints but returns None'],
      ['the pile of cards you are partway through', 'the call stack'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch frames get pushed and popped',
    props: {
      code: py`def square(n):
    result = n * n
    return result


def sum_of_squares(a, b):
    first = square(a)
    second = square(b)
    return first + second


total = sum_of_squares(3, 4)
print("total:", total)
`,
      notes: {
        1: '`def` runs **once**: it builds a function object and binds the name `square`. The body is *not* executed yet.',
        6: 'Same again for `sum_of_squares`. Two names, two function objects, zero calls so far.',
        12: 'The call pushes a **new frame** for `sum_of_squares` on top of the Global frame. Its parameters `a` and `b` are bound to the arguments 3 and 4.',
        7: '`square(a)` pushes a third frame. Now three frames are on the stack — and `sum_of_squares` is paused on this line, waiting.',
        2: 'Inside `square`, `n` and `result` are **local** names. They live only in this frame.',
        3: '`return result` hands 9 back. The `square` frame is popped and its locals disappear; the call `square(a)` is replaced by 9.',
        8: 'A **second, completely fresh** `square` frame — nothing is left over from the first call.',
        9: '`return first + second` sends 25 back to the Global frame, and the `sum_of_squares` frame is popped too.',
        13: 'Back in the Global frame: only `total` (and the two functions) remain.',
      },
    },
    alt: 'A step-by-step trace. The Global frame first gains two names, square and sum_of_squares, pointing at function objects. Calling sum_of_squares(3, 4) pushes a frame with a = 3 and b = 4. Calling square(a) pushes a third frame with n = 3 and result = 9; it returns 9 and is removed. A second square frame appears with n = 4, returns 16 and is removed. sum_of_squares returns 25 and its frame is removed, leaving total = 25 in the Global frame, and the program prints total: 25.',
    caption: py`Step with ▶ and watch the **stack of frames** on the left. Each call gets a fresh frame; each \`return\` removes the top frame and hands a value to the frame below. The last call made is always the first to finish — "last in, first out".`,
  },
  syntax: [
    py`#### Anatomy of a function`,
    { code: py`def letter_grade(score):                      # header: def, name, parameters, colon
    """Turn a score from 0 to 100 into a letter."""   # docstring (optional, recommended)
    if score >= 90:                           # indented body: runs only when called
        return "A"                            # return ends the call immediately
    return "F"


grade = letter_grade(95)                      # call: name + parentheses + arguments
print(grade)                                  # A`, lang: 'python', title: 'def, body, return, call' },
    py`- \`def\` is followed by the function's **name** (\`snake_case\`, like variables), the **parameter list** in parentheses (can be empty: \`def greet():\`) and a colon.
- The **body** is everything indented under the header — 4 spaces by convention.
- A **call** is the name plus parentheses. The parentheses are what make it run: \`letter_grade\` is the function object itself; \`letter_grade(95)\` is a call.`,
    py`#### return — handing a value back`,
    py`\`return expression\` evaluates the expression, ends the call **immediately**, and makes the call expression evaluate to that value. Code after a \`return\` in the same block never runs.`,
    { code: py`def min_max(numbers):
    return min(numbers), max(numbers)    # a comma makes a tuple: two results in one


low, high = min_max([7, 2, 9])           # unpack the tuple
print(low, high)                         # 2 9


def warn(message):
    print("WARNING:", message)           # no return statement at all


outcome = warn("disk almost full")       # prints WARNING: disk almost full
print(outcome)                           # None`, lang: 'python', title: 'several values, and the implicit None' },
    { callout: 'note', title: 'Every call returns something', text: py`A function that ends without reaching a \`return\` — or runs a bare \`return\` with no value — returns \`None\`, Python's "nothing here" object. That is a language guarantee, and it is why you sometimes see \`None\` printed when you expected a number. See [None & truthiness](lesson:none-and-truthiness).` },
    py`#### Parameters vs arguments`,
    py`| | where it appears | example |
|---|---|---|
| **parameter** | in the \`def\` line — a name | \`def area(width, height):\` |
| **argument** | in the call — a value | \`area(3, 4)\` |`,
    py`When you call \`area(3, 4)\`, Python binds the parameter \`width\` to \`3\` and \`height\` to \`4\`, in order. That is all "passing an argument" means: binding a parameter *name* to the argument *object* — no copying (see [variables](lesson:variables-and-names)). Defaults, keyword arguments, \`*args\` and \`**kwargs\` are in [function arguments](lesson:function-arguments).`,
    py`#### Docstrings`,
    py`A string literal written as the **first statement** of the body becomes the function's *docstring*. Tools read it: \`help(average)\` prints it, editors show it on hover, and it lives at \`average.__doc__\`. PEP 257's convention: a one-line summary in the imperative mood ("Return…", not "Returns…"), with more detail after a blank line if needed.`,
    { code: py`def average(scores):
    """Return the arithmetic mean of scores.

    scores must be a non-empty list of numbers.
    """
    return sum(scores) / len(scores)


print(average.__doc__.splitlines()[0])   # Return the arithmetic mean of scores.`, lang: 'python', title: 'a docstring is data attached to the function' },
    py`#### Placeholders and order`,
    { code: py`def save_scores(scores):
    pass            # "do nothing" — a valid body while you plan


def load_scores():
    ...             # the Ellipsis literal also works as a placeholder`, lang: 'python', title: 'pass and ...' },
    py`A function must be **defined before it is called** — Python runs the file top to bottom, and \`def\` is a statement that runs like any other. It does *not* have to be defined before another function that mentions it, because names inside a body are only looked up when that body actually runs.`,
    py`#### Pure functions and side effects`,
    py`A **side effect** is anything a function does to the world besides returning a value: printing, writing a file, changing a list it was given, changing a global variable. A **pure function** has no side effects and always returns the same output for the same input — like \`average\` and \`letter_grade\` above.`,
    py`Pure functions are the easiest code you will ever test and reuse. Side effects are necessary (a program that never prints is useless), so the habit is to keep them at the edges: **compute with pure functions, then print/save in one place.** You'll go deeper in [functional thinking](lesson:functional-concepts).`,
  ],
  walkthrough: {
    title: 'Reading the grade book line by line',
    lang: 'python',
    code: GRADE_BOOK,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 3], text: py`\`def average(scores):\` builds a function object and binds the name \`average\` to it. The docstring documents it. Nothing is averaged yet — the body waits for a call.` },
      { lines: [6, 14], text: py`\`letter_grade\` has four \`return\` statements. Whichever is reached **first** ends the call, so no \`elif\` is needed: by the time Python reaches \`if score >= 75\`, it already knows the score is below 90.` },
      { lines: [17, 20], text: py`\`print_report\` *uses* the other two functions: \`average(scores)\` returns a number, which is bound to the local name \`avg\` and passed on to \`letter_grade\`. Its job is a **side effect** — printing — and it has no \`return\`.` },
      { lines: [23, 24], text: py`Each call evaluates the arguments, pushes a fresh frame, binds \`name\` and \`scores\`, and runs the body. Two calls, two independent frames.` },
      { lines: [26, 27], text: py`The third call still prints its line — but \`print_report\` returns nothing, so \`result\` is bound to \`None\`. This is the classic **print vs return** surprise, shown on purpose.` },
    ],
  },
  playground: {
    title: 'Grade book helpers',
    objective: 'Run it, then extend the functions — and notice which ones return values and which only print.',
    files: { 'main.py': GRADE_BOOK },
    expected: py`Four lines:

\`\`\`text
Ada: average 91.7, grade A
Ben: average 72.0, grade C
Cy: average 58.0, grade F
print_report gave back: None
\`\`\`

The last line is the point: a function that only prints gives back \`None\`.`,
    experiments: [
      {
        id: 'grade-d',
        task: py`Add a **D** grade for scores from 50 up to (but not including) 60. A score below 50 is still an F.`,
        hint: py`Add one more \`if\` with its own \`return\` just before \`return "F"\`.`,
        tests: [
          { name: 'letter_grade(55) is "D"', code: py`assert letter_grade(55) == "D"` },
          { name: 'letter_grade(49) is still "F"', code: py`assert letter_grade(49) == "F"` },
          { name: 'letter_grade(60) is still "C"', code: py`assert letter_grade(60) == "C"` },
        ],
        explain: py`Because every branch **returns**, the order of the checks does the work: by the time Python reaches \`if score >= 50\`, every score of 60 or more has already returned. Cy's line now says grade D.`,
      },
      {
        id: 'passed',
        task: py`Define a new function \`passed(scores)\` that **returns** \`True\` when the average is 60 or more and \`False\` otherwise. Reuse \`average\`.`,
        hint: py`A comparison already *is* a True/False value: \`return average(scores) >= 60\`.`,
        tests: [
          { name: 'passed() exists', code: py`assert callable(ns.get('passed')), 'Define a function named passed(scores)'` },
          { name: 'passed([60, 70]) is True', code: py`assert passed([60, 70]) is True` },
          { name: 'passed([10, 20]) is False', code: py`assert passed([10, 20]) is False` },
        ],
        explain: py`\`passed\` is a **pure** function built on another pure function. It returns a value instead of printing, so other code (and tests) can use the answer — for example \`if passed(scores): ...\`.`,
      },
      {
        id: 'return-the-line',
        task: py`Add \`report_line(name, scores)\` that **returns** the report text (exactly what \`print_report\` prints now) without printing it. Then make \`print_report\` simply \`print(report_line(name, scores))\`.`,
        hint: py`Move the f-string into \`report_line\` after a \`return\`. \`print_report\` becomes a one-line wrapper.`,
        tests: [
          { name: 'report_line returns the text', code: py`assert report_line("Ada", [92, 88, 95]) == "Ada: average 91.7, grade A"` },
          { name: 'report_line does not print', code: py`assert capture(report_line, "Ada", [92, 88, 95]) == "", 'report_line should return the text, not print it'` },
          { name: 'the program still prints all three reports', code: py`assert output.count("average") == 3` },
        ],
        explain: py`Now the *computation* (building the text) is separate from the *side effect* (printing). You can test \`report_line\`, write its result to a file, or send it in an email — none of which is possible with a function that only prints.`,
      },
      {
        id: 'empty-scores',
        task: py`Call \`average([])\` at the end and read the error. Then change \`average\` so that an empty list returns \`None\` instead of crashing. (Remove the crashing call afterwards, or keep it inside a \`print\`.)`,
        hint: py`Start the body with a *guard clause*: \`if not scores:\` then \`return None\`. Put it before the division.`,
        tests: [
          { name: 'average([]) returns None', code: py`assert average([]) is None` },
          { name: 'average still works for real scores', code: py`assert average([70, 80, 90]) == 80` },
        ],
        explain: py`\`len([])\` is 0, so the original raises \`ZeroDivisionError: division by zero\`. An early \`return\` at the top handles the special case and leaves the main calculation unindented and readable. (Raising a clear error is the other good option — see [raising exceptions](lesson:raising-exceptions).)`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The life of one function call',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'fn', label: 'function object', note: 'made once by def', x: 120, y: 80, tone: 'yellow' },
        { id: 'call', label: 'average([92, 88, 95])', note: 'the call site', x: 120, y: 240, tone: 'paper' },
        { id: 'frame', label: 'new frame', note: 'scores → [92, 88, 95]', x: 380, y: 240, tone: 'blue' },
        { id: 'body', label: 'body runs', note: 'line by line', x: 620, y: 240, tone: 'blue' },
        { id: 'ret', label: 'return value', note: '91.666…', x: 620, y: 80, tone: 'kraft' },
      ],
      edges: [
        { from: 'fn', to: 'call', label: 'name looked up' },
        { from: 'call', to: 'frame', label: 'push' },
        { from: 'frame', to: 'body', label: 'run' },
        { from: 'body', to: 'ret', label: 'return' },
        { from: 'ret', to: 'call', label: 'value replaces the call', dashed: true },
      ],
      steps: [
        { focus: ['fn'], text: py`When the \`def\` statement runs, Python builds a **function object** (code + name + docstring) and binds the name \`average\` to it. The body has not run.` },
        { focus: ['call', 'fn'], edges: ['fn->call'], text: py`Later, a **call**: Python looks up the name \`average\`, finds the function object, and evaluates the arguments — here the list \`[92, 88, 95]\`.` },
        { focus: ['frame'], edges: ['call->frame'], text: py`A fresh **frame** is pushed on the call stack. Each parameter is bound to its argument object (no copy is made). This frame is the call's private workspace.` },
        { focus: ['body'], edges: ['frame->body'], text: py`The body runs line by line. Any name assigned here is **local** to this frame; the caller can't see it.` },
        { focus: ['ret'], edges: ['body->ret'], text: py`\`return\` evaluates its expression and ends the call. If the body ends without a \`return\`, the value is \`None\`.` },
        { focus: ['call', 'ret'], edges: ['ret->call'], text: py`The frame is **popped** (its local names vanish) and the call expression in the caller evaluates to the returned value — as if \`average([92, 88, 95])\` had been replaced by \`91.666…\`.` },
      ],
    },
    alt: 'Diagram of a function call. A function object created by def is looked up by the call average([92, 88, 95]). The call pushes a new frame where scores is bound to the list. The body runs, then return produces 91.666, which flows back to the call site, replacing the call expression, while the frame is removed.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`def\` is an ordinary statement that runs when Python reaches it. It creates a **function object** — functions are values, just like numbers and lists — and binds a name to it. You can print it, store it in a list or pass it to another function (that's [higher-order functions](lesson:lambdas-and-higher-order)).`,
      { code: py`def greet(name):
    return f"Hello, {name}!"


print(type(greet))      # <class 'function'>
print(greet.__name__)   # greet
say_hi = greet          # a second name for the same function object
print(say_hi("Ada"))    # Hello, Ada!`, lang: 'python', title: 'a function is an object' },
      py`Each call creates a **frame**, a small record holding the call's local variables and "where am I up to". Frames are kept on a **call stack**: calling pushes a frame, returning pops it. When an error happens, the traceback you see is a printout of that stack, oldest call at the top — see [reading errors](lesson:reading-errors).`,
    ],
    technical: [
      py`A function object bundles: the compiled **code object** (\`greet.__code__\`), the module's global namespace it should look names up in (\`greet.__globals__\`), its defaults, its name and its docstring. The body is compiled once, when the module is compiled; \`def\` just wraps that code into a new function object each time the \`def\` runs.`,
      py`On a call, Python evaluates the arguments left to right, creates a frame, binds each parameter to its argument object, then executes the code. Names assigned in the body are **local** to that frame; other names are looked up in the enclosing, global and built-in scopes when the line runs — the [LEGB rule](lesson:scope). That late lookup is why a function body may mention a helper that is defined further down the file, as long as the helper exists by the time of the call.`,
      py`\`return x\` hands the *object* \`x\` back to the caller — no copy, just like assignment. After the frame is popped, its local names are gone; the returned object survives because the caller now holds a reference to it.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython each call allocates a frame for its locals and evaluation stack, and the body runs as bytecode — you can read it with \`import dis; dis.dis(average)\` (see [bytecode](lesson:bytecode)). Recent CPython versions make calls between Python functions noticeably cheaper than older ones, but a call still costs more than an inline expression. Other implementations (PyPy, for example) manage frames differently. None of this changes what your code means.` },
    ],
    production: [
      py`Good functions **do one thing** and are named with a verb that says what: \`load_orders\`, \`parse_price\`, \`send_invoice\`. If you need "and" to describe a function, it probably wants to be two.`,
      py`Keep the **core pure, the edges effectful**: parse, validate and compute in functions that take arguments and return values; do the input/output (printing, files, network, databases) in a thin outer layer. The pure core is trivial to unit-test; the outer layer is small enough to check by hand. You'll see this again in [clean architecture](lesson:clean-architecture).`,
      py`Write a docstring for anything public, and add [type hints](lesson:type-hints) so editors and checkers know what goes in and comes out: \`def average(scores: list[float]) -> float:\`. Scripts conventionally put their top-level logic in a \`main()\` function called under \`if __name__ == "__main__":\` — see [scripts vs modules](lesson:main-guard-and-scripts).`,
      py`Don't fear small functions. A three-line helper with a precise name is easier to read, reuse and test than the same three lines repeated inline. Optimise call overhead only when a profiler tells you it matters ([profiling](lesson:profiling)).`,
    ],
  },
  mistakes: [
    {
      title: 'Printing when you meant to return',
      wrong: { code: py`def add_tax(price):
    print(price * 1.2)


total = add_tax(10) + 5    # TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'`, lang: 'python', static: true },
      right: { code: py`def add_tax(price):
    return price * 1.2


total = add_tax(10) + 5
print(total)               # 17.0`, lang: 'python' },
      explanation: py`\`print\` shows a value on the screen and then forgets it; the caller gets \`None\`. If other code needs the result, **return** it and let the caller decide whether to print.`,
    },
    {
      title: 'Forgetting the parentheses',
      wrong: { code: py`def greeting():
    return "Good morning!"


print(greeting)      # <function greeting at 0x...>`, lang: 'python' },
      right: { code: py`def greeting():
    return "Good morning!"


print(greeting())    # Good morning!`, lang: 'python' },
      explanation: py`Without \`()\` you refer to the function object itself instead of calling it. Python prints the object's description. This also bites in conditions: \`if is_ready:\` is always true because a function object is truthy — you meant \`if is_ready():\`.`,
    },
    {
      title: 'Returning too early inside a loop',
      wrong: { code: py`def has_negative(numbers):
    for n in numbers:
        if n < 0:
            return True
        else:
            return False     # gives up after looking at the FIRST number


print(has_negative([3, -1]))   # False — wrong!`, lang: 'python' },
      right: { code: py`def has_negative(numbers):
    for n in numbers:
        if n < 0:
            return True
    return False             # only after every number has been checked


print(has_negative([3, -1]))   # True`, lang: 'python' },
      explanation: py`\`return\` ends the whole function, not just the loop iteration. "Found it" can return as soon as it's found; "not found" can only be decided **after** the loop finishes.`,
    },
    {
      title: 'A branch that forgets to return',
      wrong: { code: py`def shipping_cost(weight_kg):
    if weight_kg <= 1:
        return 3.50
    elif weight_kg <= 5:
        return 7.00
    # weights over 5 kg fall off the end


print(shipping_cost(8))    # None`, lang: 'python' },
      right: { code: py`def shipping_cost(weight_kg):
    if weight_kg <= 1:
        return 3.50
    if weight_kg <= 5:
        return 7.00
    return 12.00


print(shipping_cost(8))    # 12.0`, lang: 'python' },
      explanation: py`Any path through the body that doesn't hit a \`return\` returns \`None\`. Make sure every path returns something deliberate — a final unconditional \`return\` at the bottom is the easiest way.`,
    },
    {
      title: 'Calling a function before its def has run',
      wrong: { code: py`print(double(4))   # NameError: name 'double' is not defined


def double(n):
    return n * 2`, lang: 'python', static: true },
      right: { code: py`def double(n):
    return n * 2


print(double(4))   # 8`, lang: 'python' },
      explanation: py`\`def\` is a statement that runs in order like any other. At module level, put definitions first and calls after (or put the calls in a \`main()\` function called at the bottom).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'`,
      cause: py`A value you are using is \`None\` — usually the result of a function that prints instead of returning, or has a path with no \`return\`.`,
      fix: py`Find where the \`None\` came from: print the function's result right after the call. Add the missing \`return\`, or make every branch return.`,
    },
    {
      symptom: py`TypeError: greet() missing 1 required positional argument: 'name'`,
      cause: py`The call passed fewer arguments than the function has parameters.`,
      fix: py`Pass a value for every parameter (\`greet("Ada")\`), or give the parameter a default value — see [function arguments](lesson:function-arguments).`,
    },
    {
      symptom: py`TypeError: greet() takes 1 positional argument but 2 were given`,
      cause: py`Too many arguments in the call. (In a method, the hidden \`self\` argument counts too — see [classes](lesson:classes-and-objects).)`,
      fix: py`Compare the call with the \`def\` line. Remove the extra argument or add a parameter.`,
    },
    {
      symptom: py`The output shows <function average at 0x1805180> instead of a number.`,
      cause: py`You used the function's name without calling it: \`print(average)\`.`,
      fix: py`Add parentheses and arguments: \`print(average(scores))\`.`,
    },
    {
      symptom: py`IndentationError: expected an indented block after function definition on line 1`,
      cause: py`The \`def\` line has no indented body underneath it.`,
      fix: py`Indent the body by 4 spaces. If you're not ready to write it, use \`pass\` as a placeholder.`,
    },
  ],
  bestPractices: [
    'Name functions with verbs that say what they do: calculate_total, load_scores, is_valid_email.',
    'Make each function do one job; if describing it needs "and", consider splitting it.',
    'Return results instead of printing them, and print at the outer edge of the program.',
    'Make every path through a function return deliberately — end with an unconditional return when there are branches.',
    'Use guard clauses (early returns) for special cases to keep the main logic unindented.',
    'Write a one-line docstring in the imperative mood ("Return the …") for every function others will call.',
    'Prefer pure functions for calculations; keep side effects (printing, files, globals) in a few clearly named places.',
  ],
  useCases: [
    'Removing copy-pasted code: one average() instead of five inline calculations.',
    'Giving a complicated condition a name: is_weekend(day), can_checkout(cart).',
    'Breaking a long script into steps: load_data(), clean(), summarize(), save_report().',
    'Making logic testable: assert shipping_cost(8) == 12.0.',
  ],
  whenToUse: {
    use: [
      'You are about to copy and paste a block of code.',
      'A block of code computes one clear thing you can name.',
      'You want to test a piece of logic on its own.',
      'A script has grown past one screen — split it into named steps.',
    ],
    avoid: [
      'Wrapping a single obvious expression in a function that adds no meaning (def add(a, b): return a + b used once).',
      'Huge "do everything" functions with many flags — split them into smaller ones instead.',
      'Functions that secretly change global variables — pass values in and return values out.',
    ],
  },
  comparison: {
    title: 'print vs return',
    headers: ['', 'print(value)', 'return value'],
    rows: [
      ['what it does', 'writes text to the screen (a side effect)', 'hands the object back to the caller'],
      ['what the caller gets', 'None (from a function that only prints)', 'the value itself'],
      ['can the result be reused?', 'no — it is just characters on the screen', 'yes — store it, compute with it, test it'],
      ['ends the function?', 'no, the next line runs', 'yes, immediately'],
      ['how many per call?', 'as many as you like', 'one return runs (it can hold a tuple of several values)'],
    ],
    note: py`Rule of thumb: functions that **compute** should return. Only functions whose job *is* output (like \`print_report\`) should print — and they often just print what a returning function produced.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'defining-functions-q1',
      type: 'mcq',
      prompt: py`In \`def area(width, height):\` and the call \`area(3, 4)\`, which statement is correct?`,
      options: [
        { text: '3 and 4 are parameters; width and height are arguments', why: 'It is the other way round: parameters are the names in the def line, arguments are the values in the call.' },
        'width and height are parameters; 3 and 4 are arguments',
        { text: 'Parameters and arguments are two words for exactly the same thing', why: 'People often mix them up in conversation, but they are different: a parameter is a name, an argument is the value bound to it for one call.' },
        { text: 'width and height become global variables when area is called', why: 'Parameters are local names: they exist only in the frame of that one call.' },
      ],
      answer: 1,
      explanation: py`Parameters are the placeholder **names** in the definition; arguments are the **values** supplied by a call. The call binds \`width\` → 3 and \`height\` → 4 in a new frame.`,
    },
    {
      id: 'defining-functions-q2',
      type: 'output',
      prompt: 'What does this program print? (Two lines.)',
      code: py`def shout(word):
    print(word.upper())


result = shout("hi")
print(result)`,
      answer: py`HI
None`,
      accept: [py`HI None`],
      explanation: py`Calling \`shout("hi")\` prints \`HI\` as a side effect. The function has no \`return\`, so the call evaluates to \`None\`, which is bound to \`result\` and printed on the second line.`,
    },
    {
      id: 'defining-functions-q3',
      type: 'output',
      prompt: 'Predict the order of the output lines.',
      code: py`def outer():
    print("outer starts")
    inner()
    print("outer ends")


def inner():
    print("in inner")


outer()
print("done")`,
      options: [
        { text: 'outer starts / outer ends / in inner / done', why: 'A call is not scheduled for later: outer pauses on the inner() line until inner has completely finished.' },
        'outer starts / in inner / outer ends / done',
        { text: 'NameError, because inner is defined after outer', why: 'Names in a function body are looked up when the line runs. By the time outer() is called, inner has been defined.' },
        { text: 'in inner / outer starts / outer ends / done', why: 'Defining a function does not run it; only the call outer() starts anything.' },
      ],
      answer: 1,
      explanation: py`\`outer()\` pushes a frame and prints its first line. \`inner()\` pushes a second frame on top; \`outer\` is paused until \`inner\` returns. Then \`outer\` resumes, finishes, and finally the module prints \`done\`. Last called, first finished.`,
    },
    {
      id: 'defining-functions-q4',
      type: 'bug',
      prompt: py`\`contains_word(["sun", "rain"], "rain")\` returns \`False\`. Click the line that causes the bug.`,
      code: py`def contains_word(words, target):
    for word in words:
        if word == target:
            return True
        else:
            return False


print(contains_word(["sun", "rain"], "rain"))`,
      answerLine: 6,
      explanation: py`\`return False\` runs on the **first** word that doesn't match and ends the whole function, so \`"rain"\` is never checked. Delete the \`else\` branch and put \`return False\` after the loop, at the same indentation as \`for\`.`,
    },
    {
      id: 'defining-functions-q5',
      type: 'fill',
      prompt: py`Complete the function so that \`print(rectangle_area(3, 4))\` prints \`12\`.`,
      code: py`___ rectangle_area(width, height):
    ___ width * height


print(rectangle_area(3, 4))`,
      answer: [['def'], ['return']],
      explanation: py`\`def\` starts the definition; \`return\` hands the product back to the caller, where \`print\` displays it.`,
    },
    {
      id: 'defining-functions-q6',
      type: 'mcq',
      prompt: 'Which of these functions is **pure** (no side effects, same output for the same input)?',
      options: [
        { text: 'def log(msg): print(msg)', why: 'Printing is a side effect: it changes the world outside the function.' },
        { text: 'def add_item(cart, item): cart.append(item)', why: 'It changes the list it was given — a side effect the caller can observe.' },
        'def vat(price): return round(price * 0.2, 2)',
        { text: 'def roll(): return random.randint(1, 6)', why: 'It returns different values for the same (empty) input, so it is not pure.' },
      ],
      answer: 2,
      explanation: py`\`vat\` only reads its argument and returns a new value. Call it with 10 a thousand times and you get 2.0 every time, with nothing else changed — easy to test and reuse.`,
    },
    {
      id: 'defining-functions-q7',
      type: 'short',
      prompt: 'Explain in your own words what the call stack is and what happens to it when a function calls another function and then returns.',
      answer: py`The call stack is the pile of frames for the calls that are currently in progress. Calling a function pushes a new frame (its own local variables and current position) on top; the caller pauses. When the called function returns, its frame is popped, its locals disappear, and the caller resumes from where it paused, using the returned value. The most recent call is always the first to finish.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'temperature-tools',
      title: 'Temperature tools',
      difficulty: 'beginner',
      prompt: py`Write two small **pure** functions:

1. \`celsius_to_fahrenheit(celsius)\` — **returns** the temperature in Fahrenheit, using \`celsius * 9 / 5 + 32\`.
2. \`is_freezing(celsius)\` — **returns** \`True\` when the temperature is 0 °C or below, otherwise \`False\`.

Neither function should print anything. The tests check that \`celsius_to_fahrenheit(100)\` returns \`212\`, \`celsius_to_fahrenheit(-40)\` returns \`-40\`, \`is_freezing(0)\` is \`True\`, \`is_freezing(0.5)\` is \`False\`, and that calling the functions prints nothing.`,
      files: {
        'main.py': py`def celsius_to_fahrenheit(celsius):
    # TODO: return the temperature in Fahrenheit
    pass


def is_freezing(celsius):
    # TODO: return True if the temperature is 0 or below
    pass


print(celsius_to_fahrenheit(100))
print(is_freezing(-5))
`,
      },
      hints: [
        'Replace each pass with a return statement. Right now both functions return None.',
        'The conversion is one expression: return celsius * 9 / 5 + 32.',
        'A comparison is already True or False, so is_freezing can be: return celsius <= 0',
      ],
      solution: {
        explanation: py`Each function is a single \`return\` of an expression. \`celsius * 9 / 5 + 32\` follows normal operator precedence (multiply and divide before add). \`celsius <= 0\` evaluates to a \`bool\`, so there is no need for \`if ...: return True else: return False\`. Because both functions *return* instead of printing, the caller decides what to do with the result — the two \`print\` calls at the bottom show it, and the tests check it directly.`,
        files: {
          'main.py': py`def celsius_to_fahrenheit(celsius):
    """Return celsius converted to degrees Fahrenheit."""
    return celsius * 9 / 5 + 32


def is_freezing(celsius):
    """Return True if water freezes at this temperature."""
    return celsius <= 0


print(celsius_to_fahrenheit(100))
print(is_freezing(-5))
`,
        },
      },
      tests: [
        { name: 'celsius_to_fahrenheit(100) returns 212', code: py`assert celsius_to_fahrenheit(100) == 212` },
        { name: 'celsius_to_fahrenheit(-40) returns -40', code: py`assert celsius_to_fahrenheit(-40) == -40` },
        { name: 'body temperature converts correctly', code: py`assert celsius_to_fahrenheit(37) == approx(98.6)` },
        { name: 'is_freezing(0) is True', code: py`assert is_freezing(0) is True` },
        { name: 'is_freezing(0.5) is False', code: py`assert is_freezing(0.5) is False` },
        { name: 'the functions return instead of printing', code: py`assert capture(celsius_to_fahrenheit, 20) == "" and capture(is_freezing, 20) == "", 'Use return, not print, inside the functions'` },
      ],
    },
    {
      id: 'fix-the-receipt',
      title: 'Fix the receipt',
      difficulty: 'beginner',
      prompt: py`This receipt program prints \`Total: 0\` even though the cart clearly costs something. The functions print where they should **return**.

Fix it so that:

- \`line_total(price, quantity)\` **returns** \`price * quantity\` and prints nothing;
- \`cart_total(cart)\` **returns** the sum of \`line_total(...)\` for every \`(price, quantity)\` pair in \`cart\`, and prints nothing;
- the program prints exactly \`Total: 12.5\`.

The tests call \`line_total(2.5, 4)\` (expects \`10.0\`), \`cart_total([(2.5, 4), (1.25, 2)])\` (expects \`12.5\`) and \`cart_total([])\` (expects \`0\`).`,
      files: {
        'main.py': py`def line_total(price, quantity):
    print(price * quantity)


def cart_total(cart):
    total = 0
    for price, quantity in cart:
        line_total(price, quantity)
    return total


cart = [(2.5, 4), (1.25, 2)]
print("Total:", cart_total(cart))
`,
      },
      hints: [
        'Run it first: the two numbers you see come from line_total printing. What does line_total give back to cart_total?',
        'line_total needs return instead of print. Then cart_total must actually use the returned value.',
        'In the loop: total += line_total(price, quantity)',
      ],
      solution: {
        explanation: py`Originally \`line_total\` printed its result and returned \`None\`, and \`cart_total\` threw that \`None\` away, so \`total\` stayed 0. Two changes fix it: \`line_total\` **returns** the product, and \`cart_total\` **adds** each returned value to \`total\`. Now both are pure functions — the only side effect is the single \`print\` at the bottom, which is exactly where output belongs. An empty cart skips the loop and returns the starting value, 0.`,
        files: {
          'main.py': py`def line_total(price, quantity):
    """Return the cost of one receipt line."""
    return price * quantity


def cart_total(cart):
    """Return the total cost of every (price, quantity) pair in cart."""
    total = 0
    for price, quantity in cart:
        total += line_total(price, quantity)
    return total


cart = [(2.5, 4), (1.25, 2)]
print("Total:", cart_total(cart))
`,
        },
      },
      tests: [
        { name: 'line_total(2.5, 4) returns 10.0', code: py`assert line_total(2.5, 4) == 10.0` },
        { name: 'cart_total adds every line', code: py`assert cart_total([(2.5, 4), (1.25, 2)]) == 12.5` },
        { name: 'an empty cart costs 0', code: py`assert cart_total([]) == 0` },
        { name: 'the functions do not print', code: py`assert capture(cart_total, [(1, 3)]) == "", 'cart_total and line_total should return values, not print them'` },
        { name: 'prints "Total: 12.5"', code: py`assert output.strip() == "Total: 12.5"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'defining-functions-print-vs-return',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between printing a value inside a function and returning it?',
      answer: 'print writes text to standard output as a side effect and the caller gets nothing back (None if that is all the function does). return ends the call and hands the object to the caller, who can store it, compute with it or test it.',
      explanation: py`Beginners often see the same thing on screen in both cases in the REPL, because the REPL echoes return values. In a script the difference is obvious: \`x = f()\` is \`None\` if \`f\` only prints. Returning keeps functions reusable and testable; printing belongs at the program's edges.`,
      code: { lang: 'python', code: py`def total_printed(prices):
    print(sum(prices))


def total_returned(prices):
    return sum(prices)


a = total_printed([1, 2])    # prints 3
b = total_returned([1, 2])   # prints nothing
print(a, b)                  # None 3` },
      whyAsked: 'It is the most common beginner misconception and reveals whether the candidate understands values flowing between functions.',
      mistakes: ['Saying they are the same because both "show the result"', 'Not mentioning that a function without return gives None', 'Forgetting that return also ends the function'],
      followUps: ['What does a function return if it has no return statement?', 'Why does the REPL seem to show return values?', 'How would you test a function that prints?'],
      modelAnswer: 'print is a side effect: it writes characters to the screen and gives nothing useful back, so a function that only prints returns None. return ends the call and hands the actual object back to the caller, who can store it, do maths with it, pass it on or check it in a test. The REPL blurs this because it echoes return values, but in a script x = f() is None if f only prints. So my rule is: functions that compute should return, and printing happens in one place at the edge of the program.',
    },
    {
      id: 'defining-functions-implicit-none',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`def describe(n):
    if n > 0:
        return "positive"
    elif n < 0:
        return "negative"


print(describe(5), describe(0))` },
      options: ['positive zero', 'positive None', 'positive', 'TypeError'],
      correctOption: 1,
      answer: '`positive None` — for 0 neither branch runs, the function falls off the end and implicitly returns None.',
      explanation: py`Every call returns an object. When execution reaches the end of the body without a \`return\` (or hits a bare \`return\`), the value is \`None\`. \`print\` shows it as \`None\`, separated by a space from the first value.`,
      whyAsked: 'Checks that the candidate knows the implicit-None rule and spots missing return paths — a frequent source of production bugs.',
      mistakes: ['Expecting an error for the missing branch', 'Expecting an empty string'],
      followUps: ['How would you make sure every path returns?', 'How can a type checker catch this? (a declared -> str return type with a path returning None)'],
      modelAnswer: 'It prints "positive None". For 5 the first branch returns "positive". For 0 neither condition is true, so execution falls off the end of the function, and Python guarantees that a function which ends without a return value returns None. That is a classic bug source, so I make every path return deliberately — usually with a final return at the bottom — and a type hint like -> str lets mypy flag the missing path.',
    },
    {
      id: 'defining-functions-call-stack',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the call stack, and how does it relate to the traceback you see when an exception is raised?',
      answer: 'The call stack is the stack of frames for calls currently in progress: each call pushes a frame holding its locals and current line, and each return pops it. A traceback is a snapshot of that stack at the moment of the error, listed from the outermost call (most recent call last).',
      explanation: py`When \`main()\` calls \`load()\` which calls \`parse()\`, three frames sit on the stack. If \`parse\` raises and nothing catches it, the exception unwinds the stack frame by frame, and Python prints each frame's file, line and function — the traceback. Reading it bottom-up tells you where it failed; top-down tells you how you got there. See [reading errors](lesson:reading-errors) and [try/except](lesson:try-except).`,
      whyAsked: 'Understanding frames underpins debugging, recursion limits, scope and exception propagation.',
      mistakes: ['Describing the stack as "where variables are stored" without mentioning per-call frames', 'Reading tracebacks top-down only and blaming the first frame'],
      followUps: ['What happens to local variables when a frame is popped?', 'Why does deep recursion raise RecursionError?', 'What does "most recent call last" mean?'],
      modelAnswer: 'The call stack is how Python keeps track of calls that have started but not finished. Each call pushes a frame — its local variables and where it is up to — on top of its caller, and the caller pauses. When the function returns, its frame is popped, its locals disappear, and the caller resumes with the return value. A traceback is just a printout of that stack at the moment an exception escaped, oldest call at the top and the failing line at the bottom, which is why I read it from the bottom up to find the error and top-down to see how we got there.',
    },
    {
      id: 'defining-functions-def-at-runtime',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'Does this program work, and what does it print? Explain when each name is looked up.',
      code: { lang: 'python', code: py`def greet():
    return helper().upper()


def helper():
    return "hi"


print(greet())


def helper():
    return "bye"


print(greet())` },
      options: ['NameError on the first call', 'HI and HI', 'HI and BYE', 'SyntaxError: helper defined twice'],
      correctOption: 2,
      answer: 'It prints HI then BYE. def is an executable statement that binds a name; greet looks up the global name helper each time it runs, so it sees whichever function helper is bound to at call time.',
      explanation: py`\`def greet\` does not check that \`helper\` exists — names in a body are resolved when that line executes. The second \`def helper\` simply re-binds the global name to a new function object, so the second call to \`greet\` finds the new one. This is also why mocking in tests works by re-binding names (see [mocking](lesson:mocking)).`,
      whyAsked: 'Distinguishes candidates who think of functions like compiled declarations from those who understand Python’s runtime binding model.',
      mistakes: ['Assuming functions must be declared before they are referenced anywhere', 'Thinking the second def is an error or is ignored', 'Assuming greet captured the first helper when it was defined'],
      followUps: ['How is this related to the LEGB rule?', 'How does unittest.mock.patch exploit this?', 'Would a local helper defined inside greet behave differently?'],
      modelAnswer: 'It works and prints HI then BYE. In Python, def is a statement that runs at runtime: it creates a function object and binds a name. The body of greet is compiled but its global names are only looked up when greet actually runs. On the first call, helper is bound to the version returning "hi"; then the second def re-binds the global name helper to a new function, so the next call finds that one. This late binding is what makes monkeypatching and mock.patch work, and also why redefining a name by accident can silently change behaviour.',
    },
    {
      id: 'defining-functions-clamp',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 4,
      question: 'Write `clamp(value, low, high)` that returns value limited to the range low..high: below low gives low, above high gives high, otherwise value itself.',
      answer: 'return max(low, min(value, high)) — or an if / if / return chain.',
      explanation: py`\`min(value, high)\` caps the value at the top; \`max(low, ...)\` lifts it to the bottom. An explicit version with guard clauses is just as good and arguably clearer for beginners. Either way it is a pure function: easy to test on the edges (exactly \`low\`, exactly \`high\`).`,
      starter: { files: { 'main.py': py`def clamp(value, low, high):
    # TODO: return value, but never below low or above high
    return value


print(clamp(150, 0, 100))   # should print 100
` } },
      tests: [
        { name: 'a value inside the range is unchanged', code: py`assert clamp(42, 0, 100) == 42` },
        { name: 'a value below the range becomes low', code: py`assert clamp(-5, 0, 100) == 0` },
        { name: 'a value above the range becomes high', code: py`assert clamp(150, 0, 100) == 100` },
        { name: 'the edges are inclusive', code: py`assert clamp(0, 0, 100) == 0 and clamp(100, 0, 100) == 100` },
      ],
      solution: { files: { 'main.py': py`def clamp(value, low, high):
    """Return value limited to the inclusive range low..high."""
    if value < low:
        return low
    if value > high:
        return high
    return value


print(clamp(150, 0, 100))   # 100
` } },
      hints: ['Handle "too low" first with an early return, then "too high".', 'One-liner alternative: max(low, min(value, high)).'],
      whyAsked: 'A warm-up that checks clean control flow, early returns and edge-case thinking.',
      mistakes: ['Printing the result instead of returning it', 'Getting the edges wrong with < vs <=', 'Swapping min and max in the one-liner'],
      followUps: ['What should happen if low > high?', 'How would you add type hints?', 'Write three assert tests for it.'],
      modelAnswer: 'I would write it with guard clauses: if value is below low return low, if it is above high return high, otherwise return value. That reads exactly like the specification and handles the edges because the comparisons are strict. A compact alternative is max(low, min(value, high)). It is a pure function, so I would test the inside case, both outside cases and both edges, and I would decide explicitly what to do if low is greater than high — probably raise a ValueError.',
    },
    {
      id: 'defining-functions-refactor-script',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'You inherit a 300-line script with no functions: it reads a CSV of orders, filters out refunds, totals revenue per customer and prints a report. How would you restructure it into functions, and why?',
      answer: 'Split it along its natural steps into small single-purpose functions — read_orders(path), remove_refunds(orders), revenue_by_customer(orders), format_report(totals) — that pass data in and return data out, keep all printing/file access in a thin main() at the edge, and call main() under if __name__ == "__main__". Then add tests for the pure middle functions.',
      explanation: py`The middle steps become **pure** (input → output, no I/O), so they can be unit-tested with tiny hand-written lists instead of real files. Only \`read_orders\` and \`main\` touch the outside world. Functions also give names to each step, making the script read like its own outline. Refactor in small steps, checking the output is unchanged after each one.`,
      code: { lang: 'python', code: py`def remove_refunds(orders):
    return [o for o in orders if o["amount"] > 0]


def revenue_by_customer(orders):
    totals = {}
    for o in orders:
        totals[o["customer"]] = totals.get(o["customer"], 0) + o["amount"]
    return totals


def format_report(totals):
    return "\n".join(f"{name}: {amount:.2f}" for name, amount in sorted(totals.items()))


orders = [{"customer": "Ada", "amount": 30.0}, {"customer": "Ada", "amount": -5.0},
          {"customer": "Ben", "amount": 12.5}]
print(format_report(revenue_by_customer(remove_refunds(orders))))` },
      whyAsked: 'Tests practical design sense: decomposition, separation of I/O from logic, and testability.',
      mistakes: ['Making one giant process() function', 'Having every function print or read globals', 'Rewriting everything at once without checking behaviour stays the same'],
      followUps: ['Which of these functions would you unit-test first?', 'Where would error handling for a malformed CSV row go?', 'How do you keep behaviour identical while refactoring?'],
      modelAnswer: 'I would first identify the natural steps — read, filter, aggregate, report — and give each its own function with a verb name. The key design choice is to keep the middle steps pure: they take a list and return a list or dict, with no printing and no file access, so I can test them with tiny in-memory examples. Reading the CSV and printing the report live in a thin main() that wires the steps together, called under the main guard so the module can be imported by tests. I would do it incrementally, comparing the report output after each extraction so behaviour never changes by accident.',
    },
  ],

  takeaways: [
    'def creates a function object and binds a name to it; the body runs only when the function is called with ().',
    'Parameters are the names in the def line; arguments are the values in a call. Calling binds each parameter to its argument object — no copy.',
    'return ends the call immediately and hands a value back. No return (or a bare return) means the call evaluates to None.',
    'Every call gets a fresh frame on the call stack; returning pops it and its local variables disappear. Tracebacks are printouts of that stack.',
    'print is a side effect, return is a result. Compute with functions that return; print at the edges.',
    'Pure functions (no side effects, same input → same output) are the easiest code to test and reuse.',
    'Docstrings document a function for help() and editors; follow PEP 257: a one-line imperative summary first.',
  ],
}
