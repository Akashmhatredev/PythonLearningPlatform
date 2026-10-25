// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LIBRARY = py`import csv
import sqlite3

SCHEMA = """
CREATE TABLE authors (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE books (
    id        INTEGER PRIMARY KEY,
    title     TEXT NOT NULL,
    year      INTEGER NOT NULL,
    copies    INTEGER NOT NULL DEFAULT 1,
    author_id INTEGER NOT NULL REFERENCES authors(id)
);
"""


def build_library(csv_path="books.csv"):
    """Create an in-memory database and load the CSV into two tables."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row      # rows behave like read-only dicts
    conn.executescript(SCHEMA)
    with open(csv_path, newline="", encoding="utf-8") as f:
        books = [
            {"title": r["title"], "author": r["author"],
             "year": int(r["year"]), "copies": int(r["copies"])}
            for r in csv.DictReader(f)
        ]
    with conn:                          # one transaction: all rows or none
        conn.executemany(
            "INSERT OR IGNORE INTO authors (name) VALUES (?)",
            [(b["author"],) for b in books],
        )
        conn.executemany(
            """INSERT INTO books (title, year, copies, author_id)
               VALUES (:title, :year, :copies,
                       (SELECT id FROM authors WHERE name = :author))""",
            books,
        )
    return conn


conn = build_library()

print("== Books after 1950, newest first ==")
newer = "SELECT title, year FROM books WHERE year > ? ORDER BY year DESC"
for row in conn.execute(newer, (1950,)):
    print(f"{row['year']}  {row['title']}")

print("\n== Books per author ==")
report = conn.execute("""
    SELECT authors.name AS author,
           COUNT(*) AS book_count,
           SUM(books.copies) AS copies
    FROM books
    JOIN authors ON authors.id = books.author_id
    GROUP BY authors.name
    ORDER BY book_count DESC, author
