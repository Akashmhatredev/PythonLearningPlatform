// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const COFFEE_SHOP = py`from contextlib import contextmanager


# 1. send() + close(): a coroutine that RECEIVES orders
def till():
    total = 0.0
    items = 0
    try:
        while True:
            item, price = yield total      # pause; resume with an (item, price)
            items += 1
            total += price
    except GeneratorExit:                  # close() raises this at the yield
        print(f"  till closed: {items} items, £{total:.2f}")


register = till()
next(register)                             # prime: run to the first yield
register.send(("latte", 3.20))
register.send(("croissant", 2.50))
print(f"running total: £{register.send(('tea', 1.80)):.2f}")
register.close()


# 2. throw(): deliver an exception at the paused yield
def order_numbers():
    number = 1
    while True:
        try:
            yield number
            number += 1
        except ValueError as reason:       # throw(ValueError(...)) lands here
            print(f"  reset requested: {reason}")
            number = 1


orders = order_numbers()
print(next(orders), next(orders), next(orders))
print("after reset:", orders.throw(ValueError("new day")))
print("next order:", next(orders))


# 3. yield from: delegate to a sub-generator and collect its return value
def brew(drink, steps):
    for step in steps:
        yield f"{drink}: {step}"
    return len(steps)                      # becomes the value of 'yield from'


def morning_shift():
    done = yield from brew("latte", ["grind", "tamp", "pull shot"])
    done += yield from brew("tea", ["boil", "steep"])
    return done


shift = morning_shift()
while True:
    try:
        print(" ", next(shift))
    except StopIteration as finished:
        print("morning_shift returned", finished.value)
        break


# 4. @contextmanager: a generator becomes a with-statement
@contextmanager
def shift_log(name):
    print(f"[{name}] open")
    try:
        yield name.upper()                 # the value bound by 'as'
    finally:
        print(f"[{name}] closed")


with shift_log("morning") as label:
    print("  working the", label, "shift")
