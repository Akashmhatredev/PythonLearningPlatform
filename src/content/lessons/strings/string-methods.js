// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const FORM_CLEANER = py`# Clean up messy sign-up form data, one field at a time
raw_name = "   aDA    lovelace  "
raw_email = "  Ada.Lovelace@Example.COM \n"
raw_phone = "020-7946-0958"
raw_tags = "Python, maths ,POETRY"

name = " ".join(raw_name.split()).title()   # collapse spaces, fix case
email = raw_email.strip().lower()
user, at, domain = email.partition("@")
phone = raw_phone.replace("-", "")
tags = raw_tags.lower().replace(" ", "").split(",")

print("Name:", name)
print("Email:", email)
print("User:", user, "| domain:", domain)
print("Phone:", phone, "| digits only?", phone.isdigit())
print("Tags:", tags)
print("Tag line:", " / ".join(tags))
print("Known domain?", domain.endswith((".com", ".org")))
print("Raw name untouched:", repr(raw_name))
`

export default {
  id: 'string-methods',
  title: 'String methods: cleaning, splitting & joining',
  summary: 'Built-in string methods strip, re-case, search, split, join and test text — each one returns a new string (or a list, number or bool) and never changes the original.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['strings-basics'],
  related: ['string-formatting', 'unicode-and-bytes', 'regular-expressions', 'lists', 'input-validation', 'type-conversion', 'csv-data'],
  tags: ['string methods', 'strip', 'lower', 'upper', 'title', 'casefold', 'split', 'join', 'replace', 'find', 'index', 'startswith', 'endswith', 'count', 'isdigit', 'isalpha', 'partition', 'removeprefix', 'removesuffix', 'cleaning input', 'normalize whitespace'],
  apis: [
    { name: 'str.strip([chars])', summary: 'Returns a copy with leading and trailing whitespace (or any of the given characters) removed. Also lstrip() and rstrip().' },
    { name: 'str.lower() / str.upper()', summary: 'Returns a lowercased / uppercased copy.' },
    { name: 'str.casefold()', summary: 'Aggressive lowercasing for case-insensitive comparison ("ß" becomes "ss").' },
    { name: 'str.title() / str.capitalize()', summary: 'Capitalise the first letter of every word / of the whole string.' },
    { name: 'str.split(sep=None, maxsplit=-1)', summary: 'Splits into a list of pieces. With no sep, splits on runs of whitespace and drops empty pieces.' },
    { name: 'str.join(iterable)', summary: 'Glues an iterable of strings together, with the string itself as the separator.' },
    { name: 'str.replace(old, new[, count])', summary: 'Returns a copy with occurrences of old replaced by new.' },
    { name: 'str.find(sub) / str.index(sub)', summary: 'Position of the first occurrence; find returns -1 if missing, index raises ValueError.' },
    { name: 'str.startswith(prefix) / str.endswith(suffix)', summary: 'True if the string starts / ends with the text — or with any of a tuple of texts.' },
    { name: 'str.count(sub)', summary: 'Number of non-overlapping occurrences of sub.' },
    { name: 'str.partition(sep)', summary: 'Splits once at the first sep into a 3-tuple (before, sep, after).' },
    { name: 'str.removeprefix() / str.removesuffix()', summary: 'Python 3.9+: remove an exact prefix / suffix if present.' },
    { name: 'str.isdigit(), isalpha(), isalnum(), isspace()', summary: 'Character-class tests that return True or False.' },
  ],
  docs: [
    { label: 'Library reference — string methods', url: 'https://docs.python.org/3/library/stdtypes.html#string-methods' },
    { label: 'PEP 616 — removeprefix() and removesuffix()', url: 'https://peps.python.org/pep-0616/' },
    { label: 'Unicode HOWTO — comparing strings', url: 'https://docs.python.org/3/howto/unicode.html#comparing-strings' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **method** is a function that belongs to an object. You call it with a dot: \`name.upper()\` means "ask the string \`name\` for an uppercase version of itself". Strings come with about fifty methods, and a dozen of them do most of the real work: trimming spaces, fixing capitals, finding things, splitting text into pieces and gluing pieces back together.`,
    py`Because strings are [immutable](lesson:strings-basics), **no string method changes the string you call it on**. Each one *returns* something new — another string, a list, a number or \`True\`/\`False\`. If you don't store the result, it is thrown away. That single rule explains the most common string bug in Python.`,
    py`Methods that return strings can be **chained**: \`raw.strip().lower()\` strips first, then lowercases the result. Read chains left to right, like a production line.`,
  ],
  why: [
    py`Real-world text is messy. Users type \`"  ADA@example.COM "\`, spreadsheets export \`"London , Paris,,Rome"\`, log files mix \`ERROR\` and \`error\`. Before you can compare, store or search text, you have to **clean** it — and string methods are the built-in, fast, readable way to do that.`,
    py`Splitting and joining are how text becomes data and back again: a CSV row becomes a list of fields, a list of tags becomes \`"python, maths, poetry"\`. You'll use \`split\` and \`join\` in almost every program that reads files or input. (For full CSV files, use the [csv module](lesson:csv-data), which handles quotes and commas inside fields.)`,
  ],
  eli15: [
    py`Imagine a string is a sentence written on a whiteboard that nobody is allowed to erase. String methods are helpers who *read* the whiteboard and write a **new**, improved version on a fresh sheet of paper: one helper removes the extra spaces at the ends (\`strip\`), one makes everything lowercase (\`lower\`), one cuts the sentence into words (\`split\`), one glues words back together with a dash between them (\`"-".join(...)\`).`,
    py`The whiteboard never changes. If you want to keep the helper's work, you have to hold on to their sheet of paper: \`clean = raw.strip()\`. If you just say \`raw.strip()\` and walk away, the clean copy goes in the bin.`,
  ],
  analogy: {
    title: 'A photocopier with settings',
    body: [
      py`A string method is like pressing a button on a photocopier: "copy, but trim the margins", "copy, but in capitals", "copy, but cut it into strips at every comma". The original page goes back in the tray exactly as it was; a new page comes out.`,
      py`Chaining is feeding the new page straight back in with a different setting: trim, *then* capitalise. And \`join\` is the reverse of cutting into strips: tape the strips back together, with a chosen piece of tape (the separator) between each pair.`,
    ],
    mapping: [
      ['the original page', 'the string you call the method on — never changed'],
      ['the copy that comes out', 'the return value — store it or lose it'],
      ['"trim the margins"', 'strip()'],
      ['"copy in capitals"', 'upper() / lower() / title()'],
      ['cutting into strips at each comma', 'split(",") → a list of strings'],
      ['taping strips together with tape between them', '", ".join(pieces)'],
      ['feeding the copy back in', 'chaining: raw.strip().lower()'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Every method returns a new object',
    props: {
      code: py`raw = "  ada LOVELACE "
clean = raw.strip()
clean = clean.title()
first, last = clean.split()
username = (first[0] + last).lower()
print(repr(raw))
print(username)
`,
      inline: false,
      notes: {
        1: 'One string object, with spaces at both ends and messy capitals.',
        2: '`strip()` builds a **new** string without the outer spaces. `raw` still points at the original.',
        3: '`title()` builds yet another string. The name `clean` moves to it; the stripped-but-lowercase version is no longer needed.',
        4: '`split()` returns a **list** of two new strings, which are unpacked into `first` and `last`.',
        5: '`first[0] + last` makes `"ALovelace"`, then `.lower()` makes `"alovelace"`. Two new strings, one line.',
        6: '`repr(raw)` shows the quotes and spaces: the original is exactly as it was.',
      },
    },
    alt: 'A step-by-step trace. raw points to the string "  ada LOVELACE ". strip() creates a new string "ada LOVELACE" bound to clean; title() creates "Ada Lovelace" and clean moves to it. split() creates a list of two strings, "Ada" and "Lovelace", unpacked into first and last. Concatenating and lowercasing creates "alovelace" for username. The original raw string never changes, as the printed repr shows.',
    caption: py`Step through with ▶ and count the string objects: every method call adds new ones, and \`raw\` is never modified.`,
  },
  syntax: [
    py`#### Cleaning: strip, lstrip, rstrip`,
    { code: py`raw = "\t  ada@example.com \n"
print(repr(raw.strip()))    # 'ada@example.com'  — both ends
print(repr(raw.lstrip()))   # 'ada@example.com \n' — left only
print(repr(raw.rstrip()))   # '\t  ada@example.com' — right only
print("xxhixx".strip("x"))  # hi — strip specific characters instead`, lang: 'python', title: 'strip removes whitespace from the ends' },
    py`**Whitespace** means spaces, tabs (\`\t\`), newlines (\`\n\`) and a few other invisible characters. \`strip()\` never touches the *middle* of a string. With an argument, it removes **any of those characters** from the ends — a *set* of characters, not a word. That catches people out (see the mistakes section).`,
    py`#### Changing case`,
    { code: py`city = "new YORK city"
print(city.lower())        # new york city
print(city.upper())        # NEW YORK CITY
print(city.title())        # New York City     — every word
print(city.capitalize())   # New york city     — first letter only
print("Straße".casefold()) # strasse           — for comparisons`, lang: 'python', title: 'lower, upper, title, capitalize, casefold' },
    py`To compare text while ignoring case, compare **casefolded** copies: \`a.casefold() == b.casefold()\`. \`casefold()\` is like \`lower()\` but more aggressive, so that, for example, German \`"ß"\` matches \`"SS"\`. For plain English text the two give the same result.`,
    py`#### Splitting and joining`,
    { code: py`print("red green  blue".split())       # ['red', 'green', 'blue']
print("red,green,,blue".split(","))    # ['red', 'green', '', 'blue']
print("2026-04-12".split("-", 1))      # ['2026', '04-12']  (maxsplit=1)
print("one\ntwo\n".splitlines())       # ['one', 'two']

words = ["tea", "milk", "sugar"]
print(", ".join(words))                # tea, milk, sugar
print("".join(["P", "y"]))             # Py
print("-".join("abc"))                 # a-b-c (a string is a sequence of strings)`, lang: 'python', title: 'split and join are opposites' },
    py`\`split\` returns a **list** — an ordered collection of values written in square brackets (all about them in [lists](lesson:lists)). Two modes are worth memorising:`,
    py`- \`s.split()\` with **no argument** splits on any run of whitespace and throws away empty pieces. Perfect for words typed by humans.
- \`s.split(",")\` with a **separator** splits on exactly that text and keeps empty pieces: \`"a,,b"\` → \`['a', '', 'b']\`. Perfect for data where an empty field means something.`,
    py`\`join\` is called **on the separator**: \`", ".join(words)\`. Every item must already be a string — \`", ".join([1, 2])\` raises \`TypeError\`.`,
    py`#### Searching`,
    { code: py`line = "2026-04-12 ERROR disk full on /dev/sda"
print("ERROR" in line)           # True  — just yes/no
print(line.find("ERROR"))        # 11    — first position, or -1 if missing
print(line.find("WARN"))         # -1
print(line.index("disk"))        # 17    — like find, but raises if missing
print(line.count("/"))           # 2     — non-overlapping occurrences
print(line.startswith("2026"))   # True
print(line.endswith(("sda", "sdb")))   # True: a tuple means "any of these"`, lang: 'python', title: 'in, find, index, count, startswith, endswith' },
    py`Use \`in\` when you only need yes/no. Use \`find\` when "not there" is normal and you'll check for \`-1\`; use \`index\` when "not there" is a bug and an exception (\`ValueError: substring not found\`) is the right reaction. \`rfind\`/\`rindex\` search from the right.`,
    py`#### Replacing and cutting off`,
    { code: py`print("2026/04/12".replace("/", "-"))        # 2026-04-12
print("aaa".replace("a", "b", 2))            # bba — only the first 2

print("key=value=x".partition("="))          # ('key', '=', 'value=x')
print("no-separator".partition("="))         # ('no-separator', '', '')
print("photos/2026/cat.jpg".rpartition("/")) # ('photos/2026', '/', 'cat.jpg')

print("https://example.com".removeprefix("https://"))   # example.com
print("report.txt".removesuffix(".txt"))                # report`, lang: 'python', title: 'replace, partition, removeprefix, removesuffix' },
    { callout: 'version', title: 'Python 3.9+', text: py`\`removeprefix()\` and \`removesuffix()\` were added in Python 3.9 (PEP 616). They remove an exact piece of text only if it is there — unlike \`strip()\`, which removes *characters*. On older Pythons you would write \`s[len(prefix):] if s.startswith(prefix) else s\`.` },
    py`#### Testing what a string contains`,
    { code: py`print("2026".isdigit())     # True  — only digit characters
print("-5".isdigit())       # False — "-" is not a digit
print("3.14".isdigit())     # False — nor is "."
print("Ada".isalpha())      # True  — only letters
print("R2D2".isalnum())     # True  — letters or digits
print("   ".isspace())      # True  — only whitespace
print("".isdigit())         # False — empty strings fail every is…() test`, lang: 'python', title: 'the is…() family' },
    py`#### Padding and alignment (quick tour)`,
    { code: py`print("42".zfill(5))          # 00042
print("menu".center(10, "*"))  # ***menu***
print("tea".ljust(6, ".") + "£2")   # tea...£2
print("7".rjust(3))            # "  7"`, lang: 'python', title: 'zfill, center, ljust, rjust' },
    py`For anything more than a quick pad, [f-strings and the format mini-language](lesson:string-formatting) are clearer: \`f"{item:.<6}£2"\`.`,
  ],
  walkthrough: {
    title: 'Reading the form cleaner line by line',
    lang: 'python',
    code: FORM_CLEANER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 5], text: py`Four "raw" values, as a user might really type them: extra spaces, random capitals, a stray newline (\`\n\`), separators in the phone number.` },
      { lines: [7], text: py`Read the chain inside-out: \`raw_name.split()\` → \`['aDA', 'lovelace']\` (whitespace runs vanish), \`" ".join(...)\` → \`"aDA lovelace"\` (exactly one space), \`.title()\` → \`"Ada Lovelace"\`. This split-then-join trick is the idiomatic way to **normalise whitespace**.` },
      { lines: [8], text: py`\`strip()\` removes the spaces and the newline from both ends, then \`lower()\` makes the email case-consistent. Order matters only for readability here — both return new strings.` },
      { lines: [9], text: py`\`partition("@")\` cuts at the first \`@\` and returns a 3-tuple, which is unpacked into three names. If there were no \`@\`, \`at\` and \`domain\` would be empty strings — no crash.` },
      { lines: [10, 11], text: py`\`replace("-", "")\` deletes every dash. The tags line chains three methods: lowercase, remove spaces, then split on commas into a list.` },
      { lines: [16], text: py`\`isdigit()\` answers "is every character a digit?" — a quick sanity check after cleaning.` },
      { lines: [18, 19], text: py`\`" / ".join(tags)\` glues the list back into one string. \`endswith\` with a **tuple** checks several endings in one call.` },
      { lines: [20], text: py`\`repr()\` shows the original with its quotes and spaces: none of the methods above changed it.` },
    ],
  },
  playground: {
    title: 'Sign-up form cleaner',
    objective: 'Run it, then make the cleaning robust to messier input and pull more information out of the fields.',
    files: { 'main.py': FORM_CLEANER },
    expected: py`\`\`\`text
Name: Ada Lovelace
Email: ada.lovelace@example.com
User: ada.lovelace | domain: example.com
Phone: 02079460958 | digits only? True
Tags: ['python', 'maths', 'poetry']
Tag line: python / maths / poetry
Known domain? True
Raw name untouched: '   aDA    lovelace  '
\`\`\``,
    experiments: [
      {
        id: 'phone-spaces',
        task: py`Users type phone numbers in many ways. Change \`raw_phone\` to \`"020 7946-0958"\` (with a **space**) and run: "digits only?" becomes \`False\`. Fix the cleaning line so \`phone\` is digits only again.`,
        hint: py`\`replace\` returns a string, so you can chain a second one: \`.replace("-", "").replace(" ", "")\`.`,
        tests: [
          { name: 'raw_phone now contains a space', code: py`assert " " in raw_phone, 'Put a space into raw_phone first'` },
          { name: 'phone is digits only', code: py`assert phone.isdigit(), 'Remove the spaces as well as the dashes'` },
        ],
        explain: py`Each \`replace\` returns a new string, so chaining applies them one after another. For many different characters, a [regular expression](lesson:regular-expressions) such as \`re.sub(r"\D", "", raw_phone)\` ("remove every non-digit") scales better.`,
      },
      {
        id: 'initials',
        task: py`Create a variable \`initials\` holding the person's initials (\`"AL"\`), using \`split()\` on \`name\`, and print it.`,
        hint: py`\`first, last = name.split()\` gives you two words; \`first[0]\` is a word's first letter.`,
        tests: [
          { name: 'initials are the first letters of each word', code: py`assert ns.get('initials') == "".join(word[0] for word in name.split()), 'initials should be "AL"'` },
          { name: 'initials are printed', code: py`assert initials in output` },
        ],
        explain: py`\`split()\` turns the name into a list of words, and indexing \`[0]\` takes the first character of each. For names with any number of words you'd loop over the list — \`"".join(word[0] for word in name.split())\` — which you'll be able to read fluently after [comprehensions](lesson:comprehensions).`,
      },
      {
        id: 'website',
        task: py`Add \`raw_site = "https://shop.example.com/"\`. First print \`raw_site.strip("https:/")\` and look closely at the result. Then create \`site\` holding just \`"shop.example.com"\` using \`removeprefix\` and \`removesuffix\`.`,
        hint: py`\`site = raw_site.removeprefix("https://").removesuffix("/")\``,
        tests: [
          { name: 'site is the bare host name', code: py`assert ns.get('site') == "shop.example.com", 'site should be "shop.example.com"'` },
        ],
        explain: py`\`strip("https:/")\` removes any of the characters h, t, p, s, : and / from both ends — so it also eats the \`s\` and \`h\` of \`shop\`, leaving \`op.example.com\`. \`removeprefix\`/\`removesuffix\` (Python 3.9+) remove an exact piece of text, once, and only if it is there.`,
      },
      {
        id: 'casefold',
        task: py`Two people typed the same street differently: \`"Hauptstraße"\` and \`"HAUPTSTRASSE"\`. Create \`same_street\` that is \`True\` when they match ignoring case. Try \`lower()\` first and see why it isn't enough.`,
        hint: py`\`"Hauptstraße".casefold() == "HAUPTSTRASSE".casefold()\``,
        tests: [
          { name: 'same_street is True', code: py`assert ns.get('same_street') is True, 'Compare the casefolded versions'` },
        ],
        explain: py`\`lower()\` leaves \`ß\` alone, so \`"hauptstraße" != "hauptstrasse"\`. \`casefold()\` maps \`ß\` to \`ss\`, which is what case-insensitive matching needs. Use \`casefold()\` whenever you compare text "ignoring case".`,
      },
    ],
  },
  animation: {
    type: 'performance',
    title: 'Building a long string: += versus join',
    props: { demo: 'string-building' },
    alt: 'A live measurement, run by real Python in the browser, comparing building a long string by repeated += concatenation with collecting the pieces in a list and calling str.join once.',
    caption: py`Measured live in your browser. Strings are immutable, so \`+=\` may copy what's been built so far on every step; \`"".join(pieces)\` sizes the result once. CPython sometimes optimises \`+=\` in place — an implementation detail — so look at the real numbers rather than assuming.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every method you call on a string runs and hands you back a value; the string itself is untouched. The pattern is always \`result = text.method(...)\`. If you see a line that calls a string method and doesn't use the result, it's almost certainly a bug.`,
      { code: py`title = "  hello  "
title.strip()            # result thrown away!
print(repr(title))       # '  hello  '
title = title.strip()    # keep it by re-binding the name
print(repr(title))       # 'hello'`, lang: 'python', title: 'store the result' },
      py`Methods that return the same type can be chained, and methods that return a list (like \`split\`) hand you something you can index, loop over or \`join\`.`,
    ],
    technical: [
      py`**What counts as whitespace?** \`split()\` and \`strip()\` with no argument use Unicode's definition: spaces, tabs, newlines, carriage returns, form feeds, and characters like the non-breaking space. That's why \`split()\` is safer than \`split(" ")\` for human text.`,
      py`**The \`is…()\` methods are Unicode-aware.** \`"é".isalpha()\` is \`True\`, and \`isdigit()\` accepts digits from other scripts (\`"٣".isdigit()\` is \`True\`) and even superscripts like \`"²"\` — which \`int()\` then refuses. There are three related tests: \`isdecimal()\` (strictest: characters usable in base-10 numbers), \`isdigit()\`, and \`isnumeric()\` (loosest: also fractions like \`"½"\`). To check "is this a valid integer?", the robust answer is to *try* \`int(text)\` and handle \`ValueError\` — see [try/except](lesson:try-except).`,
      { code: py`for text in ["42", "²", "½", "-7"]:
    print(text, text.isdecimal(), text.isdigit(), text.isnumeric())`, lang: 'python', title: 'three digit tests, three answers' },
      py`**Case is language-dependent.** \`upper()\` can even change the length: \`"ﬁ".upper()\` (a single "fi" ligature character) becomes \`"FI"\`, two characters. Case mapping follows the Unicode standard, not just A–Z. Comparing names or emails "ignoring case" correctly means \`casefold()\`, and for full robustness also normalising accents — see [Unicode & bytes](lesson:unicode-and-bytes).`,
      { callout: 'note', title: 'CPython detail', text: py`String methods are implemented in C in CPython, so a single \`replace\` or \`split\` call over a large string is far faster than an equivalent Python loop over its characters. That's an implementation fact about CPython rather than a language rule — but it's why "use the built-in method" is good advice on every major Python.` },
    ],
    production: [
      py`**Clean at the boundary.** Normalise input once, where it enters your program (a form handler, a file reader), and keep clean values inside. A typical pipeline for a username or email: \`strip()\` → collapse inner whitespace with \`" ".join(s.split())\` → \`casefold()\` *for comparison/lookup* (but store what the user typed for display) → validate length and allowed characters. Treat every input as untrusted — see [input validation](lesson:input-validation).`,
      py`**Know when methods run out.** String methods are perfect for fixed separators and simple checks. When the rule is a *pattern* ("three letters, a dash, four digits") use [regular expressions](lesson:regular-expressions); for CSV use the [csv module](lesson:csv-data); for URLs use \`urllib.parse\`; for paths use [pathlib](lesson:pathlib). Hand-rolled \`split(",")\` breaks on \`"Smith, Jr."\` inside quotes.`,
      py`**Build big text with join.** Collect pieces in a list and \`"".join(pieces)\` at the end — linear time on every Python implementation, and it reads clearly.`,
    ],
  },
  mistakes: [
    {
      title: 'Calling a method and throwing the result away',
      wrong: { code: py`username = "  Ada  "
username.strip()
username.lower()
print(repr(username))   # '  Ada  ' — unchanged`, lang: 'python' },
      right: { code: py`username = "  Ada  "
username = username.strip().lower()
print(repr(username))   # 'ada'`, lang: 'python' },
      explanation: py`String methods return new strings; they can't modify the original. Assign the result (usually back to the same name).`,
    },
    {
      title: 'Using strip() to remove a word',
      wrong: { code: py`filename = "report.txt"
print(filename.rstrip(".txt"))   # repor — the final "t" of "report" went too!`, lang: 'python' },
      right: { code: py`filename = "report.txt"
print(filename.removesuffix(".txt"))   # report  (Python 3.9+)`, lang: 'python' },
      explanation: py`\`strip\`, \`lstrip\` and \`rstrip\` treat their argument as a **set of characters** and keep removing any of them from the end. Use \`removeprefix\`/\`removesuffix\` to remove an exact piece of text — or [pathlib](lesson:pathlib)'s \`Path(filename).stem\` for file names.`,
    },
    {
      title: 'split(" ") on human-typed text',
      wrong: { code: py`words = "hello   world".split(" ")
print(words)        # ['hello', '', '', 'world'] — empty "words"`, lang: 'python' },
      right: { code: py`words = "hello   world".split()
print(words)        # ['hello', 'world']`, lang: 'python' },
      explanation: py`With an explicit separator, every occurrence splits — even neighbouring ones — producing empty strings. \`split()\` with no argument treats any run of whitespace (spaces, tabs, newlines) as one separator and ignores the ends.`,
    },
    {
      title: 'Using find() and forgetting it returns -1',
      wrong: { code: py`email = "ada.example.com"          # no @ — bad input
at = email.find("@")               # -1
user = email[:at]                  # silently "ada.example.co"
print(user)`, lang: 'python' },
      right: { code: py`email = "ada.example.com"
user, at, domain = email.partition("@")
if not at:
    print("not an email address:", email)
else:
    print(user)`, lang: 'python' },
      explanation: py`\`-1\` is a valid index in Python (the last character), so using \`find\`'s result without checking gives wrong answers instead of errors. Check for \`-1\`, use \`index\` (which raises), or use \`partition\`, whose middle element is \`""\` when the separator is missing.`,
    },
    {
      title: 'Joining non-strings',
      wrong: { code: py`scores = [90, 85, 77]
print(", ".join(scores))   # TypeError: sequence item 0: expected str instance, int found`, lang: 'python', static: true },
      right: { code: py`scores = [90, 85, 77]
print(", ".join(str(s) for s in scores))   # 90, 85, 77
print(", ".join(map(str, scores)))         # same thing`, lang: 'python' },
      explanation: py`\`join\` only glues strings. Convert each item first; the generator expression and [\`map\`](lesson:map-filter-reduce) both do that without building an extra list.`,
    },
    {
      title: 'Comparing with lower() instead of casefold()',
      wrong: { code: py`print("Straße".lower() == "STRASSE".lower())   # False`, lang: 'python' },
      right: { code: py`print("Straße".casefold() == "STRASSE".casefold())   # True`, lang: 'python' },
      explanation: py`\`lower()\` is for *displaying* lowercase text. \`casefold()\` is designed for *comparing* text without regard to case, including special cases outside English.`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'list' object has no attribute 'strip'`,
      cause: py`\`split()\` already turned the string into a list, and a string method was then called on the list.`,
      fix: py`Call string methods before splitting (\`line.strip().split(",")\`), or on each item afterwards. Print \`type(x)\` when unsure what you have.`,
    },
    {
      symptom: py`ValueError: substring not found`,
      cause: py`\`str.index()\` (or \`rindex\`) couldn't find the text.`,
      fix: py`If "missing" is normal, use \`find()\` and check for \`-1\`, or test with \`in\` first, or use \`partition()\`.`,
    },
    {
      symptom: py`TypeError: sequence item 0: expected str instance, int found`,
      cause: py`\`join()\` received numbers (or other non-strings).`,
      fix: py`Convert first: \`", ".join(map(str, values))\`.`,
    },
    {
      symptom: py`ValueError: not enough values to unpack (expected 2, got 1)`,
      cause: py`\`a, b = text.split(",")\` on text that had no comma (or more than one, which gives "too many values to unpack").`,
      fix: py`Use \`partition(",")\` (always 3 parts), pass \`maxsplit=1\`, or check the length of the list before unpacking.`,
    },
    {
      symptom: py`A comparison that "should" match fails, e.g. \`"ada " == "ada"\` is False.`,
      cause: py`Invisible differences: trailing spaces, a newline from \`input()\` or a file, different case, or different Unicode forms of the same letter.`,
      fix: py`Print \`repr(value)\` to see hidden characters, then \`strip()\` / \`casefold()\`; for accents, normalise with \`unicodedata.normalize\` ([Unicode & bytes](lesson:unicode-and-bytes)).`,
    },
  ],
  bestPractices: [
    'Always use the return value: text = text.strip(), never just text.strip().',
    'Use split() with no argument for human-typed words; use split(sep) for machine data where empty fields matter.',
    'Normalise whitespace with " ".join(text.split()).',
    'Compare text case-insensitively with casefold(), not lower().',
    'Use removeprefix()/removesuffix() (3.9+) to remove exact text; strip(chars) removes characters, not words.',
    'Use in for yes/no checks, find() when absence is normal, index() when absence is a bug.',
    'Pass a tuple to startswith()/endswith() to test several options at once.',
    'Reach for the csv module, pathlib, urllib.parse or re when the format is more than a simple separator.',
  ],
  useCases: [
    'Cleaning form input: trimming spaces, fixing case, removing separators from phone numbers.',
    'Parsing simple formats: "key=value" config lines, "name,score" rows, log lines.',
    'Building output: joining tags, file paths parts or CSV fields with a separator.',
    'Filtering: keeping log lines that start with "ERROR" or files that end with (".jpg", ".png").',
    'Case-insensitive search and de-duplication of user-typed names or emails.',
  ],
  comparison: {
    title: 'Searching inside a string',
    headers: ['', 'returns', 'when not found', 'use it when'],
    rows: [
      ['sub in s', 'True / False', 'False', 'you only need yes or no'],
      ['s.find(sub)', 'first index', '-1 (careful: -1 is a valid index!)', 'absence is normal and you need the position'],
      ['s.index(sub)', 'first index', 'raises ValueError', 'absence means a bug or bad data'],
      ['s.count(sub)', 'number of matches', '0', 'you need how many'],
      ['s.startswith(x) / endswith(x)', 'True / False', 'False', 'checking a prefix/suffix (x may be a tuple)'],
      ['s.partition(sep)', '(before, sep, after)', '(s, "", "")', 'splitting once at a separator, safely'],
    ],
  },
  whenToUse: {
    use: [
      'Fixed separators and simple rules: commas, "=", "@", known prefixes.',
      'Cleaning whitespace and case before comparing or storing text.',
      'Fast, readable checks: in, startswith, endswith, isdigit.',
    ],
    avoid: [
      'Patterns with variable structure (dates, phone formats) — use regular expressions.',
      'Real CSV with quoted fields — use the csv module.',
      'File paths and URLs — use pathlib and urllib.parse.',
      'Checking "is this a number?" with isdigit() — try int()/float() and catch ValueError.',
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'string-methods-q1',
      type: 'mcq',
      prompt: py`What does \`"red  green".split(" ")\` return? (There are **two** spaces between the words.)`,
      options: [
        { text: "['red', 'green']", why: 'That is what split() with no argument returns. With an explicit " " separator, every single space splits.' },
        "['red', '', 'green']",
        { text: "['red ', ' green']", why: 'The separator itself is removed from the pieces; it never stays attached.' },
        { text: "['red  green']", why: 'The string does contain the separator, so it is split.' },
      ],
      answer: 1,
      explanation: py`With an explicit separator, the text *between* the two neighbouring spaces is an empty string, so it appears in the list. \`split()\` with no argument would collapse the run of spaces and give \`['red', 'green']\`.`,
    },
    {
      id: 'string-methods-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`s = "  Hello  "
s.strip()
print("[" + s + "]")`,
      answer: '[  Hello  ]',
      accept: ['[  Hello  ]'],
      explanation: py`\`s.strip()\` returns a new string, but the result is never stored. \`s\` still refers to the original with its spaces. Write \`s = s.strip()\` to keep the cleaned version.`,
    },
    {
      id: 'string-methods-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`print("www.example.com".strip("w.moc"))`,
      options: [
        { text: 'example.com', why: 'strip removes characters from both ends — and c, o, m and . are all in the set, so ".com" goes too.' },
        'example',
        { text: 'www.example.com', why: 'Several characters at each end are in the set "w.moc", so they are removed.' },
        { text: 'xample', why: 'Stripping stops at the first character not in the set. "e" is not in "w.moc", so the e of "example" survives.' },
      ],
      answer: 1,
      explanation: py`The argument is a **set of characters**: w, ., m, o, c. From the left, \`www.\` are all in the set; \`e\` is not, so stripping stops. From the right, \`moc.\` are in the set; \`e\` is not. Result: \`example\`. To remove exact text, use \`removeprefix("www.")\` and \`removesuffix(".com")\`.`,
    },
    {
      id: 'string-methods-q4',
      type: 'bug',
      prompt: 'The greeting still contains the extra spaces. Click the line with the bug.',
      code: py`name = input("Name: ")
name.strip()
greeting = "Hello, " + name + "!"
print(greeting)`,
      answerLine: 2,
      explanation: py`Line 2 throws away the stripped copy. It should be \`name = name.strip()\` (or \`name = input("Name: ").strip()\` on line 1).`,
    },
    {
      id: 'string-methods-q5',
      type: 'fill',
      prompt: 'Complete the code so it prints `eggs, milk, bread` and then `True`.',
      code: py`items = ["eggs", "milk", "bread"]
print(", ".___(items))
line = "ERROR: disk full"
print(line.___("ERROR"))`,
      answer: [['join'], ['startswith']],
      explanation: py`\`join\` is called on the separator and glues the list items together. \`startswith\` checks the beginning of the string. (\`"ERROR" in line\` would also print \`True\`, but it would match "ERROR" anywhere in the line.)`,
    },
    {
      id: 'string-methods-q6',
      type: 'mcq',
      prompt: py`\`text = "banana"\`. Which expression **raises an exception** because \`"x"\` isn't in the text?`,
      options: [
        { text: 'text.find("x")', why: 'find returns -1 when the substring is missing; it never raises.' },
        'text.index("x")',
        { text: 'text.count("x")', why: 'count returns 0 when there are no matches.' },
        { text: '"x" in text', why: 'in simply evaluates to False.' },
      ],
      answer: 1,
      explanation: py`\`index\` raises \`ValueError: substring not found\`. Choose it when a missing substring means something is wrong; choose \`find\` (and check for \`-1\`) when it's an expected case.`,
    },
    {
      id: 'string-methods-q7',
      type: 'short',
      prompt: 'Why should you compare user-typed names with `casefold()` rather than `lower()`?',
      answer: py`\`lower()\` is meant for displaying text in lowercase; \`casefold()\` is designed for caseless *comparison* and folds extra cases that \`lower()\` leaves alone — for example the German "ß" becomes "ss", so "Straße" and "STRASSE" compare equal. For English letters they behave the same, but casefold is the correct tool whenever the goal is "equal ignoring case".`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'make-username',
      title: 'Username from a full name',
      difficulty: 'beginner',
      prompt: py`Write \`make_username(full_name)\` that turns a messy full name into a username:

- remove spaces at the ends,
- make everything lowercase,
- join the words with a single underscore \`_\`, however many spaces were between them.

\`\`\`text
make_username("  Ada   LOVELACE ")  ->  "ada_lovelace"
make_username("grace hopper")       ->  "grace_hopper"
make_username("Linus")              ->  "linus"
make_username("   ")                ->  ""
\`\`\``,
      files: {
        'main.py': py`def make_username(full_name):
    # TODO: lowercase, split into words, join with "_"
    return full_name


print(make_username("  Ada   LOVELACE "))
print(make_username("grace hopper"))
`,
      },
      hints: [
        'Break it into steps: lowercase, then split into words, then join them.',
        'split() with no argument splits on any run of whitespace and ignores spaces at the ends — so you don\'t even need strip().',
        'return "_".join(full_name.lower().split())',
      ],
      solution: {
        explanation: py`\`full_name.lower()\` returns a lowercase copy. \`.split()\` (no argument) splits on any run of whitespace and drops empty pieces, so leading, trailing and repeated spaces all disappear — and a string of only spaces becomes an empty list. \`"_".join(...)\` glues the words with underscores; joining an empty list gives \`""\`. Three methods, one line, and the original string is never modified.`,
        files: {
          'main.py': py`def make_username(full_name):
    words = full_name.lower().split()
    return "_".join(words)


print(make_username("  Ada   LOVELACE "))
print(make_username("grace hopper"))
`,
        },
      },
      tests: [
        { name: 'messy name becomes ada_lovelace', code: py`assert make_username("  Ada   LOVELACE ") == "ada_lovelace"` },
        { name: 'simple two-word name', code: py`assert make_username("grace hopper") == "grace_hopper"` },
        { name: 'single word', code: py`assert make_username("Linus") == "linus"` },
        { name: 'only spaces gives ""', code: py`assert make_username("   ") == ""` },
        { name: 'tabs count as whitespace too', code: py`assert make_username("Alan\tTuring") == "alan_turing"` },
      ],
    },
    {
      id: 'parse-setting',
      title: 'Parse a config line',
      difficulty: 'beginner',
      prompt: py`Settings files often contain lines like \`timeout = 30\`. Write \`parse_setting(line)\` that returns a pair \`(key, value)\`:

- surrounding spaces are removed from the line, the key and the value;
- the **key** is lowercase;
- only the **first** \`=\` separates key from value (the value may contain \`=\`);
- blank lines, lines starting with \`#\` (comments) and lines without \`=\` return \`None\`.

\`\`\`text
parse_setting("  Timeout = 30 ")           ->  ("timeout", "30")
parse_setting("greeting=Hello = World")    ->  ("greeting", "Hello = World")
parse_setting("# just a comment")          ->  None
parse_setting("no equals sign here")       ->  None
\`\`\`

The starter already contains the \`if\` structure (you'll meet \`if\` properly in [if statements](lesson:if-statements)); fill in the string methods.`,
      files: {
        'main.py': py`def parse_setting(line):
    line = line.strip()
    if line == "" or False:      # TODO: also return None for lines starting with "#"
        return None
    key, sep, value = "", "", ""  # TODO: split the line at the FIRST "="
    if sep == "":
        return None
    return key, value             # TODO: clean up key and value


print(parse_setting("  Timeout = 30 "))
print(parse_setting("# just a comment"))
`,
      },
      hints: [
        'startswith("#") tells you whether a line is a comment. Which method splits at the first separator and always gives you three parts?',
        'key, sep, value = line.partition("=") — sep is "" when there was no "=". Then strip both parts and lowercase the key.',
        'if line == "" or line.startswith("#"): return None … key, sep, value = line.partition("=") … return key.strip().lower(), value.strip()',
      ],
      solution: {
        explanation: py`\`strip()\` first, so a comment indented with spaces is still recognised by \`startswith("#")\`. \`partition("=")\` splits at the **first** \`=\` only, which keeps \`"Hello = World"\` intact, and it never raises: when there is no \`=\`, the middle part is \`""\`, which we use to return \`None\`. Finally the key is stripped and lowercased (keys are case-insensitive), while the value is only stripped — its case might matter.`,
        files: {
          'main.py': py`def parse_setting(line):
    line = line.strip()
    if line == "" or line.startswith("#"):
        return None
    key, sep, value = line.partition("=")
    if sep == "":
        return None
    return key.strip().lower(), value.strip()


print(parse_setting("  Timeout = 30 "))
print(parse_setting("# just a comment"))
`,
        },
      },
      tests: [
        { name: 'cleans key and value', code: py`assert parse_setting("  Timeout = 30 ") == ("timeout", "30")` },
        { name: 'splits only at the first "="', code: py`assert parse_setting("greeting=Hello = World") == ("greeting", "Hello = World")` },
        { name: 'comments return None', code: py`assert parse_setting("# just a comment") is None` },
        { name: 'indented comments return None', code: py`assert parse_setting("   # indented comment") is None` },
        { name: 'lines without "=" return None', code: py`assert parse_setting("no equals sign here") is None` },
        { name: 'blank lines return None', code: py`assert parse_setting("   ") is None` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'string-methods-rstrip-suffix',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A script renames files by removing the ".txt" extension with `name.rstrip(".txt")`. For "notes.txt" it works, but "report.txt" becomes "repor" and "test.txt" becomes "tes". Why, and what is the fix?',
      code: { lang: 'python', code: py`for name in ["notes.txt", "report.txt", "test.txt"]:
    print(name.rstrip(".txt"), name.removesuffix(".txt"))` },
      answer: 'rstrip treats its argument as a set of characters ({".", "t", "x"}) and keeps removing any of them from the right, so trailing t\'s of the name disappear too. Use name.removesuffix(".txt") (3.9+) or pathlib.Path(name).stem.',
      explanation: py`\`strip\`/\`lstrip\`/\`rstrip\` don't look for a word; they peel characters off the end while each one is in the given set. "notes.txt" survives only because \`s\` isn't in the set. \`removesuffix\` removes the exact suffix once, if present. For file names specifically, \`Path(name).stem\` and \`Path(name).with_suffix("")\` also handle names with directories.`,
      whyAsked: 'It is a real, frequently shipped bug, and it checks whether you read method semantics precisely instead of guessing from the name.',
      mistakes: ['Suggesting replace(".txt", "") — it also removes ".txt" from the middle of names like "a.txt.bak"', 'Not knowing removesuffix exists', 'Saying it is a Python bug'],
      followUps: ['How would you do this before Python 3.9?', 'How would pathlib handle "archive.tar.gz"?'],
      modelAnswer: 'rstrip does not remove a suffix — it removes characters. Its argument is treated as a set, here dot, t and x, and it keeps stripping from the right while the last character is in that set. That is why the t at the end of "report" and "test" disappears as well. The correct tool is removesuffix, added in Python 3.9, which removes the exact text once if it is present. For file names I would actually use pathlib, Path(name).stem, which understands extensions properly.',
    },
    {
      id: 'string-methods-find-index-in',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'Compare `sub in s`, `s.find(sub)` and `s.index(sub)`. When would you use each?',
      answer: 'in returns True/False; find returns the first index or -1; index returns the first index or raises ValueError. Use in for yes/no, find when absence is normal (and check for -1), index when absence is an error.',
      explanation: py`All three search left to right. The trap with \`find\` is that \`-1\` is a valid index in Python, so code like \`s[:s.find("@")]\` silently returns the wrong slice instead of failing. \`index\` fails loudly, which is better when missing text means bad data. \`partition\` is often the cleanest way to split around a separator without any of these pitfalls.`,
      whyAsked: 'Shows attention to error-handling semantics, not just "it finds things".',
      mistakes: ['Not mentioning that -1 is a valid index', 'Using find() and then using the result directly as an index'],
      followUps: ['What do rfind and rindex do?', 'How would you find all positions of a substring? (a loop with find(sub, start), or re.finditer)'],
      modelAnswer: 'in is a plain membership test that gives True or False, so I use it whenever I only need to know whether the text is there. find and index both return the position of the first match; the difference is what happens when there is none. find returns -1, which is dangerous because -1 is a valid index and slicing with it silently gives wrong results, so I only use find when absence is normal and I check for -1. index raises ValueError, which is what I want when a missing substring means the data is broken.',
    },
    {
      id: 'string-methods-isdigit-validation',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A form checks `if age_text.isdigit(): age = int(age_text)`. A user submits "²" and the server crashes. Explain what happened and how you would validate integer input properly.',
      code: { lang: 'python', code: py`for text in ["42", "²", "٣", "-5", " 7 "]:
    print(repr(text), text.isdigit(), text.isdecimal())` },
      answer: 'isdigit is Unicode-aware and returns True for characters like superscript two, which int() rejects with ValueError. It also rejects valid input like "-5" and " 7 ". Validate by trying int(text.strip()) inside try/except ValueError, then range-check the number.',
      explanation: py`\`str.isdigit()\` checks Unicode's "digit" property, which includes superscripts and other characters that aren't valid in \`int()\`. \`isdecimal()\` is stricter (exactly what \`int()\` accepts per character, including digits from other scripts such as Arabic-Indic \`٣\`, which \`int()\` does convert). The robust pattern is EAFP: attempt the conversion, catch \`ValueError\`, then validate the range (\`0 <= age <= 150\`). If you must restrict to ASCII digits, combine \`text.isascii() and text.isdecimal()\` or use a regex with \`re.ASCII\`/\`[0-9]\`.`,
      whyAsked: 'It checks Unicode awareness and whether you validate by attempting the real operation rather than approximating it.',
      mistakes: ['Assuming isdigit means "0–9 only"', 'Forgetting negative numbers and surrounding whitespace', 'Validating format but not range'],
      followUps: ['What is the difference between isdigit, isdecimal and isnumeric?', 'Does int() accept "٣"? (yes: it accepts Unicode decimal digits)', 'What is EAFP?'],
      modelAnswer: 'isdigit is Unicode-aware: it returns True for characters such as superscript two, which int() refuses, so the check passed and the conversion raised ValueError. It also rejects perfectly valid input like "-5" or " 7 ". So isdigit is the wrong validator. I would strip the input, try int() inside a try/except ValueError and treat failure as a validation error, then check the range, for example 0 to 150. If the business rule is ASCII digits only, I would say so explicitly with isascii plus isdecimal or a regex, rather than relying on isdigit.',
    },
    {
      id: 'string-methods-casefold',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you compare two strings case-insensitively in Python, and why isn\'t lower() always enough?',
      answer: 'Compare a.casefold() == b.casefold(). casefold applies Unicode case folding, which handles cases lower() does not, such as "ß" → "ss". For full robustness also normalise with unicodedata.normalize, because the same letter can be stored in different forms.',
      explanation: py`Case folding is defined by Unicode specifically for caseless matching. \`lower()\` maps to lowercase for display, which isn't the same thing in every language. Even with casefold, \`"é"\` can be one code point or \`e\` plus a combining accent; normalising both sides (NFC or NFKC) fixes that — see [Unicode & bytes](lesson:unicode-and-bytes). For locale-aware sorting, the standard library's \`locale\` module or third-party ICU bindings are needed.`,
      whyAsked: 'Distinguishes developers who have dealt with international text from those who have only tested with English.',
      mistakes: ['Answering only "use lower()"', 'Not mentioning Unicode normalisation for accented characters'],
      followUps: ['What does unicodedata.normalize("NFC", s) do?', 'Would you store the casefolded email or the original?'],
      modelAnswer: 'I casefold both sides and compare: a.casefold() == b.casefold(). casefold implements Unicode case folding, which exists precisely for caseless matching; lower() is meant for display and misses cases like the German sharp s, which casefold turns into "ss". For English text the two agree, but casefold is the correct tool. If the text can contain accents, I would also normalise both strings with unicodedata.normalize, because the same visible letter can be stored as one or two code points.',
    },
    {
      id: 'string-methods-join-on-separator',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is join a method of the separator string — `", ".join(items)` — rather than a list method like `items.join(", ")`?',
      answer: 'Because join works on any iterable of strings — lists, tuples, generators, dict keys, files — not just lists. Putting it on str means one implementation serves every iterable, and the separator, which is a string, owns the operation.',
      explanation: py`If \`join\` were a list method, every iterable type (tuple, set, generator, custom classes) would need its own copy. As a \`str\` method it accepts *any* iterable and only requires that the items are strings. It also keeps the result type obvious: the separator is a \`str\`, so the result is a \`str\` (and \`b", ".join(...)\` on bytes returns bytes).`,
      code: { lang: 'python', code: py`print("-".join(("2026", "04", "12")))       # a tuple
print("".join(c for c in "a1b2" if c.isalpha()))   # a generator
print(", ".join({"tea": 1, "milk": 2}))      # dict keys` },
      whyAsked: 'A design question that checks whether you understand iterables and why the API looks "backwards" at first.',
      mistakes: ['Saying it is just a historical accident', 'Not knowing join accepts generators'],
      followUps: ['What happens if an item is an int?', 'How do you join bytes?'],
      modelAnswer: 'join lives on the separator because it works with any iterable of strings — a list, a tuple, a generator expression, dictionary keys, even lines from a file. If it were a list method, every iterable type would need its own version. As a string method there is one implementation, it only requires that each item is a str, and the result type matches the separator, so bytes.join returns bytes. It looks backwards at first, but it is the more general design.',
    },
    {
      id: 'string-methods-valid-username',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `is_valid_username(name)` returning True only if the name is 3–16 characters long, uses only ASCII letters, digits and underscores, and starts with a letter. Use string methods, not regex.',
      answer: 'Check the length, then name.isascii(), then name[0].isalpha(), then name.replace("_", "").isalnum().',
      explanation: py`The order matters: checking the length first guarantees \`name[0]\` exists. \`isalnum()\` and \`isalpha()\` are Unicode-aware, so \`"café"\` would pass them — \`isascii()\` (3.7+) closes that gap. Removing underscores before \`isalnum()\` allows them without allowing anything else. A regex like \`[A-Za-z][A-Za-z0-9_]{2,15}\` with \`fullmatch\` is an equally good answer — see [regular expressions](lesson:regular-expressions).`,
      starter: { files: { 'main.py': py`def is_valid_username(name):
    # TODO: 3-16 chars, ASCII letters/digits/underscores, starts with a letter
    return True


print(is_valid_username("ada_99"))
print(is_valid_username("9lives"))
` } },
      tests: [
        { name: 'accepts a normal username', code: py`assert is_valid_username("ada_99") is True` },
        { name: 'rejects a leading digit', code: py`assert is_valid_username("9lives") is False` },
        { name: 'rejects too short and too long', code: py`assert is_valid_username("ab") is False and is_valid_username("a" * 17) is False` },
        { name: 'rejects spaces and dashes', code: py`assert is_valid_username("ada lovelace") is False and is_valid_username("ada-l") is False` },
        { name: 'rejects non-ASCII letters', code: py`assert is_valid_username("café_1") is False` },
        { name: 'rejects an empty string', code: py`assert is_valid_username("") is False` },
      ],
      solution: { files: { 'main.py': py`def is_valid_username(name):
    if not 3 <= len(name) <= 16:
        return False
    if not name.isascii():
        return False
    if not name[0].isalpha():
        return False
    return name.replace("_", "").isalnum()


print(is_valid_username("ada_99"))
print(is_valid_username("9lives"))
` } },
      hints: ['Check the length first so that name[0] is safe.', 'isalnum() accepts letters like "é" — which method tells you a string is pure ASCII?', 'Remove underscores with replace before calling isalnum().'],
      whyAsked: 'Input validation is everyday work; this checks method knowledge, ordering of checks and Unicode awareness.',
      mistakes: ['Indexing name[0] before checking the length', 'Forgetting that isalpha/isalnum accept non-ASCII letters', 'Returning truthy values instead of booleans'],
      followUps: ['How would you write it with re.fullmatch?', 'Should usernames be compared case-insensitively?'],
      modelAnswer: 'I check the cheap structural rules first. The length must be between 3 and 16, which also guarantees name[0] exists. Then isascii, because isalpha and isalnum are Unicode-aware and would happily accept letters like é. Then the first character must be a letter. Finally I remove underscores and check that what is left is alphanumeric. Each check returns False early, so the function reads like the specification. A regex with fullmatch is a good alternative when the rules get more complicated.',
    },
    {
      id: 'string-methods-cleaning-pipeline',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Users sign up with email addresses. You see duplicates like "Ada@Example.com", " ada@example.com" and "ada@example.com\\n". Describe how you would normalise emails, and what you would and would not change.',
      answer: 'Normalise at the boundary: strip whitespace, reject inner whitespace, split once at the last "@", lowercase/casefold the domain (domains are case-insensitive), and use a casefolded copy for uniqueness checks while storing the address as typed. Don\'t strip dots or "+tags" — that is provider-specific.',
      explanation: py`Trailing newlines and spaces come from copy-paste and file input, so \`strip()\` is always safe. Domains are case-insensitive by specification; the local part technically *may* be case-sensitive, but virtually all providers treat it case-insensitively, so many systems compare on a casefolded key while keeping the original for display and sending. Rules like "Gmail ignores dots" are provider-specific — applying them globally would merge distinct accounts. Enforce uniqueness in the database (a unique index on the normalised key), not just in Python, to avoid races.`,
      code: { lang: 'python', code: py`def email_key(raw):
    email = raw.strip()
    local, at, domain = email.rpartition("@")
    if not at or not local or " " in email:
        return None
    return local.casefold() + "@" + domain.casefold()

for raw in ["Ada@Example.com", " ada@example.com", "ada@example.com\n"]:
    print(email_key(raw))` },
      whyAsked: 'A practical design question about data quality, trust boundaries and not over-normalising.',
      mistakes: ['Lowercasing and stripping but storing only the transformed value with no thought about display', 'Applying Gmail-specific rules to every domain', 'Only de-duplicating in application code without a database constraint'],
      followUps: ['Would you validate emails with a regex?', 'How would internationalised domain names change this?', 'Where should this code live in the application?'],
      modelAnswer: 'I would normalise once, at the point where input enters the system. First strip surrounding whitespace, because newlines and spaces come from copy-paste, and reject anything with whitespace inside. Then split once at the last @ with rpartition. Domains are case-insensitive, and in practice providers treat the local part case-insensitively too, so I would compute a casefolded key for uniqueness checks while storing what the user typed for display. I would not apply provider-specific tricks like removing dots, because that can merge different people\'s accounts. And I would enforce uniqueness with a unique index on the normalised key in the database, since checks in Python alone can race.',
    },
  ],

  takeaways: [
    'String methods never modify the string — they return a new value, so always store the result (s = s.strip()).',
    'strip/lstrip/rstrip remove characters from the ends; removeprefix/removesuffix (3.9+) remove exact text.',
    'split() with no argument splits on runs of whitespace; split(sep) keeps empty fields. join is the opposite and is called on the separator.',
    'in for yes/no, find (-1 if missing) when absence is normal, index (ValueError) when absence is a bug; partition splits once safely.',
    'Compare case-insensitively with casefold(); the is…() tests are Unicode-aware, so validate numbers by trying int().',
    'Normalise whitespace with " ".join(s.split()) and chain methods left to right: raw.strip().lower().',
  ],
}
