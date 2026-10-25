// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LOG_ANALYZER = py`# Pull structured facts out of a server log with regular expressions
import re

LOG = """\
2026-04-12 09:15:02 INFO  user=ada action=login ip=10.0.0.7
2026-04-12 09:16:45 ERROR user=grace action=upload ip=10.0.0.9 size=2048KB
2026-04-12 09:17:03 WARN  user=ada action=upload ip=10.0.0.7 size=512KB
2026-04-12 09:20:11 ERROR user=linus action=login ip=192.168.1.20
"""

LINE = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) "
    r"(?P<level>[A-Z]+)\s+user=(?P<user>\w+) action=(?P<action>\w+)"
)

for match in LINE.finditer(LOG):
    if match["level"] == "ERROR":
        print(f"{match['time']}  {match['user']:<6} {match['action']} failed")

ips = re.findall(r"ip=(\d+\.\d+\.\d+\.\d+)", LOG)
print("IPs seen:", sorted(set(ips)))

sizes = re.findall(r"size=(\d+)KB", LOG)
print("Uploaded:", sum(int(kb) for kb in sizes), "KB")

masked = re.sub(r"ip=(\d+)\.\d+\.\d+\.\d+", r"ip=\1.x.x.x", LOG)
print(masked.splitlines()[-1])
`

const REDOS_LAB = py`# Catastrophic backtracking lab: measure, don't guess
import re
import time

nested = re.compile(r"(a+)+$")        # nested quantifiers: dangerous
flat = re.compile(r"a+$")             # same strings matched, no nesting
atomic = re.compile(r"(?>a+)+$")      # atomic group (Python 3.11+)

for n in range(12, 21, 2):
    text = "a" * n + "b"              # almost matches, then fails at the end
    for name, pattern in [("nested", nested), ("flat", flat), ("atomic", atomic)]:
        start = time.perf_counter()
        pattern.match(text)
        ms = (time.perf_counter() - start) * 1000
        print(f"n={n:<3} {name:<7} {ms:9.3f} ms")
    print()
