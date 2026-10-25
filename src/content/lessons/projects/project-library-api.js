// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------ shared files

const ERRORS_PY = py`"""Domain errors: they describe WHAT went wrong, not which HTTP status to send."""


class LibraryError(Exception):
    """Base class for every library rule violation."""


class ValidationError(LibraryError):
    def __init__(self, errors):
        super().__init__("invalid input: " + ", ".join(sorted(errors)))
        self.errors = errors  # {"field": "what is wrong with it"}


class NotFoundError(LibraryError):
    pass


class ConflictError(LibraryError):
    """The request is valid, but the current state forbids it."""
`

const MODELS_PY = py`from dataclasses import asdict, dataclass
from datetime import date


@dataclass(frozen=True)
class Book:
    id: int
    isbn: str
    title: str
    author: str
    copies: int
    available: int

    def to_dict(self):
        return asdict(self)


@dataclass(frozen=True)
class Member:
    id: int
    name: str
    email: str

    def to_dict(self):
        return asdict(self)


@dataclass(frozen=True)
class Loan:
    id: int
    book_id: int
    member_id: int
    borrowed_on: date
    due_on: date
    returned_on: date | None = None

    @property
    def is_open(self):
        return self.returned_on is None

    def to_dict(self):
        return {
            "id": self.id,
            "book_id": self.book_id,
            "member_id": self.member_id,
            "borrowed_on": self.borrowed_on.isoformat(),
            "due_on": self.due_on.isoformat(),
            "returned_on": self.returned_on.isoformat() if self.returned_on else None,
        }
`

const CLIENT_PY = py`"""Call a WSGI app in-process, like Flask's test_client() or FastAPI's TestClient."""
import io
import json
from dataclasses import dataclass
from wsgiref.util import setup_testing_defaults


@dataclass
class Response:
    status: int
    headers: dict
    body: bytes

    @property
    def json(self):
        return json.loads(self.body) if self.body else None


class WSGIClient:
    def __init__(self, app):
        self.app = app

    def request(self, method, path, body=None, raw=None):
        path, _, query = path.partition("?")
        data = raw if raw is not None else b"" if body is None else json.dumps(body).encode()
        environ = {
            "REQUEST_METHOD": method,
            "PATH_INFO": path,
            "QUERY_STRING": query,
            "CONTENT_TYPE": "application/json",
            "CONTENT_LENGTH": str(len(data)),
            "wsgi.input": io.BytesIO(data),
        }
        setup_testing_defaults(environ)  # fills in SERVER_NAME, wsgi.version, ...
        captured = {}

        def start_response(status, headers, exc_info=None):
            captured["status"] = int(status.split()[0])
            captured["headers"] = dict(headers)

        chunks = self.app(environ, start_response)
        return Response(captured["status"], captured["headers"], b"".join(chunks))

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, body=None, raw=None):
        return self.request("POST", path, body, raw)

    def delete(self, path):
        return self.request("DELETE", path)
`

const MAIN_PY = py`import json
from datetime import date
from http import HTTPStatus

from app import LibraryApp
from db import connect
from repository import LibraryRepository
from service import LibraryService
from wsgi_client import WSGIClient


def create_app(db_path=":memory:", *, today=date.today, loan_limit=3):
    """The composition root: the only place that knows every concrete class."""
    repo = LibraryRepository(connect(db_path))
    return LibraryApp(LibraryService(repo, today=today, loan_limit=loan_limit))


def show(client, method, path, body=None):
    response = client.request(method, path, body)
    print(f"{method} {path} -> {response.status} {HTTPStatus(response.status).phrase}")
    if "Location" in response.headers:
        print(f"    Location: {response.headers['Location']}")
    print(f"    {json.dumps(response.json)}")
    return response


def demo():
    # A fixed "today" keeps the demo output the same every day.
    client = WSGIClient(create_app(today=lambda: date(2026, 3, 12)))
    show(client, "POST", "/books", {"isbn": "978-0-00-000001-1", "title": "Frankenstein",
                                     "author": "Mary Shelley", "copies": 2})
    show(client, "POST", "/books", {"isbn": "9780000000028", "title": "The Time Machine",
                                     "author": "H. G. Wells", "copies": 1})
    show(client, "POST", "/books", {"isbn": "123", "title": "", "copies": 0})
    show(client, "POST", "/members", {"name": "Ada", "email": "Ada@Example.com"})
    show(client, "POST", "/members", {"name": "Grace", "email": "grace@example.com"})
    show(client, "POST", "/loans", {"book_id": 2, "member_id": 1})
    show(client, "POST", "/loans", {"book_id": 2, "member_id": 1})
    show(client, "POST", "/loans", {"book_id": 2, "member_id": 2})
    show(client, "POST", "/loans/1/return")
    show(client, "POST", "/loans", {"book_id": 2, "member_id": 2})
    show(client, "GET", "/books?available=true")
    show(client, "GET", "/books/99")
    show(client, "DELETE", "/books/1")


if __name__ == "__main__":
    demo()
`

// ------------------------------------------------------------ starter

const DB_STARTER = py`import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS books (
    id      INTEGER PRIMARY KEY,
    isbn    TEXT    NOT NULL UNIQUE,
    title   TEXT    NOT NULL,
    author  TEXT    NOT NULL,
    copies  INTEGER NOT NULL CHECK (copies >= 0)
);
CREATE TABLE IF NOT EXISTS members (
    id     INTEGER PRIMARY KEY,
    name   TEXT NOT NULL,
    email  TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS loans (
    id           INTEGER PRIMARY KEY,
    book_id      INTEGER NOT NULL REFERENCES books (id),
    member_id    INTEGER NOT NULL REFERENCES members (id),
    borrowed_on  TEXT    NOT NULL,
    due_on       TEXT    NOT NULL,
    returned_on  TEXT
);
-- TODO: a partial UNIQUE INDEX on loans (book_id, member_id) WHERE returned_on IS NULL,
--       so the database itself refuses a second open loan of the same book.
"""


def connect(path=":memory:"):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row          # rows behave like dicts: row["title"]
    conn.execute("PRAGMA foreign_keys = ON")  # SQLite enforces REFERENCES only when asked
    conn.executescript(SCHEMA)
    return conn
`

const VALIDATION_HEAD = py`"""Turn untrusted JSON into clean, typed data — or a ValidationError listing every problem."""
import re

from errors import ValidationError

ISBN = re.compile(r"[0-9]{9}[0-9X]|[0-9]{13}")
EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")  # deliberately simple


def require_object(data, allowed):
    if not isinstance(data, dict):
        raise ValidationError({"body": "expected a JSON object"})
    return {field: "unknown field" for field in data if field not in allowed}


def is_positive_int(value):
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def validate_member(data):
    errors = require_object(data, {"name", "email"})
    name, email = data.get("name"), data.get("email")
    if not isinstance(name, str) or not name.strip():
        errors["name"] = "required, a non-empty string"
    elif len(name.strip()) > 100:
        errors["name"] = "at most 100 characters"
    if not isinstance(email, str) or not EMAIL.fullmatch(email.strip()):
        errors["email"] = "must look like name@example.com"
    if errors:
        raise ValidationError(errors)
    return {"name": name.strip(), "email": email.strip().lower()}


def validate_loan(data):
    errors = require_object(data, {"book_id", "member_id"})
    for field in ("book_id", "member_id"):
        if not is_positive_int(data.get(field)):
            errors[field] = "required, a positive integer"
    if errors:
        raise ValidationError(errors)
    return {"book_id": data["book_id"], "member_id": data["member_id"]}
`

const VALIDATION_STARTER = VALIDATION_HEAD + py`

def validate_book(data):
    # TODO: allowed fields isbn, title, author, copies (copies defaults to 1).
    #  - title, author: non-empty strings (strip them)
    #  - isbn: remove "-" and spaces, upper-case, then ISBN.fullmatch (10 or 13 chars)
    #  - copies: an int (not bool) from 1 to 100
    # Collect ALL problems in a dict and raise ValidationError(errors) once.
    raise NotImplementedError("TODO: validate_book()")
`

const REPO_HEAD = py`"""All SQL lives here. Every query uses ? placeholders — never string formatting."""
import sqlite3
from contextlib import contextmanager
from datetime import date

from errors import ConflictError
from models import Book, Loan, Member

BOOK_SELECT = """
    SELECT b.id, b.isbn, b.title, b.author, b.copies,
           b.copies - COUNT(l.id) AS available
    FROM books AS b
    LEFT JOIN loans AS l ON l.book_id = b.id AND l.returned_on IS NULL
"""


def to_loan(row):
    return Loan(
        id=row["id"],
        book_id=row["book_id"],
        member_id=row["member_id"],
        borrowed_on=date.fromisoformat(row["borrowed_on"]),
        due_on=date.fromisoformat(row["due_on"]),
        returned_on=date.fromisoformat(row["returned_on"]) if row["returned_on"] else None,
    )


class LibraryRepository:
    def __init__(self, conn):
        self.conn = conn

    @contextmanager
    def transaction(self):
        """Commit if the block succeeds, roll back if it raises."""
        with self.conn:
            yield

    # ------------------------------------------------------------ books
    def add_book(self, isbn, title, author, copies):
        try:
            cur = self.conn.execute(
                "INSERT INTO books (isbn, title, author, copies) VALUES (?, ?, ?, ?)",
                (isbn, title, author, copies),
            )
        except sqlite3.IntegrityError:
            raise ConflictError(f"a book with ISBN {isbn} already exists") from None
        return self.get_book(cur.lastrowid)

    def get_book(self, book_id):
        row = self.conn.execute(BOOK_SELECT + " WHERE b.id = ? GROUP BY b.id", (book_id,)).fetchone()
        return Book(**dict(row)) if row else None

    def list_books(self, available_only=False):
        sql = BOOK_SELECT + " GROUP BY b.id"
        if available_only:
            sql += " HAVING available > 0"
        rows = self.conn.execute(sql + " ORDER BY b.title").fetchall()
        return [Book(**dict(row)) for row in rows]

    # ------------------------------------------------------------ members
    def add_member(self, name, email):
        try:
            cur = self.conn.execute(
                "INSERT INTO members (name, email) VALUES (?, ?)", (name, email)
            )
        except sqlite3.IntegrityError:
            raise ConflictError(f"a member with email {email} already exists") from None
        return self.get_member(cur.lastrowid)

    def get_member(self, member_id):
        row = self.conn.execute(
            "SELECT id, name, email FROM members WHERE id = ?", (member_id,)
        ).fetchone()
        return Member(**dict(row)) if row else None

    # ------------------------------------------------------------ loans
    def add_loan(self, book_id, member_id, borrowed_on, due_on):
        try:
            cur = self.conn.execute(
                "INSERT INTO loans (book_id, member_id, borrowed_on, due_on) VALUES (?, ?, ?, ?)",
                (book_id, member_id, borrowed_on.isoformat(), due_on.isoformat()),
            )
        except sqlite3.IntegrityError:  # the partial unique index said no
            raise ConflictError("this member already has this book on loan") from None
        return self.get_loan(cur.lastrowid)

    def get_loan(self, loan_id):
        row = self.conn.execute("SELECT * FROM loans WHERE id = ?", (loan_id,)).fetchone()
        return to_loan(row) if row else None

    def loans_for_member(self, member_id):
        rows = self.conn.execute(
            "SELECT * FROM loans WHERE member_id = ? ORDER BY id", (member_id,)
        ).fetchall()
        return [to_loan(row) for row in rows]
`

const REPO_STARTER = REPO_HEAD + py`
    def count_open_loans(self, member_id):
        # TODO: SELECT COUNT(*) of this member's loans WHERE returned_on IS NULL
        raise NotImplementedError("TODO: count_open_loans()")

    def find_open_loan(self, book_id, member_id):
        # TODO: the open Loan for this book and member, or None
        raise NotImplementedError("TODO: find_open_loan()")

    def close_loan(self, loan_id, returned_on):
        # TODO: UPDATE loans SET returned_on = ? WHERE id = ?
        raise NotImplementedError("TODO: close_loan()")
`