`

export default {
  id: 'advanced-generators',
  title: 'send(), yield from & generator delegation',
  summary: 'Generators can also receive values (send), receive exceptions (throw), be shut down (close) and delegate to sub-generators (yield from) — the machinery behind @contextmanager and the road to async/await.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['generators', 'lazy-evaluation', 'try-except'],
  related: ['iterators', 'asyncio-basics', 'asyncio-in-practice', 'contextlib', 'context-managers', 'itertools', 'recursion', 'raising-exceptions', 'type-hints'],
  tags: ['send', 'throw', 'close', 'GeneratorExit', 'yield from', 'delegation', 'subgenerator', 'coroutine', 'priming', 'StopIteration.value', 'contextmanager', 'async await history', 'PEP 342', 'PEP 380'],
  apis: [
    { name: 'gen.send(value)', summary: 'Resumes the generator; the paused yield expression evaluates to value. Returns the next yielded value.' },
    { name: 'value = yield expr', summary: 'yield as an expression: hands out expr, then receives whatever send() passes in (None for next()).' },
    { name: 'gen.throw(exc)', summary: 'Raises exc inside the generator at the paused yield; returns the next yielded value if it is handled.' },
    { name: 'gen.close()', summary: 'Raises GeneratorExit at the paused yield so the generator can clean up; returns its return value (3.13+).' },
    { name: 'GeneratorExit', summary: 'BaseException subclass used by close(); a generator must not yield after receiving it.' },
    { name: 'result = yield from sub', summary: 'Delegates to sub: passes its values, send() and throw() through, then evaluates to sub\'s return value.' },
    { name: '@contextlib.contextmanager', summary: 'Turns a one-yield generator function into a context manager for the with statement.' },
    { name: 'collections.abc.Generator[Y, S, R]', summary: 'Type hint for a generator that yields Y, receives S via send() and returns R.' },
  ],
  docs: [
    { label: 'Language reference — generator-iterator methods', url: 'https://docs.python.org/3/reference/expressions.html#generator-iterator-methods' },
    { label: 'Language reference — yield expressions', url: 'https://docs.python.org/3/reference/expressions.html#yield-expressions' },
    { label: 'PEP 342 — coroutines via enhanced generators', url: 'https://peps.python.org/pep-0342/' },
    { label: 'PEP 380 — syntax for delegating to a subgenerator', url: 'https://peps.python.org/pep-0380/' },
    { label: 'contextlib.contextmanager', url: 'https://docs.python.org/3/library/contextlib.html#contextlib.contextmanager' },
    { label: 'PEP 492 — coroutines with async and await syntax', url: 'https://peps.python.org/pep-0492/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`So far, data has flowed one way: a [generator](lesson:generators) hands values *out* every time someone calls \`next()\`. But the conversation at a \`yield\` can go both ways. A paused generator has three more doors:`,
    py`- **\`gen.send(value)\`** — resume it and *hand a value in*: the paused \`yield\` expression evaluates to \`value\`.
- **\`gen.throw(exc)\`** — resume it by *raising an exception* right at the paused \`yield\`.
- **\`gen.close()\`** — ask it to *shut down*: Python raises \`GeneratorExit\` at the \`yield\` so \`finally\` blocks can clean up.`,
    { code: py`def averager():
    total = count = 0
    average = None
    while True:
        value = yield average      # send() delivers value here
        total += value
        count += 1
        average = total / count


avg = averager()
next(avg)              # "prime" it: run to the first yield
print(avg.send(10))    # 10.0
print(avg.send(20))    # 15.0`, lang: 'python', title: 'a generator that receives values' },
    py`A generator used like this — mostly *receiving* values — is called a **coroutine**. And with **\`yield from\`**, one generator can hand the whole conversation to a sub-generator and get back its return value.`,
    py`This isn't just a curiosity. It's how \`@contextmanager\` turns a generator into a \`with\` block ([contextlib](lesson:contextlib)), and it's the machinery that \`async\`/\`await\` grew out of ([async/await & the event loop](lesson:asyncio-basics)).`,
  ],
  why: [
    py`**Stateful processes, written as plain code.** A running average, a parser that receives bytes as they arrive, a game character's state machine — all need memory between steps. A coroutine keeps that state in ordinary local variables and its position in the code, instead of in a class with flags.`,
    py`**Clean shutdown.** \`close()\` and \`GeneratorExit\` let a paused generator release files, connections and locks, even when the consumer stops early.`,
    py`**Composition.** \`yield from\` lets you split a big generator into smaller ones — recursively, even — without losing \`send()\`, \`throw()\` or return values along the way.`,
    py`**Understanding async.** \`await\` works the same way as \`yield from\`: a coroutine pauses, the event loop resumes it later with \`send()\`. Knowing generators makes asyncio's behaviour far less mysterious.`,
  ],
  eli15: [
    py`A normal generator is like a friend who tells you a story one sentence at a time: you say "go on" (\`next()\`), they say the next sentence and pause.`,
    py`\`send()\` is when *you* also say something back: "go on — and by the way, the dragon is green." They take your answer and use it in the next part of the story. \`throw()\` is shouting "plot twist: an earthquake!" — they have to deal with it right where they paused. \`close()\` is "that's enough for tonight" — they put the book away tidily.`,
    py`\`yield from\` is your friend saying "my cousin tells this chapter better" and passing you over. You keep chatting the same way; you're just talking to the cousin until the chapter ends, then your friend takes over again — and the cousin tells your friend how it ended.`,
  ],
  analogy: {
    title: 'A walkie-talkie conversation',
    body: [
      py`Two people on walkie-talkies take turns. Only one can talk at a time; when one says "over", the other speaks. Each side remembers where the conversation was.`,
      py`The caller and the generator are those two people. \`yield\` is the generator saying "…over", \`send()\` is the caller replying with a message, \`throw()\` is the caller replying with an emergency, and \`close()\` is "over and out". With \`yield from\`, the generator patches you through to a colleague on another channel until they're done.`,
    ],
    mapping: [
      ['"…over" (handing over the turn)', 'yield value — the generator pauses and gives a value back'],
      ['replying with a message', 'gen.send(message) — the paused yield evaluates to message'],
      ['the first "can you hear me?"', 'priming with next(gen) — getting to the first yield'],
      ['replying "emergency!"', 'gen.throw(exc) — the exception is raised at the yield'],
      ['"over and out"', 'gen.close() — GeneratorExit, then cleanup in finally'],
      ['patching through to a colleague', 'yield from sub — the caller talks to sub until it finishes'],
      ['the colleague\'s final report', 'sub\'s return value = the value of the yield from expression'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch send() deliver values into a paused generator',
    props: {
      code: py`def averager():
    total = 0
    count = 0
    average = None
    while True:
        value = yield average
        total += value
        count += 1
        average = total / count


avg = averager()
next(avg)
print(avg.send(10))
print(avg.send(20))
avg.close()
print("closed")
`,
      notes: {
        12: 'Creating the generator runs nothing: state *created*.',
        13: '**Priming.** `next(avg)` runs to the first `yield`, hands out `average` (None) and pauses there. Without this step, `send(10)` would fail: there is no paused `yield` to receive the value yet.',
        6: 'The `yield` is an **expression**. When paused here, the generator waits. When resumed by `send(10)`, the whole `yield average` evaluates to `10`, which is stored in `value`.',
        14: '`send(10)` resumes the generator *and* returns the next value it yields — the new average, 10.0.',
        16: '`close()` raises `GeneratorExit` at the paused `yield`. Nothing catches it, so the generator finishes quietly: state *closed*.',
      },
    },
    alt: 'A step-by-step trace of a running-average coroutine. After avg = averager() the generator is created. next(avg) runs to the yield on line 6 and suspends. avg.send(10) resumes it with value = 10, updates total, count and average, loops and suspends again at the yield, returning 10.0. avg.send(20) does the same and returns 15.0. avg.close() raises GeneratorExit at the yield and the generator becomes closed.',
    caption: py`Watch the variables inside the generator frame: \`value\` takes whatever \`send()\` passed in, while \`total\`, \`count\` and \`average\` survive between calls. Each \`send()\` is "resume, receive, run to the next yield, return what it yields".`,
  },
  syntax: [
    py`#### yield as an expression`,
    { code: py`def echo():
    received = None
    while True:
        received = yield f"got {received}"   # send OUT a value, take IN a value


e = echo()
print(next(e))        # got None   (next(e) is the same as e.send(None))
print(e.send("hi"))   # got hi
print(e.send(42))     # got 42`, lang: 'python', title: 'out and in at the same yield' },
    py`- \`x = yield value\` first hands \`value\` to the caller, then pauses. When resumed, the expression's result is whatever was **sent** — or \`None\` if it was resumed with \`next()\`.
- **Prime first.** A just-created generator hasn't reached any \`yield\`, so the first resume must be \`next(gen)\` or \`gen.send(None)\`. Sending anything else raises \`TypeError: can't send non-None value to a just-started generator\`.
- \`send()\` returns the **next** value the generator yields (or raises \`StopIteration\` if it finishes instead).`,
    py`#### throw() and close()`,
    { code: py`def order_numbers():
    number = 1
    while True:
        try:
            yield number
            number += 1
        except ValueError:          # throw(ValueError(...)) arrives here
            number = 1              # handle it and carry on


orders = order_numbers()
print(next(orders), next(orders))         # 1 2
print(orders.throw(ValueError("reset")))  # 1 — handled, then yielded again
orders.close()                            # GeneratorExit at the yield -> finished`, lang: 'python', title: 'throw an exception in; close it down' },
    py`- \`gen.throw(exc)\` raises \`exc\` at the paused \`yield\`. If the generator catches it and yields again, \`throw()\` returns that value; if not, the exception propagates out of \`throw()\` and the generator is closed.
- \`gen.close()\` raises **\`GeneratorExit\`** at the paused \`yield\`. The generator should let it end the function (running \`finally\` blocks on the way). If it *yields* instead, Python raises \`RuntimeError: generator ignored GeneratorExit\`. Closing a generator that's finished or never started does nothing.`,
    { callout: 'version', title: 'Version notes', text: py`Since **Python 3.12**, the old three-argument form \`gen.throw(type, value, traceback)\` is deprecated (it emits a \`DeprecationWarning\`); pass an exception instance: \`gen.throw(ValueError("reset"))\`. Since **Python 3.13**, if a generator catches \`GeneratorExit\` and \`return\`s a value, \`close()\` returns that value (earlier versions returned \`None\`).` },
    py`#### yield from: delegating to a sub-generator (Python 3.3+)`,
    { code: py`def brew(drink, steps):
    for step in steps:
        yield f"{drink}: {step}"
    return len(steps)                 # the sub-generator's result


def shift():
    done = yield from brew("tea", ["boil", "steep"])     # done == 2
    done += yield from brew("latte", ["grind"])          # done == 3
    return done


print(list(shift()))   # ['tea: boil', 'tea: steep', 'latte: grind']`, lang: 'python', title: 'yield from passes values through and returns a result' },
    py`\`result = yield from sub\` does four things:`,
    py`1. every value \`sub\` yields goes **straight to the caller**;
2. every \`send()\` and \`throw()\` from the caller goes **straight into \`sub\`**;
3. \`close()\` on the outer generator closes \`sub\` too;
4. when \`sub\` finishes, its **return value** becomes the value of the \`yield from\` expression.`,
    py`With a plain iterable (\`yield from [1, 2, 3]\`) it simply yields each item — handy for flattening — but the send/throw/return features need a generator on the other side.`,
    py`#### @contextmanager: a one-yield generator as a with block`,
    { code: py`from contextlib import contextmanager


@contextmanager
def shift_log(name):
    print(f"[{name}] open")          # runs on entering the with block
    try:
        yield name.upper()           # the value bound by "as"; the with body runs here
    finally:
        print(f"[{name}] closed")    # runs on leaving — even after an exception


with shift_log("night") as label:
    print("working the", label, "shift")`, lang: 'python', title: 'setup → yield → teardown' },
    py`The generator must yield **exactly once**. Code before the \`yield\` is the setup (\`__enter__\`), code after it is the teardown (\`__exit__\`). If the \`with\` body raises, \`@contextmanager\` *throws* the exception into the generator at the \`yield\` — which is why the \`try\`/\`finally\` matters. Full details in [contextlib](lesson:contextlib) and [context managers](lesson:context-managers).`,
  ],
  walkthrough: {
    title: 'Reading the coffee-shop program line by line',
    lang: 'python',
    code: COFFEE_SHOP,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 14], text: py`\`till\` is a **coroutine**: it mostly receives data. \`item, price = yield total\` hands out the current total and then waits for an \`(item, price)\` tuple from \`send()\`. The \`except GeneratorExit\` block runs when someone calls \`close()\`.` },
      { lines: [17, 18], text: py`Creating the generator runs nothing, so we **prime** it with \`next()\`: it runs to the first \`yield\` and pauses, ready to receive.` },
      { lines: [19, 21], text: py`Each \`send()\` resumes the till with an order, updates the totals, loops, and returns the next value yielded — the new total. The third send's return value is printed: \`£7.50\`.` },
      { lines: [22, 22], text: py`\`close()\` raises \`GeneratorExit\` at the paused \`yield\`. Our handler prints a summary and then lets the function end — exactly what a closing generator should do.` },
      { lines: [26, 34], text: py`\`order_numbers\` wraps its \`yield\` in \`try\`/\`except ValueError\`. An exception thrown in with \`throw()\` lands *at that yield*, gets handled, and the loop carries on.` },
      { lines: [37, 40], text: py`\`throw(ValueError("new day"))\` resets the counter: the handler prints the message, sets \`number = 1\`, loops back and yields \`1\` — which becomes the return value of \`throw()\`.` },
      { lines: [44, 53], text: py`\`morning_shift\` **delegates** to \`brew\` twice with \`yield from\`. The steps pass straight through to our loop; when each \`brew\` returns its step count, that number becomes the value of the \`yield from\` expression.` },
      { lines: [56, 62], text: py`We drive \`morning_shift\` by hand to see its own return value: it rides on the final \`StopIteration\` as \`.value\` — \`5\` steps in total. (A \`for\` loop would ignore it.)` },
      { lines: [66, 76], text: py`\`@contextmanager\` turns the one-yield generator into a context manager: setup before the \`yield\`, the \`with\` body while it's paused, teardown in \`finally\` after it.` },
    ],
  },
  playground: {
    title: 'Coffee-shop coroutines',
    objective: 'Run it and match each output line to the send(), throw(), close() or yield from that produced it.',
    files: { 'main.py': COFFEE_SHOP },
    expected: py`\`\`\`text
running total: £7.50
  till closed: 3 items, £7.50
1 2 3
  reset requested: new day
after reset: 1
next order: 2
  latte: grind
  latte: tamp
  latte: pull shot
  tea: boil
  tea: steep
morning_shift returned 5
[morning] open
  working the MORNING shift
[morning] closed
\`\`\``,
    experiments: [
      {
        id: 'close-returns',
        task: py`**(Python 3.13+)** Make \`close()\` hand back a summary: in the \`except GeneratorExit\` block of \`till\`, replace the \`print\` with \`return items, round(total, 2)\`. Then change \`register.close()\` to \`print(register.close())\`.`,
        hint: py`Only two lines change: the \`print(...)\` inside \`except GeneratorExit:\` becomes \`return items, round(total, 2)\`, and the last line of section 1 becomes \`print(register.close())\`.`,
        tests: [
          { name: 'close() returns (items, total)', code: py`t = till()
next(t)
t.send(("latte", 3.20))
assert t.close() == (1, 3.2)` },
          { name: 'the summary is printed', code: py`assert "(3, 7.5)" in output` },
        ],
        explain: py`Since Python 3.13, \`close()\` returns whatever the generator returns while handling \`GeneratorExit\`. On older versions it always returned \`None\`, so you'd collect the summary another way (e.g. send a sentinel value and read \`StopIteration.value\`).`,
      },
      {
        id: 'price-tracker',
        task: py`Write a coroutine \`average_price()\` that receives prices with \`send()\` and yields the **average so far** after each one. After priming, \`send(2.0)\` returns \`2.0\` and then \`send(4.0)\` returns \`3.0\`.`,
        hint: py`Copy the shape of \`till\`: keep \`total\` and \`count\`, start with \`average = None\`, and loop on \`price = yield average\`.`,
        tests: [
          { name: 'running average via send()', code: py`assert callable(ns.get('average_price')), 'Define average_price()'
p = average_price()
next(p)
assert p.send(2.0) == 2.0
assert p.send(4.0) == 3.0
assert p.send(9.0) == 5.0` },
        ],
        explain: py`The state (\`total\`, \`count\`) lives in the paused frame, and each \`send()\` both delivers a price and returns the new average. Without priming, the first \`send(2.0)\` would raise \`TypeError: can't send non-None value to a just-started generator\`.`,
      },
      {
        id: 'mocha',
        task: py`Add a third drink to \`morning_shift\`: \`done += yield from brew("mocha", ["grind", "melt chocolate", "pull shot"])\`. Predict the new return value first.`,
        hint: py`Add it as a third line in \`morning_shift\`, before \`return done\`.`,
        tests: [
          { name: 'mocha steps pass through', code: py`assert "mocha: melt chocolate" in output` },
          { name: 'morning_shift now returns 8', code: py`assert "morning_shift returned 8" in output` },
        ],
        explain: py`Each \`yield from\` passes the sub-generator's steps straight through to the caller and then evaluates to its return value. \`morning_shift\` never has to loop over \`brew\` itself — and adding a stage is one line.`,
      },
      {
        id: 'crash-in-with',
        task: py`Inside the \`with shift_log("morning")\` block, add \`raise ValueError("milk ran out")\` after the print. Run it. Then delete the \`try:\`/\`finally:\` lines in \`shift_log\` (keep the \`yield\` and the closing print) and run again.`,
        hint: py`Look for \`[morning] closed\` in the output each time.`,
        explain: py`With \`try\`/\`finally\`, \`[morning] closed\` is printed before the traceback: \`@contextmanager\` threw the \`ValueError\` into the generator at the \`yield\`, and the \`finally\` block ran on the way out. Without it, the exception skips the teardown entirely — that's the bug \`try\`/\`finally\` prevents.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch yield from delegate — and return a result',
    props: {
      code: py`def brew(drink, steps):
    for step in steps:
        yield f"{drink}: {step}"
    return len(steps)


def shift():
    done = yield from brew("tea", ["boil", "steep"])
    done += yield from brew("latte", ["grind"])
    return done


for step in shift():
    print(step)
`,
      notes: {
        8: '`yield from` creates the `brew` generator and delegates to it. Watch the call stack: **shift → brew**. Each value `brew` yields goes straight out to the `for` loop.',
        3: 'This yield travels through `shift` without `shift` running any code of its own.',
        4: '`brew` returns `2`. The `StopIteration` that carries it is caught by `yield from`, and `2` becomes the value of the expression: `done = 2`.',
        9: 'A second delegation. When it returns `1`, `done` becomes `3`.',
        10: '`shift` returns `3` — its own `StopIteration` ends the `for` loop, which ignores the value.',
      },
    },
    alt: 'A step-by-step trace. The for loop resumes shift, which delegates to brew("tea", ...) with yield from; the call stack shows shift and brew, and each step string brew yields goes straight to the loop and is printed. When brew returns 2, done is set to 2 in shift. The same happens for brew("latte", ...), which returns 1, making done 3. Finally shift returns 3 and the loop ends.',
    caption: py`Two things to spot: while delegating, values flow **directly** between the \`for\` loop and \`brew\`; and a sub-generator's \`return\` value lands in the delegating generator as the result of \`yield from\`.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`All four ways of resuming a generator are variations on one idea — "resume at the paused \`yield\`, and make that \`yield\` produce something":`,
      py`| call | at the paused \`yield\`… | returns |
|---|---|---|
| \`next(gen)\` | the \`yield\` evaluates to \`None\` | the next yielded value |
| \`gen.send(v)\` | the \`yield\` evaluates to \`v\` | the next yielded value |
| \`gen.throw(exc)\` | \`exc\` is raised | the next yielded value, if the generator handles \`exc\` |
| \`gen.close()\` | \`GeneratorExit\` is raised | \`None\` (or the return value, 3.13+) |`,
      py`In every case, if the function finishes instead of yielding, you get \`StopIteration\` (except \`close()\`, which treats finishing as success). And \`next(gen)\` is literally \`gen.send(None)\`.`,
    ],
    technical: [
      py`**What \`yield from\` expands to.** PEP 380 specifies the exact behaviour; a simplified sketch of \`result = yield from sub\` (ignoring \`throw()\`/\`close()\` forwarding and edge cases) is:`,
      { code: py`def delegate(sub):
    # SIMPLIFIED sketch of: result = yield from sub
    it = iter(sub)
    try:
        value = next(it)
    except StopIteration as stop:
        return stop.value
    while True:
        sent = yield value                 # pass the value out, receive what the caller sends
        try:
            value = it.send(sent) if sent is not None else next(it)
        except StopIteration as stop:
            return stop.value              # the result of the yield from expression


def sub():
    got = yield "ready"
    yield f"sub received {got}"
    return "sub done"


d = delegate(sub())
print(next(d), "|", d.send("coffee"))     # ready | sub received coffee`, lang: 'python', title: 'yield from, roughly (simplified)' },
      py`The real version also forwards \`throw()\` (calling \`sub.throw\`), closes \`sub\` when the outer generator is closed, and handles subtleties around \`GeneratorExit\`. Writing it by hand is long and easy to get wrong — which is exactly why the syntax exists.`,
      py`**How @contextmanager works.** It's a small adapter around a generator. A simplified version (the real one, in \`contextlib\`, handles more cases):`,
      { code: py`class SimpleContextManager:
    """SIMPLIFIED sketch of what @contextmanager builds."""

    def __init__(self, gen):
        self.gen = gen

    def __enter__(self):
        return next(self.gen)                  # run the setup, up to the yield

    def __exit__(self, exc_type, exc, tb):
        if exc is None:
            try:
                next(self.gen)                 # run the teardown after the yield
            except StopIteration:
                return False
            raise RuntimeError("generator didn't stop")
        try:
            self.gen.throw(exc)                # re-raise the body's error AT the yield
        except StopIteration:
            return True                        # the generator handled it: suppress
        except BaseException as err:
            if err is exc:
                return False                   # same error came back out: let it propagate
            raise
        raise RuntimeError("generator didn't stop after throw()")`, lang: 'python', title: 'contextmanager, roughly (simplified)' },
      py`That's where the two famous errors come from: \`RuntimeError: generator didn't yield\` (no \`yield\` reached in \`__enter__\`) and \`RuntimeError: generator didn't stop\` (a second \`yield\` reached in \`__exit__\`).`,
      py`**Garbage collection calls close().** If a suspended generator is no longer referenced, Python closes it, so \`finally\` blocks still run. In CPython that usually happens immediately (reference counting); other implementations may delay it until a garbage-collection pass, so don't rely on the timing — close explicitly when it matters.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython compiles both \`yield from\` and \`await\` into the same short bytecode loop (built around the \`SEND\` and \`YIELD_VALUE\` instructions in recent versions), so delegation is handled by a few dedicated instructions rather than by a Python-level \`for\` loop with its own \`yield\`. Opcode names and details change between versions — see [bytecode](lesson:bytecode).` },
    ],
    production: [
      py`**From generators to async/await.** Each step of this history built on the one before:`,
      py`| Python | what arrived | PEP |
|---|---|---|
| 2.2 | generators and \`yield\` | 255 |
| 2.5 | \`send()\`, \`throw()\`, \`close()\` — \`yield\` becomes an expression, generators become coroutines; the \`with\` statement | 342, 343 |
| 3.3 | \`yield from\` delegation with return values | 380 |
| 3.4 | \`asyncio\`, whose coroutines were generators using \`yield from\` | 3156 |
| 3.5 | \`async def\` and \`await\` — native coroutines, a separate type | 492 |
| 3.6 | asynchronous generators (\`yield\` inside \`async def\`) | 525 |
| 3.11 | the old \`@asyncio.coroutine\` generator decorator removed | — |`,
      py`Native coroutines still use the generator protocol underneath: an event loop resumes them with \`send()\` and delivers cancellation with \`throw()\`. You can drive one by hand:`,
      { code: py`class Sleep:
    def __await__(self):
        yield "paused at await"     # hand control back to whoever is driving


async def task():
    print("start")
    await Sleep()
    print("resumed")
    return 42


coro = task()
print(coro.send(None))              # start / paused at await
try:
    coro.send(None)                 # resumed
except StopIteration as done:
    print("result:", done.value)    # result: 42`, lang: 'python', title: 'an event loop in miniature' },
      py`asyncio's event loop does exactly this, juggling many coroutines and resuming each when the thing it awaits is ready. In new code, use \`async\`/\`await\` for concurrency — never hand-rolled generator coroutines. See [async/await & the event loop](lesson:asyncio-basics) and [tasks, gather & cancellation](lesson:asyncio-in-practice).`,
      py`**Where send() still earns its keep.** Incremental parsers fed chunks of data as they arrive, simulations and state machines, and testing. Even then, consider whether a small class with a method (\`parser.feed(chunk)\`) would be clearer for your team — coroutines are elegant, but less familiar.`,
      py`**Type hints.** Annotate generators as \`Generator[YieldType, SendType, ReturnType]\` from \`collections.abc\` — e.g. \`def till() -> Generator[float, tuple[str, float], None]\`. For plain one-way generators, \`Iterator[float]\` is enough. Since Python 3.13 the send and return types default to \`None\`: \`typing.Generator[float]\` means \`Generator[float, None, None]\`. See [type hints](lesson:type-hints).`,
    ],
  },
  mistakes: [
    {
      title: 'Sending before priming',
      wrong: { code: py`def running_total():
    total = 0
    while True:
        amount = yield total
        total += amount


acc = running_total()
acc.send(10)      # TypeError: can't send non-None value to a just-started generator`, lang: 'python', static: true },
      right: { code: py`def running_total():
    total = 0
    while True:
        amount = yield total
        total += amount


acc = running_total()
next(acc)              # run to the first yield
print(acc.send(10))    # 10`, lang: 'python' },
      explanation: py`A new generator hasn't reached a \`yield\`, so there's nowhere for a sent value to go. Prime it with \`next(gen)\` (or \`gen.send(None)\`). Some codebases wrap coroutines in a small decorator that primes them automatically.`,
    },
    {
      title: 'Yielding after GeneratorExit',
      wrong: { code: py`def stubborn():
    while True:
        try:
            yield "working"
        except GeneratorExit:
            print("not now!")      # and loops back to yield...


s = stubborn()
next(s)
# s.close()  ->  RuntimeError: generator ignored GeneratorExit`, lang: 'python' },
      right: { code: py`def polite():
    try:
        while True:
            yield "working"
    finally:
        print("cleaning up")       # clean up, then let the generator end


p = polite()
next(p)
p.close()                          # cleaning up`, lang: 'python' },
      explanation: py`\`GeneratorExit\` means "stop now". Use \`finally\` (or catch it, clean up and \`return\`), but never \`yield\` again. Also avoid a bare \`except BaseException:\` or \`except:\` around a \`yield\` — it would catch \`GeneratorExit\` by accident.`,
    },
    {
      title: 'Using a for loop where yield from is needed',
      wrong: { code: py`def sub():
    got = yield "ready"
    yield f"sub received {got}"
    return "sub done"


def outer():
    for value in sub():        # send() values never reach sub; the return value is lost
        yield value


o = outer()
next(o)
print(o.send("coffee"))        # sub received None`, lang: 'python' },
      right: { code: py`def sub():
    got = yield "ready"
    yield f"sub received {got}"
    return "sub done"


def outer():
    result = yield from sub()  # forwards send()/throw()/close() and captures the return
    yield result


o = outer()
next(o)
print(o.send("coffee"))        # sub received coffee`, lang: 'python' },
      explanation: py`\`for x in sub: yield x\` only passes values *out*. Values sent *in* go to the outer generator (and are dropped), exceptions thrown in don't reach \`sub\`, and \`sub\`'s return value disappears. For one-way generators the loop is fine; for coroutines use \`yield from\`.`,
    },
    {
      title: '@contextmanager without try/finally',
      wrong: { code: py`from contextlib import contextmanager


@contextmanager
def opened_db():
    print("connect")
    yield "connection"
    print("disconnect")      # skipped if the with body raises!`, lang: 'python' },
      right: { code: py`from contextlib import contextmanager


@contextmanager
def opened_db():
    print("connect")
    try:
        yield "connection"
    finally:
        print("disconnect")  # always runs`, lang: 'python' },
      explanation: py`When the \`with\` body raises, \`@contextmanager\` throws the exception into the generator at the \`yield\`. Without \`try\`/\`finally\`, the teardown line is never reached — a leaked connection, file or lock.`,
    },
    {
      title: 'The deprecated three-argument throw()',
      wrong: { code: py`def worker():
    try:
        yield
    except ValueError as e:
        yield f"handled {e}"


w = worker()
next(w)
w.throw(ValueError, "bad input")   # DeprecationWarning since 3.12`, lang: 'python' },
      right: { code: py`def worker():
    try:
        yield
    except ValueError as e:
        yield f"handled {e}"


w = worker()
next(w)
print(w.throw(ValueError("bad input")))   # handled bad input`, lang: 'python' },
      explanation: py`Pass an exception instance. The \`(type, value, traceback)\` form is deprecated since Python 3.12 and may be removed in a future version.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: can't send non-None value to a just-started generator`,
      cause: py`\`send(value)\` was called before the generator reached its first \`yield\`.`,
      fix: py`Prime it with \`next(gen)\` first (or use a priming decorator).`,
    },
    {
      symptom: py`RuntimeError: generator ignored GeneratorExit`,
      cause: py`On \`close()\` (or garbage collection), the generator caught \`GeneratorExit\` — often via \`except BaseException\` or a bare \`except:\` — and yielded again.`,
      fix: py`Clean up in \`finally\`, or re-raise / \`return\` after catching \`GeneratorExit\`. Never yield after it.`,
    },
    {
      symptom: py`RuntimeError: generator didn't stop`,
      cause: py`An \`@contextmanager\` generator reached a second \`yield\` during exit.`,
      fix: py`Yield exactly once; put any loop *around* the with-statement, not inside the context manager.`,
    },
    {
      symptom: py`RuntimeError: generator didn't yield`,
      cause: py`An \`@contextmanager\` generator finished (or returned early) without ever yielding.`,
      fix: py`Make sure every path through the setup reaches the single \`yield\`; raise an exception instead of returning early.`,
    },
    {
      symptom: py`ValueError: generator already executing`,
      cause: py`A generator tried to resume itself (calling \`next()\`/\`send()\` on its own object from inside its body), or two callers drove the same generator re-entrantly.`,
      fix: py`A generator can't be re-entered while it runs. Restructure so only the caller resumes it.`,
    },
    {
      symptom: py`SyntaxError: 'yield from' inside async function`,
      cause: py`Generator delegation was used inside \`async def\`.`,
      fix: py`In native coroutines use \`await\` for awaitables, and \`async for\` to consume async iterators.`,
    },
  ],
  bestPractices: [
    'Prime coroutines with next(gen) before the first send(), or wrap them in a priming decorator.',
    'Put cleanup in finally blocks; never yield after GeneratorExit, and avoid bare except: around a yield.',
    'Use yield from (not a for loop) when delegating to a generator that receives send() or throw(), or whose return value you need.',
    'Throw exception instances — gen.throw(ValueError("msg")) — not the deprecated three-argument form.',
    '@contextmanager generators must yield exactly once and wrap the yield in try/finally.',
    'Use async/await for concurrency; hand-rolled generator coroutines are for parsers, state machines and teaching.',
    'Annotate with Generator[YieldType, SendType, ReturnType] when a generator receives values or returns one.',
  ],
  useCases: [
    'Writing context managers in a few lines with @contextlib.contextmanager.',
    'Splitting big or recursive generators (tree walks, parsers) into sub-generators with yield from.',
    'Incremental parsers and protocol state machines that receive data chunk by chunk via send().',
    'Running aggregates (averages, totals) that are fed values over time.',
    'Understanding and debugging asyncio: coroutines are resumed with send() and cancelled via throw().',
  ],
  comparison: {
    title: 'Ways to resume a paused generator',
    headers: ['call', 'what the paused yield sees', 'typical use', 'gotcha'],
    rows: [
      ['next(gen)', 'evaluates to None', 'iterating; priming', 'StopIteration when finished'],
      ['gen.send(v)', 'evaluates to v', 'feeding a coroutine', 'must be primed first'],
      ['gen.throw(exc)', 'exc is raised there', 'signalling errors, cancellation', 'unhandled exc propagates out and closes the generator'],
      ['gen.close()', 'GeneratorExit is raised there', 'shutting down, cleanup', 'yielding afterwards raises RuntimeError'],
      ['yield from sub', 'all of the above, forwarded to sub', 'delegation, recursion', 'needs a generator on the other end for send/throw'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'advanced-generators-q1',
      type: 'mcq',
      prompt: 'Why must you call `next(gen)` (or `gen.send(None)`) before the first `gen.send(42)`?',
      options: [
        { text: 'Because send() only works on generators created with yield from', why: 'send() works on any generator; yield from is unrelated.' },
        'Because a new generator hasn\'t reached a yield yet, so there is no paused yield expression to receive 42',
        { text: 'Because next() resets the generator to its first line', why: 'Generators never reset. next() starts a new generator; later it resumes from the last yield.' },
        { text: 'It isn\'t necessary; send() starts the generator automatically', why: 'Sending a non-None value to a just-started generator raises TypeError.' },
      ],
      answer: 1,
      explanation: py`A sent value becomes the result of the \`yield\` expression the generator is paused at. A just-created generator isn't paused at any \`yield\`, so Python raises \`TypeError: can't send non-None value to a just-started generator\`.`,
    },
    {
      id: 'advanced-generators-q2',
      type: 'output',
      prompt: 'Predict the three printed lines.',
      code: py`def echo():
    received = None
    while True:
        received = yield f"got {received}"


e = echo()
print(next(e))
print(e.send("hi"))
print(e.send(42))`,
      answer: py`got None
got hi
got 42`,
      accept: ['got None got hi got 42'],
      explanation: py`\`next(e)\` runs to the first \`yield\`, which hands out \`"got None"\`. Each \`send(x)\` makes the paused \`yield\` evaluate to \`x\`, stores it in \`received\`, loops, and returns the next yielded string.`,
    },
    {
      id: 'advanced-generators-q3',
      type: 'output',
      prompt: 'What does `list(outer())` contain?',
      code: py`def inner():
    yield 1
    yield 2
    return "inner done"


def outer():
    result = yield from inner()
    yield result


print(list(outer()))`,
      options: [
        { text: '[1, 2]', why: 'outer has its own `yield result` after the delegation, so the inner return value is yielded too.' },
        "[1, 2, 'inner done']",
        { text: "['inner done']", why: 'yield from passes the inner values 1 and 2 straight through to the caller first.' },
        { text: "[1, 2, None]", why: 'yield from evaluates to the sub-generator\'s RETURN value, "inner done" — not None.' },
      ],
      answer: 1,
      explanation: py`\`yield from inner()\` passes \`1\` and \`2\` through, then evaluates to \`inner\`'s return value. \`outer\` yields that value, so the list is \`[1, 2, 'inner done']\`.`,
    },
    {
      id: 'advanced-generators-q4',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`def worker():
    try:
        yield "working"
        yield "still working"
    finally:
        print("cleanup")


w = worker()
print(next(w))
w.close()
print("done")`,
      options: [
        { text: 'working / done', why: 'close() raises GeneratorExit at the paused yield, and the finally block runs on the way out.' },
        'working / cleanup / done',
        { text: 'working / still working / cleanup / done', why: 'close() does not resume normal execution; the second yield is never reached.' },
        { text: 'working / then RuntimeError', why: 'The generator lets GeneratorExit end it (it does not yield again), so close() succeeds quietly.' },
      ],
      answer: 1,
      explanation: py`\`close()\` raises \`GeneratorExit\` at the first \`yield\`. Nothing catches it, so the generator unwinds — running \`finally\` (printing \`cleanup\`) — and \`close()\` returns normally. Each "/" is a new line.`,
    },
    {
      id: 'advanced-generators-q5',
      type: 'bug',
      prompt: 'This crashes with `TypeError: can\'t send non-None value to a just-started generator`. Click the line where the fix belongs (the line that is missing a step before it runs).',
      code: py`def running_total():
    total = 0
    while True:
        amount = yield total
        total += amount


acc = running_total()
print(acc.send(10))
print(acc.send(5))`,
      answerLine: 9,
      explanation: py`Line 9 sends a value to a generator that hasn't reached its first \`yield\`. Add \`next(acc)\` just before it to prime the generator; then the sends print \`10\` and \`15\`.`,
    },
    {
      id: 'advanced-generators-q6',
      type: 'fill',
      prompt: 'Complete this context manager so the file is always closed, even if the with body raises.',
      code: py`from contextlib import contextmanager


@___
def opened(path):
    f = open(path)
    try:
        ___ f
    finally:
        f.close()`,
      answer: [['contextmanager'], ['yield']],
      explanation: py`\`@contextmanager\` turns the generator into a context manager; the single \`yield f\` hands the file to the \`as\` target and pauses while the body runs; \`finally\` closes it afterwards — including when an exception is thrown in at the \`yield\`.`,
    },
    {
      id: 'advanced-generators-q7',
      type: 'short',
      prompt: 'In a few sentences: how did generators lead to `async`/`await`?',
      answer: py`Generators could already pause and resume. PEP 342 (Python 2.5) added \`send()\`/\`throw()\`/\`close()\`, turning them into coroutines that could be resumed with values and exceptions; PEP 380 (3.3) added \`yield from\` so coroutines could call other coroutines and get results back. asyncio (3.4) used exactly that: coroutines yielded to an event loop, which resumed them with \`send()\` when their I/O was ready. PEP 492 (3.5) gave this its own syntax and type — \`async def\`/\`await\` — so coroutines are no longer confused with iterators, but underneath an event loop still drives them with \`send()\` and \`throw()\`.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'score-collector',
      title: 'Score collector coroutine',
      difficulty: 'advanced',
      prompt: py`Write a coroutine that collects test scores, and a helper that drives it:

1. \`collector()\` — a generator that, after priming, receives scores via \`send()\`. Each \`yield\` hands out **how many scores have been collected so far** (so priming yields \`0\`, the first \`send(80)\` returns \`1\`, …). Sending \`None\` finishes it: it must **return** a summary dict \`{"count": ..., "average": ..., "best": ...}\`. With no scores, return \`{"count": 0, "average": None, "best": None}\`.
2. \`collect(scores)\` — primes a fresh \`collector()\`, sends every score, sends \`None\`, and returns the summary taken from the \`StopIteration\`.

\`collect([60, 90])\` → \`{"count": 2, "average": 75.0, "best": 90}\`.`,
      files: {
        'main.py': py`def collector():
    scores = []
    while True:
        score = yield len(scores)
        # TODO: stop when score is None, otherwise store it
        scores.append(score)
    # TODO: return the summary dict


def collect(scores):
    # TODO: prime, send every score, then send None and return StopIteration.value
    return {}


print(collect([60, 90]))
`,
      },
      hints: [
        'In collector, check "if score is None: break" before appending; after the loop, build and return the dict.',
        'The return value of a generator travels on StopIteration. In collect, wrap the final gen.send(None) in try/except StopIteration as stop and return stop.value.',
        'Remember to call next(gen) before the first send(). Use max(scores) for best and sum(scores) / len(scores) for average, guarding the empty case.',
      ],
      solution: {
        explanation: py`\`collector\` is a coroutine: its \`yield\` both reports progress (\`len(scores)\`) and receives the next score. Sending \`None\` is a **sentinel** that breaks the loop; the \`return\` statement then ends the generator, and Python attaches the summary to \`StopIteration.value\`. \`collect\` shows the full protocol from the caller's side: prime with \`next()\`, feed with \`send()\`, finish with the sentinel and catch \`StopIteration\` to read the result. (On Python 3.13+, an alternative design is to catch \`GeneratorExit\` and \`return\` the summary, which \`close()\` then hands back.)`,
        files: {
          'main.py': py`def collector():
    scores = []
    while True:
        score = yield len(scores)
        if score is None:
            break
        scores.append(score)
    if not scores:
        return {"count": 0, "average": None, "best": None}
    return {"count": len(scores), "average": sum(scores) / len(scores), "best": max(scores)}


def collect(scores):
    gen = collector()
    next(gen)
    for score in scores:
        gen.send(score)
    try:
        gen.send(None)
    except StopIteration as stop:
        return stop.value
    raise RuntimeError("collector did not finish")


print(collect([60, 90]))
`,
        },
      },
      tests: [
        { name: 'yields the count so far', code: py`c = collector()
assert next(c) == 0
assert c.send(80) == 1 and c.send(90) == 2` },
        { name: 'sending None returns the summary', code: py`c = collector()
next(c)
c.send(80)
c.send(90)
try:
    c.send(None)
except StopIteration as stop:
    summary = stop.value
else:
    raise AssertionError("sending None should finish the generator")
assert summary == {"count": 2, "average": 85.0, "best": 90}` },
        { name: 'collect drives the coroutine', code: py`assert collect([60, 90]) == {"count": 2, "average": 75.0, "best": 90}` },
        { name: 'no scores', code: py`assert collect([]) == {"count": 0, "average": None, "best": None}` },
      ],
    },
    {
      id: 'tree-walk',
      title: 'Walk a folder tree with yield from',
      difficulty: 'advanced',
      prompt: py`A folder tree is a nested dict: a **dict** value is a sub-folder, an **int** value is a file size in bytes:

\`\`\`python
tree = {"src": {"main.py": 120, "utils": {"io.py": 40}}, "README.md": 10}
\`\`\`

1. \`walk(tree, prefix="")\` — a **recursive generator** that yields every file path (\`"src/main.py"\`, \`"src/utils/io.py"\`, \`"README.md"\`, in dict order) and **returns** the total size of all files under it. Use \`yield from\` for sub-folders and add up their return values.
2. \`report(tree)\` — drives \`walk(tree)\` and returns a tuple \`(list_of_paths, total_size)\`: \`report(tree)\` → \`(["src/main.py", "src/utils/io.py", "README.md"], 170)\`.`,
      files: {
        'main.py': py`def walk(tree, prefix=""):
    total = 0
    for name, node in tree.items():
        # TODO: recurse into sub-folders with yield from; add up file sizes
        yield prefix + name
    return total


def report(tree):
    # TODO: drive walk() and capture its return value
    return list(walk(tree)), 0


tree = {"src": {"main.py": 120, "utils": {"io.py": 40}}, "README.md": 10}
print(report(tree))
`,
      },
      hints: [
        'For each entry: if node is a dict, delegate with yield from walk(node, path + "/"); otherwise yield the path and add node to total.',
        'yield from evaluates to the sub-walk\'s return value, so you can write total += yield from walk(node, path + "/").',
        'In report, loop with next() inside try/except StopIteration as stop, appending paths; return (paths, stop.value) when it finishes.',
      ],
      solution: {
        explanation: py`Each call to \`walk\` handles one folder. Files are yielded directly; sub-folders are handed to a recursive \`walk\` with \`yield from\`, which passes every nested path straight through to the caller **and** gives back the sub-folder's total when it finishes — so sizes bubble up through the recursion without any extra bookkeeping. A plain \`for path in walk(...): yield path\` loop would pass the paths along but throw the totals away. \`report\` drives the generator by hand because a \`for\` loop ignores return values; the final \`StopIteration\` carries the grand total.`,
        files: {
          'main.py': py`def walk(tree, prefix=""):
    total = 0
    for name, node in tree.items():
        path = prefix + name
        if isinstance(node, dict):
            total += yield from walk(node, path + "/")
        else:
            yield path
            total += node
    return total


def report(tree):
    paths = []
    gen = walk(tree)
    while True:
        try:
            paths.append(next(gen))
        except StopIteration as stop:
            return paths, stop.value


tree = {"src": {"main.py": 120, "utils": {"io.py": 40}}, "README.md": 10}
print(report(tree))
`,
        },
      },
      tests: [
        { name: 'walk is a generator function', code: py`import inspect
assert inspect.isgeneratorfunction(walk)` },
        { name: 'yields nested file paths in order', code: py`assert list(walk(tree)) == ["src/main.py", "src/utils/io.py", "README.md"]` },
        { name: 'report returns paths and total size', code: py`assert report(tree) == (["src/main.py", "src/utils/io.py", "README.md"], 170)` },
        { name: 'empty folders', code: py`assert report({}) == ([], 0)
assert report({"empty": {}, "a.txt": 5}) == (["a.txt"], 5)` },
        { name: 'uses yield from', code: py`assert "yield from" in files["main.py"], 'Delegate to sub-folders with yield from'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'advanced-generators-send',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does `generator.send(value)` do, how is it different from `next()`, and why must a generator be "primed"?',
      answer: 'send(value) resumes the generator and makes the paused yield expression evaluate to value, then returns the next yielded value. next(gen) is the same as send(None). A new generator isn\'t paused at a yield yet, so the first resume must be next() or send(None); sending another value raises TypeError.',
      explanation: py`\`x = yield y\` is a two-way exchange: \`y\` goes out to the caller; later, the argument of \`send()\` comes back in as \`x\`. That's what makes generators usable as coroutines (PEP 342). Priming runs the body up to the first \`yield\`.`,
      code: { lang: 'python', code: py`def averager():
    total = count = 0
    average = None
    while True:
        value = yield average
        total += value
        count += 1
        average = total / count


a = averager()
next(a)                         # prime
print(a.send(10), a.send(20))   # 10.0 15.0` },
      whyAsked: 'Checks understanding of yield as an expression and the generator protocol beyond simple iteration.',
      mistakes: ['Thinking send() appends to a queue that the generator reads later', 'Forgetting to prime', 'Not knowing that next() is send(None)'],
      followUps: ['What do throw() and close() do?', 'How would you write a decorator that primes coroutines automatically?', 'How does an event loop use send()?'],
      modelAnswer: 'send resumes a paused generator and passes a value in: the yield expression the generator is paused at evaluates to that value, the generator runs to its next yield, and send returns whatever it yields there. next is just send with None. A generator that has just been created has not reached any yield yet, so there is nothing to receive a value; you have to prime it first with next or send(None), otherwise you get a TypeError. This two-way exchange is what turned generators into coroutines, and it is exactly how asyncio\'s event loop resumes coroutines today.',
    },
    {
      id: 'advanced-generators-yield-from-vs-loop',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Is `yield from sub` just shorthand for `for x in sub: yield x`? What exactly is different?',
      answer: 'For simple iteration they yield the same values, but yield from also forwards send() and throw() into sub, closes sub when the outer generator is closed, and evaluates to sub\'s return value (taken from its StopIteration). The for loop drops sent values, doesn\'t forward exceptions and loses the return value.',
      explanation: py`PEP 380 defines \`yield from\` as full transparent delegation: the caller effectively talks directly to the sub-generator until it finishes. That's essential for coroutine pipelines and was the basis of pre-3.5 asyncio. For one-way generators the loop is equivalent, though \`yield from\` is shorter. In CPython, delegation is compiled to dedicated bytecode instructions (\`SEND\`/\`YIELD_VALUE\`) rather than a Python-level \`for\` loop.`,
      code: { lang: 'python', code: py`def sub():
    got = yield "ready"
    yield f"sub received {got}"
    return "sub done"


def with_loop():
    for v in sub():
        yield v


def with_yield_from():
    result = yield from sub()
    yield result


for make in (with_loop, with_yield_from):
    g = make()
    next(g)
    print(make.__name__, "->", g.send("coffee"))
# with_loop -> sub received None
# with_yield_from -> sub received coffee` },
      whyAsked: 'Distinguishes candidates who know PEP 380 semantics from those who think of yield from as syntax sugar.',
      mistakes: ['Saying they are identical', 'Forgetting the return value', 'Not mentioning throw()/close() forwarding'],
      followUps: ['What happens to the outer generator if sub raises?', 'How does await relate to yield from?', 'Can you yield from a list?'],
      modelAnswer: 'For plain iteration they produce the same values, so for a one-way generator the loop is fine. But yield from is full delegation, defined in PEP 380: values sent to the outer generator go straight into the sub-generator, exceptions thrown in with throw are thrown into it, closing the outer generator closes the sub-generator, and when the sub-generator returns, its return value becomes the value of the yield from expression. The for loop does none of that — sent values are swallowed, exceptions don\'t reach the sub-generator, and the return value is lost. That transparency is why yield from was the foundation of asyncio coroutines before await existed.',
    },
    {
      id: 'advanced-generators-ignored-exit',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A long-running generator wraps its body in `try: ... except Exception: log(); continue` and sometimes `except BaseException`. In production you see `RuntimeError: generator ignored GeneratorExit`. Explain and fix.',
      answer: 'close() — called explicitly or when the generator is garbage-collected — raises GeneratorExit at the paused yield. GeneratorExit derives from BaseException, so the broad except BaseException catches it and the loop continues to the next yield, which Python forbids. Catch only the exceptions you mean (Exception), put cleanup in finally, and let GeneratorExit propagate (or return).',
      explanation: py`\`GeneratorExit\` (like \`KeyboardInterrupt\` and \`SystemExit\`) inherits from \`BaseException\`, not \`Exception\`, precisely so that \`except Exception\` doesn't catch it. Catching \`BaseException\` (or a bare \`except:\`) around a \`yield\` breaks shutdown. The error can appear far from the bug — often as an "Exception ignored in: <generator object ...>" message during garbage collection.`,
      whyAsked: 'Tests exception-hierarchy knowledge and generator lifecycle — a subtle real-world bug.',
      mistakes: ['Suggesting to catch RuntimeError', 'Not knowing GeneratorExit is a BaseException', 'Removing all error handling instead of narrowing it'],
      followUps: ['Why is GeneratorExit not an Exception subclass?', 'When does garbage collection close a generator?', 'How would you test the cleanup path?'],
      modelAnswer: 'When a suspended generator is closed — explicitly, or because it is garbage-collected — Python raises GeneratorExit at the paused yield and expects the generator to finish. GeneratorExit derives from BaseException, not Exception, so an except BaseException or bare except around the yield catches it, the loop continues, and the generator yields again; Python then raises RuntimeError: generator ignored GeneratorExit. The fix is to catch only Exception for business errors, put cleanup in a finally block, and let GeneratorExit propagate or return after cleaning up. I would add a test that calls close() on a suspended generator to cover that path.',
    },
    {
      id: 'advanced-generators-async-history',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'How are generators related to `async`/`await`? Why did Python introduce a separate `async def` instead of keeping generator-based coroutines?',
      answer: 'async/await grew out of generators: PEP 342 gave generators send/throw/close (coroutines), PEP 380 added yield from, and asyncio (3.4) built its coroutines on yield from. PEP 492 (3.5) introduced native coroutines so they are a distinct type: you can\'t accidentally iterate one or mix them up with generators, await is only valid on awaitables, async with/async for became possible, and errors are clearer. Under the hood an event loop still drives them with send() and throw().',
      explanation: py`Generator-based coroutines were ambiguous: a function with \`yield from\` might be a coroutine or an iterator, and forgetting \`yield from\` silently did nothing. Native coroutines fix that with a separate type, \`await\` expressions that require an awaitable (an object with \`__await__\` returning an iterator), and new syntax for asynchronous context managers and iterators. The old \`@asyncio.coroutine\` decorator was removed in Python 3.11.`,
      whyAsked: 'A senior question linking language history with how the event loop really works.',
      mistakes: ['Saying async functions run in threads', 'Believing async/await has nothing to do with generators', 'Not knowing why a distinct type was needed'],
      followUps: ['What does an object need to be awaitable?', 'How does asyncio cancel a task?', 'What are asynchronous generators?'],
      modelAnswer: 'async and await are the descendants of generators. PEP 342 turned generators into coroutines by adding send, throw and close; PEP 380 added yield from so coroutines could call each other and return results; and asyncio in 3.4 was built on exactly that, with an event loop resuming generator-coroutines via send. The problem was ambiguity: a generator might be an iterator or a coroutine, and forgetting yield from failed silently. PEP 492 in 3.5 introduced native coroutines with async def and await, a separate type with clear errors and room for async with and async for. Underneath, the event loop still resumes coroutines with send and cancels them with throw, and the old generator-based decorator was removed in 3.11.',
    },
    {
      id: 'advanced-generators-temp-setting',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Using `@contextmanager`, write `temp_setting(settings, key, value)`: inside the `with` block `settings[key]` equals `value`; afterwards the old value is restored — or the key removed if it didn\'t exist — **even if the block raises**. It should yield the settings dict.',
      answer: 'Remember the old value with a sentinel for "missing", set the new value, yield inside try, and restore (or delete) in finally.',
      explanation: py`\`@contextmanager\` runs the code before \`yield\` on entry and the code after it on exit. If the body raises, the exception is thrown in at the \`yield\`, so only a \`finally\` guarantees the restore. A unique sentinel object distinguishes "key was missing" from "key was None".`,
      starter: { files: { 'main.py': py`from contextlib import contextmanager


@contextmanager
def temp_setting(settings, key, value):
    # TODO: remember the old value, set the new one, restore it afterwards (even on errors)
    settings[key] = value
    yield settings


config = {"debug": False}
with temp_setting(config, "debug", True):
    print("inside:", config)
print("after:", config)
` } },
      tests: [
        { name: 'sets the value inside the block', code: py`s = {"debug": False}
with temp_setting(s, "debug", True) as inner:
    assert inner is s and s["debug"] is True` },
        { name: 'restores the old value afterwards', code: py`s = {"debug": False}
with temp_setting(s, "debug", True):
    pass
assert s == {"debug": False}` },
        { name: 'removes a key that did not exist', code: py`s = {}
with temp_setting(s, "theme", "dark"):
    assert s["theme"] == "dark"
assert s == {}` },
        { name: 'restores even when the block raises', code: py`s = {"level": 1}
with raises(ValueError):
    with temp_setting(s, "level", 99):
        raise ValueError("boom")
assert s == {"level": 1}` },
        { name: 'keeps an existing None value', code: py`s = {"proxy": None}
with temp_setting(s, "proxy", "http://p"):
    pass
assert s == {"proxy": None}` },
      ],
      solution: { files: { 'main.py': py`from contextlib import contextmanager

_MISSING = object()


@contextmanager
def temp_setting(settings, key, value):
    old = settings.get(key, _MISSING)
    settings[key] = value
    try:
        yield settings
    finally:
        if old is _MISSING:
            del settings[key]
        else:
            settings[key] = old


config = {"debug": False}
with temp_setting(config, "debug", True):
    print("inside:", config)
print("after:", config)
` } },
      hints: ['Use a unique sentinel object (MISSING = object()) to remember that the key did not exist — None could be a real value.', 'Wrap the yield in try/finally and restore or delete the key in finally.'],
      whyAsked: 'A practical @contextmanager task that tests exception safety and the missing-vs-None edge case.',
      mistakes: ['Restoring after the yield without finally', 'Using None to mean "missing"', 'Yielding more than once'],
      followUps: ['How would you support several keys at once?', 'What does unittest.mock.patch.dict do?', 'How is this implemented without @contextmanager?'],
      modelAnswer: 'I would read the old value with settings.get(key, MISSING), where MISSING is a unique sentinel object, so I can tell a missing key from a key whose value is None. Then I set the new value and yield the dict inside a try block. In the finally block I either delete the key, if it was missing, or put the old value back. The finally matters because if the with body raises, contextmanager throws the exception into the generator at the yield, and only finally guarantees the restore. The standard library has a ready-made version of this for tests: unittest.mock.patch.dict.',
    },
    {
      id: 'advanced-generators-push-pipelines',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Generators give you pull-based pipelines (the consumer asks for data). With send() you can build push-based pipelines (the producer pushes data into coroutines). When would push be useful, and what would you use in a modern codebase?',
      answer: 'Push suits event-driven sources and fan-out: data arrives from outside (a socket, a parser callback) and must be broadcast to several sinks. Coroutines with send() can model that, but they are unfamiliar and error-prone (priming, close handling). Today: plain generator pipelines for pull, simple callback/observer classes or queues for push, and asyncio (async for, asyncio.Queue, TaskGroup) when the pushing involves I/O concurrency.',
      explanation: py`A pull pipeline has one consumer at the end and is naturally lazy. A push pipeline lets one producer feed many consumers (\`broadcast\` → several sinks), which pull pipelines can't do without \`tee\`. Coroutine-based push pipelines were popular before asyncio, but modern code prefers explicit objects or async primitives for clarity, testing and cancellation.`,
      code: { lang: 'python', code: py`def printer(prefix):
    while True:
        item = yield
        print(prefix, item)


def broadcast(targets):
    while True:
        item = yield
        for target in targets:
            target.send(item)


sinks = [printer("A:"), printer("B:")]
for s in sinks:
    next(s)                       # prime every coroutine
hub = broadcast(sinks)
next(hub)
hub.send("order #1")              # A: order #1 / B: order #1` },
      whyAsked: 'Architecture-level judgement: knowing a powerful technique and when not to use it.',
      mistakes: ['Recommending send()-based pipelines for new production systems without caveats', 'Not knowing the difference between push and pull', 'Ignoring cancellation and error handling'],
      followUps: ['How would you add backpressure?', 'How does asyncio.Queue help between producers and consumers?', 'How would you test a push pipeline?'],
      modelAnswer: 'Pull pipelines, built from ordinary generators, work when one consumer drives everything by iterating, which covers most data processing. Push makes sense when data arrives on its own schedule — from a socket or a parser callback — and has to be fanned out to several consumers; generator coroutines with send can model that neatly, with a broadcast coroutine pushing each item into several sinks. In a modern codebase, though, I would usually avoid hand-rolled coroutine pipelines, because priming, close handling and error propagation are easy to get wrong and unfamiliar to many developers. I would use plain generators for pull, small observer or handler classes for synchronous push, and asyncio queues and task groups when the pushing involves concurrent I/O.',
    },
  ],

  takeaways: [
    'yield is an expression: send(v) resumes the generator and makes the paused yield evaluate to v; next(gen) is send(None).',
    'Prime a generator with next() before the first send() — a just-started generator has no yield to receive a value.',
    'throw(exc) raises exc at the paused yield; close() raises GeneratorExit — clean up in finally and never yield afterwards.',
    'result = yield from sub passes values out, forwards send()/throw()/close() in, and evaluates to sub\'s return value.',
    '@contextmanager turns a one-yield generator into a with-statement; wrap the yield in try/finally.',
    'async/await grew out of generator coroutines (PEP 342 → 380 → 492); event loops still drive coroutines with send() and throw().',
  ],
}
