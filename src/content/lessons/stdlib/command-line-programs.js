// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WORDSTAT = py`"""wordstat: count lines, words and characters, like a tiny wc."""
import argparse
import sys
from collections import Counter


def build_parser():
    parser = argparse.ArgumentParser(
        prog="wordstat",
        description="Count lines, words and characters in text files.",
    )
    parser.add_argument("files", nargs="*", help="files to read (default: standard input)")
    parser.add_argument("-w", "--words", action="store_true", help="print only the word count")
    parser.add_argument("--top", type=int, default=0, metavar="N",
                        help="also list the N most common words")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)     # argv=None means sys.argv[1:]
    exit_code = 0
    for name in args.files or ["-"]:           # no files: read standard input
        try:
            if name == "-":
                text, label = sys.stdin.read(), "(stdin)"
            else:
                with open(name, encoding="utf-8") as f:
                    text, label = f.read(), name
        except FileNotFoundError:
            print(f"wordstat: {name}: no such file", file=sys.stderr)
            exit_code = 1                      # keep going, but report failure
            continue
        words = text.split()
        if args.words:
            print(len(words), label)
        else:
            print(f"{len(text.splitlines()):>4} {len(words):>4} {len(text):>5} {label}")
        for word, n in Counter(w.lower().strip(".,!?") for w in words).most_common(args.top):
            print(f"     {n} x {word}")
    return exit_code


# In a terminal you would end the file with:  raise SystemExit(main())
# The sandbox has no terminal, so we simulate a few command lines instead.
for argv in (["poem.txt"], ["-w", "poem.txt", "notes.txt"], ["--top", "2", "poem.txt"], ["missing.txt"]):
    print("$ wordstat", " ".join(argv))
    code = main(argv)
    print(f"[exit code {code}]")
    print()
