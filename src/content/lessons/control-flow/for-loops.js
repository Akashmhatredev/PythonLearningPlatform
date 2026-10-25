// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CLASS_REPORT = py`# Class report: the main ways to loop with for
students = ["Ada", "Ben", "Cleo", "Dev"]
scores = [91, 78, 85, 62]

# 1. range(start, stop, step) counts. The stop value is never included.
for seconds in range(3, 0, -1):
    print(seconds, "...")

# 2. zip() walks two lists side by side, one pair at a time.
total = 0
for name, score in zip(students, scores, strict=True):
    print(f"{name:<5}{score:>4}")
    total += score
print("Class average:", total / len(scores))

# 3. enumerate() numbers the items. start=1 because humans count from 1.
for seat, name in enumerate(students, start=1):
    print(f"Seat {seat}: {name}")

# 4. dict.items() gives each key together with its value.
bands = {"90+": 0, "80-89": 0, "below 80": 0}
for score in scores:
    if score >= 90:
        bands["90+"] += 1
    elif score >= 80:
        bands["80-89"] += 1
    else:
        bands["below 80"] += 1
for band, count in bands.items():
    print(f"{band:<9}", "#" * count)
`

export default {
  id: 'for-loops',
  title: 'for loops, range(), enumerate() & zip()',
  summary: 'A for loop runs its block once for each item of an iterable — a list, a string, a dict, a range of numbers — with enumerate() and zip() to number and pair items.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['while-loops', 'lists'],
  related: ['while-loops', 'loop-control', 'lists', 'dictionaries', 'tuples-and-unpacking', 'strings-basics', 'comprehensions', 'iterators', 'itertools', 'mutability-and-copying'],
  tags: ['for', 'loop', 'iteration', 'iterable', 'range', 'enumerate', 'zip', 'strict', 'reversed', 'items', 'nested loops', 'loop variable', 'for each'],
  apis: [
    { name: 'for item in iterable:', summary: 'Runs the block once per item, binding the loop variable to each item in turn.' },
    { name: 'range(stop) / range(start, stop[, step])', summary: 'A lazy sequence of integers from start up to (not including) stop, moving by step.' },
    { name: 'enumerate(iterable, start=0)', summary: 'Yields (index, item) pairs; start sets the first index.' },
    { name: 'zip(*iterables, strict=False)', summary: 'Yields tuples pairing the i-th items of each iterable; stops at the shortest unless strict=True (3.10+), which raises ValueError on unequal lengths.' },
    { name: 'reversed(sequence)', summary: 'Iterates a sequence back to front without copying it.' },
    { name: 'dict.items()', summary: 'A view of (key, value) pairs, for looping over keys and values together.' },
  ],
  docs: [
    { label: 'Python tutorial — for statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#for-statements' },
    { label: 'Python tutorial — the range() function', url: 'https://docs.python.org/3/tutorial/controlflow.html#the-range-function' },
    { label: 'Python tutorial — looping techniques', url: 'https://docs.python.org/3/tutorial/datastructures.html#looping-techniques' },
    { label: 'Built-in functions — enumerate()', url: 'https://docs.python.org/3/library/functions.html#enumerate' },
    { label: 'Built-in functions — zip()', url: 'https://docs.python.org/3/library/functions.html#zip' },
    { label: 'Language reference — the for statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-for-statement' },
    { label: 'PEP 618 — zip(strict=True)', url: 'https://peps.python.org/pep-0618/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Most repetition in real programs is **"do this for each thing"**: for each song in the playlist, play it; for each line in the file, check it; for each student, print their grade. Python's \`for\` loop says exactly that:`,
    { code: py`playlist = ["Intro", "Anthem", "Outro"]
for song in playlist:
    print("Now playing:", song)`, lang: 'python', title: 'for each item…' },
    py`Each time round, Python takes the **next item** from the collection, binds the **loop variable** (\`song\`) to it, and runs the indented body. When the items run out, the loop ends by itself — no counter to set up, no condition to get wrong, no way to loop forever over a list.`,
    py`A \`for\` loop works on any **iterable** — anything Python can hand out items from one at a time: lists, strings, tuples, dicts, sets, files, and \`range()\` for counting. Three built-in helpers make it even more useful: **\`enumerate()\`** numbers the items, **\`zip()\`** walks several collections side by side, and **\`reversed()\`** goes backwards.`,
  ],
  why: [
    py`With a [\`while\` loop](lesson:while-loops) you manage everything yourself: \`i = 0\`, \`while i < len(items)\`, \`items[i]\`, \`i += 1\`. Four chances for a bug, and none of it is the actual work. \`for\` moves all that bookkeeping into the language.`,
    py`It also makes code **uniform**: the same \`for x in thing:\` works whether \`thing\` is a list, a string, a file or a database result. Learn it once, use it everywhere — and later, your own objects can join in too ([iterators](lesson:iterators)).`,
    py`Finally, loops are where data processing happens: totals, counts, searches, reports. Doing them the idiomatic way — \`enumerate\` instead of index juggling, \`zip\` instead of parallel indexes — is one of the clearest signs of fluent Python.`,
  ],
  eli15: [
    py`Imagine a teacher taking the register. They don't think "start at line 0, add one each time, stop when the line number equals the length of the list". They just go: **for each name on the list**, call it out.`,
    py`That's a \`for\` loop. You hand Python a list (or a word, or a range of numbers), and it gives you the items one at a time. Each time, it puts the current item into a variable — like a sticky note saying "this is the one we're on now" — and does the indented stuff with it.`,
    py`When the list is finished, the loop is finished. That's why \`for\` loops basically never get stuck forever the way a \`while\` loop can.`,
  ],
  analogy: {
    title: 'The sushi conveyor belt',
    body: [
      py`At a conveyor-belt sushi restaurant, plates glide past one at a time. You don't fetch them — the belt **brings you the next one**. You do the same thing with each plate (look, maybe eat), and when the last plate has passed, you're done.`,
      py`Want to count the plates as they pass? Stick numbered tickets on them (\`enumerate\`). Two belts running side by side, one with sushi and one with drinks? Take one from each at the same time (\`zip\`). And never grab plates **off the belt** or add new ones while it's moving past you — you'll lose track of which one comes next.`,
    ],
    mapping: [
      ['the conveyor belt', 'an iterable (list, string, dict, range…)'],
      ['the plate in front of you', 'the loop variable for this iteration'],
      ['what you do with each plate', 'the loop body'],
      ['the belt running out', 'the loop ending on its own'],
      ['numbered tickets on the plates', 'enumerate(items, start=1)'],
      ['two belts side by side', 'zip(sushi, drinks)'],
      ['grabbing plates off a moving belt', 'modifying a list while looping over it — items get skipped'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch the loop variable move from item to item',
    props: {
      code: py`scores = [72, 95, 88]
total = 0
for score in scores:
    total += score
print("total:", total)

for number, letter in enumerate("hey", start=1):
    print(number, letter)
`,
      notes: {
        3: 'Each time this line runs, Python takes the **next item** from the list and re-binds `score` to it: 72, then 95, then 88.',
        4: 'The body uses whatever `score` points to right now. `total` is an accumulator.',
        5: 'The list ran out of items, so the loop ended by itself. Note `score` still exists and holds the last item, 88.',
        7: '`enumerate` hands out pairs like `(1, "h")`. Writing two names before `in` unpacks each pair.',
      },
    },
    alt: 'A step-by-step trace. The loop variable score is bound to 72, then 95, then 88 while total grows to 72, 167 and 255, and "total: 255" is printed. Then enumerate over the string "hey" with start=1 binds number and letter to 1 and h, 2 and e, 3 and y, printing each pair.',
    caption: py`Step with ▶ and watch the arrow from \`score\` jump to a new object every iteration. The list itself never changes — the loop only reads it.`,
  },
  syntax: [
    py`#### The shape`,
    { code: py`for name in ["Ada", "Ben", "Cy"]:   # for <variable> in <iterable>:
    print("Hello,", name)            # body: runs once per item
print("Everyone greeted")            # after the loop`, lang: 'python', title: 'for variable in iterable:' },
    py`- The loop variable is an ordinary name, re-bound to each item in turn (just like \`name = item\`). Pick a **singular** noun for a **plural** collection: \`for song in songs\`, \`for line in lines\`.
- After the loop, the variable keeps the **last** item. If the iterable was empty, the body never runs and the variable is never created.
- Use \`_\` as the name when you don't need the item: \`for _ in range(3): print("hip hip hooray")\`.`,
    py`#### What you can loop over`,
    { code: py`for letter in "hi!":                    # str → each character
    print(letter)

for item in ("tea", "cake"):            # tuple → each item
    print(item)

prices = {"apple": 0.5, "bread": 1.25}
for product in prices:                  # dict → each KEY (in insertion order)
    print(product)
for product, price in prices.items():   # .items() → (key, value) pairs
    print(product, price)
for price in prices.values():           # .values() → each value
    print(price)`, lang: 'python', title: 'strings, tuples and dicts' },
    py`Dicts remember insertion order (guaranteed since Python 3.7), so you get keys in the order they were added. **Sets have no order** you can rely on — loop over \`sorted(my_set)\` when order matters.`,
    py`#### range(): counting without a list`,
    py`| call | produces | note |
|---|---|---|
| \`range(5)\` | 0, 1, 2, 3, 4 | starts at 0; **stop is excluded** |
| \`range(1, 6)\` | 1, 2, 3, 4, 5 | start included, stop excluded |
| \`range(0, 20, 5)\` | 0, 5, 10, 15 | step of 5 |
| \`range(10, 0, -3)\` | 10, 7, 4, 1 | negative step counts down |
| \`range(5, 1)\` | *(nothing)* | start ≥ stop with a positive step → empty |`,
    py`Why exclude the stop? So that \`range(n)\` gives exactly **n** numbers, and \`range(0, 5)\` + \`range(5, 10)\` join with no gap and no overlap. \`range\` arguments must be ints: \`range(2.5)\` raises \`TypeError\`.`,
    py`#### enumerate(): the position and the item`,
    { code: py`tasks = ["wash car", "buy milk", "call gran"]
for number, task in enumerate(tasks, start=1):
    print(f"{number}. {task}")
# 1. wash car
# 2. buy milk
# 3. call gran`, lang: 'python', title: 'enumerate(iterable, start=0)' },
    py`\`enumerate\` hands out \`(index, item)\` tuples, and \`number, task\` unpacks each one (see [tuples & unpacking](lesson:tuples-and-unpacking)). The default \`start\` is 0, which matches list indexes; use \`start=1\` for numbering people will read.`,
    py`#### zip(): several collections side by side`,
    { code: py`players = ["Ada", "Ben", "Cy"]
goals = [3, 1, 2]
for player, goal_count in zip(players, goals):
    print(player, "scored", goal_count)

# zip() stops at the SHORTEST input — silently
print(list(zip([1, 2, 3], ["a", "b"])))          # [(1, 'a'), (2, 'b')]

# Python 3.10+: strict=True raises instead of dropping data
# zip([1, 2, 3], ["a", "b"], strict=True)
#   → ValueError: zip() argument 2 is shorter than argument 1`, lang: 'python', title: 'zip(a, b, …)' },
    { callout: 'version', title: 'zip(strict=True) — Python 3.10+', text: py`\`strict=True\` (PEP 618) makes \`zip\` raise \`ValueError\` when the inputs have different lengths. Use it whenever the lists are *supposed* to match — names and scores, columns of a table — so a missing value becomes a loud error instead of silently lost data.` },
    py`#### reversed() and sorted()`,
    { code: py`for floor in reversed(range(1, 4)):    # 3, 2, 1
    print("Floor", floor)

for name in sorted(["Cy", "Ada", "Ben"]):   # Ada, Ben, Cy — a new sorted list
    print(name)`, lang: 'python', title: 'backwards and in order' },
    py`#### Nested loops`,
    py`A loop inside a loop runs the **whole inner loop** for **each** iteration of the outer one — handy for grids, tables and combinations:`,
    { code: py`for row in range(1, 4):
    for col in range(1, 4):
        print(row * col, end="\t")   # end="\t": a tab instead of a newline
    print()                          # newline after each row
# 1   2   3
# 2   4   6
# 3   6   9`, lang: 'python', title: 'a 3 × 3 times table' },
    py`The inner body runs rows × columns times (here 3 × 3 = 9). With big inputs that multiplies fast — keep it in mind.`,
    py`#### Don't change a list while looping over it`,
    py`Removing (or inserting) items in the list you're looping over shifts the remaining items under the loop's feet, so some get **skipped**. Build a new list instead, or loop over a copy:`,
    { code: py`readings = [12, -1, -3, 15]

# build a new list (best)
clean = []
for value in readings:
    if value >= 0:
        clean.append(value)
print(clean)              # [12, 15]

# or loop over a copy, and change the original
for value in readings.copy():
    if value < 0:
        readings.remove(value)
print(readings)           # [12, 15]`, lang: 'python', title: 'safe ways to filter' },
  ],
  walkthrough: {
    title: 'Reading the class report line by line',
    lang: 'python',
    code: CLASS_REPORT,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 3], text: py`Two **parallel lists**: \`scores[0]\` belongs to \`students[0]\`, and so on. Keeping them in step is exactly what \`zip\` is for.` },
      { lines: [6, 7], text: py`\`range(3, 0, -1)\` counts 3, 2, 1. The stop value \`0\` is **excluded**, and the negative step counts down.` },
      { lines: [11, 13], text: py`\`zip\` hands out pairs \`("Ada", 91)\`, \`("Ben", 78)\`… and \`name, score\` unpacks each one. \`strict=True\` (3.10+) would raise \`ValueError\` if the lists ever had different lengths. \`:<5\` and \`:>4\` pad the text into columns.` },
      { lines: [14], text: py`After the loop, \`total\` holds all four scores added up: 316 / 4 = \`79.0\`. Dividing with \`/\` always gives a float.` },
      { lines: [17, 18], text: py`\`enumerate(students, start=1)\` hands out \`(1, "Ada")\`, \`(2, "Ben")\`… No counter variable to create or increment.` },
      { lines: [21, 28], text: py`A loop with an [\`if\`/\`elif\`](lesson:if-statements) chain inside: each score adds 1 to exactly one band in the dict.` },
      { lines: [29, 30], text: py`\`.items()\` gives each key with its value, in insertion order. \`"#" * count\` repeats the string to draw a tiny bar chart.` },
    ],
  },
  playground: {
    title: 'Class report',
    objective: 'Change the counting, add a student, find the top scorer and reverse the seating — one loop tool per experiment.',
    files: { 'main.py': CLASS_REPORT },
    expected: py`\`\`\`text
3 ...
2 ...
1 ...
Ada    91
Ben    78
Cleo   85
Dev    62
Class average: 79.0
Seat 1: Ada
Seat 2: Ben
Seat 3: Cleo
Seat 4: Dev
90+       #
80-89     #
below 80  ##
\`\`\``,
    experiments: [
      {
        id: 'countdown-5',
        task: py`Make the countdown start at **5** (5, 4, 3, 2, 1). Predict: what would \`range(5, 0, -1)\` do differently from \`range(5, -1, -1)\`?`,
        hint: py`Only the first argument of \`range\` on line 6 needs to change. The stop (\`0\`) is excluded, which is why the count ends at 1.`,
        tests: [
          { name: 'the countdown goes 5, 4, 3, 2, 1', code: py`counts = [line for line in output.splitlines() if line.endswith(' ...')]
assert counts == ['5 ...', '4 ...', '3 ...', '2 ...', '1 ...']` },
        ],
        explain: py`\`range(5, 0, -1)\` starts at 5 and stops **before** 0. \`range(5, -1, -1)\` would include 0, because now the excluded stop is -1. "Stop is excluded" applies in both directions.`,
      },
      {
        id: 'new-student',
        task: py`First add \`"Eve"\` to \`students\` **only**, and run: read the error that \`strict=True\` raises. Then add her score, **99**, to \`scores\` too.`,
        hint: py`\`students = ["Ada", "Ben", "Cleo", "Dev", "Eve"]\` and \`scores = [91, 78, 85, 62, 99]\`. Every loop below picks her up automatically.`,
        tests: [
          { name: 'both lists have five entries', code: py`assert len(students) == len(scores) == 5, 'Add one name and one score'` },
          { name: 'Eve and her score are in the report', code: py`assert 'Eve' in output and '99' in output` },
        ],
        explain: py`With mismatched lists, \`zip(..., strict=True)\` raised \`ValueError: zip() argument 2 is shorter than argument 1\`. Without \`strict\`, zip would have silently stopped at the shorter list and Eve would just be missing from the report — a much harder bug to notice.`,
      },
      {
        id: 'top-student',
        task: py`Find the top scorer **inside the zip loop**, then after the class average print \`Top: Ada (91)\` (name and score of the highest score).`,
        hint: py`Before the loop: \`best_name = ""\` and \`best_score = -1\`. Inside: \`if score > best_score:\` update both. After the loop: \`print(f"Top: {best_name} ({best_score})")\`.`,
        tests: [
          { name: 'prints the top scorer as "Top: name (score)"', code: py`best_score, best_name = max(zip(scores, students))
assert f"Top: {best_name} ({best_score})" in output` },
        ],
        explain: py`A "best so far" variable is an accumulator that keeps the winner instead of a sum. Starting \`best_score\` at -1 guarantees the first real score replaces it. (In everyday code, \`max(zip(scores, students))\` does it in one line — tuples compare by their first item.)`,
      },
      {
        id: 'reverse-seats',
        task: py`Seat the class **in reverse order**, so the last student in the list gets Seat 1 — without changing the \`students\` list.`,
        hint: py`Wrap the list in \`reversed(...)\` inside \`enumerate\`: \`enumerate(reversed(students), start=1)\`.`,
        tests: [
          { name: 'the last student gets Seat 1', code: py`assert f"Seat 1: {students[-1]}" in output` },
          { name: 'the first student gets the last seat', code: py`assert f"Seat {len(students)}: {students[0]}" in output` },
          { name: 'the students list itself is unchanged', code: py`assert students[0] == "Ada", 'Use reversed() instead of reversing the list itself'` },
        ],
        explain: py`\`reversed()\` gives a lazy iterator that walks the list back to front **without copying or changing it**, and \`enumerate\` numbers whatever it's given. Helpers like these snap together: \`enumerate(reversed(...))\`, \`enumerate(zip(...))\`, \`zip(sorted(...), ...)\`.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What a for loop really does',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'iterable', label: '["Ada", "Ben"]', note: 'the iterable', x: 100, y: 70, tone: 'paper' },
        { id: 'iterator', label: 'iterator', note: 'remembers the position', x: 300, y: 70, tone: 'kraft' },
        { id: 'next', label: 'next item?', note: 'asked every round', x: 510, y: 70, tone: 'yellow' },
        { id: 'stop', label: 'no more items', note: 'leave the loop', x: 690, y: 190, tone: 'ink' },
        { id: 'var', label: 'name = "Ada"', note: 'loop variable re-bound', x: 510, y: 250, tone: 'blue' },
        { id: 'body', label: 'body', note: 'print("Hello,", name)', x: 300, y: 250, tone: 'blue' },
      ],
      edges: [
        { from: 'iterable', to: 'iterator', label: 'once: iter()' },
        { from: 'iterator', to: 'next' },
        { from: 'next', to: 'var', label: 'an item' },
        { from: 'var', to: 'body' },
        { id: 'again', from: 'body', to: 'next', label: 'go round', dashed: true },
        { from: 'next', to: 'stop', label: 'StopIteration' },
      ],
      steps: [
        { focus: ['iterable', 'iterator'], edges: ['iterable->iterator'], text: py`Once, at the start, \`for\` asks the iterable for an **iterator** (it calls \`iter(...)\`). The iterator is the thing that remembers "where we are".` },
        { focus: ['next', 'var'], edges: ['iterator->next', 'next->var'], text: py`Each round, \`for\` asks the iterator for the **next item** and binds the loop variable to it — exactly like an assignment \`name = "Ada"\`.` },
        { focus: ['body'], edges: ['var->body'], text: py`The body runs with that value. Changing \`name\` inside the body only re-binds the name; it **doesn't** change the list.` },
        { focus: ['next', 'var', 'body'], edges: ['again', 'next->var', 'var->body'], text: py`Go round: next item \`"Ben"\`, re-bind, run the body again.` },
        { focus: ['next', 'stop'], edges: ['next->stop'], text: py`When the iterator has nothing left, it signals \`StopIteration\`. The \`for\` statement catches that quietly and continues after the loop. You never see it — but it's why a \`for\` loop over a list always ends.` },
      ],
    },
    alt: 'Diagram of the for-loop protocol. The list ["Ada", "Ben"] is turned once into an iterator. The iterator is asked for the next item; each item is bound to the loop variable name, the body runs, and a dashed arrow goes back to ask for the next item. When no items remain, a StopIteration arrow leads to "no more items — leave the loop".',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`for\` loop is an assignment in disguise. Each iteration does \`loop_variable = next_item\`, then runs the body. That explains a classic surprise:`,
      { code: py`prices = [2, 3]
for price in prices:
    price *= 2          # re-binds the name price to a new int…
print(prices)           # [2, 3] — …the list is untouched`, lang: 'python', title: 're-binding the loop variable changes nothing' },
      py`To change a list's items, assign into the list by index (\`for i, price in enumerate(prices): prices[i] = price * 2\`) — or, better, build a new list ([comprehensions](lesson:comprehensions) make that a one-liner).`,
      py`The loop variable is not private to the loop: it's a normal variable in the surrounding code, and it keeps its last value afterwards.`,
    ],
    technical: [
      py`**The iteration protocol** (a language guarantee): \`for x in obj\` calls \`iter(obj)\` once to get an *iterator*, then calls \`next()\` on it before each iteration. When \`next()\` raises \`StopIteration\`, the loop ends. Anything implementing this protocol works in a \`for\` loop. The equivalent \`while\` loop looks like this:`,
      { code: py`songs = ["Intro", "Anthem"]
iterator = iter(songs)
while True:
    try:
        song = next(iterator)
    except StopIteration:
        break
    print("Now playing:", song)`, lang: 'python', title: 'roughly what for does for you' },
      py`**\`range\` is lazy.** It stores only start, stop and step and computes each number on demand, so \`range(1_000_000)\` uses the same small amount of memory as \`range(3)\`. It's a full *sequence*: \`len(r)\`, \`r[3]\` and \`49 in r\` all work (CPython answers \`in\` for ints arithmetically instead of searching — an implementation detail).`,
      py`**\`enumerate\`, \`zip\` and \`reversed\` return iterators**, not lists. They produce items on demand and are **used up** after one pass: \`z = zip(a, b); list(z); list(z)\` gives \`[]\` the second time. Wrap them in \`list()\` if you need to reuse or print the result.`,
      py`**Why removing items skips some.** A list's iterator keeps an index: "next time, give item 2". Removing an earlier item shifts everything left, so the item that slid into the current position is never visited. Dicts and sets detect a size change during iteration and raise \`RuntimeError: dictionary changed size during iteration\` instead of silently misbehaving.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython runs every \`for\` loop with a \`GET_ITER\` instruction followed by a \`FOR_ITER\` instruction per iteration, which calls the iterator's C-level "next" function. For built-in types like \`list\` and \`range\`, that function is written in C, which is one reason \`for\` loops over them are cheaper than hand-written \`while\` index loops. Other implementations differ; measure with \`timeit\` if it matters.` },
    ],
    production: [
      py`**Reach for built-ins first.** \`sum(scores)\`, \`max(scores)\`, \`min\`, \`sorted\`, \`any\` and \`all\` replace many hand-written loops, are clearer, and in CPython run their loop in C. Use an explicit \`for\` when the body does real work or several things at once.`,
      py`**Beware nested loops on large data.** A loop inside a loop does \`n × m\` steps; comparing two lists of 100,000 items that way means 10 billion comparisons. Converting one list to a [set](lesson:sets) or [dict](lesson:dictionaries) turns the inner search into a fast lookup — see [performance](lesson:performance).`,
      py`**Use \`zip(strict=True)\` (3.10+) in data code.** Parallel lists from different sources (CSV columns, API fields) drift out of sync; \`strict=True\` turns silent data loss into an immediate, debuggable error.`,
      py`**Stream, don't load.** \`for line in file:\` reads one line at a time, so a 5 GB log file needs only one line's worth of memory. The same idea scales up with [generators](lesson:generators) and [itertools](lesson:itertools) (\`islice\`, \`chain\`, \`product\`, \`batched\` in 3.12+).`,
      py`**Never mutate what you're iterating.** Build a new list, loop over a copy (\`list(items)\`, \`items.copy()\`), or for dicts iterate over \`list(d)\` before deleting keys. Code reviewers flag \`remove\`/\`del\`/\`insert\` inside a loop over the same collection on sight.`,
    ],
  },
  mistakes: [
    {
      title: 'range(len(...)) just to get the items',
      wrong: { code: py`fruits = ["apple", "kiwi", "plum"]
for i in range(len(fruits)):
    print(i + 1, fruits[i])`, lang: 'python' },
      right: { code: py`fruits = ["apple", "kiwi", "plum"]
for number, fruit in enumerate(fruits, start=1):
    print(number, fruit)`, lang: 'python' },
      explanation: py`Indexing by hand works, but it's noisier and easier to get wrong (\`fruits[i + 1]\`, \`range(len(fruits) + 1)\`). Loop over the items directly, and use \`enumerate\` when you also need the position.`,
    },
    {
      title: 'Forgetting that range() excludes the stop value',
      wrong: { code: py`# print 1 to 10
for n in range(1, 10):
    print(n)          # stops at 9`, lang: 'python' },
      right: { code: py`# print 1 to 10
for n in range(1, 11):
    print(n)`, lang: 'python' },
      explanation: py`\`range(start, stop)\` includes \`start\` and excludes \`stop\`. To include a last value \`n\`, use \`range(..., n + 1)\`. Quick check: \`range(a, b)\` produces \`b - a\` numbers.`,
    },
    {
      title: 'Removing items from the list you are looping over',
      wrong: { code: py`playlist = ["intro", "ad", "ad", "song", "ad"]
for track in playlist:
    if track == "ad":
        playlist.remove(track)
print(playlist)   # ['intro', 'song', 'ad'] — an ad survived!`, lang: 'python' },
      right: { code: py`playlist = ["intro", "ad", "ad", "song", "ad"]
no_ads = []
for track in playlist:
    if track != "ad":
        no_ads.append(track)
print(no_ads)     # ['intro', 'song']`, lang: 'python' },
      explanation: py`Each \`remove\` shifts the remaining items one place left, so the loop skips the item right after every removal. Build a new list (or loop over \`playlist.copy()\`).`,
    },
    {
      title: 'Letting zip() silently drop data',
      wrong: { code: py`names = ["Ada", "Ben", "Cy"]
ages = [31, 25]                 # one age is missing
for name, age in zip(names, ages):
    print(name, age)            # Cy is silently skipped`, lang: 'python' },
      right: { code: py`names = ["Ada", "Ben", "Cy"]
ages = [31, 25, 40]
for name, age in zip(names, ages, strict=True):   # 3.10+
    print(name, age)`, lang: 'python' },
      explanation: py`Plain \`zip\` stops at the shortest input without complaint. When the inputs are supposed to line up, pass \`strict=True\` so a mismatch raises \`ValueError\` instead of quietly losing rows.`,
    },
    {
      title: 'Looping over a dict and expecting pairs',
      wrong: { code: py`stock = {"apples": 12, "pears": 0}
for fruit, count in stock:      # ValueError: too many values to unpack
    print(fruit, count)`, lang: 'python', static: true },
      right: { code: py`stock = {"apples": 12, "pears": 0}
for fruit, count in stock.items():
    print(fruit, count)`, lang: 'python' },
      explanation: py`Looping over a dict gives its **keys** only. Python then tries to unpack the string \`"apples"\` into two names and fails. Ask for \`.items()\` when you want key and value together.`,
    },
    {
      title: 'Expecting the loop variable to update the list',
      wrong: { code: py`names = ["ada", "ben"]
for name in names:
    name = name.title()
print(names)          # ['ada', 'ben'] — unchanged`, lang: 'python' },
      right: { code: py`names = ["ada", "ben"]
titled = []
for name in names:
    titled.append(name.title())
print(titled)         # ['Ada', 'Ben']`, lang: 'python' },
      explanation: py`The loop variable is just a name bound to each item; assigning to it re-binds the name and leaves the list alone. Build a new list, or assign into the list with an index from \`enumerate\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: 'int' object is not iterable`,
      cause: py`You wrote \`for i in 5:\` (or \`for i in len(items):\`). A number isn't a collection, so there's nothing to loop over.`,
      fix: py`Wrap it in \`range()\`: \`for i in range(5):\` — or loop over the collection itself instead of its length.`,
    },
    {
      symptom: py`ValueError: too many values to unpack (expected 2)`,
      cause: py`The loop has two names (\`for a, b in …\`) but each item isn't a pair. Most often: looping over a dict without \`.items()\`, so each key string gets unpacked letter by letter.`,
      fix: py`Use \`for key, value in d.items():\`. Print one item (\`print(next(iter(things)))\`) to see what shape you're really getting.`,
    },
    {
      symptom: py`ValueError: zip() argument 2 is shorter than argument 1`,
      cause: py`\`zip(..., strict=True)\` found that the inputs have different lengths — so the data really is misaligned.`,
      fix: py`Don't just remove \`strict=True\`. Find out why one list is short (a missing row, a skipped value) and fix the data or the code that built it.`,
    },
    {
      symptom: py`RuntimeError: dictionary changed size during iteration`,
      cause: py`You added or deleted dict keys while looping over that same dict.`,
      fix: py`Loop over a snapshot of the keys: \`for key in list(d):\`, or build a new dict with only the entries you want to keep.`,
    },
    {
      symptom: py`Some items are skipped, with no error.`,
      cause: py`The list was modified (\`remove\`, \`pop\`, \`del\`, \`insert\`) while being looped over.`,
      fix: py`Build a new list instead, or iterate over \`items.copy()\` while changing the original.`,
    },
    {
      symptom: py`TypeError: 'float' object cannot be interpreted as an integer`,
      cause: py`\`range()\` only accepts ints, and you passed a float — often the result of \`/\`, e.g. \`range(total / 2)\`.`,
      fix: py`Use integer division \`//\` (\`range(total // 2)\`) or convert with \`int()\`.`,
    },
  ],
  bestPractices: [
    'Loop over items directly: for song in songs — not for i in range(len(songs)).',
    'Use enumerate(items, start=1) when you need a position, and zip(a, b) to walk collections side by side.',
    'Pass strict=True to zip (3.10+) whenever the inputs are supposed to have the same length.',
    'Name loop variables as the singular of the collection: for line in lines, for user in users.',
    'Use .items() to loop over a dict\'s keys and values together.',
    'Never add or remove items in the collection you are looping over; build a new one instead.',
    'Prefer built-ins (sum, max, min, any, all, sorted) when they express the loop directly.',
  ],
  useCases: [
    'Totals, averages, counts and "best so far" over a list of numbers.',
    'Printing numbered menus, rankings and to-do lists with enumerate.',
    'Combining parallel data (names and scores, dates and readings) with zip.',
    'Processing every line of a file or every row of a CSV.',
    'Grids, boards and tables with nested loops.',
    'Repeating an action a fixed number of times with for _ in range(n).',
  ],
  comparison: {
    title: 'Which loop helper?',
    headers: ['you need…', 'write', 'each iteration gives'],
    rows: [
      ['each item', 'for item in items:', 'the item'],
      ['numbers in a range', 'for n in range(1, 11):', '1, 2, … 10'],
      ['position and item', 'for i, item in enumerate(items, start=1):', '(1, first), (2, second), …'],
      ['items from two lists together', 'for a, b in zip(xs, ys, strict=True):', '(xs[0], ys[0]), (xs[1], ys[1]), …'],
      ['dict keys and values', 'for key, value in d.items():', '(key, value)'],
      ['items back to front', 'for item in reversed(items):', 'last item first'],
      ['items in sorted order', 'for item in sorted(items):', 'smallest first (a new list)'],
    ],
    note: py`They combine freely: \`enumerate(zip(names, scores), start=1)\` gives \`(1, ("Ada", 91))\`, unpacked with \`for rank, (name, score) in …\`.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'for-loops-q1',
      type: 'mcq',
      prompt: py`Which numbers does \`range(2, 10, 3)\` produce?`,
      options: [
        '2, 5, 8',
        { text: '2, 5, 8, 11', why: '11 is past the stop value 10. range never reaches or passes stop.' },
        { text: '3, 6, 9', why: 'range starts at start (2), not at the step.' },
        { text: '2, 5, 8, 10', why: 'range only produces start + k × step; it never adds the stop value on the end.' },
      ],
      answer: 0,
      explanation: py`Start at 2, add 3 each time, and stop **before** reaching 10: 2, 5, 8. The next value, 11, would be past the stop.`,
    },
    {
      id: 'for-loops-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`word = "loop"
result = ""
for letter in word:
    result = letter + result
print(result)`,
      answer: 'pool',
      accept: ['pool', '"pool"', "'pool'"],
      explanation: py`Looping over a string gives one character at a time. Each letter is put **in front** of what's been built so far: \`"l"\`, \`"ol"\`, \`"ool"\`, \`"pool"\`. (The idiomatic way to reverse a string is \`word[::-1]\`.)`,
    },
    {
      id: 'for-loops-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`names = ["Ada", "Ben", "Cy"]
ages = [31, 25]
for name, age in zip(names, ages):
    print(name, age)`,
      options: [
        'Ada 31, then Ben 25 (two lines)',
        { text: 'Ada 31, Ben 25, then Cy None', why: 'zip never invents missing values. (itertools.zip_longest does, with a fill value.)' },
        { text: 'ValueError: zip() argument 2 is shorter than argument 1', why: 'That error only happens with strict=True (Python 3.10+). Plain zip stops quietly.' },
        { text: 'IndexError: list index out of range', why: 'zip never indexes past the end; it simply stops when the shortest input runs out.' },
      ],
      answer: 0,
      explanation: py`\`zip\` stops as soon as **any** input runs out, so \`"Cy"\` is silently dropped. Pass \`strict=True\` to turn that into an error when the lists should match.`,
    },
    {
      id: 'for-loops-q4',
      type: 'bug',
      prompt: 'This is meant to remove every "ad" from the playlist, but it prints `[\'intro\', \'song\', \'ad\']`. Click a line that causes the bug.',
      code: py`playlist = ["intro", "ad", "ad", "song", "ad"]
for track in playlist:
    if track == "ad":
        playlist.remove(track)
print(playlist)`,
      answerLine: [2, 4],
      explanation: py`The loop iterates over \`playlist\` (line 2) while line 4 removes items from that same list. Each removal shifts the rest left, so the item after a removed one is skipped. Build a new list of the tracks you want to keep instead.`,
    },
    {
      id: 'for-loops-q5',
      type: 'fill',
      prompt: 'Complete the loop so it prints `1 Ada`, `2 Ben`, `3 Cy` on separate lines.',
      code: py`podium = ["Ada", "Ben", "Cy"]
for place, name in ___(podium, start=___):
    print(place, name)`,
      answer: [['enumerate'], ['1']],
      explanation: py`\`enumerate\` pairs each item with a counter, and \`start=1\` makes the counter begin at 1 instead of the default 0.`,
    },
    {
      id: 'for-loops-q6',
      type: 'mcq',
      prompt: py`\`prices = {"apple": 0.5, "bread": 1.25}\`. What does \`for x in prices:\` bind \`x\` to?`,
      options: [
        { text: 'Each (key, value) pair', why: 'That is what prices.items() gives you. Iterating the dict directly gives keys only.' },
        'Each key: "apple", then "bread"',
        { text: 'Each value: 0.5, then 1.25', why: 'Use prices.values() for that.' },
        { text: 'The keys, but in an unpredictable order', why: 'Since Python 3.7, dicts guarantee insertion order, so you get "apple" then "bread".' },
      ],
      answer: 1,
      explanation: py`Iterating a dict yields its **keys**, in insertion order. Use \`.values()\` for values and \`.items()\` for \`(key, value)\` pairs.`,
    },
    {
      id: 'for-loops-q7',
      type: 'short',
      prompt: 'Why is it a bad idea to remove items from a list while a for loop is iterating over it, and what should you do instead?',
      answer: py`The list's iterator walks forward by position. Removing an item shifts every later item one place to the left, so the item that moves into the current position is never visited — items get skipped with no error. Instead, build a new list containing only the items you want (or use a comprehension), or loop over a copy (items.copy()) and remove from the original.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'receipt',
      title: 'Print a receipt',
      difficulty: 'beginner',
      prompt: py`Complete \`receipt(items, prices, quantities)\`. It receives three parallel lists and **returns a list of strings** (the lines of the receipt):

- one line per item, numbered from **1**: \`"1. apples x3 = 1.50"\` — number, item name, \`x\` + quantity, and the line total (price × quantity) with **2 decimals**;
- a last line with the grand total: \`"Total: 4.00"\`.

Example:

\`\`\`python
receipt(["apples", "bread"], [0.5, 1.25], [3, 2])
# ['1. apples x3 = 1.50', '2. bread x2 = 2.50', 'Total: 4.00']
\`\`\`

If the three lists have **different lengths**, the function must raise \`ValueError\` — \`zip(..., strict=True)\` does this for you. Empty lists give \`['Total: 0.00']\`.`,
      files: {
        'main.py': py`def receipt(items, prices, quantities):
    lines = []
    total = 0
    # TODO: loop over the three lists together, numbering the lines from 1
    lines.append(f"Total: {total:.2f}")
    return lines


for line in receipt(["apples", "bread"], [0.5, 1.25], [3, 2]):
    print(line)
`,
      },
      hints: [
        'zip(items, prices, quantities, strict=True) gives one (item, price, quantity) tuple per iteration. You also need a number — that\'s enumerate.',
        'Combine them: for number, (item, price, qty) in enumerate(zip(items, prices, quantities, strict=True), start=1): — the brackets unpack the tuple that zip produced.',
        'Inside the loop: line_total = price * qty, add it to total, and lines.append(f"{number}. {item} x{qty} = {line_total:.2f}").',
      ],
      solution: {
        explanation: py`\`zip(..., strict=True)\` walks the three lists in step and raises \`ValueError\` if they don't line up — so no row is ever silently dropped. Wrapping it in \`enumerate(..., start=1)\` adds the line number, giving items shaped like \`(1, ("apples", 0.5, 3))\`, which \`number, (item, price, qty)\` unpacks in one go. The accumulator \`total\` collects each line total, and \`:.2f\` formats money with two decimals. Note the total line is appended **after** the loop, so it's always last — even for empty lists, when the loop body runs zero times.`,
        files: {
          'main.py': py`def receipt(items, prices, quantities):
    lines = []
    total = 0
    rows = zip(items, prices, quantities, strict=True)
    for number, (item, price, qty) in enumerate(rows, start=1):
        line_total = price * qty
        total += line_total
        lines.append(f"{number}. {item} x{qty} = {line_total:.2f}")
    lines.append(f"Total: {total:.2f}")
    return lines


for line in receipt(["apples", "bread"], [0.5, 1.25], [3, 2]):
    print(line)
`,
        },
      },
      tests: [
        { name: 'two items give two numbered lines and a total', code: py`assert receipt(["apples", "bread"], [0.5, 1.25], [3, 2]) == ["1. apples x3 = 1.50", "2. bread x2 = 2.50", "Total: 4.00"]` },
        { name: 'numbering continues past 2', code: py`lines = receipt(["tea", "milk", "eggs"], [2.0, 0.95, 0.25], [1, 2, 12])
assert lines[2] == "3. eggs x12 = 3.00" and lines[-1] == "Total: 6.90"` },
        { name: 'empty lists give only the total line', code: py`assert receipt([], [], []) == ["Total: 0.00"]` },
        { name: 'mismatched lists raise ValueError', code: py`with raises(ValueError):
    receipt(["apples", "bread"], [0.5], [3, 2])` },
      ],
    },
    {
      id: 'clean-readings',
      title: 'Clean the sensor data',
      difficulty: 'beginner',
      prompt: py`A temperature sensor sometimes reports a negative number when it glitches. \`clean_readings(readings)\` should **return a new list** with only the readings that are **0 or more**, in their original order.

It must **not change** the list it was given — other parts of the program still need the raw data.

The starter code removes items from the list while looping over it. Run it: some negative readings survive, and the original list gets changed. Fix it.`,
      files: {
        'main.py': py`def clean_readings(readings):
    for value in readings:
        if value < 0:
            readings.remove(value)
    return readings


raw = [12, -1, -3, 15, -2, 20]
print(clean_readings(raw))   # expect [12, 15, 20]
print(raw)                   # expect the raw data, unchanged
`,
      },
      hints: [
        'Two problems, one cause: the function changes the list it is looping over. Leave readings alone.',
        'Create an empty list before the loop, append the values you want to keep, and return the new list.',
        'clean = []\nfor value in readings:\n    if value >= 0:\n        clean.append(value)\nreturn clean',
      ],
      solution: {
        explanation: py`The fix never touches \`readings\`: it builds a separate list \`clean\` and appends only what passes the test. Because nothing is removed from the list being iterated, no item is skipped (the starter skipped \`-3\` because removing \`-1\` slid \`-3\` into the position the loop had just finished). And because the caller's list is never modified, \`raw\` keeps its original data. Later you'll write the same thing as a one-line [list comprehension](lesson:comprehensions): \`[v for v in readings if v >= 0]\`.`,
        files: {
          'main.py': py`def clean_readings(readings):
    clean = []
    for value in readings:
        if value >= 0:
            clean.append(value)
    return clean


raw = [12, -1, -3, 15, -2, 20]
print(clean_readings(raw))   # expect [12, 15, 20]
print(raw)                   # expect the raw data, unchanged
`,
        },
      },
      tests: [
        { name: 'consecutive negatives are all removed', code: py`assert clean_readings([12, -1, -3, 15, -2, 20]) == [12, 15, 20]` },
        { name: 'the original list is not changed', code: py`data = [5, -1, 7]
clean_readings(data)
assert data == [5, -1, 7]` },
        { name: 'zero is a valid reading', code: py`assert clean_readings([0, -5, 3]) == [0, 3]` },
        { name: 'all negative → empty list', code: py`assert clean_readings([-1, -2, -3]) == []` },
        { name: 'returns a new list object', code: py`data = [1, 2]
assert clean_readings(data) is not data` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'for-loops-for-each',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How is Python\'s for loop different from the classic C-style for (i = 0; i < n; i++) loop?',
      answer: 'Python\'s for is a "for each" loop: it iterates directly over the items of any iterable, re-binding the loop variable to each item, and ends when the iterable is exhausted. There is no built-in counter; use range() to count, enumerate() for an index and zip() to walk several sequences together.',
      explanation: py`C-style loops expose the mechanics (initialise, test, increment). Python hides them behind the iteration protocol, so the same loop works for lists, strings, dicts, files, generators and custom objects. Counting is just iterating over a \`range\` object.`,
      code: { lang: 'python', code: py`songs = ["Intro", "Anthem", "Outro"]
for song in songs:                              # the items themselves
    print(song)
for track, song in enumerate(songs, start=1):   # when you need a position
    print(track, song)` },
      whyAsked: 'Candidates coming from other languages often write range(len(...)) everywhere; interviewers check that you think in iterables.',
      mistakes: ['Saying Python for loops "need range"', 'Not knowing that dicts, files and strings are iterable', 'Describing enumerate as a way to get the "index variable" without explaining it pairs index and item'],
      followUps: ['What makes an object iterable?', 'Write the while-loop equivalent of a for loop.', 'What happens to the loop variable after the loop ends?'],
      modelAnswer: 'Python’s for loop is a for-each loop. Instead of managing a counter, it asks an iterable — a list, string, dict, file, range, or any object that supports iteration — for its items one at a time, binds the loop variable to each one, and stops when the items run out. So there’s no initialise-test-increment to get wrong. When I do need a number, I use range to count, enumerate to get the position alongside each item, and zip to walk several sequences in step. Writing range(len(items)) just to index back into the list is usually a sign the code could be simpler.',
    },
    {
      id: 'for-loops-range-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`total = 0
for i in range(1, 10, 2):
    total += i
print(total, i)` },
      options: ['25 9', '25 10', '45 9', '20 7'],
      correctOption: 0,
      answer: '`25 9` — range(1, 10, 2) gives 1, 3, 5, 7, 9 (sum 25), and the loop variable i keeps its last value, 9, after the loop.',
      explanation: py`The stop value 10 is excluded, and odd steps from 1 never land on it anyway. The second number tests whether you know the loop variable **outlives** the loop in Python (there's no block scope) — and holds the last item, not "one past the end" as a C counter would.`,
      whyAsked: 'Combines range semantics with Python\'s scoping rules in one quick check.',
      mistakes: ['Including the stop value', 'Answering 10 or 11 for i, as a C-style counter would end', 'Thinking i is undefined after the loop'],
      followUps: ['What would i be if the range were empty?', 'Does a list comprehension leak its variable the same way? (No — comprehensions have their own scope in Python 3.)'],
      modelAnswer: 'It prints 25 9. range(1, 10, 2) starts at 1, steps by 2 and stops before 10, so it yields 1, 3, 5, 7 and 9, which sum to 25. Python has no block scope, so i still exists after the loop and holds the last value it was bound to, 9 — not one past the end like a C counter. If the range had been empty, the body would never run and i wouldn’t be defined at all.',
    },
    {
      id: 'for-loops-dict-mutation',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This code crashes with "RuntimeError: dictionary changed size during iteration". Why, and how do you fix it?',
      code: { lang: 'python', code: py`stock = {"apples": 12, "pears": 0, "plums": 0}
for fruit in stock:
    if stock[fruit] == 0:
        del stock[fruit]` },
      answer: 'Deleting keys from a dict while iterating over it is not allowed — the dict detects its size changed and raises. Iterate over a snapshot (for fruit in list(stock):) or build a new dict with only the entries to keep.',
      explanation: py`A dict iterator walks the internal table; if keys are added or removed mid-iteration, its position becomes meaningless, so Python raises \`RuntimeError\` rather than skip or repeat keys. Lists don't have this check — they silently skip items instead, which is worse. Building a new dict (\`{k: v for k, v in stock.items() if v > 0}\`) is usually the cleanest fix and avoids mutating shared data.`,
      whyAsked: 'Mutating a collection during iteration is one of the most common real-world loop bugs; the fix shows whether you understand iteration rather than memorising a workaround.',
      mistakes: ['Wrapping it in try/except to ignore the error', 'Saying "dicts are unordered" as the reason', 'Fixing the dict case but not knowing that lists silently skip items'],
      followUps: ['What happens if you do the same with a list?', 'Can you change the values (not the keys) while iterating? (Yes — the size does not change.)', 'Write the dict-comprehension version.'],
      modelAnswer: 'You can’t add or remove keys from a dict while you’re iterating over it — the iterator would lose its place, so Python detects the size change and raises RuntimeError. The fix is to iterate over a snapshot of the keys, for fruit in list(stock), and delete from the original, or — usually cleaner — build a new dict with a comprehension that keeps only the items with a positive count. Updating values for existing keys is fine, because the size doesn’t change. Lists are the sneaky case: they don’t raise, they just skip items, so I apply the same rule there.',
    },
    {
      id: 'for-loops-hamming',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'Write `hamming_distance(a, b)`: the number of positions at which two equal-length strings differ. If the lengths differ, raise ValueError.',
      answer: 'Walk both strings together with zip(a, b, strict=True), count the pairs whose characters differ, and let strict=True raise ValueError for unequal lengths.',
      explanation: py`\`zip\` pairs up characters position by position, so no indexes are needed. \`strict=True\` (3.10+) both validates the lengths and documents the assumption. A compact version is \`sum(x != y for x, y in zip(a, b, strict=True))\`, which works because \`True\` counts as 1.`,
      starter: { files: { 'main.py': py`def hamming_distance(a, b):
    # TODO: count the positions where a and b differ
    return 0


print(hamming_distance("karolin", "kathrin"))   # expect 3
` } },
      tests: [
        { name: '"karolin" vs "kathrin" → 3', code: py`assert hamming_distance("karolin", "kathrin") == 3` },
        { name: 'identical strings → 0', code: py`assert hamming_distance("GATTACA", "GATTACA") == 0` },
        { name: 'every position differs', code: py`assert hamming_distance("abc", "xyz") == 3` },
        { name: 'different lengths raise ValueError', code: py`with raises(ValueError):
    hamming_distance("ab", "abc")` },
      ],
      solution: { files: { 'main.py': py`def hamming_distance(a, b):
    differences = 0
    for x, y in zip(a, b, strict=True):
        if x != y:
            differences += 1
    return differences


print(hamming_distance("karolin", "kathrin"))   # expect 3
` } },
      hints: ['zip(a, b) gives pairs of characters at the same position.', 'strict=True makes zip raise ValueError when the lengths differ — exactly what the spec asks for.'],
      whyAsked: 'A small problem that rewards idiomatic iteration (zip over indexes) and careful handling of the edge case.',
      mistakes: ['Using range(len(a)) and crashing with IndexError when b is shorter', 'Plain zip without strict, silently ignoring the extra characters', 'Checking lengths only after counting'],
      followUps: ['How would you do it in one line? (sum with a generator expression)', 'How would you support Python versions before 3.10? (compare len(a) and len(b) first)'],
      modelAnswer: 'I’d iterate over both strings in parallel with zip, so each step gives me the two characters at the same position, and count the pairs that differ. Passing strict=True, which is available from Python 3.10, makes zip raise ValueError if one string is longer — exactly the required behaviour, without a separate length check. Without strict, zip would silently stop at the shorter string and return a wrong answer. In one line it’s sum of x != y over the zipped pairs, since True counts as 1.',
    },
    {
      id: 'for-loops-index-styles',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `for i in range(len(items))`, `for item in items`, `for i, item in enumerate(items)` and `zip(items, others)`. When is each appropriate?',
      answer: 'Iterate items directly by default; add enumerate when you also need the position; use zip to walk several sequences in step. range(len(...)) is rarely needed — mainly when you must index into several positions at once (items[i] and items[i + 1]) or assign back by index.',
      explanation: py`Direct iteration is shortest and works for any iterable (including ones with no indexes, like sets, files and generators). \`enumerate\` gives the index without manual counting. \`zip\` replaces parallel indexing. Index loops are for algorithms that genuinely need positions — comparing neighbours, swapping, writing back — and even then \`zip(items, items[1:])\` or \`enumerate\` often reads better.`,
      code: { lang: 'python', code: py`temps = [18, 21, 19, 24]
for earlier, later in zip(temps, temps[1:]):     # neighbours, no indexes
    print("up" if later > earlier else "down")` },
      whyAsked: 'Idiomatic iteration is a quick signal of Python fluency in code reviews and live coding.',
      mistakes: ['Using range(len()) by default', 'Calling enumerate and ignoring the index', 'Forgetting that zip truncates to the shortest input'],
      followUps: ['How do you compare each element with the next one without indexes?', 'Which of these work on a set or a generator?'],
      modelAnswer: 'My default is iterating the items directly — it’s the clearest and works for any iterable, even ones without indexes like sets or generators. When I also need the position, say for numbering output or writing back, I use enumerate, optionally with start=1. When I need items from two sequences together, zip, with strict=True if they must be the same length. A range(len()) loop is the last resort, for algorithms that genuinely need positions; even neighbour comparisons can usually be written as zip(items, items[1:]).',
    },
    {
      id: 'for-loops-nested-performance',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A nightly job finds which of 200,000 customer emails appear in a list of 50,000 unsubscribed emails, using two nested for loops. It has become very slow. What is happening and what would you change?',
      answer: 'Nested loops do one comparison per pair — about 200,000 × 50,000 = 10 billion — so the work grows with the product of the sizes. Put the unsubscribed emails in a set and loop once over the customers, checking membership with in, which is an average constant-time hash lookup.',
      explanation: py`\`email in some_list\` scans the list item by item, so it's itself a hidden inner loop. A [set](lesson:sets) (or dict) hashes the email to find it directly, so the job becomes one pass over each list. Normalise emails (\`.strip().lower()\`) when building the set so matching is reliable. Measure before and after with \`time.perf_counter()\` rather than guessing.`,
      code: { lang: 'python', code: py`customers = ["ada@example.com", "ben@example.com", "cy@example.com"]
unsubscribed = ["BEN@example.com "]

blocked = {email.strip().lower() for email in unsubscribed}   # build once
for email in customers:
    if email.strip().lower() in blocked:                      # fast lookup
        print("skip", email)` },
      whyAsked: 'It tests whether you can see the cost of nested loops and know the standard fix — a core skill for data-processing code.',
      mistakes: ['Suggesting threads or a faster machine first', 'Not noticing that "in list" is itself a loop', 'Forgetting to normalise the keys'],
      followUps: ['What is the Big-O before and after?', 'When would a set not help? (unhashable items, or very small inputs)', 'How would you do this if the lists did not fit in memory?'],
      modelAnswer: 'With nested loops, every customer is compared with every unsubscribed address, so the work is the product of the two sizes — billions of comparisons here — and it grows quadratically as the lists grow. Even "email in unsubscribed_list" hides the same inner loop. I’d build a set of normalised unsubscribed emails once and then loop over the customers a single time, checking membership in the set, which is an average constant-time hash lookup. That makes it linear in the total size. I’d confirm the improvement with a timer rather than guessing.',
    },
    {
      id: 'for-loops-protocol',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Explain exactly what `for x in obj:` does at runtime, and write the equivalent code using while.',
      answer: 'It calls iter(obj) once to get an iterator, then repeatedly calls next() on it, binding x to each result and running the body; when next() raises StopIteration, the loop ends (running the else clause, if any). iter() uses __iter__, falling back to the old __getitem__ protocol with indexes 0, 1, 2… until IndexError.',
      explanation: py`This protocol is why one \`for\` statement works for lists, files, dicts, generators and your own classes: they just need \`__iter__\` returning an object with \`__next__\`. It also explains why iterators are single-use (they keep their position) while iterables like lists can be looped over again (each \`iter()\` call makes a fresh iterator). See [iterators](lesson:iterators).`,
      code: { lang: 'python', code: py`songs = ["Intro", "Anthem"]

# for song in songs: print(song)   is roughly:
_it = iter(songs)
while True:
    try:
        song = next(_it)
    except StopIteration:
        break
    print(song)` },
      whyAsked: 'It reveals whether you understand the iteration protocol that underlies generators, comprehensions, unpacking and much of the standard library.',
      mistakes: ['Saying for uses indexes internally', 'Confusing iterables with iterators', 'Wrapping the whole body (not just next()) in the try block, which would swallow StopIteration raised by the body'],
      followUps: ['Why can you loop over a list twice but not over a zip object?', 'What is the legacy __getitem__ iteration fallback?', 'Why does a generator raising StopIteration inside its body become a RuntimeError (PEP 479)?'],
      modelAnswer: 'A for loop first calls iter on the object, which uses its __iter__ method to get an iterator — an object that remembers its position. Then before every iteration it calls next on that iterator, binds the loop variable to the result and runs the body. When next raises StopIteration, the loop ends quietly. As a while loop, that’s iter once, then while True with next inside a try, and break on StopIteration — with only the next call inside the try, so errors from the body aren’t swallowed. That protocol is why lists, files, generators and custom classes all work with the same syntax, and why iterators are single-use while lists can be looped repeatedly.',
    },
  ],

  takeaways: [
    'for item in iterable runs the body once per item, re-binding the loop variable each time, and ends when the items run out.',
    'range(start, stop, step) counts lazily; the stop value is always excluded, so range(n) gives exactly n numbers.',
    'enumerate(items, start=1) gives (position, item) pairs; zip(a, b) walks collections in step.',
    'zip stops at the shortest input — use strict=True (3.10+) when the lengths must match.',
    'Looping over a dict gives keys; use .items() for key and value together.',
    'Never add or remove items in the list you\'re looping over — build a new list or loop over a copy.',
    'Re-binding the loop variable doesn\'t change the collection; nested loops multiply the work.',
  ],
}
