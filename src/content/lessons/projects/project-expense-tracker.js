// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------------ shared files
const MAIN = py`"""Expense tracker: run this file and type commands such as 'add 2026-10-03 food 12.50 lunch'."""
from app import run


def main():
    try:
        run("expenses.csv", "budgets.json")
    except ValueError as err:          # e.g. a broken line in expenses.csv
        print(f"Cannot start: {err}")
    except EOFError:
        print("\nInput ended. Every expense was saved as you added it. Bye!")


if __name__ == "__main__":
    main()
`

const EXPENSES_CSV = py`date,category,amount,note
2026-09-02,food,45.10,weekly shop
2026-09-05,transport,30.00,bus pass top-up
2026-09-18,fun,25.00,cinema
2026-09-26,food,38.75,weekly shop
2026-10-01,food,52.30,weekly shop
2026-10-03,transport,55.00,monthly bus pass
2026-10-04,fun,12.50,"board games, second-hand"
2026-10-09,food,9.95,lunch with Sam
2026-10-15,food,61.40,weekly shop
2026-10-20,fun,30.00,concert ticket
`

const BUDGETS_JSON = py`{
  "food": "150.00",
  "transport": "60.00",
  "fun": "40.00"
}
`

const APP = py`"""The command loop: reads commands, calls the other modules, prints the results."""
import datetime

from expense import parse_expense
from reports import budget_warnings, expenses_in_month, format_summary, totals_by_category, totals_by_month
from storage import append_expense, export_json, load_budgets, load_expenses

HELP = """Commands:
  add YYYY-MM-DD category amount [note]   record an expense
  summary [YYYY-MM]                        one month (the latest by default)
  months                                   total for every month
  export [file.json]                       write everything to JSON
  help                                     show this help
  quit                                     leave (expenses are saved as you add them)"""


def parse_add(argument, today=None):
    """'2026-10-03 food 12.50 lunch with Sam' -> Expense (raises ValueError)."""
    parts = argument.split(maxsplit=3)
    if len(parts) < 3:
        raise ValueError("Usage: add YYYY-MM-DD category amount [note]")
    note = parts[3] if len(parts) == 4 else ""
    return parse_expense(parts[0], parts[1], parts[2], note, today=today)


def latest_month(expenses, today):
    return max((e.month for e in expenses), default=today.strftime("%Y-%m"))


def warnings_after_add(expenses, budgets, expense):
    """Budget warnings for the category and month of a newly added expense."""
    if expense.category not in budgets:
        return []
    month_totals = totals_by_category(expenses_in_month(expenses, expense.month))
    return budget_warnings(month_totals, {expense.category: budgets[expense.category]})


def run(csv_path="expenses.csv", budgets_path="budgets.json", today=None):
    """Load the data and run the command loop until 'quit'."""
    today = today or datetime.date.today()
    expenses = load_expenses(csv_path)
    budgets = load_budgets(budgets_path)
    print(f"Expense tracker: {len(expenses)} expense(s) loaded from {csv_path}. Type 'help' for commands.")
    while True:
        command, _, argument = input("> ").strip().partition(" ")
        command, argument = command.lower(), argument.strip()
        if command in ("quit", "exit"):
            break
        try:
            if command == "add":
                expense = parse_add(argument, today)
                append_expense(expense, csv_path)
                expenses.append(expense)
                print(f"Added {expense.amount} for {expense.category} on {expense.date}.")
                for warning in warnings_after_add(expenses, budgets, expense):
                    print(warning)
            elif command == "summary":
                print(format_summary(expenses, budgets, argument or latest_month(expenses, today)))
            elif command == "months":
                for month, amount in totals_by_month(expenses).items():
                    print(f"{month}  {amount:>10}")
            elif command == "export":
                path = argument or "export.json"
                export_json(expenses, path)
                print(f"Exported {len(expenses)} expense(s) to {path}.")
            elif command == "help":
                print(HELP)
            elif command:
                print(f"Unknown command '{command}'. Type 'help' for commands.")
        except ValueError as err:
            print(f"Error: {err}")
    print("Bye!")
    return expenses
`

const EXPENSE_STARTER = py`"""The Expense record and the rules for turning text into one."""
import datetime
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

CENT = Decimal("0.01")


@dataclass(frozen=True, order=True)
class Expense:
    date: datetime.date
    category: str
    amount: Decimal
    note: str = ""

    @property
    def month(self) -> str:
        """The expense's month as "YYYY-MM"."""
        # TODO (step 2)
        return ""

    def to_row(self) -> dict[str, str]:
        """Every field as a string, for CSV and JSON."""
        # TODO (step 2)
        return {}

    @classmethod
    def from_row(cls, row: dict[str, str]) -> "Expense":
        """Build (and validate) an Expense from a CSV row dict."""
        return parse_expense(row["date"], row["category"], row["amount"], row.get("note") or "")


def parse_date(text: str, today: datetime.date | None = None) -> datetime.date:
    """"2026-10-03" -> date(2026, 10, 3); ValueError for bad or future dates."""
    # TODO (step 3)
    raise ValueError("parse_date() is not written yet (step 3)")


def parse_amount(text: str) -> Decimal:
    """"12.5" -> Decimal("12.50"); ValueError unless it is a number > 0 with at most 2 decimals."""
    # TODO (step 4)
    raise ValueError("parse_amount() is not written yet (step 4)")


def parse_expense(date_text: str, category: str, amount_text: str, note: str = "",
                  today: datetime.date | None = None) -> Expense:
    """Validate the text fields and return an Expense, or raise ValueError."""
    # TODO (step 3/4): clean the category, then use parse_date and parse_amount.
    raise ValueError("parse_expense() is not written yet (steps 3-4)")
`

const EXPENSE = py`"""The Expense record and the rules for turning text into one."""
import datetime
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

CENT = Decimal("0.01")


@dataclass(frozen=True, order=True)
class Expense:
    date: datetime.date
    category: str
    amount: Decimal
    note: str = ""

    @property
    def month(self) -> str:
        """The expense's month as "YYYY-MM"."""
        return self.date.strftime("%Y-%m")

    def to_row(self) -> dict[str, str]:
        """Every field as a string, for CSV and JSON."""
        return {
            "date": self.date.isoformat(),
            "category": self.category,
            "amount": str(self.amount),
            "note": self.note,
        }

    @classmethod
    def from_row(cls, row: dict[str, str]) -> "Expense":
        """Build (and validate) an Expense from a CSV row dict."""
        return parse_expense(row["date"], row["category"], row["amount"], row.get("note") or "")


def parse_date(text: str, today: datetime.date | None = None) -> datetime.date:
    """"2026-10-03" -> date(2026, 10, 3); ValueError for bad or future dates."""
    text = text.strip()
    try:
        day = datetime.date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"Bad date '{text}': use YYYY-MM-DD, e.g. 2026-10-03.") from None
    if today is not None and day > today:
        raise ValueError(f"Bad date {day}: it is in the future.")
    return day


def parse_amount(text: str) -> Decimal:
    """"12.5" -> Decimal("12.50"); ValueError unless it is a number > 0 with at most 2 decimals."""
    text = text.strip()
    try:
        amount = Decimal(text)
    except InvalidOperation:           # Decimal's error is NOT a ValueError
        raise ValueError(f"Bad amount '{text}': use a number like 12.50.") from None
    if not amount.is_finite() or amount <= 0:
        raise ValueError(f"Bad amount '{text}': it must be a number greater than 0.")
    if amount.as_tuple().exponent < -2:
        raise ValueError(f"Bad amount '{text}': use at most 2 decimal places.")
    return amount.quantize(CENT)


def parse_expense(date_text: str, category: str, amount_text: str, note: str = "",
                  today: datetime.date | None = None) -> Expense:
    """Validate the text fields and return an Expense, or raise ValueError."""
    category = category.strip().lower()
    if not category:
        raise ValueError("Bad category: it cannot be empty.")
    return Expense(parse_date(date_text, today), category, parse_amount(amount_text), note.strip())
`

const STORAGE_STARTER = py`"""Files: expenses live in a CSV file; budgets and exports are JSON."""
import csv
import json
from decimal import Decimal
from pathlib import Path

from expense import Expense, parse_amount

FIELDS = ["date", "category", "amount", "note"]


def load_expenses(path) -> list[Expense]:
    """Every expense in the CSV file ([] if it does not exist).

    A bad row raises ValueError that names the line number.
    """
    # TODO (step 5): csv.DictReader + Expense.from_row
    return []


def append_expense(expense: Expense, path) -> None:
    """Add one row to the CSV file, writing the header first if the file is new."""
    # TODO (step 6): csv.DictWriter in append mode
    pass


def load_budgets(path) -> dict[str, Decimal]:
    """{"food": "150.00", ...} in a JSON file -> {"food": Decimal("150.00"), ...}."""
    # TODO (step 8)
    return {}


def export_json(expenses: list[Expense], path) -> None:
    """Write {"count": ..., "total": "...", "expenses": [rows sorted by date]} as JSON."""
    # TODO (step 9)
    pass
`

const STORAGE = py`"""Files: expenses live in a CSV file; budgets and exports are JSON."""
import csv
import json
from decimal import Decimal
from pathlib import Path

from expense import Expense, parse_amount

FIELDS = ["date", "category", "amount", "note"]


def load_expenses(path) -> list[Expense]:
    """Every expense in the CSV file ([] if it does not exist).

    A bad row raises ValueError that names the line number.
    """
    path = Path(path)
    if not path.exists():
        return []
    expenses = []
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        missing = set(FIELDS[:3]) - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{path}: missing column(s) {', '.join(sorted(missing))}")
        for row in reader:
            try:
                expenses.append(Expense.from_row(row))
            except ValueError as err:
                raise ValueError(f"{path}, line {reader.line_num}: {err}") from err
    return expenses


def append_expense(expense: Expense, path) -> None:
    """Add one row to the CSV file, writing the header first if the file is new."""
    path = Path(path)
    is_new = not path.exists() or path.stat().st_size == 0
    with path.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS, lineterminator="\n")
        if is_new:
            writer.writeheader()
        writer.writerow(expense.to_row())


def load_budgets(path) -> dict[str, Decimal]:
    """{"food": "150.00", ...} in a JSON file -> {"food": Decimal("150.00"), ...}."""
    path = Path(path)
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {category.lower(): parse_amount(str(limit)) for category, limit in data.items()}


def export_json(expenses: list[Expense], path) -> None:
    """Write {"count": ..., "total": "...", "expenses": [rows sorted by date]} as JSON."""
    data = {
        "count": len(expenses),
        "total": str(sum((e.amount for e in expenses), Decimal("0.00"))),
        "expenses": [e.to_row() for e in sorted(expenses)],
    }
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
`

