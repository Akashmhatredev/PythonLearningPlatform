// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const FAKE_NETWORK_PY = py`"""A pretend network for the playground. SIMULATION: nothing leaves your browser.

FakeTransport.send() does the job requests.get() or an httpx transport does:
take a method, URL, headers and timeout; return a response or raise an error.
"""
import json


class FakeResponse:
    def __init__(self, status, body="", headers=None):
        self.status = status
        self.body = body
        self.headers = {"Content-Type": "application/json", **(headers or {})}


def json_response(status, data, headers=None):
    return FakeResponse(status, json.dumps(data), headers)


class FakeTransport:
    """Replays scripted outcomes in order: each is a FakeResponse or an exception."""

    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.sent = []                          # what the client asked us to send

    def send(self, method, url, headers, timeout):
        self.sent.append({"method": method, "url": url,
                          "headers": dict(headers), "timeout": timeout})
        if not self.outcomes:
            raise ConnectionError("fake network: nothing more scripted")
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome
`

const CLIENT_PY = py`"""A careful JSON API client: timeouts, retries with backoff, safe JSON parsing.

Simplified for teaching: in production you would use requests or httpx
(see the lesson) and give them the same settings.
"""
import json
import logging
import random
import time
from urllib.parse import urlencode

log = logging.getLogger("weather")

RETRYABLE_STATUS = {429, 502, 503, 504}
IDEMPOTENT = {"GET", "HEAD", "OPTIONS", "PUT", "DELETE"}


class ApiError(Exception):
    """The call failed, or the answer wasn't something we can use."""


def backoff_delay(attempt, base=0.5, cap=8.0):
    """Exponential backoff with jitter: about 0.5s, 1s, 2s, 4s ... never above cap."""
    ceiling = min(cap, base * 2 ** (attempt - 1))
    return round(random.uniform(ceiling / 2, ceiling), 2)


class WeatherClient:
    def __init__(self, transport, token, base_url="https://api.weather.example/v1",
                 timeout=5.0, max_attempts=3, sleep=time.sleep):
        self.transport = transport
        self.token = token
        self.base_url = base_url
        self.timeout = timeout              # never wait forever
        self.max_attempts = max_attempts
        self.sleep = sleep                  # injectable, so tests don't really wait

    def _headers(self):
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.token}",
        }

    def _send(self, method, url):
        attempts = self.max_attempts if method in IDEMPOTENT else 1
        for attempt in range(1, attempts + 1):
            headers = self._headers()
            log.info("%s %s headers=%s", method, url, headers)
            try:
                response = self.transport.send(method, url, headers, timeout=self.timeout)
            except (TimeoutError, ConnectionError) as exc:
                problem = f"{type(exc).__name__}: {exc}"
            else:
                if response.status not in RETRYABLE_STATUS:
                    return response
                problem = f"HTTP {response.status}"
            if attempt == attempts:
                raise ApiError(f"{method} {url} failed after {attempt} attempt(s): {problem}")
            delay = backoff_delay(attempt)
            log.warning("attempt %d failed (%s), retrying in %ss", attempt, problem, delay)
            self.sleep(delay)

    def get_json(self, path, **params):
        url = f"{self.base_url}/{path.lstrip('/')}"
        if params:
            url += "?" + urlencode(params)
        response = self._send("GET", url)
        if not 200 <= response.status < 300:
            raise ApiError(f"HTTP {response.status}: {response.body[:80]}")
        content_type = response.headers.get("Content-Type", "")
        if not content_type.startswith("application/json"):
            raise ApiError(f"expected JSON, got {content_type or 'no Content-Type'}")
        try:
            return json.loads(response.body)
        except json.JSONDecodeError as exc:
            raise ApiError(f"invalid JSON from server: {exc}") from exc

    def forecast(self, city):
        data = self.get_json("forecast", city=city)
        return {"city": data["city"], "high": max(data["temperatures"])}
`

const MAIN_PY = py`import logging
import random
import sys

from fake_network import FakeResponse, FakeTransport, json_response
from weather_client import ApiError, WeatherClient

logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(message)s", stream=sys.stdout)
random.seed(7)                              # the same jitter every run, for the lesson

TOKEN = "sk_live_9f8e7d6c5b4a"              # real code: os.environ["WEATHER_TOKEN"]
waits = []                                  # the playground records waits instead of sleeping

print("== 1. A flaky server: 503, then a timeout, then success ==")
transport = FakeTransport([
    FakeResponse(503, '{"error": "busy"}', {"Retry-After": "2"}),
    TimeoutError("read timed out"),
    json_response(200, {"city": "Oslo", "temperatures": [3.5, 6.0, 2.5]}),
])
client = WeatherClient(transport, TOKEN, sleep=waits.append)
print("result:", client.forecast("Oslo"))
print("attempts:", len(transport.sent), "| waits:", waits, "| timeout:", transport.sent[0]["timeout"])

print("\n== 2. A 404 is the caller's problem: no retry ==")
client = WeatherClient(FakeTransport([json_response(404, {"error": "unknown city"})]), TOKEN)
try:
    client.forecast("Atlantis")
except ApiError as exc:
    print("ApiError:", exc)

print("\n== 3. A 200 that isn't JSON (a proxy's error page) ==")
html = FakeResponse(200, "<html>Down for maintenance</html>", {"Content-Type": "text/html"})
client = WeatherClient(FakeTransport([html]), TOKEN)
try:
    client.forecast("Oslo")
except ApiError as exc:
    print("ApiError:", exc)
