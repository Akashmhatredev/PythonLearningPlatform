// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CLUB = py`from itertools import (accumulate, batched, chain, combinations, count, cycle,
                       groupby, pairwise, permutations, product)
from operator import itemgetter

players = ["Ada", "Ben", "Cy", "Dee"]

# --- combinatoric: who plays whom? -----------------------------------
matches = list(combinations(players, 2))        # pairs, order ignored
podiums = list(permutations(players, 3))        # gold/silver/bronze, order matters
slots = list(product(["Court 1", "Court 2"], ["10:00", "11:00"]))
print(len(matches), "matches, e.g.", matches[:2])
print(len(podiums), "possible podiums, e.g.", podiums[0])
print(len(slots), "slots:", slots[:2], "...")

# --- infinite: endless sources, made finite by zip() ------------------
shirts = dict(zip(players, cycle(["red", "blue"])))
tickets = dict(zip(players, count(100)))
print("shirts:", shirts)
print("tickets:", tickets)

# --- terminating: reshape a finite stream ------------------------------
print("teams:", list(batched(players, 2)))       # Python 3.12+
points = [3, 1, 0, 3, 3]                           # Ada's points per week
print("season total so far:", list(accumulate(points)))
print("week-to-week change:", [b - a for a, b in pairwise(points)])   # 3.10+
print("full day:", list(chain(["warm-up", "drills"], ["match", "cool-down"])))

# --- groupby: consecutive runs, so SORT BY THE SAME KEY FIRST -----------
results = [("Ada", "win"), ("Ben", "loss"), ("Cy", "win"), ("Dee", "draw")]
by_outcome = sorted(results, key=itemgetter(1))
for outcome, group in groupby(by_outcome, key=itemgetter(1)):
    print(f"{outcome:>5}:", [name for name, _ in group])
