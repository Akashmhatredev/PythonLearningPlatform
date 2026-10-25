// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SCORE_TRACKER = py`# A tiny game score tracker
player = "Ada"
score = 0
print(player, "starts with", score, "points")

score = score + 10      # builds a new int; the name moves to it
score += 5              # same idea, shorter to write
print(player, "now has", score, "points")

high_score = score      # a second name for the same object
score = 0               # rebinding score leaves high_score alone
print("score:", score, "| high score:", high_score)

level, lives = 1, 3            # bind two names at once
level, lives = lives, level    # swap without a temporary variable
print("level:", level, "lives:", lives)
`

export default {
  id: 'variables-and-names',
  title: 'Variables: names that point to objects',
  summary: 'A Python variable is a name bound to an object — assignment moves the name, it never copies the object.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['first-program'],
  related: ['none-and-truthiness', 'numbers-and-math', 'mutability-and-copying', 'object-model', 'scope'],
  tags: ['variables', 'names', 'assignment', 'binding', 'references', 'objects', 'id', 'type', 'naming', 'snake_case', 'swap', 'tuple assignment'],
  apis: [
    { name: '= (assignment)', summary: 'Evaluates the right-hand side, then binds the name on the left to the resulting object.' },
    { name: '+=, -=, *= (augmented assignment)', summary: '`x += 1` rebinds x to x + 1 (or updates a mutable object in place).' },
    { name: 'id(obj)', summary: 'An integer that uniquely identifies an object for as long as it is alive.' },
    { name: 'type(obj)', summary: 'Returns the class of an object, e.g. <class \'int\'>.' },
    { name: 'del name', summary: 'Removes the name (not necessarily the object) from the namespace.' },
  ],
  docs: [
    { label: 'Python tutorial — numbers, strings and assignment', url: 'https://docs.python.org/3/tutorial/introduction.html' },
    { label: 'Language reference — assignment statements', url: 'https://docs.python.org/3/reference/simple_stmts.html#assignment-statements' },
    { label: 'Language reference — naming and binding', url: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding' },
    { label: 'PEP 8 — naming conventions', url: 'https://peps.python.org/pep-0008/#naming-conventions' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **variable** is a *name* you give to a value so you can use it later. In Python, every value — a number, a piece of text, a list of scores — is an **object**: a thing that lives in the computer's memory and has a *type* (what kind of thing it is) and a *value* (what it holds).`,
    py`When you write \`score = 10\`, Python does two things, in this order:`,
    py`1. it works out the right-hand side and gets an object — here the integer \`10\`;
2. it **binds** the name \`score\` to that object, like sticking a name tag on it.`,
    py`That small detail — *names point to objects* — explains a lot of Python behaviour that surprises beginners, from why \`b = a\` doesn't copy a list to why changing one list "magically" changes another. You'll meet it again in [mutability & copying](lesson:mutability-and-copying) and [scope](lesson:scope).`,
  ],
  why: [
    py`Programs need to *remember* things: the player's score, the items in a basket, the name someone typed. Without names you would have to recompute or retype every value each time you needed it.`,
    py`Names also make code readable. \`total_price = unit_price * quantity\` explains itself; \`a = b * c\` does not. Choosing good names is one of the most important — and most underrated — programming skills.`,
    py`Finally, understanding *binding* (as opposed to "storing in a box") prevents a whole family of bugs where two names secretly share one object.`,
  ],
  eli15: [
    py`Imagine a big hall full of things: a number 10, the word "Ada", a list of friends. You can't carry them around, so you stick **name tags** on them. \`score = 10\` means "stick the tag *score* on the 10".`,
    py`If you then write \`best = score\`, you are not making a second 10 — you are sticking a *second tag* onto the same 10. And \`score = 15\` peels the *score* tag off the 10 and sticks it onto a 15. The *best* tag stays on the 10.`,
    py`That's it. Variables in Python are tags, not boxes.`,
  ],
  analogy: {
    title: 'Name tags at a party',
    body: [
      py`At a party, people wear name tags. A tag isn't the person — it just points at them. One person can wear several tags ("Ada", "Team captain", "Birthday girl"), and you can move a tag from one person to another.`,
      py`Python variables work the same way. The object is the person; the variable is a tag. Moving a tag (re-assigning) never changes the person, and if two tags are on the same person, anything that person does is visible through both tags.`,
    ],
    mapping: [
      ['person at the party', 'an object in memory (10, "Ada", a list)'],
      ['name tag', 'a variable name like score'],
      ['sticking a tag on someone', 'assignment: score = 10'],
      ['two tags on one person', 'two names bound to the same object: best = score'],
      ['moving a tag to someone else', 're-assignment: score = 15'],
      ['a person with no tags left', 'an object no name refers to — Python can free its memory'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch names move between objects',
    props: {
      code: py`score = 10
best = score
score = score + 5
print(score, best)

team = ["Ada", "Ben"]
squad = team
squad.append("Cy")
print(team)
`,
      inline: false,
      notes: {
        1: 'Python first creates the int object 10, then binds the name `score` to it.',
        2: '`best = score` copies the **arrow**, not the object: both names now point at the same 10.',
        3: '`score + 5` builds a brand-new int, 15. Only `score` moves to it — `best` still points at 10.',
        6: 'A list object is created holding references to two string objects.',
        7: 'No copy is made: `squad` is a second name for the very same list.',
        8: 'Mutating the list through `squad` changes the one list that both names point to.',
      },
    },
    alt: 'A step-by-step trace of the code. Names appear in the Global frame on the left with arrows to objects on the right. After best = score both names point to the int 10. After score = score + 5, score points to a new int 15 while best still points to 10. team and squad both point to one list, which gains a third item when squad.append runs, so printing team shows all three names.',
    caption: py`Step through with ▶. Ints are drawn as separate objects here so you can see re-binding. Lists are **mutable** (changeable in place); ints are **immutable**, so "changing" an int always means making a new one.`,
  },
  syntax: [
    py`#### Assignment`,
    { code: py`name = expression          # bind one name
x, y = 1, 2                # bind several names at once (tuple unpacking)
x, y = y, x                # swap: the right side is built first
a = b = 0                  # chain: both names bound to the same object
count += 1                 # augmented assignment: count = count + 1`, lang: 'python', title: 'the shapes of assignment' },
    py`The right-hand side is **always evaluated first**, completely, before any name changes. That is why \`x, y = y, x\` swaps correctly.`,
    py`#### Rules for names`,
    py`- Letters, digits and underscores only: \`total_2\` ✓, \`total-2\` ✗ (that's subtraction).
- Can't start with a digit: \`player1\` ✓, \`1player\` ✗.
- Case-sensitive: \`Score\` and \`score\` are different names.
- Can't be a **keyword** (a word reserved by the language): \`if\`, \`for\`, \`class\`, \`True\`, \`None\`, … Run \`import keyword; print(keyword.kwlist)\` to see them all.
- Avoid shadowing built-ins: naming a variable \`list\`, \`str\`, \`sum\` or \`input\` works, but hides the real function for the rest of the file.`,
    py`#### Conventions (PEP 8)`,
    py`| kind | style | example |
|---|---|---|
| variables & functions | \`snake_case\` | \`high_score\`, \`load_scores()\` |
| constants (by convention) | \`UPPER_SNAKE_CASE\` | \`MAX_LIVES = 3\` |
| classes | \`CapWords\` | \`ScoreBoard\` |
| "internal, please don't touch" | leading underscore | \`_cache\` |`,
    { callout: 'note', title: 'Constants are a convention', text: py`Python has no \`const\` keyword. \`MAX_LIVES = 3\` can still be re-assigned — the capital letters are a promise to other programmers, not a rule the interpreter enforces. Type checkers can enforce it with \`typing.Final\`.` },
    py`#### Inspecting objects`,
    { code: py`score = 15
print(type(score))   # <class 'int'>
print(id(score))     # some large integer: this object's identity
best = score
print(id(best) == id(score))   # True: same object`, lang: 'python', title: 'type() and id()' },
  ],
  walkthrough: {
    title: 'Reading the score tracker line by line',
    lang: 'python',
    code: SCORE_TRACKER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 3], text: py`Two names are bound: \`player\` to the string \`"Ada"\` and \`score\` to the int \`0\`.` },
      { lines: [4], text: py`\`print()\` accepts several values and puts a space between them: \`Ada starts with 0 points\`.` },
      { lines: [6], text: py`The right side \`score + 10\` is computed first, producing a **new** int \`10\`. Then the name \`score\` is re-bound to it. The old \`0\` is untouched (ints never change).` },
      { lines: [7], text: py`\`+=\` is shorthand for \`score = score + 5\`. Now \`score\` refers to \`15\`.` },
      { lines: [10, 11], text: py`\`high_score = score\` makes a second name for the \`15\` object. Re-binding \`score\` to \`0\` moves only the \`score\` tag, so \`high_score\` keeps pointing at \`15\`.` },
      { lines: [14, 15], text: py`Tuple assignment binds two names in one go. In the swap, Python builds the tuple \`(lives, level)\` = \`(3, 1)\` **before** re-binding anything, so no temporary variable is needed.` },
    ],
  },
  playground: {
    title: 'Score tracker',
    objective: 'Run it, predict each printed line, then change the values and watch which names move.',
    files: { 'main.py': SCORE_TRACKER },
    expected: py`Four lines:

\`\`\`text
Ada starts with 0 points
Ada now has 15 points
score: 0 | high score: 15
level: 3 lives: 1
\`\`\`

Open the **Variables** tab after running to see every name and the value it points to at the end.`,
    experiments: [
      {
        id: 'rename-player',
        task: py`Change the player's name to yours and make the starting \`score\` **100**. Predict the four lines before you run it.`,
        hint: py`Only lines 2 and 3 need to change. Everything after them uses the names, so it updates automatically.`,
        tests: [
          { name: 'the player starts with 100 points', code: py`assert 'starts with 100 points' in output` },
          { name: 'the player has a new name', code: py`assert player != "Ada", 'Change the player name'` },
        ],
        explain: py`Every later line refers to \`player\` and \`score\` by name, so changing the two assignments at the top changes every output line. That's the point of naming values instead of repeating them.`,
      },
      {
        id: 'bonus',
        task: py`Create a variable \`bonus = 50\` and add it to \`score\` with \`+=\` **before** the line that sets \`high_score\`.`,
        hint: py`Add \`bonus = 50\` and \`score += bonus\` just above \`high_score = score\`.`,
        tests: [
          { name: 'bonus exists and is 50', code: py`assert ns.get('bonus') == 50, 'Create a variable named bonus with the value 50'` },
          { name: 'the bonus reached the high score', code: py`assert high_score >= 65, 'Add the bonus to score before high_score = score'` },
        ],
        explain: py`\`score += bonus\` re-binds \`score\` to a new int. Because it happens before \`high_score = score\`, the high score picks up the bonus. Move the bonus line *after* \`high_score = score\` and see what changes.`,
      },
      {
        id: 'same-object',
        task: py`Just after \`high_score = score\`, add \`print(id(score) == id(high_score))\`. Add the same line again after \`score = 0\`. Predict both results first.`,
        hint: py`\`id()\` gives an object's identity. Two names pointing at the same object have equal ids.`,
        tests: [{ name: 'printed True, then False', code: py`assert 'True' in output and 'False' in output and output.index('True') < output.index('False')` }],
        explain: py`Right after \`high_score = score\` both names point at one object (\`True\`). After \`score = 0\`, \`score\` points at a different object, so the ids differ (\`False\`).`,
      },
      {
        id: 'rotate',
        task: py`At the end, add \`a, b, c = 1, 2, 3\`, then rotate them in **one line** so that \`a\` is 2, \`b\` is 3 and \`c\` is 1.`,
        hint: py`Use the same trick as the swap: \`a, b, c = b, c, a\`.`,
        tests: [{ name: 'a, b, c are 2, 3, 1', code: py`assert (ns.get('a'), ns.get('b'), ns.get('c')) == (2, 3, 1)` }],
        explain: py`The right side \`(b, c, a)\` is evaluated into the tuple \`(2, 3, 1)\` first; only then are the three names re-bound. Python never sees a half-updated state.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Binding, re-binding and letting go',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'x', label: 'x', note: 'name', x: 140, y: 80, tone: 'yellow' },
        { id: 'y', label: 'y', note: 'name', x: 140, y: 220, tone: 'yellow' },
        { id: 'o10', label: '10', note: 'int object', x: 560, y: 80 },
        { id: 'o20', label: '20', note: 'int object', x: 560, y: 220, tone: 'blue' },
      ],
      edges: [
        { id: 'x10', from: 'x', to: 'o10', label: 'x = 10' },
        { id: 'y10', from: 'y', to: 'o10', label: 'y = x' },
        { id: 'x20', from: 'x', to: 'o20', label: 'x = 20', dashed: true },
      ],
      steps: [
        { focus: ['o10'], text: py`\`x = 10\` — first Python evaluates the right-hand side and gets an **int object** \`10\`.` },
        { focus: ['x', 'o10'], edges: ['x10'], text: py`Then it **binds** the name \`x\` to that object. The name lives in the module's *namespace* (a table of names → objects); the object lives elsewhere in memory.` },
        { focus: ['y', 'o10'], edges: ['y10'], text: py`\`y = x\` copies the *arrow*, not the object. Both names now refer to one and the same \`10\`.` },
        { focus: ['x', 'o20'], edges: ['x20'], text: py`\`x = 20\` binds \`x\` to a different object. Only \`x\`'s arrow moves; \`y\` still points at \`10\`.` },
        { focus: ['o10'], text: py`When **no** name refers to an object any more, its memory can be reclaimed. CPython does this immediately using *reference counting*; other Python implementations may do it later. You never free memory by hand.` },
      ],
    },
    alt: 'Diagram with two names, x and y, on the left and two int objects, 10 and 20, on the right. x = 10 draws an arrow from x to 10. y = x draws a second arrow from y to the same 10. x = 20 moves x’s arrow to 20 while y still points to 10.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Behind the scenes, Python keeps a **namespace**: a lookup table from names to objects. For a script, it's the module's *global namespace*. You can even look at it — \`globals()\` returns it as a dictionary.`,
      { code: py`level = 3
player = "Ada"
print(globals()["player"])   # Ada
print("level" in globals())  # True`, lang: 'python', title: 'the namespace is a real dict' },
      py`When you use a name, Python looks it up in that table. If it isn't there you get \`NameError: name '…' is not defined\`.`,
    ],
    technical: [
      py`Every object has three things: an **identity** (\`id(obj)\`, never changes while the object is alive), a **type** (\`type(obj)\`, decides what operations work) and a **value**. Assignment only ever deals with identity: it makes a name refer to an object.`,
      py`Objects whose value can't change are **immutable** (int, float, str, tuple, bool, None). Operations on them produce *new* objects. Objects that can change in place are **mutable** (list, dict, set, most class instances). This is why \`squad.append("Cy")\` is visible through \`team\` — there is only one list.`,
      py`Augmented assignment (\`+=\`) first asks the object to update itself in place (\`__iadd__\`). Mutable lists do that; immutable ints can't, so Python falls back to \`x = x + y\` and re-binds the name. Same syntax, different effect — see [mutability & copying](lesson:mutability-and-copying).`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython (the standard interpreter), \`id()\` happens to be the object's memory address, and small integers from -5 to 256 are created once and shared, so \`a = 100; b = 100; a is b\` is \`True\`. That is an implementation optimisation, not a language rule — never rely on it. Compare values with \`==\`, see [None, truthiness & identity](lesson:none-and-truthiness).` },
    ],
    production: [
      py`Good names are documentation that can't go out of date. Prefer \`unpaid_invoices\` over \`data2\`, and \`seconds\` over \`t\` when the unit matters. Long, clear names cost nothing at runtime.`,
      py`Inside functions, CPython stores local variables in a fast array instead of a dictionary, which is one reason code inside functions runs a little faster than the same code at module level. (Measure before you care.)`,
      py`Don't recycle one name for unrelated values (\`data = load(); data = len(data)\`). Linters such as Ruff and type checkers flag shadowed built-ins and re-assigned names with a different type, catching bugs before they ship — see [code quality tools](lesson:code-quality-tools).`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting b = a to copy a list',
      wrong: { code: py`original = [3, 1, 2]
backup = original
original.sort()
print(backup)   # [1, 2, 3] — the "backup" changed too!`, lang: 'python' },
      right: { code: py`original = [3, 1, 2]
backup = original.copy()   # or list(original), or original[:]
original.sort()
print(backup)   # [3, 1, 2]`, lang: 'python' },
      explanation: py`Assignment never copies. \`backup = original\` makes a second name for the same list. Ask for a copy explicitly when you need one.`,
    },
    {
      title: 'Using a name before assigning it',
      wrong: { code: py`print(total)
total = 0`, lang: 'python' },
      right: { code: py`total = 0
print(total)`, lang: 'python' },
      explanation: py`Python runs top to bottom. On line 1 the name \`total\` doesn't exist yet, so you get \`NameError: name 'total' is not defined\`.`,
    },
    {
      title: 'Shadowing a built-in function',
      wrong: { code: py`list = ["eggs", "milk"]
numbers = list(range(3))   # TypeError: 'list' object is not callable`, lang: 'python' },
      right: { code: py`shopping = ["eggs", "milk"]
numbers = list(range(3))`, lang: 'python' },
      explanation: py`Naming a variable \`list\`, \`str\`, \`input\` or \`sum\` hides the built-in for the rest of the module. The error appears far from the cause, which makes it confusing.`,
    },
    {
      title: 'Invalid names',
      wrong: { code: py`1st_place = "Ada"
high-score = 10`, lang: 'python', static: true },
      right: { code: py`first_place = "Ada"
high_score = 10`, lang: 'python' },
      explanation: py`Names can't start with a digit and can't contain \`-\` (Python reads \`high-score\` as \`high minus score\`). Both lines are a \`SyntaxError\`, so nothing in the file runs.`,
    },
  ],
  debugging: [
    {
      symptom: py`NameError: name 'scroe' is not defined`,
      cause: py`A typo, or using the name before the line that assigns it ran.`,
      fix: py`Check the spelling against the assignment (Python suggests close matches: *Did you mean: 'score'?*), and make sure the assignment runs first.`,
    },
    {
      symptom: py`TypeError: 'str' object is not callable`,
      cause: py`A variable has shadowed a function name, e.g. \`input = input("Name? ")\` and later \`input(...)\` again.`,
      fix: py`Rename the variable (\`name = input("Name? ")\`). Search the file for an assignment to the function's name.`,
    },
    {
      symptom: py`Changing one variable unexpectedly changes another.`,
      cause: py`Both names refer to the same mutable object (aliasing).`,
      fix: py`Print \`id(a) == id(b)\` (or \`a is b\`) to confirm, then copy explicitly: \`b = a.copy()\`.`,
    },
  ],
  bestPractices: [
    'Choose names that say what a value means, including units: delay_seconds, price_pence.',
    'Use snake_case for variables, UPPER_SNAKE_CASE for constants, CapWords for classes.',
    'Never name variables after built-ins such as list, dict, str, input, sum, id or type.',
    'Use tuple assignment for swaps and for unpacking several values at once.',
    'When you need an independent copy of a mutable object, make the copy explicit.',
  ],
  useCases: [
    'Remembering user input so you can use it later (name = input("Name? ")).',
    'Giving a magic number a meaning (VAT_RATE = 0.2 instead of 0.2 scattered through code).',
    'Keeping running totals and counters in loops.',
    'Holding intermediate results so long expressions become readable steps.',
  ],
  comparison: {
    title: 'Two mental models of variables',
    headers: ['', '"Box" model (C, Java primitives)', '"Name tag" model (Python)'],
    rows: [
      ['x = 10', 'puts 10 inside the box called x', 'binds the name x to an int object 10'],
      ['y = x', 'copies the value into box y', 'binds y to the same object'],
      ['x = 20', 'overwrites the contents of box x', 'moves the tag x to another object'],
      ['type lives on…', 'the variable (declared up front)', 'the object (a name can refer to anything)'],
    ],
    note: py`Python names have no type of their own: \`x = 10\` then \`x = "ten"\` is legal. Type hints (see [type hints](lesson:type-hints)) let tools check that you don't do that by accident.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'variables-and-names-q1',
      type: 'mcq',
      prompt: py`\`team\` refers to a list. What does \`squad = team\` do?`,
      options: [
        { text: 'Creates a copy of the list called squad', why: 'Assignment never copies. You would need team.copy() or list(team) for that.' },
        'Makes squad a second name for the same list object',
        { text: 'Links the names, so re-assigning squad later also re-assigns team', why: 'Re-assigning squad (squad = [...]) moves only squad’s tag. The link is to the object, not between the names.' },
        { text: 'Raises an error because lists cannot be assigned', why: 'Any object can be bound to a name.' },
      ],
      answer: 1,
      explanation: py`Both names now point at one list. Mutating it through either name (\`squad.append(...)\`) is visible through both; re-binding one name doesn't affect the other.`,
    },
    {
      id: 'variables-and-names-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`x = 5
y = x
x = x + 1
print(x, y)`,
      answer: '6 5',
      accept: ['6 5'],
      explanation: py`\`x + 1\` creates a new int \`6\` and only \`x\` is re-bound to it. \`y\` still refers to \`5\`.`,
    },
    {
      id: 'variables-and-names-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`a = [1, 2]
b = a
b.append(3)
print(a)`,
      options: [
        { text: '[1, 2]', why: 'That would be true only if b were a copy. b = a binds b to the same list.' },
        '[1, 2, 3]',
        { text: 'AttributeError', why: 'Lists do have an append() method.' },
      ],
      answer: 1,
      explanation: py`There is only one list. \`append\` mutates it in place, so both \`a\` and \`b\` see \`[1, 2, 3]\`.`,
    },
    {
      id: 'variables-and-names-q4',
      type: 'bug',
      prompt: 'This program crashes before printing anything useful. Click the line that causes the error.',
      code: py`print("Welcome,", username)
username = "ada_l"
print("Logged in as", username)`,
      answerLine: 1,
      explanation: py`Python runs top to bottom. When line 1 runs, \`username\` hasn't been assigned yet: \`NameError: name 'username' is not defined\`. Move the assignment above the first use.`,
    },
    {
      id: 'variables-and-names-q5',
      type: 'fill',
      prompt: 'Complete the one-line swap so the program prints `blue red`.',
      code: py`a = "red"
b = "blue"
a, b = ___, ___
print(a, b)`,
      answer: [['b'], ['a']],
      explanation: py`The right-hand side \`b, a\` is evaluated into the tuple \`("blue", "red")\` first, then unpacked into \`a\` and \`b\`.`,
    },
    {
      id: 'variables-and-names-q6',
      type: 'mcq',
      prompt: 'Which of these is a valid Python variable name that also follows PEP 8?',
      options: [
        { text: 'High-Score', why: 'The hyphen is the minus operator, so this is a SyntaxError.' },
        { text: '2nd_score', why: 'Names cannot start with a digit.' },
        'second_score',
        { text: 'class', why: 'class is a keyword and cannot be used as a name.' },
      ],
      answer: 2,
      explanation: py`Letters, digits and underscores, not starting with a digit, not a keyword — and PEP 8 recommends \`snake_case\` for variables.`,
    },
    {
      id: 'variables-and-names-q7',
      type: 'short',
      prompt: 'In your own words: why does `score += 1` not change the int object that `score` referred to before?',
      answer: py`Ints are immutable: their value can never change. So \`score += 1\` computes a new int (old value + 1) and re-binds the name \`score\` to that new object. Any other name that pointed at the old int still sees the old value.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'swap-cups',
      title: 'Swap the drinks',
      difficulty: 'beginner',
      prompt: py`Two variables hold drink orders that were handed to the wrong people. Swap them so that \`left\` refers to \`"coffee"\` and \`right\` refers to \`"tea"\`, then print them on one line separated by a space.

The program must print exactly:

\`\`\`text
coffee tea
\`\`\`

Try doing the swap in **one line** without a third variable.`,
      files: {
        'main.py': py`left = "tea"
right = "coffee"

# TODO: swap left and right

print(left, right)
`,
      },
      hints: [
        'Python can assign several names at once: a, b = 1, 2.',
        'The right-hand side is evaluated completely before any name changes.',
        'left, right = right, left',
      ],
      solution: {
        explanation: py`\`left, right = right, left\` first builds the tuple \`("coffee", "tea")\` from the current values, then unpacks it into the two names. No temporary variable is needed because nothing is overwritten until the right side is finished.`,
        files: {
          'main.py': py`left = "tea"
right = "coffee"

left, right = right, left

print(left, right)
`,
        },
      },
      tests: [
        { name: 'left is now "coffee"', code: py`assert left == "coffee"` },
        { name: 'right is now "tea"', code: py`assert right == "tea"` },
        { name: 'prints "coffee tea"', code: py`assert output.strip() == "coffee tea"` },
      ],
    },
    {
      id: 'piggy-bank',
      title: 'Piggy bank',
      difficulty: 'beginner',
      prompt: py`A piggy bank holds \`coins = 12\` coins, each worth \`coin_value = 2\`.

1. Create a variable \`savings\` that holds the total value (coins × value).
2. You spend 5 on a comic: reduce \`savings\` by 5 using \`-=\`.
3. Print exactly \`Savings: 19\` (use \`print("Savings:", savings)\`).`,
      files: {
        'main.py': py`coins = 12
coin_value = 2
savings = 0

# TODO: work out the savings, then spend 5

print("Savings:", savings)
`,
      },
      hints: [
        'Multiplication uses *: coins * coin_value.',
        'Re-bind savings to coins * coin_value, then use savings -= 5.',
        'savings = coins * coin_value\nsavings -= 5',
      ],
      solution: {
        explanation: py`\`savings = coins * coin_value\` binds \`savings\` to \`24\`. \`savings -= 5\` is shorthand for \`savings = savings - 5\`, which re-binds it to \`19\`. Using the names instead of typing \`24 - 5\` means the program still works if the number of coins changes.`,
        files: {
          'main.py': py`coins = 12
coin_value = 2
savings = coins * coin_value

savings -= 5

print("Savings:", savings)
`,
        },
      },
      tests: [
        { name: 'savings ends at 19', code: py`assert savings == 19` },
        { name: 'prints "Savings: 19"', code: py`assert output.strip() == "Savings: 19"` },
        { name: 'still uses the coins and coin_value names', code: py`assert coins == 12 and coin_value == 2` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'variables-and-names-what-is-variable',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a variable in Python?',
      answer: 'A name bound to an object. Assignment binds the name to whatever object the right-hand side evaluates to; the name has no type of its own and never contains the object.',
      explanation: py`Python separates *names* (entries in a namespace) from *objects* (values in memory with an identity, a type and a value). \`x = 10\` binds \`x\` to an int object. \`y = x\` binds \`y\` to the same object. Re-assigning \`x\` moves only \`x\`.`,
      code: { lang: 'python', code: py`x = [1, 2]
y = x
y.append(3)
print(x)        # [1, 2, 3] — one list, two names
x = "now a string"
print(y)        # [1, 2, 3] — y never moved` },
      whyAsked: 'It tests whether you understand reference semantics, which underlies aliasing bugs, mutable defaults and argument passing.',
      mistakes: ['Saying a variable is "a box that stores a value"', 'Claiming Python copies values on assignment', 'Confusing re-binding a name with mutating an object'],
      followUps: ['What is the difference between mutating and re-binding?', 'How are arguments passed to functions in Python?', 'What does id() return?'],
      modelAnswer: 'In Python a variable is just a name that refers to an object. When I write x = 10, Python evaluates the right side to get an int object and then binds the name x to it in the current namespace. Assignment never copies: y = x makes y refer to the very same object. That matters for mutable objects — if two names point at one list, appending through either is visible through both. Re-assigning a name, on the other hand, only moves that one name. So I keep "binding names" and "mutating objects" as two separate ideas.',
    },
    {
      id: 'variables-and-names-plus-equals-list',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What do the two print calls show, and why are they different?',
      code: { lang: 'python', code: py`a = [1]
b = a
a = a + [2]
print(b)

c = [1]
d = c
c += [2]
print(d)` },
      options: ['[1] and [1]', '[1, 2] and [1, 2]', '[1] and [1, 2]', '[1, 2] and [1]'],
      correctOption: 2,
      answer: '`[1]` then `[1, 2]`. `a + [2]` builds a new list and re-binds `a`, while `c += [2]` extends the existing list in place.',
      explanation: py`For lists, \`+\` returns a new list (\`__add__\`), so \`b\` keeps the original. \`+=\` calls \`__iadd__\`, which mutates the list in place and then re-binds \`c\` to that same object, so \`d\` sees the change. For immutable types like int or tuple there is no in-place version, so \`+=\` always creates a new object.`,
      whyAsked: 'It separates people who memorised "x += y means x = x + y" from people who understand mutability.',
      mistakes: ['Assuming += is always exactly x = x + y', 'Forgetting that lists are mutable'],
      followUps: ['What happens with tuples instead of lists?', 'What does `t = ([1],); t[0] += [2]` do?'],
      modelAnswer: 'The first prints [1] and the second prints [1, 2]. a + [2] calls list.__add__, which builds a brand-new list, and then a is re-bound to it, so b still points at the old one. c += [2] calls list.__iadd__, which extends the existing list in place, so d — another name for the same list — sees the change. With immutable types like ints or tuples there is no in-place operation, so += always makes a new object. That difference is why I think of += as "update in place if the object allows it".',
    },
    {
      id: 'variables-and-names-small-int-cache',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'In CPython, `a = 256; b = 256; a is b` is `True`, but the same check with numbers computed at runtime, like `int("257")`, can be `False`. Why — and what should code do instead?',
      code: { lang: 'python', code: py`a = int("256")
b = int("256")
print(a is b)   # True in CPython

c = int("257")
d = int("257")
print(c is d)   # False in CPython
print(c == d)   # True everywhere` },
      answer: 'CPython pre-creates and reuses the ints from -5 to 256, so every 256 is the same object. Larger ints are created fresh, so two equal values can be different objects. Compare numbers with ==, never with is.',
      explanation: py`\`is\` compares identity (same object), \`==\` compares value. The small-int cache is a CPython optimisation, not a language guarantee; constants in the same compiled block may also be shared, which is why results can vary between the REPL and a script. Code that relies on \`is\` for numbers or strings is buggy, and Python warns: \`SyntaxWarning: "is" with 'int' literal\`.`,
      whyAsked: 'Shows you can distinguish language guarantees from implementation details and know when identity matters.',
      mistakes: ['Saying Python "stores small numbers differently" as a language rule', 'Using is to compare strings or numbers'],
      followUps: ['When is using is correct?', 'What is string interning?', 'Why might the answer differ between a script and the REPL?'],
      modelAnswer: 'is checks whether two names refer to the same object, while == checks whether their values are equal. CPython keeps a cache of the integers from -5 to 256, so every 256 you create is literally the same object and is returns True. Bigger numbers created at runtime are separate objects, so is can be False even though the values match. That cache is an implementation detail — other interpreters or even constant folding can change the result — so the rule is to use == for values and reserve is for singletons like None.',
    },
    {
      id: 'variables-and-names-config-alias',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate writes `settings = DEFAULT_SETTINGS` and then `settings["theme"] = "dark"` for one user. Suddenly every new user gets the dark theme. Explain the bug and fix it.',
      answer: 'settings and DEFAULT_SETTINGS are two names for one dict, so the update mutated the shared defaults. Copy the defaults per user: settings = dict(DEFAULT_SETTINGS) (or copy.deepcopy for nested data).',
      explanation: py`Assignment binds a second name; it never copies. Because dicts are mutable, writing through \`settings\` changes the module-level \`DEFAULT_SETTINGS\` that every later user starts from. A shallow copy is enough for flat dicts; nested lists/dicts inside need \`copy.deepcopy\` or a factory function that builds fresh defaults.`,
      code: { lang: 'python', code: py`DEFAULT_SETTINGS = {"theme": "light", "font_size": 14}

def settings_for_new_user():
    return dict(DEFAULT_SETTINGS)   # a fresh copy every time` },
      whyAsked: 'Aliasing bugs in shared configuration and caches are common in real services.',
      mistakes: ['Blaming the dict for being "global"', 'Fixing it with deepcopy everywhere without explaining why'],
      followUps: ['When is a shallow copy not enough?', 'How would you make DEFAULT_SETTINGS impossible to mutate? (types.MappingProxyType)'],
      modelAnswer: 'The assignment did not copy anything — settings is just another name for the DEFAULT_SETTINGS dict, so the update mutated the shared defaults and every later user sees it. The fix is to give each user their own dict, for example dict(DEFAULT_SETTINGS) or a small factory function. If the defaults contain nested mutable values, a shallow copy would still share those, so I would use copy.deepcopy or build the defaults fresh. I might also expose the defaults as a read-only MappingProxyType so this mistake fails loudly.',
    },
    {
      id: 'variables-and-names-rotate',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 4,
      question: 'Write `rotate(a, b, c)` that returns the three values rotated left: `rotate(1, 2, 3)` → `(2, 3, 1)`. Use tuple packing — no temporary variables.',
      answer: 'return b, c, a',
      explanation: py`\`return b, c, a\` builds and returns a tuple. Tuple packing and unpacking let Python swap or rotate any number of values in one expression because the right side is fully evaluated first.`,
      starter: { files: { 'main.py': py`def rotate(a, b, c):
    # TODO: return the values rotated left
    return a, b, c


print(rotate(1, 2, 3))
` } },
      tests: [
        { name: 'rotate(1, 2, 3) == (2, 3, 1)', code: py`assert rotate(1, 2, 3) == (2, 3, 1)` },
        { name: 'works with strings', code: py`assert rotate("x", "y", "z") == ("y", "z", "x")` },
      ],
      solution: { files: { 'main.py': py`def rotate(a, b, c):
    return b, c, a


print(rotate(1, 2, 3))
` } },
      hints: ['A comma creates a tuple: return x, y, z returns (x, y, z).', 'The first value moves to the end.'],
      whyAsked: 'A warm-up that checks fluency with tuple packing/unpacking, used constantly in idiomatic Python.',
      mistakes: ['Using temporary variables in Python where unpacking is clearer', 'Returning a list when a tuple was asked for'],
      followUps: ['How would you rotate a list of any length? (items[1:] + items[:1], or collections.deque.rotate)'],
      modelAnswer: 'I would simply return b, c, a. The commas pack the three values into a tuple, and because Python evaluates the whole right-hand side before returning, there is no need for temporary variables. For a list of arbitrary length I would use slicing, items[1:] + items[:1], or collections.deque with rotate(-1) if I need to do it repeatedly.',
    },
    {
      id: 'variables-and-names-namespaces',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Where do Python variables "live", and what does `del x` actually delete?',
      answer: 'Names live in namespaces — dict-like mappings from names to objects (module globals, function locals, class bodies, instance __dict__). del x removes the name binding; the object is freed only when nothing else refers to it.',
      explanation: py`Module-level names are stored in the module's \`__dict__\` (what \`globals()\` returns). Function locals are compiled into fast slots in CPython. \`del x\` unbinds \`x\` in the current namespace; afterwards using \`x\` raises \`NameError\`. The object itself survives as long as any other reference exists — in CPython it is reclaimed immediately when its reference count drops to zero, and cycles are collected by the garbage collector (see [memory management](lesson:memory-management)).`,
      whyAsked: 'Probes depth: namespaces, scope and object lifetime are the foundation of closures, imports and memory behaviour.',
      mistakes: ['Saying del frees memory', 'Thinking locals are stored in a dict in CPython (they are exposed as one, but stored in fast slots)'],
      followUps: ['What is the LEGB rule?', 'How does CPython decide when to free an object?', 'What is the difference between globals() and vars(obj)?'],
      modelAnswer: 'Variables live in namespaces, which are basically mappings from names to objects: each module has a global namespace, each function call has its own local namespace, and classes and instances have their own __dict__. del x does not destroy an object — it removes the name x from the current namespace. The object stays alive while anything else still refers to it; CPython frees it as soon as its reference count reaches zero, and the cyclic garbage collector handles reference cycles. So del is about names, and memory management is automatic.',
    },
  ],

  takeaways: [
    'A variable is a name bound to an object; assignment evaluates the right side first, then binds the name.',
    'Assignment never copies. Two names can refer to the same object — changes made through a mutable object are visible through both.',
    'Re-binding a name (x = …) moves only that name; it never changes the object it used to point to.',
    'Names: letters, digits and underscores, no leading digit, not a keyword; use snake_case and never shadow built-ins.',
    'Tuple assignment (a, b = b, a) swaps and unpacks in one step because the right side is built first.',
    'id() and the small-int cache are CPython details — compare values with ==, not is.',
  ],
}