const REPORTS_STARTER = py`"""Totals, budget checks and the printed summary. Pure functions: no files, no input()."""
from collections import defaultdict
from decimal import Decimal

ZERO = Decimal("0.00")
WARN_AT = Decimal("0.80")


def total(expenses) -> Decimal:
    """Sum of the amounts (Decimal("0.00") for no expenses)."""
    # TODO (step 7)
    return ZERO


def expenses_in_month(expenses, month: str) -> list:
    """Only the expenses whose month is "YYYY-MM"."""
    # TODO (step 7)
    return []


def totals_by_category(expenses) -> dict[str, Decimal]:
    """{category: total}, biggest total first (ties alphabetical)."""
    # TODO (step 7)
    return {}


def totals_by_month(expenses) -> dict[str, Decimal]:
    """{"YYYY-MM": total} in calendar order."""
    # TODO (step 7)
    return {}


def budget_warnings(category_totals, budgets, warn_at=WARN_AT) -> list[str]:
    """Messages for categories over budget or at warn_at (80%) or more of it."""
    # TODO (step 8)
    return []


def format_summary(expenses, budgets, month: str) -> str:
    """The month's report: count, total, totals by category, budget check."""
    # TODO (step 9)
    return f"Summary for {month}\n(TODO)"
`

const REPORTS = py`"""Totals, budget checks and the printed summary. Pure functions: no files, no input()."""
from collections import defaultdict
from decimal import Decimal

ZERO = Decimal("0.00")
WARN_AT = Decimal("0.80")


def total(expenses) -> Decimal:
    """Sum of the amounts (Decimal("0.00") for no expenses)."""
    return sum((e.amount for e in expenses), ZERO)


def expenses_in_month(expenses, month: str) -> list:
    """Only the expenses whose month is "YYYY-MM"."""
    return [e for e in expenses if e.month == month]


def totals_by_category(expenses) -> dict[str, Decimal]:
    """{category: total}, biggest total first (ties alphabetical)."""
    totals = defaultdict(lambda: ZERO)
    for e in expenses:
        totals[e.category] += e.amount
    return dict(sorted(totals.items(), key=lambda item: (-item[1], item[0])))


def totals_by_month(expenses) -> dict[str, Decimal]:
    """{"YYYY-MM": total} in calendar order."""
    totals = defaultdict(lambda: ZERO)
    for e in expenses:
        totals[e.month] += e.amount
    return dict(sorted(totals.items()))


def budget_warnings(category_totals, budgets, warn_at=WARN_AT) -> list[str]:
    """Messages for categories over budget or at warn_at (80%) or more of it."""
    warnings = []
    for category in sorted(budgets):
        limit = budgets[category]
        spent = category_totals.get(category, ZERO)
        if spent > limit:
            warnings.append(f"OVER BUDGET: {category} spent {spent} of {limit} ({spent - limit} over)")
        elif spent >= limit * warn_at:
            warnings.append(f"Warning: {category} at {spent / limit:.0%} of budget ({spent} of {limit})")
    return warnings


def format_summary(expenses, budgets, month: str) -> str:
    """The month's report: count, total, totals by category, budget check."""
    chosen = expenses_in_month(expenses, month)
    title = f"Summary for {month}"
    lines = [title, "=" * len(title)]
    if not chosen:
        lines.append(f"No expenses in {month}.")
        return "\n".join(lines)
    lines.append(f"{'Expenses:':<11}{len(chosen)}")
    lines.append(f"{'Total:':<11}{total(chosen)}")
    lines.append("")
    lines.append("By category:")
    category_totals = totals_by_category(chosen)
    for category, amount in category_totals.items():
        lines.append(f"  {category:<12}{amount:>9}")
    if budgets:
        lines.append("")
        lines.append("Budget check:")
        warnings = budget_warnings(category_totals, budgets)
        for warning in warnings or ["All categories within budget."]:
            lines.append(f"  {warning}")
    return "\n".join(lines)
`

const OCT_SUMMARY = py`Summary for 2026-10
===================
Expenses:  6
Total:     221.15

By category:
  food           123.65
  transport       55.00
  fun             42.50

Budget check:
  Warning: food at 82% of budget (123.65 of 150.00)
  OVER BUDGET: fun spent 42.50 of 40.00 (2.50 over)
  Warning: transport at 92% of budget (55.00 of 60.00)`

