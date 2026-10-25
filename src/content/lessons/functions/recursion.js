// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const FOLDER_TREE = py`project = {
    "README.md": 4,
    "src": {
        "main.py": 12,
        "utils": {"helpers.py": 7, "math.py": 5},
    },
    "docs": {"guide.md": 9},
}


def total_size(item):
    """Return the size of a file (an int) or a whole folder (a dict)."""
    if isinstance(item, int):              # base case: a file
        return item
    total = 0
    for child in item.values():            # recursive case: a folder
        total += total_size(child)
    return total


def show_tree(folder, depth=0):
    """Print every name in folder, indented by how deep it is."""
    for name, item in folder.items():
        print("    " * depth + name)
        if isinstance(item, dict):
            show_tree(item, depth + 1)


show_tree(project)
print("total size:", total_size(project))
`

export default {
  id: 'recursion',
  title: 'Recursion & the call stack',
  summary: 'A recursive function solves a problem by calling itself on a smaller piece of it until it reaches a base case — perfect for nested data like folders and JSON, as long as you respect the call stack\'s limits.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['defining-functions', 'scope', 'lists', 'dictionaries'],
  related: ['functools', 'closures', 'json-data', 'pathlib', 'generators', 'performance', 'optimization-techniques', 'coding-patterns', 'try-except'],
  tags: ['recursion', 'recursive function', 'base case', 'recursive case', 'call stack', 'stack frames', 'RecursionError', 'recursion limit', 'sys.getrecursionlimit', 'tail call', 'iteration', 'nested data', 'trees', 'JSON', 'memoization', 'lru_cache', 'fibonacci', 'factorial'],
  apis: [
    { name: 'sys.getrecursionlimit()', summary: 'The maximum depth of the Python call stack before RecursionError is raised (a CPython safety limit, usually 1000).' },
    { name: 'sys.setrecursionlimit(n)', summary: 'Changes that limit. Raising it a lot can exhaust the real C stack and crash the process instead.' },
    { name: 'RecursionError', summary: 'Raised when the maximum recursion depth is exceeded. A subclass of RuntimeError.' },
    { name: 'isinstance(obj, cls)', summary: 'True if obj is an instance of cls (or of a tuple of classes) — the usual way to tell a "leaf" from a "branch" in nested data.' },
    { name: '@functools.cache', summary: 'Memoizes a function: remembers the result for each argument so repeated sub-problems are computed once (3.9+; lru_cache for older versions or a size limit).' },
  ],
  docs: [
    { label: 'sys.getrecursionlimit()', url: 'https://docs.python.org/3/library/sys.html#sys.getrecursionlimit' },
    { label: 'sys.setrecursionlimit()', url: 'https://docs.python.org/3/library/sys.html#sys.setrecursionlimit' },
    { label: 'Built-in exceptions — RecursionError', url: 'https://docs.python.org/3/library/exceptions.html#RecursionError' },
    { label: 'functools.cache and lru_cache', url: 'https://docs.python.org/3/library/functools.html#functools.cache' },
    { label: 'Python tutorial — defining functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **recursive function** is a function that calls *itself*. That sounds like an infinite loop waiting to happen — and it is, unless the function follows two rules:`,
    py`1. a **base case**: an input simple enough to answer directly, with no further call;
2. a **recursive case**: for anything bigger, solve a *smaller* version of the same problem by calling yourself, then use that answer.`,
    { code: py`def factorial(n):
    if n <= 1:                     # base case: 1! and 0! are 1
        return 1
    return n * factorial(n - 1)    # recursive case: n! = n × (n-1)!


print(factorial(5))                # 120`, lang: 'python', title: 'the classic example' },
    py`Each call gets its own frame on the **call stack** (see [defining functions](lesson:defining-functions)), with its own \`n\`. The stack grows as calls go *down* towards the base case, then **unwinds** as each call returns its answer to the one that called it.`,
    py`Recursion shines on **nested data** — folders inside folders, comments with replies, JSON objects containing lists of objects — where the shape of the data is itself recursive. It has a cost: Python limits how deep the stack can go, and it doesn't optimise recursion away. Knowing when to recurse and when to loop is part of the craft.`,
  ],
  why: [
    py`**Some problems are recursive by nature.** "The size of a folder is the sum of the sizes of everything inside it — and some of those things are folders." Writing that as a recursive function is a near word-for-word translation; a loop version needs extra bookkeeping.`,
    py`**Nested data is everywhere.** JSON from web APIs, file systems, HTML documents, organisation charts, menus with sub-menus, game trees, the syntax tree Python builds from your code. Walking them is recursion's home turf.`,
    py`**Divide and conquer.** Many efficient algorithms — merge sort, quicksort, binary search, many [coding-interview patterns](lesson:coding-patterns) — split a problem into smaller copies of itself.`,
    py`**Understanding the call stack** through recursion makes tracebacks, \`RecursionError\` and even [exception propagation](lesson:try-except) much easier to reason about.`,
  ],
  eli15: [
    py`Imagine you're in a long queue for a concert and want to know your position, but you can only talk to the person in front of you. You ask them "*what's your position?*". They don't know either, so they ask the person in front of *them*… and so on.`,
    py`Eventually the question reaches the person at the very front. They don't need to ask anyone: "**I'm number 1.**" That's the **base case**.`,
    py`Now the answers travel back: "I'm 2", "I'm 3"… each person adds one to the answer they got and passes it back. When the answer reaches you, you know your position. That's the **recursive case** — and the trip forward and back is the call stack growing and unwinding.`,
    py`If nobody were at the front — say the queue was a circle — the question would go round forever. In Python, after about a thousand "asks", it gives up with a \`RecursionError\`.`,
  ],
  analogy: {
    title: 'Russian nesting dolls',
    body: [
      py`To count the dolls in a set of Russian nesting dolls, you open the outer doll and count "1 + however many dolls are inside this one". To know how many are inside, you open the next doll and ask the same question again. The tiniest doll doesn't open: it's just 1. Then you add your way back out.`,
      py`Each doll you're holding open while you look inside is a frame waiting on the call stack. You can only close a doll (return) after the one inside it has given you its answer.`,
    ],
    mapping: [
      ['opening a doll and asking the same question', 'a recursive call on a smaller input'],
      ['the tiniest solid doll', 'the base case — answered directly'],
      ['dolls you are holding open', 'frames waiting on the call stack'],
      ['adding 1 on the way back out', 'combining a sub-result after the recursive call returns'],
      ['a doll that contains itself (impossible!)', 'a missing or unreachable base case → RecursionError'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Watch the stack grow and unwind',
    props: {
      code: py`def factorial(n):
    if n <= 1:                     # base case
        return 1
    return n * factorial(n - 1)    # recursive case


print(factorial(4))
`,
      notes: {
        7: 'One call from the Global frame starts it all: `factorial(4)`.',
        4: 'This frame can\'t finish the multiplication yet: it needs `factorial(n - 1)` first, so it **pauses** here and a new frame is pushed on top.',
        2: 'Every frame has its **own** `n`. Count the `factorial` frames on the stack as they pile up: 4, 3, 2, 1.',
        3: 'Base case reached: `n` is 1, so this frame returns 1 **without** calling itself again. Now the stack starts to unwind.',
      },
    },
    alt: 'A step-by-step trace of factorial(4). Four factorial frames are stacked on top of the Global frame, with n = 4, 3, 2 and 1. The top frame hits the base case and returns 1. Then the frames are removed one by one: the n = 2 frame returns 2, the n = 3 frame returns 6, the n = 4 frame returns 24, and the program prints 24.',
    caption: py`Going **down**, each frame pauses on line 4 waiting for a smaller answer. Coming back **up**, each frame finishes its multiplication with the value it received: 1 → 2 → 6 → 24. The deepest call finishes first.`,
  },
  syntax: [
    py`#### The recursive recipe`,
    { code: py`def solve(problem):
    if problem_is_simple(problem):        # 1. base case(s): answer directly
        return simple_answer(problem)
    smaller = make_smaller(problem)       # 2. shrink the problem
    sub_answer = solve(smaller)           # 3. trust the recursive call
    return combine(problem, sub_answer)   # 4. build this level's answer`, lang: 'python', static: true, title: 'the template (pseudocode)' },
    py`Step 3 is the mental leap: **assume the recursive call works** for the smaller problem (it will, as long as the base case is right and every call gets closer to it), and only think about one level at a time.`,
    py`#### Recursion on a list`,
    { code: py`def total(numbers):
    if not numbers:                          # base case: an empty list sums to 0
        return 0
    return numbers[0] + total(numbers[1:])   # first item + sum of the rest


print(total([4, 5, 6]))                      # 15`, lang: 'python', title: 'head + the rest' },
    { callout: 'note', title: 'This is for learning, not production', text: py`This version is a **simplified** teaching example: \`numbers[1:]\` copies the list at every level, and a long list would exceed the recursion limit. In real code use \`sum(numbers)\` or a loop. Recursion earns its keep on *nested* data, not flat lists.` },
    py`#### Recursion on nested data`,
    py`Nested data has two kinds of thing: **leaves** (a number, a string, a file) and **branches** (a list, a dict, a folder) that contain more of the same. The base case handles a leaf; the recursive case loops over a branch's children and recurses into each one. \`isinstance(item, dict)\` asks "is this a dict?" so you can tell them apart.`,
    { code: py`def count_emails(data):
    """Count the "email" keys anywhere in JSON-like nested dicts and lists."""
    if isinstance(data, dict):
        found = 1 if "email" in data else 0
        for value in data.values():
            found += count_emails(value)
        return found
    if isinstance(data, list):
        return sum(count_emails(item) for item in data)
    return 0                                  # base case: a plain value


team = {"lead": {"name": "Ada", "email": "ada@example.com"},
        "members": [{"name": "Ben", "email": "ben@example.com"}, {"name": "Cy"}]}
print(count_emails(team))                     # 2`, lang: 'python', title: 'walking parsed JSON' },
    py`Notice that a function can have **several** base and recursive cases. (The \`sum(... for ...)\` is a generator expression — see [lazy evaluation](lesson:lazy-evaluation).)`,
    py`#### The recursion limit`,
    { code: py`import sys

print(sys.getrecursionlimit())   # 1000 in this playground (CPython's usual default)


def forever(n):
    return forever(n + 1)        # no base case!

# forever(0)  →  RecursionError: maximum recursion depth exceeded`, lang: 'python', title: 'how deep can you go?' },
    { callout: 'note', title: 'CPython detail', text: py`The limit exists to stop runaway recursion before it crashes the interpreter. Its value and exact behaviour are implementation details: CPython's default is usually 1000 frames (a few are already used by the code that runs yours). CPython does **not** do tail-call optimisation, so even a function whose last action is calling itself uses one frame per call. \`sys.setrecursionlimit()\` can raise the limit, but very high values can exhaust the real C stack and crash the process instead of raising a clean exception.` },
  ],
  walkthrough: {
    title: 'Walking a folder tree line by line',
    lang: 'python',
    code: FOLDER_TREE,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 8], text: py`A folder is a dict mapping names to items; an item is either a file (an \`int\` size) or another folder (a dict). The data is **recursive**: folders contain folders.` },
      { lines: [13, 14], text: py`**Base case**: a file's size is just its number. No further calls.` },
      { lines: [15, 18], text: py`**Recursive case**: a folder's size is the sum of its children's sizes. Each child might be a file *or* a folder, and \`total_size\` handles both — we trust the recursive call to deal with whatever is inside.` },
      { lines: [21, 26], text: py`\`show_tree\` recurses only into folders, passing \`depth + 1\` so each level is indented four more spaces. Here the base case is implicit: a folder with no sub-folders makes no further calls.` },
      { lines: [29, 30], text: py`Two top-level calls. The deepest file, \`utils/math.py\`, is reached three calls down. Total: 4 + 12 + 7 + 5 + 9 = 37.` },
    ],
  },
  playground: {
    title: 'Folder tree explorer',
    objective: 'Walk nested folders recursively, add your own recursive functions, then write a loop version that survives any depth.',
    files: { 'main.py': FOLDER_TREE },
    expected: py`\`\`\`text
README.md
src
    main.py
    utils
        helpers.py
        math.py
docs
    guide.md
total size: 37
\`\`\``,
    experiments: [
      {
        id: 'count-files',
        task: py`Write \`count_files(item)\` that returns how many **files** (ints) are in an item: 1 for a file, the sum of its children's counts for a folder.`,
        hint: py`Copy the shape of \`total_size\`: the base case returns \`1\` instead of the size.`,
        tests: [
          { name: 'the project holds 5 files', code: py`assert count_files(project) == 5` },
          { name: 'a single file counts as 1', code: py`assert count_files(42) == 1` },
          { name: 'an empty folder holds 0 files', code: py`assert count_files({}) == 0` },
        ],
        explain: py`Same recursion, different base case and combination step. Most tree functions — counting, summing, searching, finding the maximum — share this exact skeleton.`,
      },
      {
        id: 'find-file',
        task: py`Write \`contains(folder, filename)\` that returns \`True\` if a file with that name exists **anywhere** in the folder tree, otherwise \`False\`.`,
        hint: py`Loop over \`folder.items()\`. If the name matches, return \`True\`. If the item is a dict and \`contains(item, filename)\` is true, return \`True\`. After the loop, return \`False\`.`,
        tests: [
          { name: 'finds a deeply nested file', code: py`assert contains(project, "math.py") is True` },
          { name: 'finds a top-level file', code: py`assert contains(project, "README.md") is True` },
          { name: 'returns False for a missing file', code: py`assert contains(project, "secret.txt") is False` },
        ],
        explain: py`Search recursion can **stop early**: as soon as any recursive call returns \`True\`, every level above it returns \`True\` immediately, unwinding the stack without visiting the rest of the tree.`,
      },
      {
        id: 'show-sizes',
        task: py`Change \`show_tree\` so files show their size in brackets and folders end with a slash, e.g. \`main.py (12)\` and \`utils/\`.`,
        hint: py`Inside the loop, use \`if isinstance(item, dict):\` to print \`name + "/"\` and recurse; \`else:\` print \`f"{name} ({item})"\`.`,
        tests: [
          { name: 'files show their size', code: py`assert "main.py (12)" in output and "README.md (4)" in output` },
          { name: 'folders end with a slash and are indented', code: py`assert "    utils/" in output` },
        ],
        explain: py`The indentation comes for free from the \`depth\` parameter: every recursive call passes \`depth + 1\`, so each frame knows how deep it is without any global counter.`,
      },
      {
        id: 'iterative',
        task: py`Write \`total_size_iterative(item)\` that computes the same total **without recursion**, using a list as your own stack: start with \`[item]\`, and while the stack isn't empty, \`pop\` an item and either add its size or push its children.`,
        hint: py`\`stack = [item]\`, \`while stack:\`, \`current = stack.pop()\`, then \`if isinstance(current, int): total += current\` \`else: stack.extend(current.values())\`.`,
        tests: [
          { name: 'same answer as total_size', code: py`assert total_size_iterative(project) == 37` },
          { name: 'survives 3000 levels of nesting', code: py`deep = 1
for _ in range(3000):
    deep = {"inner": deep}
assert total_size_iterative(deep) == 1, 'Use a loop and a list, not recursion'` },
        ],
        explain: py`The recursive version would raise \`RecursionError\` on 3000 levels; your loop doesn't care, because the "stack" is now an ordinary list on the heap rather than Python's call stack. Any recursion can be rewritten like this — usually at some cost in readability.`,
      },
    ],
  },
  animation: {
    type: 'performance',
    title: 'Memoization: stop recomputing the same sub-problems',
    props: { demo: 'memoization' },
    alt: 'A live measurement comparing recursive Fibonacci with and without functools.lru_cache for several values of n: the plain version makes a rapidly growing number of calls while the cached version makes roughly n calls, with the timings measured in the browser.',
    caption: py`\`fib(n) = fib(n-1) + fib(n-2)\` asks for the same smaller values again and again, so the number of calls explodes. \`@lru_cache\` (or \`@functools.cache\`) remembers each answer the first time it's computed. The \`@\` line is a [decorator](lesson:decorators); caching itself is covered in [functools](lesson:functools).`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`There is nothing special about a function calling itself: Python treats \`factorial(n - 1)\` exactly like a call to any other function. It pushes a **new frame** with its own local \`n\`, runs it, and gives the return value back to the frame that asked. The frames don't share their \`n\` — that's why each level can hold a different value.`,
      py`The order of work is worth seeing once. Anything *before* the recursive call runs on the way **down**; anything *after* it runs on the way **back up**:`,
      { code: py`def show(n):
    if n == 0:
        return
    print("down", n)      # runs before the deeper call
    show(n - 1)
    print("up", n)        # runs after the deeper call has returned


show(2)                   # down 2, down 1, up 1, up 2`, lang: 'python', title: 'down, then up' },
    ],
    technical: [
      py`**Every recursive call costs a frame**, and frames live until the call returns, so memory use grows with the *depth* of recursion. CPython raises \`RecursionError\` (a subclass of \`RuntimeError\`) when the depth exceeds \`sys.getrecursionlimit()\`. The traceback is shortened for you with a line like \`[Previous line repeated 992 more times]\`.`,
      py`**No tail-call optimisation.** Some languages turn \`return f(n - 1)\` (a call in "tail position") into a jump that reuses the frame. CPython deliberately doesn't: every frame stays visible in tracebacks, which keeps debugging honest. So in Python, tail recursion is no cheaper than other recursion — convert deep tail-recursive functions into loops.`,
      py`**Overlapping sub-problems.** Naive Fibonacci calls \`fib(n - 2)\` from both \`fib(n)\` and \`fib(n - 1)\`, so the same values are recomputed again and again and the number of calls grows exponentially. **Memoization** stores each result the first time it is computed:`,
      { code: py`import functools


@functools.cache                 # 3.9+: an unbounded lru_cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


print(fib(90))                   # 2880067194370816120 — instant
print(fib.cache_info())          # hits/misses show the reuse`, lang: 'python', title: 'memoization with functools' },
      py`**Converting recursion to iteration**: replace the call stack with your own list. Push the starting item; loop while the list isn't empty; pop an item and either handle it (leaf) or push its children (branch). This processes the same nodes, often in a different order, and has no depth limit beyond available memory.`,
      { callout: 'note', title: 'CPython detail', text: py`Since CPython 3.11, calls between Python functions no longer recurse in the C interpreter loop, which made deep Python recursion cheaper and safer; 3.12 made the recursion limit apply only to Python code, with C code protected separately. These are implementation changes — the language guarantee is only that some limit exists and that exceeding it raises \`RecursionError\`. Other implementations (PyPy, for example) have different limits.` },
    ],
    production: [
      py`**Use recursion where the data is recursive** — trees, nested JSON, ASTs, menus — and where the depth is naturally small (a folder tree a few dozen levels deep, an org chart, a parsed config). It is often the clearest code you can write for those.`,
      py`**Don't use recursion for linear work.** Summing, searching or counting down a list with recursion is slower (a frame per item, often a copy per slice) and fails beyond about a thousand items. Use a loop, \`sum()\`, \`any()\` or a [comprehension](lesson:comprehensions).`,
      py`**Guard against untrusted depth.** Deeply nested input from outside — a JSON payload, an uploaded XML file — can drive recursive code (including parsers) into the recursion limit. Validate or cap the depth, or use an iterative walk ([input validation](lesson:input-validation)).`,
      py`**Watch out for cycles.** Real graphs (links between web pages, symlinked folders, objects referencing each other) can loop back on themselves; a naive recursive walk never terminates. Keep a \`visited\` set of what you've already processed.`,
      py`**Reach for the library first.** \`os.walk\` and \`Path.rglob\` already walk directory trees ([pathlib](lesson:pathlib)); \`copy.deepcopy\` and \`json\` handle nested structures. For lazy traversal of huge trees, a recursive generator with \`yield from\` produces items one at a time ([generators](lesson:generators)).`,
    ],
  },
  mistakes: [
    {
      title: 'No base case (or one that never runs)',
      wrong: { code: py`def countdown(n):
    print(n)
    countdown(n - 1)      # never stops: RecursionError`, lang: 'python', static: true },
      right: { code: py`def countdown(n):
    if n < 0:             # base case
        return
    print(n)
    countdown(n - 1)


countdown(3)              # 3 2 1 0`, lang: 'python' },
      explanation: py`Without a base case every call makes another call until Python hits the recursion limit. Write the base case **first**, before the recursive call.`,
    },
    {
      title: 'A base case the recursion can jump over',
      wrong: { code: py`def halve_until_zero(n):
    if n == 0:
        return "done"
    return halve_until_zero(n - 2)   # 5 → 3 → 1 → -1 → … never 0


# halve_until_zero(5)   → RecursionError`, lang: 'python' },
      right: { code: py`def halve_until_zero(n):
    if n <= 0:                       # catches 0 AND anything that overshoots
        return "done"
    return halve_until_zero(n - 2)


print(halve_until_zero(5))           # done`, lang: 'python' },
      explanation: py`Each recursive call must move **towards** the base case, and the base case must catch every way of arriving. Prefer \`<=\` over \`==\` when steps can overshoot.`,
    },
    {
      title: 'Forgetting to return the recursive result',
      wrong: { code: py`def total(numbers):
    if not numbers:
        return 0
    numbers[0] + total(numbers[1:])   # computed, then thrown away


total([1, 2])   # TypeError: unsupported operand type(s) for +: 'int' and 'NoneType'`, lang: 'python', static: true },
      right: { code: py`def total(numbers):
    if not numbers:
        return 0
    return numbers[0] + total(numbers[1:])


print(total([1, 2]))   # 3`, lang: 'python' },
      explanation: py`Without \`return\`, the recursive case falls off the end and returns \`None\`, and the frame above tries to add \`None\`. Every path must return a value.`,
    },
    {
      title: 'Recomputing the same sub-problems',
      wrong: { code: py`def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)   # fib(35) makes millions of calls`, lang: 'python' },
      right: { code: py`import functools


@functools.cache
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


print(fib(35))   # 9227465, computed once per n`, lang: 'python' },
      explanation: py`When a recursive function calls itself on overlapping inputs, the work grows exponentially. Memoize with \`functools.cache\`, or rewrite as a loop that builds answers bottom-up.`,
    },
    {
      title: 'Accumulating into a mutable default argument',
      wrong: { code: py`def collect_files(folder, found=[]):
    for name, item in folder.items():
        if isinstance(item, dict):
            collect_files(item, found)
        else:
            found.append(name)
    return found


print(collect_files({"a.txt": 1}))
print(collect_files({"b.txt": 2}))   # ['a.txt', 'b.txt'] — leaked!`, lang: 'python' },
      right: { code: py`def collect_files(folder):
    found = []
    for name, item in folder.items():
        if isinstance(item, dict):
            found.extend(collect_files(item))
        else:
            found.append(name)
    return found


print(collect_files({"a.txt": 1}))
print(collect_files({"b.txt": 2}))   # ['b.txt']`, lang: 'python' },
      explanation: py`A default list is shared across top-level calls (see [function arguments](lesson:function-arguments)). Let each call build and return its own list, and combine the results — or pass the accumulator explicitly from a non-recursive wrapper.`,
    },
  ],
  debugging: [
    {
      symptom: py`RecursionError: maximum recursion depth exceeded`,
      cause: py`The base case is missing, unreachable (the input jumps over it), or the input really is deeper than about a thousand levels.`,
      fix: py`Print the argument at the top of the function to watch it shrink (or not). Fix the base case to catch every ending, make sure each call moves towards it, or rewrite the function with a loop and an explicit stack.`,
    },
    {
      symptom: py`A traceback with "[Previous line repeated 992 more times]"`,
      cause: py`CPython collapses the identical frames of a runaway recursion so the traceback stays readable.`,
      fix: py`Look at the frame just above the repeated block: it shows the line making the recursive call and, usually, why the arguments never reach the base case.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'int' and 'NoneType'`,
      cause: py`A path through the recursive function doesn't \`return\` — often the recursive case computes a value but forgets the \`return\` keyword.`,
      fix: py`Make every branch return a value of the same kind; check the line that combines sub-results.`,
    },
    {
      symptom: py`The function is correct for small inputs but takes forever for n around 35–40.`,
      cause: py`Overlapping sub-problems: the same calls are made again and again (exponential growth).`,
      fix: py`Add \`@functools.cache\` (or \`lru_cache\`), or compute bottom-up with a loop. Count calls with a counter to confirm.`,
    },
    {
      symptom: py`A tree walk never finishes on real-world data.`,
      cause: py`The data contains a cycle (a folder symlink, an object that refers back to its parent), so the recursion revisits the same nodes forever.`,
      fix: py`Keep a \`visited\` set of ids or paths and skip anything already seen.`,
    },
  ],
  bestPractices: [
    'Write the base case first, and make sure every recursive call moves strictly towards it.',
    'Think one level at a time: trust the recursive call for the smaller problem, then combine.',
    'Use recursion for recursive data (trees, nested JSON, folders); use loops for flat sequences.',
    'Make every path return a value — a missing return turns into None one level up.',
    'Memoize recursive functions with overlapping sub-problems (functools.cache / lru_cache).',
    'Never accumulate into a mutable default argument; build and return results per call.',
    'Guard against deep or cyclic input: cap depth, track visited nodes, or switch to an explicit stack.',
  ],
  useCases: [
    'Walking folder trees and nested JSON from web APIs.',
    'Processing trees: HTML/XML documents, comment threads, menus, org charts, syntax trees.',
    'Divide-and-conquer algorithms: merge sort, quicksort, binary search.',
    'Backtracking searches: puzzles, permutations, path finding.',
    'Mathematical definitions that are recursive: factorials, Fibonacci (with memoization).',
  ],
  whenToUse: {
    use: [
      'The data or the problem is naturally nested or self-similar (trees, nested containers).',
      'The maximum depth is known to be modest (tens or hundreds, not thousands).',
      'A recursive version is clearly easier to read than the loop version.',
    ],
    avoid: [
      'Flat sequences — loops, sum(), any() and comprehensions are faster and have no depth limit.',
      'Input whose depth you don\'t control and that could exceed the recursion limit.',
      'Recursion with overlapping sub-problems and no memoization.',
    ],
  },
  comparison: {
    title: 'Recursion vs iteration',
    headers: ['', 'recursion', 'iteration (loop)'],
    rows: [
      ['best fit', 'nested, tree-shaped data; divide and conquer', 'flat sequences; counting; repeating until done'],
      ['state lives in', 'the call stack (one frame per level)', 'variables you manage (counters, an explicit stack)'],
      ['depth limit', 'yes — RecursionError around sys.getrecursionlimit()', 'no — only available memory'],
      ['speed in CPython', 'a function call per step (slower)', 'usually faster for the same work'],
      ['readability', 'often clearer for trees', 'often clearer for sequences'],
    ],
    note: py`Every recursive function can be rewritten as a loop with an explicit stack, and vice versa. Choose the version that makes the code easiest to understand, then check it handles the depths you expect.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'recursion-q1',
      type: 'mcq',
      prompt: 'What is the job of the **base case** in a recursive function?',
      options: [
        { text: 'To call the function again with a smaller input', why: 'That is the recursive case. The base case is where the calls stop.' },
        'To answer the simplest inputs directly, without another recursive call, so the recursion stops',
        { text: 'To set up global variables before the recursion starts', why: 'Recursive functions should not need globals; each frame has its own local variables.' },
        { text: 'To catch RecursionError', why: 'A correct base case means you never hit RecursionError in the first place.' },
      ],
      answer: 1,
      explanation: py`The base case answers the smallest inputs directly. Every recursive call must get closer to it; when it is reached, the stack starts to unwind.`,
    },
    {
      id: 'recursion-q2',
      type: 'output',
      prompt: 'What does this print? (Four lines.)',
      code: py`def show(n):
    if n == 0:
        return
    print("down", n)
    show(n - 1)
    print("up", n)


show(2)`,
      answer: py`down 2
down 1
up 1
up 2`,
      explanation: py`Code before the recursive call runs on the way down (2, then 1). When \`show(0)\` returns, the paused frames resume from the deepest one outwards, so "up" prints 1 first, then 2.`,
    },
    {
      id: 'recursion-q3',
      type: 'bug',
      prompt: '`count_down(5)` crashes with RecursionError. What is the bug?',
      code: py`def count_down(n):
    if n == 0:
        return "done"
    return count_down(n - 2)


print(count_down(5))`,
      options: [
        { text: 'There is no base case', why: 'There is one (n == 0) — the problem is that the calls never reach it.' },
        'n goes 5 → 3 → 1 → -1 → …, jumping over 0, so the base case n == 0 is never true',
        { text: 'A function cannot return a call to itself', why: 'return count_down(n - 2) is a perfectly legal recursive call.' },
        { text: 'The recursion limit is too low for 5 calls', why: 'Five calls are nothing; the default limit is around 1000. The calls never stop.' },
      ],
      answer: 1,
      explanation: py`An odd starting number skips 0 entirely. Use \`if n <= 0:\` so the base case catches every way the recursion can end.`,
    },
    {
      id: 'recursion-q4',
      type: 'fill',
      prompt: 'Complete factorial so that `factorial(5)` returns 120 and `factorial(0)` returns 1.',
      code: py`def factorial(n):
    if n ___ 1:
        return 1
    return n * factorial(___)`,
      answer: [['<='], ['n - 1', 'n-1']],
      explanation: py`\`n <= 1\` covers both 0 and 1 as base cases; \`factorial(n - 1)\` moves each call one step closer to it.`,
    },
    {
      id: 'recursion-q5',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def total(numbers):
    if not numbers:
        return 0
    return numbers[0] + total(numbers[1:])


print(total([4, 5, 6]))`,
      options: [
        '15',
        { text: '4', why: 'The first item is only the start: it is added to total of the rest, [5, 6].' },
        { text: '0', why: 'The base case returns 0 only for the empty list at the very bottom; the frames above add their first items to it.' },
        { text: 'RecursionError', why: 'Each call passes a list one shorter, so it reaches the empty-list base case after three calls.' },
      ],
      answer: 0,
      explanation: py`\`4 + total([5, 6])\` → \`4 + (5 + total([6]))\` → \`4 + (5 + (6 + total([])))\` → \`4 + 5 + 6 + 0\` = 15.`,
    },
    {
      id: 'recursion-q6',
      type: 'mcq',
      prompt: 'Which statement about recursion in CPython is true?',
      options: [
        { text: 'CPython optimises tail calls, so tail-recursive functions never hit the limit', why: 'CPython deliberately has no tail-call optimisation; every call uses a frame.' },
        'There is a recursion limit (sys.getrecursionlimit(), usually 1000); exceeding it raises RecursionError',
        { text: 'sys.setrecursionlimit(10**9) makes any depth of recursion safe', why: 'Raising the limit very high can exhaust the real C stack and crash the process instead of raising a clean exception.' },
        { text: 'Recursion is always faster than a loop because it is simpler', why: 'Each recursive step is a function call, which costs more than a loop iteration in CPython.' },
      ],
      answer: 1,
      explanation: py`The limit is a safety net against runaway recursion. It's a CPython implementation detail, but some limit exists in every Python. For deep data, rewrite the recursion as a loop with an explicit stack.`,
    },
    {
      id: 'recursion-q7',
      type: 'short',
      prompt: 'You need to sum the numbers in (a) a flat list of a million readings and (b) a JSON document with numbers nested a few levels deep in dicts and lists. Would you use recursion for each? Why?',
      answer: py`(a) No — use sum() or a loop. Recursion would make a million calls, exceed the recursion limit around 1000, and be slower. (b) Yes — the data is recursive (containers inside containers) and only a few levels deep, so a recursive function with a base case for plain numbers and a recursive case for dicts/lists is short and clear. If the nesting depth came from untrusted input and could be huge, I would use an explicit stack instead.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'sum-digits',
      title: 'Sum of digits',
      difficulty: 'intermediate',
      prompt: py`Write a **recursive** function \`sum_digits(n)\` that returns the sum of the decimal digits of a non-negative integer \`n\`:

- \`sum_digits(1234)\` → \`10\`
- \`sum_digits(7)\` → \`7\`
- \`sum_digits(0)\` → \`0\`

Use arithmetic, not strings: \`n % 10\` is the last digit and \`n // 10\` is the number without its last digit. The tests also check that \`sum_digits\` calls itself.`,
      files: {
        'main.py': py`def sum_digits(n):
    # TODO: base case for a single digit, recursive case for the rest
    return 0


print(sum_digits(1234))   # 10
`,
      },
      hints: [
        'What is the simplest input? A single-digit number (n < 10) is its own digit sum.',
        'For a bigger n, the answer is (last digit) + (digit sum of everything except the last digit).',
        'if n < 10: return n — otherwise return n % 10 + sum_digits(n // 10)',
      ],
      solution: {
        explanation: py`The base case \`n < 10\` covers 0–9, whose digit sum is the number itself. The recursive case peels off the last digit with \`n % 10\` and recurses on \`n // 10\`, which has one digit fewer — so every call moves towards the base case. For 1234: \`4 + sum_digits(123)\` → \`4 + 3 + sum_digits(12)\` → \`4 + 3 + 2 + sum_digits(1)\` → \`4 + 3 + 2 + 1\` = 10. The depth equals the number of digits, so it is safe for any realistic integer.`,
        files: {
          'main.py': py`def sum_digits(n):
    """Return the sum of the decimal digits of a non-negative int."""
    if n < 10:
        return n
    return n % 10 + sum_digits(n // 10)


print(sum_digits(1234))   # 10
`,
        },
      },
      tests: [
        { name: 'sum_digits(1234) is 10', code: py`assert sum_digits(1234) == 10` },
        { name: 'a single digit is its own sum', code: py`assert sum_digits(7) == 7 and sum_digits(0) == 0` },
        { name: 'works for larger numbers', code: py`assert sum_digits(9_876_543_210) == 45` },
        { name: 'the function is recursive', code: py`assert "sum_digits" in sum_digits.__code__.co_names, 'sum_digits should call itself'` },
      ],
    },
    {
      id: 'flatten',
      title: 'Flatten a nested list',
      difficulty: 'intermediate',
      prompt: py`Write \`flatten(items)\` that takes a list which may contain other lists (nested to any depth) and **returns a new flat list** of all the non-list values, in order:

\`\`\`python
flatten([1, [2, [3, 4]], 5])   # [1, 2, 3, 4, 5]
flatten([[[]]])                # []
flatten(["ab", ["cd"]])        # ['ab', 'cd']  — strings are values, not lists
\`\`\`

Don't modify the input list. The tests check the examples above, an empty list, and that the original list is unchanged.`,
      files: {
        'main.py': py`def flatten(items):
    # TODO: return a new flat list
    return items


print(flatten([1, [2, [3, 4]], 5]))
`,
      },
      hints: [
        'Loop over items. Each item is either a list (a branch) or a plain value (a leaf).',
        'For a leaf, append it to a result list. For a list, flatten it recursively and add all of its values.',
        'result.extend(flatten(item)) for lists, result.append(item) otherwise; return result after the loop.',
      ],
      solution: {
        explanation: py`Each call builds its **own** \`result\` list, so nothing is shared between calls and the input is never modified. A non-list item is a leaf and is appended. A list is a branch: \`flatten(item)\` returns its values already flattened (trust the recursion), and \`extend\` adds them all. An empty list simply produces an empty result, so no separate base case is needed — the recursion stops when a list contains no sub-lists. Checking \`isinstance(item, list)\` (rather than "is it iterable?") keeps strings intact.`,
        files: {
          'main.py': py`def flatten(items):
    """Return a new list with every non-list value from nested lists, in order."""
    result = []
    for item in items:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result


print(flatten([1, [2, [3, 4]], 5]))
`,
        },
      },
      tests: [
        { name: 'flattens nested lists in order', code: py`assert flatten([1, [2, [3, 4]], 5]) == [1, 2, 3, 4, 5]` },
        { name: 'empty and empty-nested lists', code: py`assert flatten([]) == [] and flatten([[[]]]) == []` },
        { name: 'strings are kept whole', code: py`assert flatten(["ab", ["cd"]]) == ["ab", "cd"]` },
        { name: 'the input is not modified', code: py`data = [1, [2, 3]]
flatten(data)
assert data == [1, [2, 3]]` },
        { name: 'returns a new list', code: py`data = [1, 2]
assert flatten(data) is not data` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'recursion-explain',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is recursion, and what makes a recursive function correct?',
      answer: 'Recursion is when a function solves a problem by calling itself on a smaller instance of the same problem. It is correct when it has a base case that is answered directly and every recursive call makes progress towards that base case, with the results combined correctly on the way back.',
      explanation: py`Each call has its own frame and local variables; the stack grows until the base case and unwinds as results are returned. Correctness is usually argued by induction: the base case is right, and if the call on the smaller input is right, this level is right.`,
      whyAsked: 'Fundamental concept; the answer reveals whether the candidate thinks in terms of base case + progress, not just "a function calling itself".',
      mistakes: ['Only saying "a function that calls itself"', 'Not mentioning the base case or progress towards it', 'Confusing recursion with loops in general'],
      followUps: ['What happens on the call stack?', 'What is RecursionError?', 'When would you avoid recursion in Python?'],
      modelAnswer: 'Recursion means solving a problem by expressing it in terms of a smaller version of itself and calling the same function on that smaller input. To be correct it needs a base case — an input simple enough to answer directly — and every recursive call must move closer to that base case, so the chain of calls is guaranteed to end. Each call gets its own frame on the call stack; the stack grows down to the base case and then unwinds as each level combines the sub-result into its own answer. I reason about it one level at a time: if the base case is right and the smaller call is right, this level is right.',
    },
    {
      id: 'recursion-limit-tco',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why does deep recursion fail in Python, and does Python do tail-call optimisation?',
      answer: 'Every call uses a stack frame, and CPython stops at sys.getrecursionlimit() (usually 1000) with RecursionError to avoid exhausting the real stack. CPython does not do tail-call optimisation — by design, so tracebacks show every frame — so even tail-recursive functions use one frame per call. For deep problems, use iteration with an explicit stack.',
      explanation: py`Raising the limit with \`sys.setrecursionlimit\` is possible but risky: the real C stack can still overflow and crash the process. The limit and its default are CPython details; the existence of a limit and \`RecursionError\` are what you can rely on.`,
      whyAsked: 'Checks practical knowledge of Python’s runtime limits and the habit of not porting recursion-heavy idioms from functional languages blindly.',
      mistakes: ['Claiming Python optimises tail calls', 'Recommending setrecursionlimit as the fix without discussing the risk', 'Giving the limit as a language guarantee'],
      followUps: ['How would you rewrite a recursive tree walk iteratively?', 'Why did Python choose not to add TCO?', 'What does the traceback of a RecursionError look like?'],
      modelAnswer: 'Each Python call creates a frame that lives until the call returns, so recursion depth means stack depth. CPython guards against runaway recursion with a limit — sys.getrecursionlimit(), usually 1000 — and raises RecursionError when it’s exceeded. There’s no tail-call optimisation in CPython; that’s a deliberate choice so tracebacks keep every frame, which means a tail-recursive function still uses a frame per call. I can raise the limit, but very high values risk overflowing the real C stack and crashing the process, so for deep or unbounded data I convert the recursion into a loop with an explicit stack.',
    },
    {
      id: 'recursion-vs-iteration',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare recursion and iteration in Python. How do you decide which to use?',
      answer: 'Use recursion when the data or problem is naturally recursive and the depth is modest — trees, nested JSON, divide and conquer — because it is shorter and clearer. Use iteration for flat or very deep work: it is faster in CPython (no call per step), has no recursion limit, and uses constant stack space.',
      explanation: py`Any recursion can be turned into a loop with an explicit stack (or queue, for breadth-first order). Recursion with overlapping sub-problems needs memoization either way. Generators with \`yield from\` give a lazy recursive traversal when you want items one at a time.`,
      whyAsked: 'A judgement question: good engineers pick the clearer tool while knowing its limits.',
      mistakes: ['Saying recursion is always more elegant and therefore better', 'Saying recursion should never be used in Python', 'Forgetting the depth limit when processing external data'],
      followUps: ['Rewrite a recursive DFS iteratively.', 'How would you get breadth-first order instead?', 'How does memoization change the picture?'],
      modelAnswer: 'I choose based on the shape of the problem and the depth. For nested, tree-like data — folder structures, JSON, ASTs — and for divide-and-conquer algorithms, recursion mirrors the structure and is usually the clearest code, provided the depth stays well under the recursion limit. For flat sequences or anything that could be thousands of levels deep, iteration wins: each step isn’t a function call, there’s no RecursionError, and the stack stays constant. When I need both clarity and unbounded depth I write the loop with an explicit stack, and if sub-problems overlap I add memoization regardless of style.',
    },
    {
      id: 'recursion-fib-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this print, and roughly how does the number of calls grow if you ask for f(30)?',
      code: { lang: 'python', code: py`def f(n):
    if n <= 1:
        return n
    return f(n - 1) + f(n - 2)


print([f(i) for i in range(7)])` },
      options: ['[0, 1, 2, 3, 4, 5, 6]', '[0, 1, 1, 2, 3, 5, 8]', '[1, 1, 2, 3, 5, 8, 13]', 'RecursionError'],
      correctOption: 1,
      answer: '[0, 1, 1, 2, 3, 5, 8] — the Fibonacci numbers. The number of calls grows exponentially with n, because each call makes two more and the same values are recomputed many times; @functools.cache makes it linear.',
      explanation: py`\`f(n)\` calls \`f(n - 1)\` and \`f(n - 2)\`, and \`f(n - 1)\` calls \`f(n - 2)\` again, and so on: the call tree roughly doubles at each level. Memoization stores each result so every \`f(k)\` is computed once.`,
      whyAsked: 'Classic warm-up that leads straight into complexity and memoization.',
      mistakes: ['Off-by-one on the starting values', 'Thinking the cost is linear because the code looks short'],
      followUps: ['How would you count the calls?', 'Write it with functools.cache.', 'Write an iterative version with two variables.'],
      modelAnswer: 'It prints the first seven Fibonacci numbers: 0, 1, 1, 2, 3, 5, 8. The base case returns n for 0 and 1, and every other value is the sum of the two before. The catch is cost: each call spawns two more and the same sub-problems are recomputed over and over, so the number of calls grows exponentially — f(30) already makes over a million calls. Adding @functools.cache stores each result so every value is computed once, which makes it linear; an iterative loop with two variables is linear too and avoids recursion entirely.',
    },
    {
      id: 'recursion-nested-sum',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `nested_sum(data)` that returns the sum of every number (int or float) in JSON-like data made of dicts, lists, strings and numbers, nested to any depth. Strings are ignored.',
      answer: 'Base case: a number returns itself, anything else that is not a container returns 0. Recursive cases: a dict sums nested_sum over its values; a list sums nested_sum over its items.',
      explanation: py`JSON maps to exactly these Python types (dict, list, str, int, float, bool, None), so three branches cover everything. Note \`bool\` is a subclass of \`int\` — \`isinstance(True, int)\` is \`True\` — so production code that must ignore booleans checks for them first.`,
      starter: { files: { 'main.py': py`def nested_sum(data):
    # TODO: numbers count, dicts and lists are searched, everything else is 0
    return 0


order = {"id": "A17", "items": [{"price": 3.5, "qty": 2}, {"price": 1.25, "qty": 4}]}
print(nested_sum(order))   # 10.75
` } },
      tests: [
        { name: 'sums numbers in nested dicts and lists', code: py`assert nested_sum({"a": 1, "b": [2, 3, {"c": 4}]}) == 10` },
        { name: 'ignores strings', code: py`assert nested_sum({"name": "Ada", "age": 36}) == 36` },
        { name: 'a plain number is its own sum', code: py`assert nested_sum(5) == 5` },
        { name: 'empty containers sum to 0', code: py`assert nested_sum([]) == 0 and nested_sum({}) == 0` },
        { name: 'works with floats', code: py`assert nested_sum({"items": [{"price": 3.5, "qty": 2}, {"price": 1.25, "qty": 4}]}) == approx(10.75)` },
      ],
      solution: { files: { 'main.py': py`def nested_sum(data):
    """Return the sum of all numbers anywhere inside JSON-like data."""
    if isinstance(data, (int, float)):
        return data
    if isinstance(data, dict):
        return sum(nested_sum(value) for value in data.values())
    if isinstance(data, list):
        return sum(nested_sum(item) for item in data)
    return 0


order = {"id": "A17", "items": [{"price": 3.5, "qty": 2}, {"price": 1.25, "qty": 4}]}
print(nested_sum(order))   # 10.75
` } },
      hints: ['isinstance(data, (int, float)) checks for either type at once.', 'For a dict, recurse into data.values(); for a list, into each item.'],
      whyAsked: 'Recursion over heterogeneous nested data is the most common real-world use of recursion.',
      mistakes: ['Iterating over a dict and recursing into the keys instead of the values', 'Crashing on strings by treating them as containers', 'Forgetting that bool is a subclass of int'],
      followUps: ['How would you ignore booleans?', 'How would you make it iterative for untrusted, very deep input?', 'How would you also return the path to each number?'],
      modelAnswer: 'I would branch on the type. A number, int or float, is the base case and returns itself. A dict is a branch: I sum nested_sum over its values. A list is also a branch: I sum nested_sum over its items. Anything else — strings, None — contributes zero. That covers every type JSON can produce. Two things I’d mention: bool is a subclass of int, so if booleans shouldn’t count I check for them first; and if the input is untrusted and could be nested extremely deeply, I’d switch to an explicit stack to avoid RecursionError.',
    },
    {
      id: 'recursion-tree-walk-scenario',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You must process a user-uploaded document tree (folders, sub-folders, shortcuts that can point to other folders). Your recursive walker works in tests but hangs or crashes in production. What could be wrong, and how would you make it robust?',
      answer: 'Shortcuts can create cycles, so the walk revisits the same folders forever; and untrusted input can be deeper than the recursion limit. Fix: track visited nodes in a set, cap the depth (reject or truncate), and/or rewrite the walk iteratively with an explicit stack; consider a generator so huge trees are processed lazily.',
      explanation: py`Tests used small, acyclic, shallow trees. Real data is adversarial: a link from a child back to an ancestor makes the recursion infinite (RecursionError, or an infinite loop in an iterative version without a visited set). An explicit stack removes the depth limit; a \`visited\` set of stable ids removes cycles; a depth cap protects resources. Libraries such as \`os.walk\` don't follow symlinks by default for exactly this reason.`,
      code: { lang: 'python', code: py`def walk(root, children_of, max_depth=50):
    """Yield every node reachable from root once, depth-first, without recursion."""
    visited = set()
    stack = [(root, 0)]
    while stack:
        node, depth = stack.pop()
        if node in visited or depth > max_depth:
            continue
        visited.add(node)
        yield node
        for child in children_of(node):
            stack.append((child, depth + 1))


tree = {"root": ["a", "b"], "a": ["root"], "b": []}   # a links back to root
print(list(walk("root", tree.get)))                     # ['root', 'b', 'a']` },
      whyAsked: 'Production thinking: robustness against cycles and hostile input, not just textbook recursion.',
      mistakes: ['Raising the recursion limit as the only fix', 'Not considering cycles', 'Loading the whole tree into memory when it could be streamed'],
      followUps: ['What would you use as the visited key for files? (resolved path or inode)', 'How would you report a truncated walk to the user?', 'Breadth-first vs depth-first: when does it matter?'],
      modelAnswer: 'Two production differences would explain it. Shortcuts can form cycles — a folder linking back to an ancestor — so a naive recursive walk never terminates and ends in RecursionError. And uploaded data is untrusted, so it can simply be deeper than the recursion limit. I would rewrite the walker iteratively with an explicit stack, so depth no longer threatens the interpreter, keep a visited set keyed on a stable identifier to skip anything already processed, and enforce a maximum depth and size so a hostile upload can’t exhaust resources. Making it a generator also lets me stream nodes instead of building one huge list.',
    },
  ],

  takeaways: [
    'A recursive function needs a base case (answered directly) and a recursive case that moves strictly towards it.',
    'Each call has its own frame; the stack grows down to the base case and unwinds as results are combined on the way back.',
    'CPython limits recursion depth (sys.getrecursionlimit(), usually 1000) and has no tail-call optimisation; exceeding it raises RecursionError.',
    'Recursion is ideal for nested data — folders, JSON, trees — and divide and conquer; loops are better for flat sequences and unbounded depth.',
    'Any recursion can become a loop with an explicit stack, removing the depth limit.',
    'Overlapping sub-problems make naive recursion exponential; memoize with functools.cache / lru_cache.',
  ],
}
