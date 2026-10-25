// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SMART_HUB = py`# Smart-home hub: route incoming messages with match (Python 3.10+)
from dataclasses import dataclass


@dataclass
class Sensor:
    room: str
    celsius: float


def handle(message):
    match message:
        case "ping":                                          # literal
            return "pong"
        case ["lights", ("on" | "off") as state]:             # sequence, OR, as
            return f"All lights {state}"
        case ["lights", "dim", level] if 0 <= level <= 100:   # guard
            return f"Lights dimmed to {level}%"
        case {"type": "door", "open": True, "where": where}:  # mapping
            return f"Alert: {where} door opened"
        case {"type": "door"}:
            return "Door event ignored"
        case Sensor(room=room, celsius=temp) if temp > 30:    # class + guard
            return f"Too hot in the {room}: {temp}°C"
        case Sensor(room=room):
            return f"{room.title()} is fine"
        case [command, *args]:                                # star capture
            return f"Unknown command {command!r} with {len(args)} argument(s)"
        case _:                                               # wildcard
            return "Unrecognised message"


messages = [
    "ping",
    ["lights", "on"],
    ["lights", "dim", 40],
    ["lights", "dim", 400],
    {"type": "door", "open": True, "where": "front"},
    {"type": "door", "open": False, "where": "back"},
    Sensor("kitchen", 34.5),
    Sensor("bedroom", 19.0),
    ["vacuum", "start", "now"],
    42,
]
for message in messages:
    print(handle(message))
