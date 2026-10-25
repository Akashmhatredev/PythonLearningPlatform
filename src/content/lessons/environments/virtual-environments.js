// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ENVCHECK = py`"""Small, pure helpers for reasoning about virtual environments."""


def in_virtualenv(prefix, base_prefix):
    """PEP 405: inside a venv, sys.prefix (the venv) differs from sys.base_prefix."""
    return prefix != base_prefix


def read_pyvenv_cfg(text):
    """Parse the 'key = value' lines of a pyvenv.cfg file into a dict."""
    settings = {}
    for line in text.splitlines():
        key, sep, value = line.partition("=")
        if sep:
            settings[key.strip()] = value.strip()
    return settings


def resolve_command(name, path, installed):
    """Which file would the shell run for name? (Simplified PATH search.)

    path      -- folders separated by ":" (Windows uses ";"), searched in order
    installed -- {folder: set of program names in that folder}
    """
    for folder in path.split(":"):
        if name in installed.get(folder, set()):
            return f"{folder}/{name}"
    return None
`

const PYVENV_CFG = py`home = /usr/local/bin
include-system-site-packages = false
version = 3.14.0
executable = /usr/local/bin/python3.14
command = /usr/local/bin/python3.14 -m venv /home/ada/shop/.venv
`

const MAIN = py`"""Virtual environments: inspected for real, then simulated.

Part 1 inspects the interpreter running this code (here: the browser sandbox).
Parts 2 and 3 use made-up paths to show what a venv on a real machine involves.
"""
import os
import sys
from pathlib import Path

from envcheck import in_virtualenv, read_pyvenv_cfg, resolve_command

print("=== 1. The interpreter running this code ===")
print("version        :", sys.version.split()[0])
print("sys.prefix     :", sys.prefix)
print("sys.base_prefix:", sys.base_prefix)
print("in a venv?     :", in_virtualenv(sys.prefix, sys.base_prefix))
print("VIRTUAL_ENV    :", os.environ.get("VIRTUAL_ENV", "(not set)"))

print("\n=== 2. Reading a venv's pyvenv.cfg ===")
cfg = read_pyvenv_cfg(Path("example_pyvenv.cfg").read_text())
print("base Python    :", cfg["home"])
print("version        :", cfg["version"])
print("global packages:", cfg["include-system-site-packages"])

print("\n=== 3. What 'activate' does to PATH (simplified) ===")
INSTALLED = {
    "/home/ada/shop/.venv/bin": {"python", "pip", "flask"},
    "/usr/local/bin": {"python", "python3", "pip"},
    "/usr/bin": {"python3", "git", "ls"},
}
path = "/usr/local/bin:/usr/bin"
print("before: python ->", resolve_command("python", path, INSTALLED))
path = "/home/ada/shop/.venv/bin:" + path        # activate puts the venv's bin/ first
print("after : python ->", resolve_command("python", path, INSTALLED))
print("after : flask  ->", resolve_command("flask", path, INSTALLED))
`

const DESCRIBE_MAIN = py`def describe(prefix, base_prefix, environ):
    """One-line description of the Python environment (see the prompt)."""
    # TODO: handle the four cases
    return ""


print(describe("/usr/local", "/usr/local", {}))
print(describe("/home/ada/shop/.venv", "/usr/local", {"VIRTUAL_ENV": "/home/ada/shop/.venv"}))
`

const REBUILD_MAIN = py`from pathlib import Path


def read_pyvenv_cfg(text):
    """{key: value} from 'key = value' lines; skip blank lines and # comments."""
    return {}   # TODO


def venv_version(cfg):
    """The 'version' entry as a tuple of ints: '3.12.4' -> (3, 12, 4)."""
    return ()   # TODO


def needs_rebuild(cfg, minimum):
    """True if the venv's Python is older than the minimum version tuple."""
    return False   # TODO


cfg = read_pyvenv_cfg(Path("pyvenv.cfg").read_text())
print(venv_version(cfg), needs_rebuild(cfg, (3, 13)))
`

const OLD_PYVENV = py`# created months ago
home = /usr/bin

