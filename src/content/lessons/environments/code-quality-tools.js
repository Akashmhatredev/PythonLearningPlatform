// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LINTER = py`"""A tiny, SIMPLIFIED linter built on the standard-library ast module.

Real linters (Ruff, flake8, pylint) implement hundreds of rules and handle
scopes, __all__ re-exports, conditional imports, configuration and more.
"""
import ast
import re

SNAKE_CASE = re.compile(r"^_{0,2}[a-z][a-z0-9_]*$")


def check_unused_imports(tree):
    """L001: a name is imported but never used."""
    imported = {}                                       # bound name -> import node
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imported[alias.asname or alias.name.split(".")[0]] = node
        elif isinstance(node, ast.ImportFrom):
            for alias in node.names:
                imported[alias.asname or alias.name] = node
    used = {node.id for node in ast.walk(tree) if isinstance(node, ast.Name)}
    return [(node.lineno, node.col_offset, "L001", f"'{name}' imported but unused")
            for name, node in imported.items() if name not in used]


def check_function_names(tree):
    """L002: function names should be snake_case (PEP 8)."""
    return [(node.lineno, node.col_offset, "L002", f"function name '{node.name}' should be snake_case")
            for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
            and not SNAKE_CASE.match(node.name)]


def check_mutable_defaults(tree):
    """L003: a list/dict/set default is created once and shared by every call."""
    problems = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)):
            for default in node.args.defaults + node.args.kw_defaults:
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    problems.append((default.lineno, default.col_offset, "L003",
                                     "mutable default argument: use None and create it inside"))
    return problems


RULES = [check_unused_imports, check_function_names, check_mutable_defaults]


def lint(source, filename="<string>"):
    """Parse the source once, run every rule, return sorted (line, col, code, message)."""
    tree = ast.parse(source, filename)
    return sorted(problem for rule in RULES for problem in rule(tree))
`

const SAMPLE = py`"""Shopping-list helpers, deliberately untidy for the linter to find."""
import json
import os
from pathlib import Path


def addItem(item, basket=[]):
    basket.append(item)
    return basket


def count_items(baskets):
    return sum(len(basket) for basket in baskets)


def load_basket(path):
    return json.loads(Path(path).read_text())
`

const MAIN = py`"""Run the mini linter over sample.py and report like Ruff and flake8 do."""
from pathlib import Path

from linter import lint

source = Path("sample.py").read_text()
problems = lint(source, "sample.py")
for line, col, code, message in problems:
    print(f"sample.py:{line}:{col + 1}: {code} {message}")

if problems:
    print(f"Found {len(problems)} problem(s).")
else:
    print("All checks passed!")
`

const PRINTS_SOURCE = py`SOURCE = '''import logging

log = logging.getLogger(__name__)


def report(rows):
    print("debug:", rows)                  # leftover debug output
    message = "call print() to show it"   # just a string
    log.info("rows: %d", len(rows))
    # print(rows)  <- commented out, fine
    return [print(row) for row in rows]
'''
`

const ARGS_SOURCE = py`SOURCE = '''
def ok(a, b, c):
    pass


def create_user(name, email, age, city, country, phone):
    pass


class Report:
    def render(self, title, rows, width, height, colour):
        pass

    def export(self, path, fmt, *, compress=False, encoding="utf-8", overwrite=False, **options):
        pass
'''
`

export default {
  id: 'code-quality-tools',
  title: 'Formatters, linters & pre-commit',
  summary: 'Let tools enforce style and catch bugs: a formatter (Black, Ruff) fixes layout, linters (Ruff, flake8, pylint) flag problems, type checkers verify types, and pre-commit plus CI run them on every change.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['project-structure', 'pip-and-dependencies'],
  related: ['static-type-checking', 'clean-code', 'type-hints', 'testing-fundamentals', 'packaging', 'virtual-environments'],
  tags: ['code quality', 'PEP 8', 'style', 'formatter', 'Black', 'Ruff', 'ruff format', 'linter', 'flake8', 'pylint', 'isort', 'import sorting', 'type checker', 'mypy', 'pyright', 'pre-commit', 'CI', 'GitHub Actions', 'noqa', 'ast'],
  apis: [
    { name: 'ruff check [--fix]', summary: 'Lint the project (and auto-fix what is safe to fix).' },
    { name: 'ruff format [--check]', summary: 'Format code in a Black-compatible style (or only report what would change).' },
    { name: 'black .', summary: 'The Black formatter: rewrites code into one consistent style.' },
    { name: 'flake8 / pylint', summary: 'Classic linters: flake8 is fast and plugin-based; pylint does deeper, more opinionated analysis.' },
    { name: 'mypy / pyright', summary: 'Static type checkers that verify type hints without running the code.' },
    { name: 'pre-commit install', summary: 'Install git hooks that run the configured checks before every commit.' },
    { name: '# noqa: F401', summary: 'Silence one specific linter rule on one line (with a reason).' },
    { name: 'ast.parse(source)', summary: 'Parse Python source into an abstract syntax tree — the structure linters inspect.' },
    { name: 'ast.walk(tree)', summary: 'Iterate over every node in a syntax tree.' },
  ],
  docs: [
    { label: 'PEP 8 — Style guide for Python code', url: 'https://peps.python.org/pep-0008/' },
    { label: 'ast — Abstract syntax trees', url: 'https://docs.python.org/3/library/ast.html' },
    { label: 'Ruff documentation', url: 'https://docs.astral.sh/ruff/' },
    { label: 'Black documentation', url: 'https://black.readthedocs.io/' },
    { label: 'pre-commit', url: 'https://pre-commit.com/' },
    { label: 'mypy documentation', url: 'https://mypy.readthedocs.io/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Professional teams don't argue about spaces in code review, and they don't rely on eagle-eyed reviewers to spot an unused import or a forgotten variable. **Tools** do that, automatically, on every change. Four kinds matter:`,
    py`| tool type | what it does | examples |
|---|---|---|
| **formatter** | rewrites the *layout* of your code into one consistent style — never changes what it does | Black, \`ruff format\` |
| **linter** | reads your code and *reports problems*: unused imports, undefined names, risky patterns, style violations | Ruff, flake8, pylint |
| **import sorter** | groups and alphabetises imports (stdlib / third-party / local) | isort, Ruff's \`I\` rules |
| **type checker** | checks your [type hints](lesson:type-hints) without running the code | mypy, pyright — see [static type checking](lesson:static-type-checking) |`,
    py`They're configured once in \`pyproject.toml\`, run automatically by **pre-commit** before every commit, and again by **CI** (continuous integration — a server that checks every push). In the playground you'll build a tiny linter yourself with Python's \`ast\` module, to see how these tools work inside.`,
  ],
  why: [
    py`**Consistency for free.** PEP 8 describes how Python code should look, but people drift. A formatter makes every file look the same, so diffs only show real changes and code reviews focus on logic.`,
    py`**Bugs caught in seconds.** Linters find real mistakes before you run anything: a misspelled variable (\`F821 undefined name\`), a [mutable default argument](lesson:function-arguments), an import you no longer use, a bare \`except:\` swallowing \`KeyboardInterrupt\`.`,
    py`**Fast feedback, cheap fixes.** A problem flagged in your editor costs a second; the same bug found in production costs hours. Each layer — editor, pre-commit, CI — catches what the previous one missed.`,
    py`**Shared standards without arguments.** "The formatter decides" ends style debates. New teammates get the team's conventions automatically.`,
  ],
  eli15: [
    py`Think about handing in a school essay. A **formatter** is like the "auto-format" button: it fixes the margins, the spacing and the font so every page looks neat — but it never changes your words.`,
    py`A **linter** is like a spell- and grammar-checker with opinions: "you used this word but never explained it", "this sentence doesn't go anywhere", "you wrote *their* but meant *there*". It points; you decide.`,
    py`**Pre-commit** is a checklist taped to the door — "keys? phone? homework?" — that you run every time before you leave the house (before every commit). **CI** is the teacher checking every essay that's handed in, whether or not you used the checklist.`,
  ],
  analogy: {
    title: 'A newspaper\'s editorial desk',
    body: [
      py`A newspaper has a **style guide** (how dates and numbers are written). A **copy editor** silently fixes layout and style in every article. A **fact-checker** flags claims that look wrong and asks the writer. Before an article is filed, the writer runs through a **checklist**. And nothing is printed until the **chief editor** has signed off.`,
      py`Writers stop thinking about commas and spend their energy on the story.`,
    ],
    mapping: [
      ['the style guide', 'PEP 8 plus your pyproject.toml configuration'],
      ['the copy editor (fixes silently)', 'the formatter: Black / ruff format'],
      ['the fact-checker (flags and asks)', 'the linter: Ruff / flake8 / pylint'],
      ['checking that names and numbers match the records', 'the type checker: mypy / pyright'],
      ['the writer\'s checklist before filing', 'pre-commit hooks on git commit'],
      ['the chief editor\'s sign-off', 'CI checks required before merging'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Where the checks run',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'editor', label: 'your editor', note: 'format on save, live lint', x: 100, y: 160, tone: 'yellow' },
        { id: 'commit', label: 'git commit', note: 'pre-commit hooks', x: 290, y: 70, tone: 'blue' },
        { id: 'push', label: 'git push / PR', note: 'CI pipeline', x: 470, y: 160, tone: 'blue' },
        { id: 'checks', label: 'ruff · format · mypy · tests', note: 'same config everywhere', x: 290, y: 260, tone: 'kraft' },
        { id: 'merge', label: 'merge', note: 'only when green', x: 660, y: 160, tone: 'ink' },
      ],
      edges: [
        { from: 'editor', to: 'commit', label: 'save + commit' },
        { from: 'commit', to: 'checks', label: 'fast checks', dashed: true },
        { from: 'commit', to: 'push', label: 'hooks pass' },
        { from: 'push', to: 'checks', label: 'all checks', dashed: true },
        { from: 'push', to: 'merge', label: 'green' },
      ],
      steps: [
        { focus: ['editor'], text: py`**In the editor:** the formatter runs on save and the linter underlines problems as you type (editor extensions for Ruff, Black, mypy/Pylance). Fastest feedback, but it depends on each person's setup.` },
        { focus: ['commit', 'checks'], edges: ['editor->commit', 'commit->checks'], text: py`**On commit:** pre-commit runs the configured hooks on the files you're committing — e.g. \`ruff check --fix\` and \`ruff format\`. If a hook fails or changes a file, the commit stops so you can look and re-commit.` },
        { focus: ['push', 'checks'], edges: ['commit->push', 'push->checks'], text: py`**On push / pull request:** CI runs the **same** checks on a clean machine — plus the slower ones such as the full test suite and type checking. Hooks can be skipped (\`git commit --no-verify\`) or not installed; CI can't be skipped.` },
        { focus: ['merge'], edges: ['push->merge'], text: py`**Merge** only when CI is green (a *required status check*). One shared configuration in \`pyproject.toml\` means the editor, the hook and CI all agree.` },
      ],
    },
    alt: 'Diagram: code moves from the editor (format on save, live linting) to git commit, where pre-commit hooks run fast checks, then to git push or pull request, where CI runs ruff, the formatter check, mypy and tests, and finally to merge, which happens only when the checks are green.',
    caption: py`Each layer is a safety net for the one before it. The configuration lives in one place, so they all enforce the same rules.`,
  },
  syntax: [
    py`#### PEP 8 in one table`,
    py`| topic | rule of thumb |
|---|---|
| indentation | 4 spaces, never tabs |
| line length | PEP 8 says 79 characters; Black and Ruff default to 88; many teams pick 88–100 |
| names | \`snake_case\` functions and variables, \`CapWords\` classes, \`UPPER_CASE\` constants |
| imports | top of file, one module per line, grouped stdlib / third-party / local |
| blank lines | two around top-level functions and classes, one between methods |
| whitespace | \`x = f(a, b)\`, not \`x=f( a,b )\`; no space before \`:\` or \`(\` |
| comparisons | \`if x is None\`, not \`== None\`; \`if items:\`, not \`if len(items) > 0\` |`,
    py`PEP 8 itself says consistency within a project matters more than any single rule. Formatters exist so you never have to think about most of this table.`,
    py`#### Formatting`,
    { code: py`ruff format .            # rewrite files in place (Black-compatible style)
ruff format --check .    # CI: only report files that would change (non-zero exit status)
ruff format --diff .     # show what would change
black .                  # the Black formatter; black --check . for CI`, lang: 'bash' },
    py`Formatters are **deterministic and opinionated**: the same input always gives the same output, with almost no options. That's the point — there's nothing left to argue about. They only change layout (whitespace, line breaks, quotes, trailing commas), never behaviour.`,
    py`#### Linting`,
    { code: py`ruff check .             # report problems
ruff check --fix .       # also apply safe automatic fixes
flake8 .                 # classic, plugin-based linter
pylint src/              # deeper, slower, more opinionated analysis`, lang: 'bash' },
    py`Linters report problems as **rule codes**. A few you'll see constantly (Ruff codes; many come from flake8 and its plugins):`,
    py`| code | meaning |
|---|---|
| \`F401\` | module imported but unused |
| \`F841\` | local variable assigned but never used |
| \`F821\` | undefined name (often a typo) |
| \`E711\` | comparison to \`None\` should use \`is\` |
| \`E722\` | bare \`except:\` |
| \`B006\` | mutable default argument (from flake8-bugbear) |
| \`I001\` | imports are not sorted |
| \`N802\` | function name should be lowercase (pep8-naming) |
| \`UP\` rules | code that can use newer Python syntax (pyupgrade) |`,
    py`#### Configure once, in pyproject.toml`,
    { code: py`[tool.ruff]
line-length = 88
target-version = "py311"          # which Python syntax to assume

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "N"]   # rule families to enable
ignore = ["E501"]                          # let the formatter handle line length

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101"]               # assert is fine in tests

[tool.mypy]
strict = true`, lang: 'toml', title: 'pyproject.toml' },
    py`#### Silencing a rule (sparingly)`,
    { code: py`from . import models  # noqa: F401  (re-exported for users of this package)

result = legacy_call()  # type: ignore[no-untyped-call]  (third-party stub missing)

# fmt: off
IDENTITY = [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
]
# fmt: on`, lang: 'python', static: true },
    py`Always name the specific code (\`# noqa: F401\`, not a bare \`# noqa\`) and say why — a blanket suppression hides future problems on that line too.`,
    py`#### pre-commit: run the checks on every commit`,
    { code: py`# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: vX.Y.Z              # pin a real release tag; 'pre-commit autoupdate' bumps it
    hooks:
      - id: ruff-check       # older releases name this hook 'ruff'
        args: [--fix]
      - id: ruff-format`, lang: 'text', title: '.pre-commit-config.yaml' },
    { code: py`python -m pip install pre-commit    # or: pipx install pre-commit
pre-commit install                  # adds a git hook to .git/hooks/pre-commit
pre-commit run --all-files          # run every hook on the whole repo (first time, or in CI)`, lang: 'bash' },
    py`Check the ruff-pre-commit README for the current hook names and latest tag. pre-commit installs each hook's tool in its own cached environment, so hooks work the same on every machine regardless of what's in your venv.`,
    py`#### CI: the check nobody can skip`,
    { code: py`# .github/workflows/quality.yml (GitHub Actions; other CI systems look similar)
name: quality
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: python -m pip install -e ".[dev]"
      - run: ruff check .
      - run: ruff format --check .
      - run: mypy src
      - run: pytest`, lang: 'text', title: 'a minimal CI workflow' },
  ],
  walkthrough: {
    title: 'How the mini linter works',
    lang: 'python',
    code: LINTER,
    intro: py`Real linters don't search your code as text — they **parse** it into an *abstract syntax tree* (AST): a tree of objects such as \`FunctionDef\`, \`Import\`, \`Call\` and \`Name\`. Python's standard-library \`ast\` module gives you the same tree. This is \`linter.py\` from the playground.`,
    steps: [
      { lines: [13, 22], text: py`\`ast.walk(tree)\` visits every node. Each \`Import\` / \`ImportFrom\` node lists the names it binds — \`import os.path\` binds \`os\`, \`import json as j\` binds \`j\` — so we record the *bound* name.` },
      { lines: [23, 25], text: py`Every use of a variable is a \`Name\` node (\`os.path.join\` contains \`Name(id='os')\`). Imported names that never appear as a \`Name\` are unused. **Simplified:** real linters also understand scopes, \`__all__\` and names only used in strings or type comments.` },
      { lines: [28, 33], text: py`A \`FunctionDef\` node knows its \`name\` and position (\`lineno\`, \`col_offset\`), so the naming rule is one regex check.` },
      { lines: [36, 45], text: py`Default values live in \`node.args.defaults\` (and \`kw_defaults\` for keyword-only parameters). A list, dict or set **literal** there is created once, when \`def\` runs, and shared by every call — a classic bug.` },
      { lines: [51, 54], text: py`Parse once, run every rule over the same tree, sort by position. Because it works on the tree, a word like "print" inside a string or a comment can never cause a false alarm.` },
    ],
  },
  playground: {
    title: 'Build a tiny linter',
    objective: 'Run the linter on sample.py, fix what it finds, then teach the linter new tricks: a None-comparison rule and # noqa support.',
    files: { 'main.py': MAIN, 'linter.py': LINTER, 'sample.py': SAMPLE },
    expected: py`\`\`\`text
sample.py:3:1: L001 'os' imported but unused
sample.py:7:1: L002 function name 'addItem' should be snake_case
sample.py:7:26: L003 mutable default argument: use None and create it inside
Found 3 problem(s).
\`\`\`

The format \`file:line:column: CODE message\` is the convention Ruff, flake8 and many editors understand (columns are 1-based for humans; \`ast\` counts from 0). Ruff would report these as F401, N802 and B006. **Simplified:** this linter has three rules; Ruff has hundreds, written in Rust.`,
    experiments: [
      {
        id: 'clean-sample',
        task: py`Make **sample.py** pass: remove the unused import, rename \`addItem\` to \`add_item\`, and replace the mutable default with \`basket=None\` (create a new list inside when it's \`None\`).`,
        hint: py`\`\`\`python
def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket
\`\`\``,
        tests: [
          { name: 'no problems left', code: py`assert 'All checks passed!' in output` },
          { name: 'add_item no longer shares its default list', code: py`sample = module('sample')
assert sample.add_item("milk") == ["milk"]
assert sample.add_item("eggs") == ["eggs"], 'Each call without a basket must start a new list'` },
        ],
        explain: py`The linter found a real bug, not just style: with \`basket=[]\`, the list is created once when \`def\` runs, so every call without a basket appends to the *same* list. \`None\` as a sentinel plus a fresh list inside the function is the standard fix (see [function arguments](lesson:function-arguments)).`,
      },
      {
        id: 'none-rule',
        task: py`Add a rule \`check_none_comparison(tree)\` to **linter.py** reporting \`L004\` for \`== None\` or \`!= None\`, and add it to \`RULES\`.`,
        hint: py`Look for \`ast.Compare\` nodes. Loop over \`zip(node.ops, node.comparators)\`; flag when the op is \`ast.Eq\` or \`ast.NotEq\` and the comparator is an \`ast.Constant\` whose \`value is None\`. Return \`(node.lineno, node.col_offset, "L004", "comparison to None: use 'is' / 'is not'")\`.`,
        tests: [
          { name: 'flags == None and != None', code: py`codes = [p[2] for p in module('linter').lint("x = None\nprint(x == None, x != None)\n")]
assert codes.count("L004") == 2` },
          { name: 'is None is fine', code: py`assert module('linter').lint("x = None\nprint(x is None)\n") == []` },
        ],
        explain: py`\`== None\` asks the object whether it *equals* None, and a class can define \`__eq__\` to say yes. \`is None\` checks identity with the single \`None\` object — always correct and faster. Ruff and flake8 call this rule E711.`,
      },
      {
        id: 'noqa',
        task: py`Support suppression comments: in \`lint()\`, drop every problem whose source line contains \`# noqa\`. Then add \`  # noqa\` to the end of the \`import os\` line in sample.py.`,
        hint: py`\`lines = source.splitlines()\`, then keep \`p\` only if \`"# noqa" not in lines[p[0] - 1]\` (line numbers start at 1).`,
        tests: [
          { name: 'lint() honours # noqa', code: py`lint = module('linter').lint
assert lint("import os  # noqa\n") == []
assert len(lint("import os\n")) == 1` },
          { name: 'the os import is no longer reported', code: py`assert "'os' imported but unused" not in output` },
        ],
        explain: py`Every real linter has an escape hatch, because rules have legitimate exceptions — an import kept only to re-export a name, for example. Real tools let you name the rule (\`# noqa: F401\`) so other problems on the same line are still reported. Use it rarely, with a comment saying why.`,
      },
      {
        id: 'see-the-tree',
        task: py`Look at what the linter sees. At the end of **main.py**, add \`import ast\` and \`print(ast.dump(ast.parse("total = price * 2"), indent=2))\`.`,
        tests: [{ name: 'prints the tree', code: py`assert "Assign(" in output and "BinOp(" in output and "Mult()" in output` }],
        explain: py`\`total = price * 2\` becomes an \`Assign\` node whose target is \`Name(id='total')\` and whose value is a \`BinOp\` (binary operation) with \`Mult()\`. Linters, formatters, type checkers and IDE refactorings all work on trees like this.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Before and after the tools',
    props: {
      left: { label: 'As typed', lang: 'python', code: py`import sys,os
def total( items,tax = 0.2 ):
  result=0
  for i in items : result+=i['price']*( 1+tax )
  return result
x = total([{'price':10},{'price':5}],tax=0.1)` },
      right: { label: 'After import sorting + ruff format', lang: 'python', code: py`import os
import sys


def total(items, tax=0.2):
    result = 0
    for i in items:
        result += i["price"] * (1 + tax)
    return result


x = total([{"price": 10}, {"price": 5}], tax=0.1)` },
      points: [
        'The formatter fixed indentation, spacing, quotes and blank lines — the program does exactly the same thing.',
        'Import sorting (isort or Ruff\'s I rules) split the combined import and alphabetised it; formatters alone leave import order alone.',
        'Neither tool removed os and sys: deleting code is a decision, so the linter reports them (F401 imported but unused) and ruff check --fix can remove them if you ask.',
        'Because output is deterministic, two people formatting the same code always get identical files — diffs show only real changes.',
      ],
    },
    alt: 'Side by side: messy code with a combined import, odd spacing, two-space indentation and single quotes, and the same code after import sorting and formatting with separate sorted imports, four-space indentation, consistent spacing, double quotes and blank lines between definitions.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Formatters and linters never *run* your program. They read the source, turn it into a tree of pieces (an *abstract syntax tree*), and inspect or rewrite that tree. That's why they're fast and safe to run on any code — even code that would crash.`,
      py`A formatter's guarantee is that the code means the same thing afterwards. Black, for example, checks that the AST of the reformatted code is equivalent to the original before writing the file.`,
    ],
    technical: [
      py`**From text to tree.** Python source is split into *tokens* (the \`tokenize\` module), then parsed into an AST (the \`ast\` module) — the same parser CPython uses before compiling to bytecode. Linters walk that tree with \`ast.walk\` or an \`ast.NodeVisitor\` subclass; positions (\`lineno\`, \`col_offset\`) come from the nodes.`,
      { code: py`import ast


class CallCounter(ast.NodeVisitor):
    """Count calls by function name — the visitor pattern linters use."""

    def __init__(self):
        self.calls = {}

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            self.calls[node.func.id] = self.calls.get(node.func.id, 0) + 1
        self.generic_visit(node)          # keep walking into arguments


counter = CallCounter()
counter.visit(ast.parse("print(len(items)); print(max(items))"))
print(counter.calls)   # {'print': 2, 'len': 1, 'max': 1}`, lang: 'python', title: 'an ast.NodeVisitor' },
      py`**Comments aren't in the AST.** That's why formatters such as Black and Ruff work from a richer tree (a *concrete* syntax tree that keeps comments and exact tokens), and why \`# noqa\` handling is done on source lines rather than nodes.`,
      py`**Type checkers go further.** mypy and pyright build a model of every name's type across modules and check each call against the annotations — static analysis that needs the whole program, not one file. See [static type checking](lesson:static-type-checking).`,
      py`**Why Ruff is fast.** Ruff is written in Rust and implements the rules of flake8, many popular flake8 plugins, isort, pyupgrade and more in one tool that parses each file once. pylint, by contrast, does deeper *inference* (guessing types and values) to find subtler issues, which costs time — teams sometimes run both.`,
    ],
    production: [
      py`**Pin tool versions.** A new linter release can add rules or change formatting. Pin versions (in your dev dependencies and in \`.pre-commit-config.yaml\`) so every machine and CI agree, and upgrade deliberately in one commit.`,
      py`**Adopting tools on legacy code.** Format the whole codebase in **one** dedicated commit and list it in \`.git-blame-ignore-revs\` so \`git blame\` skips it. Enable lint rules gradually: start with high-value bug rules (\`F\`, \`B\`), add per-file ignores for old modules, and tighten over time (a "ratchet").`,
      py`**Make CI the source of truth.** Pre-commit hooks are a convenience and can be bypassed; required CI checks cannot. Run the formatter in \`--check\` mode and the linter without \`--fix\` in CI, so it reports instead of silently changing code.`,
      py`**Keep the fast loop fast.** Put quick checks (format, lint) in pre-commit; leave slow ones (full type check of a large codebase, tests) to CI or to an opt-in hook stage. If hooks are slow, people disable them.`,
      py`**Rules are tools, not laws.** When a rule produces more noise than value for your team, disable it in configuration with a comment explaining why. Consistency comes from configuration everyone shares, not from individual \`noqa\` comments.`,
    ],
  },
  mistakes: [
    {
      title: 'Blanket suppressions',
      wrong: { code: py`import os, sys  # noqa`, lang: 'python', static: true },
      right: { code: py`import sys  # noqa: F401  (imported for its side effect in tests; see conftest)`, lang: 'python', static: true },
      explanation: py`A bare \`# noqa\` silences **every** rule on that line, including problems introduced later. Name the specific code and explain why — or fix the code instead.`,
    },
    {
      title: 'Formatter and import sorter fighting',
      wrong: { code: py`# isort with its default profile + Black: each run "fixes" the other's output
isort .   ->  changes wrapping of long imports
black .   ->  changes them back`, lang: 'text' },
      right: { code: py`[tool.isort]
profile = "black"          # or: use Ruff for both (ruff check --select I --fix, ruff format)`, lang: 'toml' },
      explanation: py`Tools with overlapping responsibilities need compatible settings, otherwise pre-commit never settles. Use isort's \`black\` profile, or one tool (Ruff) for sorting and formatting.`,
    },
    {
      title: 'Linting only in the editor',
      wrong: { code: py`# "My editor shows no warnings, ship it."
$ git commit -m "fix" --no-verify && git push`, lang: 'bash' },
      right: { code: py`$ pre-commit run --all-files
$ git commit -m "fix" && git push      # CI runs ruff, format --check, mypy, tests`, lang: 'bash' },
      explanation: py`Editor settings differ between people and can be switched off; \`--no-verify\` skips hooks. Shared configuration, pre-commit hooks and required CI checks make quality independent of anyone's setup.`,
    },
    {
      title: 'Reformatting mixed into feature changes',
      wrong: { code: py`$ git commit -am "Add discount codes"   # 3 real lines changed + 400 lines reformatted`, lang: 'bash' },
      right: { code: py`$ git commit -am "Apply ruff format (no behaviour change)"
$ echo <that-commit-hash> >> .git-blame-ignore-revs
$ git commit -am "Add discount codes"`, lang: 'bash' },
      explanation: py`Reviewers can't find the real change in a sea of whitespace. Format the codebase once, separately, and tell \`git blame\` to ignore that commit.`,
    },
    {
      title: 'Treating a passing linter as "no bugs"',
      wrong: { code: py`def average(scores):
    return sum(scores) / len(scores)   # lint-clean, crashes on []`, lang: 'python' },
      right: { code: py`def average(scores):
    if not scores:
        raise ValueError("average() of an empty list")
    return sum(scores) / len(scores)`, lang: 'python' },
      explanation: py`Linters catch patterns, not logic errors. They complement [tests](lesson:testing-fundamentals) and type checking; they don't replace them.`,
    },
  ],
  debugging: [
    {
      symptom: py`pre-commit: "files were modified by this hook" and the commit is aborted`,
      cause: py`A fixing hook (formatter, \`ruff check --fix\`) changed files. pre-commit stops so you can see what changed instead of committing something you didn't review.`,
      fix: py`Look at the changes (\`git diff\`), \`git add\` them and commit again. Running the formatter on save avoids the surprise.`,
    },
    {
      symptom: py`would reformat src/app.py (CI fails on "ruff format --check" or "black --check")`,
      cause: py`Someone committed unformatted code — hooks weren't installed, were skipped, or use a different tool version than CI.`,
      fix: py`Run the formatter locally with the same pinned version, commit the result, and run \`pre-commit install\` so it happens automatically.`,
    },
    {
      symptom: py`F401 'utils.helpers' imported but unused — but the import is needed`,
      cause: py`The import exists for its side effect, or to re-export a name from a package's \`__init__.py\`.`,
      fix: py`Re-export explicitly (\`from .helpers import helper as helper\`, or list it in \`__all__\`), or add \`# noqa: F401\` with a reason.`,
    },
    {
      symptom: py`The linter passes locally but fails in CI with rules you've never seen`,
      cause: py`Different tool versions or configuration: CI installed a newer release, or reads a different config file.`,
      fix: py`Pin tool versions in dev dependencies and \`.pre-commit-config.yaml\`, keep all settings in \`pyproject.toml\`, and run \`pre-commit run --all-files\` locally to reproduce.`,
    },
    {
      symptom: py`error: Argument 1 to "total" has incompatible type "str"; expected "list[float]"  [arg-type]`,
      cause: py`A type checker (mypy) found a call that doesn't match the function's annotations.`,
      fix: py`Fix the call or the annotation — it's usually a real bug. See [static type checking](lesson:static-type-checking).`,
    },
  ],
  bestPractices: [
    'Adopt a formatter (ruff format or Black) and stop discussing style in reviews.',
    'Enable a linter with high-value bug rules first (F, B), then add style rules gradually.',
    'Keep all tool configuration in pyproject.toml so the editor, hooks and CI agree.',
    'Pin tool versions and upgrade them deliberately in a dedicated commit.',
    'Run fast checks with pre-commit; make CI (format --check, lint, type check, tests) a required status check.',
    'Suppress rules only with a specific code and a reason (# noqa: F401 …).',
    'Format a legacy codebase in one separate commit and add it to .git-blame-ignore-revs.',
    'Remember: tools catch patterns; tests and type checks catch logic.',
  ],
  useCases: [
    'Keeping a team\'s codebase consistent without style debates.',
    'Catching typos, unused code and risky patterns before review.',
    'Enforcing project conventions (import order, naming) automatically.',
    'Writing custom checks for your own codebase with the ast module.',
  ],
  comparison: {
    title: 'The main tools at a glance',
    headers: ['', 'Ruff', 'Black', 'flake8', 'pylint', 'mypy / pyright'],
    rows: [
      ['kind', 'linter + formatter + import sorter', 'formatter', 'linter', 'linter', 'type checker'],
      ['changes code?', 'yes (format, --fix)', 'yes', 'no', 'no', 'no'],
      ['speed', 'very fast (Rust)', 'fast', 'fast', 'slower (deep inference)', 'moderate; incremental caches help'],
      ['configuration', 'pyproject.toml', 'pyproject.toml (few options)', 'setup.cfg / .flake8 / tox.ini', 'pyproject.toml or .pylintrc', 'pyproject.toml / pyrightconfig.json'],
      ['typical use', 'default choice for new projects', 'established standard formatter', 'existing projects with plugins', 'extra-thorough analysis', 'checking type hints'],
    ],
    note: py`Many modern projects use **Ruff** (lint + format + imports) plus **mypy or pyright**. Older projects often run Black + isort + flake8; all are good choices.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'code-quality-tools-q1',
      type: 'mcq',
      prompt: 'What is the key difference between a formatter and a linter?',
      options: [
        'A formatter rewrites layout without changing behaviour; a linter reports problems (and may offer fixes)',
        { text: 'A formatter checks types; a linter checks spacing', why: 'Type checking is a third kind of tool (mypy, pyright). Spacing is the formatter\'s job.' },
        { text: 'They are the same thing with different names', why: 'They overlap a little (Ruff does both), but formatting and linting are different jobs.' },
        { text: 'A linter runs your program to find bugs; a formatter does not', why: 'Neither runs your code — both analyse the source text/tree.' },
      ],
      answer: 0,
      explanation: py`Formatters (Black, \`ruff format\`) change only whitespace, line breaks, quotes and similar layout. Linters (Ruff, flake8, pylint) analyse the code and report rule violations, some of which they can auto-fix.`,
    },
    {
      id: 'code-quality-tools-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import ast

tree = ast.parse("x = 1")
print([type(node).__name__ for node in ast.walk(tree)])`,
      answer: "['Module', 'Assign', 'Name', 'Constant', 'Store']",
      accept: ["['Module', 'Assign', 'Name', 'Constant', 'Store']"],
      explanation: py`\`ast.walk\` visits nodes breadth-first: the \`Module\`, its body's \`Assign\`, the assignment's target \`Name\` and value \`Constant\`, then the \`Name\`'s context object \`Store\` (it's being assigned to, not read).`,
    },
    {
      id: 'code-quality-tools-q3',
      type: 'bug',
      prompt: py`A linter flags this function with **B006**, and calling \`add_tag("a")\` then \`add_tag("b")\` returns \`['a', 'b']\`. Click the line with the bug.`,
      code: py`def add_tag(tag, tags=[]):
    """Return the tags with tag added."""
    tags.append(tag)
    return tags`,
      answerLine: 1,
      explanation: py`The default list is created **once**, when \`def\` runs, and shared by every call that doesn't pass \`tags\`. Use \`tags=None\` and \`if tags is None: tags = []\` inside.`,
    },
    {
      id: 'code-quality-tools-q4',
      type: 'fill',
      prompt: 'Fill in the Ruff subcommands: the first lints and auto-fixes, the second verifies formatting in CI without changing files.',
      code: py`ruff ___ --fix .
ruff ___ --check .`,
      answer: [['check'], ['format']],
      explanation: py`\`ruff check\` runs the linter (\`--fix\` applies safe fixes); \`ruff format --check\` exits non-zero if any file would be reformatted, without writing anything — ideal for CI.`,
    },
    {
      id: 'code-quality-tools-q5',
      type: 'mcq',
      prompt: py`Your team uses pre-commit hooks. Why still run the same checks in CI? **Select all that apply.**`,
      options: [
        'Hooks can be skipped with git commit --no-verify',
        'Not everyone may have run pre-commit install',
        'CI runs on a clean machine with pinned versions — the single source of truth',
        { text: 'CI checks are more accurate because they run the code', why: 'Linters and formatters never run the code, in CI or locally. CI is about enforcement, not different analysis.' },
      ],
      answer: [0, 1, 2],
      explanation: py`Pre-commit gives fast local feedback; required CI checks guarantee that nothing unchecked gets merged.`,
    },
    {
      id: 'code-quality-tools-q6',
      type: 'mcq',
      prompt: py`Which suppression comment is the best practice?`,
      options: [
        { text: 'import os  # noqa', why: 'A bare noqa hides every rule on the line, including future problems.' },
        'from .models import Order  # noqa: F401  (re-exported as part of the package API)',
        { text: '# ruff: noqa  at the top of every file', why: 'That disables linting for the whole file — the linter can no longer help.' },
        { text: 'Rename the variable to _ignore_me so the linter stops complaining', why: 'Gaming a rule hides intent; if the code is needed, suppress the specific rule with a reason.' },
      ],
      answer: 1,
      explanation: py`Name the exact rule and give the reason. (For re-exports, listing the name in \`__all__\` is often even cleaner.)`,
    },
    {
      id: 'code-quality-tools-q7',
      type: 'short',
      prompt: py`Why do many teams prefer an opinionated auto-formatter over a written style guide that everyone follows by hand?`,
      answer: py`Because humans are inconsistent and style debates waste review time. An automatic, deterministic formatter makes every file look the same with zero effort, so diffs only show real changes, reviews focus on logic, and new team members follow the style automatically. Its lack of options is a feature: there's nothing left to argue about. A written guide still matters for things tools can't decide, like naming and structure.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'find-prints',
      title: 'A "no leftover prints" rule',
      difficulty: 'intermediate',
      prompt: py`Teams often forbid leftover debug \`print()\` calls in library code (Ruff's T201 rule). Write \`find_prints(source)\` that returns a **sorted list of line numbers** where the built-in \`print\` is **called**.

Use \`ast\`, not text search, so that:

- \`"call print() to show it"\` inside a string is **not** reported;
- \`# print(rows)\` in a comment is **not** reported;
- \`printer.print("x")\` (a method called print) is **not** reported;
- \`[print(row) for row in rows]\` **is** reported.

For the sample \`SOURCE\`, the answer is \`[7, 11]\`.`,
      files: {
        'main.py': py`import ast

${PRINTS_SOURCE}

def find_prints(source):
    """Sorted line numbers where print(...) is called."""
    return []   # TODO


print(find_prints(SOURCE))
`,
      },
      hints: [
        'Parse with ast.parse(source), then visit every node with ast.walk(tree).',
        'A call is an ast.Call node. Its .func is an ast.Name for print(...), but an ast.Attribute for printer.print(...).',
        'return sorted(node.lineno for node in ast.walk(tree) if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print")',
      ],
      solution: {
        explanation: py`In the AST, strings are \`Constant\` nodes and comments don't exist at all, so a text search's false alarms simply can't happen. A call to the built-in looks like \`Call(func=Name(id='print'))\`; a method call looks like \`Call(func=Attribute(attr='print'))\`, so checking that \`func\` is a \`Name\` excludes it. **Simplified:** a real rule would also notice when \`print\` has been rebound (e.g. \`print = logger.info\`) — that needs scope analysis.`,
        files: {
          'main.py': py`import ast

${PRINTS_SOURCE}

def find_prints(source):
    """Sorted line numbers where print(...) is called."""
    tree = ast.parse(source)
    return sorted(
        node.lineno
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "print"
    )


print(find_prints(SOURCE))
`,
        },
      },
      tests: [
        { name: 'finds the two real calls', code: py`assert find_prints(SOURCE) == [7, 11]` },
        { name: 'ignores strings and comments', code: py`assert find_prints('s = "print(1)"\n# print(2)\n') == []` },
        { name: 'ignores methods named print', code: py`assert find_prints('printer.print("x")\n') == []` },
        { name: 'counts nested calls once each, sorted', code: py`assert find_prints('print(print(1))\nx = 1\nprint()\n') == [1, 1, 3]` },
        { name: 'uses ast, not text search', code: py`assert 'ast.parse' in files['main.py']` },
      ],
    },
    {
      id: 'too-many-arguments',
      title: 'A "too many arguments" rule',
      difficulty: 'intermediate',
      prompt: py`Functions with very long parameter lists are hard to call correctly (pylint's \`too-many-arguments\`). Write \`too_many_arguments(source, limit=5)\` returning a list of \`(line, function_name, count)\` tuples, sorted by line, for every function or method with **more than** \`limit\` parameters.

Count positional-only, normal and keyword-only parameters, plus 1 for \`*args\` and 1 for \`**kwargs\` — but **don't count a first parameter named \`self\` or \`cls\`**.

For the sample \`SOURCE\` the answer is \`[(6, 'create_user', 6), (14, 'export', 6)]\`.`,
      files: {
        'main.py': py`import ast

${ARGS_SOURCE}

def too_many_arguments(source, limit=5):
    """[(line, name, count), ...] for functions with more than limit parameters."""
    return []   # TODO


print(too_many_arguments(SOURCE))
`,
      },
      hints: [
        'Walk the tree and look at ast.FunctionDef and ast.AsyncFunctionDef nodes; their parameters are in node.args.',
        'node.args has posonlyargs, args and kwonlyargs (lists of ast.arg, each with .arg = the name), plus vararg and kwarg (None or an ast.arg).',
        'positional = args.posonlyargs + args.args; drop positional[0] if its .arg is "self" or "cls"; count = len(positional) + len(args.kwonlyargs) + (args.vararg is not None) + (args.kwarg is not None).',
      ],
      solution: {
        explanation: py`\`ast.arguments\` splits parameters into groups that mirror Python's syntax: positional-only (before \`/\`), normal, \`*args\`, keyword-only (after \`*\`) and \`**kwargs\`. Summing them gives the real count; booleans add as 0/1 (\`True + True == 2\`). The receiver (\`self\`/\`cls\`) is skipped because callers never pass it explicitly. \`render\` has exactly 5 counted parameters, so it's allowed; \`export\` reaches 6 thanks to its keyword-only parameters and \`**options\`. The usual fixes for a flagged function: group related values into a [dataclass](lesson:dataclasses), or make rarely used options keyword-only with defaults.`,
        files: {
          'main.py': py`import ast

${ARGS_SOURCE}

def too_many_arguments(source, limit=5):
    """[(line, name, count), ...] for functions with more than limit parameters."""
    found = []
    for node in ast.walk(ast.parse(source)):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        args = node.args
        positional = args.posonlyargs + args.args
        if positional and positional[0].arg in ("self", "cls"):
            positional = positional[1:]
        count = (len(positional) + len(args.kwonlyargs)
                 + (args.vararg is not None) + (args.kwarg is not None))
        if count > limit:
            found.append((node.lineno, node.name, count))
    return sorted(found)


print(too_many_arguments(SOURCE))
`,
        },
      },
      tests: [
        { name: 'flags the sample\'s two functions', code: py`assert too_many_arguments(SOURCE) == [(6, 'create_user', 6), (14, 'export', 6)]` },
        { name: 'self/cls are not counted', code: py`src = "class A:\n    def m(self, a, b, c, d, e):\n        pass\n"
assert too_many_arguments(src) == []` },
        { name: 'counts / and * groups, *args and **kwargs', code: py`src = "def f(a, b, /, c, *args, d, **kw):\n    pass\n"
assert too_many_arguments(src, limit=5) == [(1, 'f', 6)]` },
        { name: 'respects the limit', code: py`assert too_many_arguments("def g(a, b, c):\n    pass\n", limit=2) == [(1, 'g', 3)]
assert too_many_arguments("def g(a, b, c):\n    pass\n", limit=3) == []` },
        { name: 'async functions too', code: py`assert too_many_arguments("async def h(a, b, c):\n    pass\n", limit=2) == [(1, 'h', 3)]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'code-quality-tools-kinds',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between a formatter, a linter and a type checker? Name one of each.',
      answer: 'A formatter rewrites code layout into a consistent style without changing behaviour (Black, ruff format). A linter analyses code for bugs, risky patterns and style violations and reports them (Ruff, flake8, pylint). A type checker verifies that values match the type hints across the program (mypy, pyright). None of them runs the code.',
      explanation: py`They answer different questions: *does it look consistent?* (formatter), *does it contain known bad patterns?* (linter), *do the types line up?* (type checker). Tests answer a fourth: *does it do the right thing?*`,
      whyAsked: 'Basic professional tooling literacy; most teams use all three.',
      mistakes: ['Calling a linter a formatter', 'Thinking these tools execute the code', 'Believing a clean lint means bug-free code'],
      followUps: ['Which would catch an undefined variable?', 'Where do you configure them?'],
      modelAnswer: 'A formatter, like Black or ruff format, only changes the layout of the code — whitespace, line breaks, quotes — so it looks consistent, and it guarantees behaviour is unchanged. A linter, like Ruff, flake8 or pylint, reads the code and reports problems: unused imports, undefined names, mutable default arguments, style violations; some it can auto-fix. A type checker, like mypy or pyright, uses the type hints to check that calls and return values line up across the whole program. None of them runs the code, so they complement tests rather than replace them.',
    },
    {
      id: 'code-quality-tools-ruff-vs-classic',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare Ruff with the classic combination of Black, isort and flake8 (plus pylint). Why have many projects switched?',
      answer: 'Ruff is one fast tool (written in Rust) that reimplements flake8 and many of its plugins, isort and pyupgrade rules, and includes a formatter designed to be Black-compatible — one config section, one dependency, one pass. The classic stack is mature and fine, but needs several tools kept compatible. pylint still offers deeper inference-based checks some teams keep alongside.',
      explanation: py`The practical wins are speed (fast enough to run on save and in pre-commit on large repos) and simplicity (one tool, configured in \`pyproject.toml\`). Trade-offs: not every plugin or pylint check exists in Ruff, and teams migrating should map their existing rule codes.`,
      whyAsked: 'Tool choice comes up when joining or modernising a team; good answers are factual, not tribal.',
      mistakes: ['Claiming Ruff replaces type checkers', 'Inventing benchmark numbers', 'Assuming the formatter output is identical to Black in every edge case'],
      followUps: ['How would you migrate a project from flake8 to Ruff?', 'Would you still run mypy?'],
      modelAnswer: 'Ruff bundles what used to be several tools: it implements the flake8 rules and many popular plugins, isort-style import sorting and pyupgrade, and has a formatter designed to match Black\'s style. Because it is written in Rust and parses each file once, it is fast enough to run on save and in pre-commit even in big repositories, and it is configured in one pyproject section. The classic Black, isort and flake8 stack still works well but means keeping several tools and configs compatible. pylint does deeper inference and catches some things Ruff does not, so some teams keep it, and a type checker like mypy or pyright is still needed either way.',
    },
    {
      id: 'code-quality-tools-legacy-adoption',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You join a team with a 200,000-line codebase that has never used a formatter or linter. How do you introduce them without stopping all work?',
      answer: 'Agree on tools and config in pyproject.toml; format everything in one dedicated commit and add it to .git-blame-ignore-revs; enable high-value lint rules first (pyflakes F, bugbear B) and fix or baseline existing violations with per-file ignores; add pre-commit and a required CI check so new code stays clean; then tighten rules gradually (a ratchet), fixing old code as it is touched.',
      explanation: py`Big-bang enabling of every rule produces thousands of warnings and gets ignored. Formatting is safe to do at once (no behaviour change); linting is a gradual campaign. Communicate the change so open branches can rebase (formatting them too).`,
      whyAsked: 'Tests pragmatism and change management, not just tool knowledge.',
      mistakes: ['Enabling all rules at once', 'Mixing reformatting into feature PRs', 'Adding hooks without CI enforcement'],
      followUps: ['How do you handle long-running branches during the big reformat?', 'How do you decide which rules to enable?'],
      modelAnswer: 'I would first agree on the tools — say Ruff for linting and formatting — and put the configuration in pyproject.toml. Formatting doesn\'t change behaviour, so I would reformat the whole codebase in one dedicated commit, announce it so branches can rebase, and add that commit to .git-blame-ignore-revs. For linting I would start with rules that find real bugs, like pyflakes and bugbear, and baseline existing violations with per-file ignores rather than fixing thousands at once. Then pre-commit and a required CI check keep new code clean, and we ratchet: remove ignores and enable more rules as files are touched.',
    },
    {
      id: 'code-quality-tools-ci-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Your pull request passes `ruff check` and the formatter locally, but CI fails with new lint errors and "would reformat" messages. What do you check?',
      answer: 'Version and configuration drift: CI may install a newer (unpinned) Ruff with new rules or formatting changes, or read a different config. Pin the tool versions (dev dependencies and .pre-commit-config.yaml), keep config only in pyproject.toml, and reproduce with the same command CI runs (pre-commit run --all-files or the exact CI step).',
      explanation: py`Also check whether CI runs on **all** files while your hook only checked the staged ones, and whether you committed the formatter's changes. Matching versions and commands make local and CI results identical.`,
      whyAsked: 'A frequent day-to-day annoyance; tests systematic debugging of tooling.',
      mistakes: ['Disabling the CI check', 'Adding noqa comments to make CI pass', 'Not pinning versions'],
      followUps: ['Why pin linters if they only report problems?', 'How do you upgrade them safely?'],
      modelAnswer: 'When local and CI disagree on a deterministic tool, it is almost always different versions or different configuration. I would compare the Ruff version locally with the one CI installed — if it is unpinned, CI may have picked up a release with new rules or formatting tweaks. Then I check that both read the same pyproject.toml settings and run on the same set of files, since a hook may only check staged files. The fix is to pin the version in the dev dependencies and pre-commit config, reproduce with exactly the CI command, and upgrade the tool deliberately in its own commit.',
    },
    {
      id: 'code-quality-tools-bare-except',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `find_bare_excepts(source)` returning the sorted line numbers of every bare `except:` clause (E722) in the given Python source, using the `ast` module. `except Exception:` and `except (KeyError, ValueError):` must not be reported.',
      answer: 'Walk the tree; every except clause is an ast.ExceptHandler node, and a bare one has type None. Return sorted(node.lineno for node in ast.walk(tree) if isinstance(node, ast.ExceptHandler) and node.type is None).',
      explanation: py`A bare \`except:\` catches **everything**, including \`KeyboardInterrupt\` and \`SystemExit\`, so Ctrl+C and \`sys.exit()\` can be silently swallowed. Catch the specific exceptions you expect, or at most \`Exception\`. See [try/except](lesson:try-except).`,
      starter: { files: { 'main.py': py`import ast

CODE = '''try:
    risky()
except:
    pass

try:
    parse()
except ValueError:
    pass
'''


def find_bare_excepts(source):
    """Sorted line numbers of bare 'except:' clauses."""
    return []   # TODO


print(find_bare_excepts(CODE))
` } },
      tests: [
        { name: 'finds the bare except', code: py`assert find_bare_excepts(CODE) == [3]` },
        { name: 'specific and tuple excepts are fine', code: py`src = "try:\n    x()\nexcept Exception:\n    pass\nexcept (KeyError, ValueError):\n    pass\n"
assert find_bare_excepts(src) == []` },
        { name: 'nested handlers are all found', code: py`src = "try:\n    a()\nexcept:\n    try:\n        b()\n    except:\n        pass\n"
assert find_bare_excepts(src) == [3, 6]` },
        { name: 'the word except in a string is ignored', code: py`assert find_bare_excepts('msg = "except: oops"\n') == []` },
      ],
      solution: { files: { 'main.py': py`import ast

CODE = '''try:
    risky()
except:
    pass

try:
    parse()
except ValueError:
    pass
'''


def find_bare_excepts(source):
    """Sorted line numbers of bare 'except:' clauses."""
    tree = ast.parse(source)
    return sorted(
        node.lineno
        for node in ast.walk(tree)
        if isinstance(node, ast.ExceptHandler) and node.type is None
    )


print(find_bare_excepts(CODE))
` } },
      hints: ['Print ast.dump(ast.parse(CODE), indent=2) and look for ExceptHandler.', 'A bare except has no exception type: node.type is None.'],
      whyAsked: 'Shows you can reason about code as data (useful for custom checks and codemods) and know why bare excepts are dangerous.',
      mistakes: ['Searching the text for "except:" (false positives in strings, misses formatting variants)', 'Flagging except Exception', 'Forgetting nested handlers'],
      followUps: ['Why is a bare except dangerous?', 'How would you also flag except BaseException without a re-raise?', 'How would you write a fixer instead of a checker?'],
      modelAnswer: 'I parse the source with ast.parse and walk every node. Each except clause is an ExceptHandler, and its type attribute holds the exception expression — for a bare except it is None — so I collect the line numbers of handlers whose type is None and sort them. Working on the tree means strings or comments containing the word except can\'t cause false positives, and nested handlers are found naturally. Bare excepts matter because they catch KeyboardInterrupt and SystemExit too, so a program can ignore Ctrl+C or a deliberate exit.',
    },
    {
      id: 'code-quality-tools-quality-gate',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design the code-quality setup for a team of 15 Python developers: which checks run where, how they are configured, and how you keep them fast and trusted.',
      answer: 'One configuration in pyproject.toml with pinned tool versions in the dev dependencies; editors format on save and lint live; pre-commit runs fast checks (ruff check --fix, ruff format, maybe file hygiene hooks) on staged files; CI runs ruff check, ruff format --check, the type checker and the test suite on every PR as required status checks; rules are introduced gradually with documented exceptions; tool upgrades happen in dedicated PRs.',
      explanation: py`The principles: **same rules everywhere** (shared config, pinned versions), **fast feedback locally** (editor + hooks), **enforcement centrally** (required CI checks that can't be skipped), and **low noise** (rules that earn their place, specific suppressions with reasons). Measure CI duration and keep hooks quick so nobody is tempted to bypass them.`,
      code: { lang: 'toml', code: py`[project.optional-dependencies]
dev = ["ruff==0.x.y", "mypy==1.x.y", "pytest>=8", "pre-commit>=3"]   # pin real versions

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]` },
      whyAsked: 'Senior engineers set up team workflows; this probes judgement about speed, enforcement and developer experience.',
      mistakes: ['Relying only on pre-commit hooks', 'Running slow full test suites in pre-commit', 'Unpinned tool versions', 'Enabling every rule on day one'],
      followUps: ['What would you do if CI takes 25 minutes?', 'How do you handle a rule the team dislikes?'],
      modelAnswer: 'I would put all tool configuration in pyproject.toml and pin the tool versions in the dev dependencies and the pre-commit config, so the editor, hooks and CI behave identically. Locally, editors format on save and show lint results live, and pre-commit runs only fast checks — Ruff lint with fixes and the formatter — on staged files. CI is the enforcement point: on every pull request it runs ruff check, ruff format --check, mypy or pyright and the tests, and those are required checks before merging. Rules are added gradually, exceptions are configured centrally with a comment, and tool upgrades go in their own pull requests. I would keep an eye on hook and CI duration, because slow checks are the ones people bypass.',
    },
  ],

  takeaways: [
    'A formatter (ruff format, Black) fixes layout without changing behaviour; a linter (Ruff, flake8, pylint) reports problems; a type checker (mypy, pyright) checks type hints.',
    'PEP 8 is the style baseline; an opinionated formatter enforces it automatically and ends style debates.',
    'Configure every tool once in pyproject.toml and pin tool versions so the editor, hooks and CI agree.',
    'pre-commit runs fast checks before each commit; required CI checks are the gate nobody can skip.',
    'Suppress a rule only with its specific code and a reason (# noqa: F401 …).',
    'Linters work on the abstract syntax tree — the ast module lets you write your own checks.',
    'Tools catch patterns, not logic: they complement tests, they don\'t replace them.',
  ],
}
