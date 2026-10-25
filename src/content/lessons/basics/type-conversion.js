// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CAFE_ORDER = py`# Café order: everything from input() is text until we convert it
item = input("Item: ")
quantity_text = input("Quantity: ")
price_text = input("Price each: ")

print("Raw values:", repr(quantity_text), repr(price_text))
print("Types:", type(quantity_text).__name__, type(price_text).__name__)

quantity = int(quantity_text)     # "3"    -> 3
price = float(price_text)         # "2.50" -> 2.5
total = quantity * price          # int * float -> float

print("Converted:", type(quantity).__name__, type(price).__name__, type(total).__name__)
print(quantity, "x", item, "=", total)
print("Receipt line: " + item + " x" + str(quantity))
`

const STDIN = 'flat white\n3\n2.50'

export default {
  id: 'type-conversion',
  title: 'Types & type conversion',
  summary: 'Every value has a type; type() and isinstance() tell you which, and int(), float(), str() and bool() convert between them — explicitly, because Python never silently turns "3" into 3.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['numbers-and-math', 'first-program'],
  related: ['none-and-truthiness', 'booleans-and-comparisons', 'first-program', 'try-except', 'input-validation', 'type-hints', 'special-methods'],
  tags: ['types', 'type()', 'isinstance', 'type conversion', 'casting', 'int()', 'float()', 'str()', 'bool()', 'repr', 'input', 'ValueError', 'TypeError', 'strong typing', 'dynamic typing', 'implicit conversion', 'coercion', 'parsing'],
  apis: [
    { name: 'type(obj)', summary: 'Returns the object’s class, e.g. <class \'int\'>. type(obj).__name__ gives just \'int\'.' },
    { name: 'isinstance(obj, cls)', summary: 'True if obj is an instance of cls or a subclass; cls can be a tuple of classes.' },
    { name: 'int(x) / int(text, base)', summary: 'Whole number from a str (whitespace and underscores allowed) or a number (truncates toward zero).' },
    { name: 'float(x)', summary: 'Float from a str such as "3.5", "1e3" or "inf", or from a number.' },
    { name: 'str(x)', summary: 'Human-readable text for any object.' },
    { name: 'repr(x)', summary: 'Developer-oriented text: shows quotes around strings, useful when debugging.' },
    { name: 'bool(x)', summary: 'True or False using the truthiness rules: only "empty" values are False.' },
  ],
  docs: [
    { label: 'Built-in functions — int(), float(), str(), bool(), type(), isinstance()', url: 'https://docs.python.org/3/library/functions.html' },
    { label: 'Built-in types — numeric types and conversions', url: 'https://docs.python.org/3/library/stdtypes.html#numeric-types-int-float-complex' },
    { label: 'Built-in types — truth value testing', url: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing' },
    { label: 'Glossary — duck typing, EAFP', url: 'https://docs.python.org/3/glossary.html#term-duck-typing' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every value in Python has a **type** — the kind of thing it is: \`int\` (whole number), \`float\` (decimal number), \`str\` (text), \`bool\` (\`True\`/\`False\`), and many more. The type decides what you can do with a value: you can divide numbers, but not text; you can make text uppercase, but not numbers.`,
    py`Often you have a value of one type but need another. The classic case is [\`input()\`](lesson:first-program), which *always* returns text: the user types \`15\`, and you get the string \`"15"\`. **Type conversion** turns it into what you need:`,
    { code: py`age_text = "15"          # a str
age = int(age_text)      # an int: 15
print(age + 1)           # 16`, lang: 'python', title: 'converting text to a number' },
    py`Python converts between numbers automatically when it's safe (an int meeting a float becomes a float), but it **never** silently converts between text and numbers. \`"3" + 4\` is an error, not \`"34"\` or \`7\`. You'll learn \`type()\` and \`isinstance()\` to inspect types, the four conversion functions \`int()\`, \`float()\`, \`str()\` and \`bool()\`, and what happens when a conversion fails.`,
  ],
  why: [
    py`Real data arrives as text: keyboard input, files, web forms, CSV spreadsheets, JSON from APIs, command-line arguments. Before you can add up prices, compare ages or sort scores, you must convert that text into numbers — correctly, and safely when the text is rubbish.`,
    py`Type confusion causes some of the most common beginner bugs: \`"5" + "3"\` giving \`"53"\`, \`"10" < "9"\` being \`True\`, \`bool("False")\` being \`True\`. Knowing exactly what each conversion does — and doesn't do — makes those bugs obvious.`,
  ],
  eli15: [
    py`Think of types as **shapes of Lego bricks**. A number brick and a text brick look different and connect in different ways. You can stack two number bricks with \`+\` to get a bigger number, or two text bricks to make longer text — but a number brick doesn't fit onto a text brick.`,
    py`**Converting** is like using a brick-changing machine: put in the text brick \`"15"\`, ask for a number, get the number brick \`15\` out. If you put in the text brick \`"fifteen"\`, the machine jams — that's a \`ValueError\`.`,
    py`Python refuses to guess. If you try \`"3" + 4\`, it won't decide for you whether you meant \`"34"\` or \`7\` — it stops and tells you the bricks don't fit.`,
  ],
  analogy: {
    title: 'Currency exchange at the airport',
    body: [
      py`You can't pay for a sandwich in Paris with pounds — you visit the exchange desk and ask, explicitly, to convert. The desk will happily turn £20 into euros, but it rejects a crumpled note that isn't money at all.`,
      py`Python works the same way: different types are different currencies. The conversion functions are exchange desks. Shops (operators like \`+\`) only accept matching currency, and nobody converts behind your back — except for a few "obviously safe" cases, like a whole number being accepted as a decimal.`,
    ],
    mapping: [
      ['different currencies', 'different types: int, float, str, bool'],
      ['the exchange desk', 'int(), float(), str(), bool()'],
      ['asking for euros explicitly', 'int("15") — explicit conversion'],
      ['a note that isn’t real money', 'int("fifteen") → ValueError'],
      ['a shop that only takes one currency', '"3" + 4 → TypeError'],
      ['coins accepted anywhere as small change', 'int automatically promoted to float: 3 + 0.5'],
      ['checking which currency is in your wallet', 'type(x) or isinstance(x, int)'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch conversions create new objects',
    props: {
      code: py`text = "42"
number = int(text)
price = float("3.50")
total = number * price
label = "Total: " + str(total)
print(label)
print(type(text), type(number), type(total))
`,
      inline: false,
      notes: {
        1: 'A **str** object: the characters "4" and "2". Not a number yet.',
        2: '`int()` reads the text and builds a **new int object**, 42. `text` still points at the string — conversion never changes the original.',
        3: '`float()` parses the text "3.50" into the float 3.5.',
        4: 'int × float: Python automatically promotes the int, so the result is a **float**, 147.0.',
        5: '`"Total: " + total` would be a TypeError. `str(total)` makes text, so `+` can join two strings.',
      },
    },
    alt: 'A step-by-step trace with every object drawn separately. text points to the string "42". int(text) creates a separate int object 42 that number points to; text still points to the string. price points to the float 3.5. total points to the float 147.0. label points to the string "Total: 147.0", which is printed, followed by <class \'str\'> <class \'int\'> <class \'float\'>.',
    caption: py`Watch the objects on the right: every conversion builds a **new** object of the new type. The original value is untouched — strings and numbers are immutable.`,
  },
  syntax: [
    py`#### Inspecting types`,
    { code: py`print(type(42))              # <class 'int'>
print(type("42"))            # <class 'str'>
print(type(42).__name__)     # int
print(isinstance(42, int))               # True
print(isinstance(3.5, (int, float)))     # True — any of several types
print(isinstance(True, int))             # True — bool is a kind of int`, lang: 'python', title: 'type() and isinstance()' },
    py`Prefer \`isinstance(x, int)\` over \`type(x) == int\` when *checking* types: it accepts subclasses and several types at once. Use \`type()\` when exploring or debugging.`,
    py`#### The four everyday conversions`,
    py`| call | gives | notes |
|---|---|---|
| \`int("42")\` | \`42\` | surrounding whitespace, a sign and underscores are fine: \`int(" -1_000 ")\` → \`-1000\` |
| \`int(3.99)\` | \`3\` | from a float: chops toward zero (\`int(-3.99)\` → \`-3\`); use \`round()\` to round |
| \`int("3.5")\` | \`ValueError\` | the text must be a *whole* number; use \`int(float("3.5"))\` if you mean it |
| \`int("ff", 16)\` | \`255\` | text in another base: 2, 8, 16… |
| \`float("2.50")\` | \`2.5\` | also \`"1e3"\` → \`1000.0\`, \`"inf"\`, \`"nan"\` |
| \`float(7)\` | \`7.0\` | |
| \`str(3.0)\` | \`"3.0"\` | any object → text: \`str(None)\` → \`"None"\` |
| \`bool(0)\`, \`bool("")\` | \`False\` | only "empty" values are falsy… |
| \`bool("False")\`, \`bool("0")\` | \`True\` | …so any non-empty string is \`True\`! |`,
    py`#### Converting input`,
    { code: py`age = int(input("Age: "))               # whole numbers
height = float(input("Height (m): "))   # decimals
name = input("Name: ").strip()          # already a str — just tidy the spaces`, lang: 'python', title: 'convert straight away' },
    py`If the text isn't a valid number, the conversion raises \`ValueError: invalid literal for int() with base 10: 'fifteen'\`. You'll learn to catch it and ask again in [try/except](lesson:try-except).`,
    py`#### Implicit conversion: only between numbers`,
    { code: py`print(3 + 0.5)       # 3.5   int is promoted to float automatically
print(True + 1)      # 2     bool is a kind of int
print(10 / 2)        # 5.0   / always gives a float
print("3" * 4)       # 3333  NOT a conversion: repeating a string 4 times`, lang: 'python', title: 'what Python converts for you' },
    { code: py`"3" + 4      # TypeError: can only concatenate str (not "int") to str
4 + "3"      # TypeError: unsupported operand type(s) for +: 'int' and 'str'`, lang: 'python', static: true, title: 'what it refuses to guess' },
    { callout: 'note', title: 'Dynamic but strong', text: py`Python is **dynamically typed**: a *name* has no fixed type (\`x = 5\` then \`x = "five"\` is allowed). But it's **strongly typed**: *values* don't silently change type to make an operation work. JavaScript, by contrast, evaluates \`"3" + 4\` to \`"34"\`. Python's refusal catches bugs early.` },
  ],
  walkthrough: {
    title: 'Reading the café order line by line',
    lang: 'python',
    code: CAFE_ORDER,
    intro: py`This is the program in the playground below (the Input tab is pre-filled with *flat white*, *3*, *2.50*). Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 4], text: py`Three \`input()\` calls, three strings. Even though the user typed digits, \`quantity_text\` is \`"3"\` and \`price_text\` is \`"2.50"\`.` },
      { lines: [6], text: py`\`repr()\` shows a value the way you'd write it in code — strings *with quotes* — so you can see they're text: \`'3' '2.50'\`.` },
      { lines: [7], text: py`\`type(x).__name__\` gives the type's name as a plain string: \`str str\`.` },
      { lines: [9, 10], text: py`The conversions. \`int("3")\` → \`3\`; \`float("2.50")\` → \`2.5\`. If the text weren't a valid number, these lines would raise \`ValueError\`.` },
      { lines: [11], text: py`An int times a float: Python promotes the int, so \`total\` is the float \`7.5\`.` },
      { lines: [14], text: py`Passing several values to \`print\` needs no conversion — \`print\` calls \`str()\` on each one for you.` },
      { lines: [15], text: py`Building one string with \`+\` *does* need conversion: \`" x" + quantity\` would be a TypeError, so \`str(quantity)\` turns \`3\` into \`"3"\` first.` },
    ],
  },
  playground: {
    title: 'Café order',
    objective: 'Run it to see text become numbers, then break it with bad input and make it more robust.',
    files: { 'main.py': CAFE_ORDER },
    stdin: STDIN,
    expected: py`With the pre-filled Input tab (*flat white*, *3*, *2.50*):

\`\`\`text
Item: flat white
Quantity: 3
Price each: 2.50
Raw values: '3' '2.50'
Types: str str
Converted: int float float
3 x flat white = 7.5
Receipt line: flat white x3
\`\`\``,
    experiments: [
      {
        id: 'string-plus-number',
        task: py`On the last line, remove the \`str(...)\` around \`quantity\` so it reads \`" x" + quantity\`. Run it and read the error. Then put \`str()\` back.`,
        hint: py`Read the last line of the traceback: which two types does it name?`,
        explain: py`\`TypeError: can only concatenate str (not "int") to str\`. \`+\` between strings joins them; between numbers it adds. Between a str and an int, Python refuses to guess which you meant. Convert explicitly, pass separate arguments to \`print\`, or use an f-string: \`f"Receipt line: {item} x{quantity}"\`.`,
      },
      {
        id: 'total-on-receipt',
        task: py`Extend the receipt line so it ends with \`= \` and the total, giving \`Receipt line: flat white x3 = 7.5\`. Keep using \`+\` to build the string.`,
        hint: py`Add \`+ " = " + str(total)\` to the end of the last line.`,
        tests: [{ name: 'receipt line shows the total', stdin: STDIN, code: py`assert 'Receipt line: flat white x3 = 7.5' in output` }],
        explain: py`Every non-string piece needs \`str()\` when you join with \`+\`. That's why f-strings are popular — \`f"{item} x{quantity} = {total}"\` converts automatically. See [f-strings](lesson:string-formatting).`,
      },
      {
        id: 'isinstance-check',
        task: py`At the end, add \`print(isinstance(quantity, int), isinstance(total, (int, float)), isinstance(quantity_text, int))\`. Predict the three answers first.`,
        hint: py`\`isinstance\` checks the type of the *value*. \`quantity_text\` is still the original string.`,
        tests: [{ name: 'prints True True False', stdin: STDIN, code: py`assert 'True True False' in output` }],
        explain: py`\`quantity\` is an int (\`True\`). \`total\` is a float, which matches the tuple \`(int, float)\` (\`True\`). \`quantity_text\` is still a str — converting made a *new* object and didn't change the old one (\`False\`).`,
      },
      {
        id: 'survive-bad-input',
        task: py`Type \`three\` as the quantity in the Input tab and run: \`ValueError\`. Make the program survive it by replacing the \`quantity = int(quantity_text)\` line with:

\`\`\`python
if quantity_text.strip().isdigit():
    quantity = int(quantity_text)
else:
    print("Not a whole number - using 1")
    quantity = 1
\`\`\``,
        hint: py`Keep the indentation exactly: 4 spaces inside the \`if\` and the \`else\`. \`.isdigit()\` is \`True\` when every character is a digit.`,
        tests: [
          { name: 'bad quantity falls back to 1', stdin: 'tea\nthree\n2.00', code: py`assert 'using 1' in output and '1 x tea = 2.0' in output` },
          { name: 'good quantity still works', stdin: STDIN, code: py`assert '3 x flat white = 7.5' in output` },
        ],
        explain: py`Checking before converting ("look before you leap") works for simple cases, but \`isdigit()\` has gaps: it rejects \`"-5"\`, and accepts characters such as \`"²"\` that \`int()\` can't convert. The robust Python approach is to just try the conversion and handle the \`ValueError\` — "easier to ask forgiveness than permission" — which you'll learn in [try/except](lesson:try-except) and [error-handling patterns](lesson:error-handling-patterns).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The conversion map',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'str', label: 'str', note: '"42", "3.5", "yes"', x: 110, y: 80, tone: 'yellow' },
        { id: 'int', label: 'int', note: '42', x: 390, y: 80, tone: 'blue' },
        { id: 'float', label: 'float', note: '3.5', x: 660, y: 80, tone: 'blue' },
        { id: 'bool', label: 'bool', note: 'True / False', x: 390, y: 255, tone: 'ink' },
        { id: 'err', label: 'ValueError', note: 'text that isn’t a number', x: 110, y: 255, tone: 'red' },
      ],
      edges: [
        { id: 'str-int', from: 'str', to: 'int', label: 'int()' },
        { id: 'int-str', from: 'int', to: 'str', label: 'str()' },
        { id: 'int-float', from: 'int', to: 'float', label: 'float() / auto' },
        { id: 'float-int', from: 'float', to: 'int', label: 'int() chops' },
        { id: 'str-err', from: 'str', to: 'err', label: 'bad text', dashed: true },
        { id: 'int-bool', from: 'int', to: 'bool', label: 'bool()' },
      ],
      steps: [
        { focus: ['str'], text: py`Data usually arrives as **text**: \`input()\`, files, web forms. \`"42"\` is two characters, not a number.` },
        { focus: ['str', 'int'], edges: ['str-int'], text: py`\`int("42")\` parses the text into the int \`42\`. Spaces around it, a \`+\`/\`-\` sign and underscores are allowed. \`float("3.5")\` does the same for decimals.` },
        { focus: ['err'], edges: ['str-err'], text: py`Text that isn't a valid number — \`"fifteen"\`, \`"3.5"\` for \`int()\`, \`"1,000"\`, \`""\` — raises **ValueError**. The type was right (a str); the *value* wasn't.` },
        { focus: ['int', 'str'], edges: ['int-str'], text: py`\`str()\` goes the other way and never fails: every object has a text form. You need it to join numbers into text with \`+\`.` },
        { focus: ['int', 'float'], edges: ['int-float'], text: py`int → float is the one conversion Python does **automatically**: \`3 + 0.5\` is \`3.5\`. It's safe because floats can hold whole numbers (exactly, up to 2⁵³).` },
        { focus: ['float', 'int'], edges: ['float-int'], text: py`float → int is never automatic, because information is lost. \`int(3.99)\` **chops** toward zero → \`3\`. Want rounding? \`round(3.99)\` → \`4\`.` },
        { focus: ['bool'], edges: ['int-bool'], text: py`\`bool()\` works on *anything*: empty or zero values (\`0\`, \`0.0\`, \`""\`, \`[]\`, \`None\`) → \`False\`; everything else → \`True\`. So \`bool("False")\` is \`True\` — it's a non-empty string! More in [truthiness](lesson:none-and-truthiness).` },
      ],
    },
    alt: 'A map of conversions. str converts to int with int(), and int back to str with str(). int converts to float with float() or automatically in arithmetic; float converts to int with int(), which chops the fraction. A dashed arrow from str to ValueError shows that text which is not a number fails. int converts to bool with bool().',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A conversion **never changes the original value**. \`int(text)\` reads \`text\` and builds a brand-new int object; \`text\` is still the same string afterwards. That's because ints, floats, strs and bools are *immutable* — they can't be changed in place (see [variables](lesson:variables-and-names)).`,
      py`Types belong to **values**, not names. \`x = "5"\` then \`x = int(x)\` re-binds the name \`x\` from a str object to a new int object. The name doesn't have a type; the object it points to does.`,
    ],
    technical: [
      py`\`int\`, \`float\`, \`str\` and \`bool\` aren't special "cast" operators — they're the **classes** themselves. Calling a class creates an instance, so \`int("42")\` is "make an int from this". That's why \`type(42) is int\` and why \`isinstance(x, int)\` works.`,
      py`Each conversion asks the object for help through special methods (see [special methods](lesson:special-methods)):`,
      py`- \`str(obj)\` calls \`obj.__str__()\`, which falls back to \`__repr__()\`;
- \`int(obj)\` uses \`obj.__int__()\` (or \`__index__()\`); for strings it parses the text instead;
- \`float(obj)\` uses \`obj.__float__()\` (or \`__index__()\`);
- \`bool(obj)\` uses \`obj.__bool__()\`, falls back to \`len(obj) != 0\`, and is \`True\` if neither exists.`,
      py`Implicit numeric promotion follows the "numeric tower": bool → int → float → complex. An operation between two numbers uses the wider type. \`Decimal\` and \`Fraction\` interoperate with int, but \`Decimal\` deliberately refuses to mix with float.`,
      py`\`int()\` on text accepts any Unicode *decimal* digits, so \`int("٣")\` (Arabic-Indic three) is \`3\`. But \`str.isdigit()\` also accepts characters like superscript \`"²"\`, which \`int()\` rejects — another reason to convert-and-catch rather than check-then-convert.`,
    ],
    production: [
      py`- **Validate at the boundary.** Convert and validate external data (forms, files, APIs) as soon as it enters your program, then work with proper types inside. Libraries such as pydantic (third-party) do this declaratively; [input validation](lesson:input-validation) covers the principles.
- **Prefer EAFP for parsing:** \`try: n = int(text) except ValueError: …\` handles every invalid case the parser knows about, instead of re-implementing its rules with \`isdigit()\`.
- **Locale-formatted numbers** like \`"1,299.00"\` or \`"1.299,00"\` aren't valid for \`float()\`; strip or translate separators deliberately, and use \`Decimal\` for money.
- **Type hints** (\`def total(quantity: int, price: float) -> float:\`) document expected types and let checkers such as mypy catch \`"3" + 4\`-style bugs *before* running — see [type hints](lesson:type-hints). They don't convert anything at runtime.
- **Never** use \`eval()\` to convert input — it executes arbitrary code. \`int()\`, \`float()\`, \`json.loads()\` and \`ast.literal_eval()\` are the safe parsers.`,
    ],
  },
  mistakes: [
    {
      title: 'Adding numbers that are still text',
      wrong: { code: py`a = "5"     # e.g. from input()
b = "3"
print(a + b)   # 53`, lang: 'python' },
      right: { code: py`a = int("5")
b = int("3")
print(a + b)   # 8`, lang: 'python' },
      explanation: py`\`+\` on two strings concatenates. No error, just a wrong answer — convert numeric text before doing maths.`,
    },
    {
      title: 'Trusting bool() to read "yes/no" text',
      wrong: { code: py`answer = "no"
subscribed = bool(answer)
print(subscribed)    # True!`, lang: 'python' },
      right: { code: py`answer = "no"
subscribed = answer.strip().lower() in ("yes", "y", "true")
print(subscribed)    # False`, lang: 'python' },
      explanation: py`\`bool()\` only checks whether a value is *empty*. Every non-empty string — including \`"no"\`, \`"False"\` and \`"0"\` — is \`True\`. Compare the text explicitly.`,
    },
    {
      title: 'Expecting int() to accept decimal text',
      wrong: { code: py`quantity = int("2.5")    # ValueError: invalid literal for int() with base 10: '2.5'`, lang: 'python', static: true },
      right: { code: py`quantity = float("2.5")          # 2.5
whole = int(float("2.5"))       # 2  (if truncating is really what you want)`, lang: 'python' },
      explanation: py`\`int()\` on a string requires a whole number. Decide what you actually want: a float, rounding, or an error telling the user to type a whole number.`,
    },
    {
      title: 'Using int() when you meant to round',
      wrong: { code: py`average = 7.9
print(int(average))     # 7`, lang: 'python' },
      right: { code: py`average = 7.9
print(round(average))   # 8`, lang: 'python' },
      explanation: py`\`int()\` on a float **truncates** (drops the fraction, toward zero). Use \`round()\`, \`math.floor()\` or \`math.ceil()\` to say what kind of rounding you mean — see [numbers](lesson:numbers-and-math).`,
    },
    {
      title: 'Comparing numeric text',
      wrong: { code: py`age = input("Age: ")
if age >= 18:          # TypeError: '>=' not supported between instances of 'str' and 'int'
    print("Adult")`, lang: 'python', static: true },
      right: { code: py`age = int(input("Age: "))
if age >= 18:
    print("Adult")`, lang: 'python', static: true },
      explanation: py`Ordering a str against an int raises \`TypeError\`. Worse, comparing two strings of digits "works" alphabetically (\`"10" < "9"\` is \`True\`). Convert first.`,
    },
    {
      title: 'Checking type(x) == int',
      wrong: { code: py`value = True
print(type(value) == int)       # False — but bool IS an int subtype`, lang: 'python' },
      right: { code: py`value = 3.5
print(isinstance(value, (int, float)))   # True — accepts subclasses and several types`, lang: 'python' },
      explanation: py`\`type(x) == cls\` ignores subclasses and only checks one type. \`isinstance\` is the idiomatic check. (Remember \`isinstance(True, int)\` is \`True\`; exclude bools explicitly when it matters.)`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: invalid literal for int() with base 10: 'three'`,
      cause: py`\`int()\` was given text that isn't a whole number: words, decimals (\`'2.5'\`), thousands separators (\`'1,000'\`), currency symbols, or an empty string.`,
      fix: py`Print \`repr(text)\` to see exactly what arrived (hidden spaces, newlines, empty string). Clean it (\`.strip()\`, \`.replace(",", "")\`) or catch \`ValueError\` and ask again.`,
    },
    {
      symptom: py`ValueError: could not convert string to float: ''`,
      cause: py`An empty string — often a blank line in a file, or the user pressing Enter without typing.`,
      fix: py`Check for empty input first, or handle the \`ValueError\` with a helpful message.`,
    },
    {
      symptom: py`TypeError: can only concatenate str (not "int") to str`,
      cause: py`Joining a number to text with \`+\`.`,
      fix: py`Use \`str(number)\`, pass separate arguments to \`print\`, or use an f-string.`,
    },
    {
      symptom: py`TypeError: int() argument must be a string, a bytes-like object or a real number, not 'NoneType'`,
      cause: py`The value is \`None\` — usually a function that didn't \`return\` anything, or a missing value from a dictionary.`,
      fix: py`Find where the value came from and make sure it's set. See [None & truthiness](lesson:none-and-truthiness).`,
    },
    {
      symptom: py`An if statement treats "False" or "0" as true.`,
      cause: py`\`bool()\` (or an \`if\`) on a non-empty string is always \`True\`.`,
      fix: py`Compare the text explicitly: \`text.strip().lower() in ("true", "yes", "1")\`.`,
    },
  ],
  bestPractices: [
    'Convert input as soon as it arrives: age = int(input("Age: ")).',
    'Use isinstance(x, (int, float)) for type checks, type(x) only for exploring and debugging.',
    'Use repr(value) when debugging conversions — it reveals quotes, spaces and newlines.',
    'Say what you mean when going from float to int: int() truncates, round() rounds, math.floor/ceil go down/up.',
    'Never use bool(text) to interpret "yes"/"no" — compare the text.',
    'Prefer f-strings over + and str() when building text from values.',
    'Handle bad input with try/except ValueError rather than hand-written digit checks.',
  ],
  useCases: [
    'Reading numbers from input(), command-line arguments or text files.',
    'Parsing CSV columns into ints, floats and booleans before analysing them.',
    'Building messages and file names from numbers with str() or f-strings.',
    'Validating API or form data at the boundary of a program.',
    'Converting between number bases: int("ff", 16), bin(5), hex(255).',
  ],
  comparison: {
    title: 'Explicit vs implicit conversion',
    headers: ['', 'Python does it for you?', 'example', 'result'],
    rows: [
      ['int → float in arithmetic', 'yes', '3 + 0.5', '3.5'],
      ['bool → int in arithmetic', 'yes', 'True + 1', '2'],
      ['any value → str inside print()', 'yes (print calls str)', 'print("Total:", 7.5)', 'Total: 7.5'],
      ['str → number', 'never', '"3" + 4', 'TypeError'],
      ['number → str with +', 'never', '"x" + 3', 'TypeError'],
      ['float → int', 'never', 'range(2.0)', 'TypeError'],
      ['anything → bool in if / and / or', 'yes (truthiness)', 'if "False":', 'the block runs!'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'type-conversion-q1',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print(int("42") + 1, "4" + "2", "4" * 2)`,
      answer: '43 42 44',
      accept: ['43 42 44'],
      explanation: py`\`int("42") + 1\` is arithmetic: \`43\`. \`"4" + "2"\` joins two strings: \`"42"\`. \`"4" * 2\` repeats the string twice: \`"44"\`. Only the first one is a number.`,
    },
    {
      id: 'type-conversion-q2',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`print(int(3.99), int(-3.99), round(3.99))`,
      options: [
        { text: '`4 -4 4`', why: 'int() does not round — it drops the fractional part.' },
        '`3 -3 4`',
        { text: '`3 -4 4`', why: 'int() truncates toward zero, so -3.99 becomes -3, not -4 (that would be math.floor).' },
        { text: '`3.0 -3.0 4.0`', why: 'int() and round() without ndigits return ints.' },
      ],
      answer: 1,
      explanation: py`\`int()\` on a float chops off the fraction toward zero: \`3\` and \`-3\`. \`round()\` rounds to the nearest whole number: \`4\`.`,
    },
    {
      id: 'type-conversion-q3',
      type: 'mcq',
      prompt: 'What is `bool("False")`?',
      options: [
        { text: 'False', why: 'bool() doesn’t read the words in a string. It only checks whether the string is empty.' },
        'True',
        { text: 'A ValueError', why: 'bool() accepts any object and never raises for strings.' },
        { text: 'None', why: 'bool() always returns True or False.' },
      ],
      answer: 1,
      explanation: py`\`"False"\` is a non-empty string, and every non-empty string is truthy. Only \`""\` converts to \`False\`. To interpret words, compare them: \`text == "True"\`.`,
    },
    {
      id: 'type-conversion-q4',
      type: 'bug',
      prompt: 'This crashes with a `TypeError` when run. Click the line that raises it.',
      code: py`age = input("Age: ")
print("You typed", age)
if age >= 18:
    print("You can vote!")`,
      answerLine: 3,
      explanation: py`\`age\` is a string, and \`"15" >= 18\` raises \`TypeError: '>=' not supported between instances of 'str' and 'int'\`. Fix line 1: \`age = int(input("Age: "))\`.`,
    },
    {
      id: 'type-conversion-q5',
      type: 'fill',
      prompt: 'Fill the blank so `quantity` is a whole number you can do maths with.',
      code: py`quantity = ___(input("How many tickets? "))
print("Total:", quantity * 12)`,
      answer: [['int']],
      explanation: py`\`input()\` returns a str; \`int(...)\` converts it to a whole number. Without it, \`quantity * 12\` would repeat the text twelve times!`,
    },
    {
      id: 'type-conversion-q6',
      type: 'mcq',
      prompt: 'Which of these raises a `ValueError`?',
      options: [
        { text: '`int(3.5)`', why: 'Converting a float to int is fine: it truncates to 3.' },
        { text: '`int(" 7 ")`', why: 'int() ignores surrounding whitespace, so this is 7.' },
        '`int("3.5")`',
        { text: '`float("3.5")`', why: 'That is valid decimal text for float(): 3.5.' },
      ],
      answer: 2,
      explanation: py`From a *string*, \`int()\` only accepts whole numbers. \`"3.5"\` is valid for \`float()\` but not \`int()\`: \`ValueError: invalid literal for int() with base 10: '3.5'\`.`,
    },
    {
      id: 'type-conversion-q7',
      type: 'short',
      prompt: 'Why does `3 + 4.0` work but `"3" + 4` raise a `TypeError`?',
      answer: py`Python only converts automatically when it's safe and unambiguous. Between numbers, an int can be promoted to a float without losing meaning, so 3 + 4.0 becomes 7.0. Between a string and a number, + could mean "join text" or "add numbers", so Python refuses to guess and raises TypeError — you must convert explicitly with int("3") or str(4). That's what "strongly typed" means.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'form-parser',
      title: 'Parse a sign-up form',
      difficulty: 'beginner',
      prompt: py`A web form sends every field as **text**:

\`\`\`python
age_text = "15"
height_text = "1.68"
newsletter_text = "no"
\`\`\`

Create three properly typed variables:

- \`age\` — an **int**;
- \`height\` — a **float**;
- \`newsletter\` — a **bool** that is \`True\` only when the text is \`"yes"\` (ignore case and surrounding spaces, so \`" YES "\` counts).

Then print \`15 1.68 False\` with \`print(age, height, newsletter)\`. The tests also try other form values.`,
      files: {
        'main.py': py`age_text = "15"
height_text = "1.68"
newsletter_text = "no"

# TODO: convert each field to the right type
age = age_text
height = height_text
newsletter = bool(newsletter_text)

print(age, height, newsletter)
`,
      },
      hints: [
        'int() and float() convert the first two. Run the starter: why does newsletter come out True?',
        'bool() only checks for an empty string — "no" isn’t empty. Compare the text instead: something == "yes".',
        'age = int(age_text)\nheight = float(height_text)\nnewsletter = newsletter_text.strip().lower() == "yes"',
      ],
      solution: {
        explanation: py`\`int()\` and \`float()\` parse the numeric text. The newsletter field is the trap: \`bool("no")\` is \`True\`, because \`bool()\` only asks "is this string empty?". A comparison expresses what we actually mean — and \`.strip().lower()\` first removes surrounding spaces and ignores case, so \`" YES "\` becomes \`"yes"\`. The comparison itself produces the bool.`,
        files: {
          'main.py': py`age_text = "15"
height_text = "1.68"
newsletter_text = "no"

age = int(age_text)
height = float(height_text)
newsletter = newsletter_text.strip().lower() == "yes"

print(age, height, newsletter)
`,
        },
      },
      tests: [
        { name: 'age is the int 15', code: py`assert age == 15 and type(age) is int` },
        { name: 'height is the float 1.68', code: py`assert height == 1.68 and type(height) is float` },
        { name: '"no" means False', code: py`assert newsletter is False` },
        { name: 'prints 15 1.68 False', code: py`assert output.strip() == "15 1.68 False"` },
        {
          name: '" YES " means True',
          code: py`env = {}
capture(exec, files['main.py'].replace('newsletter_text = "no"', 'newsletter_text = " YES "'), env)
assert env['newsletter'] is True, 'Strip spaces and ignore case before comparing with "yes"'`,
        },
        {
          name: 'other ages and heights',
          code: py`env = {}
capture(exec, files['main.py'].replace('age_text = "15"', 'age_text = "42"').replace('height_text = "1.68"', 'height_text = "1.9"'), env)
assert env['age'] == 42 and env['height'] == 1.9`,
        },
      ],
    },
    {
      id: 'score-average',
      title: 'Average of three scores',
      difficulty: 'beginner',
      prompt: py`The program asks for three whole-number test scores. Right now it prints nonsense like \`Total: 908580\`.

Fix it so that, for the inputs \`90\`, \`85\` and \`80\`, it prints exactly:

\`\`\`text
Total: 255
Average: 85.0
\`\`\`

\`total\` must be an **int**. Keep the three \`input()\` prompts as they are. (In the playground, type the three scores into the Input tab, one per line.)`,
      files: {
        'main.py': py`a = input("Score 1: ")
b = input("Score 2: ")
c = input("Score 3: ")

total = a + b + c
average = 0

print("Total:", total)
print("Average:", average)
`,
      },
      hints: [
        'What type does input() return? What does + do with that type?',
        'Convert each input with int() — either where you call input(), or when adding.',
        'a = int(input("Score 1: ")) (same for b and c), total = a + b + c, average = total / 3',
      ],
      solution: {
        explanation: py`\`input()\` returns strings, and \`"90" + "85" + "80"\` concatenates them into \`"908580"\`. Wrapping each \`input()\` in \`int()\` converts the scores straight away, so \`+\` adds numbers: \`255\`, an int. Dividing with \`/\` always gives a float, so the average is \`85.0\` even though the division is exact.`,
        files: {
          'main.py': py`a = int(input("Score 1: "))
b = int(input("Score 2: "))
c = int(input("Score 3: "))

total = a + b + c
average = total / 3

print("Total:", total)
print("Average:", average)
`,
        },
      },
      tests: [
        { name: '90, 85, 80', stdin: '90\n85\n80', code: py`assert "Total: 255" in output and "Average: 85.0" in output` },
        { name: 'total is an int', stdin: '90\n85\n80', code: py`assert type(total) is int` },
        { name: '10, 0, 5', stdin: '10\n0\n5', code: py`assert "Total: 15" in output and "Average: 5.0" in output` },
        { name: 'scores typed with spaces still work', stdin: ' 7 \n 8\n9 ', code: py`assert "Total: 24" in output and "Average: 8.0" in output` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'type-conversion-strong-dynamic',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Python is often described as "dynamically but strongly typed". What does that mean?',
      answer: 'Dynamic: types belong to objects, not variables, and are checked at runtime — a name can refer to an int now and a str later. Strong: Python does not implicitly convert between unrelated types to make an operation work, so "3" + 4 raises TypeError instead of guessing. Only safe numeric promotions (bool → int → float) happen automatically.',
      explanation: py`Contrast with a statically typed language like Java (a variable's type is fixed at compile time) and a weakly typed language like JavaScript (\`"3" + 4\` → \`"34"\`, \`"3" * 4\` → \`12\`). Python's type hints add optional *static* checking via external tools without changing runtime behaviour.`,
      whyAsked: 'Tests precise vocabulary and understanding of Python’s type system.',
      mistakes: ['Saying Python is weakly typed because variables have no declared type', 'Confusing dynamic with weak typing', 'Claiming type hints are enforced at runtime'],
      followUps: ['Do type hints change runtime behaviour?', 'Which implicit conversions does Python perform?', 'How does duck typing fit in?'],
      modelAnswer: 'Dynamic typing means types are attached to objects, not to variable names, and they are checked while the program runs — I can bind x to an int and later to a string. Strong typing means Python won’t silently convert between unrelated types: "3" + 4 raises a TypeError rather than guessing whether I meant 34 or 7. The only automatic conversions are safe numeric promotions, like an int becoming a float in 3 + 0.5, plus truthiness in conditions. Type hints add optional static checking through tools like mypy, but they don’t change that runtime behaviour.',
    },
    {
      id: 'type-conversion-isinstance-vs-type',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `type(x) == int` and `isinstance(x, int)`? Which do you use, and is there a catch with booleans?',
      answer: 'type(x) == int checks for exactly int; isinstance(x, int) also accepts subclasses and can take a tuple of types. isinstance is the idiomatic check. The catch: bool is a subclass of int, so isinstance(True, int) is True — exclude bools explicitly if they must not count.',
      explanation: py`Subclass-awareness matters for user-defined classes, enums (\`IntEnum\`), and ABCs: \`isinstance(x, numbers.Number)\` or \`collections.abc.Sequence\` check capabilities. Even better in many cases is duck typing — just use the object and handle failure — rather than checking types at all.`,
      code: { lang: 'python', code: py`def is_plain_int(value):
    return isinstance(value, int) and not isinstance(value, bool)

print(is_plain_int(3), is_plain_int(True))   # True False` },
      whyAsked: 'Common in code reviews; reveals knowledge of inheritance and Pythonic style.',
      mistakes: ['Saying they are equivalent', 'Not knowing bool subclasses int', 'Over-using type checks instead of duck typing'],
      followUps: ['What does isinstance(x, (int, float)) do?', 'When is type(x) is SomeClass justified?', 'What is duck typing?'],
      modelAnswer: 'type(x) == int is true only when x’s class is exactly int, while isinstance(x, int) is also true for subclasses and accepts a tuple of types, so it’s the idiomatic choice. The classic catch is that bool subclasses int, so isinstance(True, int) is True; if booleans shouldn’t count, I exclude them explicitly. Exact type checks are rare — maybe in serialization code — and often the most Pythonic option is not checking at all and relying on duck typing.',
    },
    {
      id: 'type-conversion-int-parsing-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`print(int("0x1A", 16), int("101", 2), int(" -1_000 "), float("  -1e3 "), int(True))` },
      options: ['26 5 -1000 -1000.0 1', 'ValueError', '26 5 -1000 -1000 1', '1A 101 -1000 -1e3 True'],
      correctOption: 0,
      answer: '26 5 -1000 -1000.0 1. With base 16, a 0x prefix is allowed; "101" in base 2 is 5; whitespace, a sign and underscores are accepted; float parses scientific notation; True converts to 1.',
      explanation: py`\`int(text, base)\` parses text in bases 2–36 (prefixes like \`0x\`, \`0b\` are allowed when they match the base, or with \`base=0\`, which infers it). Underscores between digits follow the same rules as numeric literals in code.`,
      whyAsked: 'Probes familiarity with what the parsers actually accept — useful for data-cleaning code.',
      mistakes: ['Expecting a ValueError for the 0x prefix', 'Forgetting that float() returns a float (-1000.0, not -1000)'],
      followUps: ['What does int("0b101", 0) return?', 'How would you format 26 back to hex?'],
      modelAnswer: 'It prints 26, 5, -1000, -1000.0 and 1. With an explicit base of 16, int accepts the 0x prefix, so 0x1A is 26; 101 in base 2 is 5. int also tolerates surrounding whitespace, a sign and underscores between digits, so " -1_000 " is -1000. float understands scientific notation, giving -1000.0 as a float, and int(True) is 1 because bool is a subclass of int.',
    },
    {
      id: 'type-conversion-isdigit-trap',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Code validates input with `if text.isdigit(): n = int(text)`. Users report that negative numbers are rejected, and one crash log shows `ValueError: invalid literal for int() with base 10: \'²\'`. What is wrong?',
      answer: 'isdigit() is not the same rule as int(): it rejects valid input like "-5" or " 7" and accepts characters like "²" that int() cannot parse. Let the parser decide: try int(text) and catch ValueError (EAFP).',
      explanation: py`\`str.isdigit()\` is a Unicode character-category test; \`int()\` has its own grammar (sign, whitespace, underscores, decimal digits only). Re-implementing a parser's rules with checks always drifts. EAFP — "easier to ask forgiveness than permission" — is the idiomatic Python approach for parsing.`,
      code: { lang: 'python', code: py`def parse_int(text):
    try:
        return int(text)
    except ValueError:
        return None

print(parse_int("-5"), parse_int(" 7 "), parse_int("²"))   # -5 7 None` },
      whyAsked: 'A realistic validation bug; distinguishes LBYL from EAFP thinking.',
      mistakes: ['Adding more special cases to the isdigit() check', 'Catching Exception instead of ValueError', 'Not considering Unicode input'],
      followUps: ['What is the difference between isdigit, isdecimal and isnumeric?', 'When is LBYL preferable to EAFP?'],
      modelAnswer: 'The validation and the parser disagree. isdigit is a Unicode character test, so it returns False for "-5" or " 7", which int would happily accept, and True for characters like superscript two, which int can’t parse — hence the crash. Rather than patching the check, I would let int decide: try the conversion and catch ValueError, then show an error or return None. That’s the EAFP style, and it stays correct because the parser itself defines what’s valid.',
    },
    {
      id: 'type-conversion-parse-bool',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Write `parse_bool(text)` that returns `True` for "yes", "y", "true", "1" and `False` for "no", "n", "false", "0" — ignoring case and surrounding spaces — and raises `ValueError` for anything else.',
      answer: 'Normalise with text.strip().lower(), check membership in two sets, and raise ValueError otherwise.',
      explanation: py`\`bool(text)\` can't do this: every non-empty string is truthy. An explicit mapping makes the accepted values clear, and raising \`ValueError\` for unknown input follows the same convention as \`int()\` and \`float()\`.`,
      starter: { files: { 'main.py': py`def parse_bool(text):
    # TODO: map yes/no style text to True/False, raise ValueError otherwise
    return bool(text)


print(parse_bool("Yes"), parse_bool(" no "))
` } },
      tests: [
        { name: 'true values', code: py`assert all(parse_bool(t) is True for t in ["yes", "Y", " true ", "1"])` },
        { name: 'false values', code: py`assert all(parse_bool(t) is False for t in ["no", "N", "False", " 0 "])` },
        { name: 'rejects other text', code: py`with raises(ValueError):
    parse_bool("maybe")` },
      ],
      solution: { files: { 'main.py': py`TRUE_WORDS = {"yes", "y", "true", "1"}
FALSE_WORDS = {"no", "n", "false", "0"}


def parse_bool(text):
    word = text.strip().lower()
    if word in TRUE_WORDS:
        return True
    if word in FALSE_WORDS:
        return False
    raise ValueError(f"not a yes/no value: {text!r}")


print(parse_bool("Yes"), parse_bool(" no "))
` } },
      hints: ['Normalise first: text.strip().lower().', 'Keep the accepted words in two sets and test membership with in.'],
      whyAsked: 'A practical parsing task that tests the bool("no") trap, string normalisation and error signalling.',
      mistakes: ['Using bool(text)', 'Returning False for unknown values instead of raising', 'Forgetting to strip/lower'],
      followUps: ['Where in a program should this parsing happen?', 'How do libraries like argparse or pydantic handle booleans?'],
      modelAnswer: 'I would normalise the input with strip and lower, then check it against two small sets of accepted words, returning True or False, and raise ValueError for anything else. bool on the string would be wrong because any non-empty string, including "no", is truthy. Raising instead of silently returning False matches how int and float signal bad input and stops typos from being treated as "no". The sets also document exactly what is accepted.',
    },
    {
      id: 'type-conversion-csv-prices',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You import a CSV of product prices. `float(row["price"])` crashes on values like `"1,299.00"`, `"£4.50"` and `""`. How do you handle this robustly?',
      answer: 'Decide the accepted format, normalise deliberately (strip whitespace and currency symbols, remove thousands separators for a known locale), parse money with Decimal rather than float, treat empty values explicitly (None or a validation error), and collect row-level errors with line numbers instead of crashing on the first one.',
      explanation: py`\`float()\` accepts only plain numeric text. Locale formats differ (\`"1.299,00"\` in much of Europe), so blindly removing characters can silently corrupt values — validation should reject what it doesn't understand. Reporting *which* rows failed lets humans fix the data.`,
      code: { lang: 'python', code: py`from decimal import Decimal, InvalidOperation

def parse_price(text):
    cleaned = text.strip().removeprefix("£").replace(",", "")
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        raise ValueError(f"bad price: {text!r}") from None

print(parse_price("1,299.00"), parse_price("£4.50"), parse_price(""))   # 1299.00 4.50 None` },
      whyAsked: 'Data cleaning is everyday work; this checks judgement about money types, locales and error reporting.',
      mistakes: ['Wrapping everything in try/except and skipping bad rows silently', 'Using float for money', 'Stripping all non-digits (turns "-4.50" into 450)'],
      followUps: ['How would you handle European formats?', 'Should bad rows stop the import?', 'What exception does Decimal raise for bad text?'],
      modelAnswer: 'I would first pin down the expected format, then normalise deliberately: strip whitespace, remove a known currency symbol, and remove thousands separators only for the locale I expect. Prices go into Decimal, not float, so money stays exact. Empty values get an explicit decision — None or a validation error. And instead of crashing on the first bad row or silently skipping it, I would collect errors with row numbers and report them, so someone can fix the source data.',
    },
    {
      id: 'type-conversion-dunder-hooks',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How do `int()`, `float()`, `str()` and `bool()` work on your own classes? Which special methods are involved?',
      answer: 'They are class constructors that call protocol methods: str() → __str__ (falling back to __repr__); int() → __int__ (or __index__); float() → __float__ (or __index__); bool() → __bool__, falling back to __len__() != 0, otherwise True. __index__ marks a type as a true integer usable for slicing, bin() and hex().',
      explanation: py`Implementing these lets your objects participate in conversions and truth tests. Be conservative: define \`__int__\`/\`__float__\` only when the conversion is natural; define \`__bool__\` or \`__len__\` when "empty" has a clear meaning (an empty basket). See [special methods](lesson:special-methods).`,
      code: { lang: 'python', code: py`class Basket:
    def __init__(self, items):
        self.items = list(items)

    def __len__(self):
        return len(self.items)

    def __str__(self):
        return f"Basket with {len(self)} items"

print(str(Basket(["tea"])), bool(Basket([])))   # Basket with 1 items False` },
      whyAsked: 'Tests understanding of Python’s data model behind everyday built-ins.',
      mistakes: ['Thinking conversions are hard-wired only for built-in types', 'Confusing __str__ and __repr__', 'Not knowing bool() falls back to __len__'],
      followUps: ['What is the difference between __int__ and __index__?', 'When would you define __bool__ explicitly?', 'Why should __repr__ be unambiguous?'],
      modelAnswer: 'int, float, str and bool are classes, and calling them on an object goes through special methods. str calls __str__ and falls back to __repr__. int uses __int__, or __index__ for types that are genuinely integers; float uses __float__, again with __index__ as a fallback. bool calls __bool__, and if that’s missing it uses __len__, treating length zero as False; with neither, objects are truthy. So a custom container that defines __len__ automatically works in if statements, and I only add numeric conversions where they’re natural.',
    },
  ],

  takeaways: [
    'Every value has a type; inspect it with type(x) and check it with isinstance(x, cls) (which also accepts subclasses and tuples).',
    'input() and other external data arrive as str — convert with int() or float() before doing maths or comparisons.',
    'int("3.5") and int("three") raise ValueError; int(3.99) truncates to 3 — use round() to round.',
    'Python converts automatically only between numbers (int → float, bool → int); "3" + 4 is a TypeError, never "34".',
    'bool() only tests emptiness: bool("False") and bool("0") are True — compare text explicitly.',
    'Conversions build new objects; the original value never changes. Use repr() to see exactly what text you have.',
  ],
}
