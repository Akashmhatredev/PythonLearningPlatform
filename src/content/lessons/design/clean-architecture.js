// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const DOMAIN = py`"""Domain layer: entities and business rules. Imports nothing from the app."""
from dataclasses import dataclass


class BookingError(Exception):
    """A booking problem the customer can do something about."""


class SoldOut(BookingError):
    """Raised when a booking asks for more seats than are left."""


class EventNotFound(BookingError):
    """Raised when no event has the requested id."""


@dataclass
class Event:
    event_id: str
    name: str
    capacity: int
    booked: int = 0

    @property
    def seats_left(self):
        return self.capacity - self.booked

    def book(self, seats):
        if seats < 1:
            raise ValueError("book at least one seat")
        if seats > self.seats_left:
            raise SoldOut(f"only {self.seats_left} seat(s) left for {self.name}")
        self.booked += seats
`

const SERVICES = py`"""Service layer: use cases. Depends on the domain and on ports -- never on adapters."""
from typing import Protocol

from domain import Event


class EventRepository(Protocol):
    """Port: how the use case loads and stores events."""

    def get(self, event_id: str) -> Event: ...

    def save(self, event: Event) -> None: ...


class Notifier(Protocol):
    """Port: how the use case tells a customer something."""

    def send(self, to: str, message: str) -> None: ...


class BookingService:
    def __init__(self, events: EventRepository, notifier: Notifier):
        self.events = events
        self.notifier = notifier

    def book(self, event_id: str, customer: str, seats: int) -> int:
        """Book seats for a customer and return how many seats are left."""
        event = self.events.get(event_id)
        event.book(seats)
        self.events.save(event)
        self.notifier.send(customer, f"Booked {seats} seat(s) for {event.name}")
        return event.seats_left
`

const REPOSITORIES = py`"""Adapters: concrete implementations of the ports, at the edge of the app."""
import sqlite3
from dataclasses import replace

from domain import Event, EventNotFound


class SqliteEventRepository:
    def __init__(self, connection: sqlite3.Connection):
        self.connection = connection
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS events"
            " (event_id TEXT PRIMARY KEY, name TEXT, capacity INTEGER, booked INTEGER)"
        )

    def get(self, event_id):
        row = self.connection.execute(
            "SELECT event_id, name, capacity, booked FROM events WHERE event_id = ?",
            (event_id,),
        ).fetchone()
        if row is None:
            raise EventNotFound(f"no event called {event_id!r}")
        return Event(*row)          # translate a database row into a domain object

    def save(self, event):
        with self.connection:       # commit, or roll back if something fails
            self.connection.execute(
                "INSERT OR REPLACE INTO events VALUES (?, ?, ?, ?)",
                (event.event_id, event.name, event.capacity, event.booked),
            )


class InMemoryEventRepository:
    """A fake for tests: same contract as the SQLite adapter, no database."""

    def __init__(self, *events):
        self._events = {event.event_id: replace(event) for event in events}

    def get(self, event_id):
        if event_id not in self._events:
            raise EventNotFound(f"no event called {event_id!r}")
        return replace(self._events[event_id])   # hand out a copy, like a database

    def save(self, event):
        self._events[event.event_id] = replace(event)


class ConsoleNotifier:
    def send(self, to, message):
        print(f"[email to {to}] {message}")
`

const MAIN = py`"""Entry point and composition root: build the adapters, inject them, run."""
import sqlite3

from domain import BookingError, Event
from repositories import ConsoleNotifier, SqliteEventRepository
from services import BookingService


def build_service():
    events = SqliteEventRepository(sqlite3.connect(":memory:"))
    events.save(Event("pycon", "PyCon talk", capacity=3))
    return BookingService(events, ConsoleNotifier())


def main():
    service = build_service()
    print("seats left:", service.book("pycon", "ada@example.com", 2))
    for event_id, customer in [("pycon", "ben@example.com"), ("jsconf", "cy@example.com")]:
        try:
            service.book(event_id, customer, 2)
        except BookingError as error:
            print(f"sorry {customer} -> {type(error).__name__}: {error}")


if __name__ == "__main__":
    main()
`

// Shared by the experiment tests: a fake notifier that records messages.
const FAKE_NOTIFIER = py`class RecordingNotifier:
    def __init__(self):
        self.sent = []

    def send(self, to, message):
        self.sent.append((to, message))

domain = module('domain')
services = module('services')
repositories = module('repositories')
`

const DI_TRACE = py`class InMemoryEvents:
    def __init__(self):
        self.seats = {"pycon": 3}

    def get(self, event_id):
        return self.seats[event_id]

    def save(self, event_id, seats_left):
        self.seats[event_id] = seats_left


class BookingService:
    def __init__(self, events):
        self.events = events

    def book(self, event_id, wanted):
        left = self.events.get(event_id)
        if wanted > left:
            raise ValueError("sold out")
        self.events.save(event_id, left - wanted)
        return left - wanted


service = BookingService(InMemoryEvents())
print(service.book("pycon", 2), service.events.seats)
`

const SIGNUP_MAIN = py`from fakes import FakeMailer, InMemoryUserRepository
from services import EmailTaken, SignupService

users = InMemoryUserRepository()
mailer = FakeMailer()
service = SignupService(users, mailer)

service.sign_up(" Ada@Example.com", "Ada")
try:
    service.sign_up("ada@example.com", "Ada again")
except EmailTaken as error:
    print("rejected duplicate:", error)
print("emails sent:", mailer.sent)
`

const SIGNUP_SERVICES = py`"""Use case: sign up a new user. Depends only on ports."""
from dataclasses import dataclass
from typing import Protocol


@dataclass
class User:
    email: str
    name: str


class EmailTaken(Exception):
    """Raised when an email address is already registered."""


class UserRepository(Protocol):
    def get_by_email(self, email: str) -> User | None: ...

    def add(self, user: User) -> None: ...


class Mailer(Protocol):
    def send(self, to: str, subject: str) -> None: ...


class SignupService:
    def __init__(self, users: UserRepository, mailer: Mailer):
        self.users = users
        self.mailer = mailer

    def sign_up(self, email, name):
        email = email.strip().lower()
        if self.users.get_by_email(email) is not None:
            raise EmailTaken(email)
        user = User(email, name)
        self.users.add(user)
        self.mailer.send(email, f"Welcome, {name}!")
        return user
