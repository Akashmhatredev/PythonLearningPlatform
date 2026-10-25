// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ORDERS = py`from functools import reduce
from operator import attrgetter, methodcaller, mul
from typing import NamedTuple

RAW = """\
order_id,customer,product,qty,unit_price,status
1001,ada,tea,2,4.50,paid
1002,ben,cake,1,3.20,refunded
1003,ada,jam,3,2.75,paid
1004,cy,tea,1,4.50,paid
1005,ben,mug,2,8.00,pending
"""


class Order(NamedTuple):
    order_id: int
    customer: str
    product: str
    qty: int
    unit_price: float
    status: str

    @property
    def total(self):
        return self.qty * self.unit_price


def parse(fields):
    order_id, customer, product, qty, price, status = fields
    return Order(int(order_id), customer, product, int(qty), float(price), status)


lines = RAW.strip().splitlines()[1:]              # skip the header row
rows = map(methodcaller("split", ","), lines)     # lazy: nothing is split yet
orders = list(map(parse, rows))                   # now every line is parsed

paid = list(filter(lambda order: order.status == "paid", orders))
print("paid orders:", list(map(attrgetter("order_id"), paid)))

revenue = reduce(lambda acc, order: acc + order.total, paid, 0.0)
print(f"revenue (reduce): {revenue:.2f}")
print(f"revenue (sum):    {sum(order.total for order in paid):.2f}")

biggest = max(paid, key=attrgetter("total"))
print("biggest order:", biggest.order_id, "by", biggest.customer)

by_customer = sorted(paid, key=attrgetter("customer", "order_id"))
print("by customer:", [(o.customer, o.order_id) for o in by_customer])

