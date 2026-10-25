// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ERRORS_PY = py`"""Problems we can explain to the user. Everything else is a bug or an outage."""


class AppError(Exception):
    """Base class for errors the user can do something about."""


class InvalidEmailError(AppError):
    """The email address is not valid."""


class EmailTakenError(AppError):
    """Someone already registered with this email address."""
`

const STORAGE_PY = py`"""Storage layer: the only module that knows we use SQLite."""
import sqlite3

from errors import EmailTakenError


class UserStore:
    def __init__(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("CREATE TABLE users (email TEXT PRIMARY KEY, name TEXT)")

    def add(self, email, name):
        try:
            with self.db:  # commit on success, roll back on error
                self.db.execute("INSERT INTO users VALUES (?, ?)", (email, name))
        except sqlite3.IntegrityError as err:
            # translate: callers shouldn't need to know about SQLite
            raise EmailTakenError(f"{email} is already registered") from err

    def find(self, email):
        """Return the user's name, or None if nobody has this email (a normal outcome)."""
        row = self.db.execute("SELECT name FROM users WHERE email = ?", (email,)).fetchone()
        return row[0] if row else None
`

const SERVICE_PY = py`"""Service layer: business rules. Raises errors; never prints."""
import logging
import time

from errors import InvalidEmailError

logger = logging.getLogger("signup")


def retry(func, attempts=3, base_delay=0.05, retry_on=(ConnectionError, TimeoutError)):
    """SIMPLIFIED retry with exponential backoff (no jitter, no overall deadline)."""
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retry_on as err:
            if attempt == attempts:
                raise  # out of attempts: let the caller see the real error
            delay = base_delay * 2 ** (attempt - 1)
            logger.warning("attempt %d failed (%s); retrying in %.2fs", attempt, err, delay)
            time.sleep(delay)


class FlakyMailer:
    """Pretend mail service: the first \`failures\` calls raise ConnectionError."""

    def __init__(self, failures):
        self.failures = failures
        self.sent = []

    def send(self, to, text):
        if self.failures > 0:
            self.failures -= 1
            raise ConnectionError("mail server not responding")
        self.sent.append((to, text))


def sign_up(store, mailer, email, name):
    email = email.strip().lower()
    if "@" not in email:
        raise InvalidEmailError(f"{email!r} is not an email address")
    name = name.strip().title()
    store.add(email, name)
    retry(lambda: mailer.send(email, f"Welcome, {name}!"))
    return email
`

const MAIN_PY = py`import logging
import sys

from errors import AppError
from service import FlakyMailer, sign_up
from storage import UserStore

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
    force=True,  # replace any earlier setup, so every run logs to this run's output
)
logger = logging.getLogger("app")


def handle_signup(store, mailer, email, name):
    """The boundary: every outcome becomes a message for the user."""
    try:
        user = sign_up(store, mailer, email, name)
    except AppError as err:  # expected: the user can fix it
        print(f"  Sorry: {err}")
    except Exception:  # unexpected: keep the traceback for developers
        logger.exception("signup crashed for %r", email)
        print("  Something went wrong on our side. Please try again later.")
    else:
        print(f"  Welcome aboard, {user}!")


store = UserStore()
mailer = FlakyMailer(failures=2)
attempts = [("ada@example.com", "ada"), ("ADA@example.com", "Ada Again"), ("ben.example.com", "Ben"), ("cy@example.com", None)]
for email, name in attempts:
    print(f"signup {email}:")
    handle_signup(store, mailer, email, name)

