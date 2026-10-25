// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const MAIN = py`"""Entry point. On your own machine you would run:  python -m expenses data/expenses.csv"""
import logging

from expenses.cli import main

if __name__ == "__main__":
    # Configure logging once, at the edge of the program. force=True replaces
    # handlers left over from an earlier run (useful in notebooks and this sandbox).
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s", force=True)
    main(["data/expenses.csv", "--settings", "settings.toml"])
`

const FILES = {
  'main.py': MAIN,
  'pyproject.toml': py`[project]
name = "expenses"
version = "0.1.0"
description = "Summarise spending from a CSV file"
requires-python = ">=3.11"
dependencies = []

[project.scripts]
expenses = "expenses.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 100
`,
  'README.md': py`# expenses

Summarise spending from a CSV file.

## Install (development)

    python -m venv .venv
    source .venv/bin/activate      # Windows: .venv\Scripts\activate
    python -m pip install -e .

## Run

    python -m expenses data/expenses.csv

## Test

    python -m unittest
`,
  'settings.toml': py`# Deployment-specific values live in config, not in code.
[expenses]
currency = "£"
budget = 60.0
`,
  'data/expenses.csv': py`date,category,amount
2026-03-01,food,12.50
2026-03-02,transport,3.20
2026-03-04,food,8.75
2026-03-05,fun,25.00
2026-03-09,food,15.30
2026-03-11,transport,3.20
`,
  'expenses/__init__.py': py`"""expenses: summarise spending from a CSV file."""
