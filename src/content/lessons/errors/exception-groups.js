// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ORDER_BATCH = py`# Validate a batch of orders and report EVERY problem at once (Python 3.11+)
CATALOGUE = {"PEN": 1.20, "INK": 4.50, "PAD": 2.00}
ORDERS = [
    {"id": 1, "sku": "PEN", "qty": "3"},
    {"id": 2, "sku": "LAMP", "qty": "1"},
    {"id": 3, "sku": "INK", "qty": "zero"},
    {"id": 4, "sku": "MUG", "qty": "-2"},
]


def validate(order):
    """Return (sku, qty), or raise an ExceptionGroup with every problem in this order."""
    problems = []
    if order["sku"] not in CATALOGUE:
        problems.append(KeyError(order["sku"]))
    try:
        qty = int(order["qty"])
    except ValueError as err:
        err.add_note(f"order {order['id']}, field 'qty'")
        problems.append(err)
    else:
        if qty < 1:
            problems.append(ValueError(f"qty must be at least 1, got {qty}"))
    if problems:
        raise ExceptionGroup(f"order {order['id']} is invalid", problems)
    return order["sku"], qty


def import_orders(orders):
    """Validate all orders; raise ONE group that contains every invalid order's group."""
    accepted, rejected = [], []
    for order in orders:
        try:
            accepted.append(validate(order))
        except ExceptionGroup as group:
            rejected.append(group)
    print("accepted:", accepted)
    if rejected:
        raise ExceptionGroup(f"{len(rejected)} of {len(orders)} orders rejected", rejected)


def leaves(group):
    """Yield the individual exceptions inside a (possibly nested) group."""
    for exc in group.exceptions:
        if isinstance(exc, BaseExceptionGroup):
            yield from leaves(exc)
        else:
            yield exc


try:
    import_orders(ORDERS)
except* KeyError as group:
    print("unknown SKUs:", sorted(err.args[0] for err in leaves(group)))
except* ValueError as group:
    for err in leaves(group):
        notes = getattr(err, "__notes__", [])  # only set if add_note() was called
        suffix = f"  ({'; '.join(notes)})" if notes else ""
        print(f"bad quantity: {err}{suffix}")
`

const TASKGROUP_VARIANT = py`# Where groups come from in real code: asyncio.TaskGroup (3.11+)
import asyncio


async def fetch_stock(shop, delay, problem=None):
    await asyncio.sleep(delay)
    if problem:
        raise problem
    print(f"  {shop}: stock synced")
    return shop


async def sync_all():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(fetch_stock("north", 0.05))
        tg.create_task(fetch_stock("south", 0.1, ConnectionError("south: connection reset")))
        tg.create_task(fetch_stock("east", 0.1, ValueError("east: bad SKU 'LAMP'")))
        tg.create_task(fetch_stock("west", 0.5))  # still running when the others fail: cancelled


async def main():
    try:
        await sync_all()
    except* ConnectionError as group:
        print("retry later:", [str(e) for e in group.exceptions])
    except* ValueError as group:
        print("fix the data:", [str(e) for e in group.exceptions])