`

export default {
  id: 'itertools',
  title: 'itertools: building blocks for iteration',
  summary: 'The itertools module is a toolbox of fast, lazy iterator building blocks — infinite counters, chaining, slicing, grouping, running totals and every combination — that replace pages of hand-written loops.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['lazy-evaluation', 'generators'],
  related: ['iterators', 'comprehensions', 'functools', 'map-filter-reduce', 'collections-module', 'lambdas-and-higher-order', 'list-operations', 'coding-patterns'],
  tags: ['itertools', 'count', 'cycle', 'repeat', 'chain', 'chain.from_iterable', 'islice', 'accumulate', 'groupby', 'product', 'permutations', 'combinations', 'pairwise', 'batched', 'tee', 'zip_longest', 'recipes', 'combinatorics'],
  apis: [
    { name: 'itertools.count(start=0, step=1)', summary: 'Infinite: start, start+step, start+2*step, …' },
    { name: 'itertools.cycle(iterable)', summary: 'Infinite: repeats the items of iterable over and over (saving a copy of them).' },
    { name: 'itertools.repeat(obj[, times])', summary: 'The same object again and again — forever, or times times.' },
    { name: 'itertools.chain(*iterables) / chain.from_iterable(it)', summary: 'One iterator that runs through several iterables in turn.' },
    { name: 'itertools.islice(it, stop) / (it, start, stop[, step])', summary: 'Lazy slicing of any iterator.' },
    { name: 'itertools.accumulate(it[, func, *, initial])', summary: 'Running totals (or running results of any two-argument function).' },
    { name: 'itertools.groupby(it, key=None)', summary: 'Groups CONSECUTIVE items with the same key — sort by that key first.' },
    { name: 'itertools.product / permutations / combinations', summary: 'Cartesian products, ordered arrangements, unordered selections.' },
    { name: 'itertools.pairwise(it)', summary: 'Overlapping pairs (a, b), (b, c), … — Python 3.10+.' },
    { name: 'itertools.batched(it, n, *, strict=False)', summary: 'Tuples of n items; the last may be shorter — Python 3.12+ (strict 3.13+).' },
    { name: 'itertools.tee(it, n=2)', summary: 'Splits one iterator into n independent ones, buffering items between them.' },
    { name: 'itertools.zip_longest(*its, fillvalue=None)', summary: 'Like zip, but runs until the LONGEST input ends.' },
  ],
  docs: [
    { label: 'itertools — functions creating iterators for efficient looping', url: 'https://docs.python.org/3/library/itertools.html' },
    { label: 'itertools recipes', url: 'https://docs.python.org/3/library/itertools.html#itertools-recipes' },
    { label: 'What\'s New in Python 3.12 — itertools.batched()', url: 'https://docs.python.org/3/whatsnew/3.12.html' },
    { label: 'operator.itemgetter', url: 'https://docs.python.org/3/library/operator.html#operator.itemgetter' },
    { label: 'math.comb() and math.perm()', url: 'https://docs.python.org/3/library/math.html#math.comb' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You've learned that loops are driven by [iterators](lesson:iterators) and that [generators](lesson:generators) and [lazy pipelines](lesson:lazy-evaluation) process data one item at a time. The standard library's **\`itertools\`** module is a box of ready-made pipeline pieces for the jobs that come up again and again:`,
    py`- **Infinite sources** — \`count\`, \`cycle\`, \`repeat\`
- **Stream shapers** — \`chain\`, \`islice\`, \`accumulate\`, \`groupby\`, \`pairwise\` (3.10+), \`batched\` (3.12+), \`takewhile\`, \`dropwhile\`, \`compress\`, \`zip_longest\`, \`starmap\`, \`filterfalse\`, \`tee\`
- **Combinatorics** — \`product\`, \`permutations\`, \`combinations\`, \`combinations_with_replacement\``,
    { code: py`from itertools import chain, combinations, pairwise

print(list(chain([1, 2], [3])))              # [1, 2, 3]
print(list(combinations("ABC", 2)))          # [('A', 'B'), ('A', 'C'), ('B', 'C')]
print(list(pairwise([10, 12, 15])))          # [(10, 12), (12, 15)]`, lang: 'python', title: 'a taste' },
    py`Every one of them returns a **lazy iterator**: nothing is computed until you loop, and each result can be consumed once. Wrap them in \`list()\` to look, feed them to \`for\`, \`sum()\`, \`dict()\` or each other to work.`,
  ],
  why: [
    py`**Less code, fewer bugs.** "Every pair of players", "running total", "split into chunks of 100", "consecutive differences" — each is a fiddly loop with index arithmetic and off-by-one traps. Each is a single, well-tested itertools call.`,
    py`**Lazy by default.** They compose into pipelines that never hold more than they must, so they work on files, streams and infinite sources.`,
    py`**Fast.** In CPython, itertools is written in C, so the per-item work happens without running Python bytecode for each step. You get readable code *and* speed.`,
    py`**A shared vocabulary.** \`groupby\`, \`chain\` and \`product\` are names experienced Python developers recognise instantly — your intent is clear without comments.`,
  ],
  eli15: [
    py`Think of itertools as a set of special LEGO pieces for conveyor belts. One piece is a **number machine** that never runs out (\`count\`). One **joins two belts** into one (\`chain\`). One **packs items into boxes of 3** (\`batched\`). One **groups neighbours that look alike** (\`groupby\`). One makes **every possible team** from a list of friends (\`combinations\`).`,
    py`You snap the pieces together, and items flow through one at a time. You didn't have to build any of the machines yourself — you just picked them out of the box.`,
  ],
  analogy: {
    title: 'A kitchen gadget drawer',
    body: [
      py`You *could* slice an egg, core an apple and zest a lemon with one knife and a lot of patience. Or you could open the gadget drawer: an egg slicer, an apple corer, a zester. Each does one job perfectly, quickly and safely.`,
      py`itertools is that drawer for loops. You still need to know which gadget fits the job — use the apple corer on an egg and you get a mess (that's \`groupby\` on unsorted data). But once you know them, you stop hand-carving the same loops over and over.`,
    ],
    mapping: [
      ['a gadget that does one job well', 'one itertools function: chain, batched, pairwise…'],
      ['an endless roll of cling film', 'infinite iterators: count(), cycle(), repeat()'],
      ['an egg slicer cutting into equal parts', 'batched(items, n)'],
      ['sorting cutlery into piles of the same kind', 'groupby — but only neighbouring items group together'],
      ['a combination lock with every code', 'product / permutations / combinations'],
      ['using the wrong gadget', 'groupby on unsorted data, list() on count()'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'groupby groups neighbours, not "all items with the same key"',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'raw', label: 'win · loss · win · draw', note: 'unsorted results', x: 160, y: 80, tone: 'kraft' },
        { id: 'bad', label: 'win | loss | win | draw', note: '4 groups — "win" twice!', x: 560, y: 80, tone: 'red' },
        { id: 'sorted', label: 'draw · loss · win · win', note: 'sorted by the SAME key', x: 160, y: 240, tone: 'yellow' },
        { id: 'good', label: 'draw | loss | win win', note: '3 groups — one per key', x: 560, y: 240, tone: 'blue' },
      ],
      edges: [
        { id: 'g1', from: 'raw', to: 'bad', label: 'groupby' },
        { id: 's', from: 'raw', to: 'sorted', label: 'sorted(key=…)' },
        { id: 'g2', from: 'sorted', to: 'good', label: 'groupby' },
      ],
      steps: [
        { focus: ['raw'], text: py`Four match results in the order they happened: \`win, loss, win, draw\`.` },
        { focus: ['raw', 'bad'], edges: ['g1'], text: py`\`groupby\` walks the items **once**, starting a new group whenever the key *changes* from the previous item. The two wins aren't neighbours, so you get **two separate "win" groups**. Put into a dict, the second silently overwrites the first.` },
        { focus: ['raw', 'sorted'], edges: ['s'], text: py`Sort by the **same key** first. Now equal keys sit next to each other.` },
        { focus: ['sorted', 'good'], edges: ['g2'], text: py`One group per key. Rule: \`groupby(sorted(data, key=k), key=k)\` — or skip sorting on purpose when you *want* consecutive runs, such as winning streaks.` },
      ],
    },
    alt: 'Two rows. Top: unsorted results win, loss, win, draw go through groupby and produce four groups, with win appearing twice. Bottom: the same results sorted by outcome — draw, loss, win, win — go through groupby and produce three groups, one per outcome.',
    caption: py`This single rule causes most \`groupby\` bugs. It isn't a flaw: grouping consecutive items is what makes \`groupby\` lazy and able to work on endless streams.`,
  },
  syntax: [
    py`#### Infinite iterators`,
    { code: py`from itertools import count, cycle, islice, repeat

print(list(islice(count(10, 5), 3)))           # [10, 15, 20]
print(list(islice(cycle("RGB"), 7)))           # ['R', 'G', 'B', 'R', 'G', 'B', 'R']
print(list(repeat("hi", 3)))                   # ['hi', 'hi', 'hi'] (finite with times=)
print(list(map(pow, range(5), repeat(2))))     # [0, 1, 4, 9, 16]: repeat feeds a constant

for ticket, name in zip(count(1), ["Ada", "Ben"]):   # zip stops at the shortest
    print(ticket, name)                               # 1 Ada / 2 Ben`, lang: 'python', title: 'count, cycle, repeat' },
    { callout: 'warn', title: 'Infinite means infinite', text: py`\`list(count())\`, \`sum(cycle(...))\` or \`sorted(repeat(x))\` never finish. Always pair infinite iterators with something that stops: \`zip\` with a finite iterable, \`islice\`, \`takewhile\`, \`next()\`, or a loop with \`break\`.` },
    py`#### Joining, slicing and filtering streams`,
    { code: py`from itertools import chain, compress, dropwhile, islice, takewhile, zip_longest

morning, evening = ["warm-up", "drills"], ["match"]
print(list(chain(morning, evening)))                    # ['warm-up', 'drills', 'match']
playlists = [["a", "b"], ["c"], []]
print(list(chain.from_iterable(playlists)))             # ['a', 'b', 'c'] — flatten one level

print(list(islice("abcdefg", 1, 6, 2)))                 # ['b', 'd', 'f'] — like [1:6:2]
temps = [12, 15, 21, 18, 25]
print(list(takewhile(lambda t: t < 20, temps)))         # [12, 15] — until the first failure
print(list(dropwhile(lambda t: t < 20, temps)))         # [21, 18, 25] — from the first failure on
print(list(compress("ABCD", [1, 0, 1, 1])))             # ['A', 'C', 'D'] — keep by a mask
print(list(zip_longest("ab", [1, 2, 3], fillvalue="-")))  # [('a', 1), ('b', 2), ('-', 3)]`, lang: 'python', title: 'chain, islice, takewhile, dropwhile, compress, zip_longest' },
    py`\`chain(a, b)\` takes iterables as separate arguments; \`chain.from_iterable(x)\` takes *one* iterable of iterables, which can even be a lazy generator of lists.`,
    py`#### Running results, pairs and batches`,
    { code: py`from itertools import accumulate, batched, pairwise

deposits = [100, 50, -30, 20]
print(list(accumulate(deposits)))                    # [100, 150, 120, 140] running balance
print(list(accumulate(deposits, initial=1000)))      # [1000, 1100, 1150, 1120, 1140]
print(list(accumulate([3, 1, 4, 1, 5], max)))        # [3, 3, 4, 4, 5] running maximum

print(list(pairwise([20, 22, 21, 25])))              # [(20, 22), (22, 21), (21, 25)]  (3.10+)
print(list(batched("ABCDEFG", 3)))                   # [('A', 'B', 'C'), ('D', 'E', 'F'), ('G',)]  (3.12+)`, lang: 'python', title: 'accumulate, pairwise, batched' },
    { callout: 'version', title: 'Version notes', text: py`\`pairwise\` is new in **Python 3.10**. \`batched\` is new in **Python 3.12**, and its \`strict=True\` option (raise \`ValueError\` if the last batch is short) arrived in **3.13**. \`accumulate\`'s \`initial=\` needs 3.8+. On older versions, use the equivalent recipes from the itertools documentation.` },
    py`#### groupby`,
    { code: py`from itertools import groupby
from operator import itemgetter

orders = [("north", 10), ("south", 5), ("north", 7), ("south", 2)]
orders.sort(key=itemgetter(0))                    # 1. sort by the grouping key
for region, rows in groupby(orders, key=itemgetter(0)):   # 2. group by the SAME key
    print(region, sum(amount for _, amount in rows))
# north 17
# south 7`, lang: 'python', title: 'sort by the key, then group by the same key' },
    py`\`groupby\` yields \`(key, group)\` pairs, where \`group\` is itself a lazy iterator over that run. \`itemgetter(0)\` from the \`operator\` module is a ready-made \`lambda row: row[0]\`. Without \`key=\`, items are compared directly — perfect for runs in a string: \`groupby("aaabcc")\`.`,
    py`#### Combinatorics`,
    { code: py`from itertools import combinations, combinations_with_replacement, permutations, product

print(list(product("AB", [1, 2])))               # [('A', 1), ('A', 2), ('B', 1), ('B', 2)]
print(list(product("01", repeat=2)))             # [('0', '0'), ('0', '1'), ('1', '0'), ('1', '1')]
print(list(permutations("ABC", 2)))              # 6 ordered pairs: ('A','B') and ('B','A') both
print(list(combinations("ABC", 2)))              # 3 unordered pairs: [('A','B'), ('A','C'), ('B','C')]
print(list(combinations_with_replacement("AB", 2)))  # [('A','A'), ('A','B'), ('B','B')]`, lang: 'python', title: 'product, permutations, combinations' },
    py`| function | "how many?" for n items, choose r | order matters? | repeats? |
|---|---|---|---|
| \`product(items, repeat=r)\` | n ** r | yes | yes |
| \`permutations(items, r)\` | \`math.perm(n, r)\` | yes | no |
| \`combinations(items, r)\` | \`math.comb(n, r)\` | no | no |
| \`combinations_with_replacement(items, r)\` | \`math.comb(n + r - 1, r)\` | no | yes |`,
    py`#### tee: one iterator, several readers`,
    { code: py`from itertools import pairwise, tee

readings = iter([20, 22, 21, 25])
for_max, for_pairs = tee(readings, 2)    # don't touch \`readings\` after this
print(max(for_max))                      # 25
print(list(pairwise(for_pairs)))         # [(20, 22), (22, 21), (21, 25)]`, lang: 'python', title: 'tee buffers what one copy has seen and the other has not' },
  ],
  walkthrough: {
    title: 'Reading the club planner line by line',
    lang: 'python',
    code: CLUB,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor. It needs Python 3.12+ for \`batched\`.`,
    steps: [
      { lines: [1, 3], text: py`Import exactly the tools you use. \`itemgetter(1)\` from \`operator\` builds a function that returns \`item[1]\` — a neat \`key=\` for sorting and grouping tuples.` },
      { lines: [8, 10], text: py`\`combinations(players, 2)\`: every pair once — Ada-vs-Ben is the same match as Ben-vs-Ada. \`permutations(players, 3)\`: order matters on a podium. \`product\`: every court with every time.` },
      { lines: [11, 13], text: py`The results are lazy iterators, so we wrapped them in \`list()\` to take \`len()\` and slices. With 4 players: 6 matches and 24 podiums.` },
      { lines: [16, 17], text: py`\`cycle\` and \`count\` never end, but \`zip\` stops at the shortest input — \`players\` — so the dicts get exactly four entries.` },
      { lines: [22, 22], text: py`\`batched(players, 2)\` cuts the list into tuples of two. (3.12+; on older Pythons, see the recipes.)` },
      { lines: [23, 25], text: py`\`accumulate\` gives the running total after each week. \`pairwise\` gives overlapping neighbour pairs, which makes week-to-week differences a one-liner.` },
      { lines: [26, 26], text: py`\`chain\` walks through both lists as if they were one — without building a combined list first.` },
      { lines: [29, 32], text: py`The **groupby rule**: sort by the key, then group by the same key. The group is a lazy iterator, so we turn it into names immediately, inside the loop.` },
    ],
  },
  playground: {
    title: 'Club planner',
    objective: 'Run it, then use the experiments to grow the club, count outcomes with groupby and find winning streaks.',
    files: { 'main.py': CLUB },
    expected: py`\`\`\`text
6 matches, e.g. [('Ada', 'Ben'), ('Ada', 'Cy')]
24 possible podiums, e.g. ('Ada', 'Ben', 'Cy')
4 slots: [('Court 1', '10:00'), ('Court 1', '11:00')] ...
shirts: {'Ada': 'red', 'Ben': 'blue', 'Cy': 'red', 'Dee': 'blue'}
tickets: {'Ada': 100, 'Ben': 101, 'Cy': 102, 'Dee': 103}
teams: [('Ada', 'Ben'), ('Cy', 'Dee')]
season total so far: [3, 4, 4, 7, 10]
week-to-week change: [-2, -1, 3, 0]
full day: ['warm-up', 'drills', 'match', 'cool-down']
 draw: ['Dee']
 loss: ['Ben']
  win: ['Ada', 'Cy']
\`\`\``,
    experiments: [
      {
        id: 'add-eve',
        task: py`Add \`"Eve"\` to \`players\`. Before running, predict how many matches and podiums there will be.`,
        hint: py`Matches: \`math.comb(5, 2)\`. Podiums: \`math.perm(5, 3)\`.`,
        tests: [
          { name: '10 matches and 60 podiums', code: py`assert "Eve" in players, 'Add "Eve" to players'
assert len(matches) == 10 and len(podiums) == 60` },
        ],
        explain: py`Combinations grow as n·(n−1)/2 for pairs (10), permutations of 3 as n·(n−1)·(n−2) (60). Combinatoric iterators grow *fast* — with 20 players there are 6,840 podiums. Compute the count with \`math.comb\`/\`math.perm\` before you \`list()\` one.`,
      },
      {
        id: 'outcome-counts',
        task: py`Build a dict \`outcome_counts\` mapping each outcome to how many players had it — \`{'draw': 1, 'loss': 1, 'win': 2}\` — using \`groupby\` over \`by_outcome\`.`,
        hint: py`\`{outcome: len(list(group)) for outcome, group in groupby(by_outcome, key=itemgetter(1))}\`. A group has no \`len()\` — turn it into a list first (or use \`sum(1 for _ in group)\`).`,
        tests: [
          { name: 'outcome_counts is correct', code: py`assert ns.get('outcome_counts') == {"draw": 1, "loss": 1, "win": 2}` },
        ],
        explain: py`Because \`by_outcome\` is sorted, each outcome appears exactly once as a key. Try it on the unsorted \`results\` too: \`win\` appears twice, and the dict comprehension keeps only the last count (1). (For pure counting, \`collections.Counter(outcome for _, outcome in results)\` is simpler — see [collections](lesson:collections-module).)`,
      },
      {
        id: 'longest-streak',
        task: py`Write \`longest_streak(history, outcome)\` that returns the longest run of \`outcome\` in a string like \`"WWLWWWLD"\` (\`longest_streak("WWLWWWLD", "W")\` → \`3\`), or \`0\` if it never occurs. Here you **don't** sort — you want consecutive runs.`,
        hint: py`\`groupby("WWLWWWLD")\` gives runs \`W×2, L×1, W×3, L×1, D×1\`. Take \`max(len(list(g)) for k, g in groupby(history) if k == outcome)\` with \`default=0\`.`,
        tests: [
          { name: 'longest win streak is 3', code: py`assert longest_streak("WWLWWWLD", "W") == 3` },
          { name: 'other outcomes', code: py`assert longest_streak("WWLWWWLD", "L") == 1 and longest_streak("LLLW", "L") == 3` },
          { name: 'missing outcome gives 0', code: py`assert longest_streak("WWL", "D") == 0` },
        ],
        explain: py`This is the case where \`groupby\`'s "neighbours only" behaviour is exactly what you want: streaks *are* consecutive runs. Sorting would destroy them. \`max(..., default=0)\` handles the no-match case without an exception.`,
      },
      {
        id: 'rounds',
        task: py`Schedule the matches into rounds of two matches each: create \`rounds = list(batched(matches, 2))\` and print each round on its own line with its number (use \`enumerate(rounds, start=1)\`).`,
        hint: py`\`for number, games in enumerate(rounds, start=1): print("Round", number, games)\``,
        tests: [
          { name: 'rounds are batches of two matches', code: py`assert ns.get('rounds') == list(batched(combinations(players, 2), 2))` },
          { name: 'each round is printed', code: py`assert "Round 1" in output and f"Round {len(rounds)}" in output` },
        ],
        explain: py`\`batched\` (3.12+) slices any iterable into fixed-size tuples, with a shorter last batch when the count doesn't divide evenly — no index arithmetic needed. It's lazy, so it works on huge or streaming inputs too (e.g. inserting database rows 1,000 at a time).`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Hand-written loops vs itertools',
    props: {
      left: {
        label: 'By hand',
        lang: 'python',
        code: py`readings = [20, 22, 21, 25, 24]

changes = []
for i in range(len(readings) - 1):
    changes.append(readings[i + 1] - readings[i])

chunks = []
for start in range(0, len(readings), 2):
    chunks.append(tuple(readings[start:start + 2]))

totals, running = [], 0
for r in readings:
    running += r
    totals.append(running)`,
      },
      right: {
        label: 'With itertools',
        lang: 'python',
        code: py`from itertools import accumulate, batched, pairwise

readings = [20, 22, 21, 25, 24]

changes = [b - a for a, b in pairwise(readings)]   # 3.10+

chunks = list(batched(readings, 2))                 # 3.12+

totals = list(accumulate(readings))`,
      },
      points: [
        'No index arithmetic, so no off-by-one errors (range(len(x) - 1), start + 2).',
        'The itertools versions work on any iterable — files, generators, endless streams — not just lists you can index.',
        'Each name says what it does: pairwise, batched, accumulate.',
        'Lazy: wrap in list() only when you need a list; otherwise feed the iterator straight into the next step.',
      ],
    },
    alt: 'Side-by-side code. Left: three hand-written loops computing consecutive differences with index arithmetic, fixed-size chunks with range and slicing, and running totals with an accumulator variable. Right: the same three results with pairwise, batched and accumulate, each in one line.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every itertools function returns an **iterator object**. Printing one shows something like \`<itertools.chain object at 0x…>\` — not the values. That's your cue that it's lazy: loop over it, pass it to \`list()\`, or feed it into another function.`,
      py`And like every iterator, each is **single-use**: after one \`list(batched(...))\` it's exhausted. Call the function again for a fresh one.`,
      { code: py`from itertools import chain

both = chain([1, 2], [3])
print(both)          # <itertools.chain object at 0x...>
print(list(both))    # [1, 2, 3]
print(list(both))    # [] — already consumed`, lang: 'python', title: 'lazy and single-use, like all iterators' },
    ],
    technical: [
      py`**groupby shares one underlying iterator.** Each \`group\` reads from the same source as the \`groupby\` object. When \`groupby\` advances to the next key, the previous group is skipped past and becomes empty. So consume (or \`list()\`) each group **inside** the loop:`,
      { code: py`from itertools import groupby

words = sorted(["ox", "cat", "dog", "emu", "a"], key=len)
broken = [(size, group) for size, group in groupby(words, key=len)]
print([(size, list(g)) for size, g in broken])     # [(1, []), (2, []), (3, [])]
fixed = [(size, list(g)) for size, g in groupby(words, key=len)]
print(fixed)        # [(1, ['a']), (2, ['ox']), (3, ['cat', 'dog', 'emu'])]`, lang: 'python', title: 'groups die when groupby moves on' },
      py`**Combinatoric functions consume their inputs first.** \`product\`, \`permutations\` and \`combinations\` turn their input iterables into tuples before producing anything, so \`product(count(), "ab")\` never yields a single item — it's still trying to read \`count()\` to the end. Their *output* is lazy; their *input* is not.`,
      py`**tee buffers.** \`tee(it, 2)\` returns two iterators that share a queue. Every item one copy has seen and the other hasn't is held in memory. If one copy runs all the way to the end before the other starts (as in \`max(a)\` then \`list(b)\`), \`tee\` ends up storing everything — at that point \`list(it)\` is simpler and no worse. After calling \`tee\`, don't use the original iterator: items you pull from it directly won't reach the copies.`,
      py`**cycle saves a copy** of every item from its first pass so it can repeat them — memory grows with the input's length, once.`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, \`itertools\` is a C extension module: each iterator's \`__next__\` runs as compiled C, with no Python bytecode executed per item for the iterator itself (your \`key=\` or \`func=\` callbacks still run as Python). That's why chaining itertools is usually faster than an equivalent generator function. The documentation shows "roughly equivalent" pure-Python versions of each function for understanding — they describe behaviour, not the real implementation. PyPy and other implementations provide the same functions in their own way.` },
    ],
    production: [
      py`**Use the recipes.** The itertools documentation ends with a "recipes" section — short, tested building blocks such as \`take\`, \`nth\`, \`first_true\`, \`sliding_window\`, \`unique_everseen\`, \`roundrobin\` and \`partition\`. Copy them into a small utility module rather than inventing your own. The third-party package [more-itertools](https://pypi.org/project/more-itertools/) packages these recipes and many more.`,
      { code: py`# pip install more-itertools   (third-party, not in the sandbox)
from more_itertools import chunked, first, windowed

print(list(windowed([1, 2, 3, 4], 3)))   # [(1, 2, 3), (2, 3, 4)]`, lang: 'python', static: true, title: 'more-itertools (third-party)' },
      py`**Support older Pythons deliberately.** \`pairwise\` (3.10) and \`batched\` (3.12) raise \`ImportError\` on older versions. If your package supports them, import with a fallback recipe, and run your test suite on the oldest Python you claim to support.`,
      py`**Count before you materialise combinatorics.** \`math.perm(12)\` is 479,001,600 — that many tuples won't fit in memory. Use \`math.comb\`/\`math.perm\` to check sizes, iterate lazily, and prune early.`,
      py`**Don't over-itertools.** A chain of five nested itertools calls with lambdas can be harder to read than a plain loop. Name intermediate iterators, or write a small generator function. Readability still wins — see [clean code](lesson:clean-code).`,
    ],
  },
  mistakes: [
    {
      title: 'groupby on unsorted data',
      wrong: { code: py`from itertools import groupby

sales = [("north", 10), ("south", 5), ("north", 7)]
totals = {region: sum(a for _, a in rows) for region, rows in groupby(sales, key=lambda s: s[0])}
print(totals)   # {'north': 7, 'south': 5} — the first north sale vanished`, lang: 'python' },
      right: { code: py`from itertools import groupby

sales = [("north", 10), ("south", 5), ("north", 7)]
key = lambda s: s[0]
totals = {region: sum(a for _, a in rows) for region, rows in groupby(sorted(sales, key=key), key=key)}
print(totals)   # {'north': 17, 'south': 5}`, lang: 'python' },
      explanation: py`\`groupby\` only joins *neighbouring* items with the same key. Sort by the same key first — or, if all you need is totals per key, a plain loop with a \`dict\`/\`defaultdict\` doesn't need sorting at all.`,
    },
    {
      title: 'Keeping groupby groups for later',
      wrong: { code: py`from itertools import groupby

words = sorted(["ox", "cat", "dog"], key=len)
groups = list(groupby(words, key=len))       # stores (key, group) pairs
print([(k, list(g)) for k, g in groups])     # [(2, []), (3, [])] — empty groups`, lang: 'python' },
      right: { code: py`from itertools import groupby

words = sorted(["ox", "cat", "dog"], key=len)
groups = [(k, list(g)) for k, g in groupby(words, key=len)]   # copy each group immediately
print(groups)                                # [(2, ['ox']), (3, ['cat', 'dog'])]`, lang: 'python' },
      explanation: py`Each group is a view on the shared underlying iterator. Once \`groupby\` moves to the next key, the old group is gone. Turn groups into lists as you meet them.`,
    },
    {
      title: 'Materialising an infinite iterator',
      wrong: { code: py`from itertools import count

ids = list(count(1))          # never finishes — memory keeps growing`, lang: 'python', static: true },
      right: { code: py`from itertools import count, islice

ids = list(islice(count(1), 5))   # [1, 2, 3, 4, 5]
print(ids)`, lang: 'python' },
      explanation: py`\`count\`, \`cycle\` and \`repeat\` (without \`times\`) never end. Limit them with \`islice\`, \`zip\` against a finite iterable, \`takewhile\` or \`next()\`.`,
    },
    {
      title: 'Using the original iterator after tee',
      wrong: { code: py`from itertools import tee

source = iter([1, 2, 3, 4])
a, b = tee(source)
next(source)              # steals 1 behind tee's back
print(list(a), list(b))   # [2, 3, 4] [2, 3, 4] — both copies missed it`, lang: 'python' },
      right: { code: py`from itertools import tee

source = iter([1, 2, 3, 4])
a, b = tee(source)
del source                # make it impossible to misuse
print(list(a), list(b))   # [1, 2, 3, 4] [1, 2, 3, 4]`, lang: 'python' },
      explanation: py`\`tee\` reads from the original iterator on behalf of its copies. Anything you pull from the original directly is invisible to them. After \`tee\`, use only the copies.`,
    },
    {
      title: 'Letting zip silently drop data',
      wrong: { code: py`names = ["Ada", "Ben", "Cy"]
scores = [91, 47]                    # one score missing!
print(dict(zip(names, scores)))      # {'Ada': 91, 'Ben': 47} — Cy silently dropped`, lang: 'python' },
      right: { code: py`from itertools import zip_longest

names = ["Ada", "Ben", "Cy"]
scores = [91, 47]
print(dict(zip_longest(names, scores)))     # {'Ada': 91, 'Ben': 47, 'Cy': None}
# or fail loudly (3.10+): dict(zip(names, scores, strict=True)) -> ValueError`, lang: 'python' },
      explanation: py`\`zip\` stops at the shortest input. When lengths should match, use \`zip(..., strict=True)\` (3.10+) to get \`ValueError: zip() argument 2 is shorter than argument 1\`; when they may legitimately differ, \`zip_longest\` pads with a \`fillvalue\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`The same key appears twice in groupby output (or a dict built from it has wrong totals).`,
      cause: py`The input wasn't sorted by the grouping key, so equal keys weren't next to each other.`,
      fix: py`\`groupby(sorted(data, key=k), key=k)\` with the **same** \`k\`, or use \`collections.defaultdict\`/\`Counter\` when you don't need streaming.`,
    },
    {
      symptom: py`Every group from groupby is an empty list.`,
      cause: py`The \`(key, group)\` pairs were collected first (e.g. \`list(groupby(...))\`) and the groups read afterwards — by then \`groupby\` had moved past them.`,
      fix: py`Consume each group inside the loop: \`[(k, list(g)) for k, g in groupby(...)]\`.`,
    },
    {
      symptom: py`ImportError: cannot import name 'batched' from 'itertools' (unknown location)`,
      cause: py`Running on Python older than 3.12 (or older than 3.10 for \`pairwise\`).`,
      fix: py`Upgrade, or fall back to the recipe from the itertools docs inside \`try: from itertools import batched / except ImportError: ...\`.`,
    },
    {
      symptom: py`ValueError: batched(): incomplete batch`,
      cause: py`\`batched(..., strict=True)\` (3.13+) found that the number of items isn't a multiple of \`n\`.`,
      fix: py`Drop \`strict=True\` if a short final batch is acceptable, or fix the data so the count divides evenly.`,
    },
    {
      symptom: py`TypeError: 'itertools.count' object is not subscriptable`,
      cause: py`Indexing or slicing an itertools iterator: \`count()[5]\`, \`chain(a, b)[:3]\`.`,
      fix: py`Use \`islice(it, start, stop)\`, or \`next(islice(it, n, None))\` for the n-th item (the \`nth\` recipe).`,
    },
    {
      symptom: py`The program hangs at list(...), sorted(...) or product(...)`,
      cause: py`An infinite iterator (\`count\`, \`cycle\`, \`repeat\`) reached a function that consumes everything — including \`product\`/\`combinations\`, which read their inputs fully first.`,
      fix: py`Limit the infinite source with \`islice\`/\`takewhile\`/\`zip\` *before* passing it on.`,
    },
  ],
  bestPractices: [
    'Reach for itertools before writing index arithmetic: pairwise, batched, accumulate, chain, islice.',
    'Always sort by the grouping key before groupby — unless you deliberately want consecutive runs.',
    'Turn each groupby group into a list inside the loop if you need it after the loop moves on.',
    'Pair infinite iterators with something finite: zip, islice, takewhile, next.',
    'Check combinatoric sizes with math.comb / math.perm before materialising anything.',
    'Label and guard version-specific tools: pairwise (3.10+), batched (3.12+), batched(strict=) (3.13+).',
    'Prefer the documented recipes (or more-itertools) to home-made variants, and keep long chains readable with names.',
  ],
  useCases: [
    'Generating test cases or configurations: product(browsers, screen_sizes, languages).',
    'Tournament scheduling, team picking and seating plans with combinations / permutations.',
    'Running balances, cumulative sales and running maxima with accumulate.',
    'Bulk database inserts or API calls in fixed-size batches with batched.',
    'Detecting changes and streaks in time series with pairwise and groupby.',
    'Round-robin assignment of jobs to workers with cycle.',
  ],
  comparison: {
    title: 'The itertools families at a glance',
    headers: ['family', 'functions', 'stops when…', 'watch out for'],
    rows: [
      ['infinite', 'count, cycle, repeat', 'never (repeat stops with times=)', 'pair with zip / islice / takewhile'],
      ['terminating', 'chain, islice, accumulate, groupby, pairwise (3.10), batched (3.12), takewhile, dropwhile, compress, filterfalse, starmap, zip_longest, tee', 'the (shortest or longest) input ends', 'groupby needs sorted input; tee buffers'],
      ['combinatoric', 'product, permutations, combinations, combinations_with_replacement', 'every arrangement has been produced', 'sizes explode; inputs are read fully first'],
    ],
    note: py`Related built-ins: \`zip\`, \`map\`, \`filter\`, \`enumerate\`, \`reversed\` — and \`functools.reduce\` for folding a sequence to one value (see [functools](lesson:functools) and [map, filter & reduce](lesson:map-filter-reduce)).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'itertools-q1',
      type: 'mcq',
      prompt: 'You need every possible doubles pairing from 6 players, where (Ada, Ben) and (Ben, Ada) are the same pair. Which call fits?',
      options: [
        { text: 'permutations(players, 2)', why: 'permutations treats (Ada, Ben) and (Ben, Ada) as different — order matters — so every pair appears twice.' },
        'combinations(players, 2)',
        { text: 'product(players, repeat=2)', why: 'product also includes (Ada, Ada) and both orders of every pair.' },
        { text: 'pairwise(players)', why: 'pairwise gives only neighbouring pairs: (p1, p2), (p2, p3), … — not every pair.' },
      ],
      answer: 1,
      explanation: py`\`combinations(players, 2)\` yields each unordered pair once: \`math.comb(6, 2)\` = 15 pairs.`,
    },
    {
      id: 'itertools-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from itertools import groupby

words = ["apple", "avocado", "banana", "apricot"]
print([(k, len(list(g))) for k, g in groupby(words, key=lambda w: w[0])])`,
      options: [
        { text: "[('a', 3), ('b', 1)]", why: 'That is what you would get after sorting by first letter. groupby only joins neighbouring items, and "apricot" is not next to the other a-words.' },
        "[('a', 2), ('b', 1), ('a', 1)]",
        { text: "[('a', 1), ('a', 1), ('b', 1), ('a', 1)]", why: 'Consecutive items with the same key ARE grouped: "apple" and "avocado" form one group.' },
        { text: 'TypeError', why: 'groupby accepts any key function; w[0] is a perfectly good key.' },
      ],
      answer: 1,
      explanation: py`Runs of the same first letter: \`apple, avocado\` → \`('a', 2)\`; \`banana\` → \`('b', 1)\`; \`apricot\` starts a new \`'a'\` run → \`('a', 1)\`.`,
    },
    {
      id: 'itertools-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from itertools import accumulate

print(list(accumulate([1, 2, 3, 4])))`,
      answer: '[1, 3, 6, 10]',
      accept: ['[1,3,6,10]'],
      explanation: py`Running totals: 1, 1+2, 1+2+3, 1+2+3+4. (\`accumulate(xs, max)\` would give a running maximum; \`initial=0\` would add a leading 0.)`,
    },
    {
      id: 'itertools-q4',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from itertools import cycle, islice

print(list(islice(cycle("AB"), 5)))`,
      options: [
        { text: "['A', 'B']", why: 'cycle repeats the input forever; islice takes 5 items from that endless stream.' },
        "['A', 'B', 'A', 'B', 'A']",
        { text: 'It runs forever', why: 'islice stops after 5 items, so the infinite cycle is never fully consumed.' },
        { text: "['AB', 'AB', 'AB', 'AB', 'AB']", why: 'cycle iterates the string, so it yields single characters.' },
      ],
      answer: 1,
      explanation: py`\`cycle("AB")\` yields A, B, A, B, … forever; \`islice(..., 5)\` stops after five.`,
    },
    {
      id: 'itertools-q5',
      type: 'bug',
      prompt: 'This report should give north a total of 17, but it prints `{\'north\': 7, \'south\': 5}`. Click the line with the real cause.',
      code: py`from itertools import groupby

sales = [("north", 10), ("south", 5), ("north", 7)]
totals = {}
for region, rows in groupby(sales, key=lambda s: s[0]):
    totals[region] = sum(amount for _, amount in rows)
print(totals)`,
      answerLine: 5,
      explanation: py`\`groupby\` is given unsorted data, so the two north sales form two separate groups and the second assignment overwrites the first. Fix: \`groupby(sorted(sales, key=key), key=key)\` — or accumulate totals in a dict without groupby.`,
    },
    {
      id: 'itertools-q6',
      type: 'fill',
      prompt: 'Fill the blanks: flatten a list of playlists lazily, then take the first 3 songs.',
      code: py`from itertools import chain, islice

playlists = [["intro", "verse"], ["chorus"], ["bridge", "outro"]]
all_songs = chain.___(playlists)
print(list(___(all_songs, 3)))   # ['intro', 'verse', 'chorus']`,
      answer: [['from_iterable'], ['islice']],
      explanation: py`\`chain.from_iterable\` takes ONE iterable of iterables (chain(*playlists) also works). \`islice(it, 3)\` takes the first three items lazily.`,
    },
    {
      id: 'itertools-q7',
      type: 'short',
      prompt: 'Explain why `groupby` requires its input to be sorted by the key, and give one situation where you deliberately should NOT sort.',
      answer: py`\`groupby\` makes a single lazy pass and starts a new group whenever the key changes from the previous item; it never looks back or ahead, which is what lets it work on streams. So only neighbouring equal keys are grouped — sorting makes all equal keys neighbours. Don't sort when you want consecutive runs themselves: winning/losing streaks, run-length encoding ("aaabcc"), or sessions of consecutive events in a log.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'run-length',
      title: 'Run-length encoding',
      difficulty: 'intermediate',
      prompt: py`**Run-length encoding** compresses repeated characters: \`"aaabccdddd"\` becomes \`[("a", 3), ("b", 1), ("c", 2), ("d", 4)]\`. Write:

1. \`encode(text)\` → a **list** of \`(char, count)\` tuples for each run of consecutive identical characters. Use \`groupby\`. \`encode("")\` → \`[]\`.
2. \`decode(pairs)\` → the original string. Use \`repeat\` (or string multiplication) and \`chain.from_iterable\`, then \`"".join\`.

\`decode(encode(s)) == s\` must hold for any string.`,
      files: {
        'main.py': py`from itertools import chain, groupby, repeat


def encode(text):
    # TODO: groupby consecutive characters
    return []


def decode(pairs):
    # TODO: rebuild the string
    return ""


packed = encode("aaabccdddd")
print(packed)
print(decode(packed))
`,
      },
      hints: [
        'groupby(text) with no key groups consecutive equal characters. Each group is an iterator — count it with len(list(group)) or sum(1 for _ in group).',
        'For decode, repeat(char, count) yields the character count times. You have one such iterator per pair — chain.from_iterable flattens them into one stream of characters.',
        'encode: [(char, len(list(run))) for char, run in groupby(text)]. decode: "".join(chain.from_iterable(repeat(c, n) for c, n in pairs))',
      ],
      solution: {
        explanation: py`\`groupby(text)\` already does the hard part: it starts a new group each time the character changes, which is exactly a "run". Because we must not sort (runs are about order), this is \`groupby\` used deliberately on unsorted data. For \`decode\`, \`repeat(c, n)\` produces each run lazily, \`chain.from_iterable\` strings all the runs together into one stream of characters, and \`"".join\` builds the result in one go. (\`"".join(c * n for c, n in pairs)\` is an equally good, simpler alternative.)`,
        files: {
          'main.py': py`from itertools import chain, groupby, repeat


def encode(text):
    return [(char, len(list(run))) for char, run in groupby(text)]


def decode(pairs):
    return "".join(chain.from_iterable(repeat(char, count) for char, count in pairs))


packed = encode("aaabccdddd")
print(packed)
print(decode(packed))
`,
        },
      },
      tests: [
        { name: 'encodes runs', code: py`assert encode("aaabccdddd") == [("a", 3), ("b", 1), ("c", 2), ("d", 4)]` },
        { name: 'only consecutive characters are grouped', code: py`assert encode("abab") == [("a", 1), ("b", 1), ("a", 1), ("b", 1)]` },
        { name: 'empty string', code: py`assert encode("") == [] and decode([]) == ""` },
        { name: 'decodes pairs', code: py`assert decode([("x", 2), ("y", 3)]) == "xxyyy"` },
        { name: 'round trip', code: py`for s in ["hello", "zzz", "a", "mississippi"]:
    assert decode(encode(s)) == s, s` },
      ],
    },
    {
      id: 'sensor-analytics',
      title: 'Sensor analytics',
      difficulty: 'intermediate',
      prompt: py`A temperature sensor produces readings like \`[20, 22, 21, 25]\`. Write three functions, each returning a **list** and each using the named itertools function:

1. \`deltas(readings)\` — the change between each reading and the next, using \`pairwise\` (3.10+): \`[20, 22, 21, 25]\` → \`[2, -1, 4]\`. Fewer than two readings → \`[]\`.
2. \`running_max(readings)\` — the highest reading so far at each point, using \`accumulate\` with \`max\`: \`[3, 1, 4, 1, 5]\` → \`[3, 3, 4, 4, 5]\`.
3. \`in_batches(readings, size)\` — tuples of \`size\` readings, the last possibly shorter, using \`batched\` (3.12+): \`in_batches(range(7), 3)\` → \`[(0, 1, 2), (3, 4, 5), (6,)]\`.`,
      files: {
        'main.py': py`from itertools import accumulate, batched, pairwise


def deltas(readings):
    # TODO: pairwise
    return []


def running_max(readings):
    # TODO: accumulate with max
    return list(readings)


def in_batches(readings, size):
    # TODO: batched
    return [tuple(readings)]


temps = [20, 22, 21, 25]
print(deltas(temps))
print(running_max([3, 1, 4, 1, 5]))
print(in_batches(range(7), 3))
`,
      },
      hints: [
        'pairwise(readings) yields (previous, current) tuples. The change is current - previous.',
        'accumulate takes an optional second argument: a function of two values. The built-in max works.',
        '[b - a for a, b in pairwise(readings)], list(accumulate(readings, max)), list(batched(readings, size))',
      ],
      solution: {
        explanation: py`Each function is one line because each itertools tool encodes a pattern you'd otherwise write with indexes. \`pairwise\` hands you overlapping neighbours, so differences never go out of range. \`accumulate(readings, max)\` carries "the best so far" forward — it calls \`max(best_so_far, next_reading)\` at each step. \`batched\` handles the short last batch for you. All three accept any iterable (a \`range\`, a generator, a file of numbers), not just lists. On Python older than 3.10/3.12, the equivalent recipes from the itertools documentation do the same job.`,
        files: {
          'main.py': py`from itertools import accumulate, batched, pairwise


def deltas(readings):
    return [current - previous for previous, current in pairwise(readings)]


def running_max(readings):
    return list(accumulate(readings, max))


def in_batches(readings, size):
    return list(batched(readings, size))


temps = [20, 22, 21, 25]
print(deltas(temps))
print(running_max([3, 1, 4, 1, 5]))
print(in_batches(range(7), 3))
`,
        },
      },
      tests: [
        { name: 'deltas', code: py`assert deltas([20, 22, 21, 25]) == [2, -1, 4]
assert deltas([5]) == [] and deltas([]) == []` },
        { name: 'running_max', code: py`assert running_max([3, 1, 4, 1, 5]) == [3, 3, 4, 4, 5]
assert running_max([]) == []` },
        { name: 'in_batches', code: py`assert in_batches(range(7), 3) == [(0, 1, 2), (3, 4, 5), (6,)]
assert in_batches([1, 2], 5) == [(1, 2)]` },
        { name: 'works on a generator too', code: py`assert deltas(x * x for x in range(4)) == [1, 3, 5]` },
        { name: 'uses pairwise, accumulate and batched', code: py`src = files["main.py"].split("temps =")[0]
for name in ("pairwise(", "accumulate(", "batched("):
    assert name in src, f"use {name[:-1]}() as the exercise asks"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'itertools-chain-vs-concat',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between `a + b` (for two lists) and `itertools.chain(a, b)`? When would you use each?',
      answer: 'a + b builds a new list containing all items (memory for both, only works for lists of the same type). chain(a, b) returns a lazy iterator that walks a then b without copying, and works with any iterables (lists, tuples, generators, files). Use + when you need a real list; use chain to loop over several sources once.',
      explanation: py`\`chain\` is O(1) to create and copies nothing; iteration cost is the same. \`chain.from_iterable\` handles an iterable of iterables, even a lazy one. \`[*a, *b]\` is another way to build a list from any iterables.`,
      code: { lang: 'python', code: py`from itertools import chain

local, remote = ["a.txt"], ("b.txt", "c.txt")
for name in chain(local, remote):      # a list and a tuple, no copy
    print(name)
# local + remote -> TypeError: can only concatenate list (not "tuple") to list` },
      whyAsked: 'A quick check of laziness awareness and familiarity with the most common itertools function.',
      mistakes: ['Saying chain returns a list', 'Not knowing chain.from_iterable', 'Thinking + works between a list and a tuple'],
      followUps: ['How would you flatten a list of lists?', 'Is chain single-use?'],
      modelAnswer: 'a + b creates a brand-new list with all the items copied in, and it only works when both are lists. itertools.chain(a, b) returns a lazy iterator that simply walks through a and then b, copying nothing, and it accepts any iterables — a list and a tuple, generators, file objects. So if I need an actual list to keep, index or pass around, I concatenate; if I just need to loop over several sources once, I chain. For a list of lists, chain.from_iterable flattens one level lazily.',
    },
    {
      id: 'itertools-groupby-sorted',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A report groups orders by customer with `groupby(orders, key=get_customer)` and some customers appear several times with partial totals. What is wrong, and what are two ways to fix it?',
      answer: 'groupby only groups consecutive items with equal keys; the orders aren\'t sorted by customer. Fix 1: sort by the same key first — groupby(sorted(orders, key=get_customer), key=get_customer). Fix 2: skip groupby and aggregate into a dict/defaultdict, which needs no sorting.',
      explanation: py`Sorting costs O(n log n) and needs all data in memory; a dict aggregation is O(n) and streams. \`groupby\` shines when data already arrives sorted (e.g. from \`ORDER BY\` in SQL) or when you want consecutive runs.`,
      whyAsked: 'The single most common itertools bug; the follow-up checks you can choose the right tool.',
      mistakes: ['Sorting by a different key than the groupby key', 'Assuming groupby works like SQL GROUP BY', 'Not realising the dict approach avoids sorting'],
      followUps: ['When is groupby better than a dict?', 'What happens if you store the groups and read them later?'],
      modelAnswer: 'groupby is not SQL GROUP BY: it makes one pass and starts a new group whenever the key changes from the previous item, so only neighbouring orders for the same customer are grouped. The orders are not sorted by customer, so each customer appears once per run. One fix is to sort by exactly the same key first, groupby(sorted(orders, key=get_customer), key=get_customer). The other is to not use groupby at all and accumulate totals in a defaultdict, which is linear and needs no sort. I would use groupby when the data already comes sorted, for example from an ORDER BY query, or when I actually want consecutive runs.',
    },
    {
      id: 'itertools-combinatorics-size',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A test generator builds `list(product(browsers, sizes, languages, roles, flags))` and the CI job runs out of memory. How do you reason about it and fix it?',
      answer: 'product\'s output size is the product of the input lengths, so it grows multiplicatively; materialising it with list() holds every combination in memory. Compute the size first (math.prod of the lengths), iterate lazily instead of list(), and reduce the space — pairwise/all-pairs testing, sampling, or pruning invalid combinations early.',
      explanation: py`\`len(list(product(a, b, c)))\` == \`len(a) * len(b) * len(c)\`. Five inputs of 10 values each are 100,000 combinations. Iterating lazily keeps memory flat but time is still proportional to the count, so the real fix is usually choosing fewer combinations. Note also that \`product\` reads all its inputs into tuples first, so those must be finite.`,
      code: { lang: 'python', code: py`import math
from itertools import product

browsers, sizes, languages = ["chrome", "firefox"], ["s", "m", "l"], ["en", "de", "ja"]
print(math.prod(map(len, [browsers, sizes, languages])))   # 18 — check before you list()
for combo in product(browsers, sizes, languages):          # lazy: one tuple at a time
    pass` },
      whyAsked: 'Combinatorial explosion is a real-world trap; the question tests estimation and lazy thinking.',
      mistakes: ['Suggesting more memory for the CI runner', 'Not estimating the size first', 'Believing laziness also fixes the run time'],
      followUps: ['How many 3-player podiums are there from 20 players?', 'What is all-pairs (pairwise) testing?'],
      modelAnswer: 'The number of tuples product generates is the product of the input lengths, so adding one more dimension multiplies the total, and list() then tries to keep every tuple in memory at once. First I would compute the size with math.prod of the lengths to see how big it is. Then I would iterate lazily instead of calling list, which fixes memory but not time, since every combination still has to run. So the real fix is shrinking the space: drop invalid combinations early, sample, or use all-pairs testing, which covers every pair of values with far fewer cases.',
    },
    {
      id: 'itertools-tee-memory',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What does `itertools.tee` do internally, when can it use as much memory as `list()`, and what rule must you follow with the original iterator?',
      answer: 'tee returns n iterators sharing a buffer: each item read from the source is stored until every copy has consumed it. If one copy runs far ahead of another (e.g. fully consumed before the other starts), the buffer holds everything in between — as much as list(). After tee, don\'t use the original iterator, or the copies will miss items.',
      explanation: py`\`tee\` is great when the copies advance roughly together (e.g. comparing an item with the next one — how the classic \`pairwise\` recipe worked before 3.10). If you consume one copy completely before the other, just make a list. The docs also note that tee iterators are not thread-safe for concurrent use.`,
      code: { lang: 'python', code: py`from itertools import tee

prices = iter([3, 5, 4, 8])
a, b = tee(prices)
next(b, None)                               # b runs one step ahead: tiny buffer
print([y - x for x, y in zip(a, b)])        # [2, -1, 4]` },
      whyAsked: 'Probes understanding of how lazy tools trade memory for convenience — a senior-level detail.',
      mistakes: ['Thinking tee re-reads the source from the start', 'Using the original iterator after tee', 'Using tee where list() is simpler'],
      followUps: ['How was pairwise written before Python 3.10?', 'Why can\'t tee "copy" a generator by restarting it?'],
      modelAnswer: 'tee splits one iterator into several that share a buffer. When any copy needs an item the others haven\'t seen, tee pulls it from the source once and keeps it in the buffer until every copy has consumed it. So memory depends on how far apart the copies are: if they advance together, the buffer stays tiny; if I exhaust one copy before starting the other, the buffer ends up holding everything, and a list would have been simpler. Iterators can\'t be restarted, so tee is buffering, not copying. And after calling tee I must stop using the original iterator, because anything I take from it directly never reaches the copies.',
    },
    {
      id: 'itertools-sliding-window',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Implement the generator `sliding_window(iterable, n)` that yields overlapping tuples of `n` consecutive items: `sliding_window([1, 2, 3, 4], 3)` → `(1, 2, 3)`, `(2, 3, 4)`. It must work lazily on any iterable, including infinite ones. Fewer than `n` items → nothing.',
      answer: 'Keep a collections.deque with maxlen=n: prime it with the first n - 1 items using islice, then for each new item append it (the deque drops the oldest automatically) and yield tuple(window).',
      explanation: py`This is the official itertools recipe. \`deque(maxlen=n)\` gives O(1) appends that discard from the left. Priming with \`islice(it, n - 1)\` means the first full window is yielded as soon as the n-th item arrives. Memory is O(n) regardless of input size. For \`n == 2\`, \`pairwise\` (3.10+) is the built-in equivalent.`,
      starter: { files: { 'main.py': py`from collections import deque
from itertools import islice


def sliding_window(iterable, n):
    # TODO: yield overlapping tuples of n items, lazily
    return iter([])


print(list(sliding_window([1, 2, 3, 4], 3)))
` } },
      tests: [
        { name: 'windows of 3', code: py`assert list(sliding_window([1, 2, 3, 4], 3)) == [(1, 2, 3), (2, 3, 4)]` },
        { name: 'too short gives nothing', code: py`assert list(sliding_window([1, 2], 3)) == []` },
        { name: 'windows of 1 and of the full length', code: py`assert list(sliding_window("abc", 1)) == [("a",), ("b",), ("c",)]
assert list(sliding_window("abc", 3)) == [("a", "b", "c")]` },
        { name: 'lazy on an infinite iterator', code: py`from itertools import count
w = sliding_window(count(), 2)
assert next(w) == (0, 1) and next(w) == (1, 2)` },
      ],
      solution: { files: { 'main.py': py`from collections import deque
from itertools import islice


def sliding_window(iterable, n):
    it = iter(iterable)
    window = deque(islice(it, n - 1), maxlen=n)
    for item in it:
        window.append(item)
        yield tuple(window)


print(list(sliding_window([1, 2, 3, 4], 3)))
` } },
      hints: ['You need to remember the last n items. Which collection drops old items automatically when full?', 'deque(maxlen=n). Fill it with the first n - 1 items via islice, then append each new item and yield a tuple copy.'],
      whyAsked: 'Combines iterators, islice and deque in a classic streaming pattern used for moving averages and anomaly detection.',
      mistakes: ['Building a list of the whole input (breaks on infinite streams)', 'Yielding the deque itself instead of a tuple copy (all results change together)', 'Using list.pop(0), which is O(n)'],
      followUps: ['How would you compute a moving average with it?', 'Why yield tuple(window) and not window?', 'What does the built-in pairwise correspond to?'],
      modelAnswer: 'I would use a deque with maxlen equal to n, which automatically discards the oldest item when a new one is appended. I take an iterator from the input, prime the deque with the first n minus one items using islice, then loop over the rest: append each item and yield a tuple copy of the deque. That yields the first window as soon as the n-th item arrives, uses memory proportional to n only, and works on infinite streams. I yield a tuple rather than the deque itself because the deque keeps changing, so every result would otherwise point to the same mutating object.',
    },
    {
      id: 'itertools-version-fallbacks',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Your library supports Python 3.9+, and a contributor used `itertools.pairwise` and `itertools.batched`. CI on 3.9 fails. How do you keep the code clean and still support old versions?',
      answer: 'pairwise exists from 3.10 and batched from 3.12, so 3.9 raises ImportError. Import them inside try/except ImportError (or check sys.version_info) and fall back to the documented recipes in a small compat module; test on every supported version, and drop the fallbacks when the minimum version passes 3.12.',
      explanation: py`Version-gated imports keep call sites identical. Put fallbacks in one place (e.g. \`_compat.py\`) so they're easy to delete later. Note that behaviour should match exactly — e.g. \`batched\` yields tuples, and \`strict=\` only exists from 3.13, so don't pass it on older versions.`,
      code: { lang: 'python', code: py`try:
    from itertools import batched          # Python 3.12+
except ImportError:                        # older Pythons: the documented recipe
    from itertools import islice

    def batched(iterable, n):
        if n < 1:
            raise ValueError("n must be at least one")
        it = iter(iterable)
        while batch := tuple(islice(it, n)):
            yield batch


print(list(batched("ABCDE", 2)))   # [('A', 'B'), ('C', 'D'), ('E',)]` },
      whyAsked: 'Real libraries juggle supported versions; the question checks awareness of when stdlib features arrived and of clean compatibility layers.',
      mistakes: ['Pinning everyone to the newest Python without discussing it', 'Copy-pasting fallbacks into every module', 'Fallbacks that subtly differ (returning lists instead of tuples)'],
      followUps: ['How would you run tests across versions (tox/nox, CI matrix)?', 'What does requires-python in pyproject.toml do?'],
      modelAnswer: 'pairwise was added in Python 3.10 and batched in 3.12, so on 3.9 the import itself fails. I would add a small compatibility module that tries the import from itertools and, on ImportError, defines the recipe from the itertools documentation with exactly the same behaviour — for batched, yielding tuples and rejecting n below one. Every other module imports from that compat module, so call sites stay clean. CI should run the test suite on every supported version, and once the minimum supported Python reaches 3.12, the fallback can simply be deleted.',
    },
  ],

  takeaways: [
    'itertools functions return lazy, single-use iterators; combine them with for, list(), sum(), dict() or each other.',
    'Infinite sources (count, cycle, repeat) must be limited with zip, islice, takewhile or next().',
    'chain, islice, accumulate, pairwise (3.10+) and batched (3.12+) replace index arithmetic with named, tested tools.',
    'groupby groups only consecutive equal keys: sort by the same key first — unless you want runs.',
    'product, permutations and combinations grow explosively and read their inputs fully; count with math.comb/math.perm first.',
    'tee buffers items between its copies; after tee, never use the original iterator.',
  ],
}