`

export default {
  id: 'clean-architecture',
  title: 'Clean architecture & dependency injection',
  summary: 'Organise an application in layers — domain, use cases, adapters and entry points — with every dependency pointing inward, so business rules can be tested with fakes and infrastructure can be swapped freely.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['solid', 'protocols', 'modules-and-imports'],
  related: ['solid', 'design-patterns', 'clean-code', 'protocols', 'database-patterns', 'sql-and-sqlite', 'building-apis', 'mocking', 'fixtures', 'project-structure', 'dataclasses', 'custom-exceptions'],
  tags: ['clean architecture', 'hexagonal architecture', 'ports and adapters', 'onion architecture', 'layers', 'dependency rule', 'dependency injection', 'composition root', 'repository pattern', 'use case', 'service layer', 'domain model', 'fakes', 'test doubles', 'Protocol'],
  apis: [
    { name: 'typing.Protocol', summary: 'Declares a port: the methods a use case needs, satisfied structurally by any adapter.' },
    { name: 'dataclasses.replace(obj, **changes)', summary: 'Returns a copy of a dataclass instance — handy for fakes that must not share objects with callers.' },
    { name: 'sqlite3.connect(":memory:")', summary: 'An in-memory SQLite database: a real adapter that needs no files or server.' },
    { name: 'with connection:', summary: 'A sqlite3 connection used as a context manager commits on success and rolls back on an exception.' },
  ],
  docs: [
    { label: 'typing — Protocols', url: 'https://docs.python.org/3/library/typing.html#typing.Protocol' },
    { label: 'PEP 544 — Protocols: structural subtyping', url: 'https://peps.python.org/pep-0544/' },
    { label: 'dataclasses — replace()', url: 'https://docs.python.org/3/library/dataclasses.html#dataclasses.replace' },
    { label: 'sqlite3 — how to use the connection context manager', url: 'https://docs.python.org/3/library/sqlite3.html#sqlite3-connection-context-manager' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Clean architecture** is a way of organising a whole application, not just one class. You split the code into **layers** and follow one rule about how they may depend on each other. (Similar ideas go by the names *hexagonal architecture* or *ports and adapters*, and *onion architecture*.)`,
    py`The four layers, from the inside out:`,
    py`1. **Domain** — the business concepts and rules: an \`Event\` has a capacity, you can't book more seats than are left. Plain Python, no databases, no web frameworks.
2. **Services (use cases)** — what the application *does*: "book seats for a customer". They coordinate the domain and talk to the outside world only through **ports**: small interfaces such as "something that can \`get\` and \`save\` events".
3. **Adapters** — concrete implementations of the ports: a SQLite repository, an in-memory one for tests, an email sender.
4. **Entry points** — how the app is started or called: \`main.py\`, a command-line tool, a web route. The entry point creates the adapters and hands them to the services.`,
    py`**The dependency rule:** source code dependencies point **inward only**. Domain imports nothing from the app; services import the domain; adapters import services' ports and the domain; entry points may import anything. Handing the concrete adapters to the services from outside is **dependency injection** — the [SOLID](lesson:solid) "D" applied to a whole program.`,
  ],
  why: [
    py`**Business rules outlive technology.** You might move from SQLite to PostgreSQL, from a CLI to a web API, from one email provider to another. If the rules don't import any of those, they don't change when those do.`,
    py`**Fast, simple tests.** A use case that receives its repository can be tested with an in-memory fake in milliseconds — no database to start, no network, no mocking library. Most of your tests can be like that.`,
    py`**A place for everything.** "Where does the max-4-seats rule go?" has an answer (domain). "Where do we talk SQL?" has an answer (an adapter). New team members find things, and changes stay local.`,
  ],
  eli15: [
    py`Think of a school. In the middle are the **school rules**: you need 75% attendance to pass, a class holds 30 students. Those rules don't care whether attendance is recorded on paper, in a spreadsheet or in an app.`,
    py`Around the rules are the **office staff** who carry out tasks: "enrol this student" means check the rules, update the records, send a letter home. They don't care *how* records are stored either — they just ask "the records cupboard" to find or file something.`,
    py`Then come the actual **cupboards, computers and post office** (adapters), and finally the **front desk** where requests come in (entry point). You can replace the filing cabinet with a computer and the rules don't change at all. And to practise, you can use a pretend cupboard made of sticky notes — that's testing with a fake.`,
  ],
  analogy: {
    title: 'A restaurant kitchen',
    body: [
      py`The **recipes** are the domain: what a carbonara is, how long it cooks. The **head chef** runs use cases: "an order for table 4 arrived — get ingredients, follow the recipe, send it out". The chef asks the pantry for "eggs" without caring whether they come from the walk-in fridge or a delivery van — the pantry hatch is a **port**.`,
      py`The fridge, the supplier and the waiters are **adapters**. The restaurant manager who opens in the morning, hires the supplier and puts everyone in place is the **composition root**. And a cooking school can train the chef with a pretend pantry: same hatch, plastic eggs — a **fake**.`,
    ],
    mapping: [
      ['recipes', 'the domain: Event, book(), seats_left'],
      ['the head chef handling an order', 'a use case: BookingService.book()'],
      ['the pantry hatch: "give me eggs"', 'a port: the EventRepository Protocol'],
      ['the walk-in fridge, the supplier', 'adapters: SqliteEventRepository, ConsoleNotifier'],
      ['the manager who sets everything up', 'the composition root: build_service() in main.py'],
      ['a training pantry with plastic eggs', 'a fake: InMemoryEventRepository in tests'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Layers and the dependency rule',
    props: {
      width: 780,
      height: 330,
      nodes: [
        { id: 'main', label: 'main.py', note: 'entry point · composition root', x: 120, y: 70, tone: 'ink' },
        { id: 'adapters', label: 'repositories.py', note: 'adapters: SQLite, in-memory, console', x: 120, y: 250, tone: 'kraft' },
        { id: 'services', label: 'services.py', note: 'use cases + ports (Protocols)', x: 420, y: 110, tone: 'blue' },
        { id: 'domain', label: 'domain.py', note: 'Event, rules · imports nothing', x: 670, y: 170, tone: 'yellow' },
        { id: 'world', label: 'SQLite · email · files', note: 'the outside world', x: 430, y: 285, tone: 'paper' },
      ],
      edges: [
        { from: 'services', to: 'domain', label: 'uses' },
        { from: 'adapters', to: 'services', label: 'implements ports', dashed: true },
        { from: 'adapters', to: 'domain', label: 'maps rows ↔ Event' },
        { from: 'adapters', to: 'world', label: 'talks to' },
        { from: 'main', to: 'adapters', label: 'creates' },
        { from: 'main', to: 'services', label: 'creates & calls' },
      ],
      steps: [
        { focus: ['domain'], text: py`**Domain** at the centre: \`Event\`, its rules (\`book\`, \`seats_left\`) and its errors. It imports nothing from the app — no SQL, no HTTP, no framework — so it is the easiest code to test and the slowest to change.` },
        { focus: ['services', 'domain'], edges: ['services->domain'], text: py`**Use cases** orchestrate: load the event, apply the domain rule, save, notify. They declare **ports** (\`Protocol\`s) for what they need from the outside, and depend on nothing more concrete than that.` },
        { focus: ['adapters', 'world'], edges: ['adapters->services', 'adapters->domain', 'adapters->world'], text: py`**Adapters** implement the ports with real technology — SQLite, email, files — and translate between the outside world's shapes (rows, JSON) and domain objects. They depend *inward*, on the ports and the domain.` },
        { focus: ['main'], edges: ['main->adapters', 'main->services'], text: py`The **entry point** is the *composition root*: the one place that knows every concrete class. It builds the adapters and injects them into the services.` },
        { focus: ['main', 'adapters', 'services', 'domain'], edges: ['services->domain', 'adapters->services', 'adapters->domain', 'main->adapters', 'main->services'], text: py`**The dependency rule:** every arrow points inward. Nothing inner imports anything outer, so you can swap SQLite for an in-memory fake in tests, or a CLI for a web API, without touching a single business rule.` },
      ],
    },
    alt: 'Diagram of four layers. domain.py on the right imports nothing. services.py has an arrow to domain.py. repositories.py has a dashed arrow to services.py (implements ports), an arrow to domain.py (maps rows to Event) and an arrow to the outside world (SQLite, email, files). main.py, the composition root, has arrows to repositories.py (creates) and services.py (creates and calls). All dependency arrows point inward toward the domain.',
    caption: py`These are the four files of the playground below. An arrow means "imports / knows about".`,
  },
  syntax: [
    py`#### The layers as Python modules`,
    py`For a small app, one module per layer is plenty (bigger apps use one package per layer, see [project structure](lesson:project-structure)). The *imports* are what enforce the architecture:`,
    py`| module | contains | may import |
|---|---|---|
| \`domain.py\` | entities, value objects, business rules, domain errors | the standard library only |
| \`services.py\` | use cases, ports (\`Protocol\`s) | \`domain\` |
| \`repositories.py\` | adapters: SQL, files, HTTP clients, email | \`domain\`, \`services\` (for port types), third-party libraries |
| \`main.py\` | entry point, composition root, configuration | everything |`,
    py`#### Ports: Protocols owned by the inner layer`,
    py`A **port** describes what a use case needs, in the use case's own words. It lives *with the use case*, not with the database code — that's the "inversion": the low-level adapter conforms to an interface the high-level code defined.`,
    { code: py`from typing import Protocol


class Event:  # stand-in for domain.Event
    ...


class EventRepository(Protocol):
    def get(self, event_id: str) -> Event: ...

    def save(self, event: Event) -> None: ...`, lang: 'python', title: 'a port (see protocols)' },
    py`Because \`Protocol\` is structural ([protocols](lesson:protocols)), adapters don't even need to inherit from it — a type checker confirms they match at the place where they're injected.`,
    py`#### Adapters translate`,
    py`An adapter implements the port with real technology and translates between the outside world's shapes and domain objects: a SQL row becomes an \`Event\`; an \`Event\` becomes a parameterised \`INSERT\`. SQL, file paths and HTTP status codes never leak inward.`,
    py`#### Dependency injection by constructor`,
    py`Services receive their adapters as constructor arguments — no framework, no global variables, no hidden imports:`,
    { code: py`class BookingService:
    def __init__(self, events, notifier):     # injected, never created here
        self.events = events
        self.notifier = notifier`, lang: 'python', title: 'constructor injection' },
    py`#### The composition root`,
    py`Exactly one place — usually \`main()\` or an app factory — knows every concrete class and wires them together. It also reads configuration (environment variables, files) and passes plain values inward.`,
    { code: py`import os
import sqlite3


def build_service(database_path=None):
    path = database_path or os.environ.get("BOOKINGS_DB", ":memory:")
    events = SqliteEventRepository(sqlite3.connect(path))
    return BookingService(events, ConsoleNotifier())`, lang: 'python', title: 'wiring, once, at the edge', static: true },
    py`#### Testing with fakes`,
    py`A **fake** is a working, simplified implementation of a port — like an in-memory repository. Unlike a mock, which checks *which calls* were made, a fake lets you check *outcomes*: after booking, is the event's \`booked\` count right?`,
    { code: py`def test_booking_reduces_seats():
    events = InMemoryEventRepository(Event("pycon", "PyCon talk", capacity=3))
    notifier = RecordingNotifier()
    service = BookingService(events, notifier)

    assert service.book("pycon", "ada@example.com", 2) == 1
    assert events.get("pycon").booked == 2
    assert notifier.sent == [("ada@example.com", "Booked 2 seat(s) for PyCon talk")]`, lang: 'python', title: 'a use-case test with fakes', static: true },
    { callout: 'warn', title: 'A fake must honour the contract', text: py`A real database hands you a *new* object on every read, so if a use case forgets \`save()\`, the change is lost. A fake that hands out its stored object directly would hide that bug — the change "sticks" without a save. That's why the playground's fake copies with \`dataclasses.replace\`. Production teams often run one shared *contract test* against both the fake and the real adapter.` },
  ],
  walkthrough: {
    title: 'Reading the use case (services.py)',
    lang: 'python',
    code: SERVICES,
    intro: py`This is \`services.py\` from the playground — the heart of the application logic. Notice what it does *not* import.`,
    steps: [
      { lines: [1, 4], text: py`The only project import is \`domain\`. No \`sqlite3\`, no \`repositories\`, no \`print\`-based notifier. The use case cannot depend on infrastructure even by accident.` },
      { lines: [7, 12], text: py`A **port**, written in the use case's language: "I need something that can \`get\` an event by id and \`save\` it." The \`...\` bodies are normal: a \`Protocol\` only describes a shape.` },
      { lines: [15, 18], text: py`A second port. The use case wants to *notify a customer*; whether that's email, SMS or a print statement is an adapter's business.` },
      { lines: [21, 24], text: py`**Constructor injection.** The service is handed both dependencies. It never calls \`SqliteEventRepository(...)\` itself, so tests can hand it fakes.` },
      { lines: [28, 28], text: py`Load through the port. If the event doesn't exist, the adapter raises the *domain* error \`EventNotFound\`, so the use case doesn't need to know about SQL rows or \`KeyError\`s.` },
      { lines: [29, 29], text: py`The business rule lives in the domain object. The use case doesn't re-check capacity — it *asks* the event to book, and the event enforces its own rules.` },
      { lines: [30, 32], text: py`Persist, notify, return a plain value. The order matters: save first, so a customer is never told about a booking that wasn't stored.` },
    ],
  },
  playground: {
    title: 'Event booking in four layers',
    objective: 'Add a rule, a use case, an adapter and a test — each in its own layer — and watch the tests swap in an in-memory repository.',
    files: { 'main.py': MAIN, 'domain.py': DOMAIN, 'services.py': SERVICES, 'repositories.py': REPOSITORIES },
    expected: py`\`\`\`text
[email to ada@example.com] Booked 2 seat(s) for PyCon talk
seats left: 1
sorry ben@example.com -> SoldOut: only 1 seat(s) left for PyCon talk
sorry cy@example.com -> EventNotFound: no event called 'jsconf'
\`\`\`

The SQLite adapter runs against an in-memory database. Open each file: only \`main.py\` mentions concrete classes from more than one layer.`,
    experiments: [
      {
        id: 'max-four-seats',
        task: py`**Domain rule:** no single booking may be for more than **4** seats (raise \`ValueError\`). Put the rule in the layer it belongs to, so it applies no matter which adapter or entry point is used.`,
        hint: py`It's a business rule, so it goes in \`Event.book()\` in \`domain.py\`: \`if seats > 4: raise ValueError("at most 4 seats per booking")\`. A named constant such as \`MAX_SEATS_PER_BOOKING = 4\` is even better.`,
        tests: [
          { name: 'Event refuses 5 seats', code: py`${FAKE_NOTIFIER}
with raises(ValueError):
    domain.Event("gig", "Gig", capacity=10).book(5)` },
          { name: 'the service enforces it too (with an in-memory repository)', code: py`${FAKE_NOTIFIER}
events = repositories.InMemoryEventRepository(domain.Event("gig", "Gig", capacity=10))
service = services.BookingService(events, RecordingNotifier())
with raises(ValueError):
    service.book("gig", "ada@example.com", 5)
assert service.book("gig", "ada@example.com", 4) == 6` },
        ],
        explain: py`Rules in the domain apply everywhere — CLI, web API, batch jobs — and are tested without any infrastructure. Notice the second test built the whole use case with an in-memory repository: no SQLite involved.`,
      },
      {
        id: 'cancel-use-case',
        task: py`**New use case:** add \`Event.cancel(seats)\` in the domain (raise \`ValueError\` if \`seats\` is below 1 or more than are booked) and \`BookingService.cancel(event_id, customer, seats)\` that loads, cancels, saves, notifies \`"Cancelled <n> seat(s) for <name>"\` and returns the seats left.`,
        hint: py`Copy the shape of \`book\`: the domain method changes \`self.booked\`, and the service method does get → cancel → save → send → return.`,
        tests: [
          { name: 'cancel frees seats and is saved', code: py`${FAKE_NOTIFIER}
events = repositories.InMemoryEventRepository(domain.Event("gig", "Gig", capacity=10, booked=3))
notifier = RecordingNotifier()
service = services.BookingService(events, notifier)
assert service.cancel("gig", "ada@example.com", 2) == 9
assert events.get("gig").booked == 1, 'save the event after cancelling'
assert notifier.sent == [("ada@example.com", "Cancelled 2 seat(s) for Gig")]` },
          { name: 'cannot cancel more than are booked', code: py`${FAKE_NOTIFIER}
with raises(ValueError):
    domain.Event("gig", "Gig", capacity=10, booked=1).cancel(2)` },
        ],
        explain: py`A new use case touched two inner files and no adapter. The in-memory fake hands out copies, so if you forget \`self.events.save(event)\`, the test fails exactly as production would.`,
      },
      {
        id: 'json-adapter',
        task: py`**New adapter:** in \`repositories.py\`, add \`JsonFileEventRepository(path)\` with the same \`get\`/\`save\` contract, storing all events in one JSON file (\`{event_id: {...fields...}}\`). \`get\` must raise \`EventNotFound\` for unknown ids, even before the file exists. Don't change \`services.py\`.`,
        hint: py`Use \`pathlib.Path\`, \`json\` and \`dataclasses.asdict\`. A helper \`_load()\` that returns \`{}\` when the file doesn't exist keeps \`get\` and \`save\` short: \`Event(**data[event_id])\` rebuilds an event.`,
        tests: [
          { name: 'events survive a round trip through the file', code: py`${FAKE_NOTIFIER}
from pathlib import Path
Path('events_test.json').unlink(missing_ok=True)
repo = repositories.JsonFileEventRepository('events_test.json')
repo.save(domain.Event("gig", "Gig", capacity=5, booked=1))
again = repositories.JsonFileEventRepository('events_test.json')
assert again.get("gig") == domain.Event("gig", "Gig", capacity=5, booked=1)` },
          { name: 'unknown ids raise EventNotFound', code: py`${FAKE_NOTIFIER}
from pathlib import Path
Path('events_missing.json').unlink(missing_ok=True)
with raises(domain.EventNotFound):
    repositories.JsonFileEventRepository('events_missing.json').get("nope")` },
          { name: 'the unchanged use case works with it', code: py`${FAKE_NOTIFIER}
from pathlib import Path
Path('events_service.json').unlink(missing_ok=True)
repo = repositories.JsonFileEventRepository('events_service.json')
repo.save(domain.Event("gig", "Gig", capacity=5))
assert services.BookingService(repo, RecordingNotifier()).book("gig", "ada@example.com", 2) == 3
assert repo.get("gig").booked == 2` },
        ],
        explain: py`The use case ran against a third storage technology without a single edit — that's what "depend on ports, not adapters" buys. Swapping SQLite for PostgreSQL in production would look exactly the same.`,
      },
      {
        id: 'test-with-fakes',
        task: py`**Write a test:** in \`main.py\`, define \`test_booking_sends_confirmation()\` that builds a \`BookingService\` with an \`InMemoryEventRepository\` and a small fake notifier class of your own, books 1 seat, and asserts that exactly one message was sent to the right customer.`,
        hint: py`Import \`InMemoryEventRepository\` from \`repositories\`. Your fake can be \`class FakeNotifier:\` with a \`sent\` list and a \`send(self, to, message)\` that appends \`(to, message)\`.`,
        tests: [
          { name: 'the test function exists and uses the in-memory repository', code: py`assert callable(ns.get('test_booking_sends_confirmation')), 'Define test_booking_sends_confirmation() in main.py'
assert 'InMemoryEventRepository' in test_booking_sends_confirmation.__code__.co_names, 'Build the service with InMemoryEventRepository'` },
          { name: 'your test passes', code: py`test_booking_sends_confirmation()` },
        ],
        explain: py`No database, no printing, no \`unittest.mock\` — just objects that honour the ports. Tests like this run in microseconds, so you can have thousands. A few slower *integration* tests then check the real SQLite adapter.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Injection in action (simplified)',
    props: {
      code: DI_TRACE,
      notes: {
        3: 'A fake repository: just a dict in memory. **Simplified** — the real port in the playground uses domain `Event` objects.',
        14: 'The service stores whatever repository it is *given*. It has no idea this one is a fake.',
        17: 'Load through the injected object…',
        20: '…and save through it. Watch the dict inside `InMemoryEvents` change.',
        24: 'The composition root (here, the last lines) picks the concrete class. In production it would pass a SQLite repository instead — same service code.',
      },
    },
    alt: 'A step-by-step trace. An InMemoryEvents object holding {"pycon": 3} is passed into BookingService. book("pycon", 2) calls events.get, gets 3, calls events.save with 1, and returns 1. The final print shows 1 and the fake\'s dict {"pycon": 1}.',
    caption: py`Watch the arrows: \`service.events\` points to the fake created on the last lines — that's the whole of dependency injection.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`"Depends on" just means "imports" or "knows the name of". If \`services.py\` contains \`from repositories import SqliteEventRepository\`, services depend on SQLite. If it only knows a \`Protocol\` it defined itself, it depends on nothing concrete.`,
      py`Why inward? The inside (rules) changes for *business* reasons; the outside (databases, frameworks, email providers) changes for *technical* reasons. Pointing dependencies inward means technical changes never ripple into the rules.`,
      py`Layers are not about folders or class counts. A 300-line app can follow the dependency rule with four small modules — and you can check it just by reading the import lines at the top of each file.`,
    ],
    technical: [
      py`**Python's import system is the enforcement mechanism.** Breaking the rule usually shows up as a *circular import*: if \`domain.py\` imports \`services\` while \`services.py\` imports \`domain\`, Python hits a half-initialised module:`,
      { code: py`ImportError: cannot import name 'BookingService' from partially initialized module 'services' (most likely due to a circular import)`, lang: 'text', title: 'the classic symptom' },
      py`The fix is never "move the import inside a function"; it's to restore the direction — the domain shouldn't need the service at all. Teams can make the rule machine-checked with a third-party tool such as *import-linter*, which fails CI when a "layers" contract is broken.`,
      py`**Structural ports decouple even the type imports.** With \`Protocol\`, an adapter needn't import the port to satisfy it; mypy or pyright verifies the match where the adapter is passed to the service. With an ABC, the adapter must inherit (and import) it — still allowed by the rule, since adapters may depend inward.`,
      py`**Translation at the boundary.** Adapters map between representations: SQL rows ↔ \`Event\`, JSON ↔ \`Event\`, HTTP requests ↔ use-case arguments. Keeping the domain free of these shapes is what lets it be tested with plain objects. The cost is mapping code — a real cost to weigh.`,
      py`**Transactions.** A use case that changes several things (book a seat *and* charge a card) needs them to succeed or fail together. The usual answer is a *Unit of Work* port — an object the use case enters with \`with uow:\` that commits or rolls back — see [database patterns](lesson:database-patterns).`,
    ],
    production: [
      py`**Names you'll hear:** *Hexagonal architecture / ports and adapters* (Alistair Cockburn), *Onion architecture* (Jeffrey Palermo), *Clean Architecture* (Robert C. Martin). They differ in vocabulary, not in the core idea: business logic in the middle, dependencies pointing at it. The book *Architecture Patterns with Python* (Percival & Gregory) applies them to Python step by step.`,
      py`**Frameworks belong at the edge.** A FastAPI route or Django view is an *entry point*: parse the request, call a use case, turn the result or a domain error into an HTTP response ([building APIs](lesson:building-apis)). Framework helpers like FastAPI's \`Depends\` can do the wiring, but the service itself stays framework-free.`,
      { code: py`@app.post("/events/{event_id}/bookings")
def create_booking(event_id: str, body: BookingRequest,
                   service: BookingService = Depends(get_booking_service)):
    try:
        left = service.book(event_id, body.email, body.seats)
    except SoldOut as error:
        raise HTTPException(status_code=409, detail=str(error))
    return {"seats_left": left}`, lang: 'python', title: 'a thin FastAPI entry point (third-party, not runnable here)', static: true },
      py`**A testing pyramid that falls out naturally:** many fast unit tests on the domain; use-case tests with fakes; a smaller set of integration tests that run each real adapter against real infrastructure (a test database); a handful of end-to-end tests through the entry point. A *contract test* — one test function run against both the fake and the real adapter — keeps fakes honest.`,
      { code: py`def check_event_repository_contract(repo, Event, EventNotFound):
    repo.save(Event("gig", "Gig", capacity=5))
    copy = repo.get("gig")
    copy.booked = 3                       # changing a loaded copy...
    assert repo.get("gig").booked == 0    # ...must not change storage until save()
    repo.save(copy)
    assert repo.get("gig").booked == 3
    try:
        repo.get("missing")
    except EventNotFound:
        pass
    else:
        raise AssertionError("get() must raise EventNotFound")`, lang: 'python', title: 'one contract, run against every adapter' },
      py`**Scale it to the problem.** For a small CRUD admin tool, layers can be overhead: a framework's ORM used directly may be the right call. Clean architecture pays off when business rules are rich, the app will live long, or infrastructure is likely to change — and you can adopt it gradually, one use case at a time.`,
    ],
  },
  mistakes: [
    {
      title: 'The domain imports infrastructure',
      wrong: { code: py`# domain.py
import sqlite3


class Event:
    def book(self, seats):
        connection = sqlite3.connect("bookings.db")
        ...`, lang: 'python', static: true },
      right: { code: py`# domain.py -- pure rules, no I/O
class Event:
    def book(self, seats):
        if seats > self.seats_left:
            raise SoldOut(...)
        self.booked += seats
# Loading and saving happen in an adapter, called by the use case.`, lang: 'python', static: true },
      explanation: py`Once the domain opens database connections, every rule test needs a database, and changing storage means editing business rules. Keep the domain pure; let a repository adapter do the I/O.`,
    },
    {
      title: 'Business rules in the entry point',
      wrong: { code: py`@app.post("/bookings")
def create_booking(request):
    event = repo.get(request.event_id)
    if request.seats > 4 or request.seats > event.capacity - event.booked:
        return {"error": "nope"}, 400
    event.booked += request.seats
    repo.save(event)`, lang: 'python', static: true },
      right: { code: py`@app.post("/bookings")
def create_booking(request):
    try:
        left = booking_service.book(request.event_id, request.email, request.seats)
    except BookingError as error:
        return {"error": str(error)}, 409
    return {"seats_left": left}, 201`, lang: 'python', static: true },
      explanation: py`Rules written in a web handler must be rewritten for the CLI, the batch job and the admin tool — and they drift apart. The handler should translate HTTP to a use-case call and back, nothing more.`,
    },
    {
      title: 'Services that create their own adapters',
      wrong: { code: py`class BookingService:
    def __init__(self):
        self.events = SqliteEventRepository(sqlite3.connect("prod.db"))`, lang: 'python', static: true },
      right: { code: py`class BookingService:
    def __init__(self, events, notifier):
        self.events = events
        self.notifier = notifier`, lang: 'python' },
      explanation: py`Creating the adapter inside the service points a dependency outward and makes the service untestable without the production database. Inject it; build it in the composition root.`,
    },
    {
      title: 'A fake that shares objects with its callers',
      wrong: { code: py`class InMemoryEventRepository:
    def __init__(self, *events):
        self._events = {event.event_id: event for event in events}

    def get(self, event_id):
        return self._events[event_id]      # the stored object itself

    def save(self, event):
        pass                               # changes already "stuck"`, lang: 'python' },
      right: { code: py`from dataclasses import replace


class InMemoryEventRepository:
    def __init__(self, *events):
        self._events = {event.event_id: replace(event) for event in events}

    def get(self, event_id):
        return replace(self._events[event_id])   # a copy, like a database

    def save(self, event):
        self._events[event.event_id] = replace(event)`, lang: 'python' },
      explanation: py`With the wrong fake, a use case that forgets \`save()\` still passes its tests, then loses data in production. Fakes must behave like the real thing where it matters — and \`KeyError\` should become the domain's \`EventNotFound\` too. See [mutability & copying](lesson:mutability-and-copying).`,
    },
    {
      title: 'Layers for a two-screen CRUD tool',
      wrong: { code: py`# 14 files, 3 Protocols, 2 mappers and a DI container
# ...to edit one table of office phone numbers.`, lang: 'text' },
      right: { code: py`# A framework admin page, or one module with a few functions
# and a couple of tests. Add layers if real rules appear.`, lang: 'text' },
      explanation: py`Architecture is a cost you pay to protect business rules from change. With no real rules to protect, the ceremony just slows everyone down.`,
    },
  ],
  debugging: [
    {
      symptom: py`ImportError: cannot import name 'BookingService' from partially initialized module 'services' (most likely due to a circular import)`,
      cause: py`An inner module imports an outer one (for example \`domain.py\` importing \`services\`), creating a cycle that violates the dependency rule.`,
      fix: py`Remove the outward import. Move whatever the inner module needed inward (a domain error, a value object), or invert it with a port the outer layer implements.`,
    },
    {
      symptom: py`TypeError: BookingService.__init__() missing 1 required positional argument: 'notifier'`,
      cause: py`The composition root (or a test) forgot to inject a dependency after a new port was added to the service.`,
      fix: py`Wire the new adapter in \`main()\` / the app factory, and give tests a fake. Keeping all wiring in one place makes this a one-line fix.`,
    },
    {
      symptom: py`AttributeError: 'InMemoryEventRepository' object has no attribute 'list_upcoming'`,
      cause: py`The port grew a method and the real adapter was updated, but the fake wasn't.`,
      fix: py`Annotate the service's parameters with the \`Protocol\` and run a type checker — it reports adapters that no longer match. A shared contract test catches behavioural drift too.`,
    },
    {
      symptom: py`All tests pass with the fake, but production loses updates`,
      cause: py`The fake returns its stored objects directly, so a use case that never calls \`save()\` looks correct in tests.`,
      fix: py`Make the fake return copies (\`dataclasses.replace\`), and run the same contract test against both the fake and the real repository.`,
    },
  ],
  bestPractices: [
    'Keep the domain pure: entities and rules in plain Python, importing only the standard library.',
    'Define ports (small Protocols) next to the use cases that need them, in the use case\'s own vocabulary.',
    'Inject adapters through constructors; build and wire concrete objects in one composition root.',
    'Make adapters translate at the boundary — rows, JSON and HTTP never reach the domain.',
    'Raise domain errors from adapters (EventNotFound, not KeyError or a driver exception).',
    'Test the domain directly, use cases with fakes, and real adapters with a few integration tests; share a contract test between fake and real.',
    'Read your import lines: every one should point inward. Consider an import-linter contract in CI for larger codebases.',
    'Adopt the layers gradually and only where business rules justify them.',
  ],
  whenToUse: {
    use: [
      'Applications with real business rules (pricing, bookings, payroll, workflows) that will live for years.',
      'Systems likely to change infrastructure: database, message queue, email or payment provider.',
      'Code with several entry points (web API, CLI, scheduled jobs) sharing the same logic.',
      'Teams that want fast, reliable tests without spinning up databases for every test.',
    ],
    avoid: [
      'Scripts, prototypes and data notebooks.',
      'Thin CRUD apps where the framework\'s ORM and admin already do everything.',
      'Introducing a third-party DI container before constructor injection has become painful.',
      'Creating one port per method or mapping layers that only copy fields one-to-one with no rules in between.',
    ],
  },
  comparison: {
    title: 'The layers at a glance',
    headers: ['layer', 'contains', 'may import', 'in the playground', 'test it with'],
    rows: [
      ['domain', 'entities, rules, domain errors', 'standard library only', 'domain.py: Event, SoldOut', 'plain unit tests — no setup'],
      ['services', 'use cases, ports', 'domain', 'services.py: BookingService, EventRepository', 'fakes for every port'],
      ['adapters', 'SQL, files, HTTP, email; mapping', 'services (ports), domain, libraries', 'repositories.py: SqliteEventRepository', 'integration tests + contract tests'],
      ['entry points', 'main(), CLI, web routes, wiring, config', 'everything', 'main.py: build_service(), main()', 'a few end-to-end tests'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'clean-architecture-q1',
      type: 'mcq',
      prompt: 'What does the dependency rule say?',
      options: [
        { text: 'Every layer may import every other layer, as long as there are no cycles', why: 'The rule is stricter: imports must point in one direction only — inward.' },
        'Source code dependencies point inward: outer layers may import inner ones, never the reverse',
        { text: 'The domain should import the database so rules can load their own data', why: 'That points a dependency outward and ties every rule to the database.' },
        { text: 'Only the entry point may import anything', why: 'Services import the domain, adapters import ports and the domain — inward imports are expected.' },
      ],
      answer: 1,
      explanation: py`Domain ← services ← adapters ← entry points. Inner code never names outer code, so outer code (frameworks, databases) can change or be replaced without touching the rules.`,
    },
    {
      id: 'clean-architecture-q2',
      type: 'output',
      prompt: 'This "fake" repository stores the caller\'s object directly. What does it print?',
      code: py`class InMemoryCarts:
    def __init__(self):
        self.items = {}

    def save(self, user, cart):
        self.items[user] = cart

    def get(self, user):
        return self.items[user]

repo = InMemoryCarts()
cart = ["apple"]
repo.save("ada", cart)
cart.append("pear")
print(repo.get("ada"))`,
      options: [
        { text: "['apple']", why: 'The repository stored a reference to the same list, not a copy, so the later append is visible through it.' },
        "['apple', 'pear']",
        { text: 'KeyError', why: '"ada" was saved before the get, so the key exists.' },
      ],
      answer: 1,
      explanation: py`The fake keeps a reference to the caller's list, so changes made *after* saving leak into "storage" — something a real database would never do. Fakes should store and return copies.`,
    },
    {
      id: 'clean-architecture-q3',
      type: 'bug',
      prompt: 'This file is `domain.py`. Click the line that breaks the dependency rule.',
      code: py`from dataclasses import dataclass
from repositories import save_order


@dataclass
class Order:
    order_id: str
    total: float

    def confirm(self):
        if self.total <= 0:
            raise ValueError("empty order")
        save_order(self)`,
      answerLine: 2,
      explanation: py`The domain imports an adapter module, pointing a dependency outward (and inviting a circular import, since \`repositories\` imports the domain). \`confirm\` should only apply the rule; the use case saves the order through a repository port.`,
    },
    {
      id: 'clean-architecture-q4',
      type: 'fill',
      prompt: 'Declare a port and inject it.',
      code: py`from typing import Protocol


class PaymentGateway(___):
    def charge(self, customer_id: str, cents: int) -> str: ...


class CheckoutService:
    def __init__(self, gateway: ___):
        self.gateway = gateway`,
      answer: [['Protocol'], ['PaymentGateway']],
      explanation: py`The port is a \`Protocol\` owned by the use-case layer; the service is typed against the port, so any adapter with a matching \`charge\` — Stripe, a sandbox, a test fake — can be injected.`,
    },
    {
      id: 'clean-architecture-q5',
      type: 'mcq',
      prompt: 'Where should the rule "a customer may book at most 4 seats at once" live?',
      options: [
        'In the domain (Event.book)',
        { text: 'In the web route that receives the request', why: 'Then the CLI, batch jobs and admin tools must each re-implement it — and they will drift.' },
        { text: 'As a CHECK constraint in the database only', why: 'A constraint is a fine safety net, but then the rule is invisible to the domain and only fails late, as a database error.' },
        { text: 'In the SQLite repository\'s save()', why: 'Adapters translate and store; putting rules there means a different adapter (e.g. the test fake) silently skips them.' },
      ],
      answer: 0,
      explanation: py`It's a business rule, so it belongs with the business concepts. Every entry point and every adapter then gets it for free, and it's tested without any infrastructure.`,
    },
    {
      id: 'clean-architecture-q6',
      type: 'mcq',
      prompt: 'What is the composition root?',
      options: [
        { text: 'The base class every domain entity inherits from', why: 'Nothing in clean architecture requires a common base class.' },
        { text: 'The database schema', why: 'The schema is an adapter detail.' },
        'The one place (usually main() or an app factory) that creates concrete adapters and injects them into services',
        { text: 'A DI framework you must install', why: 'In Python it\'s usually a plain function; frameworks are optional.' },
      ],
      answer: 2,
      explanation: py`Keeping all wiring in one place means only one module knows every concrete class. Tests build their own small "composition root" with fakes.`,
    },
    {
      id: 'clean-architecture-q7',
      type: 'short',
      prompt: 'Why do clean-architecture codebases tend to test use cases with fakes rather than mocks?',
      answer: py`A fake is a small working implementation of the port (like an in-memory repository), so tests can check outcomes — "after booking, two seats are taken" — instead of exact call sequences. That makes tests less brittle when the use case is refactored, keeps them readable, and the same fake is reused across many tests. Mocks are still useful for checking a specific interaction, such as "exactly one email was sent", or for simulating failures.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'layer-the-withdrawal',
      title: 'Put each piece in the right layer',
      difficulty: 'advanced',
      prompt: py`Build a bank withdrawal in layers (all in \`main.py\`, sections marked):

**Domain**
- \`Account.withdraw(amount)\`: raise \`ValueError\` if \`amount <= 0\`; raise \`InsufficientFunds\` if \`amount > balance\`; otherwise reduce \`balance\`.

**Adapter**
- \`InMemoryAccountRepository(*accounts)\`: \`get(account_id)\` returns the stored account (raise \`KeyError\` if unknown), \`save(account)\` stores it by \`account_id\`.

**Use case**
- \`WithdrawalService(accounts)\`: \`withdraw(account_id, amount)\` loads the account through the injected repository, applies the domain rule, **saves** it, and returns the new balance. It must not print.

The tests also run your service against their own repository that hands out copies — so forgetting \`save()\` will be caught.`,
      files: {
        'main.py': py`from dataclasses import dataclass


# ---- domain ---------------------------------------------------------
class InsufficientFunds(Exception):
    """Raised when a withdrawal is larger than the balance."""


@dataclass
class Account:
    account_id: str
    balance: int

    def withdraw(self, amount):
        pass  # TODO: the business rules live here


# ---- adapter --------------------------------------------------------
class InMemoryAccountRepository:
    def __init__(self, *accounts):
        self._accounts = {}  # TODO: store the given accounts by id

    def get(self, account_id):
        pass  # TODO

    def save(self, account):
        pass  # TODO


# ---- use case -------------------------------------------------------
class WithdrawalService:
    def __init__(self, accounts):
        self.accounts = accounts

    def withdraw(self, account_id, amount):
        pass  # TODO: load, apply the domain rule, save, return the new balance


# ---- entry point (composition root) ---------------------------------
repository = InMemoryAccountRepository(Account("acc-1", 100))
service = WithdrawalService(repository)
print("new balance:", service.withdraw("acc-1", 30))
`,
      },
      hints: [
        'Start with the domain: two guard clauses (raise), then `self.balance -= amount`.',
        'The repository is a dict: `{account.account_id: account for account in accounts}`; get indexes it, save assigns to it.',
        'The service: `account = self.accounts.get(account_id)`, `account.withdraw(amount)`, `self.accounts.save(account)`, `return account.balance`.',
      ],
      solution: {
        explanation: py`Each rule lives in exactly one place. The domain \`Account\` enforces "positive amount" and "no overdraft" with guard clauses and knows nothing about storage. The repository adapter only stores and retrieves. The use case orchestrates load → rule → save and returns a plain value, leaving printing to the entry point. Because the service receives its repository, the tests can inject a copying fake that proves \`save()\` is called — the bug that a shared-object fake would hide.`,
        files: {
          'main.py': py`from dataclasses import dataclass


# ---- domain ---------------------------------------------------------
class InsufficientFunds(Exception):
    """Raised when a withdrawal is larger than the balance."""


@dataclass
class Account:
    account_id: str
    balance: int

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        if amount > self.balance:
            raise InsufficientFunds(f"balance is only {self.balance}")
        self.balance -= amount


# ---- adapter --------------------------------------------------------
class InMemoryAccountRepository:
    def __init__(self, *accounts):
        self._accounts = {account.account_id: account for account in accounts}

    def get(self, account_id):
        return self._accounts[account_id]

    def save(self, account):
        self._accounts[account.account_id] = account


# ---- use case -------------------------------------------------------
class WithdrawalService:
    def __init__(self, accounts):
        self.accounts = accounts

    def withdraw(self, account_id, amount):
        account = self.accounts.get(account_id)
        account.withdraw(amount)
        self.accounts.save(account)
        return account.balance


# ---- entry point (composition root) ---------------------------------
repository = InMemoryAccountRepository(Account("acc-1", 100))
service = WithdrawalService(repository)
print("new balance:", service.withdraw("acc-1", 30))
`,
        },
      },
      tests: [
        { name: 'the domain applies the rules', code: py`account = Account("a", 100)
account.withdraw(30)
assert account.balance == 70
with raises(InsufficientFunds):
    Account("a", 100).withdraw(200)
with raises(ValueError):
    Account("a", 100).withdraw(0)` },
        { name: 'the in-memory repository stores and returns accounts', code: py`repo = InMemoryAccountRepository(Account("a", 5))
assert repo.get("a") == Account("a", 5)
repo.save(Account("b", 7))
assert repo.get("b").balance == 7
with raises(KeyError):
    repo.get("missing")` },
        { name: 'the service returns the new balance', code: py`service = WithdrawalService(InMemoryAccountRepository(Account("a", 100)))
assert service.withdraw("a", 30) == 70` },
        { name: 'the service saves the account (copying fake)', code: py`from dataclasses import replace

class CopyingRepository:
    def __init__(self, account):
        self.stored = account
    def get(self, account_id):
        return replace(self.stored)
    def save(self, account):
        self.stored = replace(account)

repo = CopyingRepository(Account("a", 100))
WithdrawalService(repo).withdraw("a", 30)
assert repo.stored.balance == 70, 'the service must save the account after changing it'` },
        { name: 'a failed withdrawal raises and the service prints nothing', code: py`service = WithdrawalService(InMemoryAccountRepository(Account("a", 10)))
with raises(InsufficientFunds):
    service.withdraw("a", 50)
assert capture(service.withdraw, "a", 5) == '', 'leave printing to the entry point'` },
      ],
    },
    {
      id: 'fakes-for-signup',
      title: 'Write the fakes for a use case',
      difficulty: 'intermediate',
      prompt: py`\`services.py\` contains a finished \`SignupService\` that depends on two ports: \`UserRepository\` and \`Mailer\`. Implement the fakes in \`fakes.py\`:

- \`InMemoryUserRepository\`: \`add(user)\` stores a user; \`get_by_email(email)\` returns the stored \`User\` or \`None\`. **Each repository instance must have its own storage.**
- \`FakeMailer\`: \`send(to, subject)\` appends the tuple \`(to, subject)\` to its \`sent\` list.

Don't edit \`services.py\`. \`main.py\` runs a demo with your fakes; the tests drive \`SignupService\` with them.`,
      files: {
        'main.py': SIGNUP_MAIN,
        'services.py': SIGNUP_SERVICES,
        'fakes.py': py`"""Test doubles that satisfy the ports in services.py."""


class InMemoryUserRepository:
    def __init__(self):
        pass  # TODO

    def get_by_email(self, email):
        return None  # TODO

    def add(self, user):
        pass  # TODO


class FakeMailer:
    def __init__(self):
        self.sent = []

    def send(self, to, subject):
        pass  # TODO: record (to, subject)
`,
      },
      hints: [
        'Each fake only needs enough behaviour to honour the port — a dict and a list will do.',
        'Create the dict in __init__ (self._users = {}), not as a class attribute, so instances don\'t share storage.',
        'get_by_email: `return self._users.get(email)`; add: `self._users[user.email] = user`; send: `self.sent.append((to, subject))`.',
      ],
      solution: {
        explanation: py`The fakes are tiny because the ports are tiny — that's interface segregation paying off. Creating \`self._users\` in \`__init__\` gives every repository its own dict; a class-level dict would leak users between tests, a classic source of order-dependent test failures. \`dict.get\` returns \`None\` for unknown emails, matching the port's \`User | None\` contract. With these fakes, \`SignupService\` is tested end to end — normalising emails, rejecting duplicates, sending one welcome email — without a database or a mail server.`,
        files: {
          'main.py': SIGNUP_MAIN,
          'services.py': SIGNUP_SERVICES,
          'fakes.py': py`"""Test doubles that satisfy the ports in services.py."""


class InMemoryUserRepository:
    def __init__(self):
        self._users = {}

    def get_by_email(self, email):
        return self._users.get(email)

    def add(self, user):
        self._users[user.email] = user


class FakeMailer:
    def __init__(self):
        self.sent = []

    def send(self, to, subject):
        self.sent.append((to, subject))
`,
        },
      },
      tests: [
        { name: 'the repository round-trips users', code: py`fakes = module('fakes')
User = module('services').User
repo = fakes.InMemoryUserRepository()
repo.add(User("ada@example.com", "Ada"))
assert repo.get_by_email("ada@example.com") == User("ada@example.com", "Ada")
assert repo.get_by_email("nobody@example.com") is None` },
        { name: 'repositories do not share storage', code: py`fakes = module('fakes')
User = module('services').User
first, second = fakes.InMemoryUserRepository(), fakes.InMemoryUserRepository()
first.add(User("ada@example.com", "Ada"))
assert second.get_by_email("ada@example.com") is None, 'create the storage in __init__, not on the class'` },
        { name: 'sign-up sends one welcome email', code: py`fakes, services = module('fakes'), module('services')
mailer = fakes.FakeMailer()
services.SignupService(fakes.InMemoryUserRepository(), mailer).sign_up(" Ada@Example.com", "Ada")
assert mailer.sent == [("ada@example.com", "Welcome, Ada!")]` },
        { name: 'duplicates are rejected and get no second email', code: py`fakes, services = module('fakes'), module('services')
mailer = fakes.FakeMailer()
service = services.SignupService(fakes.InMemoryUserRepository(), mailer)
service.sign_up("ada@example.com", "Ada")
with raises(services.EmailTaken):
    service.sign_up("ADA@example.com", "Ada again")
assert len(mailer.sent) == 1` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'clean-architecture-dependency-rule',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain the layers of clean architecture and its dependency rule.',
      answer: 'Domain (entities and rules) in the centre, then use cases/services with ports, then adapters implementing those ports with real technology, then entry points that wire everything. Source-code dependencies only point inward: inner layers never import outer ones.',
      explanation: py`The point is to protect business rules from technical change. Because the domain and use cases don't import databases, frameworks or HTTP clients, those can be replaced — and the rules can be tested with plain objects and fakes. The inversion happens at the ports: the use case defines the interface, and the outer adapter conforms to it.`,
      whyAsked: 'It\'s the foundation for any architecture discussion and shows whether you can reason about module boundaries.',
      mistakes: ['Describing it only as "folders for controllers, services and models"', 'Forgetting who owns the interfaces (the inner layer)', 'Saying the domain should call the database'],
      followUps: ['Where do ports live and why?', 'How do you enforce the rule in a Python codebase?', 'How is this different from a classic three-tier architecture?'],
      modelAnswer: 'At the centre is the domain: entities and business rules, in plain Python. Around it are use cases, which orchestrate the domain and declare ports — small interfaces for what they need from the outside, like a repository. Then adapters implement those ports with real technology such as SQLite or an email API, and finally entry points like main or a web route wire the concrete adapters into the use cases. The dependency rule says imports only point inward, so the domain never imports a database or framework. That keeps the rules stable when technology changes and lets me test use cases with fakes in milliseconds.',
    },
    {
      id: 'clean-architecture-fakes-vs-mocks',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'When testing a use case, when would you use a fake and when a mock?',
      answer: 'Use fakes (working in-memory implementations of a port) for most use-case tests: they let you assert on outcomes and survive refactoring. Use mocks when the interaction itself is the behaviour — "exactly one email was sent", "the payment gateway was called with these cents" — or to simulate failures like timeouts.',
      explanation: py`Mock-heavy tests often mirror the implementation (\`repo.get.assert_called_once_with(...)\`) and break when you restructure code without changing behaviour. A fake repository supports realistic scenarios — save, load, check state — and is reused across tests. Fakes need maintenance and must honour the contract, so teams keep them honest with a shared contract test that also runs against the real adapter. See [mocking](lesson:mocking).`,
      whyAsked: 'Test design is central to clean architecture; the answer shows maturity about brittle tests.',
      mistakes: ['"Always mock everything"', 'Not knowing what a fake is (vs a stub or mock)', 'Fakes that don\'t behave like the real adapter'],
      followUps: ['How do you keep a fake in sync with the real adapter?', 'What is a stub?', 'How would you simulate a database timeout?'],
      modelAnswer: 'For most use-case tests I prefer fakes: small working implementations of the port, like an in-memory repository. They let me test outcomes — after booking, two seats are taken — rather than how many times a method was called, so the tests survive refactoring. I reach for mocks when the interaction is the behaviour, such as checking that exactly one confirmation email was sent, or to simulate failures like a timeout from a payment API. The risk with fakes is drift, so I run a shared contract test against both the fake and the real adapter.',
    },
    {
      id: 'clean-architecture-caching-repository',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Complete `CachingRepository`, an adapter that wraps any price repository (same interface) and caches `get_price`, so repeated reads don\'t hit the slow inner repository. `set_price` must keep the cache correct.',
      answer: 'Keep a dict cache: get_price returns the cached value if present, else fetches from the inner repository and stores it; set_price writes through to the inner repository and updates (or drops) the cached entry.',
      explanation: py`This is the decorator pattern applied to a port: same interface in, same interface out, extra behaviour in the middle. Because services depend on the port, wrapping happens in the composition root — \`PriceService(CachingRepository(SqlPriceRepository(...)))\` — and no service changes. Write-through on \`set_price\` avoids serving stale prices.`,
      starter: { files: { 'main.py': py`class CountingRepository:
    """A fake 'slow' repository that counts how often it is hit."""

    def __init__(self, prices):
        self.prices = dict(prices)
        self.calls = 0

    def get_price(self, sku):
        self.calls += 1
        return self.prices[sku]

    def set_price(self, sku, price):
        self.prices[sku] = price


class CachingRepository:
    """Wrap any repository with the same interface and cache get_price."""

    def __init__(self, inner):
        self.inner = inner

    def get_price(self, sku):
        return self.inner.get_price(sku)  # TODO: cache

    def set_price(self, sku, price):
        self.inner.set_price(sku, price)  # TODO: keep the cache correct


repo = CachingRepository(CountingRepository({"tea": 3.5}))
print(repo.get_price("tea"), repo.get_price("tea"), "inner calls:", repo.inner.calls)
` } },
      tests: [
        { name: 'a repeated read hits the inner repository once', code: py`inner = CountingRepository({"tea": 3.5})
repo = CachingRepository(inner)
assert repo.get_price("tea") == 3.5
assert repo.get_price("tea") == 3.5
assert inner.calls == 1` },
        { name: 'different SKUs are cached separately', code: py`inner = CountingRepository({"tea": 3.5, "cake": 4.0})
repo = CachingRepository(inner)
assert (repo.get_price("tea"), repo.get_price("cake"), repo.get_price("cake")) == (3.5, 4.0, 4.0)
assert inner.calls == 2` },
        { name: 'set_price keeps the cache correct', code: py`inner = CountingRepository({"tea": 3.5})
repo = CachingRepository(inner)
repo.get_price("tea")
repo.set_price("tea", 4.25)
assert repo.get_price("tea") == 4.25
assert inner.prices["tea"] == 4.25` },
        { name: 'unknown SKUs still raise KeyError', code: py`repo = CachingRepository(CountingRepository({}))
with raises(KeyError):
    repo.get_price("nope")` },
      ],
      solution: { files: { 'main.py': py`class CountingRepository:
    """A fake 'slow' repository that counts how often it is hit."""

    def __init__(self, prices):
        self.prices = dict(prices)
        self.calls = 0

    def get_price(self, sku):
        self.calls += 1
        return self.prices[sku]

    def set_price(self, sku, price):
        self.prices[sku] = price


class CachingRepository:
    """Wrap any repository with the same interface and cache get_price."""

    def __init__(self, inner):
        self.inner = inner
        self._cache = {}

    def get_price(self, sku):
        if sku not in self._cache:
            self._cache[sku] = self.inner.get_price(sku)
        return self._cache[sku]

    def set_price(self, sku, price):
        self.inner.set_price(sku, price)
        self._cache[sku] = price


repo = CachingRepository(CountingRepository({"tea": 3.5}))
print(repo.get_price("tea"), repo.get_price("tea"), "inner calls:", repo.inner.calls)
` } },
      hints: ['Add a dict in __init__ to hold cached prices.', 'In get_price, only call the inner repository when the SKU is not cached yet.', 'In set_price, write through to the inner repository first, then update the cache.'],
      whyAsked: 'It checks that you can compose adapters behind a port — a practical payoff of the architecture — and think about cache correctness.',
      mistakes: ['Caching in the service instead of an adapter', 'Forgetting to update or invalidate the cache on writes', 'Caching exceptions or None for missing items without thinking about it'],
      followUps: ['How would you add expiry (a TTL)?', 'What happens with several processes, each with its own cache?', 'Why not just use functools.lru_cache on a method?'],
      modelAnswer: 'CachingRepository implements the same interface as the repository it wraps, so services cannot tell the difference — it is the decorator pattern applied to a port. It keeps a dict; get_price returns the cached value if present, otherwise calls the inner repository once and stores the result. set_price writes through to the inner repository and then updates the cache so readers never see a stale price. The wrapping happens in the composition root, so no use case changes. In production I would think about expiry and about multiple processes, where a shared cache like Redis might be needed.',
    },
    {
      id: 'clean-architecture-circular-import',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'After a teammate adds a helper, the app fails at start-up with the error below. What is the real problem and how do you fix it properly?',
      code: { lang: 'text', code: py`Traceback (most recent call last):
  File "main.py", line 4, in <module>
    from services import BookingService
  File "services.py", line 4, in <module>
    from domain import Event
  File "domain.py", line 2, in <module>
    from services import BookingService
ImportError: cannot import name 'BookingService' from partially initialized module 'services' (most likely due to a circular import)` },
      answer: 'domain.py now imports services, so the domain depends outward and the two modules import each other. Fix the design, not the import: remove the domain\'s need for the service (move the logic into the use case, or into the domain itself), restoring inward-only dependencies.',
      explanation: py`Python executes \`services.py\` top to bottom; at line 4 it starts importing \`domain\`, which immediately asks for \`BookingService\` from the half-finished \`services\` module. Moving the import into a function or to the bottom of the file "works" but hides the architectural violation. If the domain genuinely needs something from outside, define a port in an inner layer and inject an implementation.`,
      whyAsked: 'Circular imports are the most common symptom of broken layering in Python; the quality of the fix reveals design maturity.',
      mistakes: ['Moving the import inside a function and calling it fixed', 'Merging the two modules', 'Not reading the traceback bottom-up to find the cycle'],
      followUps: ['How could CI prevent this from happening again?', 'When is a local (function-level) import legitimate?'],
      modelAnswer: 'The traceback shows a cycle: main imports services, services imports domain, and domain now imports services, which is only half initialised at that point. The real problem is architectural — the domain has started depending on the service layer, which breaks the inward-only dependency rule. Moving the import into a function would make the error go away but keep the bad dependency. I would look at why the domain needed the service and move that logic to where it belongs, usually the use case, or define a small port in the inner layer if the domain truly needs a capability. Then I would add an import-linter layers contract in CI so the rule is checked automatically.',
    },
    {
      id: 'clean-architecture-framework-boundary',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 7,
      question: 'You are building a booking API with FastAPI and an SQL database. How do you structure it so business logic doesn\'t depend on FastAPI or the ORM?',
      answer: 'Keep routes thin: they parse and validate the request, call a use case with plain values, and map the result or domain errors to HTTP responses. Use cases depend on repository ports; an ORM-backed adapter implements them and maps ORM rows to domain objects. Wire everything in an app factory (FastAPI\'s Depends can supply the service). Test use cases with fakes, adapters with a test database, and a few end-to-end API tests.',
      explanation: py`Layers: \`domain/\` (entities, rules, errors), \`services/\` (use cases, ports), \`adapters/\` (SQL repositories, email), \`entrypoints/\` (FastAPI app, CLI). Request/response models (e.g. Pydantic) belong to the entry point; ORM models belong to the adapter. Mapping costs some code, so a pragmatic alternative is to let ORM models *be* the domain models in simpler apps — a conscious trade-off. Transactions: a Unit of Work port so the use case can commit atomically.`,
      whyAsked: 'Senior candidates must apply architecture to real frameworks and discuss the trade-offs, not just draw circles.',
      mistakes: ['Putting rules in route handlers', 'Passing ORM sessions or Request objects into the domain', 'Claiming the mapping layer is free', 'Ignoring transactions'],
      followUps: ['Would you ever use ORM models as domain entities?', 'Where does input validation go?', 'How do you handle transactions across two repositories?'],
      modelAnswer: 'I would treat FastAPI and the ORM as details at the edge. Routes stay thin: they validate the request, call a use case like BookingService.book with plain values, and translate the result or domain errors such as SoldOut into status codes like 409. The use case depends on repository and notifier ports; an ORM-backed adapter implements the repository and maps rows to domain objects, and an app factory wires it all, with Depends supplying the service. For multi-step changes I would add a Unit of Work port so the use case commits atomically. Then most tests hit use cases with fakes, a smaller set checks the SQL adapter against a test database, and a few end-to-end tests go through the API. In a very simple app I might let ORM models double as domain models — but as a conscious trade-off.',
    },
    {
      id: 'clean-architecture-unit-of-work',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 6,
      question: 'A use case books seats and records a payment in two repositories. In production, the booking was saved but the payment insert failed, leaving inconsistent data. How do you fix this within clean architecture?',
      answer: 'Make the two writes one transaction through a Unit of Work port: the use case does its work inside `with uow:` and calls `uow.commit()` once; the SQL adapter implements it with a single connection/transaction and rolls back on any exception. The fake UoW used in tests records commits.',
      explanation: py`Each repository committing on its own (like the playground's \`with self.connection:\` per save) can't give atomicity across two writes. A Unit of Work owns the transaction and exposes the repositories that share it. Use case code stays storage-agnostic; tests assert that a failure leaves nothing committed. For writes that span different systems (database + payment provider), you need different tools — idempotency keys, an outbox table, or compensating actions — because one database transaction can't cover an external API.`,
      code: { lang: 'python', code: py`class BookAndPay:
    def __init__(self, uow):
        self.uow = uow

    def __call__(self, event_id, customer, seats, cents):
        with self.uow:                       # rolls back if anything raises
            event = self.uow.events.get(event_id)
            event.book(seats)
            self.uow.events.save(event)
            self.uow.payments.add(customer, cents)
            self.uow.commit()` },
      whyAsked: 'Consistency across multiple writes is where naive layered designs fail in production; it separates people who have run real systems.',
      mistakes: ['Committing inside each repository method', 'Adding try/except with manual deletes in the use case', 'Assuming one transaction can cover an external payment API'],
      followUps: ['How would you test the rollback path?', 'What is the outbox pattern?', 'What is an idempotency key?'],
      modelAnswer: 'The bug comes from each repository committing on its own, so there is no atomicity across the two writes. I would introduce a Unit of Work port: the use case opens it with a with block, uses the repositories it exposes, and calls commit once at the end; if anything raises, the context manager rolls back. The SQL adapter implements it with one connection and one transaction shared by both repositories, while tests use a fake unit of work that records whether commit happened. If the payment were an external API rather than a table, one transaction could not cover it, so I would use an idempotency key and an outbox or a compensating action instead.',
    },
  ],

  takeaways: [
    'Clean architecture layers an app: domain (rules) → services/use cases (with ports) → adapters (technology) → entry points (wiring).',
    'The dependency rule: imports point inward only; the domain imports nothing from the app.',
    'Ports are small Protocols owned by the use cases; adapters implement them and translate rows, JSON and HTTP into domain objects.',
    'Inject adapters through constructors and wire everything in one composition root — no framework required.',
    'Test the domain directly and use cases with fakes; fakes must honour the contract (copy on get/save), and contract tests keep them honest.',
    'Circular imports are usually a broken dependency rule — fix the direction, not the import statement.',
    'Scale the architecture to the problem: it pays off with rich rules and changing infrastructure, not for thin CRUD tools.',
  ],
}
