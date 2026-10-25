// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WORDCOUNT = py`"""Count words. Works as a module AND as a script."""
import sys

print(f"[wordcount.py runs, __name__ = {__name__!r}]")


def count_words(text):
    return len(text.split())


def main(argv=None):
    """Script entry point. Returns an exit code: 0 means success."""
    args = sys.argv[1:] if argv is None else argv
    if not args:
        print("usage: python -m wordcount WORD...", file=sys.stderr)
        return 2
    print(f"{count_words(' '.join(args))} words")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`

const MAIN = py`"""Use wordcount two ways: as a library, and as if run from a terminal."""
import runpy
import sys

import wordcount                    # imported: its __name__ is "wordcount"

print("as a library:", wordcount.count_words("the quick brown fox"), "words")

print("--- simulating: python -m wordcount to be or not to be ---")
sys.argv = ["wordcount", "to", "be", "or", "not", "to", "be"]
try:
    runpy.run_module("wordcount", run_name="__main__")
except SystemExit as exit_info:
    print("exit code:", exit_info.code)
`

const GRADES_MAIN = py`from grades import average

print("Team average:", average({"Dee": 70, "Eli": 90}))
`

const TEMPCONV_MAIN = py`import tempconv

# What the shell would do for:  python -m tempconv 100 37
status = tempconv.main(["100", "37"])
print("exit status:", status)
`

const RUN_MAIN_START = py`import sys


def run_main(main, argv):
    """Call main(argv) like the shell would: return the process exit status."""
    # TODO: handle a normal return and SystemExit the way sys.exit(main()) does
    return main(argv)


def ok(argv):
    print("hello", *argv)
    return 0