`

export default {
  id: 'http-clients',
  title: 'Making HTTP requests: urllib, requests & httpx',
  summary: 'Call web APIs from Python without hanging, leaking secrets or crashing on bad data: timeouts on every call, retries with backoff for the right failures, auth headers, and careful JSON parsing.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['http-and-rest', 'try-except', 'json-data'],
  related: ['http-and-rest', 'building-apis', 'error-handling-patterns', 'custom-exceptions', 'logging', 'mocking', 'asyncio-in-practice', 'secrets-and-passwords', 'input-validation', 'pip-and-dependencies'],
  tags: ['http client', 'requests', 'httpx', 'urllib', 'urllib.request', 'urlopen', 'timeout', 'retry', 'backoff', 'exponential backoff', 'jitter', 'retry-after', 'raise_for_status', 'session', 'connection pooling', 'asyncclient', 'authorization', 'bearer token', 'api key', 'redact', 'json', 'jsondecodeerror', 'mocktransport', 'fake'],
  apis: [
    { name: 'urllib.request.urlopen(req, timeout=...)', summary: 'Standard-library HTTP client; raises HTTPError for 4xx/5xx and URLError when the server can’t be reached.' },
    { name: 'urllib.request.Request(url, data=, headers=, method=)', summary: 'Builds a request with custom headers, a body (bytes) and a method.' },
    { name: 'requests.get(url, params=, headers=, timeout=)', summary: 'The popular third-party client. No default timeout — always pass one.' },
    { name: 'requests.post(url, json=...)', summary: 'json= serialises the body and sets Content-Type: application/json.' },
    { name: 'Response.raise_for_status()', summary: 'requests/httpx: raise an exception if the status is 4xx or 5xx.' },
    { name: 'Response.json()', summary: 'Decode the body as JSON (raises if it isn’t JSON).' },
    { name: 'requests.Session()', summary: 'Reuses connections and shares headers/settings across requests.' },
    { name: 'httpx.Client / httpx.AsyncClient', summary: 'requests-like API with sync and async clients; 5-second default timeout.' },
    { name: 'httpx.MockTransport(handler)', summary: 'Replace the network with a function in tests.' },
    { name: 'urllib.parse.urlencode(params)', summary: 'Encode query parameters safely.' },
  ],
  docs: [
    { label: 'urllib.request — open URLs', url: 'https://docs.python.org/3/library/urllib.request.html' },
    { label: 'HOWTO fetch internet resources using urllib', url: 'https://docs.python.org/3/howto/urllib2.html' },
    { label: 'Requests — quickstart (timeouts, errors)', url: 'https://requests.readthedocs.io/en/latest/user/quickstart/' },
    { label: 'Requests — advanced usage (sessions, adapters)', url: 'https://requests.readthedocs.io/en/latest/user/advanced/' },
    { label: 'HTTPX — documentation', url: 'https://www.python-httpx.org/' },
    { label: 'HTTPX — timeouts', url: 'https://www.python-httpx.org/advanced/timeouts/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`An **HTTP client** is the code that *sends* requests and reads responses — the role your browser plays when you visit a website. In Python you'll meet three:`,
    py`- **\`urllib.request\`** — in the standard library, always available, a little clunky;
- **requests** — the long-time favourite third-party library, simple and synchronous;
- **httpx** — a newer third-party library with a requests-like API, plus **async** support.`,
    py`Sending a request is one line in any of them. The real skill is everything around that line: what happens when the server is slow, down, rate-limiting you, returning an HTML error page instead of JSON, or when your log files quietly collect everyone's API tokens. This lesson is about that skill.`,
    { callout: 'note', title: 'About the playground', text: py`The browser sandbox has no network, and requests/httpx aren't installed. Their code below is shown as static examples with their real APIs. The runnable playground uses a **simulated** network — a fake transport with scripted responses — which is also exactly how professionals test HTTP clients.` },
  ],
  why: [
    py`Networks fail all the time, in ways your laptop rarely shows you: DNS hiccups, dropped connections, overloaded servers, deploys in progress. A client with no timeout can freeze a whole program forever. A client that retries everything can turn one hiccup into a stampede — or charge a customer twice.`,
    py`APIs also lie, or at least surprise you: a \`200 OK\` whose body is an HTML maintenance page, a field that's sometimes missing, a number that arrives as a string. Code that trusts every response crashes with \`KeyError\` at 3 a.m.`,
    py`And tokens are passwords. One \`print(headers)\` in a log that's shipped to a monitoring service can leak production credentials to everyone who can read logs.`,
  ],
  eli15: [
    py`Calling an API is like phoning a pizza place.`,
    py`**Timeout:** if nobody picks up after a while, you hang up — you don't sit on hold until tomorrow.`,
    py`**Retry with backoff:** if the line is busy, you call again in a minute, then in two, then in four — not 50 times a second. But if they said "we don't deliver to your street" (a 404-style answer), calling again won't change anything.`,
    py`**Not retrying everything:** if the call dropped right after you ordered, calling back and ordering *again* might get you two pizzas. Asking "what's on the menu?" again is harmless.`,
    py`**Secrets:** you tell them your card number, but you don't write it on the shared family notepad (your logs).`,
  ],
  analogy: {
    title: 'Ordering from a busy takeaway by phone',
    body: [
      py`A sensible customer sets a limit on how long they'll wait on hold, calls back later (and a bit later each time) when the line is busy, never re-orders blindly after a dropped call, checks that what arrives is actually pizza before eating it, and doesn't read their card number aloud on speakerphone.`,
    ],
    mapping: [
      ['hanging up after a minute on hold', 'a timeout on every request'],
      ['calling back in 1, 2, then 4 minutes', 'exponential backoff between retries'],
      ['not everyone calling back at exactly the same moment', 'jitter: a little randomness in the delay'],
      ['"line busy" vs "we don\'t deliver there"', 'retryable (503, timeouts) vs permanent (404, 400) failures'],
      ['re-ordering after a dropped call → two pizzas', 'retrying a non-idempotent POST'],
      ['checking the box really contains pizza', 'checking status, Content-Type and JSON shape'],
      ['reading your card number out on speakerphone', 'logging Authorization headers'],
      ['keeping the line open for your next order', 'a Session/Client reusing connections'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'A retry policy, decision by decision',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'send', label: 'send request', note: 'with a timeout', x: 100, y: 160, tone: 'yellow' },
        { id: 'ok', label: '2xx / 3xx', note: 'return it', x: 330, y: 45, tone: 'blue' },
        { id: 'perm', label: '400 · 401 · 404 · 422', note: 'don’t retry: fix the request', x: 330, y: 160, tone: 'red' },
        { id: 'temp', label: 'timeout · connection error · 429 · 503', note: 'maybe temporary', x: 330, y: 275, tone: 'kraft' },
        { id: 'check', label: 'idempotent & attempts left?', note: 'GET/PUT/DELETE, or an idempotency key', x: 580, y: 275 },
        { id: 'wait', label: 'wait: backoff + jitter', note: 'or Retry-After', x: 580, y: 120, tone: 'ink' },
        { id: 'fail', label: 'give up: raise', note: 'with a clear error', x: 690, y: 30, tone: 'red' },
      ],
      edges: [
        { from: 'send', to: 'ok' },
        { from: 'send', to: 'perm' },
        { from: 'send', to: 'temp' },
        { from: 'temp', to: 'check' },
        { from: 'check', to: 'wait', label: 'yes' },
        { from: 'wait', to: 'send', label: 'try again', dashed: true },
        { from: 'check', to: 'fail', label: 'no' },
      ],
      steps: [
        { focus: ['send'], text: py`Every attempt has a **timeout**. Without one, a server that never answers blocks your program forever — and \`requests\` has **no default timeout**.` },
        { focus: ['ok'], edges: ['send->ok'], text: py`Success: return the response (then check its body — see later).` },
        { focus: ['perm'], edges: ['send->perm'], text: py`**Permanent** failures: the request itself is wrong (\`400\`, \`422\`), you're not allowed (\`401\`, \`403\`), or the thing doesn't exist (\`404\`). Sending the same request again gives the same answer, so raise immediately.` },
        { focus: ['temp'], edges: ['send->temp'], text: py`**Possibly temporary**: timeouts, dropped connections, \`429 Too Many Requests\`, \`502\`/\`503\`/\`504\`. Waiting may help.` },
        { focus: ['check'], edges: ['temp->check'], text: py`But only retry if repeating is **safe** (an idempotent method, or a POST with an idempotency key) and you have **attempts left**. A timed-out POST may already have succeeded on the server.` },
        { focus: ['wait', 'send'], edges: ['check->wait', 'wait->send'], text: py`Wait before the next attempt: **exponential backoff** (0.5 s, 1 s, 2 s…) with **jitter** (randomness, so thousands of clients don't retry in lock-step), or exactly what the server's \`Retry-After\` header says.` },
        { focus: ['fail'], edges: ['check->fail'], text: py`Out of attempts? Raise a clear error that says what failed and how many times — never loop forever.` },
      ],
    },
    alt: 'A decision diagram. "send request (with a timeout)" leads to three outcomes: 2xx/3xx returns the response; 400, 401, 404, 422 are permanent and are not retried; timeouts, connection errors, 429 and 503 are maybe temporary and lead to a check "idempotent and attempts left?". If yes, wait with backoff plus jitter or Retry-After, then send again. If no, give up and raise a clear error.',
    caption: py`Retries are a policy decision, not a reflex: *what* failed, *which* method, *how many* times, and *how long* to wait.`,
  },
  syntax: [
    py`#### urllib.request (standard library)`,
    { code: py`import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

url = "https://api.example.com/v1/books?" + urlencode({"author": "Le Guin"})
request = Request(url, headers={"Accept": "application/json", "User-Agent": "bookshelf/1.0"})
try:
    with urlopen(request, timeout=10) as response:      # always pass timeout=
        print(response.status)                          # 200
        books = json.load(response)                     # read + decode the body
except HTTPError as exc:                                # 4xx/5xx (catch before URLError)
    print("server said", exc.code, exc.reason)
except URLError as exc:                                 # DNS failure, refused connection...
    print("could not reach the server:", exc.reason)

# POST JSON: the body must be bytes, and you set the headers yourself
payload = json.dumps({"title": "Kindred"}).encode("utf-8")
request = Request("https://api.example.com/v1/books", data=payload, method="POST",
                  headers={"Content-Type": "application/json"})`, lang: 'python', title: 'urllib.request — no install needed (static: no network here)', static: true },
    py`It works everywhere Python does, which makes it handy for small scripts with no dependencies. The ergonomics are rough: bodies are bytes, \`HTTPError\` is raised for every 4xx/5xx, and there's no built-in retry or JSON helper.`,
    py`#### requests`,
    { code: py`import requests   # pip install requests

response = requests.get(
    "https://api.example.com/v1/books",
    params={"author": "Le Guin", "limit": 20},     # encoded into the query string for you
    headers={"Accept": "application/json"},
    timeout=(3.05, 10),                            # (connect, read) seconds — never omit
)
response.raise_for_status()                        # requests.HTTPError for 4xx/5xx
books = response.json()                            # parsed JSON
print(response.status_code, response.headers["content-type"])   # header names: case-insensitive

created = requests.post(
    "https://api.example.com/v1/books",
    json={"title": "Kindred", "author": "Octavia E. Butler"},   # serialises + sets Content-Type
    timeout=10,
)
print(created.status_code, created.headers.get("Location"))`, lang: 'python', title: 'requests — get, post, params, json=, timeout=, raise_for_status', static: true },
    { code: py`import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

session = requests.Session()                           # reuses TCP/TLS connections
session.headers.update({"Authorization": f"Bearer {token}", "User-Agent": "bookshelf/1.0"})
retries = Retry(
    total=3,
    backoff_factor=0.5,                                # exponential backoff between attempts
    status_forcelist=[429, 502, 503, 504],             # retry these statuses...
    allowed_methods=["GET", "HEAD", "PUT", "DELETE"],  # ...only for idempotent methods
)
session.mount("https://", HTTPAdapter(max_retries=retries))

try:
    response = session.get("https://api.example.com/v1/books", timeout=10)
    response.raise_for_status()
except requests.exceptions.Timeout:
    ...                                                # took too long
except requests.exceptions.HTTPError as exc:
    ...                                                # exc.response.status_code
except requests.exceptions.RequestException:
    ...                                                # base class: connection errors, etc.`, lang: 'python', title: 'requests — a Session with retries (urllib3 Retry)', static: true },
    py`#### httpx`,
    { code: py`import httpx   # pip install httpx

with httpx.Client(
    base_url="https://api.example.com/v1",
    headers={"Authorization": f"Bearer {token}"},
    timeout=httpx.Timeout(10.0, connect=3.0),      # httpx defaults to 5 s if you don't say
) as client:
    response = client.get("/books", params={"author": "Le Guin"})
    response.raise_for_status()                    # httpx.HTTPStatusError for 4xx/5xx
    books = response.json()`, lang: 'python', title: 'httpx — a Client with base_url and timeouts', static: true },
    { code: py`import asyncio
import httpx


async def fetch_forecasts(cities):
    async with httpx.AsyncClient(base_url="https://api.weather.example/v1", timeout=10.0) as client:
        responses = await asyncio.gather(
            *(client.get("/forecast", params={"city": city}) for city in cities)
        )
    for response in responses:
        response.raise_for_status()
    return [response.json() for response in responses]


forecasts = asyncio.run(fetch_forecasts(["Oslo", "Lima", "Pune"]))`, lang: 'python', title: 'httpx.AsyncClient — many requests at once with asyncio', static: true },
    py`With async, the three requests wait for the network *at the same time* instead of one after another — see [asyncio in practice](lesson:asyncio-in-practice) for limiting how many run at once and cancelling slow ones.`,
    py`#### Timeouts: always`,
    py`- **requests has no default timeout.** \`requests.get(url)\` can wait forever if the server accepts the connection and never answers. Pass \`timeout=\` on every call (a number, or \`(connect, read)\`).
- **httpx** defaults to 5 seconds and raises \`httpx.TimeoutException\`. Set it explicitly anyway, so the value is a decision rather than an accident.
- **urllib** uses the global socket default — which is "no timeout" unless something changed it. Pass \`timeout=\`.
- A *read* timeout limits the wait **between bytes**, not the total time. For a hard overall deadline, wrap the work in [\`asyncio.timeout()\`](lesson:asyncio-in-practice) (3.11+) or check elapsed time yourself.`,
    py`#### Auth headers, without leaking them`,
    { code: py`import os

token = os.environ["WEATHER_TOKEN"]                    # from the environment, not the code
headers = {"Authorization": f"Bearer {token}"}         # most APIs: bearer tokens


def redact(headers):
    """A copy that is safe to log."""
    hidden = {"authorization", "cookie", "x-api-key"}
    return {k: ("***" if k.lower() in hidden else v) for k, v in headers.items()}`, lang: 'python', title: 'tokens come from the environment and never reach the logs', static: true },
    py`Basic auth (username + password) is \`auth=("user", "secret")\` in both requests and httpx. Keep tokens out of URLs too: query strings end up in server logs, proxies and browser history.`,
    py`#### Parsing JSON safely`,
    py`1. Check the **status** (\`raise_for_status()\` or your own check) before reading the body.
2. Check the **Content-Type** is JSON — a \`200\` from a proxy or captive portal can be HTML.
3. Catch **decode errors**: \`json.JSONDecodeError\` (requests raises \`requests.exceptions.JSONDecodeError\`, httpx a \`json.JSONDecodeError\`).
4. Check the **shape**: required keys present, the right types, sensible ranges. Use \`data.get("optional", default)\` for optional fields. For bigger APIs, a validation library (e.g. pydantic) does this declaratively — see [input validation](lesson:input-validation).`,
  ],
  walkthrough: {
    title: 'Reading the careful client',
    lang: 'python',
    code: CLIENT_PY,
    intro: py`This is **weather_client.py** from the playground — the important file. **main.py** just scripts some network trouble and calls it.`,
    steps: [
      { lines: [14, 15], text: py`Two policy decisions written down as data: which **statuses** are worth retrying (rate limiting and gateway/availability errors — not \`404\` or \`400\`), and which **methods** are safe to repeat.` },
      { lines: [22, 25], text: py`**Backoff with jitter.** The ceiling doubles each attempt (0.5, 1, 2…) up to \`cap\`; the actual wait is a random value between half the ceiling and the ceiling, so many clients that failed together don't retry together.` },
      { lines: [29, 36], text: py`Every dependency is **injected**: the transport (real network or fake), the token, the timeout and even \`sleep\`. That's what makes this client testable without a network or real waiting.` },
      { lines: [44, 46], text: py`Non-idempotent methods get exactly **one** attempt — a POST that timed out may have worked on the server.` },
      { lines: [47, 48], text: py`⚠ This log line prints the **whole** headers dict, bearer token included. Look at the playground output — the first experiment fixes it.` },
      { lines: [49, 56], text: py`\`try / except / else\`: network exceptions and retryable statuses become a \`problem\` description; anything else is returned straight away (including \`404\`, which isn't ours to retry).` },
      { lines: [57, 61], text: py`Out of attempts → raise a clear \`ApiError\` naming the URL, the attempt count and the last problem. Otherwise log a warning, wait, and loop.` },
      { lines: [63, 76], text: py`\`get_json\` builds the URL with \`urlencode\`, then checks **status**, **Content-Type** and **JSON validity**, turning each failure into an \`ApiError\` with \`raise ... from exc\` so the original cause stays attached.` },
      { lines: [78, 80], text: py`⚠ \`forecast\` trusts the JSON's **shape**: a missing key or a non-list crashes with \`KeyError\`/\`TypeError\`. Another experiment.` },
    ],
  },
  playground: {
    title: 'A careful weather client against a flaky (simulated) network',
    objective: 'Watch retries and safe parsing work, then fix a token leak, honour Retry-After, validate the JSON shape and see the client give up.',
    files: { 'main.py': MAIN_PY, 'weather_client.py': CLIENT_PY, 'fake_network.py': FAKE_NETWORK_PY },
    expected: py`\`\`\`text
== 1. A flaky server: 503, then a timeout, then success ==
INFO    GET https://api.weather.example/v1/forecast?city=Oslo headers={'Accept': 'application/json', 'Authorization': 'Bearer sk_live_9f8e7d6c5b4a'}
WARNING attempt 1 failed (HTTP 503), retrying in 0.33s
INFO    GET ...
WARNING attempt 2 failed (TimeoutError: read timed out), retrying in 0.58s
INFO    GET ...
result: {'city': 'Oslo', 'high': 6.0}
attempts: 3 | waits: [0.33, 0.58] | timeout: 5.0

== 2. A 404 is the caller's problem: no retry ==
INFO    GET https://api.weather.example/v1/forecast?city=Atlantis headers={...}
ApiError: HTTP 404: {"error": "unknown city"}

== 3. A 200 that isn't JSON (a proxy's error page) ==
INFO    GET ...
ApiError: expected JSON, got text/html
\`\`\`

Two problems hide in that output: the **full token** is in the logs, and the server asked for \`Retry-After: 2\` but the client waited 0.33 s.`,
    experiments: [
      {
        id: 'redact-token',
        task: py`Stop leaking the token. In **weather_client.py**, write \`redact(headers)\` that returns a **copy** with the \`Authorization\` value replaced by \`"***"\` (match the header name case-insensitively), and log \`redact(headers)\` instead of \`headers\`. The real request must still carry the real token.`,
        hint: py`\`return {k: ("***" if k.lower() == "authorization" else v) for k, v in headers.items()}\` — and change only the \`log.info(...)\` line, not what's passed to \`transport.send\`.`,
        tests: [
          { name: 'the token no longer appears in the output', code: py`assert TOKEN not in output, 'The token is still printed somewhere'` },
          { name: 'the header is still logged, redacted', code: py`assert "'Authorization': '***'" in output` },
          { name: 'requests still send the real token', code: py`assert transport.sent[0]["headers"]["Authorization"] == f"Bearer {TOKEN}"` },
        ],
        explain: py`Redact at the point of logging, on a copy — never mutate the headers you're about to send. Logs are copied to files, monitoring services and screenshots in bug reports; treat them as public. Many teams also add a logging filter that redacts known secret patterns as a safety net.`,
      },
      {
        id: 'honour-retry-after',
        task: py`When a retryable response has a \`Retry-After\` header containing whole seconds, wait **that** long instead of the backoff delay — but never more than 30 seconds. Section 1 should then report \`waits: [2, ...]\`.`,
        hint: py`Keep the response around: in the \`else:\` branch set \`retry_after = response.headers.get("Retry-After")\` (and \`retry_after = None\` in the \`except\`). Then \`delay = min(30, int(retry_after)) if retry_after and retry_after.isdigit() else backoff_delay(attempt)\`.`,
        tests: [
          { name: 'the first wait is the server’s 2 seconds', code: py`assert waits[0] == 2, waits` },
          { name: 'huge Retry-After values are capped at 30', code: py`slept = []
t = FakeTransport([FakeResponse(503, "", {"Retry-After": "3600"}), json_response(200, {"city": "X", "temperatures": [1]})])
WeatherClient(t, "tok", sleep=slept.append).forecast("X")
assert slept == [30], slept` },
          { name: 'timeouts still use backoff', code: py`slept = []
t = FakeTransport([TimeoutError("slow"), json_response(200, {"city": "X", "temperatures": [1]})])
WeatherClient(t, "tok", sleep=slept.append).forecast("X")
assert len(slept) == 1 and 0 < slept[0] <= 0.5, slept` },
        ],
        explain: py`\`Retry-After\` is the server telling you exactly when it can cope again — usually with \`429\` or \`503\`. Respecting it gets you served sooner and keeps you off block lists. Capping it protects you from a misconfigured server asking you to sleep for an hour. (It may also be an HTTP date; this simplified version only handles seconds.)`,
      },
      {
        id: 'validate-shape',
        task: py`Make \`forecast\` raise \`ApiError\` (not \`KeyError\`/\`TypeError\`/\`ValueError\`) when the JSON is the wrong shape: \`city\` missing, or \`temperatures\` missing, empty, or not a list of numbers.`,
        hint: py`\`temps = data.get("temperatures")\`, then \`if "city" not in data or not isinstance(temps, list) or not temps or not all(isinstance(t, (int, float)) for t in temps): raise ApiError(...)\`.`,
        tests: [
          { name: 'missing temperatures', code: py`c = WeatherClient(FakeTransport([json_response(200, {"city": "Oslo"})]), "tok")
with raises(ApiError):
    c.forecast("Oslo")` },
          { name: 'temperatures that are not numbers', code: py`c = WeatherClient(FakeTransport([json_response(200, {"city": "Oslo", "temperatures": ["warm"]})]), "tok")
with raises(ApiError):
    c.forecast("Oslo")` },
          { name: 'an empty list', code: py`c = WeatherClient(FakeTransport([json_response(200, {"city": "Oslo", "temperatures": []})]), "tok")
with raises(ApiError):
    c.forecast("Oslo")` },
          { name: 'good data still works', code: py`c = WeatherClient(FakeTransport([json_response(200, {"city": "Oslo", "temperatures": [1, 7.5]})]), "tok")
assert c.forecast("Oslo") == {"city": "Oslo", "high": 7.5}` },
        ],
        explain: py`Valid JSON isn't the same as *the data you expected*. Checking the shape at the edge of your program turns a confusing crash deep inside your code into one clear error that names the API — and keeps bad data from spreading. (\`bool\` is a subclass of \`int\`, so a fully strict check would also exclude \`True\`/\`False\`.)`,
      },
      {
        id: 'give-up',
        task: py`Add a section 4 to **main.py**: a client whose transport fails three times with \`ConnectionError("connection refused")\`. Catch the \`ApiError\` and print it. Predict the message first.`,
        hint: py`\`FakeTransport([ConnectionError("connection refused")] * 3)\`, \`WeatherClient(that_transport, TOKEN, sleep=waits.append)\`, then \`try: client.forecast("Oslo")\` / \`except ApiError as exc: print("ApiError:", exc)\`.`,
        tests: [
          { name: 'the client gave up after 3 attempts', code: py`assert "failed after 3 attempt(s): ConnectionError: connection refused" in output` },
        ],
        explain: py`A bounded number of attempts means a dead server costs you a few seconds, not forever. The final error says what was tried, how often and what went wrong last — exactly what you need when reading logs later.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch a retry loop recover',
    props: {
      code: py`class FlakyServer:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)

    def get(self, path):
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


def get_with_retries(server, path, attempts=3):
    for attempt in range(1, attempts + 1):
        try:
            status = server.get(path)
        except TimeoutError:
            status = "timeout"
        if status not in ("timeout", 503):
            return status
        print(f"attempt {attempt}: {status}, wait {0.5 * 2 ** (attempt - 1)}s")
    raise RuntimeError(f"gave up after {attempts} attempts")


server = FlakyServer([503, TimeoutError("slow"), 200])
print("final status:", get_with_retries(server, "/forecast"))
`,
      notes: {
        6: 'The fake server hands out its scripted outcomes one per call — this is the simulation.',
        8: 'Some outcomes are exceptions: a timeout is *raised*, not returned.',
        13: 'At most `attempts` tries — the loop can never run forever.',
        16: 'The timeout is caught and turned into a value we can reason about.',
        18: '`200` (or a `404`) isn’t retryable: return it immediately.',
        20: 'Retryable: report and back off — 0.5 s, then 1.0 s (the doubling is the "exponential" part).',
        21: 'Only reached if every attempt failed.',
      },
    },
    alt: 'A step-by-step trace of a retry loop calling a fake flaky server. Attempt 1 returns 503 and prints "attempt 1: 503, wait 0.5s". Attempt 2 raises TimeoutError, which is caught and printed as "attempt 2: timeout, wait 1.0s". Attempt 3 returns 200, which is returned, and the program prints "final status: 200".',
    caption: py`Simplified: the real client in the playground also adds jitter, checks the method and actually waits.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`#### What a library does when you call \`requests.get\``,
      py`1. Builds the URL (encoding \`params\`) and the headers.
2. Looks up the host name (DNS) and opens a TCP connection — or reuses one from a pool, if you're using a Session/Client.
3. For \`https\`, performs the TLS handshake and **verifies the certificate** (so you know you're talking to the real server).
4. Writes the request, then reads the status line and headers.
5. Reads the body (all at once by default, or bit by bit with streaming).
6. Hands you a \`Response\` object. It does **not** raise for \`404\` or \`500\` unless you call \`raise_for_status()\` — those are perfectly valid HTTP responses.`,
      py`Steps 2 and 4–5 are where timeouts apply: a *connect* timeout limits step 2, a *read* timeout limits each wait for data in steps 4–5.`,
    ],
    technical: [
      py`#### Why sessions and clients are faster`,
      py`Opening a connection costs at least one network round trip for TCP plus more for TLS. A \`requests.Session\` or \`httpx.Client\` keeps a **connection pool**: after the first request to a host, later ones reuse the open connection (HTTP keep-alive). Module-level \`requests.get()\` creates a throwaway session every call. For more than a handful of requests to the same host, create one Session/Client and reuse it — and close it (\`with\` block) when done.`,
      py`#### Exception hierarchies`,
      py`| failure | urllib | requests | httpx |
|---|---|---|---|
| can't connect / DNS | \`URLError\` | \`ConnectionError\` | \`ConnectError\` |
| too slow | \`TimeoutError\` (may be wrapped in \`URLError\`) | \`Timeout\` (\`ConnectTimeout\`, \`ReadTimeout\`) | \`TimeoutException\` |
| 4xx / 5xx status | \`HTTPError\` (raised automatically) | \`HTTPError\` (only from \`raise_for_status()\`) | \`HTTPStatusError\` (only from \`raise_for_status()\`) |
| base class | \`URLError\` (an \`OSError\`) | \`RequestException\` | \`HTTPError\` / \`RequestError\` for transport problems |`,
      py`Watch the names: requests' \`ConnectionError\` is its **own** class that only shares a name with the built-in \`ConnectionError\`, so catch it as \`requests.exceptions.ConnectionError\`. Likewise \`httpx.HTTPError\` is unrelated to \`urllib.error.HTTPError\`.`,
      py`#### Backoff, jitter and Retry-After`,
      py`Exponential backoff spaces attempts out (0.5, 1, 2, 4… seconds) so a struggling server gets breathing room. Without jitter, every client that failed at the same moment retries at the same moment — a *thundering herd* that can knock the server over again. "Full jitter" picks a random delay between 0 and the ceiling; the playground uses "equal jitter" (between half and the full ceiling). \`Retry-After\` overrides both: it's either a number of seconds or an HTTP date.`,
      py`#### Idempotency keys`,
      py`A POST that timed out is ambiguous: the server may have processed it. Payment and ordering APIs therefore accept an \`Idempotency-Key: <uuid>\` header. The client generates one key per *logical* operation and reuses it on every retry; the server stores the first result for that key and replays it instead of charging twice. With a key, POST becomes safe to retry.`,
      py`#### Testing clients without a network`,
      py`Inject the transport, as the playground does. The real libraries support this directly: \`httpx.MockTransport(handler)\` turns a function into the network (\`httpx.Client(transport=httpx.MockTransport(fake_handler))\`); for requests, the \`responses\` library intercepts calls; for httpx, \`respx\`. Or patch at a higher level with [unittest.mock](lesson:mocking). Test the failure paths — timeouts, 503s, HTML bodies — not just the happy path.`,
      { callout: 'note', title: 'In this sandbox', text: py`Calling \`urllib.request.urlopen("https://...")\` in the playground fails immediately (the browser runtime has no sockets or TLS) — that's why the playground uses a fake transport. On your own computer the same code reaches the real internet.` },
    ],
    production: [
      py`#### A checklist for every outbound HTTP call`,
      py`- **Timeout** on every request, sized to the operation (a few seconds for an API call, longer for a big download).
- **Retries** only for idempotent requests (or with an idempotency key), only for retryable failures, with backoff + jitter, honouring \`Retry-After\`, and a small maximum.
- **Overall budget:** if your own users wait for this call, the sum of all attempts and waits must fit inside *their* timeout.
- **Reuse** a Session/Client per process (or per worker), configured once with base URL, headers, timeouts and retry policy.
- **Validate** status, Content-Type and JSON shape; turn failures into your own exception type.
- **Secrets** from environment variables or a secrets manager — see [secrets & passwords](lesson:secrets-and-passwords). Redact them in logs; never put them in URLs.
- **TLS verification on.** Never ship \`verify=False\` — it lets anyone on the network impersonate the server.
- **User-Agent** that identifies your app and a contact, so API owners can reach you instead of blocking you.
- **Log** method, URL (without secrets), status, duration and attempt count — enough to debug, nothing more.`,
      py`#### Circuit breakers`,
      py`When a dependency is down hard, even polite retries waste time on every request. A *circuit breaker* counts recent failures and, past a threshold, fails fast for a cool-down period without calling the dependency at all, then lets a trial request through. Libraries exist for it, and it's a common [design pattern](lesson:design-patterns) in services that call many others.`,
      py`#### requests or httpx?`,
      py`Both are mature. requests is ubiquitous and synchronous; httpx offers nearly the same API plus async support, HTTP/2 (optional) and strict default timeouts. In async code (FastAPI, asyncio workers) use httpx's \`AsyncClient\` — a blocking requests call inside \`async def\` freezes the event loop. With no dependencies allowed, \`urllib.request\` does the job.`,
    ],
  },
  mistakes: [
    {
      title: 'No timeout',
      wrong: { code: py`response = requests.get("https://api.example.com/v1/rates")   # may wait forever`, lang: 'python', static: true },
      right: { code: py`response = requests.get("https://api.example.com/v1/rates", timeout=(3.05, 10))`, lang: 'python', static: true },
      explanation: py`requests has no default timeout. One unresponsive server can hang a script, or tie up every worker of a web app until it stops serving anyone.`,
    },
    {
      title: 'Calling .json() without checking the status',
      wrong: { code: py`data = requests.get(url, timeout=10).json()
price = data["price"]       # JSONDecodeError on an HTML 502 page, KeyError on {"error": ...}`, lang: 'python', static: true },
      right: { code: py`response = requests.get(url, timeout=10)
response.raise_for_status()                 # 4xx/5xx -> requests.HTTPError
data = response.json()
price = data.get("price")
if not isinstance(price, (int, float)):
    raise ApiError(f"unexpected response: {data!r:.200}")`, lang: 'python', static: true },
      explanation: py`Error responses often have a different body — or aren't JSON at all. Check the status first, then the shape, so failures produce clear errors instead of confusing crashes.`,
    },
    {
      title: 'Retrying everything, immediately, forever',
      wrong: { code: py`while True:
    try:
        response = requests.post(url, json=order, timeout=10)
        break
    except requests.exceptions.RequestException:
        continue          # hammers the server, and may place the order many times`, lang: 'python', static: true },
      right: { code: py`key = str(uuid.uuid4())                       # one key per logical order
for attempt in range(1, 4):
    try:
        response = session.post(url, json=order, timeout=10,
                                headers={"Idempotency-Key": key})
        break
    except requests.exceptions.Timeout:
        if attempt == 3:
            raise
        time.sleep(min(8, 0.5 * 2 ** attempt) * random.uniform(0.5, 1))`, lang: 'python', static: true },
      explanation: py`Bound the attempts, back off with jitter, retry only failures that might be temporary, and only repeat a POST when the server supports an idempotency key.`,
    },
    {
      title: 'Logging the token',
      wrong: { code: py`log.info("calling %s with headers %s", url, session.headers)`, lang: 'python', static: true },
      right: { code: py`log.info("calling %s with headers %s", url, redact(session.headers))`, lang: 'python', static: true },
      explanation: py`Logs travel far: files, aggregators, dashboards, bug reports. A leaked bearer token is a leaked password. Redact on a copy at the moment of logging.`,
    },
    {
      title: 'Disabling certificate checks to "fix" an SSL error',
      wrong: { code: py`requests.get(url, verify=False, timeout=10)   # anyone on the network can impersonate the server`, lang: 'python', static: true },
      right: { code: py`requests.get(url, timeout=10)                 # verification on (the default)
# corporate proxy/private CA? point at its certificate instead:
requests.get(url, verify="/etc/ssl/certs/company-ca.pem", timeout=10)`, lang: 'python', static: true },
      explanation: py`\`SSLError: certificate verify failed\` means "I can't prove who this is". Fix the trust store (install the right CA bundle) rather than turning verification off.`,
    },
    {
      title: 'A new connection for every request',
      wrong: { code: py`for city in cities:
    requests.get(f"{BASE}/forecast", params={"city": city}, timeout=10)   # new connection each time`, lang: 'python', static: true },
      right: { code: py`with requests.Session() as session:
    for city in cities:
        session.get(f"{BASE}/forecast", params={"city": city}, timeout=10)  # reuses the connection`, lang: 'python', static: true },
      explanation: py`Each fresh connection pays for DNS, TCP and TLS setup again. A Session (or \`httpx.Client\`) keeps connections open and shares headers and settings.`,
    },
  ],
  debugging: [
    {
      symptom: py`requests.exceptions.ReadTimeout: HTTPSConnectionPool(host='api.example.com', port=443): Read timed out. (read timeout=10)`,
      cause: py`The server accepted the connection but didn't send data within the read timeout.`,
      fix: py`Retry if the request is idempotent (with backoff). If it happens constantly, the endpoint may be slow by design — raise the timeout for that call only, or ask for less data (pagination).`,
    },
    {
      symptom: py`requests.exceptions.ConnectionError: ... Failed to establish a new connection: [Errno 111] Connection refused`,
      cause: py`Nothing is listening on that host/port — wrong URL or port, the service is down, or a firewall blocks it. (\`Name or service not known\` instead means DNS failed: a typo in the host name.)`,
      fix: py`Check the URL and port; try it with curl from the same machine; retry later if the service is restarting.`,
    },
    {
      symptom: py`requests.exceptions.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`,
      cause: py`The body isn't JSON — usually an empty body (204, or an error) or an HTML error page from a proxy, load balancer or login portal.`,
      fix: py`Print \`response.status_code\`, \`response.headers.get("Content-Type")\` and \`response.text[:200]\`. Check the status and Content-Type before calling \`.json()\`.`,
    },
    {
      symptom: py`requests.exceptions.HTTPError: 401 Client Error: Unauthorized for url: https://api.example.com/v1/me`,
      cause: py`Missing, expired or malformed credentials — often \`Authorization: <token>\` without the \`Bearer\` prefix, or an environment variable that wasn't set.`,
      fix: py`Check the exact header format in the API docs and that the token is loaded (without printing it — print its length or first few characters).`,
    },
    {
      symptom: py`requests.exceptions.SSLError: ... CERTIFICATE_VERIFY_FAILED`,
      cause: py`The server's certificate can't be verified: a corporate proxy re-signing traffic, an outdated CA bundle, or a genuinely untrusted server.`,
      fix: py`Install the correct CA certificate and pass \`verify="/path/to/ca.pem"\` (or update \`certifi\`). Don't set \`verify=False\`.`,
    },
    {
      symptom: py`429 Too Many Requests`,
      cause: py`You've exceeded the API's rate limit.`,
      fix: py`Slow down: honour \`Retry-After\`, add backoff, cache responses, batch requests, and spread scheduled jobs out.`,
    },
  ],
  bestPractices: [
    'Pass a timeout on every request; requests has none by default.',
    'Reuse one Session / httpx.Client per process for connection pooling and shared settings.',
    'Retry only temporary failures (timeouts, connection errors, 429, 502–504) of idempotent requests, with exponential backoff, jitter and a small cap.',
    'Honour Retry-After; use an Idempotency-Key to make POST retries safe.',
    'Check status, Content-Type and JSON shape before using a response; wrap failures in your own exception.',
    'Load tokens from the environment or a secrets manager; redact them in logs; never put them in URLs.',
    'Keep TLS verification on.',
    'Inject the transport/client so tests can simulate failures (httpx.MockTransport, responses, respx).',
    'Use httpx.AsyncClient in async code — never a blocking client inside async def.',
  ],
  useCases: [
    'Pulling data from public APIs (weather, exchange rates, GitHub) into scripts and reports.',
    'Calling payment, email and SMS providers from a web app.',
    'Service-to-service calls inside a company.',
    'Downloading files with streaming and progress.',
    'Fetching many URLs concurrently with httpx.AsyncClient.',
  ],
  comparison: {
    title: 'urllib vs requests vs httpx',
    headers: ['', 'urllib.request', 'requests', 'httpx'],
    rows: [
      ['install', 'standard library', 'pip install requests', 'pip install httpx'],
      ['default timeout', 'none (socket default)', 'none — always pass one', '5 seconds'],
      ['4xx / 5xx', 'raises HTTPError automatically', 'returns Response; raise_for_status()', 'returns Response; raise_for_status()'],
      ['JSON helpers', 'json.load(response) yourself', 'json= and .json()', 'json= and .json()'],
      ['connection reuse', 'manual', 'Session', 'Client / AsyncClient'],
      ['async', 'no', 'no', 'yes (AsyncClient)'],
      ['testing hooks', 'mock urlopen', 'responses library, adapters', 'MockTransport, respx'],
    ],
    note: py`All three speak the same HTTP — the choice is about convenience, dependencies and async.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'http-clients-q1',
      type: 'mcq',
      prompt: 'You call `requests.get(url)` with no `timeout`, and the server accepts the connection but never replies. What happens?',
      options: [
        { text: 'requests gives up after its default 30-second timeout', why: 'requests has no default timeout at all. That’s exactly why you must pass one.' },
        'The call can wait indefinitely',
        { text: 'It raises requests.exceptions.Timeout immediately', why: 'A timeout can only fire if a timeout was set.' },
        { text: 'It retries three times automatically', why: 'Plain requests calls don’t retry; retries need an HTTPAdapter with a Retry policy.' },
      ],
      answer: 1,
      explanation: py`Without \`timeout=\`, requests waits as long as the operating system lets it, which can be forever. httpx, by contrast, defaults to 5 seconds. Always set it explicitly.`,
    },
    {
      id: 'http-clients-q2',
      type: 'output',
      prompt: 'These are backoff delays for attempts 1–6. What does it print?',
      code: py`print([min(8, 0.5 * 2 ** (n - 1)) for n in range(1, 7)])`,
      options: [
        { text: '[0.5, 1, 2, 4, 8, 16]', why: 'min(8, …) caps the delay, so nothing exceeds 8.' },
        { text: '[0.5, 1.0, 2.0, 4.0, 8.0, 8.0]', why: 'Close — but when 8 is the smaller value, min() returns the int 8 itself, not 8.0.' },
        '[0.5, 1.0, 2.0, 4.0, 8, 8]',
        { text: '[1, 2, 4, 8, 8, 8]', why: 'The first delay is 0.5 * 2 ** 0 = 0.5.' },
      ],
      answer: 2,
      explanation: py`\`0.5 * 2 ** (n - 1)\` is a float (0.5, 1.0, 2.0, 4.0, 8.0, 16.0). For n=5, \`min(8, 8.0)\` returns its *first* argument when they're equal → \`8\`; for n=6, \`min(8, 16.0)\` → \`8\`. The cap keeps waits from growing without bound.`,
    },
    {
      id: 'http-clients-q3',
      type: 'bug',
      prompt: 'This retry helper is used for every API call, including `POST /payments`. Click the line that makes it retry things it shouldn’t.',
      code: py`def send_with_retries(session, method, url, **kwargs):
    for attempt in range(3):
        response = session.request(method, url, timeout=10, **kwargs)
        if response.status_code >= 400:
            time.sleep(2 ** attempt)
            continue
        return response
    response.raise_for_status()`,
      answerLine: 4,
      explanation: py`\`>= 400\` retries **every** error — \`400\`, \`401\`, \`404\` and \`422\` will fail identically each time — and it does so for **every method**, so a payment POST that got a \`503\` after actually succeeding could be sent again. Retry only retryable statuses (429, 502, 503, 504) and only idempotent methods (or with an idempotency key). (It also has no jitter and doesn't catch timeouts.)`,
    },
    {
      id: 'http-clients-q4',
      type: 'fill',
      prompt: 'Complete the requests call: send the author as a query parameter, and turn 4xx/5xx responses into an exception.',
      code: py`response = requests.get(
    "https://api.example.com/v1/books",
    ___={"author": "Le Guin"},
    timeout=10,
)
response.___()
books = response.json()`,
      answer: [['params'], ['raise_for_status']],
      explanation: py`\`params=\` encodes a dict into the query string (\`?author=Le+Guin\`). \`raise_for_status()\` raises \`requests.HTTPError\` for 4xx/5xx and does nothing for success.`,
    },
    {
      id: 'http-clients-q5',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import json

body = '{"temp": 21.5, "unit": "C"}'
data = json.loads(body)
print(type(data["temp"]).__name__, data.get("wind", "calm"))`,
      answer: 'float calm',
      accept: ['float calm'],
      explanation: py`JSON numbers with a decimal point become \`float\`. \`"wind"\` is missing, so \`.get\` returns the default instead of raising \`KeyError\` — the right tool for optional fields.`,
    },
    {
      id: 'http-clients-q6',
      type: 'mcq',
      prompt: 'Select **all** the failures that a client should retry automatically (with backoff).',
      options: [
        '`GET /forecast` timed out',
        { text: '`POST /payments` (no idempotency key) timed out', why: 'The payment may have gone through before the timeout. Retrying could charge twice — unless the API supports an Idempotency-Key.' },
        { text: '`GET /cities/atlantis` returned 404', why: 'The resource doesn’t exist; asking again won’t create it.' },
        '`GET /forecast` returned 503 with `Retry-After: 5`',
        { text: '`PUT /profile` returned 422 Unprocessable Content', why: 'The body is invalid. Sending the same invalid body again gets the same 422.' },
      ],
      answer: [0, 3],
      explanation: py`Retry *temporary* failures of *idempotent* requests: timeouts, connection errors, 429 and 502–504 — and wait as long as \`Retry-After\` says. Client errors (4xx except 429) need a different request, not the same one again.`,
    },
    {
      id: 'http-clients-q7',
      type: 'short',
      prompt: 'Why should a program that makes many requests to the same API use a `requests.Session` or `httpx.Client` instead of calling `requests.get` each time?',
      answer: py`A Session/Client keeps a pool of open connections and reuses them (HTTP keep-alive), so later requests skip DNS, TCP and TLS setup and are faster and lighter on the server. It also holds shared configuration in one place — base URL, auth headers, timeouts, retry adapters, cookies — so every call is consistent. Use it in a \`with\` block so connections are closed at the end.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'retry-with-backoff',
      title: 'A retry helper with exponential backoff',
      difficulty: 'intermediate',
      prompt: py`Write \`call_with_retries(send, max_attempts=4, base_delay=0.5, sleep=time.sleep)\`. \`send()\` performs one request and either **returns an HTTP status code** or **raises** \`TimeoutError\` / \`ConnectionError\`.

- If \`send()\` returns a status **not** in \`RETRYABLE\` (\`{429, 500, 502, 503, 504}\`), return it immediately.
- If it raises \`TimeoutError\` or \`ConnectionError\`, or returns a retryable status, wait \`base_delay * 2 ** (attempt - 1)\` seconds by calling \`sleep(delay)\` (0.5, 1.0, 2.0, …) and try again.
- Never sleep after the **last** attempt. When all \`max_attempts\` have failed: re-raise the last exception if the last attempt raised, otherwise return the last status.
- Any other exception (e.g. \`ValueError\`) propagates immediately, without retrying.

The tests use the \`Flaky\` helper in the starter and pass \`sleep=sleeps.append\`, so nobody actually waits.`,
      files: {
        'main.py': py`import time

RETRYABLE = {429, 500, 502, 503, 504}


class Flaky:
    """A pretend server: returns or raises its scripted outcomes in order."""

    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.calls = 0

    def send(self):
        self.calls += 1
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


def call_with_retries(send, max_attempts=4, base_delay=0.5, sleep=time.sleep):
    # TODO: retry timeouts, connection errors and retryable statuses with backoff
    return send()


sleeps = []
server = Flaky([503, 502, 200])
print("status:", call_with_retries(server.send, sleep=sleeps.append))
print("calls:", server.calls, "sleeps:", sleeps)
`,
      },
      hints: [
        'Loop with for attempt in range(1, max_attempts + 1). Inside, try: status = send() / except (TimeoutError, ConnectionError) as exc: remember exc.',
        'Return straight away when there was no exception and status not in RETRYABLE. Otherwise, if attempt == max_attempts: raise the remembered exception (if any) or return status.',
        'Before the next attempt: sleep(base_delay * 2 ** (attempt - 1)). Set error = None at the start of each attempt so an old exception isn’t re-raised after a later status.',
      ],
      solution: {
        explanation: py`The loop is bounded by \`max_attempts\`, so it can never spin forever. Each attempt either succeeds with a final answer (any non-retryable status — including \`404\`, which retrying can't fix), or records why it failed. Only \`TimeoutError\` and \`ConnectionError\` are caught; a \`ValueError\` is a bug, not a network hiccup, so it escapes immediately. On the last attempt we stop *before* sleeping — waiting after the final failure would just waste time — and report the failure faithfully: re-raise the real exception (with its traceback) or return the last status for the caller to handle. Passing \`sleep\` in makes the delays observable and the tests instant; production uses the default \`time.sleep\` and would add jitter.`,
        files: {
          'main.py': py`import time

RETRYABLE = {429, 500, 502, 503, 504}


class Flaky:
    """A pretend server: returns or raises its scripted outcomes in order."""

    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.calls = 0

    def send(self):
        self.calls += 1
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


def call_with_retries(send, max_attempts=4, base_delay=0.5, sleep=time.sleep):
    for attempt in range(1, max_attempts + 1):
        error, status = None, None
        try:
            status = send()
        except (TimeoutError, ConnectionError) as exc:
            error = exc
        if error is None and status not in RETRYABLE:
            return status                       # success, or a permanent error
        if attempt == max_attempts:
            if error is not None:
                raise error
            return status
        sleep(base_delay * 2 ** (attempt - 1))


sleeps = []
server = Flaky([503, 502, 200])
print("status:", call_with_retries(server.send, sleep=sleeps.append))
print("calls:", server.calls, "sleeps:", sleeps)
`,
        },
      },
      tests: [
        { name: 'success on the first try: no sleeping', code: py`s = []
f = Flaky([200])
assert call_with_retries(f.send, sleep=s.append) == 200
assert f.calls == 1 and s == []` },
        { name: 'retries 503 and 502 with growing delays', code: py`s = []
f = Flaky([503, 502, 200])
assert call_with_retries(f.send, sleep=s.append) == 200
assert s == [0.5, 1.0], s` },
        { name: 'retries timeouts and connection errors', code: py`s = []
f = Flaky([TimeoutError("slow"), ConnectionError("refused"), 201])
assert call_with_retries(f.send, sleep=s.append) == 201
assert f.calls == 3` },
        { name: '404 is returned without retrying', code: py`s = []
f = Flaky([404, 200])
assert call_with_retries(f.send, sleep=s.append) == 404
assert f.calls == 1 and s == []` },
        { name: 'gives up and re-raises after max_attempts', code: py`s = []
f = Flaky([TimeoutError("slow")] * 4)
with raises(TimeoutError):
    call_with_retries(f.send, sleep=s.append)
assert f.calls == 4 and s == [0.5, 1.0, 2.0], s` },
        { name: 'returns the last retryable status when attempts run out', code: py`s = []
f = Flaky([503] * 3)
assert call_with_retries(f.send, max_attempts=3, sleep=s.append) == 503
assert s == [0.5, 1.0]` },
        { name: 'other exceptions are not retried', code: py`f = Flaky([ValueError("bug"), 200])
with raises(ValueError):
    call_with_retries(f.send, sleep=lambda d: None)
assert f.calls == 1` },
      ],
    },
    {
      id: 'safe-json-response',
      title: 'Parse a JSON response defensively',
      difficulty: 'intermediate',
      prompt: py`Write \`parse_json_response(status, headers, body)\` that returns the decoded JSON **object** (a dict), or raises \`ApiError\` with a message that **starts with**:

| situation | message starts with |
|---|---|
| status not in 200–299 | \`HTTP <status>\` (e.g. \`HTTP 503\`) |
| Content-Type missing or not \`application/json\` | \`not JSON\` |
| body isn't valid JSON | \`invalid JSON\` |
| valid JSON but not an object (a list, a number…) | \`expected a JSON object\` |

Header **names** may have any capitalisation (\`content-type\`, \`Content-Type\`), and the value may carry parameters and any case: \`Application/JSON; charset=utf-8\` counts as JSON. Check in the order of the table.`,
      files: {
        'main.py': py`import json


class ApiError(Exception):
    pass


def parse_json_response(status, headers, body):
    # TODO: check status, Content-Type, JSON validity and shape
    return json.loads(body)


print(parse_json_response(200, {"Content-Type": "application/json"}, '{"temp": 21.5}'))
`,
      },
      hints: [
        'Start with: if not 200 <= status < 300: raise ApiError(f"HTTP {status}").',
        'Find the Content-Type whatever its capitalisation: next((v for k, v in headers.items() if k.lower() == "content-type"), ""). Then take the part before ";", strip it and lower() it.',
        'Wrap json.loads in try/except json.JSONDecodeError and raise ApiError("invalid JSON ...") from exc. Finally, if not isinstance(data, dict): raise ApiError("expected a JSON object").',
      ],
      solution: {
        explanation: py`Each check guards the next: there's no point parsing the body of a \`503\`, and no point decoding something the server says is HTML. Header names are case-insensitive in HTTP, so we search them case-insensitively; the *media type* is the part before any \`;\` parameters and is also case-insensitive. Catching \`json.JSONDecodeError\` specifically (not a bare \`except\`) and chaining with \`from exc\` keeps the original parser message available for debugging. The final \`isinstance\` check matters because \`json.loads\` happily returns lists, strings or numbers — and calling \`.get\` on a list crashes far from here.`,
        files: {
          'main.py': py`import json


class ApiError(Exception):
    pass


def parse_json_response(status, headers, body):
    if not 200 <= status < 300:
        raise ApiError(f"HTTP {status}: {body[:80]}")
    content_type = next((v for k, v in headers.items() if k.lower() == "content-type"), "")
    media_type = content_type.split(";")[0].strip().lower()
    if media_type != "application/json":
        raise ApiError(f"not JSON: {content_type or 'no Content-Type'}")
    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        raise ApiError(f"invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ApiError(f"expected a JSON object, got {type(data).__name__}")
    return data


print(parse_json_response(200, {"Content-Type": "application/json"}, '{"temp": 21.5}'))
`,
        },
      },
      tests: [
        { name: 'returns the decoded object', code: py`assert parse_json_response(200, {"Content-Type": "application/json"}, '{"temp": 21.5}') == {"temp": 21.5}` },
        { name: 'non-2xx raises "HTTP <status>"', code: py`with raises(ApiError, match="^HTTP 503"):
    parse_json_response(503, {"Content-Type": "application/json"}, '{"error": "busy"}')` },
        { name: 'HTML raises "not JSON"', code: py`with raises(ApiError, match="^not JSON"):
    parse_json_response(200, {"Content-Type": "text/html"}, "<html>Maintenance</html>")
with raises(ApiError, match="^not JSON"):
    parse_json_response(200, {}, '{"a": 1}')` },
        { name: 'header names and values in any case', code: py`assert parse_json_response(201, {"content-type": "Application/JSON; charset=utf-8"}, '{"id": 4}') == {"id": 4}` },
        { name: 'broken JSON raises "invalid JSON"', code: py`with raises(ApiError, match="^invalid JSON"):
    parse_json_response(200, {"Content-Type": "application/json"}, '{"temp": ')` },
        { name: 'a list raises "expected a JSON object"', code: py`with raises(ApiError, match="^expected a JSON object"):
    parse_json_response(200, {"Content-Type": "application/json"}, "[1, 2, 3]")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'http-clients-timeouts',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why should every HTTP request have a timeout, and what is the difference between a connect timeout and a read timeout?',
      answer: 'Without a timeout a request to an unresponsive server can block forever, freezing scripts and exhausting web-app workers. The connect timeout limits how long to wait to establish the connection; the read timeout limits how long to wait for the server to send data (between bytes). requests has no default, so pass timeout= every time; httpx defaults to 5 seconds.',
      explanation: py`In requests, \`timeout=(3.05, 10)\` sets connect and read timeouts separately; a single number sets both. A read timeout is not a total deadline — a server trickling one byte every few seconds never trips it — so for a hard limit use an overall deadline (e.g. \`asyncio.timeout()\` in async code).`,
      whyAsked: 'Missing timeouts are one of the most common causes of production hangs; it’s a quick check of real-world experience.',
      mistakes: ['Believing requests has a sensible default timeout', 'Thinking the read timeout bounds the whole download', 'Setting huge timeouts everywhere "to be safe"'],
      followUps: ['How would you enforce a total deadline across retries?', 'What timeout would you choose for a user-facing call?', 'How does httpx configure separate pool/write timeouts?'],
      modelAnswer: 'Every network call can hang — the server might accept the connection and never answer — and without a timeout the calling code waits forever, which can freeze a script or tie up every worker in a web service. requests has no default timeout, so I always pass one; httpx defaults to five seconds, but I still set it explicitly. The connect timeout limits how long establishing the connection may take, and the read timeout limits how long I’ll wait for the next chunk of data. The read timeout isn’t a total deadline, so when a caller has a strict budget I add an overall deadline around the whole operation, including retries.',
    },
    {
      id: 'http-clients-retry-policy',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Your service calls a payment provider to charge cards. Occasionally the call times out, and naive retries have charged some customers twice. Design a better retry policy.',
      answer: 'Make the charge idempotent with an Idempotency-Key generated once per logical payment and reused on every retry; retry only timeouts, connection errors, 429 and 5xx gateway errors, with exponential backoff + jitter, a small attempt cap and Retry-After respected; never retry 4xx validation errors; keep the total time within the user’s budget; record the key and outcome, and reconcile ambiguous results by querying the payment status.',
      explanation: py`A timed-out POST is ambiguous: the provider may have charged the card. The idempotency key lets the provider recognise the retry and return the original result. Backoff + jitter avoids hammering a struggling provider. After the final failure, don't guess — mark the payment "pending" and check its status (via a GET or webhook) before telling the user anything.`,
      whyAsked: 'It combines HTTP semantics, idempotency and failure handling in a scenario where mistakes cost real money.',
      mistakes: ['"Just retry three times"', 'Generating a new idempotency key for each retry (which defeats it)', 'Retrying 400/402 errors', 'Telling the user it failed when the outcome is unknown'],
      followUps: ['Where do you store the idempotency key?', 'What if the provider has no idempotency support?', 'How would you test this?'],
      modelAnswer: 'The root problem is that a timed-out POST is ambiguous — the charge may have gone through — so blind retries can double-charge. First I’d make the operation idempotent: generate an idempotency key once per logical payment, store it with the order, and send the same key on every attempt, so the provider returns the original result instead of charging again. Then I’d retry only failures that might be temporary — timeouts, connection errors, 429 and 502 to 504 — with exponential backoff, jitter, a cap of a few attempts and Retry-After honoured, and never retry 4xx errors like a declined card. If we still don’t know the outcome, I’d mark the payment pending and reconcile by querying its status or waiting for the provider’s webhook, rather than reporting failure.',
    },
    {
      id: 'http-clients-library-choice',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'You’re writing an async FastAPI service that calls three other APIs per request. Which client should you use?',
      options: [
        'requests, inside the async endpoint',
        'urllib.request, because it needs no dependencies',
        'httpx.AsyncClient, created once and reused, with explicit timeouts',
        'A new httpx.AsyncClient for every request',
      ],
      correctOption: 2,
      answer: 'httpx.AsyncClient, created once at start-up (shared connection pool) and reused, with explicit timeouts; await the three calls concurrently with asyncio.gather or a TaskGroup.',
      explanation: py`requests and urllib are blocking: calling them inside \`async def\` freezes the event loop, so every other request in that process waits. A fresh client per request throws away the connection pool. A shared \`AsyncClient\` reuses connections and lets the three calls overlap.`,
      whyAsked: 'Mixing blocking I/O into async code is a classic, hard-to-spot performance bug.',
      mistakes: ['Using requests in async code', 'Creating and closing a client per call', 'Awaiting the three calls one after another when they’re independent'],
      followUps: ['How do you close the shared client on shutdown?', 'How would you limit concurrency to a fragile upstream?', 'What if one of the three calls is slow?'],
      modelAnswer: 'I’d use httpx’s AsyncClient. requests and urllib block the thread, and inside an async endpoint that freezes the whole event loop, so every other request waits too. I’d create one AsyncClient when the app starts, with explicit timeouts and any shared headers, reuse it for all requests so connections are pooled, and close it on shutdown. Since the three upstream calls are independent, I’d run them concurrently with asyncio.gather or a TaskGroup, so the endpoint takes about as long as the slowest call rather than the sum.',
    },
    {
      id: 'http-clients-raise-for-status',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'This crashes with `requests.exceptions.JSONDecodeError: Expecting value: line 1 column 1 (char 0)` about once a day. What is going on and how do you fix it?',
      code: { lang: 'python', code: py`def get_rate(currency):
    response = requests.get(f"{BASE}/rates/{currency}", timeout=5)
    return response.json()["rate"]` },
      answer: 'Sometimes the server (or a proxy in front of it) returns an error response whose body isn’t JSON — an HTML 502 page or an empty body — and .json() fails. Check the status with raise_for_status() (and the Content-Type) before decoding, catch the errors, and validate that "rate" exists.',
      explanation: py`\`Expecting value: line 1 column 1\` means the very first character wasn't JSON — typically \`<\` from HTML or an empty string. Logging \`status_code\`, the Content-Type and the first 200 characters of \`response.text\` confirms it. Then decide: retry 502/503 with backoff, surface 4xx as a clear error.`,
      whyAsked: 'It checks practical debugging instincts: reading the error message, forming a hypothesis, and fixing the root cause instead of wrapping everything in try/except.',
      mistakes: ['Wrapping .json() in a bare except and returning None', 'Assuming the API itself sends bad JSON', 'Not logging the status and body when it happens'],
      followUps: ['How would you log the failing response safely?', 'Which of these failures would you retry?', 'How would you test this path?'],
      modelAnswer: 'That message means the body didn’t start with JSON at all, which almost always means an error response — an HTML page from a load balancer during a 502, or an empty body. The code calls .json() without checking the status. I’d call raise_for_status first, check the Content-Type is JSON, and validate that the rate key is present, turning each failure into a clear exception. I’d log the status code and a truncated body when it happens to confirm, and I’d retry the 502s and 503s with backoff since they’re probably transient.',
    },
    {
      id: 'http-clients-redact-headers',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `redact_headers(headers)` that returns a **new** dict safe to log: values of `Authorization`, `Cookie`, `Set-Cookie` and `X-Api-Key` (any capitalisation) are hidden. For `Authorization`, keep the scheme: `"Bearer abc123"` → `"Bearer ***"`; a value with no scheme becomes `"***"`. Other headers are unchanged, and the input must not be modified.',
      answer: 'Iterate over items, compare k.lower() against a set of sensitive names, keep the first word of Authorization values when there is a space, and build a new dict.',
      explanation: py`Case-insensitive matching matters because header names are case-insensitive in HTTP. Keeping the scheme ("Bearer", "Basic") preserves useful debugging information without revealing the credential. Returning a copy guarantees the real request still carries the real token.`,
      starter: { files: { 'main.py': py`SENSITIVE = {"authorization", "cookie", "set-cookie", "x-api-key"}


def redact_headers(headers):
    # TODO: return a copy with sensitive values hidden
    return headers


print(redact_headers({"Authorization": "Bearer abc123", "Accept": "application/json"}))
` } },
      tests: [
        { name: 'hides a bearer token but keeps the scheme', code: py`assert redact_headers({"Authorization": "Bearer abc123"}) == {"Authorization": "Bearer ***"}` },
        { name: 'matches header names in any case', code: py`out = redact_headers({"x-api-key": "k-999", "COOKIE": "session=xyz", "Accept": "application/json"})
assert out == {"x-api-key": "***", "COOKIE": "***", "Accept": "application/json"}` },
        { name: 'an Authorization value without a scheme', code: py`assert redact_headers({"authorization": "abc123"}) == {"authorization": "***"}` },
        { name: 'does not modify the input', code: py`h = {"Authorization": "Bearer abc123"}
redact_headers(h)
assert h == {"Authorization": "Bearer abc123"}` },
      ],
      solution: { files: { 'main.py': py`SENSITIVE = {"authorization", "cookie", "set-cookie", "x-api-key"}


def redact_headers(headers):
    safe = {}
    for name, value in headers.items():
        lowered = name.lower()
        if lowered == "authorization" and " " in value:
            scheme = value.split(" ", 1)[0]
            safe[name] = f"{scheme} ***"
        elif lowered in SENSITIVE:
            safe[name] = "***"
        else:
            safe[name] = value
    return safe


print(redact_headers({"Authorization": "Bearer abc123", "Accept": "application/json"}))
` } },
      hints: ['Build a new dict; compare name.lower() with the names in SENSITIVE.', 'For Authorization, value.split(" ", 1)[0] is the scheme when there is a space.'],
      whyAsked: 'Leaking credentials through logs is a common security incident; this checks you think about it and handle HTTP’s case-insensitivity.',
      mistakes: ['Mutating the headers that are about to be sent', 'Case-sensitive matching that misses "authorization"', 'Logging a "partially masked" token that still reveals most of it'],
      followUps: ['How would you apply this automatically to every log record? (a logging.Filter)', 'What else besides headers can leak secrets? (URLs, request bodies, exception messages)'],
      modelAnswer: 'I’d build a new dictionary rather than modifying the one that gets sent. For each header I lower-case the name, because HTTP header names are case-insensitive, and compare it with a set of sensitive names. For Authorization I keep the scheme — Bearer or Basic — and replace the credential with stars, which is still useful when debugging. Cookies, Set-Cookie and API keys are replaced entirely, and everything else passes through. In a real service I’d also install a logging filter so redaction happens even when someone logs headers by accident.',
    },
    {
      id: 'http-clients-session-pooling',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'A script downloads 2,000 small JSON documents from one API with `requests.get` in a loop and it’s slow. What simple change helps most, and why?',
      answer: 'Use one requests.Session (or httpx.Client) for the whole loop. It reuses pooled keep-alive connections, so each request skips DNS, TCP and TLS setup. Beyond that, consider concurrency (httpx.AsyncClient with a concurrency limit) or a bulk endpoint.',
      explanation: py`Module-level \`requests.get\` builds and discards a session every call, so each request pays connection setup again. With a shared Session, only the first request does. If the API offers batch or paginated list endpoints, fewer, larger requests beat many small ones. Don't add unbounded concurrency — respect rate limits.`,
      whyAsked: 'It tests understanding of what a request costs underneath the one-line API.',
      mistakes: ['Jumping straight to threads without reusing connections', 'Ignoring rate limits when adding concurrency', 'Not closing the session'],
      followUps: ['How would you add concurrency safely?', 'How do you know where the time goes? (measure: timing per request, profiling)'],
      modelAnswer: 'Each module-level requests.get call creates a new session and a new connection, so every one of the 2,000 requests pays for DNS, the TCP handshake and the TLS handshake. Wrapping the loop in a single requests.Session lets them reuse a pooled keep-alive connection, which usually helps a lot by itself. If it’s still too slow, I’d check whether the API has a batch or list endpoint, and otherwise use httpx’s AsyncClient with a bounded number of concurrent requests that respects the rate limit. I’d measure before and after rather than guess.',
    },
    {
      id: 'http-clients-testing',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you structure and test a module that wraps a third-party REST API (say, a shipping provider), so that tests are fast, deterministic and cover failure modes?',
      answer: 'Wrap the API in your own client class with domain methods (create_label, track) that returns your own types and raises your own exceptions; inject the HTTP client/transport. Unit-test with a fake transport (httpx.MockTransport, responses/respx) scripting success, 4xx, 5xx, timeouts and malformed JSON; verify request construction (URL, headers, body); add a few contract tests against the provider’s sandbox, run separately.',
      explanation: py`The wrapper is an adapter at your system's edge (see [clean architecture](lesson:clean-architecture)): the rest of your code never sees HTTP. Injecting the transport means no network in unit tests and every failure is reproducible. Contract tests against a real sandbox catch API changes the fakes can't. Recorded fixtures (VCR-style) are another option, but re-record them regularly.`,
      whyAsked: 'It tests design skills — boundaries, dependency injection, test strategy — around the messiest part of most systems: other people’s APIs.',
      mistakes: ['Calling the real API in unit tests', 'Mocking so deeply (e.g. patching requests.get everywhere) that tests break on refactors', 'Testing only the happy path'],
      followUps: ['How do you notice when the provider changes their API?', 'Where would retries live — in the wrapper or the caller?', 'How would you handle provider rate limits in tests?'],
      modelAnswer: 'I’d put the provider behind my own small client class with domain-level methods like create_label and track_parcel, returning my own data types and raising my own exceptions, so nothing else in the codebase knows about HTTP. The HTTP client or transport is injected. For unit tests I’d plug in a fake transport — httpx’s MockTransport, or the responses library for requests — and script each scenario: success, validation errors, 401, 503 with Retry-After, timeouts and malformed JSON, asserting both how I build requests and how I handle answers. Separately, a small set of contract tests runs against the provider’s sandbox, maybe nightly, to catch changes in their API that my fakes can’t know about.',
    },
  ],

  takeaways: [
    'urllib.request is built in; requests is the simple, popular choice; httpx adds async and strict default timeouts. Third-party ones need pip install.',
    'Always pass a timeout — requests has none by default; a read timeout is not a total deadline.',
    'Retry only temporary failures (timeouts, connection errors, 429, 502–504) of idempotent requests, with exponential backoff, jitter, a cap and Retry-After.',
    'Reuse a Session / Client for connection pooling and shared configuration.',
    'Check status, Content-Type and JSON shape before trusting a response; raise your own exception type.',
    'Load tokens from the environment, send them in the Authorization header, redact them in logs, keep TLS verification on.',
    'Inject the transport so tests can simulate a flaky network without one.',
  ],
}
