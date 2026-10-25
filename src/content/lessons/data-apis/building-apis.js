// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const FRAMEWORK_PY = py`"""A tiny web framework on top of WSGI (PEP 3333). Simplified for teaching:
real frameworks add streaming, cookies, forms, middleware hooks and much more.
"""
import json
import re
import traceback
from http import HTTPStatus
from urllib.parse import parse_qs


class HTTPError(Exception):
    """Raise anywhere in a handler to send an error response."""

    def __init__(self, status, message, details=None, headers=None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.details = details
        self.headers = headers or {}


class Request:
    def __init__(self, environ, params):
        self.method = environ["REQUEST_METHOD"]
        self.path = environ.get("PATH_INFO", "/")
        self.query = {k: v[0] for k, v in parse_qs(environ.get("QUERY_STRING", "")).items()}
        self.headers = {key[5:].replace("_", "-").title(): value
                        for key, value in environ.items() if key.startswith("HTTP_")}
        self.content_type = environ.get("CONTENT_TYPE", "")
        length = int(environ.get("CONTENT_LENGTH") or 0)
        self.body = environ["wsgi.input"].read(length) if length else b""
        self.params = params                    # from the URL pattern: {"isbn": "978..."}

    def json(self):
        if not self.content_type.startswith("application/json"):
            raise HTTPError(415, "send JSON with Content-Type: application/json")
        try:
            return json.loads(self.body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise HTTPError(400, "the body is not valid JSON") from None


class App:
    def __init__(self):
        self.routes = []                        # (method, compiled pattern, handler)

    def route(self, method, pattern):
        """Decorator: @app.route("GET", "/books/{isbn}")."""
        regex = re.compile("^" + re.sub(r"\{(\w+)\}", r"(?P<\1>[^/]+)", pattern) + "$")

        def register(handler):
            self.routes.append((method, regex, handler))
            return handler
        return register

    def __call__(self, environ, start_response):      # <- the WSGI entry point
        try:
            status, data, headers = self.dispatch(environ)
        except HTTPError as exc:
            data = {"error": exc.message}
            if exc.details:
                data["details"] = exc.details
            status, headers = exc.status, exc.headers
        except Exception:
            traceback.print_exc()                       # for you, in the server log...
            status, data, headers = 500, {"error": "internal server error"}, {}  # ...not them
        status = HTTPStatus(status)
        body = b"" if data is None else json.dumps(data).encode("utf-8")
        header_list = [("Content-Type", "application/json")] if body else []
        header_list += list(headers.items()) + [("Content-Length", str(len(body)))]
        start_response(f"{status.value} {status.phrase}", header_list)
        return [body]

    def dispatch(self, environ):
        method, path = environ["REQUEST_METHOD"], environ.get("PATH_INFO", "/")
        allowed = []
        for route_method, regex, handler in self.routes:
            match = regex.match(path)
            if not match:
                continue
            if route_method != method:
                allowed.append(route_method)
                continue
            result = handler(Request(environ, match.groupdict()))
            if not isinstance(result, tuple):           # plain data means 200 OK
                result = (200, result)
            status, data, *rest = result
            return status, data, (rest[0] if rest else {})
        if allowed:
            raise HTTPError(405, f"{method} is not allowed here",
                            headers={"Allow": ", ".join(allowed)})
        raise HTTPError(404, f"no route for {path}")
`

const TESTCLIENT_PY = py`"""Call a WSGI app directly: no server, no socket. Like Flask's test_client()."""
import io
import json
from wsgiref.util import setup_testing_defaults
from wsgiref.validate import validator


def call(app, method, path, json_body=None, headers=None, raw_body=None,
         content_type="application/json"):
    """Returns (status code, headers dict, decoded JSON body or None)."""
    path, _, query = path.partition("?")
    if raw_body is None:
        raw_body = b"" if json_body is None else json.dumps(json_body).encode("utf-8")
    environ = {
        "REQUEST_METHOD": method,
        "SCRIPT_NAME": "",
        "PATH_INFO": path,
        "QUERY_STRING": query,
        "CONTENT_LENGTH": str(len(raw_body)),
        "wsgi.input": io.BytesIO(raw_body),
    }
    if raw_body:
        environ["CONTENT_TYPE"] = content_type
    for name, value in (headers or {}).items():          # "X-Api-Key" -> HTTP_X_API_KEY
        environ["HTTP_" + name.upper().replace("-", "_")] = value
    setup_testing_defaults(environ)                       # adds the other required WSGI keys

    captured = {}

    def start_response(status, response_headers, exc_info=None):
        captured["status"] = int(status.split()[0])
        captured["headers"] = dict(response_headers)

    result = validator(app)(environ, start_response)      # also checks we follow PEP 3333
    try:
        raw = b"".join(result)
    finally:
        result.close()
    return captured["status"], captured["headers"], (json.loads(raw) if raw else None)
`

const MAIN_PY = py`"""A small library API, built on the tiny framework in framework.py."""
import hmac
from datetime import date

from framework import App, HTTPError
from testclient import call

app = App()
API_TOKEN = "lib-demo-token"                 # real code: os.environ["LIBRARY_API_TOKEN"]
BOOKS = {
    "9780000000001": {"isbn": "9780000000001", "title": "Dune", "author": "Frank Herbert", "year": 1965},
    "9780000000002": {"isbn": "9780000000002", "title": "Emma", "author": "Jane Austen", "year": 1815},
}


def require_token(request):
    supplied = request.headers.get("Authorization", "").encode()
    expected = f"Bearer {API_TOKEN}".encode()
    if not hmac.compare_digest(supplied, expected):      # constant-time comparison
        raise HTTPError(401, "missing or invalid token", headers={"WWW-Authenticate": "Bearer"})


def validate_book(data, isbn=None):
    """Return a clean book dict, or raise 422 listing every problem."""
    if not isinstance(data, dict):
        raise HTTPError(422, "expected a JSON object")
    isbn = data.get("isbn") if isbn is None else isbn    # PUT takes the ISBN from the URL
    problems = {}
    for field in ("title", "author"):
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            problems[field] = "required, non-empty text"
    year = data.get("year")
    if type(year) is not int or not 0 < year <= date.today().year:
        problems["year"] = "a whole number, not in the future"
    if not (isinstance(isbn, str) and len(isbn) == 13 and isbn.isdigit()):
        problems["isbn"] = "13 digits"
    if problems:
        raise HTTPError(422, "validation failed", details=problems)
    return {"isbn": isbn, "title": data["title"].strip(),
            "author": data["author"].strip(), "year": year}


@app.route("GET", "/books")
def list_books(request):
    return sorted(BOOKS.values(), key=lambda book: book["title"])


@app.route("GET", "/books/{isbn}")
def get_book(request):
    book = BOOKS.get(request.params["isbn"])
    if book is None:
        raise HTTPError(404, "no such book")
    return book


@app.route("POST", "/books")
def create_book(request):
    require_token(request)
    book = validate_book(request.json())                  # 415 / 400 / 422
    if book["isbn"] in BOOKS:
        raise HTTPError(409, "a book with this ISBN already exists")
    BOOKS[book["isbn"]] = book
    return 201, book, {"Location": f"/books/{book['isbn']}"}


@app.route("PUT", "/books/{isbn}")
def put_book(request):
    require_token(request)
    book = validate_book(request.json(), isbn=request.params["isbn"])
    created = book["isbn"] not in BOOKS
    BOOKS[book["isbn"]] = book                            # same request twice -> same state
    return (201 if created else 200), book


@app.route("DELETE", "/books/{isbn}")
def delete_book(request):
    if BOOKS.pop(request.params["isbn"], None) is None:
        raise HTTPError(404, "no such book")
    return 204, None


# ---- try it: requests go straight into app(environ, start_response) ----
AUTH = {"Authorization": f"Bearer {API_TOKEN}"}
KINDRED = {"isbn": "9780000000003", "title": "Kindred", "author": "Octavia E. Butler", "year": 1979}
BELOVED = {"title": "Beloved", "author": "Toni Morrison", "year": 1987}


def show(method, path, **kwargs):
    status, headers, body = call(app, method, path, **kwargs)
    location = f"  (Location: {headers['Location']})" if "Location" in headers else ""
    print(f"{method:<6} {path:<20} -> {status} {body}{location}")


show("GET", "/books/9780000000001")
show("GET", "/books/9789999999999")
show("POST", "/books", json_body=KINDRED)
show("POST", "/books", json_body=KINDRED, headers=AUTH)
show("POST", "/books", json_body=KINDRED, headers=AUTH)
show("POST", "/books", json_body={"isbn": "123", "title": " ", "year": 3000}, headers=AUTH)
show("POST", "/books", raw_body=b'{"title": "Du', headers=AUTH)
show("POST", "/books", raw_body=b"title=Dune", content_type="text/plain", headers=AUTH)
show("PUT", "/books/9780000000004", json_body=BELOVED, headers=AUTH)
show("PUT", "/books/9780000000004", json_body=BELOVED, headers=AUTH)
show("DELETE", "/books/9780000000004", headers=AUTH)
show("PATCH", "/books")
`

const FLASK_APP = py`import hmac
import os

from flask import Flask, abort, request

app = Flask(__name__)
API_TOKEN = os.environ["LIBRARY_API_TOKEN"]
BOOKS = {}


def require_token():
    supplied = request.headers.get("Authorization", "").encode()
    if not hmac.compare_digest(supplied, f"Bearer {API_TOKEN}".encode()):
        abort(401, description="missing or invalid token")


@app.get("/books/<isbn>")
def get_book(isbn):
    book = BOOKS.get(isbn)
    if book is None:
        abort(404, description="no such book")
    return book                                      # a dict becomes a JSON response


@app.post("/books")
def create_book():
    require_token()
    data = request.get_json(silent=True)             # None if the body isn't valid JSON
    if data is None:
        return {"error": "the body is not valid JSON"}, 400
    problems = check_book(data)                      # your validation function
    if problems:
        return {"error": "validation failed", "details": problems}, 422
    if data["isbn"] in BOOKS:
        return {"error": "a book with this ISBN already exists"}, 409
    BOOKS[data["isbn"]] = data
    return data, 201, {"Location": f"/books/{data['isbn']}"}


@app.errorhandler(404)
@app.errorhandler(401)
def json_error(error):
    return {"error": error.description}, error.code`

const FASTAPI_APP = py`import hmac
import os
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from pydantic import BaseModel, Field

app = FastAPI()
API_TOKEN = os.environ["LIBRARY_API_TOKEN"]


class BookIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    author: str = Field(min_length=1)
    year: int = Field(gt=0, le=2100)


class Book(BookIn):
    isbn: str = Field(pattern=r"^\d{13}$")


BOOKS: dict[str, Book] = {}


def require_token(authorization: Annotated[str | None, Header()] = None) -> None:
    supplied = (authorization or "").encode()
    if not hmac.compare_digest(supplied, f"Bearer {API_TOKEN}".encode()):
        raise HTTPException(status_code=401, detail="missing or invalid token",
                            headers={"WWW-Authenticate": "Bearer"})