const SERVICE_HEAD = py`"""Business rules. Knows nothing about HTTP or JSON — only about libraries."""
from datetime import date, timedelta

from errors import ConflictError, NotFoundError
from validation import validate_book, validate_loan, validate_member


class LibraryService:
    def __init__(self, repo, *, today=date.today, loan_limit=3, loan_days=14):
        self.repo = repo
        self.today = today            # injected clock: tests pass a fixed date
        self.loan_limit = loan_limit
        self.loan_days = loan_days

    # ------------------------------------------------------------ books & members
    def add_book(self, payload):
        data = validate_book(payload)
        with self.repo.transaction():
            return self.repo.add_book(**data)

    def get_book(self, book_id):
        book = self.repo.get_book(book_id)
        if book is None:
            raise NotFoundError(f"book {book_id} not found")
        return book

    def list_books(self, available_only=False):
        return self.repo.list_books(available_only=available_only)

    def add_member(self, payload):
        data = validate_member(payload)
        with self.repo.transaction():
            return self.repo.add_member(**data)

    def get_member(self, member_id):
        member = self.repo.get_member(member_id)
        if member is None:
            raise NotFoundError(f"member {member_id} not found")
        return member

    def member_loans(self, member_id):
        self.get_member(member_id)
        return self.repo.loans_for_member(member_id)

    def get_loan(self, loan_id):
        loan = self.repo.get_loan(loan_id)
        if loan is None:
            raise NotFoundError(f"loan {loan_id} not found")
        return loan
`

const SERVICE_STARTER = SERVICE_HEAD + py`
    # ------------------------------------------------------------ loans
    def borrow(self, payload):
        # TODO: validate_loan(payload); inside one transaction:
        #  - the book and the member must exist           -> NotFoundError (use get_book/get_member)
        #  - the member must not already have this book   -> ConflictError
        #  - the member must have < loan_limit open loans -> ConflictError
        #  - the book must have an available copy         -> ConflictError
        #  then add a loan from today() until today() + loan_days days
        raise NotImplementedError("TODO: LibraryService.borrow()")

    def return_loan(self, loan_id):
        # TODO: unknown loan -> NotFoundError; already returned -> ConflictError;
        #       otherwise close it with today() and return the updated Loan
        raise NotImplementedError("TODO: LibraryService.return_loan()")
`

const APP_HEAD = py`"""A tiny WSGI application: routing, JSON in/out, and errors -> status codes."""
import json
import logging
import re
from http import HTTPStatus
from urllib.parse import parse_qs

from errors import ConflictError, NotFoundError, ValidationError

logger = logging.getLogger("library.http")
MAX_BODY_BYTES = 64 * 1024


class HTTPError(Exception):
    """An error that only exists at the HTTP level (unknown route, wrong method...)."""

    def __init__(self, status, message, headers=None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.headers = headers or {}


class Request:
    def __init__(self, environ):
        self.environ = environ
        self.method = environ["REQUEST_METHOD"].upper()
        self.path = environ.get("PATH_INFO") or "/"
        self.query = parse_qs(environ.get("QUERY_STRING", ""))

    def json(self):
        try:
            length = int(self.environ.get("CONTENT_LENGTH") or 0)
        except ValueError:
            raise HTTPError(400, "invalid Content-Length") from None
        if length > MAX_BODY_BYTES:
            raise HTTPError(413, "request body too large")
        raw = self.environ["wsgi.input"].read(length) if length else b""
        if not raw:
            raise ValidationError({"body": "a JSON body is required"})
        try:
            return json.loads(raw)
        except ValueError:  # JSONDecodeError and UnicodeDecodeError are both ValueErrors
            raise ValidationError({"body": "invalid JSON"}) from None
`

const ROUTER_STARTER = py`

class Router:
    def __init__(self):
        self.routes = []  # (method, compiled pattern, handler)

    def add(self, method, template, handler):
        # "/books/<book_id>" -> r"/books/(?P<book_id>[0-9]+)"
        pattern = re.sub(r"<(\w+)>", lambda m: f"(?P<{m[1]}>[0-9]+)", template)
        self.routes.append((method, re.compile(pattern), handler))

    def match(self, method, path):
        for route_method, pattern, handler in self.routes:
            found = pattern.fullmatch(path)
            if found and route_method == method:
                return handler, {name: int(value) for name, value in found.groupdict().items()}
        # TODO: if the PATH matched but the METHOD didn't, raise
        #       HTTPError(405, "method not allowed", {"Allow": "GET, POST"}) with the real methods
        raise HTTPError(404, f"no route for {path}")
`

const ROUTER_SOLUTION = py`

class Router:
    def __init__(self):
        self.routes = []  # (method, compiled pattern, handler)

    def add(self, method, template, handler):
        # "/books/<book_id>" -> r"/books/(?P<book_id>[0-9]+)"
        pattern = re.sub(r"<(\w+)>", lambda m: f"(?P<{m[1]}>[0-9]+)", template)
        self.routes.append((method, re.compile(pattern), handler))

    def match(self, method, path):
        allowed = []
        for route_method, pattern, handler in self.routes:
            found = pattern.fullmatch(path)
            if not found:
                continue
            if route_method == method:
                return handler, {name: int(value) for name, value in found.groupdict().items()}
            allowed.append(route_method)
        if allowed:
            raise HTTPError(405, "method not allowed", {"Allow": ", ".join(sorted(allowed))})
        raise HTTPError(404, f"no route for {path}")
`

const APP_CLASS_TOP = py`

class LibraryApp:
    def __init__(self, service):
        self.service = service
        self.router = Router()
        add = self.router.add
        add("GET", "/books", self.list_books)
        add("POST", "/books", self.create_book)
        add("GET", "/books/<book_id>", self.get_book)
        add("POST", "/members", self.create_member)
        add("GET", "/members/<member_id>/loans", self.member_loans)
        add("POST", "/loans", self.create_loan)
        add("GET", "/loans/<loan_id>", self.get_loan)
        add("POST", "/loans/<loan_id>/return", self.return_loan)
`

const APP_CALL_STARTER = py`
    # ------------------------------------------------------------ WSGI entry point
    def __call__(self, environ, start_response):
        request = Request(environ)
        try:
            handler, params = self.router.match(request.method, request.path)
            status, body, headers = handler(request, **params)
        except ValidationError as exc:
            status, body, headers = 400, {"error": "validation failed", "details": exc.errors}, {}
        except NotFoundError as exc:
            status, body, headers = 404, {"error": str(exc)}, {}
        # TODO: ConflictError -> 409 with {"error": str(exc)}
        except HTTPError as exc:
            status, body, headers = exc.status, {"error": exc.message}, exc.headers
        except Exception:
            logger.exception("unhandled error: %s %s", request.method, request.path)
            status, body, headers = 500, {"error": "internal server error"}, {}
        payload = json.dumps(body).encode("utf-8")
        start_response(
            f"{status} {HTTPStatus(status).phrase}",
            [("Content-Type", "application/json; charset=utf-8"),
             ("Content-Length", str(len(payload))), *headers.items()],
        )
        return [payload]
`

const APP_CALL_SOLUTION = py`
    # ------------------------------------------------------------ WSGI entry point
    def __call__(self, environ, start_response):
        request = Request(environ)
        try:
            handler, params = self.router.match(request.method, request.path)
            status, body, headers = handler(request, **params)
        except ValidationError as exc:
            status, body, headers = 400, {"error": "validation failed", "details": exc.errors}, {}
        except NotFoundError as exc:
            status, body, headers = 404, {"error": str(exc)}, {}
        except ConflictError as exc:
            status, body, headers = 409, {"error": str(exc)}, {}
        except HTTPError as exc:
            status, body, headers = exc.status, {"error": exc.message}, exc.headers
        except Exception:
            logger.exception("unhandled error: %s %s", request.method, request.path)
            status, body, headers = 500, {"error": "internal server error"}, {}
        payload = json.dumps(body).encode("utf-8")
        start_response(
            f"{status} {HTTPStatus(status).phrase}",
            [("Content-Type", "application/json; charset=utf-8"),
             ("Content-Length", str(len(payload))), *headers.items()],
        )
        return [payload]
`

const HANDLERS_COMMON = py`
    # ------------------------------------------------------------ handlers
    # Each handler returns (status, JSON-able body, extra headers).
    def list_books(self, request):
        flag = request.query.get("available", ["false"])[0].lower()
        books = self.service.list_books(available_only=flag in {"1", "true", "yes"})
        return 200, {"books": [book.to_dict() for book in books]}, {}

    def get_book(self, request, book_id):
        return 200, self.service.get_book(book_id).to_dict(), {}

    def create_member(self, request):
        member = self.service.add_member(request.json())
        return 201, member.to_dict(), {"Location": f"/members/{member.id}"}

    def member_loans(self, request, member_id):
        loans = self.service.member_loans(member_id)
        return 200, {"loans": [loan.to_dict() for loan in loans]}, {}

    def get_loan(self, request, loan_id):
        return 200, self.service.get_loan(loan_id).to_dict(), {}
`

const HANDLERS_STARTER = py`
    def create_book(self, request):
        # TODO: service.add_book(request.json()); answer 201 with the book
        #       and a Location header pointing at /books/<id>
        raise NotImplementedError("TODO: create_book handler")

    def create_loan(self, request):
        # TODO: service.borrow(request.json()); 201 + Location: /loans/<id>
        raise NotImplementedError("TODO: create_loan handler")

    def return_loan(self, request, loan_id):
        # TODO: service.return_loan(loan_id); 200 with the updated loan
        raise NotImplementedError("TODO: return_loan handler")
`

const HANDLERS_SOLUTION = py`
    def create_book(self, request):
        book = self.service.add_book(request.json())
        return 201, book.to_dict(), {"Location": f"/books/{book.id}"}

    def create_loan(self, request):
        loan = self.service.borrow(request.json())
        return 201, loan.to_dict(), {"Location": f"/loans/{loan.id}"}

    def return_loan(self, request, loan_id):
        return 200, self.service.return_loan(loan_id).to_dict(), {}
`

// ------------------------------------------------------------ solution

const DB_SOLUTION = DB_STARTER.replace(
  py`-- TODO: a partial UNIQUE INDEX on loans (book_id, member_id) WHERE returned_on IS NULL,
--       so the database itself refuses a second open loan of the same book.`,
  py`CREATE UNIQUE INDEX IF NOT EXISTS one_open_loan_per_book_and_member
    ON loans (book_id, member_id) WHERE returned_on IS NULL;`,
)

const VALIDATION_SOLUTION = VALIDATION_HEAD + py`

def validate_book(data):
    errors = require_object(data, {"isbn", "title", "author", "copies"})
    clean = {}
    for field in ("title", "author"):
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            errors[field] = "required, a non-empty string"
        else:
            clean[field] = value.strip()
    isbn = data.get("isbn")
    if not isinstance(isbn, str):
        errors["isbn"] = "required, a string"
    else:
        clean["isbn"] = isbn.replace("-", "").replace(" ", "").upper()
        if not ISBN.fullmatch(clean["isbn"]):
            errors["isbn"] = "must have 10 or 13 characters (digits, X allowed last in ISBN-10)"
    copies = data.get("copies", 1)
    if not is_positive_int(copies) or copies > 100:
        errors["copies"] = "must be an integer from 1 to 100"
    clean["copies"] = copies
    if errors:
        raise ValidationError(errors)
    return clean
`

