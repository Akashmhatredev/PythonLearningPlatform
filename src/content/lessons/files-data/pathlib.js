// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ORGANISER = py`# Notes organiser: explore a folder tree with pathlib
from pathlib import Path

NOTES = Path("notes")                         # a relative path
print("Running in:", Path.cwd())
print("Is", NOTES, "a folder?", NOTES.is_dir())

# 1. What is directly inside? (iterdir's order is arbitrary, so sort it)
for entry in sorted(NOTES.iterdir()):
    kind = "folder" if entry.is_dir() else "file"
    print(f"  {kind:6} {entry.name}")

# 2. Every .txt file at any depth, shown relative to NOTES
txt_files = sorted(NOTES.rglob("*.txt"))
print("Text notes:", [p.relative_to(NOTES).as_posix() for p in txt_files])

# 3. Count words per file type (by suffix)
words_by_type = {}
for path in sorted(NOTES.rglob("*")):
    if path.is_file():
        words = len(path.read_text(encoding="utf-8").split())
        words_by_type[path.suffix] = words_by_type.get(path.suffix, 0) + words
print("Words by type:", words_by_type)

# 4. Write a summary into a nested folder that may not exist yet
out_dir = Path("reports") / "2026"
out_dir.mkdir(parents=True, exist_ok=True)
summary = out_dir / "summary.txt"
summary.write_text(f"{len(txt_files)} text notes\n", encoding="utf-8")
print("Wrote", summary, "->", summary.read_text(encoding="utf-8").strip())
print("Absolute path:", summary.resolve())
`

const NOTE_FILES = {
  'notes/maths.txt': py`Pythagoras: a squared plus b squared equals c squared.
Revise fractions.
`,
  'notes/ideas.txt': py`Build a quiz app.
`,
  'notes/todo.md': py`# To do
- finish essay
- tidy desk
`,
  'notes/history.md': py`# Romans
The Romans built roads and aqueducts.
`,
  'notes/archive/2025-physics.txt': py`Forces, motion and energy.
`,
}

const INBOX_FILES = {
  'inbox/song-lyrics.txt': py`La la la
`,
  'inbox/plan.md': py`# Weekend plan
`,
  'inbox/budget.csv': py`item,cost
pizza,12
`,
  'inbox/lyrics.txt': py`more la la
