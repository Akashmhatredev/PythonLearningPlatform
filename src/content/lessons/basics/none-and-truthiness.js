// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PROFILE = py`# A profile page where some details may be missing
nicknames = {"ada": "Countess", "ben": ""}   # ben chose an empty nickname

username = "cy"
nickname = nicknames.get(username)   # .get() gives None when the key is missing
followers = 0
badges = []

print("nickname:", repr(nickname))
print("nickname is None:", nickname is None)
print("followers truthy:", bool(followers), "| badges truthy:", bool(badges))

if nickname is None:
    print("No profile found for", username)
elif nickname == "":
    print(username, "chose an empty nickname")
else:
    print(username, "is also known as", nickname)

if not badges:
    print("No badges yet")

label = followers or "none"          # careful: 0 is falsy!
print("Followers (with or):", label)
`

export default {
  id: 'none-and-truthiness',
  title: 'None, truthiness & identity (is vs ==)',
  summary: 'None means "no value"; every object is either truthy or falsy in a condition; and is asks "the same object?" while == asks "equal values?" — which is why you write `x is None`.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['booleans-and-comparisons', 'variables-and-names'],
  related: ['type-conversion', 'booleans-and-comparisons', 'variables-and-names', 'if-statements', 'function-arguments', 'object-model', 'typing-collections-and-unions', 'mutability-and-copying'],
  tags: ['None', 'NoneType', 'null', 'truthiness', 'truthy', 'falsy', 'bool', 'is', 'is not', '==', 'identity', 'equality', 'id', 'singleton', 'is None', 'empty', 'sentinel', 'Optional'],
  apis: [
    { name: 'None', summary: 'The single object of type NoneType, meaning "no value" / "nothing here".' },
    { name: 'x is None / x is not None', summary: 'The idiomatic test for None: an identity check against the one None object.' },
    { name: 'a is b', summary: 'True if a and b are the very same object (identity).' },
    { name: 'a == b', summary: 'True if a and b have equal values (calls __eq__).' },
    { name: 'id(obj)', summary: 'An integer identity for an object; a is b means id(a) == id(b) while both are alive.' },
    { name: 'bool(x) / if x:', summary: 'Truth testing: None, False, zeros and empty collections are falsy; everything else is truthy.' },
    { name: 'dict.get(key)', summary: 'Returns the value, or None (or a given default) when the key is missing.' },
  ],
  docs: [
    { label: 'Built-in constants — None, True, False, Ellipsis', url: 'https://docs.python.org/3/library/constants.html' },
    { label: 'Built-in types — truth value testing', url: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing' },
    { label: 'Language reference — identity comparisons (is, is not)', url: 'https://docs.python.org/3/reference/expressions.html#is-not' },
    { label: 'Data model — objects, values and types', url: 'https://docs.python.org/3/reference/datamodel.html#objects-values-and-types' },
    { label: 'PEP 8 — programming recommendations (comparisons to None)', url: 'https://peps.python.org/pep-0008/#programming-recommendations' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Three closely related ideas finish off the basics:`,
    py`1. **\`None\`** — Python's way of saying "no value here". A missing dictionary entry, a function that doesn't return anything, an optional detail nobody filled in.
2. **Truthiness** — in a condition (\`if\`, \`while\`, \`and\`, \`or\`, \`not\`), *every* value counts as either true or false. Empty things and zeros are **falsy**; almost everything else is **truthy**. That's why \`if basket:\` means "if the basket isn't empty".
3. **Identity vs equality** — \`a == b\` asks "do these have equal values?", while \`a is b\` asks "are these the **same object**?". Two identical-looking lists can be equal without being the same list.`,
    py`Put together, they explain one of Python's most-used idioms: **\`if value is None:\`**. You'll also see when \`if value:\` is the right test — and when it quietly turns a real \`0\` into "missing".`,
    py`This builds directly on [variables as name tags](lesson:variables-and-names) (names point to objects) and on [booleans](lesson:booleans-and-comparisons) (\`and\`/\`or\` use truthiness).`,
    py`The examples use \`if\`: it runs the indented lines under it only when its condition is truthy; \`elif\` ("else if") tries another condition, and \`else\` catches everything left. Full details in [if statements](lesson:if-statements).`,
  ],
  why: [
    py`Real data is full of gaps: a user without a middle name, a sensor that didn't report, a search with no result. You need a clear way to represent "nothing" — and to tell it apart from legitimate values like \`0\`, \`""\` or \`[]\`, which *are* something.`,
    py`Truthiness makes everyday checks short and readable (\`if not errors:\`), but it's also behind classic bugs: a temperature of \`0.0\` treated as "no reading", a stock count of \`0\` replaced by a default. And mixing up \`is\` with \`==\` produces code that works on your machine and fails on someone else's. These are favourite interview topics for good reason.`,
  ],
  eli15: [
    py`**None** is an empty parking space with a sign saying "nothing here yet". It's not a car worth £0 — it's *no car at all*.`,
    py`**Truthiness** is Python asking "is there anything here?". An empty bag, the number zero, a blank name tag, and \`None\` all answer "no" (falsy). A bag with *anything* in it — even just a crumpled note saying "0" — answers "yes" (truthy).`,
    py`**is vs ==**: two copies of the same book are *equal* (same words, \`==\`) but they're not the *same* book (\`is\`) — scribble in one and the other stays clean. \`is\` asks "is this literally the same object?". There is only ever **one** \`None\` in the whole program, so you check for it with \`is None\`.`,
  ],
  analogy: {
    title: 'Car park, bags and identical books',
    body: [
      py`A car park space can be **empty** (\`None\`), or have a car in it. "Empty" and "a car worth nothing" are different facts — and confusing them is a bug.`,
      py`At airport security, a bag is "interesting" (truthy) if anything is inside. An empty bag, a zero balance and an empty space all count as "nothing" (falsy).`,
      py`And in a library, two copies of the same edition are *equal*, but only the one in your hand *is* your copy. Python has exactly one \`None\` object, so "is this the None?" is an identity question.`,
    ],
    mapping: [
      ['an empty parking space', 'None — "no value here"'],
      ['a car worth £0', '0 — a real value that happens to be zero'],
      ['an empty bag', 'a falsy value: [], "", 0, None'],
      ['a bag with anything in it', 'a truthy value: [0], "0", " "'],
      ['two copies of the same book', 'a == b is True, a is b is False'],
      ['the copy in your hand', 'one object with two names: a is b is True'],
      ['there is only one "nothing" sign', 'None is a singleton — test it with is'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Equal values vs the same object',
    props: {
      code: py`team = ["Ada", "Ben"]
same_team = team            # a second name for the same list
copy_team = ["Ada", "Ben"]  # an equal, but separate, list
print(team == copy_team)    # equal values?
print(team is copy_team)    # the same object?
print(team is same_team)

result = print("hi")        # print() returns None
print(result is None)
`,
      inline: false,
      notes: {
        2: 'No new list: `same_team` is another **arrow to the same object**.',
        3: 'A second list is built. Same contents, **different object** — look for a second list box.',
        4: '`==` compares contents: both lists hold "Ada" and "Ben" → `True`.',
        5: '`is` compares identity: two separate list objects → `False`.',
        6: 'Both names point at one list → `True`.',
        8: '`print` shows "hi" and then **returns None**. `result` now points at the one-and-only None object.',
        9: 'The idiomatic check for "no value": `result is None` → `True`.',
      },
    },
    alt: 'A step-by-step trace with objects drawn separately. team and same_team both point to one list containing "Ada" and "Ben". copy_team points to a second, separate list with the same contents. The program prints True for team == copy_team, False for team is copy_team and True for team is same_team. Then result = print("hi") prints hi and binds result to None, and result is None prints True.',
    caption: py`Count the list boxes: there are **two**. \`==\` looks inside them; \`is\` only asks whether two arrows land on the same box.`,
  },
  syntax: [
    py`#### None`,
    { code: py`middle_name = None                 # "no value yet"
print(middle_name)                 # None
print(type(middle_name))           # <class 'NoneType'>

ages = {"ada": 36}
print(ages.get("ben"))             # None — the key is missing

def greet():
    print("hi")                    # no return statement...

print(greet())                     # ...so the call returns None (after printing hi)`, lang: 'python', title: 'where None comes from' },
    py`\`None\` comes from: functions without \`return\` (including \`print()\`), methods that change an object *in place* (\`list.sort()\`, \`list.append()\`), \`dict.get()\` on a missing key, and your own code when something is optional. It's a keyword with a capital N — \`none\` and \`null\` are just undefined names.`,
    py`#### Testing for None`,
    { code: py`nickname = None

if nickname is None:
    print("No nickname set")

if nickname is not None:           # reads like English; preferred over: not nickname is None
    print("Nickname:", nickname)`, lang: 'python', title: 'is None / is not None' },
    py`PEP 8: *"Comparisons to singletons like None should always be done with \`is\` or \`is not\`, never the equality operators."* (A **singleton** is a type with exactly one object.)`,
    py`#### Truthiness`,
    py`| falsy (count as false) | truthy (count as true) |
|---|---|
| \`None\`, \`False\` | \`True\` |
| \`0\`, \`0.0\`, \`0j\`, \`Decimal(0)\`, \`Fraction(0)\` | any non-zero number, including \`-1\` and \`0.001\` |
| \`""\` (empty string) | \`"0"\`, \`"False"\`, \`" "\` — any non-empty string |
| \`[]\`, \`()\`, \`{}\`, \`set()\`, \`range(0)\` | \`[0]\`, \`[None]\`, \`{"a": None}\` — any non-empty collection |
| objects whose \`__bool__\` returns False or whose \`__len__\` returns 0 | every other object, by default |`,
    { code: py`basket = []
if basket:                  # "if the basket has anything in it"
    print("Checking out", len(basket), "items")
else:
    print("Your basket is empty")

name = "   "
if name.strip():            # strip spaces first: "   " itself is truthy!
    print("Hello", name)`, lang: 'python', title: 'idiomatic truthiness checks' },
    py`#### is vs ==`,
    { code: py`a = [1, 2]
b = [1, 2]
c = a

print(a == b)    # True  — equal values
print(a is b)    # False — two different list objects
print(a is c)    # True  — one object, two names
print(id(a) == id(c))   # True — "is" compares identities`, lang: 'python', title: 'identity vs equality' },
    py`**Use \`==\` for values** (numbers, strings, lists…). **Use \`is\` only for identity**: \`None\`, the other singletons (\`True\`, \`False\`, \`...\`), sentinel objects you created yourself, and enum members. Python even warns about the most common misuse: \`x is 5\` → \`SyntaxWarning: "is" with 'int' literal. Did you mean "=="?\``,
    { callout: 'note', title: 'CPython detail', text: py`In CPython, some equal values *happen* to be the same object: small ints from -5 to 256 are cached, some strings are "interned", and the empty tuple is shared, so \`() is ()\` is \`True\`. That's an optimisation, not a promise — other implementations and other versions differ. Never use \`is\` to compare numbers or strings.` },
  ],
  walkthrough: {
    title: 'Reading the profile page line by line',
    lang: 'python',
    code: PROFILE,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2], text: py`A *dictionary* (\`{key: value}\`) mapping usernames to nicknames — see [dictionaries](lesson:dictionaries). Note that \`ben\` has a nickname, it's just the empty string.` },
      { lines: [5], text: py`\`.get(username)\` looks the key up and returns \`None\` if it isn't there — instead of crashing with \`KeyError\` like \`nicknames[username]\` would. \`"cy"\` isn't in the dictionary, so \`nickname\` is \`None\`.` },
      { lines: [9, 11], text: py`\`repr(None)\` is \`None\`; \`nickname is None\` is \`True\`; and \`bool()\` reveals that \`0\` and \`[]\` are both falsy.` },
      { lines: [13, 18], text: py`Three different situations, three branches. **Order matters**: \`None\` is checked first with \`is\`, so the empty-string case can be told apart. A lazy \`if not nickname:\` would lump "no profile" and "empty nickname" together.` },
      { lines: [20, 21], text: py`\`if not badges:\` is the idiomatic "if the list is empty" — clearer than \`if len(badges) == 0:\`.` },
      { lines: [23, 24], text: py`The trap: \`followers or "none"\` replaces **every** falsy value, so a real count of \`0\` displays as "none". You'll fix this in an experiment.` },
    ],
  },
  playground: {
    title: 'Profile page',
    objective: 'Run it, then try different users, give out a badge, and fix the "0 followers" bug with an explicit None check.',
    files: { 'main.py': PROFILE },
    expected: py`\`\`\`text
nickname: None
nickname is None: True
followers truthy: False | badges truthy: False
No profile found for cy
No badges yet
Followers (with or): none
\`\`\`

The last line is wrong: the user has **0** followers, which is a real number, not "none".`,
    experiments: [
      {
        id: 'other-users',
        task: py`Set \`username\` to \`"ada"\` and run; then set it to \`"ben"\` and run again. Leave it on \`"ben"\`.`,
        hint: py`Line 4 holds the username.`,
        tests: [{ name: 'ben chose an empty nickname', code: py`assert 'ben chose an empty nickname' in output, 'Set username = "ben"'` }],
        explain: py`For \`"ada"\`, \`nickname\` is \`"Countess"\` (truthy) → the \`else\` branch. For \`"ben"\`, it's \`""\`: not \`None\` (the profile exists) but empty → the \`elif\`. Three states — missing, empty, present — need three checks, and \`is None\` is what separates "missing" from "empty".`,
      },
      {
        id: 'earn-a-badge',
        task: py`Give the user a badge: set \`badges = ["early bird"]\`. Then add an \`else:\` to the \`if not badges:\` block that prints \`Badges:\` followed by the list.`,
        hint: py`\`\`\`python
if not badges:
    print("No badges yet")
else:
    print("Badges:", badges)
\`\`\``,
        tests: [
          { name: 'the badge list is not empty', code: py`assert badges, 'Put at least one badge in the list'` },
          { name: 'prints the badges', code: py`assert 'Badges:' in output and 'No badges yet' not in output` },
        ],
        explain: py`A list with one item is truthy, so \`not badges\` is \`False\` and the \`else\` runs. Even \`[""]\` or \`[None]\` would be truthy — truthiness of a collection depends on its *length*, not on what's inside.`,
      },
      {
        id: 'fix-the-or',
        task: py`Fix line 23 so a real \`0\` is shown as \`0\`, while a missing value (\`None\`) is still shown as \`"none"\`. Keep the variable name \`label\`.`,
        hint: py`Use a conditional expression with an explicit check: \`label = followers if followers is not None else "none"\`.`,
        tests: [
          { name: '0 followers shows 0', code: py`env = {}
capture(exec, files['main.py'], env)
assert env['label'] == 0 and env['label'] is not False, 'A count of 0 is a real value — show it'` },
          { name: 'None still shows "none"', code: py`env = {}
capture(exec, files['main.py'].replace('followers = 0', 'followers = None'), env)
assert env['label'] == "none"` },
        ],
        explain: py`\`x or default\` treats \`0\`, \`0.0\`, \`""\`, \`[]\` and \`False\` exactly like \`None\`. When those are legitimate values, test for \`None\` explicitly. \`value if condition else other\` is a *conditional expression*: it picks one of two values in a single line.`,
      },
      {
        id: 'is-vs-eq',
        task: py`At the end, add \`a = [1, 2]\`, \`b = [1, 2]\` and \`print(a == b, a is b)\`. Predict the output first.`,
        hint: py`Two list *literals* always build two separate list objects.`,
        tests: [{ name: 'prints True False', code: py`assert 'True False' in output` }],
        explain: py`Equal contents (\`==\` → \`True\`), different objects (\`is\` → \`False\`). Add \`c = a\` and \`print(a is c)\` to see \`True\`: assignment never copies — see [mutability & copying](lesson:mutability-and-copying).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Truthy or falsy? How Python decides',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'value', label: 'Any value', note: 'in if, while, and, or, not', x: 110, y: 160, tone: 'yellow' },
        { id: 'ask', label: 'Ask the object', note: 'bool(value)', x: 360, y: 160, tone: 'ink' },
        { id: 'falsy', label: 'Falsy', note: 'None, False, zeros, empties', x: 640, y: 70, tone: 'red' },
        { id: 'truthy', label: 'Truthy', note: 'everything else', x: 640, y: 250, tone: 'blue' },
      ],
      edges: [
        { from: 'value', to: 'ask', label: 'bool()' },
        { from: 'ask', to: 'falsy', label: 'empty or zero' },
        { from: 'ask', to: 'truthy', label: 'anything else' },
      ],
      steps: [
        { focus: ['value'], text: py`Whenever Python needs a yes/no answer — \`if\`, \`while\`, \`and\`, \`or\`, \`not\` — and you give it something that isn't a bool, it asks that value: *"do you count as true?"*.` },
        { focus: ['ask'], edges: ['value->ask'], text: py`The question is \`bool(value)\`. The rule is a **language guarantee**: an object is truthy unless its class says otherwise — via a \`__bool__\` method returning \`False\`, or a \`__len__\` returning \`0\`.` },
        { focus: ['falsy'], edges: ['ask->falsy'], text: py`Built-in **falsy** values: \`None\` and \`False\`; zero of any number type (\`0\`, \`0.0\`, \`0j\`, \`Decimal(0)\`); and every empty collection (\`""\`, \`[]\`, \`()\`, \`{}\`, \`set()\`, \`range(0)\`).` },
        { focus: ['truthy'], edges: ['ask->truthy'], text: py`**Everything else is truthy** — including surprises like \`"0"\`, \`"False"\`, \`" "\` (a space), \`[0]\`, \`[None]\` and \`-1\`. A collection's truthiness depends on its length, never on its contents.` },
        { focus: ['falsy', 'truthy'], text: py`In practice: "empty means false". \`if basket:\` reads as "if the basket has something in it". But when \`0\` or \`""\` is a *valid* value, truthiness can't tell it from \`None\` — use \`is None\` instead.` },
      ],
    },
    alt: 'Diagram: any value used in a condition is passed to bool(). Empty or zero values, None and False go to the Falsy box; anything else goes to the Truthy box.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`None\` is a real object — not "nothing at all". It has a type (\`NoneType\`), you can store it in variables and lists, and print it. There is exactly **one** \`None\` object in a running program; every \`None\` you ever see is that same object. That's why \`x is None\` is a reliable test.`,
      py`\`if value:\` doesn't convert \`value\` permanently — it just asks the question for that one decision. The value itself is unchanged.`,
    ],
    technical: [
      py`**Truth testing protocol:** \`bool(x)\` calls \`type(x).__bool__(x)\` if it exists (it must return a bool); otherwise it calls \`__len__\` and treats \`0\` as false; if neither exists, the object is truthy. That's why your own container classes become "falsy when empty" just by defining \`__len__\` — see [special methods](lesson:special-methods).`,
      py`**Identity vs equality:** \`a is b\` compares object identity and can't be customised by a class. \`a == b\` calls \`a.__eq__(b)\`, which a class *can* define however it likes — even "equal to everything". For objects that don't define \`__eq__\`, \`==\` falls back to identity.`,
      { code: py`class Wildcard:
    def __eq__(self, other):
        return True          # claims to equal everything

card = Wildcard()
print(card == None)          # True  — == can be fooled
print(card is None)          # False — identity can't`, lang: 'python', title: 'why "is None" is more reliable than "== None"' },
      py`**Guaranteed singletons:** \`None\`, \`True\`, \`False\`, \`Ellipsis\` (\`...\`) and \`NotImplemented\` each exist exactly once, by language definition. Enum members are also unique objects, so \`colour is Colour.RED\` is fine.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, \`is\` is a single pointer comparison, and \`id(obj)\` is the object's memory address. Caching of small ints and interning of some strings mean \`is\` *sometimes* returns \`True\` for equal immutable values — but it depends on the implementation, version and even how the code was compiled. The small-int cache is covered in [variables](lesson:variables-and-names); the full object model in [everything is an object](lesson:object-model).` },
    ],
    production: [
      py`- **Optional values in type hints:** \`def find_user(user_id: int) -> User | None:\` (the \`X | None\` syntax is 3.10+; older code writes \`Optional[User]\`). Type checkers then force callers to handle the \`None\` case — see [unions & Optional](lesson:typing-collections-and-unions).
- **The None-default idiom** for function parameters: \`def add_tag(tag, tags=None): if tags is None: tags = []\` — avoids the shared mutable default trap explained in [function arguments](lesson:function-arguments).
- **Sentinels:** when \`None\` itself is a valid value (e.g. JSON \`null\`), create a unique marker: \`_MISSING = object()\` and test \`value is _MISSING\`.
- **Data boundaries:** JSON \`null\` and SQL \`NULL\` both become \`None\` in Python. Distinguish "key missing" from "key present with null" with \`"key" in data\`, not \`data.get("key")\`.
- **Linters enforce the idioms:** pycodestyle/Ruff rule E711 flags \`== None\` ("comparison to None should be 'if cond is None:'"), and E712 flags \`== True\`.`,
    ],
  },
  mistakes: [
    {
      title: 'Using truthiness when 0 or "" is a valid value',
      wrong: { code: py`temperature = 0.0          # a real reading: freezing point
if not temperature:
    print("Sensor offline!")   # wrong — the sensor works fine`, lang: 'python' },
      right: { code: py`temperature = 0.0
if temperature is None:
    print("Sensor offline!")
else:
    print("Reading:", temperature)`, lang: 'python' },
      explanation: py`\`not temperature\` is true for \`None\` **and** for \`0.0\`. When zero is meaningful, test for \`None\` explicitly.`,
    },
    {
      title: 'Assigning the result of an in-place method',
      wrong: { code: py`scores = [70, 95, 82]
scores = scores.sort()      # sort() works in place and returns None
print(scores)               # None — the list is gone!`, lang: 'python' },
      right: { code: py`scores = [70, 95, 82]
scores.sort()               # sorts the list itself
ranking = sorted(scores)    # or: sorted() returns a NEW list
print(scores, ranking)`, lang: 'python' },
      explanation: py`Methods that change an object in place (\`list.sort\`, \`list.append\`, \`list.reverse\`, \`dict.update\`) return \`None\` by design, to remind you nothing new was created. The bug shows up later as \`TypeError: 'NoneType' object is not subscriptable\` or \`AttributeError: 'NoneType' object has no attribute …\`.`,
    },
    {
      title: 'Comparing to None with ==',
      wrong: { code: py`result = None
if result == None:
    print("nothing yet")`, lang: 'python' },
      right: { code: py`result = None
if result is None:
    print("nothing yet")`, lang: 'python' },
      explanation: py`\`== None\` usually works, but it calls \`__eq__\`, which some objects override (NumPy arrays compare element-wise; a class could claim to equal anything). \`is None\` is unambiguous, conventional (PEP 8) and flagged by linters when missing.`,
    },
    {
      title: 'Using is to compare values',
      wrong: { code: py`answer = input("Type yes: ")
if answer is "yes":          # SyntaxWarning: "is" with 'str' literal
    print("Confirmed")`, lang: 'python', static: true },
      right: { code: py`answer = input("Type yes: ")
if answer == "yes":
    print("Confirmed")`, lang: 'python', static: true },
      explanation: py`\`is\` asks whether two names point to the same object. A string typed by the user is a different object from the literal \`"yes"\`, even when the text matches, so this may be \`False\`. Compare values with \`==\`.`,
    },
    {
      title: 'Forgetting to return',
      wrong: { code: py`def total_price(prices):
    total = sum(prices)        # computed... and forgotten

amount = total_price([2.5, 4.0])
print(amount * 1.2)            # TypeError: unsupported operand type(s) for *: 'NoneType' and 'float'`, lang: 'python', static: true },
      right: { code: py`def total_price(prices):
    return sum(prices)

amount = total_price([2.5, 4.0])
print(amount * 1.2)`, lang: 'python' },
      explanation: py`A function that reaches its end without \`return\` returns \`None\`. The error appears where the \`None\` is *used*, not where it was produced — read the traceback and trace the value back.`,
    },
    {
      title: 'Treating a string of spaces as empty',
      wrong: { code: py`name = "   "
if name:
    print("Hello,", name)      # runs — a string of spaces is truthy`, lang: 'python' },
      right: { code: py`name = "   "
if name.strip():
    print("Hello,", name)
else:
    print("Please enter a name")`, lang: 'python' },
      explanation: py`Only \`""\` is falsy. Strip whitespace before checking user input for "emptiness".`,
    },
  ],
  debugging: [
    {
      symptom: py`AttributeError: 'NoneType' object has no attribute 'upper'`,
      cause: py`A variable you expected to hold a string (or list, or object) holds \`None\` — usually from a function without \`return\`, an in-place method's result, or \`dict.get()\` on a missing key.`,
      fix: py`Find where the variable was assigned (read the traceback upward), print \`repr(value)\` there, and either return a real value or handle the \`None\` case with \`if value is None:\`.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not subscriptable`,
      cause: py`Indexing \`None\` — classically \`result = items.sort()\` followed by \`result[0]\`.`,
      fix: py`Use \`sorted(items)\` for a new list, or call \`items.sort()\` on its own line and keep using \`items\`.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'NoneType' and 'int'`,
      cause: py`Arithmetic on \`None\` — a missing value or a forgotten \`return\`.`,
      fix: py`Decide what "missing" should mean (a default, a skip, an error) and handle it explicitly before the arithmetic.`,
    },
    {
      symptom: py`SyntaxWarning: "is" with 'int' literal. Did you mean "=="?`,
      cause: py`Using \`is\` to compare with a number or string literal.`,
      fix: py`Use \`==\`. Reserve \`is\` for \`None\`, \`True\`/\`False\` and sentinel objects.`,
    },
    {
      symptom: py`A valid 0 (or empty string) is treated as "missing".`,
      cause: py`A truthiness check (\`if not value:\`, \`value or default\`) can't tell \`0\`/\`""\` from \`None\`.`,
      fix: py`Test \`if value is None:\` or use \`value if value is not None else default\`.`,
    },
  ],
  bestPractices: [
    'Test for None with is None / is not None, never == None.',
    'Use if items: / if not items: for "non-empty" / "empty" checks on collections and strings.',
    'When 0, 0.0, "" or [] are valid values, check is None explicitly instead of relying on truthiness.',
    'Use == for comparing values; use is only for singletons (None, True, False), sentinels and enum members.',
    'Make functions return a value on every path, or document that they return None.',
    'Remember that in-place methods (sort, append, update) return None — don’t assign their result.',
    'Strip user input before checking whether it is empty.',
  ],
  useCases: [
    'Representing optional data: a middle name, a missing sensor reading, a user not found.',
    'Function defaults that mean "not provided": def connect(timeout=None).',
    'Readable emptiness checks: if not errors: print("All good").',
    'Guard clauses: if user is None: return.',
    'Sentinel objects to distinguish "not passed" from "passed None".',
  ],
  whenToUse: {
    use: [
      'if value is None: when you need to know whether a value is missing',
      'if items: when any non-empty collection means "go ahead"',
      'value or default when every falsy value genuinely means "use the default" (e.g. an empty display name)',
      'a is b to check that two names refer to the very same object',
    ],
    avoid: [
      'if value: when 0, 0.0, False or "" are valid data',
      'value == None or value == True — use is None / plain truthiness',
      'is to compare numbers, strings or other values',
      'len(items) == 0 when not items says the same thing more clearly',
    ],
  },
  comparison: {
    title: 'Three different questions',
    headers: ['', 'if x:', 'if x is not None:', 'if x == y:'],
    rows: [
      ['asks', 'is x truthy (non-empty, non-zero)?', 'is x anything other than None?', 'do x and y have equal values?'],
      ['x = None', 'False', 'False', 'depends on y'],
      ['x = 0', 'False', 'True', 'True if y is 0 or 0.0'],
      ['x = ""', 'False', 'True', 'True if y is ""'],
      ['x = [0]', 'True', 'True', 'compares element by element'],
      ['can a class change the answer?', 'yes (__bool__ / __len__)', 'no', 'yes (__eq__)'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'none-and-truthiness-q1',
      type: 'mcq',
      prompt: 'Which of these values are **falsy**? Select all that apply.',
      options: [
        '`0`',
        { text: '`"0"`', why: 'It is a non-empty string (one character), so it is truthy — bool() doesn’t read the text.' },
        '`""`',
        { text: '`" "`', why: 'A string containing a space isn’t empty, so it is truthy. Strip it first if spaces should count as empty.' },
        '`[]`',
        { text: '`[0]`', why: 'A list with one item is non-empty, so it is truthy — even though the item itself is falsy.' },
        '`None`',
      ],
      answer: [0, 2, 4, 6],
      explanation: py`Falsy: \`None\`, \`False\`, zeros (\`0\`, \`0.0\`) and empty collections (\`""\`, \`[]\`, \`{}\`…). Everything else is truthy — including \`"0"\`, \`" "\` and \`[0]\`.`,
    },
    {
      id: 'none-and-truthiness-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`a = [1, 2]
b = [1, 2]
c = a
print(a == b, a is b, a is c)`,
      answer: 'True False True',
      accept: ['True False True'],
      explanation: py`\`a\` and \`b\` are two separate lists with equal contents: \`==\` is \`True\`, \`is\` is \`False\`. \`c = a\` makes a second name for the same list, so \`a is c\` is \`True\`.`,
    },
    {
      id: 'none-and-truthiness-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`items = [3, 1, 2]
result = items.sort()
print(result, items)`,
      options: [
        { text: '`[1, 2, 3] [1, 2, 3]`', why: 'list.sort() sorts in place and returns None — it doesn’t return the list.' },
        '`None [1, 2, 3]`',
        { text: '`[1, 2, 3] [3, 1, 2]`', why: 'That’s what sorted(items) would do: return a new list and leave items unchanged.' },
        { text: '`None [3, 1, 2]`', why: 'sort() did change items — in place. It just returns None.' },
      ],
      answer: 1,
      explanation: py`\`list.sort()\` changes the list itself and returns \`None\`. Use \`sorted(items)\` when you want a new sorted list.`,
    },
    {
      id: 'none-and-truthiness-q4',
      type: 'bug',
      prompt: 'This should print "Missing!" only when there is **no** reading (None). But a sensor that measured exactly 0.0 is reported as missing. Click the buggy line.',
      code: py`reading = 0.0          # the sensor measured exactly zero
if not reading:
    print("Missing!")
else:
    print("Reading:", reading)`,
      answerLine: 2,
      explanation: py`\`not reading\` is \`True\` for \`None\` *and* for \`0.0\`, because both are falsy. Test the thing you mean: \`if reading is None:\`.`,
    },
    {
      id: 'none-and-truthiness-q5',
      type: 'fill',
      prompt: 'Complete the idiomatic None checks.',
      code: py`if nickname ___ None:
    print("No nickname")
if bio ___ ___ None:
    print("Bio:", bio)`,
      answer: [['is'], ['is'], ['not']],
      explanation: py`\`is None\` and \`is not None\` are the PEP 8 way to test for \`None\`. \`is not\` is one operator — clearer than \`not bio is None\`.`,
    },
    {
      id: 'none-and-truthiness-q6',
      type: 'mcq',
      prompt: 'Why is `x is None` preferred over `x == None`?',
      options: [
        { text: '`== None` is a SyntaxError', why: 'It is valid Python and often works — that’s what makes it a style and reliability issue rather than an error.' },
        'There is exactly one None object, so identity is the precise test — and `==` calls `__eq__`, which an object can override',
        { text: '`is` converts x to a bool first', why: 'is never converts anything; it compares object identity.' },
        { text: 'They are identical; it’s purely a matter of taste', why: 'They can differ: a class or library (e.g. NumPy) can make == None return something other than a plain False.' },
      ],
      answer: 1,
      explanation: py`\`None\` is a singleton, so "is this the None object?" is exactly an identity question. \`==\` asks the object, and objects can answer however they like. PEP 8 and linters (rule E711) require \`is None\`.`,
    },
    {
      id: 'none-and-truthiness-q7',
      type: 'short',
      prompt: 'In your own words: what is the difference between `is` and `==`? Give an example where they disagree.',
      answer: py`\`==\` compares values (it asks the objects whether they're equal); \`is\` compares identity (whether both names point to the very same object). Example: \`a = [1, 2]; b = [1, 2]\` — \`a == b\` is True (same contents), \`a is b\` is False (two separate lists). Use \`==\` for values and \`is\` for singletons such as None.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'describe-value',
      title: 'Missing, empty or present?',
      difficulty: 'beginner',
      prompt: py`Complete \`describe(value)\` so it **returns**:

- \`"missing"\` if \`value\` is \`None\`;
- \`"empty"\` for any other falsy value (\`0\`, \`""\`, \`[]\`, \`False\`, \`0.0\`…);
- \`"has value"\` for anything truthy.

For example \`describe(None)\` → \`"missing"\`, \`describe(0)\` → \`"empty"\`, \`describe("0")\` → \`"has value"\`.`,
      files: {
        'main.py': py`def describe(value):
    # TODO: return "missing", "empty" or "has value"
    return "has value"


print(describe(None), describe(0), describe("0"))
`,
      },
      hints: [
        'Three outcomes means up to three branches: if … return …, then another if … return …, then a final return.',
        'Check for None FIRST, using is None — None is also falsy, so a truthiness check first would label it "empty".',
        'if value is None:\n    return "missing"\nif not value:\n    return "empty"\nreturn "has value"',
      ],
      solution: {
        explanation: py`Order matters. \`None\` is falsy too, so the \`is None\` test must come first; otherwise \`None\` would be reported as "empty". After that, \`not value\` is \`True\` for every remaining falsy value — zeros, empty strings and empty collections. Anything left is truthy, including tricky ones like \`"0"\`, \`" "\` and \`[None]\`. Each \`return\` ends the function immediately, so no \`else\` is needed.`,
        files: {
          'main.py': py`def describe(value):
    if value is None:
        return "missing"
    if not value:
        return "empty"
    return "has value"


print(describe(None), describe(0), describe("0"))
`,
        },
      },
      tests: [
        { name: 'None is missing', code: py`assert describe(None) == "missing"` },
        { name: 'falsy values are empty', code: py`for v in [0, 0.0, "", [], {}, False]:
    assert describe(v) == "empty", f'describe({v!r}) should be "empty"'` },
        { name: 'truthy values have a value', code: py`for v in ["0", " ", [None], -1, [0], "False"]:
    assert describe(v) == "has value", f'describe({v!r}) should be "has value"'` },
        { name: 'prints missing empty has value', code: py`assert output.strip() == "missing empty has value"` },
      ],
    },
    {
      id: 'sorted-ranking',
      title: 'Ranking without losing the original',
      difficulty: 'beginner',
      prompt: py`A teacher wants a **ranking** of scores from highest to lowest, but must keep \`scores\` in the original (sign-up) order.

The current code prints \`Ranking: None\`. Fix it so it prints exactly:

\`\`\`text
Ranking: [95, 82, 70]
Original order kept: [70, 95, 82]
\`\`\`

\`ranking\` must be a **new** list; \`scores\` must not change.`,
      files: {
        'main.py': py`scores = [70, 95, 82]

ranking = scores.sort(reverse=True)

print("Ranking:", ranking)
print("Original order kept:", scores)
`,
      },
      hints: [
        'Why is ranking None? What does list.sort() return?',
        'list.sort() changes the list in place and returns None. You need a function that returns a NEW sorted list instead.',
        'ranking = sorted(scores, reverse=True)',
      ],
      solution: {
        explanation: py`\`scores.sort(reverse=True)\` sorts \`scores\` **in place** and returns \`None\` — so the starter both lost the original order and stored \`None\` in \`ranking\`. The built-in \`sorted()\` returns a brand-new list and leaves its input alone. Python's convention: methods that mutate an object return \`None\`, so you can't accidentally mistake them for functions that produce something new.`,
        files: {
          'main.py': py`scores = [70, 95, 82]

ranking = sorted(scores, reverse=True)

print("Ranking:", ranking)
print("Original order kept:", scores)
`,
        },
      },
      tests: [
        { name: 'ranking is highest first', code: py`assert ranking == [95, 82, 70]` },
        { name: 'scores keeps its original order', code: py`assert scores == [70, 95, 82]` },
        { name: 'ranking is a separate list', code: py`assert ranking is not scores` },
        { name: 'prints both lines', code: py`assert output == "Ranking: [95, 82, 70]\nOriginal order kept: [70, 95, 82]\n"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'none-and-truthiness-what-is-none',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is `None` in Python, and where does it typically come from?',
      answer: 'None is the single instance of NoneType, representing the absence of a value. It is returned by functions that don’t return anything (including print and in-place methods like list.sort), by dict.get for a missing key, and used for optional values and "not provided" defaults. Test it with is None.',
      explanation: py`It's a real object, so it can be stored, passed and printed. It's falsy, but so are \`0\` and \`""\` — which is why \`is None\` is used when the distinction matters. JSON \`null\` and SQL \`NULL\` map to it.`,
      whyAsked: 'Basic but revealing: weak answers say "None is like 0" or "an empty string".',
      mistakes: ['Saying None equals 0 or ""', 'Testing with == None', 'Not knowing that functions without return give None'],
      followUps: ['Why do list.sort() and list.append() return None?', 'How would you distinguish "missing" from "None" as a value?', 'How do you annotate an optional return type?'],
      modelAnswer: 'None is Python’s object for "no value" — the single instance of NoneType. I see it whenever a function finishes without a return statement, from in-place methods like list.sort that deliberately return None, from dict.get when a key is missing, and as the conventional default for optional parameters. It’s falsy, but it isn’t the same as 0 or an empty string, so when that difference matters I test it explicitly with is None, which is also what PEP 8 recommends.',
    },
    {
      id: 'none-and-truthiness-is-vs-eq',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Explain the difference between `is` and `==`. When is each correct?',
      answer: '== tests value equality by calling __eq__, which classes can customise. is tests identity — whether both operands are the same object — and cannot be overridden. Use == for values; use is for singletons (None, True, False, Ellipsis), sentinel objects, enum members, or when you genuinely need to know two names share one object.',
      explanation: py`Using \`is\` for numbers or strings appears to work in CPython for small ints and some interned strings, then breaks for other values or on other implementations; CPython emits \`SyntaxWarning: "is" with 'int' literal\` for the obvious cases. Using \`==\` for None works in most cases but can be fooled by custom \`__eq__\` and is flagged by linters.`,
      code: { lang: 'python', code: py`a = [1, 2]
b = [1, 2]
print(a == b, a is b)    # True False
print(None is None)      # True — there is only one None` },
      whyAsked: 'A classic Python interview question that checks understanding of the object model.',
      mistakes: ['Saying is is "stricter equality"', 'Using is for strings because it "worked in testing"', 'Not mentioning that == can be overridden'],
      followUps: ['Why does `a = 256; b = 256; a is b` give True in CPython?', 'What does id() return?', 'When might two equal immutable objects be the same object?'],
      modelAnswer: 'Equality, with ==, asks whether two objects have the same value; Python calls __eq__, so each class decides what equal means. Identity, with is, asks whether two names refer to the very same object, and no class can change that. So I use == for comparing values like numbers, strings and lists, and is for singletons — None, True, False — plus sentinel objects and enum members. Relying on is for numbers or strings is a bug: it only sometimes works because of CPython caching and interning.',
    },
    {
      id: 'none-and-truthiness-truthy-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`print(bool([]), bool([[]]), bool(""), bool(" "), bool(0.0), bool("0.0"))` },
      options: [
        'False True False True False True',
        'False False False False False False',
        'False False False True False False',
        'True True False True False True',
      ],
      correctOption: 0,
      answer: 'False True False True False True. Empty containers and zero are falsy; a list containing an empty list is non-empty; a space and the text "0.0" are non-empty strings.',
      explanation: py`Truthiness of a container depends only on its length, not on whether its items are themselves falsy. Strings are truthy if they contain any character at all.`,
      whyAsked: 'Quick check that the candidate knows the truthiness rules rather than guessing from "meaning".',
      mistakes: ['Thinking [[]] is falsy because its item is empty', 'Thinking "0.0" or " " is falsy'],
      followUps: ['How would you check whether a string is blank (only whitespace)?', 'How does bool() work for custom classes?'],
      modelAnswer: 'It prints False, True, False, True, False, True. An empty list and an empty string are falsy, and so is 0.0. A list that contains an empty list has one item, so it’s truthy — container truthiness depends on length, not on the items. A single space and the text "0.0" are non-empty strings, so they’re truthy too; to treat whitespace-only strings as empty I would check s.strip().',
    },
    {
      id: 'none-and-truthiness-nonetype-error',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A report crashes with `AttributeError: \'NoneType\' object has no attribute \'append\'`. The code includes `results = results.append(row)` inside a loop. Explain and fix.',
      answer: 'list.append mutates the list in place and returns None, so the first iteration replaces results with None; the next append is called on None. Call results.append(row) without assigning.',
      explanation: py`Python's convention — mutating methods return \`None\` — exists precisely to make this mistake fail fast instead of silently creating copies. The same applies to \`sort\`, \`reverse\`, \`extend\`, \`insert\`, \`dict.update\`, \`set.add\`. The traceback points at the *second* call; the bug is the assignment on the first.`,
      code: { lang: 'python', code: py`results = []
for row in ["a", "b"]:
    results.append(row)      # no assignment
print(results)               # ['a', 'b']` },
      whyAsked: 'Very common bug; tests reading tracebacks and knowing the in-place convention.',
      mistakes: ['Adding a None check instead of removing the assignment', 'Not knowing which methods return None'],
      followUps: ['Which list methods return a new value and which return None?', 'Why did Python choose this convention?'],
      modelAnswer: 'append changes the list in place and returns None, so results = results.append(row) rebinds results to None on the first pass. On the next iteration, results is None and None has no append method, hence the AttributeError. The fix is just results.append(row) without the assignment. Python deliberately makes mutating methods like append, sort and update return None so you can’t confuse them with operations that build a new object — like sorted() or the + operator.',
    },
    {
      id: 'none-and-truthiness-coalesce',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `coalesce(*values)` that returns the first argument that is **not None** (like SQL’s COALESCE), or `None` if all are None. Unlike `a or b or c`, it must keep falsy values such as `0` and `""`. (`*values` collects all the arguments into a tuple.)',
      answer: 'Loop over values and return the first one where value is not None; return None after the loop.',
      explanation: py`\`a or b or c\` returns the first *truthy* value, so \`coalesce(None, 0, 5)\` via \`or\` would give \`5\` and lose the legitimate \`0\`. Testing \`is not None\` keeps every real value. A one-liner alternative: \`next((v for v in values if v is not None), None)\`.`,
      starter: { files: { 'main.py': py`def coalesce(*values):
    # TODO: return the first value that is not None
    result = None
    for value in values:
        result = result or value
    return result


print(coalesce(None, 0, 5))
` } },
      tests: [
        { name: 'skips None', code: py`assert coalesce(None, "x") == "x"` },
        { name: 'keeps a falsy 0', code: py`assert coalesce(None, 0, 5) == 0` },
        { name: 'keeps an empty string', code: py`assert coalesce("", "default") == ""` },
        { name: 'all None gives None', code: py`assert coalesce(None, None) is None and coalesce() is None` },
      ],
      solution: { files: { 'main.py': py`def coalesce(*values):
    for value in values:
        if value is not None:
            return value
    return None


print(coalesce(None, 0, 5))
` } },
      hints: ['Return as soon as you find a value that is not None.', 'If the loop finishes without returning, every value was None.'],
      whyAsked: 'Tests the practical difference between truthiness and None checks.',
      mistakes: ['Using or, which skips 0 and ""', 'Using == None', 'Forgetting the all-None case'],
      followUps: ['How would you write it with next() and a generator expression?', 'Where does this pattern appear in configuration or database code?'],
      modelAnswer: 'I loop over the values and return the first one that is not None, and if the loop finishes I return None. The important detail is using is not None rather than truthiness: a chain of or operators returns the first truthy value, so it would skip a perfectly valid 0 or empty string. This is the same semantics as SQL’s COALESCE, and a compact version is next with a generator expression and None as the default.',
    },
    {
      id: 'none-and-truthiness-missing-vs-null',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'An API’s JSON can contain `"discount": 0`, `"discount": null`, or no discount key at all — and each means something different (no discount, "unknown, ask later", "use the default"). How do you handle the three cases in Python?',
      answer: 'json.loads maps null to None, so data.get("discount") can’t tell null from missing. Check the key first: if "discount" not in data → default; elif data["discount"] is None → unknown; else use the number (including 0). Never use truthiness here, because 0 is a meaningful value.',
      explanation: py`Three states need two explicit checks. A sentinel object (\`_MISSING = object()\`, then \`data.get("discount", _MISSING)\`) achieves the same in one lookup. In typed code, models with \`int | None\` fields plus a "was set" flag (as validation libraries offer) make the states explicit.`,
      code: { lang: 'python', code: py`_MISSING = object()

def discount_state(data):
    value = data.get("discount", _MISSING)
    if value is _MISSING:
        return "use default"
    if value is None:
        return "unknown"
    return f"{value}% off"

print(discount_state({}), discount_state({"discount": None}), discount_state({"discount": 0}))` },
      whyAsked: 'Distinguishing missing, null and falsy values is a frequent source of production bugs in API and config code.',
      mistakes: ['Using if data.get("discount"):, which merges all three with 0', 'Treating None and missing as the same without being asked to'],
      followUps: ['What does json.loads turn null into?', 'Why use object() as a sentinel instead of a string like "missing"?'],
      modelAnswer: 'json turns null into None, and dict.get also returns None for a missing key, so get alone can’t separate the cases. I would either check "discount" in data first, or use a private sentinel object as the get default and compare with is. Then: sentinel means use the default, None means unknown, and any number — including 0 — is the actual discount. The one thing I must not do is a truthiness check, because a real zero discount is falsy and would be lumped in with the missing cases.',
    },
    {
      id: 'none-and-truthiness-singletons',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Which objects is it safe to compare with `is`, and why? Is `if flag is True:` ever a good idea?',
      answer: 'Language-guaranteed singletons — None, True, False, Ellipsis, NotImplemented — plus enum members and sentinel objects you create. Small ints and interned strings are CPython details, not guarantees. `flag is True` is only right when you must distinguish the bool True from other truthy values (e.g. 1 or "yes"); normally write `if flag:`.',
      explanation: py`\`is\` is safe exactly when the language (or your own code) guarantees a single object for that value. \`x is True\` rejects \`1\` and \`"yes"\` — occasionally useful in validation or serialisation code, but in ordinary conditions it's needlessly strict, and \`== True\` is worse (\`1 == True\` is \`True\`). Linters flag both (E712).`,
      code: { lang: 'python', code: py`from enum import Enum

class Status(Enum):
    ACTIVE = "active"
    BANNED = "banned"

status = Status("banned")
print(status is Status.BANNED)   # True — enum members are unique objects

flag = 1
print(flag is True, flag == True)   # False True — 1 equals True, but isn't the True object` },
      whyAsked: 'Senior-level check: precise knowledge of what the language guarantees versus what CPython happens to do.',
      mistakes: ['Listing small ints or strings as safe for is', 'Recommending if flag == True', 'Not knowing enum members are singletons'],
      followUps: ['Why does `a = 256; b = 256; a is b` sometimes print True?', 'How do you create a sentinel and why not use None?', 'What does NotImplemented signal?'],
      modelAnswer: 'is is safe whenever there is guaranteed to be exactly one object for the value: the built-in singletons None, True, False, Ellipsis and NotImplemented, enum members, and sentinel objects I create with object(). Small-int caching and string interning are CPython optimisations, so using is for numbers or strings is a bug even when it seems to work. As for flag is True: in normal conditions I just write if flag. I’d only use is True when I specifically need the bool True and want to reject other truthy values like 1 or "yes", for example when validating input types; == True is never the right choice because 1 == True is true.',
    },
  ],

  takeaways: [
    'None is the one-and-only "no value" object; it comes from functions without return, in-place methods, dict.get and optional data.',
    'Test for None with is None / is not None — identity with a singleton, as PEP 8 recommends.',
    'Falsy: None, False, zeros and empty collections. Everything else is truthy — including "0", " " and [0].',
    'if items: is the idiomatic emptiness check, but when 0 or "" are valid values, use an explicit is None check.',
    '== compares values (and can be customised); is compares identity (and can’t).',
    'Never use is for numbers or strings: small-int caching and interning are CPython details, and Python warns about it.',
  ],
}