print("find ada:", store.find("ada@example.com"), "| find zed:", store.find("zed@example.com"))
`

export default {
  id: 'error-handling-patterns',
  title: 'EAFP vs LBYL & error-handling patterns',
  summary: 'Decide where errors are caught, how they are logged and translated, when to retry, and when None or a result object beats an exception.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['try-except', 'raising-exceptions', 'custom-exceptions'],
  related: ['context-managers', 'contextlib', 'logging', 'exception-groups', 'clean-architecture', 'database-patterns', 'http-clients', 'polymorphism-and-duck-typing', 'input-validation'],
  tags: ['EAFP', 'LBYL', 'race condition', 'TOCTOU', 'error boundaries', 'layers', 'swallowing exceptions', 'logger.exception', 'logging', 'finally', 'with', 'contextlib.suppress', 'retry', 'exponential backoff', 'result object', 'returning None', 'exception translation'],
  apis: [
    { name: 'logger.exception(msg, *args)', summary: 'Log at ERROR level with the current exception\'s traceback; call it inside an except block.' },
    { name: 'logger.error(msg, exc_info=True)', summary: 'Attach the current traceback to any log level (warning, error, critical).' },
    { name: 'contextlib.suppress(*exceptions)', summary: 'A with block that deliberately ignores the listed exception types — an explicit, readable "except: pass".' },
    { name: 'dict.get(key, default)', summary: 'LBYL-free lookup that returns a default instead of raising KeyError — ideal when a missing key is common.' },
    { name: 'raise DomainError(...) from err', summary: 'Translate a low-level exception at a layer boundary while keeping the cause.' },
  ],
  docs: [
    { label: 'Glossary — EAFP', url: 'https://docs.python.org/3/glossary.html#term-EAFP' },
    { label: 'Glossary — LBYL (and the race it can cause)', url: 'https://docs.python.org/3/glossary.html#term-LBYL' },
    { label: 'logging — Logger.exception()', url: 'https://docs.python.org/3/library/logging.html#logging.Logger.exception' },
    { label: 'contextlib.suppress', url: 'https://docs.python.org/3/library/contextlib.html#contextlib.suppress' },
    { label: 'Python tutorial — predefined clean-up actions (with)', url: 'https://docs.python.org/3/tutorial/errors.html#predefined-clean-up-actions' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You know the mechanics: [\`try\`/\`except\`](lesson:try-except), [\`raise\`](lesson:raising-exceptions), [custom exceptions](lesson:custom-exceptions). This lesson is about **judgement** — the patterns experienced Python developers use to decide:`,
    py`- **Check first or just try?** LBYL ("look before you leap") vs EAFP ("easier to ask forgiveness than permission").
- **Where** should an error be caught — in the function that hit it, or several layers up?
- How do you make sure an error is **never silently lost**, and that developers get the full traceback?
- When is returning \`None\` (or a *result object*) better than raising?
- How do you **retry** a flaky operation without making things worse?`,
    py`The playground is a small sign-up service split into layers — storage, service, and a boundary that talks to the user — so you can see every pattern in context.`,
  ],
  why: [
    py`Most real bugs around errors aren't syntax mistakes; they're **design** mistakes. An \`except Exception: pass\` that hides a failed payment. A log line "error: 'id'" with no traceback. A retry loop that hammers a server that's already down. A web page that shows users \`sqlite3.IntegrityError: UNIQUE constraint failed\`.`,
    py`Good error handling makes programs **honest**: users see messages they can act on, developers see exactly what broke and where, and temporary hiccups are absorbed without hiding permanent failures.`,
  ],
  eli15: [
    py`**LBYL vs EAFP.** You want a biscuit. LBYL: you check the tin is on the shelf, check it has a lid, check it isn't empty… and by the time you reach in, your brother has eaten the last one. EAFP: you just open the tin, and if it's empty you deal with that. Python usually prefers the second style — it's shorter, and the world can't change between your check and your action.`,
    py`**Catching at the right layer.** At a restaurant, the cook who burns a steak doesn't run into the dining room to apologise. They tell the waiter; the waiter, who actually talks to the customer, decides what to say ("ten more minutes — have a free drink"). Errors work the same: low-level code reports, the layer that talks to the user decides.`,
    py`**Never swallow.** If the cook just binned the burnt steak and told nobody, the customer would wait forever. That's what \`except: pass\` does.`,
  ],
  analogy: {
    title: 'An airline\'s problem handling',
    body: [
      py`A plane has a fault. The **mechanic** (low-level code) diagnoses it precisely: "hydraulic pump B pressure low". They don't announce that to passengers — they raise it with **operations** (service layer), who translate it into "flight 212 delayed, aircraft swap needed" (translation at a boundary). The **gate agent** (the boundary) tells passengers "about 40 minutes, here's a meal voucher" (a message the user can act on) — while the full technical report goes into the **maintenance log** (logging with traceback).`,
      py`If the radio to the tower crackles, the pilot simply **tries again** after a short pause, a few times (retry with backoff). But if the runway is closed, retrying is pointless (don't retry permanent errors). And nobody ever just ignores a warning light (never swallow errors).`,
    ],
    mapping: [
      ['the mechanic\'s precise diagnosis', 'a low-level exception (sqlite3.IntegrityError, ConnectionError)'],
      ['operations rephrasing it as "aircraft swap"', 'translating at a boundary: raise EmailTakenError(...) from err'],
      ['the gate agent talking to passengers', 'the boundary layer: catches AppError and shows a friendly message'],
      ['the maintenance log', 'logger.exception(...) — full traceback for developers'],
      ['retrying the radio call after a pause', 'retry with backoff for transient errors'],
      ['not retrying when the runway is closed', 'never retry permanent errors (bad input, not found)'],
      ['ignoring a warning light', 'except: pass — the failure is silently lost'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Who handles what, layer by layer',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'user', label: 'User', note: 'sees friendly messages', x: 80, y: 160, tone: 'paper' },
        { id: 'boundary', label: 'handle_signup()', note: 'boundary: catch & present', x: 250, y: 160, tone: 'yellow' },
        { id: 'service', label: 'sign_up()', note: 'rules, retry', x: 430, y: 160, tone: 'blue' },
        { id: 'storage', label: 'UserStore', note: 'translate DB errors', x: 610, y: 90, tone: 'blue' },
        { id: 'mailer', label: 'mail service', note: 'flaky network', x: 610, y: 240, tone: 'kraft' },
        { id: 'logs', label: 'logs', note: 'tracebacks for devs', x: 250, y: 280, tone: 'ink' },
      ],
      edges: [
        { from: 'user', to: 'boundary', label: 'request' },
        { from: 'boundary', to: 'service' },
        { from: 'service', to: 'storage' },
        { from: 'service', to: 'mailer' },
        { from: 'boundary', to: 'logs', dashed: true, label: 'logger.exception' },
      ],
      steps: [
        { focus: ['storage'], edges: ['service->storage'], text: py`**Translate at the bottom.** \`UserStore.add\` catches \`sqlite3.IntegrityError\` and raises \`EmailTakenError(...) from err\`. Nothing above this layer needs to know SQLite exists.` },
        { focus: ['mailer', 'service'], edges: ['service->mailer'], text: py`**Absorb transient failures where they happen.** The mail call is wrapped in a (simplified) retry with backoff — but only for \`ConnectionError\`/\`TimeoutError\`. Anything else, and the final failure, propagates.` },
        { focus: ['service'], text: py`**Raise, don't print.** \`sign_up\` validates and raises \`InvalidEmailError\`. It has no idea whether it's being called from a web page, a CLI or a test — so it can't know how to *present* the error.` },
        { focus: ['boundary', 'user'], edges: ['user->boundary', 'boundary->service'], text: py`**Catch at the boundary.** \`handle_signup\` is the one place that talks to the user: \`except AppError\` → a message they can act on.` },
        { focus: ['boundary', 'logs'], edges: ['boundary->logs'], text: py`**Unexpected errors: log the traceback, apologise.** \`except Exception\` at the boundary calls \`logger.exception(...)\` so developers get every detail, while the user gets a polite generic message. Nothing is swallowed.` },
      ],
    },
    alt: 'Diagram of layers: User, then handle_signup (the boundary), then sign_up (service), which calls UserStore (storage) and a mail service. A dashed arrow from the boundary goes to logs. Steps explain translating database errors in storage, retrying flaky mail calls in the service, raising instead of printing, catching expected errors at the boundary and logging unexpected ones with their traceback.',
    caption: py`Each layer has one job. Errors flow **up**; translation happens at the **edges** of a layer; presentation and logging happen at the **top**.`,
  },
  syntax: [
    py`#### EAFP vs LBYL`,
    { code: py`# LBYL: look before you leap
if "port" in config and config["port"].isdigit():
    port = int(config["port"])
else:
    port = 8080

# EAFP: easier to ask forgiveness than permission
try:
    port = int(config["port"])
except (KeyError, ValueError):
    port = 8080`, lang: 'python', static: true, title: 'the two styles' },
    py`Python's culture leans towards **EAFP**, for three reasons:`,
    py`1. **No race between checking and using.** \`if os.path.exists(path): open(path)\` has a gap: another program (or thread) can delete the file after the check. That bug class is called **TOCTOU** — *time of check to time of use*. EAFP has no gap: the \`open()\` either works or raises.
2. **The check often duplicates the work.** \`"42".isdigit()\` and then \`int("42")\` both parse the string — and \`isdigit()\` gets edge cases wrong (\`" 42"\`, \`"-3"\`, \`"²"\`). Letting \`int()\` decide is simpler *and* more correct.
3. **It fits duck typing.** Instead of \`if isinstance(source, io.TextIOBase)\`, just call \`source.read()\` and let anything with a \`read()\` method work ([duck typing](lesson:polymorphism-and-duck-typing)).`,
    py`LBYL is still the right choice when failure is **common and the check is cheap and race-free** — for example \`counts.get(word, 0)\` or \`if word in stopwords\` on data only your code touches. Raising and catching an exception costs more than a dict lookup, so for a "miss" that happens on most iterations, the plain check is clearer and faster.`,
    py`#### Catch at the right layer`,
    py`Ask of every \`except\`: *can this code actually do something useful about the error?*`,
    py`- **Low-level code** (parsing, storage, HTTP calls): raise precise exceptions. Translate *foreign* exceptions (\`sqlite3.Error\`, \`requests.ConnectionError\`) into your own at the edge of the layer, with \`from err\`.
- **Middle layers** (business logic): usually don't catch at all. If they do — to roll back, retry or add context — they re-raise.
- **Boundaries** (\`main()\` of a CLI, a web request handler, a job runner): catch your expected errors and present them (message, HTTP status, exit code); catch \`Exception\` once, log it with the traceback, and fail politely.`,
    py`#### Never swallow silently`,
    { code: py`# ✗ the error vanishes: no message, no log, the caller gets None
try:
    charge_card(order)
except Exception:
    pass

# ✓ deliberately ignoring ONE expected error, visibly
from contextlib import suppress

with suppress(FileNotFoundError):     # fine if the cache file is already gone
    cache_path.unlink()`, lang: 'python', static: true, title: 'swallowing vs suppressing on purpose' },
    py`If you really mean "ignore this", narrow it to one type and say so with \`contextlib.suppress\` (or a comment). If you can't recover, let it propagate.`,
    py`#### Log exceptions with their traceback`,
    { code: py`import logging

logger = logging.getLogger(__name__)

try:
    sync_inventory()
except Exception:
    logger.exception("inventory sync failed")          # ERROR + full traceback
    raise

# other levels: logger.warning("retrying", exc_info=True)`, lang: 'python', static: true, title: 'logger.exception' },
    py`\`logger.exception(...)\` must be called **inside** an \`except\` block; it logs at ERROR level and appends the traceback (including the \`from\` chain). \`logger.error(str(err))\` loses the traceback — the single most useful thing for fixing the bug. More in [logging](lesson:logging).`,
    py`#### Clean up with \`with\` (or \`finally\`)`,
    py`Resources — files, locks, database transactions, network connections — must be released on **every** path. Prefer a \`with\` statement (\`with open(...)\`, \`with lock:\`, \`with connection:\`), which runs its clean-up even when an exception passes through; fall back to \`finally\` when no context manager exists. See [context managers](lesson:context-managers) and [contextlib](lesson:contextlib).`,
    py`#### Raise, return None, or return a result?`,
    py`| approach | use it when… | watch out for… |
|---|---|---|
| **raise** | the function can't do what its name promises (\`load_config\`, \`charge_card\`) | callers that should handle it must catch it |
| **return \`None\`** | "nothing found" is a normal, documented outcome (\`dict.get\`, \`re.match\`, \`store.find\`) | callers forgetting to check → \`TypeError: 'NoneType' object …\` far away |
| **result object** | processing many items where you want *all* outcomes (a batch import, form validation) | it's less idiomatic in Python for single calls; don't use it to hide bugs |`,
    py`#### Retry transient failures — carefully`,
    { code: py`def retry(func, attempts=3, base_delay=0.5, retry_on=(ConnectionError, TimeoutError)):
    """SIMPLIFIED: exponential backoff only. Production adds jitter, a cap and a deadline."""
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except retry_on:
            if attempt == attempts:
                raise                                    # give up: re-raise the last error
            time.sleep(base_delay * 2 ** (attempt - 1))  # 0.5s, 1s, 2s, ...`, lang: 'python', static: true, title: 'retry with exponential backoff (simplified)' },
    { callout: 'warn', title: 'What production retry logic adds', text: py`This loop is **simplified**. Real systems also: add random **jitter** so thousands of clients don't retry in lock-step; **cap** the delay and enforce an overall **deadline**; retry only **idempotent** operations (safe to repeat — charging a card twice is not!) or use idempotency keys; and respect server hints like HTTP \`Retry-After\`. Libraries such as *tenacity* (third-party) package this up. Note that \`ConnectionError\` and \`TimeoutError\` are subclasses of \`OSError\` — retrying on \`OSError\` would also retry \`FileNotFoundError\`, which will never fix itself.` },
  ],
  walkthrough: {
    title: 'Reading the sign-up boundary',
    lang: 'python',
    code: MAIN_PY,
    intro: py`This is \`main.py\` from the playground; the other layers live in \`errors.py\`, \`storage.py\` and \`service.py\`. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [8, 14], text: py`Logging goes to stdout here so you can see it in the Output panel; \`force=True\` replaces any setup left over from a previous run in the same interpreter. A real service would send logs to a file or a log collector.` },
      { lines: [17, 20], text: py`\`handle_signup\` is the **boundary**: the only function that knows there's a human waiting for an answer. The \`try\` wraps one call into the lower layers.` },
      { lines: [21, 22], text: py`**Expected** problems — all subclasses of \`AppError\` — become a message the user can act on. No traceback: nothing is broken.` },
      { lines: [23, 25], text: py`**Unexpected** problems (bugs, outages) are logged with \`logger.exception\`, which records the full traceback for developers, and the user gets a polite, generic apology. The error is reported, not swallowed.` },
      { lines: [26, 27], text: py`\`else\` runs only on success.` },
      { lines: [30, 37], text: py`Four sign-ups exercise every path: a success after two retried mail failures, a duplicate (\`EmailTakenError\`, translated from SQLite), an invalid email, and a bug (\`name=None\`). Finally, \`find()\` shows the "return \`None\`" pattern: a missing user is a normal outcome, not an error.` },
    ],
  },
  playground: {
    title: 'Sign-up service',
    objective: 'Trace each sign-up to the layer that raised, translated, retried or reported it — then change the policies.',
    files: { 'main.py': MAIN_PY, 'errors.py': ERRORS_PY, 'storage.py': STORAGE_PY, 'service.py': SERVICE_PY },
    expected: py`\`\`\`text
signup ada@example.com:
WARNING signup: attempt 1 failed (mail server not responding); retrying in 0.05s
WARNING signup: attempt 2 failed (mail server not responding); retrying in 0.10s
  Welcome aboard, ada@example.com!
signup ADA@example.com:
  Sorry: ada@example.com is already registered
signup ben.example.com:
  Sorry: 'ben.example.com' is not an email address
signup cy@example.com:
ERROR app: signup crashed for 'cy@example.com'
Traceback (most recent call last):
  ...
AttributeError: 'NoneType' object has no attribute 'strip'
  Something went wrong on our side. Please try again later.
find ada: Ada | find zed: None
\`\`\``,
    experiments: [
      {
        id: 'log-rejections',
        task: py`Expected errors deserve a log line too — just not an alarm. In \`handle_signup\`'s \`except AppError\` branch, add \`logger.info("signup rejected: %s", err)\` before the \`print\`.`,
        hint: py`\`logger\` is already defined in \`main.py\`. Pass \`err\` as an argument rather than formatting the string yourself — logging formats it only if the message is actually emitted.`,
        tests: [
          { name: 'rejections are logged at INFO level', code: py`assert "INFO app: signup rejected: 'ben.example.com' is not an email address" in output` },
          { name: 'no traceback is logged for expected errors', code: py`assert output.count("Traceback") == 1, 'Only the unexpected AttributeError should log a traceback'` },
        ],
        explain: py`Different outcomes deserve different log levels: INFO for "user typed a bad email" (useful for metrics, no action needed), ERROR with traceback for "our code crashed" (someone must fix it). Logging every expected rejection at ERROR level would bury the real problems.`,
      },
      {
        id: 'optional-email',
        task: py`Change \`FlakyMailer(failures=2)\` to \`failures=5\` and run: now Ada's sign-up "crashes" — yet she **is** stored in the database! A welcome email is nice-to-have, so make it non-fatal: in \`sign_up\` (\`service.py\`), catch \`ConnectionError\` from the \`retry(...)\` call and log \`logger.warning("welcome email to %s not sent", email)\` instead.`,
        hint: py`Wrap only the \`retry(lambda: ...)\` line in \`try:\` / \`except ConnectionError:\`. Keep \`return email\` after it.`,
        tests: [
          { name: 'sign_up succeeds even when every mail attempt fails', code: py`store = UserStore()
assert sign_up(store, FlakyMailer(failures=10), "x@example.com", "xia") == "x@example.com"
assert store.find("x@example.com") == "Xia"` },
          { name: 'other errors still propagate', code: py`with raises(module("errors").InvalidEmailError):
    sign_up(UserStore(), FlakyMailer(failures=0), "nope", "Nope")` },
        ],
        explain: py`Not every failure should fail the whole operation. Decide per dependency: the database write is essential (let it raise); the welcome email is optional (log a warning, maybe queue it for later). Without that decision, a mail outage would block every sign-up — and leave users stored but told "something went wrong".`,
      },
      {
        id: 'remove-user',
        task: py`Add \`UnknownUserError(AppError)\` to \`errors.py\`, and a \`remove(email)\` method to \`UserStore\` that deletes the row and raises \`UnknownUserError\` when nothing was deleted. Why raise here, when \`find()\` returns \`None\`?`,
        hint: py`\`with self.db:\` / \`    cursor = self.db.execute("DELETE FROM users WHERE email = ?", (email,))\` — then \`if cursor.rowcount == 0: raise UnknownUserError(...)\`. Remember to import the new class in \`storage.py\`.`,
        tests: [
          { name: 'UnknownUserError is an AppError', code: py`errors = module("errors")
assert hasattr(errors, "UnknownUserError"), "Define UnknownUserError in errors.py"
assert issubclass(errors.UnknownUserError, errors.AppError)` },
          { name: 'removing an unknown user raises', code: py`with raises(module("errors").UnknownUserError):
    UserStore().remove("nobody@example.com")` },
          { name: 'removing a real user deletes them', code: py`s = UserStore()
s.add("ada@example.com", "Ada")
s.remove("ada@example.com")
assert s.find("ada@example.com") is None` },
        ],
        explain: py`\`find()\` answers a **question** ("is there such a user?"), so "no" is a normal answer: \`None\`. \`remove()\` is a **command** that assumes the user exists; if it doesn't, the caller's assumption was wrong, and silently doing nothing could hide a bug (a typo in an email, a double-submitted form). Commands that can't do their job raise.`,
      },
      {
        id: 'swallow-it',
        task: py`Replace the body of the \`except Exception:\` branch in \`handle_signup\` with just \`pass\`. Run it. What does the user see for Cy now? What would a developer see? Undo it afterwards.`,
        hint: py`Look at the output for \`cy@example.com\` before and after.`,
        explain: py`Nothing at all: no welcome, no apology, no log. Cy thinks the form is broken, support can't find any record of the failure, and the \`AttributeError\` bug survives forever. That's why "swallow" is the worst way to handle an exception — worse than crashing, which at least tells someone.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'LBYL vs EAFP for opening a file',
    props: {
      left: {
        label: 'LBYL — look before you leap',
        lang: 'python',
        code: py`import os


def read_settings(path):
    if not os.path.exists(path):     # 1. check...
        return {}
    with open(path) as f:            # 2. ...then act
        return parse(f.read())       #    (the file may be gone by now!)`,
      },
      right: {
        label: 'EAFP — easier to ask forgiveness',
        lang: 'python',
        code: py`def read_settings(path):
    try:
        with open(path) as f:        # just do it
            text = f.read()
    except FileNotFoundError:        # handle the failure we expect
        return {}
    return parse(text)`,
      },
      points: [
        'LBYL has a gap between the check and the open: if another process deletes the file in between, open() still raises — the check gave false confidence (a TOCTOU race).',
        'EAFP asks the operating system once; the answer can\'t go stale.',
        'EAFP catches exactly FileNotFoundError, so a PermissionError or a bug in parse() still surfaces — the try block is kept small for that reason.',
        'LBYL is fine when failure is common and the check is cheap and race-free, e.g. counts.get(word, 0) on your own dict.',
      ],
    },
    alt: 'Side-by-side code. Left: read_settings checks os.path.exists, then opens the file, with a note that the file may have disappeared in between. Right: read_settings tries to open the file and catches FileNotFoundError, returning an empty dict.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`There are two questions in every error-handling decision: **who should know** about this problem, and **what can they do** about it?`,
      py`- The user should know what *they* can fix ("that email is taken").
- The developer should know everything (exception type, message, traceback, inputs).
- Code in the middle should usually stay out of the way and let the error travel up.`,
      py`If you find yourself writing \`except\` in a function that can't fix the problem and can't explain it to anyone, you're probably in the wrong layer.`,
    ],
    technical: [
      py`**Why EAFP avoids races.** Checking (\`os.path.exists\`, \`key in shared_dict\`) and acting (\`open\`, \`shared_dict[key]\`) are separate steps. Between them, another thread, process, or the user can change the world. The [glossary](https://docs.python.org/3/glossary.html#term-LBYL) calls this out explicitly for multi-threaded code. With EAFP the action itself is the check — the OS or the dict reports the truth at the moment it matters.`,
      py`**What \`logger.exception\` really does.** It's \`logger.error(msg, *args, exc_info=True)\`. With \`exc_info=True\`, logging calls \`sys.exc_info()\` to fetch the exception being handled and formats its traceback (including chained causes). Called **outside** a handler, there's no exception, and the log just says \`NoneType: None\`.`,
      py`**How \`suppress\` works.** \`contextlib.suppress(FileNotFoundError)\` is a context manager whose \`__exit__\` returns \`True\` when the exception matches — and returning true from \`__exit__\` tells Python "handled, carry on after the \`with\`". Like \`except\`, it skips the rest of the block. (Since 3.12 it also handles matching exceptions inside an \`ExceptionGroup\` — see [exception groups](lesson:exception-groups).)`,
      { code: py`from contextlib import suppress

data = {"a": 1}
with suppress(KeyError):
    print("before")
    data["b"]           # raises KeyError → the rest of the block is skipped
    print("after")      # never runs
print("done")`, lang: 'python', title: 'suppress skips the rest of the block' },
      py`**Exponential backoff.** Waiting \`base * 2**(n-1)\` between attempts (0.5 s, 1 s, 2 s, …) gives a struggling service more and more breathing room. *Jitter* — randomising each delay, e.g. \`random.uniform(0, delay)\` — prevents many clients that failed at the same moment from retrying at the same moment. Always combine with a maximum number of attempts or a deadline.`,
      { callout: 'note', title: 'CPython detail: cost of try vs raise', text: py`Since CPython 3.11, a \`try\` block that doesn't raise costs almost nothing ("zero-cost" exception tables). *Raising* and catching is comparatively expensive: an exception object and traceback are created. So EAFP is cheap when failures are rare, and LBYL (\`dict.get\`, \`in\`) is better in a hot loop where misses are frequent. Measure with \`timeit\` if it matters — see [profiling](lesson:profiling).` },
    ],
    production: [
      py`**One error boundary per entry point.** Web frameworks have error middleware/handlers; CLIs have \`main()\`; job queues have a worker loop. That's where \`except Exception\` belongs, together with logging, metrics and a safe response (HTTP 500, exit code 1, a failed-job record). See [building APIs](lesson:building-apis).`,
      py`**Log once.** If every layer logs before re-raising, one incident produces five log entries with five partial tracebacks. Log at the boundary where the error is finally handled; lower layers add context with \`raise … from\` or \`err.add_note(...)\` (3.11+).`,
      py`**Error trackers** (e.g. Sentry, third-party) hook into logging or the top-level handler, group exceptions by type and stack, and alert on new ones. They work only if exceptions reach them — another reason never to swallow.`,
      py`**Map domain errors to responses in one place.** A dict like \`{EmailTakenError: 409, InvalidEmailError: 400}\` (or a \`status\` attribute on the exception class) at the boundary keeps HTTP knowledge out of the business logic.`,
      py`**Partial failure is a design decision.** For each dependency decide: essential (fail the operation), optional (degrade and log a warning), or deferrable (queue for retry later). Write that decision down in code, as in the \`optional-email\` experiment.`,
      py`**Retries need idempotency.** Retrying a GET is safe; retrying "charge £20" may charge twice. Payment and order APIs use *idempotency keys* so a repeated request is recognised and not executed again ([HTTP & REST](lesson:http-and-rest)).`,
    ],
  },
  mistakes: [
    {
      title: 'Swallowing errors',
      wrong: { code: py`def save_order(order):
    try:
        db.insert(order)
    except Exception:
        return None          # the order is lost and nobody knows`, lang: 'python', static: true },
      right: { code: py`def save_order(order):
    db.insert(order)         # let it propagate to a boundary that logs and reports it`, lang: 'python', static: true },
      explanation: py`If a function can't recover, catching the exception only destroys information. Let it reach a boundary that logs the traceback and tells the user. Ignore an error only when you can explain in one sentence why ignoring it is correct — then use a narrow type and \`contextlib.suppress\`.`,
    },
    {
      title: 'Check-then-act races (LBYL on shared state)',
      wrong: { code: py`import os

def read_report(path):
    if os.path.exists(path):
        with open(path) as f:       # may still raise FileNotFoundError
            return f.read()
    return None`, lang: 'python' },
      right: { code: py`def read_report(path):
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        return None`, lang: 'python' },
      explanation: py`The file system is shared with other programs. Between \`exists()\` and \`open()\` the file can disappear, so the LBYL version can crash anyway — just rarely, which makes it a nasty intermittent bug.`,
    },
    {
      title: 'Logging without the traceback',
      wrong: { code: py`try:
    sync_inventory()
except Exception as err:
    logger.error(f"sync failed: {err}")     # "sync failed: 'sku'" — which line? which key?`, lang: 'python', static: true },
      right: { code: py`try:
    sync_inventory()
except Exception:
    logger.exception("sync failed")         # message + full traceback`, lang: 'python', static: true },
      explanation: py`\`str(err)\` for a \`KeyError\` is just the key: \`'sku'\`. Without the traceback you don't know which function, which line or which call path. \`logger.exception\` (or \`exc_info=True\`) records it all.`,
    },
    {
      title: 'Catching low-level exceptions in high-level code',
      wrong: { code: py`# in the web handler
try:
    store.add(email, name)
except sqlite3.IntegrityError:
    return "Email already taken", 409`, lang: 'python', static: true },
      right: { code: py`# in the storage layer
except sqlite3.IntegrityError as err:
    raise EmailTakenError(f"{email} is already registered") from err

# in the web handler
except EmailTakenError as err:
    return str(err), 409`, lang: 'python', static: true },
      explanation: py`If the handler catches SQLite exceptions, switching to PostgreSQL means editing every handler. Translate at the edge of the storage layer so the rest of the code speaks your domain's language.`,
    },
    {
      title: 'Retrying everything, forever',
      wrong: { code: py`while True:
    try:
        return fetch_price(sku)
    except Exception:
        time.sleep(1)        # retries bugs and bad input too, never gives up`, lang: 'python', static: true },
      right: { code: py`return retry(lambda: fetch_price(sku), attempts=4, retry_on=(ConnectionError, TimeoutError))`, lang: 'python', static: true },
      explanation: py`Retry only **transient** errors (timeouts, dropped connections, 429/503 responses), a bounded number of times, with growing delays. A \`ValueError\` or a 404 will fail identically every time; retrying it just delays the real error message.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'NoneType' object is not subscriptable (far from where anything went wrong)`,
      cause: py`A function returned \`None\` to signal failure (or swallowed an exception and fell off the end), and the caller used the result without checking.`,
      fix: py`Find where the \`None\` came from (print or debug the producing call). Make that function raise instead, or check for \`None\` explicitly if "nothing" is a documented outcome.`,
    },
    {
      symptom: py`ERROR app: signup crashed — but no traceback in the log`,
      cause: py`The handler used \`logger.error(...)\` without \`exc_info=True\`.`,
      fix: py`Use \`logger.exception(...)\` inside the \`except\` block (or pass \`exc_info=True\`).`,
    },
    {
      symptom: py`The same failure appears four times in the logs, each with a slightly different traceback.`,
      cause: py`Several layers each log the exception and re-raise it.`,
      fix: py`Log once, at the boundary that finally handles it. Lower layers add context with \`raise … from\` or \`add_note()\` instead of logging.`,
    },
    {
      symptom: py`Users see "sqlite3.IntegrityError: UNIQUE constraint failed: users.email".`,
      cause: py`A low-level exception escaped to the presentation layer untranslated (or the boundary prints \`str(err)\` for every exception).`,
      fix: py`Translate it in the storage layer (\`raise EmailTakenError(...) from err\`), and at the boundary only show messages from your own user-facing exception classes.`,
    },
    {
      symptom: py`When the mail server is down, every request takes ages and then fails anyway.`,
      cause: py`A retry loop with too many attempts, no cap on the delay, or no deadline — every request waits out the full schedule.`,
      fix: py`Limit attempts and total time, add jitter, and consider failing fast (or degrading) for optional dependencies.`,
    },
  ],
  bestPractices: [
    'Prefer EAFP for operations on shared resources (files, network, shared dicts); use LBYL for cheap, race-free checks where failure is common.',
    'Keep try blocks small and catch the narrowest exception that represents the failure you expect.',
    'Raise in low-level code, translate foreign exceptions at layer edges (raise … from err), catch at boundaries.',
    'Never swallow: either handle, re-raise, or suppress one specific type deliberately with contextlib.suppress.',
    'Log unexpected errors once, with logger.exception (traceback included); log expected rejections at INFO/WARNING.',
    'Release resources with with-statements (or finally) so clean-up happens on every path.',
    'Return None only for "not found"-style outcomes you document; raise when a function cannot do its job.',
    'Retry only transient errors, a bounded number of times, with backoff — and only idempotent operations.',
  ],
  whenToUse: {
    use: [
      'EAFP: opening files, network calls, converting input, dict access on shared or untrusted data.',
      'Boundary catch-all (except Exception + logger.exception): web handlers, CLI main(), job-queue workers.',
      'Result objects: batch processing and validation where you want every error, not just the first.',
      'Retries: timeouts, dropped connections, rate limits and 5xx responses from remote services.',
    ],
    avoid: [
      'except Exception deep inside business logic — it hides bugs from the boundary that would log them.',
      'LBYL checks on resources other processes can change (exists() then open()).',
      'Returning None or error codes from functions whose failure callers must not ignore.',
      'Retrying bad input, authentication failures, 404s or non-idempotent operations.',
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'error-handling-patterns-q1',
      type: 'mcq',
      prompt: 'Which snippet is written in the **EAFP** style?',
      options: [
        { text: 'if key in prices: total += prices[key]', why: 'That checks first (look before you leap) — LBYL.' },
        { text: 'if os.path.exists(p): data = open(p).read()', why: 'Checking existence before opening is the classic LBYL pattern (and has a race).' },
        'try: total += prices[key]\nexcept KeyError: missing.append(key)',
        { text: 'if isinstance(src, str): src = open(src)', why: 'A type check before acting is LBYL; EAFP would just use the object and handle the failure.' },
      ],
      answer: 2,
      explanation: py`EAFP = "easier to ask forgiveness than permission": attempt the operation, handle the specific exception if it fails. The other three all check first.`,
    },
    {
      id: 'error-handling-patterns-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from contextlib import suppress

data = {"a": 1}
with suppress(KeyError):
    print("before")
    data["b"]
    print("after")
print("done")`,
      answer: py`before
done`,
      explanation: py`\`suppress\` works like \`try/except KeyError: pass\` around the whole block: the \`KeyError\` stops the block immediately (so "after" never prints), then execution continues after the \`with\`.`,
    },
    {
      id: 'error-handling-patterns-q3',
      type: 'bug',
      prompt: 'Another process sometimes deletes report files. This function occasionally crashes with `FileNotFoundError` even though it "checks first". Click the line that introduces the race.',
      code: py`import os

def read_report(path):
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return f.read()`,
      answerLine: 4,
      explanation: py`The check on line 4 can be true, and the file can be deleted before line 6 opens it (time-of-check to time-of-use). Remove the check and catch \`FileNotFoundError\` around \`open()\` instead.`,
    },
    {
      id: 'error-handling-patterns-q4',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`calls = 0

def flaky():
    global calls
    calls += 1
    if calls < 3:
        raise ConnectionError("down")
    return "ok"

for attempt in range(1, 4):
    try:
        result = flaky()
    except ConnectionError:
        print("retry", attempt)
    else:
        print(result, "after", calls, "calls")
        break`,
      options: [
        'retry 1\nretry 2\nok after 3 calls',
        { text: 'retry 1\nretry 2\nretry 3', why: 'The third call succeeds (calls is 3, so the if is false), so the else branch runs instead of the handler.' },
        { text: 'ok after 1 calls', why: 'The first two calls raise ConnectionError, because calls is 1 and then 2 (both < 3).' },
        { text: 'retry 1\nok after 2 calls', why: 'The second call still has calls == 2, which is < 3, so it raises too.' },
      ],
      answer: 0,
      explanation: py`Calls 1 and 2 raise and are caught ("retry 1", "retry 2"). Call 3 returns "ok", the \`else\` branch prints and \`break\` leaves the loop.`,
    },
    {
      id: 'error-handling-patterns-q5',
      type: 'fill',
      prompt: 'Log the failure **with its traceback**, then pass the same exception on to the caller.',
      code: py`try:
    charge(order)
except PaymentError:
    logger.___("payment failed for order %s", order.id)
    ___`,
      answer: [['exception'], ['raise']],
      explanation: py`\`logger.exception\` logs at ERROR level with the current traceback; a bare \`raise\` re-raises the exception unchanged. (Only do both if this is the place that logs — otherwise you'll log the same error twice.)`,
    },
    {
      id: 'error-handling-patterns-q6',
      type: 'mcq',
      prompt: 'In a command-line tool, where should exceptions be turned into user-facing messages and exit codes?',
      options: [
        { text: 'In every function, right where the error happens', why: 'Low-level functions do not know how the program is being used, so they cannot choose a good message or exit code — and catching everywhere hides errors from each other.' },
        'In main() (the entry point), which catches the tool\'s expected errors and anything unexpected',
        { text: 'Nowhere: let Python print the traceback', why: 'Tracebacks are for developers. Users of a CLI should get a clear message and a non-zero exit code for expected problems.' },
        { text: 'In the exception classes\' __init__ methods', why: 'Exceptions should be passive data; printing or exiting from __init__ would happen even when a caller meant to handle the error.' },
      ],
      answer: 1,
      explanation: py`\`main()\` is the boundary: it knows a human is reading. It catches expected errors (bad arguments, missing file) → message + \`sys.exit(1)\`/\`2\`, and catches \`Exception\` once to log a traceback. See [command-line programs](lesson:command-line-programs).`,
    },
    {
      id: 'error-handling-patterns-q7',
      type: 'short',
      prompt: 'When is it better for a function to return `None` than to raise an exception? Give an example of each.',
      answer: py`Return None when "nothing" is a normal, expected answer to a question and the function is documented that way — e.g. find_user(email) or dict.get(key), where a missing user/key is common and callers naturally check for it. Raise when the function cannot do what its name promises — e.g. load_config(path) when the file is unreadable, or remove_user(email) when the user doesn't exist — because a returned None would be easy to ignore and would cause a confusing failure later.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'eafp-counter',
      title: 'A visit counter, EAFP style',
      difficulty: 'intermediate',
      prompt: py`\`read_counter(path)\` returns the integer stored in a text file. The starter uses LBYL (\`os.path.exists\`) and crashes with an unhelpful error on a corrupt file. Rewrite it in **EAFP** style:

- File missing → return \`0\` (catch \`FileNotFoundError\`; **don't** call \`exists()\`).
- File contains something that isn't an integer → raise \`ValueError\` with a message starting \`corrupt counter file\` and including the path, **chained** (\`from err\`) to the original error. Don't silently return 0 — that would hide data corruption.
- Surrounding whitespace/newlines are fine (\`int()\` ignores them).

\`increment(path)\` (already written) uses \`read_counter\`, so it should start working for missing files too.`,
      files: {
        'main.py': py`import os


def read_counter(path):
    """Return the int stored in path; 0 if the file doesn't exist."""
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return int(f.read())
    return 0


def increment(path):
    value = read_counter(path) + 1
    with open(path, "w", encoding="utf-8") as f:
        f.write(str(value))
    return value


print("visits:", read_counter("visits.txt"))
print("missing:", read_counter("missing.txt"))
`,
        'visits.txt': py`41
`,
      },
      hints: [
        'Use two small try blocks: one around reading the file, one around int().',
        'except FileNotFoundError: return 0 — and keep the int() conversion outside that first try, so a ValueError is not mistaken for a missing file.',
        'try:\n    return int(text)\nexcept ValueError as err:\n    raise ValueError(f"corrupt counter file {path!r}: {text!r}") from err',
      ],
      solution: {
        explanation: py`Opening the file *is* the existence check, so there's no window for another process to delete it between "check" and "use". Each \`try\` protects one operation with one meaning: \`FileNotFoundError\` means "no visits yet" (a normal outcome → \`0\`), while a \`ValueError\` from \`int()\` means the data is damaged — a real problem, so it's re-raised with a clearer message and the original chained as the cause. Returning \`0\` there would quietly reset the counter and hide the corruption.`,
        files: {
          'main.py': py`def read_counter(path):
    """Return the int stored in path; 0 if the file doesn't exist."""
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        return 0
    try:
        return int(text)
    except ValueError as err:
        raise ValueError(f"corrupt counter file {path!r}: {text!r}") from err


def increment(path):
    value = read_counter(path) + 1
    with open(path, "w", encoding="utf-8") as f:
        f.write(str(value))
    return value


print("visits:", read_counter("visits.txt"))
print("missing:", read_counter("missing.txt"))
`,
          'visits.txt': py`41
`,
        },
      },
      tests: [
        { name: 'reads an existing counter', code: py`assert read_counter("visits.txt") == 41` },
        { name: 'a missing file counts as 0', code: py`assert read_counter("no-such-counter.txt") == 0` },
        { name: 'increment works for new and existing files', code: py`assert increment("visits.txt") == 42
assert increment("fresh.txt") == 1
with open("fresh.txt", encoding="utf-8") as f:
    assert f.read() == "1"` },
        { name: 'a corrupt file raises a chained ValueError', code: py`with open("broken.txt", "w", encoding="utf-8") as f:
    f.write("forty-one")
with raises(ValueError, match="^corrupt counter file 'broken.txt'") as caught:
    read_counter("broken.txt")
assert isinstance(caught.value.__cause__, ValueError), 'Chain the int() error with "from err"'` },
        { name: 'uses EAFP (no exists() check)', code: py`assert "exists(" not in files["main.py"], "Remove the os.path.exists() check and catch FileNotFoundError instead"` },
      ],
    },
    {
      id: 'retry-backoff',
      title: 'Retry with exponential backoff (simplified)',
      difficulty: 'intermediate',
      prompt: py`Write \`retry(func, attempts=3, base_delay=1.0, sleep=time.sleep)\`:

- Call \`func()\` and return its result as soon as it succeeds.
- If it raises \`ConnectionError\` or \`TimeoutError\`, call \`sleep(delay)\` and try again. Delays double each time: \`base_delay\`, \`base_delay * 2\`, \`base_delay * 4\`, …
- Make at most \`attempts\` calls in total. If the last one fails, **re-raise** that exception. Don't sleep after the final attempt.
- Any **other** exception must propagate immediately, without retrying or sleeping.

The \`sleep\` parameter lets the tests pass a fake that records the delays instead of waiting. (This is a **simplified** retry: production code adds jitter, a maximum delay and an overall deadline.)`,
      files: {
        'main.py': py`import time


def retry(func, attempts=3, base_delay=1.0, sleep=time.sleep):
    """Call func(); on ConnectionError/TimeoutError wait and try again (simplified)."""
    # TODO
    return func()


print(retry(lambda: "worked first time"))
`,
      },
      hints: [
        'Loop with for attempt in range(1, attempts + 1) and return func() inside a try.',
        'except (ConnectionError, TimeoutError): — if attempt == attempts, re-raise with a bare raise; otherwise sleep.',
        'The delay for attempt n (counting from 1) is base_delay * 2 ** (attempt - 1).',
      ],
      solution: {
        explanation: py`The loop makes at most \`attempts\` calls. A successful call returns straight out of the loop. Only the two transient exception types are caught; anything else (a \`ValueError\`, a bug) propagates on the first call. On the final failure a bare \`raise\` re-raises the real exception with its traceback — callers must see *why* it failed, not a vague "retries exhausted". Injecting \`sleep\` is a small design trick that makes time-based code testable instantly (the same idea as dependency injection — see [mocking](lesson:mocking)).`,
        files: {
          'main.py': py`import time


def retry(func, attempts=3, base_delay=1.0, sleep=time.sleep):
    """Call func(); on ConnectionError/TimeoutError wait and try again (simplified)."""
    for attempt in range(1, attempts + 1):
        try:
            return func()
        except (ConnectionError, TimeoutError):
            if attempt == attempts:
                raise
            sleep(base_delay * 2 ** (attempt - 1))


print(retry(lambda: "worked first time"))
`,
        },
      },
      tests: [
        { name: 'returns immediately on success', code: py`delays = []
assert retry(lambda: 42, sleep=delays.append) == 42
assert delays == []` },
        { name: 'retries with doubling delays until it succeeds', code: py`delays, calls = [], []

def flaky():
    calls.append(1)
    if len(calls) < 3:
        raise ConnectionError("down")
    return "ok"

assert retry(flaky, attempts=5, base_delay=0.5, sleep=delays.append) == "ok"
assert delays == [0.5, 1.0]` },
        { name: 'gives up after the last attempt and re-raises', code: py`delays, calls = [], []

def always_down():
    calls.append(1)
    raise TimeoutError("still down")

with raises(TimeoutError, match="still down"):
    retry(always_down, attempts=3, base_delay=1.0, sleep=delays.append)
assert len(calls) == 3
assert delays == [1.0, 2.0], "no sleep after the final attempt"` },
        { name: 'does not retry other errors', code: py`delays, calls = [], []

def bad_input():
    calls.append(1)
    raise ValueError("bad sku")

with raises(ValueError):
    retry(bad_input, attempts=5, sleep=delays.append)
assert len(calls) == 1 and delays == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'error-handling-patterns-eafp-lbyl',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 4,
      question: 'What are EAFP and LBYL, and which does Python prefer? When would you use the other one?',
      answer: 'LBYL checks preconditions before acting; EAFP acts and handles the exception if it fails. Python generally prefers EAFP: no race between check and use, no duplicated work, and it fits duck typing. LBYL is better when failure is common and the check is cheap and race-free (dict.get, in on local data).',
      explanation: py`The Python glossary defines both and notes LBYL's race condition in multi-threaded code. EAFP's costs: raising is relatively expensive, and a too-wide \`try\` can hide bugs — so keep the \`try\` tiny and catch one specific exception.`,
      code: { lang: 'python', code: py`counts = {}
for word in "the cat and the hat".split():
    counts[word] = counts.get(word, 0) + 1     # LBYL-ish: misses are common here
print(counts)


def first_line(path):
    try:                                       # EAFP: the file system is shared
        with open(path) as f:
            return f.readline()
    except FileNotFoundError:
        return ""` },
      whyAsked: 'A classic "is this person Pythonic?" question that also probes understanding of race conditions and exception cost.',
      mistakes: ['Saying EAFP is always better', 'Not mentioning the race condition', 'Using a giant try block as "EAFP"'],
      followUps: ['What is TOCTOU?', 'Is EAFP slower?', 'How does EAFP relate to duck typing?'],
      modelAnswer: 'LBYL means look before you leap: check that something will work, then do it. EAFP means try it and handle the specific exception if it fails. Python usually prefers EAFP for three reasons: there is no race between the check and the action — a file can vanish after exists() returns True — the check often duplicates the real work, and it fits duck typing because you just use the object. LBYL still wins when failure is frequent and the check is cheap and safe, like dict.get on my own data, because raising exceptions is relatively expensive. Either way I keep try blocks small and catch one specific exception.',
    },
    {
      id: 'error-handling-patterns-layers',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 6,
      question: 'In a web service with a repository, a service layer and HTTP handlers, where do you catch which exceptions?',
      answer: 'Repository: translate driver exceptions into domain ones (raise DuplicateEmailError from err) and manage transactions. Service: raise domain errors for rule violations; usually don\'t catch, except to roll back/retry and re-raise. Handlers/middleware: map domain errors to HTTP responses (409, 404, 400) and have one catch-all that logs with traceback and returns 500.',
      explanation: py`This keeps each layer replaceable: swapping SQLite for PostgreSQL only touches the repository; adding a CLI next to the HTTP API only adds a new boundary. The mapping from domain errors to status codes lives in one place, not in every endpoint. See [clean architecture](lesson:clean-architecture).`,
      code: { lang: 'python', code: py`STATUS_FOR = {"EmailTakenError": 409, "InvalidEmailError": 400, "UnknownUserError": 404}


def error_response(err):
    """Boundary helper: domain error -> (status, body)."""
    status = STATUS_FOR.get(type(err).__name__)
    if status is None:
        return 500, {"error": "internal error"}      # details go to the logs, not the client
    return status, {"error": str(err)}


class EmailTakenError(Exception):
    pass


print(error_response(EmailTakenError("ada@example.com is already registered")))
print(error_response(KeyError("sku")))` },
      whyAsked: 'Tests system-design thinking about errors: separation of concerns, leaking abstractions, and observability.',
      mistakes: ['Catching sqlite/HTTP-library exceptions in handlers', 'Returning error strings from the service layer', 'Sending tracebacks or internal messages to clients'],
      followUps: ['How would you avoid logging the same error in every layer?', 'Where do retries belong?', 'How do you test the mapping?'],
      modelAnswer: 'Each layer handles what it understands. The repository talks to the database, so it translates driver exceptions — an IntegrityError becomes EmailTakenError, raised from the original — and owns transactions. The service layer enforces business rules and raises domain errors; it rarely catches anything except to roll back or retry and then re-raise. The HTTP layer is the boundary: a central error handler maps domain errors to status codes like 409 or 404, and a single catch-all logs unexpected exceptions with logger.exception and returns a generic 500 without leaking details. That keeps the layers independent and every error logged exactly once.',
    },
    {
      id: 'error-handling-patterns-missing-orders',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Customers report that some orders "disappear": they get a confirmation page, but the order is never stored. There are no errors in the logs. The save code is below. What do you suspect and how do you fix it?',
      code: { lang: 'python', code: py`def save_order(order):
    try:
        db.insert("orders", order)
        mailer.send_confirmation(order)
    except Exception:
        pass
    return render("confirmation.html", order=order)` },
      answer: 'The except Exception: pass swallows every failure of the insert (and the mail), so the confirmation renders regardless and nothing is logged. Remove the blanket handler; let insert failures propagate to the boundary (which logs with traceback and shows an error page); handle the optional mail failure separately with a warning log.',
      explanation: py`Silent failure is the worst failure mode: the user is told it worked, and operators have no evidence. Separate essential steps (the insert — must succeed) from optional ones (the email — degrade and log).`,
      whyAsked: 'Swallowed exceptions are among the most damaging real-world bugs; interviewers look for both the diagnosis and a principled fix.',
      mistakes: ['Adding a print inside except and keeping pass semantics', 'Wrapping both steps in one try even after the fix', 'Only fixing logging but still rendering the confirmation'],
      followUps: ['What if the insert succeeds but the mail fails?', 'How would you detect this class of bug automatically (linters: Ruff BLE001 / S110)?', 'How would you test it?'],
      modelAnswer: 'The blanket except Exception: pass catches any failure of the insert — a constraint violation, a lost connection, a bug — throws it away without logging, and then the code renders the confirmation anyway. So users are told the order succeeded and there is no trace of the failure. I would remove that handler so database errors propagate to the request boundary, which logs them with logger.exception and shows an error page. The confirmation email is optional, so I would wrap only that call, catch the mail library\'s specific errors and log a warning, perhaps queueing a resend. I would also enable a linter rule that flags blind excepts.',
    },
    {
      id: 'error-handling-patterns-retry-design',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 6,
      question: 'Your service calls a payment provider that occasionally times out. A colleague proposes wrapping the charge call in `while True: try … except Exception: sleep(1)`. What problems do you see, and what would you do instead?',
      answer: 'It retries non-transient errors (declines, bugs) forever, has no backoff or jitter (thundering herd), no deadline, and — critically — retrying a non-idempotent charge after a timeout can double-charge, because a timeout doesn\'t mean the charge failed. Instead: retry only transient errors, bounded attempts with exponential backoff + jitter and an overall deadline, use the provider\'s idempotency keys, and surface the final error.',
      explanation: py`A timeout is *unknown outcome*, not failure: the provider may have processed the charge. Idempotency keys let you safely repeat the request — the provider returns the original result instead of charging again. For dependencies that are down for longer, a *circuit breaker* stops calling them for a while instead of piling up retries.`,
      code: { lang: 'python', code: py`import random


def backoff_delays(attempts, base=0.5, cap=8.0):
    """Exponential backoff with 'full jitter' (simplified illustration)."""
    for attempt in range(attempts - 1):
        yield random.uniform(0, min(cap, base * 2 ** attempt))


random.seed(1)
print([round(d, 2) for d in backoff_delays(5)])` },
      whyAsked: 'Retry design is a common source of production incidents; it tests reasoning about idempotency, load and failure semantics.',
      mistakes: ['Only suggesting "add a max attempts"', 'Not realising a timeout may have succeeded', 'Retrying 4xx errors'],
      followUps: ['What is an idempotency key?', 'What is a circuit breaker?', 'Where should retries live — client library, service, or caller?'],
      modelAnswer: 'That loop has several problems. It catches Exception, so it retries card declines and plain bugs forever. It has no backoff or jitter, so during an outage every instance hammers the provider in lock-step, and no deadline, so requests hang. Worst, a timeout does not mean the charge failed — it may have gone through — so blindly retrying a non-idempotent charge can bill the customer twice. I would retry only transient errors like timeouts and 503s, with a small number of attempts, exponential backoff with jitter and an overall deadline, and send an idempotency key so the provider recognises repeats. After the final attempt I re-raise so the boundary can report it, and for longer outages I would add a circuit breaker.',
    },
    {
      id: 'error-handling-patterns-none-or-raise',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you decide whether a function should return None or raise when it can\'t produce a result?',
      answer: 'If "no result" is a normal answer to a question (find, get, match), return None and document it. If the function can\'t do what its name promises (load, save, charge, remove), raise. Queries may return None; commands that fail must raise.',
      explanation: py`The standard library follows this: \`dict.get\` and \`re.match\` return \`None\`, while \`dict[key]\`, \`open()\` and \`int()\` raise. Returning \`None\` from a command lets callers ignore the failure accidentally; the bug then appears later as \`'NoneType' object has no attribute …\`. Type hints (\`-> User | None\`) make the \`None\` case visible to checkers ([type hints](lesson:typing-collections-and-unions)).`,
      whyAsked: 'API-design judgement; also probes awareness of how stdlib APIs are shaped.',
      mistakes: ['Always returning None "to be safe"', 'Raising for completely normal outcomes like "no search results"'],
      followUps: ['What about returning a default value?', 'How do Optional type hints help?', 'When would a result object be better than both?'],
      modelAnswer: 'I look at whether the function asks a question or performs a command. For a question like find_user, "nobody" is a perfectly normal answer, so returning None — documented and typed as User or None — is fine; dict.get and re.match work that way. For a command like save_order or remove_user, failing means the function could not do its job, so it raises; a returned None would be easy to ignore and the bug would surface later somewhere unrelated. For batch work where I want every outcome, I might return a result object instead.',
    },
    {
      id: 'error-handling-patterns-batch',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: py`Import rows like \`"pen,3"\`. \`parse_row(row)\` (given) returns \`(name, qty)\` or raises \`ValueError\`. Write \`process_batch(rows)\` that returns a \`BatchResult\` with \`ok\` (list of parsed tuples) and \`errors\` (list of \`(line_number, message)\`, numbered from 1) — collecting **every** bad row instead of stopping at the first. Programming errors (anything that isn't a \`ValueError\`, e.g. a \`None\` row) must still raise.`,
      answer: 'Loop with enumerate(rows, start=1); try parse_row(row) and append to ok; except ValueError as err: append (number, str(err)) to errors; return the result.',
      explanation: py`A result object fits batch work: users want a report of every bad line, not a crash on line 2. Catching only \`ValueError\` keeps the boundary honest — bad *data* is collected, while a *bug* (an \`AttributeError\` from a \`None\` row) still raises loudly.`,
      starter: { files: { 'main.py': py`from dataclasses import dataclass, field


@dataclass
class BatchResult:
    ok: list = field(default_factory=list)
    errors: list = field(default_factory=list)


def parse_row(row):
    name, qty_text = row.split(",")
    qty = int(qty_text)
    if qty < 0:
        raise ValueError(f"negative quantity {qty}")
    return name.strip(), qty


def process_batch(rows):
    """Parse every row; collect ValueErrors as (line_number, message)."""
    # TODO: this stops at the first bad row
    return BatchResult(ok=[parse_row(row) for row in rows])


print(process_batch(["pen,3", "ink,2"]))
` } },
      tests: [
        { name: 'all good rows', code: py`result = process_batch(["pen,3", "ink,2"])
assert result.ok == [("pen", 3), ("ink", 2)]
assert result.errors == []` },
        { name: 'collects every bad row with its line number', code: py`result = process_batch(["pen,3", "bad", "book,x", "bag,-1", "ink,2"])
assert result.ok == [("pen", 3), ("ink", 2)]
assert [number for number, _ in result.errors] == [2, 3, 4]` },
        { name: 'keeps the error messages', code: py`result = process_batch(["bag,-1"])
assert result.errors == [(1, "negative quantity -1")]` },
        { name: 'programming errors still raise', code: py`with raises(AttributeError):
    process_batch(["pen,3", None])` },
      ],
      solution: { files: { 'main.py': py`from dataclasses import dataclass, field


@dataclass
class BatchResult:
    ok: list = field(default_factory=list)
    errors: list = field(default_factory=list)


def parse_row(row):
    name, qty_text = row.split(",")
    qty = int(qty_text)
    if qty < 0:
        raise ValueError(f"negative quantity {qty}")
    return name.strip(), qty


def process_batch(rows):
    """Parse every row; collect ValueErrors as (line_number, message)."""
    result = BatchResult()
    for number, row in enumerate(rows, start=1):
        try:
            result.ok.append(parse_row(row))
        except ValueError as err:
            result.errors.append((number, str(err)))
    return result


print(process_batch(["pen,3", "bad", "book,x", "bag,-1", "ink,2"]))
` } },
      hints: ['Create an empty BatchResult() first and fill it in a loop.', 'Use enumerate(rows, start=1) to get line numbers.', 'Catch only ValueError — let anything else propagate.'],
      whyAsked: 'Tests whether you can choose a non-exception error-reporting style when it fits, without hiding bugs.',
      mistakes: ['Catching Exception and recording bugs as "bad rows"', 'Stopping at the first error', 'Losing the line numbers'],
      followUps: ['How would you cap the number of errors collected?', 'How would ExceptionGroup offer an alternative?', 'How would you report this to a user?'],
      modelAnswer: 'I create an empty BatchResult, loop over the rows with enumerate starting at 1, and call parse_row inside a small try. Success appends to ok; a ValueError appends the line number and message to errors and the loop continues, so the user gets a full report instead of failing on the first bad line. I deliberately catch only ValueError: that is how parse_row signals bad data, while anything else — like an AttributeError from a None row — is a bug and should still crash loudly.',
    },
  ],

  takeaways: [
    'EAFP (try, then handle the specific exception) is the Pythonic default for shared resources; it avoids check-then-act races (TOCTOU). Use LBYL for cheap, race-free checks where misses are common.',
    'Raise low, catch high: translate foreign exceptions at layer edges with raise … from err, and handle errors at boundaries (CLI main, request handlers, workers).',
    'Never swallow errors. Ignore one specific exception deliberately with contextlib.suppress, or let it propagate.',
    'Log unexpected errors once, at the boundary, with logger.exception so the traceback is kept; log expected rejections at a lower level.',
    'Release resources with with-statements (or finally) so clean-up runs on every path.',
    'Return None for documented "not found" answers, raise when a command cannot do its job, and use result objects to collect many outcomes.',
    'Retry only transient errors, a bounded number of times, with backoff (plus jitter and a deadline in production) — and only idempotent operations.',
  ],
}
