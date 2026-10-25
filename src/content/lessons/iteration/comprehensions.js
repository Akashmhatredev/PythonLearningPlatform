// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GRADE_BOOK = py`# Grade book: four students, three tests each
grades = {
    "Ada": [92, 88, 95],
    "Ben": [55, 61, 48],
    "Cy": [73, 60, 81],
    "Dee": [38, 52, 45],
}

# 1. list comprehension: one new item per old item
names = [name.upper() for name in grades]
print("Students:", names)

# 2. dict comprehension: name -> average, rounded to 1 decimal place
averages = {name: round(sum(scores) / len(scores), 1) for name, scores in grades.items()}
print("Averages:", averages)

# 3. filter with a trailing if: only some items make it in
honour_roll = [name for name, avg in averages.items() if avg >= 70]
print("Honour roll:", honour_roll)

# 4. conditional expression up front: every item gets a label
labels = {name: "pass" if avg >= 50 else "fail" for name, avg in averages.items()}
print("Labels:", labels)


def letter(score):
    if score >= 85:
        return "A"
    if score >= 70:
        return "B"
    if score >= 50:
        return "C"
    return "F"


# 5. set comprehension with two for clauses: every distinct letter grade given
letters = {letter(s) for scores in grades.values() for s in scores}
print("Letters used:", sorted(letters))
`

export default {
  id: 'comprehensions',
  title: 'List, dict & set comprehensions',
  summary: 'A comprehension builds a new list, dict or set from an iterable in one readable expression — transform each item, optionally keep only some.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['for-loops', 'lists', 'dictionaries', 'sets'],
  related: ['lazy-evaluation', 'iterators', 'generators', 'map-filter-reduce', 'lambdas-and-higher-order', 'scope', 'mutability-and-copying'],
  tags: ['comprehension', 'list comprehension', 'dict comprehension', 'set comprehension', 'filter', 'conditional expression', 'ternary', 'nested comprehension', 'flatten', 'PEP 709', 'readability', 'pythonic'],
  apis: [
    { name: '[expr for x in iterable]', summary: 'List comprehension: builds a new list with one item per element of the iterable.' },
    { name: '[expr for x in iterable if cond]', summary: 'Filtering comprehension: only elements for which cond is true produce an item.' },
    { name: '{key: value for x in iterable}', summary: 'Dict comprehension: builds a new dict; a repeated key keeps the last value.' },
    { name: '{expr for x in iterable}', summary: 'Set comprehension: builds a new set, so duplicates disappear.' },
    { name: 'a if cond else b', summary: 'Conditional expression: picks one of two values; inside a comprehension it transforms every item.' },
    { name: 'dict.items()', summary: 'Iterates over (key, value) pairs — the usual source for dict comprehensions.' },
  ],
  docs: [
    { label: 'Python tutorial — list comprehensions', url: 'https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions' },
    { label: 'Language reference — displays for lists, sets and dictionaries', url: 'https://docs.python.org/3/reference/expressions.html#displays-for-lists-sets-and-dictionaries' },
    { label: 'PEP 274 — dict comprehensions', url: 'https://peps.python.org/pep-0274/' },
    { label: 'PEP 709 — inlined comprehensions (CPython 3.12)', url: 'https://peps.python.org/pep-0709/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Again and again, programs do the same three-step dance: start with an empty list, loop over some data, and \`append\` a transformed version of each item. A **comprehension** packs that dance into one expression:`,
    { code: py`prices = [4.0, 12.5, 3.2]

with_tax = []                      # the loop way: four lines
for p in prices:
    with_tax.append(round(p * 1.2, 2))

with_tax = [round(p * 1.2, 2) for p in prices]   # the comprehension way: one line
print(with_tax)   # [4.8, 15.0, 3.84]`, lang: 'python', title: 'same result, two styles' },
    py`Read it left to right as English: "a list of \`round(p * 1.2, 2)\` **for** every \`p\` **in** \`prices\`". Add an \`if\` at the end to keep only some items, swap the square brackets for curly ones to build a **dict** or a **set**.`,
    py`Comprehensions are one of the most recognisable features of Pythonic code. They build on [for loops](lesson:for-loops), and their lazy cousin, the *generator expression*, is the star of [generator expressions & lazy pipelines](lesson:lazy-evaluation).`,
  ],
  why: [
    py`**Intent at a glance.** A loop with \`append\` could be doing anything — printing, saving, counting. A comprehension can only do one thing: build a new collection. The reader knows that before reading the details.`,
    py`**Fewer moving parts.** No empty list to create first, no \`append\` to forget, no half-built list hanging around if something goes wrong halfway.`,
    py`**Safer names.** The loop variable lives *inside* the comprehension and disappears afterwards, so it can't accidentally overwrite (or be confused with) a variable outside.`,
    py`**Usually faster.** In CPython a comprehension avoids looking up and calling \`.append\` on every item, so it typically beats the equivalent loop. It's a nice bonus, not the main reason — readability is.`,
  ],
  eli15: [
    py`Imagine a teacher with a pile of test papers. She says: *"Give me the name of every student who scored over 70."* That one sentence describes a whole job — go through the pile, check each score, write down the matching names.`,
    py`A comprehension is that sentence in Python: \`[name for name, score in papers if score > 70]\`. You describe **what** the new list should contain; Python does the going-through-the-pile part for you.`,
    py`Square brackets give you a list, curly brackets with \`key: value\` give you a dictionary, and curly brackets with just one thing give you a set (no duplicates allowed).`,
  ],
  analogy: {
    title: 'The juice bar order slip',
    body: [
      py`A juice bar has a crate of fruit. The order slip says: *"For every fruit in the crate, if it's ripe, peel it and put it in a new cup."* The crate is not changed; a brand-new cup of peeled ripe fruit comes out.`,
      py`Every comprehension has those exact parts: a **source** (the crate), a **loop variable** (the fruit currently in your hand), an optional **filter** (is it ripe?), an **expression** applied to each survivor (peel it) and a **new container** (the cup — a list, a dict or a set).`,
    ],
    mapping: [
      ['the crate of fruit', 'the iterable you loop over: prices, grades.items()'],
      ['the fruit in your hand', 'the loop variable: for p in prices'],
      ['"if it\'s ripe"', 'the optional filter at the end: if p < 5'],
      ['"peel it"', 'the expression at the front: p * 2'],
      ['a brand-new cup', 'the new list / dict / set — the source is never changed'],
      ['a cup that refuses doubles', 'a set comprehension: duplicates are dropped'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A loop and a comprehension doing the same job',
    props: {
      code: py`def with_loop(prices):
    deals = []
    for p in prices:
        if p < 5:
            deals.append(p * 2)
    return deals


def with_comprehension(prices):
    deals = [p * 2 for p in prices if p < 5]
    return deals


prices = [3, 8, 4]
print(with_loop(prices))
print(with_comprehension(prices))
`,
      notes: {
        2: 'The loop version needs an empty list first. You can watch `deals` grow one `append` at a time.',
        3: 'Each pass binds `p` to the next price.',
        6: 'Notice `p` is **still here** after the loop finished — loop variables outlive the loop.',
        10: 'The comprehension runs the same loop on one line. `p` appears while it runs; the half-built list is kept out of sight until it is complete.',
        11: '`p` is gone: comprehension variables never leak into the surrounding function.',
      },
    },
    alt: 'A step-by-step trace. In with_loop, the local variables are prices, deals and p; deals grows from an empty list to [6, 8] and p is still visible with the value 4 when the function returns. In with_comprehension, line 10 runs three times with p equal to 3, 8 and 4; after the line finishes, only prices and deals remain — p has disappeared — and deals is [6, 8].',
    caption: py`Step through both functions with ▶. They return the same \`[6, 8]\`, but only the loop leaves \`p\` behind. Comprehension variables are private to the comprehension.`,
  },
  syntax: [
    py`#### The three shapes`,
    { code: py`names = ["ada", "ben", "cy", "ben"]

upper = [n.upper() for n in names]          # list  -> ['ADA', 'BEN', 'CY', 'BEN']
lengths = {n: len(n) for n in names}         # dict  -> {'ada': 3, 'ben': 3, 'cy': 2}
unique = {n for n in names}                  # set   -> {'ada', 'ben', 'cy'} (order may vary)`, lang: 'python', title: 'list, dict, set' },
    py`- \`[ ... ]\` with one expression → **list** (keeps order and duplicates).
- \`{ key: value ... }\` → **dict**. If two items produce the same key, the **last one wins** silently.
- \`{ ... }\` with one expression → **set** (no duplicates, no guaranteed order).
- There is **no tuple comprehension**: \`( ... for ... )\` builds a *generator* — see [lazy evaluation](lesson:lazy-evaluation). Use \`tuple(x for x in ...)\` if you need a tuple.`,
    py`#### Filtering vs transforming — where the \`if\` goes`,
    { code: py`scores = [45, 82, 67, 30]

# FILTER: "if" at the END -> some items are left out
passed = [s for s in scores if s >= 50]                       # [82, 67]

# TRANSFORM: "if ... else" at the FRONT -> every item is kept, but changed
labels = ["pass" if s >= 50 else "fail" for s in scores]      # ['fail', 'pass', 'pass', 'fail']

# both at once: keep only passes, then label them by band
bands = ["high" if s >= 80 else "mid" for s in scores if s >= 50]   # ['high', 'mid']`, lang: 'python', title: 'the two kinds of if' },
    py`The front \`a if cond else b\` is a **conditional expression** — an expression that picks one of two values — so it *must* have an \`else\`. The trailing \`if\` is a **filter** clause and must *not* have one. Mixing them up is the most common comprehension \`SyntaxError\`.`,
    py`#### More than one \`for\``,
    { code: py`matrix = [[1, 2, 3], [4, 5, 6]]

# Two for clauses read top-to-bottom, exactly like nested loops:
flat = [n for row in matrix for n in row]          # [1, 2, 3, 4, 5, 6]

# The same thing written as loops:
flat = []
for row in matrix:          # first "for" = outer loop
    for n in row:           # second "for" = inner loop
        flat.append(n)

# A comprehension INSIDE a comprehension builds nested lists:
doubled = [[n * 2 for n in row] for row in matrix]  # [[2, 4, 6], [8, 10, 12]]`, lang: 'python', title: 'flattening vs nesting' },
    py`The rule for several \`for\` clauses: **write them in the same order you'd write the nested loops.** The expression at the front is the only part that moves.`,
    { callout: 'tip', title: 'Long comprehensions can span lines', text: py`Inside brackets Python ignores line breaks, so break a long comprehension at its clauses:

\`\`\`python
grades = {"Ada": [92, 88], "Ben": [55, 48]}
report = {
    name: sum(scores) / len(scores)
    for name, scores in grades.items()
    if scores
}
\`\`\`` },
    py`#### Building dicts`,
    { code: py`prices = {"apple": 0.5, "melon": 3.0, "kiwi": 0.25}

doubled = {fruit: p * 2 for fruit, p in prices.items()}       # transform values
cheap = {fruit: p for fruit, p in prices.items() if p < 1}    # filter entries
by_price = {p: fruit for fruit, p in prices.items()}          # swap keys and values
from_pairs = {k: v for k, v in zip(["a", "b"], [1, 2])}       # from two lists (dict(zip(...)) is simpler)`, lang: 'python', title: 'common dict comprehension patterns' },
  ],
  walkthrough: {
    title: 'Reading the grade book line by line',
    lang: 'python',
    code: GRADE_BOOK,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 7], text: py`A dict maps each student's name to a list of three test scores. Every comprehension below reads from it; none of them changes it.` },
      { lines: [10, 11], text: py`Looping over a dict gives its **keys**, so \`name\` is each student in insertion order. The expression \`name.upper()\` runs once per key: \`['ADA', 'BEN', 'CY', 'DEE']\`.` },
      { lines: [14, 15], text: py`A **dict comprehension**: \`grades.items()\` yields \`(name, scores)\` pairs, which are unpacked into two loop variables. Each pair becomes one \`key: value\` entry — the name and its rounded average.` },
      { lines: [18, 19], text: py`The trailing \`if avg >= 70\` is a **filter**: Ben (54.7) and Dee (45.0) never reach the expression, so only \`['Ada', 'Cy']\` make the honour roll.` },
      { lines: [22, 23], text: py`Here the \`if\` is at the **front**, as part of a conditional expression. Nobody is filtered out — every student gets a label, \`"pass"\` or \`"fail"\`.` },
      { lines: [26, 33], text: py`Multi-branch logic doesn't belong inside a comprehension. Moving it into a small, named function keeps the comprehension short and makes \`letter()\` testable on its own.` },
      { lines: [36, 38], text: py`Two \`for\` clauses: for each list of scores, for each score in it. The set keeps each letter once, and \`sorted()\` turns it into an ordered list for printing, because sets have no guaranteed order.` },
    ],
  },
  playground: {
    title: 'Grade book',
    objective: 'Run it, match every printed line to its comprehension, then add your own comprehensions in the experiments.',
    files: { 'main.py': GRADE_BOOK },
    expected: py`Five lines:

\`\`\`text
Students: ['ADA', 'BEN', 'CY', 'DEE']
Averages: {'Ada': 91.7, 'Ben': 54.7, 'Cy': 71.3, 'Dee': 45.0}
Honour roll: ['Ada', 'Cy']
Labels: {'Ada': 'pass', 'Ben': 'pass', 'Cy': 'pass', 'Dee': 'fail'}
Letters used: ['A', 'B', 'C', 'F']
\`\`\``,
    experiments: [
      {
        id: 'best-scores',
        task: py`Add a dict comprehension named \`best\` that maps each student to their **highest** score, and print it.`,
        hint: py`Copy the shape of \`averages\`, but use \`max(scores)\` as the value.`,
        tests: [
          { name: 'best maps each name to its top score', code: py`assert ns.get('best') == {"Ada": 95, "Ben": 61, "Cy": 81, "Dee": 52}, 'best should be {"Ada": 95, "Ben": 61, "Cy": 81, "Dee": 52}'` },
        ],
        explain: py`\`{name: max(scores) for name, scores in grades.items()}\` keeps every key and replaces each value. Any function call can sit in the value position.`,
      },
      {
        id: 'low-marks',
        task: py`Build a list \`low_marks\` of \`(name, score)\` tuples for **every individual score below 50**, in the order they appear. Use one comprehension with two \`for\` clauses.`,
        hint: py`Outer loop over \`grades.items()\`, inner loop over \`scores\`, filter at the end: \`[(name, s) for name, scores in grades.items() for s in scores if s < 50]\`.`,
        tests: [
          { name: 'low_marks lists every score under 50', code: py`assert ns.get('low_marks') == [("Ben", 48), ("Dee", 38), ("Dee", 45)]` },
        ],
        explain: py`The two \`for\` clauses read like nested loops: for each student, for each of their scores. The filter runs innermost, once per individual score. The expression \`(name, s)\` can use variables from **both** loops.`,
      },
      {
        id: 'curve',
        task: py`The teacher adds 5 bonus points to every test, but no score may go above 100. Build \`curved\`, a dict mapping each name to a **new list** of curved scores. Don't change \`grades\`.`,
        hint: py`A list comprehension inside a dict comprehension: \`{name: [min(s + 5, 100) for s in scores] for name, scores in grades.items()}\`.`,
        tests: [
          { name: 'Ada is capped at 100', code: py`assert ns.get('curved', {}).get("Ada") == [97, 93, 100]` },
          { name: 'everyone gets +5', code: py`assert curved["Dee"] == [43, 57, 50] and curved["Ben"] == [60, 66, 53]` },
          { name: 'the original grades are untouched', code: py`assert grades["Ada"] == [92, 88, 95]` },
        ],
        explain: py`The inner comprehension builds a fresh list for each student; the outer one builds a fresh dict. Because comprehensions always create new containers, \`grades\` is never modified — that's a big part of why they are safe to use.`,
      },
      {
        id: 'leak',
        task: py`At the very end, add \`print(name)\`. Run it — what happens? Now add an ordinary loop above it, \`for name in grades: pass\`, and run again.`,
        hint: py`The first run should crash with a \`NameError\`; the second prints the last key.`,
        explain: py`None of the comprehensions leaked their variable \`name\` into the module, so the first \`print(name)\` raises \`NameError: name 'name' is not defined\`. A real \`for\` loop *does* leave its variable behind, so after it \`name\` is \`'Dee'\`. In Python 2 list comprehensions leaked too; Python 3 fixed that.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Anatomy of a comprehension',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'src', label: 'prices', note: 'source iterable', x: 110, y: 160, tone: 'kraft' },
        { id: 'var', label: 'for p in …', note: 'loop variable', x: 290, y: 70, tone: 'yellow' },
        { id: 'filter', label: 'if p < 5', note: 'filter (optional)', x: 290, y: 250, tone: 'red' },
        { id: 'expr', label: 'p * 2', note: 'expression', x: 480, y: 160, tone: 'blue' },
        { id: 'out', label: '[6, 8]', note: 'brand-new list', x: 660, y: 160, tone: 'paper' },
      ],
      edges: [
        { from: 'src', to: 'var', label: 'next item' },
        { from: 'var', to: 'filter', label: 'test it' },
        { from: 'filter', to: 'expr', label: 'kept' },
        { from: 'expr', to: 'out', label: 'append' },
      ],
      steps: [
        { focus: ['src'], text: py`\`[p * 2 for p in prices if p < 5]\` with \`prices = [3, 8, 4]\`. First, Python evaluates the **source** — the iterable after the first \`in\` — exactly once, in the surrounding scope.` },
        { focus: ['src', 'var'], edges: ['src->var'], text: py`It asks the source for one item at a time and binds it to the **loop variable** \`p\`. This variable lives only inside the comprehension.` },
        { focus: ['var', 'filter'], edges: ['var->filter'], text: py`The **filter** runs for each item. \`3 < 5\` is true, so 3 continues. Later, \`8 < 5\` is false, so 8 is skipped and never reaches the expression.` },
        { focus: ['filter', 'expr'], edges: ['filter->expr'], text: py`Survivors go through the **expression** at the front: \`3 * 2\` → \`6\`, and later \`4 * 2\` → \`8\`.` },
        { focus: ['expr', 'out'], edges: ['expr->out'], text: py`Each result is appended to a **new** list. When the source runs out, the finished list \`[6, 8]\` is the value of the whole expression. \`prices\` is unchanged.` },
      ],
    },
    alt: 'A flow diagram: the source iterable prices feeds items into the loop variable p, each p goes through the filter "if p < 5", kept items go through the expression p * 2, and the results are appended to a brand-new list [6, 8].',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A list, dict or set comprehension is **eager**: it runs the whole loop immediately and hands you the finished container. \`[x * 2 for x in range(1_000_000)]\` really builds a million-item list in memory before the next line runs. When you only need to walk through the results once, a *generator expression* (round brackets) produces them one at a time instead — see [generator expressions & lazy pipelines](lesson:lazy-evaluation).`,
      py`Every comprehension has its **own scope** (its own private set of names — see [scope](lesson:scope)). The loop variables live there, which is why they vanish afterwards. It can still *read* the variables around it:`,
      { code: py`tax_rate = 0.2
prices = [10, 20]
with_tax = [p * (1 + tax_rate) for p in prices]   # reads tax_rate from outside
print(with_tax)            # [12.0, 24.0]
# print(p)                 # NameError: p only existed inside the comprehension`, lang: 'python', title: 'reading outer names is fine' },
    ],
    technical: [
      py`**Evaluation order.** The *outermost* iterable (after the first \`in\`) is evaluated **immediately, in the enclosing scope**. Everything else — later \`for\` clauses, filters and the expression — runs inside the comprehension's scope, once per item. Clauses execute left to right, like nested loops.`,
      py`**The class-body gotcha.** Names defined directly in a class body are not visible inside a comprehension in that body — except in the outermost iterable, which is evaluated in the class scope:`,
      { code: py`class Shop:
    tax = 0.2
    prices = [10, 20]
    sizes = [n for n in range(len(prices))]       # fine: prices is in the OUTERMOST iterable
    # with_tax = [p * tax for p in prices]        # NameError: name 'tax' is not defined`, lang: 'python', title: 'class scope is skipped' },
      py`**The walrus exception.** An assignment expression (\`:=\`, Python 3.8+) inside a comprehension deliberately binds its target in the *enclosing* scope (PEP 572), so you can keep a computed value:`,
      { code: py`readings = [3, 9, 4, 12]
big = [y for r in readings if (y := r * 2) > 10]
print(big, y)   # [18, 24] 24  — y leaked on purpose, r did not`, lang: 'python', title: ':= escapes the comprehension' },
      { callout: 'note', title: 'CPython detail: inlined comprehensions (3.12+)', text: py`Up to CPython 3.11, every list/dict/set comprehension was compiled into a hidden function (named \`<listcomp>\`, \`<dictcomp>\`, …) that was created and called each time the line ran. **PEP 709 (CPython 3.12)** inlines them into the surrounding code instead: the loop variables are saved and restored around the loop so they still don't leak, but no function object or extra frame is created. Results: comprehensions got faster, \`<listcomp>\` frames disappeared from tracebacks and profiler output, and \`dis.dis()\` now shows the loop (\`LIST_APPEND\`, \`LOAD_FAST_AND_CLEAR\`) directly in the enclosing function. **The language semantics did not change**, and *generator expressions are still separate code objects* (they have to pause). Other implementations such as PyPy do this their own way.` },
      { code: py`>>> import dis
>>> def doubled(prices):
...     return [p * 2 for p in prices]
...
>>> dis.dis(doubled)      # CPython 3.14, abridged
  3           LOAD_FAST_BORROW         0 (prices)
              GET_ITER
              LOAD_FAST_AND_CLEAR      1 (p)     <- save any outer p
              ...
              BUILD_LIST               0
      L2:     FOR_ITER                11 (to L3)
              ...
              LIST_APPEND              2
              JUMP_BACKWARD           13 (to L2)
              ...
              STORE_FAST               1 (p)     <- restore it`, lang: 'pycon', title: 'the inlined loop in bytecode' },
      py`Bytecode is an implementation detail and changes between versions — see [bytecode](lesson:bytecode) for how to read it.`,
    ],
    production: [
      py`**Readability budget.** A common rule of thumb: one \`for\` plus one \`if\` is ideal; two \`for\` clauses are fine when they are short; beyond that, write a loop or pull logic into a named helper function. A comprehension that needs a comment to explain it has stopped being a shortcut.`,
      py`**Never use a comprehension just for its side effects.** \`[send_email(u) for u in users]\` builds and throws away a list of \`None\`s, and tells the reader "I'm building a list" when you aren't. Write a plain \`for\` loop.`,
      py`**Memory.** A list comprehension materialises everything. Over a 2 GB log file, \`[line for line in f if "ERROR" in line]\` holds every error line at once; \`sum(1 for line in f if "ERROR" in line)\` counts them while keeping only one line in memory. Pick the bracket for the job — see [lazy evaluation](lesson:lazy-evaluation).`,
      py`**Speed.** In CPython, a comprehension is generally quicker than an \`append\` loop because the append is a single bytecode instruction rather than a method lookup and call. The difference matters only in hot loops; measure with \`timeit\` before choosing on speed grounds ([profiling](lesson:profiling)). Built-ins like \`sum()\`, \`max()\` and \`"".join()\` fed by a generator expression are often clearer still.`,
      py`**Dict comprehensions silently overwrite duplicate keys.** If keys can repeat (grouping people by team, words by first letter), a comprehension loses data without any error. Use a loop with \`collections.defaultdict(list)\` instead — see [collections](lesson:collections-module).`,
    ],
  },
  mistakes: [
    {
      title: 'Putting the if in the wrong place',
      wrong: { code: py`readings = [3, -1, 7]
positives = [r if r > 0 for r in readings]       # SyntaxError
labelled = [r for r in readings if r > 0 else 0] # SyntaxError`, lang: 'python', static: true },
      right: { code: py`readings = [3, -1, 7]
positives = [r for r in readings if r > 0]        # filter: [3, 7]
clamped = [r if r > 0 else 0 for r in readings]   # transform: [3, 0, 7]`, lang: 'python' },
      explanation: py`A trailing \`if\` filters and has no \`else\`. A leading \`if … else\` is a conditional expression that transforms every item, and it must have an \`else\`. Decide first: do you want *fewer* items, or *changed* items?`,
    },
    {
      title: 'Using a comprehension for side effects',
      wrong: { code: py`names = ["Ada", "Ben"]
[print("Hello,", n) for n in names]   # builds [None, None] and throws it away`, lang: 'python' },
      right: { code: py`names = ["Ada", "Ben"]
for n in names:
    print("Hello,", n)`, lang: 'python' },
      explanation: py`Comprehensions are for *building* collections. When you only want the actions (printing, saving, sending), a \`for\` loop says so honestly and doesn't allocate a useless list.`,
    },
    {
      title: 'Building a grid with * instead of a comprehension',
      wrong: { code: py`grid = [[0] * 3] * 3      # three references to ONE row
grid[0][0] = 1
print(grid)   # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]`, lang: 'python' },
      right: { code: py`grid = [[0] * 3 for _ in range(3)]   # a new row each time
grid[0][0] = 1
print(grid)   # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]`, lang: 'python' },
      explanation: py`\`[row] * 3\` copies the *reference* three times, so all rows are the same list (see [mutability & copying](lesson:mutability-and-copying)). The comprehension evaluates \`[0] * 3\` afresh on every pass, giving three independent rows. \`_\` is the conventional name for a loop variable you don't use.`,
    },
    {
      title: 'Nesting until nobody can read it',
      wrong: { code: py`orders = {"ada": [{"sku": "A1", "qty": 2}], "ben": [{"sku": "B7", "qty": 0}]}
report = {c: [i["sku"] for i in o if i["qty"] > 0] for c, o in orders.items() if any(i["qty"] > 0 for i in o)}`, lang: 'python' },
      right: { code: py`orders = {"ada": [{"sku": "A1", "qty": 2}], "ben": [{"sku": "B7", "qty": 0}]}


def shipped_skus(items):
    return [item["sku"] for item in items if item["qty"] > 0]


report = {}
for customer, items in orders.items():
    skus = shipped_skus(items)
    if skus:
        report[customer] = skus
print(report)   # {'ada': ['A1']}`, lang: 'python' },
      explanation: py`One-letter names, three loops and a duplicated condition in one line is a puzzle, not a shortcut. A named helper plus a short loop is longer but obviously correct — and the helper can be tested on its own.`,
    },
    {
      title: 'Expecting a tuple from round brackets',
      wrong: { code: py`sizes = (len(w) for w in ["hi", "hello"])
print(sizes)        # <generator object <genexpr> at 0x...>`, lang: 'python' },
      right: { code: py`sizes = tuple(len(w) for w in ["hi", "hello"])
print(sizes)        # (2, 5)`, lang: 'python' },
      explanation: py`There is no tuple comprehension. Round brackets create a lazy **generator** (see [generators](lesson:generators)). Pass it to \`tuple()\` (or \`list()\`, \`set()\`, \`sum()\`, …) to get actual values.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: expected 'else' after 'if' expression`,
      cause: py`An \`if\` without \`else\` was written in front of the \`for\`, where Python expects a conditional expression: \`[x if x > 0 for x in xs]\`.`,
      fix: py`To *filter*, move the \`if\` after the \`for\`: \`[x for x in xs if x > 0]\`. To *transform*, add an \`else\`: \`[x if x > 0 else 0 for x in xs]\`.`,
    },
    {
      symptom: py`ValueError: too many values to unpack (expected 2)`,
      cause: py`A dict comprehension looped over a dict directly — \`{k: v for k, v in prices}\` — which yields only keys; Python tries to unpack each key string into two names.`,
      fix: py`Loop over \`prices.items()\` to get \`(key, value)\` pairs.`,
    },
    {
      symptom: py`TypeError: cannot use 'list' as a dict key (unhashable type: 'list')`,
      cause: py`A dict or set comprehension produced a list as a key or set element. Keys and set members must be hashable (immutable): see [sets](lesson:sets). (Older Pythons word it \`TypeError: unhashable type: 'list'\`.)`,
      fix: py`Convert to a tuple first: \`{tuple(row) for row in rows}\`.`,
    },
    {
      symptom: py`NameError: name 'tax' is not defined (inside a class body)`,
      cause: py`A comprehension in a class body tried to use another class-level name. Class scope is not visible to the comprehension's inner parts.`,
      fix: py`Compute it in a method, at module level, or move the name into the outermost iterable. Often a \`@classmethod\` or a module-level constant is cleaner.`,
    },
    {
      symptom: py`A dict comprehension "loses" entries — fewer keys than input rows.`,
      cause: py`Several items produced the same key; each later one silently overwrote the earlier value.`,
      fix: py`Check \`len(result)\` against the input. If keys can repeat, group with a loop and \`collections.defaultdict(list)\`.`,
    },
  ],
  bestPractices: [
    'Use a comprehension when the goal is to build a new list, dict or set; use a for loop when the goal is an action (print, save, send).',
    'Keep it to one for and one if where possible; move complex conditions or transformations into a well-named helper function.',
    'Filter with a trailing if; transform with a leading "a if cond else b" — never confuse the two.',
    'Use descriptive loop variable names (score, not s) once a comprehension has more than one clause.',
    'Break long comprehensions across lines at the for and if clauses.',
    'Switch to a generator expression when the result is consumed once by sum(), max(), any(), "".join() or a for loop.',
    'Use dict.items() for dict comprehensions, and watch out for duplicate keys silently overwriting each other.',
  ],
  useCases: [
    'Transforming data: prices with tax, names in upper case, Celsius to Fahrenheit.',
    'Filtering records: in-stock products, failing students, log lines that contain ERROR.',
    'Building lookup tables: {user.id: user for user in users}.',
    'Deduplicating with a set comprehension: {email.lower() for email in signups}.',
    'Flattening one level of nesting or building grids and matrices.',
  ],
  whenToUse: {
    use: [
      'You are building a new collection from an existing iterable.',
      'The logic is a simple transform and/or filter that fits comfortably on one or two lines.',
      'You need the whole result (to index it, reuse it, or take its len()).',
    ],
    avoid: [
      'You only want side effects — use a for loop.',
      'The logic needs several branches, try/except, or more than two levels of loops.',
      'The data is huge or endless and you only need to pass over it once — use a generator expression.',
      'Keys may repeat and you need to group values — use a loop with defaultdict.',
    ],
  },
  comparison: {
    title: 'Which brackets build what',
    headers: ['', 'syntax', 'result', 'duplicates', 'evaluated'],
    rows: [
      ['list comprehension', '[x * 2 for x in data]', 'list (ordered)', 'kept', 'eagerly, all at once'],
      ['set comprehension', '{x * 2 for x in data}', 'set (unordered)', 'removed', 'eagerly, all at once'],
      ['dict comprehension', '{x: x * 2 for x in data}', 'dict (insertion order)', 'repeated key: last value wins', 'eagerly, all at once'],
      ['generator expression', '(x * 2 for x in data)', 'generator (lazy iterator)', 'kept', 'lazily, one item per request'],
    ],
    note: py`Generator expressions get their own lesson: [generator expressions & lazy pipelines](lesson:lazy-evaluation). \`map()\` and \`filter()\` do the same jobs in a functional style — compare them in [map, filter & reduce](lesson:map-filter-reduce).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'comprehensions-q1',
      type: 'mcq',
      prompt: py`\`words = ["kiwi", "fig", "banana"]\`. Which expression builds \`{'kiwi': 4, 'fig': 3, 'banana': 6}\`?`,
      options: [
        { text: '[w: len(w) for w in words]', why: 'Square brackets build a list, and key: value pairs are not allowed inside them — this is a SyntaxError.' },
        '{w: len(w) for w in words}',
        { text: '{len(w) for w in words}', why: 'With a single expression, curly brackets build a set: {3, 4, 6}.' },
        { text: 'dict(w, len(w) for w in words)', why: 'dict() does not take a name and a generator like this — it is a SyntaxError (a generator argument must be the only argument or be bracketed).' },
      ],
      answer: 1,
      explanation: py`Curly brackets with \`key: value\` make a dict comprehension. \`dict((w, len(w)) for w in words)\` would also work, but the comprehension is clearer.`,
    },
    {
      id: 'comprehensions-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`nums = [1, 2, 3, 4, 5, 6]
print([n * 10 for n in nums if n % 3 == 0])`,
      answer: '[30, 60]',
      accept: ['[30,60]'],
      explanation: py`The filter keeps only the multiples of 3 (\`3\` and \`6\`); the expression multiplies each survivor by 10.`,
    },
    {
      id: 'comprehensions-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`scores = [45, 82, 67]
print(["pass" if s >= 50 else "fail" for s in scores])`,
      options: [
        { text: "['pass', 'pass']", why: 'That is what a trailing filter would give. Here the if/else is at the front, so every score produces a label — nothing is dropped.' },
        "['fail', 'pass', 'pass']",
        { text: 'SyntaxError', why: 'A conditional expression with else is perfectly valid at the front of a comprehension.' },
        { text: "['fail', 'pass', 'fail']", why: '67 >= 50 is True, so the third label is "pass".' },
      ],
      answer: 1,
      explanation: py`\`"pass" if s >= 50 else "fail"\` is evaluated for **every** score, giving one label per item.`,
    },
    {
      id: 'comprehensions-q4',
      type: 'output',
      prompt: 'What is printed? Think about what happens to the comprehension\'s `x`.',
      code: py`x = "outer"
squares = [x * x for x in range(3)]
print(x, squares)`,
      options: [
        { text: '2 [0, 1, 4]', why: 'That would be Python 2 behaviour, where list comprehension variables leaked. In Python 3 the comprehension has its own scope.' },
        'outer [0, 1, 4]',
        { text: 'TypeError', why: 'Inside the comprehension x is an int from range(3), so x * x is just integer multiplication.' },
        { text: 'outer [\'outerouter\', ...]', why: 'The comprehension\'s x shadows the outer one — it never sees the string.' },
      ],
      answer: 1,
      explanation: py`The comprehension's \`x\` is a separate, private variable. The outer \`x\` is untouched, so it still prints \`outer\`. (In CPython 3.12+ the comprehension is inlined, but the outer \`x\` is saved and restored, so the result is the same.)`,
    },
    {
      id: 'comprehensions-q5',
      type: 'bug',
      prompt: 'This should keep only the positive readings, but it won\'t even run. Click the line with the bug.',
      code: py`readings = [3, -1, 7, -4]
positives = [r if r > 0 for r in readings]
print(positives)`,
      answerLine: 2,
      explanation: py`An \`if\` in front of \`for\` must be a full conditional expression with \`else\`. To *filter*, put the \`if\` at the end: \`[r for r in readings if r > 0]\`. Python reports \`SyntaxError: expected 'else' after 'if' expression\`.`,
    },
    {
      id: 'comprehensions-q6',
      type: 'fill',
      prompt: 'Complete the comprehension so `stock` maps every product with quantity > 0 to its quantity.',
      code: py`inventory = {"pens": 12, "rulers": 0, "glue": 3}
stock = {item: qty for item, qty in inventory.___() ___ qty > 0}
print(stock)   # {'pens': 12, 'glue': 3}`,
      answer: [['items'], ['if']],
      explanation: py`\`inventory.items()\` yields \`(key, value)\` pairs to unpack into \`item, qty\`, and the trailing \`if qty > 0\` filters out the rulers.`,
    },
    {
      id: 'comprehensions-q7',
      type: 'short',
      prompt: 'Your colleague wrote a three-level nested dict/list comprehension with two conditions. When would you ask them to rewrite it as a loop, and what would you suggest?',
      answer: py`When it can't be read in one pass — several \`for\` clauses, repeated conditions, or logic that needs a comment. I'd suggest a plain loop, or pulling the inner part into a well-named helper function (e.g. \`shipped_skus(items)\`) so the remaining comprehension is a single \`for\` and \`if\`. Comprehensions are for simple transform-and-filter; readability beats brevity.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'gradebook-comprehensions',
      title: 'Pass list and curve',
      difficulty: 'intermediate',
      prompt: py`A grade book is a dict mapping names to a single score, e.g. \`{"Ada": 91, "Ben": 47, "Cy": 68}\`. Write two functions, each using **one comprehension**:

1. \`passing(grades)\` returns a **list** of the names whose score is **50 or more**, in the dict's order. \`passing({"Ada": 91, "Ben": 47, "Cy": 68})\` → \`["Ada", "Cy"]\`.
2. \`curved(grades, bonus)\` returns a **new dict** with every score increased by \`bonus\` but **never above 100**. \`curved({"Ada": 91, "Ben": 47}, 10)\` → \`{"Ada": 100, "Ben": 57}\`. The input dict must not change.`,
      files: {
        'main.py': py`def passing(grades):
    # TODO: list comprehension with a filter
    return []


def curved(grades, bonus):
    # TODO: dict comprehension; cap scores at 100
    return {}


book = {"Ada": 91, "Ben": 47, "Cy": 68}
print(passing(book))
print(curved(book, 10))
`,
      },
      hints: [
        'passing needs a trailing if; curved keeps every entry but changes each value.',
        'Loop over grades.items() so you get both the name and the score in each comprehension.',
        '[name for name, score in grades.items() if score >= 50] and {name: min(score + bonus, 100) for name, score in grades.items()}',
      ],
      solution: {
        explanation: py`\`passing\` is a filter: the trailing \`if score >= 50\` decides which names make it into the list, and dicts iterate in insertion order, so the order is preserved. \`curved\` keeps every key and transforms each value; \`min(score + bonus, 100)\` caps it without needing an \`if\`. Both comprehensions build brand-new containers, so the original \`grades\` dict is never modified.`,
        files: {
          'main.py': py`def passing(grades):
    return [name for name, score in grades.items() if score >= 50]


def curved(grades, bonus):
    return {name: min(score + bonus, 100) for name, score in grades.items()}


book = {"Ada": 91, "Ben": 47, "Cy": 68}
print(passing(book))
print(curved(book, 10))
`,
        },
      },
      tests: [
        { name: 'passing keeps names with 50 or more, in order', code: py`assert passing({"Ada": 91, "Ben": 47, "Cy": 68}) == ["Ada", "Cy"]` },
        { name: 'exactly 50 counts as passing', code: py`assert passing({"Dee": 50, "Eve": 49}) == ["Dee"]` },
        { name: 'curved adds the bonus and caps at 100', code: py`assert curved({"Ada": 91, "Ben": 47}, 10) == {"Ada": 100, "Ben": 57}` },
        { name: 'curved does not modify its input', code: py`book = {"Ada": 91}
curved(book, 5)
assert book == {"Ada": 91}` },
        { name: 'empty grade book gives empty results', code: py`assert passing({}) == [] and curved({}, 3) == {}` },
      ],
    },
    {
      id: 'seat-map',
      title: 'Seat map and grid flip',
      difficulty: 'intermediate',
      prompt: py`A small theatre labels seats by row number and seat letter. Write two functions using comprehensions with **more than one loop**:

1. \`seat_labels(rows, letters)\` returns a flat list of labels, row by row. \`seat_labels(2, "AB")\` → \`["1A", "1B", "2A", "2B"]\`. Rows are numbered from 1.
2. \`transpose(grid)\` flips a rectangular list of lists so rows become columns: \`transpose([[1, 2, 3], [4, 5, 6]])\` → \`[[1, 4], [2, 5], [3, 6]]\`. Return **new** lists; the input must not change.`,
      files: {
        'main.py': py`def seat_labels(rows, letters):
    # TODO: one comprehension with two for clauses
    return []


def transpose(grid):
    # TODO: a comprehension inside a comprehension
    return grid


print(seat_labels(2, "AB"))
print(transpose([[1, 2, 3], [4, 5, 6]]))
`,
      },
      hints: [
        'seat_labels gives a FLAT list, so it needs two for clauses in one comprehension. transpose gives a list OF lists, so it needs a comprehension nested inside another.',
        'Write the nested loops first: for row in range(1, rows + 1): for letter in letters: ... Then copy the for clauses into the comprehension in the same order.',
        '[f"{row}{letter}" for row in range(1, rows + 1) for letter in letters] and [[row[i] for row in grid] for i in range(len(grid[0]))]',
      ],
      solution: {
        explanation: py`For \`seat_labels\`, two \`for\` clauses in one comprehension behave like nested loops — the first is the outer loop — so the result is flat and row-ordered. For \`transpose\`, the *outer* comprehension walks over column indexes and the *inner* one collects the item at that index from every row, building one new list per column. (\`[list(col) for col in zip(*grid)]\` is a neat alternative: \`zip(*grid)\` groups the i-th items of every row together.) The empty-grid guard avoids \`grid[0]\` raising \`IndexError\`.`,
        files: {
          'main.py': py`def seat_labels(rows, letters):
    return [f"{row}{letter}" for row in range(1, rows + 1) for letter in letters]


def transpose(grid):
    if not grid:
        return []
    return [[row[i] for row in grid] for i in range(len(grid[0]))]


print(seat_labels(2, "AB"))
print(transpose([[1, 2, 3], [4, 5, 6]]))
`,
        },
      },
      tests: [
        { name: 'seat_labels(2, "AB")', code: py`assert seat_labels(2, "AB") == ["1A", "1B", "2A", "2B"]` },
        { name: 'seat_labels(3, "XYZ") has 9 seats in row order', code: py`labels = seat_labels(3, "XYZ")
assert len(labels) == 9 and labels[:4] == ["1X", "1Y", "1Z", "2X"] and labels[-1] == "3Z"` },
        { name: 'transpose a 2x3 grid', code: py`assert transpose([[1, 2, 3], [4, 5, 6]]) == [[1, 4], [2, 5], [3, 6]]` },
        { name: 'transpose returns new lists', code: py`g = [[1, 2], [3, 4]]
t = transpose(g)
t[0][0] = 99
assert g == [[1, 2], [3, 4]]` },
        { name: 'transpose of a single row', code: py`assert transpose([["a", "b"]]) == [["a"], ["b"]]` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'comprehensions-vs-loop',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a list comprehension, and when would you choose it over a for loop?',
      answer: 'An expression that builds a new list by looping over an iterable, applying an expression to each item and optionally filtering. Choose it when the goal is to build a collection with a simple transform/filter; use a loop for side effects or complex logic.',
      explanation: py`\`[f(x) for x in items if cond(x)]\` is equivalent to creating an empty list and appending \`f(x)\` in a loop for each item where \`cond(x)\` is true. It signals intent (build a list), keeps the loop variable private and is usually a bit faster in CPython. It becomes a liability when it nests deeply or is used for side effects.`,
      code: { lang: 'python', code: py`orders = [12.5, 80.0, 3.0, 45.0]
big = [round(o * 0.9, 2) for o in orders if o >= 40]   # 10% off big orders
print(big)   # [72.0, 40.5]` },
      whyAsked: 'Comprehensions are everywhere in Python code; interviewers check you can use them and, more importantly, know their limits.',
      mistakes: ['Saying comprehensions are always better than loops', 'Not knowing the filter/transform distinction', 'Using them for printing or saving data'],
      followUps: ['What brackets would you use for a dict, a set, or a lazy version?', 'Does the loop variable leak?', 'How do comprehensions compare with map() and filter()?'],
      modelAnswer: 'A list comprehension is an expression that builds a new list from an iterable: an expression for each item, a for clause, and an optional if clause that filters. It replaces the empty-list-plus-append pattern, so the reader knows immediately that a list is being built, the loop variable stays private, and in CPython it is usually a little faster. I use one when the job is a simple transform and/or filter. If I only want side effects, or the logic needs several branches or more than two loops, I write a normal for loop or move the logic into a named helper function.',
    },
    {
      id: 'comprehensions-grid-aliasing',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What do the two print calls show, and why?',
      code: { lang: 'python', code: py`a = [[0] * 2] * 2
b = [[0] * 2 for _ in range(2)]
a[0][0] = 1
b[0][0] = 1
print(a)
print(b)` },
      options: [
        '[[1, 0], [0, 0]] and [[1, 0], [0, 0]]',
        '[[1, 0], [1, 0]] and [[1, 0], [0, 0]]',
        '[[1, 0], [1, 0]] and [[1, 0], [1, 0]]',
        '[[1, 0], [0, 0]] and [[1, 0], [1, 0]]',
      ],
      correctOption: 1,
      answer: '`a` prints `[[1, 0], [1, 0]]` because `* 2` repeats a reference to the same inner list; `b` prints `[[1, 0], [0, 0]]` because the comprehension builds a new inner list on every iteration.',
      explanation: py`\`[x] * n\` creates a list containing the *same object* n times. The comprehension's expression \`[0] * 2\` is re-evaluated for every iteration, so each row is a distinct list. \`[0] * 2\` itself is fine because ints are immutable.`,
      whyAsked: 'A classic aliasing trap that shows whether you understand references and that a comprehension re-evaluates its expression per item.',
      mistakes: ['Thinking * copies the inner lists', 'Avoiding [0] * n altogether out of fear — it is fine for immutable items'],
      followUps: ['Is [None] * 5 safe? Why?', 'How would you make a deep copy of a nested list?'],
      modelAnswer: 'The first prints [[1, 0], [1, 0]] and the second [[1, 0], [0, 0]]. Multiplying a list repeats references, so a contains the same inner list twice and a change through one row shows in both. The comprehension evaluates [0] * 2 again on every iteration, so b has two independent rows. Repeating immutable things like zeros or None is fine; repeating mutable things like lists is the bug. So for grids I always use a comprehension for the outer level.',
    },
    {
      id: 'comprehensions-scope-and-pep709',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Do comprehension variables leak into the enclosing scope? What did PEP 709 change in CPython 3.12, and what did it deliberately not change?',
      answer: 'In Python 3 they do not leak (in Python 2 list comprehensions did). PEP 709 made CPython inline list/dict/set comprehensions into the enclosing function instead of creating and calling a hidden function each time — faster, and no <listcomp> frame in tracebacks — while keeping the same isolation semantics. Generator expressions are not inlined.',
      explanation: py`Python 3 gives each comprehension its own scope. Before 3.12, CPython implemented that by compiling the comprehension to a nested function object called immediately. PEP 709 inlines the bytecode and uses \`LOAD_FAST_AND_CLEAR\` / \`STORE_FAST\` to save and restore any outer variable with the same name, so the loop variable still can't escape. Visible differences are performance, tracebacks/profiles without \`<listcomp>\` frames, and some \`locals()\` behaviour inside the comprehension. Walrus targets (\`:=\`) still bind in the enclosing scope, by design (PEP 572). Class bodies keep their special rule: class-level names are not visible inside the comprehension except in the outermost iterable.`,
      whyAsked: 'Separates people who know the language rules from people who also know which parts are CPython implementation details.',
      mistakes: ['Saying the variable leaks in Python 3', 'Claiming PEP 709 changed the language semantics', 'Thinking generator expressions were inlined too'],
      followUps: ['What happens with x := ... inside a comprehension?', 'Why does a comprehension in a class body fail to see class attributes?', 'How would you see the difference with dis?'],
      modelAnswer: 'In Python 3 comprehension variables do not leak: each comprehension behaves as if it had its own scope, which is a language rule. Historically CPython implemented that by compiling every comprehension into a hidden function that was created and called each time. PEP 709, in CPython 3.12, inlines list, dict and set comprehensions into the surrounding code and simply saves and restores any outer variable with the same name, so the semantics are unchanged but there is no function creation or extra frame — comprehensions got faster and <listcomp> frames vanished from tracebacks. Generator expressions are still separate code objects because they must be able to pause. Two edge cases remain: walrus targets intentionally bind in the enclosing scope, and in a class body only the outermost iterable can see class attributes.',
    },
    {
      id: 'comprehensions-team-lookup',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This report should list every engineer per team, but each team shows only one person and nobody gets an error. Find the bug and fix it.',
      code: { lang: 'python', code: py`staff = [
    {"name": "Ada", "team": "core"},
    {"name": "Ben", "team": "web"},
    {"name": "Cy", "team": "core"},
]
by_team = {person["team"]: person["name"] for person in staff}
print(by_team)   # {'core': 'Cy', 'web': 'Ben'} — Ada vanished` },
      answer: 'A dict comprehension produces one entry per key; when a key repeats, the later value silently overwrites the earlier one. Grouping needs a loop that appends to a list per key, e.g. with collections.defaultdict(list).',
      explanation: py`Dict comprehensions are a perfect fit for one-to-one mappings (id → record) and a silent data-loss bug for one-to-many groupings. The fix:

\`\`\`python
from collections import defaultdict

staff = [{"name": "Ada", "team": "core"}, {"name": "Cy", "team": "core"}]
by_team = defaultdict(list)
for person in staff:
    by_team[person["team"]].append(person["name"])
print(dict(by_team))   # {'core': ['Ada', 'Cy']}
\`\`\`

A comprehension-only version, \`{t: [p["name"] for p in staff if p["team"] == t] for t in {p["team"] for p in staff}}\`, works but rescans the list once per team and is harder to read.`,
      whyAsked: 'Silent overwrites are a realistic production bug; the question checks you know a comprehension can lose data without any exception.',
      mistakes: ['Blaming the order of the staff list', 'Fixing it with a nested comprehension that is O(teams × people) without mentioning the cost'],
      followUps: ['How could you detect duplicate keys in a test?', 'When would itertools.groupby be appropriate here?'],
      modelAnswer: 'The dict comprehension builds one entry per key, and when a key appears again the new value replaces the old one without any error — so each team keeps only its last person. A comprehension is the wrong tool for grouping. I would loop over the staff and append each name to a list per team, using collections.defaultdict(list) so missing teams start as empty lists. To catch this kind of bug, I would also assert that the number of keys matches what I expect, or that the total number of grouped names equals the input length.',
    },
    {
      id: 'comprehensions-invert',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `invert(mapping)` that swaps keys and values using a dict comprehension: `invert({"GB": "London", "FR": "Paris"})` → `{"London": "GB", "Paris": "FR"}`. If two keys share a value, the key that comes **later** in the dict wins.',
      answer: '{value: key for key, value in mapping.items()}',
      explanation: py`Iterating \`.items()\` yields \`(key, value)\` pairs; the comprehension writes them the other way round. Because dicts keep insertion order and a repeated key overwrites, the later key wins automatically. Values must be hashable to become keys.`,
      starter: { files: { 'main.py': py`def invert(mapping):
    # TODO: one dict comprehension
    return dict(mapping)


print(invert({"GB": "London", "FR": "Paris"}))
` } },
      tests: [
        { name: 'swaps keys and values', code: py`assert invert({"GB": "London", "FR": "Paris"}) == {"London": "GB", "Paris": "FR"}` },
        { name: 'later key wins on duplicate values', code: py`assert invert({"a": 1, "b": 1, "c": 2}) == {1: "b", 2: "c"}` },
        { name: 'returns a new dict', code: py`m = {"x": 1}
assert invert(m) is not m and m == {"x": 1}` },
      ],
      solution: { files: { 'main.py': py`def invert(mapping):
    return {value: key for key, value in mapping.items()}


print(invert({"GB": "London", "FR": "Paris"}))
` } },
      hints: ['Loop over mapping.items() and unpack each pair.', 'Put value on the left of the colon and key on the right.'],
      whyAsked: 'A quick fluency check with dict comprehensions plus an edge case (duplicate values) that reveals whether you think about data loss.',
      mistakes: ['Iterating the dict directly and getting only keys', 'Not mentioning what happens with duplicate or unhashable values'],
      followUps: ['How would you keep all keys for a duplicated value?', 'What happens if a value is a list?'],
      modelAnswer: 'I would return {value: key for key, value in mapping.items()}. items() gives me each pair, and the comprehension writes them the other way round into a new dict. Because a dict comprehension overwrites repeated keys, if two keys share a value the later one wins, which matches the requirement. Two caveats: values must be hashable to become keys, so a list value would raise TypeError, and if I needed to keep every key per value I would group into lists with defaultdict instead.',
    },
    {
      id: 'comprehensions-side-effects',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 3,
      question: 'In a code review you see `[notify(user) for user in inactive_users]` on its own line. What feedback do you give?',
      answer: 'Replace it with a for loop. The comprehension builds a list of notify() return values (probably None) that is immediately thrown away, wastes memory, and misleads readers into thinking a list is needed.',
      explanation: py`A comprehension is an *expression whose value is a new list*. Using it as a statement for side effects is a well-known anti-pattern: it costs an allocation proportional to the input, and it hides intent. A \`for\` loop is the honest tool for actions. If the results are actually needed (e.g. to check which notifications failed), keep the comprehension **and** use the list.`,
      whyAsked: 'Tests taste and code-review judgement rather than syntax.',
      mistakes: ['Saying it is fine because it is shorter', 'Suggesting map(notify, users) — map is lazy in Python 3 and would not even run the calls unless consumed'],
      followUps: ['What would list(map(notify, users)) do differently from map(notify, users)?', 'When is a comprehension with function calls appropriate?'],
      modelAnswer: 'I would ask for a plain for loop. That line builds a list of whatever notify returns, probably a list of None values, and throws it away, so it allocates memory for nothing and tells the reader a list is being built when it is not. Comprehensions are for building collections; loops are for actions. If we actually need the results, say the success flags, then a comprehension is right, but we should assign and use the list. I would also warn against map(notify, users) as an alternative, because in Python 3 map is lazy and the calls would never happen.',
    },
  ],

  takeaways: [
    'A comprehension builds a new list [ ], dict {k: v} or set { } from an iterable in one expression; the source is never modified.',
    'A trailing if filters (fewer items); a leading "a if cond else b" transforms (every item, changed).',
    'Multiple for clauses read in the same order as nested loops; a comprehension inside a comprehension builds nested containers.',
    'Comprehension variables do not leak in Python 3. CPython 3.12+ inlines comprehensions (PEP 709) for speed without changing that rule.',
    'Comprehensions are eager — use a generator expression for huge or single-pass data.',
    'Use loops for side effects and complex logic; watch for duplicate keys silently overwriting in dict comprehensions.',
  ],
}
