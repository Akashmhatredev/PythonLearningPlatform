// Curated examples for the standalone /playground page. Pure data.
// Each example: { id, title, level, blurb, files, entry?, stdin?, variants?, guide? }
// Every example (and variant) is executed by tests/unit/python-sandbox.test.js.

// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const fizzIf = py`for n in range(1, 16):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)
`

export const playgroundExamples = [
  {
    id: 'hello',
    title: 'Hello, Python',
    level: 'beginner',
    blurb: 'print(), input() and f-strings. Run it and answer the questions in the output panel.',
    files: {
      'main.py': py`name = input("What's your name? ")
age = int(input("How old are you? "))

print(f"Nice to meet you, {name}!")
print(f"In 10 years you'll be {age + 10}.")
print(f"Your name has {len(name)} letters; backwards it's {name[::-1]!r}.")
`,
    },
    stdin: 'Ada\n15',
    guide: [
      { lines: [1, 1], text: '`input()` shows a prompt and waits for a line of text. It **always returns a str**.' },
      { lines: [2, 2], text: '`int(...)` converts the text to a number so we can do maths with it.' },
      { lines: [4, 6], text: 'f-strings put expressions inside `{}`. `!r` shows the `repr()` — notice the quotes.' },
    ],
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz — three ways',
    level: 'beginner',
    blurb: 'The classic loop-and-condition exercise, written as if/elif, with a lookup table and as one expression.',
    files: { 'main.py': fizzIf },
    variants: [
      { id: 'if', label: 'if / elif / else', files: { 'main.py': fizzIf } },
      {
        id: 'table',
        label: 'Rules as data',
        files: {
          'main.py': py`RULES = {3: "Fizz", 5: "Buzz"}


def fizzbuzz(n: int) -> str:
    words = "".join(word for divisor, word in RULES.items() if n % divisor == 0)
    return words or str(n)


for n in range(1, 16):
    print(fizzbuzz(n))
`,
        },
      },
      {
        id: 'expression',
        label: 'One expression',
        files: {
          'main.py': py`print("\n".join("Fizz" * (n % 3 == 0) + "Buzz" * (n % 5 == 0) or str(n) for n in range(1, 16)))
`,
        },
      },
    ],
    guide: [
      { lines: [1, 1], text: '`range(1, 16)` counts 1…15 — the stop value is never included.' },
      { lines: [2, 3], text: 'Check the most specific rule first: a multiple of 15 is also a multiple of 3 and 5.' },
      { lines: [8, 9], text: '`else` catches every number that matched no rule.' },
    ],
  },
  {
    id: 'grades',
    title: 'Grade book',
    level: 'beginner',
    blurb: 'Lists, dictionaries, loops and built-ins (sum, max, sorted) on real-looking data.',
    files: {
      'main.py': py`scores = {
    "Ada": [92, 88, 95],
    "Ben": [71, 64, 80],
    "Cleo": [85, 90, 78],
    "Dev": [55, 62, 70],
}


def letter(avg: float) -> str:
    if avg >= 90:
        return "A"
    if avg >= 80:
        return "B"
    if avg >= 70:
        return "C"
    return "D"


averages = {name: sum(marks) / len(marks) for name, marks in scores.items()}

for name, avg in sorted(averages.items(), key=lambda item: item[1], reverse=True):
    print(f"{name:<5} {avg:6.1f}  {letter(avg)}")

best = max(averages, key=averages.get)
print(f"\nTop of the class: {best}")
`,
    },
  },
  {
    id: 'word-frequency',
    title: 'Word frequency from a file',
    level: 'intermediate',
    blurb: 'Read a text file, clean words with a regex and count them with collections.Counter.',
    files: {
      'main.py': py`import re
from collections import Counter
from pathlib import Path

text = Path("poem.txt").read_text(encoding="utf-8")
words = re.findall(r"[a-z']+", text.lower())
counts = Counter(words)

print(f"{len(words)} words, {len(counts)} different")
for word, n in counts.most_common(5):
    print(f"{word:>8} {'#' * n} {n}")
`,
      'poem.txt': py`The fog comes
on little cat feet.

It sits looking
over harbor and city
on silent haunches
and then moves on.
The cat sits, the fog moves, the city sleeps.
`,
    },
    guide: [
      { lines: [5, 5], text: 'Project files are written next to `main.py` before each run, so `poem.txt` can be opened like any file.' },
      { lines: [6, 6], text: '`re.findall` with a raw string pattern pulls out runs of letters and apostrophes.' },
      { lines: [7, 7], text: '`Counter` is a dict subclass that counts hashable items.' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory with dataclasses',
    level: 'intermediate',
    blurb: 'Two modules: a dataclass model with validation, and a script that uses it. Exceptions included.',
    files: {
      'main.py': py`from inventory import Inventory, OutOfStock

shop = Inventory()
shop.add("pencil", price=0.5, quantity=100)
shop.add("notebook", price=2.25, quantity=10)

shop.sell("notebook", 3)
print(shop.report())

try:
    shop.sell("notebook", 50)
except OutOfStock as err:
    print("Could not sell:", err)
`,
      'inventory.py': py`from dataclasses import dataclass


class OutOfStock(Exception):
    """Raised when a sale needs more items than we have."""


@dataclass
class Item:
    name: str
    price: float
    quantity: int = 0

    def __post_init__(self):
        if self.price < 0:
            raise ValueError("price cannot be negative")


