// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ARCADE = py`MAX_LIVES = 3          # a global constant: reading it anywhere is fine
high_score = 0         # global state: changing it needs a global statement


def play_round(points):
    """Pure: uses only its parameter and returns a result."""
    bonus = 10 if points > 50 else 0      # bonus is local to this call
    return points + bonus


def update_high_score(score):
    global high_score                     # "I mean the module's high_score"
    if score > high_score:
        high_score = score


def make_counter():
    count = 0                             # lives in make_counter's scope

    def tick():
        nonlocal count                    # re-bind the ENCLOSING count
        count += 1
        return count

    return tick


next_round = make_counter()
for points in [40, 75, 20]:
    score = play_round(points)
    update_high_score(score)
    print(f"round {next_round()}: scored {score}")

print("high score:", high_score, "| lives:", MAX_LIVES)
print("is bonus a global?", "bonus" in globals())
`

export default {
  id: 'scope',
  title: 'Scope & the LEGB rule',
  summary: 'Every name lives in a scope — Local, Enclosing, Global or Built-in — and Python decides at compile time which one a name in a function refers to, which is why assigning inside a function makes a name local.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['defining-functions', 'function-arguments'],
  related: ['closures', 'variables-and-names', 'recursion', 'lambdas-and-higher-order', 'modules-and-imports', 'classes-and-objects', 'comprehensions', 'clean-code', 'bytecode'],
  tags: ['scope', 'LEGB', 'local', 'enclosing', 'global', 'built-in', 'builtins', 'global statement', 'nonlocal', 'UnboundLocalError', 'NameError', 'shadowing', 'namespaces', 'globals()', 'locals()'],
  apis: [
    { name: 'global name', summary: 'Inside a function: assignments to name re-bind the module-level (global) name instead of creating a local.' },
    { name: 'nonlocal name', summary: 'Inside a nested function: assignments to name re-bind the name in the nearest enclosing function scope.' },
    { name: 'globals()', summary: 'Returns the current module\'s namespace dictionary (the real one — changes to it are live).' },
    { name: 'locals()', summary: 'Returns a dictionary of the current local names. Inside a function it is a snapshot; writing to it does not change local variables.' },
    { name: 'builtins', summary: 'The module holding built-in names such as len, print and ValueError — the last scope Python searches.' },
    { name: 'UnboundLocalError', summary: 'Raised when a local name is read before it has been assigned in the current call (a subclass of NameError).' },
  ],
  docs: [
    { label: 'Execution model — naming and binding', url: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding' },
    { label: 'Language reference — the global statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-global-statement' },
    { label: 'Language reference — the nonlocal statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-nonlocal-statement' },
    { label: 'Tutorial — Python scopes and namespaces', url: 'https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces' },
    { label: 'Programming FAQ — why am I getting an UnboundLocalError?', url: 'https://docs.python.org/3/faq/programming.html#why-am-i-getting-an-unboundlocalerror-when-the-variable-has-a-value' },
    { label: 'builtins module', url: 'https://docs.python.org/3/library/builtins.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **scope** is the region of a program where a name can be used without any prefix. Each scope has its own **namespace** — a table from names to objects. When you write \`total\`, Python has to decide *which* \`total\` you mean: the one inside this function, one in an outer function, the module-level one, or a built-in.`,
    py`Python's answer is the **LEGB rule**: it searches four scopes, in this order, and uses the first match.`,
    py`1. **L**ocal — names assigned in the current function call (including its parameters);
2. **E**nclosing — locals of any functions this one is nested inside, innermost first;
3. **G**lobal — names assigned at the top level of the module (the \`.py\` file);
4. **B**uilt-in — names Python provides everywhere: \`len\`, \`print\`, \`max\`, \`ValueError\`…`,
    py`That's for *reading* a name. *Assigning* is stricter: an assignment inside a function creates or updates a **local** name, unless you declare otherwise with \`global\` or \`nonlocal\`. This one asymmetry explains \`UnboundLocalError\`, the most confusing error in this part of Python — and it's the foundation for [closures](lesson:closures).`,
  ],
  why: [
    py`**Isolation.** Each function call gets its own local names, so \`total\` inside \`checkout()\` can never clobber a \`total\` somewhere else. You can read and test a function without knowing every name in the program.`,
    py`**Fewer accidental collisions.** Large programs reuse common names (\`i\`, \`data\`, \`result\`) thousands of times. Scope keeps each use separate.`,
    py`**Understanding errors.** \`NameError\`, \`UnboundLocalError\` and "\`'int' object is not callable\`" are all scope stories. Knowing LEGB turns them from mysteries into one-line fixes.`,
    py`**Design.** Global variables that functions quietly change are a classic source of bugs. Knowing *why* scope works the way it does helps you design functions that take inputs and return outputs instead.`,
  ],
  eli15: [
    py`Imagine a school. Every **classroom** has its own whiteboard. If a teacher in Room 12 writes "*homework = page 40*", that only applies in Room 12 — Room 13 can have a completely different "homework".`,
    py`When a student in Room 12 asks "what's the homework?", they look at **their own room's whiteboard** first (local). If it isn't there, they check the board of the **bigger room their class is part of** (enclosing), then the **school noticeboard in the hall** (global), and finally the **rules every school has** (built-in: "lunch is at 12"). If it's nowhere, they get an error.`,
    py`Here's the twist: if Room 12's teacher writes *anything* about homework on their own board — even later in the lesson — then everyone in Room 12 is only allowed to look at Room 12's board for homework. Asking before it's written is an error, even though the hall noticeboard has an answer. That's \`UnboundLocalError\`.`,
    py`To change the **hall noticeboard** from inside a classroom, you have to say so out loud: \`global homework\`. Schools discourage that — it surprises everyone else.`,
  ],
  analogy: {
    title: 'Whiteboards in a school',
    body: [
      py`Every classroom (function call) has a whiteboard (local namespace). Rooms can be inside bigger rooms — a lab inside the science wing (a nested function inside another). The school hall has the noticeboard (module globals), and the national rules apply everywhere (built-ins).`,
      py`Reading looks outward board by board. Writing always goes on your own board unless you explicitly walk out and write on another one.`,
    ],
    mapping: [
      ['your classroom whiteboard', 'the local scope of the current call'],
      ['the wing your room is part of', 'the enclosing function scope'],
      ['the hall noticeboard', 'the module\'s global scope'],
      ['national rules every school follows', 'built-in names (len, print, max)'],
      ['writing on your own board', 'assignment creates a local name'],
      ['"global homework" — walking to the hall to write', 'the global statement'],
      ['"nonlocal homework" — writing on the wing\'s board', 'the nonlocal statement'],
      ['naming your class rule "lunch" and confusing everyone', 'shadowing a built-in name'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'The global frame vs function frames',
    props: {
      code: py`tax_rate = 0.2                  # global name


def price_with_tax(price):
    tax = price * tax_rate      # tax: local · tax_rate: global
    return price + tax


def checkout(prices):
    total = 0                   # checkout's own local total
    for p in prices:
        total += price_with_tax(p)
    return round(total, 2)


total = checkout([10, 5])       # a DIFFERENT total, in the global frame
print(total, len([10, 5]))      # len comes from the built-ins
`,
      notes: {
        1: '`tax_rate` is assigned at module level, so it lives in the **Global frame**.',
        10: '`checkout` has its own **local** `total`. The global frame has no `total` yet.',
        5: '`tax` and `price` are local to *this* call. `tax_rate` is not assigned here, so Python finds it in the Global frame (L → E → G).',
        6: 'When this call returns, its locals (`price`, `tax`) are gone for good.',
        12: 'Each call to `price_with_tax` gets a fresh frame — notice nothing from the previous call survives.',
        16: 'Only now does a global `total` appear — a different name from the local one that lived in `checkout`\'s frame.',
        17: '`len` is never assigned anywhere in the file, so the search goes L → E → G → **B**uilt-in.',
      },
    },
    alt: 'A step-by-step trace. The Global frame holds tax_rate, price_with_tax and checkout. Calling checkout pushes a frame with its own local total and prices. Each call to price_with_tax pushes another frame holding price and tax, which reads tax_rate from the Global frame, and is removed when it returns. After checkout returns, a separate total appears in the Global frame with the value 18.0.',
    caption: py`Two different names called \`total\` exist in this program — one in \`checkout\`'s frame, one in the Global frame — and they never interfere. Functions *read* \`tax_rate\` from the global scope without any declaration.`,
  },
  syntax: [
    py`#### Reading a name: L → E → G → B`,
    { code: py`greeting = "Hello"                 # G: module level


def outer():
    name = "Ada"                   # E (for inner): outer's local

    def inner():
        punctuation = "!"          # L: inner's local
        return greeting + ", " + name + punctuation   # finds each name in a different scope

    return inner()


print(outer())                     # Hello, Ada!
print(len(outer()))                # len: B (built-in) → 11`, lang: 'python', title: 'one expression, four scopes' },
    py`#### Assigning a name makes it local — for the whole function`,
    py`When Python **compiles** a function, it scans the whole body. Any name that is *assigned* anywhere in it (\`=\`, \`+=\`, a \`for\` target, a parameter, \`import\`, \`def\`, \`except … as\`) is local for the **entire** function — even on lines before the assignment.`,
    { code: py`clicks = 0


def record_click():
    clicks += 1          # reads clicks, but clicks is LOCAL here (it's assigned)
    return clicks


record_click()   # UnboundLocalError: cannot access local variable 'clicks'
                 # where it is not associated with a value`, lang: 'python', static: true, title: 'the classic UnboundLocalError' },
    py`\`clicks += 1\` means \`clicks = clicks + 1\`: an assignment, so \`clicks\` is local, and the read on the right happens before the local has a value. The global \`clicks\` is never consulted.`,
    py`#### global — re-bind a module-level name`,
    { code: py`clicks = 0


def record_click():
    global clicks        # assignments below now target the module's clicks
    clicks += 1
    return clicks


record_click()
print(clicks)            # 1`, lang: 'python', title: 'the global statement' },
    py`#### nonlocal — re-bind a name in the enclosing function`,
    { code: py`def make_counter():
    count = 0

    def tick():
        nonlocal count   # count belongs to make_counter, not to tick or the module
        count += 1
        return count

    return tick


counter = make_counter()
print(counter(), counter(), counter())   # 1 2 3`, lang: 'python', title: 'the nonlocal statement' },
    py`\`nonlocal\` only searches enclosing **functions** — never the module. If no enclosing function has that name you get \`SyntaxError: no binding for nonlocal 'count' found\`. This is the engine behind [closures](lesson:closures).`,
    { callout: 'tip', title: 'Reading never needs a declaration', text: py`You only need \`global\` or \`nonlocal\` to **re-bind** a name. Reading an outer name, or *mutating* the object it refers to (\`cart.append(x)\`, \`settings["theme"] = "dark"\`), works without any declaration — no assignment to the name itself is happening.` },
    py`#### What creates a scope (and what doesn't)`,
    py`| creates a new scope | does **not** create a scope |
|---|---|
| a function body (\`def\`, \`lambda\`) | \`if\` / \`elif\` / \`else\` blocks |
| a module (each \`.py\` file) | \`for\` and \`while\` loops |
| a comprehension (\`[x for x in …]\`) | \`with\` and \`try\` blocks |
| a class body (with a twist — see below) | indentation in general |`,
    { code: py`for i in range(3):
    last_seen = i

print(i, last_seen)       # 2 2 — loop variables stay alive after the loop

squares = [k * k for k in range(3)]
# print(k)                # NameError: a comprehension's variable doesn't leak`, lang: 'python', title: 'blocks don\'t make scopes; comprehensions do' },
    py`#### Built-ins and shadowing`,
    py`Built-in names are just the **last** scope searched. Any global or local with the same name *shadows* (hides) the built-in:`,
    { code: py`max = 100                # shadows the built-in max for the whole module
# print(max(3, 7))       # TypeError: 'int' object is not callable
del max                  # remove the global; the built-in is visible again
print(max(3, 7))         # 7

import builtins
print(builtins.max(3, 7))   # the built-in, reachable even when shadowed`, lang: 'python', title: 'shadowing and un-shadowing' },
  ],
  walkthrough: {
    title: 'Reading the arcade scoreboard line by line',
    lang: 'python',
    code: ARCADE,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 2], text: py`Two **global** names. \`MAX_LIVES\` is a constant (by convention, upper case) — reading it from anywhere is harmless. \`high_score\` is mutable *state* that a function will change.` },
      { lines: [5, 8], text: py`\`play_round\` only touches its parameter and its local \`bonus\`. Each call's \`bonus\` disappears when the call returns — line 35 proves it never became a global.` },
      { lines: [11, 14], text: py`\`global high_score\` tells the compiler: "assignments to \`high_score\` in this function mean the module-level name". Without it, line 14 would make \`high_score\` local and line 13 would raise \`UnboundLocalError\`.` },
      { lines: [17, 25], text: py`\`count\` is local to \`make_counter\`, which makes it an **enclosing** name for \`tick\`. \`nonlocal count\` lets \`tick\` re-bind it. \`make_counter\` returns the inner function, which keeps access to \`count\` even after \`make_counter\` has finished — a [closure](lesson:closures).` },
      { lines: [28, 32], text: py`\`next_round\` is the \`tick\` function. Each call increments the same \`count\`. Notice \`score\` and \`points\` are globals here: a \`for\` loop at module level doesn't create a scope.` },
      { lines: [34, 35], text: py`The global \`high_score\` was updated by the function (85). \`"bonus" in globals()\` is \`False\`: local names never leak out of a call.` },
    ],
  },
  playground: {
    title: 'Arcade scoreboard',
    objective: 'See local, enclosing, global and built-in names in one program — then refactor away the global statement.',
    files: { 'main.py': ARCADE },
    expected: py`\`\`\`text
round 1: scored 40
round 2: scored 85
round 3: scored 20
high score: 85 | lives: 3
is bonus a global? False
\`\`\`

Then delete line 12 (\`global high_score\`) and run again to meet \`UnboundLocalError\` in person.`,
    experiments: [
      {
        id: 'no-global',
        task: py`Refactor away the \`global\` statement. Change \`update_high_score\` to take the current best as a second parameter and **return** the new best: \`update_high_score(score, best)\`. Update the loop to \`high_score = update_high_score(score, high_score)\`.`,
        hint: py`Inside: \`if score > best: return score\` then \`return best\` — or simply \`return max(score, best)\`.`,
        tests: [
          { name: 'no global statement is left', code: py`assert "global high_score" not in files["main.py"], 'Remove the global statement'` },
          { name: 'update_high_score returns the larger value', code: py`assert update_high_score(90, 50) == 90 and update_high_score(10, 50) == 50` },
          { name: 'the program still reports 85', code: py`assert "high score: 85" in output` },
        ],
        explain: py`Now the function's inputs and outputs are all visible in its signature: you can test it with plain values, and nothing outside it changes behind your back. The *caller* owns the state and decides what to do with the result — the usual cure for global variables.`,
      },
      {
        id: 'threshold-constant',
        task: py`Replace the magic number \`50\` in \`play_round\` with a new global constant \`BONUS_THRESHOLD = 50\` defined at the top. No \`global\` statement is needed — you're only reading it.`,
        hint: py`Add \`BONUS_THRESHOLD = 50\` next to \`MAX_LIVES\`, then write \`points > BONUS_THRESHOLD\`.`,
        tests: [
          { name: 'BONUS_THRESHOLD is 50', code: py`assert ns.get('BONUS_THRESHOLD') == 50, 'Define BONUS_THRESHOLD = 50 at module level'` },
          { name: 'play_round reads it when it runs', code: py`ns['BONUS_THRESHOLD'] = 30
assert play_round(40) == 50, 'play_round should compare against BONUS_THRESHOLD'` },
        ],
        explain: py`Global names are looked up **when the line runs**, not when the function is defined — the second test changes \`BONUS_THRESHOLD\` after the program ran and \`play_round\` sees the new value. Reading globals is fine; it's *re-binding* them from functions that causes trouble.`,
      },
      {
        id: 'unshadow',
        task: py`Add \`max = 100\` at the top and \`print(max(3, 7))\` at the bottom. Run it and read the error. Then fix the program by renaming the variable to \`max_score\` (keep the \`print(max(3, 7))\` line).`,
        hint: py`The global \`max\` hides the built-in for the whole module, so \`max(3, 7)\` tries to call the int 100.`,
        tests: [
          { name: 'max_score holds 100', code: py`assert ns.get('max_score') == 100, 'Rename the variable to max_score'` },
          { name: 'max is no longer shadowed', code: py`assert 'max' not in ns, 'Do not define a global called max'` },
          { name: 'max(3, 7) prints 7', code: py`assert output.strip().endswith("7")` },
        ],
        explain: py`\`TypeError: 'int' object is not callable\` is the signature of a shadowed built-in: LEGB found your global \`max\` before it ever reached the built-ins. Renaming it lets the lookup fall through to the real \`max\` again.`,
      },
      {
        id: 'count-from',
        task: py`Give \`make_counter\` a parameter \`start=0\` so counting begins after it: \`make_counter(10)\` returns a function whose first call gives \`11\`.`,
        hint: py`Parameters are local names of \`make_counter\` too, so \`tick\` can use \`nonlocal\` on a parameter. Set \`count = start\`, or use \`start\` directly.`,
        tests: [
          { name: 'make_counter(10) starts at 11', code: py`tick = make_counter(10)
assert tick() == 11 and tick() == 12` },
          { name: 'the default still starts at 1', code: py`assert make_counter()() == 1` },
        ],
        explain: py`Parameters live in the function's local scope, so for \`tick\` they are **enclosing** names like any other. Each call to \`make_counter\` creates a new scope, so two counters never share a count.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How Python looks up a name',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'L', label: 'Local', note: 'this call’s names + parameters', x: 90, y: 120, tone: 'yellow' },
        { id: 'E', label: 'Enclosing', note: 'outer functions, innermost first', x: 250, y: 120, tone: 'yellow' },
        { id: 'G', label: 'Global', note: 'module-level names', x: 420, y: 120, tone: 'blue' },
        { id: 'B', label: 'Built-in', note: 'len, print, max, ValueError…', x: 590, y: 120, tone: 'blue' },
        { id: 'err', label: 'NameError', note: 'name not defined', x: 590, y: 250, tone: 'red' },
        { id: 'assign', label: 'name = value', note: 'assignment', x: 90, y: 250, tone: 'kraft' },
      ],
      edges: [
        { from: 'L', to: 'E', label: 'not here' },
        { from: 'E', to: 'G', label: 'not here' },
        { from: 'G', to: 'B', label: 'not here' },
        { from: 'B', to: 'err', label: 'not anywhere' },
        { from: 'assign', to: 'L', label: 'binds here', dashed: true },
      ],
      steps: [
        { focus: ['L'], text: py`Python needs the object for a name you **read**, say \`tax_rate\` inside \`tick()\`. It checks the **local** scope of the current call first.` },
        { focus: ['E'], edges: ['L->E'], text: py`Not local? Then the scopes of any **enclosing functions**, from the innermost outwards. (Only functions count — a class body is skipped.)` },
        { focus: ['G'], edges: ['E->G'], text: py`Next the module's **global** namespace — every name assigned at the top level of the file, including imported modules and other functions.` },
        { focus: ['B'], edges: ['G->B'], text: py`Finally the **built-ins**: \`len\`, \`print\`, \`range\`, \`ValueError\`… They're searched last, which is why your own global \`max\` can hide the built-in one.` },
        { focus: ['err'], edges: ['B->err'], text: py`Found nowhere: \`NameError: name 'tax_rate' is not defined\`.` },
        { focus: ['assign', 'L'], edges: ['assign->L'], text: py`**Assignment is different.** \`name = value\` inside a function always binds in the **local** scope — decided when the function is compiled — unless the function says \`global name\` or \`nonlocal name\`.` },
      ],
    },
    alt: 'Diagram of name lookup as a row of four boxes: Local, Enclosing, Global and Built-in, joined by arrows labelled "not here". After Built-in an arrow leads to NameError. A separate box for assignment points only at Local, showing that assignment binds in the local scope.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every scope's namespace is basically a dictionary of names → objects. You can look at two of them directly:`,
      { code: py`level = 3


