// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const BILL_SPLITTER = py`# Bill splitter: input -> process -> output

# 1. INPUT: the data the program starts with
bill = 48.00        # the total on the receipt
friends = 3         # how many people are paying
tip_percent = 25    # how generous we are feeling

# 2. PROCESS: precise steps that turn the input into an answer
tip = bill * tip_percent / 100
total = bill + tip
share = total / friends

# 3. OUTPUT: show the result to a human
print("Bill:", bill)
print("Tip:", tip)
print("Each of", friends, "friends pays", share)
`

export default {
  id: 'what-is-programming',
  title: 'What programming is & how Python runs your code',
  summary: 'A program is a precise list of instructions; Python (usually the CPython interpreter) compiles your text to bytecode and then executes it step by step.',
  difficulty: 'beginner',
  minutes: 25,
  prerequisites: [],
  related: ['setup-and-running', 'first-program', 'reading-errors', 'variables-and-names', 'bytecode', 'gil-and-free-threading'],
  tags: ['programming', 'program', 'instructions', 'algorithm', 'input', 'output', 'source code', 'interpreter', 'compiler', 'CPython', 'bytecode', 'virtual machine', 'why python', 'implementations'],
  apis: [
    { name: 'print()', summary: 'Shows values on the screen (writes them to standard output), separated by spaces.' },
    { name: 'input()', summary: 'Waits for the user to type a line of text and returns it as a string.' },
    { name: 'dis.dis()', summary: 'Disassembles code into the bytecode instructions CPython will execute (a CPython detail).' },
    { name: 'sys.implementation', summary: 'Names the Python implementation that is running your code, e.g. cpython.' },
  ],
  docs: [
    { label: 'Python tutorial — Whetting your appetite', url: 'https://docs.python.org/3/tutorial/appetite.html' },
    { label: 'Python tutorial — Using the Python interpreter', url: 'https://docs.python.org/3/tutorial/interpreter.html' },
    { label: 'Glossary — bytecode, interpreted, CPython', url: 'https://docs.python.org/3/glossary.html' },
    { label: 'dis — disassembler for Python bytecode', url: 'https://docs.python.org/3/library/dis.html' },
    { label: 'Language reference — alternate implementations', url: 'https://docs.python.org/3/reference/introduction.html#alternate-implementations' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **program** is a list of instructions that a computer follows, exactly and in order. A **programming language** is a way of writing those instructions so that a human can read them *and* a computer can carry them out. **Python** is one of those languages — famous for looking almost like plain English.`,
    py`Almost every program, from a calculator to a video game, has the same three-part shape:`,
    py`1. **Input** — the data the program starts with: what you typed, a file, a sensor reading, a mouse click.
2. **Process** — the precise steps that transform that data: add it up, sort it, check it, decide something.
3. **Output** — the result: text on the screen, a saved file, a sound, a message sent to a server.`,
    py`In this lesson you'll see that shape in real code, then look under the hood at what actually happens when you press **Run**: Python first *translates* your whole file into simpler instructions called **bytecode**, then a part of Python called the **interpreter** carries them out one at a time. Next up, you'll [install Python and run scripts](lesson:setup-and-running) on your own computer, and then write [your first program](lesson:first-program).`,
  ],
  why: [
    py`Computers are astonishingly fast and completely literal. They never get bored or tired, but they also never *guess* what you meant. Programming is the skill of describing a task so precisely that a machine can't misunderstand it. Once you can do that, you can make a computer do in a second what would take a person a week — rename 10 000 photos, check every row of a spreadsheet, or answer a question from a mountain of data.`,
    py`Why **Python** in particular? A few honest reasons:`,
    py`- **Readable.** Python code uses indentation and plain words (\`if\`, \`for\`, \`not\`, \`in\`), so it's easier to read than most languages. Code is read far more often than it's written.
- **Batteries included.** The *standard library* (code that ships with Python) handles files, dates, maths, JSON, web addresses, testing and much more, without installing anything.
- **A huge ecosystem.** The Python Package Index (PyPI) hosts a vast number of free, community-made packages for web servers, data analysis, machine learning, games and science.
- **Used everywhere.** Web back-ends, data science, AI research, automation scripts, scientific computing, teaching, and the glue between other systems.
- **Runs everywhere.** Windows, macOS, Linux, tiny boards (with MicroPython) — and, as in this course, inside a web browser.`,
    { callout: 'note', title: 'The honest trade-off', text: py`Python is not the fastest language for raw number-crunching written as plain Python loops: each step goes through the interpreter, which adds overhead compared with languages compiled directly to machine code, such as C or Rust. In practice, many programs spend most of their time waiting (for files, networks, people), and heavy number work is usually handed to libraries written in faster languages. You'll learn to measure instead of guess in [profiling](lesson:profiling).` },
  ],
  eli15: [
    py`Imagine a robot chef that has never cooked before. It can chop, stir and fry incredibly fast, but it does **exactly** what the recipe says — nothing more. If the recipe says "add salt" but not how much, it freezes. If step 3 says "put the cake in the oven" but you haven't mixed it yet, you get a bowl of flour in the oven.`,
    py`Writing a program is writing a recipe for that robot. Python is the language the recipe is written in.`,
    py`Before cooking, the robot reads your whole recipe and rewrites it onto small cards in its own shorthand ("GET bill", "MULTIPLY", "STORE tip"). If a sentence makes no grammatical sense, it refuses to start at all. Then it follows the cards one by one, super fast. Those cards are **bytecode**, and the part of the robot that follows them is the **interpreter**.`,
  ],
  analogy: {
    title: 'A recipe and a very literal kitchen robot',
    body: [
      py`A recipe lists ingredients (input), steps (process) and the finished dish (output). A good recipe is precise: "bake for 25 minutes at 180 °C", not "bake until it's nice".`,
      py`Python works the same way, with one twist: the robot first copies your recipe into its own shorthand cards, checking the grammar as it goes, and only then starts cooking. A typo in the grammar is caught before anything happens; a mistake in the *logic* (wrong amount of sugar) only shows up when you taste the result.`,
    ],
    mapping: [
      ['the recipe you write', 'source code: the text in main.py'],
      ['ingredients', 'input: data typed in, read from files, or written into the code'],
      ['cooking steps', 'processing: calculations and decisions'],
      ['the finished dish', 'output: what the program prints or saves'],
      ['shorthand cards the robot writes first', 'bytecode: simple instructions compiled from your code'],
      ['the robot following the cards', 'the interpreter loop executing bytecode'],
      ['"this sentence makes no sense", refusing to start', 'SyntaxError: found while compiling, before anything runs'],
      ['a cake that tastes wrong', 'a logic bug: the program runs but the answer is wrong'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a first program run, one step at a time',
    props: {
      code: py`# Greet a player and work out their age in days
name = input("What's your name? ")
age = 15
days = age * 365
print("Hi", name + "!")
print("You are about", days, "days old.")
`,
      stdin: 'Ada',
      notes: {
        2: '**Input.** `input()` shows the question, waits for a line of text and hands it back. The name `name` is then attached to that text.',
        3: 'A plain value written straight into the code is input too — just not typed by the user.',
        4: '**Process.** Python works out `age * 365` first, gets `5475`, and only then gives it the name `days`.',
        5: '**Output.** `print()` shows its values separated by spaces. `name + "!"` glues two pieces of text together.',
        6: 'Instructions run strictly top to bottom. When this line finishes, there is nothing left, so the program ends.',
      },
    },
    alt: 'A step-by-step trace of a six-line program. The current line is highlighted. After line 2, the variable name holds "Ada" (typed by the user). After line 3, age holds 15. After line 4, days holds 5475. The output panel shows "What\'s your name? ", then "Hi Ada!", then "You are about 5475 days old."',
    caption: py`Press ▶ to step. The **input** here is the name typed in (pre-filled as *Ada*) and the number 15; the **process** is the multiplication; the **output** is the two printed lines. "About" because the program ignores leap years — the computer does exactly what we said, not what we meant.`,
  },
  syntax: [
    py`You'll learn Python's grammar piece by piece. These first rules apply to every program you will ever write:`,
    py`#### A program is a text file of statements`,
    { code: py`# Anything after a hash sign is a comment: Python ignores it.
greeting = "Hello"          # a statement: bind a name to a value
print(greeting, "world")    # a statement: call the print function
print(2 + 3)                # 2 + 3 is an expression: it produces a value (5)`, lang: 'python', title: 'statements, expressions and comments' },
    py`- A **statement** is one complete instruction, usually one per line.
- An **expression** is a piece of code that *produces a value*: \`2 + 3\`, \`"Hi" + "!"\`, \`age * 365\`.
- A **comment** starts with \`#\` and is for humans only. Python skips it.
- A **function** is a named, reusable action. You *call* it by writing its name followed by parentheses: \`print(...)\`, \`input(...)\`. The values inside the parentheses are its **arguments**.`,
    py`#### Order and precision`,
    py`- Statements run **top to bottom**, one at a time. A name must be given a value *before* a line uses it.
- Spelling and capitals matter: \`print\` works, \`Print\` and \`prnt\` don't.
- Text goes inside quotes — \`"like this"\` or \`'like this'\`. Without quotes, Python treats a word as a *name* and looks it up.
- Punctuation matters: brackets must be closed, and the items in a call are separated by commas.
- **Indentation** (spaces at the start of a line) has meaning in Python. For now, start every line at the left edge; you'll indent on purpose when you meet [if statements](lesson:if-statements).`,
    py`#### Language vs interpreter`,
    py`| word | meaning |
|---|---|
| **Python** (the language) | the rules: what valid code looks like and what it must do. Defined by the [Language Reference](https://docs.python.org/3/reference/). |
| **CPython** (the interpreter) | the program, written in C, that reads and runs Python code. It's the one you download from python.org and the one this course runs. |
| **other implementations** | different programs that run the same language: PyPy, MicroPython, GraalPy… |
| **Pyodide** | CPython compiled to WebAssembly so it can run inside a web browser — this course's playground. |`,
    { callout: 'tip', title: 'Saying it precisely', text: py`When people say "Python does X", they usually mean "CPython does X". Most of the time the difference doesn't matter — but when it does (speed, memory, the details in later lessons marked **CPython detail**), saying which one you mean makes you sound like a pro.` },
  ],
  walkthrough: {
    title: 'Reading the bill splitter line by line',
    lang: 'python',
    code: BILL_SPLITTER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1], text: py`A comment describing the whole program. Python ignores it; future-you will thank you for it.` },
      { lines: [4, 6], text: py`**Input.** Three names are given values. \`48.00\` is a number with a decimal point (Python calls it a *float*); \`3\` and \`25\` are whole numbers (*ints*). The comments after \`#\` explain what each one means.` },
      { lines: [9], text: py`**Process.** Python evaluates the right-hand side first — \`48.0 * 25\` is \`1200.0\`, divided by \`100\` is \`12.0\` — and only then attaches the name \`tip\` to the result.` },
      { lines: [10, 11], text: py`Each step builds on the previous one, so the **order matters**: \`total\` needs \`tip\`, and \`share\` needs \`total\`. Swap these two lines and the program crashes, because \`total\` wouldn't exist yet.` },
      { lines: [14, 16], text: py`**Output.** \`print()\` shows each of its arguments separated by a space. Text in quotes is printed as-is; names are replaced by their values. Notice that \`/\` always gives a float, so the share prints as \`20.0\`.` },
    ],
  },
  playground: {
    title: 'Bill splitter',
    objective: 'Run it, find the input, process and output parts, then change the inputs and predict the new answer before you run again.',
    files: { 'main.py': BILL_SPLITTER },
    expected: py`Three lines:

\`\`\`text
Bill: 48.0
Tip: 12.0
Each of 3 friends pays 20.0
\`\`\`

\`48.00\` prints as \`48.0\`: Python shows numbers in their shortest form, not the way you typed them. Open the **Variables** tab to see every name and its final value.`,
    experiments: [
      {
        id: 'four-friends',
        task: py`A fourth friend joins. Change **only one line** so the bill is split four ways. Predict the share before you run it.`,
        hint: py`Line 5 holds the number of people paying.`,
        tests: [
          { name: 'four friends are paying', code: py`assert friends == 4, 'Set friends to 4'` },
          { name: 'each pays 15.0', code: py`assert 'pays 15.0' in output` },
        ],
        explain: py`Every later line uses the *name* \`friends\` rather than the number 3, so changing the input in one place updates the whole calculation. Separating input from processing is what makes programs reusable.`,
      },
      {
        id: 'print-total',
        task: py`Add a new output line between the tip and the share that prints the total, e.g. \`Total: 60.0\`.`,
        hint: py`Copy the pattern of line 15: \`print("Total:", total)\`.`,
        tests: [
          { name: 'prints the total', code: py`assert f"Total: {total}" in output, 'Print the total with print("Total:", total)'` },
          { name: 'total comes before the share', code: py`assert output.index("Total:") < output.index("pays"), 'Put the total line before the share line'` },
        ],
        explain: py`\`total\` already existed — the program just didn't show it. Output is a choice: a program can compute many values and only display the ones a human needs.`,
      },
      {
        id: 'order-matters',
        task: py`Move line 11 (\`share = total / friends\`) **above** line 10 and run. Read the error, then move it back.`,
        hint: py`Look at the last line of the red error message: which name does Python say is missing?`,
        explain: py`You get \`NameError: name 'total' is not defined\`. Python runs top to bottom and doesn't look ahead: when it reaches the \`share\` line, \`total\` hasn't been created yet. Programs are precise *sequences* — order is part of the meaning. You'll learn to read these messages properly in [reading errors](lesson:reading-errors).`,
      },
      {
        id: 'peek-bytecode',
        task: py`Peek under the hood. At the very end add two lines: \`import dis\` and \`dis.dis("share = total / friends")\`. Run it and find the instruction that does the division.`,
        hint: py`\`dis\` is a standard-library module that shows CPython's bytecode. Look for an instruction with \`(/)\` next to it.`,
        tests: [{ name: 'shows the bytecode', code: py`assert 'BINARY_OP' in output and 'LOAD_NAME' in output, 'Call dis.dis("share = total / friends") at the end'` }],
        explain: py`Your one line became a handful of tiny instructions: load the value of \`total\`, load \`friends\`, apply \`/\` (\`BINARY_OP\`), store the result as \`share\`. Those instructions are **bytecode**, and CPython's interpreter loop executes them one by one. The exact instructions are a **CPython detail** and change between versions — never write code that depends on them.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'From main.py to output: how CPython runs your code',
    props: {
      width: 760,
      height: 380,
      nodes: [
        { id: 'src', label: 'main.py', note: 'source code (text)', x: 110, y: 70, tone: 'yellow' },
        { id: 'compiler', label: 'Compiler', note: 'checks grammar, translates', x: 390, y: 70 },
        { id: 'syntaxerror', label: 'SyntaxError', note: 'nothing runs at all', x: 660, y: 70, tone: 'red' },
        { id: 'pyc', label: '.pyc cache', note: 'saved bytecode for imports', x: 110, y: 200, tone: 'paper' },
        { id: 'bytecode', label: 'Bytecode', note: 'tiny instructions', x: 390, y: 200, tone: 'blue' },
        { id: 'vm', label: 'Interpreter loop', note: 'one instruction at a time', x: 660, y: 200, tone: 'ink' },
        { id: 'out', label: 'Output', note: 'screen, files, network', x: 660, y: 320, tone: 'kraft' },
      ],
      edges: [
        { from: 'src', to: 'compiler', label: 'read' },
        { from: 'compiler', to: 'syntaxerror', label: 'grammar mistake', dashed: true },
        { from: 'compiler', to: 'bytecode', label: 'translate' },
        { from: 'bytecode', to: 'pyc', label: 'cache', dashed: true },
        { from: 'bytecode', to: 'vm', label: 'execute' },
        { from: 'vm', to: 'out', label: 'print, write' },
      ],
      steps: [
        { focus: ['src'], text: py`You write **source code**: plain text in a \`.py\` file. To the computer it's just characters until something reads it.` },
        { focus: ['src', 'compiler'], edges: ['src->compiler'], text: py`When you run \`python main.py\`, CPython reads the **whole file** and its compiler splits it into words and symbols (*tokens*), then checks they form valid Python grammar.` },
        { focus: ['syntaxerror'], edges: ['compiler->syntaxerror'], text: py`If the grammar is wrong — an unclosed bracket, a missing comma — CPython stops with a **SyntaxError**. Because this happens *before* running, not even line 1 executes.` },
        { focus: ['bytecode'], edges: ['compiler->bytecode'], text: py`Valid code is translated into **bytecode**: small, simple instructions such as \`LOAD_NAME\`, \`BINARY_OP\` and \`STORE_NAME\`. It's not machine code for your processor — it's code for CPython's own *virtual machine*.` },
        { focus: ['pyc'], edges: ['bytecode->pyc'], text: py`For modules you \`import\`, CPython saves the bytecode in a \`__pycache__\` folder as \`.pyc\` files, so next time it can skip compiling if the source hasn't changed. The script you run directly isn't cached.` },
        { focus: ['vm'], edges: ['bytecode->vm'], text: py`The **interpreter loop** (the virtual machine) executes the bytecode one instruction at a time. This is where your program actually *runs* — and where runtime errors like \`ZeroDivisionError\` happen.` },
        { focus: ['vm', 'out'], edges: ['vm->out'], text: py`Instructions such as calling \`print()\` ask the operating system to show text, save files or talk to the network. That's your **output**.` },
        { focus: ['compiler', 'bytecode', 'vm'], text: py`**CPython detail:** the exact bytecode and the caching are how CPython works, not rules of the Python language. Other implementations (PyPy, MicroPython…) run the same code in different ways. Dig deeper in [bytecode](lesson:bytecode).` },
      ],
    },
    alt: 'A diagram: main.py (source code) goes into the Compiler. A dashed arrow from the Compiler leads to SyntaxError for grammar mistakes, meaning nothing runs. Otherwise the Compiler translates the code into Bytecode. A dashed arrow from Bytecode leads to a .pyc cache, where bytecode for imported modules is saved in __pycache__. Bytecode goes to the Interpreter loop, which executes it one instruction at a time and produces Output.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`People often call Python an "interpreted language", while languages like C are "compiled". The real picture for CPython is a mix of both, in two phases:`,
      py`1. **Compile** — the whole file is checked and translated into bytecode. Grammar mistakes (\`SyntaxError\`, \`IndentationError\`) are found here.
2. **Run** — the interpreter executes the bytecode, top to bottom. Mistakes that only show up with real values (dividing by zero, a name that was never created) are found here, at the moment that line runs.`,
      py`You can see the difference yourself: a file with \`print("start")\` on line 1 and a missing bracket on line 30 prints **nothing**. Fix the bracket but divide by zero on line 30 instead, and it prints \`start\` before crashing.`,
      { code: py`print("start")
result = 10 / 0      # a runtime error: line 1 already ran
print("never reached")`, lang: 'python', title: 'a runtime error happens mid-run' },
    ],
    technical: [
      py`When you run \`python main.py\`, CPython roughly does this:`,
      py`1. **Starts up**: initialises the interpreter, the built-in functions (\`print\`, \`len\`…) and the module search path.
2. **Reads** the file as text (UTF-8 by default for source files).
3. **Tokenizes** it into tokens: names, numbers, strings, operators, indentation.
4. **Parses** the tokens into an *abstract syntax tree* (AST) — a tree that represents the structure of your code. The standard \`ast\` module can show it.
5. **Compiles** the tree into a *code object*: bytecode plus the constants and names it uses.
6. **Executes** the code object in the interpreter loop, inside a fresh module called \`__main__\`.
7. **Shuts down** when the last statement finishes (or an uncaught exception ends the program), flushing output.`,
      { code: py`import ast
import dis

source = "share = total / friends"
print(ast.dump(ast.parse(source).body[0].value))   # the tree for the right-hand side
dis.dis(source)                                     # the bytecode CPython will run`, lang: 'python', title: 'see the tree and the bytecode yourself' },
      { callout: 'note', title: 'CPython detail', text: py`Bytecode, \`.pyc\` files, the \`dis\` output and the interpreter loop are details of **CPython**, and they change between versions (3.11 made the loop "specialise" frequently-run instructions, for example). The *language* only promises what your code does, not how. Other implementations differ: PyPy uses a just-in-time (JIT) compiler that turns hot code into machine code, and MicroPython is a small separate implementation for microcontrollers.` },
    ],
    production: [
      py`In real projects you'll hear these words about running Python:`,
      py`- **Implementations.** Almost all production Python runs on CPython. PyPy is sometimes used for long-running pure-Python workloads; MicroPython/CircuitPython for hardware; Pyodide for Python in the browser.
- **Versions matter.** Each yearly CPython release (3.12, 3.13, 3.14…) adds features and removes old ones. Projects pin a minimum version and test against the versions they support — see [modern Python](lesson:modern-features).
- **Speed work is targeted.** When Python is too slow, professionals [measure first](lesson:profiling), then use better algorithms and data structures, built-in functions (implemented in C), or libraries such as NumPy that do the heavy loops in compiled code.
- **Experimental engines.** CPython 3.13 added an optional, experimental JIT compiler (off by default) and an experimental *free-threaded* build without the global interpreter lock; in 3.14 the free-threaded build became officially supported. See [the GIL and free-threading](lesson:gil-and-free-threading).`,
      py`None of that changes how you write everyday code: write clear, correct Python first. The interpreter is someone else's job.`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting the computer to guess what you meant',
      wrong: { code: py`price = 4
print("Total: " price)`, lang: 'python', static: true },
      right: { code: py`price = 4
print("Total:", price)`, lang: 'python' },
      explanation: py`A human reads "Total: price" fine; Python needs the comma that separates two arguments. The result is \`SyntaxError: invalid syntax. Perhaps you forgot a comma?\` — and because it's a grammar error, *nothing* in the file runs.`,
    },
    {
      title: 'Doing steps in the wrong order',
      wrong: { code: py`bill = 48.0
share = total / 3     # total doesn't exist yet!
total = bill * 1.25`, lang: 'python', static: true },
      right: { code: py`bill = 48.0
total = bill * 1.25
share = total / 3`, lang: 'python' },
      explanation: py`Python runs top to bottom and never looks ahead. Using a name before the line that creates it gives \`NameError: name 'total' is not defined\`.`,
    },
    {
      title: 'Capital letters and typos in names',
      wrong: { code: py`Print("Hello")`, lang: 'python', static: true },
      right: { code: py`print("Hello")`, lang: 'python' },
      explanation: py`Python is case-sensitive: \`Print\` is a different (and undefined) name. CPython helps: \`NameError: name 'Print' is not defined. Did you mean: 'print'?\``,
    },
    {
      title: 'Curly "smart" quotes pasted from a document',
      wrong: { code: py`print(“Hello”)`, lang: 'text' },
      right: { code: py`print("Hello")`, lang: 'python' },
      explanation: py`Word processors and some chat apps turn \`"\` into curly quotes. Python only understands straight quotes, so you get \`SyntaxError: invalid character '“' (U+201C)\`. Write code in a code editor, not a word processor.`,
    },
    {
      title: 'Confusing text with code',
      wrong: { code: py`print("7 + 3")   # prints the characters 7 + 3`, lang: 'python' },
      right: { code: py`print(7 + 3)     # prints 10`, lang: 'python' },
      explanation: py`Anything inside quotes is *text* (a string) and is shown exactly as written. Without quotes, Python evaluates the expression. Both are valid — make sure you get the one you meant.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: invalid syntax. Perhaps you forgot a comma?`,
      cause: py`The code breaks Python's grammar, so it couldn't even be compiled. Nothing ran — not even the lines above the mistake.`,
      fix: py`Go to the line and the \`^\` markers in the message. Check commas between arguments, matching brackets and quotes. Fix the first error first; later ones are often knock-on effects.`,
    },
    {
      symptom: py`NameError: name 'Print' is not defined. Did you mean: 'print'?`,
      cause: py`A misspelled or wrongly capitalised name, or a name used before the line that creates it.`,
      fix: py`Accept the suggestion if it fits, and check the order of your lines.`,
    },
    {
      symptom: py`SyntaxError: invalid character '“' (U+201C)`,
      cause: py`Curly quotes (or another look-alike character) copied from a document, slide or chat app.`,
      fix: py`Retype the quotes in your code editor. Configure your editor to show suspicious characters.`,
    },
    {
      symptom: py`The program runs without errors but prints the wrong answer.`,
      cause: py`A **logic error**: the instructions are valid but don't describe what you wanted (wrong formula, wrong order, wrong value). Python can't detect these — it did exactly what you said.`,
      fix: py`Work out the expected answer by hand, then add \`print()\` calls to see intermediate values, or step through the code with a tracer to find where reality first differs from your expectation.`,
    },
  ],
  bestPractices: [
    'Before coding, say the task as input → process → output in one sentence each.',
    'Keep inputs (the values you might change) at the top of a script, with clear names and comments.',
    'Use a code editor, never a word processor, so quotes and spaces stay exactly as typed.',
    'Run your program often: small steps make mistakes easy to locate.',
    'Say "CPython" when you mean the interpreter and "Python" when you mean the language.',
  ],
  useCases: [
    'Automating boring tasks: renaming files, tidying spreadsheets, sending reports.',
    'Analysing data: averages, charts and patterns from sensor readings or survey results.',
    'Building the back-end of websites and APIs.',
    'Machine learning and AI research, where Python is the usual "control" language over fast libraries.',
    'Gluing systems together: reading from one service and writing to another.',
  ],
  whenToUse: {
    use: [
      'You want readable code that is quick to write and change.',
      'The task is automation, data processing, web back-ends, scripting or prototyping.',
      'A great library already exists for your problem on PyPI or in the standard library.',
    ],
    avoid: [
      'Tight inner loops of pure arithmetic where every microsecond counts — use a compiled language or a C-backed library.',
      'Hard real-time systems that must respond within a guaranteed time.',
      'Front-end code in web pages, where JavaScript is the native language (Python in the browser via Pyodide is possible, but heavier).',
    ],
  },
  comparison: {
    title: 'Two ways to run a program',
    headers: ['', 'Compiled ahead of time (C, Rust, Go)', 'CPython'],
    rows: [
      ['what gets run', 'machine code for your processor, produced before you ship', 'bytecode, produced each time you run (or loaded from .pyc), executed by the interpreter'],
      ['grammar errors found', 'when you build', 'when you start the program, before line 1 runs'],
      ['type errors like "3" + 4 found', 'usually when you build', 'when that line runs (or earlier, if you use a type checker)'],
      ['edit → run cycle', 'edit, build, run', 'edit, run'],
      ['raw speed of plain loops', 'fast', 'slower (interpreter overhead per instruction)'],
      ['what you need to run it', 'nothing extra (the program is self-contained)', 'a Python interpreter'],
    ],
    note: py`"Compiled vs interpreted" describes an *implementation*, not a language: CPython compiles to bytecode, PyPy compiles hot code to machine code, and there are interpreters for C too.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'what-is-programming-q1',
      type: 'mcq',
      prompt: 'Which description of a **program** is the most accurate?',
      options: [
        { text: 'A set of suggestions that the computer interprets sensibly', why: 'Computers never interpret "sensibly" — they follow instructions literally, which is why precision matters.' },
        'A precise sequence of instructions that a computer follows exactly',
        { text: 'Any file stored on a computer', why: 'A photo or a song is a file but not a program. A program contains instructions to execute.' },
        { text: 'The physical parts of a computer', why: 'That is hardware. Programs are software: instructions the hardware runs.' },
      ],
      answer: 1,
      explanation: py`A program is precise and ordered. The computer won't fill gaps or fix mistakes in your reasoning — which is both the challenge and the power of programming.`,
    },
    {
      id: 'what-is-programming-q2',
      type: 'output',
      prompt: 'What does this program print? (Each `print` call produces one line.)',
      code: py`print("7 + 3")
print(7 + 3)`,
      options: [
        { text: '`10`, then `10`', why: 'The first line has quotes, so it is text and is printed exactly as written.' },
        '`7 + 3`, then `10`',
        { text: '`7 + 3`, then `7 + 3`', why: 'The second line has no quotes, so Python evaluates 7 + 3 and prints the result.' },
        { text: 'A SyntaxError', why: 'Both lines are valid Python: one prints a string, the other a number.' },
      ],
      answer: 1,
      explanation: py`Quotes make a **string** (text), shown exactly as typed. Without quotes, \`7 + 3\` is an **expression** that Python evaluates to \`10\`.`,
    },
    {
      id: 'what-is-programming-q3',
      type: 'bug',
      prompt: 'This program crashes. Click the line where the problem is.',
      code: py`price = 4
total = price * quantity
quantity = 3
print("Total:", total)`,
      answerLine: 2,
      explanation: py`Line 2 uses \`quantity\`, but \`quantity\` is only created on line 3. Python runs top to bottom, so line 2 raises \`NameError: name 'quantity' is not defined\`. Swap lines 2 and 3.`,
    },
    {
      id: 'what-is-programming-q4',
      type: 'fill',
      prompt: 'Complete the program so it multiplies the width by the height and shows the area (`20`).',
      code: py`# INPUT
width = 4
height = 5
# PROCESS
area = width ___ height
# OUTPUT
___(area)`,
      answer: [['*'], ['print']],
      explanation: py`Python uses \`*\` for multiplication (\`x\` would be read as a name). \`print()\` sends the value to the output.`,
    },
    {
      id: 'what-is-programming-q5',
      type: 'mcq',
      prompt: 'A 50-line file has `print("start")` on line 1 and an unclosed bracket on line 40. What happens when you run it with CPython?',
      options: [
        { text: '"start" is printed, then a SyntaxError on line 40', why: 'CPython compiles the whole file before running any of it, so line 1 never gets the chance to run.' },
        'Nothing is printed: CPython reports a SyntaxError before running any line',
        { text: 'Python skips line 40 and runs the rest', why: 'Python never skips invalid code. Invalid grammar means the file cannot be compiled at all.' },
        { text: 'It runs lines 1–39, then stops', why: 'That is how a runtime error behaves, not a grammar error.' },
      ],
      answer: 1,
      explanation: py`Grammar is checked while **compiling** the whole file to bytecode, before execution starts. Runtime errors (like dividing by zero) are different: they happen only when their line runs, so earlier lines do execute.`,
    },
    {
      id: 'what-is-programming-q6',
      type: 'mcq',
      prompt: 'What is **CPython**?',
      options: [
        { text: 'A version of Python for C programmers', why: 'CPython is the standard Python for everyone. The "C" refers to the language its interpreter is written in.' },
        { text: 'A Python library for calling C code', why: 'That would be something like ctypes or cffi. CPython is the interpreter itself.' },
        'The standard interpreter for the Python language, written in C — the one from python.org',
        { text: 'An old, discontinued version of Python', why: 'CPython is the current reference implementation; new versions are released every year.' },
      ],
      answer: 2,
      explanation: py`Python is the language (the rules); CPython is the program that runs code written in it. It compiles your source to bytecode and executes that in its interpreter loop.`,
    },
    {
      id: 'what-is-programming-q7',
      type: 'short',
      prompt: 'In your own words: what happens between pressing "Run" on `main.py` and seeing output on the screen?',
      answer: py`CPython reads the whole file and compiles it: it checks the grammar (stopping with a SyntaxError if it's wrong) and translates the code into bytecode — small, simple instructions. Then the interpreter loop executes those instructions one at a time, top to bottom. Instructions like print() ask the operating system to display text, which is the output I see.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'recipe-scaler',
      title: 'Recipe scaler',
      difficulty: 'beginner',
      prompt: py`A cookie recipe is written for **4 people**: 200 g of flour and 100 g of sugar. You're baking for \`people = 10\`.

In the **PROCESS** section, set:

- \`flour\` to the grams of flour needed for \`people\` people (200 g per 4 people);
- \`sugar\` to the grams of sugar needed (100 g per 4 people).

Use the names \`flour_for_4\`, \`sugar_for_4\` and \`people\` — don't type the answers in directly, so the program still works if \`people\` changes. The two \`print\` lines are already written; with 10 people they show \`Flour: 500.0 g\` and \`Sugar: 250.0 g\`.`,
      files: {
        'main.py': py`# INPUT: a recipe for 4 people
flour_for_4 = 200   # grams
sugar_for_4 = 100   # grams
people = 10

# PROCESS: TODO - scale the recipe for \`people\` people
flour = 0
sugar = 0

# OUTPUT
print("Flour:", flour, "g")
print("Sugar:", sugar, "g")
`,
      },
      hints: [
        'First work out how much flour ONE person needs.',
        'One person needs flour_for_4 / 4. Multiply that by people.',
        'flour = flour_for_4 / 4 * people\nsugar = sugar_for_4 / 4 * people',
      ],
      solution: {
        explanation: py`\`flour_for_4 / 4\` is the flour for one person (\`50.0\`), and multiplying by \`people\` scales it up (\`500.0\`). Python works through \`/\` and \`*\` from left to right, so no brackets are needed. Because the process uses names instead of the numbers 500 and 250, changing \`people\` to 2 or 30 still gives the right answer — that's the whole point of separating input from processing. (\`/\` always produces a decimal number, which is why it prints \`500.0\`.)`,
        files: {
          'main.py': py`# INPUT: a recipe for 4 people
flour_for_4 = 200   # grams
sugar_for_4 = 100   # grams
people = 10

# PROCESS: scale the recipe for \`people\` people
flour = flour_for_4 / 4 * people
sugar = sugar_for_4 / 4 * people

# OUTPUT
print("Flour:", flour, "g")
print("Sugar:", sugar, "g")
`,
        },
      },
      tests: [
        { name: 'flour for 10 people is 500 g', code: py`assert flour == 500` },
        { name: 'sugar for 10 people is 250 g', code: py`assert sugar == 250` },
        { name: 'prints both lines', code: py`assert f"Flour: {flour} g" in output and f"Sugar: {sugar} g" in output` },
        {
          name: 'still correct when people changes (no hard-coded answers)',
          code: py`source = files['main.py'].replace('people = 10', 'people = 2')
check = {}
exec(source, check)
assert check['flour'] == 100 and check['sugar'] == 50, 'Use the names flour_for_4, sugar_for_4 and people instead of typing 500 and 250'`,
        },
      ],
    },
    {
      id: 'temperature-converter',
      title: 'Temperature converter',
      difficulty: 'beginner',
      prompt: py`Convert a temperature from Celsius to Fahrenheit. The formula is:

\`\`\`text
fahrenheit = celsius × 9 ÷ 5 + 32
\`\`\`

1. In the PROCESS section, set \`fahrenheit\` using the name \`celsius\` (Python uses \`*\` for × and \`/\` for ÷).
2. Print exactly \`25 °C is 77.0 °F\` using \`print(celsius, "°C is", fahrenheit, "°F")\`.

The tests also check that 100 °C becomes 212 °F, so don't type 77 directly.`,
      files: {
        'main.py': py`# INPUT
celsius = 25

# PROCESS: TODO - convert to Fahrenheit
fahrenheit = 0

# OUTPUT: TODO - print the result
`,
      },
      hints: [
        'Translate the formula symbol by symbol: × becomes *, ÷ becomes /.',
        'Multiplication and division happen before addition, just like in maths, so celsius * 9 / 5 + 32 needs no brackets.',
        'fahrenheit = celsius * 9 / 5 + 32\nprint(celsius, "°C is", fahrenheit, "°F")',
      ],
      solution: {
        explanation: py`Python follows the usual maths order: \`*\` and \`/\` before \`+\`, left to right within the same level. So \`25 * 9\` is \`225\`, \`/ 5\` is \`45.0\`, \`+ 32\` is \`77.0\`. \`print\` puts a space between each argument, giving \`25 °C is 77.0 °F\`. Python strings can hold any character, including the degree sign.`,
        files: {
          'main.py': py`# INPUT
celsius = 25

# PROCESS: convert to Fahrenheit
fahrenheit = celsius * 9 / 5 + 32

# OUTPUT
print(celsius, "°C is", fahrenheit, "°F")
`,
        },
      },
      tests: [
        { name: '25 °C is 77 °F', code: py`assert fahrenheit == 77` },
        { name: 'prints the exact sentence', code: py`assert output.strip() == "25 °C is 77.0 °F"` },
        {
          name: '100 °C becomes 212 °F',
          code: py`check = {}
exec(files['main.py'].replace('celsius = 25', 'celsius = 100'), check)
assert check['fahrenheit'] == 212, 'Compute fahrenheit from the name celsius'`,
        },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'what-is-programming-interpreted-or-compiled',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Is Python an interpreted or a compiled language?',
      answer: 'Neither label fits a language — it describes an implementation. CPython compiles source code to bytecode, then interprets that bytecode in a virtual machine. PyPy additionally compiles hot code to machine code with a JIT.',
      explanation: py`The classic answer "Python is interpreted" is half right. CPython has a compile step (source → AST → bytecode) that catches syntax errors before anything runs, and an execution step where the interpreter loop runs bytecode. What it does *not* do is compile ahead of time to native machine code the way a C compiler does.`,
      code: { lang: 'python', code: py`import dis
dis.dis("total = price * quantity")   # the bytecode CPython will execute` },
      whyAsked: 'It checks whether you understand what happens when code runs, beyond a memorised one-word answer.',
      mistakes: ['Saying "interpreted, line by line" — CPython compiles the whole file first', 'Confusing bytecode with machine code', 'Treating "interpreted" as a property of the language rather than the implementation'],
      followUps: ['What is a .pyc file?', 'When are syntax errors detected compared with runtime errors?', 'What does a JIT compiler do differently?'],
      modelAnswer: 'Strictly, "interpreted" or "compiled" describes an implementation rather than the language. In CPython, which is what most people use, running a file has two phases: first the whole source is compiled — tokenized, parsed into a syntax tree and turned into bytecode — and syntax errors are reported at that point. Then CPython’s interpreter loop executes that bytecode one instruction at a time. So it is compiled to bytecode and then interpreted, never compiled ahead of time to native machine code. Other implementations such as PyPy add a JIT that turns frequently run code into machine code.',
    },
    {
      id: 'what-is-programming-python-vs-cpython',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between "Python" and "CPython"? Name some other implementations and when you might meet them.',
      answer: 'Python is the language specification; CPython is the reference interpreter written in C. Others include PyPy (JIT, for long-running pure-Python code), MicroPython (microcontrollers), GraalPy (on the JVM/GraalVM) and Pyodide (CPython compiled to WebAssembly for browsers).',
      explanation: py`The Language Reference defines what Python code means. CPython implements it and is the de-facto standard: new features appear there first, and most third-party packages target it. Implementation details — reference counting, the small-int cache, \`id()\` being an address, the GIL — belong to CPython, not the language.`,
      whyAsked: 'Distinguishing language guarantees from implementation details is a sign of a careful engineer.',
      mistakes: ['Thinking CPython is a separate language', 'Claiming every implementation behaves identically in performance or memory', 'Mixing up Cython (a compiler for C extensions) with CPython'],
      followUps: ['Why do some packages not work on PyPy?', 'Is the GIL part of the Python language?', 'How does Python run in a browser?'],
      modelAnswer: 'Python is the language — the syntax and semantics described in the Language Reference. CPython is the reference implementation of that language, written in C; it is what you download from python.org and what nearly all production code runs on. There are other implementations: PyPy uses a JIT compiler and can be much faster for long-running pure-Python code, MicroPython runs on microcontrollers, GraalPy runs on GraalVM, and Pyodide is CPython compiled to WebAssembly so it runs in a browser. Knowing the difference matters because things like reference counting or the GIL are CPython details, not language guarantees.',
    },
    {
      id: 'what-is-programming-syntax-vs-runtime',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this program print when run with CPython?',
      code: { lang: 'text', code: py`print("loading...")
total = 10 / 0
print("done"` },
      options: ['loading... then a ZeroDivisionError', 'Nothing — a SyntaxError is reported first', 'loading... then a SyntaxError', 'loading... and done'],
      correctOption: 1,
      answer: 'Nothing is printed. The missing bracket on line 3 is a grammar error, found while compiling the whole file, so execution never starts and the division by zero is never reached.',
      explanation: py`CPython reports \`SyntaxError: '(' was never closed\` (pointing at line 3). Fix that bracket and the output becomes \`loading...\` followed by a \`ZeroDivisionError\` traceback, because runtime errors happen only when their line executes.`,
      whyAsked: 'A quick way to test the compile-then-run mental model.',
      mistakes: ['Assuming Python runs line by line from raw text', 'Expecting the first error in reading order to be reported first'],
      followUps: ['Which errors are found at compile time?', 'How would a type checker change this picture?'],
      modelAnswer: 'It prints nothing. CPython compiles the whole file to bytecode before executing any of it, and the unclosed bracket on the last line is a grammar error, so compilation fails with a SyntaxError and line 1 never runs. If I fixed the bracket, it would print loading... and then crash with ZeroDivisionError on line 2, because runtime errors only happen when that line actually executes.',
    },
    {
      id: 'what-is-programming-pyc-files',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What are the `__pycache__` folders and `.pyc` files that appear in Python projects? Should you commit them to git?',
      answer: 'They are cached bytecode for imported modules, written by CPython so it can skip recompiling unchanged files. They are tied to the interpreter version, regenerated automatically and should be ignored in version control.',
      explanation: py`When a module is imported, CPython compiles it and stores the code object in \`__pycache__/name.cpython-314.pyc\` (the tag includes the version). On the next import it checks the cached file against the source and reuses it if it is still valid. The script you run directly as \`__main__\` is not cached. Deleting the folder is always safe — it just costs a recompile.`,
      whyAsked: 'Shows practical familiarity with how Python projects behave on disk.',
      mistakes: ['Thinking .pyc files make code run faster once loaded (they only skip the compile step)', 'Committing them to the repository', 'Believing .pyc files hide source code securely'],
      followUps: ['How does CPython know a .pyc is out of date?', 'Why is the main script not cached?', 'What is in a .gitignore for Python projects?'],
      modelAnswer: 'They hold compiled bytecode for modules that have been imported. CPython writes them so that the next import can skip parsing and compiling when the source has not changed; the file name includes the interpreter version, like cpython-314, because bytecode changes between versions. They only speed up start-up, not the running code itself. They are generated automatically, so I add __pycache__ to .gitignore and never commit them, and deleting them is always safe.',
    },
    {
      id: 'what-is-programming-split-bill',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 4,
      question: 'Write `split_bill(bill, tip_percent, people)` that returns how much each person pays, including the tip. For example `split_bill(48, 25, 3)` returns `20.0`.',
      answer: 'return bill * (1 + tip_percent / 100) / people',
      explanation: py`Input → process → output in miniature: the function receives the inputs as parameters, does the arithmetic, and returns the result. \`/\` always produces a float, so the result is \`20.0\`. Brackets make the intent explicit: the tip is added before dividing by the number of people.`,
      starter: { files: { 'main.py': py`def split_bill(bill, tip_percent, people):
    # TODO: return each person's share, tip included
    return 0


print(split_bill(48, 25, 3))
` } },
      tests: [
        { name: 'split_bill(48, 25, 3) == 20.0', code: py`assert split_bill(48, 25, 3) == approx(20.0)` },
        { name: 'split_bill(100, 10, 4) == 27.5', code: py`assert split_bill(100, 10, 4) == approx(27.5)` },
        { name: 'no tip', code: py`assert split_bill(90, 0, 3) == approx(30.0)` },
      ],
      solution: { files: { 'main.py': py`def split_bill(bill, tip_percent, people):
    total = bill + bill * tip_percent / 100
    return total / people


print(split_bill(48, 25, 3))
` } },
      hints: ['Compute the tip first: bill * tip_percent / 100.', 'Add the tip to the bill, then divide by people.'],
      whyAsked: 'A warm-up that checks you can turn a word problem into precise steps and get operator precedence right.',
      mistakes: ['Forgetting to divide the percentage by 100', 'Dividing before adding the tip (bill + tip / people)', 'Printing the answer instead of returning it'],
      followUps: ['How would you round the result to cents?', 'What should happen if people is 0?', 'Why might money code use decimal.Decimal instead of float?'],
      modelAnswer: 'I would compute the tip as bill times tip_percent over 100, add it to the bill to get the total, and return the total divided by people. In code that is two short lines, or one expression with brackets so the addition clearly happens before the division. Python’s / always returns a float, so 48 with 25 percent split three ways gives 20.0. In a real money application I would also think about rounding to cents, guarding against zero people, and possibly using Decimal to avoid binary floating-point surprises.',
    },
    {
      id: 'what-is-programming-run-steps',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Walk me through what happens, step by step, when you type `python main.py` and press Enter.',
      answer: 'The OS starts the CPython process; the interpreter initialises built-ins, sys.path and the import system; it reads main.py as text, tokenizes and parses it into an AST, compiles that to a code object (reporting SyntaxErrors here), then executes the bytecode in the eval loop as the __main__ module. Imports compile (or load cached .pyc) and run other modules. At the end it runs cleanup and exits with a status code.',
      explanation: py`Useful details: source files are decoded as UTF-8 by default; \`sys.argv\` holds the command-line arguments; the script's own directory is put at the front of \`sys.path\`, which is why a local file named \`random.py\` can shadow the standard library module; an uncaught exception prints a traceback to stderr and makes the process exit with a non-zero status code (1), which shells and CI systems use to detect failure.`,
      whyAsked: 'Senior interviewers use it to see how deep your mental model goes and whether you can explain clearly at several levels.',
      mistakes: ['Skipping the compile phase entirely', 'Not knowing why a file named like a stdlib module breaks imports', 'Forgetting exit codes and stderr'],
      followUps: ['Why does naming your file random.py break `import random`?', 'Where do .pyc files fit in?', 'What exit code does an uncaught exception produce?'],
      modelAnswer: 'The shell starts the CPython executable as a new process, passing main.py as an argument. CPython initialises itself: built-in functions, the import machinery, and sys.path, with the script’s folder placed first. It then reads the file as UTF-8 text, tokenizes it, parses it into an abstract syntax tree and compiles that to a code object — syntax errors are reported here, before anything runs. Next it executes the bytecode in its evaluation loop as the __main__ module; every import finds a module on sys.path and compiles it or loads a cached .pyc. When the last statement finishes it cleans up and exits with status 0, or prints a traceback to stderr and exits with 1 if an exception escaped.',
    },
    {
      id: 'what-is-programming-is-python-slow',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A colleague says "Python is too slow, we should rewrite the service in another language." How do you respond?',
      answer: 'Measure first. Interpreter overhead matters mainly for CPU-bound loops in pure Python; many services are I/O-bound (waiting on databases and networks). Profile to find the hot spot, then fix the algorithm, use built-ins or C-backed libraries, cache, or move only that hot path to faster code — a full rewrite is rarely the first step.',
      explanation: py`CPython executes bytecode through an interpreter, so tight pure-Python loops are slower than equivalent compiled code. But if most time is spent waiting on I/O, a faster language changes little. The usual playbook: profile ([profiling](lesson:profiling)), improve algorithms and data structures ([performance](lesson:performance)), lean on built-ins and libraries like NumPy, use concurrency for I/O, and only then consider PyPy, Cython, or rewriting a small hot module.`,
      whyAsked: 'Tests engineering judgement: avoiding premature optimisation and knowing where Python’s costs really are.',
      mistakes: ['Agreeing without asking for measurements', 'Quoting made-up speed-up numbers', 'Ignoring that the bottleneck might be the database or network'],
      followUps: ['How would you find the bottleneck?', 'What is the difference between CPU-bound and I/O-bound work?', 'When is a rewrite actually justified?'],
      modelAnswer: 'I would first ask where the time actually goes, because "Python is slow" is only true for some workloads. CPython interprets bytecode, so pure-Python number-crunching loops are slower than compiled code, but a typical web service spends most of its time waiting for databases and networks, which a new language would not fix. So I would profile, then fix the real hot spot — a better algorithm or data structure, built-ins and C-backed libraries, caching, or concurrency for I/O. If a small CPU-heavy piece is still too slow, I would move just that piece to compiled code. A full rewrite is expensive and risky, so it should be a last resort backed by measurements.',
    },
  ],

  takeaways: [
    'A program is a precise, ordered list of instructions; the computer does exactly what you write, not what you meant.',
    'Most programs follow input → process → output — keep those parts clearly separated.',
    'Python is a language; CPython is the standard interpreter that runs it (Pyodide is CPython compiled for browsers).',
    'CPython compiles the whole file to bytecode first (finding SyntaxErrors before anything runs), then executes the bytecode in its interpreter loop.',
    'Runtime errors happen only when their line runs; logic errors produce wrong answers with no error at all.',
    'Bytecode, .pyc files and the interpreter loop are CPython details that change between versions.',
  ],
}