class Inventory:
    def __init__(self):
        self._items: dict[str, Item] = {}

    def add(self, name, price, quantity=0):
        self._items[name] = Item(name, price, quantity)

    def sell(self, name, quantity):
        item = self._items[name]
        if quantity > item.quantity:
            raise OutOfStock(f"only {item.quantity} {name}(s) left")
        item.quantity -= quantity

    def value(self):
        return sum(i.price * i.quantity for i in self._items.values())

    def report(self):
        lines = [f"{i.name:<10} x{i.quantity:<4} @ {i.price:.2f}" for i in self._items.values()]
        lines.append(f"Stock value: {self.value():.2f}")
        return "\n".join(lines)
`,
    },
  },
  {
    id: 'generators',
    title: 'Lazy log pipeline',
    level: 'intermediate',
    blurb: 'Generators chained into a pipeline: each line flows through read → parse → filter one at a time.',
    files: {
      'main.py': py`from pathlib import Path


def read_lines(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.rstrip("\n")


def parse(lines):
    for line in lines:
        time, level, message = line.split(" ", 2)
        yield {"time": time, "level": level, "message": message}


def only(level, records):
    return (r for r in records if r["level"] == level)


errors = only("ERROR", parse(read_lines("app.log")))
print(type(errors).__name__, "— nothing has been read yet")

for record in errors:
    print(record["time"], record["message"])
`,
      'app.log': py`09:00:01 INFO server started
09:00:05 INFO user ada logged in
09:01:12 ERROR payment service timed out
09:02:40 WARNING slow query (1.8s)
09:03:03 ERROR could not send email
09:04:00 INFO user ada logged out
`,
    },
  },
  {
    id: 'decorators',
    title: 'Decorators: timing & retry',
    level: 'advanced',
    blurb: 'Two real-world decorators built with closures and functools.wraps.',
    files: {
      'main.py': py`import functools
import time


def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed = (time.perf_counter() - start) * 1000
            print(f"{func.__name__} took {elapsed:.2f} ms")
    return wrapper


def retry(times):
    def decorate(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except ConnectionError as err:
                    print(f"attempt {attempt} failed: {err}")
            raise ConnectionError(f"gave up after {times} attempts")
        return wrapper
    return decorate


calls = 0


@retry(times=3)
def flaky_fetch():
    global calls
    calls += 1
    if calls < 3:
        raise ConnectionError("server busy")
    return {"status": "ok"}


@timed
def total(n):
    return sum(i * i for i in range(n))


print(flaky_fetch())
print(total(100_000))
print(total.__name__, "keeps its name thanks to functools.wraps")
`,
    },
  },
  {
    id: 'sqlite',
    title: 'SQL with sqlite3',
    level: 'advanced',
    blurb: 'A real SQLite database in memory: create, insert with parameters, join and aggregate.',
    files: {
      'main.py': py`import sqlite3

db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.executescript("""
    CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE books (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        year INTEGER,
        author_id INTEGER REFERENCES authors(id)
    );
""")

authors = [("Ursula K. Le Guin",), ("Terry Pratchett",)]
db.executemany("INSERT INTO authors (name) VALUES (?)", authors)

books = [
    ("A Wizard of Earthsea", 1968, 1),
    ("The Dispossessed", 1974, 1),
    ("Guards! Guards!", 1989, 2),
    ("Small Gods", 1992, 2),
    ("Night Watch", 2002, 2),
]
with db:  # a transaction: commits on success, rolls back on error
    db.executemany("INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)", books)

query = """
    SELECT a.name, COUNT(*) AS n, MIN(b.year) AS first
    FROM books b JOIN authors a ON a.id = b.author_id
    GROUP BY a.id ORDER BY n DESC
"""
for row in db.execute(query):
    print(f"{row['name']:<20} {row['n']} books since {row['first']}")

year = 1990  # user input is always passed as a parameter, never pasted into SQL
newer = db.execute("SELECT title FROM books WHERE year > ?", (year,)).fetchall()
print("After", year, "->", [r["title"] for r in newer])
print("SQLite version:", sqlite3.sqlite_version)
`,
    },
  },
  {
    id: 'asyncio',
    title: 'asyncio: concurrent waits',
    level: 'advanced',
    blurb: 'Three simulated downloads run concurrently with asyncio.gather — total time ≈ the slowest one.',
    files: {
      'main.py': py`import asyncio
import time


async def download(name, seconds):
    print(f"start  {name}")
    await asyncio.sleep(seconds)  # waiting for "the network" lets other tasks run
    print(f"done   {name}")
    return f"{name}: {seconds}s"


async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        download("photos", 0.3),
        download("music", 0.1),
        download("video", 0.2),
    )
    elapsed = time.perf_counter() - start
    print(results)
    print(f"total ≈ {elapsed:.1f}s (one at a time would take 0.6s)")


asyncio.run(main())
`,
    },
  },
  {
    id: 'unittest',
    title: 'Testing with unittest',
    level: 'intermediate',
    blurb: 'A function and its tests in one project, run with the standard library test runner.',
    files: {
      'main.py': py`import unittest

from pricing import apply_discount


class ApplyDiscountTests(unittest.TestCase):
    def test_percentage_off(self):
        self.assertEqual(apply_discount(100, 15), 85)

    def test_rounds_to_cents(self):
        self.assertEqual(apply_discount(19.99, 10), 17.99)

    def test_rejects_bad_percent(self):
        with self.assertRaises(ValueError):
            apply_discount(10, 120)


unittest.main(argv=["tests"], exit=False, verbosity=2)
`,
      'pricing.py': py`def apply_discount(price: float, percent: float) -> float:
    """Return price reduced by percent, rounded to cents."""
    if not 0 <= percent <= 100:
        raise ValueError("percent must be between 0 and 100")
    return round(price * (1 - percent / 100), 2)
`,
    },
  },
]
