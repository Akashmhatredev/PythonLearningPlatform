// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP_MAIN = py`import logging

import inventory
import payments

# In the entry script __name__ is "__main__", so this logger gets a real name
logger = logging.getLogger("shop")

ORDERS = [
    {"id": 101, "item": "tea", "qty": 2, "card": "4111111111111111"},
    {"id": 102, "item": "mug", "qty": 9, "card": "5555555555554444"},
    {"id": 103, "item": "cake", "qty": 1, "card": "4000000000000002"},
]


def process(order):
    logger.info("processing order %s", order["id"])
    logger.debug("order details: %s x %d", order["item"], order["qty"])
    if not inventory.reserve(order["item"], order["qty"]):
        return False
    amount = inventory.price(order["item"]) * order["qty"]
    return payments.charge(order["card"], amount)


def main():
    # Configure logging ONCE, at the program's entry point
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)-8s %(name)-9s %(message)s",
    )
    completed = sum(process(order) for order in ORDERS)
    print(f"{completed} of {len(ORDERS)} orders completed")


if __name__ == "__main__":
    main()
`

const SHOP_INVENTORY = py`import logging

logger = logging.getLogger(__name__)   # the module's name: "inventory"

STOCK = {"tea": 10, "mug": 4, "cake": 1}
PRICES = {"tea": 3.5, "mug": 8.0, "cake": 12.0}


def price(item):
    return PRICES[item]


def reserve(item, qty):
    logger.debug("checking stock for %s: want %d, have %d", item, qty, STOCK[item])
    if STOCK[item] < qty:
        logger.warning("not enough %s: wanted %d, only %d left", item, qty, STOCK[item])
        return False
    STOCK[item] -= qty
    logger.info("reserved %d x %s", qty, item)
    return True
`

const SHOP_PAYMENTS = py`import logging

logger = logging.getLogger(__name__)   # "payments"


class PaymentDeclined(Exception):
    pass


def authorise(card, amount):
    """A fake payment gateway: cards ending in 0002 are always declined."""
    if card.endswith("0002"):
        raise PaymentDeclined(f"card ending {card[-4:]} declined ({amount:.2f})")
    return f"AUTH-{card[-4:]}"


def charge(card, amount):
    logger.info("charging card %s amount %.2f", card, amount)
    try:
        code = authorise(card, amount)
    except PaymentDeclined:
        logger.error("payment failed")
        return False
    logger.info("payment approved: %s", code)
    return True
