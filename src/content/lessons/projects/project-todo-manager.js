// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------------ shared files
const MAIN = py`"""To-do list manager: run this file and type commands such as 'add buy milk'."""
from cli import run


def main():
    try:
        run("tasks.json")
    except EOFError:
        # Input ended (Ctrl+D, or Ctrl+Z then Enter on Windows).
        # Every change was saved as it happened, so nothing is lost.
        print("\nInput ended. Your tasks are saved. Bye!")


if __name__ == "__main__":
    main()
`

const TASKS_JSON = py`[
  {"title": "Water the plants", "done": true},
  {"title": "Finish maths homework", "done": false},
  {"title": "Call grandma", "done": false}
]
`

const TODO_STARTER = py`"""Task-list logic: plain functions working on a list of dicts. No input(), no print()."""

STATUSES = ("all", "done", "pending")


def add_task(tasks, title):
    """Append a new pending task and return it. Raise ValueError for an empty title."""
    # TODO (step 2): strip the title and reject an empty one.
    task = {"title": title, "done": False}
    tasks.append(task)
    return task


def complete_task(tasks, number):
    """Mark task number \`number\` (1 = the first task) as done and return it."""
    # TODO (step 3)
    return None


def delete_task(tasks, number):
    """Remove task number \`number\` (1 = the first task) and return it."""
    # TODO (step 3)
    return None


def filter_tasks(tasks, status="all"):
    """Return (number, task) pairs for "all", "done" or "pending" tasks."""
    # TODO (step 4)
    return []


def format_tasks(numbered):
    """Turn (number, task) pairs into lines like "1. [x] Buy milk"."""
    # TODO (step 5)
    return "No tasks."
`

const TODO = py`"""Task-list logic: plain functions working on a list of dicts. No input(), no print()."""

STATUSES = ("all", "done", "pending")


def add_task(tasks, title):
    """Append a new pending task and return it. Raise ValueError for an empty title."""
    title = title.strip()
    if not title:
        raise ValueError("A task needs a title, e.g. 'add buy milk'.")
    task = {"title": title, "done": False}
    tasks.append(task)
    return task


def _index(tasks, number):
    """Turn a task number as people count (1, 2, 3…) into a list index."""
    if not 1 <= number <= len(tasks):
        raise ValueError(f"No task {number}. Type 'list' to see the numbers.")
    return number - 1


def complete_task(tasks, number):
    """Mark task number \`number\` (1 = the first task) as done and return it."""
    task = tasks[_index(tasks, number)]
    task["done"] = True
    return task


def delete_task(tasks, number):
    """Remove task number \`number\` (1 = the first task) and return it."""
    return tasks.pop(_index(tasks, number))


def filter_tasks(tasks, status="all"):
    """Return (number, task) pairs for "all", "done" or "pending" tasks."""
    if status not in STATUSES:
        raise ValueError(f"Unknown filter '{status}'. Use all, done or pending.")
    numbered = list(enumerate(tasks, start=1))
    if status == "done":
        return [(n, task) for n, task in numbered if task["done"]]
    if status == "pending":
        return [(n, task) for n, task in numbered if not task["done"]]
    return numbered


def format_tasks(numbered):
    """Turn (number, task) pairs into lines like "1. [x] Buy milk"."""
    if not numbered:
        return "No tasks."
    lines = []
    for number, task in numbered:
        box = "x" if task["done"] else " "
        lines.append(f"{number}. [{box}] {task['title']}")
    return "\n".join(lines)
`

const STORAGE_STARTER = py`"""Saving and loading the task list as a JSON file."""
import json
from pathlib import Path


def save_tasks(tasks, path):
    """Write the tasks to \`path\` as JSON text."""
    # TODO (step 8)
    pass


def load_tasks(path):
    """Return the tasks saved in \`path\`, or [] if the file does not exist yet."""
    # TODO (step 8)
    return []
`

const STORAGE = py`"""Saving and loading the task list as a JSON file."""
import json
from pathlib import Path


def save_tasks(tasks, path):
    """Write the tasks to \`path\` as JSON text."""
    text = json.dumps(tasks, indent=2, ensure_ascii=False)
    Path(path).write_text(text + "\n", encoding="utf-8")


def load_tasks(path):
    """Return the tasks saved in \`path\`, or [] if the file does not exist yet."""
    try:
        text = Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return []
    return json.loads(text)
`

const CLI_STARTER = py`"""The command loop: turns typed commands into calls to the todo functions."""
from storage import load_tasks, save_tasks
from todo import add_task, complete_task, delete_task, filter_tasks, format_tasks

HELP = """Commands:
  add <title>          add a new task
  done <number>        mark a task as done
  delete <number>      delete a task
  list [done|pending]  show tasks (all of them by default)
  help                 show this help
  quit                 leave (changes are saved as you go)"""

CHANGES_DATA = {"add", "done", "delete"}


def parse_command(line):
    """Split "add buy milk" into ("add", "buy milk"). The command is lower-cased."""
    # TODO (step 6): split off the argument with str.partition(" ").
    return line.strip().lower(), ""


def parse_number(text):
    """Convert a task number typed by the user, or raise ValueError."""
    try:
        return int(text)
    except ValueError:
        raise ValueError(f"'{text}' is not a task number.") from None


def handle(tasks, line):
    """Apply one command to \`tasks\` and return the message to show."""
    command, argument = parse_command(line)
    if not command:
        return ""
    try:
        if command == "add":
            task = add_task(tasks, argument)
            return f"Added: {task['title']}"
        if command == "help":
            return HELP
        # TODO (step 7): handle "done", "delete" and "list".
        return f"Unknown command '{command}'. Type 'help' to see the commands."
    except ValueError as err:
        return f"Error: {err}"


def run(path="tasks.json"):
    """Load the tasks, run the command loop until 'quit', save after every change."""
    tasks = load_tasks(path)
    print(f"To-do manager: {len(tasks)} task(s) loaded from {path}. Type 'help' for commands.")
    while True:
        line = input("> ")
        command, _ = parse_command(line)
        if command in ("quit", "exit"):
            break
        message = handle(tasks, line)
        if message:
            print(message)
        if command in CHANGES_DATA:
            save_tasks(tasks, path)
    print("Bye!")
    return tasks
`

const CLI = py`"""The command loop: turns typed commands into calls to the todo functions."""
from storage import load_tasks, save_tasks
from todo import add_task, complete_task, delete_task, filter_tasks, format_tasks

HELP = """Commands:
  add <title>          add a new task
  done <number>        mark a task as done
  delete <number>      delete a task
  list [done|pending]  show tasks (all of them by default)
  help                 show this help
  quit                 leave (changes are saved as you go)"""

CHANGES_DATA = {"add", "done", "delete"}


def parse_command(line):
    """Split "add buy milk" into ("add", "buy milk"). The command is lower-cased."""
    command, _, argument = line.strip().partition(" ")
    return command.lower(), argument.strip()


def parse_number(text):
    """Convert a task number typed by the user, or raise ValueError."""
    try:
        return int(text)
    except ValueError:
        raise ValueError(f"'{text}' is not a task number.") from None


def handle(tasks, line):
    """Apply one command to \`tasks\` and return the message to show."""
    command, argument = parse_command(line)
    if not command:
        return ""
    try:
        if command == "add":
            task = add_task(tasks, argument)
            return f"Added: {task['title']}"
        if command == "done":
            task = complete_task(tasks, parse_number(argument))
            return f"Done: {task['title']}"
        if command == "delete":
            task = delete_task(tasks, parse_number(argument))
            return f"Deleted: {task['title']}"
        if command == "list":
            return format_tasks(filter_tasks(tasks, argument.lower() or "all"))
        if command == "help":
            return HELP
        return f"Unknown command '{command}'. Type 'help' to see the commands."
    except ValueError as err:
        return f"Error: {err}"


def run(path="tasks.json"):
    """Load the tasks, run the command loop until 'quit', save after every change."""
    tasks = load_tasks(path)
    print(f"To-do manager: {len(tasks)} task(s) loaded from {path}. Type 'help' for commands.")
    while True:
        line = input("> ")
        command, _ = parse_command(line)
        if command in ("quit", "exit"):
            break
        message = handle(tasks, line)
        if message:
            print(message)
        if command in CHANGES_DATA:
            save_tasks(tasks, path)
    print("Bye!")
    return tasks
`

