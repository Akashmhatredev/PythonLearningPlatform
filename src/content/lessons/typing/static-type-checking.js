// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const MINI_MYPY = py`"""mini_mypy: a SIMPLIFIED static type checker, for learning only.

Like mypy it READS source code and never runs it. Unlike mypy it knows only
four checks, only the types int/float/str/bool, only literal values, and only
functions defined in the same file. Real checkers understand the whole
language: imports, classes, generics, narrowing, inference and much more.
"""
import ast

TYPES = {"int": int, "float": float, "str": str, "bool": bool}
ACCEPTS = {float: {float, int, bool}, int: {int, bool}, str: {str}, bool: {bool}}


def literal(node: ast.expr) -> type | None:
    """The type of a literal like 3 or "tea"; None means "don't know"."""
    if isinstance(node, ast.Constant) and type(node.value) in ACCEPTS:
        return type(node.value)
    return None


def hint(node: ast.expr | None) -> type | None:
    return TYPES.get(node.id) if isinstance(node, ast.Name) else None


def check_def(func: ast.FunctionDef) -> list[tuple[int, str]]:
    params = [a for a in func.args.args if a.arg not in ("self", "cls")]
    untyped = [a for a in params if a.annotation is None]
    if func.returns is None and len(untyped) == len(params) and params:
        return [(func.lineno, "Function is missing a type annotation  [no-untyped-def]")]
    errors = []
    if func.returns is None:
        errors.append((func.lineno, "Function is missing a return type annotation  [no-untyped-def]"))
    if untyped:
        errors.append((func.lineno, "Function is missing a type annotation for one or more arguments  [no-untyped-def]"))
    expected = hint(func.returns)
    for node in ast.walk(func):
        if isinstance(node, ast.Return) and node.value is not None and expected:
            got = literal(node.value)
            if got and got not in ACCEPTS[expected]:
                errors.append((node.lineno, f'Incompatible return value type (got "{got.__name__}", expected "{expected.__name__}")  [return-value]'))
    return errors


def check_call(call: ast.Call, func: ast.FunctionDef) -> list[tuple[int, str]]:
    name, params = func.name, func.args.args
    required = len(params) - len(func.args.defaults)
    if len(call.args) > len(params):
        return [(call.lineno, f'Too many arguments for "{name}"  [call-arg]')]
    if len(call.args) < required and not call.keywords:
        missing = ", ".join(f'"{p.arg}"' for p in params[len(call.args):required])
        plural = "s" if len(params[len(call.args):required]) > 1 else ""
        return [(call.lineno, f'Missing positional argument{plural} {missing} in call to "{name}"  [call-arg]')]
    errors = []
    for position, (arg, param) in enumerate(zip(call.args, params), start=1):
        got, expected = literal(arg), hint(param.annotation)
        if got and expected and got not in ACCEPTS[expected]:
            errors.append((call.lineno, f'Argument {position} to "{name}" has incompatible type "{got.__name__}"; expected "{expected.__name__}"  [arg-type]'))
    return errors


def check(path: str) -> int:
    with open(path, encoding="utf-8") as source:
        tree = ast.parse(source.read(), path)     # parse only: nothing is executed
    functions = {n.name: n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}
    errors = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            errors += check_def(node)
        elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in functions:
            errors += check_call(node, functions[node.func.id])
    for line, message in sorted(errors):
        print(f"{path}:{line}: error: {message}")
    if errors:
        print(f"Found {len(errors)} error{'s' if len(errors) > 1 else ''} in 1 file (checked 1 source file)")
    else:
        print("Success: no issues found in 1 source file")
    return len(errors)


check("shop.py")
`

const SHOP = py`"""A small shop module. The checker reads this file; it never runs it."""


def price_with_tax(price: float, rate: float = 0.2) -> float:
    return round(price * (1 + rate), 2)


def describe(name: str, quantity: int) -> str:
    return f"{quantity} x {name}"


def loyalty_points(total):
    return int(total // 10)


def basket_total(prices: list[float]) -> float:
    return sum(price_with_tax(p) for p in prices)


print(describe("tea", "2"))
print(price_with_tax(4.5, 0.2, 0.1))
print(basket_total([4.5, 2]))
`

const TC_MAIN = py`import annotationlib
import typing

import orders

order = orders.Order("A-17", 50.0)
print(order.invoice())
print("TYPE_CHECKING at runtime:", typing.TYPE_CHECKING)

# The hint names Invoice, which orders.py only imports for type checkers.
print("hint as text:", annotationlib.get_annotations(orders.Order.invoice, format=annotationlib.Format.STRING))
try:
    typing.get_type_hints(orders.Order.invoice)
except NameError as err:
    print("get_type_hints:", err)
`

const TC_ORDERS = py`from typing import TYPE_CHECKING

if TYPE_CHECKING:                    # False at runtime: this import never runs
    from billing import Invoice


class Order:
    def __init__(self, order_id: str, total: float) -> None:
        self.order_id = order_id
        self.total = total

    def invoice(self) -> Invoice:    # fine in 3.14: annotations are evaluated lazily
        from billing import Invoice  # the real import happens when the method runs
        return Invoice(self)
`

const TC_BILLING = py`from orders import Order             # billing needs Order at runtime


class Invoice:
    def __init__(self, order: Order) -> None:
        self.order = order
        self.amount = round(order.total * 1.2, 2)

    def __repr__(self) -> str:
        return f"Invoice({self.order.order_id}, {self.amount})"
`

export default {
  id: 'static-type-checking',
  title: 'Static type checking with mypy & pyright',
  summary: 'Run mypy or pyright to find type errors before the code runs: install and configure them, adopt them gradually, read their errors, narrow unions, use escape hatches sparingly and enforce it all in CI.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['type-hints', 'typing-collections-and-unions'],
  related: ['generics', 'protocols', 'code-quality-tools', 'packaging', 'virtual-environments', 'pip-and-dependencies', 'modules-and-imports', 'match-statement', 'none-and-truthiness', 'testing-fundamentals'],
  tags: ['mypy', 'pyright', 'static analysis', 'type checker', 'strict', 'gradual typing', 'narrowing', 'TypeGuard', 'TypeIs', 'cast', 'type: ignore', 'TYPE_CHECKING', 'stubs', '.pyi', 'py.typed', 'typeshed', 'reveal_type', 'assert_never', 'pyproject.toml', 'CI', 'pre-commit'],
  apis: [
    { name: 'mypy [--strict] PATH', summary: 'Runs the mypy type checker on files or packages; --strict turns on a bundle of extra checks.' },
    { name: 'pyright', summary: 'Runs the pyright type checker (Node.js-based; also powers Pylance in VS Code).' },
    { name: '[tool.mypy] / [tool.pyright]', summary: 'Checker configuration sections in pyproject.toml.' },
    { name: 'typing.TYPE_CHECKING', summary: 'False at runtime, treated as True by type checkers: guards imports needed only for hints.' },
    { name: 'typing.cast(T, value)', summary: 'Tells the checker to treat value as T. Does nothing at runtime — no conversion, no check.' },
    { name: '# type: ignore[code]', summary: 'Silences one specific error code on one line. Bare ignores silence everything on the line.' },
    { name: 'typing.TypeGuard[T]', summary: '3.10+: return type of a user-defined check that narrows its argument to T when it returns True.' },
    { name: 'typing.TypeIs[T]', summary: '3.13+: like TypeGuard but narrows in both branches; T must be consistent with the input type.' },
    { name: 'typing.reveal_type(x) / assert_type / assert_never', summary: '3.11+: ask the checker for an inferred type, assert one, or mark unreachable code.' },
    { name: 'py.typed', summary: 'Empty marker file (PEP 561) telling checkers that a package ships inline type hints.' },
  ],
  docs: [
    { label: 'mypy documentation', url: 'https://mypy.readthedocs.io/en/stable/' },
    { label: 'mypy — the mypy configuration file', url: 'https://mypy.readthedocs.io/en/stable/config_file.html' },
    { label: 'mypy — error codes', url: 'https://mypy.readthedocs.io/en/stable/error_code_list.html' },
    { label: 'mypy — type narrowing', url: 'https://mypy.readthedocs.io/en/stable/type_narrowing.html' },
    { label: 'Pyright documentation', url: 'https://microsoft.github.io/pyright/' },
    { label: 'typing — TYPE_CHECKING, cast, TypeIs', url: 'https://docs.python.org/3/library/typing.html#typing.TYPE_CHECKING' },
    { label: 'PEP 561 — Distributing and packaging type information', url: 'https://peps.python.org/pep-0561/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **static type checker** is a program that reads your code — *without running it* — and works out the type of every expression. Wherever the [type hints](lesson:type-hints) say one thing and the code does another, it reports an error. "Static" means "before running"; the opposite, finding problems while the program runs, is *dynamic*.`,
    py`The two you'll meet most are **mypy** (the original, written in Python, from the core typing community) and **pyright** (from Microsoft, very fast, and the engine inside VS Code's Pylance). Both understand the same type system; they differ in defaults, speed and some inference details.`,
    { code: py`$ mypy shop.py
shop.py:20: error: Argument 2 to "describe" has incompatible type "str"; expected "int"  [arg-type]
shop.py:21: error: Too many arguments for "price_with_tax"  [call-arg]
Found 2 errors in 1 file (checked 1 source file)`, lang: 'text', title: 'what a type checker gives you' },
    py`Those errors were found without executing a single line. In this lesson you'll install and configure the checkers, adopt them gradually in existing code, read their messages, teach them about your own checks (*narrowing*), use the escape hatches responsibly, and make the whole thing automatic in CI.`,
  ],
  why: [
    py`Python only discovers a wrong type when the line runs — maybe in production, on the one input you didn't test. A checker examines **every** path through the code, including the error-handling branch nobody has run in months.`,
    py`Hints that nobody checks slowly become lies. Running a checker on every commit keeps them true, which keeps editor autocomplete, refactoring tools and your own reading of the code trustworthy.`,
    py`On a team, the checker is a reviewer that never gets tired: renaming a field, changing a return type to \`X | None\`, or removing a parameter instantly lists every call site that needs updating. That makes large refactors safe in a dynamic language.`,
  ],
  eli15: [
    py`Imagine a spell-checker, but for meaning instead of spelling. You write "pour the cake into the oven at 3 eggs" — every word is spelled right, but a careful reader says "3 eggs isn't a temperature!".`,
    py`A type checker is that careful reader for code. It reads the whole recipe *before* you start cooking and points at lines like \`describe("tea", "2")\`: "you promised a number of items, and this is text". Python itself is the cook who only notices when the cake is already burning.`,
  ],
  analogy: {
    title: 'An architect\'s plan review',
    body: [
      py`Before a house is built, an inspector reviews the **plans**. They don't need bricks or a building site: they check that doors are wide enough, beams are strong enough and the stairs actually reach the next floor. Fixing a line on paper is far cheaper than knocking down a wall.`,
      py`A type checker reviews your program's plans. Type hints are the measurements written on the drawings. Parts with no measurements (unannotated code) can't be checked — that's *gradual typing*. A \`# type: ignore\` is a sticky note saying "inspector, skip this bit, I promise it's fine". And CI is the rule that no building starts until the plans pass review.`,
    ],
    mapping: [
      ['reviewing the plans before building', 'checking code without running it'],
      ['measurements on the drawings', 'type hints'],
      ['rooms drawn without measurements', 'unannotated code — checked loosely or not at all'],
      ['"this beam is too short for that span"', 'Argument 1 has incompatible type ...'],
      ['a sticky note: "skip this, trust me"', '# type: ignore[code] and cast()'],
      ['no construction until the review passes', 'the type checker runs in CI on every pull request'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Narrowing: what the checker sees at each line',
    props: {
      code: py`def greet(name: str | None) -> str:
    if name is None:
        return "Hello, guest"
    return "Hello, " + name.title()


def double(value: int | str) -> int:
    if isinstance(value, str):
        value = int(value)
    return value * 2


print(greet(None), "|", greet("ada"))
print(double("21"), double(4))
`,
      notes: {
        1: 'Checker\'s view: `name` is `str | None`. Calling `name.title()` right here would be an error.',
        2: 'A **narrowing** check. Inside the `if`, the checker knows `name` is `None`.',
        4: 'After the early return only `str` is left, so `.title()` is accepted. Delete lines 2–3 and mypy reports `Item "None" of "str | None" has no attribute "title"  [union-attr]`.',
        8: '`isinstance` narrows too: inside this branch `value` is a `str`.',
        9: 'Re-binding it to an `int` means both paths reach line 10 with an `int`, so `value * 2` is typed `int`.',
        13: 'At runtime none of this is visible — they are ordinary `if` statements. The checker *reads* them to track types per branch.',
      },
    },
    alt: 'A step-by-step trace of two functions. greet(name: str | None) returns early for None and otherwise calls name.title(). double(value: int | str) converts a str to int inside an isinstance branch, then doubles it. The program prints Hello, guest | Hello, Ada and then 42 8. Notes explain how a type checker narrows str | None to str after the None check, and int | str to int after the isinstance branch.',
    caption: py`Step through with ▶. The program runs the same with or without a checker — the notes show what the checker *infers* at each line.`,
  },
  syntax: [
    py`#### Install and run`,
    { code: py`# inside your project's virtual environment
python -m pip install mypy
mypy shop.py                 # one file
mypy src/                    # a whole package
mypy --strict src/           # all the optional strictness flags

python -m pip install pyright    # PyPI wrapper; pyright itself runs on Node.js
pyright                          # checks the project using [tool.pyright]`, lang: 'bash', title: 'terminal' },
    py`Install the checker **in the same virtual environment** as your project (see [virtual environments](lesson:virtual-environments)), so it can find your dependencies and their types. If \`mypy\` says it can't find a module you know is installed, it's usually running from a different environment — \`python -m mypy\` uses the current one.`,
    { code: py`shop.py:12: error: Function is missing a type annotation  [no-untyped-def]
shop.py:20: error: Argument 2 to "describe" has incompatible type "str"; expected "int"  [arg-type]
shop.py:21: error: Too many arguments for "price_with_tax"  [call-arg]
Found 3 errors in 1 file (checked 1 source file)`, lang: 'text', title: 'mypy --strict shop.py' },
    { code: py`/home/ada/shop/shop.py
  /home/ada/shop/shop.py:20:23 - error: Argument of type "Literal['2']" cannot be assigned to parameter "quantity" of type "int" in function "describe"
    "Literal['2']" is not assignable to "int" (reportArgumentType)`, lang: 'text', title: 'pyright on the line-20 bug (excerpt; wording varies a little between versions)' },
    py`Read a mypy line left to right: **file:line**, severity, the **message**, and the **error code** in brackets. The code is what you search the docs for and what you put in a targeted \`# type: ignore[...]\`. Pyright adds the column and names its rule (\`reportArgumentType\`). It flags the extra argument on line 21 too, but in its default mode it doesn't complain about the unannotated function on line 12: requiring annotations is a strictness rule (mypy's \`--strict\`, pyright's \`strict\` mode).`,
    py`#### Configure once, in pyproject.toml`,
    { code: py`[tool.mypy]
python_version = "3.12"          # check as if running on the oldest version you support
files = ["src"]
strict = true                     # recommended for new code
warn_unreachable = true

[[tool.mypy.overrides]]           # gradual adoption: relax the old parts
module = ["legacy.*"]
ignore_errors = true

[[tool.mypy.overrides]]           # a dependency with no type information
module = ["vendor_sdk.*"]
ignore_missing_imports = true

[tool.pyright]
pythonVersion = "3.12"
include = ["src"]
typeCheckingMode = "strict"       # off | basic | standard (default) | strict`, lang: 'toml', title: 'pyproject.toml' },
    py`\`--strict\` is a bundle of flags — among them \`--disallow-untyped-defs\` (every function must be annotated), \`--disallow-any-generics\` (no bare \`list\`), \`--warn-return-any\`, \`--warn-unused-ignores\` and \`--strict-equality\`. The exact list grows between mypy releases, which is one reason to **pin your checker version** (see [pip & dependencies](lesson:pip-and-dependencies)).`,
    py`#### Gradual typing: typed and untyped code side by side`,
    py`You don't have to annotate everything at once. Unannotated values are treated as \`Any\` — compatible with everything — so typed and untyped code can call each other. But know the defaults:`,
    py`- **mypy** does not check the *body* of a function with no annotations at all (it prints a hint about \`--check-untyped-defs\` if it notices annotations inside one). Add one annotation, even \`-> None\`, and the body is checked.
- **pyright** infers return types and checks the bodies of unannotated functions too, which is why it often reports more in legacy code.
- A practical adoption path: run the checker on everything with lenient settings, fix the real bugs it finds, then turn on \`strict\` module by module with overrides, starting with the code that changes most.`,
    py`#### Debugging the checker's view: \`reveal_type\``,
    { code: py`from typing import reveal_type

prices = {"tea": 2.5, "milk": 1}
reveal_type(prices)           # mypy: note: Revealed type is "builtins.dict[builtins.str, builtins.float]"
reveal_type(prices.get("jam"))   # ... "builtins.float | None"  (that's why .get() needs a None check)`, lang: 'python', title: 'ask the checker what it inferred' },
    py`At runtime \`typing.reveal_type\` (3.11+) prints \`Runtime type is '...'\` to stderr and returns its argument, so a forgotten call won't crash anything. Checkers understand \`reveal_type\` even without the import.`,
    py`#### Narrowing: teaching the checker what your \`if\` already knows`,
    { code: py`from typing import Literal, assert_never


def label(user: dict[str, str] | None) -> str:
    if user is None:                       # is None / is not None
        return "guest"
    return user["name"]                    # here: dict[str, str]


def area(shape: int | tuple[int, int]) -> int:
    if isinstance(shape, int):             # isinstance
        return shape * shape
    width, height = shape                  # here: tuple[int, int]
    return width * height


def ship(status: Literal["paid", "pending", "refunded"]) -> str:
    match status:                          # match / == on Literal values
        case "paid":
            return "dispatch"
        case "pending":
            return "wait"
        case "refunded":
            return "cancel"
        case _:
            assert_never(status)           # checker error if a case is missing`, lang: 'python', title: 'the built-in narrowing patterns' },
    py`Checkers follow \`is None\`, \`==\`, \`isinstance\`, \`callable()\`, \`in\` (for \`Literal\` and \`TypedDict\` keys), truthiness, \`match\`, early \`return\`/\`raise\`/\`continue\`, and \`assert\`. \`assert_never\` (3.11+) makes a missing case a *checker* error, and raises \`AssertionError\` if it's ever reached at runtime.`,
    py`When the check lives in **your own function**, the checker can't see inside it. Return a \`TypeGuard\` or \`TypeIs\` to tell it what a \`True\` result means:`,
    { code: py`from typing import TypeGuard, TypeIs


def is_str_list(values: list[object]) -> TypeGuard[list[str]]:   # 3.10+
    return all(isinstance(v, str) for v in values)


def is_number(value: object) -> TypeIs[int | float]:             # 3.13+
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def show(raw: list[object], extra: str | int) -> None:
    if is_str_list(raw):
        print(", ".join(raw))       # raw: list[str]
    if is_number(extra):
        print(extra + 1)            # extra: int
    else:
        print(extra.upper())        # extra: str — TypeIs narrows the else branch too`, lang: 'python', title: 'user-defined narrowing' },
    py`| | \`TypeGuard[T]\` (3.10) | \`TypeIs[T]\` (3.13) |
|---|---|---|
| \`if\` branch | narrowed to exactly \`T\` | narrowed to input ∩ \`T\` (keeps precision) |
| \`else\` branch | unchanged | narrowed to input minus \`T\` |
| rule on \`T\` | anything (e.g. \`list[object]\` → \`list[str]\`) | must be consistent with the input type |
| use it for | converting containers, like \`is_str_list\` | ordinary "is it this type?" checks — prefer it |`,
    py`At runtime both are just functions returning \`bool\`. If they lie (return \`True\` for the wrong type), the checker believes them — so test them.`,
    py`#### Escape hatches: \`cast\`, \`# type: ignore[code]\`, \`Any\``,
    { code: py`import json
from typing import Any, cast

settings = cast(dict[str, Any], json.loads('{"debug": true}'))   # "trust me": no runtime effect
port = int(settings.get("port", 8080))                          # real conversion is still yours to do

result = legacy_api(port)        # type: ignore[no-untyped-call]   # one code, one line
`, lang: 'python', title: 'use sparingly, and always narrowly', static: true },
    py`- \`cast(T, x)\` returns \`x\` unchanged — it converts nothing and checks nothing. Prefer real narrowing (\`isinstance\`) or real conversion (\`int(...)\`).
- \`# type: ignore[code]\` silences only that error code on that line. A bare \`# type: ignore\` hides *every* error on the line, including future ones. Turn on \`warn_unused_ignores\` (part of \`--strict\`) so stale ignores get reported. Pyright's equivalent is \`# pyright: ignore[reportArgumentType]\`.
- \`Any\` switches checking off and spreads to everything it touches. Keep it at the edges (raw JSON) and convert to precise types quickly.`,
    py`#### \`TYPE_CHECKING\`: imports only the checker needs`,
    { code: py`from typing import TYPE_CHECKING

if TYPE_CHECKING:                       # False at runtime, True for checkers
    from billing import Invoice         # avoids a circular or slow import


def total(invoice: Invoice) -> float:   # 3.14: annotations are lazy, no quotes needed
    return invoice.amount`, lang: 'python', title: 'typing-only imports' },
    py`Use it to break import cycles that exist only because of hints, or to avoid importing a heavy module just to annotate a parameter. On Python 3.13 and earlier, write such hints as strings (\`"Invoice"\`) or add \`from __future__ import annotations\`. And never use the name at runtime (\`isinstance(x, Invoice)\`) — it doesn't exist there.`,
    py`#### Where types for libraries come from: typeshed, stubs and \`py.typed\``,
    py`- The **standard library** is described by **typeshed**, a community project of stub files that ships inside every checker.
- A **stub file** (\`.pyi\`) contains only signatures, no bodies: \`def describe(name: str, quantity: int) -> str: ...\`. It's how you add types to code you can't or won't annotate (C extensions, generated code, old libraries).
- Third-party packages either ship **inline hints plus an empty \`py.typed\` marker file** (PEP 561), or have separate stub packages such as \`types-requests\` (from typeshed) or \`*-stubs\`. Without either, mypy reports \`import-untyped\` and treats the module as \`Any\`.
- Publishing a library? Put a \`py.typed\` file next to your package's \`__init__.py\` and make sure your build includes it (see [packaging](lesson:packaging)).`,
    py`#### In CI and pre-commit`,
    { code: py`# .github/workflows/checks.yml (excerpt)
- name: Type check
  run: |
    python -m pip install -r requirements-dev.txt   # pins mypy and stub packages
    mypy`, lang: 'yaml', title: 'CI step' },
    { code: py`# .pre-commit-config.yaml (excerpt)
- repo: https://github.com/pre-commit/mirrors-mypy
  rev: v1.11.2                       # pin a release, like any dependency
  hooks:
    - id: mypy
      additional_dependencies: ["types-requests"]   # the hook runs in its own env`, lang: 'yaml', title: 'pre-commit hook' },
    py`CI is the source of truth: the editor shows errors as you type, pre-commit catches them before you commit, and the CI job blocks a merge that would add new ones. See [formatters, linters & pre-commit](lesson:code-quality-tools). (The \`rev\` above is just an example — use the release you have pinned.)`,
    { callout: 'version', title: 'Which Python versions?', text: py`\`TypeGuard\` is **3.10+**; \`reveal_type\`, \`assert_type\`, \`assert_never\` and \`Never\` joined \`typing\` in **3.11**; \`TypeIs\` is **3.13+**. Checkers accept them from \`typing_extensions\` on older interpreters. Lazy annotations (no quotes needed for \`TYPE_CHECKING\` imports) are **3.14+**. Checkers are separate tools with their own release cycles: their behaviour depends on *their* version and the \`python_version\` you configure, not only on the interpreter.` },
  ],
  walkthrough: {
    title: 'How a (tiny) static checker works',
    lang: 'python',
    code: MINI_MYPY,
    intro: py`This is the \`main.py\` of the playground below — a deliberately tiny checker so you can see the idea. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 7], text: py`An honest label: this is a **simplified** teaching tool. mypy and pyright implement the full type system; this toy knows four checks.` },
      { lines: [8], text: py`\`ast\` turns source text into a tree of nodes (function definitions, calls, literals). Real checkers start the same way: **parse**, never execute.` },
      { lines: [14, 18], text: py`\`literal()\` knows the type of literals like \`3\` or \`"tea"\`. For anything else it returns \`None\` — "don't know" — and stays quiet. That's a crude version of how unannotated code becomes \`Any\` in gradual typing.` },
      { lines: [25, 34], text: py`Missing-annotation checks, with mypy's exact \`--strict\` messages. A function with no annotations at all gets one combined error.` },
      { lines: [35, 40], text: py`\`return-value\`: compare each literal \`return\` against the declared return type.` },
      { lines: [44, 52], text: py`\`call-arg\`: count positional arguments against the parameters (defaults make some optional).` },
      { lines: [53, 58], text: py`\`arg-type\`: compare each literal argument with the parameter's hint. \`ACCEPTS\` encodes the rule that an \`int\` is accepted where a \`float\` is expected.` },
      { lines: [61, 63], text: py`The file is opened and **parsed** — \`shop.py\` is never imported, so none of its code runs, not even its \`print\` calls.` },
      { lines: [71, 77], text: py`Errors are printed in mypy's format (\`file:line: error: message  [code]\`), followed by the same summary line mypy prints.` },
    ],
  },
  playground: {
    title: 'Fix the errors a checker reports',
    objective: 'Read the error messages, fix shop.py until the (simplified) checker reports success — then add a bug of your own and watch it get caught.',
    files: { 'main.py': MINI_MYPY, 'shop.py': SHOP },
    expected: py`The checker reads \`shop.py\` and prints:

\`\`\`text
shop.py:12: error: Function is missing a type annotation  [no-untyped-def]
shop.py:20: error: Argument 2 to "describe" has incompatible type "str"; expected "int"  [arg-type]
shop.py:21: error: Too many arguments for "price_with_tax"  [call-arg]
Found 3 errors in 1 file (checked 1 source file)
\`\`\`

These are the same messages, in the same format, that real \`mypy --strict\` prints for this file. Notice that none of \`shop.py\`'s \`print\` calls ran. The **TYPE_CHECKING imports** variant shows a runtime-side topic: imports that exist only for the checker.`,
    experiments: [
      {
        id: 'fix-arg-type',
        task: py`Open \`shop.py\` and fix the \`[arg-type]\` error on line 20: \`describe\` wants a **number** of items. Re-run the checker.`,
        hint: py`The second argument should be the int \`2\`, not the string \`"2"\`.`,
        tests: [
          { name: 'no more arg-type errors', code: py`assert '[arg-type]' not in output, 'Pass an int as the quantity'` },
          { name: 'the describe call is still there', code: py`assert files['shop.py'].count('describe(') >= 2, 'Fix the call instead of deleting it'` },
        ],
        explain: py`The message told you everything: *which* argument (2), of *which* function (\`describe\`), what it got (\`str\`) and what it expected (\`int\`). At runtime this bug was silent — the f-string happily printed \`2 x tea\` — which is exactly why it's dangerous: a later \`quantity * price\` would print \`"22"\` or crash far from the cause.`,
      },
      {
        id: 'fix-call-arg',
        task: py`Fix the \`[call-arg]\` error on line 21: \`price_with_tax\` takes at most two arguments. Keep a 10% rate.`,
        hint: py`\`price_with_tax(4.5, 0.1)\` — the price and the rate.`,
        tests: [
          { name: 'no more call-arg errors', code: py`assert '[call-arg]' not in output, 'Call price_with_tax with at most two arguments'` },
          { name: 'price_with_tax is still called', code: py`assert files['shop.py'].count('price_with_tax(') >= 3, 'Fix the call instead of deleting it'` },
        ],
        explain: py`This one would have crashed at runtime with \`TypeError: price_with_tax() takes from 1 to 2 positional arguments but 3 were given\` — but only when that line ran. The checker found it by comparing the call with the \`def\`, without running anything.`,
      },
      {
        id: 'annotate',
        task: py`Fix the \`[no-untyped-def]\` error: annotate \`loyalty_points\` so it takes a **float** \`total\` and returns an **int**. If you fixed the other two errors as well, the checker should now print \`Success: no issues found in 1 source file\`.`,
        hint: py`\`def loyalty_points(total: float) -> int:\``,
        tests: [
          { name: 'no more no-untyped-def errors', code: py`assert '[no-untyped-def]' not in output, 'Annotate the parameter and the return type'` },
          { name: 'loyalty_points still exists', code: py`assert 'def loyalty_points(' in files['shop.py']` },
        ],
        explain: py`Under \`--strict\` (\`disallow_untyped_defs\`), every function needs annotations. That's not bureaucracy: by default mypy doesn't check the *body* of a completely unannotated function, so bugs inside it would stay invisible. One annotation switches checking on.`,
      },
      {
        id: 'return-value',
        task: py`Now be the bug. Add this function to \`shop.py\` and run the checker:

\`\`\`python
def stock_level(item: str) -> int:
    return "unknown"
\`\`\``,
        hint: py`Paste it anywhere at the top level of \`shop.py\`, e.g. after \`basket_total\`.`,
        tests: [{ name: 'the checker reports a return-value error', code: py`assert '[return-value]' in output and 'expected "int"' in output, 'Add a function annotated -> int that returns a str'` }],
        explain: py`\`Incompatible return value type (got "str", expected "int")\` — real mypy prints exactly this. The usual fix is to make the type honest: return \`0\`, raise an exception, or change the annotation to \`int | None\` and handle \`None\` at every call site (the checker will list them for you).`,
      },
    ],
    variants: [
      { id: 'type-checking-imports', label: 'TYPE_CHECKING imports (runtime view)', files: { 'main.py': TC_MAIN, 'orders.py': TC_ORDERS, 'billing.py': TC_BILLING } },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Where does the checker get types for an import?',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'imp', label: 'import requests', note: 'in your code', x: 110, y: 165, tone: 'yellow' },
        { id: 'local', label: 'your stubs', note: 'mypy_path / stubPath', x: 360, y: 40, tone: 'paper' },
        { id: 'stubs', label: 'stub package', note: 'types-requests', x: 360, y: 125, tone: 'paper' },
        { id: 'inline', label: 'package + py.typed', note: 'inline hints', x: 360, y: 210, tone: 'paper' },
        { id: 'typeshed', label: 'bundled typeshed', note: 'standard library', x: 360, y: 295, tone: 'paper' },
        { id: 'found', label: 'precise types', note: 'calls are checked', x: 640, y: 110, tone: 'blue' },
        { id: 'missing', label: 'nothing found', note: 'import-untyped → Any', x: 640, y: 250, tone: 'red' },
      ],
      edges: [
        { from: 'imp', to: 'local', label: '1' },
        { from: 'imp', to: 'stubs', label: '2' },
        { from: 'imp', to: 'inline', label: '3' },
        { from: 'imp', to: 'typeshed', label: '4' },
        { from: 'stubs', to: 'found' },
        { from: 'inline', to: 'found' },
        { from: 'inline', to: 'missing', dashed: true },
      ],
      steps: [
        { focus: ['imp'], text: py`Your code imports a library. The checker never runs it — it needs a *description* of the library's types.` },
        { focus: ['local'], edges: ['imp->local'], text: py`**1. Your own stubs.** \`.pyi\` files on the configured stub path (\`mypy_path\`, pyright's \`stubPath\`) win. Use this to patch types for a library you depend on.` },
        { focus: ['stubs', 'found'], edges: ['imp->stubs', 'stubs->found'], text: py`**2. Stub-only packages.** \`pip install types-requests\` installs \`requests-stubs\`: signatures only, maintained in typeshed. mypy even suggests the right package in its error hint.` },
        { focus: ['inline', 'found'], edges: ['imp->inline', 'inline->found'], text: py`**3. Inline types.** If the installed package contains an empty \`py.typed\` marker (PEP 561), its own annotations are used. Most modern libraries ship this way.` },
        { focus: ['typeshed'], edges: ['imp->typeshed'], text: py`**4. typeshed**, bundled inside the checker, describes the standard library (\`json\`, \`pathlib\`, \`re\`…). That's why \`json.loads\` is known to return \`Any\`.` },
        { focus: ['missing'], edges: ['inline->missing'], text: py`Nothing found? mypy reports \`Skipping analyzing "vendor_sdk": module is installed, but missing library stubs or py.typed marker  [import-untyped]\` and treats it as \`Any\`. Pyright instead tries to infer types from the library's source code by default.` },
      ],
    },
    alt: 'Diagram: an import statement on the left with four numbered arrows to sources of type information in order: your own stubs on the stub path, stub-only packages like types-requests, installed packages with a py.typed marker, and the typeshed copy bundled with the checker for the standard library. Found types lead to precise checking; if nothing is found the import is reported as import-untyped and treated as Any.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A type checker works in three broad stages: **parse** every file into a tree (like the playground's \`ast\`), **collect** what every name means (functions, classes, imports — reading library types from stubs), then **walk** each function, working out the type of every expression and comparing it with what's expected.`,
      py`Most types are **inferred** — you rarely annotate local variables. \`total = 0\` is an \`int\`; \`names = ["ada"]\` is a \`list[str]\`. Your annotations on function parameters and returns are the anchors: inside a function the checker trusts the parameter hints, and at every call site it checks the arguments against them. That's why annotating function signatures gives you most of the value.`,
    ],
    technical: [
      py`#### Any is the bridge of gradual typing`,
      py`\`Any\` is compatible in **both directions**: an \`Any\` can be passed where an \`int\` is expected, and an \`int\` can be passed where \`Any\` is expected. That's what lets typed and untyped code coexist — and why \`Any\` silently spreads: \`data: Any\`, then \`data["x"].total\` is \`Any\` too. \`object\` is the opposite: it accepts everything but lets you do almost nothing until you narrow it.`,
      py`#### Declared types, inferred types and narrowing`,
      py`Each variable has a **declared** type (from an annotation, or inferred from its first assignment) and, at each point in the code, a **narrowed** type computed by control-flow analysis. \`name: str | None\` stays declared as \`str | None\`; after \`if name is None: return\`, the narrowed type is \`str\`. Assigning a new value narrows again, as long as it fits the declared type — assign a \`str\` to a variable declared \`int\` and you get \`Incompatible types in assignment (expression has type "str", variable has type "int")  [assignment]\`.`,
      py`#### mypy and pyright infer differently`,
      { code: py`mixed = [1, "a"]
reveal_type(mixed)
# mypy:    Revealed type is "builtins.list[builtins.object]"     (a "join": the common base class)
# pyright: Type of "mixed" is "list[int | str]"                  (a union)`, lang: 'python', title: 'join vs union', static: true },
      py`Both are valid choices, but code that passes one checker can fail the other. Pick **one** as the source of truth for CI; editor warnings from the other (e.g. Pylance in VS Code) are useful but secondary.`,
      py`#### Speed and caching`,
      py`mypy stores results in \`.mypy_cache\` and re-checks only modules whose dependencies changed (add it to \`.gitignore\`). \`dmypy\` keeps a server running for near-instant re-checks; pyright is designed for incremental checking inside editors. Neither imports or executes your code — so a module with side effects at import time is safe to check.`,
      py`#### Plugins`,
      py`Some libraries do things the type system can't express (dynamic model classes, ORMs). mypy supports **plugins** that teach it those rules — pydantic ships one, and the django-stubs project provides one for Django. Pyright has no plugin system; it relies on standard typing features such as \`@dataclass_transform\` (PEP 681), which many libraries now use instead.`,
      { callout: 'note', title: 'Checkers vs interpreters', text: py`Type checkers aren't part of CPython, and their verdicts are not language guarantees. The typing rules they follow are written down in the typing specification maintained by the Python typing council, but each checker has its own release cycle, defaults and inference details. Newer checkers (for example Astral's ty and Meta's Pyrefly) are appearing too — evaluate them against your code before switching.` },
    ],
    production: [
      py`**Pin the checker version** and its stub packages in your dev requirements. A new mypy or pyright release can report new errors in unchanged code; upgrade on purpose, in its own pull request.`,
      py`**One source of truth.** Run the same checker, same version, same config in CI, pre-commit and (ideally) your editor. Remember the pre-commit mypy hook runs in its own isolated environment: list stub packages and typed dependencies in \`additional_dependencies\` or you'll see \`import-untyped\` errors that don't happen locally.`,
      py`**Ratchet, don't boil the ocean.** For an existing codebase: get a clean run with lenient settings (and overrides for the worst modules), make CI fail on *new* errors, then tighten module by module toward \`strict = true\`. New modules start strict.`,
      py`**Treat ignores as debt.** Require error codes (mypy's \`enable_error_code = ["ignore-without-code"]\`), keep \`warn_unused_ignores\` on, and review every new \`cast\` / \`# type: ignore\` in code review like you would a disabled test.`,
      py`**The checker doesn't validate data.** It proves your code is consistent *given* the types at the boundaries. JSON from an API, form input and environment variables are still unchecked at runtime — validate them where they enter (by hand, or with a library such as pydantic), then pass precise types inward. See [input validation](lesson:input-validation).`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting mypy to check unannotated functions',
      wrong: { code: py`def label_price(pence):
    return "£" + pence / 100       # bug: str + float


# default mypy: no error — the body of an unannotated function isn't checked`, lang: 'python' },
      right: { code: py`def label_price(pence: int) -> str:
    return "£" + pence / 100


# error: Unsupported operand types for + ("str" and "float")  [operator]
# (fix: return f"£{pence / 100:.2f}")`, lang: 'python' },
      explanation: py`mypy treats a function with no annotations as "untyped" and skips its body by default. Annotate it (even partially), enable \`check_untyped_defs\`, or use \`strict = true\` (which also forbids unannotated functions). Pyright checks such bodies by default.`,
    },
    {
      title: 'A bare # type: ignore',
      wrong: { code: py`result = legacy_parse(raw, strict=True)  # type: ignore`, lang: 'python', static: true },
      right: { code: py`result = legacy_parse(raw, strict=True)  # type: ignore[no-untyped-call]  # legacy module has no hints yet`, lang: 'python', static: true },
      explanation: py`A bare ignore silences *every* error on the line — including a typo you introduce next month. Name the code, explain why, and let \`warn_unused_ignores\` tell you when it's no longer needed.`,
    },
    {
      title: 'Using cast() as a conversion',
      wrong: { code: py`from typing import cast

quantity = cast(int, "3")      # the checker now believes it's an int...
print(quantity * 2)            # ...but at runtime it prints 33`, lang: 'python' },
      right: { code: py`quantity = int("3")            # a real conversion (raises ValueError on bad input)
print(quantity * 2)            # 6`, lang: 'python' },
      explanation: py`\`cast\` only changes what the checker *believes*; it returns the same object untouched. Lying to the checker moves the bug from "caught before running" to "wrong answer in production". Convert or narrow for real.`,
    },
    {
      title: 'Narrowing with assert in production code paths',
      wrong: { code: py`def send_receipt(email: str | None) -> None:
    assert email is not None       # removed when Python runs with -O
    print("sending to", email.lower())`, lang: 'python' },
      right: { code: py`def send_receipt(email: str | None) -> None:
    if email is None:
        raise ValueError("customer has no email address")
    print("sending to", email.lower())`, lang: 'python' },
      explanation: py`Checkers narrow after \`assert\`, but \`python -O\` strips assert statements, so the runtime guarantee disappears. Use \`assert\` for "this can't happen" invariants; use \`if\` + \`raise\` for conditions that real data can trigger.`,
    },
    {
      title: 'Using a TYPE_CHECKING-only import at runtime',
      wrong: { code: py`from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from billing import Invoice


def is_invoice(obj: object) -> bool:
    return isinstance(obj, Invoice)     # NameError at runtime`, lang: 'python' },
      right: { code: py`def is_invoice(obj: object) -> bool:
    from billing import Invoice         # a real import, deferred to call time
    return isinstance(obj, Invoice)`, lang: 'python' },
      explanation: py`Code under \`if TYPE_CHECKING:\` never runs, so the name only exists for checkers. Annotations are fine (lazy in 3.14, or quoted on older versions); \`isinstance\`, default values and \`typing.get_type_hints()\` are not.`,
    },
    {
      title: 'Silencing missing imports globally',
      wrong: { code: py`[tool.mypy]
ignore_missing_imports = true     # hides typos in import names, and every untyped dependency`, lang: 'toml' },
      right: { code: py`[[tool.mypy.overrides]]
module = ["vendor_sdk.*"]          # only the one library that really ships no types
ignore_missing_imports = true`, lang: 'toml' },
      explanation: py`A global switch turns *every* unresolved import into \`Any\` — including \`import reqeusts\`. Install stub packages where they exist and scope the setting to the specific modules that need it.`,
    },
  ],
  debugging: [
    {
      symptom: py`error: Item "None" of "str | None" has no attribute "upper"  [union-attr]`,
      cause: py`The value might be \`None\` on some path (an \`X | None\` parameter, \`dict.get\`, \`re.match\`) and you use it without checking.`,
      fix: py`Narrow first: \`if name is None: return ...\` (or raise), then use it. If it truly can't be \`None\`, fix the type at its source instead of adding \`assert\` everywhere.`,
    },
    {
      symptom: py`error: Library stubs not installed for "requests"  [import-untyped]`,
      cause: py`The library has no inline types, but typeshed maintains stubs for it in a separate package.`,
      fix: py`\`python -m pip install types-requests\` (mypy prints this hint itself) and add it to your dev requirements and pre-commit \`additional_dependencies\`.`,
    },
    {
      symptom: py`error: Skipping analyzing "vendor_sdk": module is installed, but missing library stubs or py.typed marker  [import-untyped]`,
      cause: py`The package ships neither \`py.typed\` nor a stub package.`,
      fix: py`Add a scoped override (\`module = ["vendor_sdk.*"]\`, \`ignore_missing_imports = true\`), or write a small \`.pyi\` stub for the parts you use (mypy's \`stubgen\` can generate a starting point).`,
    },
    {
      symptom: py`error: Cannot find implementation or library stub for module named "shop"  [import-not-found]`,
      cause: py`The checker is running in a different environment or directory than your code expects: the package isn't installed there, or the source root isn't on its search path.`,
      fix: py`Run \`python -m mypy\` from the project root inside the project's virtual environment; for a \`src/\` layout, install the project in editable mode or set \`mypy_path\`.`,
    },
    {
      symptom: py`error: Unused "type: ignore" comment  [unused-ignore]`,
      cause: py`\`warn_unused_ignores\` (part of \`--strict\`) found an ignore that no longer suppresses anything — the underlying problem was fixed.`,
      fix: py`Delete the comment. This warning is how ignores stay honest over time.`,
    },
    {
      symptom: py`note: By default the bodies of untyped functions are not checked, consider using --check-untyped-defs  [annotation-unchecked]`,
      cause: py`You annotated a variable inside a function whose signature has no annotations, so mypy skipped the body.`,
      fix: py`Annotate the function's signature, or set \`check_untyped_defs = true\` (included in \`strict\`).`,
    },
    {
      symptom: py`ImportError: cannot import name 'Order' from partially initialized module 'orders' (most likely due to a circular import)`,
      cause: py`Two modules import each other at the top level — often only so they can use each other's names in type hints.`,
      fix: py`Move the hint-only import under \`if TYPE_CHECKING:\` (see the playground variant), or restructure so the shared types live in a third module.`,
    },
  ],
  bestPractices: [
    'Run one checker (same version, same config) in the editor, pre-commit and CI; make CI fail on new errors.',
    'Configure in pyproject.toml; set python_version to the oldest Python you support.',
    'Start new code with strict = true; adopt it gradually in old code with per-module overrides.',
    'Annotate function signatures; let the checker infer local variables.',
    'Narrow with is None, isinstance, match and TypeIs instead of cast().',
    'Write # type: ignore[specific-code] with a reason, never a bare ignore; keep warn_unused_ignores on.',
    'Install stub packages (types-*) instead of disabling missing-import errors globally.',
    'Use if TYPE_CHECKING: for hint-only imports, never for names needed at runtime.',
    'Ship py.typed in libraries so users get your types.',
  ],
  useCases: [
    'Catching None-handling bugs, wrong argument types and typos before tests or users do.',
    'Safe refactoring: changing a signature and letting the checker list every call site.',
    'Enforcing API contracts between teams and modules in a large codebase.',
    'Giving library users accurate autocomplete and errors by shipping py.typed.',
    'Reviewing pull requests faster because type errors are caught by CI.',
  ],
  whenToUse: {
    use: [
      'Any project that lives longer than a script, has several contributors, or gets refactored.',
      'Libraries and shared code whose functions are called from many places.',
      'Code handling optional values, unions and structured data where None bugs lurk.',
    ],
    avoid: [
      'Expecting it to validate runtime data (JSON, user input) — validate at the boundary.',
      'Chasing 100% strictness in throwaway notebooks and one-off scripts.',
      'Silencing errors with cast/ignore instead of fixing the types — that\'s worse than no checker.',
    ],
  },
  comparison: {
    title: 'mypy vs pyright',
    headers: ['', 'mypy', 'pyright'],
    rows: [
      ['written in / runs on', 'Python', 'TypeScript, runs on Node.js (PyPI wrapper available)'],
      ['editor integration', 'via plugins / language servers', 'built into VS Code\'s Pylance; very fast incremental checks'],
      ['unannotated function bodies', 'skipped by default (check_untyped_defs to enable)', 'checked, with inferred types'],
      ['strictness levels', 'individual flags, or strict = true', 'typeCheckingMode: off / basic / standard (default) / strict'],
      ['inferring [1, "a"]', 'list[object] (join)', 'list[int | str] (union)'],
      ['untyped libraries', 'import-untyped error, treated as Any', 'infers from the library source by default'],
      ['extensibility', 'plugins (e.g. Django, pydantic)', 'no plugins; standard typing features only'],
      ['config', '[tool.mypy] in pyproject.toml, or mypy.ini', '[tool.pyright] in pyproject.toml, or pyrightconfig.json'],
    ],
    note: py`Both follow the same typing specification and agree on the vast majority of code. Choose one for CI; it's fine to see the other's hints in your editor.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'static-type-checking-q1',
      type: 'mcq',
      prompt: 'With default settings, what does mypy do with the body of a function that has **no annotations at all**?',
      options: [
        { text: 'Infers types for the parameters from the call sites and checks the body', why: 'That is closer to what pyright does. mypy treats the parameters as Any and, by default, skips checking the body.' },
        'Skips checking the body — the function is "untyped" and its parameters are treated as Any',
        { text: 'Reports an error saying the function must be annotated', why: 'Only with disallow_untyped_defs (part of --strict). It is off by default.' },
        { text: 'Runs the function with sample inputs to discover the types', why: 'Type checkers never run your code.' },
      ],
      answer: 1,
      explanation: py`This is gradual typing: unannotated code is left alone so you can adopt typing piece by piece. Turn on \`check_untyped_defs\` to check those bodies anyway, or \`strict\` to require annotations.`,
    },
    {
      id: 'static-type-checking-q2',
      type: 'output',
      prompt: 'What does this print when you **run** it with Python?',
      code: py`from typing import TYPE_CHECKING, cast

if TYPE_CHECKING:
    print("checking")

count = cast(int, "42")
print(count + count, TYPE_CHECKING)`,
      answer: '4242 False',
      accept: ['4242 False'],
      explanation: py`\`TYPE_CHECKING\` is \`False\` at runtime, so the first \`print\` never runs. \`cast\` returns its argument unchanged — \`count\` is still the string \`"42"\` — so \`+\` concatenates: \`4242\`. A checker would have typed \`count + count\` as an \`int\`, which is exactly why lying with \`cast\` is dangerous.`,
    },
    {
      id: 'static-type-checking-q3',
      type: 'bug',
      prompt: 'mypy reports `Item "None" of "str | None" has no attribute "upper"  [union-attr]`. Click the line it points to.',
      code: py`def shout(name: str | None) -> str:
    if name == "":
        return "..."
    return name.upper() + "!"`,
      answerLine: 4,
      explanation: py`Checking for \`""\` doesn't rule out \`None\`, so on line 4 \`name\` is still \`str | None\`. Fix it with \`if not name: return "..."\` (catches both \`""\` and \`None\`) or an explicit \`if name is None:\` branch.`,
    },
    {
      id: 'static-type-checking-q4',
      type: 'fill',
      prompt: 'Complete the helper so that after `if is_str(x):` a checker narrows `x` to `str` in the `if` branch **and** removes `str` from it in the `else` branch (Python 3.13+).',
      code: py`from typing import ___


def is_str(value: object) -> ___[str]:
    return isinstance(value, str)`,
      answer: [['TypeIs'], ['TypeIs']],
      explanation: py`\`TypeIs\` narrows both branches. \`TypeGuard\` would only narrow the \`if\` branch, leaving the \`else\` branch unchanged.`,
    },
    {
      id: 'static-type-checking-q5',
      type: 'mcq',
      prompt: 'Why write `# type: ignore[arg-type]` instead of a bare `# type: ignore`?',
      options: [
        { text: 'The bare version is a syntax error', why: 'It is a comment: Python never complains. Checkers accept it too.' },
        'It silences only that specific error, so new, different errors on the same line are still reported',
        { text: 'It makes the code run faster', why: 'Comments have no runtime effect at all.' },
        { text: 'It tells Python to convert the argument to the right type', why: 'Nothing is converted. Ignores only affect what the checker reports.' },
      ],
      answer: 1,
      explanation: py`A bare ignore is a blanket: it would also hide a typo or a new bug on that line later. With a code, the scope is precise, and \`warn_unused_ignores\` reports it once it's no longer needed.`,
    },
    {
      id: 'static-type-checking-q6',
      type: 'mcq',
      prompt: 'Your library ships inline type hints, but users\' mypy says `module is installed, but missing library stubs or py.typed marker`. What is missing?',
      options: [
        { text: 'A types-yourlib stub package on PyPI', why: 'Stub packages are for libraries that do not ship their own hints. Yours does — it just has to say so.' },
        'An empty py.typed file inside the package (and included in the built distribution)',
        { text: 'A [tool.mypy] section in the library\'s pyproject.toml', why: 'Your config only affects checking your own code, not how users\' checkers treat the installed package.' },
        { text: 'from __future__ import annotations at the top of every module', why: 'That changes how annotations are stored, not whether checkers trust the package\'s hints.' },
      ],
      answer: 1,
      explanation: py`PEP 561: checkers only use an installed package's inline annotations if it contains a \`py.typed\` marker. Make sure your build backend includes the file in the wheel.`,
    },
    {
      id: 'static-type-checking-q7',
      type: 'short',
      prompt: 'Explain gradual typing in your own words, and why it matters when adding a type checker to an existing codebase.',
      answer: py`Gradual typing means typed and untyped code can live together: anything without annotations is treated as \`Any\`, which is compatible with every type, so the checker doesn't complain about code you haven't annotated yet. That lets a team add a checker to a large existing project without fixing everything at once — get a clean run with lenient settings, fail CI only on new errors, then annotate and tighten (towards \`strict\`) module by module. The cost is that \`Any\` hides errors, so the goal is to shrink the untyped part over time.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'type-guards',
      title: 'Teach the checker your checks',
      difficulty: 'intermediate',
      prompt: py`Data from JSON arrives as \`list[object]\`. Write two narrowing helpers so a checker understands your validation:

1. \`is_str_list(values: list[object]) -> TypeGuard[list[str]]\` — \`True\` if **every** item is a \`str\` (an empty list counts as \`True\`). Use \`TypeGuard\`: \`list[str]\` isn't a subtype of \`list[object]\` (lists are invariant), so \`TypeIs\` isn't allowed here.
2. \`is_number(value: object) -> TypeIs[int | float]\` — \`True\` for ints and floats, but **not** for bools (\`True\` is technically an \`int\`).

\`tag_line\` and \`total\` already use them. The tests check the behaviour of all four functions and that the two helpers' return hints are exactly \`TypeGuard[list[str]]\` and \`TypeIs[int | float]\`.`,
      files: {
        'main.py': py`from typing import TypeGuard, TypeIs


def is_str_list(values: list[object]) -> bool:
    # TODO: return TypeGuard[list[str]]; True if every item is a str
    return False


def is_number(value: object) -> bool:
    # TODO: return TypeIs[int | float]; ints and floats count, bools don't
    return isinstance(value, (int, float))


def tag_line(values: list[object]) -> str:
    if is_str_list(values):
        return ", ".join(values)          # a checker accepts this only if values is list[str] here
    return "invalid tags"


def total(values: list[object]) -> float:
    return sum(v for v in values if is_number(v))


print(tag_line(["red", "blue"]), "|", tag_line(["red", 3]))
print(total([1, 2.5, "3", True, None]))
`,
      },
      hints: [
        'Change the return annotations first: -> TypeGuard[list[str]] and -> TypeIs[int | float]. Both names are already imported.',
        'is_str_list: all(isinstance(v, str) for v in values). all() of an empty list is True.',
        'is_number: return isinstance(value, (int, float)) and not isinstance(value, bool)',
      ],
      solution: {
        explanation: py`At runtime both helpers are ordinary functions returning \`bool\`; the special return types only matter to the checker. \`TypeGuard[list[str]]\` tells it "if this returns True, treat the argument as a \`list[str]\`", which makes \`", ".join(values)\` type-check inside \`tag_line\`. \`TypeIs[int | float]\` narrows in both directions, so in an \`else\` branch the checker would know the value is *not* a number. The bool exclusion matters because \`bool\` is a subclass of \`int\` — without it, \`True\` would be counted as \`1\` in \`total\`. Remember the checker trusts these functions completely: if \`is_str_list\` returned \`True\` for a list containing an int, the checker would happily accept a call that crashes at runtime, so guards deserve tests like these.`,
        files: {
          'main.py': py`from typing import TypeGuard, TypeIs


def is_str_list(values: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(v, str) for v in values)


def is_number(value: object) -> TypeIs[int | float]:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def tag_line(values: list[object]) -> str:
    if is_str_list(values):
        return ", ".join(values)          # a checker accepts this only if values is list[str] here
    return "invalid tags"


def total(values: list[object]) -> float:
    return sum(v for v in values if is_number(v))


print(tag_line(["red", "blue"]), "|", tag_line(["red", 3]))
print(total([1, 2.5, "3", True, None]))
`,
        },
      },
      tests: [
        { name: 'is_str_list checks every item', code: py`assert is_str_list(["a", "b"]) is True
assert is_str_list(["a", 1]) is False
assert is_str_list([]) is True` },
        { name: 'is_number accepts ints and floats but not bools or strings', code: py`assert is_number(3) and is_number(2.5)
assert not is_number(True), 'bool is a subclass of int: exclude it explicitly'
assert not is_number("3") and not is_number(None)` },
        { name: 'tag_line and total use the guards', code: py`assert tag_line(["red", "blue"]) == "red, blue"
assert tag_line(["red", 3]) == "invalid tags"
assert total([1, 2.5, "3", True, None]) == 3.5` },
        { name: 'the return hints are TypeGuard[list[str]] and TypeIs[int | float]', code: py`import typing
from typing import TypeGuard, TypeIs
assert typing.get_type_hints(is_str_list).get('return') == TypeGuard[list[str]], 'is_str_list should return TypeGuard[list[str]]'
assert typing.get_type_hints(is_number).get('return') == TypeIs[int | float], 'is_number should return TypeIs[int | float]'` },
      ],
    },
    {
      id: 'configure-checkers',
      title: 'Configure mypy and pyright in pyproject.toml',
      difficulty: 'intermediate',
      prompt: py`The corner-shop project wants type checking in CI. Edit **pyproject.toml** (not \`main.py\`, which just loads and summarises it with \`tomllib\`) so that:

1. \`[tool.mypy]\` keeps \`python_version = "3.12"\` and \`files = ["src"]\`, and turns on \`strict = true\`.
2. A \`[[tool.mypy.overrides]]\` table with \`module = ["legacy.*"]\` sets \`ignore_errors = true\` (the old package is cleaned up later).
3. A second \`[[tool.mypy.overrides]]\` table with \`module = ["vendor_sdk.*"]\` sets \`ignore_missing_imports = true\` (that dependency ships no types).
4. \`[tool.pyright]\` sets \`pythonVersion = "3.12"\` and \`typeCheckingMode = "strict"\`.

The tests parse your TOML with \`tomllib\` and check exactly these keys and values (\`module\` may be a list or a single string).`,
      files: {
        'pyproject.toml': py`[project]
name = "corner-shop"
version = "0.1.0"
requires-python = ">=3.12"

[tool.mypy]
python_version = "3.12"
files = ["src"]
# TODO: turn on strict mode

# TODO: an override that ignores errors in legacy.*

# TODO: an override that ignores missing imports for vendor_sdk.*

[tool.pyright]
# TODO: pythonVersion and a strict typeCheckingMode
`,
        'main.py': py`import tomllib
from typing import Any


def load_tool_settings(path: str = "pyproject.toml") -> dict[str, Any]:
    with open(path, "rb") as file:
        return tomllib.load(file).get("tool", {})


def summary(tool: dict[str, Any]) -> list[str]:
    mypy = tool.get("mypy", {})
    lines = [f"mypy: python {mypy.get('python_version')}, strict={mypy.get('strict', False)}"]
    for override in mypy.get("overrides", []):
        settings = {key: value for key, value in override.items() if key != "module"}
        lines.append(f"  override {override.get('module')}: {settings}")
    pyright = tool.get("pyright", {})
    lines.append(f"pyright: python {pyright.get('pythonVersion')}, mode={pyright.get('typeCheckingMode', 'standard')}")
    return lines


for line in summary(load_tool_settings()):
    print(line)
`,
      },
      hints: [
        'TOML booleans are lowercase: strict = true. Each [[tool.mypy.overrides]] header starts a new table in a list.',
        'An override looks like:\n[[tool.mypy.overrides]]\nmodule = ["legacy.*"]\nignore_errors = true',
        'Under [tool.pyright]: pythonVersion = "3.12" and typeCheckingMode = "strict" (note the camelCase keys — pyright uses them, mypy uses snake_case).',
      ],
      solution: {
        explanation: py`Both checkers read their settings from \`pyproject.toml\`, one table each. \`strict = true\` turns on mypy's whole bundle of strictness flags for the project, while the two **overrides** relax specific modules: \`ignore_errors\` lets the legacy package stay untouched for now (gradual adoption), and \`ignore_missing_imports\` is scoped to the single dependency without types instead of being switched on globally. \`[[...]]\` is TOML's syntax for "append another table to this list", which is how mypy expresses several overrides. Pyright's keys are camelCase; \`typeCheckingMode = "strict"\` is its equivalent of mypy's \`strict\`. Setting the Python version to the minimum in \`requires-python\` makes both checkers flag features your oldest supported interpreter lacks.`,
        files: {
          'pyproject.toml': py`[project]
name = "corner-shop"
version = "0.1.0"
requires-python = ">=3.12"

[tool.mypy]
python_version = "3.12"
files = ["src"]
strict = true

[[tool.mypy.overrides]]
module = ["legacy.*"]
ignore_errors = true

[[tool.mypy.overrides]]
module = ["vendor_sdk.*"]
ignore_missing_imports = true

[tool.pyright]
pythonVersion = "3.12"
typeCheckingMode = "strict"
`,
          'main.py': py`import tomllib
from typing import Any


def load_tool_settings(path: str = "pyproject.toml") -> dict[str, Any]:
    with open(path, "rb") as file:
        return tomllib.load(file).get("tool", {})


def summary(tool: dict[str, Any]) -> list[str]:
    mypy = tool.get("mypy", {})
    lines = [f"mypy: python {mypy.get('python_version')}, strict={mypy.get('strict', False)}"]
    for override in mypy.get("overrides", []):
        settings = {key: value for key, value in override.items() if key != "module"}
        lines.append(f"  override {override.get('module')}: {settings}")
    pyright = tool.get("pyright", {})
    lines.append(f"pyright: python {pyright.get('pythonVersion')}, mode={pyright.get('typeCheckingMode', 'standard')}")
    return lines


for line in summary(load_tool_settings()):
    print(line)
`,
        },
      },
      tests: [
        { name: 'mypy: python 3.12, files src, strict on', code: py`import tomllib
mypy = tomllib.loads(files['pyproject.toml'])['tool']['mypy']
assert mypy.get('python_version') == '3.12' and mypy.get('files') == ['src']
assert mypy.get('strict') is True, 'Add strict = true under [tool.mypy]'` },
        { name: 'override: ignore errors in legacy.*', code: py`import tomllib
overrides = tomllib.loads(files['pyproject.toml'])['tool']['mypy'].get('overrides', [])
mods = lambda o: o.get('module') if isinstance(o.get('module'), list) else [o.get('module')]
assert any('legacy.*' in mods(o) and o.get('ignore_errors') is True for o in overrides), 'Add a [[tool.mypy.overrides]] table for legacy.* with ignore_errors = true'` },
        { name: 'override: ignore missing imports for vendor_sdk.* only', code: py`import tomllib
mypy = tomllib.loads(files['pyproject.toml'])['tool']['mypy']
overrides = mypy.get('overrides', [])
mods = lambda o: o.get('module') if isinstance(o.get('module'), list) else [o.get('module')]
assert any('vendor_sdk.*' in mods(o) and o.get('ignore_missing_imports') is True for o in overrides), 'Add an override for vendor_sdk.* with ignore_missing_imports = true'
assert 'ignore_missing_imports' not in mypy, 'Scope ignore_missing_imports to vendor_sdk.*, not the whole project'` },
        { name: 'pyright: python 3.12 in strict mode', code: py`import tomllib
pyright = tomllib.loads(files['pyproject.toml'])['tool'].get('pyright', {})
assert pyright.get('pythonVersion') == '3.12', 'Set pythonVersion = "3.12" under [tool.pyright]'
assert pyright.get('typeCheckingMode') == 'strict'` },
        { name: 'the summary shows strict=True', code: py`assert 'strict=True' in output and 'mode=strict' in output` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'static-type-checking-adopting',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 4,
      question: 'What is gradual typing, and how would you introduce mypy into a large existing codebase with no type hints?',
      answer: 'Gradual typing lets annotated and unannotated code coexist: unannotated values are Any, which is compatible with everything. Introduce the checker leniently, fix the real bugs it finds, make CI fail only on new errors, then tighten module by module (overrides) toward strict, starting with new and frequently changed code.',
      explanation: py`Turning on \`strict\` for a large untyped codebase produces thousands of errors and gets disabled within a week. Instead: pin mypy, add it to CI with default settings, use per-module overrides (\`ignore_errors\` for the worst areas), annotate public function signatures first, enable \`strict\` for new packages, and ratchet. Tools like MonkeyType or pyannotate can draft annotations from runtime traces, which you then review.`,
      whyAsked: 'Most real typing work is retrofitting, not greenfield; this checks pragmatism.',
      mistakes: ['Proposing to annotate everything before enabling the checker', 'Turning on strict everywhere on day one', 'Not mentioning CI enforcement'],
      followUps: ['What does mypy do with unannotated functions by default?', 'How do you stop the number of ignores from growing?', 'Would you choose mypy or pyright for this?'],
      modelAnswer: 'Gradual typing means a checker can work on partly annotated code: anything unannotated is treated as Any, which is compatible with every type, so typed and untyped code can call each other. For a large existing codebase I would pin a mypy version and add it to CI with lenient settings, using per-module overrides to quarantine the messiest areas. I would fix the genuine bugs it finds, make CI fail on new errors, and then annotate public function signatures first, because they give the most value. New modules start with strict, and over time I tighten the overrides module by module until the whole codebase is strict.',
    },
    {
      id: 'static-type-checking-mypy-vs-pyright',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare mypy and pyright. Your team uses VS Code (Pylance) but CI runs mypy, and developers complain the two disagree. What do you do?',
      answer: 'Both implement the same typing spec but differ in defaults and inference: mypy skips unannotated bodies by default and infers joins (list[object]); pyright checks unannotated code, infers unions (list[int | str]), and infers types for untyped libraries. Pick one checker as the CI source of truth, pin its version, share one config, and align the editor with it as far as possible.',
      explanation: py`Disagreements usually come from (1) different strictness defaults, (2) different inference for literals and containers, (3) untyped third-party code (mypy: \`Any\` with an error; pyright: inferred from source), and (4) different versions. Options: run pyright in CI too (since the editor already uses it), or configure Pylance's \`typeCheckingMode\` to match and accept that the editor is advisory. Either way: one pinned checker gates merges.`,
      whyAsked: 'A common real-world friction point that tests depth beyond "I ran mypy once".',
      mistakes: ['Claiming one is strictly "more correct"', 'Running both in CI with conflicting configs', 'Ignoring version pinning'],
      followUps: ['Why does pyright report errors in unannotated functions?', 'What does a mypy plugin do that pyright cannot?', 'How would you migrate CI from mypy to pyright?'],
      modelAnswer: 'mypy and pyright both implement the shared typing specification, but they differ in defaults and inference. mypy skips the bodies of unannotated functions unless check_untyped_defs is on, infers a join like list of object for mixed lists, reports untyped libraries as import-untyped and has a plugin system; pyright checks unannotated code with inferred types, infers unions, reads untyped libraries\' source and is very fast, which is why it powers Pylance. When editor and CI disagree, I pick one as the source of truth for merges, pin its version and keep one config in pyproject.toml. If the team lives in VS Code, running pyright in CI is often the simplest fix; otherwise I treat the editor warnings as advisory.',
    },
    {
      id: 'static-type-checking-typeguard-vs-typeis',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What problem do TypeGuard and TypeIs solve, and how do they differ?',
      answer: 'Checkers can\'t see inside your own validation functions, so a helper returning bool doesn\'t narrow anything. Returning TypeGuard[T] or TypeIs[T] tells the checker what True means. TypeGuard (3.10) narrows only the positive branch, to exactly T, and allows unrelated types like list[object] → list[str]. TypeIs (3.13) narrows both branches and keeps precision, but T must be consistent with the input type.',
      explanation: py`With \`def is_str(x: object) -> bool\`, \`if is_str(v): v.upper()\` is an error — the checker only knows a bool came back. \`TypeIs[str]\` makes \`v\` a \`str\` in the \`if\` branch and "not str" in the \`else\` branch; with \`v: str | int\`, the \`else\` branch becomes \`int\`. \`TypeGuard\` is needed when the narrowed type isn't a subtype of the input (invariant containers). Both are plain \`bool\` functions at runtime, and the checker trusts them blindly.`,
      code: { lang: 'python', code: py`from typing import TypeGuard, TypeIs


def is_str_list(values: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(v, str) for v in values)


def is_str(value: object) -> TypeIs[str]:
    return isinstance(value, str)


def describe(item: str | int) -> str:
    if is_str(item):
        return item.upper()     # str
    return str(item + 1)        # int: TypeIs narrowed the else branch` },
      whyAsked: 'Shows you can extend the checker\'s understanding instead of reaching for cast.',
      mistakes: ['Saying they validate at runtime', 'Using TypeIs where the narrowed type isn\'t a subtype of the input', 'Using cast instead of a guard'],
      followUps: ['What happens if a guard function is wrong?', 'How did people write these before 3.13?', 'Can a method be a type guard?'],
      modelAnswer: 'Type checkers understand built-in checks like isinstance, but not my own helper functions — if is_valid returns a plain bool, nothing gets narrowed. TypeGuard and TypeIs are special return types that tell the checker what a True result means. TypeGuard, from 3.10, narrows only the if branch, to exactly the given type, and it allows narrowing to unrelated types — like turning a list of object into a list of str, which is useful for invariant containers. TypeIs, from 3.13, narrows both branches — the else branch loses that type — and keeps precision, but the target type must be consistent with the input. At runtime both are just functions returning bool, and the checker trusts them completely, so I test them.',
    },
    {
      id: 'static-type-checking-require',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write a generic helper `require[T](value: T | None, message: str) -> T` that returns `value` if it is not `None` and raises `ValueError(message)` otherwise. It should let callers turn an `X | None` into an `X` in one line, with a checker understanding the result. Note: `0`, `""` and `False` are valid values, not missing ones.',
      answer: 'def require[T](value: T | None, message: str) -> T: if value is None: raise ValueError(message); return value — the is None check narrows T | None to T, and the generic signature means the caller gets back the precise type.',
      explanation: py`The type parameter links input and output: \`require(user.email, "...")\` with \`email: str | None\` returns \`str\`. Inside, \`if value is None: raise\` narrows \`T | None\` to \`T\`. Using \`if not value\` would be a bug: it would reject \`0\`, \`""\` and \`False\`. This is a common production helper because it turns "should never be None here" into an explicit, tested failure with a clear message — unlike \`assert\`, which \`-O\` removes.`,
      starter: { files: { 'main.py': py`def require(value, message):
    # TODO: make generic; raise ValueError(message) only when value is None
    if not value:
        raise ValueError(message)
    return value


config = {"port": 0, "host": "localhost", "debug": None}
print(require(config["host"], "host is required"))
print(require(config["port"], "port is required"))
` } },
      tests: [
        { name: 'returns the value when present', code: py`assert require("localhost", "host?") == "localhost"
assert require([1], "items?") == [1]` },
        { name: 'falsy values are not "missing"', code: py`assert require(0, "x") == 0 and require("", "x") == "" and require(False, "x") is False` },
        { name: 'raises ValueError with the message for None', code: py`with raises(ValueError, match="debug flag is required"):
    require(None, "debug flag is required")` },
        { name: 'declared as require[T](value: T | None, message: str) -> T', code: py`import typing
params = getattr(require, '__type_params__', ())
assert len(params) == 1, 'Declare one type parameter: def require[T](...)'
T = params[0]
hints = typing.get_type_hints(require)
assert hints.get('value') == (T | None) and hints.get('message') is str and hints.get('return') is T` },
      ],
      solution: { files: { 'main.py': py`def require[T](value: T | None, message: str) -> T:
    if value is None:
        raise ValueError(message)
    return value


config = {"port": 0, "host": "localhost", "debug": None}
print(require(config["host"], "host is required"))
print(require(config["port"], "port is required"))
` } },
      hints: ['Use `is None`, not truthiness — 0 and "" are real values.', 'def require[T](value: T | None, message: str) -> T: — after the None check, the checker knows value is a T.'],
      whyAsked: 'Combines narrowing, generics and a real-world pattern for handling Optional values cleanly.',
      mistakes: ['Using if not value, which rejects 0, "" and False', 'Annotating with Any instead of a type parameter', 'Using assert, which python -O removes'],
      followUps: ['Why not just use assert value is not None?', 'How would the call site look with pyright\'s reveal_type?', 'Would you raise ValueError or a custom exception?'],
      modelAnswer: 'I would make it generic over T: def require with type parameter T, taking value typed T or None and a message, returning T. The body checks value is None — specifically is None, because zero, empty strings and False are legitimate values — and raises ValueError with the message; otherwise it returns value, which the checker has narrowed to T. Because of the type parameter, a caller passing a str or None gets back a plain str, so the rest of their code type-checks without casts. I prefer this to assert, because python -O strips asserts, and the explicit message makes the failure easy to diagnose.',
    },
    {
      id: 'static-type-checking-ignores-review',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A pull request makes CI green by adding 40 `# type: ignore` comments and several `cast()` calls. How do you review it?',
      answer: 'Treat each ignore and cast as an unverified claim. Ask for specific error codes and a reason on every ignore, replace casts with real narrowing or conversion where possible, fix genuine bugs the errors pointed at, and keep warn_unused_ignores (and ignore-without-code) on so the remaining ones stay honest.',
      explanation: py`Ignores and casts don't make code safer; they hide what the checker found. Many "annoying" errors are real \`None\` bugs. Typical fixes: narrow \`X | None\` with \`is None\`, add stub packages instead of ignoring \`import-untyped\`, type a decorator properly instead of ignoring every call site, validate JSON at the boundary instead of \`cast\`. Legitimate ignores exist (library bugs, dynamic code) — they should be rare, specific and explained.`,
      whyAsked: 'Tests engineering judgment and whether you understand what the checker is for.',
      mistakes: ['Approving because CI is green', 'Banning ignores entirely, even legitimate ones', 'Not looking at what the original errors were'],
      followUps: ['Which mypy options help keep ignores under control?', 'When is cast actually appropriate?', 'How would you track typing debt over time?'],
      modelAnswer: 'I would not approve it just because CI is green: every ignore and cast is a claim the checker can no longer verify. I would look at the errors they hide — many will be real None-handling bugs or missing stub packages — and ask for those to be fixed properly with narrowing, real conversions or types-* packages. For the ignores that remain, I would require a specific error code and a short reason, and make sure warn_unused_ignores and the ignore-without-code check are on so they cannot silently pile up. Casts should be rare and only where we genuinely know more than the checker, ideally right after a validation step.',
    },
    {
      id: 'static-type-checking-type-checking-guard',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'After moving `from billing import Invoice` under `if TYPE_CHECKING:` to fix a circular import, a serializer that calls `typing.get_type_hints(Order.invoice)` crashes with `NameError: name \'Invoice\' is not defined`. Why, and what are your options?',
      answer: 'TYPE_CHECKING is False at runtime, so Invoice never exists in orders\' namespace; get_type_hints evaluates the annotation and fails. Options: resolve hints with annotationlib (3.14) FORWARDREF/STRING formats, pass a namespace to get_type_hints (localns/globalns) that includes Invoice, import the name at runtime in a way that doesn\'t cycle (e.g. a third module for shared types), or restructure so the runtime code doesn\'t need resolved hints.',
      explanation: py`Type-only imports work for checkers and for *unevaluated* annotations. Anything that evaluates them at runtime — \`get_type_hints\`, dataclass-based serializers, pydantic, FastAPI — needs the real object. In 3.14, \`annotationlib.get_annotations(obj, format=Format.FORWARDREF)\` returns \`ForwardRef\` objects for missing names instead of raising, and \`Format.STRING\` returns source text. Often the cleanest fix is architectural: move shared types into a module both sides can import without a cycle.`,
      code: { lang: 'python', code: py`import annotationlib
import typing

import billing
import orders

# Option 1: tolerate missing names (3.14+)
hints = annotationlib.get_annotations(orders.Order.invoice, format=annotationlib.Format.FORWARDREF)

# Option 2: supply the missing names explicitly
hints = typing.get_type_hints(orders.Order.invoice, localns={"Invoice": billing.Invoice})` },
      whyAsked: 'Runtime use of annotations (serializers, DI, web frameworks) is common, and TYPE_CHECKING breaks it in subtle ways.',
      mistakes: ['Thinking TYPE_CHECKING imports are available at runtime', 'Fixing it by moving the import back to the top (re-creating the cycle)', 'Blaming PEP 649 lazy annotations'],
      followUps: ['What do the annotationlib formats VALUE, FORWARDREF and STRING return?', 'How would pydantic handle a forward reference?', 'How would you restructure to avoid the cycle entirely?'],
      modelAnswer: 'TYPE_CHECKING is a constant that is False when the program runs, so the guarded import never executes and Invoice simply does not exist in the orders module. Checkers are happy, and with lazy annotations the def is fine, but get_type_hints evaluates the annotation, so it raises NameError. If the code only needs to inspect hints, on 3.14 I can use annotationlib with the FORWARDREF or STRING format, which does not require the name. If it needs real classes, I can pass the missing names to get_type_hints via localns. Often the best fix is structural: move the shared types into a third module so both sides can import them at runtime without a cycle.',
    },
    {
      id: 'static-type-checking-shipping-types',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You maintain a popular Python library. How do you ship type information to your users, and how do you keep it correct?',
      answer: 'Annotate the public API inline and include a py.typed marker in the package (PEP 561), making sure the build includes it; for C extensions or code you can\'t annotate, ship .pyi stubs alongside. Type-check the library itself in CI (strict, against the minimum supported Python), and test the public types from a user\'s perspective (e.g. small typed usage files, assert_type, mypy\'s stubtest for stubs).',
      explanation: py`Without \`py.typed\`, mypy ignores your inline hints and users see \`import-untyped\`. Stubs (\`.pyi\`) can live next to modules in the package, or in a separate \`yourlib-stubs\` package. Typing the public API is part of your API contract: changing a return type from \`list\` to \`Iterator\` can break users' type-checked code even if it runs. Keep \`__all__\`/explicit re-exports clean (strict mode's \`no_implicit_reexport\` affects how users see your names), and treat type changes in the changelog like behaviour changes.`,
      code: { lang: 'text', code: py`yourlib/
├── pyproject.toml
└── src/
    └── yourlib/
        ├── __init__.py
        ├── py.typed          # empty marker file: "my inline hints are real"
        ├── core.py
        └── _speedups.pyi     # stub for a compiled extension module` },
      whyAsked: 'Library maintainers need to understand PEP 561 and that types are part of the public API.',
      mistakes: ['Forgetting py.typed (or forgetting to include it in the wheel)', 'Publishing hints but never type-checking the library', 'Treating type changes as non-breaking'],
      followUps: ['What is the difference between inline types, bundled stubs and a -stubs package?', 'What does stubtest check?', 'How do implicit re-exports affect users under --strict?'],
      modelAnswer: 'I would annotate the public API inline and add an empty py.typed marker file to the package, making sure the build backend includes it in the wheel — without that, PEP 561 says checkers should ignore my inline hints. For parts I cannot annotate, like a compiled extension, I would ship .pyi stub files next to them. In CI I type-check the library itself in strict mode against the oldest supported Python, plus a few small usage files with assert_type to test the types users actually see, and stubtest if I ship stubs. And I treat type changes as API changes: tightening a return type can break users\' CI even if runtime behaviour is identical.',
    },
  ],

  takeaways: [
    'A static type checker reads code without running it and reports where values don\'t match the hints — mypy and pyright are the main ones.',
    'Install the checker in the project\'s virtual environment, configure it in pyproject.toml ([tool.mypy] / [tool.pyright]), pin its version, and run the same setup in the editor, pre-commit and CI.',
    'Gradual typing: unannotated code is Any; mypy skips unannotated function bodies by default. Adopt with lenient settings and per-module overrides, then ratchet toward strict.',
    'Read errors as file:line: message [code]; the code is what you search for and what a targeted # type: ignore[code] names.',
    'Narrow unions with is None, isinstance, match and early returns; teach the checker your own checks with TypeGuard (3.10) or TypeIs (3.13).',
    'cast() and # type: ignore are unverified claims — use them rarely, narrowly and with a reason; keep warn_unused_ignores on.',
    'if TYPE_CHECKING: imports exist only for checkers; library types come from typeshed, stub packages (types-*) or a py.typed marker.',
  ],
}
