// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PLAYLIST_REPORT = py`# A playlist report that uses one feature from each Python release
import tomllib                                   # 3.11: read TOML
from itertools import batched                    # 3.12: fixed-size chunks
from string.templatelib import Interpolation     # 3.14: template strings

CONFIG = """
title = "Friday mix"
page_size = 3

[defaults]
volume = 7
shuffle = false
"""

type Track = tuple[str, int]                     # 3.12: type alias statement


def first[T](items: list[T]) -> T:               # 3.12: generic function syntax
    return items[0]


def describe(track: Track) -> str:
    match track:                                 # 3.10: structural pattern matching
        case (title, seconds) if seconds >= 300:
            return f"{title} (long)"
        case (title, _):
            return title


def minutes(seconds, /, *, digits=1):            # 3.8: positional-only marker /
    return round(seconds / 60, digits)


def shout(template):
    """Upper-case only the values that were interpolated into a t-string."""
    parts = []
    for part in template:
        if isinstance(part, Interpolation):
            parts.append(str(part.value).upper())
        else:
            parts.append(part)
    return "".join(parts)


config = tomllib.loads(CONFIG)
settings = config["defaults"] | {"shuffle": True}      # 3.9: dict union
print(f"{settings=}")                                  # 3.8: self-documenting f-string

raw = ["song: Blue Skies", "song: Night Drive", "song: Paper Moon", "song: Echoes"]
seconds = [215, 187, 312, 301]
tracks: list[Track] = [                                # 3.9: list[...] without typing
    (name.removeprefix("song: "), secs)                # 3.9: removeprefix
    for name, secs in zip(raw, seconds, strict=True)   # 3.10: strict zip
]
print("Opener:", describe(first(tracks)))

for number, page in enumerate(batched(tracks, config["page_size"]), start=1):
    print(f"Page {number}: {", ".join(describe(t) for t in page)}")   # 3.12: same quotes inside

if (long_count := sum(secs >= 300 for _, secs in tracks)) > 1:      # 3.8: walrus
    print(f"{long_count} long tracks, {minutes(sum(seconds))} minutes in total")

try:
    problems = [ValueError(f"{title}: over 5 minutes") for title, secs in tracks if secs > 305]
    problems.append(KeyError("cover art"))
    raise ExceptionGroup("playlist check", problems)   # 3.11: exception groups
except* ValueError as group:
    for error in group.exceptions:
        print("warning:", error)
except* KeyError as group:
    print("missing:", *group.exceptions)

