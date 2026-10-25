// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WORKSHOP = py`def countdown(n):
    print("  (countdown starts)")
    while n > 0:
        yield n                 # hand out n, then PAUSE here
        n -= 1                  # ...and resume here on the next next()
    print("  (countdown ends)")
    return "liftoff"            # travels inside StopIteration.value


def ticket_numbers(prefix):
    """Infinite: a fresh ticket every time you ask, forever."""
    number = 1
    while True:
        yield f"{prefix}-{number:03d}"
        number += 1


def read_scores(path):
    """Yield one int per line, skipping blank lines and # comments."""
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            yield int(line)


def running_average(numbers):
    total = count = 0
    for n in numbers:
        total += n
        count += 1
        yield round(total / count, 1)


# 1. calling a generator function runs none of its body
gen = countdown(3)
print("created a", type(gen).__name__)
print(next(gen))
print(next(gen))
print(list(gen))            # drains whatever is left

# 2. a return value rides along on StopIteration
short = countdown(1)
next(short)
try:
    next(short)
except StopIteration as stop:
    print("return value:", stop.value)

# 3. an infinite generator is fine: it only works when asked
tickets = ticket_numbers("A")
print(next(tickets), next(tickets), next(tickets))

# 4. generators feed generators: file -> scores -> running averages
for average in running_average(read_scores("scores.txt")):
    print("running average:", average)
`

const SCORES = py`# Monday
72
85