asyncio.run(main())
`

export default {
  id: 'exception-groups',
  title: 'ExceptionGroup, except* & warnings',
  summary: 'Raise and handle several unrelated errors at once with ExceptionGroup and except* (3.11+), add context with notes, and warn instead of failing with the warnings module.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['try-except', 'raising-exceptions', 'custom-exceptions'],
  related: ['error-handling-patterns', 'asyncio-in-practice', 'asyncio-basics', 'concurrency-concepts', 'modern-features', 'testing-fundamentals', 'logging', 'packaging'],
  tags: ['ExceptionGroup', 'BaseExceptionGroup', 'except*', 'exception notes', 'add_note', '__notes__', 'PEP 654', 'PEP 678', 'PEP 758', 'asyncio.TaskGroup', 'split', 'subgroup', 'warnings', 'DeprecationWarning', 'warnings.warn', 'stacklevel', 'filterwarnings', '-W error', 'Python 3.11', 'Python 3.14'],
  apis: [
    { name: 'ExceptionGroup(message, exceptions)', summary: '(3.11+) One exception that carries a non-empty sequence of other exceptions (all Exception subclasses).' },
    { name: 'BaseExceptionGroup', summary: '(3.11+) Like ExceptionGroup but may contain BaseException members such as KeyboardInterrupt.' },
    { name: 'except* T as eg', summary: '(3.11+) Handles the members of a group that match T; eg is always a group of just those. Unmatched members continue to later clauses, then are re-raised.' },
    { name: 'eg.exceptions / eg.message', summary: 'The tuple of contained exceptions (may include nested groups) and the group\'s message.' },
    { name: 'eg.split(T) / eg.subgroup(T)', summary: 'Split a group into (matching, rest), or keep only the matching part — nesting is preserved; None for an empty part.' },
    { name: 'exc.add_note(text)', summary: '(3.11+) Attach extra context to any exception; notes are stored in exc.__notes__ and printed under the traceback.' },
    { name: 'warnings.warn(msg, category, stacklevel=2)', summary: 'Emit a warning (UserWarning by default) — shown once per location by default, never stopping the program unless filters turn it into an error.' },
    { name: 'warnings.simplefilter / filterwarnings', summary: 'Choose what happens to warnings: "default", "ignore", "always", "once", "module" or "error" (raise them as exceptions).' },
    { name: 'warnings.catch_warnings(record=True)', summary: 'Context manager that saves and restores the filters; with record=True it collects warnings in a list (handy in tests).' },
  ],
  docs: [
    { label: 'Python tutorial — raising and handling multiple unrelated exceptions', url: 'https://docs.python.org/3/tutorial/errors.html#raising-and-handling-multiple-unrelated-exceptions' },
    { label: 'Built-in exceptions — exception groups', url: 'https://docs.python.org/3/library/exceptions.html#exception-groups' },
    { label: 'PEP 654 — exception groups and except*', url: 'https://peps.python.org/pep-0654/' },
    { label: 'PEP 678 — enriching exceptions with notes', url: 'https://peps.python.org/pep-0678/' },
    { label: 'warnings — warning control', url: 'https://docs.python.org/3/library/warnings.html' },
    { label: 'PEP 758 — except and except* without brackets (3.14)', url: 'https://peps.python.org/pep-0758/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Everything so far assumed **one** thing goes wrong at a time: one exception climbs the stack and one handler catches it. But some programs genuinely hit **several unrelated failures at once**:`,
    py`- ten network requests run [concurrently](lesson:concurrency-concepts) and three fail — with *different* errors;
- a form or a CSV import has five broken fields, and the user wants to see all five, not just the first;
- clean-up code fails while closing several resources.`,
    py`Python 3.11 added a tool for exactly this: an **\`ExceptionGroup\`** is one exception that *contains* several others, and **\`except*\`** ("except star") handles the parts of a group that match a type, leaving the rest for other handlers. In the same release, **exception notes** (\`add_note()\`) let you attach extra context to any exception.`,
    py`The second half of the lesson covers the gentler cousin of exceptions: **warnings** — messages like "this function is deprecated" that tell a developer something is off *without* stopping the program.`,
    { callout: 'version', title: 'Python 3.11+', text: py`\`ExceptionGroup\`, \`BaseExceptionGroup\`, \`except*\`, \`add_note()\` and \`asyncio.TaskGroup\` all arrived in Python 3.11 (PEP 654, PEP 678). Code using \`except*\` is a \`SyntaxError\` on 3.10 and older (see [modern Python, version by version](lesson:modern-features)). Libraries that support older versions use the third-party \`exceptiongroup\` backport.` },
  ],
  why: [
    py`Before 3.11, concurrent code had an awkward choice when several tasks failed: raise only the **first** error (the others are silently lost) or invent a custom "MultiError" class that nobody else's \`except\` clauses understood. Neither is acceptable when the lost error was the real cause of an outage.`,
    py`\`ExceptionGroup\` makes "several errors" a first-class, standard object, and \`except*\` lets each handler deal with *its* kind of error — retry the network failures, report the validation errors — while anything nobody handles is still re-raised, never swallowed.`,
    py`Warnings solve a different problem: how does a library tell its users "this will break in the next version" *before* it breaks? Raising would break them now; printing would spam end users. A \`DeprecationWarning\` reaches developers (in tests and during development) and can be turned into an error in CI.`,
  ],
  eli15: [
    py`Imagine your bike gets its yearly safety check. A lazy mechanic stops at the first problem: "Brakes are bad. Next!" You fix the brakes, come back, and hear "Light is broken. Next!" Annoying.`,
    py`A good mechanic hands you **one report with every problem on it** — brakes, light, a loose chain. That report is an \`ExceptionGroup\`. Then different people fix different parts: the brake specialist takes the brake items, your parent fixes the light. Each one takes **only their items** from the report — that's \`except*\`. If an item is left that nobody takes, the report goes back to the shop — the leftover is raised again.`,
    py`Sometimes the mechanic scribbles "noticed on the front wheel" next to an item. That's an **exception note**. And sometimes the report says "Tyres are fine *for now*, but replace them before winter" — not a failure, just a heads-up. That's a **warning**.`,
  ],
  analogy: {
    title: 'A vehicle inspection report',
    body: [
      py`An inspector checks a car and writes **one report** listing every fault, grouped by area: *Brakes* (two faults), *Lights* (one fault). Reports can even contain sub-reports — the trailer gets its own section.`,
      py`At the garage, the brake mechanic takes **only the brake faults**; the electrician takes the lights. Each sees their items as a mini-report. Anything nobody claims goes back to the front desk. Separately, the report has **advisories** — "tyres close to the legal limit" — which don't fail the inspection but should be dealt with before the next one.`,
    ],
    mapping: [
      ['the whole inspection report', 'an ExceptionGroup: ExceptionGroup("car failed", [...])'],
      ['a section for the trailer', 'a nested group inside the group'],
      ['one fault on the list', 'one exception inside group.exceptions'],
      ['the brake mechanic taking only brake faults', 'except* BrakeError as eg — eg holds just the matching faults'],
      ['unclaimed faults going back to the desk', 'unmatched exceptions are re-raised after the except* clauses'],
      ['a handwritten remark next to a fault', 'exc.add_note("front-left wheel")'],
      ['an advisory: "replace tyres soon"', 'warnings.warn("…", DeprecationWarning)'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'How except* splits a group',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'group', label: 'ExceptionGroup', note: '[ValueError, KeyError, TypeError, ValueError]', x: 380, y: 45, tone: 'red' },
        { id: 'c1', label: 'except* ValueError', note: 'gets [ValueError, ValueError]', x: 140, y: 170, tone: 'yellow' },
        { id: 'c2', label: 'except* KeyError', note: 'gets [KeyError]', x: 380, y: 170, tone: 'yellow' },
        { id: 'rest', label: 're-raised', note: 'ExceptionGroup([TypeError])', x: 620, y: 170, tone: 'red' },
        { id: 'caller', label: 'caller', note: 'except / except* higher up', x: 620, y: 285, tone: 'paper' },
      ],
      edges: [
        { from: 'group', to: 'c1', label: 'split' },
        { from: 'group', to: 'c2', label: 'split remainder' },
        { from: 'group', to: 'rest', label: 'nobody matched', dashed: true },
        { from: 'rest', to: 'caller' },
      ],
      steps: [
        { focus: ['group'], text: py`A group is raised containing four unrelated exceptions. A plain \`except ValueError\` would **not** match it — the group itself is an \`ExceptionGroup\`, not a \`ValueError\`.` },
        { focus: ['group', 'c1'], edges: ['group->c1'], text: py`The first \`except*\` clause takes **every** matching member (using \`split()\`) and runs **once**, with \`eg\` bound to a new group holding just those two \`ValueError\`s.` },
        { focus: ['c2'], edges: ['group->c2'], text: py`The **remainder** is offered to the next \`except*\` clause, which takes the \`KeyError\`. Unlike plain \`except\`, *several* \`except*\` clauses can run for one \`try\`.` },
        { focus: ['rest', 'caller'], edges: ['group->rest', 'rest->caller'], text: py`Whatever no clause matched — here the \`TypeError\` — is **re-raised automatically** as a group, keeping the original message and nesting. Nothing is silently dropped.` },
      ],
    },
    alt: 'Diagram: an ExceptionGroup containing ValueError, KeyError, TypeError and ValueError at the top. An arrow labelled split goes to an except* ValueError box that receives both ValueErrors. A second arrow goes to except* KeyError, which receives the KeyError. A dashed arrow labelled nobody matched leads to a re-raised group containing only the TypeError, which continues to the caller.',
    caption: py`Each \`except*\` clause runs **at most once** and always receives a **group** (even with one member). Clauses are tried in order on what's left; leftovers are re-raised.`,
  },
  syntax: [
    py`#### Creating and raising a group`,
    { code: py`errors = [ValueError("qty must be at least 1, got 0"), KeyError("LAMP")]
group = ExceptionGroup("order 7 is invalid", errors)

print(group)              # order 7 is invalid (2 sub-exceptions)
print(group.message)      # order 7 is invalid
print(group.exceptions)   # (ValueError('qty must be at least 1, got 0'), KeyError('LAMP'))`, lang: 'python', title: 'ExceptionGroup basics (3.11+)' },
    py`- The first argument is a **message**, the second a **non-empty** sequence of exceptions (an empty list raises \`ValueError\`).
- Members can themselves be groups, so groups **nest** (one group per order inside one group for the whole batch).
- \`ExceptionGroup\` only accepts \`Exception\` subclasses. To include \`KeyboardInterrupt\`, \`SystemExit\` and friends, use \`BaseExceptionGroup\` (which, if all members happen to be \`Exception\`s, gives you an \`ExceptionGroup\` anyway).`,
    py`#### Handling a group with \`except*\``,
    { code: py`try:
    raise ExceptionGroup("batch", [ValueError("a"), TypeError("b"), ValueError("c")])
except* ValueError as eg:
    print("V", len(eg.exceptions))       # V 2  — eg is a group of the ValueErrors
except* TypeError as eg:
    print("T", len(eg.exceptions))       # T 1  — the next clause gets the remainder`, lang: 'python', title: 'except* — several clauses can run' },
    py`The rules that differ from plain \`except\`:`,
    py`1. **Every** matching clause runs (once), not just the first.
2. The \`as\` name is **always a group** — even if one exception matched, and even if the raised exception was a plain ("naked") one, which gets wrapped: \`ExceptionGroup('', (ValueError(...),))\`.
3. Leftover exceptions are **re-raised** after the last clause. (A naked exception that nothing matched is re-raised as itself, not wrapped.)
4. You can't mix \`except\` and \`except*\` on one \`try\`; \`except*\` needs a type (no bare \`except*:\`); and \`return\`, \`break\` and \`continue\` aren't allowed inside an \`except*\` block (\`SyntaxError\`). \`except* ExceptionGroup\` is rejected at runtime — catch whole groups with plain \`except ExceptionGroup\`.`,
    { callout: 'warn', title: 'Plain except does not look inside groups', text: py`\`except ValueError:\` does **not** catch \`ExceptionGroup("batch", [ValueError("a")])\` — the raised object is an \`ExceptionGroup\`, and \`isinstance(group, ValueError)\` is \`False\`. Code that calls \`asyncio.TaskGroup\` (or any API documented to raise groups) must use \`except*\`, or \`except ExceptionGroup\` and inspect the members.` },
    { callout: 'version', title: 'Python 3.14: brackets optional (PEP 758)', text: py`From 3.14, \`except* ConnectionError, TimeoutError:\` (and plain \`except A, B:\`) may omit the brackets **when there is no \`as\`**. With \`as\`, brackets are still required: \`except* (ConnectionError, TimeoutError) as eg:\`. Keep the brackets if your code must run on 3.13 or older.` },
    py`#### Working with groups directly`,
    { code: py`eg = ExceptionGroup("outer", [ValueError("a"), ExceptionGroup("inner", [TypeError("b"), ValueError("c")])])

match, rest = eg.split(ValueError)
print(repr(match))   # ExceptionGroup('outer', [ValueError('a'), ExceptionGroup('inner', [ValueError('c')])])
print(repr(rest))    # ExceptionGroup('outer', [ExceptionGroup('inner', [TypeError('b')])])
print(eg.subgroup(KeyError))   # None — nothing matched`, lang: 'python', title: 'split() and subgroup() keep the nesting' },
    py`\`split\` and \`subgroup\` also accept a **predicate** function ([lambdas](lesson:lambdas-and-higher-order)) (\`eg.subgroup(lambda e: "timeout" in str(e))\`). They build **new** group objects with the same message, traceback, cause, context and notes — that's exactly how \`except*\` decides what each clause receives.`,
    py`#### Exception notes (3.11+)`,
    { code: py`err = ValueError("qty must be positive")
err.add_note("row 7 of orders.csv")
err.add_note("column 'qty'")
print(err.__notes__)    # ['row 7 of orders.csv', "column 'qty'"]
print(str(err))         # qty must be positive  — notes are not part of str()`, lang: 'python', title: 'add_note() adds context without changing the exception' },
    py`Notes are printed under the exception's line in a traceback. They're the lightest way to add context while **keeping the type**: catch, \`err.add_note("while importing row 7")\`, then bare \`raise\`. Compare with [chaining](lesson:raising-exceptions), which wraps the error in a *new* exception.`,
    py`#### How a group looks in a traceback`,
    py`If the playground's \`except* ValueError\` clause were missing, the leftover part of the group would crash the program like this:`,
    { code: py`  + Exception Group Traceback (most recent call last):
  |   File "main.py", line 52, in <module>
  |     import_orders(ORDERS)
  |     ~~~~~~~~~~~~~^^^^^^^^
  |   File "main.py", line 39, in import_orders
  |     raise ExceptionGroup(f"{len(rejected)} of {len(orders)} orders rejected", rejected)
  | ExceptionGroup: 3 of 4 orders rejected (2 sub-exceptions)
  +-+---------------- 1 ----------------
    | Exception Group Traceback (most recent call last):
    |   ...
    | ExceptionGroup: order 3 is invalid (1 sub-exception)
    +-+---------------- 1 ----------------
      | Traceback (most recent call last):
      |   File "main.py", line 17, in validate
      |     qty = int(order["qty"])
      | ValueError: invalid literal for int() with base 10: 'zero'
      | order 3, field 'qty'
      +------------------------------------
    +---------------- 2 ----------------
    | ...
    | ExceptionGroup: order 4 is invalid (1 sub-exception)
    +-+---------------- 1 ----------------
      | ValueError: qty must be at least 1, got -2
      +------------------------------------`, lang: 'text', title: 'the playground without its ValueError handler (abridged)' },
    py`Each nested group gets its own numbered box, each member its own traceback, and the note (\`order 3, field 'qty'\`) is printed under its exception. Notice the top message still says "3 of 4" but lists 2 sub-exceptions: the \`KeyError\`s were handled, so order 2's group disappeared entirely and order 4's group lost its \`KeyError\`.`,
    py`#### Warnings: "this isn't an error… yet"`,
    { code: py`import warnings


def old_total(prices):
    warnings.warn(
        "old_total() is deprecated; use total() instead",
        DeprecationWarning,
        stacklevel=2,          # blame the caller's line, not this one
    )
    return sum(prices)`, lang: 'python', static: true, title: 'warnings.warn' },
    py`A warning prints a message to stderr (by default **once per source location**) and the program **carries on**. The category is a class, and the common ones are:`,
    py`| category | meaning | shown by default? |
|---|---|---|
| \`UserWarning\` | the default for \`warnings.warn(msg)\` | yes |
| \`DeprecationWarning\` | for **developers**: this API will change or go away | only when triggered by code in \`__main__\` (and by test runners such as pytest) |
| \`PendingDeprecationWarning\` | deprecation planned for later | no |
| \`FutureWarning\` | for **end users** of an application: behaviour will change | yes |
| \`RuntimeWarning\` | dubious runtime behaviour (e.g. a coroutine never awaited) | yes |
| \`ResourceWarning\` | a resource (file, socket) was not closed | no (shown with \`-X dev\` / \`-W default\`) |`,
    py`All warning categories are subclasses of \`Warning\`, which is a subclass of \`Exception\` — that's what lets a filter turn them into real exceptions:`,
    { code: py`import warnings

warnings.simplefilter("error")                              # every warning raises
warnings.filterwarnings("ignore", category=FutureWarning)   # silence one category
warnings.filterwarnings("error", message=".*old_total.*")   # escalate one message

with warnings.catch_warnings():          # temporary: filters are restored on exit
    warnings.simplefilter("ignore", DeprecationWarning)
    legacy_call()`, lang: 'python', static: true, title: 'filters' },
    { code: py`python -W error app.py                 # turn all warnings into exceptions
python -W error::DeprecationWarning app.py
PYTHONWARNINGS=default python app.py   # show every category once per location
python -X dev app.py                   # development mode: shows DeprecationWarning, ResourceWarning, ...`, lang: 'bash', title: 'from the command line' },
    { callout: 'version', title: '3.13+: @warnings.deprecated', text: py`Python 3.13 added \`@warnings.deprecated("use total() instead")\` (PEP 702). It emits a \`DeprecationWarning\` when the decorated function or class is used **and** tells static type checkers, so editors can strike the name through.` },
  ],
  walkthrough: {
    title: 'Reading the order-batch validator',
    lang: 'python',
    code: ORDER_BATCH,
    intro: py`This is the playground program. Press **Guide** there to follow these steps in the editor.`,
    steps: [
      { lines: [11, 15], text: py`\`validate()\` doesn't raise at the first problem. It collects every problem for one order in a list — here an unknown SKU becomes a \`KeyError\` object, created but **not raised**.` },
      { lines: [16, 20], text: py`The quantity is converted inside a small \`try\`. If \`int()\` fails, we keep its \`ValueError\` (with its real message), attach a **note** saying where it came from, and add it to the list.` },
      { lines: [21, 23], text: py`A business rule, checked only when the conversion worked (\`else\`). One order can collect several problems: order 4 has an unknown SKU **and** a negative quantity.` },
      { lines: [24, 26], text: py`If anything went wrong, raise **one** \`ExceptionGroup\` with all of them. The message names the order.` },
      { lines: [29, 39], text: py`\`import_orders\` catches each order's group with a plain \`except ExceptionGroup\` (it wants whole groups), keeps going, and finally raises a group **of groups** — the nesting mirrors batch → order → problem.` },
      { lines: [42, 48], text: py`\`group.exceptions\` holds the direct members, which may be groups themselves. \`leaves()\` walks the tree [recursively](lesson:recursion), using \`yield from\` ([generators](lesson:generators)) to hand back the individual exceptions.` },
      { lines: [51, 59], text: py`Two \`except*\` clauses run for the **same** raise: the first receives every \`KeyError\` (across all orders, nesting kept), the second every \`ValueError\`. If a third kind of error appeared, it would be re-raised after them.` },
    ],
  },
  playground: {
    title: 'Order batch validator',
    objective: 'Run it, then add rules and handlers and watch how except* splits one group between several clauses.',
    files: { 'main.py': ORDER_BATCH },
    expected: py`\`\`\`text
accepted: [('PEN', 3)]
unknown SKUs: ['LAMP', 'MUG']
bad quantity: invalid literal for int() with base 10: 'zero'  (order 3, field 'qty')
bad quantity: qty must be at least 1, got -2
\`\`\`

Order 4 appears in **both** handlers: it had two unrelated problems. Switch to the **asyncio.TaskGroup** variant to see groups produced by concurrent tasks (it uses \`asyncio.run()\`, which needs a browser with WebAssembly stack switching, such as current Chrome or Edge).`,
    variants: [
      { id: 'taskgroup', label: 'asyncio.TaskGroup version', files: { 'main.py': TASKGROUP_VARIANT } },
    ],
    experiments: [
      {
        id: 'upper-limit',
        task: py`Add a rule in \`validate()\`: a quantity **above 100** is a \`ValueError\` with the message \`qty must be at most 100, got 500\` (using the real number). Then add the order \`{"id": 5, "sku": "CUP", "qty": "500"}\` to \`ORDERS\`. Predict which handlers mention order 5.`,
        hint: py`Next to the \`if qty < 1:\` check (inside \`else:\`), add \`elif qty > 100: problems.append(ValueError(f"qty must be at most 100, got {qty}"))\`.`,
        tests: [
          { name: 'the new rule is reported', code: py`assert "bad quantity: qty must be at most 100, got 500" in output` },
          { name: "order 5's unknown SKU is reported too", code: py`assert "unknown SKUs: ['CUP', 'LAMP', 'MUG']" in output` },
        ],
        explain: py`One order, two unrelated problems, two handlers: the \`KeyError\` went to the first \`except*\` clause and the \`ValueError\` to the second. With plain exceptions you'd only ever see the first problem per order.`,
      },
      {
        id: 'note-the-sku',
        task: py`Give the unknown-SKU \`KeyError\` a note too, like the quantity errors: \`order 2, field 'sku'\` (using the real id). Build the exception first, call \`add_note\`, then append it.`,
        hint: py`\`err = KeyError(order["sku"])\` / \`err.add_note(f"order {order['id']}, field 'sku'")\` / \`problems.append(err)\`.`,
        tests: [
          { name: 'the KeyError carries a note', code: py`try:
    validate({"id": 2, "sku": "LAMP", "qty": "1"})
except ExceptionGroup as group:
    assert getattr(group.exceptions[0], "__notes__", None) == ["order 2, field 'sku'"]
else:
    raise AssertionError("validate() should raise for an unknown SKU")` },
        ],
        explain: py`\`add_note\` works on any exception, raised or not. Notes travel with the exception through groups, \`split()\` and re-raising, and appear in tracebacks — ideal for "where did this come from?" context that isn't part of the error itself.`,
      },
      {
        id: 'summary',
        task: py`Write \`summary(group)\` that returns a dict counting the **leaf** exceptions of a (possibly nested) group by type name, e.g. \`{"KeyError": 2, "ValueError": 2}\`. Reuse \`leaves()\`.`,
        hint: py`\`collections.Counter(type(err).__name__ for err in leaves(group))\` — then turn it into a plain \`dict\`.`,
        tests: [
          { name: 'counts leaves across nested groups', code: py`assert callable(ns.get("summary")), "Define a function named summary"
g = ExceptionGroup("all", [
    ExceptionGroup("o1", [KeyError("a"), ValueError("b")]),
    ExceptionGroup("o2", [ValueError("c")]),
])
assert summary(g) == {"KeyError": 1, "ValueError": 2}` },
        ],
        explain: py`Because groups nest, "how many errors?" means walking the tree. \`len(group.exceptions)\` would count the two *orders*, not the three *problems*. Monitoring code often reports counts like this instead of dumping huge groups into logs.`,
      },
      {
        id: 'unclaimed',
        task: py`Delete the \`except* ValueError\` clause (and its body) and run. What is printed, and what does the traceback contain — and **not** contain?`,
        hint: py`Look for the box-drawing traceback and count the sub-exceptions.`,
        explain: py`The \`KeyError\`s were handled by the remaining clause, so they're **gone** from the re-raised group; the \`ValueError\`s weren't, so Python re-raises a group containing only them — still nested by order, still with the note, printed as a tree. Unhandled members are never silently dropped.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Step through except* clauses',
    props: {
      code: py`def check(order):
    problems = []
    if order["qty"] < 1:
        problems.append(ValueError(f"qty must be >= 1, got {order['qty']}"))
    if order["sku"] not in {"PEN", "INK"}:
        problems.append(KeyError(order["sku"]))
    if not isinstance(order["price"], (int, float)):
        problems.append(TypeError("price must be a number"))
    if problems:
        raise ExceptionGroup("invalid order", problems)


try:
    try:
        check({"qty": 0, "sku": "LAMP", "price": "free"})
    except* ValueError as eg:
        print("value problems:", [str(e) for e in eg.exceptions])
    except* KeyError as eg:
        print("unknown SKUs:", [e.args[0] for e in eg.exceptions])
    print("not reached: a TypeError is still unhandled")
except ExceptionGroup as rest:
    print("left over:", [type(e).__name__ for e in rest.exceptions])
`,
      notes: {
        2: 'Problems are collected in a list instead of being raised one by one.',
        10: 'Three unrelated exceptions are raised together, as one ExceptionGroup.',
        16: 'The first except* clause receives a group holding only the ValueError.',
        18: 'The second clause runs too — for the same raise — with the KeyError.',
        20: 'Skipped: the TypeError matched no clause, so a group with just the TypeError is re-raised…',
        22: '…and the outer plain `except ExceptionGroup` catches the leftover group.',
      },
    },
    alt: 'Step-by-step trace: check() builds a list with a ValueError, a KeyError and a TypeError and raises them in one ExceptionGroup. The first except* clause prints the ValueError message, the second prints the KeyError key, then the remaining TypeError is re-raised in a group and caught by the outer except ExceptionGroup, which prints left over: TypeError.',
    caption: py`Watch the printed lines appear one handler at a time: two \`except*\` clauses run for one raise, and the line after them is skipped because something was left over.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`An \`ExceptionGroup\` is just an exception object with a list inside. \`raise\` sends the **whole group** up the stack like any other exception. The magic is in \`except*\`, which looks **inside** the group: each clause takes the members of its type, and Python keeps track of what's left.`,
      py`So think of it as two steps: (1) collect several errors into one object, (2) let several handlers each take their share. If nobody takes some of them, they're raised again — exceptions are never quietly lost.`,
    ],
    technical: [
      py`**What \`except*\` does, step by step** (PEP 654): when the \`try\` body raises \`E\`, Python sets \`unhandled = E\` (wrapping a naked exception in an \`ExceptionGroup("", [E])\` for matching). For each \`except* T\` clause in order it calls \`match, unhandled = unhandled.split(T)\`; if \`match\` is not \`None\`, the clause body runs with \`as\` bound to \`match\`. Afterwards, anything still in \`unhandled\` — plus any **new** exceptions raised inside the clause bodies — is combined and raised. If the original was naked and nothing matched, the original object is re-raised unchanged.`,
      py`**\`split()\` copies structure, not exceptions.** The leaf exception objects are shared; the groups around them are new objects created with \`derive()\`. If you subclass \`ExceptionGroup\`, override \`derive()\` so splits keep your subclass (and any extra fields) — otherwise split parts come back as plain \`ExceptionGroup\`s.`,
      py`**Raising inside an \`except*\` block.** A bare \`raise\` re-raises the matched sub-group (it's merged back with the unhandled part). Raising a *new* exception adds it to the final group, with \`__context__\` set to the matched group. That's why \`return\`/\`break\`/\`continue\` are forbidden there: they would silently discard the unhandled remainder.`,
      py`**\`BaseExceptionGroup\` vs \`ExceptionGroup\`.** \`BaseExceptionGroup.__new__\` returns an \`ExceptionGroup\` when every member is an \`Exception\`; \`ExceptionGroup\` refuses non-\`Exception\` members (\`TypeError: Cannot nest BaseExceptions in an ExceptionGroup\`). Because \`ExceptionGroup\` is itself an \`Exception\`, a plain \`except Exception\` *does* catch groups.`,
      py`**Notes** live in \`exc.__notes__\`, a list created by the first \`add_note()\` call (so check with \`getattr(err, "__notes__", [])\`). The traceback module prints each note on its own line after the exception message. Testing tools use them too: Hypothesis, for example, attaches the failing example to the error as a note.`,
      py`**Warnings machinery.** \`warnings.warn\` checks the filter list (\`warnings.filters\`, first match wins) for the category, message, module and line. The action decides: \`"error"\` raises the warning as an exception; \`"ignore"\` drops it; \`"default"\` shows it once per (module, line) — remembered in that module's \`__warningregistry__\`; \`"once"\` once per message; \`"always"\` every time. \`stacklevel=2\` attributes the warning to the **caller's** line, which matters both for the message and for the "\`__main__\` only" default rule for \`DeprecationWarning\` (PEP 565).`,
      { callout: 'note', title: 'Default filters (CPython detail)', text: py`In a normal CPython build the default filter list shows \`DeprecationWarning\` only when the warning is attributed to \`__main__\`, and ignores \`DeprecationWarning\`, \`PendingDeprecationWarning\`, \`ImportWarning\` and \`ResourceWarning\` elsewhere. Debug builds, \`-X dev\` and test runners change these defaults. Print \`warnings.filters\` to see what's active.` },
    ],
    production: [
      py`**Where groups appear.** \`asyncio.TaskGroup\` (3.11+) raises an \`ExceptionGroup\` of every child task that failed, after cancelling the rest — see [asyncio in practice](lesson:asyncio-in-practice). (\`asyncio.gather\`, by contrast, propagates only the first exception unless \`return_exceptions=True\`.) Some libraries also raise groups for multi-step clean-up or validation; check their docs. Code that calls such APIs must use \`except*\`.`,
      py`**Don't use groups by default** (see [error-handling patterns](lesson:error-handling-patterns)). For a single failure, raise a single exception — callers' ordinary \`except\` clauses keep working. Reach for a group only when several **independent** errors genuinely happen together and the caller benefits from seeing all of them. A group is also a public-API decision: switching a function from raising \`ValueError\` to raising a group breaks every caller's \`except ValueError\`.`,
      py`**Logging groups.** \`logger.exception()\` prints the full tree. For metrics, count leaf exceptions by type (as in the \`summary\` experiment) rather than logging giant groups at high volume.`,
      py`**Deprecating an API properly**: emit \`DeprecationWarning\` with \`stacklevel=2\` (or use \`@warnings.deprecated\` on 3.13+), say what to use instead and when it will be removed, document it, and keep it working for at least one release. Run your test suite with \`-W error::DeprecationWarning\` ([pytest](lesson:pytest-basics): \`filterwarnings = error\`) so *you* notice deprecations from your dependencies before they become removals.`,
      py`**Warnings vs logging vs exceptions.** Warnings are for **developers using your code** (fix your call); [logging](lesson:logging) is for **operators running the program** (something happened); exceptions are for **failures** (this call cannot succeed). Don't use \`warnings.warn\` to report runtime events in a service — nobody sees stderr there; and never silence all warnings globally with \`filterwarnings("ignore")\` — that's how deprecations turn into surprise breakages on upgrade.`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting plain except to catch members of a group',
      wrong: { code: py`try:
    raise ExceptionGroup("sync failed", [ConnectionError("north: reset")])
except ConnectionError:
    print("will retry")          # never runs: the raised object is an ExceptionGroup`, lang: 'python', static: true },
      right: { code: py`try:
    raise ExceptionGroup("sync failed", [ConnectionError("north: reset")])
except* ConnectionError:
    print("will retry")`, lang: 'python' },
      explanation: py`\`isinstance(group, ConnectionError)\` is \`False\`, so a plain handler doesn't match. Use \`except*\` to match members — especially around \`asyncio.TaskGroup\`, which always raises groups.`,
    },
    {
      title: 'Forgetting that groups nest',
      wrong: { code: py`for err in group.exceptions:
    print(type(err).__name__, err)    # prints "ExceptionGroup order 3 is invalid ..."`, lang: 'python', static: true },
      right: { code: py`def leaves(group):
    for exc in group.exceptions:
        if isinstance(exc, BaseExceptionGroup):
            yield from leaves(exc)
        else:
            yield exc

for err in leaves(group):
    print(type(err).__name__, err)`, lang: 'python', static: true },
      explanation: py`\`group.exceptions\` holds the **direct** members only. Walk the tree recursively (or use \`split\`/\`subgroup\`, which handle nesting for you).`,
    },
    {
      title: 'Mixing except and except*, or returning from except*',
      wrong: { code: py`def safe_import(rows):
    try:
        import_rows(rows)
    except* ValueError:
        return "some rows were bad"       # SyntaxError
    except KeyError:                      # SyntaxError: can't mix except and except*
        return "unknown key"`, lang: 'python', static: true },
      right: { code: py`def safe_import(rows):
    status = "ok"
    try:
        import_rows(rows)
    except* ValueError:
        status = "some rows were bad"
    except* KeyError:
        status = "unknown key"
    return status`, lang: 'python', static: true },
      explanation: py`\`return\`, \`break\` and \`continue\` would silently drop unhandled members of the group, so the compiler forbids them in \`except*\` blocks. Record the outcome in a variable and return after the \`try\`.`,
    },
    {
      title: 'warnings.warn without stacklevel',
      wrong: { code: py`def old_total(prices):
    warnings.warn("old_total() is deprecated", DeprecationWarning)
    return sum(prices)`, lang: 'python', static: true },
      right: { code: py`def old_total(prices):
    warnings.warn("old_total() is deprecated; use total()", DeprecationWarning, stacklevel=2)
    return sum(prices)`, lang: 'python', static: true },
      explanation: py`Without \`stacklevel=2\`, the warning points at the library's own line — useless to the caller who must change their code — and, because it's attributed to the library module rather than \`__main__\`, the default filters hide the \`DeprecationWarning\` entirely.`,
    },
    {
      title: 'Silencing every warning',
      wrong: { code: py`import warnings
warnings.filterwarnings("ignore")         # "the output was noisy"`, lang: 'python', static: true },
      right: { code: py`import warnings
warnings.filterwarnings(
    "ignore",
    message=".*legacy_api.*",
    category=DeprecationWarning,
)   # one known warning, with a ticket to remove this line`, lang: 'python', static: true },
      explanation: py`Global ignores hide every future deprecation, so the first sign of trouble becomes the upgrade that breaks production. Silence narrowly (by category and message), temporarily, and preferably fix the call instead.`,
    },
    {
      title: 'Wrapping single errors in groups',
      wrong: { code: py`def parse_age(text):
    try:
        return int(text)
    except ValueError as err:
        raise ExceptionGroup("bad age", [err])   # forces every caller to use except*`, lang: 'python', static: true },
      right: { code: py`def parse_age(text):
    try:
        return int(text)
    except ValueError as err:
        err.add_note(f"while parsing age {text!r}")
        raise`, lang: 'python', static: true },
      explanation: py`Groups are for **several** independent errors. For one error, raise one exception (add context with a note or [chaining](lesson:raising-exceptions)) so ordinary \`except ValueError\` handlers keep working.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Cannot nest BaseExceptions in an ExceptionGroup`,
      cause: py`An \`ExceptionGroup\` was given a member that isn't an \`Exception\` — e.g. \`KeyboardInterrupt\`, \`SystemExit\` or \`asyncio.CancelledError\`.`,
      fix: py`Use \`BaseExceptionGroup(...)\`, or don't collect those signals at all — usually they should propagate immediately.`,
    },
    {
      symptom: py`ValueError: second argument (exceptions) must be a non-empty sequence`,
      cause: py`\`raise ExceptionGroup("msg", problems)\` ran with an empty \`problems\` list.`,
      fix: py`Only raise when there is something to report: \`if problems: raise ExceptionGroup(...)\`.`,
    },
    {
      symptom: py`TypeError: catching ExceptionGroup with except* is not allowed. Use except instead.`,
      cause: py`\`except* ExceptionGroup\` (or \`BaseExceptionGroup\`) — \`except*\` matches *members*, and members are never meant to be matched as groups this way.`,
      fix: py`Catch whole groups with a plain \`except ExceptionGroup as eg:\`.`,
    },
    {
      symptom: py`SyntaxError: cannot have both 'except' and 'except*' on the same 'try'`,
      cause: py`One \`try\` statement uses both clause kinds.`,
      fix: py`Use only \`except*\` clauses (\`except* Exception\` can serve as the catch-all), or nest two \`try\` statements.`,
    },
    {
      symptom: py`My except ValueError: never runs around asyncio.TaskGroup — the program crashes with an "Exception Group Traceback".`,
      cause: py`\`TaskGroup\` always raises an \`ExceptionGroup\`, even when only one task failed.`,
      fix: py`Handle it with \`except* ValueError:\`.`,
    },
    {
      symptom: py`I added warnings.warn(..., DeprecationWarning) but nothing is printed.`,
      cause: py`By default \`DeprecationWarning\` is only shown when attributed to \`__main__\`. Without \`stacklevel=2\` it's attributed to your library module and ignored; a warning from the same line is also shown only once.`,
      fix: py`Pass \`stacklevel=2\`, and check with \`python -W default\` or \`-X dev\` (or in pytest, which shows them). Use \`warnings.catch_warnings(record=True)\` with \`simplefilter("always")\` in tests.`,
    },
  ],
  bestPractices: [
    'Raise an ExceptionGroup only when several independent errors genuinely happen together; raise a single exception otherwise.',
    'Handle groups with except*; remember that plain except does not match members of a group.',
    'Keep except* blocks free of return/break/continue — record the outcome and return after the try.',
    'Walk nested groups with a recursive helper, or use split()/subgroup(), instead of assuming one level.',
    'Use add_note() to attach context ("row 7", "while syncing north") without changing the exception type.',
    'Deprecate with DeprecationWarning and stacklevel=2 (or @warnings.deprecated on 3.13+); say what to use instead.',
    'Change warning filters temporarily with warnings.catch_warnings(); run tests with -W error::DeprecationWarning.',
    'Never silence all warnings globally; filter by category and message, and fix the cause.',
  ],
  whenToUse: {
    use: [
      'Concurrent work where several tasks can fail independently (asyncio.TaskGroup does this for you).',
      'Validation or batch imports where users should see every problem in one go.',
      'Clean-up of several resources where more than one close() can fail.',
      'Warnings: deprecations, questionable-but-legal usage, and heads-ups for developers using your library.',
    ],
    avoid: [
      'Wrapping a single error in a group — it forces every caller to use except*.',
      'Groups in public APIs that used to raise plain exceptions, without a deprecation period.',
      'warnings.warn for runtime events in services (use logging) or for real failures (raise).',
    ],
  },
  comparison: {
    title: 'except vs except*',
    headers: ['', 'except T', 'except* T'],
    rows: [
      ['matches', 'the raised exception, if isinstance(exc, T)', 'members of a group (searched recursively) that are instances of T'],
      ['how many clauses run', 'at most one — the first match', 'every clause with a match, each at most once'],
      ['the as-name is bound to', 'the exception itself', 'always an ExceptionGroup of the matching members'],
      ['after the handlers', 'unmatched exceptions propagate unchanged', 'unmatched members are re-raised as a group (naked exceptions as themselves)'],
      ['return / break / continue inside', 'allowed', 'SyntaxError'],
      ['available since', 'always', 'Python 3.11'],
    ],
    note: py`You can't use both kinds on one \`try\`. To catch an entire group as one object, use plain \`except ExceptionGroup\`.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'exception-groups-q1',
      type: 'mcq',
      prompt: py`In \`except* ValueError as eg:\`, what is \`eg\` bound to?`,
      options: [
        { text: 'The first ValueError in the group', why: 'except* never hands you a single member. You get all matching members, wrapped in a group.' },
        'An ExceptionGroup containing every matching ValueError (keeping the nesting)',
        { text: 'The original ExceptionGroup, unchanged', why: 'The original may contain other types too. except* gives each clause a new group built by split() with only the matching part.' },
        { text: 'A list of ValueError objects', why: 'It is an exception group object; the members are in eg.exceptions (a tuple).' },
      ],
      answer: 1,
      explanation: py`\`eg\` is always a group — even if only one exception matched, and even if a plain (naked) \`ValueError\` was raised, in which case it's wrapped as \`ExceptionGroup('', (ValueError(...),))\`.`,
    },
    {
      id: 'exception-groups-q2',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`try:
    raise ExceptionGroup("batch", [ValueError("a"), TypeError("b"), ValueError("c")])
except* ValueError as eg:
    print("V", len(eg.exceptions))
except* TypeError as eg:
    print("T", len(eg.exceptions))`,
      answer: py`V 2
T 1`,
      explanation: py`Unlike plain \`except\`, both clauses run: the first receives a group of the two \`ValueError\`s, the second the remaining \`TypeError\`. Nothing is left over, so nothing is re-raised.`,
    },
    {
      id: 'exception-groups-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`err = ValueError("qty must be positive")
err.add_note("row 7 of orders.csv")
err.add_note("column 'qty'")
print(err.__notes__)
print(str(err))`,
      options: [
        `['row 7 of orders.csv', "column 'qty'"]\nqty must be positive`,
        { text: `['row 7 of orders.csv', "column 'qty'"]\nqty must be positive\nrow 7 of orders.csv\ncolumn 'qty'`, why: 'Notes are not part of str(err). They are printed by the traceback machinery, below the exception line.' },
        { text: `["column 'qty'"]\nqty must be positive`, why: 'add_note appends; it does not replace earlier notes.' },
        { text: 'AttributeError', why: 'add_note() exists on every exception from Python 3.11, and it creates __notes__ on first use.' },
      ],
      answer: 0,
      explanation: py`\`add_note\` appends to the \`__notes__\` list. The message (\`str(err)\`) is unchanged; notes appear only in tracebacks (and anywhere you print \`__notes__\` yourself).`,
    },
    {
      id: 'exception-groups-q4',
      type: 'bug',
      prompt: 'This function will not even compile. Click the offending line.',
      code: py`def safe_import(rows):
    try:
        import_rows(rows)
    except* ValueError:
        return "some rows were bad"
    return "ok"`,
      answerLine: 5,
      explanation: py`\`SyntaxError: 'break', 'continue' and 'return' cannot appear in an except* block\`. Leaving the block that way would silently discard any unhandled members of the group. Set a variable instead and return after the \`try\`.`,
    },
    {
      id: 'exception-groups-q5',
      type: 'fill',
      prompt: 'Deprecate `old_total()` so the warning points at the **caller\'s** line.',
      code: py`import warnings

def old_total(prices):
    warnings.___(
        "old_total() is deprecated; use total() instead",
        ___,
        stacklevel=2,
    )
    return sum(prices)`,
      answer: [['warn'], ['DeprecationWarning']],
      explanation: py`\`warnings.warn(message, category, stacklevel)\`. \`DeprecationWarning\` targets developers; \`stacklevel=2\` attributes the warning to the line that called \`old_total()\`.`,
    },
    {
      id: 'exception-groups-q6',
      type: 'mcq',
      prompt: 'Which call makes every subsequent warning raise an exception instead of printing?',
      options: [
        'warnings.simplefilter("error")',
        { text: 'warnings.simplefilter("always")', why: '"always" prints every occurrence (instead of once per location), but does not raise.' },
        { text: 'warnings.warn("x", Exception)', why: 'The category must be a Warning subclass, and warn() emits one warning — it does not change how others are handled.' },
        { text: 'warnings.catch_warnings(record=True)', why: 'That temporarily records warnings into a list (inside a with block) — the opposite of raising.' },
      ],
      answer: 0,
      explanation: py`The \`"error"\` action turns matching warnings into exceptions (possible because \`Warning\` subclasses \`Exception\`). The same from the command line: \`python -W error\`.`,
    },
    {
      id: 'exception-groups-q7',
      type: 'short',
      prompt: 'When should a library emit a warning instead of raising an exception or writing a log message?',
      answer: py`When the call still works but the developer using the library should change something — typically a deprecation ("this will be removed in 3.0, use X") or questionable-but-legal usage. Raising would break code that currently works; logging targets the operators of a running application, not the developer who wrote the call. Warnings are shown during development and testing, can be filtered, and can be turned into errors in CI.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'run-checks',
      title: 'A health-check runner',
      difficulty: 'advanced',
      prompt: py`Write \`run_checks(checks)\`. \`checks\` is a dict mapping a name to a function that takes no arguments; a check **passes** if it returns, and **fails** if it raises an \`Exception\`.

- Run **every** check, even after some have failed.
- If all pass, return the list of names in order.
- If any fail, give each failed exception a note \`check: <name>\` (with \`add_note\`), then raise **one** \`ExceptionGroup\` whose message is \`<failed> of <total> checks failed\` (e.g. \`2 of 3 checks failed\`) containing the original exceptions in order.
- Don't collect \`BaseException\`s like \`SystemExit\` or \`KeyboardInterrupt\`: those must propagate immediately.`,
      files: {
        'main.py': py`def run_checks(checks):
    """Run every check; return passed names, or raise ExceptionGroup of every failure."""
    passed = []
    for name, check in checks.items():
        check()                     # TODO: one failure must not stop the others
        passed.append(name)
    return passed


def database():
    return "ok"


def disk():
    raise OSError("disk 97% full")


print(run_checks({"database": database}))
`,
      },
      hints: [
        'Wrap check() in try / except Exception as err — Exception, not BaseException, so SystemExit still escapes.',
        'In the handler: err.add_note(f"check: {name}") and append err to a failures list; put passed.append(name) in an else block.',
        'After the loop: if failures: raise ExceptionGroup(f"{len(failures)} of {len(checks)} checks failed", failures)',
      ],
      solution: {
        explanation: py`The loop never stops early: each check is wrapped in its own \`try\`, failures are collected, and successes go to \`passed\` in the \`else\` block. Catching \`Exception\` (not \`BaseException\`) means a check calling \`sys.exit()\` or a Ctrl+C still stops everything — signals shouldn't be bundled into a report. \`add_note\` labels each exception with its check **without** changing its type, so a caller can still write \`except* OSError\` for disk problems. Finally one \`ExceptionGroup\` carries every failure; its \`message\` summarises, while \`str(group)\` adds "(2 sub-exceptions)".`,
        files: {
          'main.py': py`def run_checks(checks):
    """Run every check; return passed names, or raise ExceptionGroup of every failure."""
    passed, failures = [], []
    for name, check in checks.items():
        try:
            check()
        except Exception as err:
            err.add_note(f"check: {name}")
            failures.append(err)
        else:
            passed.append(name)
    if failures:
        raise ExceptionGroup(f"{len(failures)} of {len(checks)} checks failed", failures)
    return passed


def database():
    return "ok"


def disk():
    raise OSError("disk 97% full")


print(run_checks({"database": database}))
try:
    run_checks({"database": database, "disk": disk})
except* OSError as group:
    for err in group.exceptions:
        print("OS problem:", err, err.__notes__)
`,
        },
      },
      tests: [
        { name: 'returns the names when every check passes', code: py`assert run_checks({"a": lambda: 1, "b": lambda: None}) == ["a", "b"]` },
        { name: 'raises one ExceptionGroup with every failure', code: py`def disk():
    raise OSError("disk 97% full")

def cache():
    raise TimeoutError("cache did not answer")

with raises(ExceptionGroup) as caught:
    run_checks({"disk": disk, "db": lambda: "ok", "cache": cache})
group = caught.value
assert group.message == "2 of 3 checks failed"
assert [type(e) for e in group.exceptions] == [OSError, TimeoutError]` },
        { name: 'every failure is labelled with a note', code: py`def broken():
    raise ValueError("bad config")

with raises(ExceptionGroup) as caught:
    run_checks({"config": broken})
assert caught.value.exceptions[0].__notes__ == ["check: config"]` },
        { name: 'all checks run even after a failure', code: py`ran = []

def first():
    ran.append("first")
    raise RuntimeError("boom")

def second():
    ran.append("second")

with raises(ExceptionGroup):
    run_checks({"first": first, "second": second})
assert ran == ["first", "second"]` },
        { name: 'SystemExit is not collected', code: py`import sys

with raises(SystemExit):
    run_checks({"quit": lambda: sys.exit(3), "ok": lambda: None})` },
      ],
    },
    {
      id: 'sync-report',
      title: 'Sort a group with except*',
      difficulty: 'advanced',
      prompt: py`\`sync_all(outcomes)\` (given) pretends to sync several shops. \`outcomes\` maps a shop name to \`None\` (success) or an exception it "raised"; if any failed, \`sync_all\` raises one \`ExceptionGroup\` of them.

Write \`sync_report(outcomes)\` that calls \`sync_all(outcomes)\` and returns a dict \`{"retry": [...], "invalid": [...]}\` using **\`except*\`**:

- \`ConnectionError\` and \`TimeoutError\` messages (\`str(err)\`) go in \`"retry"\`, **sorted**.
- \`ValueError\` messages go in \`"invalid"\`, **sorted**.
- Both lists are empty when nothing failed.
- Any other exception (say a \`KeyError\`) must **not** be swallowed: it must escape from \`sync_report\` (as a group).`,
      files: {
        'main.py': py`def sync_all(outcomes):
    """Pretend to sync several shops; raise an ExceptionGroup of every failure."""
    errors = [exc for exc in outcomes.values() if exc is not None]
    if errors:
        raise ExceptionGroup("sync failed", errors)
    return list(outcomes)


def sync_report(outcomes):
    """Sort sync failures into {"retry": [...], "invalid": [...]} with except*."""
    report = {"retry": [], "invalid": []}
    # TODO: call sync_all(outcomes) and sort its failures into the report
    return report


print(sync_report({
    "north": None,
    "south": ConnectionError("south: connection reset"),
    "west": ValueError("west: bad row 12"),
}))
`,
      },
      hints: [
        'Put sync_all(outcomes) in a try with two except* clauses; each receives a group — loop over group.exceptions.',
        'You cannot return from inside an except* block, so fill the report there and return it after the try.',
        'except* (ConnectionError, TimeoutError) as group: report["retry"] = sorted(str(e) for e in group.exceptions)',
      ],
      solution: {
        explanation: py`One \`raise\` from \`sync_all\` can trigger **both** \`except*\` clauses: the network failures go to the first, the data problems to the second. Each clause receives a group of just its members, so building the sorted list is a one-liner. Because \`return\` isn't allowed inside \`except*\`, the report is filled in place and returned after the \`try\`. Anything unmatched — a \`KeyError\` here — is re-raised automatically after the clauses run, so unexpected failures can't be lost. (A \`TaskGroup\` in [asyncio](lesson:asyncio-in-practice) raises exactly this kind of group.)`,
        files: {
          'main.py': py`def sync_all(outcomes):
    """Pretend to sync several shops; raise an ExceptionGroup of every failure."""
    errors = [exc for exc in outcomes.values() if exc is not None]
    if errors:
        raise ExceptionGroup("sync failed", errors)
    return list(outcomes)


def sync_report(outcomes):
    """Sort sync failures into {"retry": [...], "invalid": [...]} with except*."""
    report = {"retry": [], "invalid": []}
    try:
        sync_all(outcomes)
    except* (ConnectionError, TimeoutError) as group:
        report["retry"] = sorted(str(err) for err in group.exceptions)
    except* ValueError as group:
        report["invalid"] = sorted(str(err) for err in group.exceptions)
    return report


print(sync_report({
    "north": None,
    "south": ConnectionError("south: connection reset"),
    "west": ValueError("west: bad row 12"),
}))
`,
        },
      },
      tests: [
        { name: 'no failures gives empty lists', code: py`assert sync_report({"north": None, "south": None}) == {"retry": [], "invalid": []}` },
        { name: 'sorts failures into retry and invalid', code: py`report = sync_report({
    "north": None,
    "south": ConnectionError("south: reset"),
    "east": TimeoutError("east: timed out"),
    "west": ValueError("west: bad row"),
})
assert report == {"retry": ["east: timed out", "south: reset"], "invalid": ["west: bad row"]}` },
        { name: 'only retryable failures', code: py`assert sync_report({"a": TimeoutError("a: slow")}) == {"retry": ["a: slow"], "invalid": []}` },
        { name: 'other errors are not swallowed', code: py`with raises(ExceptionGroup) as caught:
    sync_report({"north": None, "east": KeyError("sku"), "west": ValueError("bad row")})
assert [type(e) for e in caught.value.exceptions] == [KeyError]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'exception-groups-why',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Why were ExceptionGroup and except* added in Python 3.11? What problem do they solve?',
      answer: 'They let a program raise and handle several unrelated exceptions at once — mainly for concurrency (several tasks failing together) and for reporting multiple errors. Before 3.11 you could only propagate one exception, so others were lost or hidden in ad-hoc "MultiError" types; except* lets each handler take its own kind of error, and anything unhandled is re-raised.',
      explanation: py`PEP 654 was driven by async libraries (Trio's MultiError, and asyncio's new \`TaskGroup\` — see [async/await](lesson:asyncio-basics)). The exception model was built around a single in-flight exception; groups make "several in flight" a standard object with standard handling semantics, while plain \`except\` keeps working for single exceptions.`,
      whyAsked: 'Checks awareness of modern Python and the reasoning behind structured concurrency.',
      mistakes: ['Saying groups replace normal exceptions', 'Not knowing that unmatched members are re-raised', 'Thinking plain except catches members'],
      followUps: ['How does asyncio.TaskGroup use them?', 'How does except* differ from except?', 'What are exception notes?'],
      modelAnswer: 'Python\'s exception model used to assume one exception at a time. That breaks down with concurrency: if three tasks fail with different errors, which one do you raise? Libraries either reported only the first, losing the others, or invented their own multi-error classes that no standard code understood. Python 3.11 added ExceptionGroup, a standard exception that contains several others, and except*, which lets each clause handle the members of its type — several clauses can run for one raise, and anything nobody handles is re-raised automatically. asyncio.TaskGroup is the main producer, and it is also handy for validation that wants to report every problem at once.',
    },
    {
      id: 'exception-groups-except-star-output',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What does this print?',
      code: { lang: 'python', code: py`def risky():
    raise ExceptionGroup("batch", [ValueError("a"), KeyError("b"), ValueError("c")])

try:
    try:
        risky()
    except* ValueError as eg:
        print("handled", len(eg.exceptions), "ValueErrors")
    except* (KeyError, ValueError) as eg:
        print("second clause got", [type(e).__name__ for e in eg.exceptions])
    print("after inner try")
except Exception as e:
    print("outer caught", type(e).__name__)` },
      options: [
        'handled 2 ValueErrors / second clause got [\'KeyError\'] / after inner try',
        'handled 2 ValueErrors / second clause got [\'KeyError\', \'ValueError\', \'ValueError\'] / after inner try',
        'handled 2 ValueErrors / outer caught ExceptionGroup',
        'handled 1 ValueErrors / second clause got [\'KeyError\'] / after inner try',
      ],
      correctOption: 0,
      answer: '"handled 2 ValueErrors", then "second clause got [\'KeyError\']", then "after inner try". The first clause takes both ValueErrors; the second only sees what is left; nothing remains, so nothing propagates to the outer handler.',
      explanation: py`Each \`except*\` clause is matched against the **remaining** unhandled part of the group (via \`split()\`), so a member is handled at most once even if later clauses would also match it. With everything handled, execution continues after the \`try\` statement.`,
      whyAsked: 'Tests precise understanding of except* matching order, which differs from plain except.',
      mistakes: ['Assuming only the first clause runs', 'Assuming later clauses see the original full group', 'Expecting a re-raise even though everything was handled'],
      followUps: ['What if the second clause were except* TypeError?', 'What happens if a clause raises a new exception?', 'Why can\'t you return inside except*?'],
      modelAnswer: 'It prints "handled 2 ValueErrors", then "second clause got [\'KeyError\']", then "after inner try". except* clauses are tried in order against whatever is still unhandled: the first clause splits off both ValueErrors and runs once with a group of them. The second clause would match ValueError too, but those are already handled, so it only receives the KeyError. Since nothing is left after the clauses, nothing is re-raised, the outer handler never runs, and execution continues after the inner try.',
    },
    {
      id: 'exception-groups-taskgroup-vs-gather',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'Compare how asyncio.gather() and asyncio.TaskGroup report failures from several tasks.',
      answer: 'gather() propagates the first exception to the awaiting code and does not cancel the other awaitables (they keep running); with return_exceptions=True it returns exceptions as values in the result list. TaskGroup (3.11+) cancels the remaining tasks when one fails, waits for them, and raises an ExceptionGroup containing every failure, which you handle with except*.',
      explanation: py`TaskGroup implements *structured concurrency*: no task outlives the \`async with\` block, and no failure is lost. \`gather\` is older and looser; it's still useful with \`return_exceptions=True\` when you want all results and errors as a list. See [asyncio in practice](lesson:asyncio-in-practice).`,
      code: { lang: 'python', code: py`import asyncio


async def job(name, fail):
    await asyncio.sleep(0.01)
    if fail:
        raise ValueError(f"{name} failed")
    return name


async def main():
    results = await asyncio.gather(job("a", False), job("b", True), return_exceptions=True)
    print("gather:", results)
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(job("c", True))
            tg.create_task(job("d", True))
    except* ValueError as eg:
        print("TaskGroup:", sorted(str(e) for e in eg.exceptions))


asyncio.run(main())` },
      whyAsked: 'Senior async Python roles need to know failure semantics; mistakes here cause leaked tasks and lost errors.',
      mistakes: ['Thinking gather cancels other tasks on failure', 'Using except ValueError around a TaskGroup', 'Not knowing return_exceptions'],
      followUps: ['What is structured concurrency?', 'How does cancellation interact with TaskGroup?', 'How do you add timeouts (asyncio.timeout)?'],
      modelAnswer: 'With gather, the first exception propagates to whoever awaited it, but the other awaitables are not cancelled — they keep running in the background — and their errors can go unnoticed. Passing return_exceptions=True changes that: exceptions come back as values in the results list. TaskGroup, added in 3.11, is structured: when one task fails it cancels the siblings, waits for them to finish, and raises an ExceptionGroup with every failure, so I handle it with except*. For new code I prefer TaskGroup because tasks can\'t leak and no error is lost.',
    },
    {
      id: 'exception-groups-notes-vs-chaining',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'You catch a ValueError while importing row 7 of a CSV and want the traceback to say so. Compare add_note(), raise … from err, and wrapping in an ExceptionGroup.',
      answer: 'add_note("row 7") + bare raise keeps the same exception and type, just adds context — best when callers should still catch ValueError. raise ImportRowError(...) from err creates a new domain exception with the original as cause — best at a layer boundary. An ExceptionGroup is for several independent errors, not for adding context to one.',
      explanation: py`Notes (3.11+) are the least invasive option. Chaining changes the type callers see (useful for translation). Groups change the *shape* (callers need \`except*\`), so they're wrong for single errors.`,
      code: { lang: 'python', code: py`def parse_row(number, text):
    try:
        return int(text)
    except ValueError as err:
        err.add_note(f"while importing row {number}")
        raise


try:
    parse_row(7, "seven")
except ValueError as err:
    print(type(err).__name__, err, err.__notes__)` },
      whyAsked: 'Shows whether you can choose the right tool for error context in modern Python.',
      mistakes: ['Wrapping single errors in groups', 'Gluing context into the message with string concatenation (loses the original type and message structure)'],
      followUps: ['Where do notes appear in a traceback?', 'Do notes survive except* splitting?', 'What did people do before 3.11?'],
      modelAnswer: 'If I just want to say where the error happened and callers should still catch a ValueError, I call err.add_note("while importing row 7") and re-raise with a bare raise; the type, message and traceback are unchanged and the note prints under the error. If I am at a layer boundary and want callers to see my own exception type, I raise ImportRowError from err, which keeps the original as the cause. An ExceptionGroup is the wrong tool here — it is for several independent errors, and it would force every caller to switch to except*.',
    },
    {
      id: 'exception-groups-deprecation',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'You maintain a library and need to rename `fetch_all()` to `fetch_many()`. How do you roll this out without breaking users?',
      answer: 'Keep fetch_all() as a thin wrapper that calls fetch_many() and emits DeprecationWarning with stacklevel=2 (or use @warnings.deprecated on 3.13+), naming the replacement and the removal version. Document it in the changelog, keep it for at least one release, test that it warns (catch_warnings/pytest.warns), and remove it in a later major version. Users see it in tests and with -W error in CI.',
      explanation: py`Warnings are the standard channel for developer-facing heads-ups. \`stacklevel=2\` makes the message point at the user's call — and is what makes the default filter show \`DeprecationWarning\` for calls from \`__main__\`. Test runners like pytest show deprecations by default, which is where most developers will notice them.`,
      code: { lang: 'python', code: py`import warnings


def fetch_many(ids):
    return [f"item-{i}" for i in ids]


def fetch_all(ids):
    """Deprecated alias of fetch_many(); will be removed in version 3.0."""
    warnings.warn(
        "fetch_all() is deprecated and will be removed in 3.0; use fetch_many()",
        DeprecationWarning,
        stacklevel=2,
    )
    return fetch_many(ids)


with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    fetch_all([1, 2])
print([str(w.message) for w in caught])` },
      whyAsked: 'API evolution is a core library-maintenance skill; it shows empathy for users and knowledge of the warnings system.',
      mistakes: ['Just renaming (breaking change)', 'print() or logging instead of a warning', 'Forgetting stacklevel', 'Never actually removing the old name'],
      followUps: ['How do users turn the warning into an error in CI?', 'Why is DeprecationWarning hidden by default outside __main__?', 'What is FutureWarning for?'],
      modelAnswer: 'I would add fetch_many as the real implementation and keep fetch_all as a thin wrapper that calls it and emits a DeprecationWarning with stacklevel=2, saying what to use instead and in which version it disappears — or use the warnings.deprecated decorator on 3.13+. I would document it in the changelog and keep the alias for at least one release, with a test asserting that it warns. Users notice it in their test runs or by running with -W error::DeprecationWarning in CI, which turns it into a failure. Then I remove it in the next major version.',
    },
    {
      id: 'exception-groups-flatten',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 6,
      question: py`Write \`flatten(exc)\` that returns a list of the **leaf** exceptions of a (possibly deeply nested) exception group, in depth-first order. If \`exc\` is not a group, return \`[exc]\`.`,
      answer: 'If isinstance(exc, BaseExceptionGroup), recursively flatten each member of exc.exceptions and concatenate; otherwise return [exc].',
      explanation: py`Groups are trees: \`exceptions\` holds direct members, some of which may be groups. Checking \`BaseExceptionGroup\` (the common base) covers both \`ExceptionGroup\` and \`BaseExceptionGroup\`. This is useful for logging and metrics, where you care about individual failures, not the tree shape.`,
      starter: { files: { 'main.py': py`def flatten(exc):
    """Return the leaf exceptions of a (possibly nested) group, depth-first."""
    # TODO
    return list(exc.exceptions)


group = ExceptionGroup("all", [ValueError("a"), ExceptionGroup("inner", [KeyError("b")])])
print(flatten(group))
` } },
      tests: [
        { name: 'a flat group', code: py`a, b = ValueError("a"), TypeError("b")
assert flatten(ExceptionGroup("g", [a, b])) == [a, b]` },
        { name: 'nested groups, depth-first', code: py`a, b, c, d = ValueError("a"), KeyError("b"), TypeError("c"), OSError("d")
g = ExceptionGroup("all", [a, ExceptionGroup("x", [b, ExceptionGroup("y", [c])]), d])
assert flatten(g) == [a, b, c, d]` },
        { name: 'a plain exception becomes a one-item list', code: py`e = ValueError("solo")
assert flatten(e) == [e]` },
        { name: 'works with BaseExceptionGroup', code: py`k = KeyboardInterrupt()
v = ValueError("v")
assert flatten(BaseExceptionGroup("b", [k, v])) == [k, v]` },
      ],
      solution: { files: { 'main.py': py`def flatten(exc):
    """Return the leaf exceptions of a (possibly nested) group, depth-first."""
    if isinstance(exc, BaseExceptionGroup):
        leaves = []
        for member in exc.exceptions:
            leaves.extend(flatten(member))
        return leaves
    return [exc]


group = ExceptionGroup("all", [ValueError("a"), ExceptionGroup("inner", [KeyError("b")])])
print(flatten(group))
` } },
      hints: ['Base case: not a group → [exc].', 'Recursive case: for each member of exc.exceptions, extend the result with flatten(member).', 'Check isinstance(exc, BaseExceptionGroup) so both group types work.'],
      whyAsked: 'A small recursion problem that also checks you know groups nest and which base class to test against.',
      mistakes: ['Only going one level deep', 'Checking ExceptionGroup and missing BaseExceptionGroup', 'Returning the groups themselves'],
      followUps: ['How would you count leaves by type?', 'Could you do it with eg.split instead?', 'How would you keep the path (which group each leaf came from)?'],
      modelAnswer: 'An exception group is a tree, so I recurse. If the argument is an instance of BaseExceptionGroup — the common base of both group types — I go through its exceptions tuple, flatten each member and concatenate the results, which gives depth-first order. Otherwise it is a leaf, so I return a one-element list. That also handles a plain exception passed directly. For metrics I would then count the leaves by type.',
    },
  ],

  takeaways: [
    'ExceptionGroup (3.11+) is one exception that carries several unrelated exceptions; groups can nest. Use BaseExceptionGroup for members like KeyboardInterrupt.',
    'except* T handles the members of type T — several except* clauses can run for one raise, each gets a group, and unmatched members are re-raised automatically.',
    'Plain except T does not match members inside a group; code around asyncio.TaskGroup must use except*.',
    'except* blocks cannot return/break/continue, and you cannot mix except and except* on one try.',
    'add_note() (3.11+) attaches context to any exception without changing its type; notes print under the traceback.',
    'Use groups only for genuinely multiple, independent errors — a single failure should stay a single exception.',
    'warnings.warn tells developers something is off without stopping the program: DeprecationWarning with stacklevel=2 for deprecations; filters ("error", "ignore", catch_warnings, -W error) control what happens.',
    'Python 3.14 (PEP 758) allows except A, B: / except* A, B: without brackets — but not with as.',
  ],
}
