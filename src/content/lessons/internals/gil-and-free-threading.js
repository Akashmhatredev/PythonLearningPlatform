// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const GIL_LAB = py`# GIL lab: inspect this interpreter, then model the GIL (simplified)
import dis
import sys
import sysconfig
import threading

# 1. Which Python is running this code?
print("implementation:", sys.implementation.name, sys.version.split()[0])
print("platform:", sys.platform)
print("free-threaded build:", sysconfig.get_config_var("Py_GIL_DISABLED") == 1)
is_gil_enabled = getattr(sys, "_is_gil_enabled", lambda: True)   # 3.13+
print("GIL enabled now:", is_gil_enabled())
print("switch interval:", sys.getswitchinterval(), "s")
try:
    threading.Thread(target=print).start()
except RuntimeError as err:
    print("starting a thread:", err)

# 2. The GIL protects single instructions, not your logic
counter = 0


def bump():
    global counter
    counter += 1


wanted = ("LOAD_GLOBAL", "BINARY_OP", "STORE_GLOBAL")
steps = [ins.opname for ins in dis.get_instructions(bump) if ins.opname in wanted]
print("counter += 1 ->", steps)

# 3. SIMPLIFIED model: "#" runs Python, "~" waits for I/O (GIL released),
#    "." is ready but waiting for the GIL (or a free core)
SWITCH_EVERY = 2      # ticks a thread may hold the GIL while others wait
CPU_JOBS = {"A": ["cpu"] * 4, "B": ["cpu"] * 4, "C": ["cpu"] * 4}
IO_JOBS = {"A": ["cpu", "io", "io", "io", "cpu"],
           "B": ["cpu", "io", "io", "io", "cpu"],
           "C": ["cpu", "io", "io", "io", "cpu"]}


def simulate(jobs, gil=True, cores=4):
    todo = {name: list(work) for name, work in jobs.items()}
    rows = {name: "" for name in jobs}
    order = list(jobs)
    holder, held_for = None, 0
    while any(todo.values()):
        ready = [n for n in order if todo[n] and todo[n][0] == "cpu"]
        if gil:
            if ready and (holder not in ready or held_for >= SWITCH_EVERY):
                start = order.index(holder) + 1 if holder in order else 0
                rotated = order[start:] + order[:start]
                holder = next(n for n in rotated if n in ready)   # hand over the GIL
                held_for = 0
            running = {holder} if holder in ready else set()
        else:
            running = set(ready[:cores])
        for name in order:
            work = todo[name]
            if not work:
                rows[name] += " "
            elif work[0] == "io" or name in running:
                rows[name] += "~" if work[0] == "io" else "#"
                work.pop(0)
            else:
                rows[name] += "."
        held_for += 1
    return rows, len(rows[order[0]])


for title, jobs in [("CPU-bound", CPU_JOBS), ("I/O-bound", IO_JOBS)]:
    for label, gil in [("with GIL", True), ("free-threaded, 4 cores", False)]:
        rows, ticks = simulate(jobs, gil=gil)
        print(f"{title}, {label}: {ticks} ticks")
        for name, row in rows.items():
            print(f"   {name} |{row}|")