include-system-site-packages = false
version = 3.12.4
`

export default {
  id: 'virtual-environments',
  title: 'Virtual environments',
  summary: 'A virtual environment is a per-project folder with its own site-packages, so every project gets exactly the packages and versions it needs.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['modules-and-imports', 'setup-and-running'],
  related: ['pip-and-dependencies', 'packaging', 'project-structure', 'code-quality-tools', 'main-guard-and-scripts'],
  tags: ['virtual environment', 'venv', '.venv', 'activate', 'deactivate', 'isolation', 'site-packages', 'pyvenv.cfg', 'sys.prefix', 'sys.base_prefix', 'VIRTUAL_ENV', 'PATH', 'externally-managed-environment', 'PEP 405', 'PEP 668', 'uv', 'conda'],
  apis: [
    { name: 'python -m venv .venv', summary: 'Create a virtual environment in the folder .venv.' },
    { name: 'source .venv/bin/activate', summary: 'Activate on macOS/Linux (bash/zsh); Windows: .venv\\Scripts\\activate.' },
    { name: 'deactivate', summary: 'Leave the active virtual environment (restores PATH and the prompt).' },
    { name: 'sys.prefix', summary: 'The environment Python is running in: the venv folder when inside one.' },
    { name: 'sys.base_prefix', summary: 'The base Python installation the venv was created from.' },
    { name: 'sys.executable', summary: 'Full path of the Python interpreter that is running.' },
    { name: 'VIRTUAL_ENV', summary: 'Environment variable set by the activate scripts to the venv path.' },
  ],
  docs: [
    { label: 'venv — Creation of virtual environments', url: 'https://docs.python.org/3/library/venv.html' },
    { label: 'Python tutorial — Virtual environments and packages', url: 'https://docs.python.org/3/tutorial/venv.html' },
    { label: 'Packaging guide — Install packages in a virtual environment using pip and venv', url: 'https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/' },
    { label: 'PEP 405 — Python virtual environments', url: 'https://peps.python.org/pep-0405/' },
    { label: 'PEP 668 — Externally managed environments', url: 'https://peps.python.org/pep-0668/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`When you \`pip install\` a package, it's copied into a folder called **site-packages** that belongs to one Python installation. Without precautions, every project on your computer shares that single folder.`,
    py`A **virtual environment** (*venv*) is a small folder — usually called \`.venv\` inside your project — that contains its **own** site-packages and a pointer to the Python it was made from. While the venv is in use, \`pip install\` puts packages in *that* folder, and \`import\` finds them there. Each project gets its own private set of packages, at exactly the versions it needs.`,
    { code: py`cd shop
python -m venv .venv            # create it (once per project)
source .venv/bin/activate       # use it (Windows: .venv\Scripts\activate)
python -m pip install flask     # installs into shop/.venv only
deactivate                      # back to normal`, lang: 'bash', title: 'the whole workflow' },
    py`Next lesson, [pip & dependencies](lesson:pip-and-dependencies), is about *what* to install; this one is about *where* it goes.`,
  ],
  why: [
    py`**Projects disagree.** Your old shop project needs Django 4.2; the new blog wants Django 5.2. A single shared site-packages can hold only one version of a package, so installing for one project breaks the other. With a venv per project, both are happy.`,
    py`**The system Python isn't yours.** On Linux and macOS, the operating system's tools may rely on the system Python and its packages. Installing or upgrading packages there can break them, so many Linux distributions now refuse: \`pip install\` outside a venv fails with \`error: externally-managed-environment\` (PEP 668).`,
    py`**Reproducibility.** A fresh venv contains only what you install. If your project works in a clean venv built from your dependency list, it will work on a teammate's laptop, in CI and on the server — not just on your machine, where some forgotten package happened to be installed.`,
    py`**No admin rights, no risk.** A venv is just a folder you own. Broke it? Delete it and make a new one in seconds.`,
  ],
  eli15: [
    py`Imagine building two LEGO sets that both need a "special red brick" — but set A needs the old shape and set B needs the new shape. If you tip both sets into one big box, one of them can't be built.`,
    py`So you give each set **its own box**. Python packages work the same way: a virtual environment is a separate box of packages for each project.`,
    py`"Activating" the venv is like putting that project's box on your desk, so when you reach for a brick (\`import flask\`) or add one (\`pip install\`), you're using that box. "Deactivating" puts it back on the shelf.`,
  ],
  analogy: {
    title: 'Hotel rooms in one building',
    body: [
      py`A hotel is one building — shared plumbing, electricity and lifts (the base Python and its standard library). But every guest gets their **own room** for their own luggage. What one guest unpacks doesn't appear in anyone else's room.`,
      py`Checking in hands you a key and the receptionist points you to *your* room; checking out returns you to the lobby. And you can't pick up a room and move it to another hotel — you book a new one and bring your luggage list.`,
    ],
    mapping: [
      ['the building and its plumbing', 'the base Python installation and standard library (sys.base_prefix)'],
      ['a guest room', 'a venv folder (.venv) — sys.prefix while you use it'],
      ['the luggage in the room', 'packages in the venv\'s site-packages'],
      ['checking in / checking out', 'source .venv/bin/activate / deactivate'],
      ['the room number on your key', '.venv/bin/python — the interpreter that knows its room'],
      ['the card on the door saying which hotel', 'pyvenv.cfg — "home = /usr/local/bin"'],
      ['booking a new room instead of moving one', 'recreate a venv; never copy or move it'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'One Python, many isolated environments',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'shell', label: 'your shell', note: 'PATH decides which python runs', x: 110, y: 60, tone: 'yellow' },
        { id: 'base', label: 'base Python 3.14', note: '/usr/local: interpreter + stdlib', x: 400, y: 60, tone: 'blue' },
        { id: 'global', label: 'global site-packages', note: 'shared — avoid installing here', x: 650, y: 60, tone: 'red' },
        { id: 'shop', label: 'shop/.venv', note: 'site-packages: Django 4.2', x: 230, y: 250, tone: 'kraft' },
        { id: 'blog', label: 'blog/.venv', note: 'site-packages: Django 5.2', x: 570, y: 250, tone: 'kraft' },
      ],
      edges: [
        { from: 'base', to: 'global', label: 'owns' },
        { from: 'shop', to: 'base', label: 'pyvenv.cfg: home', dashed: true },
        { from: 'blog', to: 'base', label: 'pyvenv.cfg: home', dashed: true },
        { from: 'shell', to: 'shop', label: 'activate' },
      ],
      steps: [
        { focus: ['base', 'global'], edges: ['base->global'], text: py`**Without venvs**, every project installs into the base Python's single *global* site-packages. Installing Django 5.2 for the blog would replace the Django 4.2 the shop needs.` },
        { focus: ['shop'], edges: ['shop->base'], text: py`\`python -m venv .venv\` creates **shop/.venv**: a tiny folder with its own empty site-packages, a \`python\` that is a link to (or copy of) the base interpreter, and a \`pyvenv.cfg\` file whose \`home\` line points back at the base installation. The standard library is **not** copied — it's shared.` },
        { focus: ['blog'], edges: ['blog->base'], text: py`Each project gets its own venv. Two venvs, two site-packages, two Django versions — on one base Python.` },
        { focus: ['shell', 'shop'], edges: ['shell->shop'], text: py`**Activating** only changes your shell: it puts \`shop/.venv/bin\` at the front of \`PATH\`, so \`python\` and \`pip\` now mean the venv's copies, and sets \`VIRTUAL_ENV\`. Running \`shop/.venv/bin/python\` directly works the same without activating.` },
        { focus: ['shop', 'base'], edges: ['shop->base'], text: py`Inside the venv, Python reports \`sys.prefix == ".../shop/.venv"\` and \`sys.base_prefix == "/usr/local"\`. Different values mean "I'm in a virtual environment" — the standard check.` },
      ],
    },
    alt: 'Diagram: a base Python 3.14 installation owns the shared global site-packages. Two project venvs, shop/.venv with Django 4.2 and blog/.venv with Django 5.2, each point back to the base Python through pyvenv.cfg. The shell activates shop/.venv by putting its bin folder first on PATH.',
    caption: py`A venv borrows the interpreter and standard library from the base Python and adds its own private site-packages.`,
  },
  syntax: [
    py`#### Create a venv (once per project)`,
    { code: py`cd my-project
python3 -m venv .venv       # macOS / Linux (python3 is the usual name there)
py -m venv .venv            # Windows (the "py" launcher)`, lang: 'bash' },
    py`\`.venv\` is the conventional name: many editors and tools detect it automatically, and the leading dot hides it in directory listings. The Python you use to *create* the venv is the Python the venv will use — to get a venv with Python 3.13, run \`python3.13 -m venv .venv\` (or \`py -3.13 -m venv .venv\` on Windows).`,
    py`#### Activate and deactivate`,
    py`| shell | command |
|---|---|
| bash / zsh (macOS, Linux) | \`source .venv/bin/activate\` |
| fish | \`source .venv/bin/activate.fish\` |
| Windows cmd | \`.venv\Scripts\activate.bat\` |
| Windows PowerShell | \`.venv\Scripts\Activate.ps1\` |
| any shell, to leave | \`deactivate\` |`,
    { code: py`$ source .venv/bin/activate
(.venv) $ python -c "import sys; print(sys.prefix)"
/home/ada/my-project/.venv
(.venv) $ deactivate
$`, lang: 'bash', title: 'the prompt shows the active venv' },
    py`#### Use it without activating`,
    py`Activation is a convenience for interactive shells. Scripts, cron jobs, IDEs and Dockerfiles can just call the venv's interpreter directly — the isolation is identical:`,
    { code: py`.venv/bin/python -m pip install requests     # Windows: .venv\Scripts\python -m pip ...
.venv/bin/python app.py`, lang: 'bash' },
    py`#### What's inside`,
    { code: py`.venv/
├── pyvenv.cfg            <- home = /usr/local/bin, version = 3.14.0, ...
├── bin/                  <- "Scripts\" on Windows
│   ├── python            <- link to (or copy of) the base interpreter
│   ├── pip
│   └── activate, activate.fish, Activate.ps1
└── lib/
    └── python3.14/
        └── site-packages/    <- "Lib\site-packages\" on Windows; your packages go here`, lang: 'text' },
    { callout: 'version', title: 'Python 3.13+: a built-in .gitignore', text: py`Since Python 3.13, \`venv\` writes a \`.gitignore\` containing \`*\` inside the new environment folder, so git ignores it automatically. On older versions, add \`.venv/\` to your project's \`.gitignore\` yourself — it's good practice anyway.` },
    py`#### Useful options`,
    { code: py`python -m venv --upgrade-deps .venv          # also upgrade pip inside it
python -m venv --prompt shop .venv           # show "(shop)" instead of "(.venv)"
python -m venv --system-site-packages .venv  # also see the global packages (rarely wanted)
rm -rf .venv && python -m venv .venv         # start over: venvs are disposable`, lang: 'bash' },
    py`#### Are we in a venv? (from Python)`,
    { code: py`import os
import sys

print("in a venv:", sys.prefix != sys.base_prefix)
print("interpreter:", sys.executable)
print("activated:", os.environ.get("VIRTUAL_ENV", "no"))`, lang: 'python', title: 'the standard check' },
    py`#### Other tools you'll meet`,
    py`- **uv** — a fast, third-party project and package manager (written in Rust). \`uv venv\` creates a standard venv, \`uv pip install\` installs into it, and \`uv\` can also download Python versions and manage lock files.
- **conda** (Anaconda / Miniconda / Miniforge) — a cross-language package and environment manager, popular in data science. A conda environment includes Python itself and non-Python libraries (compilers, C/Fortran libraries) from conda channels. Commands: \`conda create -n shop python=3.12\`, \`conda activate shop\`.
- **pipx** — installs Python *command-line tools* (black, ruff, httpie…) each into its own hidden venv, so they never clash with your projects. See [pip & dependencies](lesson:pip-and-dependencies).
- **Poetry, Hatch, PDM, pipenv** — project managers that create and manage a venv for you.`,
    py`They all build on the same idea: an isolated site-packages per project. Learn plain \`venv\` + \`pip\` first; every other tool will make sense.`,
  ],
  walkthrough: {
    title: 'Reading the playground program',
    lang: 'python',
    code: MAIN,
    intro: py`The browser sandbox can't create a real venv (there is no shell and no pip), so the program does two honest things: it **inspects** the Python that's running it, and it **simulates** the two mechanisms behind venvs — \`pyvenv.cfg\` and \`PATH\` — with made-up paths.`,
    steps: [
      { lines: [12, 17], text: py`Real values from the sandbox. Pyodide's Python lives at the root of an in-memory file system, so \`sys.prefix\` and \`sys.base_prefix\` are both \`/\` — **not** a venv. On your own machine, inside an activated venv, the prefixes differ and \`VIRTUAL_ENV\` is set.` },
      { lines: [19, 23], text: py`\`example_pyvenv.cfg\` is a copy of what \`python -m venv\` writes. At start-up, a Python that finds this file next to it (or one folder up) knows it's in a venv and where its base installation lives (\`home\`).` },
      { lines: [26, 30], text: py`A pretend file system: which programs exist in which folder. Only the venv's \`bin/\` contains \`flask\`, because it was installed there.` },
      { lines: [31, 32], text: py`Before activation, the shell searches \`/usr/local/bin\` first, so \`python\` means the global interpreter.` },
      { lines: [33, 35], text: py`Activation simply **prepends** the venv's \`bin/\` to \`PATH\`. Now \`python\` — and every tool installed in the venv — resolves to the venv's copy. That's all \`activate\` does.` },
    ],
  },
  playground: {
    title: 'Inspect and simulate a venv',
    objective: 'See what the sandbox reports about its own environment, then extend the simulation: deactivate, check where pip points, and flip a pyvenv.cfg setting.',
    files: { 'main.py': MAIN, 'envcheck.py': ENVCHECK, 'example_pyvenv.cfg': PYVENV_CFG },
    expected: py`\`\`\`text
=== 1. The interpreter running this code ===
version        : 3.14.x
sys.prefix     : /
sys.base_prefix: /
in a venv?     : False
VIRTUAL_ENV    : (not set)

=== 2. Reading a venv's pyvenv.cfg ===
base Python    : /usr/local/bin
version        : 3.14.0
global packages: false

=== 3. What 'activate' does to PATH (simplified) ===
before: python -> /usr/local/bin/python
after : python -> /home/ada/shop/.venv/bin/python
after : flask  -> /home/ada/shop/.venv/bin/flask
\`\`\`

Part 1 is real: this browser sandbox is a plain Python (Pyodide) with no venv, so both prefixes are \`/\`. Run the same lines in an activated venv on your computer and you'll see your project's \`.venv\` path as \`sys.prefix\`.`,
    experiments: [
      {
        id: 'deactivate',
        task: py`Add a function \`deactivate(path, venv_bin)\` to **envcheck.py** that returns \`path\` with the \`venv_bin\` folder removed. In main.py, deactivate and print \`after deactivate: python ->\` followed by the resolved path.`,
        hint: py`\`":".join(folder for folder in path.split(":") if folder != venv_bin)\`. In main.py: \`path = deactivate(path, "/home/ada/shop/.venv/bin")\` then print.`,
        tests: [
          { name: 'deactivate removes the venv folder', code: py`assert module('envcheck').deactivate("/v/bin:/usr/local/bin:/usr/bin", "/v/bin") == "/usr/local/bin:/usr/bin"` },
          { name: 'python resolves globally again', code: py`assert 'after deactivate: python -> /usr/local/bin/python' in output` },
        ],
        explain: py`The real \`deactivate\` restores the \`PATH\` saved during activation (and the prompt, and unsets \`VIRTUAL_ENV\`). Nothing is deleted — the venv is still there, just no longer first in line.`,
      },
      {
        id: 'which-pip',
        task: py`In part 3, print where \`pip\` resolves **before** and **after** activation. Why does this explain the advice "always use \`python -m pip\`"?`,
        hint: py`Call \`resolve_command("pip", path, INSTALLED)\` once before \`path = "/home/ada/shop/.venv/bin:" + path\` and once after.`,
        tests: [{ name: 'shows both pip locations', code: py`assert '/usr/local/bin/pip' in output and '/home/ada/shop/.venv/bin/pip' in output` }],
        explain: py`\`pip\` is just another program on \`PATH\`. Forget to activate and it's the global pip, installing into the global site-packages. \`python -m pip\` runs pip *as a module of whichever python you named*, so the packages always go where that interpreter will look for them.`,
      },
      {
        id: 'system-site-packages',
        task: py`Edit **example_pyvenv.cfg** as if the venv had been created with \`--system-site-packages\`: set \`include-system-site-packages\` to \`true\`.`,
        tests: [{ name: 'the cfg now allows global packages', code: py`assert 'global packages: true' in output` }],
        explain: py`With this flag the venv's own site-packages comes first, but the base Python's global site-packages is also searched. It's occasionally useful (e.g. a heavy system package you can't pip-install), but it weakens isolation — imports may silently come from outside your project.`,
      },
      {
        id: 'missing-tool',
        task: py`Print what \`flask\` resolves to **before** activation, as \`before: flask  -> …\`. What would your shell say?`,
        hint: py`Add \`print("before: flask  ->", resolve_command("flask", path, INSTALLED))\` right after the first \`before:\` line.`,
        tests: [{ name: 'flask is not found before activation', code: py`assert 'before: flask  -> None' in output` }],
        explain: py`Command-line tools installed by pip into a venv live in that venv's \`bin/\` (\`Scripts\` on Windows). Before activation they're not on \`PATH\`, so the shell reports "command not found" — run them as \`.venv/bin/flask\` or activate first.`,
      },
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A venv is **just a folder**. There's no hidden registry and no system setting. Delete the folder and the venv is gone; nothing else on your computer changes.`,
      py`It's also **small**: the standard library isn't copied. The venv's \`python\` uses the base installation's standard library and only adds its own site-packages for third-party packages.`,
      py`Activation is optional. It only edits your current terminal session (\`PATH\`, the prompt, \`VIRTUAL_ENV\`). Close the terminal and it's gone.`,
    ],
    technical: [
      py`**How Python knows it's in a venv (PEP 405).** At start-up the interpreter looks for a \`pyvenv.cfg\` file next to its executable or one directory above. If it finds one, it sets \`sys.prefix\` (and \`sys.exec_prefix\`) to the venv folder, keeps \`sys.base_prefix\` pointing at the installation named by \`home\`, and the \`site\` module adds the venv's \`site-packages\` to \`sys.path\` instead of the global one (both, if \`include-system-site-packages = true\`).`,
      py`**The executables.** On macOS and Linux, \`.venv/bin/python\` is normally a symlink to the base interpreter. On Windows, \`venv\` copies a small launcher instead. Either way the *same* interpreter binary runs — the venv changes only where it looks for packages.`,
      py`**What activate does.** It's a shell script: it saves your old \`PATH\`, prepends \`.venv/bin\`, sets \`VIRTUAL_ENV\`, changes the prompt and defines a \`deactivate\` function that undoes all of it. That's why \`pip\` and installed tools (\`flask\`, \`pytest\`) resolve to the venv's copies while it's active.`,
      py`**Why you can't move a venv.** Tools pip installs into \`bin/\` get a first line (a *shebang*, like \`#!/home/ada/shop/.venv/bin/python\`) containing the **absolute** path of the venv's interpreter, and \`pyvenv.cfg\`/the activate scripts contain absolute paths too. Move or rename the folder and those paths point nowhere: \`bad interpreter: No such file or directory\`. The fix is always to recreate.`,
      { code: py`import site
import sys

print(sys.prefix, sys.base_prefix)
print(site.getsitepackages())   # where this interpreter installs/looks for packages`, lang: 'python', title: 'see it from inside Python' },
      { callout: 'note', title: 'Implementation detail', text: py`The \`venv\` module ships with CPython and is also supported by PyPy. Exactly how the executable is linked or copied, and the folder names (\`bin\` vs \`Scripts\`), are platform details — rely on \`sys.prefix\`/\`sys.base_prefix\` and \`python -m\`, not on file layouts.` },
    ],
    production: [
      py`**One venv per project, recreated from a dependency list.** Treat \`.venv\` as a build artefact: never commit it, never copy it between machines. Commit \`pyproject.toml\` and (for applications) a lock file; rebuild the venv anywhere with one command. See [pip & dependencies](lesson:pip-and-dependencies).`,
      py`**CI builds a fresh environment every run.** That proves the dependency list is complete. Cache the *download* of packages, not the venv folder, unless the tool explicitly supports it.`,
      py`**Python version is a separate choice.** A venv inherits its interpreter from whatever created it. Teams pin the Python version too (\`requires-python\` in \`pyproject.toml\`, a \`.python-version\` file read by tools like pyenv and uv) and recreate venvs after upgrading Python.`,
      py`**Know the limits.** A venv isolates *Python packages*, not system libraries, OS packages or other languages. When you need those pinned too, reach for containers (Docker) or conda environments. In container images, a venv is optional but common — for example to copy just \`/opt/venv\` from a build stage into a slim runtime image.`,
      py`**Don't fight PEP 668.** \`pip install --break-system-packages\` does exactly what it says. Use a venv for projects and \`pipx\` (or \`uv tool\`) for standalone command-line tools.`,
    ],
  },
  mistakes: [
    {
      title: 'Installing before (or without) activating',
      wrong: { code: py`$ python3 -m venv .venv
$ pip install flask            # goes to the global Python (or fails: externally-managed-environment)
$ source .venv/bin/activate
(.venv) $ python app.py         # ModuleNotFoundError: No module named 'flask'`, lang: 'bash' },
      right: { code: py`$ python3 -m venv .venv
$ source .venv/bin/activate
(.venv) $ python -m pip install flask
(.venv) $ python app.py`, lang: 'bash' },
      explanation: py`Packages go into the site-packages of whichever interpreter pip belongs to. Activate first, and prefer \`python -m pip\`: it always installs for the \`python\` you're about to run.`,
    },
    {
      title: 'Committing the venv to git',
      wrong: { code: py`$ git add .
$ git status
new file: .venv/bin/python
new file: .venv/lib/python3.14/site-packages/flask/__init__.py
... thousands more`, lang: 'bash' },
      right: { code: py`$ echo ".venv/" >> .gitignore
$ python -m pip freeze > requirements.txt   # or declare deps in pyproject.toml
$ git add .gitignore requirements.txt`, lang: 'bash' },
      explanation: py`A venv contains absolute paths and platform-specific files; it won't work on anyone else's machine. Commit the **recipe** (the dependency list), not the **meal**.`,
    },
    {
      title: 'Moving or renaming a venv folder',
      wrong: { code: py`$ mv ~/old/shop ~/projects/shop
$ ~/projects/shop/.venv/bin/flask run
zsh: /home/ada/projects/shop/.venv/bin/flask: bad interpreter: /home/ada/old/shop/.venv/bin/python: no such file or directory`, lang: 'bash' },
      right: { code: py`$ cd ~/projects/shop
$ rm -rf .venv
$ python3 -m venv .venv && source .venv/bin/activate
(.venv) $ python -m pip install -r requirements.txt`, lang: 'bash' },
      explanation: py`Installed scripts and \`pyvenv.cfg\` contain absolute paths. Venvs are cheap — rebuild instead of moving.`,
    },
    {
      title: 'Forcing installs into the system Python',
      wrong: { code: py`$ sudo pip install requests
$ pip install --break-system-packages requests`, lang: 'bash' },
      right: { code: py`$ python3 -m venv .venv && source .venv/bin/activate
(.venv) $ python -m pip install requests
# for a standalone CLI tool instead:
$ pipx install httpie`, lang: 'bash' },
      explanation: py`\`sudo pip\` can overwrite files the operating system's package manager owns and break system tools. PEP 668 blocks it on many distributions for that reason. Use venvs for projects and pipx for tools.`,
    },
    {
      title: 'One "global" venv shared by every project',
      wrong: { code: py`$ python3 -m venv ~/myenv          # used for every project...
$ source ~/myenv/bin/activate     # ...until two projects need different versions`, lang: 'bash' },
      right: { code: py`$ cd ~/projects/shop && python3 -m venv .venv
$ cd ~/projects/blog && python3 -m venv .venv`, lang: 'bash' },
      explanation: py`A shared venv recreates the original problem — one site-packages for many projects — and hides missing dependencies. One venv per project, inside the project folder.`,
    },
  ],
  debugging: [
    {
      symptom: py`error: externally-managed-environment`,
      cause: py`You ran \`pip install\` against an operating-system-managed Python (for example on recent Debian and Ubuntu releases, and with Homebrew's Python). PEP 668 lets distributions block this.`,
      fix: py`Create and activate a venv for the project, then install. For command-line tools, use \`pipx install <tool>\`.`,
    },
    {
      symptom: py`ModuleNotFoundError: No module named 'flask' — but pip said it was installed`,
      cause: py`The code runs under a different interpreter than the one pip installed into: the venv isn't activated, or your IDE uses another interpreter.`,
      fix: py`Print \`sys.executable\` from the failing code and compare with \`python -m pip --version\`. Activate the venv or select \`.venv/bin/python\` as the IDE's interpreter, then install with \`python -m pip\`.`,
    },
    {
      symptom: py`.venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`,
      cause: py`Windows PowerShell's execution policy blocks unsigned scripts by default.`,
      fix: py`Run \`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\` once, or use \`cmd\` and \`activate.bat\`, or call \`.venv\Scripts\python\` directly.`,
    },
    {
      symptom: py`bad interpreter: No such file or directory (or "Fatal error in launcher" on Windows)`,
      cause: py`The venv was moved, renamed or copied from another machine, or the base Python it points to was upgraded/removed.`,
      fix: py`Delete \`.venv\` and recreate it from your dependency list.`,
    },
    {
      symptom: py`python: command not found (while python3 works)`,
      cause: py`Many macOS/Linux systems only provide \`python3\` outside a venv.`,
      fix: py`Create the venv with \`python3 -m venv .venv\`. Once it's activated, plain \`python\` points at the venv's interpreter.`,
    },
  ],
  bestPractices: [
    'Create one virtual environment per project, named .venv, in the project root.',
    'Activate it (or call .venv/bin/python directly) before installing or running anything.',
    'Install with python -m pip so packages go to the interpreter you will run.',
    'Never commit, copy or move a venv — commit the dependency list and recreate the venv.',
    'Pick the Python version when creating the venv (python3.13 -m venv .venv) and pin it for the team.',
    'Point your editor/IDE at .venv/bin/python (Scripts\\python.exe on Windows).',
    'Use pipx (or uv tool) for global command-line tools; never sudo pip.',
  ],
  useCases: [
    'Working on several projects that need different versions of the same package.',
    'Trying a library without polluting your system.',
    'Reproducing a teammate\'s or the CI server\'s environment exactly.',
    'Building slim Docker images by copying a prepared venv between build stages.',
  ],
  comparison: {
    title: 'venv, conda and uv at a glance',
    headers: ['', 'venv (+ pip)', 'conda', 'uv'],
    rows: [
      ['ships with Python', 'yes (standard library)', 'no — separate installer', 'no — separate tool'],
      ['manages Python versions', 'no — uses the Python that created it', 'yes', 'yes'],
      ['packages from', 'PyPI', 'conda channels (and pip)', 'PyPI'],
      ['non-Python libraries', 'no', 'yes (C/Fortran libs, CUDA toolkits…)', 'no'],
      ['environment is', 'a standard venv folder', 'a conda environment', 'a standard venv folder'],
      ['typical users', 'everyone; the baseline', 'data science, scientific computing', 'teams wanting speed and lock files'],
    ],
    note: py`All three isolate a project's packages. Plain \`venv\` is always available and is what the other Python tools build on.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'virtual-environments-q1',
      type: 'mcq',
      prompt: 'What problem do virtual environments primarily solve?',
      options: [
        { text: 'They make Python code run faster', why: 'The same interpreter runs either way; venvs change where packages are found, not speed.' },
        'Different projects needing different, conflicting package versions on one machine',
        { text: 'They let you run Python without installing it', why: 'A venv needs an installed base Python — it links to it.' },
        { text: 'They sandbox untrusted code for security', why: 'A venv is not a security boundary: code inside it can still read your files and use the network.' },
      ],
      answer: 1,
      explanation: py`Each venv has its own site-packages, so project A can have Django 4.2 while project B has Django 5.2 — and nothing touches the system Python.`,
    },
    {
      id: 'virtual-environments-q2',
      type: 'output',
      prompt: 'What does the last command print?',
      code: py`$ python3 -m venv .venv
$ source .venv/bin/activate
(.venv) $ python -c "import sys; print(sys.prefix == sys.base_prefix)"`,
      answer: 'False',
      accept: ['False'],
      explanation: py`Inside a venv, \`sys.prefix\` is the venv folder while \`sys.base_prefix\` is the base installation, so they differ. \`sys.prefix != sys.base_prefix\` is the standard "am I in a venv?" check.`,
    },
    {
      id: 'virtual-environments-q3',
      type: 'bug',
      prompt: py`After these commands, \`python app.py\` fails with \`ModuleNotFoundError: No module named 'flask'\`. Click the line that caused it.`,
      code: py`cd shop
python3 -m venv .venv
pip install flask
source .venv/bin/activate
python app.py`,
      answerLine: 3,
      explanation: py`\`pip install\` ran **before** activation, so it used the global pip and installed into the global site-packages (or failed with *externally-managed-environment*). After activation, \`python\` is the venv's interpreter, which doesn't see that package. Activate first, then \`python -m pip install flask\`.`,
    },
    {
      id: 'virtual-environments-q4',
      type: 'fill',
      prompt: 'Complete the commands to create and activate a venv on macOS/Linux.',
      code: py`python3 -m ___ .venv
source .venv/bin/___`,
      answer: [['venv'], ['activate']],
      explanation: py`\`python3 -m venv .venv\` runs the standard-library \`venv\` module to create the folder; \`source .venv/bin/activate\` loads the activation script into your current shell.`,
    },
    {
      id: 'virtual-environments-q5',
      type: 'mcq',
      prompt: py`You renamed your project folder from \`shop\` to \`store\`, and now \`.venv/bin/pytest\` fails with "bad interpreter". What's the right fix?`,
      options: [
        { text: 'Edit the first line of every script in .venv/bin by hand', why: 'Possible in theory, but fragile — pyvenv.cfg and the activate scripts also contain the old path.' },
        { text: 'Add the old path back with a symlink', why: 'A workaround that hides the problem and breaks again on the next move.' },
        'Delete .venv and recreate it, then reinstall from the dependency list',
        { text: 'Run pip install --upgrade pip', why: 'Upgrading pip does not rewrite the absolute paths already baked into the venv.' },
      ],
      answer: 2,
      explanation: py`Venvs contain absolute paths and are not relocatable. They're disposable by design: \`rm -rf .venv\`, recreate, reinstall.`,
    },
    {
      id: 'virtual-environments-q6',
      type: 'mcq',
      prompt: py`Which statements about activation are true? **Select all that apply.**`,
      options: [
        'It puts the venv\'s bin/ (Scripts\\ on Windows) at the front of PATH',
        'It sets the VIRTUAL_ENV environment variable',
        'You can skip it by running .venv/bin/python directly',
        { text: 'It copies the installed packages into the base Python', why: 'Nothing is copied; activation only changes the current shell\'s environment variables and prompt.' },
      ],
      answer: [0, 1, 2],
      explanation: py`Activation is a shell convenience: \`PATH\`, \`VIRTUAL_ENV\`, the prompt and a \`deactivate\` function. The isolation itself comes from the venv's interpreter finding \`pyvenv.cfg\`.`,
    },
    {
      id: 'virtual-environments-q7',
      type: 'short',
      prompt: py`A teammate asks why they shouldn't just commit the \`.venv\` folder "so everyone has the same packages". What do you tell them?`,
      answer: py`A venv is machine-specific: it contains absolute paths, links to a particular Python installation and platform-specific compiled files, so it won't work on another computer (or even after moving the folder). It's also huge. Instead commit the dependency list — pyproject.toml plus a lock file or pinned requirements.txt — and let everyone (and CI) recreate the venv from it with one command. That gives the same packages reproducibly.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'describe-environment',
      title: 'Which environment am I in?',
      difficulty: 'intermediate',
      prompt: py`Write \`describe(prefix, base_prefix, environ)\` — the arguments are values like \`sys.prefix\`, \`sys.base_prefix\` and \`os.environ\` — returning exactly one of:

| situation | return value |
|---|---|
| not in a venv, no \`VIRTUAL_ENV\` | \`"Global Python at {base_prefix}"\` |
| not in a venv, but \`VIRTUAL_ENV\` is set | \`"Warning: {VIRTUAL_ENV} is activated, but this is the global Python at {base_prefix}"\` |
| in a venv and \`VIRTUAL_ENV\` equals \`prefix\` | \`"Active venv: {prefix}"\` |
| in a venv otherwise | \`"Venv used directly (not activated): {prefix}"\` |

"In a venv" means \`prefix != base_prefix\`.`,
      files: { 'main.py': DESCRIBE_MAIN },
      hints: [
        'Compute in_venv = prefix != base_prefix and active = environ.get("VIRTUAL_ENV") first.',
        'Handle the two "not in a venv" cases first (check whether active is None), then the two venv cases (compare active with prefix).',
        'if not in_venv: return the warning if active else the global message; elif active == prefix: "Active venv: ..."; else: "Venv used directly (not activated): ...".',
      ],
      solution: {
        explanation: py`The function takes plain values instead of reading \`sys\` and \`os.environ\` itself, which makes it pure and testable — call it with \`sys.prefix, sys.base_prefix, os.environ\` in real code. The warning case is a real-world trap: a terminal where a venv was activated, but an IDE, a script's shebang or a typo (\`python3.12\`) runs a *different* interpreter. The prefixes tell you which Python is running; \`VIRTUAL_ENV\` only tells you what the shell was told.`,
        files: { 'main.py': py`def describe(prefix, base_prefix, environ):
    """One-line description of the Python environment (see the prompt)."""
    in_venv = prefix != base_prefix
    active = environ.get("VIRTUAL_ENV")
    if not in_venv:
        if active:
            return f"Warning: {active} is activated, but this is the global Python at {base_prefix}"
        return f"Global Python at {base_prefix}"
    if active == prefix:
        return f"Active venv: {prefix}"
    return f"Venv used directly (not activated): {prefix}"


print(describe("/usr/local", "/usr/local", {}))
print(describe("/home/ada/shop/.venv", "/usr/local", {"VIRTUAL_ENV": "/home/ada/shop/.venv"}))
` },
      },
      tests: [
        { name: 'global Python', code: py`assert describe("/usr/local", "/usr/local", {}) == "Global Python at /usr/local"` },
        { name: 'activated venv', code: py`assert describe("/p/.venv", "/usr", {"VIRTUAL_ENV": "/p/.venv"}) == "Active venv: /p/.venv"` },
        { name: 'venv used directly', code: py`assert describe("/p/.venv", "/usr", {}) == "Venv used directly (not activated): /p/.venv"` },
        { name: 'venv activated but global Python running', code: py`assert describe("/usr", "/usr", {"VIRTUAL_ENV": "/p/.venv"}) == "Warning: /p/.venv is activated, but this is the global Python at /usr"` },
        { name: 'a different venv is activated', code: py`assert describe("/a/.venv", "/usr", {"VIRTUAL_ENV": "/b/.venv"}) == "Venv used directly (not activated): /a/.venv"` },
      ],
    },
    {
      id: 'stale-venv',
      title: 'Is this venv too old?',
      difficulty: 'intermediate',
      prompt: py`Your project now requires Python 3.13, and old venvs must be rebuilt. Using the \`pyvenv.cfg\` in the project:

1. \`read_pyvenv_cfg(text)\` → dict of \`key = value\` pairs. Skip blank lines and lines starting with \`#\`; split on the **first** \`=\`; strip spaces around keys and values.
2. \`venv_version(cfg)\` → the \`version\` entry as a tuple of ints: \`"3.12.4"\` → \`(3, 12, 4)\`.
3. \`needs_rebuild(cfg, minimum)\` → \`True\` if the venv's version is lower than the \`minimum\` tuple, e.g. \`(3, 13)\`.

The program should print \`(3, 12, 4) True\`.`,
      files: { 'main.py': REBUILD_MAIN, 'pyvenv.cfg': OLD_PYVENV },
      hints: [
        'Loop over text.splitlines(); after line = line.strip(), skip it if not line or line.startswith("#").',
        'line.partition("=") splits on the first "=" only. tuple(int(part) for part in cfg["version"].split(".")) converts the version.',
        'Tuples compare element by element, left to right: (3, 12, 4) < (3, 13) is True. So needs_rebuild is just venv_version(cfg) < minimum.',
      ],
      solution: {
        explanation: py`\`partition("=")\` splits on the first \`=\` only, so values containing \`=\` (like a \`command\` line with arguments) survive intact. Version strings must be compared as **numbers**: as strings, \`"3.9" > "3.13"\` is \`True\` because \`"9" > "1"\`. Converting to tuples of ints gives correct, element-by-element comparison, and a shorter tuple like \`(3, 13)\` works as a minimum because \`(3, 12, 4) < (3, 13)\`. In real tooling you'd compare with \`sys.version_info\` or the \`packaging.version\` library.`,
        files: { 'main.py': py`from pathlib import Path


def read_pyvenv_cfg(text):
    """{key: value} from 'key = value' lines; skip blank lines and # comments."""
    settings = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, sep, value = line.partition("=")
        if sep:
            settings[key.strip()] = value.strip()
    return settings


def venv_version(cfg):
    """The 'version' entry as a tuple of ints: '3.12.4' -> (3, 12, 4)."""
    return tuple(int(part) for part in cfg["version"].split("."))


def needs_rebuild(cfg, minimum):
    """True if the venv's Python is older than the minimum version tuple."""
    return venv_version(cfg) < minimum


cfg = read_pyvenv_cfg(Path("pyvenv.cfg").read_text())
print(venv_version(cfg), needs_rebuild(cfg, (3, 13)))
`, 'pyvenv.cfg': OLD_PYVENV },
      },
      tests: [
        { name: 'parses keys and values, skipping comments and blanks', code: py`cfg = read_pyvenv_cfg("# hi\nhome = /usr/bin\n\nversion = 3.12.4\n")
assert cfg == {"home": "/usr/bin", "version": "3.12.4"}` },
        { name: 'splits on the first = only', code: py`cfg = read_pyvenv_cfg("command = python -m venv --prompt=shop .venv")
assert cfg["command"] == "python -m venv --prompt=shop .venv"` },
        { name: 'version as a tuple of ints', code: py`assert venv_version({"version": "3.12.4"}) == (3, 12, 4)` },
        { name: 'numeric, not string, comparison', code: py`assert needs_rebuild({"version": "3.9.18"}, (3, 13)) is True
assert needs_rebuild({"version": "3.13.0"}, (3, 13)) is False
assert needs_rebuild({"version": "3.14.1"}, (3, 13)) is False` },
        { name: 'prints the result for pyvenv.cfg', code: py`assert output.strip() == "(3, 12, 4) True"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'virtual-environments-what-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a Python virtual environment and why would you use one?',
      answer: 'A self-contained folder with its own site-packages and a link to a base Python interpreter. Packages installed while it is in use go into that folder, so each project gets its own isolated set of dependencies and versions, without touching the system Python.',
      explanation: py`It solves version conflicts between projects, protects the OS-managed Python (PEP 668), and makes environments reproducible from a dependency list. It does not copy the standard library or isolate non-Python system libraries.`,
      whyAsked: 'A baseline professional-practice question: anyone who has shipped Python code should use venvs routinely.',
      mistakes: ['Saying it is a separate Python installation (it reuses the base interpreter)', 'Calling it a security sandbox', 'Not mentioning version conflicts'],
      followUps: ['What does activation do?', 'Should the venv be committed to git?', 'How is it different from conda or Docker?'],
      modelAnswer: 'A virtual environment is a folder, conventionally .venv in the project, that has its own site-packages directory and a python that links back to a base installation. When I use that interpreter, packages install into and import from the venv\'s site-packages instead of the global one. That lets every project pin its own versions — one project on Django 4.2, another on 5.2 — and keeps me from breaking the operating system\'s Python. It also makes the setup reproducible: I commit the dependency list, not the venv, and anyone can recreate an identical environment. It only isolates Python packages, though — system libraries need containers or conda.',
    },
    {
      id: 'virtual-environments-activation',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does activating a virtual environment actually do? Is it required?',
      answer: 'Activation is a shell script that prepends the venv\'s bin (Scripts) folder to PATH, sets VIRTUAL_ENV, changes the prompt and defines deactivate. It is not required: the isolation comes from the venv\'s interpreter finding pyvenv.cfg at start-up, so running .venv/bin/python directly gives the same environment.',
      explanation: py`When Python starts, it looks for \`pyvenv.cfg\` beside its executable (or one level up). Finding it sets \`sys.prefix\` to the venv and makes \`site\` add the venv's site-packages. Activation merely makes the short names \`python\`, \`pip\` and installed tools resolve to the venv's copies.`,
      whyAsked: 'Separates people who follow recipes from people who understand the mechanism — important for debugging CI, cron jobs, Docker and IDE setups.',
      mistakes: ['Thinking activation is what isolates packages', 'Activating venvs inside Dockerfiles with source (each RUN is a new shell)'],
      followUps: ['How would you use a venv in a cron job or Dockerfile?', 'How does Python detect the venv at start-up?'],
      modelAnswer: 'Activation is just a convenience script for your current shell. It saves the old PATH and puts the venv\'s bin folder in front, sets VIRTUAL_ENV, changes the prompt and defines a deactivate function to undo all that. The real isolation happens when the venv\'s interpreter starts: it finds pyvenv.cfg next to itself, sets sys.prefix to the venv and adds the venv\'s site-packages to sys.path. So in scripts, cron jobs or Dockerfiles I skip activation and call .venv/bin/python directly — same result, fewer surprises.',
    },
    {
      id: 'virtual-environments-ide-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A package is installed in the project venv and works in the terminal, but running the file from the IDE raises ModuleNotFoundError. What do you check?',
      answer: 'Which interpreter the IDE uses. Print sys.executable (and sys.prefix) from the failing run; it is probably the global Python. Point the IDE at .venv/bin/python (Scripts\\python.exe on Windows) or recreate the venv where the IDE auto-detects it.',
      explanation: py`Packages belong to an interpreter. The terminal's activated \`python\` and the IDE's configured interpreter are separate settings; \`sys.executable\` reveals which one actually ran.`,
      code: { lang: 'python', code: py`import sys

print(sys.executable)                      # which python is this?
print(sys.prefix != sys.base_prefix)       # inside a venv?` },
      whyAsked: 'Extremely common in practice; tests systematic debugging rather than reinstalling blindly.',
      mistakes: ['Reinstalling the package globally to "make it work"', 'Adding the venv site-packages to sys.path in code'],
      followUps: ['How do you make the IDE pick the venv automatically?', 'How would you catch this in CI?'],
      modelAnswer: 'Packages are installed per interpreter, so the first thing I check is which interpreter the IDE runs. I print sys.executable and sys.prefix from the failing run — usually it is the global Python rather than .venv/bin/python. Then I select the venv\'s interpreter in the IDE settings; most editors auto-detect a folder named .venv in the project root. I would not fix it by installing globally or appending paths to sys.path, because that just hides the mismatch.',
    },
    {
      id: 'virtual-environments-tools-comparison',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare venv, conda and uv. When would you choose each?',
      answer: 'venv is the standard-library baseline: isolated PyPI packages on a Python you already have. conda manages whole environments including Python itself and non-Python binary libraries from conda channels — strong for scientific stacks. uv is a fast third-party tool that creates standard venvs, installs from PyPI, manages Python versions and lock files. Choose by needs: plain venv everywhere, conda for complex native dependencies, uv for speed and integrated project management.',
      explanation: py`All three provide per-project isolation. The differences are where packages come from (PyPI vs conda channels), whether the tool installs Python itself, and how much project management (locking, syncing) is built in.`,
      whyAsked: 'Teams standardise on tooling; interviewers want a balanced, factual view rather than tribal preference.',
      mistakes: ['Claiming one tool is always best', 'Thinking conda environments and venvs are the same format', 'Not knowing that uv creates ordinary venvs'],
      followUps: ['How would you migrate a team from pip + requirements.txt to a lock-file workflow?', 'Can you mix conda and pip?'],
      modelAnswer: 'venv ships with Python and gives isolated site-packages on an interpreter you already have; with pip it installs from PyPI and works everywhere, so it is my baseline. conda is a separate environment and package manager that installs Python itself plus non-Python binaries — compilers, BLAS, CUDA libraries — from conda channels, which is why data science teams like it. uv is a newer third-party tool that is very fast, creates standard venvs, can install Python versions and manages lock files, so it can replace pip, venv and pip-tools in one. I choose based on the dependencies: pure-Python web services are fine with venv or uv; heavy native scientific stacks are easier with conda.',
    },
    {
      id: 'virtual-environments-detect-venv',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `running_in_venv(sys_module)` that returns True if the given sys-like object describes an interpreter inside a virtual environment. Support stdlib venvs (`base_prefix` differs from `prefix`) and very old virtualenv releases, which set `sys.real_prefix` instead. Some objects may lack `base_prefix` entirely.',
      answer: 'Return True if the object has a real_prefix attribute; otherwise compare getattr(sys_module, "base_prefix", sys_module.prefix) with sys_module.prefix.',
      explanation: py`Modern code only needs \`sys.prefix != sys.base_prefix\` (Python 3.3+). Legacy virtualenv (before its 20.x rewrite) patched in \`sys.real_prefix\`; checking for it keeps tooling robust with old environments. Taking the module as a parameter lets tests pass fakes like \`types.SimpleNamespace\`.`,
      starter: { files: { 'main.py': py`import sys


def running_in_venv(sys_module):
    """True if sys_module describes a Python running inside a virtual environment."""
    # TODO
    return False


print("this interpreter:", running_in_venv(sys))
` } },
      tests: [
        { name: 'modern venv detected', code: py`from types import SimpleNamespace as NS
assert running_in_venv(NS(prefix="/p/.venv", base_prefix="/usr")) is True` },
        { name: 'global Python is not a venv', code: py`from types import SimpleNamespace as NS
assert running_in_venv(NS(prefix="/usr", base_prefix="/usr")) is False` },
        { name: 'legacy virtualenv via real_prefix', code: py`from types import SimpleNamespace as NS
assert running_in_venv(NS(prefix="/p/env", real_prefix="/usr")) is True` },
        { name: 'missing base_prefix does not crash', code: py`from types import SimpleNamespace as NS
assert running_in_venv(NS(prefix="/usr")) is False` },
        { name: 'works on the real sys module', code: py`import sys
assert running_in_venv(sys) == (sys.prefix != sys.base_prefix)` },
      ],
      solution: { files: { 'main.py': py`import sys


def running_in_venv(sys_module):
    """True if sys_module describes a Python running inside a virtual environment."""
    if hasattr(sys_module, "real_prefix"):          # legacy virtualenv (< 20)
        return True
    base = getattr(sys_module, "base_prefix", sys_module.prefix)
    return base != sys_module.prefix


print("this interpreter:", running_in_venv(sys))
` } },
      hints: ['hasattr(obj, "real_prefix") detects the legacy attribute.', 'getattr(obj, "base_prefix", obj.prefix) falls back to prefix when the attribute is missing — which then compares equal.'],
      whyAsked: 'Tooling and plugins sometimes need to know the environment; this checks knowledge of PEP 405 and defensive attribute access.',
      mistakes: ['Checking os.environ["VIRTUAL_ENV"] (only set by activate)', 'Looking for ".venv" in sys.executable', 'Crashing when base_prefix is missing'],
      followUps: ['Why is VIRTUAL_ENV an unreliable signal?', 'What does sys.base_exec_prefix mean?'],
      modelAnswer: 'Since PEP 405 the reliable signal is that sys.prefix, the active environment, differs from sys.base_prefix, the installation the venv was created from. Very old virtualenv versions predate that and instead set sys.real_prefix, so I check for that attribute first. I use getattr with prefix as the default so an object without base_prefix compares equal and returns False instead of crashing. I avoid the VIRTUAL_ENV variable, because it is only set by the activate script and says nothing about which interpreter is actually running.',
    },
    {
      id: 'virtual-environments-reproducible-team',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: '"Works on my machine" keeps happening on your team: different developers, CI and production get different package versions. How do you make Python environments reproducible?',
      answer: 'Pin the Python version (requires-python, .python-version), declare direct dependencies in pyproject.toml, generate and commit a lock file with exact versions (and hashes) for the application, recreate a fresh venv from the lock file everywhere — dev, CI and the production image — and never copy venvs between machines. CI builds from scratch to prove the lock is complete.',
      explanation: py`A venv gives isolation; a lock file gives **sameness**. Tools: \`pip freeze\`/\`pip-tools\` (\`pip-compile\`), \`uv lock\`/\`uv sync\`, Poetry or PDM. Docker images built from the lock file make production match CI. See [pip & dependencies](lesson:pip-and-dependencies).`,
      whyAsked: 'A senior-level operational question: reproducibility failures cost real time and cause production incidents.',
      mistakes: ['Answering only "use a virtualenv" (isolation is not reproducibility)', 'Committing the venv', 'Pinning library dependencies too tightly in a published package'],
      followUps: ['Library vs application: should both commit lock files?', 'How do you update pinned versions safely?', 'What do hashes in a lock file protect against?'],
      modelAnswer: 'Isolation alone is not enough; I need everyone to install the same versions. I would pin the Python version for the project, keep direct dependencies with sensible ranges in pyproject.toml, and generate a lock file with exact versions and hashes that we commit — using pip-tools, uv or Poetry. Every environment — laptops, CI and the production Docker image — is a fresh venv installed from that lock file, never a copied venv. CI builds from scratch on each run, which proves the lock file is complete, and dependency updates happen deliberately through pull requests that regenerate the lock file and run the tests.',
    },
  ],

  takeaways: [
    'A virtual environment is a folder with its own site-packages and a link to a base Python; each project gets its own.',
    'Create with python -m venv .venv; activate with source .venv/bin/activate (Windows: .venv\\Scripts\\activate); leave with deactivate.',
    'Activation only edits PATH, VIRTUAL_ENV and the prompt — running .venv/bin/python directly is equally isolated.',
    'Inside a venv sys.prefix != sys.base_prefix; that is the reliable check.',
    'Never commit, copy or move a venv; commit the dependency list and recreate it.',
    'Use python -m pip so installs go to the interpreter you run; use pipx for global CLI tools; respect PEP 668.',
    'venv is the baseline; uv and conda build on the same idea with extra features.',
  ],
}