def show():
    lives = 2
    print(locals())              # {'lives': 2}
    print("level" in globals())  # True — the module namespace


show()`, lang: 'python', title: 'peeking at namespaces' },
      py`Each **call** creates a fresh local namespace and throws it away on return. That's why a function can't "remember" a local variable between calls — and why, when you *do* want memory, you reach for a return value, an object, or a [closure](lesson:closures).`,
    ],
    technical: [
      py`Scope is decided **statically**, by the compiler, from the text of the function — not by what happens at runtime. For every name in a function body the compiler classifies it as:`,
      py`- **local** — assigned somewhere in the body (or a parameter) and not declared \`global\`/\`nonlocal\`;
- **free** — not assigned here but local in an enclosing function (it will be read through a *cell*, see [closures](lesson:closures));
- **global/built-in** — anything else: looked up in the module's globals, then in \`builtins\`, at the moment the line runs.`,
      py`That static decision is why \`UnboundLocalError\` (a subclass of \`NameError\`) exists: the name *is* local — the compiler already decided — it just hasn't been bound yet in this call. The equivalent error for an enclosing name that isn't bound yet reads \`cannot access free variable 'x' where it is not associated with a value in enclosing scope\`.`,
      { callout: 'note', title: 'CPython detail', text: py`You can see the classification in the bytecode. In CPython 3.14, \`dis.dis\` on \`def f(price): tax = price * rate\` shows \`LOAD_FAST_BORROW (price)\`, \`LOAD_GLOBAL (rate)\` and \`STORE_FAST (tax)\`: locals live in a fixed-size array indexed by position (fast), globals and built-ins are dictionary lookups, and enclosing names use \`LOAD_DEREF\` on a cell. Exact opcode names change between versions; the three-way split doesn't. See [bytecode](lesson:bytecode).` },
      py`Some lesser-known rules, all language guarantees:`,
      py`- **Comprehensions** have their own scope, so their loop variable doesn't leak (CPython 3.12+ inlines them for speed — PEP 709 — but keeps the same visible behaviour).
- **Class bodies** are a namespace but *not* an enclosing scope: methods and comprehension bodies inside the class can't see class-level names directly; use \`self.name\` or \`ClassName.name\`.
- \`except ValueError as err:\` **deletes** \`err\` at the end of the handler, to avoid a reference cycle through the traceback.
- \`locals()\` inside a function returns a snapshot dictionary; writing to it does not change the real local variables (3.13+ formalised this in PEP 667). \`globals()\` returns the real module dictionary.`,
    ],
    production: [
      py`**Global mutable state is a design smell.** A function that reads or writes a global has hidden inputs and outputs: you can't tell from its call what it depends on or changes. Tests start to depend on the order they run in, and code that runs concurrently (threads, async tasks, web requests) can trample shared state. Pass values in, return values out; group related state into an object ([classes](lesson:classes-and-objects)).`,
      py`**Module-level constants are fine** and idiomatic: \`MAX_RETRIES = 3\`, \`DEFAULT_TIMEOUT = 10.0\`, compiled regexes, lookup tables. Treat them as read-only; [typing.Final](lesson:type-hints) can enforce that in a type checker.`,
      py`**Configuration**: load it once (from a file or environment variables) into an object and pass that object to the code that needs it — *dependency injection* in its simplest form ([clean architecture](lesson:clean-architecture)). That's how you can run tests with a different configuration without monkey-patching globals.`,
      py`**Shadowing**: linters catch shadowed built-ins (Ruff's \`A\` rules from flake8-builtins) and names assigned but used before assignment. Run one — see [code-quality tools](lesson:code-quality-tools).`,
      py`**Performance footnote**: local lookups are faster than global and built-in lookups in CPython, which is one reason code inside a function runs a bit faster than the same code at module level. It's rarely worth contorting code for; measure first ([profiling](lesson:profiling)).`,
    ],
  },
  mistakes: [
    {
      title: 'Incrementing a global without declaring it',
      wrong: { code: py`visits = 0


def track_visit():
    visits += 1      # UnboundLocalError


track_visit()`, lang: 'python', static: true },
      right: { code: py`def track_visit(visits):
    return visits + 1


visits = 0
visits = track_visit(visits)
print(visits)        # 1`, lang: 'python' },
      explanation: py`The assignment makes \`visits\` local to the function, so reading it first fails. \`global visits\` would "work", but passing the value in and returning the new value keeps the function honest and testable.`,
    },
    {
      title: 'Expecting a local variable to exist after the call',
      wrong: { code: py`def load_scores():
    scores = [70, 85, 92]


load_scores()
print(scores)    # NameError: name 'scores' is not defined`, lang: 'python', static: true },
      right: { code: py`def load_scores():
    return [70, 85, 92]


scores = load_scores()
print(scores)`, lang: 'python' },
      explanation: py`Local names vanish when the call returns. The only way out of a function (besides side effects) is \`return\`.`,
    },
    {
      title: 'Shadowing a built-in name',
      wrong: { code: py`sum = 0
for price in [3, 4, 5]:
    sum += price
print(sum([1, 2]))   # TypeError: 'int' object is not callable`, lang: 'python', static: true },
      right: { code: py`total = 0
for price in [3, 4, 5]:
    total += price
print(total, sum([1, 2]))   # 12 3`, lang: 'python' },
      explanation: py`A global called \`sum\` is found before the built-in in the LEGB search, everywhere in the module. The error shows up far from the cause. Avoid naming variables \`list\`, \`dict\`, \`str\`, \`sum\`, \`max\`, \`min\`, \`id\`, \`type\`, \`input\`, \`file\`-like built-in names.`,
    },
    {
      title: 'Using global inside a nested function when you meant nonlocal',
      wrong: { code: py`def make_tally():
    tally = 0

    def add(n):
        global tally     # refers to a MODULE-level tally, not make_tally's
        tally += n       # NameError: name 'tally' is not defined
        return tally

    return add`, lang: 'python', static: true },
      right: { code: py`def make_tally():
    tally = 0

    def add(n):
        nonlocal tally
        tally += n
        return tally

    return add


add = make_tally()
print(add(5), add(3))   # 5 8`, lang: 'python' },
      explanation: py`\`global\` jumps straight to the module, skipping enclosing functions. To re-bind a name that belongs to an outer *function*, use \`nonlocal\`.`,
    },
    {
      title: 'Using global as a substitute for return',
      wrong: { code: py`result = None


def compute_average(numbers):
    global result
    result = sum(numbers) / len(numbers)


compute_average([2, 4])
print(result)`, lang: 'python' },
      right: { code: py`def compute_average(numbers):
    return sum(numbers) / len(numbers)


result = compute_average([2, 4])
print(result)`, lang: 'python' },
      explanation: py`Smuggling results out through a global couples the function to one variable name, breaks if two parts of the program use it at once, and hides what the function produces. Return the value.`,
    },
  ],
  debugging: [
    {
      symptom: py`UnboundLocalError: cannot access local variable 'count' where it is not associated with a value`,
      cause: py`\`count\` is assigned somewhere in the function (often \`count += 1\`), so it is local for the whole body — and this line reads it before that assignment ran.`,
      fix: py`Pass the value in as a parameter and return the new one. If it really must be module state, add \`global count\`; if it belongs to an enclosing function, \`nonlocal count\`. Also check you didn't accidentally reuse a global's name for a local.`,
    },
    {
      symptom: py`NameError: name 'scores' is not defined`,
      cause: py`The name isn't in any scope on the LEGB path: a typo, a local from another function, or a variable read before its assignment at module level ran.`,
      fix: py`Return the value from the function that creates it and bind it where you need it. Check spelling (Python suggests close names) and the order statements run in.`,
    },
    {
      symptom: py`TypeError: 'int' object is not callable (or 'list' / 'str' object is not callable)`,
      cause: py`A variable has shadowed a function name — usually a built-in like \`max\`, \`sum\`, \`list\` or \`input\`.`,
      fix: py`Search the module (and the function) for an assignment to that name and rename it. In the REPL, \`del max\` removes the shadowing global.`,
    },
    {
      symptom: py`SyntaxError: no binding for nonlocal 'count' found`,
      cause: py`\`nonlocal count\` was used but no enclosing **function** assigns \`count\` (module-level names don't count).`,
      fix: py`Assign \`count\` in the outer function before defining the inner one, or use \`global\` if you really mean a module-level name.`,
    },
    {
      symptom: py`SyntaxError: name 'x' is used prior to global declaration`,
      cause: py`The \`global x\` statement appears after \`x\` is already used in the same function.`,
      fix: py`Put \`global\` / \`nonlocal\` declarations at the very top of the function body.`,
    },
  ],
  bestPractices: [
    'Pass data into functions as arguments and get results out with return — avoid reading and writing global state.',
    'Keep module-level names to constants (UPPER_CASE), functions, classes and imports.',
    'Reach for nonlocal only for small closures; when state grows, use a class.',
    'Never name variables after built-ins (list, dict, str, sum, max, min, id, type, input).',
    'Put global/nonlocal declarations on the first lines of the function body.',
    'Use a linter to catch shadowed built-ins and names used before assignment.',
    'Put script code inside a main() function so its variables are locals, not module globals.',
  ],
  useCases: [
    'Keeping each function’s working variables private so functions can be read and tested in isolation.',
    'Module-level constants and lookup tables shared by many functions (read-only).',
    'nonlocal counters and accumulators inside small closures.',
    'Diagnosing NameError, UnboundLocalError and "object is not callable" errors.',
  ],
  whenToUse: {
    use: [
      'global: rarely — e.g. a tiny script\'s module-level cache, or a one-off configuration switch set at start-up.',
      'nonlocal: a closure that needs to update a counter, total or "last seen" value from its enclosing function.',
      'Module-level constants that never change after import.',
    ],
    avoid: [
      'global to return values from a function — return them instead.',
      'Mutable global state shared by many functions — use an object or pass the state explicitly.',
      'Long chains of nested functions that all rebind each other\'s names — refactor to a class.',
    ],
  },
  comparison: {
    title: 'global vs nonlocal vs plain assignment',
    headers: ['', 'plain name = value', 'global name', 'nonlocal name'],
    rows: [
      ['which scope is re-bound', 'the current (local) scope', 'the module\'s global scope', 'the nearest enclosing function scope'],
      ['works at module level?', 'yes (it is a global there)', 'allowed but pointless', 'no — SyntaxError'],
      ['name must already exist?', 'no', 'no — it is created if missing', 'yes, in an enclosing function'],
      ['typical use', 'everyday local variables', 'rare: module-level state', 'closures: counters, accumulators'],
    ],
    note: py`None of these are needed to **read** an outer name or to **mutate** the object it refers to — only to re-bind the name itself.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'scope-q1',
      type: 'mcq',
      prompt: 'In which order does Python search scopes when you read a name inside a nested function?',
      options: [
        { text: 'Global, Local, Enclosing, Built-in', why: 'The search starts closest to the code that uses the name — the local scope — and moves outwards.' },
        { text: 'Built-in, Global, Enclosing, Local', why: 'That is exactly backwards; with this order nobody could ever use a local variable called len.' },
        'Local, Enclosing, Global, Built-in',
        { text: 'Local, Global, Enclosing, Built-in', why: 'Enclosing function scopes are checked before the module’s globals.' },
      ],
      answer: 2,
      explanation: py`**LEGB**: the current function's locals, then enclosing functions (innermost first), then the module's globals, then the built-ins. The first match wins.`,
    },
    {
      id: 'scope-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`x = "global"


def outer():
    x = "enclosing"

    def inner():
        return x

    return inner()


print(outer(), x)`,
      answer: 'enclosing global',
      explanation: py`\`inner\` doesn't assign \`x\`, so it looks outward and finds \`outer\`'s \`x\` first. \`outer\`'s assignment created a local — the global \`x\` is untouched.`,
    },
    {
      id: 'scope-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`total = 10


def add(n):
    total = n + 1
    return total


print(add(5), total)`,
      options: [
        { text: '6 6', why: 'The assignment inside add creates a new local total; the global total is never re-bound.' },
        '6 10',
        { text: 'UnboundLocalError', why: 'total is assigned before it is read inside add, so the local has a value when it is returned.' },
        { text: '16 10', why: 'add does not read the global total at all — its local total is n + 1.' },
      ],
      answer: 1,
      explanation: py`Inside \`add\`, \`total\` is local because it is assigned. It's bound to 6 and returned. The global \`total\` is a different name in a different scope and stays 10.`,
    },
    {
      id: 'scope-q4',
      type: 'bug',
      prompt: 'Calling `like()` crashes with UnboundLocalError. Click the line that raises it.',
      code: py`likes = 0


def like():
    print("liked!")
    likes += 1
    return likes


like()`,
      answerLine: 6,
      explanation: py`\`likes += 1\` is an assignment, so \`likes\` is local to \`like\` — and it's read (for the \`+\`) before any local value exists. Fix: return \`likes + 1\` from a function that takes \`likes\` as a parameter, or (less ideal) add \`global likes\` at the top of the function.`,
    },
    {
      id: 'scope-q5',
      type: 'fill',
      prompt: 'Complete the counter so that `tick()` returns 1, then 2, then 3.',
      code: py`def make_counter():
    count = 0

    def tick():
        ___ count
        count += 1
        return count

    return tick`,
      answer: [['nonlocal']],
      explanation: py`\`count\` belongs to \`make_counter\` — an enclosing function — so \`nonlocal\` is the declaration that lets \`tick\` re-bind it. \`global\` would look for a module-level \`count\` instead.`,
    },
    {
      id: 'scope-q6',
      type: 'mcq',
      prompt: 'Which of these create a new scope in Python? (Select all that apply.)',
      options: [
        'A function body (def)',
        { text: 'An if block', why: 'Blocks don’t create scopes in Python. A variable assigned inside an if is visible after it.' },
        { text: 'A for loop body', why: 'The loop variable and anything assigned in the body remain visible after the loop.' },
        'A list comprehension',
        { text: 'A with block', why: 'Names bound by with … as f are still visible after the block (f is closed, but the name exists).' },
      ],
      answer: [0, 3],
      explanation: py`Functions (and lambdas), modules, class bodies and comprehensions get their own scope. \`if\`, \`for\`, \`while\`, \`with\` and \`try\` blocks don't — unlike many C-style languages.`,
    },
    {
      id: 'scope-q7',
      type: 'short',
      prompt: 'Give two concrete reasons why functions that change global variables make programs harder to work with — and what to do instead.',
      answer: py`1) Hidden inputs/outputs: you can't tell from the call what the function depends on or changes, so reading and reviewing code needs knowledge of the whole module. 2) Testing and ordering: tests share the global, so results depend on which test ran first; and concurrent code (threads, async tasks, requests) can overwrite each other's state. Instead: pass values in as arguments, return results, and keep related state in an object that is passed explicitly. Read-only module constants are fine.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'bank-without-globals',
      title: 'A bank account without globals',
      difficulty: 'intermediate',
      prompt: py`\`deposit(amount)\` below crashes with \`UnboundLocalError\` (uncomment the last line to see it). Rewrite both functions as **pure functions** that take the current balance as their **first** parameter and **return** the new balance:

- \`deposit(balance, amount)\` → \`balance + amount\`
- \`withdraw(balance, amount)\` → \`balance - amount\`, but if \`amount\` is more than \`balance\`, return \`balance\` unchanged (no overdrafts).

Don't use \`global\` anywhere. The tests check \`deposit(100, 50) == 150\`, \`withdraw(100, 30) == 70\`, \`withdraw(100, 500) == 100\`, that the program prints \`balance: 120\`, and that the word \`global\` doesn't appear in your file.`,
      files: {
        'main.py': py`balance = 100


def deposit(amount):
    balance = balance + amount
    return balance


def withdraw(amount):
    # TODO
    pass


# print(deposit(50))   # uncomment to see the UnboundLocalError
print("balance:", balance)
`,
      },
      hints: [
        'Why does deposit crash? The assignment makes balance local, so the read on the right-hand side has nothing to read.',
        'Give each function a balance parameter so it never needs the global at all: def deposit(balance, amount):',
        'withdraw: if amount > balance: return balance, then return balance - amount. At the bottom: balance = deposit(balance, 50) then balance = withdraw(balance, 30).',
      ],
      solution: {
        explanation: py`In the starter, \`balance = balance + amount\` makes \`balance\` local to \`deposit\`, so reading it on the right raises \`UnboundLocalError\`. Instead of patching that with \`global\`, the solution makes the balance an explicit input and the new balance an explicit output. Each function is now pure: same inputs, same result, nothing changed behind the caller's back — which is exactly what lets the tests call them with any numbers. The caller (module level) keeps the state and re-binds its own \`balance\` name with each result: 100 + 50 − 30 = 120.`,
        files: {
          'main.py': py`def deposit(balance, amount):
    """Return the balance after depositing amount."""
    return balance + amount


def withdraw(balance, amount):
    """Return the balance after withdrawing amount (no overdrafts)."""
    if amount > balance:
        return balance
    return balance - amount


balance = 100
balance = deposit(balance, 50)
balance = withdraw(balance, 30)
print("balance:", balance)
`,
        },
      },
      tests: [
        { name: 'deposit(100, 50) returns 150', code: py`assert deposit(100, 50) == 150` },
        { name: 'withdraw(100, 30) returns 70', code: py`assert withdraw(100, 30) == 70` },
        { name: 'withdraw refuses an overdraft', code: py`assert withdraw(100, 500) == 100` },
        { name: 'prints "balance: 120"', code: py`assert output.strip() == "balance: 120"` },
        { name: 'no global statements', code: py`assert "global" not in files["main.py"], 'Solve it without the global statement'` },
      ],
    },
    {
      id: 'scoreboard-nonlocal',
      title: 'Running scoreboard',
      difficulty: 'intermediate',
      prompt: py`Complete \`make_scoreboard()\`. It returns a function \`add(points)\` that adds \`points\` to a running total and **returns the new total**. Each scoreboard must keep its own total.

\`\`\`python
board = make_scoreboard()
board(10)   # 10
board(5)    # 15
\`\`\`

The tests check the running totals above, that two scoreboards don't share a total, and that \`global\` isn't used.`,
      files: {
        'main.py': py`def make_scoreboard():
    total = 0

    def add(points):
        # TODO: add points to total and return the new total
        pass

    return add


board = make_scoreboard()
print(board(10))
print(board(5))
`,
      },
      hints: [
        'total belongs to make_scoreboard, an enclosing function. Which declaration lets add re-bind it?',
        'Add nonlocal total as the first line of add.',
        'nonlocal total, then total += points, then return total.',
      ],
      solution: {
        explanation: py`\`total += points\` is an assignment, so without a declaration \`total\` would be local to \`add\` and the first call would raise \`UnboundLocalError\`. \`nonlocal total\` tells Python the name belongs to the enclosing \`make_scoreboard\` scope. Every call to \`make_scoreboard()\` runs its body again, creating a **new** \`total\` — so two boards are independent. (Why does \`total\` survive after \`make_scoreboard\` returns? That's a [closure](lesson:closures) — the next lesson.)`,
        files: {
          'main.py': py`def make_scoreboard():
    total = 0

    def add(points):
        nonlocal total
        total += points
        return total

    return add


board = make_scoreboard()
print(board(10))
print(board(5))
`,
        },
      },
      tests: [
        { name: 'the first add returns 10', code: py`board = make_scoreboard()
assert board(10) == 10` },
        { name: 'totals accumulate', code: py`board = make_scoreboard()
board(10)
assert board(5) == 15` },
        { name: 'two scoreboards are independent', code: py`a = make_scoreboard()
b = make_scoreboard()
a(100)
assert b(1) == 1, 'Each scoreboard needs its own total'` },
        { name: 'no global statement', code: py`assert "global" not in files["main.py"]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'scope-legb',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Explain the LEGB rule.',
      answer: 'When code reads a name, Python searches the Local scope of the current function, then any Enclosing function scopes (innermost first), then the module’s Global scope, then the Built-in scope, and uses the first match; if none has it, NameError. Assignment binds in the local scope unless global or nonlocal says otherwise.',
      explanation: py`Only functions, lambdas, modules, comprehensions and class bodies create scopes — not \`if\`/\`for\` blocks. Class bodies are skipped when nested functions look for enclosing names.`,
      whyAsked: 'Fundamental to reading any Python code, and the base for questions about closures and UnboundLocalError.',
      mistakes: ['Forgetting the Enclosing level', 'Claiming loops or if-blocks create scopes', 'Not mentioning that assignment works differently from lookup'],
      followUps: ['Where does a class body fit into LEGB?', 'What is UnboundLocalError?', 'How do global and nonlocal change the rule?'],
      modelAnswer: 'LEGB is the order Python uses to resolve a name that is read: first the Local scope of the current call, then the scopes of any Enclosing functions from the inside out, then the module’s Global namespace, and finally the Built-ins like len and print. The first match wins, and if nothing matches you get a NameError. Assignment is the asymmetric part: assigning to a name inside a function makes it local for that whole function, unless I declare it global or nonlocal. And only functions, modules, comprehensions and classes create scopes — blocks like if and for do not.',
    },
    {
      id: 'scope-unboundlocal',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Why does this raise UnboundLocalError even though `count` clearly exists as a global?',
      code: { lang: 'python', code: py`count = 0


def bump():
    print("current:", count)
    count = count + 1


bump()` },
      answer: 'Because count is assigned inside bump, the compiler marks it local for the entire function. The print on the first line reads the local count, which has not been bound yet in this call, so Python raises UnboundLocalError instead of falling back to the global.',
      explanation: py`Scope is decided at compile time from the whole function body, not line by line at runtime. That's why the error happens on the *first* line, before the assignment. Fixes: pass \`count\` in and return the new value (best), or declare \`global count\` (only for genuine module state).`,
      whyAsked: 'It shows whether the candidate knows that Python’s scoping is static, not a dynamic "look up whatever exists right now".',
      mistakes: ['Saying Python "doesn’t allow reading globals in functions"', 'Thinking the error comes from the assignment line', 'Reaching for global without discussing the design alternative'],
      followUps: ['How could you see the scope decision in the bytecode? (LOAD_FAST vs LOAD_GLOBAL via dis)', 'What is the nonlocal equivalent of this error?', 'Is UnboundLocalError a subclass of NameError? (yes)'],
      modelAnswer: 'Python decides each name’s scope when it compiles the function, by looking at the whole body. Because count is assigned somewhere in bump, it is local throughout bump — including the print on the line before the assignment. When that print runs, the local count has no value yet, so Python raises UnboundLocalError rather than quietly using the global. The robust fix is to make the dependency explicit: pass count in and return the incremented value. If it truly is module-level state, global count at the top of the function also works, but I treat that as a last resort.',
    },
    {
      id: 'scope-global-vs-nonlocal',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `global` and `nonlocal`, and when would you use each?',
      answer: 'global x makes assignments to x in the function re-bind the module-level name (creating it if needed). nonlocal x makes them re-bind x in the nearest enclosing function scope, which must already define x. Use nonlocal for small closures like counters; avoid global except for rare module-level state.',
      explanation: py`\`global\` skips enclosing functions and goes straight to the module. \`nonlocal\` never reaches the module — at module level or with no enclosing binding it's a \`SyntaxError\`. Neither is needed to read a name or mutate an object; only to re-bind.`,
      code: { lang: 'python', code: py`def make_counter():
    count = 0

    def tick():
        nonlocal count
        count += 1
        return count

    return tick` },
      whyAsked: 'Tests precise understanding of scopes and whether the candidate knows the design costs of global state.',
      mistakes: ['Saying they are interchangeable', 'Thinking you need global to call a module-level function or read a constant', 'Thinking you need nonlocal to append to an outer list'],
      followUps: ['Why don’t you need nonlocal to append to an outer list?', 'What does nonlocal at module level do?', 'What would you use instead of a nonlocal-based closure once the state grows?'],
      modelAnswer: 'Both declarations change where assignments go. global x means assignments in this function re-bind the module-level x, and it is created if it doesn’t exist. nonlocal x means they re-bind x in the nearest enclosing function, and that function must already have x — otherwise it is a SyntaxError, and nonlocal never reaches module level. Neither is needed just to read a name or to mutate an object such as appending to a list. In practice I use nonlocal for small closures like counters, and I avoid global for anything beyond quick scripts because it hides state and makes testing order-dependent.',
    },
    {
      id: 'scope-class-body',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What happens when this class body runs, and why?',
      code: { lang: 'python', code: py`class Config:
    size = 3
    ok = [n * 2 for n in range(size)]
    doubled = [size * 2 for _ in range(2)]` },
      options: ['Both lists are built: ok == [0, 2, 4], doubled == [6, 6]', 'NameError for size in the first comprehension', 'ok is built, then NameError: name \'size\' is not defined in the second', 'SyntaxError'],
      correctOption: 2,
      answer: "ok is built, then the second comprehension raises NameError: name 'size' is not defined. A class body is a namespace but not an enclosing scope for nested scopes; only the outermost iterable of a comprehension (range(size)) is evaluated in the class body itself.",
      explanation: py`Comprehensions have their own scope. Their first iterable is evaluated in the surrounding scope — here the class body, where \`size\` exists — but everything else (the element expression \`size * 2\`) runs in the comprehension's scope, which skips class namespaces when resolving names (just like methods do). This holds even in 3.12+, where CPython inlines comprehensions (PEP 709) but deliberately preserves this behaviour.`,
      whyAsked: 'A deep-knowledge question that separates people who memorised LEGB from those who know how class scopes actually work.',
      mistakes: ['Assuming class attributes are visible like enclosing function variables', 'Assuming PEP 709 inlining changed the semantics'],
      followUps: ['How do methods access class attributes? (self.size or Config.size)', 'Why is the outermost iterable treated differently?', 'How would you rewrite doubled so it works?'],
      modelAnswer: 'The first comprehension works and gives [0, 2, 4], but the second raises NameError for size. A class body has its own namespace, but it is not an enclosing scope for anything nested inside it — methods can’t see class attributes without self or the class name, and neither can comprehension bodies. The only part of a comprehension evaluated in the class body is the outermost iterable, which is why range(size) works but size * 2 in the element expression does not. CPython 3.12 inlined comprehensions for speed, but the visible scoping rules were kept the same.',
    },
    {
      id: 'scope-global-state-refactor',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A service stores `current_user` and `db_connection` in module-level globals that many functions read and assign. Tests pass alone but fail when run together, and a teammate wants to add threads. What is going on, and how would you refactor?',
      answer: 'The functions share hidden mutable state, so one test (or one thread/request) leaks its user or connection into the next. Refactor so state is explicit: pass the user and connection (or a context object) into the functions that need them, create them per request/test, and keep only read-only constants at module level.',
      explanation: py`Globals make each function's real inputs invisible and make the order of operations matter. Tests interfere because they mutate the same module objects; threads or concurrent requests would overwrite each other's \`current_user\` — a security bug, not just a flaky test. Passing dependencies in (dependency injection) makes every function testable with fakes. Where truly per-request ambient data is needed, \`contextvars\` is the standard tool rather than a plain global.`,
      whyAsked: 'Real-world design question: global state is a frequent cause of flaky tests and concurrency bugs.',
      mistakes: ['Fixing only the tests (resetting globals in setUp) and leaving the design', 'Adding a lock around the globals instead of removing the shared state', 'Not noticing the security impact of sharing current_user'],
      followUps: ['What is dependency injection in its simplest form?', 'What is contextvars for?', 'Which module-level names are still fine to keep?'],
      modelAnswer: 'The functions are coupled through hidden mutable globals, so whatever one test sets for current_user or the connection leaks into the next, which is why the outcome depends on test order. With threads it gets worse: two requests could overwrite each other’s current_user, which is a security problem. I would make the dependencies explicit — pass the user and the connection, or a small context object, into the functions that need them, and create them per request or per test. Then tests can pass in fakes, and nothing is shared by accident. Module level would keep only read-only constants, and if I truly needed ambient per-request data I would use contextvars rather than a global.',
    },
    {
      id: 'scope-pure-sales',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Refactor the global-based `record_sale` into pure functions: `record_sale(total, quantity)` returns the new total, and `total_after(sales)` returns the total after recording every quantity in the list, starting from 0. No `global` allowed.',
      answer: 'record_sale returns total + quantity; total_after starts a local total at 0 and loops over sales calling record_sale.',
      explanation: py`Turning hidden state into a parameter and a return value makes the function deterministic: \`total_after([1])\` is 1 every single time, no matter how often it is called. The original version returned a different answer on every call because it kept adding to the same global.`,
      starter: { files: { 'main.py': py`total_sold = 0


def record_sale(quantity):
    global total_sold
    total_sold += quantity
    return total_sold


def total_after(sales):
    for quantity in sales:
        record_sale(quantity)
    return total_sold


print(total_after([2, 3, 4]))
` } },
      tests: [
        { name: 'record_sale(5, 3) returns 8', code: py`assert record_sale(5, 3) == 8` },
        { name: 'total_after([2, 3, 4]) returns 9', code: py`assert total_after([2, 3, 4]) == 9` },
        { name: 'no hidden state between calls', code: py`assert total_after([1]) == 1 and total_after([1]) == 1` },
        { name: 'no global statement', code: py`assert "global" not in files["main.py"]` },
      ],
      solution: { files: { 'main.py': py`def record_sale(total, quantity):
    """Return the new total after selling quantity more items."""
    return total + quantity


def total_after(sales):
    """Return the total after recording every quantity in sales."""
    total = 0
    for quantity in sales:
        total = record_sale(total, quantity)
    return total


print(total_after([2, 3, 4]))
` } },
      hints: ['Make the running total an argument of record_sale and its result the return value.', 'total_after owns a local total starting at 0 and re-binds it each iteration.'],
      whyAsked: 'Checks that the candidate can turn hidden global state into explicit inputs and outputs — the daily work of making code testable.',
      mistakes: ['Keeping the global and just resetting it at the start of total_after', 'Forgetting to re-bind total with the returned value'],
      followUps: ['How would you write total_after in one line? (sum(sales), or functools.reduce)', 'How would you test the old version reliably?'],
      modelAnswer: 'The problem with the original is hidden state: every call adds to the same global, so total_after gives a different answer each time it’s called. I make the total an explicit input and output: record_sale(total, quantity) just returns total plus quantity. total_after keeps a local running total starting at zero and re-binds it with each result. Now both functions are deterministic and trivial to test, and if I wanted to be concise total_after is really just sum(sales).',
    },
  ],

  takeaways: [
    'Names are resolved with LEGB: Local, then Enclosing functions, then Global (module), then Built-in. First match wins; no match is NameError.',
    'Assigning a name anywhere in a function makes it local for the whole function — decided at compile time. Reading it before the assignment is UnboundLocalError.',
    'global re-binds a module-level name; nonlocal re-binds a name in the nearest enclosing function. Neither is needed to read a name or mutate an object.',
    'Only functions, lambdas, modules, comprehensions and class bodies create scopes — if, for, while, with and try blocks do not.',
    'Global mutable state hides inputs and outputs and breaks tests and concurrency. Pass values in, return values out; keep module-level names for constants.',
    'A variable named like a built-in (list, sum, max) shadows it for the whole scope — the symptom is "object is not callable".',
  ],
}