`

// Shared test prelude for the redact-filter question: a logger whose handler writes to b.
const REDACT_SETUP = py`import io, logging
b = io.StringIO()
h = logging.StreamHandler(b)
h.addFilter(RedactFilter())
`

// Shared test prelude: collect every LogRecord that reaches the root logger.
const KEEP = py`import logging
records = []
keeper = logging.Handler()
keeper.emit = records.append
logging.getLogger().addHandler(keeper)
`

export default {
  id: 'logging',
  title: 'Logging',
  summary: 'The logging module records what your program does — with levels, timestamps and destinations you control — so you can understand it later without touching the code.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['debugging', 'modules-and-imports', 'try-except'],
  related: ['debugging', 'main-guard-and-scripts', 'raising-exceptions', 'packages', 'secrets-and-passwords', 'context-managers', 'mocking', 'project-log-analyzer', 'project-production-service'],
  tags: ['logging', 'logger', 'getLogger', 'handler', 'formatter', 'levels', 'basicConfig', 'dictConfig', 'propagation', 'NullHandler', 'LoggerAdapter', 'logger.exception', 'extra', 'structured logging', 'stderr'],
  apis: [
    { name: 'logging.getLogger(name)', summary: 'Returns the logger with that dotted name (creating it once); use getLogger(__name__) in every module.' },
    { name: 'logger.debug/info/warning/error/critical()', summary: 'Log a message at that level; extra positional arguments are merged in with % formatting only if the record is emitted.' },
    { name: 'logger.exception(msg)', summary: 'Logs at ERROR and appends the current traceback. Call it inside an except block.' },
    { name: 'logging.basicConfig(**kwargs)', summary: 'One-call setup of the root logger: level, format, stream or filename. Does nothing if the root already has handlers (unless force=True, 3.8+).' },
    { name: 'logging.config.dictConfig(config)', summary: 'Configures loggers, handlers, formatters and filters from a dictionary (often loaded from a file).' },
    { name: 'logging.StreamHandler / FileHandler', summary: 'Handlers that write formatted records to a stream (stderr by default) or a file.' },
    { name: 'logging.Formatter(fmt)', summary: 'Turns a LogRecord into text using %(name)s-style placeholders such as %(asctime)s, %(levelname)s, %(message)s.' },
    { name: 'logging.LoggerAdapter(logger, extra)', summary: 'Wraps a logger so every call carries the same contextual fields (request id, user id).' },
    { name: 'logging.NullHandler', summary: 'A handler that does nothing — libraries attach it so they never print unless the application configures logging.' },
    { name: 'logger.setLevel() / propagate', summary: 'Set a logger’s threshold; propagate=False stops records travelling to ancestor loggers’ handlers.' },
  ],
  docs: [
    { label: 'Logging HOWTO', url: 'https://docs.python.org/3/howto/logging.html' },
    { label: 'logging — reference', url: 'https://docs.python.org/3/library/logging.html' },
    { label: 'logging.config — dictConfig schema', url: 'https://docs.python.org/3/library/logging.config.html' },
    { label: 'logging.handlers — file, rotating, queue handlers', url: 'https://docs.python.org/3/library/logging.handlers.html' },
    { label: 'Logging Cookbook', url: 'https://docs.python.org/3/howto/logging-cookbook.html' },
    { label: 'Configuring logging for a library', url: 'https://docs.python.org/3/howto/logging.html#configuring-logging-for-a-library' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Logging** means having your program write a running diary of what it does: "processing order 101", "stock low for mugs", "payment failed — here is the traceback". Each diary entry is a **log record**, and every record has a **level** that says how important it is.`,
    py`Python's built-in \`logging\` module splits the job into four small parts:`,
    py`- a **logger** is the object your code talks to (\`logger.info("…")\`); each module gets its own, named after the module;
- a **level** (DEBUG, INFO, WARNING, ERROR, CRITICAL) says how serious a message is, and each logger has a threshold below which messages are dropped;
- a **handler** decides *where* records go — the terminal, a file, a log service;
- a **formatter** decides *what a line looks like* — time, level, logger name, message.`,
    py`In [debugging](lesson:debugging) you used \`print\` probes and then deleted them. Logging is what you use when the probes should **stay** — in code that runs for weeks on a server you can't pause, where the only evidence of a bug is what the program wrote down at the time.`,
  ],
  why: [
    py`\`print()\` has no off switch, no levels, no timestamps and no idea which module is talking. Once a program has more than one file, or runs anywhere other than your own terminal, you need to answer questions like "what happened at 03:12 last night, in the payments module, just before the crash?" — and \`print\` can't.`,
    py`Logging separates **what happened** (your code calls \`logger.warning(...)\`) from **what to do about it** (configured once, in one place). The same code can be chatty with DEBUG detail on your laptop, quiet in production, write JSON to a log collector in the cloud, and stay completely silent inside someone else's application when it's used as a library — all without editing a single \`logger\` call.`,
    py`It is also how professionals debug production: a log line with the right context (an order id, the traceback) can turn a week of guessing into a five-minute fix.`,
  ],
  eli15: [
    py`Think of a ship's logbook. The crew writes down what happens — "10:00 left port", "14:30 strong wind", "16:05 engine fire!" — and marks how serious each entry is. Nobody reads the whole book every day; but when something goes wrong, the captain flips back and finds out exactly what happened and when.`,
    py`In Python, your code is the crew. \`logger.info("left port")\` writes a calm entry; \`logger.error("engine fire")\` writes a serious one. Then *one* setting decides which entries are worth keeping (maybe only the serious ones) and where the book is kept (the screen, a file, a cloud service). Your code never changes — only that one setting does.`,
  ],
  analogy: {
    title: 'A newsroom: reporters, editors and printing presses',
    body: [
      py`In a newspaper, **reporters** in each department (sport, weather, politics) file stories and mark how urgent they are. Each department's **editor** throws away stories below a certain importance. Stories that make it go to the **printing presses**: the morning paper, the website, the breaking-news alert — each with its own layout and its own bar for what's worth printing.`,
      py`And stories travel up: a story filed by the *football* desk also goes to the *sport* section and to the *front page* desk, unless someone says "keep this one local".`,
    ],
    mapping: [
      ['a reporter filing a story', 'your code calling logger.info("…")'],
      ['the department (sport.football)', 'a logger with a dotted name, e.g. "shop.payments"'],
      ['the urgency stamp', 'the level: DEBUG, INFO, WARNING, ERROR, CRITICAL'],
      ['the editor’s cut-off', 'logger.setLevel(...) — lower-level records are dropped'],
      ['a printing press (paper, website, alert)', 'a handler (console, file, network)'],
      ['the page layout', 'a formatter: "%(asctime)s %(levelname)s %(message)s"'],
      ['stories going up to the front-page desk', 'propagation to ancestor loggers’ handlers'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The journey of one log record',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'call', label: 'logger.info(…)', note: 'your code', x: 95, y: 70, tone: 'yellow' },
        { id: 'level', label: 'Level check', note: 'isEnabledFor(INFO)?', x: 285, y: 70 },
        { id: 'record', label: 'LogRecord', note: 'name, level, msg, args, time, line…', x: 475, y: 70, tone: 'blue' },
        { id: 'own', label: 'This logger’s handlers', note: 'after its filters', x: 665, y: 70 },
        { id: 'ancestors', label: 'Ancestors’ handlers', note: '… up to root', x: 665, y: 250, tone: 'kraft' },
        { id: 'hcheck', label: 'Handler level + filters', note: 'each handler decides', x: 475, y: 250 },
        { id: 'formatter', label: 'Formatter', note: 'record → text', x: 285, y: 250 },
        { id: 'output', label: 'Destination', note: 'stderr, file, service', x: 95, y: 250, tone: 'ink' },
      ],
      edges: [
        { from: 'call', to: 'level', label: 'template + args' },
        { from: 'level', to: 'record', label: 'enabled' },
        { from: 'record', to: 'own' },
        { from: 'own', to: 'ancestors', label: 'propagate=True', dashed: true },
        { from: 'own', to: 'hcheck' },
        { from: 'ancestors', to: 'hcheck' },
        { from: 'hcheck', to: 'formatter', label: 'passes' },
        { from: 'formatter', to: 'output', label: 'write' },
      ],
      steps: [
        { focus: ['call'], text: py`\`logger.info("charging order %s", order_id)\` — you hand over a **template** and its **arguments**, not a finished string.` },
        { focus: ['level'], edges: ['call->level'], text: py`The logger compares INFO with its **effective level** (its own level, or the nearest ancestor's if it has none). Too low? The call returns right here — cheap, and the template is never filled in.` },
        { focus: ['record'], edges: ['level->record'], text: py`Otherwise it builds a **LogRecord**: an object holding the logger name, level, template, arguments, time, file, line number, function name and any exception info.` },
        { focus: ['own'], edges: ['record->own'], text: py`The logger's own **filters** may veto or enrich the record. Then it goes to every handler attached to this logger (often none).` },
        { focus: ['ancestors'], edges: ['own->ancestors'], text: py`With \`propagate=True\` (the default) the record is also handed to the handlers of each **ancestor** — \`shop.payments\` → \`shop\` → root. Ancestors' *levels* are not checked again; only their handlers'.` },
        { focus: ['hcheck'], edges: ['own->hcheck', 'ancestors->hcheck'], text: py`Each handler applies **its own level and filters**: a console handler might accept WARNING and up, while a file handler keeps everything from DEBUG.` },
        { focus: ['formatter'], edges: ['hcheck->formatter'], text: py`The handler's **formatter** turns the record into text. This is where \`template % args\` finally runs — lazily, only for records that are really written.` },
        { focus: ['output'], edges: ['formatter->output'], text: py`The handler writes the line to its destination: stderr, a file, a socket, a cloud log service.` },
      ],
    },
    alt: 'Flow diagram. A call to logger.info goes to a level check; if enabled, a LogRecord is built and passed to the logger’s own handlers and, through propagation, to the handlers of its ancestor loggers up to root. Each handler applies its own level and filters, then its formatter turns the record into text, which is written to a destination such as stderr or a file.',
    caption: py`Two gates, not one: the **logger's** level decides whether a record is created at all; each **handler's** level decides whether that handler writes it.`,
  },
  syntax: [
    py`#### 1. One logger per module`,
    { code: py`import logging

logger = logging.getLogger(__name__)   # "shop.payments" inside shop/payments.py

def refund(order_id, amount):
    logger.info("refunding order %s: %.2f", order_id, amount)`, lang: 'python', title: 'the line at the top of every module' },
    py`\`__name__\` is the module's dotted import path (see [modules & imports](lesson:modules-and-imports)), so the logger tree mirrors your package tree for free. \`getLogger\` with the same name always returns the **same** logger object. In the entry script \`__name__\` is \`"__main__"\` — there, give the logger a real name.`,
    py`#### 2. The five levels`,
    py`| level | number | use it for |
|---|---|---|
| \`DEBUG\` | 10 | detail only useful while diagnosing: inputs, intermediate values |
| \`INFO\` | 20 | normal milestones: "server started", "order 101 shipped" |
| \`WARNING\` | 30 | something unexpected that the program handled: retrying, a deprecated option, low disk |
| \`ERROR\` | 40 | an operation failed: a payment couldn't be taken, a file couldn't be saved |
| \`CRITICAL\` | 50 | the program itself is in trouble and may stop |`,
    py`A logger with a level set ignores everything **below** it. The root logger starts at **WARNING** — which is why a bare \`logger.info(...)\` prints nothing until you configure logging.`,
    py`#### 3. Configure once, at the entry point`,
    { code: py`import logging

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    )
    logging.getLogger(__name__).info("service starting")

if __name__ == "__main__":
    main()`, lang: 'python', title: 'basicConfig: the quick way' },
    py`\`basicConfig\` attaches one handler (stderr by default, or \`filename=…\`) with one format to the **root** logger. It only works the **first** time — if the root already has handlers, it silently does nothing, unless you pass \`force=True\` (3.8+). Libraries and modules never call it; only the program's entry point does (see [scripts vs modules](lesson:main-guard-and-scripts)).`,
    py`Common format placeholders: \`%(asctime)s\` (time), \`%(levelname)s\`, \`%(name)s\` (logger), \`%(message)s\`, \`%(module)s\`, \`%(funcName)s\`, \`%(lineno)d\`, \`%(process)d\`, \`%(threadName)s\`, and \`%(taskName)s\` for asyncio tasks (3.12+). \`%(levelname)-8s\` pads to 8 characters so columns line up.`,
    py`#### 4. Handlers and formatters by hand`,
    { code: py`import logging
import sys

console = logging.StreamHandler(sys.stderr)
console.setLevel(logging.WARNING)                       # the console only shows problems
console.setFormatter(logging.Formatter("%(levelname)s %(message)s"))

audit = logging.FileHandler("audit.log", encoding="utf-8")
audit.setLevel(logging.DEBUG)                           # the file keeps everything
audit.setFormatter(logging.Formatter("%(asctime)s %(name)s %(levelname)s %(message)s"))

root = logging.getLogger()
root.setLevel(logging.DEBUG)
root.addHandler(console)
root.addHandler(audit)`, lang: 'python', title: 'two destinations, two thresholds' },
    py`#### 5. dictConfig: configuration as data`,
    { code: py`import logging.config

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,      # the default True silences loggers created earlier!
    "formatters": {
        "plain": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "plain", "level": "INFO"},
    },
    "loggers": {
        "shop.payments": {"level": "DEBUG"},  # more detail for one noisy area
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

logging.config.dictConfig(LOGGING)`, lang: 'python', title: 'the production way' },
    py`Real applications keep this dictionary in a file (JSON, TOML, YAML) or build it per environment, so operations staff can change verbosity without a code change.`,
    py`#### 6. Exceptions, context and libraries`,
    { code: py`import logging

logger = logging.getLogger(__name__)

def save(order):
    try:
        write_to_disk(order)
    except OSError:
        logger.exception("could not save order %s", order["id"])   # ERROR + traceback
        raise

def handle(request_id, user):
    log = logging.LoggerAdapter(logger, {"request_id": request_id})
    log.info("user %s opened the cart", user)    # record.request_id is set
    logger.warning("slow query", extra={"table": "orders"})   # one-off extra field`, lang: 'python', title: 'logger.exception, LoggerAdapter and extra=' },
    { code: py`# mylib/__init__.py — a library never decides where logs go
import logging

logging.getLogger(__name__).addHandler(logging.NullHandler())`, lang: 'python', title: 'the only handler a library should add' },
    { callout: 'version', title: 'Version notes', text: py`\`basicConfig(force=True)\` arrived in 3.8 and \`encoding=\` in 3.9. The \`%(taskName)s\` record attribute is 3.12+. \`LoggerAdapter(..., merge_extra=True)\` (3.13+) merges the adapter's fields with a call's own \`extra=\` instead of replacing them.` },
  ],
  walkthrough: {
    title: 'Reading the shop’s entry point',
    lang: 'python',
    code: SHOP_MAIN,
    intro: py`This is \`main.py\` from the playground below (press **Guide** there to follow along in the editor). \`inventory.py\` and \`payments.py\` each start with \`logger = logging.getLogger(__name__)\`.`,
    steps: [
      { lines: [1, 4], text: py`Importing \`inventory\` and \`payments\` runs their top-level code, which creates the loggers \`"inventory"\` and \`"payments"\`. Creating a logger is not configuring logging: nothing is printed yet, and nothing should be.` },
      { lines: [6, 7], text: py`Inside the script that you run, \`__name__\` is \`"__main__"\`, which would make a confusing logger name — so this one is called \`"shop"\` explicitly.` },
      { lines: [16, 18], text: py`Each call passes a **template and arguments**. \`%s\` and \`%d\` are filled in only if the record is actually written. The DEBUG line is below the configured INFO level, so it's dropped before that work happens.` },
      { lines: [19, 22], text: py`The other modules log through their own loggers. Every record carries its logger's name, so the output tells you which module spoke.` },
      { lines: [25, 30], text: py`Configuration happens **once**, at the top of \`main()\`: root level INFO, one stderr handler, one format. \`%(levelname)-8s\` and \`%(name)-9s\` pad the columns.` },
      { lines: [31, 32], text: py`Program output that the *user* asked for still uses \`print\`, which goes to stdout. Diagnostics go to logging, which goes to stderr — so the two can be redirected separately.` },
      { lines: [35, 36], text: py`The main guard means importing this file (from a test, say) won't configure logging or process orders as a side effect.` },
    ],
  },
  playground: {
    title: 'Order processing with logging',
    objective: 'Run the shop, read its log, then turn on debug output, quiet a noisy module, capture a traceback and stop leaking card numbers.',
    files: { 'main.py': SHOP_MAIN, 'inventory.py': SHOP_INVENTORY, 'payments.py': SHOP_PAYMENTS },
    expected: py`The log lines go to **stderr**; the final summary is a normal \`print\` to stdout:

\`\`\`text
INFO     shop      processing order 101
INFO     inventory reserved 2 x tea
INFO     payments  charging card 4111111111111111 amount 7.00
INFO     payments  payment approved: AUTH-1111
INFO     shop      processing order 102
WARNING  inventory not enough mug: wanted 9, only 4 left
INFO     shop      processing order 103
INFO     inventory reserved 1 x cake
INFO     payments  charging card 4000000000000002 amount 12.00
ERROR    payments  payment failed
1 of 3 orders completed
\`\`\`

Two problems hide in that log: a **full card number** is written in plain text (they're public test numbers here — in real life that's a security incident), and "payment failed" doesn't say *why*. The experiments fix both.`,
    experiments: [
      {
        id: 'debug-on',
        task: py`Make the DEBUG messages appear (for example \`order details: tea x 2\`) by changing **one** argument in \`main()\`.`,
        hint: py`\`basicConfig(level=...)\` sets the root logger's level. Every logger without its own level inherits it.`,
        tests: [
          { name: 'DEBUG records are produced', code: KEEP + py`process(ORDERS[0])
assert any(r.levelno == logging.DEBUG for r in records), 'Set level=logging.DEBUG in basicConfig'` },
        ],
        explain: py`None of the module loggers has a level of its own, so they all use the root's. Lowering the root to DEBUG lets every \`logger.debug(...)\` through — no logging call was edited.`,
      },
      {
        id: 'quiet-inventory',
        task: py`Inventory is now too chatty. Without touching \`inventory.py\` or the root level, make the \`"inventory"\` logger show only WARNING and above.`,
        hint: py`In \`main()\`, after \`basicConfig\`: \`logging.getLogger("inventory").setLevel(logging.WARNING)\`.`,
        tests: [
          { name: 'the inventory logger only lets WARNING and above through', code: py`import logging
assert logging.getLogger("inventory").getEffectiveLevel() == logging.WARNING, 'Set the "inventory" logger to WARNING'` },
          { name: 'the rest of the app still logs INFO', code: py`import logging
assert logging.getLogger().getEffectiveLevel() <= logging.INFO, 'Keep the root logger at INFO or DEBUG'` },
        ],
        explain: py`\`getLogger("inventory")\` returns the **same** logger object that \`inventory.py\` created, so setting its level from \`main()\` changes what that module emits. This is how real apps turn one noisy library down — usually in dictConfig's \`"loggers"\` section.`,
      },
      {
        id: 'traceback',
        task: py`"payment failed" doesn't say why. Change that call in \`payments.py\` so the log includes the full traceback of the \`PaymentDeclined\` exception.`,
        hint: py`Inside an \`except\` block, \`logger.exception("...")\` logs at ERROR and appends the traceback automatically.`,
        tests: [
          { name: 'the failure is logged with exception info', code: KEEP + py`payments.charge("4000000000000002", 12.0)
failed = [r for r in records if r.levelno >= logging.ERROR]
assert failed, 'Keep logging the failure at ERROR level'
assert failed[0].exc_info, 'Use logger.exception(...) inside the except block'` },
          { name: 'charge still returns False on failure', code: py`assert payments.charge("4000000000000002", 12.0) is False` },
        ],
        explain: py`\`logger.exception(msg)\` is \`logger.error(msg, exc_info=True)\`: the record carries the exception, and the formatter appends \`Traceback (most recent call last): … PaymentDeclined: card ending 0002 declined (12.00)\`. Use it whenever you catch an error you're not re-raising — otherwise the evidence is gone.`,
      },
      {
        id: 'mask-card',
        task: py`The "charging card" line writes the whole card number into the log. Change it so only the **last four digits** are logged, e.g. \`charging card ending 1111 amount 7.00\`.`,
        hint: py`Log \`card[-4:]\` instead of \`card\`, and say "ending" so readers know it's partial.`,
        tests: [
          { name: 'the full card number never reaches the log', code: KEEP + py`payments.charge("4111111111111111", 7.0)
text = " ".join(r.getMessage() for r in records)
assert "4111111111111111" not in text, 'The full card number is still being logged'` },
          { name: 'the last four digits are still there for support staff', code: KEEP + py`payments.charge("4111111111111111", 7.0)
assert any("1111" in r.getMessage() for r in records if r.name == "payments")` },
        ],
        explain: py`Logs are copied to terminals, files, backups and third-party services, and read by many people — treat them as public. Never log passwords, tokens, API keys, full card numbers or other secrets; log an identifier (order id, last four digits) that lets you find the real data in the system that's allowed to hold it.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch records reach a handler (or not)',
    props: {
      code: py`import logging


class ListHandler(logging.Handler):
    def emit(self, record):
        seen.append(f"{record.levelname} {record.name}: {record.getMessage()}")


seen = []
root = logging.getLogger()
root.addHandler(ListHandler())
root.setLevel(logging.INFO)

cart = logging.getLogger("shop.cart")
cart.debug("cart has %d items", 3)
cart.info("cart has %d items", 3)
cart.warning("only %d %s left", 1, "mug")
print(seen)
`,
      notes: {
        4: 'A **handler** is any object with an `emit(record)` method. This one appends a line of text to a list instead of printing.',
        11: 'The handler is attached to the **root** logger — the ancestor of every other logger.',
        12: 'The root threshold is INFO. Loggers without their own level inherit it.',
        14: '`shop.cart` has no handlers and no level of its own. It still works, thanks to its ancestors.',
        15: 'DEBUG is below the effective level INFO: the call returns at once. Watch — `emit` never runs.',
        16: 'INFO passes. A LogRecord is built and, because `propagate` is True, handed to root’s handler: step into `emit`.',
        17: '`getMessage()` fills the template with the arguments only now — `"only %d %s left" % (1, "mug")`.',
      },
    },
    alt: 'A step-by-step trace. A ListHandler class with an emit method is attached to the root logger, whose level is set to INFO. A logger named shop.cart logs at debug, info and warning. The debug call never enters emit; the info and warning calls each step into emit, which appends a formatted string to the list seen. The final print shows two entries.',
    caption: py`Records created on \`shop.cart\` travel up to the root's handler. The DEBUG call is rejected by the level check before any record or text is created.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every \`logger.info(...)\` call goes through the same short pipeline: **level check → build a record → handlers → formatter → output**. The record is a real object (\`logging.LogRecord\`) with attributes you can use in formats: \`name\`, \`levelname\`, \`msg\` (the template), \`args\`, \`created\` (a timestamp), \`pathname\`, \`lineno\`, \`funcName\`, \`exc_info\` and more.`,
      py`Loggers form a **tree** by their dotted names: \`shop.payments\` is a child of \`shop\`, which is a child of the **root** logger. You almost always attach handlers only to the root, and let every module's logger pass its records up the tree to it.`,
      { code: py`import logging

shop = logging.getLogger("shop")
payments = logging.getLogger("shop.payments")
print(payments.parent is shop)              # True
print(shop.parent is logging.getLogger())   # True: the root logger
print(logging.getLogger("shop") is shop)    # True: one logger per name`, lang: 'python', title: 'the logger tree' },
    ],
    technical: [
      py`**Effective level.** A logger created with \`getLogger\` has level \`NOTSET\` (0), meaning "ask my parent". \`getEffectiveLevel()\` walks up the tree to the first logger with a real level; the root is never NOTSET. That's why setting one logger's level affects all its descendants that don't set their own.`,
      py`**Propagation ignores ancestor levels.** When a record propagates, it is handed straight to each ancestor's *handlers*; the ancestors' own levels and logger filters are **not** applied. So with root at WARNING and \`app\` at DEBUG, \`app.debug(...)\` still reaches root's handler. If you want a destination to be selective, set the **handler's** level.`,
      py`**Lazy formatting.** \`logger.info("paid %s", order_id)\` stores the template in \`record.msg\` and the tuple in \`record.args\`; \`record.getMessage()\` performs \`msg % args\` only when a formatter needs the text. The *arguments* are still evaluated before the call, though — for genuinely expensive values, guard with \`if logger.isEnabledFor(logging.DEBUG):\`.`,
      py`**The last-resort handler.** If a record reaches the end of the tree and no handler was found at all, logging uses \`logging.lastResort\`: it prints WARNING and above to stderr, message only. That's why an unconfigured program still shows \`logger.warning\` but not \`logger.info\`.`,
      py`**Module-level helpers configure the root.** \`logging.info(...)\` and friends call \`basicConfig()\` for you if the root has no handlers — so one stray \`logging.warning\` before your real setup makes your later \`basicConfig(level=...)\` a silent no-op.`,
      py`**Thread safety.** Handlers use locks, so logging from several [threads](lesson:threading) is safe. Several *processes* writing one file are not coordinated — funnel records to a single writer or log to stderr.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython's \`Logger\` caches the answer to "is level N enabled?" in a small dict and clears all caches when any level changes, so a disabled \`logger.debug(...)\` is a dictionary lookup plus a method call. It's cheap — but not free, and argument expressions are still evaluated. Measure before worrying (see [profiling](lesson:profiling)).` },
    ],
    production: [
      py`**Log to stderr/stdout and let the platform collect.** In containers and most cloud platforms, the convention is that the app writes its log stream to stdout/stderr and the infrastructure ships it to a log store. Writing files is for long-lived servers you manage yourself — then use \`RotatingFileHandler\` / \`TimedRotatingFileHandler\` or the OS's log rotation so disks don't fill up.`,
      py`**Structured (JSON) logs** make searching and dashboards easy: one JSON object per line with fixed keys. A \`Formatter\` subclass whose \`format(record)\` returns \`json.dumps({...})\` is enough to start (exercise for you!); libraries such as *structlog* and *python-json-logger* go further.`,
      py`**Correlation ids.** Put a request id on every record so you can find all lines for one request across modules. A \`contextvars.ContextVar\` set per request plus a \`Filter\` on the handler that copies it onto each record works with threads and asyncio alike:`,
      { code: py`import contextvars
import logging

request_id = contextvars.ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id.get()   # every record now has the field
        return True                            # keep the record`, lang: 'python', title: 'request ids without passing them everywhere' },
      py`**Keep slow handlers off the hot path.** Sending logs over the network inside a request adds that latency to the request. \`logging.handlers.QueueHandler\` puts records on a queue and a \`QueueListener\` thread does the slow writing.`,
      py`**Never log secrets.** Passwords, session tokens, API keys, full card numbers and personal data must not appear in logs: they get copied into backups and third-party tools and read by many people. Log identifiers instead, add a redacting filter as a safety net, and treat a leaked secret in a log as a real incident (see [secrets & passwords](lesson:secrets-and-passwords)).`,
      py`**Levels by environment.** DEBUG locally, INFO (or WARNING for noisy dependencies) in production, with a way to turn one logger up temporarily without a redeploy. Pair logs with metrics and an error tracker (e.g. Sentry) — logs explain *what happened*, metrics tell you *how often*, trackers group crashes for you.`,
    ],
  },
  mistakes: [
    {
      title: 'Throwing the traceback away',
      wrong: { code: py`try:
    send_invoice(order)
except Exception as e:
    logger.error(f"invoice failed: {e}")   # just the message, maybe even an empty one`, lang: 'python', static: true },
      right: { code: py`try:
    send_invoice(order)
except Exception:
    logger.exception("invoice failed for order %s", order["id"])`, lang: 'python', static: true },
      explanation: py`\`str(e)\` is often unhelpful (\`KeyError\` gives just \`'email'\`) and loses *where* it happened. \`logger.exception\` records the full traceback. Use it in \`except\` blocks that handle the error; if you re-raise, consider letting a higher layer log it once instead of logging the same error at every level.`,
    },
    {
      title: 'Configuring logging inside a library or at import time',
      wrong: { code: py`# geo/distance.py — a reusable module
import logging

logging.basicConfig(level=logging.DEBUG)   # hijacks the application's logging
logger = logging.getLogger(__name__)`, lang: 'python' },
      right: { code: py`# geo/__init__.py
import logging

logging.getLogger(__name__).addHandler(logging.NullHandler())

# geo/distance.py
logger = logging.getLogger(__name__)       # just log; the app decides where it goes`, lang: 'python', static: true },
      explanation: py`Whoever imports your module first would get *your* level and format, and their own \`basicConfig\` would then be ignored. Libraries only create loggers and log; the application configures. The \`NullHandler\` keeps the library silent when the application hasn't configured logging at all.`,
    },
    {
      title: 'Adding a handler every time a function runs',
      wrong: { code: py`import logging
import sys

def get_logger():
    logger = logging.getLogger("reports")
    logger.addHandler(logging.StreamHandler(sys.stdout))   # one more each call!
    return logger

get_logger().warning("first")
get_logger().warning("second")   # printed twice`, lang: 'python' },
      right: { code: py`import logging
import sys

def get_logger():
    logger = logging.getLogger("reports")
    if not logger.handlers:                                 # configure only once
        logger.addHandler(logging.StreamHandler(sys.stdout))
    return logger

get_logger().warning("first")
get_logger().warning("second")`, lang: 'python' },
      explanation: py`Loggers are global singletons per name, so handlers pile up. Each extra handler prints the same record again. Better still: set up handlers once at start-up, not inside helper functions.`,
    },
    {
      title: 'Logging secrets',
      wrong: { code: py`logger.info("login user=%s password=%s", username, password)
logger.debug("calling API with key %s", api_key)`, lang: 'python', static: true },
      right: { code: py`logger.info("login attempt for user=%s", username)
logger.debug("calling API with key ending %s", api_key[-4:])`, lang: 'python', static: true },
      explanation: py`Anything in a log should be considered readable by everyone who can read logs — which is usually far more people and systems than can read your database. Log who and what, not the secret itself.`,
    },
    {
      title: 'Building the message with an f-string',
      wrong: { code: py`logger.debug(f"cart contents: {cart.describe()}")`, lang: 'python', static: true },
      right: { code: py`logger.debug("cart contents: %s", cart)   # str(cart) only if DEBUG is on

if logger.isEnabledFor(logging.DEBUG):     # skip genuinely expensive work entirely
    logger.debug("cart contents: %s", cart.describe())`, lang: 'python', static: true },
      explanation: py`An f-string is built before \`debug()\` is even called — even when DEBUG is off. %-style arguments defer the formatting, and keep a fixed template in \`record.msg\` that log tools can group by. Linters such as Ruff and Pylint have rules that flag f-strings in logging calls.`,
    },
  ],
  debugging: [
    {
      symptom: py`logger.info("...") and logger.debug("...") print nothing at all.`,
      cause: py`Logging was never configured: the root logger's level is WARNING and the last-resort handler only shows WARNING and above.`,
      fix: py`Call \`logging.basicConfig(level=logging.INFO)\` (or dictConfig) once at the entry point. Check \`logger.getEffectiveLevel()\` and \`logging.getLogger().handlers\` when in doubt.`,
    },
    {
      symptom: py`logging.basicConfig(level=logging.DEBUG) seems to have no effect.`,
      cause: py`The root logger already had a handler — from an earlier \`basicConfig\`, a framework, or a module-level \`logging.info(...)\` call that configured it implicitly — so this call did nothing.`,
      fix: py`Configure earlier, remove the stray module-level \`logging.*\` calls, or pass \`force=True\` (3.8+) to replace the existing handlers.`,
    },
    {
      symptom: py`--- Logging error --- … TypeError: not all arguments converted during string formatting … Message: 'user %s logged in'  Arguments: ('ada', '10.0.0.7')`,
      cause: py`The number of \`%s\` placeholders doesn't match the number of arguments. Logging catches the error and prints this report to stderr instead of crashing your program.`,
      fix: py`Make placeholders and arguments match: \`logger.info("user %s logged in from %s", user, ip)\`. Literal percent signs in the template are written \`%%\`.`,
    },
    {
      symptom: py`Every log line appears twice (or three times).`,
      cause: py`The same record reaches several handlers: a handler on a child logger **and** one on the root (propagation), or a function that adds a handler each time it's called.`,
      fix: py`Attach handlers only to the root (or set \`propagate = False\` on the logger that has its own handler), and add handlers once at start-up. \`print(logger.handlers, logging.getLogger().handlers)\` shows the culprits.`,
    },
    {
      symptom: py`ValueError: Formatting field not found in record: 'request_id'`,
      cause: py`The format string uses \`%(request_id)s\`, but some records — often from libraries — were logged without that \`extra\` field.`,
      fix: py`Add the field to every record with a \`Filter\` on the handler (with a default such as \`"-"\`), instead of relying on each call passing \`extra=\`.`,
    },
    {
      symptom: py`After calling logging.config.dictConfig(...), modules that were imported earlier stop logging.`,
      cause: py`\`disable_existing_loggers\` defaults to \`True\`, which disables every logger that existed before the call and isn't named in the config — usually the module-level loggers of everything you imported.`,
      fix: py`Set \`"disable_existing_loggers": False\` in the config dictionary.`,
    },
  ],
  bestPractices: [
    'Start every module with logger = logging.getLogger(__name__) and log through it — not through logging.info().',
    'Configure logging exactly once, at the application’s entry point; libraries only add a NullHandler.',
    'Pass values as arguments (logger.info("paid %s", order_id)), not pre-built f-strings.',
    'Use logger.exception() in except blocks that handle an error, so the traceback is kept.',
    'Pick levels deliberately: DEBUG for diagnosis, INFO for milestones, WARNING for handled surprises, ERROR for failed operations.',
    'Include identifiers (order id, request id, user id) so a single event can be traced across modules.',
    'Never log passwords, tokens, keys, full card numbers or personal data.',
    'In dictConfig, set "disable_existing_loggers": False unless you really mean it.',
    'Keep user-facing output on stdout (print) and diagnostics on stderr (logging).',
  ],
  whenToUse: {
    use: [
      'Any diagnostic message that should stay in the code after today.',
      'Programs that run unattended: servers, workers, scheduled jobs.',
      'Libraries that want to explain what they are doing without forcing output on users.',
      'Recording handled errors with their tracebacks.',
    ],
    avoid: [
      'Output the user asked for (a CLI’s results, a report) — print that to stdout.',
      'Counting things over time (requests per second) — that is a metric; use a metrics system.',
      'Very hot inner loops at high volume — log a summary after the loop instead.',
      'Anything secret or personal.',
    ],
  },
  comparison: {
    title: 'print() vs logging',
    headers: ['', 'print()', 'logging'],
    rows: [
      ['severity', 'none — every line is equal', 'DEBUG … CRITICAL, filterable'],
      ['turn off / on', 'edit or delete the code', 'change one level in the configuration'],
      ['context', 'whatever you type', 'time, logger name, module, line, process, thread on request'],
      ['destination', 'stdout (or a file you pass)', 'any number of handlers: stderr, files, services'],
      ['exceptions', 'you format them yourself', 'logger.exception() adds the traceback'],
      ['inside a library', 'forces output on every user', 'silent unless the application opts in'],
    ],
    note: py`\`print\` is still the right tool for a program's actual output and for quick throwaway probes during [debugging](lesson:debugging).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'logging-q1',
      type: 'mcq',
      prompt: 'A brand-new program has not configured logging. Which of these calls produce visible output?',
      code: py`import logging
logger = logging.getLogger("app")
logger.debug("a")
logger.info("b")
logger.warning("c")
logger.error("d")`,
      options: [
        { text: 'All four', why: 'The root logger starts at WARNING, so DEBUG and INFO are dropped.' },
        { text: 'None — logging must be configured first', why: 'Without configuration Python uses a last-resort handler that still shows WARNING and above.' },
        'Only "c" and "d"',
        { text: 'Only "d"', why: 'WARNING is the default threshold, and it is inclusive: warnings are shown.' },
      ],
      answer: 2,
      explanation: py`An unconfigured root logger has level WARNING, and the last-resort handler prints WARNING and above to stderr (message only). That's why \`logger.info\` "doesn't work" until you call \`basicConfig\` or dictConfig.`,
    },
    {
      id: 'logging-q2',
      type: 'output',
      prompt: 'What does this print? (The handler writes to stdout here so you can see it.)',
      code: py`import logging
import sys

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format="%(levelname)s:%(message)s")
log = logging.getLogger("shop")
log.debug("cart loaded")
log.info("%d items", 3)
log.warning("low stock: %s", "mugs")`,
      answer: 'INFO:3 items\nWARNING:low stock: mugs',
      accept: ['INFO:3 items WARNING:low stock: mugs'],
      explanation: py`The level is INFO, so the DEBUG line is dropped. The format shows only the level name and the message, and \`%d\`/\`%s\` are filled from the arguments.`,
    },
    {
      id: 'logging-q3',
      type: 'bug',
      prompt: 'This code runs without errors, but a security review flags one line. Click it.',
      code: py`import logging

logger = logging.getLogger(__name__)

def login(username, password, users):
    logger.info("login attempt: user=%s password=%s", username, password)
    if users.get(username) == password:
        logger.info("user %s logged in", username)
        return True
    logger.warning("failed login for user %s", username)
    return False`,
      answerLine: 6,
      explanation: py`Line 6 writes the password into the log, where it will be copied to files, backups and log services and read by many people. Log the username only. (Comparing plain-text passwords is a second problem — real systems store salted hashes; see [secrets & passwords](lesson:secrets-and-passwords).)`,
    },
    {
      id: 'logging-q4',
      type: 'fill',
      prompt: 'Complete the code: one logger per module, and a failure that is logged **with its traceback**.',
      code: py`import logging

logger = logging.___(__name__)

def save(order):
    try:
        write(order)
    except OSError:
        logger.___("could not save order %s", order["id"])
        raise`,
      answer: [['getLogger'], ['exception']],
      explanation: py`\`logging.getLogger(__name__)\` names the logger after the module. \`logger.exception(...)\` logs at ERROR and appends the active exception's traceback.`,
    },
    {
      id: 'logging-q5',
      type: 'output',
      prompt: 'How many times is the warning printed?',
      code: py`import logging
import sys

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(name)s: %(message)s"))
logging.getLogger().addHandler(handler)

app = logging.getLogger("app")
app.addHandler(handler)
app.warning("disk almost full")`,
      options: [
        { text: 'Once — it is the same handler object', why: 'Logging does not de-duplicate across loggers: the record visits app’s handlers, then propagates and visits root’s handlers.' },
        'Twice',
        { text: 'Not at all — nothing called basicConfig', why: 'Handlers were added by hand, which is a valid configuration; basicConfig is just a shortcut.' },
      ],
      answer: 1,
      explanation: py`\`app\` has the handler, so the record is written once; then it propagates to the root, whose handler list contains the same handler, so it's written again: \`app: disk almost full\` twice. Fix: attach handlers only to the root, or set \`app.propagate = False\`.`,
    },
    {
      id: 'logging-q6',
      type: 'mcq',
      prompt: 'You maintain a library, `geo`, used by many applications. What should `geo/__init__.py` do about logging?',
      options: [
        { text: 'logging.basicConfig(level=logging.INFO) so users see the library’s messages', why: 'That configures the application’s root logger behind its back and can make the app’s own basicConfig a no-op.' },
        'logging.getLogger(__name__).addHandler(logging.NullHandler()) — and nothing else',
        { text: 'Add a StreamHandler to the "geo" logger so messages always appear', why: 'The application decides where logs go. A forced handler can’t be redirected and causes duplicates.' },
        { text: 'Use print() instead, because libraries should not import logging', why: 'print cannot be silenced or redirected by the application; logging can.' },
      ],
      answer: 1,
      explanation: py`Libraries create loggers (\`getLogger(__name__)\` in each module) and log; the application configures handlers and levels. The \`NullHandler\` stops the last-resort handler from printing the library's warnings when the app hasn't configured logging.`,
    },
    {
      id: 'logging-q7',
      type: 'short',
      prompt: 'Why is `logger.debug("user %s", user)` preferred over `logger.debug(f"user {user}")`?',
      answer: py`With %-style arguments the string is only formatted if a handler actually writes the record, so disabled debug calls skip that work; the fixed template stays in record.msg, so log tools can group identical messages; and a formatting mistake is caught and reported by logging instead of raising in your code. The f-string is always built before the call, even when DEBUG is off. (The argument expressions themselves are evaluated either way.)`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'import-prices-logging',
      title: 'Log a price import at the right levels',
      difficulty: 'intermediate',
      prompt: py`\`import_prices(rows)\` receives a list of \`(sku, price_text)\` tuples and returns a dict \`{sku: price}\`. Use the module's \`logger\` (already created as \`logging.getLogger("importer")\`) like this:

1. For each row, log at **DEBUG**: \`"parsing %s"\` with the sku.
2. Convert with \`parse_price(price_text)\`. If it raises \`ValueError\`, log at **ERROR with the traceback** using \`logger.exception\`, with a message that contains the sku (e.g. \`"bad price for %s"\`), and **skip** the row.
3. If the price is \`0\`, log a **WARNING** \`"free item %s"\` but still import it.
4. After the loop, log at **INFO** exactly \`"imported %d of %d rows"\` with **%-style arguments** (the tests check \`record.args\`), e.g. \`imported 2 of 3 rows\`.
5. Return the dict.`,
      files: {
        'main.py': py`import logging

logger = logging.getLogger("importer")


def parse_price(text):
    return round(float(text), 2)


def import_prices(rows):
    prices = {}
    for sku, text in rows:
        pass  # TODO: log, parse, handle errors
    # TODO: log the summary
    return prices


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(levelname)-7s %(message)s")
    print(import_prices([("TEA-1", "3.50"), ("MUG-2", "eight"), ("PEN-3", "0")]))
`,
      },
      hints: [
        'Wrap only the parse_price call in try/except ValueError, and use continue in the except block to skip the row.',
        'logger.exception("bad price for %s", sku) must be called inside the except block — that is where the traceback is available.',
        'After the loop: logger.info("imported %d of %d rows", len(prices), len(rows)).',
      ],
      solution: {
        explanation: py`Each level says something different: DEBUG is a trace for diagnosis, WARNING flags a surprising-but-handled value, ERROR (via \`logger.exception\`) records a failed row together with *why* it failed, and INFO gives the one-line summary an operator wants. Passing \`len(prices), len(rows)\` as arguments keeps the template \`"imported %d of %d rows"\` fixed in \`record.msg\` — which is what the tests (and real log tools) look at — and defers formatting until the record is written.`,
        files: {
          'main.py': py`import logging

logger = logging.getLogger("importer")


def parse_price(text):
    return round(float(text), 2)


def import_prices(rows):
    prices = {}
    for sku, text in rows:
        logger.debug("parsing %s", sku)
        try:
            price = parse_price(text)
        except ValueError:
            logger.exception("bad price for %s", sku)
            continue
        if price == 0:
            logger.warning("free item %s", sku)
        prices[sku] = price
    logger.info("imported %d of %d rows", len(prices), len(rows))
    return prices


if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG, format="%(levelname)-7s %(message)s")
    print(import_prices([("TEA-1", "3.50"), ("MUG-2", "eight"), ("PEN-3", "0")]))
`,
        },
      },
      tests: [
        { name: 'returns the valid prices and skips bad rows', code: py`assert import_prices([("A", "1.5"), ("B", "oops"), ("C", "0")]) == {"A": 1.5, "C": 0.0}` },
        { name: 'a bad row is logged at ERROR with its traceback and sku', code: KEEP + py`logger.setLevel(logging.DEBUG)
import_prices([("A", "1.5"), ("B", "oops")])
errors = [r for r in records if r.levelno == logging.ERROR]
assert errors, 'Log the bad row at ERROR level'
assert errors[0].exc_info, 'Use logger.exception() so the traceback is attached'
assert "B" in errors[0].getMessage(), 'Include the sku in the error message'` },
        { name: 'a zero price is a WARNING mentioning the sku', code: KEEP + py`logger.setLevel(logging.DEBUG)
import_prices([("FREE-9", "0")])
assert any(r.levelno == logging.WARNING and "FREE-9" in r.getMessage() for r in records)` },
        { name: 'each row is logged at DEBUG', code: KEEP + py`logger.setLevel(logging.DEBUG)
import_prices([("A", "1"), ("B", "2")])
assert sum(r.levelno == logging.DEBUG for r in records) >= 2` },
        { name: 'summary: INFO "imported 2 of 3 rows" with %-style arguments', code: KEEP + py`logger.setLevel(logging.DEBUG)
import_prices([("A", "1.5"), ("B", "oops"), ("C", "0")])
info = [r for r in records if r.levelno == logging.INFO]
assert info and info[-1].getMessage() == "imported 2 of 3 rows"
assert info[-1].args == (2, 3), 'Pass the numbers as arguments, not inside an f-string'` },
      ],
    },
    {
      id: 'no-duplicate-handlers',
      title: 'A logger factory that doesn’t duplicate lines',
      difficulty: 'intermediate',
      prompt: py`\`get_logger(name, stream)\` is called from several places in an app, and users complain that lines are printed two or three times. Fix it so that it:

1. returns \`logging.getLogger(name)\`;
2. gives that logger **exactly one** \`StreamHandler\` writing to \`stream\`, formatted \`"%(levelname)s %(name)s: %(message)s"\` — calling \`get_logger\` again with the same name must **not** add another handler;
3. sets the logger's level to \`DEBUG\`;
4. sets \`propagate = False\` so the root logger's handlers don't print the same records again.

Example: \`get_logger("app.audit", buf).info("hello")\` writes exactly \`INFO app.audit: hello\` plus a newline into \`buf\`.`,
      files: {
        'main.py': py`import io
import logging


def get_logger(name, stream):
    logger = logging.getLogger(name)
    handler = logging.StreamHandler(stream)
    handler.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
    logger.addHandler(handler)
    return logger


buf = io.StringIO()
get_logger("app.audit", buf).info("first")
get_logger("app.audit", buf).info("second")
print(buf.getvalue())
`,
      },
      hints: [
        'getLogger returns the same object for the same name, so the handlers you added last time are still attached. Check logger.handlers before adding.',
        'Wrap the handler creation in if not logger.handlers:. Level and propagate can be set every time — that’s harmless.',
        'logger.setLevel(logging.DEBUG) and logger.propagate = False, then return logger.',
      ],
      solution: {
        explanation: py`Loggers are process-wide singletons keyed by name, so a factory that unconditionally calls \`addHandler\` stacks a new handler per call — and each handler writes every record once. Guarding with \`if not logger.handlers:\` makes the function **idempotent** (calling it twice is the same as calling it once). \`propagate = False\` stops the record from also reaching the root's handlers, the other classic source of duplicates. In a bigger app you'd do all of this once in dictConfig rather than in a factory.`,
        files: {
          'main.py': py`import io
import logging


def get_logger(name, stream):
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(stream)
        handler.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
        logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False
    return logger


buf = io.StringIO()
get_logger("app.audit", buf).info("first")
get_logger("app.audit", buf).info("second")
print(buf.getvalue())
`,
        },
      },
      tests: [
        { name: 'writes "INFO app.t1: hello"', code: py`import io
b = io.StringIO()
get_logger("app.t1", b).info("hello")
assert b.getvalue() == "INFO app.t1: hello\n"` },
        { name: 'calling it twice does not duplicate lines', code: py`import io
b = io.StringIO()
get_logger("app.t2", b)
log = get_logger("app.t2", b)
log.warning("once")
assert b.getvalue().count("once") == 1, 'Only add a handler if the logger has none'
assert len(log.handlers) == 1` },
        { name: 'DEBUG messages are shown', code: py`import io
b = io.StringIO()
get_logger("app.t3", b).debug("details")
assert "DEBUG app.t3: details" in b.getvalue()` },
        { name: 'records do not propagate to the root', code: py`import io, logging
seen = []
root_handler = logging.Handler()
root_handler.emit = seen.append
logging.getLogger().addHandler(root_handler)
get_logger("app.t4", io.StringIO()).warning("private")
assert seen == [], 'Set logger.propagate = False'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'logging-vs-print',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why use the logging module instead of print() for diagnostics?',
      answer: 'Logging gives every message a level and a source (the logger name), and separates emitting messages from deciding where they go — so you can filter, redirect or silence them through configuration without touching the code.',
      explanation: py`Diagnostic calls can stay in the code permanently: modules can be turned up or down, records sent to several destinations, tracebacks attached with \`logger.exception\`, and libraries kept silent unless the app opts in.`,
      whyAsked: 'A quick check that you have worked on code that runs outside your own terminal.',
      mistakes: ['Saying logging is "just print with a timestamp"', 'Forgetting libraries: print in a library forces output on every user'],
      followUps: ['Where should logging be configured?', 'When is print still the right choice?'],
      modelAnswer: 'print writes a line to stdout with no severity, no source and no off switch. With logging, each module gets a named logger and each message a level, and one configuration at start-up decides which levels are kept and where they go — console, file or a log service. So I can leave useful diagnostics in the code, turn on DEBUG for one module while investigating, and keep production quiet. logger.exception records full tracebacks, and libraries stay silent unless the application configures logging. I still use print for a program’s real output and quick throwaway probes.',
    },
    {
      id: 'logging-hierarchy-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`import logging
import sys

logging.basicConfig(stream=sys.stdout,
                    format="%(levelname)s %(name)s %(message)s")
app = logging.getLogger("app")
app.setLevel(logging.DEBUG)

app.debug("a")
logging.getLogger("app.db").info("b")
logging.getLogger("other").info("c")` },
      options: [
        'Nothing — the root level is WARNING',
        'DEBUG app a\nINFO app.db b',
        'DEBUG app a',
        'DEBUG app a\nINFO app.db b\nINFO other c',
      ],
      correctOption: 1,
      answer: '"DEBUG app a" and "INFO app.db b". app.db inherits app’s DEBUG level; propagated records reach root’s handler without root’s WARNING level being checked; "other" inherits WARNING, so its INFO is dropped.',
      explanation: py`\`basicConfig\` without \`level\` leaves the root at WARNING but adds a handler with no level. \`app.db\` (NOTSET) inherits DEBUG from \`app\`. During propagation only *handler* levels are checked, never the ancestors' logger levels.`,
      whyAsked: 'Effective level and propagation are the two rules behind almost every "missing log" or "too many logs" bug.',
      mistakes: ['Assuming the root’s WARNING level blocks app’s DEBUG record', 'Assuming app.db has its own default level'],
      followUps: ['How would you make the console show only WARNING+ while app logs DEBUG to a file?', 'What would app.propagate = False change here?'],
      modelAnswer: 'It prints "DEBUG app a" and "INFO app.db b". The app logger is DEBUG, and app.db has no level of its own, so it inherits DEBUG from app. Both records propagate to the root’s handler, and during propagation only handler levels are checked, not the root logger’s WARNING. The "other" logger inherits the root’s WARNING, so its info call is dropped before a record is even made. To make a destination selective I set the handler’s level.',
    },
    {
      id: 'logging-duplicates',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After a refactor, every log line from the `billing` module appears twice. What are the likely causes, and how do you find the real one?',
      answer: 'The same record reaches two handlers: a handler on the billing logger plus one on the root (propagate=True), or setup code that adds handlers more than once. Inspect the handlers along the chain; attach handlers once, at the root, or set propagate=False.',
      explanation: py`Typical culprits: a helper that calls \`addHandler\` on every call, a framework that already configured the root plus your own handler, or configuration that runs per request.`,
      code: { lang: 'python', code: py`import logging

for name in ("billing", ""):        # "" is the root logger
    lg = logging.getLogger(name)
    print(repr(name), lg.handlers, "propagate:", lg.propagate)` },
      whyAsked: 'A very common real-world bug that tests understanding of handlers and propagation.',
      mistakes: ['De-duplicating messages with string comparison', 'Not checking the root logger’s handlers'],
      followUps: ['Why is it bad to add handlers in library code?', 'What does basicConfig do if the root already has handlers?'],
      modelAnswer: 'Duplicate lines mean one record is written by two handlers. Either a handler is attached to the billing logger while propagation also delivers the record to a handler on the root, or some setup code adds a handler more than once — a get_logger helper called repeatedly, for example. I print the handlers and the propagate flag for billing and for the root to see which. The fix is to configure handlers once at start-up, normally only on the root, or set propagate to False on a logger that deliberately has its own handler.',
    },
    {
      id: 'logging-library',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'You are publishing a library on PyPI. How should it do logging, and what must it never do?',
      answer: 'Create loggers with getLogger(__name__) in each module, log at sensible levels with %-style arguments, and add only a NullHandler to the package’s top-level logger. Never call basicConfig, add real handlers, set the root level or print diagnostics.',
      explanation: py`The application owns the root logger and the destinations. Because logger names follow the package (\`mylib.http\`, \`mylib.cache\`), users can tune your library precisely: \`logging.getLogger("mylib").setLevel(logging.WARNING)\`.`,
      code: { lang: 'python', code: py`# mylib/__init__.py
import logging

logging.getLogger(__name__).addHandler(logging.NullHandler())` },
      whyAsked: 'Library etiquette shows you think about the people who use your code.',
      mistakes: ['Calling basicConfig in the library “so users see something”', 'Using one hard-coded logger name for the whole library'],
      followUps: ['How does a user turn your library’s debug output on?', 'Why is NullHandler still useful in Python 3, which has a last-resort handler?'],
      modelAnswer: 'A library should log but never configure logging. Every module creates logger = logging.getLogger(__name__), so logger names follow the package and users can tune them individually. I attach only a NullHandler to the top-level package logger, so if the application never configures logging the last-resort handler doesn’t print our warnings to stderr. I never call basicConfig, add stream or file handlers or touch the root level — those decisions belong to the application. And I document the logger names so users can enable debug output with one line.',
    },
    {
      id: 'logging-service-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design the logging setup for a web API running in containers behind a load balancer.',
      answer: 'dictConfig once at start-up from environment settings; one structured (JSON) line per event to stdout/stderr, shipped by the platform; a request id on every record via a contextvar and a filter; INFO request summaries, logger.exception for failures; per-logger levels for noisy dependencies; redaction as a safety net; slow handlers behind a QueueHandler; metrics and an error tracker alongside.',
      explanation: py`Containers are ephemeral, so files inside them disappear: write to stdout/stderr and let the collector store and index it. A correlation id ties together all lines of one request, even across services.`,
      whyAsked: 'Senior candidates are expected to connect logging to operations: observability, cost, security and incident response.',
      mistakes: ['Writing log files inside the container', 'Logging whole request bodies (secrets, personal data, volume)', 'Logging the same exception at every layer'],
      followUps: ['How would you propagate the request id to downstream services?', 'How do logs, metrics and traces differ?'],
      modelAnswer: 'I configure logging once at start-up with dictConfig, built from environment settings so production runs at INFO and staging at DEBUG. Each process writes one JSON object per line to stdout and the platform collects it — no files inside containers. Middleware creates or accepts a request id, stores it in a contextvar, and a filter stamps it on every record; I forward it downstream in a header. Each request gets one INFO summary with method, path, status and duration, and failures use logger.exception once, at the boundary. Noisy libraries get a higher level, a redaction filter backs up the rule of never logging secrets, and metrics and an error tracker complement the logs.',
    },
    {
      id: 'logging-redact-filter',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write a `RedactFilter(logging.Filter)` whose `filter(record)` replaces the value after `password=` or `token=` in the final message with `***`, so `logger.warning("login user=%s password=%s", "ada", "hunter2")` is written as `login user=ada password=***`. It must always keep the record (return True).',
      answer: 'Build the final message with record.getMessage(), substitute (password|token)=\\S+ with \\1=***, store the result in record.msg and clear record.args so it isn’t formatted again, then return True.',
      explanation: py`Secrets usually arrive through the arguments, so redact the **merged** message from \`record.getMessage()\`, not just the template. Then set \`record.args = ()\` so the formatter doesn't apply the arguments a second time.`,
      starter: { files: { 'main.py': py`import io
import logging
import re


class RedactFilter(logging.Filter):
    def filter(self, record):
        # TODO: redact password=... and token=... in the final message
        return True


buf = io.StringIO()
handler = logging.StreamHandler(buf)
handler.addFilter(RedactFilter())
log = logging.getLogger("auth")
log.addHandler(handler)
log.warning("login user=%s password=%s", "ada", "hunter2")
print(buf.getvalue().strip())
` } },
      tests: [
        { name: 'password values are replaced with ***', code: REDACT_SETUP + py`lg = logging.getLogger("t.redact1")
lg.addHandler(h)
lg.warning("login user=%s password=%s", "ada", "hunter2")
assert b.getvalue() == "login user=ada password=***\n"` },
        { name: 'tokens inside the template are redacted too', code: REDACT_SETUP + py`lg = logging.getLogger("t.redact2")
lg.addHandler(h)
lg.warning("refresh token=abc123 accepted")
assert b.getvalue() == "refresh token=*** accepted\n"` },
        { name: 'ordinary messages are unchanged and kept', code: REDACT_SETUP + py`lg = logging.getLogger("t.redact3")
lg.addHandler(h)
lg.warning("%d items in cart", 3)
assert b.getvalue() == "3 items in cart\n"` },
      ],
      solution: { files: { 'main.py': py`import io
import logging
import re

SECRET = re.compile(r"(password|token)=\S+")


class RedactFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage()          # template % args, fully merged
        record.msg = SECRET.sub(r"\1=***", message)
        record.args = ()                       # already merged: don't format again
        return True


buf = io.StringIO()
handler = logging.StreamHandler(buf)
handler.addFilter(RedactFilter())
log = logging.getLogger("auth")
log.addHandler(handler)
log.warning("login user=%s password=%s", "ada", "hunter2")
print(buf.getvalue().strip())
` } },
      hints: ['record.getMessage() returns the message with the arguments already filled in.', 'After you overwrite record.msg, set record.args = () so the arguments are not applied again.', 're.sub(r"(password|token)=\\S+", r"\\1=***", message)'],
      whyAsked: 'Combines the logging pipeline (filters, msg vs args) with security awareness.',
      mistakes: ['Redacting record.msg only, so secrets passed as arguments slip through', 'Forgetting to clear record.args', 'Returning False, which drops the record'],
      followUps: ['Why attach it to the handler rather than a logger?', 'What can’t a regex-based redactor catch?'],
      modelAnswer: 'A filter can modify records as well as reject them, so I override filter(record). Secrets usually arrive as arguments, so I first call record.getMessage() to get the merged text, replace whatever follows password= or token= with asterisks using a regular expression, and store that in record.msg. Then I set record.args to an empty tuple, because the message is already formatted. I return True so the record is still written, and attach the filter to the handler so it covers every logger that reaches that destination. It is a safety net, not permission to log secrets.',
    },
  ],

  takeaways: [
    'Use logger = logging.getLogger(__name__) in every module; the dotted names form a tree that mirrors your packages.',
    'Levels (DEBUG < INFO < WARNING < ERROR < CRITICAL) filter twice: at the logger (is a record created?) and at each handler (does it write it?).',
    'Configure once at the entry point — basicConfig for small scripts, dictConfig for applications; libraries only add a NullHandler.',
    'Records propagate to ancestors’ handlers; duplicated lines mean two handlers in the chain or handlers added repeatedly.',
    'Pass values as arguments (logger.info("paid %s", order_id)) so formatting is deferred and the template stays fixed.',
    'logger.exception() in an except block keeps the traceback; add context with extra=, LoggerAdapter or a filter.',
    'Never log secrets or personal data — log identifiers, and treat logs as widely readable.',
  ],
}
