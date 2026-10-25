// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const DB_PY = py`"""Connection setup, plus two measuring tools: a query counter and a plan viewer."""
import sqlite3
from contextlib import contextmanager

SCHEMA = """
CREATE TABLE customers (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE TABLE products (
    sku   TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    stock INTEGER NOT NULL CHECK (stock >= 0)
);
CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers (id),
    sku         TEXT NOT NULL REFERENCES products (sku),
    quantity    INTEGER NOT NULL
);
INSERT INTO customers (name) VALUES ('Ada'), ('Ben'), ('Cy');
INSERT INTO products (sku, name, stock) VALUES ('dune', 'Dune', 5), ('emma', 'Emma', 2);
"""


def connect():
    """A fresh in-memory shop database with foreign keys switched on."""
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")    # SQLite leaves them off by default
    conn.executescript(SCHEMA)
    return conn


@contextmanager
def count_queries(conn):
    """Record every SQL statement the connection runs inside the with block."""
    statements = []
    conn.set_trace_callback(statements.append)
    try:
        yield statements
    finally:
        conn.set_trace_callback(None)


def query_plan(conn, sql, params=()):
    """SQLite's plan for a query, e.g. 'SCAN orders'. sql must be trusted code."""
    rows = conn.execute("EXPLAIN QUERY PLAN " + sql, params).fetchall()
    return " | ".join(row[3] for row in rows)
`

const REPOSITORY_PY = py`"""Two interchangeable repositories: the same methods, different storage."""
import sqlite3
from contextlib import contextmanager


class OrderError(Exception):
    """An order broke a business rule (no stock, unknown customer, ...)."""


class SqliteShopRepository:
    """The real one: every SQL statement about the shop lives in this class."""

    def __init__(self, conn):
        self.conn = conn

    def transaction(self):
        # A sqlite3 connection is a context manager:
        # COMMIT when the block finishes, ROLLBACK if it raises.
        return self.conn

    def stock_of(self, sku):
        row = self.conn.execute(
            "SELECT stock FROM products WHERE sku = ?", (sku,)
        ).fetchone()
        return row[0] if row else None

    def take_stock(self, sku, quantity):
        """Remove stock in ONE atomic statement. False if there isn't enough."""
        cur = self.conn.execute(
            "UPDATE products SET stock = stock - ? WHERE sku = ? AND stock >= ?",
            (quantity, sku, quantity),
        )
        return cur.rowcount == 1

    def add_order(self, customer_id, sku, quantity):
        try:
            cur = self.conn.execute(
                "INSERT INTO orders (customer_id, sku, quantity) VALUES (?, ?, ?)",
                (customer_id, sku, quantity),
            )
        except sqlite3.IntegrityError as exc:
            raise OrderError(f"order rejected: {exc}") from exc
        return cur.lastrowid


class InMemoryShopRepository:
    """A fake for fast tests: a dict and a list, no SQL at all."""

    def __init__(self, stock, customer_ids):
        self.stock = dict(stock)                 # sku -> units on the shelf
        self.customer_ids = set(customer_ids)
        self.orders = []

    @contextmanager
    def transaction(self):
        yield    # BUG: if the block raises, nothing is undone

    def stock_of(self, sku):
        return self.stock.get(sku)

    def take_stock(self, sku, quantity):
        if self.stock.get(sku, 0) < quantity:
            return False
        self.stock[sku] -= quantity
        return True

    def add_order(self, customer_id, sku, quantity):
        if customer_id not in self.customer_ids:
            raise OrderError("order rejected: unknown customer")
        self.orders.append((customer_id, sku, quantity))
        return len(self.orders)
`

const SHOP_MAIN = py`from db import connect, count_queries, query_plan
from repository import InMemoryShopRepository, OrderError, SqliteShopRepository


def place_order(repo, customer_id, sku, quantity):
    """Business rules only. It never sees SQL, so any repository will do."""
    with repo.transaction():                     # all of it, or none of it
        if not repo.take_stock(sku, quantity):
            raise OrderError(f"not enough {sku} in stock")
        return repo.add_order(customer_id, sku, quantity)


def check_contract(repo):
    """The same checks for every repository. Returns a list of problems."""
    problems = []
    place_order(repo, 1, "dune", 2)
    if repo.stock_of("dune") != 3:
        problems.append("a good order must take 2 from stock")
    try:
        place_order(repo, 99, "dune", 1)         # customer 99 doesn't exist
    except OrderError:
        pass
    if repo.stock_of("dune") != 3:
        problems.append("a failed order must leave the stock alone")
    return problems


def order_lines_n_plus_one(conn):
    lines = []
    for order_id, customer_id, quantity, sku in conn.execute(
        "SELECT id, customer_id, quantity, sku FROM orders ORDER BY id"
    ):
        (name,) = conn.execute(              # one extra query per order!
            "SELECT name FROM customers WHERE id = ?", (customer_id,)
        ).fetchone()
        lines.append(f"#{order_id} {name}: {quantity} x {sku}")
    return lines


def order_lines_join(conn):
    rows = conn.execute("""
        SELECT orders.id, customers.name, orders.quantity, orders.sku
        FROM orders
        JOIN customers ON customers.id = orders.customer_id
        ORDER BY orders.id
    """)
    return [f"#{oid} {name}: {qty} x {sku}" for oid, name, qty, sku in rows]


print("== 1. A transaction: all or nothing ==")
conn = connect()
shop = SqliteShopRepository(conn)
order_id = place_order(shop, 1, "dune", 2)
print(f"order {order_id} placed, Dune stock: {shop.stock_of('dune')}")
try:
    place_order(shop, 99, "dune", 1)
except OrderError as exc:
    print("failed:", exc)
print("after the failed order, Dune stock:", shop.stock_of("dune"))

print("\n== 2. One contract, two repositories ==")
fake = InMemoryShopRepository({"dune": 5, "emma": 2}, customer_ids={1, 2, 3})
for repo in (SqliteShopRepository(connect()), fake):
    problems = check_contract(repo)
    status = "OK" if not problems else "FAIL: " + "; ".join(problems)
    print(f"{type(repo).__name__:<24} {status}")

print("\n== 3. Counting queries: the N+1 problem ==")
for customer_id, sku in [(2, "emma"), (3, "dune"), (1, "emma")]:
    place_order(shop, customer_id, sku, 1)
for report in (order_lines_n_plus_one, order_lines_join):
    with count_queries(conn) as queries:
        lines = report(conn)
    print(f"{report.__name__:<22} queries run: {len(queries)}")
print(*lines, sep="\n")

print("\n== 4. An index changes the plan ==")
by_customer = "SELECT id, quantity FROM orders WHERE customer_id = ?"
print("before:", query_plan(conn, by_customer, (1,)))
conn.execute("CREATE INDEX idx_orders_customer ON orders (customer_id)")
print("after: ", query_plan(conn, by_customer, (1,)))
`

const MIGRATIONS_MAIN = py`"""A tiny migration runner: the core idea behind tools like Alembic (simplified)."""
import sqlite3

# (version, description, statements). Never edit a migration that has run
# somewhere real; add a new one instead.
MIGRATIONS = [
    (1, "create customers", [
        "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL)",
    ]),
    (2, "add email + unique index", [
        "ALTER TABLE customers ADD COLUMN email TEXT",
        "CREATE UNIQUE INDEX idx_customers_email ON customers (email)",
    ]),
]


def schema_version(conn):
    return conn.execute("PRAGMA user_version").fetchone()[0]


def migrate(conn, migrations):
    """Apply every migration newer than the database, each in its own transaction."""
    for version, description, statements in migrations:
        if version <= schema_version(conn):
            continue                              # already applied: skip it
        with conn:                                # COMMIT, or ROLLBACK on error
            conn.execute("BEGIN")                 # sqlite3 won't BEGIN for DDL by itself
            for sql in statements:
                conn.execute(sql)
            conn.execute(f"PRAGMA user_version = {int(version)}")  # PRAGMA takes no ? values
        print(f"applied {version}: {description}")


def columns(conn, table):
    # Table names can't be placeholders: only ever pass names from your own code.
    return [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]


conn = sqlite3.connect(":memory:")
print("start at version", schema_version(conn))
migrate(conn, MIGRATIONS)
print("now at version", schema_version(conn), "| columns:", columns(conn, "customers"))

print("\nRunning again applies nothing:")
migrate(conn, MIGRATIONS)
print("still version", schema_version(conn))

print("\nA broken migration (its second statement has a typo):")
broken = MIGRATIONS + [(3, "add phone + index", [
    "ALTER TABLE customers ADD COLUMN phone TEXT",
    "CREATE INDEX idx_customers_phone ON customer (phone)",
])]
try:
    migrate(conn, broken)
except sqlite3.OperationalError as exc:
    print("migration 3 failed:", exc)
print("version", schema_version(conn), "| columns:", columns(conn, "customers"))
`

const SQLALCHEMY_MODELS = py`from sqlalchemy import ForeignKey, String, create_engine, select
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload,
)


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    sku: Mapped[str] = mapped_column(String(40))
    quantity: Mapped[int]                       # NOT NULL, type taken from the hint
    customer: Mapped["Customer"] = relationship(back_populates="orders")


engine = create_engine("sqlite:///shop.db", echo=True)   # echo=True logs every SQL statement
Base.metadata.create_all(engine)                          # fine for demos; use migrations for real apps

# Unit of work: everything inside session.begin() commits together, or rolls back.
with Session(engine) as session, session.begin():
    ada = Customer(name="Ada")
    session.add(ada)
    session.add(Order(customer=ada, sku="dune", quantity=2))

with Session(engine) as session:
    stmt = select(Customer).where(Customer.name == "Ada")
    ada = session.scalars(stmt).one()
    print(ada.name, [o.sku for o in ada.orders])          # lazy load: a 2nd query runs here

    # Avoid N+1: load every customer's orders in ONE extra query (WHERE customer_id IN ...)
    stmt = select(Customer).options(selectinload(Customer.orders)).order_by(Customer.name)
    for customer in session.scalars(stmt):
        print(customer.name, len(customer.orders))`

const SQLALCHEMY_REPO = py`from sqlalchemy import select
from sqlalchemy.orm import Session


class SqlAlchemyCustomerRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, customer_id: int) -> Customer | None:
        return self.session.get(Customer, customer_id)

    def by_name(self, name: str) -> list[Customer]:
        stmt = select(Customer).where(Customer.name == name).order_by(Customer.id)
        return list(self.session.scalars(stmt))

    def add(self, customer: Customer) -> None:
        self.session.add(customer)          # the caller decides when to commit`

const ALEMBIC_CLI = py`pip install alembic
alembic init migrations                          # creates alembic.ini + migrations/env.py
alembic revision --autogenerate -m "add order status"   # diff models vs database -> new file
alembic upgrade head                             # apply everything not yet applied
alembic current                                  # which revision is this database at?
alembic history                                  # list revisions in order
alembic downgrade -1                             # undo the most recent revision`

const ALEMBIC_MIGRATION = py`"""add order status

Revision ID: 3f2a1c9d8e7b
Revises: 1a2b3c4d5e6f
"""
import sqlalchemy as sa
from alembic import op

revision = "3f2a1c9d8e7b"
down_revision = "1a2b3c4d5e6f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("status", sa.String(20), nullable=False, server_default="new"),
    )
    op.create_index("ix_orders_status", "orders", ["status"])


def downgrade() -> None:
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_column("orders", "status")`

