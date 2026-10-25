// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GAME_SAVE = py`# One game save, three formats: TOML (read-only), JSON and pickle
import json
import pickle
import tomllib
from dataclasses import asdict
from datetime import date
from pathlib import Path

from models import Player

SAVE_VERSION = 2


def to_json(player):
    data = asdict(player)
    data["position"] = list(player.position)       # JSON has no tuples...
    data["badges"] = sorted(player.badges)         # ...no sets...
    data["joined"] = player.joined.isoformat()     # ...and no dates
    return json.dumps({"version": SAVE_VERSION, "player": data}, indent=2)


def from_json(text):
    p = json.loads(text)["player"]
    return Player(p["name"], p["level"], tuple(p["position"]),
                  set(p["badges"]), date.fromisoformat(p["joined"]))


with open("config.toml", "rb") as f:               # tomllib needs binary mode
    config = tomllib.load(f)
print("Playing", config["game"]["title"], "- autosave every",
      config["save"]["autosave_minutes"], "minutes")

ada = Player("Ada", 7, (3, 4), {"explorer", "speedrun"}, date(2026, 3, 14))

Path("save.json").write_text(to_json(ada), encoding="utf-8")
Path("save.pickle").write_bytes(pickle.dumps(ada))

from_j = from_json(Path("save.json").read_text(encoding="utf-8"))
from_p = pickle.loads(Path("save.pickle").read_bytes())
print("JSON   equal after round trip?", from_j == ada, "|", Path("save.json").stat().st_size, "bytes of text")
print("pickle equal after round trip?", from_p == ada, "|", Path("save.pickle").stat().st_size, "bytes of binary")
print(Path("save.json").read_text(encoding="utf-8"))
print(Path("save.pickle").read_bytes()[:40], "...")
`

const MODELS = py`"""The game's data model. Classes you pickle should live in an importable module."""
from dataclasses import dataclass, field
from datetime import date


@dataclass
class Player:
    name: str
    level: int
    position: tuple
    badges: set = field(default_factory=set)
    joined: date = date(2026, 1, 1)
`

const CONFIG_TOML = py`# Game settings. TOML allows comments - JSON doesn't.
[game]
title = "Dungeon Dash"
difficulty = "normal"

[save]
autosave_minutes = 5
formats = ["json", "pickle"]
`

const STORY = py`The cat sat on the mat.
The dog sat on the cat.
Nobody sat on the dog, which was the best part of the day.
`

const CACHE_START = py`import pickle
from collections import Counter
from pathlib import Path


def cached(path, compute):
    """Return the result pickled at path, or compute() it, pickle it there and return it."""
    # TODO: load from path if the file exists, otherwise compute and save
    return compute()


def word_counts():
    print("computing word counts...")
    text = Path("story.txt").read_text(encoding="utf-8").lower()
    return Counter(text.replace(".", " ").replace(",", " ").split())


first = cached("counts.pickle", word_counts)
second = cached("counts.pickle", word_counts)     # should NOT compute again
print(first.most_common(3))
print(first == second, type(second).__name__)
`

const CACHE_SOLUTION = py`import pickle
from collections import Counter
from pathlib import Path


def cached(path, compute):
    """Return the result pickled at path, or compute() it, pickle it there and return it."""
    try:
        with open(path, "rb") as f:            # binary mode: pickles are bytes
            return pickle.load(f)
    except FileNotFoundError:
        pass
    result = compute()
    with open(path, "wb") as f:
        pickle.dump(result, f)
    return result


def word_counts():
    print("computing word counts...")
    text = Path("story.txt").read_text(encoding="utf-8").lower()
    return Counter(text.replace(".", " ").replace(",", " ").split())


first = cached("counts.pickle", word_counts)
second = cached("counts.pickle", word_counts)     # should NOT compute again
print(first.most_common(3))
print(first == second, type(second).__name__)
`

const VERSIONED_START = py`import json

CURRENT_VERSION = 2


def save_settings(settings):
    """Return JSON text for settings, wrapped as {"version": 2, "settings": {...}}."""
    # TODO
    return json.dumps(settings)


def load_settings(text):
    """Return the settings dict from JSON text written by any supported version."""
    # TODO: version 1 files are a flat dict (no "version") and call the theme "colour"
    return json.loads(text)


old_file = '{"colour": "dark", "volume": 7}'
new_file = save_settings({"theme": "light", "volume": 3})
print(new_file)
print(load_settings(old_file))
print(load_settings(new_file))
`

const VERSIONED_SOLUTION = py`import json

CURRENT_VERSION = 2


def save_settings(settings):
    """Return JSON text for settings, wrapped as {"version": 2, "settings": {...}}."""
    return json.dumps({"version": CURRENT_VERSION, "settings": settings})


def upgrade_v1(doc):
    """Version 1 was a flat dict whose theme key was called "colour"."""
    settings = dict(doc)
    if "colour" in settings:
        settings["theme"] = settings.pop("colour")
    return {"version": 2, "settings": settings}


def load_settings(text):
    """Return the settings dict from JSON text written by any supported version."""
    doc = json.loads(text)
    version = doc.get("version", 1)       # files from before versions existed
    if version == 1:
        doc = upgrade_v1(doc)
        version = doc["version"]
    if version != CURRENT_VERSION:
        raise ValueError(f"unsupported settings version: {version}")
    return doc["settings"]


old_file = '{"colour": "dark", "volume": 7}'
new_file = save_settings({"theme": "light", "volume": 3})
print(new_file)
print(load_settings(old_file))
print(load_settings(new_file))
`

const SIGNED_START = py`import hashlib
import hmac
import pickle

SECRET_KEY = b"change-me: load this from a secret store"


def dumps_signed(obj, key):
    """Pickle obj and prefix the bytes with an HMAC-SHA256 tag."""
    # TODO
    return pickle.dumps(obj)


def loads_signed(blob, key):
    """Check the tag; raise ValueError if it doesn't match, else unpickle."""
    # TODO
    return pickle.loads(blob)


blob = dumps_signed({"user": "ada", "cart": ["tea", "cake"]}, SECRET_KEY)
print(loads_signed(blob, SECRET_KEY))
`

const SIGNED_SOLUTION = py`import hashlib
import hmac
import pickle

SECRET_KEY = b"change-me: load this from a secret store"
TAG_SIZE = 32   # bytes in a SHA-256 digest


def dumps_signed(obj, key):
    """Pickle obj and prefix the bytes with an HMAC-SHA256 tag."""
    data = pickle.dumps(obj)
    tag = hmac.new(key, data, hashlib.sha256).digest()
    return tag + data


def loads_signed(blob, key):
    """Check the tag; raise ValueError if it doesn't match, else unpickle."""
    tag, data = blob[:TAG_SIZE], blob[TAG_SIZE:]
    expected = hmac.new(key, data, hashlib.sha256).digest()
    if not hmac.compare_digest(tag, expected):
        raise ValueError("signature mismatch: refusing to unpickle")
    return pickle.loads(data)