`

const POEM = py`The rain falls soft on the river,
the river carries the rain away.
`

const NOTES = py`Buy milk.
Call Ada about the river trip.
`

export default {
  id: 'command-line-programs',
  title: 'Command-line programs with argparse & sys',
  summary: 'Command-line programs take arguments from sys.argv, read standard input, write results to stdout and problems to stderr, and report success with an exit code — argparse turns all the argument handling into a few declarative lines with help and error messages for free.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['defining-functions', 'main-guard-and-scripts'],
  related: ['main-guard-and-scripts', 'reading-writing-files', 'try-except', 'packaging', 'logging', 'injection-attacks', 'secrets-and-passwords'],
  tags: ['command line', 'CLI', 'terminal', 'sys.argv', 'argparse', 'ArgumentParser', 'add_argument', 'parse_args', 'positional arguments', 'options', 'flags', 'subcommands', 'exit codes', 'sys.exit', 'SystemExit', 'stdin', 'stdout', 'stderr', 'pipes'],
  apis: [
    { name: 'sys.argv', summary: 'The command-line words as a list of strings; sys.argv[0] is the script name.' },
    { name: 'argparse.ArgumentParser(prog, description, epilog)', summary: 'Declares a command-line interface; generates usage, --help and error messages.' },
    { name: 'parser.add_argument(name or flags, type, default, help, choices, action, nargs, required)', summary: 'Declares one positional argument or option.' },
    { name: 'parser.parse_args(args=None)', summary: 'Parses sys.argv[1:] (or the list you pass) into a Namespace; exits with status 2 on errors.' },
    { name: 'action="store_true" / "count" / "version" / argparse.BooleanOptionalAction', summary: 'Flags without values, -vvv counters, --version, and --x/--no-x pairs (3.9+).' },
    { name: 'parser.add_subparsers(dest, required)', summary: 'Git-style subcommands: tool add …, tool list ….' },
    { name: 'argparse.ArgumentTypeError', summary: 'Raise it from a custom type function to produce a clean usage error.' },
    { name: 'sys.exit(code) / raise SystemExit(code)', summary: 'End the program with an exit status: 0 success, non-zero failure; a string is printed to stderr with status 1.' },
    { name: 'sys.stdin / sys.stdout / sys.stderr', summary: 'The standard streams: input, normal output, diagnostics.' },
    { name: 'print(..., file=sys.stderr)', summary: 'Write an error or progress message to standard error.' },
  ],
  docs: [
    { label: 'argparse — parser for command-line options', url: 'https://docs.python.org/3/library/argparse.html' },
    { label: 'Argparse tutorial (HOWTO)', url: 'https://docs.python.org/3/howto/argparse.html' },
    { label: 'sys.argv, sys.exit and the standard streams', url: 'https://docs.python.org/3/library/sys.html#sys.argv' },
    { label: '__main__ — top-level code environment', url: 'https://docs.python.org/3/library/__main__.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **command-line program** (a *CLI*, for command-line interface) is a program you run by typing a command into a terminal, like \`python wordstat.py poem.txt --top 3\`. Everything after the program name are **arguments**: words that tell the program what to do. Some are **positional** (\`poem.txt\` — meaning comes from position), some are **options** that start with dashes (\`--top 3\`, \`-w\`), and options without values are called **flags**.`,
    py`Besides arguments, every program has three **standard streams**: **stdin** (input, usually the keyboard or a pipe), **stdout** (normal output) and **stderr** (error messages). When it finishes, it hands back an **exit code**: \`0\` means success, anything else means failure. Those four things — arguments, streams, exit code — are the whole contract between a CLI and the world.`,
    py`Python gives you the raw arguments in \`sys.argv\`. The standard-library module \`argparse\` turns them into named, typed values, and generates \`--help\` text and error messages for you. This lesson builds a small \`wc\`-style tool. (For the \`if __name__ == "__main__":\` part, see [scripts vs modules](lesson:main-guard-and-scripts).)`,
  ],
  why: [
    py`CLIs are how developers automate: build scripts, data-cleaning jobs, deployment tools, cron jobs, CI pipelines. A tool with proper arguments can be reused on any file, combined with other tools through pipes (\`cat log.txt | python errors.py | sort\`), and called from scripts that check its exit code.`,
    py`Hand-parsing \`sys.argv\` works for one argument and becomes a mess at three: optional values, defaults, type conversion, typo handling, help text. \`argparse\` gives you all of that consistently, in the style users already know from other Unix and Windows tools.`,
  ],
  eli15: [
    py`Running a program from the terminal is like ordering at a café counter: \`coffee large --oat-milk --extra-shot\`. The first word says *what* you want, the rest are details. Some details have a fixed place (size comes right after the drink), others are named (\`--oat-milk\`) so you can give them in any order — or leave them out and get the default.`,
    py`\`argparse\` is the barista who understands the order: it knows the menu, turns "large" into the right cup, says "sorry, we don't have --banana-milk, here's the menu" when you get it wrong, and recites the whole menu if you ask \`--help\`.`,
    py`When the order is done, the barista says "done!" (exit code 0) or "something went wrong" (any other number). Other programs listening can decide what to do next based on that answer.`,
  ],
  analogy: {
    title: 'A café order at the counter',
    body: [
      py`An order like \`latte large --oat-milk --shots 2\` has a required item, a size in a fixed position, and named extras with or without values. The menu board is the \`--help\` text. If you ask for something not on the menu, the barista tells you what *is* available instead of guessing.`,
      py`The kitchen has a hatch for the finished drink (stdout) and a separate window for complaints (stderr), so a delivery driver collecting drinks never picks up a complaint by mistake. At the end, the ticket is marked "served" or "problem" — the exit code.`,
    ],
    mapping: [
      ['the whole spoken order', 'the command line: python wordstat.py -w poem.txt'],
      ['the words as written on the ticket', 'sys.argv: a list of strings'],
      ['item and size in fixed order', 'positional arguments'],
      ['named extras: --oat-milk, --shots 2', 'options and flags'],
      ['the barista who understands orders', 'argparse.ArgumentParser'],
      ['the menu board', '--help, generated from your help= strings'],
      ['drinks hatch / complaints window', 'stdout / stderr'],
      ['"served" or "problem" on the ticket', 'exit code 0 / non-zero'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Everything a command-line program talks to',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'shell', label: '$ wordstat -w poem.txt', note: 'the command you type', x: 150, y: 55, tone: 'kraft' },
        { id: 'argv', label: "['wordstat', '-w', 'poem.txt']", note: 'sys.argv', x: 150, y: 165, tone: 'yellow' },
        { id: 'stdin', label: 'stdin', note: 'keyboard, file or pipe', x: 150, y: 275, tone: 'paper' },
        { id: 'prog', label: 'your program', note: 'argparse → args', x: 400, y: 165, tone: 'ink' },
        { id: 'stdout', label: 'stdout', note: 'results', x: 640, y: 80, tone: 'blue' },
        { id: 'stderr', label: 'stderr', note: 'errors, progress', x: 640, y: 175, tone: 'red' },
        { id: 'exit', label: 'exit code', note: '0 = success', x: 640, y: 270, tone: 'yellow' },
      ],
      edges: [
        { from: 'shell', to: 'argv', label: 'split into words' },
        { from: 'argv', to: 'prog', label: 'parse_args()' },
        { from: 'stdin', to: 'prog', label: 'sys.stdin' },
        { from: 'prog', to: 'stdout', label: 'print()' },
        { from: 'prog', to: 'stderr', label: 'print(file=sys.stderr)' },
        { from: 'prog', to: 'exit', label: 'sys.exit(code)' },
      ],
      steps: [
        { focus: ['shell'], text: py`You type a command. The **shell** (the program running in your terminal) splits it into words, handling quotes: \`"my file.txt"\` stays one word.` },
        { focus: ['argv'], edges: ['shell->argv'], text: py`Python receives those words as \`sys.argv\`, a **list of strings**. \`sys.argv[0]\` is the script's name; your arguments start at index 1. Everything is a string — \`"2"\`, not \`2\`.` },
        { focus: ['argv', 'prog'], edges: ['argv->prog'], text: py`\`argparse\` reads \`sys.argv[1:]\`, matches the words against what you declared, converts types and fills a \`Namespace\`: \`args.words == True\`, \`args.files == ['poem.txt']\`. Bad input never reaches your code: argparse prints a usage error and exits with code 2.` },
        { focus: ['stdin', 'prog'], edges: ['stdin->prog'], text: py`**stdin** delivers data that isn't in the arguments: typed text, a redirected file (\`< poem.txt\`) or the output of another program (\`cat poem.txt | wordstat\`).` },
        { focus: ['stdout', 'stderr'], edges: ['prog->stdout', 'prog->stderr'], text: py`Results go to **stdout**, problems to **stderr**. They're separate so that \`wordstat *.txt > counts.txt\` puts only counts in the file while errors still appear on screen.` },
        { focus: ['exit'], edges: ['prog->exit'], text: py`Finally the **exit code**: \`0\` for success, non-zero for failure. Shells and CI systems use it: \`wordstat poem.txt && echo ok\` only prints "ok" if the code was 0.` },
      ],
    },
    alt: 'Diagram: the typed command "$ wordstat -w poem.txt" is split into the list sys.argv, which parse_args() feeds into the program. stdin (keyboard, file or pipe) also flows into the program. The program writes results to stdout with print(), errors to stderr with print(file=sys.stderr), and returns an exit code with sys.exit, where 0 means success.',
  },
  syntax: [
    py`#### Raw arguments: sys.argv`,
    { code: py`import sys

# Run as:  python greet.py Ada 3
print(sys.argv)           # ['greet.py', 'Ada', '3'] — always strings
name = sys.argv[1]        # IndexError if the user forgot it!
times = int(sys.argv[2])  # ValueError if it isn't a number!
for _ in range(times):
    print(f"Hello, {name}!")`, lang: 'python', title: 'greet.py — hand-parsed (fragile)', static: true },
    py`That works until a user leaves something out, adds an option, or asks for help. All the checking is up to you. In this sandbox \`sys.argv\` is just \`['main.py']\`, because there is no terminal — which is why the runnable examples below pass their arguments to \`parse_args\` as a list.`,
    py`#### argparse: declare, then parse`,
    { code: py`import argparse

parser = argparse.ArgumentParser(prog="greet", description="Greet someone.")
parser.add_argument("name", help="who to greet")                          # positional
parser.add_argument("--times", type=int, default=1, help="repeat count")  # option with a value
parser.add_argument("-s", "--shout", action="store_true", help="use capitals")   # flag

args = parser.parse_args(["Ada", "--times", "2", "-s"])   # in a real script: parse_args()
print(args)              # Namespace(name='Ada', times=2, shout=True)
print(args.times + 1)    # 3 — already an int thanks to type=int`, lang: 'python', title: 'the three kinds of argument' },
    py`- **Positional** arguments have plain names (\`"name"\`) and are required by default.
- **Options** start with \`-\` or \`--\` and are optional by default. Give a short and a long form: \`"-s", "--shout"\`. The attribute name comes from the long form (\`args.shout\`; dashes become underscores).
- \`parse_args()\` with no argument reads \`sys.argv[1:]\`. Passing a list is how you **test** a parser — and how this sandbox simulates a terminal.`,
    py`#### The most useful add_argument settings`,
    py`| setting | example | effect |
|---|---|---|
| \`type=\` | \`type=int\`, \`type=float\`, \`type=pathlib.Path\` | convert the string (any one-argument callable works) |
| \`default=\` | \`default=10\` | value when the option is absent |
| \`help=\` | \`help="max lines (default: %(default)s)"\` | text for \`--help\`; \`%(default)s\` inserts the default |
| \`choices=\` | \`choices=["csv", "json"]\` | only allow these values |
| \`action="store_true"\` | \`--verbose\` | a flag: \`True\` if present, else \`False\` |
| \`action="count"\` | \`-vvv\` | how many times it appears (verbosity levels) |
| \`nargs=\` | \`"?"\`, \`"*"\`, \`"+"\`, \`2\` | optional, zero or more, one or more, exactly 2 values |
| \`required=True\` | for an option | make an option mandatory (use sparingly) |
| \`metavar=\` | \`metavar="N"\` | the placeholder name shown in help |
| \`dest=\` | \`dest="limit"\` | the attribute name on \`args\` |`,
    py`#### Free help and error messages`,
    { code: py`import argparse

parser = argparse.ArgumentParser(prog="greet", description="Greet someone.")
parser.add_argument("name", help="who to greet")
parser.add_argument("--times", type=int, default=1, help="how many times (default: %(default)s)")

try:
    parser.parse_args(["--times", "two", "Ada"])
except SystemExit as exc:          # argparse exits after printing the error
    print("exit code:", exc.code)`, lang: 'python', title: 'bad input: usage + error on stderr, exit code 2' },
    { code: py`usage: greet [-h] [--times TIMES] name
greet: error: argument --times: invalid int value: 'two'
exit code: 2`, lang: 'text', title: 'output' },
    py`\`-h\`/\`--help\` is added automatically: it prints the usage line, description and every argument's \`help\`, then exits with code 0. Errors print to **stderr** and exit with code **2**, the Unix convention for "you used the command wrong".`,
    { callout: 'version', title: 'Newer argparse features', text: py`\`argparse.BooleanOptionalAction\` (3.9) creates \`--cache/--no-cache\` pairs. \`add_argument(..., deprecated=True)\` (3.13) warns users of an old option. Python 3.14 added \`ArgumentParser(suggest_on_error=True)\`, which adds "maybe you meant 'green'?" hints for mistyped choices and subcommands, and coloured help output (\`color=True\` by default, used only when writing to a terminal).` },
    py`#### Exit codes: sys.exit and SystemExit`,
    { code: py`import sys

def main():
    if not ok:
        print("error: config file missing", file=sys.stderr)
        return 1          # failure
    return 0              # success

if __name__ == "__main__":
    sys.exit(main())      # same as: raise SystemExit(main())`, lang: 'python', title: 'the standard ending of a script', static: true },
    py`| how the program ends | exit code |
|---|---|
| runs off the end, or \`sys.exit()\` / \`sys.exit(0)\` | 0 |
| \`sys.exit(1)\` (any int) | that number |
| \`sys.exit("message")\` | prints the message to stderr, exit code 1 |
| an uncaught exception | prints the traceback, exit code 1 |
| argparse usage error | 2 |`,
    py`\`sys.exit\` works by raising the \`SystemExit\` exception, so \`finally\` blocks and \`with\` statements still clean up. Don't catch it with a bare \`except:\` — you'd swallow the exit.`,
    py`#### Standard input, output and error`,
    { code: py`import sys

for line_number, line in enumerate(sys.stdin, start=1):    # reads until end of input
    if not line.strip():
        print(f"warning: line {line_number} is empty", file=sys.stderr)
        continue
    print(line.strip().upper())`, lang: 'python', title: 'shout.py — a filter: stdin in, stdout out', static: true },
    { code: py`$ printf "hello\n\nworld\n" | python shout.py
HELLO
warning: line 2 is empty
WORLD
$ python shout.py < notes.txt > loud.txt     # stdin from a file, stdout to a file
$ echo $?                                    # exit code of the last command (bash/zsh)
0`, lang: 'bash', title: 'pipes and redirection in a terminal' },
    py`A program that reads stdin and writes stdout is called a **filter**, and filters can be chained with \`|\`. \`sys.stdin.read()\` reads everything at once; \`for line in sys.stdin\` streams line by line (better for big inputs); \`input()\` reads one line. In this sandbox, the **Input** tab plays the role of stdin.`,
    py`#### Subcommands (briefly)`,
    { code: py`import argparse

parser = argparse.ArgumentParser(prog="todo")
sub = parser.add_subparsers(dest="command", required=True)

add = sub.add_parser("add", help="add a task")
add.add_argument("title")
add.add_argument("--priority", choices=["low", "normal", "high"], default="normal")

done = sub.add_parser("done", help="mark a task as done")
done.add_argument("task_id", type=int)

print(parser.parse_args(["add", "Buy milk", "--priority", "high"]))
# Namespace(command='add', title='Buy milk', priority='high')
print(parser.parse_args(["done", "3"]))
# Namespace(command='done', task_id=3)`, lang: 'python', title: 'git-style commands: todo add …, todo done …' },
    py`Each subcommand gets its own parser, arguments and help (\`todo add --help\`). Dispatch on \`args.command\`, or attach a handler with \`add.set_defaults(func=add_task)\` and call \`args.func(args)\`.`,
  ],
  walkthrough: {
    title: 'Reading wordstat line by line',
    lang: 'python',
    code: WORDSTAT,
    intro: py`This is \`main.py\` from the playground below (it also has \`poem.txt\` and \`notes.txt\`). Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [7, 17], text: py`The parser is built in its own function, so tests and other code can reuse it. \`files\` is positional with \`nargs="*"\` (zero or more); \`-w/--words\` is a flag; \`--top\` takes an int and shows \`N\` in the help text.` },
      { lines: [20, 22], text: py`\`main(argv=None)\`: when \`argv\` is \`None\`, \`parse_args\` reads \`sys.argv[1:]\` — the real command line. Passing a list instead makes \`main\` easy to test and to call from other code.` },
      { lines: [23, 28], text: py`With no file names, \`args.files\` is an empty list, so \`or ["-"]\` substitutes \`"-"\`, the Unix convention for "standard input". Files are opened with an explicit encoding.` },
      { lines: [29, 32], text: py`A missing file isn't fatal: the error goes to **stderr**, the exit code is set to 1, and the loop carries on with the next file — the same behaviour as the real \`wc\` and \`cat\`.` },
      { lines: [33, 39], text: py`The report goes to **stdout**. \`Counter(...).most_common(args.top)\` returns the top N words; with the default \`0\` it returns an empty list, so nothing extra prints.` },
      { lines: [40], text: py`\`main\` **returns** an exit code instead of exiting. The caller decides: in a real script, \`raise SystemExit(main())\` passes it to the operating system.` },
      { lines: [43, 49], text: py`The sandbox has no terminal, so the program simulates four command lines by calling \`main\` with argument lists and printing the codes it returns.` },
    ],
  },
  playground: {
    title: 'wordstat: a tiny wc',
    objective: 'Run it, then add a flag, validate an option, read standard input and add --version.',
    files: { 'main.py': WORDSTAT, 'poem.txt': POEM, 'notes.txt': NOTES },
    stdin: 'to be or not to be\nthat is the question',
    expected: py`\`\`\`text
$ wordstat poem.txt
   2   13    67 poem.txt
[exit code 0]

$ wordstat -w poem.txt notes.txt
13 poem.txt
8 notes.txt
[exit code 0]

$ wordstat --top 2 poem.txt
   2   13    67 poem.txt
     4 x the
     2 x rain
[exit code 0]

$ wordstat missing.txt
wordstat: missing.txt: no such file
[exit code 1]
\`\`\`

The "no such file" line is written to **stderr**, which the output panel shows in a different colour.`,
    experiments: [
      {
        id: 'lines-flag',
        task: py`Add a \`-l\`/\`--lines\` flag that prints **only the line count** and the label (like \`-w\` does for words). Add a simulated run such as \`["-l", "poem.txt"]\` to the demo list.`,
        hint: py`Copy the \`--words\` argument, then add an \`elif args.lines:\` branch that prints \`len(text.splitlines()), label\`.`,
        tests: [
          { name: 'wordstat -l poem.txt prints "2 poem.txt"', code: py`out = capture(main, ["-l", "poem.txt"])
assert out.split() == ["2", "poem.txt"], out` },
        ],
        explain: py`\`action="store_true"\` makes \`args.lines\` \`False\` by default and \`True\` when the flag is present. Because you passed both \`"-l"\` and \`"--lines"\`, users can use either, and \`--help\` lists both automatically.`,
      },
      {
        id: 'positive-top',
        task: py`\`--top -3\` is accepted and does something odd. Write a type function \`positive_int(text)\` that converts to \`int\` and raises \`argparse.ArgumentTypeError("must be a positive number")\` for values below 1, and use it as \`type=positive_int\`.`,
        hint: py`Define it above \`build_parser\`:

\`\`\`python
def positive_int(text):
    value = int(text)
    if value < 1:
        raise argparse.ArgumentTypeError("must be a positive number")
    return value
\`\`\``,
        tests: [
          { name: '--top -3 is rejected with a usage error', code: py`with raises(SystemExit):
    main(["--top", "-3", "poem.txt"])` },
          { name: '--top 1 still works', code: py`assert "x the" in capture(main, ["--top", "1", "poem.txt"])` },
        ],
        explain: py`\`type=\` accepts any function that takes a string. When it raises \`ArgumentTypeError\` (or \`ValueError\`), argparse turns it into the standard \`usage: … error: argument --top: must be a positive number\` message and exit code 2 — your \`main\` never sees the bad value.`,
      },
      {
        id: 'stdin',
        task: py`Add a simulated run with **no files**, \`[]\`, to the demo list. It reads standard input — here, the text in the **Input** tab. Predict the counts first.`,
        hint: py`Add \`[]\` to the tuple of argument lists. \`" ".join([])\` is an empty string, so the echoed command is just \`$ wordstat\`.`,
        tests: [
          { name: 'the stdin run is reported', code: py`assert "(stdin)" in output, 'Add [] to the simulated command lines'` },
        ],
        explain: py`With no files, \`args.files\` is empty, the program falls back to \`"-"\` and reads \`sys.stdin\`. In a terminal that's what makes \`cat poem.txt | python wordstat.py\` and \`python wordstat.py < poem.txt\` work. Note that stdin can only be read once — a second \`"-"\` would get nothing.`,
      },
      {
        id: 'version',
        task: py`Add \`--version\` so that \`wordstat --version\` prints \`wordstat 1.0\` and exits with code 0. Use argparse's built-in \`action="version"\`.`,
        hint: py`parser.add_argument("--version", action="version", version="%(prog)s 1.0")`,
        tests: [
          { name: '--version prints the version and exits with 0', code: py`import contextlib
import io
buffer = io.StringIO()
code = None
with contextlib.redirect_stdout(buffer):
    try:
        main(["--version"])
    except SystemExit as exc:
        code = exc.code
assert code == 0 and "wordstat 1.0" in buffer.getvalue(), buffer.getvalue()` },
        ],
        explain: py`The \`version\` action prints the string (with \`%(prog)s\` replaced by the program name) and exits with code 0, just like \`--help\`. Don't call it in the demo loop, or the playground run will stop there.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'From a list of words to a Namespace',
    props: {
      code: py`import argparse
parser = argparse.ArgumentParser(prog="greet")
parser.add_argument("name")
parser.add_argument("--times", type=int, default=1)
parser.add_argument("--shout", action="store_true")
args = parser.parse_args(["Ada", "--times", "2"])
message = f"Hello, {args.name}!"
if args.shout:
    message = message.upper()
for _ in range(args.times):
    print(message)
`,
      notes: {
        2: 'The parser object will hold the rules you declare.',
        3: 'A positional argument: required, matched by position.',
        4: 'An option with a value; `type=int` converts the string "2" to the int 2.',
        5: 'A flag: `False` unless `--shout` appears.',
        6: 'Parsing a list here stands in for `sys.argv[1:]`. The result is a Namespace with one attribute per argument.',
        8: '`args.shout` is `False` because the flag was not given, so the message stays as it is.',
        10: '`args.times` is already an `int`, so it can go straight into `range()`.',
      },
    },
    alt: 'A step-by-step trace. An ArgumentParser is created and three arguments are declared: name, --times with type int and default 1, and the --shout flag. parse_args(["Ada", "--times", "2"]) returns a Namespace with name Ada, times 2 and shout False. The message "Hello, Ada!" is built and printed twice.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When you type a command, the **shell** splits it into words (respecting quotes), finds the program and starts it. Python stores those words in \`sys.argv\`. argparse then walks through the list: words starting with \`-\` are matched against declared options, and the rest are handed out to positional arguments in order.`,
      py`argparse doesn't call your code to report problems — it prints a usage message to stderr and **exits**. That's why bad input never reaches the rest of your program, and why testing an error case means expecting a \`SystemExit\`.`,
    ],
    technical: [
      py`**Parsing details.** Options can appear in any order and be interleaved with positionals. \`--times=2\` and \`--times 2\` are equivalent; short flags can be combined (\`-ws\`) and short options can take attached values (\`-n5\`). A lone \`--\` ends option parsing, so \`wordstat -- -weird-file-name.txt\` treats the rest as positionals. Unique prefixes of long options are accepted (\`--wor\` for \`--words\`) unless you pass \`allow_abbrev=False\` — turn that off for tools whose options may grow, so old abbreviations don't become ambiguous.`,
      py`**Types are just callables.** \`type=int\` calls \`int("2")\`. Any function works — \`pathlib.Path\`, \`datetime.date.fromisoformat\`, or your own. Raising \`ArgumentTypeError\` (or \`ValueError\`/\`TypeError\`) produces a clean usage error. Defaults that are strings are passed through \`type\` too.`,
      py`**Testing without exiting.** \`ArgumentParser(exit_on_error=False)\` (3.9+) makes some errors raise \`argparse.ArgumentError\` instead of exiting, which is handy when embedding a parser. Simplest of all: keep \`main(argv=None)\` and call it with lists in tests, catching \`SystemExit\` where you expect usage errors.`,
      py`**What "exit code" really is.** \`SystemExit(code)\` unwinds the stack like any exception (running \`finally\` blocks), and when it reaches the top, the interpreter shuts down and passes \`code\` to the operating system. Codes are small integers; on POSIX only 0–255 survive (\`sys.exit(256)\` looks like 0 to the shell), so stay in that range. Shells report 128 + signal number for programs killed by a signal, e.g. 130 after Ctrl+C (SIGINT) — Python raises \`KeyboardInterrupt\` for Ctrl+C, and if it isn't caught, the process exits that way.`,
      { callout: 'note', title: 'CPython detail', text: py`On start-up CPython builds \`sys.argv\` from the arguments the operating system passed, after removing interpreter options (\`python -X utf8 -u tool.py a b\` gives \`['tool.py', 'a', 'b']\`). With \`python -m pkg.tool\`, \`sys.argv[0]\` is the full path to the module file. \`sys.orig_argv\` (3.10+) keeps the original, complete list. Other implementations follow the same documented behaviour for \`sys.argv\`.` },
    ],
    production: [
      py`**Structure for testability.** Keep parsing (\`build_parser\`), logic (pure functions) and I/O (\`main\`) separate. \`main(argv=None) -> int\` returns an exit code; the module ends with \`if __name__ == "__main__": raise SystemExit(main())\`. Tests call \`main([...])\` or the pure functions directly.`,
      py`**Be a good Unix citizen.** Results on stdout, diagnostics on stderr, \`0\` only on success. Support \`-\` for stdin/stdout, \`--help\`, and \`--version\`. Never print progress bars or colours to a pipe (check \`sys.stdout.isatty()\`). Use [logging](lesson:logging) for diagnostics in larger tools, with \`-v\`/\`-q\` flags controlling the level.`,
      py`**Configuration precedence.** A common, predictable rule: command-line options override environment variables, which override a config file, which overrides built-in defaults.`,
      py`**Security.** Command-line arguments are visible to other users on the machine (\`ps\`) and end up in shell history and CI logs, so **never accept passwords or API tokens as arguments** — read them from environment variables, a file with restricted permissions, or a prompt with \`getpass\` (see [secrets & passwords](lesson:secrets-and-passwords)). And never paste arguments into shell commands: call \`subprocess.run([...])\` with a list, never \`shell=True\` with user input ([injection attacks](lesson:injection-attacks)).`,
      py`**Shipping it.** Declare a console script in \`pyproject.toml\` so \`pip install\` creates a real \`wordstat\` command — see [packaging](lesson:packaging). For big CLIs, third-party libraries such as Click and Typer offer decorators, nested commands and rich help; argparse remains the dependency-free standard.`,
      { code: py`[project.scripts]
wordstat = "wordstat.cli:main"   # pip creates a 'wordstat' command that calls main()`, lang: 'toml', title: 'pyproject.toml' },
    ],
  },
  mistakes: [
    {
      title: 'Forgetting that sys.argv holds strings',
      wrong: { code: py`import sys
limit = sys.argv[1]
print(limit * 2)        # "55" for input "5" — string repetition!`, lang: 'python', static: true },
      right: { code: py`import argparse
parser = argparse.ArgumentParser()
parser.add_argument("limit", type=int)
args = parser.parse_args(["5"])
print(args.limit * 2)   # 10`, lang: 'python' },
      explanation: py`Every element of \`sys.argv\` is a \`str\`. Convert explicitly — or let argparse's \`type=int\` do it, including a proper error message for non-numbers.`,
    },
    {
      title: 'Printing errors to stdout',
      wrong: { code: py`import sys
def main(path):
    print(f"error: {path} not found")   # ends up inside > output.csv
    return 1`, lang: 'python', static: true },
      right: { code: py`import sys
def main(path):
    print(f"error: {path} not found", file=sys.stderr)
    return 1
print("exit code", main("missing.csv"))`, lang: 'python' },
      explanation: py`When users redirect output (\`> results.csv\`) or pipe it into another program, anything on stdout becomes data. Errors and progress messages belong on stderr.`,
    },
    {
      title: 'Exiting with 0 after a failure',
      wrong: { code: py`import sys
def main():
    try:
        open("config.toml", encoding="utf-8")
    except FileNotFoundError:
        print("config missing", file=sys.stderr)
    # falls off the end: exit code 0 — CI thinks it passed`, lang: 'python', static: true },
      right: { code: py`import sys
def main():
    try:
        open("config.toml", encoding="utf-8")
    except FileNotFoundError:
        print("config missing", file=sys.stderr)
        return 1
    return 0
print("exit code", main())`, lang: 'python' },
      explanation: py`Scripts, Makefiles and CI pipelines only see the exit code. If a failure exits with 0, the next step runs as if nothing happened. Return (or \`sys.exit\`) a non-zero code on every failure path.`,
    },
    {
      title: 'Calling parse_args() at import time',
      wrong: { code: py`import argparse
parser = argparse.ArgumentParser()
parser.add_argument("path")
args = parser.parse_args()       # runs on import: tests and other modules break

def count_lines(path):
    ...`, lang: 'python', static: true },
      right: { code: py`import argparse

def build_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    return parser

def main(argv=None):
    args = build_parser().parse_args(argv)
    print("would count", args.path)
    return 0

if __name__ == "__main__":
    raise SystemExit(main(["notes.txt"]))   # real script: main()`, lang: 'python' },
      explanation: py`Module-level parsing makes the file impossible to import (it parses the *importer's* arguments and may exit). Parse inside \`main\`, behind the main guard — see [scripts vs modules](lesson:main-guard-and-scripts).`,
    },
    {
      title: 'Catching SystemExit by accident',
      wrong: { code: py`import sys
try:
    sys.exit(3)
except:                  # bare except also catches SystemExit
    print("something failed")   # the exit is swallowed`, lang: 'python' },
      right: { code: py`import sys
try:
    value = int("42")
except ValueError:       # catch only what you can handle
    print("not a number", file=sys.stderr)
    sys.exit(1)
print(value)`, lang: 'python' },
      explanation: py`\`SystemExit\` (and \`KeyboardInterrupt\`) inherit from \`BaseException\`, not \`Exception\`, precisely so that \`except Exception:\` doesn't catch them. A bare \`except:\` does — avoid it.`,
    },
    {
      title: 'Passing secrets as command-line arguments',
      wrong: { code: py`$ python deploy.py --api-token s3cr3t-token    # visible in ps, shell history, CI logs`, lang: 'bash' },
      right: { code: py`import os
import sys

token = os.environ.get("DEPLOY_TOKEN")
if not token:
    print("error: set DEPLOY_TOKEN", file=sys.stderr)
else:
    print("token loaded,", len(token), "characters")`, lang: 'python' },
      explanation: py`Arguments are not private. Read secrets from environment variables, a protected file, a secrets manager, or \`getpass.getpass()\` for interactive use.`,
    },
  ],
  debugging: [
    {
      symptom: py`IndexError: list index out of range (on sys.argv[1])`,
      cause: py`The script was run without the expected argument, and \`sys.argv\` only contains the script name.`,
      fix: py`Use argparse, which reports \`error: the following arguments are required: …\` with a usage line — or check \`len(sys.argv)\` and print usage to stderr.`,
    },
    {
      symptom: py`error: unrecognized arguments: --colr red`,
      cause: py`An option that wasn't declared — usually a typo, or an option given to the wrong subcommand.`,
      fix: py`Check \`--help\` for the exact spelling. In 3.14, \`ArgumentParser(suggest_on_error=True)\` adds "maybe you meant" hints for mistyped choices and subcommands.`,
    },
    {
      symptom: py`error: argument --times: invalid int value: 'two'`,
      cause: py`The \`type=\` converter rejected the value.`,
      fix: py`That's argparse working as intended. For friendlier rules, write a custom type function that raises \`argparse.ArgumentTypeError\` with a clear message.`,
    },
    {
      symptom: py`The script works when run directly, but importing it in a test runs it (or exits)`,
      cause: py`\`parse_args()\` or the main logic runs at module level instead of behind \`if __name__ == "__main__":\`.`,
      fix: py`Move everything into \`main(argv=None)\` and call it from the main guard.`,
    },
    {
      symptom: py`The program seems to hang, waiting for nothing`,
      cause: py`It is reading \`sys.stdin\` (for example because no file argument was given) and the terminal is waiting for you to type.`,
      fix: py`Type input and finish with Ctrl+D (Ctrl+Z then Enter on Windows), pass a file name, or pipe data in. Consider printing a hint to stderr when \`sys.stdin.isatty()\` is true.`,
    },
  ],
  bestPractices: [
    'Use argparse (or a library like Click) instead of hand-parsing sys.argv.',
    'Write main(argv=None) -> int, end the module with if __name__ == "__main__": raise SystemExit(main()), and test main with argument lists.',
    'Give every argument a help string; use type=, choices= and defaults so bad input fails early with a clear message.',
    'Results to stdout, errors and progress to stderr; exit 0 only on success.',
    'Accept "-" (or no file) to mean standard input so your tool works in pipes.',
    'Never take secrets as arguments, and never pass arguments to a shell with shell=True.',
    'Ship the tool as a console script via [project.scripts] in pyproject.toml.',
  ],
  useCases: [
    'Data-processing scripts: convert, filter or summarise files (python clean.py raw.csv -o clean.csv).',
    'Developer tooling: code generators, release scripts, database migrations.',
    'Unix-style filters that combine with grep, sort and other tools through pipes.',
    'Scheduled jobs and CI steps, where exit codes decide whether the pipeline continues.',
    'Admin tools with subcommands: tool users add, tool users list.',
  ],
  comparison: {
    title: 'sys.argv vs argparse',
    headers: ['', 'sys.argv by hand', 'argparse'],
    rows: [
      ['values', 'a list of strings; you index and convert', 'a Namespace of named, typed values'],
      ['optional arguments and defaults', 'write the logic yourself', 'default=, nargs=, action='],
      ['--help', 'write it yourself (and keep it up to date)', 'generated from your declarations'],
      ['bad input', 'IndexError / ValueError tracebacks unless you check', 'usage + clear error on stderr, exit code 2'],
      ['best for', 'a throwaway script with one argument', 'any tool someone else (or future you) will run'],
    ],
    note: py`Third-party Click and Typer build on the same ideas with decorators and type hints. They're excellent for large CLIs; argparse needs no installation.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'command-line-programs-q1',
      type: 'mcq',
      prompt: py`A user runs \`python report.py sales.csv --limit 5\`. What is \`sys.argv\`?`,
      options: [
        { text: "['sales.csv', '--limit', '5']", why: 'sys.argv[0] is always the script name; the arguments start at index 1.' },
        "['report.py', 'sales.csv', '--limit', '5']",
        { text: "['report.py', 'sales.csv', '--limit', 5]", why: 'The operating system passes text: every element of sys.argv is a str, including "5".' },
        { text: "['python', 'report.py', 'sales.csv', '--limit', '5']", why: 'The interpreter name is not part of sys.argv (see sys.orig_argv for the full original command).' },
      ],
      answer: 1,
      explanation: py`\`sys.argv[0]\` is the script name and the rest are the arguments, all as strings. argparse works on \`sys.argv[1:]\`.`,
    },
    {
      id: 'command-line-programs-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import argparse
parser = argparse.ArgumentParser()
parser.add_argument("name")
parser.add_argument("--times", type=int, default=1)
parser.add_argument("--shout", action="store_true")
args = parser.parse_args(["--times", "3", "Ada"])
print(args.name, args.times * 2, args.shout)`,
      answer: 'Ada 6 False',
      accept: ['Ada 6 False'],
      explanation: py`Options can come before positionals. \`type=int\` turns \`"3"\` into \`3\`, so \`args.times * 2\` is \`6\`. \`--shout\` wasn't given, so the \`store_true\` flag is \`False\`.`,
    },
    {
      id: 'command-line-programs-q3',
      type: 'output',
      prompt: 'Which exit code does the operating system see when this script ends?',
      code: py`import sys

def main():
    print("checking files...")
    sys.exit("error: no input files")

main()`,
      options: [
        { text: '0', why: 'sys.exit with a string is a failure: the message goes to stderr and the code is 1.' },
        '1',
        { text: '2', why: '2 is argparse\'s convention for usage errors; sys.exit("…") uses 1.' },
        { text: 'The script crashes with a TypeError', why: 'sys.exit accepts a string: it prints it to stderr and exits with status 1.' },
      ],
      answer: 1,
      explanation: py`\`sys.exit(some_string)\` prints the string to stderr and exits with code 1. \`sys.exit()\`/\`sys.exit(0)\` mean success; \`sys.exit(n)\` uses \`n\`.`,
    },
    {
      id: 'command-line-programs-q4',
      type: 'bug',
      prompt: 'Running `python counts.py data.txt > counts.csv` produces a CSV file that sometimes contains error messages. Click the buggy line.',
      code: py`import sys

def main(path):
    try:
        with open(path, encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"error: {path} not found")
        return 1
    print(f"{path},{len(lines)}")
    return 0`,
      answerLine: 8,
      explanation: py`Line 8 prints the error to **stdout**, so it is redirected into \`counts.csv\` together with the data. It should be \`print(..., file=sys.stderr)\`.`,
    },
    {
      id: 'command-line-programs-q5',
      type: 'fill',
      prompt: 'Complete the argument declarations so `-v` is a flag (True/False) and `--format` only accepts "csv" or "json".',
      code: py`import argparse
parser = argparse.ArgumentParser()
parser.add_argument("-v", "--verbose", action="___")
parser.add_argument("--format", ___=["csv", "json"], default="csv")`,
      answer: [['store_true'], ['choices']],
      explanation: py`\`action="store_true"\` stores \`True\` when the flag is present and \`False\` otherwise. \`choices=[...]\` restricts the value; anything else produces \`error: argument --format: invalid choice\` and exit code 2.`,
    },
    {
      id: 'command-line-programs-q6',
      type: 'mcq',
      prompt: 'Why do well-behaved command-line tools write error messages to stderr instead of stdout?',
      options: [
        { text: 'stderr is faster', why: 'Speed is not the reason; stderr is often unbuffered, but that is a side detail.' },
        'So errors stay visible and don\'t mix with the data when stdout is redirected or piped',
        { text: 'print() cannot write errors to stdout', why: 'It can — that is exactly the bug this practice prevents.' },
        { text: 'stderr automatically sets the exit code to 1', why: 'Writing to stderr does not change the exit code; you still have to return or exit with a non-zero code.' },
      ],
      answer: 1,
      explanation: py`Pipes and redirection (\`|\`, \`>\`) capture stdout only. Keeping diagnostics on stderr means the next program (or file) receives clean data while humans still see the messages.`,
    },
    {
      id: 'command-line-programs-q7',
      type: 'short',
      prompt: 'Why is `def main(argv=None) -> int` plus `raise SystemExit(main())` a good structure for a CLI?',
      answer: py`It separates the command-line plumbing from the logic. Because main accepts argv, tests (and other code) can call main(["--flag", "file.txt"]) without touching sys.argv, and because it returns an int instead of exiting, tests can simply check the returned code. parse_args(None) still reads the real sys.argv[1:] when run from a terminal, and raise SystemExit(main()) hands the return value to the operating system as the exit code. Putting that call behind if __name__ == "__main__": also means importing the module doesn't run the program.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'todo-parser',
      title: 'A parser for "todo add"',
      difficulty: 'intermediate',
      prompt: py`Write \`build_parser()\` that returns an \`argparse.ArgumentParser\` (with \`prog="todo"\`) accepting:

- a positional \`title\`;
- \`-p\` / \`--priority\` with the choices \`low\`, \`normal\`, \`high\` and default \`normal\`;
- \`--tags\` taking **zero or more** values, defaulting to an empty list;
- a flag \`--urgent\` (\`False\` unless given).

\`\`\`text
parse_args(["Buy milk"])
  -> title='Buy milk', priority='normal', tags=[], urgent=False
parse_args(["Fix bug", "-p", "high", "--tags", "work", "code", "--urgent"])
  -> title='Fix bug', priority='high', tags=['work', 'code'], urgent=True
parse_args(["Nap", "--priority", "extreme"])
  -> usage error (SystemExit with code 2)
\`\`\``,
      files: {
        'main.py': py`import argparse


def build_parser():
    parser = argparse.ArgumentParser(prog="todo")
    parser.add_argument("title", help="what needs doing")
    # TODO: add --priority, --tags and --urgent
    return parser


print(build_parser().parse_args(["Buy milk"]))
`,
      },
      hints: [
        'Options are declared with both forms: add_argument("-p", "--priority", ...). choices= restricts the values.',
        'nargs="*" accepts zero or more values; combine it with default=[] so the attribute is a list even when --tags is absent. A flag is action="store_true".',
        'parser.add_argument("-p", "--priority", choices=["low", "normal", "high"], default="normal")\nparser.add_argument("--tags", nargs="*", default=[])\nparser.add_argument("--urgent", action="store_true")',
      ],
      solution: {
        explanation: py`\`choices\` makes argparse validate the priority for you: anything else prints \`error: argument -p/--priority: invalid choice: 'extreme'\` and exits with code 2. \`nargs="*"\` collects all following words that don't start with \`-\` into a list, so \`--tags work code --urgent\` stops at \`--urgent\`; \`default=[]\` keeps the attribute a list when the option is missing. (argparse doesn't mutate that default list, so the usual mutable-default worry doesn't apply here.) \`action="store_true"\` is the standard on/off flag.`,
        files: {
          'main.py': py`import argparse


def build_parser():
    parser = argparse.ArgumentParser(prog="todo")
    parser.add_argument("title", help="what needs doing")
    parser.add_argument("-p", "--priority", choices=["low", "normal", "high"], default="normal",
                        help="how important it is (default: %(default)s)")
    parser.add_argument("--tags", nargs="*", default=[], help="labels for the task")
    parser.add_argument("--urgent", action="store_true", help="flag the task as urgent")
    return parser


print(build_parser().parse_args(["Fix bug", "-p", "high", "--tags", "work", "code", "--urgent"]))
`,
        },
      },
      tests: [
        { name: 'defaults for a plain title', code: py`args = build_parser().parse_args(["Buy milk"])
assert (args.title, args.priority, args.tags, args.urgent) == ("Buy milk", "normal", [], False)` },
        { name: 'all options together', code: py`args = build_parser().parse_args(["Fix bug", "-p", "high", "--tags", "work", "code", "--urgent"])
assert (args.title, args.priority, args.tags, args.urgent) == ("Fix bug", "high", ["work", "code"], True)` },
        { name: 'long form --priority works', code: py`assert build_parser().parse_args(["Nap", "--priority", "low"]).priority == "low"` },
        { name: 'an invalid priority is a usage error', code: py`with raises(SystemExit):
    build_parser().parse_args(["Nap", "--priority", "extreme"])` },
      ],
    },
    {
      id: 'total-filter',
      title: 'A "total" filter with exit codes',
      difficulty: 'intermediate',
      prompt: py`Write \`main(argv=None, stdin=None)\` for a filter called \`total\` that reads numbers, one per line, from \`stdin\` (or \`sys.stdin\` when \`stdin\` is \`None\`):

- blank lines are ignored;
- by default it prints the **sum**; with \`--average\` it prints the **mean**; print the value with \`f"{value:g}"\` (so \`6.0\` prints as \`6\`);
- on a line that isn't a number, print \`total: line N: not a number: 'TEXT'\` to **stderr** (N counts from 1, TEXT is the stripped line) and **return 1** without printing a result;
- \`--average\` with no numbers prints \`total: no numbers\` to **stderr** and returns 1;
- otherwise return 0.

Tests call \`main([...], io.StringIO("..."))\` directly.`,
      files: {
        'main.py': py`import argparse
import sys


def main(argv=None, stdin=None):
    parser = argparse.ArgumentParser(prog="total", description="Add up numbers from stdin.")
    parser.add_argument("--average", action="store_true", help="print the mean instead of the sum")
    args = parser.parse_args(argv)
    stdin = sys.stdin if stdin is None else stdin

    numbers = []
    for line in stdin:
        numbers.append(float(line))          # TODO: skip blanks, report bad lines, count lines
    print(f"{sum(numbers):g}")               # TODO: --average and the empty case
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`,
      },
      hints: [
        'enumerate(stdin, start=1) gives you line numbers. Strip each line, and continue if it is empty.',
        'Wrap float(text) in try/except ValueError; in the except block print the message with file=sys.stderr and return 1.',
        'After the loop: if args.average: if not numbers: (error, return 1); value = sum(numbers) / len(numbers); else value = sum(numbers). Then print(f"{value:g}") and return 0.',
      ],
      solution: {
        explanation: py`\`main\` takes \`argv\` and \`stdin\` as parameters (defaulting to the real ones), which makes it testable with plain lists and \`io.StringIO\` — no terminal needed. Each line is stripped; blank lines are skipped. A bad line prints a precise message to **stderr** (so a pipeline's data stream stays clean) and returns 1 immediately, so no misleading partial result appears on stdout. \`--average\` guards against dividing by zero with its own error. \`:g\` drops a pointless \`.0\`. The final \`raise SystemExit(main())\` behind the main guard hands the return value to the operating system as the exit code.`,
        files: {
          'main.py': py`import argparse
import sys


def main(argv=None, stdin=None):
    parser = argparse.ArgumentParser(prog="total", description="Add up numbers from stdin.")
    parser.add_argument("--average", action="store_true", help="print the mean instead of the sum")
    args = parser.parse_args(argv)
    stdin = sys.stdin if stdin is None else stdin

    numbers = []
    for line_number, line in enumerate(stdin, start=1):
        text = line.strip()
        if not text:
            continue
        try:
            numbers.append(float(text))
        except ValueError:
            print(f"total: line {line_number}: not a number: {text!r}", file=sys.stderr)
            return 1

    if args.average:
        if not numbers:
            print("total: no numbers", file=sys.stderr)
            return 1
        value = sum(numbers) / len(numbers)
    else:
        value = sum(numbers)
    print(f"{value:g}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`,
        },
      },
      tests: [
        { name: 'sums the numbers', code: py`import io
assert capture(main, [], io.StringIO("1\n2\n3\n")) == "6\n"` },
        { name: '--average prints the mean', code: py`import io
assert capture(main, ["--average"], io.StringIO("1\n2\n3\n4\n")) == "2.5\n"` },
        { name: 'blank lines are ignored', code: py`import io
assert capture(main, [], io.StringIO("10\n\n  \n5\n")) == "15\n"` },
        { name: 'a bad line returns 1 with a message on stderr', code: py`import contextlib
import io
err = io.StringIO()
with contextlib.redirect_stderr(err):
    code = main([], io.StringIO("1\n2\nabc\n"))
assert code == 1 and "line 3: not a number: 'abc'" in err.getvalue(), err.getvalue()` },
        { name: 'nothing is printed to stdout on error', code: py`import io
assert capture(main, [], io.StringIO("1\nx\n")) == ""` },
        { name: '--average with no numbers returns 1', code: py`import contextlib
import io
with contextlib.redirect_stderr(io.StringIO()):
    assert main(["--average"], io.StringIO("")) == 1` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'command-line-programs-argv-vs-argparse',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'When would you use sys.argv directly, and when argparse?',
      answer: 'sys.argv is the raw list of strings — fine for a throwaway script with one obvious argument. For anything others will run, use argparse: named and optional arguments, type conversion, defaults, choices, generated --help, and consistent usage errors with exit code 2.',
      explanation: py`Hand-parsing grows into fragile code: index errors when arguments are missing, manual \`int()\` calls, ad-hoc \`--flag\` detection, help text that drifts out of date. argparse is declarative: you describe the interface once and get parsing, validation and documentation. Libraries such as Click or Typer go further for large CLIs but add a dependency.`,
      whyAsked: 'A practical judgement question about tooling.',
      mistakes: ['Saying argparse is overkill for every script', 'Forgetting sys.argv values are strings', 'Not knowing argparse exits on errors'],
      followUps: ['How do you test an argparse parser?', 'What exit code does argparse use for usage errors?'],
      modelAnswer: 'sys.argv is just the list of words from the command line, all strings, with the script name first. I would only use it directly for a quick personal script with one argument. Anything someone else will run gets argparse: I declare positional arguments and options with types, defaults and choices, and in return I get parsing in any order, conversion, a generated --help, and consistent error messages that exit with code 2. It also makes the interface self-documenting. For very large CLIs I might reach for Click or Typer, but argparse needs no dependency.',
    },
    {
      id: 'command-line-programs-exit-codes',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What are exit codes, how do you set them in Python, and why do they matter?',
      answer: 'An exit code is the integer a process returns to its parent: 0 for success, non-zero for failure. Python exits with 0 normally, 1 on an uncaught exception, n with sys.exit(n), 1 with sys.exit("message") (message to stderr), and argparse uses 2 for usage errors. Shells (&&, ||, set -e), Makefiles, cron and CI use them to decide what happens next.',
      explanation: py`\`sys.exit\` raises \`SystemExit\`, so cleanup code runs. The value is passed to the OS when the interpreter exits; on POSIX only 0–255 is meaningful. A tool that prints an error but exits 0 silently breaks pipelines — the next CI step runs on bad data. Some tools define a small table of codes (e.g. 1 = findings, 2 = usage error) so callers can distinguish outcomes.`,
      code: { lang: 'bash', code: py`$ python check.py data.csv && python upload.py data.csv   # upload only if check exits 0
$ python check.py data.csv; echo "exit code: $?"` },
      whyAsked: 'CLI tools live in automation; exit codes are how automation knows what happened.',
      mistakes: ['Returning 0 after printing an error', 'Using codes above 255', 'Catching SystemExit with a bare except'],
      followUps: ['Why is SystemExit not a subclass of Exception?', 'What exit code does a program killed by Ctrl+C get?'],
      modelAnswer: 'An exit code is the small integer a process hands back to whoever started it: zero means success, anything else means failure. In Python a program exits with zero if it just finishes, one if an exception goes uncaught, whatever number I pass to sys.exit, and one with the message on stderr if I pass a string. argparse uses two for usage errors. They matter because automation reads nothing else: && in a shell, set -e, Makefiles and CI pipelines all decide whether to continue based on that code, so a tool that prints an error but exits zero can let a broken build or bad data through.',
    },
    {
      id: 'command-line-programs-stdout-stderr',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A teammate\'s export script is used as `python export.py > users.csv`. Sometimes users.csv contains lines like "Warning: 3 rows skipped". What is wrong and how do you fix it?',
      answer: 'The warnings are printed to stdout, which is redirected into the file. Diagnostics must go to stderr — print(..., file=sys.stderr) or the logging module (which writes to stderr by default) — so stdout carries only data.',
      explanation: py`The shell's \`>\` redirects file descriptor 1 (stdout) only; stderr (descriptor 2) still goes to the terminal, or can be redirected separately with \`2> errors.log\`. Mixing the two corrupts machine-readable output for every consumer — files, pipes into \`sort\` or \`jq\`, other programs. \`logging.basicConfig()\` writes to stderr by default, which makes it a natural choice for warnings and progress.`,
      whyAsked: 'Tests understanding of how CLI tools compose — a frequent real-world bug.',
      mistakes: ['Suggesting to filter the warning lines out afterwards', 'Removing the warnings instead of moving them'],
      followUps: ['How would you capture both streams into separate files?', 'Should progress bars go to stdout?'],
      modelAnswer: 'The warnings are going to standard output, and the shell redirect only captures standard output, so they end up inside the CSV next to the data. The fix is to send every diagnostic to standard error, either with print(..., file=sys.stderr) or with the logging module, which writes to stderr by default. Then users.csv contains only data, the warnings still appear on screen, and anyone who wants them can redirect stderr separately with 2> warnings.log.',
    },
    {
      id: 'command-line-programs-port-type',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write an argparse type function `port(text)` that returns an int between 1 and 65535 and raises argparse.ArgumentTypeError otherwise (including for non-numbers). Then `build_parser()` should return a parser with `--port` using it, default 8000.',
      answer: 'Convert with int() inside try/except ValueError, check the range, raise argparse.ArgumentTypeError with a helpful message, return the int; declare --port with type=port and default=8000.',
      explanation: py`A type function receives the raw string and either returns the converted value or raises. \`ArgumentTypeError\`'s message is shown verbatim in the usage error (\`error: argument --port: 70000 is not between 1 and 65535\`). Converting \`ValueError\` into \`ArgumentTypeError\` gives a clearer message than argparse's generic "invalid port value". Keeping \`port\` a standalone function makes it unit-testable without parsing anything.`,
      starter: { files: { 'main.py': py`import argparse


def port(text):
    # TODO: int between 1 and 65535, else raise argparse.ArgumentTypeError
    return int(text)


def build_parser():
    parser = argparse.ArgumentParser(prog="serve")
    parser.add_argument("--port", type=port, default=8000)
    return parser


print(build_parser().parse_args(["--port", "8080"]))
` } },
      tests: [
        { name: 'accepts a valid port', code: py`assert port("8080") == 8080` },
        { name: 'rejects 0 and 70000', code: py`import argparse
for bad in ["0", "70000"]:
    with raises(argparse.ArgumentTypeError):
        port(bad)` },
        { name: 'rejects text', code: py`import argparse
with raises(argparse.ArgumentTypeError):
    port("http")` },
        { name: 'the parser uses it with default 8000', code: py`assert build_parser().parse_args([]).port == 8000
assert build_parser().parse_args(["--port", "443"]).port == 443` },
        { name: 'the parser exits on a bad port', code: py`with raises(SystemExit):
    build_parser().parse_args(["--port", "70000"])` },
      ],
      solution: { files: { 'main.py': py`import argparse


def port(text):
    try:
        value = int(text)
    except ValueError:
        raise argparse.ArgumentTypeError(f"{text!r} is not a number") from None
    if not 1 <= value <= 65535:
        raise argparse.ArgumentTypeError(f"{value} is not between 1 and 65535")
    return value


def build_parser():
    parser = argparse.ArgumentParser(prog="serve")
    parser.add_argument("--port", type=port, default=8000)
    return parser


print(build_parser().parse_args(["--port", "8080"]))
` } },
      hints: ['int("http") raises ValueError — catch it and raise ArgumentTypeError instead.', 'A chained comparison checks the range neatly: 1 <= value <= 65535.'],
      whyAsked: 'Shows you know argparse beyond the basics and design validation as small testable functions.',
      mistakes: ['Validating after parse_args with ad-hoc prints', 'Letting ValueError escape with a vague message', 'Raising a generic Exception'],
      followUps: ['Why does the default 8000 not need to go through port()?', 'How would you accept "auto" as well as numbers?'],
      modelAnswer: 'argparse calls the type function with the raw string, so port converts it with int inside a try block and turns a ValueError into an ArgumentTypeError with a clear message. Then it checks the range with a chained comparison and raises ArgumentTypeError if it is outside 1 to 65535, otherwise it returns the int. argparse turns that exception into a normal usage error with exit code 2. In build_parser I declare --port with type=port and default 8000. Because port is a plain function, I can unit-test it on its own.',
    },
    {
      id: 'command-line-programs-secrets',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A deployment script takes `--db-password` on the command line, and a CI job calls it with a password from the CI secrets store. Why is this a problem and what would you do instead?',
      answer: 'Command-line arguments are visible to other users and processes (ps, /proc/<pid>/cmdline), often logged by CI systems and shells, and stored in shell history. Pass secrets through environment variables (CI secret injection), a file with restricted permissions, a secrets manager, or getpass for interactive use; never echo them in logs.',
      explanation: py`On most Unix systems any user can list running processes with their full command lines. CI systems may print the commands they run, and shells save history. Environment variables aren't perfect — they're inherited by child processes and visible to the same user — but they avoid the widest leaks, and most CI secret stores mask them in logs. Better still is a secret file mounted with \`0600\` permissions or a secrets manager API. For humans, \`getpass.getpass()\` reads without echoing. Also avoid \`shell=True\` when passing any argument on to subprocesses.`,
      code: { lang: 'python', code: py`import getpass
import os
import sys

def get_db_password():
    password = os.environ.get("DB_PASSWORD")
    if password:
        return password
    if sys.stdin.isatty():
        return getpass.getpass("Database password: ")
    raise SystemExit("error: set DB_PASSWORD or run interactively")`, static: true },
      whyAsked: 'Security awareness in everyday tooling; a common audit finding.',
      mistakes: ['Thinking a private CI runner makes it safe', 'Logging the full command for debugging', 'Base64-encoding the password as "protection"'],
      followUps: ['What are the risks of environment variables?', 'How would you rotate a leaked secret?'],
      modelAnswer: 'Command-line arguments are not private. Other users and processes on the machine can see full command lines through ps, CI systems often log the commands they run, and shells keep history, so the password can leak in several places. I would read it from an environment variable that the CI secret store injects and masks, or better from a file with tight permissions or a secrets manager. For interactive use I would prompt with getpass so it is never echoed. And I would make sure the script never prints the secret, and never passes arguments through a shell.',
    },
    {
      id: 'command-line-programs-subcommands',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you structure a Python CLI with several subcommands (like git: `tool add`, `tool list`, `tool export`) so that it stays maintainable and testable?',
      answer: 'One top-level parser with add_subparsers(dest="command", required=True); each subcommand gets its own parser built in its own module, with set_defaults(func=handler). main(argv=None) parses, calls args.func(args) and returns its exit code. Handlers call pure functions that hold the logic; tests call main([...]) and the pure functions directly. Ship it with a console-script entry point.',
      explanation: py`\`set_defaults(func=...)\` binds each subparser to its handler, avoiding a long \`if args.command == ...\` chain. Splitting each command's parser-building and handler into a module keeps files small. Shared options (\`--verbose\`, \`--config\`) can live on a parent parser passed via \`parents=[...]\`. Logic stays free of argparse so it can be reused by a web API or tests. For very large CLIs, Click or Typer provide the same structure with decorators.`,
      code: { lang: 'python', code: py`import argparse

def cmd_add(args):
    print(f"added {args.title!r}")
    return 0

def cmd_list(args):
    print("listing", "all" if args.all else "open", "tasks")
    return 0

def build_parser():
    parser = argparse.ArgumentParser(prog="todo")
    sub = parser.add_subparsers(dest="command", required=True)
    add = sub.add_parser("add", help="add a task")
    add.add_argument("title")
    add.set_defaults(func=cmd_add)
    lst = sub.add_parser("list", help="list tasks")
    lst.add_argument("--all", action="store_true")
    lst.set_defaults(func=cmd_list)
    return parser

def main(argv=None):
    args = build_parser().parse_args(argv)
    return args.func(args)

print(main(["add", "Buy milk"]), main(["list", "--all"]))` },
      whyAsked: 'Assesses design skills for real tools: decomposition, testability and distribution.',
      mistakes: ['One giant function with if/elif on the command name', 'Business logic that depends on the argparse Namespace', 'Parsing at import time'],
      followUps: ['How would you share --verbose across all subcommands?', 'When would you switch to Click or Typer?'],
      modelAnswer: 'I would have one top-level parser with add_subparsers, marked required, and give each subcommand its own small parser, ideally built next to its handler in its own module. Each subparser uses set_defaults(func=handler), so main just parses and calls args.func(args), returning the handler\'s exit code. Handlers translate arguments into calls to plain functions that hold the real logic and know nothing about argparse, which makes them reusable and easy to test. Shared options like --verbose go on a parent parser. Tests call main with argument lists, and I would ship it through a console-script entry point in pyproject.toml.',
    },
    {
      id: 'command-line-programs-argv-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A script contains `import sys; print(len(sys.argv), sys.argv[-1] * 2)` and is run as `python echo.py "two words" 3`. What does it print?',
      options: ['3 6', '3 33', '4 33', '2 6'],
      correctOption: 1,
      answer: '3 33 — sys.argv is [\'echo.py\', \'two words\', \'3\']: the shell keeps the quoted text as one argument, and "3" is a string, so "3" * 2 is "33".',
      explanation: py`The shell strips the quotes and passes \`two words\` as a single argument, so there are three elements including the script name. Every element is a \`str\`, and string repetition doubles the text. argparse's \`type=int\` avoids exactly this kind of bug.`,
      whyAsked: 'Checks two basics at once: how the shell splits arguments and that argv values are strings.',
      mistakes: ['Counting "two words" as two arguments', 'Assuming "3" arrives as an int'],
      followUps: ['How would you pass an argument that starts with a dash, like a negative number or a file named -x?', 'What does sys.orig_argv contain?'],
      modelAnswer: 'It prints 3 33. The shell removes the quotes but keeps "two words" together as one argument, so sys.argv is the script name, two words, and 3 — three elements. And everything in sys.argv is a string, so the last element is the text "3", and multiplying a string by two repeats it, giving 33. That is exactly why I let argparse convert values with type=int.',
    },
  ],

  takeaways: [
    'A CLI\'s contract is arguments in (sys.argv, a list of strings), streams (stdin, stdout, stderr) and an exit code (0 = success).',
    'argparse declares positionals, options and flags with type=, default=, choices=, action= and nargs=, and generates --help and usage errors (exit code 2).',
    'Pass a list to parse_args to test a parser (and to simulate a command line in this sandbox); parse_args() with no argument reads sys.argv[1:].',
    'Results go to stdout, diagnostics to stderr; return or sys.exit a non-zero code on every failure path.',
    'Structure scripts as main(argv=None) -> int with if __name__ == "__main__": raise SystemExit(main()).',
    'Never put secrets in arguments or pass arguments to a shell; ship tools as console scripts via pyproject.toml.',
  ],
}
