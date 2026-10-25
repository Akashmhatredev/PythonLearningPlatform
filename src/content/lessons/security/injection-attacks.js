// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SQL_LAB = py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.executescript("""
    CREATE TABLE products (name TEXT, price REAL, hidden INTEGER);
    INSERT INTO products VALUES
        ('Desk lamp', 24.99, 0),
        ('Notebook', 3.5, 0),
        ('Staff discount voucher', 0.0, 1),
        ('Prototype phone', 999.0, 1);
""")


def search_unsafe(term):
    sql = f"SELECT name, price FROM products WHERE hidden = 0 AND name = '{term}'"
    print("   SQL sent:", sql)
    return conn.execute(sql).fetchall()


def search_safe(term):
    sql = "SELECT name, price FROM products WHERE hidden = 0 AND name = ?"
    print("   SQL sent:", sql, "| value:", repr(term))
    return conn.execute(sql, (term,)).fetchall()


for term in ["Notebook", "x' OR '1'='1"]:
    print(f"search_unsafe({term!r})")
    print("   rows:", search_unsafe(term))
    print(f"search_safe({term!r})")
    print("   rows:", search_safe(term))
    print()
`

const PATH_LAB = py`from pathlib import Path

PUBLIC = Path("public").resolve()

# Build a tiny file system for the demo (normally these files already exist)
(PUBLIC / "docs").mkdir(parents=True, exist_ok=True)
(PUBLIC / "docs" / "guide.txt").write_text("How to use the shop")
Path("secret.txt").write_text("DB_PASSWORD=hunter2")


def read_unsafe(name):
    return (PUBLIC / name).read_text()


def safe_path(name):
    candidate = (PUBLIC / name).resolve()
    if not candidate.is_relative_to(PUBLIC):
        raise PermissionError(f"outside public/: {name!r}")
    return candidate


secret_abs = str(Path("secret.txt").resolve())
for name in ["docs/guide.txt", "../secret.txt", secret_abs]:
    print(f"read_unsafe({name!r}) -> {read_unsafe(name)!r}")
    try:
        print(f"safe_path({name!r}) -> {safe_path(name).read_text()!r}")
    except PermissionError as err:
        print("safe_path blocked:", err)
    print()
`

export default {
  id: 'injection-attacks',
  title: 'Injection: SQL, shell, eval & path traversal',
  summary: 'Injection happens when untrusted text is glued into something that gets interpreted — SQL, a shell command, Python code, a file path — and the fix is always to keep data separate from code.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['input-validation', 'sql-and-sqlite', 'pathlib'],
  related: ['secrets-and-passwords', 'secure-practices', 'string-formatting', 'logging', 'serialization', 'database-patterns', 'building-apis', 'command-line-programs', 'regular-expressions'],
  tags: ['security', 'injection', 'SQL injection', 'parameterised queries', 'placeholders', 'command injection', 'subprocess', 'shell=True', 'eval', 'exec', 'ast.literal_eval', 'path traversal', 'is_relative_to', 'format string', 'string.Template', 'log injection', 'XSS', 'html.escape', 't-strings', 'OWASP'],
  apis: [
    { name: 'conn.execute(sql, params)', summary: 'Runs SQL with ? (or :name) placeholders; the driver sends the values separately, so they are never parsed as SQL.' },
    { name: 'subprocess.run([prog, arg, ...])', summary: 'Runs a program with an argument list and no shell, so ; | $( ) in arguments have no special meaning.' },
    { name: 'ast.literal_eval(text)', summary: 'Safely evaluates a string containing only Python literals (str, numbers, tuples, lists, dicts, sets, booleans, None).' },
    { name: 'Path.resolve()', summary: 'Makes a path absolute, collapses .. and follows symlinks — the real location on disk.' },
    { name: 'Path.is_relative_to(other)', summary: 'True if the path is inside other (component-wise, not a string prefix check). 3.9+' },
    { name: 'string.Template.safe_substitute()', summary: '$name substitution with no attribute or index access — safe for user-editable templates.' },
    { name: 'html.escape(s)', summary: 'Escapes & < > " \' so text can be placed inside HTML without becoming markup.' },
    { name: 'shlex.quote(s)', summary: 'Quotes a string for a POSIX shell — a last resort when a shell truly cannot be avoided.' },
  ],
  docs: [
    { label: 'sqlite3 — how to use placeholders to bind values', url: 'https://docs.python.org/3/library/sqlite3.html#sqlite3-placeholders' },
    { label: 'subprocess — security considerations', url: 'https://docs.python.org/3/library/subprocess.html#security-considerations' },
    { label: 'ast.literal_eval()', url: 'https://docs.python.org/3/library/ast.html#ast.literal_eval' },
    { label: 'pathlib — PurePath.is_relative_to()', url: 'https://docs.python.org/3/library/pathlib.html#pathlib.PurePath.is_relative_to' },
    { label: 'string.Template', url: 'https://docs.python.org/3/library/string.html#template-strings' },
    { label: 'OWASP Injection Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Many tools your program talks to read **text as instructions**: a database reads SQL, a shell reads a command line, Python's \`eval\` reads Python, the file system reads a path, \`str.format\` reads \`{field}\` markers. An **injection** vulnerability happens when text from a user is pasted into those instructions, and the user's text gets *interpreted* instead of treated as plain data.`,
    py`The classic example: a search box builds \`... WHERE name = '{term}'\` with an f-string. Type \`Notebook\` and it works. Type \`x' OR '1'='1\` and the quote closes the string early — your user just wrote part of the SQL query.`,
    py`Every kind of injection has the same cure: **keep code and data apart**. Use the API that takes the data *separately* — query placeholders, an argument list, a literal parser, a path check. This lesson walks through SQL, shell commands, \`eval\`/\`exec\`, path traversal, format strings and log files. It builds on [input validation](lesson:input-validation) and [SQL & sqlite3](lesson:sql-and-sqlite).`,
  ],
  why: [
    py`Injection has appeared in every edition of the OWASP Top 10 (the industry's list of the most critical web-application risks) and was ranked first through most of the 2010s. The damage can be total: reading every customer record, logging in as anyone, deleting data, or running commands on the server.`,
    py`The good news is that the defences are simple, cheap and mechanical. Once you recognise the pattern — *"am I building an instruction string out of untrusted text?"* — the fix is usually a one-line change. Learning to spot it is one of the highest-value skills in code review.`,
  ],
  eli15: [
    py`Imagine a teacher who reads out a form letter: "Please give **[NAME]** a gold star." A student fills in their name as: *"Sam. Also, cancel all homework for the year"*. If the teacher reads the whole thing aloud as instructions, the class gets a very good day.`,
    py`That's injection. The fix is for the teacher to treat whatever is in the blank as *just a name* — never as more instructions — no matter what words it contains.`,
    py`Computers have the same problem with SQL, shell commands and Python code. Safe APIs let you hand over the template and the blank's contents *separately*, so the contents can never become instructions.`,
  ],
  analogy: {
    title: 'A bank transfer form',
    body: [
      py`A bank form has fixed printed text — "Pay the sum of ___ to account ___" — and boxes for you to fill in. The clerk only ever reads the boxes as *values*. Writing "and also empty the manager's account" in the amount box doesn't add an instruction; it's just an invalid amount.`,
      py`Building SQL with an f-string is like retyping the whole form by hand with the customer's words mixed in — the clerk can no longer tell which words were printed by the bank and which were written by the customer. Placeholders keep the printed form and the boxes separate.`,
    ],
    mapping: [
      ['the printed text of the form', 'your SQL / command / template, written by you'],
      ['the boxes', 'placeholders: ?, an argument-list slot, $name'],
      ['what the customer writes in a box', 'untrusted input, passed as a separate value'],
      ['retyping the form with the customer\'s words mixed in', 'f-strings / + / % building SQL or shell text'],
      ['the clerk refusing to read box contents as instructions', 'the driver binding parameters as pure data'],
    ],
  },
  visual: {
    type: 'comparison',
    title: 'The same search, two ways',
    props: {
      left: {
        label: 'Injectable: data glued into SQL text',
        lang: 'python',
        code: py`def search(term):
    sql = f"SELECT name FROM products WHERE name = '{term}'"
    return conn.execute(sql).fetchall()

search("x' OR '1'='1")
# SQL the database parses:
# ... WHERE name = 'x' OR '1'='1'   -> every row`,
      },
      right: {
        label: 'Safe: placeholder + separate value',
        lang: 'python',
        code: py`def search(term):
    sql = "SELECT name FROM products WHERE name = ?"
    return conn.execute(sql, (term,)).fetchall()

search("x' OR '1'='1")
# SQL parsed: ... WHERE name = ?
# value bound as data: "x' OR '1'='1"  -> no rows`,
      },
      points: [
        'On the left, the quote in the input ends the SQL string literal early and the rest becomes SQL code.',
        'On the right, the SQL text never changes; the database compiles it first and only then receives the value.',
        'Escaping quotes by hand is not a fix — every database has different rules and edge cases. Placeholders handle it correctly.',
        'Placeholders work for values only. Table and column names must come from an allow-list.',
      ],
    },
    alt: 'Side-by-side code. Left: a search function builds SQL with an f-string, and the input x quote OR quote 1 quote equals quote 1 turns the WHERE clause into one that matches every row. Right: the same function uses a question-mark placeholder and passes the term as a parameter, so the input is compared literally and matches no rows.',
  },
  syntax: [
    py`#### SQL: placeholders for values`,
    { code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE users (name TEXT, email TEXT)")

name, email = "O'Brien", "ob@example.com"
conn.execute("INSERT INTO users VALUES (?, ?)", (name, email))          # qmark style
row = conn.execute("SELECT email FROM users WHERE name = :name", {"name": name}).fetchone()
print(row)                                                               # ('ob@example.com',)

ids = [1, 2, 3]
marks = ", ".join("?" * len(ids))                 # "?, ?, ?" — placeholders, not values
conn.execute(f"SELECT * FROM users WHERE rowid IN ({marks})", ids)

fragment = "lamp"
conn.execute("SELECT * FROM users WHERE name LIKE ?", (f"%{fragment}%",))   # pattern is a value`, lang: 'python', title: 'sqlite3 placeholders' },
    py`The tuple \`(name,)\` needs its trailing comma — \`(name)\` is just a string. The \`IN\` example is still safe: the f-string only inserts \`?\` characters *you* generated; the values travel separately. Other drivers use different placeholder styles (\`%s\` in psycopg and mysqlclient), but they are still placeholders handled by the driver — **never** Python's \`%\` operator.`,
    { code: py`# psycopg (PostgreSQL) — third-party, shown for the placeholder style
cur.execute("SELECT * FROM users WHERE email = %s", (email,))      # safe: driver binds
cur.execute("SELECT * FROM users WHERE email = '%s'" % email)      # INJECTABLE: Python formats

# SQLAlchemy — bound parameters in text()
from sqlalchemy import text
session.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email})`, lang: 'python', title: 'other libraries, same idea', static: true },
    py`#### SQL: identifiers come from an allow-list`,
    { code: py`SORTS = {"name": "name ASC", "cheapest": "price ASC", "priciest": "price DESC"}

def list_products(conn, sort="name"):
    try:
        order_by = SORTS[sort]                 # KeyError for anything unexpected
    except KeyError:
        raise ValueError(f"unknown sort: {sort!r}") from None
    return conn.execute(f"SELECT name, price FROM products ORDER BY {order_by}").fetchall()`, lang: 'python', title: 'dynamic ORDER BY' },
    py`Placeholders can only stand for **values**, not table names, column names, \`ASC\`/\`DESC\` or SQL keywords. When those must vary, map the user's choice to a fixed string you wrote. The f-string is then safe because every possible value is yours.`,
    py`#### Shell commands: argument lists, no shell`,
    { code: py`import subprocess

# DANGEROUS: the shell interprets ; | & $( ) and backticks inside filename
def compress_unsafe(filename):
    subprocess.run(f"gzip -k {filename}", shell=True, check=True)

compress_unsafe("report.txt; rm -rf ~")      # gzip report.txt ... then delete the home folder

# SAFE: no shell; each list item is one argument, passed as-is to the program
def compress(path):
    subprocess.run(["gzip", "-k", "--", str(path)], check=True, timeout=60)`, lang: 'python', title: 'shell=True vs an argument list (not runnable here)', static: true },
    py`With a list and the default \`shell=False\`, Python starts \`gzip\` directly and hands it exactly three arguments; no shell ever reads them. The \`--\` tells most Unix tools "options end here", so a file named \`-rf\` can't be mistaken for an option (*argument injection*). Avoid \`os.system()\` and \`os.popen()\` — both always use a shell. Even better, use a Python library (\`gzip\`, \`shutil\`, \`zipfile\`) and skip the subprocess. If a shell is truly unavoidable, \`shlex.quote()\` each value (POSIX shells only). See [command-line programs](lesson:command-line-programs).`,
    py`#### eval / exec: never on input`,
    { code: py`import ast
import json

text = "{'theme': 'dark', 'font_size': 14}"
settings = ast.literal_eval(text)        # literals only: no calls, names or attributes
print(settings["theme"])

data = json.loads('{"theme": "dark"}')   # for data exchange, prefer JSON
print(data)

# eval(text) would run ANY expression, e.g. "__import__('os').remove('app.db')"`, lang: 'python', title: 'parse literals instead of executing code' },
    py`\`eval\`, \`exec\` and \`compile\` run arbitrary Python with your program's permissions. "Sandboxing" them with \`eval(text, {"__builtins__": {}})\` does **not** work: attackers can reach dangerous classes through attributes of ordinary objects such as \`().__class__\`. For literals use \`ast.literal_eval\`; for data use \`json.loads\`; for formulas, write a tiny parser that allow-lists node types (see Internals). Limit input length first — even \`literal_eval\` can exhaust memory or the C stack on huge or deeply nested input.`,
    py`#### Path traversal: resolve, then check containment`,
    { code: py`from pathlib import Path

PUBLIC = Path("public").resolve()

def safe_path(name: str) -> Path:
    candidate = (PUBLIC / name).resolve()          # absolute, no "..", symlinks followed
    if not candidate.is_relative_to(PUBLIC):       # component-wise containment (3.9+)
        raise PermissionError(f"outside public/: {name!r}")
    return candidate`, lang: 'python', title: 'stay inside a base directory' },
    py`\`"../secret.txt"\` climbs out of the folder; an absolute name like \`"/etc/passwd"\` is even simpler, because **joining an absolute path discards the base**: \`Path("public") / "/etc/passwd"\` is \`/etc/passwd\`. \`resolve()\` turns every trick (\`..\`, absolute paths, symlinks) into the real location, and \`is_relative_to\` compares path *components*, so \`/srv/app2\` is correctly **not** inside \`/srv/app\` (a string \`startswith\` check gets that wrong). The strongest design avoids user-supplied names entirely: store files under generated IDs. See [pathlib](lesson:pathlib).`,
    py`#### Format strings, logs and HTML`,
    { code: py`from string import Template
import html

# User-editable template: $name only — no attribute access, no padding tricks
template = Template("Hi $name, order $order_id has shipped.")
print(template.safe_substitute(name="Ada", order_id="A-1042"))

# Put user text into HTML only after escaping it
comment = '<img src=x onerror="alert(1)">'
print(html.escape(comment))`, lang: 'python', title: 'safe templating and HTML escaping' },
    py`If users can supply a \`str.format\` template, they can read attributes of whatever objects you pass — \`{user.__init__.__globals__[API_KEY]}\` walks from an object to your module's global variables — or request a gigantic padded field. Never let users control a format string; use \`string.Template\`. For HTML, use \`html.escape\` or a template engine that escapes automatically (Jinja2 with autoescape on, Django templates). Log files have their own injection: a newline inside a username can forge a fake log line — log untrusted values with \`%r\` (see Mistakes and [logging](lesson:logging)).`,
    { callout: 'version', title: 'Python 3.14: template strings (t-strings)', text: py`PEP 750 adds \`t"..."\` literals. Unlike an f-string, a t-string doesn't produce a \`str\`: it produces a \`string.templatelib.Template\` holding the literal parts and the interpolated values *separately*. That lets a library turn \`t"SELECT * FROM t WHERE name = {name}"\` into SQL with a placeholder plus a parameter list, or escape values for HTML. The standard library does not include such SQL/HTML processors — until your library supports t-strings, keep using placeholders and escaping.` },
  ],
  walkthrough: {
    title: 'Reading the SQL injection lab',
    lang: 'python',
    code: SQL_LAB,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [3, 11], text: py`An in-memory database with four products. Two are \`hidden\` — the shop should never show them to customers.` },
      { lines: [14, 17], text: py`The vulnerable version. The f-string pastes \`term\` **inside** the SQL text, between quotes the programmer wrote. Printing the SQL shows exactly what the database will parse.` },
      { lines: [20, 23], text: py`The safe version. The SQL text is a constant with a \`?\` placeholder, and the value travels separately as \`(term,)\`. Nothing the user types can change the SQL's structure.` },
      { lines: [26, 31], text: py`Both functions get the same two inputs. For \`"Notebook"\` they agree. For \`"x' OR '1'='1"\` the unsafe query becomes \`… AND name = 'x' OR '1'='1'\`; because \`AND\` binds tighter than \`OR\`, the condition is true for **every** row — including the hidden ones.` },
    ],
  },
  playground: {
    title: 'SQL injection lab',
    objective: 'Watch a crafted search term leak hidden products, then close the hole and add safe features.',
    files: { 'main.py': SQL_LAB },
    expected: py`For \`'Notebook'\` both functions return \`[('Notebook', 3.5)]\`. For \`"x' OR '1'='1"\` the unsafe search returns **all four** products — including the hidden staff voucher and prototype — while the safe search returns \`[]\`. Look at the printed SQL to see why.`,
    experiments: [
      {
        id: 'fix-unsafe',
        task: py`Fix \`search_unsafe\` so it is no longer injectable — keep its name, but make it use a \`?\` placeholder and pass \`(term,)\` to \`execute\`.`,
        hint: py`Copy the approach from \`search_safe\`: the SQL string must not contain \`{term}\` at all.`,
        tests: [
          { name: 'the attack returns no rows', code: py`assert search_unsafe("x' OR '1'='1") == []` },
          { name: 'normal searches still work', code: py`assert search_unsafe("Notebook") == [("Notebook", 3.5)]` },
        ],
        explain: py`With a placeholder the SQL text is fixed before any user data arrives. The database compiles the statement, then compares \`name\` with the literal string \`x' OR '1'='1\` — and no product has that name.`,
      },
      {
        id: 'like-search',
        task: py`Add \`search_like(fragment)\` that returns \`(name, price)\` for **visible** products whose name contains \`fragment\`, using \`name LIKE ?\` and passing \`f"%{fragment}%"\` as the parameter.`,
        hint: py`\`conn.execute("SELECT name, price FROM products WHERE hidden = 0 AND name LIKE ?", (f"%{fragment}%",)).fetchall()\``,
        tests: [
          { name: 'finds products by fragment', code: py`assert search_like("lamp") == [("Desk lamp", 24.99)]
assert search_like("o") == [("Notebook", 3.5)]` },
          { name: 'the attack string finds nothing', code: py`assert search_like("' OR '1'='1") == []` },
        ],
        explain: py`The \`%\` wildcards are part of the *value*, so they're still bound safely. One subtlety: a user can type \`%\` or \`_\` themselves to widen the match. That isn't injection (they can't escape the LIKE), but if it matters, escape those characters and add \`ESCAPE '\'\` to the SQL.`,
      },
      {
        id: 'sort-allowlist',
        task: py`Add \`list_products(sort)\` returning visible \`(name, price)\` rows, where \`sort\` is \`"name"\` or \`"price"\`. Column names can't be placeholders, so map the choice through a dict and raise \`ValueError\` for anything else.`,
        hint: py`\`ORDER_BY = {"name": "name", "price": "price"}\`, then look up \`ORDER_BY[sort]\` inside \`try/except KeyError\` and build \`f"... ORDER BY {column}"\` from the looked-up value.`,
        tests: [
          { name: 'sorts by price', code: py`assert [r[0] for r in list_products("price")] == ["Notebook", "Desk lamp"]` },
          { name: 'sorts by name', code: py`assert [r[0] for r in list_products("name")] == ["Desk lamp", "Notebook"]` },
          { name: 'anything else is rejected', code: py`for bad in ["price; DROP TABLE products", "hidden", "price DESC"]:
    with raises(ValueError):
        list_products(bad)` },
        ],
        explain: py`The f-string is safe here because it can only ever insert one of two strings *you* wrote. The user's text is used as a dictionary key, never as SQL.`,
      },
      {
        id: 'apostrophe',
        task: py`Add a product named \`Kid's scissors\` (price \`4.0\`, visible) using a **parameterised** \`INSERT\`, then print \`search_safe("Kid's scissors")\`. (Try it with \`search_unsafe\` too — but remove that line again, because it crashes.)`,
        hint: py`\`conn.execute("INSERT INTO products VALUES (?, ?, ?)", ("Kid's scissors", 4.0, 0))\` — put it after the \`executescript\` call.`,
        tests: [{ name: 'the product can be found', code: py`assert search_safe("Kid's scissors") == [("Kid's scissors", 4.0)]` }],
        explain: py`The unsafe version fails with \`sqlite3.OperationalError: near "s": syntax error\` — the apostrophe ends the string literal early. Injection bugs are also ordinary bugs: any customer called O'Brien would hit them. Placeholders fix both.`,
      },
    ],
    variants: [{ id: 'path-traversal', label: 'Path traversal lab', files: { 'main.py': PATH_LAB } }],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Why placeholders can\'t be "escaped"',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'fstr', label: 'f-string SQL', note: "WHERE name = 'x' OR '1'='1'", x: 130, y: 70, tone: 'red' },
        { id: 'tmpl', label: 'SQL template', note: 'WHERE name = ?', x: 130, y: 170, tone: 'blue' },
        { id: 'val', label: 'User value', note: "x' OR '1'='1", x: 130, y: 270, tone: 'yellow' },
        { id: 'parser', label: 'SQL parser', note: 'text → statement', x: 400, y: 120, tone: 'ink' },
        { id: 'stmt', label: 'Compiled statement', note: 'with a hole for ?', x: 620, y: 120, tone: 'kraft' },
        { id: 'run', label: 'Execute', note: 'compare name to value', x: 620, y: 270, tone: 'paper' },
      ],
      edges: [
        { id: 'bad', from: 'fstr', to: 'parser', label: 'user text parsed as SQL', dashed: true },
        { id: 'good', from: 'tmpl', to: 'parser', label: 'only your text' },
        { from: 'parser', to: 'stmt' },
        { id: 'bind', from: 'val', to: 'run', label: 'bound as data' },
        { from: 'stmt', to: 'run' },
      ],
      steps: [
        { focus: ['fstr', 'parser'], edges: ['bad'], text: py`**Unsafe:** with an f-string, the user's characters reach the **parser**. The quote ends the string literal and \`OR '1'='1'\` is read as SQL code. The parser has no way to know which characters came from the user.` },
        { focus: ['tmpl', 'parser'], edges: ['good'], text: py`**Safe:** with a placeholder, only *your* SQL text — containing \`?\` — is parsed.` },
        { focus: ['stmt'], edges: ['parser->stmt'], text: py`The database turns it into a **compiled statement** whose structure is now fixed: "find rows where name equals *some value*".` },
        { focus: ['val', 'run'], edges: ['bind', 'stmt->run'], text: py`The user's value is **bound** into the hole as data. It is never parsed, so quotes, \`OR\`, \`--\` and semicolons are just characters in a string being compared. That's why placeholders are a structural fix, not a clever form of escaping.` },
      ],
    },
    alt: 'Diagram. An f-string SQL node sends user text directly into the SQL parser, shown as a dashed red path. A SQL template with a question mark goes into the parser, which produces a compiled statement. The user value bypasses the parser and is bound as data at execution time.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every injection has the same three ingredients: (1) an **interpreter** — something that reads text as instructions (SQL engine, shell, Python, file system, template engine, log viewer); (2) **untrusted text**; (3) **string building** that mixes the two. Remove ingredient 3 and the bug is gone.`,
      py`| interpreter | dangerous | safe |
|---|---|---|
| SQL database | f-string / \`+\` / \`%\` in SQL | \`?\` / \`:name\` placeholders, allow-listed identifiers |
| shell | \`shell=True\`, \`os.system\` | \`subprocess.run([...])\`, a Python library |
| Python | \`eval\`, \`exec\` | \`ast.literal_eval\`, \`json.loads\`, a small parser |
| file system | \`base / user_path\` | \`resolve()\` + \`is_relative_to()\`, generated IDs |
| \`str.format\` | user-supplied template | \`string.Template.safe_substitute\` |
| HTML | inserting raw text | \`html.escape\`, auto-escaping templates |
| logs | raw values with newlines | \`%r\`, structured (JSON) logs |`,
    ],
    technical: [
      py`**How binding works in SQLite.** \`sqlite3\` calls \`sqlite3_prepare_v2\` on your SQL text, producing a compiled statement, then \`sqlite3_bind_*\` for each parameter. Values are never spliced into the text, which is also why you can't bind identifiers: the statement's structure (tables, columns) is fixed at prepare time. As a bonus, \`execute()\` refuses to run more than one statement (\`ProgrammingError: You can only execute one statement at a time.\`) — so the "\`; DROP TABLE\`" trick fails here, but \`OR '1'='1'\`, \`UNION SELECT\` and subqueries still work against unsafe code.`,
      py`**Why \`shell=True\` is different.** With an argument list, Python calls the operating system's process-creation function with an array of strings; the program receives exactly those strings. With \`shell=True\`, Python runs \`/bin/sh -c "<your string>"\`, and the shell performs word splitting, globbing, variable expansion, command substitution and command chaining on everything — including user input. On Windows, quoting rules differ again; argument lists are still the safe default.`,
      py`**Why \`literal_eval\` is safe(ish).** It parses the text into an AST (abstract syntax tree — the program's structure as nested objects) and only accepts nodes for literals: constants, tuples, lists, dicts, sets, and a few operators for signed and complex numbers. No calls, names or attribute access means no way to run code. It can still be fed huge or deeply nested input, so limit the size first. Here's the same allow-list idea applied to arithmetic — a **simplified** calculator (production code would also cap number sizes and recursion depth):`,
      { code: py`import ast
import operator

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
       ast.Div: operator.truediv, ast.USub: operator.neg}


def calc(expr: str) -> float:
    if len(expr) > 100:
        raise ValueError("expression too long")

    def walk(node):
        if isinstance(node, ast.Expression):
            return walk(node.body)
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            return OPS[type(node.op)](walk(node.left), walk(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
            return OPS[type(node.op)](walk(node.operand))
        raise ValueError("only numbers and + - * / are allowed")

    return walk(ast.parse(expr, mode="eval"))


print(calc("2 * (3 + 4) - -1"))   # 15`, lang: 'python', title: 'an allow-listed AST calculator (simplified)' },
      py`\`**\` is deliberately missing: \`9**9**9\` is a one-line way to make a server compute for a very long time.`,
      py`**Path resolution.** \`resolve()\` asks the OS for the canonical path, following every symlink. That matters: a symlink \`public/shortcut.txt → /home/app/.env\` passes a naive \`".." not in name\` check. There's a small race window (*TOCTOU*, time-of-check to time-of-use) if an attacker can create symlinks between your check and your \`open()\`; in that case also run the process with minimal file permissions and keep user-writable directories away from secrets.`,
    ],
    production: [
      py`**Use the safe layer by default.** ORMs (SQLAlchemy, Django) parameterise for you — until someone uses a raw-SQL escape hatch such as \`text()\`, \`.raw()\` or \`.extra()\` with an f-string. Grep for those in reviews. Static analysers such as **Bandit** and **Semgrep** flag \`shell=True\`, \`eval\`, \`pickle.loads\` and string-built SQL automatically; run them in CI (see [code quality tools](lesson:code-quality-tools)).`,
      py`**Least privilege limits the blast radius.** The web app's database user shouldn't own the schema or be able to read tables it doesn't need. The process shouldn't run as root or be able to read your SSH keys. When an injection does slip through, these limits decide whether it's an incident or a catastrophe — see [secure practices](lesson:secure-practices).`,
      py`**Validation is a second layer, not the fix.** Validating that a sort key is in an allow-list *is* the fix for identifiers; for values, parameterisation is the fix and [input validation](lesson:input-validation) is defence in depth. Don't try to block-list SQL keywords — a surname like "Select" or "Union" is legitimate.`,
      py`**Don't leak error details.** Returning raw database errors to clients (\`near "s": syntax error\`) tells attackers your query shape. Log the detail server-side; return a generic 500 or 400.`,
    ],
  },
  mistakes: [
    {
      title: 'Building SQL with f-strings, + or %',
      wrong: { code: py`def find_user(conn, email):
    return conn.execute(f"SELECT id FROM users WHERE email = '{email}'").fetchone()`, lang: 'python' },
      right: { code: py`def find_user(conn, email):
    return conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()`, lang: 'python' },
      explanation: py`Any string formatting that puts untrusted values *into SQL text* is injectable. Placeholders are the fix — not escaping quotes yourself, and not validation alone.`,
    },
    {
      title: 'Forgetting the comma in a one-item parameter tuple',
      wrong: { code: py`conn.execute("SELECT * FROM users WHERE name = ?", (name))     # (name) is just name`, lang: 'python', static: true },
      right: { code: py`conn.execute("SELECT * FROM users WHERE name = ?", (name,))    # a 1-tuple
conn.execute("SELECT * FROM users WHERE name = ?", [name])     # a list works too`, lang: 'python', static: true },
      explanation: py`Without the comma, \`sqlite3\` treats the string as a *sequence of characters*, one per placeholder: \`Incorrect number of bindings supplied\`. The temptation is to "fix" it with an f-string — don't.`,
    },
    {
      title: 'shell=True with user input',
      wrong: { code: py`subprocess.run(f"convert {upload} thumb.png", shell=True)`, lang: 'python', static: true },
      right: { code: py`subprocess.run(["convert", "--", str(upload_path), "thumb.png"], check=True, timeout=60)`, lang: 'python', static: true },
      explanation: py`A shell interprets \`;\`, \`|\`, \`&&\`, \`$(…)\` and backticks. An argument list bypasses the shell completely. Validate the path too, and use \`--\` so a name starting with \`-\` isn't read as an option.`,
    },
    {
      title: 'Using eval to parse data',
      wrong: { code: py`scores = eval(input("Scores, e.g. [90, 85]: "))`, lang: 'python', static: true },
      right: { code: py`import ast

raw = "[90, 85]"
scores = ast.literal_eval(raw)
if not (isinstance(scores, list) and all(type(s) is int for s in scores)):
    raise ValueError("expected a list of whole numbers")
print(scores)`, lang: 'python' },
      explanation: py`\`eval\` runs any expression with your program's permissions. \`ast.literal_eval\` only builds literals — and you still check the shape of what came back.`,
    },
    {
      title: 'Checking containment with a string prefix',
      wrong: { code: py`import os

BASE = "/srv/app"

def allowed(path):
    return os.path.abspath(path).startswith(BASE)

print(allowed("/srv/app2/secrets.txt"))   # True — wrong folder!`, lang: 'python' },
      right: { code: py`from pathlib import Path

BASE = Path("/srv/app")

def allowed(path):
    return Path(path).resolve().is_relative_to(BASE)

print(allowed("/srv/app2/secrets.txt"))   # False`, lang: 'python' },
      explanation: py`String prefixes don't understand path components: \`/srv/app2\` starts with \`/srv/app\`. \`abspath\` also doesn't follow symlinks. Use \`resolve()\` + \`is_relative_to()\` (or \`os.path.commonpath\` on resolved paths).`,
    },
    {
      title: 'Letting users supply str.format templates',
      wrong: { code: py`API_KEY = "sk-demo-123"

class User:
    def __init__(self, name):
        self.name = name

template = "Hi {user.name}! {user.__init__.__globals__[API_KEY]}"   # from a user
print(template.format(user=User("Ada")))    # Hi Ada! sk-demo-123`, lang: 'python' },
      right: { code: py`from string import Template

template = Template("Hi $name!")             # from a user
print(template.safe_substitute(name="Ada"))  # attribute access isn't possible`, lang: 'python' },
      explanation: py`Format fields can follow attributes and indexes, so a template author can walk from any object you pass to your module's globals. \`string.Template\` only substitutes \`$name\` placeholders with the plain values you provide.`,
    },
    {
      title: 'Logging untrusted values raw',
      wrong: { code: py`username = "eve\nINFO login ok user=admin"
print(f"WARNING failed login user={username}")
# WARNING failed login user=eve
# INFO login ok user=admin        <- forged line`, lang: 'python' },
      right: { code: py`username = "eve\nINFO login ok user=admin"
print(f"WARNING failed login user={username!r}")
# WARNING failed login user='eve\nINFO login ok user=admin'`, lang: 'python' },
      explanation: py`A newline in input can forge entries that mislead whoever reads the logs. Use \`!r\` / \`%r\` (which escapes control characters) or structured JSON logging, where each value is a properly quoted field.`,
    },
  ],
  debugging: [
    {
      symptom: py`sqlite3.OperationalError: near "s": syntax error`,
      cause: py`An apostrophe in a value (\`Kid's scissors\`, \`O'Brien\`) closed a string literal early — the query is built with string formatting and is injectable.`,
      fix: py`Switch to placeholders. Don't "fix" it by doubling quotes or calling \`.replace("'", "''")\` — that patches one symptom and leaves the vulnerability.`,
    },
    {
      symptom: py`sqlite3.ProgrammingError: Incorrect number of bindings supplied. The current statement uses 1, and there are 3 supplied.`,
      cause: py`A string was passed as the parameters (\`(name)\` instead of \`(name,)\`), so each of its characters counted as one value.`,
      fix: py`Pass a tuple with a trailing comma or a list: \`(name,)\` / \`[name]\`.`,
    },
    {
      symptom: py`sqlite3.ProgrammingError: You can only execute one statement at a time.`,
      cause: py`A query string contained a \`;\` and a second statement — often because a value was formatted into SQL (sometimes the sign of an attack in your logs).`,
      fix: py`Use placeholders for values. For trusted multi-statement scripts (migrations), use \`executescript()\`.`,
    },
    {
      symptom: py`ValueError: malformed node or string on line 1: Call(func=...)`,
      cause: py`\`ast.literal_eval\` was given something that isn't a pure literal — a function call, a name, an attribute access. It is refusing, exactly as designed.`,
      fix: py`Catch \`ValueError\` and \`SyntaxError\` (both are possible) and report "invalid input". Don't fall back to \`eval\`.`,
    },
    {
      symptom: py`ValueError: '/srv/app2/x' is not in the subpath of '/srv/app'`,
      cause: py`\`Path.relative_to()\` raises when the path is outside the base — your containment check caught a traversal attempt (or a bug in how paths are built).`,
      fix: py`Use \`is_relative_to()\` for a boolean check, or catch the \`ValueError\` and reject the request with a 403/404.`,
    },
  ],
  bestPractices: [
    'Pass every value to SQL with placeholders (?, :name, or the driver\'s %s) — never f-strings, + or the % operator.',
    'Map dynamic identifiers (columns, sort orders, table names) through an allow-list dict to strings you wrote.',
    'Call subprocess.run with an argument list and the default shell=False; prefer a Python library over shelling out.',
    'Never eval/exec untrusted text; use json.loads, ast.literal_eval or an allow-listed parser, after a size limit.',
    'Resolve user-influenced paths and check is_relative_to(base); better, store files under server-generated IDs.',
    'Never let users supply str.format templates; use string.Template.safe_substitute.',
    'Escape for the destination at output time: html.escape for HTML, %r or structured logs for log files.',
    'Run Bandit/Semgrep in CI and grep reviews for shell=True, eval(, exec(, text(f" and f"SELECT.',
  ],
  useCases: [
    'Search boxes, filters and sort options backed by SQL.',
    'Admin tools that call command-line programs (image conversion, backups, git).',
    'Configuration or formula fields where users type structured values.',
    'File download and upload endpoints that take a file name.',
    'Customer-editable email or notification templates.',
    'Audit and security logs that record user-supplied values.',
  ],
  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'injection-attacks-q1',
      type: 'mcq',
      prompt: 'What is the root cause shared by SQL injection, command injection and eval injection?',
      options: [
        { text: 'Users typing special characters such as quotes and semicolons', why: 'Special characters are legitimate (O\'Brien!). They only cause harm when the program lets them be interpreted as code.' },
        'Untrusted text is combined into a string that an interpreter then parses as instructions',
        { text: 'Missing input validation', why: 'Validation helps, but many valid values (names with apostrophes, free text) would still break string-built queries. The structural fix is separating code from data.' },
        { text: 'Using an outdated database or Python version', why: 'Injection is a flaw in how your code builds instructions; upgrading doesn\'t remove it.' },
      ],
      answer: 1,
      explanation: py`Injection = data crossing into the *code* channel. The fix is always an API that keeps them separate: placeholders, argument lists, literal parsers, path checks.`,
    },
    {
      id: 'injection-attacks-q2',
      type: 'output',
      prompt: 'What do these two lines print?',
      code: py`from pathlib import PurePosixPath

base = PurePosixPath("/srv/uploads")
print(base / "../../etc/passwd")
print(base / "/etc/passwd")`,
      options: [
        { text: '/srv/uploads/../../etc/passwd and /srv/uploads/etc/passwd', why: 'Joining an absolute path does not append it: the absolute right-hand side replaces the base entirely.' },
        '/srv/uploads/../../etc/passwd and /etc/passwd',
        { text: '/etc/passwd and /etc/passwd', why: 'Pure paths never collapse ".." — that needs resolve() on a real path, because ".." after a symlink can mean something else.' },
        { text: 'ValueError for both', why: 'Joining never validates anything; that is your job.' },
      ],
      answer: 1,
      explanation: py`\`/\` keeps \`..\` segments as-is (only \`resolve()\` collapses them) and an absolute right-hand side **replaces** the base. Both are traversal routes, which is why you must \`resolve()\` and check \`is_relative_to(base)\`.`,
    },
    {
      id: 'injection-attacks-q3',
      type: 'bug',
      prompt: 'This function is called with values from the URL query string. Click the line that makes it injectable.',
      code: py`def orders_for(conn, customer, status):
    allowed = {"open", "shipped", "cancelled"}
    if status not in allowed:
        raise ValueError("bad status")
    sql = f"SELECT id FROM orders WHERE customer = '{customer}' AND status = ?"
    return conn.execute(sql, (status,)).fetchall()`,
      answerLine: 5,
      explanation: py`\`status\` is allow-listed *and* parameterised, but \`customer\` is formatted straight into the SQL text. Use \`WHERE customer = ? AND status = ?\` with \`(customer, status)\`. One injectable value is enough.`,
    },
    {
      id: 'injection-attacks-q4',
      type: 'fill',
      prompt: 'Complete the safe query so that `email` is sent to the database as a separate value.',
      code: py`row = conn.execute(
    "SELECT id FROM users WHERE email = ___",
    ___,
).fetchone()`,
      answer: [['?', ':email'], ['(email,)', '[email]', '(email, )', '{"email": email}', "{'email': email}"]],
      explanation: py`\`?\` is sqlite3's positional placeholder; the parameters must be a sequence — \`(email,)\` with the trailing comma, or \`[email]\`. (With the named style \`:email\`, pass \`{"email": email}\`.)`,
    },
    {
      id: 'injection-attacks-q5',
      type: 'output',
      prompt: 'How many lines does this print, and what is on them?',
      code: py`username = "eve\nINFO login ok user=admin"
print(f"WARN failed login user={username}")
print(f"WARN failed login user={username!r}")`,
      options: [
        { text: "Two lines, both containing the whole username", why: 'The first print outputs a real newline character, which ends the line in the middle of the username.' },
        'Three lines: "WARN failed login user=eve", a forged "INFO login ok user=admin", then the !r version on one line with the newline shown as \\n',
        { text: 'Four lines — both prints are split', why: '!r uses repr(), which shows the newline as the two characters \\ and n, so the second print stays on one line.' },
        { text: 'A SyntaxError', why: 'Newlines in a string and !r in an f-string are both perfectly legal.' },
      ],
      answer: 1,
      explanation: py`The raw value forges a second line that looks like a genuine log entry. \`!r\` escapes the newline, keeping one event on one line — the core idea behind preventing log injection.`,
    },
    {
      id: 'injection-attacks-q6',
      type: 'mcq',
      prompt: 'A web tool lets users ping a host. Which implementation is safe from command injection?',
      options: [
        { text: 'os.system("ping -c 1 " + host)', why: 'os.system always runs a shell, so host = "x; cat /etc/passwd" runs a second command.' },
        { text: 'subprocess.run(f"ping -c 1 {host}", shell=True)', why: 'shell=True hands the whole string to /bin/sh, which interprets ; | && $( ).' },
        { text: 'subprocess.run(f"ping -c 1 {shlex.quote(host)}", shell=False)', why: 'Without a shell, a single string is treated as the program name on POSIX ("ping -c 1 …" as one executable) — it simply fails. Pass a list instead.' },
        'subprocess.run(["ping", "-c", "1", "--", host], check=True, timeout=5) after validating host',
      ],
      answer: 3,
      explanation: py`An argument list with no shell means \`host\` is one argument, whatever characters it contains. Validating it (e.g. with \`ipaddress.ip_address\` or a hostname pattern) and adding \`--\` also blocks argument injection like \`host = "-f"\`.`,
    },
    {
      id: 'injection-attacks-q7',
      type: 'short',
      prompt: 'Why can\'t you use a `?` placeholder for a column name in `ORDER BY`, and what do you do instead?',
      answer: py`Placeholders are bound after the statement is compiled, and they can only stand for values — the statement's structure (which tables and columns, ASC/DESC) must be known when it is parsed. So for identifiers you map the user's choice through an allow-list, e.g. {"price": "price ASC", "newest": "created_at DESC"}, and insert only the looked-up string you wrote; unknown keys raise an error.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'fix-order-queries',
      title: 'Fix the injectable order queries',
      difficulty: 'intermediate',
      prompt: py`A small shop's order lookups were written with f-strings. Rewrite both functions so they are not injectable, without changing what they return:

1. \`orders_for(customer, sort="newest")\` returns a list of \`(id, item)\` tuples for that customer. \`sort\` must be one of the keys of \`SORTS\` (\`"newest"\`, \`"oldest"\`, \`"item"\`) — use the mapped SQL fragment. **Any other value raises \`ValueError\`.** The customer must be passed as a placeholder value (customers like \`o'brien\` must work).
2. \`items_by_ids(ids)\` returns the item names (ordered by id) for a list of ids, using **one generated \`?\` per id** in the \`IN (...)\` clause. An empty list returns \`[]\`.`,
      files: {
        'main.py': py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.executescript("""
    CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, item TEXT, placed_at TEXT);
    INSERT INTO orders (customer, item, placed_at) VALUES
        ('ada', 'Desk lamp', '2026-01-05'),
        ('ada', 'Notebook', '2026-03-12'),
        ('ben', 'Monitor', '2026-02-20'),
        ('cy', 'Keyboard', '2026-01-30'),
        ('o''brien', 'Lamp shade', '2026-04-01');
