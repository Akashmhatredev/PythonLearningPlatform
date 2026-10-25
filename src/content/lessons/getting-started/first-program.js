// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const INVITATION = py`# Party invitation maker
print("=== Party Invitation Maker ===")

guest = input("Guest name: ")         # input() waits for a line of text
food = input("Favourite snack: ")
day = input("Party day: ")

print()                                # an empty line
print("Dear", guest + ",")
print("You're invited to my party on", day, end="!\n")
print("There will be plenty of", food, "for you.")
print("-" * 30)                        # 30 dashes
print("RSVP", "yes", "no", sep=" / ")
`

export default {
  id: 'first-program',
  title: 'Your first program: print(), comments & input()',
  summary: 'Make Python talk with print(), leave notes for humans with comments, and listen with input() — which always hands you back text (a str).',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['setup-and-running'],
  related: ['variables-and-names', 'type-conversion', 'reading-errors', 'strings-basics', 'string-formatting', 'string-methods'],
  tags: ['print', 'hello world', 'sep', 'end', 'comments', 'input', 'interactive', 'strings', 'str', 'quotes', 'escape sequences', 'newline', 'f-string', 'stdin', 'stdout'],
  apis: [
    { name: 'print(*values, sep=" ", end="\\n")', summary: 'Converts each value to text, joins them with sep, adds end, and writes the result to the screen (standard output).' },
    { name: 'input(prompt="")', summary: 'Shows the prompt, waits for the user to type a line and press Enter, and returns that line as a str (without the newline).' },
    { name: '# comment', summary: 'Everything after # on a line is ignored by Python — notes for human readers.' },
    { name: '"text" / \'text\' / """text"""', summary: 'String literals: text in single, double or triple quotes.' },
    { name: '\\n, \\t, \\", \\\\ (escape sequences)', summary: 'Special characters inside strings: newline, tab, a quote, a backslash.' },
    { name: 'len(text)', summary: 'Returns the number of characters in a string.' },
  ],
  docs: [
    { label: 'Built-in functions — print()', url: 'https://docs.python.org/3/library/functions.html#print' },
    { label: 'Built-in functions — input()', url: 'https://docs.python.org/3/library/functions.html#input' },
    { label: 'Python tutorial — Text (strings)', url: 'https://docs.python.org/3/tutorial/introduction.html#text' },
    { label: 'Language reference — comments', url: 'https://docs.python.org/3/reference/lexical_analysis.html#comments' },
    { label: 'PEP 8 — Comments', url: 'https://peps.python.org/pep-0008/#comments' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every programmer's first program is a tradition: make the computer say hello.`,
    { code: py`print("Hello, world!")`, lang: 'python', title: 'hello.py' },
    py`That single line uses a **function** — a named action you *call* with parentheses — called \`print\`. The thing inside the parentheses, \`"Hello, world!"\`, is a **string**: a piece of text, marked by quotes.`,
    py`In this lesson you'll learn the three tools behind almost every beginner program:`,
    py`- **\`print()\`** — *output*: show text and values on the screen, with control over spacing (\`sep\`) and line endings (\`end\`);
- **comments** — notes for humans, starting with \`#\`, that Python ignores;
- **\`input()\`** — *input*: ask the user a question and get their answer back… always as **text**, even when they type a number.`,
    py`That last detail trips up nearly every beginner, so we'll look at it closely — and fix it with \`int()\`, which you'll master in [type conversion](lesson:type-conversion).`,
  ],
  why: [
    py`A program that can't communicate is useless. \`print()\` is how your program reports results — and, just as important, how *you* look inside a program while it runs. Experienced developers still reach for a quick \`print()\` when hunting a bug ([debugging](lesson:debugging) shows more powerful tools later).`,
    py`\`input()\` turns a fixed script into an **interactive** program: a quiz, a calculator, a game that responds to the player.`,
    py`Comments matter because code is read far more often than it's written — by teammates, and by you in three months when you've forgotten everything. A good comment explains *why* the code does something; the code itself already says *what*.`,
  ],
  eli15: [
    py`Think of your program as a character in a chat app.`,
    py`- \`print()\` is the character **talking**: whatever you put in the brackets appears on screen.
- \`input()\` is the character **asking a question and listening**. It shows the question, waits for you to type and press Enter, then hands your answer back to the program.
- A **comment** is a sticky note *you* put on the script. The character never reads it out — it's for other people looking at the script.`,
    py`One catch: \`input()\` writes down your answer **exactly as typed, as text**. If you type 15, the program gets the text \`"15"\` — the characters "1" and "5" — not the number fifteen. Text and numbers are different things in Python, so \`"15" + 1\` is an error, the same way "fifteen + 1" doesn't make sense as words.`,
  ],
  analogy: {
    title: 'A receptionist with a script',
    body: [
      py`Picture a hotel receptionist following a script. Some lines are things to **say** ("Welcome to the Grand Hotel!"). Some are **questions** ("What name is the booking under?") — the receptionist waits, then writes your answer on a card. The script also has notes in the margin ("be extra polite to VIP guests") that the receptionist never says out loud.`,
      py`The card is the key detail: whatever you say is written down **as words**. If you say "two nights", the card says "2" — a written character, not a quantity the receptionist can do maths with until they deliberately read it as a number.`,
    ],
    mapping: [
      ['the receptionist saying a line', 'print("Welcome!") — output'],
      ['how they pause between words, and finish a sentence', 'sep (between values) and end (after the last one)'],
      ['asking a question and waiting', 'input("Name? ") — shows a prompt and waits'],
      ['your answer written on a card', 'the str that input() returns'],
      ['"2" written on the card is still just ink', '"2" is text; int("2") turns it into the number 2'],
      ['notes in the margin of the script', '# comments — ignored when the program runs'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch input() hand back text',
    props: {
      code: py`# Ask two questions, then reply
name = input("What's your name? ")
age_text = input("How old are you? ")
print(type(age_text))

age = int(age_text)      # turn the text "15" into the number 15
print("Hi", name + "!", "Next year you'll be", age + 1)
`,
      stdin: 'Ada\n15',
      inline: false,
      notes: {
        2: '`input()` prints the question, then waits. The typed line (pre-filled as **Ada**) comes back as a **str** object.',
        3: 'The user typed 15 — but `input()` still returns the *text* `"15"`. Look at the object `age_text` points to: it has quotes.',
        4: '`type()` confirms it: `<class \'str\'>`. Text, not a number.',
        6: '`int()` reads the text and builds a brand-new **int** object, `15`. Now maths works.',
        7: '`name + "!"` glues two strings together. `age + 1` is real arithmetic: `16`. `print` puts spaces between its arguments.',
      },
    },
    alt: 'A step-by-step trace. After line 2, name points to the string "Ada". After line 3, age_text points to the string "15" (with quotes). Line 4 prints <class \'str\'>. After line 6, a separate int object 15 appears and age points to it. Line 7 prints: Hi Ada! Next year you\'ll be 16.',
    caption: py`Step with ▶ and compare the two objects \`age_text\` and \`age\`: one is the text \`"15"\`, the other the number \`15\`. Only the number can do maths.`,
  },
  syntax: [
    py`#### print()`,
    { code: py`print("Hello")                      # one value
print("Score:", 42, "points")       # several values, separated by spaces
print()                             # an empty line
print("a", "b", "c", sep="-")       # a-b-c        (sep goes BETWEEN values)
print("Loading", end="...")         # Loading...   (end goes AFTER the last value)
print("done")                       # ...continues on the same line: Loading...done`, lang: 'python', title: 'the shapes of print()' },
    py`- \`print\` accepts **any number of values**, separated by commas, of any type — numbers are converted to text for you.
- \`sep\` (separator) is placed *between* values; default \`" "\` (one space).
- \`end\` is placed *after* the last value; default \`"\\n"\` (a newline), which is why each \`print\` normally starts a new line.
- \`sep=\` and \`end=\` are **keyword arguments**: you name them, and they must come after the plain values.`,
    py`#### Strings at a basic level`,
    { code: py`print("double quotes")
print('single quotes')            # exactly the same kind of string
print("It's easy")                # use the other quote type inside...
print('She said "hi"')
print("She said \"hi\"")          # ...or escape it with a backslash
print("Line one\nLine two")       # \n = newline
print("Name:\tAda")               # \t = tab
print("C:\\Users\\ada")           # \\ = one backslash
print("""Roses are red,
violets are blue""")              # triple quotes can span lines
print("ha" * 3)                   # hahaha  (repeat)
print("snow" + "ball")            # snowball  (concatenate = join)
print(len("Ada"))                 # 3  (number of characters)`, lang: 'python', title: 'quotes, escapes and simple string operations' },
    py`A backslash inside a string starts an **escape sequence**: a way to type a character that's awkward to type directly. The most common are \`\\n\` (newline), \`\\t\` (tab), \`\\"\` and \`\\'\` (quotes) and \`\\\\\` (a real backslash). Strings get a full treatment in [strings, indexing & slicing](lesson:strings-basics).`,
    { callout: 'tip', title: 'A neater way to mix text and values: f-strings', text: py`Put an \`f\` before the opening quote and write names inside \`{}\`: \`print(f"Hi {name}, you have {score} points")\`. Python fills in the values. It's the modern, idiomatic way to build text — covered properly in [f-strings & formatting](lesson:string-formatting).` },
    py`#### Comments`,
    { code: py`# A full-line comment explains the next block of code.
VAT_RATE = 0.2    # an inline comment: two spaces, #, one space (PEP 8)

# Comment out a line to switch it off without deleting it:
# print("debug: VAT is", VAT_RATE)`, lang: 'python', title: 'comments' },
    py`Python ignores everything from \`#\` to the end of the line — unless the \`#\` is inside a string: \`print("#1 fan")\` prints \`#1 fan\`.`,
    py`#### input()`,
    { code: py`name = input("What's your name? ")   # shows the prompt, waits, returns a str
print("Nice to meet you,", name)

age = int(input("Age: "))            # convert the text to a whole number
print("Next year you'll be", age + 1)`, lang: 'python', title: 'asking questions' },
    py`- The prompt is printed **without** a newline, so end it with a space: \`"Age: "\`.
- \`input()\` returns the typed line **without** the Enter key, and **always as a \`str\`**.
- Need a number? Convert: \`int(...)\` for whole numbers, \`float(...)\` for decimals. If the text isn't a valid number you get a \`ValueError\` — see [type conversion](lesson:type-conversion).`,
    { callout: 'note', title: 'input() in this playground', text: py`Type your answers in the **Input** tab, one line per \`input()\` call, before pressing Run. If a program asks for more lines than you provided, the playground prompts you live.` },
  ],
  walkthrough: {
    title: 'Reading the invitation maker line by line',
    lang: 'python',
    code: INVITATION,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 2], text: py`A comment for humans, then a heading printed for the user. Comments never appear in the output.` },
      { lines: [4, 6], text: py`Three questions. Each \`input()\` prints its prompt, waits for one line of input, and returns it as a string. The comment on line 4 is an *inline comment*.` },
      { lines: [8], text: py`\`print()\` with no values prints just its \`end\` — a newline — giving a blank line.` },
      { lines: [9], text: py`\`guest + ","\` glues the comma straight onto the name (no space), then \`print\` adds a space between \`"Dear"\` and that result: \`Dear Ada,\`.` },
      { lines: [10], text: py`\`end="!\\n"\` replaces the usual ending: instead of only a newline, this line ends with \`!\` *and then* a newline.` },
      { lines: [12], text: py`\`"-" * 30\` repeats a string: thirty dashes, a cheap divider line.` },
      { lines: [13], text: py`\`sep=" / "\` changes what goes *between* the values: \`RSVP / yes / no\`.` },
    ],
  },
  playground: {
    title: 'Party invitation maker',
    objective: 'Run it with the answers in the Input tab, change them, then use sep, end, comments and escapes to reshape the invitation.',
    files: { 'main.py': INVITATION },
    stdin: 'Ada\npopcorn\nSaturday',
    expected: py`With the pre-filled answers (*Ada*, *popcorn*, *Saturday*) the console shows:

\`\`\`text
=== Party Invitation Maker ===
Guest name: Ada
Favourite snack: popcorn
Party day: Saturday

Dear Ada,
You're invited to my party on Saturday!
There will be plenty of popcorn for you.
------------------------------
RSVP / yes / no
\`\`\`

Edit the lines in the **Input** tab and run again to make a new invitation.`,
    experiments: [
      {
        id: 'rsvp-separator',
        task: py`Change the last line so it prints exactly \`RSVP: yes | no\`.`,
        hint: py`You need a colon after RSVP and \`" | "\` between the choices. One option: \`print("RSVP:", "yes | no")\`. Or play with \`sep\`.`,
        tests: [{ name: 'prints RSVP: yes | no', stdin: 'Ada\npopcorn\nSaturday', code: py`assert 'RSVP: yes | no' in output` }],
        explain: py`There are several correct answers — for example \`print("RSVP:", "yes", "|", "no")\`, or \`print("RSVP: yes", "no", sep=" | ")\`. \`sep\` only affects the gaps *between* the values you pass, so think about where you need which separator.`,
      },
      {
        id: 'comment-it-out',
        task: py`Turn the divider line (\`print("-" * 30)\`) into a comment so it no longer runs — without deleting it.`,
        hint: py`Put \`# \` at the start of the line.`,
        tests: [
          { name: 'the divider is gone from the output', stdin: 'Ada\npopcorn\nSaturday', code: py`assert "-" * 30 not in output` },
          { name: 'the line is still in the file, as a comment', stdin: 'Ada\npopcorn\nSaturday', code: py`assert any(line.strip().startswith('#') and '"-" * 30' in line for line in files['main.py'].splitlines()), 'Comment the line out with # instead of deleting it'` },
        ],
        explain: py`"Commenting out" is a quick way to switch code off while experimenting. Don't leave piles of commented-out code in finished programs, though — version control (git) remembers old code for you.`,
      },
      {
        id: 'quote-inside',
        task: py`Add a line at the end that prints exactly: \`He said "I'll bring snacks!"\` — it contains **both** kinds of quote.`,
        hint: py`Wrap the text in one kind of quote and escape the other with a backslash: \`print('He said "I\\'ll bring snacks!"')\`. Triple quotes work too.`,
        tests: [{ name: 'prints the quote correctly', stdin: 'Ada\npopcorn\nSaturday', code: py`assert 'He said "I\'ll bring snacks!"' in output` }],
        explain: py`A string ends at the next quote of the same kind, so a stray quote inside ends it too early. Escaping (\`\\'\` or \`\\"\`) tells Python "this quote is part of the text". Triple-quoted strings (\`"""He said "I'll bring snacks!" """\`) are another way out.`,
      },
      {
        id: 'chairs',
        task: py`At the end, ask \`guests = input("How many guests? ")\` and print \`Chairs needed:\` followed by **guests + 1** (one for you). Add a fourth line, \`5\`, to the Input tab. Run it first *without* converting and read the error — then fix it.`,
        hint: py`\`guests\` is the text \`"5"\`. Convert it with \`int(guests)\` before adding 1.`,
        tests: [{ name: '5 guests need 6 chairs', stdin: 'Ada\npopcorn\nSaturday\n5', code: py`assert 'Chairs needed: 6' in output` }],
        explain: py`Without conversion you get \`TypeError: can only concatenate str (not "int") to str\`: Python refuses to add the *text* \`"5"\` and the *number* \`1\`. \`int(guests) + 1\` converts first, then adds. This is the single most common beginner bug with \`input()\` — more in [type conversion](lesson:type-conversion).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How print() builds a line — and what input() gives back',
    props: {
      width: 760,
      height: 390,
      nodes: [
        { id: 'args', label: 'Values', note: '"Score:" and 42', x: 110, y: 70, tone: 'yellow' },
        { id: 'convert', label: 'Make text', note: '"Score:" and "42"', x: 390, y: 70 },
        { id: 'join', label: 'Join with sep', note: 'default: one space', x: 660, y: 70 },
        { id: 'end', label: 'Add end', note: 'default: a newline', x: 660, y: 200 },
        { id: 'screen', label: 'Screen', note: 'Score: 42', x: 390, y: 200, tone: 'kraft' },
        { id: 'keyboard', label: 'Keyboard', note: 'you type 42, Enter', x: 110, y: 330, tone: 'yellow' },
        { id: 'inputfn', label: 'input()', note: 'returns "42", a str', x: 390, y: 330, tone: 'blue' },
      ],
      edges: [
        { from: 'args', to: 'convert', label: 'str()' },
        { from: 'convert', to: 'join', label: 'sep' },
        { from: 'join', to: 'end', label: 'end' },
        { from: 'end', to: 'screen', label: 'write' },
        { id: 'prompt', from: 'inputfn', to: 'screen', label: 'prompt', dashed: true },
        { from: 'keyboard', to: 'inputfn', label: 'a line' },
      ],
      steps: [
        { focus: ['args'], text: py`\`print("Score:", 42)\` receives two **arguments**: the string \`"Score:"\` and the int \`42\`. Any number of values, of any type.` },
        { focus: ['convert'], edges: ['args->convert'], text: py`First, each value is turned into text — the same text \`str(value)\` would give. That's why you can print numbers, \`True\` or \`None\` without converting them yourself.` },
        { focus: ['join'], edges: ['convert->join'], text: py`The pieces are joined with **sep**, one space by default: \`Score: 42\`. Pass \`sep=""\` for no gaps, or \`sep=", "\` for commas.` },
        { focus: ['end'], edges: ['join->end'], text: py`Then **end** is added — a newline (\`"\\n"\`) by default, so the next \`print\` starts on a fresh line. \`end=""\` keeps the cursor on the same line.` },
        { focus: ['screen'], edges: ['end->screen'], text: py`The finished text is written to *standard output* — the screen, or the console panel here.` },
        { focus: ['inputfn', 'screen'], edges: ['prompt'], text: py`\`input("Score? ")\` works the other way. First it writes its **prompt** to the screen — with no newline — then it waits.` },
        { focus: ['keyboard', 'inputfn'], edges: ['keyboard->inputfn'], text: py`You type and press Enter. \`input()\` returns the characters you typed, minus the Enter key, **always as a str**: \`"42"\`, not \`42\`. Convert with \`int()\` or \`float()\` when you need a number.` },
      ],
    },
    alt: 'Top row: the values "Score:" and 42 are converted to text, joined with sep, then end is added and the result is written to the Screen as "Score: 42". Bottom row: the Keyboard sends a typed line to input(), which returns the string "42"; a dashed arrow shows input() first writing its prompt to the Screen.',
  },

  // ------------------------------------------------------------- understand
  internals: [
    py`#### Where does printed text go?`,
    py`Every program starts with three *streams* connected to it: **standard input** (stdin — the keyboard by default), **standard output** (stdout — the screen) and **standard error** (stderr — also the screen, used for error messages and tracebacks). \`print()\` writes to stdout; \`input()\` reads from stdin. In Python they're available as \`sys.stdin\`, \`sys.stdout\` and \`sys.stderr\`.`,
    { code: py`import sys

print("normal output")                       # goes to sys.stdout
print("something went wrong", file=sys.stderr)  # goes to the error stream`, lang: 'python', title: 'print() can write to any stream' },
    py`Because they're streams, the terminal can redirect them: \`python3 main.py > out.txt\` sends stdout into a file, and \`python3 main.py < answers.txt\` feeds a file to \`input()\` line by line. That's also how this course's tests feed your programs their input.`,
    py`#### Buffering`,
    py`For speed, output is collected in a **buffer** and written in chunks. In a terminal, stdout is normally flushed at each newline. So \`print("Working", end="")\` might not appear until later; \`print("Working", end="", flush=True)\` forces it out immediately — handy for progress dots.`,
    py`#### Comments really disappear`,
    py`Comments are thrown away by the tokenizer, the very first step of compiling, so they cost nothing at runtime and don't exist in the bytecode. (A string placed as the first statement of a function, class or module is different: it's a **docstring**, kept in the object's \`__doc__\` and shown by \`help()\`. You'll write them in [defining functions](lesson:defining-functions).)`,
    { callout: 'note', title: 'Python 2 history', text: py`In the long-retired Python 2, \`print\` was a statement (\`print "hi"\`) and \`input()\` *evaluated* what the user typed as Python code — a security hole. Python 3 made \`print()\` a function and made \`input()\` always return plain text. If you see \`print "hi"\` in an old tutorial, it's Python 2: you'll get \`SyntaxError: Missing parentheses in call to 'print'\`.` },
  ],
  mistakes: [
    {
      title: 'Doing maths with input() directly',
      wrong: { code: py`age = input("Age: ")
print("Next year:", age + 1)   # TypeError`, lang: 'python' },
      right: { code: py`age = int(input("Age: "))
print("Next year:", age + 1)`, lang: 'python' },
      explanation: py`\`input()\` always returns a \`str\`. \`"15" + 1\` raises \`TypeError: can only concatenate str (not "int") to str\`. Convert with \`int()\` or \`float()\` first.`,
    },
    {
      title: 'Adding text with + when the strings are numbers',
      wrong: { code: py`a = input("First number: ")    # "5"
b = input("Second number: ")   # "3"
print(a + b)                   # 53 — glued together, not added!`, lang: 'python' },
      right: { code: py`a = int(input("First number: "))
b = int(input("Second number: "))
print(a + b)                   # 8`, lang: 'python' },
      explanation: py`No error this time, which makes it worse: \`+\` on two strings **concatenates** them. \`"5" + "3"\` is \`"53"\`. Always convert numeric input.`,
    },
    {
      title: 'Forgetting the space at the end of a prompt',
      wrong: { code: py`name = input("Name:")      # the user's typing touches the colon: Name:Ada`, lang: 'python' },
      right: { code: py`name = input("Name: ")`, lang: 'python' },
      explanation: py`\`input()\` prints the prompt exactly as given, with no space or newline after it. Add the trailing space yourself.`,
    },
    {
      title: 'Mismatched or missing quotes',
      wrong: { code: py`print("Hello')
print(Hello)`, lang: 'python', static: true },
      right: { code: py`print("Hello")
print('Hello')`, lang: 'python' },
      explanation: py`A string must start and end with the same kind of quote: the first line is \`SyntaxError: unterminated string literal\`. Without quotes, \`Hello\` is treated as a variable name: \`NameError: name 'Hello' is not defined\`.`,
    },
    {
      title: 'Comments that repeat the code',
      wrong: { code: py`total = total + tip   # add tip to total`, lang: 'python', static: true },
      right: { code: py`total = total + tip   # tip is added before splitting so everyone pays their share`, lang: 'python', static: true },
      explanation: py`A comment that restates the code adds noise and goes stale. Explain the *why*: the reason, the business rule, the surprise. If code needs a comment to explain *what* it does, first try clearer names.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: can only concatenate str (not "int") to str`,
      cause: py`Joining a string and a number with \`+\` — usually a value from \`input()\` used in maths, or \`"Total: " + total\`.`,
      fix: py`Convert input with \`int()\`/\`float()\`. To display numbers with text, pass them as separate \`print\` arguments (\`print("Total:", total)\`) or use an f-string.`,
    },
    {
      symptom: py`SyntaxError: unterminated string literal (detected at line 1)`,
      cause: py`A string's opening quote has no matching closing quote on that line (or the quotes don't match: \`"Hello'\`).`,
      fix: py`Close the string with the same quote type it started with. For text containing quotes, use the other quote type or escape it.`,
    },
    {
      symptom: py`SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?`,
      cause: py`Python 2 style: \`print "hello"\`. In Python 3, \`print\` is a function and needs parentheses.`,
      fix: py`Write \`print("hello")\`. Treat tutorials that use \`print "..."\` as out of date.`,
    },
    {
      symptom: py`EOFError: EOF when reading a line`,
      cause: py`\`input()\` was called but there was no more input to read — for example, the playground's Input tab has fewer lines than the program asks for.`,
      fix: py`Provide one line per \`input()\` call in the Input tab (or type them when prompted), in the same order as the questions.`,
    },
  ],
  bestPractices: [
    'Pass several values to print() separated by commas instead of gluing strings and numbers with +.',
    'End every input() prompt with a space (or a colon and a space).',
    'Convert numeric input immediately: age = int(input("Age: ")).',
    'Write comments that explain why, not what; keep them up to date with the code.',
    'Use # for comments with one space after the hash, and two spaces before an inline comment (PEP 8).',
    'Prefer f-strings for building text from values once you have learned them.',
  ],
  useCases: [
    'Printing results, menus and reports in command-line programs.',
    'Quick debugging: print a value to check what a program is really doing.',
    'Interactive programs: quizzes, games, calculators and setup wizards that ask questions.',
    'Using sep and end to format simple tables, CSV-like lines and progress indicators.',
  ],
  comparison: {
    title: 'print() options at a glance',
    headers: ['call', 'output', 'why'],
    rows: [
      ['print("a", "b")', 'a b', 'default sep is one space'],
      ['print("a", "b", sep="")', 'ab', 'no separator'],
      ['print("a", "b", sep=", ")', 'a, b', 'custom separator'],
      ['print("a", end="")  then print("b")', 'ab', 'the first call ends without a newline'],
      ['print()', '(an empty line)', 'only end is printed'],
      ['print("a" + 1)', 'TypeError', '+ cannot join str and int; use print("a", 1)'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'first-program-q1',
      type: 'mcq',
      prompt: 'The user types `42` and presses Enter at `answer = input("? ")`. What is `answer`?',
      options: [
        { text: 'The int 42', why: 'input() never converts: it always returns a str. You would need int(answer) to get the number.' },
        'The str "42"',
        { text: 'The str "42\\n" (including the Enter key)', why: 'input() strips the trailing newline before returning the text.' },
        { text: 'It depends on what the user typed', why: 'The type is always str, whatever was typed. Only the characters inside the string change.' },
      ],
      answer: 1,
      explanation: py`\`input()\` always returns a string, without the newline. \`int(answer)\` converts it to the number \`42\` (and raises \`ValueError\` if the text isn't a whole number).`,
    },
    {
      id: 'first-program-q2',
      type: 'output',
      prompt: 'What exactly does this print?',
      code: py`print("A", "B", "C", sep="-", end="!")
print("D")`,
      answer: 'A-B-C!D',
      accept: ['A-B-C!D'],
      explanation: py`\`sep="-"\` goes *between* A, B and C; \`end="!"\` replaces the newline, so the second \`print\` continues on the same line: \`A-B-C!D\`.`,
    },
    {
      id: 'first-program-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`# print("one")
print("two")  # print("three")`,
      options: [
        { text: '`one`, `two`, `three` on three lines', why: 'Everything after # on a line is a comment and is ignored.' },
        '`two`',
        { text: '`two`, then `three`', why: 'print("three") comes after a # on line 2, so it is part of the comment.' },
        { text: 'Nothing — the file is all comments', why: 'Line 2 starts with real code; only the part after its # is a comment.' },
      ],
      answer: 1,
      explanation: py`Line 1 is entirely a comment. On line 2, \`print("two")\` runs and the rest of the line after \`#\` is ignored.`,
    },
    {
      id: 'first-program-q4',
      type: 'bug',
      prompt: 'The user types `Ada` and `15`. The program crashes. Click the line that raises the error.',
      code: py`name = input("Name: ")
age = input("Age: ")
print("Next year", name, "will be", age + 1)`,
      answerLine: 3,
      explanation: py`\`age\` is the string \`"15"\`, so \`age + 1\` raises \`TypeError: can only concatenate str (not "int") to str\`. Fix line 2 with \`age = int(input("Age: "))\` — the crash is reported on line 3, where the bad addition happens.`,
    },
    {
      id: 'first-program-q5',
      type: 'fill',
      prompt: 'Fill the blank so the program prints the date as `2026-10-24`.',
      code: py`print("2026", "10", "24", sep=___)`,
      answer: [['"-"', "'-'"]],
      explanation: py`\`sep\` is the text placed between the values. \`sep="-"\` gives \`2026-10-24\`.`,
    },
    {
      id: 'first-program-q6',
      type: 'mcq',
      prompt: 'Which comment is the most useful?',
      options: [
        { text: '`count = count + 1  # add one to count`', why: 'It repeats exactly what the code already says, so it adds nothing.' },
        { text: '`x = 86400  # x`', why: 'This comment is meaningless. Better: a clear name like SECONDS_PER_DAY.' },
        '`retries = 3  # the payment API often fails once; three tries covers it`',
        { text: '`# print("debug")` left in the finished program', why: 'Commented-out code is clutter in finished programs; version control remembers old code.' },
      ],
      answer: 2,
      explanation: py`Good comments explain *why*: a reason or constraint the code can't express on its own. The code already shows *what* happens.`,
    },
    {
      id: 'first-program-q7',
      type: 'short',
      prompt: 'Why does `input()` always return a string, and what should you do when you need a number?',
      answer: py`\`input()\` has no way of knowing what the user meant — it just returns the characters they typed, so the only safe type is text (\`str\`). The program decides how to interpret it: convert with \`int()\` for whole numbers or \`float()\` for decimals, ideally straight away (\`age = int(input("Age: "))\`). If the text isn't a valid number, the conversion raises \`ValueError\`, which you can later handle with try/except.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'team-sheet',
      title: 'Team sheet with sep and end',
      difficulty: 'beginner',
      prompt: py`Three players are stored in variables. Print exactly these two lines:

\`\`\`text
Team: Ada, Ben, Cy
Ready? Yes!
\`\`\`

Rules (the tests check them):

- Use the variables \`player1\`, \`player2\`, \`player3\` — don't type the names again.
- Use \`sep=\` at least once and \`end=\` at least once.`,
      files: {
        'main.py': py`player1 = "Ada"
player2 = "Ben"
player3 = "Cy"

# TODO: print "Team: Ada, Ben, Cy" using sep=
print(player1, player2, player3)

# TODO: print "Ready? Yes!" using two print() calls and end=
print("Ready?")
print("Yes!")
`,
      },
      hints: [
        'sep only goes between the values you pass. Which values need ", " between them, and which need a different gap?',
        'One way: print("Team:", end=" ") then print(player1, player2, player3, sep=", "). For line 2, make the first print end with a space instead of a newline.',
        'print("Team:", end=" ")\nprint(player1, player2, player3, sep=", ")\nprint("Ready?", end=" ")\nprint("Yes!")',
      ],
      solution: {
        explanation: py`\`print("Team:", end=" ")\` prints the label and then a space *instead of* a newline, so the next \`print\` continues on the same line. That next call uses \`sep=", "\` to put a comma and space between the three names only. The same \`end=" "\` trick joins \`Ready?\` and \`Yes!\`. (An alternative for line 1 is \`print("Team: " + player1, player2, player3, sep=", ")\` — gluing the label onto the first name.)`,
        files: {
          'main.py': py`player1 = "Ada"
player2 = "Ben"
player3 = "Cy"

print("Team:", end=" ")
print(player1, player2, player3, sep=", ")

print("Ready?", end=" ")
print("Yes!")
`,
        },
      },
      tests: [
        { name: 'prints both lines exactly', code: py`assert output == "Team: Ada, Ben, Cy\nReady? Yes!\n"` },
        { name: 'uses sep=', code: py`assert 'sep=' in files['main.py'], 'Use the sep= keyword argument at least once'` },
        { name: 'uses end=', code: py`assert 'end=' in files['main.py'], 'Use the end= keyword argument at least once'` },
        { name: 'uses the player variables', code: py`assert files['main.py'].count('"Ada"') == 1, 'Print the names through player1, player2, player3 instead of typing them again'` },
      ],
    },
    {
      id: 'birthday-card',
      title: 'Birthday card',
      difficulty: 'beginner',
      prompt: py`Write an interactive birthday card. The program must:

1. ask \`input("Name: ")\` and then \`input("Age: ")\` — exactly these prompts, in this order;
2. print \`Happy birthday, <name>! You are now <age>.\`
3. print \`In 10 years you'll be <age + 10>.\`

For example, typing \`Ada\` and \`15\` gives:

\`\`\`text
Happy birthday, Ada! You are now 15.
In 10 years you'll be 25.
\`\`\`

Remember what \`input()\` returns. (Tip: \`print(..., sep="")\` or an f-string helps you put the \`!\` and \`.\` right after a value.)`,
      files: {
        'main.py': py`name = input("Name: ")
age = input("Age: ")

# TODO: print the two lines of the card
print("Happy birthday")
`,
      },
      hints: [
        'age comes back from input() as text. To add 10 to it, you need a number first.',
        'Convert with int(): age = int(input("Age: ")). To avoid a space before "!" or ".", use sep="" and add the spaces yourself — or use an f-string.',
        'print(f"Happy birthday, {name}! You are now {age}.")\nprint(f"In 10 years you\'ll be {age + 10}.")',
      ],
      solution: {
        explanation: py`\`int(input("Age: "))\` converts the typed text \`"15"\` to the number \`15\` straight away, so \`age + 10\` is real arithmetic (\`25\`) instead of a \`TypeError\`. The f-strings place each value exactly where it belongs, with no automatic spaces — so the \`!\` and \`.\` sit right after the values. With plain \`print\` you could write \`print("Happy birthday, ", name, "! You are now ", age, ".", sep="")\` instead.`,
        files: {
          'main.py': py`name = input("Name: ")
age = int(input("Age: "))   # input() returns text; convert it to a number

print(f"Happy birthday, {name}! You are now {age}.")
print(f"In 10 years you'll be {age + 10}.")
`,
        },
      },
      tests: [
        { name: 'greets Ada, 15', stdin: 'Ada\n15', code: py`assert "Happy birthday, Ada! You are now 15." in output` },
        { name: 'adds 10 years', stdin: 'Ada\n15', code: py`assert "In 10 years you'll be 25." in output` },
        { name: 'works for Ben, 9', stdin: 'Ben\n9', code: py`assert "Happy birthday, Ben! You are now 9." in output and "In 10 years you'll be 19." in output` },
        { name: 'uses the exact prompts', stdin: 'Ada\n15', code: py`assert output.startswith("Name: Age: "), 'Ask input("Name: ") and then input("Age: ")'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'first-program-print-params',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does `print()` do with its arguments? Explain `sep`, `end`, `file` and `flush`.',
      answer: 'print(*objects, sep=" ", end="\\n", file=None, flush=False) converts each object with str(), joins them with sep, appends end and writes the result to file (sys.stdout by default). flush=True forces the output out of the buffer immediately.',
      explanation: py`Because \`print\` calls \`str()\` on each argument, you can print any object. \`sep\` and \`end\` control formatting, \`file\` redirects output (e.g. \`file=sys.stderr\` or an open file), and \`flush\` matters for progress indicators and logs that must appear immediately.`,
      code: { lang: 'python', code: py`import sys
print("a", 1, True, sep=" | ")              # a | 1 | True
print("warning!", file=sys.stderr)          # to the error stream
print("Working", end="", flush=True)        # appears immediately, no newline` },
      whyAsked: 'Checks precise knowledge of the most-used built-in, including the less obvious parameters.',
      mistakes: ['Thinking print can only take strings', 'Not knowing about file= and flush=', 'Building strings with + and str() everywhere instead of passing several arguments'],
      followUps: ['What does print return?', 'How would you print to a file?', 'When would you use logging instead of print?'],
      modelAnswer: 'print takes any number of positional objects, calls str on each one, joins them with sep — a single space by default — and then writes end, which defaults to a newline. The file parameter chooses where the text goes: sys.stdout by default, but it can be sys.stderr or any open file. flush=True forces the buffered output to be written immediately, which matters for progress output or when the program might crash. In real applications I would use the logging module for diagnostic messages, and keep print for genuine program output.',
    },
    {
      id: 'first-program-print-returns',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`result = print("hi")
print(result)` },
      options: ['hi then hi', 'hi then None', 'None then hi', 'Just hi'],
      correctOption: 1,
      answer: '`hi`, then `None`. print() writes its output as a side effect and returns None.',
      explanation: py`\`print\` exists for its *side effect* (writing text). Like every function without an explicit \`return\`, it returns \`None\`. Beginners sometimes write \`total = print(a + b)\` and are surprised that \`total\` is \`None\` — see [None & truthiness](lesson:none-and-truthiness).`,
      whyAsked: 'Separates "printing a value" from "returning a value" — a confusion behind many beginner bugs.',
      mistakes: ['Thinking print returns the printed text', 'Confusing what a function shows with what it gives back'],
      followUps: ['What is the difference between print and return in a function?', 'What does a function return if it has no return statement?'],
      modelAnswer: 'It prints hi and then None. print writes its arguments to standard output as a side effect, but its return value is None, like any function that does not explicitly return something. So result is None, and printing it shows None. This is the classic confusion between showing a value and returning it — functions should usually return results and let the caller decide whether to print them.',
    },
    {
      id: 'first-program-input-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A calculator asks for two numbers with `input()` and prints `a + b`. For 5 and 3 it prints `53`. What is wrong, and how would you make it robust?',
      answer: 'input() returns strings, and + on strings concatenates: "5" + "3" == "53". Convert with int() or float() — and to be robust, catch ValueError for non-numeric input and ask again.',
      explanation: py`Converting fixes the logic; validating fixes the user experience. A simple loop with \`try\`/\`except ValueError\` re-asks until the input is valid (see [try/except](lesson:try-except)).`,
      code: { lang: 'python', code: py`def ask_number(prompt):
    while True:
        text = input(prompt)
        try:
            return float(text)
        except ValueError:
            print("Please type a number, e.g. 3 or 2.5")` },
      whyAsked: 'Tests whether you know input() returns str and think about invalid input, not just the happy path.',
      mistakes: ['Using eval(input()) to "convert" — it executes arbitrary code', 'Converting with int() when decimals are allowed', 'Not handling ValueError'],
      followUps: ['Why is eval(input()) dangerous?', 'int() or float() — how do you choose?', 'How would you test a function that calls input()?'],
      modelAnswer: 'input always returns a string, so a and b are "5" and "3", and plus on two strings concatenates them into "53" instead of adding. The fix is to convert: int for whole numbers or float if decimals are allowed. To make it robust I would wrap the conversion in a small helper with a loop and try/except ValueError, so typing "five" shows a friendly message and asks again instead of crashing. I would never use eval on the input, because that would execute whatever the user types.',
    },
    {
      id: 'first-program-banner',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Write `banner(text)` that **returns** (not prints) a three-line string: a row of `*`, then `* text *`, then the same row. The row must be exactly as wide as the middle line. `banner("Hi")` returns `"******\\n* Hi *\\n******"`.',
      answer: 'middle = "* " + text + " *"; row = "*" * len(middle); return row + "\\n" + middle + "\\n" + row',
      explanation: py`\`len()\` measures the middle line, \`"*" * n\` repeats a character, and \`"\\n"\` joins the three lines. Returning the string (instead of printing) makes the function reusable and testable: the caller decides whether to print it, save it or send it.`,
      starter: { files: { 'main.py': py`def banner(text):
    # TODO: return the three-line banner as one string
    return text


print(banner("Hi"))
` } },
      tests: [
        { name: 'banner("Hi")', code: py`assert banner("Hi") == "******\n* Hi *\n******"` },
        { name: 'banner("Python") lines are equally wide', code: py`lines = banner("Python").split("\n")
assert lines == ["**********", "* Python *", "**********"]` },
        { name: 'returns instead of printing', code: py`assert capture(banner, "x") == "", 'banner() should return the string, not print it'` },
      ],
      solution: { files: { 'main.py': py`def banner(text):
    middle = "* " + text + " *"
    row = "*" * len(middle)
    return row + "\n" + middle + "\n" + row


print(banner("Hi"))
` } },
      hints: ['Build the middle line first, then measure it with len().', 'A string times a number repeats it: "*" * 6 is "******". Join lines with "\\n".'],
      whyAsked: 'A small exercise in string building and in returning values rather than printing them.',
      mistakes: ['Printing inside the function instead of returning', 'Hard-coding the width', 'Adding a trailing newline the spec did not ask for'],
      followUps: ['How would you write it with an f-string?', 'How would you centre text in a fixed-width banner? (str.center)', 'What about text containing several lines?'],
      modelAnswer: 'I would build the middle line first as "* " plus the text plus " *", then make the border by repeating "*" len(middle) times so it always matches. The function returns the three lines joined with newline characters rather than printing them, which keeps it testable and reusable. With an f-string it reads nicely too: f"{row}\\n{middle}\\n{row}". For fixed widths I would look at str.center or format specifications.',
    },
    {
      id: 'first-program-buffering',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A script prints progress dots with `print(".", end="")` inside a slow loop, but nothing appears in the terminal until the very end. Why, and how do you fix it?',
      answer: 'stdout is buffered; in a terminal it is usually line-buffered, so text without a newline waits in the buffer. Use print(".", end="", flush=True), or call sys.stdout.flush().',
      explanation: py`Writing to the screen is relatively expensive, so output is collected and written in chunks. With a terminal attached, CPython's stdout flushes at each newline; when stdout is redirected to a file or pipe it is block-buffered, so even full lines can be delayed. \`flush=True\` forces a write. Running Python with \`-u\` (or setting \`PYTHONUNBUFFERED=1\`) disables buffering for the whole program — common in Docker containers so logs appear promptly.`,
      whyAsked: 'A practical question that reveals understanding of streams and buffering — relevant to logging in containers and CLIs.',
      mistakes: ['Blaming the loop or the terminal', 'Not knowing flush=True exists', 'Not realising redirected output behaves differently from a terminal'],
      followUps: ['Why do logs from a Python app in Docker sometimes appear late?', 'Is stderr buffered the same way?'],
      modelAnswer: 'Standard output is buffered: Python collects text and writes it in chunks because writing is relatively expensive. When stdout is a terminal it is line-buffered, so text only appears when a newline is written — and the dots never write one. The fix is print(".", end="", flush=True), or sys.stdout.flush() after each dot. When output goes to a pipe or file, it is block-buffered, which is why containers often run Python with -u or PYTHONUNBUFFERED=1 so logs show up immediately.',
    },
    {
      id: 'first-program-comments-docstrings',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between a comment and a docstring? What makes a good comment?',
      answer: 'A comment (# ...) is discarded when the code is compiled; it is only for readers of the source. A docstring is a string literal as the first statement of a module, function or class; it is kept at runtime in __doc__ and shown by help() and tools. Good comments explain why — intent, constraints, surprises — not what the code obviously does.',
      explanation: py`Docstrings document *how to use* something (the interface); comments explain *why the implementation* is the way it is. PEP 257 describes docstring conventions. Outdated comments are worse than none, so keep them close to the code they describe and update them together.`,
      code: { lang: 'python', code: py`def split_bill(total, people):
    """Return each person's share of the total."""   # docstring: kept in split_bill.__doc__
    # Round up to the next cent so the restaurant is never short.
    return -(-total * 100 // people) / 100` },
      whyAsked: 'Assesses code-readability habits and knowledge of how Python treats each.',
      mistakes: ['Saying docstrings are just multi-line comments', 'Writing comments that restate the code', 'Leaving commented-out code in production'],
      followUps: ['What is PEP 257?', 'How do tools use docstrings? (help(), IDE tooltips, Sphinx, doctest)', 'When is a comment a sign the code should be refactored?'],
      modelAnswer: 'A comment starts with a hash and is thrown away by the tokenizer, so it exists only in the source for human readers. A docstring is a string literal placed as the first statement of a module, class or function; Python keeps it in the __doc__ attribute, so help(), IDEs and documentation tools can show it. I use docstrings to describe how to use something and comments to explain why the implementation is the way it is — a business rule, a workaround, a non-obvious decision. If I need a comment to explain what the code does, that is usually a hint to rename things or extract a function.',
    },
    {
      id: 'first-program-input-safety',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate converts user input with `eval(input("Amount: "))` "so that both 3 and 2.5 work". What do you tell them?',
      answer: 'eval executes the text as Python code, so a user can run arbitrary code (e.g. deleting files). Use float() (or decimal.Decimal for money) and handle ValueError. Python 3’s input() returns plain text precisely because Python 2’s input() evaluated it.',
      explanation: py`\`eval\` treats its argument as a Python expression and runs it with the program's full permissions. Typing \`__import__("os").remove("data.db")\` would delete a file. The general rule: **never evaluate untrusted input**. Parse it with the narrowest tool that works — \`int()\`, \`float()\`, \`Decimal()\`, \`json.loads()\`, or \`ast.literal_eval()\` for Python literals — and validate the result. See [injection attacks](lesson:injection-attacks).`,
      whyAsked: 'Security awareness: eval on untrusted input is a classic injection vulnerability.',
      mistakes: ['Thinking eval is fine because "it is only a CLI"', 'Suggesting sanitising the string before eval instead of not using eval', 'Not mentioning ValueError handling'],
      followUps: ['What is ast.literal_eval and when is it acceptable?', 'Why might money use Decimal instead of float?', 'What other functions execute code from strings? (exec, pickle.loads on untrusted data)'],
      modelAnswer: 'I would ask them to remove it, because eval runs the typed text as Python code with the program’s permissions — someone could type an expression that imports os and deletes files. This is exactly why Python 3’s input() returns plain text; Python 2’s input() used to evaluate it. If both 3 and 2.5 should work, float() already accepts both, or Decimal for money, with a try/except ValueError to re-prompt on bad input. The general rule is never to evaluate untrusted input; if they truly need Python literals, ast.literal_eval is the safe, restricted option.',
    },
  ],

  takeaways: [
    'print() converts each value to text, joins them with sep (a space by default) and finishes with end (a newline by default).',
    'Strings are text in matching quotes; escape sequences like \\n, \\t and \\" type special characters.',
    'Comments start with # and are ignored by Python; write them to explain why, not what.',
    'input(prompt) shows the prompt, waits for a line and returns it — always as a str, without the newline.',
    'Convert numeric input with int() or float() before doing maths: "5" + "3" is "53", and "5" + 3 is a TypeError.',
    'print() returns None — showing a value is not the same as returning it.',
  ],
}