`

export default {
  id: 'gil-and-free-threading',
  title: 'The GIL, free-threaded Python & other implementations',
  summary: 'CPython’s Global Interpreter Lock lets only one thread run Python bytecode at a time — it keeps the interpreter’s internals safe but never your own logic — and Python 3.14 officially supports an optional free-threaded build without it, while PyPy, GraalPy, MicroPython and Pyodide each make their own choices.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['concurrency-concepts', 'memory-management', 'bytecode'],
  related: ['concurrency-concepts', 'threading', 'multiprocessing', 'choosing-concurrency', 'asyncio-basics', 'memory-management', 'bytecode', 'object-model', 'profiling', 'modern-features'],
  tags: ['GIL', 'global interpreter lock', 'free-threading', 'free-threaded build', 'nogil', 'PEP 703', 'PEP 779', 'PEP 684', 'PEP 734', 'python3.14t', 'sys._is_gil_enabled', 'Py_GIL_DISABLED', 'PYTHON_GIL', 'switch interval', 'sys.setswitchinterval', 'thread safety', 'atomic operations', 'race condition', 'C extensions', 'subinterpreters', 'PyPy', 'GraalPy', 'MicroPython', 'Pyodide', 'WebAssembly', 'CPython detail'],
  apis: [
    { name: 'sys._is_gil_enabled()', summary: '(3.13+) True if the GIL is active in this process right now. Private API: guard it with getattr on older versions.' },
    { name: 'sysconfig.get_config_var("Py_GIL_DISABLED")', summary: '1 on a free-threaded build of CPython, 0 (or None) on a default build.' },
    { name: 'sys.getswitchinterval() / sys.setswitchinterval(s)', summary: 'How long (seconds) a thread may keep the GIL while another thread is waiting for it. CPython’s default is 0.005.' },
    { name: 'threading.Lock()', summary: 'A mutual-exclusion lock for your own critical sections: with lock: ... — still required with the GIL.' },
    { name: 'PYTHON_GIL=0|1 / -X gil=0|1', summary: 'Free-threaded builds only: force the GIL off or on at start-up.' },
    { name: 'sys.implementation.name', summary: '"cpython", "pypy", "graalpy", "micropython"… — which implementation is running.' },
    { name: 'concurrent.interpreters (3.14)', summary: 'PEP 734: run code in isolated subinterpreters, each with its own GIL, from the standard library.' },
  ],
  docs: [
    { label: 'HOWTO — Python support for free threading', url: 'https://docs.python.org/3/howto/free-threading-python.html' },
    { label: 'Glossary — global interpreter lock', url: 'https://docs.python.org/3/glossary.html#term-global-interpreter-lock' },
    { label: 'threading — CPython implementation detail on the GIL', url: 'https://docs.python.org/3/library/threading.html' },
    { label: 'C API — Releasing the GIL from extension code', url: 'https://docs.python.org/3/c-api/init.html#releasing-the-gil-from-extension-code' },
    { label: 'FAQ — What kinds of global value mutation are thread-safe?', url: 'https://docs.python.org/3/faq/library.html#what-kinds-of-global-value-mutation-are-thread-safe' },
    { label: 'HOWTO — C API extension support for free threading', url: 'https://docs.python.org/3/howto/free-threading-extensions.html' },
    { label: 'PEP 703 — Making the Global Interpreter Lock optional', url: 'https://peps.python.org/pep-0703/' },
    { label: 'PEP 779 — Criteria for supported status for free-threaded Python', url: 'https://peps.python.org/pep-0779/' },
    { label: 'PEP 734 — Multiple interpreters in the stdlib', url: 'https://peps.python.org/pep-0734/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **thread** is an independent path of execution inside one program: several threads share the same memory and can (in principle) run at the same time on different processor **cores**. In standard **CPython**, though, there is a catch called the **GIL** — the *Global Interpreter Lock*.`,
    py`A **lock** is a "one at a time" token: whoever holds it may proceed, everyone else waits. The GIL is one such lock per interpreter, and a thread must hold it to execute Python bytecode. So in a default CPython process, **only one thread runs Python code at any instant**, however many cores you have. Threads still take turns — CPython hands the GIL over regularly — and a thread that is waiting for a file, a network reply or \`time.sleep\` **releases** it so others can run.`,
    py`You met the practical consequences in [concurrency vs parallelism](lesson:concurrency-concepts): threads help I/O-bound programs, processes help CPU-bound ones. This lesson goes underneath: *why* the GIL exists (it's tied to [reference counting](lesson:memory-management)), exactly what it does and does **not** protect, the **free-threaded build** that removes it (experimental in 3.13, **officially supported but not the default in 3.14**), and how other Python implementations handle the same problem.`,
    { callout: 'note', title: 'Language vs implementation', text: py`The Python language reference never mentions a GIL. It is a **CPython implementation detail** — the \`threading\` docs label it that way — and other implementations decide for themselves: PyPy and GraalPy have a GIL, Jython and IronPython never did, MicroPython varies by port, and Pyodide (CPython compiled to WebAssembly, running this page) has one but can't start threads at all in the browser.` },
  ],
  why: [
    py`**Performance decisions depend on it.** "Should I use threads, processes, asyncio or the free-threaded build?" can't be answered without knowing when the GIL is held, when it is released, and what removing it costs.`,
    py`**Correctness depends on not over-trusting it.** The most common thread bug in Python is believing the GIL makes code thread-safe. It makes the *interpreter* safe; \`count += 1\` can still lose updates, and check-then-act logic can still race. Those bugs become *more* likely, not less, on a free-threaded build.`,
    py`**Python is changing right now.** Free-threading is the biggest change to CPython's execution model in decades. Library authors must make C extensions free-threading-safe, and teams have to decide when to adopt it. Senior interviews increasingly ask about it.`,
  ],
  eli15: [
    py`Imagine a kitchen with four cooks (threads) but only **one chef's knife** (the GIL). Only the cook holding the knife can chop. The others can still do things that don't need the knife — wait for the oven, wait for a delivery — and when the chopping cook starts waiting for the oven, they put the knife down so someone else can chop.`,
    py`So if the work is mostly *waiting* (deliveries, ovens = files and networks), four cooks really do get more done. If the work is mostly *chopping* (pure calculation), four cooks with one knife are no faster than one cook — they just pass the knife around.`,
    py`Why one knife? It made the kitchen simple and safe: nobody ever chops the same carrot at the same moment. The **free-threaded** kitchen gives every cook a knife — more chopping at once — but now every shared bowl needs its own little rule about who may touch it, which takes extra care and a bit of extra time.`,
    py`And the knife only stops two cooks *chopping at the same instant*. If two cooks both read "3 eggs left", both take one, and both write "2 eggs left", the count is still wrong. That's your job to prevent, with a lock of your own.`,
  ],
  analogy: {
    title: 'One knife in a busy kitchen',
    body: [
      py`Cooks share a kitchen, a pantry and a whiteboard of stock counts, but there is a single knife. Holding it is required for any chopping; a cook who goes to wait for the oven must put it down; a cook who has been chopping for a while must hand it over if someone is waiting.`,
      py`That is CPython's GIL: interpreter-wide, required to run Python bytecode, released around blocking I/O, and handed over after a *switch interval*. The free-threaded build replaces the one knife with a knife per cook plus small locks on each shared bowl.`,
    ],
    mapping: [
      ['cooks', 'threads'],
      ['the single knife', 'the GIL: needed to execute Python bytecode'],
      ['chopping', 'running Python code (CPU work)'],
      ['waiting for the oven or a delivery', 'blocking I/O: files, sockets, time.sleep — the GIL is released'],
      ['handing the knife over after a while', 'the switch interval (sys.getswitchinterval)'],
      ['a separate kitchen with its own knife', 'a separate process (or subinterpreter) with its own GIL'],
      ['two cooks updating the egg count on the whiteboard', 'a race condition on shared data — the GIL doesn’t prevent it'],
      ['a knife per cook plus a lock on each bowl', 'the free-threaded build: per-object locks instead of one GIL'],
    ],
  },
  visual: {
    type: 'concurrency',
    title: 'CPU-bound work under each model',
    props: { preset: 'cpu-bound' },
    alt: 'Four timelines for three pure-computation jobs. Sequential: one job after another, about 3 units. Threads on standard CPython: three lanes that take turns holding the GIL, so the total is still about 3 units. asyncio: a single event loop runs the jobs one after another, about 3 units. Processes: three processes run in parallel on three cores, about 1.3 units including start-up.',
    caption: py`Timings are **illustrative units**, not measurements. With the GIL, CPU-bound threads interleave instead of running in parallel; separate processes each have their own interpreter and their own GIL.`,
    after: [
      py`The I/O-bound version of this picture looks very different — threads overlap their waits nicely, because a thread blocked on I/O doesn't hold the GIL. You'll reproduce both shapes with a simplified model in the playground below.`,
    ],
  },
  syntax: [
    py`#### Finding out what you are running on`,
    { code: py`import sys
import sysconfig

print(sys.implementation.name)                          # 'cpython', 'pypy', ...
print(sysconfig.get_config_var("Py_GIL_DISABLED") == 1)  # True on a free-threaded build
is_gil_enabled = getattr(sys, "_is_gil_enabled", lambda: True)  # 3.13+ only
print(is_gil_enabled())                                 # is the GIL active right now?`, lang: 'python', title: 'portable feature detection' },
    py`Two different questions: **"Is this a free-threaded build?"** (a compile-time property: \`Py_GIL_DISABLED\`) and **"Is the GIL enabled right now?"** (a run-time property: \`sys._is_gil_enabled()\`). A free-threaded build can still have its GIL switched back on — by \`PYTHON_GIL=1\` or by importing an extension that doesn't support free-threading. In this playground both answers say "classic CPython with a GIL".`,
    py`#### Getting the free-threaded build (3.13+)`,
    { code: py`python3.14t -VV                 # the "t" executable is the free-threaded build
python3.14t -X gil=0 app.py      # keep the GIL off even if an extension asks for it (at your own risk)
PYTHON_GIL=1 python3.14t app.py  # turn the GIL back on, e.g. to compare behaviour
./configure --disable-gil        # building CPython yourself`, lang: 'bash', title: 'free-threaded CPython from the command line' },
    { callout: 'version', title: '3.13: experimental · 3.14: officially supported, not the default', text: py`PEP 703 made the GIL optional through a **separate build**. In **3.13** that build was *experimental*. In **3.14**, under PEP 779, it is *officially supported* — but the normal \`python3.14\` still has a GIL, and the free-threaded executable is a separate opt-in install (typically \`python3.14t\`). Whether it ever becomes the default is a future decision. Packages ship separate wheels for it, tagged with \`t\` (for example \`cp314t\`).` },
    py`#### The switch interval`,
    { code: py`import sys

print(sys.getswitchinterval())   # 0.005 in CPython: 5 milliseconds
sys.setswitchinterval(0.001)     # ask the running thread to hand over sooner`, lang: 'python', title: 'how often the GIL changes hands' },
    py`When another thread is waiting for the GIL, the running thread is asked to release it once the switch interval has passed; it does so at the next safe point between bytecode instructions. Lowering the interval makes threads more responsive and adds switching overhead; raising it does the opposite. It changes nothing about thread *safety*.`,
    py`#### What the GIL does and doesn't protect`,
    py`| operation | safe from interleaving in default CPython? | why |
|---|---|---|
| \`items.append(x)\`, \`d[key] = value\`, \`x = items.pop()\` | yes (in practice) | each runs inside one bytecode instruction on a built-in type |
| \`count += 1\` on a shared variable | **no** | separate load, add and store instructions: a switch can happen between them |
| \`if key not in cache: cache[key] = compute()\` | **no** | check-then-act spans many instructions |
| \`d[k] = d[k] + 1\`, \`items.append(items[-1])\` | **no** | read and write are separate steps |
| updating two related objects together | **no** | the GIL knows nothing about your invariants |`,
    py`The "yes" row is an implementation detail documented in the Python FAQ, not a language guarantee — and even those operations can run Python code (\`__eq__\`, \`__hash__\`, \`__del__\`) that gives up the GIL midway. The rule: **any shared, mutable state that more than one thread updates needs a \`threading.Lock\` (or a \`queue.Queue\`)**, on every build. See [threads & locks](lesson:threading).`,
    { code: py`import threading

stock = {"widget": 3}
stock_lock = threading.Lock()

def buy(item):
    with stock_lock:                 # check AND act inside one critical section
        if stock[item] > 0:
            stock[item] -= 1
            return True
        return False

print(buy("widget"), stock)`, lang: 'python', title: 'protect the whole read-check-update' },
    py`#### Escaping the GIL for CPU-bound work`,
    py`- **Processes** (\`multiprocessing\`, \`ProcessPoolExecutor\`): each has its own interpreter and GIL — see [multiprocessing](lesson:multiprocessing).
- **C code that releases the GIL**: NumPy, \`hashlib\` on large buffers, compression and many I/O libraries drop the GIL while their C loops run, so threads calling them do run in parallel.
- **Subinterpreters**: since 3.12 each interpreter in a process can have its own GIL (PEP 684); 3.14 adds \`concurrent.interpreters\` and \`concurrent.futures.InterpreterPoolExecutor\` (PEP 734) to use them from Python.
- **The free-threaded build** (3.13+): threads run Python bytecode in parallel.`,
  ],
  walkthrough: {
    title: 'Reading the GIL lab',
    lang: 'python',
    code: GIL_LAB,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps inside the editor.`,
    steps: [
      { lines: [8, 13], text: py`The first block reports which Python is running. \`Py_GIL_DISABLED\` answers "was this CPython *built* free-threaded?"; \`sys._is_gil_enabled()\` answers "is the GIL on *right now*?". The \`getattr(..., lambda: True)\` fallback keeps the code working on Python 3.12 and older, where the function doesn't exist (and the GIL always does).` },
      { lines: [14, 17], text: py`Here, starting a thread raises \`RuntimeError: can't start new thread\`. That's not the GIL: this playground is CPython compiled to WebAssembly running in a browser worker, which has no threads. The GIL itself is still there — \`GIL enabled now: True\`.` },
      { lines: [20, 30], text: py`\`counter += 1\` compiles to separate instructions: load the global, add, store the global. The GIL can change hands **between** any two of them, which is why two threads incrementing the same counter can lose updates (watch the animation below).` },
      { lines: [32, 38], text: py`The rest is a **simplified model**, not real threads. Each job is a list of ticks: \`"cpu"\` needs the GIL (or a core), \`"io"\` is waiting for a device and needs nothing. \`SWITCH_EVERY\` plays the role of the switch interval.` },
      { lines: [47, 56], text: py`With a GIL, exactly one ready job runs per tick. The holder keeps it until it starts waiting for I/O, finishes, or has held it for \`SWITCH_EVERY\` ticks while others are ready — then the GIL is handed round-robin to the next ready job. Without a GIL, up to \`cores\` ready jobs run at once.` },
      { lines: [57, 67], text: py`I/O ticks always make progress for every job, because waiting doesn't need the GIL. The function returns one text row per job and the total number of ticks.` },
      { lines: [70, 75], text: py`Compare the four results: CPU-bound work takes 12 ticks with the GIL but 4 without it; I/O-bound work takes 7 vs 5 — the GIL barely matters when jobs mostly wait.` },
    ],
  },
  playground: {
    title: 'GIL lab',
    objective: 'Run it, read the runtime report, then change the jobs and the switch interval and predict how the timelines change.',
    files: { 'main.py': GIL_LAB },
    expected: py`The first block describes this playground (the patch version may differ):

\`\`\`text
implementation: cpython 3.14.x
platform: emscripten
free-threaded build: False
GIL enabled now: True
switch interval: 0.005 s
starting a thread: can't start new thread
counter += 1 -> ['LOAD_GLOBAL', 'BINARY_OP', 'STORE_GLOBAL']
\`\`\`

Then the simplified model:

\`\`\`text
CPU-bound, with GIL: 12 ticks
   A |##....##    |
   B |..##....##  |
   C |....##....##|
CPU-bound, free-threaded, 4 cores: 4 ticks
   ...
I/O-bound, with GIL: 7 ticks
   A |#~~~#  |
   B |.#~~~# |
   C |..#~~~#|
I/O-bound, free-threaded, 4 cores: 5 ticks
   ...
\`\`\``,
    experiments: [
      {
        id: 'fourth-job',
        task: py`Add a fourth CPU-bound job \`"D": ["cpu"] * 4\` to \`CPU_JOBS\`. Predict both CPU-bound totals before you run it.`,
        hint: py`With one GIL the total is the sum of all CPU ticks. Without it, four jobs fit on four cores.`,
        tests: [
          { name: 'CPU_JOBS has four jobs', code: py`assert len(CPU_JOBS) == 4, 'Add a job named "D" to CPU_JOBS'` },
          { name: 'the GIL serialises them: 16 ticks', code: py`assert "CPU-bound, with GIL: 16 ticks" in output` },
          { name: 'free-threaded still needs only 4 ticks', code: py`assert "CPU-bound, free-threaded, 4 cores: 4 ticks" in output` },
        ],
        explain: py`With a GIL, CPU work adds up: 4 jobs × 4 ticks = 16, no matter how many cores exist. Without it, each job gets its own core, so the total is the length of the longest job. That's the whole promise of free-threading — for CPU-bound *Python* code. Add a fifth job and the free-threaded total grows too, because only four cores exist in the model.`,
      },
      {
        id: 'switch-every',
        task: py`Set \`SWITCH_EVERY = 1\` so the GIL changes hands after every tick. Does the CPU-bound total with the GIL change?`,
        hint: py`Look at the shape of the rows, not just the total.`,
        tests: [
          { name: 'SWITCH_EVERY is 1', code: py`assert SWITCH_EVERY == 1` },
          { name: 'the total is still 12 ticks', code: py`assert "CPU-bound, with GIL: 12 ticks" in output` },
        ],
        explain: py`The rows interleave more finely (\`#..#..#..#\`), but the total stays 12: the switch interval only decides *how often* threads take turns, never how much can run at once. In real CPython a shorter interval improves responsiveness of other threads and adds switching overhead.`,
      },
      {
        id: 'long-waits',
        task: py`Make every I/O job wait longer: give each one 8 \`"io"\` ticks between its two \`"cpu"\` ticks. How much does the GIL cost now?`,
        hint: py`\`["cpu"] + ["io"] * 8 + ["cpu"]\` for each of A, B and C.`,
        tests: [
          { name: 'each I/O job waits at least 8 ticks', code: py`assert all(work.count("io") >= 8 for work in IO_JOBS.values())` },
          { name: 'the GIL adds at most 2 ticks', code: py`with_gil = simulate(IO_JOBS, gil=True)[1]
free = simulate(IO_JOBS, gil=False)[1]
assert with_gil - free <= 2` },
        ],
        explain: py`When jobs spend most of their time waiting, the waits overlap whether or not there's a GIL, and the small CPU slices barely queue. That's why threads (or asyncio) work well for I/O-bound programs on standard CPython, and why free-threading mostly matters for CPU-bound Python code.`,
      },
      {
        id: 'set-interval',
        task: py`Just before the line that prints the switch interval, call \`sys.setswitchinterval(0.001)\`. Run it and read the reported value.`,
        hint: py`\`sys.setswitchinterval(seconds)\` takes a float.`,
        tests: [{ name: 'the interval is now 1 ms', code: py`assert "switch interval: 0.001" in output, 'Call sys.setswitchinterval(0.001) before printing it'` }],
        explain: py`This is the real knob behind the model's \`SWITCH_EVERY\`. It only matters when several threads compete for the GIL; with a single thread nothing ever asks it to switch. It's rarely worth tuning in applications — but it's useful to know it exists when you read about latency-sensitive threaded programs.`,
      },
    ],
  },
  animation: {
    type: 'concurrency',
    title: 'The GIL doesn’t stop a lost update',
    props: { preset: 'race-condition' },
    alt: 'Step-by-step race between two threads running count += 1. Thread 1 reads count as 0, the scheduler switches, thread 2 also reads 0, thread 1 adds and writes 1, thread 2 adds and writes 1, so the final count is 1 instead of 2. The fixed version wraps the increment in with lock, so the read, add and write happen as one unit.',
    caption: py`Each step is a separate bytecode instruction, and the GIL may change hands between any two of them. The GIL keeps the *interpreter* consistent; only your own \`Lock\` keeps *your* read-modify-write consistent — on the default build and on the free-threaded build alike.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Why would anyone design a lock that stops threads running in parallel? Because of **reference counting**. Every time any code uses an object, CPython updates that object's count (see [memory management](lesson:memory-management)). If two threads changed the same count at the same instant without coordination, an update could be lost, and an object could be freed while still in use — a crash. Putting one lock around the whole interpreter made every count, every list and every dict safe with almost no extra cost for single-threaded programs.`,
      py`It also made life easy for authors of **C extensions** — libraries written in C, like NumPy — because their code could assume nothing else touches Python objects while it runs. That simplicity helped Python's ecosystem grow.`,
      py`The price is that a CPython process uses at most one core *for Python code* at a time. Programs that mostly wait (web requests, files, databases) barely notice. Programs that mostly calculate in pure Python can't speed up with threads — they need processes, C code that releases the GIL, or the free-threaded build.`,
    ],
    technical: [
      py`**How the GIL changes hands (CPython detail).** A thread that wants the GIL waits on it with a timeout equal to the switch interval. If the timeout expires, it sets a "please drop" request; the running thread notices it at the next check point in the evaluation loop (such checks happen at function calls and backward jumps in loops, not after every instruction) and releases the GIL. This time-based scheme dates from Python 3.2; before that, CPython switched every fixed number of bytecode "ticks". Which waiting thread gets the GIL next is up to the operating system — there is no fairness guarantee.`,
      py`**Releasing the GIL around blocking calls.** C code that is about to block or crunch numbers without touching Python objects wraps that section in \`Py_BEGIN_ALLOW_THREADS\` / \`Py_END_ALLOW_THREADS\`. CPython does this around file and socket reads/writes, \`time.sleep\`, \`select\`, waiting on a \`threading.Lock\`, and many library functions; NumPy, compression and hashing libraries do it for large inputs. That's why I/O-bound threads overlap and why threaded NumPy code can use several cores.`,
      { callout: 'note', title: 'CPython detail: one GIL per interpreter', text: py`Since 3.12 (PEP 684) the GIL belongs to an **interpreter**, not the process: a process can host several isolated subinterpreters, each with its own GIL, running Python truly in parallel. 3.14 exposes this to Python code as \`concurrent.interpreters\` and \`InterpreterPoolExecutor\` (PEP 734). Objects can't be shared freely between interpreters — data is passed by copying or through special channels — and not every C extension supports subinterpreters yet. (Not available in this WebAssembly build.)` },
      py`**How the free-threaded build stays safe without a GIL** (PEP 703). Removing the lock means replacing what it protected:`,
      py`- **Biased reference counting**: each object records its owning thread, which updates the count cheaply; other threads use slower atomic operations on a separate shared count.
- **Immortal objects** (\`None\`, small ints, interned strings…) whose counts never change, and **deferred reference counting** for objects such as functions and modules that are touched by every thread.
- **Per-object locks** ("critical sections") inside built-in types, so concurrent \`list.append\` or \`dict\` updates can't corrupt them.
- A thread-safe memory allocator (**mimalloc**) and a scheme for freeing memory only when no thread can still be reading it.`,
      py`These make the *interpreter* safe. They do **not** make \`count += 1\` or check-then-act atomic: without the GIL, such races simply happen more often. The costs are a single-threaded slowdown compared with the default build (smaller in 3.14 than in 3.13, still not zero — measure your workload), somewhat higher memory use, and work for extension authors.`,
      py`**C extensions on the free-threaded build.** Extensions must be compiled for the free-threaded ABI and declare that they are safe without the GIL (the \`Py_mod_gil\` module slot). Importing one that doesn't **re-enables the GIL** for the whole process, with a \`RuntimeWarning\`. Making an extension safe means protecting its own global state, avoiding *borrowed references* that another thread could invalidate (3.13 added APIs such as \`PyList_GetItemRef\` and \`PyDict_GetItemRef\` that return strong references), and using the new critical-section API around shared objects.`,
      { callout: 'note', title: 'Other implementations', text: py`**PyPy** has a GIL (an experiment to remove it with software transactional memory was abandoned); its JIT makes single-threaded code fast instead. **GraalPy** also uses a GIL. **Jython** (Python 2.7) and **IronPython** run on the JVM and .NET and have no GIL. **MicroPython**'s threading support depends on the port, and some ports use a GIL. **Pyodide** is CPython compiled to WebAssembly: same GIL, but the browser build can't start threads at all — which is why runnable examples on this site use asyncio or simulations.` },
    ],
    production: [
      py`**Choose the model by the workload, then measure.** I/O-bound: asyncio or threads on the default build. CPU-bound pure Python: processes today; the free-threaded build or subinterpreters are worth an experiment. CPU-bound with NumPy/C libraries: threads may already scale, because those libraries release the GIL. Profile first (see [profiling](lesson:profiling)) — many "the GIL is the bottleneck" reports turn out to be an algorithm or a database query. [Choosing a concurrency model](lesson:choosing-concurrency) has the full decision guide.`,
      py`**Write thread-safe code as if the GIL didn't exist.** Protect every shared, mutable structure with a \`Lock\` for the whole read-check-update, or avoid sharing: hand work between threads through \`queue.Queue\`, give each thread its own data, prefer immutable values. Code written that way is correct on the default build *and* ready for free-threading. Code that "works because of the GIL" is a latent bug.`,
      py`**Adopting the free-threaded build.** Check that every dependency with C code publishes free-threaded wheels (\`cp314t\`) and declares support — one unsupported import silently turns the GIL back on, which you can detect with \`sys._is_gil_enabled()\` at start-up and log. Run your test suite under the \`t\` build and under load (races that the GIL made rare will surface). Benchmark single-threaded paths too, since they may get slower. Roll out gradually, keeping the default build as a fallback.`,
      py`**Feature-detect, don't version-check.** \`sys.version_info >= (3, 13)\` tells you nothing about the build. Use \`sysconfig.get_config_var("Py_GIL_DISABLED")\` for the build and \`getattr(sys, "_is_gil_enabled", lambda: True)()\` for the current state, and \`sys.implementation.name\` when behaviour differs between CPython, PyPy and others.`,
      py`**For C-extension authors on the default build:** release the GIL around long computations and blocking calls (\`Py_BEGIN_ALLOW_THREADS\`), never touch Python objects while it's released, and reacquire it before returning. On the free-threaded build, audit global state and borrowed references; the [C API free-threading HOWTO](https://docs.python.org/3/howto/free-threading-extensions.html) is the checklist.`,
    ],
  },
  mistakes: [
    {
      title: 'Believing the GIL makes your code thread-safe',
      wrong: { code: py`import threading

hits = 0

def record_hit():
    global hits
    hits += 1        # load, add, store: a switch in between loses an update`, lang: 'python' },
      right: { code: py`import threading

hits = 0
hits_lock = threading.Lock()

def record_hit():
    global hits
    with hits_lock:  # the whole read-modify-write happens as one unit
        hits += 1`, lang: 'python' },
      explanation: py`The GIL guarantees that one *bytecode instruction* at a time touches the interpreter's internals. \`hits += 1\` is several instructions, and the GIL can change hands between them. Lost updates are rare under the GIL and common without it — either way, use a lock.`,
    },
    {
      title: 'Using threads to speed up pure-Python number crunching',
      wrong: { code: py`from concurrent.futures import ThreadPoolExecutor

def count_primes(limit):
    return sum(all(n % d for d in range(2, int(n ** 0.5) + 1)) for n in range(2, limit))

with ThreadPoolExecutor(max_workers=8) as pool:      # still one core on a GIL build
    results = list(pool.map(count_primes, [50_000] * 8))`, lang: 'python', static: true },
      right: { code: py`from concurrent.futures import ProcessPoolExecutor

def count_primes(limit):
    return sum(all(n % d for d in range(2, int(n ** 0.5) + 1)) for n in range(2, limit))

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:              # one interpreter (and GIL) per process
        results = list(pool.map(count_primes, [50_000] * 8))`, lang: 'python', static: true },
      explanation: py`Pure-Python CPU work holds the GIL, so threads only take turns. Processes each run their own interpreter. On a free-threaded build the thread version *can* scale — but check \`sys._is_gil_enabled()\` first: one incompatible extension turns the GIL back on. (Shown as static code: this playground can't start threads or processes.)`,
    },
    {
      title: 'Checking outside the lock, acting inside it',
      wrong: { code: py`import threading

seats = {"12A": None}
seats_lock = threading.Lock()

def book(seat, passenger):
    if seats[seat] is None:          # another thread can book it right here
        with seats_lock:
            seats[seat] = passenger
        return True
    return False`, lang: 'python' },
      right: { code: py`import threading

seats = {"12A": None}
seats_lock = threading.Lock()

def book(seat, passenger):
    with seats_lock:                 # check and act in one critical section
        if seats[seat] is None:
            seats[seat] = passenger
            return True
        return False`, lang: 'python' },
      explanation: py`A lock only helps if it covers *everything* the decision depends on. Between the check and the write, another thread can book the same seat — a classic "check-then-act" race that no GIL prevents.`,
    },
    {
      title: 'Detecting free-threading with a version check',
      wrong: { code: py`import sys

FREE_THREADED = sys.version_info >= (3, 13)   # wrong: most 3.13+ installs have a GIL`, lang: 'python' },
      right: { code: py`import sys
import sysconfig

FREE_THREADED_BUILD = sysconfig.get_config_var("Py_GIL_DISABLED") == 1
GIL_ENABLED = getattr(sys, "_is_gil_enabled", lambda: True)()`, lang: 'python' },
      explanation: py`The free-threaded build is a separate, opt-in build; the default \`python3.13\`/\`python3.14\` has a GIL. And even a free-threaded build may be running with the GIL re-enabled. Detect the feature, not the version.`,
    },
    {
      title: 'Expecting the free-threaded build to speed up single-threaded code',
      wrong: { code: py`python3.14t report.py     # one thread, expecting it to be faster than python3.14`, lang: 'bash' },
      right: { code: py`python3.14 report.py      # single-threaded: the default build is the better baseline
python3.14t threaded_report.py   # free-threading pays off when several threads do CPU work`, lang: 'bash' },
      explanation: py`Removing the GIL adds bookkeeping (atomic reference counts, per-object locks), so single-threaded code generally runs somewhat slower on the free-threaded build. It only wins when multiple threads have CPU-bound Python work to do in parallel.`,
    },
  ],
  debugging: [
    {
      symptom: py`RuntimeWarning: The global interpreter lock (GIL) has been enabled to load module '_example', which has not declared that it can run safely without the GIL. To override this behavior and keep the GIL disabled (at your own risk), run with PYTHON_GIL=0 or -Xgil=0.`,
      cause: py`On a free-threaded build, you imported a C extension that hasn't declared free-threading support. CPython re-enabled the GIL for the whole process to stay safe.`,
      fix: py`Upgrade to a version of the package with free-threaded (\`cp314t\`) wheels, or ask its maintainers. Only force \`PYTHON_GIL=0\` for testing if you understand the extension's thread safety.`,
    },
    {
      symptom: py`RuntimeError: can't start new thread`,
      cause: py`The platform can't create another thread: in this browser playground (Pyodide/WebAssembly) threads aren't available at all; on servers it usually means an OS limit on threads or memory was reached.`,
      fix: py`Here, use asyncio or a simulation. On a server, use a bounded pool (\`ThreadPoolExecutor(max_workers=...)\`) instead of one thread per task, and check container/OS thread limits.`,
    },
    {
      symptom: py`Adding threads didn't make a CPU-heavy job faster; the process sits at about 100% of a single core.`,
      cause: py`Pure-Python computation holds the GIL, so the threads take turns on one core.`,
      fix: py`Use \`ProcessPoolExecutor\`, move the hot loop into a library that releases the GIL (NumPy…), or evaluate the free-threaded build. Profile first to confirm the hot spot is really Python code.`,
    },
    {
      symptom: py`Totals are occasionally a little too low under load (e.g. 9,994 hits instead of 10,000), never in tests.`,
      cause: py`A lost update: an unprotected read-modify-write (\`+=\`, \`d[k] = d[k] + 1\`) on shared data. Tests run with too little contention to hit the narrow window.`,
      fix: py`Wrap the whole update in a \`threading.Lock\`, or funnel updates through a single thread via \`queue.Queue\`. Stress-test with many threads — and on a free-threaded build, where races surface much faster.`,
    },
    {
      symptom: py`AttributeError: module 'sys' has no attribute '_is_gil_enabled'`,
      cause: py`The function only exists on Python 3.13+.`,
      fix: py`Use \`getattr(sys, "_is_gil_enabled", lambda: True)()\` — older versions always have a GIL.`,
    },
  ],
  bestPractices: [
    'Treat the GIL as a CPython implementation detail: never rely on it for the correctness of your own code.',
    'Protect every shared, mutable structure with a Lock that covers the whole read-check-update — or share nothing and use queues.',
    'Use threads or asyncio for I/O-bound work and processes (or GIL-releasing libraries) for CPU-bound pure Python on the default build.',
    'Detect features, not versions: Py_GIL_DISABLED for the build, sys._is_gil_enabled() (via getattr) for the current state.',
    'Before adopting the free-threaded build, check every C dependency for cp314t wheels, log whether the GIL is enabled at start-up, and benchmark.',
    'Stress-test threaded code under contention; races the GIL made rare become common without it.',
  ],
  useCases: [
    'Deciding between threads, processes, asyncio, subinterpreters and the free-threaded build for a new service.',
    'Explaining why a threaded CPU-bound job did not get faster — and what will make it faster.',
    'Making a library’s shared caches and registries thread-safe for free-threaded Python.',
    'Writing start-up diagnostics that report the implementation, build and GIL state of a deployment.',
    'Porting or reviewing a C extension for the free-threaded build.',
  ],
  comparison: {
    title: 'Default CPython vs the free-threaded build (3.14)',
    headers: ['', 'Default build (python3.14)', 'Free-threaded build (python3.14t)'],
    rows: [
      ['GIL', 'Always on', 'Off by default; re-enabled by incompatible extensions or PYTHON_GIL=1'],
      ['Threads running Python bytecode at once', 'One per interpreter', 'Many, on many cores'],
      ['Single-threaded speed', 'Baseline', 'Somewhat slower (bookkeeping without a GIL)'],
      ['Reference counting', 'Plain, non-atomic counts', 'Biased + deferred counting, immortal objects'],
      ['Built-in containers (list, dict…)', 'Protected by the GIL', 'Protected by per-object locks'],
      ['Your read-modify-write code', 'Needs a Lock', 'Needs a Lock (races are more frequent)'],
      ['C extensions', 'Any compatible wheel', 'Need cp314t wheels that declare free-threading support'],
      ['Status', 'The default', 'Officially supported (PEP 779), opt-in'],
    ],
    note: py`Check which one you're on with \`sysconfig.get_config_var("Py_GIL_DISABLED")\` and whether the GIL is active with \`sys._is_gil_enabled()\`.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'gil-and-free-threading-q1',
      type: 'mcq',
      prompt: 'On a default (non-free-threaded) CPython build, what does the GIL actually guarantee?',
      options: [
        'Only one thread at a time executes Python bytecode in a given interpreter',
        { text: 'Your multi-threaded code is free of race conditions', why: 'Compound operations like count += 1 or check-then-act span several instructions, and the GIL can switch threads between them.' },
        { text: 'A Python process can never use more than one CPU core', why: 'Processes each have their own GIL, and C code that releases the GIL (NumPy, I/O) runs in parallel with Python threads.' },
        { text: 'Threads run in the order they were started', why: 'The GIL makes no ordering or fairness promise; the OS decides which waiting thread gets it next.' },
      ],
      answer: 0,
      explanation: py`The GIL protects the interpreter's own state — reference counts, the allocator, the internals of built-in objects — by letting one thread run bytecode at a time. It says nothing about the correctness of your multi-step logic, and it's released during blocking I/O and by C code doing heavy work.`,
    },
    {
      id: 'gil-and-free-threading-q2',
      type: 'output',
      prompt: 'This replays, step by step, how two threads interleaved while each ran `count += 1` once. What is printed?',
      code: py`count = 0
a = count        # thread A reads 0
b = count        # GIL switches; thread B also reads 0
count = a + 1    # thread A writes 1
count = b + 1    # thread B writes 1
print(count)`,
      options: [
        { text: '2', why: 'Each thread computed its new value from the 0 it read earlier, so the second write overwrites the first.' },
        '1',
        { text: '0', why: 'Both threads did write a value; the last write was 1.' },
        { text: 'It depends on the GIL', why: 'Once this interleaving happens, the result is deterministic: one increment is lost. The GIL is exactly what allowed the switch between read and write.' },
      ],
      answer: 1,
      explanation: py`This is a *lost update*. Each \`count += 1\` is a read, an add and a write; if a thread switch lands between the read and the write, both threads write \`1\`. The GIL allows switches between instructions, so only a lock around the whole update prevents it.`,
    },
    {
      id: 'gil-and-free-threading-q3',
      type: 'output',
      prompt: 'What does this print in this playground (standard CPython)?',
      code: py`import sys

print(sys.getswitchinterval())`,
      answer: '0.005',
      accept: ['0.005'],
      explanation: py`CPython's default switch interval is 5 ms: when another thread is waiting, the running thread is asked to release the GIL after that long. You can change it with \`sys.setswitchinterval()\`; it affects responsiveness and overhead, never thread safety.`,
    },
    {
      id: 'gil-and-free-threading-q4',
      type: 'bug',
      prompt: 'Two threads call `buy("widget")` at the same time and the stock goes to -1. Click the line that must be inside the lock but isn’t.',
      code: py`import threading

lock = threading.Lock()
stock = {"widget": 1}

def buy(item):
    if stock[item] > 0:
        with lock:
            stock[item] -= 1
        return True
    return False`,
      answerLine: 7,
      explanation: py`Both threads can pass the check on line 7 before either decrements. The lock must cover the check *and* the update: move \`with lock:\` above the \`if\`. The GIL doesn't help — the check and the decrement are many instructions apart.`,
    },
    {
      id: 'gil-and-free-threading-q5',
      type: 'fill',
      prompt: 'Complete the start-up check: is this a free-threaded **build**, and is the GIL enabled **right now** (3.13+)?',
      code: py`import sys
import sysconfig

free_threaded_build = sysconfig.get_config_var("___") == 1
gil_now = sys.___()`,
      answer: [['Py_GIL_DISABLED'], ['_is_gil_enabled']],
      explanation: py`\`Py_GIL_DISABLED\` is a build-time configuration variable (1 on free-threaded builds). \`sys._is_gil_enabled()\` reports the run-time state, which can be \`True\` even on a free-threaded build if the GIL was re-enabled.`,
    },
    {
      id: 'gil-and-free-threading-q6',
      type: 'mcq',
      prompt: 'Which statement about free-threaded CPython 3.14 is correct?',
      options: [
        { text: 'It is the default python3.14 executable', why: 'The default build still has a GIL. The free-threaded build is a separate opt-in install, typically python3.14t.' },
        'It is officially supported (PEP 779) but optional, and a C extension that doesn’t declare support re-enables the GIL when imported',
        { text: 'It makes count += 1 atomic, so locks are no longer needed', why: 'The opposite: without the GIL, unprotected read-modify-write races happen more often. Locks are still required.' },
        { text: 'It makes every single-threaded program faster', why: 'Single-threaded code is generally somewhat slower on the free-threaded build because of the extra bookkeeping.' },
      ],
      answer: 1,
      explanation: py`3.13 introduced the free-threaded build as experimental; 3.14 made it officially supported but not the default. It speeds up multi-threaded CPU-bound Python code, costs some single-threaded performance, and needs extensions built and declared for it.`,
    },
    {
      id: 'gil-and-free-threading-q7',
      type: 'short',
      prompt: 'Why did CPython adopt a GIL in the first place, and why was it so hard to remove?',
      answer: py`Because CPython manages memory with reference counts that change on almost every operation, and its built-in objects and interpreter state were written assuming one thread at a time. One global lock made all of that thread-safe cheaply, kept single-threaded code fast, and made C extensions simple to write. Removing it meant making reference counting, the allocator and every built-in type safe without that lock (biased reference counting, immortal objects, per-object locks, a new allocator) while keeping single-threaded performance acceptable — and the huge ecosystem of C extensions had been written assuming the GIL, so they must be audited and rebuilt. That's why it is a separate, opt-in build (PEP 703) rather than a switch flipped overnight.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'runtime-report',
      title: 'A portable runtime report',
      difficulty: 'intermediate',
      prompt: py`Write \`runtime_report()\` that returns a dict describing the running Python, suitable for logging at start-up. It must work on any Python 3.10+ and any implementation:

| key | value |
|---|---|
| \`"implementation"\` | \`sys.implementation.name\` (e.g. \`"cpython"\`) |
| \`"version"\` | \`"MAJOR.MINOR"\` as a string, e.g. \`"3.14"\` |
| \`"free_threaded_build"\` | \`True\` only if \`sysconfig.get_config_var("Py_GIL_DISABLED") == 1\`, otherwise \`False\` |
| \`"gil_enabled"\` | \`sys._is_gil_enabled()\` where it exists; \`True\` where it doesn't (Python ≤ 3.12) |

The tests compare each value against the interpreter and check that \`"gil_enabled"\` falls back to \`True\` when \`sys._is_gil_enabled\` is missing.`,
      files: {
        'main.py': py`import sys
import sysconfig


def runtime_report():
    # TODO: add version, free_threaded_build and gil_enabled
    return {"implementation": sys.implementation.name}


for key, value in runtime_report().items():
    print(f"{key}: {value}")
`,
      },
      hints: [
        'sys.version_info.major and sys.version_info.minor give the two numbers; an f-string joins them.',
        'Py_GIL_DISABLED may be 0, 1 or None depending on the platform — compare with == 1 to get a real bool.',
        'gil_check = getattr(sys, "_is_gil_enabled", None) and then: gil_check() if gil_check is not None else True',
      ],
      solution: {
        explanation: py`Each key answers a different question. \`sys.implementation.name\` tells CPython from PyPy or GraalPy. The version is formatted from \`sys.version_info\` rather than parsed out of \`sys.version\`, whose layout varies. \`Py_GIL_DISABLED\` is a *build* property; comparing with \`== 1\` turns 0/None/1 into a clean bool. \`sys._is_gil_enabled()\` is the *run-time* state — it can be \`True\` on a free-threaded build if an extension re-enabled the GIL — and the \`getattr\` fallback keeps the function working on versions where it doesn't exist, which always have a GIL. Looking the function up at call time (not at import time) is also what lets the test simulate an older Python.`,
        files: {
          'main.py': py`import sys
import sysconfig


def runtime_report():
    """Describe the running interpreter: implementation, version, build and GIL state."""
    gil_check = getattr(sys, "_is_gil_enabled", None)   # 3.13+
    return {
        "implementation": sys.implementation.name,
        "version": f"{sys.version_info.major}.{sys.version_info.minor}",
        "free_threaded_build": sysconfig.get_config_var("Py_GIL_DISABLED") == 1,
        "gil_enabled": gil_check() if gil_check is not None else True,
    }


for key, value in runtime_report().items():
    print(f"{key}: {value}")
`,
        },
      },
      tests: [
        { name: 'implementation and version', code: py`import sys
report = runtime_report()
assert report["implementation"] == sys.implementation.name
assert report["version"] == f"{sys.version_info.major}.{sys.version_info.minor}"` },
        { name: 'free_threaded_build is a bool matching the build', code: py`import sysconfig
report = runtime_report()
assert report.get("free_threaded_build") is (sysconfig.get_config_var("Py_GIL_DISABLED") == 1)` },
        { name: 'gil_enabled reports the current state', code: py`import sys
assert runtime_report().get("gil_enabled") is sys._is_gil_enabled()` },
        { name: 'gil_enabled falls back to True on older Pythons', code: py`import sys
saved = sys._is_gil_enabled
del sys._is_gil_enabled
try:
    assert runtime_report().get("gil_enabled") is True
finally:
    sys._is_gil_enabled = saved` },
      ],
    },
    {
      id: 'lost-update',
      title: 'Replay a lost update',
      difficulty: 'advanced',
      prompt: py`Two threads, \`"A"\` and \`"B"\`, each run \`count += 1\` once on a shared \`count\` that starts at \`0\`. Each increment is three steps, in order: **load** (copy \`count\` into the thread's private register), **add** (add 1 to the register), **store** (write the register back to \`count\`).

Write \`final_count(schedule)\`. \`schedule\` is a string such as \`"ABABAB"\`: each letter means "that thread performs its next step". Return the final value of \`count\`.

- \`final_count("AAABBB")\` → \`2\` (no overlap)
- \`final_count("ABABAB")\` → \`1\` (both load 0: one update is lost)
- Raise \`ValueError\` unless the schedule contains exactly three \`"A"\`s and three \`"B"\`s and nothing else.`,
      files: {
        'main.py': py`def final_count(schedule):
    count = 0
    # TODO: replay the schedule step by step
    return count


for schedule in ["AAABBB", "ABABAB", "AABBBA"]:
    print(schedule, "->", final_count(schedule))
`,
      },
      hints: [
        'Each thread needs its own register (the value it loaded) and its own step counter: 0 = load next, 1 = add next, 2 = store next.',
        'Dicts keyed by thread name keep it short: register = {"A": 0, "B": 0}, step = {"A": 0, "B": 0}. Validate first with schedule.count("A") and set(schedule).',
        'for t in schedule: if step[t] == 0: register[t] = count  elif step[t] == 1: register[t] += 1  else: count = register[t]  — then step[t] += 1',
      ],
      solution: {
        explanation: py`The simulator gives each thread its own private register — just like each thread in CPython has its own value stack — and one shared \`count\`. A schedule is one possible order in which the scheduler (and the GIL) let the threads run. Whenever both loads happen before the first store, both threads compute \`1\` from a stale \`0\` and the second store overwrites the first: a lost update. With the GIL, the switch must land exactly between load and store, which is rare; on a free-threaded build the steps truly overlap and it's common. Of the 20 possible interleavings of two 3-step sequences, only the two fully sequential ones give 2. A \`Lock\` around \`count += 1\` makes only those two schedules possible. This model is **simplified**: real threads run many instructions per step, and the exact instruction boundaries are a CPython detail.`,
        files: {
          'main.py': py`def final_count(schedule):
    if sorted(schedule) != list("AAABBB"):
        raise ValueError("schedule must contain exactly three A steps and three B steps")
    count = 0
    register = {"A": 0, "B": 0}   # each thread's private copy
    step = {"A": 0, "B": 0}       # 0 = load, 1 = add, 2 = store
    for thread in schedule:
        if step[thread] == 0:
            register[thread] = count          # load
        elif step[thread] == 1:
            register[thread] += 1             # add
        else:
            count = register[thread]          # store
        step[thread] += 1
    return count


for schedule in ["AAABBB", "ABABAB", "AABBBA"]:
    print(schedule, "->", final_count(schedule))
`,
        },
      },
      tests: [
        { name: 'sequential schedules give 2', code: py`assert final_count("AAABBB") == 2
assert final_count("BBBAAA") == 2` },
        { name: 'interleaved loads lose an update', code: py`assert final_count("ABABAB") == 1
assert final_count("AABBBA") == 1` },
        { name: 'a store between the other thread’s load and store still loses it', code: py`assert final_count("ABBBAA") == 1
assert final_count("BAAABB") == 1` },
        { name: 'invalid schedules raise ValueError', code: py`with raises(ValueError):
    final_count("AAB")
with raises(ValueError):
    final_count("AAABBC")` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'gil-and-free-threading-language-or-implementation',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Is the GIL part of the Python language? Which Python implementations have one?',
      answer: 'No — the language reference never mentions it; it is a CPython implementation detail. CPython’s default build has one (and 3.13+ offers an optional free-threaded build without it), PyPy and GraalPy have one, Jython and IronPython never did, MicroPython depends on the port, and Pyodide is CPython on WebAssembly with the GIL but no threads in the browser.',
      explanation: py`The \`threading\` docs label the GIL a "CPython implementation detail". Each implementation chooses how to make its object model thread-safe: a global lock is the simplest choice for reference-counted or C-extension-heavy runtimes; the JVM and .NET runtimes underneath Jython and IronPython already provide thread-safe memory management. Code written with proper locks is correct on all of them.`,
      whyAsked: 'It checks whether you separate language guarantees from implementation details — a recurring theme in senior Python interviews.',
      mistakes: ['Saying “Python has a GIL” as a language rule', 'Claiming PyPy has no GIL', 'Saying 3.13 removed the GIL for everyone'],
      followUps: ['Why does reference counting push an implementation towards a GIL?', 'How do you detect the implementation at run time?', 'What is the status of free-threading in 3.14?'],
      modelAnswer: 'No. The language reference says nothing about a GIL; it is an implementation detail of CPython, and the threading docs label it that way. Standard CPython has one, although since 3.13 there is an optional free-threaded build without it, officially supported in 3.14 but not the default. PyPy and GraalPy also use a GIL, while Jython and IronPython, which sit on the JVM and .NET, never had one. MicroPython depends on the port, and Pyodide is just CPython compiled to WebAssembly, so it has the GIL but can’t start threads in a browser. That’s why I write thread-safe code with locks regardless of the interpreter.',
    },
    {
      id: 'gil-and-free-threading-when-released',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'When does a thread give up the GIL in standard CPython?',
      answer: 'When it blocks on I/O or anything else that releases it (file and socket operations, time.sleep, waiting on a lock, select); when C code deliberately releases it for long computations (NumPy, hashing, compression); and when another thread has been waiting longer than the switch interval (5 ms by default), at the next check point in the evaluation loop.',
      explanation: py`Blocking C calls are wrapped in \`Py_BEGIN_ALLOW_THREADS\`/\`Py_END_ALLOW_THREADS\`. For CPU-bound Python code, a waiting thread times out after \`sys.getswitchinterval()\` and sets a drop request; the running thread honours it at an "eval breaker" check (function calls, backward jumps), not after every single instruction. Which waiting thread wins is up to the OS. A thread also drops the GIL when it finishes.`,
      whyAsked: 'The answer explains why threads help I/O-bound code and how much latency CPU-bound threads add to each other.',
      mistakes: ['Saying the GIL is released after every bytecode instruction', 'Forgetting C extensions can release it', 'Thinking the switch interval affects thread safety'],
      followUps: ['What happens to a latency-sensitive thread when another thread does CPU work?', 'How would a C extension release the GIL, and what must it not do meanwhile?', 'What does sys.setswitchinterval change?'],
      modelAnswer: 'A thread releases the GIL in three situations. First, whenever it makes a blocking call — reading a socket or file, time.sleep, waiting on a lock — CPython wraps those in macros that drop the GIL, so other threads run while it waits. Second, C extensions can release it deliberately around heavy computation, which is why NumPy or hashing large buffers can use several cores. Third, for pure-Python CPU work, a waiting thread asks for the GIL after the switch interval, five milliseconds by default, and the running thread gives it up at the next check point in the evaluation loop. None of that changes thread safety; it only decides who runs when.',
    },
    {
      id: 'gil-and-free-threading-append-vs-increment',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 4,
      question: 'Eight threads each run 10,000 iterations of `shared_list.append(1)` and `shared_count += 1` on standard CPython. Which results are possible?',
      code: { lang: 'python', code: py`import threading

shared_list = []
shared_count = 0

def work():
    global shared_count
    for _ in range(10_000):
        shared_list.append(1)
        shared_count += 1

threads = [threading.Thread(target=work) for _ in range(8)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(len(shared_list), shared_count)` },
      options: ['Always 80000 80000', 'len(shared_list) is always 80000; shared_count can be lower', 'Both can be lower', 'shared_count is always 80000; the list can be shorter'],
      correctOption: 1,
      answer: 'The list always ends with 80,000 items, because list.append on a built-in list runs inside a single instruction and the GIL (or, on the free-threaded build, the list’s own lock) keeps it consistent. shared_count can end lower because += is a separate load, add and store, and a switch between them loses updates.',
      explanation: py`How often the counter loses updates varies a lot between CPython versions and machines — on recent versions with the GIL it can be rare enough to pass many runs, which is exactly what makes it dangerous. On a free-threaded build the list is still protected by per-object locking, while the counter races far more often. The fix is a \`threading.Lock\` around the increment, or per-thread counters summed at the end.`,
      whyAsked: 'It distinguishes “the GIL protects internals” from “the GIL protects my logic” with a concrete example.',
      mistakes: ['Claiming everything is safe because of the GIL', 'Claiming the list can be corrupted on CPython', 'Assuming a race that doesn’t show up in a few runs doesn’t exist'],
      followUps: ['How would you fix the counter without a lock?', 'Is list.append atomicity a language guarantee?', 'What changes on the free-threaded build?'],
      modelAnswer: 'The list will always have 80,000 items: append on a built-in list happens inside one bytecode instruction, so the GIL keeps it consistent, and on the free-threaded build the list has its own internal lock. The counter can come out lower, because shared_count += 1 is a load, an add and a store, and if a thread switch lands between the load and the store, two threads write the same value and one increment is lost. On recent CPython versions it may rarely show up, which makes it worse, not better. I would protect the increment with a lock, or give each thread its own counter and sum them after join.',
    },
    {
      id: 'gil-and-free-threading-why-gil',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Explain how the free-threaded build keeps CPython safe without a GIL, and what it costs.',
      answer: 'It replaces the GIL with biased reference counting (cheap counts for the owning thread, atomic ones for others), immortal and deferred-reference-counted objects, per-object locks inside built-in types, a thread-safe allocator (mimalloc) and delayed freeing of memory other threads may still read. Costs: slower single-threaded code than the default build, higher memory use, and C extensions must be rebuilt and declare support or the GIL is re-enabled.',
      explanation: py`Reference counting is the main obstacle: making every count update atomic would be slow, so PEP 703 biases counts towards the creating thread. Objects shared by everyone (\`None\`, small ints, functions, modules) are immortal or use deferred counting to avoid contention. Built-in containers lock per object so their internals stay consistent. User-level races are not prevented. Extension authors must avoid borrowed references and protect global state; 3.13 added APIs like \`PyList_GetItemRef\`.`,
      whyAsked: 'Tests deep understanding of CPython internals and the trade-offs behind a major runtime change.',
      mistakes: ['Saying they simply made every refcount atomic', 'Claiming user code becomes thread-safe', 'Ignoring the C extension ecosystem'],
      followUps: ['Why are borrowed references dangerous without a GIL?', 'What happens when an unsupported extension is imported?', 'How would you evaluate the build for your service?'],
      modelAnswer: 'The GIL mostly protected reference counts and the internals of built-in objects, so the free-threaded build replaces it piece by piece. Reference counts are biased: the thread that owns an object updates its count cheaply, other threads use atomic operations on a separate counter. Objects everyone touches, like None or small ints, are immortal, and things like functions and modules use deferred reference counting to avoid contention. Lists and dicts get their own fine-grained locks, and the allocator is mimalloc with delayed freeing so a thread can’t read memory another thread just released. The price is some single-threaded slowdown, more memory, and an ecosystem cost: C extensions must be rebuilt for the t ABI and declare support, otherwise importing them turns the GIL back on.',
    },
    {
      id: 'gil-and-free-threading-cpu-options',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'A service on Python 3.14 resizes and scores images. Profiling shows the hot path is pure-Python scoring code plus a C imaging library. It currently uses a thread pool and saturates one core. Lay out your options.',
      answer: 'First confirm where time goes. If the C library releases the GIL, its share already scales with threads; the pure-Python scoring does not. Options: a ProcessPoolExecutor (proven; costs memory, start-up and pickling), subinterpreters via InterpreterPoolExecutor (3.14; isolated GILs in one process, but extensions must support them), the free-threaded build (threads scale if every C dependency ships cp314t wheels), or moving the scoring into vectorised/compiled code. Pick by measurement, starting with processes as the safe baseline.',
      explanation: py`Each option escapes the single GIL differently: processes and subinterpreters give each worker its own interpreter (and GIL); free-threading removes the lock; compiled code runs outside the evaluation loop and can release the GIL. Trade-offs: process memory and serialisation; subinterpreter maturity and extension support; free-threaded single-thread overhead and dependency readiness (check \`sys._is_gil_enabled()\` after imports); engineering cost of rewriting hot code. Thread-safety review is required for free-threading.`,
      whyAsked: 'Senior candidates must turn GIL knowledge into a concrete, measured architecture decision.',
      mistakes: ['Jumping straight to “switch to 3.14t” without checking extensions', 'Adding more threads', 'Ignoring the cost of pickling large images between processes'],
      followUps: ['How would you verify the C library releases the GIL?', 'How do you pass large images to worker processes efficiently?', 'What would make you choose subinterpreters over processes?'],
      modelAnswer: 'I would first profile to split the time between the C imaging library and the pure-Python scoring. If the library releases the GIL, threads already help for that part; the Python scoring is what’s serialised. The safe baseline is a ProcessPoolExecutor: every worker has its own interpreter and GIL, at the cost of memory, start-up and pickling images, which I would reduce with shared memory or by passing file paths. On 3.14 I could try InterpreterPoolExecutor, which gives isolated GILs inside one process, provided the extensions support subinterpreters. The free-threaded build would let the existing thread pool scale, but only if every C dependency ships free-threaded wheels — I would assert sys._is_gil_enabled() is False after imports — and after a thread-safety review. Rewriting the scoring with NumPy or compiled code is the other lever. I would benchmark the candidates on real traffic before choosing.',
    },
    {
      id: 'gil-and-free-threading-implementations',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare CPython, PyPy, MicroPython and Pyodide from the point of view of someone writing multi-threaded Python.',
      answer: 'CPython: GIL in the default build (threads help I/O, not pure-Python CPU work), optional free-threaded build since 3.13. PyPy: also a GIL, but a JIT makes single-threaded code much faster. MicroPython: a small runtime for microcontrollers whose threading support (and GIL) depends on the port. Pyodide: CPython compiled to WebAssembly — same GIL, but threads can’t be started in the browser, so concurrency means asyncio.',
      explanation: py`The common denominator is the language: \`threading\` semantics plus your own locks. Performance characteristics differ wildly, and some platforms have no threads at all. Portable code feature-detects (\`sys.implementation.name\`, \`Py_GIL_DISABLED\`) instead of assuming CPython defaults, and keeps shared state behind locks or queues.`,
      whyAsked: 'Shows breadth: Python runs in many places, and concurrency advice that only fits desktop CPython can be wrong elsewhere.',
      mistakes: ['Assuming PyPy removes the GIL', 'Assuming every platform supports threads', 'Treating Pyodide as a different language'],
      followUps: ['Why do browser runtimes struggle with threads?', 'How would you write code that works on all of them?', 'Where does GraalPy fit?'],
      modelAnswer: 'On CPython the default build has a GIL, so threads are great for I/O-bound work and useless for pure-Python CPU work, and since 3.13 there is an optional free-threaded build where threads can run in parallel. PyPy also has a GIL, but its JIT often makes the single-threaded code fast enough that it matters less. MicroPython is a tiny implementation for microcontrollers; whether threads exist and whether there’s a GIL depends on the port. Pyodide is CPython compiled to WebAssembly, so the GIL is the same, but in a browser you can’t start threads at all, so concurrency there means asyncio. Portable code uses locks or queues for shared state and detects the implementation rather than assuming CPython.',
    },
    {
      id: 'gil-and-free-threading-account',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Fix `Account.withdraw` so the balance check and the update happen inside **one** `with self._lock:` block — otherwise another thread can withdraw between the check and the update. Keep `deposit`, `withdraw` (raising `ValueError("insufficient funds")`) and the `balance` attribute.',
      answer: 'Move the check inside the lock: with self._lock: if amount > self.balance: raise ValueError(...); self.balance -= amount. Do the same for deposit so every read-modify-write of balance is one critical section.',
      explanation: py`The starter checks \`amount > self.balance\` before taking the lock, so two threads can both pass the check against the same balance and overdraw. The test simulates exactly that: its fake lock changes the balance at the moment the lock is acquired, as if another thread had just withdrawn. Only code that checks *after* acquiring the lock sees the new balance. The GIL never prevents this; it is the classic check-then-act race.`,
      starter: { files: { 'main.py': py`import threading


class Account:
    def __init__(self, balance):
        self.balance = balance
        self._lock = threading.Lock()

    def deposit(self, amount):
        with self._lock:
            self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:              # checked OUTSIDE the lock
            raise ValueError("insufficient funds")
        with self._lock:
            self.balance -= amount


account = Account(100)
account.withdraw(30)
account.deposit(5)
print(account.balance)
` } },
      tests: [
        { name: 'deposit and withdraw update the balance', code: py`acct = Account(100)
acct.withdraw(30)
acct.deposit(5)
assert acct.balance == 75` },
        { name: 'overdrawing raises ValueError', code: py`acct = Account(10)
with raises(ValueError):
    acct.withdraw(11)
assert acct.balance == 10` },
        { name: 'the check happens after the lock is acquired', code: py`acct = Account(100)

class RivalWithdrawalLock:
    """While we waited for the lock, another thread emptied the account."""
    def __enter__(self):
        acct.balance = 0
        return self

    def __exit__(self, *exc):
        return False

acct._lock = RivalWithdrawalLock()
with raises(ValueError):
    acct.withdraw(60)
assert acct.balance == 0, 'The balance went negative: check it inside the lock'` },
      ],
      solution: { files: { 'main.py': py`import threading


class Account:
    def __init__(self, balance):
        self.balance = balance
        self._lock = threading.Lock()

    def deposit(self, amount):
        with self._lock:
            self.balance += amount

    def withdraw(self, amount):
        with self._lock:                       # check and update together
            if amount > self.balance:
                raise ValueError("insufficient funds")
            self.balance -= amount


account = Account(100)
account.withdraw(30)
account.deposit(5)
print(account.balance)
` } },
      hints: ['Everything the decision depends on must be read while holding the lock.', 'Move `with self._lock:` to the top of withdraw and indent the check under it.'],
      whyAsked: 'Check-then-act races are the most common real concurrency bug; fixing one cleanly shows you know what a critical section must cover.',
      mistakes: ['Locking only the write', 'Relying on the GIL', 'Using two separate lock acquisitions for the check and the update'],
      followUps: ['How would you transfer between two accounts without deadlocks?', 'Would an RLock be needed here?', 'How would you test this under real contention?'],
      modelAnswer: 'The bug is a check-then-act race: withdraw reads the balance before taking the lock, so two threads can both see enough money and both subtract, overdrawing the account. The fix is to take the lock first and do the check and the update inside the same with block, so no other thread can change the balance in between. Deposit already does its read-modify-write under the lock, which is right. The GIL wouldn’t prevent this, because the check and the subtraction are many bytecode instructions apart. For transfers between two accounts I would always acquire the two locks in a consistent order to avoid deadlocks.',
    },
  ],

  takeaways: [
    'The GIL is a CPython implementation detail: one lock per interpreter that a thread must hold to run Python bytecode.',
    'It exists mainly to make reference counting and interpreter internals thread-safe cheaply, and to keep C extensions simple.',
    'It is released around blocking I/O, by C code doing heavy work, and handed over after the switch interval (5 ms by default) when others wait.',
    'It protects the interpreter, not your logic: count += 1 and check-then-act still race — use locks or queues on every build.',
    'Free-threaded CPython (PEP 703) was experimental in 3.13 and is officially supported but not the default in 3.14 (PEP 779); it costs some single-threaded speed and needs compatible C extensions.',
    'Detect the build with sysconfig.get_config_var("Py_GIL_DISABLED") and the current state with sys._is_gil_enabled() (3.13+, via getattr).',
    'Other implementations differ: PyPy and GraalPy have a GIL, Jython and IronPython don’t, MicroPython depends on the port, and Pyodide is CPython on WebAssembly without threads.',
  ],
}