""")

SORTS = {"newest": "placed_at DESC", "oldest": "placed_at ASC", "item": "item ASC"}


def orders_for(customer, sort="newest"):
    # TODO: injectable twice over — fix it
    order_by = SORTS.get(sort, sort)
    sql = f"SELECT id, item FROM orders WHERE customer = '{customer}' ORDER BY {order_by}"
    return conn.execute(sql).fetchall()


def items_by_ids(ids):
    # TODO: injectable — use generated placeholders
    id_list = ", ".join(str(i) for i in ids)
    rows = conn.execute(f"SELECT item FROM orders WHERE id IN ({id_list}) ORDER BY id")
    return [row[0] for row in rows]


print(orders_for("ada"))
print(items_by_ids([1, 3]))
`,
      },
      hints: [
        'The customer is a value, so it becomes a ? with (customer,) as the parameters. The sort is an identifier, so it must come from the SORTS dict — notice that SORTS.get(sort, sort) falls back to the raw input.',
        'For the sort: try: order_by = SORTS[sort] except KeyError: raise ValueError(...). For IN: marks = ", ".join("?" * len(ids)).',
        'items_by_ids: if not ids: return []; rows = conn.execute(f"SELECT item FROM orders WHERE id IN ({marks}) ORDER BY id", list(ids)).',
      ],
      solution: {
        explanation: py`Two different problems, two different fixes. The customer is a **value**, so it becomes a placeholder: quotes in names like \`o'brien\` and payloads like \`x' OR '1'='1\` are just characters to compare. The sort order is an **identifier**, which can't be a placeholder, so it's looked up in \`SORTS\` and anything unknown raises — the original \`SORTS.get(sort, sort)\` "failed open" by passing raw input straight into \`ORDER BY\`. For \`IN\`, the f-string only inserts \`?\` characters we generated (one per id); the ids themselves travel as parameters, so \`"1) OR (1=1"\` is compared as a value and matches nothing.`,
        files: {
          'main.py': py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.executescript("""
    CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, item TEXT, placed_at TEXT);
    INSERT INTO orders (customer, item, placed_at) VALUES
        ('ada', 'Desk lamp', '2026-01-05'),
        ('ada', 'Notebook', '2026-03-12'),
        ('ben', 'Monitor', '2026-02-20'),
        ('cy', 'Keyboard', '2026-01-30'),
        ('o''brien', 'Lamp shade', '2026-04-01');
