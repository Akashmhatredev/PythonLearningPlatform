// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// Processes cannot start in the browser sandbox: this module imitates a spawn-based pool.
const SIMPOOL = py`"""A process-pool SIMULATOR (simplified, for learning).

Real processes cannot start in this browser sandbox, so this class imitates
what multiprocessing.Pool does with the "spawn" start method:

* every worker re-runs your main file as a module named "__mp_main__", so
  top-level code runs again in each worker and the
  if __name__ == "__main__": block does not;
* the function and each chunk of arguments are pickled to "send" them to a
  worker, and the results are pickled to "send" them back;
* every worker has its OWN copy of the module's globals (separate memory).

Everything still runs on one thread, one chunk after another: no speed-up.
"""
import pickle

_bootstrapping = False

BOOTSTRAP_ERROR = (
    "An attempt has been made to start a new process before the current "
    "process has finished its bootstrapping phase. (Simulated: this usually "
    "means the main module creates the pool without the "
    "if __name__ == '__main__': guard.)"
)


class SimulatedProcessPool:
    def __init__(self, workers=2):
        if _bootstrapping:
            raise RuntimeError(BOOTSTRAP_ERROR)
        self.workers = workers
        self.messages_sent = 0
        self.bytes_sent = 0
        self.bytes_received = 0
        self.chunks_per_worker = [0] * workers
        self._worker_globals = None

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        self._worker_globals = None      # "terminate" the workers
        return False

    def _start_workers(self, fn):
        global _bootstrapping
        path = fn.__globals__["__file__"]
        with open(path) as source_file:
            code = compile(source_file.read(), path, "exec")
        workers = []
        _bootstrapping = True
        try:
            for _ in range(self.workers):
                namespace = {"__name__": "__mp_main__", "__file__": path}
                exec(code, namespace)        # the worker imports main.py
                workers.append(namespace)
        finally:
            _bootstrapping = False
        return workers

    def map(self, fn, iterable, chunksize=1):
        pickle.dumps(fn)                     # lambdas and nested functions fail here
        if self._worker_globals is None:
            self._worker_globals = self._start_workers(fn)
        items = list(iterable)
        results = []
        for number, start in enumerate(range(0, len(items), chunksize)):
            message = pickle.dumps((fn, items[start:start + chunksize]))
            self.messages_sent += 1
            self.bytes_sent += len(message)
            worker = number % self.workers
            self.chunks_per_worker[worker] += 1
            _, chunk = pickle.loads(message)                 # the worker gets a COPY
            worker_fn = self._worker_globals[worker][fn.__name__]
            reply = pickle.dumps([worker_fn(item) for item in chunk])
            self.bytes_received += len(reply)
            results.extend(pickle.loads(reply))
        return results
`

const PRIMES = py`from simpool import SimulatedProcessPool

print(f"main.py is running as {__name__}")   # top-level code: runs in every worker too

calls = 0                                     # every process has its own copy


def is_prime(n):
    """CPU-bound work: trial division."""
    global calls
    calls += 1
    if n < 2:
        return False
    divisor = 2
    while divisor * divisor <= n:
        if n % divisor == 0:
            return False
        divisor += 1
    return True


if __name__ == "__main__":
    numbers = range(100_000, 100_200)
    with SimulatedProcessPool(workers=4) as pool:
        flags = pool.map(is_prime, numbers, chunksize=1)

    print(f"{sum(flags)} primes between {numbers[0]} and {numbers[-1]}")
    print(f"messages sent to workers: {pool.messages_sent}")
    print(f"bytes pickled: {pool.bytes_sent} out, {pool.bytes_received} back")
    print(f"chunks per worker: {pool.chunks_per_worker}")
    print(f"calls counted by the parent process: {calls}")
`

