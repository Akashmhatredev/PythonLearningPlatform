// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ORDER_INTAKE = py`# Order intake: raise the right exception, re-raise it, chain the cause
PRODUCTS = {"pen": 1.20, "notebook": 3.50, "backpack": 24.00}


def parse_quantity(text):
    """Turn user text into an int >= 1, or raise ValueError with a clear message."""
    try:
        quantity = int(text)
    except ValueError as err:
        raise ValueError(f"quantity must be a whole number, got {text!r}") from err
    if quantity < 1:
        raise ValueError(f"quantity must be at least 1, got {quantity}")
    return quantity


def unit_price(product):
    if not isinstance(product, str):
        raise TypeError(f"product must be a str, not {type(product).__name__}")
    try:
        return PRODUCTS[product]
    except KeyError:
        raise ValueError(f"unknown product {product!r}") from None


def checkout(product, quantity_text):
    try:
        return unit_price(product) * parse_quantity(quantity_text)
    except ValueError:
        print(f"  [log] checkout failed for {product!r}")
        raise  # bare raise: the same exception continues to the caller


orders = [("pen", "3"), ("notebook", "two"), ("stapler", "1"), ("backpack", "0")]
for product, quantity_text in orders:
    try:
        total = checkout(product, quantity_text)
    except ValueError as err:
        print(f"REJECTED {product} x {quantity_text}: {err}")
        if err.__cause__ is not None:
            print(f"  caused by {type(err.__cause__).__name__}: {err.__cause__}")
    else:
        print(f"OK       {product} x {quantity_text} = {total:.2f}")