""")

SORTS = {"newest": "placed_at DESC", "oldest": "placed_at ASC", "item": "item ASC"}


def orders_for(customer, sort="newest"):
    try:
        order_by = SORTS[sort]
    except KeyError:
        raise ValueError(f"unknown sort: {sort!r}") from None
    sql = f"SELECT id, item FROM orders WHERE customer = ? ORDER BY {order_by}"
    return conn.execute(sql, (customer,)).fetchall()


def items_by_ids(ids):
    ids = list(ids)
    if not ids:
        return []
    marks = ", ".join("?" * len(ids))
    rows = conn.execute(f"SELECT item FROM orders WHERE id IN ({marks}) ORDER BY id", ids)
    return [row[0] for row in rows]


print(orders_for("ada"))
print(items_by_ids([1, 3]))
`,
        },
      },
      tests: [
        { name: 'orders_for returns the customer\'s orders in each sort order', code: py`assert orders_for("ada") == [(2, "Notebook"), (1, "Desk lamp")]
assert orders_for("ada", "oldest") == [(1, "Desk lamp"), (2, "Notebook")]
assert orders_for("ada", "item") == [(1, "Desk lamp"), (2, "Notebook")]` },
        { name: 'an injection payload in customer returns nothing', code: py`assert orders_for("x' OR '1'='1") == []` },
        { name: 'names with apostrophes work', code: py`assert orders_for("o'brien") == [(5, "Lamp shade")]` },
        { name: 'unknown sort values raise ValueError', code: py`for bad in ["placed_at", "item; DROP TABLE orders", "(SELECT 1)"]:
    with raises(ValueError):
        orders_for("ada", bad)` },
        { name: 'items_by_ids uses values safely', code: py`assert items_by_ids([1, 3]) == ["Desk lamp", "Monitor"]
assert items_by_ids([]) == []
assert items_by_ids(["1) OR (1=1"]) == []` },
      ],
    },
    {
      id: 'safe-download-path',
      title: 'Contain a download path',
      difficulty: 'advanced',
      prompt: py`A download endpoint receives a file name from the URL. Write \`safe_path(base, user_path)\` that:

- joins \`user_path\` onto \`base\` and **resolves** the result (absolute, \`..\` collapsed, symlinks followed);
- returns that resolved \`Path\` if it is inside the resolved \`base\` (\`is_relative_to\`);
- otherwise raises \`PermissionError\`.

It must block \`"../secret.txt"\`, absolute paths, the sibling folder trick \`"../public2/notes.txt"\`, and a symlink inside \`public/\` that points outside. Paths like \`"docs/../docs/guide.txt"\` that stay inside are allowed.`,
      files: {
        'main.py': py`from pathlib import Path

# A tiny file system for the exercise
Path("public/docs").mkdir(parents=True, exist_ok=True)
Path("public/docs/guide.txt").write_text("How to use the shop")
Path("public2").mkdir(exist_ok=True)
Path("public2/notes.txt").write_text("not for the public")
Path("secret.txt").write_text("DB_PASSWORD=hunter2")


def safe_path(base, user_path):
    # TODO: this check is easy to bypass
    if ".." in user_path:
        raise PermissionError("no .. allowed")
    return Path(base) / user_path


print(safe_path("public", "docs/guide.txt").read_text())
`,
      },
      hints: [
        'Block-listing ".." misses absolute paths and symlinks, and also blocks harmless paths. Let the file system tell you where a path really goes.',
        'root = Path(base).resolve(); candidate = (root / user_path).resolve()',
        'if not candidate.is_relative_to(root): raise PermissionError(...); return candidate',
      ],
      solution: {
        explanation: py`Instead of guessing which strings are dangerous, the function asks where the path *actually* leads. \`resolve()\` makes it absolute, collapses \`..\`, and follows symlinks; joining an absolute \`user_path\` replaces the base, and \`resolve()\` reports that faithfully too. Then \`is_relative_to\` compares path **components**, so \`/…/public2/notes.txt\` is correctly outside \`/…/public\` even though the strings share a prefix. Harmless paths like \`docs/../docs/guide.txt\` are allowed because they resolve inside the base. In production you would also open the file in the same step (to narrow the race window) and prefer server-generated IDs over user-chosen names.`,
        files: {
          'main.py': py`from pathlib import Path

# A tiny file system for the exercise
Path("public/docs").mkdir(parents=True, exist_ok=True)
Path("public/docs/guide.txt").write_text("How to use the shop")
Path("public2").mkdir(exist_ok=True)
Path("public2/notes.txt").write_text("not for the public")
Path("secret.txt").write_text("DB_PASSWORD=hunter2")


def safe_path(base, user_path):
    root = Path(base).resolve()
    candidate = (root / user_path).resolve()
    if not candidate.is_relative_to(root):
        raise PermissionError(f"outside {base}/: {user_path!r}")
    return candidate


print(safe_path("public", "docs/guide.txt").read_text())
`,
        },
      },
      tests: [
        { name: 'returns the resolved path for a normal file', code: py`assert safe_path("public", "docs/guide.txt") == Path("public/docs/guide.txt").resolve()` },
        { name: 'allows .. that stays inside', code: py`assert safe_path("public", "docs/../docs/guide.txt") == Path("public/docs/guide.txt").resolve()` },
        { name: 'blocks ../ and absolute paths', code: py`with raises(PermissionError):
    safe_path("public", "../secret.txt")
with raises(PermissionError):
    safe_path("public", str(Path("secret.txt").resolve()))` },
        { name: 'blocks the sibling-folder prefix trick', code: py`with raises(PermissionError):
    safe_path("public", "../public2/notes.txt")` },
        { name: 'blocks a symlink that points outside', code: py`import os
try:
    os.symlink(Path("secret.txt").resolve(), "public/shortcut.txt")
except FileExistsError:
    pass
with raises(PermissionError):
    safe_path("public", "shortcut.txt")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'injection-attacks-what-is-injection',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is an injection vulnerability, and what is the general way to prevent it?',
      answer: 'Injection is when untrusted input is concatenated into something an interpreter parses — SQL, a shell command, code, a path, a template — so the input can change the instruction itself. Prevent it by keeping data separate from code: parameterised queries, argument lists without a shell, literal parsers instead of eval, path containment checks, and allow-lists for anything that can\'t be parameterised.',
      explanation: py`The interpreter can't tell your characters from the attacker's once they're in one string. Safe APIs pass data through a separate channel (bound parameters, argv entries, parsed literals). Validation and least privilege are extra layers that reduce the damage if something slips through.`,
      whyAsked: 'Checks that the candidate understands the unifying principle rather than memorising one SQL example.',
      mistakes: ['Answering only "use prepared statements" with no general principle', 'Proposing escaping or block-listing keywords as the main fix', 'Thinking validation alone prevents injection'],
      followUps: ['Why isn\'t escaping quotes enough?', 'What can\'t be parameterised in SQL?', 'Give a non-SQL example of injection.'],
      modelAnswer: 'Injection happens when I build an instruction for some interpreter — a SQL query, a shell command, Python code, a file path — by pasting untrusted text into it, so the input can change the meaning of the instruction. The classic case is a quote in a search term closing the SQL string and adding OR 1=1. The general fix is to keep code and data in separate channels: placeholders for SQL values, subprocess with an argument list and no shell, json or ast.literal_eval instead of eval, resolving paths and checking they stay inside a base folder. For things that can\'t be parameterised, like column names, I use an allow-list. Validation and least privilege are useful extra layers, not the fix.',
    },
    {
      id: 'injection-attacks-os-path-join',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'An endpoint serves files with `open(os.path.join("/srv/files", name))`. What does `os.path.join("/srv/files", "/etc/passwd")` return?',
      code: { lang: 'python', code: py`import os

print(os.path.join("/srv/files", "/etc/passwd"))` },
      options: ['/srv/files/etc/passwd', '/srv/files//etc/passwd', '/etc/passwd', 'It raises ValueError'],
      correctOption: 2,
      answer: '/etc/passwd — when a later component is absolute, os.path.join (and pathlib\'s /) throws away everything before it.',
      explanation: py`This is documented behaviour, and it means joining is never a security check. Resolve the result and verify containment with \`Path.resolve().is_relative_to(base)\` — or avoid user-supplied names altogether.`,
      whyAsked: 'A sharp, practical detail that many developers get wrong when writing upload/download code.',
      mistakes: ['Assuming join always nests under the base', 'Only blocking ".." and forgetting absolute paths', 'Checking with str.startswith'],
      followUps: ['How would you write the containment check?', 'What about symlinks inside the base folder?', 'How does Windows change this (drive letters)?'],
      modelAnswer: 'It returns /etc/passwd. When any component passed to os.path.join is absolute, everything before it is discarded — pathlib\'s slash operator behaves the same way. So an attacker doesn\'t even need dot-dot sequences. That tells me joining is just string assembly, never a security check. I\'d resolve the joined path and then check is_relative_to on the resolved base folder, rejecting anything outside, and ideally I\'d serve files by an ID that maps to a server-chosen file name.',
    },
    {
      id: 'injection-attacks-shell-review',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'In code review you see the function below. What can go wrong, and how would you rewrite it?',
      code: { lang: 'python', code: py`import subprocess

def make_thumbnail(upload_name: str) -> None:
    subprocess.run(
        f"convert uploads/{upload_name} -resize 200x200 thumbs/{upload_name}",
        shell=True,
    )`, static: true },
      answer: 'shell=True lets characters like ; | $( ) in upload_name run extra commands (command injection); a name starting with - can become an option (argument injection); ../ can escape the folders; and errors are silently ignored. Rewrite with a validated, resolved path, an argument list without a shell, -- before file arguments, check=True and a timeout — or use an imaging library instead.',
      explanation: py`Fixed version: generate the stored name yourself (e.g. a UUID), resolve both paths under their base directories, then \`subprocess.run(["convert", "--", str(src), "-resize", "200x200", str(dst)], check=True, timeout=60)\` — although with ImageMagick-style tools, check whether \`--\` is supported or prefix paths so they can't start with \`-\`. \`check=True\` turns a non-zero exit into an exception rather than silently producing nothing. Also consider running the converter in a sandbox with limited permissions — image parsers have their own vulnerabilities.`,
      whyAsked: 'Tests whether the candidate sees all the layered issues — not only shell=True — and can propose a robust rewrite.',
      mistakes: ['Only suggesting shlex.quote', 'Missing argument injection and path traversal', 'Forgetting check=True / timeouts'],
      followUps: ['When is shlex.quote acceptable?', 'What does -- do?', 'How would you limit the damage if the converter itself is exploited?'],
      modelAnswer: 'The big problem is shell=True with a user-controlled file name: a name containing a semicolon or $( ) runs extra commands as the web server user. Even without the shell, a name starting with a dash could be parsed as an option, and ../ could read or write outside the upload folders. Also, without check=True failures are silently ignored. I\'d generate the stored file name myself, resolve both paths and check they stay inside their directories, then call subprocess.run with an argument list, no shell, a -- separator where the tool supports it, check=True and a timeout. Better still, I\'d use an imaging library and run the conversion with minimal privileges.',
    },
    {
      id: 'injection-attacks-eval-alternatives',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `eval`, `ast.literal_eval` and `json.loads` for turning user-supplied text into Python data. Is `eval(text, {"__builtins__": {}})` a safe compromise?',
      answer: 'eval runs any expression and must never see untrusted input. ast.literal_eval only builds Python literals and can\'t call functions. json.loads parses JSON — the best choice for data exchange. Removing builtins does not make eval safe: object attributes such as ().__class__ still lead to dangerous functionality.',
      explanation: py`\`literal_eval\` is right for Python-literal syntax (tuples, sets, single-quoted strings); JSON is right when other systems produce the data. Both still need size limits and shape validation. Restricted-globals tricks have a long history of bypasses through dunder attributes, so they're not a security boundary.`,
      whyAsked: 'eval misuse is common in scripts that "grew into" services; interviewers want a crisp, correct alternative and the knowledge that sandboxing eval fails.',
      mistakes: ['Believing an empty __builtins__ makes eval safe', 'Using literal_eval without size limits on hostile input', 'Forgetting to validate the shape of the result'],
      followUps: ['How would you allow simple arithmetic safely?', 'Can literal_eval crash the interpreter?'],
      modelAnswer: 'eval executes arbitrary Python, so untrusted text in eval is remote code execution. ast.literal_eval parses the text and only accepts literal nodes — strings, numbers, tuples, lists, dicts, sets, booleans and None — so it can\'t call anything; I use it for Python-literal config. json.loads is my default for data from other systems because it\'s a well-defined, language-neutral format. Restricting builtins doesn\'t fix eval: from any object you can walk attributes like dunder class and subclasses to reach dangerous classes, so it\'s not a sandbox. Whatever parser I use, I limit input size and validate the structure I get back.',
    },
    {
      id: 'injection-attacks-literal-settings',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: py`A tool lets admins paste settings as a Python dict literal. The current code calls \`eval\`. Rewrite \`load_settings(text)\` so it returns a \`dict\` using \`ast.literal_eval\`, and raises \`ValueError\` if the text is longer than 10,000 characters, is not a valid literal (including syntax errors), or is not a dict.`,
      answer: 'Check the length, call ast.literal_eval inside try/except (ValueError, SyntaxError, TypeError, MemoryError, RecursionError) and re-raise as ValueError, then check isinstance(result, dict).',
      explanation: py`\`literal_eval\` raises \`ValueError\` for non-literal nodes but \`SyntaxError\` for text that doesn't parse — callers shouldn't need to know that, so both become \`ValueError\`. The \`isinstance\` check validates the shape, and the length limit bounds the parser's work.`,
      starter: { files: { 'main.py': py`import ast


def load_settings(text):
    # TODO: never eval untrusted text
    return eval(text)


print(load_settings("{'theme': 'dark', 'font_size': 14}"))
` } },
      tests: [
        { name: 'parses a dict literal', code: py`assert load_settings("{'theme': 'dark', 'font_size': 14}") == {"theme": "dark", "font_size": 14}` },
        { name: 'code is not executed', code: py`with raises(ValueError):
    load_settings("print('pwned') or {}")` },
        { name: 'non-dicts are rejected', code: py`with raises(ValueError):
    load_settings("[1, 2, 3]")` },
        { name: 'syntax errors become ValueError', code: py`with raises(ValueError):
    load_settings("{'theme': ")` },
        { name: 'huge input is rejected', code: py`with raises(ValueError):
    load_settings("{'a': '" + "x" * 10_000 + "'}")` },
      ],
      solution: { files: { 'main.py': py`import ast

MAX_LEN = 10_000


def load_settings(text):
    if len(text) > MAX_LEN:
        raise ValueError("settings are too large")
    try:
        value = ast.literal_eval(text)
    except (ValueError, SyntaxError, TypeError, MemoryError, RecursionError) as exc:
        raise ValueError("settings must be a Python literal") from exc
    if not isinstance(value, dict):
        raise ValueError("settings must be a dict")
    return value


print(load_settings("{'theme': 'dark', 'font_size': 14}"))
` } },
      hints: ['ast.literal_eval(text) only accepts literals.', 'It raises ValueError for calls and names, but SyntaxError for broken text — catch both.', 'Check the type of the result before returning it.'],
      whyAsked: 'A realistic refactor from an unsafe pattern, testing knowledge of literal_eval\'s exceptions and the habit of validating shape and size.',
      mistakes: ['Catching only ValueError', 'Returning whatever literal_eval produced without checking it is a dict', 'Forgetting a size limit'],
      followUps: ['Why might JSON be a better format here?', 'How would you also validate the keys and value types?'],
      modelAnswer: 'I\'d replace eval with ast.literal_eval, which only builds literals and can\'t call functions. First I check the length so the parser\'s work is bounded. Then I call literal_eval in a try block and convert ValueError, SyntaxError and a few resource errors into one ValueError with a friendly message, chaining the original. Finally I check the result is a dict, because a valid literal could be a list or a number. Longer term I\'d move to JSON or TOML and validate the keys with a schema.',
    },
    {
      id: 'injection-attacks-template-scenario',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your SaaS lets customers customise notification emails with templates like `"Hi {user.first_name}, your order {order.id} shipped"`, rendered with `template.format(user=user, order=order)`. What are the risks, and what would you change?',
      answer: 'Customers control a format string, so they can traverse attributes (e.g. {user.__init__.__globals__[...]}) to read secrets or internal data, and use huge padding like {order.id:>999999999} to exhaust memory. Switch to a safe templating approach — string.Template with a fixed set of $placeholders mapped to pre-computed plain strings, or a sandboxed template engine — plus length limits and HTML escaping for HTML emails.',
      explanation: py`\`str.format\` field syntax supports \`.attr\` and \`[key]\` lookups on the objects you pass in, so passing rich objects exposes everything reachable from them, including module globals via function objects. Passing only plain strings closes the traversal but not the padding DoS. A curated set of variables (\`$first_name\`, \`$order_id\`) rendered with \`Template.safe_substitute\` gives customers what they need and nothing more. If you need loops/conditionals, use Jinja2's \`SandboxedEnvironment\` (third-party) with autoescaping, and still limit template size.`,
      whyAsked: 'Format-string injection is less famous than SQL injection; this checks whether the candidate can spot an interpreter hiding in plain sight.',
      mistakes: ['Thinking format strings are harmless because they "only display text"', 'Fixing it by block-listing "__"', 'Forgetting resource exhaustion through width/precision'],
      followUps: ['What would you log when a template fails to render?', 'How do t-strings (3.14) relate to this problem?'],
      modelAnswer: 'Here the customer controls the format string itself, and str.format can follow attributes and index keys on the objects I pass. Starting from user, a template can walk to a method\'s dunder globals and print module-level secrets, or use an enormous field width to make the worker allocate huge strings. Block-listing double underscores isn\'t a reliable fix. I\'d give customers a fixed vocabulary of variables, compute those as plain strings myself, and render with string.Template\'s safe_substitute, which only does dollar-name substitution. If they need logic, I\'d use a sandboxed template engine with autoescaping, plus limits on template length and render time.',
    },
  ],

  takeaways: [
    'Injection = untrusted text glued into something an interpreter parses (SQL, shell, Python, paths, templates, logs, HTML).',
    'The cure is structural: send data through a separate channel — placeholders, argument lists, literal parsers.',
    'SQL values go in ? / :name placeholders; identifiers come from an allow-list dict; never f-strings, + or %.',
    'Use subprocess.run([...]) without shell=True, add -- before file arguments, and prefer a Python library to a subprocess.',
    'Never eval/exec untrusted text: use json.loads, ast.literal_eval or an allow-listed parser — and limit size first.',
    'Contain paths with resolve() + is_relative_to(base); joining an absolute path discards the base, and startswith checks are wrong.',
    'Users must never control str.format templates (use string.Template); escape HTML with html.escape and log untrusted values with %r.',
  ],
}