""").fetchall()
for row in report:
    print(f"{row['author']:<18} books: {row['book_count']}  copies: {row['copies']}")

print("\n== Buy two more copies of Dune ==")
with conn:
    cur = conn.execute(
        "UPDATE books SET copies = copies + ? WHERE title = ?", (2, "Dune")
    )
print("rows updated:", cur.rowcount)
dune = conn.execute(
    "SELECT title, copies FROM books WHERE title = ?", ("Dune",)
).fetchone()
print(dict(dune))
conn.close()
`

const BOOKS_CSV = py`title,author,year,copies
Frankenstein,Mary Shelley,1818,2
The Time Machine,H. G. Wells,1895,1
The War of the Worlds,H. G. Wells,1898,2
Foundation,Isaac Asimov,1951,3
The End of Eternity,Isaac Asimov,1955,1
Dune,Frank Herbert,1965,4
A Wizard of Earthsea,Ursula K. Le Guin,1968,2
The Left Hand of Darkness,Ursula K. Le Guin,1969,1
`

export default {
  id: 'sql-and-sqlite',
  title: 'SQL & sqlite3',
  summary: 'Store data in tables, ask questions of it with SQL, and drive a real SQLite database from Python safely with parameterised queries and transactions.',
  difficulty: 'intermediate',
  minutes: 60,
  prerequisites: ['tuples-and-unpacking', 'dictionaries', 'try-except', 'csv-data'],
  related: ['database-patterns', 'injection-attacks', 'input-validation', 'context-managers', 'json-data', 'serialization', 'project-library-api', 'building-apis'],
  tags: ['sql', 'sqlite', 'sqlite3', 'database', 'relational database', 'table', 'row', 'column', 'primary key', 'foreign key', 'select', 'insert', 'update', 'delete', 'where', 'order by', 'join', 'left join', 'group by', 'having', 'aggregate', 'count', 'sum', 'placeholders', 'parameterised query', 'sql injection', 'commit', 'rollback', 'transaction', 'cursor', 'row_factory', 'executemany'],
  apis: [
    { name: 'sqlite3.connect(database)', summary: 'Opens (or creates) a SQLite database file and returns a Connection. ":memory:" makes a throwaway in-memory database.' },
    { name: 'Connection.execute(sql, params)', summary: 'Shortcut that creates a cursor, runs one SQL statement with the given parameters and returns the cursor.' },
    { name: 'Connection.executemany(sql, seq)', summary: 'Runs the same statement once for every parameter tuple/dict in seq — the fast way to insert many rows.' },
    { name: 'Connection.executescript(sql)', summary: 'Runs several semicolon-separated statements (no parameters). Handy for creating a schema.' },
    { name: 'Cursor.fetchone() / fetchall() / fetchmany(n)', summary: 'Take the next row (or None), all remaining rows, or the next n rows from a query result.' },
    { name: 'Cursor.lastrowid / Cursor.rowcount', summary: 'The rowid of the last inserted row; the number of rows changed by the last INSERT/UPDATE/DELETE.' },
    { name: 'Connection.commit() / rollback()', summary: 'Make the current transaction permanent, or undo everything since it began.' },
    { name: 'with conn:', summary: 'Commits if the block succeeds, rolls back if it raises. It does NOT close the connection.' },
    { name: 'sqlite3.Row', summary: 'A row_factory that makes rows accessible by column name (row["title"]) as well as index; dict(row) works.' },
    { name: '? and :name placeholders', summary: 'Mark where values go in SQL; the values are sent separately so they can never change the query.' },
  ],
  docs: [
    { label: 'sqlite3 — DB-API 2.0 interface for SQLite', url: 'https://docs.python.org/3/library/sqlite3.html' },
    { label: 'sqlite3 — how to use placeholders to bind values', url: 'https://docs.python.org/3/library/sqlite3.html#sqlite3-placeholders' },
    { label: 'sqlite3 — transaction control', url: 'https://docs.python.org/3/library/sqlite3.html#sqlite3-controlling-transactions' },
    { label: 'SQLite — SQL as understood by SQLite', url: 'https://www.sqlite.org/lang.html' },
    { label: 'SQLite — datatypes and type affinity', url: 'https://www.sqlite.org/datatype3.html' },
    { label: 'PEP 249 — Python Database API Specification v2.0', url: 'https://peps.python.org/pep-0249/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **database** is a program whose whole job is to store data safely and answer questions about it quickly. A **relational database** keeps that data in **tables** — think spreadsheets with strict rules:`,
    py`- each **column** has a name and a type (\`title TEXT\`, \`year INTEGER\`);
- each **row** is one record (one book, one student, one order);
- a **primary key** is a column whose value is unique for every row, so you can point at exactly one row (\`id = 7\`);
- a **foreign key** is a column that holds another table's primary key, which is how tables *relate* (a book's \`author_id\` points at a row in \`authors\`).`,
    py`You talk to a relational database in **SQL** (Structured Query Language): short declarative sentences like \`SELECT title FROM books WHERE year > 1950\`. *Declarative* means you describe **what** you want, and the database works out **how** to get it.`,
    py`**SQLite** is a complete SQL database that lives inside a single file (or entirely in memory) and runs inside your own program — no server to install. Python ships with the \`sqlite3\` module to drive it, so everything in this lesson runs right here in the browser. The SQL you learn transfers almost unchanged to PostgreSQL and MySQL; [database patterns](lesson:database-patterns) then shows how to organise that code in real applications.`,
  ],
  why: [
    py`You can already save data to [CSV](lesson:csv-data) or [JSON](lesson:json-data) files. That works until the questions get harder: *"which customers spent more than £100 last month, sorted by total?"* means loading every record and writing loops by hand. A database answers it in one query, and can use **indexes** to avoid reading everything.`,
    py`Databases also **protect** data. Constraints (\`NOT NULL\`, \`UNIQUE\`, \`CHECK\`) reject bad rows before they are saved, and **transactions** guarantee that a group of changes happens completely or not at all — a power cut halfway through moving money never leaves the money in neither account.`,
    py`Almost every real application — websites, phone apps, games with save files, the browser you're using — sits on a database. SQLite alone is built into phones, browsers and countless desktop programs, so learning SQL is one of the highest-value skills in programming.`,
  ],
  eli15: [
    py`Imagine the school office has filing cabinets. One drawer holds a card for every **student**, another a card for every **class**. Every card has the same printed boxes (name, year, tutor group) — those are **columns**. Each card is a **row**. Each student card has a unique **student number** printed in the corner — that's the **primary key**.`,
    py`You're not allowed to rummage in the drawers yourself. Instead you fill in a **request slip** and hand it to the office clerk: *"Give me the names of all Year 10 students, sorted by surname."* That slip is **SQL**. The clerk knows the fastest way to find the cards.`,
    py`The slip has **blank boxes** for the details you fill in (\`?\`). The clerk treats whatever is written in a blank box as plain data — even if someone writes *"…and also shred every card"* in it. That's why we always use the blanks instead of writing our own sentences: it's what stops **SQL injection**.`,
  ],
  analogy: {
    title: 'A library catalogue with a very strict librarian',
    body: [
      py`A library keeps a drawer of index cards for books and another for authors. Every book card says *"author: see card #12 in the Authors drawer"* instead of repeating the author's whole biography. When you want something, you hand the librarian a printed request form; the librarian decides whether to flip through every card or use the alphabetical tabs, then hands you copies of the matching cards.`,
      py`When you add or change cards, the librarian works on a draft pile first. Only when you say "file them" do the changes go into the drawers — and if you say "scrap that", the draft pile goes in the bin and the drawers are exactly as before.`,
    ],
    mapping: [
      ['a drawer of index cards', 'a table'],
      ['the printed boxes on every card', 'columns, each with a type'],
      ['one card', 'one row (record)'],
      ['the card number in the corner', 'the primary key (id INTEGER PRIMARY KEY)'],
      ['"see card #12 in the Authors drawer"', 'a foreign key (books.author_id → authors.id)'],
      ['the request form you hand over', 'an SQL statement'],
      ['blank boxes on the form', 'placeholders: ? or :name'],
      ['alphabetical tabs in the drawer', 'an index'],
      ['"file them" / "scrap that"', 'commit / rollback'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: "A query's journey",
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'code', label: 'Your Python', note: 'conn.execute(sql, params)', x: 110, y: 70, tone: 'yellow' },
        { id: 'driver', label: 'sqlite3 module', note: 'SQL text + values, kept apart', x: 380, y: 70, tone: 'blue' },
        { id: 'parser', label: 'Parser', note: 'SQL text → prepared statement', x: 650, y: 70 },
        { id: 'planner', label: 'Query planner', note: 'scan every row or use an index?', x: 650, y: 255, tone: 'kraft' },
        { id: 'storage', label: 'Database file', note: 'tables & indexes as B-trees', x: 380, y: 255 },
        { id: 'cursor', label: 'Cursor', note: 'hands rows back one at a time', x: 110, y: 255, tone: 'yellow' },
      ],
      edges: [
        { from: 'code', to: 'driver', label: 'SQL + (1950,)' },
        { from: 'driver', to: 'parser', label: 'prepare' },
        { from: 'parser', to: 'planner', label: 'statement' },
        { from: 'planner', to: 'storage', label: 'read pages' },
        { from: 'storage', to: 'cursor', label: 'matching rows' },
        { from: 'cursor', to: 'code', label: 'fetchone / fetchall / for' },
      ],
      steps: [
        { focus: ['code'], text: py`You call \`conn.execute("SELECT title FROM books WHERE year > ?", (1950,))\`. The SQL has a **placeholder** \`?\` where the value goes; the value travels separately in a tuple.` },
        { focus: ['code', 'driver'], edges: ['code->driver'], text: py`The \`sqlite3\` module receives the SQL text and the parameters **as two separate things**. It never glues them together into one string.` },
        { focus: ['driver', 'parser'], edges: ['driver->parser'], text: py`SQLite **parses** the SQL text into a prepared statement. At this point the meaning of the query is fixed — the \`?\` is a slot, not code. Then the value \`1950\` is **bound** into the slot. Whatever the value contains, it can only ever be data.` },
        { focus: ['parser', 'planner'], edges: ['parser->planner'], text: py`The **query planner** decides *how* to answer: read every row of \`books\` (a *scan*), or jump straight to matching rows through an **index**. You describe *what*; the planner picks *how*. You can ask for its plan with \`EXPLAIN QUERY PLAN\` (see [database patterns](lesson:database-patterns)).` },
        { focus: ['planner', 'storage'], edges: ['planner->storage'], text: py`The engine reads the pages of the database file (or memory) where the table lives. Tables and indexes are stored as **B-trees** — sorted tree structures that make lookups by key fast.` },
        { focus: ['storage', 'cursor'], edges: ['storage->cursor'], text: py`Matching rows flow into a **cursor**. Rows are produced *as you ask for them*, so iterating a large result doesn't have to load it all into memory at once.` },
        { focus: ['cursor', 'code'], edges: ['cursor->code'], text: py`Your code pulls rows out with \`fetchone()\`, \`fetchall()\` or a \`for\` loop. Each row is a tuple — or an \`sqlite3.Row\` you can index by column name if you set \`conn.row_factory = sqlite3.Row\`.` },
      ],
    },
    alt: 'A loop of six boxes. Your Python sends SQL text and a separate tuple of values to the sqlite3 module, which asks the SQLite parser to prepare the statement. The parser hands the statement to the query planner, which decides whether to scan the table or use an index, then reads pages from the database file. Matching rows flow into a cursor, and the cursor returns rows to your Python code through fetchone, fetchall or a for loop.',
    caption: py`Step through with ▶. The key moment is step 3: the query's *shape* is fixed **before** the values are bound, which is exactly why placeholders defeat SQL injection.`,
  },
  syntax: [
    py`#### Tables, rows, columns and keys`,
    { code: py`CREATE TABLE authors (
    id   INTEGER PRIMARY KEY,          -- unique id, SQLite fills it in
    name TEXT NOT NULL UNIQUE          -- required, no duplicates
);

CREATE TABLE books (
    id        INTEGER PRIMARY KEY,
    title     TEXT NOT NULL,
    year      INTEGER CHECK (year > 0),
    copies    INTEGER NOT NULL DEFAULT 1,
    author_id INTEGER NOT NULL REFERENCES authors(id)   -- foreign key
);`, lang: 'sql', title: 'schema.sql' },
    py`SQLite's main storage types are \`INTEGER\`, \`REAL\` (floats), \`TEXT\`, \`BLOB\` (raw bytes) and \`NULL\` (no value — SQL's \`None\`). **Constraints** are rules the database enforces on every write: \`NOT NULL\`, \`UNIQUE\`, \`CHECK (...)\`, \`DEFAULT\`, \`PRIMARY KEY\`, \`REFERENCES\`. SQL keywords are case-insensitive; writing them in capitals is a convention that makes queries easier to scan. \`--\` starts a comment.`,
    { callout: 'note', title: 'SQLite is flexibly typed', text: py`Unlike PostgreSQL, SQLite lets you store a value of a different type in a column (a column's type is an *affinity*, a preference). A \`TEXT\` value like \`'1965'\` put into an \`INTEGER\` column is converted to the integer 1965 when it looks like a number. SQLite 3.37+ supports \`CREATE TABLE ... STRICT\` tables that reject wrong types. Convert values in Python before inserting so your code works the same on any database.` },
    py`#### Reading: SELECT, WHERE, ORDER BY, LIMIT`,
    { code: py`SELECT title, year                 -- which columns (* means all)
FROM books                         -- which table
WHERE year > 1950 AND copies >= 2  -- which rows (=, <>, <, >=, AND, OR, NOT, IN, LIKE, BETWEEN)
ORDER BY year DESC, title          -- sort: DESC = biggest first, then by title A→Z
LIMIT 5;                           -- at most 5 rows`, lang: 'sql', title: 'SELECT' },
    py`Missing values are \`NULL\`, and \`NULL\` is never *equal* to anything — not even another \`NULL\`. Test for it with \`IS NULL\` / \`IS NOT NULL\`, never \`= NULL\`.`,
    py`#### Combining tables: JOIN`,
    { code: py`-- INNER JOIN: only books that have a matching author
SELECT books.title, authors.name
FROM books
JOIN authors ON authors.id = books.author_id;

-- LEFT JOIN: every author, even those with no books (book columns become NULL)
SELECT authors.name, books.title
FROM authors
LEFT JOIN books ON books.author_id = authors.id;`, lang: 'sql', title: 'JOIN' },
    py`#### Summarising: GROUP BY and aggregates`,
    { code: py`SELECT authors.name,
       COUNT(books.id)  AS book_count,    -- COUNT(col) ignores NULLs; COUNT(*) counts rows
       SUM(books.copies) AS copies,
       MIN(books.year)   AS first_year
FROM authors
LEFT JOIN books ON books.author_id = authors.id
GROUP BY authors.id
HAVING COUNT(books.id) >= 2            -- HAVING filters groups; WHERE filters rows
ORDER BY book_count DESC;`, lang: 'sql', title: 'GROUP BY' },
    py`An **aggregate function** (\`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`) squashes many rows into one value. \`GROUP BY\` makes one output row *per group*. \`WHERE\` runs **before** grouping (on rows), \`HAVING\` runs **after** (on groups).`,
    py`#### Changing data: INSERT, UPDATE, DELETE`,
    { code: py`INSERT INTO books (title, year, author_id) VALUES ('Dune', 1965, 4);
UPDATE books SET copies = copies + 2 WHERE title = 'Dune';
DELETE FROM books WHERE copies = 0;`, lang: 'sql', title: 'write statements' },
    { callout: 'warn', title: 'UPDATE and DELETE without WHERE hit every row', text: py`\`DELETE FROM books\` with no \`WHERE\` empties the whole table. Write the \`WHERE\` first, run it as a \`SELECT\` to see which rows match, and do it inside a transaction so you can roll back.` },
    py`#### Driving SQLite from Python`,
    { code: py`import sqlite3

conn = sqlite3.connect(":memory:")       # or "library.db" for a file on disk
conn.row_factory = sqlite3.Row           # optional: rows indexable by column name

conn.execute("CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, year INTEGER)")

with conn:                               # transaction: commit on success, rollback on error
    cur = conn.execute("INSERT INTO books (title, year) VALUES (?, ?)", ("Dune", 1965))
    print(cur.lastrowid)                 # 1 — the new row's id
    conn.executemany(
        "INSERT INTO books (title, year) VALUES (:title, :year)",
        [{"title": "Foundation", "year": 1951}, {"title": "Emma", "year": 1815}],
    )

cur = conn.execute("SELECT title, year FROM books WHERE year > ? ORDER BY year", (1900,))
print(cur.fetchone()["title"])           # Foundation
print([tuple(r) for r in cur.fetchall()])   # [('Dune', 1965)] — the rest of the rows

for row in conn.execute("SELECT * FROM books"):   # iterating a cursor is lazy
    print(dict(row))

conn.close()                             # with conn: does NOT close it`, lang: 'python', title: 'the sqlite3 essentials' },
    py`#### Placeholders: the only safe way to put values into SQL`,
    py`- **\`?\` (qmark style)**: values come from a **tuple or list**, in order: \`execute("... WHERE id = ?", (book_id,))\` — note the comma: \`(book_id,)\` is a one-item tuple, \`(book_id)\` is just \`book_id\`.
- **\`:name\` (named style)**: values come from a **dict**: \`execute("... WHERE id = :id", {"id": book_id})\`.
- Placeholders stand for **values only**. Table names, column names and keywords like \`ASC\`/\`DESC\` can't be parameterised — choose them from a fixed allow-list in your code, never from user input.
- **Never** build SQL with f-strings, \`+\` or \`%\` formatting. See *Common mistakes* below and [injection attacks](lesson:injection-attacks).`,
    { callout: 'version', title: 'Version notes', text: py`Since **Python 3.14**, using named placeholders (\`:id\`) with a tuple instead of a dict raises \`ProgrammingError\` (it was deprecated in 3.12). **Python 3.12** added the \`autocommit\` parameter for PEP 249-style transaction control; the default is still the classic behaviour this lesson describes (\`conn.autocommit == sqlite3.LEGACY_TRANSACTION_CONTROL\`).` },
  ],
  walkthrough: {
    title: 'Reading the library program',
    lang: 'python',
    code: LIBRARY,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 16], text: py`The **schema**: two tables. \`authors.id\` and \`books.id\` are \`INTEGER PRIMARY KEY\` columns, so SQLite assigns them automatically. \`books.author_id\` is a **foreign key** — it stores an author's id instead of repeating their name on every book.` },
      { lines: [21, 23], text: py`\`":memory:"\` creates a database that lives only as long as the connection. \`row_factory = sqlite3.Row\` makes every row indexable by column name. \`executescript\` runs the two \`CREATE TABLE\` statements (it takes no parameters, so only use it for fixed SQL you wrote).` },
      { lines: [24, 29], text: py`The CSV gives us strings, so \`int(...)\` converts the numeric columns **before** they reach the database. Each book becomes a dict — ready for **named placeholders**.` },
      { lines: [30, 34], text: py`\`with conn:\` opens one **transaction** around both inserts. \`executemany\` runs the statement once per item. \`INSERT OR IGNORE\` skips authors that already exist, because \`name\` is \`UNIQUE\` and H. G. Wells appears twice in the CSV.` },
      { lines: [35, 40], text: py`The book insert uses \`:title\`, \`:year\`… placeholders filled from each dict. A **subquery** \`(SELECT id FROM authors WHERE name = :author)\` looks up the author's id while inserting. If any insert failed, the \`with\` block would roll back both tables.` },
      { lines: [46, 49], text: py`A parameterised \`SELECT\`: \`?\` is filled from the tuple \`(1950,)\`. Looping over the cursor yields one \`Row\` at a time; \`row['year']\` reads a column by name.` },
      { lines: [52, 62], text: py`\`JOIN\` lines each book up with its author; \`GROUP BY\` makes one output row per author; \`COUNT(*)\` and \`SUM(...)\` aggregate each group. \`AS\` names the result columns so Python can read \`row['book_count']\`.` },
      { lines: [65, 69], text: py`An \`UPDATE\` inside its own transaction. \`copies = copies + ?\` computes from the current value inside the database — no read-modify-write in Python. \`cur.rowcount\` reports how many rows changed.` },
      { lines: [70, 74], text: py`\`fetchone()\` returns the single matching row (or \`None\`); \`dict(row)\` turns a \`Row\` into a regular dict. Finally \`conn.close()\` releases the database.` },
    ],
  },
  playground: {
    title: 'A tiny library database',
    objective: 'Load a CSV into two related tables, then query, join, group and update them — always with placeholders.',
    files: { 'main.py': LIBRARY, 'books.csv': BOOKS_CSV },
    expected: py`Three sections:

\`\`\`text
== Books after 1950, newest first ==
1969  The Left Hand of Darkness
1968  A Wizard of Earthsea
1965  Dune
1955  The End of Eternity
1951  Foundation

== Books per author ==
H. G. Wells        books: 2  copies: 3
Isaac Asimov       books: 2  copies: 4
Ursula K. Le Guin  books: 2  copies: 3
Frank Herbert      books: 1  copies: 4
Mary Shelley       books: 1  copies: 2

== Buy two more copies of Dune ==
rows updated: 1
{'title': 'Dune', 'copies': 6}
\`\`\`

Open **books.csv** to see the raw data the tables were built from.`,
    experiments: [
      {
        id: 'older-books',
        task: py`Change the first query so it lists books published **before 1900**, **oldest first** (and fix the heading). Change the value in the tuple, not the SQL text, for the year.`,
        hint: py`You need \`<\` instead of \`>\`, \`ORDER BY year\` (ascending is the default), and the tuple \`(1900,)\`.`,
        tests: [
          { name: 'Frankenstein (1818) is listed', code: py`assert "1818  Frankenstein" in output, 'Expected a line "1818  Frankenstein"'` },
          { name: 'oldest first', code: py`assert "1895  The Time Machine" in output and output.index("1818  Frankenstein") < output.index("1895  The Time Machine")` },
          { name: 'no modern books in the first section', code: py`assert "1965  Dune" not in output` },
        ],
        explain: py`\`WHERE year < ?\` with \`(1900,)\` keeps three books, and \`ORDER BY year\` sorts ascending. Notice you changed the *value* without touching the query's structure — exactly what placeholders are for.`,
      },
      {
        id: 'new-author',
        task: py`Add a book by a **new author** as a new line at the end of **books.csv**, for example \`Kindred,Octavia E. Butler,1979,2\`. Run it and find the new author in the report.`,
        hint: py`Columns are \`title,author,year,copies\`. A title containing a comma would need double quotes around it.`,
        tests: [
          { name: 'the database now has more than 5 authors', code: py`db = build_library()
assert db.execute("SELECT COUNT(*) FROM authors").fetchone()[0] > 5, 'Add a line with a new author to books.csv'` },
          { name: 'the database now has more than 8 books', code: py`db = build_library()
assert db.execute("SELECT COUNT(*) FROM books").fetchone()[0] > 8` },
        ],
        explain: py`\`INSERT OR IGNORE\` added the new author (it wasn't a duplicate), and the subquery found that author's new id while inserting the book. The \`GROUP BY\` report picks the new author up automatically — no Python code changed.`,
      },
      {
        id: 'first-year',
        task: py`Add \`MIN(books.year) AS first_year\` to the report query and print it at the end of each line, so Asimov's line ends with \`first published 1951\`.`,
        hint: py`Add a comma after \`SUM(books.copies) AS copies\`, then the new column. In the f-string add \`  first published {row['first_year']}\`.`,
        tests: [
          { name: 'Asimov first published 1951', code: py`assert "first published 1951" in output` },
          { name: 'Shelley first published 1818', code: py`assert "first published 1818" in output` },
        ],
        explain: py`\`MIN\` is another aggregate: within each author's group it keeps the smallest year. You can mix as many aggregates as you like in one \`GROUP BY\` query.`,
      },
      {
        id: 'find-by-title',
        task: py`Write a function \`find_by_title(conn, title)\` that returns a **list of dicts** (\`dict(row)\`) for the books whose title equals \`title\`, using a \`?\` placeholder. A sneaky title such as \`"x' OR '1'='1"\` must return \`[]\`.`,
        hint: py`\`return [dict(r) for r in conn.execute("SELECT * FROM books WHERE title = ?", (title,))]\` — define it above \`conn = build_library()\`.`,
        tests: [
          { name: 'finds Dune', code: py`rows = find_by_title(build_library(), "Dune")
assert len(rows) == 1 and rows[0]["year"] == 1965` },
          { name: 'injection attempt returns no rows', code: py`assert find_by_title(build_library(), "x' OR '1'='1") == []` },
        ],
        explain: py`With a placeholder, \`x' OR '1'='1\` is just a strange title that no book has. Had you written \`f"... WHERE title = '{title}'"\`, the quote would have closed the string and \`OR '1'='1'\` would have matched **every** row.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch a cursor hand out rows',
    props: {
      code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE scores (player TEXT, points INTEGER)")
rows = [("Ada", 30), ("Ben", 12), ("Cy", 25)]
conn.executemany("INSERT INTO scores VALUES (?, ?)", rows)

cur = conn.execute(
    "SELECT player, points FROM scores WHERE points > ? ORDER BY points DESC",
    (20,),
)
best = cur.fetchone()
rest = cur.fetchall()
empty = cur.fetchall()
print(best, rest, empty)
conn.close()
`,
      notes: {
        3: '`":memory:"` creates a brand-new database that lives only inside this connection.',
        6: '`executemany` runs the INSERT once per tuple. The `?` slots are filled from each tuple in order.',
        8: 'The query runs, but rows are not all copied into Python yet: the **cursor** is a position in the result.',
        12: '`fetchone()` takes the next row — a tuple — and moves the cursor forward.',
        13: '`fetchall()` takes **all remaining** rows as a list. Ben (12 points) never matched the WHERE.',
        14: 'The cursor is used up: another `fetchall()` returns an empty list. Run the query again if you need the rows twice.',
      },
    },
    alt: 'A step-by-step trace of a program that creates an in-memory scores table, inserts three players, then queries players with more than 20 points. fetchone returns the tuple Ada 30, fetchall returns a list containing Cy 25, and a second fetchall returns an empty list because the cursor has been used up.',
    caption: py`A cursor is like a bookmark in the result: every fetch moves it forward.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`SQLite is not a separate program you connect to over a network — it's a **library** that runs *inside* your Python process and reads and writes one ordinary file. \`sqlite3.connect("library.db")\` creates that file if it doesn't exist. \`":memory:"\` keeps everything in RAM and it vanishes when the connection closes, which makes it perfect for tests and experiments.`,
      py`Python values map onto SQLite types automatically:`,
      py`| Python | SQLite |
|---|---|
| \`None\` | \`NULL\` |
| \`int\` | \`INTEGER\` |
| \`float\` | \`REAL\` |
| \`str\` | \`TEXT\` |
| \`bytes\` | \`BLOB\` |`,
      py`Anything else (dates, \`Decimal\`, lists) must be converted first — for example \`date.isoformat()\` to store a date as text like \`'2026-10-24'\`, or [JSON](lesson:json-data) for a small nested structure.`,
    ],
    technical: [
      py`\`sqlite3\` follows **PEP 249**, the *DB-API 2.0* standard that most Python database drivers implement: \`connect()\` → \`Connection\` → \`cursor()\` → \`execute()\` → \`fetch*()\`, plus \`commit()\`/\`rollback()\`. \`conn.execute(...)\` is a non-standard shortcut that creates the cursor for you. Learn this shape once and drivers like \`psycopg\` (PostgreSQL) feel familiar — though their placeholder style may differ (\`%s\` instead of \`?\`).`,
      py`**How placeholders work.** SQLite compiles your SQL text into a *prepared statement* — a small program for its virtual machine — and only then **binds** values into its parameter slots. The values are never parsed as SQL, so quotes, semicolons and \`--\` inside them are harmless. As a bonus, the module keeps a cache of recently prepared statements (\`cached_statements\`, 128 by default), so running the same parameterised SQL with different values skips re-parsing.`,
      py`**How transactions work (default mode).** With the default \`isolation_level\`, \`sqlite3\` silently issues \`BEGIN\` before the first \`INSERT\`, \`UPDATE\`, \`DELETE\` or \`REPLACE\`. Your changes are then *pending* — visible on this connection, invisible to others and not yet durable — until \`commit()\`. \`conn.in_transaction\` tells you whether one is open. Closing a connection with an open transaction **discards** the pending changes. \`with conn:\` calls \`commit()\` when the block ends normally and \`rollback()\` when it raises — then lets the exception continue.`,
      py`**Rows and ids.** Every ordinary SQLite table has a hidden 64-bit integer key called the \`rowid\`, and rows are stored in a B-tree ordered by it. A column declared exactly \`INTEGER PRIMARY KEY\` becomes an *alias* for the rowid, which is why SQLite fills it in automatically and \`cursor.lastrowid\` returns it after an insert.`,
      py`**Foreign keys are off by default** in SQLite for backwards compatibility: \`REFERENCES authors(id)\` documents the relationship but is not enforced until you run \`PRAGMA foreign_keys = ON\` on **each** new connection.`,
    ],
    production: [
      py`**Choosing SQLite.** It's an excellent fit for desktop and mobile apps, command-line tools, tests, caches, data analysis and many small-to-medium websites with mostly reads. Because the whole database is one file with one writer at a time, apps with many simultaneous writers or several servers sharing one database usually pick a client-server database such as PostgreSQL. The SQL and the DB-API shape carry over.`,
      py`**Settings worth knowing.** \`PRAGMA foreign_keys = ON\` per connection; \`PRAGMA journal_mode = WAL\` (write-ahead logging) lets readers keep reading while one writer writes; \`sqlite3.connect(path, timeout=5.0)\` controls how long to wait for a lock before raising \`database is locked\` (5 seconds is the default).`,
      py`**Security.** Every value from a user, file, URL or API goes in through a placeholder — no exceptions. Identifiers (table/column names, sort direction) come from an allow-list. Constraints (\`NOT NULL\`, \`UNIQUE\`, \`CHECK\`) are your last line of defence against bad data even if validation code has a bug — see [input validation](lesson:input-validation) and [injection attacks](lesson:injection-attacks).`,
      py`**Structure.** Keep SQL out of your business logic: put it behind small functions or a *repository* class, run multi-step changes in one transaction, and manage schema changes with *migrations*. All of that is the subject of [transactions, repositories, ORMs & migrations](lesson:database-patterns).`,
    ],
  },
  mistakes: [
    {
      title: 'Building SQL with an f-string (SQL injection)',
      wrong: { code: py`def find_user(conn, name):
    # name = "x' OR '1'='1"  →  returns EVERY user
    return conn.execute(f"SELECT * FROM users WHERE name = '{name}'").fetchall()`, lang: 'python' },
      right: { code: py`def find_user(conn, name):
    return conn.execute("SELECT * FROM users WHERE name = ?", (name,)).fetchall()`, lang: 'python' },
      explanation: py`With the f-string, the user's text becomes part of the SQL *code*: the quote in \`x' OR '1'='1\` closes the string and the rest changes the query's meaning. Attackers use this to read, change or delete data. With \`?\`, the value is bound after the query is parsed and can only ever be data. Details in [injection attacks](lesson:injection-attacks).`,
    },
    {
      title: 'Forgetting to commit',
      wrong: { code: py`import sqlite3

conn = sqlite3.connect("shop.db")
conn.execute("CREATE TABLE IF NOT EXISTS orders (item TEXT)")
conn.execute("INSERT INTO orders VALUES (?)", ("socks",))
conn.close()   # the pending INSERT is thrown away`, lang: 'python' },
      right: { code: py`import sqlite3

conn = sqlite3.connect("shop.db")
conn.execute("CREATE TABLE IF NOT EXISTS orders (item TEXT)")
with conn:     # commits when the block ends without an error
    conn.execute("INSERT INTO orders VALUES (?)", ("socks",))
conn.close()`, lang: 'python' },
      explanation: py`The \`INSERT\` opened a transaction implicitly. Without \`commit()\` (or \`with conn:\`), closing the connection rolls it back. The code "works" while it runs — your own connection can see the row — which makes this bug confusing.`,
    },
    {
      title: 'Passing a bare value instead of a tuple',
      wrong: { code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE users (name TEXT)")
conn.execute("SELECT * FROM users WHERE name = ?", "Ada")
# ProgrammingError: ... uses 1, and there are 3 supplied.`, lang: 'python', static: true },
      right: { code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE users (name TEXT)")
conn.execute("SELECT * FROM users WHERE name = ?", ("Ada",))   # note the comma`, lang: 'python' },
      explanation: py`Parameters must be a sequence (or a dict for named placeholders). A string *is* a sequence — of characters — so \`"Ada"\` looks like three values. \`("Ada")\` is the same mistake: brackets alone don't make a tuple, the comma does.`,
    },
    {
      title: 'Thinking `with conn:` closes the connection',
      wrong: { code: py`import sqlite3

with sqlite3.connect("app.db") as conn:
    conn.execute("CREATE TABLE IF NOT EXISTS log (msg TEXT)")
# conn is still open here — the with only managed the transaction`, lang: 'python' },
      right: { code: py`import sqlite3
from contextlib import closing

with closing(sqlite3.connect("app.db")) as conn:   # closes at the end
    with conn:                                      # commits / rolls back
        conn.execute("CREATE TABLE IF NOT EXISTS log (msg TEXT)")`, lang: 'python' },
      explanation: py`A \`sqlite3.Connection\` used as a context manager means *"one transaction"*, not *"open then close"*. Use \`contextlib.closing\` (see [contextlib](lesson:contextlib)) or call \`conn.close()\` yourself.`,
    },
    {
      title: 'Comparing with NULL using =',
      wrong: { code: py`SELECT title FROM books WHERE author_id = NULL;   -- always returns nothing`, lang: 'sql' },
      right: { code: py`SELECT title FROM books WHERE author_id IS NULL;`, lang: 'sql' },
      explanation: py`In SQL, \`NULL\` means "unknown", and any comparison with an unknown is itself unknown — so \`= NULL\` is never true. Use \`IS NULL\` / \`IS NOT NULL\`. From Python, \`None\` binds as \`NULL\`, so \`WHERE x = ?\` with \`(None,)\` matches nothing either.`,
    },
    {
      title: 'Looping in Python instead of asking the database',
      wrong: { code: py`total = 0
for row in conn.execute("SELECT * FROM orders"):
    if row["customer_id"] == customer_id:
        total += row["total_pence"]`, lang: 'python', static: true },
      right: { code: py`total = conn.execute(
    "SELECT COALESCE(SUM(total_pence), 0) FROM orders WHERE customer_id = ?",
    (customer_id,),
).fetchone()[0]`, lang: 'python', static: true },
      explanation: py`Filtering and adding up in Python drags every row out of the database. Let SQL do the work with \`WHERE\` and an aggregate: it can use indexes and returns one number. \`COALESCE(x, 0)\` turns the \`NULL\` that \`SUM\` gives for "no rows" into 0.`,
    },
  ],
  debugging: [
    {
      symptom: py`sqlite3.OperationalError: no such table: books`,
      cause: py`The table was never created on *this* database — often a typo, a different file path (a new empty file was created next to the script), or a fresh \`:memory:\` connection.`,
      fix: py`Check the path you passed to \`connect()\` (print \`Path(path).resolve()\`), run your schema with \`CREATE TABLE IF NOT EXISTS\`, and remember every \`:memory:\` connection is a separate empty database.`,
    },
    {
      symptom: py`sqlite3.ProgrammingError: Incorrect number of bindings supplied. The current statement uses 1, and there are 3 supplied.`,
      cause: py`The parameters don't match the placeholders — usually a string passed instead of a one-item tuple (\`"Ada"\` instead of \`("Ada",)\`), or a missing value.`,
      fix: py`Pass a tuple with exactly one value per \`?\`: \`(name,)\`. Count the placeholders and the values.`,
    },
    {
      symptom: py`sqlite3.IntegrityError: UNIQUE constraint failed: authors.name`,
      cause: py`You inserted a row whose value already exists in a \`UNIQUE\` (or primary key) column. The constraint did its job.`,
      fix: py`Decide what should happen: skip duplicates (\`INSERT OR IGNORE\`), update the existing row (\`INSERT ... ON CONFLICT(name) DO UPDATE SET ...\`, SQLite 3.24+), or catch \`sqlite3.IntegrityError\` and report a friendly error.`,
    },
    {
      symptom: py`sqlite3.OperationalError: near "SELEC": syntax error`,
      cause: py`The SQL text itself is invalid — a typo, a missing comma between columns, or a trailing comma before \`FROM\`.`,
      fix: py`SQLite quotes the token where parsing failed; the mistake is at or just before it. Test the query on its own in a small script or the \`sqlite3\` command-line shell.`,
    },
    {
      symptom: py`sqlite3.OperationalError: database is locked`,
      cause: py`Another connection (or another program) holds a write transaction on the same file and didn't finish within the \`timeout\`. Often a connection somewhere never committed.`,
      fix: py`Keep transactions short and always commit or roll back (\`with conn:\`). Close connections you're done with. Consider \`PRAGMA journal_mode = WAL\` so readers don't block the writer.`,
    },
    {
      symptom: py`sqlite3.ProgrammingError: Cannot operate on a closed database.`,
      cause: py`You used a connection (or a cursor from it) after \`conn.close()\` — for example returning a cursor from a function that closes the connection.`,
      fix: py`Fetch the rows you need (\`fetchall()\`) **before** closing, or keep the connection open for the lifetime of the work.`,
    },
  ],
  bestPractices: [
    'Put every value into SQL with ? or :name placeholders — never f-strings, + or % formatting.',
    'Choose table names, column names and sort directions from a fixed allow-list; placeholders only work for values.',
    'Wrap related writes in one transaction with `with conn:` so they all succeed or all roll back.',
    'Use `conn.row_factory = sqlite3.Row` so code reads row["title"] instead of fragile row[1].',
    'Let the database filter, sort and aggregate (WHERE, ORDER BY, GROUP BY) instead of looping in Python.',
    'Declare constraints (NOT NULL, UNIQUE, CHECK, foreign keys) and turn on PRAGMA foreign_keys = ON per connection.',
    'Convert values to int/float/str/bytes/None in Python before inserting; store dates as ISO-8601 text.',
    'Close connections when you are done; use ":memory:" databases in tests.',
  ],
  useCases: [
    'A desktop or command-line app that needs to save structured data (notes, expenses, game saves).',
    'Importing a CSV once and then answering many questions about it with SQL.',
    'Fast, isolated databases for automated tests (":memory:").',
    'A local cache of results from a slow web API.',
    'Small websites and prototypes before moving to PostgreSQL.',
  ],
  whenToUse: {
    use: [
      'Data with clear structure and relationships (customers → orders → items).',
      'You need to filter, sort, join or summarise records repeatedly.',
      'Several changes must succeed or fail together (transactions).',
      'One application process owns the data, or there are mostly readers.',
    ],
    avoid: [
      'A handful of settings — a JSON or TOML file is simpler.',
      'Many servers writing to one database at the same time — use a client-server database such as PostgreSQL.',
      'Huge analytical workloads over billions of rows — columnar tools are designed for that.',
    ],
  },
  comparison: {
    title: 'Where to keep your data',
    headers: ['', 'CSV / JSON file', 'SQLite', 'PostgreSQL (client-server)'],
    rows: [
      ['setup', 'none', 'none — built into Python', 'install and run a server'],
      ['querying', 'load everything, loop in Python', 'SQL, indexes', 'SQL, indexes, many extras'],
      ['partial updates', 'rewrite the whole file', 'UPDATE one row', 'UPDATE one row'],
      ['crash safety', 'easy to corrupt mid-write', 'transactions', 'transactions'],
      ['many concurrent writers', 'no', 'one writer at a time', 'yes'],
      ['best for', 'exchange, config, small data', 'apps, tools, tests, small sites', 'multi-user services'],
    ],
    note: py`The SQL and the DB-API code you write for SQLite carry over to PostgreSQL with small changes (mainly the placeholder style and some data types).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'sql-and-sqlite-q1',
      type: 'mcq',
      prompt: 'What is a **primary key**?',
      options: [
        { text: 'The first column of every table', why: 'Position doesn’t matter. A primary key is defined by a constraint, not by being first.' },
        'A column (or columns) whose value uniquely identifies each row',
        { text: 'A password that unlocks the database', why: 'Keys in databases are about identifying rows, not security.' },
        { text: 'A column that points to a row in another table', why: 'That is a foreign key. A foreign key usually stores another table’s primary key.' },
      ],
      answer: 1,
      explanation: py`A primary key is unique and not null for every row, so \`WHERE id = 7\` always means exactly one row. Other tables refer to it through **foreign keys**.`,
    },
    {
      id: 'sql-and-sqlite-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE pets (name TEXT, kind TEXT)")
conn.executemany("INSERT INTO pets VALUES (?, ?)",
                 [("Rex", "dog"), ("Tom", "cat"), ("Fido", "dog")])
row = conn.execute("SELECT COUNT(*) FROM pets WHERE kind = ?", ("dog",)).fetchone()
print(row)`,
      options: [
        { text: '2', why: 'fetchone() returns a whole row, and rows are tuples — even when there is only one column.' },
        '(2,)',
        { text: '[(2,)]', why: 'That is what fetchall() would return: a list of rows.' },
        { text: "('Rex', 'Fido')", why: 'COUNT(*) is an aggregate: it returns one number, not the matching names.' },
      ],
      answer: 1,
      explanation: py`\`fetchone()\` returns one row as a tuple: \`(2,)\`. Write \`.fetchone()[0]\` to get the bare number.`,
    },
    {
      id: 'sql-and-sqlite-q3',
      type: 'bug',
      prompt: 'This login check can be bypassed by typing `\' OR \'1\'=\'1` as the username. Click the line with the security bug.',
      code: py`def check_login(conn, username, password_hash):
    query = f"SELECT id FROM users WHERE username = '{username}'"
    row = conn.execute(query).fetchone()
    if row is None:
        return False
    stored = conn.execute("SELECT password_hash FROM users WHERE id = ?", (row[0],))
    return stored.fetchone()[0] == password_hash`,
      answerLine: 2,
      explanation: py`Line 2 pastes user input into the SQL text, so the quote ends the string and \`OR '1'='1'\` makes the \`WHERE\` true for every row. Use \`conn.execute("SELECT id FROM users WHERE username = ?", (username,))\`. (Line 6 is fine — it uses a placeholder.) Real systems also compare password hashes with a constant-time check; see [secrets & passwords](lesson:secrets-and-passwords).`,
    },
    {
      id: 'sql-and-sqlite-q4',
      type: 'fill',
      prompt: 'Complete the code so it safely fetches **all** books by one author as a list.',
      code: py`rows = conn.execute(
    "SELECT title FROM books WHERE author_id = ___",
    (author_id,),
).___()`,
      answer: [['?'], ['fetchall']],
      explanation: py`\`?\` is the qmark placeholder, filled from the tuple \`(author_id,)\`. \`fetchall()\` returns every remaining row as a list (\`fetchone()\` would return only the first).`,
    },
    {
      id: 'sql-and-sqlite-q5',
      type: 'output',
      prompt: 'Predict the printed balance.',
      code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE accounts (name TEXT, balance INTEGER)")
with conn:
    conn.execute("INSERT INTO accounts VALUES ('Ada', 100)")
try:
    with conn:
        conn.execute("UPDATE accounts SET balance = balance - 30")
        raise RuntimeError("power cut!")
except RuntimeError:
    pass
print(conn.execute("SELECT balance FROM accounts").fetchone()[0])`,
      answer: '100',
      accept: ['100'],
      explanation: py`The first \`with conn:\` committed the insert. In the second, the exception made \`with conn:\` call \`rollback()\`, undoing the \`UPDATE\`, before the exception reached \`except\`. The balance is still 100.`,
    },
    {
      id: 'sql-and-sqlite-q6',
      type: 'mcq',
      prompt: 'You want each customer with their number of orders, **including customers with no orders** (shown as 0). Which query is right?',
      options: [
        { text: 'SELECT c.name, COUNT(*) FROM customers c JOIN orders o ON o.customer_id = c.id GROUP BY c.id', why: 'An inner JOIN drops customers with no orders entirely.' },
        { text: 'SELECT c.name, COUNT(*) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id', why: 'Close! But COUNT(*) counts rows, and a customer with no orders still produces one row (with NULL order columns), so they show 1, not 0.' },
        'SELECT c.name, COUNT(o.id) FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id',
        { text: 'SELECT c.name, COUNT(o.id) FROM customers c WHERE o.customer_id = c.id GROUP BY c.id', why: 'orders isn’t in the FROM clause at all, so o.customer_id doesn’t exist: this is an error.' },
      ],
      answer: 2,
      explanation: py`\`LEFT JOIN\` keeps every customer; for customers with no orders the order columns are \`NULL\`. \`COUNT(o.id)\` counts only non-\`NULL\` values, giving 0 for them.`,
    },
    {
      id: 'sql-and-sqlite-q7',
      type: 'short',
      prompt: 'Explain in your own words why a `?` placeholder prevents SQL injection, and why you still can’t use one for a column name.',
      answer: py`The SQL text is parsed into a prepared statement first, with \`?\` as an empty slot; the value is bound into the slot afterwards and is only ever treated as data, so quotes or SQL keywords inside it can't change the query. But placeholders can only stand for *values* — the column and table names are part of the query's structure, which must be known when it is parsed. So identifiers must be chosen from an allow-list in your code.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'gradebook',
      title: 'Gradebook',
      difficulty: 'intermediate',
      prompt: py`\`make_db()\` creates a \`students\` table for you. Implement two functions:

1. \`add_student(conn, name, grade)\` inserts one student **with placeholders**, inside \`with conn:\` (so it's committed), and **returns the new row's id** (\`cursor.lastrowid\`, an \`int\`). Names like \`O'Brien\` must be stored exactly.
2. \`top_students(conn, n)\` returns a **list of names** (plain strings) of the \`n\` best students: highest \`grade\` first, ties broken by \`name\` A→Z. Pass \`n\` as a parameter to \`LIMIT ?\`.

With the sample data the program prints \`['Ada', 'Ben', 'Zoe']\`.`,
      files: {
        'main.py': py`import sqlite3


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.execute("""
        CREATE TABLE students (
            id    INTEGER PRIMARY KEY,
            name  TEXT NOT NULL,
            grade INTEGER NOT NULL CHECK (grade BETWEEN 0 AND 100)
        )
    """)
    return conn


def add_student(conn, name, grade):
    """Insert one student and return the new id."""
    # TODO: parameterised INSERT inside "with conn:", return cursor.lastrowid
    return None


def top_students(conn, n):
    """Names of the n best students, best first, ties by name."""
    # TODO: SELECT ... ORDER BY ... LIMIT ?
    return []


conn = make_db()
for name, grade in [("Zoe", 91), ("Ada", 97), ("Ben", 91), ("Cy", 78)]:
    add_student(conn, name, grade)
print(top_students(conn, 3))
`,
      },
      hints: [
        'conn.execute(sql, params) returns a cursor; the cursor has a lastrowid attribute after an INSERT.',
        'Sort by two columns: ORDER BY grade DESC, name. Then LIMIT ? with (n,) as the parameters. Each row is a tuple, so take row[0].',
        'with conn:\n    cur = conn.execute("INSERT INTO students (name, grade) VALUES (?, ?)", (name, grade))\nreturn cur.lastrowid\n...\nrows = conn.execute("SELECT name FROM students ORDER BY grade DESC, name LIMIT ?", (n,))\nreturn [r[0] for r in rows]',
      ],
      solution: {
        explanation: py`\`add_student\` binds \`name\` and \`grade\` through placeholders, so an apostrophe in \`O'Brien\` is just a character, and \`with conn:\` commits the implicit transaction the \`INSERT\` opened. \`lastrowid\` is the value SQLite assigned to the \`INTEGER PRIMARY KEY\`. \`top_students\` lets the database sort by grade (descending) and then by name, and \`LIMIT ?\` — yes, \`LIMIT\` accepts a placeholder because it's a value — returns only \`n\` rows. A list comprehension unwraps each one-column tuple into a plain string.`,
        files: {
          'main.py': py`import sqlite3


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.execute("""
        CREATE TABLE students (
            id    INTEGER PRIMARY KEY,
            name  TEXT NOT NULL,
            grade INTEGER NOT NULL CHECK (grade BETWEEN 0 AND 100)
        )
    """)
    return conn


def add_student(conn, name, grade):
    """Insert one student and return the new id."""
    with conn:
        cur = conn.execute(
            "INSERT INTO students (name, grade) VALUES (?, ?)", (name, grade)
        )
    return cur.lastrowid


def top_students(conn, n):
    """Names of the n best students, best first, ties by name."""
    rows = conn.execute(
        "SELECT name FROM students ORDER BY grade DESC, name LIMIT ?", (n,)
    )
    return [row[0] for row in rows]


conn = make_db()
for name, grade in [("Zoe", 91), ("Ada", 97), ("Ben", 91), ("Cy", 78)]:
    add_student(conn, name, grade)
print(top_students(conn, 3))
`,
        },
      },
      tests: [
        { name: 'add_student returns increasing integer ids', code: py`db = make_db()
first = add_student(db, "Ada", 90)
second = add_student(db, "Ben", 80)
assert isinstance(first, int), 'Return cursor.lastrowid'
assert second == first + 1` },
        { name: 'the insert is committed', code: py`db = make_db()
add_student(db, "Ada", 90)
assert not db.in_transaction, 'Wrap the INSERT in "with conn:" so it is committed'
assert db.execute("SELECT COUNT(*) FROM students").fetchone()[0] == 1` },
        { name: "stores O'Brien exactly (placeholders)", code: py`db = make_db()
add_student(db, "O'Brien", 88)
assert db.execute("SELECT name FROM students").fetchone()[0] == "O'Brien"` },
        { name: 'top 3 with ties broken by name', code: py`assert top_students(conn, 3) == ["Ada", "Ben", "Zoe"]` },
        { name: 'top 1 uses the limit', code: py`assert top_students(conn, 1) == ["Ada"]` },
      ],
    },
    {
      id: 'spending-report',
      title: 'Who spends the most?',
      difficulty: 'intermediate',
      prompt: py`A shop has \`customers\` and \`orders\` tables (see \`make_shop()\`; prices are whole pence). Implement:

1. \`spending_report(conn)\` → a **list of tuples** \`(name, order_count, total_pence)\` for **every** customer — including customers with no orders, who get \`(name, 0, 0)\`. Sort by \`total_pence\` descending, ties by \`name\`.
2. \`big_spenders(conn, min_pence)\` → a **list of names** of customers whose total is **at least** \`min_pence\`, sorted by name. Use \`GROUP BY\` + \`HAVING\` with a placeholder.

With the sample data, \`spending_report\` returns \`[('Ben', 1, 4300), ('Ada', 2, 2050), ('Dee', 2, 1000), ('Cy', 0, 0)]\`.`,
      files: {
        'main.py': py`import sqlite3


def make_shop():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE orders (
            id          INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            total_pence INTEGER NOT NULL
        );
        INSERT INTO customers (name) VALUES ('Ada'), ('Ben'), ('Cy'), ('Dee');
        INSERT INTO orders (customer_id, total_pence) VALUES
            (1, 1250), (1, 800), (2, 4300), (4, 999), (4, 1);
    """)
    return conn


