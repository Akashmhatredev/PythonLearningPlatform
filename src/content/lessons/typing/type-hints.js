// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GRADE_BOOK = py`import typing


def average(scores: list[float]) -> float:
    """Return the mean of some scores."""
    return sum(scores) / len(scores)


def grade(score: float, pass_mark: float = 50.0) -> str:
    return "pass" if score >= pass_mark else "fail"


def report(name: str, scores: list[float]) -> None:
    mean = average(scores)
    print(f"{name}: {mean:.1f} ({grade(mean)})")


def letter(score):
    if score >= 70:
        return "A"
    return "B" if score >= 50 else "C"


report("Ada", [72.5, 88.0, 91.0])
report("Ben", [40, 55, 38])        # ints where floats are expected: fine

# Hints are notes, not rules: Python runs this happily.
report(404, (10, 20))              # an int name and a tuple of scores
print(letter(64))

print(report.__annotations__)
print(typing.get_type_hints(grade))
`

export default {
  id: 'type-hints',
  title: 'Type hints: the basics',
  summary: 'Type hints are notes about which types a variable, parameter or return value should have — tools check them, Python itself stores them and never enforces them.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['defining-functions', 'function-arguments'],
  related: ['typing-collections-and-unions', 'static-type-checking', 'generics', 'protocols', 'dataclasses', 'type-conversion', 'code-quality-tools'],
  tags: ['type hints', 'annotations', 'typing', '__annotations__', 'get_type_hints', 'annotationlib', 'PEP 484', 'PEP 649', 'PEP 749', 'forward references', 'deferred evaluation', 'return type', 'None', 'mypy', 'pyright'],
  apis: [
    { name: 'name: type = value', summary: 'A variable annotation: records the intended type of a name (optionally with a value).' },
    { name: 'def f(x: int) -> str', summary: 'Parameter and return annotations on a function.' },
    { name: 'func.__annotations__', summary: 'Dict of a function or class\'s annotations; computed on first access in Python 3.14+.' },
    { name: 'typing.get_type_hints(obj)', summary: 'Returns the annotations with string forward references resolved and None turned into NoneType.' },
    { name: 'annotationlib.get_annotations(obj, format=...)', summary: 'Python 3.14+: read annotations as values, as ForwardRef objects, or as source strings.' },
    { name: 'inspect.get_annotations(obj)', summary: 'Safe way to read annotations of a function, class or module (3.10+).' },
    { name: 'typing.reveal_type(x)', summary: 'Type checkers report the inferred type; at runtime it prints the runtime type to stderr and returns x.' },
  ],
  docs: [
    { label: 'typing — support for type hints', url: 'https://docs.python.org/3/library/typing.html' },
    { label: 'annotationlib — annotation introspection (3.14)', url: 'https://docs.python.org/3/library/annotationlib.html' },
    { label: 'Annotations best practices (HOWTO)', url: 'https://docs.python.org/3/howto/annotations.html' },
    { label: 'PEP 484 — Type Hints', url: 'https://peps.python.org/pep-0484/' },
    { label: 'PEP 649 — Deferred evaluation of annotations', url: 'https://peps.python.org/pep-0649/' },
    { label: 'mypy — type hints cheat sheet', url: 'https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **type hint** (also called a *type annotation*) is a short note in your code that says what *type* of value something is meant to hold. A *type* is the kind of object: \`int\` for whole numbers, \`str\` for text, \`list[float]\` for a list of decimal numbers, and so on.`,
    { code: py`def ticket_price(age: int, is_student: bool = False) -> float:
    if age < 12:
        return 5.0
    return 7.5 if is_student else 10.0`, lang: 'python', title: 'a function with hints' },
    py`Read it out loud: "*\`ticket_price\` takes an \`age\` that is an int and an \`is_student\` flag that is a bool, and returns a float*." The \`: int\` after a parameter and the \`-> float\` after the brackets are the hints.`,
    py`Here is the surprising part: **Python does not check them when the program runs.** Call \`ticket_price("ten")\` and Python will happily try. The hints are for *people* and *tools*: your editor, and **type checkers** such as mypy and pyright, which read your code *without running it* and warn you about mismatches. You'll set those up in [static type checking](lesson:static-type-checking).`,
  ],
  why: [
    py`Python is *dynamically typed*: a name can refer to any kind of object, and you find out about a wrong type only when a line actually runs — maybe in production, on the one customer whose name is \`None\`. Hints let tools find many of those bugs **before** the code runs.`,
    py`They are also documentation that can't drift as easily: \`def send(to: str, retries: int) -> bool\` tells the reader what to pass without opening the function body. Editors use them for accurate autocomplete ("this is a \`str\`, so here are the string methods").`,
    py`Finally, real libraries *read* hints at runtime to do work for you: [dataclasses](lesson:dataclasses) use them to discover fields, and frameworks like FastAPI and pydantic use them to validate and convert incoming data.`,
  ],
  eli15: [
    py`Think of a recipe card that says "**2 eggs**, **200 g flour**". The card doesn't stop you from putting in a banana — it's just a note. But a friend reading over your shoulder (the *type checker*) can shout "hey, that's not an egg!" before you put the cake in the oven.`,
    py`\`def bake(eggs: int) -> Cake\` is that card. Python, the cook, ignores the note and follows the steps. Your editor and checker are the friend who reads the note and spots mistakes early.`,
  ],
  analogy: {
    title: 'Labels on storage boxes',
    body: [
      py`Imagine moving house. You write "BOOKS" on one box and "KITCHEN" on another. Nothing stops you from putting a frying pan in the BOOKS box — the label is a promise, not a lock.`,
      py`The labels are still hugely useful: helpers know where things go, you find stuff faster, and a careful friend checking the boxes can say "this BOOKS box has a pan in it" *before* you unpack. Type hints are those labels; the type checker is the careful friend; Python itself is the removal van that carries whatever is in the box.`,
    ],
    mapping: [
      ['the label "BOOKS" on a box', 'a type hint: scores: list[float]'],
      ['nothing stops you packing a pan', 'Python does not enforce hints at runtime'],
      ['a friend checking boxes before unpacking', 'mypy / pyright checking code before it runs'],
      ['finding things faster thanks to labels', 'editor autocomplete and readable function signatures'],
      ['a list of every box and its label', 'func.__annotations__ — the stored hints'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Hints are stored, not enforced',
    props: {
      code: py`def total_price(price: float, quantity: int) -> float:
    return price * quantity


normal = total_price(2.5, 4)
weird = total_price("ab", 3)
hints = total_price.__annotations__
print(normal, weird)
print(hints["return"])
`,
      notes: {
        1: 'Defining the function stores its hints, but nothing about them is checked yet.',
        5: 'A normal call: 2.5 * 4 is 10.0.',
        6: 'The hint says `price` is a float, but Python passes the string `"ab"` straight in. `"ab" * 3` is `"ababab"` — no error.',
        7: '`__annotations__` is an ordinary dict mapping parameter names (and `"return"`) to the hinted types.',
        9: 'The hints are just data: here we read the return type, the class `float`.',
      },
    },
    alt: 'A step-by-step trace. total_price is defined with price: float, quantity: int and return float. Calling it with 2.5 and 4 returns 10.0. Calling it with the string "ab" and 3 returns "ababab" without any error. Then total_price.__annotations__ is read: a dict whose return entry is the float class. The program prints 10.0 ababab and then <class \'float\'>.',
    caption: py`Step through with ▶. The wrong-type call runs fine — catching it is the job of a **type checker**, which reads the code before it runs.`,
  },
  syntax: [
    py`#### Variables`,
    { code: py`player: str = "Ada"          # annotation + value
high_score: int = 0
ratio: float = 0.75
is_admin: bool = False
avatar: bytes = b"\x89PNG"

retries: int                  # annotation only: NO variable is created`, lang: 'python', title: 'variable annotations' },
    py`\`name: type = value\` binds the name *and* records the hint. \`name: type\` on its own only records the hint — using \`retries\` afterwards would raise \`NameError\`. Most of the time you don't annotate variables at all: checkers *infer* that \`high_score = 0\` is an \`int\`.`,
    py`#### Functions: parameters and return values`,
    { code: py`def greet(name: str, times: int = 1) -> str:
    return ("Hello, " + name + "! ") * times


def log_visit(page: str) -> None:      # returns nothing useful
    print("visited", page)


def total(*prices: float, **tags: str) -> float:
    return sum(prices)                 # prices: tuple of floats, tags: dict of str values`, lang: 'python', title: 'parameters, defaults and returns' },
    py`- \`param: type\` for each parameter; with a default, put spaces around \`=\`: \`times: int = 1\` (PEP 8 — without a hint you write \`times=1\`).
- \`-> type\` before the colon gives the **return type**.
- A function that just *does* something (prints, saves, appends) returns \`None\`: write \`-> None\`. It tells readers "don't use the result" and lets checkers catch \`x = log_visit("home")\` mistakes.
- \`*prices: float\` means *each* extra positional argument is a float; \`**tags: str\` means each keyword argument's *value* is a str.`,
    py`#### The types you'll use most`,
    py`| hint | means | example value |
|---|---|---|
| \`int\`, \`float\`, \`bool\`, \`str\`, \`bytes\` | the built-in class | \`3\`, \`2.5\`, \`True\`, \`"hi"\`, \`b"hi"\` |
| \`None\` | the value \`None\` (used for returns) | \`None\` |
| \`list[str]\` | a list whose items are str | \`["eggs", "milk"]\` |
| \`dict[str, int]\` | keys are str, values are int | \`{"Ada": 3}\` |
| \`tuple[int, int]\` | exactly two ints | \`(4, 7)\` |
| \`str \\| None\` | a str **or** None (3.10+) | \`"Ada"\` or \`None\` |
| any class you wrote | an instance of it | \`Order(...)\` |`,
    py`Collection hints, unions and friends get their own lesson: [Optional, unions, collections & TypedDict](lesson:typing-collections-and-unions).`,
    { callout: 'version', title: 'Which Python versions?', text: py`Annotations exist since Python 3.0 (functions) and 3.6 (variables). \`list[int]\` with the built-in \`list\` works from **3.9** (older code writes \`typing.List[int]\`). \`int | None\` works from **3.10**. Lazy, *deferred* evaluation of annotations — forward references "just work" — is new in **3.14** (PEP 649/749).` },
    { callout: 'tip', title: 'int is fine where float is expected', text: py`Type checkers accept an \`int\` wherever a \`float\` is hinted (and an \`int\` or \`float\` where \`complex\` is hinted) — PEP 484 made that shortcut so you don't have to write \`int | float\`. Likewise \`bool\` is a subclass of \`int\`, so \`True\` is accepted where an \`int\` is expected.` },
    py`#### Reading hints back`,
    { code: py`import typing


def grade(score: float, pass_mark: float = 50.0) -> str:
    return "pass" if score >= pass_mark else "fail"


print(grade.__annotations__)
# {'score': <class 'float'>, 'pass_mark': <class 'float'>, 'return': <class 'str'>}
print(typing.get_type_hints(grade))   # same here; also resolves "string" hints`, lang: 'python', title: '__annotations__ and get_type_hints()' },
  ],
  walkthrough: {
    title: 'Reading the grade book line by line',
    lang: 'python',
    code: GRADE_BOOK,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 6], text: py`\`average\` promises to take a \`list[float]\` and return a \`float\`. The docstring and the hints together tell a reader everything they need.` },
      { lines: [9, 10], text: py`\`pass_mark: float = 50.0\` — a hinted parameter with a default. Note the spaces around \`=\` when there is a hint.` },
      { lines: [13, 15], text: py`\`-> None\` says "this function returns nothing useful". It prints instead.` },
      { lines: [18, 21], text: py`\`letter\` has **no hints**. That's legal — hints are optional. Type checkers treat unannotated code as "anything goes" (gradual typing).` },
      { lines: [25], text: py`The scores are ints, the hint says \`list[float]\`. Fine for checkers too: an \`int\` is accepted where a \`float\` is expected.` },
      { lines: [28], text: py`Wrong types on purpose: an int for \`name\` and a tuple for \`scores\`. Python never looks at the hints during a call, so this prints \`404: 15.0 (fail)\`. A type checker would flag both arguments.` },
      { lines: [31], text: py`The hints are stored as a dict. \`None\` (the return hint) appears as the value \`None\`.` },
      { lines: [32], text: py`\`typing.get_type_hints()\` returns the same mapping, but resolves string annotations and turns a \`None\` hint into \`NoneType\` — here there's no return of \`None\`, so it matches the stored dict.` },
    ],
  },
  playground: {
    title: 'Grade book with hints',
    objective: 'Run it, notice that the wrong-type call still works, then add and read your own hints.',
    files: { 'main.py': GRADE_BOOK },
    expected: py`Six lines:

\`\`\`text
Ada: 83.8 (pass)
Ben: 44.3 (fail)
404: 15.0 (fail)
B
{'name': <class 'str'>, 'scores': list[float], 'return': None}
{'score': <class 'float'>, 'pass_mark': <class 'float'>, 'return': <class 'str'>}
\`\`\`

The third line is the point: the hints said \`str\` and \`list[float]\`, Python ran it anyway.`,
    experiments: [
      {
        id: 'annotate-letter',
        task: py`\`letter\` has no hints. Add them: \`score\` is a **float** and the function returns a **str**.`,
        hint: py`Change the first line of the function to \`def letter(score: float) -> str:\`.`,
        tests: [
          { name: 'letter is annotated float -> str', code: py`import typing
assert typing.get_type_hints(letter) == {'score': float, 'return': str}, 'Expected def letter(score: float) -> str'` },
        ],
        explain: py`The function behaves exactly as before — hints never change behaviour. What changed is the stored metadata (\`letter.__annotations__\`) and what your editor and type checker know about the function.`,
      },
      {
        id: 'set-mean',
        task: py`Prove hints aren't enforced: at the end, call \`average\` with a **set** of scores \`{60, 70, 80}\`, store the result in \`set_mean\` and print it.`,
        hint: py`\`set_mean = average({60, 70, 80})\` — \`sum()\` and \`len()\` both work on sets.`,
        tests: [{ name: 'set_mean is 70.0', code: py`assert ns.get('set_mean') == 70, 'Store average({60, 70, 80}) in set_mean'` }],
        explain: py`The hint says \`list[float]\`, but the body only needs something you can \`sum()\` and \`len()\`. Python runs it. A type checker *would* complain — and that's a hint that the parameter type is too narrow. In the next lesson you'll learn \`Collection[float]\`, which says exactly "anything sized and iterable".`,
      },
      {
        id: 'forward-ref',
        task: py`At the end of the file, add a function \`make_badge(name: str) -> Badge\` that returns \`Badge(name)\`, and only **after** it define \`class Badge\` with an \`__init__(self, name: str) -> None\` that stores \`self.name\`. Then print \`typing.get_type_hints(make_badge)\`.`,
        hint: py`Write the function first, then the class. In Python 3.14 the hint \`-> Badge\` isn't evaluated when \`def\` runs, so it doesn't matter that \`Badge\` doesn't exist yet.`,
        tests: [
          { name: 'make_badge and Badge exist', code: py`assert callable(ns.get('make_badge')) and isinstance(ns.get('Badge'), type), 'Define make_badge() and class Badge'` },
          { name: 'the function comes before the class', code: py`src = files['main.py']
assert src.index('def make_badge') < src.index('class Badge'), 'Define make_badge above class Badge'` },
          { name: 'the return hint resolves to the class', code: py`import typing
assert typing.get_type_hints(make_badge).get('return') is Badge` },
        ],
        explain: py`Since Python 3.14, annotations are evaluated **lazily** — only when someone asks for them. By the time \`get_type_hints\` runs, \`Badge\` exists. On 3.13 and earlier the same file crashes with \`NameError: name 'Badge' is not defined\` at the \`def\` line, unless you write the hint as a string, \`-> "Badge"\`.`,
      },
      {
        id: 'string-format',
        task: py`Add this to the end and run it — the hints mention names that are **never** defined:

\`\`\`python
import annotationlib


def load(path: Path) -> Config: ...


print(annotationlib.get_annotations(load, format=annotationlib.Format.STRING))
\`\`\``,
        hint: py`Copy the block exactly. Asking for \`Format.STRING\` returns the hints as source text, so the missing names don't matter.`,
        tests: [{ name: 'printed the hints as strings', code: py`assert "'path': 'Path'" in output and "'return': 'Config'" in output` }],
        explain: py`\`load.__annotations__\` would raise \`NameError\` (it evaluates the hints, and \`Path\` doesn't exist). \`annotationlib\` (new in 3.14) can ask for the hints in other *formats*: \`STRING\` gives source text, \`FORWARDREF\` gives real objects where possible and \`ForwardRef\` placeholders for missing names. Documentation tools use this.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Who reads your hints?',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'src', label: 'your code', note: 'def grade(score: float) -> str', x: 120, y: 160, tone: 'yellow' },
        { id: 'python', label: 'Python', note: 'stores hints, runs the code', x: 400, y: 50, tone: 'paper' },
        { id: 'checker', label: 'mypy / pyright', note: 'reads code without running it', x: 400, y: 160, tone: 'blue' },
        { id: 'editor', label: 'your editor', note: 'autocomplete, inline errors', x: 400, y: 270, tone: 'blue' },
        { id: 'libs', label: 'libraries', note: 'dataclasses, FastAPI, pydantic', x: 660, y: 50, tone: 'kraft' },
        { id: 'report', label: 'error report', note: 'before you run anything', x: 660, y: 200, tone: 'red' },
      ],
      edges: [
        { from: 'src', to: 'python', label: 'run' },
        { from: 'src', to: 'checker', label: 'check' },
        { from: 'src', to: 'editor', label: 'as you type' },
        { from: 'python', to: 'libs', label: '__annotations__', dashed: true },
        { from: 'checker', to: 'report', label: 'mismatches' },
      ],
      steps: [
        { focus: ['src'], text: py`You write a function with hints. The hints are part of the source code, nothing more.` },
        { focus: ['src', 'python'], edges: ['src->python'], text: py`When **Python** runs the \`def\`, it stores the hints on the function (in 3.14+, as a recipe it evaluates the first time someone asks). Every call then ignores them completely.` },
        { focus: ['python', 'libs'], edges: ['python->libs'], text: py`Some **libraries** read the stored hints at runtime and act on them: \`@dataclass\` turns annotated class attributes into fields; web frameworks validate request data against them.` },
        { focus: ['src', 'checker', 'report'], edges: ['src->checker', 'checker->report'], text: py`A **type checker** reads the source *without running it*, follows every call and assignment, and reports mismatches like "Argument 1 to grade has incompatible type str; expected float".` },
        { focus: ['src', 'editor'], edges: ['src->editor'], text: py`Your **editor** runs a checker-like engine continuously: it underlines mistakes as you type and knows that \`name.\` should offer string methods because \`name: str\`.` },
      ],
    },
    alt: 'Diagram: your code with hints on the left. An arrow labelled run goes to Python, which stores hints and runs code, with a dashed arrow to libraries such as dataclasses and FastAPI that read __annotations__. An arrow labelled check goes to mypy / pyright, which produces an error report before anything runs. An arrow labelled as you type goes to your editor.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When Python runs a \`def\` statement it builds a function object. Hints become a little dictionary attached to that object — \`func.__annotations__\` — mapping each parameter name (and the special key \`"return"\`) to its hinted type.`,
      py`When you *call* the function, Python binds the arguments to the parameters and runs the body. It never opens that dictionary. That's why \`total_price("ab", 3)\` returns \`"ababab"\` instead of an error: the only checks are the ones the operations themselves do (\`"ab" * 3\` is legal; \`"ab" * "3"\` would raise \`TypeError\`).`,
      py`Hints on **local variables** inside a function (\`count: int = 0\`) are not stored anywhere at runtime — they exist only for tools reading the source.`,
    ],
    technical: [
      py`#### Python 3.14: deferred evaluation (PEP 649 / PEP 749)`,
      py`Up to 3.13, annotation expressions were evaluated **eagerly**: when \`def\` ran, Python computed every hint and stored the results. That made forward references (a hint naming a class defined later) crash with \`NameError\`, and meant every import paid for evaluating every annotation.`,
      py`In 3.14 the compiler instead generates a small hidden function, \`__annotate__\`, holding the annotation expressions. Accessing \`__annotations__\` calls it the first time and caches the resulting dict. By then the module has usually finished running, so names defined later exist.`,
      { code: py`import annotationlib


def ship(order: Order) -> Receipt: ...    # neither name exists yet


class Order: ...


print(annotationlib.get_annotations(ship, format=annotationlib.Format.STRING))
# {'order': 'Order', 'return': 'Receipt'}
try:
    ship.__annotations__                  # VALUE format: evaluates now
except NameError as err:
    print(err)                            # name 'Receipt' is not defined`, lang: 'python', title: 'three ways to look at the same hints (3.14)' },
      py`\`annotationlib.Format\` offers \`VALUE\` (evaluate; may raise \`NameError\`), \`FORWARDREF\` (evaluate what you can, put \`ForwardRef\` placeholders for missing names) and \`STRING\` (the source text). Library and tool authors use these; application code rarely needs them.`,
      py`#### Older escape hatches you'll still see`,
      { code: py`from __future__ import annotations      # PEP 563: store every hint as a string


def ship(order: "Order") -> "Receipt":  # quoted forward references (works everywhere)
    ...`, lang: 'python', title: 'pre-3.14 forward references' },
      py`Quoting a hint, or \`from __future__ import annotations\`, turns hints into strings that tools resolve later. Both still work in 3.14 (the future import keeps its string behaviour); with 3.14 as your minimum version you can drop them. \`typing.get_type_hints()\` evaluates string hints for you.`,
      py`#### Classes and modules`,
      py`Annotated class attributes land in \`Class.__annotations__\`. An annotation *without* a value (\`retries: int\`) creates **no** attribute — that's exactly how [dataclasses](lesson:dataclasses) tell "a field you must pass" from "a field with a default". In 3.14 the name \`__annotations__\` is no longer injected into a module's globals; read a module's hints with \`annotationlib.get_annotations(module)\` (or \`inspect.get_annotations\`).`,
    ],
    production: [
      py`**Runtime cost:** hints are not checked on calls, so they don't slow calls down. In 3.14, unevaluated annotations also cost little at import time. Don't avoid hints for speed reasons.`,
      py`**Reading hints in your own tools:** prefer \`typing.get_type_hints()\` (resolves strings, handles inheritance for classes) or \`annotationlib.get_annotations()\` / \`inspect.get_annotations()\` over poking at \`__annotations__\` directly. Be ready for \`NameError\` when hints reference names that only exist for type checkers (see \`TYPE_CHECKING\` in [static type checking](lesson:static-type-checking)).`,
      py`**Where to start annotating:** public functions and methods first (they are the contract other code relies on), then data structures. Let checkers infer local variables. Add a checker to CI so hints stay true — an unchecked hint can quietly become a lie.`,
      py`**Runtime validation is a separate decision.** If data comes from outside (JSON, forms, files), hints alone protect nothing at runtime. Validate at the boundary — by hand (see [input validation](lesson:input-validation)) or with a library such as pydantic that reads your hints and enforces them.`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting hints to stop bad data',
      wrong: { code: py`def set_volume(level: int) -> None:
    print("volume:", level)


typed = "11"            # e.g. what input() returned
set_volume(typed)       # a str slips through: no error`, lang: 'python' },
      right: { code: py`def set_volume(level: int) -> None:
    if not isinstance(level, int):
        raise TypeError(f"level must be an int, got {type(level).__name__}")
    print("volume:", level)


set_volume(int("11"))   # convert at the boundary, then pass the right type`, lang: 'python' },
      explanation: py`Hints document and enable checking; they are not runtime validation. Data from users, files or networks must be converted and validated explicitly — a type checker can't see what a user will type.`,
    },
    {
      title: 'Using = instead of : for a hint',
      wrong: { code: py`def make_badge(name: str, level=int) -> str:
    return f"{name} (level {level})"


print(make_badge("Ada"))   # Ada (level <class 'int'>)`, lang: 'python' },
      right: { code: py`def make_badge(name: str, level: int = 1) -> str:
    return f"{name} (level {level})"


print(make_badge("Ada"))   # Ada (level 1)`, lang: 'python' },
      explanation: py`\`level=int\` is a *default value*: the class \`int\` itself becomes the default. The hint uses a colon, and a default comes after it: \`level: int = 1\`.`,
    },
    {
      title: 'Forgetting -> None (or writing the wrong return type)',
      wrong: { code: py`def save_score(scores: list[int], new: int):
    scores.append(new)


best = save_score([1, 2], 3)   # best is None — easy to miss`, lang: 'python' },
      right: { code: py`def save_score(scores: list[int], new: int) -> None:
    scores.append(new)


scores = [1, 2]
save_score(scores, 3)          # a checker now rejects best = save_score(...)`, lang: 'python' },
      explanation: py`Without \`-> None\`, readers can't tell whether the function returns something. With it, mypy reports \`"save_score" does not return a value (it only ever returns None)  [func-returns-value]\` when the result is used.`,
    },
    {
      title: 'Annotating a name without giving it a value, then using it',
      wrong: { code: py`max_players: int
print(max_players)   # NameError: name 'max_players' is not defined`, lang: 'python', static: true },
      right: { code: py`max_players: int = 4
print(max_players)`, lang: 'python' },
      explanation: py`A bare annotation (\`name: type\`) only records the intended type; it doesn't create the variable. That's useful in classes and dataclasses, confusing in scripts.`,
    },
    {
      title: 'Lying hints (annotations that drifted from the code)',
      wrong: { code: py`def find_user(user_id: int) -> dict:
    if user_id < 0:
        return None          # the hint says dict, the code returns None
    return {"id": user_id}`, lang: 'python' },
      right: { code: py`def find_user(user_id: int) -> dict[str, int] | None:
    if user_id < 0:
        return None
    return {"id": user_id}`, lang: 'python' },
      explanation: py`A wrong hint is worse than none: callers trust it and skip the \`None\` check. Running a type checker keeps hints honest — mypy reports \`Incompatible return value type (got "None", expected "dict[Any, Any]")  [return-value]\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`NameError: name 'Order' is not defined   (at a def line, Python 3.13 or earlier)`,
      cause: py`A hint refers to a class defined later in the file (or only imported for type checkers). Before 3.14, hints are evaluated when \`def\` runs.`,
      fix: py`Quote the hint (\`-> "Order"\`), add \`from __future__ import annotations\` at the top of the module, or move the class above. On 3.14+ this specific crash disappears.`,
    },
    {
      symptom: py`NameError: name 'Path' is not defined   (when reading func.__annotations__ or calling typing.get_type_hints, 3.14)`,
      cause: py`The hint is evaluated lazily on access, and the name it mentions doesn't exist at runtime (a typo, a missing import, or an import guarded by \`if TYPE_CHECKING:\`).`,
      fix: py`Import the name for real, or read the hints with \`annotationlib.get_annotations(func, format=annotationlib.Format.FORWARDREF)\` / \`Format.STRING\` if you only need them for display.`,
    },
    {
      symptom: py`TypeError: 'type' object is not subscriptable   (e.g. on list[int], Python 3.8)`,
      cause: py`Built-in generics like \`list[int]\` need Python 3.9+. On older versions only \`typing.List[int]\` works.`,
      fix: py`Upgrade Python (3.8 is end-of-life), or use \`from typing import List\` for code that must still run there.`,
    },
    {
      symptom: py`A function "with hints" happily accepts the wrong type and fails later with AttributeError: 'NoneType' object has no attribute 'upper'`,
      cause: py`Nothing checks hints at runtime, and no type checker is run on the project.`,
      fix: py`Run mypy or pyright (locally and in CI). For data from outside the program, validate explicitly at the boundary.`,
    },
  ],
  bestPractices: [
    'Annotate every public function\'s parameters and return value; let tools infer local variables.',
    'Write -> None on functions that only do something, so misuse of their result is caught.',
    'Use built-in generics (list[str], dict[str, int]) and X | None — not typing.List / Optional — on 3.10+.',
    'Keep hints honest by running a type checker in CI; a wrong hint misleads every reader.',
    'Read hints with typing.get_type_hints() or annotationlib.get_annotations(), not by evaluating strings yourself.',
    'Never rely on hints for runtime safety: validate and convert outside data at the boundary.',
    'Prefer hints that say what you need (an iterable of floats) over what you happen to pass today (a list).',
  ],
  useCases: [
    'Documenting a function\'s contract in its signature: def charge(amount_pence: int, card_id: str) -> bool.',
    'Catching None-related bugs before running with mypy or pyright.',
    'Getting accurate autocomplete and inline errors in VS Code / PyCharm.',
    'Declaring fields for @dataclass, NamedTuple and TypedDict.',
    'Letting frameworks such as FastAPI or pydantic validate and convert incoming JSON.',
  ],
  whenToUse: {
    use: [
      'Library and application code that more than one person (or future you) will maintain.',
      'Function signatures, especially public ones and anything crossing a module boundary.',
      'Data structures: dataclasses, TypedDicts, class attributes.',
    ],
    avoid: [
      'Treating hints as validation of user, file or network input — they are not checked at runtime.',
      'Spending time annotating obvious local variables (x: int = 0) that checkers infer anyway.',
      'Writing hints you never check: without a checker they can silently drift from the code.',
    ],
  },
  comparison: {
    title: 'When are annotations evaluated?',
    headers: ['', 'Python ≤ 3.13 (default)', 'with from __future__ import annotations', 'Python 3.14+ (default)'],
    rows: [
      ['evaluated…', 'immediately, when def / class runs', 'never automatically: stored as strings', 'lazily, the first time someone asks'],
      ['hint naming a class defined later', 'NameError unless quoted: -> "Badge"', 'works (it is just text)', 'works'],
      ['func.__annotations__ contains', 'evaluated objects', 'strings', 'evaluated objects (computed on first access)'],
      ['cost when the module is imported', 'evaluates every hint', 'very little', 'very little until accessed'],
    ],
    note: py`All three are invisible at call time: no version of Python checks argument types against hints. See PEP 649 and PEP 749 for the full design.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'type-hints-q1',
      type: 'mcq',
      prompt: py`What does Python do with the hints in \`def area(width: float, height: float) -> float:\` when you call \`area(3, 4)\`?`,
      options: [
        { text: 'Checks the arguments and raises TypeError because 3 and 4 are ints', why: 'Python never checks arguments against hints at runtime. (And type checkers accept ints where floats are hinted.)' },
        { text: 'Converts 3 and 4 to 3.0 and 4.0 before running the body', why: 'Hints never convert anything. The body receives the ints 3 and 4 and returns the int 12.' },
        'Nothing during the call — the hints are stored on the function for tools to read',
        { text: 'Refuses to run until a type checker has approved the file', why: 'Python and type checkers are separate programs. Python runs code whether or not you ever ran mypy.' },
      ],
      answer: 2,
      explanation: py`Hints are metadata. Python stores them (\`area.__annotations__\`) and ignores them during calls; \`area(3, 4)\` simply returns \`12\`.`,
    },
    {
      id: 'type-hints-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def shout(word: str) -> str:
    return word * 2


print(shout(4))`,
      answer: '8',
      accept: ['8'],
      explanation: py`The hint says \`str\`, but nothing enforces it. \`4 * 2\` is \`8\`. A type checker would report: \`Argument 1 to "shout" has incompatible type "int"; expected "str"\`.`,
    },
    {
      id: 'type-hints-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`def book(seats: int, vip: bool = False) -> float:
    return seats * (50.0 if vip else 20.0)


print(book.__annotations__)`,
      options: [
        "{'seats': <class 'int'>, 'vip': <class 'bool'>, 'return': <class 'float'>}",
        { text: "{'seats': 'int', 'vip': 'bool', 'return': 'float'}", why: 'Without from __future__ import annotations, the stored values are the classes themselves, not strings.' },
        { text: "{'seats': <class 'int'>, 'vip': <class 'bool'>}", why: 'The return hint is stored too, under the special key "return".' },
        { text: "{'seats': int, 'vip': False, 'return': float}", why: 'Default values are not annotations — they live in book.__defaults__.' },
      ],
      answer: 0,
      explanation: py`\`__annotations__\` maps each annotated parameter name, plus \`"return"\`, to the evaluated hint — here the classes \`int\`, \`bool\` and \`float\`.`,
    },
    {
      id: 'type-hints-q4',
      type: 'bug',
      prompt: 'This prints `Ada (level <class \'int\'>)` instead of `Ada (level 1)`. Click the line with the bug.',
      code: py`def make_badge(name: str, level=int) -> str:
    return f"{name} (level {level})"


print(make_badge("Ada"))`,
      answerLine: 1,
      explanation: py`\`level=int\` makes the class \`int\` the *default value*. A hint uses a colon: \`level: int = 1\`.`,
    },
    {
      id: 'type-hints-q5',
      type: 'fill',
      prompt: 'Complete the signature: `age` is a whole number and the function returns a bool.',
      code: py`def is_adult(age: ___) ___ bool:
    return age >= 18`,
      answer: [['int'], ['->']],
      explanation: py`Parameters are annotated with \`: type\`; the return type follows \`->\` before the colon: \`def is_adult(age: int) -> bool:\`.`,
    },
    {
      id: 'type-hints-q6',
      type: 'mcq',
      prompt: py`Running on **Python 3.14**, what happens when this file runs?

\`\`\`python
def ship(order: Order) -> None:
    print("shipping", order)


class Order: ...
\`\`\``,
      options: [
        { text: 'NameError at the def line, because Order is not defined yet', why: 'That was true up to 3.13. Since 3.14 annotations are evaluated lazily, when someone reads them.' },
        'It runs fine: the hint is only evaluated if someone reads the annotations later, and by then Order exists',
        { text: 'SyntaxError: forward references must be quoted', why: 'Unquoted forward references have never been a syntax error; the old problem was a NameError at runtime.' },
        { text: 'Python silently replaces Order with Any', why: 'Python never rewrites hints. In 3.14 it just postpones evaluating them.' },
      ],
      answer: 1,
      explanation: py`PEP 649/749 (Python 3.14) defer evaluating annotations until they are accessed. Forward references "just work". On older versions you'd quote the hint (\`"Order"\`) or use \`from __future__ import annotations\`.`,
    },
    {
      id: 'type-hints-q7',
      type: 'short',
      prompt: 'Python ignores type hints at runtime. Give three concrete reasons to write them anyway.',
      answer: py`1) A type checker (mypy, pyright) can find wrong-type and missing-None-check bugs before the code runs. 2) Editors give accurate autocomplete and inline errors. 3) They document the contract of a function right in its signature, and stay accurate if checked in CI. Bonus: libraries like dataclasses, FastAPI and pydantic read hints at runtime to build fields and validate data.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'annotate-cinema',
      title: 'Annotate the cinema till',
      difficulty: 'intermediate',
      prompt: py`The cinema's ticket code works but has no hints. Add hints **without changing behaviour**:

- \`ticket_price(age, is_student=False)\` → \`age\` is an \`int\`, \`is_student\` a \`bool\` (keep the default \`False\`), returns a \`float\`.
- \`basket_total(prices)\` → \`prices\` is a \`list[float]\`, returns a \`float\`.
- \`print_receipt(name, prices)\` → \`name\` is a \`str\`, \`prices\` a \`list[float]\`, returns \`None\`.

The tests read your hints with \`typing.get_type_hints()\` and check the functions still compute the same results.`,
      files: {
        'main.py': py`def ticket_price(age, is_student=False):
    if age < 12:
        return 5.0
    if is_student:
        return 7.5
    return 10.0


def basket_total(prices):
    return sum(prices)


def print_receipt(name, prices):
    print(f"{name}: {len(prices)} tickets, total {basket_total(prices):.2f}")


prices = [ticket_price(9), ticket_price(16, is_student=True), ticket_price(40)]
print_receipt("Ada", prices)
`,
      },
      hints: [
        'Parameters get ": type" after the name; the return type goes after "->" before the final colon.',
        'With a default, the hint goes between the name and "=": is_student: bool = False.',
        'def print_receipt(name: str, prices: list[float]) -> None:',
      ],
      solution: {
        explanation: py`Each parameter gets \`: type\` and each function gets \`-> type\`. \`print_receipt\` only prints, so its return type is \`None\` — \`get_type_hints\` reports that as \`NoneType\`. The program's output is unchanged (\`Ada: 3 tickets, total 22.50\`) because hints never affect behaviour; what changed is the information available to readers, editors and checkers.`,
        files: {
          'main.py': py`def ticket_price(age: int, is_student: bool = False) -> float:
    if age < 12:
        return 5.0
    if is_student:
        return 7.5
    return 10.0


def basket_total(prices: list[float]) -> float:
    return sum(prices)


def print_receipt(name: str, prices: list[float]) -> None:
    print(f"{name}: {len(prices)} tickets, total {basket_total(prices):.2f}")


prices = [ticket_price(9), ticket_price(16, is_student=True), ticket_price(40)]
print_receipt("Ada", prices)
`,
        },
      },
      tests: [
        { name: 'ticket_price(age: int, is_student: bool = False) -> float', code: py`import typing
assert typing.get_type_hints(ticket_price) == {'age': int, 'is_student': bool, 'return': float}` },
        { name: 'basket_total(prices: list[float]) -> float', code: py`import typing
assert typing.get_type_hints(basket_total) == {'prices': list[float], 'return': float}` },
        { name: 'print_receipt(name: str, prices: list[float]) -> None', code: py`import typing
assert typing.get_type_hints(print_receipt) == {'name': str, 'prices': list[float], 'return': type(None)}` },
        { name: 'is_student still defaults to False', code: py`assert ticket_price(30) == 10.0 and ticket_price(30, True) == 7.5` },
        { name: 'output unchanged', code: py`assert output.strip() == "Ada: 3 tickets, total 22.50"` },
      ],
    },
    {
      id: 'validate-call',
      title: 'A tiny runtime type checker',
      difficulty: 'intermediate',
      prompt: py`Hints aren't enforced — but they are *data*, so you can build a small checker yourself. Write \`validate_call(func, **kwargs)\` that returns a **list of problem messages** (an empty list if everything matches):

- read \`func\`'s hints with \`typing.get_type_hints(func)\`;
- for each keyword argument, in the order given, if the parameter has a hint and \`isinstance(value, hint)\` is false, add \`"<name>: expected <hint name>, got <value type name>"\`, e.g. \`"seats: expected int, got str"\`;
- skip arguments whose parameter has no hint.

Only plain classes (\`int\`, \`str\`, \`float\`, \`bool\`, your own classes) will be used as hints. This is a **simplified** checker: real tools also handle \`list[int]\`, unions and more.`,
      files: {
        'main.py': py`import typing


def validate_call(func, **kwargs) -> list[str]:
    problems: list[str] = []
    # TODO: compare each keyword argument with func's hints
    return problems


def book_seats(show: str, seats: int, vip: bool = False) -> float:
    return seats * (50.0 if vip else 20.0)


print(validate_call(book_seats, show="Hamlet", seats=2))
print(validate_call(book_seats, show="Hamlet", seats="2"))
`,
      },
      hints: [
        'hints = typing.get_type_hints(func) gives a dict like {"show": str, "seats": int, ...}.',
        'Loop over kwargs.items(); use hints.get(name) and skip when it is None.',
        'problems.append(f"{name}: expected {expected.__name__}, got {type(value).__name__}")',
      ],
      solution: {
        explanation: py`\`get_type_hints\` turns the stored annotations into a dict of classes. For each keyword argument we look up the expected class and compare with \`isinstance\`, which also accepts subclasses. \`type(value).__name__\` gives a readable name such as \`str\`.

This is deliberately **simplified**. Notice one difference from static checkers: \`isinstance(3, float)\` is \`False\`, so this checker would reject an int where a float is hinted, while mypy accepts it. Production runtime validators (pydantic, beartype, typeguard) handle generics, unions, coercion rules and nested data.`,
        files: {
          'main.py': py`import typing


def validate_call(func, **kwargs) -> list[str]:
    problems: list[str] = []
    hints = typing.get_type_hints(func)
    for name, value in kwargs.items():
        expected = hints.get(name)
        if expected is None:
            continue
        if not isinstance(value, expected):
            problems.append(f"{name}: expected {expected.__name__}, got {type(value).__name__}")
    return problems


def book_seats(show: str, seats: int, vip: bool = False) -> float:
    return seats * (50.0 if vip else 20.0)


print(validate_call(book_seats, show="Hamlet", seats=2))
print(validate_call(book_seats, show="Hamlet", seats="2"))
`,
        },
      },
      tests: [
        { name: 'correct arguments give no problems', code: py`assert validate_call(book_seats, show="Hamlet", seats=2, vip=True) == []` },
        { name: 'reports a wrong type', code: py`assert validate_call(book_seats, show="Hamlet", seats="2") == ["seats: expected int, got str"]` },
        { name: 'reports several problems in argument order', code: py`assert validate_call(book_seats, show=7, seats=2.5) == ["show: expected str, got int", "seats: expected int, got float"]` },
        { name: 'skips parameters without hints', code: py`def tag(label, colour: str) -> str:
    return label
assert validate_call(tag, label=123, colour="red") == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'type-hints-enforced',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Are type hints enforced at runtime in Python? What are they for, then?',
      answer: 'No. CPython stores annotations on functions and classes but never checks arguments or return values against them. They exist for static type checkers (mypy, pyright), editors, documentation, and libraries that choose to read them at runtime (dataclasses, pydantic, FastAPI).',
      explanation: py`PEP 484 explicitly says Python will remain dynamically typed and hints are optional. The interpreter's only use of them is to store them (\`__annotations__\`). All checking happens in separate tools, before the program runs — or in libraries that read hints and validate on purpose.`,
      code: { lang: 'python', code: py`def double(x: int) -> int:
    return x * 2


print(double("ab"))            # abab — no error
print(double.__annotations__)  # {'x': <class 'int'>, 'return': <class 'int'>}` },
      whyAsked: 'Many candidates assume hints behave like Java types. Interviewers check you know where checking actually happens.',
      mistakes: ['Saying Python raises TypeError on a wrong-typed argument', 'Saying hints make code faster', 'Not knowing any tool that uses them'],
      followUps: ['How would you enforce types at runtime if you needed to?', 'What does a type checker do differently from the interpreter?', 'Do hints change performance?'],
      modelAnswer: 'No — Python stores hints but never enforces them. When I call a function, the interpreter binds arguments and runs the body without looking at the annotations, so double("ab") happily returns "abab". The value of hints comes from tools: mypy or pyright read the code without running it and catch mismatches, editors use them for autocomplete, and they document the contract in the signature. Some libraries, like dataclasses or pydantic, read them at runtime on purpose. If I need runtime enforcement — for example on JSON from a client — I validate at that boundary explicitly or use a validation library.',
    },
    {
      id: 'type-hints-output-default',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print, and what was the author trying to write?',
      code: { lang: 'python', code: py`def connect(host: str, port=int, timeout: float = 5.0) -> str:
    return f"{host}:{port} ({timeout}s)"


print(connect("db.local"))` },
      options: ['db.local:0 (5.0s)', "db.local:<class 'int'> (5.0s)", 'TypeError: missing argument port', 'db.local:int (5)'],
      correctOption: 1,
      answer: "It prints db.local:<class 'int'> (5.0s). port=int sets the class int as the default value; the author meant port: int (probably with a real default such as port: int = 5432).",
      explanation: py`A colon introduces a hint, an equals sign introduces a default. \`port=int\` has no hint at all and uses the \`int\` class object as its default, which an f-string formats as \`<class 'int'>\`. A type checker would not flag the call — the signature is valid — but a linter or reviewer should.`,
      whyAsked: 'A quick check of annotation syntax and of the difference between hints and defaults.',
      mistakes: ['Answering TypeError because "port is required"', 'Thinking Python converts the default to 0'],
      followUps: ['Where are default values stored on a function object?', 'How would a type checker treat port in this signature?'],
      modelAnswer: 'It prints db.local:<class \'int\'> (5.0s). The bug is port=int: an equals sign means "default value", so the int class itself becomes the default, and the f-string prints its repr. The author wanted a hint, which uses a colon — port: int — and probably a real default like port: int = 5432. Defaults live in connect.__defaults__ while hints live in __annotations__, which is why the two mechanisms never interfere.',
    },
    {
      id: 'type-hints-deferred-evaluation',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What changed about annotations in Python 3.14 (PEP 649 / PEP 749), and why?',
      answer: 'Annotations are no longer evaluated when def/class runs. The compiler stores them in a generated __annotate__ function, and __annotations__ evaluates and caches them on first access. Forward references work without quotes, imports no longer pay for evaluating hints, and the new annotationlib module can return hints as values, ForwardRef placeholders, or strings.',
      explanation: py`Before 3.14 there were two models: eager evaluation (default; forward references crash with \`NameError\`) and PEP 563 stringified annotations via \`from __future__ import annotations\` (no crash, but hints become strings that every consumer must \`eval\`, which breaks with local names). PEP 649 chose a third way — lazy evaluation — so runtime consumers still get real objects, and PEP 749 filled in details: the \`annotationlib\` module with \`Format.VALUE\`, \`Format.FORWARDREF\` and \`Format.STRING\`, and module annotations no longer being a global name.`,
      code: { lang: 'python', code: py`import annotationlib


def ship(order: Order) -> None: ...   # fine in 3.14 even though Order is not defined yet


class Order: ...


print(ship.__annotations__)   # evaluated now: {'order': <class '__main__.Order'>, 'return': None}
print(annotationlib.get_annotations(ship, format=annotationlib.Format.STRING))` },
      whyAsked: 'Tests whether you track recent language changes and understand the trade-offs behind them, which matters for library authors and framework users.',
      mistakes: ['Saying 3.14 turned all annotations into strings (that is PEP 563, the future import)', 'Saying annotations are now checked at runtime', 'Not knowing the old NameError problem'],
      followUps: ['What does Format.FORWARDREF return for a missing name?', 'Should a project that supports 3.10–3.14 drop the quotes around forward references?', 'What happens to from __future__ import annotations in 3.14?'],
      modelAnswer: 'In 3.14 annotations are evaluated lazily. Instead of computing every hint when the def or class statement runs, the compiler puts the annotation expressions into a hidden __annotate__ function, and the first access to __annotations__ calls it and caches the result. That fixes the classic forward-reference NameError — a hint can mention a class defined later without quotes — and imports stop paying to evaluate hints nobody reads. Unlike the older from __future__ import annotations approach, consumers still get real objects instead of strings. The new annotationlib module lets tools ask for hints as values, as ForwardRef placeholders, or as source strings. If a codebase still supports older versions, it still needs quotes or the future import.',
    },
    {
      id: 'type-hints-nameerror-old-python',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A module works on your Python 3.14 laptop but CI on Python 3.12 fails at import with `NameError: name \'Invoice\' is not defined`, pointing at `def total(invoice: Invoice) -> float:`. What is going on and how do you fix it?',
      answer: 'On 3.12 annotations are evaluated eagerly when def runs, and Invoice is defined later in the file (or imported only under TYPE_CHECKING). 3.14 defers evaluation, so it works there. Fix for both: quote the hint ("Invoice"), add from __future__ import annotations, or define/import Invoice before the function.',
      explanation: py`This is the most common cross-version annotation bug. The behaviour difference is exactly PEP 649. While a project supports anything below 3.14, its CI must run on the oldest supported version and keep forward references quoted (or use the future import). Ruff and similar linters can flag quoted/unquoted annotation style automatically.`,
      code: { lang: 'python', code: py`from __future__ import annotations   # works on 3.7+; hints become strings


def total(invoice: Invoice) -> float:
    return sum(invoice.lines)


class Invoice:
    def __init__(self, lines: list[float]) -> None:
        self.lines = lines` },
      whyAsked: 'Version-dependent behaviour is a real production hazard; this checks you can reason about it rather than guess.',
      mistakes: ['Suggesting to upgrade CI without considering users on older versions', 'Removing the hint instead of fixing it', 'Not running CI on the minimum supported version'],
      followUps: ['What does typing.get_type_hints do with string annotations?', 'How do TYPE_CHECKING-only imports interact with this?'],
      modelAnswer: 'The difference is when annotations are evaluated. Up to 3.13, Python evaluates hints as soon as the def runs, and at that moment Invoice does not exist yet — it is defined further down or only imported for type checkers — so it raises NameError at import. Python 3.14 defers evaluation until someone reads the annotations, so my laptop never hits it. To support both, I would quote the forward reference, "Invoice", or add from __future__ import annotations at the top of the module. And I would make sure CI always tests the oldest Python the project supports.',
    },
    {
      id: 'type-hints-missing-hints',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `missing_hints(func)` that returns a list of the parameter names of `func` that have **no** annotation, in signature order, followed by `"return"` if the return annotation is missing. Use `inspect.signature`.',
      answer: 'Loop over inspect.signature(func).parameters.values(); collect names whose .annotation is inspect.Parameter.empty; then append "return" if signature.return_annotation is inspect.Signature.empty.',
      explanation: py`\`inspect.signature\` gives a \`Signature\` object whose \`parameters\` mapping is ordered like the definition. Each \`Parameter\` has \`.annotation\`, which is the sentinel \`inspect.Parameter.empty\` when there is no hint; the return annotation uses \`inspect.Signature.empty\`. This is the core of what mypy's \`--disallow-untyped-defs\` checks (it does it statically, from source, without importing your code).`,
      starter: { files: { 'main.py': py`import inspect


def missing_hints(func) -> list[str]:
    # TODO: report unannotated parameters, then "return" if needed
    return []


def charge(amount: int, card, *, retries=3):
    return True


print(missing_hints(charge))   # ['card', 'retries', 'return']
` } },
      tests: [
        { name: 'finds unannotated params and return', code: py`def charge(amount: int, card, *, retries=3):
    return True
assert missing_hints(charge) == ['card', 'retries', 'return']` },
        { name: 'fully annotated function gives []', code: py`def ok(a: int, b: str = "x") -> None:
    pass
assert missing_hints(ok) == []` },
        { name: 'handles *args and **kwargs', code: py`def f(*args, **kwargs: int) -> int:
    return 0
assert missing_hints(f) == ['args']` },
      ],
      solution: { files: { 'main.py': py`import inspect


def missing_hints(func) -> list[str]:
    signature = inspect.signature(func)
    missing = [
        name
        for name, param in signature.parameters.items()
        if param.annotation is inspect.Parameter.empty
    ]
    if signature.return_annotation is inspect.Signature.empty:
        missing.append("return")
    return missing


def charge(amount: int, card, *, retries=3):
    return True


print(missing_hints(charge))   # ['card', 'retries', 'return']
` } },
      hints: ['inspect.signature(func).parameters is an ordered mapping of name -> Parameter.', 'Compare with the sentinels inspect.Parameter.empty and inspect.Signature.empty using is.'],
      whyAsked: 'Checks comfort with runtime introspection of hints, a common need when writing decorators, CLIs or validation helpers.',
      mistakes: ['Comparing annotation to None (None is a valid hint for -> None)', 'Using __annotations__ and forgetting that missing keys mean "no hint"', 'Losing parameter order by iterating a set'],
      followUps: ['How would you skip self in methods?', 'What happens if an annotation refers to an undefined name in 3.14?', 'How would mypy do this without importing the module?'],
      modelAnswer: 'I would call inspect.signature on the function, iterate its parameters in order, and collect the names whose annotation is the inspect.Parameter.empty sentinel. Then I check signature.return_annotation against inspect.Signature.empty and append "return" if it is missing. Using the sentinel matters because None is a perfectly valid return hint. In 3.14, if a hint mentions an undefined name, evaluating it raises NameError, so a robust tool would pass annotation_format=Format.STRING. Static checkers like mypy do the same check from the source code instead of importing it.',
    },
    {
      id: 'type-hints-reading-annotations',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `obj.__annotations__`, `typing.get_type_hints(obj)` and `annotationlib.get_annotations(obj)`. Which would you use in a library that inspects user classes?',
      answer: '__annotations__ is the raw per-object dict (evaluated on first access in 3.14; may hold strings under the future import). get_type_hints evaluates string hints, merges class hints along the MRO, and converts None to NoneType. annotationlib.get_annotations (3.14) returns one object\'s hints in a chosen format (VALUE, FORWARDREF, STRING) without merging. A library usually wants get_type_hints for resolved types, or annotationlib with FORWARDREF when some names may not exist at runtime.',
      explanation: py`For classes, \`__annotations__\` only covers that class, not its bases; \`get_type_hints\` walks the MRO. Strings (quoted hints or PEP 563) stay strings in \`__annotations__\` but are evaluated by \`get_type_hints\`. In 3.14, \`annotationlib.get_annotations(obj, format=Format.FORWARDREF)\` is the safe choice when hints reference names only imported for type checkers. \`inspect.get_annotations\` (3.10+) is the older, version-portable equivalent.`,
      whyAsked: 'Library and framework authors (validation, serialization, DI containers) rely on this; it shows depth beyond writing hints.',
      mistakes: ['Calling eval() on string annotations yourself', 'Not knowing that class __annotations__ excludes base classes', 'Assuming __annotations__ always holds classes, never strings'],
      followUps: ['Why might get_type_hints raise NameError?', 'What does include_extras=True do?', 'How do dataclasses find their fields?'],
      modelAnswer: '__annotations__ is the raw dict for exactly one object: in 3.14 it is computed lazily on first access, and it can contain strings if the module uses the future import or quoted hints. typing.get_type_hints is the high-level reader — it evaluates string annotations, merges class annotations across the MRO and normalises None to NoneType, but it raises NameError if a name cannot be resolved. annotationlib.get_annotations, new in 3.14, reads a single object\'s annotations in a format I choose: real values, ForwardRef placeholders for missing names, or plain source strings. In a library I would use get_type_hints when I need resolved types, and annotationlib with FORWARDREF when users may have type-checking-only imports.',
    },
    {
      id: 'type-hints-dataclass-field',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'In a `@dataclass`, a colleague wrote `discount = 0.0` next to `item: str` and `quantity: int = 1`. Now `Order("pen", 2, 0.1)` raises `TypeError: Order.__init__() takes from 2 to 3 positional arguments but 4 were given`. Why?',
      answer: 'dataclasses find fields by reading the class annotations. discount has no annotation, so it is a plain class attribute, not a field, and __init__ has no discount parameter. Fix: discount: float = 0.0.',
      explanation: py`This is a case where annotations have *runtime* meaning. \`@dataclass\` inspects the class's annotations, in order, to generate \`__init__\`, \`__repr__\` and \`__eq__\`. Unannotated names are ignored. The same rule applies to \`NamedTuple\` and \`TypedDict\`.`,
      code: { lang: 'python', code: py`from dataclasses import dataclass, fields


@dataclass
class Order:
    item: str
    quantity: int = 1
    discount = 0.0          # no annotation: NOT a field


print([f.name for f in fields(Order)])   # ['item', 'quantity']` },
      whyAsked: 'Shows that you know hints are not purely decorative and can explain a confusing real-world error.',
      mistakes: ['Blaming the default value', 'Saying dataclasses check argument types (they do not)'],
      followUps: ['Does @dataclass validate that item is really a str?', 'How would you declare a class-level constant in a dataclass without making it a field? (ClassVar)'],
      modelAnswer: 'The dataclass decorator builds __init__ from the class annotations, in order. discount = 0.0 has no annotation, so it is just a class attribute — not a field — and the generated __init__ only accepts item and quantity, hence the "takes from 2 to 3 positional arguments" error. Writing discount: float = 0.0 makes it a field. It is a nice example of annotations having runtime meaning, although the dataclass still does not check that the values match the types.',
    },
  ],

  takeaways: [
    'A type hint is a note — name: type, param: type, -> type — saying what kind of object is intended.',
    'Python stores hints (func.__annotations__) and never enforces them at runtime; type checkers and editors use them before the code runs.',
    'Write -> None for functions that only do something; use built-in generics like list[float] (3.9+) and X | None (3.10+).',
    'Python 3.14 evaluates annotations lazily (PEP 649/749): forward references work unquoted; on 3.13 and earlier quote them or use from __future__ import annotations.',
    'Read hints with typing.get_type_hints() or annotationlib.get_annotations() (3.14) rather than evaluating strings yourself.',
    'Some libraries (dataclasses, pydantic, FastAPI) give hints runtime meaning — but outside data still needs explicit validation.',
  ],
}
