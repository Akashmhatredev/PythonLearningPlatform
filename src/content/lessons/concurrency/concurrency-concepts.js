// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const WAIT_VS_WORK = py`import asyncio
import time

PAGES = {"news": 0.2, "weather": 0.1, "scores": 0.15}   # page -> seconds of waiting


async def download(page, seconds):
    """I/O-bound: almost all of the time is spent waiting for the network."""
    print(f"  start {page}")
    await asyncio.sleep(seconds)          # simulated network wait
    print(f"  done  {page}")
    return page


def crunch(n):
    """CPU-bound: the processor is busy the whole time."""
    total = 0
    for i in range(n):
        total += i * i
    return total


async def crunch_task(name, chunks):
    total = 0
    for chunk in range(chunks):
        total += crunch(20_000)           # never awaits: nobody else can run meanwhile
    print(f"  crunched {name}")
    return total


async def main():
    print("I/O-bound, one after another:")
    start = time.perf_counter()
    for page, seconds in PAGES.items():
        await download(page, seconds)
    sequential_io = time.perf_counter() - start

    print("I/O-bound, overlapping the waits:")
    start = time.perf_counter()
    await asyncio.gather(*(download(p, s) for p, s in PAGES.items()))
    overlapped_io = time.perf_counter() - start

    print("CPU-bound, one after another:")
    start = time.perf_counter()
    for name in "ABC":
        await crunch_task(name, 3)
    sequential_cpu = time.perf_counter() - start

    print("CPU-bound, 'overlapped' on one thread:")
    start = time.perf_counter()
    await asyncio.gather(*(crunch_task(name, 3) for name in "ABC"))
    overlapped_cpu = time.perf_counter() - start

    print(f"waiting:   sequential {sequential_io:.2f}s, overlapped {overlapped_io:.2f}s")
    print(f"crunching: sequential {sequential_cpu:.2f}s, overlapped {overlapped_cpu:.2f}s")