const REPO_SOLUTION = REPO_HEAD + py`
    def count_open_loans(self, member_id):
        row = self.conn.execute(
            "SELECT COUNT(*) FROM loans WHERE member_id = ? AND returned_on IS NULL",
            (member_id,),
        ).fetchone()
        return row[0]

    def find_open_loan(self, book_id, member_id):
        row = self.conn.execute(
            "SELECT * FROM loans WHERE book_id = ? AND member_id = ? AND returned_on IS NULL",
            (book_id, member_id),
        ).fetchone()
        return to_loan(row) if row else None

    def close_loan(self, loan_id, returned_on):
        self.conn.execute(
            "UPDATE loans SET returned_on = ? WHERE id = ?", (returned_on.isoformat(), loan_id)
        )
`

const SERVICE_SOLUTION = SERVICE_HEAD + py`
    # ------------------------------------------------------------ loans
    def borrow(self, payload):
        data = validate_loan(payload)
        with self.repo.transaction():
            book = self.get_book(data["book_id"])
            member = self.get_member(data["member_id"])
            if self.repo.find_open_loan(book.id, member.id):
                raise ConflictError(f"member {member.id} already has book {book.id} on loan")
            if self.repo.count_open_loans(member.id) >= self.loan_limit:
                raise ConflictError(f"loan limit of {self.loan_limit} reached")
            if book.available < 1:
                raise ConflictError(f"no copies of book {book.id} are available")
            today = self.today()
            return self.repo.add_loan(book.id, member.id, today, today + timedelta(days=self.loan_days))

    def return_loan(self, loan_id):
        with self.repo.transaction():
            loan = self.get_loan(loan_id)
            if not loan.is_open:
                raise ConflictError(f"loan {loan_id} was already returned")
            self.repo.close_loan(loan.id, self.today())
            return self.repo.get_loan(loan.id)
`

const APP_STARTER = APP_HEAD + ROUTER_STARTER + APP_CLASS_TOP + APP_CALL_STARTER + HANDLERS_COMMON + HANDLERS_STARTER
const APP_SOLUTION = APP_HEAD + ROUTER_SOLUTION + APP_CLASS_TOP + APP_CALL_SOLUTION + HANDLERS_COMMON + HANDLERS_SOLUTION

// ------------------------------------------------------------ tests (platform)

const SETUP = py`from datetime import date
WSGIClient = module('wsgi_client').WSGIClient
client = WSGIClient(create_app(today=lambda: date(2026, 3, 12)))
def add_book(isbn="9780000000011", title="Frankenstein", copies=1):
    return client.post("/books", {"isbn": isbn, "title": title, "author": "Mary Shelley", "copies": copies})
def add_member(name="Ada", email="ada@example.com"):
    return client.post("/members", {"name": name, "email": email})
`

const TESTS = [
  {
    name: 'connect() creates the schema with foreign keys and a partial unique index on open loans',
    code: py`import sqlite3
conn = module('db').connect()
conn.execute("INSERT INTO books (isbn, title, author, copies) VALUES ('9780000000011', 'T', 'A', 5)")
conn.execute("INSERT INTO members (name, email) VALUES ('Ada', 'ada@example.com')")
loan = "INSERT INTO loans (book_id, member_id, borrowed_on, due_on) VALUES (1, 1, '2026-03-12', '2026-03-26')"
conn.execute(loan)
with raises(sqlite3.IntegrityError):
    conn.execute(loan)          # a second OPEN loan of the same book: refused by the database
conn.execute("UPDATE loans SET returned_on = '2026-03-13'")
conn.execute(loan)              # after the return, borrowing again is fine
with raises(sqlite3.IntegrityError):
    conn.execute("INSERT INTO loans (book_id, member_id, borrowed_on, due_on) VALUES (99, 1, 'x', 'y')")`,
  },
  {
    name: 'the repository stores tricky text safely with placeholders and computes availability',
    code: py`repo = module('repository').LibraryRepository(module('db').connect())
title = "Robert'); DROP TABLE books;--"
book = repo.add_book("9780000000011", title, "O'Brien", 2)
assert book.title == title and book.author == "O'Brien"
assert (book.copies, book.available) == (2, 2)
assert repo.get_book(book.id) == book and repo.get_book(999) is None
assert len(repo.list_books()) == 1`,
  },
  {
    name: 'a duplicate ISBN becomes a ConflictError (not a raw IntegrityError)',
    code: py`repo = module('repository').LibraryRepository(module('db').connect())
errors = module('errors')
repo.add_book("9780000000011", "Frankenstein", "Mary Shelley", 1)
with raises(errors.ConflictError):
    repo.add_book("9780000000011", "Another", "Someone", 1)`,
  },
  {
    name: 'validate_book() cleans good input and reports EVERY problem at once',
    code: py`v, errors = module('validation'), module('errors')
clean = v.validate_book({"isbn": "978-0-00-000001-1", "title": "  Frankenstein ", "author": "Mary Shelley"})
assert clean == {"isbn": "9780000000011", "title": "Frankenstein", "author": "Mary Shelley", "copies": 1}
assert v.validate_book({"isbn": "000000000x", "title": "T", "author": "A", "copies": 3})["isbn"] == "000000000X"
try:
    v.validate_book({"isbn": "123", "title": "", "copies": True, "colour": "red"})
except errors.ValidationError as exc:
    assert set(exc.errors) == {"isbn", "title", "author", "copies", "colour"}, exc.errors
else:
    raise AssertionError("ValidationError was not raised")
with raises(errors.ValidationError):
    v.validate_book(["not", "an", "object"])
with raises(errors.ValidationError):
    v.validate_book({"isbn": "9780000000011", "title": "T", "author": "A", "copies": 101})`,
  },
  {
    name: 'borrow() creates a loan due 14 days after the injected today()',
    code: py`from datetime import date
repo = module('repository').LibraryRepository(module('db').connect())
service = module('service').LibraryService(repo, today=lambda: date(2026, 3, 12))
book = service.add_book({"isbn": "9780000000011", "title": "T", "author": "A", "copies": 2})
member = service.add_member({"name": "Ada", "email": "ada@example.com"})
loan = service.borrow({"book_id": book.id, "member_id": member.id})
assert (loan.borrowed_on, loan.due_on, loan.returned_on) == (date(2026, 3, 12), date(2026, 3, 26), None)
assert service.get_book(book.id).available == 1`,
  },
  {
    name: 'borrow() refuses double borrowing and unknown books/members',
    code: py`from datetime import date
errors = module('errors')
repo = module('repository').LibraryRepository(module('db').connect())
service = module('service').LibraryService(repo, today=lambda: date(2026, 3, 12))
service.add_book({"isbn": "9780000000011", "title": "T", "author": "A", "copies": 5})
service.add_member({"name": "Ada", "email": "ada@example.com"})
service.borrow({"book_id": 1, "member_id": 1})
with raises(errors.ConflictError):
    service.borrow({"book_id": 1, "member_id": 1})
with raises(errors.NotFoundError):
    service.borrow({"book_id": 99, "member_id": 1})
with raises(errors.NotFoundError):
    service.borrow({"book_id": 1, "member_id": 99})
with raises(errors.ValidationError):
    service.borrow({"book_id": "1", "member_id": 1})`,
  },
  {
    name: 'borrow() enforces the loan limit and the number of copies',
    code: py`from datetime import date
errors = module('errors')
repo = module('repository').LibraryRepository(module('db').connect())
service = module('service').LibraryService(repo, today=lambda: date(2026, 3, 12), loan_limit=2)
for n in range(1, 4):
    service.add_book({"isbn": f"978000000001{n}", "title": f"Book {n}", "author": "A", "copies": 1})
service.add_member({"name": "Ada", "email": "ada@example.com"})
service.add_member({"name": "Grace", "email": "grace@example.com"})
service.borrow({"book_id": 1, "member_id": 1})
service.borrow({"book_id": 2, "member_id": 1})
with raises(errors.ConflictError):
    service.borrow({"book_id": 3, "member_id": 1})     # limit of 2 reached
with raises(errors.ConflictError):
    service.borrow({"book_id": 1, "member_id": 2})     # the only copy is out
assert repo.count_open_loans(1) == 2`,
  },
  {
    name: 'return_loan() frees the copy; returning twice is a conflict',
    code: py`from datetime import date
errors = module('errors')
repo = module('repository').LibraryRepository(module('db').connect())
service = module('service').LibraryService(repo, today=lambda: date(2026, 3, 12))
service.add_book({"isbn": "9780000000011", "title": "T", "author": "A", "copies": 1})
service.add_member({"name": "Ada", "email": "ada@example.com"})
service.add_member({"name": "Grace", "email": "grace@example.com"})
loan = service.borrow({"book_id": 1, "member_id": 1})
returned = service.return_loan(loan.id)
assert returned.returned_on == date(2026, 3, 12) and not returned.is_open
assert service.get_book(1).available == 1
service.borrow({"book_id": 1, "member_id": 2})
with raises(errors.ConflictError):
    service.return_loan(loan.id)
with raises(errors.NotFoundError):
    service.return_loan(42)`,
  },
  {
    name: 'POST /books answers 201 Created with JSON and a Location header',
    code: SETUP + py`r = add_book(isbn="978-0-00-000001-1", copies=2)
assert r.status == 201, r.json
assert r.headers["Location"] == "/books/1"
assert r.headers["Content-Type"].startswith("application/json")
assert int(r.headers["Content-Length"]) == len(r.body)
assert r.json == {"id": 1, "isbn": "9780000000011", "title": "Frankenstein",
                  "author": "Mary Shelley", "copies": 2, "available": 2}
assert add_book().status == 409, 'same ISBN again should be 409 Conflict'`,
  },
  {
    name: 'invalid input and malformed JSON answer 400 with details',
    code: SETUP + py`r = client.post("/books", {"isbn": "123", "title": "", "copies": 0})
assert r.status == 400
assert set(r.json["details"]) == {"isbn", "title", "author", "copies"}
assert client.post("/books", raw=b'{"isbn": ').status == 400
assert client.post("/books").status == 400
assert client.post("/members", {"name": "Ada", "email": "not-an-email"}).status == 400`,
  },
  {
    name: 'GET /books/<id> answers 200 or 404; unknown routes 404; wrong methods 405 with Allow',
    code: SETUP + py`add_book()
assert client.get("/books/1").status == 200
assert client.get("/books/1").json["title"] == "Frankenstein"
assert client.get("/books/99").status == 404
assert client.get("/books/abc").status == 404
assert client.get("/nowhere").status == 404
r = client.delete("/books/1")
assert r.status == 405, r.status
assert r.headers["Allow"] == "GET"
assert client.request("PUT", "/books").headers.get("Allow") == "GET, POST"`,
  },
  {
    name: 'POST /loans answers 201, then 409 for a double borrow, 404 for an unknown member',
    code: SETUP + py`add_book(copies=3)
add_member()
r = client.post("/loans", {"book_id": 1, "member_id": 1})
assert r.status == 201, r.json
assert r.headers["Location"] == "/loans/1"
assert r.json["due_on"] == "2026-03-26" and r.json["returned_on"] is None
assert client.post("/loans", {"book_id": 1, "member_id": 1}).status == 409
assert client.post("/loans", {"book_id": 1, "member_id": 7}).status == 404
assert client.post("/loans", {"book_id": 0}).status == 400`,
  },
  {
    name: 'POST /loans/<id>/return answers 200, then 409; GET /members/<id>/loans lists loans',
    code: SETUP + py`add_book()
add_member()
client.post("/loans", {"book_id": 1, "member_id": 1})
r = client.post("/loans/1/return")
assert r.status == 200, r.json
assert r.json["returned_on"] == "2026-03-12"
assert client.post("/loans/1/return").status == 409
assert client.post("/loans/5/return").status == 404
loans = client.get("/members/1/loans")
assert loans.status == 200 and len(loans.json["loans"]) == 1
assert client.get("/members/9/loans").status == 404`,
  },
  {
    name: 'GET /books?available=true lists only books with a free copy',
    code: SETUP + py`add_book("9780000000011", "Frankenstein", copies=1)
add_book("9780000000028", "The Time Machine", copies=2)
add_member()
client.post("/loans", {"book_id": 1, "member_id": 1})
everything = client.get("/books").json["books"]
available = client.get("/books?available=true").json["books"]
assert [b["title"] for b in everything] == ["Frankenstein", "The Time Machine"]
assert [(b["title"], b["available"]) for b in available] == [("The Time Machine", 2)]`,
  },
]