@app.get("/books/{isbn}")
def get_book(isbn: str) -> Book:
    if isbn not in BOOKS:
        raise HTTPException(status_code=404, detail="no such book")
    return BOOKS[isbn]


@app.post("/books", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_token)])
def create_book(book: Book, response: Response) -> Book:      # invalid JSON body -> automatic 422
    if book.isbn in BOOKS:
        raise HTTPException(status_code=409, detail="a book with this ISBN already exists")
    BOOKS[book.isbn] = book
    response.headers["Location"] = f"/books/{book.isbn}"
    return book


@app.put("/books/{isbn}", dependencies=[Depends(require_token)])
def put_book(isbn: str, book: BookIn) -> Book:
    BOOKS[isbn] = Book(isbn=isbn, **book.model_dump())
    return BOOKS[isbn]`

export default {
  id: 'building-apis',
  title: 'Building an API: routing, validation & status codes',
  summary: 'Build a JSON API from the ground up on WSGI — routing, parsing, validation, precise status codes, idempotent PUT, auth and tests — then see the same API in Flask and FastAPI.',
  difficulty: 'advanced',
  minutes: 80,
  prerequisites: ['http-and-rest', 'decorators', 'raising-exceptions', 'json-data'],
  related: ['http-and-rest', 'http-clients', 'database-patterns', 'input-validation', 'injection-attacks', 'secrets-and-passwords', 'secure-practices', 'testing-fundamentals', 'pytest-basics', 'clean-architecture', 'asyncio-basics', 'project-library-api', 'project-production-service'],
  tags: ['api', 'rest api', 'web framework', 'wsgi', 'pep 3333', 'wsgiref', 'environ', 'start_response', 'asgi', 'routing', 'handler', 'validation', '400', '404', '405', '409', '415', '422', '401', 'status codes', 'put vs post', 'idempotent', 'flask', 'fastapi', 'pydantic', 'test client', 'authentication', 'authorization', 'cors', 'middleware'],
  apis: [
    { name: 'WSGI app(environ, start_response)', summary: 'PEP 3333: a callable that reads the request from environ, calls start_response(status, headers) and returns an iterable of bytes.' },
    { name: 'wsgiref.util.setup_testing_defaults(environ)', summary: 'Fills in the standard WSGI keys so you can call an app directly in tests.' },
    { name: 'wsgiref.validate.validator(app)', summary: 'Wraps an app and checks that both sides follow the WSGI spec.' },
    { name: 'wsgiref.simple_server.make_server()', summary: 'A minimal development HTTP server for WSGI apps (not for production).' },
    { name: 'hmac.compare_digest(a, b)', summary: 'Constant-time comparison for secrets such as API tokens.' },
    { name: 'flask.Flask / @app.get / request.get_json()', summary: 'Flask’s app object, route decorators and JSON body parsing.' },
    { name: 'fastapi.FastAPI / HTTPException', summary: 'FastAPI’s app object and the exception that becomes an error response.' },
    { name: 'pydantic.BaseModel / Field', summary: 'Declarative validation used by FastAPI; invalid bodies get an automatic 422.' },
  ],
  docs: [
    { label: 'PEP 3333 — Python Web Server Gateway Interface v1.0.1', url: 'https://peps.python.org/pep-3333/' },
    { label: 'wsgiref — WSGI utilities and reference implementation', url: 'https://docs.python.org/3/library/wsgiref.html' },
    { label: 'RFC 9110 — status codes', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes' },
    { label: 'Flask — quickstart', url: 'https://flask.palletsprojects.com/en/stable/quickstart/' },
    { label: 'FastAPI — first steps', url: 'https://fastapi.tiangolo.com/tutorial/first-steps/' },
    { label: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
    { label: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [HTTP & REST](lesson:http-and-rest) you learned what requests and responses look like; in [HTTP clients](lesson:http-clients) you sent them. Now you'll **answer** them: build the server side of a JSON API.`,
    py`A **web framework** (Flask, FastAPI, Django…) is a library that does the repetitive parts of answering HTTP requests so you can write just the interesting part — the **handler** function for each URL. To see what frameworks really do, this lesson first builds a tiny one on **WSGI**, the standard interface between Python web apps and web servers, which lives in the standard library and runs right here in the playground. Then it shows the same API in Flask and FastAPI.`,
    py`Along the way you'll practise the decisions that make an API pleasant and safe to use: **which status code** for which failure (400 vs 404 vs 409 vs 422…), **validation** that reports every problem at once, **idempotent** \`PUT\` versus \`POST\`, **authentication**, **CORS**, and **testing** an API without starting a server.`,
    { callout: 'note', title: 'About the playground', text: py`There's no network in the browser, so nothing listens on a port. Instead, requests are delivered by calling the WSGI app directly — \`app(environ, start_response)\` — which is exactly what a real server does after reading the bytes off the socket, and exactly how framework test clients work.` },
  ],
  why: [
    py`Every app with users eventually needs an API: for its own web or mobile front end, for partners, for other services. The API *is* the contract — once other people's code depends on it, mistakes are expensive to change.`,
    py`Precise status codes and consistent errors are what let clients react correctly: retry a \`503\`, fix the form on a \`422\`, ask for a login on a \`401\`, tell the user "already taken" on a \`409\`. An API that answers \`200\` or \`500\` to everything forces every client to guess.`,
    py`And an API is a **trust boundary**: everything in a request — path, query, headers, body — comes from someone you don't control. Validation, authentication and authorisation happen here or not at all ([input validation](lesson:input-validation)).`,
  ],
  eli15: [
    py`Picture the reception desk of a big school. Visitors hand in notes: "GET the timetable for class 9B", "POST: here's a new club sign-up form".`,
    py`The receptionist doesn't do every job personally. They read the note, check who it's from, look at *what* is asked and *where* it should go, and pass it to the right person — the timetable office, the clubs teacher. That's **routing** to a **handler**.`,
    py`Before passing on a form, they check it's filled in properly. A note that's just scribbles gets "I can't read this" (**400**). A neat form with the age box saying "-5" gets "this doesn't make sense" (**422**). Asking for class 9Z, which doesn't exist, gets "no such class" (**404**). Signing up for a club you're already in gets "you're already a member" (**409**). No visitor badge? "Who are you?" (**401**).`,
    py`A **framework** is a receptionist who already knows all these rules, so you only write the people in the offices.`,
  ],
  analogy: {
    title: 'A school reception desk',
    body: [
      py`The reception desk sits between the outside world and the school. It receives every note, reads it in a standard way, checks badges, sends each note to the right office, checks forms before they go further, and always replies with a short, standard verdict slip plus details.`,
      py`If the desk follows the same rules every time, visitors learn them once and can deal with any office. If the desk said "OK!" to everything and silently threw bad forms away, nobody could ever trust it.`,
    ],
    mapping: [
      ['the doors and the post room', 'the web server (gunicorn, uvicorn): sockets and raw bytes'],
      ['the receptionist’s standard way of reading notes', 'WSGI / ASGI: the interface between server and app'],
      ['looking up which office handles a note', 'routing: method + URL pattern → handler'],
      ['an office that does the actual work', 'a handler function'],
      ['checking visitor badges', 'authentication (401) and permissions (403)'],
      ['checking a form is filled in properly', 'validation (400 unreadable, 422 invalid)'],
      ['"you’re already signed up"', '409 Conflict with the current state'],
      ['the standard verdict slip', 'a status code plus a consistent JSON error body'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'What happens between the socket and your handler',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'client', label: 'client', note: 'browser, app, curl', x: 80, y: 60, tone: 'yellow' },
        { id: 'server', label: 'web server', note: 'gunicorn / uvicorn: sockets, HTTP parsing', x: 300, y: 60, tone: 'kraft' },
        { id: 'wsgi', label: 'app(environ, start_response)', note: 'WSGI: the request as a dict', x: 580, y: 60, tone: 'blue' },
        { id: 'middleware', label: 'middleware', note: 'auth · CORS · logging', x: 580, y: 160 },
        { id: 'router', label: 'router', note: 'method + path → handler', x: 580, y: 260 },
        { id: 'handler', label: 'handler', note: 'validate → do the work', x: 300, y: 260, tone: 'yellow' },
        { id: 'response', label: 'status + headers + JSON', note: 'or an error response', x: 80, y: 260, tone: 'blue' },
      ],
      edges: [
        { from: 'client', to: 'server', label: 'bytes' },
        { from: 'server', to: 'wsgi', label: 'calls' },
        { from: 'wsgi', to: 'middleware' },
        { from: 'middleware', to: 'router' },
        { from: 'router', to: 'handler' },
        { from: 'handler', to: 'response' },
        { from: 'response', to: 'client', label: 'bytes', dashed: true },
      ],
      steps: [
        { focus: ['client', 'server'], edges: ['client->server'], text: py`The client's bytes arrive at a **web server** process. It handles sockets, TLS (often via a proxy in front), timeouts and HTTP parsing — work you never want to write yourself.` },
        { focus: ['wsgi'], edges: ['server->wsgi'], text: py`The server turns the request into an \`environ\` **dict** (\`REQUEST_METHOD\`, \`PATH_INFO\`, \`QUERY_STRING\`, \`HTTP_*\` headers, \`wsgi.input\` for the body) and calls your app. That one function signature is **WSGI** (PEP 3333); its async cousin is **ASGI**.` },
        { focus: ['middleware'], edges: ['wsgi->middleware'], text: py`**Middleware** wraps the app to handle cross-cutting concerns for every request: checking tokens, adding CORS headers, logging, request ids.` },
        { focus: ['router'], edges: ['middleware->router'], text: py`The **router** matches method + path against patterns like \`/books/{isbn}\`, extracts the parameters, and picks the handler — or answers \`404\` (no such path) / \`405\` (path exists, wrong method).` },
        { focus: ['handler'], edges: ['router->handler'], text: py`Your **handler** parses and validates the input (\`400\`, \`415\`, \`422\`), checks the resource and its state (\`404\`, \`409\`), does the work, and returns data.` },
        { focus: ['response', 'client'], edges: ['handler->response', 'response->client'], text: py`The framework serialises the data to JSON, sets the status line and headers (\`Content-Type\`, \`Content-Length\`, \`Location\`), and turns any exception into a clean error response — never a stack trace.` },
      ],
    },
    alt: 'A loop of boxes. The client sends bytes to a web server such as gunicorn or uvicorn, which calls app(environ, start_response) with the request as a dict. The request passes through middleware for auth, CORS and logging, then a router that maps method and path to a handler. The handler validates input and does the work, and the result becomes a status, headers and JSON body sent back to the client as bytes.',
    caption: py`Frameworks differ in style, but every one of them does these steps.`,
  },
  syntax: [
    py`#### WSGI in one function`,
    { code: py`import json


def app(environ, start_response):
    method = environ["REQUEST_METHOD"]          # "GET"
    path = environ["PATH_INFO"]                 # "/health"
    if method == "GET" and path == "/health":
        status, data = "200 OK", {"status": "ok"}
    else:
        status, data = "404 Not Found", {"error": f"no route for {path}"}
    body = json.dumps(data).encode("utf-8")
    start_response(status, [("Content-Type", "application/json"),
                            ("Content-Length", str(len(body)))])
    return [body]                               # an iterable of bytes`, lang: 'python', title: 'a complete WSGI application' },
    py`- \`environ\` is a dict: CGI-style keys (\`REQUEST_METHOD\`, \`PATH_INFO\`, \`QUERY_STRING\`, \`CONTENT_TYPE\`, \`CONTENT_LENGTH\`), every request header as \`HTTP_<NAME>\` (\`Authorization\` → \`HTTP_AUTHORIZATION\`), and \`wsgi.*\` keys — \`wsgi.input\` is a file-like object holding the body.
- \`start_response(status, headers)\` takes the status **as a string** (\`"201 Created"\`) and a list of \`(name, value)\` string pairs.
- The return value is an iterable of **bytes** — usually a one-item list.`,
    { code: py`from wsgiref.simple_server import make_server

with make_server("127.0.0.1", 8000, app) as server:      # development only
    print("Serving on http://127.0.0.1:8000 ...")
    server.serve_forever()`, lang: 'python', title: 'serving it for real on your own computer (static: no sockets in the browser)', static: true },
    py`In production a WSGI app runs under a proper server such as **gunicorn** (\`gunicorn main:app\`), usually behind a reverse proxy (nginx, a cloud load balancer) that handles TLS.`,
    py`#### Which status code?`,
    py`| situation | code | example |
|---|---|---|
| read OK | \`200 OK\` | \`GET /books/4\` |
| created | \`201 Created\` + \`Location\` | \`POST /books\` |
| done, nothing to return | \`204 No Content\` | \`DELETE /books/4\` |
| can't even read the request | \`400 Bad Request\` | broken JSON, a non-numeric \`?limit=\` |
| who are you? | \`401 Unauthorized\` + \`WWW-Authenticate\` | missing/invalid token |
| I know you; not allowed | \`403 Forbidden\` | deleting someone else's book |
| no such resource or route | \`404 Not Found\` | \`GET /books/999\` |
| route exists, wrong method | \`405 Method Not Allowed\` + \`Allow\` | \`PATCH /books\` |
| clashes with the current state | \`409 Conflict\` | duplicate ISBN, book already on loan |
| body in a format we don't accept | \`415 Unsupported Media Type\` | \`text/plain\` sent to a JSON endpoint |
| readable, but invalid | \`422 Unprocessable Content\` | missing title, year 3000 |
| slow down | \`429 Too Many Requests\` + \`Retry-After\` | rate limit |
| our bug | \`500 Internal Server Error\` | an unhandled exception — log it, hide details |`,
    py`**400 vs 422** is a matter of convention: some APIs use \`400\` for every client mistake. A common, useful split — and FastAPI's default — is \`400\` when the request can't be *parsed* and \`422\` when it parses but the *content* is invalid. Pick one rule and apply it everywhere.`,
    py`#### POST vs idempotent PUT`,
    py`- \`POST /books\` — "add this to the collection". The server usually chooses the new id, so sending it twice can create two books. Duplicates of a natural key (an ISBN) → \`409\`.
- \`PUT /books/{isbn}\` — "the book at this URL should be exactly this". The client knows the URL; sending it twice leaves the same state. Answer \`201\` if it created the resource, \`200\` (or \`204\`) if it replaced one.`,
    py`#### The same API in Flask (static — not installed here)`,
    { code: FLASK_APP, lang: 'python', title: 'app.py — Flask (pip install flask; run: flask --app app run --debug)', static: true },
    py`Flask maps URL patterns to functions with \`@app.get\`/\`@app.post\` (Flask 2.0+), gives you the current request as \`request\`, turns a returned \`dict\` into JSON, and accepts \`(body, status, headers)\` tuples. Validation is up to you or an extension. Flask apps are WSGI apps.`,
    py`#### The same API in FastAPI (static)`,
    { code: FASTAPI_APP, lang: 'python', title: 'main.py — FastAPI + pydantic v2 (pip install "fastapi[standard]"; run: uvicorn main:app --reload)', static: true },
    py`FastAPI reads your **type hints**: \`isbn: str\` comes from the path, \`book: Book\` from the JSON body, validated by the pydantic model — a malformed or invalid body gets an automatic \`422\` with a list of field errors, and an OpenAPI description with interactive docs is generated at \`/docs\`. \`Depends(require_token)\` runs the auth check before the handler. FastAPI apps are **ASGI** apps, so handlers may be \`async def\`.`,
    py`#### Testing an API`,
    { code: py`# Flask (static)
def test_create_book():
    client = app.test_client()
    response = client.post("/books", json=KINDRED, headers=AUTH)
    assert response.status_code == 201
    assert response.headers["Location"] == "/books/9780000000003"
    assert response.get_json()["title"] == "Kindred"

# FastAPI (static)
from fastapi.testclient import TestClient

def test_unknown_book_is_404():
    client = TestClient(app)
    assert client.get("/books/9789999999999").status_code == 404`, lang: 'python', title: 'framework test clients call the app directly, like our call()', static: true },
    py`Test every branch, not just the happy path: each status code your API can return, the \`Location\`/\`Allow\`/\`WWW-Authenticate\` headers, the error body shape, and properties like "a second identical PUT changes nothing". See [pytest basics](lesson:pytest-basics) and [fixtures](lesson:fixtures) for organising them.`,
  ],
  walkthrough: {
    title: 'Reading the library API',
    lang: 'python',
    code: MAIN_PY,
    intro: py`This is **main.py** from the playground. **framework.py** holds the routing and error handling, **testclient.py** delivers requests. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [16, 20], text: py`**Authentication.** The token is compared with \`hmac.compare_digest\`, which takes the same time whether the first character or the last one differs — a plain \`==\` can leak, through timing, how much of a guess was right. Failure is \`401\` plus a \`WWW-Authenticate\` header naming the scheme.` },
      { lines: [23, 41], text: py`**Validation** collects *every* problem into \`details\` before raising one \`422\`, so a client can fix the whole form in one go. Note \`type(year) is not int\`: \`isinstance(True, int)\` is \`True\`, and nobody published a book in year \`True\`. The returned dict contains only known, cleaned fields — unexpected extra fields never reach storage.` },
      { lines: [44, 54], text: py`**Reads.** \`@app.route("GET", "/books/{isbn}")\` registers the handler; the framework fills \`request.params["isbn"]\`. Returning plain data means \`200\`; raising \`HTTPError(404, ...)\` anywhere becomes a JSON error response.` },
      { lines: [57, 64], text: py`**Create.** Order matters: authenticate (\`401\`) → parse (\`415\`/\`400\`) → validate (\`422\`) → check the current state (\`409\`) → write → \`201\` with a \`Location\` header pointing at the new resource.` },
      { lines: [67, 73], text: py`**Idempotent PUT.** The ISBN comes from the URL. Whether the book existed decides \`201\` or \`200\`, but the stored state after one PUT or five is identical — safe for clients to retry.` },
      { lines: [76, 80], text: py`**Delete** answers \`204 No Content\`… but look closely: unlike the other write handlers, it never calls \`require_token\`. Anyone could delete books. That's experiment 1.` },
      { lines: [89, 92], text: py`\`show\` sends a request through \`call()\` — straight into \`app(environ, start_response)\`, no network — and prints the status, the body and any \`Location\` header.` },
      { lines: [95, 106], text: py`One request per status code: 200, 404, 401, 201, 409, 422, 400, 415, 201 then 200 for the repeated PUT, 204 and 405.` },
    ],
  },
  playground: {
    title: 'A library API on a 90-line WSGI framework',
    objective: 'See one request per status code, then close a security hole, add a 409 endpoint, a query filter and CORS middleware.',
    files: { 'main.py': MAIN_PY, 'framework.py': FRAMEWORK_PY, 'testclient.py': TESTCLIENT_PY },
    expected: py`\`\`\`text
GET    /books/9780000000001 -> 200 {'isbn': '9780000000001', 'title': 'Dune', 'author': 'Frank Herbert', 'year': 1965}
GET    /books/9789999999999 -> 404 {'error': 'no such book'}
POST   /books               -> 401 {'error': 'missing or invalid token'}
POST   /books               -> 201 {'isbn': '9780000000003', 'title': 'Kindred', ...}  (Location: /books/9780000000003)
POST   /books               -> 409 {'error': 'a book with this ISBN already exists'}
POST   /books               -> 422 {'error': 'validation failed', 'details': {'title': ..., 'author': ..., 'year': ..., 'isbn': '13 digits'}}
POST   /books               -> 400 {'error': 'the body is not valid JSON'}
POST   /books               -> 415 {'error': 'send JSON with Content-Type: application/json'}
PUT    /books/9780000000004 -> 201 {'isbn': '9780000000004', 'title': 'Beloved', ...}
PUT    /books/9780000000004 -> 200 {'isbn': '9780000000004', 'title': 'Beloved', ...}
DELETE /books/9780000000004 -> 204 None
PATCH  /books               -> 405 {'error': 'PATCH is not allowed here'}
\`\`\`

Bodies are printed as Python dicts (after \`json.loads\`). Every request also passed through \`wsgiref.validate\`, which would have complained loudly about any breach of the WSGI rules.`,
    experiments: [
      {
        id: 'protect-delete',
        task: py`Security hole: \`DELETE /books/{isbn}\` works **without** a token. Make it require one, like the other write endpoints, so an anonymous delete gets \`401\` and the book survives.`,
        hint: py`Add \`require_token(request)\` as the first line of \`delete_book\`.`,
        tests: [
          { name: 'anonymous DELETE gets 401', code: py`status, headers, body = call(app, "DELETE", "/books/9780000000001")
assert status == 401, status
assert headers.get("WWW-Authenticate") == "Bearer"` },
          { name: 'the book is still there', code: py`call(app, "DELETE", "/books/9780000000001")
assert call(app, "GET", "/books/9780000000001")[0] == 200` },
          { name: 'DELETE with the token still works', code: py`assert call(app, "DELETE", "/books/9780000000002", headers=AUTH)[0] == 204` },
        ],
        explain: py`Missing authorisation checks on individual endpoints are among the most common real API vulnerabilities (OWASP lists *broken object/function level authorization* at the top of its API Top 10). Frameworks help by letting you attach checks to whole groups of routes — FastAPI dependencies on a router, Flask \`before_request\` hooks — so a new endpoint is protected by default instead of by memory.`,
      },
      {
        id: 'loan-endpoint',
        task: py`Add \`POST /books/{isbn}/loan\` (token required): \`404\` if the book doesn't exist, \`409\` with \`{"error": "already on loan"}\` if it's already on loan, otherwise remember the loan and return \`200\` with \`{"isbn": ..., "on_loan": True}\`.`,
        hint: py`Keep a module-level \`ON_LOAN = set()\`. In the handler: \`require_token(request)\`, look up the book (404), \`if isbn in ON_LOAN: raise HTTPError(409, "already on loan")\`, then \`ON_LOAN.add(isbn)\`.`,
        tests: [
          { name: 'first loan succeeds', code: py`status, _, body = call(app, "POST", "/books/9780000000002/loan", headers=AUTH)
assert status == 200 and body == {"isbn": "9780000000002", "on_loan": True}, (status, body)` },
          { name: 'second loan conflicts', code: py`call(app, "POST", "/books/9780000000002/loan", headers=AUTH)
status, _, body = call(app, "POST", "/books/9780000000002/loan", headers=AUTH)
assert status == 409 and body == {"error": "already on loan"}, (status, body)` },
          { name: 'unknown book is 404, no token is 401', code: py`assert call(app, "POST", "/books/9789999999999/loan", headers=AUTH)[0] == 404
assert call(app, "POST", "/books/9780000000001/loan")[0] == 401` },
        ],
        explain: py`\`409 Conflict\` means "your request is fine, but it clashes with the resource's **current state**". Retrying won't help until the state changes (the book is returned). That's different from \`422\`, where the request itself is invalid no matter what the state is. Note that \`GET /books/{isbn}/loan\` now answers \`405\` automatically, because the path exists with another method.`,
      },
      {
        id: 'author-filter',
        task: py`Let \`GET /books?author=Jane Austen\` return only that author's books. Without the parameter, return every book as before.`,
        hint: py`\`author = request.query.get("author")\` — the framework already parsed the query string — then filter the sorted list when \`author\` is not \`None\`.`,
        tests: [
          { name: 'filters by author', code: py`status, _, body = call(app, "GET", "/books?author=Jane+Austen")
assert status == 200 and [b["title"] for b in body] == ["Emma"], body` },
          { name: 'no filter: everything, sorted by title', code: py`titles = [b["title"] for b in call(app, "GET", "/books")[2]]
assert "Dune" in titles and "Emma" in titles and titles == sorted(titles)` },
          { name: 'an unknown author gives an empty list, not 404', code: py`assert call(app, "GET", "/books?author=Nobody")[:3:2] == (200, [])` },
        ],
        explain: py`Filters belong in the query string, and an empty result is still a successful answer — \`200\` with \`[]\`. \`404\` is for a *resource* that doesn't exist (\`/books/999\`), not for a search with no matches.`,
      },
      {
        id: 'cors-middleware',
        task: py`A web page at \`https://library.example\` wants to call this API from the browser. Write WSGI **middleware** \`allow_origin(app, origin)\` that adds \`Access-Control-Allow-Origin: <origin>\` and \`Vary: Origin\` to every response **only** when the request's \`Origin\` header equals \`origin\`. Then, at the end of main.py, wrap the app: \`app = allow_origin(app, "https://library.example")\`.`,
        hint: py`Return a new function \`wrapped(environ, start_response)\` that calls \`app(environ, my_start)\`, where \`my_start(status, headers, exc_info=None)\` appends the two headers when \`environ.get("HTTP_ORIGIN") == origin\` and then calls the real \`start_response\`.`,
        tests: [
          { name: 'the allowed origin gets the header', code: py`_, headers, _ = call(app, "GET", "/books", headers={"Origin": "https://library.example"})
assert headers.get("Access-Control-Allow-Origin") == "https://library.example", headers
assert headers.get("Vary") == "Origin"` },
          { name: 'other origins do not', code: py`_, headers, _ = call(app, "GET", "/books", headers={"Origin": "https://evil.example"})
assert "Access-Control-Allow-Origin" not in headers` },
          { name: 'the API still works', code: py`assert call(app, "GET", "/books/9780000000001")[0] == 200` },
        ],
        explain: py`CORS is a rule **browsers** enforce: JavaScript on one origin may only read responses from another origin if that server says so with \`Access-Control-Allow-Origin\`. It doesn't protect your API from curl or scripts — authentication does that. Echo back only origins you trust (never \`*\` together with cookies/credentials), add \`Vary: Origin\` so caches don't mix answers up, and in real frameworks use the maintained middleware (\`CORSMiddleware\` in FastAPI, flask-cors), which also answers the \`OPTIONS\` "preflight" requests browsers send before non-simple requests.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch a server call a WSGI app',
    props: {
      code: py`import json


def app(environ, start_response):
    if environ["REQUEST_METHOD"] == "GET" and environ["PATH_INFO"] == "/books":
        status, data = "200 OK", [{"id": 1, "title": "Dune"}]
    else:
        status, data = "404 Not Found", {"error": "no such route"}
    body = json.dumps(data).encode("utf-8")
    start_response(status, [("Content-Type", "application/json")])
    return [body]


def start_response(status, headers):
    print("status line:", status)


for path in ["/books", "/authors"]:
    environ = {"REQUEST_METHOD": "GET", "PATH_INFO": path}
    chunks = app(environ, start_response)
    print("body:", b"".join(chunks))
`,
      notes: {
        4: 'The whole WSGI contract: a callable taking the request dict and a callback.',
        5: 'Routing is just reading two keys of `environ`. A real server fills in many more (headers, body, server info).',
        9: 'Bodies are **bytes** on the wire: serialise to JSON text, then encode as UTF-8.',
        10: 'Tell the server the status line and headers *before* returning the body.',
        11: 'Return an iterable of bytes — the server writes them to the socket.',
        18: 'Playing the server: build an environ, call the app, collect the bytes.',
      },
    },
    alt: 'A step-by-step trace of a two-branch WSGI app called twice by a loop that plays the server. For GET /books it calls start_response with "200 OK" and returns a JSON list containing Dune as bytes; for GET /authors it calls start_response with "404 Not Found" and returns an error object as bytes. Each status line and body is printed.',
    caption: py`Simplified: a real \`environ\` has dozens of keys; \`wsgiref.util.setup_testing_defaults\` fills in the standard ones for tests.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`#### Server, app, framework — who does what?`,
      py`- The **web server** (gunicorn, uvicorn, or \`wsgiref.simple_server\` for development) owns the network: it accepts connections, reads bytes, parses HTTP, and manages worker processes or threads.
- The **application** is your Python callable. It never touches a socket; it receives the request as data and returns the response as data.
- The **framework** (Flask, FastAPI, Django) builds the application for you from smaller pieces: routes, handlers, middleware, validation, error pages.`,
      py`Because WSGI is a standard interface, any WSGI server can run any WSGI app. You can switch from Flask to Django without changing servers, or from gunicorn to another server without changing code.`,
    ],
    technical: [
      py`#### WSGI in detail (PEP 3333)`,
      py`- \`environ\` keys come from CGI: \`REQUEST_METHOD\`, \`SCRIPT_NAME\` (where the app is mounted), \`PATH_INFO\` (the rest of the path, already percent-decoded), \`QUERY_STRING\` (still encoded), \`CONTENT_TYPE\`, \`CONTENT_LENGTH\`, \`SERVER_NAME\`, \`SERVER_PORT\`, \`SERVER_PROTOCOL\`, and \`HTTP_*\` for every other header (dashes become underscores, names upper-cased). \`Content-Type\` and \`Content-Length\` are the exceptions: no \`HTTP_\` prefix.
- \`wsgi.input\` is a byte stream: read **exactly** \`CONTENT_LENGTH\` bytes. Reading "until the end" can block on a keep-alive connection.
- Strings in \`environ\` and in status/headers are "native strings" containing only Latin-1 characters; bodies are bytes.
- Middleware is just a callable that takes an app and returns another WSGI app — wrapping \`start_response\` to add headers (as in the CORS experiment) or \`environ\` to add information (an authenticated user).
- \`wsgiref.validate.validator(app)\` sits between server and app and asserts both sides follow these rules — the playground's \`call()\` uses it on every request.`,
      py`#### ASGI: the async successor`,
      py`WSGI is synchronous: one request occupies a worker thread or process until it finishes, which is fine for most CRUD APIs. **ASGI** apps are \`async def app(scope, receive, send)\`: the server passes a \`scope\` dict, and the app awaits \`receive()\` for body chunks and \`send()\` for the response. That allows thousands of mostly-idle connections (WebSockets, streaming, slow upstream calls) per process. FastAPI and Starlette are ASGI; Django supports both; Flask is WSGI (async views run in a thread). See [async/await](lesson:asyncio-basics).`,
      py`#### How routers match`,
      py`Most routers compile patterns like \`/books/{isbn}\` into regular expressions (as \`framework.py\` does) or a prefix tree, try them in a defined order, and convert parameters (\`<int:book_id>\` in Flask, a type hint in FastAPI). Two subtle rules: a path that matches with the wrong method should be \`405\` with an \`Allow\` header, not \`404\`; and trailing-slash policy (\`/books\` vs \`/books/\`) should be consistent — Flask, for example, redirects \`/books\` to \`/books/\` when the route is defined with the slash.`,
      py`#### Validation layers`,
      py`1. **Transport**: is the body readable at all? Size limits, Content-Type (\`415\`), valid JSON (\`400\`).
2. **Shape and types**: required fields, types, lengths, ranges, formats (\`422\`). Declarative tools (pydantic, marshmallow) excel here.
3. **Business rules against current state**: unique ISBN, book available, enough stock (\`409\`, sometimes \`422\`).
4. **Database constraints** as the last line of defence — see [database patterns](lesson:database-patterns).`,
      { callout: 'note', title: 'Why hmac.compare_digest?', text: py`\`a == b\` on strings may stop at the first differing character, so in principle response times can reveal how much of a guessed token was correct. \`hmac.compare_digest\` takes time independent of where the difference is. It's cheap insurance for every secret comparison — tokens, signatures, webhook HMACs.` },
    ],
    production: [
      py`#### Security basics for every API`,
      py`- **Authenticate** every non-public endpoint (bearer tokens, OAuth 2 / OpenID Connect, session cookies for browser apps). Store only *hashes* of API keys server-side — [secrets & passwords](lesson:secrets-and-passwords).
- **Authorise** every access to every object: "is *this* user allowed to read *this* book?" — not just "is someone logged in?". Missing per-object checks is the top risk in the OWASP API Security Top 10.
- **Validate** all input with allow-lists and size limits (body size, string lengths, page sizes) — [input validation](lesson:input-validation). Use parameterised SQL — [injection attacks](lesson:injection-attacks).
- **Never leak internals**: unhandled exceptions become a generic \`500\` while the traceback goes to your logs. Don't echo stack traces, SQL or file paths to clients. Run with debug mode **off** in production (Flask's debugger allows code execution).
- **CORS** only for browser front ends you trust; it's not an access-control mechanism for non-browser clients.
- **Rate limit** and set timeouts; serve only over HTTPS; set security headers via your proxy or framework — see [secure practices](lesson:secure-practices).`,
      py`#### Operating an API`,
      py`- **Structure**: thin handlers that parse/validate and call a service layer; the service uses a repository for storage ([clean architecture](lesson:clean-architecture)). Handlers stay easy to test; business rules stay framework-independent.
- **Consistent errors**: one JSON error shape everywhere (e.g. RFC 9457 problem details), including errors raised by the framework itself (404 for unknown routes, 405, 422).
- **Observability**: log one line per request (method, path, status, duration, request id — no secrets), export metrics (request rate, error rate, latency), and propagate a request id to downstream calls.
- **Contracts**: publish an OpenAPI document (FastAPI generates it; Flask has extensions), version the API (\`/v1\`), and only make additive changes within a version.
- **Idempotency** for retried writes: honour an \`Idempotency-Key\` header on important POSTs.
- **Deployment**: several worker processes behind a load balancer; graceful shutdown; health-check endpoints (\`GET /health\`) that don't require auth and don't leak details.`,
    ],
  },
  mistakes: [
    {
      title: '200 for everything (or 500 for bad input)',
      wrong: { code: py`@app.route("POST", "/books")
def create_book(request):
    data = json.loads(request.body)           # broken JSON -> unhandled -> 500
    if "title" not in data:
        return {"ok": False, "error": "title missing"}   # 200 OK!`, lang: 'python', static: true },
      right: { code: py`@app.route("POST", "/books")
def create_book(request):
    data = request.json()                     # HTTPError 415 / 400
    book = validate_book(data)                # HTTPError 422 with details
    ...
    return 201, book, {"Location": f"/books/{book['isbn']}"}`, lang: 'python', static: true },
      explanation: py`The status code is the part of the response every client, proxy and monitoring tool understands. Client mistakes are 4xx with a helpful body; 5xx should only ever mean *your* bug or outage.`,
    },
    {
      title: 'Leaking stack traces to clients',
      wrong: { code: py`except Exception as exc:
    return 500, {"error": traceback.format_exc()}    # file paths, code, maybe secrets`, lang: 'python', static: true },
      right: { code: py`except Exception:
    log.exception("unhandled error on %s %s", method, path)   # full details in your logs
    return 500, {"error": "internal server error"}           # nothing useful to an attacker`, lang: 'python', static: true },
      explanation: py`Tracebacks reveal file paths, library versions, SQL and sometimes data. Log them for yourself (with a request id you can also return to the client) and send a generic message.`,
    },
    {
      title: 'Validating only the first error',
      wrong: { code: py`if not data.get("title"):
    raise HTTPError(422, "title is required")
if not isinstance(data.get("year"), int):
    raise HTTPError(422, "year must be a number")   # the client finds out one error per request`, lang: 'python', static: true },
      right: { code: py`problems = {}
if not data.get("title"):
    problems["title"] = "required"
if not isinstance(data.get("year"), int):
    problems["year"] = "must be a whole number"
if problems:
    raise HTTPError(422, "validation failed", details=problems)`, lang: 'python', static: true },
      explanation: py`Collect every field error and return them together, keyed by field, so a form can highlight all of them at once.`,
    },
    {
      title: 'Trusting the client to send only the fields you expect',
      wrong: { code: py`BOOKS[isbn] = request.json()        # stores whatever was sent: "is_admin": true, 5 MB of junk...`, lang: 'python', static: true },
      right: { code: py`book = validate_book(request.json(), isbn=isbn)   # returns only known, cleaned fields
BOOKS[isbn] = book`, lang: 'python', static: true },
      explanation: py`Saving the raw body lets clients set fields they shouldn't (*mass assignment*: \`"role": "admin"\`) and fill your storage. Build the stored object from an explicit allow-list of validated fields.`,
    },
    {
      title: 'Comparing tokens with ==, or hard-coding them',
      wrong: { code: py`if request.headers.get("Authorization") == "Bearer hunter2":
    ...`, lang: 'python', static: true },
      right: { code: py`API_TOKEN = os.environ["LIBRARY_API_TOKEN"]
supplied = request.headers.get("Authorization", "").encode()
if not hmac.compare_digest(supplied, f"Bearer {API_TOKEN}".encode()):
    raise HTTPError(401, "missing or invalid token", headers={"WWW-Authenticate": "Bearer"})`, lang: 'python', static: true },
      explanation: py`Secrets in source code end up in version control forever. Load them from the environment or a secrets manager and compare them in constant time.`,
    },
    {
      title: 'POST used where PUT is meant (or vice versa)',
      wrong: { code: py`POST /books/9780000000004      # "create or replace this exact book" — not retry-safe as POST`, lang: 'text' },
      right: { code: py`PUT  /books/9780000000004      # client-chosen URL: create or replace, idempotent
POST /books                    # server-chosen id: create a new member`, lang: 'text' },
      explanation: py`Use PUT when the client knows the resource's URL and sends its full state — retries are then harmless. Use POST to add to a collection when the server picks the id (and add an idempotency key if it must be retry-safe).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'NoneType' object is not iterable — from the server, right after your app returns`,
      cause: py`The WSGI app returned \`None\` (forgot \`return [body]\`), or returned a \`str\` instead of an iterable of **bytes**.`,
      fix: py`Always \`return [body_bytes]\`. Wrap the app with \`wsgiref.validate.validator\` in tests to catch these protocol errors with a clear message.`,
    },
    {
      symptom: py`AssertionError: Headers (('Content-Length', 42)) must be of type str`,
      cause: py`\`wsgiref.validate\` caught a header value that isn't a string — here an int.`,
      fix: py`Convert every header value to \`str\`: \`("Content-Length", str(len(body)))\`.`,
    },
    {
      symptom: py`Every POST returns 415 Unsupported Media Type`,
      cause: py`The client isn't sending \`Content-Type: application/json\` (common with hand-written curl commands or form posts).`,
      fix: py`Send the header (\`curl -H "Content-Type: application/json" -d '{...}'\`, or \`json=\` in requests/httpx). Make the error message say which Content-Type is expected.`,
    },
    {
      symptom: py`The browser console says: "has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"`,
      cause: py`A page on another origin called your API and your response didn't allow that origin. curl works because CORS is enforced only by browsers.`,
      fix: py`Add CORS middleware that allows that specific origin (and handles OPTIONS preflight requests). Don't "fix" it with \`*\` when credentials are involved.`,
    },
    {
      symptom: py`FastAPI returns 422 with {"detail": [{"type": "missing", "loc": ["body", "year"], ...}]}`,
      cause: py`The request body didn't match the pydantic model — a missing or wrongly typed field. FastAPI validates automatically before your function runs.`,
      fix: py`Read \`loc\` (where) and \`msg\` (what) in the response; fix the client's payload or the model.`,
    },
    {
      symptom: py`500 Internal Server Error, and the log shows KeyError: 'title'`,
      cause: py`A handler read \`data["title"]\` without validating — client input crashed the server, turning a client mistake into a 5xx.`,
      fix: py`Validate before use and answer \`422\`. Add a test that sends the incomplete body.`,
    },
  ],
  bestPractices: [
    'Keep handlers thin: parse → validate → call a service → return data; let the framework build responses.',
    'Return precise status codes: 201 + Location for creates, 204 for deletes, 400/415/422 for bad input, 401/403 for auth, 404, 405 + Allow, 409 for state conflicts.',
    'Validate every input with an allow-list of fields, types, lengths and ranges; report all field errors together.',
    'Make PUT idempotent and use it when the client knows the URL; use POST to create with server-chosen ids.',
    'Use one consistent JSON error shape everywhere and never leak stack traces.',
    'Authenticate every non-public route, authorise every object access, compare secrets with hmac.compare_digest.',
    'Configure CORS only for trusted browser origins; it is not a substitute for authentication.',
    'Test through a test client: every status code, headers, error bodies and idempotency.',
    'Run behind a production server (gunicorn / uvicorn) with debug mode off.',
  ],
  useCases: [
    'A JSON back end for a web or mobile front end.',
    'An internal service other teams call (inventory, billing, search).',
    'Webhook receivers for payment or Git hosting events.',
    'Exposing a machine-learning model or data set over HTTP.',
    'Admin and automation endpoints for scripts and CI.',
  ],
  whenToUse: {
    use: [
      'Plain WSGI/wsgiref to learn the mechanics, or for a tiny internal tool with no dependencies.',
      'Flask for small to medium apps where you want to choose your own pieces.',
      'FastAPI for typed JSON APIs with automatic validation, OpenAPI docs and async I/O.',
      'Django (with Django REST Framework) when you also want an ORM, admin site, auth and migrations out of the box.',
    ],
    avoid: [
      'Hand-rolled frameworks in production — use a maintained one; security fixes matter.',
      'wsgiref.simple_server or Flask’s development server in production.',
      'Blocking calls (requests, time.sleep, heavy CPU) inside async FastAPI handlers.',
      'Building your own auth/crypto when a vetted library or identity provider exists.',
    ],
  },
  comparison: {
    title: 'The same endpoint, three ways',
    headers: ['', 'tiny WSGI framework (this lesson)', 'Flask', 'FastAPI'],
    rows: [
      ['route', '@app.route("GET", "/books/{isbn}")', '@app.get("/books/<isbn>")', '@app.get("/books/{isbn}")'],
      ['path parameter', 'request.params["isbn"]', 'function argument isbn', 'typed argument isbn: str'],
      ['JSON body', 'request.json() + validate_book()', 'request.get_json() + your validation', 'a pydantic model parameter'],
      ['invalid body', 'HTTPError(422, details=...)', 'return {...}, 422', 'automatic 422 with field errors'],
      ['errors', 'raise HTTPError(404, ...)', 'abort(404)', 'raise HTTPException(404, ...)'],
      ['interface', 'WSGI', 'WSGI', 'ASGI (async capable)'],
      ['testing', 'call(app, ...) via wsgiref', 'app.test_client()', 'fastapi.testclient.TestClient'],
    ],
    note: py`The concepts carry over exactly; only the spelling changes. That's the payoff of understanding what a framework does.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'building-apis-q1',
      type: 'mcq',
      prompt: 'In WSGI, what must the application callable do?',
      options: [
        { text: 'Open a socket on port 8000 and write the response bytes', why: 'That’s the server’s job. The app never touches sockets — which is why it can be called directly in tests.' },
        'Call start_response(status, headers) and return an iterable of bytes',
        { text: 'Return a dict with status, headers and body', why: 'That’s the style of our simulated server in the HTTP lesson, not WSGI. WSGI uses the start_response callback plus an iterable of bytes.' },
        { text: 'Be an async function that awaits send()', why: 'That describes ASGI, WSGI’s async successor.' },
      ],
      answer: 1,
      explanation: py`PEP 3333: \`app(environ, start_response)\` reads the request from \`environ\`, calls \`start_response("200 OK", [("Content-Type", "application/json")])\`, and returns something like \`[body_bytes]\`.`,
    },
    {
      id: 'building-apis-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from wsgiref.util import setup_testing_defaults


def app(environ, start_response):
    if environ["PATH_INFO"] == "/health":
        start_response("200 OK", [("Content-Type", "text/plain")])
        return [b"ok"]
    start_response("404 Not Found", [("Content-Type", "text/plain")])
    return [b"nope"]


environ = {"PATH_INFO": "/status"}
setup_testing_defaults(environ)
statuses = []
body = b"".join(app(environ, lambda status, headers: statuses.append(status)))
print(statuses[0], body)`,
      options: [
        { text: "200 OK b'ok'", why: 'setup_testing_defaults only fills in keys that are missing; it keeps PATH_INFO = "/status".' },
        "404 Not Found b'nope'",
        { text: '404 Not Found nope', why: 'body is a bytes object (b"".join of bytes), so print shows the b\'...\' form.' },
        { text: 'KeyError: REQUEST_METHOD', why: 'The app never reads REQUEST_METHOD — and setup_testing_defaults would have set it to "GET" anyway.' },
      ],
      answer: 1,
      explanation: py`The path isn't \`/health\`, so the app calls \`start_response\` with \`"404 Not Found"\` (recorded by the lambda) and returns \`[b"nope"]\`. Joining bytes gives bytes, printed as \`b'nope'\`.`,
    },
    {
      id: 'building-apis-q3',
      type: 'bug',
      prompt: 'Posting a book whose ISBN already exists silently replaces the existing one. Click the line where the check is missing.',
      code: py`def create_book(request):
    require_token(request)
    book = validate_book(request.json())
    BOOKS[book["isbn"]] = book
    return 201, book, {"Location": f"/books/{book['isbn']}"}`,
      answerLine: 4,
      explanation: py`Line 4 stores the book unconditionally. Before it: \`if book["isbn"] in BOOKS: raise HTTPError(409, "a book with this ISBN already exists")\`. POST means "create"; replacing is PUT's job.`,
    },
    {
      id: 'building-apis-q4',
      type: 'fill',
      prompt: 'Fill in the status codes.',
      code: py`if isbn in ON_LOAN:
    raise HTTPError(___, "book is already on loan")       # clashes with current state
if type(data.get("year")) is not int:
    raise HTTPError(___, "year must be a whole number")   # readable JSON, invalid content`,
      answer: [['409'], ['422']],
      explanation: py`\`409 Conflict\`: the request is fine but conflicts with the resource's current state. \`422 Unprocessable Content\`: the body parsed, but its content is invalid. (Some APIs use \`400\` for the second; be consistent.)`,
    },
    {
      id: 'building-apis-q5',
      type: 'mcq',
      prompt: 'A client sends `POST /books` with `Content-Type: application/json` and the body `{"title": "Dune"` (the closing brace is missing). Which response fits best?',
      options: [
        '400 Bad Request',
        { text: '422 Unprocessable Content', why: '422 is for a body that parses but has invalid content. This one can’t even be parsed.' },
        { text: '415 Unsupported Media Type', why: 'The media type (application/json) is fine; the JSON itself is broken.' },
        { text: '500 Internal Server Error', why: 'Nothing went wrong on the server — the client sent a malformed request. A 500 here means the server failed to handle bad input.' },
      ],
      answer: 0,
      explanation: py`Malformed syntax is the textbook \`400 Bad Request\`. Catch \`json.JSONDecodeError\` and answer with a clear message instead of letting it become a \`500\`.`,
    },
    {
      id: 'building-apis-q6',
      type: 'mcq',
      prompt: 'Your API at `https://api.library.example` adds `Access-Control-Allow-Origin: https://library.example`. What does that achieve?',
      options: [
        { text: 'Only requests from library.example can reach the API at all', why: 'Any client — curl, a script, another server — can still send requests. CORS restricts only what browsers let JavaScript read.' },
        'Browsers let JavaScript on https://library.example read the API’s responses',
        { text: 'It encrypts responses for that origin', why: 'Encryption is TLS’s job (HTTPS). CORS is a permission header.' },
        { text: 'It authenticates users coming from that site', why: 'CORS says nothing about who the user is; you still need authentication.' },
      ],
      answer: 1,
      explanation: py`CORS (Cross-Origin Resource Sharing) relaxes the browser's same-origin policy for the listed origin. It's enforced by browsers only, so it never replaces authentication and authorisation on the server.`,
    },
    {
      id: 'building-apis-q7',
      type: 'short',
      prompt: 'Why is `PUT /books/9780000000004` with a full book body idempotent, while `POST /books` with the same body is not?',
      answer: py`PUT names the exact resource and says "make it look like this": the first call creates or replaces book 9780000000004, and every repeat leaves exactly the same state. POST says "add a new member to the collection": if the server chooses ids, each call can create another book (or, with a natural-key check, fail with 409 the second time). So clients can safely retry PUT after a timeout, but need an idempotency key to retry POST safely.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'match-route',
      title: 'Write a URL router',
      difficulty: 'intermediate',
      prompt: py`Every framework has a router. Write \`match_route(pattern, path)\` that returns a dict of path parameters if \`path\` matches \`pattern\`, or \`None\` if it doesn't.

- Split both on \`"/"\`. They must have the **same number** of segments (so \`/books/\` doesn't match \`/books\`).
- A literal segment must be **exactly equal**.
- \`{name}\` matches any **non-empty** segment; the value is the string.
- \`{name:int}\` matches only the ASCII digits \`0-9\`; the value is converted to \`int\`.

\`\`\`python
match_route("/books/{isbn}", "/books/978")                    # {"isbn": "978"}
match_route("/users/{uid:int}/loans/{lid:int}", "/users/7/loans/42")   # {"uid": 7, "lid": 42}
match_route("/users/{uid:int}", "/users/abc")                 # None
\`\`\``,
      files: {
        'main.py': py`def match_route(pattern, path):
    # TODO: compare segment by segment; collect parameters
    return None


print(match_route("/books/{isbn}", "/books/978"))
print(match_route("/users/{uid:int}/loans/{lid:int}", "/users/7/loans/42"))
print(match_route("/users/{uid:int}", "/users/abc"))
`,
      },
      hints: [
        'pattern.split("/") and path.split("/") give lists of segments; return None straight away if their lengths differ.',
        'Loop over zip(pattern_parts, path_parts). A segment is a parameter if it starts with "{" and ends with "}"; name, _, converter = segment[1:-1].partition(":").',
        'For converter "int", require actual.isascii() and actual.isdigit(), then int(actual). An empty actual segment never matches a parameter. Any literal mismatch → None. Return the params dict at the end.',
      ],
      solution: {
        explanation: py`Splitting on \`/\` keeps the empty strings at the start and around a trailing slash, so comparing segment counts automatically separates \`/books\` from \`/books/\`. Each segment is either a literal (must match exactly) or a parameter (captured, optionally converted). The \`int\` converter checks \`isascii() and isdigit()\` because \`str.isdigit()\` alone accepts characters such as \`"²"\` that \`int()\` rejects — a converter must never let \`int()\` raise inside a router, or bad URLs become \`500\`s instead of \`404\`s. Returning \`{}\` (not \`None\`) for a parameter-free match lets callers test \`is None\` to mean "no match". Real routers precompile patterns (regexes or tries) so matching is fast; the logic is the same.`,
        files: {
          'main.py': py`def match_route(pattern, path):
    pattern_parts = pattern.split("/")
    path_parts = path.split("/")
    if len(pattern_parts) != len(path_parts):
        return None
    params = {}
    for expected, actual in zip(pattern_parts, path_parts):
        if expected.startswith("{") and expected.endswith("}"):
            name, _, converter = expected[1:-1].partition(":")
            if not actual:
                return None
            if converter == "int":
                if not (actual.isascii() and actual.isdigit()):
                    return None
                params[name] = int(actual)
            else:
                params[name] = actual
        elif expected != actual:
            return None
    return params


print(match_route("/books/{isbn}", "/books/978"))
print(match_route("/users/{uid:int}/loans/{lid:int}", "/users/7/loans/42"))
print(match_route("/users/{uid:int}", "/users/abc"))
`,
        },
      },
      tests: [
        { name: 'literal routes match with no parameters', code: py`assert match_route("/books", "/books") == {}` },
        { name: 'string parameter', code: py`assert match_route("/books/{isbn}", "/books/978") == {"isbn": "978"}` },
        { name: 'int parameters are converted', code: py`assert match_route("/users/{uid:int}/loans/{lid:int}", "/users/7/loans/42") == {"uid": 7, "lid": 42}` },
        { name: 'int parameter rejects non-digits', code: py`assert match_route("/users/{uid:int}", "/users/abc") is None
assert match_route("/users/{uid:int}", "/users/-3") is None` },
        { name: 'literal mismatch and segment count', code: py`assert match_route("/books/{isbn}", "/authors/978") is None
assert match_route("/books/{isbn}", "/books/978/reviews") is None
assert match_route("/books", "/books/") is None` },
        { name: 'parameters never match an empty segment', code: py`assert match_route("/books/{isbn}", "/books/") is None` },
      ],
    },
    {
      id: 'notes-wsgi-app',
      title: 'A notes API in raw WSGI',
      difficulty: 'advanced',
      prompt: py`Write the WSGI app \`notes_app(environ, start_response)\` for a tiny notes API, using the provided \`NOTES\` dict and \`json_response()\` helper. The tests call it through the provided \`call()\` helper, which returns \`(status_code, headers, json_body)\`.

| request | response |
|---|---|
| \`GET /notes\` | \`200\`, a list of all notes sorted by id |
| \`POST /notes\` with \`{"text": "..."}\` | \`201\`, the new note \`{"id": <max id + 1>, "text": ...}\` and header \`Location: /notes/<id>\` |
| \`POST /notes\` with a body that isn't valid JSON | \`400\` with an \`{"error": ...}\` body |
| \`POST /notes\` with valid JSON but no non-empty string \`"text"\` | \`422\` with an \`{"error": ...}\` body |
| \`GET /notes/<id>\` | \`200\` and the note, or \`404\` (also when \`<id>\` isn't a number) |
| any other method on \`/notes\` | \`405\` with header \`Allow: GET, POST\` |
| any other path | \`404\` |

Read the body with \`environ["wsgi.input"].read(int(environ.get("CONTENT_LENGTH") or 0))\`.`,
      files: {
        'main.py': py`import io
import json
from wsgiref.util import setup_testing_defaults

NOTES = {1: {"id": 1, "text": "buy milk"}}


def json_response(start_response, status, data, headers=()):
    """status is a full status line such as "201 Created"."""
    body = json.dumps(data).encode("utf-8")
    start_response(status, [("Content-Type", "application/json"),
                            ("Content-Length", str(len(body))), *headers])
    return [body]


def notes_app(environ, start_response):
    # TODO: route on REQUEST_METHOD and PATH_INFO
    return json_response(start_response, "200 OK", [])


def call(app, method, path, body=b""):
    environ = {"REQUEST_METHOD": method, "PATH_INFO": path,
               "CONTENT_LENGTH": str(len(body)), "wsgi.input": io.BytesIO(body)}
    setup_testing_defaults(environ)
    seen = {}

    def start_response(status, headers, exc_info=None):
        seen["status"], seen["headers"] = int(status.split()[0]), dict(headers)

    raw = b"".join(app(environ, start_response))
    return seen["status"], seen["headers"], json.loads(raw)


print(call(notes_app, "GET", "/notes"))
print(call(notes_app, "POST", "/notes", b'{"text": "call grandma"}'))
print(call(notes_app, "GET", "/notes/2"))
`,
      },
      hints: [
        'Start with method, path = environ["REQUEST_METHOD"], environ["PATH_INFO"]. Handle path == "/notes" first (GET, POST, else 405 with headers=[("Allow", "GET, POST")]).',
        'For POST: read the body, try json.loads(...) except json.JSONDecodeError → 400. Then check isinstance(data, dict) and that data.get("text") is a non-empty str → else 422. New id: max(NOTES, default=0) + 1.',
        'For /notes/<id>: if path.startswith("/notes/"), take the rest; if it is digits and int(rest) in NOTES → 200, otherwise 404. Everything else → 404.',
      ],
      solution: {
        explanation: py`The app reads only two routing inputs — method and path — and handles the collection before the members, mirroring how REST URLs are structured. Each failure maps to the most specific status: an unparseable body is \`400\`; parseable but meaningless content is \`422\`; a missing resource (or a non-numeric id, which can't name a resource) is \`404\`; a known path with an unsupported method is \`405\` and carries \`Allow\` so clients can discover what *is* supported. Creation returns \`201\` with the new resource and a \`Location\` header. Because the app is just a function of \`environ\`, the tests can exercise every branch with no server at all.`,
        files: {
          'main.py': py`import io
import json
from wsgiref.util import setup_testing_defaults

NOTES = {1: {"id": 1, "text": "buy milk"}}


def json_response(start_response, status, data, headers=()):
    """status is a full status line such as "201 Created"."""
    body = json.dumps(data).encode("utf-8")
    start_response(status, [("Content-Type", "application/json"),
                            ("Content-Length", str(len(body))), *headers])
    return [body]


def notes_app(environ, start_response):
    method, path = environ["REQUEST_METHOD"], environ["PATH_INFO"]

    if path == "/notes":
        if method == "GET":
            return json_response(start_response, "200 OK", [NOTES[k] for k in sorted(NOTES)])
        if method == "POST":
            raw = environ["wsgi.input"].read(int(environ.get("CONTENT_LENGTH") or 0))
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                return json_response(start_response, "400 Bad Request",
                                     {"error": "body is not valid JSON"})
            text = data.get("text") if isinstance(data, dict) else None
            if not isinstance(text, str) or not text.strip():
                return json_response(start_response, "422 Unprocessable Content",
                                     {"error": "text must be non-empty text"})
            note_id = max(NOTES, default=0) + 1
            NOTES[note_id] = {"id": note_id, "text": text}
            return json_response(start_response, "201 Created", NOTES[note_id],
                                 [("Location", f"/notes/{note_id}")])
        return json_response(start_response, "405 Method Not Allowed",
                             {"error": f"{method} not allowed"}, [("Allow", "GET, POST")])

    if path.startswith("/notes/"):
        rest = path.removeprefix("/notes/")
        if rest.isascii() and rest.isdigit() and int(rest) in NOTES and method == "GET":
            return json_response(start_response, "200 OK", NOTES[int(rest)])

    return json_response(start_response, "404 Not Found", {"error": f"nothing at {path}"})


def call(app, method, path, body=b""):
    environ = {"REQUEST_METHOD": method, "PATH_INFO": path,
               "CONTENT_LENGTH": str(len(body)), "wsgi.input": io.BytesIO(body)}
    setup_testing_defaults(environ)
    seen = {}

    def start_response(status, headers, exc_info=None):
        seen["status"], seen["headers"] = int(status.split()[0]), dict(headers)

    raw = b"".join(app(environ, start_response))
    return seen["status"], seen["headers"], json.loads(raw)


print(call(notes_app, "GET", "/notes"))
print(call(notes_app, "POST", "/notes", b'{"text": "call grandma"}'))
print(call(notes_app, "GET", "/notes/2"))
`,
        },
      },
      tests: [
        { name: 'GET /notes lists notes', code: py`status, _, body = call(notes_app, "GET", "/notes")
assert status == 200 and body[0] == {"id": 1, "text": "buy milk"}` },
        { name: 'POST /notes creates with 201 and Location', code: py`status, headers, body = call(notes_app, "POST", "/notes", b'{"text": "water plants"}')
assert status == 201, status
assert body["text"] == "water plants" and body["id"] == max(NOTES)
assert headers.get("Location") == f"/notes/{body['id']}"` },
        { name: 'broken JSON is 400', code: py`status, _, body = call(notes_app, "POST", "/notes", b'{"text": ')
assert status == 400 and "error" in body` },
        { name: 'missing or empty text is 422', code: py`assert call(notes_app, "POST", "/notes", b'{"title": "x"}')[0] == 422
assert call(notes_app, "POST", "/notes", b'{"text": "   "}')[0] == 422
assert call(notes_app, "POST", "/notes", b'[1, 2]')[0] == 422` },
        { name: 'GET /notes/<id> finds a note or 404s', code: py`assert call(notes_app, "GET", "/notes/1")[2] == {"id": 1, "text": "buy milk"}
assert call(notes_app, "GET", "/notes/99")[0] == 404
assert call(notes_app, "GET", "/notes/abc")[0] == 404` },
        { name: 'wrong method on /notes is 405 with Allow', code: py`status, headers, _ = call(notes_app, "DELETE", "/notes")
assert status == 405 and headers.get("Allow") == "GET, POST"` },
        { name: 'unknown paths are 404', code: py`assert call(notes_app, "GET", "/todos")[0] == 404` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'building-apis-framework-role',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does a web framework like Flask or FastAPI actually do for you?',
      answer: 'It turns the server’s raw request into a convenient request object, routes method + path to your handler (with path parameters), parses and often validates input, turns your return value into an HTTP response (status, headers, JSON), converts exceptions into error responses, runs middleware (auth, CORS, logging), and provides a test client. The web server underneath handles sockets and HTTP parsing; WSGI/ASGI connects the two.',
      explanation: py`Without a framework you'd write the code in this lesson's \`framework.py\`: environ parsing, regex routing, 404/405 logic, JSON serialisation, error handling. Frameworks also add security fixes, documentation (FastAPI's OpenAPI), extensions and conventions a team can share.`,
      whyAsked: 'It checks you understand the layers instead of treating the framework as magic — useful for debugging and for choosing tools.',
      mistakes: ['Confusing the framework with the web server', 'Not mentioning error handling or testing', 'Thinking the framework makes the API secure by itself'],
      followUps: ['What is WSGI and why does it exist?', 'Where would you put authentication?', 'How would you test an endpoint without starting a server?'],
      modelAnswer: 'A framework sits between the web server and my code. The server owns sockets and HTTP parsing, then hands the request to the app through an interface like WSGI or ASGI. The framework turns that into a request object, matches the method and path against my routes to pick a handler and extract path parameters, parses the body — FastAPI even validates it against a model — and turns my return value into a response with the right status, headers and JSON. It also converts exceptions into error responses, runs middleware for things like authentication, CORS and logging, and gives me a test client that calls the app directly. What it doesn’t do is decide my status codes, validation rules or authorisation for me.',
    },
    {
      id: 'building-apis-status-choice',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A client sends `POST /users` with valid JSON `{"email": "ada@example.com"}`, but a user with that email already exists. Which status code fits best?',
      options: ['400 Bad Request', '404 Not Found', '409 Conflict', '422 Unprocessable Content'],
      correctOption: 2,
      answer: '409 Conflict: the request is well-formed and valid on its own, but conflicts with the current state of the server (the email is taken). 400 is for unreadable requests, 422 for content that is invalid regardless of state, 404 for a missing resource.',
      explanation: py`A useful mental test: "would this exact request succeed if the server's data were different?" If yes, it's a state conflict → \`409\`. If no — a malformed email, a missing field — it's \`422\` (or \`400\` in APIs that use one code for all client errors). Some APIs return \`422\` for uniqueness violations too; consistency and a clear error body matter more than the exact choice.`,
      whyAsked: 'Distinguishing these codes shows you think about what the client should do next — fix the payload, or resolve a conflict.',
      mistakes: ['Returning 500 because the database raised IntegrityError', 'Using 404 because "the user wasn’t found"', 'Returning 200 with an error flag'],
      followUps: ['How would you map a database unique-constraint error to this response?', 'What would a client do differently for 409 vs 422?'],
      modelAnswer: 'I’d return 409 Conflict. The request itself is perfectly valid — well-formed JSON with a properly formatted email — it just conflicts with the server’s current state, because that email is already taken. 400 would mean I couldn’t parse the request, 422 that the content is invalid no matter what’s stored, and 404 that a resource doesn’t exist. In code I’d check for the existing user, or catch the database’s unique-constraint error, and translate it into a 409 with a clear message like "email already registered", instead of letting it bubble up as a 500.',
    },
    {
      id: 'building-apis-put-post',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'When would you design an endpoint as PUT rather than POST, and what status codes should each return?',
      answer: 'PUT when the client knows the resource’s URL and sends its complete state — e.g. PUT /books/{isbn} or PUT /users/me/settings. It’s idempotent: 201 if it created the resource, 200 (with the body) or 204 if it replaced it. POST to add to a collection where the server assigns the id, or for actions: 201 + Location for creation (409 on a natural-key duplicate), 200/202 for actions.',
      explanation: py`The key property is idempotency: clients, proxies and retry logic may repeat PUT safely. POST is the escape hatch for non-idempotent operations and for "create with a server-chosen id"; when POSTs must be retry-safe, accept an \`Idempotency-Key\`. PATCH covers partial updates.`,
      whyAsked: 'It tests HTTP semantics in API design, which affects retries, caching and client behaviour.',
      mistakes: ['Using PUT for partial updates', 'Saying PUT is "for updates" and POST "for creates" without mentioning idempotency', 'Returning 200 for PUT that created a resource without saying so'],
      followUps: ['How does PATCH differ?', 'What would you return for a POST that starts a long job? (202 Accepted + a status URL)', 'How do idempotency keys work?'],
      modelAnswer: 'I use PUT when the client knows exactly which resource it’s talking about and sends the full representation — like PUT /books/{isbn} — because PUT means "make this resource look like this", so it’s idempotent and safe to retry. It returns 201 if it created the resource and 200 or 204 if it replaced it. POST is for adding to a collection when the server picks the id, returning 201 with a Location header, or for actions that aren’t idempotent. If a POST must be retry-safe, like a payment, I accept an idempotency key. Partial updates go to PATCH.',
    },
    {
      id: 'building-apis-wsgi-asgi',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare WSGI and ASGI. When does the difference matter?',
      answer: 'WSGI (PEP 3333) is synchronous: app(environ, start_response) returns an iterable of bytes, and each in-flight request occupies a worker thread or process. ASGI is async: async app(scope, receive, send), so one process can hold many concurrent connections that are mostly waiting. It matters for WebSockets, streaming, long-polling and handlers that spend most time awaiting other services; for typical CPU-light CRUD behind a database, both work well.',
      explanation: py`WSGI servers: gunicorn, uWSGI, mod_wsgi. ASGI servers: uvicorn, hypercorn, daphne. Flask and classic Django are WSGI; FastAPI/Starlette are ASGI; Django supports both. ASGI only helps if your I/O is actually async — a blocking database driver or \`requests\` call inside \`async def\` stalls the event loop for everyone.`,
      whyAsked: 'Senior candidates should understand the deployment model of their framework and its performance implications.',
      mistakes: ['Claiming ASGI is always faster', 'Ignoring that blocking calls in async handlers hurt every request', 'Not knowing which interface Flask/FastAPI use'],
      followUps: ['How would you run blocking code from an async handler?', 'How many WSGI workers would you start, and why?', 'What does a reverse proxy add in front of either?'],
      modelAnswer: 'Both are interfaces between a Python web app and a server. WSGI is synchronous: the server calls app with environ and start_response and gets back bytes, so each request in progress ties up a thread or process — simple and great for typical CRUD APIs, run under something like gunicorn. ASGI is the async version: the app is a coroutine taking scope, receive and send, so one process can juggle thousands of connections that are mostly waiting, which matters for WebSockets, streaming or handlers that await slow upstream services. Flask is WSGI, FastAPI is ASGI. The catch is that ASGI only helps if the I/O is truly async; a blocking call inside an async handler freezes the event loop for everyone.',
    },
    {
      id: 'building-apis-idempotency-key',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Implement idempotency-key support for a POST endpoint. `handle_post(store, key, payload, create)` where `create(payload)` returns `(status, body)`. Rules: no key → just call `create`. A key seen before with the **same** payload → return the stored response without calling `create`. A key seen with a **different** payload → `(422, {"error": "idempotency key reused with a different payload"})`. Only store responses with status below 500, so server errors can be retried.',
      answer: 'Keep a dict key → (payload, response). Look the key up first; compare payloads; otherwise call create and store the result unless it is a 5xx.',
      explanation: py`This mirrors how payment APIs make POST retry-safe. A real implementation stores entries in a shared database or cache with an expiry, records "in progress" to return \`409\` for concurrent duplicates, and scopes keys per client. Comparing payloads catches a client bug where one key is reused for a different operation.`,
      starter: { files: { 'main.py': py`def handle_post(store, key, payload, create):
    # TODO: replay stored responses for repeated keys
    return create(payload)


calls = []


def create_order(payload):
    calls.append(payload)
    return 201, {"order_id": len(calls), **payload}


store = {}
print(handle_post(store, "k-1", {"item": "pen"}, create_order))
print(handle_post(store, "k-1", {"item": "pen"}, create_order))   # a retry
print("create_order ran", len(calls), "time(s)")
` } },
      tests: [
        { name: 'a retried key returns the stored response', code: py`made = []
def create(p):
    made.append(p)
    return 201, {"id": len(made)}
s = {}
first = handle_post(s, "abc", {"item": "pen"}, create)
second = handle_post(s, "abc", {"item": "pen"}, create)
assert first == second == (201, {"id": 1})
assert len(made) == 1` },
        { name: 'same key, different payload is 422', code: py`s = {}
handle_post(s, "abc", {"item": "pen"}, lambda p: (201, {"id": 1}))
status, body = handle_post(s, "abc", {"item": "ink"}, lambda p: (201, {"id": 2}))
assert status == 422 and "error" in body` },
        { name: 'no key: always calls create', code: py`made = []
def create(p):
    made.append(p)
    return 201, {"id": len(made)}
s = {}
handle_post(s, None, {"item": "pen"}, create)
handle_post(s, None, {"item": "pen"}, create)
assert len(made) == 2` },
        { name: 'server errors are not stored', code: py`outcomes = [(503, {"error": "busy"}), (201, {"id": 7})]
s = {}
assert handle_post(s, "k", {"a": 1}, lambda p: outcomes.pop(0))[0] == 503
assert handle_post(s, "k", {"a": 1}, lambda p: outcomes.pop(0)) == (201, {"id": 7})` },
      ],
      solution: { files: { 'main.py': py`def handle_post(store, key, payload, create):
    if key is None:
        return create(payload)
    if key in store:
        saved_payload, saved_response = store[key]
        if saved_payload != payload:
            return 422, {"error": "idempotency key reused with a different payload"}
        return saved_response
    response = create(payload)
    if response[0] < 500:                 # let clients retry server errors
        store[key] = (payload, response)
    return response


calls = []


def create_order(payload):
    calls.append(payload)
    return 201, {"order_id": len(calls), **payload}


store = {}
print(handle_post(store, "k-1", {"item": "pen"}, create_order))
print(handle_post(store, "k-1", {"item": "pen"}, create_order))   # a retry
print("create_order ran", len(calls), "time(s)")
` } },
      hints: ['Store (payload, response) under the key.', 'Check the key before calling create; compare the stored payload with the new one.', 'Only save the response when its status is < 500.'],
      whyAsked: 'It combines HTTP semantics, failure handling and state — exactly what makes real APIs reliable under retries.',
      mistakes: ['Calling create before checking the store', 'Storing 5xx responses so a transient failure is replayed forever', 'Ignoring payload mismatches'],
      followUps: ['How would you handle two concurrent requests with the same key?', 'Where would you store keys in a multi-server deployment, and for how long?', 'Should keys be scoped per user?'],
      modelAnswer: 'I keep a store from idempotency key to the original payload and response. With no key there’s no protection, so I just call create. If the key exists, I compare payloads: a different payload means the client reused a key for a different operation, which I reject with 422; the same payload means it’s a retry, so I return the stored response without doing the work again. For a new key I call create and store the result — but only if it isn’t a 5xx, so a transient server failure can be retried. In production the store would be a database table or Redis with an expiry, scoped per client, and I’d record an in-progress marker so a concurrent duplicate gets 409 instead of running twice.',
    },
    {
      id: 'building-apis-cors',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your React app on https://app.example.com calls your API on https://api.example.com. The browser console shows a CORS error, but the same request works with curl. A teammate proposes `Access-Control-Allow-Origin: *`. What’s going on and what do you do?',
      answer: 'Browsers enforce the same-origin policy; the API must explicitly allow the app’s origin. curl ignores CORS. Configure CORS middleware to allow https://app.example.com specifically (with the needed methods/headers, handling OPTIONS preflights, Vary: Origin), and allow credentials only if needed. Avoid * — it can’t be combined with credentials and exposes the API to any site’s scripts. CORS is not authentication.',
      explanation: py`Requests with custom headers like \`Authorization\` or JSON bodies trigger a *preflight* \`OPTIONS\` request; the server must answer it with \`Access-Control-Allow-Methods\`/\`-Headers\`. Use the framework's maintained middleware. Remember the real protection is still authentication and authorisation on every endpoint.`,
      whyAsked: 'CORS errors are a daily occurrence for full-stack work, and misconfigured CORS is a common security weakness.',
      mistakes: ['Thinking CORS protects the API from non-browser clients', 'Using * with credentials', 'Forgetting preflight (OPTIONS) handling'],
      followUps: ['What triggers a preflight request?', 'Why add Vary: Origin?', 'How would you allow several environments (staging, production)?'],
      modelAnswer: 'Browsers block JavaScript from reading responses from a different origin unless the server opts in with CORS headers; curl doesn’t implement that policy, which is why it works there. So the fix belongs on the API: configure CORS middleware to allow exactly https://app.example.com, with the methods and headers the app uses, so that the preflight OPTIONS request succeeds, and add Vary: Origin. I’d avoid the wildcard — it lets any website’s scripts read our responses and can’t be used with credentials anyway. And I’d remind the team that CORS isn’t security for the API itself; authentication and authorisation still have to be enforced on every request.',
    },
    {
      id: 'building-apis-error-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A security review finds that `GET /books/abc` returns a 500 response whose body includes a Python traceback with file paths and a SQL query. What is wrong, and how do you fix it properly?',
      code: { lang: 'python', code: py`@app.route("GET", "/books/{book_id}")
def get_book(request):
    book_id = int(request.params["book_id"])        # ValueError for "abc"
    row = db.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    return dict(row)                                # TypeError when row is None

# elsewhere, the error handler:
#     except Exception:
#         return 500, {"error": traceback.format_exc()}` },
      answer: 'Two problems: client input crashes the handler (bad ids should be 404/400, missing rows 404), and the error handler leaks internals. Validate the id (or use an int route converter), return 404 when the row is missing, and make the global handler log the traceback server-side and return a generic 500 body (optionally with a request id).',
      explanation: py`Leaking tracebacks gives attackers file paths, library versions and query shapes — information disclosure. Bad input reaching \`int()\` turns client mistakes into 5xx, which also pollutes error-rate alerts. Fix both layers: precise handling in the handler, and a safe default in the framework's error handler. Add tests for \`/books/abc\` and \`/books/999\`.`,
      whyAsked: 'It checks security awareness and correct error handling — a frequent finding in real reviews.',
      mistakes: ['Only hiding the traceback but still returning 500 for bad input', 'Catching all exceptions inside the handler and returning 200', 'Turning on debug mode in production to "see errors"'],
      followUps: ['How would you correlate a user’s report with the server log? (request ids)', 'Why is Flask debug mode dangerous in production?'],
      modelAnswer: 'There are two bugs. First, client input crashes the handler: a non-numeric id raises ValueError and a missing row makes dict(None) raise TypeError, so ordinary client mistakes become 500s. I’d use an int route converter or validate the id, and return 404 when there’s no such book. Second, the global error handler sends the traceback to the client, which leaks file paths, library details and the SQL — useful reconnaissance for an attacker. It should log the full traceback with a request id and return a generic "internal server error" body, perhaps including that request id so support can find the log entry. Then I’d add tests for both the bad id and the missing book.',
    },
  ],

  takeaways: [
    'A web server owns sockets; your app is a callable behind WSGI (sync) or ASGI (async); a framework builds that callable from routes, handlers and middleware.',
    'WSGI: app(environ, start_response) → call start_response("201 Created", [(name, value), ...]) and return an iterable of bytes. wsgiref lets you call and validate it without a server.',
    'Status codes: 201 + Location, 204, 400 (unreadable), 401/403, 404, 405 + Allow, 409 (state conflict), 415, 422 (invalid content), never 500 for bad input.',
    'Validate with an allow-list, report all field errors together, store only cleaned fields.',
    'PUT to a client-known URL is idempotent (201 created / 200 replaced); POST creates with server-chosen ids and needs an idempotency key to be retry-safe.',
    'Security: authenticate and authorise every route, compare secrets with hmac.compare_digest, never leak tracebacks, configure CORS narrowly — it is not authentication.',
    'Flask and FastAPI express the same ideas; test any of them by calling the app through a test client.',
  ],
}
