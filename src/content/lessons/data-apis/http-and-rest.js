// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WIRE_PY = py`"""Build HTTP messages and show them as the text that travels over the wire.

Simplified HTTP/1.1: real clients and servers also handle chunked bodies,
keep-alive connections, compression and much more.
"""
import json
from http import HTTPStatus
from urllib.parse import parse_qs, urlsplit


def make_request(method, url, json_body=None, headers=None):
    """A request as a plain dict, the way a server framework hands it to you."""
    parts = urlsplit(url)
    request = {
        "method": method,
        "path": parts.path,
        "query": parse_qs(parts.query),       # "a=1&a=2" -> {"a": ["1", "2"]}
        "headers": {"Host": "books.example", "Accept": "application/json", **(headers or {})},
        "body": "",
        "target": url,                        # path + query string, as sent
    }
    if json_body is not None:
        request["body"] = json.dumps(json_body)
        request["headers"]["Content-Type"] = "application/json"
    return request


def request_text(request):
    lines = [f"{request['method']} {request['target']} HTTP/1.1"]
    headers = dict(request["headers"])
    if request["body"]:
        headers["Content-Length"] = str(len(request["body"].encode("utf-8")))
    lines += [f"{name}: {value}" for name, value in headers.items()]
    return "\r\n".join(lines) + "\r\n\r\n" + request["body"]


def response_text(response):
    status = HTTPStatus(response["status"])
    lines = [f"HTTP/1.1 {status.value} {status.phrase}"]
    headers = dict(response.get("headers", {}))
    headers["Content-Length"] = str(len(response.get("body", "").encode("utf-8")))
    lines += [f"{name}: {value}" for name, value in headers.items()]
    return "\r\n".join(lines) + "\r\n\r\n" + response.get("body", "")


def show(text, arrow):
    """Print a message like curl -v does: > for what we send, < for what comes back."""
    lines = text.split("\r\n")
    if lines[-1] == "":
        lines.pop()                    # no body: don't print an empty last line
    for line in lines:
        print(arrow, line)
`

const BOOKSHOP_PY = py`"""A pretend bookshop API: one function from a request dict to a response dict."""
import json
from http import HTTPStatus
from urllib.parse import urlencode

BOOKS = {
    1: {"id": 1, "title": "Dune", "author": "Frank Herbert", "year": 1965},
    2: {"id": 2, "title": "Emma", "author": "Jane Austen", "year": 1815},
    3: {"id": 3, "title": "Kindred", "author": "Octavia E. Butler", "year": 1979},
}


def respond(status, data=None, headers=None):
    body = "" if data is None else json.dumps(data)
    base = {"Content-Type": "application/json"} if body else {}
    return {"status": int(status), "headers": {**base, **(headers or {})}, "body": body}


def handle(request):
    method = request["method"]
    parts = request["path"].strip("/").split("/")    # "/books/2" -> ["books", "2"]

    if parts == ["books"]:                            # the collection
        if method == "GET":
            return list_books(request["query"])
        if method == "POST":
            return create_book(request)
        return respond(HTTPStatus.METHOD_NOT_ALLOWED,
                       {"error": f"{method} not allowed here"}, {"Allow": "GET, POST"})

    if len(parts) == 2 and parts[0] == "books" and parts[1].isdigit():
        book_id = int(parts[1])                       # one member of the collection
        if book_id not in BOOKS:
            return respond(HTTPStatus.NOT_FOUND, {"error": f"no book with id {book_id}"})
        if method == "GET":
            return respond(HTTPStatus.OK, BOOKS[book_id])
        if method == "DELETE":
            del BOOKS[book_id]
            return respond(HTTPStatus.NO_CONTENT)
        return respond(HTTPStatus.METHOD_NOT_ALLOWED,
                       {"error": f"{method} not allowed here"}, {"Allow": "GET, DELETE"})

    return respond(HTTPStatus.NOT_FOUND, {"error": f"no route for {request['path']}"})


def list_books(query):
    try:
        limit = int(query.get("limit", ["10"])[0])
        offset = int(query.get("offset", ["0"])[0])
    except ValueError:
        return respond(HTTPStatus.BAD_REQUEST, {"error": "limit and offset must be integers"})
    books = sorted(BOOKS.values(), key=lambda b: b["id"])
    if "author" in query:
        books = [b for b in books if b["author"] == query["author"][0]]
    page = books[offset:offset + limit]
    body = {"items": page, "total": len(books), "next": None}
    if offset + limit < len(books):
        body["next"] = "/books?" + urlencode({"limit": limit, "offset": offset + limit})
    return respond(HTTPStatus.OK, body)


def create_book(request):
    try:
        data = json.loads(request["body"])
    except json.JSONDecodeError:
        return respond(HTTPStatus.BAD_REQUEST, {"error": "body must be valid JSON"})
    if not isinstance(data, dict):
        return respond(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": "send a JSON object"})
    missing = [f for f in ("title", "author", "year") if f not in data]
    if missing:
        return respond(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": f"missing: {', '.join(missing)}"})
    book_id = max(BOOKS, default=0) + 1
    BOOKS[book_id] = {"id": book_id, "title": data["title"],
                      "author": data["author"], "year": data["year"]}
    return respond(HTTPStatus.CREATED, BOOKS[book_id], {"Location": f"/books/{book_id}"})
`

const MAIN_PY = py`from bookshop import handle
from http_wire import make_request, request_text, response_text, show


def call(method, url, json_body=None, verbose=False):
    """Send a request to the pretend server and return its response dict."""
    request = make_request(method, url, json_body)
    response = handle(request)                  # no network: just a function call
    if verbose:
        show(request_text(request), ">")
        show(response_text(response), "<")
        print()
    else:
        print(f"{method} {url} -> {response['status']} {response['body']}")
    return response


call("GET", "/books?limit=2", verbose=True)
call("POST", "/books", {"title": "Beloved", "author": "Toni Morrison", "year": 1987}, verbose=True)

print("== More requests ==")
call("GET", "/books/2")
call("GET", "/books/99")
call("GET", "/books?author=Jane+Austen")
call("POST", "/books", {"title": "Untitled"})
call("DELETE", "/books/4")
call("DELETE", "/books/4")
call("PATCH", "/books")
`

export default {
  id: 'http-and-rest',
  title: 'HTTP, REST & JSON APIs',
  summary: 'What actually travels between a client and a web server — methods, paths, headers, status codes and JSON bodies — and the REST conventions that make an API predictable.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['dictionaries', 'json-data', 'string-methods'],
  related: ['http-clients', 'building-apis', 'json-data', 'unicode-and-bytes', 'input-validation', 'secure-practices', 'project-library-api', 'sql-and-sqlite'],
  tags: ['http', 'https', 'rest', 'api', 'json', 'request', 'response', 'method', 'get', 'post', 'put', 'patch', 'delete', 'status code', 'httpstatus', 'headers', 'content-type', 'query string', 'urllib.parse', 'urlencode', 'parse_qs', 'urlsplit', 'idempotent', 'safe methods', 'pagination', 'versioning', 'resource', 'endpoint'],
  apis: [
    { name: 'http.HTTPStatus', summary: 'Enum of status codes: HTTPStatus.NOT_FOUND == 404, .phrase == "Not Found", .description.' },
    { name: 'HTTPStatus.is_success / is_client_error / ...', summary: 'Properties that tell you a code’s family (Python 3.12+).' },
    { name: 'urllib.parse.urlsplit(url)', summary: 'Splits a URL into scheme, netloc, path, query and fragment.' },
    { name: 'urllib.parse.parse_qs(qs)', summary: 'Parses a query string into a dict of lists: "a=1&a=2" -> {"a": ["1", "2"]}.' },
    { name: 'urllib.parse.parse_qsl(qs)', summary: 'Parses a query string into a list of (name, value) pairs.' },
    { name: 'urllib.parse.urlencode(params)', summary: 'Builds a query string with correct escaping; doseq=True expands list values.' },
    { name: 'urllib.parse.quote(text)', summary: 'Percent-encodes text for use inside a URL path (spaces become %20).' },
    { name: 'urllib.parse.urljoin(base, url)', summary: 'Resolves a relative URL against a base URL, like a browser does.' },
    { name: 'json.dumps / json.loads', summary: 'Turn Python data into a JSON body and back.' },
  ],
  docs: [
    { label: 'http — HTTPStatus', url: 'https://docs.python.org/3/library/http.html#http.HTTPStatus' },
    { label: 'urllib.parse — parse URLs into components', url: 'https://docs.python.org/3/library/urllib.parse.html' },
    { label: 'json — JSON encoder and decoder', url: 'https://docs.python.org/3/library/json.html' },
    { label: 'RFC 9110 — HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110.html' },
    { label: 'MDN — An overview of HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' },
    { label: 'RFC 9457 — Problem Details for HTTP APIs', url: 'https://www.rfc-editor.org/rfc/rfc9457.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**HTTP** (*HyperText Transfer Protocol*) is the language web browsers, apps and servers use to talk to each other. Every time a weather app shows the forecast or a game saves your score online, a **client** sends an HTTP **request** and a **server** sends back an HTTP **response**.`,
    py`A request says *what you want to do* (the **method**, like \`GET\` or \`POST\`), *to what* (the **path**, like \`/books/42\`), plus extra information (**headers**) and sometimes data (the **body**). A response says *how it went* (the **status code**, like \`200\` or \`404\`), plus its own headers and body.`,
    py`An **API** (*Application Programming Interface*) is a set of requests a program is allowed to make. A **web API** or **JSON API** is one you use over HTTP, usually sending and receiving [JSON](lesson:json-data). **REST** is a popular style for designing them: everything is a *resource* with a URL, and the HTTP methods are the verbs you apply to it.`,
    py`This lesson is about the messages themselves. Next you'll *send* them with [HTTP clients](lesson:http-clients) and *answer* them by [building an API](lesson:building-apis). The playground has no network access, so the server here is honestly simulated: a plain Python function that takes a request dict and returns a response dict.`,
  ],
  why: [
    py`Almost every modern program talks to other programs over HTTP: payment providers, maps, weather, AI models, your own company's services. If you can read an HTTP exchange, you can debug any of them — even ones written in other languages.`,
    py`HTTP's rules aren't just etiquette. Whether a method is *safe* or *idempotent* decides whether a client may retry it after a timeout. Status codes decide whether a client shows "not found", asks you to log in, or waits and tries again. Getting them right makes your API work with browsers, caches, proxies and client libraries you've never seen.`,
    py`REST conventions make APIs guessable: once you know \`GET /books/42\` fetches a book, you can guess \`DELETE /books/42\` and \`GET /books/42/reviews\` without reading the docs.`,
  ],
  eli15: [
    py`HTTP is like ordering at a café counter with a very strict order form.`,
    py`You fill in: **what you want to do** ("GET me", "here's a new order — POST"), **what it's about** ("/menu/hot-chocolate"), a few **notes** at the top ("I speak English", "here's my loyalty card") and, if needed, **the actual stuff** (your order details). That's a request.`,
    py`The counter hands back a slip with a **number** that sums up what happened — 200 means "here you go", 404 means "we don't have that", 500 means "sorry, the kitchen is on fire" — plus notes and, usually, what you asked for. That's a response.`,
    py`Because everyone uses the same form, any customer can order at any café. REST is just the café agreeing to name everything clearly: \`/menu\`, \`/menu/hot-chocolate\`, \`/orders/17\`.`,
  ],
  analogy: {
    title: 'Letters between a library and its readers',
    body: [
      py`Picture a library that only works by post. You write a letter: the first line says what you want ("LEND book 42"), then a few labelled notes ("Reader card: 7781", "Reply in: English"), a blank line, and then anything you're sending. The library replies with a letter whose first line is a short verdict ("200 OK", "404 No such book"), its own notes, a blank line and the content.`,
      py`The library is strict about verbs: *asking* about a book never changes anything, so you can ask as often as you like. Sending "put book 42 back on shelf B" twice leaves it on shelf B either way. But "add a new copy" sent twice gives you two copies — so you think twice before resending it.`,
    ],
    mapping: [
      ['the first line of your letter (LEND book 42)', 'the request line: method + path + HTTP version'],
      ['labelled notes like "Reader card: 7781"', 'headers like Authorization: Bearer …'],
      ['the blank line, then the enclosed pages', 'the empty line that separates headers from the body'],
      ['the verdict line on the reply (404 No such book)', 'the status line: version + status code + reason phrase'],
      ['asking about a book', 'GET: safe, changes nothing'],
      ['"put book 42 on shelf B" sent twice', 'PUT: idempotent, the same end result'],
      ['"add a new copy" sent twice', 'POST: not idempotent, two copies'],
      ['the library catalogue numbers (/books/42)', 'resource URLs'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'One HTTP round trip',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'client', label: 'Client', note: 'browser, app, script', x: 100, y: 160, tone: 'yellow' },
        { id: 'reqline', label: 'GET /books/2 HTTP/1.1', note: 'request line', x: 380, y: 50, tone: 'blue' },
        { id: 'reqhead', label: 'Host · Accept · Authorization', note: 'headers, then a blank line', x: 380, y: 125 },
        { id: 'server', label: 'Server', note: 'routes → your code', x: 660, y: 160, tone: 'kraft' },
        { id: 'status', label: 'HTTP/1.1 200 OK', note: 'status line', x: 380, y: 205, tone: 'blue' },
        { id: 'resbody', label: '{"id": 2, "title": "Emma"}', note: 'headers, blank line, JSON body', x: 380, y: 280 },
      ],
      edges: [
        { from: 'client', to: 'reqline', label: 'request' },
        { from: 'reqhead', to: 'server' },
        { from: 'server', to: 'status', label: 'response' },
        { from: 'resbody', to: 'client' },
      ],
      steps: [
        { focus: ['client', 'reqline'], edges: ['client->reqline'], text: py`The client opens a connection (over TLS for \`https://\`) and writes the **request line**: the method \`GET\`, the target \`/books/2\` and the protocol version.` },
        { focus: ['reqhead'], text: py`Then **headers**, one \`Name: value\` per line — \`Host\` (required in HTTP/1.1), \`Accept: application/json\`, maybe \`Authorization\`. An empty line ends the headers; a body would follow (a GET usually has none).` },
        { focus: ['server'], edges: ['reqhead->server'], text: py`The server parses the text, picks the code that handles \`GET /books/{id}\` — this is called **routing** — and runs it.` },
        { focus: ['status'], edges: ['server->status'], text: py`It answers with a **status line**: \`200 OK\`. The number is for programs, the phrase is for humans.` },
        { focus: ['resbody', 'client'], edges: ['resbody->client'], text: py`Response headers (\`Content-Type: application/json\`, \`Content-Length: 26\`), an empty line, and the body. The client reads exactly \`Content-Length\` bytes and decodes the JSON.` },
      ],
    },
    alt: 'A client on the left sends a request to a server on the right: the request line "GET /books/2 HTTP/1.1" followed by headers such as Host, Accept and Authorization and a blank line. The server routes the request to code and replies with the status line "HTTP/1.1 200 OK", headers, a blank line and the JSON body {"id": 2, "title": "Emma"}, which travels back to the client.',
    caption: py`HTTP/1.1 messages are plain text up to the body. HTTP/2 and HTTP/3 send the same information in binary frames, but the meaning — methods, paths, headers, status codes — is identical.`,
  },
  syntax: [
    py`#### Anatomy of a request`,
    { code: py`POST /books?notify=true HTTP/1.1          <- request line: METHOD target VERSION
Host: books.example                       <- headers: Name: value
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 61
                                          <- an empty line ends the headers
{"title": "Beloved", "author": "Toni Morrison", "year": 1987}   <- body`, lang: 'text', title: 'request' },
    py`#### Anatomy of a response`,
    { code: py`HTTP/1.1 201 Created                      <- status line: VERSION code reason
Content-Type: application/json
Location: /books/4
Content-Length: 70

{"id": 4, "title": "Beloved", "author": "Toni Morrison", "year": 1987}`, lang: 'text', title: 'response' },
    py`Lines end with \`\\r\\n\` (carriage return + line feed). Header **names** are case-insensitive (\`content-type\` = \`Content-Type\`); their values usually aren't.`,
    py`#### Methods: safe and idempotent`,
    py`A method is **safe** if it only reads — calling it must not change anything on the server. It's **idempotent** if doing it twice has the same effect on the server as doing it once. Idempotent requests can be retried after a timeout without fear.`,
    py`| method | typical meaning | safe | idempotent | request body |
|---|---|---|---|---|
| \`GET\` | read a resource or a list | ✓ | ✓ | no |
| \`HEAD\` | like GET, but headers only | ✓ | ✓ | no |
| \`OPTIONS\` | which methods/features are allowed here? | ✓ | ✓ | rarely |
| \`POST\` | create something new, or run an action | ✗ | ✗ | yes |
| \`PUT\` | replace the resource at this URL with this body | ✗ | ✓ | yes |
| \`PATCH\` | change *some* fields of a resource | ✗ | not guaranteed | yes |
| \`DELETE\` | remove the resource | ✗ | ✓ | rarely |`,
    py`Idempotent is about the *server's state*, not the response: the first \`DELETE /books/4\` returns \`204\`, the second \`404\` — but after both, book 4 is gone either way.`,
    py`#### Status code families`,
    py`| range | family | common codes |
|---|---|---|
| 1xx | informational | \`101 Switching Protocols\` |
| 2xx | success | \`200 OK\`, \`201 Created\` (+ \`Location\` header), \`204 No Content\` |
| 3xx | redirection | \`301 Moved Permanently\`, \`304 Not Modified\`, \`307\`/\`308\` redirects |
| 4xx | **client** error — fix the request | \`400 Bad Request\`, \`401 Unauthorized\` (not logged in), \`403 Forbidden\` (logged in, not allowed), \`404 Not Found\`, \`405 Method Not Allowed\`, \`409 Conflict\`, \`422 Unprocessable Content\`, \`429 Too Many Requests\` |
| 5xx | **server** error — not your fault, maybe retry | \`500 Internal Server Error\`, \`502 Bad Gateway\`, \`503 Service Unavailable\`, \`504 Gateway Timeout\` |`,
    { code: py`from http import HTTPStatus

status = HTTPStatus(404)
print(status.value, status.phrase)       # 404 Not Found
print(status.description)                # Nothing matches the given URI
print(HTTPStatus.CREATED == 201)         # True: HTTPStatus is an IntEnum
print(400 <= status < 500)               # True: a client error

for code in (200, 201, 204, 400, 401, 403, 404, 409, 429, 500, 503):
    print(code, HTTPStatus(code).phrase)`, lang: 'python', title: 'http.HTTPStatus — names instead of magic numbers' },
    { callout: 'version', title: 'Newer HTTPStatus features', text: py`Python **3.12** added the properties \`is_informational\`, \`is_success\`, \`is_redirection\`, \`is_client_error\` and \`is_server_error\` (\`HTTPStatus(503).is_server_error\` → \`True\`). Python **3.13** adopted the RFC 9110 names: 422 is now \`UNPROCESSABLE_CONTENT\` with the phrase "Unprocessable Content"; the old name \`UNPROCESSABLE_ENTITY\` still works as an alias, so code using it runs on every version.` },
    py`#### REST: resources and URLs`,
    py`| request | meaning | success |
|---|---|---|
| \`GET /books\` | list books (filter with a query string) | \`200\` + a JSON list or page |
| \`POST /books\` | create a book from the JSON body | \`201\` + \`Location: /books/4\` |
| \`GET /books/4\` | fetch book 4 | \`200\`, or \`404\` |
| \`PUT /books/4\` | replace book 4 with the body | \`200\` (or \`204\`) |
| \`PATCH /books/4\` | change some fields of book 4 | \`200\` |
| \`DELETE /books/4\` | delete book 4 | \`204\` |
| \`GET /books/4/reviews\` | the reviews *of* book 4 (a sub-collection) | \`200\` |`,
    py`Rules of thumb: **nouns** in paths (\`/books\`, not \`/getBooks\`), **plural** collection names, ids for single items, the **method** carries the verb, and filtering/sorting/paging go in the **query string**: \`/books?author=Austen&sort=year&limit=20\`.`,
    py`#### JSON bodies`,
    { code: py`import json

body = json.dumps({"title": "Beloved", "year": 1987})      # str to send
headers = {"Content-Type": "application/json"}             # say what the body is
data = json.loads('{"id": 4, "title": "Beloved", "year": 1987}')
print(data["id"], body)`, lang: 'python', title: 'JSON in, JSON out' },
    py`#### Query strings with urllib.parse`,
    { code: py`from urllib.parse import parse_qs, urlencode, urlsplit, quote

url = "https://books.example/books?author=Le+Guin&tag=sci-fi&tag=classic"
parts = urlsplit(url)
print(parts.path)                    # /books
print(parse_qs(parts.query))         # {'author': ['Le Guin'], 'tag': ['sci-fi', 'classic']}

query = urlencode({"q": "le guin & co", "page": 2})
print(query)                         # q=le+guin+%26+co&page=2
print(urlencode({"tag": ["sci-fi", "classic"]}, doseq=True))   # tag=sci-fi&tag=classic
print(quote("Le Guin/Earthsea", safe=""))                      # Le%20Guin%2FEarthsea (for a path segment)`, lang: 'python', title: 'never glue query strings together by hand' },
    py`\`parse_qs\` returns **lists** because a name may appear more than once. Spaces become \`+\` in query strings (\`urlencode\`) and \`%20\` in paths (\`quote\`), and \`&\`, \`=\`, \`#\` and non-ASCII characters are percent-encoded — which is exactly why you shouldn't build URLs with f-strings.`,
    py`#### Headers you'll meet constantly`,
    py`| header | direction | purpose |
|---|---|---|
| \`Host\` | request | which site (one server can host many) — required in HTTP/1.1 |
| \`Content-Type\` | both | format of the body: \`application/json; charset=utf-8\`, \`text/html\` |
| \`Accept\` | request | formats the client can read |
| \`Authorization\` | request | credentials, e.g. \`Bearer <token>\` — **secret** |
| \`Content-Length\` | both | body size in **bytes** |
| \`Location\` | response | URL of a newly created resource (201) or redirect target (3xx) |
| \`Cache-Control\`, \`ETag\` | response | caching rules / a version tag for the resource |
| \`If-None-Match\` | request | "only send it if it changed since this ETag" → \`304 Not Modified\` |
| \`Retry-After\` | response | how long to wait after \`429\` or \`503\` |
| \`User-Agent\` | request | which client software is calling |`,
    py`#### Pagination and versioning`,
    py`Big collections come in **pages**. *Offset pagination* (\`?limit=20&offset=40\`) is simple and lets users jump to page 3; *cursor pagination* (\`?limit=20&after=eyJpZCI6NDB9\`) returns an opaque token pointing just past the last item, which stays correct when rows are added while you page. Either way, include a \`next\` link in the response so clients don't have to build URLs.`,
    py`APIs change. **Versioning** lets old clients keep working: most public APIs put the major version in the path (\`/v1/books\`); some use a header instead. Additive changes (new optional fields) don't need a new version; removing or renaming fields does.`,
  ],
  walkthrough: {
    title: 'Reading the pretend server',
    lang: 'python',
    code: BOOKSHOP_PY,
    intro: py`This is **bookshop.py** from the playground — the "server". It's a plain function, but it makes the same decisions a real web framework would ask you to make.`,
    steps: [
      { lines: [13, 16], text: py`\`respond\` builds a response dict: a status, headers and a body. A JSON body gets \`Content-Type: application/json\`; an empty body (like \`204\`) gets no content type at all.` },
      { lines: [19, 21], text: py`**Routing** starts by splitting the path into segments: \`"/books/2"\` → \`["books", "2"]\`. Real frameworks do this with patterns like \`/books/{book_id}\`.` },
      { lines: [23, 29], text: py`The **collection** \`/books\` supports \`GET\` (list) and \`POST\` (create). Any other method gets \`405 Method Not Allowed\` plus an \`Allow\` header listing what *is* allowed — a small courtesy the HTTP spec asks for.` },
      { lines: [31, 41], text: py`A **member** \`/books/<id>\`. First check it exists (\`404\`), then dispatch on the method. \`DELETE\` answers \`204 No Content\`: success, nothing to send back.` },
      { lines: [43, 43], text: py`Any other path is a \`404\` too — with a JSON error body, so clients always get the same shape back.` },
      { lines: [46, 59], text: py`The **query string** arrives parsed by \`parse_qs\`, so every value is a list of strings: \`query.get("limit", ["10"])[0]\`. Bad numbers are the client's fault → \`400\`. The response includes \`total\` and a ready-made \`next\` link built with \`urlencode\`.` },
      { lines: [62, 75], text: py`Creating: malformed JSON → \`400 Bad Request\` (we can't even read it); readable JSON with missing fields → \`422\` (we read it, but it doesn't make sense). Success → \`201 Created\`, the new book in the body, and a \`Location\` header pointing at its URL.` },
    ],
  },
  playground: {
    title: 'A pretend bookshop API',
    objective: 'Run it to see two full HTTP exchanges as wire text, then extend the API and build URLs safely.',
    files: { 'main.py': MAIN_PY, 'bookshop.py': BOOKSHOP_PY, 'http_wire.py': WIRE_PY },
    expected: py`Two exchanges printed like \`curl -v\` (\`>\` is what the client sends, \`<\` is what comes back), then one line per request:

\`\`\`text
> GET /books?limit=2 HTTP/1.1
> Host: books.example
> Accept: application/json
>
< HTTP/1.1 200 OK
< Content-Type: application/json
< Content-Length: 194
<
< {"items": [{"id": 1, ...}, {"id": 2, ...}], "total": 3, "next": "/books?limit=2&offset=2"}
...
< HTTP/1.1 201 Created
< Location: /books/4
...
== More requests ==
GET /books/2 -> 200 {"id": 2, "title": "Emma", "author": "Jane Austen", "year": 1815}
GET /books/99 -> 404 {"error": "no book with id 99"}
GET /books?author=Jane+Austen -> 200 {"items": [...], "total": 1, "next": null}
POST /books -> 422 {"error": "missing: author, year"}
DELETE /books/4 -> 204
DELETE /books/4 -> 404 {"error": "no book with id 4"}
PATCH /books -> 405 {"error": "PATCH not allowed here"}
\`\`\`

Notice the two \`DELETE\`s: different status codes, same end state — that's idempotency.`,
    experiments: [
      {
        id: 'put-replace',
        task: py`Add \`PUT /books/<id>\` to **bookshop.py**: parse the JSON body, require \`title\`, \`author\` and \`year\` (otherwise \`422\`), replace the stored book (keeping its id) and return \`200\` with the new book. Update the \`Allow\` header for members to \`GET, PUT, DELETE\`.`,
        hint: py`In the member branch, before the final 405: \`if method == "PUT":\`, then \`data = json.loads(request["body"])\`, check the three fields like \`create_book\` does, and \`BOOKS[book_id] = {"id": book_id, ...}\`.`,
        tests: [
          { name: 'PUT replaces the book and returns 200', code: py`from http_wire import make_request
new = {"title": "Dune Messiah", "author": "Frank Herbert", "year": 1969}
r = handle(make_request("PUT", "/books/1", new))
assert r["status"] == 200, r
got = handle(make_request("GET", "/books/1"))
assert '"Dune Messiah"' in got["body"] and '"id": 1' in got["body"]` },
          { name: 'PUT twice gives the same result (idempotent)', code: py`from http_wire import make_request
new = {"title": "Dune Messiah", "author": "Frank Herbert", "year": 1969}
first = handle(make_request("PUT", "/books/1", new))
second = handle(make_request("PUT", "/books/1", new))
assert first == second` },
          { name: 'missing fields get 422', code: py`from http_wire import make_request
r = handle(make_request("PUT", "/books/1", {"title": "Only a title"}))
assert r["status"] == 422, r` },
        ],
        explain: py`\`PUT\` means "make the resource at this URL look exactly like this". Doing it twice leaves the same book behind, so a client that timed out can safely retry. Compare \`POST /books\`: retrying it would create a **second** book.`,
      },
      {
        id: 'since-filter',
        task: py`Make \`GET /books?since=1900\` return only books published in or after that year. A non-number such as \`?since=soon\` must get \`400\`.`,
        hint: py`In \`list_books\`, read \`query.get("since")\`; if present, convert with \`int(...)\` inside the existing \`try\`, then filter \`b["year"] >= since\`.`,
        tests: [
          { name: '?since=1900 keeps the 20th-century books', code: py`import json
from http_wire import make_request
r = handle(make_request("GET", "/books?since=1900"))
assert r["status"] == 200
assert json.loads(r["body"])["total"] == 2` },
          { name: '?since=soon is a 400', code: py`from http_wire import make_request
assert handle(make_request("GET", "/books?since=soon"))["status"] == 400` },
        ],
        explain: py`Query parameters always arrive as **strings** (inside lists, thanks to \`parse_qs\`). Converting and validating them is the server's job, and a value it can't understand is a client error: \`400\`.`,
      },
      {
        id: 'build-search-url',
        task: py`At the end of **main.py**, search for books by **Octavia E. Butler**, at most 1 result. Build the URL with \`urlencode\` (from \`urllib.parse\`) instead of typing the escaped text yourself, then \`call("GET", url)\`.`,
        hint: py`\`url = "/books?" + urlencode({"author": "Octavia E. Butler", "limit": 1})\` — and \`from urllib.parse import urlencode\` at the top.`,
        tests: [
          { name: 'the encoded author appears in the request', code: py`assert "author=Octavia+E.+Butler" in output, 'Build the query string with urlencode'` },
          { name: 'Kindred was found', code: py`assert "Kindred" in output.split("== More requests ==")[1]` },
        ],
        explain: py`\`urlencode\` turned the spaces into \`+\` and would also have escaped \`&\`, \`=\`, \`#\` or accented letters. An f-string like \`f"/books?author={name}"\` breaks the moment a name contains \`&\`, and lets a user inject extra parameters.`,
      },
      {
        id: 'total-header',
        task: py`Add a response header \`X-Total-Count\` to \`GET /books\` responses, holding the total number of matching books **as a string** (header values are always text).`,
        hint: py`In \`list_books\`, pass a third argument to \`respond\`: \`{"X-Total-Count": str(len(books))}\`.`,
        tests: [
          { name: 'GET /books has X-Total-Count: 3', code: py`from http_wire import make_request
r = handle(make_request("GET", "/books"))
assert r["headers"].get("X-Total-Count") == "3", r["headers"]` },
          { name: 'the count respects the author filter', code: py`from http_wire import make_request
r = handle(make_request("GET", "/books?author=Jane+Austen"))
assert r["headers"].get("X-Total-Count") == "1"` },
        ],
        explain: py`Headers carry *metadata* about the response — here, how many items exist in total, without changing the body's shape. Custom headers traditionally started with \`X-\`; that convention is now discouraged for new standards, but you'll still see it everywhere.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch a request get routed',
    props: {
      code: py`import json

BOOKS = {1: "Dune", 2: "Emma"}


def handle(request):
    parts = request["path"].strip("/").split("/")
    if len(parts) != 2 or parts[0] != "books" or not parts[1].isdigit():
        return {"status": 404, "body": json.dumps({"error": "no such route"})}
    book_id = int(parts[1])
    if book_id not in BOOKS:
        return {"status": 404, "body": json.dumps({"error": "no such book"})}
    if request["method"] != "GET":
        return {"status": 405, "body": json.dumps({"error": "method not allowed"})}
    return {"status": 200, "body": json.dumps({"id": book_id, "title": BOOKS[book_id]})}


found = handle({"method": "GET", "path": "/books/2"})
missing = handle({"method": "GET", "path": "/books/7"})
print(found["status"], found["body"])
print(missing["status"], missing["body"])
`,
      notes: {
        7: 'Routing starts by splitting the path into segments: `["books", "2"]`.',
        8: 'Is this a path we know? Anything else is a `404`.',
        10: 'Path segments are **strings** — convert the id to an int to look it up.',
        11: 'The route exists, but does the *resource*? Book 7 doesn’t: `404` again, with a different message.',
        13: 'The resource exists — is the *method* allowed on it? If not, `405`.',
        15: 'Everything checks out: `200` with the book as a JSON body.',
      },
    },
    alt: 'A step-by-step trace of a handle function called twice. For GET /books/2 the path is split into ["books", "2"], the id 2 is found in BOOKS, the method is GET, so it returns status 200 with the body {"id": 2, "title": "Emma"}. For GET /books/7 the id is not in BOOKS so it returns status 404 with {"error": "no such book"}. Both results are printed.',
    caption: py`A server's job, in miniature: match the route, find the resource, check the method, answer with a status and a body.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`#### What happens when you visit a URL`,
      py`Take \`https://books.example/books/2\`:`,
      py`1. **DNS** turns \`books.example\` into an IP address — the server's number on the internet.
2. Your computer opens a **TCP connection** to that address on port 443 (the default for \`https\`; plain \`http\` uses 80).
3. **TLS** encrypts the connection and checks the server's certificate, so nobody in between can read or change the messages. That's the "S" in HTTPS.
4. The client writes the request; the server writes the response.
5. The connection usually stays open for the next request (*keep-alive*), because opening one is the slowest part.`,
      py`HTTP is **stateless**: each request carries everything the server needs (who you are, what you want). Logins "stick" because the client resends a cookie or token with every request, not because the server remembers the connection.`,
    ],
    technical: [
      py`#### Message framing`,
      py`An HTTP/1.1 message is: a start line, header lines, an empty line (\`\\r\\n\\r\\n\` marks the end of the head), then the body. The receiver needs to know where the body ends — either from \`Content-Length\` (a count of **bytes**, not characters: \`"café"\` is 4 characters but 5 bytes in UTF-8) or from \`Transfer-Encoding: chunked\`, where the body arrives in size-prefixed pieces. That's why \`http_wire.py\` measures \`len(body.encode("utf-8"))\`.`,
      py`**HTTP/2** keeps the same semantics but sends headers and bodies as binary *frames*, compresses headers and multiplexes many requests over one connection. **HTTP/3** does the same over QUIC (built on UDP). Your Python code — and this lesson — deals with methods, URLs, headers and status codes, which are the same in all three. The shared rules are written down in **RFC 9110, HTTP Semantics**.`,
      py`#### Why "safe" and "idempotent" are promises, not suggestions`,
      py`Browsers prefetch links, search engines crawl them and caches store GET responses — all assuming GET changes nothing. A \`GET /books/4/delete\` link will eventually be "clicked" by a crawler. Likewise, HTTP client libraries and proxies may automatically retry idempotent requests after a connection failure, but not POST. The method you choose tells the whole internet how to treat your request.`,
      py`#### Encoding rules`,
      py`URLs may only contain a limited set of ASCII characters; everything else is *percent-encoded* as UTF-8 bytes: \`ü\` → \`%C3%BC\`. In a query string (the \`application/x-www-form-urlencoded\` format), a space is \`+\`; in a path it's \`%20\`, and \`/\` must be encoded inside a single segment. \`urllib.parse\` knows all of this; string concatenation doesn't.`,
      py`#### Conditional requests and caching`,
      py`A server can tag a response with \`ETag: "v7"\` (a version identifier). Next time, the client sends \`If-None-Match: "v7"\`; if nothing changed the server answers \`304 Not Modified\` with no body, saving bandwidth. \`Cache-Control: max-age=60\` lets clients and proxies reuse a response for 60 seconds without asking at all. For writes, \`If-Match: "v7"\` gives *optimistic locking*: the server returns \`412 Precondition Failed\` if someone else changed the resource first.`,
      { callout: 'note', title: 'HTTPStatus is an IntEnum', text: py`\`HTTPStatus.NOT_FOUND == 404\` is \`True\` and members work anywhere an int does. Printing one gives \`404\` on Python 3.11+ (enum string formatting changed in 3.11); on 3.10, \`str(HTTPStatus.NOT_FOUND)\` gave \`HTTPStatus.NOT_FOUND\`. Convert with \`int(status)\` or use \`.value\` when you need a plain number in output.` },
    ],
    production: [
      py`#### Designing a REST API people enjoy using`,
      py`- **Consistent errors.** Return the same JSON shape for every error. RFC 9457 *Problem Details* (\`Content-Type: application/problem+json\` with \`type\`, \`title\`, \`status\`, \`detail\`) is a standard choice.
- **Accurate status codes.** \`200\` with \`{"error": ...}\` in the body breaks every client, monitoring tool and retry policy that trusts the status line.
- **Pagination by default** on every list endpoint, with a maximum page size, and \`next\` links. Prefer cursors for large or fast-changing collections.
- **Version** from day one (\`/v1/\`), and only make additive changes within a version.
- **Rate limiting:** \`429 Too Many Requests\` with \`Retry-After\`.
- **Idempotency keys** for important POSTs (payments, orders): the client sends a unique \`Idempotency-Key\` header and the server stores the first result, so a retried POST doesn't charge twice. It's a widely used convention (an IETF draft standard).
- **Describe the API** in an OpenAPI document so clients, docs and tests can be generated from it.`,
      py`#### Security basics`,
      py`- HTTPS everywhere — tokens and cookies in plain HTTP can be read by anyone on the network.
- Treat everything in a request — path, query, headers, body — as untrusted input: validate types and ranges ([input validation](lesson:input-validation)).
- Never put secrets in URLs (they end up in logs and browser history); send them in the \`Authorization\` header.
- Return \`404\` rather than \`403\` when even revealing that a resource exists would leak information.
- Browser-specific protections (CORS, cookies, CSRF) are covered in [building APIs](lesson:building-apis) and [secure practices](lesson:secure-practices).`,
    ],
  },
  mistakes: [
    {
      title: 'Returning 200 for an error',
      wrong: { code: py`def get_book(book_id):
    if book_id not in BOOKS:
        return {"status": 200, "body": '{"error": "not found"}'}
    return {"status": 200, "body": json.dumps(BOOKS[book_id])}`, lang: 'python', static: true },
      right: { code: py`def get_book(book_id):
    if book_id not in BOOKS:
        return {"status": 404, "body": json.dumps({"error": f"no book with id {book_id}"})}
    return {"status": 200, "body": json.dumps(BOOKS[book_id])}`, lang: 'python', static: true },
      explanation: py`Clients, caches, monitoring and retry logic read the **status code**, not your error text. A \`200\` says "success, cache this". Use the code that matches what happened and put details in the body.`,
    },
    {
      title: 'Building query strings with f-strings',
      wrong: { code: py`author = "Simon & Garfunkel"
url = f"/albums?artist={author}&limit=5"
print(url)   # /albums?artist=Simon & Garfunkel&limit=5  -> the server sees artist="Simon "`, lang: 'python' },
      right: { code: py`from urllib.parse import urlencode

author = "Simon & Garfunkel"
url = "/albums?" + urlencode({"artist": author, "limit": 5})
print(url)   # /albums?artist=Simon+%26+Garfunkel&limit=5`, lang: 'python' },
      explanation: py`\`&\` separates parameters, so the unescaped name is cut in half (and \`" Garfunkel"\` becomes a parameter with no value). \`urlencode\` escapes every special character, including non-ASCII ones.`,
    },
    {
      title: 'Verbs in URLs and side effects in GET',
      wrong: { code: py`GET  /getBook?id=4
GET  /books/4/delete        <- a crawler or link prefetch can delete data
POST /books/4/update`, lang: 'text' },
      right: { code: py`GET    /books/4
DELETE /books/4
PUT    /books/4      (replace)   or   PATCH /books/4   (partial change)`, lang: 'text' },
      explanation: py`The method *is* the verb. Keeping GET free of side effects lets browsers, caches and crawlers treat it as safe — which they will, whether you planned for it or not.`,
    },
    {
      title: 'Sending JSON without saying so',
      wrong: { code: py`headers = {}                                   # no Content-Type
body = str({"title": "Emma", "draft": True})   # "{'title': 'Emma', 'draft': True}" — not JSON!`, lang: 'python' },
      right: { code: py`import json

headers = {"Content-Type": "application/json"}
body = json.dumps({"title": "Emma", "draft": True})   # '{"title": "Emma", "draft": true}'`, lang: 'python' },
      explanation: py`\`str(dict)\` produces Python syntax (single quotes, \`True\`), which JSON parsers reject. And without \`Content-Type: application/json\`, many servers won't even try to parse the body as JSON — you'll get \`400\` or \`415 Unsupported Media Type\`.`,
    },
    {
      title: 'Assuming query values are numbers',
      wrong: { code: py`limit = query["limit"]          # ['20'] — a list of strings from parse_qs
page = books[:limit]            # TypeError: slice indices must be integers or None...`, lang: 'python', static: true },
      right: { code: py`try:
    limit = int(query.get("limit", ["20"])[0])
except ValueError:
    return respond(400, {"error": "limit must be an integer"})
limit = max(1, min(limit, 100))         # and keep it within sane bounds`, lang: 'python', static: true },
      explanation: py`Everything in a URL is text. \`parse_qs\` gives you lists of strings; convert, validate and clamp each value, and answer bad input with \`400\` instead of crashing with \`500\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`405 Method Not Allowed`,
      cause: py`The URL exists but doesn't support this method — e.g. \`POST\` to \`/books/4\` or \`DELETE\` to \`/books\`.`,
      fix: py`Read the response's \`Allow\` header (it lists the permitted methods) and check the API docs for the right URL + method pair.`,
    },
    {
      symptom: py`415 Unsupported Media Type, or 400 "body must be valid JSON"`,
      cause: py`The body isn't JSON (\`str(dict)\` instead of \`json.dumps\`), or the \`Content-Type: application/json\` header is missing.`,
      fix: py`Serialise with \`json.dumps\` and set the header. HTTP client libraries do both for you with a \`json=\` argument — see [HTTP clients](lesson:http-clients).`,
    },
    {
      symptom: py`401 Unauthorized vs 403 Forbidden`,
      cause: py`401: the server doesn't know who you are — no credentials, or an expired/invalid token. 403: it knows exactly who you are, and you're not allowed.`,
      fix: py`For 401, send or refresh the token in the \`Authorization\` header. For 403, logging in again won't help — you need different permissions.`,
    },
    {
      symptom: py`A search for "R&D" returns everything, or the server sees only "R"`,
      cause: py`The query string was built by string concatenation, so \`&\` split the value into two parameters.`,
      fix: py`Build URLs with \`urlencode\` (and \`quote\` for path segments). Print the final URL to check it.`,
    },
    {
      symptom: py`ValueError: 299 is not a valid HTTPStatus`,
      cause: py`\`HTTPStatus(code)\` only accepts registered status codes; some services return non-standard ones.`,
      fix: py`Classify by range instead: \`200 <= code < 300\` for success. Use \`HTTPStatus\` for naming known codes, not for validating arbitrary ones.`,
    },
  ],
  bestPractices: [
    'Use nouns for resources (/books/4) and let the HTTP method be the verb.',
    'Keep GET, HEAD and OPTIONS free of side effects; make PUT and DELETE idempotent.',
    'Return the most specific accurate status code; never 200 with an error body.',
    'Answer POST-that-creates with 201 Created and a Location header.',
    'Send and expect JSON with Content-Type: application/json, built with json.dumps/json.loads.',
    'Build URLs and query strings with urllib.parse, never with string concatenation.',
    'Paginate every list endpoint, cap the page size, and include a next link.',
    'Use one consistent JSON error shape (e.g. RFC 9457 problem details).',
    'Use HTTPS and keep secrets in headers, never in URLs.',
  ],
  useCases: [
    'Reading data from public APIs: weather, maps, exchange rates, GitHub.',
    'Mobile and web front ends talking to their back-end service.',
    'Microservices calling each other inside a company.',
    'Webhooks: a service POSTs an event (a payment succeeded) to your URL.',
    'Debugging: reading raw requests/responses in browser dev tools or curl -v.',
  ],
  comparison: {
    title: 'PUT vs PATCH vs POST',
    headers: ['', 'POST /books', 'PUT /books/4', 'PATCH /books/4'],
    rows: [
      ['meaning', 'create a new member (or run an action)', 'replace book 4 entirely', 'change some fields of book 4'],
      ['body', 'the new book (no id — the server picks it)', 'the complete book', 'only the fields to change'],
      ['idempotent?', 'no — twice makes two books', 'yes — twice leaves the same book', 'not guaranteed (e.g. "add 1 to stock")'],
      ['typical success', '201 + Location', '200 or 204', '200'],
      ['safe to auto-retry?', 'only with an idempotency key', 'yes', 'only if the patch is idempotent'],
    ],
    note: py`Some APIs let \`PUT\` create a resource at a client-chosen URL (\`PUT /users/ada/avatar\`) — still idempotent, because the URL is fixed.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'http-and-rest-q1',
      type: 'mcq',
      prompt: 'In `GET /books?author=Austen HTTP/1.1`, which part tells the server **what the client wants to do**?',
      options: [
        'GET',
        { text: '/books', why: 'That’s the path — which resource the request is about, not what to do with it.' },
        { text: 'author=Austen', why: 'That’s the query string — extra parameters, here a filter.' },
        { text: 'HTTP/1.1', why: 'That’s the protocol version, telling the server how to read the rest of the message.' },
      ],
      answer: 0,
      explanation: py`The **method** is the verb. The same path means different things with different methods: \`GET /books/4\` reads, \`DELETE /books/4\` deletes.`,
    },
    {
      id: 'http-and-rest-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from http import HTTPStatus

s = HTTPStatus(201)
print(s.value, s.phrase, 400 <= s < 500)`,
      answer: '201 Created False',
      accept: ['201 Created False'],
      explanation: py`\`.value\` is the number, \`.phrase\` the standard reason phrase. \`HTTPStatus\` is an \`IntEnum\`, so comparisons work like ints: 201 is not in the 4xx client-error range.`,
    },
    {
      id: 'http-and-rest-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from urllib.parse import urlencode

print(urlencode({"q": "le guin & co", "page": 2}))`,
      options: [
        { text: 'q=le guin & co&page=2', why: 'urlencode never leaves spaces or & unescaped — that would break the query string.' },
        'q=le+guin+%26+co&page=2',
        { text: 'q=le%20guin%20%26%20co&page=2', why: 'Close! %20 is how quote() encodes spaces in a path. urlencode uses the form encoding, where a space is +.' },
        { text: '?q=le+guin+%26+co&page=2', why: 'urlencode returns only the query string; you add the ? yourself.' },
      ],
      answer: 1,
      explanation: py`Query strings use form encoding: spaces become \`+\` and \`&\` becomes \`%26\`, so it can't be mistaken for the separator between parameters. The int \`2\` is converted to text.`,
    },
    {
      id: 'http-and-rest-q4',
      type: 'bug',
      prompt: 'A client’s retry logic and error monitoring both ignore missing books. Click the line that causes it.',
      code: py`def get_book(book_id):
    book = BOOKS.get(book_id)
    if book is None:
        return {"status": 200, "body": json.dumps({"error": "not found"})}
    return {"status": 200, "body": json.dumps(book)}`,
      answerLine: 4,
      explanation: py`A missing book is reported as \`200 OK\`, so every tool that reads the status line thinks it succeeded (and a cache may even store it). It should be \`404\`; the JSON body can still explain the details.`,
    },
    {
      id: 'http-and-rest-q5',
      type: 'fill',
      prompt: 'Complete the code so it prints the path, then the parsed query string.',
      code: py`from urllib.parse import parse_qs, urlsplit

parts = ___("https://shop.example/books?author=Austen&page=2")
print(parts.path)                 # /books
print(___(parts.query))           # {'author': ['Austen'], 'page': ['2']}`,
      answer: [['urlsplit', 'urlparse'], ['parse_qs']],
      explanation: py`\`urlsplit\` breaks a URL into scheme, netloc, path, query and fragment (\`urlparse\` is similar). \`parse_qs\` turns the query into a dict whose values are **lists**, because a name can repeat.`,
    },
    {
      id: 'http-and-rest-q6',
      type: 'mcq',
      prompt: 'A mobile app sends `PUT /cart/items/7` with `{"quantity": 2}`. The connection drops before the response arrives, so the app sends the same request again. What happens?',
      options: [
        { text: 'The cart now has 4 of item 7', why: 'That would be true of a POST that adds items. PUT sets the item to exactly this state, so repeating it changes nothing further.' },
        'The cart has 2 of item 7 — repeating a PUT is safe',
        { text: 'The server must reject the second request with 409 Conflict', why: 'Nothing conflicts: the second PUT asks for the state that already exists. A correct server simply applies it again.' },
        { text: 'It depends on whether the first response was 200 or 204', why: 'The client never saw the first response, and the end state is the same either way.' },
      ],
      answer: 1,
      explanation: py`PUT is **idempotent**: one call or five, the item ends up with quantity 2. That's why clients can retry it after a timeout. A non-idempotent \`POST /cart/items\` ("add 2 more") would need an idempotency key to be retried safely.`,
    },
    {
      id: 'http-and-rest-q7',
      type: 'short',
      prompt: 'What is the difference between a *safe* and an *idempotent* method? Give one method that is idempotent but not safe.',
      answer: py`A safe method only reads — it must not change server state (GET, HEAD, OPTIONS). An idempotent method may change state, but doing it twice has the same effect as doing it once. Every safe method is idempotent; PUT and DELETE are idempotent but not safe: they change data, yet repeating them leaves the same result.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'parse-raw-request',
      title: 'Read an HTTP request off the wire',
      difficulty: 'intermediate',
      prompt: py`Write \`parse_http_request(raw)\` that turns raw HTTP/1.1 request text into a dict:

\`\`\`text
{"method": "POST", "path": "/books", "query": {"notify": "true"},
 "headers": {"host": "books.example", "content-type": "application/json"},
 "body": '{"title": "Emma"}'}
\`\`\`

Rules:

- Lines end with \`"\\r\\n"\`; the head and the body are separated by the first \`"\\r\\n\\r\\n"\`. The body may be empty.
- The request line is \`METHOD TARGET VERSION\`. \`path\` is the target without its query string; \`query\` is a dict of **single** values (use \`dict(parse_qsl(...))\`), \`{}\` if there is none.
- Header **names** are lower-cased; names and values have surrounding spaces stripped. Split each header line at the **first** colon only (values like \`Host: localhost:8000\` contain colons).
- Raise \`ValueError\` if the request line doesn't have exactly three parts, or the version doesn't start with \`HTTP/\`.`,
      files: {
        'main.py': py`from urllib.parse import parse_qsl, urlsplit


def parse_http_request(raw):
    # TODO: split head/body, parse the request line, the target and the headers
    return {}


raw = (
    "POST /books?notify=true HTTP/1.1\r\n"
    "Host: books.example\r\n"
    "Content-Type: application/json\r\n"
    "\r\n"
    '{"title": "Emma"}'
)
print(parse_http_request(raw))
`,
      },
      hints: [
        'raw.partition("\\r\\n\\r\\n") gives (head, separator, body). Then head.split("\\r\\n") gives the request line followed by the header lines.',
        'request_line.split(" ") must give 3 parts. urlsplit(target) gives .path and .query; dict(parse_qsl(parts.query)) gives single values.',
        'For headers: name, _, value = line.partition(":") then headers[name.strip().lower()] = value.strip(). Check len(parts) != 3 or not version.startswith("HTTP/") before anything else, and raise ValueError.',
      ],
      solution: {
        explanation: py`\`partition\` splits at the **first** separator only, which is exactly what HTTP needs twice: the first blank line separates head from body (a body may contain blank lines of its own), and the first colon separates a header name from its value (values may contain colons). \`urlsplit\` separates the path from the query, and \`parse_qsl\` decodes \`+\` and \`%XX\` escapes for us. Lower-casing header names reflects the rule that they're case-insensitive, so code can look up \`headers["content-type"]\` reliably. Validating the request line first means malformed input fails loudly with \`ValueError\` — which a real server would turn into \`400 Bad Request\`.`,
        files: {
          'main.py': py`from urllib.parse import parse_qsl, urlsplit


def parse_http_request(raw):
    head, _, body = raw.partition("\r\n\r\n")
    request_line, *header_lines = head.split("\r\n")
    parts = request_line.split(" ")
    if len(parts) != 3 or not parts[2].startswith("HTTP/"):
        raise ValueError(f"bad request line: {request_line!r}")
    method, target, _version = parts
    url = urlsplit(target)
    headers = {}
    for line in header_lines:
        name, _, value = line.partition(":")
        headers[name.strip().lower()] = value.strip()
    return {
        "method": method,
        "path": url.path,
        "query": dict(parse_qsl(url.query)),
        "headers": headers,
        "body": body,
    }


raw = (
    "POST /books?notify=true HTTP/1.1\r\n"
    "Host: books.example\r\n"
    "Content-Type: application/json\r\n"
    "\r\n"
    '{"title": "Emma"}'
)
print(parse_http_request(raw))
`,
        },
      },
      tests: [
        { name: 'parses method, path, query and body', code: py`r = parse_http_request(raw)
assert r["method"] == "POST" and r["path"] == "/books"
assert r["query"] == {"notify": "true"}
assert r["body"] == '{"title": "Emma"}'` },
        { name: 'header names are lower-cased', code: py`r = parse_http_request(raw)
assert r["headers"] == {"host": "books.example", "content-type": "application/json"}` },
        { name: 'GET without query or body', code: py`r = parse_http_request("GET /books/2 HTTP/1.1\r\nHost: books.example\r\n\r\n")
assert r == {"method": "GET", "path": "/books/2", "query": {}, "headers": {"host": "books.example"}, "body": ""}` },
        { name: 'decodes the query and keeps colons in header values', code: py`r = parse_http_request("GET /search?q=le+guin&page=2 HTTP/1.1\r\nHost: localhost:8000\r\n\r\n")
assert r["query"] == {"q": "le guin", "page": "2"}
assert r["headers"]["host"] == "localhost:8000"` },
        { name: 'a bad request line raises ValueError', code: py`with raises(ValueError):
    parse_http_request("HELLO\r\n\r\n")
with raises(ValueError):
    parse_http_request("GET /books FTP/1.0\r\n\r\n")` },
      ],
    },
    {
      id: 'paginate-with-links',
      title: 'Pages with next and prev links',
      difficulty: 'intermediate',
      prompt: py`Write \`paginate(items, path, params)\` for a list endpoint. \`params\` is a dict of query parameters as **strings** (e.g. \`{"author": "Le Guin", "limit": "3"}\`).

- \`limit\` defaults to \`10\`, \`offset\` to \`0\`. Raise \`ValueError\` if either isn't an integer, if \`limit\` is outside 1–100, or \`offset\` is negative.
- Return a dict: \`{"items": <the page>, "total": len(items), "next": <url or None>, "prev": <url or None>}\`.
- \`next\` exists only if there are items after this page; \`prev\` only if \`offset > 0\`, pointing at offset \`max(0, offset - limit)\`.
- A link is \`path + "?" + urlencode(pairs)\`, where \`pairs\` is every **other** parameter from \`params\` in its original order, then \`("limit", limit)\`, then \`("offset", new_offset)\`.

Example: \`paginate(list(range(1, 8)), "/books", {"author": "Le Guin", "limit": "3"})\` →
\`{"items": [1, 2, 3], "total": 7, "next": "/books?author=Le+Guin&limit=3&offset=3", "prev": None}\``,
      files: {
        'main.py': py`from urllib.parse import urlencode


def paginate(items, path, params):
    # TODO: validate limit/offset, slice the page, build next/prev links
    limit = int(params.get("limit", 10))
    return {"items": items[:limit], "total": len(items), "next": None, "prev": None}


books = [f"book {n}" for n in range(1, 8)]
print(paginate(books, "/books", {"author": "Le Guin", "limit": "3"}))
print(paginate(books, "/books", {"author": "Le Guin", "limit": "3", "offset": "3"}))
`,
      },
      hints: [
        'Convert with int(params.get("limit", "10")) — int() raises ValueError on bad text for you — then check the ranges and raise ValueError yourself.',
        'others = [(k, v) for k, v in params.items() if k not in ("limit", "offset")]. A link is path + "?" + urlencode(others + [("limit", limit), ("offset", new_offset)]).',
        'next exists when offset + limit < len(items); prev exists when offset > 0 and uses max(0, offset - limit). The page is items[offset:offset + limit].',
      ],
      solution: {
        explanation: py`Query parameters arrive as text, so the function converts and validates first — \`int()\` already raises \`ValueError\` for non-numbers, and the explicit range checks reject a huge \`limit\` that could make the server do too much work. Slicing never fails past the end of a list, so the last page is simply shorter. The links keep the client's other parameters (like the author filter) so the next page is the next page *of the same search*, and \`urlencode\` on a list of pairs keeps their order and escapes everything. Clients just follow \`next\` until it's \`None\` — they never have to build URLs themselves.`,
        files: {
          'main.py': py`from urllib.parse import urlencode


def paginate(items, path, params):
    limit = int(params.get("limit", "10"))
    offset = int(params.get("offset", "0"))
    if not 1 <= limit <= 100:
        raise ValueError("limit must be between 1 and 100")
    if offset < 0:
        raise ValueError("offset must not be negative")

    others = [(k, v) for k, v in params.items() if k not in ("limit", "offset")]

    def link(new_offset):
        return path + "?" + urlencode(others + [("limit", limit), ("offset", new_offset)])

    return {
        "items": items[offset:offset + limit],
        "total": len(items),
        "next": link(offset + limit) if offset + limit < len(items) else None,
        "prev": link(max(0, offset - limit)) if offset > 0 else None,
    }


books = [f"book {n}" for n in range(1, 8)]
print(paginate(books, "/books", {"author": "Le Guin", "limit": "3"}))
print(paginate(books, "/books", {"author": "Le Guin", "limit": "3", "offset": "3"}))
`,
        },
      },
      tests: [
        { name: 'first page', code: py`r = paginate(list(range(1, 8)), "/books", {"author": "Le Guin", "limit": "3"})
assert r == {"items": [1, 2, 3], "total": 7, "next": "/books?author=Le+Guin&limit=3&offset=3", "prev": None}` },
        { name: 'middle page has both links', code: py`r = paginate(list(range(1, 8)), "/books", {"author": "Le Guin", "limit": "3", "offset": "3"})
assert r["items"] == [4, 5, 6]
assert r["next"] == "/books?author=Le+Guin&limit=3&offset=6"
assert r["prev"] == "/books?author=Le+Guin&limit=3&offset=0"` },
        { name: 'last page has no next', code: py`r = paginate(list(range(1, 8)), "/books", {"limit": "3", "offset": "6"})
assert r["items"] == [7] and r["next"] is None
assert r["prev"] == "/books?limit=3&offset=3"` },
        { name: 'defaults: limit 10, offset 0', code: py`r = paginate(list(range(25)), "/items", {})
assert r["items"] == list(range(10)) and r["next"] == "/items?limit=10&offset=10" and r["prev"] is None` },
        { name: 'bad values raise ValueError', code: py`for bad in ({"limit": "abc"}, {"limit": "0"}, {"limit": "500"}, {"offset": "-1"}):
    with raises(ValueError):
        paginate([1, 2, 3], "/x", bad)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'http-and-rest-anatomy',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Walk me through what an HTTP request and response contain.',
      answer: 'A request has a request line (method, target path + query, version), headers, an empty line and an optional body. A response has a status line (version, status code, reason phrase), headers, an empty line and an optional body. Headers carry metadata such as Content-Type, Content-Length, Authorization and Location.',
      explanation: py`In HTTP/1.1 these are text lines separated by \`\\r\\n\`; the body length comes from \`Content-Length\` (in bytes) or chunked encoding. HTTP/2 and 3 encode the same fields in binary frames. The status code family (2xx–5xx) tells the client what happened; the body holds the data or error details.`,
      whyAsked: 'It’s the foundation for debugging any web integration — interviewers check you can reason about what is actually on the wire.',
      mistakes: ['Forgetting headers or the status line', 'Saying the query string is part of the body', 'Thinking Content-Length counts characters rather than bytes'],
      followUps: ['How does the receiver know where the body ends?', 'What changes in HTTP/2?', 'Which headers would you check first when a request fails?'],
      modelAnswer: 'A request starts with a request line: the method, like GET or POST, the target, which is the path plus any query string, and the HTTP version. Then come headers — name-value pairs like Host, Accept, Content-Type and Authorization — then a blank line and an optional body, often JSON. A response mirrors that: a status line with the version, a status code and a reason phrase, then headers like Content-Type, Content-Length or Location, a blank line and the body. The receiver knows where the body ends from Content-Length, which counts bytes, or from chunked encoding. HTTP/2 and 3 carry the same information in binary frames, so the semantics are identical.',
    },
    {
      id: 'http-and-rest-idempotency',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Which set lists exactly the HTTP methods that are idempotent according to the HTTP specification?',
      options: [
        'GET, POST, PUT, DELETE',
        'GET, HEAD, OPTIONS, PUT, DELETE',
        'GET, HEAD, OPTIONS only',
        'PUT, PATCH, DELETE',
      ],
      correctOption: 1,
      answer: 'GET, HEAD, OPTIONS (and TRACE) are safe and therefore idempotent; PUT and DELETE are idempotent but not safe. POST is neither, and PATCH is not guaranteed to be idempotent.',
      explanation: py`Idempotent means repeating the request has the same effect on the server as sending it once — it's about state, not the response (a second DELETE may return 404). It matters because clients and proxies can automatically retry idempotent requests after a network failure. For POST, use an idempotency key if retries must be safe.`,
      whyAsked: 'Retry behaviour, caching and API design all hinge on this distinction.',
      mistakes: ['Saying PATCH is always idempotent', 'Confusing idempotent with "returns the same response"', 'Thinking DELETE is not idempotent because the second call returns 404'],
      followUps: ['How would you make a payment POST safe to retry?', 'Can a GET ever have side effects in practice? (logging, counters — but nothing the client asked for)', 'Is a PATCH that sets a field idempotent? One that increments?'],
      modelAnswer: 'The idempotent methods are GET, HEAD, OPTIONS and TRACE, which are also safe, plus PUT and DELETE, which change data but give the same end state however many times you repeat them. POST isn’t idempotent, and PATCH isn’t guaranteed to be — setting a field is, incrementing a counter isn’t. Idempotency is about server state, not the response, so a second DELETE returning 404 is fine. It matters because clients can safely retry idempotent requests after a timeout; for POSTs like payments I’d add an idempotency key.',
    },
    {
      id: 'http-and-rest-status-choice',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Pick a status code for each and explain: (a) a new order was created; (b) the JSON body can’t be parsed; (c) no token was sent; (d) the user is logged in but tries to delete someone else’s order; (e) the client has sent 500 requests this minute; (f) the database is down.',
      answer: '(a) 201 Created with a Location header; (b) 400 Bad Request; (c) 401 Unauthorized; (d) 403 Forbidden (or 404 to avoid revealing the order exists); (e) 429 Too Many Requests with Retry-After; (f) 503 Service Unavailable (or 500 if it’s unexpected).',
      explanation: py`2xx success, 4xx the client must change something, 5xx the server failed and the client may retry later. 401 means "authenticate" (the name is historical), 403 means "authenticated but not permitted". Returning 404 instead of 403 is a deliberate choice when the existence of a resource is itself sensitive. Pair 429 and 503 with \`Retry-After\` so well-behaved clients back off.`,
      whyAsked: 'Correct status codes are what make an API usable by generic clients, monitoring and retry logic.',
      mistakes: ['Using 200 for everything with an error flag in the body', 'Mixing up 401 and 403', 'Returning 500 for invalid input'],
      followUps: ['When would you use 409 Conflict?', 'What’s the difference between 400 and 422?', 'Which of these should a client retry automatically?'],
      modelAnswer: 'A created order is 201 Created, with a Location header pointing at the new order. A body I can’t parse is 400 Bad Request. No token at all is 401 Unauthorized, which really means unauthenticated. Logged in but not allowed is 403 Forbidden — or a 404 if I don’t want to reveal that the order exists. Too many requests is 429 with a Retry-After header. A database outage is a server-side problem, so 503 Service Unavailable, also with Retry-After if I can estimate it. The rule of thumb is 4xx means the client must change something, 5xx means we failed and a retry later might work.',
    },
    {
      id: 'http-and-rest-url-design',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 6,
      question: 'Design the REST endpoints for a school library: books, members and loans. Members borrow and return books; staff need to list overdue loans.',
      answer: 'Resources: /v1/books, /v1/members, /v1/loans. CRUD with GET/POST/PUT/PATCH/DELETE on collections and /{id} members. Borrowing = POST /v1/loans {book_id, member_id} → 201 + Location. Returning = PATCH /v1/loans/{id} {returned_at} (or POST /v1/loans/{id}/return as an action). Overdue = GET /v1/loans?status=overdue&limit=50 with pagination. Member’s loans = GET /v1/members/{id}/loans.',
      explanation: py`Model the *things* (books, members, loans) as resources, and turn actions into resources where natural: "borrowing" creates a loan. Filters, sorting and paging belong in query strings. Version the API in the path. Keep nesting shallow (one level). Use 409 Conflict when a book is already on loan, 404 for unknown ids, 422 for invalid bodies.`,
      whyAsked: 'It shows whether you can map a domain to resources rather than RPC-style verbs, and whether you think about pagination, errors and versioning.',
      mistakes: ['Endpoints like /borrowBook or /getOverdueLoans', 'Deeply nested URLs like /members/1/loans/2/books/3', 'No pagination on list endpoints'],
      followUps: ['What status code when the book is already on loan?', 'How would a client find out a loan was created?', 'How would you support "return" being retried safely?'],
      modelAnswer: 'I’d model three resources: books, members and loans, under a /v1 prefix. Each gets the usual collection and item endpoints — GET and POST on /v1/books, GET, PUT, PATCH and DELETE on /v1/books/{id}. Borrowing is creating a loan: POST /v1/loans with the book and member ids returns 201 and a Location; if the book is already out I return 409 Conflict. Returning a book is a PATCH on the loan setting returned_at, which is naturally idempotent. Overdue loans are a filter, GET /v1/loans?status=overdue, paginated with a limit and a next link, and a member’s history is GET /v1/members/{id}/loans. That keeps verbs in the methods, filters in the query string and nesting to one level.',
    },
    {
      id: 'http-and-rest-build-url',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `build_url(base, path, params)` that joins a base URL and a path with exactly one `/` between them, and appends a correctly encoded query string from `params`: skip parameters whose value is `None`, expand list values into repeated parameters, and add no `?` when nothing is left.',
      answer: 'Strip the slashes at the join (base.rstrip("/") + "/" + path.lstrip("/")), drop None values, and use urlencode(params, doseq=True).',
      explanation: py`\`urlencode(..., doseq=True)\` handles escaping (\`&\`, spaces, non-ASCII) and repeated keys for lists. Filtering out \`None\` lets callers pass optional filters directly. Normalising the slash avoids both \`//books\` and \`v1books\`.`,
      starter: { files: { 'main.py': py`def build_url(base, path, params):
    # TODO: one slash between base and path, encoded query, skip None, expand lists
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{base}{path}?{query}"


print(build_url("https://api.example/v1/", "/books", {"author": "Le Guin", "page": None}))
` } },
      tests: [
        { name: 'joins with exactly one slash', code: py`assert build_url("https://api.example/v1/", "/books", {}) == "https://api.example/v1/books"
assert build_url("https://api.example/v1", "books", {}) == "https://api.example/v1/books"` },
        { name: 'encodes values', code: py`assert build_url("https://api.example", "search", {"q": "R&D café"}) == "https://api.example/search?q=R%26D+caf%C3%A9"` },
        { name: 'skips None and expands lists', code: py`url = build_url("https://api.example/v1", "/books", {"author": "Le Guin", "tag": ["sci-fi", "classic"], "page": None})
assert url == "https://api.example/v1/books?author=Le+Guin&tag=sci-fi&tag=classic"` },
      ],
      solution: { files: { 'main.py': py`from urllib.parse import urlencode


def build_url(base, path, params):
    url = base.rstrip("/") + "/" + path.lstrip("/")
    present = {k: v for k, v in params.items() if v is not None}
    query = urlencode(present, doseq=True)
    return f"{url}?{query}" if query else url


print(build_url("https://api.example/v1/", "/books", {"author": "Le Guin", "page": None}))
` } },
      hints: ['urlencode(params, doseq=True) turns a list value into repeated name=value pairs.', 'base.rstrip("/") + "/" + path.lstrip("/") guarantees exactly one slash.', 'Build the query first; only add "?" if it is non-empty.'],
      whyAsked: 'Hand-built URLs are a classic source of bugs and injection; this checks you reach for the standard library and handle edge cases.',
      mistakes: ['String concatenation without encoding', 'Forgetting doseq=True, which turns lists into their repr', 'Leaving a trailing ? when there are no parameters'],
      followUps: ['How would you encode a user-supplied path segment? (quote(segment, safe=""))', 'Why not use urljoin here? (it drops the last path segment of a base without a trailing slash)'],
      modelAnswer: 'I’d normalise the join by stripping the trailing slash from the base and the leading slash from the path, then joining with exactly one slash. For the query, I’d drop parameters whose value is None so callers can pass optional filters, and call urlencode with doseq=True, which escapes special characters like ampersands and accented letters and turns list values into repeated parameters. If the encoded query is empty I return the URL without a question mark. I avoid urljoin here because with a base like /v1 without a trailing slash it replaces the last segment instead of appending.',
    },
    {
      id: 'http-and-rest-cursor-pagination',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your `GET /v1/events?limit=50&offset=N` endpoint serves a live activity feed. Users report seeing the same event twice and missing others while scrolling, and deep pages are slow. Why, and what would you change?',
      answer: 'With offset pagination, new events inserted at the top shift every row down, so the next page repeats items (or skips them after deletions); and OFFSET N makes the database walk past N rows, which gets slower for deep pages. Switch to cursor (keyset) pagination: return an opaque cursor encoding the last item’s sort key (e.g. created_at + id) and query WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 50, backed by an index on those columns.',
      explanation: py`Keyset pagination asks for "the 50 items after this one" instead of "items 1000–1050", so inserts don't shift pages and the index lets the database jump straight to the position. The cursor is usually base64-encoded JSON so clients treat it as opaque and you can change its contents later. Trade-offs: no "jump to page 37", and the sort key must be unique (add the id as a tie-breaker).`,
      whyAsked: 'Pagination at scale is a common real-world design problem combining API design and database performance.',
      mistakes: ['Blaming caching', 'Using a non-unique sort key such as created_at alone as the cursor', 'Exposing raw database ids/offsets as a cursor format clients depend on'],
      followUps: ['How would you support going backwards?', 'What index does the keyset query need?', 'How would you return the cursor — body or Link header?'],
      modelAnswer: 'Offset pagination breaks on a live feed because new events push everything down, so the item that was 50th is now 51st and shows up again on the next page; deletions do the opposite and make users miss items. It’s also slow for deep pages because the database still has to step over all the skipped rows. I’d switch to cursor pagination: each response includes an opaque next cursor encoding the sort key of the last item, say created_at plus id as a tie-breaker, and the next query asks for rows strictly after that key with a limit, using an index on those columns. Pages stay stable under inserts and every page is equally fast; the trade-off is that clients can’t jump to an arbitrary page number.',
    },
    {
      id: 'http-and-rest-conditional-requests',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What are ETags, and how do they enable both caching and safe concurrent updates?',
      answer: 'An ETag is a version identifier the server sends with a resource. For caching, the client sends If-None-Match: <etag>; if unchanged, the server replies 304 Not Modified with no body. For updates, the client sends If-Match: <etag> with its PUT/PATCH; if someone else changed the resource since, the server replies 412 Precondition Failed instead of overwriting — optimistic concurrency control.',
      explanation: py`ETags can be hashes of the representation or version numbers. Weak ETags (\`W/"..."\`) mean "semantically equivalent". \`304\` saves bandwidth and server work; \`If-Match\` prevents the HTTP-level lost update, where two clients read version 7 and the second PUT silently overwrites the first.`,
      whyAsked: 'It tests deeper HTTP knowledge that matters for performance and data integrity in real APIs.',
      mistakes: ['Thinking ETags are only for browsers', 'Confusing 304 with a redirect', 'Not knowing about If-Match / 412'],
      followUps: ['How would you generate ETags cheaply?', 'How does Cache-Control: max-age interact with ETags?', 'What does a client do after a 412?'],
      modelAnswer: 'An ETag is a version tag the server attaches to a response, like a hash of the content or a version number. For caching, the client stores it and sends it back in If-None-Match; if the resource hasn’t changed, the server answers 304 Not Modified with no body, which saves bandwidth. For writes, the client sends If-Match with the ETag it last saw; if the resource changed in the meantime, the server refuses with 412 Precondition Failed instead of overwriting someone else’s edit. That’s optimistic locking at the HTTP level, and the client then refetches, merges and retries.',
    },
  ],

  takeaways: [
    'A request = method + target (path and query) + headers + optional body; a response = status code + headers + optional body.',
    'The method is the verb: GET reads, POST creates, PUT replaces, PATCH changes part, DELETE removes. Safe methods change nothing; idempotent ones can be repeated with the same effect.',
    'Status families: 2xx success, 3xx redirect, 4xx the client must change something, 5xx the server failed. Use http.HTTPStatus for readable names.',
    'REST: resources are nouns with URLs (/books/4), collections are plural, filters and paging go in the query string, the API is versioned.',
    'Send JSON with json.dumps and Content-Type: application/json; read it with json.loads.',
    'Build and parse URLs with urllib.parse (urlencode, parse_qs, urlsplit, quote) — never with string concatenation.',
  ],
}
