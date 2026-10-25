// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const READING_LIST = py`# Reading list: load JSON, change the data, save it back
import json
from pathlib import Path

LIBRARY = Path("library.json")


def load_library(path):
    """Read a JSON file and return the Python object it describes."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)                   # JSON text -> dict/list/str/...


library = load_library(LIBRARY)
books = library["books"]                      # a list of dicts
print(f"{library['owner']} has {len(books)} books")

finished = [b["title"] for b in books if b["read"]]       # true -> True
print("Finished:", finished)
ratings = [b["rating"] for b in books if b["rating"] is not None]   # null -> None
print("Average rating:", round(sum(ratings) / len(ratings), 1))

books.append({"title": "Noughts & Crosses", "author": "Malorie Blackman",
              "pages": 480, "read": False, "rating": None})

with open(LIBRARY, "w", encoding="utf-8") as f:
    json.dump(library, f, indent=2, ensure_ascii=False)   # Python -> JSON text

saved = LIBRARY.read_text(encoding="utf-8")
print("Saved", len(saved.splitlines()), "lines. The new book as JSON:")
print(json.dumps(books[-1], indent=2))
`

const LIBRARY_JSON = py`{
  "owner": "Ada",
  "updated": "2026-10-20",
  "books": [
    {"title": "The Hobbit", "author": "J. R. R. Tolkien", "pages": 310, "read": true, "rating": 5},
    {"title": "Dune", "author": "Frank Herbert", "pages": 412, "read": false, "rating": null},
    {"title": "Matilda", "author": "Roald Dahl", "pages": 240, "read": true, "rating": 4}
  ]
}
`

const SETTINGS_START = py`import json

DEFAULTS = {"theme": "light", "font_size": 14, "autosave": True}


def load_settings(path):
    """Return DEFAULTS updated with the settings stored in the JSON file at path."""
    # TODO: handle a missing file, invalid JSON and a non-object top level
    with open(path, encoding="utf-8") as f:
        return json.load(f)


print(load_settings("settings.json"))
`

const SETTINGS_SOLUTION = py`import json

DEFAULTS = {"theme": "light", "font_size": 14, "autosave": True}


def load_settings(path):
    """Return DEFAULTS updated with the settings stored in the JSON file at path."""
    settings = dict(DEFAULTS)                      # a copy: never mutate DEFAULTS
    try:
        with open(path, encoding="utf-8") as f:
            stored = json.load(f)
    except FileNotFoundError:
        return settings
    except json.JSONDecodeError as e:
        print(f"Ignoring {path}: {e.msg} (line {e.lineno}, column {e.colno})")
        return settings
    if not isinstance(stored, dict):
        print(f"Ignoring {path}: expected a JSON object")
        return settings
    settings.update(stored)
    return settings


print(load_settings("settings.json"))
print(load_settings("missing.json"))
`

const SETTINGS_JSON = py`{
  "theme": "dark",
  "font_size": 16
}
`

const SCORES_START = py`import json
from dataclasses import asdict, dataclass
from datetime import date


@dataclass
class Score:
    name: str
    points: int
    when: date


def scores_to_json(scores):
    """Return a JSON array (as a str) describing a list of Score objects."""
    # TODO: json.dumps can't handle Score or date on its own
    return "[]"


def scores_from_json(text):
    """Turn the JSON produced by scores_to_json back into a list of Score objects."""
    # TODO
    return []


board = [Score("ada", 91, date(2026, 10, 1)), Score("ben", 78, date(2026, 10, 2))]
text = scores_to_json(board)
print(text)
print(scores_from_json(text))
`

const SCORES_SOLUTION = py`import json
from dataclasses import asdict, dataclass
from datetime import date


@dataclass
class Score:
    name: str
    points: int
    when: date


def to_jsonable(obj):
    """default= hook: called by json for objects it can't serialise itself."""
    if isinstance(obj, date):
        return obj.isoformat()                    # date -> "2026-10-01"
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def scores_to_json(scores):
    """Return a JSON array (as a str) describing a list of Score objects."""
    return json.dumps([asdict(s) for s in scores], default=to_jsonable, indent=2)


def scores_from_json(text):
    """Turn the JSON produced by scores_to_json back into a list of Score objects."""
    return [
        Score(item["name"], item["points"], date.fromisoformat(item["when"]))
        for item in json.loads(text)
    ]


board = [Score("ada", 91, date(2026, 10, 1)), Score("ben", 78, date(2026, 10, 2))]
text = scores_to_json(board)
print(text)
print(scores_from_json(text))
`

const GET_PATH_START = py`import json


def get_path(data, path, default=None):
    """Fetch a nested value from parsed JSON using a dotted path like "user.tags.0"."""
    # TODO
    return default


order = json.loads('{"id": 7, "customer": {"name": "Ada", "tags": ["vip", "new"]}, "items": [{"sku": "A1", "qty": 2}]}')
print(get_path(order, "customer.name"))
print(get_path(order, "items.0.sku"))
print(get_path(order, "customer.phone", "unknown"))
`

const GET_PATH_SOLUTION = py`import json


def get_path(data, path, default=None):
    """Fetch a nested value from parsed JSON using a dotted path like "user.tags.0"."""
    current = data
    for key in path.split("."):
        if isinstance(current, dict) and key in current:
            current = current[key]
        elif isinstance(current, list) and key.isdigit() and int(key) < len(current):
            current = current[int(key)]
        else:
            return default
    return current


