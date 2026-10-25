// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PYPROJECT = py`[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "expense-tracker"
version = "0.3.1"
description = "Summarise spending from CSV files"
readme = "README.md"
license = "MIT"
authors = [{ name = "Ada Lovelace", email = "ada@example.com" }]
dependencies = [
    "rich>=13,<14",
]
classifiers = [
    "Programming Language :: Python :: 3",
    "Operating System :: OS Independent",
]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff"]

[project.scripts]
expenses = "expense_tracker.cli:main"

[project.urls]
Homepage = "https://example.com/expense-tracker"
`

const CHECKER = py`"""A SIMPLIFIED pyproject.toml checker.

Real tools: 'python -m build' (fails on invalid metadata), 'twine check dist/*'
and the third-party 'validate-pyproject'. This one checks a handful of common mistakes.
"""
import re

NAME = re.compile(r"^([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])$", re.IGNORECASE)   # PEP 508
VERSION = re.compile(r"^\d+(\.\d+)*$")              # simplified: release numbers only
ENTRY_POINT = re.compile(r"^[\w.]+:[\w.]+$")        # package.module:function


def normalise(name):
    """PEP 503: lower-case; runs of - _ . become a single -."""
    return re.sub(r"[-_.]+", "-", name).lower()


def check_project(data, root):
    """Return a list of (level, message); level is 'ERROR' or 'WARNING'."""
    problems = []
    build = data.get("build-system", {})
    if not build.get("requires") or "build-backend" not in build:
        problems.append(("ERROR", "[build-system] needs 'requires' and 'build-backend'"))

    project = data.get("project")
    if project is None:
        return problems + [("ERROR", "missing [project] table")]

    name = project.get("name", "")
    if not NAME.match(name):
        problems.append(("ERROR", f"invalid project name: {name!r}"))

    version = project.get("version")
    if version is None and "version" not in project.get("dynamic", []):
        problems.append(("ERROR", "set 'version' or list it in 'dynamic'"))
    elif version is not None and not VERSION.match(version):
        problems.append(("ERROR", f"version {version!r} is not a simple release number"))

    if "requires-python" not in project:
        problems.append(("WARNING", "no 'requires-python': pip cannot skip unsupported Pythons"))

    readme = project.get("readme")
    if isinstance(readme, str) and not (root / readme).exists():
        problems.append(("ERROR", f"readme file not found: {readme}"))

    deps = project.get("dependencies", [])
    if not isinstance(deps, list) or not all(isinstance(d, str) for d in deps):
        problems.append(("ERROR", "'dependencies' must be a list of strings"))

    for command, target in project.get("scripts", {}).items():
        if not ENTRY_POINT.match(target):
            problems.append(("ERROR", f"script {command!r}: expected 'module:function', got {target!r}"))
    return problems


def _file_stem(project):
    """Distribution file names use the normalised name with underscores."""
    return f"{normalise(project['name']).replace('-', '_')}-{project['version']}"


def sdist_name(project):
    return _file_stem(project) + ".tar.gz"


def wheel_name(project):
    return _file_stem(project) + "-py3-none-any.whl"   # pure Python: any Python 3, any OS
`

const MAIN = py`"""Inspect and check pyproject.toml before building (tomllib needs Python 3.11+)."""
import tomllib
from pathlib import Path

from checker import check_project, sdist_name, wheel_name

with open("pyproject.toml", "rb") as f:          # tomllib only accepts binary files
    data = tomllib.load(f)

project = data["project"]
print(f"{project['name']} {project['version']}: {project['description']}")
print("build backend:", data["build-system"]["build-backend"])
print("dependencies :", ", ".join(project.get("dependencies", [])) or "(none)")
for command, target in project.get("scripts", {}).items():
    print(f"command      : {command} -> {target}")

print("--- check ---")
problems = check_project(data, Path("."))
for level, message in problems:
    print(f"{level}: {message}")
if not any(level == "ERROR" for level, _ in problems):
    print("python -m build would create:")
    print("  dist/" + sdist_name(project))
    print("  dist/" + wheel_name(project))
`

const README = py`# expense-tracker

Summarise spending from CSV files.

    pip install expense-tracker
    expenses data/march.csv
`

const BUMP_TEXT = py`PYPROJECT = """[tool.bumpversion]
version = "0.3.1"          # another tool's copy: leave it alone

[project]
name = "expense-tracker"
version = "0.3.1"          # keep this comment
dependencies = ["rich>=13,<14"]
"""
`

const CLI = py`"""Command-line entry points."""


class App:
    @staticmethod
    def run():
        print("App.run called")
        return 0


def main():
    print("expenses: nothing to report yet")
    return 0
`

const ENTRY_MAIN_TAIL = py`

for target in ["expense_tracker.cli:main", "expense_tracker.cli:App.run"]:
    func = load_entry_point(target)
    print(target, "->", func() if callable(func) else "not loaded yet")
`

const WHEEL_START = py`def parse_wheel_filename(filename):
    """Split a wheel file name into its parts (see the question)."""
    # TODO
    return {}