export default {
  id: 'project-expense-tracker',
  kind: 'project',
  title: 'Project 4: Expense Tracker with Files',
  summary: 'Track spending in a CSV file with a validated Expense dataclass, exact Decimal money, monthly and per-category totals, budget warnings, a summary report and JSON export.',
  difficulty: 'intermediate',
  minutes: 120,
  prerequisites: ['csv-data', 'json-data', 'dataclasses', 'dates-and-times', 'try-except'],
  related: ['project-todo-manager', 'project-text-analyzer', 'project-inventory-system', 'numbers-and-math', 'collections-module', 'custom-exceptions', 'raising-exceptions', 'error-handling-patterns', 'pathlib', 'reading-writing-files', 'type-hints', 'input-validation', 'string-formatting', 'methods-and-attributes', 'sql-and-sqlite', 'database-patterns'],
  tags: ['project', 'expense tracker', 'budget', 'money', 'Decimal', 'InvalidOperation', 'csv', 'DictReader', 'DictWriter', 'json export', 'dataclass', 'frozen', 'date.fromisoformat', 'defaultdict', 'validation', 'report', 'intermediate project'],
  apis: [
    { name: 'decimal.Decimal(text)', summary: 'Exact decimal numbers for money; build them from strings, never from floats.' },
    { name: 'Decimal.quantize(Decimal("0.01"))', summary: 'Round/normalise to a fixed number of decimal places (12.5 → 12.50).' },
    { name: 'datetime.date.fromisoformat(text)', summary: 'Parses "2026-10-03" into a date; raises ValueError for anything invalid.' },
    { name: 'csv.DictReader / csv.DictWriter', summary: 'Read rows as dicts keyed by the header; write dicts as rows (open files with newline="").' },
    { name: '@dataclass(frozen=True, order=True)', summary: 'Generates __init__, __repr__, __eq__, ordering and makes instances immutable.' },
    { name: 'collections.defaultdict(factory)', summary: 'A dict that creates a starting value for a missing key, handy for running totals.' },
  ],
  docs: [
    { label: 'decimal — decimal fixed-point and floating-point arithmetic', url: 'https://docs.python.org/3/library/decimal.html' },
    { label: 'csv — CSV file reading and writing', url: 'https://docs.python.org/3/library/csv.html' },
    { label: 'dataclasses — data classes', url: 'https://docs.python.org/3/library/dataclasses.html' },
    { label: 'datetime.date.fromisoformat()', url: 'https://docs.python.org/3/library/datetime.html#datetime.date.fromisoformat' },
    { label: 'Floating-point arithmetic: issues and limitations', url: 'https://docs.python.org/3/tutorial/floatingpoint.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Where does the money go? This tracker answers that. You type \`add 2026-10-09 food 9.95 lunch with Sam\`; it checks every field, appends a row to \`expenses.csv\`, and warns you the moment a category creeps past 80% of its monthly budget. \`summary\` shows the month, \`months\` shows the trend, and \`export\` writes everything to JSON for another program to use.`,
    py`It's a small app with the bones of real business software: a **record type** (an \`Expense\` [dataclass](lesson:dataclasses)), **validation at the boundary** (text → \`date\` and \`Decimal\`, or a clear error), **file storage** ([CSV](lesson:csv-data) in, [JSON](lesson:json-data) out), and **reports** computed from the data.`,
    py`Four modules keep the jobs apart: \`expense.py\` (the record and its validation), \`storage.py\` (files), \`reports.py\` (pure calculations and the summary) and \`app.py\` (the command loop, already written for you), plus the usual tiny \`main.py\`.`,
  ],
  why: [
    py`Money is where "close enough" isn't. With floats, \`0.1 + 0.2\` is \`0.30000000000000004\`; add up a year of coffees and your totals drift by fractions of a cent that auditors — and tests — notice. Python's \`decimal\` module does exact decimal arithmetic, and learning when to use it is a genuine professional skill.`,
    py`Real data is also messy. Dates arrive as \`03/10/2026\`, amounts as \`12,50\`, files get hand-edited. A tracker you can trust **refuses bad data with a useful message** — including *which line* of the file is broken — instead of crashing or, worse, silently storing nonsense.`,
  ],
  eli15: [
    py`Think of a shoebox of receipts. Each receipt has a date, what kind of thing it was (food, bus, fun), how much it cost, and a little note.`,
    py`Our program is a careful assistant. Before a receipt goes in the box, the assistant checks it: is the date a real date and not in the future? Is the amount a proper number above zero? Then they write it on a new line of a spreadsheet (the CSV file), so nothing is lost.`,
    py`Whenever you ask, the assistant adds up the receipts by month and by kind, compares them with your pocket-money limits, and says *"careful — fun is already over budget!"*. And they do their sums with **exact** decimals, like a cashier, not the slightly-off decimals computers normally use.`,
  ],
  analogy: {
    title: 'An accountant with a ledger and a stamp',
    body: [
      py`An accountant never writes a receipt into the ledger unchecked. They read the date properly, count the money to the cent, file the category, and stamp it. At month end they total each column, compare with the budget and write a short report for the boss — who might ask for a copy in a different format.`,
      py`\`parse_expense\` is the checking and stamping, the CSV file is the ledger, \`reports.py\` does the month-end totals, and \`export_json\` makes the copy for the boss.`,
    ],
    mapping: [
      ['a receipt', 'one Expense (date, category, amount, note)'],
      ['checking the receipt before filing it', 'parse_expense(): fromisoformat, Decimal, range checks'],
      ['writing a new line in the ledger', 'append_expense(): one CSV row, header only once'],
      ['counting to the exact cent', 'Decimal arithmetic instead of float'],
      ['month-end column totals', 'totals_by_month(), totals_by_category()'],
      ['"you are over budget" memo', 'budget_warnings()'],
      ['a copy in another format for the boss', 'export_json()'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Who does what in the expense tracker',
    props: {
      width: 760,
      height: 360,
      nodes: [
        { id: 'app', label: 'app.py', note: 'command loop', x: 380, y: 60, tone: 'yellow' },
        { id: 'expense', label: 'expense.py', note: 'Expense + parse_*', x: 130, y: 180, tone: 'blue' },
        { id: 'reports', label: 'reports.py', note: 'totals · warnings · summary', x: 630, y: 180, tone: 'blue' },
        { id: 'storage', label: 'storage.py', note: 'CSV · JSON', x: 380, y: 200, tone: 'paper' },
        { id: 'csv', label: 'expenses.csv', note: 'the ledger', x: 200, y: 305, tone: 'kraft' },
        { id: 'budgets', label: 'budgets.json', note: 'monthly limits', x: 380, y: 305, tone: 'kraft' },
        { id: 'export', label: 'export.json', note: 'for other programs', x: 580, y: 305, tone: 'kraft' },
      ],
      edges: [
        { from: 'app', to: 'expense', label: 'parse_expense' },
        { from: 'app', to: 'storage', label: 'load / append / export' },
        { from: 'app', to: 'reports', label: 'format_summary' },
        { from: 'storage', to: 'expense', label: 'from_row / to_row', dashed: true },
        { from: 'storage', to: 'csv' },
        { from: 'storage', to: 'budgets' },
        { from: 'storage', to: 'export' },
      ],
      steps: [
        { focus: ['app'], text: py`\`app.py\` reads a command such as \`add 2026-10-09 food 9.95 lunch\`. It decides *what* to do but contains no rules about money or files.` },
        { focus: ['app', 'expense'], edges: ['app->expense'], text: py`\`parse_expense\` turns the four text pieces into a typed, immutable \`Expense\` — a real \`date\`, a \`Decimal\` amount — or raises \`ValueError\` with a message for the user.` },
        { focus: ['storage', 'csv'], edges: ['app->storage', 'storage->csv', 'storage->expense'], text: py`\`append_expense\` writes the expense as one CSV row (\`to_row\` turns it into strings). Loading goes the other way, through \`from_row\`, so **file data is validated exactly like typed data**.` },
        { focus: ['storage', 'budgets'], edges: ['storage->budgets'], text: py`Budgets live in JSON as strings (\`"150.00"\`) and become \`Decimal\`s when loaded.` },
        { focus: ['reports'], edges: ['app->reports'], text: py`\`reports.py\` is pure: give it expenses and budgets, get totals, warnings and a formatted summary back. No files, no \`input()\` — trivial to test.` },
        { focus: ['storage', 'export'], edges: ['storage->export'], text: py`\`export_json\` writes everything — amounts as strings, so no precision is lost — for a spreadsheet, a website or another script.` },
      ],
    },
    alt: 'Architecture diagram. app.py at the top calls parse_expense in expense.py, load/append/export in storage.py, and format_summary in reports.py. storage.py converts expenses with from_row and to_row and reads or writes three files: expenses.csv, budgets.json and export.json.',
    caption: py`Each module has one reason to change: new validation rules touch \`expense.py\`, a new file format touches \`storage.py\`, a new report touches \`reports.py\`.`,
  },
  animation: {
    type: 'comparison',
    title: 'float vs Decimal for money',
    props: {
      left: {
        label: 'float — binary fractions',
        lang: 'python',
        code: py`prices = [0.10, 0.20, 0.30]
total = sum(prices)
print(total)            # 0.6000000000000001
print(total == 0.6)     # False
print(round(2.675, 2))  # 2.67 (2.675 is really 2.67499999...)`,
      },
      right: {
        label: 'Decimal — exact decimal digits',
        lang: 'python',
        code: py`from decimal import Decimal

prices = [Decimal("0.10"), Decimal("0.20"), Decimal("0.30")]
total = sum(prices, Decimal("0.00"))
print(total)                     # 0.60
print(total == Decimal("0.6"))   # True
print(Decimal("2.675").quantize(Decimal("0.01")))   # 2.68 (ROUND_HALF_EVEN: ties go to the even digit)`,
      },
      points: [
        'Floats store numbers in binary, so most decimal fractions (0.1, 0.2, 2.675) are tiny approximations.',
        'Decimal stores decimal digits exactly, so sums of prices are exact and keep their trailing zeros (0.60).',
        'Build Decimals from strings: Decimal("0.10"). Decimal(0.1) faithfully copies the float\'s error.',
        'Decimal is slower than float — irrelevant for a budget app, a consideration for heavy number crunching.',
      ],
    },
    alt: 'Two code panels. Left, with floats: summing 0.10, 0.20 and 0.30 prints 0.6000000000000001, comparing to 0.6 is False, and round(2.675, 2) gives 2.67. Right, with Decimal built from strings: the sum prints 0.60, equals Decimal 0.6, and quantizing 2.675 to cents gives 2.68.',
  },

  // ------------------------------------------------------------------ plan
  requirements: [
    py`\`expense.Expense\` is a \`@dataclass(frozen=True, order=True)\` with \`date: datetime.date\`, \`category: str\`, \`amount: Decimal\` and \`note: str = ""\`. Its \`month\` property returns \`"YYYY-MM"\`; \`to_row()\` returns all four fields as strings (\`"2026-10-04"\`, \`"fun"\`, \`"12.50"\`, note); \`Expense.from_row(row)\` validates a CSV row dict back into an \`Expense\`.`,
    py`\`expense.parse_expense(date_text, category, amount_text, note="", today=None)\` strips every field and lower-cases the category. Errors are always \`ValueError\`: messages start with \`Bad date\` for anything \`date.fromisoformat\` rejects and contain \`future\` for a date after \`today\` (when given); they start with \`Bad amount\` unless the amount is a finite number greater than 0 with at most 2 decimal places; they start with \`Bad category\` for an empty category.`,
    py`Valid amounts are stored as \`Decimal\` with exactly two decimal places: \`"12.5"\` → \`Decimal("12.50")\`.`,
    py`\`storage.load_expenses(path)\` reads the CSV with \`csv.DictReader\`, returns \`[]\` for a missing file, and raises \`ValueError\` containing \`line N\` for a bad row.`,
    py`\`storage.append_expense(expense, path)\` appends one row, writing the header \`date,category,amount,note\` only when the file is new or empty. \`storage.load_budgets(path)\` returns \`{category: Decimal}\` from JSON.`,
    py`\`reports.total(expenses)\` sums exactly (\`Decimal("0.00")\` for none); \`expenses_in_month(expenses, "YYYY-MM")\` filters; \`totals_by_category\` returns a dict ordered by total (biggest first, ties alphabetical); \`totals_by_month\` returns months in calendar order.`,
    py`\`reports.budget_warnings(category_totals, budgets)\` checks categories in alphabetical order and returns \`OVER BUDGET: fun spent 42.50 of 40.00 (2.50 over)\` when spent > limit, or \`Warning: food at 82% of budget (123.65 of 150.00)\` when spent ≥ 80% of the limit.`,
    py`\`reports.format_summary(expenses, budgets, month)\` produces the report shown in the starter (title, underline, \`Expenses:\`, \`Total:\`, \`By category:\`, \`Budget check:\`), or ends with \`No expenses in {month}.\`.`,
    py`\`storage.export_json(expenses, path)\` writes \`{"count": …, "total": "…", "expenses": [rows sorted by date]}\` with amounts as strings.`,
  ],
  objectives: [
    'Model a record with a frozen, ordered dataclass and give it conversion methods (to_row / from_row).',
    'Validate text at the boundary: date.fromisoformat for dates, Decimal for money — and turn their errors into one exception type.',
    'Do exact money arithmetic with Decimal: build from strings, quantize to cents, sum with a Decimal start value.',
    'Read and append CSV safely with DictReader/DictWriter, newline="" and a header written exactly once.',
    'Group and total with defaultdict, and order results deliberately with sorted keys.',
    'Inject "today" so date rules are testable, and report bad file lines with their line numbers.',
  ],

  // ------------------------------------------------------------------ build
  playground: {
    title: 'Expense tracker — starter',
    objective: 'Implement expense.py, storage.py and reports.py (app.py and main.py are done) until every test is green.',
    files: { 'main.py': MAIN, 'app.py': APP, 'expense.py': EXPENSE_STARTER, 'storage.py': STORAGE_STARTER, 'reports.py': REPORTS_STARTER, 'expenses.csv': EXPENSES_CSV, 'budgets.json': BUDGETS_JSON },
    expected: py`The starter runs, but it loads nothing and every \`add\` answers \`Error: parse_expense() is not written yet\`. When you're done, \`summary 2026-10\` prints:

\`\`\`text
${OCT_SUMMARY}
\`\`\`

and \`add 2026-10-28 fun 7.50 arcade\` answers \`Added 7.50 for fun on 2026-10-28.\` followed by \`OVER BUDGET: fun spent 50.00 of 40.00 (10.00 over)\`. Files are reset before every run in this sandbox; open the **expenses.csv** tab after a run to see appended rows.`,
    tests: [
      { name: 'parse_expense turns text into a typed Expense', code: py`import datetime
from decimal import Decimal
from expense import Expense, parse_expense
e = parse_expense("2026-10-03", " Food ", "12.5", " lunch with Sam ")
assert isinstance(e, Expense)
assert e.date == datetime.date(2026, 10, 3)
assert e.category == "food" and e.note == "lunch with Sam"
assert e.amount == Decimal("12.50") and str(e.amount) == "12.50", 'Store amounts as a Decimal with 2 decimal places'
assert e.month == "2026-10"` },
      { name: 'bad dates and future dates raise ValueError', code: py`import datetime
from expense import parse_expense
for bad in ["03/10/2026", "2026-02-30", "yesterday", ""]:
    with raises(ValueError, match="Bad date"):
        parse_expense(bad, "food", "5")
with raises(ValueError, match="future"):
    parse_expense("2026-11-01", "food", "5", today=datetime.date(2026, 10, 31))
assert parse_expense("2026-10-31", "food", "5", today=datetime.date(2026, 10, 31)).amount == 5` },
      { name: 'bad amounts and empty categories raise ValueError (not InvalidOperation)', code: py`from expense import parse_expense
for bad in ["abc", "12,50", "-5", "0", "NaN", "12.345"]:
    with raises(ValueError, match="Bad amount"):
        parse_expense("2026-10-03", "food", bad)
with raises(ValueError, match="Bad category"):
    parse_expense("2026-10-03", "   ", "5")` },
      { name: 'to_row and from_row convert to strings and back', code: py`from expense import Expense, parse_expense
e = parse_expense("2026-10-04", "fun", "12.5", "board games, second-hand")
row = e.to_row()
assert row == {"date": "2026-10-04", "category": "fun", "amount": "12.50", "note": "board games, second-hand"}
assert Expense.from_row(row) == e` },
      { name: 'load_expenses and load_budgets read the sample files', code: py`import datetime
from decimal import Decimal
from storage import load_budgets, load_expenses
expenses = load_expenses("expenses.csv")
assert len(expenses) == 10
assert expenses[0].date == datetime.date(2026, 9, 2) and expenses[0].amount == Decimal("45.10")
assert expenses[6].note == "board games, second-hand", 'The quoted comma belongs to the note'
assert load_expenses("nothing-here.csv") == []
assert load_budgets("budgets.json") == {"food": Decimal("150.00"), "transport": Decimal("60.00"), "fun": Decimal("40.00")}` },
      { name: 'a bad CSV row is reported with its line number', code: py`from pathlib import Path
from storage import load_expenses
Path("broken.csv").write_text("date,category,amount,note\n2026-10-01,food,5.00,ok\n2026-10-02,food,five,oops\n", encoding="utf-8")
with raises(ValueError, match="line 3"):
    load_expenses("broken.csv")` },
      { name: 'append_expense writes the header once, then one row per expense', code: py`from pathlib import Path
from expense import parse_expense
from storage import append_expense, load_expenses
first = parse_expense("2026-10-01", "food", "3.20", "apples")
second = parse_expense("2026-10-02", "fun", "8", "")
append_expense(first, "new.csv")
append_expense(second, "new.csv")
lines = Path("new.csv").read_text(encoding="utf-8").splitlines()
assert lines == ["date,category,amount,note", "2026-10-01,food,3.20,apples", "2026-10-02,fun,8.00,"]
assert load_expenses("new.csv") == [first, second]` },
      { name: 'totals are exact Decimals; categories ordered by total', code: py`from decimal import Decimal
from expense import parse_expense
from reports import total, totals_by_category
items = [parse_expense("2026-10-01", "food", "0.10"), parse_expense("2026-10-02", "food", "0.20"),
         parse_expense("2026-10-03", "fun", "1.00"), parse_expense("2026-10-04", "bus", "1.00")]
assert total(items) == Decimal("2.30") and str(total(items)) == "2.30"
assert str(total([])) == "0.00"
result = totals_by_category(items)
assert result == {"bus": Decimal("1.00"), "fun": Decimal("1.00"), "food": Decimal("0.30")}
assert list(result) == ["bus", "fun", "food"], 'Biggest total first; equal totals alphabetical'` },
      { name: 'totals_by_month is in calendar order; expenses_in_month filters', code: py`from decimal import Decimal
from expense import parse_expense
from reports import expenses_in_month, totals_by_month
items = [parse_expense("2026-10-05", "food", "4.00"), parse_expense("2026-09-30", "food", "1.50"),
         parse_expense("2026-10-01", "fun", "2.25")]
assert totals_by_month(items) == {"2026-09": Decimal("1.50"), "2026-10": Decimal("6.25")}
assert list(totals_by_month(items)) == ["2026-09", "2026-10"], 'Months in calendar order'
assert expenses_in_month(items, "2026-10") == [items[0], items[2]]` },
      { name: 'budget_warnings flags over-budget and 80%+ categories', code: py`from decimal import Decimal as D
from reports import budget_warnings
budgets = {"food": D("150.00"), "fun": D("40.00"), "transport": D("60.00"), "gifts": D("100.00")}
spent = {"food": D("123.65"), "fun": D("42.50"), "transport": D("55.00"), "gifts": D("20.00")}
assert budget_warnings(spent, budgets) == [
    "Warning: food at 82% of budget (123.65 of 150.00)",
    "OVER BUDGET: fun spent 42.50 of 40.00 (2.50 over)",
    "Warning: transport at 92% of budget (55.00 of 60.00)",
]
assert budget_warnings({}, budgets) == []` },
      { name: 'format_summary reports one month', code: py`import re
from reports import format_summary
from storage import load_budgets, load_expenses
report = format_summary(load_expenses("expenses.csv"), load_budgets("budgets.json"), "2026-10")
assert report.splitlines()[:2] == ["Summary for 2026-10", "==================="]
assert re.search(r"^Expenses:\s+6$", report, re.M)
assert re.search(r"^Total:\s+221\.15$", report, re.M)
assert re.search(r"^\s+food\s+123\.65$", report, re.M)
assert "OVER BUDGET: fun spent 42.50 of 40.00 (2.50 over)" in report
assert format_summary([], {}, "2026-12").endswith("No expenses in 2026-12.")` },
      { name: 'a whole session: add, bad input, summary, export', stdin: 'add 2026-10-28 fun 7.50 arcade\nadd 2026-13-01 food 5\nadd 2026-10-29 food abc\nsummary 2026-10\nexport export.json\nquit', code: py`import datetime
import json
from pathlib import Path
from app import run
Path("session.csv").write_text(files["expenses.csv"], encoding="utf-8")
out = capture(run, "session.csv", "budgets.json", datetime.date(2026, 10, 31))
assert out.count("Error:") == 2, 'The bad date and the bad amount are reported, not fatal'
assert "OVER BUDGET: fun spent 50.00 of 40.00 (10.00 over)" in out
assert Path("session.csv").read_text(encoding="utf-8").splitlines()[-1] == "2026-10-28,fun,7.50,arcade"
data = json.loads(Path("export.json").read_text(encoding="utf-8"))
assert data["count"] == 11 and data["total"] == "367.50"
assert data["expenses"][-1] == {"date": "2026-10-28", "category": "fun", "amount": "7.50", "note": "arcade"}` },
    ],
  },
  steps: [
    {
      title: 'Plan the modules and the data',
      body: [
        py`Start from the data. One expense is four facts: **when**, **what kind**, **how much**, and an optional **note**. On disk that's one CSV row; in memory it should be a proper object with proper types — a \`date\`, not the string \`"2026-10-03"\`; a \`Decimal\`, not the string \`"12.50"\`.`,
        { code: EXPENSES_CSV, lang: 'text', title: 'expenses.csv (in the starter)' },
        py`Why CSV for storage? Each expense is one flat row, CSV opens in any spreadsheet, and *appending* a row never rewrites old data. Why JSON for budgets and export? Budgets are a mapping (category → limit) and exports are nested (a list inside a summary object) — shapes CSV can't express.`,
        py`Then split the work so each file has one reason to change:`,
        py`| module | job | talks to files? | talks to the user? |
|---|---|---|---|
| \`expense.py\` | the \`Expense\` record, text → validated values | no | no |
| \`storage.py\` | CSV and JSON in/out | **yes** | no |
| \`reports.py\` | totals, warnings, the summary text | no | no |
| \`app.py\` | the command loop (already written) | via storage | **yes** |`,
        py`Read \`app.py\` first: it shows exactly how your functions will be called.`,
      ],
    },
    {
      title: 'The Expense dataclass',
      body: [
        py`A [dataclass](lesson:dataclasses) writes the boring parts of a class for you (\`__init__\`, \`__repr__\`, \`__eq__\`). Two options make it fit money records perfectly:`,
        { code: py`import datetime
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, order=True)
class Expense:
    date: datetime.date
    category: str
    amount: Decimal
    note: str = ""

    @property
    def month(self) -> str:
        return self.date.strftime("%Y-%m")

    def to_row(self) -> dict[str, str]:
        return {
            "date": self.date.isoformat(),
            "category": self.category,
            "amount": str(self.amount),
            "note": self.note,
        }


e = Expense(datetime.date(2026, 10, 3), "food", Decimal("12.50"), "lunch")
print(e)
print(e.month, e.to_row())`, lang: 'python', title: 'expense.py — the record' },
        py`- \`frozen=True\` makes instances **immutable**: \`e.amount = Decimal("0")\` raises \`FrozenInstanceError\`. A recorded expense is a fact; to "change" one you create a corrected copy (\`dataclasses.replace(e, amount=…)\`). Frozen dataclasses are also hashable, so they can go in sets.
- \`order=True\` adds \`<\`, \`>\` and friends, comparing fields **in order** — date first — so \`sorted(expenses)\` sorts chronologically for free.
- \`month\` is a [property](lesson:properties-and-encapsulation): computed from \`date\` whenever you read it, never stored, so it can't get out of sync.
- \`to_row()\` turns the typed values back into strings for files. \`str(Decimal("12.50"))\` is \`"12.50"\` — trailing zero kept.`,
        py`\`from_row\` (already in the starter) is a **classmethod** — an alternative constructor, \`Expense.from_row(row)\` — that routes file data through the same validation as typed input. See [instance, class & static methods](lesson:methods-and-attributes).`,
      ],
    },
    {
      title: 'Validate dates — and inject "today"',
      body: [
        py`\`datetime.date.fromisoformat\` parses the international \`YYYY-MM-DD\` format and rejects everything else, including impossible dates like \`2026-02-30\`. Its error message is technical, so we catch it and raise our own:`,
        { code: py`import datetime


def parse_date(text, today=None):
    text = text.strip()
    try:
        day = datetime.date.fromisoformat(text)
    except ValueError:
        raise ValueError(f"Bad date '{text}': use YYYY-MM-DD, e.g. 2026-10-03.") from None
    if today is not None and day > today:
        raise ValueError(f"Bad date {day}: it is in the future.")
    return day


print(parse_date("2026-10-03"))
for bad in ["03/10/2026", "2026-02-30"]:
    try:
        parse_date(bad)
    except ValueError as err:
        print(err)`, lang: 'python', title: 'expense.py — parse_date' },
        py`"No future dates" needs to know what today is. Calling \`datetime.date.today()\` inside \`parse_date\` would make the rule untestable (the answer changes every day), so **the caller passes \`today\` in**. \`app.run\` passes the real date; tests pass \`date(2026, 10, 31)\`. Same trick as injecting the random generator in [project 1](lesson:project-number-game).`,
        { callout: 'version', title: 'fromisoformat got more lenient in 3.11', text: py`Before Python 3.11, \`date.fromisoformat\` accepted only \`YYYY-MM-DD\`. Since 3.11 it accepts most ISO 8601 date forms, such as \`20261003\`. Both are unambiguous, so it's fine to accept them; ambiguous forms like \`03/10/2026\` (3 October or March 10?) are still rejected.` },
      ],
    },
    {
      title: 'Validate money with Decimal',
      body: [
        py`Build \`Decimal\`s from **strings** — \`Decimal("12.50")\` is exactly 12.50, while \`Decimal(12.5)\` would copy a float, and \`Decimal(0.1)\` is \`0.1000000000000000055511151231257827…\`. Text from the user or a file is already a string, which is perfect.`,
        py`One trap: when \`Decimal()\` can't parse text it raises \`decimal.InvalidOperation\`, which is **not** a \`ValueError\` (it's an \`ArithmeticError\`). If you only catch \`ValueError\`, \`"abc"\` crashes the app. Translate it:`,
        { code: py`from decimal import Decimal, InvalidOperation

CENT = Decimal("0.01")


def parse_amount(text):
    text = text.strip()
    try:
        amount = Decimal(text)
    except InvalidOperation:           # Decimal's error is NOT a ValueError
        raise ValueError(f"Bad amount '{text}': use a number like 12.50.") from None
    if not amount.is_finite() or amount <= 0:
        raise ValueError(f"Bad amount '{text}': it must be a number greater than 0.")
    if amount.as_tuple().exponent < -2:
        raise ValueError(f"Bad amount '{text}': use at most 2 decimal places.")
    return amount.quantize(CENT)


print(parse_amount("12.5"), parse_amount("8"), parse_amount("1e3"))   # 12.50 8.00 1000.00`, lang: 'python', title: 'expense.py — parse_amount' },
        py`- \`Decimal("NaN")\` and \`Decimal("Infinity")\` parse successfully! \`is_finite()\` rejects them — and must run **before** \`amount <= 0\`, because comparing a NaN with \`<\` raises \`InvalidOperation\`. The \`or\` short-circuits, so the comparison never happens for NaN.
- \`as_tuple().exponent\` is the power of ten of the last digit: \`-2\` for \`12.50\`, \`-3\` for \`12.345\`. Rejecting fractions of a cent is better than silently rounding them.
- \`quantize(CENT)\` normalises to exactly two places: \`12.5\` → \`12.50\`, \`8\` → \`8.00\`.`,
        py`Finally \`parse_expense\` cleans the category and combines the pieces:`,
        { code: py`def parse_expense(date_text, category, amount_text, note="", today=None):
    category = category.strip().lower()
    if not category:
        raise ValueError("Bad category: it cannot be empty.")
    return Expense(parse_date(date_text, today), category, parse_amount(amount_text), note.strip())`, lang: 'python', title: 'expense.py — parse_expense' },
      ],
    },
    {
      title: 'Load the CSV — and name the broken line',
      body: [
        py`\`csv.DictReader\` uses the header row as keys, so each row is a dict like \`{"date": "2026-10-04", "category": "fun", "amount": "12.50", "note": "board games, second-hand"}\`. It also understands quoting: the comma inside \`"board games, second-hand"\` belongs to the note.`,
        { code: py`import csv
from pathlib import Path


def load_expenses(path):
    path = Path(path)
    if not path.exists():
        return []
    expenses = []
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        missing = set(FIELDS[:3]) - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{path}: missing column(s) {', '.join(sorted(missing))}")
        for row in reader:
            try:
                expenses.append(Expense.from_row(row))
            except ValueError as err:
                raise ValueError(f"{path}, line {reader.line_num}: {err}") from err
    return expenses`, lang: 'python', title: 'storage.py — load_expenses' },
        py`- \`newline=""\` hands line endings to the \`csv\` module untouched. The docs require it: without it, quoted fields containing newlines break, and on Windows written files get blank lines between rows.
- \`reader.line_num\` is the line the reader just finished — exactly what a person needs to fix the file: \`expenses.csv, line 3: Bad amount 'five': …\`.
- \`raise … from err\` keeps the original error attached as the *cause*, so a developer still sees the full story in a traceback (see [exception chaining](lesson:raising-exceptions)).
- Checking the header first turns a confusing \`KeyError: 'amount'\` into a clear message.`,
      ],
    },
    {
      title: 'Append without rewriting',
      body: [
        py`Adding an expense should add **one line** — not rewrite the whole file. Mode \`"a"\` (append) does that. The header must be written exactly once, when the file is brand new:`,
        { code: py`def append_expense(expense, path):
    path = Path(path)
    is_new = not path.exists() or path.stat().st_size == 0
    with path.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS, lineterminator="\n")
        if is_new:
            writer.writeheader()
        writer.writerow(expense.to_row())`, lang: 'python', title: 'storage.py — append_expense' },
        py`\`csv\` writes \`\r\n\` line endings by default (the CSV standard); \`lineterminator="\n"\` matches the sample file so the file doesn't end up with mixed endings. \`DictWriter\` adds quotes only when a value needs them (a comma, a quote or a newline inside).`,
        py`Saving each expense as it's added (instead of on \`quit\`) means a crash or Ctrl+D never loses an entry — the same choice as in the [to-do manager](lesson:project-todo-manager), but cheaper, because appending touches only the end of the file.`,
      ],
    },
    {
      title: 'Totals by category and by month',
      body: [
        py`Grouping-and-summing is a job for [\`defaultdict\`](lesson:collections-module): a missing key starts at zero automatically. Two details keep money exact and output predictable:`,
        { code: py`from collections import defaultdict
from decimal import Decimal

ZERO = Decimal("0.00")


def total(expenses):
    return sum((e.amount for e in expenses), ZERO)


def totals_by_category(expenses):
    totals = defaultdict(lambda: ZERO)
    for e in expenses:
        totals[e.category] += e.amount
    return dict(sorted(totals.items(), key=lambda item: (-item[1], item[0])))


def totals_by_month(expenses):
    totals = defaultdict(lambda: ZERO)
    for e in expenses:
        totals[e.month] += e.amount
    return dict(sorted(totals.items()))


def expenses_in_month(expenses, month):
    return [e for e in expenses if e.month == month]`, lang: 'python', title: 'reports.py — totals' },
        py`- \`sum(…, ZERO)\` starts from \`Decimal("0.00")\` instead of the int \`0\`, so the total of nothing is \`0.00\` and every result keeps two decimal places.
- Dicts keep insertion order, so building a dict from **sorted** items gives an ordered result. Categories sort by \`(-total, name)\` — biggest first, ties alphabetical; months sort as strings, which works because \`"YYYY-MM"\` puts the most significant part first (\`"2026-09" < "2026-10"\`). A format like \`"10/2026"\` would sort wrongly.`,
      ],
    },
    {
      title: 'Budgets and warnings',
      body: [
        py`Budgets are stored as JSON **strings** (\`"150.00"\`) so they load exactly. \`load_budgets\` reuses \`parse_amount\`, so a typo in \`budgets.json\` gets the same clear message as a typo at the prompt:`,
        { code: py`def load_budgets(path):
    path = Path(path)
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {category.lower(): parse_amount(str(limit)) for category, limit in data.items()}`, lang: 'python', title: 'storage.py — load_budgets' },
        py`Warnings compare a month's spending with each limit. \`Decimal\` supports the \`%\` format, so \`f"{spent / limit:.0%}"\` prints \`82%\`:`,
        { code: py`WARN_AT = Decimal("0.80")


def budget_warnings(category_totals, budgets, warn_at=WARN_AT):
    warnings = []
    for category in sorted(budgets):
        limit = budgets[category]
        spent = category_totals.get(category, ZERO)
        if spent > limit:
            warnings.append(f"OVER BUDGET: {category} spent {spent} of {limit} ({spent - limit} over)")
        elif spent >= limit * warn_at:
            warnings.append(f"Warning: {category} at {spent / limit:.0%} of budget ({spent} of {limit})")
    return warnings`, lang: 'python', title: 'reports.py — budget_warnings' },
        py`\`if\`/\`elif\` order matters: test "over" first, otherwise an over-budget category would only get the milder 80% warning. \`sorted(budgets)\` fixes the order of the messages so tests (and users) see them consistently. \`app.py\` calls this right after every \`add\`, for just that category, so you're warned the moment you cross a line.`,
      ],
    },
    {
      title: 'The summary report and the JSON export',
      body: [
        py`\`format_summary\` assembles the month's numbers into lines. \`Decimal\` honours format specs, so \`f"{amount:>9}"\` right-aligns money in a column:`,
        { code: REPORTS, lang: 'python', title: 'reports.py (complete)' },
        py`The export puts amounts in JSON as **strings**. \`json.dumps(Decimal("1.10"))\` raises \`TypeError: Object of type Decimal is not JSON serializable\` — and converting to \`float\` would quietly reintroduce rounding errors in whatever reads the file. Strings travel exactly; the reader converts them back with \`Decimal(text)\`.`,
        { code: py`def export_json(expenses, path):
    data = {
        "count": len(expenses),
        "total": str(sum((e.amount for e in expenses), Decimal("0.00"))),
        "expenses": [e.to_row() for e in sorted(expenses)],
    }
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")`, lang: 'python', title: 'storage.py — export_json' },
        py`\`sorted(expenses)\` works thanks to \`order=True\`: expenses compare by date first. Run the tests — the last one drives a whole session (a good add, a bad date, a bad amount, a summary and an export) through \`app.run\` with \`today\` fixed to 31 October 2026, then inspects the CSV and the JSON it produced.`,
      ],
    },
  ],
  challenges: [
    'Add "delete <n>" and "edit <n> …" commands. Appending no longer suffices: rewrite the CSV safely (write a temporary file, then os.replace).',
    'Support recurring expenses: a recurring.json with monthly items (rent, phone) that "apply 2026-11" adds once per month — refuse to add them twice.',
    'Add a "search <text>" command that matches notes case-insensitively, and "between 2026-09-15 2026-10-15" for a date range.',
    'Add income records and show "balance" per month (income − expenses). Consider a Transaction dataclass with a kind field instead of a second class.',
    'Draw a text bar chart of totals_by_month scaled to the biggest month.',
    'Replace the CSV with SQLite (sqlite3 in the standard library): keep storage.py\'s functions the same so app.py and reports.py don\'t change at all.',
    'Support several currencies: store a currency code per expense and refuse to add amounts of different currencies together.',
  ],
  solution: {
    files: { 'main.py': MAIN, 'app.py': APP, 'expense.py': EXPENSE, 'storage.py': STORAGE, 'reports.py': REPORTS, 'expenses.csv': EXPENSES_CSV, 'budgets.json': BUDGETS_JSON },
    explanation: [
      py`The finished tracker keeps every concern in its own module:`,
      py`- **\`expense.py\`** — a frozen, ordered \`Expense\` dataclass with a computed \`month\` property, \`to_row()\` for files and the \`from_row()\` alternative constructor. \`parse_date\` (with an injectable \`today\`), \`parse_amount\` (string → \`Decimal\`, translating \`InvalidOperation\`, rejecting non-finite, non-positive and sub-cent values, quantizing to cents) and \`parse_expense\` make sure **only valid expenses can exist**.
- **\`storage.py\`** — \`DictReader\`/\`DictWriter\` with \`newline=""\`; missing files mean "no data yet"; bad rows raise \`ValueError\` with \`line N\`; appends write the header only for a new file; budgets and the export use JSON with amounts as strings.
- **\`reports.py\`** — pure functions: exact \`Decimal\` totals with a \`Decimal\` start value, \`defaultdict\` grouping, deliberate ordering, budget warnings checked "over" before "near", and an aligned monthly summary.
- **\`app.py\`** and **\`main.py\`** — the command loop, which turns every \`ValueError\` into an \`Error: …\` line, warns right after an \`add\`, and exits politely at the end of input.`,
      py`Because the clock is injected and the calculations are pure, every rule — down to a full session that writes real files — is covered by deterministic tests.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Computers store \`float\`s in **binary**. Just as 1/3 can't be written exactly in decimal (0.3333…), 1/10 can't be written exactly in binary, so \`0.1\` is stored as the nearest binary fraction. Tiny errors appear when you add such numbers: \`0.1 + 0.2\` prints \`0.30000000000000004\`.`,
      py`\`Decimal\` stores the **decimal digits themselves**, like you would on paper, so \`Decimal("0.1") + Decimal("0.2")\` is exactly \`Decimal("0.3")\`. That's why banks, shops and accounting software use decimal arithmetic (or whole numbers of cents).`,
      { code: py`from decimal import Decimal

print(0.1 + 0.2)                         # 0.30000000000000004
print(Decimal("0.1") + Decimal("0.2"))   # 0.3
print(Decimal(0.1))                      # the float's exact binary value, all 55 digits`, lang: 'python', title: 'see the difference' },
    ],
    technical: [
      py`A \`Decimal\` is a sign, a tuple of digits and an exponent: \`Decimal("12.50").as_tuple()\` is \`DecimalTuple(sign=0, digits=(1, 2, 5, 0), exponent=-2)\`. Arithmetic follows a **context** (\`decimal.getcontext()\`): 28 significant digits by default, rounding \`ROUND_HALF_EVEN\` ("banker's rounding": ties go to the even digit, which avoids an upward bias over many roundings). \`quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)\` picks a rounding explicitly when a business rule demands it.`,
      py`\`Decimal\` keeps **significance**: \`Decimal("1.10") + Decimal("2.20")\` is \`Decimal("3.30")\` (trailing zero kept), and \`Decimal("12.50") == Decimal("12.5")\` is \`True\` even though they print differently.`,
      py`The \`decimal\` module signals problems with its own exception hierarchy rooted at \`DecimalException\` (an \`ArithmeticError\`). \`InvalidOperation\` covers bad conversions and NaN comparisons; with the default context \`Decimal(1) / 0\` raises \`DivisionByZero\`, which also subclasses \`ZeroDivisionError\`.`,
      { callout: 'note', title: 'CPython detail', text: py`Since Python 3.3, CPython's \`decimal\` is implemented in C (the \`_decimal\` module, based on libmpdec), which makes it far faster than the original pure-Python version — still slower than hardware floats, but fast enough for any bookkeeping workload. Other implementations may use the pure-Python fallback \`_pydecimal\`.` },
    ],
    production: [
      py`Many systems store money as an **integer number of minor units** (1250 cents) in databases and APIs, and convert to \`Decimal\` only for display or calculation. Either way, never use floats for money, and always store the **currency** alongside the amount.`,
      py`Appending to a CSV is simple and robust for one user. Editing or deleting rows requires rewriting the file — do that atomically (temporary file + \`os.replace\`). Once several programs or users write at once, move to a database with transactions ([sqlite3](lesson:sql-and-sqlite), [database patterns](lesson:database-patterns)). Keeping all file access inside \`storage.py\` makes that a one-module change.`,
      py`Validate at **every** trust boundary — keyboard, files, APIs — with the same functions. Here \`from_row\` and \`load_budgets\` reuse the parse functions, so a hand-edited file can't smuggle in a negative amount or a fake date. See [input validation](lesson:input-validation).`,
    ],
  },
  mistakes: [
    {
      title: 'Using float for money',
      wrong: { code: py`prices = [19.99, 5.01, 0.10, 0.20]
print(sum(prices))           # 25.300000000000004`, lang: 'python' },
      right: { code: py`from decimal import Decimal

prices = [Decimal("19.99"), Decimal("5.01"), Decimal("0.10"), Decimal("0.20")]
print(sum(prices, Decimal("0.00")))   # 25.30`, lang: 'python' },
      explanation: py`Binary floats can't represent most decimal fractions exactly; the errors are tiny but they show up in totals, comparisons and tests. Use \`Decimal\` built from strings (or integer cents).`,
    },
    {
      title: 'Building a Decimal from a float',
      wrong: { code: py`from decimal import Decimal

print(Decimal(0.1))     # 0.1000000000000000055511151231257827021181583404541015625`, lang: 'python' },
      right: { code: py`from decimal import Decimal

print(Decimal("0.1"))   # 0.1`, lang: 'python' },
      explanation: py`\`Decimal(float)\` faithfully converts the float's *binary* value, error and all. Pass strings — which is what you get from \`input()\`, CSV and JSON-as-strings anyway.`,
    },
    {
      title: 'Catching ValueError around Decimal()',
      wrong: { code: py`from decimal import Decimal

try:
    amount = Decimal("abc")
except ValueError:                 # never matches
    amount = None                  # the program crashes with InvalidOperation instead`, lang: 'python', static: true },
      right: { code: py`from decimal import Decimal, InvalidOperation

try:
    amount = Decimal("abc")
except InvalidOperation:
    amount = None`, lang: 'python' },
      explanation: py`Unlike \`int()\` and \`float()\`, \`Decimal()\` raises \`decimal.InvalidOperation\`, an \`ArithmeticError\`. Catch it, then re-raise a \`ValueError\` so the rest of your program deals with one error type.`,
    },
    {
      title: 'Writing the CSV header on every append',
      wrong: { code: py`import csv

def append_expense(row, path):
    with open(path, "a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["date", "category", "amount", "note"])
        writer.writeheader()          # a header line before EVERY row
        writer.writerow(row)`, lang: 'python' },
      right: { code: py`import csv
from pathlib import Path

def append_expense(row, path):
    is_new = not Path(path).exists() or Path(path).stat().st_size == 0
    with open(path, "a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["date", "category", "amount", "note"])
        if is_new:
            writer.writeheader()
        writer.writerow(row)`, lang: 'python' },
      explanation: py`Every extra header becomes a "row" whose date is the text \`date\` — loading then fails (or worse, a lenient loader skips real data). Write the header only when the file is new or empty.`,
    },
    {
      title: 'Storing dates in a local format',
      wrong: { code: py`dates = ["03/10/2026", "28/09/2026", "15/10/2026"]
print(sorted(dates))   # ['03/10/2026', '15/10/2026', '28/09/2026'] — wrong order`, lang: 'python' },
      right: { code: py`dates = ["2026-10-03", "2026-09-28", "2026-10-15"]
print(sorted(dates))   # ['2026-09-28', '2026-10-03', '2026-10-15']`, lang: 'python' },
      explanation: py`Day-first or month-first strings are ambiguous (3 October or March 10?) and sort incorrectly as text. ISO 8601 (\`YYYY-MM-DD\`) is unambiguous and sorts correctly even as plain strings — store that, display whatever you like.`,
    },
    {
      title: 'json.dumps on Decimals (or converting them to float)',
      wrong: { code: py`import json
from decimal import Decimal

json.dumps({"amount": Decimal("12.50")})
# TypeError: Object of type Decimal is not JSON serializable`, lang: 'python', static: true },
      right: { code: py`import json
from decimal import Decimal

print(json.dumps({"amount": str(Decimal("12.50"))}))   # {"amount": "12.50"}`, lang: 'python' },
      explanation: py`The \`json\` module only knows \`int\`, \`float\`, \`str\`, \`bool\`, \`None\`, lists and dicts. Converting to \`float\` "works" but reintroduces rounding; strings preserve the exact value and the trailing zero.`,
    },
  ],
  debugging: [
    {
      symptom: py`decimal.InvalidOperation: [<class 'decimal.ConversionSyntax'>]`,
      cause: py`\`Decimal()\` was given text that isn't a number — \`"abc"\`, \`"12,50"\` (decimal comma) or \`""\` — and nothing caught \`InvalidOperation\`.`,
      fix: py`Catch \`InvalidOperation\` in \`parse_amount\` and raise \`ValueError\` with a friendly message.`,
    },
    {
      symptom: py`ValueError: Invalid isoformat string: '03/10/2026'`,
      cause: py`\`date.fromisoformat\` only accepts ISO dates (\`2026-10-03\`).`,
      fix: py`Ask for \`YYYY-MM-DD\` and catch the error in \`parse_date\`. If you must accept another format, parse it explicitly with \`datetime.strptime(text, "%d/%m/%Y")\` — and document which one.`,
    },
    {
      symptom: py`KeyError: 'amount' while loading the CSV`,
      cause: py`The header row is missing, misspelled (\`Amount\`, \`amount \`) or the file has a byte-order mark from a spreadsheet program, so the first column is named \`\ufeffdate\`.`,
      fix: py`Check \`reader.fieldnames\` and report missing columns. Open files exported from Excel with \`encoding="utf-8-sig"\`, which removes the BOM.`,
    },
    {
      symptom: py`TypeError: Object of type Decimal is not JSON serializable`,
      cause: py`A \`Decimal\` (or a \`date\`) was passed straight to \`json.dumps\`.`,
      fix: py`Convert to strings first (\`to_row()\`), or pass \`default=str\` to \`json.dumps\`.`,
    },
    {
      symptom: py`Totals print as 25.300000000000004 or 0 instead of 0.00.`,
      cause: py`Amounts are floats somewhere (\`float(row["amount"])\`), or \`sum()\` started from the int \`0\` over an empty list.`,
      fix: py`Parse amounts with \`parse_amount\` everywhere and sum with \`sum(amounts, Decimal("0.00"))\`.`,
    },
    {
      symptom: py`A test about "future dates" passes today and fails next week.`,
      cause: py`The code calls \`date.today()\` internally, so the rule depends on when the test runs.`,
      fix: py`Pass \`today\` as a parameter (as \`parse_date\` and \`app.run\` do) and fix it in tests.`,
    },
  ],
  bestPractices: [
    'Represent money with Decimal built from strings (or integer cents) — never float.',
    'Turn text into typed values (date, Decimal) once, at the boundary, and keep typed objects inside the program.',
    'Translate library exceptions (InvalidOperation) into the one exception type your app handles (ValueError), keeping the cause with "from".',
    'Use ISO 8601 dates in files; they are unambiguous and sort correctly.',
    'Open CSV files with newline="" and encoding="utf-8"; write the header once.',
    'Keep calculations pure and inject "today" so every rule is testable.',
    'Make error messages point at the fix: which field, which line, what format is expected.',
  ],
  useCases: [
    'Personal finance and budgeting tools, shared-flat expense splitters, trip budgets.',
    'Importing bank statement CSVs and categorising transactions.',
    'Invoicing, shop tills and any system where totals must match to the cent.',
    'Small business bookkeeping exports consumed by spreadsheets or accounting software (via JSON/CSV).',
  ],
  comparison: {
    title: 'Ways to represent an amount of money',
    headers: ['', 'float', 'Decimal', 'int (cents)'],
    rows: [
      ['0.10 + 0.20', '0.30000000000000004', 'exactly 0.30', '10 + 20 = 30'],
      ['keeps "12.50" formatting', 'no (12.5)', 'yes', 'no — format when displaying'],
      ['division (split a bill)', 'approximate', 'exact to the context precision, explicit rounding', 'integer division + remainder'],
      ['speed', 'fastest (hardware)', 'slower (fine for bookkeeping)', 'fast'],
      ['in JSON / databases', 'number (lossy for readers)', 'string or DECIMAL column', 'integer — simplest to exchange'],
    ],
    note: py`For this tracker \`Decimal\` is the clearest choice. Payment APIs often use integer minor units. Floats are for measurements and science, not money.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-expense-tracker-q1',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from decimal import Decimal

print(0.1 + 0.2 == 0.3, Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))`,
      answer: 'False True',
      accept: ['False True'],
      explanation: py`The floats \`0.1\` and \`0.2\` are binary approximations whose sum is \`0.30000000000000004\`. Decimals built from strings are exact.`,
    },
    {
      id: 'project-expense-tracker-q2',
      type: 'mcq',
      prompt: 'Which expression gives a Decimal that is **exactly** 0.1?',
      options: [
        { text: 'Decimal(0.1)', why: 'This converts the float 0.1, which is really 0.1000000000000000055511151231257827…' },
        'Decimal("0.1")',
        { text: 'Decimal(1 / 10)', why: '1 / 10 is computed as a float first, so it carries the same binary error.' },
        { text: 'float(Decimal("0.1"))', why: 'That converts back to a float, which cannot hold 0.1 exactly.' },
      ],
      answer: 1,
      explanation: py`Build Decimals from strings (or ints). Text from \`input()\`, CSV files and our JSON is already a string, so this is natural.`,
    },
    {
      id: 'project-expense-tracker-q3',
      type: 'bug',
      prompt: 'Typing `add 2026-10-03 food abc` crashes the app instead of printing an error. Click the line that fails to handle it.',
      code: py`from decimal import Decimal


def parse_amount(text):
    try:
        amount = Decimal(text.strip())
    except ValueError:
        raise ValueError(f"Bad amount '{text}'") from None
    if amount <= 0:
        raise ValueError(f"Bad amount '{text}'")
    return amount`,
      answerLine: 7,
      explanation: py`\`Decimal("abc")\` raises \`decimal.InvalidOperation\`, which is an \`ArithmeticError\`, not a \`ValueError\` — so this \`except\` never runs. Catch \`InvalidOperation\` (imported from \`decimal\`).`,
    },
    {
      id: 'project-expense-tracker-q4',
      type: 'fill',
      prompt: 'Complete the code: parse an ISO date and read a CSV file as dicts.',
      code: py`import csv
import datetime

day = datetime.date.___("2026-10-03")
with open("expenses.csv", newline="", encoding="utf-8") as file:
    for row in csv.___(file):
        print(row["amount"])`,
      answer: [['fromisoformat'], ['DictReader']],
      explanation: py`\`date.fromisoformat\` parses \`YYYY-MM-DD\`; \`csv.DictReader\` yields one dict per row, keyed by the header line.`,
    },
    {
      id: 'project-expense-tracker-q5',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from decimal import Decimal

amounts = [Decimal("12.5"), Decimal("7.50")]
print(sum(amounts, Decimal("0.00")), Decimal("12.5").quantize(Decimal("0.01")))`,
      options: [
        '20.00 12.50',
        { text: '20.0 12.5', why: 'Decimal keeps significance: adding 7.50 (two places) to 0.00 gives a two-place result, and quantize forces two places.' },
        { text: '20 12.50', why: 'The start value 0.00 and 7.50 have two decimal places, so the sum keeps them.' },
        { text: 'TypeError', why: 'sum() works with Decimals when the start value is a Decimal (or an int).' },
      ],
      answer: 0,
      explanation: py`Decimal addition keeps the most decimal places of its operands, so the total is \`20.00\`. \`quantize(Decimal("0.01"))\` rescales \`12.5\` to exactly two places: \`12.50\`.`,
    },
    {
      id: 'project-expense-tracker-q6',
      type: 'mcq',
      prompt: 'Why does `parse_date` take a `today` parameter instead of calling `date.today()` itself?',
      options: [
        { text: 'date.today() does not work inside functions', why: 'It works anywhere — the problem is that its answer changes every day.' },
        'So the "no future dates" rule can be tested with a fixed date, and the caller decides what "today" means',
        { text: 'For speed', why: 'Calling date.today() is cheap; this is about testability.' },
        { text: 'Because frozen dataclasses cannot use the clock', why: 'parse_date is a plain function; the dataclass is unrelated.' },
      ],
      answer: 1,
      explanation: py`Code that reads the clock gives different results on different days, so its tests become flaky. Injecting \`today\` (like injecting the random generator in project 1) makes the behaviour deterministic.`,
    },
    {
      id: 'project-expense-tracker-q7',
      type: 'short',
      prompt: 'Why does the JSON export store amounts as strings like "12.50" instead of numbers?',
      answer: py`json.dumps can't serialise Decimal at all, and converting to float would bring back binary rounding errors — and many JSON readers parse numbers as floats anyway. A string keeps the exact value and the trailing zero; the reader converts it back with Decimal(text).`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-expense-tracker-money-types',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why shouldn\'t you use float for money in Python, and what should you use instead?',
      answer: 'Floats are binary and can\'t represent most decimal fractions exactly, so sums and comparisons drift (0.1 + 0.2 != 0.3). Use decimal.Decimal built from strings, or store integer minor units (cents) and format when displaying.',
      explanation: py`The error per operation is tiny but systematic: totals, equality checks and rounding at .5 boundaries all misbehave. \`Decimal\` stores decimal digits exactly and lets you choose rounding (\`quantize\` with \`ROUND_HALF_UP\` / \`ROUND_HALF_EVEN\`). Integer cents are popular in databases and payment APIs.`,
      code: { lang: 'python', code: py`from decimal import Decimal, ROUND_HALF_UP

print(sum([0.1] * 10) == 1.0)                       # False
print(sum([Decimal("0.1")] * 10) == Decimal("1"))   # True
print(Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))   # 2.68` },
      whyAsked: 'A classic correctness question: it shows whether you understand number representation and its business impact.',
      mistakes: ['Saying "just round at the end"', 'Building Decimals from floats', 'Not mentioning rounding rules or currency'],
      followUps: ['What rounding mode does Decimal use by default?', 'How would you split 10.00 between three people?', 'How do you store money in a database?'],
      modelAnswer: 'Floats are stored in binary, and most decimal fractions like 0.1 have no exact binary representation, so arithmetic accumulates tiny errors — 0.1 plus 0.2 isn\'t equal to 0.3. For money that means totals and comparisons that are off by fractions of a cent. In Python I use decimal.Decimal, always constructed from strings, and quantize to cents with an explicit rounding mode when a business rule requires it. In databases and APIs a common alternative is to store integer minor units, like cents, and only format them for display. Either way I keep the currency next to the amount.',
    },
    {
      id: 'project-expense-tracker-split-bill',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `split_bill(total, people)` that splits a `Decimal` total (with at most 2 decimal places) into `people` shares of whole cents. The shares must add up **exactly** to the total, differ by at most 0.01, and larger shares come first: `split_bill(Decimal("10.00"), 3)` → `[Decimal("3.34"), Decimal("3.33"), Decimal("3.33")]`. Raise `ValueError` if `people < 1`.',
      answer: 'Work in integer cents: cents = int(total * 100); base, extra = divmod(cents, people). The first `extra` people pay base + 1 cents, the rest pay base. Convert back with Decimal(c) / 100 quantized to 0.01.',
      explanation: py`Dividing 10.00 by 3 gives 3.333…; rounding every share to 3.33 loses a cent, and rounding up to 3.34 gains two. Distributing the **remainder** cent by cent guarantees the shares add up exactly — the same "largest remainder" idea used for splitting payments, allocating stock or rounding percentages that must total 100.`,
      starter: { files: { 'main.py': py`from decimal import Decimal


def split_bill(total, people):
    """Split total into people shares of whole cents that add up exactly."""
    # TODO
    return []


print(split_bill(Decimal("10.00"), 3))
` } },
      tests: [
        { name: '10.00 between 3 → 3.34, 3.33, 3.33', code: py`from decimal import Decimal
assert split_bill(Decimal("10.00"), 3) == [Decimal("3.34"), Decimal("3.33"), Decimal("3.33")]` },
        { name: 'shares always add up exactly and differ by at most a cent', code: py`from decimal import Decimal
for total, people in [(Decimal("0.05"), 3), (Decimal("100.01"), 7), (Decimal("12.50"), 1), (Decimal("0.00"), 4)]:
    shares = split_bill(total, people)
    assert len(shares) == people
    assert sum(shares, Decimal("0.00")) == total
    assert max(shares) - min(shares) <= Decimal("0.01")
    assert shares == sorted(shares, reverse=True)` },
        { name: 'people < 1 raises ValueError', code: py`from decimal import Decimal
with raises(ValueError):
    split_bill(Decimal("10.00"), 0)` },
      ],
      solution: { files: { 'main.py': py`from decimal import Decimal

CENT = Decimal("0.01")


def split_bill(total, people):
    """Split total into people shares of whole cents that add up exactly."""
    if people < 1:
        raise ValueError("people must be at least 1")
    cents = int(total * 100)
    base, extra = divmod(cents, people)
    shares = [base + 1] * extra + [base] * (people - extra)
    return [(Decimal(share) / 100).quantize(CENT) for share in shares]


print(split_bill(Decimal("10.00"), 3))
` } },
      hints: ['Convert to whole cents first: int(total * 100).', 'divmod(cents, people) gives the base share and how many cents are left over.', 'Give one extra cent to the first `extra` people, then convert each share back with Decimal(c) / 100 and quantize(Decimal("0.01")).'],
      whyAsked: 'Tests exact-arithmetic thinking: naive rounding makes the parts not add up to the whole, a real bug in billing systems.',
      mistakes: ['Rounding total / people and multiplying back', 'Using floats', 'Forgetting that the remainder can be up to people - 1 cents'],
      followUps: ['How would you split by weights (e.g. 50% / 30% / 20%)?', 'Who should get the extra cents — and is that fair?', 'How would you handle currencies without cents?'],
      modelAnswer: 'I convert the total to integer cents so the problem becomes integer division. divmod gives the base share and the remainder; the remainder is fewer cents than there are people, so I give one extra cent to that many people — the first ones, to satisfy the ordering — and the base to everyone else. Converting each share back with Decimal divided by 100 and quantized to cents gives exact values whose sum equals the original total by construction. Rounding each share of total divided by people independently would lose or invent cents.',
    },
    {
      id: 'project-expense-tracker-excel-csv',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A user edits expenses.csv in a spreadsheet program and saves it. Now the tracker refuses to start: "line 1: …" or KeyError: \'date\'. What probably happened, and how do you make loading robust without accepting bad data?',
      answer: 'Spreadsheet programs often add a UTF-8 byte-order mark (so the first header is "\\ufeffdate"), reformat dates to a local style (03/10/2026), add thousands separators or change line endings. Open with encoding="utf-8-sig", check the header and report missing columns, validate every row with the same parser and report the line number, and document the expected formats.',
      explanation: py`Robust doesn't mean lenient. Strip what is harmless and unambiguous (a BOM, surrounding spaces, \`\r\n\` vs \`\n\` — the \`csv\` module handles line endings), but reject what is ambiguous (\`03/10/2026\`) with a message that names the line and the expected format. A "repair" command that converts a known local format explicitly is better than guessing during every load.`,
      whyAsked: 'Real-world file handling is mostly about data that is almost right; the answer shows judgement about strictness and user experience.',
      mistakes: ['Silently skipping bad rows (data loss nobody notices)', 'Guessing date formats', 'Catching every exception and starting with an empty list'],
      followUps: ['What is a BOM?', 'How would you write a migration that rewrites the file in ISO format?', 'Should you ever skip invalid rows?'],
      modelAnswer: 'Spreadsheet programs commonly save UTF-8 with a byte-order mark, so the first column header becomes "\\ufeffdate" and lookups by "date" fail; they also reformat dates into the local style and sometimes amounts with thousands separators. I would open the file with encoding="utf-8-sig" to drop a BOM, check the header and report any missing columns by name, and validate every row through the same parse functions, raising an error that names the line and the expected format. I would not guess ambiguous formats like 03/10/2026 or silently skip bad rows; if users need it, I would add an explicit import or repair command for a specific spreadsheet format.',
    },
    {
      id: 'project-expense-tracker-record-type',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Why model an expense as a frozen dataclass rather than a dict or a NamedTuple?',
      answer: 'A dataclass gives named, typed fields, a generated __init__/__repr__/__eq__, optional ordering, and room for methods and properties (month, to_row, from_row). frozen=True makes recorded facts immutable and hashable. A dict has no fixed fields (typos become new keys) and no methods; a NamedTuple is also immutable but is a tuple — it unpacks, indexes and compares equal to plain tuples, and adding behaviour is less natural.',
      explanation: py`Dicts are great at the file boundary (\`DictReader\` rows, JSON) but weak as domain objects: \`expense["ammount"]\` is a runtime \`KeyError\`, while \`expense.ammount\` on a dataclass is caught by type checkers and linters. NamedTuples are lighter and also immutable, but their tuple behaviour (\`len()\`, indexing, \`==\` with any tuple of the same values) can surprise. See [records & slots](lesson:records-and-slots).`,
      whyAsked: 'Choosing data representations is a core design skill; the answer shows awareness of trade-offs, not just syntax.',
      mistakes: ['"Dataclasses are faster" (not the point)', 'Ignoring immutability', 'Forgetting that a frozen dataclass can still hold mutable fields like lists'],
      followUps: ['How do you "change" a frozen instance? (dataclasses.replace)', 'What does order=True compare?', 'When would you add slots=True (3.10+)?'],
      modelAnswer: 'I want an expense to be a well-defined record, so a dataclass fits: named, type-annotated fields, a generated constructor, repr and equality, and a natural home for behaviour like the month property and the to_row and from_row conversions. Making it frozen says an expense is a recorded fact — you replace it rather than mutate it — and makes it hashable. order=True gives me chronological sorting because date is the first field. A dict would let typos create new keys and has no methods; a NamedTuple would also be immutable, but it behaves like a tuple, which I don\'t need here.',
    },
    {
      id: 'project-expense-tracker-storage-boundary',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'The tracker becomes popular: a family wants to share one tracker from several phones. What changes, and how does the current module structure help?',
      answer: 'A shared CSV file can\'t handle concurrent writers or edits safely, so storage moves to a database (SQLite for one machine, a server database behind an API for many devices). Because all file access lives in storage.py behind functions like load_expenses and append_expense, those can be reimplemented against the database while expense.py validation and reports.py calculations stay unchanged; app.py becomes one of several front ends.',
      explanation: py`This is the repository idea from [database patterns](lesson:database-patterns) and [clean architecture](lesson:clean-architecture): the domain (Expense, validation, reports) doesn't know where data lives. New concerns appear with multiple users — authentication, per-user or per-household data, concurrent edits (transactions, optimistic locking), syncing offline phones — and the reports may move into SQL (\`GROUP BY category\`) for speed on large data.`,
      whyAsked: 'Evaluates whether you can evolve a small design under new requirements and see which parts are stable.',
      mistakes: ['Proposing to keep a shared CSV on a network drive', 'Rewriting everything instead of swapping the storage layer', 'Ignoring concurrency and authentication'],
      followUps: ['What would the database schema look like?', 'Where would you validate data now — client, server or both?', 'How would you migrate existing CSV files?'],
      modelAnswer: 'A CSV file works for one person on one machine, but several devices writing at once would lose or corrupt data, so storage has to become a database — SQLite if it stays on one server, behind a small HTTP API so the phones never touch it directly. The good news is that storage.py is already the only module that knows about files: I would reimplement load, append and export against the database with transactions, and expense.py\'s validation and reports.py\'s calculations wouldn\'t change. The new work is around the edges — authentication, scoping data to a household, handling concurrent edits, and a one-off migration of existing CSV files through the same parse functions.',
    },
  ],

  takeaways: [
    'Never use float for money: build Decimal from strings, quantize to cents, and sum with a Decimal start value.',
    'Decimal() raises InvalidOperation (not ValueError) — translate it so the app handles one exception type.',
    'A frozen, ordered dataclass makes a clean record: typed fields, immutability, chronological sorting, methods like to_row/from_row.',
    'Validate text once at every boundary (keyboard, CSV, JSON) with the same functions; report the line number for bad file rows.',
    'CSV for append-only tabular storage (newline="", header once), JSON for mappings and exports (amounts as strings).',
    'Group with defaultdict, order results deliberately, and inject "today" so date rules are testable.',
  ],
}
