// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const MEMORY_LAB = py`# Memory lab: who keeps an object alive?
import gc
import sys
import weakref

gc.collect()   # start clean, so the automatic collector won't run mid-demo


class Track:
    def __init__(self, title):
        self.title = title
        self.partner = None

    def __repr__(self):
        return f"Track({self.title!r})"


# 1. Reference counting: measure the change, not the absolute number
song = Track("Intro")
before = sys.getrefcount(song)
queue = [song, song]                  # each slot is one more reference
print("refs added by the queue:", sys.getrefcount(song) - before)
queue.clear()
print("back to before:", sys.getrefcount(song) == before)

# 2. del removes a name; the object dies with its LAST reference
probe = weakref.ref(song)             # a weak reference doesn't count
alias = song
del song
print("alive after del song:", probe() is not None)
del alias
print("alive after del alias:", probe() is not None)

# 3. A reference cycle survives reference counting...
a, b = Track("A-side"), Track("B-side")
a.partner, b.partner = b, a
probe_a = weakref.ref(a)
del a, b
print("cycle alive after del:", probe_a() is not None)
print("gc found unreachable objects:", gc.collect() > 0)
print("cycle alive after gc.collect():", probe_a() is not None)

# 4. ...and weak references never keep anything alive
covers = weakref.WeakValueDictionary()
cover = Track("Cover art")
covers["cover"] = cover
print("cached:", list(covers))
del cover
print("cached after del:", list(covers))
`

export default {
  id: 'memory-management',
  title: 'Reference counting & garbage collection',
  summary: 'CPython frees most objects the instant their last reference disappears, a cyclic garbage collector cleans up objects that only reference each other, and weak references, finalizers and tracemalloc let you keep long-running programs from leaking.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['object-model', 'variables-and-names', 'mutability-and-copying'],
  related: ['object-model', 'bytecode', 'gil-and-free-threading', 'profiling', 'context-managers', 'special-methods', 'records-and-slots', 'functools', 'closures', 'optimization-techniques', 'asyncio-in-practice', 'multiprocessing'],
  tags: ['memory management', 'reference counting', 'refcount', 'sys.getrefcount', 'garbage collection', 'gc', 'gc.collect', 'reference cycle', 'cyclic garbage collector', 'generations', 'del', '__del__', 'finalizer', 'weakref', 'WeakValueDictionary', 'WeakKeyDictionary', 'WeakSet', 'WeakMethod', 'weakref.finalize', 'memory leak', 'tracemalloc', 'immortal objects', 'pymalloc', 'CPython detail'],
  apis: [
    { name: 'sys.getrefcount(obj)', summary: 'CPython: the object’s current reference count, usually including one temporary reference for the argument itself. Use differences, not absolute values.' },
    { name: 'del name', summary: 'Removes a name binding (or an item/attribute). The object is freed only if that was its last reference.' },
    { name: 'gc.collect()', summary: 'Runs the cyclic garbage collector now and returns the number of unreachable objects it found.' },
    { name: 'gc.disable() / gc.enable() / gc.isenabled()', summary: 'Turn the automatic cyclic collector off or on. Reference counting is never disabled.' },
    { name: 'gc.get_referrers(obj)', summary: 'Debugging aid: the tracked objects that hold a reference to obj (“who keeps this alive?”).' },
    { name: 'gc.freeze()', summary: '(3.7+) Move every tracked object into a permanent generation the collector ignores — used before forking worker processes.' },
    { name: 'weakref.ref(obj, callback=None)', summary: 'A weak reference: call it to get the object back, or None once the object has been freed. Does not keep obj alive.' },
    { name: 'weakref.WeakValueDictionary / WeakKeyDictionary / WeakSet', summary: 'Containers whose entries disappear automatically when the weakly held object dies — ideal for caches and registries.' },
    { name: 'weakref.WeakMethod(bound_method)', summary: 'A weak reference to a bound method that stays valid as long as the object (not the temporary method object) lives.' },
    { name: 'weakref.finalize(obj, func, *args)', summary: 'Calls func(*args) once, when obj is freed or at interpreter exit — a safer alternative to __del__.' },
    { name: 'object.__del__(self)', summary: 'Finalizer called when the object is about to be destroyed. Timing is implementation-dependent; exceptions are only printed.' },
    { name: 'tracemalloc.start() / take_snapshot() / Snapshot.compare_to()', summary: 'Trace Python memory allocations and compare snapshots to see which lines allocated memory that is still alive.' },
  ],
  docs: [
    { label: 'Data model — objects, values and types (garbage collection)', url: 'https://docs.python.org/3/reference/datamodel.html#objects-values-and-types' },
    { label: 'gc — Garbage Collector interface', url: 'https://docs.python.org/3/library/gc.html' },
    { label: 'weakref — Weak references', url: 'https://docs.python.org/3/library/weakref.html' },
    { label: 'tracemalloc — Trace memory allocations', url: 'https://docs.python.org/3/library/tracemalloc.html' },
    { label: 'sys.getrefcount()', url: 'https://docs.python.org/3/library/sys.html#sys.getrefcount' },
    { label: 'object.__del__()', url: 'https://docs.python.org/3/reference/datamodel.html#object.__del__' },
    { label: 'C API — Memory management (pymalloc)', url: 'https://docs.python.org/3/c-api/memory.html' },
    { label: 'PEP 442 — Safe object finalization', url: 'https://peps.python.org/pep-0442/' },
    { label: 'PEP 683 — Immortal objects', url: 'https://peps.python.org/pep-0683/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every object your program creates takes up memory. Python never asks you to free that memory yourself — there is no \`free()\` and no "delete object" statement. Instead, the interpreter works out when an object can **no longer be used** and reclaims it. That job is called **memory management**, and the part that finds and frees unused objects is called **garbage collection**.`,
    py`The Python *language* only promises one thing: an object that your program can still reach is never freed. *How* and *when* unreachable objects are reclaimed is up to each implementation. **CPython** — the standard interpreter, and the one running this playground — uses two mechanisms:`,
    py`1. **Reference counting.** Every object keeps a count of how many references point at it. A *reference* is anything that refers to the object: a name, a list slot, a dict value, an attribute, an argument being passed. When the count drops to zero, the object is freed **immediately**.
2. **A cyclic garbage collector** (the \`gc\` module). It runs every now and then to find groups of objects that refer to *each other* but that nothing else can reach — a *reference cycle*, which counting alone can never free.`,
    py`On top of that you get tools to work *with* the system: **weak references** (\`weakref\`) that let you point at an object without keeping it alive, **finalizers** that run cleanup code when an object dies, and **\`tracemalloc\`** to find out which lines of code are holding on to memory. You met identity and references in [the object model](lesson:object-model); this lesson follows those references to the end of an object's life.`,
  ],
  why: [
    py`**Long-running programs leak.** A web service, a bot or a data pipeline runs for days. If something keeps references to objects you no longer need — a cache that only grows, listeners that never unsubscribe, a list of "recent requests" — memory climbs until the process is killed. Python has no dangling pointers, but it absolutely has memory leaks.`,
    py`**Cleanup timing matters.** Files, sockets, locks and database connections must be released promptly. Code that relies on CPython freeing an object (and running its \`__del__\`) "right now" works on your laptop and breaks on PyPy, in a reference cycle, or at interpreter shutdown. Knowing the rules tells you why [context managers](lesson:context-managers) exist.`,
    py`**It is a classic interview topic.** "How does Python manage memory?", "what does the GC actually collect?" and "how would you find a leak?" come up for every senior Python role — and the strong answers separate language guarantees from CPython implementation details.`,
  ],
  eli15: [
    py`Imagine every object is a **helium balloon**. Each reference to it is a **string** someone is holding: a variable holds one string, a list holding the object holds another. As long as at least one string is held, the balloon stays in the room.`,
    py`When the last person lets go of their string, the balloon floats away at once — that is **reference counting**. Python keeps a tally of strings on every balloon, so it knows the moment the tally hits zero.`,
    py`But what if two balloons are tied **to each other** and nobody is holding either? Each still has one string attached, so the tally never hits zero — yet nobody can reach them. A **janitor** (the garbage collector) walks around now and then, spots balloons that are only tied to each other, and cuts them loose.`,
    py`And a **weak reference** is like watching a balloon through binoculars: you can see it while it's there, but you aren't holding a string, so you never stop it from floating away.`,
  ],
  analogy: {
    title: 'Balloons, strings and a janitor',
    body: [
      py`In a party room, balloons stay as long as someone holds their string. Every time somebody grabs a string the tally goes up; every time someone lets go it goes down; at zero the balloon floats out of the window instantly.`,
      py`Balloons tied only to each other are the tricky case: their tallies never reach zero. So a janitor sweeps the room on a schedule, finds clusters nobody is holding and removes them. A person with binoculars can watch a balloon (and notice when it's gone) without holding a string.`,
    ],
    mapping: [
      ['a balloon', 'an object in memory'],
      ['a string someone holds', 'a reference: a name, a list slot, a dict value, an attribute'],
      ['the tally of strings', 'the object’s reference count (sys.getrefcount)'],
      ['the last string let go → balloon floats away', 'refcount hits 0 → CPython frees the object immediately'],
      ['letting go of one string (del name)', 'removing one reference — the balloon stays if others hold it'],
      ['balloons tied only to each other', 'a reference cycle that nothing outside can reach'],
      ['the janitor’s sweep', 'the cyclic garbage collector (gc.collect)'],
      ['watching through binoculars', 'a weak reference (weakref.ref) — sees the object, doesn’t keep it'],
    ],
  },
  visual: {
    type: 'memory',
    title: 'Reference counts rising and falling',
    props: { preset: 'refcount' },
    alt: 'A stepper with code on the left and a diagram on the right. Names playlist, backup and songs on the left point to a list object and a dict object. The list’s reference count goes from 1 to 2 when backup = playlist runs, to 3 when the dict stores it, back to 2 after del backup, to 1 after songs.clear(), and the list is freed the moment playlist is re-bound to None.',
    caption: py`Step through with ▶. Each arrow is one reference and the number on each object is its count. The counts are **simplified**: the real interpreter also holds a few references of its own (see \`sys.getrefcount\` below).`,
    after: [
      py`Two things to notice. \`del backup\` deleted a **name**, not the list — the list survived because other references remained. And the list was freed on the exact line where its count reached zero: no waiting, no collector. That immediacy is a **CPython detail**; there is a [weak-reference version of this stepper](/visualizers?v=memory&p=weakref) in the visualizer gallery too.`,
    ],
  },
  syntax: [
    py`#### The toolbox`,
    py`| you want to… | tool | kind of truth |
|---|---|---|
| see how many references an object has | \`sys.getrefcount(obj)\` | CPython detail |
| remove a name, item or attribute | \`del name\`, \`del items[0]\`, \`del obj.attr\` | language |
| collect reference cycles now | \`gc.collect()\` | CPython (the \`gc\` module exists elsewhere but behaves differently) |
| refer to an object without keeping it alive | \`weakref.ref\`, \`WeakValueDictionary\`, \`WeakKeyDictionary\`, \`WeakSet\`, \`WeakMethod\` | language (stdlib) |
| run cleanup when an object dies | \`weakref.finalize\` (preferred) or \`__del__\` | language; *timing* is implementation-specific |
| find which lines hold memory | \`tracemalloc\` | stdlib, CPython |`,
    py`#### Counting references with \`sys.getrefcount\``,
    { code: py`import sys

scores = [90, 85, 77]
before = sys.getrefcount(scores)

backup = scores                       # +1: a second name
table = {"ada": scores}               # +1: a dict value
print(sys.getrefcount(scores) - before)   # 2

del backup                            # -1: one name gone, list still alive
table.clear()                         # -1: the dict lets go
print(sys.getrefcount(scores) == before)  # True`, lang: 'python', title: 'measure differences, not absolute numbers' },
    { callout: 'note', title: 'CPython detail: the famous "+1" — and when it isn’t there', text: py`\`sys.getrefcount(x)\` traditionally reports **one more** than you expect, because passing \`x\` as an argument creates a temporary reference for the duration of the call. At module level in this playground, a list bound to one name reports \`2\`. But **CPython 3.14** sometimes *borrows* a reference instead of creating one — local variables inside functions are loaded this way — so inside a function the same check can report \`1\`. The docs warn that the exact value is not reliable. Compare **before/after differences at the same place in the code**, and never hard-code a count. PyPy, GraalPy and MicroPython don't use reference counting, so the number means nothing there.` },
    py`#### \`del\` removes a reference, not an object`,
    { code: py`import weakref

class Track:
    def __init__(self, title):
        self.title = title

song = Track("Intro")
probe = weakref.ref(song)    # lets us check if it is alive, without keeping it alive
playlist = [song]

del song                     # removes the NAME song
print(probe() is None)       # False: playlist still refers to the object
playlist.clear()             # the last reference disappears
print(probe() is None)       # True in CPython: freed on the spot`, lang: 'python', title: 'the object lives as long as any reference does' },
    py`#### The cyclic garbage collector: \`gc\``,
    { code: py`import gc
import weakref

class Node:
    def __init__(self, name):
        self.name = name
        self.peer = None

a, b = Node("a"), Node("b")
a.peer, b.peer = b, a        # a cycle: each keeps the other's count above zero
probe = weakref.ref(a)
del a, b                     # unreachable, but the counts are still 1

print(probe() is None)       # False: reference counting can't free a cycle
print(gc.collect() > 0)      # True: the collector found unreachable objects
print(probe() is None)       # True: the cycle is gone`, lang: 'python', title: 'cycles need the collector' },
    py`You rarely call \`gc.collect()\` yourself: the collector runs automatically when enough new container objects have been allocated. \`gc.collect()\` is for tests, debugging, and a few deliberate production moments. \`gc.disable()\` only switches off the *cycle* collector — reference counting keeps working.`,
    py`#### Weak references`,
    { code: py`import weakref

class Image:
    def __init__(self, name):
        self.name = name

thumbnails = weakref.WeakValueDictionary()   # values held weakly
photo = Image("cat.png")
thumbnails["cat"] = photo
print("cat" in thumbnails)    # True: someone else still holds the image

del photo
print("cat" in thumbnails)    # False: the entry vanished with the object

def on_gone(ref):
    print("image freed")

pic = Image("dog.png")
ref = weakref.ref(pic, on_gone)  # optional callback when the object dies
del pic                          # prints "image freed" (immediately in CPython)`, lang: 'python', title: 'weakref.ref, callbacks and weak containers' },
    py`| container | holds weakly | typical use |
|---|---|---|
| \`weakref.WeakValueDictionary\` | values | cache of objects owned elsewhere (\`id → object\`) |
| \`weakref.WeakKeyDictionary\` | keys | extra data attached to objects you don't own |
| \`weakref.WeakSet\` | members | registries of listeners / live instances |
| \`weakref.WeakMethod\` | a bound method | callbacks that must not keep their object alive |`,
    py`Not every object can be weakly referenced. Instances of your own classes can; built-in \`int\`, \`str\`, \`tuple\`, \`list\` and \`dict\` instances can't (\`TypeError: cannot create weak reference to 'list' object\`), though subclasses of \`list\` and \`dict\` can. A class with \`__slots__\` needs \`"__weakref__"\` in its slots (see [records & slots](lesson:records-and-slots)).`,
    py`#### Cleanup: \`with\` first, \`weakref.finalize\` second, \`__del__\` last`,
    { code: py`import weakref

class Connection:
    def __init__(self, dsn):
        self.dsn = dsn
        # Safety net: runs once, when the object dies OR at interpreter exit.
        # The callback must not refer to self, or self would never die.
        self._finalizer = weakref.finalize(self, print, f"closing {dsn}")

    def close(self):
        self._finalizer()          # explicit close runs it now (and only once)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

with Connection("db://orders") as conn:   # the reliable way: closes on exit
    print("querying", conn.dsn)`, lang: 'python', title: 'deterministic cleanup with a finalizer as a safety net' },
    py`#### Finding leaks: \`tracemalloc\``,
    { code: py`import tracemalloc

tracemalloc.start()
before = tracemalloc.take_snapshot()

history = [f"request-{n}" for n in range(20_000)]   # memory that stays alive

after = tracemalloc.take_snapshot()
for stat in after.compare_to(before, "lineno")[:3]:
    print(stat)     # file:line: size=... (+...), count=... (+...)
tracemalloc.stop()`, lang: 'python', title: 'which line is holding the memory?' },
  ],
  walkthrough: {
    title: 'Reading the memory lab',
    lang: 'python',
    code: MEMORY_LAB,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps inside the editor.`,
    steps: [
      { lines: [6, 6], text: py`\`gc.collect()\` at the start clears any leftover garbage, so the automatic collector is unlikely to run in the middle of our demo and blur the results. Real programs don't need this.` },
      { lines: [19, 24], text: py`We measure the reference count **before** and **after** building \`queue\`. A list holding the song twice adds exactly two references. After \`queue.clear()\` the count is back where it started. Differences are reliable; absolute values include interpreter-internal references.` },
      { lines: [27, 27], text: py`\`weakref.ref(song)\` creates a *probe*: calling \`probe()\` returns the object while it's alive and \`None\` afterwards. Crucially, a weak reference is **not** counted, so watching an object doesn't keep it alive.` },
      { lines: [28, 32], text: py`\`del song\` removes one name; \`alias\` still refers to the object, so it survives. \`del alias\` drops the **last** reference: CPython frees the object on that very line, and the probe returns \`None\`.` },
      { lines: [35, 39], text: py`Two tracks refer to each other. After \`del a, b\` nothing outside can reach them, but each still has a count of 1 — from its partner. Reference counting alone will never free them: the probe says they're alive.` },
      { lines: [40, 41], text: py`\`gc.collect()\` runs the cyclic collector. It notices that the two objects are only referenced from inside their own group, frees them, and returns how many unreachable objects it found.` },
      { lines: [44, 49], text: py`A \`WeakValueDictionary\` stores its values through weak references. While \`cover\` exists, the cache can hand the object out; once the last strong reference is deleted, the entry disappears by itself. That's the shape of a cache that can never leak.` },
    ],
  },
  playground: {
    title: 'Memory lab',
    objective: 'Run it, predict every True/False first, then change who holds references and watch objects live or die.',
    files: { 'main.py': MEMORY_LAB },
    expected: py`Nine lines:

\`\`\`text
refs added by the queue: 2
back to before: True
alive after del song: True
alive after del alias: False
cycle alive after del: True
gc found unreachable objects: True
cycle alive after gc.collect(): False
cached: ['cover']
cached after del: []
\`\`\`

The "freed immediately" results are CPython behaviour. On PyPy, objects die whenever its tracing collector next runs, so several of these lines could differ.`,
    experiments: [
      {
        id: 'strong-cache',
        task: py`Replace \`weakref.WeakValueDictionary()\` with a plain \`{}\`. Predict the last line before you run it.`,
        hint: py`Only line 44 changes. A normal dict holds a **strong** reference to each value.`,
        tests: [
          { name: 'covers is a plain dict', code: py`assert type(ns.get("covers")) is dict, 'Make covers a normal dict: covers = {}'` },
          { name: 'the cover stays cached after del', code: py`assert "cached after del: ['cover']" in output` },
        ],
        explain: py`A plain dict is one more strong reference, so \`del cover\` only removes a name and the object lives on inside the cache. That's how most real-world leaks look: a long-lived container quietly keeping objects alive. Weak containers or a size limit (\`functools.lru_cache(maxsize=...)\`) fix it.`,
      },
      {
        id: 'break-cycle',
        task: py`Break the cycle by hand: just before \`del a, b\`, set \`a.partner = None\`. Now the tracks should die **without** the garbage collector. Predict which lines change.`,
        hint: py`With one link removed, the A-side track is referenced only by the name \`a\`. When it dies, its reference to the B-side track goes too.`,
        tests: [{ name: 'the cycle is freed by reference counting alone', code: py`assert "cycle alive after del: False" in output, 'Set a.partner = None before del a, b'` }],
        explain: py`Without the cycle, \`del a, b\` drops the counts to zero and CPython frees both tracks immediately (freeing A-side drops the last reference to B-side). This is why data structures with back-links — parent pointers, doubly linked lists, observers — often use weak references for one direction.`,
      },
      {
        id: 'finalizer',
        task: py`Right after \`song = Track("Intro")\`, add \`weakref.finalize(song, print, "Intro was freed")\`. Where in the output will the message appear?`,
        hint: py`A finalizer runs when its object dies. Which line drops the *last* reference to the song?`,
        tests: [
          { name: 'the finalizer message is printed', code: py`assert "Intro was freed" in output` },
          { name: 'it runs exactly when the last reference goes', code: py`assert output.index("alive after del song") < output.index("Intro was freed") < output.index("alive after del alias"), 'The message should appear between the two "alive after del" lines'` },
        ],
        explain: py`The finalizer fires during \`del alias\` — the line that drops the last strong reference — not at \`del song\`, and not at the end of the program. \`weakref.finalize\` holds only a weak reference to the song, so registering it doesn't keep the song alive. In CPython the timing is exact; in other implementations it would run later.`,
      },
      {
        id: 'leak-hunt',
        task: py`Simulate a leak and catch it. At the end: \`import tracemalloc\`, call \`tracemalloc.start()\`, take a snapshot, append 5,000 \`Track(f"song {n}")\` objects to a module-level list called \`history\`, take a second snapshot and print the top 3 entries of \`second.compare_to(first, "lineno")\`.`,
        hint: py`\`first = tracemalloc.take_snapshot()\` … loop … \`second = tracemalloc.take_snapshot()\`, then \`for stat in second.compare_to(first, "lineno")[:3]: print(stat)\`.`,
        tests: [
          { name: 'history holds at least 5,000 tracks', code: py`assert len(ns.get("history", [])) >= 5000, 'Append 5,000 Track objects to a list named history'` },
          { name: 'tracemalloc statistics were printed', code: py`assert "size=" in output and "count=" in output, 'Print the statistics from compare_to()'` },
        ],
        explain: py`Each statistic reads \`file:line: size=… (+…), count=… (+…)\`: how much memory allocated on that line is **still alive**, and how much it grew between the snapshots. The line that builds the \`Track\` objects (and the f-strings) floats to the top — exactly how you find the culprit in a real service: snapshot, let it run, snapshot again, compare.`,
      },
    ],
  },
  animation: {
    type: 'memory',
    title: 'A cycle only the garbage collector can free',
    props: { preset: 'cycle' },
    alt: 'A stepper showing two Node objects named a and b. Each starts with a reference count of 1 from its name. a.partner = b and b.partner = a add arrows between the nodes, making each count 2. After del a, b the names disappear but each node still has a count of 1 from its partner and is marked unreachable. gc.collect() frees both and the program prints unreachable found: True.',
    caption: py`After \`del a, b\` both counts are still **1** — each node is "held" by the other — so reference counting is stuck. The cyclic collector looks at the *group* and sees that no reference comes from outside it.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every object carries a small counter: **how many references point at me?** Python updates it constantly. Binding a name, putting the object in a list, storing it as a dict value or an attribute, passing it to a function — each adds one. Re-binding the name, removing it from the list, the function returning — each takes one away.`,
      py`When the counter reaches **zero**, nobody can ever use the object again, so CPython frees it on the spot. Freeing an object also drops the references *it* was holding, which can free further objects in a chain: clearing a list of a thousand songs frees all thousand songs (if nothing else refers to them).`,
      { code: py`class Song:
    def __init__(self, title):
        self.title = title

    def __del__(self):           # a finalizer, just to make freeing visible
        print("freed", self.title)

album = [Song("One"), Song("Two")]
print("clearing...")
album.clear()                    # freed One, freed Two (CPython: right here)
print("done")`, lang: 'python', title: 'one clear() frees a whole chain' },
      py`The one thing counting can't handle is a **cycle**: objects that refer to each other. Their counts never drop to zero by themselves, so CPython also has a **cyclic garbage collector** that runs from time to time and cleans them up.`,
      py`You never free memory by hand. \`del x\` only removes the *name* \`x\` — exactly like letting go of one balloon string.`,
    ],
    technical: [
      py`**The count lives in the object header (CPython detail).** Every CPython object starts with a reference count field and a pointer to its type (see [the object model](lesson:object-model)). C code calls \`Py_INCREF\` / \`Py_DECREF\` around every use. When a decrement hits zero, the type's deallocation function runs: it drops the references the object holds (which may free more objects), runs finalizers and returns the memory to the allocator.`,
      py`**How the cyclic collector finds garbage.** It only *tracks* **container** objects — those that can refer to other objects: lists, dicts, sets, instances of your classes, functions, frames. Ints and strings can't form cycles, so they're not tracked (\`gc.is_tracked(1)\` is \`False\`, \`gc.is_tracked([])\` is \`True\`). For the objects it examines, it:`,
      py`1. copies each object's reference count into a scratch counter;
2. walks every reference **between** those objects and subtracts one for each — what remains is the number of references from *outside* the group;
3. treats objects with a remaining count above zero as reachable, along with everything reachable from them;
4. declares the rest garbage: runs their finalizers and weakref callbacks, then breaks the cycles by clearing their references, which lets ordinary reference counting free them.`,
      py`**Generations.** Most objects die young, so the collector examines recently created objects much more often than long-lived ones (objects that survive get promoted to an "older" group). \`gc.get_threshold()\`, \`gc.get_count()\` and \`gc.get_stats()\` expose the current tuning. The number of generations, the thresholds and how much work each collection does are tuning choices that CPython has changed between releases (recent versions reworked them to shorten pauses) — inspect them on your interpreter instead of memorising numbers.`,
      { callout: 'note', title: 'CPython detail: immortal objects (3.12+)', text: py`Since CPython 3.12 (PEP 683), some objects are **immortal**: \`None\`, \`True\`, \`False\`, the small ints and many interned strings. Their reference count is pinned and never changes, which saves memory writes and helps the free-threaded build. \`sys.getrefcount(None)\` therefore returns a large fixed number that differs between builds (this playground is 32-bit WebAssembly). CPython 3.14 adds \`sys._is_immortal(obj)\` to check. Don't build anything on these numbers.` },
      py`**Finalizers and cycles.** Before Python 3.4, cycles containing objects with \`__del__\` could not be collected and piled up in \`gc.garbage\`. Since PEP 442 they are collected normally: finalizers run once, in an unspecified order. \`gc.garbage\` is now mostly empty unless you set \`gc.set_debug(gc.DEBUG_SAVEALL)\` to keep every collected object for inspection.`,
      py`**A cycle you create every day.** An exception's traceback refers to the stack frames, and a frame refers to its local variables. If a local held the exception, you'd get a cycle (frame → exception → traceback → frame). That is why the language **deletes the \`as\` name at the end of an \`except\` block**: after \`except ValueError as err:\`, the name \`err\` no longer exists. Storing exceptions in long-lived objects (\`self.last_error = err\`) keeps whole frames — and all their locals — alive.`,
      py`**Where freed memory goes (CPython detail).** Small objects (up to 512 bytes) come from CPython's own allocator, *pymalloc*, which carves big blocks ("arenas") into fixed-size slots. A freed object's slot is reused for the next object of that size; an arena is returned to the operating system only when it is completely empty. So after you free millions of objects, the process's memory as seen by the OS may shrink much less than you expect. That is normal, not a leak. The free-threaded build uses a different allocator (mimalloc).`,
      { callout: 'note', title: 'Other implementations', text: py`**PyPy**, **GraalPy** and **MicroPython** don't use reference counting: they use *tracing* garbage collectors that periodically find everything reachable from the program's roots and reclaim the rest. Cycles are no special case for them, but objects are freed **later** — some time after they become unreachable — so \`__del__\`, \`weakref\` callbacks and "file closed when the object dies" all happen at unpredictable moments. Code that needs prompt cleanup must use \`with\` or explicit \`close()\` to be portable.` },
    ],
    production: [
      py`**What a Python leak really is.** Python can't lose track of memory the way C can; a "leak" is **something still holding references you no longer need**. The usual suspects in long-running services:`,
      py`- unbounded caches and "recent items" lists in module globals or singletons;
- listener/callback registries that never unsubscribe;
- \`functools.lru_cache\` on **methods**: the cache is stored on the function and its keys include \`self\`, so every instance ever used stays alive (see [functools](lesson:functools));
- exceptions or tracebacks stored for later (they pin whole frames);
- closures capturing a big object they only needed briefly (see [closures](lesson:closures));
- reference cycles created at a high rate — collected eventually, but they raise peak memory and GC work;
- C extensions leaking memory outside Python's allocators (invisible to \`tracemalloc\`).`,
      py`**How to find one.** Watch the process's memory in your monitoring first: steady growth under steady load is the signal. Then use \`tracemalloc\`: take a snapshot, let the service handle traffic, take another and \`compare_to\` — the top lines show where surviving memory was allocated. \`tracemalloc.start(25)\` keeps 25 frames per allocation so you can see *who called* the allocating line. To learn *who is holding* an object, use \`gc.get_referrers(obj)\` (slow; debugging only) or a third-party tool such as \`objgraph\`. Measure first; see [profiling](lesson:profiling).`,
      { code: py`import tracemalloc

tracemalloc.start(25)
baseline = tracemalloc.take_snapshot()
# ... let the service handle traffic for a while ...
current = tracemalloc.take_snapshot()
for stat in current.compare_to(baseline, "traceback")[:3]:
    print(stat)
    for line in stat.traceback.format()[-6:]:
        print("   ", line)`, lang: 'python', title: 'snapshot diffing with call stacks' },
      py`**Prevent them by design.** Give every cache a size limit (\`lru_cache(maxsize=1024)\`) or make it weak (\`WeakValueDictionary\`). Make back-links weak: parent pointers, observers, "owner" fields. Release resources with \`with\` (see [context managers](lesson:context-managers)), using \`weakref.finalize\` only as a safety net. And remember the reverse problem: asyncio's event loop keeps only **weak** references to tasks, so a task created with \`asyncio.create_task()\` and not stored anywhere can be garbage collected mid-flight — keep a reference (see [tasks & TaskGroup](lesson:asyncio-in-practice)).`,
      py`**Tuning the collector.** Calling \`gc.collect()\` in a loop "to save memory" usually just costs time. Two legitimate production moves: \`gc.freeze()\` (3.7+) right before a pre-fork server spawns workers — it moves existing objects out of the collector's sight so collections in the children don't write to (and therefore copy) the parent's shared memory pages (see [multiprocessing](lesson:multiprocessing)); and raising thresholds or disabling the automatic collector in carefully measured, allocation-heavy batch jobs. Both are optimisations: measure before and after.`,
    ],
  },
  mistakes: [
    {
      title: 'Relying on __del__ to release resources',
      wrong: { code: py`class Report:
    def __init__(self, path):
        self.file = open(path, "w")

    def __del__(self):
        self.file.close()        # when? maybe never (cycles, PyPy, exit)

report = Report("summary.txt")
report.file.write("ok\n")`, lang: 'python' },
      right: { code: py`class Report:
    def __init__(self, path):
        self.file = open(path, "w")

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.file.close()        # always, at a known moment

with Report("summary.txt") as report:
    report.file.write("ok\n")`, lang: 'python' },
      explanation: py`\`__del__\` runs when the object is destroyed — immediately in simple CPython cases, later in a cycle, at an unpredictable moment on PyPy, and possibly not at all for objects still alive at interpreter exit. Exceptions inside it are only printed. Use a context manager for anything that must be released; add \`weakref.finalize\` as a safety net if you like.`,
    },
    {
      title: 'Thinking del frees the object',
      wrong: { code: py`big_rows = [list(range(1000)) for _ in range(1000)]
selected = big_rows[:10]   # a new list... of references to the same rows
del big_rows               # "free the memory"
print(len(selected))       # 10 rows still alive - the other 990 were freed`, lang: 'python' },
      right: { code: py`big_rows = [list(range(1000)) for _ in range(1000)]
selected = [row.copy() for row in big_rows[:10]]  # independent copies, if needed
del big_rows               # now every original row can be freed
print(len(selected))`, lang: 'python' },
      explanation: py`\`del\` removes a **name**. Objects die only when *all* references are gone. Here the 10 selected rows survive because \`selected\` refers to them — which is usually what you want. The mistake is expecting \`del\` alone to release memory while some other structure still points at the data.`,
    },
    {
      title: 'A module-level cache that only ever grows',
      wrong: { code: py`_profiles = {}

def load_profile(user_id):
    if user_id not in _profiles:
        _profiles[user_id] = {"id": user_id, "history": [0] * 1000}
    return _profiles[user_id]`, lang: 'python' },
      right: { code: py`from functools import lru_cache

@lru_cache(maxsize=1024)          # bounded: least recently used entries are evicted
def load_profile(user_id):
    return {"id": user_id, "history": [0] * 1000}`, lang: 'python' },
      explanation: py`A global dict lives as long as the process, so every profile ever loaded stays in memory. In a service that sees millions of users that is a leak. Bound the cache, give entries an expiry, or — if the objects are owned elsewhere — hold them weakly. (Note that \`lru_cache\` returns the *same* object each time, so callers must not mutate it.)`,
    },
    {
      title: 'Storing bound methods in a WeakSet',
      wrong: { code: py`import weakref

class Logger:
    def on_save(self, name):
        print("saved", name)

listeners = weakref.WeakSet()
logger = Logger()
listeners.add(logger.on_save)   # a temporary method object...
print(len(listeners))           # 0 - it died immediately`, lang: 'python' },
      right: { code: py`import weakref

class Logger:
    def on_save(self, name):
        print("saved", name)

logger = Logger()
listener = weakref.WeakMethod(logger.on_save)  # weak on the *logger*, not the method object
callback = listener()
if callback is not None:
    callback("notes.txt")       # saved notes.txt`, lang: 'python' },
      explanation: py`\`logger.on_save\` creates a brand-new *bound method* object every time it is evaluated. Nobody else holds that object, so the weak set's entry dies at once. \`weakref.WeakMethod\` stores weak references to the instance and the function separately and rebuilds the bound method on demand, so it lives exactly as long as \`logger\`.`,
    },
    {
      title: 'A finalizer that keeps its own object alive',
      wrong: { code: py`import weakref

class TempDir:
    def __init__(self, path):
        self.path = path
        # the bound method self.cleanup holds a strong reference to self!
        weakref.finalize(self, self.cleanup)

    def cleanup(self):
        print("removing", self.path)`, lang: 'python' },
      right: { code: py`import weakref

def remove_dir(path):
    print("removing", path)

class TempDir:
    def __init__(self, path):
        self.path = path
        weakref.finalize(self, remove_dir, path)   # only the data it needs`, lang: 'python' },
      explanation: py`\`weakref.finalize\` keeps its callback and arguments alive. If they reference the object — a bound method of \`self\`, or \`self\` itself — the object can never die, and cleanup only happens at interpreter exit. Pass a plain function plus the data it needs.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: cannot create weak reference to 'list' object`,
      cause: py`Built-in \`list\`, \`dict\`, \`tuple\`, \`int\` and \`str\` instances don't support weak references (they have no slot to store them). The same error appears for a class with \`__slots__\` that doesn't include \`"__weakref__"\`.`,
      fix: py`Weakly reference an instance of your own class instead (or a \`list\`/\`dict\` subclass), or add \`"__weakref__"\` to \`__slots__\`.`,
    },
    {
      symptom: py`ReferenceError: weakly-referenced object no longer exists`,
      cause: py`You used a \`weakref.proxy\` after its object was freed. Proxies look like the real object until it dies, then fail on any use.`,
      fix: py`Prefer \`weakref.ref\`: call it, check for \`None\`, and keep the returned strong reference in a local variable while you use the object.`,
    },
    {
      symptom: py`Exception ignored while calling deallocator <function Report.__del__ at 0x...>: followed by a traceback (older versions print "Exception ignored in: <function Report.__del__ ...>")`,
      cause: py`An exception was raised inside \`__del__\`. Python can't propagate it — there is no caller to propagate to — so it prints it to stderr and carries on. Common at interpreter shutdown, when attributes or modules the method needs are already gone.`,
      fix: py`Move the cleanup into \`close()\` / \`__exit__\` and call it explicitly. If you keep a \`__del__\`, make it tiny and defensive.`,
    },
    {
      symptom: py`ResourceWarning: unclosed file <_io.TextIOWrapper name='data.csv' mode='r' encoding='UTF-8'>`,
      cause: py`A file (or socket) object was garbage collected while still open. CPython closes it for you, but warns, because on other implementations or inside a cycle the close could happen much later. The warning is hidden by default; \`python -X dev\` or \`-W default\` shows it.`,
      fix: py`Open files with \`with open(...) as f:\`. Run your test suite with warnings enabled so these show up early.`,
    },
    {
      symptom: py`The process's memory grows steadily for hours under constant load, until the container is killed (or MemoryError).`,
      cause: py`Something long-lived keeps accumulating references: a cache without a limit, a registry, stored exceptions, an \`lru_cache\` on a method, or an extension leaking outside Python's allocator.`,
      fix: py`Compare \`tracemalloc\` snapshots taken some time apart and look at the top lines; use \`gc.get_referrers()\` on a suspicious object to see who holds it. Bound or weaken the container you find.`,
    },
  ],
  bestPractices: [
    'Release files, sockets, locks and connections with with / close() — never rely on garbage collection timing.',
    'Give every long-lived cache a size limit or hold its values weakly.',
    'Make back-links (parent pointers, observers, owners) weak references to avoid cycles and leaks.',
    'Use weakref.finalize instead of __del__ for cleanup safety nets, and never let the callback reference the object.',
    'Treat sys.getrefcount as a CPython debugging aid: compare differences, never hard-code a count.',
    'Find leaks by measuring — tracemalloc snapshot diffs and gc.get_referrers — before changing code.',
    'Leave the cyclic GC on; tune or freeze it only with measurements (e.g. gc.freeze() before forking workers).',
  ],
  useCases: [
    'Caching expensive objects (images, parsed documents) that are owned elsewhere, with WeakValueDictionary.',
    'Attaching metadata to objects you don’t control, with WeakKeyDictionary.',
    'Event systems whose listeners must not be kept alive by the publisher (WeakSet / WeakMethod).',
    'Tree and graph structures with parent links that should not form strong cycles.',
    'Hunting a memory leak in a long-running service with tracemalloc snapshot comparisons.',
    'Reducing copy-on-write memory in pre-fork servers with gc.freeze().',
  ],
  whenToUse: {
    use: [
      'A weak reference when another part of the program owns the object and you only want to use it while it exists.',
      'A weak container for caches/registries keyed by objects whose lifetime you don’t control.',
      'weakref.finalize as a last-resort cleanup for objects that wrap external resources.',
      'gc.collect() in tests and debugging sessions to make cycle collection deterministic.',
    ],
    avoid: [
      'Weak references as the only reference to something you still need — it will disappear.',
      '__del__ for important cleanup (use with / close()).',
      'Calling gc.collect() routinely in production code “to save memory”.',
      'Logic that depends on exact reference counts or on objects being freed at a particular moment.',
    ],
  },
  comparison: {
    title: 'Three ways a Python implementation reclaims memory',
    headers: ['', 'Reference counting (CPython)', 'Cyclic GC (CPython gc module)', 'Tracing GC (PyPy, GraalPy, MicroPython)'],
    rows: [
      ['When is an object freed?', 'The instant its count reaches zero', 'At the next collection that examines it', 'Some time after it becomes unreachable'],
      ['Handles cycles?', 'No', 'Yes — that is its whole job', 'Yes, naturally'],
      ['Cost', 'A little work on every reference change', 'Periodic pauses proportional to the objects examined', 'Periodic (often incremental) pauses; no per-reference cost'],
      ['__del__ / weakref callbacks run…', 'Immediately, on the freeing line', 'During the collection', 'Later, at an unpredictable moment'],
      ['You can control it with…', 'Nothing (always on)', 'gc.collect, gc.disable, gc.set_threshold, gc.freeze', 'Implementation-specific options'],
    ],
    note: py`Only the last two behaviours are promised by the language: reachable objects are never freed, and unreachable ones *may* be reclaimed. Everything about timing is an implementation detail.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'memory-management-q1',
      type: 'mcq',
      prompt: 'In CPython, when is an object that is **not** part of a reference cycle freed?',
      options: [
        'As soon as its reference count drops to zero',
        { text: 'As soon as del is used on a name that refers to it', why: 'del removes one reference (the name). If anything else still refers to the object, it stays alive.' },
        { text: 'The next time the garbage collector runs', why: 'The cyclic collector is only needed for cycles. Ordinary objects are freed immediately by reference counting.' },
        { text: 'When the function that created it returns', why: 'Objects outlive the function that created them if they are returned or stored somewhere. Only the function’s local references disappear.' },
      ],
      answer: 0,
      explanation: py`Reference counting frees an object on the exact operation that removes its last reference — a \`del\`, a re-binding, a list being cleared, a function's local going out of scope. The cyclic collector exists for the remaining case: groups of objects that keep each other's counts above zero.`,
    },
    {
      id: 'memory-management-q2',
      type: 'output',
      prompt: 'What does this print in CPython?',
      code: py`import weakref

class Song:
    pass

hit = Song()
probe = weakref.ref(hit)
playlist = [hit]
del hit
print(probe() is None)
playlist.clear()
print(probe() is None)`,
      options: [
        { text: 'True, True', why: 'After del hit the list still holds a strong reference, so the object is alive and probe() returns it.' },
        'False, True',
        { text: 'False, False', why: 'playlist.clear() removes the last strong reference. The weak reference doesn’t count, so CPython frees the object right there and probe() returns None.' },
        { text: 'True, False', why: 'Objects never come back to life once a weak reference reports them dead — and here the first check sees a living object.' },
      ],
      answer: 1,
      explanation: py`\`del hit\` removes one of two strong references; the list keeps the song alive, so the first line prints \`False\`. Clearing the list drops the last strong reference, the song is freed immediately (CPython), and the weak reference now returns \`None\`: \`True\`.`,
    },
    {
      id: 'memory-management-q3',
      type: 'output',
      prompt: 'Predict the output (CPython). Hint: it is a *difference* of two counts.',
      code: py`import sys

scores = [90, 85]
before = sys.getrefcount(scores)
table = {"ada": scores, "ben": scores}
print(sys.getrefcount(scores) - before)`,
      answer: '2',
      accept: ['2'],
      explanation: py`The dict holds two values, and both refer to the same list: two new references. The temporary "+1" from passing \`scores\` to \`getrefcount\` appears in both measurements, so it cancels out. That's why differences are reliable while absolute counts aren't.`,
    },
    {
      id: 'memory-management-q4',
      type: 'bug',
      prompt: 'The button never calls the logger, and `len(button.listeners)` prints `0`. What is the bug?',
      code: py`import weakref

class Button:
    def __init__(self):
        self.listeners = weakref.WeakSet()

    def subscribe(self, callback):
        self.listeners.add(callback)

class Logger:
    def on_click(self):
        print("clicked")

button = Button()
logger = Logger()
button.subscribe(logger.on_click)
print(len(button.listeners))`,
      options: [
        { text: 'A WeakSet cannot store functions or methods', why: 'It can store any weakly-referenceable object, including bound methods. The problem is that it stores them weakly.' },
        '`logger.on_click` builds a new temporary bound-method object; the WeakSet holds the only (weak) reference to it, so it dies immediately',
        { text: 'The logger object was garbage collected', why: 'The global name logger still refers to the Logger instance, so it is alive.' },
        { text: 'subscribe() should return the callback', why: 'Returning it would not change what the WeakSet holds.' },
      ],
      answer: 1,
      explanation: py`Each evaluation of \`logger.on_click\` creates a fresh bound method. Nothing but the WeakSet refers to that object, so CPython frees it the moment \`subscribe\` returns. Use \`weakref.WeakMethod(callback)\` for bound methods (and plain \`weakref.ref\` for functions), or store strong references and provide an explicit \`unsubscribe\`.`,
    },
    {
      id: 'memory-management-q5',
      type: 'fill',
      prompt: 'Complete the leak-hunting snippet so it prints the three lines whose surviving allocations grew the most.',
      code: py`import tracemalloc

tracemalloc.___()
before = tracemalloc.take_snapshot()
log_lines = [f"request {n}" for n in range(50_000)]
after = tracemalloc.take_snapshot()
for stat in after.___(before, "lineno")[:3]:
    print(stat)`,
      answer: [['start', 'start()'], ['compare_to', 'compare_to(']],
      explanation: py`\`tracemalloc.start()\` begins tracing allocations (snapshots are only possible while tracing). \`Snapshot.compare_to(old, "lineno")\` returns statistics sorted by the biggest growth, grouped by source line.`,
    },
    {
      id: 'memory-management-q6',
      type: 'mcq',
      prompt: 'Which statement is guaranteed by the Python **language**, not just by CPython?',
      options: [
        { text: 'An object is freed the instant its last reference disappears.', why: 'That is CPython’s reference counting. PyPy, GraalPy and MicroPython free objects later.' },
        'An object that is still reachable is never freed.',
        { text: '__del__ is always called before the program exits.', why: 'The docs explicitly say it is not guaranteed for objects that still exist when the interpreter exits.' },
        { text: 'sys.getrefcount(x) returns the number of names bound to x.', why: 'It counts every kind of reference (list slots, attributes, the call’s own temporary one), and it is only meaningful on reference-counting implementations.' },
      ],
      answer: 1,
      explanation: py`The language reference says objects are never explicitly destroyed; unreachable objects *may* be garbage collected, an implementation may postpone or even omit collection, but it must never collect an object that is still reachable. Everything about *when* is implementation detail.`,
    },
    {
      id: 'memory-management-q7',
      type: 'short',
      prompt: 'Why is relying on `__del__` to close a database connection a bad idea, and what should you use instead?',
      answer: py`\`__del__\` runs when the object is destroyed, and *when* that happens isn't under your control: immediately only in simple CPython cases; later if the object is in a reference cycle; at an unpredictable moment on PyPy and other tracing-GC implementations; possibly never for objects alive at interpreter exit. Exceptions inside it are only printed. Use a context manager (\`with\`) or an explicit \`close()\` so the connection is released at a known point, optionally with \`weakref.finalize\` as a safety net.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'weak-parent-links',
      title: 'Folders that let go',
      difficulty: 'advanced',
      prompt: py`A folder tree has links in both directions: a parent lists its children, and each child knows its parent. Strong links both ways form **reference cycles**, so a dropped tree waits for the garbage collector. Make the child → parent link **weak**.

Write a class \`Folder\`:

- \`Folder(name, parent=None)\` stores \`name\` and an empty list \`children\`; if \`parent\` is given, the new folder appends itself to \`parent.children\`.
- a read-only property \`parent\` returns the parent \`Folder\` (or \`None\` for a root, or if the parent no longer exists).
- \`path()\` returns the names from the root down, joined with \`/\`: \`"root/docs/notes"\`.

The tests check \`path()\`, \`parent\`, \`children\`, and that when all names are deleted **with the automatic garbage collector disabled**, the whole tree is freed by reference counting alone.`,
      files: {
        'main.py': py`import weakref


class Folder:
    def __init__(self, name, parent=None):
        self.name = name
        self.children = []
        self.parent = parent          # TODO: a strong link back creates a cycle
        if parent is not None:
            parent.children.append(self)

    def path(self):
        if self.parent is None:
            return self.name
        return self.parent.path() + "/" + self.name


root = Folder("root")
docs = Folder("docs", parent=root)
notes = Folder("notes", parent=docs)
print(notes.path())
`,
      },
      hints: [
        'The cycle is parent → children list → child → parent. The parent “owns” its children, so the link back to the parent is the one to weaken.',
        'Store weakref.ref(parent) in a private attribute such as self._parent, and expose a @property parent that calls it.',
        'self._parent = weakref.ref(parent) if parent is not None else None, and in the property: return self._parent() if self._parent is not None else None',
      ],
      solution: {
        explanation: py`The parent owns its children through the strong \`children\` list; each child only *observes* its parent through \`weakref.ref\`. There is no strong cycle any more, so when the last name for the root disappears its count hits zero, CPython frees it, the \`children\` list goes with it, and each child is freed in turn — no garbage collector needed. The \`parent\` property calls the weak reference, returning \`None\` if the parent has already been freed, so callers never touch a dead object. On implementations with a tracing GC the tree is still reclaimed correctly, just not instantly.`,
        files: {
          'main.py': py`import weakref


class Folder:
    def __init__(self, name, parent=None):
        self.name = name
        self.children = []
        self._parent = weakref.ref(parent) if parent is not None else None
        if parent is not None:
            parent.children.append(self)

    @property
    def parent(self):
        """The parent folder, or None for a root (or a parent that no longer exists)."""
        return self._parent() if self._parent is not None else None

    def path(self):
        parent = self.parent
        if parent is None:
            return self.name
        return parent.path() + "/" + self.name


root = Folder("root")
docs = Folder("docs", parent=root)
notes = Folder("notes", parent=docs)
print(notes.path())
`,
        },
      },
      tests: [
        { name: 'path() joins names from the root', code: py`root = Folder("r")
music = Folder("music", parent=root)
jazz = Folder("jazz", parent=music)
assert jazz.path() == "r/music/jazz"` },
        { name: 'parent returns the parent folder, or None for a root', code: py`root = Folder("r")
music = Folder("music", parent=root)
assert music.parent is root
assert root.parent is None` },
        { name: 'children are registered on the parent', code: py`root = Folder("r")
a = Folder("a", parent=root)
b = Folder("b", parent=root)
assert root.children == [a, b]` },
        { name: 'a dropped tree is freed without the garbage collector', code: py`import gc
import weakref
gc.disable()
try:
    root = Folder("r")
    music = Folder("music", parent=root)
    jazz = Folder("jazz", parent=music)
    probes = [weakref.ref(root), weakref.ref(music), weakref.ref(jazz)]
    del root, music, jazz
    alive = [p() for p in probes if p() is not None]
    assert not alive, "The tree is still alive: the child -> parent link must be a weak reference"
finally:
    gc.enable()` },
      ],
    },
    {
      id: 'net-allocated',
      title: 'Measure what stays allocated',
      difficulty: 'intermediate',
      prompt: py`Write \`net_allocated(func)\` that calls \`func()\` and returns how many bytes of Python memory are **still allocated** afterwards — the traced memory after the call minus the traced memory before it — using \`tracemalloc.get_traced_memory()\` (it returns \`(current, peak)\`; use \`current\`).

Rules:

- If tracing is not already on, start it before measuring and **stop it afterwards**, even if \`func\` raises (the exception must still propagate).
- If tracing *was* already on, leave it on.
- Return an \`int\`.

The tests check that a function which keeps 10,000 strings alive reports more than 100,000 bytes, that a function which only builds temporary data reports less than 20,000 bytes, and the start/stop rules above.`,
      files: {
        'main.py': py`import tracemalloc


def net_allocated(func):
    # TODO: measure traced memory before and after func()
    func()
    return 0


kept = []


def remember_events():
    for n in range(10_000):
        kept.append(f"event-{n:05d}")


print("bytes still allocated:", net_allocated(remember_events))
`,
      },
      hints: [
        'tracemalloc.get_traced_memory()[0] is the number of bytes currently allocated by traced Python code.',
        'Remember whether tracing was on with tracemalloc.is_tracing(), and put the measurement in try/finally so you can stop tracing on every path.',
        'already = tracemalloc.is_tracing(); if not already: tracemalloc.start(); try: before = ...; func(); after = ... finally: if not already: tracemalloc.stop(); return after - before',
      ],
      solution: {
        explanation: py`\`get_traced_memory()[0]\` is the total size of all traced blocks that are still alive. Reading it before and after the call gives the **net** growth: temporary objects that \`func\` created and dropped have already been freed (immediately, thanks to reference counting) and don't count; objects it stored somewhere long-lived do. The \`try/finally\` guarantees tracing is switched off again even when \`func\` raises — tracing slows every allocation down, so leaving it on by accident is a real cost. Remembering \`is_tracing()\` first makes the helper safe to call while someone else is already tracing. Note the limits: \`tracemalloc\` sees only memory allocated through Python's allocators, not memory a C library allocates directly.`,
        files: {
          'main.py': py`import tracemalloc


def net_allocated(func):
    """Bytes still allocated by Python code after calling func()."""
    already_tracing = tracemalloc.is_tracing()
    if not already_tracing:
        tracemalloc.start()
    try:
        before, _peak = tracemalloc.get_traced_memory()
        func()
        after, _peak = tracemalloc.get_traced_memory()
    finally:
        if not already_tracing:
            tracemalloc.stop()
    return after - before


kept = []


def remember_events():
    for n in range(10_000):
        kept.append(f"event-{n:05d}")


print("bytes still allocated:", net_allocated(remember_events))
`,
        },
      },
      tests: [
        { name: 'memory kept alive by func is reported', code: py`store = []
def leaky():
    for n in range(10_000):
        store.append(f"order-{n:05d}")
assert net_allocated(leaky) > 100_000` },
        { name: 'temporary data is not counted', code: py`def tidy():
    temp = [f"order-{n:05d}" for n in range(10_000)]
    return len(temp)
assert net_allocated(tidy) < 20_000` },
        { name: 'returns an int', code: py`assert isinstance(net_allocated(lambda: None), int)` },
        { name: 'tracing is stopped afterwards', code: py`import tracemalloc
net_allocated(lambda: [0] * 100)
assert not tracemalloc.is_tracing(), 'Stop tracing if you started it'` },
        { name: 'tracing is stopped even if func raises', code: py`import tracemalloc
def boom():
    raise ValueError("bad input")
with raises(ValueError):
    net_allocated(boom)
assert not tracemalloc.is_tracing(), 'Use try/finally so tracing stops on errors too'` },
        { name: 'tracing that was already on is left on', code: py`import tracemalloc
tracemalloc.start()
try:
    net_allocated(lambda: None)
    assert tracemalloc.is_tracing(), 'Do not stop tracing that someone else started'
finally:
    tracemalloc.stop()` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'memory-management-how-freed',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How does CPython decide when to free an object?',
      answer: 'Mainly by reference counting: every object counts the references to it and is freed the moment that count reaches zero. A separate cyclic garbage collector periodically finds groups of objects that only reference each other and frees them too.',
      explanation: py`Every name binding, container slot, attribute and argument is a reference. CPython increments and decrements counts as references come and go; at zero, the object's deallocator runs right away and drops the references the object held, possibly freeing more objects. Cycles never reach zero on their own, so the \`gc\` module's collector examines container objects, subtracts the references that come from inside the group, and frees groups nothing outside can reach. The language itself only guarantees that reachable objects are never freed; timing is implementation-specific.`,
      whyAsked: 'It is the entry point to every memory question: leaks, cleanup timing, the GIL and C extensions all build on it.',
      mistakes: ['Saying del frees the object', 'Describing only the garbage collector and forgetting reference counting', 'Presenting CPython’s behaviour as a language rule'],
      followUps: ['What can reference counting not handle?', 'What does gc.disable() turn off?', 'How do PyPy or MicroPython differ?'],
      modelAnswer: 'CPython uses reference counting as its main mechanism. Every object stores how many references point to it — names, list slots, attributes, arguments — and the count is updated as those come and go. When it drops to zero the object is freed immediately, and that can cascade to the objects it was holding. The one gap is reference cycles, where objects keep each other’s counts above zero, so CPython also runs a cyclic garbage collector from time to time to find groups that nothing outside can reach. All of that is CPython-specific: the language only promises that reachable objects stay alive, and PyPy, for example, uses a tracing collector instead.',
    },
    {
      id: 'memory-management-getrefcount-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Run at module level in CPython, what does this print — and why is it not 1?',
      code: { lang: 'python', code: py`import sys

basket = ["apple"]
print(sys.getrefcount(basket))` },
      options: ['1', '2', '3', 'It raises TypeError'],
      correctOption: 1,
      answer: '2: one reference from the name basket, plus the temporary reference created by passing it as the argument to getrefcount.',
      explanation: py`The docs say the count is "generally one higher than you might expect" because of the argument reference. Two caveats show depth: CPython 3.14 can *borrow* references for local variables, so the same check inside a function may print 1; and immortal objects such as \`None\` or small ints report a large fixed number. That's why you compare differences, not absolute values.`,
      whyAsked: 'It checks that you have actually used the function and understand that the call itself is a reference.',
      mistakes: ['Answering 1', 'Treating getrefcount as an exact, portable number', 'Not knowing that it is CPython-specific'],
      followUps: ['What would sys.getrefcount(None) print, and why?', 'Why might the result differ inside a function in 3.14?', 'How would you count references in a test reliably?'],
      modelAnswer: 'It prints 2 in CPython at module level. One reference is the name basket, and the other is temporary: passing basket into getrefcount creates a reference for the duration of the call, and the docs warn about exactly that. I would never rely on the absolute value, though. In CPython 3.14 the interpreter sometimes borrows references for local variables, so inside a function you can see 1, and immortal objects like None report a huge constant. If I need to check references in a test, I compare a before and after difference at the same spot in the code.',
    },
    {
      id: 'memory-management-cycle-detection',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Why can’t reference counting free reference cycles, and how does CPython’s cyclic garbage collector find them?',
      answer: 'In a cycle every object is referenced by another member, so no count reaches zero even when nothing outside can reach the group. The collector tracks container objects, subtracts all references that come from inside the set it examines, and whatever still has a positive count is referenced from outside and therefore reachable, along with everything it reaches. The rest is unreachable garbage: finalizers run and the cycle is broken.',
      explanation: py`Only containers are tracked, because only they can form cycles. The algorithm copies each refcount to a scratch field, walks the internal references subtracting one per edge, then marks objects with remaining counts (and everything reachable from them) as alive. Unreachable objects get their weakref callbacks and finalizers handled (PEP 442 made \`__del__\` in cycles safe since 3.4), then are cleared so ordinary reference counting frees them. Collections are generational because most objects die young; the exact tuning has changed between versions. The \`except ... as err\` name being deleted at the end of the block exists precisely to avoid a frame/traceback cycle.`,
      code: { lang: 'python', code: py`import gc
import weakref

class Node:
    pass

a, b = Node(), Node()
a.other, b.other = b, a
probe = weakref.ref(a)
del a, b
print(probe() is None)    # False: counts are still 1
gc.collect()
print(probe() is None)    # True` },
      whyAsked: 'It separates people who know “Python has a GC” from people who understand what the GC actually does and why it is needed on top of refcounting.',
      mistakes: ['Saying the GC scans all memory from roots like a JVM collector', 'Thinking the GC handles all freeing in CPython', 'Claiming objects with __del__ in cycles are never collected (true only before 3.4)'],
      followUps: ['Which objects does the collector track?', 'What are generations and why do they help?', 'What does gc.freeze() do and when would you use it?'],
      modelAnswer: 'With a cycle, say two objects that point at each other, each one always has at least one reference — from its partner — so the counts never fall to zero even after the program loses every way to reach them. CPython’s cyclic collector handles that. It only tracks container objects, since only they can form cycles. For the objects it examines, it copies their reference counts, subtracts every reference that comes from inside that group, and anything left with a positive count must be referenced from outside, so it and everything it reaches is alive. The rest is unreachable: the collector runs finalizers and weakref callbacks, then clears the references to break the cycle and lets refcounting free the memory. It is generational because most objects die young, and those tuning details have changed between versions.',
    },
    {
      id: 'memory-management-leak-hunt',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 5,
      question: 'A long-running worker’s memory grows steadily over a day under constant load, then it is OOM-killed. Python has a garbage collector — so how is this possible, and how do you find the cause?',
      answer: 'In Python a leak means something still references objects you no longer need, so the GC is right not to free them. Confirm the growth in monitoring, then compare tracemalloc snapshots taken some time apart to find the lines whose surviving allocations grow, and use gc.get_referrers (or objgraph) to see what holds those objects. Typical causes: unbounded caches or lists, listener registries, lru_cache on methods, stored exceptions, or a C extension leaking outside Python’s allocator.',
      explanation: py`Garbage collection only frees *unreachable* objects. A global dict that collects every request, a registry that is never pruned or a stored traceback keeps everything reachable. \`tracemalloc\` attributes surviving memory to source lines (\`start(25)\` keeps call stacks); \`compare_to\` between two snapshots shows growth. If tracemalloc shows nothing but the process still grows, suspect native memory (C extensions) or allocator fragmentation, and use OS-level tools.`,
      code: { lang: 'python', code: py`import tracemalloc

tracemalloc.start(25)
first = tracemalloc.take_snapshot()
# ... process a few thousand jobs ...
second = tracemalloc.take_snapshot()
for stat in second.compare_to(first, "lineno")[:5]:
    print(stat)` },
      whyAsked: 'Memory growth incidents are common in services; this tests a methodical, measurement-first approach.',
      mistakes: ['Saying “Python can’t leak, it has a GC”', 'Calling gc.collect() in a loop as the fix', 'Guessing at causes without measuring', 'Forgetting that native memory is invisible to tracemalloc'],
      followUps: ['How would you tell a real leak from pymalloc not returning memory to the OS?', 'Why can lru_cache on a method leak?', 'What would you add to the code so it can’t happen again?'],
      modelAnswer: 'The garbage collector only frees objects that are unreachable, so a Python leak is really something that keeps references alive — a cache with no limit, a list of recent requests, listeners that never unsubscribe, an lru_cache on a method holding every self, or exceptions stored with their tracebacks. I would first confirm the growth pattern in monitoring, then reproduce it with tracemalloc: take a snapshot, let the worker process jobs, take another and compare them by line, ideally with a traceback depth so I see the callers. Once I know which objects pile up, gc.get_referrers or objgraph tells me who holds them. The fix is usually bounding or weakening a container, plus a regression test that measures memory. If tracemalloc shows nothing, I would suspect a C extension and use native tools.',
    },
    {
      id: 'memory-management-cleanup-options',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `__del__`, `weakref.finalize` and context managers for releasing an external resource such as a temporary directory or a database connection.',
      answer: 'Context managers (with / close()) release at a known point and are the primary tool. weakref.finalize is a good safety net: it runs once, when the object dies or at interpreter exit, and is not affected by the __del__ pitfalls. __del__ is the weakest option: its timing depends on the implementation and on cycles, exceptions are only printed, and it may not run at exit.',
      explanation: py`\`__del__\` is called when the object is destroyed — immediate only for simple CPython cases. \`weakref.finalize(obj, func, *args)\` holds a weak reference to \`obj\` and strong references to \`func\`/\`args\`; it can be called explicitly (idempotent), checked with \`.alive\`, and by default runs at exit too. Its one trap: the callback must not reference \`obj\` (no bound methods of \`obj\`). \`tempfile.TemporaryDirectory\` is a stdlib example that combines a context manager with \`weakref.finalize\`.`,
      whyAsked: 'Resource cleanup bugs (file descriptor exhaustion, leaked connections, stray temp files) are common and the answer reveals understanding of object lifetime.',
      mistakes: ['Recommending __del__ as the normal way to clean up', 'Passing self.cleanup to weakref.finalize', 'Not knowing that finalize also runs at interpreter exit'],
      followUps: ['Why must the finalize callback not refer to the object?', 'What happens to exceptions raised in __del__?', 'How does tempfile.TemporaryDirectory clean up if you forget to call cleanup()?'],
      modelAnswer: 'My primary tool is a context manager or an explicit close, because it releases the resource at a point I choose and works on every Python implementation. As a safety net for callers who forget, I would register weakref.finalize in the constructor: it runs exactly once, either when the object is freed or at interpreter exit, and calling it from close makes the explicit path and the fallback share one code path. The catch is that the callback and its arguments must not reference the object, otherwise it never dies. I would avoid __del__: its timing depends on the implementation and on reference cycles, exceptions in it are only printed, and it is not guaranteed to run at shutdown.',
    },
    {
      id: 'memory-management-weak-cache',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Fix `ThumbnailCache` so it still computes each image’s thumbnail only once, but no longer keeps images alive: when the last outside reference to an image disappears, its entry must vanish from the cache. Keep `get(image)`, `misses` and `len(cache)` working.',
      answer: 'Replace the plain dict with weakref.WeakKeyDictionary(): entries are keyed by the image through a weak reference and are removed automatically when the image is freed.',
      explanation: py`The cache attaches derived data (a thumbnail) to objects it doesn't own — exactly what \`WeakKeyDictionary\` is for. Keys must be hashable and weakly referenceable; instances of ordinary classes are both (identity-based hash). If the values were the expensive objects owned elsewhere, \`WeakValueDictionary\` would be the right choice instead. On CPython the entry disappears immediately; on tracing-GC implementations it disappears after the next collection.`,
      starter: { files: { 'main.py': py`import weakref


class Image:
    def __init__(self, name):
        self.name = name


def make_thumbnail(image):
    return f"thumb:{image.name}"


class ThumbnailCache:
    def __init__(self):
        self._cache = {}          # TODO: this keeps every image alive forever
        self.misses = 0

    def get(self, image):
        if image not in self._cache:
            self.misses += 1
            self._cache[image] = make_thumbnail(image)
        return self._cache[image]

    def __len__(self):
        return len(self._cache)


cache = ThumbnailCache()
cat = Image("cat.png")
print(cache.get(cat), cache.get(cat), cache.misses)
` } },
      tests: [
        { name: 'each image is computed only once', code: py`c = ThumbnailCache()
img = Image("a.png")
assert c.get(img) == "thumb:a.png"
assert c.get(img) == "thumb:a.png"
assert c.misses == 1` },
        { name: 'different images get their own entries', code: py`c = ThumbnailCache()
x, y = Image("x.png"), Image("y.png")
c.get(x)
c.get(y)
assert len(c) == 2 and c.misses == 2` },
        { name: 'the cache does not keep images alive', code: py`import gc
import weakref
c = ThumbnailCache()
img = Image("big.png")
probe = weakref.ref(img)
c.get(img)
del img
gc.collect()
assert probe() is None, 'The cache still holds a strong reference to the image'` },
        { name: 'entries disappear when their image is freed', code: py`import gc
c = ThumbnailCache()
img = Image("tmp.png")
c.get(img)
del img
gc.collect()
assert len(c) == 0` },
      ],
      solution: { files: { 'main.py': py`import weakref


class Image:
    def __init__(self, name):
        self.name = name


def make_thumbnail(image):
    return f"thumb:{image.name}"


class ThumbnailCache:
    def __init__(self):
        self._cache = weakref.WeakKeyDictionary()   # keys held weakly
        self.misses = 0

    def get(self, image):
        if image not in self._cache:
            self.misses += 1
            self._cache[image] = make_thumbnail(image)
        return self._cache[image]

    def __len__(self):
        return len(self._cache)


cache = ThumbnailCache()
cat = Image("cat.png")
print(cache.get(cat), cache.get(cat), cache.misses)
` } },
      hints: ['The cache attaches data to objects it doesn’t own. Which weak container holds its *keys* weakly?', 'weakref.WeakKeyDictionary() is a drop-in replacement for the dict here.'],
      whyAsked: 'Caches are the most common source of leaks; choosing the right weak container shows practical understanding of object lifetime.',
      mistakes: ['Using WeakValueDictionary when the values are plain strings (str can’t be weakly referenced)', 'Keying by id(image), which can be reused after the image dies', 'Adding manual delete calls that callers will forget'],
      followUps: ['When would you use WeakValueDictionary instead?', 'Why is keying a cache by id(obj) dangerous?', 'How would you also cap the cache size?'],
      modelAnswer: 'The cache attaches derived data to images it doesn’t own, so the images should be weak keys: I would replace the dict with weakref.WeakKeyDictionary. Lookups and stores work exactly as before, but the dictionary only holds weak references to the keys, so when the last outside reference to an image goes away, the image is freed and its entry disappears automatically — immediately in CPython, after the next collection elsewhere. The keys need to be hashable and weak-referenceable, which ordinary class instances are. If instead the expensive objects were the values and owned by someone else, I would use WeakValueDictionary.',
    },
    {
      id: 'memory-management-gc-tuning',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team runs a pre-fork web server (a master process loads the app, then forks many workers). Someone proposes `gc.disable()` everywhere “for performance”. What do you recommend instead, and why?',
      answer: 'Keep the collector on by default. If the concern is memory shared between forked workers, call gc.freeze() in the master just before forking so collections in the workers don’t touch the inherited objects and trigger copy-on-write. Consider raising thresholds only with measurements, and never disable collection without proving the app doesn’t create cycles at a meaningful rate.',
      explanation: py`After \`fork()\`, parent and child share memory pages until one of them writes to a page. Every collection writes to the GC headers of the objects it examines, which can force the OS to copy shared pages into each worker. \`gc.freeze()\` (3.7+) moves all currently tracked objects into a permanent generation that future collections ignore, so the inherited heap stays shared. Disabling the collector entirely means every cycle leaks — exceptions with tracebacks, objects with back-links, some framework internals — so memory grows until restart. Reference counting keeps running either way, and in CPython it also writes to shared pages, so the copy-on-write problem cannot be eliminated completely.`,
      whyAsked: 'It tests whether you can reason about GC internals, OS memory behaviour and production trade-offs together — and resist cargo-cult tuning.',
      mistakes: ['Thinking gc.disable() stops all memory management', 'Disabling the GC without measuring cycle creation', 'Not knowing about gc.freeze()'],
      followUps: ['Why does reference counting also cause copy-on-write?', 'How would you measure the effect of the change?', 'What else lowers per-worker memory in a pre-fork server?'],
      modelAnswer: 'I would push back on disabling the collector everywhere. gc.disable only stops the cycle collector, so every reference cycle the app creates — exceptions with tracebacks, parent links, framework internals — would simply leak until restart. If the real goal is sharing memory across forked workers, the right tool is gc.freeze in the master right before forking: it moves the existing objects into a permanent generation the collector ignores, so collections in the workers don’t write to those shared pages and trigger copy-on-write. Beyond that, I would only tune thresholds with before-and-after measurements of latency and memory, and I would note that reference counting itself still writes to object headers, so some page copying is unavoidable in CPython.',
    },
  ],

  takeaways: [
    'CPython frees an object the moment its reference count reaches zero; names, container slots, attributes and arguments are all references.',
    'del removes a reference (a name, item or attribute), never the object itself.',
    'Reference cycles keep counts above zero; the cyclic garbage collector (gc) finds and frees groups nothing outside can reach.',
    'The language only guarantees that reachable objects stay alive — immediate freeing, sys.getrefcount and gc details are CPython specifics (PyPy, GraalPy and MicroPython use tracing collectors).',
    'sys.getrefcount includes a temporary argument reference (CPython 3.14 can borrow it away inside functions): compare differences, never absolute values.',
    'Weak references (ref, WeakValueDictionary, WeakKeyDictionary, WeakSet, WeakMethod) observe objects without keeping them alive — ideal for caches, registries and back-links.',
    'Release resources with with/close(); weakref.finalize is the safe fallback, __del__ the last resort.',
    'A Python memory leak is an unwanted reference: find it with tracemalloc snapshot diffs and gc.get_referrers, then bound or weaken the container.',
  ],
}