print(parse_wheel_filename("expense_tracker-0.3.1-py3-none-any.whl"))
`

export default {
  id: 'packaging',
  title: 'pyproject.toml & packaging your code',
  summary: 'Describe your project in pyproject.toml, build it into an sdist and a wheel with a build backend, expose commands as entry points, and publish versioned releases to PyPI.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['pip-and-dependencies', 'project-structure'],
  related: ['virtual-environments', 'main-guard-and-scripts', 'packages', 'code-quality-tools', 'static-type-checking', 'secure-practices'],
  tags: ['packaging', 'pyproject.toml', 'PEP 621', 'PEP 517', 'PEP 518', 'build backend', 'setuptools', 'hatchling', 'flit', 'sdist', 'wheel', 'python -m build', 'entry points', 'console scripts', 'versioning', 'semantic versioning', 'PyPI', 'TestPyPI', 'twine', 'uv publish', 'trusted publishing', 'tomllib', 'editable install'],
  apis: [
    { name: '[build-system]', summary: 'pyproject.toml table naming the build backend and what it needs to run (PEP 517/518).' },
    { name: '[project]', summary: 'Standard project metadata: name, version, dependencies, requires-python… (PEP 621).' },
    { name: '[project.scripts]', summary: 'Console-script entry points: command = "package.module:function".' },
    { name: 'python -m build', summary: 'Build an sdist (.tar.gz) and a wheel (.whl) into dist/ (the build package from PyPA).' },
    { name: 'twine upload dist/*', summary: 'Upload built distributions to PyPI (or TestPyPI with --repository testpypi).' },
    { name: 'uv build / uv publish', summary: 'uv\'s equivalents of building and uploading.' },
    { name: 'tomllib.load(binary_file)', summary: 'Parse TOML (read-only) — standard library since Python 3.11.' },
    { name: 'importlib.metadata.version(name)', summary: 'Read an installed distribution\'s version at runtime.' },
  ],
  docs: [
    { label: 'Packaging guide — Packaging Python projects (tutorial)', url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/' },
    { label: 'Packaging guide — Writing your pyproject.toml', url: 'https://packaging.python.org/en/latest/guides/writing-pyproject-toml/' },
    { label: 'pyproject.toml specification (PEP 621 metadata)', url: 'https://packaging.python.org/en/latest/specifications/pyproject-toml/' },
    { label: 'Entry points specification', url: 'https://packaging.python.org/en/latest/specifications/entry-points/' },
    { label: 'tomllib — Parse TOML files', url: 'https://docs.python.org/3/library/tomllib.html' },
    { label: 'Publishing releases with GitHub Actions (trusted publishing)', url: 'https://packaging.python.org/en/latest/guides/publishing-package-distribution-releases-using-github-actions-ci-cd-workflows/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Packaging** turns your project folder into files that anyone can install with \`pip install\` — on another machine, in CI, or from PyPI. The whole recipe lives in one file, \`pyproject.toml\`, written in TOML (a simple \`key = value\` configuration format with \`[tables]\`).`,
    py`It has three parts:`,
    py`- **\`[build-system]\`** — which **build backend** turns your source into installable files (setuptools, hatchling, flit-core, pdm-backend, poetry-core…);
- **\`[project]\`** — the **metadata**: name, version, description, required Python, dependencies, commands to install;
- **\`[tool.*]\`** — settings for other tools (ruff, pytest, mypy…).`,
    py`Building produces two **distributions** in \`dist/\`: an **sdist** (*source distribution*, a \`.tar.gz\` of your source plus metadata) and a **wheel** (\`.whl\`, a ready-to-install zip that pip just unpacks). Upload them to **PyPI** and the world can \`pip install expense-tracker\`.`,
  ],
  why: [
    py`**Share code properly.** Copying folders between projects goes stale immediately. A package has a name and a version, so other projects can depend on \`expense-tracker>=0.3,<1\` and get fixes by upgrading.`,
    py`**Dependencies come along.** When someone installs your package, pip reads your \`dependencies\` and installs those too — no "also install these five things" in the README.`,
    py`**Real commands.** One line in \`[project.scripts]\` gives users an \`expenses\` command on their \`PATH\` — no \`python path/to/script.py\`.`,
    py`**Even private code benefits.** Installing your own project into its venv (\`pip install -e .\`) is what makes the [src layout](lesson:project-structure) work, puts your package on \`sys.path\` without hacks, and lets internal teams share libraries through a private index.`,
  ],
  eli15: [
    py`Imagine you've invented a board game and want to sell it.`,
    py`You fill in a **form** for the factory: the game's name, version ("2nd edition"), what's needed to play ("needs 2 dice"), who made it. That form is \`pyproject.toml\`.`,
    py`The **factory** (the build backend) produces two things: a **ready-to-play boxed game** (the wheel — open it and play) and a **kit with all the parts and instructions** (the sdist — you can build the box yourself). You put them in a **shop** (PyPI). Customers buy the box with \`pip install\`. And once "2nd edition" is in the shop, it can never be swapped for a different box with the same label — fix something and you print a "2nd edition, revision 1".`,
  ],
  analogy: {
    title: 'Publishing a book',
    body: [
      py`Your manuscript is the source code. The publisher's form — title, author, edition, the audience it's for — is \`pyproject.toml\`. A printing press (the build backend) produces finished books (wheels) and can also bundle the manuscript with printing instructions (the sdist) for anyone who wants to print it themselves.`,
      py`Bookshops (PyPI) stock each **edition** forever; you can't quietly replace an edition, only publish a new one. Before a big launch you print a proof copy for a small test shop (TestPyPI) to check that everything looks right.`,
    ],
    mapping: [
      ['manuscript', 'your source code (src/expense_tracker/)'],
      ['the publisher\'s form', 'pyproject.toml — [project] metadata'],
      ['printing press', 'the build backend (hatchling, setuptools…)'],
      ['finished book', 'the wheel (.whl): install = unpack'],
      ['manuscript + printing instructions', 'the sdist (.tar.gz): needs a build step'],
      ['edition number', 'the version (0.3.1) — never reused'],
      ['the bookshop / the proof shop', 'PyPI / TestPyPI'],
      ['"start reading at chapter 3" on the cover', 'an entry point: expenses = "expense_tracker.cli:main"'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'From source folder to pip install',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'src', label: 'project/', note: 'pyproject.toml + src/', x: 90, y: 160, tone: 'yellow' },
        { id: 'frontend', label: 'python -m build', note: 'build frontend', x: 260, y: 60, tone: 'blue' },
        { id: 'backend', label: 'build backend', note: 'e.g. hatchling', x: 260, y: 260, tone: 'blue' },
        { id: 'sdist', label: 'sdist .tar.gz', note: 'source + metadata', x: 450, y: 60, tone: 'kraft' },
        { id: 'wheel', label: 'wheel .whl', note: 'ready to unpack', x: 450, y: 260, tone: 'kraft' },
        { id: 'pypi', label: 'PyPI', note: 'twine / uv publish', x: 620, y: 160, tone: 'ink' },
        { id: 'user', label: 'pip install', note: 'site-packages + bin/expenses', x: 680, y: 290, tone: 'yellow' },
      ],
      edges: [
        { from: 'src', to: 'frontend', label: 'reads [build-system]' },
        { from: 'frontend', to: 'backend', label: 'isolated env' },
        { from: 'backend', to: 'sdist', label: 'build_sdist' },
        { from: 'backend', to: 'wheel', label: 'build_wheel' },
        { from: 'sdist', to: 'pypi', label: 'upload' },
        { from: 'wheel', to: 'pypi', label: 'upload' },
        { from: 'pypi', to: 'user', label: 'download wheel' },
      ],
      steps: [
        { focus: ['src', 'frontend'], edges: ['src->frontend'], text: py`You run a **build frontend** (\`python -m build\`, \`uv build\`, or pip itself during \`pip install .\`). It reads \`[build-system]\` from \`pyproject.toml\`.` },
        { focus: ['backend'], edges: ['frontend->backend'], text: py`The frontend creates a temporary, isolated environment, installs the packages listed in \`requires\` (e.g. \`hatchling\`), and calls the **backend** through a standard interface (PEP 517). Frontend and backend can be mixed freely.` },
        { focus: ['sdist', 'wheel'], edges: ['backend->sdist', 'backend->wheel'], text: py`The backend writes the **sdist** (\`expense_tracker-0.3.1.tar.gz\`) and the **wheel** (\`expense_tracker-0.3.1-py3-none-any.whl\`), each containing the metadata from \`[project]\`.` },
        { focus: ['pypi'], edges: ['sdist->pypi', 'wheel->pypi'], text: py`An upload tool (\`twine upload dist/*\` or \`uv publish\`) sends both files to **PyPI**. A version, once uploaded, is permanent — you can't overwrite it.` },
        { focus: ['user'], edges: ['pypi->user'], text: py`Users run \`pip install expense-tracker\`. pip prefers the **wheel**: it just unpacks it into site-packages, installs the dependencies, and generates the \`expenses\` command from \`[project.scripts]\`. No build step, no code from your project runs at install time.` },
      ],
    },
    alt: 'Diagram: the project folder with pyproject.toml is read by the build frontend (python -m build), which runs the build backend such as hatchling in an isolated environment. The backend produces an sdist (.tar.gz) and a wheel (.whl). Both are uploaded to PyPI with twine or uv publish, and pip install downloads the wheel and unpacks it into site-packages, creating the expenses command.',
    caption: py`Frontend (build, pip, uv) and backend (hatchling, setuptools…) talk through a standard interface, so you can choose them independently.`,
  },
  syntax: [
    py`#### A complete pyproject.toml`,
    { code: PYPROJECT.replace('license = "MIT"\n', 'requires-python = ">=3.11"\nlicense = "MIT"\n'), lang: 'toml', title: 'pyproject.toml' },
    py`| key | what it means |
|---|---|
| \`name\` | the **distribution** name on PyPI (\`expense-tracker\`); must be unique there. The **import** name is your package folder (\`expense_tracker\`) — they often differ. |
| \`version\` | a [PEP 440](lesson:pip-and-dependencies) version. Can instead be listed in \`dynamic = ["version"]\` and supplied by the backend (e.g. from a git tag or a \`__version__\` variable). |
| \`requires-python\` | pip won't install this release on older Pythons. |
| \`dependencies\` | runtime requirements with **ranges**, never exact pins. |
| \`optional-dependencies\` | *extras*: \`pip install "expense-tracker[dev]"\`. |
| \`license\` | an SPDX expression such as \`"MIT"\` (PEP 639). Some older backend versions expect the table form \`license = { text = "MIT" }\`. |
| \`classifiers\`, \`urls\` | search categories and links shown on PyPI. |
| \`[project.scripts]\` | commands to create on install. |`,
    py`#### Choosing a build backend`,
    { code: py`[build-system]                       # pick ONE of these
requires = ["setuptools>=77"]        # the long-standing default; very configurable
build-backend = "setuptools.build_meta"

# requires = ["hatchling"]           build-backend = "hatchling.build"
# requires = ["flit_core>=3.4"]      build-backend = "flit_core.buildapi"
# requires = ["pdm-backend"]         build-backend = "pdm.backend"
# requires = ["poetry-core"]         build-backend = "poetry.core.masonry.api"`, lang: 'toml' },
    py`For pure-Python projects they all produce equivalent wheels; pick the one your team's tools use. Projects with C/C++/Rust extensions use specialised backends (e.g. scikit-build-core, meson-python, maturin).`,
    py`#### Build`,
    { code: py`python -m pip install build twine      # once, in your dev venv (or: pipx install build)
python -m build                        # builds both into dist/
ls dist/
# expense_tracker-0.3.1.tar.gz
# expense_tracker-0.3.1-py3-none-any.whl
python -m twine check dist/*           # validate the metadata/README rendering
# or with uv:  uv build`, lang: 'bash' },
    py`A wheel's file name says where it can be installed: \`{name}-{version}-{python tag}-{ABI tag}-{platform tag}.whl\`. \`py3-none-any\` means "any Python 3, no compiled ABI, any OS" — a pure-Python wheel. Compiled packages ship one wheel per platform, like \`cp313-cp313-win_amd64\`.`,
    py`#### Entry points: installing commands`,
    { code: py`[project.scripts]
expenses = "expense_tracker.cli:main"            # creates an 'expenses' command

[project.gui-scripts]
expenses-gui = "expense_tracker.gui:main"        # no console window on Windows

[project.entry-points."expense_tracker.plugins"]
csv = "expense_tracker.importers:CsvImporter"    # plugin registry other code can query`, lang: 'toml' },
    py`On install, pip writes a tiny launcher into the environment's \`bin/\` (\`Scripts\` on Windows) that imports \`expense_tracker.cli\` and runs \`sys.exit(main())\` — so \`main()\` should take no required arguments and return an exit status (see [scripts vs modules](lesson:main-guard-and-scripts)). Plugin groups are discovered at runtime with \`importlib.metadata.entry_points(group="expense_tracker.plugins")\`.`,
    py`#### Versioning`,
    py`Most libraries use **semantic versioning**: \`MAJOR.MINOR.PATCH\`. Bump PATCH for bug fixes, MINOR for backwards-compatible features, MAJOR for breaking changes. Releases before \`1.0.0\` promise less stability. Read the installed version at runtime from metadata instead of duplicating it:`,
    { code: py`from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("expense-tracker")
except PackageNotFoundError:        # running from a source checkout that isn't installed
    __version__ = "0.0.0+unknown"
print(__version__)`, lang: 'python', title: 'single source of truth for the version' },
    py`#### Publishing`,
    { code: py`# 1. rehearse on TestPyPI (separate account and API token)
python -m twine upload --repository testpypi dist/*
python -m pip install --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ expense-tracker

# 2. the real thing
python -m twine upload dist/*
# or: uv publish`, lang: 'bash' },
    { callout: 'warn', title: 'Credentials', text: py`PyPI uploads authenticate with an **API token** (scoped to one project when possible) or, better, **trusted publishing**: your CI (e.g. GitHub Actions) proves its identity to PyPI with short-lived OIDC credentials, so no long-lived secret is stored anywhere. Never commit tokens, and enable two-factor authentication on your PyPI account.` },
    py`#### Develop with an editable install`,
    { code: py`python -m pip install -e ".[dev]"     # your package + the dev extra, editable`, lang: 'bash' },
    py`An *editable* install (PEP 660) points the environment at your source folder, so code changes take effect without reinstalling. Re-run it when you change metadata such as dependencies or entry points.`,
    { callout: 'version', title: 'tomllib is 3.11+ and read-only', text: py`\`tomllib\` (Python 3.11+) parses TOML but cannot write it. On older Pythons the same API is available from the third-party \`tomli\` package; to *edit* TOML while keeping comments, use a third-party library such as \`tomlkit\`.` },
  ],
  walkthrough: {
    title: 'Reading the playground\'s checker',
    lang: 'python',
    code: MAIN,
    intro: py`The playground can't run \`python -m build\` (no pip, no network), so it does the part you can do with the standard library: **parse \`pyproject.toml\` with \`tomllib\` and check it** before building. The checks live in \`checker.py\` and are deliberately simplified.`,
    steps: [
      { lines: [7, 8], text: py`\`tomllib.load\` needs a file opened in **binary** mode (\`"rb"\`) — TOML is defined as UTF-8, so the library decodes it itself. The result is ordinary dicts and lists: tables become dicts, arrays become lists.` },
      { lines: [10, 14], text: py`Nested tables are nested dicts: \`[project.scripts]\` is \`data["project"]["scripts"]\`. Optional keys are read with \`.get()\` and a default.` },
      { lines: [17, 20], text: py`\`check_project\` returns \`(level, message)\` pairs. The starting file has one warning on purpose — fix it in the first experiment.` },
      { lines: [21, 24], text: py`Distribution file names use the normalised name with underscores: project \`expense-tracker\` 0.3.1 becomes \`expense_tracker-0.3.1.tar.gz\` and \`expense_tracker-0.3.1-py3-none-any.whl\`.` },
    ],
  },
  playground: {
    title: 'Check a pyproject.toml',
    objective: 'Run the checker, fix its warning, bump the version, add a command and break an entry point on purpose.',
    files: { 'main.py': MAIN, 'checker.py': CHECKER, 'pyproject.toml': PYPROJECT, 'README.md': README },
    expected: py`\`\`\`text
expense-tracker 0.3.1: Summarise spending from CSV files
build backend: hatchling.build
dependencies : rich>=13,<14
command      : expenses -> expense_tracker.cli:main
--- check ---
WARNING: no 'requires-python': pip cannot skip unsupported Pythons
python -m build would create:
  dist/expense_tracker-0.3.1.tar.gz
  dist/expense_tracker-0.3.1-py3-none-any.whl
\`\`\`

**Simplified:** real builds validate far more (PEP 440 versions, classifiers, license files, README rendering). Use \`python -m build\` and \`twine check\` on your own machine.`,
    experiments: [
      {
        id: 'requires-python',
        task: py`Fix the warning: add \`requires-python = ">=3.11"\` to the \`[project]\` table in **pyproject.toml**.`,
        hint: py`Put it on its own line under \`readme = "README.md"\`, inside \`[project]\` (before \`[project.optional-dependencies]\`).`,
        tests: [
          { name: 'no warnings left', code: py`assert 'WARNING' not in output` },
          { name: 'requires-python is in [project]', code: py`import tomllib
assert tomllib.loads(files['pyproject.toml'])['project'].get('requires-python') == '>=3.11'` },
        ],
        explain: py`\`requires-python\` is copied into every release's metadata. pip reads it before downloading and simply skips releases that don't support the running Python — so users on old Pythons get your last compatible version instead of a broken install. Note that TOML keys belong to the most recent \`[table]\` header above them.`,
      },
      {
        id: 'bump-version',
        task: py`You added a backwards-compatible feature. Bump the version following semantic versioning, and check the new wheel name.`,
        hint: py`MINOR bump: \`0.3.1\` → \`0.4.0\`.`,
        tests: [{ name: 'wheel is 0.4.0', code: py`assert 'dist/expense_tracker-0.4.0-py3-none-any.whl' in output` }],
        explain: py`New feature, nothing broken → MINOR, and PATCH resets to 0. Every upload needs a **new** version: PyPI permanently refuses a file name it has seen before, even if you deleted the release.`,
      },
      {
        id: 'second-command',
        task: py`Add a second console command, \`expenses-report\`, that runs the \`main\` function in \`expense_tracker.report\`.`,
        hint: py`Under \`[project.scripts]\`: \`expenses-report = "expense_tracker.report:main"\`.`,
        tests: [{ name: 'both commands are listed', code: py`assert 'command      : expenses-report -> expense_tracker.report:main' in output and 'command      : expenses -> ' in output` }],
        explain: py`Each line becomes one launcher in the venv's \`bin/\`. The command name is free-form (dashes are common); the target is always \`importable.module:callable\`.`,
      },
      {
        id: 'broken-entry-point',
        task: py`A classic mistake: change the \`expenses\` script target to a **file path**, \`"expense_tracker/cli.py"\`. What does the checker say?`,
        tests: [{ name: 'the checker reports the bad entry point', code: py`assert "ERROR: script 'expenses': expected 'module:function'" in output` }],
        explain: py`Entry points name an **importable module** and an **attribute** inside it, separated by a colon — not a file path. A wrong target often builds fine and only fails when a user runs the command (\`ModuleNotFoundError\` or \`AttributeError\`), so check it in CI by installing the wheel and running \`expenses --help\`.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Legacy setup.py vs modern pyproject.toml',
    props: {
      left: { label: 'setup.py (legacy, executable code)', lang: 'python', code: py`from setuptools import find_packages, setup

setup(
    name="expense-tracker",
    version="0.3.1",
    packages=find_packages("src"),
    package_dir={"": "src"},
    install_requires=["rich>=13,<14"],
    python_requires=">=3.11",
    entry_points={"console_scripts": ["expenses=expense_tracker.cli:main"]},
)` },
      right: { label: 'pyproject.toml (declarative, standard)', lang: 'toml', code: py`[build-system]
requires = ["setuptools>=77"]
build-backend = "setuptools.build_meta"

[project]
name = "expense-tracker"
version = "0.3.1"
requires-python = ">=3.11"
dependencies = ["rich>=13,<14"]

[project.scripts]
expenses = "expense_tracker.cli:main"` },
      points: [
        'setup.py is a Python program: tools must execute it to learn the metadata. pyproject.toml is data any tool can read.',
        'The [project] table is a cross-tool standard (PEP 621): the same keys work with setuptools, hatchling, flit, pdm and others.',
        '[build-system] lets pip install the right backend version in an isolated environment before building (PEP 518).',
        'setuptools still supports setup.py for complex builds, but running "python setup.py install" directly is deprecated — always build with a frontend (pip, build, uv).',
      ],
    },
    alt: 'Side by side: a legacy setup.py calling setuptools.setup with name, version, packages, install_requires and console_scripts entry points, versus the equivalent declarative pyproject.toml with build-system, project and project.scripts tables.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A **wheel** is just a zip file with a special name. Inside: your package folders (\`expense_tracker/…\`) and a \`expense_tracker-0.3.1.dist-info/\` folder holding the metadata (\`METADATA\`), the entry points (\`entry_points.txt\`) and a \`RECORD\` of every file with its hash. Installing = unzipping into site-packages and writing the launcher scripts.`,
      py`An **sdist** is a \`.tar.gz\` of your source tree plus \`pyproject.toml\` and a \`PKG-INFO\` metadata file. Installing from it requires *building a wheel first* — which is why pip prefers wheels: faster, and no build code runs on the user's machine.`,
    ],
    technical: [
      py`**PEP 517 / 518.** \`[build-system].requires\` lists what the backend needs; a frontend creates an isolated build environment, installs those, then calls hooks on the backend object named by \`build-backend\` — \`build_wheel()\`, \`build_sdist()\`, and \`build_editable()\` (PEP 660) for \`pip install -e\`. Because the interface is standard, \`pip\`, \`build\` and \`uv\` work with any backend.`,
      py`**Pure vs platform wheels.** A pure-Python project produces one \`py3-none-any\` wheel for everyone. Packages with compiled extensions need a wheel per (Python version, ABI, OS/CPU) combination — tags like \`cp313-cp313-manylinux_2_17_x86_64\` or \`cp313-cp313-macosx_11_0_arm64\`; the *manylinux* tags describe Linux wheels compatible with many distributions. If no wheel matches, pip falls back to building from the sdist, which needs a compiler.`,
      py`**What gets included.** Backends discover packages automatically (hatchling and setuptools both understand the src layout), but data files, namespace packages or unusual layouts may need configuration under \`[tool.<backend>]\`. Always inspect a build: \`python -m zipfile -l dist/*.whl\` lists a wheel's contents (\`tar -tzf\` for the sdist).`,
      py`**Console-script launchers** are generated at install time for the target environment: on POSIX a small Python script whose first line points at the venv's interpreter; on Windows a small \`.exe\` launcher. That's why commands work without activation when called by full path — and why venvs aren't relocatable.`,
      py`**Name normalisation.** PyPI and pip treat \`Expense_Tracker\`, \`expense-tracker\` and \`expense.tracker\` as the same project (PEP 503). Distribution files use the normalised name with underscores (\`expense_tracker-0.3.1…\`), and the dist-info folder follows the same rule.`,
    ],
    production: [
      py`**Automate releases.** Tag the commit (\`v0.4.0\`), let CI build the sdist and wheel **once**, test the built wheel in a clean venv, then publish with trusted publishing. Tools like setuptools-scm or hatch-vcs can derive the version from the git tag (\`dynamic = ["version"]\`), so the tag is the single source of truth.`,
      py`**Releases are immutable.** You can't overwrite or re-upload a version. If a release is broken, **yank** it on PyPI (pip then skips it unless pinned exactly) and publish a fixed version. Keep a CHANGELOG so users know what changed and whether it's safe to upgrade.`,
      py`**Ship type information.** If your package has type hints, include an empty \`py.typed\` file in it (PEP 561) so type checkers in users' projects trust your annotations — see [static type checking](lesson:static-type-checking).`,
      py`**Keep metadata honest.** Correct \`requires-python\`, realistic dependency ranges, a README that renders on PyPI (\`twine check\`), project URLs and a license. They're how users and tools decide whether your package is safe to depend on.`,
      py`**Private packages** don't need PyPI: install from a git URL (\`pip install "expense-tracker @ git+https://…@v0.4.0"\`), a private index (Artifactory, a cloud provider's registry, devpi), or a folder of wheels (\`pip install --find-links ./wheels\`). Configure private indexes carefully to avoid dependency confusion — see [secure practices](lesson:secure-practices).`,
    ],
  },
  mistakes: [
    {
      title: 'Entry point written as a file path',
      wrong: { code: py`[project.scripts]
expenses = "src/expense_tracker/cli.py"`, lang: 'toml' },
      right: { code: py`[project.scripts]
expenses = "expense_tracker.cli:main"`, lang: 'toml' },
      explanation: py`An entry point is \`importable.module:callable\`. The launcher does \`from expense_tracker.cli import main; sys.exit(main())\` — paths and \`.py\` suffixes can't be imported.`,
    },
    {
      title: 'Re-uploading the same version',
      wrong: { code: py`$ python -m twine upload dist/*
HTTPError: 400 Bad Request ... File already exists.`, lang: 'bash' },
      right: { code: py`# bump the version in pyproject.toml (0.3.1 -> 0.3.2), then
$ rm -rf dist/ && python -m build && python -m twine upload dist/*`, lang: 'bash' },
      explanation: py`PyPI never allows a file name (and therefore a version) to be reused, even after deleting a release — users must be able to trust that \`0.3.1\` always means the same bytes. Bump the version, and clear old files out of \`dist/\` before uploading.`,
    },
    {
      title: 'Exact pins in a library\'s dependencies',
      wrong: { code: py`dependencies = ["rich==13.9.4", "markdown-it-py==3.0.0"]`, lang: 'toml' },
      right: { code: py`dependencies = ["rich>=13,<14"]`, lang: 'toml' },
      explanation: py`Your package will be installed next to other packages. Exact pins (and pinning transitive dependencies you don't import) make it conflict with them. Declare the range you support; lock exact versions only in applications. See [pip & dependencies](lesson:pip-and-dependencies).`,
    },
    {
      title: 'Opening TOML in text mode',
      wrong: { code: py`import tomllib

with open("pyproject.toml") as f:          # text mode
    data = tomllib.load(f)                  # TypeError: File must be opened in binary mode`, lang: 'python', static: true },
      right: { code: py`import tomllib

with open("pyproject.toml", "rb") as f:
    data = tomllib.load(f)
# or: tomllib.loads(Path("pyproject.toml").read_text(encoding="utf-8"))`, lang: 'python', static: true },
      explanation: py`\`tomllib.load\` takes a **binary** file and decodes UTF-8 itself; \`tomllib.loads\` takes a \`str\`.`,
    },
    {
      title: 'Never testing the built wheel',
      wrong: { code: py`$ python -m pytest          # passes — but it imported ./expense_tracker, not the wheel
$ python -m twine upload dist/*`, lang: 'bash' },
      right: { code: py`$ python -m build
$ python -m venv /tmp/check && /tmp/check/bin/python -m pip install dist/*.whl
$ /tmp/check/bin/expenses --help          # the installed command really works`, lang: 'bash' },
      explanation: py`Missing subpackages, data files or broken entry points only show up in the built artifact. Install the wheel into a fresh venv (ideally in CI) and smoke-test it before publishing; the src layout makes your normal test run use the installed package too.`,
    },
  ],
  debugging: [
    {
      symptom: py`tomllib.TOMLDecodeError: Invalid value (at line 2, column 12)`,
      cause: py`The TOML itself is malformed — commonly an unquoted string (\`requires = hatchling\`), a missing comma or bracket in an array, or a duplicated key/table.`,
      fix: py`Go to the line and column in the message. Strings need quotes, arrays need brackets: \`requires = ["hatchling"]\`. Most editors highlight TOML syntax errors.`,
    },
    {
      symptom: py`After pip install, running the command fails with ModuleNotFoundError: No module named 'expense_tracker'`,
      cause: py`The package wasn't included in the wheel (wrong layout/discovery settings), or the entry point names the wrong module.`,
      fix: py`List the wheel's contents (\`python -m zipfile -l dist/*.whl\`), fix package discovery in \`[tool.<backend>]\` or the folder layout, and check \`[project.scripts]\`.`,
    },
    {
      symptom: py`HTTPError: 400 Bad Request from https://upload.pypi.org/legacy/ — File already exists.`,
      cause: py`That version (file name) was uploaded before.`,
      fix: py`Bump the version, rebuild, delete old files from \`dist/\` (or upload \`dist/*0.3.2*\` only).`,
    },
    {
      symptom: py`ERROR: Package 'expense-tracker' requires a different Python: 3.10.12 not in '>=3.11'`,
      cause: py`The user's Python is older than your \`requires-python\` — and no older release supports it.`,
      fix: py`Upgrade the Python in that environment, or (if you intend to support it) lower \`requires-python\` and test on that version in CI.`,
    },
    {
      symptom: py`The installed package can't find its data file: FileNotFoundError for templates/report.html`,
      cause: py`Non-Python files weren't included in the wheel, or the code builds paths from the current directory.`,
      fix: py`Configure the backend to include the files, and load them with \`importlib.resources.files("expense_tracker") / "templates" / "report.html"\`.`,
    },
  ],
  bestPractices: [
    'Describe every project in pyproject.toml: [build-system] + [project]; keep tool settings in [tool.*].',
    'Use the src layout and test the built wheel, not just the source folder.',
    'Declare requires-python and realistic dependency ranges; never exact pins in a library.',
    'Expose commands with [project.scripts] pointing at a main() that returns an exit status.',
    'Follow semantic versioning; never reuse a version; keep a changelog.',
    'Build with python -m build (or uv build), check with twine check, rehearse on TestPyPI.',
    'Publish from CI with trusted publishing or a project-scoped API token — never commit credentials.',
    'Read your version at runtime with importlib.metadata.version() instead of duplicating it.',
  ],
  useCases: [
    'Publishing an open-source library or command-line tool to PyPI.',
    'Sharing internal libraries between a company\'s services through a private index.',
    'Installing your own application into its venv (pip install -e .) so imports and commands just work.',
    'Building wheels once in CI and deploying exactly those artifacts.',
  ],
  comparison: {
    title: 'sdist vs wheel',
    headers: ['', 'sdist (.tar.gz)', 'wheel (.whl)'],
    rows: [
      ['contains', 'source tree + pyproject.toml + PKG-INFO', 'files laid out for site-packages + .dist-info metadata'],
      ['install step', 'build a wheel first (may need a compiler)', 'unpack (no build code runs)'],
      ['speed', 'slower', 'fast'],
      ['platform', 'one for everyone', 'pure: one py3-none-any; compiled: one per platform/Python'],
      ['why publish it', 'lets anyone rebuild from source; used by distributions', 'what pip installs whenever a compatible one exists'],
    ],
    note: py`Publish both. \`python -m build\` creates both by default (building the wheel from the sdist, which also checks the sdist is complete).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'packaging-q1',
      type: 'mcq',
      prompt: py`Why does pip prefer installing a **wheel** over an **sdist**?`,
      options: [
        { text: 'Wheels are encrypted, so they are safer', why: 'Wheels are ordinary zip files. The safety benefit is that no build code runs at install time.' },
        'A wheel is already built: pip just unpacks it, with no build step or compiler needed',
        { text: 'Wheels contain the dependencies bundled inside', why: 'Wheels list dependencies in their metadata; pip still installs them separately.' },
        { text: 'sdists can only be installed on Linux', why: 'sdists are platform-independent source; they just need building first.' },
      ],
      answer: 1,
      explanation: py`Installing a wheel is copying files into site-packages. An sdist must first be built into a wheel on the user's machine, which is slower, may need compilers, and runs the project's build backend.`,
    },
    {
      id: 'packaging-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import tomllib

data = tomllib.loads("""
[project]
name = "expense-tracker"
version = "1.2.0"
dependencies = ["rich>=13"]

[project.scripts]
expenses = "expense_tracker.cli:main"
""")
print(data["project"]["scripts"])`,
      answer: "{'expenses': 'expense_tracker.cli:main'}",
      accept: ["{'expenses': 'expense_tracker.cli:main'}", '{"expenses": "expense_tracker.cli:main"}'],
      explanation: py`TOML tables become nested dicts: \`[project.scripts]\` is the \`"scripts"\` key inside the \`"project"\` dict. Printing a dict shows Python's repr, with single quotes.`,
    },
    {
      id: 'packaging-q3',
      type: 'bug',
      prompt: py`This builds fine, but after \`pip install\`, running \`expenses\` crashes. Click the faulty line.`,
      code: py`[project]
name = "expense-tracker"
version = "0.3.1"
dependencies = ["rich>=13,<14"]

[project.scripts]
expenses = "expense_tracker/cli.py"`,
      answerLine: 7,
      explanation: py`Entry points must be \`importable.module:callable\` — here \`"expense_tracker.cli:main"\`. A file path can't be imported, so the generated launcher fails at runtime.`,
    },
    {
      id: 'packaging-q4',
      type: 'fill',
      prompt: 'Fill in the commands: build the sdist and wheel, then upload them.',
      code: py`python -m ___
python -m twine ___ dist/*`,
      answer: [['build'], ['upload']],
      explanation: py`\`python -m build\` (the PyPA \`build\` package) writes the sdist and wheel to \`dist/\`; \`twine upload dist/*\` sends them to PyPI (add \`--repository testpypi\` to rehearse).`,
    },
    {
      id: 'packaging-q5',
      type: 'mcq',
      prompt: py`What does \`py3-none-any\` in \`expense_tracker-0.3.1-py3-none-any.whl\` tell you?`,
      options: [
        'Pure Python: works on any Python 3, needs no compiled ABI, and runs on any OS',
        { text: 'It was built with Python 3 and has no dependencies', why: 'Dependencies are in the metadata, not the file name. "none" refers to the ABI (compiled interface).' },
        { text: 'It is a pre-release that works on any version', why: 'Pre-release status would be part of the version (e.g. 0.3.1rc1), not the tags.' },
        { text: 'It only works on Linux', why: '"any" is the platform tag: every operating system.' },
      ],
      answer: 0,
      explanation: py`The three tags are *Python* (\`py3\`), *ABI* (\`none\` — no compiled extension) and *platform* (\`any\`). Compiled packages have tags like \`cp313-cp313-win_amd64\`.`,
    },
    {
      id: 'packaging-q6',
      type: 'mcq',
      prompt: py`You uploaded version 0.3.1 with a bug. What's the correct way to ship the fix? **Select all that apply.**`,
      options: [
        'Fix the bug, bump to 0.3.2, build and upload',
        'Optionally yank 0.3.1 on PyPI so resolvers skip it',
        { text: 'Delete 0.3.1 on PyPI and upload the fixed files as 0.3.1 again', why: 'PyPI never accepts a previously used file name, even after deletion. Versions are immutable.' },
        { text: 'Overwrite the files with twine upload --force', why: 'There is no way to overwrite a release on PyPI.' },
      ],
      answer: [0, 1],
      explanation: py`Releases are immutable so a version always means the same code. Publish a new PATCH version; yanking marks the bad one so pip avoids it unless someone pins it exactly.`,
    },
    {
      id: 'packaging-q7',
      type: 'short',
      prompt: py`Explain the difference between the **build frontend** and the **build backend**, with an example of each.`,
      answer: py`The frontend is the tool you run — pip, python -m build or uv build. It reads [build-system] from pyproject.toml, creates an isolated build environment, installs the backend listed in requires, and calls it. The backend — setuptools, hatchling, flit-core, pdm-backend, poetry-core — actually turns the source into an sdist and a wheel through the standard PEP 517 hooks. Because the interface is standard, any frontend works with any backend.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'bump-version',
      title: 'A release helper: bump the version',
      difficulty: 'intermediate',
      prompt: py`Write two functions:

1. \`bump(version, part)\` — semantic versioning for \`"MAJOR.MINOR.PATCH"\` strings. \`part\` is \`"major"\`, \`"minor"\` or \`"patch"\`: \`bump("1.4.2", "minor")\` → \`"1.5.0"\`. Raise \`ValueError\` for an unknown part or a version that isn't exactly three numbers.
2. \`bump_pyproject(text, part)\` — return the TOML text with **only the \`[project]\` table's** version bumped. Everything else stays byte-for-byte identical — comments, and any other \`version = …\` lines (e.g. in \`[tool.*]\` tables).

\`tomllib\` can *read* TOML but not write it, so read the current version with \`tomllib.loads\`, then edit the text carefully.`,
      files: {
        'main.py': py`import re
import tomllib

${BUMP_TEXT}

def bump(version, part):
    """'1.4.2', 'minor' -> '1.5.0'"""
    return version   # TODO


def bump_pyproject(text, part):
    """Return text with only [project].version bumped."""
    return text   # TODO


print(bump("1.4.2", "minor"))
print(bump_pyproject(PYPROJECT, "minor"))
`,
      },
      hints: [
        'bump: split on ".", require exactly 3 parts, convert to ints, then build the new tuple for each part (lower parts reset to 0).',
        'bump_pyproject: old = tomllib.loads(text)["project"]["version"]. Find where the [project] table starts with text.index("[project]") and search for the version line only after that point.',
        'pattern = re.compile(r\'^(version\\s*=\\s*)"\' + re.escape(old) + \'"\', re.MULTILINE); m = pattern.search(text, start); then splice: text[:m.start()] + m.group(1) + f\'"{new}"\' + text[m.end():].',
      ],
      solution: {
        explanation: py`\`bump\` validates its input instead of guessing — a release tool should fail loudly on \`"1.4"\` or \`"mayor"\`. \`bump_pyproject\` uses \`tomllib\` to *understand* the file (which version is the project's?) and a targeted text edit to *change* it, so comments and formatting survive; a regex replace over the whole file would also have bumped the \`[tool.bumpversion]\` copy. \`pattern.search(text, start)\` begins searching at the \`[project]\` header. **Simplified:** real release tools (bump-my-version, hatch version, uv version) or a TOML library that preserves formatting (tomlkit) handle more layouts.`,
        files: {
          'main.py': py`import re
import tomllib

${BUMP_TEXT}

def bump(version, part):
    """'1.4.2', 'minor' -> '1.5.0'"""
    pieces = version.split(".")
    if len(pieces) != 3 or not all(p.isdigit() for p in pieces):
        raise ValueError(f"expected MAJOR.MINOR.PATCH, got {version!r}")
    major, minor, patch = map(int, pieces)
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    if part == "patch":
        return f"{major}.{minor}.{patch + 1}"
    raise ValueError(f"unknown part: {part!r}")


def bump_pyproject(text, part):
    """Return text with only [project].version bumped."""
    old = tomllib.loads(text)["project"]["version"]
    new = bump(old, part)
    start = text.index("[project]")
    pattern = re.compile(r'^(version\s*=\s*)"' + re.escape(old) + '"', re.MULTILINE)
    match = pattern.search(text, start)
    return text[:match.start()] + match.group(1) + f'"{new}"' + text[match.end():]


print(bump("1.4.2", "minor"))
print(bump_pyproject(PYPROJECT, "minor"))
`,
        },
      },
      tests: [
        { name: 'patch, minor and major bumps', code: py`assert bump("1.4.2", "patch") == "1.4.3"
assert bump("1.4.2", "minor") == "1.5.0"
assert bump("1.4.2", "major") == "2.0.0"` },
        { name: 'numbers, not strings', code: py`assert bump("1.9.9", "minor") == "1.10.0"` },
        { name: 'bad input raises ValueError', code: py`with raises(ValueError):
    bump("1.4", "patch")
with raises(ValueError):
    bump("1.4.2", "mayor")` },
        { name: 'only [project].version changes', code: py`import tomllib
new = bump_pyproject(PYPROJECT, "minor")
data = tomllib.loads(new)
assert data["project"]["version"] == "0.4.0"
assert data["tool"]["bumpversion"]["version"] == "0.3.1"` },
        { name: 'comments and everything else are preserved', code: py`new = bump_pyproject(PYPROJECT, "patch")
assert "# keep this comment" in new and "# another tool's copy" in new
assert new.replace('version = "0.3.2"', 'version = "0.3.1"', 1).count("0.3.1") == 2
assert len(new.splitlines()) == len(PYPROJECT.splitlines())` },
      ],
    },
    {
      id: 'load-entry-point',
      title: 'What a console-script launcher does',
      difficulty: 'intermediate',
      prompt: py`Write \`load_entry_point(target)\` that turns an entry-point string into the object it names — exactly what pip's generated \`expenses\` launcher does before calling it:

- \`target\` looks like \`"package.module:attribute"\`; the attribute part may be dotted (\`"expense_tracker.cli:App.run"\`);
- import the module with \`importlib.import_module\`, then follow each attribute with \`getattr\`;
- raise \`ValueError\` if there is no \`:\` or either side is empty (e.g. \`"expense_tracker/cli.py"\`, \`"json:"\`, \`":main"\`);
- let \`ModuleNotFoundError\` / \`AttributeError\` propagate for missing modules or attributes.

The program prints:

\`\`\`text
expenses: nothing to report yet
expense_tracker.cli:main -> 0
App.run called
expense_tracker.cli:App.run -> 0
\`\`\``,
      files: {
        'main.py': py`import importlib


def load_entry_point(target):
    """'package.module:attr.sub' -> the object it names."""
    return None   # TODO
${ENTRY_MAIN_TAIL}`,
        'expense_tracker/__init__.py': py`"""expense_tracker: the importable package."""
`,
        'expense_tracker/cli.py': CLI,
      },
      hints: [
        'target.partition(":") gives (module_name, ":", attribute_path) — and an empty separator when there is no colon.',
        'Validate first: if not sep or not module_name or not attribute_path: raise ValueError(...).',
        'obj = importlib.import_module(module_name); for name in attribute_path.split("."): obj = getattr(obj, name); return obj',
      ],
      solution: {
        explanation: py`This mirrors \`importlib.metadata.EntryPoint.load()\`. The part before the colon is a dotted **module** path that the import system can find; the part after is a chain of **attributes** inside that module, which is why a nested \`App.run\` works. Validating the format up front gives a clear \`ValueError\` instead of a confusing import error for \`"expense_tracker/cli.py"\`, while genuine missing modules or attributes still raise their own, informative exceptions. The real launcher then does \`sys.exit(func())\`, so \`main()\`'s return value becomes the exit status.`,
        files: {
          'main.py': py`import importlib


def load_entry_point(target):
    """'package.module:attr.sub' -> the object it names."""
    module_name, sep, attribute_path = target.partition(":")
    if not sep or not module_name or not attribute_path:
        raise ValueError(f"expected 'module:attribute', got {target!r}")
    obj = importlib.import_module(module_name)
    for name in attribute_path.split("."):
        obj = getattr(obj, name)
    return obj
${ENTRY_MAIN_TAIL}`,
          'expense_tracker/__init__.py': py`"""expense_tracker: the importable package."""
`,
          'expense_tracker/cli.py': CLI,
        },
      },
      tests: [
        { name: 'loads a module-level function', code: py`assert load_entry_point("expense_tracker.cli:main") is module("expense_tracker.cli").main` },
        { name: 'follows dotted attributes', code: py`assert load_entry_point("expense_tracker.cli:App.run") == module("expense_tracker.cli").App.run` },
        { name: 'works for any importable module', code: py`import json
assert load_entry_point("json:dumps") is json.dumps` },
        { name: 'rejects malformed targets', code: py`for bad in ["expense_tracker/cli.py", "json:", ":main"]:
    with raises(ValueError):
        load_entry_point(bad)` },
        { name: 'missing attributes raise AttributeError', code: py`with raises(AttributeError):
    load_entry_point("expense_tracker.cli:nope")` },
        { name: 'prints both calls', code: py`assert "expense_tracker.cli:main -> 0" in output and "expense_tracker.cli:App.run -> 0" in output` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'packaging-pyproject-tables',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is pyproject.toml, and what goes in its main tables?',
      answer: 'The standard configuration file for a Python project. [build-system] names the build backend and its requirements (PEP 517/518); [project] holds standard metadata — name, version, requires-python, dependencies, optional dependencies, scripts (PEP 621); [tool.<name>] tables configure individual tools such as ruff, pytest and mypy.',
      explanation: py`It replaced \`setup.py\`/\`setup.cfg\` and many tool-specific config files with one declarative file that any tool can read without executing code.`,
      whyAsked: 'Modern Python projects all use it; interviewers check you know the standard structure, not just one tool\'s flavour.',
      mistakes: ['Thinking pyproject.toml is a Poetry-only file', 'Putting exact pins in [project].dependencies of a library', 'Not knowing what [build-system] is for'],
      followUps: ['What is the difference between the build frontend and backend?', 'How would you make the version dynamic?'],
      modelAnswer: 'pyproject.toml is the standard, declarative configuration file for a Python project. The build-system table tells any frontend, like pip or build, which backend to install and call — setuptools, hatchling and so on. The project table is the standardised metadata from PEP 621: name, version, description, requires-python, dependencies with ranges, optional extras and console scripts, which every backend understands. And tool tables hold settings for ruff, pytest, mypy or coverage. Because it is plain data rather than an executable setup.py, tools can read it safely and consistently.',
    },
    {
      id: 'packaging-sdist-vs-wheel',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare sdists and wheels. Why publish both?',
      answer: 'An sdist is a source archive that must be built on the installer\'s machine; a wheel is a built archive that pip just unpacks. Wheels are faster and run no build code at install time; pure-Python projects need one universal wheel, compiled ones need one per platform. Publish the sdist too so anyone (and downstream distributors) can rebuild from source or install where no wheel matches.',
      explanation: py`Wheel tags (\`py3-none-any\`, \`cp313-cp313-manylinux_…\`) tell pip compatibility. If no compatible wheel exists, pip builds from the sdist — needing the build backend and possibly a compiler.`,
      whyAsked: 'Shows understanding of what actually gets installed and why installs sometimes need compilers.',
      mistakes: ['Saying wheels contain their dependencies', 'Not knowing why pip sometimes compiles code during install'],
      followUps: ['What do manylinux tags mean?', 'What runs on the user\'s machine when installing an sdist?'],
      modelAnswer: 'An sdist is a tarball of the source plus metadata; to install it, pip first builds a wheel locally using the project\'s build backend, which can be slow and may need compilers. A wheel is the already-built result: a zip laid out for site-packages with a dist-info metadata folder, so installing is just unpacking — fast and with no project build code running. A pure-Python project ships one py3-none-any wheel, while compiled packages ship a wheel per Python version and platform. I publish both: the wheel for normal installs, the sdist so people and distributions can rebuild from source when no wheel fits.',
    },
    {
      id: 'packaging-missing-module-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Tests pass in your repo, but after `pip install expense-tracker`, users get `ModuleNotFoundError: No module named \'expense_tracker.reports\'`. How do you investigate and prevent it?',
      answer: 'The subpackage is missing from the built wheel — usually package discovery/configuration (e.g. a missing __init__.py, an exclude pattern, an unusual layout). Tests passed because they imported the source folder. Inspect the wheel contents, fix the build configuration, and prevent recurrence with the src layout and a CI step that installs the built wheel in a fresh venv and runs tests or a smoke test against it.',
      explanation: py`\`python -m zipfile -l dist/*.whl\` shows exactly what users get. With a flat layout, running tests from the root imports \`./expense_tracker\` directly, hiding packaging gaps; the src layout forces tests to go through the installed package. See [project structure](lesson:project-structure).`,
      code: { lang: 'bash', code: py`python -m build
python -m zipfile -l dist/expense_tracker-0.3.1-py3-none-any.whl | grep reports
python -m venv /tmp/smoke && /tmp/smoke/bin/python -m pip install dist/*.whl
/tmp/smoke/bin/python -c "import expense_tracker.reports"` },
      whyAsked: 'A classic packaging failure that only appears after release; strong candidates know both the cause and the CI safeguard.',
      mistakes: ['Telling users to add the folder to PYTHONPATH', 'Only re-running tests from the source checkout'],
      followUps: ['Why does the src layout help?', 'How do you include non-Python data files?'],
      modelAnswer: 'My first step is to look inside the built wheel with python -m zipfile -l; I expect expense_tracker/reports to be missing. That usually means package discovery did not pick it up — a missing __init__.py, an exclude rule, or an unusual layout — so I fix the backend configuration. The tests passed because they imported the source folder from the working directory, not the installed wheel. To prevent it, I use the src layout and add a CI job that builds the wheel, installs it into a fresh venv and runs the tests or at least imports every subpackage and calls the console script.',
    },
    {
      id: 'packaging-wheel-filename',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `parse_wheel_filename(filename)` returning a dict with keys `name`, `version`, `build`, `python`, `abi`, `platform`. Format: `{name}-{version}(-{build})?-{python}-{abi}-{platform}.whl` — the build tag is optional (`None` when absent). Raise `ValueError` if the name doesn\'t end in `.whl` or doesn\'t have 5 or 6 dash-separated parts.',
      answer: 'Strip ".whl", split on "-", accept 5 parts (no build tag) or 6 parts (with build tag), and map the parts to keys; anything else raises ValueError.',
      explanation: py`Dashes are separators because wheel file names escape any dashes inside the project name as underscores (\`expense-tracker\` → \`expense_tracker\`). Platform tags can contain dots for multiple compatible platforms (\`manylinux_2_17_x86_64.manylinux2014_x86_64\`) — they're still one dash-separated part. Real tools use \`packaging.utils.parse_wheel_filename\`.`,
      starter: { files: { 'main.py': WHEEL_START } },
      tests: [
        { name: 'pure-Python wheel', code: py`assert parse_wheel_filename("expense_tracker-0.3.1-py3-none-any.whl") == {"name": "expense_tracker", "version": "0.3.1", "build": None, "python": "py3", "abi": "none", "platform": "any"}` },
        { name: 'compiled wheel with a compressed platform tag', code: py`info = parse_wheel_filename("numpy-2.1.3-cp313-cp313-manylinux_2_17_x86_64.manylinux2014_x86_64.whl")
assert info["python"] == "cp313" and info["abi"] == "cp313"
assert info["platform"] == "manylinux_2_17_x86_64.manylinux2014_x86_64"` },
        { name: 'optional build tag', code: py`assert parse_wheel_filename("tool-1.0-1-py3-none-any.whl")["build"] == "1"` },
        { name: 'rejects non-wheels and malformed names', code: py`for bad in ["expense_tracker-0.3.1.tar.gz", "just-a-name.whl", "a-b-c-d-e-f-g.whl"]:
    with raises(ValueError):
        parse_wheel_filename(bad)` },
      ],
      solution: { files: { 'main.py': py`def parse_wheel_filename(filename):
    """Split a wheel file name into its parts (see the question)."""
    if not filename.endswith(".whl"):
        raise ValueError(f"not a wheel: {filename!r}")
    parts = filename[: -len(".whl")].split("-")
    if len(parts) == 5:
        name, version, python, abi, platform = parts
        build = None
    elif len(parts) == 6:
        name, version, build, python, abi, platform = parts
    else:
        raise ValueError(f"malformed wheel name: {filename!r}")
    return {"name": name, "version": version, "build": build,
            "python": python, "abi": abi, "platform": platform}


print(parse_wheel_filename("expense_tracker-0.3.1-py3-none-any.whl"))
` } },
      hints: ['filename[:-4] removes ".whl"; split("-") gives the parts.', 'Unpack differently for 5 parts (no build tag) and 6 parts (with one).'],
      whyAsked: 'Tests careful string handling plus real knowledge of how pip decides which file fits a platform.',
      mistakes: ['Splitting on "." and breaking the version or platform', 'Forgetting the optional build tag', 'Not validating the extension'],
      followUps: ['Why can\'t the project name contain a dash in the file name?', 'How would pip use these tags to pick a wheel?'],
      modelAnswer: 'I check the .whl suffix, strip it and split on dashes, which is safe because wheel names escape dashes inside the project name as underscores. Five parts means name, version, python tag, ABI tag and platform tag; six parts means there is an optional build tag after the version. Anything else is malformed, so I raise ValueError. Dots inside the platform tag, like a compressed manylinux tag, stay in one part. pip compares those three tags against what the running interpreter supports to choose a compatible wheel; in production I would use packaging.utils.parse_wheel_filename.',
    },
    {
      id: 'packaging-frontend-backend',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What happens, step by step, when you run `pip install .` in a project with a pyproject.toml?',
      answer: 'pip (the frontend) reads [build-system], creates an isolated build environment and installs the requires list, imports the build-backend object and calls its PEP 517 hooks (get_requires_for_build_wheel, then build_wheel — or build_editable for -e). The backend produces a wheel from the [project] metadata; pip then resolves and installs the declared dependencies, unpacks the wheel into site-packages and generates console-script launchers.',
      explanation: py`Build isolation means the backend's own dependencies don't leak into (or depend on) your environment. \`--no-build-isolation\` turns it off — occasionally needed for heavy build dependencies, but it makes builds less reproducible.`,
      whyAsked: 'Distinguishes engineers who understand the modern packaging pipeline (useful when builds fail) from those who only run commands.',
      mistakes: ['Thinking pip executes setup.py install', 'Not knowing about build isolation', 'Confusing build dependencies with runtime dependencies'],
      followUps: ['What does --no-build-isolation change?', 'How does an editable install differ (PEP 660)?'],
      modelAnswer: 'pip acts as the build frontend. It reads the build-system table, creates a temporary isolated environment and installs the packages listed in requires, like hatchling. Then it imports the backend named by build-backend and calls the standard PEP 517 hooks — first asking for any extra build requirements, then build_wheel, or build_editable for an editable install. The backend reads the project metadata and returns a wheel. Finally pip resolves and installs the runtime dependencies, unpacks the wheel into site-packages, writes the dist-info metadata and generates launchers for the console scripts. Build-time and runtime dependencies are separate lists, which is why build isolation matters.',
    },
    {
      id: 'packaging-release-process',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design a release process for an open-source library published to PyPI.',
      answer: 'Semantic versioning with a changelog; version derived from a git tag (or bumped by a tool) as a single source of truth; on a tag, CI builds the sdist and wheel once, runs twine check, installs the built wheel in clean venvs across supported Python versions and runs the tests; then publishes with trusted publishing (no stored tokens), optionally via TestPyPI first. Broken releases are yanked and followed by a patch release, never overwritten.',
      explanation: py`The key ideas: build once and test the exact artifact you ship; keep credentials out of the repo; make releases reproducible and boring. Branch protection and required reviews on the release workflow limit who can publish.`,
      whyAsked: 'Senior engineers own release pipelines; this probes reproducibility, security and versioning discipline.',
      mistakes: ['Building on a laptop and uploading by hand with a personal token', 'Rebuilding separately for testing and publishing', 'Trying to fix a release by re-uploading the same version'],
      followUps: ['What is trusted publishing and why is it safer than an API token?', 'How do you handle a security fix for an old major version?'],
      modelAnswer: 'I would follow semantic versioning and keep a changelog, with the version coming from a git tag so there is one source of truth. Pushing a tag triggers CI, which builds the sdist and wheel exactly once, runs twine check, installs that built wheel into clean environments for each supported Python and runs the test suite against it. If everything passes, the same artifacts are published using PyPI trusted publishing, so there is no long-lived token to leak; for risky changes I would rehearse on TestPyPI. Releases are immutable, so if one is broken I yank it and ship a patch release rather than trying to overwrite it.',
    },
  ],

  takeaways: [
    'pyproject.toml is the standard project file: [build-system] (how to build), [project] (metadata), [tool.*] (tool settings).',
    'A build frontend (pip, build, uv) runs a build backend (setuptools, hatchling, flit-core…) through the PEP 517 interface.',
    'python -m build makes an sdist (.tar.gz, needs building) and a wheel (.whl, just unpacked); publish both.',
    '[project.scripts] creates commands on install: name = "package.module:function".',
    'Versions follow PEP 440 / semantic versioning and are immutable on PyPI — bump, never overwrite; yank broken releases.',
    'Publish with twine or uv publish, rehearse on TestPyPI, and prefer trusted publishing over stored tokens.',
    'tomllib (3.11+) reads TOML from binary files; it cannot write.',
  ],
}