`,
}

export default {
  id: 'pathlib',
  title: 'Paths with pathlib',
  summary: 'pathlib turns file paths into objects you join with /, take apart with .name/.stem/.suffix/.parent, and query, list, read and create — the same way on every operating system.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['reading-writing-files', 'string-methods'],
  related: ['reading-writing-files', 'json-data', 'csv-data', 'command-line-programs', 'operator-overloading', 'injection-attacks', 'project-structure', 'modules-and-imports', 'project-log-analyzer'],
  tags: ['pathlib', 'Path', 'paths', 'folders', 'directories', 'os.path', 'glob', 'rglob', 'iterdir', 'mkdir', 'resolve', 'relative path', 'absolute path', 'suffix', 'stem', 'parent', '__file__', 'path traversal', 'cross-platform'],
  apis: [
    { name: 'Path(*parts)', summary: 'Creates a path object for the current OS (PosixPath or WindowsPath). Path() is the current directory ".".' },
    { name: 'path / "child"', summary: 'Joins paths with the / operator, inserting the right separator for the OS.' },
    { name: '.name / .stem / .suffix / .suffixes', summary: 'Last component; it without its final suffix; the final suffix (".csv"); all suffixes ([".tar", ".gz"]).' },
    { name: '.parent / .parents / .parts', summary: 'The containing folder; every ancestor; the components as a tuple.' },
    { name: '.with_suffix() / .with_name() / .with_stem()', summary: 'A new path with one component replaced (with_stem is 3.9+).' },
    { name: '.exists() / .is_file() / .is_dir()', summary: 'Ask the file system whether something is there, and what it is.' },
    { name: '.read_text() / .write_text() / .read_bytes() / .write_bytes()', summary: 'Open, read or write, and close in one call. Pass encoding="utf-8" for text.' },
    { name: '.iterdir() / .glob() / .rglob()', summary: 'List a folder; match a pattern ("*.csv"); match at any depth.' },
    { name: '.mkdir(parents=True, exist_ok=True)', summary: 'Create a folder and any missing parents; no error if it already exists.' },
    { name: '.resolve() / .relative_to() / .is_relative_to()', summary: 'Absolute path with ".." and symlinks resolved; the path relative to another; is it inside another (3.9+)?' },
    { name: 'Path.cwd() / Path.home() / Path(__file__)', summary: 'The current working directory; your home folder; the running script file.' },
    { name: '.unlink() / .rmdir() / .rename() / .replace()', summary: 'Delete a file; delete an empty folder; move/rename (replace() overwrites an existing target).' },
  ],
  docs: [
    { label: 'pathlib — object-oriented filesystem paths', url: 'https://docs.python.org/3/library/pathlib.html' },
    { label: 'pathlib — corresponding os/os.path tools', url: 'https://docs.python.org/3/library/pathlib.html#corresponding-tools' },
    { label: 'PEP 428 — the pathlib module', url: 'https://peps.python.org/pep-0428/' },
    { label: 'PEP 519 — the file system path protocol (os.PathLike)', url: 'https://peps.python.org/pep-0519/' },
    { label: 'shutil — high-level file operations', url: 'https://docs.python.org/3/library/shutil.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **path** is the address of a file or folder: \`notes/maths.txt\`, \`/home/ada/photos\`, \`C:\Users\Ada\Desktop\`. Every program that touches files has to build, take apart and check paths.`,
    py`You *could* treat paths as plain strings and glue them together with \`+\`. The standard library's **pathlib** module gives you something better: a \`Path\` **object** that knows it's a path. You join pieces with \`/\`, ask for parts with attributes like \`.suffix\`, and call methods like \`.exists()\` or \`.read_text()\` directly on it.`,
    { code: py`from pathlib import Path

report = Path("reports") / "2026" / "march.csv"
print(report.name)      # march.csv
print(report.suffix)    # .csv
print(report.parent)    # reports/2026  (reports\2026 on Windows)`, lang: 'python', title: 'a first taste' },
    py`This lesson builds on [reading & writing files](lesson:reading-writing-files) — \`open()\` accepts \`Path\` objects directly — and you'll use paths again in [JSON](lesson:json-data), [CSV](lesson:csv-data) and [command-line programs](lesson:command-line-programs).`,
  ],
  why: [
    py`**Different operating systems spell paths differently.** Windows uses \`\\\` between folders and drive letters like \`C:\\\`; Linux and macOS use \`/\`. String concatenation hard-codes one style and breaks on the other. \`Path("data") / "scores.csv"\` produces the right form for whatever machine runs it.`,
    py`**Taking paths apart with string methods is error-prone.** Finding a file's extension with \`name.split(".")[1]\` fails for \`archive.tar.gz\` and \`.bashrc\`. pathlib already handles those cases.`,
    py`**Everything about a path lives in one place.** Before pathlib (added in Python 3.4) you needed \`os.path\` for joining, \`os\` for listing and deleting, \`glob\` for patterns and \`open\` for reading. A \`Path\` object does all of that, and code reads like a sentence: \`if config.exists(): settings = config.read_text(encoding="utf-8")\`.`,
  ],
  eli15: [
    py`A path is like a **postal address** for a file: country → city → street → house. \`reports/2026/march.csv\` says "go into *reports*, then into *2026*, and the file is *march.csv*".`,
    py`If you write addresses by hand you might forget a comma or use the wrong format for another country. pathlib is like a smart address label: you hand it the pieces, it formats them correctly for wherever you are, and it can answer questions — "what's the house number?" (\`.name\`), "which street is it on?" (\`.parent\`), "does this house actually exist?" (\`.exists()\`).`,
  ],
  analogy: {
    title: 'A smart address label',
    body: [
      py`Imagine address labels that understand addresses. You give the label "UK", "London", "Baker Street", "221B" and it prints them in the correct order and format for the country you're posting from. You can ask it for just the street, swap the house number for another one, or check with the post office that the house exists.`,
      py`A plain string is a label scribbled by hand: it's just text. Python can't tell which part is the city and which is the house — you have to cut it up yourself, and every country formats it differently.`,
    ],
    mapping: [
      ['the address pieces (country, city, street, house)', 'path components: "reports", "2026", "march.csv"'],
      ['joining the pieces in the right format for the country', 'Path("reports") / "2026" / "march.csv"'],
      ['"which street is it on?"', 'path.parent'],
      ['the house number / name on the door', 'path.name'],
      ['swapping the house number', 'path.with_name("april.csv")'],
      ['asking the post office if the house exists', 'path.exists()'],
      ['a full address including the country', 'an absolute path: path.resolve()'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Build a path, take it apart, use it',
    props: {
      code: py`from pathlib import Path

report = Path("reports") / "2026" / "march.csv"
print(report)
print(report.name, report.stem, report.suffix)
print(report.parent)
print(report.parts)

backup = report.with_suffix(".bak")
print(backup)

report.parent.mkdir(parents=True, exist_ok=True)
report.write_text("day,sales\n1,40\n", encoding="utf-8")
print(report.exists(), report.stat().st_size)
`,
      notes: {
        3: '`/` between a Path and a string joins them. Nothing on the disk is touched — a Path is just a description of a location.',
        5: '`.name` is the last component, `.stem` is the name without its final suffix, `.suffix` is the extension *including* the dot.',
        6: '`.parent` is another Path: everything except the last component.',
        9: '`with_suffix` returns a **new** Path — Path objects are immutable, like strings.',
        12: 'Now we touch the disk: create `reports/2026` (and `reports` if needed). `exist_ok=True` means "fine if it already exists".',
        13: '`write_text` opens, writes and closes the file in one call.',
        14: '`stat()` asks the operating system about the file; `st_size` is its size in bytes.',
      },
    },
    alt: 'A step-by-step trace. report becomes PosixPath reports/2026/march.csv. Printing shows its name march.csv, stem march, suffix .csv, parent reports/2026 and parts as a tuple. backup is a new path reports/2026/march.bak. Then the folder is created, the file is written, and the program prints True 15 for exists and size in bytes.',
    caption: py`Lines 3–10 are pure path arithmetic — no files are read or created. Only from line 12 does the program ask the operating system to do something. Keeping those two ideas apart makes pathlib easy to reason about.`,
  },
  syntax: [
    py`#### Making paths`,
    { code: py`from pathlib import Path

here = Path.cwd()                      # the current working directory
home = Path.home()                     # your home folder, e.g. /home/ada
data = Path("data")                    # relative to the working directory
config = Path("data", "config.json")   # several pieces at once
csv_file = data / "2026" / "sales.csv" # join with /
script_dir = Path(__file__).parent     # the folder this .py file lives in`, lang: 'python', title: 'creating Path objects', static: true },
    py`\`Path\` automatically becomes a \`PosixPath\` on Linux/macOS or a \`WindowsPath\` on Windows. The \`/\` operator works because \`Path\` defines the special method \`__truediv__\` (see [operator overloading](lesson:operator-overloading)). If the right-hand side is **absolute**, it wins: \`Path("/srv/app") / "/etc/passwd"\` is \`/etc/passwd\`.`,
    py`#### Taking paths apart`,
    py`| expression | for \`Path("backups/2026/db.tar.gz")\` |
|---|---|
| \`.name\` | \`'db.tar.gz'\` |
| \`.stem\` | \`'db.tar'\` (only the **last** suffix is removed) |
| \`.suffix\` | \`'.gz'\` |
| \`.suffixes\` | \`['.tar', '.gz']\` |
| \`.parent\` | \`Path('backups/2026')\` |
| \`.parts\` | \`('backups', '2026', 'db.tar.gz')\` |
| \`.with_suffix(".zip")\` | \`Path('backups/2026/db.tar.zip')\` |
| \`.with_name("x.csv")\` | \`Path('backups/2026/x.csv')\` |`,
    py`A file with no dot has \`suffix == ""\`; hidden files like \`.bashrc\` also have no suffix (their stem is \`.bashrc\`). \`with_suffix\` needs the dot: \`with_suffix("bak")\` raises \`ValueError: Invalid suffix 'bak'\`.`,
    py`#### Asking the file system`,
    { code: py`from pathlib import Path

path = Path("notes/maths.txt")
path.exists()          # is there anything at this path?
path.is_file()         # ...and is it a regular file?
path.is_dir()          # ...or a folder?
path.stat().st_size    # size in bytes (raises FileNotFoundError if missing)`, lang: 'python', title: 'queries', static: true },
    py`#### Reading and writing in one call`,
    { code: py`from pathlib import Path

notes = Path("notes.txt")
notes.write_text("Revise fractions\n", encoding="utf-8")   # create or overwrite
text = notes.read_text(encoding="utf-8")                   # whole file as str
raw = notes.read_bytes()                                    # whole file as bytes

with notes.open("a", encoding="utf-8") as f:                # same as open(notes, "a", ...)
    f.write("Practise times tables\n")`, lang: 'python', title: 'shortcuts for small files' },
    py`\`read_text\` / \`write_text\` are perfect for small files. For big files or line-by-line work, use \`path.open()\` or \`open(path)\` in a \`with\` block exactly as in the [previous lesson](lesson:reading-writing-files).`,
    py`#### Listing and searching`,
    { code: py`from pathlib import Path

folder = Path(".")
for entry in sorted(folder.iterdir()):     # direct children only
    print(entry.name)

py_files = sorted(folder.glob("*.py"))     # pattern, this folder only
all_txt = sorted(folder.rglob("*.txt"))    # pattern, at any depth ("recursive glob")
same = sorted(folder.glob("**/*.txt"))     # ** = "any number of folders"`, lang: 'python', title: 'iterdir, glob, rglob' },
    { callout: 'warn', title: 'Sort the results', text: py`\`iterdir()\`, \`glob()\` and \`rglob()\` return entries in whatever order the operating system gives them, which differs between machines and runs. If order matters — printing, tests, processing "the first file" — wrap them in \`sorted()\`. They also return **generators**, so convert to a list if you need to loop twice.` },
    py`#### Creating, moving and deleting`,
    { code: py`from pathlib import Path

out = Path("exports") / "2026" / "march"
out.mkdir(parents=True, exist_ok=True)     # make missing parents; ok if it exists

draft = out / "draft.txt"
draft.write_text("v1\n", encoding="utf-8")
final = draft.rename(out / "final.txt")   # move/rename, returns the new path
final.replace(out / "sales.txt")          # like rename, but overwrites the target
(out / "sales.txt").unlink()              # delete a file
(out / "gone.txt").unlink(missing_ok=True) # ...without an error if it isn't there
out.rmdir()                               # delete an EMPTY folder`, lang: 'python', title: 'changing the file system' },
    py`To delete a folder **with** its contents use \`shutil.rmtree(path)\` — carefully, there is no recycle bin. To copy files use \`shutil.copy2(src, dst)\`, or \`src.copy(dst)\` on **Python 3.14+**, which also added \`Path.move()\`.`,
    py`#### Absolute and relative paths`,
    { code: py`from pathlib import Path

p = Path("notes/../main.py")
print(p.is_absolute())             # False: relative to the working directory
print(p.resolve())                 # /home/pyodide/project/main.py (absolute, ".." removed)
print(Path("notes/maths.txt").relative_to("notes"))   # maths.txt`, lang: 'python', title: 'resolve() and relative_to()' },
    py`A **relative** path is interpreted from the **current working directory** (\`Path.cwd()\`) — the folder the program was *started from*, which is not necessarily where the script lives. When a script needs its own data files, anchor them to the script: \`Path(__file__).resolve().parent / "data.csv"\`.`,
  ],
  walkthrough: {
    title: 'Reading the notes organiser',
    lang: 'python',
    code: ORGANISER,
    intro: py`This is the playground program below; the \`notes\` folder with its subfolder \`archive\` is part of the project. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [4, 6], text: py`\`Path("notes")\` is a **relative** path. \`Path.cwd()\` shows where relative paths start from; \`is_dir()\` asks the file system whether a folder is really there.` },
      { lines: [9, 11], text: py`\`iterdir()\` yields a Path for each direct child of the folder. Its order is up to the OS, so \`sorted()\` makes the output stable. \`entry.name\` drops the \`notes/\` prefix for display.` },
      { lines: [14, 15], text: py`\`rglob("*.txt")\` searches every folder below \`notes\`, including \`archive\`. \`relative_to(NOTES)\` turns \`notes/archive/2025-physics.txt\` into \`archive/2025-physics.txt\`, and \`as_posix()\` prints it with \`/\` on every OS.` },
      { lines: [18, 23], text: py`\`rglob("*")\` matches folders too, so \`is_file()\` filters them out. \`read_text(encoding="utf-8")\` reads each note in one call, and \`path.suffix\` groups the counts by file type.` },
      { lines: [26, 27], text: py`\`/\` builds \`reports/2026\`; nothing exists yet. \`mkdir(parents=True, exist_ok=True)\` creates both folders and won't complain if they are already there — the safe default for "make sure this folder exists".` },
      { lines: [28, 31], text: py`\`write_text\` creates the summary file. Printing a Path shows it in the OS's native format; \`resolve()\` turns the relative path into a full absolute one.` },
    ],
  },
  playground: {
    title: 'Notes organiser',
    objective: 'Explore a folder tree: list it, search it by pattern, read files, and create new folders and files — all with Path objects.',
    files: { 'main.py': ORGANISER, ...NOTE_FILES },
    expected: py`\`\`\`text
Running in: /home/pyodide/project
Is notes a folder? True
  folder archive
  file   history.md
  file   ideas.txt
  file   maths.txt
  file   todo.md
Text notes: ['archive/2025-physics.txt', 'ideas.txt', 'maths.txt']
Words by type: {'.txt': 19, '.md': 17}
Wrote reports/2026/summary.txt -> 3 text notes
Absolute path: /home/pyodide/project/reports/2026/summary.txt
\`\`\`

The playground runs on Linux-style paths inside an in-memory file system that is rebuilt before every run, so \`reports/\` disappears between runs. On Windows the same program prints \`reports\2026\summary.txt\`.`,
    experiments: [
      {
        id: 'md-stems',
        task: py`At the end, create a variable \`md_stems\`: a **sorted list** of the *stems* (names without \`.md\`) of every Markdown note under \`NOTES\`, at any depth. Print it.`,
        hint: py`\`sorted(p.stem for p in NOTES.rglob("*.md"))\``,
        tests: [{ name: 'md_stems is ["history", "todo"]', code: py`assert ns.get("md_stems") == ["history", "todo"], "Make md_stems a sorted list of the .md stems"` }],
        explain: py`\`.stem\` removes only the final suffix, which is exactly what "name without extension" usually means. Using \`rglob\` instead of \`glob\` means a future \`notes/archive/old.md\` would be found too.`,
      },
      {
        id: 'new-note',
        task: py`Before step 1, make the program create \`notes/science/chemistry.txt\` containing \`Atoms and molecules.\` — the \`science\` folder doesn't exist yet. Predict how the listing and the text-note count change.`,
        hint: py`\`science = NOTES / "science"\`, then \`science.mkdir(exist_ok=True)\` and \`(science / "chemistry.txt").write_text("Atoms and molecules.\n", encoding="utf-8")\`.`,
        tests: [
          { name: 'notes/science/chemistry.txt exists', code: py`from pathlib import Path
assert Path("notes/science/chemistry.txt").is_file(), "Create notes/science/chemistry.txt from the program"` },
          { name: 'the new folder appears in the listing', code: py`assert "folder science" in output` },
          { name: 'four text notes are found', code: py`assert len(txt_files) == 4, "Create the note before the rglob search runs"` },
        ],
        explain: py`\`write_text\` can create a file but not its folder — that's \`mkdir\`'s job. Because the note is created *before* the scans, \`iterdir\` lists the new folder and \`rglob\` finds the new file.`,
      },
      {
        id: 'total-size',
        task: py`Add a variable \`total_bytes\` holding the total size in bytes of every **file** under \`NOTES\` (any depth), and print it.`,
        hint: py`\`sum(p.stat().st_size for p in NOTES.rglob("*") if p.is_file())\``,
        tests: [{ name: 'total_bytes matches the files on disk', code: py`from pathlib import Path
expected = sum(p.stat().st_size for p in Path("notes").rglob("*") if p.is_file())
assert ns.get("total_bytes") == expected, f"Expected {expected} bytes"` }],
        explain: py`\`stat()\` asks the OS for a file's metadata; \`st_size\` is its size in bytes (not characters — "é" counts as 2 in UTF-8). Folders are skipped because a folder's "size" means something different on each OS.`,
      },
      {
        id: 'safe-path',
        task: py`Users may type a note name. Write \`safe_note_path(name)\` that returns \`(NOTES / name).resolve()\`, but raises \`ValueError\` if that resolved path is **not inside** \`NOTES.resolve()\` — so \`"../main.py"\` and \`"/etc/passwd"\` are rejected.`,
        hint: py`\`base = NOTES.resolve()\`, \`target = (NOTES / name).resolve()\`, then \`if not target.is_relative_to(base): raise ValueError(...)\`. Resolve *before* checking — \`is_relative_to\` alone doesn't understand \`..\`.`,
        tests: [
          { name: 'normal names are allowed', code: py`from pathlib import Path
assert safe_note_path("maths.txt") == Path("notes/maths.txt").resolve()
assert safe_note_path("archive/2025-physics.txt") == Path("notes/archive/2025-physics.txt").resolve()` },
          { name: '"../main.py" is rejected', code: py`with raises(ValueError):
    safe_note_path("../main.py")` },
          { name: 'absolute paths are rejected', code: py`with raises(ValueError):
    safe_note_path("/etc/passwd")` },
        ],
        explain: py`This is a defence against **path traversal**: \`NOTES / "../main.py"\` looks like it's inside \`notes\`, but it points outside. \`resolve()\` collapses the \`..\` (and follows symlinks), and only then does \`is_relative_to\` (3.9+) give a trustworthy answer. Joining with an absolute path replaces the base entirely, which the same check also catches. More in [injection attacks](lesson:injection-attacks).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Anatomy of a path',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'full', label: '/home/ada/reports/march.csv', note: 'Path object', x: 380, y: 50, tone: 'ink' },
        { id: 'anchor', label: '/', note: '.anchor (C:\\ on Windows)', x: 90, y: 170, tone: 'kraft' },
        { id: 'parent', label: '/home/ada/reports', note: '.parent', x: 300, y: 170, tone: 'blue' },
        { id: 'name', label: 'march.csv', note: '.name', x: 590, y: 170, tone: 'yellow' },
        { id: 'stem', label: 'march', note: '.stem', x: 500, y: 285, tone: 'paper' },
        { id: 'suffix', label: '.csv', note: '.suffix', x: 680, y: 285, tone: 'red' },
        { id: 'sibling', label: '/home/ada/reports/april.csv', note: '.with_name("april.csv")', x: 200, y: 285, tone: 'paper' },
      ],
      edges: [
        { from: 'full', to: 'anchor' },
        { from: 'full', to: 'parent' },
        { from: 'full', to: 'name' },
        { from: 'name', to: 'stem' },
        { from: 'name', to: 'suffix' },
        { from: 'parent', to: 'sibling', label: '/ "april.csv"', dashed: true },
      ],
      steps: [
        { focus: ['full'], text: py`One **Path** object. It is *absolute* because it starts at the root \`/\`; a *relative* path like \`reports/march.csv\` would start from the current working directory instead.` },
        { focus: ['full', 'anchor'], edges: ['full->anchor'], text: py`\`.anchor\` is where the path starts: \`/\` on Linux and macOS, a drive like \`C:\\\` on Windows. Relative paths have an empty anchor.` },
        { focus: ['full', 'parent'], edges: ['full->parent'], text: py`\`.parent\` is everything except the last component — itself a Path, so you can keep going: \`.parent.parent\` is \`/home/ada\`. \`.parents\` lists every ancestor.` },
        { focus: ['full', 'name'], edges: ['full->name'], text: py`\`.name\` is the last component: the file (or folder) name.` },
        { focus: ['name', 'stem', 'suffix'], edges: ['name->stem', 'name->suffix'], text: py`\`.stem\` + \`.suffix\` = \`.name\`. The suffix is the **final** extension including its dot; \`archive.tar.gz\` has suffix \`.gz\`, stem \`archive.tar\`, and \`.suffixes\` \`['.tar', '.gz']\`.` },
        { focus: ['parent', 'sibling'], edges: ['parent->sibling'], text: py`Paths are **immutable**: \`with_name\`, \`with_stem\` and \`with_suffix\` return new Paths. \`path.parent / "april.csv"\` and \`path.with_name("april.csv")\` give the same sibling file.` },
      ],
    },
    alt: 'Diagram: the path /home/ada/reports/march.csv at the top splits into its anchor (/), its parent (/home/ada/reports) and its name (march.csv). The name splits further into the stem march and the suffix .csv. A dashed arrow from the parent leads to the sibling path /home/ada/reports/april.csv, made with with_name or parent / "april.csv".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`Path\` is just a **value** describing a location — like a string, but structured. Creating one never touches the disk: \`Path("does/not/exist.txt")\` is perfectly fine. Only methods that need the file system (\`exists()\`, \`read_text()\`, \`mkdir()\`, \`iterdir()\`…) go and ask the operating system.`,
      py`Paths are **immutable** and **comparable**: \`Path("a/b") == Path("a//b")\` is \`True\` because pathlib normalises the spelling (doubled slashes and \`.\` components disappear). It does **not** remove \`..\`, because \`a/../b\` and \`b\` can be different places when \`a\` is a symbolic link — only \`resolve()\`, which asks the file system, removes them.`,
    ],
    technical: [
      py`pathlib has two families of classes. **Pure paths** (\`PurePath\`, \`PurePosixPath\`, \`PureWindowsPath\`) only do path arithmetic and never touch the disk — handy for manipulating Windows paths on Linux or vice versa. **Concrete paths** (\`Path\`, \`PosixPath\`, \`WindowsPath\`) add the file-system methods. \`Path(...)\` returns the concrete class for the current OS.`,
      { code: py`from pathlib import PureWindowsPath

p = PureWindowsPath("C:/Users/ada") / "notes" / "x.txt"
print(p)                                       # C:\Users\ada\notes\x.txt
print(p.anchor, p.suffix)                       # C:\ .txt
print(PureWindowsPath("A") == PureWindowsPath("a"))   # True: Windows paths compare case-insensitively`, lang: 'python', title: 'Windows path arithmetic, on any OS' },
      py`Most of the standard library accepts Path objects wherever a path is expected: \`open()\`, \`os\`, \`shutil\`, \`json\`-adjacent helpers, \`sqlite3.connect()\`… That works through the **file system path protocol** (PEP 519, Python 3.6): any object with a \`__fspath__()\` method is "path-like", and \`os.fspath(p)\` turns it into a \`str\`. If an older third-party library insists on strings, pass \`str(path)\`.`,
      py`\`glob\` patterns: \`*\` matches anything within one component, \`?\` one character, \`[abc]\` a character set, and \`**\` any number of folders. \`rglob(pattern)\` is \`glob("**/" + pattern)\`. Since **3.12**, \`Path.walk()\` gives an \`os.walk\`-style \`(folder, subfolders, files)\` tour of a tree.`,
      { callout: 'note', title: 'Case sensitivity is an OS thing', text: py`Whether \`Notes.TXT\` and \`notes.txt\` are the same file depends on the file system: usually different on Linux, the same on Windows and on macOS's default settings. \`PosixPath\` compares case-sensitively and \`WindowsPath\` doesn't, but the disk has the final say. Don't build logic that depends on it; normalise with \`.suffix.lower()\` when matching extensions.` },
    ],
    production: [
      py`**Anchor data files to the code, not the working directory.** Scripts get run from cron jobs, IDEs, other folders and test runners, each with a different cwd. \`BASE_DIR = Path(__file__).resolve().parent\` at the top of a module gives a stable root; installed packages should use \`importlib.resources\` instead (see [project structure](lesson:project-structure)).`,
      py`**Never trust a path from outside.** Filenames from users, uploads, URLs or archives can contain \`..\`, absolute paths or symlinks that escape the folder you meant. Resolve, then check containment:`,
      { code: py`from pathlib import Path

UPLOADS = Path("uploads").resolve()


def upload_path(filename):
    target = (UPLOADS / filename).resolve()
    if not target.is_relative_to(UPLOADS):          # Python 3.9+
        raise ValueError(f"unsafe path: {filename!r}")
    return target


print(upload_path("cat.txt").name)          # cat.txt
try:
    upload_path("../../etc/passwd")
except ValueError as e:
    print(e)                                # unsafe path: '../../etc/passwd'`, lang: 'python', title: 'containing a user-supplied path' },
      py`**Check-then-act is racy.** \`if not p.exists(): p.write_text(...)\` can still overwrite a file another process created between the two lines. When it matters, act and handle the failure: \`open(p, "x")\` raises \`FileExistsError\` atomically, \`mkdir(exist_ok=True)\` tolerates the race. That's the EAFP style from [error-handling patterns](lesson:error-handling-patterns).`,
      py`**Large trees:** \`rglob\` and \`walk\` are lazy generators, so they stream even for millions of files — but every \`stat()\`/\`is_file()\` is a system call, which is slow on network drives. Filter by name first, stat later. For temporary working folders in tests, \`tempfile.TemporaryDirectory()\` gives a fresh folder that is deleted automatically.`,
    ],
  },
  mistakes: [
    {
      title: 'Building paths with string concatenation',
      wrong: { code: py`folder = "reports"
path = folder + "/" + "2026" + "/" + "march.csv"   # wrong separator on Windows, easy to double or miss a "/"`, lang: 'python' },
      right: { code: py`from pathlib import Path

path = Path("reports") / "2026" / "march.csv"`, lang: 'python' },
      explanation: py`Hand-made separators break across operating systems and produce bugs like \`reports2026\` or \`reports//2026\`. The \`/\` operator inserts exactly one correct separator.`,
    },
    {
      title: 'Adding a string to a Path with +',
      wrong: { code: py`from pathlib import Path

backup = Path("data/scores.csv") + ".bak"   # TypeError`, lang: 'python', static: true },
      right: { code: py`from pathlib import Path

src = Path("data/scores.csv")
backup = src.with_name(src.name + ".bak")   # data/scores.csv.bak
other = src.with_suffix(".json")            # data/scores.json`, lang: 'python' },
      explanation: py`Paths support \`/\`, not \`+\`: \`TypeError: unsupported operand type(s) for +: 'PosixPath' and 'str'\`. Use \`with_name\`, \`with_stem\` or \`with_suffix\` to change part of a name.`,
    },
    {
      title: 'Getting the extension with split(".")',
      wrong: { code: py`name = "archive.tar.gz"
ext = name.split(".")[1]          # 'tar' — wrong
hidden = ".bashrc".split(".")[1]  # 'bashrc' — it has no extension at all`, lang: 'python' },
      right: { code: py`from pathlib import Path

print(Path("archive.tar.gz").suffix)     # .gz
print(Path("archive.tar.gz").suffixes)   # ['.tar', '.gz']
print(repr(Path(".bashrc").suffix))      # ''`, lang: 'python' },
      explanation: py`File names can contain many dots, or start with one. pathlib already implements the rules; \`.suffix\` is the last extension including the dot.`,
    },
    {
      title: 'mkdir without parents=True / exist_ok=True',
      wrong: { code: py`from pathlib import Path

Path("exports/2026/march").mkdir()   # FileNotFoundError if exports/2026 is missing,
                                     # FileExistsError on the second run`, lang: 'python', static: true },
      right: { code: py`from pathlib import Path

Path("exports/2026/march").mkdir(parents=True, exist_ok=True)`, lang: 'python' },
      explanation: py`Plain \`mkdir()\` creates exactly one folder, and only if it doesn't exist yet. For "make sure this folder exists", pass both flags.`,
    },
    {
      title: 'Assuming paths are relative to the script',
      wrong: { code: py`from pathlib import Path

settings = Path("settings.json").read_text(encoding="utf-8")
# works with "cd myapp; python app.py", fails with "python myapp/app.py"`, lang: 'python', static: true },
      right: { code: py`from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
settings = (BASE_DIR / "settings.json").read_text(encoding="utf-8")`, lang: 'python', static: true },
      explanation: py`Relative paths start at the current working directory, which is wherever the program was launched from. \`__file__\` is the script's own path, so anchoring to it works from anywhere.`,
    },
    {
      title: 'Checking containment without resolving',
      wrong: { code: py`from pathlib import Path

base = Path("/srv/files")
target = base / "../secret.txt"
print(target.is_relative_to(base))   # True — but it points OUTSIDE /srv/files!`, lang: 'python' },
      right: { code: py`from pathlib import Path

base = Path("/srv/files").resolve()
target = (base / "../secret.txt").resolve()
print(target.is_relative_to(base))   # False`, lang: 'python' },
      explanation: py`\`is_relative_to\` and \`relative_to\` compare path **text**; they don't know what \`..\` means. Resolve both sides first.`,
    },
  ],
  debugging: [
    {
      symptom: py`FileNotFoundError: [Errno 2] No such file or directory: 'data/scores.csv'`,
      cause: py`A relative path was resolved from a different working directory than you expected, or a parent folder is missing (for writes).`,
      fix: py`Print \`Path.cwd()\` and \`path.resolve()\` to see where Python is really looking. Anchor paths with \`Path(__file__).resolve().parent\`; create folders with \`mkdir(parents=True, exist_ok=True)\` before writing.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'PosixPath' and 'str'`,
      cause: py`You used \`+\` to extend a Path.`,
      fix: py`Join with \`/\` (\`folder / "file.txt"\`) or rename with \`with_name\` / \`with_suffix\`. If you really need a string, \`str(path) + "..."\`.`,
    },
    {
      symptom: py`FileExistsError: [Errno 17] File exists: 'reports'`,
      cause: py`\`mkdir()\` was called on a folder that already exists (common on the second run).`,
      fix: py`Use \`mkdir(exist_ok=True)\` (plus \`parents=True\` for nested folders).`,
    },
    {
      symptom: py`OSError: [Errno 39] Directory not empty: 'old_reports'`,
      cause: py`\`rmdir()\` only removes **empty** folders.`,
      fix: py`Delete the contents first, or use \`shutil.rmtree(path)\` — after double-checking the path, because it deletes everything below it.`,
    },
    {
      symptom: py`ValueError: 'notes/maths.txt' is not in the subpath of 'reports'`,
      cause: py`\`relative_to()\` was given a base that the path doesn't start with (it compares the text of the paths).`,
      fix: py`Check with \`is_relative_to()\` first, make both paths absolute with \`resolve()\`, or use \`os.path.relpath\` if you want a \`../\`-style relative path (\`relative_to(..., walk_up=True)\` does this since 3.12).`,
    },
    {
      symptom: py`The program finds files in a different order on another machine (or a test passes locally and fails in CI).`,
      cause: py`\`iterdir()\`, \`glob()\` and \`rglob()\` don't promise any order.`,
      fix: py`Wrap them in \`sorted()\` wherever order matters.`,
    },
  ],
  bestPractices: [
    'Use pathlib.Path for new code; reach for os.path only when maintaining older code.',
    'Join with the / operator, never with + or f-strings.',
    'Anchor a script\'s own data files with Path(__file__).resolve().parent instead of relying on the working directory.',
    'Pass encoding="utf-8" to read_text() and write_text().',
    'Use mkdir(parents=True, exist_ok=True) for "make sure this folder exists".',
    'Sort the results of iterdir(), glob() and rglob() whenever order matters.',
    'Resolve user-supplied paths and check is_relative_to(base) before using them.',
    'Keep paths as Path objects inside your program; convert with str() only at the edge, for libraries that need strings.',
  ],
  useCases: [
    'Finding all files of a type in a project (every .csv in a data folder, every .py file in a repo).',
    'Building output paths for reports and exports, creating folders as needed.',
    'Renaming or reorganising files in bulk (by date, by extension, by name pattern).',
    'Locating config and data files relative to a script or package.',
    'Validating file names that come from users or uploads.',
  ],
  comparison: {
    title: 'os.path vs pathlib, task by task',
    headers: ['task', 'os / os.path / glob (strings)', 'pathlib (objects)'],
    rows: [
      ['join', 'os.path.join("data", "2026", "a.csv")', 'Path("data") / "2026" / "a.csv"'],
      ['file name', 'os.path.basename(p)', 'p.name'],
      ['name without extension', 'os.path.splitext(os.path.basename(p))[0]', 'p.stem'],
      ['extension', 'os.path.splitext(p)[1]', 'p.suffix'],
      ['parent folder', 'os.path.dirname(p)', 'p.parent'],
      ['exists / is file / is folder', 'os.path.exists(p) / isfile / isdir', 'p.exists() / p.is_file() / p.is_dir()'],
      ['absolute path', 'os.path.abspath(p)', 'p.resolve()'],
      ['read a small text file', 'with open(p, encoding="utf-8") as f: f.read()', 'p.read_text(encoding="utf-8")'],
      ['list a folder', 'os.listdir(d)', 'd.iterdir()'],
      ['find files recursively', 'glob.glob("d/**/*.py", recursive=True)', 'd.rglob("*.py")'],
      ['create folders', 'os.makedirs(d, exist_ok=True)', 'd.mkdir(parents=True, exist_ok=True)'],
      ['delete a file', 'os.remove(p)', 'p.unlink()'],
      ['walk a tree', 'os.walk(d)', 'd.walk() (3.12+)'],
    ],
    note: py`Both work, and they interoperate: \`os.path\` functions accept Path objects, and \`Path(...)\` accepts strings. pathlib wins on readability, keeps related operations together and makes paths a distinct type — so a function signature like \`def load(path: Path)\` tells readers exactly what it wants.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'pathlib-q1',
      type: 'mcq',
      prompt: py`What is \`Path("data") / "2026" / "sales.csv"\`?`,
      options: [
        { text: 'The string "data/2026/sales.csv"', why: 'The result is a Path object, not a str. str() of it gives the text form.' },
        'A Path object for data/2026/sales.csv (shown as data\\2026\\sales.csv on Windows)',
        { text: 'A TypeError, because you cannot divide strings', why: 'Path defines __truediv__, so / between a Path and a str means "join".' },
        { text: 'The contents of sales.csv', why: 'Building a path never reads anything; read_text() would do that.' },
      ],
      answer: 1,
      explanation: py`\`/\` joins path components and returns a new Path, using the separator of the current OS. No file needs to exist for this to work.`,
    },
    {
      id: 'pathlib-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from pathlib import Path

p = Path("photos/holiday.beach.jpg")
print(p.name, p.stem, p.suffix)`,
      answer: 'holiday.beach.jpg holiday.beach .jpg',
      explanation: py`\`.name\` is the last component. \`.suffix\` is only the **final** extension, \`.jpg\`, and \`.stem\` is the name with just that suffix removed — so the inner dot stays in the stem.`,
    },
    {
      id: 'pathlib-q3',
      type: 'output',
      prompt: 'On Linux, what does this print?',
      code: py`from pathlib import Path

base = Path("/srv/site")
print(base / "/etc/passwd")`,
      options: [
        { text: '/srv/site/etc/passwd', why: 'That is what string concatenation would give. With pathlib, an absolute right-hand side replaces the left side.' },
        '/etc/passwd',
        { text: '/srv/site//etc/passwd', why: 'pathlib never produces doubled separators.' },
        { text: 'ValueError', why: 'Joining with an absolute path is allowed; it just restarts from the root.' },
      ],
      answer: 1,
      explanation: py`When the right-hand part is absolute, joining **starts over** from it (\`os.path.join\` behaves the same way). That's why user-supplied file names must be validated before joining — see the safe-path experiment.`,
    },
    {
      id: 'pathlib-q4',
      type: 'bug',
      prompt: 'On a fresh machine this crashes with `FileNotFoundError`. Click the line to fix.',
      code: py`from pathlib import Path

out = Path("exports") / "2026" / "march"
out.mkdir()
(out / "sales.csv").write_text("day,total\n", encoding="utf-8")`,
      answerLine: 4,
      explanation: py`\`mkdir()\` creates one folder and needs its parent to exist. \`exports/2026\` doesn't, so it fails. \`out.mkdir(parents=True, exist_ok=True)\` creates the whole chain and also survives a second run.`,
    },
    {
      id: 'pathlib-q5',
      type: 'fill',
      prompt: 'Rename every `.jpg` file in `photos` **and all its subfolders** to `.jpeg`.',
      code: py`from pathlib import Path

for path in sorted(Path("photos").___("*.jpg")):
    path.rename(path.___(".jpeg"))`,
      answer: [['rglob'], ['with_suffix']],
      explanation: py`\`rglob\` searches recursively (\`glob("**/*.jpg")\` would also work). \`with_suffix\` returns a new Path with the extension swapped, which \`rename\` moves the file to. The results are sorted into a list first, so renaming doesn't disturb the search while it's running.`,
    },
    {
      id: 'pathlib-q6',
      type: 'mcq',
      prompt: py`A web app serves files from \`BASE = Path("/srv/files")\` using a \`name\` typed by the user. Which check reliably stops \`name\` from escaping that folder?`,
      options: [
        { text: '(BASE / name).is_relative_to(BASE)', why: 'Lexical only: BASE / "../secret" still starts with /srv/files as text, so it passes.' },
        { text: '".." not in name', why: 'Misses absolute names like "/etc/passwd" and symlinks inside the folder that point elsewhere.' },
        '(BASE / name).resolve().is_relative_to(BASE.resolve())',
        { text: '(BASE / name).exists()', why: 'Existence says nothing about where the file is; /etc/passwd exists too.' },
      ],
      answer: 2,
      explanation: py`\`resolve()\` makes the path absolute, collapses \`..\` and follows symlinks, so the containment check runs on the real location. Absolute names are caught too, because joining with them replaces \`BASE\`.`,
    },
    {
      id: 'pathlib-q7',
      type: 'short',
      prompt: 'A script reads `Path("config.json")`. It works when you run it from its own folder but fails from a cron job. Why, and how do you fix it?',
      answer: py`Relative paths are resolved from the **current working directory**, which is wherever the program was started from — a cron job usually starts in the home folder, not the script's folder, so \`config.json\` isn't found there. Fix: build the path from the script's location, \`Path(__file__).resolve().parent / "config.json"\` (or take the path as a command-line argument).`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'count-by-suffix',
      title: 'What kinds of files are in here?',
      difficulty: 'intermediate',
      prompt: py`Write \`count_by_suffix(folder)\` that returns a **dict** counting the files under \`folder\` **at any depth**, keyed by their **lower-case** suffix (\`"notes.TXT"\` counts as \`".txt"\`).

- Only count files — skip folders (even ones with a dot in their name).
- Files with no suffix are counted under the key \`"(none)"\`.
- \`folder\` may be a string or a Path.

For the project's \`notes\` folder the result is \`{".txt": 3, ".md": 2}\`.`,
      files: {
        'main.py': py`from pathlib import Path


def count_by_suffix(folder):
    """Return {suffix: number of files} for every file under folder."""
    counts = {}
    # TODO: walk the whole tree with rglob and count the files
    return counts


print(count_by_suffix("notes"))
`,
        ...NOTE_FILES,
      },
      hints: [
        'Path(folder).rglob("*") yields every file AND folder below folder; filter with is_file().',
        'The key is path.suffix.lower(), or "(none)" when the suffix is the empty string.',
        'for path in Path(folder).rglob("*"):\n    if path.is_file():\n        key = path.suffix.lower() or "(none)"\n        counts[key] = counts.get(key, 0) + 1',
      ],
      solution: {
        explanation: py`\`Path(folder)\` accepts both strings and Paths, so callers can pass either. \`rglob("*")\` walks the whole tree lazily and yields folders as well as files, so \`is_file()\` filters the folders out — including a folder like \`old.d\`, whose name looks like it has a suffix. \`.suffix\` is the final extension with its dot (or \`""\`), \`.lower()\` merges \`.TXT\` and \`.txt\`, and \`or "(none)"\` swaps the empty string (which is falsy) for a readable key. \`dict.get(key, 0) + 1\` counts; [\`collections.Counter\`](lesson:collections-module) would work just as well.`,
        files: {
          'main.py': py`from pathlib import Path


def count_by_suffix(folder):
    """Return {suffix: number of files} for every file under folder."""
    counts = {}
    for path in Path(folder).rglob("*"):
        if path.is_file():
            key = path.suffix.lower() or "(none)"
            counts[key] = counts.get(key, 0) + 1
    return counts


print(count_by_suffix("notes"))
`,
          ...NOTE_FILES,
        },
      },
      tests: [
        { name: 'counts the notes folder', code: py`assert count_by_suffix("notes") == {".txt": 3, ".md": 2}` },
        { name: 'lower-cases suffixes and handles files with no suffix', code: py`from pathlib import Path
root = Path("t1")
(root / "sub").mkdir(parents=True)
for name in ["a.txt", "b.TXT", "c.md", "sub/d.txt", "sub/README"]:
    (root / name).write_text("x", encoding="utf-8")
assert count_by_suffix(root) == {".txt": 3, ".md": 1, "(none)": 1}` },
        { name: 'folders are not counted, even with a dot in the name', code: py`from pathlib import Path
root = Path("t2")
(root / "old.d").mkdir(parents=True)
(root / "old.d" / "x.json").write_text("{}", encoding="utf-8")
assert count_by_suffix(root) == {".json": 1}` },
        { name: 'accepts a Path as well as a str', code: py`from pathlib import Path
assert count_by_suffix(Path("notes")) == count_by_suffix("notes")` },
      ],
    },
    {
      id: 'organise-inbox',
      title: 'Tidy the inbox',
      difficulty: 'intermediate',
      prompt: py`Write \`organise(folder)\` that moves every **file directly inside** \`folder\` into a subfolder named after its suffix, **lower-cased and without the dot**:

- \`inbox/plan.md\` → \`inbox/md/plan.md\`, and a file named \`NOTES.TXT\` would go to \`txt/NOTES.TXT\`
- files with no suffix go to \`inbox/other/\`
- create subfolders as needed (\`mkdir(exist_ok=True)\`); leave existing subfolders and their contents alone (don't look inside them)
- return the **number of files moved** (an \`int\`); \`folder\` may be a string or a Path.

Calling \`organise\` a second time should move \`0\` files.`,
      files: {
        'main.py': py`from pathlib import Path


def organise(folder):
    """Move files in folder into subfolders named after their suffix. Return how many moved."""
    folder = Path(folder)
    moved = 0
    # TODO: loop over the files directly inside folder (not inside subfolders)
    return moved


print(organise("inbox"), "files moved")
for path in sorted(Path("inbox").rglob("*")):
    print(path.as_posix())
`,
        ...INBOX_FILES,
      },
      hints: [
        'Collect the entries first — sorted(folder.iterdir()) — so you are not changing the folder while iterating over it. Skip anything that is not is_file().',
        'The target folder is folder / (path.suffix.lower().lstrip(".") or "other"). Create it with mkdir(exist_ok=True), then move the file with path.rename(target_dir / path.name).',
        'for path in sorted(folder.iterdir()):\n    if not path.is_file(): continue\n    sub = folder / (path.suffix.lower().lstrip(".") or "other")\n    sub.mkdir(exist_ok=True)\n    path.rename(sub / path.name)\n    moved += 1',
      ],
      solution: {
        explanation: py`\`sorted(folder.iterdir())\` takes a snapshot of the folder's direct children before anything moves — changing a folder while a lazy iterator is walking it can make the iterator skip or repeat entries. Folders (including ones created by an earlier run) are skipped with \`is_file()\`, so a second call finds nothing to move. The subfolder name comes from \`path.suffix\`: \`.lower()\` merges \`.TXT\`/\`.txt\`, \`.lstrip(".")\` drops the dot, and \`or "other"\` handles files with no suffix. \`mkdir(exist_ok=True)\` is safe to call for every file. \`rename\` moves the file within the same file system; \`replace\` would do the same but silently overwrite an existing file with that name, while \`rename\` raises \`FileExistsError\` on Windows in that case — pick deliberately.`,
        files: {
          'main.py': py`from pathlib import Path


def organise(folder):
    """Move files in folder into subfolders named after their suffix. Return how many moved."""
    folder = Path(folder)
    moved = 0
    for path in sorted(folder.iterdir()):
        if not path.is_file():
            continue
        subfolder = folder / (path.suffix.lower().lstrip(".") or "other")
        subfolder.mkdir(exist_ok=True)
        path.rename(subfolder / path.name)
        moved += 1
    return moved


print(organise("inbox"), "files moved")
for path in sorted(Path("inbox").rglob("*")):
    print(path.as_posix())
`,
          ...INBOX_FILES,
        },
      },
      tests: [
        { name: 'the project inbox is organised', code: py`from pathlib import Path
assert Path("inbox/md/plan.md").is_file()
assert Path("inbox/csv/budget.csv").is_file()
assert Path("inbox/txt/lyrics.txt").is_file()
assert not Path("inbox/plan.md").exists(), "Files should be moved, not copied"` },
        { name: 'returns the number of files moved', code: py`from pathlib import Path
box = Path("box1")
box.mkdir()
for name in ["a.txt", "b.txt", "c.json"]:
    (box / name).write_text("x", encoding="utf-8")
assert organise(box) == 3` },
        { name: 'files without a suffix go to "other"', code: py`from pathlib import Path
box = Path("box2")
box.mkdir()
(box / "README").write_text("x", encoding="utf-8")
organise(box)
assert (box / "other" / "README").is_file()` },
        { name: 'existing subfolders are left alone; a second run moves 0', code: py`from pathlib import Path
box = Path("box3")
(box / "keep").mkdir(parents=True)
(box / "keep" / "inner.txt").write_text("x", encoding="utf-8")
(box / "top.md").write_text("x", encoding="utf-8")
assert organise(box) == 1
assert (box / "keep" / "inner.txt").is_file(), "Don't move files out of existing subfolders"
assert organise(box) == 0` },
        { name: 'suffix folders are lower-case', code: py`from pathlib import Path
Path("box5").mkdir()
Path("box5/LOUD.TXT").write_text("x", encoding="utf-8")
organise("box5")
assert Path("box5/txt/LOUD.TXT").is_file(), "Use path.suffix.lower() for the folder name"` },
        { name: 'accepts a str', code: py`from pathlib import Path
Path("box4").mkdir()
Path("box4/x.log").write_text("x", encoding="utf-8")
assert organise("box4") == 1 and Path("box4/log/x.log").is_file()` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'pathlib-why-pathlib',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why is pathlib generally preferred over os.path and string manipulation for file paths?',
      answer: 'Path objects make paths a real type: you join with /, read parts as attributes (.name, .suffix, .parent), and call file-system methods (exists, read_text, glob, mkdir) on them. It is cross-platform by construction and reads more clearly than nested os.path calls.',
      explanation: py`With strings, joining needs \`os.path.join\`, parts need \`os.path.splitext(os.path.basename(p))\`, listing needs \`os\` or \`glob\`, and nothing stops you mixing up a path with any other string. pathlib groups all of that on one object, handles separators per OS, and interoperates with everything that accepts \`os.PathLike\`.`,
      code: { lang: 'python', code: py`import os.path
from pathlib import Path

old = os.path.splitext(os.path.basename("/data/2026/sales.csv"))[0]
new = Path("/data/2026/sales.csv").stem
print(old == new)   # True — same result, very different readability` },
      whyAsked: 'Shows whether you write modern, idiomatic Python and understand cross-platform pitfalls.',
      mistakes: ['Claiming os.path is deprecated (it is not)', 'Saying pathlib is faster (it is about clarity and correctness, not speed)', 'Not knowing that open() and most of the stdlib accept Path objects'],
      followUps: ['When might you still use os.path?', 'What is os.PathLike / __fspath__?', 'How do you get a str from a Path for a library that needs one?'],
      modelAnswer: 'pathlib represents paths as objects instead of strings. I join with the slash operator, read components as attributes like name, stem, suffix and parent, and call file-system operations such as exists, read_text, glob and mkdir directly on the path. That keeps related operations in one place, it handles Windows versus POSIX separators automatically, and the type itself documents that a variable is a path. os.path is not deprecated and still works — the two interoperate through the os.PathLike protocol — but for new code pathlib is clearer and harder to get wrong.',
    },
    {
      id: 'pathlib-path-quirks',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'On Linux, what do the two print calls show?',
      code: { lang: 'python', code: py`from pathlib import Path

p = Path("backups") / "2026" / "db.tar.gz"
print(p.stem, p.suffix, p.suffixes)
print(Path("/srv/app") / "/etc/passwd")` },
      options: [
        "db .tar.gz ['.tar.gz']  and  /srv/app/etc/passwd",
        "db.tar .gz ['.tar', '.gz']  and  /etc/passwd",
        "db.tar .gz ['.tar', '.gz']  and  /srv/app/etc/passwd",
        "db .gz ['.gz']  and  /etc/passwd",
      ],
      correctOption: 1,
      answer: "`db.tar .gz ['.tar', '.gz']` then `/etc/passwd`. Only the last suffix is the suffix; joining with an absolute path discards the left side.",
      explanation: py`\`.suffix\` and \`.stem\` split on the **last** dot; \`.suffixes\` lists them all. When the right operand of \`/\` is absolute, pathlib (like \`os.path.join\`) starts again from it — the root cause of many path-traversal bugs when a user-supplied name begins with \`/\`.`,
      whyAsked: 'Two real gotchas: multi-part extensions and absolute-path joining, the second being security-relevant.',
      mistakes: ['Expecting .suffix to be ".tar.gz"', 'Expecting / to always append'],
      followUps: ['How would you strip all suffixes?', 'How do you safely join a user-supplied file name to a base folder?'],
      modelAnswer: 'The first line prints db.tar, .gz and the list [".tar", ".gz"]: stem and suffix split on the last dot only, and suffixes gives all of them. The second prints /etc/passwd, because when the right-hand side of the slash is absolute, pathlib discards the left side, just like os.path.join. That second behaviour matters for security: if I join a user-supplied name to an upload folder, a name starting with a slash escapes the folder, so I always resolve the result and check is_relative_to the base.',
    },
    {
      id: 'pathlib-script-relative',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A data script reads `open("data/prices.csv")`. It passes on your laptop but in production (run by a scheduler) it raises `FileNotFoundError: [Errno 2] No such file or directory: \'data/prices.csv\'`, although the file is deployed next to the script. Diagnose and fix.',
      answer: 'Relative paths are resolved from the process\'s current working directory, not the script\'s folder; the scheduler starts the process elsewhere. Anchor to the script: Path(__file__).resolve().parent / "data" / "prices.csv", or pass the path in via configuration.',
      explanation: py`Locally you happen to run it from the project folder, so the cwd matches. Schedulers, services, IDEs and test runners often use a different cwd (home, \`/\`, the repo root). Logging \`Path.cwd()\` confirms it. For files that ship inside an installed package, \`importlib.resources.files("mypkg") / "data" / "prices.csv"\` is the robust choice.`,
      code: { lang: 'python', code: py`from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PRICES = BASE_DIR / "data" / "prices.csv"` },
      whyAsked: '"Works on my machine" path bugs are extremely common in deployment; this checks you know what relative paths are relative to.',
      mistakes: ['Hard-coding an absolute path from your laptop', 'Calling os.chdir() at the top of the script as a "fix"', 'Assuming relative means relative to the script'],
      followUps: ['What is __file__ when code runs from a zip or an installed package?', 'How does importlib.resources help?', 'Why is os.chdir() in library code a bad idea?'],
      modelAnswer: 'The path is relative, and relative paths are resolved from the current working directory of the process, not from where the script lives. On my laptop I launch it from the project folder so it works; the scheduler starts it somewhere else, so data/prices.csv does not exist relative to that directory. I would confirm by logging Path.cwd(), then anchor the path to the script with Path(__file__).resolve().parent / "data" / "prices.csv", or make the location configurable. If the data ships inside an installed package, I would use importlib.resources instead. I would avoid os.chdir, because changing global process state surprises other code.',
    },
    {
      id: 'pathlib-duplicate-names',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `duplicate_names(folder)` that returns a sorted list of file names that occur **more than once** anywhere under `folder` (in different subfolders). Folders don\'t count.',
      answer: 'Count path.name for every file from folder.rglob("*") with a Counter, then return sorted names whose count is greater than 1.',
      explanation: py`\`rglob("*")\` streams every entry in the tree; \`is_file()\` drops folders; \`.name\` is the part that can collide across folders. A \`Counter\` tallies in one pass. To report *where* the duplicates are, group with a \`defaultdict(list)\` of paths instead.`,
      starter: {
        files: {
          'main.py': py`from collections import Counter
from pathlib import Path


def duplicate_names(folder):
    """Return the sorted file names that appear more than once under folder."""
    # TODO
    return []


print(duplicate_names("photos"))
`,
          'photos/2025/beach.txt': py`sand
`,
          'photos/2025/party.txt': py`cake
`,
          'photos/2026/beach.txt': py`more sand
`,
          'photos/2026/hike.txt': py`hills
`,
          'photos/best/party.txt': py`best cake
`,
        },
      },
      tests: [
        { name: 'finds beach.txt and party.txt', code: py`assert duplicate_names("photos") == ["beach.txt", "party.txt"]` },
        { name: 'no duplicates gives []', code: py`from pathlib import Path
Path("solo/a").mkdir(parents=True)
Path("solo/a/x.txt").write_text("1", encoding="utf-8")
Path("solo/y.txt").write_text("2", encoding="utf-8")
assert duplicate_names("solo") == []` },
        { name: 'folders with the same name are not counted', code: py`from pathlib import Path
Path("dirs/a/data").mkdir(parents=True)
Path("dirs/b/data").mkdir(parents=True)
assert duplicate_names("dirs") == []` },
      ],
      solution: {
        files: {
          'main.py': py`from collections import Counter
from pathlib import Path


def duplicate_names(folder):
    """Return the sorted file names that appear more than once under folder."""
    counts = Counter(p.name for p in Path(folder).rglob("*") if p.is_file())
    return sorted(name for name, n in counts.items() if n > 1)


print(duplicate_names("photos"))
`,
          'photos/2025/beach.txt': py`sand
`,
          'photos/2025/party.txt': py`cake
`,
          'photos/2026/beach.txt': py`more sand
`,
          'photos/2026/hike.txt': py`hills
`,
          'photos/best/party.txt': py`best cake
`,
        },
      },
      hints: ['rglob("*") visits everything below the folder; filter with is_file().', 'collections.Counter(...) of the names, then keep those with a count above 1.'],
      whyAsked: 'A realistic file-system task that combines tree traversal, filtering and counting in idiomatic Python.',
      mistakes: ['Using iterdir() and missing nested folders', 'Counting folders too', 'Returning names in arbitrary order'],
      followUps: ['How would you find files with identical content instead of identical names? (group by size, then hash with hashlib)', 'How would you return the paths of each duplicate?'],
      modelAnswer: 'I would walk the tree with Path(folder).rglob("*"), keep only entries where is_file() is true, and feed their .name into a collections.Counter. Then I return the sorted names whose count is greater than one. It is a single lazy pass over the tree. If the requirement were identical content rather than identical names, I would group candidates by file size first and then compare hashes from hashlib, which avoids hashing every file.',
    },
    {
      id: 'pathlib-resolve-vs-absolute',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `Path.absolute()`, `Path.resolve()` and `os.path.abspath()`. Which would you use to check that a path stays inside a base folder?',
      answer: 'absolute() only prefixes the cwd (keeps ".." and symlinks); os.path.abspath() prefixes the cwd and collapses ".." textually (ignores symlinks); resolve() makes the path absolute, follows symlinks and removes "..". For containment checks use resolve() on both sides.',
      explanation: py`Textual normalisation can be wrong when symlinks are involved: if \`a\` is a symlink to \`/x/y\`, then \`a/..\` is really \`/x\`, not the current folder. Only \`resolve()\` asks the file system. By default \`resolve()\` is non-strict — missing components are allowed — while \`resolve(strict=True)\` raises \`FileNotFoundError\`. Security checks must resolve **both** the base and the target, otherwise a symlinked base folder makes every comparison fail (or pass) for the wrong reason.`,
      code: { lang: 'python', code: py`import os
from pathlib import Path

p = Path("notes/../main.py")
print(p.absolute())        # /home/pyodide/project/notes/../main.py
print(os.path.abspath(p))  # /home/pyodide/project/main.py   (textual)
print(p.resolve())         # /home/pyodide/project/main.py   (asks the file system)` },
      whyAsked: 'Probes precise knowledge of path normalisation, which matters for security checks and for comparing paths.',
      mistakes: ['Thinking absolute() removes ".."', 'Using textual normalisation for security checks', 'Resolving only the target, not the base'],
      followUps: ['What does resolve(strict=True) change?', 'Why do symlinks make ".." ambiguous?', 'How would you compare two paths for "same file"? (Path.samefile / os.path.samefile)'],
      modelAnswer: 'absolute() just puts the current working directory in front and leaves dot-dot and symlinks alone. os.path.abspath also prefixes the cwd but then collapses dot-dot purely as text, which can be wrong when a symlink is involved, because a-slash-dot-dot is not necessarily the folder containing a. resolve() asks the file system: it makes the path absolute, follows symlinks and removes dot-dot correctly. For a containment check I resolve both the base and the candidate path and then use is_relative_to. If the file must already exist I pass strict=True so a missing path raises immediately.',
    },
    {
      id: 'pathlib-safe-uploads',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your API saves uploaded files using the client-provided file name: `UPLOAD_DIR / filename`. A security review flags it. What can go wrong, and how do you fix it?',
      answer: 'Path traversal and overwrites: names like "../../app/settings.py" or "/etc/cron.d/x" escape the folder; existing files can be overwritten; odd names (empty, ".", reserved Windows names, very long) cause errors. Generate your own storage name (e.g. a UUID), keep the original only as metadata, and if you must use it, sanitise to a base name, resolve and check is_relative_to(UPLOAD_DIR.resolve()), and create with mode "x".',
      explanation: py`Joining with an absolute name replaces the base; \`..\` climbs out of it. Symlinks inside the upload folder can redirect writes too. The most robust design never uses the client name as a path at all: store under \`uuid4().hex\` plus a validated extension, and record the display name in a database. Defence in depth: \`Path(filename).name\` strips directory parts, the resolve-and-contain check guards the final path, \`open(target, "xb")\` refuses to overwrite, and the process runs with minimal file-system permissions. See [injection attacks](lesson:injection-attacks) and [input validation](lesson:input-validation).`,
      code: { lang: 'python', code: py`import uuid
from pathlib import Path

UPLOAD_DIR = Path("uploads").resolve()
ALLOWED = {".png", ".jpg", ".pdf"}


def storage_path(client_name):
    suffix = Path(client_name).suffix.lower()
    if suffix not in ALLOWED:
        raise ValueError(f"file type not allowed: {suffix!r}")
    target = (UPLOAD_DIR / f"{uuid.uuid4().hex}{suffix}").resolve()
    if not target.is_relative_to(UPLOAD_DIR):     # defence in depth
        raise ValueError("unsafe path")
    return target


print(storage_path("../../holiday.PNG").parent == UPLOAD_DIR)   # True` },
      whyAsked: 'Path traversal is a classic vulnerability (OWASP); interviewers want to see layered, practical defences.',
      mistakes: ['Only stripping "../" with replace() (bypassable, misses absolute paths)', 'Checking containment without resolve()', 'Trusting the client-supplied extension or content type'],
      followUps: ['How do symlinks affect this?', 'Why prefer generated names over sanitised client names?', 'What other limits would you put on uploads? (size, count, content sniffing)'],
      modelAnswer: 'Using the client name as a path allows path traversal: a name with dot-dot segments climbs out of the upload folder, and an absolute name replaces the base entirely, so an attacker could overwrite application files. It also allows overwriting other users\' uploads. My preferred fix is to never use the client name as a path: generate a UUID-based file name, keep only a validated extension, and store the original name as metadata. As defence in depth I resolve the final path and check it is_relative_to the resolved upload folder, open it with mode "x" so nothing is overwritten, and run the service with minimal file-system permissions.',
    },
    {
      id: 'pathlib-pure-paths',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between `PurePath` and `Path`, and when would you use `PureWindowsPath` on a Linux server?',
      answer: 'Pure paths only do path arithmetic and never touch the file system; concrete Paths add I/O methods. PureWindowsPath lets Linux code parse or build Windows paths — e.g. paths from a Windows client, a config file or a database — with correct drive and separator rules.',
      explanation: py`\`Path()\` instantiates \`PosixPath\` or \`WindowsPath\` for the running OS; you can't instantiate \`WindowsPath\` on Linux because its I/O wouldn't make sense there. \`PurePosixPath\` / \`PureWindowsPath\` work everywhere. They're also handy in tests or tooling that compute paths without touching disk, e.g. generating archive member names (always POSIX-style) with \`PurePosixPath\`.`,
      code: { lang: 'python', code: py`from pathlib import PurePosixPath, PureWindowsPath

client = PureWindowsPath(r"C:\Users\ada\Documents\report.docx")
print(client.name, client.drive)                 # report.docx C:
print(PurePosixPath("exports") / client.name)    # exports/report.docx` },
      whyAsked: 'Checks deeper understanding of pathlib\'s design and of cross-platform data handling.',
      mistakes: ['Thinking Path is always POSIX', 'Trying to do I/O with a pure path', 'Parsing Windows paths on Linux with str.split("/")'],
      followUps: ['Why can\'t you create a WindowsPath on Linux?', 'Which separator do zip archive member names use?'],
      modelAnswer: 'pathlib has pure paths, which only do path arithmetic — joining, splitting, comparing — and concrete paths, which add file-system methods like exists and read_text. Path gives me the concrete class for the current OS. On a Linux server I would use PureWindowsPath whenever I receive or must generate Windows-style paths, for example a path a Windows client reported or one stored in a database, because it applies Windows rules for drives, backslashes and case-insensitive comparison. Likewise PurePosixPath is useful for formats that always use forward slashes, like archive member names or URL paths.',
    },
  ],

  takeaways: [
    'A Path is an immutable description of a location; creating or joining Paths never touches the disk.',
    'Join with / ; read parts with .name, .stem, .suffix, .suffixes, .parent, .parts ; change them with with_name / with_stem / with_suffix.',
    'Relative paths start at the current working directory — anchor script files with Path(__file__).resolve().parent.',
    'read_text / write_text (with encoding="utf-8") for small files; path.open() or open(path) for streaming.',
    'iterdir lists, glob matches, rglob matches at any depth — sort the results when order matters.',
    'mkdir(parents=True, exist_ok=True) is the safe "make sure this folder exists".',
    'resolve() before checking is_relative_to() — otherwise "..", symlinks and absolute names can escape your folder.',
  ],
}
