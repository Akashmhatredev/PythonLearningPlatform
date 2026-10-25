// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PRICES = py`"""Prices and tax rules for a tiny corner shop."""
print(f"[prices.py runs top to bottom, __name__ = {__name__!r}]")

VAT_RATE = 0.20
CATALOGUE = {"apple": 0.50, "bread": 1.20, "milk": 0.95}


def price_with_vat(item):
    """Unit price of item including VAT, rounded to pennies."""
    return round(CATALOGUE[item] * (1 + VAT_RATE), 2)
`

const RECEIPT = py`"""Formats receipt lines. It imports prices too, but prices.py only runs once."""
import prices


def line(item, quantity):
    cost = prices.price_with_vat(item) * quantity
    return f"{quantity} x {item:<6} {cost:>6.2f}"
`

const MAIN = py`import sys

import prices                    # 1st import: finds prices.py and runs it
import receipt                   # receipt.py imports prices again: cached
import prices as shop_prices     # an alias: a second name, same module
from prices import CATALOGUE     # copy one name into this namespace

basket = [("apple", 3), ("bread", 1), ("milk", 2)]

print("--- receipt ---")
for item, quantity in basket:
    print(receipt.line(item, quantity))

print("--- what import did ---")
print("one module object?", shop_prices is prices is sys.modules["prices"])
print("loaded from:", prices.__file__.rsplit("/", 1)[-1])
print("searched first:", sys.path[0])
print("for sale:", ", ".join(sorted(CATALOGUE)))
`

const TOOLS = py`import math

RATE = 0.2
_cache = {}


def area(radius):
    return math.pi * radius ** 2


def _helper():
    return "internal"
`

const TOOLS_ALL = py`import math

__all__ = ["area"]


def area(radius):
    return math.pi * radius ** 2


def perimeter(radius):
    return 2 * math.pi * radius
`

const FMT_PLAIN = py`def format_price(amount):
    return f"{amount:.2f}"
`

const FMT_FANCY = py`def format_price(amount):
    return f"*** £{amount:,.2f} ***"