export default {
  id: 'database-patterns',
  title: 'Transactions, repositories, ORMs & migrations',
  summary: 'Keep data correct and code changeable: all-or-nothing transactions, a repository you can swap for a fake, no N+1 queries, the right indexes, and schema changes managed as versioned migrations.',
  difficulty: 'advanced',
  minutes: 75,
  prerequisites: ['sql-and-sqlite', 'context-managers', 'classes-and-objects', 'testing-fundamentals'],
  related: ['sql-and-sqlite', 'contextlib', 'dataclasses', 'protocols', 'mocking', 'fixtures', 'clean-architecture', 'design-patterns', 'injection-attacks', 'performance', 'profiling', 'building-apis', 'project-library-api', 'project-production-service'],
  tags: ['transaction', 'acid', 'atomicity', 'isolation', 'durability', 'commit', 'rollback', 'repository pattern', 'unit of work', 'fake', 'contract test', 'connection management', 'connection pool', 'n+1', 'query count', 'index', 'create index', 'explain query plan', 'composite index', 'lost update', 'optimistic locking', 'orm', 'sqlalchemy', 'declarativebase', 'mapped_column', 'session', 'selectinload', 'alembic', 'migrations', 'schema version'],
  apis: [
    { name: 'with conn: (sqlite3)', summary: 'Runs the block as one transaction: COMMIT on success, ROLLBACK if it raises. Does not close the connection.' },
    { name: 'Connection.commit() / rollback()', summary: 'Make the pending changes permanent, or throw them all away.' },
    { name: 'Connection.in_transaction', summary: 'True while a transaction is open and changes are still pending.' },
    { name: 'Connection.set_trace_callback(fn)', summary: 'Calls fn(sql) for every statement the connection runs; None turns it off. Handy for counting queries.' },
    { name: 'Cursor.rowcount', summary: 'How many rows the last INSERT/UPDATE/DELETE changed — the way to check a conditional UPDATE worked.' },
    { name: 'CREATE INDEX name ON table (col, ...)', summary: 'Builds a sorted lookup structure (a B-tree) so WHERE/ORDER BY on those columns can avoid scanning every row.' },
    { name: 'EXPLAIN QUERY PLAN <query>', summary: 'Shows how SQLite will run a query: SCAN (read everything) or SEARCH ... USING INDEX.' },
    { name: 'PRAGMA user_version', summary: 'A free integer stored in the SQLite file header — a simple place to record the schema version.' },
    { name: 'sqlalchemy.orm.DeclarativeBase', summary: 'Base class for SQLAlchemy 2.0 ORM models.' },
    { name: 'Mapped[...] / mapped_column()', summary: 'Declare typed ORM columns in SQLAlchemy 2.0.' },
    { name: 'sqlalchemy.select()', summary: 'Builds a SELECT; run it with session.scalars(stmt) or session.execute(stmt).' },
    { name: 'sqlalchemy.orm.Session', summary: 'The ORM unit of work: tracks objects, flushes changes and commits them in one transaction.' },
    { name: 'selectinload() / joinedload()', summary: 'Eager-loading options that load related objects up front, avoiding N+1 queries.' },
    { name: 'alembic upgrade head', summary: 'Apply every migration the database has not seen yet.' },
  ],
  docs: [
    { label: 'sqlite3 — transaction control', url: 'https://docs.python.org/3/library/sqlite3.html#sqlite3-controlling-transactions' },
    { label: 'PEP 249 — Python Database API Specification v2.0', url: 'https://peps.python.org/pep-0249/' },
    { label: 'SQLite — EXPLAIN QUERY PLAN', url: 'https://www.sqlite.org/eqp.html' },
    { label: 'SQLite — query planning and indexes', url: 'https://www.sqlite.org/queryplanner.html' },
    { label: 'SQLite — isolation', url: 'https://www.sqlite.org/isolation.html' },
    { label: 'SQLAlchemy 2.0 — ORM quick start', url: 'https://docs.sqlalchemy.org/en/20/orm/quickstart.html' },
    { label: 'Alembic — tutorial', url: 'https://alembic.sqlalchemy.org/en/latest/tutorial.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [SQL & sqlite3](lesson:sql-and-sqlite) you learned to *talk* to a database. This lesson is about using one **well** in a real program — the patterns that keep data correct when things fail, keep code testable as it grows, and keep queries fast when tables get big.`,
    py`Six ideas, each solving a real problem:`,
    py`1. **Transactions** — a group of changes that happens *completely or not at all*. The guarantees behind them are called **ACID**.
2. **The repository pattern** — one class that owns all the SQL for a part of your app, so the rest of the code asks for "orders for Ada", never for \`SELECT ... JOIN ...\`. Tests can swap it for an in-memory **fake**.
3. **Connection management** — opening, sharing, committing and closing connections deliberately.
4. **The N+1 query problem** — the most common reason database code is slow, and how to *measure* it by counting queries.
5. **Indexes** — what \`CREATE INDEX\` does, and how \`EXPLAIN QUERY PLAN\` proves it's being used.
6. **ORMs and migrations** — SQLAlchemy, which maps tables to Python classes, and Alembic, which manages schema changes as numbered, reviewable steps.`,
    py`Everything SQLite-based here runs live in the playground. SQLAlchemy and Alembic are third-party packages that aren't installed in the browser, so they're shown as static code with their real, current APIs.`,
  ],
  why: [
    py`Programs crash, networks drop and users double-click. If "take 2 books off the shelf" succeeds but "record the order" fails, your shop now has missing stock and no order — and nobody knows why. Transactions make that half-finished state impossible.`,
    py`Code that sprinkles SQL everywhere is hard to change and hard to test: every test needs a database with exactly the right rows. Putting SQL behind a repository gives you one place to change queries and a seam where a fast fake can stand in.`,
    py`Databases are fast; *round trips* to them are not. A page that runs one query per row is fine with 5 rows in development and painfully slow with 5,000 in production. Counting queries and reading query plans turns "it feels slow" into a fix.`,
    py`Finally, your schema will change — new columns, new tables, new indexes — on every copy of the database: your laptop, your teammate's, CI and production. Migrations make those changes repeatable instead of a list of SQL commands someone ran by hand once.`,
  ],
  eli15: [
    py`Imagine swapping trading cards with a friend. The deal is: you give your card **and** they give theirs. If your friend changes their mind halfway through, you get your card back — no half-swaps. That promise is a **transaction**.`,
    py`Now imagine a school library. You don't walk into the back room and dig through boxes yourself — you ask the librarian at the desk, "any books by Ursula Le Guin?". The librarian is a **repository**: you ask for *what* you want, they know *where* it is. For practice, a classmate can play librarian with a few books on a table — that's a **fake**.`,
    py`If you ask the librarian for 30 books *one trip at a time*, it takes forever. Hand over the whole list in one go and it's one trip. Asking one at a time is the **N+1 problem**.`,
    py`And the librarian finds books quickly because the catalogue is sorted by author — that sorted catalogue is an **index**. When the library rearranges its shelves, it follows a numbered renovation plan and ticks off each step in a logbook — that's a **migration**.`,
  ],
  analogy: {
    title: 'A well-run library',
    body: [
      py`A good library keeps two promises at once: books are never "half lent" (the book leaves the shelf *and* your card records it, or neither happens), and you never need to know how the stacks are organised to get what you want.`,
      py`Behind the desk it relies on a catalogue sorted by author and title so nobody walks every shelf, it batches requests instead of making one trip per book, and when it reorganises it follows numbered plans so every branch ends up identical.`,
    ],
    mapping: [
      ['lending a book: shelf and library card updated together', 'a transaction: several writes that commit or roll back as one'],
      ['the librarian at the front desk', 'a repository: one class that owns the queries'],
      ['a classmate playing librarian for practice', 'an in-memory fake repository used in tests'],
      ['one trip to the stacks per book on your list', 'the N+1 problem: one query per row'],
      ['bringing the whole list in one trip', 'a JOIN, an IN (...) query, or ORM eager loading'],
      ['the catalogue sorted by author', 'an index on the author column'],
      ['the renovation plan with numbered, ticked-off steps', 'migrations plus a recorded schema version'],
      ['a translator who speaks "librarian" for you', 'an ORM turning Python objects into SQL'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'One transaction: COMMIT or ROLLBACK',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'place_order()', note: 'your code', x: 90, y: 160, tone: 'yellow' },
        { id: 'begin', label: 'BEGIN', note: 'start the group', x: 235, y: 160, tone: 'ink' },
        { id: 'w1', label: 'UPDATE products', note: 'stock 5 → 3 (pending)', x: 400, y: 70 },
        { id: 'w2', label: 'INSERT INTO orders', note: 'pending', x: 400, y: 250 },
        { id: 'commit', label: 'COMMIT', note: 'both made permanent', x: 580, y: 70, tone: 'blue' },
        { id: 'rollback', label: 'ROLLBACK', note: 'both undone', x: 580, y: 250, tone: 'red' },
        { id: 'db', label: 'database', note: 'never half-updated', x: 700, y: 160, tone: 'kraft' },
      ],
      edges: [
        { from: 'app', to: 'begin', label: 'with conn:' },
        { from: 'begin', to: 'w1' },
        { from: 'w1', to: 'w2' },
        { from: 'w2', to: 'commit', label: 'success' },
        { from: 'w2', to: 'rollback', label: 'error', dashed: true },
        { from: 'commit', to: 'db' },
        { from: 'rollback', to: 'db', dashed: true },
      ],
      steps: [
        { focus: ['app', 'begin'], edges: ['app->begin'], text: py`Entering \`with conn:\` — or running the first \`INSERT\`/\`UPDATE\` — makes sqlite3 send \`BEGIN\`. From now on, changes are *pending*: visible to this connection, invisible to everyone else, and not yet safe on disk.` },
        { focus: ['w1'], edges: ['begin->w1'], text: py`The stock goes from 5 to 3. Before SQLite changes a page of the file, it records enough information to **undo** that change (in a *rollback journal*, or a *write-ahead log* in WAL mode).` },
        { focus: ['w2'], edges: ['w1->w2'], text: py`The second write records the order. This one might fail — an unknown customer breaks a \`FOREIGN KEY\` constraint, a \`CHECK\` fails, the disk is full, the program crashes.` },
        { focus: ['commit', 'db'], edges: ['w2->commit', 'commit->db'], text: py`**Success:** leaving the \`with\` block sends \`COMMIT\`. Both changes become permanent at the same instant, and other connections can now see them.` },
        { focus: ['rollback', 'db'], edges: ['w2->rollback', 'rollback->db'], text: py`**Failure:** an exception sends \`ROLLBACK\`. The stock change is undone too — the database looks exactly as if \`place_order()\` never ran. Then the exception carries on so your code can report it.` },
      ],
    },
    alt: 'A flow diagram. place_order() enters "with conn:", which sends BEGIN. Two pending writes follow: UPDATE products (stock 5 to 3) and INSERT INTO orders. From the insert, a solid "success" arrow leads to COMMIT, which makes both permanent in the database, and a dashed "error" arrow leads to ROLLBACK, which undoes both, so the database is never half-updated.',
    caption: py`A transaction turns several statements into one all-or-nothing step.`,
  },
  syntax: [
    py`#### Transactions with sqlite3`,
    { code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE accounts (name TEXT PRIMARY KEY, points INTEGER CHECK (points >= 0))")
conn.executemany("INSERT INTO accounts VALUES (?, ?)", [("Ada", 50), ("Ben", 10)])
conn.commit()

try:
    with conn:                                   # BEGIN ... COMMIT / ROLLBACK
        conn.execute("UPDATE accounts SET points = points + 80 WHERE name = 'Ben'")
        conn.execute("UPDATE accounts SET points = points - 80 WHERE name = 'Ada'")  # CHECK fails
except sqlite3.IntegrityError as exc:
    print("rolled back:", exc)                   # rolled back: CHECK constraint failed: points >= 0

print(conn.execute("SELECT * FROM accounts ORDER BY name").fetchall())   # [('Ada', 50), ('Ben', 10)]`, lang: 'python', title: 'the rollback undoes the first UPDATE too' },
    py`- \`with conn:\` **commits** when the block ends normally and **rolls back** when it raises, then re-raises. It does *not* close the connection.
- By default, sqlite3 sends \`BEGIN\` automatically before the first \`INSERT\`/\`UPDATE\`/\`DELETE\`/\`REPLACE\`. Schema statements (\`CREATE\`, \`ALTER\`) don't open one, so send \`BEGIN\` yourself when DDL must be atomic.
- \`conn.in_transaction\` tells you whether changes are still pending.`,
    { callout: 'version', title: 'Python 3.12+: autocommit', text: py`Python 3.12 added \`sqlite3.connect(..., autocommit=False)\`, which follows PEP 249 strictly: a transaction is *always* open, and \`commit()\`/\`rollback()\` immediately start the next one — DDL included. The default is still the older behaviour (\`autocommit=sqlite3.LEGACY_TRANSACTION_CONTROL\`), which is what this lesson's code uses so it runs on 3.10+.` },
    py`#### The repository pattern`,
    { code: py`class SqliteShopRepository:
    def __init__(self, conn):
        self.conn = conn

    def transaction(self):
        return self.conn                     # the connection is the transaction context

    def stock_of(self, sku):
        row = self.conn.execute("SELECT stock FROM products WHERE sku = ?", (sku,)).fetchone()
        return row[0] if row else None


def place_order(repo, customer_id, sku, quantity):   # business logic: no SQL in sight
    with repo.transaction():
        ...`, lang: 'python', title: 'shape of a repository' },
    py`A **repository** is a class with domain-flavoured methods (\`stock_of\`, \`take_stock\`, \`add_order\`) that hide *how* data is stored. The service code receives a repository as a parameter — this is *dependency injection*: the caller decides which implementation to pass in. Tests pass an \`InMemoryShopRepository\` with the same methods; production passes the SQLite one. Python's duck typing makes this work with no base class, though a [Protocol](lesson:protocols) documents the contract for type checkers.`,
    py`#### Counting queries`,
    { code: py`statements = []
conn.set_trace_callback(statements.append)   # called with the SQL of every statement
report = order_lines(conn)
conn.set_trace_callback(None)
print(len(statements), "queries")`, lang: 'python', title: 'measure before guessing', static: true },
    py`#### Indexes and query plans`,
    { code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, total INTEGER)")
query = "SELECT id, total FROM orders WHERE customer_id = ?"

print(conn.execute("EXPLAIN QUERY PLAN " + query, (1,)).fetchall())
# [(2, 0, 0, 'SCAN orders')]  -> read every row

conn.execute("CREATE INDEX idx_orders_customer ON orders (customer_id)")
print(conn.execute("EXPLAIN QUERY PLAN " + query, (1,)).fetchall())
# [(3, 0, 0, 'SEARCH orders USING INDEX idx_orders_customer (customer_id=?)')]`, lang: 'python', title: 'SCAN before, SEARCH after' },
    py`Each row of \`EXPLAIN QUERY PLAN\` is \`(id, parent, notused, detail)\`; the \`detail\` text is what you read. The exact wording is SQLite-specific and has changed between SQLite versions (older ones said \`SCAN TABLE orders\`). PostgreSQL and MySQL have their own \`EXPLAIN\`.`,
    py`| plan says | meaning |
|---|---|
| \`SCAN orders\` | reads every row of the table |
| \`SEARCH orders USING INDEX idx (customer_id=?)\` | jumps straight to matching rows via the index |
| \`... USING COVERING INDEX ...\` | the index alone holds every column the query needs — the table isn't touched |
| \`SEARCH ... USING INTEGER PRIMARY KEY (rowid=?)\` | looked up by primary key |
| \`USE TEMP B-TREE FOR ORDER BY\` | had to sort the results itself — an index on the sort column might avoid that |`,
    py`#### SQLAlchemy 2.0 ORM (static — not installed in the browser)`,
    py`An **ORM** (*object-relational mapper*) maps tables to classes and rows to objects. SQLAlchemy is the most widely used one in Python; version 2.0 introduced the typed \`Mapped[...]\` style shown here.`,
    { code: SQLALCHEMY_MODELS, lang: 'python', title: 'models.py — SQLAlchemy 2.0 (pip install sqlalchemy)', static: true },
    py`- \`DeclarativeBase\` is the base class; each subclass is a table. \`Mapped[int]\` plus \`mapped_column(...)\` declares a column; \`Mapped[str | None]\` would make it nullable.
- \`select(Customer).where(...)\` builds a query; \`session.scalars(stmt)\` runs it and yields \`Customer\` objects. \`.one()\` demands exactly one result.
- The **Session** is a *unit of work*: it tracks new and changed objects and writes them in one transaction when you commit (\`session.commit()\`, or automatically at the end of \`with session.begin():\`).
- Relationships load **lazily** by default — touching \`ada.orders\` runs a query right then. In a loop, that's N+1; \`selectinload()\` or \`joinedload()\` load them up front.`,
    py`#### Migrations with Alembic (static)`,
    py`A **migration** is a small, versioned script that changes the schema from one version to the next — and ideally back. **Alembic** (by the SQLAlchemy authors) stores the current revision id in an \`alembic_version\` table in your database and runs only the migrations that are missing.`,
    { code: ALEMBIC_CLI, lang: 'bash', title: 'the Alembic workflow' },
    { code: ALEMBIC_MIGRATION, lang: 'python', title: 'migrations/versions/3f2a1c9d8e7b_add_order_status.py', static: true },
    { callout: 'warn', title: 'Always read autogenerated migrations', text: py`\`--autogenerate\` compares your models with the database and drafts a migration, but it can't see everything — for example it can't tell a *renamed* column from a dropped column plus a new one, which would lose data. Review every generated file like any other code before running it.` },
  ],
  walkthrough: {
    title: 'Reading the shop program',
    lang: 'python',
    code: SHOP_MAIN,
    intro: py`This is \`main.py\` from the playground. Open **repository.py** and **db.py** there as well — press **Guide** to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 10], text: py`\`place_order\` holds the business rule — "take the stock, then record the order" — and nothing else. It doesn't import sqlite3 or contain SQL; it only calls repository methods. Everything inside \`with repo.transaction():\` commits together or not at all.` },
      { lines: [8, 9], text: py`\`take_stock\` (in repository.py) runs \`UPDATE ... SET stock = stock - ? WHERE sku = ? AND stock >= ?\` — the check and the change in **one** statement, so two simultaneous orders can't both grab the last copy. \`rowcount == 1\` tells us whether it happened.` },
      { lines: [13, 25], text: py`\`check_contract\` is a tiny **contract test**: the same expectations, run against *any* repository. If the fake and the real repository both pass, tests that use the fake are telling the truth.` },
      { lines: [28, 37], text: py`The N+1 version: one query for the orders, then **one more per order** to fetch the customer's name. 4 orders → 5 queries; 4,000 orders → 4,001.` },
      { lines: [40, 47], text: py`The fix: a \`JOIN\` brings orders and names back together in **one** query, whatever the number of orders.` },
      { lines: [53, 59], text: py`Order 1 succeeds (Dune stock 5 → 3). The order for customer 99 takes stock **first**, then the \`INSERT\` breaks the foreign key. The repository turns the \`sqlite3.IntegrityError\` into an \`OrderError\`, the transaction rolls back, and the stock is 3 again — not 2.` },
      { lines: [62, 66], text: py`The same contract runs against both repositories. SQLite passes. The fake **fails**: its \`transaction()\` doesn't undo anything. That's your first experiment.` },
      { lines: [71, 74], text: py`\`count_queries\` (db.py) uses \`set_trace_callback\` to record every SQL statement. Measuring beats guessing: the numbers show the problem immediately.` },
      { lines: [78, 81], text: py`Without an index, finding Ada's orders means a \`SCAN\` of every order. After \`CREATE INDEX\`, the plan becomes a \`SEARCH\` using the index.` },
    ],
  },
  playground: {
    title: 'A small shop: transactions, a swappable repository, N+1 and an index',
    objective: 'Run it, read each section, then fix the fake repository, block bad quantities, upgrade the report and add an index.',
    files: { 'main.py': SHOP_MAIN, 'repository.py': REPOSITORY_PY, 'db.py': DB_PY },
    expected: py`Four sections:

\`\`\`text
== 1. A transaction: all or nothing ==
order 1 placed, Dune stock: 3
failed: order rejected: FOREIGN KEY constraint failed
after the failed order, Dune stock: 3

== 2. One contract, two repositories ==
SqliteShopRepository     OK
InMemoryShopRepository   FAIL: a failed order must leave the stock alone

== 3. Counting queries: the N+1 problem ==
order_lines_n_plus_one queries run: 5
order_lines_join       queries run: 1
#1 Ada: 2 x dune
#2 Ben: 1 x emma
#3 Cy: 1 x dune
#4 Ada: 1 x emma

== 4. An index changes the plan ==
before: SCAN orders
after:  SEARCH orders USING INDEX idx_orders_customer (customer_id=?)
\`\`\`

The **FAIL** in section 2 is deliberate — fixing it is the first experiment.`,
    experiments: [
      {
        id: 'fix-the-fake',
        task: py`In **repository.py**, make \`InMemoryShopRepository.transaction()\` behave like a real transaction: remember the stock and orders before the block runs, and put them back if the block raises (then let the exception continue). Section 2 should print \`OK\` for both repositories.`,
        hint: py`Inside the generator: \`saved = (dict(self.stock), list(self.orders))\`, then \`try: yield\` / \`except BaseException: self.stock, self.orders = saved; raise\`.`,
        tests: [
          { name: 'the fake passes the contract', code: py`fake = InMemoryShopRepository({"dune": 5, "emma": 2}, customer_ids={1, 2, 3})
assert check_contract(fake) == [], 'The fake must undo take_stock when add_order fails'` },
          { name: 'a failing block is undone', code: py`repo = InMemoryShopRepository({"dune": 5}, customer_ids={1})
try:
    with repo.transaction():
        repo.take_stock("dune", 2)
        raise RuntimeError("boom")
except RuntimeError:
    pass
assert repo.stock_of("dune") == 5` },
          { name: 'the exception is not swallowed', code: py`repo = InMemoryShopRepository({"dune": 5}, customer_ids={1})
with raises(OrderError):
    place_order(repo, 42, "dune", 1)` },
        ],
        explain: py`A fake is only useful if it keeps the same **promises** as the real thing. Here that includes "a failed transaction changes nothing". Snapshot-and-restore is a simplified rollback that's perfectly fine for a test double. Running one contract against both implementations is how you catch a fake that lies.`,
      },
      {
        id: 'reject-bad-quantity',
        task: py`Try it first: \`place_order(shop, 1, "emma", -3)\` *adds* 3 copies to the stock (\`stock - (-3)\`) and records a negative order! Make \`place_order\` raise \`ValueError\` when \`quantity < 1\`, **before** touching the repository.`,
        hint: py`Put \`if quantity < 1: raise ValueError("quantity must be at least 1")\` as the first line of \`place_order\`.`,
        tests: [
          { name: 'a negative quantity raises ValueError', code: py`repo = SqliteShopRepository(connect())
with raises(ValueError):
    place_order(repo, 1, "emma", -3)
assert repo.stock_of("emma") == 2, 'Stock must not change'` },
          { name: 'zero raises ValueError', code: py`repo = SqliteShopRepository(connect())
with raises(ValueError):
    place_order(repo, 1, "emma", 0)` },
          { name: 'normal orders still work', code: py`repo = SqliteShopRepository(connect())
place_order(repo, 1, "emma", 1)
assert repo.stock_of("emma") == 1` },
        ],
        explain: py`Validate at the boundary, before any write. For *defence in depth*, also teach the database the rule: \`quantity INTEGER NOT NULL CHECK (quantity > 0)\` in db.py. Then even a future code path that forgets the check can't store a negative order — the \`INSERT\` fails and the transaction rolls back the stock change.`,
      },
      {
        id: 'report-with-names',
        task: py`Change \`order_lines_join\` so each line shows the **product name** instead of the sku — \`#1 Ada: 2 x Dune\` — while still running **one** query.`,
        hint: py`Add \`JOIN products ON products.sku = orders.sku\` and select \`products.name\` instead of \`orders.sku\`.`,
        tests: [
          { name: 'lines show product names', code: py`lines = order_lines_join(conn)
assert lines[0] == "#1 Ada: 2 x Dune", lines[0]
assert lines[1] == "#2 Ben: 1 x Emma", lines[1]` },
          { name: 'still exactly one query', code: py`with count_queries(conn) as q:
    order_lines_join(conn)
assert len(q) == 1, f"ran {len(q)} queries"` },
        ],
        explain: py`A query can join as many tables as it needs. Each extra \`JOIN\` costs the database a little work, but it's still **one** round trip — doing the same in Python would cost one query per order, per lookup.`,
      },
      {
        id: 'index-for-sku',
        task: py`Product pages run \`SELECT id, quantity FROM orders WHERE sku = ?\`. Add an index so that \`query_plan(conn, "SELECT id, quantity FROM orders WHERE sku = ?", ("dune",))\` uses it. Print that plan at the end of main.py.`,
        hint: py`Add \`CREATE INDEX idx_orders_sku ON orders (sku);\` to \`SCHEMA\` in db.py (so every new database has it), or run it on \`conn\` in main.py.`,
        tests: [
          { name: 'the sku query uses an index', code: py`plan = query_plan(conn, "SELECT id, quantity FROM orders WHERE sku = ?", ("dune",))
assert "USING INDEX" in plan or "USING COVERING INDEX" in plan, plan` },
        ],
        explain: py`SQLite (like PostgreSQL) does **not** index foreign-key columns for you, even though they're exactly what joins and lookups filter on. Indexing the columns in your \`WHERE\`, \`JOIN\` and \`ORDER BY\` clauses is usually the biggest single speed-up — at the cost of a little extra work on every write.`,
      },
    ],
    variants: [
      { id: 'migrations', label: 'Mini migration runner (PRAGMA user_version)', files: { 'main.py': MIGRATIONS_MAIN } },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch a rollback undo a write',
    props: {
      code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE points (name TEXT, total INTEGER CHECK (total >= 0))")
conn.executemany("INSERT INTO points VALUES (?, ?)", [("Ada", 50), ("Ben", 10)])
conn.commit()


def transfer(sender, receiver, amount):
    with conn:
        conn.execute("UPDATE points SET total = total + ? WHERE name = ?", (amount, receiver))
        conn.execute("UPDATE points SET total = total - ? WHERE name = ?", (amount, sender))


transfer("Ada", "Ben", 20)
print(conn.execute("SELECT * FROM points").fetchall())
try:
    transfer("Ben", "Ada", 99)
except sqlite3.IntegrityError as exc:
    print("rolled back:", exc)
print(conn.execute("SELECT * FROM points").fetchall())
`,
      notes: {
        6: '`commit()` makes the starting balances permanent: Ada 50, Ben 10.',
        10: 'Entering `with conn:` — the first UPDATE will open a transaction (BEGIN).',
        11: 'The receiver is credited first. This change is **pending**, not yet permanent.',
        12: 'Then the sender is debited. If this breaks the CHECK constraint, the whole transaction is rolled back.',
        15: 'Ada → Ben, 20 points: both UPDATEs succeed, `with conn:` commits. Ada 30, Ben 30.',
        18: 'Ben only has 30 points. Ada is credited +99 first, then Ben\'s debit fails: `CHECK constraint failed`.',
        20: 'The exception arrives here **after** `with conn:` rolled back — including Ada\'s +99.',
        21: 'Balances are unchanged: Ada 30, Ben 30. No points were created out of thin air.',
      },
    },
    alt: 'A step-by-step trace of a points transfer program. The first transfer of 20 from Ada to Ben succeeds and prints Ada 30 and Ben 30. The second transfer of 99 from Ben to Ada credits Ada first, then the debit violates the CHECK constraint, the with block rolls back, the program prints "rolled back: CHECK constraint failed: total >= 0", and the balances print unchanged as Ada 30 and Ben 30.',
    caption: py`The credit happened *before* the failing debit — and it still disappeared. That's atomicity.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`#### How can a database "undo"?`,
      py`Before SQLite overwrites part of the database file, it saves what's needed to put it back. In the default mode that's a *rollback journal* — a side file holding the original pages. In *WAL mode* (write-ahead logging), new versions are appended to a separate log instead, and the main file is only updated later. Either way, \`COMMIT\` is a single moment where the change becomes official. Crash before it and the journal is used to restore the old state the next time the database opens; crash after it and the change is safe.`,
      py`#### ACID in plain language`,
      py`| letter | promise | what it saves you from |
|---|---|---|
| **A**tomicity | all of the transaction's changes happen, or none do | half-finished orders, money that leaves one account and never arrives |
| **C**onsistency | a transaction moves the data from one valid state to another — constraints (\`NOT NULL\`, \`CHECK\`, \`UNIQUE\`, foreign keys) hold at every commit | negative stock, orders for customers who don't exist |
| **I**solation | transactions running at the same time don't see each other's half-done work | reading a total while someone else is halfway through updating it |
| **D**urability | once \`COMMIT\` returns, the change survives a crash or power cut | "it said saved, but after the reboot it was gone" |`,
      py`Consistency is a team effort: the database enforces the constraints you *declare*, and your code is responsible for every rule you didn't. Durability needs a disk — an \`":memory:"\` database has no durability at all.`,
      py`#### What is an index, physically?`,
      py`A table is stored in order of its primary key. An index on \`customer_id\` is a *separate*, sorted structure (a **B-tree**) holding each \`customer_id\` with a pointer to its row. Finding customer 7 becomes "look it up in the sorted list" instead of "read every row" — like a book's index versus reading the whole book. The price: every \`INSERT\`, \`UPDATE\` or \`DELETE\` must update the index too, and it takes disk space.`,
    ],
    technical: [
      py`#### Isolation levels and the anomalies they prevent`,
      py`Perfect isolation (*serializable*: as if transactions ran one after another) is expensive, so many databases default to something weaker and let you choose:`,
      py`| anomaly | what happens |
|---|---|
| dirty read | you read another transaction's change that is later rolled back |
| non-repeatable read | you read the same row twice and get different values, because someone committed in between |
| phantom | you run the same \`WHERE\` twice and new rows have appeared |
| lost update | two transactions read the same value, both compute a new one, and the second write silently overwrites the first |`,
      py`PostgreSQL defaults to **READ COMMITTED**, MySQL's InnoDB to **REPEATABLE READ**. SQLite allows only **one writer at a time** and its transactions are serializable; a second writer waits (up to the connection's \`timeout\`) and then fails with \`sqlite3.OperationalError: database is locked\`. These defaults are configurable — check your database's documentation rather than assuming.`,
      py`#### The lost update, and three fixes`,
      { code: py`# RACE: two requests can both read stock = 1, both pass the check, both write 0.
stock = repo.stock_of("dune")
if stock >= quantity:
    repo.set_stock("dune", stock - quantity)`, lang: 'python', title: 'read-modify-write in Python', static: true },
      py`1. **Atomic conditional update** (used in the playground): \`UPDATE products SET stock = stock - ? WHERE sku = ? AND stock >= ?\` and check \`rowcount\`. The database evaluates the check and the change as one step.
2. **Pessimistic locking**: \`SELECT ... FOR UPDATE\` (PostgreSQL, MySQL — not SQLite) locks the row until your transaction ends, so the second request waits.
3. **Optimistic locking**: give the row a \`version\` column; update with \`... SET stock = ?, version = version + 1 WHERE sku = ? AND version = ?\`. If \`rowcount\` is 0, someone else changed it first — reload and retry. Good when conflicts are rare.`,
      py`#### Why N+1 hurts`,
      py`Each query is a *round trip*: send SQL, the database parses and plans it, runs it, sends rows back. For an in-process database like SQLite that overhead is small; for a database server across a network every round trip adds network latency, and it's multiplied by N. ORMs make N+1 easy to write by accident because \`customer.orders\` *looks* like an attribute but runs a query the first time you touch it (*lazy loading*). The fixes:`,
      py`- a \`JOIN\` (one query, rows may repeat parent data);
- a batched \`WHERE id IN (?, ?, ...)\` for all the ids you need (two queries in total);
- in SQLAlchemy, \`selectinload(Customer.orders)\` (emits the \`IN\` query for you) or \`joinedload(Customer.orders)\` (one query with a \`LEFT OUTER JOIN\`).`,
      py`#### How the planner uses an index`,
      py`- A **composite index** on \`(customer_id, created)\` is sorted by \`customer_id\`, then by \`created\` within each customer. It serves \`WHERE customer_id = ?\`, \`WHERE customer_id = ? AND created > ?\`, and \`WHERE customer_id = ? ORDER BY created\` — but not \`WHERE created > ?\` alone, just as a phone book sorted by surname can't find "everyone called Ada". This is the *leftmost prefix* rule.
- Wrapping the column in a function hides it from the index: \`WHERE lower(email) = ?\` can't use an index on \`email\`. Store normalised values, or create an *expression index*: \`CREATE INDEX ... ON users (lower(email))\`.
- A **covering index** contains every column the query reads, so the table itself is never touched.
- Indexes on columns with few distinct values (a boolean \`is_active\`) rarely help: half the table matches anyway.
- A \`UNIQUE\` constraint or \`PRIMARY KEY\` creates an index automatically.`,
      { callout: 'note', title: 'Database detail', text: py`Whether foreign-key columns get an index automatically depends on the database. SQLite and PostgreSQL don't create one; MySQL's InnoDB requires an index on foreign-key columns and creates one if it's missing. Check \`EXPLAIN\` rather than assuming.` },
      py`#### Transactions in the DB-API`,
      py`PEP 249 says a connection starts with autocommit **off** — changes are pending until \`commit()\`. Drivers implement that differently: sqlite3's legacy mode only starts a transaction before data-changing statements, psycopg starts one before the first statement of any kind. A useful habit across all of them: make transactions *explicit* in your code (\`with conn:\`, \`with session.begin():\`) instead of relying on a driver's implicit behaviour.`,
    ],
    production: [
      py`#### Connection management`,
      py`- **Open, use, close.** In a script, one connection for the whole run is fine — close it at the end (\`contextlib.closing(sqlite3.connect(path))\`, or a \`try/finally\`). Remember \`with conn:\` only commits; it doesn't close.
- **Servers use a pool.** Opening a connection to PostgreSQL or MySQL is slow (network handshake, authentication), so web apps keep a *pool* of open connections and lend one out per request or transaction. A SQLAlchemy \`Engine\` does this for you; one engine per process, created at start-up.
- **One connection per thread.** sqlite3 connections refuse to be used from a thread other than the one that created them (\`check_same_thread=True\` by default). Most drivers' connections aren't safe to share between threads either — that's another reason for pools.
- **Timeouts everywhere.** \`sqlite3.connect(path, timeout=5.0)\` controls how long to wait for a lock (5 seconds is the default). PostgreSQL has \`statement_timeout\` and \`lock_timeout\`. A query with no time limit can hold a pool connection forever.`,
      py`#### Keep transactions short`,
      py`While a transaction is open it may hold locks that block other writers. Never call a slow external service, send an email or wait for user input inside one. Do the slow work first, then open the transaction, write, and commit. Code that must react to deadlocks or serialization failures should retry the **whole** transaction — which only works if the work inside it is safe to repeat.`,
      py`#### Testing database code`,
      py`- **Unit tests** of business rules use a fake repository: no database, milliseconds per test.
- **Contract / integration tests** run the *same* checks against the real repository and a real database — ideally the same engine as production. SQLite in tests and PostgreSQL in production differ in types, locking, date handling and SQL features, so "passes on SQLite" is not proof. Tools like Docker or *testcontainers* make a throwaway PostgreSQL easy. See [fixtures](lesson:fixtures) and [mocking](lesson:mocking).
- **Assert query counts** for important pages, exactly as \`count_queries\` does here, so an N+1 regression fails a test instead of reaching users.`,
      py`#### Migrations in a team`,
      py`- Migrations live in version control, are reviewed like code, and run automatically in CI and on deploy (\`alembic upgrade head\`).
- **Never edit a migration that has run anywhere real** — databases that already applied it won't run it again. Write a new one.
- **Expand / contract** for zero-downtime changes: to rename \`email\` to \`email_address\`, (1) add the new column, (2) deploy code that writes both, (3) backfill old rows in batches, (4) switch reads to the new column, (5) drop the old one in a later release. Each step is compatible with the code running before and after it.
- Back up before destructive migrations, and test the \`downgrade()\` path if you rely on it.`,
      py`#### ORM or raw SQL?`,
      py`Both are professional choices. ORMs shine in apps with many related tables and lots of create/read/update/delete code; raw SQL (or SQLAlchemy Core, its SQL-expression layer) shines for reports, bulk operations and hand-tuned hot paths. Many teams use an ORM for most code and drop to SQL where it matters — through the same repository interface, so callers never know. Whichever you choose, turn on SQL logging in development (\`echo=True\`) so you *see* the queries, and keep using placeholders: an ORM protects you only when you don't paste strings into \`text()\` yourself. See [injection attacks](lesson:injection-attacks).`,
    ],
  },
  mistakes: [
    {
      title: 'Related writes without a transaction',
      wrong: { code: py`def place_order(conn, customer_id, sku, quantity):
    conn.execute("UPDATE products SET stock = stock - ? WHERE sku = ?", (quantity, sku))
    conn.commit()                        # stock is gone for good...
    conn.execute("INSERT INTO orders (customer_id, sku, quantity) VALUES (?, ?, ?)",
                 (customer_id, sku, quantity))   # ...and if this fails, there's no order
    conn.commit()`, lang: 'python' },
      right: { code: py`def place_order(conn, customer_id, sku, quantity):
    with conn:                           # one transaction: both or neither
        conn.execute("UPDATE products SET stock = stock - ? WHERE sku = ?", (quantity, sku))
        conn.execute("INSERT INTO orders (customer_id, sku, quantity) VALUES (?, ?, ?)",
                     (customer_id, sku, quantity))`, lang: 'python' },
      explanation: py`Committing in the middle splits one business action into two transactions. Group everything that must succeed together into one transaction and commit once, at the end.`,
    },
    {
      title: 'Check-then-write in Python (the lost update)',
      wrong: { code: py`def take_stock(conn, sku, quantity):
    (stock,) = conn.execute("SELECT stock FROM products WHERE sku = ?", (sku,)).fetchone()
    if stock < quantity:
        return False
    conn.execute("UPDATE products SET stock = ? WHERE sku = ?", (stock - quantity, sku))
    return True`, lang: 'python' },
      right: { code: py`def take_stock(conn, sku, quantity):
    cur = conn.execute(
        "UPDATE products SET stock = stock - ? WHERE sku = ? AND stock >= ?",
        (quantity, sku, quantity),
    )
    return cur.rowcount == 1`, lang: 'python' },
      explanation: py`Between the \`SELECT\` and the \`UPDATE\`, another request can read the same stock and sell the same last copy. Let the database check and change in one statement, then look at \`rowcount\` to see whether it happened.`,
    },
    {
      title: 'A query inside a loop (N+1)',
      wrong: { code: py`for (author_id, name) in conn.execute("SELECT id, name FROM authors"):
    (count,) = conn.execute(
        "SELECT COUNT(*) FROM books WHERE author_id = ?", (author_id,)
    ).fetchone()
    print(name, count)`, lang: 'python' },
      right: { code: py`rows = conn.execute("""
    SELECT authors.name, COUNT(books.id)
    FROM authors
    LEFT JOIN books ON books.author_id = authors.id
    GROUP BY authors.id
    ORDER BY authors.name
""")
for name, count in rows:
    print(name, count)`, lang: 'python' },
      explanation: py`One query per row multiplies round trips by the number of rows. A \`JOIN\` with \`GROUP BY\` gets the same answer in one query. \`LEFT JOIN\` plus \`COUNT(books.id)\` keeps authors with zero books (and counts them as 0, not 1).`,
    },
    {
      title: 'Hiding an indexed column inside a function',
      wrong: { code: py`conn.execute("CREATE INDEX idx_users_email ON users (email)")
user = conn.execute(
    "SELECT id, name FROM users WHERE lower(email) = ?", (email.lower(),)
).fetchone()          # plan: SCAN users — the index can't help`, lang: 'python', static: true },
      right: { code: py`# store emails already lower-cased when you insert them, then:
user = conn.execute(
    "SELECT id, name FROM users WHERE email = ?", (email.lower(),)
).fetchone()          # plan: SEARCH users USING INDEX idx_users_email (email=?)

# or index the expression itself:
conn.execute("CREATE INDEX idx_users_email_lower ON users (lower(email))")`, lang: 'python', static: true },
      explanation: py`An index is sorted by the column's raw values, so it can't answer questions about \`lower(email)\`. Normalise data on the way in, or index the exact expression you filter on. \`EXPLAIN QUERY PLAN\` tells you which you've got.`,
    },
    {
      title: 'A repository that leaks the database',
      wrong: { code: py`class OrderRepository:
    def recent(self):
        return self.conn.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 10")
        # callers get a live sqlite3 cursor, rely on column order,
        # and must catch sqlite3.IntegrityError themselves`, lang: 'python', static: true },
      right: { code: py`class OrderRepository:
    def recent(self, limit=10):
        rows = self.conn.execute(
            "SELECT id, customer_id, sku, quantity FROM orders ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [Order(*row) for row in rows]      # plain domain objects (e.g. dataclasses)`, lang: 'python', static: true },
      explanation: py`If callers receive cursors, rows or driver exceptions, they depend on SQLite after all, and a fake can't imitate them. Return plain objects ([dataclasses](lesson:dataclasses) work well) and translate driver errors into your own exceptions.`,
    },
    {
      title: 'A slow call inside an open transaction',
      wrong: { code: py`with conn:
    conn.execute("UPDATE orders SET status = 'paid' WHERE id = ?", (order_id,))
    send_receipt_email(order_id)       # seconds of network time while holding the write lock`, lang: 'python', static: true },
      right: { code: py`with conn:
    conn.execute("UPDATE orders SET status = 'paid' WHERE id = ?", (order_id,))
send_receipt_email(order_id)           # after COMMIT: the lock is released`, lang: 'python', static: true },
      explanation: py`Locks are held until the transaction ends. In SQLite every other writer waits; in server databases rows stay locked and pool connections stay busy. Do slow work before or after the transaction, never inside it.`,
    },
  ],
  debugging: [
    {
      symptom: py`sqlite3.OperationalError: database is locked`,
      cause: py`Another connection holds a write transaction for longer than this connection's \`timeout\` — often a transaction left open (a missing \`commit()\`), or slow work done inside one.`,
      fix: py`Commit promptly (\`with conn:\`), keep transactions short, close connections you're done with, and consider \`PRAGMA journal_mode = WAL\` so readers don't block the writer. Raise \`timeout\` only after fixing the cause.`,
    },
    {
      symptom: py`sqlite3.IntegrityError: FOREIGN KEY constraint failed`,
      cause: py`A row refers to a parent that doesn't exist (customer 99), or you deleted a parent that still has children. This only appears once \`PRAGMA foreign_keys = ON\` — which is good: without it, the bad row would have been stored silently.`,
      fix: py`Check the id you're inserting. Inside a transaction, everything already written is rolled back. Translate the error into a domain exception in your repository so callers can show a helpful message.`,
    },
    {
      symptom: py`sqlite3.ProgrammingError: Cannot operate on a closed database.`,
      cause: py`Code used a connection after \`conn.close()\` — often a repository or cursor kept around after a \`with closing(...)\` block ended.`,
      fix: py`Make the connection's lifetime explicit: create it at start-up (or per request) and pass it in. Don't return cursors from functions that close the connection.`,
    },
    {
      symptom: py`A page is fast in development and slow in production; the SQL log shows hundreds of nearly identical queries.`,
      cause: py`The N+1 problem: a query (or an ORM lazy load) runs once per item in a loop. With 5 test rows nobody noticed.`,
      fix: py`Count the queries (\`set_trace_callback\`, SQLAlchemy \`echo=True\`), then replace the loop with a \`JOIN\`, an \`IN (...)\` batch, or \`selectinload\`/\`joinedload\`. Add a test that asserts the query count.`,
    },
    {
      symptom: py`sqlalchemy.orm.exc.DetachedInstanceError: Parent instance <Customer at 0x...> is not bound to a Session; lazy load operation of attribute 'orders' cannot proceed`,
      cause: py`An object was loaded in a \`Session\` that has since closed, and then code touched a lazy relationship, which needs a session to run its query.`,
      fix: py`Load what you need while the session is open (\`selectinload(Customer.orders)\`), or keep the session open for the whole unit of work.`,
    },
    {
      symptom: py`FAILED: Target database is not up to date.`,
      cause: py`Alembic refuses to autogenerate a new migration while the database is behind the latest revision.`,
      fix: py`Run \`alembic upgrade head\` first, then \`alembic revision --autogenerate -m "..."\`.`,
    },
  ],
  bestPractices: [
    'Wrap every business action that writes more than once in exactly one transaction, and commit once at the end.',
    'Do checks and changes in one statement (UPDATE ... WHERE stock >= ?) and inspect rowcount, instead of read-check-write in Python.',
    'Declare rules as constraints too (NOT NULL, CHECK, UNIQUE, foreign keys) and turn on PRAGMA foreign_keys in SQLite.',
    'Keep SQL inside repositories that return plain objects and raise your own exceptions.',
    'Run the same contract tests against a fake repository and the real one.',
    'Count queries for important pages and fail a test when the count grows with the data (N+1).',
    'Index the columns used in WHERE, JOIN and ORDER BY of frequent queries — and prove it with EXPLAIN QUERY PLAN.',
    'Keep transactions short: no network calls or user waits inside them.',
    'Manage schema changes with versioned, reviewed migrations; never edit one that has already run.',
  ],
  useCases: [
    'Checkout: reserve stock, create the order and record the payment as one transaction.',
    'Bookings: claim several seats or time slots together, or none of them.',
    'Unit-testing business rules in milliseconds with an in-memory fake repository.',
    'Speeding up a slow list page by replacing per-row lookups with one JOIN.',
    'Making a dashboard query fast with a composite index matching its WHERE and ORDER BY.',
    'Rolling out a new column to every environment with alembic upgrade head.',
  ],
  whenToUse: {
    use: [
      'A transaction whenever two or more writes must stay consistent with each other.',
      'A repository once SQL starts appearing in several places, or you want fast tests of business logic.',
      'An index when a frequent query filters, joins or sorts on a column and EXPLAIN shows a SCAN of a large table.',
      'An ORM for applications with many related tables and a lot of create/read/update/delete code.',
      'Migrations from the first day the schema exists outside your laptop.',
    ],
    avoid: [
      'A repository layer for a 50-line one-off script — call sqlite3 directly.',
      'Indexing every column "just in case": each index slows writes and uses space.',
      'Fakes as your only tests — always run the contract against the real database too.',
      'Long-running transactions that wait on users or external services.',
      'ORM magic you never look at: always know which SQL your ORM code runs.',
    ],
  },
  comparison: {
    title: 'Three ways to talk to a database from Python',
    headers: ['', 'Raw SQL (sqlite3, psycopg)', 'SQL expression builder (SQLAlchemy Core)', 'ORM (SQLAlchemy ORM, Django ORM)'],
    rows: [
      ['you write', 'SQL strings with placeholders', 'Python expressions that build SQL', 'classes, plus queries like select(Customer)'],
      ['results are', 'tuples / Row objects', 'Row objects', 'instances of your classes, tracked by a Session'],
      ['strengths', 'full control, every SQL feature, nothing hidden', 'composable dynamic queries, works across databases', 'least boilerplate, relationships, unit of work, autogenerated migrations'],
      ['watch out for', 'mapping rows by hand; never skip placeholders', 'another API to learn', 'hidden queries (N+1), lazy loading after the session closes'],
      ['great for', 'scripts, reports, bulk jobs, tuned hot paths', 'query builders, libraries, dynamic filters', 'CRUD-heavy apps with many related tables'],
    ],
    note: py`These aren't exclusive: SQLAlchemy lets you mix ORM, Core and plain \`text()\` SQL in one app, and a repository can use whichever fits each method.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'database-patterns-q1',
      type: 'mcq',
      prompt: 'An app subtracts £50 from Ada\'s account, then crashes before adding £50 to Ben\'s. Both steps were in one transaction. After restarting, Ada still has her £50. Which ACID property is responsible?',
      options: [
        'Atomicity',
        { text: 'Consistency', why: 'Consistency is about constraints and rules holding at every commit. The "all or nothing" guarantee that undid the half-done transfer is atomicity.' },
        { text: 'Isolation', why: 'Isolation is about concurrent transactions not seeing each other’s half-done work. Here there was only one transaction.' },
        { text: 'Durability', why: 'Durability protects changes that were committed. This transfer never committed — that is exactly why it was undone.' },
      ],
      answer: 0,
      explanation: py`Atomicity: a transaction's changes are applied completely or not at all. The uncommitted subtraction is rolled back using the journal when the database next opens.`,
    },
    {
      id: 'database-patterns-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE stock (item TEXT, qty INTEGER CHECK (qty >= 0))")
conn.execute("INSERT INTO stock VALUES ('pen', 5)")
conn.commit()
try:
    with conn:
        conn.execute("UPDATE stock SET qty = qty - 2 WHERE item = 'pen'")
        conn.execute("UPDATE stock SET qty = qty - 9 WHERE item = 'pen'")
except sqlite3.IntegrityError:
    print("rolled back")
print(conn.execute("SELECT qty FROM stock").fetchone()[0])`,
      options: [
        { text: 'rolled back, then 3', why: 'The first UPDATE (5 → 3) was in the same transaction as the failing one, so the rollback undid it too.' },
        'rolled back, then 5',
        { text: 'rolled back, then -6', why: 'The CHECK constraint stops qty going negative: the second UPDATE fails instead of storing -6.' },
        { text: 'Only 3 — the error is ignored', why: 'An IntegrityError is raised and caught by the except block, which prints "rolled back".' },
      ],
      answer: 1,
      explanation: py`The second UPDATE would make qty \`-6\`, violating \`CHECK (qty >= 0)\`. \`with conn:\` rolls back the **whole** transaction — including the first UPDATE — and re-raises, so the except block prints \`rolled back\` and the quantity is still \`5\`.`,
    },
    {
      id: 'database-patterns-q3',
      type: 'bug',
      prompt: 'This works, but with 500 authors it sends 501 queries. Click the line that causes the N+1 problem.',
      code: py`def authors_with_books(conn):
    result = {}
    for author_id, name in conn.execute("SELECT id, name FROM authors"):
        books = conn.execute(
            "SELECT title FROM books WHERE author_id = ?", (author_id,)
        ).fetchall()
        result[name] = [title for (title,) in books]
    return result`,
      answerLine: [4, 5],
      explanation: py`The query on lines 4–6 runs once **per author** inside the loop: 1 query for the authors + N for their books. Fetch all books in one query (a \`JOIN\`, or \`WHERE author_id IN (...)\`) and group them in Python, e.g. with a \`defaultdict(list)\`.`,
    },
    {
      id: 'database-patterns-q4',
      type: 'fill',
      prompt: 'Create an index on `orders.customer_id`, then ask SQLite how it will run the query.',
      code: py`conn.execute("CREATE ___ idx_orders_customer ON orders (customer_id)")
plan = conn.execute(
    "EXPLAIN QUERY ___ SELECT * FROM orders WHERE customer_id = ?", (7,)
).fetchall()
print(plan[0][3])   # SEARCH orders USING INDEX idx_orders_customer (customer_id=?)`,
      answer: [['INDEX', 'index'], ['PLAN', 'plan']],
      explanation: py`\`CREATE INDEX name ON table (columns)\` builds the index. \`EXPLAIN QUERY PLAN\` in front of a query returns rows whose fourth column describes each step — \`SCAN\` (every row) or \`SEARCH ... USING INDEX\`.`,
    },
    {
      id: 'database-patterns-q5',
      type: 'output',
      prompt: 'How many statements does the trace callback record?',
      code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE t (x INTEGER)")
statements = []
conn.set_trace_callback(statements.append)
with conn:
    conn.execute("INSERT INTO t VALUES (?)", (1,))
    conn.execute("INSERT INTO t VALUES (?)", (2,))
conn.set_trace_callback(None)
print(len(statements))`,
      answer: '4',
      accept: ['4'],
      explanation: py`The callback sees every statement the connection sends: the implicit \`BEGIN\` before the first INSERT, the two INSERTs, and the \`COMMIT\` that \`with conn:\` issues at the end. Counting statements like this is a cheap way to make transactions — and N+1 problems — visible.`,
    },
    {
      id: 'database-patterns-q6',
      type: 'mcq',
      prompt: 'Your `place_order(repo, ...)` function receives a repository object instead of a database connection. What is the main benefit?',
      options: [
        { text: 'Queries run faster because repositories cache results', why: 'A repository doesn’t make anything faster by itself; it’s about where the SQL lives and what the caller depends on.' },
        'Business logic can be tested with an in-memory fake and the storage can change without touching it',
        { text: 'It makes SQL injection impossible', why: 'Only placeholders prevent injection. A repository that builds SQL with f-strings is just as vulnerable.' },
        { text: 'It removes the need for transactions', why: 'The repository still has to group writes in a transaction — here via repo.transaction().' },
      ],
      answer: 1,
      explanation: py`The repository is a seam: callers depend on methods like \`take_stock\` and \`add_order\`, not on SQL. Tests pass a fast fake; production passes the SQLite (or PostgreSQL, or ORM) one. Contract tests keep the two honest.`,
    },
    {
      id: 'database-patterns-q7',
      type: 'short',
      prompt: 'Why can an ORM make the N+1 problem easier to create than raw SQL, and how do you avoid it in SQLAlchemy?',
      answer: py`Relationships load lazily by default: \`customer.orders\` looks like a plain attribute, but the first access runs a query. Inside a loop over customers, that is one extra query per customer, hidden behind attribute syntax. Avoid it by asking for the related rows up front — \`select(Customer).options(selectinload(Customer.orders))\` (one extra IN query) or \`joinedload\` (one JOIN) — and by logging SQL (\`echo=True\`) or asserting query counts in tests.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'book-seats',
      title: 'Book seats together, or not at all',
      difficulty: 'intermediate',
      prompt: py`Friends want to sit together at the cinema. Write \`book_seats(conn, customer, seats)\` that books **every** seat in the list for \`customer\`, or **none** of them.

Rules:

1. If \`seats\` is empty, raise \`ValueError\`.
2. Book all seats in **one transaction** (\`with conn:\`). For each seat, use one atomic statement: \`UPDATE seats SET booked_by = ? WHERE seat = ? AND booked_by IS NULL\`.
3. If a seat is already booked or doesn't exist (\`rowcount != 1\`), raise \`SeatUnavailable(seat)\` — the message is the seat name, e.g. \`A3\` — so that **nothing** in this request stays booked.
4. On success, return the number of seats booked, and leave no transaction open.

\`make_cinema()\` builds seats A1–A5, with **A3** already booked by \`"Zed"\`. \`free_seats(conn)\` lists the free seats.`,
      files: {
        'main.py': py`import sqlite3


class SeatUnavailable(Exception):
    """A requested seat doesn't exist or is already booked."""


def make_cinema():
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE seats (seat TEXT PRIMARY KEY, booked_by TEXT)")
    conn.executemany(
        "INSERT INTO seats (seat, booked_by) VALUES (?, ?)",
        [("A1", None), ("A2", None), ("A3", "Zed"), ("A4", None), ("A5", None)],
    )
    conn.commit()
    return conn


def free_seats(conn):
    rows = conn.execute("SELECT seat FROM seats WHERE booked_by IS NULL ORDER BY seat")
    return [seat for (seat,) in rows]


def book_seats(conn, customer, seats):
    # TODO: all seats or none, in one transaction
    for seat in seats:
        conn.execute("UPDATE seats SET booked_by = ? WHERE seat = ?", (customer, seat))
    return len(seats)


conn = make_cinema()
print("booked:", book_seats(conn, "Ada", ["A1", "A2"]))
try:
    book_seats(conn, "Ben", ["A4", "A3"])       # A3 is Zed's
except SeatUnavailable as exc:
    print("refused:", exc)
print("free:", free_seats(conn))
`,
      },
      hints: [
        'Two things are missing: a transaction around the loop, and a check that each UPDATE actually changed a row.',
        'Add "AND booked_by IS NULL" to the WHERE clause, keep the cursor (cur = conn.execute(...)), and raise SeatUnavailable(seat) when cur.rowcount != 1 — inside with conn:, so the rollback undoes earlier seats.',
        'if not seats: raise ValueError(...)\nwith conn:\n    for seat in seats:\n        cur = conn.execute("UPDATE seats SET booked_by = ? WHERE seat = ? AND booked_by IS NULL", (customer, seat))\n        if cur.rowcount != 1:\n            raise SeatUnavailable(seat)\nreturn len(seats)',
      ],
      solution: {
        explanation: py`\`with conn:\` turns the loop into one transaction. Each \`UPDATE ... AND booked_by IS NULL\` checks and claims a seat in a single statement, so two customers can never both get it, and \`rowcount\` tells us whether it worked (0 for a taken or unknown seat). Raising \`SeatUnavailable\` inside the \`with\` block makes sqlite3 roll back — A4, booked a moment earlier in the same request, becomes free again — and the exception continues to the caller. On success, leaving the block commits, so \`conn.in_transaction\` is \`False\`. The empty-list check comes first: there's no point opening a transaction for nothing.`,
        files: {
          'main.py': py`import sqlite3


class SeatUnavailable(Exception):
    """A requested seat doesn't exist or is already booked."""


def make_cinema():
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE seats (seat TEXT PRIMARY KEY, booked_by TEXT)")
    conn.executemany(
        "INSERT INTO seats (seat, booked_by) VALUES (?, ?)",
        [("A1", None), ("A2", None), ("A3", "Zed"), ("A4", None), ("A5", None)],
    )
    conn.commit()
    return conn


def free_seats(conn):
    rows = conn.execute("SELECT seat FROM seats WHERE booked_by IS NULL ORDER BY seat")
    return [seat for (seat,) in rows]


def book_seats(conn, customer, seats):
    if not seats:
        raise ValueError("choose at least one seat")
    with conn:                                   # COMMIT, or ROLLBACK on any error
        for seat in seats:
            cur = conn.execute(
                "UPDATE seats SET booked_by = ? WHERE seat = ? AND booked_by IS NULL",
                (customer, seat),
            )
            if cur.rowcount != 1:                # taken, or no such seat
                raise SeatUnavailable(seat)
    return len(seats)


conn = make_cinema()
print("booked:", book_seats(conn, "Ada", ["A1", "A2"]))
try:
    book_seats(conn, "Ben", ["A4", "A3"])       # A3 is Zed's
except SeatUnavailable as exc:
    print("refused:", exc)
print("free:", free_seats(conn))
`,
        },
      },
      tests: [
        { name: 'books free seats and returns the count', code: py`c = make_cinema()
assert book_seats(c, "Ada", ["A1", "A2"]) == 2
assert free_seats(c) == ["A4", "A5"]` },
        { name: 'a taken seat raises SeatUnavailable("A3")', code: py`c = make_cinema()
with raises(SeatUnavailable, match="A3"):
    book_seats(c, "Ben", ["A4", "A3"])` },
        { name: 'after a refusal nothing from that request is booked', code: py`c = make_cinema()
try:
    book_seats(c, "Ben", ["A4", "A3"])
except SeatUnavailable:
    pass
assert free_seats(c) == ["A1", "A2", "A4", "A5"], 'A4 must be released again (rollback)'
assert c.execute("SELECT booked_by FROM seats WHERE seat = 'A3'").fetchone()[0] == "Zed"` },
        { name: 'an unknown seat raises SeatUnavailable', code: py`c = make_cinema()
with raises(SeatUnavailable):
    book_seats(c, "Cy", ["Z9"])` },
        { name: 'an empty list raises ValueError', code: py`with raises(ValueError):
    book_seats(make_cinema(), "Cy", [])` },
        { name: 'a successful booking is committed', code: py`c = make_cinema()
book_seats(c, "Ada", ["A5"])
assert not c.in_transaction, 'Commit the transaction (use with conn:)'` },
      ],
    },
    {
      id: 'playlist-summary-one-query',
      title: 'Fix the N+1 playlist summary',
      difficulty: 'intermediate',
      prompt: py`\`playlist_summary(conn)\` returns \`[(playlist_name, song_count), ...]\` sorted by playlist name — and it's correct. But it runs **one query per playlist**.

Rewrite it so it returns exactly the same list using **exactly one** SQL query (the tests count queries with \`count_queries\`, which uses \`set_trace_callback\`). Playlists with no songs must still appear, with a count of \`0\`. Return a list of tuples.

Expected for the sample data: \`[('Focus', 3), ('Party', 0), ('Road trip', 2)]\`.`,
      files: {
        'main.py': py`import sqlite3
from contextlib import contextmanager


def make_music_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE playlists (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE songs (
            id          INTEGER PRIMARY KEY,
            title       TEXT NOT NULL,
            playlist_id INTEGER NOT NULL REFERENCES playlists (id)
        );
        INSERT INTO playlists (name) VALUES ('Road trip'), ('Focus'), ('Party');
        INSERT INTO songs (title, playlist_id) VALUES
            ('Hit the Road', 1), ('Highway Star', 1),
            ('Holocene', 2), ('Gymnopedie No.1', 2), ('Weightless', 2);
    """)
    return conn


@contextmanager
def count_queries(conn):
    statements = []
    conn.set_trace_callback(statements.append)
    try:
        yield statements
    finally:
        conn.set_trace_callback(None)


def playlist_summary(conn):
    """[(playlist name, number of songs)], sorted by name. TODO: one query."""
    summary = []
    for playlist_id, name in conn.execute("SELECT id, name FROM playlists ORDER BY name"):
        (count,) = conn.execute(
            "SELECT COUNT(*) FROM songs WHERE playlist_id = ?", (playlist_id,)
        ).fetchone()
        summary.append((name, count))
    return summary


conn = make_music_db()
with count_queries(conn) as queries:
    summary = playlist_summary(conn)
print(summary)
print("queries run:", len(queries))
`,
      },
      hints: [
        'You need playlists and songs together in one query: a JOIN plus GROUP BY, with COUNT as the aggregate.',
        'A plain JOIN drops "Party" (it has no songs). Use LEFT JOIN, and count songs.id rather than * — COUNT(*) would count the one empty joined row as 1.',
        'SELECT playlists.name, COUNT(songs.id) FROM playlists LEFT JOIN songs ON songs.playlist_id = playlists.id GROUP BY playlists.id ORDER BY playlists.name — then return .fetchall().',
      ],
      solution: {
        explanation: py`\`LEFT JOIN\` keeps every playlist, pairing it with each of its songs — or with a single row of \`NULL\`s if it has none. \`GROUP BY playlists.id\` makes one group per playlist, and \`COUNT(songs.id)\` counts only non-NULL song ids, so an empty playlist counts \`0\` (\`COUNT(*)\` would say \`1\`). Grouping by the id rather than the name keeps two playlists that share a name apart. Sorting happens in SQL with \`ORDER BY\`. One round trip, whether there are 3 playlists or 30,000 — and \`fetchall()\` already returns a list of tuples.`,
        files: {
          'main.py': py`import sqlite3
from contextlib import contextmanager


def make_music_db():
    conn = sqlite3.connect(":memory:")
    conn.executescript("""
        CREATE TABLE playlists (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
        CREATE TABLE songs (
            id          INTEGER PRIMARY KEY,
            title       TEXT NOT NULL,
            playlist_id INTEGER NOT NULL REFERENCES playlists (id)
        );
        INSERT INTO playlists (name) VALUES ('Road trip'), ('Focus'), ('Party');
        INSERT INTO songs (title, playlist_id) VALUES
            ('Hit the Road', 1), ('Highway Star', 1),
            ('Holocene', 2), ('Gymnopedie No.1', 2), ('Weightless', 2);
    """)
    return conn


@contextmanager
def count_queries(conn):
    statements = []
    conn.set_trace_callback(statements.append)
    try:
        yield statements
    finally:
        conn.set_trace_callback(None)


def playlist_summary(conn):
    """[(playlist name, number of songs)], sorted by name, in one query."""
    rows = conn.execute("""
        SELECT playlists.name, COUNT(songs.id)
        FROM playlists
        LEFT JOIN songs ON songs.playlist_id = playlists.id
        GROUP BY playlists.id
        ORDER BY playlists.name
    """)
    return rows.fetchall()


conn = make_music_db()
with count_queries(conn) as queries:
    summary = playlist_summary(conn)
print(summary)
print("queries run:", len(queries))
`,
        },
      },
      tests: [
        { name: 'returns the right summary', code: py`assert playlist_summary(make_music_db()) == [("Focus", 3), ("Party", 0), ("Road trip", 2)]` },
        { name: 'an empty playlist counts 0', code: py`result = dict(playlist_summary(make_music_db()))
assert result["Party"] == 0` },
        { name: 'runs exactly one query', code: py`c = make_music_db()
with count_queries(c) as q:
    playlist_summary(c)
assert len(q) == 1, f"ran {len(q)} queries — expected 1"` },
        { name: 'still one query with more playlists', code: py`c = make_music_db()
c.executemany("INSERT INTO playlists (name) VALUES (?)", [("Chill",), ("Gym",), ("Study",)])
c.execute("INSERT INTO songs (title, playlist_id) VALUES ('Runaway', 5)")
with count_queries(c) as q:
    result = playlist_summary(c)
assert len(q) == 1, f"ran {len(q)} queries — expected 1"
assert ("Gym", 1) in result and ("Chill", 0) in result` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'database-patterns-acid',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does ACID stand for, and what does each property protect you from?',
      answer: 'Atomicity: all of a transaction’s changes happen or none do. Consistency: each commit leaves the data satisfying its constraints. Isolation: concurrent transactions don’t see each other’s half-done work (to a configurable degree). Durability: once committed, changes survive crashes.',
      explanation: py`Atomicity prevents half-finished business actions. Consistency is shared: the database enforces declared constraints, the application enforces the rest. Isolation comes in levels — read committed, repeatable read, serializable — trading anomalies (dirty reads, lost updates, phantoms) for concurrency. Durability means \`COMMIT\` returning implies the data is on stable storage, usually via a journal or write-ahead log.`,
      whyAsked: 'It checks you understand what a database guarantees before you rely on it — the foundation for designing anything that writes data.',
      mistakes: ['Reciting the four words without saying what each prevents', 'Claiming every database is fully serializable by default', 'Confusing Consistency in ACID with consistency in distributed systems (CAP)'],
      followUps: ['Which isolation level does PostgreSQL use by default?', 'What is a lost update and how do you prevent one?', 'How does a write-ahead log provide durability?'],
      modelAnswer: 'ACID is the set of guarantees a transactional database gives. Atomicity means a transaction is all or nothing — if anything fails, every change in it is rolled back. Consistency means each commit moves the data from one valid state to another, so declared constraints like foreign keys and CHECKs always hold. Isolation means concurrent transactions don’t see each other’s partial work; it comes in levels, and many databases default to something weaker than serializable, like read committed in PostgreSQL. Durability means that once commit returns, the change survives a crash, which databases achieve with a journal or write-ahead log. In practice, I group every multi-step write into one transaction and declare as many rules as constraints as I can.',
    },
    {
      id: 'database-patterns-n-plus-one',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'An endpoint that lists 50 orders with each customer’s name takes two seconds in production. The SQL log shows 51 queries per request. What is happening and how do you fix it — with raw SQL and with SQLAlchemy?',
      answer: 'The N+1 problem: one query for the orders, then one per order to load its customer (often an ORM lazy load). Fix with a JOIN, or a batched WHERE id IN (...) query; in SQLAlchemy use selectinload(Order.customer) or joinedload(Order.customer). Then add a test that asserts the query count.',
      explanation: py`Each query costs a network round trip plus parsing and planning, multiplied by N. With raw SQL, \`JOIN customers ON customers.id = orders.customer_id\` gets everything in one query. In SQLAlchemy, \`select(Order).options(joinedload(Order.customer))\` uses a JOIN, while \`selectinload\` issues a second query with \`WHERE customers.id IN (...)\` — usually the better choice for one-to-many collections because a JOIN repeats the parent row for every child.`,
      code: { lang: 'python', code: py`# SQLAlchemy 2.0 (static)
stmt = (
    select(Order)
    .options(joinedload(Order.customer))      # many-to-one: a JOIN is fine
    .order_by(Order.id.desc())
    .limit(50)
)
orders = session.scalars(stmt).all()` },
      whyAsked: 'N+1 is the most common database performance bug in web apps, and fixing it shows you can read query logs and know your ORM.',
      mistakes: ['Adding a cache before counting queries', 'Blaming the database server and scaling it up', 'Using joinedload for large one-to-many collections, which multiplies rows'],
      followUps: ['When would selectinload beat joinedload?', 'How would you stop N+1 regressions from coming back?', 'Would an index have helped here?'],
      modelAnswer: 'Fifty-one queries for fifty orders is the classic N+1 problem: one query fetches the orders and then each order triggers another query for its customer, usually an ORM lazy load hiding behind attribute access. Each query is a round trip, so the cost grows with the page size. With raw SQL I’d join orders to customers and get everything in one query. In SQLAlchemy I’d add joinedload for this many-to-one relationship, or selectinload for one-to-many collections, which batches the related rows into a single IN query. Then I’d add a test that counts queries for this endpoint so the problem can’t quietly return.',
    },
    {
      id: 'database-patterns-lost-update',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'This code runs in a web app with several workers. During a sale, the shop sells more copies than it has. Each call runs inside a transaction. Why, and how do you fix it?',
      code: { lang: 'python', code: py`def buy(conn, sku, quantity):
    with conn:
        (stock,) = conn.execute(
            "SELECT stock FROM products WHERE sku = ?", (sku,)
        ).fetchone()
        if stock < quantity:
            raise OutOfStock(sku)
        conn.execute(
            "UPDATE products SET stock = ? WHERE sku = ?", (stock - quantity, sku)
        )` },
      answer: 'A lost update: two transactions read the same stock, both pass the check, and the second write overwrites the first. Under READ COMMITTED (PostgreSQL’s default), wrapping it in a transaction does not stop this. Fix it by checking and changing in one statement — UPDATE ... SET stock = stock - ? WHERE sku = ? AND stock >= ? and check rowcount — or lock the row with SELECT ... FOR UPDATE, or use optimistic locking with a version column.',
      explanation: py`Read-check-write in application code leaves a gap between the read and the write. The atomic conditional update closes it: the database evaluates \`stock >= ?\` and decrements under its own row lock, so only one of two concurrent buyers gets \`rowcount == 1\`. \`SELECT ... FOR UPDATE\` (PostgreSQL, MySQL) makes the second transaction wait until the first commits. Optimistic locking adds \`version = version + 1 WHERE version = ?\` and retries on \`rowcount == 0\`. A \`CHECK (stock >= 0)\` constraint is a good safety net either way. SQLite is less exposed because it allows only one writer, but the atomic update is still the clearest code.`,
      whyAsked: 'Concurrency bugs in data access are subtle and expensive; this separates people who know what isolation levels actually guarantee from people who assume "it’s in a transaction, so it’s safe".',
      mistakes: ['Saying the transaction already prevents it', 'Fixing it with a Python threading.Lock, which does nothing across processes or servers', 'Retrying blindly without making the write conditional'],
      followUps: ['What isolation level would prevent this without code changes, and what does it cost?', 'When would you prefer optimistic locking?', 'How would you test for this race?'],
      modelAnswer: 'This is a lost update. Two workers read the same stock, say one copy, both see enough, and both write stock minus quantity, so the second write overwrites the first and we oversell. Being inside a transaction doesn’t help at PostgreSQL’s default read committed level, because the read doesn’t lock the row. The simplest fix is to let the database check and change in a single statement — update stock = stock minus quantity where stock is at least quantity — and look at rowcount to see whether it succeeded. Alternatives are SELECT FOR UPDATE to lock the row, or optimistic locking with a version column and a retry. I’d also keep a CHECK constraint so stock can never go negative.',
    },
    {
      id: 'database-patterns-fake-repository',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement `InMemoryUserRepository` so it keeps exactly the same contract as `SqliteUserRepository`: `add(email, name)` returns a `User` with ids 1, 2, 3… and the email stored lower-cased; adding an email that already exists (case-insensitively) raises `DuplicateEmail`; `get(user_id)` and `by_email(email)` return the `User` or `None` (`by_email` is case-insensitive).',
      answer: 'Keep a dict of id → User plus a counter; normalise emails with lower(); check for duplicates before inserting; return None for missing users.',
      explanation: py`The fake must mirror every promise the real repository makes, including error behaviour (\`DuplicateEmail\`) and normalisation (lower-cased email). The best way to keep them aligned is one set of contract tests run against both implementations — here, the same tests pass for SQLite and for the fake.`,
      starter: { files: { 'main.py': py`import sqlite3
from dataclasses import dataclass


class DuplicateEmail(Exception):
    pass


@dataclass
class User:
    id: int
    email: str
    name: str


class SqliteUserRepository:
    def __init__(self, conn):
        self.conn = conn
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users ("
            "id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL)"
        )

    def add(self, email, name):
        email = email.lower()
        try:
            with self.conn:
                cur = self.conn.execute(
                    "INSERT INTO users (email, name) VALUES (?, ?)", (email, name)
                )
        except sqlite3.IntegrityError as exc:
            raise DuplicateEmail(email) from exc
        return User(cur.lastrowid, email, name)

    def get(self, user_id):
        row = self.conn.execute(
            "SELECT id, email, name FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return User(*row) if row else None

    def by_email(self, email):
        row = self.conn.execute(
            "SELECT id, email, name FROM users WHERE email = ?", (email.lower(),)
        ).fetchone()
        return User(*row) if row else None


class InMemoryUserRepository:
    """TODO: the same behaviour as SqliteUserRepository, using a dict."""

    def __init__(self):
        pass

    def add(self, email, name):
        pass

    def get(self, user_id):
        pass

    def by_email(self, email):
        pass


repo = SqliteUserRepository(sqlite3.connect(":memory:"))
print(repo.add("Ada@Example.com", "Ada"))
print(repo.by_email("ADA@example.com"))
` } },
      tests: [
        { name: 'add returns Users with ids 1, 2', code: py`repo = InMemoryUserRepository()
assert repo.add("ada@example.com", "Ada") == User(1, "ada@example.com", "Ada")
assert repo.add("ben@example.com", "Ben").id == 2` },
        { name: 'emails are stored lower-cased', code: py`repo = InMemoryUserRepository()
assert repo.add("Ada@Example.COM", "Ada").email == "ada@example.com"` },
        { name: 'duplicate email raises DuplicateEmail', code: py`repo = InMemoryUserRepository()
repo.add("ada@example.com", "Ada")
with raises(DuplicateEmail):
    repo.add("ADA@example.com", "Ada again")` },
        { name: 'get and by_email find users or return None', code: py`repo = InMemoryUserRepository()
ada = repo.add("ada@example.com", "Ada")
assert repo.get(ada.id) == ada
assert repo.by_email("Ada@Example.com") == ada
assert repo.get(99) is None and repo.by_email("nobody@example.com") is None` },
        { name: 'the same contract holds for SQLite and the fake', code: py`for repo in (SqliteUserRepository(sqlite3.connect(":memory:")), InMemoryUserRepository()):
    first = repo.add("Cy@Example.com", "Cy")
    assert (first.id, first.email) == (1, "cy@example.com"), type(repo).__name__
    with raises(DuplicateEmail):
        repo.add("cy@example.com", "Cy")
    assert repo.add("dee@example.com", "Dee").id == 2, type(repo).__name__` },
      ],
      solution: { files: { 'main.py': py`import sqlite3
from dataclasses import dataclass


class DuplicateEmail(Exception):
    pass


@dataclass
class User:
    id: int
    email: str
    name: str


class SqliteUserRepository:
    def __init__(self, conn):
        self.conn = conn
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users ("
            "id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL)"
        )

    def add(self, email, name):
        email = email.lower()
        try:
            with self.conn:
                cur = self.conn.execute(
                    "INSERT INTO users (email, name) VALUES (?, ?)", (email, name)
                )
        except sqlite3.IntegrityError as exc:
            raise DuplicateEmail(email) from exc
        return User(cur.lastrowid, email, name)

    def get(self, user_id):
        row = self.conn.execute(
            "SELECT id, email, name FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return User(*row) if row else None

    def by_email(self, email):
        row = self.conn.execute(
            "SELECT id, email, name FROM users WHERE email = ?", (email.lower(),)
        ).fetchone()
        return User(*row) if row else None


class InMemoryUserRepository:
    """The same behaviour as SqliteUserRepository, using a dict."""

    def __init__(self):
        self._users = {}          # id -> User
        self._next_id = 1

    def add(self, email, name):
        email = email.lower()
        if self.by_email(email) is not None:
            raise DuplicateEmail(email)
        user = User(self._next_id, email, name)
        self._users[user.id] = user
        self._next_id += 1
        return user

    def get(self, user_id):
        return self._users.get(user_id)

    def by_email(self, email):
        email = email.lower()
        return next((u for u in self._users.values() if u.email == email), None)


repo = SqliteUserRepository(sqlite3.connect(":memory:"))
print(repo.add("Ada@Example.com", "Ada"))
print(repo.by_email("ADA@example.com"))
` } },
      hints: ['Store users in a dict keyed by id, and keep a separate counter for the next id.', 'Lower-case the email at the start of add() and by_email(), and reuse by_email() for the duplicate check.', 'Return self._users.get(user_id) — dict.get already returns None for a missing key.'],
      whyAsked: 'Interviewers want to see that you can design a seam for testing and that you understand a fake must honour the real contract, including its error cases.',
      mistakes: ['Forgetting the error behaviour, so tests with the fake pass but production raises', 'Using a Mock that returns whatever the test says instead of a working fake', 'Not running the same tests against the real implementation'],
      followUps: ['How would you express this contract with a typing.Protocol?', 'Why is a by_email() lookup O(n) here, and does it matter for a test fake?', 'When would you prefer a real database in tests over a fake?'],
      modelAnswer: 'I’d back the fake with a dict from id to User and a counter for the next id. add lower-cases the email, checks for an existing user with that email and raises DuplicateEmail if there is one — the same error the SQLite version raises when the UNIQUE constraint fails — then stores the user and bumps the counter. get is just dict.get, and by_email lower-cases and searches. The important part is keeping it honest: I’d write one contract test suite and run it against both the fake and the SQLite repository, so the fast unit tests that use the fake can be trusted.',
    },
    {
      id: 'database-patterns-index-choice',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A dashboard runs `SELECT id, total FROM orders WHERE customer_id = ? ORDER BY created DESC LIMIT 20` very often. Which index serves it best?',
      options: [
        'CREATE INDEX ON orders (created, customer_id)',
        'CREATE INDEX ON orders (customer_id, created)',
        'Two separate indexes: one on customer_id, one on created',
        'CREATE INDEX ON orders (total)',
      ],
      correctOption: 1,
      answer: '(customer_id, created): the equality column first, then the sort column. The database jumps to that customer’s entries, which are already sorted by created, and reads the first 20 — no full scan and no separate sort.',
      explanation: py`A composite index is sorted by its first column, then by the second within each value of the first. With \`customer_id\` first, all of one customer's rows sit together, already ordered by \`created\`, so the \`ORDER BY ... LIMIT\` is satisfied by reading the index (backwards for \`DESC\`). With \`created\` first, a customer's rows are scattered across the whole index. Two single-column indexes usually mean the planner picks one and sorts or filters the rest itself. An index on \`total\` doesn't match the query at all. Confirm with \`EXPLAIN QUERY PLAN\`: there should be no \`USE TEMP B-TREE FOR ORDER BY\`.`,
      whyAsked: 'Choosing composite index column order is a practical skill that shows you understand how B-tree indexes are laid out.',
      mistakes: ['Putting the sort column first', 'Adding an index per column and hoping the planner combines them', 'Not checking the plan after adding the index'],
      followUps: ['Would adding total to the index help? (a covering index)', 'What does each extra index cost on writes?', 'How would you find which queries need indexes in production?'],
      modelAnswer: 'I’d create a composite index on customer_id then created. The equality filter goes first, so all of one customer’s orders are adjacent in the index, and within that range they’re already sorted by created, so the database can read the newest twenty straight from the index without sorting. Putting created first would scatter that customer’s rows, and two single-column indexes typically leave the planner using one and doing extra work for the other. I’d confirm it with EXPLAIN — no temporary sort step — and remember that every index slows down writes a little, so I add them for real, frequent queries.',
    },
    {
      id: 'database-patterns-orm-vs-sql',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You’re starting a new service with about 20 related tables, a lot of CRUD, and a few heavy reporting queries. Would you use an ORM, raw SQL, or both? How would you structure the data-access layer?',
      answer: 'Both, behind repositories: an ORM such as SQLAlchemy for the CRUD-heavy domain code and relationships, and hand-written SQL (SQLAlchemy Core or text() with bound parameters) for the heavy reports. Repositories expose domain methods and hide which technique each uses; Alembic manages the schema; query logging and query-count tests keep the ORM honest.',
      explanation: py`An ORM removes boilerplate (mapping rows to objects, tracking changes, building joins) and pairs with autogenerated migrations. Its costs are hidden queries, a learning curve and less control over complex SQL. Raw SQL gives full control and is easy to optimise but needs more code. Putting both behind repositories means callers depend on methods like \`orders_for(customer_id)\`, so you can swap the implementation of a slow method without touching business logic, and fake the repository in unit tests.`,
      whyAsked: 'It’s a design question with no single right answer; interviewers look for trade-offs, boundaries and operational awareness rather than dogma.',
      mistakes: ['"ORMs are always slow" or "raw SQL is always better" with no trade-offs', 'Letting ORM sessions and models leak into every layer', 'Forgetting migrations, testing and observability'],
      followUps: ['Where does the transaction boundary live — repository or service?', 'How do you test the repositories themselves?', 'How would you deploy a schema change with zero downtime?'],
      modelAnswer: 'I’d use both, deliberately. For twenty related tables with lots of create, read, update and delete, an ORM like SQLAlchemy saves a lot of boilerplate and gives me relationships, a unit of work and Alembic migrations. For the few heavy reports I’d write SQL by hand, through SQLAlchemy Core or text with bound parameters, so I control exactly what runs. Both sit behind repositories with domain-level methods, so the service layer never knows which technique a method uses and unit tests can use fakes. The service layer owns transaction boundaries, one per business action. And I’d log SQL in development and assert query counts on key endpoints so the ORM’s lazy loading can’t introduce N+1 problems unnoticed.',
    },
    {
      id: 'database-patterns-zero-downtime-migration',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You need to rename the column `users.email` to `email_address` in a production database while the app keeps serving traffic from several servers that are deployed one at a time. Why is a single `ALTER TABLE ... RENAME COLUMN` migration risky, and what would you do instead?',
      answer: 'During a rolling deploy, old and new code run at the same time; whichever one doesn’t match the schema breaks. Use expand/contract: add the new column, deploy code that writes both and reads the old, backfill in batches, switch reads to the new column, stop writing the old one, and drop it in a later release — each step a separate migration that both code versions tolerate.',
      explanation: py`A rename is instant for the database but not for the fleet: servers still running the previous release query \`email\` and fail the moment it disappears. Expand/contract splits the change into backwards-compatible steps. Backfills run in small batches (each its own short transaction) to avoid long locks. Each step is a reviewed Alembic migration, run by \`alembic upgrade head\` during deploy, and the final "contract" step (dropping the old column) only ships once no running code uses it.`,
      whyAsked: 'Real systems can’t stop for schema changes; this tests whether you think about deployments, compatibility and data safety, not just SQL syntax.',
      mistakes: ['Running the rename and hoping the deploy is fast', 'Backfilling millions of rows in one huge transaction', 'Editing an old migration instead of adding new ones'],
      followUps: ['How would you backfill a large table safely?', 'What would your downgrade path look like?', 'How do you make sure every environment ends up with the same schema?'],
      modelAnswer: 'The problem is that during a rolling deploy both the old and the new version of the code are running, so a single rename breaks whichever version doesn’t match the schema. I’d use the expand and contract approach. First a migration adds email_address. Then I deploy code that writes both columns, backfill existing rows in small batches, and once they match, deploy code that reads the new column. When nothing uses the old column any more, a final migration drops it in a later release. Every step is a separate, reviewed Alembic migration that’s compatible with the code before and after it, so there’s never a moment where running servers see a schema they don’t understand.',
    },
  ],

  takeaways: [
    'A transaction makes several writes all-or-nothing; in sqlite3, `with conn:` commits on success and rolls back on an exception (it doesn’t close the connection).',
    'ACID: Atomicity (all or nothing), Consistency (constraints hold), Isolation (concurrent work doesn’t leak, to a chosen level), Durability (committed means saved).',
    'Check and change in one statement (UPDATE ... WHERE stock >= ?) and read rowcount — read-check-write in Python loses updates under concurrency.',
    'A repository keeps SQL in one class and returns plain objects; business logic receives it as a parameter, so tests can pass a fake that honours the same contract.',
    'N+1 = one query per row. Count queries (set_trace_callback, echo=True), then fix with a JOIN, an IN (...) batch, or selectinload/joinedload.',
    'Indexes turn SCAN into SEARCH for WHERE, JOIN and ORDER BY columns; prove it with EXPLAIN QUERY PLAN and remember each index costs writes.',
    'SQLAlchemy 2.0: DeclarativeBase + Mapped/mapped_column models, select() queries, Session as the unit of work. Alembic versions schema changes; never edit an applied migration.',
  ],
}