def spending_report(conn):
    # TODO: LEFT JOIN + GROUP BY; customers with no orders get 0 and 0
    return []


def big_spenders(conn, min_pence):
    # TODO: GROUP BY + HAVING SUM(...) >= ?
    return []


shop = make_shop()
for name, count, total in spending_report(shop):
    print(f"{name:<4} {count} orders  {total / 100:.2f}")
print(big_spenders(shop, 2000))
`,
      },
      hints: [
        'An inner JOIN would drop Cy, who has no orders. LEFT JOIN orders onto customers keeps every customer.',
        'COUNT(*) counts Cy’s single all-NULL row as 1 — count a column from orders instead: COUNT(o.id). SUM over only NULLs is NULL, so wrap it: COALESCE(SUM(o.total_pence), 0).',
        'SELECT c.name, COUNT(o.id), COALESCE(SUM(o.total_pence), 0) AS total FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.id ORDER BY total DESC, c.name — and for big_spenders: ... JOIN ... GROUP BY c.id HAVING SUM(o.total_pence) >= ? ORDER BY c.name',
      ],
      solution: {
        explanation: py`\`LEFT JOIN\` keeps every customer and fills the order columns with \`NULL\` when there's no match. \`COUNT(o.id)\` ignores those \`NULL\`s (giving 0), and \`COALESCE(SUM(...), 0)\` turns the \`NULL\` sum into 0. Grouping by \`c.id\` (not the name) keeps two customers with the same name apart. \`big_spenders\` filters **groups** after aggregation, which is exactly what \`HAVING\` is for — a \`WHERE\` can't see \`SUM(...)\` because it runs before grouping. The threshold arrives through a placeholder like any other value. sqlite3 returns rows as tuples, so \`fetchall()\` already has the requested shape.`,
        files: {
          'main.py': py`import sqlite3


def make_shop():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE orders (
            id          INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            total_pence INTEGER NOT NULL
        );
        INSERT INTO customers (name) VALUES ('Ada'), ('Ben'), ('Cy'), ('Dee');
        INSERT INTO orders (customer_id, total_pence) VALUES
            (1, 1250), (1, 800), (2, 4300), (4, 999), (4, 1);
    """)
    return conn


def spending_report(conn):
    return conn.execute("""
        SELECT c.name,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(o.total_pence), 0) AS total
        FROM customers AS c
        LEFT JOIN orders AS o ON o.customer_id = c.id
        GROUP BY c.id
        ORDER BY total DESC, c.name
    """).fetchall()


def big_spenders(conn, min_pence):
    rows = conn.execute("""
        SELECT c.name
        FROM customers AS c
        JOIN orders AS o ON o.customer_id = c.id
        GROUP BY c.id
        HAVING SUM(o.total_pence) >= ?
        ORDER BY c.name
    """, (min_pence,))
    return [name for (name,) in rows]


shop = make_shop()
for name, count, total in spending_report(shop):
    print(f"{name:<4} {count} orders  {total / 100:.2f}")
print(big_spenders(shop, 2000))
`,
        },
      },
      tests: [
        { name: 'report matches the sample data', code: py`assert spending_report(make_shop()) == [("Ben", 1, 4300), ("Ada", 2, 2050), ("Dee", 2, 1000), ("Cy", 0, 0)]` },
        { name: 'customers without orders get 0 orders and 0 pence', code: py`report = spending_report(make_shop())
assert ("Cy", 0, 0) in report, 'Use LEFT JOIN, COUNT(o.id) and COALESCE(SUM(...), 0)'` },
        { name: 'ties are broken by name', code: py`db = make_shop()
db.execute("INSERT INTO customers (name) VALUES ('Abe')")
db.execute("INSERT INTO orders (customer_id, total_pence) VALUES (5, 1000)")
names = [r[0] for r in spending_report(db)]
assert names.index("Abe") < names.index("Dee")` },
        { name: 'big_spenders uses an inclusive threshold', code: py`db = make_shop()
assert big_spenders(db, 2000) == ["Ada", "Ben"]
assert big_spenders(db, 2050) == ["Ada", "Ben"]
assert big_spenders(db, 4300) == ["Ben"]` },
        { name: 'big_spenders(0) excludes customers with no orders', code: py`assert "Cy" not in big_spenders(make_shop(), 0)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'sql-and-sqlite-relational-basics',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a relational database, and what are primary keys and foreign keys for?',
      answer: 'A relational database stores data in tables of rows and typed columns. A primary key uniquely identifies each row; a foreign key stores another table’s primary key so rows can refer to each other, letting you store each fact once and combine tables with JOIN.',
      explanation: py`Splitting data into related tables (*normalisation*) avoids repeating facts: an author's name lives in one row of \`authors\`, and every book refers to it by \`author_id\`. Change the name once and every book sees it. The database can enforce that a foreign key always points at a real row (in SQLite, after \`PRAGMA foreign_keys = ON\`).`,
      code: { lang: 'sql', code: py`CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES authors(id)
);
SELECT books.title, authors.name
FROM books JOIN authors ON authors.id = books.author_id;` },
      whyAsked: 'Basic data modelling comes up in almost every backend or data role; it shows whether you can design tables, not just use them.',
      mistakes: ['Describing tables as "like Excel" without mentioning keys or constraints', 'Confusing primary and foreign keys', 'Suggesting storing lists of ids in a text column instead of a related table'],
      followUps: ['How would you model a many-to-many relationship such as students and courses?', 'What does normalisation mean, and when would you denormalise?', 'What happens if you delete an author who still has books?'],
      modelAnswer: 'A relational database keeps data in tables: each column has a name and type and each row is one record. A primary key is a column whose value is unique for every row, so it identifies exactly one record. A foreign key is a column that stores another table’s primary key — for example books.author_id pointing at authors.id. That lets me store each fact once instead of repeating it, and then combine tables with a JOIN when I query. The database can also enforce those relationships, so I can’t create a book for an author that doesn’t exist.',
    },
    {
      id: 'sql-and-sqlite-injection',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A code review finds `conn.execute(f"SELECT * FROM products WHERE category = \'{category}\' ORDER BY {sort}")`, where both values come from URL query parameters. What is wrong and how do you fix both parts?',
      answer: 'Both values are SQL injection holes. Bind category with a placeholder (WHERE category = ?) and pass (category,). The sort column can’t be a placeholder, so map the user’s choice through an allow-list of known column names and reject anything else.',
      explanation: py`Placeholders protect **values**. Identifiers and keywords are part of the statement's structure, which is parsed before values are bound, so they need a different defence: never let user text reach the SQL; translate it through a dict of known-good options.`,
      code: { lang: 'python', code: py`SORTS = {"price": "price", "name": "name", "newest": "created_at DESC"}


def list_products(conn, category, sort="name"):
    order_by = SORTS.get(sort)
    if order_by is None:
        raise ValueError(f"unknown sort option: {sort!r}")
    sql = f"SELECT * FROM products WHERE category = ? ORDER BY {order_by}"  # only our own text
    return conn.execute(sql, (category,)).fetchall()` },
      whyAsked: 'SQL injection is still one of the most common serious vulnerabilities; interviewers want to see you know placeholders AND their limits.',
      mistakes: ['Escaping quotes by hand (replace("\'", "\'\'")) instead of using placeholders', 'Trying to use ? for the ORDER BY column', 'Only fixing the obvious value and leaving the identifier injectable'],
      followUps: ['Does an ORM make you immune to SQL injection?', 'Why is escaping by hand worse than parameter binding?', 'What else besides SQL is vulnerable to injection?'],
      modelAnswer: 'Both parts let a user change the SQL itself. For the category, I would use a placeholder — WHERE category = ? — and pass the value separately, so the database parses the query first and binds the value as pure data. The sort column is harder because placeholders only work for values, not identifiers. So I would map the user’s choice through an allow-list dict of known column expressions and raise an error for anything else; that way only text I wrote ever ends up in the query. Escaping quotes by hand isn’t a substitute — it’s easy to get wrong across encodings and databases.',
    },
    {
      id: 'sql-and-sqlite-cursor-exhausted',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE pets (name TEXT)")
conn.executemany("INSERT INTO pets VALUES (?)", [("Tom",), ("Rex",), ("Fido",)])
cur = conn.execute("SELECT name FROM pets ORDER BY name")
first = cur.fetchone()
rest = cur.fetchall()
again = cur.fetchall()
print(first, rest, again)` },
      options: [
        "('Fido',) [('Rex',), ('Tom',)] []",
        "('Fido',) [('Fido',), ('Rex',), ('Tom',)] [('Fido',), ('Rex',), ('Tom',)]",
        "Fido ['Rex', 'Tom'] []",
        "('Tom',) [('Rex',), ('Fido',)] []",
      ],
      correctOption: 0,
      answer: "`('Fido',) [('Rex',), ('Tom',)] []` — a cursor is a one-way position in the result; fetchall returns the remaining rows and then the cursor is exhausted.",
      explanation: py`Rows are tuples even with one column. \`ORDER BY name\` sorts alphabetically. \`fetchone()\` consumes the first row, \`fetchall()\` the rest, and a second \`fetchall()\` finds nothing left. Re-run the query if you need the rows again, or keep the list you fetched.`,
      whyAsked: 'It checks whether you understand cursors as iterators rather than as stored lists — a common source of "my second loop prints nothing" bugs.',
      mistakes: ['Expecting fetchall to always return every row', 'Forgetting that one-column rows are still tuples', 'Ignoring ORDER BY'],
      followUps: ['What does iterating a cursor directly do, and why is it memory-friendly?', 'When would you use fetchmany(n)?'],
      modelAnswer: 'It prints a one-item tuple for Fido, then a list with the Rex and Tom tuples, then an empty list. ORDER BY sorts the names alphabetically, and every row is a tuple even when it has one column. A cursor works like an iterator over the result: fetchone takes the next row, fetchall takes everything that’s left, so the second fetchall gets nothing. If I need the rows twice I keep the list or run the query again.',
    },
    {
      id: 'sql-and-sqlite-search-filters',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `search_books(conn, author=None, max_year=None)` that returns the titles (A→Z) of books matching **only the filters that were given**. Build the WHERE clause dynamically but keep every value in placeholders.',
      answer: 'Collect condition strings and a params list side by side, join the conditions with AND, and pass the params tuple to execute. Only your own fixed SQL fragments go into the string.',
      explanation: py`Dynamic filters are where people are most tempted to reach for f-strings. The safe pattern is two lists that grow together: a fragment like \`"year <= ?"\` and its value. The final SQL only ever contains text you wrote; all user values travel as parameters.`,
      starter: { files: { 'main.py': py`import sqlite3


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE books (title TEXT, author TEXT, year INTEGER);
        INSERT INTO books VALUES
            ('Dune', 'Frank Herbert', 1965),
            ('Foundation', 'Isaac Asimov', 1951),
            ('The End of Eternity', 'Isaac Asimov', 1955),
            ('Frankenstein', 'Mary Shelley', 1818);
    """)
    return conn


def search_books(conn, author=None, max_year=None):
    # TODO: build WHERE from the given filters, values via placeholders
    return []


db = make_db()
print(search_books(db, author="Isaac Asimov", max_year=1952))
` } },
      tests: [
        { name: 'no filters returns every title A→Z', code: py`assert search_books(make_db()) == ["Dune", "Foundation", "Frankenstein", "The End of Eternity"]` },
        { name: 'filter by author', code: py`assert search_books(make_db(), author="Isaac Asimov") == ["Foundation", "The End of Eternity"]` },
        { name: 'filter by max_year (inclusive)', code: py`assert search_books(make_db(), max_year=1955) == ["Foundation", "Frankenstein", "The End of Eternity"]` },
        { name: 'both filters', code: py`assert search_books(make_db(), author="Isaac Asimov", max_year=1952) == ["Foundation"]` },
        { name: 'injection attempt matches nothing', code: py`assert search_books(make_db(), author="x' OR '1'='1") == []` },
      ],
      solution: { files: { 'main.py': py`import sqlite3


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE books (title TEXT, author TEXT, year INTEGER);
        INSERT INTO books VALUES
            ('Dune', 'Frank Herbert', 1965),
            ('Foundation', 'Isaac Asimov', 1951),
            ('The End of Eternity', 'Isaac Asimov', 1955),
            ('Frankenstein', 'Mary Shelley', 1818);
    """)
    return conn


def search_books(conn, author=None, max_year=None):
    conditions, params = [], []
    if author is not None:
        conditions.append("author = ?")
        params.append(author)
    if max_year is not None:
        conditions.append("year <= ?")
        params.append(max_year)
    sql = "SELECT title FROM books"
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY title"
    return [title for (title,) in conn.execute(sql, params)]


db = make_db()
print(search_books(db, author="Isaac Asimov", max_year=1952))
` } },
      hints: ['Keep two lists: conditions (SQL text you write) and params (the values).', 'Only add " WHERE " + " AND ".join(conditions) when the list is not empty.', 'execute accepts a list of parameters as well as a tuple.'],
      whyAsked: 'Search endpoints with optional filters are everywhere; this shows you can be flexible without giving up safety.',
      mistakes: ['Interpolating the values into the WHERE string', 'Producing "WHERE AND ..." or "WHERE" with nothing after it', 'Using truthiness (if max_year:) so a legitimate 0 is ignored'],
      followUps: ['How would you add an optional sort parameter safely?', 'How would you add pagination (LIMIT/OFFSET)?', 'At what point would a query builder or ORM be worth it?'],
      modelAnswer: 'I keep two lists that grow together: SQL fragments that I write myself, like "author = ?", and the matching parameter values. For each filter that isn’t None I append one of each. Then I join the fragments with AND, add WHERE only if there is at least one, append a fixed ORDER BY, and call execute with the params list. User values never touch the SQL string, so injection is impossible, and I check "is not None" rather than truthiness so a filter value of 0 still works.',
    },
    {
      id: 'sql-and-sqlite-lost-inserts',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A script inserts rows into `app.db`, prints them back successfully, and exits. When it runs again, the rows are gone. What is the most likely cause?',
      answer: 'The inserts were never committed. In sqlite3’s default mode an INSERT opens a transaction implicitly; the same connection can read its own uncommitted rows, but closing or exiting without commit() rolls them back. Use `with conn:` or call conn.commit().',
      explanation: py`Uncommitted changes are visible to the connection that made them, which is why the script "saw" them. Durability only happens at \`COMMIT\`. \`conn.in_transaction\` would have been \`True\` right before exit — a quick way to confirm the diagnosis.`,
      code: { lang: 'python', code: py`import sqlite3

conn = sqlite3.connect("app.db")
conn.execute("CREATE TABLE IF NOT EXISTS events (name TEXT)")
with conn:                                   # the fix: commit on success
    conn.execute("INSERT INTO events VALUES (?)", ("signup",))
print(conn.in_transaction)                   # False — nothing pending
conn.close()` },
      whyAsked: 'It tests practical understanding of transactions and of sqlite3’s implicit BEGIN, which surprises many developers.',
      mistakes: ['Blaming file permissions or the path without checking commit', 'Thinking autocommit is the default in the sqlite3 module', 'Adding commit() after every single statement instead of grouping related writes'],
      followUps: ['What does `with conn:` do if an exception is raised?', 'How would you make several inserts atomic?', 'What did Python 3.12 add for transaction control?'],
      modelAnswer: 'Almost certainly the transaction was never committed. With the sqlite3 module’s default settings, the first INSERT silently begins a transaction. The same connection can read its own pending rows, so printing them looks fine, but when the connection closes without commit the changes are rolled back. I would wrap the writes in "with conn:", which commits on success and rolls back on an exception, and I would group related inserts into one transaction rather than committing each statement.',
    },
    {
      id: 'sql-and-sqlite-where-vs-having',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between WHERE and HAVING? Which query lists authors with more than one book published after 1950?',
      code: { lang: 'sql', code: py`-- A
SELECT author, COUNT(*) FROM books WHERE year > 1950 GROUP BY author HAVING COUNT(*) > 1;
-- B
SELECT author, COUNT(*) FROM books WHERE COUNT(*) > 1 AND year > 1950 GROUP BY author;
-- C
SELECT author, COUNT(*) FROM books GROUP BY author HAVING COUNT(*) > 1 AND year > 1950;` },
      options: ['A', 'B', 'C', 'B and C'],
      correctOption: 0,
      answer: 'A. WHERE filters individual rows before grouping; HAVING filters groups after aggregation. B is an error (aggregates aren’t allowed in WHERE) and C applies the year test after grouping, which is wrong or rejected depending on the database.',
      explanation: py`Think of the order SQL logically runs a query: \`FROM\` → \`WHERE\` (rows) → \`GROUP BY\` → aggregates → \`HAVING\` (groups) → \`SELECT\` → \`ORDER BY\` → \`LIMIT\`. Row conditions belong in \`WHERE\` — they also reduce the work done by grouping. Conditions on aggregates can only go in \`HAVING\`.`,
      whyAsked: 'A classic SQL screening question that checks you understand the logical order of query evaluation.',
      mistakes: ['Saying they are interchangeable', 'Putting row filters in HAVING (works in SQLite with bare columns but is confusing and slower)', 'Using an aggregate in WHERE'],
      followUps: ['In what order are the clauses of a SELECT logically evaluated?', 'Why can’t you use a SELECT alias in WHERE in standard SQL?'],
      modelAnswer: 'WHERE filters individual rows before they are grouped, and HAVING filters the groups after the aggregates are computed. So for "authors with more than one book after 1950", the year test goes in WHERE because it is about each book, and COUNT(*) > 1 goes in HAVING because it is about each author’s group — that’s query A. You can’t use an aggregate in WHERE because the groups don’t exist yet at that stage. Keeping row filters in WHERE also means less data is grouped.',
    },
    {
      id: 'sql-and-sqlite-transactions-default',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Explain how the sqlite3 module manages transactions by default and what `with conn:` actually does. What changed in Python 3.12?',
      answer: 'By default (legacy transaction control), sqlite3 implicitly issues BEGIN before INSERT/UPDATE/DELETE/REPLACE and leaves the transaction open until commit() or rollback(); other statements such as SELECT and (since 3.6) DDL do not open one. `with conn:` commits on normal exit and rolls back on exception, but never closes the connection. Python 3.12 added the `autocommit` attribute/parameter for PEP 249-compliant control; the default remains legacy mode.',
      explanation: py`With \`autocommit=False\` (3.12+), a transaction is always open and \`commit()\`/\`rollback()\` immediately start a new one — the behaviour PEP 249 describes. With \`autocommit=True\`, SQLite's own autocommit applies and you manage \`BEGIN\` yourself. Setting \`isolation_level=None\` is the older way to get manual control. Whatever the mode, keep write transactions short, because SQLite allows only one writer at a time.`,
      code: { lang: 'python', code: py`import sqlite3

conn = sqlite3.connect(":memory:")
print(conn.autocommit == sqlite3.LEGACY_TRANSACTION_CONTROL)   # True (3.12+)
conn.execute("CREATE TABLE t (x INTEGER)")
print(conn.in_transaction)      # False — DDL doesn't open a transaction
conn.execute("INSERT INTO t VALUES (1)")
print(conn.in_transaction)      # True — implicit BEGIN
conn.commit()
print(conn.in_transaction)      # False` },
      whyAsked: 'Senior candidates are expected to know their driver’s transaction semantics; misunderstanding them causes lost writes and lock contention.',
      mistakes: ['Saying sqlite3 autocommits every statement by default', 'Believing `with conn:` closes the connection', 'Not knowing that closing with a pending transaction discards it'],
      followUps: ['How would you run a multi-statement transaction with explicit BEGIN IMMEDIATE?', 'What does SQLite’s WAL mode change?', 'How does this map to PostgreSQL drivers?'],
      modelAnswer: 'In its default legacy mode, the sqlite3 module opens a transaction implicitly right before the first INSERT, UPDATE, DELETE or REPLACE and keeps it open until I call commit or rollback; SELECTs and schema statements don’t open one. Using the connection as a context manager wraps a block in that transaction: it commits if the block finishes and rolls back if it raises, but it doesn’t close the connection. Python 3.12 added an autocommit setting so you can opt into strict PEP 249 behaviour, where a transaction is always open, or true autocommit where you issue BEGIN yourself. The default is still legacy mode, so in practice I wrap related writes in "with conn:" and close connections explicitly.',
    },
  ],

  takeaways: [
    'A relational database stores rows in tables with typed columns; primary keys identify rows and foreign keys link tables.',
    'SQL is declarative: SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT describes what you want; the planner decides how.',
    'JOIN combines related tables; LEFT JOIN keeps rows without a match; aggregates with GROUP BY summarise groups.',
    'sqlite3: connect → execute / executemany → fetchone / fetchall / iterate; row_factory = sqlite3.Row gives access by column name.',
    'Always pass values through ? or :name placeholders — never f-strings. Identifiers come from an allow-list.',
    'Writes happen in transactions: `with conn:` commits on success and rolls back on error, but does not close the connection.',
  ],
}
