// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WHERE_AM_I = py`# Where is my code running?
import sys
import platform

print("Python version:", platform.python_version())
print("Implementation:", platform.python_implementation())
print("Platform:", sys.platform)
print("Major/minor:", sys.version_info.major, sys.version_info.minor)

if sys.platform == "emscripten":
    print("You're in the browser: CPython compiled to WebAssembly (Pyodide).")
else:
    print("You're on a regular computer.")
`

export default {
  id: 'setup-and-running',
  title: 'Installing Python, the REPL & running scripts',
  summary: 'Install CPython, check which version you have, experiment in the interactive REPL, and run saved scripts with python main.py — on your computer or in this browser playground.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['what-is-programming'],
  related: ['first-program', 'reading-errors', 'virtual-environments', 'pip-and-dependencies', 'command-line-programs', 'modules-and-imports'],
  tags: ['install', 'installation', 'setup', 'python3', 'py launcher', 'version', 'REPL', 'interactive', 'shell', 'terminal', 'command line', 'PATH', 'script', 'VS Code', 'editor', 'Pyodide', 'WebAssembly', 'emscripten', 'sys.version'],
  apis: [
    { name: 'python3 --version / py --version', summary: 'Prints the version of the interpreter that the command starts, e.g. Python 3.14.0.' },
    { name: 'python3 main.py', summary: 'Runs the script main.py from the current folder.' },
    { name: 'python3 -i / -c / -m', summary: '-i stays in the REPL after a script, -c runs a string of code, -m runs a module as a script.' },
    { name: 'sys.version_info', summary: 'The running interpreter’s version as a comparable tuple-like object: (3, 14, 0, \'final\', 0).' },
    { name: 'sys.platform', summary: 'A short platform name: \'linux\', \'darwin\' (macOS), \'win32\', or \'emscripten\' in the browser.' },
    { name: 'sys.executable', summary: 'Path of the Python program that is running your code — answers "which Python am I using?".' },
    { name: 'platform.python_version()', summary: 'The version as a string, e.g. \'3.14.2\'.' },
  ],
  docs: [
    { label: 'Python setup and usage (all platforms)', url: 'https://docs.python.org/3/using/index.html' },
    { label: 'Using Python on Windows (installers and the py launcher)', url: 'https://docs.python.org/3/using/windows.html' },
    { label: 'Tutorial — Using the Python interpreter', url: 'https://docs.python.org/3/tutorial/interpreter.html' },
    { label: 'Command line and environment options', url: 'https://docs.python.org/3/using/cmdline.html' },
    { label: 'What’s New in Python 3.13 — the new interactive interpreter', url: 'https://docs.python.org/3/whatsnew/3.13.html#a-better-interactive-interpreter' },
    { label: 'Pyodide documentation', url: 'https://pyodide.org/en/stable/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`To run Python on your own computer you need the **interpreter** — the program (usually CPython) that reads and executes Python code, as you saw in [what programming is](lesson:what-is-programming). Once it's installed, there are two everyday ways to use it:`,
    py`- the **REPL** (*Read–Eval–Print Loop*): an interactive prompt, \`>>>\`, where you type one line, Python runs it and shows the result immediately. Perfect for quick experiments;
- **scripts**: code saved in a \`.py\` file and run with a command like \`python3 main.py\`. That's how real programs are written, shared and re-run.`,
    py`You'll type those commands in a **terminal** (also called a *command line* or *shell*): a text window where you control the computer by typing commands instead of clicking. This course's playground skips the installation step entirely: it runs real CPython **inside your browser**. By the end of this lesson you'll know exactly what that means, and what it can't do.`,
  ],
  why: [
    py`Every Python project starts with "which Python am I running, and how do I run my code?" Getting this right early saves hours of confusion later — most "Python doesn't work" problems are really "the wrong Python is running" or "I'm in the wrong folder".`,
    py`The REPL is a programmer's scratchpad: you can check how a function behaves, test a tiny idea or do quick maths in seconds. Scripts are how you keep work, run it again tomorrow, share it and eventually test it. Professionals use both every day.`,
  ],
  eli15: [
    py`Think of Python like a calculator app with a superpower.`,
    py`The **REPL** is using the calculator live: you type \`2 + 3\`, it shows \`5\` right away. Fast and fun, but when you close it, everything you typed is gone.`,
    py`A **script** is writing all your steps on a piece of paper first, then handing the whole page to the calculator: "do all of this". The page (your \`.py\` file) stays saved, so you can run it again, change one number, or give it to a friend.`,
    py`**Installing Python** just means putting that calculator on your computer. And this website? It already has one built in — a full Python running inside your web browser, like a game that runs in a tab instead of being installed.`,
  ],
  analogy: {
    title: 'Chatting with a chef vs handing over a recipe',
    body: [
      py`At a cooking class you can **chat with the chef**: "what happens if I add salt now?" — and see the answer straight away. That's the REPL: quick questions, instant answers, nothing written down.`,
      py`Or you can **write a full recipe card** and hand it over: the chef cooks the whole thing, top to bottom, and the card can be reused next week. That's a script. Either way it's the same chef (the interpreter); only the way you talk to it changes.`,
    ],
    mapping: [
      ['the chef', 'the Python interpreter (CPython)'],
      ['chatting live, one question at a time', 'the REPL: >>> prompt, instant results'],
      ['a written recipe card', 'a script: main.py'],
      ['"cook this card"', 'the command python3 main.py'],
      ['which kitchen the chef works in', 'where Python runs: your computer, a server, or a browser tab'],
      ['a travelling chef with a smaller kitchen', 'Pyodide in the browser: the same CPython, fewer tools (no threads, no network)'],
    ],
  },
  visual: {
    type: 'comparison',
    title: 'Same code, two ways to run it',
    props: {
      left: {
        label: 'REPL (interactive)',
        lang: 'pycon',
        code: py`>>> price = 4
>>> price * 3
12
>>> print(price * 3)
12
>>> "chips"
'chips'`,
      },
      right: {
        label: 'Script (main.py)',
        lang: 'python',
        code: py`price = 4
price * 3          # computed, then thrown away
print(price * 3)   # prints 12
"chips"            # nothing is shown

# $ python3 main.py
# 12`,
      },
      points: [
        'The REPL automatically shows the value of every expression you type; a script shows only what you pass to print().',
        'The REPL displays values the way Python writes them in code (strings with quotes: \'chips\'); print() shows the text itself (chips).',
        'REPL work disappears when you exit; a script is saved and can be run again, shared and tested.',
        'Both use exactly the same interpreter and the same language.',
      ],
    },
    alt: 'Side-by-side comparison. Left, a REPL session: typing price * 3 at the >>> prompt immediately shows 12, and typing "chips" shows \'chips\' with quotes. Right, the same lines saved in main.py: running python3 main.py prints only 12, from the print call; the bare expressions produce no output.',
    caption: py`This is the number-one surprise when moving from the REPL to scripts: **scripts don't echo**. If you want to see something, \`print()\` it.`,
  },
  syntax: [
    py`#### 1. Install CPython`,
    py`- **Windows** — download the installer from [python.org/downloads](https://www.python.org/downloads/) (or install from the Microsoft Store). In the classic installer, tick **"Add python.exe to PATH"**. Python 3.14 also introduced a new *Python install manager* for Windows; the [Windows guide](https://docs.python.org/3/using/windows.html) explains the current recommended route.
- **macOS** — use the python.org installer, or Homebrew (\`brew install python\`). macOS may offer a \`python3\` that comes with Apple's developer tools; it's often older than the latest release.
- **Linux** — \`python3\` is usually already installed. Your distribution's package manager can add more (\`sudo apt install python3\` on Debian/Ubuntu, \`sudo dnf install python3\` on Fedora), but may lag behind the newest version.`,
    py`#### 2. Check what you have`,
    { code: py`python3 --version     # macOS / Linux  ->  Python 3.14.0 (or similar)
py --version          # Windows: the py launcher picks the newest installed Python
py --list             # Windows: list every installed version
py -3.13 main.py      # Windows: run with a specific version`, lang: 'bash', static: true, title: 'terminal' },
    py`On macOS and Linux, use **\`python3\`**: on some systems \`python\` doesn't exist, and on old ones it may start the long-retired Python 2. On Windows, the **\`py\` launcher** is the most reliable command; \`python\` also works if it was added to PATH.`,
    py`#### 3. The REPL`,
    { code: py`$ python3
Python 3.14.0 (main, ...) on darwin
Type "help", "copyright", "credits" or "license" for more information.
>>> 2 + 3
5
>>> name = "Ada"
>>> name
'Ada'
>>> for n in range(2):
...     print(n)
...
0
1
>>> exit()`, lang: 'pycon', title: 'an interactive session' },
    py`- \`>>>\` means "type a statement". \`...\` means "I'm waiting for the rest of a multi-line statement" — press Enter on an empty line to finish it.
- The REPL echoes the value of an expression (strings shown with quotes). \`_\` holds the last echoed value.
- Leave with \`exit()\`, **Ctrl+D** (macOS/Linux) or **Ctrl+Z then Enter** (Windows). **Ctrl+C** cancels the current line or a running command but doesn't exit.`,
    { callout: 'version', title: 'The new REPL (3.13+)', text: py`Python 3.13 replaced the interactive interpreter with a friendlier one: colour prompts and tracebacks, **multi-line editing** (press ↑ to recall and edit a whole \`for\` block, not one line at a time), **F1** for help, **F2** to browse history, **F3** for "paste mode", and \`exit\`/\`quit\`/\`help\` work without parentheses. Python 3.14 adds syntax highlighting as you type. Set the environment variable \`PYTHON_BASIC_REPL=1\` to get the old one back.` },
    py`#### 4. Run a script`,
    { code: py`cd ~/projects/hello      # go to the folder that contains main.py
python3 main.py          # run it (Windows: py main.py)
python3 -i main.py       # run it, then stay in the REPL to inspect its variables
python3 -c "print(6 * 7)"   # run a one-liner
python3 -m venv .venv    # -m runs a standard-library module as a program`, lang: 'bash', static: true, title: 'terminal' },
    py`The file name is looked up **relative to the folder your terminal is in** (the *current working directory*). \`cd\` changes folder; \`ls\` (macOS/Linux) or \`dir\` (Windows) lists what's there.`,
    py`#### 5. Pick an editor`,
    py`- **VS Code** with Microsoft's *Python* extension: syntax colouring, error squiggles, a ▶ Run button and a built-in terminal. Use the *Python: Select Interpreter* command to choose which installed Python it runs.
- **PyCharm** (a full Python IDE), **Thonny** (built for beginners), or **IDLE** (simple, ships with the python.org installers).
- Any editor is fine as long as it saves plain text with straight quotes and uses **4 spaces** for indentation.`,
    py`#### 6. This browser playground`,
    py`The playground in this course runs **CPython 3.14 compiled to WebAssembly** by the [Pyodide](https://pyodide.org/) project. *WebAssembly* is a compact program format that web browsers can run safely at near-native speed, and *Emscripten* is the toolchain that compiles C programs (like CPython) to it. That's why \`sys.platform\` reports \`'emscripten'\` here.`,
    py`| works here | doesn't work here |
|---|---|
| the language and the standard library (\`math\`, \`json\`, \`random\`, \`datetime\`, \`sqlite3\`…) | third-party packages such as \`requests\` or \`numpy\` (not installed) |
| \`input()\` — type answers in the **Input** tab | threads and subprocesses (\`RuntimeError: can't start new thread\`) |
| reading and writing files (kept in memory, reset every run) | real network connections |
| \`asyncio\`, \`time.sleep()\` | runs longer than 10 seconds (they're stopped) |`,
  ],
  walkthrough: {
    title: 'Reading the environment report line by line',
    lang: 'python',
    code: WHERE_AM_I,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 3], text: py`\`import\` loads a **module** — a file of ready-made code — and gives you a name to reach it. \`sys\` describes the running interpreter; \`platform\` describes the machine. Both are in the standard library, so they're always available. (More in [modules & imports](lesson:modules-and-imports).)` },
      { lines: [5, 6], text: py`\`platform.python_version()\` returns the version as text, such as \`'3.14.2'\`. \`python_implementation()\` names the interpreter: \`'CPython'\` here and on python.org builds, \`'PyPy'\` on PyPy.` },
      { lines: [7], text: py`\`sys.platform\` is a short name for the operating system: \`'win32'\`, \`'darwin'\` (macOS), \`'linux'\` — or \`'emscripten'\` in this browser playground.` },
      { lines: [8], text: py`\`sys.version_info\` holds the version as numbers you can compare. \`.major\` and \`.minor\` pick out the \`3\` and the \`14\`.` },
      { lines: [10, 13], text: py`An \`if\`/\`else\` chooses which line to run based on a condition. You'll learn it properly in [if statements](lesson:if-statements); for now, read it as English.` },
    ],
  },
  playground: {
    title: 'Where is my code running?',
    objective: 'Run it to see which Python executes your code here, then explore the differences between the REPL, scripts and this browser sandbox.',
    files: { 'main.py': WHERE_AM_I },
    expected: py`Something like:

\`\`\`text
Python version: 3.14.2
Implementation: CPython
Platform: emscripten
Major/minor: 3 14
You're in the browser: CPython compiled to WebAssembly (Pyodide).
\`\`\`

The exact patch number (the last part of the version) may differ. Run the same file on your own computer with \`python3 main.py\` and the platform line will say \`darwin\`, \`linux\` or \`win32\` instead.`,
    experiments: [
      {
        id: 'modern-enough',
        task: py`Many projects need **Python 3.10 or newer**. Add a line at the end that prints \`Modern enough: True\` by comparing \`sys.version_info >= (3, 10)\`.`,
        hint: py`\`print("Modern enough:", sys.version_info >= (3, 10))\` — the comparison itself produces True or False.`,
        tests: [{ name: 'prints Modern enough: True', code: py`assert 'Modern enough: True' in output, 'Print "Modern enough:" followed by sys.version_info >= (3, 10)'` }],
        explain: py`\`sys.version_info\` compares like a tuple of numbers, item by item: \`(3, 14, 2, ...)\` is greater than \`(3, 10)\` because 14 > 10. That's the right way for code to check versions — never compare the version *strings*, because \`"3.9" > "3.10"\` is \`True\` for text!`,
      },
      {
        id: 'script-vs-repl',
        task: py`Add a line containing only \`6 * 7\` and run. Nothing new appears! Now change it so the program really shows \`42\`.`,
        hint: py`Scripts don't echo expressions the way the REPL does. Wrap it: \`print(6 * 7)\`.`,
        tests: [{ name: '42 appears in the output', code: py`assert '42' in output.split(), 'Use print() so the script shows the result'` }],
        explain: py`In the REPL, typing an expression shows its value automatically. In a script, Python computes \`6 * 7\` and then throws the result away. Output in scripts is always deliberate: \`print()\` it.`,
      },
      {
        id: 'argv',
        task: py`Add \`print(sys.argv)\` at the end. What is in the list?`,
        hint: py`\`sys.argv\` is the list of *command-line arguments* — the words typed after \`python3\`.`,
        tests: [{ name: "prints ['main.py']", code: py`assert "['main.py']" in output, 'Print sys.argv'` }],
        explain: py`When you run \`python3 main.py\`, \`sys.argv\` is \`['main.py']\`: the script name, followed by any extra words you typed (\`python3 main.py report.csv\` gives \`['main.py', 'report.csv']\`). The playground mimics running \`main.py\`. You'll build real command-line tools in [command-line programs](lesson:command-line-programs).`,
      },
      {
        id: 'sandbox-limits',
        task: py`Find a limit of the sandbox. Add \`import requests\` at the very top and run. Read the error, then delete the line.`,
        hint: py`The last line of the error names the problem; the playground adds a hint underneath.`,
        explain: py`\`ModuleNotFoundError: No module named 'requests'\`. \`requests\` is a popular **third-party** package: it isn't part of Python and must be installed with \`pip\`, ideally into a [virtual environment](lesson:virtual-environments). This browser sandbox only has the standard library. On your own computer, you'd run \`python3 -m pip install requests\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What happens when you type python3 main.py',
    props: {
      width: 760,
      height: 390,
      nodes: [
        { id: 'term', label: 'Terminal', note: 'you type python3 main.py', x: 110, y: 70, tone: 'yellow' },
        { id: 'shell', label: 'Shell', note: 'searches PATH for python3', x: 390, y: 70 },
        { id: 'cpython', label: 'CPython', note: 'the interpreter starts', x: 660, y: 70, tone: 'ink' },
        { id: 'file', label: 'main.py', note: 'opened from the current folder', x: 660, y: 205 },
        { id: 'out', label: 'Output', note: 'printed in the terminal', x: 390, y: 205, tone: 'kraft' },
        { id: 'page', label: 'This page', note: 'you press Run', x: 110, y: 330, tone: 'blue' },
        { id: 'pyodide', label: 'Pyodide', note: 'CPython compiled to WebAssembly', x: 390, y: 330, tone: 'blue' },
      ],
      edges: [
        { from: 'term', to: 'shell', label: 'command' },
        { from: 'shell', to: 'cpython', label: 'start' },
        { from: 'cpython', to: 'file', label: 'read', dashed: true },
        { from: 'cpython', to: 'out', label: 'print' },
        { from: 'page', to: 'pyodide', label: 'Run' },
        { id: 'web-out', from: 'pyodide', to: 'out', label: 'print' },
      ],
      steps: [
        { focus: ['term'], text: py`You open a **terminal** (Terminal on macOS, PowerShell or Windows Terminal on Windows, any terminal on Linux) and type a command: the program name \`python3\` followed by an *argument*, \`main.py\`.` },
        { focus: ['term', 'shell'], edges: ['term->shell'], text: py`The **shell** — the program inside the terminal that reads your commands — searches the folders listed in the \`PATH\` *environment variable* for a program called \`python3\`. If none is found you get \`command not found\` (or \`'python' is not recognized…\` on Windows).` },
        { focus: ['cpython'], edges: ['shell->cpython'], text: py`It starts **CPython**, passing \`main.py\` along. Which CPython? Whichever one PATH found first — that's why "which Python am I running?" is such a common question. \`sys.executable\` tells you.` },
        { focus: ['file'], edges: ['cpython->file'], text: py`CPython opens \`main.py\` **relative to the current folder**. Run the command from the wrong folder and you get \`can't open file … [Errno 2] No such file or directory\`.` },
        { focus: ['out'], edges: ['cpython->out'], text: py`It compiles and runs the file. Everything you \`print()\` appears in the terminal. When the last line finishes, CPython exits and the shell shows its prompt again.` },
        { focus: ['page', 'pyodide'], edges: ['page->pyodide'], text: py`In this course there's no terminal: pressing **Run** hands your files to **Pyodide** — CPython itself, compiled to WebAssembly, running inside your browser tab (in a background *Web Worker* so the page stays responsive).` },
        { focus: ['pyodide', 'out'], edges: ['web-out'], text: py`Same language, same interpreter, same output — but a smaller kitchen: no threads, no subprocesses, no real network, an in-memory file system, and only the standard library.` },
      ],
    },
    alt: 'Diagram with two paths to the same Output box. Top path: Terminal (you type python3 main.py) sends a command to the Shell, which searches PATH and starts CPython; CPython reads main.py from the current folder and prints to the Output box. Bottom path: This page (you press Run) hands the code to Pyodide, CPython compiled to WebAssembly, which also prints to the Output box.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`"Installing Python" puts a few things on your computer:`,
      py`- the **interpreter** program itself (\`python3\`, or \`python.exe\` on Windows);
- the **standard library** — hundreds of modules such as \`math\`, \`json\` and \`random\`, stored as files next to the interpreter;
- **pip**, the tool that installs extra packages from the Python Package Index;
- on Windows and macOS installers, **IDLE**, a simple editor, and on Windows the **\`py\` launcher**.`,
      py`You can have several Pythons installed side by side (say 3.12 and 3.14). Each has its own standard library and its own installed packages, which is why it matters which one runs.`,
    ],
    technical: [
      py`Ask the running interpreter about itself:`,
      { code: py`import sys

print(sys.executable)    # the full path of the Python program running this code
print(sys.version)       # a long human-readable version string
print(sys.version_info)  # sys.version_info(major=3, minor=14, micro=..., ...)
print(sys.prefix)        # the folder this Python (or virtual environment) lives in
print(sys.path[:3])      # the first few folders searched when you import a module`, lang: 'python', title: 'which Python am I?' },
      py`- **PATH** is an environment variable: a list of folders the shell searches, in order, when you type a command. The first match wins. On macOS/Linux, \`which python3\` shows which file that is; on Windows, \`where python\`.
- **The \`py\` launcher** (Windows) is a small program that finds installed Pythons for you; \`py -3.13\` picks a version, and it also understands \`#!\` lines at the top of scripts.
- **\`sys.path\`** is the list of folders searched by \`import\`. When you run a script, its own folder is put **first** — so a file of yours named \`random.py\` hides the standard library's \`random\` module.`,
      { callout: 'note', title: 'CPython detail', text: py`Messages such as \`python3: can't open file …\`, the exact REPL features and the layout of the installation folders belong to CPython and its installers. Other implementations (PyPy, MicroPython) have their own commands and options, though \`sys.version_info\` and \`sys.platform\` exist everywhere.` },
    ],
    production: [
      py`How professionals manage Python installations:`,
      py`- **Don't build projects on the "system" Python.** On macOS and Linux, the operating system's own tools may depend on it. Many Linux distributions now refuse \`pip install\` into it and print \`error: externally-managed-environment\` (see PEP 668).
- **One virtual environment per project.** A *virtual environment* is an isolated folder with its own packages, created with \`python3 -m venv .venv\`. See [virtual environments](lesson:virtual-environments).
- **Use \`python -m pip\`**, not bare \`pip\`, so the packages go to the same interpreter you'll run.
- **Pin the supported versions.** Projects declare \`requires-python = ">=3.10"\` in \`pyproject.toml\` ([packaging](lesson:packaging)), and CI runs the tests on each supported version.
- **Version managers** such as pyenv or uv install and switch between many Python versions; containers (Docker images like \`python:3.14-slim\`) pin the exact interpreter for servers.`,
    ],
  },
  mistakes: [
    {
      title: 'Typing Python into the shell',
      wrong: { code: py`$ print("hi")
bash: syntax error near unexpected token \`"hi"'`, lang: 'text' },
      right: { code: py`$ python3
>>> print("hi")
hi`, lang: 'pycon' },
      explanation: py`The terminal's shell speaks its own command language, not Python. Start the REPL first (\`python3\`, Windows: \`py\`) — you know you're in Python when you see \`>>>\`.`,
    },
    {
      title: 'Typing terminal commands into the REPL',
      wrong: { code: py`>>> python3 main.py
  File "<python-input-0>", line 1
    python3 main.py
            ^^^^
SyntaxError: invalid syntax`, lang: 'pycon' },
      right: { code: py`>>> exit()
$ python3 main.py`, lang: 'text' },
      explanation: py`\`python3 main.py\` and \`pip install …\` are **shell** commands. Inside the REPL they're read as (invalid) Python. Exit the REPL first, then run them at the shell prompt.`,
    },
    {
      title: 'Expecting a script to echo values like the REPL',
      wrong: { code: py`total = 19.99 * 3
total            # shows nothing when run as a script`, lang: 'python' },
      right: { code: py`total = 19.99 * 3
print(total)`, lang: 'python' },
      explanation: py`The REPL prints the value of any expression you type. A script only shows what you \`print()\`.`,
    },
    {
      title: 'Running the script from the wrong folder',
      wrong: { code: py`~ $ python3 main.py
python3: can't open file '/Users/ada/main.py': [Errno 2] No such file or directory`, lang: 'text' },
      right: { code: py`~ $ cd projects/hello
~/projects/hello $ python3 main.py`, lang: 'text' },
      explanation: py`A file name is looked up relative to the terminal's current folder. \`cd\` into the project folder first (or give the full path to the file). Many editors open their terminal in the project folder for you.`,
    },
    {
      title: 'Naming your script after a standard-library module',
      wrong: { code: py`# saved as random.py
import random
print(random.randint(1, 6))`, lang: 'python' },
      right: { code: py`# saved as dice.py
import random
print(random.randint(1, 6))`, lang: 'python' },
      explanation: py`The script's own folder is searched first, so \`import random\` imports *your* \`random.py\` instead of the real module, and \`random.randint\` doesn't exist. Python 3.13+ points this out: \`AttributeError: module 'random' has no attribute 'randint' (consider renaming '…/random.py' since it has the same name as the standard library module named 'random' …)\`. Rename the file and delete any \`__pycache__\` folder next to it.`,
    },
  ],
  debugging: [
    {
      symptom: py`'python' is not recognized as an internal or external command, operable program or batch file.`,
      cause: py`Windows can't find Python on PATH — it isn't installed, or "Add python.exe to PATH" wasn't ticked.`,
      fix: py`Try \`py --version\` (the launcher is usually available). Otherwise re-run the installer and enable the PATH option, then open a **new** terminal window.`,
    },
    {
      symptom: py`zsh: command not found: python`,
      cause: py`On macOS and many Linux systems the command is \`python3\`; \`python\` may not exist.`,
      fix: py`Use \`python3\`. Check what you have with \`python3 --version\` and \`which python3\`.`,
    },
    {
      symptom: py`python3: can't open file '/Users/ada/main.py': [Errno 2] No such file or directory`,
      cause: py`The terminal is in a different folder from the script, or the file name is misspelled.`,
      fix: py`Run \`ls\` (Windows: \`dir\`) to see what's in the current folder, \`cd\` to the right one, and check the exact spelling and \`.py\` extension.`,
    },
    {
      symptom: py`ModuleNotFoundError: No module named 'requests'`,
      cause: py`A third-party package isn't installed for *this* interpreter (or you're in the browser sandbox, which only has the standard library).`,
      fix: py`On your computer, activate the project's virtual environment and run \`python3 -m pip install requests\`. Check \`sys.executable\` to confirm which Python is running.`,
    },
    {
      symptom: py`RuntimeError: can't start new thread (in this playground)`,
      cause: py`The browser sandbox runs Python on a single WebAssembly thread; starting threads isn't supported here.`,
      fix: py`Run threading examples on your own computer. Lessons that teach threads show that code as read-only examples.`,
    },
  ],
  bestPractices: [
    'On macOS/Linux type python3; on Windows prefer the py launcher.',
    'Check the version (python3 --version) whenever something behaves unexpectedly — and print sys.executable inside code.',
    'Use the REPL for quick experiments and scripts for anything you want to keep.',
    'Keep each project in its own folder and run commands from inside it.',
    'Never name your files after standard-library modules (random.py, math.py, email.py, json.py).',
    'Install packages with python -m pip into a virtual environment, not into the system Python.',
  ],
  useCases: [
    'Using the REPL as a calculator or to check how a function behaves before using it in a script.',
    'Running a script that processes a folder of files every morning.',
    'Using python3 -i main.py to inspect a script’s variables after it runs.',
    'Checking sys.version_info in a tool that requires a minimum Python version.',
    'Running Python in the browser for teaching, demos and notebooks (Pyodide, JupyterLite).',
  ],
  comparison: {
    title: 'Ways to run Python code',
    headers: ['', 'REPL', 'Script (python3 main.py)', 'This browser playground'],
    rows: [
      ['best for', 'quick experiments, checking behaviour', 'real programs you keep and re-run', 'learning, demos, nothing to install'],
      ['shows expression values', 'yes, automatically', 'only what you print()', 'only what you print()'],
      ['code is saved', 'no (history only)', 'yes, in a .py file', 'yes, in your browser'],
      ['third-party packages', 'whatever is installed', 'whatever is installed', 'standard library only'],
      ['threads, network, processes', 'yes', 'yes', 'no'],
      ['sys.platform', 'win32 / darwin / linux', 'win32 / darwin / linux', 'emscripten'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'setup-and-running-q1',
      type: 'mcq',
      prompt: 'On macOS or Linux, which command reliably tells you which version of Python 3 you have?',
      options: [
        'python3 --version',
        { text: 'python version', why: 'This would try to run a script called "version". Options start with dashes: --version.' },
        { text: 'print(version)', why: 'That is Python code, not a terminal command — and there is no built-in called version.' },
        { text: 'pip --python', why: 'pip installs packages; it is not the way to ask the interpreter its version.' },
      ],
      answer: 0,
      explanation: py`\`python3 --version\` (or \`python3 -V\`) prints something like \`Python 3.14.0\`. On Windows, use \`py --version\`. Inside code, use \`sys.version_info\`.`,
    },
    {
      id: 'setup-and-running-q2',
      type: 'output',
      prompt: 'This is saved as `main.py` and run with `python3 main.py`. What appears?',
      code: py`price = 4
price * 3
print(price)`,
      options: [
        { text: '`12`, then `4`', why: 'In a script, the bare expression price * 3 is computed and thrown away. Only the REPL echoes values automatically.' },
        '`4`',
        { text: '`12`', why: 'price * 3 does not change price — and it is never printed.' },
        { text: 'Nothing at all', why: 'print(price) does print: only the bare expression on line 2 is silent.' },
      ],
      answer: 1,
      explanation: py`Scripts only show what you \`print()\`. Line 2 computes \`12\` and discards it; it doesn't change \`price\` either. In the REPL, the same line *would* show \`12\`.`,
    },
    {
      id: 'setup-and-running-q3',
      type: 'bug',
      prompt: 'Ada wants to run her script. Which line of this terminal session is the mistake?',
      code: { lang: 'pycon', code: py`$ cd projects/hello
$ python3
>>> print("ready")
ready
>>> python3 main.py` },
      answerLine: 5,
      explanation: py`\`python3 main.py\` is a shell command, but she typed it at the \`>>>\` prompt, so Python reads it as code: \`SyntaxError: invalid syntax\`. She should \`exit()\` the REPL first, then run the command at the \`$\` prompt.`,
    },
    {
      id: 'setup-and-running-q4',
      type: 'fill',
      prompt: 'Complete the script so it shows the version of the Python that is running it.',
      code: py`import ___
print(___.version)`,
      answer: [['sys'], ['sys']],
      explanation: py`The \`sys\` module describes the running interpreter: \`sys.version\` is a readable string and \`sys.version_info\` is the comparable version.`,
    },
    {
      id: 'setup-and-running-q5',
      type: 'mcq',
      prompt: 'In this course’s playground, `print(sys.platform)` shows `emscripten`. Why?',
      options: [
        { text: 'Emscripten is a special simplified dialect of Python', why: 'It is not a dialect: the playground runs normal CPython 3.14 and the full language.' },
        'The playground runs CPython compiled to WebAssembly with the Emscripten toolchain (via Pyodide), so Python reports that platform',
        { text: 'Your computer’s operating system is called Emscripten', why: 'Your OS is Windows, macOS, Linux, ChromeOS… The code runs inside the browser, not directly on the OS.' },
        { text: 'It is a bug in the playground', why: 'It is accurate: from Python’s point of view, the platform really is Emscripten/WebAssembly.' },
      ],
      answer: 1,
      explanation: py`Pyodide compiles CPython's C source code to WebAssembly using Emscripten. Your code runs in the browser's WebAssembly engine, so \`sys.platform\` honestly says \`emscripten\`. On your own computer you'd see \`win32\`, \`darwin\` or \`linux\`.`,
    },
    {
      id: 'setup-and-running-q6',
      type: 'mcq',
      prompt: 'Which of these leave the Python REPL? **Select all that apply.**',
      options: [
        '`exit()`',
        'Ctrl+D on macOS/Linux, or Ctrl+Z then Enter on Windows',
        { text: 'Ctrl+C', why: 'Ctrl+C interrupts (cancels the current line or stops a running command) with KeyboardInterrupt — you stay in the REPL.' },
        { text: 'Typing `stop`', why: 'stop is not a REPL command; Python looks it up as a name and raises NameError.' },
      ],
      answer: [0, 1],
      explanation: py`\`exit()\` and the end-of-input key (Ctrl+D / Ctrl+Z Enter) both end the session. Since 3.13 the new REPL also accepts plain \`exit\` or \`quit\` without parentheses.`,
    },
    {
      id: 'setup-and-running-q7',
      type: 'short',
      prompt: 'When would you reach for the REPL, and when for a script? Give one example of each.',
      answer: py`The REPL is for quick, throw-away experiments with instant feedback — e.g. checking what \`round(2.5)\` returns or how a string method behaves. A script is for anything you want to keep, re-run, share or test — e.g. a program that totals this month's expenses from a file. The REPL echoes expressions automatically; a script only shows what it prints.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'repl-to-script',
      title: 'From REPL to script',
      difficulty: 'beginner',
      prompt: py`Ada worked this out in the REPL:

\`\`\`pycon
>>> width = 7
>>> height = 3
>>> width * height
21
>>> 2 * (width + height)
20
\`\`\`

Turn it into a script. Keep \`width\` and \`height\`, create variables \`area\` and \`perimeter\` from them, and print exactly:

\`\`\`text
Area: 21
Perimeter: 20
\`\`\`

The tests also change the width and height, so compute from the names — don't type 21 and 20.`,
      files: {
        'main.py': py`width = 7
height = 3
width * height
2 * (width + height)
`,
      },
      hints: [
        'Run the starter: it prints nothing. Scripts do not echo values like the REPL does.',
        'Give each result a name (area = width * height), then print it with a label.',
        'area = width * height\nperimeter = 2 * (width + height)\nprint("Area:", area)\nprint("Perimeter:", perimeter)',
      ],
      solution: {
        explanation: py`In the REPL, typing \`width * height\` showed \`21\` automatically. A script computes it and throws it away, so we name each result and \`print()\` it with a label. \`print("Area:", area)\` puts a space between its two arguments, giving \`Area: 21\`. Because \`area\` and \`perimeter\` are computed from \`width\` and \`height\`, the script stays correct for any rectangle.`,
        files: {
          'main.py': py`width = 7
height = 3
area = width * height
perimeter = 2 * (width + height)
print("Area:", area)
print("Perimeter:", perimeter)
`,
        },
      },
      tests: [
        { name: 'area is 21', code: py`assert ns.get('area') == 21, 'Create a variable named area'` },
        { name: 'perimeter is 20', code: py`assert ns.get('perimeter') == 20, 'Create a variable named perimeter'` },
        { name: 'prints both labelled lines', code: py`assert output.strip() == "Area: 21\nPerimeter: 20"` },
        {
          name: 'works for a 5 × 4 rectangle',
          code: py`check = {}
src = files['main.py'].replace('width = 7', 'width = 5').replace('height = 3', 'height = 4')
capture(exec, src, check)
assert check['area'] == 20 and check['perimeter'] == 18, 'Compute area and perimeter from width and height'`,
        },
      ],
    },
    {
      id: 'version-report',
      title: 'Version report',
      difficulty: 'beginner',
      prompt: py`Write a script that reports on the interpreter running it, using the \`sys\` module:

1. \`major\` — the major version number, from \`sys.version_info.major\`;
2. \`minor\` — the minor version number, from \`sys.version_info.minor\`;
3. \`supported\` — \`True\` if this Python is at least 3.10, using \`sys.version_info >= (3, 10)\`.

Then print three lines exactly like this (with the real numbers):

\`\`\`text
Major: 3
Minor: 14
Supported: True
\`\`\`

Read the values from \`sys\` — don't type the numbers, so the script stays correct on any Python.`,
      files: {
        'main.py': py`import sys

major = None
minor = None
supported = None

# TODO: read the values from sys.version_info, then print the three lines
`,
      },
      hints: [
        'sys.version_info has attributes: sys.version_info.major and sys.version_info.minor.',
        'Comparing sys.version_info with a tuple such as (3, 10) gives True or False — store that in supported.',
        'major = sys.version_info.major\nminor = sys.version_info.minor\nsupported = sys.version_info >= (3, 10)\nprint("Major:", major)\nprint("Minor:", minor)\nprint("Supported:", supported)',
      ],
      solution: {
        explanation: py`\`sys.version_info\` describes the interpreter that is actually running, so the script reports the truth wherever it runs: \`3\` and \`14\` here, maybe \`3\` and \`12\` on a colleague's laptop. The comparison \`sys.version_info >= (3, 10)\` checks the numbers item by item — major first, then minor — and evaluates to a boolean, \`True\` or \`False\`. Comparing numbers like this is safe; comparing version *strings* is not (\`"3.9" > "3.10"\` is \`True\` as text).`,
        files: {
          'main.py': py`import sys

major = sys.version_info.major
minor = sys.version_info.minor
supported = sys.version_info >= (3, 10)

print("Major:", major)
print("Minor:", minor)
print("Supported:", supported)
`,
        },
      },
      tests: [
        { name: 'major matches the running Python', code: py`import sys
assert major == sys.version_info.major` },
        { name: 'minor matches the running Python', code: py`import sys
assert minor == sys.version_info.minor` },
        { name: 'supported is True on this Python', code: py`assert supported is True` },
        { name: 'prints the three lines', code: py`import sys
assert output.strip() == f"Major: {sys.version_info.major}\nMinor: {sys.version_info.minor}\nSupported: True"` },
        { name: 'reads the numbers from sys.version_info', code: py`assert files['main.py'].count('version_info') >= 2, 'Use sys.version_info instead of typing the numbers'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'setup-and-running-repl-vs-script',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the Python REPL, and how does running code there differ from running a script?',
      answer: 'The REPL (Read–Eval–Print Loop) reads one statement at a time, runs it and automatically prints the value of expressions. A script is a saved file executed top to bottom by python main.py; it shows only what the code prints and can be re-run, versioned and tested.',
      explanation: py`Same interpreter, different front end. The REPL is ideal for exploring APIs and checking behaviour; scripts are how programs are delivered. \`python -i script.py\` combines them: run the script, then inspect its variables interactively.`,
      whyAsked: 'A basic fluency check: you should be comfortable both experimenting and running real programs.',
      mistakes: ['Saying the REPL is a different language or "slower Python"', 'Not knowing that scripts do not echo expression values'],
      followUps: ['What does python -i do?', 'What does the _ variable hold in the REPL?', 'What changed in the 3.13 REPL?'],
      modelAnswer: 'The REPL is Python’s interactive prompt: it reads a statement, evaluates it, prints the result and loops. It is great for quick experiments — checking what a function returns or trying an idea — because expression values are echoed automatically. A script is code saved in a file and run with python main.py; it runs top to bottom and only shows what it explicitly prints, but it is repeatable, shareable and testable. They use exactly the same interpreter. When I want both, I run python -i script.py to drop into the REPL with the script’s variables loaded.',
    },
    {
      id: 'setup-and-running-wrong-python',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You installed a package with pip, but your script still says `ModuleNotFoundError`. How do you diagnose it?',
      answer: 'Almost always pip and python belong to different interpreters. Compare `python -c "import sys; print(sys.executable)"` with `pip --version` (which shows its Python), activate the right virtual environment, and install with `python -m pip install …` so the package goes to the interpreter you actually run.',
      explanation: py`Multiple Pythons (system, python.org, Homebrew, virtual environments, the editor's chosen interpreter) can coexist. The shell picks the first match on PATH for each command independently, so \`pip\` can point at a different installation from \`python\`. \`python -m pip\` removes the ambiguity. Editors like VS Code also have their own interpreter setting.`,
      code: { lang: 'bash', code: py`python3 -c "import sys; print(sys.executable)"
python3 -m pip --version     # pip X.Y from ... (python 3.14)
python3 -m pip install requests` },
      whyAsked: 'This is one of the most common real-world Python problems; the answer shows practical environment skills.',
      mistakes: ['Reinstalling Python without diagnosing', 'Using sudo pip install', 'Not checking which interpreter the editor uses'],
      followUps: ['What is a virtual environment for?', 'Why is sudo pip install a bad idea?', 'What does PEP 668 "externally managed" mean?'],
      modelAnswer: 'My first suspicion is that pip installed the package into a different Python from the one running the script. I would print sys.executable from the failing interpreter and compare it with pip --version, which shows the Python pip belongs to. Then I would activate the project’s virtual environment and install with python -m pip install, which guarantees the package goes into that exact interpreter. I would also check the interpreter selected in my editor, because IDEs often run a different Python from the terminal.',
    },
    {
      id: 'setup-and-running-shadowing',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A beginner’s file `random.py` contains `import random` and `random.randint(1, 6)`, and crashes with `AttributeError: module \'random\' has no attribute \'randint\'`. What is going on?',
      answer: 'The script’s own folder is first on sys.path, so `import random` imports the beginner’s random.py instead of the standard-library module. Rename the file (and delete its __pycache__); Python 3.13+ even suggests this in the error message.',
      explanation: py`When you run a script, Python puts its directory at \`sys.path[0]\`. Module lookup takes the first match, so local files shadow standard-library modules with the same name. Common victims: \`random.py\`, \`math.py\`, \`email.py\`, \`json.py\`, \`test.py\`, \`code.py\`. In 3.13+ CPython adds "(consider renaming … since it has the same name as the standard library module …)" to the message.`,
      whyAsked: 'Tests understanding of the import search path through a bug almost everyone hits once.',
      mistakes: ['Assuming the standard library is broken', 'Renaming the file but leaving a stale cached .pyc that still shadows'],
      followUps: ['How can you print where a module was imported from? (module.__file__)', 'What is sys.path and how is it built?'],
      modelAnswer: 'The file name is the problem. When Python runs a script it puts the script’s folder first on sys.path, so import random finds the beginner’s own random.py before the standard library’s module, and their file has no randint. I would confirm it by printing random.__file__, then rename the script to something like dice.py and delete any __pycache__ folder next to it. Since Python 3.13 the AttributeError even suggests renaming the file because it shadows a standard-library module.',
    },
    {
      id: 'setup-and-running-python-m-pip',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between running `pip install x` and `python -m pip install x`? Which do you prefer?',
      answer: '`python -m pip` runs pip as a module of that exact interpreter, so packages are installed for the Python you will run. Bare `pip` is whichever pip script PATH finds first, which may belong to another Python. Prefer `python -m pip`.',
      explanation: py`\`-m module\` tells the interpreter to find a module on its own \`sys.path\` and run it as \`__main__\`. That ties the tool to the interpreter. The same pattern is used for \`python -m venv\`, \`python -m pytest\`, \`python -m http.server\` and \`python -m json.tool\`.`,
      whyAsked: 'Shows awareness of multiple-interpreter setups and good habits.',
      mistakes: ['Saying they are identical', 'Not knowing what -m does'],
      followUps: ['What other tools do you run with -m?', 'How does -m change sys.path compared with running a file path?'],
      modelAnswer: 'With python -m pip, the specific interpreter I name runs pip as one of its own modules, so whatever I install lands in that interpreter’s environment. Bare pip is just the first pip executable on PATH, and on machines with several Pythons it can belong to a different one, which leads to confusing ModuleNotFoundErrors. So I prefer python -m pip, ideally inside an activated virtual environment. The same -m habit applies to venv, pytest and other tools.',
    },
    {
      id: 'setup-and-running-version-label',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 4,
      question: 'Write `is_supported(version, minimum)` where both arguments are tuples of ints like `(3, 12)`. Return `True` if `version` is at least `minimum`. Then explain why you should not compare version strings.',
      answer: 'return version >= minimum — tuples compare item by item. Strings compare character by character, so "3.9" > "3.10" is True even though 3.9 is older.',
      explanation: py`Tuple comparison is *lexicographic*: compare the first items; if equal, compare the next, and so on. \`(3, 9) < (3, 10)\` because 9 < 10. Strings are compared character by character, and \`"9" > "1"\`, so text comparison gets versions wrong. \`sys.version_info\` behaves like a tuple, which is why \`sys.version_info >= (3, 10)\` is the idiomatic check.`,
      starter: { files: { 'main.py': py`def is_supported(version, minimum):
    # TODO: return True if version is at least minimum
    return False


print(is_supported((3, 14), (3, 10)))
` } },
      tests: [
        { name: '(3, 14) meets (3, 10)', code: py`assert is_supported((3, 14), (3, 10)) is True` },
        { name: '(3, 9) does not meet (3, 10)', code: py`assert is_supported((3, 9), (3, 10)) is False` },
        { name: 'equal versions are supported', code: py`assert is_supported((3, 12), (3, 12)) is True` },
        { name: 'works with sys.version_info', code: py`import sys
assert is_supported(sys.version_info, (3, 10)) is True` },
      ],
      solution: { files: { 'main.py': py`def is_supported(version, minimum):
    return version >= minimum


print(is_supported((3, 14), (3, 10)))
` } },
      hints: ['Tuples can be compared with >= directly.', 'Python compares tuples item by item, left to right.'],
      whyAsked: 'Version checks appear in tooling and libraries; the string-comparison trap is a classic.',
      mistakes: ['Comparing version strings', 'Checking only the minor number and forgetting the major', 'Parsing sys.version with string slicing'],
      followUps: ['How would you compare versions like "1.10.0rc1" in real packaging code? (packaging.version.Version)', 'Where should a project declare its supported Python versions?'],
      modelAnswer: 'I would simply return version >= minimum, because tuples compare lexicographically: first items first, then the next ones only if those are equal, so (3, 9) is less than (3, 10). That also works with sys.version_info, which behaves like a tuple. I would avoid strings because they compare character by character, so "3.9" sorts after "3.10". For full package version strings with pre-releases I would use packaging.version.Version rather than writing my own parser.',
    },
    {
      id: 'setup-and-running-browser-python',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How can Python run inside a web browser, and what limitations would you expect?',
      answer: 'Projects like Pyodide compile CPython’s C source to WebAssembly with Emscripten; the browser runs that interpreter, usually in a Web Worker. Expect no (or limited) threads and subprocesses, no raw sockets (network goes through browser APIs), an in-memory virtual filesystem, slower start-up, and only packages that are pure Python or have been compiled to WebAssembly.',
      explanation: py`WebAssembly is a sandboxed bytecode format browsers execute safely. Because the interpreter is real CPython, the language and most of the standard library behave normally (\`sys.platform\` is \`'emscripten'\`). The sandbox forbids what browsers forbid: arbitrary sockets, spawning processes, direct disk access. Threads depend on special browser features and build options, so many deployments (like this course's) run single-threaded. Interop layers let Python call JavaScript and vice versa.`,
      whyAsked: 'Probes understanding of what an interpreter is and how platforms constrain it — useful for teaching tools, notebooks (JupyterLite) and edge deployments.',
      mistakes: ['Thinking browser Python is translated to JavaScript', 'Assuming every PyPI package works', 'Forgetting the cost of downloading the interpreter'],
      followUps: ['Why would you run the interpreter in a Web Worker?', 'How would you make an HTTP request from Python in the browser?', 'What does sys.platform report there?'],
      modelAnswer: 'Browsers can run WebAssembly, a sandboxed, portable binary format, and the Pyodide project compiles CPython itself to WebAssembly using the Emscripten toolchain. So it is genuinely CPython running in the page, usually inside a Web Worker so long computations do not freeze the interface. The limits come from the browser sandbox: no subprocesses, no raw sockets so networking must go through browser APIs, a virtual in-memory filesystem, and usually no threads. Packages work if they are pure Python or have been compiled to WebAssembly, and there is a start-up cost to download the interpreter. It is excellent for teaching, notebooks and demos rather than for heavy back-end work.',
    },
  ],

  takeaways: [
    'Install CPython from python.org or your package manager; on macOS/Linux type python3, on Windows use the py launcher.',
    'python3 --version (or sys.version_info in code) tells you which version is running; sys.executable tells you which installation.',
    'The REPL (>>>) runs one statement at a time and echoes values — great for experiments, nothing is saved.',
    'Scripts run with python3 main.py from the project folder, top to bottom, and only show what you print().',
    'Python 3.13 brought a new REPL with multi-line editing and colour; 3.14 adds syntax highlighting.',
    'This playground is real CPython 3.14 compiled to WebAssembly (Pyodide): sys.platform is \'emscripten\', and there are no threads, network or third-party packages.',
  ],
}