`

export default {
  id: 'match-statement',
  title: 'Structural pattern matching with match',
  summary: 'The match statement (Python 3.10+) compares a value against patterns that describe its shape — literals, sequences, mappings and classes — and captures the parts you need in the same step.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['if-statements', 'tuples-and-unpacking', 'dictionaries'],
  related: ['if-statements', 'tuples-and-unpacking', 'dictionaries', 'dataclasses', 'enums', 'classes-and-objects', 'json-data', 'command-line-programs', 'modern-features', 'static-type-checking'],
  tags: ['match', 'case', 'pattern matching', 'structural pattern matching', 'switch', 'wildcard', 'capture pattern', 'literal pattern', 'value pattern', 'or pattern', 'guard', 'sequence pattern', 'mapping pattern', 'class pattern', '__match_args__', 'dataclass', 'PEP 634', 'Python 3.10'],
  apis: [
    { name: 'match subject: / case pattern:', summary: 'Evaluates the subject once, then runs the first case whose pattern matches. No fall-through; if nothing matches, nothing happens.' },
    { name: 'case _:', summary: 'Wildcard: matches anything and binds nothing. Used as the final catch-all.' },
    { name: 'case pattern if condition:', summary: 'Guard: the case is chosen only if the pattern matches and the condition is truthy.' },
    { name: 'case [first, *rest]:', summary: 'Sequence pattern: matches lists/tuples (not strings) of a suitable length and unpacks them.' },
    { name: 'case {"key": value, **rest}:', summary: 'Mapping pattern: matches dicts that have the given keys; extra keys are ignored unless captured with **rest.' },
    { name: 'case Point(x=0, y=y):', summary: 'Class pattern: isinstance check plus attribute patterns. Positional sub-patterns use __match_args__.' },
    { name: 'pattern as name', summary: 'Binds the value matched by a sub-pattern (often an OR pattern) to a name.' },
  ],
  docs: [
    { label: 'Python tutorial — match statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#match-statements' },
    { label: 'Language reference — the match statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-match-statement' },
    { label: 'PEP 636 — Structural pattern matching: tutorial', url: 'https://peps.python.org/pep-0636/' },
    { label: 'PEP 634 — Structural pattern matching: specification', url: 'https://peps.python.org/pep-0634/' },
    { label: 'PEP 635 — Structural pattern matching: motivation and rationale', url: 'https://peps.python.org/pep-0635/' },
    { label: 'What\'s New in Python 3.10 — pattern matching', url: 'https://docs.python.org/3/whatsnew/3.10.html#pep-634-structural-pattern-matching' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    { callout: 'version', title: 'Python 3.10+', text: py`\`match\` was added in Python 3.10 (PEP 634). On 3.9 and older, a file containing it is a \`SyntaxError\` and won't run at all. The playground runs 3.14, so everything here works.` },
    py`The **match statement** takes one value — the **subject** — and compares it against a list of **patterns**, top to bottom. The first \`case\` whose pattern fits runs; the rest are skipped.`,
    { code: py`command = "go north"
match command.split():
    case ["quit"]:
        print("Goodbye")
    case ["go", direction]:
        print("Walking", direction)      # Walking north
    case _:
        print("Unknown command")`, lang: 'python', title: 'match a value against patterns' },
    py`If you've seen \`switch\` in other languages, \`match\` looks similar — but it's far more powerful. Patterns describe the **shape** of data ("a list with exactly two items whose first item is \`"go"\`"), and they **capture** parts of it into names in the same step: \`direction\` above is bound to \`"north"\` only because the pattern matched.`,
    py`You'll learn every kind of pattern — literal, capture, wildcard, OR, guard, sequence, mapping and class — plus the one rule that trips everyone up: **a bare name in a pattern captures; it never compares.**`,
  ],
  why: [
    py`Programs constantly receive data whose shape varies: commands typed by a user, JSON events from a web service, messages between parts of a system, tokens from a parser. Handling them with [\`if\`/\`elif\`](lesson:if-statements) means checking the type, checking the length, checking keys, *then* digging values out by index — the same facts written twice.`,
    { code: py`event = {"type": "click", "x": 3, "y": 7}

# if/elif: check, then extract
if isinstance(event, dict) and event.get("type") == "click" and "x" in event and "y" in event:
    x, y = event["x"], event["y"]
    print("click at", x, y)

# match: check and extract in one pattern
match event:
    case {"type": "click", "x": x, "y": y}:
        print("click at", x, y)`, lang: 'python', title: 'same decision, two styles' },
    py`\`match\` says what the data **looks like** and takes it apart in one go. When the branches are about *structure*, it's shorter, harder to get wrong, and reads like a description of the inputs your code accepts.`,
    py`It's not a replacement for every \`if\`. Ranges, combinations of unrelated facts, and simple value-to-value lookups are still clearer with \`if\` or a dict — knowing which tool fits is part of this lesson.`,
  ],
  eli15: [
    py`Imagine the post room at a big school. Parcels arrive all day, and the sorter has a list of rules, checked from the top:`,
    py`- *"A small envelope? → letters tray."*
- *"A box with a FRAGILE sticker? → careful shelf — and write down who it's for."*
- *"Anything with two labels, the first saying 'Return'? → returns bin, note the second label."*
- *"Anything else → general pile."*`,
    py`The rules don't just ask "is it exactly this thing?" — they describe **shapes** ("a box with a sticker"). And while checking, the sorter **copies details** off the parcel (the name on it). That's \`match\`: patterns describe the shape, and blanks in the pattern get filled in from the data.`,
  ],
  analogy: {
    title: 'The post-room sorting rules',
    body: [
      py`A sorter holds each parcel up against a list of rules, top to bottom, and follows the first rule that fits. Some rules name an exact thing ("the parcel labelled URGENT"), some describe a shape ("a box with two labels"), and some contain blanks: *"a box addressed to ______"* — when it fits, the sorter writes the name into the blank.`,
      py`Here's the catch. A rule that is **only** a blank — *"______"* — fits **every** parcel and fills the blank with it. If that rule sits at the top, nothing ever reaches the rules below. That's exactly what happens when you write a bare name like \`case MAX_SIZE:\` meaning "compare with MAX_SIZE": Python reads it as a blank to fill in.`,
    ],
    mapping: [
      ['the parcel being sorted', 'the subject: match subject:'],
      ['one sorting rule', 'one case pattern'],
      ['rules checked from the top, first fit wins', 'cases tried in order; only one runs'],
      ['"a box with two labels"', 'a sequence pattern: [first, second]'],
      ['"a FRAGILE sticker, addressed to ____"', 'a mapping pattern with a capture: {"fragile": True, "to": name}'],
      ['a blank on the rule', 'a capture pattern: a bare name that gets bound'],
      ['"anything else → general pile"', 'case _: the wildcard'],
      ['a rule that is only a blank', 'case some_name: matches everything — the capture trap'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a case match and capture',
    props: {
      code: py`def describe(command):
    match command.split():
        case ["quit"]:
            return "Goodbye"
        case ["go", direction]:
            return f"Walking {direction}"
        case ["take", *items]:
            return f"Taking {len(items)} item(s)"
        case _:
            return "Unknown command"


print(describe("go north"))
print(describe("take lamp key"))
print(describe("dance"))
`,
      notes: {
        2: 'The subject `command.split()` is evaluated **once**, giving a list such as `["go", "north"]`.',
        5: 'For `["go", "north"]`: two items, first is `"go"` → match. `direction` is **bound** to `"north"` as part of matching.',
        7: '`*items` captures "everything after the first item" as a list — any length, even zero.',
        9: '`_` matches anything. `["dance"]` failed every pattern above, so it lands here.',
      },
    },
    alt: 'A step-by-step trace of describe(). For "go north", the split list fails the ["quit"] pattern and matches ["go", direction], binding direction to "north" and returning "Walking north". For "take lamp key", the ["take", *items] pattern binds items to ["lamp", "key"] and returns "Taking 2 item(s)". For "dance", no specific pattern matches, so the wildcard case returns "Unknown command".',
    caption: py`Step through and watch the **local variables**: \`direction\` and \`items\` appear only when their case matches. That's capturing.`,
  },
  syntax: [
    py`#### The shape`,
    { code: py`status = 404
match status:                 # the subject, evaluated once
    case 200:                 # a pattern
        print("OK")
    case 404:
        print("Not found")    # first match wins…
    case _:                   # …and only one case runs
        print("Something else")`, lang: 'python', title: 'match subject: case pattern:' },
    py`- Cases are tried **top to bottom**; the first match runs and the statement ends. There is **no fall-through** (no \`break\` needed, unlike C's \`switch\`).
- If **no** case matches, nothing happens — no error — and execution continues after the \`match\`. Add \`case _:\` when you want a catch-all.
- \`match\` and \`case\` are *soft keywords*: they're only special at the start of a \`match\` statement, so existing code using \`match\` as a variable name (like \`re.match\`) keeps working.`,
    py`#### Literal patterns`,
    py`Numbers, strings, \`None\`, \`True\` and \`False\`. Strings and numbers are compared with \`==\`; \`None\`, \`True\` and \`False\` are compared with \`is\` (identity) — so \`case True:\` does **not** match \`1\`, while \`case 1:\` **does** match \`True\` and \`1.0\`, because \`True == 1\` and \`1.0 == 1\`.`,
    py`#### The wildcard \`_\``,
    py`\`case _:\` matches anything and binds nothing. It's the "else" of \`match\`, so it must come last — Python refuses to compile a wildcard with cases after it (\`SyntaxError: wildcard makes remaining patterns unreachable\`). \`_\` also works inside other patterns: \`case ["go", _]:\` means "two items, first is go, don't care about the second".`,
    py`#### Capture patterns — and the dotted-name rule`,
    py`A **bare name** in a pattern matches **anything** and **binds** that name to the matched value. It never compares with an existing variable:`,
    { code: py`expected = 200
status = 404
match status:
    case expected:                   # NOT "is status == expected?"
        print("matched:", expected)  # matched: 404 — expected was overwritten!`, lang: 'python', title: 'a bare name captures' },
    py`To compare against a named constant, the name must be **dotted** — \`module.NAME\`, \`Class.NAME\` or an enum member. Dotted names are *value patterns*, compared with \`==\`:`,
    { code: py`from http import HTTPStatus

def label(status):
    match status:
        case HTTPStatus.OK:               # dotted → compared with ==
            return "fine"
        case HTTPStatus.NOT_FOUND:
            return "missing"
        case 500 | 502 | 503:             # literals, combined with |
            return "server trouble"
        case _:
            return "unexpected"


print(label(200), label(404), label(503))   # fine missing server trouble`, lang: 'python', title: 'dotted names compare' },
    { callout: 'warn', title: 'The dotted-name rule', text: py`\`case MAX:\` **captures** (and matches everything). \`case Limits.MAX:\` **compares**. If a bare-name capture is followed by other cases, Python stops you at compile time: \`SyntaxError: name capture 'MAX' makes remaining patterns unreachable\`. As the last case, though, it silently matches everything — so group constants in an \`Enum\` or class and use the dotted form.` },
    py`#### OR patterns and \`as\``,
    { code: py`answer = "Y"
match answer.lower():
    case "y" | "yes" | "sure":
        print("Confirmed")
    case "n" | "no":
        print("Cancelled")

match ["walk", "north"]:
    case ["go" | "walk" as verb, direction]:   # as binds the alternative that matched
        print(verb, direction)                 # walk north`, lang: 'python', title: 'alternatives with |' },
    py`Every alternative of an OR pattern must bind the **same names** — otherwise \`SyntaxError: alternative patterns bind different names\`.`,
    py`#### Guards: \`case pattern if condition\``,
    { code: py`point = (3, 3)
match point:
    case (x, y) if x == y:
        print("on the diagonal at", x)
    case (x, y):
        print("somewhere else:", x, y)`, lang: 'python', title: 'a guard adds a condition' },
    py`The pattern is checked first; if it matches, the guard is evaluated with the captured names available. If the guard is false, Python moves on to the **next case** — it doesn't give up on the whole \`match\`.`,
    py`#### Sequence patterns`,
    { code: py`def summarize(items):
    match items:
        case []:
            return "empty"
        case [only]:
            return f"just {only}"
        case [first, second]:
            return f"{first} and {second}"
        case [first, *rest]:              # one starred name, anywhere
            return f"{first} and {len(rest)} more"


print(summarize([]), summarize(["tea"]), summarize(["tea", "jam", "cake"]))`, lang: 'python', title: 'match length and unpack at once' },
    py`- \`[a, b]\` and \`(a, b)\` mean the same thing; both match lists, tuples and other sequences of exactly that length.
- \`*rest\` captures any number of items (as a list); \`*_\` ignores them. Only **one** star per sequence pattern.
- **Strings, bytes and bytearrays never match sequence patterns**, even though they are sequences. \`case [first, *_]:\` will not match \`"hello"\` — use \`case str():\` or a literal for strings.`,
    py`#### Mapping patterns`,
    { code: py`event = {"type": "purchase", "user": "ada", "items": ["tea"], "ts": 1712}
match event:
    case {"type": "login", "user": user}:
        print(user, "logged in")
    case {"type": "purchase", "user": user, "items": [item]}:
        print(user, "bought", item)          # ada bought tea  ("ts" is ignored)
    case {"type": kind, **rest}:
        print("unhandled", kind, "with", sorted(rest))`, lang: 'python', title: 'match dicts by their keys' },
    py`A mapping pattern matches any dict (any *mapping*) that **has** the listed keys with matching values. **Extra keys are ignored** — perfect for JSON, where new fields appear all the time. \`**rest\` captures the remaining key/value pairs as a new dict. Keys must be literals or dotted names.`,
    py`#### Class patterns`,
    { code: py`from dataclasses import dataclass


@dataclass
class Point:
    x: int
    y: int


def where(p):
    match p:
        case Point(x=0, y=0):             # keyword: compares attributes
            return "origin"
        case Point(0, y):                 # positional: uses __match_args__
            return f"on the y axis at {y}"
        case Point(x=x, y=0):
            return f"on the x axis at {x}"
        case Point():                     # any Point at all
            return "somewhere else"
        case _:
            return "not a point"


print(where(Point(0, 5)), "|", where(Point(2, 0)), "|", where((0, 0)))`, lang: 'python', title: 'isinstance + attributes in one pattern' },
    py`\`Point(...)\` in a pattern **does not create a Point**. It means: *is the subject an instance of \`Point\`, and do its attributes match these sub-patterns?* Keyword sub-patterns (\`x=0\`) work with any class. Positional ones (\`Point(0, y)\`) need the class attribute \`__match_args__\`, which tells Python the attribute order — [dataclasses](lesson:dataclasses) generate it for you. Built-in types match themselves: \`case int(n):\` / \`case str(text):\` check the type and bind the whole value.`,
    { code: py`def kind(value):
    match value:
        case bool():             # bool before int: True is also an int
            return "a boolean"
        case int() | float():
            return "a number"
        case str() if value.strip() == "":
            return "a blank string"
        case str():
            return "a string"
        case _:
            return "something else"


print(kind(True), "|", kind(3.5), "|", kind("  "), "|", kind([1]))`, lang: 'python', title: 'type checks with class patterns' },
    py`#### Patterns nest`,
    py`Every pattern can contain other patterns — a mapping with a sequence inside, a class with a mapping inside — so one \`case\` can describe a deeply structured message. Keep them readable: if a pattern doesn't fit on two lines, it's probably doing too much.`,
  ],
  walkthrough: {
    title: 'Reading the smart-home hub line by line',
    lang: 'python',
    code: SMART_HUB,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 8], text: py`A [dataclass](lesson:dataclasses) generates \`__init__\`, \`__repr__\` and \`__match_args__ = ("room", "celsius")\` for us — so \`Sensor\` works in class patterns.` },
      { lines: [12], text: py`The subject is \`message\`, which can be a string, a list, a dict or a \`Sensor\`. One \`match\` handles them all.` },
      { lines: [13, 14], text: py`A **literal** pattern: matches only the string \`"ping"\` (compared with \`==\`).` },
      { lines: [15, 16], text: py`A **sequence** pattern of exactly two items. The second must be \`"on"\` or \`"off"\` (an **OR** pattern), and \`as state\` binds whichever one matched.` },
      { lines: [17, 18], text: py`A **guard**: \`["lights", "dim", 400]\` matches the pattern, but \`0 <= 400 <= 100\` is false — so Python carries on with the next case instead of stopping.` },
      { lines: [19, 22], text: py`**Mapping** patterns. The first needs \`"type": "door"\` **and** \`"open": True\` (compared with \`is\`), capturing \`where\`. A closed-door event fails it and falls through to the broader \`{"type": "door"}\`. Specific before general!` },
      { lines: [23, 26], text: py`**Class** patterns: \`isinstance(message, Sensor)\` plus attribute checks. Keyword sub-patterns capture \`room\` and \`temp\`; the guard picks out hot rooms.` },
      { lines: [27, 28], text: py`A **star** capture: any non-empty sequence ends up here — including \`["lights", "dim", 400]\`, whose guard failed earlier. \`!r\` shows the value with quotes.` },
      { lines: [29, 30], text: py`The **wildcard** catches everything else — like the int \`42\`, which is neither a string, a sequence, a mapping nor a \`Sensor\`.` },
      { lines: [46, 47], text: py`Each message goes through \`handle()\`, and exactly one case answers it.` },
    ],
  },
  playground: {
    title: 'Smart-home hub',
    objective: 'Teach the hub new messages, fix an unhelpful fallback, fall into the capture trap on purpose — and climb out with a dotted name.',
    files: { 'main.py': SMART_HUB },
    expected: py`\`\`\`text
pong
All lights on
Lights dimmed to 40%
Unknown command 'lights' with 2 argument(s)
Alert: front door opened
Door event ignored
Too hot in the kitchen: 34.5°C
Bedroom is fine
Unknown command 'vacuum' with 2 argument(s)
Unrecognised message
\`\`\`

Line 4 is the guard failing: the dim-to-400 message fell all the way to the star pattern.`,
    experiments: [
      {
        id: 'lights-toggle',
        task: py`Teach the hub \`["lights", "toggle"]\`: \`handle(["lights", "toggle"])\` should return \`"Lights toggled"\`.`,
        hint: py`Add \`case ["lights", "toggle"]:\` returning \`"Lights toggled"\`. Where? Anywhere **above** \`case [command, *args]:\`, which would otherwise catch it first.`,
        tests: [
          { name: 'handle(["lights", "toggle"]) == "Lights toggled"', code: py`assert handle(["lights", "toggle"]) == "Lights toggled"` },
          { name: 'on/off still work', code: py`assert handle(["lights", "off"]) == "All lights off"` },
        ],
        explain: py`Cases are tried in order, and \`[command, *args]\` matches **any** non-empty sequence. A new specific case must come before the general one — the same "specific before general" rule as an \`if\`/\`elif\` chain.`,
      },
      {
        id: 'dim-range',
        task: py`\`["lights", "dim", 400]\` currently produces the confusing \`Unknown command 'lights' with 2 argument(s)\`. Make it return \`"Level must be 0-100"\` instead, while valid levels keep working.`,
        hint: py`Right after the guarded dim case, add \`case ["lights", "dim", _]:\` → \`return "Level must be 0-100"\`. It only runs when the guard above it failed.`,
        tests: [
          { name: 'out-of-range level gets a clear message', code: py`assert handle(["lights", "dim", 400]) == "Level must be 0-100"` },
          { name: 'valid levels still dim the lights', code: py`assert handle(["lights", "dim", 40]) == "Lights dimmed to 40%"` },
        ],
        explain: py`A failed guard doesn't end the \`match\` — Python tries the next case. Pairing a guarded case with an unguarded one of the same shape is a clean way to separate "valid" from "right shape, wrong value".`,
      },
      {
        id: 'capture-trap',
        task: py`Fall into the trap first: add \`PING = "ping"\` at the top and change \`case "ping":\` to \`case PING:\`. Run it and read the error. Then fix it properly: replace \`PING = "ping"\` with a class holding the constant —

\`\`\`python
class Cmd:
    PING = "ping"
\`\`\`

— and use \`case Cmd.PING:\`.`,
        hint: py`A bare name in a pattern captures (it would match **every** message). A dotted name like \`Cmd.PING\` is a value pattern, compared with \`==\`.`,
        tests: [
          { name: 'a Cmd class holds PING = "ping"', code: py`assert 'Cmd' in ns and Cmd.PING == "ping", 'Create class Cmd with PING = "ping"'` },
          { name: 'the case uses the dotted name', code: py`assert 'case Cmd.PING' in files['main.py']` },
          { name: '"ping" still answers "pong", other messages are unaffected', code: py`assert handle("ping") == "pong" and handle("pong") != "pong"` },
        ],
        explain: py`\`case PING:\` followed by more cases is rejected with \`SyntaxError: name capture 'PING' makes remaining patterns unreachable\` — Python noticed it would match everything. \`case Cmd.PING:\` contains a dot, so it's a **value pattern** that compares with \`==\`. In real code, an [Enum](lesson:enums) is the usual home for such constants.`,
      },
      {
        id: 'thermostat',
        task: py`Handle a new JSON-style message: \`{"type": "thermostat", "set": 21}\` should return \`"Thermostat set to 21°C"\`. Only accept a whole number for \`"set"\`.`,
        hint: py`A mapping pattern with a class pattern inside: \`case {"type": "thermostat", "set": int(target)}:\` → \`return f"Thermostat set to {target}°C"\`. \`int(target)\` checks the type **and** captures the value.`,
        tests: [
          { name: 'a whole-number target is accepted', code: py`assert handle({"type": "thermostat", "set": 21}) == "Thermostat set to 21°C"` },
          { name: 'extra keys are ignored', code: py`assert handle({"type": "thermostat", "set": 18, "source": "app"}) == "Thermostat set to 18°C"` },
          { name: 'a non-number target is not accepted', code: py`assert "warm" not in handle({"type": "thermostat", "set": "warm"})` },
        ],
        explain: py`Patterns nest: the mapping pattern checks the keys, and the class pattern \`int(target)\` inside it checks the value's type and binds it. Extra keys like \`"source"\` don't stop a mapping pattern from matching.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How Python tries each case',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'subject', label: 'subject', note: '{"type": "click", "x": 3, "y": 7}', x: 120, y: 60, tone: 'paper' },
        { id: 'case1', label: 'case {"type": "key", ...}', note: 'pattern 1', x: 120, y: 190, tone: 'yellow' },
        { id: 'case2', label: 'case {"type": "click", "x": x, "y": y}', note: 'pattern 2', x: 420, y: 190, tone: 'yellow' },
        { id: 'bind', label: 'x = 3, y = 7', note: 'captured names', x: 420, y: 60, tone: 'blue' },
        { id: 'body', label: 'case 2 body runs', note: 'print("click at", x, y)', x: 650, y: 60, tone: 'blue' },
        { id: 'rest', label: 'case _', note: 'never tried', x: 650, y: 280, tone: 'ink' },
      ],
      edges: [
        { from: 'subject', to: 'case1', label: 'try' },
        { id: 'fail', from: 'case1', to: 'case2', label: 'no match', dashed: true },
        { from: 'case2', to: 'bind', label: 'match!' },
        { from: 'bind', to: 'body' },
        { id: 'skip', from: 'case2', to: 'rest', label: 'skipped', dashed: true },
      ],
      steps: [
        { focus: ['subject'], text: py`The subject is evaluated **once**. Every case is compared against that same value.` },
        { focus: ['subject', 'case1'], edges: ['subject->case1'], text: py`Case 1: is it a mapping? Yes. Does it have a \`"type"\` key equal to \`"key"\`? No — so the pattern **fails**, and nothing is executed.` },
        { focus: ['case1', 'case2'], edges: ['fail'], text: py`Case 2: a mapping ✓, \`"type"\` equals \`"click"\` ✓, has \`"x"\` ✓ and \`"y"\` ✓. Extra keys would be ignored.` },
        { focus: ['case2', 'bind'], edges: ['case2->bind'], text: py`Because it matched, the **capture patterns** \`x\` and \`y\` are bound to 3 and 7. Matching and unpacking happen in the same step.` },
        { focus: ['bind', 'body'], edges: ['bind->body'], text: py`The body runs with those names. If the case had a guard (\`if x > 0\`), it would be evaluated now, before the body.` },
        { focus: ['rest'], edges: ['skip'], text: py`The \`match\` is finished: later cases, even \`case _\`, are **never tried**. No fall-through, ever.` },
      ],
    },
    alt: 'Diagram of a match statement. The subject, a click event dict, is tried against case 1, a key-event mapping pattern, which fails. A dashed "no match" arrow leads to case 2, a click mapping pattern, which matches and binds x = 3 and y = 7; then the case 2 body runs. A dashed "skipped" arrow shows the final case _ is never tried.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Think of \`match\` as a smarter \`if\`/\`elif\` chain where each condition is written as a **picture of the data** instead of a boolean expression. Python evaluates the subject once, then holds it up against each picture in turn.`,
      py`Two things happen when a pattern matches: Python confirms the shape (type, length, keys, values), and it **binds** the capture names. That's why you can use \`direction\` or \`items\` inside the case body without ever assigning them yourself.`,
      py`If nothing matches and there's no \`case _\`, nothing happens and the program continues. Unlike some languages, Python doesn't raise an error for an unmatched value — so add a wildcard (often one that logs or raises) when every input should be handled.`,
    ],
    technical: [
      py`**What each pattern checks** (language rules from PEP 634):

| pattern | succeeds when |
|---|---|
| literal \`42\`, \`"go"\` | \`subject == literal\` |
| \`None\`, \`True\`, \`False\` | \`subject is literal\` |
| value \`Color.RED\` | \`subject == Color.RED\` (any dotted name) |
| capture \`name\` / wildcard \`_\` | always (\`_\` binds nothing) |
| sequence \`[a, *rest]\` | subject is a \`collections.abc.Sequence\` but **not** \`str\`/\`bytes\`/\`bytearray\`, with a fitting length; then each item matches |
| mapping \`{"k": p}\` | subject is a \`collections.abc.Mapping\` containing every listed key, and each value matches |
| class \`Cls(p, k=q)\` | \`isinstance(subject, Cls)\`; positional sub-patterns map to attributes named in \`Cls.__match_args__\`; keyword ones are looked up with \`getattr\`; missing attributes mean no match |`,
      py`**Captures are ordinary assignments** in the enclosing scope. Inside a function they are local variables; at module level they're globals — which is how \`case expected:\` overwrites \`expected\`.`,
      py`**Guards run after the pattern has bound its names.** If the guard is false, matching continues with the next case — but the names bound by the failed case may stay bound. The reference manual says not to rely on bindings (or on variables staying unchanged) after a failed match: the exact behaviour is implementation-dependent.`,
      { code: py`x = "start"
match (1, 2):
    case (x, y) if x > 5:    # pattern matches, binds x = 1, guard is False
        pass
    case _:
        pass
print(x)                     # 1 in CPython — don't rely on it`, lang: 'python', title: 'bindings from a failed guard (implementation-dependent)' },
      py`**Built-in types match themselves.** For \`bool\`, \`bytearray\`, \`bytes\`, \`dict\`, \`float\`, \`frozenset\`, \`int\`, \`list\`, \`set\`, \`str\` and \`tuple\`, a single positional sub-pattern matches the **whole subject**: \`case int(n)\` checks the type and binds \`n\` to the subject. And because \`bool\` is a subclass of \`int\`, \`case int():\` also matches \`True\` — put \`case bool():\` first if they need different handling.`,
      py`**Mapping patterns use \`.get()\` semantics without triggering defaults.** The matcher looks keys up with the mapping's \`get()\` method, so a \`collections.defaultdict\` won't grow new keys just because a pattern asked about them. Duplicate literal keys in one pattern are a \`SyntaxError\`.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython compiles \`match\` into ordinary bytecode that tests each case **in order** — type checks, length checks, key lookups, comparisons — with dedicated instructions such as \`MATCH_SEQUENCE\`, \`MATCH_MAPPING\`, \`MATCH_KEYS\` and \`MATCH_CLASS\`. There is no jump table, so a \`match\` is not inherently faster than the equivalent \`if\`/\`elif\` chain; choose it for clarity. Other implementations may compile it differently.` },
    ],
    production: [
      py`**Where match shines:** command interpreters (\`command.split()\`), routing JSON events and webhook payloads, message handlers in queues and actors, parsers and compilers walking syntax trees (the standard library's \`ast\` nodes have \`__match_args__\`), and small state machines keyed by \`(state, event)\` tuples.`,
      py`**Exhaustiveness with a type checker.** Python itself never complains about an unhandled case, but [mypy and pyright](lesson:static-type-checking) can. Match on an [Enum](lesson:enums) or a union of classes and end with \`case _: assert_never(value)\` (\`typing.assert_never\`, Python 3.11+). If someone adds a new enum member and forgets to handle it, the type checker reports an error before the code ships.`,
      { code: py`from enum import Enum
from typing import assert_never      # Python 3.11+


class Light(Enum):
    RED = "red"
    AMBER = "amber"
    GREEN = "green"


def action(light: Light) -> str:
    match light:
        case Light.RED:
            return "stop"
        case Light.AMBER:
            return "get ready"
        case Light.GREEN:
            return "go"
        case _:
            assert_never(light)      # a type checker proves this is unreachable


print(action(Light.AMBER))`, lang: 'python', title: 'exhaustive matching checked by mypy/pyright' },
      py`**Validate at the boundary, then match.** Mapping patterns ignore extra keys and don't check every value's type. For untrusted input (API requests, files from users), validate it first — with checks, or a schema library such as pydantic — and treat \`case _\` as "invalid input": log it or raise, never silently drop it. See [input validation](lesson:input-validation).`,
      py`**Don't use match as a lookup table.** \`case "small": return 2.5\` / \`case "medium": return 3.0\`… is a dictionary in disguise: \`PRICES[size]\` is shorter and data-driven. Likewise, numeric ranges (\`if 0 <= t < 10\`) read better as \`if\`/\`elif\`. Reach for \`match\` when the cases differ in **shape**.`,
      py`**Version gate.** A module containing \`match\` won't even import on Python 3.9 or older. If a library must support old versions, keep \`match\` out of it (or out of the modules those versions import), and declare \`requires-python = ">=3.10"\` in \`pyproject.toml\` when you do use it ([packaging](lesson:packaging)).`,
    ],
  },
  mistakes: [
    {
      title: 'Using a bare name to compare against a constant',
      wrong: { code: py`MAX_PLAYERS = 4
players = 2
match players:
    case MAX_PLAYERS:              # captures — doesn't compare!
        print("Game is full")      # printed for ANY number of players`, lang: 'python' },
      right: { code: py`class Limits:
    MAX_PLAYERS = 4

players = 2
match players:
    case Limits.MAX_PLAYERS:       # dotted name → compared with ==
        print("Game is full")
    case _:
        print("Seats available")`, lang: 'python' },
      explanation: py`A bare name is a capture pattern: it matches anything and re-binds the name (here, \`MAX_PLAYERS\` becomes \`2\`!). With more cases after it, Python raises \`SyntaxError: name capture 'MAX_PLAYERS' makes remaining patterns unreachable\`. Use a dotted name (class attribute, enum member, \`module.CONSTANT\`) or a literal.`,
    },
    {
      title: 'Expecting a sequence pattern to match a string',
      wrong: { code: py`def first_letter(word):
    match word:
        case [first, *_]:
            return first
        case _:
            return None

print(first_letter("hello"))   # None — strings never match sequence patterns`, lang: 'python' },
      right: { code: py`def first_letter(word):
    match word:
        case str() if word:
            return word[0]
        case _:
            return None

print(first_letter("hello"))   # h`, lang: 'python' },
      explanation: py`Sequence patterns deliberately exclude \`str\`, \`bytes\` and \`bytearray\` — otherwise every string would accidentally match patterns meant for lists of words. Match strings with literals or \`str()\`, and index them normally.`,
    },
    {
      title: 'Putting the general case first',
      wrong: { code: py`match ["lights", "dim", 40]:
    case [command, *args]:                 # matches every non-empty list…
        print("generic", command)
    case ["lights", "dim", level]:         # …so this is never reached
        print("dim to", level)`, lang: 'python' },
      right: { code: py`match ["lights", "dim", 40]:
    case ["lights", "dim", level]:
        print("dim to", level)
    case [command, *args]:
        print("generic", command)`, lang: 'python' },
      explanation: py`First match wins, exactly like \`elif\`. Python only rejects the most obvious cases (a bare capture or \`_\` before other cases); a broad structural pattern above a narrow one compiles fine and silently hides it. Order cases from specific to general.`,
    },
    {
      title: 'Positional class patterns on a class without __match_args__',
      wrong: { code: py`class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

match Point(0, 5):
    case Point(0, y):       # TypeError: Point() accepts 0 positional sub-patterns (2 given)
        print("on the y axis")`, lang: 'python', static: true },
      right: { code: py`class Point:
    __match_args__ = ("x", "y")      # or use @dataclass, which adds it
    def __init__(self, x, y):
        self.x = x
        self.y = y

match Point(0, 5):
    case Point(0, y):
        print("on the y axis at", y)`, lang: 'python' },
      explanation: py`Python can't guess which attribute a positional sub-pattern refers to. Either use keywords (\`Point(x=0, y=y)\`, which always work) or define \`__match_args__\`. Dataclasses and named tuples generate it automatically.`,
    },
    {
      title: 'Writing case str: instead of case str():',
      wrong: { code: py`def kind(value):
    match value:
        case str:              # a capture named "str" — matches everything
            return "text"`, lang: 'python', static: true },
      right: { code: py`def kind(value):
    match value:
        case str():            # class pattern: isinstance(value, str)
            return "text"
        case _:
            return "not text"`, lang: 'python' },
      explanation: py`Without parentheses, \`str\` is just a name, so it's a capture pattern (shadowing the built-in \`str\` too!). The parentheses make it a class pattern that checks the type.`,
    },
    {
      title: 'Using match where a dictionary is clearer',
      wrong: { code: py`def price(size):
    match size:
        case "small":
            return 2.5
        case "medium":
            return 3.0
        case "large":
            return 3.5
        case _:
            return None`, lang: 'python' },
      right: { code: py`PRICES = {"small": 2.5, "medium": 3.0, "large": 3.5}

def price(size):
    return PRICES.get(size)`, lang: 'python' },
      explanation: py`When every case maps one literal to one value, the cases are really **data**. A dict is shorter, easy to extend (or load from a file), and does the lookup by hashing instead of trying each case in turn.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: name capture 'OK' makes remaining patterns unreachable`,
      cause: py`A bare name (\`case OK:\`) was meant to compare with a constant, but bare names capture — so it would match everything and hide the cases below.`,
      fix: py`Use a dotted name (\`HTTPStatus.OK\`, \`Status.OK\`), a literal (\`case 200:\`), or a guard (\`case code if code == OK:\`).`,
    },
    {
      symptom: py`SyntaxError: wildcard makes remaining patterns unreachable`,
      cause: py`\`case _:\` isn't the last case.`,
      fix: py`Move the wildcard to the end. It's the catch-all, like \`else\`.`,
    },
    {
      symptom: py`SyntaxError: alternative patterns bind different names`,
      cause: py`An OR pattern whose alternatives capture different names, e.g. \`case [x] | (x, y):\`. After the match, Python couldn't know which names exist.`,
      fix: py`Make every alternative bind the same names, or split it into separate cases.`,
    },
    {
      symptom: py`TypeError: Point() accepts 0 positional sub-patterns (2 given)`,
      cause: py`A positional class pattern (\`Point(0, y)\`) on a class without \`__match_args__\`.`,
      fix: py`Use keyword sub-patterns (\`Point(x=0, y=y)\`), add \`__match_args__ = ("x", "y")\`, or make it a dataclass.`,
    },
    {
      symptom: py`SyntaxError: invalid syntax — pointing at the match line (or the first case)`,
      cause: py`The code is running on Python 3.9 or older, where \`match\` doesn't exist.`,
      fix: py`Check \`python --version\`; upgrade to 3.10+ (and set \`requires-python = ">=3.10"\`), or rewrite the logic with \`if\`/\`elif\` for old versions.`,
    },
    {
      symptom: py`A case never matches, although the data "looks right".`,
      cause: py`Common culprits: a string subject meeting a sequence pattern; a tuple subject meeting a mapping pattern; an \`int\` field arriving as \`"21"\` (a string) from JSON; a broader case higher up catching it first; or \`True\` vs \`1\` in literal patterns.`,
      fix: py`Print \`repr(subject)\` and \`type(subject)\` just before the \`match\`, then check each pattern's rule (see the table in *Internals*). Add a temporary \`case other: print("unmatched:", repr(other))\` at the end.`,
    },
  ],
  bestPractices: [
    'Use match when branches depend on the shape of data (type, length, keys, attributes); use if/elif for ranges and unrelated conditions.',
    'Order cases from most specific to most general, ending with case _.',
    'Compare against constants with dotted names (Enum members, Class.CONST), never bare names.',
    'Make case _ do something visible — log, raise or return an error — for input that should never be unrecognised.',
    'Prefer keyword class patterns (Point(x=0)) unless the class has a natural positional order and __match_args__.',
    'Keep each pattern short enough to read at a glance; move complex conditions into guards or helper functions.',
    'Use enums plus assert_never (3.11+) so a type checker catches unhandled cases.',
  ],
  useCases: [
    'Parsing text commands: match command.split(): case ["go", direction]: …',
    'Routing JSON events and webhook payloads by their "type" field.',
    'Handling messages of different classes in a queue or event system.',
    'Walking abstract syntax trees (ast nodes support positional class patterns).',
    'State machines: match (state, event): case ("idle", "start"): …',
  ],
  whenToUse: {
    use: [
      'Several inputs differ in structure: lists of different lengths, dicts with different keys, different classes.',
      'You would otherwise write isinstance + len + key checks followed by unpacking.',
      'Matching combinations of values: match (state, event).',
    ],
    avoid: [
      'Simple value → value mappings — use a dict.',
      'Numeric ranges and compound boolean logic — if/elif reads better.',
      'Code that must run on Python 3.9 or older.',
    ],
  },
  comparison: {
    title: 'match vs if/elif vs dict lookup',
    headers: ['', 'match', 'if / elif', 'dict lookup'],
    rows: [
      ['best for', 'different shapes of data', 'conditions, ranges, combinations', 'fixed key → value tables'],
      ['unpacks values', 'yes, while matching', 'no — index separately', 'no'],
      ['checks types', 'yes (class patterns)', 'with isinstance()', 'no'],
      ['how cases are found', 'tried in order', 'tried in order', 'hashing (no scan)'],
      ['available since', 'Python 3.10', 'always', 'always'],
    ],
    note: py`They mix well: a \`match\` case can call a function chosen from a dict, and a guard is just an \`if\` attached to a pattern.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'match-statement-q1',
      type: 'mcq',
      prompt: py`A \`match\` statement has no \`case _:\` and the subject matches none of its patterns. What happens?`,
      options: [
        'Nothing: no case runs and execution continues after the match statement',
        { text: 'A MatchError exception is raised', why: 'Python has no MatchError. An unmatched subject is silently ignored — add case _ if you want to handle it.' },
        { text: 'The last case runs as a default', why: 'Only a wildcard (or an irrefutable capture) acts as a default. Other cases run only when they match.' },
        { text: 'A SyntaxError is raised', why: 'SyntaxErrors happen at compile time; this is a runtime situation, and it is perfectly legal.' },
      ],
      answer: 0,
      explanation: py`\`match\` doesn't require exhaustiveness at runtime. If nothing matches, the statement simply does nothing. Type checkers can enforce exhaustiveness for enums and unions via \`assert_never\`.`,
    },
    {
      id: 'match-statement-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`expected = 200
status = 404
match status:
    case expected:
        print("as expected:", expected)`,
      answer: 'as expected: 404',
      accept: ['as expected: 404'],
      explanation: py`\`case expected:\` is a **capture pattern**: it matches anything and binds \`expected\` to the subject, 404. It never compares with the old value 200. To compare with a constant, use a dotted name or a guard: \`case s if s == expected:\`.`,
    },
    {
      id: 'match-statement-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`match [1, 2, 3, 4]:
    case [first, *middle, last]:
        print(first, middle, last)`,
      options: [
        '1 [2, 3] 4',
        { text: '1 (2, 3) 4', why: 'A starred capture always produces a list, even when the subject is a tuple.' },
        { text: '1 2 3 4', why: 'middle is one name bound to a list of the in-between items, so it prints as [2, 3].' },
        { text: 'Nothing — a star must come last', why: 'The star can be anywhere in a sequence pattern; there just can only be one.' },
      ],
      answer: 0,
      explanation: py`\`first\` takes the first item, \`last\` the last, and \`*middle\` collects everything in between as a **list**. One starred name is allowed anywhere in the pattern.`,
    },
    {
      id: 'match-statement-q4',
      type: 'bug',
      prompt: '`first_letter("hello")` returns `None` instead of `"h"`. Click the line responsible.',
      code: py`def first_letter(word):
    match word:
        case [first, *_]:
            return first
        case _:
            return None`,
      answerLine: 3,
      explanation: py`Sequence patterns never match \`str\`, \`bytes\` or \`bytearray\`, so line 3 fails for \`"hello"\` and the wildcard returns \`None\`. Use \`case str() if word:\` and \`return word[0]\`.`,
    },
    {
      id: 'match-statement-q5',
      type: 'fill',
      prompt: 'Complete the match so that "y" and "yes" print Confirmed, and anything else prints Cancelled.',
      code: py`match answer:
    case "y" ___ "yes":
        print("Confirmed")
    case ___:
        print("Cancelled")`,
      answer: [['|'], ['_']],
      explanation: py`\`|\` combines alternatives into an OR pattern; \`_\` is the wildcard that matches anything without binding a name.`,
    },
    {
      id: 'match-statement-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`event = {"type": "click", "x": 10, "y": 20, "button": "left"}
match event:
    case {"type": "click", "x": x}:
        print("click at", x)
    case {"type": "click", "x": x, "y": y}:
        print("click at", x, y)`,
      options: [
        'click at 10',
        { text: 'click at 10 20', why: 'The first case already matches — mapping patterns ignore extra keys like "y" and "button" — and only one case runs.' },
        { text: 'Nothing, because the dict has extra keys', why: 'Mapping patterns only require the listed keys; extra keys are allowed.' },
        { text: 'Both lines', why: 'match never falls through: the first matching case runs and the statement ends.' },
      ],
      answer: 0,
      explanation: py`Mapping patterns match if the listed keys are present with matching values; extra keys are ignored. The first case matches, so the more specific second case is never tried — put it first if you need it.`,
    },
    {
      id: 'match-statement-q7',
      type: 'short',
      prompt: 'Give one situation where `match` is clearly better than `if`/`elif`, and one where it is clearly worse.',
      answer: py`Better: when inputs differ in **structure** and you need their parts — e.g. text commands (\`["go", direction]\`, \`["take", *items]\`) or JSON events with different keys — because each case checks the shape and unpacks it at once. Worse: numeric ranges or unrelated boolean conditions (\`if temp > 30 and not raining\`), and simple value-to-value lookups, which are clearer as \`if\`/\`elif\` or a dict. It's also unavailable before Python 3.10.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'calculator-commands',
      title: 'Calculator commands',
      difficulty: 'intermediate',
      prompt: py`Write \`calculate(tokens)\`, where \`tokens\` is a list like \`["add", 2, 3]\`. Use a \`match\` statement:

| tokens | returns |
|---|---|
| \`["add", a, b]\` | \`a + b\` |
| \`["mul", a, b]\` | \`a * b\` |
| \`["neg", a]\` | \`-a\` |
| \`["div", a, b]\` | \`a / b\` — but \`None\` when \`b\` is 0 (use a **guard**) |
| \`["sum", n1, n2, …]\` | the sum of **any** number of values (\`0\` for \`["sum"]\`) |
| anything else | \`None\` (unknown operation, wrong number of values, not a list…) |

The \`add\` case and the final \`case _\` are written for you.`,
      files: {
        'main.py': py`def calculate(tokens):
    match tokens:
        case ["add", a, b]:
            return a + b
        # TODO: mul, neg, div (guard against 0) and sum (any number of values)
        case _:
            return None


print(calculate(["add", 2, 3]))         # 5
print(calculate(["sum", 1, 2, 3, 4]))   # 10
print(calculate(["div", 1, 0]))         # None
`,
      },
      hints: [
        'Each operation is one case with a sequence pattern. The number of names in the pattern fixes how many values it accepts: ["neg", a] only matches lists of length 2.',
        'For div, add a guard: case ["div", a, b] if b != 0: — a zero divisor fails the guard and falls through to case _, which returns None.',
        'For sum, capture the rest with a star: case ["sum", *numbers]: return sum(numbers). An empty numbers list sums to 0.',
      ],
      solution: {
        explanation: py`Each case pins down both the **operation name** (a literal) and the **number of operands** (the number of capture names), so \`["add", 1]\` or \`["neg", 1, 2]\` match nothing and reach \`case _\`. The guard on \`div\` keeps the pattern simple and moves the value check into \`if b != 0\`; when it fails, matching continues and the wildcard returns \`None\`. \`*numbers\` collects zero or more values into a list, and \`sum([])\` is \`0\`. A string like \`"add 2 3"\` returns \`None\` because sequence patterns never match strings.`,
        files: {
          'main.py': py`def calculate(tokens):
    match tokens:
        case ["add", a, b]:
            return a + b
        case ["mul", a, b]:
            return a * b
        case ["neg", a]:
            return -a
        case ["div", a, b] if b != 0:
            return a / b
        case ["sum", *numbers]:
            return sum(numbers)
        case _:
            return None


print(calculate(["add", 2, 3]))         # 5
print(calculate(["sum", 1, 2, 3, 4]))   # 10
print(calculate(["div", 1, 0]))         # None
`,
        },
      },
      tests: [
        { name: 'add and mul', code: py`assert calculate(["add", 2, 3]) == 5 and calculate(["mul", 4, 2.5]) == 10` },
        { name: 'neg takes exactly one value', code: py`assert calculate(["neg", 7]) == -7 and calculate(["neg", 1, 2]) is None` },
        { name: 'div works, but returns None for a zero divisor', code: py`assert calculate(["div", 9, 2]) == 4.5 and calculate(["div", 1, 0]) is None` },
        { name: 'sum takes any number of values', code: py`assert calculate(["sum", 1, 2, 3, 4]) == 10 and calculate(["sum"]) == 0` },
        { name: 'unknown or malformed commands return None', code: py`assert calculate(["pow", 2, 3]) is None and calculate(["add", 1]) is None and calculate("add 2 3") is None` },
      ],
    },
    {
      id: 'describe-event',
      title: 'Describe JSON events',
      difficulty: 'intermediate',
      prompt: py`An online shop sends events as dicts (decoded JSON). Write \`describe_event(event)\` with **mapping patterns**:

| event | returns |
|---|---|
| \`{"type": "login", "user": u}\` | \`"u logged in"\` |
| \`{"type": "logout", "user": u}\` | \`"u logged out"\` |
| \`{"type": "purchase", "user": u, "items": []}\` | \`"u bought nothing"\` |
| \`{"type": "purchase", "user": u, "items": [item]}\` | \`"u bought item"\` |
| \`{"type": "purchase", "user": u, "items": [first, …more]}\` | \`"u bought first and N more"\` |
| any other dict whose \`"type"\` is a **string** | \`"Unknown event type: <type>"\` |
| anything else | \`"Invalid event"\` |

Events may carry extra keys (like \`"ts"\`) — they must not matter. Example: \`{"type": "purchase", "user": "ben", "items": ["tea", "cake", "jam"]}\` → \`"ben bought tea and 2 more"\`.`,
      files: {
        'main.py': py`def describe_event(event):
    match event:
        case {"type": "login", "user": user}:
            return f"{user} logged in"
        # TODO: logout, purchase (0, 1 or more items), unknown string type
        case _:
            return "Invalid event"


print(describe_event({"type": "login", "user": "ada", "ts": 1712}))
print(describe_event({"type": "purchase", "user": "ben", "items": ["tea", "cake", "jam"]}))
`,
      },
      hints: [
        'Mapping patterns can contain sequence patterns: "items": [] matches an empty list, "items": [item] exactly one item.',
        'For "one or more", use a star: "items": [first, *rest] — and report len(rest). Put the empty and single-item cases before it.',
        'For the unknown type, use a class pattern inside the mapping: case {"type": str(kind)}: — it must come after all the specific types and before case _.',
      ],
      solution: {
        explanation: py`Each case describes one event shape. Because mapping patterns ignore extra keys, \`"ts"\` never gets in the way. The three purchase cases nest a sequence pattern inside the mapping and go from specific (\`[]\`, \`[item]\`) to general (\`[first, *rest]\`) — reversed, \`[first, *rest]\` would also swallow the single-item case. \`{"type": str(kind)}\` catches every remaining dict with a string type (a class pattern inside a mapping pattern), and must come **after** the specific types. Anything else — a dict without \`"type"\`, a non-string type, a list — falls to \`case _\`.`,
        files: {
          'main.py': py`def describe_event(event):
    match event:
        case {"type": "login", "user": user}:
            return f"{user} logged in"
        case {"type": "logout", "user": user}:
            return f"{user} logged out"
        case {"type": "purchase", "user": user, "items": []}:
            return f"{user} bought nothing"
        case {"type": "purchase", "user": user, "items": [item]}:
            return f"{user} bought {item}"
        case {"type": "purchase", "user": user, "items": [first, *rest]}:
            return f"{user} bought {first} and {len(rest)} more"
        case {"type": str(kind)}:
            return f"Unknown event type: {kind}"
        case _:
            return "Invalid event"


print(describe_event({"type": "login", "user": "ada", "ts": 1712}))
print(describe_event({"type": "purchase", "user": "ben", "items": ["tea", "cake", "jam"]}))
`,
        },
      },
      tests: [
        { name: 'login and logout (extra keys ignored)', code: py`assert describe_event({"type": "login", "user": "ada", "ts": 1}) == "ada logged in"
assert describe_event({"type": "logout", "user": "ada"}) == "ada logged out"` },
        { name: 'purchase with several items', code: py`assert describe_event({"type": "purchase", "user": "ben", "items": ["tea", "cake", "jam"]}) == "ben bought tea and 2 more"` },
        { name: 'purchase with exactly one item', code: py`assert describe_event({"type": "purchase", "user": "di", "items": ["tea"]}) == "di bought tea"` },
        { name: 'purchase with no items', code: py`assert describe_event({"type": "purchase", "user": "cy", "items": []}) == "cy bought nothing"` },
        { name: 'unknown string type', code: py`assert describe_event({"type": "refund", "amount": 5}) == "Unknown event type: refund"` },
        { name: 'invalid events', code: py`assert describe_event({"user": "x"}) == "Invalid event"
assert describe_event({"type": 5}) == "Invalid event"
assert describe_event(["login"]) == "Invalid event"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'match-statement-vs-switch',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How is Python\'s match statement different from a switch statement in C or Java?',
      answer: 'match does structural pattern matching: cases are patterns that check type, length, keys and attributes and destructure the subject into names, not just equality with constants. There is no fall-through (exactly one case runs, no break needed), guards add conditions, unmatched subjects are silently ignored, and bare names capture rather than compare.',
      explanation: py`A C \`switch\` jumps to a constant label and falls through unless you \`break\`. Python's \`match\` (3.10+) tries patterns in order — literals, captures, sequences, mappings, class patterns, OR patterns with \`|\`, guards — binding variables as it goes. It works on any object, not just integers or strings. CPython doesn't compile it to a jump table, so its value is expressiveness, not speed.`,
      whyAsked: 'It checks whether you know what makes match "structural" rather than treating it as a switch with new syntax.',
      mistakes: ['Calling it "Python\'s switch statement" without mentioning destructuring', 'Thinking it falls through like C', 'Not knowing the bare-name capture rule'],
      followUps: ['What happens when no case matches?', 'How do you compare against a constant inside a pattern?', 'When would you still use if/elif?'],
      modelAnswer: 'A C or Java switch compares one value against constant labels and falls through unless you break. Python’s match, added in 3.10, is structural pattern matching: each case is a pattern describing the shape of the data — a list of two items, a dict with certain keys, an instance of a class with certain attributes — and when it matches, it also binds the pieces to names. Exactly one case runs, there’s no fall-through, guards let me add conditions, and if nothing matches nothing happens. The big gotcha is that a bare name captures instead of comparing, so constants have to be dotted names like an enum member.',
    },
    {
      id: 'match-statement-capture-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This code fails before running with "SyntaxError: name capture \'OK\' makes remaining patterns unreachable". Explain and fix it.',
      code: { lang: 'python', code: py`OK = 200
NOT_FOUND = 404

def describe(code):
    match code:
        case OK:
            return "fine"
        case NOT_FOUND:
            return "missing"`, static: true },
      answer: 'A bare name in a pattern is a capture pattern: case OK matches any value and binds it to OK, so the following cases could never run, and Python rejects it. Use value patterns (dotted names) — e.g. an Enum or http.HTTPStatus.OK — or literals, or a guard.',
      explanation: py`PEP 634 distinguishes **capture patterns** (bare names) from **value patterns** (dotted names). The compiler detects an irrefutable capture before other cases and raises \`SyntaxError\`. If the capture were the **last** case, there'd be no error at all — it would silently match everything and overwrite the constant, which is worse.`,
      whyAsked: 'This is the most famous match pitfall; knowing the reason (capture vs value patterns) shows real understanding.',
      mistakes: ['Suggesting quotes or parentheses around the name', 'Thinking the fix is to reorder the cases', 'Not realising it would silently succeed as the last case'],
      followUps: ['Why didn\'t the language designers make bare names compare?', 'How would a guard-based fix look?', 'What does the enum version look like?'],
      modelAnswer: 'In a pattern, a bare name like OK isn’t a comparison — it’s a capture pattern that matches anything and binds the value to that name. So the first case would catch every code and the rest could never run, which is why Python refuses to compile it. To compare with a constant, the name must be dotted, which makes it a value pattern compared with equals — for example HTTPStatus.OK, or members of my own Enum. A literal like case 200 or a guard such as case c if c == OK also works. The nasty version is when the capture is the last case: then there’s no error and it silently matches everything.',
    },
    {
      id: 'match-statement-shapes',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Given the dataclasses Circle(radius), Rect(width, height) and Square(side), write `area(shape)` using class patterns. Raise TypeError for anything else.',
      answer: 'match shape: case Circle(r): return math.pi * r ** 2; case Rect(w, h): return w * h; case Square(s): return s * s; case _: raise TypeError(...). Dataclasses provide __match_args__, so positional sub-patterns work.',
      explanation: py`Each class pattern performs an \`isinstance\` check and pulls out attributes in the order given by \`__match_args__\`, which \`@dataclass\` generates from the field order. The final \`case _\` turns unsupported input into a clear error instead of silently returning \`None\`. A polymorphic alternative is an \`area()\` method on each class — match is preferable when the classes are plain data you don't control or don't want to couple to this operation.`,
      starter: { files: { 'main.py': py`import math
from dataclasses import dataclass


@dataclass
class Circle:
    radius: float


@dataclass
class Rect:
    width: float
    height: float


@dataclass
class Square:
    side: float


def area(shape):
    # TODO: one case per shape; raise TypeError for anything else
    return 0


print(area(Rect(2, 3)))   # 6
` } },
      tests: [
        { name: 'circle of radius 1 → pi', code: py`assert area(Circle(1)) == approx(math.pi)` },
        { name: 'rectangle 2 × 3 → 6', code: py`assert area(Rect(2, 3)) == 6` },
        { name: 'square of side 4 → 16', code: py`assert area(Square(4)) == 16` },
        { name: 'anything else raises TypeError', code: py`with raises(TypeError):
    area("triangle")` },
      ],
      solution: { files: { 'main.py': py`import math
from dataclasses import dataclass


@dataclass
class Circle:
    radius: float


@dataclass
class Rect:
    width: float
    height: float


@dataclass
class Square:
    side: float


def area(shape):
    match shape:
        case Circle(r):
            return math.pi * r ** 2
        case Rect(w, h):
            return w * h
        case Square(s):
            return s * s
        case _:
            raise TypeError(f"not a shape: {shape!r}")


print(area(Rect(2, 3)))   # 6
` } },
      hints: ['Positional class patterns like Circle(r) work because dataclasses define __match_args__.', 'End with case _: raise TypeError(...).'],
      whyAsked: 'It tests class patterns, __match_args__ and sensible handling of unexpected input — and opens a design discussion about match vs polymorphism.',
      mistakes: ['Writing case Circle: (a capture named Circle!) instead of case Circle(...)', 'Returning None for unknown shapes instead of raising', 'Using isinstance chains without unpacking'],
      followUps: ['When would you put area() as a method on each class instead?', 'How would a type checker verify every shape is handled?', 'What if Square were a subclass of Rect — does case order matter?'],
      modelAnswer: 'I match on the shape with one class pattern per type: Circle(r) returns pi r squared, Rect(w, h) returns w times h, and Square(s) returns s squared. Positional sub-patterns work because @dataclass generates __match_args__ from the field order; with keywords — Circle(radius=r) — it would work for any class. The final case _ raises TypeError, so bad input fails loudly instead of returning None. If Square inherited from Rect, I’d put the Square case first, since a Square would also match the Rect pattern. And if these were my own domain classes, I’d also consider an area method on each class instead — match fits best when the classes are plain data.',
    },
    {
      id: 'match-statement-when-to-use',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Your team just upgraded to Python 3.10+. A colleague wants to rewrite every if/elif chain as match. What guidance would you give?',
      answer: 'Use match where branches depend on the structure of data — type, length, keys, attributes — and benefit from destructuring. Keep if/elif for ranges and unrelated boolean conditions, and use dicts for value → value tables. Rewrite only where it improves readability, with tests in place.',
      explanation: py`\`match\` is not faster in CPython (cases are tried sequentially), so the only reason to use it is clarity. Rewriting \`if score >= 90\` chains gains nothing — guards would just reintroduce the conditions. Good candidates: command parsers, event routers, AST walkers, code full of \`isinstance\` + \`len\` + indexing.`,
      code: { lang: 'python', code: py`# good fit: structure + destructuring
def route(request):
    match request:
        case {"method": "GET", "path": "/items"}:
            return "list items"
        case {"method": "GET", "path": str(path)} if path.startswith("/items/"):
            return f"show item {path.removeprefix('/items/')}"
        case {"method": "POST", "path": "/items", "body": {"name": str(name)}}:
            return f"create {name}"
        case _:
            return "404"


print(route({"method": "GET", "path": "/items/42"}))   # show item 42` },
      whyAsked: 'It assesses engineering judgement: adopting new features where they help rather than everywhere.',
      mistakes: ['"match is faster"', 'Rewriting numeric range checks into match with guards', 'Ignoring library users still on Python 3.9'],
      followUps: ['What tests would you want before such a refactor?', 'How would you handle code that must support 3.9?'],
      modelAnswer: 'I’d say: use match where it removes structural boilerplate — when the branches depend on the shape of the data and we’d otherwise write isinstance checks, length checks and key checks followed by indexing. Command parsing, event routing and tree walking are great fits. For numeric ranges or unrelated boolean conditions, if/elif is clearer, and a simple lookup table should be a dict. match isn’t faster in CPython — it tests cases in order — so readability is the only goal. I’d convert opportunistically, with tests around each function, and keep match out of any library code that still supports 3.9.',
    },
    {
      id: 'match-statement-webhooks',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'You are handling payment-provider webhooks: JSON payloads with a "type" field and type-specific data. New event types appear without warning. How would you structure the handler with match?',
      answer: 'Decode the JSON, then match on mapping patterns: one case per known event type that captures the fields you need, ordered specific to general; a case for any dict with a string type that logs "unhandled type" and returns success so the provider does not retry forever; and a final case _ that rejects malformed payloads. Validate values (types, amounts) in guards or before matching, and keep each case\'s logic in a separate function.',
      explanation: py`Mapping patterns ignore extra keys, which makes them robust to providers adding fields. Capturing with class patterns (\`"amount": int(amount)\`) checks types as part of matching. Distinguishing "unknown but well-formed" from "malformed" lets you respond correctly (often 2xx for unknown types, 4xx for malformed ones). Security note: authenticate the webhook (verify its signature with \`hmac.compare_digest\`) **before** trusting any of it — pattern matching checks shape, not authenticity.`,
      code: { lang: 'python', code: py`import logging

def handle_webhook(payload):
    match payload:
        case {"type": "payment.succeeded", "data": {"id": str(pid), "amount": int(amount)}}:
            return f"mark {pid} paid ({amount})"
        case {"type": "payment.failed", "data": {"id": str(pid)}}:
            return f"notify customer about {pid}"
        case {"type": str(kind)}:
            logging.info("unhandled webhook type %s", kind)
            return "ignored"
        case _:
            return "malformed"


print(handle_webhook({"type": "payment.succeeded", "data": {"id": "p1", "amount": 1299}, "v": 2}))` },
      whyAsked: 'It combines match with real-world concerns: evolving schemas, idempotent responses, validation and security.',
      mistakes: ['Raising on unknown types, causing endless retries', 'Treating a pattern match as validation of authenticity', 'Putting all business logic inside the case bodies'],
      followUps: ['How do you verify a webhook signature?', 'How would you test each case?', 'Where would a schema library like pydantic fit in?'],
      modelAnswer: 'First I’d authenticate the webhook by verifying its signature, because a pattern only checks shape, not who sent it. Then I’d decode the JSON and match on mapping patterns: one case per event type I support, capturing just the fields I need and using class patterns like int(amount) to check their types, ordered from specific to general. A case for any dict with a string type logs it as unhandled and returns success, so the provider doesn’t keep retrying events I deliberately ignore, and a final case _ treats the payload as malformed. Each case delegates to a small handler function so it’s easy to test, and because mapping patterns ignore extra keys, new fields from the provider won’t break anything.',
    },
    {
      id: 'match-statement-literal-semantics',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why?',
      code: { lang: 'python', code: py`for value in [1, True, 1.0]:
    match value:
        case True:
            print("True")
        case 1:
            print("one")` },
      options: ['True, True, True', 'one, True, one', 'one, one, one', 'True, one, one'],
      correctOption: 1,
      answer: '`one`, `True`, `one`. The literals True, False and None are matched by identity (is), so case True only matches the True object itself; other literals use ==, and since 1.0 == 1, the float matches case 1. (True == 1 too, but True was already caught by the first case.)',
      explanation: py`PEP 634 specifies that \`None\`, \`True\` and \`False\` are compared with \`is\`, every other literal with \`==\`. That's why \`case True:\` doesn't swallow \`1\` — but \`case 1:\` *would* match \`True\` if it came first, because \`bool\` is a subclass of \`int\` and \`True == 1\`. To match "an int but not a bool", put \`case bool():\` before \`case int():\`.`,
      whyAsked: 'It probes precise knowledge of the matching rules and Python\'s numeric tower — a common source of subtle bugs when parsing JSON (true vs 1).',
      mistakes: ['Assuming all literals use ==', 'Assuming 1.0 cannot match 1', 'Forgetting that bool is a subclass of int'],
      followUps: ['What would change if the cases were swapped?', 'How would you match integers but exclude booleans?', 'How are value patterns like Color.RED compared?'],
      modelAnswer: 'It prints one, True, one. In pattern matching, the singletons None, True and False are compared by identity, so case True only matches the actual True object — 1 and 1.0 fail it. Every other literal is compared with equals, so the int 1 and the float 1.0 both match case 1, because 1.0 equals 1. If I swapped the cases, True would print "one" too, since True equals 1 and bool is a subclass of int. When I need integers but not booleans, I put a bool() class pattern before int().',
    },
    {
      id: 'match-statement-class-protocol',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Explain exactly how a class pattern like `case Point(0, y=y_value):` is evaluated, and how you would make your own class support positional sub-patterns.',
      answer: 'Python checks isinstance(subject, Point). Positional sub-patterns are mapped to attribute names via Point.__match_args__ (a tuple of strings); each attribute is fetched with getattr and matched against its sub-pattern; keyword sub-patterns name the attribute directly. Any failed isinstance, missing attribute or failed sub-pattern means no match. Define __match_args__ = ("x", "y") (dataclasses and NamedTuple generate it).',
      explanation: py`\`Point(...)\` in a pattern never calls \`Point\` — it isn't a constructor call. Too many positional sub-patterns raise \`TypeError\` (\`Point() accepts 2 positional sub-patterns (3 given)\`). Builtins such as \`int\`, \`str\` and \`tuple\` are special-cased: one positional sub-pattern matches the whole subject. Because the check is \`isinstance\`, subclasses match too, so order subclass cases before their base class. Attribute access goes through \`getattr\`, so properties run during matching — keep them cheap and side-effect free.`,
      code: { lang: 'python', code: py`class Temperature:
    __match_args__ = ("value", "unit")

    def __init__(self, value, unit):
        self.value = value
        self.unit = unit


def to_celsius(t):
    match t:
        case Temperature(v, "C"):
            return v
        case Temperature(v, "F"):
            return round((v - 32) * 5 / 9, 1)
        case Temperature(unit=unit):
            raise ValueError(f"unknown unit {unit!r}")


print(to_celsius(Temperature(212, "F")))   # 100.0` },
      whyAsked: 'It goes beyond syntax into the protocol behind the feature — the kind of depth expected for senior roles.',
      mistakes: ['Saying the pattern constructs a Point and compares with ==', 'Not knowing __match_args__', 'Forgetting that subclasses match base-class patterns'],
      followUps: ['Why might properties be risky in class patterns?', 'How do ast nodes support pattern matching?', 'What does case int(x) do differently from case Point(x)?'],
      modelAnswer: 'A class pattern is not a constructor call. Python first checks isinstance of the subject against Point, so subclasses match too. Then it turns positional sub-patterns into attribute names using Point’s __match_args__ — a tuple of strings — while keyword sub-patterns name the attribute directly. Each attribute is fetched with getattr and matched against its sub-pattern, and any missing attribute or failed sub-pattern means the case doesn’t match. To support positional patterns in my own class, I set __match_args__, or use a dataclass or NamedTuple, which generate it. Built-ins like int and str are special: a single positional sub-pattern binds the whole subject.',
    },
  ],

  takeaways: [
    'match (Python 3.10+) tries each case\'s pattern in order; the first match runs, there is no fall-through, and an unmatched subject does nothing.',
    'Patterns check shape and capture parts at once: [first, *rest], {"type": "click", "x": x}, Point(x=0, y=y).',
    'A bare name in a pattern captures and matches anything; compare with constants using dotted names (Enum members, Class.CONST) or literals.',
    'case _ is the wildcard catch-all and must come last; | combines alternatives; as names a sub-match; if adds a guard.',
    'Sequence patterns never match strings; mapping patterns ignore extra keys; None/True/False are matched with is.',
    'Class patterns use isinstance plus attributes; positional sub-patterns need __match_args__ (dataclasses provide it).',
    'Use match for structural branching; keep if/elif for ranges and conditions, and dicts for lookup tables.',
  ],
}