blob = dumps_signed({"user": "ada", "cart": ["tea", "cake"]}, SECRET_KEY)
print(loads_signed(blob, SECRET_KEY))
`

export default {
  id: 'serialization',
  title: 'Serialization: pickle, safety & choosing a format',
  summary: 'Serialization turns objects into bytes or text you can store and send; pickle can save almost any Python object but must never load untrusted data, so choose between JSON, CSV, TOML, pickle and SQLite by job — and version your formats.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['json-data', 'csv-data'],
  related: ['reading-writing-files', 'pathlib', 'dataclasses', 'secure-practices', 'sql-and-sqlite', 'packaging', 'modules-and-imports', 'mutability-and-copying', 'secrets-and-passwords', 'database-patterns', 'project-expense-tracker'],
  tags: ['serialization', 'deserialization', 'pickle', 'protocol', 'unpickling', 'security', 'remote code execution', '__reduce__', 'hmac', 'tomllib', 'TOML', 'shelve', 'sqlite', 'JSON', 'CSV', 'dataclasses', 'schema versioning', 'migration', 'file format'],
  apis: [
    { name: 'pickle.dumps(obj, protocol=None) / pickle.loads(data)', summary: 'Python object ↔ bytes. Never call loads on data you don\'t trust.' },
    { name: 'pickle.dump(obj, f) / pickle.load(f)', summary: 'Same, to/from a file opened in binary mode ("wb" / "rb").' },
    { name: 'pickle.DEFAULT_PROTOCOL / HIGHEST_PROTOCOL', summary: 'The pickle format version used by default (5 since Python 3.14; 4 in 3.8–3.13) and the newest available.' },
    { name: '__getstate__ / __setstate__ / __reduce__', summary: 'Hooks that control how an object is pickled and rebuilt.' },
    { name: 'tomllib.load(f) / tomllib.loads(s)', summary: 'Read TOML (Python 3.11+). The file must be opened in binary mode. There is no writer in the standard library.' },
    { name: 'shelve.open(filename)', summary: 'A persistent dict-like object: string keys, pickled values (same security rules as pickle).' },
    { name: 'hmac.new(key, msg, hashlib.sha256) / hmac.compare_digest', summary: 'Authenticate bytes with a secret key, and compare tags in constant time.' },
    { name: 'dataclasses.asdict(obj)', summary: 'Turns a dataclass into a dict — the first step to saving it as JSON.' },
  ],
  docs: [
    { label: 'pickle — Python object serialization', url: 'https://docs.python.org/3/library/pickle.html' },
    { label: 'pickle — data stream format and protocols', url: 'https://docs.python.org/3/library/pickle.html#data-stream-format' },
    { label: 'tomllib — parse TOML files', url: 'https://docs.python.org/3/library/tomllib.html' },
    { label: 'shelve — Python object persistence', url: 'https://docs.python.org/3/library/shelve.html' },
    { label: 'Data persistence (the standard library overview)', url: 'https://docs.python.org/3/library/persistence.html' },
    { label: 'hmac — keyed hashing for message authentication', url: 'https://docs.python.org/3/library/hmac.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Serialization** means turning objects that live in your program's memory into a sequence of **bytes or text** that can be saved to a file, sent over a network, or stored in a database. **Deserialization** is the reverse: rebuilding objects from those bytes. You've already done it twice — with [JSON](lesson:json-data) and [CSV](lesson:csv-data).`,
    py`Python also has its own, Python-only format: **pickle**. It can save almost any Python object — tuples, sets, dates, your own classes, even objects that refer to each other — and bring them back exactly. That power comes with a serious danger: **loading a pickle can run code**, so you must never unpickle data from someone you don't trust.`,
    { code: py`import pickle

order = {"items": ("tea", "cake"), "tags": {"gift"}, "paid": False}
blob = pickle.dumps(order)          # dict -> bytes
print(type(blob).__name__)          # bytes
print(pickle.loads(blob) == order)  # True — tuple and set survived`, lang: 'python', title: 'pickle in four lines' },
    py`The real skill isn't one module — it's **choosing a format** for each job: JSON for exchanging data, CSV for tables, TOML for hand-edited config, pickle for trusted Python-only caches, and a database like [SQLite](lesson:sql-and-sqlite) when you need to query and update. And whatever you choose, plan for the day the format changes: **version it**.`,
  ],
  why: [
    py`Objects in memory disappear when the program stops, and they can't travel: memory addresses mean nothing to another process or another computer. Every time you save a game, cache a slow computation, send a message to a server or store settings, something must serialise your objects.`,
    py`Formats are long-term decisions. A file written today may be read by a newer version of your program next year, by a colleague's program in another language, or by an attacker trying to break in. The format decides what survives the trip (types? shared references?), who can read it (humans? other languages?), and whether reading it is **safe**.`,
    py`Insecure deserialization is a well-known vulnerability class (it's on the OWASP Top 10 lists). Knowing *why* pickle is dangerous — and what to use instead — is the kind of judgement that separates a script from production code.`,
  ],
  eli15: [
    py`Imagine building a LEGO castle and wanting to send it to a friend. You can't post it assembled, so you write down how to rebuild it. That's **serialization**. Your friend following the instructions is **deserialization**.`,
    py`There are different instruction styles. A *photo with labels* (JSON) is something anyone can read. A *table of bricks* (CSV) is great for simple lists. A *secret LEGO-robot code* (pickle) rebuilds anything perfectly — but the robot obeys **every** command in the code, including "and now set the house on fire". So you only feed it instructions you wrote yourself.`,
  ],
  analogy: {
    title: 'Packing for a move',
    body: [
      py`Moving house, you pack everything into boxes (serialise) and unpack at the new place (deserialise). How you pack depends on the item and on who'll unpack it. **Labelled clear boxes** (JSON) are easy for anyone to check. A **spreadsheet inventory** (CSV) is perfect for a list of identical things. A **typed note on the fridge** (TOML) is for settings people adjust by hand. A **sealed self-assembling kit** (pickle) rebuilds the furniture exactly, wiring included — but it does whatever its built-in instructions say, so you never accept one from a stranger.`,
      py`And if you redesign your furniture next year, last year's boxes still need to unpack correctly — that's why boxes get a **version label**.`,
    ],
    mapping: [
      ['packing / unpacking', 'serialising / deserialising'],
      ['labelled clear boxes anyone can inspect', 'JSON: readable, any language, safe to open'],
      ['a spreadsheet inventory', 'CSV: flat tables'],
      ['a note people edit by hand', 'TOML: configuration with comments'],
      ['a sealed self-assembling kit', 'pickle: rebuilds any Python object — and can run code while doing it'],
      ['a filing cabinet you search and update drawer by drawer', 'SQLite: query and change records without rewriting everything'],
      ['the version label on each box', 'a "version" field in your file format'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'pickle rebuilds objects — and the links between them',
    props: {
      code: py`import pickle
from dataclasses import dataclass


@dataclass
class Pet:
    name: str
    tricks: list


rex = Pet("Rex", ["sit", "roll"])
pets = [rex, rex]                  # the same object twice
blob = pickle.dumps(pets)
print(type(blob).__name__, len(blob) > 0)

copy = pickle.loads(blob)
print(copy)
print(copy[0] == rex, copy[0] is rex)
print(copy[0] is copy[1])          # sharing survives
`,
      inline: false,
      notes: {
        12: 'Both list slots point at **one** `Pet` object.',
        13: '`dumps` walks the objects and writes bytes. It records the class **by name** (`__main__.Pet`), not its code.',
        16: '`loads` builds brand-new objects: a new list, a new `Pet`, a new list of tricks.',
        18: 'Equal (same data) but not identical (a different object from `rex`).',
        19: 'pickle remembered that both slots were the **same** object, so the copy shares one `Pet` too. JSON would have produced two separate dicts.',
      },
    },
    alt: 'A step-by-step trace. A Pet dataclass instance rex is put in a list twice. pickle.dumps turns the list into bytes. pickle.loads builds a new list whose two slots point to one new Pet object: it equals rex but is not rex, and copy[0] is copy[1] is True.',
    caption: py`Watch the arrows after \`loads\`: new objects, same shape — including the fact that two slots shared one object. That's something JSON and CSV can't express.`,
  },
  syntax: [
    py`#### pickle: the four functions`,
    py`| | to/from **bytes** | to/from a **binary file** |
|---|---|---|
| object → pickle | \`pickle.dumps(obj)\` | \`pickle.dump(obj, f)\` |
| pickle → object | \`pickle.loads(data)\` | \`pickle.load(f)\` |`,
    { code: py`import pickle
from datetime import date

progress = {"level": 7, "checkpoints": {(3, 4), (9, 1)}, "started": date(2026, 3, 14)}

with open("progress.pickle", "wb") as f:     # "wb": pickles are bytes, not text
    pickle.dump(progress, f)

with open("progress.pickle", "rb") as f:     # "rb" to read them back
    loaded = pickle.load(f)

print(loaded == progress)                    # True: set of tuples and date intact`, lang: 'python', title: 'saving and loading with pickle' },
    py`#### What pickle can and can't do`,
    py`- ✓ Built-in types (including tuples, sets, frozensets, bytes), \`datetime\`, \`Decimal\`, \`Counter\`, dataclasses and ordinary class instances, nested and shared structures, even reference cycles.
- ✓ Functions and classes — **by name only**: the pickle stores \`models.Player\`, not the code, so the class must be importable with the same module and name when you load.
- ✗ Lambdas and functions defined inside other functions: \`PicklingError: Can't pickle <function <lambda> ...>\`.
- ✗ Live resources: open files (\`TypeError: cannot pickle 'TextIOWrapper' instances\`), sockets, locks, database connections, generators.`,
    py`#### Protocols`,
    py`The pickle format has versions called **protocols**, 0 to 5. Higher protocols are more compact and support more features (protocol 4 added very large objects, protocol 5 out-of-band buffers for big binary data). \`pickle.DEFAULT_PROTOCOL\` is **5 since Python 3.14** (it was 4 from 3.8 to 3.13). Newer Pythons read older protocols, but a protocol-5 pickle can't be read by Python older than 3.8 — pass \`protocol=4\` if an older interpreter must read your files.`,
    { callout: 'warn', title: 'Never unpickle untrusted data', text: py`The Python docs put it in a red box: *"The pickle module is not secure. Only unpickle data you trust. It is possible to construct malicious pickle data which will execute arbitrary code during unpickling."* That includes pickles from uploads, cookies, network messages, shared caches other people can write to, and files downloaded from the internet. Use JSON for those.` },
    py`#### TOML: configuration for humans (read-only in the stdlib)`,
    { code: py`[game]
title = "Dungeon Dash"
difficulty = "normal"      # comments are allowed

[save]
autosave_minutes = 5
formats = ["json", "pickle"]
release = 2026-03-14       # a real date type`, lang: 'toml', title: 'config.toml' },
    { code: py`import tomllib    # Python 3.11+

with open("config.toml", "rb") as f:          # binary mode is required
    config = tomllib.load(f)

print(config["save"]["autosave_minutes"])     # 5 (an int)`, lang: 'python', title: 'reading TOML', static: true },
    py`TOML (*Tom's Obvious Minimal Language*) is what \`pyproject.toml\` is written in (see [packaging](lesson:packaging)). It has comments, dates and clear sections, which makes it ideal for files people edit. **\`tomllib\` (3.11+) only reads**; to write TOML you need a third-party package such as \`tomli-w\`. Opening the file in text mode raises a \`TypeError\` that tells you to use binary mode, \`open('foo.toml', 'rb')\`.`,
    py`#### shelve: a dict that lives on disk`,
    { code: py`import shelve

with shelve.open("highscores") as db:      # creates highscores.db (or several files)
    db["ada"] = {"best": 9100, "badges": {"explorer"}}

with shelve.open("highscores") as db:
    print(db["ada"]["best"])               # 9100`, lang: 'python', title: 'shelve (not runnable in this sandbox)', static: true },
    py`A **shelf** is a persistent dictionary: keys are strings, values are anything picklable, stored in a small database file via the \`dbm\` module. It's handy for quick scripts, but it inherits pickle's security rules, isn't safe for several processes writing at once, and its file format depends on the platform. The browser sandbox has no \`dbm\`, so this example is static. For anything serious, use [sqlite3](lesson:sql-and-sqlite).`,
  ],
  walkthrough: {
    title: 'Reading the three-format game save',
    lang: 'python',
    code: GAME_SAVE,
    intro: py`This is the playground program; \`models.py\` (the \`Player\` dataclass) and \`config.toml\` are in the other tabs. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [9, 9], text: py`\`Player\` lives in its own module, \`models.py\`. That matters for pickle: a pickle stores the class as "\`models.Player\`", so whoever loads it must be able to \`import models\`.` },
      { lines: [14, 19], text: py`To save as JSON we convert by hand: \`asdict\` gives a dict, then the tuple becomes a list, the set a **sorted** list (stable output) and the date an ISO string. The document gets a \`"version"\` field so future code can tell old saves from new ones.` },
      { lines: [22, 25], text: py`Loading JSON is the mirror image: rebuild the tuple, the set and the date explicitly. JSON never guesses types; your code decides.` },
      { lines: [28, 31], text: py`\`tomllib.load\` reads the TOML config. Note \`"rb"\` — tomllib insists on binary mode and decodes UTF-8 itself. TOML's \`5\` arrives as an \`int\`, its strings as \`str\`.` },
      { lines: [35, 36], text: py`The same player saved twice. JSON needs our conversion functions; pickle takes the object as it is: \`pickle.dumps(ada)\` → bytes.` },
      { lines: [38, 41], text: py`Both round trips give an equal \`Player\`. The JSON file is readable by humans and any language; the pickle is smaller here but binary, Python-only — and only safe to load because *we* wrote it.` },
      { lines: [42, 43], text: py`Peek inside both files. The pickle bytes start with \`\x80\x05\` (protocol 5) and contain the text \`models\` and \`Player\`: the class is stored **by name**, not by code.` },
    ],
  },
  playground: {
    title: 'One save, three formats',
    objective: 'Read settings from TOML, save the same dataclass as JSON and as pickle, load both back and compare what each format needs and produces.',
    files: { 'main.py': GAME_SAVE, 'models.py': MODELS, 'config.toml': CONFIG_TOML },
    expected: py`\`\`\`text
Playing Dungeon Dash - autosave every 5 minutes
JSON   equal after round trip? True | 199 bytes of text
pickle equal after round trip? True | 155 bytes of binary
{
  "version": 2,
  "player": {
    "name": "Ada",
    ...
    "joined": "2026-03-14"
  }
}
b'\x80\x05\x95\x90\x00\x00\x00\x00\x00\x00\x00\x8c\x06models\x94\x8c\x06Player\x94...' ...
\`\`\`

The byte counts are measured live and depend on the data, so treat them as an example, not a rule: for other data the pickle can be larger than the JSON. Files are written to an in-memory file system that is reset before every run.`,
    experiments: [
      {
        id: 'add-field',
        task: py`The game adds **coins**. In \`models.py\` add a field \`coins: int = 0\` (at the end), give Ada \`coins=250\`, bump \`SAVE_VERSION\` to \`3\`, and make \`from_json\` read coins with a default of \`0\` so **old version-2 saves still load**.`,
        hint: py`\`asdict\` already includes the new field when saving. In \`from_json\`, pass \`coins=p.get("coins", 0)\` to \`Player(...)\`. Create Ada with \`Player(..., date(2026, 3, 14), coins=250)\`.`,
        tests: [
          { name: 'Ada has 250 coins after a JSON round trip', code: py`assert getattr(from_j, "coins", None) == 250` },
          { name: 'an old version-2 save (no coins) still loads, with 0 coins', code: py`old = '{"version": 2, "player": {"name": "Ben", "level": 1, "position": [0, 0], "badges": [], "joined": "2026-01-01"}}'
assert from_json(old).coins == 0` },
          { name: 'SAVE_VERSION is 3', code: py`assert SAVE_VERSION == 3` },
        ],
        explain: py`This is **schema evolution**: the shape of your data changes while old files still exist. A version number tells readers which shape they're looking at, and defaults (\`.get("coins", 0)\`) let new code read old files. Pickle has the same problem in a sneakier form: an old pickled \`Player\` simply has no \`coins\` attribute, because unpickling doesn't call \`__init__\` — so the default never applies.`,
      },
      {
        id: 'evil-pickle',
        task: py`See why untrusted pickles are dangerous — safely. At the end of \`main.py\`, define a class \`Sneaky\` with a method \`__reduce__(self)\` that returns \`(print, ("I ran while unpickling!",))\`. Pickle an instance with \`pickle.dumps\`, then call \`pickle.loads\` on the bytes.`,
        hint: py`\`\`\`python
class Sneaky:
    def __reduce__(self):
        return (print, ("I ran while unpickling!",))

payload = pickle.dumps(Sneaky())
pickle.loads(payload)
\`\`\``,
        tests: [{ name: 'loading the pickle ran print()', code: py`assert "I ran while unpickling!" in output` }],
        explain: py`\`__reduce__\` tells pickle "to rebuild me, call this function with these arguments". \`loads\` obeys — it called \`print\` before you ever saw the result. An attacker can write the same bytes by hand with \`os.system\` and a shell command instead of \`print\`, no class needed on your side. That's why the rule is absolute: **never unpickle data you don't trust**. More in [secure practices](lesson:secure-practices).`,
      },
      {
        id: 'toml-lives',
        task: py`In **config.toml**, add \`lives = 3\` under \`[game]\`, and print it from \`main.py\`. Then try writing \`lives = three\` and read the error message.`,
        hint: py`Add the line after \`difficulty = "normal"\`. In Python: \`config["game"]["lives"]\`. Text values need quotes in TOML; numbers don't.`,
        tests: [{ name: 'config["game"]["lives"] is the int 3', code: py`assert config["game"].get("lives") == 3, "Add lives = 3 under [game] in config.toml"` }],
        explain: py`TOML has real types: \`3\` is an int, \`"normal"\` a string, \`2026-03-14\` a date. An unquoted word is a syntax error (\`tomllib.TOMLDecodeError: Invalid value (at line ..., column ...)\`), which is good: config mistakes are caught when the program starts, not halfway through a game.`,
      },
      {
        id: 'shared-refs',
        task: py`Make a team where Ada plays twice: \`team = [ada, ada]\`. Round-trip it through pickle (\`pickle.loads(pickle.dumps(team))\`) and through JSON (\`[from_json(to_json(p)) for p in team]\`). Store \`same_after_pickle\` and \`same_after_json\`: whether slot 0 **is** slot 1 in each copy.`,
        hint: py`\`same_after_pickle = team_p[0] is team_p[1]\` — and the same for the JSON copy.`,
        tests: [
          { name: 'pickle keeps the shared object', code: py`assert ns.get("same_after_pickle") is True` },
          { name: 'JSON makes two separate objects', code: py`assert ns.get("same_after_json") is False` },
        ],
        explain: py`pickle keeps a memo of objects it has already written, so a second reference is stored as "the same one as before" — that's also how it handles cycles. JSON is a tree of values with no notion of identity, so shared objects come back as independent copies. Usually that's fine; occasionally (graphs, caches) it's exactly the difference that matters.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Saving a dataclass: JSON vs pickle',
    props: {
      left: {
        label: 'JSON — explicit, portable, safe to load',
        lang: 'python',
        code: py`import json
from dataclasses import asdict

def save(player, path):
    data = asdict(player)
    data["joined"] = player.joined.isoformat()
    doc = {"version": 2, "player": data}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2)

def load(path):
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    p = doc["player"]
    p["joined"] = date.fromisoformat(p["joined"])
    return Player(**p)`,
      },
      right: {
        label: 'pickle — automatic, Python-only, trusted data only',
        lang: 'python',
        code: py`import pickle

def save(player, path):
    with open(path, "wb") as f:
        pickle.dump(player, f)

def load(path):
    # Only for files your own program wrote!
    with open(path, "rb") as f:
        return pickle.load(f)`,
      },
      points: [
        'pickle needs no conversion code: dates, sets, tuples and nested objects just work.',
        'JSON makes you write conversions — but those few lines are exactly where validation and version upgrades live.',
        'Anyone (any language, any human) can read the JSON file; the pickle needs Python and the same importable Player class.',
        'json.load on a hostile file can only produce bad data; pickle.load on a hostile file can run code on your machine.',
        'Renaming or moving the Player class breaks old pickles; the JSON format only changes when you decide it does.',
      ],
    },
    alt: 'Side-by-side comparison. Left: saving a Player dataclass as JSON with asdict, an ISO date and a version field, and loading it back with explicit conversion. Right: saving and loading the same object with pickle.dump and pickle.load in a few lines, with a comment that it is only for files your own program wrote.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A pickle is not a "snapshot of memory". It's a list of **instructions** for a tiny machine inside the \`pickle\` module: "push the string 'Ada'", "push the int 7", "find the class \`models.Player\`", "create an instance", "set its attributes", "stop". \`loads\` runs those instructions to rebuild the objects.`,
      py`That's both the strength and the danger. The instructions can include "**find any importable function and call it with these arguments**" — which is how pickle rebuilds complex objects, and also how a malicious pickle runs \`os.system(...)\`. There is no "safe mode" switch on \`pickle.loads\`.`,
      { code: py`import pickle
import pickletools

pickletools.dis(pickle.dumps(("Ada", 7), protocol=0))   # print the instructions`, lang: 'python', title: 'see the instructions yourself' },
    ],
    technical: [
      py`**How objects are rebuilt.** For a normal class instance, pickle stores a reference to the class (module + qualified name) and the instance's state (by default its \`__dict__\`). On loading it creates the object **without calling \`__init__\`** and then restores the state. So validation in \`__init__\` doesn't run, and attributes added to the class later are missing from old pickles.`,
      py`**Customising.** \`__getstate__\` returns what to save (e.g. drop a cache or an open file) and \`__setstate__(state)\` restores it (e.g. fill in defaults for attributes old pickles lack). \`__reduce__\` / \`__reduce_ex__\` is the general hook: return a callable plus arguments, and pickle will call it on load. The [copy module](lesson:mutability-and-copying) uses the same hooks, which is why \`copy.deepcopy\` and pickle behave alike.`,
      { code: py`class Downloader:
    def __init__(self, url):
        self.url = url
        self.connection = object()        # stands in for something unpicklable

    def __getstate__(self):
        state = self.__dict__.copy()
        del state["connection"]           # don't try to pickle the live resource
        return state

    def __setstate__(self, state):
        self.__dict__.update(state)
        self.connection = object()        # recreate it after loading`, lang: 'python', title: '__getstate__ / __setstate__' },
      py`**Identity.** The pickler keeps a *memo* of objects it has already written. A second reference becomes a back-reference, so shared objects stay shared and cycles don't loop forever. JSON and CSV have no such concept.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython ships a C accelerator (\`_pickle\`) that \`pickle\` uses automatically, plus the pure-Python reference implementation. The *format* is specified by the protocol documentation and shared by all implementations; speed and some error-message wording differ. The separate \`marshal\` module is what CPython uses for \`.pyc\` bytecode files — its format can change between Python versions, so never use it for your own data.` },
    ],
    production: [
      py`**Pick the format by job, not by habit:**`,
      py`| job | good choice | why |
|---|---|---|
| exchange data with other programs, APIs, browsers | JSON | universal, readable, safe to parse |
| tables for spreadsheets and analysts | CSV | every tool opens it |
| configuration people edit | TOML (read with tomllib) | comments, clear types, no trailing-comma traps |
| app data you query, update and share between processes | SQLite (sqlite3) | transactions, indexes, partial updates |
| short-lived cache of Python objects your own program created | pickle | zero conversion code, keeps exact types |
| long-term archive or anything crossing a trust boundary | **not** pickle | class renames break it; loading can run code |`,
      py`**Version every format you own.** Put a \`"version"\` (or \`schema_version\`) field in the file, write **upgrade functions** that turn version *n* into *n + 1*, and keep sample files of every old version in your tests. Readers should be *tolerant* (defaults for missing fields, ignore unknown ones when safe); writers should always write the newest version. When you change a dataclass, ask: "what happens to every file already out there?"`,
      py`**If you must accept pickles across a boundary you control** (e.g. between your own services), the pickle docs suggest signing them with \`hmac\` so tampered data is rejected *before* unpickling. A signature only proves the data came from someone with the key; anyone holding the key can still run code on the receiver, so keep keys secret and prefer data-only formats when you can. See [secrets & passwords](lesson:secrets-and-passwords).`,
      py`**Restricting what can be loaded.** The docs show how to subclass \`pickle.Unpickler\` and override \`find_class\` to allow only a whitelist of classes. It reduces risk but is easy to get wrong; it's a mitigation for legacy systems, not a reason to choose pickle for untrusted input.`,
    ],
  },
  mistakes: [
    {
      title: 'Unpickling data from users or the internet',
      wrong: { code: py`import pickle

def load_cart(cookie_value):
    return pickle.loads(base64.b64decode(cookie_value))   # attacker controls the cookie`, lang: 'python', static: true },
      right: { code: py`import json

def load_cart(cookie_value):
    cart = json.loads(cookie_value)             # can only produce plain data
    if not isinstance(cart, list) or not all(isinstance(i, str) for i in cart):
        raise ValueError("bad cart")
    return cart`, lang: 'python' },
      explanation: py`Anything the user can modify — cookies, uploads, form fields, message queues they can write to — must not reach \`pickle.loads\`. Base64 isn't protection; it's just an encoding. Use JSON and validate the shape.`,
    },
    {
      title: 'Opening pickle files in text mode',
      wrong: { code: py`import pickle

with open("scores.pkl", "w") as f:
    pickle.dump({"ada": 91}, f)     # TypeError: write() argument must be str, not bytes`, lang: 'python', static: true },
      right: { code: py`import pickle

with open("scores.pkl", "wb") as f:
    pickle.dump({"ada": 91}, f)
with open("scores.pkl", "rb") as f:
    print(pickle.load(f))`, lang: 'python' },
      explanation: py`Pickles are bytes. Use \`"wb"\` and \`"rb"\` — and no \`encoding\` argument, which binary mode doesn't accept. (tomllib wants \`"rb"\` too, for a different reason: it decodes UTF-8 itself.)`,
    },
    {
      title: 'Pickling classes defined in the script you run',
      wrong: { code: py`# save.py — run as "python save.py"
import pickle

class Player:
    def __init__(self, name):
        self.name = name

with open("p.pickle", "wb") as f:
    pickle.dump(Player("Ada"), f)    # stored as __main__.Player
# Loading from another script fails: there, __main__ has no Player`, lang: 'python', static: true },
      right: { code: py`# models.py holds the class; both scripts import it
# save.py:   from models import Player; pickle.dump(Player("Ada"), f)
# load.py:   import models; player = pickle.load(f)   # finds models.Player`, lang: 'python', static: true },
      explanation: py`Pickle records *where to find* a class, not the class itself. \`__main__\` means "whatever script is running right now", which changes. Keep picklable classes in importable modules — and don't rename or move them while old pickles exist.`,
    },
    {
      title: 'Using pickle as a long-term storage format',
      wrong: { code: py`# v1 of the app saves user documents as pickles of DocumentV1 objects...
# two years later DocumentV1 is renamed and split into two classes:
# every saved document fails to load.`, lang: 'python', static: true },
      right: { code: py`# Save documents as JSON (or SQLite rows) with a schema version:
# {"version": 3, "title": "...", "body": "..."}
# and keep upgrade_v1 / upgrade_v2 functions for old files.`, lang: 'python', static: true },
      explanation: py`Pickles are tied to your code's class names and structure. They're great for caches you can throw away and rebuild, poor for data that must outlive refactors.`,
    },
    {
      title: 'Saving without a version number',
      wrong: { code: py`import json

json.dumps({"colour": "dark", "volume": 7})   # next year: is "colour" old or new?`, lang: 'python' },
      right: { code: py`import json

json.dumps({"version": 2, "settings": {"theme": "dark", "volume": 7}})`, lang: 'python' },
      explanation: py`Without a version, every reader has to guess the format from which keys happen to exist. With one, loading old files is a straightforward chain of upgrade steps.`,
    },
  ],
  debugging: [
    {
      symptom: py`_pickle.UnpicklingError: invalid load key, '{'.`,
      cause: py`The file isn't a pickle — here it starts with \`{\`, so it's probably JSON — or it's corrupted or truncated.`,
      fix: py`Check what wrote the file and use the matching loader. Pickle data starts with \`\x80\` (protocol 2+).`,
    },
    {
      symptom: py`AttributeError: module '__main__' has no attribute 'Player'`,
      cause: py`The pickle references a class (\`__main__.Player\` here) that doesn't exist where you're loading — it was defined in the script that saved it, or it has been renamed or moved. Python 3.13 and earlier word it \`Can't get attribute 'Player' on <module '__main__' ...>\`.`,
      fix: py`Define the class in an importable module and import it before loading. For renamed classes, keep an alias (\`OldName = NewName\`) or migrate the data to an explicit format.`,
    },
    {
      symptom: py`_pickle.PicklingError: Can't pickle <function <lambda> at 0x...>: it's not found as __main__.<lambda>`,
      cause: py`Lambdas and nested functions have no importable name, so pickle can't refer to them.`,
      fix: py`Use a module-level \`def\` function, or store data (e.g. a string naming the operation) instead of the function.`,
    },
    {
      symptom: py`TypeError: cannot pickle 'TextIOWrapper' instances`,
      cause: py`An object you're pickling holds an open file (or socket, lock, connection, generator).`,
      fix: py`Drop the resource in \`__getstate__\` and recreate it in \`__setstate__\`, or store the information needed to reopen it (a path).`,
    },
    {
      symptom: py`UnicodeDecodeError: 'utf-8' codec can't decode byte 0x80 in position 0: invalid start byte`,
      cause: py`A pickle (which starts with byte \`0x80\`) was opened in text mode.`,
      fix: py`Open pickle files with \`"rb"\` / \`"wb"\`.`,
    },
    {
      symptom: py`TypeError: File must be opened in binary mode, e.g. use \`open('foo.toml', 'rb')\``,
      cause: py`\`tomllib.load\` was given a text-mode file.`,
      fix: py`\`with open("config.toml", "rb") as f: tomllib.load(f)\`, or \`tomllib.loads(path.read_text(encoding="utf-8"))\`.`,
    },
  ],
  bestPractices: [
    'Never unpickle data that anyone else could have written or modified — use JSON for anything crossing a trust boundary.',
    'Use pickle only for short-lived, rebuildable data your own program produced (caches, intermediate results).',
    'Keep picklable classes in importable modules, not in the script you run; don\'t rename them while pickles exist.',
    'Choose formats by job: JSON to exchange, CSV for tables, TOML for human-edited config, SQLite for data you query and update.',
    'Put a version field in every file format you own and keep upgrade functions plus sample files for old versions.',
    'Convert custom types explicitly at the boundary (asdict / isoformat on save, constructors and fromisoformat on load) — that is where validation lives.',
    'Open pickle and TOML files in binary mode ("rb"/"wb"); save important files atomically.',
  ],
  useCases: [
    'Game saves, app state and settings (JSON or TOML, versioned).',
    'Caching expensive computations between runs on the same machine (pickle, trusted only).',
    'Passing objects between Python processes you control (multiprocessing uses pickle under the hood).',
    'Exporting data for other teams or languages (JSON, CSV).',
    'Local application databases with many records (SQLite).',
  ],
  whenToUse: {
    use: [
      'pickle: temporary caches and intermediate results your own program created and can recreate.',
      'pickle: sending objects between your own trusted Python processes.',
      'JSON/TOML/CSV/SQLite: everything that is long-lived, shared, or comes from outside.',
    ],
    avoid: [
      'pickle for data from users, the network, uploads or other untrusted sources — ever.',
      'pickle for long-term storage or data other languages must read.',
      'Rolling your own text format when JSON, CSV or TOML already fits.',
    ],
  },
  comparison: {
    title: 'Choosing a serialization format',
    headers: ['', 'JSON', 'CSV', 'TOML', 'pickle', 'SQLite'],
    rows: [
      ['human-readable', 'yes', 'yes', 'yes — designed for it', 'no (binary)', 'no (needs a tool)'],
      ['other languages', 'all', 'all', 'most', 'Python only', 'all'],
      ['shape of data', 'nested dicts and lists', 'flat tables', 'nested config sections', 'almost any Python object', 'tables and relations'],
      ['types it keeps', 'str, number, bool, null, list, dict', 'none — all text', 'str, int, float, bool, dates, arrays, tables', 'nearly all Python types, plus shared references', 'INTEGER, REAL, TEXT, BLOB, NULL'],
      ['safe to load untrusted input?', 'yes (then validate)', 'yes (then validate)', 'yes (then validate)', 'NO — can run code', 'query with parameters; treat untrusted .db files with care'],
      ['standard library', 'json', 'csv', 'tomllib (read-only, 3.11+)', 'pickle', 'sqlite3'],
      ['update one record', 'rewrite the file', 'rewrite (or append rows)', 'rewrite the file', 'rewrite the file', 'yes, in a transaction'],
      ['typical job', 'APIs, saves, data exchange', 'spreadsheets, exports', 'hand-edited configuration', 'trusted caches, IPC', 'app data you query'],
    ],
    note: py`There's no single best format — only the best one for a job. When in doubt for saved data: JSON with a version field. When the data grows beyond "load it all, change it, save it all": SQLite.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'serialization-q1',
      type: 'mcq',
      prompt: 'Your app needs a settings file that users will edit by hand, with comments explaining each option. Which format fits best?',
      options: [
        { text: 'pickle', why: 'Binary and unreadable by humans — and loading an edited pickle could run code.' },
        { text: 'JSON', why: 'JSON works, but has no comments and is unforgiving of hand edits (trailing commas, quotes).' },
        'TOML',
        { text: 'CSV', why: 'CSV is for flat tables, not nested settings with comments.' },
      ],
      answer: 2,
      explanation: py`TOML is designed for human-edited configuration: comments, sections, clear types (including dates). Python reads it with \`tomllib\` (3.11+) — as in \`pyproject.toml\`.`,
    },
    {
      id: 'serialization-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import pickle

point = (3, 4)
tags = {"a"}
back = pickle.loads(pickle.dumps([point, tags]))
print(type(back[0]).__name__, type(back[1]).__name__)`,
      answer: 'tuple set',
      explanation: py`pickle preserves Python types exactly — tuples stay tuples and sets stay sets. A JSON round trip would turn the tuple into a list and refuse the set.`,
    },
    {
      id: 'serialization-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`import pickle

a = [1, 2]
b = pickle.loads(pickle.dumps(a))
print(a == b, a is b)`,
      options: [
        { text: 'True True', why: 'loads always builds new objects; it cannot hand back the original list.' },
        'True False',
        { text: 'False False', why: 'The new list has the same contents, so == is True.' },
        { text: 'False True', why: 'Objects that are the same object are always equal (for lists).' },
      ],
      answer: 1,
      explanation: py`Deserialising creates **new** objects with the same values: equal, not identical. (A pickle round trip is effectively a deep copy.)`,
    },
    {
      id: 'serialization-q4',
      type: 'bug',
      prompt: 'This crashes with `UnicodeDecodeError: \'utf-8\' codec can\'t decode byte 0x80 in position 0`. Click the line that causes it.',
      code: py`import pickle

scores = {"ada": 91}
with open("scores.pkl", "wb") as f:
    pickle.dump(scores, f)

with open("scores.pkl", encoding="utf-8") as f:
    print(pickle.load(f))`,
      answerLine: 7,
      explanation: py`The file was written correctly in binary mode, but it's read back in **text** mode, so Python tries to decode the pickle's bytes as UTF-8. Use \`open("scores.pkl", "rb")\`.`,
    },
    {
      id: 'serialization-q5',
      type: 'fill',
      prompt: 'Read `pyproject.toml` with the standard library (Python 3.11+).',
      code: py`import tomllib

with open("pyproject.toml", ___) as f:
    config = tomllib.___(f)`,
      answer: [['"rb"', 'rb'], ['load']],
      explanation: py`\`tomllib\` requires a **binary** file and decodes UTF-8 itself. \`load\` reads from a file; \`loads\` parses a string.`,
    },
    {
      id: 'serialization-q6',
      type: 'mcq',
      prompt: 'Which statement about pickle is true?',
      options: [
        { text: 'Unpickling is safe as long as you check the type of the result afterwards', why: 'Malicious code runs during loads(), before you get a result to check.' },
        { text: 'Base64-encoding a pickle makes it safe to store in a cookie', why: 'Base64 is an encoding, not protection. Users can decode, modify and re-encode it.' },
        'Loading a pickle can call arbitrary functions, so only unpickle data you trust',
        { text: 'Pickles can be read by any language that supports JSON', why: 'Pickle is a Python-specific binary format.' },
      ],
      answer: 2,
      explanation: py`A pickle can instruct the loader to import and call any function (via \`__reduce__\`). That's why the docs' warning is absolute: only unpickle data you trust.`,
    },
    {
      id: 'serialization-q7',
      type: 'short',
      prompt: 'Why should a file format you design include a version number, and what does your loading code do with it?',
      answer: py`Because the format will change: fields get added, renamed or removed as the program evolves, while old files still exist on users' machines. A version number lets the loader know exactly which shape it's reading instead of guessing from the keys present. The loader runs upgrade steps (v1 → v2 → v3) until the data is in the current shape, rejects versions it doesn't know (e.g. a file from a newer release) with a clear error, and the writer always saves the newest version.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'versioned-settings',
      title: 'Load old and new settings files',
      difficulty: 'intermediate',
      prompt: py`Version 1 of an app saved settings as a **flat** JSON object with the key \`"colour"\`, e.g. \`{"colour": "dark", "volume": 7}\`. Version 2 renamed it to \`"theme"\` and wraps everything: \`{"version": 2, "settings": {"theme": "dark", "volume": 7}}\`.

1. \`save_settings(settings)\` returns JSON **text** of \`{"version": 2, "settings": settings}\`.
2. \`load_settings(text)\` returns the **settings dict** in the version-2 shape:
   - a document with no \`"version"\` key is version 1: rename \`"colour"\` to \`"theme"\` (if present) and keep the other keys;
   - a version-2 document returns its \`"settings"\`;
   - any other version raises \`ValueError\` whose message contains \`"version"\`.`,
      files: { 'main.py': VERSIONED_START },
      hints: [
        'In load_settings, doc.get("version", 1) treats files without a version as version 1.',
        'Write a small upgrade_v1(doc) that copies the dict, renames "colour" with settings["theme"] = settings.pop("colour"), and returns {"version": 2, "settings": settings}.',
        'version = doc.get("version", 1)\nif version == 1:\n    doc = upgrade_v1(doc); version = 2\nif version != CURRENT_VERSION:\n    raise ValueError(f"unsupported settings version: {version}")\nreturn doc["settings"]',
      ],
      solution: {
        explanation: py`The writer always produces the newest shape, with the version stated explicitly. The reader treats a missing version as 1 — the only format that existed before versions were introduced — and **upgrades** it to version 2 with a dedicated function, so the rest of the loader only ever deals with the current shape. With more versions you'd chain steps (\`upgrade_v1\`, \`upgrade_v2\`, …) in a loop until reaching \`CURRENT_VERSION\`. Unknown versions (say, a file written by a *newer* release) raise a clear \`ValueError\` instead of being half-understood. \`dict(doc)\` copies before renaming, so the function never mutates its input.`,
        files: { 'main.py': VERSIONED_SOLUTION },
      },
      tests: [
        { name: 'save_settings writes version 2', code: py`doc = json.loads(save_settings({"theme": "light", "volume": 3}))
assert doc == {"version": 2, "settings": {"theme": "light", "volume": 3}}` },
        { name: 'version-2 files load', code: py`assert load_settings(save_settings({"theme": "light", "volume": 3})) == {"theme": "light", "volume": 3}` },
        { name: 'version-1 files are upgraded ("colour" -> "theme")', code: py`assert load_settings('{"colour": "dark", "volume": 7}') == {"theme": "dark", "volume": 7}` },
        { name: 'version-1 files without colour still load', code: py`assert load_settings('{"volume": 2}') == {"volume": 2}` },
        { name: 'unknown versions raise ValueError', code: py`with raises(ValueError, match="version"):
    load_settings('{"version": 9, "settings": {}}')` },
      ],
    },
    {
      id: 'pickle-cache',
      title: 'A pickle cache for slow work',
      difficulty: 'intermediate',
      prompt: py`Write \`cached(path, compute)\`:

- if a file exists at \`path\`, **unpickle** it and return the result **without** calling \`compute\`;
- otherwise call \`compute()\` (no arguments), **pickle** the result to \`path\`, and return it.

Open files in binary mode. The program calls \`cached\` twice with the same path, so \`computing word counts...\` must be printed **only once**. This is a legitimate use of pickle: the cache file is written and read only by your own program.`,
      files: { 'main.py': CACHE_START, 'story.txt': STORY },
      hints: [
        'Two branches: the file exists (load and return) or it doesn\'t (compute, save, return).',
        'Either check Path(path).exists(), or try open(path, "rb") and catch FileNotFoundError. Use pickle.load(f) / pickle.dump(result, f).',
        'try:\n    with open(path, "rb") as f:\n        return pickle.load(f)\nexcept FileNotFoundError:\n    pass\nresult = compute()\nwith open(path, "wb") as f:\n    pickle.dump(result, f)\nreturn result',
      ],
      solution: {
        explanation: py`Trying to open the cache and catching \`FileNotFoundError\` (EAFP) avoids a race between "does it exist?" and "open it". On a hit, \`pickle.load\` rebuilds the exact object — here a \`Counter\`, with its type intact, which JSON would have flattened into a plain dict. On a miss, the result is computed once and pickled in binary mode. Real caches add a few things: a key that changes when the inputs change (e.g. a hash of \`story.txt\`) so stale results aren't reused, atomic writes so a crash can't leave a half-written cache, and a fallback that recomputes if unpickling fails. And because pickles can run code, the cache directory must not be writable by anyone else.`,
        files: { 'main.py': CACHE_SOLUTION, 'story.txt': STORY },
      },
      tests: [
        { name: 'computes only once for the same path', code: py`calls = []
def compute():
    calls.append(1)
    return {"answer": 42}
cached("t.pickle", compute)
cached("t.pickle", compute)
assert len(calls) == 1, f"compute() was called {len(calls)} times"` },
        { name: 'returns the same value from the cache, types intact', code: py`value = {"tags": {"a", "b"}, "point": (1, 2)}
first = cached("t2.pickle", lambda: value)
second = cached("t2.pickle", lambda: "should not be used")
assert first == second == value
assert isinstance(second["point"], tuple) and isinstance(second["tags"], set)` },
        { name: 'the cache file is a real pickle', code: py`cached("t3.pickle", lambda: [1, 2, 3])
with open("t3.pickle", "rb") as f:
    assert f.read(1) == b"\x80", "Write the result with pickle.dump in binary mode"` },
        { name: 'the program computed the word counts once', code: py`assert output.count("computing word counts...") == 1` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'serialization-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is serialization, and why do programs need it?',
      answer: 'Converting in-memory objects into a byte or text representation that can be stored or transmitted, and rebuilding them later (deserialization). Needed for persistence (files, databases), communication (APIs, message queues, processes) and caching, because memory objects and their addresses don\'t survive outside the running process.',
      explanation: py`Objects are graphs of memory locations meaningful only inside one process. A format (JSON, CSV, TOML, pickle, protobuf, a database's storage) defines how to flatten them into bytes and back. Formats differ in readability, portability, the types they preserve, performance, and whether loading untrusted input is safe.`,
      whyAsked: 'A foundation question; good answers mention both directions and the trade-offs between formats.',
      mistakes: ['Only mentioning files, not networks or processes', 'Equating serialization with JSON', 'Ignoring the security dimension'],
      followUps: ['What does a JSON round trip lose?', 'Why is pickle dangerous?', 'How would you choose a format for a public API?'],
      modelAnswer: 'Serialization is turning objects that live in a program\'s memory into bytes or text that can leave the process — written to a file, sent over a network or put in a cache — and deserialization rebuilds objects from that representation. We need it because in-memory objects and their references only make sense inside one running process. The format is a real decision: JSON is readable and portable but only has a few types, CSV is great for tables, pickle preserves almost any Python object but is Python-only and unsafe for untrusted data, and a database adds querying and transactions. I pick based on who reads the data, how long it lives, and whether it crosses a trust boundary.',
    },
    {
      id: 'serialization-pickle-rce',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is calling `pickle.loads` on untrusted data a security vulnerability? Be specific about the mechanism.',
      answer: 'A pickle is a program for the unpickler\'s stack machine. Its opcodes can import any global (e.g. os.system) and call it with arguments — the same mechanism __reduce__ uses to rebuild objects. So attacker-controlled bytes can execute arbitrary code during loads(), before you inspect the result.',
      explanation: py`\`__reduce__\` returns \`(callable, args)\`; pickle stores the callable by name and calls it on load. An attacker doesn't even need your classes — they can hand-craft opcodes (\`GLOBAL os system\`, then \`REDUCE\`). Type checks afterwards are too late, base64 or compression don't help, and \`Unpickler.find_class\` whitelisting is a partial mitigation. The fix is a data-only format (JSON) or authenticating trusted producers with HMAC.`,
      code: { lang: 'python', code: py`import pickle


class Sneaky:
    def __reduce__(self):
        return (print, ("this ran inside pickle.loads",))   # an attacker would use os.system


pickle.loads(pickle.dumps(Sneaky()))` },
      whyAsked: 'Insecure deserialization is a classic vulnerability; interviewers want the mechanism, not just "pickle is unsafe".',
      mistakes: ['"It is only unsafe if the class has a malicious method" (no class is needed on the victim side)', 'Believing a post-load type check helps', 'Thinking encryption alone makes it safe (it does nothing if the attacker can produce valid ciphertext)'],
      followUps: ['How would you safely load data from a browser cookie?', 'What does HMAC signing protect against, and what not?', 'Which other libraries use pickle under the hood?'],
      modelAnswer: 'A pickle is not passive data; it is a sequence of instructions for a small stack machine inside the pickle module. Those instructions can import any global by name and call it with arguments — that is exactly how __reduce__ lets objects describe how to rebuild themselves. So an attacker can craft bytes that import os.system and call it with a shell command, and it executes inside pickle.loads, before my code ever sees a result. Checking the type afterwards is too late and encoding the bytes does not help. For untrusted input I use JSON and validate it; if two of my own services must exchange pickles, I sign them with HMAC and verify before loading.',
    },
    {
      id: 'serialization-shared-refs',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`import pickle

a = [1, 2]
data = {"x": a, "y": a}
copy = pickle.loads(pickle.dumps(data))
copy["x"].append(3)
print(copy["y"], a)` },
      options: ['[1, 2] [1, 2]', '[1, 2, 3] [1, 2]', '[1, 2, 3] [1, 2, 3]', '[1, 2] [1, 2, 3]'],
      correctOption: 1,
      answer: '`[1, 2, 3] [1, 2]`. pickle preserved the fact that "x" and "y" refer to one list, so they still share a (new) list after loading — while the original a is untouched.',
      explanation: py`The pickler's memo turns the second reference into a back-reference, so the copy has one list referenced twice. That new list is independent of \`a\`. A JSON round trip would print \`[1, 2] [1, 2]\`: two separate lists, neither shared.`,
      whyAsked: 'Probes understanding of object identity versus value in serialization, and how pickle differs from JSON.',
      mistakes: ['Assuming the copy is linked to the original a', 'Assuming pickle copies each reference separately like JSON'],
      followUps: ['How does pickle handle cycles?', 'How does copy.deepcopy relate to pickle?'],
      modelAnswer: 'It prints [1, 2, 3] and then [1, 2]. In the original dict, "x" and "y" point at the same list. pickle keeps a memo of objects it has already written, so the second reference is stored as a pointer back to the first, and after loading, copy["x"] and copy["y"] are again one shared list — appending through x is visible through y. But that list is brand new, so the original a is unchanged. JSON has no notion of identity, so it would give two separate lists. The same memo is what lets pickle handle reference cycles, and deepcopy uses a similar memo.',
    },
    {
      id: 'serialization-choose-format',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'For each job, pick a format and justify it: (1) a CLI tool\'s user config; (2) a REST API payload; (3) a monthly export for the finance team; (4) caching an expensive computation between runs on one machine; (5) a desktop app\'s library of 200,000 songs with play counts updated constantly.',
      answer: '(1) TOML — human-edited, comments, read with tomllib. (2) JSON — universal, safe to parse, validated server-side. (3) CSV — opens in spreadsheets; quote properly and keep money exact. (4) pickle — trusted, local, Python-only, rebuildable; key it on inputs. (5) SQLite — partial updates, queries, indexes and transactions instead of rewriting a huge file.',
      explanation: py`The deciding questions: Who reads it (humans, other languages, only my code)? Does it cross a trust boundary? Is it tabular or nested? How big is it, and do I update parts of it? How long must it live across code changes? Pickle fits only "trusted, short-lived, Python-only". Anything long-lived gets a version field.`,
      whyAsked: 'Tests judgement and the ability to articulate trade-offs rather than defaulting to one tool.',
      mistakes: ['Using JSON for everything, including a huge constantly-updated library', 'Using pickle for the API or config', 'Forgetting versioning and validation'],
      followUps: ['How would you migrate the song library schema later?', 'What would change if the API needed to be very compact or fast? (e.g. protobuf/MessagePack, third-party)', 'Where would you validate the config?'],
      modelAnswer: 'For the CLI config I would use TOML: people edit it by hand, it allows comments and has clear types, and tomllib reads it. The API payload is JSON: every client understands it and parsing it cannot execute code, though I validate it. The finance export is CSV because it opens straight in a spreadsheet; I would use the csv module for quoting and Decimal for money. The computation cache can be pickle, because only my program writes and reads it, it is Python-only and can always be rebuilt — I would key it on a hash of the inputs. The song library belongs in SQLite: constant small updates and queries are what a database is for, rather than rewriting a big JSON file each time.',
    },
    {
      id: 'serialization-missing-class',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A training script pickles a `Model` object. A separate prediction script fails to load it with `AttributeError: Can\'t get attribute \'Model\' on <module \'__main__\' ...>` (Python 3.14 words it `module \'__main__\' has no attribute \'Model\'`). Explain and fix.',
      answer: 'Pickle stores classes by reference (module + name). Model was defined in the training script, so it was saved as __main__.Model; in the prediction script __main__ is a different module with no Model. Move Model into an importable module (models.py) used by both scripts, and re-create the pickle.',
      explanation: py`Pickle never stores class code, only where to find it. \`__main__\` is "the script being run", so classes defined there can only be unpickled by that same script. The same error appears after renaming or moving a class; fixes include an alias in the old location or a custom \`Unpickler.find_class\` mapping. For artefacts that must live long or travel between environments, consider an explicit format (e.g. saving parameters as JSON or a library's own format) instead.`,
      whyAsked: 'A very common real-world pickle failure (especially in data science); tests whether you understand what a pickle contains.',
      mistakes: ['Copy-pasting the class into the loading script (fragile)', 'Thinking the pickle file is corrupted', 'Not realising pickles reference classes by name'],
      followUps: ['What happens if you add an attribute to Model and load an old pickle?', 'How would you rename a class without breaking existing pickles?'],
      modelAnswer: 'A pickle does not contain the class itself, only a reference: the module name and the class name. Because Model was defined directly in the training script, it was recorded as __main__.Model. When the prediction script loads it, __main__ is now the prediction script, which has no Model, so the lookup fails. The fix is to put Model in its own importable module that both scripts import, then retrain or re-pickle so the reference becomes models.Model. Long term, if these artefacts must survive refactors, I would save them in an explicit, versioned format rather than relying on class names staying stable.',
    },
    {
      id: 'serialization-signed-pickle',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Two of your own services exchange pickled objects through a shared queue. Implement `dumps_signed(obj, key)` and `loads_signed(blob, key)` so that tampered data is rejected with `ValueError` **before** unpickling.',
      answer: 'Prefix the pickle bytes with an HMAC-SHA256 tag computed with a secret key. On load, split off the 32-byte tag, recompute the HMAC over the rest, compare with hmac.compare_digest, and only then call pickle.loads.',
      explanation: py`HMAC proves the bytes were produced by someone holding the key and weren't modified. \`compare_digest\` takes the same time however many bytes match, preventing timing attacks. Order matters: verify first, unpickle second. Limits: anyone with the key can still craft malicious pickles, the key must be kept out of the code and rotated, and replay of old valid messages needs timestamps or nonces. If the services could exchange JSON instead, that removes the code-execution risk entirely.`,
      starter: { files: { 'main.py': SIGNED_START } },
      tests: [
        { name: 'round-trips with the right key', code: py`blob = dumps_signed({"a": [1, 2]}, b"k1")
assert loads_signed(blob, b"k1") == {"a": [1, 2]}` },
        { name: 'the blob is longer than the plain pickle (it carries a tag)', code: py`import pickle
assert len(dumps_signed("x", b"k1")) == len(pickle.dumps("x")) + 32` },
        { name: 'tampered data is rejected with ValueError', code: py`blob = bytearray(dumps_signed({"role": "user"}, b"k1"))
blob[-3] ^= 1
with raises(ValueError):
    loads_signed(bytes(blob), b"k1")` },
        { name: 'the wrong key is rejected with ValueError', code: py`blob = dumps_signed({"role": "user"}, b"k1")
with raises(ValueError):
    loads_signed(blob, b"other-key")` },
      ],
      solution: { files: { 'main.py': SIGNED_SOLUTION } },
      hints: ['hmac.new(key, data, hashlib.sha256).digest() gives a 32-byte tag.', 'Verify with hmac.compare_digest(tag, expected) and raise ValueError before calling pickle.loads.'],
      whyAsked: 'Combines serialization safety with correct use of cryptographic primitives (HMAC, constant-time comparison, verify-then-parse).',
      mistakes: ['Unpickling first and checking afterwards', 'Comparing tags with == (timing side channel)', 'Using a plain hash without a key (anyone can recompute it)', 'Hard-coding the secret key in source control'],
      followUps: ['What does signing not protect against?', 'How would you prevent replay of an old signed message?', 'How would you rotate the key without downtime?'],
      modelAnswer: 'I pickle the object, compute an HMAC-SHA256 over those bytes with a secret key, and send tag plus data. On receipt I split off the 32-byte tag, recompute the HMAC over the remaining bytes and compare using hmac.compare_digest, which is constant-time. Only if it matches do I call pickle.loads; otherwise I raise ValueError, so tampered bytes never reach the unpickler. A plain hash would not work because an attacker could recompute it — the key is what makes it an authentication tag. This only proves the data came from a key holder, so the key must be protected and rotated, replay needs timestamps or nonces, and if I could switch the services to JSON I would rather remove the code-execution risk altogether.',
    },
    {
      id: 'serialization-schema-evolution',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your app has saved user projects as JSON for three years through four format changes, and loading code is now a tangle of `if "old_key" in data` checks. How would you restructure it?',
      answer: 'Add an explicit schema version to every file (treat a missing one as v1), write one small upgrade function per step (v1→v2, v2→v3, …) applied in a loop until current, then parse the current shape into typed objects in one place. Keep fixture files for every historical version in tests, always write the newest version, and refuse unknown future versions clearly.',
      explanation: py`Chained migrations make each change small and testable, and keep the "current" model clean. A registry like \`UPGRADES = {1: upgrade_1_to_2, 2: upgrade_2_to_3}\` drives the loop. Decide on forward compatibility: ignore unknown fields (tolerant reader) or fail loudly. Migrations should be pure functions on plain dicts — not on classes that will change again. For large stores, consider migrating files on load and re-saving, or a one-off batch migration with backups.`,
      code: { lang: 'python', code: py`CURRENT = 3


def upgrade_1_to_2(doc):
    doc = dict(doc)
    doc["theme"] = doc.pop("colour", "light")
    return doc


def upgrade_2_to_3(doc):
    doc = dict(doc)
    doc["tags"] = sorted(set(doc.get("tags", [])))
    return doc


UPGRADES = {1: upgrade_1_to_2, 2: upgrade_2_to_3}


def upgrade(doc):
    version = doc.get("version", 1)
    if version > CURRENT:
        raise ValueError(f"file is from a newer version ({version})")
    while version < CURRENT:
        doc = UPGRADES[version](doc)
        version += 1
    return {**doc, "version": CURRENT}


print(upgrade({"colour": "dark", "tags": ["b", "a", "b"]}))` },
      whyAsked: 'Assesses long-term maintainability thinking: data outlives code, and format changes must be managed deliberately.',
      mistakes: ['Inferring versions from which keys exist', 'Migrating into classes instead of plain data', 'No tests with real old files', 'Silently accepting files from newer versions'],
      followUps: ['How would you handle a file written by a newer version of the app?', 'When would you migrate everything in a batch instead of on load?', 'How does this relate to database migrations?'],
      modelAnswer: 'I would make the version explicit: every file gets a schema version, and a missing one means version 1. Then I would write one small, pure upgrade function per format change — one to two, two to three, and so on — operating on plain dicts, and a loop that applies them until the document is current. After that, a single function parses the current shape into typed objects and validates it. The writer always writes the newest version, and files claiming a version newer than the app raise a clear error. Crucially, I would keep real sample files of every old version as test fixtures, so every migration path is tested. It is the same idea as database migrations, applied to files.',
    },
  ],

  takeaways: [
    'Serialization turns objects into bytes or text to store or send; deserialization rebuilds new objects from them.',
    'pickle saves almost any Python object exactly (types, shared references, cycles) — but it is Python-only and tied to your class names.',
    'Never unpickle untrusted data: loading a pickle can import and call any function. Use JSON for anything from outside.',
    'Pickle and TOML files are opened in binary mode; tomllib (3.11+) only reads TOML.',
    'Choose by job: JSON to exchange, CSV for tables, TOML for human-edited config, pickle for trusted caches, SQLite to query and update.',
    'Classes you pickle belong in importable modules; unpickling skips __init__, so old pickles miss new attributes.',
    'Version every format you own and upgrade old files step by step.',
  ],
}
