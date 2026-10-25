// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SPECIFIERS = py`"""A SIMPLIFIED version-specifier checker: a small subset of PEP 440.

Understands plain release numbers (2.31.0) and the operators
==, !=, <, <=, >, >=, ~= plus ==X.Y.* / !=X.Y.* wildcards.
Real versions can also carry pre-releases (2.0rc1), post- and dev-releases,
epochs and local labels. Real code should use the third-party 'packaging'
library (packaging.specifiers.SpecifierSet), which is what pip itself uses.
"""
OPERATORS = ("~=", "==", "!=", "<=", ">=", "<", ">")   # two-char operators first


def parse_version(text):
    """'2.31.0' -> (2, 31, 0)"""
    return tuple(int(part) for part in text.split("."))


def _same_length(a, b):
    """Pad with zeros so (2, 1) and (2, 1, 0) compare as equal."""
    width = max(len(a), len(b))
    return a + (0,) * (width - len(a)), b + (0,) * (width - len(b))


def matches(version, clause):
    """Does version (a string) satisfy one clause such as '>=2.0' or '~=1.4.2'?"""
    for op in OPERATORS:
        if clause.startswith(op):
            target = clause[len(op):].strip()
            break
    else:
        raise ValueError(f"no operator in {clause!r}")

    v = parse_version(version)
    if op in ("==", "!=") and target.endswith(".*"):          # prefix match: ==2.*
        prefix = parse_version(target[:-2])
        same = v[:len(prefix)] == prefix
        return same if op == "==" else not same
    t = parse_version(target)
    if op == "~=":                                              # compatible release
        if len(t) < 2:
            raise ValueError("~= needs at least two parts, e.g. ~=2.1")
        a, b = _same_length(v, t)
        return a >= b and v[:len(t) - 1] == t[:-1]
    a, b = _same_length(v, t)
    return {"==": a == b, "!=": a != b, "<": a < b,
            "<=": a <= b, ">": a > b, ">=": a >= b}[op]


def satisfies(version, specifier):
    """Every comma-separated clause must match: '>=2.0,<3'. Empty means 'any'."""
    clauses = [c.strip() for c in specifier.split(",") if c.strip()]
    return all(matches(version, clause) for clause in clauses)
`

const REQUIREMENTS = py`# Direct dependencies of our app (one per line)
requests>=2.31,<3
flask~=3.0
rich==13.*
urllib3<2        # an older library we use still needs urllib3 1.x
`

const MAIN = py`"""Choose a version for every requirement (a simplified first step of pip's resolver)."""
from pathlib import Path

from specifiers import parse_version, satisfies

# A pretend package index: the versions each project has published (illustrative).
INDEX = {
    "flask": ["2.3.3", "3.0.3", "3.1.0"],
    "requests": ["2.28.2", "2.31.0", "2.32.3"],
    "rich": ["12.6.0", "13.7.1", "13.9.4"],
    "urllib3": ["1.26.20", "2.2.3"],
}


def parse_requirement(line):
    """'requests>=2.31,<3' -> ('requests', '>=2.31,<3'); the specifier may be empty."""
    line = line.split("#", 1)[0].strip()                 # drop comments
    for i, char in enumerate(line):
        if char in "<>=!~":
            return line[:i].strip().lower(), line[i:].replace(" ", "")
    return line.lower(), ""


# Collect every specifier per package (the same package may be listed twice).
wanted = {}
for line in Path("requirements.txt").read_text().splitlines():
    name, specifier = parse_requirement(line)
    if name:
        wanted.setdefault(name, []).append(specifier)

pinned = []
for name, specifiers in wanted.items():
    combined = ",".join(s for s in specifiers if s)
    candidates = [v for v in INDEX[name] if satisfies(v, combined)]
    if not candidates:
        print(f"CONFLICT: no {name} version satisfies {combined}")
        continue
    best = max(candidates, key=parse_version)            # newest that fits
    print(f"{name:<9} {combined:<12} -> {best}")
    pinned.append(f"{name}=={best}")

print("--- pinned (what a lock file records) ---")
print("\n".join(sorted(pinned)))
`

const PARSE_REQS_START = py`import re

TEXT = """# app dependencies
Flask >= 3.0
requests[socks]>=2.31,<3   # HTTP client, with SOCKS proxy support
typing_extensions ; python_version < "3.11"
-r dev-requirements.txt
zope.interface==7.*
"""


def normalise(name):
    """PEP 503 name normalisation: lower-case, runs of - _ . become one -."""
    return name   # TODO


def parse_requirements(text):
    """[(normalised_name, specifier), ...] from requirements.txt text."""
    return []   # TODO


for requirement in parse_requirements(TEXT):
    print(requirement)
`

const OUTDATED_START = py`INSTALLED = {"django": "4.2.9", "idna": "3.9", "rich": "13.9.4", "certifi": "2024.8.30"}
LATEST = {"django": "5.1.3", "idna": "3.10", "rich": "13.9.4", "certifi": "2024.12.14"}


def version_key(text):
    """'3.10' -> (3, 10) so versions compare as numbers."""
    return tuple(int(part) for part in text.split("."))


def freeze_lines(installed):
    """['name==version', ...] sorted by name, like pip freeze."""
    return []   # TODO


def outdated(installed, latest):
    """['name: current -> newest', ...] sorted by name, like pip list --outdated."""
    return []   # TODO


print("\n".join(freeze_lines(INSTALLED)))
print("--- outdated ---")
print("\n".join(outdated(INSTALLED, LATEST)))
`

const GRAPH_START = py`GRAPH = {
    "app": ["requests", "rich"],
    "requests": ["certifi", "charset-normalizer", "idna", "urllib3"],
    "rich": ["markdown-it-py", "pygments"],
    "markdown-it-py": ["mdurl"],
}


def install_set(graph, requested):
    """Every package pip would install for the requested ones, sorted."""
    return sorted(requested)   # TODO: include transitive dependencies


print(install_set(GRAPH, ["rich"]))
`

export default {
  id: 'pip-and-dependencies',
  title: 'pip, requirements & dependency management',
  summary: 'Install packages with pip, describe acceptable versions with PEP 440 specifiers, and pin exact versions in lock files so every install is reproducible.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['virtual-environments'],
  related: ['packaging', 'project-structure', 'secure-practices', 'code-quality-tools', 'modules-and-imports'],
  tags: ['pip', 'PyPI', 'install', 'uninstall', 'freeze', 'pip list', 'pip show', 'requirements.txt', 'version specifiers', 'PEP 440', 'compatible release', 'pinning', 'lock file', 'transitive dependencies', 'dependency conflicts', 'resolver', 'pipx', 'uv', 'poetry', 'pip-tools', 'hashes'],
  apis: [
    { name: 'python -m pip install <pkg>', summary: 'Install a package (and its dependencies) into the current interpreter\'s environment.' },
    { name: 'python -m pip install -r requirements.txt', summary: 'Install everything listed in a requirements file.' },
    { name: 'python -m pip uninstall <pkg>', summary: 'Remove a package (not its dependencies).' },
    { name: 'python -m pip list [--outdated]', summary: 'List installed packages, optionally only those with newer releases.' },
    { name: 'python -m pip show <pkg>', summary: 'Details of one package: version, location, Requires and Required-by.' },
    { name: 'python -m pip freeze', summary: 'Print every installed package as name==version (requirements format).' },
    { name: 'python -m pip check', summary: 'Verify that installed packages have compatible dependencies.' },
    { name: 'pipx install <tool>', summary: 'Install a command-line tool into its own isolated environment.' },
    { name: 'importlib.metadata.version(name)', summary: 'Read an installed distribution\'s version from Python code.' },
  ],
  docs: [
    { label: 'pip documentation — User guide', url: 'https://pip.pypa.io/en/stable/user_guide/' },
    { label: 'pip — Requirements file format', url: 'https://pip.pypa.io/en/stable/reference/requirements-file-format/' },
    { label: 'Version specifiers (PEP 440) — PyPA specification', url: 'https://packaging.python.org/en/latest/specifications/version-specifiers/' },
    { label: 'pip — Dependency resolution', url: 'https://pip.pypa.io/en/stable/topics/dependency-resolution/' },
    { label: 'Packaging guide — Installing packages', url: 'https://packaging.python.org/en/latest/tutorials/installing-packages/' },
    { label: 'pipx', url: 'https://pipx.pypa.io/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`\`pip\` is Python's standard **package installer**. It downloads packages — mostly from **PyPI**, the Python Package Index at pypi.org — and installs them into the site-packages of the Python that runs it. Inside an activated [virtual environment](lesson:virtual-environments), that means your project's private \`.venv\`.`,
    { code: py`python -m pip install requests                # newest version that fits
python -m pip install "requests>=2.31,<3"     # any version in a range
python -m pip install -r requirements.txt     # everything in a list`, lang: 'bash' },
    py`A **dependency** is a package your code needs. Packages have dependencies of their own: install \`requests\` and pip also installs \`urllib3\`, \`idna\`, \`certifi\` and \`charset-normalizer\`. Those are **transitive** dependencies — you never asked for them, but your app breaks without them.`,
    py`This lesson covers the everyday pip commands, how to describe *which versions* you accept (**version specifiers**, PEP 440), and how teams make installs **reproducible** with pinned versions and lock files.`,
  ],
  why: [
    py`**Don't reinvent the wheel.** PyPI hosts hundreds of thousands of projects: HTTP clients, web frameworks, data tools. pip is how you get them.`,
    py`**Versions change behaviour.** A package's next major release may remove functions your code calls. Saying which versions you accept protects you from surprise upgrades.`,
    py`**"Works on my machine" is not enough.** Without pinning, installing today and installing next month can produce different versions of your transitive dependencies — and different bugs. A lock file makes every install identical: laptop, CI, production.`,
    py`**Supply-chain safety.** Every dependency is code you run with your permissions. Knowing what you install, pinning it and checking it for known vulnerabilities is part of [secure practice](lesson:secure-practices).`,
  ],
  eli15: [
    py`Think of a recipe. Your project is the cake; the **dependencies** are the ingredients on the list: flour, eggs, a jar of caramel sauce.`,
    py`But the caramel sauce has its *own* ingredient list — sugar, cream, butter. You didn't write those down, but you need them anyway. Those are **transitive** dependencies.`,
    py`"Some flour" is a loose requirement — fine most days, but one day the shop only has a different kind and the cake comes out wrong. "Brand X plain flour, 1 kg" is a **pinned** version. And keeping the **receipt** from the last successful bake, listing exactly what you bought, lets you buy precisely the same things next time. That receipt is a **lock file**.`,
  ],
  analogy: {
    title: 'A recipe, a shopping list and a receipt',
    body: [
      py`The **recipe** says what the dish needs and how flexible you can be: "flour (any plain flour)", "caramel sauce, version 2 or newer". The **shop** has many brands and batches. The **shopper** has to find one combination that satisfies *every* line — including the ingredients hidden inside the sauce.`,
      py`The **receipt** records exactly which brand and batch was bought, so the next bake can repeat it. If two recipes in one meal insist on incompatible brands of the same ingredient, there's no valid shopping trip at all.`,
    ],
    mapping: [
      ['the recipe\'s ingredient list', 'your direct dependencies (pyproject.toml / requirements.in)'],
      ['"version 2 or newer, but not 3"', 'a version specifier: >=2,<3'],
      ['ingredients inside the caramel sauce', 'transitive dependencies'],
      ['the shop', 'PyPI, the package index'],
      ['the shopper finding a combination that fits', 'pip\'s dependency resolver'],
      ['the receipt', 'a lock file / fully pinned requirements.txt'],
      ['two recipes demanding incompatible brands', 'a dependency conflict (ResolutionImpossible)'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Direct deps, transitive deps and the resolver',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'your app', note: 'requirements', x: 90, y: 160, tone: 'yellow' },
        { id: 'requests', label: 'requests', note: 'direct', x: 300, y: 60, tone: 'blue' },
        { id: 'legacy', label: 'legacy-sdk', note: 'direct (made-up)', x: 300, y: 260, tone: 'blue' },
        { id: 'urllib3', label: 'urllib3', note: 'transitive', x: 540, y: 160, tone: 'kraft' },
        { id: 'certifi', label: 'certifi, idna, …', note: 'transitive', x: 540, y: 50 },
        { id: 'lock', label: 'lock file', note: 'urllib3==1.26.20 …', x: 680, y: 270, tone: 'ink' },
      ],
      edges: [
        { from: 'app', to: 'requests', label: '>=2.31,<3' },
        { from: 'app', to: 'legacy', label: '==1.4' },
        { from: 'requests', to: 'urllib3', label: '>=1.21.1,<3' },
        { from: 'requests', to: 'certifi', label: 'needs' },
        { from: 'legacy', to: 'urllib3', label: '<2' },
        { from: 'urllib3', to: 'lock', label: 'pinned', dashed: true },
      ],
      steps: [
        { focus: ['app', 'requests', 'legacy'], edges: ['app->requests', 'app->legacy'], text: py`Your project lists its **direct** dependencies, each with a version specifier: any \`requests\` from 2.31 up to (not including) 3, and exactly \`legacy-sdk\` 1.4 (a made-up package).` },
        { focus: ['requests', 'certifi', 'urllib3'], edges: ['requests->urllib3', 'requests->certifi'], text: py`Each package declares its own dependencies in its metadata. \`requests\` needs \`urllib3\`, \`certifi\`, \`idna\` and \`charset-normalizer\` — the **transitive** dependencies.` },
        { focus: ['urllib3', 'legacy', 'requests'], edges: ['requests->urllib3', 'legacy->urllib3'], text: py`Two packages constrain \`urllib3\`: \`>=1.21.1,<3\` and \`<2\`. pip's **resolver** looks for one version that satisfies *every* constraint at once — here the newest 1.26.x. If no version fits (say another package demanded \`>=2\`), pip stops with **ResolutionImpossible**.` },
        { focus: ['lock'], edges: ['urllib3->lock'], text: py`Writing down the exact version of **every** package — direct and transitive — gives a **lock file**. Installing from it repeats the same solution everywhere, without re-resolving.` },
      ],
    },
    alt: 'Dependency graph: your app depends directly on requests (>=2.31,<3) and a made-up legacy-sdk (==1.4). requests depends on urllib3 (>=1.21.1,<3) and certifi, idna and others; legacy-sdk depends on urllib3 (<2). The resolver picks a urllib3 version satisfying both, and a lock file records it.',
    caption: py`Most of what gets installed is transitive. Run \`python -m pip show requests\` to see its \`Requires:\` line.`,
  },
  syntax: [
    py`#### Everyday commands`,
    { code: py`python -m pip install rich                 # install (newest compatible version)
python -m pip install "rich==13.9.4"       # an exact version (quote specifiers in the shell!)
python -m pip install --upgrade rich       # upgrade to the newest allowed version
python -m pip uninstall rich               # remove it (its dependencies stay)
python -m pip list                         # what's installed
python -m pip list --outdated              # what has newer releases
python -m pip show rich                    # version, location, Requires, Required-by
python -m pip freeze                       # name==version for everything installed
python -m pip check                        # are installed dependencies consistent?
python -m pip install -r requirements.txt  # install from a file
python -m pip install -e .                 # install your own project in editable mode`, lang: 'bash' },
    { callout: 'tip', title: 'Why python -m pip?', text: py`Plain \`pip\` is whichever \`pip\` comes first on your \`PATH\` — maybe for a different Python. \`python -m pip\` runs pip *as a module of the exact interpreter you named*, so packages land where that Python will import them from. On Windows, \`py -m pip\` does the same.` },
    py`#### Version specifiers (PEP 440)`,
    py`| specifier | means | example matches |
|---|---|---|
| \`==2.31.0\` | exactly this version | 2.31.0 |
| \`==2.31.*\` | any version starting 2.31 | 2.31.0, 2.31.5 |
| \`!=2.32.0\` | anything except this | skip a known-bad release |
| \`>=2.31\` | this or newer | 2.31.0, 3.0.0, 9.9 |
| \`<3\` | older than 3 | 2.99, 1.0 |
| \`>=2.31,<3\` | **all** clauses (comma = and) | 2.31.0 … 2.x |
| \`~=2.31\` | *compatible release*: \`>=2.31, ==2.*\` | 2.31.0, 2.40.1 — not 3.0 |
| \`~=2.31.0\` | *compatible release*: \`>=2.31.0, ==2.31.*\` | 2.31.0, 2.31.7 — not 2.32 |`,
    py`Versions are compared **numerically, part by part**: \`2.10\` is newer than \`2.9\`. Pre-releases (\`3.0.0rc1\`, \`3.0.0b2\`) are skipped unless you ask for them (\`--pre\`) or a specifier names one.`,
    py`#### requirements.txt`,
    { code: py`# Comments start with #
requests>=2.31,<3              # a range
rich==13.9.4                   # an exact pin
httpx[http2]>=0.27             # with an "extra" (optional feature set)
tomli>=2.0; python_version < "3.11"   # an environment marker
-r base.txt                    # include another requirements file
-c constraints.txt             # cap versions without installing anything`, lang: 'text', title: 'requirements.txt' },
    py`A requirements file is just a list of things to pass to \`pip install\`, one per line. It's not a standard project format — libraries declare dependencies in [pyproject.toml](lesson:packaging) — but it's still the most common way to list an application's installs.`,
    py`#### Ranges for libraries, pins for applications`,
    py`- A **library** (installed into other people's projects) declares *compatible ranges* in \`pyproject.toml\` — \`requests>=2.31,<3\` — so it can share an environment with other libraries. Pinning \`==\` there causes conflicts for your users.
- An **application** (something you deploy) should install *exact* versions of **everything**, transitive dependencies included, from a **lock file** — so production runs what you tested.`,
    py`#### Lock files`,
    { code: py`# simplest: snapshot a clean venv (includes transitive deps)
python -m pip freeze > requirements.txt

# pip-tools: you edit requirements.in (direct deps, ranges);
# pip-compile writes requirements.txt with every version pinned (+ hashes)
pip-compile --generate-hashes requirements.in
python -m pip install --require-hashes -r requirements.txt

# uv / Poetry / PDM keep their own lock files (uv.lock, poetry.lock, pdm.lock)
uv lock && uv sync`, lang: 'bash', title: 'three ways to lock' },
    py`A *hash* in a lock file is a fingerprint of the exact file that was tested; with \`--require-hashes\`, pip refuses any download that doesn't match — protection against tampered or substituted packages. There is also a standard, tool-independent lock format, \`pylock.toml\` (PEP 751, accepted in 2025), that installers are starting to adopt.`,
    py`#### Tools, not libraries: pipx`,
    { code: py`pipx install ruff          # each tool gets its own hidden venv
pipx install httpie
pipx run cowsay "hello"    # run a tool once without installing it
pipx upgrade-all`, lang: 'bash' },
    py`Command-line applications you use across projects (formatters, linters, HTTP clients) shouldn't live in any one project's venv — and must not go into the system Python. \`pipx\` installs each into an isolated venv and puts its command on your \`PATH\`. (\`uv tool install\` does the same.)`,
    py`#### Modern project managers (briefly)`,
    py`- **uv** — a fast pip/pip-tools/venv replacement (written in Rust): \`uv add requests\` updates \`pyproject.toml\` and \`uv.lock\`; \`uv sync\` makes the venv match the lock file exactly.
- **Poetry** — manages dependencies in \`pyproject.toml\`, a \`poetry.lock\` file, venvs, building and publishing.
- **pip-tools** — small and focused: \`pip-compile\` produces pinned requirements, \`pip-sync\` installs exactly them.

They differ in workflow, not in principle: *declare ranges, lock exact versions, install from the lock*. Plain pip plus a lock file is still a perfectly professional setup.`,
  ],
  walkthrough: {
    title: 'Reading the simplified resolver',
    lang: 'python',
    code: MAIN,
    intro: py`The playground's \`main.py\` reads \`requirements.txt\`, and for each package picks the newest version from a pretend index that satisfies **all** its specifiers. The version logic lives in \`specifiers.py\` (a deliberately simplified subset of PEP 440). Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [7, 12], text: py`A stand-in for PyPI: the versions each project has published. pip asks the real index the same question — "which versions exist?" — and reads each version's metadata to learn its dependencies.` },
      { lines: [15, 21], text: py`Each line becomes a \`(name, specifier)\` pair: comments are dropped and everything from the first operator character on is the specifier.` },
      { lines: [25, 28], text: py`If a package is listed twice (or required by two packages), **all** its specifiers apply. That's why conflicts happen: \`<2\` and \`>=2\` can't both be true.` },
      { lines: [32, 36], text: py`Joining with commas means "and". If no published version satisfies every clause, there is no solution — the simplified equivalent of pip's \`ResolutionImpossible\`.` },
      { lines: [37, 39], text: py`Among the versions that fit, pick the newest (compared as tuples of numbers, not strings), and record an exact \`name==version\` pin.` },
      { lines: [41, 42], text: py`The pins are a mini lock file. Installing from \`==\` pins skips resolution and reproduces this exact set — the point of locking.` },
    ],
  },
  playground: {
    title: 'A (simplified) version resolver',
    objective: 'Run it to see which versions get chosen, then edit requirements.txt: create a conflict, tighten a compatible-release pin, exclude a bad release and add a package.',
    files: { 'main.py': MAIN, 'specifiers.py': SPECIFIERS, 'requirements.txt': REQUIREMENTS },
    expected: py`\`\`\`text
requests  >=2.31,<3    -> 2.32.3
flask     ~=3.0        -> 3.1.0
rich      ==13.*       -> 13.9.4
urllib3   <2           -> 1.26.20
--- pinned (what a lock file records) ---
flask==3.1.0
requests==2.32.3
rich==13.9.4
urllib3==1.26.20
\`\`\`

\`~=3.0\` allowed 3.1.0 (same major version), and \`<2\` forced the old urllib3 line. **Simplified:** real PEP 440 versions also have pre-/post-/dev-releases and epochs, and pip's real resolver also follows each package's own dependencies and backtracks. Real code uses the \`packaging\` library.`,
    experiments: [
      {
        id: 'conflict',
        task: py`Some new library needs \`urllib3>=2\`. Add the line \`urllib3>=2\` to **requirements.txt**. What happens?`,
        tests: [{ name: 'a conflict is reported for urllib3', code: py`assert 'CONFLICT: no urllib3 version satisfies <2,>=2' in output` }],
        explain: py`Two requirements on the same package that can't both be true have **no** solution. pip reports \`ResolutionImpossible\` and lists who asked for what. The fix is never to force it — upgrade the library that needs \`<2\`, find an alternative, or drop one requirement.`,
      },
      {
        id: 'tighter-compatible',
        task: py`Change flask's specifier to \`~=3.0.0\`. Which version is chosen now, and why?`,
        hint: py`\`~=3.0.0\` means \`>=3.0.0, ==3.0.*\`.`,
        tests: [{ name: 'flask pinned to 3.0.3', code: py`assert 'flask==3.0.3' in output` }],
        explain: py`With three parts, \`~=\` only allows changes in the **last** part: bug-fix releases of 3.0, but not 3.1. With two parts (\`~=3.0\`) it allows any 3.x from 3.0 up. Choose the precision that matches how much change you trust.`,
      },
      {
        id: 'exclude-bad-release',
        task: py`Pretend requests 2.32.3 has a bug that breaks your app. Exclude just that release with \`!=\`, keeping the rest of the range.`,
        hint: py`\`requests>=2.31,<3,!=2.32.3\``,
        tests: [{ name: 'requests pinned to 2.31.0', code: py`assert 'requests==2.31.0' in output` }],
        explain: py`\`!=\` lets you skip a known-bad version without freezing everything else. Add a comment explaining why, and remove the exclusion once a fixed release exists.`,
      },
      {
        id: 'add-package',
        task: py`Add \`"click": ["8.1.7", "8.1.8"]\` to \`INDEX\` in **main.py** and the requirement \`click>=8.1\` to **requirements.txt**.`,
        tests: [{ name: 'click is pinned', code: py`assert 'click==8.1.8' in output` }],
        explain: py`pip does the same lookups against the real index: list published versions, filter by every specifier, prefer the newest. Then it repeats for each chosen version's own dependencies — the part this simplified version leaves out.`,
      },
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When you run \`python -m pip install rich\`, pip: (1) asks the index which versions of \`rich\` exist; (2) picks the newest one compatible with your Python and your other requirements; (3) downloads it — ideally as a ready-to-install **wheel** file (see [packaging](lesson:packaging)); (4) does the same for its dependencies; (5) unpacks everything into site-packages.`,
      py`For every installed package, pip leaves a small \`name-version.dist-info\` folder with its metadata (version, dependencies, and a \`RECORD\` list of installed files used by \`pip uninstall\`). Python code can read it:`,
      { code: py`from importlib.metadata import PackageNotFoundError, version

try:
    print("requests", version("requests"))
except PackageNotFoundError:
    print("requests is not installed in this environment")`, lang: 'python', title: 'reading installed versions' },
    ],
    technical: [
      py`**The resolver.** Since pip 20.3, pip uses a *backtracking* resolver: it considers all requirements together, tries the newest candidates, and when a choice leads to a contradiction it backs up and tries an older version. It either finds a set where every specifier is satisfied or reports \`ResolutionImpossible\` with the conflicting requirements. Very loose requirements can make it explore many versions, which is slow — another reason to give sensible lower bounds.`,
      py`**Names are normalised** (PEP 503): case is ignored and runs of \`-\`, \`_\` and \`.\` are equivalent, so \`Typing_Extensions\` and \`typing-extensions\` are the same project. The *import* name can differ from the *distribution* name: \`pip install beautifulsoup4\` → \`import bs4\`; \`pip install pyyaml\` → \`import yaml\`.`,
      py`**Environment markers** (\`; python_version < "3.11"\`, \`; sys_platform == "win32"\`) make a requirement conditional. **Extras** (\`httpx[http2]\`) pull in optional dependency groups a package declares.`,
      py`\`pip install --upgrade X\` upgrades X and, by default (the *only-if-needed* strategy), only those dependencies that no longer satisfy X's requirements. \`pip uninstall X\` removes only X — orphaned dependencies stay, which is one reason to rebuild venvs from a lock file rather than editing them by hand.`,
      py`\`pip freeze\` lists **everything** installed in the environment, including transitive dependencies and anything you installed by hand to experiment. Run it in a fresh venv built only from your direct requirements, or use a tool that computes the lock from your declared dependencies.`,
    ],
    production: [
      py`**Declare, lock, sync.** Keep direct dependencies (with ranges) in \`pyproject.toml\`; generate a lock with exact versions and hashes; install production and CI from the lock only. Review lock-file diffs in pull requests like code.`,
      py`**Update deliberately and often.** Small, frequent upgrades are far easier than a two-year jump. Bots such as Dependabot or Renovate open pull requests for new versions; your test suite decides whether they merge.`,
      py`**Audit for vulnerabilities.** \`pip-audit\` (from PyPA) checks installed or locked packages against public vulnerability databases. Run it in CI.`,
      py`**Beware typos and look-alikes.** Attackers publish malicious packages with names close to popular ones (*typosquatting*: \`reqeusts\`). Copy names from official docs, pin with hashes, and if you use a private index, configure it so public packages can't shadow your internal names (*dependency confusion*). See [secure practices](lesson:secure-practices).`,
      py`**Separate dev tools from runtime dependencies.** Test runners, linters and type checkers are needed in development and CI, not in production images. Common approaches: an extra (\`[project.optional-dependencies] dev = [...]\`, installed with \`pip install -e ".[dev]"\`), the newer standard \`[dependency-groups]\` table (PEP 735) supported by recent tools, or a separate \`requirements-dev.txt\`.`,
    ],
  },
  mistakes: [
    {
      title: 'Leaving an application completely unpinned',
      wrong: { code: py`# requirements.txt for a deployed web app
flask
requests
sqlalchemy`, lang: 'text' },
      right: { code: py`# requirements.in (what we want)      ->  pip-compile  ->  requirements.txt (exact)
flask>=3.0,<4                               # flask==3.1.0
requests>=2.31,<3                           # requests==2.32.3
sqlalchemy>=2.0,<3                          # sqlalchemy==2.0.36 ... + every transitive dep`, lang: 'text' },
      explanation: py`Unpinned, every new install picks up whatever was released that morning — including breaking changes in transitive dependencies you've never heard of. Applications should install exact versions from a lock; ranges belong in the file you edit.`,
    },
    {
      title: 'Pinning exact versions in a library',
      wrong: { code: py`[project]
name = "my-http-helpers"
dependencies = ["requests==2.31.0", "urllib3==1.26.18"]`, lang: 'toml' },
      right: { code: py`[project]
name = "my-http-helpers"
dependencies = ["requests>=2.31,<3"]`, lang: 'toml' },
      explanation: py`A library shares one environment with everything else the user installs. Exact pins make it impossible to combine with any package needing a different version (\`ResolutionImpossible\`). Declare the range you actually support, and don't list transitive dependencies you don't import directly.`,
    },
    {
      title: 'Comparing versions as strings',
      wrong: { code: py`installed, required = "2.9.0", "2.10.0"
print(installed >= required)   # True — "9" > "1" character by character!`, lang: 'python' },
      right: { code: py`def version_key(text):
    return tuple(int(part) for part in text.split("."))


print(version_key("2.9.0") >= version_key("2.10.0"))   # False
# real code: from packaging.version import Version`, lang: 'python' },
      explanation: py`String comparison goes character by character, so \`"2.9" > "2.10"\`. Compare as tuples of numbers — or, for full PEP 440 versions with \`rc1\`/\`.post1\`, use \`packaging.version.Version\`.`,
    },
    {
      title: 'Freezing a messy environment',
      wrong: { code: py`$ python -m pip freeze > requirements.txt   # in a venv used for months of experiments
# now includes jupyter, pandas, black, a forgotten typo-package...`, lang: 'bash' },
      right: { code: py`$ rm -rf .venv && python -m venv .venv && source .venv/bin/activate
(.venv) $ python -m pip install -r requirements.in
(.venv) $ python -m pip freeze > requirements.txt   # or: pip-compile requirements.in`, lang: 'bash' },
      explanation: py`\`pip freeze\` records everything present, not what your project needs. Lock from a clean environment built only from your declared dependencies.`,
    },
    {
      title: 'Installing a typo',
      wrong: { code: py`$ python -m pip install reqeusts`, lang: 'bash' },
      right: { code: py`$ python -m pip install requests      # name copied from the project's docs`, lang: 'bash' },
      explanation: py`Typosquatted names have been used to publish malware on public indexes, and installing a package can run code during the build. Double-check names, prefer pinned lock files with hashes, and review new dependencies before adding them.`,
    },
  ],
  debugging: [
    {
      symptom: py`ERROR: Could not find a version that satisfies the requirement flask==9.0 (from versions: ...) ERROR: No matching distribution found for flask==9.0`,
      cause: py`That version doesn't exist, the name is wrong, or no release supports your Python version or platform (check its \`Requires-Python\`).`,
      fix: py`Check the versions listed in the message and on the project's PyPI page; loosen the specifier, or use a supported Python.`,
    },
    {
      symptom: py`ERROR: Cannot install A and B because these package versions have conflicting dependencies. ... ERROR: ResolutionImpossible`,
      cause: py`Your requirements (direct or transitive) put contradictory constraints on some package, e.g. \`urllib3<2\` and \`urllib3>=2\`.`,
      fix: py`Read which packages require what, then relax your own pins, upgrade the package with the outdated constraint, or replace it. Never force-install over a conflict.`,
    },
    {
      symptom: py`ERROR: Invalid requirement: 'requests=2.31.0'`,
      cause: py`\`=\` isn't a PEP 440 operator (recent pip versions add a hint: did you mean \`==\`?).`,
      fix: py`Use \`requests==2.31.0\` — and quote specifiers on the command line: \`pip install "requests>=2.31"\` (otherwise the shell treats \`>\` as output redirection and creates a file called \`=2.31\`).`,
    },
    {
      symptom: py`ERROR: pip's dependency resolver does not currently take into account all the packages that are installed. This behaviour is the source of the following dependency conflicts. foo 1.0 requires bar<2, but you have bar 2.1 which is incompatible.`,
      cause: py`An individual \`pip install\` upgraded a package that something already installed depends on.`,
      fix: py`Run \`python -m pip check\`, then fix the requirements as a whole: put everything in one requirements file / lock and install it together (or rebuild the venv).`,
    },
    {
      symptom: py`WARNING: The script flask is installed in '/home/ada/.local/bin' which is not on PATH.`,
      cause: py`A \`--user\` (or user-site) install outside a venv put command-line scripts in a folder your shell doesn't search.`,
      fix: py`Install inside an activated venv instead, or use \`pipx\` for tools (\`pipx ensurepath\` fixes \`PATH\` for pipx).`,
    },
  ],
  bestPractices: [
    'Always install inside a virtual environment, with python -m pip.',
    'Libraries: declare compatible ranges (>=lower,<next-major) in pyproject.toml; never exact pins.',
    'Applications: lock every package (direct and transitive) to exact versions, ideally with hashes, and install from the lock.',
    'Quote specifiers in the shell: pip install "requests>=2.31,<3".',
    'Give every dependency a sensible lower bound; use != to skip a known-bad release.',
    'Rebuild environments from the lock instead of patching them by hand; run pip check when in doubt.',
    'Update dependencies regularly through pull requests, and run pip-audit in CI.',
    'Install command-line tools with pipx (or uv tool), not into project venvs or the system Python.',
  ],
  useCases: [
    'Adding a third-party library (HTTP client, web framework) to a project.',
    'Recreating a teammate\'s exact environment from a lock file.',
    'Pinning around a buggy release while waiting for a fix.',
    'Auditing what a production image actually contains (pip freeze, pip-audit).',
  ],
  comparison: {
    title: 'Where dependency information lives',
    headers: ['', 'pyproject.toml dependencies', 'requirements.txt', 'lock file (uv.lock, poetry.lock, pylock.toml, compiled requirements)'],
    rows: [
      ['who writes it', 'you', 'you (or pip freeze / pip-compile)', 'a tool'],
      ['contains', 'direct dependencies + ranges', 'anything pip install accepts', 'every package, exact versions, often hashes'],
      ['used by', 'build tools and pip when installing your package', 'pip install -r', 'the tool\'s sync/install command'],
      ['typical for', 'libraries and applications', 'applications, scripts, Docker images', 'applications, CI, deployments'],
    ],
    note: py`A common modern setup: ranges in \`pyproject.toml\`, a generated lock file committed next to it, CI and production installing only from the lock.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'pip-and-dependencies-q1',
      type: 'mcq',
      prompt: py`Which versions does \`requests~=2.31\` allow?`,
      options: [
        { text: 'Only 2.31.x', why: 'That is ~=2.31.0 (three parts). With two parts, only the last part (the minor version) is free to grow.' },
        '2.31 or newer, but below 3',
        { text: 'Exactly 2.31.0', why: 'That would be ==2.31.0.' },
        { text: 'Any version at all, preferring 2.31', why: '~= is a real constraint: >=2.31 and ==2.*.' },
      ],
      answer: 1,
      explanation: py`\`~=2.31\` is the compatible-release operator: \`>=2.31, ==2.*\`. It assumes the project follows semantic versioning — new minor versions keep compatibility, a new major version may not.`,
    },
    {
      id: 'pip-and-dependencies-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`versions = ["2.9.0", "2.10.0", "2.31.0"]
print(max(versions), max(versions, key=lambda v: tuple(map(int, v.split(".")))))`,
      answer: '2.9.0 2.31.0',
      accept: ['2.9.0 2.31.0'],
      explanation: py`As strings, \`"2.9.0"\` is the largest because \`"9"\` > \`"3"\` > \`"1"\` character by character. Converted to tuples of ints, \`(2, 31, 0)\` is the largest. Never compare versions as plain strings.`,
    },
    {
      id: 'pip-and-dependencies-q3',
      type: 'bug',
      prompt: py`\`python -m pip install -r requirements.txt\` fails with \`ERROR: Invalid requirement\`. Click the faulty line.`,
      code: py`# web app dependencies
flask>=3.0,<4
requests=2.32.3
rich~=13.9`,
      answerLine: 3,
      explanation: py`A single \`=\` is not a valid operator. Exact pins use \`==\`: \`requests==2.32.3\`.`,
    },
    {
      id: 'pip-and-dependencies-q4',
      type: 'fill',
      prompt: 'Fill in the pip subcommands: the first installs everything in a file, the second writes the current environment\'s exact versions to a file.',
      code: py`python -m pip ___ -r requirements.txt
python -m pip ___ > requirements.lock.txt`,
      answer: [['install'], ['freeze']],
      explanation: py`\`pip install -r FILE\` installs every requirement in the file; \`pip freeze\` prints \`name==version\` for every installed package, which \`>\` redirects into a file.`,
    },
    {
      id: 'pip-and-dependencies-q5',
      type: 'mcq',
      prompt: py`You only ran \`python -m pip install requests\` in a fresh venv. Why does \`pip freeze\` list five packages?`,
      options: [
        { text: 'pip installs some popular packages by default', why: 'pip installs exactly what was requested plus what that requires — nothing else.' },
        'requests depends on other packages (urllib3, idna, certifi, charset-normalizer), which were installed as transitive dependencies',
        { text: 'freeze also lists the standard library', why: 'Standard-library modules are part of Python, not installed distributions; freeze never lists them.' },
        { text: 'The venv copied packages from the global site-packages', why: 'A default venv starts with an empty site-packages (apart from pip itself, which freeze hides).' },
      ],
      answer: 1,
      explanation: py`Transitive dependencies are installed automatically and are part of what your app needs to run — which is why a lock file must pin them too. \`pip show requests\` shows them on its \`Requires:\` line.`,
    },
    {
      id: 'pip-and-dependencies-q6',
      type: 'mcq',
      prompt: py`Which statements are good practice? **Select all that apply.**`,
      options: [
        'A published library declares ranges like requests>=2.31,<3',
        'A deployed application installs exact versions from a lock file',
        'Quote specifiers on the command line: pip install "rich>=13"',
        { text: 'Pin every library dependency with == so users get the tested version', why: 'Exact pins in a library make it impossible to install alongside other packages that need slightly different versions.' },
        { text: 'Use sudo pip install so tools are available everywhere', why: 'That writes into the OS-managed Python and can break system tools; use pipx for tools.' },
      ],
      answer: [0, 1, 2],
      explanation: py`Ranges keep libraries composable, locks make applications reproducible, and quoting stops the shell from treating \`>\` as redirection.`,
    },
    {
      id: 'pip-and-dependencies-q7',
      type: 'short',
      prompt: py`What is the difference between a *direct* and a *transitive* dependency, and why must a lock file include both?`,
      answer: py`A direct dependency is one your project asks for (and usually imports). A transitive dependency is one of your dependencies' dependencies, installed automatically. Your app can break when a transitive dependency changes just as much as when a direct one does, so to reproduce an environment exactly, the lock file must pin every package that ends up installed — direct and transitive.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'parse-requirements',
      title: 'Parse a real-world requirements file',
      difficulty: 'intermediate',
      prompt: py`Write two functions in **main.py**:

1. \`normalise(name)\` — PEP 503 normalisation: lower-case, and every run of \`-\`, \`_\` or \`.\` becomes a single \`-\`. \`"Typing_Extensions"\` → \`"typing-extensions"\`.
2. \`parse_requirements(text)\` → a list of \`(normalised_name, specifier)\` tuples, where:
   - blank lines, \`#\` comment lines and option lines starting with \`-\` (like \`-r dev.txt\`) are skipped;
   - an inline comment (whitespace followed by \`#\`) is removed;
   - an environment marker (\`;\` and everything after) is removed;
   - extras in square brackets are dropped: \`requests[socks]>=2.31\` → name \`requests\`;
   - the specifier has all spaces removed (it may be \`""\`).

For the sample text it returns \`[("flask", ">=3.0"), ("requests", ">=2.31,<3"), ("typing-extensions", ""), ("zope-interface", "==7.*")]\`.`,
      files: { 'main.py': PARSE_REQS_START },
      hints: [
        'normalise is one line with re.sub(r"[-_.]+", "-", name).lower().',
        'For each stripped line: skip if empty or it starts with "#" or "-". Then remove an inline comment with re.sub(r"\\s+#.*", "", line) and the marker with line.split(";", 1)[0].',
        'A regex like r"([A-Za-z0-9][A-Za-z0-9._-]*)\\s*(\\[[^\\]]*\\])?\\s*(.*)" captures name, optional extras and the rest (the specifier). Remove spaces from the specifier with .replace(" ", "").',
      ],
      solution: {
        explanation: py`Each rule is one small, ordered step: skip lines that aren't requirements, strip comments and markers, then split *name / extras / specifier* with one regular expression. Normalising names matters because pip treats \`Flask\`, \`flask\` and \`FLASK\` (and \`zope.interface\` / \`zope-interface\`) as the same project — tools that compare requirement lists must too. **Simplified:** real requirement lines can also be URLs, local paths and hashed entries; production code should use \`packaging.requirements.Requirement\`.`,
        files: { 'main.py': py`import re

TEXT = """# app dependencies
Flask >= 3.0
requests[socks]>=2.31,<3   # HTTP client, with SOCKS proxy support
typing_extensions ; python_version < "3.11"
-r dev-requirements.txt
zope.interface==7.*
"""

REQUIREMENT = re.compile(r"([A-Za-z0-9][A-Za-z0-9._-]*)\s*(\[[^\]]*\])?\s*(.*)")


def normalise(name):
    """PEP 503 name normalisation: lower-case, runs of - _ . become one -."""
    return re.sub(r"[-_.]+", "-", name).lower()


def parse_requirements(text):
    """[(normalised_name, specifier), ...] from requirements.txt text."""
    result = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith(("#", "-")):
            continue
        line = re.sub(r"\s+#.*", "", line)          # inline comment
        line = line.split(";", 1)[0].strip()        # environment marker
        name, _extras, specifier = REQUIREMENT.fullmatch(line).groups()
        result.append((normalise(name), specifier.replace(" ", "")))
    return result


for requirement in parse_requirements(TEXT):
    print(requirement)
` },
      },
      tests: [
        { name: 'normalise follows PEP 503', code: py`assert normalise("Typing_Extensions") == "typing-extensions"
assert normalise("zope.interface") == "zope-interface"
assert normalise("A__b--C") == "a-b-c"` },
        { name: 'parses the sample file', code: py`assert parse_requirements(TEXT) == [("flask", ">=3.0"), ("requests", ">=2.31,<3"), ("typing-extensions", ""), ("zope-interface", "==7.*")]` },
        { name: 'skips comments, blanks and options', code: py`assert parse_requirements("\n# hi\n--index-url https://example.org\n-c c.txt\n") == []` },
        { name: 'drops extras and markers', code: py`assert parse_requirements('httpx[http2,cli] ~= 0.27 ; sys_platform != "win32"') == [("httpx", "~=0.27")]` },
        { name: 'a bare name has an empty specifier', code: py`assert parse_requirements("rich") == [("rich", "")]` },
      ],
    },
    {
      id: 'freeze-and-outdated',
      title: 'Your own pip freeze and pip list --outdated',
      difficulty: 'intermediate',
      prompt: py`Given \`installed\` and \`latest\` dicts of \`{name: version}\`:

1. \`freeze_lines(installed)\` → \`["name==version", ...]\` sorted by name.
2. \`outdated(installed, latest)\` → \`["name: current -> newest", ...]\` sorted by name, only for packages whose latest version is **numerically** newer. Skip packages missing from \`latest\`. Use the provided \`version_key\` — remember \`"3.10"\` is newer than \`"3.9"\`.

For the sample data the program prints:

\`\`\`text
certifi==2024.8.30
django==4.2.9
idna==3.9
rich==13.9.4
--- outdated ---
certifi: 2024.8.30 -> 2024.12.14
django: 4.2.9 -> 5.1.3
idna: 3.9 -> 3.10
\`\`\``,
      files: { 'main.py': OUTDATED_START },
      hints: [
        'freeze_lines: a list comprehension over sorted(installed.items()).',
        'outdated: loop over sorted(installed); skip names not in latest; compare version_key(latest[name]) > version_key(current).',
        'return [f"{name}: {current} -> {latest[name]}" for name, current in sorted(installed.items()) if name in latest and version_key(latest[name]) > version_key(current)]',
      ],
      solution: {
        explanation: py`Sorting \`installed.items()\` sorts by name because tuples compare by their first element. The important part is the comparison: as strings, \`"3.10" > "3.9"\` is \`False\`, so \`idna\` would be wrongly reported as up to date; \`version_key\` turns versions into tuples of ints so \`(3, 10) > (3, 9)\`. Calendar-style versions like \`2024.12.14\` work the same way. Real pip compares full PEP 440 versions (with pre-releases, post-releases and epochs) using \`packaging.version.Version\`.`,
        files: { 'main.py': py`INSTALLED = {"django": "4.2.9", "idna": "3.9", "rich": "13.9.4", "certifi": "2024.8.30"}
LATEST = {"django": "5.1.3", "idna": "3.10", "rich": "13.9.4", "certifi": "2024.12.14"}


def version_key(text):
    """'3.10' -> (3, 10) so versions compare as numbers."""
    return tuple(int(part) for part in text.split("."))


def freeze_lines(installed):
    """['name==version', ...] sorted by name, like pip freeze."""
    return [f"{name}=={version}" for name, version in sorted(installed.items())]


def outdated(installed, latest):
    """['name: current -> newest', ...] sorted by name, like pip list --outdated."""
    return [
        f"{name}: {current} -> {latest[name]}"
        for name, current in sorted(installed.items())
        if name in latest and version_key(latest[name]) > version_key(current)
    ]


print("\n".join(freeze_lines(INSTALLED)))
print("--- outdated ---")
print("\n".join(outdated(INSTALLED, LATEST)))
` },
      },
      tests: [
        { name: 'freeze_lines is sorted name==version', code: py`assert freeze_lines({"rich": "13.9.4", "attrs": "24.2.0"}) == ["attrs==24.2.0", "rich==13.9.4"]` },
        { name: 'numeric comparison: 3.10 is newer than 3.9', code: py`assert outdated({"idna": "3.9"}, {"idna": "3.10"}) == ["idna: 3.9 -> 3.10"]` },
        { name: 'up-to-date and unknown packages are skipped', code: py`assert outdated({"rich": "13.9.4", "mine": "0.1"}, {"rich": "13.9.4"}) == []` },
        { name: 'never reports a downgrade', code: py`assert outdated({"django": "5.1.3"}, {"django": "4.2.9"}) == []` },
        { name: 'prints the expected report', code: py`assert output.strip().splitlines()[-3:] == ["certifi: 2024.8.30 -> 2024.12.14", "django: 4.2.9 -> 5.1.3", "idna: 3.9 -> 3.10"]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'pip-and-dependencies-direct-transitive',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between direct and transitive dependencies, and why should you care?',
      answer: 'Direct dependencies are the packages your project asks for; transitive ones are their dependencies, installed automatically. Most of what is installed is usually transitive, and changes there can break you just as easily — so reproducible environments must pin them too, and vulnerabilities in them affect you.',
      explanation: py`\`requests\` alone brings \`urllib3\`, \`idna\`, \`certifi\` and \`charset-normalizer\`. You don't list those in \`pyproject.toml\` (unless you import them yourself), but your lock file must pin them, and \`pip-audit\` must check them.`,
      whyAsked: 'Basic dependency hygiene; candidates who only think about direct dependencies get bitten by unpinned transitive changes.',
      mistakes: ['Listing transitive dependencies as direct requirements of a library', 'Assuming pinning direct dependencies pins everything'],
      followUps: ['How do you see why a package is installed? (pip show X → Required-by)', 'Should a library list its transitive dependencies?'],
      modelAnswer: 'A direct dependency is a package my project explicitly requires, like requests. A transitive dependency is something one of those needs — requests pulls in urllib3, idna, certifi and charset-normalizer. They matter because they are usually the majority of what gets installed, and an unpinned transitive upgrade can break the app or introduce a vulnerability just like a direct one. So I declare only direct dependencies, with ranges, in pyproject.toml, but my application\'s lock file pins every package, and security scans cover the whole tree.',
    },
    {
      id: 'pip-and-dependencies-pinning-strategy',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare ==, >= and ~= in requirements. How should a library pin its dependencies, versus an application?',
      answer: '== fixes one exact version; >= sets only a lower bound; ~= (compatible release) allows newer versions within the same series, e.g. ~=2.31 means >=2.31,==2.*. Libraries declare compatible ranges (lower bound, usually excluding the next major) so they can coexist with other packages; applications lock exact versions of everything for reproducible deployments.',
      explanation: py`The difference comes from who controls the environment. A library is one guest in someone else's environment, so it must be flexible. An application owns its environment and wants it identical everywhere. Upper bounds on libraries are debated — too strict causes conflicts, none risks breakage — a common compromise is \`<next-major\` for dependencies that follow semantic versioning.`,
      whyAsked: 'Pinning strategy is a frequent source of real production incidents and team debates.',
      mistakes: ['Pinning == in a published library', 'Leaving an application unpinned', 'Thinking ~=2.31 and ~=2.31.0 mean the same thing'],
      followUps: ['What problems do strict upper bounds cause?', 'How would you update locked versions safely?'],
      modelAnswer: 'Double equals pins one exact version, greater-or-equal only sets a minimum, and tilde-equals is the compatible-release operator: ~=2.31 means at least 2.31 but still 2.x, while ~=2.31.0 only allows 2.31 bug-fix releases. Which to use depends on who owns the environment. A library is installed alongside many other packages, so it declares honest ranges — a lower bound it was tested with and usually below the next major version — and never exact pins, which cause resolution conflicts for users. An application owns its environment, so it locks every package, including transitive ones, to exact versions with hashes, and upgrades through pull requests.',
    },
    {
      id: 'pip-and-dependencies-resolution-impossible',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'pip fails with "ResolutionImpossible": package A needs `pydantic<2` and package B needs `pydantic>=2`. What are your options?',
      answer: 'There is no version satisfying both, so something must change: upgrade A to a release that supports pydantic 2, downgrade B to a release that accepts pydantic 1, replace one of the packages, or (temporarily) split the work into separate environments/services. Forcing an install with --no-deps just moves the failure to runtime.',
      explanation: py`Start by reading the error (or \`pip install\` with \`-v\`), check each package's changelog for compatible releases, and try relaxing *your own* pins first — often the conflict is caused by an over-tight pin in your requirements rather than in the libraries.`,
      code: { lang: 'bash', code: py`python -m pip install "A>=3" "B"          # does a newer A support pydantic 2?
python -m pip index versions A             # list available versions (experimental pip command)
python -m pip show A                       # what does the installed A require?` },
      whyAsked: 'Dependency conflicts are an everyday problem in larger projects; the answer shows calm, systematic troubleshooting.',
      mistakes: ['Using --no-deps or --force-reinstall to "win"', 'Vendoring a copy of the library without a plan', 'Not checking whether your own pins cause the conflict'],
      followUps: ['How can a lock file help prevent this?', 'Why are strict upper bounds in libraries controversial?'],
      modelAnswer: 'ResolutionImpossible means no single set of versions satisfies every constraint — here pydantic can\'t be both below and at least 2. First I check whether my own pins are the problem, then look for releases that remove the conflict: a newer A that supports pydantic 2, or an older B that still accepts 1. If neither exists, I would replace one dependency or, as a last resort, isolate them in separate environments or services. I would not force it with --no-deps, because that just turns an install-time error into a runtime crash.',
    },
    {
      id: 'pip-and-dependencies-specifier-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Which versions does this specifier set accept?',
      code: { lang: 'python', static: true, code: py`from packaging.specifiers import SpecifierSet   # third-party; pip uses it internally

spec = SpecifierSet(">=1.4,!=1.5.*,<2")
print([v for v in ["1.3", "1.4.2", "1.5.1", "1.9", "2.0"] if v in spec])` },
      options: ["['1.4.2', '1.5.1', '1.9']", "['1.4.2', '1.9']", "['1.4.2', '1.9', '2.0']", "['1.3', '1.4.2', '1.9']"],
      correctOption: 1,
      answer: "['1.4.2', '1.9']. 1.3 is below 1.4, every 1.5.x is excluded by !=1.5.*, and 2.0 fails <2.",
      explanation: py`Commas mean "and": every clause must hold. \`!=1.5.*\` is a prefix exclusion, removing 1.5.0, 1.5.1, … — a common way to skip a whole broken series.`,
      whyAsked: 'Checks precise understanding of PEP 440 specifiers rather than vague familiarity.',
      mistakes: ['Treating commas as "or"', 'Thinking !=1.5.* only excludes 1.5.0', 'Including 2.0 in <2'],
      followUps: ['How would you express "any 2.x from 2.4 on" with ~=?', 'How are pre-releases treated?'],
      modelAnswer: 'It prints 1.4.2 and 1.9. The comma means every clause must be satisfied: 1.3 fails the lower bound, 1.5.1 is excluded because !=1.5.* removes the whole 1.5 series, and 2.0 fails the strict less-than-2. That wildcard exclusion is handy when one minor series is known to be broken. In real code I would use packaging\'s SpecifierSet like this rather than comparing version strings myself.',
    },
    {
      id: 'pip-and-dependencies-install-set',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Given a dependency graph `{package: [its dependencies]}`, write `install_set(graph, requested)` returning the sorted list of every package that would be installed for the requested ones — including transitive dependencies. Packages missing from the graph have no dependencies. Handle shared dependencies and cycles.',
      answer: 'Depth- or breadth-first traversal with a seen set: start from the requested packages, add each new package to seen, push its dependencies (graph.get(name, [])), skip anything already seen, and return sorted(seen).',
      explanation: py`This is graph reachability. The \`seen\` set handles both shared dependencies (visited once) and cycles (no infinite loop). pip's real resolver does more — it chooses versions and backtracks — but discovering the full set of transitive dependencies is the same walk.`,
      starter: { files: { 'main.py': GRAPH_START } },
      tests: [
        { name: 'transitive dependencies are included', code: py`assert install_set(GRAPH, ["rich"]) == ["markdown-it-py", "mdurl", "pygments", "rich"]` },
        { name: 'the whole app', code: py`assert install_set(GRAPH, ["app"]) == sorted(["app", "requests", "rich", "certifi", "charset-normalizer", "idna", "urllib3", "markdown-it-py", "mdurl", "pygments"])` },
        { name: 'shared dependencies appear once', code: py`g = {"a": ["c"], "b": ["c"], "c": []}
assert install_set(g, ["a", "b"]) == ["a", "b", "c"]` },
        { name: 'cycles terminate', code: py`assert install_set({"x": ["y"], "y": ["x"]}, ["x"]) == ["x", "y"]` },
        { name: 'nothing requested, nothing installed', code: py`assert install_set(GRAPH, []) == []` },
      ],
      solution: { files: { 'main.py': py`GRAPH = {
    "app": ["requests", "rich"],
    "requests": ["certifi", "charset-normalizer", "idna", "urllib3"],
    "rich": ["markdown-it-py", "pygments"],
    "markdown-it-py": ["mdurl"],
}


def install_set(graph, requested):
    """Every package pip would install for the requested ones, sorted."""
    seen = set()
    stack = list(requested)
    while stack:
        name = stack.pop()
        if name in seen:
            continue
        seen.add(name)
        stack.extend(graph.get(name, []))
    return sorted(seen)


print(install_set(GRAPH, ["rich"]))
` } },
      hints: ['Keep a set of packages already visited and a stack (or queue) of packages still to visit.', 'graph.get(name, []) gives no dependencies for unknown packages.', 'Check "if name in seen: continue" before expanding, so cycles stop.'],
      whyAsked: 'A practical graph-traversal question framed in a domain every Python developer meets.',
      mistakes: ['Unbounded recursion on cycles', 'Using a list for seen (slow membership checks)', 'Forgetting packages that are missing from the graph'],
      followUps: ['How would you also report which root pulled in each package?', 'How would you detect that a cycle exists?', 'What does pip\'s resolver add on top of this?'],
      modelAnswer: 'It is a reachability problem, so I do an iterative depth-first walk. I keep a seen set and a stack initialised with the requested packages; I pop a name, skip it if already seen, otherwise mark it and push its dependencies, using graph.get with an empty list for packages that have none. The seen set makes shared dependencies appear once and stops cycles from looping forever. Finally I return the sorted set. pip\'s real resolver also has to choose versions and backtrack on conflicts, but finding the transitive set is this same traversal.',
    },
    {
      id: 'pip-and-dependencies-supply-chain',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your security team asks how the Python services protect themselves against malicious or vulnerable dependencies. What would you put in place?',
      answer: 'Exact, hashed lock files installed with --require-hashes; deliberate dependency additions reviewed like code; automated update PRs (Dependabot/Renovate) gated by tests; pip-audit (or similar) in CI for known vulnerabilities; a private index or proxy configured to prevent dependency confusion; least-privilege builds; and minimal production images built only from the lock.',
      explanation: py`Threats include typosquatting, compromised maintainer accounts, dependency confusion (a public package with the same name as an internal one) and known CVEs in old versions. Locks with hashes ensure you install exactly what you reviewed; audits find known issues; update automation stops versions from rotting. See [secure practices](lesson:secure-practices).`,
      whyAsked: 'Supply-chain attacks are a real and growing risk; senior engineers are expected to know practical mitigations.',
      mistakes: ['Relying only on pinning without hashes or audits', 'Never updating ("pinned is safe")', 'Installing straight from unreviewed URLs or forks'],
      followUps: ['What is dependency confusion and how do you prevent it?', 'How do you balance updating often with stability?'],
      modelAnswer: 'I would make every install deterministic and verifiable: a committed lock file with exact versions and hashes, installed with require-hashes in CI and in the production image, which contains only runtime dependencies. New dependencies get reviewed like code — is it maintained, is the name correct, do we need it? Automated update pull requests keep us current, and they only merge when the tests pass. pip-audit runs in CI to flag known vulnerabilities. If we have internal packages, we use a private index or proxy configured so that public names cannot shadow them, which closes the dependency-confusion hole.',
    },
  ],

  takeaways: [
    'pip installs packages from PyPI into the environment of the Python that runs it — always use python -m pip inside a venv.',
    'Installing one package also installs its transitive dependencies; pip show lists Requires and Required-by.',
    'PEP 440 specifiers: == exact, != exclude, >= / < bounds, comma means AND, ~= compatible release (~=2.31 → >=2.31, ==2.*).',
    'Compare versions numerically, never as strings ("2.10" > "2.9").',
    'Libraries declare compatible ranges; applications lock every package to exact versions (ideally with hashes) and install from the lock.',
    'Conflicts (ResolutionImpossible) are fixed by changing requirements, never by forcing installs.',
    'Use pipx (or uv tool) for command-line tools; uv, Poetry and pip-tools automate the declare → lock → sync workflow.',
  ],
}