export default {
  id: 'project-library-api',
  kind: 'project',
  title: 'Project 7: Library REST API',
  summary: 'Build a layered JSON API for a lending library — SQLite schema, repository, service rules and a tiny WSGI router with correct status codes — and test it without a network.',
  difficulty: 'advanced',
  minutes: 180,
  prerequisites: ['sql-and-sqlite', 'http-and-rest', 'building-apis', 'custom-exceptions', 'dataclasses'],
  related: ['project-inventory-system', 'project-production-service', 'database-patterns', 'input-validation', 'injection-attacks', 'clean-architecture', 'regular-expressions', 'context-managers', 'json-data', 'dates-and-times', 'mocking', 'http-clients'],
  tags: ['project', 'REST API', 'WSGI', 'sqlite3', 'SQL schema', 'repository pattern', 'service layer', 'status codes', '201 Created', '400', '404', '409 Conflict', '405', 'validation', 'routing', 'partial unique index', 'transactions', 'FastAPI', 'Flask'],
  apis: [
    { name: 'WSGI app(environ, start_response)', summary: 'A callable that reads the request from the environ dict, calls start_response(status, headers) and returns an iterable of bytes.' },
    { name: 'wsgiref.util.setup_testing_defaults()', summary: 'Fills a WSGI environ with sensible defaults so an app can be called directly in tests.' },
    { name: 'sqlite3 ? placeholders', summary: 'conn.execute("... WHERE id = ?", (book_id,)) — values are sent separately, so they can never change the SQL.' },
    { name: 'with conn: (sqlite3)', summary: 'Commits the transaction if the block succeeds and rolls it back if it raises.' },
    { name: 'CREATE UNIQUE INDEX ... WHERE', summary: 'A partial unique index: uniqueness enforced only for rows matching the condition (e.g. open loans).' },
    { name: 'http.HTTPStatus', summary: 'Enum of HTTP status codes with phrases: HTTPStatus(409).phrase == "Conflict".' },
  ],
  docs: [
    { label: 'sqlite3 — DB-API 2.0 interface for SQLite databases', url: 'https://docs.python.org/3/library/sqlite3.html' },
    { label: 'wsgiref — WSGI utilities and reference implementation', url: 'https://docs.python.org/3/library/wsgiref.html' },
    { label: 'PEP 3333 — Python Web Server Gateway Interface v1.0.1', url: 'https://peps.python.org/pep-3333/' },
    { label: 'http.HTTPStatus', url: 'https://docs.python.org/3/library/http.html#http.HTTPStatus' },
    { label: 'SQLite — Partial indexes', url: 'https://www.sqlite.org/partialindex.html' },
    { label: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Almost every app you use talks to a **web API**: your phone asks a server "which books are available?" and gets JSON back. In this project you build that server for a small lending library: add books and members, lend books, take them back — with the rules a real library has.`,
    py`You'll build it in **layers**, the way professional back-ends are built: a [SQLite](lesson:sql-and-sqlite) schema whose constraints guard the data, a **repository** that owns every SQL query, a **service** that owns the business rules ("no more than 3 books at once"), and a thin **HTTP layer** that turns requests into service calls and errors into the right [status codes](lesson:http-and-rest) — 201, 400, 404, 405, 409.`,
    py`No framework, no network: the HTTP layer is a plain **WSGI** application — the standard interface Flask and Django are built on — and your tests call it directly, exactly like Flask's and FastAPI's test clients do. A step at the end shows the same API in FastAPI and Flask, so you can see what the frameworks do for you.`,
  ],
  why: [
    py`APIs are where your code meets the outside world, and the outside world sends garbage: missing fields, wrong types, the same request twice, two librarians lending the last copy at the same moment. Each layer here has one job in defending against that.`,
    py`Status codes are a contract. A mobile app that gets **409 Conflict** knows to show "already borrowed"; one that gets **400** knows to highlight the form fields; **404** means "refresh your list". Sending 500 for everything — or 200 with \`{"error": ...}\` — breaks every client.`,
    py`And layering is what keeps a growing API changeable: you can swap SQLite for PostgreSQL, or WSGI for FastAPI, without rewriting the rules. That's [clean architecture](lesson:clean-architecture) in practice.`,
  ],
  eli15: [
    py`Picture the library desk. You (the **client**) hand a slip to the receptionist: "I'd like to borrow book 2. I'm member 1." The receptionist (the **HTTP layer**) checks the slip is filled in properly — if not, it comes straight back: *"400: you didn't write your member number"*.`,
    py`A proper slip goes to the librarian (the **service**), who knows the rules: you already have this book? *"409: you've got it already"*. Three books out? *"409: limit reached"*. No such member? *"404"*. If all is well, she asks the archivist (the **repository**) to write the loan in the big ledger (the **database**) — and you get *"201: here's your loan, due in 14 days"*.`,
    py`Nobody does anyone else's job. The receptionist never opens the ledger; the archivist never decides who may borrow. That's why the library still works when one of them is replaced.`,
  ],
  analogy: {
    title: 'The library desk',
    body: [
      py`A request travels through the desk, the librarian and the archive — and the answer travels back with a stamp that says exactly what happened.`,
    ],
    mapping: [
      ['the request slip', 'an HTTP request: method, path, JSON body'],
      ['receptionist', 'the WSGI app + router: parses, routes, maps errors to status codes'],
      ['"slip filled in wrong"', '400 Bad Request (ValidationError)'],
      ['librarian with the rule book', 'LibraryService: loan limit, no double borrowing, copies'],
      ['"you already have it" / "none left"', '409 Conflict (ConflictError)'],
      ['archivist and the ledger', 'LibraryRepository and the SQLite database'],
      ['the ledger refusing a duplicate line', 'UNIQUE / partial unique index constraints'],
      ['the stamp on the returned slip', 'the status code: 201, 200, 404, 405...'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'One request through the layers',
    props: {
      width: 780,
      height: 330,
      nodes: [
        { id: 'client', label: 'Client', note: 'app / test / curl', x: 80, y: 90, tone: 'yellow' },
        { id: 'wsgi', label: 'app.py', note: 'WSGI + Router', x: 250, y: 90, tone: 'blue' },
        { id: 'service', label: 'service.py', note: 'business rules', x: 430, y: 90, tone: 'ink' },
        { id: 'repo', label: 'repository.py', note: 'SQL only', x: 610, y: 90, tone: 'kraft' },
        { id: 'db', label: 'SQLite', note: 'constraints', x: 610, y: 250, tone: 'paper' },
        { id: 'validation', label: 'validation.py', note: 'clean input', x: 430, y: 250, tone: 'paper' },
        { id: 'errors', label: 'errors.py', note: 'domain errors', x: 250, y: 250, tone: 'red' },
      ],
      edges: [
        { from: 'client', to: 'wsgi', label: 'POST /loans' },
        { from: 'wsgi', to: 'service', label: 'borrow(json)' },
        { from: 'service', to: 'validation', label: 'validate', dashed: true },
        { from: 'service', to: 'repo', label: 'queries' },
        { from: 'repo', to: 'db', label: '? params' },
        { from: 'service', to: 'errors', label: 'raise', dashed: true },
        { from: 'errors', to: 'wsgi', label: '→ 400/404/409' },
      ],
      steps: [
        { focus: ['client', 'wsgi'], edges: ['client->wsgi'], text: py`The client sends \`POST /loans\` with \`{"book_id": 2, "member_id": 1}\`. The WSGI app wraps the environ in a \`Request\` and the **router** picks the handler by method + path.` },
        { focus: ['wsgi', 'service', 'validation'], edges: ['wsgi->service', 'service->validation'], text: py`The handler parses JSON and calls \`service.borrow(data)\`. The service first **validates**: wrong types become a \`ValidationError\` with a message per field.` },
        { focus: ['service', 'repo', 'db'], edges: ['service->repo', 'repo->db'], text: py`Inside one **transaction** the service asks the repository: does the book exist? the member? an open loan already? how many loans? Only then does it insert the loan. Every query uses \`?\` placeholders.` },
        { focus: ['db'], text: py`The database is the last line of defence: \`UNIQUE\`, \`CHECK\`, foreign keys and a partial unique index refuse bad data even if a bug slips past the service.` },
        { focus: ['service', 'errors'], edges: ['service->errors'], text: py`If a rule is broken, the service raises a **domain** error — \`NotFoundError\`, \`ConflictError\` — that says *what* went wrong, with no idea about HTTP.` },
        { focus: ['errors', 'wsgi', 'client'], edges: ['errors->wsgi'], text: py`The WSGI app maps each error type to a status code in **one place** and sends JSON back: 201 with a \`Location\` header on success, 400/404/409 otherwise, and a generic 500 for anything unexpected.` },
      ],
    },
    alt: 'Layer diagram. A client sends POST /loans to app.py (WSGI and router), which calls service.py. The service validates input with validation.py, runs queries through repository.py, which talks to SQLite with placeholders. The service raises domain errors from errors.py, which app.py maps to 400, 404 or 409 responses.',
    caption: py`Arrows point from caller to callee. HTTP knowledge stays on the left, SQL knowledge on the right, rules in the middle.`,
  },

  requirements: [
    'db.py: connect(path=":memory:") returns a sqlite3 connection with Row rows and foreign keys ON, and creates books (UNIQUE isbn, CHECK copies >= 0), members (UNIQUE email) and loans — plus a partial UNIQUE INDEX on loans(book_id, member_id) WHERE returned_on IS NULL.',
    'repository.py: LibraryRepository uses ? placeholders for every value, returns frozen dataclasses (Book includes available = copies - open loans), turns IntegrityError into ConflictError, and adds count_open_loans(member_id), find_open_loan(book_id, member_id) and close_loan(loan_id, returned_on).',
    'validation.py: validate_book(data) accepts only isbn, title, author and copies; strips text, normalises the ISBN (no "-" or spaces, upper-case, 10 or 13 characters), defaults copies to 1 (an int from 1 to 100, not bool) and raises ONE ValidationError whose .errors dict names every bad or unknown field.',
    'service.py: LibraryService(repo, *, today=date.today, loan_limit=3, loan_days=14). borrow(payload) validates, then in one transaction raises NotFoundError for an unknown book/member and ConflictError for a double borrow, a reached loan limit or no available copy; otherwise the loan runs from today() to today() + loan_days.',
    'return_loan(loan_id) raises NotFoundError for an unknown loan and ConflictError if it was already returned; otherwise sets returned_on = today() and returns the updated Loan.',
    'app.py: routes GET/POST /books, GET /books/<id>, POST /members, GET /members/<id>/loans, POST /loans, GET /loans/<id>, POST /loans/<id>/return. Success: 200, or 201 with a Location header for creations. Errors: ValidationError → 400, NotFoundError → 404, ConflictError → 409, a known path with the wrong method → 405 with an Allow header, unknown path → 404, anything else → 500 with a generic message.',
    'Every response is JSON with Content-Type application/json and a correct Content-Length; GET /books?available=true lists only books with a free copy.',
  ],
  objectives: [
    'Design a REST resource model and choose the right status code for each outcome.',
    'Let the database enforce invariants with UNIQUE, CHECK, foreign keys and a partial unique index.',
    'Keep every SQL statement in a repository and use parameterised queries only.',
    'Put business rules in a service layer that knows nothing about HTTP, with an injected clock.',
    'Validate untrusted JSON and report every problem at once.',
    'Write a WSGI application with a small router and map domain errors to HTTP responses in one place.',
    'Test an HTTP API in-process, and recognise the same structure in FastAPI and Flask.',
  ],

  playground: {
    title: 'Library API — starter',
    objective: 'Complete the schema index, validate_book, the loan queries, borrow/return, the 409 and 405 handling and the three TODO handlers.',
    files: {
      'main.py': MAIN_PY,
      'app.py': APP_STARTER,
      'service.py': SERVICE_STARTER,
      'repository.py': REPO_STARTER,
      'validation.py': VALIDATION_STARTER,
      'db.py': DB_STARTER,
      'models.py': MODELS_PY,
      'errors.py': ERRORS_PY,
      'wsgi_client.py': CLIENT_PY,
    },
    expected: py`The starter runs the scripted demo, but most requests come back as \`500 Internal Server Error\` (with the TODO in the logged traceback) or \`404\`, and \`DELETE /books/1\` is a 404 instead of a 405.

When finished, the transcript reads like a real API session:

\`\`\`text
POST /books -> 201 Created
    Location: /books/1
POST /books -> 400 Bad Request
POST /loans -> 201 Created
POST /loans -> 409 Conflict        (already has it)
POST /loans -> 409 Conflict        (no copies left)
POST /loans/1/return -> 200 OK
GET /books/99 -> 404 Not Found
DELETE /books/1 -> 405 Method Not Allowed
\`\`\`

(abridged — each line is followed by its JSON body).`,
    tests: TESTS,
  },

  steps: [
    {
      title: '1. Design the API before the code',
      body: [
        py`REST APIs are organised around **resources** (nouns) with a URL each, and HTTP **methods** (verbs) acting on them. Write the contract down first — it's what client developers will read:`,
        py`| method & path | does | success | errors |
|---|---|---|---|
| \`GET /books\` (\`?available=true\`) | list books | 200 | — |
| \`POST /books\` | add a book | **201** + \`Location\` | 400 invalid, 409 duplicate ISBN |
| \`GET /books/<id>\` | one book | 200 | 404 |
| \`POST /members\` | add a member | 201 + \`Location\` | 400, 409 duplicate email |
| \`GET /members/<id>/loans\` | a member's loans | 200 | 404 |
| \`POST /loans\` | borrow | 201 + \`Location\` | 400, 404 unknown book/member, **409** rule broken |
| \`GET /loans/<id>\` | one loan | 200 | 404 |
| \`POST /loans/<id>/return\` | return | 200 | 404, 409 already returned |
| wrong method on a known path | | | **405** + \`Allow\` |`,
        py`The status codes carry meaning ([HTTP & REST](lesson:http-and-rest)):`,
        py`- **400 Bad Request** — the request itself is malformed (missing field, wrong type, broken JSON). Retrying it unchanged will never work.
- **404 Not Found** — the thing you referred to doesn't exist.
- **409 Conflict** — the request is fine, but the current *state* forbids it (already borrowed, no copies left). It might succeed later.
- **201 Created** + \`Location: /loans/7\` — something new exists, and here's where.
- **405 Method Not Allowed** + \`Allow: GET\` — the URL exists, the verb doesn't.`,
        { callout: 'note', title: '400 or 422?', text: py`Some APIs (FastAPI by default) answer **422 Unprocessable Content** for well-formed JSON that fails validation, keeping 400 for unparseable requests. Both conventions are common; pick one and document it. This project uses 400 for every input problem.` },
      ],
    },
    {
      title: '2. Let the database guard the data',
      body: [
        py`Rules in Python code can be bypassed by a bug, a second service or someone with a SQL console. Rules in the **schema** can't. So encode every invariant you can as a constraint:`,
        { code: py`CREATE TABLE books (
    id      INTEGER PRIMARY KEY,
    isbn    TEXT    NOT NULL UNIQUE,              -- no duplicate books
    title   TEXT    NOT NULL,
    author  TEXT    NOT NULL,
    copies  INTEGER NOT NULL CHECK (copies >= 0)  -- never negative
);
CREATE TABLE loans (
    id           INTEGER PRIMARY KEY,
    book_id      INTEGER NOT NULL REFERENCES books (id),    -- must exist
    member_id    INTEGER NOT NULL REFERENCES members (id),
    borrowed_on  TEXT    NOT NULL,
    due_on       TEXT    NOT NULL,
    returned_on  TEXT                                       -- NULL = still out
);
CREATE UNIQUE INDEX one_open_loan_per_book_and_member
    ON loans (book_id, member_id) WHERE returned_on IS NULL;`, lang: 'text', title: 'the schema (SQL)' },
        py`The last statement is a **partial unique index**: uniqueness of \`(book_id, member_id)\` is enforced *only among open loans*. A member can borrow the same book again next month (the old loan has a \`returned_on\`), but can never hold two open loans of it — even if two requests race each other. That's the "no double borrowing" rule, guaranteed by the database.`,
        py`Two SQLite specifics in \`connect()\`:`,
        py`- \`PRAGMA foreign_keys = ON\` — SQLite parses \`REFERENCES\` but only *enforces* it when this is switched on, per connection.
- \`conn.row_factory = sqlite3.Row\` — rows behave like read-only dicts (\`row["title"]\`), so \`Book(**dict(row))\` works when column names match field names.`,
        py`Dates are stored as ISO text (\`"2026-03-26"\`) and converted with \`date.isoformat()\` / \`date.fromisoformat()\`. Python 3.12 deprecated the sqlite3 module's built-in default date adapters, so explicit conversion is the future-proof choice.`,
      ],
    },
    {
      title: '3. The repository: all SQL in one place',
      body: [
        py`A **repository** is an object whose methods speak the domain's language (\`add_book\`, \`find_open_loan\`) and hide the SQL. The rest of the program never sees a cursor ([database patterns](lesson:database-patterns)).`,
        { code: py`import sqlite3

conn = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL)")
title = "Robert'); DROP TABLE books;--"

# NEVER: f"INSERT INTO books (title) VALUES ('{title}')"  — the title would become SQL
conn.execute("INSERT INTO books (title) VALUES (?)", (title,))   # sent as data, not code
print(conn.execute("SELECT title FROM books").fetchone()[0])`, lang: 'python', title: 'placeholders make injection impossible' },
        py`With \`?\` placeholders the SQL text and the values travel to SQLite **separately**; a value can never change the statement. String formatting would let a book title rewrite your query — that's [SQL injection](lesson:injection-attacks), still one of the most common security bugs.`,
        py`The repository also **translates** database errors into domain errors, so upper layers don't depend on sqlite3:`,
        { code: py`    def add_book(self, isbn, title, author, copies):
        try:
            cur = self.conn.execute(
                "INSERT INTO books (isbn, title, author, copies) VALUES (?, ?, ?, ?)",
                (isbn, title, author, copies),
            )
        except sqlite3.IntegrityError:
            raise ConflictError(f"a book with ISBN {isbn} already exists") from None
        return self.get_book(cur.lastrowid)

    def find_open_loan(self, book_id, member_id):
        row = self.conn.execute(
            "SELECT * FROM loans WHERE book_id = ? AND member_id = ? AND returned_on IS NULL",
            (book_id, member_id),
        ).fetchone()
        return to_loan(row) if row else None`, lang: 'python', static: true, title: 'repository.py (excerpt)' },
        py`Availability is computed, not stored: \`copies - COUNT(open loans)\` via a \`LEFT JOIN\` (so books with zero loans still appear) and \`GROUP BY b.id\`. A stored "available" column would be one more thing that can drift out of sync.`,
        { callout: 'tip', title: 'Note the comma', text: py`\`(book_id,)\` is a one-element tuple. \`(book_id)\` is just \`book_id\` in brackets, and sqlite3 then complains about the number of bindings. See [tuples](lesson:tuples-and-unpacking).` },
      ],
    },
    {
      title: '4. Validation: never trust the request body',
      body: [
        py`JSON from a client can contain anything: \`"copies": "lots"\`, \`"copies": true\`, extra fields, or not even an object. Validation turns untrusted input into clean, typed data — or a \`ValidationError\` listing **every** problem, so a form can highlight all bad fields at once instead of one per round-trip ([input validation](lesson:input-validation)).`,
        { code: py`import re

ISBN = re.compile(r"[0-9]{9}[0-9X]|[0-9]{13}")


class ValidationError(Exception):
    def __init__(self, errors):
        super().__init__(", ".join(sorted(errors)))
        self.errors = errors


def validate_book(data):
    if not isinstance(data, dict):
        raise ValidationError({"body": "expected a JSON object"})
    errors = {f: "unknown field" for f in data if f not in {"isbn", "title", "author", "copies"}}
    clean = {}
    for field in ("title", "author"):
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            errors[field] = "required, a non-empty string"
        else:
            clean[field] = value.strip()
    isbn = data.get("isbn")
    if not isinstance(isbn, str):
        errors["isbn"] = "required, a string"
    else:
        clean["isbn"] = isbn.replace("-", "").replace(" ", "").upper()
        if not ISBN.fullmatch(clean["isbn"]):
            errors["isbn"] = "must have 10 or 13 characters"
    copies = data.get("copies", 1)
    if isinstance(copies, bool) or not isinstance(copies, int) or not 1 <= copies <= 100:
        errors["copies"] = "must be an integer from 1 to 100"
    clean["copies"] = copies
    if errors:
        raise ValidationError(errors)
    return clean


print(validate_book({"isbn": "978-0-00-000001-1", "title": " Frankenstein ", "author": "Mary Shelley"}))
try:
    validate_book({"isbn": "123", "copies": True, "colour": "red"})
except ValidationError as exc:
    print(exc.errors)`, lang: 'python', title: 'validation.py — validate_book (simplified)' },
        py`Rejecting **unknown fields** catches client typos (\`"copeis": 3\` would otherwise silently default to 1) and stops clients from sneaking in fields you never meant to accept — a defence against *mass assignment* bugs. Rejecting \`bool\` matters because \`True\` is an \`int\` in Python.`,
        { callout: 'note', title: 'Simplified', text: py`The ISBN check only looks at the shape; real ISBNs also have a check digit (a challenge below). The email regex is deliberately loose — the only real test of an email address is sending a message to it.` },
      ],
    },
    {
      title: '5. The service layer: rules and transactions',
      body: [
        py`The service is where the library's rules live. It takes plain data, returns domain objects, raises domain errors — and has **no idea** HTTP exists. That's what lets you reuse it from a CLI, a background job or a different web framework.`,
        { code: py`    def borrow(self, payload):
        data = validate_loan(payload)
        with self.repo.transaction():
            book = self.get_book(data["book_id"])          # NotFoundError
            member = self.get_member(data["member_id"])    # NotFoundError
            if self.repo.find_open_loan(book.id, member.id):
                raise ConflictError(f"member {member.id} already has book {book.id} on loan")
            if self.repo.count_open_loans(member.id) >= self.loan_limit:
                raise ConflictError(f"loan limit of {self.loan_limit} reached")
            if book.available < 1:
                raise ConflictError(f"no copies of book {book.id} are available")
            today = self.today()
            return self.repo.add_loan(book.id, member.id, today,
                                      today + timedelta(days=self.loan_days))`, lang: 'python', static: true, title: 'service.py — borrow()' },
        py`- **One transaction** (\`with conn:\` inside \`repo.transaction()\`): all the checks and the insert commit together, or an exception rolls everything back ([context managers](lesson:context-managers)).
- **Injected clock**: \`today\` is a parameter defaulting to \`date.today\`. Tests pass \`lambda: date(2026, 3, 12)\` and can assert an exact due date — no waiting, no flaky midnight failures.
- **Belt and braces**: the service checks for a double borrow to give a *clear* message; the partial unique index still stops it if two requests slip past the check simultaneously.`,
        { callout: 'warn', title: 'Check-then-insert races', text: py`Between "count open loans" and "insert loan", another process could insert a loan. With several server processes, start the transaction with \`BEGIN IMMEDIATE\` in SQLite (or \`SELECT ... FOR UPDATE\` / constraints in PostgreSQL) so the checks and the write can't interleave. Constraints are the only rules that can't be raced around.` },
      ],
    },
    {
      title: '6. WSGI: the interface under every Python web framework',
      body: [
        py`[PEP 3333](https://peps.python.org/pep-3333/) defines **WSGI**: a web application is a callable \`app(environ, start_response)\`. The server puts the request into the \`environ\` dict (\`REQUEST_METHOD\`, \`PATH_INFO\`, \`QUERY_STRING\`, \`wsgi.input\` for the body…), the app calls \`start_response("201 Created", headers)\` and returns an iterable of **bytes**.`,
        { code: py`import io
import json
from wsgiref.util import setup_testing_defaults


def hello_app(environ, start_response):
    name = environ["PATH_INFO"].strip("/") or "world"
    body = json.dumps({"hello": name}).encode("utf-8")
    start_response("200 OK", [("Content-Type", "application/json"),
                              ("Content-Length", str(len(body)))])
    return [body]


environ = {"REQUEST_METHOD": "GET", "PATH_INFO": "/ada", "wsgi.input": io.BytesIO()}
setup_testing_defaults(environ)          # adds SERVER_NAME, wsgi.version, ...
captured = []
chunks = hello_app(environ, lambda status, headers: captured.append(status))
print(captured[0], b"".join(chunks))`, lang: 'python', title: 'the whole protocol in a dozen lines' },
        py`That's all a server like Gunicorn does: build an environ from the socket, call your app, write the bytes back. Because the app is *just a function*, tests can call it directly with a hand-made environ — which is exactly what \`wsgi_client.py\` does. No sockets, no ports, no network.`,
        py`The \`Request\` class in \`app.py\` wraps the environ: it reads exactly \`CONTENT_LENGTH\` bytes from \`wsgi.input\`, refuses bodies over 64 KB (**413**), and turns broken JSON into a \`ValidationError\`. Limiting body size is a basic defence against memory-exhaustion attacks.`,
      ],
    },
    {
      title: '7. A router, and errors mapped in one place',
      body: [
        py`The router turns route templates into compiled regexes: \`/books/<book_id>\` becomes \`/books/(?P<book_id>[0-9]+)\`. \`fullmatch\` means \`/books/1/extra\` doesn't match, and \`[0-9]+\` means \`/books/abc\` is a 404, not a crash.`,
        { code: py`    def match(self, method, path):
        allowed = []
        for route_method, pattern, handler in self.routes:
            found = pattern.fullmatch(path)
            if not found:
                continue
            if route_method == method:
                return handler, {name: int(value) for name, value in found.groupdict().items()}
            allowed.append(route_method)
        if allowed:   # the path exists, the method doesn't
            raise HTTPError(405, "method not allowed", {"Allow": ", ".join(sorted(allowed))})
        raise HTTPError(404, f"no route for {path}")`, lang: 'python', static: true, title: 'app.py — Router.match()' },
        py`Handlers are tiny: parse, call the service, return \`(status, body, headers)\`. All error handling lives in \`__call__\`:`,
        { code: py`        try:
            handler, params = self.router.match(request.method, request.path)
            status, body, headers = handler(request, **params)
        except ValidationError as exc:
            status, body, headers = 400, {"error": "validation failed", "details": exc.errors}, {}
        except NotFoundError as exc:
            status, body, headers = 404, {"error": str(exc)}, {}
        except ConflictError as exc:
            status, body, headers = 409, {"error": str(exc)}, {}
        except HTTPError as exc:
            status, body, headers = exc.status, {"error": exc.message}, exc.headers
        except Exception:
            logger.exception("unhandled error: %s %s", request.method, request.path)
            status, body, headers = 500, {"error": "internal server error"}, {}`, lang: 'python', static: true, title: 'app.py — mapping errors to status codes' },
        py`The catch-all \`except Exception\` is the one place where catching *everything* is right: it **logs** the full traceback for developers and returns a **generic** message to the client. Leaking exception text or stack traces in responses tells attackers about your internals ([secure practices](lesson:secure-practices)).`,
      ],
    },
    {
      title: '8. Testing the API without a network',
      body: [
        py`\`WSGIClient\` builds an environ, calls the app and collects status, headers and body — the same trick as Flask's \`app.test_client()\` and FastAPI's \`TestClient\`. Tests read like API documentation:`,
        { code: py`client = WSGIClient(create_app(today=lambda: date(2026, 3, 12)))
client.post("/books", {"isbn": "9780000000011", "title": "Frankenstein",
                       "author": "Mary Shelley", "copies": 1})
client.post("/members", {"name": "Ada", "email": "ada@example.com"})

r = client.post("/loans", {"book_id": 1, "member_id": 1})
assert r.status == 201
assert r.headers["Location"] == "/loans/1"
assert r.json["due_on"] == "2026-03-26"

assert client.post("/loans", {"book_id": 1, "member_id": 1}).status == 409`, lang: 'python', static: true, title: 'an end-to-end test' },
        py`Each test builds a fresh app with an in-memory database (\`":memory:"\`), so tests are fast and independent. Test at several levels: the repository against a real (in-memory) database, the service with an injected clock, and the HTTP layer end to end. \`create_app()\` in \`main.py\` is the **composition root** — the one function that knows which concrete classes to wire together — so tests can swap any piece ([clean architecture](lesson:clean-architecture), [mocking](lesson:mocking)).`,
      ],
    },
    {
      title: '9. The same API with FastAPI and Flask',
      body: [
        py`Frameworks remove the plumbing you just wrote — routing, JSON parsing, validation, status codes — but the layers stay the same. Here is \`POST /loans\` in **FastAPI** (runs on ASGI, validation by pydantic; install it locally, it isn't available in the browser sandbox):`,
        { code: py`from fastapi import Depends, FastAPI, HTTPException, Response
from pydantic import BaseModel, PositiveInt

app = FastAPI()


class LoanIn(BaseModel):
    book_id: PositiveInt
    member_id: PositiveInt


def get_service() -> LibraryService:          # dependency injection
    return LibraryService(LibraryRepository(connect("library.db")))


@app.post("/loans", status_code=201)
def create_loan(body: LoanIn, response: Response,
                service: LibraryService = Depends(get_service)):
    try:
        loan = service.borrow(body.model_dump())
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    response.headers["Location"] = f"/loans/{loan.id}"
    return loan.to_dict()`, lang: 'python', static: true, title: 'FastAPI (run locally: uvicorn main:app)' },
        py`And in **Flask** (WSGI, like yours):`,
        { code: py`from flask import Flask, jsonify, request

app = Flask(__name__)
service = LibraryService(LibraryRepository(connect("library.db")))


@app.errorhandler(ConflictError)
def conflict(exc):
    return jsonify(error=str(exc)), 409


@app.errorhandler(NotFoundError)
def not_found(exc):
    return jsonify(error=str(exc)), 404


@app.post("/loans")
def create_loan():
    loan = service.borrow(request.get_json())
    return jsonify(loan.to_dict()), 201, {"Location": f"/loans/{loan.id}"}`, lang: 'python', static: true, title: 'Flask (run locally: flask --app main run)' },
        py`Notice what didn't change: \`LibraryService\`, the repository, the schema and the domain errors. FastAPI answers invalid bodies with **422** automatically; Flask's \`errorhandler\` is the framework version of your \`except\` chain. See [building APIs](lesson:building-apis).`,
      ],
    },
    {
      title: '10. Production concerns',
      body: [
        py`A toy becomes a service by adding the things that only matter once real users arrive:`,
        py`- **Serving**: run the WSGI app under a production server (\`gunicorn main:app\`), behind a reverse proxy that handles TLS. Never use a development server in production.
- **Authentication & authorisation**: who is calling, and may they lend books? Typically tokens validated per request; members should only see their own loans.
- **Pagination**: \`GET /books\` must not return a million rows — accept \`limit\`/\`offset\` (or cursor) parameters with a maximum.
- **Concurrency**: SQLite allows one writer at a time; with several processes use \`BEGIN IMMEDIATE\` for read-check-write transactions, or move to PostgreSQL. Keep the constraints either way.
- **Migrations**: schema changes go through versioned migration scripts (e.g. Alembic), never hand-edited production databases.
- **Observability**: structured access logs, request IDs, metrics per route and status code, and a health-check endpoint — Project 9 builds these.`,
        { code: py`gunicorn --workers 4 --bind 0.0.0.0:8000 main:app`, lang: 'bash', title: 'serving the WSGI app (needs a create_app() call bound to "app")' },
      ],
    },
  ],

  challenges: [
    'ISBN check digits: validate ISBN-10 (weights 10..1, mod 11, X = 10) and ISBN-13 (weights 1,3,1,3..., mod 10) and reject typos with a clear message.',
    'Pagination: GET /books?limit=20&offset=40 with a maximum limit of 100 and a "next" link in the response.',
    'Overdue report: GET /loans/overdue lists open loans whose due_on is before today(), using the injected clock in tests.',
    'Content negotiation: answer 415 Unsupported Media Type when a POST body is not Content-Type: application/json.',
    'PATCH /books/<id>: change the number of copies, but refuse (409) to drop below the number currently on loan.',
    'Concurrency (production concern): open two connections to the same database file, interleave two borrow() calls by hand, and show the partial unique index stopping the double borrow; then add BEGIN IMMEDIATE to the transaction.',
    'Authentication (production concern): require an Authorization: Bearer token, compare it with hmac.compare_digest, answer 401 without it, and let members see only their own loans (403 otherwise).',
    'Port it: rewrite app.py in FastAPI or Flask on your own machine and run the same end-to-end tests with the framework\'s TestClient.',
  ],

  solution: {
    files: {
      'main.py': MAIN_PY,
      'app.py': APP_SOLUTION,
      'service.py': SERVICE_SOLUTION,
      'repository.py': REPO_SOLUTION,
      'validation.py': VALIDATION_SOLUTION,
      'db.py': DB_SOLUTION,
      'models.py': MODELS_PY,
      'errors.py': ERRORS_PY,
      'wsgi_client.py': CLIENT_PY,
    },
    explanation: [
      py`**db.py** adds \`CREATE UNIQUE INDEX ... ON loans (book_id, member_id) WHERE returned_on IS NULL\`: the database itself refuses a second *open* loan of the same book for the same member, while still allowing a new loan after a return.`,
      py`**validation.py** collects problems in a dict as it goes — unknown fields, empty title/author, a badly shaped ISBN, a non-int or out-of-range \`copies\` — and raises one \`ValidationError\` at the end. Good values are stripped and normalised.`,
      py`**repository.py** gains three parameterised queries: a \`COUNT(*)\` of open loans, the open loan for a book/member pair, and an \`UPDATE\` that sets \`returned_on\`. Dates go in as ISO strings.`,
      py`**service.py** validates, then runs every check and the insert inside one transaction, raising \`NotFoundError\` or \`ConflictError\` with specific messages. \`return_loan\` refuses already-returned loans and re-reads the loan to return its new state.`,
      py`**app.py** maps \`ConflictError\` to 409, teaches the router to answer 405 with an \`Allow\` header when the path matches but the method doesn't, and implements the three handlers — 201 plus \`Location\` for creations, 200 for the return.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`An HTTP request is just text: a request line (\`POST /loans HTTP/1.1\`), headers (\`Content-Type: application/json\`), a blank line and a body. The response is a status line (\`HTTP/1.1 201 Created\`), headers and a body. A web server parses that text and, for Python apps, hands it over as the WSGI \`environ\` dict.`,
      { code: py`from http import HTTPStatus

for code in (200, 201, 400, 404, 405, 409, 500):
    status = HTTPStatus(code)
    print(code, status.phrase, "-", status.description)`, lang: 'python', title: 'the standard library knows every status' },
    ],
    technical: [
      py`**WSGI details.** \`environ\` contains CGI-style keys (\`REQUEST_METHOD\`, \`PATH_INFO\`, \`QUERY_STRING\`, \`CONTENT_TYPE\`, \`CONTENT_LENGTH\`, headers as \`HTTP_*\`) plus \`wsgi.*\` keys; \`wsgi.input\` is a binary stream you must not read beyond \`CONTENT_LENGTH\`. \`start_response\` takes a status string and a list of \`(name, value)\` header tuples of native strings; the body is an iterable of bytes, which lets servers stream large responses. WSGI is synchronous; its async successor is **ASGI** (used by FastAPI/Starlette), where the app is an \`async\` callable receiving events.`,
      py`**sqlite3 transactions.** In the default (legacy) mode, the module opens a transaction implicitly before \`INSERT\`/\`UPDATE\`/\`DELETE\`, and \`with conn:\` commits or rolls back at the end of the block (it does *not* close the connection). Python 3.12 added the \`autocommit\` attribute for explicit PEP 249-style control. A \`BEGIN IMMEDIATE\` takes SQLite's write lock up front, so a read-check-write sequence can't interleave with another writer.`,
      py`**Partial indexes** store only rows that match the \`WHERE\` clause, so the uniqueness check ignores returned loans. PostgreSQL supports the same feature; MySQL needs a workaround (for example a generated column).`,
      { callout: 'note', title: 'CPython / SQLite detail', text: py`The SQLite library version depends on how Python was built (\`sqlite3.sqlite_version\`); features like \`RETURNING\` (SQLite 3.35+) or \`STRICT\` tables (3.37+) may be missing on older systems. This sandbox ships SQLite 3.39.` },
    ],
    production: [
      py`**Error contracts.** Clients write code against your error format, so keep it stable: an \`error\` message for humans plus machine-readable details. RFC 9457 (*Problem Details for HTTP APIs*) standardises a JSON shape (\`type\`, \`title\`, \`status\`, \`detail\`) worth adopting.`,
      py`**Idempotency.** \`GET\`, \`PUT\` and \`DELETE\` should be safe to retry; \`POST /loans\` is not — a client that retries after a timeout could borrow twice. Here the unique index turns the retry into a 409, but payment-style APIs use an \`Idempotency-Key\` header to return the original response instead.`,
      py`**Layering pays off in tests and changes.** The service and repository are reused unchanged by FastAPI, Flask, a CLI or a nightly job. Swapping SQLite for PostgreSQL touches \`db.py\` and the repository only — the rules and the HTTP contract stay put.`,
    ],
  },
  mistakes: [
    {
      title: 'Building SQL with f-strings',
      wrong: { code: py`def find_by_title(conn, title):
    return conn.execute(f"SELECT * FROM books WHERE title = '{title}'").fetchall()`, lang: 'python', static: true },
      right: { code: py`def find_by_title(conn, title):
    return conn.execute("SELECT * FROM books WHERE title = ?", (title,)).fetchall()`, lang: 'python', static: true },
      explanation: py`A title like \`x' OR '1'='1\` changes the query's meaning (SQL injection). Placeholders send values separately from the SQL, so they can never be executed as code.`,
    },
    {
      title: 'Returning 200 with an error inside',
      wrong: { code: py`return 200, {"ok": False, "error": "no copies available"}, {}`, lang: 'python', static: true },
      right: { code: py`raise ConflictError("no copies available")   # mapped to 409 in one place`, lang: 'python', static: true },
      explanation: py`Clients, proxies, monitoring and retry logic all read the status code. A 200 that means "failed" breaks every one of them. Use the status code that matches the outcome.`,
    },
    {
      title: 'Leaking internals in 500 responses',
      wrong: { code: py`except Exception as exc:
    status, body = 500, {"error": repr(exc), "trace": traceback.format_exc()}`, lang: 'python', static: true },
      right: { code: py`except Exception:
    logger.exception("unhandled error: %s %s", request.method, request.path)
    status, body = 500, {"error": "internal server error"}`, lang: 'python', static: true },
      explanation: py`Stack traces reveal file paths, library versions and SQL to attackers. Log the details server-side (with a request id) and send a generic message.`,
    },
    {
      title: 'HTTP knowledge inside the service',
      wrong: { code: py`class LibraryService:
    def borrow(self, payload):
        if not self.repo.get_book(payload["book_id"]):
            return 404, {"error": "no such book"}`, lang: 'python', static: true },
      right: { code: py`class LibraryService:
    def borrow(self, payload):
        if not self.repo.get_book(payload["book_id"]):
            raise NotFoundError("no such book")`, lang: 'python', static: true },
      explanation: py`Status codes belong to the HTTP layer. A service that returns them can't be reused by a CLI or a background job, and every caller must remember to check a tuple. Raise domain errors; map them at the edge.`,
    },
    {
      title: 'Forgetting that SQLite needs foreign keys switched on',
      wrong: { code: py`conn = sqlite3.connect("library.db")
conn.execute("INSERT INTO loans (book_id, member_id, borrowed_on, due_on) VALUES (999, 1, 'x', 'y')")
# silently accepted: book 999 doesn't exist`, lang: 'python', static: true },
      right: { code: py`conn = sqlite3.connect("library.db")
conn.execute("PRAGMA foreign_keys = ON")    # per connection!`, lang: 'python', static: true },
      explanation: py`SQLite enforces \`REFERENCES\` only when \`PRAGMA foreign_keys\` is on, and the setting is per connection. Put it in your single \`connect()\` function.`,
    },
  ],
  debugging: [
    {
      symptom: py`sqlite3.IntegrityError: UNIQUE constraint failed: books.isbn — and the client gets 500.`,
      cause: py`The database rejected a duplicate, but nothing translated the driver error into a domain error, so it hit the catch-all handler.`,
      fix: py`Catch \`sqlite3.IntegrityError\` in the repository and raise \`ConflictError\`, which the app maps to 409.`,
    },
    {
      symptom: py`sqlite3.ProgrammingError: Incorrect number of bindings supplied. The current statement uses 1, and there are 4 supplied.`,
      cause: py`Parameters were passed as a string or without the trailing comma: \`(book_id)\` or \`"1234"\` instead of \`(book_id,)\`.`,
      fix: py`Always pass a tuple or list: \`conn.execute("... WHERE id = ?", (book_id,))\`.`,
    },
    {
      symptom: py`TypeError: Object of type date is not JSON serializable`,
      cause: py`A \`Loan\` with \`date\` fields was passed to \`json.dumps\` via \`asdict()\`.`,
      fix: py`Give models a \`to_dict()\` that converts dates with \`.isoformat()\` — the JSON contract should be explicit anyway.`,
    },
    {
      symptom: py`Every POST answers 400 "a JSON body is required" even though the client sends JSON.`,
      cause: py`The app reads \`CONTENT_LENGTH\` bytes, but the client (or a test helper) didn't set the header, so the length is 0.`,
      fix: py`Send \`Content-Length\` (HTTP clients do this automatically); in a hand-built environ, set \`CONTENT_LENGTH\` to \`str(len(body))\`.`,
    },
    {
      symptom: py`A test passes alone but fails after another test: "UNIQUE constraint failed: members.email".`,
      cause: py`Tests share one database (a module-level app or a file-based database).`,
      fix: py`Create a fresh app with \`":memory:"\` in every test, or wrap each test in a transaction that is rolled back.`,
    },
  ],
  bestPractices: [
    'Write the API contract (paths, methods, status codes, error format) before the code.',
    'Enforce invariants in the schema: NOT NULL, UNIQUE, CHECK, foreign keys, partial unique indexes.',
    'Keep SQL in a repository and use placeholders for every value.',
    'Keep business rules in a service that raises domain errors and knows nothing about HTTP.',
    'Validate untrusted input completely and report every problem at once; reject unknown fields.',
    'Map errors to status codes in one place; log unexpected errors and return a generic 500.',
    'Inject the clock and the database so tests are fast, deterministic and independent.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-library-api-q1',
      type: 'mcq',
      prompt: 'A member asks to borrow a book they already have on loan. The request JSON is perfectly valid. Which status code fits best?',
      options: [
        { text: '400 Bad Request', why: 'Nothing is wrong with the request itself; the same request would succeed if they hadn\'t borrowed the book already.' },
        { text: '404 Not Found', why: 'The book and the member both exist.' },
        '409 Conflict',
        { text: '500 Internal Server Error', why: '500 means the server failed unexpectedly. This is an expected, rule-based refusal.' },
      ],
      answer: 2,
      explanation: py`409 means "valid request, but it conflicts with the current state of the resource". It's the code clients use to show "already borrowed" or "no copies left".`,
    },
    {
      id: 'project-library-api-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import re

template = "/books/<book_id>"
pattern = re.compile(re.sub(r"<(\w+)>", lambda m: f"(?P<{m[1]}>[0-9]+)", template))
print(pattern.fullmatch("/books/42")["book_id"], pattern.fullmatch("/books/42/x"))`,
      answer: '42 None',
      accept: ['42 None'],
      explanation: py`The template becomes \`/books/(?P<book_id>[0-9]+)\`. \`fullmatch\` succeeds for \`/books/42\` (group value \`"42"\`, a string) and fails for \`/books/42/x\`, returning \`None\`.`,
    },
    {
      id: 'project-library-api-q3',
      type: 'bug',
      prompt: 'This repository method has a security bug. Click the line.',
      code: py`def search_books(self, author):
    sql = "SELECT id, title FROM books"
    if author:
        sql += f" WHERE author = '{author}'"
    rows = self.conn.execute(sql).fetchall()
    return [dict(row) for row in rows]`,
      answerLine: 4,
      explanation: py`Formatting user input into SQL allows SQL injection (\`author = "x' OR '1'='1"\`). Use a placeholder: \`sql += " WHERE author = ?"\` and pass \`(author,)\` to \`execute\`.`,
    },
    {
      id: 'project-library-api-q4',
      type: 'fill',
      prompt: 'Complete the query so the member id is sent as a parameter.',
      code: py`row = conn.execute(
    "SELECT COUNT(*) FROM loans WHERE member_id = ___ AND returned_on IS NULL",
    (member_id___),
).fetchone()`,
      answer: [['?'], [',']],
      explanation: py`sqlite3 uses \`?\` placeholders, and parameters must be a sequence — \`(member_id,)\` with the trailing comma is a one-element tuple.`,
    },
    {
      id: 'project-library-api-q5',
      type: 'mcq',
      prompt: 'Where should the rule "a member may have at most 3 open loans" live?',
      options: [
        { text: 'In the HTTP handler for POST /loans', why: 'Then a CLI, a batch import or another endpoint could bypass it. Handlers should translate, not decide.' },
        'In the service layer (LibraryService.borrow)',
        { text: 'In the WSGI client used by tests', why: 'The client is just a testing tool; production traffic never goes through it.' },
        { text: 'In the JSON validation function', why: 'Validation checks the shape of one request; the rule depends on the database state (how many loans are open).' },
      ],
      answer: 1,
      explanation: py`Business rules that depend on state belong in the service, where every entry point (HTTP, CLI, jobs) goes through them. Shape checks go in validation; hard invariants go in the schema.`,
    },
    {
      id: 'project-library-api-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from http import HTTPStatus

print(HTTPStatus(409).phrase, int(HTTPStatus.CREATED))`,
      options: [
        'Conflict 201',
        { text: 'CONFLICT 201', why: '.phrase is the human-readable reason phrase ("Conflict"); the member name is CONFLICT.' },
        { text: 'Conflict CREATED', why: 'int() of an IntEnum member gives its number.' },
        { text: '409 Created', why: '.phrase returns text, not the number.' },
      ],
      answer: 0,
      explanation: py`\`HTTPStatus\` is an \`IntEnum\`: \`HTTPStatus(409).phrase\` is \`"Conflict"\` and \`int(HTTPStatus.CREATED)\` is \`201\`. The app uses it to build status lines like \`"409 Conflict"\`.`,
    },
    {
      id: 'project-library-api-q7',
      type: 'short',
      prompt: 'The service already checks for double borrowing. Why also add a partial unique index to the database?',
      answer: py`Because the check and the insert are separate steps: two concurrent requests (or another program, or a future bug) can both pass the check before either inserts. The index makes the database itself refuse the second open loan atomically, so the invariant holds no matter which code path writes. The service check still gives a friendly message in the common case.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-library-api-layers',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Explain the layers of your library API. What belongs in each, and how do errors travel from the database to the client?',
      answer: 'HTTP layer (routing, parsing, status codes), service layer (business rules, transactions), repository (SQL), and the database (constraints). Errors flow upward as domain exceptions: the repository translates IntegrityError into ConflictError, the service raises NotFoundError/ConflictError/ValidationError, and the HTTP layer maps each to 404/409/400 in one place, with a generic 500 for anything unexpected.',
      explanation: py`Each layer depends only on the one below and speaks its own vocabulary: HTTP (requests, status codes), domain (books, loans, rules), persistence (rows, SQL). Translating errors at each boundary keeps sqlite3 details out of the service and HTTP details out of the rules, so each layer can be tested and replaced independently.`,
      whyAsked: 'Back-end interviews almost always probe separation of concerns and error handling across layers.',
      mistakes: ['Putting SQL in handlers', 'Returning status codes from the service', 'Catching all exceptions in every layer'],
      followUps: ['How would you add a GraphQL or CLI interface?', 'Where do you put authorisation checks?', 'How do you test the service without a database?'],
      modelAnswer: 'There are four layers. The HTTP layer — a WSGI app with a router — parses requests, calls the service and turns results and exceptions into responses. The service holds the library’s rules, like the loan limit and no double borrowing, runs them inside a transaction and raises domain errors; it knows nothing about HTTP. The repository is the only place with SQL, always parameterised, and it translates driver errors such as IntegrityError into domain errors. Finally the schema enforces invariants with UNIQUE, CHECK, foreign keys and a partial unique index. So an error starts as a constraint violation or a rule check, becomes a ConflictError or NotFoundError, and the HTTP layer maps it to 409 or 404 in one place, logging and hiding anything unexpected behind a generic 500.',
    },
    {
      id: 'project-library-api-last-copy',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Two librarians press "lend" for the last copy of a book at the same moment, on two different server processes. Walk through what can happen and how your design prevents a double loan.',
      answer: 'Both requests can read “1 available” before either inserts — a check-then-act race. The service checks alone can’t stop it. Prevent it with the database: take the write lock first (BEGIN IMMEDIATE in SQLite, SELECT ... FOR UPDATE in PostgreSQL) so the second transaction waits and then sees 0 available, and/or a constraint that makes the invalid state impossible. The loser gets a 409.',
      explanation: py`Separate processes don't share memory, so only the database can serialise them. For "copies available" there's no simple unique constraint, so you serialise the transactions (an immediate/exclusive lock, row locks, or an atomic conditional \`UPDATE books SET on_loan = on_loan + 1 WHERE id = ? AND on_loan < copies\`). For "same member, same book" the partial unique index already guarantees correctness.`,
      whyAsked: 'Concurrency bugs are common in real APIs and hard to see in single-user testing.',
      mistakes: ['Suggesting a Python threading.Lock across processes', 'Assuming a transaction alone prevents the race at every isolation level', 'Ignoring what the losing request should receive'],
      followUps: ['What is optimistic locking?', 'How would you write a test that reproduces this race?', 'What isolation level does PostgreSQL use by default?'],
      modelAnswer: 'Without protection both requests can read that one copy is available, both pass the check and both insert a loan, so we lend a book we don’t have. A Python lock doesn’t help because the requests run in different processes; the database has to serialise them. In SQLite I would begin the borrow transaction with BEGIN IMMEDIATE so the second request waits for the first to commit and then sees zero copies. In PostgreSQL I would lock the book row with SELECT FOR UPDATE or use a conditional UPDATE that only succeeds while copies remain, checking the affected row count. Where possible I also make invalid states impossible with constraints, like the partial unique index for double borrowing. The loser gets a clean 409.',
    },
    {
      id: 'project-library-api-status-codes',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare 400, 404, 409 and 422 for an API like this one. When would you use each?',
      answer: '400: the request is malformed (bad JSON, wrong types). 422: syntactically fine JSON that fails semantic validation (FastAPI’s default for validation errors). 404: the referenced resource doesn’t exist. 409: the request is valid but conflicts with the current state (already borrowed, duplicate ISBN).',
      explanation: py`The key question is *what would make the request succeed?* Fixing the request → 400/422. Pointing at something that exists → 404. Changing the state of the world (return the book first) → 409. Whatever split you choose between 400 and 422, apply it consistently and document it.`,
      whyAsked: 'Correct status codes show you think about API consumers, not just server code.',
      mistakes: ['Using 500 for business-rule violations', 'Using 404 for “not allowed”', 'Returning 200 with an error payload'],
      followUps: ['When is 403 better than 404?', 'What should a 201 response include?', 'What does 412 Precondition Failed mean?'],
      modelAnswer: 'I ask what the client would need to change for the request to succeed. If the request itself is broken — invalid JSON, a string where an id should be — that’s 400, and some frameworks like FastAPI use 422 for well-formed JSON that fails validation; I pick one convention and document it. If the request refers to something that doesn’t exist, like book 99, it’s 404. If the request is fine but the current state forbids it, like borrowing a book you already have or adding a duplicate ISBN, it’s 409, because it could succeed after the state changes. And creations return 201 with a Location header.',
    },
    {
      id: 'project-library-api-500-duplicate',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Your monitoring shows a spike of 500 errors on POST /members. The logs say `sqlite3.IntegrityError: UNIQUE constraint failed: members.email`. What is wrong and how do you fix it properly?',
      answer: 'A duplicate email is an expected client-side conflict, but the IntegrityError isn’t translated, so it falls into the catch-all 500 handler. Catch IntegrityError in the repository’s add_member and raise ConflictError (mapped to 409), and add a test for the duplicate case. Optionally normalise emails (strip, lower-case) so “Ada@x.com” and “ada@x.com” collide predictably.',
      explanation: py`500s should mean "we have a bug". Expected outcomes must be mapped to 4xx codes, or alerting becomes noise and clients can't react. Translating at the repository boundary keeps sqlite3 out of upper layers; normalisation makes the uniqueness rule match what users expect.`,
      whyAsked: 'Tests whether you can read production signals and fix the root cause rather than the symptom.',
      mistakes: ['Catching the error in the HTTP handler with a string match on the message', 'Checking “does the email exist?” before inserting and calling it fixed (still racy)', 'Silencing the alert'],
      followUps: ['Why is “check first, then insert” not enough?', 'How do you make email uniqueness case-insensitive in SQL? (COLLATE NOCASE or a normalised column)'],
      modelAnswer: 'The database is doing its job — the email must be unique — but the repository lets the raw IntegrityError escape, so the app’s catch-all turns an ordinary conflict into a 500. I would catch IntegrityError around the insert in the repository and raise our ConflictError, which the HTTP layer maps to 409, and add a regression test that posts the same member twice. I wouldn’t rely on a SELECT before the INSERT, because two requests can race between them; the constraint plus translation is the robust fix. I’d also normalise emails to lower case so the uniqueness rule matches users’ expectations.',
    },
    {
      id: 'project-library-api-pagination',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Write `page_params(query)` for `GET /books`. `query` is what `urllib.parse.parse_qs` returns (a dict of lists). Return `(limit, offset)`: limit defaults to 20 and must be 1–100, offset defaults to 0 and must be ≥ 0. Use the first value if a parameter repeats. Raise `ValueError` with a helpful message for anything invalid (non-numbers, out of range).',
      answer: 'Read the first value of each key with a default, convert with int() inside try/except, then range-check; raise ValueError (which the app would map to 400).',
      explanation: py`Query parameters always arrive as strings in lists, because \`?limit=5&limit=7\` is legal. Converting and range-checking at the edge protects the database from \`LIMIT 1000000\` and negative offsets. A cap on \`limit\` is a basic denial-of-service defence.`,
      starter: { files: { 'main.py': py`from urllib.parse import parse_qs


def page_params(query):
    # TODO: validate and convert
    return query.get("limit", 20), query.get("offset", 0)


print(page_params(parse_qs("limit=5&offset=10")))
` } },
      tests: [
        { name: 'defaults and conversion', code: py`from urllib.parse import parse_qs
assert page_params({}) == (20, 0)
assert page_params(parse_qs("limit=5&offset=10")) == (5, 10)
assert page_params(parse_qs("limit=7&limit=9")) == (7, 0)` },
        { name: 'bounds are enforced', code: py`from urllib.parse import parse_qs
assert page_params(parse_qs("limit=100"))[0] == 100
for bad in ("limit=0", "limit=101", "offset=-1"):
    with raises(ValueError):
        page_params(parse_qs(bad))` },
        { name: 'non-numbers raise ValueError', code: py`from urllib.parse import parse_qs
for bad in ("limit=ten", "offset=1.5", "limit="):
    with raises(ValueError):
        page_params(parse_qs(bad, keep_blank_values=True))` },
      ],
      solution: { files: { 'main.py': py`from urllib.parse import parse_qs

MAX_LIMIT = 100


def _int_param(query, name, default):
    raw = query.get(name, [str(default)])[0]
    try:
        return int(raw)
    except ValueError:
        raise ValueError(f"{name} must be a whole number, got {raw!r}") from None


def page_params(query):
    limit = _int_param(query, "limit", 20)
    offset = _int_param(query, "offset", 0)
    if not 1 <= limit <= MAX_LIMIT:
        raise ValueError(f"limit must be between 1 and {MAX_LIMIT}, got {limit}")
    if offset < 0:
        raise ValueError(f"offset must be 0 or more, got {offset}")
    return limit, offset


print(page_params(parse_qs("limit=5&offset=10")))
` } },
      hints: ['parse_qs gives lists: query.get("limit", ["20"])[0].', 'int("1.5") and int("") both raise ValueError — re-raise with a clearer message.', 'Check 1 <= limit <= 100 and offset >= 0 after converting.'],
      whyAsked: 'Small, realistic input-handling task that shows defensive thinking at an API boundary.',
      mistakes: ['Forgetting values are lists of strings', 'No upper bound on limit', 'Letting int() errors escape with an unhelpful message'],
      followUps: ['Why do large OFFSET values get slow, and what is keyset (cursor) pagination?', 'How would you return a “next” link?'],
      modelAnswer: 'parse_qs gives me lists of strings, so I take the first value of each parameter with a default, convert it with int inside a try block and re-raise a ValueError naming the parameter. Then I range-check: limit between 1 and a maximum of 100, offset at least 0. The HTTP layer maps that ValueError to a 400. The cap on limit matters because it stops a single request from pulling the whole table. For very large tables I would move from offset to keyset pagination, where the client passes the last id it saw.',
    },
  ],

  takeaways: [
    'Design the contract first: resources, methods, status codes (200/201/400/404/405/409/500) and an error format.',
    'Let the database enforce invariants — UNIQUE, CHECK, foreign keys (switched on in SQLite) and partial unique indexes.',
    'All SQL lives in a repository and every value goes through ? placeholders.',
    'Business rules live in a service that raises domain errors, runs in transactions and takes an injected clock.',
    'WSGI is just app(environ, start_response) returning bytes — which makes in-process API tests easy.',
    'Map errors to status codes in one place; log unexpected errors and return a generic 500.',
    'Frameworks like FastAPI and Flask replace the plumbing, not the layers.',
  ],
}