export default {
  id: 'multiprocessing',
  title: 'Multiprocessing: real parallelism with processes',
  summary: 'Separate processes have separate memory and their own GIL, so they run Python code on several cores at once — at the price of start-up time, pickling every argument and result, and a few strict rules.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['concurrency-concepts', 'threading', 'main-guard-and-scripts', 'serialization'],
  related: ['threading', 'choosing-concurrency', 'gil-and-free-threading', 'serialization', 'main-guard-and-scripts', 'profiling', 'optimization-techniques', 'asyncio-in-practice'],
  tags: ['multiprocessing', 'processes', 'Process', 'Pool', 'ProcessPoolExecutor', 'parallelism', 'CPU-bound', 'pickle', 'PicklingError', 'spawn', 'fork', 'forkserver', '__main__', '__mp_main__', 'chunksize', 'IPC', 'shared memory', 'cores'],
  apis: [
    { name: 'multiprocessing.Process(target, args)', summary: 'A separate OS process that will run target(*args) once start() is called; join() waits for it.' },
    { name: 'multiprocessing.Pool(processes)', summary: 'A pool of worker processes with map(), imap(), imap_unordered(), starmap() and apply_async().' },
    { name: 'Pool.map(func, iterable, chunksize=None)', summary: 'Runs func on every item in the workers and returns a list in input order; picks a chunk size automatically if none is given.' },
    { name: 'concurrent.futures.ProcessPoolExecutor(max_workers)', summary: 'The Executor interface (submit, map, futures) backed by worker processes. map() defaults to chunksize=1.' },
    { name: 'multiprocessing.get_context(method)', summary: 'A context object that uses a specific start method: "spawn", "fork" or "forkserver".' },
    { name: 'multiprocessing.Queue / Pipe', summary: 'Channels that pickle objects and send them between processes.' },
    { name: 'multiprocessing.shared_memory.SharedMemory', summary: 'A block of memory several processes can map and read/write directly, without pickling (3.8+).' },
    { name: 'os.cpu_count() / os.process_cpu_count()', summary: 'CPUs in the machine / CPUs this process may use (process_cpu_count is 3.13+).' },
  ],
  docs: [
    { label: 'multiprocessing — process-based parallelism', url: 'https://docs.python.org/3/library/multiprocessing.html' },
    { label: 'multiprocessing — programming guidelines', url: 'https://docs.python.org/3/library/multiprocessing.html#programming-guidelines' },
    { label: 'concurrent.futures — ProcessPoolExecutor', url: 'https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor' },
    { label: 'pickle — what can be pickled', url: 'https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **process** is a running program with its own private memory. Your Python script is one process. The \`multiprocessing\` module (and \`concurrent.futures.ProcessPoolExecutor\`) start **more** processes — each with its own copy of the Python interpreter, its own memory and, in standard CPython, its **own GIL**.`,
    py`That last part is the point. In [threading](lesson:threading) you saw that threads take turns on one GIL, so pure-Python number crunching doesn't get faster. Separate processes don't share a GIL, so four processes can genuinely run Python code on four cores at the same time: real **parallelism**.`,
    py`The price is that processes **share nothing** by default. Every argument you send to a worker and every result it sends back is **pickled** (turned into bytes, see [serialization](lesson:serialization)), copied across, and unpickled. Starting a process takes time, and there are rules: the work function must be importable, and your script needs the \`if __name__ == "__main__":\` guard.`,
    { callout: 'warn', title: 'Processes cannot start in this browser sandbox', text: py`The playground runs one Python interpreter inside your browser tab, so \`multiprocessing\` can't create processes here. Real multiprocessing code in this lesson is marked **run it on your own computer**, and its output is described as typical. The playground uses a clearly labelled **simulated pool** that reproduces the parts you can't see in a normal run: pickling, separate memory, chunking and re-importing your script in every worker.` },
  ],
  why: [
    py`**Using all your cores.** Laptops have several cores and servers have dozens. A pure-Python loop uses one. For CPU-bound jobs — resizing images, simulations, parsing huge files, scoring models in Python code — processes are the standard-library way to use the rest.`,
    py`**Isolation.** A worker that crashes, leaks memory or corrupts its own state can't damage the parent's memory. Some servers run several worker *processes* partly for this reason.`,
    py`**No locks for ordinary data.** Because memory isn't shared, the race conditions from the threading lesson mostly disappear: each worker owns its copy of the data. You communicate by sending messages instead.`,
    py`**But it's not free.** Process start-up, pickling and copying can easily cost more than the work itself. Knowing when processes pay off — big CPU-bound chunks, small inputs and outputs — is the real skill this lesson teaches.`,
  ],
  eli15: [
    py`Imagine you have 1,000 maths worksheets to mark. Doing them alone takes ages. You could invite friends into **your room** to help (threads) — but there's only one red pen (the GIL), so they mostly wait for it. Marking doesn't get faster.`,
    py`So instead you **photocopy** the answer key and send batches of worksheets to friends in **other houses** (processes). Each friend has their own pen, so they all mark at the same time. That's real teamwork.`,
    py`The catch: every batch has to be packed, posted and unpacked (pickling), and the marked sheets have to be posted back. Sending one worksheet per envelope is silly — the post takes longer than the marking! You send **big batches** (chunks) instead. And whatever your friends scribble on their photocopies never appears on your original — their houses have their own copies (separate memory).`,
  ],
  analogy: {
    title: 'Branch offices instead of one crowded office',
    body: [
      py`A company with one office (one process) can hire more staff (threads), but they share one meeting room with one projector (the GIL). For work that needs the projector all day, more staff in the same office doesn't help.`,
      py`So the company opens **branch offices** (processes). Each branch has its own building, its own projector and its own filing cabinets, so the work really happens in parallel. But opening a branch takes time, staff can't just walk over to the head office's filing cabinets, and every document has to be **couriered** between offices (pickled and copied). Branches pay off for big projects, not for one-line tasks.`,
    ],
    mapping: [
      ['branch office', 'a worker process with its own interpreter and GIL'],
      ['its own filing cabinets', 'separate memory: globals and objects are copies'],
      ['couriering documents', 'pickling arguments and results between processes'],
      ['a big folder of work per courier trip', 'a chunk (chunksize) of items per message'],
      ['the time to open a branch', 'process start-up: a new interpreter plus your imports'],
      ['the company address book every branch must find', 'functions must be importable by name (top-level), so workers can find them'],
    ],
  },
  visual: {
    type: 'concurrency',
    title: 'CPU-bound work: only processes use several cores',
    props: { preset: 'cpu-bound' },
    alt: 'Four timelines for three pure-computation jobs. Sequential takes about 3 units. Threads take turns holding the GIL and still take about 3 units. asyncio runs the jobs one after another, about 3 units. Three processes each pay a short start-up cost and then run in parallel on separate cores, finishing at about 1.3 units.',
    caption: py`Press ▶. Notice the grey **start-up** block in front of every process: that cost is paid before any useful work happens, and sending data in and out adds more. Processes win when the work in each one is much bigger than those costs. Units are schematic, not a benchmark.`,
  },
  syntax: [
    py`#### A pool of workers (the usual way)`,
    { code: py`from concurrent.futures import ProcessPoolExecutor


def is_prime(n):
    if n < 2:
        return False
    divisor = 2
    while divisor * divisor <= n:
        if n % divisor == 0:
            return False
        divisor += 1
    return True


if __name__ == "__main__":                       # required: see below
    numbers = range(10_000_000, 10_100_000)
    with ProcessPoolExecutor() as pool:          # one worker per CPU by default
        flags = list(pool.map(is_prime, numbers, chunksize=2_000))
    print(sum(flags), "primes")`, lang: 'python', title: 'ProcessPoolExecutor (run it on your own computer)', static: true },
    py`The interface is the same \`Executor\` you met in [threading](lesson:threading): \`map()\` returns results in input order, \`submit()\` returns a \`Future\`, and an exception raised in a worker is pickled, sent back and re-raised by \`result()\`. On a multi-core machine this typically finishes noticeably faster than a plain loop — measure it on yours with \`time.perf_counter()\`.`,
    { code: py`from multiprocessing import Pool

if __name__ == "__main__":
    with Pool(processes=4) as pool:
        squares = pool.starmap(pow, [(n, 2) for n in range(10)])
        print(squares)                            # [0, 1, 4, 9, ...]
        for result in pool.imap_unordered(abs, [-3, -2, -1], chunksize=1):
            print(result)                         # in completion order`, lang: 'python', title: 'multiprocessing.Pool (run locally)', static: true },
    py`\`Pool\` is the older API with a few extras: \`starmap()\` for functions with several arguments, \`imap()\`/\`imap_unordered()\` to stream results. Careful: leaving \`with Pool(...)\` calls \`terminate()\`, which kills the workers — collect every result **inside** the block.`,
    py`#### One process by hand`,
    { code: py`from multiprocessing import Process, Queue


def worker(numbers, results):
    results.put(sum(n * n for n in numbers))   # send the answer back through the queue


if __name__ == "__main__":
    results = Queue()
    jobs = [Process(target=worker, args=(range(i, i + 1_000_000), results)) for i in (0, 1_000_000)]
    for job in jobs:
        job.start()
    total = sum(results.get() for _ in jobs)    # read before join(): avoids blocking on a full pipe
    for job in jobs:
        job.join()
    print(total, [job.exitcode for job in jobs])  # exitcode 0 means success`, lang: 'python', title: 'Process + Queue (run locally)', static: true },
    py`#### The rules`,
    py`1. **Guard the entry point** with \`if __name__ == "__main__":\`. With the *spawn* and *forkserver* start methods each worker **imports your main script** (as a module named \`__mp_main__\`) to find your functions. Unguarded top-level code would run again in every worker — including the code that starts the pool.
2. **The work function must be importable**: defined at the top level of a module. Lambdas, nested functions and functions defined only in an interactive session can't be pickled.
3. **Arguments and results must be picklable**: numbers, strings, lists, dicts, tuples, instances of top-level classes. Open files, locks, sockets, database connections and generators are not.
4. **Workers get copies.** Changing a global or a passed-in list in a worker never changes the parent's version.`,
    py`#### Start methods`,
    py`| method | how a worker starts | default on |
|---|---|---|
| \`spawn\` | a fresh interpreter that imports your main module | Windows, macOS |
| \`forkserver\` | forked from a small, clean server process started early | other POSIX systems (Linux) since **3.14** |
| \`fork\` | a copy of the parent process, memory and all | Linux (and other POSIX systems except macOS) before 3.14 |`,
    { callout: 'version', title: '3.14: Linux no longer defaults to fork', text: py`Python 3.14 changed the default start method on POSIX platforms other than macOS from \`fork\` to \`forkserver\`, because forking a process that has threads can deadlock the child. Code that relied on workers inheriting the parent's globals now needs to pass data explicitly. Choose a method explicitly with \`multiprocessing.get_context("spawn")\` or \`ProcessPoolExecutor(mp_context=...)\`. Writing your code for **spawn** — guard plus picklable functions and data — makes it work everywhere.` },
  ],
  walkthrough: {
    title: 'Reading the simulated prime pool',
    lang: 'python',
    code: PRIMES,
    intro: py`This is \`main.py\` from the playground (press **Guide** there to follow along). \`SimulatedProcessPool\` lives in \`simpool.py\`; it's a **simplified simulation** that re-imports your script per worker and pickles everything like a real spawn-based pool — but runs it all on one thread, so it shows the *mechanics*, not a speed-up.`,
    steps: [
      { lines: [1, 3], text: py`Top-level code. In the parent it prints \`__main__\`; every simulated worker re-runs the file as \`__mp_main__\` and prints again — exactly what happens with real spawn workers.` },
      { lines: [5], text: py`A global counter. Each worker increments **its own copy**, so the parent's \`calls\` stays 0 — separate memory.` },
      { lines: [8, 19], text: py`The CPU-bound work, defined at the **top level** so it can be pickled by name and found again in each worker.` },
      { lines: [22, 25], text: py`Behind the guard: create the pool and map the function over 200 numbers. With \`chunksize=1\` every single number travels in its own pickled message.` },
      { lines: [27, 31], text: py`The bookkeeping that real pools hide: how many messages were sent, how many bytes were pickled each way, how the chunks were spread across workers — and proof that the parent's \`calls\` never changed.` },
    ],
  },
  playground: {
    title: 'A simulated process pool',
    objective: 'Run it, then change the chunk size and worker count, send a lambda, and remove the main guard to see each rule in action.',
    files: { 'main.py': PRIMES, 'simpool.py': SIMPOOL },
    expected: py`\`\`\`text
main.py is running as __main__
main.py is running as __mp_main__
main.py is running as __mp_main__
main.py is running as __mp_main__
main.py is running as __mp_main__
15 primes between 100000 and 100199
messages sent to workers: 200
bytes pickled: ... out, ... back
chunks per worker: [50, 50, 50, 50]
calls counted by the parent process: 0
\`\`\`

The four \`__mp_main__\` lines are the workers importing \`main.py\`. The byte counts are real measurements of \`pickle.dumps\`. Remember it's a **simulation**: a real pool would also run the chunks in parallel.`,
    experiments: [
      {
        id: 'chunksize',
        task: py`200 messages for 200 tiny calculations is a lot of courier trips. Change \`chunksize=1\` to \`chunksize=50\` and compare the messages and bytes.`,
        hint: py`Only the \`pool.map(...)\` line changes.`,
        tests: [{ name: 'far fewer messages are sent', code: py`assert pool.messages_sent <= 10, 'Use a bigger chunksize'` }],
        explain: py`Now 4 messages carry 50 numbers each. Every message has a fixed cost in a real pool (pickling, a trip through a pipe, waking a worker), so bigger chunks cut overhead — while still leaving enough chunks to keep every worker busy. \`multiprocessing.Pool.map\` picks a chunk size automatically; \`ProcessPoolExecutor.map\` defaults to \`chunksize=1\`, so set it yourself for many small tasks.`,
      },
      {
        id: 'more-workers',
        task: py`Change \`workers=4\` to \`workers=8\`. Before running, predict how many times "running as \`__mp_main__\`" will be printed.`,
        hint: py`Change the number in \`SimulatedProcessPool(workers=4)\`.`,
        tests: [{ name: 'eight workers imported main.py', code: py`assert output.count("running as __mp_main__") == 8` }],
        explain: py`Each worker imports your script once when it starts, so any slow top-level code (loading a big file, importing heavy libraries) is paid **once per worker**. That's part of the start-up cost — and why more workers than CPU cores rarely helps CPU-bound work: they'd just take turns on the same cores.`,
      },
      {
        id: 'lambda',
        task: py`Inside the \`with\` block, add a second job that keeps the numbers ending in 7: \`sevens = pool.map(lambda n: n % 10 == 7, numbers, chunksize=50)\`. Run it and read the error. Then fix it the proper way: define a top-level function \`ends_in_seven(n)\` (next to \`is_prime\`), use it instead of the lambda, and print \`sum(sevens)\`.`,
        hint: py`\`def ends_in_seven(n):\` / \`return n % 10 == 7\` at the top level, then \`sevens = pool.map(ends_in_seven, numbers, chunksize=50)\` inside the \`with\` block.`,
        tests: [
          { name: 'ends_in_seven is a top-level function', code: py`assert callable(ns.get("ends_in_seven")), 'Define ends_in_seven(n) at the top level of main.py'` },
          { name: 'the pool found 20 numbers ending in 7', code: py`assert sum(sevens) == 20` },
        ],
        explain: py`Pickle stores a function **by name** ("\`__main__.is_prime\`") and the worker looks that name up after importing your module. A lambda has no importable name, so pickling fails with \`PicklingError: Can't pickle <function <lambda> ...>\` — the same error a real pool raises. Top-level functions (or \`functools.partial\` of one) always work.`,
      },
      {
        id: 'remove-guard',
        task: py`Delete the line \`if __name__ == "__main__":\` and un-indent the block below it, so the pool is created at the top level. Run it, read the error, then undo the change.`,
        hint: py`Select the lines under the \`if\`, press Shift+Tab to dedent, and delete the \`if\` line.`,
        explain: py`Without the guard, a worker importing \`main.py\` reaches the pool-creating code again and tries to start workers of its own while it is still starting up. Real multiprocessing stops that with \`RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase\` (with \`ProcessPoolExecutor\` you often see \`BrokenProcessPool\` instead). The guard keeps "start the work" code out of what workers import.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'What happens on pool.map() with the spawn start method',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'parent', label: 'Parent process', note: 'runs main.py as __main__', x: 130, y: 90, tone: 'yellow' },
        { id: 'pickle', label: 'pickle', note: 'function name + chunk → bytes', x: 380, y: 90, tone: 'kraft' },
        { id: 'worker', label: 'Worker process', note: 'imports main.py as __mp_main__', x: 630, y: 90, tone: 'blue' },
        { id: 'result', label: 'results', note: 'pickled list → bytes', x: 630, y: 240, tone: 'kraft' },
        { id: 'merge', label: 'Parent collects', note: 'unpickles, keeps input order', x: 130, y: 240, tone: 'yellow' },
      ],
      edges: [
        { from: 'parent', to: 'pickle', label: 'map(is_prime, chunk)' },
        { from: 'pickle', to: 'worker', label: 'pipe / queue' },
        { from: 'worker', to: 'result', label: 'run each item' },
        { from: 'result', to: 'merge', label: 'pipe back' },
      ],
      steps: [
        { focus: ['parent'], text: py`Your script runs as \`__main__\`. Inside the \`if __name__ == "__main__":\` block it creates a pool and calls \`pool.map(is_prime, numbers, chunksize=...)\`.` },
        { focus: ['worker'], text: py`Each worker starts as a **fresh interpreter** and imports your script under the name \`__mp_main__\`. Top-level code runs again; the guarded block doesn't, so the workers don't start pools of their own. This is a real start-up cost.` },
        { focus: ['parent', 'pickle'], edges: ['parent->pickle'], text: py`For each chunk, the parent **pickles** the function — just its importable name, \`__main__.is_prime\` — plus the chunk of numbers. Lambdas and local functions have no importable name, so they fail here.` },
        { focus: ['pickle', 'worker'], edges: ['pickle->worker'], text: py`The bytes travel through a pipe. The worker unpickles them: it looks \`is_prime\` up in *its own* imported copy of your module and gets *its own copy* of the numbers. Nothing in the parent's memory is shared.` },
        { focus: ['worker', 'result'], edges: ['worker->result'], text: py`The worker computes — truly in parallel with the other workers, because each process has its own GIL — then pickles the list of results.` },
        { focus: ['merge'], edges: ['result->merge'], text: py`The parent unpickles each reply and puts the results back in input order. Every arrow in this diagram costs time, which is why big chunks of real work, with small inputs and outputs, are what make processes pay off.` },
      ],
    },
    alt: 'Diagram: the parent process pickles the function name and a chunk of items and sends the bytes through a pipe to a worker process, which imports main.py as __mp_main__, runs each item and pickles the results back through a pipe, where the parent unpickles them and keeps input order.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`The operating system keeps processes apart: each one gets its own *address space*, so process A literally cannot read process B's variables. To cooperate, processes must **send messages** — through pipes, queues, files or sockets — or deliberately set up a shared-memory block.`,
      py`\`multiprocessing\` hides most of that. When you call \`pool.map(f, items)\`, it pickles \`f\` and the items, writes the bytes into a pipe, a worker reads and unpickles them, runs \`f\`, and the result travels back the same way. It feels like a function call, but there is a lot of packing and posting underneath.`,
    ],
    technical: [
      py`#### Pickling functions: by reference`,
      py`Pickle doesn't copy a function's code. It records its **module and qualified name** (\`__main__.is_prime\`) and the receiving process imports that module and looks the name up. That's why the function must be importable at the top level, why the worker must import your main script, and why that import must not start new work (the guard). Lambdas and nested functions fail: in 3.14 with \`_pickle.PicklingError: Can't pickle <function <lambda> at 0x…>: it's not found as __main__.<lambda>\`; older versions raised \`AttributeError: Can't pickle local object …\` for nested functions. \`functools.partial(top_level_function, arg)\` pickles fine.`,
      py`#### Start methods in detail`,
      py`- **fork** (POSIX only): the child is a copy of the parent made by the OS — fast, and the child inherits all globals, but copying a process that runs threads can leave locks held by threads that don't exist in the child, which can deadlock it. Python 3.12+ emits a \`DeprecationWarning\` when \`os.fork()\` is used in a process with several threads.
- **spawn**: a brand-new interpreter. Slowest to start, safest, and the only option on Windows.
- **forkserver**: a single-threaded server process is started early; new workers are forked from it, so they start from a clean, thread-free state.`,
      py`#### Chunking`,
      py`Each message has a fixed cost, so pools batch items. \`multiprocessing.Pool.map\` with no \`chunksize\` uses a heuristic: roughly the number of items divided by four times the number of workers, rounded up — about four chunks per worker, a balance between overhead and keeping workers evenly busy. \`ProcessPoolExecutor.map\` sends one item per message unless you pass \`chunksize\`.`,
      py`#### Sharing data on purpose`,
      py`- \`multiprocessing.Queue\` / \`Pipe\`: message passing (pickled).
- \`Value\` / \`Array\`: small typed values in shared memory, with an optional lock.
- \`shared_memory.SharedMemory\` (3.8+): a raw block several processes map directly — useful with NumPy arrays, no pickling of the data.
- \`Manager()\`: a server process holding real Python objects; every access is a round trip, so it's convenient but slow.`,
      { callout: 'note', title: 'CPython detail', text: py`"One GIL per process" is a property of CPython's design (PyPy also has a GIL per process). Python 3.14 adds two related options: the officially supported **free-threaded build**, where threads can run Python code in parallel, and \`concurrent.interpreters\` / \`concurrent.futures.InterpreterPoolExecutor\` (PEP 734), which run several isolated interpreters with their own GILs **inside one process**. See [the GIL & free threading](lesson:gil-and-free-threading).` },
    ],
    production: [
      py`**Make tasks coarse.** Each task should do much more work than it costs to send: pass a file path and let the worker read the file, rather than sending its contents; return a summary, not a huge object. Measure with [profiling](lesson:profiling) before and after.`,
      py`**Pay start-up once.** Create one pool and reuse it for many batches. Expensive per-worker setup (loading a model, opening a database connection) belongs in an \`initializer=\` function, which runs once in each worker; keep the loaded object in a module-level global *in the worker*.`,
      py`**Bound memory.** Each worker is a full interpreter plus whatever it imports and loads. \`max_tasks_per_child=\` (3.11+ for \`ProcessPoolExecutor\`, \`maxtasksperchild=\` for \`Pool\`) restarts workers periodically to contain slow leaks.`,
      py`**Expect failures.** If a worker dies abruptly (out of memory, a crash in C code), a \`ProcessPoolExecutor\` becomes unusable and raises \`BrokenProcessPool\`; build in retries at the job level. Never unpickle data from untrusted sources — pickle can execute code.`,
      py`**Know the alternatives.** NumPy, pandas and many C extensions already run heavy loops in C (often releasing the GIL); vectorising may beat processes. For work spread across machines or surviving restarts, use a job queue such as Celery or RQ — see [choosing a concurrency model](lesson:choosing-concurrency).`,
    ],
  },
  mistakes: [
    {
      title: 'No main guard',
      wrong: { code: py`from concurrent.futures import ProcessPoolExecutor

def square(n):
    return n * n

with ProcessPoolExecutor() as pool:          # runs again in every spawned worker
    print(list(pool.map(square, range(10))))`, lang: 'python', static: true },
      right: { code: py`from concurrent.futures import ProcessPoolExecutor

def square(n):
    return n * n

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:
        print(list(pool.map(square, range(10))))`, lang: 'python', static: true },
      explanation: py`Spawned workers import your script. Without the guard, each worker reaches the pool code again and tries to start processes during its own start-up: \`RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase\`, or \`BrokenProcessPool\`. It may seem to work on Linux before 3.14 (fork) and fail on macOS, Windows and Linux 3.14+. See [the main guard](lesson:main-guard-and-scripts).`,
    },
    {
      title: 'Sending a lambda or a nested function',
      wrong: { code: py`with ProcessPoolExecutor() as pool:
    doubled = list(pool.map(lambda n: n * 2, numbers))   # PicklingError`, lang: 'python', static: true },
      right: { code: py`def double(n):                 # top level: importable by name
    return n * 2

with ProcessPoolExecutor() as pool:
    doubled = list(pool.map(double, numbers))`, lang: 'python', static: true },
      explanation: py`Functions are pickled by their importable name. Define work functions at module level; to bind extra arguments use \`functools.partial(top_level_fn, factor=3)\`.`,
    },
    {
      title: 'Expecting a worker to update the parent’s data',
      wrong: { code: py`seen = []

def check(url):
    seen.append(url)           # appends to the WORKER's copy of seen
    return len(url)

# ... after pool.map(check, urls) the parent's seen is still []`, lang: 'python', static: true },
      right: { code: py`def check(url):
    return url, len(url)       # send the information back as a result

# results = list(pool.map(check, urls)); seen = [url for url, _ in results]`, lang: 'python', static: true },
      explanation: py`Each process has its own memory. Return what the parent needs, or use an explicit channel (\`Queue\`, \`Manager\`, shared memory).`,
    },
    {
      title: 'Tiny tasks, one per message',
      wrong: { code: py`with ProcessPoolExecutor() as pool:
    totals = list(pool.map(add_tax, prices))            # a million 1-microsecond tasks`, lang: 'python', static: true },
      right: { code: py`with ProcessPoolExecutor() as pool:
    totals = list(pool.map(add_tax, prices, chunksize=10_000))
# ...or simply: totals = [add_tax(p) for p in prices]`, lang: 'python', static: true },
      explanation: py`When each task is tiny, pickling and messaging dominate and the parallel version can be **slower** than a plain loop. Batch with \`chunksize\`, make each task bigger, or don't parallelise at all.`,
    },
    {
      title: 'Reading results after the Pool was terminated',
      wrong: { code: py`with Pool(4) as pool:
    async_result = pool.map_async(work, items)
print(async_result.get())       # the with block already called terminate()`, lang: 'python', static: true },
      right: { code: py`with Pool(4) as pool:
    results = pool.map_async(work, items).get()
print(results)`, lang: 'python', static: true },
      explanation: py`\`Pool.__exit__\` calls \`terminate()\`, which stops workers immediately. Wait for results inside the block (or call \`close()\` and \`join()\` yourself). \`ProcessPoolExecutor.__exit__\` instead waits for pending work.`,
    },
  ],
  debugging: [
    {
      symptom: py`RuntimeError: An attempt has been made to start a new process before the current process has finished its bootstrapping phase.`,
      cause: py`The script starts processes at the top level, without the main guard, and the start method is spawn or forkserver.`,
      fix: py`Put everything that starts work under \`if __name__ == "__main__":\` (usually by calling a \`main()\` function there).`,
    },
    {
      symptom: py`_pickle.PicklingError: Can't pickle <function <lambda> at 0x…>: it's not found as __main__.<lambda>`,
      cause: py`A lambda, nested function or other non-importable object was sent to a worker.`,
      fix: py`Use a top-level function (plus \`functools.partial\` for extra arguments).`,
    },
    {
      symptom: py`TypeError: cannot pickle '_thread.lock' object (or 'TextIOWrapper', 'generator', 'sqlite3.Connection' …)`,
      cause: py`An argument, result or attribute of a passed object can't be pickled: locks, open files, generators, connections.`,
      fix: py`Send plain data (paths, ids, numbers) and create files or connections inside the worker, e.g. in an \`initializer\`.`,
    },
    {
      symptom: py`concurrent.futures.process.BrokenProcessPool: A process in the process pool was terminated abruptly while the future was running or pending.`,
      cause: py`A worker died: killed for using too much memory, a crash in C code, \`os._exit()\`, or a failure while importing the main module (often the missing guard).`,
      fix: py`Check memory use and the worker's own error output, add the main guard, and create a new pool to retry.`,
    },
    {
      symptom: py`The parallel version is slower than the plain loop.`,
      cause: py`Tasks are too small or move too much data, so start-up and pickling dominate; or the work is I/O-bound.`,
      fix: py`Measure, use a larger \`chunksize\`, pass references (paths) instead of data, reuse one pool — or use threads/asyncio for I/O.`,
    },
  ],
  bestPractices: [
    'Use processes for CPU-bound pure-Python work; use threads or asyncio for waiting.',
    'Always put the code that starts processes behind if __name__ == "__main__":.',
    'Define work functions at module level; bind extra arguments with functools.partial.',
    'Send small inputs (paths, ids, ranges) and return small outputs; do the heavy lifting inside the worker.',
    'Batch tiny tasks with chunksize and reuse one pool instead of creating many.',
    'Put per-worker setup (models, connections) in an initializer.',
    'Write code that works with the spawn start method — then it works on every platform.',
    'Measure the speed-up; it is limited by your core count and by the sequential part of the program.',
  ],
  useCases: [
    'Image or video processing in Python code (thumbnails, filters) across many files.',
    'Simulations, Monte Carlo experiments, parameter sweeps.',
    'Parsing or transforming many large log or CSV files.',
    'CPU-heavy scoring or feature extraction in a data pipeline.',
    'Isolating crash-prone or memory-leaking work in disposable worker processes.',
  ],
  whenToUse: {
    use: [
      'The work is CPU-bound and written in Python (or a library that holds the GIL).',
      'It splits into independent pieces that each do a meaningful amount of work.',
      'Inputs and outputs per piece are small compared with the computation.',
    ],
    avoid: [
      'I/O-bound work — threads or asyncio overlap waits far more cheaply.',
      'Tiny tasks or huge data per task, where pickling and copying dominate.',
      'Work already done in C that releases the GIL (NumPy, hashlib, zlib) — threads may be enough.',
    ],
  },
  comparison: {
    title: 'ProcessPoolExecutor vs multiprocessing.Pool vs Process',
    headers: ['', 'ProcessPoolExecutor', 'multiprocessing.Pool', 'Process'],
    rows: [
      ['style', 'Executor + Futures (same API as threads)', 'map / imap / starmap / apply_async', 'one process, by hand'],
      ['default chunksize in map', '1 (set it for small tasks)', 'automatic heuristic', 'n/a'],
      ['leaving the with block', 'waits for pending work', 'calls terminate()', 'n/a'],
      ['getting errors back', 'future.result() re-raises', 'get() re-raises', 'only the exitcode, unless you send errors yourself'],
      ['best for', 'most new code; easy to swap with threads', 'streaming results, many-argument calls', 'long-lived workers with custom communication'],
    ],
    note: py`Because \`ProcessPoolExecutor\` and \`ThreadPoolExecutor\` share one interface, code written against \`Executor\` can switch between threads and processes by changing one line — handy while you [measure which one fits](lesson:choosing-concurrency).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'multiprocessing-q1',
      type: 'mcq',
      prompt: 'Why does a script that uses a process pool need `if __name__ == "__main__":` on macOS and Windows?',
      options: [
        { text: 'Because processes can only be started from a function called main()', why: 'The function name doesn’t matter; what matters is whether the code runs on import.' },
        'Because each spawned worker imports the main script, and unguarded code that starts the pool would run again inside every worker',
        { text: 'Because without it the GIL is shared between the processes', why: 'Each process always has its own interpreter and GIL; the guard is about imports.' },
        { text: 'It isn’t needed; it is only a style convention', why: 'With the spawn start method it is required — workers fail to start without it.' },
      ],
      answer: 1,
      explanation: py`With *spawn* (and *forkserver*), a worker is a new interpreter that imports your script as \`__mp_main__\` to find your functions. The guard is \`False\` there, so the pool-starting code runs only in the real main process.`,
    },
    {
      id: 'multiprocessing-q2',
      type: 'output',
      prompt: 'A worker receives its arguments as a pickled copy. This snippet does the same round trip by hand. What does it print?',
      code: py`import pickle

basket = ["apple"]
copy = pickle.loads(pickle.dumps(basket))
copy.append("pear")
print(basket, copy == basket, copy is basket)`,
      options: [
        { text: "['apple', 'pear'] True True", why: 'pickle.loads builds a brand-new list; appending to it cannot change the original.' },
        "['apple'] False False",
        { text: "['apple'] True False", why: 'After the append, copy is ["apple", "pear"], which is not equal to ["apple"].' },
        { text: "['apple', 'pear'] False False", why: 'basket itself is never modified.' },
      ],
      answer: 1,
      explanation: py`Unpickling creates new objects. That's exactly what a worker gets: a copy. Changes made in the worker stay in the worker unless it returns them.`,
    },
    {
      id: 'multiprocessing-q3',
      type: 'bug',
      prompt: 'This program fails as soon as the pool tries to send work. Click the line that causes it.',
      code: py`from concurrent.futures import ProcessPoolExecutor

def load_prices():
    return [19.99, 5.49, 102.00]

if __name__ == "__main__":
    prices = load_prices()
    with ProcessPoolExecutor() as pool:
        with_tax = list(pool.map(lambda p: round(p * 1.2, 2), prices))
    print(with_tax)`,
      answerLine: 9,
      explanation: py`The lambda can't be pickled, so the worker can never receive it (\`PicklingError\`). Define \`def add_tax(price): return round(price * 1.2, 2)\` at the top level and map that.`,
    },
    {
      id: 'multiprocessing-q4',
      type: 'fill',
      prompt: 'Complete the program: guard the entry point and run `score` over the items in batches of 500.',
      code: py`from concurrent.futures import ProcessPoolExecutor

def score(item):
    return sum(ord(c) for c in item)

if __name__ == "___":
    items = [f"user-{n}" for n in range(100_000)]
    with ProcessPoolExecutor() as pool:
        scores = list(pool.___(score, items, chunksize=500))`,
      answer: [['__main__'], ['map']],
      explanation: py`\`__name__\` is \`"__main__"\` only in the process you started directly. \`pool.map(fn, items, chunksize=500)\` sends the items in batches of 500, cutting the per-message overhead.`,
    },
    {
      id: 'multiprocessing-q5',
      type: 'mcq',
      prompt: 'Select **all** values that can be sent to a worker process as arguments.',
      options: [
        'A function defined at the top level of a module',
        { text: 'lambda x: x + 1', why: 'Lambdas have no importable name, so pickle refuses them.' },
        'A dict of lists of numbers',
        { text: 'An open file object', why: 'Open files are tied to the current process; send the path and open it in the worker.' },
        { text: 'A threading.Lock()', why: 'TypeError: cannot pickle \'_thread.lock\' object. Use multiprocessing.Lock (passed at process creation) if you truly need one.' },
      ],
      answer: [0, 2],
      explanation: py`Plain data and importable functions pickle fine. Resources bound to one process — files, locks, sockets, connections — and anonymous functions don't.`,
    },
    {
      id: 'multiprocessing-q6',
      type: 'output',
      prompt: 'This is the rule `multiprocessing.Pool.map` uses to pick a chunk size when you don’t give one. What does it print for 1,000 items and 4 workers?',
      code: py`items, workers = 1000, 4
chunksize, extra = divmod(items, workers * 4)
if extra:
    chunksize += 1
print(chunksize, -(-items // chunksize))`,
      answer: '63 16',
      accept: ['63 16'],
      explanation: py`\`divmod(1000, 16)\` is \`(62, 8)\`; the remainder bumps the size to 63. \`-(-a // b)\` is ceiling division: 1000 items in chunks of 63 make 16 messages — about four per worker.`,
    },
    {
      id: 'multiprocessing-q7',
      type: 'short',
      prompt: 'A teammate parallelised "add VAT to a million prices" with a ProcessPoolExecutor and it got slower. Explain why and what you would try.',
      answer: py`Each task is a single multiplication — far cheaper than what the pool spends per task: pickling the argument, sending it through a pipe, unpickling, running, and sending the result back, plus starting the worker processes. With the default chunksize of 1 that overhead is paid a million times. Options: pass a large chunksize so each message carries thousands of prices; make each task bigger (a whole list per task); or, best here, don't use processes — a list comprehension or NumPy is faster for such cheap work. Processes pay off only when each task does much more work than it costs to send.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'pool-chunking',
      title: 'Chunk the work like Pool.map',
      difficulty: 'intermediate',
      prompt: py`Implement the two helpers a process pool uses to batch work:

1. \`default_chunksize(n_items, workers)\` — the rule \`multiprocessing.Pool.map\` uses when you don't pass a chunk size: divide \`n_items\` by \`workers * 4\`; if there is a remainder, add 1. Return \`0\` when \`n_items\` is 0. Raise \`ValueError\` if \`workers < 1\`.
2. \`make_chunks(items, chunksize)\` — split the list \`items\` into a list of lists of at most \`chunksize\` items, in order (the last chunk may be shorter). Return \`[]\` for an empty list. Raise \`ValueError\` if \`chunksize < 1\`.

Examples: \`default_chunksize(1000, 4)\` → \`63\`, \`default_chunksize(10, 4)\` → \`1\`, \`make_chunks([1, 2, 3, 4, 5], 2)\` → \`[[1, 2], [3, 4], [5]]\`.`,
      files: {
        'main.py': py`def default_chunksize(n_items, workers):
    # TODO: Pool.map's rule
    return 1


def make_chunks(items, chunksize):
    # TODO: split items into lists of at most chunksize items
    return [items]


print(default_chunksize(1000, 4))      # 63
print(make_chunks([1, 2, 3, 4, 5], 2))  # [[1, 2], [3, 4], [5]]
`,
      },
      hints: [
        'divmod(a, b) returns the quotient and the remainder in one go.',
        'For the chunks, loop over the start positions range(0, len(items), chunksize) and slice.',
        'chunksize, extra = divmod(n_items, workers * 4); if extra: chunksize += 1 — and [items[i:i + chunksize] for i in range(0, len(items), chunksize)].',
      ],
      solution: {
        explanation: py`\`divmod(n_items, workers * 4)\` aims for about **four chunks per worker**: enough chunks that a worker finishing early can pick up another (load balancing), few enough that the per-message overhead stays small. Rounding up with the remainder guarantees the chunks cover every item. For 0 items, \`divmod\` gives \`(0, 0)\` and no remainder, so 0 comes out naturally — the explicit check just makes the intent obvious.

\`make_chunks\` slices from every start position \`0, chunksize, 2*chunksize, …\`; slicing past the end is safe in Python, so the last chunk is simply shorter. With these two helpers you can feed any executor sensible batches, even \`ProcessPoolExecutor\`, whose \`map()\` defaults to one item per message.`,
        files: {
          'main.py': py`def default_chunksize(n_items, workers):
    if workers < 1:
        raise ValueError("workers must be at least 1")
    if n_items == 0:
        return 0
    chunksize, extra = divmod(n_items, workers * 4)
    if extra:
        chunksize += 1
    return chunksize


def make_chunks(items, chunksize):
    if chunksize < 1:
        raise ValueError("chunksize must be at least 1")
    return [items[start:start + chunksize] for start in range(0, len(items), chunksize)]


print(default_chunksize(1000, 4))      # 63
print(make_chunks([1, 2, 3, 4, 5], 2))  # [[1, 2], [3, 4], [5]]
`,
        },
      },
      tests: [
        { name: '1000 items on 4 workers -> chunks of 63', code: py`assert default_chunksize(1000, 4) == 63` },
        { name: 'exact division needs no rounding up', code: py`assert default_chunksize(64, 4) == 4` },
        { name: 'few items still get chunks of 1', code: py`assert default_chunksize(10, 4) == 1` },
        { name: 'no items -> 0', code: py`assert default_chunksize(0, 8) == 0` },
        { name: 'chunks keep order and the last one is shorter', code: py`assert make_chunks([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]` },
        { name: 'chunks cover every item exactly once', code: py`items = list(range(1000))
chunks = make_chunks(items, 63)
assert len(chunks) == 16 and [x for chunk in chunks for x in chunk] == items` },
        { name: 'an empty list gives no chunks', code: py`assert make_chunks([], 3) == []` },
        { name: 'bad arguments raise ValueError', code: py`with raises(ValueError):
    make_chunks([1, 2], 0)
with raises(ValueError):
    default_chunksize(10, 0)` },
      ],
    },
    {
      id: 'picklable-task',
      title: 'Make the task picklable',
      difficulty: 'intermediate',
      prompt: py`A pipeline builds its work functions with a factory, \`make_task(factor)\`, which currently returns a lambda — so it can't be sent to a process pool. Fix it and add a checker:

1. \`scale(value, factor)\` — a **top-level** function returning \`value * factor\`.
2. \`make_task(factor)\` — return a callable that takes one value and returns \`value * factor\`, and that **survives pickling**. Use \`functools.partial\` with \`scale\`.
3. \`survives_pickling(obj)\` — return \`True\` if \`pickle.dumps(obj)\` succeeds, \`False\` if it raises \`pickle.PicklingError\`, \`TypeError\` or \`AttributeError\`.

The tests round-trip your task through \`pickle\` — exactly what a process pool does before a worker can run it.`,
      files: {
        'main.py': py`import functools
import pickle


def scale(value, factor):
    return value * factor


def make_task(factor):
    # TODO: lambdas can't be pickled - build the task from scale instead
    return lambda value: value * factor


def survives_pickling(obj):
    # TODO: try pickle.dumps(obj) and report whether it worked
    return True


triple = make_task(3)
print(triple(5))                       # 15
print(survives_pickling(triple))       # True once fixed
`,
      },
      hints: [
        'functools.partial(func, **kwargs) returns a new callable with some arguments already filled in.',
        'A partial object pickles if the function it wraps and the stored arguments pickle — and scale is top level.',
        'return functools.partial(scale, factor=factor); and in survives_pickling: try: pickle.dumps(obj) except (pickle.PicklingError, TypeError, AttributeError): return False; return True.',
      ],
      solution: {
        explanation: py`\`functools.partial(scale, factor=3)\` is an object that remembers *which* function to call (\`scale\`, pickled by its importable name) and *which* keyword arguments to add (\`factor=3\`, a plain int). Both parts pickle, so the whole task can be sent to a worker, which imports \`scale\` and rebuilds the partial. The lambda failed because pickle stores functions by name and a lambda has none that a worker could import.

\`survives_pickling\` catches the three exceptions pickling commonly raises: \`PicklingError\` for functions that can't be found by name, \`TypeError\` for objects that refuse to be pickled (locks, generators, open files), and \`AttributeError\`, which older Python versions raised for local objects. Another picklable option is a small top-level class with a \`__call__\` method that stores \`factor\` as an attribute.`,
        files: {
          'main.py': py`import functools
import pickle


def scale(value, factor):
    return value * factor


def make_task(factor):
    return functools.partial(scale, factor=factor)


def survives_pickling(obj):
    try:
        pickle.dumps(obj)
    except (pickle.PicklingError, TypeError, AttributeError):
        return False
    return True


triple = make_task(3)
print(triple(5))                       # 15
print(survives_pickling(triple))       # True
`,
        },
      },
      tests: [
        { name: 'make_task(3) multiplies by 3', code: py`assert make_task(3)(5) == 15` },
        { name: 'the task survives a pickle round trip', code: py`import pickle
task = pickle.loads(pickle.dumps(make_task(4)))
assert task(10) == 40` },
        { name: 'lambdas and generators do not survive pickling', code: py`assert survives_pickling(lambda x: x) is False
assert survives_pickling(x for x in range(3)) is False` },
        { name: 'locks do not survive pickling', code: py`import threading
assert survives_pickling(threading.Lock()) is False` },
        { name: 'plain data and the fixed task do', code: py`assert survives_pickling({"prices": [1.5, 2.0]}) is True
assert survives_pickling(make_task(2)) is True` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'multiprocessing-what-is-shared',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'When you hand work to a process pool, what is shared between the parent and the workers, and what is copied?',
      answer: 'By default nothing is shared: each worker has its own memory and interpreter. The function is sent by name and re-imported in the worker; arguments and results are pickled and copied. A worker changing a global or an argument only changes its own copy. Sharing must be explicit: Queue/Pipe messages, Value/Array, shared_memory or a Manager.',
      explanation: py`This is the opposite of threads, which share everything. It removes most race conditions but means data transfer has a real cost and must be designed. With the old *fork* default, children started with a copy of the parent's memory, which made globals *look* shared at the start — but even then, changes never flowed back.`,
      whyAsked: 'Many bugs and performance problems with multiprocessing come from assuming shared state.',
      mistakes: ['Saying globals are shared between processes', 'Forgetting that results are pickled too', 'Not knowing that the function is sent by reference'],
      followUps: ['How would you share a large read-only array between workers?', 'What does a Manager cost on every access?', 'What changes with the fork start method?'],
      modelAnswer: 'Processes don’t share memory by default. When I call pool.map, the function goes over by its importable name and the worker imports it, while the arguments are pickled, copied through a pipe and unpickled in the worker, and the results come back the same way. So if a worker appends to a global list or mutates an argument, it only changes its own copy — the parent never sees it. If I really need sharing I make it explicit: return values, a multiprocessing Queue, Value and Array for small things, shared_memory for big numeric buffers, or a Manager, which is convenient but makes every access a round trip.',
    },
    {
      id: 'multiprocessing-bootstrapping-error',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A colleague’s script works on their Linux laptop with Python 3.12 but fails on macOS with "An attempt has been made to start a new process before the current process has finished its bootstrapping phase". What’s wrong?',
      answer: 'The script starts the pool at module level without the if __name__ == "__main__": guard. On Linux before 3.14 the default start method was fork, which does not re-import the script, so it happened to work. macOS (and Windows, and Linux from 3.14) use spawn/forkserver: each worker imports the main module, re-runs the pool code during start-up, and multiprocessing refuses. Fix: put the entry code behind the guard.',
      explanation: py`Spawned workers import the main script as \`__mp_main__\` so they can find the target function by name. Unguarded top-level code — including the pool creation — runs in that import. Writing code for spawn (guard + importable functions + picklable data) makes it portable; you can test it on Linux with \`multiprocessing.set_start_method("spawn")\`.`,
      whyAsked: 'It is the most common cross-platform multiprocessing failure and tests understanding of start methods, not just syntax.',
      mistakes: ['Blaming macOS', 'Switching to fork everywhere as the fix', 'Not knowing the 3.14 default change on Linux'],
      followUps: ['What is __mp_main__?', 'Why did Python 3.14 move Linux away from fork?', 'How would you catch this in CI?'],
      modelAnswer: 'The pool is being created at module level without the main guard. On Linux before 3.14 the default start method was fork, which copies the running process and never re-imports the script, so it worked by accident. On macOS the default is spawn: every worker is a fresh interpreter that imports the main script as __mp_main__ to find the worker function, and because the pool code isn’t guarded, the worker tries to start its own processes while still bootstrapping, which multiprocessing refuses. The fix is to move the entry code into a main function called under if __name__ == "__main__". I’d also set the start method to spawn in CI, since 3.14 Linux defaults to forkserver anyway.',
    },
    {
      id: 'multiprocessing-slower-than-loop',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You parallelised a data job across 8 processes and it is barely faster — sometimes slower — than the single-process version. What do you check, and what are the fixes?',
      answer: 'Check whether overhead dominates: task size vs. pickling and IPC (too many tiny tasks, large arguments or results), process start-up and per-worker imports, too many workers for the cores, and whether the work is really CPU-bound (I/O-bound work gains little). Fixes: larger chunksize or coarser tasks, pass paths/ids instead of data, return summaries, reuse one pool with an initializer, match workers to cores, or vectorise instead.',
      explanation: py`Speed-up = work saved by parallelism minus the costs of distributing it. Profile one task, time the pickling of its inputs (\`len(pickle.dumps(args))\` is a good proxy), and compare. Amdahl's law also caps the gain if a big part of the job is sequential (reading the input, merging the results).`,
      whyAsked: 'Shows whether you understand the cost model of processes rather than treating them as a speed switch.',
      mistakes: ['Adding more processes', 'Ignoring the size of data sent per task', 'Not measuring the sequential parts'],
      followUps: ['How do you measure pickling overhead?', 'When does shared_memory help?', 'How does Amdahl’s law apply here?'],
      modelAnswer: 'First I’d check whether the overhead is bigger than the work. Every task pays for pickling its arguments, sending them through a pipe, unpickling, and the same for the result, and every worker pays start-up and import costs. So I’d look at how long one task really takes versus how much data it moves, whether we’re using the default chunksize of one with ProcessPoolExecutor, and whether there are more workers than cores. I’d also confirm the job is CPU-bound and see how much of it is sequential, like reading input and merging. The fixes are coarser tasks or a bigger chunksize, sending paths or ids instead of data, returning small summaries, reusing one pool with an initializer for setup — or vectorising with NumPy if that removes the Python loop entirely.',
    },
    {
      id: 'multiprocessing-start-methods',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare the fork, spawn and forkserver start methods. Which is the default where in Python 3.14, and why did Linux change?',
      answer: 'fork copies the parent process (fast, inherits memory, unsafe if the parent has threads); spawn starts a fresh interpreter that imports the main module (slower, safest, works everywhere); forkserver forks children from a clean single-threaded server process. In 3.14: spawn on Windows and macOS, forkserver on other POSIX systems such as Linux, which previously defaulted to fork. The change avoids deadlocks from forking multi-threaded processes.',
      explanation: py`Forking copies memory but only the calling thread; locks held by other threads at that moment stay locked forever in the child, and many libraries start background threads. Python 3.12 started warning about \`fork()\` in multi-threaded processes, and 3.14 moved the POSIX default to \`forkserver\`. Code that relied on fork's inherited globals must now pass data explicitly or select \`get_context("fork")\` consciously.`,
      whyAsked: 'It tests up-to-date knowledge and an understanding of why process creation strategy affects correctness, not just speed.',
      mistakes: ['Saying fork is the default everywhere', 'Not knowing why fork plus threads is dangerous', 'Thinking spawn shares memory'],
      followUps: ['How do you choose a start method for one pool only?', 'What is copy-on-write and why does reference counting weaken it?', 'Why must code written for spawn use the main guard?'],
      modelAnswer: 'Fork makes the child a copy of the parent, so it starts quickly and inherits all the parent’s memory, but only the forking thread is copied — if another thread held a lock at that moment, it stays locked forever in the child, which can deadlock it. Spawn starts a brand-new interpreter that imports the main module; it’s slower to start but clean, and it’s the only option on Windows. Forkserver starts a small single-threaded server early and forks workers from it, so they’re both fast-ish and clean. In 3.14 the defaults are spawn on Windows and macOS and forkserver on other POSIX systems like Linux, which used to default to fork; the change was made precisely because forking multi-threaded processes is unsafe. I write code that works under spawn — guard, top-level functions, picklable data — and pick a context explicitly when it matters.',
    },
    {
      id: 'multiprocessing-split-range',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'To spread a CPU-bound scan over N worker processes you need balanced work ranges. Write `split_range(start, stop, parts)` returning exactly `parts` tuples `(lo, hi)` that cover `range(start, stop)` in order without gaps or overlaps; sizes may differ by at most 1, with the bigger parts first. Raise `ValueError` if `parts < 1`.',
      answer: 'Compute size, extra = divmod(stop - start, parts); the first extra parts get size + 1 items, the rest get size; walk a cursor from start and emit (lo, lo + length) for each part.',
      explanation: py`Sending each worker a small \`(lo, hi)\` pair instead of a list of numbers keeps the pickled messages tiny — the worker generates its own numbers with \`range(lo, hi)\`. Balanced sizes avoid one straggler worker holding up the whole job. When there are more parts than items, some ranges are empty (\`lo == hi\`), which is harmless.`,
      starter: { files: { 'main.py': py`def split_range(start, stop, parts):
    # TODO: balanced, contiguous (lo, hi) ranges
    return [(start, stop)]


print(split_range(0, 10, 3))   # [(0, 4), (4, 7), (7, 10)]
` } },
      tests: [
        { name: 'ten numbers in three parts', code: py`assert split_range(0, 10, 3) == [(0, 4), (4, 7), (7, 10)]` },
        { name: 'even split with an offset start', code: py`assert split_range(100, 108, 4) == [(100, 102), (102, 104), (104, 106), (106, 108)]` },
        { name: 'more parts than numbers gives empty ranges at the end', code: py`assert split_range(0, 2, 3) == [(0, 1), (1, 2), (2, 2)]` },
        { name: 'covers every number exactly once', code: py`parts = split_range(5, 1_005, 7)
assert len(parts) == 7
assert [n for lo, hi in parts for n in range(lo, hi)] == list(range(5, 1_005))
sizes = [hi - lo for lo, hi in parts]
assert max(sizes) - min(sizes) <= 1` },
        { name: 'parts < 1 raises ValueError', code: py`with raises(ValueError):
    split_range(0, 10, 0)` },
      ],
      solution: { files: { 'main.py': py`def split_range(start, stop, parts):
    if parts < 1:
        raise ValueError("parts must be at least 1")
    size, extra = divmod(max(0, stop - start), parts)
    ranges = []
    lo = start
    for index in range(parts):
        hi = lo + size + (1 if index < extra else 0)
        ranges.append((lo, hi))
        lo = hi
    return ranges


print(split_range(0, 10, 3))   # [(0, 4), (4, 7), (7, 10)]
` } },
      hints: ['divmod(total, parts) tells you the base size and how many parts get one extra item.', 'Keep a running cursor lo; each part ends where the next begins.'],
      whyAsked: 'Partitioning work evenly and cheaply is the core design step of any process-pool job.',
      mistakes: ['Using floating-point division and rounding (gaps or overlaps)', 'Putting all the leftover items in the last part', 'Sending full lists of numbers to workers instead of bounds'],
      followUps: ['How would you use this with ProcessPoolExecutor?', 'What if some numbers are much more expensive than others?', 'Why are more, smaller parts sometimes better than exactly one per worker?'],
      modelAnswer: 'I take the total count, stop minus start, and divmod it by the number of parts. That gives a base size and a remainder; the first remainder-many parts get one extra item, so sizes differ by at most one. Then I walk a cursor from start, emitting lo and lo plus that part’s size, and move the cursor to the end of the part, which guarantees no gaps or overlaps. I’d send just these tuples to the workers so the messages stay tiny, and each worker loops over range(lo, hi) itself. If the cost per number varies a lot, I’d create more parts than workers so the pool can balance the load.',
    },
    {
      id: 'multiprocessing-large-dataset',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You need to compute statistics over 2,000 compressed log files (about 1 GB each) on a 16-core machine, in pure Python. Design the parallel job.',
      answer: 'Use a ProcessPoolExecutor with about one worker per core; send each worker a file path, not the data; each worker streams and parses its file and returns a small summary (counts, sums, histograms); the parent merges summaries as they complete (as_completed), with a progress log and retries for failed files. Keep memory bounded per worker, use max_tasks_per_child if parsing leaks, and make the merge associative so order does not matter.',
      explanation: py`The design minimises what crosses process boundaries: a path in, a compact summary out. Streaming inside the worker keeps memory flat; decompression in \`gzip\` runs largely in C. Merging associative summaries (Counters, sums, min/max) lets results arrive in any order. Failures are isolated per file. If the job grows beyond one machine, the same "path in, summary out" task fits a distributed queue (Celery, RQ, a cloud batch service).`,
      whyAsked: 'It checks whether you can apply the cost model of processes — data movement, memory, failure isolation — to a realistic workload.',
      mistakes: ['Reading files in the parent and sending their contents to workers', 'Returning full parsed records to the parent', 'One process per file all at once', 'No handling for a corrupt file'],
      followUps: ['How would you resume after a crash halfway?', 'What changes if one file is 50 GB?', 'Would threads ever be the better choice here?'],
      modelAnswer: 'I’d use a ProcessPoolExecutor with roughly one worker per core, because parsing in pure Python is CPU-bound. Each task gets only a file path; the worker opens and streams the file line by line so memory stays flat, and returns a small summary — counts, sums, a Counter of status codes. The parent submits all paths, consumes results with as_completed, merges the summaries, which are associative so order doesn’t matter, and logs progress. A file that raises is logged and retried or reported rather than killing the job, and if parsing slowly leaks memory I’d set max_tasks_per_child. For a resumable job I’d record finished paths, and if it outgrows one machine the same path-in, summary-out task moves straight onto a distributed queue.',
    },
  ],

  takeaways: [
    'Each process has its own memory, interpreter and (in standard CPython) GIL, so processes run Python code on several cores in parallel.',
    'Nothing is shared by default: functions travel by importable name, arguments and results are pickled copies.',
    'Guard the entry point with if __name__ == "__main__": — spawn and forkserver workers import your main script as __mp_main__.',
    'Work functions must be top-level (use functools.partial for extra arguments); files, locks, generators and lambdas cannot be sent.',
    'Start-up and pickling cost real time: use coarse tasks, a sensible chunksize, small inputs and outputs, and reuse one pool.',
    'Defaults in 3.14: spawn on Windows and macOS, forkserver on other POSIX systems (Linux used fork before 3.14).',
    'Use processes for CPU-bound Python work; threads or asyncio for waiting; measure the speed-up.',
  ],
}