print(shout(t"Now playing {config['title']}!"))       # 3.14: t-string
`

export default {
  id: 'modern-features',
  title: 'Modern Python, version by version (3.8 → 3.14)',
  summary: 'A guided tour of what each release from 3.8 to 3.14 added — walrus, dict union, match, exception groups, PEP 695 generics, the new REPL, deferred annotations, t-strings — with runnable examples and honest notes on what is still experimental.',
  difficulty: 'intermediate',
  minutes: 60,
  prerequisites: ['string-formatting', 'function-arguments', 'dictionaries', 'match-statement', 'try-except'],
  related: ['match-statement', 'exception-groups', 'type-hints', 'generics', 'typing-collections-and-unions', 'asyncio-in-practice', 'gil-and-free-threading', 'itertools', 'string-formatting', 'dataclasses', 'records-and-slots', 'reading-errors', 'injection-attacks', 'bytecode', 'pip-and-dependencies'],
  tags: ['python versions', 'what\'s new', 'walrus operator', 'assignment expression', 'f-string =', 'positional-only', 'dict union', 'removeprefix', 'match', 'union types', 'zip strict', 'ExceptionGroup', 'except*', 'TaskGroup', 'tomllib', 'Self', 'PEP 695', 'type statement', 'PEP 701', 'batched', 'free-threading', 'JIT', 'PEP 649', 'annotationlib', 't-strings', 'PEP 750', 'PEP 758', 'PEP 779'],
  apis: [
    { name: 'name := expression (3.8)', summary: 'Assignment expression ("walrus"): binds a name and evaluates to the value, usable inside if/while/comprehensions.' },
    { name: 'f"{expr=}" (3.8)', summary: 'Self-documenting f-string: prints the expression text, =, and its repr.' },
    { name: 'def f(a, /, b, *, c) (3.8)', summary: 'Parameters before / are positional-only; after * keyword-only.' },
    { name: 'dict | dict, dict |= dict (3.9)', summary: 'Merge two dicts into a new one (right side wins) or update in place.' },
    { name: 'str.removeprefix() / str.removesuffix() (3.9)', summary: 'Remove an exact prefix/suffix once, if present.' },
    { name: 'zip(*iterables, strict=True) (3.10)', summary: 'Raises ValueError if the iterables have different lengths.' },
    { name: 'except* / ExceptionGroup (3.11)', summary: 'Raise several exceptions together and handle each type in its own clause.' },
    { name: 'tomllib.loads() / tomllib.load() (3.11)', summary: 'Parse TOML text or a binary file into dicts (read-only).' },
    { name: 'type Alias = ... / def f[T](...) (3.12)', summary: 'PEP 695 syntax for type aliases and generic functions/classes.' },
    { name: 'itertools.batched(iterable, n) (3.12)', summary: 'Yields tuples of up to n items; strict=True (3.13+) rejects a short last batch.' },
    { name: 'annotationlib.get_annotations() (3.14)', summary: 'Read annotations in VALUE, FORWARDREF or STRING format now that annotations are evaluated lazily.' },
    { name: 't"..." / string.templatelib.Template (3.14)', summary: 'Template string literal: like an f-string, but produces a Template object with the parts and values kept separate.' },
  ],
  docs: [
    { label: 'What’s New in Python (all versions)', url: 'https://docs.python.org/3/whatsnew/index.html' },
    { label: 'What’s New in Python 3.14', url: 'https://docs.python.org/3/whatsnew/3.14.html' },
    { label: 'PEP 572 — Assignment expressions', url: 'https://peps.python.org/pep-0572/' },
    { label: 'PEP 695 — Type parameter syntax', url: 'https://peps.python.org/pep-0695/' },
    { label: 'PEP 701 — Syntactic formalization of f-strings', url: 'https://peps.python.org/pep-0701/' },
    { label: 'PEP 649 — Deferred evaluation of annotations', url: 'https://peps.python.org/pep-0649/' },
    { label: 'PEP 750 — Template strings', url: 'https://peps.python.org/pep-0750/' },
    { label: 'PEP 779 — Supported status for free-threaded Python', url: 'https://peps.python.org/pep-0779/' },
    { label: 'Status of Python versions', url: 'https://devguide.python.org/versions/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Python ships a new **feature release** every October (an annual cycle set by PEP 602): 3.8 in 2019, 3.9 in 2020, … 3.14 in 2025. Each one adds syntax, library tools and interpreter improvements — and each is supported with bug and then security fixes for about five years.`,
    py`This lesson is a tour, one stop per release, of the features you'll actually meet in modern code: the **walrus operator** \`:=\`, **dict union** \`|\`, **\`match\`**, **exception groups**, the new **generic syntax**, **template strings** and more. Every runnable example works in the playground, which runs **CPython 3.14**.`,
    py`Many of these features have their own deep-dive lessons — [match](lesson:match-statement), [exception groups](lesson:exception-groups), [generics](lesson:generics), [async TaskGroup](lesson:asyncio-in-practice), [the GIL and free-threading](lesson:gil-and-free-threading). Here the goal is the *map*: what exists, which version you need, and when it's worth using.`,
  ],
  why: [
    py`**Reading other people's code.** Open-source projects and job codebases use these features daily. If \`if (m := pattern.match(line)):\` or \`def first[T](items: list[T]) -> T:\` looks like noise, you'll be slowed down everywhere.`,
    py`**Knowing what you're allowed to use.** A library that supports Python 3.9 can't use \`match\` — the file won't even parse. Knowing which version introduced a feature lets you set \`requires-python\` honestly and avoid shipping code that breaks for users on older versions.`,
    py`**Writing simpler code.** Many features replace a fiddly idiom: \`removeprefix\` replaces a slicing trick that people often got wrong with \`lstrip\`, \`zip(strict=True)\` replaces a manual length check, \`batched\` replaces a hand-written chunking loop.`,
  ],
  eli15: [
    py`Think of Python like a phone that gets a big update every autumn. Each update adds a few new tricks: a shortcut here, a new app there, a faster engine underneath.`,
    py`Old apps keep working after an update (Python is careful about that), but an app that uses a *new* trick won't work on a phone that hasn't been updated. That's why programmers say "this needs Python 3.10 or newer".`,
    py`This lesson is the changelog: for each autumn from 2019 to 2025, the handful of new tricks that matter most — and a playground that uses one trick from every year.`,
  ],
  analogy: {
    title: 'A kitchen that gets new gadgets every year',
    body: [
      py`Imagine a restaurant kitchen that gets a delivery of new gadgets every October. One year it's a peeler that removes exactly the skin (no more hacking off half the potato with a knife). Another year it's a sorting station that routes ingredients by shape. Another, a smarter oven.`,
      py`Recipes written for the new gadgets don't work in a kitchen that hasn't received them yet — so every recipe should say which gadgets it needs. And some deliveries are labelled "prototype: try it, don't rely on it yet".`,
    ],
    mapping: [
      ['the yearly delivery', 'a Python feature release (every October)'],
      ['a peeler that removes exactly the skin', 'str.removeprefix() — removes an exact prefix, unlike lstrip()'],
      ['a sorting station that routes by shape', 'the match statement (3.10)'],
      ['a smarter oven', 'interpreter speed-ups (3.11) — same recipes, cooked faster'],
      ['"needs gadget X" on a recipe', 'requires-python = ">=3.10" in pyproject.toml'],
      ['"prototype" label', 'experimental features: the JIT, the 3.13 free-threaded build'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Walrus and match, step by step',
    props: {
      code: py`readings = [18, 21, 25, 30]

def label(temp):
    match temp:
        case t if t < 20:
            return "cool"
        case t if t < 28:
            return "warm"
        case _:
            return "hot"

if (hottest := max(readings)) > 28:
    print(f"{hottest=}")

labels = [label(t) for t in readings]
print(labels)
`,
      notes: {
        4: '`match` (3.10) tries each `case` from top to bottom and runs the first one that fits.',
        5: 'A capture pattern `t` always matches and binds the value; the **guard** `if t < 20` then decides.',
        9: '`case _` is the wildcard: it matches anything, like a final `else`.',
        12: 'The walrus `:=` (3.8) computes `max(readings)`, binds it to `hottest` **and** hands the value to the comparison — all in one expression.',
        13: '`{hottest=}` (3.8) prints the expression text, an equals sign and the value: `hottest=30`.',
      },
    },
    alt: 'A step-by-step trace. readings is a list of four temperatures. The walrus expression binds hottest to 30 while comparing it with 28, so the f-string prints hottest=30. Then label is called once per reading; inside match, the guards pick cool for 18, warm for 21 and 25, and the wildcard case gives hot for 30. The final list printed is cool, warm, warm, hot.',
    caption: py`Step through and watch \`hottest\` appear in the frame *during* the \`if\` condition — that's what makes \`:=\` an expression rather than a statement.`,
  },
  syntax: [
    py`#### Python 3.8 (2019)`,
    { code: py`import re

# Walrus: assign inside an expression
log = ["INFO start", "ERROR disk full", "INFO stop"]
for line in log:
    if (match := re.match(r"ERROR (.+)", line)):
        print("problem:", match.group(1))

# Self-documenting f-strings
disk_used = 0.93
print(f"{disk_used=}", f"{disk_used * 100 = :.0f}")   # disk_used=0.93 disk_used * 100 = 93

# Positional-only (/) and keyword-only (*) parameters
def clamp(value, /, low=0, high=100, *, strict=False):
    if strict and not low <= value <= high:
        raise ValueError(value)
    return max(low, min(value, high))

print(clamp(140), clamp(-5, high=50))`, lang: 'python', title: '3.8: :=, f"{x=}", /' },
    py`Parameters before \`/\` can't be passed by keyword, so you're free to rename them later without breaking callers — many built-ins (\`len(obj, /)\`) work this way. Also new in 3.8: \`functools.cached_property\`, \`math.prod\`, and \`typing.Literal\`, \`Final\`, \`Protocol\`, \`TypedDict\`.`,
    py`#### Python 3.9 (2020)`,
    { code: py`defaults = {"theme": "light", "font": 12}
user = {"theme": "dark"}
settings = defaults | user          # new dict; right side wins
settings |= {"font": 14}            # update in place
print(settings)                     # {'theme': 'dark', 'font': 14}

print("song: Echoes".removeprefix("song: "))   # Echoes
print("report.csv".removesuffix(".csv"))       # report

# Built-in collections are generic: no "from typing import List" needed
def total(prices: list[float]) -> float:
    return sum(prices)

scores: dict[str, list[int]] = {"ada": [90, 85]}`, lang: 'python', title: '3.9: dict |, removeprefix, list[int]' },
    py`Also in 3.9: \`functools.cache\`, \`zoneinfo\` (IANA time zones), \`graphlib.TopologicalSorter\`, \`math.lcm\`, and a new **PEG parser** inside CPython — invisible to you, but it made the later syntax (like \`match\` and parenthesised context managers) possible.`,
    py`#### Python 3.10 (2021)`,
    { code: py`def handle(command: str | None) -> str:        # X | Y unions
    match (command or "").split():               # structural pattern matching
        case ["go", direction]:
            return f"walking {direction}"
        case ["take", *items] if items:
            return f"taking {', '.join(items)}"
        case ["quit" | "exit"]:
            return "bye"
        case _:
            return "unknown command"

print(handle("take lamp key"), "|", handle(None))

names = ["Ada", "Ben", "Cy"]
scores = [90, 85]
try:
    pairs = list(zip(names, scores, strict=True))
except ValueError as err:
    print(err)        # zip() argument 2 is shorter than argument 1`, lang: 'python', title: '3.10: match, X | Y, zip(strict=True)' },
    py`3.10 also made **error messages** much friendlier: \`'(' was never closed\`, \`Maybe you meant '==' or ':=' instead of '='?\`, and *Did you mean…?* suggestions for misspelled names and attributes. See [reading errors](lesson:reading-errors). Dataclasses gained \`slots=True\` and \`kw_only=True\`; \`itertools.pairwise\` arrived.`,
    py`#### Python 3.11 (2022)`,
    { code: py`import asyncio
import tomllib
from typing import Self

config = tomllib.loads('name = "sensor-hub"\nretries = 3')
print(config)                          # {'name': 'sensor-hub', 'retries': 3}

class Query:
    def __init__(self) -> None:
        self.filters: list[str] = []

    def where(self, rule: str) -> Self:    # "returns the same class as self"
        self.filters.append(rule)
        return self

print(Query().where("age > 18").where("active").filters)

async def fetch(n: int) -> int:
    await asyncio.sleep(0.01)
    return n * 10

async def main() -> None:
    async with asyncio.TaskGroup() as tg:    # structured concurrency
        tasks = [tg.create_task(fetch(n)) for n in range(3)]
    print([t.result() for t in tasks])

asyncio.run(main())`, lang: 'python', title: '3.11: tomllib, Self, TaskGroup' },
    py`3.11's other headline items: **exception groups** and \`except*\` (raise and handle several unrelated errors at once — essential for concurrent code, see [exception groups](lesson:exception-groups)), \`add_note()\` on exceptions, \`asyncio.timeout()\`, \`enum.StrEnum\`, and tracebacks that underline the **exact expression** that failed (PEP 657).`,
    { callout: 'note', title: 'CPython detail: "Faster CPython"', text: py`3.11 was the first release from the Faster CPython effort: a *specialising adaptive interpreter* (PEP 659) that rewrites bytecode at runtime into versions specialised for the types it actually sees, plus cheaper function calls and frames. Typical programs got noticeably faster without any code change. How much depends entirely on the workload — measure your own code rather than quoting a percentage. Other implementations (PyPy, GraalPy) have their own, different performance stories. See [bytecode](lesson:bytecode).` },
    py`#### Python 3.12 (2023)`,
    { code: py`from itertools import batched

type Matrix = list[list[float]]        # a lazily evaluated type alias

def first[T](items: list[T]) -> T:     # T is scoped to this function
    return items[0]

class Stack[T]:                        # generic class, no TypeVar needed
    def __init__(self) -> None:
        self.items: list[T] = []

    def push(self, item: T) -> None:
        self.items.append(item)

print(first(["a", "b"]), Matrix.__value__)

songs = ["Blue Skies", "Night Drive", "Paper Moon"]
print(f"{"; ".join(songs)}")           # reusing the same quotes is fine now
print(f"{'\n'.join(songs[:2])}")       # backslashes allowed inside {}

print(list(batched(range(7), 3)))      # [(0, 1, 2), (3, 4, 5), (6,)]`, lang: 'python', title: '3.12: PEP 695 generics, type, PEP 701 f-strings, batched' },
    py`Before 3.12 you declared \`T = TypeVar("T")\` at module level and wrote \`class Stack(Generic[T])\`; the new syntax is shorter and scopes \`T\` correctly — see [generics](lesson:generics). PEP 701 turned f-strings into real grammar: any quotes, backslashes, comments and multi-line expressions inside \`{}\`. Also: \`typing.override\`, more *Did you mean* hints (\`Did you forget to import 'math'?\`, \`Did you mean: 'self.items'?\`), and the long-deprecated \`distutils\` module was removed.`,
    py`#### Python 3.13 (2024)`,
    py`- **A new interactive shell (REPL)**: multi-line editing and history, colour, paste mode (F3), history browsing (F2), and \`exit\`/\`help\` work without parentheses. Tracebacks are coloured by default.
- **Experimental free-threaded build** (PEP 703): a separate build of CPython — usually installed as \`python3.13t\` — that can run without the **GIL** (the global lock that lets only one thread execute Python bytecode at a time), so threads can use several CPU cores in parallel.
- **Experimental JIT compiler** (PEP 744): a build-time option, off by default; groundwork for future speed-ups rather than something to rely on.
- \`copy.replace()\` for named tuples, dataclasses and more; \`itertools.batched(..., strict=True)\`; \`typing.ReadOnly\`, \`TypeIs\` and type-parameter defaults; \`warnings.deprecated\`.
- "Dead batteries" removed (PEP 594): \`cgi\`, \`crypt\`, \`telnetlib\` and other old modules are gone.`,
    { code: py`$ python3.13t -c "import sys; print(sys._is_gil_enabled())"
False`, lang: 'bash', title: 'checking for the GIL on a free-threaded build' },
    py`#### Python 3.14 (2025)`,
    { code: py`import annotationlib

def greet(user: User) -> str:          # User is defined LATER — fine in 3.14
    return f"hi {user.name}"

class User:
    name = "Ada"

print(greet.__annotations__)           # evaluated on first access, User exists now
print(greet(User()))

def check(field: Undefined) -> None:   # a name that never exists
    pass

print(annotationlib.get_annotations(check, format=annotationlib.Format.STRING))

try:
    int("forty-two")
except ValueError, TypeError:          # PEP 758: brackets optional without 'as'
    print("not a number")`, lang: 'python', title: '3.14: deferred annotations, PEP 758' },
    { code: py`from string.templatelib import Interpolation, Template

product = "<b>tea</b>"
price = 4.5
template = t"{product} costs {price:.2f}"   # NOT a str: a Template object

print(type(template).__name__)              # Template
print(template.strings)                     # ('', ' costs ', '')
for part in template.interpolations:
    print(part.expression, repr(part.value), part.format_spec)`, lang: 'python', title: '3.14: template strings (t-strings)' },
    py`- **Deferred evaluation of annotations** (PEP 649/749): annotations are no longer evaluated when the \`def\`/\`class\` runs, but the first time someone asks for them. Forward references just work, and modules with heavy annotations import faster. The new \`annotationlib\` module reads them as values, forward references or strings.
- **Template strings** (PEP 750): \`t"..."\` looks like an f-string but produces a \`Template\` holding the literal parts and the interpolated values *separately*. Code that receives it — an HTML renderer, an SQL builder, a logger — decides how to combine them, for example escaping each value. That's the safety win over f-strings.
- **\`except A, B:\`** (PEP 758): brackets are optional when you don't use \`as\`. With \`as\` they're still required.
- **Free-threaded build officially supported** (PEP 779): no longer "experimental", but still an optional, separate build — the default CPython still has the GIL.
- Also: \`return\`/\`break\`/\`continue\` inside \`finally\` now raises a \`SyntaxWarning\` (PEP 765), multiple interpreters in the standard library (\`concurrent.interpreters\`, PEP 734), \`compression.zstd\`, syntax highlighting in the REPL and *Did you mean 'while'?* for misspelled keywords.`,
    { callout: 'version', title: 'Reading this list in the future', text: py`New releases keep arriving every October; check the [version status page](https://devguide.python.org/versions/) for what's current and which versions still get security fixes. Set the minimum version your project supports in \`pyproject.toml\` (\`requires-python = ">=3.12"\`) — see [packaging](lesson:packaging).` },
  ],
  walkthrough: {
    title: 'Reading the playlist report',
    lang: 'python',
    code: PLAYLIST_REPORT,
    intro: py`The playground program uses at least one feature from every release. Press **Guide** in the playground to step through it there.`,
    steps: [
      { lines: [2, 4], text: py`Three imports, three versions: \`tomllib\` (3.11) parses TOML, \`itertools.batched\` (3.12) chunks an iterable, \`string.templatelib\` (3.14) holds the classes behind t-strings.` },
      { lines: [15, 15], text: py`The 3.12 \`type\` statement creates a named **type alias**. Its value is evaluated lazily, so it may even mention classes defined later in the file.` },
      { lines: [18, 19], text: py`\`[T]\` after the name declares a **type parameter** (PEP 695): "whatever type the list holds, I return that type". It's information for type checkers; at runtime the function is ordinary.` },
      { lines: [22, 27], text: py`\`match\` destructures the \`(title, seconds)\` tuple and binds both names. The **guard** \`if seconds >= 300\` refines the first case; the second case catches everything else and ignores the length with \`_\`.` },
      { lines: [30, 31], text: py`\`/\` makes \`seconds\` positional-only; \`*\` makes \`digits\` keyword-only. So \`minutes(1015)\` and \`minutes(1015, digits=2)\` work, but \`minutes(seconds=1015)\` is a \`TypeError\`.` },
      { lines: [34, 42], text: py`\`shout\` receives a **Template**. Iterating it yields the literal strings and \`Interpolation\` objects in order; it upper-cases only the values, leaving the literal text as written.` },
      { lines: [45, 47], text: py`\`tomllib.loads\` turns the TOML text into nested dicts. \`|\` builds a **new** dict where the right side wins, and \`f"{settings=}"\` prints \`settings={...}\` for quick debugging.` },
      { lines: [51, 54], text: py`\`list[Track]\` uses a built-in type as a generic (3.9). \`removeprefix\` strips exactly \`"song: "\` once. \`zip(..., strict=True)\` raises \`ValueError\` if \`raw\` and \`seconds\` ever get out of step — instead of silently dropping tracks.` },
      { lines: [57, 58], text: py`\`batched\` yields tuples of up to \`page_size\` tracks. Inside the f-string, \`", ".join(...)\` reuses double quotes — a \`SyntaxError\` before 3.12, legal since PEP 701.` },
      { lines: [60, 61], text: py`The walrus computes the count, binds \`long_count\` and compares it, so the count is available inside the \`if\` body without computing it twice.` },
      { lines: [63, 71], text: py`An \`ExceptionGroup\` bundles several exceptions. Each \`except*\` clause handles **its matching part** of the group — here both clauses run, one for the \`ValueError\`s and one for the \`KeyError\`.` },
      { lines: [73, 73], text: py`A t-string literal: \`t"..."\` creates a Template, and \`shout\` decides how to render it.` },
    ],
  },
  playground: {
    title: 'Playlist report: one feature per release',
    objective: 'Run the report, find the version comment on each line, then use the experiments to bend each feature.',
    files: { 'main.py': PLAYLIST_REPORT },
    expected: py`\`\`\`text
settings={'volume': 7, 'shuffle': True}
Opener: Blue Skies
Page 1: Blue Skies, Night Drive, Paper Moon (long)
Page 2: Echoes (long)
2 long tracks, 16.9 minutes in total
warning: Paper Moon: over 5 minutes
missing: 'cover art'
Now playing FRIDAY MIX!
\`\`\`

This file needs **3.14** to run: older interpreters stop at the first line they can't parse (the \`type\` statement, \`def first[T]\` or \`t"..."\`).`,
    experiments: [
      {
        id: 'strict-zip',
        task: py`Add a fifth song, \`"song: Coda"\`, to \`raw\` only, and run. Read the error. Then give it a length of \`95\` seconds in \`seconds\` so the report works again.`,
        hint: py`\`strict=True\` refuses lists of different lengths. Both lists need five items.`,
        tests: [
          { name: 'there are five tracks', code: py`assert len(tracks) == 5, 'Add "song: Coda" to raw and 95 to seconds'` },
          { name: 'Coda appears in the report', code: py`assert "Coda" in output` },
        ],
        explain: py`Without \`strict=True\`, \`zip\` stops at the shorter list and *silently* drops the extra song — a bug that can hide for months. \`strict=True\` (3.10) turns the mismatch into \`ValueError: zip() argument 2 is shorter than argument 1\` at the exact moment it happens.`,
      },
      {
        id: 'page-size',
        task: py`Change the TOML text so that each page holds **2** tracks. Predict how many \`Page\` lines you'll get.`,
        hint: py`Edit \`page_size = 3\` inside the \`CONFIG\` string.`,
        tests: [
          { name: 'page size is 2', code: py`assert config["page_size"] == 2` },
          { name: 'two full pages', code: py`assert "Page 2: Paper Moon (long), Echoes (long)" in output` },
        ],
        explain: py`\`batched(tracks, 2)\` yields \`(t1, t2)\`, \`(t3, t4)\`. Before 3.12 you'd write this with slicing in a \`range(0, len(tracks), n)\` loop — which only works on sequences, while \`batched\` works on any iterable, lazily.`,
      },
      {
        id: 'short-tracks',
        task: py`Add a case to \`describe\` so tracks **under 200 seconds** come out as \`"<title> (short)"\`, e.g. \`describe(("Intro", 95))\` → \`"Intro (short)"\`.`,
        hint: py`Add \`case (title, seconds) if seconds < 200:\` *above* the catch-all \`case (title, _):\` — cases are tried top to bottom.`,
        tests: [
          { name: 'short tracks are labelled', code: py`assert describe(("Intro", 95)) == "Intro (short)"` },
          { name: 'long tracks still work', code: py`assert describe(("Epic", 400)) == "Epic (long)"` },
          { name: 'normal tracks are plain', code: py`assert describe(("Song", 250)) == "Song"` },
        ],
        explain: py`\`match\` tries cases in order and stops at the first that matches *and* whose guard is true. Put the new case after the catch-all and it would never run — the catch-all matches every 2-tuple.`,
      },
      {
        id: 'merge-volume',
        task: py`Right after \`settings = ...\`, use the in-place operator \`|=\` to set \`volume\` to \`10\`. The original \`config["defaults"]\` must still say \`7\`.`,
        tests: [
          { name: 'settings volume is 10', code: py`assert settings["volume"] == 10` },
          { name: 'the defaults were not changed', code: py`assert config["defaults"]["volume"] == 7, 'Use |= on settings, not on config["defaults"]'` },
          { name: 'shuffle is still on', code: py`assert settings["shuffle"] is True` },
        ],
        explain: py`\`a | b\` builds a **new** dict, so \`settings\` is independent of \`config["defaults"]\`. \`settings |= {"volume": 10}\` then updates that new dict in place, like \`settings.update(...)\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Seven releases in one picture',
    props: {
      width: 760,
      height: 260,
      nodes: [
        { id: 'v38', label: '3.8', note: '2019', x: 60, y: 130, tone: 'paper' },
        { id: 'v39', label: '3.9', note: '2020', x: 167, y: 130, tone: 'paper' },
        { id: 'v310', label: '3.10', note: '2021', x: 274, y: 130, tone: 'yellow' },
        { id: 'v311', label: '3.11', note: '2022', x: 381, y: 130, tone: 'blue' },
        { id: 'v312', label: '3.12', note: '2023', x: 488, y: 130, tone: 'yellow' },
        { id: 'v313', label: '3.13', note: '2024', x: 595, y: 130, tone: 'red' },
        { id: 'v314', label: '3.14', note: '2025', x: 702, y: 130, tone: 'ink' },
      ],
      edges: [
        { from: 'v38', to: 'v39' },
        { from: 'v39', to: 'v310' },
        { from: 'v310', to: 'v311' },
        { from: 'v311', to: 'v312' },
        { from: 'v312', to: 'v313' },
        { from: 'v313', to: 'v314' },
      ],
      steps: [
        { focus: ['v38'], text: py`**3.8** — \`:=\` assigns inside expressions, \`f"{x=}"\` for debugging, \`/\` for positional-only parameters.` },
        { focus: ['v39'], edges: ['v38->v39'], text: py`**3.9** — \`dict | dict\`, \`removeprefix\`/\`removesuffix\`, \`list[int]\` without \`typing\`, and a new PEG parser under the hood.` },
        { focus: ['v310'], edges: ['v39->v310'], text: py`**3.10** — \`match\`, \`int | None\` unions, \`zip(strict=True)\`, and much friendlier error messages.` },
        { focus: ['v311'], edges: ['v310->v311'], text: py`**3.11** — a faster interpreter, exception groups and \`except*\`, \`TaskGroup\`, \`tomllib\`, \`typing.Self\`, precise traceback underlines.` },
        { focus: ['v312'], edges: ['v311->v312'], text: py`**3.12** — \`def f[T]\`, \`class C[T]\`, the \`type\` statement, f-strings with any quotes inside, \`itertools.batched\`.` },
        { focus: ['v313'], edges: ['v312->v313'], text: py`**3.13** — a new REPL, an *experimental* free-threaded build (no GIL) and an *experimental* JIT, \`copy.replace()\`.` },
        { focus: ['v314'], edges: ['v313->v314'], text: py`**3.14** — lazy annotations, \`t"..."\` template strings, \`except A, B:\`, and the free-threaded build becomes *officially supported* (still optional).` },
      ],
    },
    alt: 'A timeline of seven boxes from 3.8 (2019) to 3.14 (2025), connected left to right. Each step highlights one release and lists its headline features: walrus and f-string equals for 3.8, dict union and removeprefix for 3.9, match and union types for 3.10, speed and exception groups for 3.11, generic syntax and new f-strings for 3.12, new REPL and experimental free-threading for 3.13, lazy annotations and template strings for 3.14.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Two kinds of change arrive in a release. **Syntax** changes (\`:=\`, \`match\`, \`def f[T]\`, \`t"..."\`) need a newer *parser*: an older Python can't even read the file and stops with a \`SyntaxError\` before running a single line. **Library** changes (\`removeprefix\`, \`tomllib\`, \`batched\`) are just new functions: an older Python reads the file fine and fails only when that line runs (\`AttributeError\` or \`ImportError\`).`,
      py`That's why you can guard a library feature at runtime but not a syntax feature:`,
      { code: py`import sys

if sys.version_info >= (3, 12):
    from itertools import batched
else:                                   # fallback for older Pythons
    from itertools import islice

    def batched(iterable, n):
        it = iter(iterable)
        while chunk := tuple(islice(it, n)):
            yield chunk

print(list(batched("abcdefg", 3)))`, lang: 'python', title: 'a library feature with a fallback' },
    ],
    technical: [
      py`**Walrus scoping.** \`:=\` binds in the *enclosing* function or module scope — even inside a comprehension, where the loop variable itself stays private. So \`[y for x in data if (y := f(x)) > 0]\` leaves \`y\` defined afterwards. It can't rebind a comprehension's own loop variable and isn't allowed as a bare statement (\`x := 5\` alone is a \`SyntaxError\`; use \`=\`).`,
      py`**\`X | Y\` at runtime.** Since 3.10, \`int | str\` creates a \`types.UnionType\` object, so it works in annotations *and* in \`isinstance(value, int | str)\`. In 3.9 the same expression raised \`TypeError: unsupported operand type(s) for |\` when evaluated.`,
      py`**PEP 695 scoping.** In \`def first[T](...)\`, CPython creates a tiny hidden scope holding \`T\`, so the type parameter can't leak or clash with module names. The alias in \`type Track = tuple[str, int]\` is a \`TypeAliasType\` whose \`__value__\` is computed lazily on first access.`,
      py`**Lazy annotations (3.14).** The compiler now turns each function's or class's annotations into a small hidden function. Nothing is evaluated at \`def\` time; reading \`__annotations__\` (or \`annotationlib.get_annotations\`) calls it. If a name still doesn't exist, \`Format.VALUE\` raises \`NameError\`, \`Format.FORWARDREF\` returns \`ForwardRef\` placeholders and \`Format.STRING\` returns the source text. The old opt-in \`from __future__ import annotations\` (which turned every annotation into a string) still works but is no longer needed for forward references.`,
      py`**t-strings.** A \`t"..."\` literal is compiled into a \`string.templatelib.Template\`: \`strings\` (a tuple of the literal parts, always one longer than \`interpolations\`) and \`interpolations\` (each with \`value\`, \`expression\`, \`conversion\`, \`format_spec\`). Nothing is concatenated, and a Template deliberately has no \`__str__\` rendering — you must pass it to code that knows how to render it safely.`,
      { callout: 'note', title: 'CPython detail: the GIL and free-threading', text: py`The **GIL** (global interpreter lock) belongs to CPython, not to the Python language — PyPy has its own, Jython and IronPython never had one. The free-threaded build (3.13 experimental, 3.14 supported via PEP 779) replaces it with finer-grained locking and other changes. It's a *separate* build: the default \`python3.14\` still has a GIL. In a free-threaded interpreter, importing a C extension that hasn't declared itself thread-safe re-enables the GIL. Single-threaded code can run somewhat slower there; measure. Details in [the GIL & free-threading](lesson:gil-and-free-threading).` },
    ],
    production: [
      py`**Pick a minimum version on purpose.** Applications can use the newest Python they deploy on. Libraries usually support every version still receiving security fixes, which means waiting before using new syntax. Write it down in \`pyproject.toml\` (\`requires-python\`) and run CI on every supported version — see [pip & dependencies](lesson:pip-and-dependencies).`,
      py`**Let tools modernise for you.** Linters such as Ruff (its \`UP\` "pyupgrade" rules) rewrite old idioms automatically for your target version: \`typing.List[int]\` → \`list[int]\`, \`Optional[str]\` → \`str | None\`, \`TypeVar\` boilerplate → PEP 695 syntax. See [code quality tools](lesson:code-quality-tools).`,
      py`**Upgrading a service** means more than new features: read the *What's New* "Removed" and "Deprecated" sections (3.12 removed \`distutils\`, \`imp\`, \`asyncore\`; 3.13 removed the PEP 594 "dead batteries"), run the test suite with warnings as errors (\`python -W error -m pytest\`), check every compiled dependency has wheels for the new version, and benchmark before claiming a speed-up.`,
      py`**Experimental means experimental.** The JIT (3.13+) is off by default and its performance varies between workloads. The free-threaded build is supported in 3.14 but still optional and needs thread-safe code and compatible extensions. Try them in staging with your real workload; don't plan capacity around a blog post.`,
    ],
  },
  mistakes: [
    {
      title: 'Using lstrip()/rstrip() to remove a prefix or suffix',
      wrong: { code: py`print("test_settings.py".lstrip("test_"))   # 'ings.py' — strips CHARACTERS t, e, s, _
print("report_temp.tmp".rstrip(".tmp"))    # 'report_te'`, lang: 'python' },
      right: { code: py`print("test_settings.py".removeprefix("test_"))   # 'settings.py'
print("report_temp.tmp".removesuffix(".tmp"))      # 'report_temp'`, lang: 'python' },
      explanation: py`\`lstrip\`/\`rstrip\` take a *set of characters* and keep stripping while the next character is in the set. \`removeprefix\`/\`removesuffix\` (3.9) remove one exact string, once, only if it's there.`,
    },
    {
      title: 'Forgetting parentheses around the walrus',
      wrong: { code: py`data = [3, 8, 1]
if n := len(data) > 2:        # binds n to the RESULT of len(data) > 2
    print("n is", n)          # n is True`, lang: 'python' },
      right: { code: py`data = [3, 8, 1]
if (n := len(data)) > 2:
    print("n is", n)          # n is 3`, lang: 'python' },
      explanation: py`\`:=\` has the lowest precedence of almost everything, so it grabs the whole expression to its right. Wrap the assignment in parentheses whenever it's part of a bigger condition.`,
    },
    {
      title: 'Using new syntax in code that must run on older Pythons',
      wrong: { code: py`# pyproject.toml says requires-python = ">=3.9"
def parse(value: int | str) -> int:      # TypeError when evaluated on 3.9
    match value:                          # SyntaxError on 3.9: the file won't parse
        case int():
            return value
        case _:
            return int(value)`, lang: 'python', static: true },
      right: { code: py`from typing import Union

def parse(value: Union[int, str]) -> int:   # works on 3.9
    if isinstance(value, int):
        return value
    return int(value)

print(parse("42"))`, lang: 'python' },
      explanation: py`Either raise \`requires-python\` to the version your syntax needs, or stick to older syntax. CI should run your tests on the oldest version you claim to support — that's where this mistake shows up.`,
    },
    {
      title: 'Treating a t-string like an f-string',
      wrong: { code: py`name = "Ada"
greeting = t"Hi {name}"
print(greeting.upper())   # AttributeError: 'string.templatelib.Template' object has no attribute 'upper'`, lang: 'python', static: true },
      right: { code: py`name = "Ada"
greeting = f"Hi {name}"   # want a string right now? use an f-string
print(greeting.upper())`, lang: 'python' },
      explanation: py`A t-string is **not** a \`str\`; it's a Template meant to be handed to a renderer (an HTML escaper, an SQL builder). If you just want text, an f-string is still the right tool.`,
    },
    {
      title: 'Using as with the new bracket-free except',
      wrong: { code: py`try:
    port = int(raw_port)
except ValueError, TypeError as err:   # SyntaxError, even on 3.14
    print(err)`, lang: 'python', static: true },
      right: { code: py`raw_port = None
try:
    port = int(raw_port)
except (ValueError, TypeError) as err:
    print(err)`, lang: 'python' },
      explanation: py`PEP 758 (3.14) allows \`except A, B:\` only **without** \`as\`. With \`as\` the brackets are still required, so the old form keeps working everywhere — keep using it in code that must also run on 3.13 and earlier.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: invalid syntax (pointing at match, a type statement, def f[T] or a t-string)`,
      cause: py`The code uses syntax newer than the interpreter running it. Very common when a script runs with a system \`python3\` older than the one you developed with.`,
      fix: py`Run \`python --version\` (or print \`sys.version\`) in the failing environment. Use the right interpreter/virtual environment, or rewrite with older syntax and set \`requires-python\` honestly.`,
    },
    {
      symptom: py`ValueError: zip() argument 2 is shorter than argument 1`,
      cause: py`\`zip(..., strict=True)\` found that two iterables don't have the same length — the data really is out of step.`,
      fix: py`Find where the lists diverged (a filter applied to only one, a missing row) and fix the data. Don't "fix" it by removing \`strict=True\`.`,
    },
    {
      symptom: py`SyntaxError: multiple exception types must be parenthesized when using 'as'`,
      cause: py`\`except ValueError, TypeError as err:\` — the 3.14 bracket-free form doesn't allow \`as\`.`,
      fix: py`Write \`except (ValueError, TypeError) as err:\`.`,
    },
    {
      symptom: py`NameError: name 'User' is not defined (when reading __annotations__ in 3.14)`,
      cause: py`Annotations are evaluated lazily now; reading them with the default VALUE format fails if a referenced name doesn't exist at that moment.`,
      fix: py`Use \`annotationlib.get_annotations(obj, format=annotationlib.Format.FORWARDREF)\` (or \`STRING\`) when names may be missing, or make sure the module is fully imported first.`,
    },
    {
      symptom: py`SyntaxWarning: 'return' in a 'finally' block`,
      cause: py`3.14 (PEP 765) warns because a \`return\`, \`break\` or \`continue\` in \`finally\` silently swallows any exception in flight.`,
      fix: py`Move the \`return\` after the \`try\` statement, or handle the exception explicitly in an \`except\` clause.`,
    },
  ],
  bestPractices: [
    'Decide your minimum Python version deliberately, record it in requires-python, and test on it in CI.',
    'Prefer removeprefix/removesuffix over lstrip/rstrip whenever you mean an exact string.',
    'Use zip(strict=True) when the iterables are supposed to line up — silent truncation hides bugs.',
    'Use := where it removes duplication (regex matches, read loops); avoid it where a plain assignment reads better.',
    'Write X | None and list[int] in new code (3.10+); let a linter upgrade old annotations.',
    'Use t-strings for anything that must be escaped (HTML, SQL, shell); keep f-strings for plain text.',
    'Treat experimental features (JIT, 3.13 free-threading) as experiments: measure on your workload before relying on them.',
  ],
  whenToUse: {
    use: [
      'match for branching on the *shape* of data (commands, JSON-like dicts, tuples).',
      'Exception groups when several independent operations can fail at once (concurrent tasks, batch validation).',
      'tomllib for reading configuration and pyproject.toml files.',
      'PEP 695 syntax for generic functions and classes in 3.12+ code bases.',
      't-strings for building HTML, SQL or log messages where values need special handling.',
    ],
    avoid: [
      'Any newer syntax in libraries whose users still run older versions.',
      'match as a replacement for a simple if/elif on one value — a dict lookup or if is often clearer.',
      'Walrus chains that cram several assignments into one condition.',
      'The free-threaded build for code with non-thread-safe shared state or extensions that don\'t support it.',
    ],
  },
  comparison: {
    title: 'Release highlights at a glance',
    headers: ['release', 'language & syntax', 'standard library & typing', 'interpreter & tooling'],
    rows: [
      ['3.8 (2019)', ':= walrus, f"{x=}", / positional-only', 'cached_property, math.prod, Literal, Final, Protocol, TypedDict', 'importlib.metadata'],
      ['3.9 (2020)', 'dict | and |=, decorators accept any expression', 'removeprefix/removesuffix, list[int], zoneinfo, graphlib, functools.cache', 'new PEG parser'],
      ['3.10 (2021)', 'match, X | Y unions, parenthesised context managers', 'zip(strict=True), pairwise, dataclass slots/kw_only', 'much better error messages'],
      ['3.11 (2022)', 'except* and ExceptionGroup', 'tomllib, TaskGroup, asyncio.timeout, Self, StrEnum, add_note()', 'specialising interpreter (faster), precise traceback locations'],
      ['3.12 (2023)', 'def f[T], class C[T], type statement, PEP 701 f-strings', 'itertools.batched, typing.override, Path.walk', 'more "Did you mean" hints, distutils removed'],
      ['3.13 (2024)', '—', 'copy.replace, ReadOnly, TypeIs, warnings.deprecated, batched(strict=)', 'new REPL, experimental free-threading and JIT, dead batteries removed'],
      ['3.14 (2025)', 'lazy annotations, t"..." template strings, except A, B:', 'annotationlib, string.templatelib, concurrent.interpreters, compression.zstd', 'free-threaded build supported (PEP 779), REPL highlighting, SyntaxWarning for return in finally'],
    ],
    note: py`A highlight reel, not a complete list — each release's *What's New* page is the authoritative source. Years are the October release of each version.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'modern-features-q1',
      type: 'mcq',
      prompt: 'Your project must support Python **3.9**. Which feature can you use?',
      options: [
        { text: 'match statements', why: 'match is 3.10+; on 3.9 the file fails to parse with SyntaxError.' },
        'str.removeprefix()',
        { text: 'def first[T](items: list[T]) -> T', why: 'PEP 695 type parameter syntax is 3.12+.' },
        { text: 'zip(a, b, strict=True)', why: 'The strict parameter was added in 3.10; on 3.9 it is a TypeError.' },
      ],
      answer: 1,
      explanation: py`\`removeprefix\`/\`removesuffix\`, dict \`|\` and \`list[int]\` annotations are all 3.9 features. Everything else here needs 3.10 or later.`,
    },
    {
      id: 'modern-features-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`x = 7
print(f"{x * 2 = }")`,
      answer: 'x * 2 = 14',
      accept: ['x * 2 = 14'],
      explanation: py`The \`=\` specifier (3.8) prints the expression text exactly as written — including the spaces around \`=\` — followed by the value.`,
    },
    {
      id: 'modern-features-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`defaults = {"theme": "light", "size": 12}
user = {"theme": "dark"}
print(defaults | user, user | defaults)`,
      options: [
        "{'theme': 'dark', 'size': 12} {'theme': 'light', 'size': 12}",
        { text: "{'theme': 'dark', 'size': 12} {'theme': 'dark', 'size': 12}", why: 'With |, the RIGHT operand wins on duplicate keys, so user | defaults ends with the defaults’ "light".' },
        { text: "{'theme': 'light', 'size': 12} {'theme': 'dark', 'size': 12}", why: 'That is the reverse: the right-hand dict overrides the left.' },
        { text: 'TypeError: unsupported operand type(s) for |', why: 'Dicts support | since 3.9.' },
      ],
      answer: 0,
      explanation: py`\`a | b\` copies \`a\` and then updates it with \`b\`: the right side wins. Key order follows first insertion, so \`'theme'\` stays first in both results.`,
    },
    {
      id: 'modern-features-q4',
      type: 'bug',
      prompt: 'This should print `api`, `models`, `settings`, but the last line prints `ings`. Click the buggy line.',
      code: py`files = ["test_api.py", "test_models.py", "test_settings.py"]
for name in files:
    module = name.lstrip("test_").removesuffix(".py")
    print(module)`,
      answerLine: 3,
      explanation: py`\`lstrip("test_")\` strips any of the characters t, e, s and _ — including the \`s\`, \`e\`, \`t\`, \`t\` at the start of "settings". Use \`name.removeprefix("test_")\`.`,
    },
    {
      id: 'modern-features-q5',
      type: 'fill',
      prompt: 'Make `image` positional-only and `width` keyword-only, so the only valid call style is `resize("cat.png", width=200)`.',
      code: py`def resize(image, ___, *, width):
    return f"{image} -> {width}px"`,
      answer: [['/']],
      explanation: py`Parameters before \`/\` (3.8) are positional-only; parameters after \`*\` are keyword-only. \`resize(image="cat.png", width=200)\` now raises \`TypeError: ... positional-only arguments passed as keyword arguments\`.`,
    },
    {
      id: 'modern-features-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`try:
    raise ExceptionGroup("upload", [ValueError("size"), TypeError("name")])
except* ValueError as group:
    print("value:", len(group.exceptions))
except* TypeError as group:
    print("type:", len(group.exceptions))`,
      options: [
        'value: 1 then type: 1',
        { text: 'value: 1 only', why: 'Unlike plain except, several except* clauses can run: each handles the part of the group that matches it.' },
        { text: 'value: 2 only', why: 'except* ValueError receives a group containing only the matching ValueError, not the whole group.' },
        { text: 'An unhandled ExceptionGroup traceback', why: 'Both members are handled by one of the clauses, so nothing is left to re-raise.' },
      ],
      answer: 0,
      explanation: py`\`except*\` (3.11) splits the group: the first clause gets a group with the \`ValueError\`, the second a group with the \`TypeError\`. Anything unmatched would be re-raised.`,
    },
    {
      id: 'modern-features-q7',
      type: 'short',
      prompt: 'Explain the difference between `f"<p>{comment}</p>"` and `t"<p>{comment}</p>"` (3.14), and why the t-string version can be safer for HTML.',
      answer: py`The f-string immediately produces a finished \`str\` — the comment's text is pasted in as-is, so \`<script>\` in user input becomes real HTML. The t-string produces a \`Template\` that keeps the literal parts and the interpolated values separate; an HTML renderer can escape each value (turning \`<\` into \`&lt;\`) while leaving the trusted literal markup alone. The safety comes from the receiving function, which now *can* tell the difference.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'legacy-cleanup',
      title: 'Fix the legacy helpers',
      difficulty: 'intermediate',
      prompt: py`Two helpers from an old code base have bugs that 3.9 features fix cleanly.

1. \`clean_filename(name)\` must remove a leading \`"draft_"\` **once, only if present**, and a trailing \`".tmp"\` **once, only if present**:
   - \`clean_filename("draft_dates.tmp")\` → \`"dates"\`
   - \`clean_filename("report_temp.tmp")\` → \`"report_temp"\`
   - \`clean_filename("draft_draft_x")\` → \`"draft_x"\`
   - \`clean_filename("final.txt")\` → \`"final.txt"\`
2. \`merge_settings(defaults, user, cli)\` must return a **new** dict where \`cli\` beats \`user\`, and \`user\` beats \`defaults\`. None of the three input dicts may be modified.`,
      files: {
        'main.py': py`def clean_filename(name):
    # legacy: looks right, but strips CHARACTERS, not a prefix/suffix
    return name.lstrip("draft_").rstrip(".tmp")


def merge_settings(defaults, user, cli):
    # legacy: changes the caller's defaults dict!
    defaults.update(user)
    defaults.update(cli)
    return defaults


print(clean_filename("draft_dates.tmp"))
print(merge_settings({"theme": "light", "font": 12}, {"theme": "dark"}, {"font": 16}))
`,
      },
      hints: [
        'Which 3.9 string methods remove one exact string? Which operator merges dicts into a new one?',
        'Chain name.removeprefix("draft_").removesuffix(".tmp"). For dicts, a | b | c is evaluated left to right, and the right side wins.',
        'return defaults | user | cli',
      ],
      solution: {
        explanation: py`\`lstrip("draft_")\` removes *any* of the characters d, r, a, f, t, _ from the left, so \`"draft_dates"\` loses \`"draft_dat"\` and becomes \`"es"\`; \`rstrip(".tmp")\` similarly eats into \`"temp"\`. \`removeprefix\`/\`removesuffix\` compare one exact string, once. For the settings, \`defaults | user | cli\` builds a brand-new dict, applying each layer left to right so later layers win — and because \`|\` never mutates its operands, the caller's dicts are untouched (the legacy \`update\` silently changed the shared defaults for every later call).`,
        files: {
          'main.py': py`def clean_filename(name):
    return name.removeprefix("draft_").removesuffix(".tmp")


def merge_settings(defaults, user, cli):
    return defaults | user | cli


print(clean_filename("draft_dates.tmp"))
print(merge_settings({"theme": "light", "font": 12}, {"theme": "dark"}, {"font": 16}))
`,
        },
      },
      tests: [
        { name: 'draft_dates.tmp -> dates', code: py`assert clean_filename("draft_dates.tmp") == "dates"` },
        { name: 'only an exact suffix is removed', code: py`assert clean_filename("report_temp.tmp") == "report_temp"` },
        { name: 'the prefix is removed only once', code: py`assert clean_filename("draft_draft_x") == "draft_x"` },
        { name: 'other names are unchanged', code: py`assert clean_filename("final.txt") == "final.txt"` },
        { name: 'later layers win', code: py`assert merge_settings({"theme": "light", "font": 12}, {"theme": "dark", "font": 13}, {"font": 16}) == {"theme": "dark", "font": 16}` },
        { name: 'inputs are not modified', code: py`defaults, user, cli = {"theme": "light"}, {"theme": "dark"}, {"font": 16}
merge_settings(defaults, user, cli)
assert defaults == {"theme": "light"} and user == {"theme": "dark"} and cli == {"font": 16}, 'Build a new dict instead of updating the inputs'` },
      ],
    },
    {
      id: 'safe-html',
      title: 'Safe HTML with t-strings (3.14)',
      difficulty: 'intermediate',
      prompt: py`Write \`html(template)\` that renders a **t-string** to a \`str\`, escaping every interpolated value with \`html.escape\` while leaving the literal parts untouched.

- Literal text is copied as written: \`html(t"<p>hi</p>")\` → \`"<p>hi</p>"\`.
- Each interpolated value is formatted with its format spec (\`format(value, spec)\`), then escaped: with \`comment = "<script>"\`, \`html(t"<p>{comment}</p>")\` → \`"<p>&lt;script&gt;</p>"\`, and \`html(t"<b>{4.5:.2f}</b>")\` → \`"<b>4.50</b>"\`.
- Passing a plain \`str\` raises \`TypeError\` (so nobody can sneak in an f-string).

You can ignore \`!r\`/\`!s\` conversions.`,
      files: {
        'main.py': py`from html import escape
from string.templatelib import Interpolation, Template


def html(template):
    """Render a t-string, escaping every interpolated value."""
    # TODO: loop over the template's parts
    return ""


comment = "<script>alert('hi')</script>"
print(html(t"<p class='comment'>{comment}</p>"))
`,
      },
      hints: [
        'Iterating a Template yields its parts in order: plain str pieces and Interpolation objects.',
        'For an Interpolation, use part.value and part.format_spec: escape(format(part.value, part.format_spec)). Check isinstance(template, Template) first.',
        'parts = []; for part in template: parts.append(escape(format(part.value, part.format_spec)) if isinstance(part, Interpolation) else part); return "".join(parts)',
      ],
      solution: {
        explanation: py`A Template never mixes trusted and untrusted text: iterating it gives the literal \`str\` pieces (written by the programmer, trusted) and \`Interpolation\` objects (values, possibly from users) in order. Escaping only the interpolations means \`<p class='comment'>\` stays real markup while \`<script>\` from the comment becomes harmless \`&lt;script&gt;\`. Applying \`format(value, format_spec)\` first keeps \`{price:.2f}\` working. Rejecting plain strings matters: an f-string has already pasted the value in, so there is nothing left to escape — that's exactly the injection risk t-strings were designed to remove (see [injection attacks](lesson:injection-attacks)).`,
        files: {
          'main.py': py`from html import escape
from string.templatelib import Interpolation, Template


def html(template):
    """Render a t-string, escaping every interpolated value."""
    if not isinstance(template, Template):
        raise TypeError("html() needs a t-string, e.g. html(t'<p>{text}</p>')")
    parts = []
    for part in template:
        if isinstance(part, Interpolation):
            parts.append(escape(format(part.value, part.format_spec)))
        else:
            parts.append(part)
    return "".join(parts)


comment = "<script>alert('hi')</script>"
print(html(t"<p class='comment'>{comment}</p>"))
`,
        },
      },
      tests: [
        { name: 'literal text is unchanged', code: py`assert html(t"<p>hi</p>") == "<p>hi</p>"` },
        { name: 'interpolated values are escaped', code: py`comment = "<script>"
assert html(t"<p>{comment}</p>") == "<p>&lt;script&gt;</p>"` },
        { name: 'format specs are applied', code: py`assert html(t"<b>{4.5:.2f}</b>") == "<b>4.50</b>"` },
        { name: 'plain strings are rejected', code: py`with raises(TypeError):
    html("<p>not a template</p>")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'modern-features-walrus',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does the walrus operator `:=` do, and when is it good style?',
      answer: 'It is an assignment expression (3.8): it binds a name and evaluates to the value, so you can assign inside a condition or comprehension. Good for avoiding a repeated call — regex matches, read-until-empty loops, filtering on a computed value; bad when it makes a line harder to read than two statements.',
      explanation: py`Classic uses: \`if (m := pattern.search(line)):\`, \`while (chunk := f.read(4096)):\`, \`[y for x in data if (y := clean(x))]\`. It binds in the enclosing scope (even from a comprehension), has very low precedence (wrap it in parentheses), and can't be used as a standalone statement.`,
      code: { lang: 'python', code: py`import re

for line in ["id=42", "nothing", "id=7"]:
    if (match := re.search(r"id=(\d+)", line)):
        print(int(match.group(1)))` },
      whyAsked: 'It appears in modern code constantly and tests whether you know both the mechanics and the style trade-off.',
      mistakes: ['Forgetting parentheses: if n := len(x) > 2 binds a bool', 'Using it everywhere to look clever', 'Not knowing it leaks out of comprehensions into the enclosing scope'],
      followUps: ['Why can\'t you write x := 5 as a statement?', 'What scope does := bind in inside a comprehension?'],
      modelAnswer: 'The walrus operator, added in 3.8, is an assignment expression: it assigns a value to a name and also returns that value, so I can use it inside an if, a while or a comprehension. The textbook case is a regex: if (m := pattern.match(line)) both tests and keeps the match object. Another is reading in chunks with while (chunk := f.read(4096)). It has very low precedence, so I always wrap it in parentheses, and inside a comprehension it binds in the surrounding scope. I use it when it removes a duplicated call; if two plain lines are clearer, I write two lines.',
    },
    {
      id: 'modern-features-lazy-annotations',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What happens when this runs on Python 3.13, and on 3.14?',
      code: { lang: 'python', code: py`def greet(user: User) -> str:
    return "hi"

class User:
    pass

print(greet.__annotations__)` },
      options: [
        'Both print the annotations dict',
        '3.13: NameError at the def line; 3.14: prints {\'user\': <class \'__main__.User\'>, \'return\': <class \'str\'>}',
        '3.13 prints the dict; 3.14 raises NameError',
        'Both raise NameError',
      ],
      correctOption: 1,
      answer: 'On 3.13 the def line raises NameError because annotations are evaluated immediately and User does not exist yet. On 3.14 annotations are evaluated lazily (PEP 649/749), so by the time __annotations__ is read, User exists and the dict prints with real classes.',
      explanation: py`Before 3.14 the workaround was quoting (\`user: "User"\`) or \`from __future__ import annotations\`, which stores every annotation as a string. In 3.14 the annotations become a hidden function called on first access; \`annotationlib.get_annotations\` can also return forward references or strings if a name is still missing.`,
      whyAsked: 'Checks awareness of a recent semantic change that affects libraries that read annotations (dataclasses, validation libraries, dependency injection).',
      mistakes: ['Thinking annotations were always strings', 'Not knowing about from __future__ import annotations', 'Assuming 3.14 validates the types'],
      followUps: ['How would you read annotations that may reference undefined names?', 'What did from __future__ import annotations do?'],
      modelAnswer: 'On 3.13 and earlier, annotations are evaluated when the def statement runs, and User doesn’t exist yet, so you get a NameError on the def line. Python 3.14 implements deferred evaluation, PEP 649 and 749: annotations are compiled into a small function that runs only when something reads them. By the time we print greet.__annotations__, User is defined, so it prints the dict with the real classes. If a name is still missing, the annotationlib module can return forward references or plain strings instead of raising.',
    },
    {
      id: 'modern-features-upgrade',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'You are asked to upgrade a production service from Python 3.9 to 3.14. How do you plan and de-risk it?',
      answer: 'Read the What’s New "removed/deprecated" sections for every version in between, make sure all dependencies (especially compiled ones) support 3.14, run the full test suite on 3.14 with warnings turned into errors, fix deprecations, then roll out gradually with monitoring and a rollback path. Only after that adopt new features and measure performance on the real workload.',
      explanation: py`Between 3.9 and 3.14: \`distutils\`, \`imp\`, \`asyncore\`/\`asynchat\` were removed in 3.12, PEP 594's old modules in 3.13, annotation evaluation changed in 3.14, and many deprecations turned into errors. Run CI on both versions during the transition; use \`-W error\` to surface deprecation warnings; check wheels for C extensions; pin and upgrade dependencies first. Performance can change in either direction, so benchmark.`,
      whyAsked: 'Senior engineers own upgrades; the question tests risk management, not syntax trivia.',
      mistakes: ['Just bumping the Docker image and deploying', 'Ignoring compiled dependencies', 'Starting a refactor to new syntax in the same change'],
      followUps: ['How would you support both versions during the migration?', 'How would you measure whether 3.14 is faster for you?'],
      modelAnswer: 'I would treat it as a dependency upgrade with a plan. First, read the What’s New removed and deprecated sections for 3.10 through 3.14 and grep for anything we use — distutils and imp are gone, for example. Second, check that every dependency, especially compiled ones, publishes wheels for 3.14 and upgrade them while still on 3.9. Then add 3.14 to CI, run the test suite with warnings as errors, and fix what breaks. I would roll out gradually with monitoring and an easy rollback, and benchmark the real workload instead of assuming it is faster. Adopting new syntax comes after, as a separate change.',
    },
    {
      id: 'modern-features-free-threading',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'What is the free-threaded build of CPython, how did its status change between 3.13 and 3.14, and what would you check before using it for a CPU-bound service?',
      answer: 'A separate CPython build without the GIL, so threads can run Python bytecode on several cores in parallel. Experimental in 3.13 (PEP 703); officially supported but still optional in 3.14 (PEP 779). Before using it: are all C extensions compatible (otherwise the GIL is re-enabled on import), is our code thread-safe now that races are more likely, and is it actually faster on our workload, given single-threaded overhead.',
      explanation: py`The GIL is a CPython implementation detail. The free-threaded build (often \`python3.14t\`) uses per-object locking and other techniques instead. It's not the default build. \`sys._is_gil_enabled()\` reports the state at runtime. Alternatives for CPU-bound work remain: multiprocessing, \`concurrent.interpreters\` (3.14), or moving hot loops into compiled code. See [the GIL & free-threading](lesson:gil-and-free-threading) and [choosing a concurrency model](lesson:choosing-concurrency).`,
      whyAsked: 'It is the biggest change to CPython’s concurrency story in decades; interviewers want precise status, not hype.',
      mistakes: ['Saying "Python 3.13 removed the GIL"', 'Claiming it makes all code faster', 'Forgetting about C-extension compatibility and thread safety'],
      followUps: ['Why was the GIL there in the first place?', 'How do multiprocessing and subinterpreters compare?', 'How would you detect races in existing code?'],
      modelAnswer: 'The free-threaded build is a separate build of CPython compiled without the global interpreter lock, so several threads can execute Python bytecode on different cores at the same time. It arrived as experimental in 3.13 under PEP 703, and in 3.14 PEP 779 made it officially supported — but it is still optional, the default interpreter keeps the GIL. Before using it for a CPU-bound service I would check three things: that every C extension we use declares support, since otherwise the GIL is turned back on; that our own shared state is properly locked, because races become much more likely; and that it is actually faster for our workload, since single-threaded code can be slower. I would compare it against multiprocessing with real benchmarks.',
    },
    {
      id: 'modern-features-transpose',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Using 3.12+ syntax, define a type alias `Grid` for `list[list[int]]` with the `type` statement, and a generic function `transpose[T](grid: list[list[T]]) -> list[list[T]]` that swaps rows and columns. Ragged grids (rows of different lengths) must raise `ValueError` instead of silently losing data.',
      answer: 'type Grid = list[list[int]]; def transpose[T](grid: list[list[T]]) -> list[list[T]]: return [list(column) for column in zip(*grid, strict=True)]',
      explanation: py`\`zip(*grid)\` passes each row as a separate argument and yields the columns. With \`strict=True\` (3.10) a short row raises \`ValueError\` instead of truncating every column. \`[T]\` declares the type parameter (PEP 695); at runtime it's visible in \`transpose.__type_params__\`, and \`Grid.__value__\` gives the aliased type.`,
      starter: { files: { 'main.py': py`from typing import TypeVar

T = TypeVar("T")
Grid = list  # TODO: replace with a 3.12 type statement for list[list[int]]


def transpose(grid):
    # TODO: use PEP 695 syntax, and make ragged grids raise ValueError
    return [list(column) for column in zip(*grid)]


print(transpose([[1, 2, 3], [4, 5, 6]]))
` } },
      tests: [
        { name: 'transposes a 2x3 grid', code: py`assert transpose([[1, 2, 3], [4, 5, 6]]) == [[1, 4], [2, 5], [3, 6]]` },
        { name: 'works with any element type', code: py`assert transpose([["a", "b"], ["c", "d"]]) == [["a", "c"], ["b", "d"]]` },
        { name: 'ragged grids raise ValueError', code: py`with raises(ValueError):
    transpose([[1, 2, 3], [4, 5]])` },
        { name: 'transpose declares a type parameter', code: py`assert len(transpose.__type_params__) == 1, 'Write def transpose[T](...)'` },
        { name: 'Grid is a type alias for list[list[int]]', code: py`assert getattr(Grid, "__value__", None) == list[list[int]], 'Use: type Grid = list[list[int]]'` },
      ],
      solution: { files: { 'main.py': py`type Grid = list[list[int]]


def transpose[T](grid: list[list[T]]) -> list[list[T]]:
    return [list(column) for column in zip(*grid, strict=True)]


print(transpose([[1, 2, 3], [4, 5, 6]]))
` } },
      hints: ['zip(*grid) yields the columns.', 'Add strict=True to zip, and write the function as def transpose[T](grid: list[list[T]]) -> list[list[T]]:', 'type Grid = list[list[int]]'],
      whyAsked: 'Combines modern typing syntax with a practical correctness feature (strict zip) in a few lines.',
      mistakes: ['Forgetting that zip truncates silently', 'Declaring T with TypeVar and also in brackets', 'Thinking the type parameter is checked at runtime'],
      followUps: ['How would you write this for Python 3.9?', 'What does a type checker infer for transpose([["a"]])?'],
      modelAnswer: 'I would write type Grid = list[list[int]] for the alias, and def transpose[T](grid: list[list[T]]) -> list[list[T]] so a type checker knows the element type is preserved. The body is a comprehension over zip(*grid, strict=True): unpacking the grid passes each row to zip, which yields the columns. strict=True matters because plain zip silently truncates to the shortest row and would lose data on a ragged grid; with strict it raises ValueError. At runtime the type parameter is just metadata, visible in __type_params__.',
    },
    {
      id: 'modern-features-tstrings',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare f-strings, str.format/% formatting and 3.14 t-strings. Why did Python add a fourth way to build strings?',
      answer: 'f-strings, str.format and % all produce a finished str immediately, so the receiver can no longer tell trusted literal text from interpolated values. t-strings produce a Template that keeps them separate, so libraries (HTML, SQL, shell, structured logging) can escape, parameterise or record values safely while keeping f-string-like syntax.',
      explanation: py`Before t-strings, safe APIs had to avoid string building entirely (\`cursor.execute(sql, params)\`). A t-string-aware SQL helper could turn \`t"SELECT * FROM users WHERE name = {name}"\` into a parameterised query automatically, and a logger could keep the values as structured fields. For ordinary text, f-strings remain the right tool.`,
      whyAsked: 'Tests understanding of injection risks and of what problem a new feature actually solves.',
      mistakes: ['Saying t-strings are "lazy f-strings"', 'Thinking t-strings escape anything by themselves', 'Believing a t-string can be used wherever a str is expected'],
      followUps: ['How would you write an SQL helper that accepts a Template?', 'What does a Template contain?'],
      modelAnswer: 'f-strings, str.format and percent formatting all have the same property: they immediately produce a finished string, so whoever receives it can no longer tell which parts the programmer wrote and which came from data. That is the root of injection bugs. A t-string, new in 3.14 via PEP 750, uses the same syntax but produces a Template object that keeps the literal strings and the interpolated values separate. A library can then escape each value for HTML, turn it into a SQL parameter, or log it as a structured field. The t-string does nothing by itself — the safety comes from the consumer — so for plain text I keep using f-strings.',
    },
  ],

  takeaways: [
    'A new CPython feature release arrives every October; set and test your minimum version (requires-python).',
    'Syntax features (:=, match, def f[T], t"…") fail to parse on older versions; library features fail only when the line runs.',
    '3.8 :=, f"{x=}", /  ·  3.9 dict |, removeprefix, list[int]  ·  3.10 match, X | Y, zip(strict=True).',
    '3.11 faster interpreter, ExceptionGroup/except*, TaskGroup, tomllib, Self  ·  3.12 PEP 695 generics, type aliases, PEP 701 f-strings, batched.',
    '3.13 new REPL, experimental free-threading and JIT  ·  3.14 lazy annotations, t-strings, except A, B:, supported free-threaded build.',
    'The GIL, the JIT and interpreter speed-ups are CPython details — measure on your workload instead of quoting numbers.',
  ],
}
