// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const STUDY_LOG = py`# Study log: read a text file, summarise it, write a report
LOG_PATH = "study_log.txt"
REPORT_PATH = "report.txt"


def load_totals(path):
    """Return {subject: total minutes} read from a log file."""
    totals = {}
    with open(path, encoding="utf-8") as log:
        for line in log:                      # one line at a time
            line = line.strip()               # drop spaces and the "\n"
            if not line or line.startswith("#"):
                continue                      # skip blanks and comments
            date, subject, minutes = line.split()
            totals[subject] = totals.get(subject, 0) + int(minutes)
    return totals


def write_report(totals, path):
    with open(path, "w", encoding="utf-8") as report:   # "w" empties the file first
        report.write("Study report\n")
        for subject, minutes in sorted(totals.items()):
            report.write(f"{subject}: {minutes} min\n")


totals = load_totals(LOG_PATH)
write_report(totals, REPORT_PATH)

with open(REPORT_PATH, encoding="utf-8") as report:
    print(report.read(), end="")

with open(REPORT_PATH, "rb") as raw:      # binary mode: bytes, not str
    data = raw.read()
print("report.txt holds", len(data), "bytes; starts with", data[:12])
`

const STUDY_LOG_DATA = py`# date subject minutes
2026-10-01 maths 45
2026-10-01 history 30
2026-10-02 maths 25
2026-10-03 physics 50
2026-10-03 history 20
`

export default {
  id: 'reading-writing-files',
  title: 'Reading & writing files with open()',
  summary: 'open() gives you a file object to read or write text and bytes — use it inside a with block, always say encoding="utf-8", and save important files safely.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['for-loops', 'string-methods', 'try-except'],
  related: ['pathlib', 'context-managers', 'unicode-and-bytes', 'json-data', 'csv-data', 'serialization', 'error-handling-patterns', 'lazy-evaluation', 'project-expense-tracker', 'project-log-analyzer'],
  tags: ['files', 'open', 'with', 'read', 'write', 'append', 'readline', 'readlines', 'writelines', 'encoding', 'utf-8', 'newline', 'binary mode', 'bytes', 'FileNotFoundError', 'PermissionError', 'os.replace', 'atomic write', 'tempfile', 'file modes'],
  apis: [
    { name: 'open(file, mode="r", encoding=None, newline=None)', summary: 'Opens a file and returns a file object: text (str) by default, bytes with "b" in the mode.' },
    { name: 'file.read(size=-1)', summary: 'Reads the rest of the file (or up to size characters/bytes). Returns "" / b"" at the end.' },
    { name: 'file.readline()', summary: 'Reads one line including its "\\n". Returns "" only at the end of the file.' },
    { name: 'file.readlines()', summary: 'Reads every remaining line into a list (each still ends with "\\n").' },
    { name: 'for line in file', summary: 'Iterates lazily, one line at a time — the memory-friendly way to read text files.' },
    { name: 'file.write(s)', summary: 'Writes a str (text mode) or bytes (binary mode) and returns how many characters/bytes were written. Adds no newline.' },
    { name: 'file.writelines(lines)', summary: 'Writes every string in an iterable, one after another — without adding newlines.' },
    { name: 'os.replace(src, dst)', summary: 'Renames src to dst, replacing dst if it exists. Atomic when it succeeds on POSIX — the basis of safe saves.' },
    { name: 'tempfile.NamedTemporaryFile / mkstemp', summary: 'Creates a uniquely named temporary file, e.g. next to the file you want to replace.' },
  ],
  docs: [
    { label: 'Tutorial — reading and writing files', url: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files' },
    { label: 'Built-in functions — open()', url: 'https://docs.python.org/3/library/functions.html#open' },
    { label: 'io — core tools for working with streams', url: 'https://docs.python.org/3/library/io.html' },
    { label: 'os.replace()', url: 'https://docs.python.org/3/library/os.html#os.replace' },
    { label: 'tempfile — temporary files', url: 'https://docs.python.org/3/library/tempfile.html' },
    { label: 'PEP 686 — make UTF-8 mode the default', url: 'https://peps.python.org/pep-0686/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **file** is a named chunk of data stored on a disk. Unlike your variables, which vanish the moment your program stops, a file is still there tomorrow. Saved games, settings, logs, photos and spreadsheets are all files.`,
    py`Python talks to files through one built-in function, \`open()\`. It returns a **file object** — a handle that remembers which file you opened, what you are allowed to do with it (the **mode**), and where you are in it (a bit like a cursor in a text editor).`,
    { code: py`with open("diary.txt", "w", encoding="utf-8") as diary:
    diary.write("Dear diary, today I learned open().\n")

with open("diary.txt", encoding="utf-8") as diary:
    print(diary.read())`, lang: 'python', title: 'write a file, then read it back' },
    py`Three habits make file code correct almost everywhere: open files in a \`with\` block so they are always closed, pass \`encoding="utf-8"\` for text, and read big files **line by line** instead of all at once. Later in this level you'll meet [pathlib](lesson:pathlib) for building paths, and [JSON](lesson:json-data) and [CSV](lesson:csv-data) for structured data — all of them sit on top of what you learn here.`,
  ],
  why: [
    py`Programs need **memory that survives**. A to-do app that forgets your list when you close it is useless. Writing to a file is the simplest way to keep data between runs.`,
    py`Files are also how programs **talk to each other**. A spreadsheet exports a CSV, your script reads it; your script writes a log, a monitoring tool reads that. Almost every real program reads or writes files somewhere.`,
    py`And files are where subtle bugs hide: a missing \`encoding\` that works on your laptop but crashes on a colleague's Windows machine, a \`"w"\` that silently wipes yesterday's data, a crash halfway through a save that leaves a corrupt settings file. This lesson shows the habits that prevent all three.`,
  ],
  eli15: [
    py`Think of a file as a **notebook in a locker**. Your program can't use the notebook while it's locked away, so it calls \`open()\` to take it out.`,
    py`When you take it out you say *what you'll do with it*: just read it (\`"r"\`), rip out every page and start fresh (\`"w"\`), or only add new pages at the back (\`"a"\`). That choice is the **mode**.`,
    py`The \`with\` block is a rule that says "when I'm done — even if something goes wrong — put the notebook back". And \`encoding="utf-8"\` is agreeing which alphabet the notebook is written in, so letters like é or 😀 come out right instead of as gibberish.`,
  ],
  analogy: {
    title: 'Borrowing a notebook from the school office',
    body: [
      py`At school, shared notebooks live in the office. To use one you fill in a slip: *which notebook* and *what for* — reading only, starting it over, or adding notes at the end. The office hands it over with a bookmark at the right page.`,
      py`You read or write, moving the bookmark as you go. When you leave, the notebook must go back to the office — otherwise nobody else can use it and the last page you wrote might never be filed. A good office has a rule: **whatever happens, the notebook is returned when you leave the room** — even if the fire alarm goes off. That rule is Python's \`with\` statement.`,
    ],
    mapping: [
      ['the notebook in the office', 'a file on disk'],
      ['the slip you fill in', 'open("notes.txt", "a", encoding="utf-8")'],
      ['"reading only" / "start over" / "add at the end"', 'modes "r", "w", "a"'],
      ['the notebook in your hands', 'the file object'],
      ['the bookmark', 'the current position (f.tell())'],
      ['returning it automatically, even during a fire alarm', 'with closes the file, even if an exception is raised'],
      ['agreeing which alphabet it is written in', 'encoding="utf-8"'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Write, append, then read back',
    props: {
      code: py`with open("todo.txt", "w", encoding="utf-8") as f:
    f.write("buy milk\n")
    f.write("walk dog\n")

with open("todo.txt", "a", encoding="utf-8") as f:
    f.write("call gran\n")

with open("todo.txt", encoding="utf-8") as f:
    first = f.readline()
    rest = f.readlines()

print(repr(first))
print(rest)
print("closed?", f.closed)
`,
      notes: {
        1: '`"w"` creates the file (or empties an existing one) and gives back a file object named `f`.',
        2: '`write()` adds exactly what you give it. The `\\n` at the end is what makes a new line — `write()` never adds one for you.',
        5: '`"a"` (append) keeps what is there and moves the position to the end before every write.',
        8: 'No mode means `"r"`: read text. The position starts at 0, the very beginning.',
        9: '`readline()` reads up to and including the next `\\n`, and moves the position past it.',
        10: '`readlines()` reads **the rest** — from where `readline()` stopped — into a list.',
        14: 'Leaving the `with` block closed the file. The name `f` still exists, but the file object is closed.',
      },
    },
    alt: 'A step-by-step trace. The first with block writes two lines to todo.txt in w mode. The second with block appends a third line in a mode. The third with block reads: readline returns the string buy milk with a newline, and readlines returns a list of the two remaining lines. The program prints the first line with repr, the list of the rest, and closed? True.',
    caption: py`Step with ▶ and watch \`first\` and \`rest\`. Notice that \`readlines()\` doesn't start again from the top: a file object has **one** position that every read moves forward.`,
  },
  syntax: [
    py`#### open()`,
    { code: py`with open(path, mode="r", encoding="utf-8", newline=None) as f:
    ...   # use f here; it is closed automatically afterwards`, lang: 'python', title: 'the shape you will write 95% of the time' },
    py`- \`path\` — the file's name or path, as a string or a [Path](lesson:pathlib). A relative path like \`"notes.txt"\` is looked up in the **current working directory** (the folder the program was started from), *not* the folder your script lives in.
- \`mode\` — what you want to do (table below). Default \`"r"\`: read text.
- \`encoding\` — how characters are turned into bytes. Always pass it for text files; \`"utf-8"\` is the right choice unless you know otherwise.
- \`newline\` — controls line-ending translation. Leave it alone except for the [csv module](lesson:csv-data), which wants \`newline=""\`.`,
    py`#### Modes`,
    py`| mode | meaning | file missing? | existing content |
|---|---|---|---|
| \`"r"\` | read (default) | \`FileNotFoundError\` | kept |
| \`"w"\` | write | created | **erased first** |
| \`"a"\` | append: every write goes to the end | created | kept |
| \`"x"\` | exclusive create | created | \`FileExistsError\` if it exists |
| \`"r+"\` | read **and** write, starting at the beginning | \`FileNotFoundError\` | kept (overwritten where you write) |
| \`"w+"\` / \`"a+"\` | like \`"w"\` / \`"a"\` but you may read too | created | erased / kept |`,
    py`Add \`"b"\` for **binary** mode (\`"rb"\`, \`"wb"\`, \`"ab"\`): you read and write \`bytes\` instead of \`str\`, and no encoding or newline translation happens. Use it for images, zip files, [pickles](lesson:serialization) and anything that isn't text. \`"t"\` (text) is the default and almost never written out.`,
    py`#### Reading`,
    { code: py`with open("notes.txt", encoding="utf-8") as f:
    whole = f.read()          # the rest of the file as one str

with open("notes.txt", encoding="utf-8") as f:
    first = f.readline()      # one line, including its "\n" ("" at the end of the file)
    others = f.readlines()    # list of the remaining lines, each ending in "\n"

with open("notes.txt", encoding="utf-8") as f:
    for line in f:            # best for big files: one line in memory at a time
        print(line.rstrip("\n"))`, lang: 'python', title: 'four ways to read text' },
    py`#### Writing`,
    { code: py`lines = ["eggs", "milk", "bread"]

with open("shopping.txt", "w", encoding="utf-8") as f:
    f.write("Shopping list\n")                    # returns the number of characters written
    f.writelines(item + "\n" for item in lines)   # adds NO newlines by itself
    print("(3 items)", file=f)                     # print() can write to a file too`, lang: 'python', title: 'three ways to write text' },
    { callout: 'warn', title: '"w" erases before you write a single character', text: py`Opening an existing file with \`"w"\` empties it **immediately** — even if your program then crashes before writing anything. Use \`"a"\` to add to a file, \`"x"\` to refuse to overwrite one, and the temp-file pattern below when replacing important data.` },
    py`#### Encodings: always say utf-8`,
    py`A text file is really bytes on disk; the **encoding** is the rulebook that turns characters into bytes and back (see [Unicode, encodings & bytes](lesson:unicode-and-bytes)). If you leave \`encoding\` out, Python uses the operating system's *locale* encoding. On Linux and macOS that is usually UTF-8, but on many Windows machines it is a legacy code page such as cp1252 — so the same script can read a file perfectly on one machine and crash, or silently produce \`cafÃ©\`, on another.`,
    { callout: 'version', title: 'UTF-8 by default is coming', text: py`Python 3.7 added **UTF-8 mode** (\`python -X utf8\` or \`PYTHONUTF8=1\`), and [PEP 686](https://peps.python.org/pep-0686/) makes it the default from **Python 3.15**. Since 3.10 you can run \`python -X warn_default_encoding\` to get an \`EncodingWarning\` everywhere you forgot \`encoding=\`. Writing \`encoding="utf-8"\` explicitly works on every version, so do it anyway.` },
    py`#### Newlines`,
    py`Windows ends lines with \`\r\n\`, Linux and macOS with \`\n\`. In text mode Python hides that: when **reading**, \`\r\n\`, \`\r\` and \`\n\` all arrive as \`"\n"\` ("universal newlines"); when **writing**, each \`"\n"\` becomes the platform's line ending. So in your code a line always ends in \`"\n"\`. Pass \`newline=""\` to switch the translation off (the csv module needs this, because it handles line endings itself).`,
    py`#### Several files at once`,
    { code: py`with open("study_log.txt", encoding="utf-8") as src, open("copy.txt", "w", encoding="utf-8") as dst:
    for line in src:
        dst.write(line)`, lang: 'python', title: 'copy a text file line by line' },
    py`For long lines you may wrap the managers in brackets — \`with (open(a) as src, open(b, "w") as dst):\` — which is official syntax since **Python 3.10**. To copy files without reading them yourself, \`shutil.copyfile(src, dst)\` does it in one call.`,
  ],
  walkthrough: {
    title: 'Reading the study-log program',
    lang: 'python',
    code: STUDY_LOG,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps in the editor. The log it reads, \`study_log.txt\`, is a second tab in the playground.`,
    steps: [
      { lines: [2, 3], text: py`File names live in constants at the top. They are **relative paths**, so Python looks for them in the current working directory — in the playground, that's the folder holding all the project files.` },
      { lines: [9, 9], text: py`\`open(path, encoding="utf-8")\` opens the log for reading (mode \`"r"\` is the default). \`with … as log\` binds the file object to \`log\` and guarantees it is closed when the block ends.` },
      { lines: [10, 11], text: py`Looping over a file object gives one line per iteration, **including** its trailing \`"\n"\`. \`strip()\` removes that newline plus any stray spaces.` },
      { lines: [12, 13], text: py`Blank lines and \`#\` comments are skipped with \`continue\`. Real data files are messy, so readers should be forgiving about things that don't matter.` },
      { lines: [14, 15], text: py`Each line is split on whitespace into three strings. Everything read from a text file is a **str**, so \`int(minutes)\` converts before adding. A line with the wrong number of parts would raise \`ValueError\` here — experiment 3 fixes that.` },
      { lines: [20, 23], text: py`\`"w"\` creates \`report.txt\` (or empties it if it exists). \`write()\` adds no newline of its own, so each string ends with \`\n\`.` },
      { lines: [29, 30], text: py`Reading the report back with \`read()\` gives the whole file as one string. \`end=""\` stops \`print\` adding a second newline after the file's own last one.` },
      { lines: [32, 34], text: py`\`"rb"\` opens the same file in **binary** mode: \`read()\` now returns \`bytes\` (shown as \`b'...'\`). The byte count equals the character count only while every character is ASCII — try experiment 4.` },
    ],
  },
  playground: {
    title: 'Study log report',
    objective: 'Read a log file line by line, total the minutes per subject, write a report file and read it back.',
    files: { 'main.py': STUDY_LOG, 'study_log.txt': STUDY_LOG_DATA },
    expected: py`\`\`\`text
Study report
history: 50 min
maths: 70 min
physics: 50 min
report.txt holds 59 bytes; starts with b'Study report'
\`\`\`

The playground has an in-memory file system: \`study_log.txt\` is written fresh before every run, and files your program creates (like \`report.txt\`) disappear when the next run starts. On your own computer they would stay on disk.`,
    experiments: [
      {
        id: 'new-session',
        task: py`Open the **study_log.txt** tab and add a new line at the end: \`2026-10-04 maths 30\`. Predict the new maths total before you run.`,
        hint: py`Keep the same three-part format: date, subject, minutes, separated by spaces.`,
        tests: [{ name: 'maths now totals 100 minutes', code: py`assert totals.get("maths") == 100, "Add the line 2026-10-04 maths 30 to study_log.txt"` }],
        explain: py`The program reads the file fresh on every run, so changing the data changes the result without touching the code. That separation — code in \`.py\` files, data in data files — is why programs read files at all.`,
      },
      {
        id: 'append-session',
        task: py`Write a function \`add_session(path, date, subject, minutes)\` that **appends** one line in the log's format, and call \`add_session(LOG_PATH, "2026-10-04", "music", 40)\` just before \`totals = load_totals(LOG_PATH)\`.`,
        hint: py`Open with mode \`"a"\` and write \`f"{date} {subject} {minutes}\n"\`. Don't forget the \`\n\` — and try \`"w"\` once to see what goes wrong.`,
        tests: [
          { name: 'add_session exists', code: py`assert callable(ns.get("add_session")), "Define a function named add_session"` },
          { name: 'music appears in the report', code: py`assert "music: 40 min" in output` },
          { name: 'the original sessions were kept (append, not overwrite)', code: py`with open(LOG_PATH, encoding="utf-8") as f:
    text = f.read()
assert "2026-10-01 maths 45" in text, "The old lines are gone — did you open the log with 'w' instead of 'a'?"
assert text.endswith("2026-10-04 music 40\n"), "The new line should be the last line and end with a newline"` },
        ],
        explain: py`\`"a"\` keeps the existing content and puts every write at the end. With \`"w"\` the log would be emptied first and the report would only show music — a classic data-loss bug.`,
      },
      {
        id: 'skip-bad-lines',
        task: py`Add a broken line \`2026-10-05 art\` (no minutes) to **study_log.txt** and run: the program crashes. Change \`load_totals\` so it prints \`Skipping line N: <the line>\` and carries on. Use \`enumerate(log, start=1)\` to get line numbers.`,
        hint: py`Loop with \`for number, line in enumerate(log, start=1):\`, then check \`parts = line.split()\` has exactly 3 items before unpacking; if not, print the message and \`continue\`.`,
        tests: [
          { name: 'a warning is printed for the bad line', code: py`assert "Skipping line" in output, "Add a malformed line to study_log.txt and print 'Skipping line N: ...' for it"` },
          { name: 'load_totals survives malformed lines', code: py`with open("check.txt", "w", encoding="utf-8") as f:
    f.write("2026-10-01 maths 10\nbroken\n2026-10-02 maths 5\n")
assert load_totals("check.txt") == {"maths": 15}` },
        ],
        explain: py`\`enumerate\` numbers the lines as they stream past, so your warning can say exactly where the problem is — far more useful than a crash on line 6 of a 10,000-line file. Whether to skip, stop or collect bad lines is a design decision; see [error-handling patterns](lesson:error-handling-patterns).`,
      },
      {
        id: 'unicode',
        task: py`Add the line \`2026-10-04 música 15\` to **study_log.txt** and run. Then temporarily change \`load_totals\` to use \`encoding="ascii"\` and read the error. Change it back to \`"utf-8"\` so the report works again. Compare the byte count with the number of characters.`,
        hint: py`The error you should see is a \`UnicodeDecodeError\`: ASCII has no "ú". In UTF-8, "ú" takes two bytes.`,
        tests: [{ name: 'música appears in the report', code: py`assert "música: 15 min" in output` }],
        explain: py`The file on disk is UTF-8 bytes (the playground writes it that way). Decoding with the right encoding gives back "música"; decoding with the wrong one either crashes or produces mojibake. And because "ú" is two bytes in UTF-8, \`len(data)\` (bytes) is now one more than the number of characters.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Saving safely: write a temp file, then swap it in',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'prog', label: 'your program', note: 'has new settings', x: 110, y: 160, tone: 'yellow' },
        { id: 'tmp', label: 'settings.json.tmp', note: 'temporary file, same folder', x: 400, y: 70, tone: 'blue' },
        { id: 'old', label: 'settings.json', note: 'the old, good version', x: 400, y: 250, tone: 'paper' },
        { id: 'disk', label: 'disk', note: 'data that survives a crash', x: 660, y: 160, tone: 'kraft' },
      ],
      edges: [
        { id: 'write', from: 'prog', to: 'tmp', label: 'write + flush' },
        { id: 'sync', from: 'tmp', to: 'disk', label: 'os.fsync', dashed: true },
        { id: 'swap', from: 'tmp', to: 'old', label: 'os.replace' },
        { id: 'direct', from: 'prog', to: 'old', label: 'open("w") directly', dashed: true },
      ],
      steps: [
        { focus: ['prog', 'old'], edges: ['direct'], text: py`The naive way: \`open("settings.json", "w")\`. That **empties the file at once**. If the program crashes, the battery dies or the disk fills up halfway through writing, you are left with a truncated or empty file — the old settings are gone and the new ones never arrived.` },
        { focus: ['prog', 'tmp'], edges: ['write'], text: py`The safe way starts by writing the **complete** new content to a temporary file in the **same folder**. The real file is not touched yet. Closing (or flushing) the file pushes Python's buffer to the operating system.` },
        { focus: ['tmp', 'disk'], edges: ['sync'], text: py`Optionally, \`os.fsync(f.fileno())\` asks the operating system to physically write its cached data to the disk before you continue. It's slower, so use it for data you really can't lose (it matters after a power cut, not after a normal crash).` },
        { focus: ['tmp', 'old'], edges: ['swap'], text: py`\`os.replace(tmp, "settings.json")\` renames the temp file over the real one. The Python docs state that a successful rename is **atomic** on POSIX systems (Linux, macOS): anyone opening \`settings.json\` sees either the whole old file or the whole new one, never a mix.` },
        { focus: ['old'], text: py`If anything fails *before* the replace, the old file is untouched and you only need to delete the leftover \`.tmp\`. The temp file must be in the same folder because a rename can't be atomic across different disks or file systems.` },
      ],
    },
    alt: 'Diagram: your program on the left, a temporary file settings.json.tmp and the real settings.json in the middle, and the disk on the right. A dashed arrow shows the risky direct write into settings.json. The safe path writes the temp file, optionally fsyncs it to disk, then os.replace swaps it over settings.json in one atomic step.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A file object keeps a **position**: how far into the file you are. Every read moves it forward, and so does every write. That's why reading the same file object twice gives an empty string the second time — you're already at the end.`,
      { code: py`with open("pets.txt", "w", encoding="utf-8") as f:
    f.write("cat\ndog\n")

with open("pets.txt", encoding="utf-8") as f:
    print(repr(f.read()))   # 'cat\ndog\n'
    print(repr(f.read()))   # '' — the position is at the end
    f.seek(0)               # jump back to the beginning
    print(repr(f.readline()))   # 'cat\n'`, lang: 'python', title: 'one position, moved by every read' },
      py`Writes are **buffered**: Python collects small writes in memory and hands them to the operating system in bigger chunks, because each trip to the OS is relatively expensive. Closing the file (which \`with\` does for you) flushes the buffer. If a program is killed before that, the last writes can be lost.`,
      py`\`with\` works because file objects are [context managers](lesson:context-managers): leaving the block calls \`f.close()\`, whether the block finished normally, returned, or raised an exception. It's the same as a \`try\`/\`finally\` with \`close()\` in the \`finally\`, just shorter and impossible to forget.`,
    ],
    technical: [
      py`\`open()\` builds a small stack of objects from the \`io\` module, each doing one job:`,
      { code: py`TextIOWrapper     str  <->  bytes   (encoding, newline translation)     "r", "w", ...
  BufferedReader / BufferedWriter   (collects bytes into big chunks)    "rb", "wb", ...
    FileIO                          (raw OS calls on a file descriptor)  buffering=0`, lang: 'text', title: 'the io stack behind open()' },
      { code: py`with open("pets.txt", encoding="utf-8") as f:
    print(type(f).__name__, type(f.buffer).__name__, type(f.buffer.raw).__name__)
    # TextIOWrapper BufferedReader FileIO
with open("pets.txt", "rb") as f:
    print(type(f).__name__)    # BufferedReader — no text layer in binary mode`, lang: 'python', title: 'peek at the layers' },
      py`In text mode, \`read(5)\` means five **characters**; in binary mode it means five **bytes**. In UTF-8 one character can be 1–4 bytes, so the two are not interchangeable — and in text mode \`tell()\` returns an opaque "cookie", not a simple byte count. Only \`seek()\` to \`0\` or to a value that \`tell()\` gave you.`,
      py`At the bottom, the operating system identifies an open file by a small integer, the **file descriptor** (\`f.fileno()\`). Each process may only hold a limited number of them, which is why leaking open files in a long-running program eventually fails with \`OSError: [Errno 24] Too many open files\`.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython frees an object as soon as its reference count drops to zero, so \`open("x.txt").read()\` without \`with\` usually closes the file straight away. That's an implementation detail: PyPy and other implementations close it only when their garbage collector runs, and even CPython emits \`ResourceWarning: unclosed file <_io.TextIOWrapper name='x.txt' ...>\` in development mode (\`python -X dev\`). Don't rely on it — use \`with\`.` },
      { callout: 'note', title: 'Error numbers in the sandbox', text: py`On Linux, macOS and Windows a missing file reads \`[Errno 2] No such file or directory\`. The playground's in-memory file system (Emscripten, under Pyodide) uses different numbers, so you'll see \`[Errno 44]\` there. The exception **type** — \`FileNotFoundError\` — is the same everywhere, which is one more reason to catch exceptions by type, never by message or number.` },
    ],
    production: [
      py`**Always pass \`encoding\`.** It is the single most common cause of "works on my machine" file bugs. If you must read messy input from unknown sources, decide what to do with undecodable bytes: \`errors="replace"\` swaps them for \`�\`, \`errors="strict"\` (the default) raises.`,
      py`**Stream large files.** \`for line in f\` keeps one line in memory at a time, so it handles a 50 GB log on a laptop; \`f.read()\` and \`f.readlines()\` load everything and can exhaust memory. Combine streaming with [generators](lesson:generators) to build processing pipelines (see [lazy evaluation](lesson:lazy-evaluation)).`,
      py`**Replace files atomically.** For anything users would hate to lose (config, saved state, exported data), write to a temp file in the same directory and \`os.replace()\` it over the target:`,
      { code: py`import os
import tempfile


def write_text_atomically(path, text):
    """Replace the file at path with text, never leaving a half-written file."""
    folder = os.path.dirname(os.path.abspath(path))
    fd, tmp_path = tempfile.mkstemp(dir=folder, suffix=".tmp")   # unique name, same folder
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())          # push the bytes to the disk itself
        os.replace(tmp_path, path)        # the atomic swap
    except BaseException:
        os.remove(tmp_path)               # tidy up, then let the error propagate
        raise


write_text_atomically("settings.txt", "theme=dark\n")
print(open("settings.txt", encoding="utf-8").read(), end="")`, lang: 'python', title: 'a reusable atomic write' },
      py`\`mkstemp\` picks a unique name, so two processes saving at once can't trample each other's temp file. On POSIX, truly durable saves also \`fsync\` the *directory* after the rename; most applications skip that, databases don't. Need concurrent writers or transactions? That's the point where a file should become a database — see [sqlite3](lesson:sql-and-sqlite).`,
      py`**Treat paths from users as untrusted.** A filename like \`../../etc/passwd\` can escape the folder you meant to serve files from (*path traversal*). Resolve the path and check it stays inside your base folder — covered in [pathlib](lesson:pathlib) and [injection attacks](lesson:injection-attacks). For logs, prefer the [logging](lesson:logging) module over hand-written \`"a"\` files.`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting to close (no with)',
      wrong: { code: py`f = open("log.txt", "a", encoding="utf-8")
f.write("started\n")
risky_operation()        # if this raises, the file is never closed
f.close()`, lang: 'python', static: true },
      right: { code: py`with open("log.txt", "a", encoding="utf-8") as f:
    f.write("started\n")
    # even if something here raises, f is closed and flushed`, lang: 'python' },
      explanation: py`An exception between \`open()\` and \`close()\` skips the close: buffered writes may be lost and the file stays open. \`with\` closes it no matter how the block exits.`,
    },
    {
      title: 'Using "w" when you meant "a"',
      wrong: { code: py`def log(message):
    with open("events.log", "w", encoding="utf-8") as f:
        f.write(message + "\n")

log("login")
log("logout")      # events.log now contains only "logout"`, lang: 'python' },
      right: { code: py`def log(message):
    with open("events.log", "a", encoding="utf-8") as f:
        f.write(message + "\n")

log("login")
log("logout")      # both lines are kept`, lang: 'python' },
      explanation: py`\`"w"\` empties the file every time it is opened. Appending needs \`"a"\`.`,
    },
    {
      title: 'Expecting write() or writelines() to add newlines',
      wrong: { code: py`with open("names.txt", "w", encoding="utf-8") as f:
    f.writelines(["Ada", "Ben", "Cy"])     # file: AdaBenCy`, lang: 'python' },
      right: { code: py`with open("names.txt", "w", encoding="utf-8") as f:
    f.writelines(name + "\n" for name in ["Ada", "Ben", "Cy"])
    # or: f.write("\n".join(names) + "\n")`, lang: 'python' },
      explanation: py`\`write\` and \`writelines\` write exactly the characters you give them. Despite its name, \`writelines\` doesn't add line endings — \`print(..., file=f)\` is the one that does.`,
    },
    {
      title: 'Forgetting that lines keep their "\\n"',
      wrong: { code: py`with open("names.txt", "w", encoding="utf-8") as f:
    f.write("Ada\nBen\n")
with open("names.txt", encoding="utf-8") as f:
    for name in f:
        print("Hello " + name + "!")    # Hello Ada
                                         # !`, lang: 'python' },
      right: { code: py`with open("names.txt", "w", encoding="utf-8") as f:
    f.write("Ada\nBen\n")
with open("names.txt", encoding="utf-8") as f:
    for name in f:
        name = name.rstrip("\n")       # or .strip() to remove spaces too
        print("Hello " + name + "!")`, lang: 'python' },
      explanation: py`Every line except possibly the last ends with \`"\n"\`. Comparisons like \`line == "Ada"\` also fail until you strip it. Use \`f.read().splitlines()\` if you want a list of lines without the endings.`,
    },
    {
      title: 'Relying on the default encoding',
      wrong: { code: py`with open("menu.txt") as f:          # cp1252 on many Windows PCs, UTF-8 elsewhere
    print(f.read())`, lang: 'python' , static: true },
      right: { code: py`with open("menu.txt", encoding="utf-8") as f:
    print(f.read())`, lang: 'python', static: true },
      explanation: py`Without \`encoding=\`, the result depends on the computer's locale settings. The same file can be read correctly on a Mac and crash with \`UnicodeDecodeError: 'charmap' codec can't decode byte 0x9d\` on Windows.`,
    },
  ],
  debugging: [
    {
      symptom: py`FileNotFoundError: [Errno 2] No such file or directory: 'scores.txt'`,
      cause: py`The file isn't in the **current working directory** — often because the script was started from a different folder than the one it lives in. (In the playground the number is 44, see the CPython note above.)`,
      fix: py`Print \`os.getcwd()\` to see where Python is looking. Build paths relative to the script with \`Path(__file__).parent / "scores.txt"\` ([pathlib](lesson:pathlib)), or catch the error and show a friendly message.`,
    },
    {
      symptom: py`UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 3: invalid continuation byte`,
      cause: py`The file was saved in another encoding (here cp1252/Latin-1, where é is the single byte 0xe9) but you read it as UTF-8.`,
      fix: py`Find out the real encoding and pass it: \`encoding="cp1252"\`. If the data is untrusted and a few bad characters are acceptable, \`errors="replace"\`. Fix the producer to write UTF-8 if you can.`,
    },
    {
      symptom: py`io.UnsupportedOperation: not writable`,
      cause: py`You called \`write()\` on a file opened for reading (mode \`"r"\`, the default). The mirror image is \`io.UnsupportedOperation: not readable\` after opening with \`"w"\`.`,
      fix: py`Open with the mode you need: \`"w"\`/\`"a"\` to write, \`"r+"\` to do both.`,
    },
    {
      symptom: py`TypeError: write() argument must be str, not int`,
      cause: py`\`write()\` in text mode only accepts strings. (In binary mode the message is \`a bytes-like object is required, not 'str'\`.)`,
      fix: py`Convert first: \`f.write(f"{score}\n")\` or \`f.write(str(score) + "\n")\`; in binary mode encode text with \`.encode("utf-8")\`.`,
    },
    {
      symptom: py`ValueError: I/O operation on closed file.`,
      cause: py`You used the file object after its \`with\` block ended (or after \`close()\`).`,
      fix: py`Do all the reading/writing inside the \`with\` block, or keep the data you need in a variable: \`text = f.read()\` inside, use \`text\` outside.`,
    },
    {
      symptom: py`PermissionError: [Errno 13] Permission denied: 'report.xlsx'`,
      cause: py`The OS refused: the file is read-only, belongs to another user, is a folder, or (on Windows) is open in another program such as Excel.`,
      fix: py`Close the other program, check the file's permissions, or write somewhere you're allowed to (your home folder, a temp folder). Catch \`PermissionError\` to show a clear message instead of a traceback.`,
    },
  ],
  bestPractices: [
    'Open files in a with block — always. It closes and flushes them even when an exception happens.',
    'Pass encoding="utf-8" for every text file you open; never rely on the platform default.',
    'Iterate over the file object (for line in f) for anything that might be large; reserve read() for small files.',
    'Choose the mode deliberately: "a" to add, "x" to refuse overwriting, "w" only when you mean "replace everything".',
    'Replace important files atomically: write a temp file in the same folder, then os.replace() it over the original.',
    'Use binary mode ("rb"/"wb") for non-text data such as images, archives and pickles.',
    'Catch FileNotFoundError / PermissionError where you can do something useful (a default value, a clear message), not everywhere.',
    'Keep file names in constants or pass them as parameters, so functions can be tested with temporary files.',
  ],
  useCases: [
    'Saving and loading application state: a to-do list, game progress, user preferences.',
    'Processing log files line by line to count errors or extract events.',
    'Writing reports and exports for other people or programs to read.',
    'Reading configuration and data files shipped with a program.',
    'Copying or transforming binary files such as images (in "rb"/"wb" mode).',
  ],
  comparison: {
    title: 'Which mode do I need?',
    headers: ['mode', 'can read', 'can write', 'if the file is missing', 'if the file exists', 'starts at'],
    rows: [
      ['"r"', 'yes', 'no', 'FileNotFoundError', 'kept', 'beginning'],
      ['"w"', 'no', 'yes', 'created', 'emptied', 'beginning'],
      ['"a"', 'no', 'yes (always at the end)', 'created', 'kept', 'end'],
      ['"x"', 'no', 'yes', 'created', 'FileExistsError', 'beginning'],
      ['"r+"', 'yes', 'yes', 'FileNotFoundError', 'kept (overwritten where you write)', 'beginning'],
      ['"w+"', 'yes', 'yes', 'created', 'emptied', 'beginning'],
      ['"a+"', 'yes', 'yes (always at the end)', 'created', 'kept', 'end'],
    ],
    note: py`Add \`b\` to any of them (\`"rb"\`, \`"wb"\`, \`"ab"\`, \`"r+b"\`…) for binary mode: bytes in and out, no encoding, no newline translation.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'reading-writing-files-q1',
      type: 'mcq',
      prompt: py`Your program keeps a diary in \`diary.txt\`. Every time it runs, it should **add** today's entry without losing older entries. Which mode?`,
      options: [
        { text: '"w"', why: '"w" empties the file as soon as it is opened, so every older entry would be lost.' },
        '"a"',
        { text: '"r"', why: '"r" is read-only; write() would raise io.UnsupportedOperation: not writable.' },
        { text: '"x"', why: '"x" only creates a new file. On the second run diary.txt exists, so open() raises FileExistsError.' },
      ],
      answer: 1,
      explanation: py`Append mode keeps the existing content and sends every write to the end of the file, creating the file if it doesn't exist yet.`,
    },
    {
      id: 'reading-writing-files-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`with open("pets.txt", "w", encoding="utf-8") as f:
    f.write("cat\n")
    f.write("dog")

with open("pets.txt", encoding="utf-8") as f:
    print(f.readlines())`,
      options: [
        { text: "['cat', 'dog']", why: 'readlines() keeps each line ending. Only the last line has none here, because "dog" was written without one.' },
        "['cat\\n', 'dog']",
        { text: "['cat\\n', 'dog\\n']", why: 'write() adds nothing you did not write. "dog" has no newline after it, so neither does the last line.' },
        { text: "['catdog']", why: 'The first write included "\\n", so the file has two lines.' },
      ],
      answer: 1,
      explanation: py`\`readlines()\` returns every line as a string *including* its \`"\n"\`. The last line of a file only ends with a newline if one was written.`,
    },
    {
      id: 'reading-writing-files-q3',
      type: 'output',
      prompt: 'Predict the output (two numbers separated by a space).',
      code: py`with open("pets.txt", "w", encoding="utf-8") as f:
    f.write("cat\ndog\n")

with open("pets.txt", encoding="utf-8") as f:
    first = f.read()
    second = f.read()

print(len(first), len(second))`,
      answer: '8 0',
      explanation: py`The file holds 8 characters (\`c a t \n d o g \n\`). The first \`read()\` moves the position to the end, so the second \`read()\` has nothing left and returns \`""\`. Use \`f.seek(0)\` to rewind, or just keep the first result.`,
    },
    {
      id: 'reading-writing-files-q4',
      type: 'bug',
      prompt: 'After this runs, `scores.txt` contains only `cy,85`. Click the line that causes it.',
      code: py`scores = [("ada", 91), ("ben", 78), ("cy", 85)]
for name, score in scores:
    with open("scores.txt", "w", encoding="utf-8") as f:
        f.write(f"{name},{score}\n")`,
      answerLine: 3,
      explanation: py`The file is reopened with \`"w"\` on every loop iteration, and \`"w"\` empties it each time. Open the file **once**, outside the loop, and write every row inside the \`with\` block (or use \`"a"\` if appending is really what you want).`,
    },
    {
      id: 'reading-writing-files-q5',
      type: 'fill',
      prompt: 'Complete `log_event` so each call adds the message as a **new line at the end** of `events.log`, keeping earlier lines.',
      code: py`def log_event(message):
    with open("events.log", ___, encoding="utf-8") as f:
        f.write(message + ___)`,
      answer: [['"a"', 'a', '"at"'], ['"\\n"']],
      explanation: py`Mode \`"a"\` appends without erasing; \`write()\` adds no line ending, so you add \`"\n"\` yourself.`,
    },
    {
      id: 'reading-writing-files-q6',
      type: 'mcq',
      prompt: py`What does \`open("photo.png", "rb").read()\` return?`,
      options: [
        { text: 'A str containing the image', why: 'Only text mode decodes bytes into a str. "rb" is binary mode.' },
        'A bytes object',
        { text: 'A list of lines', why: 'read() returns one object with the whole content; readlines() would return a list.' },
        { text: 'It raises UnicodeDecodeError', why: 'Binary mode does no decoding at all, so there is nothing to fail on.' },
      ],
      answer: 1,
      explanation: py`In binary mode Python hands you the raw bytes exactly as stored on disk — no encoding and no newline translation. That's what you want for images, archives and anything else that isn't text. (And in real code, put it in a \`with\` block.)`,
    },
    {
      id: 'reading-writing-files-q7',
      type: 'short',
      prompt: 'Why do careful programs save an important file by writing a temporary file and then calling `os.replace()`, instead of opening the real file with `"w"`?',
      answer: py`\`"w"\` empties the real file immediately. If the program crashes, the disk fills up or the power fails mid-write, you're left with a half-written or empty file and the old data is lost. Writing the full new content to a temp file in the same folder first means the original is untouched until the very end; then \`os.replace()\` swaps the new file in with a single rename, which is atomic on POSIX systems — readers see either the complete old file or the complete new one, never a mix.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'file-stats',
      title: 'A tiny word counter',
      difficulty: 'intermediate',
      prompt: py`Write \`file_stats(path)\` that opens the text file at \`path\` (with \`encoding="utf-8"\`) and returns a **tuple** \`(line_count, word_count, longest_line)\`:

- \`line_count\` — how many lines the file has;
- \`word_count\` — the total number of whitespace-separated words;
- \`longest_line\` — the longest line's text **without** its trailing newline (the first one if there's a tie), or \`""\` for an empty file.

Read the file **line by line** (don't use \`read()\`). For the \`poem.txt\` in the project, \`file_stats("poem.txt")\` must return \`(4, 13, "files are just bytes")\`. The tests also try other files: one whose last line has no newline, a tie for the longest line, an empty file and some non-ASCII text.`,
      files: {
        'main.py': py`def file_stats(path):
    """Return (line_count, word_count, longest_line) for a text file."""
    # TODO: open the file and loop over its lines
    return 0, 0, ""


print(file_stats("poem.txt"))
`,
        'poem.txt': py`Roses are red,
violets are blue,
files are just bytes
waiting for you.
`,
      },
      hints: [
        'Use with open(path, encoding="utf-8") as f: and then for line in f: — and keep three running values.',
        'Count every line; add len(line.split()) to the word count; compare len(line.rstrip("\\n")) with the longest so far.',
        'Start with lines = words = 0 and longest = "". Inside the loop: text = line.rstrip("\\n"); lines += 1; words += len(text.split()); if len(text) > len(longest): longest = text.',
      ],
      solution: {
        explanation: py`Iterating the file object reads one line at a time, so the function works on files of any size. Each line still ends in \`"\n"\`, so it is stripped *before* measuring its length — otherwise every line would look one character longer, and the last line (which may have no newline) would be unfairly short. \`str.split()\` with no argument splits on any run of whitespace and ignores leading/trailing spaces, so it counts words correctly. Using \`>\` (not \`>=\`) keeps the *first* longest line on a tie. An empty file never enters the loop and returns \`(0, 0, "")\`.`,
        files: {
          'main.py': py`def file_stats(path):
    """Return (line_count, word_count, longest_line) for a text file."""
    lines = 0
    words = 0
    longest = ""
    with open(path, encoding="utf-8") as f:
        for line in f:
            text = line.rstrip("\n")
            lines += 1
            words += len(text.split())
            if len(text) > len(longest):
                longest = text
    return lines, words, longest


print(file_stats("poem.txt"))
`,
          'poem.txt': py`Roses are red,
violets are blue,
files are just bytes
waiting for you.
`,
        },
      },
      tests: [
        { name: 'poem.txt: (4, 13, "files are just bytes")', code: py`assert file_stats("poem.txt") == (4, 13, "files are just bytes")` },
        { name: 'returns a tuple', code: py`assert isinstance(file_stats("poem.txt"), tuple)` },
        { name: 'works on another file (last line without newline)', code: py`with open("t.txt", "w", encoding="utf-8") as f:
    f.write("one two\n\nthree four five six")
assert file_stats("t.txt") == (3, 6, "three four five six")` },
        { name: 'first longest line wins a tie', code: py`with open("tie.txt", "w", encoding="utf-8") as f:
    f.write("abc\nxyz\n")
assert file_stats("tie.txt") == (2, 2, "abc")` },
        { name: 'empty file gives (0, 0, "")', code: py`open("empty.txt", "w", encoding="utf-8").close()
assert file_stats("empty.txt") == (0, 0, "")` },
        { name: 'handles non-ASCII text', code: py`with open("u.txt", "w", encoding="utf-8") as f:
    f.write("crème brûlée\n")
assert file_stats("u.txt") == (1, 2, "crème brûlée")` },
      ],
    },
    {
      id: 'safe-save',
      title: 'Save a list safely',
      difficulty: 'intermediate',
      prompt: py`Finish two functions (use \`import os\` and \`encoding="utf-8"\`):

1. \`save_lines(path, lines)\` writes each string in \`lines\` on its own line (every line ends with \`"\n"\`). It must **not** write to \`path\` directly: write everything to \`path + ".tmp"\` first, then call \`os.replace(path + ".tmp", path)\`. No \`.tmp\` file may be left behind.
2. \`load_lines(path)\` returns the file's lines as a list of strings **without** newlines. If the file doesn't exist, return \`[]\` instead of crashing.

Example: after \`save_lines("shopping.txt", ["eggs", "milk"])\`, the file contains exactly \`"eggs\nmilk\n"\` and \`load_lines("shopping.txt")\` returns \`["eggs", "milk"]\`.`,
      files: {
        'main.py': py`import os


def save_lines(path, lines):
    """Write each item of lines on its own line - safely."""
    # TODO: write to path + ".tmp" first, then os.replace() it over path
    with open(path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line)


def load_lines(path):
    """Return the lines of a file without newlines ([] if it doesn't exist)."""
    # TODO: strip the newlines and handle a missing file
    with open(path, encoding="utf-8") as f:
        return f.readlines()


save_lines("shopping.txt", ["eggs", "milk", "bread"])
print(load_lines("shopping.txt"))
`,
      },
      hints: [
        'Two separate fixes: save_lines needs a "\\n" per line plus the temp-file dance; load_lines needs try/except FileNotFoundError and newline stripping.',
        'In save_lines: tmp = path + ".tmp"; open tmp with "w", write line + "\\n" for each line, and after the with block call os.replace(tmp, path).',
        'In load_lines: try: with open(path, encoding="utf-8") as f: return f.read().splitlines()  except FileNotFoundError: return [].',
      ],
      solution: {
        explanation: py`\`save_lines\` never opens the real file for writing. It writes the complete content to \`path + ".tmp"\`, and only after that \`with\` block has closed (and flushed) the temp file does \`os.replace\` rename it over \`path\`. If the program crashed while writing, the original file would be untouched. Because the rename *moves* the temp file, nothing is left behind.

\`load_lines\` uses \`read().splitlines()\`, which splits on line endings and drops them — and doesn't produce a phantom empty string for the final \`"\n"\` the way \`split("\n")\` would. A missing file is an expected situation (first run of the program), so catching \`FileNotFoundError\` specifically and returning \`[]\` is the EAFP style: try it, handle the one failure you expect, let every other error surface.

A production version would use \`tempfile.mkstemp(dir=...)\` for a unique temp name and \`os.fsync\` before the replace — see *Internals → production*.`,
        files: {
          'main.py': py`import os


def save_lines(path, lines):
    """Write each item of lines on its own line - safely."""
    tmp_path = path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")
    os.replace(tmp_path, path)


def load_lines(path):
    """Return the lines of a file without newlines ([] if it doesn't exist)."""
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().splitlines()
    except FileNotFoundError:
        return []


save_lines("shopping.txt", ["eggs", "milk", "bread"])
print(load_lines("shopping.txt"))
print(load_lines("missing.txt"))
`,
        },
      },
      tests: [
        { name: 'save then load round-trips', code: py`save_lines("t.txt", ["eggs", "milk"])
assert load_lines("t.txt") == ["eggs", "milk"]` },
        { name: 'each line ends with a newline', code: py`save_lines("t.txt", ["eggs", "milk"])
with open("t.txt", encoding="utf-8") as f:
    assert f.read() == "eggs\nmilk\n"` },
        { name: 'a missing file loads as []', code: py`assert load_lines("does-not-exist.txt") == []` },
        { name: 'saving again replaces the old content', code: py`save_lines("t.txt", ["a", "b", "c"])
save_lines("t.txt", ["z"])
assert load_lines("t.txt") == ["z"]` },
        { name: 'finishes with os.replace(temp, path)', code: py`import os
calls = []
real_replace = os.replace
def spy(src, dst):
    calls.append((str(src), str(dst)))
    return real_replace(src, dst)
os.replace = spy
try:
    save_lines("u.txt", ["x"])
finally:
    os.replace = real_replace
assert calls, "save_lines should write a temp file and then call os.replace(temp_path, path)"
assert calls[-1] == ("u.txt.tmp", "u.txt")` },
        { name: 'no .tmp file is left behind', code: py`import os
save_lines("v.txt", ["x"])
assert not [n for n in os.listdir(".") if n.endswith(".tmp")]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'reading-writing-files-why-with',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why should you open files with a `with` statement instead of calling `open()` and `close()` yourself?',
      answer: 'with guarantees the file is closed — and its buffered writes flushed — when the block exits, whether it finishes normally, returns early or raises. Manual close() is skipped by any exception in between.',
      explanation: py`File objects are context managers: \`__exit__\` calls \`close()\`. That's equivalent to \`try: ... finally: f.close()\`, but you can't forget it. Unclosed files leak OS file descriptors, may lose buffered writes, and on Windows keep the file locked against deletion or renaming.`,
      code: { lang: 'python', code: py`with open("log.txt", "a", encoding="utf-8") as f:
    f.write("job started\n")
    # an exception here still closes f
print(f.closed)   # True` },
      whyAsked: 'A quick check that you write resource-safe code by default — the same idea applies to locks, sockets and database connections.',
      mistakes: ['Saying "Python closes files automatically anyway" (a CPython reference-counting detail, not a guarantee)', 'Not knowing that buffered data may be lost if the file is not closed'],
      followUps: ['How would you implement your own context manager?', 'What happens to buffered writes if the process is killed?', 'How do you open two files in one with statement?'],
      modelAnswer: 'A with block guarantees cleanup. File objects are context managers, so when the block exits — normally, through a return, or because of an exception — Python calls close(), which also flushes any buffered writes. If I call open and close by hand, any exception in between skips the close, so data can be lost and the file descriptor leaks; on Windows the file also stays locked. CPython often closes abandoned files quickly through reference counting, but that is an implementation detail, so I always use with. The same pattern applies to locks, connections and anything else that must be released.',
    },
    {
      id: 'reading-writing-files-r-plus',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`with open("greeting.txt", "w", encoding="utf-8") as f:
    f.write("hello world")

with open("greeting.txt", "r+", encoding="utf-8") as f:
    f.write("HELLO")

with open("greeting.txt", encoding="utf-8") as f:
    print(f.read())` },
      options: ['HELLO', 'HELLO world', 'hello worldHELLO', 'HELLOhello world'],
      correctOption: 1,
      answer: '`HELLO world`. "r+" opens for reading and writing without truncating, with the position at the start, so the write overwrites the first five characters in place.',
      explanation: py`Modes differ in two independent ways: whether they **truncate** (\`"w"\`, \`"w+"\` do) and where writes go (\`"a"\`, \`"a+"\` always append). \`"r+"\` does neither: it starts at position 0 and overwrites byte by byte. Files don't "insert" — to add text in the middle you must rewrite everything after it.`,
      whyAsked: 'Checks that you understand file positions and the precise semantics of modes rather than memorising "r = read, w = write".',
      mistakes: ['Thinking writes insert text instead of overwriting', 'Assuming any writable mode truncates', 'Confusing "r+" with "a+"'],
      followUps: ['What would "a+" print instead?', 'How would you insert a line in the middle of a file?', 'Why must r+ files already exist?'],
      modelAnswer: 'It prints HELLO world. The first block writes "hello world". Opening with r+ gives read-and-write access but, unlike w, it does not empty the file, and the position starts at zero. Writing "HELLO" therefore overwrites the first five characters in place; files never shift content to make room. With a+ the write would have gone to the end instead, giving "hello worldHELLO". To insert text in the middle you generally rewrite the file, ideally to a temp file that you then os.replace over the original.',
    },
    {
      id: 'reading-writing-files-huge-log',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You need to count the lines containing "ERROR" in a 40 GB log file on a machine with 8 GB of RAM. How do you write it, and what could still go wrong?',
      answer: 'Iterate over the file object (for line in f) so only one line is in memory at a time, and count matches: sum(1 for line in f if "ERROR" in line). Watch the encoding (pass it, maybe errors="replace"), extremely long lines, and compressed or rotated logs.',
      explanation: py`\`read()\` and \`readlines()\` would try to load all 40 GB. File objects are iterators over lines with internal buffering, so streaming keeps memory flat. Logs from many sources may contain invalid bytes — decide between \`errors="replace"\` or binary mode (\`b"ERROR" in line\`, which also skips decoding work). A single gigantic line still has to fit in memory; for \`.gz\` logs, \`gzip.open(path, "rt", encoding="utf-8")\` streams the same way.`,
      code: { lang: 'python', code: py`def count_errors(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return sum(1 for line in f if "ERROR" in line)` },
      whyAsked: 'Tests whether you think about memory and streaming — a daily concern in data engineering and back-end work.',
      mistakes: ['Using f.read().count("ERROR") (loads everything, and counts occurrences rather than lines)', 'Using readlines()', 'Ignoring decoding errors in real-world logs'],
      followUps: ['How would you process it in parallel?', 'How would you count per hour instead?', 'How would you follow the file as new lines arrive (like tail -f)?'],
      modelAnswer: 'I would stream it. A file object is an iterator over lines with its own buffer, so for line in f keeps only one line in memory, and sum(1 for line in f if "ERROR" in line) counts in constant memory. read() or readlines() would try to pull 40 GB into 8 GB of RAM. I would pass an explicit encoding and probably errors="replace", because real logs often contain a few invalid bytes, or work in binary mode and search for b"ERROR", which also skips decoding. The remaining risks are a pathological single huge line, and compressed logs, which gzip.open can stream in text mode the same way.',
    },
    {
      id: 'reading-writing-files-windows-encoding',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A script that reads `menu.txt` works on every developer\'s Mac but crashes on a Windows server with `UnicodeDecodeError: \'charmap\' codec can\'t decode byte 0x9d in position 1834: character maps to <undefined>`. What is going on and how do you fix it?',
      answer: 'open() was called without encoding, so it used the locale encoding: UTF-8 on the Macs, a legacy code page (cp1252) on Windows. The file is UTF-8, and one of its multi-byte characters contains a byte cp1252 cannot map. Fix: open(path, encoding="utf-8") everywhere.',
      explanation: py`"charmap" is how Python reports single-byte code pages such as cp1252. Bytes that are fine in UTF-8 — e.g. the bytes of a curly quote or an emoji — can be undefined in cp1252, or decode into wrong characters (mojibake) without any error, which is worse. UTF-8 mode (\`-X utf8\`, default from Python 3.15 per PEP 686) changes the default, and \`-X warn_default_encoding\` (3.10+) flags every \`open()\` that omits the encoding.`,
      whyAsked: 'Cross-platform encoding bugs are among the most common production file bugs; this checks you can read the error and know the root cause.',
      mistakes: ['Adding errors="ignore" to make the crash go away (silently deletes data)', 'Blaming Windows or the file instead of the missing argument', 'Re-saving the file in a different encoding without fixing the code'],
      followUps: ['What does errors="replace" do, and when is it acceptable?', 'How can you find every open() without an encoding in a codebase?', 'What is a BOM and what is "utf-8-sig"?'],
      modelAnswer: 'The file is UTF-8, but open() was called without an encoding, so Python used the locale encoding. On the Macs that is UTF-8, so it works; on the Windows server it is a legacy code page like cp1252, which Python calls a charmap codec, and one of the UTF-8 bytes has no mapping there. The fix is to pass encoding="utf-8" to every open of a text file, so the behaviour no longer depends on the machine. I would also run the test suite with -X warn_default_encoding to find other missing encodings. I would not use errors="ignore", because that silently throws data away.',
    },
    {
      id: 'reading-writing-files-tail',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `tail(path, n)` that returns the last `n` lines of a text file as a list of strings without their newlines, keeping memory proportional to `n` rather than to the file size.',
      answer: 'Stream the file through collections.deque(f, maxlen=n): the deque keeps only the last n lines it has seen. Then strip the newlines.',
      explanation: py`A deque with \`maxlen\` drops items from the left as new ones are appended on the right, so feeding it the whole file leaves exactly the last \`n\` lines, using memory for \`n\` lines only. (Real \`tail\` implementations seek backwards from the end of the file in binary mode, which avoids reading the whole file at all — worth mentioning as a follow-up.)`,
      starter: {
        files: {
          'main.py': py`from collections import deque


def tail(path, n):
    """Return the last n lines of the file at path, without newlines."""
    # TODO
    return []


print(tail("server.log", 3))
`,
          'server.log': py`08:00 INFO start
08:01 INFO request /home
08:02 WARN slow query
08:03 INFO request /about
08:04 ERROR database timeout
08:05 INFO retry ok
`,
        },
      },
      tests: [
        { name: 'last 3 lines of server.log', code: py`assert tail("server.log", 3) == ["08:03 INFO request /about", "08:04 ERROR database timeout", "08:05 INFO retry ok"]` },
        { name: 'n larger than the file returns every line', code: py`assert len(tail("server.log", 100)) == 6` },
        { name: 'works without a final newline', code: py`with open("t.txt", "w", encoding="utf-8") as f:
    f.write("a\nb\nc")
assert tail("t.txt", 2) == ["b", "c"]` },
        { name: 'n = 0 returns []', code: py`assert tail("server.log", 0) == []` },
      ],
      solution: {
        files: {
          'main.py': py`from collections import deque


def tail(path, n):
    """Return the last n lines of the file at path, without newlines."""
    with open(path, encoding="utf-8") as f:
        last = deque(f, maxlen=n)
    return [line.rstrip("\n") for line in last]


print(tail("server.log", 3))
`,
          'server.log': py`08:00 INFO start
08:01 INFO request /home
08:02 WARN slow query
08:03 INFO request /about
08:04 ERROR database timeout
08:05 INFO retry ok
`,
        },
      },
      hints: ['A file object is an iterable of lines — anything that accepts an iterable can consume it.', 'collections.deque(iterable, maxlen=n) only remembers the last n items.'],
      whyAsked: 'Combines file streaming with choosing the right data structure; interviewers like seeing deque(maxlen=...) instead of readlines()[-n:].',
      mistakes: ['f.readlines()[-n:] — correct output, but loads the whole file', 'Forgetting to strip the newlines', 'Returning a deque when a list was asked for'],
      followUps: ['How would you avoid reading the whole file at all? (seek near the end in binary mode and read backwards in blocks)', 'How would you implement tail -f?'],
      modelAnswer: 'I would stream the file into a collections.deque with maxlen set to n. A file object yields lines lazily, and a bounded deque throws away the oldest item each time a new one arrives, so after consuming the file it holds exactly the last n lines and memory stays proportional to n. Then I strip the newlines and return a list. readlines()[-n:] gives the same answer but loads the whole file. For really large files I would mention seeking near the end in binary mode and reading backwards in blocks, which avoids reading the whole file at all.',
    },
    {
      id: 'reading-writing-files-atomic-save',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Users report that after a crash the app\'s `settings.json` is sometimes empty or truncated. Design a save routine that can never leave a corrupt file.',
      answer: 'Never write the real file in place. Write the full content to a uniquely named temp file in the same directory, flush and fsync it, then os.replace() it over the target. A successful rename is atomic on POSIX, so readers see the old or the new file, never half of one. Clean up the temp file on failure.',
      explanation: py`Opening with \`"w"\` truncates first, so any crash mid-write loses data. With the temp-file pattern the original stays intact until one rename swaps it. Details that matter: the temp file must be on the **same file system** (same directory is simplest), otherwise the rename can't be atomic or fails; \`tempfile.mkstemp(dir=...)\` avoids name clashes between concurrent writers; \`os.fsync\` before the rename (and, on POSIX, an fsync of the directory afterwards) protects against power loss, not just process crashes. If several processes update the same data concurrently you also need locking or a real database such as SQLite.`,
      code: { lang: 'python', code: py`import json
import os
import tempfile


def save_settings(path, settings):
    folder = os.path.dirname(os.path.abspath(path))
    fd, tmp = tempfile.mkstemp(dir=folder, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    except BaseException:
        os.remove(tmp)
        raise` },
      whyAsked: 'Distinguishes engineers who have thought about failure modes and durability from those who only test the happy path.',
      mistakes: ['Writing the temp file to /tmp (often a different file system, so the rename is not atomic)', 'Using a fixed temp name that two processes can collide on', 'Thinking flush() alone guarantees the data is on disk', 'Using os.rename, which fails on Windows if the target exists'],
      followUps: ['What is the difference between flush() and fsync()?', 'How would you keep the previous version as a backup?', 'When would you switch to SQLite instead?'],
      modelAnswer: 'The bug is writing the real file in place: opening it with "w" truncates immediately, so a crash halfway leaves it empty or partial. I would write the complete new content to a temporary file created with tempfile.mkstemp in the same directory, flush it and call os.fsync so it actually reaches the disk, and only then call os.replace to rename it over settings.json. On POSIX a successful rename is atomic, so any reader sees either the whole old file or the whole new one. If anything fails before the replace I delete the temp file and re-raise, leaving the original untouched. The same directory matters because renames are only atomic within one file system, and if many processes write concurrently I would add locking or move to SQLite.',
    },
    {
      id: 'reading-writing-files-text-vs-binary',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What actually happens between `f.write("café\\n")` in text mode and bytes landing in the file? How does binary mode differ?',
      answer: 'Text mode goes through a TextIOWrapper that translates "\\n" to the platform newline and encodes the str with the chosen encoding into bytes; a BufferedWriter collects the bytes; a raw FileIO passes them to the OS when the buffer is flushed. Binary mode skips the text layer: you supply bytes and they are written unchanged.',
      explanation: py`\`open()\` composes \`io.TextIOWrapper\` → \`io.BufferedWriter\` → \`io.FileIO\`. In UTF-8, \`"café\n"\` becomes 6 bytes (é is two bytes) — 7 on Windows, where \`"\n"\` becomes \`"\r\n"\`. Nothing is guaranteed to reach the OS until the buffer is flushed (on \`flush()\`, \`close()\`, or when it fills), and nothing is guaranteed to be on the physical disk until the OS writes its cache (\`os.fsync\`). In binary mode \`read(n)\` counts bytes, \`tell()\` is a byte offset, and there is no newline translation — which is why images, archives and pickles must use \`"rb"\`/\`"wb"\`.`,
      code: { lang: 'python', code: py`with open("cafe.txt", "w", encoding="utf-8", newline="\n") as f:
    print(f.write("café\n"))          # 5  (characters)
with open("cafe.txt", "rb") as f:
    print(f.read())                   # b'caf\xc3\xa9\n'  (6 bytes)` },
      whyAsked: 'Probes depth: buffering, encodings and newline translation explain a whole class of corruption and portability bugs.',
      mistakes: ['Saying text mode stores "characters" on disk', 'Not knowing write() returns characters in text mode and bytes in binary mode', 'Thinking flush() means the data is safely on disk'],
      followUps: ['Why does csv want newline=""?', 'What is the difference between flush() and os.fsync()?', 'Why is tell() in text mode not a byte offset?'],
      modelAnswer: 'In text mode open() builds three layers. The TextIOWrapper takes my str, translates "\\n" into the platform line ending and encodes the characters with the chosen encoding, so "café\\n" becomes six UTF-8 bytes, or seven on Windows with "\\r\\n". A BufferedWriter collects those bytes in memory, and a raw FileIO hands them to the operating system when the buffer is flushed — on flush, on close or when it fills. Even then they may sit in the OS cache until os.fsync. Binary mode removes the text layer entirely: I pass bytes and they are stored unchanged, with no encoding and no newline translation, which is what non-text formats need.',
    },
  ],

  takeaways: [
    'open() returns a file object with a mode and a position; every read and write moves the position forward.',
    'Always use with: it closes and flushes the file even when an exception is raised.',
    'Modes: "r" read, "w" erase-then-write, "a" append, "x" create-only, "+" adds the missing direction, "b" switches to bytes.',
    'Pass encoding="utf-8" for every text file — the default depends on the machine (until UTF-8 mode becomes the default in 3.15).',
    'Iterate over the file (for line in f) for big files; each line keeps its "\\n" until you strip it.',
    'write() and writelines() never add newlines; print(..., file=f) does.',
    'Replace important files atomically: write a temp file in the same folder, then os.replace() it over the original.',
  ],
}
