// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// A deterministic stand-in for real threads (which cannot start in the browser sandbox).
const SIMTHREADS = py`"""A tiny, deterministic thread simulator - SIMPLIFIED, for learning only.

Real threads are paused and resumed by the operating system at moments you
cannot predict. Here every "thread" is a generator: each \`yield\` marks a
point where a switch may happen, and a schedule decides who runs next, so
the same interleaving happens on every run.
"""
from collections import deque

_current = None


def current_thread():
    """Name of the simulated thread that is running right now."""
    return _current


class Lock:
    """Simulated threading.Lock: at most one thread holds it at a time."""

    def __init__(self, name="lock"):
        self.name = name
        self.owner = None

    def acquire(self):
        # A real acquire() blocks; a simulated thread waits by giving up its turn.
        while self.owner is not None:
            yield f"waiting for {self.name}"
        self.owner = current_thread()
        yield f"acquired {self.name}"

    def release(self):
        if self.owner is None:
            raise RuntimeError("release unlocked lock")
        self.owner = None


def run(threads, schedule=(), verbose=True):
    """Run simulated threads ({name: generator}) until they all finish.

    Names in \`schedule\` get the first turns, one step each; after that the
    threads take turns round-robin. Returns "finished", or "deadlock" when
    every remaining thread is stuck waiting for a lock.
    """
    global _current
    live = dict(threads)
    turns = deque(schedule)
    ring = deque(threads)
    waits_in_a_row = 0
    while live:
        if turns:
            name = turns.popleft()
            if name not in live:
                continue
        else:
            name = ring[0]
            ring.rotate(-1)
        _current = name
        try:
            step = next(live[name])
        except StopIteration:
            del live[name]
            ring.remove(name)
            waits_in_a_row = 0
            continue
        finally:
            _current = None
        if verbose:
            print(f"  {name}: {step}")
        if step.startswith("waiting") and not turns:
            waits_in_a_row += 1
            if waits_in_a_row >= len(live):
                print(f"  DEADLOCK: {', '.join(live)} can never get the lock they need")
                return "deadlock"
        else:
            waits_in_a_row = 0
    return "finished"
`

const TICKETS = py`from simthreads import Lock, run

tickets_sold = 0
ticket_lock = Lock("ticket_lock")


def sell_unsafe():
    """tickets_sold += 1, split into the three steps the CPU really does."""
    global tickets_sold
    value = tickets_sold              # 1. read the shared value
    yield f"read {value}"
    value = value + 1                 # 2. add 1 to a private copy
    yield f"add 1 -> {value}"
    tickets_sold = value              # 3. write the copy back
    yield f"write {value}"


def sell_safe():
    """The same three steps, done only while holding the lock."""
    global tickets_sold
    yield from ticket_lock.acquire()
    value = tickets_sold
    yield f"read {value}"
    value = value + 1
    yield f"add 1 -> {value}"
    tickets_sold = value
    yield f"write {value}"
    ticket_lock.release()


# The "operating system" switches threads after every step.
SCHEDULE = ["A", "B", "A", "B", "A", "B"]

print("Without a lock:")
tickets_sold = 0
run({"A": sell_unsafe(), "B": sell_unsafe()}, SCHEDULE)
unsafe_total = tickets_sold
print(f"tickets_sold = {unsafe_total} (expected 2)")

print("With a lock:")
tickets_sold = 0
run({"A": sell_safe(), "B": sell_safe()}, SCHEDULE)
safe_total = tickets_sold
print(f"tickets_sold = {safe_total} (expected 2)")
`

const BANK_STARTER = py`from simthreads import Lock, run


class Account:
    def __init__(self, number, balance):
        self.number = number                  # unique account number
        self.balance = balance
        self.lock = Lock(f"lock-{number}")


def transfer(source, target, amount):
    """A simulated thread that moves money from source to target."""
    # TODO: the locks are taken in argument order, so two transfers in
    # opposite directions can deadlock. Always lock the LOWER number first.
    first, second = source, target
    yield from first.lock.acquire()
    yield from second.lock.acquire()
    source.balance -= amount
    target.balance += amount
    yield f"moved {amount} from {source.number} to {target.number}"
    second.lock.release()
    first.lock.release()


alice = Account(1001, 100)
bob = Account(1002, 50)
status = run(
    {"T1": transfer(alice, bob, 30), "T2": transfer(bob, alice, 10)},
    schedule=["T1", "T2"],
)
print(status, alice.balance, bob.balance)
`

const BANK_SOLUTION = py`from simthreads import Lock, run


class Account:
    def __init__(self, number, balance):
        self.number = number                  # unique account number
        self.balance = balance
        self.lock = Lock(f"lock-{number}")


def transfer(source, target, amount):
    """A simulated thread that moves money from source to target."""
    # One global order for every lock: the lower account number first.
    first, second = sorted((source, target), key=lambda account: account.number)
    yield from first.lock.acquire()
    yield from second.lock.acquire()
    source.balance -= amount
    target.balance += amount
    yield f"moved {amount} from {source.number} to {target.number}"
    second.lock.release()
    first.lock.release()


alice = Account(1001, 100)
bob = Account(1002, 50)
status = run(
    {"T1": transfer(alice, bob, 30), "T2": transfer(bob, alice, 10)},
    schedule=["T1", "T2"],
)
print(status, alice.balance, bob.balance)
`