`

export default {
  id: 'regular-expressions',
  title: 'Regular expressions with re',
  summary: 'A regular expression is a tiny pattern language for describing text; the re module searches, extracts, replaces and splits with patterns — powerful for structured text, and dangerous when overused or fed untrusted patterns.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['string-methods', 'strings-basics'],
  related: ['string-formatting', 'unicode-and-bytes', 'input-validation', 'injection-attacks', 'dates-and-times', 'project-log-analyzer', 'csv-data'],
  tags: ['regex', 'regular expressions', 're', 'pattern', 're.search', 're.match', 're.fullmatch', 're.findall', 're.finditer', 're.sub', 're.split', 're.compile', 'groups', 'named groups', 'flags', 'IGNORECASE', 'VERBOSE', 'greedy', 'lazy', 'backtracking', 'ReDoS', 'raw strings'],
  apis: [
    { name: 're.search(pattern, string, flags=0)', summary: 'First match anywhere in the string, as a Match object, or None.' },
    { name: 're.match(pattern, string)', summary: 'Match only at the start of the string, or None.' },
    { name: 're.fullmatch(pattern, string)', summary: 'Match only if the pattern covers the whole string, or None.' },
    { name: 're.findall(pattern, string)', summary: 'List of all matches: strings, or tuples of groups if the pattern has groups.' },
    { name: 're.finditer(pattern, string)', summary: 'Iterator of Match objects for every match.' },
    { name: 're.sub(pattern, repl, string, count=0)', summary: 'Replace matches with a string (\\1, \\g<name> backreferences) or the result of a function.' },
    { name: 're.split(pattern, string, maxsplit=0)', summary: 'Split at every match; captured groups are kept in the result.' },
    { name: 're.compile(pattern, flags=0)', summary: 'Compile a pattern into a reusable Pattern object.' },
    { name: 'Match.group() / groups() / groupdict()', summary: 'The matched text, all groups as a tuple, named groups as a dict.' },
    { name: 'Match.start() / end() / span()', summary: 'Positions of the match in the string.' },
    { name: 're.IGNORECASE, re.MULTILINE, re.DOTALL, re.VERBOSE, re.ASCII', summary: 'Flags that change how a pattern matches.' },
    { name: 're.escape(text)', summary: 'Escape every special character so text is matched literally.' },
  ],
  docs: [
    { label: 'Regular expression HOWTO', url: 'https://docs.python.org/3/howto/regex.html' },
    { label: 'Library reference — re', url: 'https://docs.python.org/3/library/re.html' },
    { label: 're — regular expression syntax', url: 'https://docs.python.org/3/library/re.html#regular-expression-syntax' },
    { label: 'OWASP — Regular expression Denial of Service (ReDoS)', url: 'https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **regular expression** (regex) is a pattern that describes a *shape* of text rather than exact text. \`\d{4}-\d{2}-\d{2}\` means "four digits, a dash, two digits, a dash, two digits" — it matches \`2026-04-12\` and every other date in that format. Python's built-in \`re\` module lets you **search** for such patterns, **extract** pieces of them, **replace** them and **split** on them.`,
    { code: py`import re

text = "Invoice 2026-04-12: 3 items, due 2026-05-12"
print(re.findall(r"\d{4}-\d{2}-\d{2}", text))   # ['2026-04-12', '2026-05-12']`, lang: 'python', title: 'a first taste' },
    py`[String methods](lesson:string-methods) answer questions like "does this contain \`@\`?" or "split at commas". Regex answers "find every thing *shaped like* a phone number", "is this *entire* string a valid product code?", "swap day and month in every date". It's a small language of its own, so this lesson builds it up piece by piece — and also tells you when *not* to use it.`,
  ],
  why: [
    py`Real data is full of patterns that fixed strings can't capture: log lines, IDs like \`INV-000123\`, version numbers, hashtags, times. Without regex you'd write long loops checking characters one by one. With regex, one well-named pattern says it all, and the \`re\` module's matching engine (written in C in CPython) does the scanning.`,
    py`Regex also appears everywhere outside Python: editors' find-and-replace, \`grep\`, databases, web frameworks' URL routing, form validation. Learning it once pays off in every tool you use.`,
  ],
  eli15: [
    py`Imagine playing "spot the pattern" with a magnifying glass on a long page of text. Instead of looking for the exact word "cat", you describe what you want: "a capital letter, then some lowercase letters, then a full stop". A regex is that description written in a compact code.`,
    py`Some symbols in the code are wildcards: \`\d\` means "any digit", \`\w\` means "any letter, digit or underscore", \`.\` means "any character". Others say how many: \`+\` means "one or more", \`{4}\` means "exactly four". So \`\d{4}\` is "four digits in a row" — a year.`,
    py`Python's \`re\` module slides your description along the text, and every place it fits is a **match**. You can then grab the matched text, or just the parts you put in brackets (\`groups\`), or replace them.`,
  ],
  analogy: {
    title: 'A wanted poster for text',
    body: [
      py`A wanted poster doesn't say "find John Smith at 14 Elm Street". It describes features: "tall, red hat, carries a blue umbrella". Anyone matching the description gets stopped. A regex is a wanted poster for text: it describes features (digits here, a dash there, letters after that), and every stretch of text fitting the description is a match.`,
      py`**Groups** are like the poster saying "and write down the hat colour". **Greedy** matching is an over-eager detective who first grabs as much as possible and then gives back; **lazy** matching grabs as little as possible.`,
    ],
    mapping: [
      ['the wanted poster', 'the pattern: r"\\d{4}-\\d{2}"'],
      ['the crowd being searched', 'the string'],
      ['someone who fits the description', 'a match (a Match object)'],
      ['"write down the hat colour"', 'a capturing group: (\\d{4})'],
      ['stop the first person who fits', 're.search'],
      ['stop everyone who fits', 're.findall / re.finditer'],
      ['the description must fit head to toe', 're.fullmatch'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Greedy vs lazy: how the engine backtracks',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'text', label: '<b>bold</b>', note: 'the string', x: 380, y: 50, tone: 'paper' },
        { id: 'greedy', label: '<.+>', note: 'greedy', x: 170, y: 140, tone: 'yellow' },
        { id: 'grab', label: 'b>bold</b>', note: '.+ takes everything', x: 170, y: 220, tone: 'red' },
        { id: 'back', label: '<b>bold</b>', note: 'gives back 1 char, > matches', x: 170, y: 295, tone: 'blue' },
        { id: 'lazy', label: '<.+?>', note: 'lazy', x: 590, y: 140, tone: 'yellow' },
        { id: 'small', label: 'b', note: '.+? takes 1 char, > matches', x: 590, y: 220, tone: 'blue' },
        { id: 'two', label: '<b>  </b>', note: 'two matches', x: 590, y: 295, tone: 'kraft' },
      ],
      edges: [
        { from: 'text', to: 'greedy' },
        { from: 'greedy', to: 'grab', label: 'expand' },
        { from: 'grab', to: 'back', label: 'backtrack' },
        { from: 'text', to: 'lazy' },
        { from: 'lazy', to: 'small', label: 'expand minimally' },
        { from: 'small', to: 'two', label: 'next match' },
      ],
      steps: [
        { focus: ['text'], text: py`The string \`<b>bold</b>\`. We want the tags. Both patterns start by matching a literal \`<\` at position 0.` },
        { focus: ['greedy', 'grab'], edges: ['text->greedy', 'greedy->grab'], text: py`**Greedy** \`.+\` means "one or more of any character — as many as possible". It swallows the whole rest of the string: \`b>bold</b>\`. Now the pattern still needs a \`>\`, but there's nothing left.` },
        { focus: ['back'], edges: ['grab->back'], text: py`So the engine **backtracks**: \`.+\` gives back one character at a time until the next part of the pattern can match. Giving back the final \`>\` is enough. Result: one match covering everything, \`<b>bold</b>\` — probably not what you wanted.` },
        { focus: ['lazy', 'small'], edges: ['text->lazy', 'lazy->small'], text: py`**Lazy** \`.+?\` means "as *few* as possible". It takes one character (\`b\`), then checks whether \`>\` matches next. It does, so the match is just \`<b>\`.` },
        { focus: ['two'], edges: ['small->two'], text: py`\`findall\` keeps going from where the last match ended and finds \`</b>\` the same way: \`['<b>', '</b>']\`. Even better is to say exactly what's allowed: \`<[^>]+>\` ("one or more characters that are not \`>\`") needs no backtracking at all.` },
      ],
    },
    alt: 'Diagram comparing two patterns on the string <b>bold</b>. The greedy pattern <.+> first lets .+ consume everything to the end, then backtracks one character so > can match, producing a single match of the whole string. The lazy pattern <.+?> takes one character at a time, matches <b> and then </b> as two separate matches.',
  },
  syntax: [
    py`#### Always write patterns as raw strings`,
    py`Regex uses backslashes heavily, and so do Python string literals. In \`"\bcat\b"\`, Python turns \`\b\` into a *backspace character* before \`re\` ever sees it. Prefix patterns with \`r\` so backslashes reach the regex engine untouched: \`r"\bcat\b"\`. See [raw strings](lesson:strings-basics).`,
    py`#### The building blocks`,
    py`| pattern | matches | example |
|---|---|---|
| \`abc\` | the literal text \`abc\` | \`cat\` in \`concat\` |
| \`.\` | any character except newline | \`c.t\` → \`cat\`, \`c9t\` |
| \`\d\` / \`\D\` | a digit / a non-digit | \`\d\d\` → \`42\` |
| \`\w\` / \`\W\` | a word character (letter, digit, \`_\`) / anything else | \`\w+\` → \`user_1\` |
| \`\s\` / \`\S\` | whitespace / non-whitespace | \`\s+\` → spaces, tabs, newlines |
| \`[aeiou]\` | one of these characters | \`gr[ae]y\` → \`grey\`, \`gray\` |
| \`[^0-9]\` | one character *not* in the set | \`[^,]+\` → a CSV-ish field |
| \`[A-Za-z]\` | a range | one ASCII letter |
| \`^\` / \`$\` | start / end of the string (of each line with \`re.MULTILINE\`) | \`^ERROR\` |
| \`\b\` | a word boundary | \`\bcat\b\` doesn't match inside \`concat\` |
| \`a|b\` | either side | \`jpe?g|png\` |
| \`\.\` \`\+\` \`\(\` | a literal special character | \`\d+\.\d+\` → \`3.14\` |`,
    py`#### Quantifiers: how many?`,
    py`| quantifier | means | example |
|---|---|---|
| \`*\` | 0 or more | \`ab*\` → \`a\`, \`ab\`, \`abbb\` |
| \`+\` | 1 or more | \`\d+\` → \`7\`, \`2026\` |
| \`?\` | 0 or 1 (optional) | \`colou?r\` → \`color\`, \`colour\` |
| \`{n}\` | exactly n | \`\d{4}\` |
| \`{m,n}\` | between m and n | \`\w{3,16}\` |
| \`*?\` \`+?\` \`??\` | lazy versions: as few as possible | \`<.+?>\` |`,
    py`#### Searching: search, match, fullmatch`,
    { code: py`import re

text = "Order 66 shipped"
print(re.search(r"\d+", text))      # <re.Match object; span=(6, 8), match='66'>
print(re.match(r"\d+", text))       # None — match only tries at position 0
print(re.fullmatch(r"\d+", "66"))   # matches: the WHOLE string is digits
print(re.fullmatch(r"\d+", "66a"))  # None

found = re.search(r"\d+", text)
if found:                           # always check for None!
    print(found.group(), found.start(), found.end())   # 66 6 8`, lang: 'python', title: 'three ways to look' },
    py`All three return a **Match object** or \`None\`. Use \`search\` to find a pattern anywhere, \`fullmatch\` to **validate** that an entire string has a shape (product codes, postcodes), and \`match\` rarely — it only anchors at the start, which surprises people.`,
    py`#### Groups: extracting parts`,
    { code: py`import re

m = re.search(r"(\d{4})-(\d{2})-(\d{2})", "Due: 2026-04-12!")
print(m.group())     # 2026-04-12   the whole match (same as group(0))
print(m.group(1))    # 2026         first group
print(m.groups())    # ('2026', '04', '12')

# Named groups: (?P<name>...) — self-documenting
m = re.search(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})", "Due: 2026-04-12!")
print(m["month"])        # 04  (same as m.group("month"))
print(m.groupdict())     # {'year': '2026', 'month': '04', 'day': '12'}

# (?:...) groups without capturing — for alternation or repetition only
print(re.findall(r"(?:jpe?g|png)\b", "cat.jpeg dog.png"))   # ['jpeg', 'png']`, lang: 'python', title: 'groups, named groups and non-capturing groups' },
    py`#### Finding all matches: findall and finditer`,
    { code: py`import re

text = "Ada: ada@site.com, Bob: bob@mail.org"
print(re.findall(r"\w+@\w+\.\w+", text))      # ['ada@site.com', 'bob@mail.org']
print(re.findall(r"(\w+)@(\w+)\.\w+", text))   # [('ada', 'site'), ('bob', 'mail')]

for m in re.finditer(r"(\w+)@\w+\.\w+", text):
    print(m.group(1), "at position", m.start())`, lang: 'python', title: 'findall changes shape when you add groups' },
    py`\`findall\` returns **strings** when the pattern has no groups, the **group's text** with one group, and **tuples** with several. That shape-shifting is a common surprise. \`finditer\` always gives full Match objects, which is clearer for anything non-trivial.`,
    py`#### Replacing and splitting: sub and split`,
    { code: py`import re

print(re.sub(r"\s+", " ", "too   many \t spaces"))                  # too many spaces
print(re.sub(r"(\d{4})-(\d{2})-(\d{2})", r"\3/\2/\1", "2026-04-12"))  # 12/04/2026
print(re.sub(r"(?P<y>\d{4})-(?P<m>\d{2})", r"\g<m>/\g<y>", "2026-04"))  # 04/2026

def double(m):                       # the replacement can be a function
    return str(int(m.group()) * 2)
print(re.sub(r"\d+", double, "3 apples and 12 pears"))   # 6 apples and 24 pears

print(re.split(r"[,;]\s*", "a, b;c,d"))      # ['a', 'b', 'c', 'd']
print(re.split(r"([,;])", "a,b;c"))          # ['a', ',', 'b', ';', 'c'] — groups are kept`, lang: 'python', title: 'sub with backreferences and functions; split on a pattern' },
    py`#### Flags`,
    { code: py`import re

print(re.findall(r"error", "Error ERROR error", re.IGNORECASE))     # all three
print(re.findall(r"^\w+", "one two\nthree four", re.MULTILINE))    # ['one', 'three']
print(re.findall(r"a.c", "a\nc", re.DOTALL))                       # ['a\nc']
print(re.findall(r"\d+", "٣ and 3", re.ASCII))                     # ['3'] — ASCII digits only

PHONE = re.compile(r"""
    \(?(\d{3})\)?   # area code, optional brackets
    [\s.-]?         # optional separator
    (\d{3})         # exchange
    [\s.-]?
    (\d{4})         # line number
""", re.VERBOSE)
print(PHONE.search("call (555) 867-5309 today").groups())   # ('555', '867', '5309')`, lang: 'python', title: 'IGNORECASE, MULTILINE, DOTALL, ASCII, VERBOSE' },
    py`Combine flags with \`|\`: \`re.IGNORECASE | re.MULTILINE\`. \`re.VERBOSE\` ignores whitespace and allows \`#\` comments inside the pattern — use it for anything longer than one line. Flags can also be written inline at the start: \`(?i)error\`.`,
    py`#### Compiling patterns`,
    { code: py`import re

DATE = re.compile(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})")
for line in ["paid 2026-04-12", "no date", "due 2026-05-01"]:
    m = DATE.search(line)
    print(m["year"] if m else "-")`, lang: 'python', title: 're.compile gives a reusable, nameable pattern' },
    py`A compiled \`Pattern\` has the same methods (\`search\`, \`findall\`, \`sub\`…). Compile patterns you reuse — mainly for **readability** (a named constant) and to set flags once. The \`re\` module also caches recently used patterns, so compiling isn't a big speed win for a handful of patterns.`,
  ],
  walkthrough: {
    title: 'Reading the log analyser line by line',
    lang: 'python',
    code: LOG_ANALYZER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 9], text: py`A small log as one multi-line string. The \`\` \ \`\` right after the opening quotes stops the string from starting with a newline.` },
      { lines: [11, 14], text: py`One compiled pattern with **named groups**. Two adjacent raw strings are joined into one pattern (implicit concatenation), which keeps lines short. \`\s+\` absorbs the variable spaces after the level (\`INFO  \` has two).` },
      { lines: [16, 18], text: py`\`finditer\` yields one Match per log line. \`match["level"]\` reads a named group. Only ERROR lines are printed, aligned with an f-string.` },
      { lines: [20, 21], text: py`\`findall\` with **one** group returns just the group's text — the IP addresses without the \`ip=\` prefix. Dots are escaped (\`\.\`) because a bare \`.\` means "any character".` },
      { lines: [23, 24], text: py`Another one-group \`findall\`, then a generator expression converts each captured string to \`int\` and sums them.` },
      { lines: [26, 27], text: py`\`sub\` with a **backreference**: \`\1\` in the replacement is whatever group 1 captured (the first number of the IP), so addresses are masked but their first block is kept.` },
    ],
  },
  playground: {
    title: 'Log analyser',
    objective: 'Run it, then extend the patterns: report more levels, count, anonymise and turn key=value pairs into a dict.',
    files: { 'main.py': LOG_ANALYZER },
    expected: py`\`\`\`text
09:16:45  grace  upload failed
09:20:11  linus  login failed
IPs seen: ['10.0.0.7', '10.0.0.9', '192.168.1.20']
Uploaded: 2560 KB
2026-04-12 09:20:11 ERROR user=linus action=login ip=192.x.x.x
\`\`\`

Switch to the **Catastrophic backtracking** variant to measure ReDoS live.`,
    experiments: [
      {
        id: 'warnings-too',
        task: py`Make the loop report **WARN** lines as well as ERROR lines.`,
        hint: py`Change the condition: \`if match["level"] in ("ERROR", "WARN"):\` — or put the choice into the pattern with \`(?P<level>ERROR|WARN)\`.`,
        tests: [
          { name: 'the 09:17:03 warning is reported', code: py`assert "09:17:03" in output, 'WARN lines should be printed too'` },
          { name: 'INFO lines are still skipped', code: py`assert "09:15:02" not in output` },
        ],
        explain: py`Either approach works. Filtering in Python keeps the pattern general; putting \`ERROR|WARN\` in the pattern makes \`finditer\` skip other lines entirely. Note the alternation needs a group (here the named one) so \`|\` doesn't split the whole pattern in two.`,
      },
      {
        id: 'error-count',
        task: py`Create \`error_count\`: the number of ERROR lines, using \`re.findall\` with a word-boundary pattern.`,
        hint: py`\`len(re.findall(r"\bERROR\b", LOG))\``,
        tests: [
          { name: 'error_count is 2', code: py`assert ns.get('error_count') == 2` },
        ],
        explain: py`\`\b\` (word boundary) makes sure you count the word ERROR, not \`ERRORS\` or \`TERROR\`. And the \`r\` prefix matters: without it, \`"\b"\` is a backspace character and the count is 0.`,
      },
      {
        id: 'anonymise',
        task: py`Create \`anonymised\`: a copy of \`LOG\` in which every user name is replaced by \`***\` (so \`user=ada\` becomes \`user=***\`). Print it.`,
        hint: py`\`re.sub(r"user=\w+", "user=***", LOG)\``,
        tests: [
          { name: 'user names are hidden', code: py`text = ns.get('anonymised', '')
assert "user=***" in text and "grace" not in text and "linus" not in text` },
          { name: 'everything else is kept', code: py`assert anonymised.count("\n") == LOG.count("\n") and "action=upload" in anonymised` },
        ],
        explain: py`\`sub\` replaces every match. Because \`\w+\` stops at the space, the rest of each line is untouched. For partial masking you'd keep part of the match with a group and \`\1\`, as the IP line does.`,
      },
      {
        id: 'pairs',
        task: py`Turn the **first** log line's \`key=value\` pairs into a dict called \`pairs\`: \`{'user': 'ada', 'action': 'login', 'ip': '10.0.0.7'}\`.`,
        hint: py`With two groups, \`findall\` returns a list of \`(key, value)\` tuples — exactly what \`dict()\` accepts. \`\S+\` means "non-whitespace characters".`,
        tests: [
          { name: 'pairs has the three fields', code: py`assert ns.get('pairs') == {'user': 'ada', 'action': 'login', 'ip': '10.0.0.7'}` },
        ],
        explain: py`\`dict(re.findall(r"(\w+)=(\S+)", LOG.splitlines()[0]))\` — the tuple shape of a two-group \`findall\` plugs straight into \`dict\`. This is a common idiom for parsing \`key=value\` logs.`,
      },
    ],
    variants: [
      { id: 'redos', label: 'Catastrophic backtracking (ReDoS) lab', files: { 'main.py': REDOS_LAB } },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'search, match, findall and fullmatch side by side',
    props: {
      code: py`import re
text = "Order 66 shipped to Bay 12"
first = re.search(r"\d+", text)
print(first.group(), first.span())
at_start = re.match(r"\d+", text)
print(at_start)
every = re.findall(r"\d+", text)
print(every)
bay = re.fullmatch(r"Bay \d+", "Bay 12")
print(bay.group())
`,
      notes: {
        3: '`search` scans from left to right and stops at the **first** place the pattern fits: `66` at positions 6–8.',
        5: '`match` only tries position 0. The text starts with `O`, not a digit, so the result is `None`.',
        7: '`findall` keeps scanning after each match and returns a list of every matched string.',
        9: '`fullmatch` succeeds only if the pattern covers the **entire** string — ideal for validation.',
      },
    },
    alt: 'A step-by-step trace. re.search finds 66 at span (6, 8); re.match returns None because the string does not start with a digit; re.findall returns the list [\'66\', \'12\']; re.fullmatch on "Bay 12" returns a match whose group is Bay 12.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`The regex engine works like a patient reader. It tries to match the pattern starting at position 0. If that fails, it tries position 1, then 2, and so on. The **first** position where the whole pattern fits wins — that's why \`search\` returns the leftmost match.`,
      py`At each position it walks through the pattern piece by piece. Quantifiers like \`+\` and \`*\` are **greedy**: they take as much as they can, and if the rest of the pattern then fails, the engine **backtracks** — gives characters back one at a time and tries again. Lazy quantifiers (\`+?\`) do the opposite: take as little as possible, then take more only if needed.`,
      py`Most patterns are fast. Trouble starts when a pattern gives the engine *many different ways* to split the same text — see the production notes on ReDoS.`,
    ],
    technical: [
      py`**Compilation.** \`re.compile\` parses the pattern and translates it into an internal program for the matching engine. The module-level functions (\`re.search(pattern, ...)\`) compile too, and the \`re\` module keeps a cache of recently compiled patterns (documented behaviour), so a program using a few patterns doesn't recompile them every call.`,
      py`**A backtracking engine.** Python's \`re\` is a backtracking engine, like those in Perl, Java and JavaScript. That's what makes features like backreferences (\`(\w+) \1\` finds repeated words) and lookarounds possible — and also what makes some patterns exponentially slow on inputs that *almost* match.`,
      { code: py`import re

print(re.findall(r"\b(\w+) \1\b", "this is is a test test"))   # ['is', 'test'] — backreference
print(re.findall(r"\w+(?=ing\b)", "singing and dancing"))      # ['sing', 'danc'] — lookahead
print(re.sub(r"(?<=\d)(?=(\d{3})+\b)", ",", "1234567"))         # 1,234,567 — lookbehind + lookahead`, lang: 'python', title: 'features only a backtracking engine offers' },
      py`**Unicode by default.** For \`str\` patterns, \`\d\`, \`\w\` and \`\s\` are Unicode-aware: \`\d\` matches Arabic-Indic \`٣\`, \`\w\` matches \`é\` and \`日\`. Use \`re.ASCII\` or explicit classes like \`[0-9]\` when only ASCII is acceptable (IDs, protocol fields). \`bytes\` patterns work on \`bytes\` and are ASCII-only.`,
      { callout: 'version', title: 'Python 3.11+: atomic groups and possessive quantifiers', text: py`Python 3.11 added atomic groups \`(?>...)\` and possessive quantifiers \`*+\`, \`++\`, \`?+\`, \`{m,n}+\`. Once they have matched, they never give characters back, which removes the backtracking that causes catastrophic slowdowns. \`(?>a+)+$\` and \`(a++)+$\` fail instantly where \`(a+)+$\` explodes.` },
      { callout: 'note', title: 'CPython detail', text: py`CPython's regex engine (the \`_sre\` C extension) runs a compiled pattern program over the string, and the parser and compiler live in the private modules \`re._parser\` and \`re._compiler\` (3.11+). Other implementations may use different engines, and the size of the pattern cache is an implementation detail.` },
    ],
    production: [
      py`**ReDoS (Regular expression Denial of Service).** Patterns with *nested* or *overlapping* quantifiers — \`(a+)+\`, \`(\w+\s?)*$\`, \`(.*,)*\` — can take time that grows exponentially with the input length when the input almost matches. An attacker who controls the input (a form field, a header, a log line) can make one request pin a CPU core for seconds or much longer. Measure it yourself in the playground's *Catastrophic backtracking* variant.`,
      py`Defences, in order of preference:`,
      py`1. **Write unambiguous patterns**: exactly one way to match. Prefer \`[^,]*\` ("anything but a comma") over \`.*\` followed by \`,\`; never nest quantifiers over the same characters.
2. **Limit input length** before matching (\`if len(value) > 254: reject\`).
3. Use **atomic groups / possessive quantifiers** (3.11+) where backtracking isn't needed.
4. **Never run user-supplied patterns** on your server unless you sandbox them (separate process with a timeout) or use a linear-time engine such as the third-party \`google-re2\` binding.
5. Test patterns against adversarial inputs, not just the happy path.`,
      py`**Maintainability.** Give patterns names (\`ISO_DATE = re.compile(...)\`), use \`re.VERBOSE\` with comments for anything non-trivial, and unit-test them with both matching and non-matching examples. A regex nobody can read is a bug waiting to happen.`,
      py`**Know when to stop.** Don't parse HTML, XML, JSON or CSV with regex — use \`html.parser\`/a real HTML parser, \`xml.etree\`, [\`json\`](lesson:json-data) and [\`csv\`](lesson:csv-data). Don't validate email addresses with a monster regex — check for one \`@\` and a dot in the domain, then send a confirmation email. Don't parse dates with regex when [\`datetime.strptime\`](lesson:dates-and-times) / \`fromisoformat\` exist.`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting the r prefix',
      wrong: { code: py`import re
print(re.findall("\bcat\b", "cat concat"))    # [] — "\b" became a backspace character`, lang: 'python' },
      right: { code: py`import re
print(re.findall(r"\bcat\b", "cat concat"))   # ['cat']`, lang: 'python' },
      explanation: py`Some escapes (\`\b\`, \`\n\`, \`\t\`) mean something to Python *and* to regex. Without \`r\`, Python converts them first. Other escapes like \`\d\` happen to survive but trigger \`SyntaxWarning: invalid escape sequence\` (3.12+). Always use raw strings for patterns.`,
    },
    {
      title: 'Using match() when you meant search()',
      wrong: { code: py`import re
line = "WARN disk 91% full"
if re.match(r"\d+%", line):
    print("found a percentage")    # never printed`, lang: 'python' },
      right: { code: py`import re
line = "WARN disk 91% full"
if re.search(r"\d+%", line):
    print("found a percentage")`, lang: 'python' },
      explanation: py`\`re.match\` only tries at the very start of the string. Use \`search\` to look anywhere, and \`fullmatch\` to require the whole string to match.`,
    },
    {
      title: 'Calling .group() on None',
      wrong: { code: py`import re
m = re.search(r"\d+", "no numbers here")
print(m.group())     # AttributeError: 'NoneType' object has no attribute 'group'`, lang: 'python', static: true },
      right: { code: py`import re
m = re.search(r"\d+", "no numbers here")
if m:
    print(m.group())
else:
    print("no number found")`, lang: 'python' },
      explanation: py`Every search can fail. Check the Match object before using it — or, inside an \`if\`, use the walrus operator: \`if (m := re.search(...)):\`.`,
    },
    {
      title: 'Greedy .* swallowing too much',
      wrong: { code: py`import re
html = '<a href="/home">Home</a> <a href="/shop">Shop</a>'
print(re.findall(r'href="(.*)"', html))   # one huge match`, lang: 'python' },
      right: { code: py`import re
html = '<a href="/home">Home</a> <a href="/shop">Shop</a>'
print(re.findall(r'href="([^"]*)"', html))   # ['/home', '/shop']`, lang: 'python' },
      explanation: py`\`.*\` runs to the end of the string and backtracks to the *last* quote. A negated class \`[^"]*\` ("anything except a quote") says exactly what you mean and is faster. (\`.*?\` also works.) For real HTML, use a parser.`,
    },
    {
      title: 'Validating without anchoring',
      wrong: { code: py`import re
code = "AB-1234; DROP TABLE"
print(bool(re.search(r"[A-Z]{2}-\d{4}", code)))   # True — the junk is ignored`, lang: 'python' },
      right: { code: py`import re
code = "AB-1234; DROP TABLE"
print(bool(re.fullmatch(r"[A-Z]{2}-\d{4}", code)))   # False`, lang: 'python' },
      explanation: py`\`search\` succeeds if the pattern appears *anywhere*. For validation, the whole value must match: use \`fullmatch\` (or anchor with \`\A...\Z\`). Note that \`$\` also matches just before a trailing newline, so \`^...$\` lets \`"AB-1234\n"\` through.`,
    },
    {
      title: 'Unescaped special characters',
      wrong: { code: py`import re
print(re.findall(r"3.14", "3.14 and 3514"))          # ['3.14', '3514'] — . matched '5'
price = "$5.00 (approx)"
print(re.search(price, "Total: $5.00 (approx)"))      # None — $ ( ) are special`, lang: 'python' },
      right: { code: py`import re
print(re.findall(r"3\.14", "3.14 and 3514"))         # ['3.14']
price = "$5.00 (approx)"
print(re.search(re.escape(price), "Total: $5.00 (approx)"))   # matches`, lang: 'python' },
      explanation: py`\`. ^ $ * + ? { } [ ] \ | ( )\` all have meanings. Escape them with a backslash, or pass user-provided text through \`re.escape()\` before putting it in a pattern — otherwise the user can inject pattern syntax.`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute 'group'`,
      cause: py`\`search\`/\`match\`/\`fullmatch\` returned \`None\` (no match) and the code used the result anyway.`,
      fix: py`Check \`if m:\` before calling \`.group()\`; print \`repr(text)\` to see what you are really matching against (hidden whitespace, different case).`,
    },
    {
      symptom: py`re.error: missing ), unterminated subpattern at position 0`,
      cause: py`An unbalanced bracket in the pattern — often an unescaped \`(\` meant literally.`,
      fix: py`Escape literal brackets (\`\(\`) or use \`re.escape()\` for literal text. The position tells you where the parser gave up.`,
    },
    {
      symptom: py`SyntaxWarning: "\d" is an invalid escape sequence`,
      cause: py`A pattern written without the \`r\` prefix (3.12+ warns about it).`,
      fix: py`Make every pattern a raw string: \`r"\d+"\`.`,
    },
    {
      symptom: py`findall returns tuples (or only part of each match) instead of the full matches`,
      cause: py`The pattern contains capturing groups, so \`findall\` returns the groups' text.`,
      fix: py`Use non-capturing groups \`(?:...)\` for grouping you don't want to extract, or use \`finditer\` and \`m.group()\`.`,
    },
    {
      symptom: py`A request hangs and one CPU core sits at 100% inside re`,
      cause: py`Catastrophic backtracking: a pattern with nested or overlapping quantifiers meeting an input that almost matches.`,
      fix: py`Rewrite the pattern so there is only one way to match, use atomic groups/possessive quantifiers (3.11+), cap the input length, and never run untrusted patterns.`,
    },
  ],
  bestPractices: [
    'Write every pattern as a raw string: r"...".',
    'Use fullmatch for validation, search for finding, and check for None before using a match.',
    'Prefer named groups (?P<name>...) and re.VERBOSE with comments for anything non-trivial.',
    'Compile reused patterns into well-named module-level constants.',
    'Say exactly what is allowed (`[^"]*`, `[0-9]{4}`) instead of reaching for `.*` and lazy fixes.',
    'Pass user-provided text through re.escape() before embedding it in a pattern.',
    'Avoid nested quantifiers, cap input length, and never run untrusted patterns (ReDoS).',
    'Use string methods for simple jobs and real parsers for HTML, JSON, CSV and dates.',
  ],
  useCases: [
    'Extracting fields from log lines and semi-structured text.',
    'Validating the shape of IDs, postcodes, version strings and product codes with fullmatch.',
    'Search-and-replace with structure: reformatting dates, masking numbers, normalising whitespace.',
    'Tokenising simple languages: splitting on several separators, finding #hashtags and @mentions.',
    'URL routing and filtering in web frameworks.',
  ],
  whenToUse: {
    use: [
      'The text has a recognisable shape but variable content (dates, IDs, log formats).',
      'You need several separators or optional parts at once.',
      'You want to validate a whole string against a precise format.',
    ],
    avoid: [
      'A fixed substring, prefix or separator is enough — use in, startswith, split, partition.',
      'The format is nested or has its own grammar (HTML, XML, JSON, CSV) — use a parser.',
      'You need dates or numbers — use datetime.strptime/fromisoformat and int()/float().',
      'Email addresses and URLs — use a simple sanity check plus urllib.parse or a confirmation step.',
      'The pattern comes from untrusted users — sandbox it or use a linear-time engine.',
    ],
  },
  comparison: {
    title: 'Which re function?',
    headers: ['function', 'looks for', 'returns', 'typical use'],
    rows: [
      ['re.search', 'first match anywhere', 'Match or None', 'does the text contain this shape?'],
      ['re.match', 'a match at position 0 only', 'Match or None', 'rarely — prefer search or fullmatch'],
      ['re.fullmatch', 'the whole string', 'Match or None', 'validation'],
      ['re.findall', 'every match', 'list of str (or of tuples with groups)', 'quick extraction'],
      ['re.finditer', 'every match', 'iterator of Match', 'extraction needing positions or several groups'],
      ['re.sub', 'every match', 'new str', 'search-and-replace'],
      ['re.split', 'every match', 'list of str', 'splitting on several separators'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'regular-expressions-q1',
      type: 'mcq',
      prompt: py`What does \`re.match(r"\d+", "Order 66")\` return?`,
      options: [
        { text: "A match for '66'", why: 're.match only tries at the start of the string. That is what re.search would return.' },
        'None',
        { text: "['66']", why: 'A list of matches is what findall returns; match returns a Match object or None.' },
        { text: 'It raises ValueError', why: 'A failed match is not an error; it returns None.' },
      ],
      answer: 1,
      explanation: py`\`re.match\` anchors at position 0, and \`"Order 66"\` starts with \`O\`. Use \`re.search\` to find the first match anywhere.`,
    },
    {
      id: 'regular-expressions-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import re
print(re.findall(r"\d+", "3 apples, 12 pears and 100 grapes"))`,
      answer: "['3', '12', '100']",
      accept: ["['3', '12', '100']"],
      explanation: py`\`\d+\` matches runs of one or more digits. \`findall\` returns every match as a **string** — convert with \`int()\` if you need numbers.`,
    },
    {
      id: 'regular-expressions-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`import re
text = "ada@site.com, bob@mail.com"
print(re.findall(r"(\w+)@(\w+)\.com", text))`,
      options: [
        { text: "['ada@site.com', 'bob@mail.com']", why: 'With capturing groups, findall returns the groups, not the whole match.' },
        "[('ada', 'site'), ('bob', 'mail')]",
        { text: "['ada', 'site', 'bob', 'mail']", why: 'With more than one group, each match becomes one tuple of groups — the list is not flattened.' },
        { text: "[('ada@site.com',), ('bob@mail.com',)]", why: 'The tuples hold the captured groups, and there are two groups per match.' },
      ],
      answer: 1,
      explanation: py`With two or more groups, \`findall\` returns a list of tuples, one per match. Use \`finditer\` (or non-capturing \`(?:...)\` groups) if you want the full match.`,
    },
    {
      id: 'regular-expressions-q4',
      type: 'bug',
      prompt: 'This prints `[]` even though the text clearly contains the word "cat". Click the buggy line.',
      code: py`import re
text = "cat concat category"
words = re.findall("\bcat\b", text)
print(words)`,
      answerLine: 3,
      explanation: py`Without the \`r\` prefix, Python turns \`"\b"\` into a backspace character, which never appears in the text. Write \`r"\bcat\b"\` and the result is \`['cat']\`.`,
    },
    {
      id: 'regular-expressions-q5',
      type: 'fill',
      prompt: 'Fill the blanks so the program prints `[\'<b>\', \'</b>\']` and then `too many spaces`.',
      code: py`import re
html = "<b>bold</b>"
print(re.findall(r"<.___>", html))
print(re.___(r"\s+", " ", "too   many    spaces"))`,
      answer: [['+?', '*?'], ['sub']],
      explanation: py`\`+?\` is the **lazy** "one or more", so each match stops at the first \`>\`. \`re.sub(pattern, replacement, text)\` replaces every run of whitespace with a single space.`,
    },
    {
      id: 'regular-expressions-q6',
      type: 'mcq',
      prompt: 'Which is the best way to check whether a URL string starts with "https://"?',
      options: [
        { text: py`re.match(r"https://", url)`, why: 'It works, but it is heavier and less readable than a string method for a fixed prefix.' },
        'url.startswith("https://")',
        { text: py`re.search(r"https://", url)`, why: 'search would also accept "https://" in the middle of the string — wrong check.' },
        { text: py`re.fullmatch(r"https://.*", url)`, why: 'Works for single-line strings but is overkill, and . does not match newlines.' },
      ],
      answer: 1,
      explanation: py`For a fixed prefix, \`str.startswith\` is clearer, faster and can't be mis-written. Use regex when the text has a *variable* shape. (To really parse URLs, use \`urllib.parse\`.)`,
    },
    {
      id: 'regular-expressions-q7',
      type: 'short',
      prompt: 'What is catastrophic backtracking (ReDoS), and name two ways to prevent it.',
      answer: py`It happens when a backtracking regex engine has exponentially many ways to try matching an input that almost matches — typically because of nested or overlapping quantifiers like (a+)+$ — so matching time explodes and a single request can tie up a CPU. Prevent it by writing unambiguous patterns (no nested quantifiers over the same characters, use negated classes like [^,]*), limiting input length, using atomic groups or possessive quantifiers (Python 3.11+), and never running untrusted patterns (or using a linear-time engine such as RE2).`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'extract-hashtags',
      title: 'Extract hashtags',
      difficulty: 'intermediate',
      prompt: py`Write \`hashtags(text)\` that returns a **list** of the hashtags in \`text\`, in order, **lowercased** and **without** the \`#\`. A hashtag is \`#\` followed by one or more word characters (letters, digits, underscore).

\`\`\`text
hashtags("Loving #Python and #regex! #100DaysOfCode")  ->  ['python', 'regex', '100daysofcode']
hashtags("no tags here")                               ->  []
hashtags("#a#b")                                       ->  ['a', 'b']
\`\`\``,
      files: {
        'main.py': py`import re


def hashtags(text):
    # TODO: find every # followed by word characters; return them lowercased, without the #
    return []


print(hashtags("Loving #Python and #regex! #100DaysOfCode"))
`,
      },
      hints: [
        py`\`\w+\` matches one or more word characters. Put a group around the part you want to keep.`,
        py`With one group, \`re.findall\` returns just the group's text: \`re.findall(r"#(\w+)", text)\`.`,
        py`return [tag.lower() for tag in re.findall(r"#(\w+)", text)]`,
      ],
      solution: {
        explanation: py`\`#(\w+)\` matches a literal \`#\` and captures the word after it. Because the pattern has exactly one group, \`findall\` returns a list of the captured strings — no \`#\` included. \`\w+\` stops at the first non-word character (space, \`!\`, another \`#\`), which is why \`"#a#b"\` gives two tags. A list comprehension lowercases each one. (\`\w\` is Unicode-aware, so \`#café\` works too.)`,
        files: {
          'main.py': py`import re


def hashtags(text):
    return [tag.lower() for tag in re.findall(r"#(\w+)", text)]


print(hashtags("Loving #Python and #regex! #100DaysOfCode"))
`,
        },
      },
      tests: [
        { name: 'finds three hashtags', code: py`assert hashtags("Loving #Python and #regex! #100DaysOfCode") == ['python', 'regex', '100daysofcode']` },
        { name: 'no hashtags gives []', code: py`assert hashtags("no tags here") == []` },
        { name: 'adjacent hashtags', code: py`assert hashtags("#a#b") == ['a', 'b']` },
        { name: 'a lone # is not a tag', code: py`assert hashtags("price # 5 and #ok") == ['ok']` },
      ],
    },
    {
      id: 'parse-version',
      title: 'Parse a version number',
      difficulty: 'intermediate',
      prompt: py`Write \`parse_version(text)\` that finds the **first** version number in \`text\` and returns it as a tuple of three ints \`(major, minor, patch)\`.

- A version is \`MAJOR.MINOR\` or \`MAJOR.MINOR.PATCH\`, optionally preceded by \`v\`.
- A missing patch counts as \`0\`.
- If there is no version, return \`None\`.

\`\`\`text
parse_version("v3.14.2")               ->  (3, 14, 2)
parse_version("Python 3.12 is out")    ->  (3, 12, 0)
parse_version("release 10.0.1-beta")   ->  (10, 0, 1)
parse_version("no version")            ->  None
\`\`\``,
      files: {
        'main.py': py`import re


def parse_version(text):
    # TODO: search for MAJOR.MINOR or MAJOR.MINOR.PATCH (optional leading v)
    return None


print(parse_version("v3.14.2"))
print(parse_version("Python 3.12 is out"))
`,
      },
      hints: [
        py`Start with \`(\d+)\.(\d+)\` for major and minor — remember to escape the dot.`,
        py`Make the patch optional with a non-capturing group around the dot: \`(?:\.(\d+))?\`. An optional group that didn't match gives \`None\` in \`m.groups()\`.`,
        py`m = re.search(r"v?(\d+)\.(\d+)(?:\.(\d+))?", text); if not m: return None; major, minor, patch = m.groups(); return int(major), int(minor), int(patch or 0)`,
      ],
      solution: {
        explanation: py`\`v?\` allows an optional \`v\`. \`(\d+)\.(\d+)\` captures major and minor, with \`\.\` matching a literal dot. \`(?:\.(\d+))?\` is an optional *non-capturing* group containing a capturing group for the patch: the outer group exists only to make "dot plus digits" optional as a unit. When it doesn't match, group 3 is \`None\`, so \`int(patch or 0)\` supplies the default. \`search\` finds the first version anywhere and ignores trailing text like \`-beta\`.`,
        files: {
          'main.py': py`import re

VERSION = re.compile(r"v?(\d+)\.(\d+)(?:\.(\d+))?")


def parse_version(text):
    m = VERSION.search(text)
    if m is None:
        return None
    major, minor, patch = m.groups()
    return int(major), int(minor), int(patch or 0)


print(parse_version("v3.14.2"))
print(parse_version("Python 3.12 is out"))
`,
        },
      },
      tests: [
        { name: 'full version with v', code: py`assert parse_version("v3.14.2") == (3, 14, 2)` },
        { name: 'missing patch becomes 0', code: py`assert parse_version("Python 3.12 is out") == (3, 12, 0)` },
        { name: 'ignores a suffix', code: py`assert parse_version("release 10.0.1-beta") == (10, 0, 1)` },
        { name: 'no version gives None', code: py`assert parse_version("no version") is None` },
        { name: 'returns ints, not strings', code: py`assert all(isinstance(n, int) for n in parse_version("2.7.18"))` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'regular-expressions-search-match-fullmatch',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between re.search, re.match and re.fullmatch? Which would you use to validate a product code?',
      answer: 'search finds the first match anywhere; match only tries at the start of the string; fullmatch requires the pattern to cover the entire string. For validation use fullmatch.',
      explanation: py`All three return a Match object or \`None\`. A common bug is validating with \`search\` (or with \`match\`, which still allows trailing junk), so \`"AB-1234; junk"\` passes. \`fullmatch\` is equivalent to anchoring with \`\A(?:...)\Z\`. Avoid relying on \`$\`, which also matches before a trailing newline.`,
      code: { lang: 'python', code: py`import re
CODE = re.compile(r"[A-Z]{2}-\d{4}")
for value in ["AB-1234", "AB-1234x", "xAB-1234"]:
    print(value, bool(CODE.search(value)), bool(CODE.match(value)), bool(CODE.fullmatch(value)))` },
      whyAsked: 'A common source of validation bugs; checks you know the anchoring behaviour precisely.',
      mistakes: ['Saying match checks the whole string', 'Validating with search', 'Using ^...$ and forgetting $ matches before a trailing newline'],
      followUps: ['What does $ match exactly?', 'How would you validate with flags like IGNORECASE?'],
      modelAnswer: 'All three return a Match object or None, but they anchor differently. search scans the whole string and returns the first place the pattern fits. match only tries at position zero, so it is anchored at the start but not at the end. fullmatch only succeeds if the pattern covers the entire string. For validating something like a product code I use fullmatch, because with search or match a value with extra junk before or after can still pass.',
    },
    {
      id: 'regular-expressions-findall-groups',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What do these two lines print, and why do they differ?',
      code: { lang: 'python', code: py`import re
text = "img.jpg doc.pdf pic.png"
print(re.findall(r"\w+\.(jpg|png)", text))
print(re.findall(r"\w+\.(?:jpg|png)", text))` },
      options: [
        "['img.jpg', 'pic.png'] twice",
        "['jpg', 'png'] then ['img.jpg', 'pic.png']",
        "['img', 'pic'] then ['img.jpg', 'pic.png']",
        "['jpg', 'png'] twice",
      ],
      correctOption: 1,
      answer: "['jpg', 'png'] then ['img.jpg', 'pic.png']. With one capturing group, findall returns the group's text; a non-capturing group (?:...) groups without capturing, so findall returns whole matches.",
      explanation: py`\`findall\`'s return shape depends on the number of capturing groups: 0 → whole matches, 1 → that group, 2+ → tuples. The alternation needed parentheses (otherwise \`\w+\.jpg|png\` would mean "\`\w+\.jpg\` or \`png\`"), so the fix is a non-capturing group — or switch to \`finditer\` and call \`m.group()\`.`,
      whyAsked: 'This trips up experienced developers; it tests precise knowledge of groups and the API.',
      mistakes: ['Removing the parentheses entirely (changes the meaning of |)', 'Not knowing (?:...) exists'],
      followUps: ['When would you prefer finditer over findall?', 'What does re.split do with capturing groups?'],
      modelAnswer: "The first prints ['jpg', 'png'] and the second ['img.jpg', 'pic.png']. findall changes what it returns depending on capturing groups: with none it returns the whole matches, with one it returns just that group, and with several it returns tuples. The parentheses were only there to scope the alternation, so the right fix is a non-capturing group, (?:jpg|png), which groups without capturing. For anything more complex I prefer finditer, which always gives full Match objects.",
    },
    {
      id: 'regular-expressions-redos',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'After deploying a new input-validation regex, your API\'s CPU usage spikes and some requests time out. The pattern is `^(\\w+\\s?)*$`. What is happening and how do you fix it?',
      answer: 'Catastrophic backtracking (ReDoS). `(\\w+\\s?)*` lets the engine split a run of word characters into groups in exponentially many ways, and an input that almost matches (e.g. many letters then "!") forces it to try them all. Fix: rewrite unambiguously (`^\\w+(?:\\s\\w+)*\\s?$`), cap input length, use atomic/possessive constructs (3.11+), and treat regex on untrusted input as an attack surface.',
      explanation: py`Because \`\s?\` is optional, \`\w+\` repetitions can carve \`aaaa\` as \`a|aaa\`, \`aa|aa\`, \`a|a|aa\`… When the final \`$\` fails (because of the \`!\`), a backtracking engine retries every carving before giving up — time grows exponentially with the input length. The rewritten pattern requires whitespace *between* words, so there is exactly one way to match. Additional defences: length limits before matching, possessive quantifiers like \`\w++\` (3.11+), fuzzing patterns with adversarial input, running untrusted patterns only in a sandbox or with a linear-time engine (\`google-re2\`).`,
      code: { lang: 'python', code: py`import re
import time

bad = re.compile(r"^(\w+\s?)*$")
good = re.compile(r"^\w+(?:\s\w+)*\s?$")
attack = "a" * 18 + "!"
for name, pattern in [("bad", bad), ("good", good)]:
    start = time.perf_counter()
    pattern.match(attack)
    print(name, f"{time.perf_counter() - start:.4f}s")` },
      whyAsked: 'ReDoS has caused real production outages; it tests security awareness and understanding of how the engine works.',
      mistakes: ['Blaming Python or the server', 'Fixing it by adding a lazy quantifier (does not remove the ambiguity)', 'Not adding an input length limit'],
      followUps: ['Why does a non-matching input trigger it but a matching one does not?', 'What are atomic groups?', 'How would you test new patterns for this in CI?'],
      modelAnswer: 'This is catastrophic backtracking, a ReDoS. Python\'s re is a backtracking engine, and in (\\w+\\s?)* the space is optional, so a run of letters can be split between repetitions in exponentially many ways. When the input almost matches — say many letters followed by an exclamation mark — the final anchor fails and the engine tries every split before giving up. I would rewrite the pattern so there is exactly one way to match, for example a word followed by zero or more groups of a space and a word. I would also cap the input length before matching, consider possessive quantifiers or atomic groups from Python 3.11, and add adversarial inputs to the tests.',
    },
    {
      id: 'regular-expressions-email',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A product manager asks you to "validate email addresses with a regex" on the sign-up form. What do you do?',
      answer: 'Use a deliberately simple check (one @, non-empty local part, a dot in the domain, sane length) and verify ownership by sending a confirmation email. A "complete" RFC 5322 regex is huge, still rejects or accepts edge cases, can be slow, and doesn\'t prove the address exists.',
      explanation: py`Valid addresses include \`o'brien@example.ie\`, \`ada+news@example.com\` and internationalised domains; strict patterns routinely reject real customers. Meanwhile a syntactically perfect address can still be a typo. The only real validation is delivery: send a link. The front-end check exists to catch obvious typos (missing \`@\`). Keep it linear-time and cap the length (254 characters is the commonly used limit).`,
      code: { lang: 'python', code: py`import re

EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")

def looks_like_email(value):
    return len(value) <= 254 and EMAIL.fullmatch(value) is not None

for v in ["ada+news@example.com", "o'brien@example.ie", "no-at-sign.com", "a@b"]:
    print(v, looks_like_email(v))` },
      whyAsked: 'Tests engineering judgement: knowing the limits of regex and focusing on the real requirement.',
      mistakes: ['Pasting a 6,000-character "RFC compliant" regex', 'Rejecting + addresses or apostrophes', 'Treating syntax checking as proof the address works'],
      followUps: ['How would you handle internationalised email addresses?', 'Where else is "validate with regex" a trap? (URLs, HTML, dates)'],
      modelAnswer: 'I would push back gently on the idea that a regex can validate an email address. The full grammar is complicated, strict patterns reject real addresses like ones with plus signs or apostrophes, and even a perfectly formatted address can be a typo or not exist. So I would use a simple linear-time check — exactly one @ with no spaces, something before it, and a dot in the domain, plus a length cap — just to catch obvious mistakes, and then verify the address properly by sending a confirmation link. That is the only check that proves the user can receive mail there.',
    },
    {
      id: 'regular-expressions-compile',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Does calling re.compile make code faster? When should you use it?',
      answer: 'Only slightly in most programs: module-level functions compile too, and re caches recently used compiled patterns. Use re.compile for readability (a named constant), to set flags once, to reuse a pattern in many places, and to avoid cache eviction when a program uses many patterns.',
      explanation: py`\`re.search(pattern, s)\` looks the pattern up in an internal cache and compiles it on a miss. So in a loop with one pattern, the cost is a cache lookup per call rather than a recompilation. A compiled \`Pattern\` skips that lookup and, more importantly, gives the regex a name (\`ISO_DATE\`, \`LOG_LINE\`) and a single place to change it. If you're curious about the speed difference, measure it with \`timeit\` rather than assuming.`,
      whyAsked: 'A common myth; tests whether you reason from documented behaviour rather than folklore.',
      mistakes: ['Claiming the module-level functions recompile on every call', 'Claiming compile makes regex dramatically faster', 'Compiling inside the loop that uses it'],
      followUps: ['How would you measure the difference?', 'Where do you put compiled patterns in a project?'],
      modelAnswer: 'Usually only a little. The module-level functions like re.search compile the pattern too, and the re module caches recently compiled patterns, so a loop with the same pattern mostly pays for a cache lookup, not a recompilation. I still use re.compile for patterns I reuse, mainly for readability: a module-level constant with a good name, flags set once, and one place to change it. It also matters if a program uses lots of different patterns, where cache eviction could kick in. If performance really mattered I would measure with timeit.',
    },
    {
      id: 'regular-expressions-camel-to-snake',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `camel_to_snake(name)` that converts camelCase / PascalCase identifiers to snake_case, keeping acronyms together: "parseHTTPResponse" → "parse_http_response", "getID" → "get_id", "HTTPServer" → "http_server".',
      answer: 'Two re.sub passes: first split an acronym from a following capitalised word (`([A-Z]+)([A-Z][a-z])` → `\\1_\\2`), then split a lowercase letter or digit from a following capital (`([a-z\\d])([A-Z])` → `\\1_\\2`), then lower().',
      explanation: py`The first pass handles the boundary *inside* a run of capitals: in \`HTTPResponse\`, \`HTTP\` + \`Re\` becomes \`HTTP_Response\`. The second pass handles the ordinary boundary between a lowercase letter (or digit) and a capital: \`parseHTTP\` → \`parse_HTTP\`. Lowercasing at the end gives \`parse_http_response\`. Already-snake names contain no matching boundaries and pass through unchanged.`,
      starter: { files: { 'main.py': py`import re


def camel_to_snake(name):
    # TODO: insert "_" at word boundaries, then lowercase
    return name.lower()


print(camel_to_snake("parseHTTPResponse"))
` } },
      tests: [
        { name: 'simple camelCase', code: py`assert camel_to_snake("camelCase") == "camel_case"` },
        { name: 'acronym in the middle', code: py`assert camel_to_snake("parseHTTPResponse") == "parse_http_response"` },
        { name: 'acronym at the start', code: py`assert camel_to_snake("HTTPServer") == "http_server"` },
        { name: 'acronym at the end', code: py`assert camel_to_snake("getID") == "get_id"` },
        { name: 'digits before a capital', code: py`assert camel_to_snake("version2Update") == "version2_update"` },
        { name: 'snake_case is unchanged', code: py`assert camel_to_snake("already_snake") == "already_snake"` },
      ],
      solution: { files: { 'main.py': py`import re

ACRONYM_BOUNDARY = re.compile(r"([A-Z]+)([A-Z][a-z])")
WORD_BOUNDARY = re.compile(r"([a-z\d])([A-Z])")


def camel_to_snake(name):
    name = ACRONYM_BOUNDARY.sub(r"\1_\2", name)
    name = WORD_BOUNDARY.sub(r"\1_\2", name)
    return name.lower()


print(camel_to_snake("parseHTTPResponse"))
` } },
      hints: [py`A word boundary is a lowercase letter or digit followed by a capital: \`([a-z\d])([A-Z])\`.`, py`Acronyms need a separate rule: capitals followed by a Capital+lowercase pair, \`([A-Z]+)([A-Z][a-z])\`. Apply it first.`],
      whyAsked: 'A realistic utility that tests groups, backreferences in sub, and thinking about edge cases like acronyms.',
      mistakes: ['A single [A-Z] rule that produces "h_t_t_p_server"', 'Forgetting digits', 'Lowercasing before splitting'],
      followUps: ['How would you do the reverse (snake_case to camelCase)?', 'Could lookarounds do it in one pass?'],
      modelAnswer: 'I would use two substitutions with groups and backreferences. The first finds a run of capitals followed by a capital and a lowercase letter, which is where an acronym ends and a new word begins, and puts an underscore between them, so HTTPResponse becomes HTTP_Response. The second finds a lowercase letter or digit followed by a capital, the normal camelCase boundary, and inserts an underscore there. Then I lowercase the result. Names that are already snake_case have no such boundaries, so they come through unchanged.',
    },
  ],

  takeaways: [
    'A regex describes the shape of text; always write patterns as raw strings (r"...").',
    'search finds anywhere, match only at the start, fullmatch the whole string — use fullmatch to validate and check for None.',
    'Groups extract parts; named groups (?P<name>...) document them; (?:...) groups without capturing. findall\'s return shape depends on the number of groups.',
    'sub replaces with backreferences (\\1, \\g<name>) or a function; split accepts patterns; flags like IGNORECASE, MULTILINE and VERBOSE change matching.',
    'Quantifiers are greedy and backtrack; lazy versions (`+?`, `*?`) and precise classes (`[^"]*`) prevent over-matching.',
    'Nested quantifiers can cause catastrophic backtracking (ReDoS): write unambiguous patterns, cap input length, never run untrusted patterns — and prefer string methods or real parsers when they fit.',
  ],
}