__version__ = "0.1.0"
`,
  'expenses/models.py': py`"""Plain data. No I/O, no settings: everything else depends on this module."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class Expense:
    day: date
    category: str
    amount: Decimal   # Decimal, not float: money must add up exactly
`,
  'expenses/config.py': py`"""Settings: built-in defaults, overridden by a TOML file. Read once at start-up."""
import tomllib
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    currency: str = "£"
    budget: Decimal = Decimal("500")


def load_settings(path):
    path = Path(path)
    if not path.exists():
        return Settings()
    with path.open("rb") as f:                       # tomllib needs binary mode
        section = tomllib.load(f).get("expenses", {})
    return Settings(
        currency=section.get("currency", Settings.currency),
        budget=Decimal(str(section.get("budget", Settings.budget))),
    )
`,
  'expenses/storage.py': py`"""Reading expenses from CSV: the only module that knows about files."""
import csv
from datetime import date
from decimal import Decimal
from pathlib import Path

from .models import Expense


def load_expenses(path):
    with Path(path).open(newline="", encoding="utf-8") as f:
        return [
            Expense(date.fromisoformat(row["date"]), row["category"], Decimal(row["amount"]))
            for row in csv.DictReader(f)
        ]
`,
  'expenses/report.py': py`"""Pure logic: data in, data out. No files, no printing, no settings lookups."""
from collections import defaultdict
from decimal import Decimal


def totals_by_category(expenses):
    totals = defaultdict(Decimal)
    for expense in expenses:
        totals[expense.category] += expense.amount
    return dict(sorted(totals.items(), key=lambda item: item[1], reverse=True))


def over_budget(expenses, budget):
    return sum(expense.amount for expense in expenses) > budget
`,
  'expenses/cli.py': py`"""The thin outer shell: arguments in, text out. It wires the other modules together."""
import argparse
import logging

from .config import load_settings
from .report import over_budget, totals_by_category
from .storage import load_expenses

log = logging.getLogger(__name__)


def main(argv=None):
    parser = argparse.ArgumentParser(prog="expenses", description="Summarise spending.")
    parser.add_argument("csv_file")
    parser.add_argument("--settings", default="settings.toml")
    args = parser.parse_args(argv)

    settings = load_settings(args.settings)
    expenses = load_expenses(args.csv_file)
    log.info("loaded %d expenses from %s", len(expenses), args.csv_file)

    for category, total in totals_by_category(expenses).items():
        print(f"{category:<10} {settings.currency}{total:>8.2f}")
    if over_budget(expenses, settings.budget):
        print(f"Over budget! (limit {settings.currency}{settings.budget:.2f})")
    return 0
`,
  'tests/__init__.py': py`"""Test package (lets the tests import each other's helpers)."""
`,
  'tests/test_report.py': py`"""Unit tests for the pure logic. No files needed: that's the payoff of the split."""
import unittest
from datetime import date
from decimal import Decimal

from expenses.models import Expense
from expenses.report import over_budget, totals_by_category

LUNCH = Expense(date(2026, 3, 1), "food", Decimal("12.50"))
BUS = Expense(date(2026, 3, 2), "transport", Decimal("3.20"))


class ReportTests(unittest.TestCase):
    def test_totals_group_by_category(self):
        self.assertEqual(totals_by_category([LUNCH, BUS, LUNCH]),
                         {"food": Decimal("25.00"), "transport": Decimal("3.20")})

    def test_over_budget(self):
        self.assertTrue(over_budget([LUNCH, BUS], Decimal("10")))
`,
}

const SAMPLER = py`"""A one-line taste of the standard-library modules professionals reach for most."""
import argparse
import csv
import functools
import io
import itertools
import json
import logging
import os
import re
import sys
import unittest
from collections import Counter
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import get_type_hints

# os & sys: the operating system and the interpreter
print("os         :", os.path.join("data", "2026", "march.csv"))
print("sys        :", "Python", f"{sys.version_info.major}.{sys.version_info.minor}")

# pathlib: paths as objects
report = Path("reports") / "march.txt"
print("pathlib    :", report.name, report.suffix, report.parent)

# json & csv: data formats
print("json       :", json.dumps({"item": "tea", "qty": 2}, sort_keys=True))
print("csv        :", list(csv.reader(io.StringIO("tea,2\ncake,1\n"))))

# re: text patterns
print("re         :", re.findall(r"#(\w+)", "loving #python and #pathlib"))

# datetime: dates and durations
print("datetime   :", date(2026, 3, 1) + timedelta(days=30))

# collections, itertools, functools: data structures and iteration toolkits
print("collections:", Counter("mississippi").most_common(2))
print("itertools  :", list(itertools.pairwise([1, 4, 9, 16])))
print("functools  :", functools.reduce(lambda a, b: a * b, [1, 2, 3, 4]))

# argparse: command-line interfaces
parser = argparse.ArgumentParser(prog="greet")
parser.add_argument("name")
parser.add_argument("--shout", action="store_true")
print("argparse   :", parser.parse_args(["Ada", "--shout"]))


# dataclasses & typing: concise, annotated data
@dataclass
class Item:
    name: str
    price: float = 0.0


print("dataclasses:", Item("tea", 1.5))
print("typing     :", get_type_hints(Item))


# unittest: the built-in test framework
class MathTest(unittest.TestCase):
    def test_add(self):
        self.assertEqual(1 + 1, 2)


suite = unittest.defaultTestLoader.loadTestsFromTestCase(MathTest)
result = unittest.TextTestRunner(stream=io.StringIO()).run(suite)
print("unittest   :", result.testsRun, "test run, ok =", result.wasSuccessful())

# logging: diagnostics with levels (written to stderr, not stdout)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s", force=True)
logging.getLogger("sampler").info("logging writes to stderr")

# subprocess runs other programs, which this browser sandbox cannot do.
print("subprocess : see the static example in the lesson")
`

const GRADES_RAW = py`RAW = """name,score
Ada,91
Ben,78
Cy,85
"""
`

const LOG_LINES = py`LOG = [
    "2026-03-02T09:15:00 login ada",
    "2026-03-02T09:20:41 upload ada",
    "2026-03-03T11:02:13 login ben",
    "2026-03-04T08:00:00 login ada",
    "2026-03-04T17:45:09 logout ben",
    "2026-03-04T18:01:55 login cy",
]
`

const SETTINGS_START = py`def merge_settings(defaults, file_settings, environ, prefix="APP_"):
    """defaults < file settings < environment variables. Return a new dict."""
    # TODO
    return dict(defaults)


DEFAULTS = {"port": 8000, "debug": False, "db_url": "sqlite:///dev.db"}
print(merge_settings(DEFAULTS, {"port": 9000}, {"APP_DEBUG": "true"}))
`

export default {
  id: 'project-structure',
  title: 'Project structure & a tour of the standard library',
  summary: 'Lay out a real project (src/, tests/, pyproject.toml, README, .gitignore), keep config, I/O and logic apart, and know which standard-library module to reach for.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['packages', 'main-guard-and-scripts'],
  related: ['virtual-environments', 'pip-and-dependencies', 'packaging', 'code-quality-tools', 'testing-fundamentals', 'clean-architecture', 'pathlib', 'json-data', 'csv-data', 'logging', 'command-line-programs'],
  tags: ['project structure', 'project layout', 'src layout', 'flat layout', 'tests', 'pyproject.toml', 'README', '.gitignore', 'configuration', 'separation of concerns', 'functional core', 'standard library', 'stdlib tour', 'os', 'sys', 'pathlib', 'json', 'csv', 're', 'datetime', 'collections', 'itertools', 'functools', 'logging', 'argparse', 'subprocess', 'typing', 'dataclasses', 'unittest'],
  apis: [
    { name: 'pyproject.toml', summary: 'The standard file for project metadata, dependencies, build backend and tool settings.' },
    { name: 'src/ layout', summary: 'Puts the importable package in src/ so tests run against the installed package.' },
    { name: 'tests/', summary: 'Conventional folder for test modules named test_*.py.' },
    { name: 'os / sys', summary: 'Operating-system services (environment, files, processes) and interpreter details (argv, path, exit).' },
    { name: 'pathlib.Path', summary: 'Object-oriented file-system paths.' },
    { name: 'logging.getLogger(__name__)', summary: 'A per-module logger; configure handlers once in the entry point.' },
    { name: 'subprocess.run()', summary: 'Run another program and capture its output and exit status.' },
    { name: 'tomllib.load()', summary: 'Parse a TOML file such as settings or pyproject.toml (3.11+).' },
  ],
  docs: [
    { label: 'Python Packaging User Guide — src layout vs flat layout', url: 'https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/' },
    { label: 'Python Packaging User Guide — Writing your pyproject.toml', url: 'https://packaging.python.org/en/latest/guides/writing-pyproject-toml/' },
    { label: 'The Python Standard Library (index)', url: 'https://docs.python.org/3/library/index.html' },
    { label: 'Python tutorial — Brief tour of the standard library', url: 'https://docs.python.org/3/tutorial/stdlib.html' },
    { label: 'Logging HOWTO', url: 'https://docs.python.org/3/howto/logging.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You can write [modules](lesson:modules-and-imports), group them into [packages](lesson:packages) and give them a proper [entry point](lesson:main-guard-and-scripts). The next question is *where everything goes*. The Python community has settled on a layout you'll recognise in thousands of open-source projects:`,
    { code: py`expenses/                     <- the repository (project root)
├── pyproject.toml            <- metadata, dependencies, build + tool settings
├── README.md                 <- what it is, how to install, run and test it
├── .gitignore                <- keeps .venv/, __pycache__/, secrets out of git
├── src/
│   └── expenses/             <- the importable package
│       ├── __init__.py
│       ├── __main__.py       <- python -m expenses
│       ├── cli.py            <- arguments in, text out (I/O edge)
│       ├── config.py         <- settings: defaults, files, environment
│       ├── storage.py        <- reading/writing files (I/O)
│       ├── report.py         <- pure logic: data in, data out
│       └── models.py         <- data classes shared by everything
└── tests/
    ├── test_report.py
    └── test_storage.py`, lang: 'text', title: 'a typical src-layout project' },
    py`Two ideas carry most of the weight: **a predictable layout** (so people and tools know where to look) and **separating configuration, I/O and logic** (so the important code is easy to test). The second half of the lesson is a guided tour of the standard-library modules that show up in almost every professional project.`,
  ],
  why: [
    py`**People need to find things.** A newcomer (or you, in six months) should know without asking where the tests are, how to install the project and where the business logic lives.`,
    py`**Tools expect conventions.** pip and build tools read \`pyproject.toml\`; test runners discover \`tests/test_*.py\`; linters and type checkers read their settings from \`[tool.*]\` tables; git honours \`.gitignore\`.`,
    py`**Separation makes testing cheap.** A function that reads a file, consults an environment variable, calculates *and* prints can only be tested by creating files and capturing output. Split it, and the calculation becomes a pure function you can test with one line.`,
    py`**The standard library saves you work and dependencies.** Python ships with batteries for paths, data formats, dates, logging, command-line parsing, testing and more. Knowing what's already there stops you reinventing it — or installing a package for something three lines of stdlib can do.`,
  ],
  eli15: [
    py`Think of a **restaurant**. The waiters at the front talk to customers (that's input and output). The kitchen cooks (that's the logic). The storeroom holds ingredients (files and databases). A notice on the wall says today's settings — opening hours, which menu (that's configuration).`,
    py`A good restaurant keeps those apart. The chef never runs out to take orders, and the waiter never cooks. Because of that you can test the kitchen on its own: give the chef ingredients, taste the dish. That's why we keep calculations in pure functions and push reading files and printing to the edges of the program.`,
    py`The folders are the building's floor plan: everyone knows the kitchen is at the back and the storeroom downstairs. And the standard library? That's the kitchen equipment that came with the building — ovens, knives, fridges. Use it before you buy your own.`,
  ],
  analogy: {
    title: 'A well-run restaurant',
    body: [
      py`Front of house takes orders and serves plates; the kitchen turns ingredients into dishes; the storeroom stocks ingredients; the manager's notice board sets today's opening hours and specials. A health inspector visits to check the kitchen's work. The building has a plan and a licence on the wall that says what the place is.`,
      py`Swap any one part — a new waiter, a different supplier — and the others don't change. That's the goal of a project layout.`,
    ],
    mapping: [
      ['front of house (waiters)', 'cli.py — parse arguments, print results (the I/O edge)'],
      ['the kitchen', 'report.py — pure logic: data in, data out'],
      ['the storeroom', 'storage.py — the only code that touches files or databases'],
      ['the notice board', 'config.py + settings file / environment variables'],
      ['the health inspector', 'tests/ — check each part on its own'],
      ['the licence and floor plan', 'pyproject.toml and README.md'],
      ['equipment that came with the building', 'the standard library'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Which module talks to which',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'entry', label: '__main__ / main.py', note: 'starts the program', x: 100, y: 160, tone: 'yellow' },
        { id: 'cli', label: 'cli.py', note: 'args in, text out', x: 270, y: 160, tone: 'yellow' },
        { id: 'config', label: 'config.py', note: 'settings', x: 460, y: 50, tone: 'blue' },
        { id: 'storage', label: 'storage.py', note: 'files / DB', x: 460, y: 270, tone: 'kraft' },
        { id: 'report', label: 'report.py', note: 'pure logic', x: 460, y: 160, tone: 'paper' },
        { id: 'models', label: 'models.py', note: 'plain data', x: 670, y: 160, tone: 'ink' },
      ],
      edges: [
        { from: 'entry', to: 'cli', label: 'main()' },
        { from: 'cli', to: 'config', label: 'load once' },
        { from: 'cli', to: 'storage', label: 'load data' },
        { from: 'cli', to: 'report', label: 'compute' },
        { from: 'storage', to: 'models', label: 'builds' },
        { from: 'report', to: 'models', label: 'uses' },
      ],
      steps: [
        { focus: ['entry', 'cli'], edges: ['entry->cli'], text: py`The entry point is tiny: configure logging, call \`cli.main()\`. That's the **imperative shell** — the outer layer that's allowed to touch the world.` },
        { focus: ['config'], edges: ['cli->config'], text: py`**Configuration** is read **once**, at start-up, into a \`Settings\` object that's passed to whatever needs it. Nothing deep in the code calls \`os.environ\` or opens a settings file itself.` },
        { focus: ['storage', 'models'], edges: ['cli->storage', 'storage->models'], text: py`**I/O** lives in one module. \`storage.py\` turns CSV rows into \`Expense\` objects. Switch to JSON or a database and only this file changes.` },
        { focus: ['report', 'models'], edges: ['cli->report', 'report->models'], text: py`**Logic** is pure: lists of \`Expense\` in, totals out. No files, no printing, no settings lookups — so a unit test is a single function call.` },
        { focus: ['models'], text: py`All arrows point **inwards**, towards plain data. \`models.py\` imports nothing from the project, \`report.py\` only knows models. That one-way flow also prevents [circular imports](lesson:packages).` },
      ],
    },
    alt: 'Diagram: main.py calls cli.py. cli.py loads settings from config.py once, loads data through storage.py and computes with report.py. storage.py builds models and report.py uses models. All dependencies point inward towards models.py, the plain data.',
    caption: py`This is a small taste of [clean architecture](lesson:clean-architecture): dependencies point from the outside world inwards.`,
  },
  syntax: [
    py`#### src layout vs flat layout`,
    { code: py`src layout                        flat layout
----------                        -----------
project/                          project/
├── pyproject.toml                ├── pyproject.toml
├── src/                          ├── expenses/
│   └── expenses/                 │   ├── __init__.py
│       └── __init__.py           │   └── ...
└── tests/                        └── tests/`, lang: 'text' },
    py`In the **flat layout** the package sits in the project root. It's simple, and fine for applications and scripts — but because the current directory is usually on \`sys.path\`, your tests import the *folder*, not the installed package, which can hide packaging mistakes (a module or data file missing from the built wheel).`,
    py`In the **src layout** the package is one level down, so it is **not** importable until you install it — normally once, in editable mode, inside a [virtual environment](lesson:virtual-environments): \`python -m pip install -e .\`. Tests then exercise exactly what users get. The Python Packaging User Guide's tutorial uses it and explains its advantages for anything you distribute; see [packaging](lesson:packaging).`,
    py`#### The files at the root`,
    { code: py`[project]
name = "expenses"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []                      # third-party packages you need

[project.scripts]
expenses = "expenses.cli:main"         # installs an 'expenses' command

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]                            # tool settings live here too
line-length = 100`, lang: 'toml', title: 'pyproject.toml (minimal)' },
    { code: py`# virtual environments and caches
.venv/
__pycache__/
*.pyc
# build output
build/
dist/
*.egg-info/
# local secrets and editor/OS junk
.env
.DS_Store
.idea/
.vscode/`, lang: 'text', title: '.gitignore' },
    py`- **README.md** — one paragraph on what it does, then *install*, *run*, *test* commands that actually work.
- **tests/** — files named \`test_*.py\`; one test module per source module is a good default.
- Optional but common: \`LICENSE\`, \`CHANGELOG.md\`, \`docs/\`, a \`.pre-commit-config.yaml\` ([code quality tools](lesson:code-quality-tools)) and a CI workflow.`,
    { callout: 'warn', title: 'Never commit secrets or environments', text: py`API keys, passwords and \`.env\` files stay out of git — once pushed, assume they're leaked and rotate them. The \`.venv/\` folder is machine-specific and huge; commit the *list* of dependencies (\`pyproject.toml\`, a lock file) instead. See [secrets management](lesson:secrets-and-passwords).` },
    py`#### Separating configuration, I/O and logic`,
    py`1. **Logic** (the *functional core*): pure functions and classes that take data and return data. They don't read files, print, or look up settings.
2. **I/O** (the *imperative shell*): small modules at the edge that read files, call APIs, print and log — then hand plain data to the logic.
3. **Configuration**: values that change between machines or deployments (paths, URLs, limits, credentials). Read them **once** at start-up (defaults → config file → environment variables) into one object, and pass it down.`,
    { code: py`import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    db_url: str
    debug: bool


def settings_from_env(environ=os.environ):
    return Settings(
        db_url=environ.get("APP_DB_URL", "sqlite:///dev.db"),
        debug=environ.get("APP_DEBUG", "0") == "1",
    )


print(settings_from_env({"APP_DEBUG": "1"}))`, lang: 'python', title: 'config read once, from the environment' },
    py`#### A tour of the standard library`,
    py`Python's "batteries included" standard library is the first place to look. These sixteen modules appear in almost every professional codebase:`,
    py`| module | what it's for | taste |
|---|---|---|
| [\`os\`](https://docs.python.org/3/library/os.html) | operating-system services: environment variables, processes, low-level files | \`os.environ.get("HOME")\` |
| [\`sys\`](https://docs.python.org/3/library/sys.html) | the interpreter: \`argv\`, \`path\`, \`exit\`, \`stdin/stdout\`, version | \`sys.exit(main())\` — [CLI programs](lesson:command-line-programs) |
| [\`pathlib\`](https://docs.python.org/3/library/pathlib.html) | file-system paths as objects | \`Path("data") / "march.csv"\` — [pathlib](lesson:pathlib) |
| [\`json\`](https://docs.python.org/3/library/json.html) | read/write JSON | \`json.loads(text)\` — [JSON](lesson:json-data) |
| [\`csv\`](https://docs.python.org/3/library/csv.html) | read/write CSV correctly (quotes, commas in fields) | \`csv.DictReader(f)\` — [CSV](lesson:csv-data) |
| [\`re\`](https://docs.python.org/3/library/re.html) | regular expressions: text patterns | \`re.findall(r"\d+", s)\` — [regex](lesson:regular-expressions) |
| [\`datetime\`](https://docs.python.org/3/library/datetime.html) | dates, times, durations, time zones | \`date.fromisoformat("2026-03-01")\` — [dates & times](lesson:dates-and-times) |
| [\`collections\`](https://docs.python.org/3/library/collections.html) | \`Counter\`, \`defaultdict\`, \`deque\`, \`namedtuple\` | \`Counter(words).most_common(3)\` — [collections](lesson:collections-module) |
| [\`itertools\`](https://docs.python.org/3/library/itertools.html) | lazy iteration building blocks | \`itertools.chain(a, b)\` — [itertools](lesson:itertools) |
| [\`functools\`](https://docs.python.org/3/library/functools.html) | tools for functions: \`cache\`, \`partial\`, \`reduce\`, \`wraps\` | \`@functools.cache\` — [functools](lesson:functools) |
| [\`logging\`](https://docs.python.org/3/library/logging.html) | levelled, configurable diagnostics | \`log = logging.getLogger(__name__)\` — [logging](lesson:logging) |
| [\`argparse\`](https://docs.python.org/3/library/argparse.html) | command-line options, help and errors | \`parser.add_argument("--dry-run")\` — [CLI programs](lesson:command-line-programs) |
| [\`subprocess\`](https://docs.python.org/3/library/subprocess.html) | run other programs and capture their output | \`subprocess.run([...], check=True)\` — [injection](lesson:injection-attacks) |
| [\`typing\`](https://docs.python.org/3/library/typing.html) | type-hint helpers: \`Protocol\`, \`TypedDict\`, \`Literal\`… | \`def f(x: int) -> str\` — [type hints](lesson:type-hints) |
| [\`dataclasses\`](https://docs.python.org/3/library/dataclasses.html) | classes for data, with \`__init__\`/\`__repr__\`/\`__eq__\` generated | \`@dataclass(frozen=True)\` — [dataclasses](lesson:dataclasses) |
| [\`unittest\`](https://docs.python.org/3/library/unittest.html) | the built-in test framework (and \`unittest.mock\`) | \`class T(unittest.TestCase)\` — [testing](lesson:testing-fundamentals) |`,
    py`**Honourable mentions:** \`math\`, \`statistics\`, \`decimal\` (exact money), \`random\` / \`secrets\` (secure tokens), \`enum\`, \`contextlib\`, \`shutil\` & \`tempfile\` (copying, temporary files), \`sqlite3\`, \`tomllib\` (3.11+), \`hashlib\`, \`time\`, \`zoneinfo\` (time zones), \`concurrent.futures\` & \`asyncio\`, \`urllib.parse\`, \`textwrap\`, \`pprint\`, \`heapq\`, \`bisect\`, \`copy\`, \`timeit\` & \`cProfile\`. Switch the playground to the **Standard library sampler** variant to run a one-liner from most of the big sixteen.`,
    { code: py`import subprocess

# Run a program: pass a LIST of arguments (no shell), capture text output,
# and raise CalledProcessError if it fails.
result = subprocess.run(
    ["git", "log", "--oneline", "-3"],
    capture_output=True, text=True, check=True,
)
print(result.stdout)`, lang: 'python', static: true, title: 'subprocess (cannot run in the browser sandbox)' },
    { callout: 'warn', title: 'subprocess and the shell', text: py`Avoid \`shell=True\` with any text that comes from users or files: \`subprocess.run(f"convert {name}", shell=True)\` lets a filename like \`x; rm -rf ~\` run extra commands. Pass a list of arguments instead. See [injection attacks](lesson:injection-attacks).` },
  ],
  walkthrough: {
    title: 'Following one run through the layers',
    lang: 'python',
    code: FILES['expenses/cli.py'],
    intro: py`This is \`expenses/cli.py\` from the playground — the module that wires the layers together. Follow the data from the command line to the printed report.`,
    steps: [
      { lines: [5, 7], text: py`The shell imports the three layers it coordinates. Nothing imports \`cli.py\` back — dependencies point inwards.` },
      { lines: [9], text: py`One logger per module, named after it (\`expenses.cli\`). Modules never configure logging; the entry point (\`main.py\`) does that once.` },
      { lines: [12, 16], text: py`\`argparse\` turns the argument list into \`args.csv_file\` and \`args.settings\`. Taking \`argv\` as a parameter lets tests call \`main([...])\` directly.` },
      { lines: [18], text: py`**Config** is read once, into a frozen \`Settings\` object.` },
      { lines: [19, 20], text: py`**I/O**: \`storage.load_expenses\` is the only code that knows the data is a CSV file. A log line goes to stderr, separate from the report on stdout.` },
      { lines: [22, 25], text: py`**Logic** (\`totals_by_category\`, \`over_budget\`) receives plain data and returns plain data; only \`cli.py\` decides how to print it.` },
    ],
  },
  playground: {
    title: 'A small, well-structured project',
    objective: 'Open the files to see each layer, run it, then change configuration, data and logic separately — and add a unit test.',
    files: FILES,
    expected: py`On **stdout**:

\`\`\`text
food       £   36.55
fun        £   25.00
transport  £    6.40
Over budget! (limit £60.00)
\`\`\`

plus a log line on **stderr**: \`INFO expenses.cli: loaded 6 expenses from data/expenses.csv\`.

This sandbox runs \`main.py\`, and uses the **flat layout** (package next to \`main.py\`) because it has no \`pip install\`. On your machine, put \`expenses/\` under \`src/\`, install with \`python -m pip install -e .\` and run \`python -m expenses data/expenses.csv\`. \`pyproject.toml\` and \`README.md\` are here for you to read; the sandbox ignores them.`,
    experiments: [
      {
        id: 'raise-budget',
        task: py`Without touching any Python, stop the "Over budget!" warning: raise the budget to **100** in **settings.toml**.`,
        hint: py`Change \`budget = 60.0\` to \`budget = 100.0\`.`,
        tests: [
          { name: 'no over-budget warning', code: py`assert 'Over budget' not in output` },
          { name: 'the budget came from settings.toml', code: py`from decimal import Decimal
assert module('expenses.config').load_settings('settings.toml').budget == Decimal('100')` },
        ],
        explain: py`Values that differ between users or deployments belong in configuration, not code. Changing them never risks breaking logic, and different machines can use different settings files (or environment variables) with the same code.`,
      },
      {
        id: 'add-expense',
        task: py`Add a new row to **data/expenses.csv**: \`2026-03-14,food,4.10\`. Predict the new food total before you run.`,
        tests: [{ name: 'food total is £40.65', code: py`assert 'food       £   40.65' in output` }],
        explain: py`Data lives in data files, code in modules. \`storage.py\` reads whatever rows are there; nothing else needed to change.`,
      },
      {
        id: 'biggest-expense',
        task: py`Add a **pure** function \`biggest_expense(expenses)\` to **expenses/report.py** that returns the \`Expense\` with the largest amount. Then make **cli.py** print \`Biggest: fun £25.00\` (category, currency, amount with 2 decimals) after the totals.`,
        hint: py`In report.py: \`return max(expenses, key=lambda e: e.amount)\`. In cli.py, import it and \`print(f"Biggest: {big.category} {settings.currency}{big.amount:.2f}")\`.`,
        tests: [
          { name: 'biggest_expense is pure and correct', code: py`from decimal import Decimal
rows = module('expenses.storage').load_expenses('data/expenses.csv')
big = module('expenses.report').biggest_expense(rows)
assert big.amount == Decimal('25.00') and big.category == 'fun'` },
          { name: 'cli prints it', code: py`assert 'Biggest: fun £25.00' in output` },
          { name: 'report.py does not print', code: py`assert 'print(' not in files['expenses/report.py'], 'Keep printing in cli.py; report.py stays pure'` },
        ],
        explain: py`New logic went into the logic layer and new output into the shell. The function is trivially testable: give it a list, check the result — no files, no captured output.`,
      },
      {
        id: 'unit-test',
        task: py`Open **tests/test_report.py** and add a third test method, \`test_not_over_budget\`, asserting that \`over_budget([LUNCH, BUS], Decimal("100"))\` is \`False\`.`,
        hint: py`Copy \`test_over_budget\`, rename it, and use \`self.assertFalse(...)\` with \`Decimal("100")\`.`,
        tests: [{ name: 'the suite has 3 passing tests', code: py`import io, unittest
suite = unittest.defaultTestLoader.loadTestsFromName("tests.test_report")
result = unittest.TextTestRunner(stream=io.StringIO()).run(suite)
assert result.testsRun >= 3, 'Add a third test method to ReportTests'
assert result.wasSuccessful(), 'All tests in tests/test_report.py should pass'` }],
        explain: py`Because \`report.py\` is pure, its tests build data in memory and call functions — fast, and they can't fail because of a missing file. On your machine you'd run them with \`python -m unittest\` or [pytest](lesson:pytest-basics).`,
      },
    ],
    variants: [
      { id: 'stdlib-sampler', label: 'Standard library sampler', files: { 'main.py': SAMPLER } },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Tangled vs separated',
    props: {
      left: { label: 'Everything in one function', lang: 'python', code: py`import json
import os


def report():
    path = os.environ.get("DATA", "sales.json")
    with open(path) as f:                 # I/O
        sales = json.load(f)
    total = sum(s["amount"] for s in sales)  # logic
    limit = float(os.environ["LIMIT"])       # config
    print(f"Total: {total:.2f}")              # I/O
    if total > limit:
        print("Over the limit!")` },
      right: { label: 'Config, I/O and logic apart', lang: 'python', code: py`import json
from pathlib import Path


def load_sales(path):                       # I/O
    return json.loads(Path(path).read_text())


def summarise(sales, limit):                # pure logic
    total = sum(s["amount"] for s in sales)
    return total, total > limit


def main(settings):                         # shell
    total, over = summarise(load_sales(settings.path), settings.limit)
    print(f"Total: {total:.2f}")
    if over:
        print("Over the limit!")` },
      points: [
        'Left: testing the total requires a real file, environment variables and capturing printed output.',
        'Right: summarise() is tested with one call — summarise([{"amount": 5}], 3) == (5, True).',
        'Right: settings are read once and passed in, so tests and production can use different values without patching os.environ.',
        'Right: switching from JSON to a database changes only load_sales().',
        'Same behaviour, a few more lines — the extra structure pays off as soon as you write tests or the program grows.',
      ],
    },
    alt: 'Two versions of a sales report. Left: one function reads an environment variable, opens a JSON file, computes the total and prints. Right: load_sales does I/O, summarise is pure logic returning the total and a flag, and main wires them together with settings passed in.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Python itself only cares about two things: which folders are on \`sys.path\`, and which folders are packages. Everything else — \`tests/\`, \`README.md\`, \`pyproject.toml\`, \`.gitignore\` — is **convention**, read by people and tools. That's exactly why following the convention matters: it's the shared language.`,
      py`Start simple. A single script is fine for a single job. When it grows past a few hundred lines or you want tests, turn it into a package with a \`main()\`; when you want to install or share it, add \`pyproject.toml\` and move to the src layout.`,
    ],
    technical: [
      py`**Why src layout protects you.** With a flat layout, running \`python -m pytest\` (or \`python -m unittest\`) from the root puts the root on \`sys.path\`, so \`import expenses\` finds the source folder directly. If your build configuration forgets a subpackage or data file, tests still pass — and users get \`ModuleNotFoundError\`. With \`src/\`, the only way to import the package is to install it, so a broken build shows up in your own test run.`,
      py`**Editable installs.** \`pip install -e .\` asks the build backend to install a small pointer instead of copies — typically a \`.pth\` file in *site-packages* or an import hook — so \`import expenses\` resolves to your \`src/expenses\` folder. Edits to existing modules take effect without reinstalling; changes to metadata (dependencies, entry points) need a re-install.`,
      py`\`pyproject.toml\` **is the hub.** \`[build-system]\` tells pip how to build the project (PEP 518/517), \`[project]\` holds standard metadata (PEP 621), and \`[tool.<name>]\` tables configure tools — \`[tool.ruff]\`, \`[tool.pytest.ini_options]\`, \`[tool.mypy]\`, \`[tool.coverage.run]\`. One file instead of \`setup.py\` + \`setup.cfg\` + \`pytest.ini\` + \`.flake8\`.`,
      py`**Logging belongs to the application.** Library modules create loggers with \`logging.getLogger(__name__)\`, giving a dotted hierarchy that matches the packages (\`expenses.cli\`, \`expenses.storage\`). Only the entry point calls \`logging.basicConfig\` (or \`dictConfig\`) to decide levels, formats and destinations.`,
      py`**Paths relative to what?** \`open("data/expenses.csv")\` is resolved against the **current working directory** — wherever the user launched the program — not the module's folder. Take paths as arguments or config. For data files shipped *inside* your package, use \`importlib.resources.files("expenses") / "rates.json"\`, which also works when the package is installed as a wheel or zip.`,
    ],
    production: [
      py`**Twelve-factor style configuration.** Deployment-specific values (URLs, credentials, feature flags) come from environment variables; code reads them in one place, validates them at start-up, and fails fast with a clear message if something required is missing. Local development can use a git-ignored \`.env\` file loaded by tooling.`,
      py`**Pin what you deploy.** Applications commit a lock file (from \`pip-tools\`, \`uv\`, \`poetry\`…) so every machine installs identical versions; libraries declare compatible ranges in \`pyproject.toml\`. See [pip & dependencies](lesson:pip-and-dependencies).`,
      py`**Automate the boring checks.** Formatter, linter and type checker configured in \`pyproject.toml\`, run by pre-commit locally and by CI on every push — see [code quality tools](lesson:code-quality-tools).`,
      py`**Grow the structure with the code.** Don't start with twelve empty layers. Split a module when it has two reasons to change; add a \`services/\` or \`adapters/\` package when there are several of them. Larger systems formalise the dependency rule shown above as [clean architecture](lesson:clean-architecture).`,
      py`**Ship type information.** A library that has type hints adds an empty \`py.typed\` marker file to its package (PEP 561) so type checkers in other projects use them — see [static type checking](lesson:static-type-checking).`,
    ],
  },
  mistakes: [
    {
      title: 'Paths relative to the current directory',
      wrong: { code: py`from pathlib import Path


def load_rates():
    # breaks when the program is started from another folder
    return Path("expenses/rates.json").read_text()`, lang: 'python' },
      right: { code: py`from importlib.resources import files


def load_rates():
    # data file shipped inside the package, found wherever it's installed
    return (files("expenses") / "rates.json").read_text()`, lang: 'python' },
      explanation: py`Relative paths are resolved from the working directory, which depends on how the program was launched (a cron job, an IDE, another folder). Pass user data paths in as arguments; locate packaged data with \`importlib.resources\` (or \`Path(__file__).parent\` for simple cases).`,
    },
    {
      title: 'Logic tangled with input and output',
      wrong: { code: py`def checkout():
    price = float(input("Price? "))
    qty = int(input("Quantity? "))
    print("Total:", round(price * qty * 1.2, 2))`, lang: 'python' },
      right: { code: py`def total_with_vat(price, qty, vat=0.2):
    return round(price * qty * (1 + vat), 2)


def main():
    price = float(input("Price? "))
    qty = int(input("Quantity? "))
    print("Total:", total_with_vat(price, qty))`, lang: 'python' },
      explanation: py`The calculation can't be tested — or reused by a web page — while it's welded to \`input()\` and \`print()\`. Pull the logic into a pure function and keep the I/O in a thin \`main()\`.`,
    },
    {
      title: 'Committing the virtual environment or secrets',
      wrong: { code: py`$ git add .
$ git commit -m "initial"      # includes .venv/ (thousands of files) and .env (API keys)`, lang: 'bash' },
      right: { code: py`$ printf ".venv/\n__pycache__/\n.env\n" >> .gitignore
$ git add .
$ git commit -m "initial"`, lang: 'bash' },
      explanation: py`A venv is tied to one machine's paths and Python build; others recreate it from \`pyproject.toml\` or a lock file. Secrets in git history are effectively public — even if you delete them in a later commit. Write the \`.gitignore\` first.`,
    },
    {
      title: 'Naming your package after an existing module',
      wrong: { code: py`project/
    logging/          # shadows the standard library's logging
        __init__.py
    requests.py       # shadows the third-party requests package`, lang: 'text' },
      right: { code: py`project/
    src/
        expense_logging/
            __init__.py
    http_client.py`, lang: 'text' },
      explanation: py`Your project folder is searched before the standard library and site-packages, so these names hijack every \`import logging\` / \`import requests\` — including the ones inside other libraries. Pick distinctive names.`,
    },
    {
      title: 'Reading configuration everywhere',
      wrong: { code: py`import os


def send_invoice(invoice):
    if os.environ.get("APP_DEBUG") == "1":    # scattered config lookups
        return
    smtp_host = os.environ["SMTP_HOST"]          # KeyError at 2am, mid-request`, lang: 'python' },
      right: { code: py`def send_invoice(invoice, settings):
    if settings.debug:
        return
    smtp_host = settings.smtp_host               # validated once, at start-up`, lang: 'python' },
      explanation: py`Configuration read deep inside functions is invisible, hard to test and fails late. Load and validate it once at start-up, then pass a settings object down.`,
    },
  ],
  debugging: [
    {
      symptom: py`ModuleNotFoundError: No module named 'expenses' (when running tests in a src-layout project)`,
      cause: py`The package lives in \`src/\`, which isn't on \`sys.path\` until the project is installed — this is the src layout working as designed.`,
      fix: py`Activate the project's virtual environment and run \`python -m pip install -e .\` once. Don't add \`src\` to \`sys.path\` by hand.`,
    },
    {
      symptom: py`FileNotFoundError: [Errno 2] No such file or directory: 'data/expenses.csv'`,
      cause: py`A relative path is resolved against the current working directory, and the program was started from a different folder (an IDE, a scheduler, a test runner).`,
      fix: py`Pass the path as an argument or setting, print \`Path.cwd()\` to see where you are, and use \`importlib.resources\` for data files that ship inside the package.`,
    },
    {
      symptom: py`Tests pass on your machine, but after pip install users get ModuleNotFoundError: No module named 'expenses.reports'`,
      cause: py`The subpackage wasn't included in the built distribution (e.g. a missing \`__init__.py\` or package-discovery setting), and a flat layout let your tests import the source folder instead of the installed package.`,
      fix: py`Switch to the src layout, build the wheel (\`python -m build\`), install it in a fresh environment and run the tests against it — ideally in CI. See [packaging](lesson:packaging).`,
    },
    {
      symptom: py`Log messages from your modules never appear (or appear twice).`,
      cause: py`Nobody configured logging (default level is WARNING, so INFO is dropped), or several modules call \`basicConfig\`/add handlers.`,
      fix: py`Configure logging exactly once, in the entry point. Modules only do \`log = logging.getLogger(__name__)\`. See [logging](lesson:logging).`,
    },
  ],
  bestPractices: [
    'Use a predictable layout: pyproject.toml, README.md, .gitignore, src/<package>/, tests/.',
    'Prefer the src layout for anything you will install or distribute; flat is fine for small applications.',
    'Keep logic pure; do file, network and terminal I/O in thin modules at the edge.',
    'Read configuration once at start-up (defaults → file → environment) into a settings object and pass it down.',
    'Configure logging once in the entry point; modules use logging.getLogger(__name__).',
    'Never commit .venv/, __pycache__/, build output or secrets — write .gitignore first.',
    'Reach for the standard library first: pathlib, json, csv, logging, argparse, dataclasses, collections, itertools, functools.',
    'Use subprocess with a list of arguments, never shell=True with untrusted text.',
  ],
  useCases: [
    'Turning a growing script into an installable, testable tool.',
    'Onboarding teammates: the README and layout answer "how do I run this?".',
    'Swapping storage (CSV → SQLite) without touching business logic.',
    'Running the same code with different settings in development, CI and production.',
  ],
  comparison: {
    title: 'Flat layout vs src layout',
    headers: ['', 'Flat layout', 'src layout'],
    rows: [
      ['where the package lives', 'project/expenses/', 'project/src/expenses/'],
      ['importable without installing', 'yes (from the project root)', 'no — install with pip install -e .'],
      ['tests run against', 'the source folder (whatever is in cwd)', 'the installed package'],
      ['catches packaging mistakes early', 'no', 'yes'],
      ['good for', 'small apps, scripts, notebooks', 'libraries and anything distributed'],
    ],
    note: py`Both are legitimate; the Python Packaging User Guide explains the trade-offs. Many teams use src for everything to keep one habit.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-structure-q1',
      type: 'mcq',
      prompt: py`What is the main benefit of putting your package under \`src/\`?`,
      options: [
        { text: 'Python runs code in src/ faster', why: 'The layout has no effect on run speed.' },
        'Tests and tools must import the installed package, so packaging mistakes show up before users see them',
        { text: 'It is required by Python for packages to work', why: 'Both flat and src layouts are valid; src is a recommendation, not a requirement.' },
        { text: 'It hides the source code from users', why: 'Installed packages still contain their .py files; src/ is about imports during development.' },
      ],
      answer: 1,
      explanation: py`Because \`src/\` isn't on \`sys.path\`, the package only imports after \`pip install -e .\` (or a real install). Your tests then exercise what users actually get, instead of the folder sitting in the current directory.`,
    },
    {
      id: 'project-structure-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from collections import Counter
from itertools import chain

orders = [["tea", "cake"], ["tea"], ["coffee", "tea"]]
counts = Counter(chain.from_iterable(orders))
print(counts.most_common(1))`,
      answer: "[('tea', 3)]",
      accept: ["[('tea', 3)]", '[("tea", 3)]'],
      explanation: py`\`chain.from_iterable\` flattens the list of lists lazily; \`Counter\` counts each item; \`most_common(1)\` returns a list with the single most frequent \`(item, count)\` pair.`,
    },
    {
      id: 'project-structure-q3',
      type: 'bug',
      prompt: py`\`rates.json\` ships inside the \`expenses\` package. This works when run from the project root but crashes with \`FileNotFoundError\` when the installed tool runs from any other folder. Click the faulty line.`,
      code: py`import json
from pathlib import Path


def load_rates():
    text = Path("src/expenses/rates.json").read_text()
    return json.loads(text)`,
      answerLine: 6,
      explanation: py`The relative path is resolved against the current working directory, not the package. Use \`importlib.resources.files("expenses") / "rates.json"\` (or \`Path(__file__).parent / "rates.json"\`).`,
    },
    {
      id: 'project-structure-q4',
      type: 'fill',
      prompt: 'Fill in the standard-library modules: one parses command-line options, the other gives you path objects.',
      code: py`import ___
from ___ import Path

parser = argparse.ArgumentParser()
parser.add_argument("folder")
args = parser.parse_args(["reports"])
print(Path(args.folder) / "march.csv")`,
      answer: [['argparse'], ['pathlib']],
      explanation: py`\`argparse\` builds command-line interfaces; \`pathlib.Path\` represents file-system paths and joins them with \`/\`. This prints \`reports/march.csv\` (with a backslash on Windows).`,
    },
    {
      id: 'project-structure-q5',
      type: 'mcq',
      prompt: py`Which of these belong in \`.gitignore\`? **Select all that apply.**`,
      options: [
        '.venv/',
        '__pycache__/',
        '.env (local secrets)',
        { text: 'pyproject.toml', why: 'pyproject.toml is the project definition — everyone needs it. Commit it.' },
        { text: 'tests/', why: 'Tests are part of the project and must be committed.' },
      ],
      answer: [0, 1, 2],
      explanation: py`Ignore what's machine-specific, generated or secret: the virtual environment, bytecode caches, build output and \`.env\` files. Commit everything needed to rebuild the project.`,
    },
    {
      id: 'project-structure-q6',
      type: 'mcq',
      prompt: py`Your tool needs to run \`git log\` and read its output. Which standard-library approach is right?`,
      options: [
        { text: 'os.system("git log") and parse what it prints', why: 'os.system returns only the exit status — the output goes straight to the terminal — and it always uses a shell.' },
        'subprocess.run(["git", "log"], capture_output=True, text=True, check=True)',
        { text: 'subprocess.run(f"git log {user_arg}", shell=True)', why: 'With shell=True and interpolated text, a malicious argument can run extra commands (shell injection).' },
        { text: 'eval("git log")', why: 'eval runs Python code, not programs — and must never be used on untrusted text.' },
      ],
      answer: 1,
      explanation: py`\`subprocess.run\` with a **list** of arguments runs the program directly (no shell), \`capture_output=True, text=True\` gives you \`result.stdout\` as a string, and \`check=True\` raises if the command fails.`,
    },
    {
      id: 'project-structure-q7',
      type: 'short',
      prompt: py`Explain "functional core, imperative shell" in your own words. Why does it make code easier to test?`,
      answer: py`Keep the decisions and calculations (the core) in pure functions that take data and return data, and push everything that touches the outside world — files, network, input/print, environment variables, the clock — into a thin outer layer (the shell) that gathers data, calls the core and acts on the result. Pure functions can be tested by calling them with values and checking the return value: no files to create, no output to capture, no mocks.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'untangle-report',
      title: 'Untangle a report function',
      difficulty: 'intermediate',
      prompt: py`\`report(text)\` parses CSV text, does maths and prints, all in one go. Split it:

1. \`parse_rows(lines)\` — given a list of lines **including the header**, return \`[(name, score), ...]\` with \`score\` as an \`int\`.
2. \`summarise(rows)\` — return \`{"count": n, "average": a, "best": name}\`, where \`a\` is the mean rounded to 1 decimal place and \`best\` the top scorer. It must **not print**.
3. Rewrite \`report(text)\` to call \`parse_rows\` and \`summarise\`, printing exactly the same line as before:

\`\`\`text
3 students, average 84.7, best: Ada
\`\`\``,
      files: {
        'main.py': py`${GRADES_RAW}

def parse_rows(lines):
    """[(name, score), ...] from CSV lines, skipping the header."""
    return []   # TODO


def summarise(rows):
    """{"count": n, "average": mean (1 dp), "best": top scorer's name}"""
    return {}   # TODO


def report(text):
    # Parsing, maths and printing all tangled together. Rewrite me!
    lines = text.strip().splitlines()
    total = 0
    best_name, best_score = None, -1
    for line in lines[1:]:
        name, score = line.split(",")
        total += int(score)
        if int(score) > best_score:
            best_name, best_score = name, int(score)
    print(f"{len(lines) - 1} students, average {total / (len(lines) - 1):.1f}, best: {best_name}")


report(RAW)
`,
      },
      hints: [
        'parse_rows: skip lines[0], split each remaining line on ",", convert the score with int().',
        'summarise: count = len(rows); average = round(sum of scores / count, 1); best = max(rows, key=lambda row: row[1])[0].',
        'report becomes two lines: summary = summarise(parse_rows(text.strip().splitlines())) and an f-string print using summary["count"], summary["average"], summary["best"].',
      ],
      solution: {
        explanation: py`Each function now has one job. \`parse_rows\` turns text into data, \`summarise\` turns data into results (pure — easy to test with literal lists), and \`report\` is the thin shell that does the printing. If the scores later come from a database or a web form, only the parsing changes; if the output becomes HTML, only \`report\` changes. \`max(rows, key=...)\` returns the first top scorer on ties, matching the original \`>\` comparison.`,
        files: {
          'main.py': py`${GRADES_RAW}

def parse_rows(lines):
    """[(name, score), ...] from CSV lines, skipping the header."""
    rows = []
    for line in lines[1:]:
        name, score = line.split(",")
        rows.append((name, int(score)))
    return rows


def summarise(rows):
    """{"count": n, "average": mean (1 dp), "best": top scorer's name}"""
    count = len(rows)
    average = round(sum(score for _, score in rows) / count, 1)
    best = max(rows, key=lambda row: row[1])[0]
    return {"count": count, "average": average, "best": best}


def report(text):
    summary = summarise(parse_rows(text.strip().splitlines()))
    print(f"{summary['count']} students, average {summary['average']:.1f}, best: {summary['best']}")


report(RAW)
`,
        },
      },
      tests: [
        { name: 'parse_rows skips the header and converts scores', code: py`assert parse_rows(["name,score", "Ada,91", "Ben,78"]) == [("Ada", 91), ("Ben", 78)]` },
        { name: 'summarise returns count, average and best', code: py`assert summarise([("Ada", 91), ("Ben", 78)]) == {"count": 2, "average": 84.5, "best": "Ada"}` },
        { name: 'summarise does not print', code: py`assert capture(summarise, [("Ada", 91)]) == ""` },
        { name: 'report prints the same line', code: py`assert output.strip() == "3 students, average 84.7, best: Ada"` },
        { name: 'report uses the new functions', code: py`import inspect
src = inspect.getsource(report)
assert "parse_rows(" in src and "summarise(" in src, 'report() should call parse_rows and summarise'` },
      ],
    },
    {
      id: 'log-tools',
      title: 'Pick the right standard-library tools',
      difficulty: 'intermediate',
      prompt: py`Each log line looks like \`"2026-03-02T09:15:00 login ada"\` — an ISO timestamp, an action and a user. Using only the standard library:

1. \`parse_line(line)\` returns \`(datetime, action, user)\`. Use a **regular expression** (\`re\`) to split the line and \`datetime.fromisoformat\` for the timestamp. Ignore surrounding whitespace. If the line doesn't match, raise \`ValueError(f"bad log line: {line!r}")\`.
2. \`busiest_weekday(lines)\` returns the weekday name (e.g. \`"Wednesday"\`, from \`strftime("%A")\`) with the most events. Use \`collections.Counter\`.`,
      files: {
        'main.py': py`import re
from collections import Counter
from datetime import datetime

${LOG_LINES}

def parse_line(line):
    """(datetime, action, user) from one log line."""
    return None   # TODO


def busiest_weekday(lines):
    """Name of the weekday with the most events."""
    return None   # TODO


print(parse_line(LOG[0]))
print(busiest_weekday(LOG))
`,
      },
      hints: [
        'A pattern like r"(\\S+) (\\w+) (\\w+)" captures three space-separated pieces; re.fullmatch(pattern, line.strip()) returns None when the line does not match.',
        'match.groups() gives the three strings; convert the first with datetime.fromisoformat().',
        'busiest_weekday: Counter(parse_line(line)[0].strftime("%A") for line in lines).most_common(1)[0][0].',
      ],
      solution: {
        explanation: py`Three standard-library modules, each doing what it's best at: \`re\` validates and splits the line (\`fullmatch\` insists the *whole* line matches, so junk is rejected), \`datetime.fromisoformat\` parses the ISO timestamp, and \`Counter\` counts weekdays without a hand-written dict. Compiling the pattern once at module level is a small, idiomatic optimisation. Raising \`ValueError\` with the offending line (\`!r\` shows quotes and hidden characters) makes bad input easy to diagnose.`,
        files: {
          'main.py': py`import re
from collections import Counter
from datetime import datetime

${LOG_LINES}
LINE = re.compile(r"(\S+) (\w+) (\w+)")


def parse_line(line):
    """(datetime, action, user) from one log line."""
    match = LINE.fullmatch(line.strip())
    if match is None:
        raise ValueError(f"bad log line: {line!r}")
    stamp, action, user = match.groups()
    return datetime.fromisoformat(stamp), action, user


def busiest_weekday(lines):
    """Name of the weekday with the most events."""
    days = Counter(parse_line(line)[0].strftime("%A") for line in lines)
    return days.most_common(1)[0][0]


print(parse_line(LOG[0]))
print(busiest_weekday(LOG))
`,
        },
      },
      tests: [
        { name: 'parse_line returns (datetime, action, user)', code: py`from datetime import datetime
assert parse_line("2026-03-02T09:15:00 login ada") == (datetime(2026, 3, 2, 9, 15), "login", "ada")` },
        { name: 'parse_line ignores surrounding whitespace', code: py`assert parse_line("  2026-03-03T11:02:13 logout ben\n")[1:] == ("logout", "ben")` },
        { name: 'parse_line rejects junk', code: py`with raises(ValueError, match="bad log line"):
    parse_line("this is not a log line")` },
        { name: 'busiest weekday of the full log', code: py`assert busiest_weekday(LOG) == "Wednesday"` },
        { name: 'busiest weekday of the first three lines', code: py`assert busiest_weekday(LOG[:3]) == "Monday"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-structure-layout',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Describe how you would lay out a new Python project that others will install and contribute to.',
      answer: 'A repository with pyproject.toml (metadata, dependencies, build backend, tool config), README.md, .gitignore, a src/<package>/ folder for the code (with __init__.py and __main__.py if it is runnable), and tests/ with test_*.py files. Plus a lock file for applications, pre-commit and CI configuration as it matures.',
      explanation: py`The layout is convention, but tools rely on it: pip reads \`pyproject.toml\`, test runners discover \`tests/\`, linters read \`[tool.*]\`. The src layout makes tests run against the installed package.`,
      whyAsked: 'Shows you have worked on real projects rather than single scripts, and that you know the modern packaging standards.',
      mistakes: ['Mentioning only setup.py (the older approach)', 'Putting tests inside the package without a reason', 'Forgetting .gitignore / committing the venv'],
      followUps: ['Why src rather than flat?', 'Where do tool settings go?', 'How do new contributors set up the project?'],
      modelAnswer: 'I start with a repository containing pyproject.toml, which holds the project metadata, dependencies, the build backend and tool settings, plus a README with install, run and test commands, and a .gitignore that excludes the virtual environment, caches, build output and secrets. The code goes in src/ with one importable package, and tests go in a top-level tests folder with test_*.py modules. Contributors create a virtual environment and run pip install -e . so the package is importable. As the project matures I add a lock file for applications, pre-commit hooks and a CI workflow that runs the linters, type checker and tests.',
    },
    {
      id: 'project-structure-src-vs-flat',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare the src layout and the flat layout. When would you choose each?',
      answer: 'Flat puts the package in the root — simple, importable without installing, fine for applications. src puts it under src/, so it is only importable once installed; tests then run against the installed package and catch packaging errors. Prefer src for libraries and anything distributed.',
      explanation: py`The key mechanism is \`sys.path\`: the project root (current directory) is usually on it during development, so in a flat layout \`import pkg\` silently uses the source folder. The src layout removes that accident at the cost of one \`pip install -e .\`.`,
      whyAsked: 'A common design discussion when setting up repositories; it tests understanding of import mechanics, not just preferences.',
      mistakes: ['Claiming one layout is required', 'Not knowing why src helps (just "it is cleaner")'],
      followUps: ['What does an editable install do?', 'How would you test the built wheel in CI?'],
      modelAnswer: 'In the flat layout the package folder sits at the project root, so when you run tests from the root it is importable straight away. That is convenient, but it means tests import the source folder rather than the installed package, so if the build forgets a module or a data file, the tests still pass and users get the error. The src layout moves the package into src/, which is not on sys.path, so you must install it, normally with pip install -e ., and every test runs against the installed package. I use src for libraries and anything I distribute; for a small internal app either is fine, and many teams just use src everywhere for consistency.',
    },
    {
      id: 'project-structure-relative-path-debug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A script works when you run `python report.py` in its folder, but a scheduled job running the same script fails with `FileNotFoundError: [Errno 2] No such file or directory: \'templates/report.html\'`. Why, and how do you fix it?',
      answer: 'Relative paths are resolved from the current working directory, and the scheduler starts the program in a different folder. Build the path from the code\'s location (Path(__file__).parent / "templates" / "report.html", or importlib.resources for packaged data) or make the path a configured, absolute setting.',
      explanation: py`The working directory is a property of the *process*, set by whoever starts it — your shell, an IDE, cron, systemd, a test runner. It has nothing to do with where the script file lives.`,
      code: { lang: 'python', code: py`from pathlib import Path

TEMPLATES = Path(__file__).resolve().parent / "templates"
print(TEMPLATES / "report.html")` },
      whyAsked: 'A very common production bug; the answer shows whether you understand the working directory.',
      mistakes: ['Hard-coding an absolute path from your own machine', 'Adding os.chdir() at the top of the script', 'Assuming the working directory is the script\'s folder'],
      followUps: ['How would you ship data files inside an installed package?', 'What does Path.cwd() return?'],
      modelAnswer: 'A relative path like templates/report.html is resolved against the process\'s current working directory, not the script\'s folder. When I run it from its own folder those happen to match, but the scheduler starts the process somewhere else. I would build the path from the code\'s location with Path(__file__).resolve().parent, or, for data that ships inside a package, use importlib.resources so it works even when installed as a wheel. For user data, I would make the path an explicit argument or setting rather than guessing.',
    },
    {
      id: 'project-structure-config-io-logic',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A 600-line script reads environment variables, queries a database, applies pricing rules and emails results — all interleaved. How would you restructure it?',
      answer: 'Separate it into layers: a settings module that reads and validates config once; adapters for I/O (database repository, email sender) behind small interfaces; a pure pricing module operating on plain data classes; and a thin main()/CLI that wires them together. Dependencies point inward to the pure core, which gets fast unit tests; adapters get a few integration tests.',
      explanation: py`This is the functional-core / imperative-shell idea scaled up — the start of [clean architecture](lesson:clean-architecture). Passing collaborators (repository, mailer, settings) into the core instead of importing globals makes them replaceable with fakes in tests.`,
      whyAsked: 'Tests design judgement and refactoring strategy on realistic legacy code.',
      mistakes: ['Proposing a rewrite from scratch', 'Creating many layers with no tests to protect the refactor', 'Leaving os.environ lookups inside business logic'],
      followUps: ['How would you refactor safely without breaking it?', 'How would you test the email sending?'],
      modelAnswer: 'First I would pin the current behaviour with a couple of end-to-end tests so I can refactor safely. Then I would pull configuration into one settings object built and validated at start-up, so nothing else reads os.environ. I would move the pricing rules into pure functions over simple dataclasses — that is where the business value is, and it becomes trivially unit-testable. Database access and email sending become small adapter classes passed into the code that needs them, so tests can substitute fakes. Finally main() just loads settings, constructs the adapters, calls the core and reports the result. Dependencies all point inwards, which also prevents circular imports as it grows.',
    },
    {
      id: 'project-structure-merge-settings',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `merge_settings(defaults, file_settings, environ, prefix="APP_")` returning a new dict. Precedence: defaults < file < environment. File keys must exist in defaults (otherwise raise `ValueError("unknown setting: <key>")`). An env var `APP_<KEY>` (key upper-cased) overrides, converted to the type of the default: `int`, `str`, or `bool` where "1/true/yes/on" → True and "0/false/no/off" → False (case-insensitive; anything else raises `ValueError`). Don\'t mutate the inputs.',
      answer: 'Copy defaults; validate and apply file values; for each key look up prefix + key.upper() in environ and convert with a bool parser for bool defaults or type(default)(raw) otherwise.',
      explanation: py`This is the classic configuration-layering pattern used by many frameworks. Checking \`bool\` **before** \`int\` matters because \`bool\` is a subclass of \`int\` — and \`bool("false")\` is \`True\`, so a dedicated parser is required. Passing \`environ\` in (instead of reading \`os.environ\`) makes the function pure and testable.`,
      starter: { files: { 'main.py': SETTINGS_START } },
      tests: [
        { name: 'defaults when nothing overrides', code: py`assert merge_settings({"port": 8000}, {}, {}) == {"port": 8000}` },
        { name: 'file overrides defaults, env overrides file', code: py`r = merge_settings({"port": 8000, "db_url": "sqlite:///dev.db"}, {"port": 9000, "db_url": "x"}, {"APP_PORT": "7000"})
assert r == {"port": 7000, "db_url": "x"}` },
        { name: 'converts env values to the default\'s type', code: py`r = merge_settings({"port": 8000, "debug": False, "name": "dev"}, {}, {"APP_PORT": "8080", "APP_DEBUG": "Yes", "APP_NAME": "prod"})
assert r == {"port": 8080, "debug": True, "name": "prod"} and isinstance(r["port"], int)` },
        { name: 'false-y strings become False', code: py`assert merge_settings({"debug": True}, {}, {"APP_DEBUG": "off"})["debug"] is False` },
        { name: 'bad bool raises ValueError', code: py`with raises(ValueError):
    merge_settings({"debug": False}, {}, {"APP_DEBUG": "maybe"})` },
        { name: 'unknown file key raises ValueError', code: py`with raises(ValueError, match="unknown setting: colour"):
    merge_settings({"port": 1}, {"colour": "red"}, {})` },
        { name: 'custom prefix and no mutation', code: py`d, f = {"port": 1}, {"port": 2}
r = merge_settings(d, f, {"SHOP_PORT": "3", "APP_PORT": "9"}, prefix="SHOP_")
assert r == {"port": 3} and d == {"port": 1} and f == {"port": 2}` },
      ],
      solution: { files: { 'main.py': py`TRUE = {"1", "true", "yes", "on"}
FALSE = {"0", "false", "no", "off"}


def parse_bool(raw):
    value = raw.strip().lower()
    if value in TRUE:
        return True
    if value in FALSE:
        return False
    raise ValueError(f"not a boolean: {raw!r}")


def merge_settings(defaults, file_settings, environ, prefix="APP_"):
    """defaults < file settings < environment variables. Return a new dict."""
    merged = dict(defaults)
    for key, value in file_settings.items():
        if key not in defaults:
            raise ValueError(f"unknown setting: {key}")
        merged[key] = value
    for key, default in defaults.items():
        raw = environ.get(prefix + key.upper())
        if raw is None:
            continue
        if isinstance(default, bool):        # check bool before int: bool is an int subclass
            merged[key] = parse_bool(raw)
        else:
            merged[key] = type(default)(raw)
    return merged


DEFAULTS = {"port": 8000, "debug": False, "db_url": "sqlite:///dev.db"}
print(merge_settings(DEFAULTS, {"port": 9000}, {"APP_DEBUG": "true"}))
` } },
      hints: ['Start from merged = dict(defaults) so the input is never mutated.', 'Environment values are always strings: convert with type(default)(raw) — but bool("false") is True, so bools need their own parser.', 'Test isinstance(default, bool) before anything numeric, because True is also an int.'],
      whyAsked: 'Configuration loading appears in every real service; this checks careful handling of precedence, types and validation.',
      mistakes: ['Using bool(raw) for booleans', 'Mutating the defaults dict', 'Silently ignoring unknown keys (typos then do nothing)'],
      followUps: ['How would you report all errors at once instead of the first?', 'Which libraries do this for you? (e.g. pydantic-settings)', 'How would you keep secrets out of logs?'],
      modelAnswer: 'I copy the defaults so nothing is mutated, then apply the file settings, rejecting any key that is not in the defaults so a typo fails loudly. Then for each known key I look up the prefixed, upper-cased environment variable. Environment values are always strings, so I convert them to the default\'s type — with a dedicated boolean parser, because bool("false") is True — and I check bool before int since bool is a subclass of int. Taking environ as a parameter keeps the function pure, so tests pass a plain dict instead of patching os.environ. In production I might use a library like pydantic-settings that does this plus validation.',
    },
    {
      id: 'project-structure-stdlib-toolkit',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Which standard-library modules do you reach for most often, and for what?',
      answer: 'pathlib for paths, json/csv/tomllib for data formats, logging for diagnostics, argparse for CLIs, dataclasses and typing for data and annotations, collections (Counter, defaultdict, deque) and itertools/functools for data processing and caching, datetime for time, re for patterns, subprocess for running programs, and unittest/unittest.mock for tests — with sys/os for interpreter and environment access.',
      explanation: py`Interviewers want concrete, honest examples: "\`Counter\` to tally error codes in logs", "\`functools.cache\` on an expensive pure function", "\`subprocess.run([...], check=True)\` instead of \`os.system\`". Knowing the stdlib avoids unnecessary dependencies.`,
      whyAsked: 'A quick signal of real-world fluency and whether you reinvent things or know the batteries.',
      mistakes: ['Listing modules without saying what you used them for', 'Mentioning only third-party libraries', 'Recommending os.path everywhere when pathlib is clearer'],
      followUps: ['When would you pick a third-party package over the stdlib equivalent?', 'What does functools.cache do and when is it unsafe?'],
      modelAnswer: 'Day to day I use pathlib for anything with files, json and csv for data, and tomllib for reading config. Every service gets logging with a logger per module, and command-line tools get argparse. For data I lean on dataclasses and type hints, and on collections — Counter for tallies, defaultdict for grouping, deque for queues — plus itertools and functools, for example functools.cache on expensive pure functions. datetime handles timestamps, re handles parsing messy text, subprocess.run with a list of arguments replaces os.system, and unittest.mock is useful even when the tests run under pytest. I only add a third-party package when it clearly beats the standard library, like requests or httpx for HTTP.',
    },
  ],

  takeaways: [
    'A conventional layout — pyproject.toml, README.md, .gitignore, src/<package>/, tests/ — lets people and tools find everything.',
    'The src layout forces tests to use the installed package (pip install -e .), catching packaging mistakes early.',
    'Keep logic pure, push I/O to thin modules at the edge, and read configuration once into a settings object.',
    'Configure logging once in the entry point; modules use logging.getLogger(__name__).',
    'Never commit virtual environments, caches, build output or secrets.',
    'Paths in code are relative to the working directory — pass them in, or use importlib.resources for packaged data.',
    'Know the standard library\'s big sixteen: os, sys, pathlib, json, csv, re, datetime, collections, itertools, functools, logging, argparse, subprocess, typing, dataclasses, unittest.',
  ],
}
