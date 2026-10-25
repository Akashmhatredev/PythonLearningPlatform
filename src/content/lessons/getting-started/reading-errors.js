// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GRADE_BOOK = py`# Grade book report: this program crashes on purpose!
# Run it, then read the traceback from the bottom up.

def average(scores):
    return sum(scores) / len(scores)

def report(name, scores):
    avg = average(scores)
    print(name, "averages", avg)

def main():
    report("Ada", [90, 85, 77])
    report("Ben", [72, 64])
    report("Cy", [])          # Cy hasn't taken any tests yet

main()
`

const GRADE_BOOK_TRACEBACK = py`Ada averages 84.0
Ben averages 68.0
Traceback (most recent call last):
  File "main.py", line 16, in <module>
    main()
    ~~~~^^
  File "main.py", line 14, in main
    report("Cy", [])          # Cy hasn't taken any tests yet
    ~~~~~~^^^^^^^^^^
  File "main.py", line 8, in report
    avg = average(scores)
  File "main.py", line 5, in average
    return sum(scores) / len(scores)
           ~~~~~~~~~~~~^~~~~~~~~~~~~
ZeroDivisionError: division by zero`

export default {
  id: 'reading-errors',
  title: 'Reading error messages & tracebacks',
  summary: 'Error messages are Python telling you exactly what went wrong and where — learn to read a traceback from the bottom up and recognise the common errors on sight.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['first-program'],
  related: ['try-except', 'raising-exceptions', 'debugging', 'type-conversion', 'defining-functions', 'recursion', 'logging'],
  tags: ['errors', 'error messages', 'traceback', 'exceptions', 'SyntaxError', 'IndentationError', 'TabError', 'NameError', 'TypeError', 'ValueError', 'ZeroDivisionError', 'IndexError', 'KeyError', 'AttributeError', 'call stack', 'did you mean', 'debugging'],
  apis: [
    { name: 'SyntaxError / IndentationError', summary: 'The code breaks Python’s grammar; found while compiling, so nothing runs.' },
    { name: 'NameError', summary: 'A name was used that doesn’t exist (typo, wrong order, missing import).' },
    { name: 'TypeError', summary: 'An operation got a value of the wrong type, e.g. "3" + 4 or len(5).' },
    { name: 'ValueError', summary: 'Right type, unacceptable value, e.g. int("twelve").' },
    { name: 'ZeroDivisionError', summary: 'Division or modulo by zero.' },
    { name: 'IndexError', summary: 'A list or string position that doesn’t exist, e.g. items[3] in a 3-item list.' },
    { name: 'KeyError', summary: 'A dictionary key that isn’t there.' },
    { name: 'AttributeError', summary: 'An object doesn’t have the attribute or method you asked for.' },
  ],
  docs: [
    { label: 'Tutorial — Errors and exceptions', url: 'https://docs.python.org/3/tutorial/errors.html' },
    { label: 'Built-in exceptions (with the hierarchy)', url: 'https://docs.python.org/3/library/exceptions.html' },
    { label: 'What’s New in 3.10 — better error messages', url: 'https://docs.python.org/3/whatsnew/3.10.html#better-error-messages' },
    { label: 'What’s New in 3.11 — fine-grained error locations in tracebacks', url: 'https://docs.python.org/3/whatsnew/3.11.html#whatsnew311-pep657' },
    { label: 'traceback — print or retrieve a stack traceback', url: 'https://docs.python.org/3/library/traceback.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Your programs *will* crash. Everybody's do, every day, at every level of experience. What separates beginners from professionals isn't avoiding errors — it's **reading them**. A Python error message is a precise, free bug report: it tells you *what* went wrong, *where*, and *how the program got there*.`,
    py`There are two big families of errors:`,
    py`- **Syntax errors** — the code isn't valid Python (an unclosed bracket, a missing colon, bad indentation). They're found while Python compiles the file, *before anything runs* (remember [how Python runs your code](lesson:what-is-programming)).
- **Exceptions** (runtime errors) — the code is valid, but something goes wrong *while it runs*: dividing by zero, using a name that doesn't exist, adding text to a number. The program runs normally up to that line, then stops and prints a **traceback**.`,
    py`A **traceback** is the report Python prints when an exception isn't handled: the chain of function calls that led to the problem, ending with the error itself. The golden rule: **read it from the bottom up.**`,
  ],
  why: [
    py`Most beginners see a wall of red text, panic and start changing code at random. Reading the message takes ten seconds and usually tells you the exact line and the exact problem. Python has worked hard on this: since 3.10, its messages point at the precise spot and often suggest the fix — *"Did you mean: 'score'?"*.`,
    py`Error messages are also the foundation for everything that comes later: [handling exceptions with try/except](lesson:try-except), [raising your own](lesson:raising-exceptions), [debugging](lesson:debugging) and [logging](lesson:logging) in production all start with understanding what a traceback says.`,
  ],
  eli15: [
    py`Imagine a chain of people passing along an order. You ask Mum to make dinner, Mum asks your brother to fetch pasta, your brother looks in the cupboard — and there's no pasta. He shouts the problem back up the chain: "No pasta!" — and everyone stops.`,
    py`A **traceback** is the written record of that chain: *you → Mum → brother → cupboard*, with the actual problem ("No pasta!") written at the **very bottom**. That's why you read it from the bottom: the last line says *what* went wrong, the line just above says *exactly where*, and the lines above that show *who asked whom* along the way.`,
    py`A **syntax error** is different: it's like handing over an order written in gibberish. Nobody even starts cooking — they just hand the note back and point at the word that makes no sense.`,
  ],
  analogy: {
    title: 'An accident report for your program',
    body: [
      py`When something goes wrong on a delivery route, the driver writes a report: the list of stops they made in order, and at the end, *what happened* ("parcel addressed to a house that doesn't exist").`,
      py`A traceback is that report. It lists the "stops" (function calls) from the first to the last, then the incident itself on the final line. You read the incident first, then the last stop — that's where it happened — and only then work back through the route to see how you got there.`,
    ],
    mapping: [
      ['the incident at the end of the report', 'the last line: ExceptionType: message'],
      ['the last stop on the route', 'the bottom-most File "…", line N — where it failed'],
      ['earlier stops, in order', 'the frames above: the chain of calls that led there'],
      ['"Traceback (most recent call last)"', 'the newest stop is at the bottom'],
      ['an order written in gibberish, rejected before the trip', 'SyntaxError: nothing runs at all'],
      ['the driver suggesting "did you mean No. 12?"', 'Did you mean: …? suggestions (3.10+)'],
    ],
  },
  visual: {
    type: 'exception-flow',
    title: 'An uncaught exception climbs the call stack',
    props: { preset: 'uncaught' },
    alt: 'Three stacked function calls: main() calls load(), which calls parse(). parse() raises an exception. Because no function has an except handler, the exception climbs from parse() to load() to main() and out of the program, which stops and prints a traceback listing all three calls with the exception on the last line.',
    caption: py`Each function call sits on top of the one that called it — the **call stack**. When \`parse()\` fails, the exception travels *up* through \`load()\` and \`main()\` looking for code that handles it. Nobody does, so the program stops and prints the whole path as a traceback, oldest call at the top, the failure at the bottom. You'll learn to catch exceptions on the way up in [try/except](lesson:try-except).`,
  },
  syntax: [
    py`#### Anatomy of a traceback`,
    { code: GRADE_BOOK_TRACEBACK, lang: 'text', title: 'output of the grade book program below' },
    py`Read it in this order:`,
    py`1. **Last line — what happened.** \`ZeroDivisionError: division by zero\`. The part before the colon is the **exception type**; after it, the **message**.
2. **The frame just above — where.** \`File "main.py", line 5, in average\`, followed by the code on that line. The \`~~~^~~~\` markers (3.11+) underline the exact operation that failed: the \`/\`.
3. **Further up — how you got there.** \`average\` was called by \`report\` (line 8), which was called by \`main\` (line 14), which was called from the top level of the file, \`<module>\` (line 16). The top line, *most recent call last*, reminds you the newest call is at the bottom.
4. **Ask why.** The division is fine; the *data* isn't: \`report("Cy", [])\` passed an empty list, so \`len(scores)\` was 0. The line that *crashes* isn't always the line that's *wrong*.`,
    py`A **function**, briefly: \`def average(scores):\` creates a named, reusable block of code; \`average([90, 85])\` *calls* it, running the block with \`scores\` set to that list. Each call that's in progress gets a **frame** — and the traceback lists those frames. You'll write your own in [defining functions](lesson:defining-functions).`,
    py`#### Syntax errors look different`,
    { code: py`  File "main.py", line 1
    scores = [90, 85, 77
             ^
SyntaxError: '[' was never closed`, lang: 'text', title: 'no "Traceback" header: nothing ran' },
    py`There's no list of calls, because nothing was called — Python couldn't even compile the file. You get the file, the line, a caret \`^\` pointing at the problem and a description. **Check the line above too**: Python reports where it *noticed* the problem, which can be after the real mistake.`,
    py`#### The errors you'll meet most`,
    py`| error | typical cause | real message |
|---|---|---|
| \`SyntaxError\` | unclosed bracket or quote, missing \`:\` or comma | \`SyntaxError: expected ':'\` |
| \`IndentationError\` | missing or inconsistent indentation | \`IndentationError: unexpected indent\` |
| \`NameError\` | typo, using a name before it exists, missing import | \`NameError: name 'scroe' is not defined. Did you mean: 'score'?\` |
| \`TypeError\` | wrong type for an operation | \`TypeError: can only concatenate str (not "int") to str\` |
| \`ValueError\` | right type, bad value | \`ValueError: invalid literal for int() with base 10: 'twelve'\` |
| \`ZeroDivisionError\` | dividing by zero | \`ZeroDivisionError: division by zero\` |
| \`IndexError\` | position past the end of a list/string | \`IndexError: list index out of range\` |
| \`KeyError\` | missing dictionary key | \`KeyError: 'email'\` |
| \`AttributeError\` | misspelled method, or the value is a different type than you think | \`AttributeError: 'list' object has no attribute 'apend'. Did you mean: 'append'?\` |
| \`ModuleNotFoundError\` | misspelled module, or a package that isn't installed | \`ModuleNotFoundError: No module named 'maths'\` |`,
    { callout: 'version', title: 'Error messages keep getting better', text: py`**3.10:** precise syntax errors (\`'(' was never closed\`, \`expected ':'\`, \`Perhaps you forgot a comma?\`, \`Maybe you meant '==' …\`) and *Did you mean* suggestions for \`NameError\` and \`AttributeError\`. **3.11:** the \`~~~^^^\` markers showing exactly which part of a line failed. **3.12:** \`Did you forget to import 'sys'?\` and suggestions for \`from … import\`. **3.13:** colour tracebacks in the terminal, suggestions for misspelled keyword arguments (\`Did you mean 'sep'?\`), and a hint when your file name hides a standard-library module. **3.14:** suggestions for misspelled keywords (\`whille\` → \`Did you mean 'while'?\`) and clearer messages such as \`'elif' block follows an 'else' block\`. Older Pythons print plainer messages for the same mistakes.` },
  ],
  walkthrough: {
    title: 'Reading the grade book crash',
    lang: 'python',
    code: GRADE_BOOK,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor, with the traceback beside you.`,
    steps: [
      { lines: [4, 5], text: py`\`average\` adds up the scores and divides by how many there are. It works for any list *with at least one score*.` },
      { lines: [7, 9], text: py`\`report\` calls \`average\`, then prints a line. When \`average\` fails, \`print\` on line 9 never runs.` },
      { lines: [11, 14], text: py`\`main\` reports three students. Ada and Ben print fine — runtime errors only happen when the bad line actually runs, so their output appears *before* the traceback.` },
      { lines: [14], text: py`The real cause: Cy's list is empty. This line appears in the traceback as the call that started the trouble.` },
      { lines: [5], text: py`The crash site: \`len(scores)\` is \`0\`, and the \`/\` raises \`ZeroDivisionError\`. The traceback's last frame points here, with \`^\` under the \`/\`.` },
      { lines: [16], text: py`The very first frame: the top level of the file (\`<module>\`) calling \`main()\`. Tracebacks always start here and end at the failure.` },
    ],
  },
  playground: {
    title: 'Grade book (crashes on purpose)',
    objective: 'Run it, read the traceback bottom-up, then fix the crash and make the error message clearer for the next person.',
    files: { 'main.py': GRADE_BOOK },
    expectError: true,
    expected: py`Two good lines, then a crash:

\`\`\`text
${GRADE_BOOK_TRACEBACK}
\`\`\`

Bottom-up: **what** — division by zero; **where** — line 5, in \`average\`; **how** — \`<module>\` → \`main\` → \`report\` → \`average\`; **why** — Cy's empty list on line 14.`,
    experiments: [
      {
        id: 'fix-cy',
        task: py`Cy has now taken a test and scored **88**. Update line 14 so the program runs to the end without crashing.`,
        hint: py`Replace the empty list \`[]\` with a list containing one score.`,
        tests: [
          { name: 'the program finishes', code: py`assert 'Cy averages' in output, 'Give Cy a score so average() has something to divide by'` },
          { name: 'Cy averages 88.0', code: py`assert 'Cy averages 88.0' in output` },
        ],
        explain: py`The traceback pointed at line 5, but the *cause* was the data on line 14. Fixing the data fixes the crash. Always ask "why did that line get bad values?" — not just "what's wrong with that line?".`,
      },
      {
        id: 'diagnose',
        task: py`Prove you read the traceback. At the top of the file, add two variables describing the original crash (it's shown in **expected output** above):

- \`error_type\` — the exception's name, as a string;
- \`failing_function\` — the name of the function where it was raised, as a string.

The tests can only run once the program no longer crashes, so do the *fix-cy* experiment first.`,
        hint: py`The last line names the exception. The last \`File …, line …, in ___\` line names the function.`,
        tests: [
          { name: 'error_type is right', code: py`assert ns.get('error_type') == 'ZeroDivisionError', 'error_type should be the exception name from the last line'` },
          { name: 'failing_function is right', code: py`assert ns.get('failing_function') == 'average', 'failing_function should be the function in the bottom-most frame'` },
        ],
        explain: py`The exception's type is on the last line; the function that raised it is named in the bottom-most frame (\`in average\`). That pair — *what* and *where* — is the first thing to read in any traceback.`,
      },
      {
        id: 'did-you-mean',
        task: py`Make a typo on purpose: change \`sum(scores)\` to \`summ(scores)\` and run. Read the last line, then undo the typo.`,
        hint: py`Look at the end of the last line — Python has a suggestion for you.`,
        explain: py`\`NameError: name 'summ' is not defined. Did you mean: 'sum'?\` Python compares the unknown name with the names that exist (your variables and the built-ins) and suggests a close match. Same for attributes: \`"abc".uppper()\` → \`Did you mean: 'upper'?\`. Notice the program still printed nothing for Ada first — the crash happens on Ada's very first call now.`,
      },
      {
        id: 'clearer-error',
        task: py`\`average([])\` fails with a confusing \`ZeroDivisionError\`. Make it fail with a **clear message** instead. Add these lines as the first lines inside \`average\`, indented by 4 spaces:

\`\`\`python
if len(scores) == 0:
    raise ValueError("average() needs at least one score")
\`\`\`

(Keep Cy's score from *fix-cy* so the program still finishes.)`,
        hint: py`\`raise\` creates an exception on purpose. Indent the \`if\` 4 spaces (inside \`average\`) and the \`raise\` 8 spaces (inside the \`if\`).`,
        tests: [
          { name: 'average([]) raises a clear ValueError', code: py`with raises(ValueError, match='at least one score'):
    average([])` },
          { name: 'average still works for real scores', code: py`assert average([90, 80]) == 85` },
        ],
        explain: py`Good error messages are a design decision. \`ValueError: average() needs at least one score\` tells the next programmer what they did wrong, instead of making them reverse-engineer a division by zero. You'll do this properly in [raising exceptions](lesson:raising-exceptions).`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch the call stack grow — and the exception escape',
    props: {
      code: py`def average(scores):
    total = sum(scores)
    return total / len(scores)

def report(name, scores):
    print(name, "averages", average(scores))

report("Ada", [90, 80])
report("Cy", [])
`,
      expectError: true,
      notes: {
        1: '`def` only *creates* the function. Nothing inside it runs yet.',
        8: 'Calling `report` pushes a new **frame** onto the call stack, with its own `name` and `scores`.',
        6: '`report` calls `average`: another frame on top. Two calls are now in progress.',
        3: 'For Ada this works. For Cy, `len(scores)` is 0 and the division raises **ZeroDivisionError**.',
        9: 'Cy’s call. Nothing catches the exception, so it climbs out of `average`, then `report`, then the module — and the program stops.',
      },
    },
    alt: 'A step-by-step trace. Calling report("Ada", [90, 80]) adds a report frame, which adds an average frame; the average 85.0 is returned and printed. Calling report("Cy", []) adds the same two frames, but in average, total / len(scores) divides by zero. The trace ends with a ZeroDivisionError escaping both frames.',
    caption: py`Watch the **frames** stack up on the left: each call in progress is one frame. That stack, written out, is exactly what the traceback shows.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`An **exception** is a Python object that describes a problem. When something goes wrong, Python *raises* one: it stops what it's doing and starts looking for code that will *handle* it. If none does, the program ends, the traceback is printed to the error stream (stderr), and the program finishes with a failure status.`,
      py`Python has a different exception **type** for each kind of problem, so the name alone tells you a lot: \`KeyError\` → a dictionary lookup; \`IndexError\` → a list position; \`TypeError\` → you mixed up kinds of values. The message adds the details: *which* key, *which* types.`,
      py`Three kinds of mistakes, three different symptoms:`,
      py`- **syntax error** → found before running; nothing runs;
- **runtime exception** → the program runs until the bad line, then stops with a traceback;
- **logic error** → no error at all, just a wrong answer. These are the hardest — tests and careful checking catch them.`,
    ],
    technical: [
      py`Each running function call has a **frame** holding its local variables and the line it's on; frames form the **call stack**. When an exception is raised, Python *unwinds* the stack: it leaves the current frame and checks the caller for a matching \`except\` handler, then the caller's caller, and so on. A traceback is the record of the frames the exception passed through.`,
      py`Exception types form a class hierarchy, which is why one handler can catch a whole family:`,
      { code: py`BaseException
 ├── KeyboardInterrupt, SystemExit, ...
 └── Exception
      ├── ArithmeticError
      │    └── ZeroDivisionError
      ├── LookupError
      │    ├── IndexError
      │    └── KeyError
      ├── NameError
      ├── TypeError
      ├── ValueError
      ├── AttributeError
      ├── ImportError
      │    └── ModuleNotFoundError
      └── SyntaxError
           └── IndentationError
                └── TabError`, lang: 'text', title: 'part of the built-in exception hierarchy' },
      py`When one exception happens while another is being handled, you'll see two tracebacks joined by *"During handling of the above exception, another exception occurred:"*. With \`raise NewError(...) from err\` the joining line is *"The above exception was the direct cause of the following exception:"*. In both cases the **original** problem is the first traceback — see [exception chaining](lesson:raising-exceptions).`,
      { callout: 'note', title: 'CPython detail', text: py`The \`~~~^^^\` markers come from position information that CPython 3.11+ stores alongside the bytecode for each instruction (PEP 657). It costs some memory, and can be turned off with \`python -X no_debug_ranges\`. The exact wording of error messages is also CPython's choice and changes between versions — never write code that parses an error *message*; check the exception *type* instead.` },
    ],
    production: [
      py`In real applications, tracebacks are still your best friend — but they go to **logs**, not to users:`,
      py`- **Log the full traceback** when you handle an unexpected exception: \`logger.exception("checkout failed")\` inside an \`except\` block records the message *and* the traceback. See [logging](lesson:logging).
- **Don't show tracebacks to end users.** They reveal file paths, library versions and sometimes data — useful to attackers, useless to customers. Show a friendly message and log the details.
- **Never swallow exceptions silently** (\`except: pass\`): a crash with a traceback is far easier to fix than wrong data with no trace.
- **Error trackers** (services that collect exceptions from running apps) group identical tracebacks, so you see which errors happen most.
- **Add context.** Since 3.11, \`err.add_note("while importing row 17")\` attaches extra lines to a traceback.
- **Library frames:** if the bottom frames are inside a library (e.g. \`json/decoder.py\`), the library is usually fine — scroll up to the **last frame in your own code** and check what you passed in.`,
    ],
  },
  mistakes: [
    {
      title: 'Reading the traceback from the top',
      wrong: { code: py`Traceback (most recent call last):
  File "main.py", line 16, in <module>     <- "the problem is main()?"
    main()`, lang: 'text' },
      right: { code: py`  File "main.py", line 5, in average      <- where it failed
    return sum(scores) / len(scores)
ZeroDivisionError: division by zero       <- start reading here`, lang: 'text' },
      explanation: py`The top frame is just where the chain *started* — almost always your entry point. The bottom of the traceback holds the actual error and the line that raised it.`,
    },
    {
      title: 'Fixing the line that crashed instead of the line that is wrong',
      wrong: { code: py`def average(scores):
    return sum(scores) / (len(scores) or 1)   # hides the problem: [] "averages" 0.0`, lang: 'python' },
      right: { code: py`def average(scores):
    if len(scores) == 0:
        raise ValueError("average() needs at least one score")
    return sum(scores) / len(scores)`, lang: 'python' },
      explanation: py`Silencing the symptom makes the crash disappear but produces a wrong answer (an empty grade book "averages" 0). Find where the bad value came from and decide what *should* happen — sometimes that's a clearer error.`,
    },
    {
      title: 'Only looking at the line Python reports for a syntax error',
      wrong: { code: py`names = [
    "Ada"
    "Ben",
    1
    2,
]`, lang: 'text' },
      right: { code: py`names = [
    "Ada",
    "Ben",
    1,
    2,
]`, lang: 'python' },
      explanation: py`Python reports \`line 4 … Perhaps you forgot a comma?\` — but line 2 is missing a comma too. It's not an error to the parser: \`"Ada" "Ben"\` silently joins into \`"AdaBen"\`! Check the reported line *and* the lines just above it.`,
    },
    {
      title: 'Mixing tabs and spaces',
      wrong: { code: py`if True:
        x = 1     # 8 spaces
	y = 2         # a tab`, lang: 'text' },
      right: { code: py`if True:
    x = 1
    y = 2`, lang: 'python' },
      explanation: py`\`TabError: inconsistent use of tabs and spaces in indentation\`. Configure your editor to insert 4 spaces when you press Tab (PEP 8) and the problem disappears.`,
    },
    {
      title: 'Blaming the library',
      wrong: { code: py`import json
json.loads("{'name': 'Ada'}")   # traceback ends in json/decoder.py — "json is broken"`, lang: 'python', static: true },
      right: { code: py`import json
json.loads('{"name": "Ada"}')   # JSON requires double quotes`, lang: 'python' },
      explanation: py`When the last frames are inside the standard library or a package, the bug is almost always in what *your* code passed in. Scroll up to the last frame that's in your file — here, the \`json.loads(...)\` call with invalid JSON.`,
    },
  ],
  debugging: [
    {
      symptom: py`NameError: name 'scroe' is not defined. Did you mean: 'score'?`,
      cause: py`A misspelled name, a name used before the line that creates it, or a module you forgot to import (\`Did you forget to import 'sys'?\`).`,
      fix: py`Accept the suggestion if it's right; otherwise check the spelling, the order of lines and your imports.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'int' and 'str'`,
      cause: py`An operator got a type it can't work with — very often a number that is still text from \`input()\` or a file.`,
      fix: py`Print \`type(value)\` for each operand, then convert: \`int(text)\`, \`float(text)\` or \`str(number)\`. See [type conversion](lesson:type-conversion).`,
    },
    {
      symptom: py`ValueError: invalid literal for int() with base 10: 'twelve'`,
      cause: py`The type is right (a string) but its contents can't be converted.`,
      fix: py`Validate input before converting, or catch \`ValueError\` and ask again ([try/except](lesson:try-except)).`,
    },
    {
      symptom: py`IndexError: list index out of range`,
      cause: py`Asking for a position that doesn't exist. Positions start at 0, so a 3-item list has positions 0, 1 and 2 — \`items[3]\` is out of range.`,
      fix: py`Print \`len(items)\` and the index. Use \`items[-1]\` for the last item, and loop over items directly instead of by position.`,
    },
    {
      symptom: py`KeyError: 'email'`,
      cause: py`A dictionary lookup with a key that isn't in the dictionary (check spelling and capital letters).`,
      fix: py`Print the dictionary's keys; use \`data.get("email")\` when the key is optional ([dictionaries](lesson:dictionaries)).`,
    },
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute 'upper'`,
      cause: py`The value is \`None\` where you expected a string — usually a function that forgot to \`return\` something.`,
      fix: py`Find where the variable was assigned and check that the function returns a value. See [None & truthiness](lesson:none-and-truthiness).`,
    },
    {
      symptom: py`IndentationError: expected an indented block after 'if' statement on line 1`,
      cause: py`A line ending in \`:\` (\`if\`, \`for\`, \`def\`, …) must be followed by at least one indented line.`,
      fix: py`Indent the block by 4 spaces. If it's intentionally empty for now, write \`pass\`.`,
    },
  ],
  bestPractices: [
    'Read every traceback bottom-up: exception type and message, then the last frame, then the chain of callers.',
    'Find the last frame in your own code — that is usually where to start, even if the crash is inside a library.',
    'Ask "why did this line receive bad data?" before changing the line that crashed.',
    'Fix the first error first; later errors are often knock-on effects.',
    'Copy the exception type and the generic part of the message when searching online — leave out your own names and paths.',
    'Write clear error messages of your own: say what was expected and what was received.',
  ],
  useCases: [
    'Finding the exact line and operation that failed in a crashing script.',
    'Spotting that a value has the wrong type (TypeError) or wrong contents (ValueError).',
    'Tracing a crash through several function calls to the place the bad data came from.',
    'Reading logs from a production service, where tracebacks are recorded instead of shown.',
  ],
  comparison: {
    title: 'Three kinds of mistakes',
    headers: ['', 'Syntax error', 'Runtime exception', 'Logic error'],
    rows: [
      ['when it shows up', 'before anything runs (compiling)', 'when the bad line runs', 'never, by itself'],
      ['what you see', 'File, line, ^ marker, SyntaxError/IndentationError', 'a full traceback with every call', 'a wrong answer'],
      ['earlier output?', 'none at all', 'yes, everything before the crash', 'yes, all of it'],
      ['examples', 'missing :, unclosed (, bad indentation', 'ZeroDivisionError, KeyError, TypeError', 'using + instead of *, an off-by-one count'],
      ['how to find it', 'read the message; check the line above', 'read the traceback bottom-up', 'tests, print(), a debugger'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'reading-errors-q1',
      type: 'mcq',
      prompt: 'You get a long traceback. Where should you **start** reading?',
      options: [
        { text: 'The first line after "Traceback (most recent call last):"', why: 'That is where the chain of calls began — usually just your entry point. The newest call is at the bottom.' },
        'The last line: the exception type and message',
        { text: 'Wherever your own file is mentioned first', why: 'Your file may be mentioned many times. Start with what happened (the last line), then find the last frame in your code.' },
        { text: 'It doesn’t matter, every line says the same thing', why: 'Each line has a different role: the frames show the path; only the last line says what went wrong.' },
      ],
      answer: 1,
      explanation: py`The last line says **what** went wrong. The frame just above it says **where**. Then read upward to see **how** the program got there.`,
    },
    {
      id: 'reading-errors-q2',
      type: 'output',
      prompt: 'What is the **last line** of the traceback this program prints?',
      code: py`prices = {"tea": 2.5, "cake": 3.0}
print(prices["coffee"])`,
      answer: "KeyError: 'coffee'",
      accept: ["KeyError: 'coffee'", 'KeyError: "coffee"', "KeyError 'coffee'"],
      explanation: py`Looking up a dictionary key that doesn't exist raises \`KeyError\`, and the message is the missing key itself (shown with quotes because it's a string). Fix: check the key, or use \`prices.get("coffee")\`.`,
    },
    {
      id: 'reading-errors-q3',
      type: 'bug',
      prompt: 'This program crashes with `IndexError: list index out of range`. Click the line that raises it.',
      code: py`item_prices = [1.5, 2.0, 3.25]
count = len(item_prices)
last = item_prices[count]
print("Last price:", last)`,
      answerLine: 3,
      explanation: py`\`count\` is 3, but positions start at 0, so the valid positions are 0, 1 and 2. \`item_prices[3]\` doesn't exist. Use \`item_prices[count - 1]\`, or simply \`item_prices[-1]\` for the last item.`,
    },
    {
      id: 'reading-errors-q4',
      type: 'fill',
      prompt: 'Name the exception each line raises.',
      code: py`int("twelve")       # raises ___
10 / 0              # raises ___
"total: " + 5       # raises ___`,
      answer: [['ValueError'], ['ZeroDivisionError'], ['TypeError']],
      explanation: py`\`int("twelve")\`: right type (str), unacceptable value → \`ValueError\`. \`10 / 0\` → \`ZeroDivisionError\`. A string plus an int mixes types → \`TypeError: can only concatenate str (not "int") to str\`.`,
    },
    {
      id: 'reading-errors-q5',
      type: 'mcq',
      prompt: 'Which of these errors is reported **before the first line of the program runs**?',
      options: [
        { text: 'ZeroDivisionError', why: 'Division happens at runtime, when the line executes — earlier lines have already run.' },
        { text: 'NameError', why: 'Names are looked up at runtime, when the line runs. A file with an undefined name still runs everything before that line.' },
        'IndentationError',
        { text: 'KeyError', why: 'Dictionary lookups happen at runtime.' },
      ],
      answer: 2,
      explanation: py`\`IndentationError\` is a kind of \`SyntaxError\`: the file can't be compiled, so nothing runs at all. The others are runtime exceptions that happen when their line executes.`,
    },
    {
      id: 'reading-errors-q6',
      type: 'mcq',
      prompt: 'Read this traceback. In which **function** was the exception raised?',
      code: {
        lang: 'text',
        code: py`Traceback (most recent call last):
  File "main.py", line 14, in <module>
    checkout(cart)
  File "main.py", line 9, in checkout
    total += parse_price(item["price"])
  File "main.py", line 4, in parse_price
    return float(text.strip("£"))
ValueError: could not convert string to float: 'free'`,
      },
      options: [
        { text: '<module>', why: '<module> is the top level of the file — where the chain started, not where it failed.' },
        { text: 'checkout', why: 'checkout called the failing function; the frame below it is where the exception was raised.' },
        'parse_price',
        { text: 'float', why: 'float() did the converting, but tracebacks only show frames of Python code; the bottom-most frame is parse_price, on line 4.' },
      ],
      answer: 2,
      explanation: py`The bottom-most frame is \`in parse_price\`, line 4. The cause is the data: one item's price is the text \`'free'\`, which \`float()\` can't convert.`,
    },
    {
      id: 'reading-errors-q7',
      type: 'short',
      prompt: 'Explain the difference between a `SyntaxError` and an exception such as `ValueError`. Why does one of them stop the program before it prints anything?',
      answer: py`A SyntaxError means the code isn't valid Python, so CPython can't compile the file into bytecode — nothing runs, not even earlier lines. A ValueError (like any runtime exception) happens while the program is running, when a specific line gets a bad value; everything before that line has already run, so its output appears before the traceback.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'fix-the-receipt',
      title: 'Fix the receipt helpers',
      difficulty: 'beginner',
      prompt: py`Three small helper functions for a shop receipt each crash with a different error. Fix them so that:

- \`item_label("apple", 3)\` returns \`"3 x apple"\`;
- \`unit_price(6.0, 4)\` returns \`1.5\` (the price of one item);
- \`first_item(["tea", "milk"])\` returns \`"tea"\` — and \`first_item(["apple"])\` returns \`"apple"\`.

Uncomment the demo lines at the bottom one at a time, run, and **read each traceback** before fixing. (List positions start at **0**: \`cart[0]\` is the first item.)`,
      files: {
        'main.py': py`def item_label(name, quantity):
    return quantity + " x " + name


def unit_price(total, quantity):
    return total / quantitty


def first_item(cart):
    return cart[1]


print("Receipt helpers loaded.")
# Uncomment one line at a time to see each error:
# print(item_label("apple", 3))
# print(unit_price(6.0, 4))
# print(first_item(["apple"]))
`,
      },
      hints: [
        'Run each demo line and read the LAST line of its traceback: TypeError, NameError and IndexError point to three different problems.',
        'item_label: you can’t add an int to a str — convert with str(quantity). unit_price: the NameError suggests the right spelling. first_item: the first position is 0.',
        'return str(quantity) + " x " + name\nreturn total / quantity\nreturn cart[0]',
      ],
      solution: {
        explanation: py`Each traceback names the problem precisely:

- \`TypeError: unsupported operand type(s) for +: 'int' and 'str'\` — \`quantity\` is a number, so it must be turned into text before joining: \`str(quantity)\` (or an f-string, \`f"{quantity} x {name}"\`).
- \`NameError: name 'quantitty' is not defined. Did you mean: 'quantity'?\` — a typo; Python even suggests the fix.
- \`IndexError: list index out of range\` — positions start at 0, so \`cart[1]\` is the *second* item and doesn't exist in a one-item list. \`cart[0]\` is the first.`,
        files: {
          'main.py': py`def item_label(name, quantity):
    return str(quantity) + " x " + name


def unit_price(total, quantity):
    return total / quantity


def first_item(cart):
    return cart[0]


print("Receipt helpers loaded.")
print(item_label("apple", 3))
print(unit_price(6.0, 4))
print(first_item(["apple"]))
`,
        },
      },
      tests: [
        { name: 'item_label("apple", 3) == "3 x apple"', code: py`assert item_label("apple", 3) == "3 x apple"` },
        { name: 'unit_price(6.0, 4) == 1.5', code: py`assert unit_price(6.0, 4) == 1.5` },
        { name: 'first_item of a one-item cart', code: py`assert first_item(["apple"]) == "apple"` },
        { name: 'first_item of a two-item cart', code: py`assert first_item(["tea", "milk"]) == "tea"` },
      ],
    },
    {
      id: 'traceback-detective',
      title: 'Traceback detective',
      difficulty: 'beginner',
      prompt: py`A shop's checkout script crashed with this traceback:

\`\`\`text
Checking out...
Traceback (most recent call last):
  File "main.py", line 14, in <module>
    checkout(cart)
    ~~~~~~~~^^^^^^
  File "main.py", line 9, in checkout
    total += parse_price(item["price"])
             ~~~~~~~~~~~^^^^^^^^^^^^^^^
  File "main.py", line 4, in parse_price
    return float(text.strip("£"))
           ~~~~~^^^^^^^^^^^^^^^^^
ValueError: could not convert string to float: 'free'
\`\`\`

Record your reading in five variables:

| variable | value |
|---|---|
| \`exception_type\` | the exception's name, as a string |
| \`bad_value\` | the text that couldn't be converted, as a string |
| \`failing_function\` | the function in which the exception was raised |
| \`failing_line\` | the line number where it was raised (an int) |
| \`caller_line\` | the line number that **called** that function (an int) |`,
      files: {
        'main.py': py`exception_type = None
bad_value = None
failing_function = None
failing_line = None
caller_line = None

print(exception_type, bad_value, failing_function, failing_line, caller_line)
`,
      },
      hints: [
        'Start at the bottom: the last line holds the exception type and, after the colon, the message containing the bad value.',
        'The bottom-most "File …, line N, in NAME" is where it was raised. The frame just above it is the line that made that call.',
        'exception_type = "ValueError", bad_value = "free", failing_function = "parse_price", failing_line = 4, caller_line = 9',
      ],
      solution: {
        explanation: py`Reading bottom-up: the last line says **what** — \`ValueError\`, because the text \`'free'\` isn't a number. The frame above it says **where** — line 4, in \`parse_price\`. The next frame up shows **who called it** — line 9, in \`checkout\`, while looping over the cart. The top frame (line 14) is just where the program started the checkout. The real fix would be in the data or in \`parse_price\` (decide what a "free" price means — perhaps 0.0).`,
        files: {
          'main.py': py`exception_type = "ValueError"
bad_value = "free"
failing_function = "parse_price"
failing_line = 4
caller_line = 9

print(exception_type, bad_value, failing_function, failing_line, caller_line)
`,
        },
      },
      tests: [
        { name: 'exception_type', code: py`assert exception_type == "ValueError"` },
        { name: 'bad_value', code: py`assert bad_value == "free"` },
        { name: 'failing_function', code: py`assert failing_function == "parse_price"` },
        { name: 'failing_line', code: py`assert failing_line == 4` },
        { name: 'caller_line', code: py`assert caller_line == 9` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'reading-errors-how-to-read',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'How do you read a Python traceback?',
      answer: 'Bottom-up. The last line gives the exception type and message (what). The frame above it gives the file, line and function where it was raised (where). The frames above that show the call chain that led there (how). Then find the last frame in your own code and work out why the data was bad.',
      explanation: py`"Most recent call last" means the newest frame is at the bottom. Library frames at the bottom usually mean your code passed something invalid. Since 3.11 the \`~^\` markers show exactly which sub-expression failed.`,
      whyAsked: 'Debugging skill is essential, and this reveals whether a candidate has a systematic approach.',
      mistakes: ['Reading from the top', 'Only looking at the exception type and ignoring the frames', 'Assuming the crashing line is always the buggy line'],
      followUps: ['What do the ~ and ^ markers mean?', 'What does "During handling of the above exception…" mean?', 'How would you get a traceback into a log file?'],
      modelAnswer: 'I read it from the bottom up. The last line tells me the exception type and message, which is what went wrong. The frame right above it gives the file, line and function where it was raised. Then I walk up the frames to see the chain of calls that got there, and I look for the last frame in my own code, because if the failure is inside a library it is usually caused by what I passed in. Finally I ask why the data was bad at that point, since the line that crashes is not always the line that is wrong.',
    },
    {
      id: 'reading-errors-syntax-vs-runtime',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between a syntax error and an exception? How can you tell them apart from the output alone?',
      answer: 'A syntax error is found while compiling, so nothing runs; the output has no "Traceback (most recent call last)" header, just the file, line, a caret and SyntaxError/IndentationError. An exception happens at runtime, after earlier lines have executed, and prints a full traceback of the call stack.',
      explanation: py`SyntaxError and IndentationError are technically exception classes too, but they're raised by the compiler before your module's code starts. One caveat: a syntax error inside a module you *import* is raised at the moment of the \`import\`, so it does appear with a traceback leading to the import line.`,
      whyAsked: 'Shows understanding of compile time vs runtime in Python.',
      mistakes: ['Saying Python has no compile step', 'Not knowing that output before the crash means it was a runtime error'],
      followUps: ['Can a SyntaxError happen at runtime? (yes: imports, eval, exec, compile)', 'Is IndentationError a subclass of SyntaxError?'],
      modelAnswer: 'A syntax error means the source is not valid Python, so CPython fails while compiling it, before any of the module runs. You see the file, the line, a caret and SyntaxError or IndentationError, with no traceback header and no earlier output. An exception happens while the program runs, so everything before the failing line has already executed and printed, and then you get a full traceback of the call stack. One nuance: a syntax error in an imported module surfaces at runtime, at the import, so that one does come with a traceback.',
    },
    {
      id: 'reading-errors-library-frames',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This traceback ends deep inside the standard library. Where is the bug, and what is it?',
      code: { lang: 'text', code: py`Traceback (most recent call last):
  File "main.py", line 2, in <module>
    json.loads("{'a': 1}")
    ~~~~~~~~~~^^^^^^^^^^^^
  File "/lib/python314.zip/json/__init__.py", line 352, in loads
    return _default_decoder.decode(s)
  File "/lib/python314.zip/json/decoder.py", line 345, in decode
    obj, end = self.raw_decode(s, idx=_w(s, 0).end())
  File "/lib/python314.zip/json/decoder.py", line 361, in raw_decode
    obj, end = self.scan_once(s, idx)
json.decoder.JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 2 (char 1)` },
      answer: 'The bug is in main.py line 2 — the last frame in our own code. The string is not valid JSON: JSON requires double-quoted keys and strings, but it uses single quotes. The json module is working correctly.',
      explanation: py`\`JSONDecodeError\` is a subclass of \`ValueError\` with extra fields (\`msg\`, \`lineno\`, \`colno\`, \`pos\`) locating the problem *inside the JSON text*: column 2 is the \`'\`. Library frames are noise here; your last frame is the signal.`,
      whyAsked: 'Real tracebacks are full of library frames; candidates must find the relevant part quickly.',
      mistakes: ['Reporting a bug in the json module', 'Confusing the line number inside the JSON text with the Python line number'],
      followUps: ['What base class does JSONDecodeError have?', 'How would you handle invalid JSON from an API?'],
      modelAnswer: 'The frames at the bottom are inside the json package, but that only shows where the problem was detected. The last frame in our own code is main.py line 2, where we call json.loads with a string that uses single quotes. JSON requires double quotes, so the decoder reports it expected a property name in double quotes at column 2 of the input. The fix is to pass valid JSON — or, if it came from outside, catch JSONDecodeError, which is a ValueError, and report bad input.',
    },
    {
      id: 'reading-errors-did-you-mean',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'In Python 3.14, what is the last line printed by `"abc".uppper()`?',
      code: { lang: 'python', code: py`"abc".uppper()` },
      options: [
        "NameError: name 'uppper' is not defined",
        "AttributeError: 'str' object has no attribute 'uppper'. Did you mean: 'upper'?",
        "SyntaxError: invalid syntax. Did you mean 'upper'?",
        "TypeError: 'str' object is not callable",
      ],
      correctOption: 1,
      answer: "AttributeError: 'str' object has no attribute 'uppper'. Did you mean: 'upper'?",
      explanation: py`Accessing a missing attribute raises \`AttributeError\`, not \`NameError\` (which is for bare names). Since 3.10, CPython compares the bad name against the object's attributes and suggests the closest match.`,
      whyAsked: 'Distinguishes NameError from AttributeError and checks awareness of modern error messages.',
      mistakes: ['Saying NameError', 'Thinking it is a syntax error — the syntax is fine'],
      followUps: ['What would `uppper` alone (without "abc.") raise?', 'How does Python decide which names to suggest?'],
      modelAnswer: 'It raises AttributeError: the str object has no attribute uppper, and since Python 3.10 the message adds "Did you mean: upper?". It is an AttributeError rather than a NameError because the lookup is on an object, with a dot; a bare misspelled name would be a NameError, which also gets suggestions. The syntax is valid, so it fails at runtime when the line executes.',
    },
    {
      id: 'reading-errors-clear-errors',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: '`average(scores)` crashes with a confusing `ZeroDivisionError` for an empty list. Make it raise `ValueError` with a message containing "at least one score" instead, and keep it working for normal lists.',
      answer: 'Check the precondition first: if not scores: raise ValueError("average() needs at least one score"); then return sum(scores) / len(scores).',
      explanation: py`Raising an exception that describes the *caller's* mistake is better design than letting an incidental \`ZeroDivisionError\` escape: the caller learns what to fix, and can catch \`ValueError\` meaningfully. This is the "fail fast with a clear message" principle.`,
      starter: { files: { 'main.py': py`def average(scores):
    return sum(scores) / len(scores)


print(average([90, 80, 70]))
` } },
      tests: [
        { name: 'average([90, 80, 70]) == 80', code: py`assert average([90, 80, 70]) == 80` },
        { name: 'empty list raises ValueError', code: py`with raises(ValueError, match="at least one score"):
    average([])` },
        { name: 'single score works', code: py`assert average([42]) == 42` },
      ],
      solution: { files: { 'main.py': py`def average(scores):
    if not scores:
        raise ValueError("average() needs at least one score")
    return sum(scores) / len(scores)


print(average([90, 80, 70]))
` } },
      hints: ['Check for the empty list before dividing.', 'raise ValueError("…") stops the function with your own exception.'],
      whyAsked: 'Shows whether you design error behaviour deliberately instead of letting accidental exceptions leak.',
      mistakes: ['Returning 0 for an empty list, silently producing a wrong average', 'Catching ZeroDivisionError and printing instead of raising', 'Raising a bare Exception'],
      followUps: ['When would returning None or 0.0 be acceptable instead?', 'Should average validate that the items are numbers?', 'How would a caller handle this ValueError?'],
      modelAnswer: 'I would check the precondition at the top: if the list is empty, raise ValueError with a message like "average() needs at least one score", and otherwise return the sum divided by the length. That turns an accidental ZeroDivisionError, which describes an implementation detail, into an error that describes the caller’s mistake, so the traceback’s last line tells them exactly what to fix. I would avoid silently returning 0, because a fake average is worse than a clear failure — unless the requirements explicitly define a default.',
    },
    {
      id: 'reading-errors-chained',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Some tracebacks contain two parts joined by "During handling of the above exception, another exception occurred:" or "The above exception was the direct cause of the following exception:". What do these mean, and which part shows the root cause?',
      answer: 'Both are exception chaining. "During handling…" is implicit chaining: a new exception was raised inside an except/finally block, and the original is kept in __context__. "The above exception was the direct cause…" is explicit chaining with raise New(...) from original, stored in __cause__. The first (upper) traceback is the original problem.',
      explanation: py`Chaining preserves debugging information when one error leads to another. Explicit \`raise … from err\` says "this is a translation of that error" (e.g. a low-level \`KeyError\` turned into a domain \`ConfigError\`). \`raise … from None\` suppresses the context when it would only be noise. Implicit chaining often signals a bug *in the handler itself*.`,
      code: { lang: 'python', code: py`def load_port(config):
    try:
        return int(config["port"])
    except KeyError as err:
        raise RuntimeError("config is missing 'port'") from err` },
      whyAsked: 'Senior candidates must read complex production tracebacks and design error translation well.',
      mistakes: ['Reading only the last traceback and missing the root cause', 'Not knowing raise … from', 'Using from None everywhere and losing information'],
      followUps: ['What is the difference between __cause__ and __context__?', 'When would you use raise … from None?', 'How do exception notes (add_note, 3.11+) compare?'],
      modelAnswer: 'Both messages mean exception chaining. "During handling of the above exception, another exception occurred" is implicit: a second exception was raised while an except or finally block was handling the first, and Python stores the first in __context__. "The above exception was the direct cause" is explicit: someone wrote raise NewError from original, which sets __cause__ and documents that the new error is a translation of the old one. In both cases the first traceback printed is the original problem, so I read that to find the root cause and the last one to see what the program ultimately reported. Implicit chains often reveal a bug inside an error handler.',
    },
    {
      id: 'reading-errors-production-logging',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A production web service only logs `Error: \'user_id\'` when requests fail, and users see a raw traceback page. What is wrong with this setup and how would you fix it?',
      answer: 'The log has lost both the exception type (it is a KeyError) and the traceback, so the failure cannot be located, while users are shown internals that may leak paths and data. Log with logger.exception (or exc_info=True) plus request context, return a generic error response to users, and send exceptions to an error tracker.',
      explanation: py`\`str(KeyError('user_id'))\` is just \`'user_id'\` — formatting an exception as a string drops its type and traceback. \`logger.exception("…")\` inside \`except\` records both. Showing tracebacks to users is an information-disclosure risk (file paths, library versions, sometimes secrets in variables) — frameworks have a debug mode that must be off in production.`,
      code: { lang: 'python', code: py`import logging

logger = logging.getLogger("checkout")

def handle_request(request):
    try:
        return process(request)
    except Exception:
        logger.exception("checkout failed for request %s", request.id)
        return {"error": "Something went wrong. Please try again."}, 500` },
      whyAsked: 'Production debugging depends on preserving tracebacks; security depends on not exposing them.',
      mistakes: ['Logging str(err) only', 'Swallowing the exception and returning success', 'Leaving framework debug mode on in production'],
      followUps: ['What extra context would you log with each error?', 'How do you avoid logging sensitive data?', 'When should an exception crash the process instead of being handled?'],
      modelAnswer: 'Two problems. First, the log is useless: printing an exception with str drops its type and traceback, so "user_id" doesn’t even say it was a KeyError or where it happened. I would use logger.exception inside the handler, which records the full traceback, plus context like the request id, ideally feeding an error tracker that groups identical failures. Second, showing raw tracebacks to users leaks internals such as file paths and library versions, which helps attackers; the user should get a generic message and an error id, with debug mode turned off in production.',
    },
  ],

  takeaways: [
    'Syntax errors (SyntaxError, IndentationError) are found before anything runs; exceptions happen at runtime, after earlier lines have run.',
    'Read a traceback bottom-up: exception type and message, then the frame where it was raised, then the chain of calls above it.',
    '"Most recent call last" means the newest call — the failure — is at the bottom.',
    'The line that crashes is not always the line that is wrong: ask where the bad data came from.',
    'Learn the common types on sight: NameError, TypeError, ValueError, ZeroDivisionError, IndexError, KeyError, AttributeError.',
    'Modern Python (3.10+) points at the exact spot and suggests fixes ("Did you mean…?") — read the whole last line.',
  ],
}