# Tuesday
90
64
`

export default {
  id: 'generators',
  title: 'Generators & yield',
  summary: 'A function containing yield becomes a generator: calling it returns a pausable iterator that produces values one at a time, only when asked.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['iterators', 'defining-functions'],
  related: ['lazy-evaluation', 'itertools', 'advanced-generators', 'comprehensions', 'closures', 'reading-writing-files', 'container-protocols', 'recursion'],
  tags: ['generator', 'yield', 'generator function', 'generator object', 'lazy', 'pause', 'resume', 'StopIteration', 'infinite generator', 'PEP 255', 'PEP 479', 'getgeneratorstate'],
  apis: [
    { name: 'yield value', summary: 'Hands value to whoever called next() and pauses the generator right there, keeping all local variables.' },
    { name: 'generator function', summary: 'Any def containing yield. Calling it returns a generator object without running the body.' },
    { name: 'next(generator)', summary: 'Runs the generator until its next yield and returns the yielded value; raises StopIteration when the function ends.' },
    { name: 'return value (in a generator)', summary: 'Ends the generator; the value is attached to StopIteration.value (for loops ignore it).' },
    { name: 'inspect.getgeneratorstate(gen)', summary: "Returns 'GEN_CREATED', 'GEN_RUNNING', 'GEN_SUSPENDED' or 'GEN_CLOSED'." },
    { name: 'inspect.isgeneratorfunction(f)', summary: 'True if calling f creates a generator.' },
  ],
  docs: [
    { label: 'Tutorial — generators', url: 'https://docs.python.org/3/tutorial/classes.html#generators' },
    { label: 'Language reference — yield expressions', url: 'https://docs.python.org/3/reference/expressions.html#yield-expressions' },
    { label: 'Glossary — generator', url: 'https://docs.python.org/3/glossary.html#term-generator' },
    { label: 'Functional programming HOWTO — generators', url: 'https://docs.python.org/3/howto/functional.html#generators' },
    { label: 'PEP 255 — simple generators', url: 'https://peps.python.org/pep-0255/' },
    { label: 'PEP 479 — StopIteration handling inside generators', url: 'https://peps.python.org/pep-0479/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [iterators](lesson:iterators) you built an iterator by hand: a class, an \`__init__\` to store the position, an \`__iter__\` returning \`self\`, a \`__next__\` that updates state and raises \`StopIteration\`. It works, but it's a lot of ceremony for "produce some values one at a time".`,
    py`A **generator function** does the same job with an ordinary \`def\`. Put the keyword **\`yield\`** anywhere in a function and it changes completely:`,
    { code: py`def countdown(n):
    while n > 0:
        yield n        # hand out n and PAUSE
        n -= 1


for number in countdown(3):
    print(number)      # 3, 2, 1`, lang: 'python', title: 'the whole iterator, in four lines' },
    py`- Calling \`countdown(3)\` doesn't run the body. It returns a **generator object** — an iterator that's ready to start.
- Each \`next()\` (which the \`for\` loop calls for you) runs the body **until the next \`yield\`**, hands that value out, and **pauses** — local variables, the current line, everything is kept.
- The next \`next()\` resumes right after the \`yield\`. When the function finishes, the generator raises \`StopIteration\` automatically.`,
    py`That pause-and-resume ability is what makes generators the engine behind [lazy pipelines](lesson:lazy-evaluation), [itertools](lesson:itertools), \`@contextmanager\` and, historically, [async/await](lesson:asyncio-basics).`,
  ],
  why: [
    py`**Less code, fewer bugs.** No class, no manual state, no forgetting to raise \`StopIteration\`. The local variables *are* the state, and the function's own control flow (\`while\`, \`for\`, \`if\`) *is* the logic.`,
    py`**Memory stays flat.** A function that returns a list must build every item before you see the first one. A generator hands out one item at a time, so processing a 10 GB log file needs memory for one line, not ten gigabytes.`,
    py`**Results start immediately.** The consumer can start working on the first item while later items haven't been computed yet — and can stop early without paying for the rest.`,
    py`**Infinite sequences become possible.** "Every ticket number", "every Fibonacci number", "keep polling the sensor" are perfectly fine as generators — the consumer decides when to stop.`,
  ],
  eli15: [
    py`A normal function is like a vending machine that, when you press the button, dumps **all** its snacks on the floor at once. A generator is a vending machine that gives you **one** snack each time you press the button, and then waits.`,
    py`\`yield\` is the moment the machine hands you a snack and freezes, remembering exactly where it was. Press the button again (\`next()\`) and it carries on from that exact spot to the next snack. When it's empty, it says "sold out" (\`StopIteration\`) and that's the end.`,
    py`Because it only makes snacks when you ask, it can even be a machine with an **endless** supply — you just stop pressing when you've had enough.`,
  ],
  analogy: {
    title: 'The bookmark-keeping storyteller',
    body: [
      py`Imagine a storyteller who reads you a bedtime story **one chapter per night**. At the end of each chapter they put a bookmark in, close the book and go to sleep. The next night they open at the bookmark — same characters, same place in the plot — and read the next chapter.`,
      py`They never read the whole book in one go, and if you lose interest after chapter 3, chapters 4–20 are never read at all. When the book ends, they tell you "the end", and that copy of the story is finished — to hear it again, someone has to start a new reading.`,
    ],
    mapping: [
      ['the storybook (the instructions)', 'the generator function: def countdown(n): …'],
      ['starting a new reading', 'calling it: gen = countdown(3) — nothing is read yet'],
      ['"next chapter, please"', 'next(gen) — runs until the next yield'],
      ['reading one chapter and stopping', 'yield value — hand it out and pause'],
      ['the bookmark', 'the saved state: local variables and the paused line'],
      ['"the end"', 'StopIteration, raised automatically when the function finishes'],
      ['a finished reading', 'an exhausted generator — create a new one to start over'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a generator pause and resume',
    props: {
      code: py`def countdown(start):
    print("  [countdown starts]")
    n = start
    while n > 0:
        yield n
        n -= 1
    print("  [countdown ends]")


gen = countdown(2)
print("created, nothing ran yet")
print("got", next(gen))
print("got", next(gen))
for leftover in gen:
    print("never printed")
print("gen is finished")
`,
      notes: {
        10: 'Calling `countdown(2)` creates a **generator object** in state *created*. Look: the body has not run — no "[countdown starts]" in the output yet.',
        12: 'The first `next()` starts the body from line 1. Watch it run until `yield n` hands out `2`…',
        5: '`yield` gives the value to the caller and **suspends** the generator. Its frame — `n`, `start` and this exact line — is kept inside the generator object.',
        13: 'The second `next()` resumes right *after* the yield (line 6), not from the top. `n` still exists and becomes 1.',
        14: 'The `for` loop calls `next()` again: the generator resumes, the `while` ends, the function falls off the end → `StopIteration`, which quietly ends the loop.',
        16: 'The generator is now *closed*. Any further `next()` raises `StopIteration` immediately.',
      },
    },
    alt: 'A step-by-step trace. After gen = countdown(2), the heap shows a generator object in state created and no output. The first next(gen) runs lines 1 to 5, prints [countdown starts], yields 2 and the generator becomes suspended at line 5 with n = 2. The second next resumes at line 6, sets n to 1 and yields 1. The for loop resumes it once more; n becomes 0, the loop ends, [countdown ends] is printed, and the generator becomes closed, so the loop body never runs.',
    caption: py`Step with ▶ and watch the generator object on the right: **created → running → suspended (at line 5) → running → … → closed**. Each \`next()\` adds a generator frame to the stack; each \`yield\` removes it while the generator keeps its variables.`,
  },
  syntax: [
    py`#### A generator function`,
    { code: py`def read_numbers(text):
    for part in text.split(","):
        part = part.strip()
        if part:                 # skip empty pieces
            yield int(part)      # one value per next()


gen = read_numbers("4, 8,, 15")
print(next(gen))     # 4
print(list(gen))     # [8, 15] — the rest`, lang: 'python', title: 'yield inside ordinary control flow' },
    py`- **Any** \`yield\` in the body makes the whole \`def\` a generator function — decided when Python compiles it, not when it runs.
- \`yield\` can appear many times, inside loops, \`if\`s, \`try\` blocks and \`with\` blocks.
- A generator object is an **iterator**: it has \`__iter__\` (returning itself) and \`__next__\`. Everything from [iterators](lesson:iterators) applies.`,
    py`#### Ending a generator`,
    { code: py`def first_words(lines, limit):
    for count, line in enumerate(lines, start=1):
        if count > limit:
            return                # stop early: the generator is finished
        yield line.split()[0]
    # falling off the end also finishes it


print(list(first_words(["hi there", "bye now", "see you"], 2)))   # ['hi', 'bye']`, lang: 'python', title: 'return ends iteration' },
    py`\`return\` inside a generator means "no more values". If you write \`return something\`, that value doesn't come out of the loop — it's attached to the \`StopIteration\` exception as \`.value\`, which \`for\` loops and \`list()\` ignore. It's mainly used with \`yield from\` — see [advanced generators](lesson:advanced-generators).`,
    { code: py`def countdown(n):
    while n > 0:
        yield n
        n -= 1
    return "liftoff"


gen = countdown(1)
print(next(gen))            # 1
try:
    next(gen)
except StopIteration as stop:
    print(stop.value)       # liftoff`, lang: 'python', title: 'the return value travels on StopIteration' },
    py`#### Infinite generators`,
    { code: py`def ticket_numbers(prefix):
    number = 1
    while True:                      # never ends on its own...
        yield f"{prefix}-{number:03d}"
        number += 1


tickets = ticket_numbers("A")
print(next(tickets), next(tickets))  # A-001 A-002 — ...the caller decides when to stop`, lang: 'python', title: 'while True + yield is safe' },
    { callout: 'warn', title: 'Never call list() on an infinite generator', text: py`\`list(ticket_numbers("A"))\` tries to collect *every* ticket and never finishes — the program hangs until it runs out of memory. Take a fixed number with \`next()\`, a \`for\` loop with \`break\`, \`zip()\` with a finite iterable, or \`itertools.islice\` (see [itertools](lesson:itertools)).` },
    py`#### Generators as \`__iter__\``,
    py`Remember the rule that a collection's \`__iter__\` must return a **fresh** iterator? A generator method does that for free — every call creates a new generator object:`,
    { code: py`class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    def __iter__(self):              # a generator method
        for song in self.songs:
            yield song


mix = Playlist(["Lo-fi", "Jazz"])
print(list(mix), list(mix))          # both full: each loop gets its own generator`, lang: 'python', title: 'the easiest way to make a class iterable' },
    { callout: 'tip', title: 'Generator expressions', text: py`For simple cases there's an even shorter form: \`(n * n for n in numbers)\` — a comprehension in round brackets that creates a generator. It has its own lesson: [generator expressions & lazy pipelines](lesson:lazy-evaluation).` },
  ],
  walkthrough: {
    title: 'Reading the generator workshop line by line',
    lang: 'python',
    code: WORKSHOP,
    intro: py`This is the program in the playground below (it also reads \`scores.txt\`). Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [37, 38], text: py`\`countdown(3)\` returns a generator object and runs **nothing** — notice that \`(countdown starts)\` is *not* printed before \`created a generator\`.` },
      { lines: [39, 39], text: py`The first \`next(gen)\` starts the body: it prints \`(countdown starts)\`, enters the loop and pauses at \`yield n\`, handing out \`3\`.` },
      { lines: [40, 40], text: py`The second \`next\` resumes on line 5 (\`n -= 1\`), loops back and pauses at the \`yield\` again with \`2\`.` },
      { lines: [41, 41], text: py`\`list(gen)\` keeps calling \`next()\`: it gets \`1\`, then the loop ends, \`(countdown ends)\` is printed, the function returns and \`StopIteration\` tells \`list()\` it's done: \`[1]\`. The return value \`"liftoff"\` is silently ignored by \`list()\`.` },
      { lines: [44, 49], text: py`A fresh generator. After its only value, the next \`next()\` makes the function return, raising \`StopIteration\` — we catch it ourselves and read the return value from \`stop.value\`.` },
      { lines: [10, 15], text: py`\`while True\` with a \`yield\` inside is an **infinite generator**. It's safe because nothing runs until someone asks, and the caller asks only three times (line 53).` },
      { lines: [18, 25], text: py`\`read_scores\` opens the file and yields one number per useful line. The file stays open only while the generator is being consumed; the \`with\` block closes it when the generator finishes.` },
      { lines: [28, 33], text: py`\`running_average\` consumes *any* iterable of numbers and yields a new average after each one. It doesn't know or care that its input is another generator.` },
      { lines: [56, 57], text: py`Generators chained together: the \`for\` loop asks \`running_average\` for a value, which asks \`read_scores\` for one number, which reads just enough of the file to find it. Only one score is "in flight" at a time.` },
    ],
  },
  playground: {
    title: 'Generator workshop',
    objective: 'Run it and match every line of output — especially the order of the (countdown …) messages — to the next() call that caused it.',
    files: { 'main.py': WORKSHOP, 'scores.txt': SCORES },
    expected: py`\`\`\`text
created a generator
  (countdown starts)
3
2
  (countdown ends)
[1]
  (countdown starts)
  (countdown ends)
return value: liftoff
A-001 A-002 A-003
running average: 72.0
running average: 78.5
running average: 82.3
running average: 77.8
\`\`\`

The \`(countdown starts)\` line appears only *after* \`created a generator\`: the body runs on the first \`next()\`, not on the call.`,
    experiments: [
      {
        id: 'evens',
        task: py`Write a generator function \`evens(limit)\` that yields the even numbers from \`0\` up to (but not including) \`limit\`. Print \`list(evens(10))\`.`,
        hint: py`Loop with \`for n in range(limit):\` and \`yield n\` only when \`n % 2 == 0\`. (A step of 2 in \`range\` also works.)`,
        tests: [
          { name: 'evens is a generator function', code: py`import inspect
assert inspect.isgeneratorfunction(ns.get('evens')), 'Define evens() with yield inside'` },
          { name: 'evens(10) yields 0, 2, 4, 6, 8', code: py`assert list(evens(10)) == [0, 2, 4, 6, 8]` },
          { name: 'evens(1) yields only 0', code: py`assert list(evens(1)) == [0]` },
        ],
        explain: py`Because \`evens\` contains \`yield\`, calling it returns a generator; \`list()\` drives it to the end. Try \`g = evens(10)\` and a few \`next(g)\` calls to see it pause between values.`,
      },
      {
        id: 'ticket-start',
        task: py`Add an optional \`start\` parameter (default \`1\`) to \`ticket_numbers\`, so \`ticket_numbers("C", start=42)\` begins at \`C-042\`.`,
        hint: py`Replace \`number = 1\` with \`number = start\` and add \`start=1\` to the parameters.`,
        tests: [
          { name: 'starts at 42 when asked', code: py`t = ticket_numbers("C", start=42)
assert next(t) == "C-042" and next(t) == "C-043"` },
          { name: 'still starts at 1 by default', code: py`assert next(ticket_numbers("A")) == "A-001"` },
        ],
        explain: py`Generator functions take arguments like any function. The arguments become local variables of the paused frame, so each generator object remembers its own \`prefix\` and \`number\`.`,
      },
      {
        id: 'skip-bad',
        task: py`Add a line \`n/a\` to \`scores.txt\` and run: the program crashes with \`ValueError\`. Change \`read_scores\` so that lines which aren't whole numbers are **skipped** instead.`,
        hint: py`Wrap \`int(line)\` in \`try\`/\`except ValueError: continue\`, and yield the number in an \`else:\` block (or after the \`try\`).`,
        tests: [
          { name: 'non-numeric lines are skipped', code: py`with open("check_scores.txt", "w") as f:
    f.write("10\nn/a\n# note\n\n20\nabc\n")
assert list(read_scores("check_scores.txt")) == [10, 20]` },
        ],
        explain: py`The error happened lazily: the crash came from deep inside the \`for average in ...\` loop, at the moment the bad line was reached — not when \`read_scores()\` was called. With the \`try\`/\`except\`, the generator simply moves on to the next line. Note that handling bad input inside the generator keeps the consumers simple.`,
      },
      {
        id: 'reuse',
        task: py`At the end, add \`averages = running_average(read_scores("scores.txt"))\`, then \`print(max(averages))\` **twice**. Predict both results first.`,
        hint: py`What state is \`averages\` in after the first \`max()\`?`,
        explain: py`The first \`max()\` drains the generator and prints \`82.3\`. The second gets an already-exhausted generator: \`ValueError: max() iterable argument is empty\`. Generators are single-use — call \`running_average(...)\` again for a fresh one, or store \`list(averages)\` if you need the values twice.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The conversation between a caller and a generator',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'caller', label: 'caller', note: 'for loop / next()', x: 130, y: 160, tone: 'yellow' },
        { id: 'genobj', label: 'generator object', note: 'state: created', x: 400, y: 70, tone: 'blue' },
        { id: 'frame', label: 'paused frame', note: 'locals + current line', x: 400, y: 250, tone: 'kraft' },
        { id: 'stop', label: 'StopIteration', note: 'function finished', x: 650, y: 160, tone: 'red' },
      ],
      edges: [
        { id: 'create', from: 'caller', to: 'genobj', label: 'countdown(2)' },
        { id: 'next', from: 'caller', to: 'frame', label: 'next()' },
        { id: 'yield', from: 'frame', to: 'caller', label: 'yield 2', dashed: true },
        { id: 'keep', from: 'genobj', to: 'frame', label: 'keeps' },
        { id: 'end', from: 'frame', to: 'stop', label: 'falls off the end' },
      ],
      steps: [
        { focus: ['caller', 'genobj'], edges: ['create'], text: py`Calling \`countdown(2)\` builds a **generator object** holding the arguments and a frame that hasn't started. State: *GEN_CREATED*. No line of the body has run.` },
        { focus: ['caller', 'frame'], edges: ['next'], text: py`\`next(gen)\` **resumes** the frame. The first time, it starts at the top of the function. State: *GEN_RUNNING*.` },
        { focus: ['frame', 'caller'], edges: ['yield'], text: py`At \`yield 2\`, the value goes back to the caller and the frame **freezes** — local variables and the exact position are kept. State: *GEN_SUSPENDED*.` },
        { focus: ['genobj', 'frame'], edges: ['keep'], text: py`Between calls the generator object holds on to that paused frame. Nothing runs in the background; it simply waits to be resumed.` },
        { focus: ['frame', 'stop'], edges: ['end'], text: py`Eventually the function returns (or falls off the end). The generator raises \`StopIteration\` (carrying any return value) and becomes *GEN_CLOSED* forever.` },
      ],
    },
    alt: 'A diagram of the caller and a generator. Calling the function creates a generator object in state created. next() resumes its paused frame; yield sends a value back to the caller and suspends the frame, which the generator object keeps between calls. When the function finishes, StopIteration is raised and the generator is closed.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A generator has four possible states, and you can ask for them with \`inspect.getgeneratorstate()\`:`,
      { code: py`import inspect


def countdown(n):
    while n > 0:
        yield n
        n -= 1


gen = countdown(1)
print(inspect.getgeneratorstate(gen))   # GEN_CREATED: made, not started
next(gen)
print(inspect.getgeneratorstate(gen))   # GEN_SUSPENDED: paused at a yield
next(gen, None)
print(inspect.getgeneratorstate(gen))   # GEN_CLOSED: finished, can't restart`, lang: 'python', title: 'created → suspended → closed' },
      py`(\`GEN_RUNNING\` only appears if you check from *inside* the generator while it runs.) A closed generator can never run again. That's why generators are **single-use**: to go round again, call the generator function again.`,
    ],
    technical: [
      py`**Compile time decides.** The compiler marks any function containing \`yield\` as a generator function (\`inspect.isgeneratorfunction(f)\` reveals it). Even an unreachable \`if False: yield\` turns the function into a generator. That's also why a generator function cannot \`return\` a list for its caller to use — its return value only ever reaches \`StopIteration.value\`.`,
      py`**The frame outlives the call.** A normal function's frame (its local variables and position) is thrown away when it returns. A generator's frame is kept alive inside the generator object between \`next()\` calls; \`yield\` saves the position, \`next()\` resumes from it. Local variables are never re-initialised.`,
      py`**Exceptions travel normally.** An exception raised inside a generator propagates out of the \`next()\` call that resumed it, and the generator becomes closed. Exceptions are raised *lazily* — at consumption time, not when the generator was created — so the traceback points into the generator body from inside the consumer's loop.`,
      py`**PEP 479 (Python 3.7+).** If a \`StopIteration\` escapes from *inside* a generator's body (typically from a bare \`next(it)\` on an exhausted iterator), Python converts it to \`RuntimeError: generator raised StopIteration\`. Before this rule, the stray exception silently ended the generator — and hid bugs. Use \`next(it, default)\` or catch it and \`return\`.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython stores the suspended frame's data — local variables, the evaluation stack and the index of the next bytecode instruction — inside the generator object itself, so resuming a generator doesn't allocate a new frame. \`gen.gi_frame\` exposes the frame while the generator is alive (\`None\` once closed), \`gen.gi_code\` its code object, and \`gen.gi_running\` whether it's executing. These attributes and the memory layout are CPython implementation details that have changed between versions.` },
    ],
    production: [
      py`**Stream, don't load.** Generators are the idiomatic way to process data bigger than memory: read records, filter them, transform them and write them out, one at a time. Composing small generator functions keeps each step simple and testable — the subject of [lazy pipelines](lesson:lazy-evaluation).`,
      py`**Validate arguments eagerly.** Because the body only runs on the first \`next()\`, a generator that checks its arguments reports bad input late and far from the call site. A common pattern is an ordinary function that validates and then returns an inner generator:`,
      { code: py`def batches(items, size):
    if size < 1:
        raise ValueError("size must be at least 1")   # raised at call time

    def generate():
        batch = []
        for item in items:
            batch.append(item)
            if len(batch) == size:
                yield batch
                batch = []
        if batch:
            yield batch

    return generate()


print(list(batches(range(5), 2)))   # [[0, 1], [2, 3], [4]]`, lang: 'python', title: 'eager validation, lazy work' },
      py`**Resource lifetime.** A generator suspended inside a \`with open(...)\` block keeps the file open until the generator finishes, is closed with \`gen.close()\`, or is garbage-collected. CPython usually cleans up as soon as the last reference disappears; other implementations may wait for the garbage collector. If a consumer may stop early, close the generator explicitly — see [advanced generators](lesson:advanced-generators) and [contextlib](lesson:contextlib).`,
      py`**Know when a list is better.** If you need \`len()\`, indexing, several passes, or the data is small and you'll use all of it anyway, a list is simpler and often faster. Generators shine for large, single-pass, or possibly-infinite data, and for "stop early" searches.`,
    ],
  },
  mistakes: [
    {
      title: 'Expecting the body to run when you call the function',
      wrong: { code: py`def load_users(path):
    print("loading", path)
    with open(path) as f:
        for line in f:
            yield line.strip()


users = load_users("users.txt")   # prints nothing, opens nothing — no error even if the file is missing`, lang: 'python' },
      right: { code: py`def load_users(path):
    with open(path) as f:
        for line in f:
            yield line.strip()


with open("users.txt", "w") as f:
    f.write("ada\nben\n")
for user in load_users("users.txt"):   # the body runs here, as the loop asks
    print(user)`, lang: 'python' },
      explanation: py`Calling a generator function only creates the generator. Prints, file opens and errors all happen when someone iterates. If you need an immediate check (does the file exist? is the argument valid?), do it in a normal wrapper function before returning the generator.`,
    },
    {
      title: 'Using return when you meant yield',
      wrong: { code: py`def evens(numbers):
    for n in numbers:
        if n % 2 == 0:
            return n          # returns the first even number and stops


print(evens([1, 2, 3, 4]))    # 2 — and list(evens(...)) raises TypeError`, lang: 'python' },
      right: { code: py`def evens(numbers):
    for n in numbers:
        if n % 2 == 0:
            yield n


print(list(evens([1, 2, 3, 4])))   # [2, 4]`, lang: 'python' },
      explanation: py`\`return\` ends a function immediately, once. \`yield\` hands out a value and *continues* next time. Without a single \`yield\`, the function isn't a generator at all.`,
    },
    {
      title: 'Looping over the same generator twice',
      wrong: { code: py`def squares(n):
    for i in range(n):
        yield i * i


s = squares(4)
print(sum(s), max(s, default=None))   # 14 None — max saw nothing`, lang: 'python' },
      right: { code: py`def squares(n):
    for i in range(n):
        yield i * i


s = list(squares(4))        # keep the values if you need them twice
print(sum(s), max(s))       # 14 9`, lang: 'python' },
      explanation: py`A generator is an iterator: once it has been consumed it's closed. Store the results in a list, or call the generator function again to get a new generator.`,
    },
    {
      title: 'Treating a generator like a list',
      wrong: { code: py`def squares(n):
    for i in range(n):
        yield i * i


s = squares(5)
print(len(s))     # TypeError: object of type 'generator' has no len()
print(s[0])       # TypeError: 'generator' object is not subscriptable`, lang: 'python', static: true },
      right: { code: py`def squares(n):
    for i in range(n):
        yield i * i


s = squares(5)
print(next(s))              # the first value: 0
print(sum(1 for _ in s))    # count the remaining 4 by consuming them`, lang: 'python' },
      explanation: py`A generator doesn't know how many items it will produce, and it can't jump to item 3 without producing items 0–2. Use \`next()\` for the next item, \`itertools.islice\` to skip, or \`list()\` if you truly need random access.`,
    },
    {
      title: 'Returning a generator expression from inside a with block',
      wrong: { code: py`def load(path):
    with open(path) as f:
        return (line.strip() for line in f)   # the file closes as we return!


with open("names.txt", "w") as out:
    out.write("ada\nben\n")
# list(load("names.txt"))  -> ValueError: I/O operation on closed file.`, lang: 'python' },
      right: { code: py`def load(path):
    with open(path) as f:
        for line in f:          # the generator *function* keeps the file open
            yield line.strip()  # while it is being consumed


with open("names.txt", "w") as out:
    out.write("ada\nben\n")
print(list(load("names.txt")))   # ['ada', 'ben']`, lang: 'python' },
      explanation: py`\`return\` leaves the \`with\` block, which closes the file before anyone iterates the generator expression. Making \`load\` itself a generator function moves the \`with\` block *inside* the paused frame, so the file stays open exactly as long as it's needed.`,
    },
  ],
  debugging: [
    {
      symptom: py`<generator object read_scores at 0x7f3a2c1b9d80>`,
      cause: py`You printed (or stored) the generator object itself instead of its values.`,
      fix: py`Iterate it (\`for x in gen\`), or convert it for display: \`print(list(gen))\` — only for finite generators.`,
    },
    {
      symptom: py`TypeError: object of type 'generator' has no len()`,
      cause: py`\`len()\` was called on a generator; generators don't know their length in advance.`,
      fix: py`Use \`list()\` first if the data is small, count while consuming (\`sum(1 for _ in gen)\`), or redesign to not need the count.`,
    },
    {
      symptom: py`RuntimeError: generator raised StopIteration`,
      cause: py`A bare \`next(it)\` inside a generator hit an exhausted iterator. Since Python 3.7 (PEP 479) that \`StopIteration\` is turned into a \`RuntimeError\` instead of silently ending the generator.`,
      fix: py`Use \`next(it, None)\` and \`return\` when you get the default, or wrap the call in \`try/except StopIteration: return\`.`,
    },
    {
      symptom: py`ValueError: I/O operation on closed file.`,
      cause: py`A generator *expression* (or a \`map\`/\`filter\`) over a file was returned from inside a \`with\` block; the file was closed before anyone iterated.`,
      fix: py`Turn the function into a generator function with \`yield\` inside the \`with\` block, or read the data eagerly (\`return [line for line in f]\`).`,
    },
    {
      symptom: py`ValueError: max() iterable argument is empty (on data that clearly isn't empty)`,
      cause: py`The generator had already been consumed by an earlier loop, \`sum()\`, \`list()\` or \`in\` check.`,
      fix: py`Create a fresh generator for each pass, or materialise once with \`list()\`.`,
    },
    {
      symptom: py`The program hangs (or memory keeps climbing) at list(...) or sorted(...)`,
      cause: py`An infinite generator was passed to something that consumes everything: \`list()\`, \`sorted()\`, \`sum()\`, \`max()\`, \`len(list(...))\`.`,
      fix: py`Limit it first: \`itertools.islice(gen, 10)\`, \`zip(gen, range(10))\`, or a \`for\` loop with \`break\`.`,
    },
  ],
  bestPractices: [
    'Reach for a generator function whenever a function would build a list only to have the caller loop over it once.',
    'Keep generators focused: one generator reads, another filters, another transforms — then chain them.',
    'Validate arguments in a regular wrapper function so errors surface at call time, not on the first next().',
    'Use next(it, default) inside generators instead of a bare next(it) that might leak StopIteration.',
    'Name generator functions after what they produce (read_rows, ticket_numbers), not after "get".',
    'Implement a collection\'s __iter__ as a generator method to get a fresh iterator on every loop.',
    'Don\'t rely on a generator\'s return value unless you are using yield from; for loops ignore it.',
  ],
  useCases: [
    'Reading large files, CSV rows or log lines one at a time.',
    'Producing endless sequences on demand: IDs, ticket numbers, retry delays, simulation ticks.',
    'Paging through an API or database cursor, fetching the next page only when needed.',
    'Making custom classes iterable with a generator __iter__.',
    'Splitting a processing job into small, chainable stages.',
  ],
  whenToUse: {
    use: [
      'The data is large, unbounded or expensive to compute and you consume it once, in order.',
      'The consumer may stop early (searching for the first match).',
      'You want to start producing results before all the input has arrived.',
    ],
    avoid: [
      'You need len(), indexing, slicing or several passes — return a list.',
      'The result is small and used immediately; a list is simpler to debug and print.',
      'Errors must be raised at call time and you forgot the eager-validation wrapper.',
    ],
  },
  comparison: {
    title: 'Returning a list vs yielding values',
    headers: ['', 'def ... return [...]', 'def ... yield ...'],
    rows: [
      ['when the body runs', 'immediately, all of it, at the call', 'bit by bit, on each next()'],
      ['memory', 'holds every item at once', 'holds one item (plus the paused frame)'],
      ['first result available', 'after the whole list is built', 'as soon as the first yield runs'],
      ['len(), indexing, slicing', 'yes', 'no'],
      ['loop over it twice', 'yes', 'no — single-use'],
      ['infinite sequences', 'impossible', 'natural'],
      ['errors raised', 'at call time', 'at consumption time'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'generators-q1',
      type: 'mcq',
      prompt: 'What happens when you call a function whose body contains `yield`?',
      options: [
        { text: 'The body runs until the first yield and returns that value.', why: 'Nothing in the body runs at call time. The first next() runs it up to the first yield.' },
        'A generator object is returned; none of the body has run yet.',
        { text: 'The body runs completely and returns a list of all yielded values.', why: 'That is what a list-building function does. A generator produces values lazily, one per next().' },
        { text: 'Python raises a SyntaxError unless you use the function in a for loop.', why: 'Generator functions can be called anywhere; you just get a generator object back.' },
      ],
      answer: 1,
      explanation: py`The presence of \`yield\` makes it a generator function. Calling it creates a generator object in state \`GEN_CREATED\`; the body starts on the first \`next()\`.`,
    },
    {
      id: 'generators-q2',
      type: 'output',
      prompt: 'Predict the full output, line by line.',
      code: py`def steps():
    print("A")
    yield 1
    print("B")
    yield 2
    print("C")


g = steps()
print("start")
print(next(g))
print(next(g))`,
      answer: py`start
A
1
B
2`,
      accept: ['start A 1 B 2'],
      explanation: py`Creating \`g\` prints nothing. Each \`next()\` runs up to the next \`yield\`: the first prints \`A\` then returns \`1\`; the second resumes, prints \`B\`, returns \`2\`. \`C\` is never printed because nobody asked for a third value.`,
    },
    {
      id: 'generators-q3',
      type: 'output',
      prompt: 'What is printed?',
      code: py`def squares(n):
    for i in range(n):
        yield i * i


s = squares(4)
print(sum(s), sum(s))`,
      options: [
        { text: '14 14', why: 's is one generator object; the first sum() consumes it entirely.' },
        '14 0',
        { text: '30 30', why: '0 + 1 + 4 + 9 = 14 (range(4) stops at 3).' },
        { text: 'TypeError', why: 'sum() accepts any iterable of numbers, including generators.' },
      ],
      answer: 1,
      explanation: py`The first \`sum()\` drains the generator: 0 + 1 + 4 + 9 = 14. The second gets an exhausted generator and returns the start value \`0\`.`,
    },
    {
      id: 'generators-q4',
      type: 'output',
      prompt: 'What does `list(g())` evaluate to?',
      code: py`def g():
    yield 1
    yield 2
    return 3


print(list(g()))`,
      options: [
        { text: '[1, 2, 3]', why: 'A generator\'s return value is not yielded; it is attached to StopIteration.value and list() ignores it.' },
        '[1, 2]',
        { text: '3', why: 'list() collects yielded values; the return value never becomes the result of list().' },
        { text: 'SyntaxError: return with value in generator', why: 'That was an error in Python 2. In Python 3, return value is allowed in generators.' },
      ],
      answer: 1,
      explanation: py`\`return 3\` ends the generator and stores \`3\` on the \`StopIteration\` it raises. \`list()\` treats that exception as "done" and discards the value. You'd see it with \`yield from\` or by catching \`StopIteration\` yourself.`,
    },
    {
      id: 'generators-q5',
      type: 'bug',
      prompt: '`list(evens([1, 2, 3, 4]))` should give `[2, 4]` but raises `TypeError: \'int\' object is not iterable`. Click the buggy line.',
      code: py`def evens(numbers):
    for n in numbers:
        if n % 2 == 0:
            return n


print(list(evens([1, 2, 3, 4])))`,
      answerLine: 4,
      explanation: py`\`return n\` ends the function at the first even number and makes \`evens\` an ordinary function returning \`2\`. \`list(2)\` then fails. Use \`yield n\` to produce every match.`,
    },
    {
      id: 'generators-q6',
      type: 'fill',
      prompt: 'Complete the infinite generator so `next()` gives `1, 2, 4, 8, …` forever.',
      code: py`def powers_of_two():
    value = 1
    while ___:
        ___ value
        value *= 2`,
      answer: [['True'], ['yield']],
      explanation: py`\`while True\` loops forever, and \`yield value\` hands out one value per \`next()\` and pauses — so the infinite loop only advances when someone asks.`,
    },
    {
      id: 'generators-q7',
      type: 'short',
      prompt: 'A function returns a list of every line of a log file that contains "ERROR". When would you rewrite it as a generator, and what would callers lose?',
      answer: py`Rewrite it when the file can be large, when callers usually stop early (e.g. "find the first error"), or when results should start flowing before the whole file is read: a generator keeps memory flat and does work only on demand. Callers lose list features: no \`len()\`, no indexing, and only a single pass — if they need those they can call \`list()\` on it. Errors (like a missing file) also surface later, on first iteration, unless you validate eagerly.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'bank-statement',
      title: 'Running balance',
      difficulty: 'intermediate',
      prompt: py`Write two functions for a bank statement:

1. A **generator function** \`running_balance(start, transactions)\` that yields the balance after each transaction. \`list(running_balance(100, [-30, 50, -200]))\` → \`[70, 120, -80]\`. It must be lazy: pull **one** transaction per value it yields.
2. \`first_overdraft(start, transactions)\` returns the **1-based number** of the first transaction after which the balance is below zero, or \`None\` if that never happens. \`first_overdraft(100, [-30, 50, -200, 10])\` → \`3\`. Use \`running_balance\`, and stop reading transactions as soon as you find it.`,
      files: {
        'main.py': py`def running_balance(start, transactions):
    # TODO: yield the balance after each transaction
    return []


def first_overdraft(start, transactions):
    # TODO: use running_balance and stop at the first negative balance
    return None


print(list(running_balance(100, [-30, 50, -200])))
print(first_overdraft(100, [-30, 50, -200, 10]))
`,
      },
      hints: [
        'running_balance keeps a local variable balance = start, loops over transactions, updates the balance and yields it.',
        'In first_overdraft, loop over enumerate(running_balance(...), start=1) and return the number as soon as the balance is negative.',
        'If the loop finishes without returning, return None. Because you return from inside the loop, no further transactions are read.',
      ],
      solution: {
        explanation: py`\`running_balance\` is a textbook generator: its local \`balance\` survives between \`next()\` calls, and each yield happens right after reading exactly one transaction, so it's lazy. \`first_overdraft\` consumes it with \`enumerate(..., start=1)\` and returns at the first negative balance. Returning from the loop simply stops asking the generator for values — so later transactions are never read, which matters when the input is a huge file or a live feed.`,
        files: {
          'main.py': py`def running_balance(start, transactions):
    balance = start
    for amount in transactions:
        balance += amount
        yield balance


def first_overdraft(start, transactions):
    for number, balance in enumerate(running_balance(start, transactions), start=1):
        if balance < 0:
            return number
    return None


print(list(running_balance(100, [-30, 50, -200])))
print(first_overdraft(100, [-30, 50, -200, 10]))
`,
        },
      },
      tests: [
        { name: 'running_balance is a generator function', code: py`import inspect
assert inspect.isgeneratorfunction(running_balance), 'Use yield inside running_balance'` },
        { name: 'yields the balance after each transaction', code: py`assert list(running_balance(100, [-30, 50, -200])) == [70, 120, -80]` },
        { name: 'pulls one transaction per value', code: py`pulled = []


def feed():
    for amount in [5, 5, 5, 5]:
        pulled.append(amount)
        yield amount


g = running_balance(0, feed())
assert next(g) == 5
assert len(pulled) == 1, 'running_balance should read one transaction per yielded balance'` },
        { name: 'first_overdraft finds the 3rd transaction', code: py`assert first_overdraft(100, [-30, 50, -200, 10]) == 3` },
        { name: 'first_overdraft returns None when never negative', code: py`assert first_overdraft(10, [5, -5, -10]) is None` },
        { name: 'first_overdraft stops reading early', code: py`pulled = []


def feed():
    for amount in [-1, -1, -1, -1, -1]:
        pulled.append(amount)
        yield amount


assert first_overdraft(1, feed()) == 2
assert len(pulled) == 2, 'Stop pulling transactions once the overdraft is found'` },
      ],
    },
    {
      id: 'flatten-generator',
      title: 'Flatten nested lists',
      difficulty: 'intermediate',
      prompt: py`Write a **recursive generator function** \`flatten(items)\` that yields every non-list item from a list that may contain lists, nested to any depth:

- \`list(flatten([1, [2, [3, [4]]], 5]))\` → \`[1, 2, 3, 4, 5]\`
- Only **lists** are flattened; strings, tuples and everything else are yielded whole: \`list(flatten(["ab", ("x", "y"), ["cd"]]))\` → \`["ab", ("x", "y"), "cd"]\`
- Empty lists produce nothing.`,
      files: {
        'main.py': py`def flatten(items):
    # TODO: yield each item; if an item is a list, yield everything inside it (recursively)
    return items


print(list(flatten([1, [2, [3, [4]]], 5])))
`,
      },
      hints: [
        'Loop over items. Use isinstance(item, list) to decide whether to dig deeper.',
        'For a nested list, call flatten(item) — that gives you another generator — and yield each value it produces.',
        'for inner in flatten(item): yield inner   (Python also has a shortcut for exactly this: yield from flatten(item))',
      ],
      solution: {
        explanation: py`Each call to \`flatten\` creates a new generator that walks one level. When it meets a nested list, it creates a child generator for that list and passes along everything the child yields. So the values bubble up through a chain of paused generators, one per nesting level — and nothing is copied into intermediate lists. \`yield from flatten(item)\` is the built-in shortcut for the inner \`for\` loop; it also forwards \`send()\` and \`throw()\`, which you'll meet in [advanced generators](lesson:advanced-generators).`,
        files: {
          'main.py': py`def flatten(items):
    for item in items:
        if isinstance(item, list):
            for inner in flatten(item):
                yield inner
        else:
            yield item


print(list(flatten([1, [2, [3, [4]]], 5])))
`,
        },
      },
      tests: [
        { name: 'flatten is a generator function', code: py`import inspect
assert inspect.isgeneratorfunction(flatten), 'flatten should use yield'` },
        { name: 'flattens deep nesting', code: py`assert list(flatten([1, [2, [3, [4]]], 5])) == [1, 2, 3, 4, 5]` },
        { name: 'strings and tuples are kept whole', code: py`assert list(flatten(["ab", ("x", "y"), ["cd"]])) == ["ab", ("x", "y"), "cd"]` },
        { name: 'empty lists produce nothing', code: py`assert list(flatten([[], [[]], 1, []])) == [1]` },
        { name: 'is lazy: the first value comes first', code: py`g = flatten([[["deep"]], "later"])
assert next(g) == "deep"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'generators-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a generator in Python, and how is a generator function different from a normal function?',
      answer: 'A generator function contains yield; calling it returns a generator object (an iterator) without running the body. Each next() runs the body until the next yield, returns that value and pauses with its state saved. A normal function runs to completion on each call and returns once.',
      explanation: py`Generators are the easy way to write iterators: local variables hold the state, \`yield\` produces values, and finishing the function raises \`StopIteration\` automatically. They're lazy, memory-efficient and single-use.`,
      code: { lang: 'python', code: py`def countdown(n):
    while n > 0:
        yield n
        n -= 1


g = countdown(2)
print(next(g), next(g), next(g, "done"))   # 2 1 done` },
      whyAsked: 'Generators are core Python; the question checks you understand laziness and pausing, not just the keyword.',
      mistakes: ['Saying the function "returns several values"', 'Not knowing that calling it runs nothing', 'Confusing generators with lists'],
      followUps: ['What happens when the generator function returns?', 'Can you iterate a generator twice?', 'What is a generator expression?'],
      modelAnswer: 'A generator is an iterator produced by a generator function — any function that contains yield. Calling that function does not run its body; it just returns a generator object. Each time someone calls next on it, the body runs until the next yield, hands that value back and pauses, keeping its local variables and position. When the function finishes, the generator raises StopIteration, so for loops stop naturally. Compared with a function that returns a list, it is lazy and uses constant memory, but it is single-use and has no len or indexing.',
    },
    {
      id: 'generators-list-vs-generator',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Your function returns a list of 10 million processed records. A colleague suggests changing it to a generator. Compare the two and say when you\'d keep the list.',
      answer: 'A generator yields one record at a time: constant memory, first result immediately, callers can stop early, works for unbounded input. A list allows len, indexing, sorting and multiple passes and is easier to debug. Keep the list if callers need random access or several passes, or the data is small.',
      explanation: py`Trade-offs: memory (one item vs all), latency to first item, ability to short-circuit, single-use vs reusable, error timing (lazy vs eager), and simplicity. Callers can always opt in to a list with \`list(gen)\`, but can't make a list lazy — so libraries often expose generators and let callers decide.`,
      whyAsked: 'Tests practical judgement about memory and API design, not just definitions.',
      mistakes: ['Claiming generators are always faster', 'Ignoring that callers may iterate twice', 'Forgetting that exceptions move to consumption time'],
      followUps: ['How would you measure the memory difference?', 'What happens to an open file if the caller stops early?', 'How do you make validation errors appear at call time?'],
      modelAnswer: 'With a list, all ten million records are built and held in memory before the caller sees the first one. A generator yields them one at a time, so memory stays roughly constant, the first record is available immediately, and a caller that only needs the first match can stop early without paying for the rest. The cost is that a generator is single-use, has no len or indexing, and raises errors at consumption time rather than at the call. I would keep the list if callers need random access or several passes, or if the data is small. Otherwise I would yield, since callers can always wrap it in list() when they need to.',
    },
    {
      id: 'generators-stopiteration-runtimeerror',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'This generator pairs up items. With an odd number of items it crashes with `RuntimeError: generator raised StopIteration`. Why a RuntimeError, and how do you fix it?',
      code: { lang: 'python', code: py`def pairs(items):
    it = iter(items)
    for first in it:
        yield first, next(it)


print(list(pairs([1, 2, 3, 4])))   # [(1, 2), (3, 4)]
# list(pairs([1, 2, 3]))  -> RuntimeError: generator raised StopIteration` },
      answer: 'On the odd item, next(it) raises StopIteration inside the generator body. Since Python 3.7 (PEP 479) a StopIteration escaping a generator is converted into RuntimeError so it cannot silently end iteration. Fix by using next(it, default) or catching StopIteration and returning.',
      explanation: py`Before PEP 479, the stray \`StopIteration\` would have quietly ended the generator, dropping the last item without any error — a hidden bug. Now it fails loudly. Fixes: \`second = next(it, None)\` and decide how to handle the leftover; or \`try: second = next(it) except StopIteration: return\`. For this exact job, \`zip(it, it)\` (drops the leftover) or \`itertools.batched(items, 2)\` (3.12+, keeps it as a short tuple) are idiomatic.`,
      whyAsked: 'Shows knowledge of a real language change and of how StopIteration interacts with generators.',
      mistakes: ['Catching RuntimeError around the caller', 'Not knowing why it is not a plain StopIteration', 'Silently dropping the last item without deciding whether that is correct'],
      followUps: ['What did this code do before Python 3.7?', 'How would you write it with zip or itertools?', 'Does PEP 479 apply to iterator classes?'],
      modelAnswer: 'With an odd number of items, the inner next(it) runs out and raises StopIteration inside the generator body. Since Python 3.7, PEP 479 says a StopIteration escaping from a generator is turned into RuntimeError, because otherwise it would silently end the generator and hide the bug — here it would just drop the last item. The fix is to make the end explicit: call next(it, None) and decide what to do with a leftover, or catch StopIteration and return. Idiomatically I would use zip(it, it) if dropping the leftover is fine, or itertools.batched(items, 2) on 3.12+ to keep it.',
    },
    {
      id: 'generators-unique',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write a generator `unique(iterable)` that yields each item the first time it appears, preserving order, and works lazily on huge or infinite input: `list(unique([3, 1, 3, 2, 1]))` → `[3, 1, 2]`. Items are hashable.',
      answer: 'Keep a set of seen items; for each item, if it is not in seen, add it and yield it.',
      explanation: py`A set gives O(1) average membership tests, the generator keeps order and yields as soon as a new item appears, so it works on infinite streams (memory grows only with the number of *distinct* items). \`dict.fromkeys(iterable)\` also deduplicates in order, but eagerly.`,
      starter: { files: { 'main.py': py`def unique(iterable):
    # TODO: yield first occurrences, lazily
    return iterable


print(list(unique([3, 1, 3, 2, 1])))
` } },
      tests: [
        { name: 'keeps first occurrences in order', code: py`assert list(unique([3, 1, 3, 2, 1])) == [3, 1, 2]` },
        { name: 'works on strings', code: py`assert "".join(unique("mississippi")) == "misp"` },
        { name: 'is lazy (works on an infinite iterator)', code: py`import itertools
g = unique(itertools.cycle([1, 2, 3]))
assert [next(g), next(g), next(g)] == [1, 2, 3]` },
      ],
      solution: { files: { 'main.py': py`def unique(iterable):
    seen = set()
    for item in iterable:
        if item not in seen:
            seen.add(item)
            yield item


print(list(unique([3, 1, 3, 2, 1])))
` } },
      hints: ['You need to remember which items you have already produced — which data structure has fast membership tests?', 'Loop, check membership, add and yield.'],
      whyAsked: 'A common utility that combines generators with sets; the infinite-input test catches eager solutions.',
      mistakes: ['Using a list for seen (O(n) membership)', 'Returning list(set(items)), which loses order and is eager', 'Calling list() on the input'],
      followUps: ['How would you deduplicate by a key, such as case-insensitive emails?', 'What if items are unhashable?', 'What is the memory cost on an infinite stream?'],
      modelAnswer: 'I keep a set called seen. I loop over the input, and for each item that is not in seen, I add it and yield it. The set gives constant-time membership checks on average, the order of first appearance is preserved because I yield in input order, and because it is a generator it works on infinite streams — memory only grows with the number of distinct items. To deduplicate by a key, I would store key(item) in the set instead; for unhashable items I would need a slower list-based fallback.',
    },
    {
      id: 'generators-closed-file',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: '`def load(path): with open(path) as f: return (line.strip() for line in f)` — calling `list(load("users.txt"))` raises `ValueError: I/O operation on closed file.` Explain and fix.',
      answer: 'The generator expression is lazy, but return leaves the with block, which closes the file before anything is read. Make load a generator function (yield inside the with block) so the file stays open while it is consumed — or read eagerly.',
      explanation: py`The generator expression captures \`f\` but doesn't read from it until iterated. By then the \`with\` block has exited. With \`for line in f: yield line.strip()\` inside the \`with\`, the paused generator frame is *inside* the \`with\` block; the file closes when the generator finishes or is closed. If a caller may stop early, they should close the generator (or use \`contextlib.closing\`).`,
      whyAsked: 'Combines laziness with resource management, a frequent real bug.',
      mistakes: ['Blaming the file path', 'Removing the with statement and leaking the file handle'],
      followUps: ['When is the file closed if the caller breaks out of the loop early?', 'How does contextlib.closing help?'],
      modelAnswer: 'The generator expression does not read anything when it is created; it only remembers the file object. But return exits the with block immediately, which closes the file, so when list() finally starts iterating, the file is already closed. The fix is to make load a generator function and yield from inside the with block, so the paused generator keeps the file open exactly while it is being consumed and closes it when it finishes. Alternatively, if the file is small, read it eagerly into a list before returning.',
    },
    {
      id: 'generators-state-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does a generator "remember where it was"? What states can it be in, and which parts of the answer are CPython-specific?',
      answer: 'The generator object owns the function\'s frame — local variables plus the position of the next instruction — which survives between next() calls instead of being discarded on return. States: GEN_CREATED, GEN_RUNNING, GEN_SUSPENDED, GEN_CLOSED (inspect.getgeneratorstate). How the frame is stored (inline in the generator object, gi_frame etc.) is a CPython detail.',
      explanation: py`Language level: a generator resumes after the \`yield\` with all locals intact; once closed it can't restart; exceptions propagate through \`next()\`. CPython level: the compiler sets a generator flag on the code object; the generator embeds the frame data, \`YIELD_VALUE\` suspends it and resuming continues at the saved instruction offset; \`gi_frame\`, \`gi_code\`, \`gi_running\` expose internals. Other implementations (PyPy, GraalPy) achieve the same semantics differently.`,
      whyAsked: 'Senior-level probe of the execution model and of separating language semantics from implementation details.',
      mistakes: ['Saying generators run in a separate thread', 'Claiming the body re-runs from the top each time', 'Presenting gi_frame details as language guarantees'],
      followUps: ['What happens to a suspended generator when it is garbage-collected?', 'How does yield from change the picture?', 'How did this mechanism enable coroutines?'],
      modelAnswer: 'A normal function frame — its local variables and current position — is thrown away when the function returns. A generator object holds on to its frame instead. yield hands a value to the caller and suspends that frame, and the next call to next resumes it at the instruction right after the yield, with every local variable intact. inspect.getgeneratorstate reports four states: created, running, suspended and closed, and once closed it can never resume. That behaviour is the language guarantee. How the frame is stored — in CPython it is embedded in the generator object, with gi_frame and gi_running exposed for introspection — is an implementation detail, and nothing runs in the background or in another thread.',
    },
  ],

  takeaways: [
    'Any def containing yield is a generator function: calling it returns a generator object and runs nothing.',
    'Each next() runs the body to the next yield, hands out the value and pauses with all local variables kept.',
    'When the function ends, StopIteration is raised automatically; a return value rides on StopIteration.value and for loops ignore it.',
    'Generators are lazy and single-use: constant memory, early stopping and infinite sequences — but no len(), indexing or second pass.',
    'Errors and side effects happen at consumption time; validate arguments eagerly in a wrapper if it matters.',
    'A stray StopIteration inside a generator becomes RuntimeError (PEP 479) — use next(it, default).',
  ],
}