`

export default {
  id: 'modules-and-imports',
  title: 'Modules & imports',
  summary: 'A module is a .py file; import finds it on sys.path, runs it once, caches it in sys.modules and binds a name to it.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['defining-functions', 'scope'],
  related: ['packages', 'main-guard-and-scripts', 'project-structure', 'virtual-environments', 'pip-and-dependencies', 'object-model', 'dictionaries'],
  tags: ['modules', 'import', 'from import', 'import as', 'alias', 'sys.path', 'sys.modules', 'module cache', 'importlib', 'reload', 'import_module', 'star import', 'namespace', 'ModuleNotFoundError', 'shadowing'],
  apis: [
    { name: 'import module', summary: 'Find and load a module (once), then bind its name in the current namespace.' },
    { name: 'from module import name', summary: 'Load the module, then bind selected names from it directly in the current namespace.' },
    { name: 'import module as alias', summary: 'Load the module and bind it under a different name.' },
    { name: 'sys.path', summary: 'The list of folders (and zip files) Python searches, in order, to find a module.' },
    { name: 'sys.modules', summary: 'The cache of every module already imported in this process: a dict of name → module object.' },
    { name: 'importlib.import_module(name)', summary: 'Import a module whose name is only known at runtime, given as a string.' },
    { name: 'importlib.reload(module)', summary: 'Re-run a module\'s code inside the existing module object (a REPL/debugging tool).' },
    { name: 'module.__name__ / __file__', summary: 'The module\'s import name and the path of the file it was loaded from.' },
    { name: 'dir(module)', summary: 'Lists the names defined in a module.' },
  ],
  docs: [
    { label: 'Python tutorial — Modules', url: 'https://docs.python.org/3/tutorial/modules.html' },
    { label: 'Language reference — The import system', url: 'https://docs.python.org/3/reference/import.html' },
    { label: 'The initialization of the sys.path module search path', url: 'https://docs.python.org/3/library/sys_path_init.html' },
    { label: 'importlib — the implementation of import', url: 'https://docs.python.org/3/library/importlib.html' },
    { label: 'PEP 8 — Imports', url: 'https://peps.python.org/pep-0008/#imports' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **module** is simply a file of Python code. Save some functions in \`prices.py\` and you have made a module called \`prices\` — its name is the file name without \`.py\`. Every *top-level* name in that file (functions, classes, variables defined outside any function) becomes something other files can use.`,
    py`The \`import\` statement is how one file uses another. When Python runs \`import prices\`, it does three things:`,
    py`1. **find** a file called \`prices.py\` by searching a list of folders (\`sys.path\`);
2. **load** it: create a *module object* and run the file's code from top to bottom — **only the first time**; after that the module is cached in \`sys.modules\`;
3. **bind** the name \`prices\` in your file to that module object, so you can write \`prices.price_with_vat("milk")\`.`,
    py`That's the whole story behind \`import math\`, \`import json\` and every library you'll ever install. The standard library is just a few hundred modules that ship with Python. Next you'll group modules into [packages](lesson:packages), learn why scripts need [the \`__main__\` guard](lesson:main-guard-and-scripts), and lay out a [real project](lesson:project-structure).`,
  ],
  why: [
    py`**One file can't hold everything.** A 3,000-line \`main.py\` is impossible to navigate. Splitting code into modules — one per responsibility (prices, receipts, storage) — makes each part small enough to understand, test and change on its own.`,
    py`**Namespaces stop name clashes.** \`prices.total\` and \`receipt.total\` can both exist, because each module has its own namespace (its own table of names). You always know where a name came from.`,
    py`**Reuse.** Write a helper once, import it everywhere. The standard library and every package on PyPI (the Python Package Index) are delivered to you as modules.`,
    py`**Load once, share everywhere.** Because imported modules are cached, ten files can \`import prices\` and they all share one module object — its code runs once, and its data is shared.`,
  ],
  eli15: [
    py`Think of a module as a **toolbox** on a shelf. \`prices.py\` is a toolbox full of price tools.`,
    py`- \`import prices\` puts the whole toolbox on your desk. To use a tool you say which box it's in: \`prices.price_with_vat(...)\`.
- \`from prices import price_with_vat\` takes one tool out of the box and puts it straight on your desk, so you just say \`price_with_vat(...)\`.
- \`import prices as p\` sticks a short label "p" on the box.`,
    py`Where does Python look for the toolbox? It checks a list of shelves in order — that list is \`sys.path\` — and takes the **first** box with the right name. And once a box is on your desk, Python never fetches it again: asking for it a second time just points you at the same box. That desk is \`sys.modules\`.`,
  ],
  analogy: {
    title: 'Borrowing from the school library',
    body: [
      py`You ask the librarian for *The Price Book*. First she checks whether you've already borrowed it — if it's on your desk, she just points at it. Otherwise she walks the shelves **in a fixed order** (your classroom shelf first, then the main library, then the reference room) and hands you the first copy she finds. The book's preface gets read out once, when you first receive it.`,
      py`From then on, everyone in your study group who asks for *The Price Book* is pointed to the same copy on your desk. If someone scribbles a note in it, everyone sees the note.`,
    ],
    mapping: [
      ['the book', 'a module (prices.py)'],
      ['asking the librarian', 'import prices'],
      ['the shelves, checked in order', 'sys.path — the first match wins'],
      ['your desk of borrowed books', 'sys.modules — the cache of loaded modules'],
      ['reading the preface once on arrival', 'running the module\'s top-level code once, on first import'],
      ['photocopying one page onto your notepad', 'from prices import VAT_RATE — your copy of the name won\'t follow later changes'],
      ['a sticky label on the cover', 'import prices as p'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'What `import prices` actually does',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'stmt', label: 'import prices', note: 'in main.py', x: 100, y: 160, tone: 'yellow' },
        { id: 'cache', label: 'sys.modules', note: 'already loaded?', x: 300, y: 70, tone: 'blue' },
        { id: 'path', label: 'sys.path', note: 'folders, searched in order', x: 300, y: 250, tone: 'blue' },
        { id: 'file', label: 'prices.py', note: 'first match wins', x: 490, y: 250, tone: 'kraft' },
        { id: 'module', label: 'module object', note: 'code runs once', x: 670, y: 250 },
        { id: 'name', label: 'prices', note: 'a name in main.py', x: 670, y: 70, tone: 'yellow' },
      ],
      edges: [
        { from: 'stmt', to: 'cache', label: 'look up' },
        { from: 'stmt', to: 'path', label: 'miss: search' },
        { from: 'path', to: 'file', label: 'found' },
        { from: 'file', to: 'module', label: 'create + run' },
        { from: 'module', to: 'cache', label: 'stored', dashed: true },
        { from: 'module', to: 'name', label: 'bind' },
        { id: 'hit', from: 'cache', to: 'name', label: 'hit: reuse', dashed: true },
      ],
      steps: [
        { focus: ['stmt'], text: py`Python reaches \`import prices\`. It needs a module object for the name \`prices\`.` },
        { focus: ['stmt', 'cache'], edges: ['stmt->cache'], text: py`**Step 1 — the cache.** It looks in \`sys.modules\`, a dict of every module already imported in this process. The first time, \`"prices"\` isn't there.` },
        { focus: ['path', 'file'], edges: ['stmt->path', 'path->file'], text: py`**Step 2 — the search.** It walks the folders in \`sys.path\` in order: the script's own folder first, then the standard library, then installed packages (*site-packages*). The **first** \`prices.py\` (or \`prices/\` package) it finds wins.` },
        { focus: ['module', 'cache'], edges: ['file->module', 'module->cache'], text: py`**Step 3 — load.** A new, empty module object is created and stored in \`sys.modules["prices"]\` *before* the file runs. Then the file's top-level code runs, top to bottom, and every name it defines becomes an attribute of the module.` },
        { focus: ['name'], edges: ['module->name'], text: py`**Step 4 — bind.** The name \`prices\` in \`main.py\` now refers to that module object, so \`prices.VAT_RATE\` works.` },
        { focus: ['cache', 'name'], edges: ['hit'], text: py`**Every later import** — in \`main.py\` or any other file — finds \`"prices"\` in \`sys.modules\` and reuses the same object. Nothing is searched and the file is **not** run again.` },
      ],
    },
    alt: 'Diagram: the statement import prices first checks sys.modules. On a miss it searches the folders in sys.path in order, finds prices.py, creates a module object, stores it in sys.modules and runs the file once, then binds the name prices to it. A dashed arrow shows that later imports hit the cache and reuse the same module.',
    caption: py`Step through with ▶. The cache check comes first, which is why importing the same module ten times costs almost nothing after the first.`,
  },
  syntax: [
    py`#### The four forms of import`,
    { code: py`import math                          # bind the module:          math.sqrt(16)
import statistics as stats           # bind it under an alias:   stats.mean([1, 2])
from math import sqrt, pi            # bind selected names:      sqrt(16), pi
from statistics import mean as avg   # a selected name, renamed: avg([1, 2])

print(math.sqrt(16), stats.mean([1, 2]), sqrt(16), round(pi, 2), avg([1, 2]))`, lang: 'python', title: 'import forms' },
    py`| form | what gets bound in *your* namespace | you write |
|---|---|---|
| \`import prices\` | \`prices\` → the module | \`prices.VAT_RATE\` |
| \`import prices as p\` | \`p\` → the module | \`p.VAT_RATE\` |
| \`from prices import VAT_RATE\` | \`VAT_RATE\` → the object the module's \`VAT_RATE\` pointed to *at import time* | \`VAT_RATE\` |
| \`from prices import *\` | every public name (or the names in \`__all__\`) | names appear from nowhere |`,
    py`All four forms load (and cache) the **whole** module — \`from math import sqrt\` still runs all of \`math\`. The forms only differ in *which names* get bound in your file.`,
    py`#### Where imports go (PEP 8)`,
    py`- At the **top** of the file, after the module docstring.
- One module per line: \`import os\` and \`import sys\` on separate lines (\`from os import path, sep\` is fine).
- In three groups separated by a blank line: **standard library**, **third-party** (installed with pip), **your own** modules.
- Prefer absolute imports (\`from shop import cart\`). Relative imports (\`from . import cart\`) are covered in [packages](lesson:packages).`,
    { code: py`import json
import sys
from pathlib import Path

# third-party packages would go here, e.g. import requests

import prices
import receipt`, lang: 'python', title: 'a PEP 8 import block', static: true },
    py`Tools like Ruff and isort sort these groups for you — see [code quality tools](lesson:code-quality-tools).`,
    py`#### Looking inside a module`,
    { code: py`import math

print(math.__name__)      # 'math' — its import name
print(math.__doc__[:40])  # the module docstring
print("sqrt" in dir(math))  # dir() lists its names: True
# help(math) prints the full documentation in a terminal`, lang: 'python', title: 'module attributes' },
    py`#### Importing by a name you only know at runtime`,
    { code: py`import importlib

module_name = "json"                     # e.g. read from a config file
json_module = importlib.import_module(module_name)
print(json_module.dumps({"ok": True}))  # {"ok": true}`, lang: 'python', title: 'importlib.import_module()' },
    { callout: 'warn', title: 'Avoid `from module import *`', text: py`A star import dumps every public name of a module into yours. You can no longer tell where a name came from, it can silently **overwrite** names you already had (\`from os import *\` replaces the built-in \`open\` with \`os.open\`, a completely different function), and linters can't detect undefined names. It's tolerable in a quick interactive session; in real code, import the module or name exactly what you need.` },
  ],
  walkthrough: {
    title: 'Reading main.py line by line',
    lang: 'python',
    code: MAIN,
    intro: py`This is \`main.py\` from the playground below (it has two more files, \`prices.py\` and \`receipt.py\`). Press **Guide** there to follow these steps in the editor.`,
    steps: [
      { lines: [1], text: py`\`sys\` is a built-in module. We need it to peek at \`sys.modules\` and \`sys.path\`.` },
      { lines: [3], text: py`First import of \`prices\`: Python searches \`sys.path\`, finds \`prices.py\` in the project folder, creates a module object and **runs the file**. That's why its banner line is the very first thing printed — before anything in \`main.py\` prints.` },
      { lines: [4], text: py`\`receipt.py\` starts with \`import prices\` too. This time \`"prices"\` is already in \`sys.modules\`, so nothing runs again: \`receipt\` just gets a reference to the same module object.` },
      { lines: [5], text: py`An alias is only a different *name*. \`shop_prices\` and \`prices\` are bound to the same module object.` },
      { lines: [6], text: py`\`from prices import CATALOGUE\` binds a name \`CATALOGUE\` in **this** module to the dict that \`prices.CATALOGUE\` refers to right now. It's the same dict object, not a copy — but the *name* is now independent.` },
      { lines: [10, 12], text: py`\`receipt.line()\` calls \`prices.price_with_vat()\`, which looks up \`CATALOGUE\` and \`VAT_RATE\` in the **prices** module's namespace — each module keeps its own globals.` },
      { lines: [15], text: py`Chained \`is\` checks: the alias, the original name and the cache entry are all one object, so this prints \`True\`.` },
      { lines: [16, 17], text: py`\`__file__\` records where the module was loaded from. \`sys.path[0]\` is the first folder searched — the folder containing the script you ran (here, the sandbox's project folder).` },
    ],
  },
  playground: {
    title: 'A three-module corner shop',
    objective: 'Run it and notice the banner prints once, although two files import prices. Then change the modules and watch how names travel between files.',
    files: { 'main.py': MAIN, 'prices.py': PRICES, 'receipt.py': RECEIPT },
    expected: py`\`\`\`text
[prices.py runs top to bottom, __name__ = 'prices']
--- receipt ---
3 x apple    1.80
1 x bread    1.44
2 x milk     2.28
--- what import did ---
one module object? True
loaded from: prices.py
searched first: /home/pyodide/project
for sale: apple, bread, milk
\`\`\`

The banner appears **once**, before the receipt, even though both \`main.py\` and \`receipt.py\` import \`prices\`. The project folder name (\`/home/pyodide/project\`) is where this browser sandbox keeps your files; on your computer it would be the folder containing \`main.py\`. Open the file tabs to read \`prices.py\` and \`receipt.py\`.`,
    experiments: [
      {
        id: 'add-eggs',
        task: py`In **prices.py**, add \`"eggs": 2.40\` to \`CATALOGUE\`. In **main.py**, add six eggs to the basket. Run it: did you need to change \`receipt.py\`?`,
        hint: py`Add \`, "eggs": 2.40\` inside the dict in prices.py, and \`("eggs", 6)\` to the \`basket\` list in main.py.`,
        tests: [
          { name: 'prices.CATALOGUE has eggs at 2.40', code: py`assert module('prices').CATALOGUE.get('eggs') == 2.40, 'Add "eggs": 2.40 to CATALOGUE in prices.py'` },
          { name: 'the receipt shows 6 eggs', code: py`assert '6 x eggs' in output, 'Add ("eggs", 6) to the basket in main.py'` },
        ],
        explain: py`Data lives in one module and every other module reads it through \`prices.CATALOGUE\`, so a change in one place flows everywhere. \`receipt.py\` didn't change at all — that's the payoff of splitting code by responsibility.`,
      },
      {
        id: 'stale-name',
        task: py`At the end of **main.py**, add:

\`\`\`python
from prices import VAT_RATE
prices.VAT_RATE = 0.05
print("copied:", VAT_RATE, "| module:", prices.VAT_RATE)
\`\`\`

Predict the printed line before running.`,
        hint: py`\`from … import\` binds a *new name* in main.py to the object the module's name pointed to at that moment.`,
        tests: [{ name: 'prints "copied: 0.2 | module: 0.05"', code: py`assert 'copied: 0.2 | module: 0.05' in output, 'Add the three lines exactly as shown at the end of main.py'` }],
        explain: py`\`from prices import VAT_RATE\` made a separate name in main.py pointing at the float \`0.2\`. Re-binding \`prices.VAT_RATE\` moves only the module's name; your copy keeps pointing at \`0.2\`. This is why code that needs to see live changes should use \`prices.VAT_RATE\`, not a from-import.`,
      },
      {
        id: 'reload',
        task: py`At the end of **main.py**, add \`import importlib\` and then \`importlib.reload(prices)\`. How many banner lines do you expect now?`,
        hint: py`\`import importlib\` on one line, \`importlib.reload(prices)\` on the next.`,
        tests: [{ name: 'prices.py ran twice', code: py`assert output.count('prices.py runs top to bottom') == 2, 'Call importlib.reload(prices) once at the end of main.py'` }],
        explain: py`A normal \`import\` never re-runs a cached module, but \`importlib.reload()\` deliberately runs the file again **inside the same module object**. It's handy in an interactive session after editing a file; in real programs, restart instead (see the internals section for why reload can leave stale objects behind).`,
      },
      {
        id: 'new-module',
        task: py`Add a new file **discounts.py** (use the + button) with a function \`apply(total, percent)\` that returns \`total\` reduced by \`percent\` percent. Import it in main.py and print the basket total after 10% off.`,
        hint: py`\`def apply(total, percent): return total * (1 - percent / 100)\`. In main.py: \`import discounts\`, then sum the costs and call \`discounts.apply(total, 10)\`.`,
        tests: [
          { name: 'discounts.py exists', code: py`assert 'discounts.py' in files, 'Create a file named discounts.py'` },
          { name: 'apply(100, 10) == 90', code: py`assert module('discounts').apply(100, 10) == approx(90)` },
          { name: 'main.py imports discounts', code: py`assert 'import discounts' in files['main.py'] or 'from discounts import' in files['main.py']` },
        ],
        explain: py`You just made a module: a \`.py\` file in a folder on \`sys.path\`. No registration, no special syntax — the file name *is* the module name. Keep each module focused on one job, like this one.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'A simplified import, step by step',
    props: {
      code: py`modules = {}          # our stand-in for sys.modules


def prices_py(module):    # pretend this is the code in prices.py
    print("running prices.py")
    module["VAT_RATE"] = 0.2


FILES = {"prices": prices_py}   # pretend this is "searching sys.path"


def simple_import(name):
    if name in modules:          # 1. cached? reuse it
        return modules[name]
    module = {}                  # 2. a new, empty module
    modules[name] = module       # 3. cache it BEFORE running
    FILES[name](module)          # 4. run its code once
    return module


prices = simple_import("prices")
again = simple_import("prices")  # a cache hit: nothing runs
print(prices is again, prices["VAT_RATE"])
`,
      notes: {
        13: 'The cache is checked **first**. The first call misses; the second call returns straight away.',
        16: 'Real Python also stores the module in `sys.modules` before running it. That ordering is what makes circular imports *possible* — and confusing (see [packages](lesson:packages)).',
        17: 'Running the module fills its namespace. Here a dict stands in for the module object.',
        22: 'Second import: same name, cache hit, `running prices.py` is not printed again.',
      },
    },
    alt: 'A code trace of a simplified import function. The first call to simple_import misses the modules dict, creates an empty module dict, stores it in the cache, runs the fake prices code which prints a line and sets VAT_RATE, and returns it. The second call finds prices in the cache and returns the same dict, so the program prints True 0.2.',
    caption: py`**Simplified model.** The real import system uses module objects, finders and loaders (see *internals*), but the order of operations — check the cache, create, cache, run, return — is the real one.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A module object is mostly a **namespace**: a dict of the names its file defined. You can see it with \`vars(prices)\` (or \`prices.__dict__\`). \`prices.VAT_RATE\` is a lookup in that dict.`,
      py`The file runs top to bottom on first import, so **everything** at the top level happens then: function definitions are created, constants assigned — and any \`print()\` or slow work also happens, whether the importer wanted it or not. Keep top-level code to definitions and constants; put actions inside functions. The [\`__main__\` guard](lesson:main-guard-and-scripts) exists for exactly this reason.`,
      py`Every module also gets a few automatic names: \`__name__\` (its import name, like \`"prices"\`), \`__file__\` (where it came from), \`__doc__\` (its docstring). The file you *run* gets \`__name__ == "__main__"\` instead.`,
    ],
    technical: [
      py`**The import protocol.** For \`import prices\` Python calls \`importlib.__import__\`, which:`,
      py`1. returns \`sys.modules["prices"]\` if present (the cache);
2. otherwise asks each **finder** on \`sys.meta_path\` in turn for a *module spec* (a description of where and how to load the module). The standard finders handle built-in modules, frozen modules, and — via \`PathFinder\` — files found by walking \`sys.path\`;
3. the spec's **loader** creates the module object, which is inserted into \`sys.modules\`, and then the loader *executes* the module's code in the module's namespace;
4. if execution raises, the half-built module is removed from \`sys.modules\` and the exception propagates to the importer.`,
      py`**How \`sys.path\` is built** at start-up: first the *script's folder* for \`python main.py\` (the current directory for \`python -m module\`, and \`''\` meaning "current directory" for \`python -c\` and the REPL); then any folders in the \`PYTHONPATH\` environment variable; then the standard library; then *site-packages*, where pip installs third-party packages. Python 3.11+ can skip the first, potentially unsafe entry with \`python -P\` or \`PYTHONSAFEPATH=1\`.`,
      { code: py`import sys

for folder in sys.path:   # the exact list differs on every machine
    print(repr(folder))`, lang: 'python', title: 'see your own search path' },
      py`**\`from m import x\`** loads \`m\` exactly like \`import m\`, then does \`x = m.x\` in your namespace (falling back to importing a *submodule* \`m.x\` if \`m\` is a package). It's a one-time name copy, which is why later re-binding of \`m.x\` is invisible to you.`,
      py`**\`importlib.reload(m)\`** re-executes \`m\`'s source in the **same** module object, re-binding its names. Objects created before the reload — instances of old classes, functions captured by \`from m import f\` elsewhere — still refer to the *old* definitions. That's why reload is a REPL convenience, not a deployment strategy.`,
      { callout: 'note', title: 'CPython detail: __pycache__', text: py`CPython compiles each imported module to bytecode and caches it in a \`__pycache__/\` folder next to the source (e.g. \`prices.cpython-314.pyc\`). On the next run it reuses the cached bytecode if the source hasn't changed, so imports start faster. The file you run directly is not cached this way. \`__pycache__\` is safe to delete and should be in \`.gitignore\`. Other implementations (PyPy, etc.) use their own caching.` },
    ],
    production: [
      py`**Never fix imports by editing \`sys.path\`** (\`sys.path.append("../lib")\`). It depends on the folder you run from and breaks in tests and deployment. Instead give your project a proper layout and install it into a virtual environment (\`pip install -e .\`) so its packages are importable from anywhere — see [project structure](lesson:project-structure) and [packaging](lesson:packaging).`,
      py`**No side effects at import time.** Connecting to a database, reading big files or calling an API in module-level code makes every \`import\` slow and fragile — tests that merely import the module suddenly need a network. Do that work in functions called from \`main()\`, or create resources lazily on first use.`,
      py`**Import cost is real at scale.** Large applications can spend a noticeable share of start-up importing heavy libraries. Measure before optimising: CPython's \`python -X importtime main.py\` prints how long each import took. A common fix is to move a rarely-needed heavy import inside the function that uses it.`,
      py`**Module-level state is process-wide.** Because a module is loaded once, a module-level dict is effectively a global shared by everyone who imports it. That makes modules a simple way to share configuration — and a source of hidden coupling. Prefer passing values explicitly where you can.`,
    ],
  },
  mistakes: [
    {
      title: 'Naming your file after a standard-library module',
      wrong: { code: py`# saved as random.py — the same name as the stdlib module!
import random

print(random.choice(["Ada", "Ben", "Cy"]))`, lang: 'python', static: true },
      right: { code: py`# saved as pick_winner.py
import random

print(random.choice(["Ada", "Ben", "Cy"]))`, lang: 'python', static: true },
      explanation: py`The script's own folder comes **first** on \`sys.path\`, so \`import random\` finds *your* \`random.py\` instead of the standard library's — your file imports itself. You get \`AttributeError: partially initialized module 'random' has no attribute 'choice' (most likely due to a circular import)\`. Python 3.13+ adds a hint suggesting you rename the file. Avoid names like \`random.py\`, \`json.py\`, \`email.py\`, \`test.py\`, \`statistics.py\`.`,
    },
    {
      title: 'Expecting a from-import to see later changes',
      wrong: { code: py`# settings.py:  DEBUG = False
from settings import DEBUG
import settings

settings.DEBUG = True
print(DEBUG)   # still False — your name was copied at import time`, lang: 'python', static: true },
      right: { code: py`import settings

settings.DEBUG = True
print(settings.DEBUG)   # True — always looked up in the module`, lang: 'python', static: true },
      explanation: py`\`from m import x\` binds *your own* name \`x\` once. If the module later re-binds \`m.x\`, only \`m.x\` moves. Use \`module.name\` for values that can change at runtime (config, feature flags).`,
    },
    {
      title: 'Star imports that silently overwrite names',
      wrong: { code: py`from os import *

with open("notes.txt", "w") as f:   # TypeError: this open is os.open!
    f.write("hello")`, lang: 'python', static: true },
      right: { code: py`import os

with open("notes.txt", "w") as f:   # the built-in open
    f.write("hello")
print(os.path.getsize("notes.txt"))`, lang: 'python' },
      explanation: py`\`os\` exports a low-level \`open(path, flags)\` that returns a file *descriptor* (an int). The star import replaced the built-in \`open\` with it, so the \`with\` line fails with \`TypeError\`. Star imports make every name's origin a mystery.`,
    },
    {
      title: 'Doing real work at import time',
      wrong: { code: py`# report.py
import json

DATA = json.load(open("sales.json"))   # runs on import — even in tests
print("Report ready")`, lang: 'python', static: true },
      right: { code: py`# report.py
import json
from pathlib import Path


def load_sales(path):
    return json.loads(Path(path).read_text())`, lang: 'python' },
      explanation: py`Top-level code runs whenever anyone imports the module. Reading files, printing or calling APIs there makes importing slow, noisy and able to crash. Put actions in functions and call them from your entry point.`,
    },
    {
      title: 'Hacking sys.path to make an import work',
      wrong: { code: py`import sys
sys.path.append("../shared")   # works only from one particular folder
import helpers`, lang: 'python', static: true },
      right: { code: py`# Give the project a src/ layout and install it once:
#     python -m pip install -e .
# then, from anywhere:
from myproject import helpers`, lang: 'python', static: true },
      explanation: py`Relative paths in \`sys.path\` are resolved against the **current working directory**, which changes depending on how and where the program is started. Installing the project (or running with \`python -m\` from the project root) makes imports reliable. See [project structure](lesson:project-structure).`,
    },
  ],
  debugging: [
    {
      symptom: py`ModuleNotFoundError: No module named 'requests'`,
      cause: py`The package isn't installed **in the interpreter you are running**. Very often pip installed it into a different Python (another version, or outside your virtual environment).`,
      fix: py`Install with the same interpreter: \`python -m pip install requests\`. Check which Python runs with \`import sys; print(sys.executable)\`, and activate the right [virtual environment](lesson:virtual-environments).`,
    },
    {
      symptom: py`ModuleNotFoundError: No module named 'helpers'`,
      cause: py`\`helpers.py\` is not in any folder on \`sys.path\` — usually because the script was started from a different folder than you think, or the file lives in a sibling folder.`,
      fix: py`Print \`sys.path\` and check where \`helpers.py\` really is. Run scripts from the project root (\`python -m package.module\`), or install your project in editable mode rather than editing \`sys.path\`.`,
    },
    {
      symptom: py`ImportError: cannot import name 'price_with_tax' from 'prices' (/home/ada/shop/prices.py)`,
      cause: py`The module was found (the path in brackets shows which file!) but it has no such name: a typo, a renamed function, the wrong file with the same name, or a circular import.`,
      fix: py`Open the file shown in the brackets and check the name. Run \`print(dir(prices))\` to list what it actually defines. If the message says *partially initialized module*, see [circular imports](lesson:packages).`,
    },
    {
      symptom: py`AttributeError: partially initialized module 'random' has no attribute 'choice' (most likely due to a circular import)`,
      cause: py`Either your own file shadows a standard-library module (you have a \`random.py\`), or two of your modules import each other at the top.`,
      fix: py`Check \`random.__file__\` — if it points into your project, rename your file (and delete its \`__pycache__\`). For genuine circular imports, restructure as shown in [packages](lesson:packages).`,
    },
    {
      symptom: py`You edited a module in the REPL session, re-ran \`import prices\`, and nothing changed.`,
      cause: py`\`import\` returns the cached module from \`sys.modules\`; it doesn't re-read the file.`,
      fix: py`Call \`importlib.reload(prices)\`, or — more reliably — restart the interpreter.`,
    },
  ],
  bestPractices: [
    'Put all imports at the top of the file, grouped: standard library, third-party, your own modules — one module per import line.',
    'Prefer import module (or from package import module) so call sites show where names come from: json.loads, prices.VAT_RATE.',
    'Use from module import name for a few frequently used, well-known names (from pathlib import Path, from dataclasses import dataclass).',
    'Use conventional aliases only: import numpy as np, import pandas as pd. Don\'t invent cryptic ones.',
    'Never use from module import * in modules; it hides origins and can overwrite names.',
    'Keep module top-level code to imports, constants, functions and classes. No printing, network calls or heavy work at import time.',
    'Don\'t name your files after standard-library modules (random.py, json.py, test.py).',
    'Don\'t manipulate sys.path; give the project a proper layout and install it into a virtual environment.',
  ],
  useCases: [
    'Splitting a growing script into focused files: models, storage, formatting, main.',
    'Sharing helpers and constants between several scripts in one project.',
    'Using the standard library (json, csv, pathlib, datetime) and installed packages.',
    'Loading plugins by name at runtime with importlib.import_module.',
    'Holding process-wide configuration loaded once at start-up.',
  ],
  comparison: {
    title: 'import module vs from module import name',
    headers: ['', 'import prices', 'from prices import VAT_RATE'],
    rows: [
      ['what is loaded', 'the whole module, once', 'the whole module, once (same cost)'],
      ['name(s) bound in your file', 'prices', 'VAT_RATE'],
      ['how you use it', 'prices.VAT_RATE', 'VAT_RATE'],
      ['sees later re-binding of prices.VAT_RATE?', 'yes — looked up every time', 'no — your name was bound at import time'],
      ['reader can tell where a name came from', 'always (prefix)', 'only by scrolling to the imports'],
      ['risk of name clashes', 'none', 'possible (two modules both export total)'],
    ],
    note: py`Both are good Python. A common style: \`import\` modules for your own code and most of the standard library (\`json.loads\`), \`from … import\` for a few well-known names (\`from pathlib import Path\`).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'modules-and-imports-q1',
      type: 'mcq',
      prompt: py`\`main.py\` and \`report.py\` both start with \`import prices\`, and \`main.py\` imports \`report\`. How many times does the top-level code in \`prices.py\` run?`,
      options: [
        { text: 'Twice — once per import statement', why: 'Imports are cached: the second import finds "prices" in sys.modules and reuses it without running the file.' },
        'Once — the module is cached in sys.modules after the first import',
        { text: 'Zero times — import only reads function definitions', why: 'Import runs the whole file top to bottom; that is how the function definitions get created in the first place.' },
        { text: 'It depends on whether you use import or from … import', why: 'Every form of import loads the module through the same cache.' },
      ],
      answer: 1,
      explanation: py`The first import runs \`prices.py\` and stores the module in \`sys.modules\`. Every later import, from any file, gets the cached module object. Only \`importlib.reload()\` runs it again.`,
    },
    {
      id: 'modules-and-imports-q2',
      type: 'output',
      prompt: py`Two files. Running \`main.py\` prints two lines; what is the **last** line?

\`counter.py\`:
\`\`\`text
print("counter loaded")
count = 0
\`\`\``,
      code: py`# main.py
import counter
import counter
from counter import count

counter.count += 1
print(count, counter.count)`,
      answer: '0 1',
      accept: ['0 1'],
      explanation: py`"counter loaded" prints once (the second \`import counter\` hits the cache). \`from counter import count\` binds main's own name \`count\` to \`0\`. \`counter.count += 1\` re-binds only the module's name to \`1\`. So the last line is \`0 1\`.`,
    },
    {
      id: 'modules-and-imports-q3',
      type: 'bug',
      prompt: py`Running this file crashes with \`AttributeError: partially initialized module 'random' has no attribute 'choice'\`. Click the line that reveals the real cause.`,
      code: py`# file name: random.py
import random

players = ["Ada", "Ben", "Cy"]
winner = random.choice(players)
print("Winner:", winner)`,
      answerLine: 1,
      explanation: py`The file is called \`random.py\`. Its own folder is first on \`sys.path\`, so \`import random\` imports **this file** (half-finished, hence "partially initialized") instead of the standard library. Rename it, e.g. \`pick_winner.py\`.`,
    },
    {
      id: 'modules-and-imports-q4',
      type: 'fill',
      prompt: 'Complete the imports so the last line works and prints `3 4.0`.',
      code: py`import statistics ___ stats
from math ___ sqrt

print(stats.mean([2, 4]), sqrt(16))`,
      answer: [['as'], ['import']],
      explanation: py`\`import statistics as stats\` binds the alias \`stats\` to the module. \`from math import sqrt\` binds the function \`sqrt\` directly. \`statistics.mean([2, 4])\` is the int \`3\` and \`math.sqrt(16)\` is the float \`4.0\`.`,
    },
    {
      id: 'modules-and-imports-q5',
      type: 'mcq',
      prompt: py`You run \`python main.py\` from the folder \`/home/ada/shop\`. \`main.py\` says \`import helpers\`. Where does Python look **first**?`,
      options: [
        'In the folder that contains main.py',
        { text: 'In the standard library', why: 'The standard library comes after the script\'s folder on sys.path. That ordering is why a local random.py shadows the real one.' },
        { text: 'In site-packages, where pip installs things', why: 'site-packages is near the end of sys.path.' },
        { text: 'Everywhere at once; Python picks the newest file', why: 'The search is strictly in sys.path order and the first match wins.' },
      ],
      answer: 0,
      explanation: py`\`sys.path[0]\` is the script's own folder for \`python main.py\`. Then come \`PYTHONPATH\` entries, the standard library and site-packages. The first match wins.`,
    },
    {
      id: 'modules-and-imports-q6',
      type: 'mcq',
      prompt: py`Why is \`from module import *\` discouraged in real code? **Select all that apply.**`,
      options: [
        'Readers can no longer tell which module a name came from',
        'It can silently overwrite names you already had, even built-ins',
        'Linters and IDEs can no longer reliably detect undefined names',
        { text: 'It makes the program run noticeably slower', why: 'The module is loaded exactly the same way; binding a few extra names costs essentially nothing. The problems are about readability and correctness.' },
      ],
      answer: [0, 1, 2],
      explanation: py`Star imports cost readability and safety, not speed. \`from os import *\` even replaces the built-in \`open\` with \`os.open\`. Inside packages, \`__all__\` limits what a star import exports — see [packages](lesson:packages).`,
    },
    {
      id: 'modules-and-imports-q7',
      type: 'short',
      prompt: py`In your own words: why does code that reads \`prices.VAT_RATE\` see a change made with \`prices.VAT_RATE = 0.1\`, while code that did \`from prices import VAT_RATE\` doesn't?`,
      answer: py`\`prices.VAT_RATE\` looks the name up in the prices module's namespace every time, so it sees whatever the module's name currently points to. \`from prices import VAT_RATE\` created a separate name in the importing module, bound once (at import time) to the object 0.2. Re-binding the module's name doesn't move that separate name.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'temperature-module',
      title: 'Move the converters into a module',
      difficulty: 'beginner',
      prompt: py`The playground has two files. Finish **temperature.py** and use it from **main.py**:

1. In \`temperature.py\`, write \`c_to_f(celsius)\` returning \`celsius * 9 / 5 + 32\` and \`f_to_c(fahrenheit)\` returning \`(fahrenheit - 32) * 5 / 9\`.
2. In \`main.py\`, import the module with \`import temperature\` (or \`from temperature import …\`) and print exactly:

\`\`\`text
100°C = 212.0°F
32°F = 0.0°C
\`\`\``,
      files: {
        'main.py': py`# TODO: import the temperature module


print("100°C = ?°F")
print("32°F = ?°C")
`,
        'temperature.py': py`"""Temperature conversions."""


def c_to_f(celsius):
    # TODO: return the temperature in Fahrenheit
    return None


def f_to_c(fahrenheit):
    # TODO: return the temperature in Celsius
    return None
`,
      },
      hints: [
        'temperature.py is a module called temperature. A plain import temperature in main.py makes temperature.c_to_f available.',
        'Use the formulas in the prompt for the two functions, then print with f-strings: f"100°C = {temperature.c_to_f(100)}°F".',
        'temperature.py: return celsius * 9 / 5 + 32 and return (fahrenheit - 32) * 5 / 9. main.py: import temperature, then the two f-string prints.',
      ],
      solution: {
        explanation: py`\`temperature.py\` is a module simply because it's a \`.py\` file in the project folder, which is on \`sys.path\`. \`import temperature\` runs it once and binds the name \`temperature\`, so the call sites read \`temperature.c_to_f(100)\` — the prefix tells the reader exactly where the function lives. \`100 * 9 / 5 + 32\` is \`212.0\` (true division \`/\` always gives a float) and \`(32 - 32) * 5 / 9\` is \`0.0\`.`,
        files: {
          'main.py': py`import temperature

print(f"100°C = {temperature.c_to_f(100)}°F")
print(f"32°F = {temperature.f_to_c(32)}°C")
`,
          'temperature.py': py`"""Temperature conversions."""


def c_to_f(celsius):
    return celsius * 9 / 5 + 32


def f_to_c(fahrenheit):
    return (fahrenheit - 32) * 5 / 9
`,
        },
      },
      tests: [
        { name: 'c_to_f(100) == 212', code: py`assert module('temperature').c_to_f(100) == approx(212)` },
        { name: 'f_to_c(32) == 0 and f_to_c(212) == 100', code: py`t = module('temperature')
assert t.f_to_c(32) == approx(0) and t.f_to_c(212) == approx(100)` },
        { name: 'main.py imports the module', code: py`src = files['main.py']
assert 'import temperature' in src or 'from temperature import' in src, 'Import the temperature module in main.py'` },
        { name: 'prints both conversions', code: py`assert '100°C = 212.0°F' in output and '32°F = 0.0°C' in output` },
      ],
    },
    {
      id: 'plugin-loader',
      title: 'Load a formatter plugin by name',
      difficulty: 'intermediate',
      prompt: py`The project has two "plugin" modules, \`fmt_plain.py\` and \`fmt_fancy.py\`, each defining \`format_price(amount)\`. In **main.py**, write \`load_formatter(style)\`:

- import the module named \`"fmt_" + style\` **with \`importlib.import_module\`** (don't hard-code the two plugins) and return its \`format_price\` function;
- if no module with that name exists, raise \`ValueError(f"unknown style: {style}")\`;
- but if the plugin module *exists* and itself fails with \`ModuleNotFoundError\` because **it** imports something missing, let that error propagate unchanged — hiding it would send someone debugging the wrong problem.

\`load_formatter("plain")(1234.5)\` returns \`"1234.50"\` and \`load_formatter("fancy")(3)\` returns \`"*** £3.00 ***"\`.`,
      files: {
        'main.py': py`import importlib


def load_formatter(style):
    """Import the module fmt_<style> and return its format_price function."""
    # TODO: build the module name, import it with importlib, return the function
    return None


for style in ["plain", "fancy"]:
    formatter = load_formatter(style)
    if formatter is not None:
        print(style, "->", formatter(1234.5))
`,
        'fmt_plain.py': FMT_PLAIN,
        'fmt_fancy.py': FMT_FANCY,
      },
      hints: [
        'importlib.import_module("fmt_plain") returns the module object, exactly like import fmt_plain would bind it.',
        'Wrap the import in try/except ModuleNotFoundError as err. The exception has a .name attribute: the name of the module that could not be found.',
        'If err.name == module_name, raise ValueError(f"unknown style: {style}") from None; otherwise re-raise with a bare raise. Return module.format_price at the end.',
      ],
      solution: {
        explanation: py`\`importlib.import_module(name)\` is the function form of \`import\`: same search, same \`sys.modules\` cache, but the name is a runtime string, so new plugins work without touching \`load_formatter\`. \`ModuleNotFoundError\` is raised both when the plugin is missing *and* when something the plugin imports is missing; \`err.name\` tells you which module wasn't found, so we only translate the first case into a friendly \`ValueError\` and re-raise the second. \`from None\` hides the noisy original traceback for the expected case.`,
        files: {
          'main.py': py`import importlib


def load_formatter(style):
    """Import the module fmt_<style> and return its format_price function."""
    module_name = f"fmt_{style}"
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as err:
        if err.name != module_name:   # the plugin exists but a dependency is missing
            raise
        raise ValueError(f"unknown style: {style}") from None
    return module.format_price


for style in ["plain", "fancy"]:
    formatter = load_formatter(style)
    if formatter is not None:
        print(style, "->", formatter(1234.5))
`,
          'fmt_plain.py': FMT_PLAIN,
          'fmt_fancy.py': FMT_FANCY,
        },
      },
      tests: [
        { name: 'plain formatter works', code: py`f = load_formatter("plain")
assert callable(f), 'load_formatter must return a function'
assert f(1234.5) == "1234.50"` },
        { name: 'fancy formatter works', code: py`assert load_formatter("fancy")(3) == "*** £3.00 ***"` },
        { name: 'unknown style raises ValueError', code: py`with raises(ValueError, match="unknown style: gothic"):
    load_formatter("gothic")` },
        { name: 'uses importlib.import_module', code: py`assert 'import_module' in files['main.py'], 'Use importlib.import_module so new plugins work without code changes'` },
        { name: 'a broken plugin is not reported as unknown', code: py`import importlib
with open("fmt_broken.py", "w") as fh:
    fh.write("import missing_dependency_xyz\n\ndef format_price(amount):\n    return str(amount)\n")
importlib.invalidate_caches()
with raises(ModuleNotFoundError, match="missing_dependency_xyz"):
    load_formatter("broken")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'modules-and-imports-import-vs-from',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between `import json` and `from json import loads`? Is one faster?',
      answer: 'Both load and cache the whole json module the same way. import json binds the name json to the module (you call json.loads); from json import loads binds only loads in your namespace. Neither is meaningfully faster; the difference is naming and readability.',
      explanation: py`The loading step is identical — the module goes into \`sys.modules\` once. The forms differ in which name is bound locally. \`from\`-imports are a one-time copy of a name, so they don't see later re-binding of the module attribute; \`module.attr\` lookups always do.`,
      whyAsked: 'Checks that you understand imports bind names and that the module is always loaded in full — a common misconception is that from-imports load "only part" of a module.',
      mistakes: ['Saying from json import loads only loads that one function', 'Claiming one form is significantly faster', 'Not mentioning the stale-name effect of from-imports'],
      followUps: ['What happens if the module later re-binds loads?', 'When would you prefer from … import?', 'Why is from json import * discouraged?'],
      modelAnswer: 'Both statements load the json module in exactly the same way: Python finds it, runs it once and caches it in sys.modules. The difference is only which name gets bound in my file — import json binds the module, so I write json.loads, while from json import loads binds the function itself. I default to importing modules because the prefix shows where a name comes from, and I use from-imports for a few well-known names like Path or dataclass. One subtle difference is that a from-import is a one-time copy of the name, so if the module later rebinds that attribute I would not see it.',
    },
    {
      id: 'modules-and-imports-reload-output',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What does this program print, and why?',
      code: { lang: 'python', code: py`# config.py
#     print("loading config")
#     settings = {"debug": False}

# main.py
import importlib

import config
from config import settings

config.settings["debug"] = True
importlib.reload(config)
print(settings, config.settings)` },
      options: [
        "loading config, then {'debug': True} {'debug': True}",
        "loading config (twice), then {'debug': True} {'debug': False}",
        "loading config (twice), then {'debug': False} {'debug': False}",
        "loading config, then {'debug': False} {'debug': True}",
      ],
      correctOption: 1,
      answer: '"loading config" twice, then `{\'debug\': True} {\'debug\': False}`. reload re-runs config.py, which binds config.settings to a brand-new dict; the from-imported name settings still points at the old dict, which was mutated to True.',
      explanation: py`The first import runs config.py (first "loading config"). \`settings\` in main is bound to the same dict as \`config.settings\`, and that dict is mutated to \`{'debug': True}\`. \`importlib.reload\` executes config.py again inside the same module object — second "loading config" — which re-binds \`config.settings\` to a **new** dict \`{'debug': False}\`. main's \`settings\` still refers to the old, mutated dict.`,
      whyAsked: 'Separates people who understand modules as namespaces of bindings from people who think of reload as "refresh everything". It also tests mutation vs re-binding.',
      mistakes: ['Thinking reload updates names that other modules copied with from-imports', 'Thinking reload does not re-run module-level code', 'Mixing up mutating the dict with re-binding the name'],
      followUps: ['Why is reload dangerous for classes with existing instances?', 'How would you design config so callers always see the current value?'],
      modelAnswer: 'It prints "loading config" twice and then {\'debug\': True} {\'debug\': False}. The first import runs the module and main\'s from-import binds settings to the same dict, which we then mutate to debug True. reload re-executes config.py inside the existing module object, and that creates a brand-new dict and rebinds config.settings to it. But main\'s settings name was bound once at import time, so it still points at the old, mutated dict. That is the general rule: reload rebinds names inside the module, it never chases references other code already holds — which is why I restart processes instead of relying on reload.',
    },
    {
      id: 'modules-and-imports-pip-installed-not-found',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate ran `pip install requests`, it said "Successfully installed", but `python app.py` still fails with `ModuleNotFoundError: No module named \'requests\'`. How do you debug it?',
      answer: 'The pip command and the python command belong to different interpreters. Check sys.executable inside the program, install with that exact interpreter via python -m pip install requests, and use a virtual environment so "python" and "pip" always match. Also rule out a local file named requests.py shadowing it.',
      explanation: py`\`pip\` on the PATH can belong to one Python while \`python\` points at another (a different version, the system Python, or a venv that isn't activated). Packages are installed per interpreter, into that interpreter's *site-packages*. \`python -m pip\` guarantees the same interpreter. Printing \`sys.executable\` and \`sys.path\` shows where Python is actually looking.`,
      code: { lang: 'bash', code: py`python -c "import sys; print(sys.executable)"   # which Python runs your code?
python -m pip --version                          # which Python does this pip belong to?
python -m pip install requests                   # install into THAT interpreter` },
      whyAsked: 'This is one of the most common real-world Python problems; the answer shows whether you understand that packages belong to a specific interpreter.',
      mistakes: ['Reinstalling repeatedly with plain pip', 'Using sudo pip install', 'Appending site-packages paths to sys.path by hand'],
      followUps: ['What is a virtual environment and how does it prevent this?', 'How does sys.path get its site-packages entry?'],
      modelAnswer: 'My first suspicion is that pip and python are two different interpreters — packages are installed per interpreter, into its own site-packages. I would print sys.executable from the failing program and compare it with python -m pip --version. Then I install using exactly that interpreter with python -m pip install requests, ideally inside an activated virtual environment so the mismatch cannot happen again. I would also check there is no local requests.py shadowing the real package. I would not fix it by editing sys.path, because that just hides the mismatch.',
    },
    {
      id: 'modules-and-imports-import-steps',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Walk me through what happens, step by step, when Python executes `import inventory` for the first time.',
      answer: 'Python checks sys.modules; on a miss it asks the finders on sys.meta_path for a spec, and the path-based finder searches the entries of sys.path in order. The spec\'s loader creates a module object, inserts it into sys.modules, executes the module\'s code in its namespace, and finally the name inventory is bound in the importing namespace. If execution fails, the entry is removed from sys.modules.',
      explanation: py`Key details: the cache check comes first (so imports are cheap after the first); the module is placed in \`sys.modules\` *before* its code runs (that's what lets circular imports see a "partially initialized" module); \`sys.path\` order makes the first match win (shadowing). CPython additionally caches compiled bytecode in \`__pycache__\`. Packages add a step: \`import a.b\` imports \`a\` first and then searches \`a.__path__\` for \`b\`.`,
      whyAsked: 'Shows depth: understanding the import machinery explains shadowing, circular imports, plugin loading and why sys.path hacks are fragile.',
      mistakes: ['Forgetting the sys.modules cache check', 'Thinking the module is cached only after it finishes executing', 'Not knowing where sys.path comes from'],
      followUps: ['How is sys.path initialised?', 'What is __pycache__ and is it a language feature?', 'How does importing a submodule differ?'],
      modelAnswer: 'First Python looks in sys.modules, the cache of already-imported modules; if inventory is there it is reused immediately. Otherwise it asks each finder on sys.meta_path for a module spec — for normal files the path-based finder walks sys.path in order, starting with the script\'s folder, and the first match wins. The spec\'s loader then creates an empty module object, puts it into sys.modules, and executes the file\'s code inside the module\'s namespace. Finally the name inventory is bound in the importing module. Because the module is cached before its code runs, a circular import sees a half-initialised module, and if execution raises, the entry is removed again.',
    },
    {
      id: 'modules-and-imports-public-names',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `public_names(mod)` that returns the list of names `from mod import *` would bind: the module\'s `__all__` (as a list, in order) if it defines one, otherwise every name in the module\'s namespace that does not start with an underscore, sorted.',
      answer: 'if hasattr(mod, "__all__"): return list(mod.__all__); otherwise return sorted(name for name in vars(mod) if not name.startswith("_")).',
      explanation: py`The language reference defines star-import exactly this way: if the module defines \`__all__\`, those names are imported; otherwise all names not beginning with an underscore. Note that without \`__all__\` that includes modules the file imported (\`math\` below) — one more reason packages define \`__all__\`.`,
      starter: { files: {
        'main.py': py`import tools
import tools_all


def public_names(mod):
    """The names 'from mod import *' would bind."""
    # TODO: respect __all__ when the module defines it
    return []


print(public_names(tools))
print(public_names(tools_all))
`,
        'tools.py': TOOLS,
        'tools_all.py': TOOLS_ALL,
      } },
      tests: [
        { name: 'without __all__: public names, sorted', code: py`assert public_names(module('tools')) == ['RATE', 'area', 'math']` },
        { name: 'with __all__: exactly __all__', code: py`assert public_names(module('tools_all')) == ['area']` },
        { name: 'returns a list', code: py`assert isinstance(public_names(module('tools_all')), list)` },
        { name: 'matches what a real star import binds', code: py`real = {}
exec("from tools import *", real)
assert sorted(k for k in real if k != "__builtins__") == public_names(module('tools'))` },
      ],
      solution: { files: {
        'main.py': py`import tools
import tools_all


def public_names(mod):
    """The names 'from mod import *' would bind."""
    if hasattr(mod, "__all__"):
        return list(mod.__all__)
    return sorted(name for name in vars(mod) if not name.startswith("_"))


print(public_names(tools))
print(public_names(tools_all))
`,
        'tools.py': TOOLS,
        'tools_all.py': TOOLS_ALL,
      } },
      hints: ['vars(mod) returns the module\'s namespace dict.', 'Check for __all__ first with hasattr(mod, "__all__").', 'Dunder names like __name__ and __doc__ start with an underscore, so the same filter removes them.'],
      whyAsked: 'Tests precise knowledge of module namespaces, the underscore convention and __all__, plus comfort treating modules as ordinary objects.',
      mistakes: ['Forgetting that imported modules (math) are also exported without __all__', 'Returning dir(mod) unfiltered', 'Sorting __all__ instead of keeping its order'],
      followUps: ['Does __all__ stop someone doing from tools_all import perimeter?', 'Why do packages usually define __all__ in __init__.py?'],
      modelAnswer: 'A module is just an object with a namespace, so I can inspect it with vars. If the module defines __all__, star-import uses exactly those names, so I return list(mod.__all__). Otherwise the rule is every name that does not start with an underscore, which also filters out dunders like __name__ and __doc__. A subtle point is that without __all__, names the module itself imported — like math — get re-exported too, which is one reason libraries define __all__. Note that __all__ only affects star-imports; an explicit from-import of another name still works.',
    },
    {
      id: 'modules-and-imports-import-side-effects',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your test suite got slow and now fails on the CI server, which has no network. The cause: `import pricing` in a test. What is probably wrong with `pricing.py`, and how would you fix it?',
      answer: 'pricing.py does work at import time — e.g. fetches exchange rates over the network in module-level code. Importing runs all top-level code, so every importer pays for it. Move the work into a function (or a lazily-initialised cache) called from the entry point, and inject or fake the rates in tests.',
      explanation: py`Module-level code runs on first import, unconditionally. Network calls, database connections, reading big files or heavy computation at the top level make the module expensive and fragile to import — including for tests, linters and documentation tools. Keep import-time code to definitions and constants; acquire resources in functions, behind the [\`__main__\` guard](lesson:main-guard-and-scripts), or lazily on first use (e.g. a function with \`functools.cache\`).`,
      code: { lang: 'python', code: py`# Before: RATES = fetch_rates_from_api()   <- runs on import

import functools


@functools.cache
def get_rates():
    """Fetched on first call, then cached for the life of the process."""
    return {"GBP": 1.0, "EUR": 1.17}   # imagine: return fetch_rates_from_api()


def convert(amount, currency):
    return amount * get_rates()[currency]


print(convert(10, "EUR"))` },
      whyAsked: 'Import-time side effects are a classic source of slow start-up, flaky tests and circular-import pain in real codebases.',
      mistakes: ['Blaming the test framework', 'Mocking the network but leaving the import-time call in place', 'Adding try/except around the import instead of removing the side effect'],
      followUps: ['How would you measure which imports are slow?', 'How does this relate to the if __name__ == "__main__" guard?'],
      modelAnswer: 'Importing a module runs all of its top-level code, so I would bet pricing.py fetches something — exchange rates, say — at module level. That means every importer, including tests that never call the function, waits on the network and fails without it. I would move that work into a function, possibly cached with functools.cache so it still happens only once, and call it from the application\'s entry point. In tests I would pass in or patch the rates. As a rule, module level should contain only imports, constants, functions and classes.',
    },
  ],

  takeaways: [
    'A module is a .py file; its top-level names become attributes of a module object.',
    'import finds the module on sys.path (first match wins), runs it once, caches it in sys.modules, then binds a name.',
    'All import forms load the whole module; they only differ in which names they bind in your namespace.',
    'from module import name copies the name once — later re-binding inside the module is not seen; module.name always is.',
    'Avoid from module import * and never name your files after standard-library modules.',
    'Keep import-time code free of side effects; don\'t hack sys.path — install your project instead.',
    'importlib.import_module loads by runtime name; importlib.reload re-runs a module but leaves old references stale.',
  ],
}