print("every qty positive:", all(order.qty > 0 for order in orders))
print("any refunds:", any(order.status == "refunded" for order in orders))
print("3 x 4 x 5 =", reduce(mul, [3, 4, 5]))
`

export default {
  id: 'map-filter-reduce',
  title: 'map, filter, reduce & the operator module',
  summary: 'Transform, select and fold data with map(), filter() and functools.reduce(), use the operator module for ready-made key and combining functions, and know when a comprehension, sum(), any() or all() says it better.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['lambdas-and-higher-order', 'comprehensions', 'iterators', 'functional-concepts'],
  related: ['functools', 'functional-concepts', 'lambdas-and-higher-order', 'comprehensions', 'lazy-evaluation', 'generators', 'itertools', 'iterators', 'list-operations', 'dictionaries', 'collections-module', 'csv-data', 'records-and-slots', 'performance'],
  tags: ['map', 'filter', 'reduce', 'functools.reduce', 'fold', 'operator', 'itemgetter', 'attrgetter', 'methodcaller', 'operator.add', 'operator.mul', 'key function', 'any', 'all', 'lazy iterator', 'pipeline', 'comprehension vs map', 'filter None'],
  apis: [
    { name: 'map(function, iterable, *iterables, strict=False)', summary: 'Lazy iterator of function(item) — or function(a, b, …) across several iterables, stopping at the shortest. strict=True (3.14+) raises ValueError on unequal lengths.' },
    { name: 'filter(function, iterable)', summary: 'Lazy iterator of the items for which function(item) is truthy; filter(None, it) keeps the truthy items.' },
    { name: 'functools.reduce(function, iterable[, initial])', summary: 'Folds an iterable into one value: function(function(initial, a), b)… Without initial, an empty iterable raises TypeError.' },
    { name: 'operator.itemgetter(*keys)', summary: 'Callable that returns obj[key] (or a tuple of several) — a fast, picklable key function.' },
    { name: 'operator.attrgetter(*names)', summary: 'Callable that returns obj.name (dotted names like "address.city" work; several names give a tuple).' },
    { name: 'operator.methodcaller(name, *args, **kwargs)', summary: 'Callable that calls obj.name(*args, **kwargs).' },
    { name: 'operator.add / mul / sub / truediv / neg …', summary: 'Every operator as a plain two-argument (or one-argument) function.' },
    { name: 'any(iterable) / all(iterable)', summary: 'True if any / every item is truthy; both stop early. all([]) is True, any([]) is False.' },
  ],
  docs: [
    { label: 'Built-in functions — map()', url: 'https://docs.python.org/3/library/functions.html#map' },
    { label: 'Built-in functions — filter()', url: 'https://docs.python.org/3/library/functions.html#filter' },
    { label: 'functools.reduce', url: 'https://docs.python.org/3/library/functools.html#functools.reduce' },
    { label: 'operator — standard operators as functions', url: 'https://docs.python.org/3/library/operator.html' },
    { label: 'Functional Programming HOWTO', url: 'https://docs.python.org/3/howto/functional.html' },
    { label: 'Sorting techniques — operator module functions', url: 'https://docs.python.org/3/howto/sorting.html#operator-module-functions' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Most data processing is three moves repeated: **transform** every item (convert text to numbers), **select** some items (only the paid orders), and **combine** them into one answer (the total revenue). Functional programming gives each move a name: **map**, **filter** and **reduce**.`,
    py`- \`map(func, items)\` applies \`func\` to every item.
- \`filter(pred, items)\` keeps the items where \`pred(item)\` is truthy. (A *predicate* is a function that answers yes/no.)
- \`functools.reduce(func, items, start)\` folds the items into one value, two at a time.`,
    py`Two important details: \`map\` and \`filter\` are **lazy** — they hand out results one at a time only when asked (see [iterators](lesson:iterators)) — and Python often has a clearer alternative: a [comprehension](lesson:comprehensions) instead of \`map\`/\`filter\` with a lambda, and \`sum\`, \`max\`, \`any\`, \`all\` instead of \`reduce\`. The **\`operator\`** module fills the gap between them with ready-made small functions like \`itemgetter\` and \`add\`.`,
  ],
  why: [
    py`**They name the intent.** A loop could be doing anything; \`filter(is_paid, orders)\` can only be selecting. Readers know what to expect before reading the details.`,
    py`**They compose into pipelines.** Each step takes an iterable and returns an iterable, so steps chain: read lines → split → parse → keep paid → total. Because they're lazy, the pipeline handles one item at a time and works on data far bigger than memory.`,
    py`**They pair with existing functions.** \`map(int, parts)\`, \`filter(str.isdigit, tokens)\`, \`sorted(rows, key=itemgetter("score"))\` — no lambda, no loop, just the function you already have.`,
  ],
  eli15: [
    py`Imagine a conveyor belt of apples. **map** is a machine that does the same thing to every apple — say, washes it. **filter** is a gate that only lets the good apples through. **reduce** is the person at the end who drops each apple into one basket and keeps a running weight.`,
    py`And here's the clever part: the belt is **lazy**. Nothing moves until someone at the end asks for the next apple. Ask for one and exactly one apple gets washed and checked. That's why a belt like this can handle millions of apples without needing a warehouse.`,
  ],
  analogy: {
    title: 'An apple-packing line',
    body: [
      py`A packing line has stations. The washer treats every apple the same (map). The inspector lets through only apples that pass a check (filter). At the end, a packer combines them into a single crate and writes its total weight on the label (reduce).`,
      py`The line only runs when the packer pulls the next apple — that's laziness. And once an apple has passed the packer it's gone from the belt: you can't run the same belt twice — that's an exhausted iterator.`,
    ],
    mapping: [
      ['the washing station', 'map(wash, apples): the same function applied to every item'],
      ['the inspector\'s gate', 'filter(is_good, apples): keep items whose test is truthy'],
      ['the packer\'s running weight', 'reduce(add_weight, apples, 0): fold everything into one value'],
      ['the line runs only when the packer pulls', 'map and filter are lazy iterators'],
      ['apples already packed are gone from the belt', 'an iterator can be consumed only once'],
      ['a standard tool from the supply cupboard', 'operator.itemgetter / attrgetter / add instead of a hand-written lambda'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'map() is lazy and runs out',
    props: {
      code: py`def shout(word):
    print("  shouting", word)
    return word.upper()

words = ["tea", "jam", "cake"]
loud = map(shout, words)
print("map created, nothing shouted yet")

first = next(loud)
print("first:", first)

rest = list(loud)
print("rest:", rest)
print("again:", list(loud))
`,
      notes: {
        6: '`map` returns a **map object** immediately. `shout` has not been called even once.',
        9: '`next()` asks for one result, so `shout` runs exactly once — for "tea".',
        12: '`list()` pulls the remaining results: `shout` runs for "jam" and "cake".',
        14: 'The iterator is exhausted. Asking again gives nothing: `[]`.',
      },
    },
    alt: 'A step-by-step trace. Creating map(shout, words) prints nothing from shout. Calling next(loud) runs shout once for tea and prints first: TEA. list(loud) runs shout for jam and cake and prints rest: JAM, CAKE. A second list(loud) prints again: an empty list because the iterator is exhausted.',
    caption: py`Watch the output panel: each "shouting" line appears only when a result is *requested*. That laziness is what makes long pipelines cheap — and it's why a map object can't be reused.`,
  },
  syntax: [
    py`#### map — transform every item`,
    { code: py`prices = ["4.50", "3.20", "2.75"]
numbers = list(map(float, prices))                  # [4.5, 3.2, 2.75]
with_tax = list(map(lambda p: round(p * 1.2, 2), numbers))
print(numbers, with_tax)

# Several iterables: the function takes one argument from each
qty = [2, 1, 3]
print(list(map(lambda p, q: p * q, numbers, qty)))   # [9.0, 3.2, 8.25]
print(list(map(pow, [2, 3, 4], [2, 2, 2])))          # [4, 9, 16]`, lang: 'python', title: 'map(function, iterable, ...)' },
    py`With several iterables, \`map\` stops at the **shortest** one — like \`zip\`. In 3.14+, \`map(..., strict=True)\` raises \`ValueError\` instead, just like \`zip(strict=True)\` (3.10+).`,
    py`#### filter — keep the items that pass a test`,
    { code: py`scores = [72, 45, 90, 38, 66]
passed = list(filter(lambda s: s >= 50, scores))     # [72, 90, 66]

tokens = ["12", "apple", "7", "", "3"]
digits = list(filter(str.isdigit, tokens))           # ['12', '7', '3']

answers = ["yes", "", None, "no", 0]
given = list(filter(None, answers))                  # None means "keep truthy items"
print(passed, digits, given)                         # ... ['yes', 'no']`, lang: 'python', title: 'filter(predicate, iterable)' },
    py`#### reduce — fold everything into one value`,
    { code: py`from functools import reduce
from operator import add, mul

print(reduce(add, [1, 2, 3, 4]))          # ((1 + 2) + 3) + 4 = 10
print(reduce(mul, [1, 2, 3, 4]))          # 24
print(reduce(add, [], 0))                 # 0 — the initial value handles empty input

# The accumulator can be any type: here a dict of word lengths
words = ["tea", "cake", "jam"]
lengths = reduce(lambda acc, w: acc | {w: len(w)}, words, {})
print(lengths)                            # {'tea': 3, 'cake': 4, 'jam': 3}`, lang: 'python', title: 'functools.reduce(function, iterable, initial)' },
    py`\`reduce(f, [a, b, c], init)\` computes \`f(f(f(init, a), b), c)\`. The function's **first** parameter is the running result (the *accumulator*), the second is the next item. Always pass an initial value unless you're sure the input is non-empty *and* the items have the same type as the result.`,
    { callout: 'tip', title: 'Reach for the built-in folds first', text: py`Most reductions already have a name: \`sum()\`, \`min()\`, \`max()\`, \`any()\`, \`all()\`, \`math.prod()\`, \`"".join()\`, \`collections.Counter()\`. They're clearer and handle empty input sensibly. Use \`reduce\` when the combining step is genuinely custom.` },
    py`#### The operator module — small functions, ready-made`,
    { code: py`from operator import attrgetter, itemgetter, methodcaller

players = [{"name": "Ada", "score": 90, "time": 31}, {"name": "Ben", "score": 90, "time": 28}]
print(sorted(players, key=itemgetter("score", "time")))   # by score, then time
print(list(map(itemgetter("name"), players)))              # ['Ada', 'Ben']

point = complex(3, 4)
print(attrgetter("real", "imag")(point))                   # (3.0, 4.0)

clean = methodcaller("strip", " .!")
print(clean("  hello!. "))                                 # 'hello'`, lang: 'python', title: 'itemgetter, attrgetter, methodcaller' },
    py`| instead of… | write | notes |
|---|---|---|
| \`lambda d: d["score"]\` | \`itemgetter("score")\` | several keys → returns a tuple |
| \`lambda o: o.address.city\` | \`attrgetter("address.city")\` | dotted names follow attributes |
| \`lambda s: s.strip()\` | \`methodcaller("strip")\` or \`str.strip\` | methodcaller can pass arguments |
| \`lambda a, b: a + b\` | \`operator.add\` | also \`mul\`, \`sub\`, \`truediv\`, \`and_\`, \`or_\`, \`neg\`, \`not_\`… |`,
    py`#### any and all — "is there at least one?" / "are they all?"`,
    { code: py`orders = [{"qty": 2, "paid": True}, {"qty": 1, "paid": False}]
print(all(o["qty"] > 0 for o in orders))      # True
print(any(not o["paid"] for o in orders))     # True — stops at the first unpaid order
print(all([]), any([]))                       # True False — "vacuous truth"`, lang: 'python', title: 'any() and all() short-circuit' },
  ],
  walkthrough: {
    title: 'Reading the order pipeline',
    lang: 'python',
    code: ORDERS,
    intro: py`The playground program turns CSV-style text into records, then filters, folds, sorts and checks them. Press **Guide** in the playground to follow along.`,
    steps: [
      { lines: [15, 25], text: py`Each order becomes an immutable \`NamedTuple\` record ([records & slots](lesson:records-and-slots)). \`total\` is a computed property, so it can never be out of date.` },
      { lines: [28, 30], text: py`\`parse\` converts one list of six strings into an \`Order\` — a pure, one-argument function, ideal for \`map\`.` },
      { lines: [33, 33], text: py`\`splitlines()[1:]\` drops the header row. This is an ordinary list.` },
      { lines: [34, 34], text: py`\`methodcaller("split", ",")\` builds a function equivalent to \`lambda line: line.split(",")\`. \`map\` returns immediately — **no line has been split yet**.` },
      { lines: [35, 35], text: py`\`list(map(parse, rows))\` pulls every row through both maps: each line is split and then parsed, one at a time. After this, \`rows\` is exhausted.` },
      { lines: [37, 38], text: py`\`filter\` keeps orders whose predicate returns \`True\`. \`attrgetter("order_id")\` is a ready-made "get this attribute" function for \`map\`.` },
      { lines: [40, 42], text: py`\`reduce\` folds the paid orders into one number starting from \`0.0\`. The \`sum\` line computes the same thing — and is how you'd normally write it.` },
      { lines: [44, 48], text: py`Key functions: \`max\` picks the order with the largest \`total\`; \`attrgetter("customer", "order_id")\` returns a tuple, so \`sorted\` orders by customer, then by id.` },
      { lines: [50, 52], text: py`\`all\` and \`any\` take generator expressions and stop as soon as the answer is known. \`reduce(mul, ...)\` multiplies everything — \`math.prod\` is the named built-in for that.` },
    ],
  },
  playground: {
    title: 'Order pipeline',
    objective: 'Run the pipeline, then extend it with your own map/filter/sort/fold steps.',
    files: { 'main.py': ORDERS },
    expected: py`\`\`\`text
paid orders: [1001, 1003, 1004]
revenue (reduce): 21.75
revenue (sum):    21.75
biggest order: 1001 by ada
by customer: [('ada', 1001), ('ada', 1003), ('cy', 1004)]
every qty positive: True
any refunds: True
3 x 4 x 5 = 60
\`\`\``,
    experiments: [
      {
        id: 'exhausted',
        task: py`Right after the \`orders = ...\` line, add \`print("rows again:", list(rows))\`. Predict what it prints before you run it.`,
        hint: py`\`rows\` is a map object. \`list(map(parse, rows))\` already pulled every item out of it.`,
        tests: [
          { name: 'prints an empty list', code: py`assert "rows again: []" in output, 'Add print("rows again:", list(rows)) after orders = ...'` },
        ],
        explain: py`Iterators are single-use: once \`list(map(parse, rows))\` consumed \`rows\`, there's nothing left. If you need the data twice, store it in a list first (as the program does with \`orders\`), or rebuild the iterator.`,
      },
      {
        id: 'cheapest-first',
        task: py`Create \`ranked\`: the paid orders sorted by \`total\`, **cheapest first**, using \`sorted\` with \`attrgetter\`. Print their ids.`,
        hint: py`\`ranked = sorted(paid, key=attrgetter("total"))\``,
        tests: [
          { name: 'ranked is cheapest first', code: py`assert [o.order_id for o in ns.get('ranked', [])] == [1004, 1003, 1001], 'ranked = sorted(paid, key=attrgetter("total"))'` },
          { name: 'paid keeps its original order', code: py`assert [o.order_id for o in paid] == [1001, 1003, 1004]` },
        ],
        explain: py`\`attrgetter("total")\` works with properties too — it just does \`order.total\`. \`sorted\` returns a new list, so \`paid\` is untouched. Add \`reverse=True\` for most expensive first.`,
      },
      {
        id: 'customer-totals',
        task: py`Build \`totals\`, a dict mapping each customer to the sum of their **paid** order totals: \`{"ada": 17.25, "cy": 4.5}\`. Use \`reduce\` with a \`{}\` initial value — or a loop if you prefer, then compare.`,
        hint: py`\`totals = reduce(lambda acc, o: acc | {o.customer: acc.get(o.customer, 0) + o.total}, paid, {})\``,
        tests: [
          { name: 'totals per paying customer', code: py`totals = ns.get('totals')
assert isinstance(totals, dict), 'Create a dict called totals'
assert totals == approx({"ada": 17.25, "cy": 4.5})` },
        ],
        explain: py`The accumulator doesn't have to be a number: here it's a dict that grows by one entry per step. Notice how much easier the loop version is to read — \`for o in paid: totals[o.customer] = totals.get(o.customer, 0) + o.total\` — and that \`acc | {...}\` copies the dict on every step. For grouping, a loop (or \`collections.defaultdict\`/\`Counter\`) is usually the clearer tool; \`reduce\` shines for simple, associative combining.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'One item at a time through a lazy pipeline',
    props: {
      width: 760,
      height: 260,
      nodes: [
        { id: 'src', label: 'lines', note: 'list of text', x: 70, y: 130, tone: 'paper' },
        { id: 'split', label: 'map(split)', note: 'lazy', x: 210, y: 130, tone: 'yellow' },
        { id: 'parse', label: 'map(parse)', note: 'lazy', x: 350, y: 130, tone: 'yellow' },
        { id: 'keep', label: 'filter(is_paid)', note: 'lazy', x: 500, y: 130, tone: 'blue' },
        { id: 'fold', label: 'sum / reduce', note: 'pulls items', x: 670, y: 130, tone: 'ink' },
      ],
      edges: [
        { from: 'src', to: 'split' },
        { from: 'split', to: 'parse' },
        { from: 'parse', to: 'keep' },
        { from: 'keep', to: 'fold' },
      ],
      steps: [
        { focus: ['split', 'parse', 'keep'], text: py`Building \`filter(is_paid, map(parse, map(split, lines)))\` does **no work**: you get a chain of three iterator objects, each holding a reference to the one before.` },
        { focus: ['fold'], edges: ['keep->fold'], text: py`The work starts when something **consumes** the chain — \`sum()\`, \`reduce()\`, \`list()\` or a \`for\` loop asks the last iterator for an item.` },
        { focus: ['src', 'split', 'parse'], edges: ['src->split', 'split->parse', 'parse->keep'], text: py`The request travels back up: \`filter\` asks \`map(parse)\`, which asks \`map(split)\`, which takes **one** line. That one line is split, parsed and tested.` },
        { focus: ['keep', 'fold'], edges: ['keep->fold'], text: py`If the order is paid it reaches the fold; if not, \`filter\` immediately asks for the next one. Only one item is "in flight" at a time, so memory use stays flat no matter how many lines there are — see [lazy evaluation](lesson:lazy-evaluation).` },
      ],
    },
    alt: 'A pipeline of five boxes left to right: lines, map(split), map(parse), filter(is_paid), and sum / reduce. Steps explain that building the chain does no work, that the fold at the end pulls items, and that each line travels through split, parse and the filter one at a time.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`map\` and \`filter\` objects are **iterators**: each time something asks for the next item (\`next()\`, a \`for\` loop, \`list()\`), they fetch one item from their source, process it, and hand it over. When the source runs out they raise \`StopIteration\`, which loops understand as "done".`,
      py`That means three practical rules: wrap them in \`list()\` when you want to *see* or *reuse* the results; don't call \`len()\` on them (\`TypeError: object of type 'map' has no len()\`); and expect them to be **empty the second time** you loop.`,
    ],
    technical: [
      py`**Python 3 vs Python 2.** In Python 2, \`map\` and \`filter\` returned lists and \`reduce\` was a built-in. Python 3 made \`map\`/\`filter\` lazy and moved \`reduce\` into \`functools\`, nudging people towards comprehensions and named folds like \`sum\`. Old tutorials that print \`map(...)\` and get a list are Python 2.`,
      py`**Comprehensions are the idiomatic equivalent.** \`[f(x) for x in xs if p(x)]\` is \`list(map(f, filter(p, xs)))\`, and the generator expression \`(f(x) for x in xs if p(x))\` is the lazy version. A comprehension wins when you'd otherwise write a lambda, or when you transform and filter at the same time. \`map\`/\`filter\` win when you already have a named function: \`map(int, parts)\` reads better than \`[int(p) for p in parts]\` to many people.`,
      py`**\`reduce\` is a left fold.** \`reduce(f, [a, b, c], init)\` = \`f(f(f(init, a), b), c)\`. Without \`init\`, the first item becomes the starting accumulator — so for \`[]\` there is nothing to return (\`TypeError: reduce() of empty iterable with no initial value\`), and the item type must match the result type.`,
      py`**Key functions are called once per item.** \`sorted\`, \`min\`, \`max\`, \`heapq.nlargest\` and \`itertools.groupby\` call \`key(item)\` once per item and compare the results. \`itemgetter("a", "b")\` returns tuples, which compare element by element — the standard way to sort by several fields in the same direction.`,
      { callout: 'note', title: 'CPython detail: speed', text: py`\`map\`, \`filter\`, \`itemgetter\`, \`attrgetter\`, \`methodcaller\` and the \`operator\` functions are implemented in C in CPython. \`map\` with a built-in like \`int\` or \`str.upper\` avoids a Python-level function call per item, so it can be a little faster than the equivalent comprehension; \`map\` with a \`lambda\` usually isn't faster than a comprehension, because the lambda is a Python call each time. Differences are small — measure with \`timeit\` before choosing for speed (see [profiling](lesson:profiling)).` },
    ],
    production: [
      py`**Pipelines over big data.** Chaining lazy steps over a file object (\`map(parse, open(path))\`) processes a file line by line in constant memory. Don't break the laziness with an accidental \`list()\` in the middle, and remember the pipeline can be consumed **once** — compute everything you need in that single pass (or tee it with \`itertools.tee\`, see [itertools](lesson:itertools)).`,
      py`**Readability is the real cost.** Nested \`map(lambda …, filter(lambda …, …))\` is hard to read and debug. Name the steps (\`def is_paid(order)\`), use comprehensions, or break the pipeline into named intermediate generators. Your future self debugging at 2 a.m. will thank you.`,
      py`**Picklable callables.** \`itemgetter\`, \`attrgetter\`, \`methodcaller\`, \`functools.partial\` and module-level functions can be pickled; lambdas can't (\`PicklingError: Can't pickle <function <lambda> …>\`). That matters when passing functions to \`multiprocessing\` workers — see [multiprocessing](lesson:multiprocessing).`,
      py`**Errors inside lazy steps surface late.** An exception in \`parse\` is raised where the pipeline is *consumed*, not where \`map\` was called, so the traceback points at the \`sum()\` or \`for\` line. Read the traceback to the bottom to find the real frame.`,
    ],
  },
  mistakes: [
    {
      title: 'Printing or reusing a map/filter object',
      wrong: { code: py`names = map(str.title, ["ada", "ben"])
print(names)            # <map object at 0x...>
print(list(names))      # ['Ada', 'Ben']
print(list(names))      # [] — already consumed`, lang: 'python' },
      right: { code: py`names = list(map(str.title, ["ada", "ben"]))
print(names)            # ['Ada', 'Ben']
print(names)            # still ['Ada', 'Ben']`, lang: 'python' },
      explanation: py`A map object is a lazy, single-use iterator. Convert it with \`list()\` when you need to display, index, measure or reuse the results.`,
    },
    {
      title: 'reduce without an initial value',
      wrong: { code: py`from functools import reduce

words = ["tea", "cake", "jam"]
letters = reduce(lambda acc, word: acc + len(word), words)
# TypeError: can only concatenate str (not "int") to str`, lang: 'python', static: true },
      right: { code: py`from functools import reduce

words = ["tea", "cake", "jam"]
letters = reduce(lambda acc, word: acc + len(word), words, 0)
print(letters, sum(len(word) for word in words))   # 10 10`, lang: 'python' },
      explanation: py`Without an initial value, the first **item** (\`"tea"\`) becomes the accumulator, so the first step is \`"tea" + 4\`. An empty list would fail too. Pass the starting value — and consider whether \`sum()\` says it more plainly.`,
    },
    {
      title: 'A lambda where a comprehension reads better',
      wrong: { code: py`orders = [{"total": 9.0, "paid": True}, {"total": 3.2, "paid": False}]
totals = list(map(lambda o: o["total"] * 1.2, filter(lambda o: o["paid"], orders)))
print(totals)`, lang: 'python' },
      right: { code: py`orders = [{"total": 9.0, "paid": True}, {"total": 3.2, "paid": False}]
totals = [o["total"] * 1.2 for o in orders if o["paid"]]
print(totals)`, lang: 'python' },
      explanation: py`When both the transformation and the test need lambdas, a comprehension says the same thing in reading order: "the total times 1.2, for each order, if it's paid".`,
    },
    {
      title: 'Using map for side effects',
      wrong: { code: py`emails = ["ada@example.com", "ben@example.com"]
map(print, emails)        # prints NOTHING: the map is never consumed`, lang: 'python' },
      right: { code: py`emails = ["ada@example.com", "ben@example.com"]
for email in emails:
    print(email)`, lang: 'python' },
      explanation: py`Because \`map\` is lazy, the function only runs when someone consumes the iterator — here nobody does. Actions belong in a \`for\` loop; \`map\` is for computing values.`,
    },
  ],
  debugging: [
    {
      symptom: py`<map object at 0x...> (or <filter object at 0x...>) printed instead of values`,
      cause: py`You printed the lazy iterator itself.`,
      fix: py`Wrap it: \`print(list(result))\`.`,
    },
    {
      symptom: py`TypeError: object of type 'map' has no len()`,
      cause: py`Iterators don't know their length in advance — they produce items on demand.`,
      fix: py`Convert once: \`items = list(result)\`, then use \`len(items)\`. To count without storing, use \`sum(1 for _ in result)\` (which consumes it).`,
    },
    {
      symptom: py`TypeError: reduce() of empty iterable with no initial value`,
      cause: py`\`reduce\` was called on an empty iterable (often after a \`filter\` that kept nothing) without a starting value.`,
      fix: py`Pass the initial value as the third argument: \`reduce(add, items, 0)\`.`,
    },
    {
      symptom: py`A second loop over the results does nothing, or a later step gets an empty list.`,
      cause: py`The map/filter iterator was already consumed by an earlier \`list()\`, \`sum()\`, \`len(list(...))\` or loop.`,
      fix: py`Materialise once (\`rows = list(...)\`) if you need several passes, or compute all results in one pass.`,
    },
    {
      symptom: py`TypeError: <lambda>() missing 1 required positional argument: 'b'`,
      cause: py`A two-argument function was passed to \`map\` with only one iterable (or a one-argument function to \`reduce\`).`,
      fix: py`\`map\` passes one argument per iterable; \`reduce\` always passes two (accumulator, item); \`filter\` and key functions pass one.`,
    },
  ],
  bestPractices: [
    'Use map/filter when you already have a named function (map(int, parts), filter(str.isdigit, tokens)).',
    'Use a comprehension or generator expression when you would need a lambda, or when you transform and filter together.',
    'Prefer sum, min, max, any, all, math.prod and str.join to reduce; when you do use reduce, pass an initial value.',
    'Use operator.itemgetter/attrgetter/methodcaller for key functions — clear, fast and picklable.',
    'Wrap lazy results in list() when you need to print, index, measure or reuse them; otherwise keep pipelines lazy.',
    'Never use map or a comprehension just for side effects — write a for loop.',
  ],
  whenToUse: {
    use: [
      'map: applying an existing function to every item — conversions, normalisation, parsing.',
      'filter: selecting with an existing predicate, or filter(None, items) to drop falsy values.',
      'reduce: custom associative combining (merging dicts, composing functions, folding intervals).',
      'operator functions: key functions for sorted/min/max/groupby and arguments to reduce.',
      'any/all: validation checks over many items with early exit.',
    ],
    avoid: [
      'map/filter with complicated lambdas — a comprehension or a named function is clearer.',
      'reduce for sums, products, maximums or string building — the built-ins say it better.',
      'Grouping and counting with reduce — use a loop, defaultdict or Counter.',
      'Lazy iterators when you need random access, len() or several passes.',
    ],
  },
  comparison: {
    title: 'Three ways to transform and select',
    headers: ['', 'map / filter', 'comprehension / generator expression', 'for loop'],
    rows: [
      ['result', 'lazy single-use iterator', 'list/set/dict (or lazy with ( … ))', 'whatever you build'],
      ['best when', 'you already have a named function', 'you would need a lambda, or transform + filter together', 'side effects, complex logic, early exits'],
      ['transform and filter at once', 'nest them: map(f, filter(p, xs))', '[f(x) for x in xs if p(x)]', 'if inside the loop'],
      ['several input sequences', 'map(f, xs, ys) — stops at the shortest', 'zip: [f(x, y) for x, y in zip(xs, ys)]', 'zip in the for statement'],
      ['readability', 'great with named functions, poor with lambdas', 'usually the most readable', 'explicit, but longer'],
    ],
    note: py`They're interchangeable for pure transformations — pick the one that reads best for the code in front of you. Speed differences are small and CPython-specific; measure if it matters.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'map-filter-reduce-q1',
      type: 'mcq',
      prompt: 'What does `map(str.upper, ["a", "b"])` return in Python 3?',
      options: [
        { text: "The list ['A', 'B']", why: 'That was Python 2. In Python 3 map is lazy and returns an iterator; wrap it in list() to get a list.' },
        'A lazy map iterator that produces "A" and then "B" when asked',
        { text: 'A generator function', why: 'It returns an iterator object of type map, not a function.' },
        { text: "The tuple ('A', 'B')", why: 'No container is built at all until something consumes the iterator.' },
      ],
      answer: 1,
      explanation: py`\`map\` returns a \`map\` object, an iterator. Nothing is computed until you iterate it, and it can be iterated only once.`,
    },
    {
      id: 'map-filter-reduce-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`nums = [1, 2, 3, 4]
evens = filter(lambda n: n % 2 == 0, nums)
print(list(evens), list(evens))`,
      answer: '[2, 4] []',
      accept: ['[2, 4] []'],
      explanation: py`The first \`list()\` consumes the filter iterator; the second finds it already exhausted.`,
    },
    {
      id: 'map-filter-reduce-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`print(all([]), any([]), all([0, 1]), any(["", "x"]))`,
      options: [
        'True False False True',
        { text: 'False False False True', why: 'all([]) is True: "every item is truthy" holds when there are no items (vacuous truth).' },
        { text: 'True True False True', why: 'any([]) is False: there is no truthy item to find.' },
        { text: 'True False True True', why: 'all([0, 1]) is False because 0 is falsy.' },
      ],
      answer: 0,
      explanation: py`\`all\` looks for a falsy item and \`any\` for a truthy one; with no items, \`all\` finds no counter-example (True) and \`any\` finds no example (False).`,
    },
    {
      id: 'map-filter-reduce-q4',
      type: 'bug',
      prompt: 'This crashes with `TypeError: can only concatenate str (not "int") to str`. Click the line with the bug.',
      code: py`from functools import reduce

words = ["tea", "cake", "jam"]
total_letters = reduce(lambda acc, word: acc + len(word), words)
print(total_letters)`,
      answerLine: 4,
      explanation: py`Without an initial value, \`reduce\` uses the first item, \`"tea"\`, as the accumulator, so the first call is \`"tea" + 4\`. Add \`, 0\` as the third argument (or write \`sum(len(w) for w in words)\`).`,
    },
    {
      id: 'map-filter-reduce-q5',
      type: 'fill',
      prompt: 'Sort the players by score using the operator module instead of a lambda.',
      code: py`from operator import ___

players = [{"name": "Ada", "score": 90}, {"name": "Ben", "score": 75}]
ranked = sorted(players, key=___("score"), reverse=True)`,
      answer: [['itemgetter'], ['itemgetter']],
      explanation: py`\`itemgetter("score")\` builds a function that returns \`item["score"]\` — the same as \`lambda p: p["score"]\`, implemented in C and picklable.`,
    },
    {
      id: 'map-filter-reduce-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`names = ["ada", "ben", "cy"]
ages = [36, 41]
print(list(map(lambda n, a: f"{n}:{a}", names, ages)))`,
      options: [
        "['ada:36', 'ben:41']",
        { text: "['ada:36', 'ben:41', 'cy:None']", why: 'map does not pad missing values; it stops at the shortest iterable, like zip.' },
        { text: 'ValueError: map() argument 2 is shorter than argument 1', why: 'That only happens with strict=True (3.14+). The default silently stops at the shortest.' },
        { text: 'TypeError: <lambda>() missing 1 required positional argument', why: 'map passes one argument from each iterable, so the lambda receives two.' },
      ],
      answer: 0,
      explanation: py`With several iterables, \`map\` calls the function with one item from each and stops when the shortest runs out — "cy" is silently dropped. Use \`strict=True\` (3.14+) to turn that into an error.`,
    },
    {
      id: 'map-filter-reduce-q7',
      type: 'short',
      prompt: 'When would you choose `map()`/`filter()` over a comprehension, and when the other way round?',
      answer: py`Choose \`map\`/\`filter\` when you already have a named function and want a lazy result: \`map(int, parts)\`, \`filter(str.isdigit, tokens)\`, \`filter(None, values)\`. Choose a comprehension (or generator expression) when you'd need a lambda, when you transform and filter in one go, or when you want a list/set/dict directly — it reads in natural order and is the more common Python idiom. Both are equally functional; it's a readability choice.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'log-pipeline',
      title: 'A log-file pipeline',
      difficulty: 'intermediate',
      prompt: py`Each log line looks like \`"2024-05-01 12:00:07 ERROR database timeout"\`: date, time, level, then a message that may contain spaces. Some lines are blank or only spaces.

Write:

1. \`parse(line)\` → a tuple \`(level, message)\`, e.g. \`("ERROR", "database timeout")\`.
2. \`entries(lines)\` → a **list** of \`(level, message)\` tuples for every non-blank line (skip lines that are empty or whitespace-only).
3. \`error_messages(lines)\` → a **list** of the messages whose level is \`"ERROR"\`, in order.
4. \`level_counts(lines)\` → a **dict** \`{level: count}\`.

Try to build them from \`map\`, \`filter\` and \`reduce\` (the tests only check the results).`,
      files: {
        'main.py': py`from functools import reduce

LOG = [
    "2024-05-01 12:00:01 INFO server started",
    "2024-05-01 12:00:07 ERROR database timeout",
    "",
    "2024-05-01 12:01:15 WARNING disk 85% full",
    "   ",
    "2024-05-01 12:02:00 ERROR payment service unavailable",
    "2024-05-01 12:02:30 INFO request served",
]


def parse(line):
    # TODO: return (level, message)
    return ("", "")


def entries(lines):
    # TODO: parse every non-blank line
    return []


def error_messages(lines):
    # TODO
    return []


def level_counts(lines):
    # TODO: {level: count}
    return {}


print(error_messages(LOG))
print(level_counts(LOG))
`,
      },
      hints: [
        'line.split(" ", 3) splits on the first three spaces only, so the message keeps its own spaces. str.strip returns "" (falsy) for whitespace-only lines — a handy filter predicate.',
        'entries: list(map(parse, filter(str.strip, lines))). error_messages: filter entries whose level is "ERROR", then map to the message.',
        'level_counts: reduce(lambda counts, level: counts | {level: counts.get(level, 0) + 1}, (level for level, _ in entries(lines)), {})',
      ],
      solution: {
        explanation: py`\`split(" ", 3)\` limits the split to three cuts, so everything after the level stays one message string. \`filter(str.strip, lines)\` uses an existing method as the predicate: whitespace-only lines strip to \`""\`, which is falsy, so they're dropped. \`entries\` maps \`parse\` over what's left. \`error_messages\` filters on the level and maps to the message. \`level_counts\` folds levels into a dict, starting from \`{}\`; each step returns a new dict with one count bumped. In production you'd probably write \`Counter(level for level, _ in entries(lines))\` — same result, clearer intent — but it's worth seeing that a counter *is* a fold.`,
        files: {
          'main.py': py`from functools import reduce

LOG = [
    "2024-05-01 12:00:01 INFO server started",
    "2024-05-01 12:00:07 ERROR database timeout",
    "",
    "2024-05-01 12:01:15 WARNING disk 85% full",
    "   ",
    "2024-05-01 12:02:00 ERROR payment service unavailable",
    "2024-05-01 12:02:30 INFO request served",
]


def parse(line):
    _date, _time, level, message = line.split(" ", 3)
    return (level, message)


def entries(lines):
    return list(map(parse, filter(str.strip, lines)))


def error_messages(lines):
    errors = filter(lambda entry: entry[0] == "ERROR", entries(lines))
    return [message for _level, message in errors]


def level_counts(lines):
    levels = (level for level, _message in entries(lines))
    return reduce(lambda counts, level: counts | {level: counts.get(level, 0) + 1}, levels, {})


print(error_messages(LOG))
print(level_counts(LOG))
`,
        },
      },
      tests: [
        { name: 'parse splits level and message', code: py`assert parse("2024-05-01 12:00:07 ERROR database timeout") == ("ERROR", "database timeout")` },
        { name: 'entries skips blank and whitespace-only lines', code: py`result = entries(LOG)
assert isinstance(result, list) and len(result) == 5
assert result[2] == ("WARNING", "disk 85% full")` },
        { name: 'error_messages keeps only errors, in order', code: py`assert error_messages(LOG) == ["database timeout", "payment service unavailable"]` },
        { name: 'level_counts counts each level', code: py`assert level_counts(LOG) == {"INFO": 2, "ERROR": 2, "WARNING": 1}` },
        { name: 'works on an empty log', code: py`assert entries([]) == [] and error_messages([]) == [] and level_counts([]) == {}` },
      ],
    },
    {
      id: 'leaderboard-operator',
      title: 'Leaderboard with the operator module',
      difficulty: 'intermediate',
      prompt: py`Players are dicts like \`{"name": "Ada", "score": 90, "time": 31}\` (time in seconds — lower is better).

Write:

1. \`rank(players)\` → a **new** list sorted by **score, highest first**, and for equal scores by **time, lowest first**. Don't change the input list.
2. \`podium(players)\` → a list of the **names** of the top three ranked players.
3. \`total_score(players)\` → the sum of all scores, using \`functools.reduce\` with \`operator.add\` (0 for an empty list).
4. \`everyone_scored(players)\` → \`True\` if every player has a score above 0 (also \`True\` for an empty list).`,
      files: {
        'main.py': py`from functools import reduce
from operator import add, itemgetter

PLAYERS = [
    {"name": "Ada", "score": 90, "time": 31},
    {"name": "Ben", "score": 75, "time": 25},
    {"name": "Cy", "score": 90, "time": 28},
    {"name": "Dee", "score": 60, "time": 40},
]


def rank(players):
    # TODO: score high -> low, then time low -> high
    return players


def podium(players):
    # TODO: names of the top three
    return []


def total_score(players):
    # TODO: reduce with operator.add
    return 0


def everyone_scored(players):
    # TODO
    return False


print(podium(PLAYERS), total_score(PLAYERS), everyone_scored(PLAYERS))
`,
      },
      hints: [
        'Mixed directions (score descending, time ascending) can\'t be expressed by a single itemgetter. Either negate the score in a key function, or sort twice — Python\'s sort is stable.',
        'sorted(players, key=lambda p: (-p["score"], p["time"])). podium: list(map(itemgetter("name"), rank(players)[:3])). total: reduce(add, map(itemgetter("score"), players), 0).',
        'everyone_scored: all(p["score"] > 0 for p in players)',
      ],
      solution: {
        explanation: py`A tuple key \`(-score, time)\` sorts by score descending (negating flips the order for numbers) and breaks ties by time ascending. The alternative, which also works for non-numeric fields, is two stable sorts: \`sorted(sorted(players, key=itemgetter("time")), key=itemgetter("score"), reverse=True)\` — the second sort keeps the time order among equal scores. \`podium\` maps \`itemgetter("name")\` over the first three. \`total_score\` folds the scores with \`operator.add\`, starting at 0 so an empty list is fine — exactly what \`sum()\` does, which is what you'd write in real code. \`all\` is \`True\` for an empty iterable and stops at the first non-positive score.`,
        files: {
          'main.py': py`from functools import reduce
from operator import add, itemgetter

PLAYERS = [
    {"name": "Ada", "score": 90, "time": 31},
    {"name": "Ben", "score": 75, "time": 25},
    {"name": "Cy", "score": 90, "time": 28},
    {"name": "Dee", "score": 60, "time": 40},
]


def rank(players):
    return sorted(players, key=lambda p: (-p["score"], p["time"]))


def podium(players):
    return list(map(itemgetter("name"), rank(players)[:3]))


def total_score(players):
    return reduce(add, map(itemgetter("score"), players), 0)


def everyone_scored(players):
    return all(p["score"] > 0 for p in players)


print(podium(PLAYERS), total_score(PLAYERS), everyone_scored(PLAYERS))
`,
        },
      },
      tests: [
        { name: 'rank orders by score, then time', code: py`assert [p["name"] for p in rank(PLAYERS)] == ["Cy", "Ada", "Ben", "Dee"]` },
        { name: 'rank does not change the input', code: py`players = [dict(p) for p in PLAYERS]
rank(players)
assert [p["name"] for p in players] == ["Ada", "Ben", "Cy", "Dee"]` },
        { name: 'podium has the top three names', code: py`assert podium(PLAYERS) == ["Cy", "Ada", "Ben"]` },
        { name: 'total_score adds scores (0 when empty)', code: py`assert total_score(PLAYERS) == 315 and total_score([]) == 0` },
        { name: 'everyone_scored', code: py`assert everyone_scored(PLAYERS) is True
assert everyone_scored([{"name": "Zed", "score": 0, "time": 1}]) is False
assert everyone_scored([]) is True` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'map-filter-reduce-laziness',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'map() and filter() return iterators in Python 3. What does that mean in practice?',
      answer: 'They compute nothing up front; each item is produced only when something asks for it. So they use constant memory and can work on huge or infinite inputs, but they can be consumed only once, have no len() or indexing, and print as <map object>.',
      explanation: py`Laziness lets you chain steps over a file or a generator without building intermediate lists. The costs: wrap in \`list()\` to reuse or inspect, and errors inside the mapped function appear when the iterator is consumed, not when \`map\` is called.`,
      whyAsked: 'Laziness explains a whole family of bugs (empty second loop, map for side effects doing nothing).',
      mistakes: ['Saying map returns a list (Python 2 behaviour)', 'Not knowing iterators are single-use', 'Thinking laziness makes each item faster'],
      followUps: ['What happens to `map(print, items)` if nobody consumes it?', 'How do you iterate a map twice?'],
      modelAnswer: 'In Python 3, map and filter return lazy iterators. Creating one does no work; each result is computed only when something asks for the next item — a for loop, list(), sum() and so on. That means constant memory and the ability to chain steps over very large inputs. The flip side is that they are single-use: after one pass they are exhausted, they have no len() or indexing, and if you print one you see a map object. If I need the results more than once, I convert to a list. It also means map used only for side effects does nothing until it is consumed.',
    },
    {
      id: 'map-filter-reduce-reduce-when',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'When is functools.reduce the right tool, and what should you usually use instead?',
      answer: 'Use reduce for a genuinely custom, usually associative combine step — merging dicts or intervals, composing functions, combining sets. For common folds use the named built-ins: sum, min, max, any, all, math.prod, str.join, Counter. Always pass an initial value.',
      explanation: py`\`reduce\` was demoted from built-in to \`functools\` in Python 3 because explicit loops and named folds are usually clearer. The named built-ins also handle empty input and are optimised. A good test: if you can say the fold's name ("sum of", "largest"), use the built-in.`,
      code: { lang: 'python', code: py`from functools import reduce

def compose(*functions):
    return reduce(lambda f, g: lambda x: f(g(x)), functions, lambda x: x)

print(compose(str.upper, str.strip)("  hi "))   # HI — a fold that has no built-in` },
      whyAsked: 'It shows whether you write idiomatic Python rather than translating patterns from other languages.',
      mistakes: ['Using reduce(lambda a, b: a + b, xs) instead of sum(xs)', 'Forgetting the initial value', 'Writing unreadable reduce calls with complex lambdas'],
      followUps: ['Why was reduce moved out of builtins?', 'What does reduce do with an empty iterable?'],
      modelAnswer: 'reduce folds an iterable into one value by repeatedly combining an accumulator with the next item. It is the right tool when the combining step is custom — merging dictionaries, composing a list of functions, folding overlapping intervals. For the common cases Python has named functions: sum, min, max, any, all, math.prod, str.join, Counter. Those are clearer, handle empty input and are optimised. When I do use reduce I always pass an initial value, so empty input and type mismatches are not a problem.',
    },
    {
      id: 'map-filter-reduce-operator',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does the operator module give you, and why might you prefer itemgetter or attrgetter over a lambda?',
      answer: 'Functions for every operator (add, mul, neg, contains…) plus itemgetter, attrgetter and methodcaller factories. They are concise, self-describing, support several keys (returning tuples) and dotted attribute paths, are implemented in C in CPython, and can be pickled — lambdas cannot.',
      explanation: py`\`itemgetter("a", "b")\` returns a tuple key for multi-field sorting; \`attrgetter("address.city")\` follows dotted names; \`methodcaller("split", ",")\` passes arguments. Picklability matters when sending key functions to \`multiprocessing\` workers. For mixed sort directions you still need a lambda (\`-score\`) or two stable sorts.`,
      whyAsked: 'Checks fluency with the standard library’s functional toolkit.',
      mistakes: ['Not knowing itemgetter accepts several keys', 'Claiming large speed-ups without measuring', 'Thinking itemgetter can sort fields in different directions'],
      followUps: ['How do you sort by score descending and name ascending?', 'Why can’t lambdas be pickled?'],
      modelAnswer: 'The operator module exposes Python’s operators as functions — add, mul, neg, contains and so on — which is handy as arguments to reduce or map. It also has three factories: itemgetter for obj[key], attrgetter for obj.attr including dotted paths, and methodcaller for calling a method with fixed arguments. I like them for key functions because they say exactly what they do, they accept several keys and return tuples for multi-field sorting, they are implemented in C in CPython, and unlike lambdas they can be pickled, which matters with multiprocessing.',
    },
    {
      id: 'map-filter-reduce-consumed',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'An ETL step does `rows = map(parse, open(path))`, then `log.info("rows: %d", len(list(rows)))`, then `for row in rows: save(row)`. Nothing is ever saved, and on a large file memory spikes. Explain and fix.',
      answer: 'len(list(rows)) consumes the lazy map (and builds the whole file in memory just to count it), so the for loop finds an exhausted iterator. Fix: process in a single pass and count as you go — for count, row in enumerate(rows, 1): save(row) — then log the count afterwards.',
      explanation: py`Lazy pipelines are single-use. Materialising them "just to count" both destroys the laziness (memory) and empties the iterator (correctness). If several passes are genuinely needed, either store a list knowingly or re-open the source. Also open the file with \`with\` so it's closed.`,
      code: { lang: 'python', code: py`def load(lines, parse, save):
    count = 0
    for count, row in enumerate(map(parse, lines), start=1):
        save(row)
    return count

saved = []
print(load(["1", "2", "3"], int, saved.append), saved)   # 3 [1, 2, 3]` },
      whyAsked: 'A realistic bug that tests understanding of iterators, memory and single-pass processing.',
      mistakes: ['Suggesting list(rows) once at the top for a huge file without discussing memory', 'Not noticing the iterator is consumed', 'Forgetting to close the file'],
      followUps: ['How would you also count failed rows?', 'When is itertools.tee appropriate here?'],
      modelAnswer: 'rows is a lazy map over the file. len(list(rows)) pulls every line through parse and holds them all in memory just to count them — that is the memory spike — and it also exhausts the iterator, so the for loop afterwards gets nothing and nothing is saved. The fix is to do everything in one pass: loop with enumerate, save each row, and log the count after the loop. That keeps memory flat and processes each row once. If I really needed two passes I would either deliberately store a list, if it fits, or re-open the file; and I would open it with a with statement so it is closed.',
    },
    {
      id: 'map-filter-reduce-top-customers',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `top_customers(orders, n)`: orders are dicts with `customer`, `total` and `status`. Consider only `"paid"` orders, add up each customer’s totals, and return the names of the `n` customers with the highest totals — ties broken alphabetically.',
      answer: 'Filter paid orders, fold totals into a dict per customer, sort the items by (-total, name), take n and map to names.',
      explanation: py`Grouping is clearest as a small loop (or \`defaultdict(float)\`); selection and ordering are a filter plus a sort with a tuple key. Negating the total gives descending order while names stay ascending.`,
      starter: { files: { 'main.py': py`def top_customers(orders, n):
    # TODO: paid orders only, totals per customer, top n names
    return [order["customer"] for order in orders][:n]


ORDERS = [
    {"customer": "ada", "total": 9.0, "status": "paid"},
    {"customer": "ben", "total": 30.0, "status": "refunded"},
    {"customer": "cy", "total": 12.5, "status": "paid"},
    {"customer": "ada", "total": 8.25, "status": "paid"},
    {"customer": "dee", "total": 12.5, "status": "paid"},
]
print(top_customers(ORDERS, 2))
` } },
      tests: [
        { name: 'top two by summed paid totals', code: py`assert top_customers(ORDERS, 2) == ["ada", "cy"]` },
        { name: 'ties are broken alphabetically', code: py`assert top_customers(ORDERS, 3) == ["ada", "cy", "dee"]` },
        { name: 'unpaid orders are ignored', code: py`assert "ben" not in top_customers(ORDERS, 10)` },
        { name: 'empty input', code: py`assert top_customers([], 3) == []` },
      ],
      solution: { files: { 'main.py': py`def top_customers(orders, n):
    totals = {}
    for order in filter(lambda o: o["status"] == "paid", orders):
        totals[order["customer"]] = totals.get(order["customer"], 0) + order["total"]
    ranked = sorted(totals.items(), key=lambda item: (-item[1], item[0]))
    return [name for name, _total in ranked[:n]]


ORDERS = [
    {"customer": "ada", "total": 9.0, "status": "paid"},
    {"customer": "ben", "total": 30.0, "status": "refunded"},
    {"customer": "cy", "total": 12.5, "status": "paid"},
    {"customer": "ada", "total": 8.25, "status": "paid"},
    {"customer": "dee", "total": 12.5, "status": "paid"},
]
print(top_customers(ORDERS, 2))
` } },
      hints: ['Three steps: select paid orders, group totals per customer, sort and slice.', 'totals[name] = totals.get(name, 0) + order["total"]', 'sorted(totals.items(), key=lambda item: (-item[1], item[0]))'],
      whyAsked: 'A typical "small data pipeline" question: filtering, grouping, multi-key sorting.',
      mistakes: ['Forgetting to sum per customer (ranking single orders)', 'Sorting ties in the wrong direction', 'Using reduce for grouping and making it unreadable'],
      followUps: ['How would you do this over a 50 GB file?', 'How would heapq.nlargest change the complexity?'],
      modelAnswer: 'I split it into three steps. First select the paid orders with filter or a condition. Then group: a dictionary of running totals per customer — a plain loop is clearest for that. Finally sort the dictionary items with the key (-total, name), so higher totals come first and ties are alphabetical, slice the first n and map to names. That is O(m log m) for m customers; for a small n over many customers I could use heapq.nlargest with the same key instead of a full sort.',
    },
    {
      id: 'map-filter-reduce-multi-iterables',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`from operator import mul

prices = [4.5, 3.0, 2.0]
quantities = [2, 4]
print(list(map(mul, prices, quantities)), sum(map(mul, prices, quantities)))` },
      options: ['[9.0, 12.0] 21.0', '[9.0, 12.0, 2.0] 23.0', 'ValueError: map() argument 2 is shorter than argument 1', 'TypeError: mul expected 2 arguments, got 1'],
      correctOption: 0,
      answer: '`[9.0, 12.0] 21.0` — map passes one item from each iterable to mul and silently stops at the shortest; the 2.0 price is dropped.',
      explanation: py`Each \`map\` call creates a fresh iterator, so the second one isn't exhausted. The silent truncation is the real lesson: in 3.14+ \`map(mul, prices, quantities, strict=True)\` raises \`ValueError\` instead — the same safety switch \`zip\` has had since 3.10.`,
      whyAsked: 'Tests precise knowledge of map with several iterables and the danger of silent truncation.',
      mistakes: ['Expecting padding or an error by default', 'Thinking the second map is exhausted (it is a new iterator)'],
      followUps: ['How would you make the mismatch an error before 3.14?', 'What does itertools.zip_longest do?'],
      modelAnswer: 'It prints [9.0, 12.0] and 21.0. With several iterables, map calls the function with one item from each and stops as soon as the shortest runs out, so the third price is silently ignored. The two map calls are separate iterators, so the second isn’t exhausted. Silent truncation is a classic data bug; in 3.14 map gained strict=True to raise ValueError, and before that I would use zip(strict=True) from 3.10 or check the lengths explicitly.',
    },
  ],

  takeaways: [
    'map transforms every item, filter keeps items that pass a test, reduce folds everything into one value.',
    'map and filter are lazy, single-use iterators: wrap them in list() to print, measure or reuse.',
    'With several iterables, map stops at the shortest (strict=True raises instead, 3.14+).',
    'Prefer sum, min, max, any, all, math.prod and join to reduce; when you use reduce, pass an initial value.',
    'operator.itemgetter / attrgetter / methodcaller / add replace small lambdas — clear, fast and picklable.',
    'Choose map/filter with named functions and comprehensions when you would need a lambda; use loops for side effects.',
  ],
}