print(run_main(ok, ["Ada"]))
`

export default {
  id: 'main-guard-and-scripts',
  title: 'Scripts vs modules: if __name__ == "__main__"',
  summary: 'Every module knows its own name; the __main__ guard lets one file be both an importable module and a runnable script.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['modules-and-imports', 'packages'],
  related: ['command-line-programs', 'project-structure', 'packaging', 'multiprocessing', 'testing-fundamentals', 'defining-functions'],
  tags: ['__name__', '__main__', 'main guard', 'if __name__ == "__main__"', 'main()', 'scripts', 'python -m', 'runpy', '__main__.py', 'entry point', 'sys.exit', 'exit code', 'sys.argv', 'multiprocessing', 'spawn'],
  apis: [
    { name: '__name__', summary: 'A module\'s name: its import name, or "__main__" for the module Python was asked to run.' },
    { name: 'if __name__ == "__main__":', summary: 'Runs the indented block only when the file is executed as the program, not when it is imported.' },
    { name: 'def main(argv=None) -> int', summary: 'Conventional entry-point function: does the script\'s work and returns an exit status.' },
    { name: 'sys.exit(status)', summary: 'Raises SystemExit; None or 0 means success, a non-zero int means failure, a string is printed to stderr with status 1.' },
    { name: 'python -m package.module', summary: 'Find a module with the import system and run it as __main__ (relative imports work).' },
    { name: '__main__.py', summary: 'The file python -m package runs when given a package name.' },
    { name: 'runpy.run_module(name, run_name="__main__")', summary: 'Run a module\'s code the way python -m does, from Python code.' },
  ],
  docs: [
    { label: '__main__ — Top-level code environment', url: 'https://docs.python.org/3/library/__main__.html' },
    { label: 'Command line: the -m option', url: 'https://docs.python.org/3/using/cmdline.html#cmdoption-m' },
    { label: 'runpy — Locating and executing Python modules', url: 'https://docs.python.org/3/library/runpy.html' },
    { label: 'multiprocessing — safe importing of the main module', url: 'https://docs.python.org/3/library/multiprocessing.html#multiprocessing-programming' },
    { label: 'sys.exit', url: 'https://docs.python.org/3/library/sys.html#sys.exit' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every module has a built-in variable called \`__name__\`. Python sets it for you:`,
    py`- when a file is **imported**, \`__name__\` is its module name: \`"wordcount"\`, \`"shop.cart"\`;
- when a file is **run as the program** (\`python wordcount.py\`, \`python -m wordcount\`, or the IDE's Run button), \`__name__\` is the special string \`"__main__"\`.`,
    py`That one fact powers the most famous line in Python:`,
    { code: py`def main():
    print("doing the script's work")


if __name__ == "__main__":
    main()`, lang: 'python', title: 'the __main__ guard' },
    py`It reads: *"only if this file is the program being run, call \`main()\`"*. When someone imports the file instead — another module, a test, a worker process — the functions get defined but nothing runs. One file, two jobs: a **reusable module** and a **runnable script**.`,
  ],
  why: [
    py`Without the guard, importing a file runs **all** of its top-level code (see [modules & imports](lesson:modules-and-imports)). If that code prints a report, asks for \`input()\`, deletes files or starts a server, every import does it too.`,
    py`**Tests import your code.** A test that does \`from grades import average\` should get the function — not a printed report and a prompt waiting for keyboard input. The guard keeps import side-effect free.`,
    py`**Other programs reuse your code.** A script that converts temperatures today is a library function for somebody's web app tomorrow.`,
    py`**Multiprocessing re-imports your main module.** With the *spawn* and *forkserver* start methods, each worker process imports your main file to find your functions. Without a guard, every worker would run the script again — including the line that starts more workers.`,
  ],
  eli15: [
    py`Imagine a party. Everyone wears a name tag with their own name — except the **host**, whose tag just says "HOST".`,
    py`The invitation card says: *"If you are the host: open the door and start the music."* Every guest reads the same card, but only the person whose tag says HOST actually does it.`,
    py`A Python file is that card. When you run the file, Python sticks the tag \`"__main__"\` on it — it's the host. When another file imports it, it's a guest with its normal name. \`if __name__ == "__main__":\` is the "if you are the host" line: the music only starts once, and only for the host.`,
  ],
  analogy: {
    title: 'A cookbook with a "cook tonight" page',
    body: [
      py`Your cookbook holds recipes (functions) and, on the last page, a note: *"Cook the lasagne now."* When you're the cook tonight, you follow that note. But when a friend borrows the book just to copy the sauce recipe, they don't want the oven turning on in their kitchen.`,
      py`The guard writes the note as: *"If you're the one cooking tonight, cook the lasagne."* Borrowers (importers) get the recipes; only the cook (\`__main__\`) runs the dinner.`,
    ],
    mapping: [
      ['the cookbook', 'a .py file (module)'],
      ['the recipes', 'functions and classes — defined on import, used by anyone'],
      ['"cook the lasagne now"', 'script code: main()'],
      ['the person cooking tonight', 'the file run as the program: __name__ == "__main__"'],
      ['a friend borrowing the book', 'another module importing it: __name__ == "wordcount"'],
      ['"if you\'re cooking tonight…"', 'if __name__ == "__main__":'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch __name__ and the guard',
    props: {
      code: py`def count_words(text):
    return len(text.split())


def main():
    sentence = "to be or not to be"
    print(count_words(sentence), "words")
    return 0


print("__name__ is", repr(__name__))

if __name__ == "__main__":
    status = main()
    print("exit status would be", status)
`,
      notes: {
        1: 'The two `def` statements only **create** functions — nothing inside them runs yet.',
        11: 'This file is the program being run, so Python set `__name__` to `"__main__"`.',
        13: 'The guard is an ordinary `if`. Because this file was run directly, the condition is `True`.',
        14: '`main()` is a normal function call: a new frame appears with its own local variables.',
      },
    },
    alt: 'A step-by-step trace. The two function definitions are created without running. The program prints __name__ is \'__main__\', the if __name__ == "__main__" condition is true, main() is called, prints 6 words and returns 0, and the program prints exit status would be 0.',
    caption: py`Here the file *is* the program, so the guard is \`True\`. If another file imported it, \`__name__\` would be the module's name and lines 14–15 would be skipped.`,
  },
  syntax: [
    py`#### The standard shape of a script`,
    { code: py`"""wordcount: count the words given on the command line."""
import sys


def count_words(text):          # reusable logic: importable and testable
    return len(text.split())


def main(argv=None):            # the script's job, as a function
    args = sys.argv[1:] if argv is None else argv
    if not args:
        print("usage: python -m wordcount WORD...", file=sys.stderr)
        return 2                # non-zero exit status = failure
    print(count_words(" ".join(args)), "words")
    return 0                    # 0 = success


if __name__ == "__main__":      # only when run as the program
    sys.exit(main())`, lang: 'python', title: 'wordcount.py' },
    py`- **Imports, constants, functions, classes** at the top level — things that are safe to run on import.
- **\`main()\`** holds the script's actual work. Taking an optional \`argv\` list makes it easy to call from tests: \`main(["to", "be"])\`.
- **The guard** is a one-liner that calls \`main()\`. \`sys.exit(main())\` turns \`main\`'s return value into the process's **exit status**, which shells, CI systems and other programs check (\`0\` = success).`,
    { callout: 'tip', title: 'sys.exit vs raise SystemExit', text: py`\`sys.exit(code)\` just raises \`SystemExit(code)\`. Both \`sys.exit(main())\` and \`raise SystemExit(main())\` are common. \`None\` and \`0\` mean success; another int is the status; any other object (e.g. a string) is printed to stderr and the status is \`1\`.` },
    py`#### Ways to run Python code as \`__main__\``,
    { code: py`python wordcount.py to be or not      # run a file by path
python -m wordcount to be or not      # find a module by import name, run it
python -m shop.report                 # a module inside a package (relative imports work)
python -m shop                        # a package: runs shop/__main__.py
python -m json.tool data.json         # works for the standard library too
python -m pip install requests        # ...and for installed tools`, lang: 'bash', title: 'running scripts' },
    py`\`python -m\` uses the **import system** to find the module, so the name is dotted (\`shop.report\`, no \`.py\`), parent packages are imported first and relative imports work. It also puts the **current directory** at the front of \`sys.path\`, so run it from your project's root folder.`,
    py`#### \`__main__.py\`: making a package runnable`,
    { code: py`shop/
    __init__.py
    __main__.py      <- python -m shop runs this file
    report.py`, lang: 'text' },
    { code: py`# shop/__main__.py
from shop.report import main

raise SystemExit(main())`, lang: 'python', title: 'shop/__main__.py', static: true },
    py`Inside \`__main__.py\` the guard is optional (the file only ever runs as the program), but many projects keep it out of habit — it does no harm.`,
    { callout: 'warn', title: 'The guard compares a string', text: py`\`if __name__ == "__main__":\` — double underscores on both sides, and the right-hand side is in **quotes**. \`if __name__ == "main":\` is silently never true; \`if __name__ == __main__:\` raises \`NameError\`.` },
  ],
  walkthrough: {
    title: 'Reading the playground\'s main.py',
    lang: 'python',
    code: MAIN,
    intro: py`The playground has two files: \`wordcount.py\` (the script-and-module) and this \`main.py\`, which uses it both ways. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [5], text: py`A normal import. \`wordcount.py\` runs top to bottom with \`__name__ == "wordcount"\` — its banner shows that — so its guard is \`False\` and \`main()\` is **not** called.` },
      { lines: [7], text: py`Library use: we call \`count_words\` directly. No usage message, no exit — just a function.` },
      { lines: [10], text: py`A terminal command arrives as \`sys.argv\`: the program name followed by every word typed after it. Here we fake what \`python -m wordcount to be or not to be\` would put there.` },
      { lines: [11, 12], text: py`\`runpy.run_module(..., run_name="__main__")\` is what \`python -m\` uses under the hood: it runs the module's code **again, in a fresh namespace**, with \`__name__\` set to \`"__main__"\`. This time the banner says \`'__main__'\` and the guard is \`True\`.` },
      { lines: [13, 14], text: py`\`main()\` returned \`0\` and \`sys.exit(0)\` raised \`SystemExit(0)\`. A real terminal would end the process with status 0; we catch it to print the code.` },
    ],
  },
  playground: {
    title: 'One file, two jobs',
    objective: 'See wordcount.py imported (guard off) and run as __main__ (guard on). Then change the arguments, add a library function, and finally remove the guard to see why it exists.',
    files: { 'main.py': MAIN, 'wordcount.py': WORDCOUNT },
    expected: py`\`\`\`text
[wordcount.py runs, __name__ = 'wordcount']
as a library: 4 words
--- simulating: python -m wordcount to be or not to be ---
[wordcount.py runs, __name__ = '__main__']
6 words
exit code: 0
\`\`\`

The module's code ran **twice**: once when imported (name \`'wordcount'\`, guard off) and once when run as the program (name \`'__main__'\`, guard on). The sandbox can't open a real terminal, so \`runpy\` performs exactly what \`python -m wordcount …\` would do.`,
    experiments: [
      {
        id: 'no-arguments',
        task: py`Simulate running the script with **no words**: change the \`sys.argv\` line so it holds only the program name. What exit code do you get, and where did the usage message go?`,
        hint: py`\`sys.argv = ["wordcount"]\` — then \`args\` is an empty list inside \`main()\`.`,
        tests: [{ name: 'prints exit code 2', code: py`assert 'exit code: 2' in output` }],
        explain: py`With no arguments \`main()\` prints the usage line to **stderr** (the error stream — shown in red, separate from normal output) and returns \`2\`, the conventional status for "you used the command wrong". Scripts and CI pipelines check that number to know whether a command failed.`,
      },
      {
        id: 'library-function',
        task: py`Add a function \`longest_word(text)\` to **wordcount.py** that returns the longest word (the first one on ties). Call it from main.py as a library: \`print("longest:", wordcount.longest_word("a quick brown fox"))\`.`,
        hint: py`\`max(text.split(), key=len)\` returns the first longest word.`,
        tests: [
          { name: 'longest_word works', code: py`assert module('wordcount').longest_word("a bbb cc ddd") == "bbb"` },
          { name: 'main.py prints the longest word', code: py`assert 'longest: quick' in output` },
        ],
        explain: py`Because the script part lives behind the guard, \`wordcount.py\` is a perfectly good library: new functions are importable immediately, without triggering \`main()\`.`,
      },
      {
        id: 'show-name',
        task: py`At the end of **main.py**, add \`print("main.py's __name__:", __name__)\`. Predict the value first.`,
        tests: [{ name: "prints main.py's __name__", code: py`assert "main.py's __name__: __main__" in output` }],
        explain: py`The file you ask Python to run is always \`__main__\` — whatever its file name. That's why the guard works no matter what you call your script.`,
      },
      {
        id: 'remove-guard',
        task: py`Now break it on purpose: in **wordcount.py**, delete the line \`if __name__ == "__main__":\` and un-indent \`sys.exit(main())\`. Run main.py. What happened to "as a library"? (Press **Reset** afterwards.)`,
        hint: py`The last line of wordcount.py should be just \`sys.exit(main())\`, with no indentation.`,
        tests: [{ name: 'the import alone ended the program', code: py`assert '[wordcount.py runs' in output and 'as a library' not in output, 'Remove the guard so sys.exit(main()) runs on import'` }],
        explain: py`Without the guard, \`import wordcount\` ran \`main()\` at import time. \`sys.argv\` held only \`main.py\`, so \`main()\` printed the usage message and \`sys.exit(2)\` **ended the whole program** before main.py reached its next line. That's what the guard prevents: importing must never "run the script".`,
      },
    ],
    variants: [
      {
        id: 'package-main',
        label: 'Package with __main__.py',
        files: {
          'main.py': py`"""Simulate: python -m counter hello world"""
import runpy
import sys

sys.argv = ["counter", "hello", "world"]
try:
    runpy.run_module("counter", run_name="__main__")   # runs counter/__main__.py
except SystemExit as exit_info:
    print("exit code:", exit_info.code)
`,
          'counter/__init__.py': py`"""counter: count letters in words."""
`,
          'counter/core.py': py`def letter_count(words):
    return sum(len(word) for word in words)
`,
          'counter/__main__.py': py`"""Entry point for: python -m counter WORD..."""
import sys

from .core import letter_count   # relative imports work under python -m

print(f"[counter/__main__.py, __name__ = {__name__!r}, __package__ = {__package__!r}]")


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    print(letter_count(args), "letters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,
        },
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Same file, two ways in',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'run', label: 'python -m wordcount', note: 'run as the program', x: 110, y: 70, tone: 'yellow' },
        { id: 'imp', label: 'import wordcount', note: 'from another module', x: 110, y: 250, tone: 'yellow' },
        { id: 'file', label: 'wordcount.py', note: 'top-level code runs', x: 340, y: 160, tone: 'kraft' },
        { id: 'main', label: '__name__ = "__main__"', note: 'guard: True → main()', x: 600, y: 70, tone: 'blue' },
        { id: 'mod', label: '__name__ = "wordcount"', note: 'guard: False → just definitions', x: 600, y: 250 },
      ],
      edges: [
        { from: 'run', to: 'file', label: 'executes' },
        { from: 'imp', to: 'file', label: 'executes once' },
        { from: 'file', to: 'main', label: 'when run' },
        { from: 'file', to: 'mod', label: 'when imported' },
      ],
      steps: [
        { focus: ['file'], text: py`Either way, Python executes \`wordcount.py\` from top to bottom: imports run, functions and classes are defined. The only difference is the value of \`__name__\`.` },
        { focus: ['run', 'file', 'main'], edges: ['run->file', 'file->main'], text: py`**Run as the program** (\`python wordcount.py\`, \`python -m wordcount\`, the IDE's Run button): the module is named \`"__main__"\`, so \`if __name__ == "__main__":\` is \`True\` and \`main()\` does the script's work.` },
        { focus: ['imp', 'file', 'mod'], edges: ['imp->file', 'file->mod'], text: py`**Imported** (by another module, a test, a worker process): the module is named \`"wordcount"\`. The guard is \`False\`; the importer gets the functions with no side effects.` },
        { focus: ['main', 'mod'], text: py`Careful: if the same file is *both* run and imported in one process, it's executed twice and you get **two separate module objects** (\`__main__\` and \`wordcount\`), each with its own globals. Keep entry scripts thin to avoid that trap.` },
      ],
    },
    alt: 'Diagram: python -m wordcount and import wordcount both execute wordcount.py. When run as the program, __name__ is "__main__" and the guard calls main(). When imported, __name__ is "wordcount" and the guard is false, so only definitions happen.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`__name__\` is just a global variable that the import system fills in before your file's first line runs. There's nothing magic about the guard: it's an ordinary \`if\` comparing two strings.`,
      py`The name \`"__main__"\` means "the top-level code environment" — the module where the program started. Whatever the file is called, the started file is \`__main__\` and \`sys.modules["__main__"]\` refers to it.`,
      py`Python doesn't call \`main()\` for you (unlike C or Java). \`main\` is only a naming convention — the guard is what calls it.`,
    ],
    technical: [
      py`**\`python file.py\`** compiles the file and executes it in a fresh module named \`__main__\`. \`sys.path[0]\` is the file's folder. \`__package__\` is empty, so relative imports fail.`,
      py`**\`python -m pkg.mod\`** uses \`runpy\`: it imports \`pkg\` (running its \`__init__.py\`), locates \`pkg.mod\` through the normal import system **without** importing it, then executes its code as \`__main__\` with \`__package__ = "pkg"\` (relative imports work) and \`__spec__\` set. \`sys.path[0]\` is the **current directory**. For a package, \`python -m pkg\` executes \`pkg/__main__.py\`. (Python also runs a directory or zip file containing \`__main__.py\` — see the \`zipapp\` module.)`,
      py`**The double-import trap.** If \`app.py\` is run as the program and some other module does \`import app\`, Python loads the file a **second** time under the name \`app\` — it doesn't know \`__main__\` and \`app\` are the same file. You get two copies of every global, so a registry filled in one copy looks empty in the other, and \`isinstance\` checks fail across the copies. Fix: keep the entry-point file tiny and put shared state in a module that is only ever imported.`,
      py`**Exit status.** \`sys.exit(x)\` raises \`SystemExit(x)\`. If nothing catches it, the interpreter cleans up (running \`finally\` blocks and \`atexit\` handlers) and exits: \`None\` → 0, an int → that status, anything else → printed to stderr and status 1. An uncaught exception also exits with status 1, after printing the traceback.`,
      { code: py`import sys

for value in [None, 0, 2, "bad input"]:
    try:
        sys.exit(value)
    except SystemExit as exc:
        print(repr(exc.code))`, lang: 'python', title: 'SystemExit is an ordinary exception' },
      py`**Multiprocessing.** With the *spawn* start method (the default on Windows and macOS) a worker is a brand-new interpreter that **imports your main module** to find the target function; *forkserver* (the default on other POSIX systems such as Linux since Python 3.14, previously *fork*) has the same requirement. Unguarded top-level code would run in every worker — and if that code starts workers, multiprocessing detects it and raises \`RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase.\``,
      { code: py`from multiprocessing import Pool


def square(n):
    return n * n


if __name__ == "__main__":          # required with spawn/forkserver
    with Pool(4) as pool:
        print(pool.map(square, range(10)))`, lang: 'python', static: true, title: 'multiprocessing needs the guard (cannot run in the browser sandbox)' },
    ],
    production: [
      py`**Installed commands use entry points.** When you [package](lesson:packaging) a tool, \`pyproject.toml\` declares \`[project.scripts] wordcount = "wordcount.cli:main"\`. pip then creates a small \`wordcount\` executable that imports \`wordcount.cli\` and calls \`sys.exit(main())\`. Your \`main()\` should therefore take no required arguments and **return** an exit status rather than calling \`sys.exit\` deep inside the logic.`,
      py`**Keep \`main()\` thin.** It should parse arguments (with [argparse](lesson:command-line-programs)), call well-named functions that do the real work, and translate failures into exit codes and messages. The logic stays testable without a terminal; \`main\` is a small adapter.`,
      py`**Accept \`argv\`, return an int.** \`def main(argv: list[str] | None = None) -> int:\` lets tests call \`main(["--dry-run"])\` and assert on the return value, with no subprocesses and no monkey-patching \`sys.argv\`.`,
      py`**Prefer \`python -m\` during development.** It runs code exactly as it will be imported, so package-relative imports work, and \`python -m pytest\` / \`python -m pip\` guarantee the tool belongs to the interpreter (and [virtual environment](lesson:virtual-environments)) you think it does.`,
    ],
  },
  mistakes: [
    {
      title: 'Script code at the top level of a reusable module',
      wrong: { code: py`# grades.py
def average(scores):
    return sum(scores) / len(scores)

name = input("Student? ")        # runs on every import — tests hang here
print(name, average([90, 80]))`, lang: 'python', static: true },
      right: { code: py`# grades.py
def average(scores):
    return sum(scores) / len(scores)


def main():
    name = input("Student? ")
    print(name, average([90, 80]))


if __name__ == "__main__":
    main()`, lang: 'python' },
      explanation: py`Importing a module runs its top level. Anything interactive or with side effects belongs in \`main()\`, behind the guard, so \`from grades import average\` stays silent.`,
    },
    {
      title: 'A misspelled guard',
      wrong: { code: py`def main():
    print("Report ready")


if __name__ == "main":       # missing underscores: never True
    main()`, lang: 'python' },
      right: { code: py`def main():
    print("Report ready")


if __name__ == "__main__":
    main()`, lang: 'python' },
      explanation: py`The comparison silently fails and the script does nothing at all — no error. The value is \`"__main__"\` with two underscores on each side, in quotes. Without quotes (\`== __main__\`) you get \`NameError: name '__main__' is not defined\`.`,
    },
    {
      title: 'All the logic inside the guard',
      wrong: { code: py`if __name__ == "__main__":
    total = 0
    for line in open("sales.csv"):
        total += float(line.split(",")[1])
    print(total)`, lang: 'python', static: true },
      right: { code: py`def total_sales(lines):
    return sum(float(line.split(",")[1]) for line in lines)


def main():
    with open("sales.csv") as f:
        print(total_sales(f))


if __name__ == "__main__":
    main()`, lang: 'python' },
      explanation: py`Code in the guard block runs at module level, so \`total\` and \`line\` become **global** variables, and none of it can be imported or tested. Put the work in functions; the guard should be one call.`,
    },
    {
      title: 'Calling sys.exit inside library code',
      wrong: { code: py`import sys


def load_config(path):
    if not path.endswith(".toml"):
        print("bad config file")
        sys.exit(1)          # kills whatever program imported this`, lang: 'python' },
      right: { code: py`def load_config(path):
    if not path.endswith(".toml"):
        raise ValueError(f"expected a .toml file, got {path!r}")


# only main() decides how to exit:
# except ValueError as err: print(err, file=sys.stderr); return 1`, lang: 'python' },
      explanation: py`A function deep in a library shouldn't decide to end the process — a web server or test runner importing it would just stop. Raise an exception; let \`main()\` turn it into a message and exit status.`,
    },
    {
      title: 'Running a package module by file path',
      wrong: { code: py`python shop/report.py      # ImportError: attempted relative import with no known parent package`, lang: 'bash' },
      right: { code: py`python -m shop.report      # from the folder that contains shop/`, lang: 'bash' },
      explanation: py`A path runs the file as a standalone script with no package. \`-m\` imports it through the package, so relative imports and \`sys.path\` are right. See [packages](lesson:packages).`,
    },
  ],
  debugging: [
    {
      symptom: py`The script runs, prints nothing, and exits with status 0.`,
      cause: py`The guard never matched (\`"main"\` instead of \`"__main__"\`), or \`main\` is referenced without calling it (\`main\` instead of \`main()\`).`,
      fix: py`Check the exact spelling \`if __name__ == "__main__":\` and the parentheses. Add \`print(__name__)\` at the top of the file to see the value.`,
    },
    {
      symptom: py`RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase.`,
      cause: py`Multiprocessing code (creating a \`Pool\` or \`Process\`) runs at module top level. With spawn/forkserver, each child imports the main module and tries to start processes again.`,
      fix: py`Move the process-starting code into \`main()\` and call it under \`if __name__ == "__main__":\`. See [multiprocessing](lesson:multiprocessing).`,
    },
    {
      symptom: py`Running the tests prints a report, or hangs / fails with an error about reading from stdin.`,
      cause: py`The module under test has script code (printing, \`input()\`) at the top level, which runs when the test imports it.`,
      fix: py`Move that code into \`main()\` behind the guard. Tests should only ever import definitions.`,
    },
    {
      symptom: py`NameError: name '__main__' is not defined`,
      cause: py`The guard is missing quotes: \`if __name__ == __main__:\`.`,
      fix: py`Compare with the string: \`if __name__ == "__main__":\`.`,
    },
    {
      symptom: py`A module-level registry/cache is mysteriously empty, or isinstance() fails for an object of "the same" class.`,
      cause: py`The double-import trap: the file was run as \`__main__\` *and* imported under its real name, creating two module objects.`,
      fix: py`Make the entry point a tiny file (or \`__main__.py\`) that imports the real module and calls its \`main()\`; never import the entry script from elsewhere.`,
    },
  ],
  bestPractices: [
    'End every runnable file with if __name__ == "__main__": followed by a single call such as sys.exit(main()).',
    'Put the script\'s work in main(argv=None) -> int: parse arguments, call real functions, return an exit status.',
    'Keep module top level free of side effects: imports, constants, functions and classes only.',
    'Return exit codes from main() and raise exceptions in library code; never call sys.exit deep inside reusable functions.',
    'Run modules inside packages with python -m package.module from the project root.',
    'Give a package a __main__.py if it should be runnable with python -m package.',
    'Always guard multiprocessing code — it is required with the spawn and forkserver start methods.',
    'For installed tools, expose main() as a console-script entry point in pyproject.toml.',
  ],
  useCases: [
    'A utility module that also offers a quick command-line interface (like python -m json.tool).',
    'Scripts whose functions are imported by tests.',
    'Multiprocessing programs that must be safely importable by worker processes.',
    'A package runnable as python -m package via __main__.py.',
    'Demo or smoke-test code at the bottom of a module that should not run on import.',
  ],
  comparison: {
    title: 'python path/to/file.py vs python -m package.module',
    headers: ['', 'python shop/report.py', 'python -m shop.report'],
    rows: [
      ['how the code is found', 'by file path', 'by import name, through sys.path'],
      ['sys.path[0]', 'the file\'s folder (shop/)', 'the current directory'],
      ['parent package imported first', 'no', 'yes (shop/__init__.py runs)'],
      ['__package__', 'empty', '"shop"'],
      ['relative imports', 'fail', 'work'],
      ['__name__', '"__main__"', '"__main__"'],
    ],
    note: py`Both run the code as \`__main__\`, so the guard behaves the same. For anything inside a package, use \`-m\`.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'main-guard-and-scripts-q1',
      type: 'mcq',
      prompt: py`\`main.py\` does \`import greet\`. Inside \`greet.py\`, what is the value of \`__name__\` while it is being imported?`,
      options: [
        { text: '"__main__"', why: 'Only the module Python was asked to run (main.py here) is "__main__".' },
        '"greet"',
        { text: '"greet.py"', why: '__name__ is the import name, without the .py extension.' },
        { text: '"main.greet"', why: 'Module names are not nested under the importer; a plain module is just "greet".' },
      ],
      answer: 1,
      explanation: py`An imported module's \`__name__\` is its import name (\`"greet"\`, or \`"shop.cart"\` inside a package). Only the starting module is \`"__main__"\`.`,
    },
    {
      id: 'main-guard-and-scripts-q2',
      type: 'output',
      prompt: py`Two files. Running \`python main.py\` prints one line — what is it?`,
      code: py`# tools.py
def where():
    return __name__

# main.py
import tools
print(tools.where(), __name__)`,
      answer: 'tools __main__',
      accept: ['tools __main__'],
      explanation: py`A function looks up globals in the module where it was **defined**, so \`tools.where()\` returns \`tools\`'s \`__name__\`, which is \`"tools"\`. In main.py, \`__name__\` is \`"__main__"\`.`,
    },
    {
      id: 'main-guard-and-scripts-q3',
      type: 'bug',
      prompt: py`This script runs without any error but never prints the report. Click the buggy line.`,
      code: py`def main():
    print("Weekly report")
    print("Sales: 42")


if __name__ == "main":
    main()`,
      answerLine: 6,
      explanation: py`The value is \`"__main__"\` — two underscores on each side. \`"main"\` never equals \`__name__\`, so the condition is always \`False\` and nothing runs (silently).`,
    },
    {
      id: 'main-guard-and-scripts-q4',
      type: 'fill',
      prompt: py`Complete the guard so the program exits with \`main()\`'s return value as its status.`,
      code: py`import sys


def main():
    print("done")
    return 0


if __name__ == ___:
    ___(main())`,
      answer: [['"__main__"', "'__main__'"], ['sys.exit', 'raise SystemExit']],
      explanation: py`\`if __name__ == "__main__":\` then \`sys.exit(main())\`. \`sys.exit\` raises \`SystemExit\` with that status (0 = success); \`raise SystemExit(main())\` is equivalent.`,
    },
    {
      id: 'main-guard-and-scripts-q5',
      type: 'mcq',
      prompt: py`Compared with \`python shop/report.py\`, what does \`python -m shop.report\` do differently? **Select all that apply.**`,
      options: [
        'It imports the parent package shop first',
        'It sets __package__ to "shop", so relative imports work',
        'It puts the current directory (not shop/) at the front of sys.path',
        { text: 'It runs the module with __name__ set to "shop.report", so the guard is skipped', why: 'With -m the module still runs as "__main__" — that is the point of -m.' },
      ],
      answer: [0, 1, 2],
      explanation: py`\`-m\` finds the module through the import system, imports its parents, sets \`__package__\`, and uses the current directory as \`sys.path[0]\`. The code still runs as \`__main__\`.`,
    },
    {
      id: 'main-guard-and-scripts-q6',
      type: 'mcq',
      prompt: py`Why does code that starts a \`multiprocessing.Pool\` need the \`__main__\` guard?`,
      options: [
        { text: 'Pool only works inside functions', why: 'Pool works anywhere; the problem is what happens when worker processes import your file.' },
        { text: 'The guard makes the program run in parallel', why: 'The guard does not create parallelism — it prevents re-running top-level code.' },
        'With spawn or forkserver, each worker imports the main module; unguarded top-level code would run again in every worker, including the code that starts workers',
        { text: 'It is a style rule from PEP 8 with no functional effect', why: 'Here it is functional: without it multiprocessing raises RuntimeError.' },
      ],
      answer: 2,
      explanation: py`Spawned workers are fresh interpreters that import your main module to find your functions. Under the guard, the Pool is created only in the real main process. Spawn is the default on Windows and macOS; forkserver is the default on Linux since Python 3.14.`,
    },
    {
      id: 'main-guard-and-scripts-q7',
      type: 'short',
      prompt: py`Why is it better for the guard to call a \`main()\` function than to put all the script's statements directly under \`if __name__ == "__main__":\`?`,
      answer: py`Statements under the guard run at module level, so their variables become globals that leak into the module namespace. They also can't be called from tests or other code. A main() function keeps variables local, can take argv and return an exit status, and can be called directly in tests (main(["--flag"])) or used as a console-script entry point.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'guard-the-report',
      title: 'Stop the report from running on import',
      difficulty: 'beginner',
      prompt: py`\`main.py\` only wants the \`average\` function from \`grades.py\`, but importing \`grades\` also prints a whole class report. Fix **grades.py**:

1. Move the report code into a function \`main()\`.
2. Call it under \`if __name__ == "__main__":\`.

After your change, running main.py prints only:

\`\`\`text
Team average: 80.0
\`\`\`

and running grades.py as a script (\`python grades.py\`) still prints the report, ending with \`Average: 84.7\`.`,
      files: {
        'main.py': GRADES_MAIN,
        'grades.py': py`"""Grade statistics."""
SCORES = {"Ada": 91, "Ben": 78, "Cy": 85}


def average(scores):
    return sum(scores.values()) / len(scores)


# TODO: move the report into main() and call it only when run as a script
print("Class report")
for name, score in SCORES.items():
    print(f"  {name}: {score}")
print(f"Average: {average(SCORES):.1f}")
`,
      },
      hints: [
        'Everything at the top level of grades.py runs on import. The four report lines need to stop being top-level code.',
        'Indent the report lines inside def main():, then add the guard at the very bottom of the file.',
        'def main():\n    print("Class report")\n    ...\n\n\nif __name__ == "__main__":\n    main()',
      ],
      solution: {
        explanation: py`The report now lives in \`main()\`, so importing \`grades\` only defines \`SCORES\`, \`average\` and \`main\`. When grades.py is the program, \`__name__\` is \`"__main__"\` and the guard calls \`main()\`; when main.py imports it, \`__name__\` is \`"grades"\` and nothing prints. The tests check both sides by running \`grades\` with \`runpy.run_module(..., run_name="__main__")\` — exactly what \`python -m grades\` does. (91 + 78 + 85) / 3 = 84.67, shown as \`84.7\`.`,
        files: {
          'main.py': GRADES_MAIN,
          'grades.py': py`"""Grade statistics."""
SCORES = {"Ada": 91, "Ben": 78, "Cy": 85}


def average(scores):
    return sum(scores.values()) / len(scores)


def main():
    print("Class report")
    for name, score in SCORES.items():
        print(f"  {name}: {score}")
    print(f"Average: {average(SCORES):.1f}")


if __name__ == "__main__":
    main()
`,
        },
      },
      tests: [
        { name: 'importing grades prints nothing', code: py`assert output.strip() == "Team average: 80.0", 'Only main.py should print when grades is imported'` },
        { name: 'grades.main exists', code: py`assert callable(getattr(module('grades'), 'main', None)), 'Define a function main() in grades.py'` },
        { name: 'main() prints the report', code: py`out = capture(module('grades').main)
assert "Class report" in out and "Average: 84.7" in out` },
        { name: 'running grades as a script prints the report', code: py`import runpy
out = capture(runpy.run_module, "grades", run_name="__main__")
assert "Ada: 91" in out and "Average: 84.7" in out` },
      ],
    },
    {
      id: 'testable-cli',
      title: 'A testable command-line entry point',
      difficulty: 'intermediate',
      prompt: py`Write \`main(argv=None)\` in **tempconv.py**, a Celsius → Fahrenheit command-line tool:

- if \`argv\` is \`None\`, use \`sys.argv[1:]\`;
- with **no** arguments: print \`usage: python -m tempconv CELSIUS...\` to **stderr** and return \`2\`;
- for each argument, convert it with \`float()\` and print \`f"{c:g}°C = {c * 9 / 5 + 32:g}°F"\` (stdout), e.g. \`100°C = 212°F\`;
- if an argument isn't a number, print \`error: not a number: 'abc'\` (use \`{arg!r}\`) to **stderr** and return \`1\` immediately;
- otherwise return \`0\`.

End the file with the guard: \`if __name__ == "__main__": sys.exit(main())\`.`,
      files: {
        'main.py': TEMPCONV_MAIN,
        'tempconv.py': py`"""tempconv: convert Celsius temperatures to Fahrenheit."""
import sys


def main(argv=None):
    # TODO: read argv (or sys.argv[1:]), convert each value, return an exit status
    return 0


# TODO: add the __main__ guard
`,
      },
      hints: [
        'Start with args = sys.argv[1:] if argv is None else argv, then handle the empty case first.',
        'print(..., file=sys.stderr) writes to the error stream. Wrap float(arg) in try/except ValueError and return 1 from inside the except block.',
        'for arg in args:\n    try:\n        c = float(arg)\n    except ValueError:\n        print(f"error: not a number: {arg!r}", file=sys.stderr)\n        return 1\n    print(f"{c:g}°C = {c * 9 / 5 + 32:g}°F")\nreturn 0',
      ],
      solution: {
        explanation: py`\`main\` takes an optional \`argv\` list so tests can call it directly (\`main(["100"])\`) while the real command line still works (\`argv=None\` → \`sys.argv[1:]\`). It **returns** a status instead of calling \`sys.exit\` itself; only the guard turns that into a process exit, so importing or testing \`tempconv\` never ends the program. Usage and error messages go to stderr so they don't mix with the program's real output (you could pipe the results into another tool), and the conventional statuses are 0 for success, 1 for a runtime error and 2 for wrong usage. \`:g\` drops a pointless \`.0\` (\`212\`) but keeps real decimals (\`98.6\`).`,
        files: {
          'main.py': TEMPCONV_MAIN,
          'tempconv.py': py`"""tempconv: convert Celsius temperatures to Fahrenheit."""
import sys


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if not args:
        print("usage: python -m tempconv CELSIUS...", file=sys.stderr)
        return 2
    for arg in args:
        try:
            c = float(arg)
        except ValueError:
            print(f"error: not a number: {arg!r}", file=sys.stderr)
            return 1
        print(f"{c:g}°C = {c * 9 / 5 + 32:g}°F")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,
        },
      },
      tests: [
        { name: 'converts values and returns 0', code: py`import contextlib, io
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    status = module('tempconv').main(["100", "-40", "37"])
assert status == 0
assert buf.getvalue().splitlines() == ["100°C = 212°F", "-40°C = -40°F", "37°C = 98.6°F"]` },
        { name: 'no arguments: usage on stderr, status 2', code: py`import contextlib, io
err = io.StringIO()
with contextlib.redirect_stderr(err):
    status = module('tempconv').main([])
assert status == 2 and "usage: python -m tempconv CELSIUS..." in err.getvalue()` },
        { name: 'bad number: message on stderr, status 1', code: py`import contextlib, io
err = io.StringIO()
with contextlib.redirect_stderr(err):
    status = module('tempconv').main(["20", "abc"])
assert status == 1 and "error: not a number: 'abc'" in err.getvalue()` },
        { name: 'argv=None reads sys.argv', code: py`import sys
saved = sys.argv
sys.argv = ["tempconv", "0"]
try:
    out = capture(module('tempconv').main)
finally:
    sys.argv = saved
assert out.strip() == "0°C = 32°F"` },
        { name: 'has the __main__ guard', code: py`src = files['tempconv.py']
assert 'if __name__ == "__main__"' in src or "if __name__ == '__main__'" in src` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'main-guard-and-scripts-what-and-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does `if __name__ == "__main__":` do, and why do we use it?',
      answer: 'Python sets __name__ to "__main__" in the module that was run as the program and to the module\'s import name otherwise. The guard runs its block only when the file is executed directly, so the same file can be imported (by other modules, tests or worker processes) without running its script code.',
      explanation: py`Importing a module executes its top level. The guard separates "definitions everyone may import" from "what to do when I am the program". It's also required for multiprocessing with spawn/forkserver, where workers import the main module.`,
      whyAsked: 'Almost every Python codebase uses it; interviewers check you know the mechanism rather than treating it as boilerplate.',
      mistakes: ['Saying it is required for a script to run', 'Thinking Python calls main() automatically', 'Not knowing what __name__ is when imported'],
      followUps: ['What is __name__ inside a module of a package?', 'Why does multiprocessing need it?', 'What goes in main()?'],
      modelAnswer: 'Every module has a __name__ variable. When a file is the program being run — python file.py or python -m module — Python sets it to "__main__"; when the file is imported, it is the module\'s import name. So if __name__ == "__main__": means "only do this when I am the program". That lets a file be a reusable module and a runnable script at the same time: tests and other modules can import its functions without triggering the script part. It is also required with multiprocessing\'s spawn and forkserver start methods, because worker processes import the main module. I keep the guard to one line calling main().',
    },
    {
      id: 'main-guard-and-scripts-dash-m-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: '`shop/report.py` starts with `print(__name__, __package__)`. What does it print when run with `python -m shop.report`, and when another module does `import shop.report`?',
      code: { lang: 'python', code: py`# shop/report.py
print(__name__, __package__)` },
      options: ['__main__ None, then shop.report shop', '__main__ shop, then shop.report shop', 'shop.report shop, both times', '__main__ shop, both times'],
      correctOption: 1,
      answer: 'With -m: "__main__ shop". When imported: "shop.report shop". -m runs the module as __main__ but still knows its package, which is why relative imports work under -m.',
      explanation: py`\`python -m\` imports \`shop\`, then executes \`report\`'s code with \`__name__ = "__main__"\` and \`__package__ = "shop"\`. When imported normally, \`__name__\` is the full dotted name. Running \`python shop/report.py\` would instead give an empty \`__package__\`.`,
      whyAsked: 'Distinguishes people who know how -m works (and why relative imports break with file paths) from those who just memorised the guard.',
      mistakes: ['Thinking -m sets __name__ to the module name', 'Not knowing __package__ exists'],
      followUps: ['What would python shop/report.py print?', 'What is the double-import trap?'],
      modelAnswer: 'Under python -m shop.report it prints "__main__ shop": -m imports the shop package, then runs report\'s code as the main module, but it keeps __package__ set to shop. When another module imports it, it prints "shop.report shop", the full dotted name and its package. That __package__ value is exactly what relative imports are resolved against, which is why relative imports work under -m but not when you run the file by path, where __package__ is empty.',
    },
    {
      id: 'main-guard-and-scripts-spawn-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A colleague\'s script works on Linux with Python 3.12 but on macOS (and Linux with 3.14) it crashes with "An attempt has been made to start a new process before the current process has finished its bootstrapping phase". What is going on?',
      answer: 'The script creates processes at module top level without a __main__ guard. Python 3.12 on Linux defaulted to fork, which copies the parent without re-importing. macOS defaults to spawn and Linux to forkserver since 3.14; those start workers that import the main module, so unguarded code tries to start processes again. Fix: put the process-starting code in main() under the guard.',
      explanation: py`Different start methods have different requirements. *fork* copies the parent process, so the main module isn't re-imported. *spawn* (Windows, macOS since 3.8) and *forkserver* (Linux default since 3.14) need the main module to be safely importable. The guard is the portable answer.`,
      code: { lang: 'python', code: py`from multiprocessing import Pool


def resize(path):
    return f"resized {path}"


def main():
    with Pool() as pool:
        print(pool.map(resize, ["a.png", "b.png"]))


if __name__ == "__main__":
    main()`, static: true },
      whyAsked: 'A realistic cross-platform bug; good answers connect the guard to how worker processes are created.',
      mistakes: ['Blaming macOS', 'Forcing the fork start method everywhere without understanding the trade-offs', 'Moving the Pool into a function but still calling it at top level'],
      followUps: ['What are the trade-offs between fork and spawn?', 'What else must be picklable when using spawn?'],
      modelAnswer: 'The pool is created at the top level of the main module. On older Linux the default start method was fork, which copies the running process, so the module was never re-imported and it happened to work. On macOS the default is spawn, and on Linux it is forkserver since 3.14; both start fresh worker interpreters that import the main module to find the target function, so the unguarded code tries to start more processes and multiprocessing aborts with that RuntimeError. The fix is to put the pool code in main() and call it under if __name__ == "__main__". That makes the module safe to import, which is the portable requirement.',
    },
    {
      id: 'main-guard-and-scripts-run-main',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `run_main(main, argv)` — a test helper that calls `main(argv)` and returns the exit status the shell would see for `sys.exit(main(argv))`: a returned or raised `None` → 0, an int → that int, any other value → print it to stderr and return 1. `main` may return a value or raise `SystemExit` itself.',
      answer: 'Call main(argv) inside try; on a normal return use the return value; on SystemExit use exc.code. Then map None → 0, int → int, anything else → print to sys.stderr and return 1.',
      explanation: py`This mirrors the interpreter's handling of \`SystemExit\`. Catching \`SystemExit\` is fine in a test helper (it's an exception like any other, just not a subclass of \`Exception\`), but application code should rarely catch it. Note \`bool\` is a subclass of \`int\`, so \`True\` would become status 1 — the interpreter does the same.`,
      starter: { files: { 'main.py': RUN_MAIN_START } },
      tests: [
        { name: 'a returned 0 or None is status 0', code: py`assert run_main(lambda argv: 0, []) == 0
assert run_main(lambda argv: None, []) == 0` },
        { name: 'a returned int is the status', code: py`assert run_main(lambda argv: 2, []) == 2` },
        { name: 'SystemExit(3) raised inside main is status 3', code: py`def failing(argv):
    raise SystemExit(3)
assert run_main(failing, []) == 3` },
        { name: 'a string message goes to stderr with status 1', code: py`import contextlib, io, sys
def bad(argv):
    sys.exit("bad input: " + argv[0])
err = io.StringIO()
with contextlib.redirect_stderr(err):
    status = run_main(bad, ["x"])
assert status == 1 and "bad input: x" in err.getvalue()` },
        { name: 'passes argv through', code: py`assert capture(run_main, ok, ["Ada", "Ben"]).startswith("hello Ada Ben")` },
      ],
      solution: { files: { 'main.py': py`import sys


def run_main(main, argv):
    """Call main(argv) like the shell would: return the process exit status."""
    try:
        code = main(argv)
    except SystemExit as exc:
        code = exc.code
    if code is None:
        return 0
    if isinstance(code, int):
        return code
    print(code, file=sys.stderr)
    return 1


def ok(argv):
    print("hello", *argv)
    return 0


print(run_main(ok, ["Ada"]))
` } },
      hints: ['SystemExit has a .code attribute holding whatever was passed to sys.exit().', 'Collect the code from either the return value or the exception, then map it in one place.', 'None → 0, isinstance(code, int) → code, otherwise print(code, file=sys.stderr) and return 1.'],
      whyAsked: 'Shows you understand that sys.exit is just an exception and how exit statuses work — useful for writing and testing CLIs.',
      mistakes: ['Catching Exception (SystemExit is not a subclass of Exception)', 'Forgetting the None case', 'Printing the message to stdout'],
      followUps: ['Why is SystemExit not a subclass of Exception?', 'How would pytest\'s capsys or CliRunner-style helpers use this?'],
      modelAnswer: 'sys.exit just raises SystemExit, so I call main(argv) inside a try and catch SystemExit specifically — it derives from BaseException, not Exception, so a broad except Exception would miss it. Whether the value came from a return or from exc.code, I map it the way the interpreter does: None means 0, an int is used as-is, and anything else, typically an error string, is printed to stderr and becomes status 1. That gives tests a simple way to assert on both the output and the exit status without spawning a subprocess.',
    },
    {
      id: 'main-guard-and-scripts-double-import',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: '`app.py` defines `PLUGINS = []` and is started with `python app.py`. `plugins.py` does `import app` and appends to `app.PLUGINS`. Back in `app.py`, `PLUGINS` is still empty. Why?',
      answer: 'The double-import trap: app.py runs as the module __main__, and import app loads the same file again as a second module named app. plugins.py appends to app.PLUGINS, a different list from __main__.PLUGINS. Fix: keep the entry script thin (or use __main__.py / an entry point) and put shared state in a module that is only imported.',
      explanation: py`The import system keys modules by name. \`__main__\` and \`app\` are different names, so the file is executed twice and every global, function and class exists twice — which also breaks \`isinstance\` checks between the copies.`,
      code: { lang: 'python', code: py`# run.py  (the only file you execute)
from app import main

raise SystemExit(main())` },
      whyAsked: 'A subtle, real bug in plugin systems and Flask/Django-style apps; it tests deep understanding of how modules are identified.',
      mistakes: ['Thinking Python recognises that __main__ and app are the same file', 'Fixing it with global variables or sys.modules hacks'],
      followUps: ['How can you detect it? (print id(PLUGINS) in both places, or check sys.modules)', 'How do console-script entry points avoid it?'],
      modelAnswer: 'Modules are identified by name, not by file. Running python app.py executes the file as __main__, and when plugins.py does import app, Python finds no module called app in sys.modules, so it executes app.py a second time as a new module. Now there are two PLUGINS lists; the plugins append to app.PLUGINS while the running code reads __main__.PLUGINS. I would make the entry point a tiny script or __main__.py — or a console-script entry point — that imports app and calls app.main(), so app.py is only ever loaded once, by import.',
    },
    {
      id: 'main-guard-and-scripts-cli-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you structure the entry points of a command-line tool that is developed in a package, tested with pytest and installed with pip?',
      answer: 'Logic in importable modules; a thin cli.py with main(argv=None) -> int that parses args, calls the logic and maps errors to exit codes; package/__main__.py calling main for python -m package; a [project.scripts] console-script entry point for the installed command; tests call the logic and main([...]) directly.',
      explanation: py`Every way in — installed command, \`python -m\`, tests — funnels into one \`main()\`. No module does work on import, \`sys.exit\` only happens at the outermost layer, and logic never depends on \`sys.argv\`.`,
      code: { lang: 'toml', code: py`[project.scripts]
wordcount = "wordcount.cli:main"   # pip creates a 'wordcount' command calling main()` },
      whyAsked: 'Senior engineers design tools other people install; this checks you know the modern entry-point story end to end.',
      mistakes: ['Business logic inside main() or the guard block', 'Calling sys.exit inside library functions', 'Shipping shell scripts that call python path/to/file.py'],
      followUps: ['Why should main() return instead of calling sys.exit?', 'How would you test the installed command itself?'],
      modelAnswer: 'I keep the real logic in ordinary modules that can be imported and unit-tested. A thin cli module has main(argv=None) that returns an int: it parses arguments with argparse, calls the logic, and converts expected exceptions into a message on stderr and a non-zero status. The package gets a __main__.py that calls main so python -m mytool works during development, and pyproject.toml declares a console-script entry point so pip installs a real mytool command that calls the same function. Tests call the logic directly and call main with an argv list to check exit codes, with maybe one end-to-end test of the installed command.',
    },
  ],

  takeaways: [
    'Python sets __name__ to "__main__" in the module it was asked to run, and to the import name everywhere else.',
    'if __name__ == "__main__": runs code only when the file is the program, so the file can also be imported safely.',
    'Put the script\'s work in main(argv=None) that returns an exit status; the guard is one line: sys.exit(main()).',
    'python -m package.module runs a module as __main__ through the import system — relative imports work; __main__.py makes a package runnable.',
    'Multiprocessing with spawn or forkserver (defaults on Windows/macOS and, since 3.14, Linux) requires the guard.',
    'Library code raises exceptions; only the entry point decides how to exit.',
    'Beware the double-import trap: a file run as __main__ and also imported exists twice.',
  ],
}