asyncio.run(main())
`

export default {
  id: 'concurrency-concepts',
  title: 'Concurrency vs parallelism & the GIL',
  summary: 'Concurrency is juggling many tasks so their waits overlap; parallelism is running tasks at the same instant on different cores — and in standard CPython the GIL decides which of the two threads can give you.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['defining-functions', 'generators'],
  related: ['threading', 'multiprocessing', 'asyncio-basics', 'asyncio-in-practice', 'choosing-concurrency', 'gil-and-free-threading', 'profiling', 'bytecode', 'memory-management'],
  tags: ['concurrency', 'parallelism', 'GIL', 'global interpreter lock', 'I/O-bound', 'CPU-bound', 'threads', 'processes', 'coroutines', 'asyncio', 'free-threading', 'free-threaded', 'PEP 703', 'PEP 779', 'cores', 'scheduler', 'context switch', 'Amdahl'],
  apis: [
    { name: 'threading.Thread', summary: 'An OS thread inside the current process; shares memory with every other thread.' },
    { name: 'multiprocessing.Process', summary: 'A separate OS process with its own memory and its own interpreter (and its own GIL).' },
    { name: 'asyncio.run(coro)', summary: 'Starts an event loop, runs one coroutine to completion and closes the loop.' },
    { name: 'asyncio.gather(*aws)', summary: 'Runs awaitables concurrently and returns their results in argument order.' },
    { name: 'sys._is_gil_enabled()', summary: '(3.13+) True if the GIL is active in this interpreter; False on a free-threaded build running without it.' },
    { name: 'sys.getswitchinterval()', summary: 'How often (in seconds) CPython asks the running thread to hand over the GIL. The default is 0.005.' },
    { name: 'os.cpu_count() / os.process_cpu_count()', summary: 'Number of logical CPUs in the machine / usable by this process (process_cpu_count is 3.13+).' },
    { name: 'time.perf_counter()', summary: 'A high-resolution clock for measuring elapsed (wall-clock) time.' },
  ],
  docs: [
    { label: 'Python docs — Concurrent execution', url: 'https://docs.python.org/3/library/concurrency.html' },
    { label: 'Glossary — global interpreter lock', url: 'https://docs.python.org/3/glossary.html#term-global-interpreter-lock' },
    { label: 'HOWTO — Python support for free threading', url: 'https://docs.python.org/3/howto/free-threading-python.html' },
    { label: 'PEP 703 — Making the Global Interpreter Lock optional', url: 'https://peps.python.org/pep-0703/' },
    { label: 'PEP 779 — Criteria for supported status for free-threaded Python', url: 'https://peps.python.org/pep-0779/' },
    { label: 'What’s new in Python 3.14', url: 'https://docs.python.org/3/whatsnew/3.14.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Most programs you have written so far do one thing at a time: line 1, then line 2, then line 3. That's called **sequential** execution. It is simple and predictable — and often wasteful, because a lot of real programs spend most of their life *waiting*: for a web page, a database, a file, a user.`,
    py`**Concurrency** means structuring a program so several tasks are *in progress* at once: while one task waits, another makes progress. **Parallelism** means several tasks are *executing at the same instant*, on different CPU **cores** (a core is one independent "brain" inside the processor; most laptops have several).`,
    py`Python gives you three tools, which the rest of this level covers one by one:`,
    py`- **threads** ([threading](lesson:threading)) — several flows of execution inside one program, sharing its memory;
- **processes** ([multiprocessing](lesson:multiprocessing)) — several separate copies of the Python interpreter, each with its own memory;
- **coroutines** ([async/await](lesson:asyncio-basics)) — many tasks taking turns on a single thread, switching only at \`await\`.`,
    py`Which one helps depends on *what kind of work* you are doing, and — in standard CPython — on a lock called the **GIL**. This lesson builds the mental model you need before writing any concurrent code. [Choosing a concurrency model](lesson:choosing-concurrency) turns it into a decision guide at the end of the level.`,
  ],
  why: [
    py`**Waiting is expensive.** A program that downloads 100 web pages one by one spends nearly all its time idle, waiting for replies. Overlapping those waits can turn minutes into seconds without a faster computer.`,
    py`**Cores are idle.** A pure-Python number-crunching loop uses one core. The other cores in the machine sit unused unless you deliberately spread the work across them.`,
    py`**Responsiveness.** A server must keep answering other users while one request waits for the database; a desktop app must keep redrawing while it saves a file.`,
    py`**Picking the wrong tool is costly.** Threads won't speed up pure-Python calculations in standard CPython, \`async\` won't help code that never waits, and processes are overkill for downloads. Knowing *why* saves days of confused optimisation.`,
  ],
  eli15: [
    py`Imagine a Saturday with three chores: laundry (90 minutes, but the machine does the work), homework (an hour of real thinking) and waiting for a pizza delivery.`,
    py`Doing them **sequentially** means starting the washing machine and staring at it for 90 minutes before you even open your book. Silly.`,
    py`**Concurrency** is what you actually do: start the washer, then do homework while it spins, and answer the door when the pizza arrives. You're one person, doing one thing at any instant, but three chores are *in progress* — the waits overlap.`,
    py`**Parallelism** is getting your sibling to do half the homework *at the same time* as you. Now two brains are working at once. That only helps with the thinking part — it does nothing for the washing machine, which takes 90 minutes no matter how many people watch it.`,
    py`Computers work the same way. Work that is mostly **waiting** (I/O-bound) needs concurrency. Work that is mostly **thinking** (CPU-bound) needs parallelism.`,
  ],
  analogy: {
    title: 'A restaurant kitchen',
    body: [
      py`A **single cook** (one thread) can still run a busy kitchen: put the pasta on to boil, chop the salad while it cooks, check the oven, plate the starter. Nothing happens at the same instant, but nobody stands idle while water boils. That is **concurrency** — and it's exactly what \`asyncio\` does: one cook, a timer on every pot.`,
      py`Hire **more cooks** in the same kitchen (threads) and they can all wait on different ovens at once. But in standard CPython there is only **one knife**: the GIL. Whoever holds the knife can chop (run Python code); everybody else waits for it. Great when the work is mostly waiting for ovens; useless when the work is mostly chopping.`,
      py`Open **more kitchens** (processes) and each one has its own knife, so chopping really happens in parallel. The price: each kitchen needs its own space, staff and equipment, and dishes have to be carried between kitchens (data is copied between processes).`,
    ],
    mapping: [
      ['a dish in progress', 'a task (a download, a calculation, a request)'],
      ['waiting for water to boil', 'I/O-bound work: waiting for the network, a disk, a database'],
      ['chopping vegetables', 'CPU-bound work: the processor is busy running your code'],
      ['one cook juggling dishes', 'concurrency on one thread (asyncio, or threads taking turns)'],
      ['several cooks sharing one knife', 'threads in standard CPython sharing one GIL'],
      ['several separate kitchens', 'processes: separate memory, separate GILs, real parallelism'],
      ['carrying dishes between kitchens', 'sending data between processes (pickling, inter-process communication)'],
    ],
  },
  visual: {
    type: 'concurrency',
    title: 'Three downloads under four models',
    props: { preset: 'io-bound' },
    alt: 'Four timelines for the same three downloads. Sequential: three blocks one after another, each mostly waiting, finishing at about 3 units. Threads: three lanes whose waits overlap, with tiny slivers queued for the GIL, finishing at about 1.2 units. asyncio: three tasks on one thread whose waits overlap, about 1.2 units. Processes: three lanes that each pay a start-up cost first, about 1.3 units.',
    caption: py`Press ▶ and watch where the **waiting** goes. When work is mostly waiting, every model that overlaps the waits wins — and asyncio does it on a single thread. Timings are schematic units, not a benchmark.`,
  },
  syntax: [
    py`There is no single "concurrency syntax" — each model has its own API, covered in the following lessons. Here is the same job, "run \`task\` for three inputs", in each style so you can recognise them.`,
    py`#### Sequential (the baseline)`,
    { code: py`def task(n):
    return n * n

results = [task(n) for n in (1, 2, 3)]   # one after another`, lang: 'python', title: 'sequential' },
    py`#### Threads — concurrent; parallel only for code that releases the GIL`,
    { code: py`from concurrent.futures import ThreadPoolExecutor

def task(n):
    return n * n

with ThreadPoolExecutor(max_workers=3) as pool:
    results = list(pool.map(task, [1, 2, 3]))   # runs in 3 threads`, lang: 'python', title: 'threads (run on your own machine)', static: true },
    py`#### Processes — parallel, separate memory`,
    { code: py`from concurrent.futures import ProcessPoolExecutor

def task(n):
    return n * n

if __name__ == "__main__":                       # required when processes are spawned
    with ProcessPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(task, [1, 2, 3]))   # runs in 3 processes`, lang: 'python', title: 'processes (run on your own machine)', static: true },
    py`#### Coroutines — concurrent on one thread, switching at \`await\``,
    { code: py`import asyncio

async def task(n):
    await asyncio.sleep(0.1)    # a wait: other tasks run meanwhile
    return n * n

async def main():
    return await asyncio.gather(task(1), task(2), task(3))

results = asyncio.run(main())   # [1, 4, 9]`, lang: 'python', title: 'asyncio (runs in the playground)' },
    { callout: 'warn', title: 'This browser sandbox', text: py`The playground runs real CPython 3.14 compiled to WebAssembly on a single thread. \`asyncio\` works fully, but **threads and processes cannot start here**: \`Thread.start()\` and \`ThreadPoolExecutor\` raise \`RuntimeError: can't start new thread\`, and \`multiprocessing\` can't create processes. Threading and multiprocessing examples in this level are marked to run on your own computer.` },
    py`#### Vocabulary`,
    py`| term | meaning |
|---|---|
| **I/O-bound** | most time is spent waiting for input/output: network, disk, database, user |
| **CPU-bound** | most time is spent computing: the processor is busy the whole time |
| **process** | a running program with its own private memory; the OS isolates processes from each other |
| **thread** | a flow of execution *inside* a process; threads of one process share its memory |
| **coroutine** | a function defined with \`async def\` that can pause at \`await\` and resume later |
| **pre-emptive** | the OS can pause a thread at (almost) any moment and switch to another — threads and processes |
| **cooperative** | a task only switches when it chooses to (at \`await\`) — asyncio |
| **GIL** | CPython's Global Interpreter Lock: only one thread at a time runs Python bytecode in a process |`,
  ],
  walkthrough: {
    title: 'Reading the wait-vs-work experiment',
    lang: 'python',
    code: WAIT_VS_WORK,
    intro: py`This is the program in the playground below (press **Guide** there to step through it in the editor). It uses \`asyncio\` — the one concurrency model that runs inside the browser — to compare work that *waits* with work that *computes*.`,
    steps: [
      { lines: [4], text: py`Three pages and how long each one makes us wait. \`asyncio.sleep\` stands in for a real network call, which keeps the experiment deterministic.` },
      { lines: [7, 12], text: py`\`download\` is a **coroutine** (\`async def\`). \`await asyncio.sleep(seconds)\` pauses *this* task and hands control back to the event loop, which can run other tasks meanwhile. That is the whole trick behind concurrency on one thread.` },
      { lines: [15, 20], text: py`\`crunch\` is the opposite: a tight loop where the CPU is busy every moment. There's nothing to wait for, so nothing to overlap.` },
      { lines: [23, 28], text: py`\`crunch_task\` wraps the computation in a coroutine, but it never \`await\`s anything while computing. Being \`async\` does not make code concurrent — only awaiting does.` },
      { lines: [32, 36], text: py`Sequential I/O: each \`await download(...)\` finishes completely before the next one starts. Total ≈ 0.2 + 0.1 + 0.15 = 0.45 s.` },
      { lines: [38, 41], text: py`\`asyncio.gather\` turns each coroutine into a **task** and runs them concurrently. All three waits overlap, so the total is roughly the *longest* wait (≈ 0.2 s), not the sum.` },
      { lines: [43, 52], text: py`The same comparison for CPU-bound work. \`gather\` can't overlap anything because the tasks never pause; they simply run one after another on the single thread. The two timings come out about the same.` },
      { lines: [54, 55], text: py`The summary: overlapping waits pays off; "overlapping" computation on one thread doesn't. For computation you need **parallelism** — separate cores — which in standard CPython means processes.` },
    ],
  },
  playground: {
    title: 'Waiting vs working',
    objective: 'Run it, compare the two pairs of timings, then use the experiments to see what turns concurrency on and off.',
    files: { 'main.py': WAIT_VS_WORK },
    expected: py`The I/O section shows the difference in **order**: sequentially each page starts and finishes before the next; overlapped, all three start first and finish shortest-wait first.

\`\`\`text
I/O-bound, overlapping the waits:
  start news
  start weather
  start scores
  done  weather
  done  scores
  done  news
\`\`\`

The last two lines show live timings measured in your browser. The overlapped I/O time should be close to the longest single wait (about 0.2 s) while the sequential one is close to the sum (about 0.45 s). The two "crunching" timings should be roughly equal — exact numbers depend on your machine.`,
    experiments: [
      {
        id: 'add-page',
        task: py`Add a fourth page to \`PAGES\`: \`"maps": 0.25\`. Before running, predict: how much longer does the **sequential** I/O section take? And the **overlapped** one?`,
        hint: py`Only the dictionary on line 4 needs to change. Sequential time grows by the whole new wait; overlapped time grows only if the new wait is longer than the longest existing one.`,
        tests: [
          { name: '"maps" is one of the pages', code: py`assert "maps" in PAGES, 'Add "maps": 0.25 to the PAGES dictionary'` },
          { name: 'maps was downloaded in both I/O sections', code: py`assert output.count("done  maps") >= 2` },
        ],
        explain: py`Sequential time is the **sum** of the waits, so it grows by 0.25 s. Overlapped time is roughly the **maximum** wait, so it grows only from 0.2 s to 0.25 s. That difference — sum vs maximum — is why concurrency is so effective for I/O-bound work, and why adding the 100th download to a concurrent crawler barely changes the total.`,
      },
      {
        id: 'block-the-loop',
        task: py`In \`download\`, replace \`await asyncio.sleep(seconds)\` with \`time.sleep(seconds)\` (a *blocking* sleep that never awaits). Run it and look at the order of the overlapped section.`,
        hint: py`Change line 10 to \`time.sleep(seconds)\`. \`time\` is already imported. The function stays \`async def\`.`,
        tests: [
          {
            name: 'the overlapped section is now sequential',
            code: py`section = output.split("I/O-bound, overlapping the waits:")[1].split("CPU-bound")[0]
assert section.index("done  news") < section.index("start weather"), 'news should finish before weather even starts'`,
          },
        ],
        explain: py`\`time.sleep\` holds on to the thread for the whole wait and never gives control back to the event loop, so no other task can start. The "overlapped" section becomes sequential and takes as long as the first one. One blocking call inside async code freezes **every** task — the most common asyncio bug, covered in [asyncio in practice](lesson:asyncio-in-practice).`,
      },
      {
        id: 'take-turns',
        task: py`Make the CPU-bound tasks *take turns*: inside the \`for chunk\` loop of \`crunch_task\`, after the \`crunch\` line, add \`print(f"  {name} finished chunk {chunk}")\` and then \`await asyncio.sleep(0)\`. Compare the order of the lines in the last section — and the timings.`,
        hint: py`Both new lines go inside the loop, indented like the \`total += …\` line. \`asyncio.sleep(0)\` means "let the others run, then come back to me".`,
        tests: [
          {
            name: 'the tasks interleave in the overlapped CPU section',
            code: py`section = output.split("'overlapped' on one thread:")[1]
assert "A finished chunk 1" in section, 'Print exactly: "  {name} finished chunk {chunk}"'
assert section.index("B finished chunk 0") < section.index("A finished chunk 1"), 'B should get a turn before A continues'`,
          },
        ],
        explain: py`Now the tasks interleave — A0, B0, C0, A1, B1… — so each one makes steady progress, which matters for *fairness* and responsiveness. But the total crunching time doesn't shrink: one thread is still doing all the arithmetic. Taking turns is concurrency; finishing sooner needs parallelism, i.e. more cores ([multiprocessing](lesson:multiprocessing)).`,
      },
      {
        id: 'predict-models',
        task: py`No code this time — predict. If you rewrote this program with **threads** on your own machine (standard CPython), which section would get faster? And with **processes**? Write your two predictions down, then check them against the "Watch it work" animation below.`,
        explain: py`Threads would speed up the I/O section (a thread that is waiting releases the GIL, so the waits overlap) but not the CPU section (only the thread holding the GIL runs Python code). Processes would speed up both — but for the I/O part they're overkill: each process costs start-up time and memory, while one asyncio thread already overlaps the waits for free.`,
      },
    ],
  },
  animation: {
    type: 'concurrency',
    title: 'CPU-bound work: only processes go faster',
    props: { preset: 'cpu-bound' },
    alt: 'Four timelines for three pure-computation jobs. Sequential takes about 3 units. Threads take turns holding the GIL and still take about 3 units. asyncio has nothing to await and runs the jobs one after another, about 3 units. Three processes each run on their own core after a short start-up, finishing at about 1.3 units.',
    caption: py`Here there is no waiting to overlap. In standard CPython, threads just take turns holding the GIL, and asyncio can't even take turns. Only separate processes, each with its own interpreter and GIL, use several cores at once.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Your operating system (OS) runs hundreds of programs "at once" on a handful of cores. It does this with a **scheduler**: it gives each thread a tiny time slice, pauses it, saves its state, and resumes another one. This pause-and-swap is a **context switch**, and it happens so fast that everything looks simultaneous.`,
      py`So even on a single core, the OS gives you **concurrency**: many things in progress, sharing time. With several cores, it can also give you **parallelism**: different threads genuinely running at the same instant.`,
      py`A **process** is a running program with its own private memory. Two processes can't see each other's variables. A **thread** lives inside a process; all threads of one process share the same memory — the same lists, dicts and objects. Sharing is convenient (no copying) and dangerous (two threads can change the same object at the same time; see [threads & race conditions](lesson:threading)).`,
      py`A **coroutine** isn't an OS concept at all. It's a Python function that can pause itself at \`await\`. An **event loop** — ordinary Python code running on one thread — keeps a list of paused tasks and resumes whichever one is ready. The OS sees just one thread.`,
    ],
    technical: [
      py`#### What the GIL is`,
      py`CPython — the standard interpreter you download from python.org — has a **Global Interpreter Lock**: a lock (a "talking stick") that a thread must hold to execute Python bytecode. There is one GIL per interpreter, so in a normal process only one thread runs Python code at any moment, even on a 16-core machine.`,
      py`The running thread doesn't keep it forever. CPython asks it to release the GIL every **switch interval** (\`sys.getswitchinterval()\`, 0.005 s by default) so other threads get a turn, and a thread **releases the GIL whenever it blocks** — on a socket read, a file read, \`time.sleep()\`, waiting for a lock. Many C extensions also release it during long computations (hashing large data in \`hashlib\`, compression in \`zlib\`, most heavy NumPy operations), so that work *can* run in parallel across threads.`,
      py`#### Why CPython has one`,
      py`Every CPython object carries a **reference count** that changes constantly as names and containers point to it (see [memory management](lesson:memory-management)). If two threads updated the same count at the same moment, the count could be corrupted and objects freed while still in use. One big lock makes all of that safe with almost no cost for single-threaded programs, and it made writing C extensions simple. That trade-off dates from the 1990s, when multi-core machines were rare.`,
      py`#### What it protects — and what it doesn't`,
      py`The GIL protects the **interpreter's own internals**: reference counts, the internals of dicts and lists, the memory allocator. That is why, in practice, a single operation such as \`items.append(x)\` or \`scores[key] = value\` won't corrupt a list or dict when two threads do it at once.`,
      py`It does **not** make *your* logic atomic. A thread can be switched out between any two bytecode instructions, and most Python statements are several instructions. \`count += 1\` compiles to "load count, add 1, store count":`,
      { code: py`>>> import dis
>>> def bump():
...     global count
...     count += 1
...
>>> dis.dis(bump)
  ...
  LOAD_GLOBAL              0 (count)
  LOAD_SMALL_INT           1
  BINARY_OP               13 (+=)
  STORE_GLOBAL             0 (count)
  ...`, lang: 'pycon', title: 'CPython 3.14 bytecode (names vary between versions)' },
      py`If the switch happens after the load but before the store, two threads both read the same old value and one increment is lost — a **race condition**. The fix is a lock around the whole read-modify-write ([threading](lesson:threading)).`,
      { callout: 'note', title: 'CPython detail', text: py`The GIL is a property of the **CPython implementation**, not of the Python language. PyPy also has a GIL; Jython and IronPython never had one. The language itself only promises what the documentation says about each operation — so correct concurrent code uses locks and queues rather than relying on "the GIL makes this safe". The exact bytecode, the switch interval and which C functions release the GIL are all implementation details that can change between versions.` },
      py`#### Free-threaded CPython (PEP 703, PEP 779)`,
      { callout: 'version', title: '3.13: experimental · 3.14: supported, not the default', text: py`[PEP 703](https://peps.python.org/pep-0703/) made the GIL optional through a **separate build** of CPython, often installed as \`python3.13t\` / \`python3.14t\` ("t" for threaded). In **3.13** the free-threaded build was *experimental*. In **3.14** it became *officially supported* ([PEP 779](https://peps.python.org/pep-0779/)), but it is still **not the default**: the normal \`python3.14\` has a GIL. Whether it ever becomes the default is a future decision.` },
      py`In the free-threaded build, threads really run Python bytecode in parallel. To stay safe without one big lock, CPython uses techniques such as *biased reference counting*, *immortal objects* and fine-grained per-object locks inside built-in types. The costs: single-threaded code runs somewhat slower than on the default build, and C extensions must be rebuilt and declare that they support running without the GIL — importing one that doesn't re-enables the GIL (with a warning) unless you override it with \`PYTHON_GIL=0\` or \`-X gil=0\`.`,
      { code: py`import sys
import sysconfig

print(sysconfig.get_config_var("Py_GIL_DISABLED"))  # 1 on a free-threaded build, 0 (or None) otherwise
print(sys._is_gil_enabled())                        # 3.13+: is the GIL active right now?`, lang: 'python', title: 'which build am I running?' },
      py`Free-threading changes *performance*, not *correctness*: \`count += 1\` from two threads is still a race. If anything, races show up more often, because threads now truly overlap. Python 3.14 also adds \`concurrent.interpreters\` (PEP 734): several interpreters in one process, each with its own GIL. See [the GIL & free-threaded Python](lesson:gil-and-free-threading) for the deep dive.`,
    ],
    production: [
      py`**Classify before you choose.** Measure where time goes ([profiling](lesson:profiling)). If a job's wall-clock time is much larger than the CPU time it used, it is waiting — I/O-bound. If CPU time is close to wall time, it is CPU-bound. Mixed workloads are common: a scraper waits for pages (I/O) and then parses HTML (CPU).`,
      py`**Rules of thumb that hold up in practice:**`,
      py`- I/O-bound with many connections and async libraries available → \`asyncio\`.
- I/O-bound with blocking libraries (\`requests\`, most database drivers) or a few dozen tasks → a thread pool.
- CPU-bound pure Python → a process pool, or move the hot loop into NumPy / a C extension that releases the GIL.
- Long-running or must-survive-a-restart jobs → a separate worker system (Celery, RQ, a cloud queue).`,
      py`**Parallelism has a ceiling.** *Amdahl's law*: if a fraction \`p\` of the work can run in parallel on \`n\` workers, the best possible speed-up is \`1 / ((1 - p) + p / n)\`. If only half the program parallelises, even infinite cores can't make it more than twice as fast. Find the serial part first.`,
      py`**More workers is not always faster.** Each thread costs memory and switching; each process costs start-up time, memory and data copying. Running more CPU-bound processes than you have cores just makes them take turns. Start with sensible defaults (\`ProcessPoolExecutor()\` uses the CPU count), measure, then tune. [Choosing a concurrency model](lesson:choosing-concurrency) collects the trade-offs.`,
    ],
  },
  mistakes: [
    {
      title: 'Using threads to speed up pure-Python number crunching',
      wrong: { code: py`from concurrent.futures import ThreadPoolExecutor

def crunch(n):
    return sum(i * i for i in range(n))

with ThreadPoolExecutor(max_workers=8) as pool:   # 8 threads, 1 GIL
    totals = list(pool.map(crunch, [10_000_000] * 8))`, lang: 'python', static: true },
      right: { code: py`from concurrent.futures import ProcessPoolExecutor

def crunch(n):
    return sum(i * i for i in range(n))

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:            # one process per core by default
        totals = list(pool.map(crunch, [10_000_000] * 8))`, lang: 'python', static: true },
      explanation: py`On standard CPython only the thread holding the GIL runs Python bytecode, so eight threads crunching pure Python just take turns — often slightly *slower* than one thread because of the switching. Separate processes each have their own interpreter and GIL, so they run on separate cores. (On a free-threaded 3.13+/3.14 build the threaded version can run in parallel.)`,
    },
    {
      title: 'Believing the GIL makes your code thread-safe',
      wrong: { code: py`import threading

hits = 0

def record_hit():
    global hits
    hits += 1          # read, add, write: a thread switch can land in between`, lang: 'python', static: true },
      right: { code: py`import threading

hits = 0
hits_lock = threading.Lock()

def record_hit():
    global hits
    with hits_lock:    # the whole read-add-write happens as one step
        hits += 1`, lang: 'python', static: true },
      explanation: py`The GIL keeps the *interpreter* consistent; it doesn't group your statements together. \`hits += 1\` is several bytecode instructions, and a switch between them loses updates. Protect shared read-modify-write sequences with a lock, or avoid shared state with a queue.`,
    },
    {
      title: 'Expecting async def alone to make code concurrent',
      wrong: { code: py`import asyncio
import time

async def fetch(page):
    time.sleep(1)            # blocks the whole event loop
    return page

async def main():
    return [await fetch(p) for p in ("a", "b", "c")]   # and awaits one at a time`, lang: 'python' },
      right: { code: py`import asyncio

async def fetch(page):
    await asyncio.sleep(1)   # a real pause: other tasks run meanwhile
    return page

async def main():
    return await asyncio.gather(*(fetch(p) for p in ("a", "b", "c")))`, lang: 'python' },
      explanation: py`Two separate bugs. \`time.sleep\` (like \`requests.get\` or any blocking call) never yields to the event loop, so nothing else can run. And awaiting coroutines one after another is still sequential; you need \`gather\` or tasks to run them together. See [async/await](lesson:asyncio-basics).`,
    },
    {
      title: 'Adding concurrency before measuring',
      wrong: { code: py`# "The report is slow, let's add 32 threads"
# ...and it's still slow: 95% of the time was one slow SQL query.`, lang: 'python', static: true },
      right: { code: py`import cProfile

cProfile.run("build_report()", sort="cumulative")   # find where the time goes first`, lang: 'python', static: true },
      explanation: py`Concurrency only helps when there are *independent* pieces of work that wait or compute separately. If one step dominates (one slow query, one huge loop), fix or parallelise that step — or accept it. Measure first with [profiling tools](lesson:profiling).`,
    },
  ],
  debugging: [
    {
      symptom: py`The program has 8 worker threads, but a CPU monitor shows roughly one core busy and it's no faster than the single-threaded version.`,
      cause: py`CPU-bound pure-Python work on standard CPython: the threads take turns holding the GIL.`,
      fix: py`Use \`ProcessPoolExecutor\` / \`multiprocessing\`, move the hot loop into a library that releases the GIL (NumPy, hashlib, zlib), or test a free-threaded 3.14 build.`,
    },
    {
      symptom: py`RuntimeWarning: coroutine 'download' was never awaited`,
      cause: py`An \`async def\` function was called like a normal function (\`download("news")\`). Calling a coroutine function only *creates* a coroutine object; nothing runs until it is awaited or scheduled.`,
      fix: py`Write \`await download("news")\`, or schedule it with \`asyncio.create_task(...)\` / \`asyncio.gather(...)\`.`,
    },
    {
      symptom: py`The asyncio version is no faster than the plain version.`,
      cause: py`Either a blocking call (\`time.sleep\`, \`requests.get\`, a sync database driver) is freezing the loop, or the code awaits coroutines one after another instead of running them together.`,
      fix: py`Use async libraries or \`await asyncio.to_thread(blocking_fn)\`, and start the work concurrently with \`asyncio.gather\` or a \`TaskGroup\`.`,
    },
    {
      symptom: py`RuntimeError: can't start new thread`,
      cause: py`In this browser sandbox: threads are not available at all. On a real machine: the process hit an OS limit on threads (often from creating one thread per item).`,
      fix: py`Run threading examples on your own computer. In real code use a bounded pool (\`ThreadPoolExecutor(max_workers=…)\`) instead of one thread per task.`,
    },
    {
      symptom: py`A shared counter ends lower than expected, and the result changes from run to run.`,
      cause: py`A race condition: several threads do read-modify-write on the same variable without a lock.`,
      fix: py`Guard the update with \`threading.Lock\`, or give each thread its own counter and add them up at the end.`,
    },
  ],
  bestPractices: [
    'Classify the work first: mostly waiting (I/O-bound) or mostly computing (CPU-bound)? Measure, don’t guess.',
    'For I/O-bound work overlap the waits with asyncio or a thread pool; for CPU-bound pure Python use processes.',
    'Prefer high-level tools (concurrent.futures, asyncio.gather/TaskGroup) over raw threads and processes.',
    'Share as little mutable state as possible; pass data through queues or return values.',
    'Never rely on the GIL for correctness — it is a CPython detail, and the free-threaded build removes it.',
    'Bound your concurrency (pool sizes, semaphores): unlimited workers exhaust memory, sockets and rate limits.',
    'Keep a simple sequential version around: it is the baseline for measuring and the easiest code to debug.',
  ],
  useCases: [
    'Downloading many web pages or calling many APIs (I/O-bound → asyncio or threads).',
    'A web server handling thousands of mostly-idle connections (I/O-bound → asyncio or a thread pool).',
    'Resizing images, simulations, parsing huge files in pure Python (CPU-bound → processes).',
    'Keeping a GUI responsive while a long task runs in the background (threads).',
    'Overnight batch jobs spread across many machines (distributed workers).',
  ],
  whenToUse: {
    use: [
      'The work splits into independent pieces that each wait (network, disk, database).',
      'CPU-heavy work splits into independent chunks and you have idle cores.',
      'A program must stay responsive while something slow happens.',
    ],
    avoid: [
      'The program is already fast enough — concurrency adds complexity and new kinds of bugs.',
      'One sequential step dominates the run time (fix that step instead).',
      'Every step depends on the result of the previous one: there is nothing to overlap.',
    ],
  },
  comparison: {
    title: 'Processes vs threads vs coroutines (standard CPython)',
    headers: ['', 'Processes', 'Threads', 'Coroutines (asyncio)'],
    rows: [
      ['memory', 'separate per process; data is copied between them', 'shared by all threads in the process', 'shared; everything runs on one thread'],
      ['who switches', 'the OS, at any moment (pre-emptive)', 'the OS, at any moment (pre-emptive)', 'your code, only at await (cooperative)'],
      ['runs Python code in parallel?', 'yes — one GIL each', 'no (GIL) — yes on a free-threaded build', 'no — one thread'],
      ['good for', 'CPU-bound work', 'I/O-bound work with blocking libraries', 'I/O-bound work with many connections'],
      ['cost per worker', 'highest: a whole interpreter', 'medium: an OS thread and its stack', 'lowest: a small Python object'],
      ['main danger', 'start-up cost, pickling data', 'race conditions, deadlocks', 'one blocking call freezes everything'],
    ],
    note: py`Each column gets its own lesson: [processes](lesson:multiprocessing), [threads](lesson:threading), [coroutines](lesson:asyncio-basics).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'concurrency-concepts-q1',
      type: 'mcq',
      prompt: 'Which statement describes the difference between concurrency and parallelism?',
      options: [
        { text: 'They are two names for the same thing.', why: 'One cook juggling three dishes is concurrent but not parallel. The difference matters for choosing a tool.' },
        'Concurrency means several tasks are in progress and their waits can overlap; parallelism means several tasks execute at the same instant on different cores.',
        { text: 'Parallelism is only possible with asyncio.', why: 'asyncio runs on one thread, so it gives concurrency without parallelism.' },
        { text: 'Concurrency always makes a program faster.', why: 'Concurrency helps when there are waits to overlap. CPU-bound work on one core gains nothing.' },
      ],
      answer: 1,
      explanation: py`Concurrency is about *structure* (dealing with many things at once); parallelism is about *execution* (doing many things at once). A parallel program is also concurrent, but not every concurrent program is parallel.`,
    },
    {
      id: 'concurrency-concepts-q2',
      type: 'output',
      prompt: 'What does this print, line by line?',
      code: py`import asyncio

async def job(name, delay):
    await asyncio.sleep(delay)
    print(name)

async def main():
    await asyncio.gather(job("slow", 0.2), job("fast", 0.1))
    print("all done")

asyncio.run(main())`,
      options: [
        { text: 'slow, fast, all done', why: 'That would be true if the jobs ran one after another. gather runs them concurrently, so the shorter wait finishes first.' },
        'fast, slow, all done',
        { text: 'all done, fast, slow', why: 'await asyncio.gather(...) waits until every job has finished before main continues.' },
        { text: 'fast, all done, slow', why: 'gather only returns after all of its awaitables are done.' },
      ],
      answer: 1,
      explanation: py`Both jobs start waiting at the same moment. The 0.1 s timer fires first (\`fast\`), then the 0.2 s one (\`slow\`), and only then does \`gather\` return and \`main\` print \`all done\`.`,
    },
    {
      id: 'concurrency-concepts-q3',
      type: 'mcq',
      prompt: 'Which of these jobs is **CPU-bound**?',
      options: [
        { text: 'Downloading 500 product pages from an online shop', why: 'Most of that time is spent waiting for the network: I/O-bound.' },
        { text: 'Running 200 SQL queries against a remote database', why: 'The program mostly waits for the database server to answer: I/O-bound.' },
        'Applying a blur filter to 1,000 photos with a pure-Python loop over pixels',
        { text: 'Waiting for the user to type their name', why: 'Waiting for input is the purest kind of I/O-bound work.' },
      ],
      answer: 2,
      explanation: py`Looping over pixels keeps the processor busy every moment — there is nothing to wait for. In standard CPython, that kind of work needs processes (or a library like NumPy/Pillow that runs in C) to use more than one core.`,
    },
    {
      id: 'concurrency-concepts-q4',
      type: 'bug',
      prompt: 'This program should finish in about 0.3 s, but it takes about 0.6 s and the downloads never overlap. Click the line that causes it.',
      code: py`import asyncio
import time

async def download(page):
    print("start", page)
    time.sleep(0.3)
    print("done", page)

async def main():
    await asyncio.gather(download("news"), download("weather"))

asyncio.run(main())`,
      answerLine: 6,
      explanation: py`\`time.sleep\` blocks the only thread the event loop has, so no other task can run until it returns. Replace it with \`await asyncio.sleep(0.3)\`, which pauses just this task.`,
    },
    {
      id: 'concurrency-concepts-q5',
      type: 'fill',
      prompt: 'Complete the program so both downloads run **concurrently** and the event loop is started.',
      code: py`import asyncio

async def download(page):
    await asyncio.sleep(0.1)
    return page

async def main():
    return await asyncio.___(download("a"), download("b"))

print(asyncio.___(main()))`,
      answer: [['gather'], ['run']],
      explanation: py`\`asyncio.gather\` wraps each coroutine in a task and waits for all of them; \`asyncio.run\` creates the event loop, runs \`main()\` to completion and returns its result: \`['a', 'b']\`.`,
    },
    {
      id: 'concurrency-concepts-q6',
      type: 'mcq',
      prompt: 'Select **all** statements that are true about the GIL in standard (non-free-threaded) CPython.',
      options: [
        'Only one thread at a time executes Python bytecode within a process.',
        { text: '`count += 1` is atomic, so a shared counter needs no lock.', why: '`count += 1` is several bytecode instructions; a thread switch between them causes lost updates.' },
        { text: 'A program using the GIL can never use more than one core.', why: 'Separate processes each have their own GIL, and C extensions that release the GIL can run in parallel threads.' },
        'A thread releases the GIL while it is blocked waiting for I/O.',
      ],
      answer: [0, 3],
      explanation: py`The GIL serialises bytecode execution inside one interpreter, and blocking I/O releases it — which is why threads still help I/O-bound programs. It does not make multi-step operations atomic, and it doesn't stop processes or GIL-releasing C code from using several cores.`,
    },
    {
      id: 'concurrency-concepts-q7',
      type: 'short',
      prompt: 'A teammate added 8 threads to a pure-Python image filter on standard CPython 3.14, and it got no faster. Explain why, and name two ways to actually use several cores.',
      answer: py`The work is CPU-bound and runs as Python bytecode. In standard CPython only the thread holding the GIL can execute bytecode, so the 8 threads take turns instead of running in parallel (and pay for the switching). To use several cores: run the work in separate processes (ProcessPoolExecutor / multiprocessing — each process has its own GIL), or move the hot loop into a library implemented in C that releases the GIL (NumPy, Pillow). A third option on 3.14 is the officially supported free-threaded build, if all dependencies support it.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'pool-finish-time',
      title: 'How long will the pool take?',
      difficulty: 'intermediate',
      prompt: py`A pool of workers processes jobs that each take a known time (think: downloads that each wait a few seconds). Write \`pool_time(durations, workers)\` that returns the moment the **last** job finishes, using these rules:

- jobs are handed out **in the order given**;
- each job goes to the worker that becomes **free first**;
- every worker starts free at time 0, and a worker does one job at a time.

Also:

- \`pool_time([], workers)\` returns \`0\`;
- if \`workers\` is less than 1, raise \`ValueError\`.

Examples: \`pool_time([1, 1, 1], 1)\` → \`3\` (sequential), \`pool_time([1, 1, 1], 3)\` → \`1\` (fully overlapped), \`pool_time([3, 1, 1, 1], 2)\` → \`3\`.`,
      files: {
        'main.py': py`def pool_time(durations, workers):
    # TODO: simulate the pool. This placeholder pretends there is one worker.
    return sum(durations)


print(pool_time([1, 1, 1], 1))      # 3
print(pool_time([1, 1, 1], 3))      # 1
print(pool_time([3, 1, 1, 1], 2))   # 3
`,
      },
      hints: [
        'Keep track of the time at which each worker becomes free. Start with [0] * workers.',
        'For each job, pick the smallest "free at" time, add the job’s duration to it, and store the result back. heapq.heapreplace does exactly “pop the smallest, push a new value”.',
        'free = [0] * workers; for d in durations: heapq.heapreplace(free, free[0] + d); return max(free). Check workers first, and the max of [0, 0] is already 0 for no jobs.',
      ],
      solution: {
        explanation: py`The list \`free\` holds, for every worker, the time at which it becomes free. A list of equal zeros is already a valid **heap**, so \`free[0]\` is always the earliest-free worker. For each job, \`heapq.heapreplace\` pops that earliest time and pushes "earliest + duration" — the worker takes the job. When all jobs are assigned, the busiest worker's finish time (\`max(free)\`) is when everything is done.

With one worker this collapses to the **sum** of the durations; with at least as many workers as jobs it becomes the **maximum**. Real pools sit in between — which is why adding workers helps a lot at first and then stops helping.`,
        files: {
          'main.py': py`import heapq


def pool_time(durations, workers):
    if workers < 1:
        raise ValueError("a pool needs at least one worker")
    free = [0] * workers                 # when each worker becomes free (a valid heap)
    for duration in durations:
        heapq.heapreplace(free, free[0] + duration)   # earliest-free worker takes the job
    return max(free)


print(pool_time([1, 1, 1], 1))      # 3
print(pool_time([1, 1, 1], 3))      # 1
print(pool_time([3, 1, 1, 1], 2))   # 3
`,
        },
      },
      tests: [
        { name: 'one worker: the durations add up', code: py`assert pool_time([1, 1, 1], 1) == 3` },
        { name: 'enough workers: only the longest job matters', code: py`assert pool_time([1, 1, 1], 3) == 1` },
        { name: 'the short jobs share the free worker', code: py`assert pool_time([3, 1, 1, 1], 2) == 3` },
        { name: 'jobs queue up behind busy workers', code: py`assert pool_time([2, 2, 2, 2, 2], 2) == 6` },
        { name: 'no jobs take no time', code: py`assert pool_time([], 4) == 0` },
        { name: 'zero workers is an error', code: py`with raises(ValueError):
    pool_time([1], 0)` },
      ],
    },
    {
      id: 'amdahl-speedup',
      title: 'Amdahl’s law: the limit of parallelism',
      difficulty: 'intermediate',
      prompt: py`Only part of a program can usually run in parallel; the rest stays sequential. **Amdahl's law** gives the best possible speed-up when a fraction \`p\` (between 0 and 1) of the work is spread over \`n\` workers:

\`\`\`text
speed-up = 1 / ((1 - p) + p / n)
\`\`\`

Write two functions:

1. \`max_speedup(parallel_fraction, workers)\` — returns the speed-up from the formula as a float. Raise \`ValueError\` if \`parallel_fraction\` is outside \`0..1\` or \`workers\` is less than 1.
2. \`speedup_limit(parallel_fraction)\` — the speed-up with *infinitely many* workers: \`1 / (1 - p)\`. Return \`float("inf")\` when \`p\` is exactly 1. Raise \`ValueError\` for \`p\` outside \`0..1\`.`,
      files: {
        'main.py': py`def max_speedup(parallel_fraction, workers):
    # TODO: Amdahl's law
    return float(workers)


def speedup_limit(parallel_fraction):
    # TODO: the speed-up with infinitely many workers
    return float("inf")


print(round(max_speedup(0.9, 8), 2))    # 4.71
print(speedup_limit(0.5))               # 2.0
`,
      },
      hints: [
        'Check the arguments first; a chained comparison like 0 <= p <= 1 reads nicely.',
        'The sequential part (1 - p) never shrinks; only the parallel part is divided by the number of workers.',
        'return 1 / ((1 - p) + p / n) for the first function; for the limit, handle p == 1 before dividing by (1 - p).',
      ],
      solution: {
        explanation: py`The run time is split into a sequential part \`1 - p\` that no number of workers can shorten, and a parallel part \`p\` that \`n\` workers divide between them. The speed-up is the old time (1) divided by the new time. As \`n\` grows, \`p / n\` shrinks towards zero and the speed-up approaches \`1 / (1 - p)\`.

That limit is the sobering part: with 90% of the work parallel, *no* number of cores gives more than a 10× speed-up, and with 50% you can never even double your speed. Before adding workers, shrink the sequential part.`,
        files: {
          'main.py': py`def _check_fraction(p):
    if not 0 <= p <= 1:
        raise ValueError("parallel_fraction must be between 0 and 1")


def max_speedup(parallel_fraction, workers):
    _check_fraction(parallel_fraction)
    if workers < 1:
        raise ValueError("workers must be at least 1")
    sequential = 1 - parallel_fraction
    return 1 / (sequential + parallel_fraction / workers)


def speedup_limit(parallel_fraction):
    _check_fraction(parallel_fraction)
    if parallel_fraction == 1:
        return float("inf")
    return 1 / (1 - parallel_fraction)


print(round(max_speedup(0.9, 8), 2))    # 4.71
print(speedup_limit(0.5))               # 2.0
`,
        },
      },
      tests: [
        { name: 'fully parallel work scales with workers', code: py`assert max_speedup(1.0, 4) == approx(4)` },
        { name: 'fully sequential work never speeds up', code: py`assert max_speedup(0.0, 8) == approx(1)` },
        { name: 'half parallel on 2 workers', code: py`assert max_speedup(0.5, 2) == approx(4 / 3)` },
        { name: '90% parallel on 8 workers', code: py`assert max_speedup(0.9, 8) == approx(1 / (0.1 + 0.9 / 8))` },
        { name: 'the limit for 90% parallel is 10x', code: py`assert speedup_limit(0.9) == approx(10)` },
        { name: 'fully parallel work has no limit', code: py`assert speedup_limit(1.0) == float("inf")` },
        { name: 'bad arguments raise ValueError', code: py`with raises(ValueError):
    max_speedup(1.5, 4)
with raises(ValueError):
    max_speedup(0.5, 0)
with raises(ValueError):
    speedup_limit(-0.1)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'concurrency-concepts-vs-parallelism',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between concurrency and parallelism?',
      answer: 'Concurrency is structuring a program so several tasks are in progress at once and their waiting overlaps; parallelism is executing several tasks at the same instant on different cores. Parallelism is one way to achieve concurrency, but you can have concurrency on a single core.',
      explanation: py`A single-threaded asyncio program that runs 1,000 downloads is highly concurrent and not parallel at all. Four processes each crunching numbers on their own core are parallel. Concurrency is a property of how the program is *organised*; parallelism is a property of how it *executes* on hardware.`,
      whyAsked: 'It is the vocabulary every other concurrency question builds on, and many candidates use the two words interchangeably.',
      mistakes: ['Treating the words as synonyms', 'Saying asyncio is parallel', 'Forgetting that a single core can still run concurrent tasks by switching between them'],
      followUps: ['Give an example of concurrency without parallelism.', 'Which Python tools give you real parallelism?', 'Can parallelism make an I/O-bound program faster?'],
      modelAnswer: 'Concurrency means dealing with several tasks at once — they are all in progress and the program switches between them, typically so that one task’s waiting overlaps with another’s work. Parallelism means actually executing several tasks at the same instant, which needs several cores. A single-threaded asyncio server handling thousands of connections is concurrent but not parallel; four processes each crunching numbers on their own core are parallel. The distinction matters because I/O-bound work only needs concurrency, while CPU-bound work needs parallelism to get faster.',
    },
    {
      id: 'concurrency-concepts-gil',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What is the GIL, why does CPython have it, and what does it not protect you from?',
      answer: 'The Global Interpreter Lock is a lock that a thread must hold to execute Python bytecode, so only one thread per interpreter runs Python code at a time. It exists mainly to make reference counting and interpreter internals thread-safe cheaply. It does not make multi-step operations like count += 1 or check-then-act atomic, so you still need locks.',
      explanation: py`CPython updates reference counts on almost every operation. A single global lock was the simplest way to keep those counts and other internals consistent, and it keeps single-threaded code fast and C extensions easy to write. Threads release the GIL during blocking I/O and periodically (the switch interval), and C extensions can release it for long computations. Because a thread can be switched out between any two bytecodes, compound operations on shared data race. The GIL is a CPython detail: PyPy has one, Jython doesn't, and 3.13+ offers a free-threaded build without it (supported, not default, in 3.14).`,
      whyAsked: 'The GIL is the most misunderstood part of Python concurrency; the answer shows whether you know its real effect on performance and correctness.',
      mistakes: ['Saying the GIL makes Python code thread-safe', 'Saying Python can never use multiple cores', 'Claiming the GIL is part of the Python language', 'Not knowing that I/O releases the GIL'],
      followUps: ['When is the GIL released?', 'What changes in the free-threaded build?', 'Why is list.append safe in practice but count += 1 is not?'],
      modelAnswer: 'The GIL, the Global Interpreter Lock, is a lock in CPython that a thread must hold to run Python bytecode, so within one interpreter only one thread executes Python code at a time. It exists because CPython’s memory management relies on reference counts that change constantly, and one big lock made those and other internals safe with almost no overhead for single-threaded code. It is released when a thread blocks on I/O and every few milliseconds so others get a turn, and C extensions like NumPy can release it during heavy work. What it does not do is make my logic atomic: count += 1 is a load, an add and a store, and a switch in between loses updates, so I still use locks or queues. It is also a CPython detail — 3.14 has an officially supported free-threaded build without it.',
    },
    {
      id: 'concurrency-concepts-threads-no-speedup',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A service computes recommendation scores in pure Python. Someone wrapped the loop in a ThreadPoolExecutor with 16 workers on a 16-core server, and throughput didn’t change. What is happening and what would you do?',
      answer: 'The work is CPU-bound pure Python, so on standard CPython the 16 threads take turns holding the GIL. Profile to confirm, then use a ProcessPoolExecutor (or several worker processes), vectorise the hot loop with NumPy, or move it into compiled code; a free-threaded 3.14 build is an option if every dependency supports it.',
      explanation: py`Threads only overlap work that releases the GIL: blocking I/O and C code written to release it. Pure-Python arithmetic doesn't. Processes have one GIL each, so they scale across cores, at the cost of start-up time, memory per process and pickling inputs and outputs — so they pay off when each task does a meaningful amount of computation. Often the biggest win is algorithmic or moving the loop into NumPy.`,
      whyAsked: 'It is a very common production mistake; interviewers want to see that you diagnose before you prescribe.',
      mistakes: ['Suggesting more threads', 'Blaming the server hardware', 'Jumping to processes without considering data-transfer cost'],
      followUps: ['How would you confirm the work is CPU-bound?', 'What does it cost to send a large object to a worker process?', 'When would threads have helped here?'],
      modelAnswer: 'My first suspicion is the GIL: the scoring is pure Python, so it is CPU-bound, and on standard CPython only one of those 16 threads can execute bytecode at a time — they just take turns. I would confirm with a profiler or by comparing CPU time to wall time. Then I would move the work to processes, for example a ProcessPoolExecutor with one worker per core, making sure each task is big enough that pickling the inputs and results doesn’t dominate. If the loop is numeric, vectorising it with NumPy may beat both. And if every dependency supports it, the free-threaded build in 3.14 could make the threads work, but I would measure that rather than assume.',
    },
    {
      id: 'concurrency-concepts-classify',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'A job runs for 10 seconds of wall-clock time but uses only 0.4 seconds of CPU time. What kind of work is it, and which tool would you reach for first?',
      options: [
        'CPU-bound — use a process pool',
        'I/O-bound — overlap the waiting with asyncio or a thread pool',
        'CPU-bound — use more threads',
        'Neither — concurrency cannot help',
      ],
      correctOption: 1,
      answer: 'It is I/O-bound: it spends about 96% of its time waiting. Overlapping the waits with asyncio (or a thread pool for blocking libraries) is the right first tool.',
      explanation: py`Wall-clock time far above CPU time means the process is mostly blocked — on the network, disk or a database. Processes would add cost without benefit, because the CPU isn't the bottleneck. If the same job used 9.8 s of CPU in 10 s, it would be CPU-bound and processes would be the answer.`,
      whyAsked: 'Shows you can reason from measurements instead of guessing.',
      mistakes: ['Choosing processes because they are "faster"', 'Not knowing the difference between wall time and CPU time'],
      followUps: ['How would you measure CPU time vs wall time in Python? (time.process_time vs time.perf_counter)', 'What if the job is half and half?'],
      modelAnswer: 'That job is I/O-bound: it is busy for 0.4 seconds out of 10, so it is waiting for something about 96% of the time. Making the CPU part parallel can’t help much; what helps is overlapping the waiting. If the libraries are async I would use asyncio, otherwise a thread pool, because a thread blocked on I/O releases the GIL. If CPU time were close to wall time I would think about processes instead.',
    },
    {
      id: 'concurrency-concepts-processes-threads-coroutines',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare processes, threads and coroutines in Python: memory, switching, cost and typical use.',
      answer: 'Processes have separate memory and their own interpreter and GIL, switch pre-emptively, are the most expensive and suit CPU-bound work. Threads share memory, switch pre-emptively, cost an OS thread each and suit I/O-bound work with blocking libraries. Coroutines share one thread, switch only at await, are very cheap and suit high-concurrency I/O with async libraries.',
      explanation: py`Pre-emptive switching (threads, processes) means the OS can interrupt you anywhere, which is why shared data needs locks. Cooperative switching (coroutines) means you know exactly where switches happen — at \`await\` — so races are rarer, but a single blocking call stalls every task. Processes avoid shared-memory bugs entirely but pay for it in start-up time and pickling every message.`,
      whyAsked: 'It checks whether you understand the trade-offs, not just the APIs.',
      mistakes: ['Saying coroutines run in parallel', 'Ignoring the cost of copying data between processes', 'Forgetting that asyncio needs async-aware libraries'],
      followUps: ['Why can asyncio handle more connections than threads?', 'Where does a race condition come from in asyncio code?', 'How do processes communicate?'],
      modelAnswer: 'Processes are fully isolated: each has its own memory, interpreter and GIL, so they give real parallelism for CPU-bound work, but they are expensive to start and every argument and result has to be pickled across. Threads live in one process and share memory; the OS switches between them at any moment, which makes them good for I/O-bound work with ordinary blocking libraries but means shared data needs locks. Coroutines are the lightest: many tasks share one thread and only switch at await, so tens of thousands of connections are cheap and races are easier to reason about — but they need async libraries, and any blocking call freezes all of them.',
    },
    {
      id: 'concurrency-concepts-round-robin',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Concurrency without threads: write `run_round_robin(tasks)`. Each task is a generator; run one step (one `next()`) of each task in turn, round-robin, until all are exhausted, and return the list of yielded values in the order they were produced.',
      answer: 'Keep the tasks in a deque; pop from the left, call next(), record the value and append the task back to the right; drop it on StopIteration.',
      explanation: py`This is the core idea of an event loop in miniature: tasks that voluntarily pause (here at \`yield\`, in asyncio at \`await\`) and a scheduler that resumes them in turn. No parallelism is involved — one thread, cooperative switching — yet all the tasks make progress together. asyncio adds timers, I/O readiness and futures on top of this pattern.`,
      code: { lang: 'python', code: py`def worker(name, steps):
    for i in range(steps):
        yield f"{name}{i}"

run_round_robin([worker("A", 2), worker("B", 3)])
# ['A0', 'B0', 'A1', 'B1', 'B2']` },
      starter: { files: { 'main.py': py`from collections import deque


def run_round_robin(tasks):
    # TODO: interleave the tasks one step at a time.
    # This placeholder runs each task to completion, one after another.
    log = []
    for task in tasks:
        log.extend(task)
    return log


def worker(name, steps):
    for i in range(steps):
        yield f"{name}{i}"


print(run_round_robin([worker("A", 2), worker("B", 3)]))
` } },
      tests: [
        { name: 'two tasks interleave', code: py`def w(name, steps):
    for i in range(steps):
        yield f"{name}{i}"

assert run_round_robin([w("A", 2), w("B", 3)]) == ["A0", "B0", "A1", "B1", "B2"]` },
        { name: 'three tasks share turns fairly', code: py`def w(name, steps):
    for i in range(steps):
        yield f"{name}{i}"

assert run_round_robin([w("x", 1), w("y", 2), w("z", 2)]) == ["x0", "y0", "z0", "y1", "z1"]` },
        { name: 'no tasks gives an empty log', code: py`assert run_round_robin([]) == []` },
      ],
      solution: { files: { 'main.py': py`from collections import deque


def run_round_robin(tasks):
    ready = deque(tasks)
    log = []
    while ready:
        task = ready.popleft()
        try:
            log.append(next(task))      # run the task until its next pause
        except StopIteration:
            continue                    # finished: don't put it back
        ready.append(task)              # back of the queue: everyone gets a turn
    return log


def worker(name, steps):
    for i in range(steps):
        yield f"{name}{i}"


print(run_round_robin([worker("A", 2), worker("B", 3)]))
` } },
      hints: ['A deque gives you O(1) popleft() and append() — a perfect ready queue.', 'next(task) runs a generator until its next yield and raises StopIteration when it is finished.'],
      whyAsked: 'It reveals whether you understand cooperative scheduling — the mechanism underneath asyncio — rather than just the async/await keywords.',
      mistakes: ['Running each generator to completion (that is sequential, not concurrent)', 'Catching StopIteration but still re-queuing the finished task', 'Using list.pop(0), which is O(n)'],
      followUps: ['How would you add sleeping tasks that should resume after a delay? (a heap of wake-up times)', 'What corresponds to the yield here in asyncio?', 'What happens if one task never yields?'],
      modelAnswer: 'I keep the tasks in a deque that acts as the ready queue. In a loop I pop the leftmost task and call next on it, which runs it until its next yield; I record the yielded value and append the task back to the right so everyone gets a turn. When next raises StopIteration the task is finished, so I simply don’t re-queue it. That is cooperative multitasking on one thread — exactly the idea behind asyncio’s event loop, where await plays the role of yield. It also shows the weakness: a task that never yields starves everyone else, just like a blocking call in async code.',
    },
    {
      id: 'concurrency-concepts-free-threading',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'What is free-threaded CPython, what is its status in 3.13 and 3.14, and would you switch a production service to it today?',
      answer: 'It is a separate CPython build (PEP 703) without the GIL, so threads run Python bytecode in parallel. It was experimental in 3.13 and is officially supported but not the default in 3.14 (PEP 779). I would evaluate it for CPU-bound threaded workloads, after checking that every C extension supports it and measuring, since single-threaded code runs somewhat slower and thread-safety bugs surface more readily.',
      explanation: py`The free-threaded build (\`python3.14t\`) replaces the GIL with biased reference counting, immortal objects and per-object locks in built-in types. Extensions must be compiled for it and declare GIL-free support; importing one that doesn't re-enables the GIL with a warning. Correctness rules don't change: unsynchronised read-modify-write is still a race. Check the build with \`sysconfig.get_config_var("Py_GIL_DISABLED")\` and \`sys._is_gil_enabled()\`.`,
      whyAsked: 'It tests whether you follow the language’s evolution and can reason about adopting new runtime features responsibly.',
      mistakes: ['Saying Python 3.13 or 3.14 "removed the GIL" in general', 'Assuming existing threaded code automatically gets faster and stays correct', 'Not mentioning extension compatibility'],
      followUps: ['How do you check whether the GIL is active at runtime?', 'Why might single-threaded code be slower on the free-threaded build?', 'What happens when you import an extension that does not support free-threading?'],
      modelAnswer: 'Free-threaded CPython is a separate build of the interpreter, from PEP 703, that runs without the GIL, so multiple threads can execute Python bytecode truly in parallel. It shipped as experimental in 3.13, and in 3.14 it is officially supported under PEP 779 but still optional — the default python3.14 has the GIL. For production I would treat it as an option for CPU-bound threaded code: first check every C extension has free-threaded wheels, because an unsupported one re-enables the GIL, then benchmark, because single-threaded performance is somewhat lower. I would also re-audit thread safety, since races that the GIL made rare become much more likely.',
    },
  ],

  takeaways: [
    'Concurrency = several tasks in progress with overlapping waits; parallelism = several tasks executing at the same instant on different cores.',
    'I/O-bound work (mostly waiting) needs concurrency: asyncio or threads. CPU-bound work (mostly computing) needs parallelism: processes, or C code that releases the GIL.',
    'Processes have separate memory and their own GIL; threads share memory and are switched pre-emptively; coroutines share one thread and switch only at await.',
    'Standard CPython’s GIL lets only one thread run Python bytecode at a time; it is released during blocking I/O and periodically.',
    'The GIL protects the interpreter’s internals, not your logic: count += 1 across threads still needs a lock.',
    'Free-threaded CPython (PEP 703) was experimental in 3.13 and is officially supported but not the default in 3.14 (PEP 779).',
    'Amdahl’s law: the sequential part of a program caps the speed-up — measure before adding workers.',
  ],
}