`

export default {
  id: 'raising-exceptions',
  title: 'Raising, re-raising & exception chaining',
  summary: 'Signal failure with raise and the right built-in exception, pass errors on with a bare raise, and keep the real cause visible with raise … from.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['try-except'],
  related: ['custom-exceptions', 'error-handling-patterns', 'exception-groups', 'reading-errors', 'testing-fundamentals', 'input-validation', 'abstract-base-classes'],
  tags: ['raise', 'exceptions', 're-raise', 'bare raise', 'exception chaining', 'raise from', 'from None', '__cause__', '__context__', '__suppress_context__', 'assert', '-O', 'ValueError', 'TypeError', 'NotImplementedError', 'traceback'],
  apis: [
    { name: 'raise ExcType("message")', summary: 'Create an exception object and start unwinding the call stack with it.' },
    { name: 'raise (bare)', summary: 'Inside an except block: re-raise the exception being handled, with its original traceback.' },
    { name: 'raise New(...) from err', summary: 'Explicit chaining: sets New.__cause__ = err; the traceback says "The above exception was the direct cause…".' },
    { name: 'raise New(...) from None', summary: 'Suppresses the context: the traceback shows only the new exception.' },
    { name: 'exc.__cause__', summary: 'The exception given with raise … from, or None.' },
    { name: 'exc.__context__', summary: 'The exception that was being handled when this one was raised (set automatically).' },
    { name: 'assert condition, message', summary: 'Raises AssertionError if the condition is false — removed entirely when Python runs with -O.' },
    { name: 'NotImplementedError', summary: 'Raise it from a method that subclasses must override (not to be confused with the NotImplemented constant).' },
  ],
  docs: [
    { label: 'Python tutorial — raising exceptions and exception chaining', url: 'https://docs.python.org/3/tutorial/errors.html#raising-exceptions' },
    { label: 'Language reference — the raise statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-raise-statement' },
    { label: 'Built-in exceptions — exception context', url: 'https://docs.python.org/3/library/exceptions.html#exception-context' },
    { label: 'Language reference — the assert statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement' },
    { label: 'PEP 3134 — exception chaining and embedded tracebacks', url: 'https://peps.python.org/pep-3134/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [try & except](lesson:try-except) you *caught* exceptions that Python raised for you. Now you'll raise your own. \`raise\` is how a function says: **"I can't do what you asked, and here is exactly why."**`,
    { code: py`def set_volume(level):
    if not 0 <= level <= 10:
        raise ValueError(f"volume must be between 0 and 10, got {level}")
    print("volume set to", level)


set_volume(7)          # volume set to 7
try:
    set_volume(11)
except ValueError as err:
    print("rejected:", err)   # rejected: volume must be between 0 and 10, got 11`, lang: 'python', title: 'raise in one example' },
    py`You'll also learn the three other moves every professional uses daily: **picking the right exception type** so callers can catch it precisely, **re-raising** with a bare \`raise\` after logging or cleaning up, and **chaining** (\`raise … from err\`) so that when you translate one error into another, the original cause is still in the traceback. Finally: why \`assert\` is *not* a way to validate input.`,
  ],
  why: [
    py`A function has a promise: \`parse_quantity("3")\` promises an int. When it **can't** keep the promise, it has three options: return something fake (\`0\`, \`-1\`, \`None\`), print a complaint and carry on, or raise. The first two let bad data leak further into the program, where it causes a confusing failure much later. Raising stops the problem **at the point where it's detected**, with a message that names it.`,
    py`Exceptions also separate *detecting* a problem from *deciding what to do about it*. A low-level function knows "this quantity is invalid"; only the code that talks to the user knows whether to show a form error, skip the row or abort the import. \`raise\` carries the problem up to the code that can decide.`,
    py`And chaining matters in production: when a config loader turns a \`ValueError\` into "bad config file", the person debugging at 3 a.m. needs **both** — what the program was trying to do *and* the low-level reason it failed.`,
  ],
  eli15: [
    py`Think of a referee. When a player breaks a rule, the referee doesn't quietly ignore it, and doesn't sort it out themselves either — they **blow the whistle** and hold up a card. The colour says *what kind* of problem (yellow = warning, red = sent off). Someone else (the coach, the league) decides what happens next.`,
    py`\`raise ValueError("…")\` is blowing the whistle and holding up a card. The **type** (\`ValueError\`, \`TypeError\`) is the colour of the card; the **message** is what the referee writes in the notebook.`,
    py`**Re-raising** is a linesman spotting the foul, writing it down, then passing the flag on to the referee. **Chaining** (\`from\`) is the report that says "red card *because* of the earlier foul" — both events stay on record.`,
  ],
  analogy: {
    title: 'Escalating a problem at work',
    body: [
      py`A shop assistant finds a customer's order can't be filled. They don't hide it or invent a fake order — they **escalate**: they fill in a problem ticket with a category ("out of stock", "wrong address") and details, and hand it to their supervisor.`,
      py`The supervisor might handle it, or might add a note and pass **the same ticket** further up. Or they might open a **new** ticket for head office ("Order 1042 can't ship") and staple the original ticket behind it as the cause — so head office sees the big picture *and* the root cause.`,
    ],
    mapping: [
      ['filling in a problem ticket', 'raise SomeError("details")'],
      ['the ticket category', 'the exception type (ValueError, TypeError, KeyError…)'],
      ['the details written on it', 'the message — include the bad value'],
      ['passing the same ticket up unchanged', 'bare raise inside an except block'],
      ['a new ticket with the old one stapled behind it', 'raise NewError(...) from err (sets __cause__)'],
      ['a new ticket, old one shredded because it is irrelevant', 'raise NewError(...) from None'],
      ['a sticky note "check this" that is removed before going live', 'assert — stripped out by python -O'],
    ],
  },
  visual: {
    type: 'exception-flow',
    title: 'Catch, add context, raise again',
    props: { preset: 'reraise' },
    alt: 'Animated call stack main() → load() → parse(). parse() raises a low-level exception. load() catches it, then raises a new, more meaningful exception from it (or re-raises the same one). The new exception carries the original as its cause and continues up to main(), where it is handled.',
    caption: py`A middle layer can catch an exception, do something (log, clean up, add context), then **raise again** — either the same exception (bare \`raise\`) or a new one that links back to the original with \`from\`. The exception keeps climbing; the cause travels with it.`,
  },
  syntax: [
    py`#### Raising`,
    { code: py`raise ValueError("quantity must be at least 1, got 0")   # an instance with a message
raise ValueError                                          # a class: Python calls ValueError() for you
raise                                                     # inside except: re-raise the current exception
raise ConfigError("bad port") from err                    # explicit chaining
raise ConfigError("bad port") from None                   # hide the original context`, lang: 'python', static: true, title: 'the five forms' },
    py`Only exception objects can be raised: anything that inherits from \`BaseException\`. \`raise "out of stock"\` fails with \`TypeError: exceptions must derive from BaseException\`.`,
    py`#### Choosing the right built-in exception`,
    py`The type is part of your function's interface — callers write \`except ValueError\` based on it. Pick the one that describes the problem **from the caller's point of view**:`,
    py`| raise… | when… | example |
|---|---|---|
| \`ValueError\` | the argument has the right **type** but an unacceptable **value** | \`parse_quantity("0")\`, \`set_volume(11)\`, unknown product name |
| \`TypeError\` | the argument is the wrong **type** altogether | \`unit_price(42)\` when a \`str\` is required |
| \`KeyError\` | a key is missing from a **mapping-like** object you implement ([dictionaries](lesson:dictionaries)) | \`inventory["kiwis"]\` on your own container |
| \`IndexError\` | a position is out of range in a **sequence-like** object | \`playlist[99]\` on your own class |
| \`LookupError\` | (catch, rarely raise) the parent of \`KeyError\` and \`IndexError\` | |
| \`NotImplementedError\` | a method that **subclasses must override** isn't overridden (see [abstract base classes](lesson:abstract-base-classes)) | a base \`Shape.area()\` |
| \`RuntimeError\` | the call is valid but the object's **state** forbids it, and nothing more specific fits | "connection already closed" |
| \`FileNotFoundError\`, \`PermissionError\`, \`TimeoutError\` | re-raising or simulating an OS-level failure | a fake storage backend in tests |`,
    { callout: 'tip', title: 'Write messages for the person debugging', text: py`Say what was expected **and** what you got, using \`!r\` so strings show their quotes: \`f"quantity must be a whole number, got {text!r}"\` → \`quantity must be a whole number, got 'two'\`. "Invalid input" helps nobody. Never put secrets (passwords, tokens) in messages — they end up in logs ([secrets](lesson:secrets-and-passwords)).` },
    { callout: 'note', title: "KeyError's message is quoted", text: py`\`str(KeyError("pen"))\` is \`'pen'\` *with* quotes, because \`KeyError\` shows the repr of the missing key. That's why handlers often re-raise a missing product as \`ValueError(f"unknown product {name!r}")\` with a full sentence instead.` },
    py`#### Re-raising with a bare \`raise\``,
    py`Inside an \`except\` block, a plain \`raise\` re-raises **the exception being handled**, unchanged, with its original traceback. Use it when this layer wants to *notice* the error (log it, roll back, count it) but not *handle* it:`,
    { code: py`def checkout(product, quantity_text):
    try:
        return unit_price(product) * parse_quantity(quantity_text)
    except ValueError:
        print(f"[log] checkout failed for {product!r}")
        raise                 # the caller still gets the original ValueError`, lang: 'python', static: true, title: 'notice, then pass it on' },
    py`\`raise err\` also works but adds an extra line (the re-raise itself) to the traceback; prefer the bare form. A bare \`raise\` **outside** any handler fails with \`RuntimeError: No active exception to reraise\`.`,
    py`#### Chaining: \`raise … from …\``,
    py`When you catch one exception and raise a *different* one, Python always remembers the first. The \`from\` clause says how:`,
    { code: py`def parse_port(text):
    try:
        return int(text)
    except ValueError as err:
        raise RuntimeError(f"bad port in config: {text!r}") from err


try:
    parse_port("eighty")
except RuntimeError as err:
    print(err)                         # bad port in config: 'eighty'
    print(repr(err.__cause__))         # ValueError("invalid literal for int() with base 10: 'eighty'")`, lang: 'python', title: 'explicit chaining keeps the cause' },
    py`If that error were never caught, the traceback would show **both** exceptions, linked by one of three sentences:`,
    py`| you wrote… | link in the traceback | attributes |
|---|---|---|
| \`raise New(...)\` inside \`except\` | *During handling of the above exception, another exception occurred:* | \`__context__\` = old (set automatically) |
| \`raise New(...) from err\` | *The above exception was the direct cause of the following exception:* | \`__cause__\` = err, \`__suppress_context__\` = True |
| \`raise New(...) from None\` | (nothing — only the new exception is shown) | \`__cause__\` = None, \`__suppress_context__\` = True |`,
    py`The first wording suggests an **accident** ("while handling X, something else broke"). Use \`from err\` when the new exception is a deliberate *translation*, and \`from None\` when the original is an irrelevant implementation detail (a dict lookup behind your function, say).`,
    py`#### \`assert\` is for bugs, not for input`,
    { code: py`def average(scores):
    assert scores, "average() needs at least one score"   # a promise to yourself
    return sum(scores) / len(scores)`, lang: 'python', title: 'an assertion documents an assumption' },
    py`\`assert condition, message\` raises \`AssertionError(message)\` if the condition is false. But **Python removes every assert when run with \`-O\`** (or \`PYTHONOPTIMIZE\` set), because the language defines \`assert\` as "only check this while \`__debug__\` is true". Use \`assert\` for internal sanity checks and [tests](lesson:testing-fundamentals); use \`if … : raise ValueError(…)\` for anything that must *always* be checked — user input, API arguments, permissions.`,
    { code: py`python -O app.py      # every assert statement is skipped`, lang: 'bash', title: 'optimised mode' },
  ],
  walkthrough: {
    title: 'Reading the order-intake program',
    lang: 'python',
    code: ORDER_INTAKE,
    intro: py`This is the playground program. Press **Guide** there to follow these steps in the editor.`,
    steps: [
      { lines: [5, 10], text: py`\`parse_quantity\` catches the low-level \`ValueError\` from \`int()\` and raises a **new** \`ValueError\` with a message that makes sense to a shop user. \`from err\` keeps the original as \`__cause__\`.` },
      { lines: [11, 13], text: py`A second rule with no underlying exception to chain: \`"0"\` converts fine but breaks the business rule, so we raise a plain \`ValueError\`.` },
      { lines: [16, 18], text: py`Passing a non-string product is a **programming error**, not bad user data, so it gets a \`TypeError\`. Callers that only expect bad input (\`except ValueError\`) won't accidentally swallow it.` },
      { lines: [19, 22], text: py`The \`KeyError\` from the dict is an implementation detail. \`from None\` replaces it with a clear \`ValueError\` and hides the dict lookup from the traceback.` },
      { lines: [25, 30], text: py`\`checkout\` wants to *log* failures but not *decide* what to do. A bare \`raise\` re-raises the very same exception object, traceback intact.` },
      { lines: [33, 41], text: py`The top level decides: rejected orders are reported and the loop continues. \`err.__cause__\` reveals the low-level reason when there is one — that's what chaining preserved.` },
    ],
  },
  playground: {
    title: 'Order intake',
    objective: 'Run it, connect each REJECTED line to the raise that produced it, then change how errors are raised and chained.',
    files: { 'main.py': ORDER_INTAKE },
    expected: py`\`\`\`text
OK       pen x 3 = 3.60
  [log] checkout failed for 'notebook'
REJECTED notebook x two: quantity must be a whole number, got 'two'
  caused by ValueError: invalid literal for int() with base 10: 'two'
  [log] checkout failed for 'stapler'
REJECTED stapler x 1: unknown product 'stapler'
  [log] checkout failed for 'backpack'
REJECTED backpack x 0: quantity must be at least 1, got 0
\`\`\`

Only the "notebook" rejection has a cause: it was raised \`from err\`. "stapler" used \`from None\`, and "backpack" had nothing to chain.`,
    experiments: [
      {
        id: 'max-quantity',
        task: py`Add a rule to \`parse_quantity\`: more than 100 items raises \`ValueError\` with the message \`quantity must be at most 100, got 250\` (using the actual number). Add \`("pen", "250")\` to \`orders\` to see it.`,
        hint: py`Copy the "at least 1" check and adapt it: \`if quantity > 100: raise ValueError(f"quantity must be at most 100, got {quantity}")\`.`,
        tests: [
          { name: 'parse_quantity("250") raises a clear ValueError', code: py`with raises(ValueError, match="at most 100, got 250"):
    parse_quantity("250")` },
          { name: '100 is still allowed', code: py`assert parse_quantity("100") == 100` },
        ],
        explain: py`Validation rules belong where the value is parsed, so every caller benefits. The message names the limit **and** the offending value, so whoever reads it knows how to fix the input.`,
      },
      {
        id: 'keep-the-cause',
        task: py`In \`unit_price\`, change \`except KeyError:\` to \`except KeyError as err:\` and \`from None\` to \`from err\`. Run it: what new line appears under the "stapler" rejection?`,
        hint: py`Two small edits on lines 21 and 22. The main loop already prints \`err.__cause__\` when it exists.`,
        tests: [
          { name: 'the unknown-product error is chained to a KeyError', code: py`try:
    unit_price("stapler")
except ValueError as err:
    assert isinstance(err.__cause__, KeyError), 'Use "from err" so __cause__ is the KeyError'
else:
    raise AssertionError("unit_price('stapler') should raise ValueError")` },
          { name: 'the output now shows the KeyError cause', code: py`assert "caused by KeyError: 'stapler'" in output` },
        ],
        explain: py`\`from err\` sets \`__cause__\`, so the KeyError becomes visible (note its quoted message). Whether that's useful is a judgement call: here the dict lookup is an internal detail and \`from None\` gives cleaner output — but when the cause carries information (a file path, an HTTP status), keep it.`,
      },
      {
        id: 'programming-error',
        task: py`Add \`(42, "1")\` to the \`orders\` list. The program crashes with a \`TypeError\` — the loop only catches \`ValueError\`. Add a second handler to the loop, \`except TypeError as err:\`, that prints \`PROGRAMMING ERROR: \` followed by the message.`,
        hint: py`Add the new \`except TypeError as err:\` clause between the existing \`except ValueError\` block and \`else:\`, with \`print(f"PROGRAMMING ERROR: {err}")\`.`,
        tests: [
          { name: 'reports the TypeError instead of crashing', code: py`assert "PROGRAMMING ERROR: product must be a str, not int" in output` },
          { name: 'the other orders are still processed', code: py`assert "OK       pen x 3 = 3.60" in output` },
        ],
        explain: py`Using different types for different *kinds* of failure lets callers respond differently: bad user data gets a friendly rejection, a programming error gets flagged loudly. In a real service you'd log the \`TypeError\` with its traceback and probably let it fail the request.`,
      },
      {
        id: 'swallow-it',
        task: py`Delete the bare \`raise\` line in \`checkout\` (keep the log line). Predict what happens to the "notebook" order, then run it. Put the \`raise\` back afterwards.`,
        hint: py`Without \`raise\`, the handler finishes normally — so what does \`checkout\` return?`,
        explain: py`Without the re-raise, \`checkout\` swallows the error and falls off the end of the function, returning \`None\`. The caller's \`else\` branch then tries to format \`None\` with \`:.2f\` and crashes with a confusing \`TypeError\` far from the real problem. Logging an error is not handling it: if you can't recover, re-raise.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch an exception climb through three frames',
    props: {
      code: py`def parse_age(text):
    age = int(text)
    if age < 0:
        raise ValueError(f"age can't be negative: {age}")
    return age


def load_member(row):
    name, age_text = row.split(",")
    return {"name": name, "age": parse_age(age_text)}


def main():
    members = []
    for row in ["Ada,36", "Ben,-4"]:
        members.append(load_member(row))
    print(members)


main()
`,
      expectError: true,
      notes: {
        2: '`int()` succeeds for both rows — "-4" is a perfectly valid int.',
        4: 'For Ben the business rule fails. `raise` creates a ValueError object and starts unwinding: line 5 never runs.',
        10: 'The exception arrives in `load_member` in the middle of building the dict. There is no `try` here, so this frame is abandoned too.',
        16: '`members.append(...)` never happens for Ben. `main()` has no handler either…',
        20: '…so the exception leaves the program. Python prints the traceback: outermost call first, the `raise` line last.',
      },
    },
    alt: 'Step-by-step trace of main() calling load_member(), which calls parse_age(). The first row, Ada,36, is processed normally. For Ben,-4, parse_age raises ValueError; the exception event appears in parse_age, then in load_member, then in main, each frame being removed from the stack, until the program ends with the uncaught ValueError.',
    caption: py`Step through with ▶ and watch the **frames** on the left: the exception removes \`parse_age\`, then \`load_member\`, then \`main\`, because none of them has a matching \`except\`. The crash at the end is expected — try adding a \`try\` around line 16 in your head: where would execution continue?`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`raise\` does two things: it **creates** (or takes) an exception object, and it **starts unwinding** — leaving the current block and function immediately, frame after frame, until a matching \`except\` is found. Nothing after the \`raise\` in the same block runs.`,
      py`As the exception passes through each function, Python records that function in the exception's **traceback**. That's why the printed traceback lists every call from the outermost one (top) to the line that raised (bottom) — the same report you learned to read in [reading error messages](lesson:reading-errors).`,
      py`An exception is just an object. You can create one without raising it, store it, inspect it, and raise it later:`,
      { code: py`problem = ValueError("quantity must be at least 1, got 0")
print(type(problem).__name__, problem.args)   # ValueError ('quantity must be at least 1, got 0',)

try:
    raise problem
except ValueError as err:
    print(err is problem)                     # True: the very same object`, lang: 'python', title: 'exceptions are ordinary objects' },
    ],
    technical: [
      py`**Class or instance.** \`raise ValueError\` is shorthand for \`raise ValueError()\`: if you raise a class, Python instantiates it with no arguments. Anything that isn't a \`BaseException\` subclass or instance is rejected with \`TypeError\`.`,
      py`**The traceback grows during unwinding.** Each exception has a \`__traceback__\` attribute: a linked list of traceback entries (one per frame, with the line number). Every time the exception leaves a frame, an entry is added. A bare \`raise\` continues with the same exception and traceback; \`raise err\` re-raises the same object but adds an entry for the \`raise err\` line itself.`,
      py`**Automatic context.** Whenever an exception is raised while another is being handled (inside an \`except\` or \`finally\` block), Python stores the one being handled in the new exception's \`__context__\`. You don't have to do anything — that's implicit chaining.`,
      py`**Explicit cause.** \`raise New() from X\` sets \`New.__cause__ = X\` and \`New.__suppress_context__ = True\`. With \`from None\`, \`__cause__\` is \`None\` and \`__suppress_context__\` is \`True\` — but \`__context__\` is **still set**: the original isn't destroyed, just hidden from the printed traceback.`,
      py`**How tracebacks are printed** (\`traceback.print_exception\`): if \`__cause__\` is set, print the cause first followed by "The above exception was the direct cause…"; otherwise, if \`__context__\` is set and not suppressed, print it followed by "During handling of the above exception…". This repeats down the chain, so a three-level chain prints three tracebacks, the **root cause at the top**.`,
      { code: py`try:
    try:
        {}["port"]
    except KeyError:
        raise ValueError("missing port") from None
except ValueError as err:
    print(err.__cause__)                    # None
    print(repr(err.__context__))            # KeyError('port') — still there
    print(err.__suppress_context__)         # True`, lang: 'python', title: 'from None hides, it does not delete' },
      py`**assert compiles to a conditional.** The reference defines \`assert expr, msg\` as \`if __debug__: if not expr: raise AssertionError(msg)\`. \`__debug__\` is a constant that is \`False\` under \`-O\`, and the compiler drops the whole statement. So a side effect inside an assert (\`assert items.pop()\`) silently disappears in optimised mode.`,
    ],
    production: [
      py`**Raise early, catch late.** Validate at the point where bad data enters a function and raise immediately ([input validation](lesson:input-validation)); handle at the layer that knows the context (the request handler, the CLI). The middle layers usually do nothing — or re-raise after cleaning up.`,
      py`**Translate at boundaries, with \`from\`.** A storage module shouldn't leak \`sqlite3.OperationalError\` to its callers; it raises its own \`StorageError(...) from err\` (see [custom exceptions](lesson:custom-exceptions)). The callers depend on your exception, while the traceback still shows the database error for debugging.`,
      py`**Don't log and re-raise at every level.** If each layer logs before re-raising, one failure appears five times in the logs. Log once — usually where the exception is finally handled — with \`logger.exception()\`, which records the full chain ([error-handling patterns](lesson:error-handling-patterns)).`,
      py`**Never rely on \`assert\` for security or validation.** Production deployments sometimes run with \`-O\` or \`PYTHONOPTIMIZE\`; an \`assert user.is_admin\` check would vanish. Linters such as Bandit flag \`assert\` in non-test code for exactly this reason.`,
      py`**Add context without changing the type** with \`err.add_note("while importing row 42")\` (3.11+) and a bare \`raise\` — covered in [exception groups & notes](lesson:exception-groups).`,
    ],
  },
  mistakes: [
    {
      title: 'Raising a bare Exception',
      wrong: { code: py`def withdraw(balance, amount):
    if amount > balance:
        raise Exception("not enough money")
    return balance - amount`, lang: 'python' },
      right: { code: py`def withdraw(balance, amount):
    if amount > balance:
        raise ValueError(f"cannot withdraw {amount}: balance is only {balance}")
    return balance - amount`, lang: 'python' },
      explanation: py`Callers can only catch \`Exception\` — which also catches every bug. Use a specific built-in (or your own subclass, see [custom exceptions](lesson:custom-exceptions)) and include the values in the message.`,
    },
    {
      title: 'Translating an error and losing the original',
      wrong: { code: py`def load_port(text):
    try:
        return int(text)
    except ValueError as err:
        raise RuntimeError("config error: " + str(err))`, lang: 'python', static: true },
      right: { code: py`def load_port(text):
    try:
        return int(text)
    except ValueError as err:
        raise RuntimeError(f"config error: bad port {text!r}") from err`, lang: 'python', static: true },
      explanation: py`Gluing \`str(err)\` into a message throws away the original type and traceback, and without \`from\` the traceback says "During handling… another exception occurred", which reads like an accident. \`from err\` records a deliberate, debuggable link.`,
    },
    {
      title: 'Using assert to validate input',
      wrong: { code: py`def set_age(age):
    assert 0 <= age <= 150, "invalid age"
    return age`, lang: 'python' },
      right: { code: py`def set_age(age):
    if not 0 <= age <= 150:
        raise ValueError(f"age must be between 0 and 150, got {age}")
    return age`, lang: 'python' },
      explanation: py`Under \`python -O\` the assert disappears and any age is accepted. \`AssertionError\` is also the wrong signal: it means "the program has a bug", not "the caller passed a bad value".`,
    },
    {
      title: 'Logging and then forgetting to re-raise',
      wrong: { code: py`def charge(card, amount):
    try:
        return gateway.charge(card, amount)
    except PaymentError as err:
        log.error("charge failed: %s", err)
        # returns None — the caller thinks the charge succeeded!`, lang: 'python', static: true },
      right: { code: py`def charge(card, amount):
    try:
        return gateway.charge(card, amount)
    except PaymentError:
        log.exception("charge failed")
        raise`, lang: 'python', static: true },
      explanation: py`If this layer can't recover, it must not pretend everything is fine. Falling off the end of a handler returns \`None\`, which turns a clear error into a mysterious one later.`,
    },
    {
      title: 'raise NotImplemented instead of NotImplementedError',
      wrong: { code: py`class Shape:
    def area(self):
        raise NotImplemented`, lang: 'python' },
      right: { code: py`class Shape:
    def area(self):
        raise NotImplementedError(f"{type(self).__name__} must implement area()")`, lang: 'python' },
      explanation: py`\`NotImplemented\` is a special **value** that operator methods like \`__eq__\` *return*; it isn't an exception, so raising it gives \`TypeError: exceptions must derive from BaseException\`. For "subclasses must override this", raise \`NotImplementedError\` — or use an [abstract base class](lesson:abstract-base-classes).`,
    },
  ],
  debugging: [
    {
      symptom: py`RuntimeError: No active exception to reraise`,
      cause: py`A bare \`raise\` ran outside any \`except\` block (often after moving code out of a handler).`,
      fix: py`Only use bare \`raise\` inside a handler. Elsewhere, raise a specific exception object.`,
    },
    {
      symptom: py`TypeError: exceptions must derive from BaseException`,
      cause: py`You raised something that isn't an exception: a string (\`raise "oops"\`), \`None\`, or the \`NotImplemented\` constant.`,
      fix: py`Raise an exception class or instance: \`raise ValueError("oops")\`, \`raise NotImplementedError\`.`,
    },
    {
      symptom: py`The above exception was the direct cause of the following exception:`,
      cause: py`Explicit chaining with \`raise … from err\`. Two (or more) tracebacks are printed: the root cause first, the translated error last.`,
      fix: py`Read the **last** traceback to learn what the program was trying to do, then the **first** to learn the low-level reason. Usually the fix is for the first one (bad data, missing file).`,
    },
    {
      symptom: py`During handling of the above exception, another exception occurred:`,
      cause: py`An exception was raised inside an \`except\`/\`finally\` block without \`from\`. Either your handler has a bug, or you translated an error without saying so.`,
      fix: py`If the second exception is a bug in the handler, fix the handler. If it's a deliberate translation, write \`from err\` (keep the cause) or \`from None\` (hide it).`,
    },
    {
      symptom: py`A check that works in development never fires in production.`,
      cause: py`The check is an \`assert\`, and production runs with \`python -O\` or \`PYTHONOPTIMIZE\` set.`,
      fix: py`Replace it with \`if not condition: raise ValueError(...)\` (or another suitable exception).`,
    },
  ],
  bestPractices: [
    'Raise as soon as you detect that a function cannot keep its promise; don\'t return fake values.',
    'Choose the exception type from the caller\'s point of view: ValueError for bad values, TypeError for wrong types.',
    'Write messages that name the rule and show the offending value with !r; never include secrets.',
    'Use a bare raise to re-raise after logging or clean-up; use raise New(...) from err when translating.',
    'Use from None only when the original exception is a pure implementation detail.',
    'Use assert only for internal invariants and tests — never for input validation or security checks.',
    'Raise NotImplementedError (not NotImplemented) from methods subclasses must override.',
  ],
  whenToUse: {
    use: [
      'A function receives input that violates its documented contract.',
      'An operation cannot complete and the current function cannot recover sensibly.',
      'You want to translate an implementation-level error into one that fits your API (raise … from).',
    ],
    avoid: [
      'Raising a bare Exception — callers can\'t catch it precisely.',
      'Raising for situations your API documents as normal (e.g. a find() that is allowed to find nothing may return None).',
      'Using assert for anything that must hold in production.',
    ],
  },
  comparison: {
    title: 'Forms of raise at a glance',
    headers: ['statement', 'what is raised', 'traceback shows', 'use it when'],
    rows: [
      ['raise ValueError("…")', 'a new exception', 'just the new one (plus "During handling…" if inside a handler)', 'you detect a problem'],
      ['raise', 'the exception being handled, unchanged', 'the original traceback', 'you logged / cleaned up and the caller should decide'],
      ['raise err', 'the same object', 'the original + the re-raise line', 'rarely; prefer the bare form'],
      ['raise New(…) from err', 'a new exception with __cause__ = err', 'both, linked by "direct cause"', 'translating to your API\'s exception'],
      ['raise New(…) from None', 'a new exception, context suppressed', 'only the new one', 'the original is an irrelevant detail'],
    ],
    note: py`In every case where a new exception is raised inside a handler, \`__context__\` is set automatically. \`from\` only controls what gets **displayed** and recorded as the *cause*.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'raising-exceptions-q1',
      type: 'mcq',
      prompt: py`\`withdraw(balance, amount)\` is called with \`amount = -20\` (an int, but negative). Which built-in exception should it raise?`,
      options: [
        { text: 'TypeError', why: 'The type is fine — it is an int, as expected. TypeError is for arguments of the wrong type.' },
        'ValueError',
        { text: 'KeyError', why: 'KeyError means a key is missing from a mapping. Nothing is being looked up here.' },
        { text: 'RuntimeError', why: 'RuntimeError is a vague last resort. A more specific exception describes this exactly.' },
      ],
      answer: 1,
      explanation: py`\`ValueError\` = right type, unacceptable value. A good version: \`raise ValueError(f"amount must be positive, got {amount}")\`.`,
    },
    {
      id: 'raising-exceptions-q2',
      type: 'output',
      prompt: 'What are the three printed lines?',
      code: py`try:
    try:
        int("x")
    except ValueError as err:
        raise RuntimeError("config broken") from err
except RuntimeError as outer:
    print(type(outer.__cause__).__name__)
    print(outer.__context__ is outer.__cause__)
    print(outer.__suppress_context__)`,
      answer: py`ValueError
True
True`,
      explanation: py`\`from err\` sets \`__cause__\` to the ValueError. Because the RuntimeError was raised inside the handler, \`__context__\` is set automatically to the same ValueError. And \`from\` always sets \`__suppress_context__ = True\` so the context isn't printed twice.`,
    },
    {
      id: 'raising-exceptions-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`try:
    try:
        {}["port"]
    except KeyError:
        raise ValueError("missing port") from None
except ValueError as e:
    print(e.__cause__, type(e.__context__).__name__)`,
      options: [
        { text: 'None NoneType', why: 'from None hides the context from the traceback, but __context__ is still recorded.' },
        'None KeyError',
        { text: "'port' KeyError", why: '__cause__ is exactly what follows from — here None.' },
        { text: 'A KeyError traceback', why: 'The KeyError was caught by the inner handler; only the ValueError escapes it, and the outer handler catches that.' },
      ],
      answer: 1,
      explanation: py`\`from None\` sets \`__cause__ = None\` and \`__suppress_context__ = True\`. The \`__context__\` (the KeyError) is still attached — it's just not displayed in tracebacks.`,
    },
    {
      id: 'raising-exceptions-q4',
      type: 'bug',
      prompt: 'This function crashes with `TypeError: exceptions must derive from BaseException` when the balance is too low. Click the line with the bug.',
      code: py`def withdraw(balance, amount):
    if amount > balance:
        raise "insufficient funds"
    return balance - amount

print(withdraw(50, 80))`,
      answerLine: 3,
      explanation: py`Only exception objects can be raised — a string can't. Write \`raise ValueError(f"insufficient funds: balance {balance}, requested {amount}")\` (or a custom \`InsufficientFundsError\`).`,
    },
    {
      id: 'raising-exceptions-q5',
      type: 'fill',
      prompt: 'Fill the blanks: the first function logs and passes **the same exception** on; the second translates the error but keeps the original as its **cause**.',
      code: py`def read_file(path):
    try:
        with open(path) as f:
            return f.read()
    except OSError:
        print("could not read", path)
        ___

def parse_port(text):
    try:
        return int(text)
    except ValueError as err:
        raise RuntimeError(f"bad port {text!r}") ___ err`,
      answer: [['raise'], ['from']],
      explanation: py`A bare \`raise\` re-raises the current exception with its original traceback. \`raise … from err\` sets \`__cause__\`, producing "The above exception was the direct cause of the following exception" in the traceback.`,
    },
    {
      id: 'raising-exceptions-q6',
      type: 'mcq',
      prompt: py`What happens to \`assert amount > 0, "amount must be positive"\` when the program runs with \`python -O\`?`,
      options: [
        { text: 'It raises AssertionError even when amount is positive', why: '-O does not change what assert checks; it removes the statement completely.' },
        { text: 'It becomes a warning instead of an error', why: 'There is no warning: the statement simply does not exist in optimised bytecode.' },
        'It is removed: the condition is never checked',
        { text: 'Nothing changes — -O only affects speed', why: '-O sets __debug__ to False, and assert is defined to run only while __debug__ is true.' },
      ],
      answer: 2,
      explanation: py`Assertions are debugging aids. With \`-O\` (or \`PYTHONOPTIMIZE\`), \`__debug__\` is \`False\` and asserts are compiled out — so never use them for checks that must always happen.`,
    },
    {
      id: 'raising-exceptions-q7',
      type: 'short',
      prompt: py`When would you write \`raise … from None\` instead of \`raise … from err\`? Give an example.`,
      answer: py`Use "from None" when the original exception is an implementation detail that would only confuse the reader — for example, a function that looks up a product in an internal dict and turns the KeyError into ValueError("unknown product 'stapler'"). The KeyError adds nothing. Use "from err" when the cause carries useful debugging information, e.g. translating an OSError (with its filename and errno) into ConfigError — you want to see why the file couldn't be read.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'check-percentage',
      title: 'Guard a percentage',
      difficulty: 'intermediate',
      prompt: py`Write \`check_percentage(value)\` that returns \`value\` unchanged if it is a number from 0 to 100 (inclusive), and otherwise raises:

- \`TypeError\` if \`value\` is not an \`int\` or \`float\` — **including \`bool\`** (\`True\` is technically an int, but a percentage of \`True\` is a bug). Message: \`percentage must be a number, not <type name>\`, e.g. \`percentage must be a number, not str\`.
- \`ValueError\` if it is a number outside 0–100. Message: \`percentage must be between 0 and 100, got <value>\`, e.g. \`percentage must be between 0 and 100, got -1\`.`,
      files: {
        'main.py': py`def check_percentage(value):
    """Return value if it is a number from 0 to 100; otherwise raise."""
    # TODO: TypeError for non-numbers (bools too), ValueError for out-of-range values
    return value


print(check_percentage(75))
`,
      },
      hints: [
        'Check the type first, then the range: a string can\'t be compared with 0 anyway.',
        'isinstance(value, (int, float)) accepts ints and floats — but also True/False, so test isinstance(value, bool) separately.',
        'if isinstance(value, bool) or not isinstance(value, (int, float)):\n    raise TypeError(f"percentage must be a number, not {type(value).__name__}")\nif not 0 <= value <= 100:\n    raise ValueError(f"percentage must be between 0 and 100, got {value}")',
      ],
      solution: {
        explanation: py`The type check comes first, because comparing a string with \`0\` would itself raise a confusing \`TypeError\`. \`bool\` is a subclass of \`int\`, so it needs its own test. Writing the range check as \`not 0 <= value <= 100\` has a bonus: \`float("nan")\` fails every comparison, so NaN is rejected too — a version written as \`value < 0 or value > 100\` would let NaN through. \`type(value).__name__\` gives the short type name for the message.`,
        files: {
          'main.py': py`def check_percentage(value):
    """Return value if it is a number from 0 to 100; otherwise raise."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(f"percentage must be a number, not {type(value).__name__}")
    if not 0 <= value <= 100:
        raise ValueError(f"percentage must be between 0 and 100, got {value}")
    return value


print(check_percentage(75))
for bad in ["75", 120]:
    try:
        check_percentage(bad)
    except (TypeError, ValueError) as err:
        print(type(err).__name__, "-", err)
`,
        },
      },
      tests: [
        { name: 'returns valid values unchanged', code: py`assert check_percentage(0) == 0
assert check_percentage(50) == 50
assert check_percentage(100) == 100
assert check_percentage(99.5) == 99.5` },
        { name: 'a string raises TypeError with the type name', code: py`with raises(TypeError, match="percentage must be a number, not str"):
    check_percentage("50")` },
        { name: 'None raises TypeError', code: py`with raises(TypeError, match="not NoneType"):
    check_percentage(None)` },
        { name: 'True is rejected with TypeError', code: py`with raises(TypeError, match="not bool"):
    check_percentage(True)` },
        { name: 'out-of-range numbers raise ValueError', code: py`with raises(ValueError, match="between 0 and 100, got -1"):
    check_percentage(-1)
with raises(ValueError, match="got 100.5"):
    check_percentage(100.5)` },
      ],
    },
    {
      id: 'settings-parser',
      title: 'A settings parser with chained errors',
      difficulty: 'intermediate',
      prompt: py`Settings arrive as lines like \`"width=80"\`. Complete two functions:

**\`parse_setting(line)\`** returns \`(key, int_value)\` with spaces stripped: \`parse_setting(" depth = 3 ")\` → \`("depth", 3)\`.
- No \`=\` (or an empty key) → raise \`ValueError\` with message \`expected key=value, got <line!r>\`.
- Value not an integer → raise \`ValueError\` with message \`setting <key!r> must be an integer, got <value!r>\`, e.g. \`setting 'height' must be an integer, got 'tall'\`, **chained** to the original \`int()\` error with \`from\`.

**\`load_settings(lines)\`** returns a dict of all settings. If any line fails, raise \`ValueError\` with message \`line N: <original message>\` (N counts from 1), chained to the error from \`parse_setting\`.`,
      files: {
        'main.py': py`def parse_setting(line):
    """'width=80' -> ('width', 80). Raise ValueError with a helpful message for bad lines."""
    key, value = line.split("=")
    return key, int(value)


def load_settings(lines):
    """Parse every line into a dict; on a bad line raise ValueError('line N: ...') from the cause."""
    settings = {}
    for line in lines:
        key, value = parse_setting(line)
        settings[key] = value
    return settings


print(load_settings(["width=80", "height=24"]))
`,
      },
      hints: [
        'line.partition("=") returns (before, separator, after) and never raises; the separator is "" when there is no "=".',
        'Wrap only int(value) in try/except ValueError as err, and raise the new ValueError from err.',
        'In load_settings use enumerate(lines, start=1) and:\ntry:\n    key, value = parse_setting(line)\nexcept ValueError as err:\n    raise ValueError(f"line {number}: {err}") from err',
      ],
      solution: {
        explanation: py`\`partition()\` splits on the first \`=\` without raising, so a missing separator is a plain rule check — there is no underlying exception, so no \`from\`. The integer conversion *does* have an underlying exception, so the new, friendlier \`ValueError\` is chained with \`from err\`: the message speaks the user's language, while \`__cause__\` keeps Python's exact complaint. \`load_settings\` adds **where** (the line number) and chains again, producing a three-link chain: line → setting → \`int()\`. The type stays \`ValueError\` throughout, so callers need only one \`except\`.`,
        files: {
          'main.py': py`def parse_setting(line):
    """'width=80' -> ('width', 80). Raise ValueError with a helpful message for bad lines."""
    key, sep, value = line.partition("=")
    key, value = key.strip(), value.strip()
    if not sep or not key:
        raise ValueError(f"expected key=value, got {line!r}")
    try:
        number = int(value)
    except ValueError as err:
        raise ValueError(f"setting {key!r} must be an integer, got {value!r}") from err
    return key, number


def load_settings(lines):
    """Parse every line into a dict; on a bad line raise ValueError('line N: ...') from the cause."""
    settings = {}
    for number, line in enumerate(lines, start=1):
        try:
            key, value = parse_setting(line)
        except ValueError as err:
            raise ValueError(f"line {number}: {err}") from err
        settings[key] = value
    return settings


print(load_settings(["width=80", "height=24"]))
try:
    load_settings(["width=80", "height=tall"])
except ValueError as err:
    print(err)
    print("  because:", err.__cause__)
    print("  because:", err.__cause__.__cause__)
`,
        },
      },
      tests: [
        { name: 'parses and strips a setting', code: py`assert parse_setting("width=80") == ("width", 80)
assert parse_setting(" depth = 3 ") == ("depth", 3)` },
        { name: 'a line without = raises a clear ValueError', code: py`with raises(ValueError, match="expected key=value, got 'width 80'"):
    parse_setting("width 80")` },
        { name: 'a non-integer value raises a chained ValueError', code: py`with raises(ValueError, match="setting 'height' must be an integer, got 'tall'") as caught:
    parse_setting("height=tall")
assert isinstance(caught.value.__cause__, ValueError), 'Chain the int() error with "from err"'
assert "invalid literal" in str(caught.value.__cause__)` },
        { name: 'load_settings builds a dict', code: py`assert load_settings(["width=80", "height=24"]) == {"width": 80, "height": 24}` },
        { name: 'load_settings reports the line number and chains the cause', code: py`with raises(ValueError, match="^line 2: setting 'height'") as caught:
    load_settings(["width=80", "height=tall"])
assert caught.value.__cause__ is not None, 'Use "from err" in load_settings'
assert "must be an integer" in str(caught.value.__cause__)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'raising-exceptions-choose-type',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you decide between raising ValueError, TypeError and KeyError?',
      answer: 'TypeError when an argument is the wrong type; ValueError when the type is right but the value is unacceptable; KeyError when a key is missing from a mapping-like object. Choose from the caller\'s point of view, because the type is what callers catch.',
      explanation: py`\`int("abc")\` raises \`ValueError\` (a string is a valid type for \`int()\`, but not that string); \`"a" + 1\` raises \`TypeError\`. For your own functions, follow the same conventions so callers' \`except\` clauses work as they expect. When none fits well, a custom exception subclass is often clearer than \`RuntimeError\`.`,
      code: { lang: 'python', code: py`def set_volume(level):
    if not isinstance(level, int):
        raise TypeError(f"level must be an int, not {type(level).__name__}")
    if not 0 <= level <= 10:
        raise ValueError(f"level must be 0-10, got {level}")
    return level` },
      whyAsked: 'Exception types are part of an API. Interviewers check that you design errors deliberately rather than raising Exception everywhere.',
      mistakes: ['Using TypeError for out-of-range values', 'Raising plain Exception', 'Using KeyError for "a user typed an unknown name" in a non-mapping API (ValueError or a custom error reads better)'],
      followUps: ['When would you create a custom exception instead?', 'Why is raising Exception a problem for callers?', 'What does LookupError have to do with KeyError?'],
      modelAnswer: 'I think about what the caller did wrong. If they passed the wrong kind of object — a string where I need an int — that is a TypeError. If the type is fine but the value breaks a rule, like a negative quantity, that is a ValueError. KeyError is for a missing key in something that behaves like a mapping, IndexError for a sequence. These are conventions the standard library follows, and callers write their except clauses around them, so matching them makes my functions predictable. If no built-in fits, I create a small custom exception rather than reaching for RuntimeError or plain Exception.',
    },
    {
      id: 'raising-exceptions-raise-forms',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Inside an except block, compare `raise`, `raise err`, and `raise NewError("…") from err`.',
      answer: 'Bare raise re-raises the current exception with its original traceback. raise err re-raises the same object but adds the re-raise line to its traceback. raise NewError(...) from err raises a different exception whose __cause__ is err, so the traceback shows both, linked by "direct cause".',
      explanation: py`Use bare \`raise\` when this layer only observes the error (logging, rollback). Use \`from err\` when translating to your own API's exception type while preserving debuggability. \`raise err\` is mostly equivalent to bare \`raise\` but noisier; it's needed only when re-raising an exception stored earlier, outside its handler.`,
      code: { lang: 'python', code: py`import traceback


def inner():
    int("x")


def with_bare_raise():
    try:
        inner()
    except ValueError:
        raise


def with_raise_err():
    try:
        inner()
    except ValueError as err:
        raise err


for fn in (with_bare_raise, with_raise_err):
    try:
        fn()
    except ValueError as e:
        print(fn.__name__, [f.lineno for f in traceback.extract_tb(e.__traceback__)])` },
      whyAsked: 'Distinguishes people who have debugged real tracebacks from those who have only written happy-path code.',
      mistakes: ['Saying raise err loses the traceback (that was Python 2 behaviour)', 'Translating errors without from, so the traceback reads like an accident', 'Re-raising Exception(str(err)), losing type and traceback'],
      followUps: ['What does from None do?', 'Where is the cause stored?', 'Why not log at every level before re-raising?'],
      modelAnswer: 'A bare raise inside an except block re-raises exactly the exception being handled, with its traceback untouched — I use it after logging or cleaning up when the caller should decide what to do. raise err re-raises the same object too, but Python adds the re-raise line to the traceback, so it is just noisier. raise NewError from err creates a different exception, typically one that belongs to my module, and records the original as __cause__; the traceback then shows both, joined by "The above exception was the direct cause". That gives callers a stable exception type while keeping the low-level reason for debugging.',
    },
    {
      id: 'raising-exceptions-assert-validation',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'In code review you see `assert request.user.is_admin, "admins only"` guarding a delete endpoint. What do you say?',
      answer: 'That check disappears when Python runs with -O or PYTHONOPTIMIZE, so anyone could delete. It also raises AssertionError, which signals a bug rather than a permission problem. Replace it with an explicit if-check that raises a proper permission error (and returns 403 at the HTTP layer).',
      explanation: py`\`assert\` is defined to run only while \`__debug__\` is true; \`-O\` makes \`__debug__\` false and the compiler removes the statement. Security and validation checks must be ordinary code. \`assert\` remains great for internal invariants ("this list is sorted here") and in tests.`,
      code: { lang: 'python', code: py`class PermissionDenied(Exception):
    """Raised when the current user may not perform an action."""


def delete_invoice(user, invoice_id):
    if not user.get("is_admin"):
        raise PermissionDenied(f"user {user['name']!r} may not delete invoices")
    return f"deleted invoice {invoice_id}"


print(delete_invoice({"name": "ada", "is_admin": True}, 42))` },
      whyAsked: 'A real security bug pattern; it checks whether you know assert semantics and think about deployment settings.',
      mistakes: ['Saying assert is fine because "we never use -O"', 'Replacing it with a print and return None'],
      followUps: ['Where is assert appropriate?', 'How would this map to an HTTP response?', 'What other code silently changes under -O? (__debug__ blocks, docstrings under -OO)'],
      modelAnswer: 'That is a security bug. assert statements only run while __debug__ is true, and running Python with -O or with PYTHONOPTIMIZE set removes them completely, so the permission check would vanish and anyone could delete invoices. It is also the wrong signal: AssertionError means "the program has a bug", not "this user is not allowed". I would replace it with an explicit if-check that raises a dedicated PermissionDenied exception, which the web layer turns into a 403. I keep assert for internal invariants and tests.',
    },
    {
      id: 'raising-exceptions-read-chain',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A job fails with this output. Which error should you fix first?',
      code: { lang: 'text', code: py`Traceback (most recent call last):
  File "settings.py", line 9, in parse_port
    return int(text)
ValueError: invalid literal for int() with base 10: '80O'

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "app.py", line 3, in <module>
    config = load_config("app.ini")
  File "settings.py", line 17, in load_config
    port = parse_port(path, values["port"])
  File "settings.py", line 11, in parse_port
    raise ConfigError(f"bad port in {path}: {text!r}") from err
settings.ConfigError: bad port in app.ini: '80O'` },
      options: ['The ConfigError: load_config should not raise', "The ValueError: the port in app.ini contains the letter O instead of a zero", 'Neither: chained tracebacks are informational only', 'The traceback module: it printed two tracebacks'],
      correctOption: 1,
      answer: 'The root cause is the first traceback: the port "80O" has a letter O. The ConfigError is a deliberate translation that tells you where (app.ini) — exactly what chaining is for. Fix the config value.',
      explanation: py`With explicit chaining, the **first** traceback is the cause and the **last** is what the program was doing. Read bottom-up for context ("loading config failed"), top-down for the reason ("'80O' isn't an int").`,
      whyAsked: 'Reading chained tracebacks quickly is an everyday production skill.',
      mistakes: ['Only reading the last line of the output', 'Thinking "direct cause" means the second error caused the first'],
      followUps: ['How would the wording differ without from?', 'How do you get the chain programmatically?', 'Would you log this at both levels?'],
      modelAnswer: 'With explicit chaining Python prints the root cause first, then "The above exception was the direct cause of the following exception", then the translated error. So the ConfigError at the bottom tells me what the program was doing — loading app.ini — and the ValueError at the top tells me why it failed: the port is "80O", with a letter O instead of a zero. The code is behaving correctly; the fix is the config value. This is exactly why I translate errors with from err rather than discarding the original.',
    },
    {
      id: 'raising-exceptions-cause-vs-context',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Explain __cause__, __context__ and __suppress_context__. How do they decide what a traceback prints?',
      answer: '__context__ is set automatically to the exception being handled when a new one is raised inside except/finally. __cause__ is set explicitly by raise … from X. raise … from sets __suppress_context__ = True. When printing, Python shows __cause__ with "direct cause" if set; otherwise shows __context__ with "During handling…" unless suppressed.',
      explanation: py`\`from None\` sets \`__cause__ = None\` and \`__suppress_context__ = True\`, hiding the context in tracebacks without deleting it — tools can still inspect \`__context__\`. The rules come from PEP 3134 (implicit/explicit chaining) and PEPs 409 and 415 (\`from None\` and \`__suppress_context__\`).`,
      code: { lang: 'python', code: py`def show(exc):
    print(type(exc).__name__,
          "cause:", type(exc.__cause__).__name__,
          "context:", type(exc.__context__).__name__,
          "suppressed:", exc.__suppress_context__)


for mode in ("implicit", "from err", "from None"):
    try:
        try:
            {}["x"]
        except KeyError as err:
            if mode == "implicit":
                raise ValueError("a")
            elif mode == "from err":
                raise ValueError("b") from err
            else:
                raise ValueError("c") from None
    except ValueError as e:
        show(e)` },
      whyAsked: 'Probes deep understanding of the exception model, useful for library authors and anyone writing error-reporting tools.',
      mistakes: ['Thinking from None deletes the original exception', 'Confusing which attribute is automatic', 'Not knowing that from also sets __context__'],
      followUps: ['How would you walk the full chain in code?', 'What does traceback.TracebackException do with these?', 'Can __cause__ be something other than an exception?'],
      modelAnswer: 'Every exception has three chaining attributes. __context__ is filled in automatically: if I raise while another exception is being handled, that one becomes the context. __cause__ is explicit — it is whatever I write after from. Using from also sets __suppress_context__ to True. When a traceback is printed, Python first checks __cause__ and, if present, prints it with "The above exception was the direct cause". Otherwise it prints the context with "During handling of the above exception", unless suppress_context is true. So from None does not delete anything; __context__ is still there for tools, it is just hidden from the display.',
    },
    {
      id: 'raising-exceptions-root-cause',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 7,
      question: py`Write \`root_cause(exc)\` that follows an exception's chain back to the original exception, the way tracebacks do: follow \`__cause__\` if it is set; otherwise follow \`__context__\` **unless** \`__suppress_context__\` is true. Return the last exception in the chain (the exception itself if there is no chain).`,
      answer: 'Loop: next = exc.__cause__ if it is not None, else (None if exc.__suppress_context__ else exc.__context__); stop and return exc when next is None.',
      explanation: py`This mirrors the logic \`traceback\` uses to print chains. Note that a \`from None\` exception has a \`__context__\`, but it's suppressed — so the chain stops there. (Production code should also guard against cycles; CPython's own traceback code tracks seen exceptions.)`,
      starter: { files: { 'main.py': py`def root_cause(exc):
    """Follow __cause__ / unsuppressed __context__ back to the original exception."""
    # TODO
    return exc


try:
    try:
        int("x")
    except ValueError as err:
        raise RuntimeError("config broken") from err
except RuntimeError as outer:
    print(repr(root_cause(outer)))
` } },
      tests: [
        { name: 'an exception with no chain is its own root', code: py`e = ValueError("alone")
assert root_cause(e) is e` },
        { name: 'follows an explicit cause (from err)', code: py`try:
    try:
        int("x")
    except ValueError as err:
        raise RuntimeError("config broken") from err
except RuntimeError as outer:
    assert isinstance(root_cause(outer), ValueError)` },
        { name: 'follows an implicit context', code: py`try:
    try:
        {}["k"]
    except KeyError:
        raise ValueError("while handling")
except ValueError as outer:
    assert isinstance(root_cause(outer), KeyError)` },
        { name: 'stops at from None', code: py`try:
    try:
        {}["k"]
    except KeyError:
        raise ValueError("hidden") from None
except ValueError as outer:
    assert root_cause(outer) is outer` },
        { name: 'follows a three-level chain', code: py`def level3():
    int("x")

def level2():
    try:
        level3()
    except ValueError as err:
        raise KeyError("k") from err

def level1():
    try:
        level2()
    except KeyError:
        raise RuntimeError("top")

try:
    level1()
except RuntimeError as top:
    assert isinstance(root_cause(top), ValueError)` },
      ],
      solution: { files: { 'main.py': py`def root_cause(exc):
    """Follow __cause__ / unsuppressed __context__ back to the original exception."""
    while True:
        if exc.__cause__ is not None:
            nxt = exc.__cause__
        elif exc.__suppress_context__:
            nxt = None
        else:
            nxt = exc.__context__
        if nxt is None:
            return exc
        exc = nxt


try:
    try:
        int("x")
    except ValueError as err:
        raise RuntimeError("config broken") from err
except RuntimeError as outer:
    print(repr(root_cause(outer)))
` } },
      hints: ['Write a while True loop that computes the "next" exception in the chain.', 'Check __cause__ first; only look at __context__ when __suppress_context__ is False.', 'Return exc as soon as the next link is None.'],
      whyAsked: 'Tests precise knowledge of the chaining attributes — the kind of thing error-reporting and monitoring tools do.',
      mistakes: ['Ignoring __suppress_context__', 'Following only __cause__', 'Recursing without a base case'],
      followUps: ['How would you protect against a cycle in the chain?', 'How would you collect the whole chain as a list?', 'How do ExceptionGroups complicate this?'],
      modelAnswer: 'I loop over the chain. At each step, if __cause__ is set, that is the next link, because explicit chaining wins. Otherwise, if __suppress_context__ is true — which is the case after raise from None — the chain stops. Otherwise the next link is __context__. When the next link is None, the current exception is the root cause and I return it. That is the same order the traceback module uses when it prints chained exceptions; in production I would also keep a set of seen ids to guard against a cycle.',
    },
  ],

  takeaways: [
    'raise creates an exception object and unwinds the stack until a matching except is found; nothing after it in the block runs.',
    'Choose the type from the caller\'s view: ValueError for bad values, TypeError for wrong types, NotImplementedError for must-override methods.',
    'Good messages name the rule and the offending value (use !r) — never secrets.',
    'A bare raise inside a handler re-raises the same exception with its original traceback; use it after logging or clean-up.',
    'raise New(...) from err records the cause (__cause__, "direct cause"); from None hides an irrelevant context; without from, Python still records __context__ ("During handling…").',
    'assert is for internal invariants and tests only — python -O removes it, so never use it for validation or security.',
  ],
}