const SAMPLE = py`tasks = [
    {"title": "Buy milk", "done": True},
    {"title": "Walk the dog", "done": False},
    {"title": "Call grandma", "done": True},
]
`

export default {
  id: 'project-todo-manager',
  kind: 'project',
  title: 'Project 2: To-Do List Manager',
  summary: 'Build a command-driven to-do app — tasks as dicts in a list, numbered add/done/delete/list, filters, and JSON saving — with every behaviour tested.',
  difficulty: 'beginner',
  minutes: 90,
  prerequisites: ['lists', 'dictionaries', 'while-loops', 'defining-functions', 'json-data'],
  related: ['project-number-game', 'project-text-analyzer', 'for-loops', 'comprehensions', 'string-methods', 'string-formatting', 'mutability-and-copying', 'try-except', 'reading-writing-files', 'pathlib', 'serialization', 'match-statement', 'modules-and-imports', 'main-guard-and-scripts', 'sql-and-sqlite', 'dataclasses'],
  tags: ['project', 'to-do list', 'todo', 'command loop', 'CLI', 'list of dicts', 'enumerate', 'filter', 'json', 'save', 'load', 'pathlib', 'str.partition', 'persistence', 'beginner project'],
  apis: [
    { name: 'list.append() / list.pop(i)', summary: 'Add an item at the end / remove and return the item at index i.' },
    { name: 'enumerate(items, start=1)', summary: 'Pairs each item with a counter — start=1 gives human-friendly numbers.' },
    { name: 'str.partition(sep)', summary: 'Splits at the first sep into (before, sep, after); never raises, even if sep is missing.' },
    { name: 'json.dumps(obj, indent=2) / json.loads(text)', summary: 'Convert Python lists/dicts to JSON text and back.' },
    { name: 'Path.write_text() / Path.read_text()', summary: 'pathlib shortcuts that open, write/read and close a text file in one call.' },
  ],
  docs: [
    { label: 'json — JSON encoder and decoder', url: 'https://docs.python.org/3/library/json.html' },
    { label: 'pathlib — object-oriented filesystem paths', url: 'https://docs.python.org/3/library/pathlib.html' },
    { label: 'Tutorial — data structures (lists, dicts, comprehensions)', url: 'https://docs.python.org/3/tutorial/datastructures.html' },
    { label: 'str.partition()', url: 'https://docs.python.org/3/library/stdtypes.html#str.partition' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Everyone has written a to-do list. Now you'll write the program that *keeps* one: you type \`add buy milk\`, \`done 2\`, \`list pending\` or \`delete 3\`, and it answers, numbers your tasks and **remembers them** in a file, so they're still there tomorrow.`,
    py`Under the hood it's the most common shape in all of programming: **a collection of records** (here, a list of dictionaries) plus **operations** on it (add, change, remove, search) plus **storage** (a JSON file). A shop's product catalogue, a school's grade book and a bank's transaction log are the same idea at a larger scale.`,
    py`You'll build it as three modules — \`todo.py\` (the list operations), \`storage.py\` (JSON in and out) and \`cli.py\` (the command loop) — plus a tiny \`main.py\`, using [lists](lesson:lists), [dictionaries](lesson:dictionaries), [comprehensions](lesson:comprehensions), [string methods](lesson:string-methods) and [JSON](lesson:json-data).`,
  ],
  why: [
    py`A program that forgets everything when it closes is a toy. **Persistence** — saving data and loading it back — is what makes software useful, and JSON is the simplest honest way to do it: human-readable, built into Python, and understood by every other language and web API.`,
    py`The project also teaches a subtle but vital idea: **people count from 1, Python counts from 0**, and a careless conversion silently completes the wrong task. Handling numbers, bad commands and missing files gracefully is what turns "it works on my machine" into "it works".`,
  ],
  eli15: [
    py`Picture a notebook. Each line of the notebook is a **task card** with two things written on it: what to do, and whether it's done. In Python a card is a dictionary — \`{"title": "Buy milk", "done": False}\` — and the notebook is a list of cards.`,
    py`Commands are little instructions for a helper: *"add buy milk"* means "write a new card", *"done 2"* means "tick the second card". The helper reads the first word to know **what** to do and the rest to know **which** card or **what text**.`,
    py`At the end of every change, the helper photocopies the notebook into a file called \`tasks.json\`. Next time you open the app, it reads the photocopy back, so nothing is lost.`,
  ],
  analogy: {
    title: 'A receptionist with a ledger',
    body: [
      py`A hotel receptionist keeps a ledger of bookings. Guests make short requests — *"book room 4"*, *"cancel booking 2"*, *"show today's arrivals"*. The receptionist recognises the request, checks it makes sense (*"there is no booking 9"*), updates the ledger, answers politely, and files a copy in the back office after every change.`,
      py`Our \`cli.py\` is the receptionist, \`todo.py\` holds the rules for changing the ledger, and \`storage.py\` is the filing cabinet.`,
    ],
    mapping: [
      ['the ledger', 'the tasks list — one dict per task'],
      ['a request such as "cancel booking 2"', 'a command line such as "delete 2"'],
      ['recognising the request', 'parse_command() splitting "delete 2" into ("delete", "2")'],
      ['"there is no booking 9"', 'ValueError("No task 9…") turned into an Error: message'],
      ['filing a copy after every change', 'save_tasks() writing tasks.json after add/done/delete'],
      ['opening the ledger in the morning', 'load_tasks() reading tasks.json at start-up'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'One command, from keyboard to file',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'user', label: 'You type', note: '"done 2"', x: 90, y: 70, tone: 'kraft' },
        { id: 'parse', label: 'parse_command', note: '("done", "2")', x: 300, y: 70, tone: 'yellow' },
        { id: 'handle', label: 'handle', note: 'cli.py — picks the action', x: 520, y: 70, tone: 'yellow' },
        { id: 'todo', label: 'todo.py', note: 'complete_task(tasks, 2)', x: 520, y: 230, tone: 'blue' },
        { id: 'tasks', label: 'tasks list', note: '[{title, done}, …]', x: 300, y: 230, tone: 'paper' },
        { id: 'file', label: 'tasks.json', note: 'storage.py', x: 90, y: 230, tone: 'ink' },
      ],
      edges: [
        { from: 'user', to: 'parse', label: 'input()' },
        { from: 'parse', to: 'handle' },
        { from: 'handle', to: 'todo', label: 'call' },
        { from: 'todo', to: 'tasks', label: 'changes a dict' },
        { from: 'tasks', to: 'file', label: 'save_tasks()' },
        { id: 'load', from: 'file', to: 'tasks', label: 'load_tasks() at start', dashed: true },
      ],
      steps: [
        { focus: ['file', 'tasks'], edges: ['load'], text: py`At start-up \`load_tasks()\` reads \`tasks.json\` into a list of dicts (or an empty list on the very first run).` },
        { focus: ['user', 'parse'], edges: ['user->parse'], text: py`You type \`done 2\`. \`input()\` gives the text; \`parse_command()\` splits it into the command \`"done"\` and the argument \`"2"\`.` },
        { focus: ['handle'], edges: ['parse->handle'], text: py`\`handle()\` chooses the action, converts \`"2"\` to the int \`2\` and catches any \`ValueError\` so a mistake becomes a friendly \`Error: …\` message.` },
        { focus: ['todo', 'tasks'], edges: ['handle->todo', 'todo->tasks'], text: py`\`complete_task(tasks, 2)\` turns the human number 2 into index 1 and sets \`"done"\` to \`True\` in that dict. The list itself is changed in place.` },
        { focus: ['tasks', 'file'], edges: ['tasks->file'], text: py`Because the command changed data, \`run()\` calls \`save_tasks()\` immediately. Quit, crash or Ctrl+D — the file is already up to date.` },
      ],
    },
    alt: 'Diagram: the typed text "done 2" flows into parse_command, which produces ("done", "2"); handle in cli.py calls complete_task in todo.py, which changes one dict in the tasks list; save_tasks writes the list to tasks.json, and load_tasks reads tasks.json back into the list at start-up.',
    caption: py`Only \`cli.py\` talks to you, only \`storage.py\` touches the file, and \`todo.py\` just changes a list. Each piece can be tested on its own.`,
  },
  animation: {
    type: 'code-tracer',
    title: 'Dicts inside a list are shared, not copied',
    props: {
      code: py`tasks = []
tasks.append({"title": "Buy milk", "done": False})
tasks.append({"title": "Walk the dog", "done": False})

task = tasks[0]        # a second name for the same dict
task["done"] = True    # changes the dict inside the list

pending = [t for t in tasks if not t["done"]]
print(tasks[0])
print(len(pending), pending[0]["title"])
`,
      notes: {
        2: 'A new dict is created and the list stores a **reference** to it.',
        5: '`task` and `tasks[0]` now point at the very same dict object — no copy is made.',
        6: 'Changing the dict through `task` is visible through `tasks[0]`. This is exactly how `complete_task` works: it changes the dict that lives in the list.',
        8: 'The comprehension builds a **new list** but its items are references to the same dicts.',
      },
    },
    alt: 'A step-by-step trace. A list named tasks gains two dicts. The name task is bound to the first dict, so both task and tasks[0] point to one object. Setting task["done"] = True changes that shared dict. A comprehension then builds a new list containing only the second dict.',
    caption: py`Step through it and watch the arrows: \`complete_task\` doesn't need to put the task "back" into the list — it was never taken out. See [mutability & copying](lesson:mutability-and-copying).`,
  },

  // ------------------------------------------------------------------ plan
  requirements: [
    py`A task is a dict \`{"title": str, "done": bool}\`; the to-do list is a list of these dicts. Task **numbers** shown to the user start at 1.`,
    py`\`todo.add_task(tasks, title)\` strips the title, appends \`{"title": title, "done": False}\` and returns it; an empty or blank title raises \`ValueError\`.`,
    py`\`todo.complete_task(tasks, number)\` marks that task done and returns it; \`todo.delete_task(tasks, number)\` removes it and returns it. A number outside \`1..len(tasks)\` (including 0 and negatives) raises \`ValueError\` whose message contains \`No task {number}\` and changes nothing.`,
    py`\`todo.filter_tasks(tasks, status)\` returns a list of \`(number, task)\` pairs for \`"all"\` (default), \`"done"\` or \`"pending"\`, keeping each task's real number; any other status raises \`ValueError\`.`,
    py`\`todo.format_tasks(pairs)\` returns one line per task, \`1. [x] Buy milk\` for done and \`2. [ ] Walk the dog\` for pending, joined with newlines — or \`No tasks.\` for an empty list.`,
    py`\`cli.parse_command(line)\` returns \`(command, argument)\`: the first word lower-cased and the rest stripped — \`"  ADD  buy milk "\` → \`("add", "buy milk")\`, \`"list"\` → \`("list", "")\`.`,
    py`\`cli.handle(tasks, line)\` applies one command and returns a message: \`Added: …\`, \`Done: …\`, \`Deleted: …\`, the formatted list for \`list [done|pending]\`, the help text for \`help\`, \`Error: …\` for any \`ValueError\`, and a message containing \`Unknown command\` otherwise.`,
    py`\`storage.save_tasks(tasks, path)\` writes JSON; \`storage.load_tasks(path)\` reads it back and returns \`[]\` when the file doesn't exist.`,
    py`\`cli.run(path)\` loads the tasks, reads commands until \`quit\`, prints each message and saves after every \`add\`, \`done\` or \`delete\`.`,
  ],
  objectives: [
    'Model real-world records as dicts and a collection of them as a list.',
    'Convert safely between human numbering (1, 2, 3) and list indexes (0, 1, 2) — and reject numbers that don\'t exist.',
    'Use enumerate(start=1) and list comprehensions to number and filter without losing the original positions.',
    'Parse simple text commands with str.strip(), str.partition() and str.lower().',
    'Save and load data with json and pathlib, handling the "first run, no file yet" case.',
    'Structure a command loop so every user mistake becomes a message, never a crash.',
  ],

  // ------------------------------------------------------------------ build
  playground: {
    title: 'To-do manager — starter',
    objective: 'Complete todo.py, storage.py and the TODOs in cli.py until every test passes, then run it and manage a few tasks.',
    files: { 'main.py': MAIN, 'todo.py': TODO_STARTER, 'storage.py': STORAGE_STARTER, 'cli.py': CLI_STARTER, 'tasks.json': TASKS_JSON },
    expected: py`The starter already runs its command loop, but until you finish \`parse_command\` nearly every command answers *Unknown command*, and nothing is loaded or saved. When it's finished, a session looks like this:

\`\`\`text
To-do manager: 3 task(s) loaded from tasks.json. Type 'help' for commands.
> list
1. [x] Water the plants
2. [ ] Finish maths homework
3. [ ] Call grandma
> add buy milk
Added: buy milk
> done 2
Done: Finish maths homework
> list pending
3. [ ] Call grandma
4. [ ] buy milk
> done 9
Error: No task 9. Type 'list' to see the numbers.
> quit
Bye!
\`\`\`

The sandbox rewrites the project files before every run, so \`tasks.json\` starts fresh each time here — open the **tasks.json** tab after a run to see what was saved. On your own computer the file keeps your list between runs.`,
    tests: [
      { name: 'add_task strips the title and appends a pending task', code: py`from todo import add_task
tasks = []
task = add_task(tasks, "  Buy milk  ")
assert tasks == [{"title": "Buy milk", "done": False}]
assert task is tasks[0], 'Return the dict you appended'` },
      { name: 'add_task rejects a blank title and leaves the list alone', code: py`from todo import add_task
tasks = []
for blank in ["", "   "]:
    with raises(ValueError):
        add_task(tasks, blank)
assert tasks == []` },
      { name: 'complete_task counts from 1 and returns the task', code: py`from todo import complete_task
tasks = [{"title": "A", "done": False}, {"title": "B", "done": False}]
task = complete_task(tasks, 2)
assert task == {"title": "B", "done": True}
assert tasks[0]["done"] is False, 'Task 1 must not change'` },
      { name: 'numbers that do not exist raise ValueError and change nothing', code: py`from todo import complete_task, delete_task
tasks = [{"title": "A", "done": False}, {"title": "B", "done": False}]
for bad in [0, 3, -1]:
    with raises(ValueError, match=f"No task {bad}"):
        complete_task(tasks, bad)
    with raises(ValueError, match=f"No task {bad}"):
        delete_task(tasks, bad)
assert tasks == [{"title": "A", "done": False}, {"title": "B", "done": False}], 'Task 0 must not silently mean the last task'` },
      { name: 'delete_task removes and returns the task', code: py`from todo import delete_task
tasks = [{"title": "A", "done": False}, {"title": "B", "done": True}, {"title": "C", "done": False}]
removed = delete_task(tasks, 2)
assert removed == {"title": "B", "done": True}
assert [t["title"] for t in tasks] == ["A", "C"]` },
      { name: 'filter_tasks keeps the real task numbers', code: py`from todo import filter_tasks
${SAMPLE}
assert filter_tasks(tasks, "pending") == [(2, tasks[1])]
assert filter_tasks(tasks, "done") == [(1, tasks[0]), (3, tasks[2])]
assert filter_tasks(tasks) == [(1, tasks[0]), (2, tasks[1]), (3, tasks[2])]
with raises(ValueError):
    filter_tasks(tasks, "someday")` },
      { name: 'format_tasks prints numbered checkboxes', code: py`from todo import format_tasks
${SAMPLE}
pairs = [(1, tasks[0]), (2, tasks[1])]
assert format_tasks(pairs) == "1. [x] Buy milk\n2. [ ] Walk the dog"
assert format_tasks([]) == "No tasks."` },
      { name: 'parse_command splits the command from its argument', code: py`from cli import parse_command
assert parse_command("  ADD  buy milk ") == ("add", "buy milk")
assert parse_command("done 2") == ("done", "2")
assert parse_command("list") == ("list", "")` },
      { name: 'handle runs commands and turns mistakes into messages', code: py`from cli import handle
tasks = []
assert handle(tasks, "add Buy milk") == "Added: Buy milk"
assert handle(tasks, "done 1") == "Done: Buy milk"
assert handle(tasks, "done two").startswith("Error:")
assert handle(tasks, "done 5").startswith("Error: No task 5")
assert handle(tasks, "list") == "1. [x] Buy milk"
assert handle(tasks, "delete 1") == "Deleted: Buy milk"
assert "Unknown command" in handle(tasks, "dance")` },
      { name: 'save_tasks and load_tasks round-trip through JSON', code: py`import json
from pathlib import Path
from storage import load_tasks, save_tasks
tasks = [{"title": "Buy milk", "done": True}, {"title": "Café ☕", "done": False}]
save_tasks(tasks, "roundtrip.json")
assert json.loads(Path("roundtrip.json").read_text(encoding="utf-8")) == tasks, 'The file must contain the tasks as JSON'
assert load_tasks("roundtrip.json") == tasks
assert load_tasks("no-such-file.json") == [], 'A missing file means "no tasks yet"'` },
      { name: 'load_tasks reads the sample tasks.json', code: py`from storage import load_tasks
tasks = load_tasks("tasks.json")
assert len(tasks) == 3
assert tasks[0] == {"title": "Water the plants", "done": True}` },
      { name: 'a whole session: add, done, list pending, quit — and it is saved', stdin: 'add Buy milk\nadd Walk the dog\ndone 1\nlist pending\ndance\nquit', code: py`import json
from pathlib import Path
from cli import run
out = capture(run, "session.json")
assert "2. [ ] Walk the dog" in out
assert "1. [x] Buy milk" not in out, '"list pending" must not show finished tasks'
assert "Unknown command" in out
saved = json.loads(Path("session.json").read_text(encoding="utf-8"))
assert saved == [{"title": "Buy milk", "done": True}, {"title": "Walk the dog", "done": False}]` },
    ],
  },
  steps: [
    {
      title: 'Design the data first',
      body: [
        py`Before any commands, decide what a **task** looks like. It needs a title and a done/not-done flag, so a dictionary with two keys is perfect. The whole to-do list is just a list of those dicts:`,
        { code: py`tasks = [
    {"title": "Water the plants", "done": True},
    {"title": "Finish maths homework", "done": False},
]

print(tasks[1]["title"])          # Finish maths homework
print(len(tasks), "tasks")`, lang: 'python', title: 'the data model' },
        py`Why dicts and not tuples like \`("Buy milk", False)\`? Dicts **name** their fields, so \`task["done"]\` explains itself, and you can add fields later (a due date, a priority) without breaking old code. And a list of dicts with string keys, strings and booleans maps *directly* onto JSON, which makes saving trivial.`,
        py`Notice what's **not** stored: the task number. Numbers are just positions in the list, worked out when we display it. If we stored them, deleting task 2 would leave the stored numbers wrong.`,
        { code: TASKS_JSON, lang: 'json', title: 'tasks.json (in the starter)' },
      ],
    },
    {
      title: 'Add a task — and refuse an empty one',
      body: [
        py`\`add_task\` cleans the title, builds the dict, appends it and returns it (returning the new task lets the caller say *"Added: Buy milk"* without guessing what was stored).`,
        { code: py`def add_task(tasks, title):
    title = title.strip()
    if not title:
        raise ValueError("A task needs a title, e.g. 'add buy milk'.")
    task = {"title": title, "done": False}
    tasks.append(task)
    return task


tasks = []
add_task(tasks, "  Buy milk ")
print(tasks)   # [{'title': 'Buy milk', 'done': False}]`, lang: 'python', title: 'todo.py — add_task' },
        py`\`tasks.append(...)\` changes the list **in place** — the caller's list, because the function received a reference to the same list object (see [mutability & copying](lesson:mutability-and-copying)). That's why \`add_task\` doesn't need to return the list.`,
        py`An empty string is *falsy* (see [truthiness](lesson:none-and-truthiness)), so \`if not title:\` catches both \`""\` and \`"   "\` (after \`strip()\`).`,
      ],
    },
    {
      title: 'Human numbers vs list indexes: complete and delete',
      body: [
        py`People call the first task "1"; Python calls it index \`0\`. The obvious conversion, \`tasks[number - 1]\`, hides a nasty trap:`,
        { code: py`tasks = ["Buy milk", "Walk the dog", "Call grandma"]
number = 0                      # the user typed "done 0"
print(tasks[number - 1])        # Call grandma  — no error!`, lang: 'python', title: 'the silent bug' },
        py`Negative indexes count from the end, so \`tasks[-1]\` is the **last** task. Typing \`done 0\` would quietly tick off the wrong task. The fix is one helper that every operation uses, so the check can't be forgotten:`,
        { code: py`def _index(tasks, number):
    if not 1 <= number <= len(tasks):
        raise ValueError(f"No task {number}. Type 'list' to see the numbers.")
    return number - 1


def complete_task(tasks, number):
    task = tasks[_index(tasks, number)]
    task["done"] = True
    return task


def delete_task(tasks, number):
    return tasks.pop(_index(tasks, number))`, lang: 'python', title: 'todo.py — one place for the conversion' },
        py`The leading underscore in \`_index\` is a convention meaning *"internal helper — not part of this module's public interface"*. \`list.pop(i)\` removes the item at index \`i\` **and returns it**, so we can tell the user what was deleted.`,
        { callout: 'note', title: 'Numbers shift after a delete', text: py`After \`delete 1\`, the old task 2 becomes task 1. That's normal for position-based numbering (most simple to-do apps behave this way). Apps that need stable numbers give each task a permanent \`id\` instead — one of the stretch challenges.` },
      ],
    },
    {
      title: 'Filter without losing the numbers',
      body: [
        py`\`list pending\` should show only unfinished tasks — but with their **real** numbers, so that \`done 3\` still means task 3. If you filtered first and numbered afterwards, the numbers on screen wouldn't match the list.`,
        py`So number first, filter second. \`enumerate(tasks, start=1)\` produces \`(1, task), (2, task), …\`, and a [comprehension](lesson:comprehensions) keeps the pairs we want:`,
        { code: py`STATUSES = ("all", "done", "pending")


def filter_tasks(tasks, status="all"):
    if status not in STATUSES:
        raise ValueError(f"Unknown filter '{status}'. Use all, done or pending.")
    numbered = list(enumerate(tasks, start=1))
    if status == "done":
        return [(n, task) for n, task in numbered if task["done"]]
    if status == "pending":
        return [(n, task) for n, task in numbered if not task["done"]]
    return numbered


tasks = [{"title": "A", "done": True}, {"title": "B", "done": False}]
print(filter_tasks(tasks, "pending"))   # [(2, {'title': 'B', 'done': False})]`, lang: 'python', title: 'todo.py — filter_tasks' },
        py`The comprehension unpacks each pair straight into \`n, task\` ([tuple unpacking](lesson:tuples-and-unpacking)). The result holds references to the same dicts as \`tasks\` — no copies — which is fine because we only read them.`,
      ],
    },
    {
      title: 'Format the list for humans',
      body: [
        py`Formatting is its own function so it can be tested with exact strings. Build a list of lines, then join them — the idiomatic way to build multi-line text:`,
        { code: py`def format_tasks(numbered):
    if not numbered:
        return "No tasks."
    lines = []
    for number, task in numbered:
        box = "x" if task["done"] else " "
        lines.append(f"{number}. [{box}] {task['title']}")
    return "\n".join(lines)


print(format_tasks([(1, {"title": "Buy milk", "done": True}), (2, {"title": "Walk the dog", "done": False})]))`, lang: 'python', title: 'todo.py — format_tasks' },
        py`Two small details: the conditional expression \`"x" if task["done"] else " "\` picks the checkbox, and inside the f-string we use **single** quotes for \`task['title']\` because the f-string itself uses double quotes (see [f-strings](lesson:string-formatting)).`,
      ],
    },
    {
      title: 'Parse a command line',
      body: [
        py`A command is *one word*, optionally followed by *the rest*. \`str.split()\` would chop "add buy milk" into three words; we want exactly two parts. \`str.partition(" ")\` splits at the **first** space only and always returns three items:`,
        { code: py`>>> "add buy milk".partition(" ")
('add', ' ', 'buy milk')
>>> "list".partition(" ")
('list', '', '')`, lang: 'pycon' },
        { code: py`def parse_command(line):
    command, _, argument = line.strip().partition(" ")
    return command.lower(), argument.strip()


print(parse_command("  ADD  buy milk "))   # ('add', 'buy milk')`, lang: 'python', title: 'cli.py — parse_command' },
        py`\`_\` is the conventional name for "a value I don't need" (the separator). Lower-casing the command makes \`LIST\`, \`List\` and \`list\` all work; we *don't* lower-case the argument, because "Call Grandma" should keep its capitals.`,
      ],
    },
    {
      title: 'Dispatch commands — errors become messages',
      body: [
        py`\`handle\` is the heart of the interface. It decides which function to call, converts the number, and catches \`ValueError\` from *any* of them in one place:`,
        { code: py`def handle(tasks, line):
    command, argument = parse_command(line)
    if not command:
        return ""
    try:
        if command == "add":
            task = add_task(tasks, argument)
            return f"Added: {task['title']}"
        if command == "done":
            task = complete_task(tasks, parse_number(argument))
            return f"Done: {task['title']}"
        if command == "delete":
            task = delete_task(tasks, parse_number(argument))
            return f"Deleted: {task['title']}"
        if command == "list":
            return format_tasks(filter_tasks(tasks, argument.lower() or "all"))
        if command == "help":
            return HELP
        return f"Unknown command '{command}'. Type 'help' to see the commands."
    except ValueError as err:
        return f"Error: {err}"`, lang: 'python', title: 'cli.py — handle' },
        py`\`handle\` **returns** the message instead of printing it, so tests can check it with \`==\`. \`argument.lower() or "all"\` uses \`or\` to supply a default: an empty string is falsy, so plain \`list\` means \`list all\`. \`parse_number\` (already in the starter) turns \`"two"\` into a \`ValueError\` with a friendly message.`,
        { callout: 'version', title: 'match (3.10+)', text: py`With Python 3.10+ you could write the dispatch as \`match command:\` with \`case "add":\`, \`case "done":\` … and \`case _:\` for unknown commands. It reads nicely, but the \`if\` chain works everywhere and is just as clear here. See [structural pattern matching](lesson:match-statement).` },
      ],
    },
    {
      title: 'Save and load with JSON',
      body: [
        py`\`json.dumps\` turns the list of dicts into JSON text (\`True\` becomes \`true\`), \`json.loads\` turns text back into Python objects. \`pathlib.Path\` reads and writes the file in one call each (see [pathlib](lesson:pathlib)):`,
        { code: py`import json
from pathlib import Path


def save_tasks(tasks, path):
    text = json.dumps(tasks, indent=2, ensure_ascii=False)
    Path(path).write_text(text + "\n", encoding="utf-8")


def load_tasks(path):
    try:
        text = Path(path).read_text(encoding="utf-8")
    except FileNotFoundError:
        return []                      # first run: no file yet
    return json.loads(text)


save_tasks([{"title": "Café ☕", "done": False}], "demo.json")
print(Path("demo.json").read_text(encoding="utf-8"))
print(load_tasks("demo.json"), load_tasks("missing.json"))`, lang: 'python', title: 'storage.py' },
        py`- \`indent=2\` makes the file readable (and diff-friendly) for humans.
- \`ensure_ascii=False\` keeps "Café ☕" as real characters instead of \`é\` escapes; that's why we always say \`encoding="utf-8"\`.
- A missing file is **expected** on the first run, so we catch exactly \`FileNotFoundError\` and return an empty list. This "try it and handle the failure" style is called EAFP (see [EAFP vs LBYL](lesson:error-handling-patterns)).`,
      ],
    },
    {
      title: 'The command loop — and saving after every change',
      body: [
        py`\`run()\` ties everything together. The loop's only exit is \`quit\`; every other line goes to \`handle\`. Anything that changed data is saved **immediately**:`,
        { code: py`CHANGES_DATA = {"add", "done", "delete"}


def run(path="tasks.json"):
    tasks = load_tasks(path)
    print(f"To-do manager: {len(tasks)} task(s) loaded from {path}. Type 'help' for commands.")
    while True:
        line = input("> ")
        command, _ = parse_command(line)
        if command in ("quit", "exit"):
            break
        message = handle(tasks, line)
        if message:
            print(message)
        if command in CHANGES_DATA:
            save_tasks(tasks, path)
    print("Bye!")
    return tasks`, lang: 'python', title: 'cli.py — run (already in the starter)' },
        py`Saving after each change (instead of only on \`quit\`) means a crash, a closed terminal or Ctrl+D can't lose work. For a small file the cost is negligible. \`main.py\` calls \`run("tasks.json")\` and turns \`EOFError\` into a goodbye.`,
        py`The last test drives a whole session through stdin — \`add\`, \`add\`, \`done 1\`, \`list pending\`, a typo, \`quit\` — and then opens \`session.json\` to check what was saved. When all twelve tests pass, press **Run** and try it yourself.`,
      ],
    },
  ],
  challenges: [
    'Stable ids: give every task an "id" that never changes (max existing id + 1) and make done/delete use ids, so numbers don\'t shift after a delete.',
    'Add "undo": keep a list of previous states (copy.deepcopy(tasks)) and restore the last one.',
    'Add "edit <number> <new title>" and "clear done" (remove all finished tasks in place).',
    'Due dates: "add buy milk @2026-11-01" stores a "due" field (datetime.date.fromisoformat) and "list overdue" shows late tasks; old files without "due" must still load.',
    'Make load_tasks robust: if tasks.json is corrupted (json.JSONDecodeError) or has the wrong shape, rename it to tasks.json.bak and start empty with a warning.',
    'Rewrite the dispatch in handle() as a match statement (3.10+) or a dict that maps command names to small functions.',
    'Replace the dicts with a Task dataclass and convert with dataclasses.asdict() when saving.',
  ],
  solution: {
    files: { 'main.py': MAIN, 'todo.py': TODO, 'storage.py': STORAGE, 'cli.py': CLI, 'tasks.json': TASKS_JSON },
    explanation: [
      py`The finished manager has four Python files, each with one job:`,
      py`- **\`todo.py\`** — operations on a list of \`{"title", "done"}\` dicts. A single private helper, \`_index\`, converts human numbers to indexes and rejects anything outside \`1..len(tasks)\`, so \`done 0\` can never hit the last task. \`filter_tasks\` numbers with \`enumerate(start=1)\` **before** filtering, so filtered views keep real numbers.
- **\`storage.py\`** — \`json.dumps\`/\`json.loads\` with \`pathlib\` and UTF-8; a missing file means an empty list.
- **\`cli.py\`** — \`parse_command\` splits with \`partition\`; \`handle\` dispatches and converts every \`ValueError\` into an \`Error: …\` message; \`run\` loops until \`quit\` and saves after each change.
- **\`main.py\`** — starts \`run("tasks.json")\` and handles the end of input.`,
      py`Everything that decides or formats returns a value instead of printing, which is why the whole app — including a full session saved to disk — is covered by fast tests.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`JSON is **just text** in a strict format. \`json.dumps\` walks your list and dicts and writes them out; \`json.loads\` reads the text and builds brand-new Python objects that are *equal* to the originals (but not the same objects).`,
      { code: py`import json

tasks = [{"title": "Buy milk", "done": True}]
text = json.dumps(tasks)
print(text)                     # [{"title": "Buy milk", "done": true}]
print(type(text).__name__)      # str
print(json.loads(text) == tasks, json.loads(text) is tasks)   # True False`, lang: 'python', title: 'JSON round trip' },
    ],
    technical: [
      py`JSON only knows objects, arrays, strings, numbers, \`true\`/\`false\` and \`null\`. Python maps dicts → objects, lists *and tuples* → arrays, \`None\` → \`null\`. Some things don't survive the trip: tuples come back as lists, non-string dict keys become strings (\`{1: "a"}\` → \`{"1": "a"}\`), and sets, dates and \`Decimal\` raise \`TypeError: Object of type … is not JSON serializable\` unless you convert them yourself. Keeping tasks as plain dicts of str/bool avoids all of that.`,
      py`\`list.append\` is fast (amortised constant time). \`list.pop(i)\` from the middle has to shift every later item one place left, so it gets slower as the list grows — irrelevant for a to-do list, important for a million-item queue (use \`collections.deque\` for queues).`,
      py`\`Path.write_text\` opens the file in \`"w"\` mode, which **truncates** it to zero bytes before writing. If the program died exactly in between, the file would be empty.`,
    ],
    production: [
      py`Robust programs save **atomically**: write to a temporary file in the same folder, then \`os.replace(tmp, path)\`, which swaps it in as one step on the same filesystem. A crash leaves either the old file or the new one, never half of each.`,
      py`If two copies of the app run at once, each loads, changes and saves the whole file — the last save wins and the other's changes vanish. Real multi-user apps use a database with transactions (see [SQL & sqlite3](lesson:sql-and-sqlite)), which also scales past what fits comfortably in one JSON file.`,
      py`Data files outlive code. Plan for **schema evolution**: read optional fields with \`task.get("due")\`, and consider a version number at the top of the file (\`{"version": 2, "tasks": [...]}\`) so future code knows how to upgrade old files.`,
    ],
  },
  mistakes: [
    {
      title: 'Using the human number as an index without checking it',
      wrong: { code: py`def complete_task(tasks, number):
    tasks[number - 1]["done"] = True     # "done 0" ticks the LAST task`, lang: 'python' },
      right: { code: py`def complete_task(tasks, number):
    if not 1 <= number <= len(tasks):
        raise ValueError(f"No task {number}.")
    tasks[number - 1]["done"] = True`, lang: 'python' },
      explanation: py`Negative indexes are valid in Python, so \`tasks[-1]\` silently refers to the last item. Too-large numbers raise \`IndexError\`, but 0 and negatives don't raise at all. Range-check explicitly.`,
    },
    {
      title: 'Removing items from the list you are looping over',
      wrong: { code: py`def clear_done(tasks):
    for task in tasks:
        if task["done"]:
            tasks.remove(task)      # the loop skips the next item`, lang: 'python' },
      right: { code: py`def clear_done(tasks):
    tasks[:] = [task for task in tasks if not task["done"]]`, lang: 'python' },
      explanation: py`The \`for\` loop walks by position. Removing an item shifts the rest left, so the item that slid into the current position is never checked — two finished tasks in a row leave one behind. Build the filtered list instead; slice assignment \`tasks[:] = …\` replaces the contents of the same list object.`,
    },
    {
      title: '`if command == "add" or "done":` is always true',
      wrong: { code: py`command = "dance"
if command == "add" or "done":
    print("this always runs")`, lang: 'python' },
      right: { code: py`command = "dance"
if command in ("add", "done"):
    print("only for add or done")`, lang: 'python' },
      explanation: py`Python reads it as \`(command == "add") or ("done")\`, and the non-empty string \`"done"\` is truthy. Compare against each value, or use \`in\` with a tuple or set.`,
    },
    {
      title: 'Treating a dict like an object',
      wrong: { code: py`task = {"title": "Buy milk", "done": False}
print(task.title)          # AttributeError: 'dict' object has no attribute 'title'`, lang: 'python' },
      right: { code: py`task = {"title": "Buy milk", "done": False}
print(task["title"])`, lang: 'python' },
      explanation: py`Dicts use square brackets with the key. Dot access is for attributes of objects — if you want \`task.title\`, make a class or [dataclass](lesson:dataclasses).`,
    },
    {
      title: 'Opening the file for writing before reading it',
      wrong: { code: py`import json

with open("tasks.json", "w", encoding="utf-8") as f:   # truncates the file NOW
    tasks = json.load(f)                               # io.UnsupportedOperation: not readable`, lang: 'python', static: true },
      right: { code: py`import json

with open("tasks.json", encoding="utf-8") as f:        # "r" is the default
    tasks = json.load(f)`, lang: 'python', static: true },
      explanation: py`Mode \`"w"\` empties the file the moment it's opened — your data is gone before the error even appears. Read with \`"r"\` (the default) and write with \`"w"\` only when saving.`,
    },
  ],
  debugging: [
    {
      symptom: py`FileNotFoundError: [Errno 2] No such file or directory: 'tasks.json'`,
      cause: py`The first run: nothing has been saved yet (or the program is running in a different working directory).`,
      fix: py`Catch \`FileNotFoundError\` in \`load_tasks\` and return \`[]\`. If the file *should* exist, print \`Path.cwd()\` to see where Python is looking.`,
    },
    {
      symptom: py`json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`,
      cause: py`The file is empty or isn't valid JSON — often truncated by an interrupted write or edited by hand with a trailing comma.`,
      fix: py`Open the file and look at the position the error names. Save atomically (temp file + \`os.replace\`) to avoid half-written files; a stretch challenge adds recovery.`,
    },
    {
      symptom: py`TypeError: list indices must be integers or slices, not str`,
      cause: py`The task number from the command is still the string \`"2"\`.`,
      fix: py`Convert with \`parse_number(argument)\` (which uses \`int()\`) before indexing.`,
    },
    {
      symptom: py`KeyError: 'title'`,
      cause: py`A dict doesn't have that key — a typo (\`"Title"\`), or a hand-edited/older file with different keys.`,
      fix: py`Check the spelling against the data model; for optional fields use \`task.get("due")\`.`,
    },
    {
      symptom: py`"list pending" shows numbers that don't match "done <number>".`,
      cause: py`The tasks were filtered first and numbered afterwards.`,
      fix: py`Number with \`enumerate(tasks, start=1)\` first, then filter the \`(number, task)\` pairs.`,
    },
  ],
  bestPractices: [
    'Decide the data model first; keep it JSON-friendly (dicts, lists, str, int, float, bool, None).',
    'Convert human numbers to indexes in exactly one helper, with an explicit range check.',
    'Return messages and values from functions; print only in the outer loop.',
    'Catch the specific exceptions you expect (ValueError, FileNotFoundError), never everything.',
    'Always pass encoding="utf-8" when reading and writing text files.',
    'Save right after every change; in production, save atomically.',
  ],
  useCases: [
    'Any small personal tool that keeps a list: reading list, habit tracker, shopping list, flashcards.',
    'Command shells and chat-bot style interfaces: "verb argument" commands dispatched to functions.',
    'Configuration and state files for scripts (JSON is the default choice for small structured data).',
    'Prototyping a data model before moving it to a real database.',
  ],
  comparison: {
    title: 'Ways to store a to-do list',
    headers: ['', 'JSON file', 'CSV file', 'SQLite database'],
    rows: [
      ['shape of data', 'nested lists/dicts, any structure', 'flat rows and columns only', 'tables with types and relations'],
      ['human-readable', 'yes', 'yes (opens in a spreadsheet)', 'no (binary file)'],
      ['saving a change', 'rewrite the whole file', 'rewrite the whole file', 'update one row in a transaction'],
      ['two programs at once', 'last write wins', 'last write wins', 'safe: locking and transactions'],
      ['good for', 'small personal data, config', 'tabular exports', 'growing or shared data'],
    ],
    note: py`For a personal to-do list JSON is ideal. Move to [sqlite3](lesson:sql-and-sqlite) when the data grows or several programs share it.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-todo-manager-q1',
      type: 'output',
      prompt: 'The user typed `done 0`. What does this print?',
      code: py`tasks = ["Buy milk", "Walk the dog", "Call grandma"]
number = 0
print(tasks[number - 1])`,
      options: [
        { text: 'IndexError: list index out of range', why: 'number - 1 is -1, and negative indexes are valid: they count from the end.' },
        'Call grandma',
        { text: 'Buy milk', why: 'That would be index 0. Here the index is 0 - 1 = -1.' },
        { text: 'None', why: 'Indexing a list returns an element or raises; it never returns None for a missing item.' },
      ],
      answer: 1,
      explanation: py`\`tasks[-1]\` is the last item. Without a range check, "done 0" silently completes the last task — which is why \`_index\` rejects anything outside \`1..len(tasks)\`.`,
    },
    {
      id: 'project-todo-manager-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print("done 2".partition(" "))
print("list".partition(" "))`,
      options: [
        "('done', ' ', '2')\n('list', '', '')",
        { text: "['done', '2']\n['list']", why: 'That is what split() returns. partition() always returns a 3-tuple.' },
        { text: "('done', '2')\nValueError", why: 'partition() keeps the separator as the middle item and never raises when it is missing.' },
        { text: "('done', ' ', '2')\n('', '', 'list')", why: 'When the separator is missing, the whole string goes in the FIRST slot.' },
      ],
      answer: 0,
      explanation: py`\`partition\` returns \`(before, separator, after)\`. If the separator isn't found you get \`(whole_string, '', '')\`, so \`command, _, argument = line.partition(" ")\` always unpacks safely.`,
    },
    {
      id: 'project-todo-manager-q3',
      type: 'bug',
      prompt: '`clear_done` should remove **every** finished task, but with three tasks — done, done, pending — one finished task survives. What is the bug?',
      code: py`def clear_done(tasks):
    for task in tasks:
        if task["done"]:
            tasks.remove(task)`,
      options: [
        { text: 'task["done"] should be task.done', why: 'Tasks are dicts, so square brackets are correct.' },
        'The list is modified while the for loop is walking over it, so the item after each removed one is skipped',
        { text: 'remove() deletes all equal items at once', why: 'remove() deletes only the first matching item — that is not the problem here.' },
        { text: 'The function must return tasks', why: 'The list is changed in place; returning it would not fix the skipping.' },
      ],
      answer: 1,
      explanation: py`After removing the item at position 0, the second task slides into position 0 — but the loop moves on to position 1. Build a new list (\`[t for t in tasks if not t["done"]]\`) and assign it with \`tasks[:] = …\`.`,
    },
    {
      id: 'project-todo-manager-q4',
      type: 'fill',
      prompt: 'Complete the code: turn the tasks into JSON **text**, and number them starting at 1.',
      code: py`import json

text = json.___(tasks, indent=2)
for number, task in ___(tasks, start=1):
    print(number, task["title"])`,
      answer: [['dumps'], ['enumerate']],
      explanation: py`\`json.dumps\` ("dump **s**tring") returns text; \`json.dump\` writes to an open file. \`enumerate(tasks, start=1)\` yields \`(1, task), (2, task), …\`.`,
    },
    {
      id: 'project-todo-manager-q5',
      type: 'mcq',
      prompt: 'Why does `filter_tasks` return `(number, task)` pairs instead of just the matching tasks?',
      options: [
        { text: 'Because JSON needs numbers', why: 'filter_tasks is not involved in saving.' },
        'So the filtered view shows each task\'s real number, and "done 3" still refers to the right task',
        { text: 'Tuples are faster than dicts', why: 'Speed is not the reason; the pairs carry information the dicts alone do not have.' },
        { text: 'Because enumerate cannot be used with comprehensions', why: 'It can — that is exactly what filter_tasks does.' },
      ],
      answer: 1,
      explanation: py`Numbers are positions in the full list. If you renumbered the filtered list, the pending view might call task 3 "task 1", and \`done 1\` would tick the wrong thing.`,
    },
    {
      id: 'project-todo-manager-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import json

saved = json.dumps({"title": "Buy milk", "done": True, "tags": ("home", "food")})
print(saved)`,
      answer: '{"title": "Buy milk", "done": true, "tags": ["home", "food"]}',
      accept: ['{"title": "Buy milk", "done": true, "tags": ["home", "food"]}'],
      explanation: py`JSON uses lower-case \`true\` and has no tuples, so the tuple becomes a JSON array. Loading it back gives a **list**, not a tuple.`,
    },
    {
      id: 'project-todo-manager-q7',
      type: 'short',
      prompt: 'Why does `run()` save after every add/done/delete instead of once when the user types `quit`?',
      answer: py`Because the program might not reach "quit": the terminal could be closed, the input could end (Ctrl+D) or the program could crash. Saving right after each change means the file always matches what the user has done, at the small cost of rewriting a small file more often.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-todo-manager-storage-format',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 4,
      question: 'For saving a to-do list, compare JSON, pickle and SQLite. Which would you choose and why?',
      answer: 'JSON for a small personal list: human-readable, safe to load, built in and language-neutral. Pickle can store any Python object but is Python-only and unsafe to load from untrusted sources. SQLite is the step up when data grows, needs queries or is shared between processes.',
      explanation: py`JSON fits data made of dicts, lists, strings, numbers and booleans exactly. \`pickle\` can execute code while loading, so a malicious file can run commands — never unpickle untrusted data (see [serialization](lesson:serialization)). SQLite adds transactions, partial updates and queries, at the cost of a binary file and SQL.`,
      whyAsked: 'Choosing a storage format is a routine design decision; the answer reveals awareness of safety, portability and scale.',
      mistakes: ['Choosing pickle "because it is easiest" without mentioning the security risk', 'Saying JSON can store any Python object', 'Jumping to a server database for a single-user tool'],
      followUps: ['How would you store dates in JSON?', 'What happens if two processes write the JSON file at once?', 'When would CSV be better?'],
      modelAnswer: 'For a single user\'s to-do list I would use JSON. The data is a list of small dicts with strings and booleans, which maps one-to-one onto JSON, the file is readable and editable by a human, and json.loads can\'t execute code. Pickle could store arbitrary objects but it\'s Python-specific and loading an untrusted pickle can run code, so I avoid it for files people can edit. If the list grew large, needed searches, or several processes had to update it safely, I would move to SQLite for transactions and row-level updates.',
    },
    {
      id: 'project-todo-manager-clear-done',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Write `clear_done(tasks)` that removes every finished task **from the list that was passed in** (the caller\'s list must change) and returns how many were removed. Keep the order of the remaining tasks.',
      answer: 'Build the list of pending tasks with a comprehension and assign it with slice assignment: tasks[:] = [...]; return the old length minus the new length.',
      explanation: py`\`tasks = [...]\` inside the function would only rebind the *local* name; the caller would never see the change. \`tasks[:] = [...]\` replaces the contents of the existing list object, so every name pointing at it sees the result. Building a new list also avoids the remove-while-iterating bug.`,
      starter: { files: { 'main.py': py`def clear_done(tasks):
    """Remove finished tasks in place; return how many were removed."""
    # TODO
    return 0


todo = [
    {"title": "Buy milk", "done": True},
    {"title": "Walk the dog", "done": True},
    {"title": "Call grandma", "done": False},
]
print(clear_done(todo), todo)
` } },
      tests: [
        { name: 'removes finished tasks and returns the count', code: py`tasks = [{"title": "A", "done": True}, {"title": "B", "done": True}, {"title": "C", "done": False}, {"title": "D", "done": True}]
assert clear_done(tasks) == 3
assert tasks == [{"title": "C", "done": False}]` },
        { name: "changes the caller's list (same object)", code: py`tasks = [{"title": "A", "done": True}, {"title": "B", "done": False}]
alias = tasks
clear_done(tasks)
assert alias == [{"title": "B", "done": False}], 'Modify the list in place (tasks[:] = ...)'` },
        { name: 'keeps order and handles nothing-to-clear', code: py`tasks = [{"title": "X", "done": False}, {"title": "Y", "done": False}]
assert clear_done(tasks) == 0
assert [t["title"] for t in tasks] == ["X", "Y"]` },
      ],
      solution: { files: { 'main.py': py`def clear_done(tasks):
    """Remove finished tasks in place; return how many were removed."""
    before = len(tasks)
    tasks[:] = [task for task in tasks if not task["done"]]
    return before - len(tasks)


todo = [
    {"title": "Buy milk", "done": True},
    {"title": "Walk the dog", "done": True},
    {"title": "Call grandma", "done": False},
]
print(clear_done(todo), todo)
` } },
      hints: ['Remember the length before you change anything.', 'A list comprehension can keep only the tasks where not task["done"].', 'Assign with tasks[:] = ... so the original list object changes.'],
      whyAsked: 'Combines filtering, in-place mutation and the classic "modifying a list while iterating" trap in a few lines.',
      mistakes: ['Calling remove() inside a for loop over the same list', 'Rebinding tasks = [...] so the caller sees no change', 'Returning the new list instead of the count'],
      followUps: ['What is the time complexity of your version vs repeated remove()?', 'How would you do it without building a new list? (iterate backwards by index)', 'Why might in-place mutation be a bad API choice?'],
      modelAnswer: 'I record the length, then build the list of unfinished tasks with a comprehension and assign it back with slice assignment, tasks[:] = ..., so the caller\'s list object is updated rather than a local name being rebound. I return the old length minus the new one. This is linear time and avoids the bug where removing items during a for loop skips the next element. If I were designing the API from scratch I might return a new list instead, because functions that don\'t mutate their inputs are easier to reason about.',
    },
    {
      id: 'project-todo-manager-concurrent-writes',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A user runs the to-do app in two terminal windows. They add "Buy milk" in one and "Call grandma" in the other; afterwards only one of the tasks is in tasks.json. What happened, and how would you fix it?',
      answer: 'Each process loaded the file once, kept its own copy in memory and rewrote the whole file on save — the last writer overwrote the other\'s change (a lost update). Fixes: reload-modify-save under a file lock, or use a database such as SQLite with transactions.',
      explanation: py`Whole-file rewriting is safe for one process only. Two processes each hold a stale in-memory list; whichever saves last wins. Options, from simplest: detect it (store a modification time or version and refuse to save if the file changed), lock the file around load-modify-save, or store tasks in SQLite where each change is a small transaction. Atomic writes (temp file + \`os.replace\`) prevent *corrupted* files but not *lost updates*.`,
      whyAsked: 'Lost updates appear everywhere from files to web APIs; recognising them shows systems thinking.',
      mistakes: ['Blaming JSON itself', 'Believing atomic writes solve it', 'Suggesting "just save more often"'],
      followUps: ['How does SQLite prevent this?', 'What is optimistic concurrency control?', 'How do web APIs handle it (ETags / If-Match)?'],
      modelAnswer: 'This is a lost update. Both windows loaded tasks.json at start-up and then worked on their own in-memory lists. When each saved, it rewrote the entire file from its own list, so the second save erased the first window\'s task. Saving atomically wouldn\'t help — that prevents half-written files, not stale data. For a quick fix I would reload, modify and save under a file lock, or check a version number before writing. The robust fix is SQLite, where each add is an INSERT inside a transaction and the database handles concurrent access.',
    },
    {
      id: 'project-todo-manager-schema-evolution',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'You want to add due dates to tasks. Thousands of users already have tasks.json files without them. How do you change the program without breaking their data?',
      answer: 'Treat the new field as optional: read it with task.get("due") and only write it when set. Store dates as ISO strings ("2026-11-01") because JSON has no date type. For bigger changes, add a version number to the file and a migration step that upgrades old files when loading.',
      explanation: py`Data written by old versions must stay readable by new ones (backward compatibility). Optional fields with defaults keep old files valid. Converting at the boundary — \`date.fromisoformat(task["due"])\` when loading, \`.isoformat()\` when saving — keeps the rest of the code working with real \`date\` objects. A top-level \`{"version": 2, "tasks": [...]}\` wrapper lets the loader recognise and migrate each historical format.`,
      whyAsked: 'Every long-lived system faces data-format changes; this checks for compatibility thinking.',
      mistakes: ['Assuming every task has the new key (KeyError on old files)', 'Storing dates in a locale format like 01/11/2026', 'Rewriting users\' files without a backup'],
      followUps: ['How would you test the migration?', 'What if the old format was a bare list and the new one is an object?', 'How do databases handle this (migrations)?'],
      modelAnswer: 'I would make due dates optional. Loading uses task.get("due") so old tasks simply have no due date, and saving only writes the key when it is set. Because JSON has no date type, I store ISO 8601 strings and convert them with date.fromisoformat when loading, so the rest of the program works with real date objects. If the format needed a bigger change, I would wrap the data in an object with a version number and write a small migration function per version, tested with real old files, and keep a backup before upgrading a file in place.',
    },
    {
      id: 'project-todo-manager-truthy-or',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'This line is meant to save only after "add" or "done": `if command == "add" or "done": save_tasks(tasks, path)`. What does it actually do?',
      options: ['Saves only after add or done', 'Saves after every command', 'Raises a SyntaxError', 'Never saves'],
      correctOption: 1,
      answer: 'It saves after every command. Python evaluates (command == "add") or "done"; when the comparison is False, the result is the non-empty string "done", which is truthy.',
      explanation: py`\`or\` returns its first truthy operand (or the last one). \`"done"\` is a non-empty string, so the whole condition is always truthy. Write \`command in ("add", "done")\` or \`command == "add" or command == "done"\`.`,
      whyAsked: 'A classic beginner bug that tests understanding of operator precedence and truthiness.',
      mistakes: ['Thinking Python distributes == over or', 'Not knowing that or returns an operand, not necessarily True/False'],
      followUps: ['What does "" or "default" evaluate to?', 'Why is a set a good choice for the allowed commands?'],
      modelAnswer: 'It runs for every command. The expression is parsed as (command == "add") or "done", and or returns the first truthy operand. When the command isn\'t "add" the comparison is False, so or returns "done", a non-empty string, which is truthy. The fix is to test membership: command in ("add", "done"), or better a set constant like CHANGES_DATA.',
    },
  ],

  takeaways: [
    'A list of dicts is the simplest useful data model: each dict is a record, the list is the collection, and it maps straight onto JSON.',
    'People count from 1, Python from 0 — convert in one helper with an explicit range check, because tasks[-1] never raises.',
    'Number with enumerate(start=1) before filtering so every view shows real task numbers.',
    'str.strip(), str.partition() and str.lower() turn messy typed commands into clean (command, argument) pairs.',
    'json.dumps/json.loads plus pathlib (with encoding="utf-8") save and load the list; a missing file just means "no tasks yet".',
    'Return messages from functions, turn ValueError into friendly errors in one place, and save right after every change.',
  ],
}