export default {
  id: 'threading',
  title: 'Threads, locks & race conditions',
  summary: 'Threads run several flows of work inside one program and share its memory — great for overlapping waits, dangerous for shared data unless you use locks, queues and thread pools.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['concurrency-concepts', 'context-managers', 'generators'],
  related: ['multiprocessing', 'asyncio-basics', 'asyncio-in-practice', 'choosing-concurrency', 'gil-and-free-threading', 'context-managers', 'generators', 'debugging', 'logging'],
  tags: ['threading', 'threads', 'Thread', 'start', 'join', 'daemon', 'race condition', 'lost update', 'Lock', 'RLock', 'mutex', 'deadlock', 'lock ordering', 'queue', 'producer consumer', 'ThreadPoolExecutor', 'futures', 'thread safety', 'GIL'],
  apis: [
    { name: 'threading.Thread(target, args, name, daemon)', summary: 'Creates a thread object that will call target(*args) once start() is called.' },
    { name: 'Thread.start() / Thread.join(timeout=None)', summary: 'start() begins running the thread (only once); join() waits until it finishes.' },
    { name: 'threading.Lock()', summary: 'A mutual-exclusion lock: acquire()/release(), or use it in a with statement. Not re-entrant.' },
    { name: 'threading.RLock()', summary: 'A re-entrant lock: the thread that holds it may acquire it again (it must release it as many times).' },
    { name: 'threading.Event()', summary: 'A flag threads can wait() on until another thread calls set(); handy for stop signals.' },
    { name: 'threading.Semaphore(n)', summary: 'Lets at most n threads past acquire() at the same time.' },
    { name: 'queue.Queue(maxsize=0)', summary: 'A thread-safe FIFO queue: put() / get() block when full / empty; task_done() + join() track finished work.' },
    { name: 'concurrent.futures.ThreadPoolExecutor(max_workers)', summary: 'A pool of reusable worker threads; submit() returns a Future, map() returns results in input order.' },
    { name: 'Future.result(timeout=None)', summary: 'Waits for the call to finish and returns its value — or re-raises the exception it raised.' },
    { name: 'concurrent.futures.as_completed(futures)', summary: 'Yields futures in the order they finish.' },
    { name: 'threading.local()', summary: 'An object whose attributes are separate for every thread.' },
  ],
  docs: [
    { label: 'threading — thread-based parallelism', url: 'https://docs.python.org/3/library/threading.html' },
    { label: 'queue — a synchronized queue class', url: 'https://docs.python.org/3/library/queue.html' },
    { label: 'concurrent.futures — launching parallel tasks', url: 'https://docs.python.org/3/library/concurrent.futures.html' },
    { label: 'HOWTO — Python support for free threading', url: 'https://docs.python.org/3/howto/free-threading-python.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **thread** is a separate flow of execution *inside* your program. Your script always starts with one thread — the *main thread*. With the \`threading\` module you can start more, and each one runs its own function while the others keep going.`,
    py`All threads of one program share the same memory: the same variables, lists and dicts. That's the superpower *and* the danger. Sharing means no copying — but when two threads change the same data at the same time, updates can get lost. That bug is called a **race condition**, and the main tool against it is a **lock**.`,
    py`This lesson covers the whole toolbox: starting and joining threads, daemon threads, races and locks, deadlocks, thread-safe queues for handing work between threads, and \`ThreadPoolExecutor\`, the high-level tool you will use most. It builds on [concurrency vs parallelism & the GIL](lesson:concurrency-concepts).`,
    { callout: 'warn', title: 'Threads cannot start in this browser sandbox', text: py`The playground runs Python on a single WebAssembly thread, so \`Thread.start()\` and \`ThreadPoolExecutor\` raise \`RuntimeError: can't start new thread\` here. Real threading code in this lesson is marked **run it on your own computer**; its output is described as *typical*, because thread timing changes from run to run. The runnable playground uses a clearly labelled **simulation** that makes thread switches visible and repeatable.` },
  ],
  why: [
    py`**Overlapping waits with ordinary libraries.** Most Python libraries are *blocking*: \`requests.get()\`, a database query, \`open().read()\` stop your code until the answer arrives. Run 20 of those in 20 threads and the waits overlap — the whole batch takes roughly as long as the slowest call instead of the sum of all of them. No need to rewrite anything as \`async\`.`,
    py`**Responsiveness.** A desktop app can save a file or talk to a server in a background thread while the main thread keeps the window responsive.`,
    py`**Background chores.** Flushing logs, sending metrics, refreshing a cache every minute — small jobs that run alongside the main work.`,
    py`**It is everywhere under the hood.** Web servers handle requests in thread pools, \`asyncio.to_thread()\` runs blocking calls in threads, and database drivers keep connection pools for threads. Knowing how races and locks work lets you read and debug all of that.`,
  ],
  eli15: [
    py`Imagine you and a friend are counting ticket sales on one whiteboard. Each time you sell a ticket you: **look** at the number, **add one** in your head, and **write** the new number.`,
    py`Now picture this: the board says 5. You look — 5. Before you can write, your friend also looks — still 5. You write 6. Your friend writes 6. Two tickets were sold, but the board only went up by one. Nobody did anything "wrong"; the problem is the *timing*. That is a **race condition**.`,
    py`The fix: there is only **one marker pen**, and you may only touch the board while holding it. You take the pen, look, add, write, and hand the pen over. Now your friend can't sneak in between your look and your write. In Python that pen is a **lock**.`,
    py`Threads are like those friends: they all share the same board (the program's memory), and the computer can switch between them at any moment — even in the middle of "look, add, write".`,
  ],
  analogy: {
    title: 'A shared whiteboard and a single marker',
    body: [
      py`A team works in one office with one whiteboard. Everybody can read and write it, so nobody needs copies — that's a thread's **shared memory**. Things go wrong when two people update the same number at the same time.`,
      py`The team's rule: whoever holds **the marker** may change the board; everyone else waits for it. Updates get slower (people queue for the marker) but never collide — that's a **lock**. Keep the marker only as long as needed, and always give it back, even if your phone rings mid-update (that's what \`with lock:\` guarantees).`,
      py`And if two boards each have their own marker, and Ada holds marker A waiting for marker B while Ben holds B waiting for A, both wait forever. That's a **deadlock**. The cure is a house rule: always pick up marker A before marker B.`,
    ],
    mapping: [
      ['people in the office', 'threads in one process'],
      ['the shared whiteboard', 'shared memory: globals, lists, dicts, objects'],
      ['look, add, write', 'a read-modify-write such as count += 1'],
      ['two people writing the same number', 'a race condition (lost update)'],
      ['the single marker', 'a threading.Lock'],
      ['an in-tray of jobs', 'a queue.Queue between producer and consumer threads'],
      ['two people each holding the marker the other needs', 'a deadlock'],
    ],
  },
  visual: {
    type: 'concurrency',
    title: 'A lost update, then the same race with a lock',
    props: { preset: 'race-condition' },
    alt: 'Two threads both run count += 1. Without a lock, thread 1 reads 0, thread 2 also reads 0, both add one and both write 1, so one increment is lost. With a lock, thread 1 acquires it, reads, adds and writes 1 while thread 2 waits; then thread 2 acquires the lock, reads the fresh value 1 and writes 2.',
    caption: py`Press ▶. The danger zone is the gap between **read** and **write**. A lock doesn't make anything faster — it makes the read-add-write behave as one indivisible step for every thread that uses the same lock.`,
  },
  syntax: [
    py`#### Start and join threads`,
    { code: py`import threading
import time


def download(page):
    print(f"start {page}")
    time.sleep(1)                     # stands in for a slow network call
    print(f"done  {page}")


threads = [threading.Thread(target=download, args=(page,)) for page in ("news", "weather", "scores")]
for thread in threads:
    thread.start()                    # begins download(page) in a new thread
for thread in threads:
    thread.join()                     # wait until that thread has finished
print("all downloads finished")`, lang: 'python', title: 'run it on your own computer', static: true },
    py`Typical output: the three \`start\` lines first, then the three \`done\` lines in an order that can change between runs, and the whole thing takes about 1 second instead of 3, because the threads wait at the same time. Rules worth memorising:`,
    py`- pass the function itself: \`target=download\`, and its arguments separately: \`args=(page,)\` — note the comma, it must be a tuple;
- \`start()\` can be called **once** per Thread object; create a new Thread to run again;
- \`join()\` blocks until the thread ends; \`join(timeout=2)\` waits at most 2 seconds (check \`thread.is_alive()\` afterwards);
- an exception inside a thread is printed (\`Exception in thread …\`) but **does not** reach the code that called \`join()\`.`,
    py`#### Daemon threads`,
    { code: py`import threading
import time


def heartbeat():
    while True:
        print("still alive")
        time.sleep(1)


threading.Thread(target=heartbeat, daemon=True).start()
time.sleep(2.5)
print("main is done")   # the program exits; the daemon thread is stopped abruptly`, lang: 'python', title: 'daemon=True (run locally)', static: true },
    py`When the main thread finishes, Python waits for every **non-daemon** thread before exiting. **Daemon** threads are killed when the program exits — no \`finally\` blocks, no flushing files. Use them only for background helpers whose work may be lost; for anything that must finish cleanly, use a normal thread and tell it to stop (an \`Event\` or a sentinel value).`,
    py`#### Locks: \`with lock:\``,
    { code: py`import threading

balance = 0
balance_lock = threading.Lock()


def deposit(amount):
    global balance
    with balance_lock:          # acquire ... always released, even on an exception
        balance += amount       # the whole read-modify-write is protected`, lang: 'python', title: 'protect every read-modify-write of shared data', static: true },
    py`Every thread that touches \`balance\` must use the **same** lock. \`with\` calls \`acquire()\` on entry and \`release()\` on exit (see [context managers](lesson:context-managers)). A plain \`Lock\` is **not re-entrant**: if a thread that holds it calls \`acquire()\` again, it waits for itself forever. \`threading.RLock\` allows re-acquiring by the same thread.`,
    py`#### Hand work over with a queue`,
    { code: py`import queue
import threading

orders = queue.Queue(maxsize=10)      # bounded: put() waits while the queue is full
STOP = None                           # sentinel meaning "no more work"


def cook(name):
    while True:
        order = orders.get()          # waits until an item is available
        if order is STOP:
            orders.task_done()
            break
        print(f"{name} cooks {order}")
        orders.task_done()            # tell the queue this item is finished


cooks = [threading.Thread(target=cook, args=(f"cook-{i}",)) for i in range(3)]
for c in cooks:
    c.start()
for order in ["pizza", "pasta", "salad", "soup", "curry"]:
    orders.put(order)
for _ in cooks:
    orders.put(STOP)                  # one sentinel per consumer
orders.join()                         # waits until every item got task_done()
for c in cooks:
    c.join()`, lang: 'python', title: 'producer / consumer (run locally)', static: true },
    py`\`queue.Queue\` does its own locking, so threads can share it safely. The *producer* (main thread) puts work in; *consumers* take it out. Passing data through a queue instead of sharing variables is the single best way to avoid races.`,
    { callout: 'version', title: '3.13+: Queue.shutdown()', text: py`Since Python 3.13, \`orders.shutdown()\` closes a queue: further \`put()\` calls raise \`queue.ShutDown\`, and \`get()\` raises it once the queue is empty, so consumers can stop without sentinels. Sentinels still work everywhere.` },
    py`#### Thread pools: the tool you'll use most`,
    { code: py`from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request

URLS = ["https://www.python.org", "https://docs.python.org/3/", "https://peps.python.org"]


def fetch(url):
    with urllib.request.urlopen(url, timeout=10) as response:
        return len(response.read())


with ThreadPoolExecutor(max_workers=8) as pool:
    sizes = list(pool.map(fetch, URLS))            # results in INPUT order
print(sizes)

with ThreadPoolExecutor(max_workers=8) as pool:
    futures = {pool.submit(fetch, url): url for url in URLS}
    for future in as_completed(futures):           # results as they FINISH
        url = futures[future]
        try:
            print(url, future.result())            # re-raises the worker's exception
        except OSError as error:
            print(url, "failed:", error)`, lang: 'python', title: 'ThreadPoolExecutor (run locally)', static: true },
    py`A **pool** keeps a fixed number of worker threads and feeds them tasks, so you never create thousands of threads. \`submit()\` returns a **Future** — a placeholder for a result that isn't ready yet; \`future.result()\` waits for it and re-raises any exception from the worker. Leaving the \`with\` block waits for all submitted work to finish.`,
  ],
  walkthrough: {
    title: 'Reading the ticket-sales simulation',
    lang: 'python',
    code: TICKETS,
    intro: py`This is \`main.py\` from the playground (press **Guide** there to step through it in the editor). Real threads can't start in the browser, so each "thread" is a [generator](lesson:generators): every \`yield\` is a moment where the "operating system" (\`simthreads.run\`) may switch to another thread. This is a **simplified simulation** — real switches are unpredictable, here they follow \`SCHEDULE\`.`,
    steps: [
      { lines: [1, 4], text: py`\`tickets_sold\` is shared by every thread. \`ticket_lock\` is a simulated \`threading.Lock\` from the helper module \`simthreads.py\` (open it in the file tabs — it's short).` },
      { lines: [7, 15], text: py`\`tickets_sold += 1\` written out as the three steps the computer really performs: **read** into a private \`value\`, **add**, **write** back. Each \`yield\` reports what just happened and lets another thread run.` },
      { lines: [18, 28], text: py`The safe version does the same steps, but only after \`yield from ticket_lock.acquire()\` succeeded, and it releases the lock at the end. In real code this whole function body would be \`with ticket_lock: tickets_sold += 1\`.` },
      { lines: [31, 32], text: py`The schedule: A, B, A, B… — a switch after every single step. Real operating systems switch at unpredictable moments; a fixed schedule makes the worst case repeatable.` },
      { lines: [34, 38], text: py`Without a lock: A reads 0, B reads 0, both add 1, both write 1. Two sales, one recorded — a **lost update**.` },
      { lines: [40, 44], text: py`With the lock: B asks for the lock while A holds it and has to wait. When A releases it, B reads the *fresh* value 1 and writes 2. Correct, at the cost of B waiting.` },
    ],
  },
  playground: {
    title: 'Ticket sales: a race and a lock (simulated)',
    objective: 'Run it, follow the interleaved steps, then change the schedule, add a seller and break the lock on purpose.',
    files: { 'main.py': TICKETS, 'simthreads.py': SIMTHREADS },
    expected: py`The two runs side by side:

\`\`\`text
Without a lock:
  A: read 0
  B: read 0
  A: add 1 -> 1
  B: add 1 -> 1
  A: write 1
  B: write 1
tickets_sold = 1 (expected 2)
With a lock:
  A: acquired ticket_lock
  B: waiting for ticket_lock
  ...
  B: write 2
tickets_sold = 2 (expected 2)
\`\`\`

This is a **simulation**: the "threads" are generators and the switches follow \`SCHEDULE\`, so you get the same interleaving every time. Real threads interleave unpredictably — which is exactly why real races are so hard to reproduce.`,
    experiments: [
      {
        id: 'lucky-timing',
        task: py`Change \`SCHEDULE\` to \`["A", "A", "A", "B", "B", "B"]\` — thread A gets to finish all its steps before B starts. Predict the unsafe total before you run it.`,
        hint: py`Only the \`SCHEDULE = [...]\` line changes.`,
        tests: [{ name: 'the unlocked version now counts both sales', code: py`assert unsafe_total == 2, 'With A running to completion first, no update should be lost'` }],
        explain: py`With this timing there is no overlap, so the unlocked code gives the right answer. That's what makes races nasty: the same buggy code passes most test runs and fails only when the switch lands between a read and a write — often under production load. You can't fix a race by "being lucky with timing"; you fix it with a lock (or by not sharing).`,
      },
      {
        id: 'third-seller',
        task: py`Add a third seller \`"C"\` to **both** runs (\`"C": sell_unsafe()\` and \`"C": sell_safe()\`) and make the schedule rotate through all three: \`["A", "B", "C"] * 3\`. Predict both totals.`,
        hint: py`Each \`run({...}, SCHEDULE)\` call gets a third entry, and \`SCHEDULE = ["A", "B", "C"] * 3\`. Also update the "(expected 2)" texts if you like.`,
        tests: [
          { name: 'the locked version counts all three sales', code: py`assert safe_total == 3` },
          { name: 'thread C really ran', code: py`assert "C: read" in output` },
        ],
        explain: py`All three unlocked threads read 0 before anyone writes, so two of the three sales vanish (total 1). With the lock, threads queue up for it and every sale counts. The more threads hit the same data, the more updates a race can lose.`,
      },
      {
        id: 'forget-release',
        task: py`In \`sell_safe\`, delete the last line, \`ticket_lock.release()\`. Run it and read the end of the output.`,
        hint: py`Only the \`ticket_lock.release()\` line inside \`sell_safe\` goes.`,
        tests: [{ name: 'the simulator reports that B is stuck forever', code: py`assert "DEADLOCK" in output` }],
        explain: py`A finishes while still "holding" the lock, so B waits forever. A real program would simply **hang** — no error, no message — the hardest kind of bug to diagnose. This is why real code uses \`with lock:\`: the lock is released when the block ends, even if an exception jumps out of the middle. Put the line back afterwards.`,
      },
      {
        id: 'read-outside-lock',
        task: py`Make the "safe" version unsafe again, on purpose: in \`sell_safe\`, move the two lines \`value = tickets_sold\` and \`yield f"read {value}"\` **above** \`yield from ticket_lock.acquire()\`. Predict the locked total.`,
        hint: py`The function should start with \`global tickets_sold\`, then \`value = tickets_sold\`, \`yield f"read {value}"\`, and only then \`yield from ticket_lock.acquire()\`.`,
        tests: [{ name: 'the "locked" version now loses an update too', code: py`assert safe_total < 2, 'Read tickets_sold before acquiring the lock'` }],
        explain: py`Both threads read 0 *before* taking the lock, so the lock only serialises two writes of a stale value. A lock protects exactly the code inside it — the read, the computation and the write of a shared value must **all** be inside the same critical section.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How a deadlock happens — and how lock ordering prevents it',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 't1', label: 'Thread 1', note: 'transfer(alice → bob)', x: 120, y: 80, tone: 'yellow' },
        { id: 't2', label: 'Thread 2', note: 'transfer(bob → alice)', x: 120, y: 240, tone: 'yellow' },
        { id: 'la', label: 'lock A', note: "alice's account", x: 560, y: 80, tone: 'blue' },
        { id: 'lb', label: 'lock B', note: "bob's account", x: 560, y: 240, tone: 'blue' },
      ],
      edges: [
        { id: 't1-holds-a', from: 't1', to: 'la', label: 'holds' },
        { id: 't2-holds-b', from: 't2', to: 'lb', label: 'holds' },
        { id: 't1-wants-b', from: 't1', to: 'lb', label: 'waits for', dashed: true },
        { id: 't2-wants-a', from: 't2', to: 'la', label: 'waits for', dashed: true },
        { id: 't2-waits-a-first', from: 't2', to: 'la', label: 'waits for A first', dashed: true },
      ],
      steps: [
        { focus: ['t1', 't2'], text: py`Two threads each move money between the same two accounts, in opposite directions. Each transfer must lock **both** accounts so no one sees a half-finished transfer.` },
        { focus: ['t1', 'la'], edges: ['t1-holds-a'], text: py`Thread 1 locks its *source* first: lock A (alice).` },
        { focus: ['t2', 'lb'], edges: ['t1-holds-a', 't2-holds-b'], text: py`Before it can take the second lock, the OS switches. Thread 2 also locks *its* source first: lock B (bob).` },
        { focus: ['t1', 't2', 'la', 'lb'], edges: ['t1-holds-a', 't2-holds-b', 't1-wants-b', 't2-wants-a'], text: py`Now Thread 1 waits for B, which Thread 2 holds, and Thread 2 waits for A, which Thread 1 holds. A **circular wait**: neither can ever continue. The program hangs with no error — a **deadlock**.` },
        { focus: ['t1', 'la', 'lb'], edges: ['t1-holds-a'], text: py`The fix: one **global lock order**. Both threads always lock the account with the lower number first — here A, then B — no matter which way the money flows.` },
        { focus: ['t2', 'la'], edges: ['t1-holds-a', 't2-waits-a-first'], text: py`Thread 2 now asks for A first, finds it taken and waits *without holding anything*. Thread 1 takes B, finishes, releases both — then Thread 2 proceeds. No cycle is possible, so no deadlock. You'll implement exactly this in the second exercise.` },
      ],
    },
    alt: 'Diagram with two threads on the left and two locks, A and B, on the right. Thread 1 holds lock A, thread 2 holds lock B, then thread 1 waits for B and thread 2 waits for A, forming a cycle: a deadlock. In the fix, both threads request lock A first, so thread 2 waits for A while holding nothing and thread 1 can finish.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Each thread has its own **call stack** — its own chain of function calls and local variables — but all threads share the **heap**: every object, global variable and module. That's why two threads can both see \`tickets_sold\`, and also why one thread's local \`value\` is invisible to the others.`,
      py`The operating system decides which thread runs when. It can pause a thread at almost any moment (this is called **pre-emptive** scheduling), so between two lines of your code — or even in the middle of one line — another thread may run and change shared data.`,
      py`\`count += 1\` looks like one action but is really *read, add, write*. A **race condition** happens when the result depends on how those steps of different threads interleave. A **lock** (also called a *mutex*, from "mutual exclusion") makes a group of steps indivisible for every thread that uses it: only one thread at a time may be inside a \`with lock:\` block.`,
    ],
    technical: [
      py`#### Where switches can happen`,
      py`In standard CPython, a thread must hold the **GIL** to run Python bytecode (see [concurrency concepts](lesson:concurrency-concepts)). The running thread gives it up when it blocks (I/O, \`time.sleep\`, waiting on a lock) and when another thread has waited longer than the *switch interval* (\`sys.getswitchinterval()\`, 0.005 s by default). Switches happen **between bytecode instructions**, and \`count += 1\` is several instructions — so a switch can land between the read and the write.`,
      { callout: 'note', title: 'CPython detail', text: py`Exactly *which* bytecode boundaries CPython checks for a pending switch has changed between versions, so a tiny \`count += 1\` demo may lose updates often on one version and rarely on another. Never treat "my test didn't lose anything" as proof of safety. On the free-threaded build (officially supported, not the default, in 3.14 — see [the GIL & free threading](lesson:gil-and-free-threading)) threads truly run at the same time and races show up *more* often.` },
      py`#### How a lock works`,
      py`\`threading.Lock\` wraps an operating-system lock. \`acquire()\` atomically checks "free?" and marks it "taken" in one indivisible operation; if it's taken, the thread sleeps (releasing the GIL) until \`release()\` wakes it. \`acquire(timeout=0.5)\` gives up after 0.5 s and returns \`False\`; \`acquire(blocking=False)\` returns immediately. An \`RLock\` additionally remembers its owner thread and a counter, so the owner can re-acquire it.`,
      py`#### Thread safety of built-in types`,
      { callout: 'note', title: 'CPython detail', text: py`In CPython, a *single* operation on a built-in container — \`list.append\`, \`dict[key] = value\`, \`set.add\`, \`list.pop\` — will not corrupt the object when threads run it concurrently: with the GIL it executes without interruption (as long as it doesn't call back into Python code such as a custom \`__eq__\` or \`__hash__\`), and the free-threaded build protects built-in types with internal per-object locks. The docs describe this as the current implementation's behaviour, not a language guarantee. What the docs *do* promise: \`queue.Queue\` is thread-safe, and \`collections.deque\` supports thread-safe appends and pops from either end.` },
      py`What is **never** safe without a lock: any *sequence* of operations whose result depends on the state staying the same in between — \`count += 1\`, \`if key not in cache: cache[key] = load()\` (check-then-act), \`items[i] = items[i] + 1\`, or iterating over a dict while another thread inserts into it (\`RuntimeError: dictionary changed size during iteration\`).`,
      py`#### Futures and pools`,
      py`\`ThreadPoolExecutor\` keeps an internal work queue and a set of worker threads that loop: take a work item, run it, store the result (or exception) on its \`Future\`. \`Future.result()\` waits on a condition variable until the result is set. Workers are started lazily as work arrives, up to \`max_workers\`; the default is \`min(32, CPU count + 4)\`, a size aimed at I/O-bound work.`,
    ],
    production: [
      py`**Prefer pools to raw threads.** \`ThreadPoolExecutor\` bounds the number of threads, reuses them, and turns worker exceptions into \`future.result()\` exceptions instead of a line on stderr. Size it for the resource you're waiting on (a database pool of 10 connections doesn't benefit from 100 threads).`,
      py`**Share less.** The safest shared state is none: give each task its inputs, let it return its result, and merge in one place (you'll write this pattern in the interview coding question). When threads must communicate, use \`queue.Queue\`. When they must share an object, wrap every access in one lock and keep the critical section short — never do slow I/O while holding a lock unless that's the point.`,
      py`**Set timeouts on every blocking call** — network calls, \`queue.get(timeout=…)\`, \`future.result(timeout=…)\`, \`lock.acquire(timeout=…)\` — so a stuck dependency produces an error instead of a silent hang.`,
      py`**Name your threads and log them.** \`Thread(name="uploader")\` and a log format containing \`%(threadName)s\` make interleaved logs readable; the \`logging\` module is thread-safe ([logging](lesson:logging)). For a hang, \`faulthandler.dump_traceback_later(30)\` or a sampling profiler such as \`py-spy dump --pid …\` shows what every thread is waiting on.`,
      py`**Know the limits.** On standard CPython, threads don't speed up pure-Python CPU work — use [processes](lesson:multiprocessing). For thousands of concurrent connections, [asyncio](lesson:asyncio-basics) is lighter than thousands of threads. [Choosing a concurrency model](lesson:choosing-concurrency) puts it all together.`,
    ],
  },
  mistakes: [
    {
      title: 'Calling the function instead of passing it as target',
      wrong: { code: py`import threading

def download(url):
    print("downloading", url)

for url in ["a.example", "b.example"]:
    threading.Thread(target=download(url)).start()   # runs download NOW, in the main thread`, lang: 'python', static: true },
      right: { code: py`import threading

def download(url):
    print("downloading", url)

for url in ["a.example", "b.example"]:
    threading.Thread(target=download, args=(url,)).start()`, lang: 'python', static: true },
      explanation: py`\`download(url)\` is evaluated immediately, in the main thread, and its return value (\`None\`) becomes the target — so the threads do nothing and the downloads run one after another. Pass the function object and put its arguments in \`args\` (a tuple: \`(url,)\`, with the comma).`,
    },
    {
      title: 'Check-then-act split across two critical sections',
      wrong: { code: py`def buy_ticket(event):
    with stock_lock:
        available = stock[event] > 0
    if available:                 # another thread can buy the last ticket right here
        with stock_lock:
            stock[event] -= 1`, lang: 'python', static: true },
      right: { code: py`def buy_ticket(event):
    with stock_lock:              # check AND act under one acquisition
        if stock[event] <= 0:
            return False
        stock[event] -= 1
        return True`, lang: 'python', static: true },
      explanation: py`Locking each line separately isn't enough: the lock is released between the check and the update, so two buyers can both see "1 left" and both buy it. Decisions and the updates they lead to belong in one critical section.`,
    },
    {
      title: 'acquire() without a guaranteed release()',
      wrong: { code: py`lock.acquire()
total = compute_total(cart)      # if this raises, the lock is never released
lock.release()`, lang: 'python', static: true },
      right: { code: py`with lock:
    total = compute_total(cart)`, lang: 'python', static: true },
      explanation: py`An exception between \`acquire()\` and \`release()\` leaves the lock held forever, and every other thread that needs it hangs. \`with lock:\` releases it no matter how the block exits (the long form is \`try:\` / \`finally: lock.release()\`).`,
    },
    {
      title: 'Taking two locks in different orders',
      wrong: { code: py`def transfer(source, target, amount):
    with source.lock:            # thread 1 locks alice, thread 2 locks bob...
        with target.lock:        # ...then each waits for the other: deadlock
            source.balance -= amount
            target.balance += amount`, lang: 'python', static: true },
      right: { code: py`def transfer(source, target, amount):
    first, second = sorted((source, target), key=lambda account: account.number)
    with first.lock:
        with second.lock:
            source.balance -= amount
            target.balance += amount`, lang: 'python', static: true },
      explanation: py`A deadlock needs a cycle of threads each holding a lock the next one wants. If every thread acquires locks in one global order (by account number, by \`id()\`, by a fixed ranking), a cycle can't form.`,
    },
    {
      title: 'One thread per item',
      wrong: { code: py`threads = [threading.Thread(target=fetch, args=(url,)) for url in urls]   # 50,000 threads
for t in threads:
    t.start()`, lang: 'python', static: true },
      right: { code: py`from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=20) as pool:
    pages = list(pool.map(fetch, urls))`, lang: 'python', static: true },
      explanation: py`Every thread costs memory for its stack and OS bookkeeping, and the OS has a limit (\`RuntimeError: can't start new thread\`). It also hammers the server you're calling. A pool caps concurrency at a number you choose and reuses threads.`,
    },
  ],
  debugging: [
    {
      symptom: py`RuntimeError: can't start new thread`,
      cause: py`In this browser sandbox: threads are not available at all. On a real machine: the process hit an OS limit, usually by creating one thread per item.`,
      fix: py`Run threading examples locally. In real code use a bounded \`ThreadPoolExecutor(max_workers=…)\`.`,
    },
    {
      symptom: py`RuntimeError: threads can only be started once`,
      cause: py`\`start()\` was called twice on the same \`Thread\` object (often in a retry loop).`,
      fix: py`Create a new \`Thread\` for every run — or submit the function to a pool again.`,
    },
    {
      symptom: py`RuntimeError: release unlocked lock`,
      cause: py`\`release()\` was called on a lock that isn't held — for example two code paths both release it, or it was never acquired.`,
      fix: py`Replace manual \`acquire()\`/\`release()\` pairs with \`with lock:\`.`,
    },
    {
      symptom: py`The program prints everything but never exits (or hangs halfway, CPU idle).`,
      cause: py`A non-daemon thread is still blocked — typically a consumer waiting in \`queue.get()\` for work that will never come, or two threads in a deadlock.`,
      fix: py`Send one sentinel per consumer (or call \`Queue.shutdown()\` on 3.13+), add timeouts, and dump all thread stacks (\`faulthandler.dump_traceback()\`, \`py-spy dump\`) to see who is waiting for what.`,
    },
    {
      symptom: py`Exception in thread Thread-1 (worker): … followed by a traceback, but the main program carries on as if nothing happened.`,
      cause: py`An exception raised in a \`Thread\`'s target is reported by \`threading.excepthook\` and then the thread dies; it never reaches the thread that called \`join()\`.`,
      fix: py`Use \`ThreadPoolExecutor\` and call \`future.result()\` (it re-raises), or catch exceptions inside the target and put them on a queue.`,
    },
    {
      symptom: py`RuntimeError: dictionary changed size during iteration — only under load, in a multithreaded program.`,
      cause: py`One thread iterates over a shared dict while another inserts or deletes keys.`,
      fix: py`Take the lock for both the writes and the iteration, or iterate over a snapshot taken under the lock: \`with lock: items = list(cache.items())\`.`,
    },
  ],
  bestPractices: [
    'Reach for ThreadPoolExecutor before raw Thread objects; bound max_workers to what the downstream resource can handle.',
    'Avoid shared mutable state: pass inputs in, return results, merge in one place — or hand data over through queue.Queue.',
    'Protect every read-modify-write and check-then-act on shared data with one lock, using with lock:.',
    'Keep critical sections short and never call unknown or slow code while holding a lock.',
    'When you need several locks, always acquire them in one global order.',
    'Give every blocking call a timeout, and stop worker threads explicitly (sentinels, Event, Queue.shutdown()).',
    'Use daemon threads only for work that may be lost when the program exits.',
    'Name threads and include %(threadName)s in log formats.',
  ],
  useCases: [
    'Calling many HTTP APIs or databases with blocking libraries (requests, most DB drivers) at the same time.',
    'Keeping a GUI responsive while a file is saved or uploaded in the background.',
    'A producer thread reading lines from a slow source while consumer threads process them.',
    'Background chores: periodic cache refresh, metrics flushing, heartbeats.',
    'Running blocking calls from async code (asyncio.to_thread uses a thread pool).',
  ],
  whenToUse: {
    use: [
      'The work is I/O-bound and your libraries are blocking (no async versions).',
      'You need tens to a few hundred concurrent waits, not tens of thousands.',
      'A program must stay responsive while something slow runs in the background.',
    ],
    avoid: [
      'Pure-Python CPU-bound work on standard CPython — use processes (or a GIL-releasing library).',
      'Tens of thousands of mostly idle connections — asyncio is much lighter.',
      'When a simple sequential loop is already fast enough: threads add a whole class of timing bugs.',
    ],
  },
  comparison: {
    title: 'Synchronisation tools in threading and queue',
    headers: ['Tool', 'What it does', 'Typical use'],
    rows: [
      ['Lock', 'one thread at a time inside with lock:', 'protecting a shared counter, dict or file'],
      ['RLock', 'like Lock, but the owning thread may re-acquire it', 'methods holding a lock that call other locked methods'],
      ['Semaphore(n)', 'at most n threads past acquire() at once', 'limiting concurrent connections to a service'],
      ['Event', 'a flag: wait() until another thread calls set()', 'stop signals, "data is ready" notifications'],
      ['Condition', 'wait() until notified while holding a lock', 'building custom queues or state machines'],
      ['queue.Queue', 'thread-safe FIFO with blocking put()/get()', 'producer / consumer pipelines, handing results back'],
    ],
    note: py`Start with \`Queue\` and \`Lock\`; they cover most real needs. \`asyncio\` has its own versions of these (\`asyncio.Lock\`, \`asyncio.Queue\`, …) for coroutines — see [asyncio in practice](lesson:asyncio-in-practice).`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'threading-q1',
      type: 'mcq',
      prompt: 'What does `thread.join()` do?',
      options: [
        { text: 'Starts the thread', why: 'start() starts it. join() is about waiting for the end.' },
        'Blocks the calling thread until `thread` has finished',
        { text: 'Merges the thread into the main thread so they share memory', why: 'Threads of one process always share memory; join() doesn’t change that.' },
        { text: 'Stops the thread immediately', why: 'Python has no safe way to kill a thread from outside; join() just waits.' },
      ],
      answer: 1,
      explanation: py`\`join()\` waits for the thread to end (optionally with a \`timeout\`). Without it, the main thread may read results before the workers have produced them.`,
    },
    {
      id: 'threading-q2',
      type: 'output',
      prompt: 'Two generator "threads" run `count += 1` as separate read and write steps, interleaved by hand. What is printed?',
      code: py`count = 0

def worker():
    global count
    value = count          # read
    yield                  # a thread switch happens here
    count = value + 1      # write

a, b = worker(), worker()
next(a)                    # A reads
next(b)                    # B reads
next(a, None)              # A writes
next(b, None)              # B writes
print(count)`,
      options: [
        { text: '2', why: 'Both workers read count while it was still 0, so both write 0 + 1.' },
        '1',
        { text: '0', why: 'Both writes do happen — they just write the same stale value.' },
        { text: 'StopIteration is raised', why: 'next(gen, None) returns None instead of raising when the generator finishes.' },
      ],
      answer: 1,
      explanation: py`A and B both read \`0\` before either writes. Each then writes \`0 + 1\`, so the final value is \`1\` — a lost update. Real threads do the same thing when the OS switches between the read and the write.`,
    },
    {
      id: 'threading-q3',
      type: 'bug',
      prompt: 'The downloads should run in three threads, but they run one after another in the main thread. Click the buggy line.',
      code: py`import threading

def download(url):
    print("downloading", url)

urls = ["a.example", "b.example", "c.example"]
threads = [threading.Thread(target=download(url)) for url in urls]
for t in threads:
    t.start()
for t in threads:
    t.join()`,
      answerLine: 7,
      explanation: py`\`target=download(url)\` *calls* \`download\` immediately and passes its return value, \`None\`, as the target. Write \`threading.Thread(target=download, args=(url,))\`.`,
    },
    {
      id: 'threading-q4',
      type: 'fill',
      prompt: 'Complete the code so that only one thread at a time can add to the shared basket.',
      code: py`import threading

basket = []
basket_lock = threading.___()

def add(item):
    ___ basket_lock:
        if item not in basket:
            basket.append(item)`,
      answer: [['Lock', 'RLock'], ['with']],
      explanation: py`\`threading.Lock()\` creates the lock and \`with basket_lock:\` holds it for the whole check-then-append, releasing it even if an exception occurs.`,
    },
    {
      id: 'threading-q5',
      type: 'mcq',
      prompt: 'Select **all** true statements about daemon threads.',
      options: [
        'The interpreter does not wait for daemon threads when the program exits.',
        { text: 'Daemon threads always run their finally blocks before the program exits.', why: 'They are stopped abruptly at exit — finally blocks and buffered writes may never run.' },
        'They suit background helpers whose work may be lost, like a heartbeat.',
        { text: 'A daemon thread runs in parallel even when the work is pure Python on standard CPython.', why: 'Daemon or not, a thread still needs the GIL to run Python bytecode.' },
      ],
      answer: [0, 2],
      explanation: py`\`daemon=True\` only changes what happens at exit: Python doesn't wait for the thread and kills it. Anything that must finish cleanly belongs in a normal thread that you stop with a signal and \`join()\`.`,
    },
    {
      id: 'threading-q6',
      type: 'mcq',
      prompt: 'Thread 1 takes `orders_lock` then `stock_lock`; thread 2 takes `stock_lock` then `orders_lock`. Sometimes the app freezes. What is the most reliable fix?',
      options: [
        { text: 'Add time.sleep(0.1) between the two acquisitions', why: 'Sleeping changes the timing, not the cycle — it makes the deadlock rarer or more frequent, never impossible.' },
        { text: 'Replace both locks with RLock', why: 'RLock only lets the *same* thread re-acquire; two different threads still wait for each other.' },
        'Make every thread acquire the two locks in the same order',
        { text: 'Run the threads as daemon threads', why: 'Daemon threads deadlock just the same; the program would only be killed at exit.' },
      ],
      answer: 2,
      explanation: py`A deadlock needs a cycle of waits. With one global acquisition order (always \`orders_lock\` before \`stock_lock\`), thread 2 can only wait for the *first* lock while holding nothing, so no cycle forms. Alternatives: use one lock for both, or \`acquire(timeout=…)\` and back off.`,
    },
    {
      id: 'threading-q7',
      type: 'short',
      prompt: 'Ten threads each count words in part of a file. Why is "each thread returns its own Counter and the main thread adds them up" usually better than "all threads update one shared Counter under a lock"?',
      answer: py`With per-thread results there is no shared mutable state during the work, so there's nothing to race on and no lock to forget or contend for. The threads never wait for each other; the merge happens once, in one thread, at the end. It's also easier to test (each piece is a pure function) and it works unchanged with a process pool, where shared memory doesn't exist. A shared Counter needs every update wrapped in the same lock, which serialises the threads at every update and is easy to get wrong.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'thread-safe-account',
      title: 'A thread-safe bank account',
      difficulty: 'intermediate',
      prompt: py`Write a \`BankAccount\` class that is safe to use from many threads, using a real \`threading.Lock\`:

- \`BankAccount(balance=0)\` stores the balance in \`self._balance\` and creates \`self._lock = threading.Lock()\`.
- \`deposit(amount)\` adds \`amount\` and **returns** the new balance.
- \`withdraw(amount)\` subtracts \`amount\` and **returns** the new balance — but raises \`ValueError\` if \`amount\` is larger than the current balance (the balance must stay unchanged).
- Both methods raise \`ValueError\` if \`amount <= 0\`.
- A read-only property \`balance\` returns the current balance.
- In \`deposit\` and \`withdraw\`, do all the work on \`self._balance\` — the check **and** the update — inside **one** \`with self._lock:\` block. Use \`self._balance\` (not the property) inside that block.

The sandbox can't start threads, so the tests swap \`self._lock\` for spy locks: one records every acquire/release, and one simulates **another thread withdrawing money at the exact moment your method acquires the lock**.`,
      files: {
        'main.py': py`import threading


class BankAccount:
    def __init__(self, balance=0):
        self._balance = balance
        self._lock = threading.Lock()

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        # TODO: validate amount, then update the balance inside the lock
        return self._balance

    def withdraw(self, amount):
        # TODO: check AND update inside one "with self._lock:" block
        return self._balance


account = BankAccount(100)
account.deposit(50)
account.withdraw(30)
print(account.balance)   # 120
`,
      },
      hints: [
        'Start each method by rejecting amount <= 0 with raise ValueError(...).',
        'Inside with self._lock:, read self._balance, decide whether the withdrawal is allowed, and only then change it — all in the same block.',
        'with self._lock:\n    if amount > self._balance:\n        raise ValueError("insufficient funds")\n    self._balance -= amount\n    return self._balance',
      ],
      solution: {
        explanation: py`Every change to \`_balance\` happens inside \`with self._lock:\`, so two threads can never interleave their read-modify-write steps. The crucial part is in \`withdraw\`: the "is there enough money?" **check** and the **update** sit in the same critical section. If the check happened before acquiring the lock, another thread could withdraw in between, and both withdrawals would succeed on money that only covers one — the second test simulates exactly that by changing the balance at the moment the lock is acquired.

Raising \`ValueError\` inside the \`with\` block is fine: the lock is released on the way out. Reading the balance in the property doesn't need the lock for a single attribute read in CPython, but if you add it, never call the property from inside a locked method — a plain \`Lock\` is not re-entrant, so the thread would wait for itself forever (use \`RLock\` if you need that).`,
        files: {
          'main.py': py`import threading


class BankAccount:
    def __init__(self, balance=0):
        self._balance = balance
        self._lock = threading.Lock()

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        with self._lock:
            self._balance += amount
            return self._balance

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("withdrawal must be positive")
        with self._lock:
            if amount > self._balance:
                raise ValueError("insufficient funds")
            self._balance -= amount
            return self._balance


account = BankAccount(100)
account.deposit(50)
account.withdraw(30)
print(account.balance)   # 120
`,
        },
      },
      tests: [
        { name: 'deposit and withdraw return the new balance', code: py`acc = BankAccount(100)
assert acc.deposit(50) == 150
assert acc.withdraw(30) == 120
assert acc.balance == 120` },
        { name: 'overdrawing raises ValueError and changes nothing', code: py`acc = BankAccount(20)
with raises(ValueError):
    acc.withdraw(50)
assert acc.balance == 20` },
        { name: 'zero or negative amounts raise ValueError', code: py`acc = BankAccount(20)
with raises(ValueError):
    acc.deposit(0)
with raises(ValueError):
    acc.withdraw(-5)
assert acc.balance == 20` },
        { name: 'each call takes the lock exactly once and releases it, even on errors', code: py`class SpyLock:
    def __init__(self):
        self.events = []
    def acquire(self, *args, **kwargs):
        self.events.append("acquire")
        return True
    def release(self):
        self.events.append("release")
    def __enter__(self):
        self.acquire()
        return self
    def __exit__(self, *exc):
        self.release()
        return False

acc = BankAccount(100)
spy = SpyLock()
acc._lock = spy
acc.deposit(10)
acc.withdraw(30)
with raises(ValueError):
    acc.withdraw(1_000)
assert spy.events == ["acquire", "release"] * 3, 'Use one "with self._lock:" block per call'` },
        { name: 'another thread cannot sneak in between the check and the update', code: py`class SneakyLock:
    """At the moment you acquire the lock, another thread has just withdrawn 80."""
    def __init__(self, account):
        self.account = account
        self.used = False
    def acquire(self, *args, **kwargs):
        if not self.used:
            self.used = True
            self.account._balance -= 80
        return True
    def release(self):
        pass
    def __enter__(self):
        self.acquire()
        return self
    def __exit__(self, *exc):
        return False

acc = BankAccount(100)
acc._lock = SneakyLock(acc)
with raises(ValueError):
    acc.withdraw(50)
assert acc.balance == 20, 'Check the balance AFTER acquiring the lock, not before'` },
      ],
    },
    {
      id: 'lock-ordering',
      title: 'Cure a deadlock with lock ordering',
      difficulty: 'advanced',
      prompt: py`\`main.py\` moves money between accounts using the **simulated** threads and locks from \`simthreads.py\` (the same helper as in the playground). Two transfers in opposite directions deadlock: run it and you'll see \`DEADLOCK\`.

Fix \`transfer(source, target, amount)\` so that it **always acquires the lock of the account with the lower \`number\` first**, whatever the direction of the transfer. Keep everything else the same:

- it must still be a generator that acquires both locks with \`yield from …acquire()\`, moves the money, yields one message and releases both locks;
- after the fix the program prints \`finished 80 70\`.

The tests run several transfers through \`run()\` and check the final status, the balances, that every lock is released, and which lock is taken first.`,
      files: { 'main.py': BANK_STARTER, 'simthreads.py': SIMTHREADS },
      hints: [
        'The bug is the line first, second = source, target: the order depends on the direction of the transfer.',
        'Sort the two accounts by their number so the order is the same for every transfer.',
        'first, second = sorted((source, target), key=lambda account: account.number)',
      ],
      solution: {
        explanation: py`A deadlock needs a **cycle**: T1 holds lock 1001 and waits for 1002 while T2 holds 1002 and waits for 1001. Sorting the two accounts by number gives every transfer the same acquisition order, 1001 then 1002. Now T2 asks for 1001 first; it's taken, so T2 waits **while holding nothing**, and T1 can take 1002, finish and release both. A cycle is impossible because nobody ever waits for a lower-numbered lock while holding a higher one.

The same idea works in real code with \`threading.Lock\` and nested \`with\` blocks. Other cures: use a single lock for both accounts (simpler, less parallel), or \`lock.acquire(timeout=…)\` and back off and retry when it fails.`,
        files: { 'main.py': BANK_SOLUTION, 'simthreads.py': SIMTHREADS },
      },
      tests: [
        { name: 'opposite transfers finish without a deadlock', code: py`a = Account(1001, 100)
b = Account(1002, 50)
result = run({"T1": transfer(a, b, 30), "T2": transfer(b, a, 10)}, schedule=["T1", "T2"], verbose=False)
assert result == "finished"` },
        { name: 'the money ends up in the right accounts', code: py`a = Account(1001, 100)
b = Account(1002, 50)
run({"T1": transfer(a, b, 30), "T2": transfer(b, a, 10)}, schedule=["T1", "T2"], verbose=False)
assert (a.balance, b.balance) == (80, 70)` },
        { name: 'both locks are released afterwards', code: py`a = Account(1001, 100)
b = Account(1002, 50)
run({"T1": transfer(a, b, 30), "T2": transfer(b, a, 10)}, schedule=["T1", "T2"], verbose=False)
assert a.lock.owner is None and b.lock.owner is None` },
        { name: 'the lower account number is always locked first', code: py`a = Account(1001, 100)
b = Account(1002, 50)
log = capture(run, {"T": transfer(b, a, 5)}, ["T"])
assert log.index("acquired lock-1001") < log.index("acquired lock-1002"), 'transfer(bob, alice) must lock 1001 before 1002'` },
        { name: 'three accounts in a circle do not deadlock', code: py`a, b, c = Account(1, 10), Account(2, 10), Account(3, 10)
result = run(
    {"X": transfer(a, b, 1), "Y": transfer(b, c, 1), "Z": transfer(c, a, 1)},
    schedule=["X", "Y", "Z"],
    verbose=False,
)
assert result == "finished" and (a.balance, b.balance, c.balance) == (10, 10, 10)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'threading-race-condition',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a race condition? Give a Python example and the fix.',
      answer: 'A bug where the result depends on the timing of threads accessing shared data. Example: several threads doing counter += 1 — it is a read, an add and a write, and a switch in between loses updates. Fix: protect the whole read-modify-write with one threading.Lock (with lock: counter += 1), or avoid shared state by giving each thread its own result.',
      explanation: py`Races come from *compound* operations on *shared, mutable* data under *pre-emptive* switching. Remove any one of the three and the race disappears: make the operation atomic with a lock, don't share (return results / use queues), or don't mutate (immutable data).`,
      code: { lang: 'python', code: py`import threading

hits = 0
hits_lock = threading.Lock()

def record_hit():
    global hits
    with hits_lock:      # read, add and write happen as one step
        hits += 1` },
      whyAsked: 'It is the fundamental hazard of shared-memory concurrency; everything else (locks, queues, deadlocks) follows from it.',
      mistakes: ['Saying the GIL prevents race conditions', 'Locking only the write, not the read', 'Claiming races only happen on multi-core machines'],
      followUps: ['Why does the GIL not make count += 1 atomic?', 'What is a check-then-act race?', 'How would you test for a race condition?'],
      modelAnswer: 'A race condition is a bug where the outcome depends on the timing of threads touching shared data. The classic Python example is several threads doing counter += 1: that is really read the value, add one, write it back, and if the operating system switches threads between the read and the write, two threads write the same value and an update is lost. The GIL doesn’t help, because switches can happen between bytecode instructions. The fix is to make the whole read-modify-write one critical section with a threading.Lock, using with lock, or better, avoid sharing — let each thread return its own count and add them up at the end.',
    },
    {
      id: 'threading-deadlock-diagnosis',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A service that moves stock between warehouses occasionally freezes: CPU at zero, no errors, requests time out. Each move locks both warehouses. How do you diagnose and fix it?',
      answer: 'It smells like a deadlock: two threads each hold one warehouse lock and wait for the other. Confirm by dumping all thread stacks (py-spy dump, faulthandler) and seeing threads blocked in acquire. Fix by acquiring locks in one global order (e.g. sorted by warehouse id), or using a single lock, and add acquire timeouts so a future cycle fails loudly.',
      explanation: py`Zero CPU plus a frozen process means threads are *waiting*, not working. A stack dump shows each thread's current line — in a deadlock you see two threads parked inside \`acquire()\` at the nested \`with\`. Ordering locks breaks the circular-wait condition. Timeouts (\`lock.acquire(timeout=…)\`) turn a silent hang into an error you can log and retry.`,
      whyAsked: 'Deadlocks are rare, intermittent and silent in production; interviewers want a methodical diagnosis, not guesses.',
      mistakes: ['Restarting the service and calling it fixed', 'Adding sleeps to "change the timing"', 'Not knowing how to see what each thread is doing'],
      followUps: ['What are the four conditions for a deadlock?', 'How does lock ordering break the cycle?', 'When would you prefer a single coarse lock?'],
      modelAnswer: 'A frozen process with zero CPU and no errors tells me threads are waiting, and with code that takes two locks per move my first suspect is a deadlock. I’d confirm it by dumping every thread’s stack — py-spy dump on the live process, or faulthandler — and I’d expect two threads blocked in acquire, each holding the lock the other one wants because they lock the source warehouse first and the destination second. The fix is a global lock order: always lock the warehouse with the lower id first, so a cycle can’t form. I’d also add timeouts on acquire so a future mistake raises and gets logged instead of silently hanging.',
    },
    {
      id: 'threading-exceptions-in-threads',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A worker function raises an exception. With threading.Thread the main program carries on; with ThreadPoolExecutor the exception appears in the main thread. Why?',
      answer: 'An exception in a Thread target is handled by threading.excepthook (it prints a traceback) and the thread ends; join() does not re-raise it. An executor catches the exception and stores it on the Future, and future.result() (or iterating pool.map) re-raises it in the caller.',
      explanation: py`Each thread has its own call stack, so an exception can only propagate up *that* thread's stack — and the thread's entry point is the end of the line. Executors bridge this by capturing the outcome (value or exception) in a \`Future\`. With raw threads you must catch exceptions in the target and pass them back yourself, e.g. on a queue.`,
      code: { lang: 'python', code: py`from concurrent.futures import ThreadPoolExecutor

def parse(line):
    return int(line)

with ThreadPoolExecutor() as pool:
    future = pool.submit(parse, "oops")
    try:
        future.result()          # ValueError is re-raised here
    except ValueError as error:
        print("worker failed:", error)` },
      whyAsked: 'Silently lost exceptions are a common production bug in threaded code.',
      mistakes: ['Expecting join() to raise', 'Never calling result() on submitted futures', 'Catching and ignoring all exceptions inside workers'],
      followUps: ['What does threading.excepthook let you do?', 'What happens if you never call result() on a failed future?', 'How does as_completed help with error handling?'],
      modelAnswer: 'Every thread has its own call stack, so an exception can only travel up the stack of the thread that raised it. For a raw Thread that stack ends at the target function, so Python calls threading.excepthook, which prints the "Exception in thread" traceback, and the thread just dies — join returns normally and the main program never knows. ThreadPoolExecutor wraps each call, catches the exception and stores it on the Future; when I call future.result() or iterate over pool.map, it re-raises it in my thread. That’s one of the main reasons I prefer executors, and why I always collect the results of submitted futures.',
    },
    {
      id: 'threading-word-count',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Count words in a large list of lines with a worker pool and **no locks**: write `parallel_word_count(lines, executor, chunk_size=100)` that splits `lines` into chunks of `chunk_size`, runs `count_words` on each chunk through `executor.map`, and returns one merged `Counter`. `executor` is anything with a `map(fn, iterable)` method — a `ThreadPoolExecutor` on your machine, a fake inline executor in the tests.',
      answer: 'Build the chunks with slicing, call executor.map(count_words, chunks), and add each partial Counter into a total Counter in the calling thread.',
      explanation: py`Each worker only touches its own chunk and its own \`Counter\`, so there's no shared mutable state and nothing to lock. The merge runs in one thread after the workers return. Injecting the executor makes the function testable without threads and lets you swap in a \`ProcessPoolExecutor\` — which is the right choice for pure-Python counting on standard CPython, since \`count_words\` is CPU-bound. \`count_words\` is a module-level function, so it can be pickled and sent to processes too.`,
      starter: { files: { 'main.py': py`from collections import Counter


def count_words(lines):
    """Count the words in one chunk of lines (runs inside a worker)."""
    counts = Counter()
    for line in lines:
        counts.update(line.lower().split())
    return counts


def parallel_word_count(lines, executor, chunk_size=100):
    # TODO: split lines into chunks, map count_words over them, merge the results
    return Counter()


class InlineExecutor:
    """Stands in for ThreadPoolExecutor: same map() interface, no threads."""

    def map(self, fn, iterable):
        return map(fn, iterable)


text = ["the cat sat", "The dog sat", "a cat and a dog"]
print(parallel_word_count(text, InlineExecutor(), chunk_size=2).most_common(3))
` } },
      tests: [
        { name: 'merges counts from every chunk', code: py`text = ["the cat sat", "The dog sat", "a cat and a dog"]
result = parallel_word_count(text, InlineExecutor(), chunk_size=2)
assert result["the"] == 2 and result["cat"] == 2 and result["sat"] == 2 and result["a"] == 2` },
        { name: 'sends one task per chunk', code: py`class RecordingExecutor:
    def __init__(self):
        self.chunks = []
    def map(self, fn, iterable):
        items = list(iterable)
        self.chunks.extend(items)
        return [fn(chunk) for chunk in items]

ex = RecordingExecutor()
lines = [f"word{i % 7}" for i in range(250)]
total = parallel_word_count(lines, ex, chunk_size=100)
assert [len(c) for c in ex.chunks] == [100, 100, 50]
assert sum(total.values()) == 250` },
        { name: 'returns a Counter, empty for no lines', code: py`from collections import Counter
result = parallel_word_count([], InlineExecutor())
assert isinstance(result, Counter) and not result` },
      ],
      solution: { files: { 'main.py': py`from collections import Counter


def count_words(lines):
    """Count the words in one chunk of lines (runs inside a worker)."""
    counts = Counter()
    for line in lines:
        counts.update(line.lower().split())
    return counts


def parallel_word_count(lines, executor, chunk_size=100):
    chunks = [lines[i:i + chunk_size] for i in range(0, len(lines), chunk_size)]
    total = Counter()
    for partial in executor.map(count_words, chunks):
        total.update(partial)          # merging happens in one thread only
    return total


class InlineExecutor:
    """Stands in for ThreadPoolExecutor: same map() interface, no threads."""

    def map(self, fn, iterable):
        return map(fn, iterable)


text = ["the cat sat", "The dog sat", "a cat and a dog"]
print(parallel_word_count(text, InlineExecutor(), chunk_size=2).most_common(3))
` } },
      hints: ['range(0, len(lines), chunk_size) gives the start index of every chunk.', 'Counter.update(other_counter) adds counts together.'],
      whyAsked: 'It checks whether you design concurrent code to avoid shared state instead of reaching for locks first, and whether you think about testability.',
      mistakes: ['Updating one global Counter from every worker without a lock', 'Submitting one task per line (huge overhead)', 'Hard-coding ThreadPoolExecutor inside the function so it cannot be tested or swapped'],
      followUps: ['Would threads speed this up on standard CPython? What would you use instead?', 'How would you pick chunk_size?', 'How would you stream a file that does not fit in memory?'],
      modelAnswer: 'I split the lines into chunks with slicing, pass count_words and the chunks to executor.map, and add every partial Counter into one total in the calling thread. No worker touches shared state, so I need no lock at all, and the merge happens once at the end. Taking the executor as a parameter keeps it testable with a fake inline executor, and it lets me swap in a ProcessPoolExecutor — which I would actually do for pure-Python counting on standard CPython, because the work is CPU-bound and threads would just take turns on the GIL.',
    },
    {
      id: 'threading-builtin-thread-safety',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Is list.append thread-safe in Python? What about `if key not in cache: cache[key] = load(key)`?',
      answer: 'In CPython a single list.append or dict assignment will not corrupt the object — with the GIL it runs uninterrupted, and the free-threaded build uses per-object locks — but that is an implementation behaviour rather than a language guarantee. The cache code is a check-then-act sequence: two threads can both see the key missing and both call load(), so it needs a lock (or setdefault plus accepting duplicate loads).',
      explanation: py`Thread safety is about *invariants across steps*. Single C-level operations on built-ins are effectively atomic in CPython; sequences are not. Documented thread-safe tools are \`queue.Queue\` and \`deque\` appends/pops. For the cache: lock around the check-and-insert, or use per-key locks if \`load()\` is slow, or \`functools.lru_cache\` (which keeps its internal state consistent across threads, though concurrent first calls may still compute the value twice).`,
      whyAsked: 'It separates people who repeat "the GIL makes Python thread-safe" from people who reason about atomicity and guarantees.',
      mistakes: ['Answering a flat yes or no', 'Assuming the GIL makes compound operations safe', 'Not distinguishing language guarantees from CPython behaviour'],
      followUps: ['What changes on the free-threaded build?', 'How would you avoid calling load() twice for the same key?', 'Which standard-library containers are documented as thread-safe?'],
      modelAnswer: 'For a single operation, in practice yes: in CPython list.append or a dict assignment won’t corrupt the container when threads run it concurrently — with the GIL it executes as one step, and the free-threaded build protects built-in types with internal locks. But that’s a description of CPython, not a promise of the language; the documented thread-safe tools are queue.Queue and deque. The cache code is a different story: it’s check-then-act, two operations, so two threads can both find the key missing and both call load. I’d wrap the check and insert in a lock, and if load is slow I’d use a lock per key so unrelated keys don’t wait for each other.',
    },
    {
      id: 'threading-pipeline-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design a threaded pipeline that reads records from a slow API, transforms them, and writes them to a database that allows at most 5 connections. How do threads communicate, how do you avoid running out of memory, and how does it shut down?',
      answer: 'Stages connected by bounded queue.Queue objects: a few fetcher threads put raw records on queue 1, transformer threads move them to queue 2, and exactly 5 writer threads (one connection each) consume queue 2. Bounded queues give backpressure: when writers fall behind, put() blocks upstream instead of filling memory. Shut down by sending one sentinel per consumer stage by stage (or Queue.shutdown() on 3.13+), join threads, and propagate errors via an error queue or futures.',
      explanation: py`Queues remove shared state: each record is owned by one thread at a time. \`maxsize\` turns a queue into a flow-control valve. Sizing each stage to its bottleneck (5 writers for 5 connections) avoids contention. Clean shutdown is ordered: stop the producers, then send N sentinels to the N consumers of each stage. Timeouts on API calls and \`get(timeout=…)\` loops with a stop \`Event\` keep the pipeline from hanging; failures should be counted and logged, with retries for transient errors.`,
      whyAsked: 'It tests whether you can combine primitives into a robust system: backpressure, resource limits, shutdown and error handling.',
      mistakes: ['Unbounded queues (memory grows until the process dies)', 'More writer threads than database connections', 'No plan for stopping the threads', 'Swallowing worker exceptions'],
      followUps: ['What if the transform step is CPU-heavy?', 'How would you make it resumable after a crash?', 'How would the same design look with asyncio?'],
      modelAnswer: 'I’d build it as stages connected by bounded queues. A few fetcher threads call the API and put raw records on the first queue; transformer threads take from it and put results on a second queue; and exactly five writer threads, each owning one database connection, consume the second queue, ideally in batches. Because the queues have a maxsize, a slow database makes the writers fall behind, the queue fills up, and put blocks the earlier stages — that backpressure keeps memory flat. For shutdown, when the fetchers are done I send one sentinel per transformer, and when they finish, one per writer, then join everything; on 3.13 Queue.shutdown does the same job. Errors go to an error queue or get logged with the record id, and every network call has a timeout. If the transform turned out CPU-heavy, I’d move that stage to a process pool.',
    },
  ],

  takeaways: [
    'A thread is a flow of execution inside your program; all threads share the same memory.',
    'Pass the function itself: Thread(target=fn, args=(x,)); start() runs it once, join() waits for it.',
    'Daemon threads are killed at exit; use them only for work that may be lost.',
    'count += 1 is read-add-write: without a lock, threads lose updates. The GIL does not prevent this.',
    'Protect every read-modify-write and check-then-act with one lock, using with lock:.',
    'Deadlocks come from circular waits; acquire multiple locks in one global order, and use timeouts.',
    'Prefer queues and per-task results over shared state, and ThreadPoolExecutor over raw threads; future.result() re-raises worker exceptions.',
  ],
}
