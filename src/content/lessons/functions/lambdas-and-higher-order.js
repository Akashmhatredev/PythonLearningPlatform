// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PLAYLIST = py`songs = [
    {"title": "Blue Skies", "artist": "Ada", "plays": 1520, "seconds": 215},
    {"title": "Night Drive", "artist": "Ben", "plays": 980, "seconds": 187},
    {"title": "Paper Moon", "artist": "Cy", "plays": 2210, "seconds": 242},
    {"title": "Echoes", "artist": "Ada", "plays": 640, "seconds": 301},
]


def describe(song):
    """Return 'Title (m:ss)' for a song."""
    minutes, seconds = divmod(song["seconds"], 60)
    return f"{song['title']} ({minutes}:{seconds:02d})"


def apply_to_all(func, items):
    """A higher-order function: it takes another function as an argument."""
    results = []
    for item in items:
        results.append(func(item))
    return results


most_played = sorted(songs, key=lambda song: song["plays"], reverse=True)
print("Top song:", most_played[0]["title"])

shortest = min(songs, key=lambda song: song["seconds"])
print("Shortest:", describe(shortest))

print(apply_to_all(describe, songs))

long_songs = filter(lambda song: song["seconds"] > 210, songs)
print("Over 3:30:", list(map(lambda song: song["title"], long_songs)))
`

export default {
  id: 'lambdas-and-higher-order',
  title: 'Lambdas & higher-order functions',
  summary: 'Functions are values you can pass, store and return; a lambda is a tiny one-expression function written inline — ideal for key functions in sorted(), min() and max(), and a first taste of map() and filter().',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['defining-functions', 'function-arguments', 'closures', 'list-operations'],
  related: ['map-filter-reduce', 'functools', 'functional-concepts', 'comprehensions', 'decorators', 'closures', 'dictionaries', 'clean-code', 'type-hints'],
  tags: ['lambda', 'anonymous function', 'higher-order functions', 'first-class functions', 'key function', 'sorted key', 'min max key', 'map', 'filter', 'callbacks', 'operator.itemgetter', 'dispatch table', 'functions as values', 'callable'],
  apis: [
    { name: 'lambda params: expression', summary: 'An expression that creates an unnamed function whose body is a single expression; its value is returned automatically.' },
    { name: 'sorted(iterable, *, key=None, reverse=False)', summary: 'Returns a new sorted list. key is a one-argument function called once per item; items are ordered by its results.' },
    { name: 'list.sort(*, key=None, reverse=False)', summary: 'Sorts a list in place with the same key/reverse options and returns None.' },
    { name: 'min(iterable, *, key=…) / max(iterable, *, key=…)', summary: 'Return the item with the smallest / largest key value.' },
    { name: 'map(function, iterable)', summary: 'A lazy iterator that yields function(item) for each item.' },
    { name: 'filter(function, iterable)', summary: 'A lazy iterator that yields the items for which function(item) is truthy.' },
    { name: 'operator.itemgetter / attrgetter', summary: 'Ready-made key functions: itemgetter(1) is like lambda x: x[1], attrgetter("name") like lambda x: x.name.' },
    { name: 'callable(obj)', summary: 'True if obj can be called like a function.' },
  ],
  docs: [
    { label: 'Language reference — lambda expressions', url: 'https://docs.python.org/3/reference/expressions.html#lambda' },
    { label: 'Python tutorial — lambda expressions', url: 'https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions' },
    { label: 'Sorting techniques — key functions', url: 'https://docs.python.org/3/howto/sorting.html#key-functions' },
    { label: 'Built-in functions — sorted(), min(), max(), map(), filter()', url: 'https://docs.python.org/3/library/functions.html#sorted' },
    { label: 'operator module', url: 'https://docs.python.org/3/library/operator.html' },
    { label: 'PEP 8 — programming recommendations (don\'t assign lambdas to names)', url: 'https://peps.python.org/pep-0008/#programming-recommendations' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In Python, a function is a **value** — an object, just like a number or a list. You can bind it to another name, put it in a list or dict, **pass it to another function**, and **return it from a function** (you did that with [closures](lesson:closures)). Functions that take or return other functions are called **higher-order functions**.`,
    py`You've already used one: \`sorted\` can take a \`key\` function that tells it *what to sort by*:`,
    { code: py`songs = [("Blue Skies", 215), ("Night Drive", 187), ("Paper Moon", 242)]


def length(song):
    return song[1]


print(sorted(songs, key=length))              # shortest first
print(sorted(songs, key=lambda song: song[1]))   # the same, written inline`, lang: 'python', title: 'a function passed as an argument' },
    py`The second line uses a **lambda**: a tiny function written as an *expression*, right where it's needed. \`lambda song: song[1]\` means "a function that takes \`song\` and returns \`song[1]\`". It's perfect for short, one-off jobs like this — and the wrong tool for anything longer, as you'll see.`,
  ],
  why: [
    py`**Customise behaviour without rewriting it.** \`sorted\` knows *how* to sort; you only tell it *what to compare*. One built-in handles songs by length, players by score, files by date — because you pass in the varying part as a function.`,
    py`**Less boilerplate.** Without lambdas, every tiny key function needs a name and three lines of \`def\`, usually far from where it's used. A lambda keeps a one-off rule right next to the call that uses it.`,
    py`**Reusable building blocks.** Higher-order functions let you write *patterns* once — "apply this to every item", "keep the items that pass this test", "retry this call" — and plug in the specific action each time. That's the core idea of [functional programming](lesson:functional-concepts) and of [decorators](lesson:decorators).`,
    py`**Everyday Python APIs expect it.** \`sorted\`, \`min\`, \`max\`, \`list.sort\`, \`map\`, \`filter\`, \`re.sub\`, GUI and web-framework callbacks, \`functools.reduce\`, thread pools — all take functions as arguments.`,
  ],
  eli15: [
    py`Imagine a robot that can sort any pile of things — but it doesn't know *what* matters to you. You hand it a little **instruction card**: "*look at the price*". Now it sorts by price. Hand it a different card — "*look at the name*" — and it sorts alphabetically. The robot is the higher-order function; the card is the function you pass in.`,
    py`A **lambda** is a sticky note you scribble on the spot instead of a printed card: \`lambda item: item["price"]\`. It's quick and perfect for a one-line instruction. But if the instruction needs a whole paragraph, a sticky note gets messy — write a proper, named card (\`def\`) instead.`,
    py`And because instruction cards are just things, you can keep them in a box (a list or dict), hand them to other robots, or have one robot *make* new cards for another (a function that returns a function).`,
  ],
  analogy: {
    title: 'Instruction cards for a sorting machine',
    body: [
      py`A warehouse sorting machine can line up any boxes, but it needs an instruction card saying which label to read. The machine never changes; the cards do. Some cards are printed and filed (named \`def\` functions); some are scribbled on sticky notes at the counter (lambdas).`,
      py`The machine reads each box's label exactly once, writes the label down, sorts by the labels, and hands back the boxes in that order — the boxes themselves aren't changed.`,
    ],
    mapping: [
      ['the sorting machine', 'sorted(), min(), max() — higher-order functions'],
      ['an instruction card', 'a function passed as key='],
      ['a printed, filed card', 'a named function made with def'],
      ['a sticky note scribbled on the spot', 'a lambda expression'],
      ['reading each box\'s label once', 'the key function is called once per item'],
      ['a box of cards to choose from', 'functions stored in a dict (a dispatch table)'],
      ['a card-printing machine', 'a function that returns a function (a factory)'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch sorted() and max() call your function',
    props: {
      code: py`def by_price(item):
    return item[1]


basket = [("tea", 2.1), ("cake", 3.5), ("milk", 0.9)]
cheapest_first = sorted(basket, key=by_price)   # pass the function, don't call it
print(cheapest_first)

priciest = max(basket, key=lambda item: item[1])
shout = str.upper                               # functions are values
print(shout(priciest[0]))
`,
      notes: {
        1: '`def` creates a function object and binds the name `by_price` to it — a value like any other.',
        6: 'No parentheses after `by_price`: we hand the **function itself** to `sorted`. Watch `sorted` call it once for each item.',
        2: 'Called by `sorted`, not by us. Each call returns the key (the price) for one item.',
        9: 'A lambda creates the same kind of function object — its name is `<lambda>`. `max` calls it once per item too.',
        10: '`str.upper` (no parentheses) is a function value; `shout` is now another name for it.',
      },
    },
    alt: 'A step-by-step trace. The Global frame gains by_price pointing to a function object and basket pointing to a list of three tuples. When sorted runs, three by_price frames appear one after another, each receiving one tuple and returning its price: 2.1, 3.5, 0.9. Then max calls a <lambda> frame three times in the same way. Finally shout is bound to str.upper and the program prints CAKE.',
    caption: py`You never call \`by_price\` yourself — \`sorted\` does, once per item. That's the essence of a higher-order function: you hand over **behaviour**, and the other function decides when to run it.`,
  },
  syntax: [
    py`#### Lambda syntax`,
    { code: py`square = lambda n: n * n            # shown for comparison only — see PEP 8 below


def square(n):                       # the same function, written with def
    return n * n


add = lambda a, b=1: a + b           # parameters work like def: defaults, *args, **kwargs
print(add(2), add(2, 5))             # 3 7

grade = lambda score: "pass" if score >= 50 else "fail"   # a conditional EXPRESSION is fine
print(grade(72))                     # pass`, lang: 'python', title: 'lambda parameters: expression' },
    py`- \`lambda\`, then parameters (no parentheses), a colon, and **one expression**.
- The expression's value is returned automatically — there is no \`return\` keyword.
- It creates an ordinary function object; its \`__name__\` is \`'<lambda>'\`, which is also what tracebacks show.`,
    py`#### What a lambda can't do`,
    py`The body must be a single *expression*. Statements are not allowed: no \`return\`, no assignment with \`=\`, no \`if\`/\`for\`/\`while\` blocks, no \`try\`, no docstring, no type annotations on parameters. \`lambda x: return x\` is a \`SyntaxError\`.`,
    { callout: 'tip', title: 'PEP 8: don\'t name a lambda', text: py`\`square = lambda n: n * n\` works, but PEP 8 recommends \`def square(n): return n * n\` instead. If a function deserves a name, \`def\` gives it a *real* one — shown in tracebacks and \`repr\` — plus room for a docstring and type hints. Lambdas are for passing **inline** as an argument. Linters flag named lambdas (pycodestyle/Ruff rule E731).` },
    py`#### Functions are values`,
    { code: py`def greet(name):
    return f"Hi {name}"


say = greet                          # a second name for the same function
print(say("Ada"))                    # Hi Ada
print(callable(say), say.__name__)   # True greet

actions = {"upper": str.upper, "lower": str.lower, "title": str.title}
print(actions["title"]("night drive"))   # Night Drive — look up a function, then call it`, lang: 'python', title: 'bind, store and look up functions' },
    py`A dict of functions like \`actions\` is called a **dispatch table**: a clean replacement for long \`if/elif\` chains that choose between behaviours.`,
    py`#### Key functions: sorted, list.sort, min, max`,
    { code: py`players = [("Ada", 91), ("Ben", 78), ("Cy", 91), ("Di", 85)]

print(sorted(players, key=lambda p: p[1]))                  # by score, lowest first
print(sorted(players, key=lambda p: p[1], reverse=True))    # highest first
print(sorted(players, key=lambda p: (-p[1], p[0])))         # score desc, then name A→Z
print(max(players, key=lambda p: p[1]))                     # ('Ada', 91): first of the ties
print(min(["kiwi", "fig", "banana"], key=len))              # fig — any one-arg function works

players.sort(key=lambda p: p[0])     # in place; returns None
print(players[0])                    # ('Ada', 91)`, lang: 'python', title: 'sorting by anything' },
    py`The key function receives **one item** and returns the value to compare. Returning a **tuple** sorts by several fields in order; negating a number flips just that field. Python's sort is **stable** — items with equal keys keep their original order — which is why \`(-score, name)\` gives a deterministic ranking.`,
    { code: py`from operator import itemgetter

players = [("Ada", 91), ("Ben", 78), ("Cy", 85)]
print(sorted(players, key=itemgetter(1)))   # same as key=lambda p: p[1]`, lang: 'python', title: 'ready-made key functions' },
    py`#### A first look at map and filter`,
    { code: py`prices = [2.5, 10.0, 7.25]

with_tax = map(lambda p: round(p * 1.2, 2), prices)   # apply a function to every item
print(list(with_tax))                                 # [3.0, 12.0, 8.7]

cheap = filter(lambda p: p < 8, prices)               # keep items where the function is truthy
print(list(cheap))                                    # [2.5, 7.25]`, lang: 'python', title: 'map transforms, filter selects' },
    py`\`map\` and \`filter\` return **lazy iterators**: nothing is computed until you loop over them (or wrap them in \`list()\`), and they can be consumed only once. Many Python programmers prefer [comprehensions](lesson:comprehensions) for the same jobs — \`[round(p * 1.2, 2) for p in prices]\`. The full story, plus \`reduce\` and the \`operator\` module, is in [map, filter & reduce](lesson:map-filter-reduce).`,
    py`#### Returning functions`,
    { code: py`def longer_than(seconds):
    """Return a test function for filter(): is a song longer than seconds?"""
    return lambda song: song[1] > seconds


songs = [("Blue Skies", 215), ("Night Drive", 187), ("Paper Moon", 242)]
print(list(filter(longer_than(200), songs)))   # Blue Skies and Paper Moon`, lang: 'python', title: 'a function that builds functions' },
    py`\`longer_than\` is a higher-order function in the other direction: it **returns** a function, which is a [closure](lesson:closures) over \`seconds\`.`,
  ],
  walkthrough: {
    title: 'Reading the playlist program line by line',
    lang: 'python',
    code: PLAYLIST,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 6], text: py`Each song is a dict. Sorting dicts directly would fail (\`'<' not supported between instances of 'dict' and 'dict'\`), so every sort below needs a key function.` },
      { lines: [15, 20], text: py`\`apply_to_all\` is a **higher-order function**: its first parameter \`func\` is a function, and line 19 calls it for each item. It's a hand-written version of what \`map\` does.` },
      { lines: [23, 24], text: py`\`key=lambda song: song["plays"]\` tells \`sorted\` to compare play counts; \`reverse=True\` puts the biggest first. \`sorted\` returns a **new** list and leaves \`songs\` untouched.` },
      { lines: [26, 27], text: py`\`min\` with a key returns the **whole item** whose key is smallest — the song dict, not the number 187 — so we can pass it straight to \`describe\`.` },
      { lines: [29, 29], text: py`\`describe\` is passed **without parentheses**: we hand over the function, and \`apply_to_all\` calls it four times.` },
      { lines: [31, 32], text: py`\`filter\` keeps songs whose lambda returns \`True\`; \`map\` turns each kept song into its title. Both are lazy, so \`list(...)\` is what actually runs them.` },
    ],
  },
  playground: {
    title: 'Playlist sorter',
    objective: 'Sort, pick and filter songs by passing functions around — then write a function that returns a function.',
    files: { 'main.py': PLAYLIST },
    expected: py`\`\`\`text
Top song: Paper Moon
Shortest: Night Drive (3:07)
['Blue Skies (3:35)', 'Night Drive (3:07)', 'Paper Moon (4:02)', 'Echoes (5:01)']
Over 3:30: ['Blue Skies', 'Paper Moon', 'Echoes']
\`\`\``,
    experiments: [
      {
        id: 'alphabetical',
        task: py`Create \`alphabetical\`: the songs sorted by **title**, A to Z. Print the first title.`,
        hint: py`Same as \`most_played\`, but the lambda returns \`song["title"]\` and you don't need \`reverse\`.`,
        tests: [
          { name: 'alphabetical is sorted by title', code: py`assert [s["title"] for s in ns.get("alphabetical", [])] == ["Blue Skies", "Echoes", "Night Drive", "Paper Moon"], 'alphabetical = sorted(songs, key=lambda song: song["title"])'` },
          { name: 'songs itself is unchanged', code: py`assert songs[0]["title"] == "Blue Skies" and songs[1]["title"] == "Night Drive"` },
        ],
        explain: py`Strings compare alphabetically (by Unicode code point, so capital letters sort before lower-case ones). \`sorted\` built a new list; the original \`songs\` order is untouched — use \`songs.sort(key=...)\` when you *want* to reorder in place.`,
      },
      {
        id: 'named-key',
        task: py`Replace the lambda in \`most_played\` with a named function \`by_plays(song)\` defined with \`def\`, and pass it as \`key=by_plays\`.`,
        hint: py`Define \`def by_plays(song): return song["plays"]\` above \`most_played\`, then write \`key=by_plays\` — no parentheses.`,
        tests: [
          { name: 'by_plays returns the play count', code: py`assert callable(ns.get('by_plays')) and by_plays(songs[0]) == 1520` },
          { name: 'most_played uses key=by_plays', code: py`assert "key=by_plays" in files["main.py"], 'Pass the function itself: key=by_plays'` },
          { name: 'the top song is still Paper Moon', code: py`assert most_played[0]["title"] == "Paper Moon"` },
        ],
        explain: py`A named key function can be reused, tested on its own and shows up by name in tracebacks. Writing \`key=by_plays()\` would *call* it with no arguments: \`TypeError: by_plays() missing 1 required positional argument: 'song'\`.`,
      },
      {
        id: 'two-level-sort',
        task: py`Create \`by_artist\`: songs sorted by **artist A→Z**, and within the same artist by **plays, highest first**.`,
        hint: py`Return a tuple from the key: \`lambda song: (song["artist"], -song["plays"])\`. The minus sign flips the order of the second field only.`,
        tests: [
          { name: 'sorted by artist, then plays descending', code: py`assert [(s["artist"], s["title"]) for s in ns.get("by_artist", [])] == [("Ada", "Blue Skies"), ("Ada", "Echoes"), ("Ben", "Night Drive"), ("Cy", "Paper Moon")]` },
        ],
        explain: py`Tuples compare item by item: first by artist, and only when artists are equal by the next field. Negating a number reverses just that field, so you don't need \`reverse=True\` (which would reverse *everything*).`,
      },
      {
        id: 'longer-than',
        task: py`Write \`longer_than(seconds)\` that **returns a function**: given a song, that function returns \`True\` if the song lasts more than \`seconds\`. Then use it: \`list(filter(longer_than(240), songs))\`.`,
        hint: py`\`def longer_than(seconds): return lambda song: song["seconds"] > seconds\`.`,
        tests: [
          { name: 'longer_than returns a function', code: py`assert callable(longer_than(240)), 'longer_than(240) should return a function'` },
          { name: 'the returned function tests the length', code: py`check = longer_than(240)
assert check(songs[2]) is True and check(songs[0]) is False` },
          { name: 'works with filter', code: py`assert [s["title"] for s in filter(longer_than(240), songs)] == ["Paper Moon", "Echoes"]` },
        ],
        explain: py`\`longer_than\` both **returns** a function and builds one that \`filter\` **receives** — higher-order in both directions. The returned lambda is a closure over \`seconds\`, so \`longer_than(240)\` and \`longer_than(200)\` are independent tests.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What sorted() does with a key function',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'items', label: 'items', note: 'tea 2.1 · cake 3.5 · milk 0.9', x: 110, y: 90, tone: 'paper' },
        { id: 'key', label: 'key(item)', note: 'called once per item', x: 380, y: 90, tone: 'yellow' },
        { id: 'keys', label: 'keys', note: '2.1 · 3.5 · 0.9', x: 650, y: 90, tone: 'blue' },
        { id: 'order', label: 'compare keys', note: 'stable sort', x: 650, y: 240, tone: 'blue' },
        { id: 'result', label: 'new list', note: 'milk · tea · cake', x: 250, y: 240, tone: 'kraft' },
      ],
      edges: [
        { from: 'items', to: 'key', label: 'each item' },
        { from: 'key', to: 'keys', label: 'returns' },
        { from: 'keys', to: 'order' },
        { from: 'order', to: 'result', label: 'original items, new order' },
      ],
      steps: [
        { focus: ['items'], text: py`\`sorted(basket, key=by_price)\` receives the list **and a function**. It doesn't know anything about tea or prices.` },
        { focus: ['key'], edges: ['items->key'], text: py`It calls your key function **once for each item** — three calls here, no matter how many comparisons the sort needs later.` },
        { focus: ['keys'], edges: ['key->keys'], text: py`Each call returns the value to compare: the price. Each key is remembered alongside its item.` },
        { focus: ['order'], edges: ['keys->order'], text: py`The sort compares only the **keys**. Items with equal keys keep their original order — the sort is *stable*. \`reverse=True\` flips the result.` },
        { focus: ['result'], edges: ['order->result'], text: py`A **new** list of the original items, in key order. The input list is unchanged (\`list.sort\` would reorder it in place and return \`None\`).` },
      ],
    },
    alt: 'Diagram of sorted with a key: the items tea 2.1, cake 3.5 and milk 0.9 each go once through key(item), producing keys 2.1, 3.5 and 0.9. The keys are compared by a stable sort, and the result is a new list of the original items in the order milk, tea, cake.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`lambda\` and \`def\` make **the same kind of object** — a function. The only differences are how you write them: \`def\` is a statement that also binds a name; \`lambda\` is an expression that just produces the function, so you can write it inside a call.`,
      { code: py`def double(n):
    return n * 2


triple = lambda n: n * 3

print(type(double), type(triple))       # <class 'function'> <class 'function'>
print(double.__name__, triple.__name__)  # double <lambda>`, lang: 'python', title: 'same type, different names' },
      py`Passing a function means passing the **object**, so never add parentheses: \`key=double\` hands over the function, \`key=double()\` calls it immediately and hands over its result.`,
    ],
    technical: [
      py`A lambda is evaluated when the expression runs, creating a new function object each time — inside a loop, one per iteration. It follows **exactly** the same scoping rules as \`def\`: it can read enclosing variables (a closure), and it binds them **late**, which is why lambdas made in a loop all see the loop variable's final value unless you bind it with a default (\`lambda x=x: ...\`). See [closures](lesson:closures).`,
      py`**Key functions are called once per element.** \`sorted\` computes all the keys first, then sorts by them — the Sorting HOWTO calls this out as why key functions are fast. That's also why \`key=\` replaced the old comparison-function (\`cmp\`) style from Python 2; if you really have a two-argument comparison, wrap it with \`functools.cmp_to_key\`. Sorts are guaranteed **stable**, so you can sort by a secondary key first and the primary key second.`,
      py`\`map\` and \`filter\` return **iterators**. They do no work until consumed, produce each value on demand, and are exhausted after one pass — \`list(m)\` a second time gives \`[]\`. Printing one shows \`<map object at 0x…>\`, not its contents. See [iterators](lesson:iterators).`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, \`operator.itemgetter\`, \`attrgetter\` and the \`operator\` arithmetic functions are implemented in C, so they're usually a bit faster than an equivalent lambda as a sort key — and they pickle, which lambdas don't. The difference rarely matters; measure before choosing for speed ([profiling](lesson:profiling)).` },
    ],
    production: [
      py`**Lambdas are for short, obvious, one-off functions** — a sort key, a tiny callback. The moment a lambda grows a nested conditional expression, is used in more than one place, or needs explaining, give it a name with \`def\`: you get a docstring, type hints, a readable traceback line and something you can unit-test.`,
      py`**Prefer comprehensions to map/filter with lambdas** for simple transformations: \`[s["title"] for s in songs if s["seconds"] > 210]\` reads in one pass. \`map\` shines when you already have a named function: \`map(str.strip, lines)\`.`,
      py`**Dispatch tables** (dicts of functions) keep command handlers, parsers and calculators flat and extensible — add a key instead of another \`elif\`. Validate the key before calling (\`KeyError\` otherwise).`,
      py`**Type hints for function parameters** use \`Callable\` from \`collections.abc\`: \`def apply_to_all(func: Callable[[Song], str], items: list[Song]) -> list[str]\` — see [type hints](lesson:type-hints).`,
      py`**Debuggability:** every lambda in a traceback is called \`<lambda>\`. In code that runs callbacks far from where they were created (event systems, task queues), named functions make production errors much easier to trace.`,
    ],
  },
  mistakes: [
    {
      title: 'Calling the function instead of passing it',
      wrong: { code: py`def by_score(player):
    return player[1]


players = [("Ada", 91), ("Ben", 78)]
ranked = sorted(players, key=by_score())   # TypeError: by_score() missing 1 required positional argument: 'player'`, lang: 'python', static: true },
      right: { code: py`def by_score(player):
    return player[1]


players = [("Ada", 91), ("Ben", 78)]
ranked = sorted(players, key=by_score)
print(ranked)`, lang: 'python' },
      explanation: py`Parentheses call. A higher-order function needs the function object, so write its name alone: \`key=by_score\`.`,
    },
    {
      title: 'Using the result of list.sort()',
      wrong: { code: py`scores = [70, 92, 85]
best_first = scores.sort(reverse=True)
print(best_first)            # None`, lang: 'python' },
      right: { code: py`scores = [70, 92, 85]
best_first = sorted(scores, reverse=True)   # new list
print(best_first)                           # [92, 85, 70]`, lang: 'python' },
      explanation: py`\`list.sort()\` sorts **in place** and returns \`None\` (a Python convention for methods that mutate). Use \`sorted()\` when you want a new list back.`,
    },
    {
      title: 'Naming a lambda instead of writing def',
      wrong: { code: py`format_price = lambda amount: f"{amount:.2f} EUR"
print(format_price(3.5))`, lang: 'python' },
      right: { code: py`def format_price(amount):
    """Return amount formatted with two decimals and the currency."""
    return f"{amount:.2f} EUR"


print(format_price(3.5))`, lang: 'python' },
      explanation: py`Both work, but the lambda's real name is \`<lambda>\` (in tracebacks and \`repr\`) and it can't have a docstring or annotations. PEP 8 says: if you're going to name it, use \`def\`.`,
    },
    {
      title: 'Squeezing statements or complex logic into a lambda',
      wrong: { code: py`shipping = lambda order: 0 if order["total"] > 50 else (3.99 if order["country"] == "UK" else (7.99 if order["express"] else 5.99))`, lang: 'python' },
      right: { code: py`def shipping(order):
    """Return the shipping cost for an order."""
    if order["total"] > 50:
        return 0
    if order["country"] == "UK":
        return 3.99
    return 7.99 if order["express"] else 5.99


print(shipping({"total": 20, "country": "FR", "express": True}))   # 7.99`, lang: 'python' },
      explanation: py`A lambda can only hold one expression, so complex logic turns into nested conditional expressions that are hard to read, test and debug. Use a named function with ordinary \`if\` statements.`,
    },
    {
      title: 'Printing or reusing a map/filter result',
      wrong: { code: py`titles = map(str.title, ["blue skies", "echoes"])
print(titles)          # <map object at 0x...>
print(list(titles))    # ['Blue Skies', 'Echoes']
print(list(titles))    # [] — already used up`, lang: 'python' },
      right: { code: py`titles = list(map(str.title, ["blue skies", "echoes"]))
print(titles)          # ['Blue Skies', 'Echoes']
print(titles)          # still there`, lang: 'python' },
      explanation: py`\`map\` and \`filter\` are lazy, single-use iterators. Convert to a list once if you need to print the values or use them more than once.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: by_plays() missing 1 required positional argument: 'song'`,
      cause: py`The key function was called (\`key=by_plays()\`) instead of passed (\`key=by_plays\`).`,
      fix: py`Remove the parentheses after the function's name.`,
    },
    {
      symptom: py`TypeError: '<' not supported between instances of 'dict' and 'dict'`,
      cause: py`You sorted (or used \`min\`/\`max\` on) items that can't be compared with each other, such as dicts.`,
      fix: py`Pass a \`key\` that returns something comparable: \`key=lambda song: song["plays"]\`.`,
    },
    {
      symptom: py`The output shows <map object at 0x...> or <filter object at 0x...>`,
      cause: py`\`map\` and \`filter\` return lazy iterators, not lists.`,
      fix: py`Wrap the result in \`list(...)\`, loop over it, or use a list comprehension instead.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not subscriptable`,
      cause: py`A variable holds the result of \`list.sort()\`, which is always \`None\`.`,
      fix: py`Use \`sorted(...)\` to get a new list, or call \`.sort()\` on its own line and keep using the original list.`,
    },
    {
      symptom: py`TypeError: <lambda>() missing 1 required positional argument: 'b'`,
      cause: py`The lambda's parameters don't match how it's called — e.g. a two-parameter lambda used as a \`key\`, which always receives exactly one item.`,
      fix: py`Check the expected signature: key functions take one argument; \`filter\`'s function takes one; \`functools.reduce\`'s takes two.`,
    },
    {
      symptom: py`SyntaxError: invalid syntax (pointing inside a lambda)`,
      cause: py`A statement such as \`return\`, an assignment or an \`if\` block was used inside the lambda body.`,
      fix: py`Use a single expression (a conditional expression \`a if cond else b\` is allowed), or switch to \`def\`.`,
    },
  ],
  bestPractices: [
    'Pass functions without parentheses: key=by_price, not key=by_price().',
    'Use lambdas only for short, single-use functions written inline as arguments.',
    'If a function needs a name, a docstring, tests or more than one line of logic, use def (PEP 8: don\'t assign lambdas to names).',
    'Return a tuple from a key function to sort by several fields; negate numbers to reverse one field.',
    'Prefer sorted() when you need a new list; remember list.sort() returns None.',
    'Prefer comprehensions over map/filter + lambda for simple transformations; use map with existing named functions.',
    'Consider operator.itemgetter / attrgetter for simple field keys.',
  ],
  useCases: [
    'Sorting records by a field: sorted(orders, key=lambda o: o["date"]).',
    'Finding the best or worst item: max(players, key=lambda p: p.score).',
    'Dispatch tables that map commands or operators to functions.',
    'Callbacks: telling a button, timer or web framework what to run later.',
    'Factories that return small configured functions for filter/sorted/validators.',
  ],
  whenToUse: {
    use: [
      'A short key or callback used once, right where it is defined.',
      'Simple field access or arithmetic: lambda p: p[1], lambda x: x * 2.',
      'Binding a loop value into a callback with a default argument: lambda item=item: remove(item).',
    ],
    avoid: [
      'Anything with branching beyond one conditional expression.',
      'Functions reused in several places or worth testing on their own.',
      'Assigning a lambda to a variable — write def instead.',
      'map/filter + lambda where a comprehension reads more clearly.',
    ],
  },
  comparison: {
    title: 'lambda vs def',
    headers: ['', 'lambda', 'def'],
    rows: [
      ['kind of syntax', 'expression — can appear inside a call', 'statement — on its own line(s)'],
      ['body', 'exactly one expression, returned automatically', 'any statements; return is explicit'],
      ['name', 'always <lambda>', 'the name you choose'],
      ['docstring / annotations', 'no', 'yes'],
      ['resulting object', 'a function', 'a function (identical type)'],
      ['best for', 'tiny inline keys and callbacks', 'everything else'],
    ],
    note: py`Both create closures and follow the same scoping and late-binding rules. Choosing between them is about readability, not capability.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'lambdas-and-higher-order-q1',
      type: 'mcq',
      prompt: 'Which of these is a valid lambda?',
      options: [
        { text: 'lambda x: return x * 2', why: 'return is a statement; a lambda’s body is an expression whose value is returned automatically.' },
        { text: 'lambda x: y = x * 2', why: 'Assignment with = is a statement and not allowed in a lambda body.' },
        'lambda x: "even" if x % 2 == 0 else "odd"',
        { text: 'lambda (x): x * 2', why: 'Lambda parameters are written without parentheses: lambda x: x * 2.' },
      ],
      answer: 2,
      explanation: py`A lambda's body must be a single **expression**. A conditional expression (\`a if condition else b\`) is an expression, so it's allowed; \`return\` and \`=\` are statements.`,
    },
    {
      id: 'lambdas-and-higher-order-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`words = ["kiwi", "fig", "banana", "apple"]
print(sorted(words, key=len))`,
      options: [
        { text: "['apple', 'banana', 'fig', 'kiwi']", why: 'That is alphabetical order — what you get with no key. key=len compares lengths.' },
        "['fig', 'kiwi', 'apple', 'banana']",
        { text: "['banana', 'apple', 'kiwi', 'fig']", why: 'That would be longest first, which needs reverse=True.' },
        { text: '[3, 4, 5, 6]', why: 'sorted returns the original items in key order, not the keys themselves.' },
      ],
      answer: 1,
      explanation: py`\`len\` is called once per word, giving keys 4, 3, 6, 5. The words are returned in order of those keys: fig (3), kiwi (4), apple (5), banana (6).`,
    },
    {
      id: 'lambdas-and-higher-order-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`scores = {"Ada": 91, "Ben": 78, "Cy": 85}
print(max(scores, key=scores.get))`,
      answer: 'Ada',
      explanation: py`Iterating a dict gives its keys (the names). \`scores.get\` is a function value: for each name it returns the score, so \`max\` picks the name with the highest score.`,
    },
    {
      id: 'lambdas-and-higher-order-q4',
      type: 'bug',
      prompt: 'The last line crashes with `TypeError: \'NoneType\' object is not subscriptable`. Click the line that causes the bug.',
      code: py`def by_points(player):
    return player[1]


players = [("Ada", 91), ("Ben", 78), ("Cy", 85)]
ranked = players.sort(key=by_points, reverse=True)
print(ranked[0])`,
      answerLine: 6,
      explanation: py`\`list.sort()\` sorts \`players\` in place and returns \`None\`, so \`ranked\` is \`None\`. Use \`ranked = sorted(players, key=by_points, reverse=True)\`, or call \`players.sort(...)\` and then use \`players[0]\`.`,
    },
    {
      id: 'lambdas-and-higher-order-q5',
      type: 'fill',
      prompt: 'Complete the line so `oldest_first` lists the people from oldest to youngest.',
      code: py`people = [{"name": "Ada", "age": 36}, {"name": "Ben", "age": 51}]
oldest_first = sorted(people, key=___ person: person["age"], reverse=___)`,
      answer: [['lambda'], ['True']],
      explanation: py`\`lambda person: person["age"]\` returns each person's age as the sort key; \`reverse=True\` puts the largest age first.`,
    },
    {
      id: 'lambdas-and-higher-order-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`nums = [1, 2, 3, 4, 5]
evens = filter(lambda n: n % 2 == 0, nums)
print(list(map(lambda n: n * 10, evens)))`,
      options: [
        '[20, 40]',
        { text: '[10, 20, 30, 40, 50]', why: 'map only receives what filter lets through — the even numbers.' },
        { text: '[False, True, False, True, False]', why: 'filter yields the items that pass the test, not the True/False results.' },
        { text: '<map object at 0x...>', why: 'Wrapping it in list() consumes the iterator and shows its values.' },
      ],
      answer: 0,
      explanation: py`\`filter\` keeps 2 and 4; \`map\` multiplies each by 10. Both are lazy — \`list(...)\` drives the whole pipeline.`,
    },
    {
      id: 'lambdas-and-higher-order-q7',
      type: 'short',
      prompt: 'Your teammate wrote a 120-character lambda with two nested conditional expressions and uses it as a sort key in three different files. What would you suggest, and why?',
      answer: py`Turn it into a named function defined once with def (in a shared module) and import it in the three places. A def gets a real name in tracebacks, a docstring, ordinary if statements instead of nested conditional expressions, and can be unit-tested on its own; defining it once also removes the duplication so the rule can't drift between files. Lambdas are for short, single-use functions written inline.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'leaderboard',
      title: 'Leaderboard ranking',
      difficulty: 'intermediate',
      prompt: py`Write \`rank_players(players)\` where \`players\` is a list of \`(name, score)\` tuples. Return a **list of names** ordered by score, **highest first**; players with the **same score** are ordered alphabetically by name.

\`\`\`python
rank_players([("Ben", 78), ("Ada", 91), ("Cy", 85)])   # ['Ada', 'Cy', 'Ben']
rank_players([("Zed", 50), ("Amy", 50), ("Bo", 70)])  # ['Bo', 'Amy', 'Zed']
\`\`\`

Use \`sorted\` with a \`key\`. Don't modify the input list. The tests check the examples above, an empty list, and that the input is unchanged.`,
      files: {
        'main.py': py`def rank_players(players):
    # TODO: sort by score (highest first), ties by name (A to Z)
    return []


print(rank_players([("Ben", 78), ("Ada", 91), ("Cy", 85)]))
`,
      },
      hints: [
        'A key function can return a tuple: Python compares the first elements, then the second if the first are equal.',
        'You want score descending but name ascending, so reverse=True won’t work for both. Negate the score instead.',
        'ranked = sorted(players, key=lambda player: (-player[1], player[0])), then collect the names with a loop.',
      ],
      solution: {
        explanation: py`The key \`(-score, name)\` does all the work: negating the score makes higher scores sort first, and when two scores are equal, Python compares the second element, the name, alphabetically. \`reverse=True\` can't express "one field descending, the other ascending", which is why the minus sign is the standard trick for numbers. \`sorted\` returns a new list, so the caller's \`players\` is untouched; the loop then extracts just the names.`,
        files: {
          'main.py': py`def rank_players(players):
    """Return player names by score (highest first), ties alphabetically."""
    ranked = sorted(players, key=lambda player: (-player[1], player[0]))
    names = []
    for name, score in ranked:
        names.append(name)
    return names


print(rank_players([("Ben", 78), ("Ada", 91), ("Cy", 85)]))
`,
        },
      },
      tests: [
        { name: 'highest score first', code: py`assert rank_players([("Ben", 78), ("Ada", 91), ("Cy", 85)]) == ["Ada", "Cy", "Ben"]` },
        { name: 'ties are alphabetical', code: py`assert rank_players([("Zed", 50), ("Amy", 50), ("Bo", 70)]) == ["Bo", "Amy", "Zed"]` },
        { name: 'an empty list gives an empty ranking', code: py`assert rank_players([]) == []` },
        { name: 'the input list is not modified', code: py`data = [("Ben", 78), ("Ada", 91)]
rank_players(data)
assert data == [("Ben", 78), ("Ada", 91)]` },
      ],
    },
    {
      id: 'text-pipeline',
      title: 'Build a text-cleaning pipeline',
      difficulty: 'intermediate',
      prompt: py`Write \`make_pipeline(*steps)\`. Each step is a one-argument function. \`make_pipeline\` **returns a new function** that takes a value, passes it through every step **in order** (the output of one step is the input of the next), and returns the final result.

\`\`\`python
slugify = make_pipeline(str.strip, str.lower, lambda text: text.replace(" ", "-"))
slugify("  Hello World ")    # 'hello-world'
make_pipeline()("same")      # 'same' — no steps, value unchanged
\`\`\`

The tests check the slug example, that steps run left to right, and that an empty pipeline returns its input.`,
      files: {
        'main.py': py`def make_pipeline(*steps):
    def run(value):
        # TODO: pass value through every step, in order
        return value
    return run


slugify = make_pipeline(str.strip, str.lower, lambda text: text.replace(" ", "-"))
print(slugify("  Hello World "))
`,
      },
      hints: [
        'steps is a tuple of functions. Inside run, loop over it.',
        'Each step’s output becomes the next step’s input: re-bind value inside the loop.',
        'for step in steps: value = step(value) — then return value after the loop.',
      ],
      solution: {
        explanation: py`\`make_pipeline\` is higher-order in both directions: it **takes** functions (collected by \`*steps\` into a tuple) and **returns** a function (\`run\`, a closure over \`steps\`). Inside \`run\`, \`value = step(value)\` feeds each result into the next step, so the order of the arguments is the order of the work. With no steps the loop doesn't run and the value comes back unchanged. Methods such as \`str.strip\` are ordinary function values here: \`str.strip("  hi ")\` is the same as \`"  hi ".strip()\`.`,
        files: {
          'main.py': py`def make_pipeline(*steps):
    """Return a function that applies every step to a value, left to right."""
    def run(value):
        for step in steps:
            value = step(value)
        return value
    return run


slugify = make_pipeline(str.strip, str.lower, lambda text: text.replace(" ", "-"))
print(slugify("  Hello World "))
`,
        },
      },
      tests: [
        { name: 'slugify cleans the text', code: py`slugify = make_pipeline(str.strip, str.lower, lambda text: text.replace(" ", "-"))
assert slugify("  Hello World ") == "hello-world"` },
        { name: 'steps run left to right', code: py`add_one_then_times_ten = make_pipeline(lambda x: x + 1, lambda x: x * 10)
assert add_one_then_times_ten(1) == 20, 'The first step must run first: (1 + 1) * 10'` },
        { name: 'an empty pipeline returns its input', code: py`assert make_pipeline()("same") == "same"` },
        { name: 'prints hello-world', code: py`assert output.strip() == "hello-world"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'lambdas-and-higher-order-what-is-lambda',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a lambda in Python, and what are its limitations compared with def?',
      answer: 'A lambda is an expression that creates an anonymous function: lambda params: expression. Its body is a single expression whose value is returned. It cannot contain statements (no return, assignment, loops, try), has no docstring or annotations, and is always named <lambda>. Otherwise it is an ordinary function object with the same scoping rules as def.',
      explanation: py`Use lambdas inline for short keys and callbacks. For anything named, reused or non-trivial, \`def\` is clearer and easier to debug. PEP 8 discourages \`f = lambda ...\`.`,
      whyAsked: 'Very common screening question; also checks the candidate knows when not to use lambdas.',
      mistakes: ['Saying lambdas are faster than def', 'Saying lambdas can’t capture variables (they are closures too)', 'Not knowing they are limited to one expression'],
      followUps: ['Can a lambda have default arguments?', 'Why does PEP 8 discourage assigning a lambda to a name?', 'What does a lambda show in a traceback?'],
      modelAnswer: 'A lambda is an expression that builds a small anonymous function — lambda, the parameters, a colon, and a single expression whose value is returned automatically. It produces exactly the same kind of function object as def and follows the same scoping and closure rules, but it can’t contain statements like return, assignments, loops or try, it can’t have a docstring or annotations, and its name is always <lambda>. So I use lambdas inline for short key functions and callbacks, and use def as soon as the logic deserves a name, reuse or a test.',
    },
    {
      id: 'lambdas-and-higher-order-define-hof',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a higher-order function? Give examples from the standard library.',
      answer: 'A function that takes another function as an argument or returns a function. Examples: sorted/min/max with key=, map, filter, functools.reduce, functools.partial, and decorators (which take a function and return a new one).',
      explanation: py`This works because Python functions are first-class objects: they can be bound to names, stored in data structures, passed and returned like any other value.`,
      code: { lang: 'python', code: py`def twice(func, value):
    return func(func(value))


print(twice(lambda x: x * 3, 2))   # 18` },
      whyAsked: 'Checks understanding of first-class functions, the foundation for decorators and functional patterns.',
      mistakes: ['Confusing higher-order with "a function that calls another function"', 'Not mentioning returning functions'],
      followUps: ['What does "first-class function" mean?', 'How is a decorator a higher-order function?', 'Write a function that returns a function.'],
      modelAnswer: 'A higher-order function is one that takes a function as an argument, returns a function, or both. That’s possible because functions in Python are first-class objects — I can pass them around like any value. The standard library is full of them: sorted, min and max take a key function; map and filter take a function to apply or test; functools.partial and decorators take a function and return a new one. Simply calling another function inside your body doesn’t count — the function itself has to be the data being passed or returned.',
    },
    {
      id: 'lambdas-and-higher-order-stable-sort',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and which property of Python’s sort guarantees the order of equal ages?',
      code: { lang: 'python', code: py`people = [("Ada", 36), ("Ben", 25), ("Cy", 36), ("Di", 25)]
print(sorted(people, key=lambda p: p[1]))` },
      options: [
        "[('Ben', 25), ('Di', 25), ('Ada', 36), ('Cy', 36)]",
        "[('Di', 25), ('Ben', 25), ('Cy', 36), ('Ada', 36)]",
        "[('Ben', 25), ('Di', 25), ('Cy', 36), ('Ada', 36)]",
        'The order of equal ages is unpredictable',
      ],
      correctOption: 0,
      answer: "[('Ben', 25), ('Di', 25), ('Ada', 36), ('Cy', 36)]. Python’s sort is guaranteed stable: items with equal keys keep their original relative order.",
      explanation: py`Ben came before Di and Ada before Cy in the input, so they stay in that order. Stability is documented for both \`sorted\` and \`list.sort\`, and it enables multi-pass sorting: sort by the secondary key first, then by the primary key.`,
      whyAsked: 'Tests knowledge of key functions and the stability guarantee, which matters for deterministic output.',
      mistakes: ['Thinking equal keys are ordered by the whole tuple', 'Thinking the order of ties is random'],
      followUps: ['How would you break ties by name instead?', 'How does stability enable multi-pass sorting?', 'Is the stability a CPython detail or a language guarantee?'],
      modelAnswer: 'It prints Ben 25, Di 25, Ada 36, Cy 36. The key function only looks at the age, so Ben and Di tie, and so do Ada and Cy. Python’s sort is documented to be stable — equal keys keep their original relative order — and since Ben came before Di and Ada before Cy in the input, that’s the order we get. If I wanted ties broken by name I would return a tuple key, (age, name); stability also lets me sort in several passes, secondary key first.',
    },
    {
      id: 'lambdas-and-higher-order-map-vs-comprehension',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you use map/filter instead of a list comprehension, and vice versa?',
      answer: 'Comprehensions are usually clearer for transformations and filters written inline, especially when a lambda would be needed. map/filter read well when you already have a named function (map(str.strip, lines), filter(None, items)) and when you want a lazy iterator in a pipeline — though a generator expression is lazy too.',
      explanation: py`\`[s.title() for s in names if s]\` vs \`map(str.title, filter(None, names))\`: both are fine; the comprehension avoids lambdas and reads left to right. \`map\` and \`filter\` return iterators, a comprehension builds a list immediately — use a generator expression \`( … )\` for lazy evaluation without map.`,
      whyAsked: 'Assesses style judgement and knowledge of laziness.',
      mistakes: ['Claiming map is always faster', 'Forgetting that map/filter are lazy one-shot iterators', 'Writing map(lambda …) where a comprehension is clearer'],
      followUps: ['What does filter(None, items) do?', 'What is a generator expression?', 'How does reduce fit in?'],
      modelAnswer: 'My default is a comprehension: it handles transform and filter in one readable expression without needing a lambda. I reach for map or filter when there’s already a named function to plug in — map(str.strip, lines) is very clean — or filter(None, items) to drop falsy values. Both return lazy iterators, which is handy in pipelines, but a generator expression gives me the same laziness with comprehension syntax. Performance differences are small and situational, so I choose for readability and measure if it really matters.',
    },
    {
      id: 'lambdas-and-higher-order-dispatch',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Implement `calculate(a, op, b)` using a dispatch table (a dict mapping operator symbols to functions) for "+", "-", "*" and "/". Raise ValueError for an unknown operator.',
      answer: 'OPERATIONS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}; look the operator up, raise ValueError if it is missing, otherwise call the function with a and b.',
      explanation: py`A dict of functions replaces an \`if/elif\` chain: adding \`"**": operator.pow\` is one line. Checking membership first gives a clear error message instead of a bare \`KeyError\`.`,
      starter: { files: { 'main.py': py`import operator

OPERATIONS = {
    "+": operator.add,
    # TODO: add "-", "*" and "/"
}


def calculate(a, op, b):
    # TODO: look up op in OPERATIONS and call it; unknown op -> ValueError
    return None


print(calculate(6, "*", 7))   # 42
` } },
      tests: [
        { name: 'multiplies', code: py`assert calculate(6, "*", 7) == 42` },
        { name: 'adds and subtracts', code: py`assert calculate(2, "+", 3) == 5 and calculate(2, "-", 3) == -1` },
        { name: 'true division', code: py`assert calculate(7, "/", 2) == 3.5` },
        { name: 'unknown operator raises ValueError', code: py`with raises(ValueError):
    calculate(2, "^", 3)` },
        { name: 'OPERATIONS holds functions', code: py`assert all(callable(f) for f in OPERATIONS.values()) and len(OPERATIONS) >= 4` },
      ],
      solution: { files: { 'main.py': py`import operator

OPERATIONS = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "/": operator.truediv,
}


def calculate(a, op, b):
    """Apply the operator symbol op to a and b."""
    if op not in OPERATIONS:
        raise ValueError(f"unknown operator: {op!r}")
    return OPERATIONS[op](a, b)


print(calculate(6, "*", 7))   # 42
` } },
      hints: ['The operator module has add, sub, mul and truediv.', 'OPERATIONS[op] is a function; OPERATIONS[op](a, b) calls it.'],
      whyAsked: 'Shows comfort with functions as values and a pattern that keeps branching code extensible.',
      mistakes: ['Using a long if/elif chain', 'Calling the functions while building the dict', 'Letting a KeyError escape instead of a clear ValueError', 'Using eval on the expression (a security risk)'],
      followUps: ['How would you add exponentiation?', 'Why should you never use eval for this?', 'How would you type-hint OPERATIONS?'],
      modelAnswer: 'I would build a dict that maps each symbol to a function — the operator module already has add, sub, mul and truediv, or I could use small lambdas. calculate checks the symbol is in the table and raises a ValueError with a clear message if not, then looks up the function and calls it with a and b. That replaces an if/elif chain, makes adding an operator a one-line change, and avoids anything like eval, which would be a security hole for user input.',
    },
    {
      id: 'lambdas-and-higher-order-code-review',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'In a code review you see: `handlers = [lambda: process(item) for item in items]`, followed later by calling every handler. Users report that only the last item is ever processed (many times). What is wrong and how would you fix it?',
      answer: 'Late binding: every lambda refers to the same variable item and reads it when called, after the comprehension finished, so all of them process the last item. Fix by binding the value at creation time: lambda item=item: process(item), functools.partial(process, item), or a small factory function.',
      explanation: py`This is the closures late-binding gotcha in a real-world shape (callbacks, tasks queued for later). \`functools.partial(process, item)\` is often the clearest fix — it stores the argument and has a readable \`repr\`. See [closures](lesson:closures).`,
      code: { lang: 'python', code: py`import functools

items = ["a", "b", "c"]
processed = []
handlers = [functools.partial(processed.append, item) for item in items]
for handler in handlers:
    handler()
print(processed)   # ['a', 'b', 'c']` },
      whyAsked: 'A realistic bug combining lambdas, closures and deferred execution.',
      mistakes: ['Blaming the list comprehension rather than late binding', 'Fixing it by calling process immediately (changing the behaviour)', 'Not knowing functools.partial'],
      followUps: ['Why does the default-argument trick work?', 'What are the downsides of the default-argument trick? (the handler gains an optional parameter)', 'How would you test for this bug?'],
      modelAnswer: 'This is late binding. Each lambda doesn’t capture the current item, it captures the variable item, and looks it up only when it’s called — which is after the loop has finished, so every handler sees the last item. I’d bind the value when the handler is created: functools.partial(process, item) is my favourite because it’s explicit and shows its arguments in its repr; the default-argument trick lambda item=item: process(item) also works, as does a tiny factory function. I’d add a test that creates handlers for several items and checks each one processes its own.',
    },
    {
      id: 'lambdas-and-higher-order-key-vs-cmp',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Why does Python sort with key functions instead of comparison functions, and what do you do when you only have a comparison?',
      answer: 'A key function is called once per element and the sort then compares the cached keys, so expensive work is done n times rather than once per comparison; keys are also simpler to write and compose (tuples). Python 3 removed the cmp argument; if you have a two-argument comparison, wrap it with functools.cmp_to_key.',
      explanation: py`Comparison sorts make on the order of n·log n comparisons, so a comparison function doing real work (parsing a date, lower-casing a string) repeats it many times; a key function does it once per item. Tuple keys, \`reverse=True\` and the stability guarantee cover almost every ordering need. \`cmp_to_key\` exists for genuinely pairwise rules, e.g. ordering strings so their concatenation is largest.`,
      code: { lang: 'python', code: py`import functools


def compare(a, b):
    """Order numbers so that their concatenation is as large as possible."""
    return -1 if a + b > b + a else (1 if a + b < b + a else 0)


parts = ["3", "30", "34", "5", "9"]
print("".join(sorted(parts, key=functools.cmp_to_key(compare))))   # 9534330` },
      whyAsked: 'Probes understanding of the sort API design and performance reasoning beyond syntax.',
      mistakes: ['Not knowing that the key is computed once per item', 'Thinking cmp= still exists in Python 3', 'Using cmp_to_key where a tuple key would do'],
      followUps: ['How would you sort case-insensitively? (key=str.casefold)', 'How do you sort descending on one field and ascending on another?', 'Is sorted() stable?'],
      modelAnswer: 'With a key function, Python calls the function once per element, keeps those keys, and the sort only compares keys. A comparison function would be called for every comparison — on the order of n log n times — so any expensive work in it is repeated many times. Keys are also easier to get right and compose: return a tuple for multi-level ordering, negate a number to flip one field, and rely on the guaranteed stability for multi-pass sorts. Python 3 dropped the cmp parameter, so when I truly have a pairwise rule — like ordering number strings so their concatenation is largest — I wrap it with functools.cmp_to_key.',
    },
  ],

  takeaways: [
    'Functions are values: bind them to names, store them in lists or dicts, pass them in and return them.',
    'A higher-order function takes or returns a function: sorted/min/max with key=, map, filter, decorators, factories.',
    'lambda params: expression creates an unnamed function whose single expression is returned; no statements, no docstring, name <lambda>.',
    'Pass functions without parentheses (key=by_price). Key functions take one item and are called once per item; tuple keys sort by several fields.',
    'sorted() returns a new list and is stable; list.sort() sorts in place and returns None.',
    'map() and filter() return lazy, single-use iterators; comprehensions are often clearer.',
    'Use lambdas for tiny inline functions; use def when the function deserves a name, a docstring, reuse or tests.',
  ],
}