order = json.loads('{"id": 7, "customer": {"name": "Ada", "tags": ["vip", "new"]}, "items": [{"sku": "A1", "qty": 2}]}')
print(get_path(order, "customer.name"))
print(get_path(order, "items.0.sku"))
print(get_path(order, "customer.phone", "unknown"))
`

export default {
  id: 'json-data',
  title: 'JSON: structured data in and out',
  summary: 'The json module turns Python dicts, lists, strings, numbers, booleans and None into JSON text and back — learn the type mapping, the round-trip gotchas, and how to handle errors and custom types.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['dictionaries', 'reading-writing-files'],
  related: ['pathlib', 'csv-data', 'serialization', 'dataclasses', 'http-and-rest', 'input-validation', 'secure-practices', 'typing-collections-and-unions', 'try-except', 'project-todo-manager', 'project-library-api'],
  tags: ['json', 'dumps', 'loads', 'dump', 'load', 'serialization', 'deserialization', 'JSONDecodeError', 'indent', 'sort_keys', 'ensure_ascii', 'default', 'object_hook', 'dataclasses.asdict', 'API', 'config', 'JSON Lines', 'untrusted data'],
  apis: [
    { name: 'json.dumps(obj, indent=None, sort_keys=False, ensure_ascii=True, default=None)', summary: 'Python object → JSON text (a str). The "s" stands for "string".' },
    { name: 'json.loads(s)', summary: 'JSON text (str, bytes or bytearray) → Python object.' },
    { name: 'json.dump(obj, fp, ...)', summary: 'Like dumps, but writes the JSON text to an open text file.' },
    { name: 'json.load(fp)', summary: 'Like loads, but reads the JSON text from an open file.' },
    { name: 'json.JSONDecodeError', summary: 'Raised for invalid JSON; a ValueError subclass with .msg, .lineno, .colno and .pos.' },
    { name: 'default=func', summary: 'Called for objects json can\'t serialise; return something it can, or raise TypeError.' },
    { name: 'object_hook=func / parse_float=Decimal', summary: 'Customise decoding: transform every decoded object, or parse floats as Decimal.' },
    { name: 'dataclasses.asdict(obj)', summary: 'Converts a dataclass instance (recursively) into a dict, ready for JSON.' },
  ],
  docs: [
    { label: 'json — JSON encoder and decoder', url: 'https://docs.python.org/3/library/json.html' },
    { label: 'Tutorial — saving structured data with json', url: 'https://docs.python.org/3/tutorial/inputoutput.html#saving-structured-data-with-json' },
    { label: 'dataclasses.asdict()', url: 'https://docs.python.org/3/library/dataclasses.html#dataclasses.asdict' },
    { label: 'RFC 8259 — the JSON data interchange format', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**JSON** (JavaScript Object Notation) is a *text* format for structured data: objects with named fields, lists, strings, numbers, \`true\`/\`false\` and \`null\`. It is the language web APIs speak, the format of countless config files, and the easiest way to save a Python \`dict\` or \`list\` to disk.`,
    { code: py`{
  "player": "Ada",
  "level": 3,
  "inventory": ["sword", "map"],
  "boss_defeated": false,
  "pet": null
}`, lang: 'json', title: 'save.json — JSON looks a lot like a Python dict' },
    py`Python's built-in **json** module translates in both directions. Turning Python objects into JSON text is called **serialising** (or *encoding*, *dumping*); turning text back into objects is **deserialising** (*decoding*, *loading*).`,
    { code: py`import json

save = {"player": "Ada", "level": 3, "inventory": ["sword", "map"]}
text = json.dumps(save)          # dict -> str
print(text)                      # {"player": "Ada", "level": 3, "inventory": ["sword", "map"]}
again = json.loads(text)         # str -> dict
print(again["inventory"][0])     # sword`, lang: 'python', title: 'there and back again' },
    py`JSON builds on what you know about [dictionaries](lesson:dictionaries) and [files](lesson:reading-writing-files). It's one of several formats in this level — see [CSV](lesson:csv-data) for tables and [serialization](lesson:serialization) for choosing between them.`,
  ],
  why: [
    py`Your program's data lives in memory as objects. To **save** it, **send** it over a network, or **share** it with a program written in another language, it must become a sequence of characters or bytes. JSON is a widely agreed way to do that: JavaScript, Java, Go, Rust, databases and spreadsheets can all read it.`,
    py`JSON is **human-readable** — you can open a \`.json\` file and understand it — yet strict enough for machines to parse unambiguously. And it is **safe to load** from strangers: parsing JSON only ever creates plain data, never runs code (unlike [pickle](lesson:serialization)).`,
    py`The catch: JSON has only six kinds of value. Python has many more types (tuples, sets, dates, your own classes), so you need to know what changes in translation — that's most of this lesson.`,
  ],
  eli15: [
    py`Imagine you want to text a friend your game save. You can't text a *Python dictionary* — you can only send characters. So you write it out in a format both of you agree on: curly braces for "things with labels", square brackets for lists, quotes around words. That agreed format is JSON.`,
    py`\`json.dumps\` is *writing the message*: it turns your Python data into that text. \`json.loads\` is *reading a message*: it turns the text back into Python data. Your friend's phone might run JavaScript instead of Python — doesn't matter, they both understand JSON.`,
  ],
  analogy: {
    title: 'Flat-pack furniture',
    body: [
      py`A wardrobe can't be posted as it is, so the shop flat-packs it: every part labelled, plus instructions in a standard format. Anyone with the instructions can rebuild it at the other end — in any country, with any tools.`,
      py`Serialising is flat-packing your data into JSON text; deserialising is rebuilding it. But the instructions only know a few kinds of part. A tuple gets packed as a plain list and comes back as a list; a dict key that was a number comes back as text. If a part isn't in the catalogue at all (a \`set\`, a \`date\`, your own class), the packer refuses until you explain how to pack it (\`default=\`).`,
    ],
    mapping: [
      ['the assembled wardrobe', 'Python objects in memory (dicts, lists, ...)'],
      ['flat-packing it', 'json.dumps / json.dump (serialising)'],
      ['the box with labelled parts and instructions', 'the JSON text'],
      ['rebuilding it at the other end', 'json.loads / json.load (deserialising)'],
      ['parts the catalogue doesn\'t know', 'sets, dates, Decimals, custom classes → TypeError'],
      ['your own packing instructions for a special part', 'default= (and a matching rebuild step when loading)'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A round trip that comes back different',
    props: {
      code: py`import json

save = {"player": "Ada", "level": 3, "pos": (4, 7), 1: "first", "boss": None}
text = json.dumps(save)
print(text)

back = json.loads(text)
print(back)
print(back == save)
print(type(back["pos"]).__name__, list(back))
`,
      notes: {
        3: 'A dict with a tuple value, an **int key** and a `None` value — all legal in Python.',
        4: '`dumps` returns one **str**. Watch `text` in the variables panel: `(4, 7)` became `[4, 7]`, the key `1` became `"1"`, and `None` became `null`.',
        7: '`loads` builds brand-new Python objects from the text: a dict, a list, strings, ints, `None`.',
        9: '`False`! The data changed shape on the way through: JSON has no tuples and only allows string keys.',
      },
    },
    alt: 'A step-by-step trace. save is a dict with a tuple value (4, 7), an int key 1 and a None value. json.dumps produces a JSON string where the tuple is an array, the key is the string "1" and None is null. json.loads turns it back into a dict with a list [4, 7] and a string key "1". back == save prints False, and the type of back["pos"] is list.',
    caption: py`JSON only has objects, arrays, strings, numbers, booleans and null. Anything else is converted (tuple → list, int key → str key) or refused (set, date, your classes).`,
  },
  syntax: [
    py`#### JSON's rules (stricter than Python's)`,
    py`- Objects \`{}\` hold \`"key": value\` pairs; **keys must be strings in double quotes**.
- Arrays \`[]\` hold values in order.
- Strings use **double quotes only**: \`"Ada"\` ✓, \`'Ada'\` ✗.
- \`true\`, \`false\`, \`null\` are lower-case.
- **No comments, no trailing commas**: \`[1, 2,]\` is invalid.
- Numbers have no leading zeros or \`+\`, and no \`NaN\`/\`Infinity\` in standard JSON.`,
    py`#### The four functions`,
    py`| | to/from a **string** | to/from a **file** |
|---|---|---|
| Python → JSON | \`json.dumps(obj)\` | \`json.dump(obj, f)\` |
| JSON → Python | \`json.loads(text)\` | \`json.load(f)\` |`,
    py`The trailing **s** means *string*. Files must be opened in text mode with \`encoding="utf-8"\` — JSON exchanged between systems must be UTF-8 according to its standard (RFC 8259).`,
    { code: py`import json

data = {"owner": "Zoë", "books": ["Dune", "Matilda"]}

with open("library.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

with open("library.json", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded == data)    # True`, lang: 'python', title: 'saving to and loading from a file' },
    py`#### Formatting options for dumps / dump`,
    py`| option | effect |
|---|---|
| \`indent=2\` | pretty-print over several lines (default: one compact line) |
| \`sort_keys=True\` | write object keys in sorted order — stable output for diffs and tests |
| \`ensure_ascii=False\` | keep "é", "ü", "😀" as they are (default \`True\` writes \`\u00e9\` escapes) |
| \`separators=(",", ":")\` | smallest output, no spaces — for sending over a network |
| \`default=func\` | how to convert objects json doesn't know (see below) |`,
    py`#### The type mapping`,
    py`| Python | JSON | comes back as |
|---|---|---|
| \`dict\` | object | \`dict\` |
| \`list\`, **\`tuple\`** | array | \`list\` |
| \`str\` | string | \`str\` |
| \`int\`, \`float\` | number | \`int\` (no dot) / \`float\` |
| \`True\` / \`False\` | \`true\` / \`false\` | \`True\` / \`False\` |
| \`None\` | \`null\` | \`None\` |
| \`int\`/\`float\`/\`bool\`/\`None\` **dict keys** | string keys | \`str\` keys (\`1\` → \`"1"\`, \`True\` → \`"true"\`) |
| \`set\`, \`datetime\`, \`Decimal\`, \`bytes\`, your classes | — | \`TypeError: Object of type set is not JSON serializable\` |`,
    py`#### When the JSON is broken`,
    { code: py`import json

text = '{\n  "owner": "Ada"\n  "books": []\n}'      # missing comma after "Ada"
try:
    json.loads(text)
except json.JSONDecodeError as e:
    print(e)                       # Expecting ',' delimiter: line 3 column 3 (char 21)
    print(e.msg, e.lineno, e.colno)`, lang: 'python', title: 'JSONDecodeError knows where it went wrong' },
    py`\`json.JSONDecodeError\` is a subclass of \`ValueError\`, so \`except ValueError\` also catches it. The position is where the parser *noticed* the problem — often just after the real mistake (here the comma is missing at the end of line 2, but the parser only complains when it reaches \`"books"\` on line 3).`,
    py`#### Custom types: default= on the way out, explicit conversion on the way in`,
    { code: py`import json
from dataclasses import asdict, dataclass
from datetime import date


@dataclass
class Booking:
    guest: str
    nights: int
    arrives: date


def to_jsonable(obj):
    if isinstance(obj, date):
        return obj.isoformat()          # "2026-12-24"
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


booking = Booking("Ada", 3, date(2026, 12, 24))
text = json.dumps(asdict(booking), default=to_jsonable)
print(text)        # {"guest": "Ada", "nights": 3, "arrives": "2026-12-24"}

raw = json.loads(text)
restored = Booking(raw["guest"], raw["nights"], date.fromisoformat(raw["arrives"]))
print(restored == booking)   # True`, lang: 'python', title: 'a dataclass with a date, there and back' },
    py`\`default\` is called only for objects json can't handle, and must return something it *can* handle — or raise \`TypeError\`. Decoding never guesses: \`"2026-12-24"\` comes back as a plain string until **you** convert it. ([Dataclasses](lesson:dataclasses) are covered in depth later.)`,
  ],
  walkthrough: {
    title: 'Reading the reading-list program',
    lang: 'python',
    code: READING_LIST,
    intro: py`This is the playground program below; \`library.json\` is in the second tab. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [8, 11], text: py`\`json.load(f)\` reads the whole file and parses it. The top level of \`library.json\` is an object, so the result is a \`dict\`. The file is opened with \`encoding="utf-8"\`, as JSON should always be.` },
      { lines: [14, 16], text: py`From here on it's ordinary Python: \`library["books"]\` is a list of dicts. JSON gave us no special objects — just the built-in types you already know.` },
      { lines: [18, 21], text: py`JSON's \`true\` arrived as Python \`True\`, so \`if b["read"]\` works directly. \`null\` became \`None\`, which is why the ratings filter uses \`is not None\` — Dune hasn't been rated yet.` },
      { lines: [23, 24], text: py`Changing the data is just changing Python objects. We append a new dict with \`False\` and \`None\` values.` },
      { lines: [26, 27], text: py`\`json.dump\` writes JSON text into the open file. \`indent=2\` makes it readable for humans and friendly to version control; \`ensure_ascii=False\` keeps non-English characters readable instead of \`\uXXXX\` escapes.` },
      { lines: [29, 31], text: py`\`json.dumps\` (with an **s**) returns the JSON as a string instead of writing a file — perfect for printing, logging or sending. Notice \`False\` → \`false\` and \`None\` → \`null\`.` },
    ],
  },
  playground: {
    title: 'Reading list',
    objective: 'Load a JSON file into Python objects, work with them, then save them back as pretty JSON.',
    files: { 'main.py': READING_LIST, 'library.json': LIBRARY_JSON },
    expected: py`\`\`\`text
Ada has 3 books
Finished: ['The Hobbit', 'Matilda']
Average rating: 4.5
Saved 34 lines. The new book as JSON:
{
  "title": "Noughts & Crosses",
  "author": "Malorie Blackman",
  "pages": 480,
  "read": false,
  "rating": null
}
\`\`\`

The playground's file system is rebuilt before every run, so \`library.json\` starts from the version in its tab each time — the appended book never piles up.`,
    experiments: [
      {
        id: 'break-json',
        task: py`Break the JSON on purpose: in **library.json**, delete the comma after \`"owner": "Ada"\` and run. Read the error's line and column. Put the comma back, then add a **trailing comma** after the last book and run again. Fix it when you're done.`,
        hint: py`Look at the last line of the traceback: \`json.decoder.JSONDecodeError: Expecting ',' delimiter: line 3 column 3 (char 21)\`. Which line did you actually edit?`,
        explain: py`The parser reports where it got stuck, which is usually the token *after* the mistake: a missing comma at the end of line 2 is noticed at the start of line 3. Trailing commas are legal in Python but not in JSON, a classic error when people hand-edit config files.`,
      },
      {
        id: 'friendly-error',
        task: py`Make \`load_library\` friendlier: catch \`json.JSONDecodeError\`, print \`Bad JSON in <path>: <message> at line <L>, column <C>\` (use the exception's \`.msg\`, \`.lineno\`, \`.colno\`) and return \`None\`. The test feeds it a broken file.`,
        hint: py`Wrap the \`with\` block in \`try:\` and add \`except json.JSONDecodeError as e:\`, then \`print(f"Bad JSON in {path}: {e.msg} at line {e.lineno}, column {e.colno}")\` and \`return None\`.`,
        tests: [
          { name: 'prints the line number of the problem', code: py`with open("bad.json", "w", encoding="utf-8") as f:
    f.write('{\n  "owner": "Ada",\n  "books": [,]\n}')
printed = capture(load_library, "bad.json")
assert "line 3" in printed, f"Expected a message mentioning line 3, got: {printed!r}"` },
          { name: 'returns None for broken JSON', code: py`with open("bad.json", "w", encoding="utf-8") as f:
    f.write("{nope}")
assert load_library("bad.json") is None` },
          { name: 'still loads valid JSON', code: py`assert load_library("library.json")["owner"] == "Ada"` },
        ],
        explain: py`Catching the specific \`JSONDecodeError\` (rather than every exception) means a missing file or a bug in your code still fails loudly, while a hand-edited config with a typo gets a message a human can act on. Whether to return \`None\`, fall back to defaults or stop the program is a design choice — see [error-handling patterns](lesson:error-handling-patterns).`,
      },
      {
        id: 'unicode',
        task: py`Append another book before saving: \`"Le Petit Prince"\` by \`"Antoine de Saint-Exupéry"\`, 96 pages, read, rated 5. Run, then temporarily remove \`ensure_ascii=False\` and print \`saved\` to see what changes in the file.`,
        hint: py`Copy the existing \`books.append({...})\` call and change the values. Remember Python spells them \`True\`/\`False\`/\`None\`.`,
        tests: [{ name: 'the saved file contains "Saint-Exupéry" as written', code: py`text = LIBRARY.read_text(encoding="utf-8")
assert "Saint-Exupéry" in text, "Append the book and keep ensure_ascii=False"` }],
        explain: py`By default \`json.dump\` escapes every non-ASCII character (\`Saint-Exup\u00e9ry\`). That's still valid JSON and loads back identically, but it's unreadable for humans. With \`ensure_ascii=False\` the file contains the real characters, which is why the file must be opened with \`encoding="utf-8"\`.`,
      },
      {
        id: 'round-trip',
        task: py`Give the new Blackman book a tuple of tags: add \`"tags": ("school", "drama")\` to its dict. At the end, add \`reloaded = json.loads(saved)\` and \`print(reloaded == library)\`. Predict the result first.`,
        hint: py`What does JSON turn a tuple into, and what comes back?`,
        tests: [
          { name: 'the in-memory tags are a tuple', code: py`book = next(b for b in books if b["title"] == "Noughts & Crosses")
assert isinstance(book.get("tags"), tuple), "Add 'tags': ('school', 'drama') to the Noughts & Crosses book"` },
          { name: 'the reloaded tags are a list', code: py`r = ns.get("reloaded")
assert r is not None, "Create reloaded = json.loads(saved)"
book = next(b for b in r["books"] if b["title"] == "Noughts & Crosses")
assert isinstance(book["tags"], list)` },
        ],
        explain: py`It prints \`False\`: JSON has arrays but no tuples, so \`("school", "drama")\` is saved as \`["school", "drama"]\` and loads back as a list — and \`("school", "drama") != ["school", "drama"]\`. If the exact type matters, convert after loading (\`tuple(item["tags"])\`) or validate into a dataclass.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Where JSON sits between your program and the world',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'objs', label: 'Python objects', note: 'dict, list, str, int, None…', x: 120, y: 160, tone: 'yellow' },
        { id: 'text', label: 'JSON text', note: 'a str like {"level": 3}', x: 390, y: 160, tone: 'blue' },
        { id: 'file', label: 'save.json', note: 'a file on disk', x: 650, y: 70, tone: 'kraft' },
        { id: 'net', label: 'web API', note: 'HTTP request/response body', x: 650, y: 250, tone: 'paper' },
      ],
      edges: [
        { id: 'dumps', from: 'objs', to: 'text', label: 'json.dumps' },
        { id: 'loads', from: 'text', to: 'objs', label: 'json.loads', dashed: true },
        { id: 'tofile', from: 'text', to: 'file', label: 'dump / load' },
        { id: 'tonet', from: 'text', to: 'net', label: 'send / receive' },
      ],
      steps: [
        { focus: ['objs'], text: py`Your data lives in memory as Python objects. Other programs — or your own program tomorrow — can't see them.` },
        { focus: ['objs', 'text'], edges: ['dumps'], text: py`\`json.dumps\` **serialises**: it walks through the objects and writes JSON text. Only dicts, lists/tuples, strings, numbers, booleans and None are allowed; anything else raises \`TypeError\` unless you pass \`default=\`.` },
        { focus: ['text', 'file'], edges: ['tofile'], text: py`\`json.dump(obj, f)\` does the same but writes straight into an open file; \`json.load(f)\` reads it back. Text mode, \`encoding="utf-8"\`.` },
        { focus: ['text', 'net'], edges: ['tonet'], text: py`The same text is what web APIs send and receive. The other side might be JavaScript, Go or a database — JSON is the shared language. (See [HTTP & REST](lesson:http-and-rest).)` },
        { focus: ['text', 'objs'], edges: ['loads'], text: py`\`json.loads\` **deserialises**: it parses the text and builds **new** Python objects. It never runs code, so it's safe on untrusted input — but the *shape* of the data still needs checking before you trust it.` },
      ],
    },
    alt: 'Diagram: Python objects on the left, JSON text in the middle, and on the right a file save.json and a web API. json.dumps turns objects into JSON text and json.loads turns text back into new objects. json.dump and json.load connect the text with the file; the same text is sent to and received from web APIs.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`json.loads\` reads the text character by character and builds Python objects as it goes: \`{\` starts a dict, \`[\` a list, \`"\` a string, a digit a number. Because it only ever creates those built-in types, loading JSON can't run code or create objects of your own classes.`,
      py`Every \`loads\` creates **new** objects. Saving a list and loading it back gives you an equal list (if it only contained JSON-friendly values), not the same one.`,
    ],
    technical: [
      py`**Numbers.** JSON numbers without a dot or exponent become \`int\`; others become \`float\`. Python's \`float\` has the usual binary rounding (\`0.1 + 0.2\` → \`0.30000000000000004\`), so money should be parsed with \`json.loads(text, parse_float=Decimal)\` and sent as strings or integer cents. Python ints have no size limit, but other languages do: JavaScript loses precision above 2**53, which is why many APIs send large IDs as strings.`,
      py`**Non-standard extras.** By default Python writes \`NaN\`, \`Infinity\` and \`-Infinity\` for those floats and accepts them when reading, although standard JSON forbids them. Pass \`allow_nan=False\` to \`dumps\` to get \`ValueError: Out of range float values are not JSON compliant: nan\` instead. Duplicate keys are accepted and **the last one wins**: \`json.loads('{"a": 1, "a": 2}')\` is \`{'a': 2}\`.`,
      py`**Hooks.** \`default=\` (or a \`json.JSONEncoder\` subclass overriding \`default()\`) extends encoding. \`object_hook=\` receives every decoded dict and may return something else — e.g. convert dicts with a \`"__type__": "date"\` marker back into dates. Explicit conversion functions (\`Booking.from_dict(...)\`) are usually clearer than clever hooks.`,
      { callout: 'version', title: 'Python 3.14: better serialisation errors', text: py`Since 3.14, a \`TypeError\` raised while serialising nested data carries notes saying where the bad value was, e.g. \`TypeError: Object of type datetime is not JSON serializable\` followed by \`when serializing list item 0\` and \`when serializing dict item 'seen'\`. Older versions only print the first line.` },
      { callout: 'note', title: 'CPython detail', text: py`CPython's \`json\` module has an optional C accelerator (\`_json\`) used automatically for the common cases, with a pure-Python fallback. The results are the same; only the speed differs. Other implementations may provide their own fast paths.` },
    ],
    production: [
      py`**Untrusted JSON is safe to parse, not safe to trust.** \`json.loads\` won't execute anything (never use \`eval\` to "parse" JSON — that *would* run code). But the result can have any shape: missing keys, wrong types, a list where you expected a dict, a 10-million-element array. Validate before use — check types and required keys by hand, or with a schema library such as Pydantic or jsonschema (third-party) — and cap the size of request bodies. See [input validation](lesson:input-validation).`,
      { callout: 'note', title: 'Huge integers are capped', text: py`Converting a very long string of digits to \`int\` is slow, so since Python 3.11 (and security releases of some earlier versions) \`int()\` — and therefore \`json.loads\` — refuses more than 4300 digits by default: \`ValueError: Exceeds the limit (4300 digits) for integer string conversion\`. It protects servers from denial-of-service payloads; \`sys.set_int_max_str_digits()\` changes it.` },
      py`**Big data: use JSON Lines.** \`json.load\` must read an entire document into memory. For logs, events and exports with many records, write **one JSON object per line** (\`.jsonl\`): you can append records, stream them with \`for line in f: json.loads(line)\`, and a corrupt line doesn't spoil the rest.`,
      { code: py`import json

events = [{"user": "ada", "action": "login"}, {"user": "ben", "action": "buy", "amount": 12}]
with open("events.jsonl", "w", encoding="utf-8") as f:
    for event in events:
        f.write(json.dumps(event) + "\n")

with open("events.jsonl", encoding="utf-8") as f:
    for line in f:
        print(json.loads(line)["action"])     # login, then buy`, lang: 'python', title: 'JSON Lines: one record per line' },
      py`**Stable output.** For files kept in version control or compared in tests, use \`indent=2, sort_keys=True\` and end the file with a newline, so diffs show only real changes. Save important JSON files with the temp-file-and-\`os.replace\` pattern from [reading & writing files](lesson:reading-writing-files).`,
    ],
  },
  mistakes: [
    {
      title: 'Mixing up load and loads (or dump and dumps)',
      wrong: { code: py`import json

with open("scores.json", encoding="utf-8") as f:
    scores = json.loads(f)     # TypeError: the JSON object must be str, bytes or bytearray, not TextIOWrapper`, lang: 'python', static: true },
      right: { code: py`import json

with open("scores.json", "w", encoding="utf-8") as f:
    json.dump({"ada": 91}, f)

with open("scores.json", encoding="utf-8") as f:
    scores = json.load(f)      # file -> load; string -> loads`, lang: 'python' },
      explanation: py`The **s** functions work with **strings**; the others work with **files**. \`json.dump(obj)\` without a file raises \`TypeError: dump() missing 1 required positional argument: 'fp'\`.`,
    },
    {
      title: 'Writing JSON by hand with str() or f-strings',
      wrong: { code: py`player = {"name": "Ada", "alive": True, "pet": None}
text = str(player)    # "{'name': 'Ada', 'alive': True, 'pet': None}" — NOT JSON`, lang: 'python' },
      right: { code: py`import json

player = {"name": "Ada", "alive": True, "pet": None}
text = json.dumps(player)   # '{"name": "Ada", "alive": true, "pet": null}'`, lang: 'python' },
      explanation: py`\`str()\` produces Python syntax — single quotes, \`True\`, \`None\` — which JSON parsers reject. Hand-built f-strings also break as soon as a value contains a quote or a newline. Let \`json\` do the escaping.`,
    },
    {
      title: 'Expecting tuples and int keys to survive a round trip',
      wrong: { code: py`import json

grid = {1: (0, 0), 2: (3, 4)}
back = json.loads(json.dumps(grid))
print(back[1])          # KeyError: 1 — the keys are now "1" and "2"`, lang: 'python', static: true },
      right: { code: py`import json

grid = {1: (0, 0), 2: (3, 4)}
raw = json.loads(json.dumps(grid))
back = {int(k): tuple(v) for k, v in raw.items()}   # rebuild the real types
print(back == grid)     # True`, lang: 'python' },
      explanation: py`JSON object keys are always strings and JSON has no tuples. Convert back explicitly after loading — or store data in a JSON-friendly shape to begin with (a list of \`{"id": 1, "pos": [0, 0]}\` records).`,
    },
    {
      title: 'Using eval() to parse JSON',
      wrong: { code: py`data = eval(request_body)      # runs ANY Python expression the sender wrote`, lang: 'python', static: true },
      right: { code: py`import json

data = json.loads(request_body)   # only ever builds dicts, lists, str, numbers, bool, None`, lang: 'python', static: true },
      explanation: py`\`eval\` executes code: a "JSON" body of \`__import__('os').system('rm -rf ~')\` would run. It also fails on real JSON (\`true\`, \`null\`). \`json.loads\` is both correct and safe.`,
    },
    {
      title: 'Catching every exception around json.load',
      wrong: { code: py`import json

try:
    with open("config.json", encoding="utf-8") as f:
        config = json.load(f)
except Exception:
    config = {}          # hides typos in your code, permission problems, everything`, lang: 'python' },
      right: { code: py`import json

try:
    with open("config.json", encoding="utf-8") as f:
        config = json.load(f)
except FileNotFoundError:
    config = {}                                   # first run: no config yet
except json.JSONDecodeError as e:
    raise SystemExit(f"config.json is invalid: {e}")   # tell the human where`, lang: 'python' },
      explanation: py`Handle the specific failures you expect and can do something sensible about. A broad \`except\` silently replaces a corrupt config with defaults, and nobody finds out why settings "reset".`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Object of type datetime is not JSON serializable`,
      cause: py`The data contains a type JSON has no equivalent for (also: \`set\`, \`Decimal\`, \`bytes\`, your own classes). In 3.14 the notes below the message say where it was.`,
      fix: py`Convert before dumping (\`d.isoformat()\`, \`list(s)\`, \`str(dec)\`, \`asdict(obj)\`) or pass \`default=\` a function that does it. Convert back explicitly after loading.`,
    },
    {
      symptom: py`json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`,
      cause: py`The text is empty or isn't JSON at all — very often an empty file, or an HTML error page returned by a web server instead of the JSON you expected.`,
      fix: py`Print \`repr(text[:200])\` to see what you actually received. Check file sizes and HTTP status codes before parsing.`,
    },
    {
      symptom: py`json.decoder.JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 2 (char 1)`,
      cause: py`Single-quoted keys (Python syntax, e.g. text produced with \`str(dict)\`), or a trailing comma before \`}\` in older Python versions.`,
      fix: py`Produce the text with \`json.dumps\`. If you're fixing a hand-written file, use double quotes and remove trailing commas.`,
    },
    {
      symptom: py`json.decoder.JSONDecodeError: Illegal trailing comma before end of object: line 4 column 22 (char 54)`,
      cause: py`A comma after the last item of an object or array (Python 3.13+ names it explicitly).`,
      fix: py`Delete the comma at the reported position. JSON doesn't allow trailing commas or comments; consider TOML for hand-edited configs.`,
    },
    {
      symptom: py`KeyError: 1 after loading a dict you saved with int keys`,
      cause: py`JSON object keys are always strings, so \`1\` came back as \`"1"\`.`,
      fix: py`Look up \`data["1"]\`, or rebuild: \`{int(k): v for k, v in data.items()}\`.`,
    },
    {
      symptom: py`The saved file is full of \u00e9 / \ud83d\ude00 escapes`,
      cause: py`\`ensure_ascii=True\` is the default; non-ASCII characters are escaped.`,
      fix: py`Pass \`ensure_ascii=False\` and open the file with \`encoding="utf-8"\`. (The escaped form is valid JSON too — it's only a readability problem.)`,
    },
  ],
  bestPractices: [
    'Use json.dump/json.load with files and json.dumps/json.loads with strings — and open files with encoding="utf-8".',
    'Pretty-print files people read or diff: indent=2, sort_keys=True, ensure_ascii=False.',
    'Keep JSON data in JSON-friendly shapes: string keys, lists rather than tuples, ISO-8601 strings for dates.',
    'Convert custom types explicitly: default= (or asdict) on the way out, a from_dict/constructor on the way in.',
    'Catch json.JSONDecodeError specifically and report e.msg, e.lineno and e.colno.',
    'Validate the shape of untrusted JSON before using it, and limit the size you accept.',
    'Never use eval() or ast.literal_eval() to parse JSON; never hand-build JSON with f-strings.',
    'Use JSON Lines for large or append-only collections of records.',
  ],
  useCases: [
    'Saving app state: to-do lists, game saves, user preferences.',
    'Talking to web APIs: request and response bodies.',
    'Configuration files that programs generate or exchange.',
    'Exporting data for JavaScript front-ends, other services or other languages.',
    'Structured logs and event streams (as JSON Lines).',
  ],
  whenToUse: {
    use: [
      'Data made of dicts, lists, strings, numbers, booleans and None.',
      'Exchanging data with other languages, services or browsers.',
      'Loading data from untrusted sources (after validating its shape).',
      'Small to medium files that humans occasionally read.',
    ],
    avoid: [
      'Tabular data for spreadsheets — CSV is simpler there.',
      'Hand-written config with comments — TOML (tomllib) allows comments.',
      'Huge datasets you query or update piecemeal — use a database such as SQLite.',
      'Binary data (images, audio) — JSON would need base64, which inflates the size.',
    ],
  },
  comparison: {
    title: 'Python ↔ JSON, value by value',
    headers: ['Python value', 'JSON text', 'json.loads gives back'],
    rows: [
      ['{"a": 1}', '{"a": 1}', '{\'a\': 1} (dict)'],
      ['[1, 2] or (1, 2)', '[1, 2]', '[1, 2] — always a list'],
      ['"Zoë"', '"Zo\\u00eb" (or "Zoë" with ensure_ascii=False)', '\'Zoë\''],
      ['3 / 3.5', '3 / 3.5', '3 (int) / 3.5 (float)'],
      ['True / False', 'true / false', 'True / False'],
      ['None', 'null', 'None'],
      ['{1: "x", None: "y"}', '{"1": "x", "null": "y"}', 'string keys: {\'1\': \'x\', \'null\': \'y\'}'],
      ['float("nan")', 'NaN (not standard JSON)', 'nan — refuse with allow_nan=False'],
      ['{1, 2}, date(...), Decimal(...), b"..."', 'TypeError', '— (convert first, or use default=)'],
    ],
    note: py`If a value comes back different, the round trip isn't lossless — compare \`json.loads(json.dumps(x)) == x\` in a test when it matters.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'json-data-q1',
      type: 'mcq',
      prompt: 'Which of these is **valid** JSON?',
      options: [
        { text: "{'name': 'Ada'}", why: 'JSON strings and keys need double quotes; single quotes are Python syntax.' },
        { text: '{"name": "Ada", "pet": None}', why: 'JSON spells it null. None is Python.' },
        '{"name": "Ada", "scores": [91, 78], "active": true}',
        { text: '{"name": "Ada", "scores": [91, 78],}', why: 'Trailing commas are not allowed in JSON.' },
      ],
      answer: 2,
      explanation: py`Double-quoted strings and keys, lower-case \`true\`/\`false\`/\`null\`, and no trailing commas. Everything else in the wrong options is fine in Python but invalid JSON.`,
    },
    {
      id: 'json-data-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import json

print(json.dumps({"b": 1, "a": [True, None]}, sort_keys=True))`,
      answer: '{"a": [true, null], "b": 1}',
      explanation: py`\`sort_keys=True\` orders the keys alphabetically; \`True\` becomes \`true\` and \`None\` becomes \`null\`. Without \`indent\`, everything is on one line with \`", "\` and \`": "\` separators.`,
    },
    {
      id: 'json-data-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`import json

data = {1: (2, 3)}
print(json.loads(json.dumps(data)))`,
      options: [
        { text: '{1: (2, 3)}', why: 'JSON has neither int keys nor tuples, so the data cannot come back unchanged.' },
        { text: "{1: [2, 3]}", why: 'The tuple did become a list — but the key changed too.' },
        "{'1': [2, 3]}",
        { text: 'TypeError: keys must be str', why: 'json.dumps converts int, float, bool and None keys to strings automatically.' },
      ],
      answer: 2,
      explanation: py`Object keys in JSON are always strings, so \`1\` becomes \`"1"\`; tuples are written as arrays and come back as lists.`,
    },
    {
      id: 'json-data-q4',
      type: 'bug',
      prompt: 'This crashes with `TypeError: the JSON object must be str, bytes or bytearray, not TextIOWrapper`. Click the faulty line.',
      code: py`import json

with open("scores.json", "w", encoding="utf-8") as f:
    json.dump({"ada": 91}, f)

with open("scores.json", encoding="utf-8") as f:
    scores = json.loads(f)
print(scores["ada"])`,
      answerLine: 7,
      explanation: py`\`loads\` parses a **string**. To read from a file object, use \`json.load(f)\` (or \`json.loads(f.read())\`).`,
    },
    {
      id: 'json-data-q5',
      type: 'fill',
      prompt: 'Save `data` as nicely indented JSON that keeps characters like "é" readable in the file.',
      code: py`import json

with open("cities.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ___=2, ___=False)`,
      answer: [['indent'], ['ensure_ascii']],
      explanation: py`\`indent=2\` pretty-prints with two spaces per level; \`ensure_ascii=False\` writes non-ASCII characters directly instead of \`\uXXXX\` escapes.`,
    },
    {
      id: 'json-data-q6',
      type: 'mcq',
      prompt: py`\`json.dumps({"tags": {"python", "files"}})\` raises an error. What's the cleanest fix if order doesn't matter but stable output does?`,
      options: [
        { text: 'json.dumps(str(data))', why: 'That writes a JSON string containing Python syntax — the set is lost as data.' },
        { text: 'Use pickle instead', why: 'Pickle would work for Python-only use, but gives up readability, portability and safety for a one-line problem.' },
        'Convert the set to a sorted list first: {"tags": sorted(tags)}',
        { text: 'Pass ensure_ascii=False', why: 'ensure_ascii only affects how characters are written; it has nothing to do with unsupported types.' },
      ],
      answer: 2,
      explanation: py`JSON has no set type (\`TypeError: Object of type set is not JSON serializable\`). A **sorted** list is valid JSON and makes the output identical every run (set order isn't predictable). Convert back with \`set(...)\` after loading if you need set behaviour.`,
    },
    {
      id: 'json-data-q7',
      type: 'short',
      prompt: 'Why is `json.loads` safe to use on data from strangers, while `pickle.loads` is not? Does "safe" mean you can use the result without checks?',
      answer: py`\`json.loads\` can only ever create plain data — dicts, lists, strings, numbers, booleans and None — so a malicious document can't make it run code. \`pickle.loads\` can be instructed to call arbitrary functions while loading, so an attacker's pickle can execute code on your machine. But "safe to parse" isn't "safe to trust": the JSON can still have the wrong shape, wrong types, missing keys or be enormous, so you still validate it (and limit its size) before using it.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'settings-with-defaults',
      title: 'Settings with sensible defaults',
      difficulty: 'intermediate',
      prompt: py`Finish \`load_settings(path)\`. It returns a **new dict**: a copy of \`DEFAULTS\` updated with the key/value pairs stored in the JSON file at \`path\`.

- If the file **doesn't exist**, return a copy of \`DEFAULTS\` (no error, nothing printed).
- If the file contains **invalid JSON**, print \`Ignoring <path>: <msg> (line <L>, column <C>)\` using the exception's \`.msg\`, \`.lineno\` and \`.colno\`, and return a copy of \`DEFAULTS\`.
- If the JSON is valid but its top level is **not an object** (e.g. a list), print a message starting with \`Ignoring\` and return a copy of \`DEFAULTS\`.
- Never modify \`DEFAULTS\` itself.

With the project's \`settings.json\`, the result is \`{"theme": "dark", "font_size": 16, "autosave": True}\`.`,
      files: { 'main.py': SETTINGS_START, 'settings.json': SETTINGS_JSON },
      hints: [
        'Start with settings = dict(DEFAULTS) so you always work on a copy, then try to load the file.',
        'Use try/except with two except clauses: FileNotFoundError and json.JSONDecodeError (as e). After loading, check isinstance(stored, dict).',
        'except json.JSONDecodeError as e:\n    print(f"Ignoring {path}: {e.msg} (line {e.lineno}, column {e.colno})")\n    return settings\n...\nsettings.update(stored)\nreturn settings',
      ],
      solution: {
        explanation: py`\`dict(DEFAULTS)\` makes a shallow copy, so \`update()\` never touches the shared defaults — the aliasing bug from [mutability & copying](lesson:mutability-and-copying). Each expected failure gets its own handler: a missing file is normal on a first run, so it's silent; invalid JSON is a human's typo, so the message uses \`e.msg\`, \`e.lineno\` and \`e.colno\` to point at it. Valid JSON can still have the wrong shape — \`[1, 2]\` would make \`update()\` crash — so the \`isinstance\` check guards it. Any other error (a permission problem, a bug) still propagates, which is what you want. A production version might also validate each value's type (is \`font_size\` really an int?).`,
        files: { 'main.py': SETTINGS_SOLUTION, 'settings.json': SETTINGS_JSON },
      },
      tests: [
        { name: 'merges the project settings over the defaults', code: py`assert load_settings("settings.json") == {"theme": "dark", "font_size": 16, "autosave": True}` },
        { name: 'a missing file gives the defaults', code: py`assert load_settings("no-such-file.json") == {"theme": "light", "font_size": 14, "autosave": True}` },
        { name: 'returns a copy and never changes DEFAULTS', code: py`before = dict(DEFAULTS)
result = load_settings("no-such-file.json")
assert result is not DEFAULTS, "Return a copy, not DEFAULTS itself"
load_settings("settings.json")
assert DEFAULTS == before, "DEFAULTS was modified"` },
        { name: 'invalid JSON prints the line and column, returns defaults', code: py`with open("broken.json", "w", encoding="utf-8") as f:
    f.write('{\n  "theme": "dark"\n  "font_size": 20\n}')
printed = capture(load_settings, "broken.json")
assert "Ignoring broken.json" in printed and "line 3" in printed and "column 3" in printed, printed
assert load_settings("broken.json") == DEFAULTS` },
        { name: 'a JSON list at the top level is ignored', code: py`with open("list.json", "w", encoding="utf-8") as f:
    f.write("[1, 2, 3]")
assert capture(load_settings, "list.json").startswith("Ignoring")
assert load_settings("list.json") == DEFAULTS` },
      ],
    },
    {
      id: 'dataclass-scores',
      title: 'Save dataclasses with dates',
      difficulty: 'intermediate',
      prompt: py`A leaderboard is a list of \`Score\` dataclasses with a \`date\` field. Plain \`json.dumps\` can't handle either.

1. \`scores_to_json(scores)\` returns a **str**: a JSON array with one object per score, keys \`"name"\`, \`"points"\` and \`"when"\`, where \`"when"\` is the ISO date string (\`"2026-10-01"\`). Use \`indent=2\`.
2. \`scores_from_json(text)\` turns that JSON back into a list of \`Score\` objects with real \`date\` values, so that \`scores_from_json(scores_to_json(board)) == board\`.

Use \`dataclasses.asdict\` and a \`default=\` function (or convert the date yourself).`,
      files: { 'main.py': SCORES_START },
      hints: [
        'asdict(score) gives {"name": ..., "points": ..., "when": date(...)} — json still can\'t handle the date inside it.',
        'Write a function for default= that returns obj.isoformat() for dates and raises TypeError otherwise. When loading, date.fromisoformat(item["when"]) rebuilds the date.',
        'json.dumps([asdict(s) for s in scores], default=to_jsonable, indent=2)  and  [Score(i["name"], i["points"], date.fromisoformat(i["when"])) for i in json.loads(text)]',
      ],
      solution: {
        explanation: py`\`asdict\` converts each dataclass into a plain dict (recursively, for nested dataclasses). \`json.dumps\` then handles the strings and ints itself and calls \`default\` only for the one value it doesn't understand, the \`date\`; returning \`obj.isoformat()\` gives the standard, sortable \`"YYYY-MM-DD"\` form. Raising \`TypeError\` for anything else keeps the usual error for genuinely unsupported data instead of silently writing something wrong.

Decoding is explicit: JSON gives back strings, so \`date.fromisoformat\` rebuilds the date and the \`Score(...)\` call rebuilds the object. That explicit step is also where you'd validate (missing keys raise \`KeyError\`) and where you'd handle older file versions — see [serialization](lesson:serialization).`,
        files: { 'main.py': SCORES_SOLUTION },
      },
      tests: [
        { name: 'produces a JSON array of objects', code: py`from datetime import date
raw = json.loads(scores_to_json([Score("ada", 91, date(2026, 10, 1))]))
assert raw == [{"name": "ada", "points": 91, "when": "2026-10-01"}]` },
        { name: 'is indented with indent=2', code: py`from datetime import date
assert '\n  {' in scores_to_json([Score("ada", 91, date(2026, 10, 1))])` },
        { name: 'round-trips back to equal Score objects', code: py`from datetime import date
board = [Score("ada", 91, date(2026, 10, 1)), Score("ben", 78, date(2026, 10, 2))]
assert scores_from_json(scores_to_json(board)) == board` },
        { name: 'dates come back as date objects', code: py`from datetime import date
back = scores_from_json('[{"name": "cy", "points": 5, "when": "2026-01-31"}]')
assert back[0].when == date(2026, 1, 31)` },
        { name: 'an empty board works', code: py`assert scores_from_json(scores_to_json([])) == []
assert json.loads(scores_to_json([])) == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'json-data-dumps-vs-dump',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between json.dumps/json.loads and json.dump/json.load, and how do Python types map to JSON?',
      answer: 'dumps/loads convert between Python objects and a JSON string; dump/load do the same against an open file. dict ↔ object, list/tuple → array → list, str ↔ string, int/float ↔ number, True/False ↔ true/false, None ↔ null. Other types raise TypeError unless you convert them.',
      explanation: py`The **s** stands for *string*. Use \`dumps\` to send JSON over a network, log it or embed it; use \`dump\` to write a file. The mapping is lossy in places: tuples come back as lists and non-string dict keys come back as strings.`,
      whyAsked: 'JSON is everywhere in back-end and data work; this is a quick fluency check.',
      mistakes: ['Swapping load and loads', 'Saying JSON supports tuples, sets or dates', 'Forgetting that dict keys become strings'],
      followUps: ['How do you serialise a datetime?', 'Why does a tuple come back as a list?', 'What does ensure_ascii do?'],
      modelAnswer: 'dumps turns a Python object into a JSON string and loads parses a string back into Python objects; dump and load do the same thing but write to or read from an open file — the s stands for string. The mapping is: dicts become JSON objects, lists and tuples become arrays, strings, ints and floats map directly, True and False become true and false, and None becomes null. On the way back, arrays always become lists and object keys are always strings, so tuples and integer keys do not survive a round trip. Anything else, like sets, datetimes or my own classes, raises TypeError unless I convert it, for example with the default parameter.',
    },
    {
      id: 'json-data-roundtrip',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why?',
      code: { lang: 'python', code: py`import json

data = {1: "one", "pair": (1, 2), "ok": True}
back = json.loads(json.dumps(data))
print(back)
print(back == data)` },
      options: [
        "{1: 'one', 'pair': (1, 2), 'ok': True} / True",
        "{'1': 'one', 'pair': [1, 2], 'ok': True} / False",
        "{'1': 'one', 'pair': [1, 2], 'ok': 'true'} / False",
        'TypeError: keys must be str',
      ],
      correctOption: 1,
      answer: "`{'1': 'one', 'pair': [1, 2], 'ok': True}` then `False`: the int key became a string and the tuple became a list. Booleans survive.",
      explanation: py`JSON object keys must be strings, so \`json.dumps\` converts int/float/bool/None keys with \`str\`-like rules (\`1\` → \`"1"\`, \`True\` → \`"true"\`). JSON arrays always decode to lists. \`True\` → \`true\` → \`True\` round-trips fine.`,
      whyAsked: 'Exposes whether you understand that serialisation formats have their own type systems — a frequent source of cache and API bugs.',
      mistakes: ['Expecting a lossless round trip', 'Thinking dumps rejects int keys', 'Thinking booleans become strings'],
      followUps: ['How would you make this round trip lossless?', 'What happens to a key of True? Of None?', 'Which serialisation format would preserve tuples?'],
      modelAnswer: "It prints a dict with the string key '1', the list [1, 2] and ok still True, and then False. JSON only allows string keys, so dumps converts the integer key 1 into the string \"1\", and JSON has no tuple type, so the tuple is written as an array and loads gives back a list. Booleans map to true and false and come back as True and False. So the round trip is lossy. To make it reliable I would either keep data in JSON-friendly shapes or convert explicitly after loading, ideally into a dataclass that knows its own types.",
    },
    {
      id: 'json-data-datetime',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'An endpoint crashes with `TypeError: Object of type datetime is not JSON serializable` when returning `{"user": "ada", "last_login": datetime.now(timezone.utc)}`. Fix it properly, and explain what happens on the reading side.',
      answer: 'Convert the datetime to an ISO 8601 string before or during encoding — value.isoformat() or a default= hook / JSONEncoder subclass — preferably timezone-aware UTC. JSON has no date type, so the reader gets a string and must parse it back explicitly with datetime.fromisoformat().',
      explanation: py`\`default=\` is called only for objects the encoder can't handle; return \`obj.isoformat()\` for \`datetime\`/\`date\` and raise \`TypeError\` for anything else so genuine mistakes still fail. Avoid \`default=str\`: it "works" for everything, including objects you never meant to expose. ISO 8601 with an offset (\`2026-10-24T09:30:00+00:00\`) is unambiguous and sorts correctly as text.`,
      code: { lang: 'python', code: py`import json
from datetime import datetime, timezone


def to_jsonable(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


body = json.dumps({"user": "ada", "last_login": datetime(2026, 10, 24, 9, 30, tzinfo=timezone.utc)}, default=to_jsonable)
print(body)   # {"user": "ada", "last_login": "2026-10-24T09:30:00+00:00"}
when = datetime.fromisoformat(json.loads(body)["last_login"])
print(when.tzinfo)   # UTC` },
      whyAsked: 'Dates are the most common non-JSON type in real APIs; the answer reveals whether you think about both encoding and decoding, and about time zones.',
      mistakes: ['default=str everywhere (silently serialises anything)', 'Naive local datetimes without a time zone', 'Assuming json.loads gives back a datetime'],
      followUps: ['Why ISO 8601 rather than a Unix timestamp?', 'How would you handle Decimal money values?', 'How do frameworks like FastAPI/Pydantic do this?'],
      modelAnswer: 'JSON has no date type, so the encoder refuses datetime objects. I would convert them to ISO 8601 strings, either explicitly before building the response or with a default function passed to json.dumps that returns isoformat for datetimes and raises TypeError for anything else, so real mistakes still fail. I would make the datetime timezone-aware in UTC so the string carries its offset. On the reading side, JSON gives back a plain string, so the consumer has to parse it with datetime.fromisoformat — nothing converts it automatically. I would avoid default=str because it quietly serialises objects I never meant to expose.',
    },
    {
      id: 'json-data-get-path',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Parsed API responses are deeply nested. Write `get_path(data, path, default=None)` that follows a dotted path such as `"customer.tags.0"` through dicts (by key) and lists (by numeric index), returning `default` if any step is missing.',
      answer: 'Split the path on ".", walk one key at a time: dict → look up the key if present; list → if the key is digits and in range, index it; otherwise return default. Return the final value.',
      explanation: py`Parsed JSON contains only dicts, lists and scalars, so two cases cover navigation. Checking membership/range instead of catching every exception keeps the logic explicit and avoids hiding bugs. Real code might use a library (\`glom\`, \`jmespath\`) or — better for stable schemas — validate the response into typed objects once.`,
      starter: { files: { 'main.py': GET_PATH_START } },
      tests: [
        { name: 'follows dict keys', code: py`assert get_path(order, "customer.name") == "Ada"` },
        { name: 'follows list indexes', code: py`assert get_path(order, "items.0.sku") == "A1"
assert get_path(order, "customer.tags.1") == "new"` },
        { name: 'missing keys give the default', code: py`assert get_path(order, "customer.phone", "unknown") == "unknown"
assert get_path(order, "customer.phone") is None` },
        { name: 'bad or out-of-range indexes give the default', code: py`assert get_path(order, "items.5.sku") is None
assert get_path(order, "items.first") is None` },
        { name: 'cannot descend into a scalar', code: py`assert get_path(order, "id.x", 0) == 0` },
        { name: 'falsy values are returned, not replaced by the default', code: py`assert get_path({"a": {"b": 0}}, "a.b", 99) == 0` },
      ],
      solution: { files: { 'main.py': GET_PATH_SOLUTION } },
      hints: ['path.split(".") gives the steps. Keep a variable current that moves one level deeper each step.', 'For lists, key.isdigit() tells you if the step is an index; check int(key) < len(current) before indexing.'],
      whyAsked: 'Tests safe navigation of untrusted, irregular data — daily work with JSON APIs — and attention to edge cases (falsy values, wrong types).',
      mistakes: ['Wrapping everything in try/except Exception', 'Returning default when the value is falsy (0, "", False)', 'Forgetting lists'],
      followUps: ['How would you support keys that contain dots?', 'When would you validate into a dataclass/Pydantic model instead?'],
      modelAnswer: 'I split the path on dots and walk the data one step at a time with a current variable. If current is a dict and contains the key, I descend into it; if it is a list, the step is all digits and the index is in range, I index into it; in every other case — missing key, bad index, or trying to descend into a string or number — I return the default. At the end I return current, which correctly returns falsy values like 0 instead of treating them as missing. For stable schemas I would rather validate the whole response once into typed objects than poke around with paths.',
    },
    {
      id: 'json-data-untrusted',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `json.loads`, `pickle.loads` and `eval` for reading data that arrives from users over the network.',
      answer: 'json.loads only builds plain data and is the right choice — then validate the shape and cap the size. pickle.loads can execute arbitrary code during loading, so never use it on untrusted bytes. eval executes arbitrary Python expressions and also can\'t parse real JSON (true/null) — never use it for data.',
      explanation: py`Safety comes from what the parser is *able* to create. JSON's grammar only produces dict/list/str/int/float/bool/None. Pickle is a small program for a stack machine that can import and call any callable (e.g. \`os.system\`), which is how pickle exploits work. \`eval\` runs code directly. Even with JSON, attackers control shape and size: validate types and required fields, and limit body sizes (Python 3.11+ also caps int conversion at 4300 digits by default to block one DoS vector).`,
      whyAsked: 'Insecure deserialisation is on the OWASP Top 10; interviewers want to hear the distinction between "can\'t run code" and "can be trusted".',
      mistakes: ['Saying JSON is safe so no validation is needed', 'Thinking pickle is fine if you "check the type afterwards" (the code already ran)', 'Using ast.literal_eval for JSON (wrong grammar: true/false/null)'],
      followUps: ['How does a pickle exploit actually execute code?', 'What would you use to validate JSON request bodies?', 'How would you sign data you must pickle?'],
      modelAnswer: 'For untrusted input I would only use json.loads. Its grammar can only produce dicts, lists, strings, numbers, booleans and None, so a malicious document cannot run code. pickle.loads is the opposite: a pickle is effectively a little program that can import and call arbitrary functions while loading, so unpickling attacker data is remote code execution, and checking the result afterwards is too late. eval simply executes Python, and it cannot even parse real JSON because of true and null. But safe to parse is not safe to trust: I would still validate the structure and types, for example with a schema or Pydantic, and cap the request size.',
    },
    {
      id: 'json-data-big-export',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A nightly job exports ~50 million order records as one giant JSON array; the consumer runs out of memory loading it and a single bad record ruins the whole file. How would you redesign the format and the code?',
      answer: 'Switch to JSON Lines: one compact JSON object per line, written and read incrementally (for line in f: json.loads(line)). Memory stays constant, records can be appended, bad lines can be skipped and reported, and the file can be split or compressed. Add a schema version per record and write atomically.',
      explanation: py`\`json.load\` builds the entire document in memory, and a JSON array is only valid once its closing \`]\` is written — a crash mid-export invalidates everything. JSON Lines (\`.jsonl\`/NDJSON) is streamable both ways, works with \`gzip.open(path, "wt", encoding="utf-8")\`, and is easy to split for parallel processing. For a single legacy giant array, an incremental parser (e.g. the third-party \`ijson\`) can stream it. If consumers mostly query or aggregate, a columnar format like Parquet or a database is the better destination.`,
      code: { lang: 'python', code: py`import json


def export(orders, path):
    with open(path, "w", encoding="utf-8") as f:
        for order in orders:                         # orders can be a generator
            f.write(json.dumps(order, separators=(",", ":")) + "\n")


def read(path):
    with open(path, encoding="utf-8") as f:
        for number, line in enumerate(f, start=1):
            try:
                yield json.loads(line)
            except json.JSONDecodeError as e:
                print(f"skipping line {number}: {e.msg}")


export(({"id": i, "total": i * 10} for i in range(3)), "orders.jsonl")
print(sum(o["total"] for o in read("orders.jsonl")))   # 30` },
      whyAsked: 'Probes data-engineering judgement: memory, failure isolation, streaming and format choice.',
      mistakes: ['Just "add more RAM"', 'Splitting the JSON array text manually', 'Ignoring partial-write failures'],
      followUps: ['How would you make the export resumable?', 'When would you choose Parquet or a database instead?', 'How would you version the record schema?'],
      modelAnswer: 'A single JSON array forces the consumer to hold the whole document in memory, and it is only valid once the final bracket is written, so one crash or one corrupt record breaks everything. I would switch to JSON Lines: one compact JSON object per line. The producer writes records from a generator, the consumer streams with for line in f and json.loads per line, so memory is constant, bad lines can be logged and skipped, and the file can be gzipped, split or appended to. I would add a schema version field per record and write to a temp file that is renamed when complete. If consumers mainly run analytics, I would consider Parquet or loading into a database instead.',
    },
    {
      id: 'json-data-numbers',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A payments service sends `{"order_id": 9007199254740993, "amount": 0.1}` to a JavaScript front-end and a Python reconciliation job. The front-end shows the wrong order ID and totals drift by fractions of a cent. Explain both problems and how to design the payload.',
      answer: 'JSON numbers have no defined precision; JavaScript parses them as 64-bit floats, which only represent integers exactly up to 2**53, so the ID changes. Binary floats can\'t represent 0.1 exactly, so sums drift. Send IDs as strings, and money as integer minor units (cents) or decimal strings; in Python parse with parse_float=Decimal if decimals must be read.',
      explanation: py`Python parses \`9007199254740993\` as an exact \`int\`, so the Python job is fine — the JS client isn't (it shows \`9007199254740992\`). The JSON spec leaves precision to implementations, and RFC 8259 recommends staying within the range of IEEE 754 doubles for interoperability. For amounts, \`json.loads(text, parse_float=Decimal)\` keeps \`0.1\` exact in Python, but the safest contract is \`{"amount_cents": 10, "currency": "GBP"}\`.`,
      code: { lang: 'python', code: py`import json
from decimal import Decimal

print(json.loads("0.1") + json.loads("0.2"))                 # 0.30000000000000004
print(json.loads("0.1", parse_float=Decimal) + json.loads("0.2", parse_float=Decimal))   # 0.3
print(json.dumps({"order_id": str(9007199254740993), "amount_cents": 10}))` },
      whyAsked: 'Shows awareness that the same JSON is interpreted differently by different languages — a real source of financial and ID bugs.',
      mistakes: ['Blaming Python for the JS precision issue', 'Rounding at display time as the "fix"', 'Sending money as floats'],
      followUps: ['How does Decimal differ from float?', 'Why do Twitter/X-style APIs return id_str fields?', 'How would you serialise Decimal with json.dumps?'],
      modelAnswer: 'JSON itself has just "number", and each language decides how to store it. JavaScript uses 64-bit floats, which represent integers exactly only up to 2 to the 53rd, so the order ID silently changes on the front-end, even though Python reads it exactly. The cents drift is the classic binary floating-point problem: 0.1 has no exact binary representation, so sums accumulate error. I would send identifiers as strings and money as integer minor units with a currency, or as decimal strings. On the Python side, if I must read decimal numbers, I parse with parse_float=Decimal and do arithmetic in Decimal.',
    },
  ],

  takeaways: [
    'JSON is text with six kinds of value: object, array, string, number, true/false, null.',
    'dumps/loads work with strings, dump/load with files (opened with encoding="utf-8").',
    'Round trips are lossy: tuples come back as lists and dict keys always come back as strings.',
    'Sets, dates, Decimals, bytes and your classes need converting — default= on the way out, explicit code on the way in.',
    'json.JSONDecodeError (a ValueError) tells you msg, lineno and colno — show them to whoever must fix the file.',
    'Parsing JSON never runs code, so it is fine for untrusted input — but validate the shape and limit the size.',
    'Use indent/sort_keys/ensure_ascii=False for human-facing files, JSON Lines for big or streaming data.',
  ],
}
