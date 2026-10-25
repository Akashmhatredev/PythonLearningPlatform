// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LAUNCH_PAD = py`class Countdown:
    """An ITERATOR: it remembers its position and is used up after one pass."""

    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self                  # iterators return themselves

    def __next__(self):
        if self.current <= 0:
            raise StopIteration      # the "no more items" signal
        value = self.current
        self.current -= 1
        return value


class Playlist:
    """An ITERABLE: every loop over it gets a brand-new iterator."""

    def __init__(self, songs):
        self.songs = list(songs)

    def __iter__(self):
        return iter(self.songs)      # a fresh list iterator each time


# 1. iter() and next() by hand
songs = ["Intro", "Verse", "Chorus"]
cursor = iter(songs)
print(next(cursor), "/", next(cursor))
print(next(cursor, "(end)"), "/", next(cursor, "(end)"))

# 2. what a for loop really does
it = iter(Countdown(3))
while True:
    try:
        n = next(it)
    except StopIteration:
        break
    print("T minus", n)

# 3. an iterator is used up after one pass
launch = Countdown(2)
print("first pass: ", list(launch))
print("second pass:", list(launch))

# 4. an iterable hands out fresh iterators: loop again, or even nest loops
mix = Playlist(["Lo-fi", "Jazz"])
print("first pass: ", list(mix))
print("second pass:", list(mix))
print("pairs:", [(a, b) for a in mix for b in mix if a != b])
`

export default {
  id: 'iterators',
  title: 'Iterables & iterators: how for really works',
  summary: 'A for loop asks an iterable for an iterator with iter(), then calls next() until StopIteration — understand that protocol and you understand every loop in Python.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['for-loops', 'while-loops', 'comprehensions'],
  related: ['generators', 'lazy-evaluation', 'itertools', 'container-protocols', 'special-methods', 'classes-and-objects', 'try-except', 'dictionaries'],
  tags: ['iterator', 'iterable', 'iter', 'next', 'StopIteration', 'iteration protocol', '__iter__', '__next__', 'for loop', 'exhausted', 'sentinel', 'collections.abc'],
  apis: [
    { name: 'iter(iterable)', summary: 'Returns an iterator for the iterable by calling its __iter__ (or falling back to __getitem__).' },
    { name: 'iter(callable, sentinel)', summary: 'Returns an iterator that calls callable() until it returns sentinel.' },
    { name: 'next(iterator[, default])', summary: 'Returns the next item; raises StopIteration when exhausted, or returns default if one was given.' },
    { name: 'StopIteration', summary: 'The exception an iterator raises to say "no more items". for loops catch it for you.' },
    { name: '__iter__() / __next__()', summary: 'The two special methods of the iterator protocol. Iterables define __iter__; iterators define both.' },
    { name: 'collections.abc.Iterable / Iterator', summary: 'Abstract base classes for isinstance() checks and type hints.' },
  ],
  docs: [
    { label: 'Glossary — iterable', url: 'https://docs.python.org/3/glossary.html#term-iterable' },
    { label: 'Glossary — iterator', url: 'https://docs.python.org/3/glossary.html#term-iterator' },
    { label: 'Built-in types — iterator types', url: 'https://docs.python.org/3/library/stdtypes.html#iterator-types' },
    { label: 'Built-in functions — iter() and next()', url: 'https://docs.python.org/3/library/functions.html#iter' },
    { label: 'Tutorial — iterators', url: 'https://docs.python.org/3/tutorial/classes.html#iterators' },
    { label: 'PEP 234 — iterators', url: 'https://peps.python.org/pep-0234/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You can write \`for x in ...\` over a list, a string, a dict, a range, a file, a set, the result of \`zip()\` — even over objects you design yourself. How can one loop work with so many different things?`,
    py`Because the \`for\` loop doesn't know anything about lists or files. It only knows a tiny two-step agreement called the **iteration protocol**:`,
    py`1. Ask the thing for an **iterator** with \`iter(thing)\`.
2. Call \`next(iterator)\` again and again. Each call hands over one item. When there are no more, the iterator raises **\`StopIteration\`**, and the loop ends.`,
    py`Two words to keep apart from now on:`,
    py`- An **iterable** is anything you *can* loop over — it knows how to produce an iterator (lists, strings, dicts, ranges, files…).
- An **iterator** is the object that *does* the looping — it remembers where it is and hands out the next item when asked.`,
    py`This protocol is the foundation of [generators](lesson:generators), [lazy pipelines](lesson:lazy-evaluation) and the whole [itertools](lesson:itertools) module.`,
  ],
  why: [
    py`**One loop for everything.** Any object that follows the protocol works with \`for\`, comprehensions, \`list()\`, \`sum()\`, \`max()\`, \`zip()\`, unpacking (\`a, b = thing\`) and \`in\`. You implement two methods and get the whole toolbox.`,
    py`**Streaming.** An iterator produces items one at a time, so it never needs all of them in memory. That's how Python reads a huge file line by line, or loops over \`range(10**12)\` without building a trillion-item list.`,
    py`**Fewer surprises.** Knowing the protocol explains real bugs: why a \`zip\` result is empty the second time you loop over it, why \`x in iterator\` "eats" items, and why a list you change while looping skips elements.`,
  ],
  eli15: [
    py`Think of a book and a bookmark. The **book** is the iterable: it contains the pages, and it can give out as many bookmarks as you like. The **bookmark** is the iterator: it only knows "which page am I on?", and every time you say *next*, it moves forward one page.`,
    py`When the bookmark falls off the last page, it says "the end" (that's \`StopIteration\`). That bookmark is now useless — it can't go backwards. If you want to read again, you ask the book for a **new** bookmark.`,
    py`A \`for\` loop is just someone who takes a fresh bookmark and keeps saying *next* until the end.`,
  ],
  analogy: {
    title: 'Books and bookmarks',
    body: [
      py`A library book can be read by many people at once, each with their own bookmark. Each bookmark moves forward independently, never backwards, and once it reaches the last page it's finished. To start over you get a fresh bookmark from the book.`,
      py`Some things are *only* a bookmark with no book behind them — like a ticket roll at a deli counter: each pull gives the next number, and pulled tickets never come back. Those are iterators that aren't backed by a reusable collection (a \`map\` result, a file being read, a generator).`,
    ],
    mapping: [
      ['the book', 'an iterable: list, str, dict, range, your own Playlist class'],
      ['a bookmark', 'an iterator: list_iterator, a file object, a map/zip/enumerate result'],
      ['asking the book for a bookmark', 'iter(book) → calls book.__iter__()'],
      ['"next page, please"', 'next(bookmark) → calls bookmark.__next__()'],
      ['falling off the last page', 'raise StopIteration'],
      ['a deli ticket roll', 'an iterator with no reusable collection behind it — single-use'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch a for loop drive an iterator',
    props: {
      code: py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        value = self.current
        self.current -= 1
        return value


rocket = Countdown(2)
for n in rocket:
    print("T minus", n)
print("liftoff!")
print(list(rocket))
`,
      notes: {
        16: 'Creating the object does not loop yet. `rocket.current` is 2.',
        17: 'The `for` line first calls `iter(rocket)` → `__iter__`, then calls `next()` → `__next__` once per pass.',
        10: 'Out of items: `__next__` raises `StopIteration`. The `for` loop catches it silently and ends.',
        20: '`list(rocket)` runs the same protocol again — but `rocket` is already exhausted, so the very first `__next__` raises StopIteration and the list is empty.',
      },
    },
    alt: 'A step-by-step trace. The for loop first calls Countdown.__iter__, which returns the same object. Then it calls __next__ repeatedly: each call returns the current value (2, then 1) and decrements self.current, and the loop body prints it. When current reaches 0, __next__ raises StopIteration, which the loop catches. Finally list(rocket) calls __iter__ and __next__ again, gets StopIteration immediately, and prints an empty list.',
    caption: py`Press ▶ and watch the call stack: the \`for\` line itself calls \`__iter__\` once and \`__next__\` on every pass. You never see \`StopIteration\` crash the program — the loop is designed to catch it.`,
  },
  syntax: [
    py`#### iter() and next() by hand`,
    { code: py`colors = ["red", "green"]
it = iter(colors)       # ask the iterable for an iterator
print(next(it))         # red
print(next(it))         # green
print(next(it, None))   # None — the default instead of an exception
# next(it)              # would raise StopIteration`, lang: 'python', title: 'stepping manually' },
    py`\`next(it, default)\` is the safe way to ask for "the next item if there is one". It's perfect for "find the first match" code.`,
    py`#### What \`for\` really does`,
    py`This loop:`,
    { code: py`for task in ["wash", "dry", "fold"]:
    print(task)`, lang: 'python' },
    py`behaves exactly like this \`while\` loop (simplified — the real one is built into the interpreter):`,
    { code: py`_it = iter(["wash", "dry", "fold"])
while True:
    try:
        task = next(_it)
    except StopIteration:
        break
    print(task)`, lang: 'python', title: 'a for loop, desugared' },
    py`The loop's \`else\` clause (see [loop control](lesson:loop-control)) runs exactly when this hidden \`StopIteration\` ends the loop instead of a \`break\`.`,
    py`#### The two methods of the protocol`,
    { code: py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):          # makes it ITERABLE: return an iterator
        return self              # an iterator is its own iterator

    def __next__(self):          # makes it an ITERATOR: produce the next item
        if self.current <= 0:
            raise StopIteration  # signal the end
        self.current -= 1
        return self.current + 1


print(list(Countdown(3)))       # [3, 2, 1]`, lang: 'python', title: 'an iterator class' },
    py`- An **iterable** has \`__iter__()\` returning an iterator.
- An **iterator** has \`__next__()\` *and* an \`__iter__()\` that returns \`self\`, so iterators can be used anywhere an iterable is expected (\`for x in iterator\`).
- Rule: once \`__next__\` has raised \`StopIteration\`, it should keep raising it on every later call.`,
    { callout: 'note', title: 'Special methods', text: py`Methods with double underscores, like \`__iter__\`, are *special methods* (or "dunder methods"): Python calls them for you when you use built-in syntax. You don't call \`obj.__next__()\` yourself — you call \`next(obj)\`. More in [special methods](lesson:special-methods) and [container protocols](lesson:container-protocols). If classes are new to you, skim [classes & objects](lesson:classes-and-objects) first.` },
    py`#### Iterable or iterator? A quick test`,
    { code: py`numbers = [1, 2, 3]
print(iter(numbers) is numbers)    # False: a list is an iterable, not an iterator
it = iter(numbers)
print(iter(it) is it)              # True: an iterator returns itself

z = zip("ab", [1, 2])
print(iter(z) is z)                # True: zip(), map(), filter(), enumerate() are iterators
r = range(3)
print(iter(r) is r)                # False: range is a reusable iterable`, lang: 'python', title: 'iter(x) is x means "x is an iterator"' },
    py`| object | iterable? | iterator? | reusable? |
|---|---|---|---|
| \`list\`, \`tuple\`, \`str\`, \`dict\`, \`set\`, \`range\` | ✓ | ✗ | ✓ loop as often as you like |
| \`dict.keys()\` / \`.values()\` / \`.items()\` views | ✓ | ✗ | ✓ |
| \`zip()\`, \`map()\`, \`filter()\`, \`enumerate()\`, \`reversed()\` | ✓ | ✓ | ✗ single pass |
| an open file | ✓ | ✓ | ✗ single pass (until you seek back) |
| a generator | ✓ | ✓ | ✗ single pass |`,
    py`#### The two-argument form: iter(callable, sentinel)`,
    { code: py`import random

random.seed(4)
roll = lambda: random.randint(1, 6)
# call roll() again and again until it returns 6
rolls = list(iter(roll, 6))
print(rolls)   # the rolls before the first 6`, lang: 'python', title: 'keep calling until a stop value' },
    py`A classic use is \`for line in iter(input, "quit"):\` — keep reading input until someone types \`quit\`.`,
  ],
  walkthrough: {
    title: 'Reading the launch pad line by line',
    lang: 'python',
    code: LAUNCH_PAD,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 15], text: py`\`Countdown\` is an **iterator**: its state (\`self.current\`) lives on the object itself, \`__iter__\` returns \`self\`, and \`__next__\` either returns a value or raises \`StopIteration\`.` },
      { lines: [18, 25], text: py`\`Playlist\` is an **iterable** but not an iterator: it has no \`__next__\`. Its \`__iter__\` hands out a *new* list iterator every time it's called, so each loop gets its own position.` },
      { lines: [29, 31], text: py`\`iter(songs)\` returns a list iterator positioned before the first item. Each \`next(cursor)\` moves it forward: \`Intro / Verse\`.` },
      { lines: [32, 32], text: py`The third \`next\` returns \`Chorus\`; the fourth finds nothing left and returns the default \`"(end)"\` instead of raising \`StopIteration\`.` },
      { lines: [35, 41], text: py`This is a \`for\` loop with its disguise removed: get an iterator, call \`next()\` until \`StopIteration\`, then \`break\`. Prints \`T minus 3\`, \`2\`, \`1\`.` },
      { lines: [44, 46], text: py`\`list(launch)\` drains the iterator. The second \`list(launch)\` asks the same, already-finished object for more and immediately gets \`StopIteration\`: \`[]\`.` },
      { lines: [49, 52], text: py`Each \`list(mix)\` calls \`Playlist.__iter__\` again and gets a fresh iterator, so both passes are full. Even the nested loop works: the inner and outer loops each have their own iterator.` },
    ],
  },
  playground: {
    title: 'Launch pad',
    objective: 'Run it, predict every line, then extend the iterator and the iterable in the experiments.',
    files: { 'main.py': LAUNCH_PAD },
    stdin: 'north\nlook\nquit',
    expected: py`\`\`\`text
Intro / Verse
Chorus / (end)
T minus 3
T minus 2
T minus 1
first pass:  [2, 1]
second pass: []
first pass:  ['Lo-fi', 'Jazz']
second pass: ['Lo-fi', 'Jazz']
pairs: [('Lo-fi', 'Jazz'), ('Jazz', 'Lo-fi')]
\`\`\`

The Input tab is pre-filled with three lines for the last experiment; the original program doesn't read them.`,
    experiments: [
      {
        id: 'step',
        task: py`Give \`Countdown\` an optional \`step\` parameter (default \`1\`) so that \`Countdown(10, step=3)\` produces \`10, 7, 4, 1\`.`,
        hint: py`Store \`self.step = step\` in \`__init__\` and subtract it instead of \`1\` in \`__next__\`.`,
        tests: [
          { name: 'Countdown(10, step=3) gives 10, 7, 4, 1', code: py`assert list(Countdown(10, step=3)) == [10, 7, 4, 1]` },
          { name: 'the default step is still 1', code: py`assert list(Countdown(3)) == [3, 2, 1]` },
        ],
        explain: py`All the iterator's state lives on the object, so adding behaviour means adding attributes. The protocol doesn't care how \`__next__\` computes the next value — only that it returns one or raises \`StopIteration\`.`,
      },
      {
        id: 'reusable',
        task: py`First add \`r = Countdown(2)\` and \`print([(a, b) for a in r for b in r])\` at the end. Predict, run — surprised? Then write an **iterable** class \`CountdownFrom(start)\` whose \`__iter__\` returns a **new** \`Countdown(self.start)\`, and confirm it can be looped twice and nested.`,
        hint: py`\`CountdownFrom\` needs only \`__init__\` and \`__iter__\`. Its \`__iter__\` is one line: \`return Countdown(self.start)\`.`,
        tests: [
          { name: 'CountdownFrom can be looped twice', code: py`assert callable(ns.get('CountdownFrom')), 'Define a class named CountdownFrom'
r = CountdownFrom(3)
assert list(r) == [3, 2, 1] and list(r) == [3, 2, 1]` },
          { name: 'nested loops see every pair', code: py`r = CountdownFrom(2)
assert [(a, b) for a in r for b in r] == [(2, 2), (2, 1), (1, 2), (1, 1)]` },
        ],
        explain: py`With \`Countdown\`, the inner loop and the outer loop share **one** iterator: the inner loop drains it on the first outer pass, so you only get \`[(2, 1)]\`. \`CountdownFrom\` separates "the collection" from "the position" — every \`for\` calls \`__iter__\` and gets its own \`Countdown\`. That's exactly how \`list\` and \`Playlist\` work.`,
      },
      {
        id: 'membership',
        task: py`Add \`c = Countdown(5)\`, then \`print(3 in c)\` and \`print(list(c))\`. Predict both lines before running.`,
        hint: py`\`in\` on an iterator has no shortcut: it calls \`next()\` until it finds the value (or runs out).`,
        explain: py`\`3 in c\` pulls \`5\`, \`4\`, \`3\` out of the iterator to find the match and prints \`True\`. Those items are gone, so \`list(c)\` is only \`[2, 1]\`. Membership tests, \`max()\`, \`sum()\` and friends all *consume* an iterator.`,
      },
      {
        id: 'sentinel',
        task: py`Add a loop that reads commands with \`input()\` until someone types \`quit\`, printing \`> \` plus each command. Use the two-argument \`iter(input, "quit")\` — no \`while\`, no \`if\`.`,
        hint: py`\`for command in iter(input, "quit"):\` then \`print(">", command)\`. The Input tab already contains \`north\`, \`look\`, \`quit\`.`,
        tests: [
          {
            name: 'echoes each command until quit',
            stdin: 'north\nlook\nquit\nsecret',
            code: py`assert "> north" in output and "> look" in output, 'Print "> " followed by each command'
assert "> quit" not in output and "> secret" not in output, 'Stop at quit — it should not be printed'`,
          },
        ],
        explain: py`\`iter(callable, sentinel)\` builds an iterator that calls \`input()\` on every \`next()\` and raises \`StopIteration\` as soon as the result equals \`"quit"\`. The loop never sees the sentinel, and anything typed after it is never read.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The iteration protocol, step by step',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'loop', label: 'for item in books:', note: 'your loop', x: 120, y: 70, tone: 'yellow' },
        { id: 'iterable', label: 'books', note: 'iterable (a list)', x: 380, y: 70, tone: 'kraft' },
        { id: 'iterator', label: 'list_iterator', note: 'position: 0, 1, 2…', x: 640, y: 70, tone: 'blue' },
        { id: 'body', label: 'loop body', note: 'runs with item bound', x: 120, y: 250, tone: 'paper' },
        { id: 'stop', label: 'StopIteration', note: 'caught by the loop', x: 640, y: 250, tone: 'red' },
      ],
      edges: [
        { id: 'ask', from: 'loop', to: 'iterable', label: 'iter(books)' },
        { id: 'give', from: 'iterable', to: 'iterator', label: '__iter__() returns' },
        { id: 'next', from: 'iterator', to: 'body', label: 'next() → item' },
        { id: 'again', from: 'body', to: 'loop', label: 'back for more', dashed: true },
        { id: 'end', from: 'iterator', to: 'stop', label: 'nothing left' },
      ],
      steps: [
        { focus: ['loop', 'iterable'], edges: ['ask'], text: py`The loop starts by calling \`iter(books)\` — **once**. It never touches the list's items directly.` },
        { focus: ['iterable', 'iterator'], edges: ['give'], text: py`The list's \`__iter__\` returns a brand-new **iterator** object that keeps its own position, starting before the first item.` },
        { focus: ['iterator', 'body'], edges: ['next'], text: py`Each pass, the loop calls \`next(iterator)\`. The iterator returns the next item and moves its position forward. The item is bound to \`item\` and the body runs.` },
        { focus: ['body', 'loop'], edges: ['again'], text: py`When the body finishes (or hits \`continue\`), control goes back to the \`for\` line, which calls \`next()\` again. \`break\` would leave immediately.` },
        { focus: ['iterator', 'stop'], edges: ['end'], text: py`When the position passes the last item, \`__next__\` raises \`StopIteration\`. The loop catches it, runs its \`else\` block if there is one, and continues after the loop.` },
      ],
    },
    alt: 'A diagram of the iteration protocol: the for loop calls iter(books) once; the list returns a list_iterator that tracks a position; the loop repeatedly calls next() on it, binding each item and running the body, then going back for more; when nothing is left the iterator raises StopIteration, which the loop catches.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every built-in container comes with its own iterator type that remembers a position. A list iterator, for example, holds a reference to the list and an index. \`next()\` returns \`the_list[index]\` and adds one to the index; when the index reaches the length, it raises \`StopIteration\`.`,
      py`That simple design explains a famous bug — **changing a list while looping over it**:`,
      { code: py`nums = [1, 2, 2, 3]
for n in nums:
    if n == 2:
        nums.remove(n)   # shifts later items left under the iterator's feet
print(nums)              # [1, 2, 3] — the second 2 was skipped!

nums = [1, 2, 2, 3]
nums = [n for n in nums if n != 2]   # build a new list instead
print(nums)              # [1, 3]`, lang: 'python', title: 'never resize what you are iterating' },
      py`Dicts and sets protect themselves: changing their size during a loop raises \`RuntimeError: dictionary changed size during iteration\`. Loop over a copy (\`for key in list(d):\`) or build a new dict with a [comprehension](lesson:comprehensions).`,
    ],
    technical: [
      py`**How \`iter()\` decides.** \`iter(obj)\` looks up \`__iter__\` on the object's **type** (not the instance) and calls it; the result must be an iterator, otherwise you get \`TypeError: iter() returned non-iterator of type 'list'\`. If the type has no \`__iter__\` but has \`__getitem__\`, Python falls back to the old **sequence protocol**: it calls \`obj[0]\`, \`obj[1]\`, … until \`IndexError\`. Only if neither exists do you get \`TypeError: 'int' object is not iterable\`.`,
      { code: py`from collections.abc import Iterable


class Shelf:                      # no __iter__, only __getitem__
    def __getitem__(self, index):
        if index >= 3:
            raise IndexError
        return f"book {index}"


print(list(Shelf()))                  # ['book 0', 'book 1', 'book 2']
print(isinstance(Shelf(), Iterable))  # False! the ABC only checks for __iter__`, lang: 'python', title: 'the __getitem__ fallback' },
      py`So the only fully reliable "is this iterable?" test is to call \`iter(x)\` and catch \`TypeError\`. \`isinstance(x, collections.abc.Iterator)\` checks for both \`__iter__\` and \`__next__\`.`,
      py`**StopIteration is control flow, not an error.** Loops, \`list()\`, \`sum()\`, unpacking and \`in\` all catch it. It must not escape from places that don't expect it: inside a [generator](lesson:generators), a stray \`StopIteration\` is converted to \`RuntimeError\` (PEP 479, Python 3.7+) so it can't silently end an outer loop.`,
      py`**Lazy built-ins.** \`map()\`, \`filter()\`, \`zip()\`, \`enumerate()\` and \`reversed()\` return iterators: they do no work until something calls \`next()\`, and they're used up after one pass. This changed in Python 3 — in Python 2, \`map\` and \`zip\` returned lists.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython a \`for\` loop compiles to two bytecodes: \`GET_ITER\` (calls \`iter()\`) and \`FOR_ITER\` (calls \`next()\`, jumping past the loop when the iterator is exhausted). Built-in iterators signal the end internally without creating a \`StopIteration\` object at all, and recent versions *specialise* \`FOR_ITER\` for lists, tuples, ranges and generators. Iterator type names like \`list_iterator\` and \`str_ascii_iterator\` are CPython-specific too. None of this changes behaviour — it's why loops over built-ins are fast. See [bytecode](lesson:bytecode).` },
    ],
    production: [
      py`**Accept iterables, return what's useful.** A function that only loops once over its input should accept any iterable (\`Iterable[str]\` in [type hints](lesson:type-hints)), so callers can pass a list, a file, a generator or a database cursor. Use \`Iterator[...]\` only when you really need \`next()\`.`,
      py`**Beware the double pass.** If a function loops over its argument twice (e.g. \`total = sum(values)\` then \`[v / total for v in values]\`), it works on lists and **silently returns \`[]\`** on generators and \`map\` results. Either convert once at the top (\`values = list(values)\`) or reject iterators explicitly:`,
      { code: py`def normalise(values):
    if iter(values) is values:          # an iterator: we can only read it once
        raise TypeError("normalise() needs a re-iterable collection, not an iterator")
    total = sum(values)
    return [v / total for v in values]


print(normalise([1, 3]))     # [0.25, 0.75]`, lang: 'python', title: 'defending against single-pass input' },
      py`**Streaming beats loading.** Iterating an open file reads it line by line, keeping memory flat no matter how large the file is (see [reading & writing files](lesson:reading-writing-files)). Database drivers, CSV readers and HTTP clients expose results as iterators for the same reason. Calling \`list()\` on them throws that advantage away.`,
      py`**Most of the time, don't write iterator classes at all.** A [generator](lesson:generators) function produces an iterator with a fraction of the code and none of the bookkeeping. Write a class when the iterator needs extra public methods or state that callers inspect.`,
    ],
  },
  mistakes: [
    {
      title: 'Looping twice over a one-shot iterator',
      wrong: { code: py`pairs = zip(["Ada", "Ben"], [91, 47])
print(dict(pairs))     # {'Ada': 91, 'Ben': 47}
print(list(pairs))     # [] — zip results are used up`, lang: 'python' },
      right: { code: py`pairs = list(zip(["Ada", "Ben"], [91, 47]))   # materialise once
print(dict(pairs))     # {'Ada': 91, 'Ben': 47}
print(pairs)           # [('Ada', 91), ('Ben', 47)]`, lang: 'python' },
      explanation: py`\`zip\`, \`map\`, \`filter\`, \`enumerate\`, file objects and generators are iterators: one pass only, and no error the second time — just nothing. Convert to a list if you need the data more than once.`,
    },
    {
      title: 'A container whose __iter__ returns self',
      wrong: { code: py`class Team:
    def __init__(self, names):
        self.names = names
        self.i = 0

    def __iter__(self):
        return self              # the container IS the iterator

    def __next__(self):
        if self.i >= len(self.names):
            raise StopIteration
        self.i += 1
        return self.names[self.i - 1]


team = Team(["Ada", "Ben"])
print(list(team), list(team))   # ['Ada', 'Ben'] [] — second loop is empty`, lang: 'python' },
      right: { code: py`class Team:
    def __init__(self, names):
        self.names = names

    def __iter__(self):
        return iter(self.names)  # a fresh iterator for every loop


team = Team(["Ada", "Ben"])
print(list(team), list(team))   # ['Ada', 'Ben'] ['Ada', 'Ben']`, lang: 'python' },
      explanation: py`A collection should hand out a **new** iterator from \`__iter__\`. If the collection is its own iterator, the position is shared: the second loop starts at the end and nested loops break. (A generator-based \`__iter__\` — see [generators](lesson:generators) — also creates a fresh iterator each call.)`,
    },
    {
      title: 'Forgetting to raise StopIteration',
      wrong: { code: py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current > 0:
            self.current -= 1
            return self.current + 1
        # falls off the end: returns None forever -> for loops never stop`, lang: 'python' },
      right: { code: py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1`, lang: 'python' },
      explanation: py`Returning \`None\` is just another item. The only way to end iteration is to **raise** \`StopIteration\`. Without it, \`for\` loops and \`list()\` run forever.`,
    },
    {
      title: 'Calling next() on a list',
      wrong: { code: py`queue = ["print", "scan"]
first = next(queue)   # TypeError: 'list' object is not an iterator`, lang: 'python', static: true },
      right: { code: py`queue = ["print", "scan"]
first = queue[0]                # just index a list
first = next(iter(queue))       # or ask for an iterator first`, lang: 'python' },
      explanation: py`\`next()\` works on **iterators**. A list is an iterable: call \`iter()\` on it first — or, for a list, simply index it.`,
    },
    {
      title: 'Removing items from a list while looping over it',
      wrong: { code: py`emails = ["a@x.io", "spam@bad.io", "spam@bad.io", "b@y.io"]
for e in emails:
    if e.startswith("spam"):
        emails.remove(e)
print(emails)   # ['a@x.io', 'spam@bad.io', 'b@y.io'] — one survived`, lang: 'python' },
      right: { code: py`emails = ["a@x.io", "spam@bad.io", "spam@bad.io", "b@y.io"]
emails = [e for e in emails if not e.startswith("spam")]
print(emails)   # ['a@x.io', 'b@y.io']`, lang: 'python' },
      explanation: py`The list iterator walks by index. Removing an item shifts the rest left, so the item after each removed one is skipped. Build a new list, or loop over a copy (\`for e in emails[:]\`).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'int' object is not iterable`,
      cause: py`Something that isn't a collection was used in a \`for\` loop, \`list()\`, unpacking or \`in\` — often \`for i in len(items)\` or a function that returned a number instead of a list.`,
      fix: py`Loop over \`range(len(items))\` (or better, \`enumerate(items)\`), or check what the function really returns.`,
    },
    {
      symptom: py`TypeError: 'list' object is not an iterator`,
      cause: py`\`next()\` was called on an iterable (list, str, dict, range) rather than an iterator.`,
      fix: py`Call \`it = iter(collection)\` once and then \`next(it)\`.`,
    },
    {
      symptom: py`TypeError: iter() returned non-iterator of type 'list'`,
      cause: py`A class's \`__iter__\` returned a list (or another iterable) instead of an iterator.`,
      fix: py`Return \`iter(self.items)\`, return \`self\` (if the class defines \`__next__\`), or make \`__iter__\` a generator with \`yield\`.`,
    },
    {
      symptom: py`StopIteration (a traceback ending with just this line)`,
      cause: py`A bare \`next(it)\` was called on an exhausted iterator outside a loop — e.g. reading a header from an empty file with \`next(reader)\`.`,
      fix: py`Pass a default — \`next(it, None)\` — and handle it, or catch \`StopIteration\` right where you call \`next()\`.`,
    },
    {
      symptom: py`RuntimeError: dictionary changed size during iteration`,
      cause: py`Keys were added to or deleted from a dict (or set) inside a loop over that same dict.`,
      fix: py`Loop over a snapshot — \`for key in list(sessions):\` — or build a new dict: \`{k: v for k, v in sessions.items() if not expired(v)}\`.`,
    },
    {
      symptom: py`The second loop over the data prints nothing, with no error.`,
      cause: py`The data is an iterator (a \`map\`/\`zip\`/\`filter\` result, a file, a generator) that the first loop already exhausted.`,
      fix: py`Check with \`iter(data) is data\`. Convert to a list once, or re-create the iterator (re-open the file, call the function again).`,
    },
  ],
  bestPractices: [
    'Loop with for; reach for iter()/next() only when you need manual control, such as skipping a header or taking the first match.',
    'Use next(iterator, default) instead of catching StopIteration around a single call.',
    'Make collection classes return a fresh iterator from __iter__; only iterators should return self.',
    'Once __next__ raises StopIteration, keep raising it on every later call.',
    'Never resize a list, dict or set while iterating over it — build a new one or iterate over a copy.',
    'Accept any Iterable in functions that read their input once; convert to a list at the top if you need several passes.',
    'Prefer a generator function over a hand-written iterator class unless you need extra methods.',
  ],
  useCases: [
    'Reading large files, CSV rows or database results one record at a time.',
    'Skipping a header line: header = next(reader) before looping over the rest.',
    'Finding the first match: next((u for u in users if u.active), None).',
    'Custom collections (playlists, trees, paginated API results) that work with for, list() and sum().',
    'Reading user input until a sentinel: for line in iter(input, "quit").',
  ],
  comparison: {
    title: 'Iterable vs iterator',
    headers: ['', 'iterable', 'iterator'],
    rows: [
      ['what it is', 'something you can loop over', 'the object that does the looping'],
      ['required method(s)', '__iter__() returning an iterator', '__next__() plus __iter__() returning self'],
      ['remembers a position?', 'no', 'yes'],
      ['loop over it twice?', 'yes — each loop gets a fresh iterator', 'no — the second loop finds it exhausted'],
      ['examples', 'list, str, dict, set, range, dict views', 'list_iterator, zip, map, filter, enumerate, files, generators'],
      ['works with next()?', 'no (TypeError)', 'yes'],
    ],
    note: py`Every iterator is also an iterable (its \`__iter__\` returns itself), but not every iterable is an iterator.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'iterators-q1',
      type: 'mcq',
      prompt: 'Which statement about iterables and iterators is true?',
      options: [
        { text: 'Every iterable is an iterator.', why: 'A list is iterable but not an iterator: next([1, 2]) raises TypeError.' },
        'Every iterator is an iterable, but not every iterable is an iterator.',
        { text: 'Iterators can be reset to the beginning with iter().', why: 'iter(iterator) returns the same iterator, still at its current position. You need a fresh iterator from the original iterable.' },
        { text: 'A range object is an iterator.', why: 'range is a reusable iterable: iter(range(3)) returns a separate range_iterator.' },
      ],
      answer: 1,
      explanation: py`Iterators implement \`__next__\` and an \`__iter__\` that returns \`self\`, so they can be used wherever an iterable is expected. Lists, strings, dicts and ranges are iterables that create a new iterator on demand.`,
    },
    {
      id: 'iterators-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`prices = [3, 5, 8]
doubled = map(lambda p: p * 2, prices)
print(list(doubled))
print(list(doubled))`,
      options: [
        { text: '[6, 10, 16] then [6, 10, 16]', why: 'map() returns an iterator, not a list. The first list() drains it.' },
        '[6, 10, 16] then []',
        { text: '<map object ...> then <map object ...>', why: 'list() consumes the map iterator and builds a list of its items.' },
        { text: '[6, 10, 16] then StopIteration', why: 'list() catches StopIteration and simply returns an empty list.' },
      ],
      answer: 1,
      explanation: py`\`map\` is a lazy, single-pass iterator. The first \`list()\` pulls every item out; the second finds it already exhausted and quietly builds \`[]\`.`,
    },
    {
      id: 'iterators-q3',
      type: 'output',
      prompt: 'Predict both lines.',
      code: py`it = iter([10, 20, 30, 40])
print(20 in it)
print(next(it))`,
      answer: py`True
30`,
      accept: ['True 30'],
      explanation: py`\`in\` on an iterator calls \`next()\` until it finds \`20\`, consuming \`10\` and \`20\`. The iterator now sits just after \`20\`, so \`next(it)\` returns \`30\`.`,
    },
    {
      id: 'iterators-q4',
      type: 'output',
      prompt: 'A loop and `next()` share one iterator. What is printed?',
      code: py`letters = iter("abc")
for ch in letters:
    print(ch, next(letters, "-"))`,
      options: [
        { text: 'a b / b c / c -', why: 'The next() call inside the body advances the same iterator the loop uses, so "b" is never seen by the loop itself.' },
        'a b / c -',
        { text: 'a a / b b / c c', why: 'next(letters) does not return the current item again — it moves forward.' },
        { text: 'StopIteration error', why: 'next(letters, "-") has a default, so it returns "-" instead of raising.' },
      ],
      answer: 1,
      explanation: py`Iteration 1: the loop takes \`a\`, the body's \`next\` takes \`b\` → \`a b\`. Iteration 2: the loop takes \`c\`, the body's \`next\` finds nothing and returns \`"-"\` → \`c -\`. Then the loop's \`next\` raises \`StopIteration\` and the loop ends. (Each "/" is a line break.)`,
    },
    {
      id: 'iterators-q5',
      type: 'bug',
      prompt: '`for n in Countdown(3): print(n)` prints 3, 2, 1 and then `None` forever. Click the line that causes it.',
      code: py`class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            return None
        self.current -= 1
        return self.current + 1`,
      answerLine: 10,
      explanation: py`Returning \`None\` hands the loop one more item — the loop has no idea that it means "done". The end of iteration must be signalled with \`raise StopIteration\`.`,
    },
    {
      id: 'iterators-q6',
      type: 'fill',
      prompt: 'Fill the blanks so this `while` loop does exactly what `for task in tasks: print(task)` does.',
      code: py`tasks = ["wash", "dry", "fold"]
it = ___(tasks)
while True:
    try:
        task = ___(it)
    except ___:
        break
    print(task)`,
      answer: [['iter'], ['next'], ['StopIteration']],
      explanation: py`A \`for\` loop gets an iterator once with \`iter()\`, calls \`next()\` on every pass, and stops when \`StopIteration\` is raised.`,
    },
    {
      id: 'iterators-q7',
      type: 'short',
      prompt: 'Why should a collection class (like a playlist) return a *new* iterator from `__iter__` instead of returning `self`?',
      answer: py`Because the position belongs to each loop, not to the collection. If \`__iter__\` returns \`self\`, every loop shares one position: the second loop over the playlist finds it already exhausted, and nested loops (e.g. comparing every pair of songs) break. Returning a fresh iterator — \`iter(self.songs)\`, a new iterator object, or a generator — gives each loop its own independent bookmark.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'paginator',
      title: 'Page through results',
      difficulty: 'intermediate',
      prompt: py`Search results are shown a page at a time. Write an **iterator class** \`Paginator(items, page_size)\`:

- \`items\` can be any iterable (list, range, …); store it as a list.
- Each \`next()\` returns the next page as a **list** of up to \`page_size\` items. \`list(Paginator([1, 2, 3, 4, 5], 2))\` → \`[[1, 2], [3, 4], [5]]\`.
- When no items remain, raise \`StopIteration\` — and keep raising it on later calls.
- It is an iterator: \`iter(p) is p\`.`,
      files: {
        'main.py': py`class Paginator:
    def __init__(self, items, page_size):
        self.items = list(items)
        self.page_size = page_size
        # TODO: remember where the next page starts

    def __iter__(self):
        return self

    def __next__(self):
        # TODO: return the next page, or raise StopIteration
        raise StopIteration


for page in Paginator(range(1, 8), 3):
    print(page)
`,
      },
      hints: [
        'The iterator needs one extra piece of state: the index where the next page starts. Initialise it to 0 in __init__.',
        'In __next__, if that index is past the end of self.items, raise StopIteration. Otherwise slice out one page and move the index forward by page_size.',
        'page = self.items[self.position:self.position + self.page_size]; self.position += self.page_size; return page',
      ],
      solution: {
        explanation: py`The only state an iterator needs is "where am I?" — here \`self.position\`. Each \`__next__\` call slices one page (slicing past the end of a list is safe and just returns fewer items) and advances the position. Once the position reaches the end, every further call raises \`StopIteration\`, which is exactly what the protocol requires, so \`for\`, \`list()\` and \`next(p, default)\` all behave correctly.`,
        files: {
          'main.py': py`class Paginator:
    def __init__(self, items, page_size):
        self.items = list(items)
        self.page_size = page_size
        self.position = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.position >= len(self.items):
            raise StopIteration
        page = self.items[self.position:self.position + self.page_size]
        self.position += self.page_size
        return page


for page in Paginator(range(1, 8), 3):
    print(page)
`,
        },
      },
      tests: [
        { name: 'pages of 2', code: py`assert list(Paginator([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]]` },
        { name: 'accepts any iterable, e.g. a range', code: py`assert list(Paginator(range(6), 3)) == [[0, 1, 2], [3, 4, 5]]` },
        { name: 'is its own iterator and next() works', code: py`p = Paginator(["a", "b", "c"], 2)
assert iter(p) is p
assert next(p) == ["a", "b"] and next(p) == ["c"]` },
        { name: 'stays exhausted', code: py`p = Paginator([1, 2], 5)
assert list(p) == [[1, 2]]
assert next(p, "done") == "done" and next(p, "done") == "done"` },
        { name: 'no items gives no pages', code: py`assert list(Paginator([], 3)) == []` },
      ],
    },
    {
      id: 'loop-without-for',
      title: 'Loops without for',
      difficulty: 'intermediate',
      prompt: py`Prove you know what \`for\` does by writing two functions **without** any \`for\` loop or comprehension — only \`iter()\`, \`next()\`, \`while\` and \`try\`/\`except\`:

1. \`manual_total(numbers)\` returns the sum of any iterable of numbers (don't use \`sum()\`). \`manual_total(range(5))\` → \`10\`.
2. \`take(iterable, n)\` returns a **list** of the first \`n\` items (fewer if the iterable runs out). It must not pull more than \`n\` items, so on a shared iterator the rest stay available: after \`it = iter([1, 2, 3, 4]); take(it, 2)\`, \`next(it)\` is \`3\`.`,
      files: {
        'main.py': py`def manual_total(numbers):
    # TODO: iter() + while + next() + StopIteration
    return 0


def take(iterable, n):
    # TODO: pull at most n items
    return []


print(manual_total([3, 4, 5]))
print(take("python", 3))
`,
      },
      hints: [
        'Both functions start with iterator = iter(...). A while True loop with try: next(iterator) / except StopIteration: is your for loop.',
        'For take, loop while len(result) < n, so you never call next() more than n times. Break out of the loop on StopIteration.',
        'manual_total: total += next(iterator) inside try, return total in the except branch. take: result.append(next(iterator)) inside try, break in except.',
      ],
      solution: {
        explanation: py`Both functions are a \`for\` loop with the disguise removed: get an iterator once, call \`next()\` repeatedly, stop on \`StopIteration\`. \`manual_total\` can simply \`return\` from the \`except\` branch. \`take\` checks its limit **before** each \`next()\` call, so it never consumes an item it won't return — that's what keeps \`next(it)\` at \`3\` in the shared-iterator test. Because both functions only use \`iter()\`/\`next()\`, they work with lists, strings, ranges, files and generators alike.`,
        files: {
          'main.py': py`def manual_total(numbers):
    iterator = iter(numbers)
    total = 0
    while True:
        try:
            value = next(iterator)
        except StopIteration:
            return total
        total += value


def take(iterable, n):
    iterator = iter(iterable)
    result = []
    while len(result) < n:
        try:
            result.append(next(iterator))
        except StopIteration:
            break
    return result


print(manual_total([3, 4, 5]))
print(take("python", 3))
`,
        },
      },
      tests: [
        { name: 'manual_total adds a list', code: py`assert manual_total([3, 4, 5]) == 12` },
        { name: 'manual_total works on any iterable', code: py`assert manual_total(range(5)) == 10 and manual_total(iter([2.5, 2.5])) == 5.0 and manual_total([]) == 0` },
        { name: 'take returns the first n items', code: py`assert take("python", 3) == ["p", "y", "t"]` },
        { name: 'take stops early when the iterable runs out', code: py`assert take([1], 5) == [1] and take([], 2) == []` },
        { name: 'take does not consume extra items', code: py`it = iter([1, 2, 3, 4])
assert take(it, 2) == [1, 2]
assert next(it) == 3` },
        { name: 'no for loops, comprehensions or sum()', code: py`import re
code_part = files["main.py"].split("print(")[0]
src = "\n".join(line.split("#")[0] for line in code_part.splitlines())
assert not re.search(r"\bfor\b", src), 'Use iter(), next() and while instead of for'
assert "sum(" not in src, 'Add the numbers yourself instead of calling sum()'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'iterators-iterable-vs-iterator',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between an iterable and an iterator in Python?',
      answer: 'An iterable can produce an iterator (it has __iter__); an iterator produces items one at a time with __next__, remembers its position, raises StopIteration when done, and returns itself from __iter__. Iterables like lists can be looped many times; iterators are single-pass.',
      explanation: py`\`list\`, \`str\`, \`dict\` and \`range\` are iterables: each \`iter()\` call returns a new, independent iterator. \`zip\`, \`map\`, files and generators are iterators: \`iter(it) is it\`, and once exhausted they stay exhausted.`,
      code: { lang: 'python', code: py`songs = ["Intro", "Verse"]
a, b = iter(songs), iter(songs)
print(next(a), next(a), next(b))   # Intro Verse Intro — independent positions
print(iter(a) is a)                # True — an iterator is its own iterator` },
      whyAsked: 'The distinction underlies for loops, generators and several classic bugs (empty second loops, shared positions).',
      mistakes: ['Using the two words interchangeably', 'Saying a list is an iterator', 'Not mentioning that iterators are exhausted after one pass'],
      followUps: ['How do you check whether something is an iterator?', 'What does a for loop do under the hood?', 'Is a generator an iterable or an iterator?'],
      modelAnswer: 'An iterable is anything that can give you an iterator — technically it has an __iter__ method, like lists, strings, dicts and ranges. An iterator is the object that actually walks through the items: it has __next__, which returns the next item or raises StopIteration, and an __iter__ that returns itself. The key practical difference is state: a list can be looped over many times because each loop gets a fresh iterator, while an iterator such as a zip result, a file or a generator remembers its position and is used up after one pass. A quick test is iter(x) is x — true only for iterators.',
    },
    {
      id: 'iterators-for-desugared',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain step by step what Python does when it executes `for item in container: body`. Where does the loop\'s `else` clause fit in?',
      answer: 'It calls iter(container) once to get an iterator, then repeatedly calls next() on it, binding the result to item and running the body. When next() raises StopIteration the loop ends quietly and runs the else block (if any). break skips the else.',
      explanation: py`Desugared: \`_it = iter(container)\`, then \`while True: try: item = next(_it) except StopIteration: break\`, followed by the body. The \`else:\` clause runs when the loop ends because the iterator was exhausted, not when \`break\` was used. \`iter()\` falls back to \`__getitem__\` with 0, 1, 2… if there's no \`__iter__\`.`,
      code: { lang: 'python', code: py`_it = iter(["wash", "dry"])
while True:
    try:
        item = next(_it)
    except StopIteration:
        break          # + run the for-loop's else block here
    print(item)` },
      whyAsked: 'Checks that you understand the protocol rather than treating for as magic.',
      mistakes: ['Saying for loops use indexes like C', 'Forgetting that iter() is called only once', 'Thinking StopIteration is an error the loop "handles" and logs'],
      followUps: ['Why can you loop over a file?', 'What happens if __next__ never raises StopIteration?', 'How does the sequence protocol fallback work?'],
      modelAnswer: 'A for loop first calls iter on the container, exactly once, to get an iterator. Then, on every pass, it calls next on that iterator and binds the result to the loop variable before running the body. When the iterator has nothing left it raises StopIteration; the loop catches that internally and finishes normally, which is when an else clause would run — a break skips the else. So a for loop is really a while-true loop around next with a try/except StopIteration. That is why any object implementing __iter__ and __next__ works with for, and why it works for lists, files and generators alike.',
    },
    {
      id: 'iterators-double-pass',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: '`shares(values)` works in unit tests that pass lists, but in production it returns `[]` when called as `shares(row["amount"] for row in rows)`. Why, and how do you fix it?',
      code: { lang: 'python', code: py`def shares(values):
    total = sum(values)
    return [v / total for v in values]


print(shares([1, 3]))                       # [0.25, 0.75]
print(shares(x for x in [1, 3]))            # []` },
      answer: 'The function iterates its argument twice. A generator (or map/zip/file) is a single-pass iterator: sum() exhausts it, so the comprehension sees nothing. Convert once with values = list(values), or reject iterators explicitly.',
      explanation: py`Lists create a fresh iterator for each pass, so the bug is invisible with lists. Fixes: (1) \`values = list(values)\` at the top — simple and works for any finite input; (2) raise \`TypeError\` if \`iter(values) is values\`; (3) redesign to need only one pass. Also add a test that passes a generator. There's a second latent bug: \`total\` can be zero.`,
      whyAsked: 'A realistic production bug that only appears with certain input types; tests whether you think about the protocol, not just lists.',
      mistakes: ['Blaming sum()', 'Suggesting itertools.tee without mentioning it buffers everything anyway', 'Not adding a regression test with a generator'],
      followUps: ['How would you type-hint this function?', 'What if the input is too large to fit in memory?', 'What does itertools.tee do?'],
      modelAnswer: 'The function walks over its argument twice: once inside sum and again in the list comprehension. With a list that is fine, because each pass gets a fresh iterator. A generator expression is an iterator, so sum consumes it completely and the comprehension finds nothing, returning an empty list without any error. I would fix it by materialising the input once at the top, values = list(values), or, if callers should never pass iterators, by raising TypeError when iter(values) is values. Then I would add a regression test that passes a generator, and also handle a zero total.',
    },
    {
      id: 'iterators-getitem-fallback',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'A class defines `__getitem__` but not `__iter__`. Can you loop over its instances? Does `isinstance(obj, collections.abc.Iterable)` agree? What is the reliable way to check iterability?',
      answer: 'Yes: iter() falls back to the legacy sequence protocol, calling __getitem__ with 0, 1, 2, … until IndexError. But isinstance(obj, Iterable) returns False because the ABC only checks for __iter__. The reliable check is to call iter(obj) and catch TypeError.',
      explanation: py`\`collections.abc.Iterable\` uses \`__subclasshook__\` to look for \`__iter__\` only. The docs state that the only reliable way to determine whether an object is iterable is to call \`iter(obj)\`. Note also that \`iter()\` looks up special methods on the **type**, so assigning \`obj.__iter__ = ...\` on an instance has no effect.`,
      code: { lang: 'python', code: py`from collections.abc import Iterable


class Shelf:
    def __getitem__(self, i):
        if i >= 2:
            raise IndexError
        return f"book {i}"


print(list(Shelf()), isinstance(Shelf(), Iterable))   # ['book 0', 'book 1'] False` },
      whyAsked: 'Probes depth on the data model and the difference between ABC checks and actual protocol behaviour.',
      mistakes: ['Saying you must define __iter__ to be iterable', 'Relying on hasattr(obj, "__iter__") or the ABC as the definitive test', 'Thinking special methods are looked up on the instance'],
      followUps: ['Why are special methods looked up on the type?', 'What does __contains__ do if missing — how does in work then?', 'When would you register a class with an ABC?'],
      modelAnswer: 'Yes, you can loop over it. If a type has no __iter__, iter falls back to the old sequence protocol and calls __getitem__ with 0, 1, 2 and so on until it raises IndexError. The Iterable ABC, however, only checks for __iter__, so isinstance returns False even though for works. The documentation says the only reliable test is to call iter on the object and catch TypeError. One more subtlety: special methods are looked up on the class, not the instance, so patching __iter__ onto an instance does nothing.',
    },
    {
      id: 'iterators-fibonacci-class',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write an iterator class `Fib(limit)` that yields the Fibonacci numbers **smaller than** `limit`, starting `0, 1, 1, 2, …`. `list(Fib(20))` → `[0, 1, 1, 2, 3, 5, 8, 13]`. It must follow the iterator protocol (`iter(f) is f`, stays exhausted).',
      answer: 'Keep (a, b) state; __next__ raises StopIteration when a >= limit, otherwise returns a and advances a, b = b, a + b.',
      explanation: py`The iterator holds the two most recent numbers. Each \`__next__\` checks the limit **before** producing a value, returns the current one and shifts the pair forward with tuple assignment. Once \`a\` reaches the limit, \`a\` never changes again, so every later call raises \`StopIteration\` too. A generator function would be shorter — see [generators](lesson:generators) — but this shows the protocol explicitly.`,
      starter: { files: { 'main.py': py`class Fib:
    def __init__(self, limit):
        self.limit = limit
        # TODO: state

    def __iter__(self):
        return self

    def __next__(self):
        # TODO
        raise StopIteration


print(list(Fib(20)))
` } },
      tests: [
        { name: 'Fibonacci numbers below 20', code: py`assert list(Fib(20)) == [0, 1, 1, 2, 3, 5, 8, 13]` },
        { name: 'limit 1 gives only 0', code: py`assert list(Fib(1)) == [0]` },
        { name: 'follows the protocol', code: py`f = Fib(3)
assert iter(f) is f
assert next(f) == 0 and list(f) == [1, 1, 2]
assert next(f, None) is None` },
      ],
      solution: { files: { 'main.py': py`class Fib:
    def __init__(self, limit):
        self.limit = limit
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self):
        if self.a >= self.limit:
            raise StopIteration
        value = self.a
        self.a, self.b = self.b, self.a + self.b
        return value


print(list(Fib(20)))
` } },
      hints: ['Store the current pair of numbers as attributes in __init__.', 'Check the limit first; then remember the value to return, advance with a, b = b, a + b, and return it.'],
      whyAsked: 'Shows you can implement the protocol from scratch, including the end condition and exhaustion behaviour.',
      mistakes: ['Returning None at the end instead of raising StopIteration', 'Checking the limit after advancing, so the first value over the limit slips out', 'Putting the state in __iter__ so it resets unexpectedly'],
      followUps: ['Rewrite it as a generator function.', 'How would you make an iterable FibSequence that can be looped twice?', 'How would you make it infinite and take the first 10 with itertools.islice?'],
      modelAnswer: 'I keep the two most recent Fibonacci numbers as attributes, a and b, starting at 0 and 1. __iter__ returns self because this object is the iterator. In __next__ I first check whether a has reached the limit and raise StopIteration if so; otherwise I remember a, advance with a, b = b, a + b, and return the remembered value. Because a never changes after the limit is reached, later calls keep raising StopIteration, which is what the protocol requires. In real code I would probably write this as a three-line generator function instead.',
    },
    {
      id: 'iterators-session-cleanup',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A background job removes expired sessions with `for sid in sessions: if expired(sessions[sid]): del sessions[sid]` and crashes with `RuntimeError: dictionary changed size during iteration`. Explain and fix it.',
      answer: 'Deleting from a dict while iterating over it invalidates the iterator, and CPython detects the size change and raises. Iterate over a snapshot of the keys (for sid in list(sessions)) or rebuild the dict with a comprehension.',
      explanation: py`A dict iterator walks the dict's internal table; resizing it mid-loop would make the walk skip or repeat entries, so Python refuses. Lists have no such check — they silently skip items instead. Fixes: \`for sid in list(sessions): ...\` (copy keys first), or \`sessions = {sid: s for sid, s in sessions.items() if not expired(s)}\` (new dict; note this rebinds the name, so other references to the old dict won't see the change — use \`sessions.clear(); sessions.update(...)\` if needed).`,
      whyAsked: 'Mutating while iterating is a frequent real-world bug; the follow-ups test aliasing awareness.',
      mistakes: ['Catching the RuntimeError and ignoring it', 'Thinking the same code on a list would be safe'],
      followUps: ['What happens if you do the same with a list?', 'Is modifying values (not keys) during iteration allowed?', 'How would you do this safely if other threads also modify the dict?'],
      modelAnswer: 'The loop is iterating over the dict while deleting from it. A dict iterator walks the internal hash table, and changing the number of entries could make it skip or repeat keys, so Python detects the size change and raises RuntimeError. The fix is to iterate over a snapshot of the keys, for sid in list(sessions), and delete from the real dict, or to build a new dict with a comprehension that keeps only live sessions. Updating the values of existing keys is fine; it is adding or removing keys that breaks iteration. With lists the same mistake does not raise, it silently skips elements, which is even worse.',
    },
  ],

  takeaways: [
    'An iterable can produce an iterator (__iter__); an iterator produces items one at a time (__next__) and remembers its position.',
    'A for loop calls iter() once, then next() on every pass, and ends quietly when StopIteration is raised.',
    'Iterators are single-pass: zip, map, filter, enumerate, files and generators are empty the second time.',
    'Collections should return a fresh iterator from __iter__; only iterators return self.',
    'Use next(it, default) to ask for one item safely, and iter(callable, sentinel) to repeat a call until a stop value.',
    'Don\'t resize a list, dict or set while iterating over it — iterate a copy or build a new one.',
  ],
}
