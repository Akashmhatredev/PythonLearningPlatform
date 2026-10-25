// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TICKET_DECODER = py`# Decode a train ticket code: ORIGIN-DEST-YEAR-MMDD-SEAT
ticket = "LDN-MAN-2026-0412-C07"

origin = ticket[:3]          # the first three characters
destination = ticket[4:7]    # skip the dash at index 3
year = ticket[8:12]
seat = ticket[-3:]           # the last three characters

print("Ticket:", ticket)
print("Length:", len(ticket), "characters")
print("From:", origin)
print("To:", destination)
print("Year:", year)
print("Seat:", seat)

route = origin + " -> " + destination
banner = "=" * 20
print(banner)
print(route)
print(banner)

print("Coach C?", seat[0] == "C")
print("Has 2026?", "2026" in ticket)
print("Backwards:", ticket[::-1])
`

export default {
  id: 'strings-basics',
  title: 'Strings, indexing & slicing',
  summary: 'A string is an immutable sequence of characters: write it with quotes, read single characters by index, cut out pieces with slices, and build new strings with + and *.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['variables-and-names', 'first-program'],
  related: ['string-methods', 'string-formatting', 'unicode-and-bytes', 'lists', 'tuples-and-unpacking', 'mutability-and-copying', 'type-conversion'],
  tags: ['strings', 'str', 'text', 'quotes', 'escape sequences', 'raw strings', 'triple quotes', 'indexing', 'negative index', 'slicing', 'step', 'reverse string', 'immutable', 'len', 'in', 'concatenation', 'repetition'],
  apis: [
    { name: 'str', summary: 'The built-in text type: an immutable sequence of Unicode characters.' },
    { name: 's[i]', summary: 'Indexing: the one-character string at position i (negative i counts from the end).' },
    { name: 's[start:stop:step]', summary: 'Slicing: a new string from start up to (not including) stop, taking every step-th character.' },
    { name: 'len(s)', summary: 'The number of characters (Unicode code points) in the string.' },
    { name: 'sub in s', summary: 'True if sub appears anywhere inside s (a substring check).' },
    { name: 's + t, s * n', summary: 'Concatenation (join two strings) and repetition (repeat a string n times).' },
    { name: 'r"..." (raw string)', summary: 'A string literal where backslashes are kept as ordinary characters.' },
    { name: '"""...""" (triple-quoted string)', summary: 'A string literal that can span several lines.' },
  ],
  docs: [
    { label: 'Python tutorial — text (strings)', url: 'https://docs.python.org/3/tutorial/introduction.html#text' },
    { label: 'Library reference — text sequence type str', url: 'https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str' },
    { label: 'Library reference — common sequence operations', url: 'https://docs.python.org/3/library/stdtypes.html#common-sequence-operations' },
    { label: 'Language reference — string literals and escape sequences', url: 'https://docs.python.org/3/reference/lexical_analysis.html#string-and-bytes-literals' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **string** is a piece of text: a name, a password, a line from a log file, a whole book. Python's string type is called \`str\`. You create one by wrapping characters in quotes: \`"Ada"\` or \`'Ada'\` — both mean the same thing.`,
    py`A string is a **sequence**: an ordered row of characters, each sitting at a numbered position called an **index**. That means you can ask for "the first character" (\`name[0]\`), "the last three" (\`code[-3:]\`), or "every second one" (\`text[::2]\`). This cutting-out of pieces is called **slicing**, and it works the same way on [lists](lesson:lists) and [tuples](lesson:tuples-and-unpacking), so you are learning it once for all of them.`,
    py`Strings are also **immutable**: once a string exists, its characters can never change. Every operation that seems to "change" a string actually builds a *new* one. That one fact explains most of the surprises beginners hit with text.`,
  ],
  why: [
    py`Almost every program handles text. Usernames, file names, product codes, CSV rows, web pages, chat messages — they all arrive as strings. Before you can clean, check or format text (the next lessons: [string methods](lesson:string-methods) and [f-strings](lesson:string-formatting)), you need to be able to *point at* parts of it.`,
    py`Indexing and slicing let you pull structure out of text without any extra tools: the year from \`"2026-04-12"\`, the file extension from \`"photo.jpg"\`, the last four digits of a card number. And immutability makes strings safe to share: if you hand a string to a function, you know it will come back unchanged.`,
  ],
  eli15: [
    py`Think of a string as a row of letter tiles glued onto a strip of card: \`P\` \`y\` \`t\` \`h\` \`o\` \`n\`. Each tile has a number under it, starting at **0** (programmers count from zero). So tile 0 is \`P\` and tile 5 is \`n\`. You can also count backwards from the end: tile -1 is the last one, tile -2 the one before it.`,
    py`**Slicing** is like taking scissors to the strip: \`word[1:4]\` means "cut just before tile 1 and just before tile 4", which gives you \`yth\`. Notice tile 4 is *not* included — the second number is where you stop, not the last tile you keep.`,
    py`The glue is strong: you can't swap a single tile. If you want \`Jython\` instead of \`Python\`, you make a brand-new strip from \`"J"\` plus the old tiles 1 to the end. The old strip is still there, untouched.`,
  ],
  analogy: {
    title: 'A strip of numbered letter tiles',
    body: [
      py`Picture a word built from Scrabble-style tiles glued onto a strip, with the positions written underneath — 0, 1, 2… from the left, and -1, -2, -3… from the right.`,
      py`You can *read* any tile, *photocopy* a stretch of tiles (a slice), tape two strips together (\`+\`), or photocopy one strip several times (\`*\`). What you can never do is peel off one tile and replace it — the glue (immutability) won't let you. You always end up with a new strip.`,
    ],
    mapping: [
      ['the strip of tiles', 'a str object'],
      ['the number under a tile', 'an index: 0 for the first character, -1 for the last'],
      ['photocopying tiles 1 up to (not including) 4', 'the slice word[1:4]'],
      ['taping two strips together', 'concatenation: first + last'],
      ['photocopying a strip three times', 'repetition: "ha" * 3'],
      ['the glue that stops you swapping a tile', 'immutability: word[0] = "J" raises TypeError'],
      ['counting the tiles', 'len(word)'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: '"Changing" a string really makes a new one',
    props: {
      code: py`word = "cat"
same = word
word = "b" + word[1:]
print(word, same)

pin = "1234"
pin = pin + "5"
print(pin, len(pin))
`,
      inline: false,
      notes: {
        1: 'A str object `"cat"` is created and the name `word` is bound to it.',
        2: '`same = word` makes a second name for the **same** string object. No copy is made.',
        3: '`word[1:]` builds a new string `"at"`, then `"b" + "at"` builds another new string `"bat"`. Only `word` moves to it — the `"cat"` object is never modified.',
        4: '`same` still points at the original `"cat"`, because nothing can change a string in place.',
        7: '`pin + "5"` creates a fifth-character string. The old `"1234"` object is left behind; with no names pointing at it, Python can reclaim it.',
      },
    },
    alt: 'A step-by-step trace. The name word points to a string object "cat". same = word adds a second arrow to the same "cat". The line word = "b" + word[1:] creates a new object "at" and then a new object "bat"; word’s arrow moves to "bat" while same still points to "cat", so printing shows "bat cat". Then pin points to "1234", and pin + "5" creates a new object "12345" that pin moves to; the length printed is 5.',
    caption: py`Step through with ▶. Strings are drawn as separate objects so you can see that no string ever changes — names just move to newly built strings.`,
  },
  syntax: [
    py`#### Writing string literals`,
    py`A **literal** is a value written directly in your code. String literals come in a few shapes:`,
    { code: py`city = "Lisbon"               # double quotes
city = 'Lisbon'               # single quotes: exactly the same string
quote = "It's raining"        # use one kind of quote to contain the other
reply = 'She said "hi"'
empty = ""                    # the empty string: zero characters

poem = """Roses are red,
violets are blue."""          # triple quotes: may span several lines

pattern = r"C:\Users\ada"     # raw string: backslashes are kept as-is
print(quote, reply, len(empty))`, lang: 'python', title: 'the shapes of a string literal' },
    py`PEP 8 doesn't prefer single or double quotes — pick one style and stick to it (many projects use double quotes because the formatter Black does). Use the *other* kind when the text contains a quote, so you don't need escapes.`,
    py`#### Escape sequences`,
    py`Inside a normal string, a **backslash** \`\` \ \`\` starts an **escape sequence**: a two-or-more character code that stands for one special character.`,
    py`| escape | means | example | prints |
|---|---|---|---|
| \`\n\` | newline | \`"one\ntwo"\` | one, then two on the next line |
| \`\t\` | tab | \`"name\tscore"\` | name, a tab gap, score |
| \`\\\` | one real backslash | \`"C:\\temp"\` | \`C:\temp\` |
| \`\'\`  \`\"\` | a quote that doesn't end the string | \`'It\'s'\` | \`It's\` |
| \`\u00e9\` | the character with that Unicode number | \`"caf\u00e9"\` | \`café\` |`,
    { code: py`print("Shopping list:\n- eggs\n- milk")
print("Name\tScore")
print("Ada\t98")
print("Folder: C:\\temp")
print('It\'s fine')`, lang: 'python', title: 'escapes in action' },
    py`#### Raw strings`,
    py`Put an \`r\` in front of the quotes and backslashes lose their special meaning: \`r"\n"\` is two characters, a backslash and an \`n\`. Raw strings are made for text that is *full* of backslashes — Windows paths and [regular expressions](lesson:regular-expressions).`,
    { code: py`print(len("\n"))      # 1 — one newline character
print(len(r"\n"))     # 2 — a backslash and an n
print(r"C:\new\table")  # C:\new\table, exactly as typed`, lang: 'python', title: 'raw vs normal' },
    { callout: 'warn', title: 'A raw string can\'t end with a single backslash', text: py`\`r"C:\folder\"\` is a \`SyntaxError\`: the final \`\"\` still stops the quote from closing the string. Write \`"C:\\folder\\"\` or, better, use forward slashes or [pathlib](lesson:pathlib), which work on Windows too.` },
    py`#### Indexing: one character`,
    { code: py`word = "Python"
#        P  y  t  h  o  n
# index: 0  1  2  3  4  5
# from the end: -6 -5 -4 -3 -2 -1

print(word[0])     # P   — the first character
print(word[5])     # n   — the last, because indexes start at 0
print(word[-1])    # n   — negative indexes count from the end
print(word[-2])    # o`, lang: 'python', title: 'positive and negative indexes' },
    py`Valid indexes run from \`0\` to \`len(s) - 1\`, and from \`-1\` to \`-len(s)\`. Anything else raises \`IndexError: string index out of range\`. Python has no separate "character" type: \`word[0]\` is simply a string of length 1.`,
    py`#### Slicing: a piece of the string`,
    { code: py`s[start:stop]          # characters from start up to, NOT including, stop
s[start:stop:step]     # ...taking every step-th character
s[:stop]               # from the beginning
s[start:]              # to the end
s[:]                   # the whole string
s[::-1]                # the whole string, backwards`, lang: 'python', title: 'slice shapes', static: true },
    { code: py`date = "2026-04-12"
print(date[:4])      # 2026  (indexes 0, 1, 2, 3)
print(date[5:7])     # 04
print(date[-2:])     # 12    (the last two characters)
print(date[::2])     # 22-41 (every second character)
print(date[::-1])    # 21-40-6202`, lang: 'python', title: 'slicing a date' },
    py`Three rules make slices easy to reason about:`,
    py`1. **Stop is excluded**, so \`s[a:b]\` has \`b - a\` characters and \`s[:k] + s[k:] == s\` for any \`k\`.
2. **Slices never raise \`IndexError\`.** Out-of-range positions are clipped: \`"abc"[1:100]\` is \`"bc"\` and \`"abc"[5:]\` is \`""\`.
3. **A negative step walks backwards**, so start should be to the *right* of stop: \`"Python"[4:1:-1]\` is \`"oht"\`.`,
    py`#### Length, membership, + and *`,
    { code: py`code = "AB-1234"
print(len(code))          # 7
print("-" in code)        # True: is "-" somewhere inside?
print("12" in code)       # True: works for longer substrings too
print("ab" in code)       # False: comparisons are case-sensitive
print("ab" not in code)   # True

first = "Ada"
last = "Lovelace"
print(first + " " + last)  # Ada Lovelace   (+ joins strings)
print("ha" * 3)            # hahaha         (* repeats a string)
print("-" * 12)            # a 12-character divider`, lang: 'python', title: 'len, in, + and *' },
    py`\`+\` only joins a string to another **string**: \`"Age: " + 15\` raises \`TypeError\`. Convert first with \`str(15)\`, or use an [f-string](lesson:string-formatting): \`f"Age: {age}"\`. \`*\` needs an **int**: \`"ab" * 2.5\` is an error.`,
    py`#### Immutability`,
    { code: py`name = "jython"
# name[0] = "J"    # TypeError: 'str' object does not support item assignment
name = "J" + name[1:]   # build a new string and re-bind the name
print(name)             # Jython`, lang: 'python', title: 'you can\'t edit a string — build a new one' },
  ],
  walkthrough: {
    title: 'Reading the ticket decoder line by line',
    lang: 'python',
    code: TICKET_DECODER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2], text: py`One string holds the whole ticket. Its positions run from 0 (\`L\`) to 20 (\`7\`), because it is 21 characters long.` },
      { lines: [4, 5], text: py`\`ticket[:3]\` means "from the start up to, not including, index 3" — \`LDN\`. Index 3 is the dash, so the destination starts at 4: \`ticket[4:7]\` is \`MAN\`.` },
      { lines: [6], text: py`\`ticket[8:12]\` gives four characters (12 − 8 = 4): \`2026\`. Counting positions is the error-prone part — that's why the next line uses a negative slice instead.` },
      { lines: [7], text: py`\`ticket[-3:]\` means "from three before the end, to the end" — \`C07\`. It keeps working even if the ticket code were longer, which is why negative indexes are handy.` },
      { lines: [10, 15], text: py`\`print()\` with several values separates them with spaces. \`len(ticket)\` counts characters: 21.` },
      { lines: [17, 21], text: py`\`+\` glues three strings into \`"LDN -> MAN"\`; \`"=" * 20\` repeats one character 20 times to make a divider.` },
      { lines: [23, 25], text: py`\`seat[0] == "C"\` compares a one-character string; \`"2026" in ticket\` checks for a substring; \`ticket[::-1]\` walks the whole string with step -1, producing a reversed copy.` },
    ],
  },
  playground: {
    title: 'Ticket decoder',
    objective: 'Run it, predict each line, then slice new fields out of the ticket and build new strings from the pieces.',
    files: { 'main.py': TICKET_DECODER },
    expected: py`\`\`\`text
Ticket: LDN-MAN-2026-0412-C07
Length: 21 characters
From: LDN
To: MAN
Year: 2026
Seat: C07
====================
LDN -> MAN
====================
Coach C? True
Has 2026? True
Backwards: 70C-2140-6202-NAM-NDL
\`\`\`

Notice the banner is wider than the route. The first experiment fixes that.`,
    experiments: [
      {
        id: 'fit-banner',
        task: py`The banner is 20 characters but the route is shorter. Change the \`banner\` line so it is **exactly as long as \`route\`**, whatever the route is.`,
        hint: py`\`len(route)\` gives the number of characters in the route. Repeat \`"="\` that many times.`,
        tests: [
          { name: 'banner is as long as route', code: py`assert banner == "=" * len(route), 'Make the banner "=" repeated len(route) times'` },
        ],
        explain: py`\`"=" * len(route)\` computes the width from the data instead of hard-coding it. Change the ticket's cities and the banner still fits — no magic numbers.`,
      },
      {
        id: 'month-and-day',
        task: py`The four digits after the year are the month and day (\`0412\` = 12 April). Create two variables, \`month\` and \`day\`, by slicing \`ticket\`, and print them.`,
        hint: py`The year ends at index 11 and index 12 is a dash, so the month is at indexes 13 and 14. \`ticket[13:15]\`…`,
        tests: [
          { name: 'month is the two digits after the year', code: py`assert ns.get('month') == ticket[13:15], 'month should be ticket[13:15]'` },
          { name: 'day is the next two digits', code: py`assert ns.get('day') == ticket[15:17], 'day should be ticket[15:17]'` },
        ],
        explain: py`\`ticket[13:15]\` and \`ticket[15:17]\` each have \`stop - start = 2\` characters. Because a slice never includes its stop index, adjacent slices like \`[13:15]\` and \`[15:17]\` fit together with no gap and no overlap.`,
      },
      {
        id: 'upgrade-seat',
        task: py`The passenger is upgraded to coach **F**. First try \`seat[0] = "F"\` and read the error. Then remove that line and instead create \`upgraded\` — a new string made of \`"F"\` plus the rest of \`seat\` — and print it.`,
        hint: py`Strings are immutable, so build a new one: \`"F" + seat[1:]\`.`,
        tests: [
          { name: 'upgraded is "F" plus the seat number', code: py`assert ns.get('upgraded') == "F" + seat[1:], 'upgraded should be "F" + seat[1:]'` },
          { name: 'upgraded seat is printed', code: py`assert upgraded in output, 'print(upgraded)'` },
        ],
        explain: py`\`seat[0] = "F"\` raises \`TypeError: 'str' object does not support item assignment\` because strings can't change. \`"F" + seat[1:]\` builds a brand-new string from the pieces, and \`seat\` still holds the original \`"C07"\`.`,
      },
      {
        id: 'new-ticket',
        task: py`Change the ticket to \`"EDI-BRI-2027-1225-A12"\` and predict every printed line **before** you run it. Did any slice break?`,
        hint: py`Only line 2 needs to change. All the slices use positions, so they work for any ticket with the same layout.`,
        tests: [
          { name: 'decodes the new ticket', code: py`assert origin == "EDI" and destination == "BRI" and seat == "A12"` },
        ],
        explain: py`Because every field is cut by position, any ticket in the same format decodes correctly. If a format can vary in length, slicing by fixed positions gets fragile — that's when you reach for \`split("-")\` from [string methods](lesson:string-methods).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Indexes and slices on "Python"',
    props: {
      width: 760,
      height: 260,
      nodes: [
        { id: 'c0', label: 'P', note: '0 · -6', x: 130, y: 130, tone: 'paper' },
        { id: 'c1', label: 'y', note: '1 · -5', x: 230, y: 130, tone: 'paper' },
        { id: 'c2', label: 't', note: '2 · -4', x: 330, y: 130, tone: 'paper' },
        { id: 'c3', label: 'h', note: '3 · -3', x: 430, y: 130, tone: 'paper' },
        { id: 'c4', label: 'o', note: '4 · -2', x: 530, y: 130, tone: 'paper' },
        { id: 'c5', label: 'n', note: '5 · -1', x: 630, y: 130, tone: 'paper' },
      ],
      edges: [
        { from: 'c0', to: 'c1' },
        { from: 'c1', to: 'c2' },
        { from: 'c2', to: 'c3' },
        { from: 'c3', to: 'c4' },
        { from: 'c4', to: 'c5' },
      ],
      steps: [
        { focus: ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'], text: py`\`word = "Python"\` — six characters in a row. Under each one: its **positive index** (counting from 0 on the left) and its **negative index** (counting from -1 on the right).` },
        { focus: ['c0'], text: py`\`word[0]\` → \`'P'\`. The first character is at index **0**, not 1.` },
        { focus: ['c5'], text: py`\`word[-1]\` → \`'n'\`. Negative indexes count from the end, so \`-1\` is always the last character, however long the string is. It's the same as \`word[len(word) - 1]\`.` },
        { focus: ['c1', 'c2', 'c3'], edges: ['c1->c2', 'c2->c3'], text: py`\`word[1:4]\` → \`'yth'\`. Start at 1, **stop before** 4. The slice has \`4 - 1 = 3\` characters.` },
        { focus: ['c3', 'c4', 'c5'], edges: ['c3->c4', 'c4->c5'], text: py`\`word[-3:]\` → \`'hon'\`. Start three from the end and run to the end — a common way to grab a suffix like a file extension.` },
        { focus: ['c0', 'c2', 'c4'], text: py`\`word[::2]\` → \`'Pto'\`. No start or stop means "the whole string"; a step of 2 takes every second character.` },
        { focus: ['c5', 'c4', 'c3', 'c2', 'c1', 'c0'], text: py`\`word[::-1]\` → \`'nohtyP'\`. A step of -1 walks from the right end to the left: a reversed **copy**. The original \`word\` is unchanged.` },
      ],
    },
    alt: 'Six tiles in a row spelling Python. Each tile shows its positive index 0 to 5 and its negative index -6 to -1. Successive steps highlight P for word[0], n for word[-1], y t h for word[1:4], h o n for word[-3:], P t o for word[::2], and all six in reverse for word[::-1].',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`str\` object stores its characters in order, plus its length. Indexing asks "give me the character at position *i*" and returns a new one-character string. Slicing asks for a range and returns a new string containing just those characters.`,
      py`Because strings never change, Python can safely let many names share one string. \`b = a\` doesn't copy any text — both names point at the same object, and since no one can modify it, sharing is never a problem. (Compare that with lists in [mutability & copying](lesson:mutability-and-copying), where sharing *can* surprise you.)`,
      { code: py`message = "hello"
loud = message + "!"
print(message)   # hello — the original is untouched
print(loud)      # hello!`, lang: 'python', title: '+ never modifies its operands' },
    ],
    technical: [
      py`**What a character is.** A Python \`str\` is a sequence of Unicode **code points** — numbers that identify characters, such as 65 for \`A\` and 233 for \`é\`. \`len()\` counts code points, which is usually but not always what a human would call "letters"; emoji and accented letters can surprise you. That is the subject of [Unicode & bytes](lesson:unicode-and-bytes).`,
      py`**Slices are objects too.** \`s[1:4:2]\` is shorthand for \`s[slice(1, 4, 2)]\`. A \`slice\` object can be stored in a variable and reused, which is handy for fixed-width records:`,
      { code: py`YEAR = slice(0, 4)
MONTH = slice(5, 7)
for stamp in ["2026-04-12", "2025-12-31"]:
    print(stamp[YEAR], stamp[MONTH])`, lang: 'python', title: 'named slices' },
      py`**Why immutability?** It is a *language guarantee*, chosen for good reasons: strings can be used as [dictionary](lesson:dictionaries) keys and set members (their hash can never go stale), they are safe to share between functions and threads, and the interpreter is free to reuse identical strings.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores each string with a fixed number of bytes per character — 1, 2 or 4 — chosen by the *widest* character in that string (PEP 393). That makes \`s[i]\` a constant-time lookup in CPython. Try \`import sys; print(sys.getsizeof("a" * 10), sys.getsizeof("€" * 10))\` to see the difference live. Other implementations may store text differently (MicroPython, for example, uses UTF-8), so don't treat fast indexing as a language rule.` },
      { callout: 'note', title: 'CPython detail: sharing and interning', text: py`Because strings are immutable, CPython sometimes reuses one object: \`s[:]\` returns \`s\` itself, and short identifier-like strings may be *interned* (stored once). So \`a is b\` can be \`True\` for equal strings — or not, depending on how they were made. Always compare text with \`==\`, never \`is\` (see [None, truthiness & identity](lesson:none-and-truthiness)).` },
    ],
    production: [
      py`**Building big strings.** Each \`+\` creates a new string and copies both sides, so adding pieces one at a time in a long loop can do a lot of copying. Collect the pieces in a list and call \`"".join(pieces)\` once — covered in [string methods](lesson:string-methods). (CPython has an optimisation that sometimes makes \`s += piece\` fast, but it is an implementation detail that other interpreters don't share. Measure it yourself in the performance visual of the next lesson.)`,
      py`**Fixed positions are fragile.** Slicing by position (\`line[13:15]\`) is perfect for truly fixed-width formats, such as some bank files or the ticket above. For anything with separators, prefer \`split()\`/\`partition()\`; for flexible patterns, [regular expressions](lesson:regular-expressions); for dates, [\`datetime.strptime\`](lesson:dates-and-times). Give magic positions a name (\`MONTH = slice(5, 7)\`) so readers know what they mean.`,
      py`**Paths are not strings.** Building file paths with \`+\` and backslashes is a classic source of bugs on Windows. Use [pathlib](lesson:pathlib): \`Path("reports") / "2026" / "april.csv"\` works on every operating system.`,
    ],
  },
  mistakes: [
    {
      title: 'Trying to change one character in place',
      wrong: { code: py`name = "jordan"
name[0] = "J"      # TypeError: 'str' object does not support item assignment`, lang: 'python', static: true },
      right: { code: py`name = "jordan"
name = "J" + name[1:]
print(name)        # Jordan`, lang: 'python' },
      explanation: py`Strings are immutable. Build a new string from pieces and re-bind the name to it. (For real names you would use \`name.capitalize()\` from [string methods](lesson:string-methods), which also returns a new string.)`,
    },
    {
      title: 'Forgetting that the stop index is excluded',
      wrong: { code: py`date = "2026-04-12"
year = date[0:3]
print(year)        # 202 — one digit short`, lang: 'python' },
      right: { code: py`date = "2026-04-12"
year = date[0:4]   # or date[:4]
print(year)        # 2026`, lang: 'python' },
      explanation: py`\`s[a:b]\` contains \`b - a\` characters and never includes index \`b\`. To get *n* characters starting at \`a\`, write \`s[a:a + n]\`.`,
    },
    {
      title: 'Using len(s) as the last index',
      wrong: { code: py`word = "Python"
last = word[len(word)]   # IndexError: string index out of range`, lang: 'python', static: true },
      right: { code: py`word = "Python"
last = word[-1]          # n
print(last)`, lang: 'python' },
      explanation: py`Indexes run from 0 to \`len(s) - 1\`. \`word[len(word)]\` is one past the end. \`word[-1]\` is the idiomatic way to get the last character.`,
    },
    {
      title: 'Joining a string and a number with +',
      wrong: { code: py`score = 42
print("Score: " + score)   # TypeError: can only concatenate str (not "int") to str`, lang: 'python', static: true },
      right: { code: py`score = 42
print("Score: " + str(score))
print(f"Score: {score}")   # usually clearer`, lang: 'python' },
      explanation: py`\`+\` between a \`str\` and an \`int\` is ambiguous (add or join?), so Python refuses. Convert explicitly with \`str()\` or use an [f-string](lesson:string-formatting).`,
    },
    {
      title: 'Backslashes in Windows paths',
      wrong: { code: py`path = "C:\new\table.csv"
print(path)      # C:, a newline, ew, a tab, able.csv`, lang: 'python' },
      right: { code: py`path = r"C:\new\table.csv"    # raw string
print(path)
path = "C:/new/table.csv"     # forward slashes also work on Windows
print(path)`, lang: 'python' },
      explanation: py`\`\n\` and \`\t\` are escape sequences, so the "path" contains a newline and a tab. Use a raw string, forward slashes, or [pathlib](lesson:pathlib).`,
    },
    {
      title: 'Expecting a slice to raise like an index does',
      wrong: { code: py`code = "AB1"
suffix = code[3:6]
if suffix:               # silently empty — no error to warn you
    print("suffix:", suffix)`, lang: 'python' },
      right: { code: py`code = "AB1"
if len(code) < 6:
    print("code too short:", code)
else:
    print("suffix:", code[3:6])`, lang: 'python' },
      explanation: py`Slices clip out-of-range positions instead of raising, so bad input can quietly give you \`""\`. When the length matters, check it explicitly.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'str' object does not support item assignment`,
      cause: py`An assignment like \`s[0] = "X"\` tried to change a character. Strings are immutable.`,
      fix: py`Build a new string (\`s = "X" + s[1:]\`) or use a method that returns one (\`s.replace(...)\`). If you truly need to edit characters many times, convert to a list, edit, then \`"".join(chars)\`.`,
    },
    {
      symptom: py`IndexError: string index out of range`,
      cause: py`An index is \`>= len(s)\` or \`< -len(s)\` — often \`s[len(s)]\`, or indexing an empty string \`""[0]\`.`,
      fix: py`Use \`s[-1]\` for the last character, check \`if s:\` before indexing input that might be empty, or use a slice (\`s[:1]\` returns \`""\` instead of raising).`,
    },
    {
      symptom: py`TypeError: can only concatenate str (not "int") to str`,
      cause: py`\`+\` was used between a string and a number.`,
      fix: py`Convert with \`str(n)\`, or write an f-string: \`f"Total: {n}"\`.`,
    },
    {
      symptom: py`SyntaxError: unterminated string literal (detected at line 1)`,
      cause: py`A string was opened but never closed — a missing quote, a quote of the same kind inside the text (\`'it's'\`), or a raw string ending in a backslash.`,
      fix: py`Close the quote, switch quote style (\`"it's"\`), escape the inner quote (\`'it\'s'\`), or use triple quotes for text containing both kinds.`,
    },
    {
      symptom: py`\`SyntaxWarning: "\d" is an invalid escape sequence. Such sequences will not work in the future. Did you mean "\\d"? A raw string is also an option.\``,
      cause: py`A backslash is followed by a character that isn't a known escape, typically in a regex or a Windows path. Since Python 3.12 this is a \`SyntaxWarning\` (earlier versions used a quieter \`DeprecationWarning\`).`,
      fix: py`Use a raw string: \`r"\d+"\`.`,
    },
  ],
  bestPractices: [
    'Use negative indexes for "from the end": s[-1] for the last character, s[-4:] for the last four.',
    'Remember that s[a:b] has b - a characters; write s[a:a + n] when you want n characters.',
    'Use raw strings (r"...") for regular expressions and any text full of backslashes.',
    'Choose the quote style that avoids escapes: "It\'s" rather than \'It\\\'s\'.',
    'Never compare strings with is — always ==.',
    'Name fixed slice positions (MONTH = slice(5, 7)) instead of scattering magic numbers.',
    'Prefer f-strings over long chains of + and str() when building messages.',
  ],
  useCases: [
    'Pulling fields out of fixed-format codes: product SKUs, ticket numbers, dates.',
    'Getting a file extension or prefix: name[-4:], url[:8].',
    'Masking sensitive data: showing only the last four digits of a card.',
    'Quick checks with in: is "@" in the email? Is "ERROR" in the log line?',
    'Building simple text output: dividers with "-" * 40, labels with +.',
  ],
  comparison: {
    title: 'Indexing vs slicing',
    headers: ['', 'Indexing s[i]', 'Slicing s[a:b:c]'],
    rows: [
      ['returns', 'a one-character string', 'a new string of any length (maybe empty)'],
      ['out of range', 'raises IndexError', 'clips silently, never raises'],
      ['negative numbers', 'count from the end', 'count from the end (and a negative step walks backwards)'],
      ['on an empty string', '""[0] raises IndexError', '""[:1] is ""'],
      ['works on', 'str, list, tuple, bytes, range…', 'the same sequences'],
    ],
    note: py`Both work on every built-in sequence. The [lists](lesson:lists) lesson adds one thing strings can't do: *assigning* to an index or slice, because lists are mutable.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'strings-basics-q1',
      type: 'mcq',
      prompt: py`\`word = "Python"\`. Which expression gives \`"n"\`?`,
      options: [
        { text: 'word[6]', why: 'There are six characters, so the valid indexes are 0 to 5. word[6] raises IndexError.' },
        'word[-1]',
        { text: 'word[-0]', why: '-0 is just 0, so this is word[0], which is "P".' },
        { text: 'word[len(word)]', why: 'len(word) is 6, one past the last index — IndexError.' },
      ],
      answer: 1,
      explanation: py`Negative indexes count from the end, and \`-1\` is always the last character. \`word[5]\` and \`word[len(word) - 1]\` also work but are easier to get wrong.`,
    },
    {
      id: 'strings-basics-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`code = "ABCDEFGH"
print(code[2:5], code[::3])`,
      answer: 'CDE ADG',
      accept: ['CDE ADG'],
      explanation: py`\`code[2:5]\` takes indexes 2, 3, 4 → \`CDE\` (stop is excluded). \`code[::3]\` starts at 0 and takes every third character: indexes 0, 3, 6 → \`ADG\`.`,
    },
    {
      id: 'strings-basics-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`word = "cat"
copy = word
word = word + "s"
print(copy)`,
      options: [
        { text: 'cats', why: 'word + "s" builds a new string and only word is re-bound to it. copy still points at the original object.' },
        'cat',
        { text: 'TypeError', why: 'Joining two strings with + is perfectly valid.' },
      ],
      answer: 1,
      explanation: py`Strings are immutable: \`+\` never modifies \`"cat"\`. It creates \`"cats"\` and moves the name \`word\`. \`copy\` was never touched.`,
    },
    {
      id: 'strings-basics-q4',
      type: 'bug',
      prompt: 'This program crashes. Click the line that causes the error.',
      code: py`name = "jordan"
greeting = "Hello, "
name[0] = "J"
print(greeting + name)`,
      answerLine: 3,
      explanation: py`Line 3 raises \`TypeError: 'str' object does not support item assignment\`. Replace it with \`name = "J" + name[1:]\`, which builds a new string.`,
    },
    {
      id: 'strings-basics-q5',
      type: 'fill',
      prompt: 'Fill in the two slices so the program prints `jpg holiday_photo`. Use slices that would still work for any three-letter extension.',
      code: py`filename = "holiday_photo.jpg"
extension = filename[___]
name = filename[___]
print(extension, name)`,
      answer: [['-3:'], [':-4', '0:-4']],
      explanation: py`\`filename[-3:]\` takes the last three characters. \`filename[:-4]\` takes everything except the last four (the dot plus the extension). Counting from the end keeps working whatever the name's length.`,
    },
    {
      id: 'strings-basics-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print(len("C:\new"), len(r"C:\new"))`,
      options: [
        { text: '6 6', why: 'In the normal string, \\n is an escape sequence: a single newline character, not two characters.' },
        '5 6',
        { text: '6 5', why: 'It is the other way round: the raw string keeps the backslash as a real character, so it is the longer one.' },
        { text: '5 5', why: 'The r prefix turns escapes off, so r"C:\\new" keeps both the backslash and the n.' },
      ],
      answer: 1,
      explanation: py`\`"C:\new"\` is \`C\`, \`:\`, *newline*, \`e\`, \`w\` → 5 characters. The raw string \`r"C:\new"\` keeps the backslash and the \`n\` as two characters → 6.`,
    },
    {
      id: 'strings-basics-q7',
      type: 'short',
      prompt: 'Strings are immutable. Give one reason this is useful, and explain what `s = s + "!"` actually does.',
      answer: py`Immutability means a string can be safely shared and used as a dictionary key or set member — its value (and hash) can never change behind your back. \`s = s + "!"\` doesn't modify the old string: it builds a brand-new string containing the old characters plus "!", then re-binds the name \`s\` to the new object. Any other name pointing at the old string still sees the old text.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'mask-card',
      title: 'Mask a card number',
      difficulty: 'beginner',
      prompt: py`Receipts never show a full card number. Write a function \`mask(number)\` that takes a card number as a **string of digits** and returns a new string where every character except the **last four** is replaced by \`*\`.

\`\`\`text
mask("4111222233334444")  ->  "************4444"
mask("12345")             ->  "*2345"
mask("1234")              ->  "1234"
\`\`\`

The result must always have the same length as the input. You may assume the input has at least four characters.`,
      files: {
        'main.py': py`def mask(number):
    # TODO: stars for all but the last four characters, then the last four
    return number


print(mask("4111222233334444"))
print(mask("12345"))
`,
      },
      hints: [
        'Split the job in two: how many stars do you need, and which characters stay visible?',
        'The visible part is a negative slice: number[-4:]. The number of stars is len(number) - 4.',
        'return "*" * (len(number) - 4) + number[-4:]',
      ],
      solution: {
        explanation: py`\`number[-4:]\` grabs the last four characters, however long the number is. \`"*" * (len(number) - 4)\` repeats a star once for every hidden digit — and when the input is exactly four characters, \`"*" * 0\` is the empty string, so nothing breaks. Joining the two with \`+\` builds the result; the original string is never modified.`,
        files: {
          'main.py': py`def mask(number):
    hidden = len(number) - 4
    return "*" * hidden + number[-4:]


print(mask("4111222233334444"))
print(mask("12345"))
`,
        },
      },
      tests: [
        { name: 'masks a 16-digit number', code: py`assert mask("4111222233334444") == "************4444"` },
        { name: 'masks a 5-digit number', code: py`assert mask("12345") == "*2345"` },
        { name: 'leaves exactly four digits alone', code: py`assert mask("1234") == "1234"` },
        { name: 'keeps the same length', code: py`assert len(mask("9876543210")) == 10` },
      ],
    },
    {
      id: 'middle-characters',
      title: 'The middle of a word',
      difficulty: 'beginner',
      prompt: py`Write a function \`middle(word)\` that returns the middle of a string:

- if the length is **odd**, return the single middle character;
- if the length is **even**, return the **two** middle characters;
- for the empty string, return \`""\`.

\`\`\`text
middle("table")   ->  "b"
middle("python")  ->  "th"
middle("ab")      ->  "ab"
middle("")        ->  ""
\`\`\``,
      files: {
        'main.py': py`def middle(word):
    # TODO: return the middle character (odd length) or two characters (even length)
    return word[0]


print(middle("table"))
print(middle("python"))
`,
      },
      hints: [
        'Find the centre index with integer division: len(word) // 2.',
        'For an odd length, the middle is one character starting at that index. For an even length, it starts one position earlier and is two characters long. Check the length with len(word) % 2.',
        'mid = len(word) // 2, then return word[mid] for odd lengths and word[mid - 1:mid + 1] for even ones. Use slices so the empty string gives "".',
      ],
      solution: {
        explanation: py`\`len(word) // 2\` is the index just right of centre. For an odd length (say 5), that is exactly the middle (index 2). For an even length (6), the two middle characters are at indexes 2 and 3, i.e. \`mid - 1\` and \`mid\`, which the slice \`word[mid - 1:mid + 1]\` returns. The empty string is handled first with \`if not word\`: without that guard, the even branch would compute \`word[-1:1]\`, and a negative start is an easy thing to misread. An explicit early return says exactly what happens for empty input.`,
        files: {
          'main.py': py`def middle(word):
    if not word:
        return ""
    mid = len(word) // 2
    if len(word) % 2 == 1:
        return word[mid:mid + 1]
    return word[mid - 1:mid + 1]


print(middle("table"))
print(middle("python"))
`,
        },
      },
      tests: [
        { name: 'odd length gives one character', code: py`assert middle("table") == "b"` },
        { name: 'even length gives two characters', code: py`assert middle("python") == "th"` },
        { name: 'two-character word returns both', code: py`assert middle("ab") == "ab"` },
        { name: 'single character returns itself', code: py`assert middle("x") == "x"` },
        { name: 'empty string returns ""', code: py`assert middle("") == ""` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'strings-basics-why-immutable',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Python strings are immutable. What does that mean, and why was the language designed that way?',
      answer: 'Once created, a string object can never change; every "modifying" operation returns a new string. That makes strings hashable (usable as dict keys and set members), safe to share between functions and threads, and lets the interpreter reuse identical strings.',
      explanation: py`If strings could change, a string used as a dictionary key could be modified after insertion and the dict would look in the wrong bucket. Immutability also means passing a string into a function can never alter the caller's copy, and implementations can cache a string's hash and share equal strings. The cost is that repeated edits create new objects — which is why you build large strings with \`"".join(...)\`.`,
      code: { lang: 'python', code: py`prices = {"apple": 0.5}
key = "apple"
key = key.upper()        # a new string; the dict key is unaffected
print(prices["apple"])   # 0.5
print(key)               # APPLE` },
      whyAsked: 'Immutability underpins hashing, dict keys, argument passing and performance advice; interviewers want to see you connect them.',
      mistakes: ['Saying "you can\'t change a string variable" (you can re-bind the name; you can\'t change the object)', 'Not mentioning hashing / dict keys', 'Claiming immutability makes strings slow in general'],
      followUps: ['How would you change the third character of a string?', 'Why is building a string with += in a loop sometimes slow?', 'Which other built-in types are immutable?'],
      modelAnswer: 'Immutable means a string object can never change after it is created — operations like upper(), replace() or + always return a new string, and the old one stays as it was. Note that the variable can still be re-bound; it is the object that is frozen. Python does this mainly so strings can be hashed: a dict key or set member must never change, or lookups would break. It also makes strings safe to pass around and share, and lets the interpreter cache hashes and reuse equal strings. The trade-off is that many small edits create many new objects, so for building large text I collect pieces and use str.join.',
    },
    {
      id: 'strings-basics-index-vs-slice',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What happens when this runs?',
      code: { lang: 'python', code: py`code = "AB1"
print(repr(code[3:10]))
print(code[3])` },
      options: [
        "Prints '' then raises IndexError",
        'Raises IndexError on the first print',
        "Prints '' twice",
        "Prints 'AB1' then raises IndexError",
      ],
      correctOption: 0,
      answer: 'The slice prints an empty string \'\' (slices clip out-of-range positions), then code[3] raises IndexError: string index out of range.',
      explanation: py`Indexing asks for one specific position and must fail if it doesn't exist. A slice describes a *range*; positions outside the string are clipped to its ends, so an entirely out-of-range slice is just empty. This asymmetry is deliberate and identical for lists and tuples.`,
      whyAsked: 'A quick check that you know sequence semantics precisely — the kind of detail that causes silent bugs when parsing input.',
      mistakes: ['Assuming slices raise IndexError too', 'Thinking the slice returns None'],
      followUps: ['When could a silent empty slice hide a bug?', 'What does "abc"[-10:2] return?'],
      modelAnswer: "The first line prints an empty string, and the second raises IndexError. Indexing asks for exactly one position, so if it does not exist Python must raise. Slicing describes a range, and Python clips the start and stop to the string's bounds, so a range that lies completely outside the string simply gives an empty string. It's the same for lists and tuples. In practice that means slicing is forgiving, so when the length of input matters I check it explicitly rather than relying on an exception.",
    },
    {
      id: 'strings-basics-concat-loop',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare building a large string with `result += piece` in a loop versus `"".join(pieces)`. Which do you use and why?',
      code: { lang: 'python', code: py`rows = [f"row {i}" for i in range(1000)]

# Option A
report = ""
for row in rows:
    report += row + "\n"

# Option B
report_b = "\n".join(rows) + "\n"
print(report == report_b)   # True` },
      answer: 'Use join. Because strings are immutable, each += may copy everything built so far, which can make the loop quadratic. join computes the final size once and copies each piece once. CPython sometimes optimises += in place, but that is an implementation detail.',
      explanation: py`\`a + b\` must allocate a new string and copy both sides. In a loop, the growing prefix is copied again and again, so total work can grow with the square of the output length. \`str.join\` walks the pieces twice — once to add up the length, once to copy — so it is linear. CPython has a special case that can resize the left string in place when nothing else references it, which hides the problem in simple benchmarks; PyPy and other implementations don't promise this, and it breaks as soon as another reference exists. Measure with \`timeit\` rather than trusting either intuition.`,
      whyAsked: 'Tests whether you can connect immutability to performance and distinguish language guarantees from CPython optimisations.',
      mistakes: ['Saying += is "always O(n²)" without mentioning the CPython optimisation', 'Saying it doesn\'t matter because CPython optimises it', 'Using join on a generator of single characters where a slice would do'],
      followUps: ['How would you measure the difference?', 'What about io.StringIO?', 'Why must every item passed to join be a str?'],
      modelAnswer: 'I collect the pieces in a list and call join once. Strings are immutable, so result += piece has to produce a new string, and in general that means copying everything built so far — over a long loop that becomes quadratic work. join knows all the pieces up front, sums their lengths, allocates once and copies each piece once, so it is linear. CPython does have an optimisation that can grow the string in place when nothing else references it, so a quick benchmark might not show a difference, but that is an implementation detail other interpreters do not guarantee. If I cared about the speed I would measure with timeit; for readability and portability, join is the idiom.',
    },
    {
      id: 'strings-basics-windows-path',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A script on Windows fails with `FileNotFoundError` when opening `"C:\\temp\\new_report.txt"`, even though the file exists. What is wrong?',
      code: { lang: 'python', code: py`path = "C:\temp\new_report.txt"
print(repr(path))   # 'C:\temp\new_report.txt' shows \t and \n escapes` },
      answer: 'The backslashes form escape sequences: \\t becomes a tab and \\n a newline, so the path is wrong. Use a raw string r"C:\\temp\\new_report.txt", forward slashes, or pathlib.Path.',
      explanation: py`In a normal string literal, \`\t\` is a tab character and \`\n\` is a newline. \`repr(path)\` reveals them, while \`print(path)\` would actually show a tab and a line break. A raw string keeps backslashes literally; forward slashes are accepted by Windows APIs; \`pathlib\` avoids building paths by hand at all.`,
      whyAsked: 'A very common real-world bug that checks whether you understand escape sequences and know how to inspect strings with repr().',
      mistakes: ['Blaming file permissions', 'Doubling only some of the backslashes', 'Ending a raw string with a backslash (r"C:\\temp\\" is a SyntaxError)'],
      followUps: ['Why is repr() better than print() for debugging strings?', 'Why can\'t a raw string end with a single backslash?'],
      modelAnswer: 'The literal contains escape sequences: backslash-t is a tab and backslash-n is a newline, so the string Python sees is not the path the author typed. Printing repr of the string shows it immediately. The fix is a raw string with an r prefix, so backslashes are kept literally, or simply forward slashes, which Windows accepts. In real code I would use pathlib, for example Path("C:/temp") / "new_report.txt", so I never assemble paths by hand.',
    },
    {
      id: 'strings-basics-rotate',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `rotate_left(text, n)` that moves the first `n` characters to the end: `rotate_left("python", 2)` → `"thonpy"`. It must handle `n` larger than the length (`rotate_left("python", 8)` → `"thonpy"`), negative `n` (rotate right), and the empty string.',
      answer: 'Normalise n with n % len(text) (after guarding against an empty string), then return text[n:] + text[:n].',
      explanation: py`Rotating by the length gives the original string, so only \`n % len(text)\` matters. Python's \`%\` always returns a non-negative result for a positive divisor, so a negative \`n\` becomes the equivalent left rotation (\`-1 % 6 == 5\`). The empty string must be handled first because \`% 0\` raises \`ZeroDivisionError\`. Two slices and one \`+\` do the rest.`,
      starter: { files: { 'main.py': py`def rotate_left(text, n):
    # TODO: move the first n characters to the end
    return text


print(rotate_left("python", 2))
` } },
      tests: [
        { name: 'rotates by 2', code: py`assert rotate_left("python", 2) == "thonpy"` },
        { name: 'n larger than the length wraps around', code: py`assert rotate_left("python", 8) == "thonpy"` },
        { name: 'negative n rotates right', code: py`assert rotate_left("abc", -1) == "cab"` },
        { name: 'rotating by 0 or the length is a no-op', code: py`assert rotate_left("abc", 0) == "abc" and rotate_left("abc", 3) == "abc"` },
        { name: 'empty string stays empty', code: py`assert rotate_left("", 5) == ""` },
      ],
      solution: { files: { 'main.py': py`def rotate_left(text, n):
    if not text:
        return text
    n %= len(text)
    return text[n:] + text[:n]


print(rotate_left("python", 2))
` } },
      hints: ['Slices split a string at any point: text[:n] and text[n:].', 'Rotating by len(text) changes nothing, so reduce n with %. Guard against len(text) == 0 first.'],
      whyAsked: 'A small problem that checks slicing fluency, the modulo trick for wrap-around, and edge-case thinking (empty input, negative numbers).',
      mistakes: ['Forgetting the empty string (ZeroDivisionError)', 'Using a loop that moves one character at a time', 'Not handling n > len(text)'],
      followUps: ['How would you check whether one string is a rotation of another? (len equal and b in a + a)', 'How would you rotate a list in place? (collections.deque.rotate)'],
      modelAnswer: 'A rotation is just two slices swapped: text[n:] + text[:n]. Rotating by the full length gives the same string back, so I reduce n with n % len(text) — in Python that also turns a negative n into the matching left rotation, since the result of % takes the sign of the divisor. The one trap is the empty string, where % len(text) would divide by zero, so I return early for that. The whole thing is linear in the length of the string.',
    },
    {
      id: 'strings-basics-cpython-storage',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does CPython store a str in memory, and what does that mean for indexing speed and memory use? Which parts are guaranteed by the language?',
      answer: 'Since PEP 393 (Python 3.3), CPython stores each string with 1, 2 or 4 bytes per code point, chosen by the widest character in it. That gives O(1) indexing and compact ASCII strings, but one emoji can quadruple a long string\'s size. The language only guarantees a str is an immutable sequence of code points; storage and indexing cost are CPython details.',
      explanation: py`CPython picks the narrowest fixed width that fits every code point in the string: Latin-1 range → 1 byte, the Basic Multilingual Plane → 2 bytes, anything above (most emoji) → 4 bytes. Fixed width makes \`s[i]\` simple address arithmetic. You can observe it with \`sys.getsizeof("a" * 10)\` versus \`sys.getsizeof("😀" * 10)\`. Other implementations differ — MicroPython stores UTF-8 and indexing can require scanning — so portable code shouldn't depend on these costs. CPython also caches each string's hash after first use, which is part of why dict lookups with string keys are fast.`,
      code: { lang: 'python', code: py`import sys
for text in ["a" * 10, "€" * 10, "😀" * 10]:
    print(len(text), sys.getsizeof(text))   # same length, growing size` },
      whyAsked: 'Senior candidates are expected to reason about memory and to separate CPython internals from language semantics.',
      mistakes: ['Saying Python strings are UTF-8 in memory (that is the usual file encoding, not CPython\'s in-memory format)', 'Claiming len() counts bytes', 'Presenting O(1) indexing as a language guarantee'],
      followUps: ['What does len() count?', 'Why might reading a large mostly-ASCII file with one emoji use more memory than expected?', 'How is this different from bytes?'],
      modelAnswer: 'CPython uses the flexible string representation from PEP 393: each string is stored as an array of fixed-width units — one, two or four bytes per code point — and the width is chosen by the widest character in that particular string. Pure ASCII text is therefore compact, and indexing is constant time because it is just address arithmetic. The flip side is that a single emoji in a long string forces four bytes for every character. The language itself only promises that a str is an immutable sequence of Unicode code points; the storage layout, the hash caching and the O(1) indexing are CPython implementation details, and something like MicroPython stores UTF-8 instead.',
    },
  ],

  takeaways: [
    'A str is an immutable sequence of characters; quotes can be single, double or triple (multi-line).',
    'Backslash escapes like \\n and \\t stand for special characters; raw strings r"..." keep backslashes literally.',
    'Indexes start at 0; negative indexes count from the end, so s[-1] is the last character.',
    's[start:stop:step] returns a new string; stop is excluded, out-of-range slices clip instead of raising, and s[::-1] reverses.',
    'len() counts characters, in tests for a substring, + joins strings and * repeats them.',
    'You can never change a string in place — build a new one and re-bind the name.',
  ],
}
