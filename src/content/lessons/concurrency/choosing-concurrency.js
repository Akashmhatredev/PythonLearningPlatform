// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ADVISOR = py`from dataclasses import dataclass


@dataclass
class Workload:
    name: str
    tasks: int                      # independent pieces of work
    waiting_share: float            # 0..1, MEASURED share of wall time spent waiting
    async_libraries: bool           # do async versions of the libraries exist?
    survives_restarts: bool = False  # must the work outlive this process?


def recommend(job):
    """Return (model, reason): a SIMPLIFIED version of this lesson's decision guide."""
    if job.survives_restarts:
        return "task queue", "the work must outlive this process"
    if job.tasks <= 1:
        return "sequential", "there is nothing to overlap"
    if job.waiting_share >= 0.5:
        if job.async_libraries:
            return "asyncio", "mostly waiting, and async libraries exist"
        return "threads", "mostly waiting, but the libraries block"
    return "processes", "mostly computing: it needs several cores"


JOBS = [
    Workload("download 500 product pages", 500, 0.95, async_libraries=True),
    Workload("call a legacy SOAP API 40 times", 40, 0.90, async_libraries=False),
    Workload("resize 2,000 photos in pure Python", 2_000, 0.05, async_libraries=False),
    Workload("parse one config file", 1, 0.20, async_libraries=False),
    Workload("send 10,000 welcome emails", 10_000, 0.90, async_libraries=True, survives_restarts=True),
]

for job in JOBS:
    model, reason = recommend(job)
    print(f"{job.name:<36} -> {model:<11} {reason}")
`

export default {
  id: 'choosing-concurrency',
  title: 'Choosing a concurrency model',
  summary: 'Measure first, then pick: sequential for small or dependent work, asyncio or threads for waiting, processes for computing, and a distributed task queue for work that must outlive a request or a machine.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['concurrency-concepts', 'threading', 'multiprocessing', 'asyncio-basics', 'asyncio-in-practice'],
  related: ['concurrency-concepts', 'threading', 'multiprocessing', 'asyncio-basics', 'asyncio-in-practice', 'profiling', 'performance', 'gil-and-free-threading', 'building-apis', 'project-async-pipeline'],
  tags: ['concurrency', 'decision guide', 'asyncio vs threads', 'threads vs processes', 'I/O-bound', 'CPU-bound', 'task queue', 'Celery', 'RQ', 'background jobs', 'web servers', 'gunicorn', 'uvicorn', 'scrapers', 'data pipelines', 'measuring', 'Little’s law', 'scaling', 'free-threading'],
  apis: [
    { name: 'time.perf_counter()', summary: 'Wall-clock time with high resolution: how long something took from start to finish.' },
    { name: 'time.process_time()', summary: 'CPU time used by this process (all threads), excluding time spent sleeping or waiting.' },
    { name: 'concurrent.futures.Executor', summary: 'Common interface of ThreadPoolExecutor and ProcessPoolExecutor: switch models by changing one line.' },
    { name: 'asyncio.Semaphore / asyncio.Queue', summary: 'Bound how much async work runs at once.' },
    { name: 'os.process_cpu_count()', summary: '(3.13+) CPUs this process may use: a sensible upper bound for CPU-bound process pools.' },
  ],
  docs: [
    { label: 'Python docs — Concurrent execution', url: 'https://docs.python.org/3/library/concurrency.html' },
    { label: 'concurrent.futures — Executor objects', url: 'https://docs.python.org/3/library/concurrent.futures.html' },
    { label: 'asyncio — high-level APIs', url: 'https://docs.python.org/3/library/asyncio.html' },
    { label: 'The Python profilers (cProfile)', url: 'https://docs.python.org/3/library/profile.html' },
    { label: 'HOWTO — Python support for free threading', url: 'https://docs.python.org/3/howto/free-threading-python.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You now know four ways to run work: **sequentially**, with **asyncio** ([basics](lesson:asyncio-basics), [in practice](lesson:asyncio-in-practice)), with **threads** ([threading](lesson:threading)) and with **processes** ([multiprocessing](lesson:multiprocessing)). Real systems add a fifth: **distributed workers** — separate programs, often on separate machines, pulling jobs from a queue.`,
    py`This lesson is the decision guide. It boils down to three questions, asked in order:`,
    py`1. **Does the work need to outlive this program** — survive a crash, a deploy, a closed browser tab, or run on other machines? → a task queue.
2. **Is there anything to overlap?** One task, or steps that each depend on the previous one → sequential.
3. **Where does the time go — waiting or computing?** Waiting → asyncio (if async libraries exist) or threads. Computing → processes (or vectorised libraries).`,
    py`And before all three: **measure**. Intuition about where time goes is wrong surprisingly often.`,
  ],
  why: [
    py`**The wrong model wastes weeks.** Threads won't speed up pure-Python maths on standard CPython; processes are overkill for downloads; asyncio rewrites everything and still freezes on one blocking call. Picking well up front saves rewrites.`,
    py`**Complexity is a real cost.** Every concurrent model brings new bugs — races, deadlocks, lost tasks, pickling errors. Sometimes the right answer is "stay sequential and fix the slow query".`,
    py`**Real systems mix models.** A typical web service runs several *processes*, each with an *event loop* or a *thread pool*, and hands slow jobs to *background workers*. Knowing why each layer is there lets you configure and debug it.`,
  ],
  eli15: [
    py`Picking a concurrency model is like deciding how to get chores done.`,
    py`- **One small chore?** Just do it (sequential).
- **Lots of waiting** — laundry, the oven, a delivery? Juggle them yourself: start one, and while it runs start the next (asyncio). If each chore needs its own phone line that you have to hold, ask a few friends to each hold one (threads).
- **Lots of real work** — 300 maths problems? Split them between friends in **different rooms**, each with their own pencil (processes).
- **A chore that has to happen even if you go out** — like a parcel delivery tomorrow? Write it on the family whiteboard so whoever is home handles it (a task queue).`,
    py`And before deciding, **check the clock**: are you actually waiting, or actually working? People are often wrong about that.`,
  ],
  analogy: {
    title: 'Choosing how to move house',
    body: [
      py`Moving one box? Carry it (sequential). Waiting for three deliveries? Stay home and handle each as it rings the bell (asyncio) — or, if each delivery needs someone standing by the phone, ask a few friends (threads).`,
      py`Packing 200 boxes is real work: more people *in different rooms*, each with their own tape gun, finish faster (processes) — but organising them takes effort, so it's not worth it for five boxes. And for work that must continue after you leave — utilities, mail forwarding — you book a **moving company** with its own schedule and staff (a task queue with workers).`,
    ],
    mapping: [
      ['carrying one box yourself', 'sequential code'],
      ['juggling deliveries alone', 'asyncio: one thread, many waits'],
      ['friends each holding a phone line', 'threads around blocking libraries'],
      ['packers in separate rooms with their own tools', 'processes: parallel CPU work'],
      ['booking a moving company', 'a distributed task queue (Celery, RQ, cloud queues)'],
      ['checking how long things really take before hiring help', 'measuring before choosing'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The decision guide, step by step',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'measure', label: 'Measure', note: 'wall time vs CPU time, profile', x: 100, y: 60, tone: 'yellow' },
        { id: 'outlive', label: 'Must outlive the process?', note: 'retries, restarts, other machines', x: 330, y: 60, tone: 'paper' },
        { id: 'queue', label: 'Task queue', note: 'Celery · RQ · cloud queue', x: 620, y: 60, tone: 'red' },
        { id: 'overlap', label: 'Anything to overlap?', note: '>1 independent task', x: 330, y: 170, tone: 'paper' },
        { id: 'seq', label: 'Sequential', note: 'simplest, easiest to debug', x: 620, y: 170, tone: 'kraft' },
        { id: 'kind', label: 'Waiting or computing?', note: 'I/O-bound vs CPU-bound', x: 330, y: 280, tone: 'paper' },
        { id: 'io', label: 'asyncio / threads', note: 'async libs → asyncio; blocking libs → threads', x: 110, y: 280, tone: 'blue' },
        { id: 'cpu', label: 'Processes', note: 'or NumPy / C code that releases the GIL', x: 620, y: 280, tone: 'ink' },
      ],
      edges: [
        { from: 'measure', to: 'outlive', label: 'then ask' },
        { from: 'outlive', to: 'queue', label: 'yes' },
        { from: 'outlive', to: 'overlap', label: 'no' },
        { from: 'overlap', to: 'seq', label: 'no' },
        { from: 'overlap', to: 'kind', label: 'yes' },
        { from: 'kind', to: 'io', label: 'waiting' },
        { from: 'kind', to: 'cpu', label: 'computing' },
      ],
      steps: [
        { focus: ['measure'], text: py`Start with numbers, not guesses: time the job, compare **wall-clock time** with **CPU time**, and profile to find the slow part. If one step dominates, fixing it may make concurrency unnecessary.` },
        { focus: ['outlive', 'queue'], edges: ['measure->outlive', 'outlive->queue'], text: py`Does the work need to survive this process — a deploy, a crash, a user closing the page — or run on more machines than one? Then it belongs in a **task queue** with separate worker processes, whatever kind of work it is.` },
        { focus: ['overlap', 'seq'], edges: ['outlive->overlap', 'overlap->seq'], text: py`Is there more than one *independent* piece of work? If every step needs the previous result, or there's just one task, stay **sequential**. It's the easiest code to read, test and debug.` },
        { focus: ['kind', 'io'], edges: ['overlap->kind', 'kind->io'], text: py`Mostly **waiting** (network, disk, database)? Overlap the waits: **asyncio** when async libraries exist and you have many connections, a **thread pool** when your libraries block.` },
        { focus: ['kind', 'cpu'], edges: ['kind->cpu'], text: py`Mostly **computing** in Python? On standard CPython you need several interpreters: a **process pool**. First check whether a vectorised library (NumPy, pandas) or better algorithm removes the Python loop altogether.` },
        { focus: ['io', 'cpu', 'queue'], text: py`Real systems often combine answers: a web server runs several **processes**, each with an **event loop** or **thread pool**, and sends slow jobs to a **task queue**. Each layer solves a different problem.` },
      ],
    },
    alt: 'Decision flowchart. Measure first, then ask: must the work outlive the process? Yes leads to a task queue. No leads to: is there anything to overlap? No leads to sequential. Yes leads to: waiting or computing? Waiting leads to asyncio or threads; computing leads to processes or vectorised libraries.',
    caption: py`Step through the guide. The order matters: durability first, then "is there anything to overlap?", then "waiting or computing?".`,
  },
  syntax: [
    py`#### Step 0: measure`,
    { code: py`import time


def measure(fn, *args):
    """Return (wall_seconds, cpu_seconds) for one call."""
    wall_start, cpu_start = time.perf_counter(), time.process_time()
    fn(*args)
    return time.perf_counter() - wall_start, time.process_time() - cpu_start


wall, cpu = measure(build_report, "2026-10")
print(f"wall {wall:.2f}s, cpu {cpu:.2f}s, waiting {1 - cpu / wall:.0%}")`, lang: 'python', title: 'wall time vs CPU time (run locally)', static: true },
    py`If CPU time is close to wall time, the job is **CPU-bound**; if it's a small fraction, the job is mostly **waiting** (I/O-bound). \`time.process_time()\` counts CPU time of all threads in the process, so for multi-threaded code it can exceed wall time. Then use a profiler — \`python -m cProfile -s cumulative app.py\` or a sampling profiler such as py-spy — to see *which* function the time goes to ([profiling](lesson:profiling)).`,
    { callout: 'note', title: 'Measure on your own machine', text: py`In this browser sandbox, Python runs on one WebAssembly thread and \`time.process_time()\` can't tell waiting from computing. Run measurement code locally; the playground below works with numbers you have measured.` },
    py`#### The same job in each model`,
    py`Because the \`Executor\` interface is shared, switching between threads and processes is often a one-line change — which makes it cheap to measure both:`,
    { code: py`from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor


def run_all(work, items, executor_class, workers):
    with executor_class(max_workers=workers) as pool:
        return list(pool.map(work, items, chunksize=50))


if __name__ == "__main__":
    for executor_class in (ThreadPoolExecutor, ProcessPoolExecutor):
        start = time.perf_counter()
        run_all(process_record, records, executor_class, workers=8)
        print(executor_class.__name__, time.perf_counter() - start)`, lang: 'python', title: 'A/B test two models (run locally)', static: true },
    py`#### Real-world architectures`,
    py`**Web servers** combine models. A WSGI server such as Gunicorn runs several worker **processes** (to use all cores and isolate crashes), each optionally with a few **threads**; an ASGI server such as Uvicorn runs an **event loop** in each worker process:`,
    { code: py`gunicorn --workers 4 --threads 8 shop.wsgi:application    # 4 processes x 8 threads (WSGI, e.g. Django/Flask)
uvicorn shop.main:app --workers 4                          # 4 processes, each with an asyncio loop (ASGI, e.g. FastAPI)`, lang: 'bash', title: 'typical server commands' },
    py`**Scrapers and API aggregators** are I/O-bound: asyncio with a semaphore or worker pool and an async HTTP client, plus a process pool if parsing becomes the bottleneck. **Data pipelines** that crunch files use process pools on one machine, and frameworks like Dask or Spark when the data needs several machines.`,
    py`**Background jobs** — emails, PDF reports, video encoding, nightly imports — go to a **task queue**. The web app only *enqueues* a small message; separate worker processes (on any number of machines) execute it, with retries, and the queue (Redis, RabbitMQ, a cloud service) keeps it safe if a worker dies:`,
    { code: py`# tasks.py - Celery (third-party; needs a broker such as Redis or RabbitMQ)
from celery import Celery

app = Celery("shop", broker="redis://localhost:6379/0")


@app.task(bind=True, max_retries=3)
def send_receipt(self, order_id):
    order = load_order(order_id)            # pass ids, not big objects
    try:
        email_receipt(order)
    except ConnectionError as error:
        raise self.retry(exc=error, countdown=30)


# in the web request handler:
send_receipt.delay(order.id)                # returns immediately`, lang: 'python', title: 'Celery (run locally)', static: true },
    { code: py`# RQ - a simpler Redis-backed queue (third-party)
from redis import Redis
from rq import Queue

queue = Queue(connection=Redis())
queue.enqueue(send_receipt, order_id)       # a worker started with "rq worker" runs it`, lang: 'python', title: 'RQ (run locally)', static: true },
    { callout: 'tip', title: 'Rules for queued jobs', text: py`Pass small, serialisable arguments (ids, not ORM objects). Make jobs **idempotent** — safe to run twice — because retries and redeliveries happen. Set time limits, and monitor the queue length: a growing queue means workers can't keep up.` },
  ],
  walkthrough: {
    title: 'Reading the concurrency advisor',
    lang: 'python',
    code: ADVISOR,
    intro: py`This is the playground program (press **Guide** there to follow along). It encodes the decision guide as a function — **simplified**: real decisions also weigh team experience, existing code and operational costs.`,
    steps: [
      { lines: [4, 10], text: py`A [dataclass](lesson:dataclasses) describing a workload. \`waiting_share\` should come from a **measurement** (1 − CPU time / wall time), not a guess.` },
      { lines: [13, 16], text: py`Durability first: if the work must outlive this process, no in-process model is enough.` },
      { lines: [17, 18], text: py`Nothing to overlap means no benefit from concurrency — only its costs.` },
      { lines: [19, 22], text: py`Mostly waiting: asyncio when the libraries are async, otherwise a thread pool around the blocking libraries.` },
      { lines: [23], text: py`Everything else is mostly computing, which needs several cores: processes on standard CPython.` },
      { lines: [26, 36], text: py`Five sample workloads, then one line per recommendation. The \`:<36\` and \`:<11\` format specs left-align the text in columns.` },
    ],
  },
  playground: {
    title: 'A tiny concurrency advisor',
    objective: 'Run it, check that you agree with each recommendation, then teach the advisor new rules.',
    files: { 'main.py': ADVISOR },
    expected: py`\`\`\`text
download 500 product pages           -> asyncio     mostly waiting, and async libraries exist
call a legacy SOAP API 40 times      -> threads     mostly waiting, but the libraries block
resize 2,000 photos in pure Python   -> processes   mostly computing: it needs several cores
parse one config file                -> sequential  there is nothing to overlap
send 10,000 welcome emails           -> task queue  the work must outlive this process
\`\`\``,
    experiments: [
      {
        id: 'chat-server',
        task: py`Add a workload \`"chat server, 20,000 open WebSockets"\` to \`JOBS\` with numbers you think fit (lots of tasks, almost all waiting, async libraries available). Predict the recommendation, then run it.`,
        hint: py`\`Workload("chat server, 20,000 open WebSockets", 20_000, 0.99, async_libraries=True),\``,
        tests: [{ name: 'the chat server is recommended asyncio', code: py`line = next((l for l in output.splitlines() if "chat server" in l), "")
assert "-> asyncio" in line, 'Add the chat server workload to JOBS'` }],
        explain: py`Tens of thousands of mostly idle connections is asyncio's home turf: each connection is a cheap task instead of an OS thread with its own stack. Frameworks like FastAPI/Starlette or aiohttp exist for exactly this.`,
      },
      {
        id: 'vectorise',
        task: py`Add a field \`vectorizable: bool = False\` to \`Workload\` (after \`survives_restarts\`) and a rule in \`recommend\`: CPU-bound work that is vectorizable gets \`("vectorise", "let NumPy run the loop in C first")\`. Then add a job \`Workload("average 50 million sensor readings", 1_000, 0.05, async_libraries=False, vectorizable=True)\`.`,
        hint: py`Put the new check just before the final \`return "processes", ...\`: \`if job.vectorizable: return "vectorise", "let NumPy run the loop in C first"\`.`,
        tests: [
          { name: 'vectorizable CPU work is told to vectorise', code: py`job = Workload("x", 100, 0.1, async_libraries=False, vectorizable=True)
assert recommend(job)[0] == "vectorise"` },
          { name: 'other CPU work still goes to processes', code: py`job = Workload("y", 100, 0.1, async_libraries=False)
assert recommend(job)[0] == "processes"` },
        ],
        explain: py`Before parallelising a numeric Python loop, remove it: NumPy's vectorised operations run in compiled code and are typically much faster than the same loop in Python, often making extra processes unnecessary. Parallelism multiplies speed by at most the number of cores; a better algorithm or vectorisation can do far more.`,
      },
      {
        id: 'mixed',
        task: py`Real jobs are often mixed — a scraper waits for pages, then parses them. Add a rule **before** the waiting/computing check: if \`0.3 <= job.waiting_share < 0.7\`, return \`("asyncio + processes", "overlap the waits, parse in a process pool")\`.`,
        hint: py`\`if 0.3 <= job.waiting_share < 0.7:\` / \`return "asyncio + processes", "overlap the waits, parse in a process pool"\` — place it right after the \`tasks <= 1\` check.`,
        tests: [
          { name: 'half-waiting work gets the hybrid answer', code: py`job = Workload("scrape and parse", 300, 0.5, async_libraries=True)
assert recommend(job)[0] == "asyncio + processes"` },
          { name: 'clear I/O work is unchanged', code: py`assert recommend(Workload("downloads", 300, 0.95, async_libraries=True))[0] == "asyncio"` },
        ],
        explain: py`Hybrid designs split a job into **stages** and give each stage its own model: an asyncio stage downloads, a process-pool stage parses (\`loop.run_in_executor(process_pool, parse, html)\`), connected by a bounded queue. Measure each stage separately — the slowest stage sets the pace of the whole pipeline.`,
      },
      {
        id: 'free-threaded',
        task: py`Think it through (no code): on a **free-threaded** CPython 3.14 build, which of the five recommendations might change, and what would you check before trusting that?`,
        explain: py`The "resize 2,000 photos in pure Python" job could use a **thread pool** instead of processes, since threads can run Python code in parallel without the GIL — saving process start-up and pickling. Before trusting it: confirm every C extension supports free-threading (an unsupported one re-enables the GIL), re-check thread safety of shared state, and **measure**, because single-threaded code runs somewhat slower on that build. The other recommendations don't change: waiting is still best overlapped by asyncio or threads, and durability still needs a queue. See [the GIL & free threading](lesson:gil-and-free-threading).`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Same I/O job: asyncio or a thread pool?',
    props: {
      left: {
        label: 'asyncio + async client',
        lang: 'python',
        code: py`import asyncio
import httpx

async def fetch(client, url, limit):
    async with limit:
        response = await client.get(url)
        return response.status_code

async def main(urls):
    limit = asyncio.Semaphore(50)
    async with httpx.AsyncClient(timeout=10) as client:
        return await asyncio.gather(
            *(fetch(client, url, limit) for url in urls))

statuses = asyncio.run(main(urls))`,
      },
      right: {
        label: 'thread pool + blocking client',
        lang: 'python',
        code: py`from concurrent.futures import ThreadPoolExecutor
import requests

session = requests.Session()   # see notes on thread safety

def fetch(url):
    response = session.get(url, timeout=10)
    return response.status_code

with ThreadPoolExecutor(max_workers=50) as pool:
    statuses = list(pool.map(fetch, urls))`,
      },
      points: [
        'Both overlap the waiting and cap concurrency at 50; for a few hundred URLs either is fine.',
        'asyncio needs an async client (httpx, aiohttp) and async all the way up; the thread pool works with existing blocking code.',
        'asyncio tasks are far cheaper than threads, so it scales to thousands of concurrent connections.',
        'Threads switch pre-emptively, so shared state needs locks; requests.Session is not documented as thread-safe — many teams use one session per thread.',
        'In asyncio one blocking call stalls everything; in the thread pool a blocking call only occupies its own thread.',
      ],
    },
    alt: 'Side-by-side code. Left: asyncio with an httpx AsyncClient, a Semaphore of 50 and gather over all URLs. Right: a ThreadPoolExecutor with 50 workers mapping a requests-based fetch function over the URLs. Bullet points compare library requirements, cost per connection, scaling, thread safety and the effect of blocking calls.',
    caption: py`Both are correct for I/O-bound work. The deciding factors are usually the libraries you already have and how many connections you need at once — not raw speed.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Every model trades **simplicity** for **overlap**. Sequential code does one thing at a time and is easy to follow. Each concurrent model adds a way for things to overlap — and a new family of bugs: races and deadlocks (threads), blocking the loop and lost tasks (asyncio), pickling and start-up costs (processes), retries and duplicate execution (task queues).`,
      py`So the goal is not "the fastest model" but "the simplest model that is fast enough". Often that is still sequential code with one slow part fixed.`,
    ],
    technical: [
      py`#### How to read your measurements`,
      py`- **CPU time ≈ wall time** → CPU-bound. Only more cores (processes, or GIL-releasing native code) or less work (better algorithms, vectorisation) help.
- **CPU time ≪ wall time** → waiting. Overlapping the waits helps until you hit the *other side's* limits: a database's connection pool, an API's rate limit, your network bandwidth.
- **In between** → mixed. Split the job into stages and treat each separately.`,
      py`#### How many workers?`,
      py`For **waiting** work, *Little's law* links throughput, latency and concurrency: requests in flight = requests per second × seconds per request. To serve 50 requests per second that each take 0.2 s, you need about 10 in flight — a semaphore or pool of 10 (plus headroom). More than the downstream service allows only causes queueing or errors there.`,
      py`For **computing** work, more processes than cores just take turns; start with the number of usable CPUs (\`os.process_cpu_count()\` on 3.13+) and measure. *Amdahl's law* ([concurrency concepts](lesson:concurrency-concepts)) caps the speed-up by the sequential fraction of the job, and *efficiency* (speed-up ÷ workers) tells you when adding workers stops paying off.`,
      py`#### Cost per unit of concurrency`,
      py`Roughly, from cheapest to most expensive: an asyncio task (a Python object), a thread (an OS thread with its own stack), a process (a whole interpreter with its own imports and memory), a distributed worker (a process plus network round trips, a broker and serialisation). Prefer the cheapest unit that solves the actual bottleneck.`,
      { callout: 'note', title: 'CPython detail', text: py`"Threads can't run Python code in parallel" is true of the standard, GIL-enabled CPython. The free-threaded build (officially supported, not the default, in 3.14) changes the answer for CPU-bound threaded code, and 3.14's \`concurrent.interpreters\` / \`InterpreterPoolExecutor\` offer isolated interpreters inside one process. PyPy has a GIL; Jython and IronPython never had one. Re-measure when the runtime changes. See [the GIL & free threading](lesson:gil-and-free-threading).` },
    ],
    production: [
      py`**Layer the models deliberately.** Web services: processes for cores and isolation, an event loop or thread pool per process for I/O, a task queue for anything slow or must-not-lose. Pipelines: bounded queues between stages so a slow stage applies backpressure instead of filling memory.`,
      py`**Bound everything.** Pool sizes, semaphores, queue sizes, timeouts, retry counts. Unbounded concurrency turns a slow dependency into an outage.`,
      py`**Design for failure.** Thread and task exceptions must be observed; process pools can break (\`BrokenProcessPool\`); queued jobs can run twice, so make them idempotent and use dead-letter queues for jobs that keep failing.`,
      py`**Re-measure after every change.** The bottleneck moves: once downloads overlap, parsing may dominate; once parsing is parallel, the database may. Keep the sequential version around as the correctness and performance baseline.`,
    ],
  },
  mistakes: [
    {
      title: 'Choosing a model before measuring',
      wrong: { code: py`# "The nightly report is slow - let's make it async."
# Two weeks later: still slow. 90% of the time was one SQL query without an index.`, lang: 'python', static: true },
      right: { code: py`# python -m cProfile -s cumulative report.py
# -> fix the query (add the index), THEN decide whether concurrency is still needed`, lang: 'python', static: true },
      explanation: py`Concurrency only helps when there are independent waits or computations to overlap. If one step dominates, fix that step. Profile first ([profiling](lesson:profiling)).`,
    },
    {
      title: 'Doing slow work inside the web request',
      wrong: { code: py`@app.post("/orders")
def create_order(data):
    order = save_order(data)
    render_pdf_invoice(order)        # 20 seconds of CPU; the user waits, the worker is tied up
    send_email(order)                # and if this fails, the request fails
    return {"id": order.id}`, lang: 'python', static: true },
      right: { code: py`@app.post("/orders")
def create_order(data):
    order = save_order(data)
    send_invoice.delay(order.id)     # a background worker renders and emails it, with retries
    return {"id": order.id}`, lang: 'python', static: true },
      explanation: py`Requests should be fast and predictable. Slow, retryable or must-not-lose work belongs in a task queue processed by separate workers.`,
    },
    {
      title: 'Using asyncio with blocking libraries',
      wrong: { code: py`import asyncio
import requests

async def fetch(url):
    return requests.get(url, timeout=10).text     # blocks the event loop

async def main(urls):
    return await asyncio.gather(*(fetch(u) for u in urls))   # runs one at a time`, lang: 'python', static: true },
      right: { code: py`from concurrent.futures import ThreadPoolExecutor
import requests

def fetch(url):
    return requests.get(url, timeout=10).text

with ThreadPoolExecutor(max_workers=20) as pool:
    pages = list(pool.map(fetch, urls))`, lang: 'python', static: true },
      explanation: py`If your libraries block, asyncio gives you the complexity without the benefit. Use threads — or switch to an async client (httpx, aiohttp) and keep the loop free.`,
    },
    {
      title: 'Parallelising tiny tasks',
      wrong: { code: py`with ProcessPoolExecutor() as pool:
    totals = list(pool.map(add_vat, prices))     # one microsecond of work per message`, lang: 'python', static: true },
      right: { code: py`totals = [add_vat(p) for p in prices]          # or vectorise with NumPy`, lang: 'python', static: true },
      explanation: py`Each process-pool task pays for pickling and messaging. When the work per item is tiny, the overhead dominates and the "parallel" version is slower. Batch, vectorise, or stay sequential.`,
    },
  ],
  debugging: [
    {
      symptom: py`"We added concurrency and it isn't faster."`,
      cause: py`Wrong model for the workload (threads for CPU-bound Python, asyncio with blocking calls), a single dominant sequential step, or a downstream limit (connection pool, rate limit) capping throughput.`,
      fix: py`Measure wall vs CPU time per stage, profile, check downstream limits, then match the model to the bottleneck.`,
    },
    {
      symptom: py`Faster in testing, failing in production: timeouts, 429s, "Too many open files", database errors about too many connections.`,
      cause: py`Unbounded concurrency overwhelming a shared resource.`,
      fix: py`Bound concurrency (semaphores, pool sizes) to what each dependency allows; use Little's law to size them; add retries with backoff.`,
    },
    {
      symptom: py`Background jobs occasionally run twice (duplicate emails, double charges).`,
      cause: py`Task queues deliver *at least once*: a worker that dies or times out after doing the work but before acknowledging it gets the job redelivered.`,
      fix: py`Make jobs idempotent (check "already sent?" by id, use unique constraints or idempotency keys).`,
    },
    {
      symptom: py`Memory keeps growing in a concurrent pipeline until the process is killed.`,
      cause: py`A fast producer and a slow consumer with an unbounded queue (or one giant gather/list of futures).`,
      fix: py`Use bounded queues (\`maxsize\`) for backpressure and process results as they arrive instead of collecting everything.`,
    },
  ],
  bestPractices: [
    'Measure first: wall time vs CPU time, then a profiler to find the dominant step.',
    'Pick the simplest model that meets the need; sequential is a valid answer.',
    'Waiting: asyncio with async libraries, a thread pool with blocking ones. Computing: processes or vectorised libraries.',
    'Must-not-lose, slow or retryable work goes to a task queue with idempotent jobs.',
    'Size concurrency from the downstream limits (Little’s law for I/O, CPU count for computation) and bound everything.',
    'Split mixed jobs into stages connected by bounded queues and choose a model per stage.',
    'Keep a sequential baseline and re-measure after each change — the bottleneck moves.',
  ],
  useCases: [
    'Planning a scraper: asyncio + semaphore for fetching, a process pool for heavy parsing.',
    'Configuring a web server: processes per core, threads or an event loop per process.',
    'Offloading emails, invoices and video encoding from web requests to Celery/RQ workers.',
    'Speeding up a batch data job with a process pool after confirming it is CPU-bound.',
    'Reviewing a design proposal that adds concurrency, using measurements and the decision guide.',
  ],
  whenToUse: {
    use: [
      'asyncio: many concurrent waits, async libraries available, long-lived connections.',
      'threads: moderate concurrency around blocking libraries; keeping a GUI responsive.',
      'processes: CPU-bound pure Python with meaningful work per task.',
      'task queue: work that must survive restarts, needs retries, or must scale across machines.',
    ],
    avoid: [
      'Any concurrency when one sequential step dominates — fix the step.',
      'asyncio with blocking libraries; threads for CPU-bound Python on standard CPython.',
      'Processes for tiny tasks or huge per-task data; task queues for work that must finish within a single request.',
    ],
  },
  comparison: {
    title: 'The five options at a glance (standard CPython)',
    headers: ['', 'Sequential', 'asyncio', 'Threads', 'Processes', 'Task queue'],
    rows: [
      ['best for', 'small or dependent work', 'many I/O waits, async libraries', 'I/O waits with blocking libraries', 'CPU-bound Python', 'slow, retryable, durable jobs'],
      ['uses several cores for Python code', 'no', 'no', 'no (GIL); yes on free-threaded builds', 'yes', 'yes, across machines'],
      ['shared state', 'trivial', 'shared, switches only at await', 'shared, needs locks', 'none by default (pickled copies)', 'none: messages via a broker'],
      ['cost per unit', '—', 'a Python object', 'an OS thread', 'a whole interpreter', 'a process plus broker round trips'],
      ['typical scale', '1', 'thousands of tasks', 'tens to hundreds of threads', 'about one per core', 'many workers on many machines'],
      ['main pitfall', 'slow when waiting', 'one blocking call freezes all', 'races and deadlocks', 'start-up and pickling overhead', 'duplicate runs, operations overhead'],
    ],
    note: py`Mix them freely: processes × (event loop or threads) is how most Python web servers run, with a task queue beside them.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'choosing-concurrency-q1',
      type: 'mcq',
      prompt: 'A chat service must keep **20,000** mostly idle WebSocket connections open, and good async libraries exist. Which model fits best?',
      options: [
        { text: 'One thread per connection', why: '20,000 OS threads cost a lot of memory and scheduling; threads fit tens to hundreds of concurrent waits.' },
        { text: 'A process pool with one process per connection', why: 'A whole interpreter per idle connection is enormously wasteful.' },
        'asyncio: one task per connection on an event loop (possibly in a few processes)',
        { text: 'A Celery task per message', why: 'A task queue suits background jobs, not holding live connections open.' },
      ],
      answer: 2,
      explanation: py`Idle connections are pure waiting, and asyncio tasks are cheap. Production setups often run a few event-loop processes to use several cores.`,
    },
    {
      id: 'choosing-concurrency-q2',
      type: 'mcq',
      prompt: 'Measured: a job runs for 60 s of wall time and uses 58 s of CPU time. It applies a pure-Python filter to 10,000 images on an 8-core machine. Best first move?',
      options: [
        { text: 'Rewrite it with asyncio', why: 'There is almost no waiting to overlap: CPU time is close to wall time.' },
        { text: 'Use a ThreadPoolExecutor with 8 threads', why: 'On standard CPython the threads would take turns on the GIL.' },
        'Check whether the filter can be vectorised; otherwise use a ProcessPoolExecutor with about 8 workers',
        { text: 'Move it to a Celery queue', why: 'A queue adds durability and distribution but doesn’t by itself make the CPU work faster on this machine.' },
      ],
      answer: 2,
      explanation: py`58 of 60 seconds are computation: CPU-bound. Remove the Python loop (NumPy/Pillow) if possible; otherwise spread the images over processes, one per core.`,
    },
    {
      id: 'choosing-concurrency-q3',
      type: 'output',
      prompt: 'Little’s law sizes concurrency for I/O-bound work. What does this print?',
      code: py`import math

def workers_needed(per_second, seconds_each):
    return math.ceil(per_second * seconds_each)

print(workers_needed(20, 0.5), workers_needed(20, 0.05))`,
      answer: '10 1',
      accept: ['10 1'],
      explanation: py`20 requests per second that each take 0.5 s keep about 10 in flight; at 0.05 s each, 20 × 0.05 = 1. (Careful with float rounding in general: \`math.ceil(30 * 0.1)\` is \`4\`, because \`30 * 0.1\` is \`3.0000000000000004\` — the exercise deals with that.)`,
    },
    {
      id: 'choosing-concurrency-q4',
      type: 'bug',
      prompt: 'This async scraper is no faster than a plain loop. Click the line that explains why.',
      code: py`import asyncio
import requests

async def fetch(url):
    response = requests.get(url, timeout=10)
    return len(response.text)

async def main(urls):
    sizes = await asyncio.gather(*(fetch(u) for u in urls))
    print(sum(sizes))

asyncio.run(main(["https://example.com"] * 20))`,
      answerLine: 5,
      explanation: py`\`requests.get\` is blocking: while it waits, the event loop can't run any other task, so \`gather\` gets no overlap. Use an async client (\`await client.get(url)\` with httpx/aiohttp), \`await asyncio.to_thread(requests.get, url, timeout=10)\`, or a plain thread pool.`,
    },
    {
      id: 'choosing-concurrency-q5',
      type: 'fill',
      prompt: 'Fill in the executor for each job: downloading pages with a blocking library, and crunching numbers in pure Python (standard CPython).',
      code: py`from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

with ___(max_workers=20) as pool:          # download 500 pages with requests
    pages = list(pool.map(download, urls))

with ___() as pool:                         # simulate 8 Monte Carlo runs
    results = list(pool.map(simulate, seeds))`,
      answer: [['ThreadPoolExecutor'], ['ProcessPoolExecutor']],
      explanation: py`Blocking I/O → threads (a waiting thread releases the GIL). CPU-bound Python → processes (one GIL each). The shared \`Executor\` interface makes swapping and measuring easy.`,
    },
    {
      id: 'choosing-concurrency-q6',
      type: 'mcq',
      prompt: 'Select **all** signs that work belongs in a task queue (Celery, RQ, a cloud queue) rather than inside the web request or an in-process task.',
      options: [
        'It takes far longer than a user should wait for a response',
        'It must not be lost if the server restarts during a deploy',
        { text: 'It is a single fast database lookup', why: 'Fast work belongs in the request; a queue would only add latency and moving parts.' },
        'It may fail transiently and should be retried later',
        'It must scale across several machines',
      ],
      answer: [0, 1, 3, 4],
      explanation: py`Queues add durability, retries and horizontal scale — at the cost of a broker, workers to run and monitor, and at-least-once delivery (so jobs must be idempotent).`,
    },
    {
      id: 'choosing-concurrency-q7',
      type: 'short',
      prompt: 'Describe, step by step, how you would decide whether and how to add concurrency to a slow nightly import job.',
      answer: py`1) Measure: time the whole job and each stage, comparing wall time with CPU time, and profile to find where time goes. 2) If one step dominates (a slow query, an inefficient algorithm), fix it first and re-measure. 3) Ask whether the work must survive restarts or needs retries — then run it as queued jobs. 4) Check there are independent pieces to overlap (files, records, API calls). 5) Mostly waiting → asyncio if async libraries exist, else a bounded thread pool; mostly computing → vectorise or use a process pool sized to the cores; mixed → stages connected by bounded queues. 6) Size concurrency from downstream limits (Little's law, connection pools, rate limits), add timeouts and error handling, and compare against the sequential baseline.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'classify-workload',
      title: 'Classify a workload from measurements',
      difficulty: 'intermediate',
      prompt: py`Write \`classify(cpu_seconds, wall_seconds)\` that turns two measurements into a category, using the ratio \`cpu_seconds / wall_seconds\`:

- \`"cpu-bound"\` if the ratio is **at least 0.7** (the ratio can exceed 1 when several threads compute at once — still CPU-bound);
- \`"io-bound"\` if the ratio is **at most 0.3**;
- \`"mixed"\` otherwise.

Raise \`ValueError\` if \`wall_seconds <= 0\` or \`cpu_seconds < 0\`.

Then write \`suggest(cpu_seconds, wall_seconds, async_libraries)\` returning \`"processes"\` for CPU-bound, \`"asyncio"\` for I/O-bound when \`async_libraries\` is true, \`"threads"\` for I/O-bound otherwise, and \`"pipeline"\` for mixed.`,
      files: {
        'main.py': py`def classify(cpu_seconds, wall_seconds):
    # TODO: compare CPU time with wall time
    return "mixed"


def suggest(cpu_seconds, wall_seconds, async_libraries):
    # TODO: map the category to a model
    return "sequential"


print(classify(9.6, 10.0), suggest(9.6, 10.0, False))    # cpu-bound processes
print(classify(0.4, 10.0), suggest(0.4, 10.0, True))     # io-bound asyncio
`,
      },
      hints: [
        'Validate the inputs first, then compute ratio = cpu_seconds / wall_seconds.',
        'Check ratio >= 0.7 first, then ratio <= 0.3, else "mixed".',
        'In suggest, call classify and branch on its result; only the I/O-bound case looks at async_libraries.',
      ],
      solution: {
        explanation: py`CPU time counts only the moments the process was actually computing; wall time counts everything, including waiting. Their ratio is the share of time spent computing. A high ratio means extra cores (processes) are the only way to go faster; a low ratio means the program is mostly waiting, so overlapping waits pays off — with asyncio when async libraries exist, otherwise threads. In between, split the job into stages and give each its own model ("pipeline").

The thresholds are a rule of thumb, not physics — the point is to decide from data. Note the order of the checks: testing \`>= 0.7\` first also handles ratios above 1 from multi-threaded native code.`,
        files: {
          'main.py': py`def classify(cpu_seconds, wall_seconds):
    if wall_seconds <= 0:
        raise ValueError("wall_seconds must be positive")
    if cpu_seconds < 0:
        raise ValueError("cpu_seconds cannot be negative")
    ratio = cpu_seconds / wall_seconds
    if ratio >= 0.7:
        return "cpu-bound"
    if ratio <= 0.3:
        return "io-bound"
    return "mixed"


def suggest(cpu_seconds, wall_seconds, async_libraries):
    kind = classify(cpu_seconds, wall_seconds)
    if kind == "cpu-bound":
        return "processes"
    if kind == "io-bound":
        return "asyncio" if async_libraries else "threads"
    return "pipeline"


print(classify(9.6, 10.0), suggest(9.6, 10.0, False))    # cpu-bound processes
print(classify(0.4, 10.0), suggest(0.4, 10.0, True))     # io-bound asyncio
`,
        },
      },
      tests: [
        { name: 'busy CPU is cpu-bound', code: py`assert classify(9.6, 10.0) == "cpu-bound"` },
        { name: 'mostly waiting is io-bound', code: py`assert classify(0.4, 10.0) == "io-bound"` },
        { name: 'half and half is mixed', code: py`assert classify(5.0, 10.0) == "mixed"` },
        { name: 'boundaries: 0.7 and 0.3 are inclusive', code: py`assert classify(7.0, 10.0) == "cpu-bound" and classify(3.0, 10.0) == "io-bound"` },
        { name: 'several busy threads (ratio above 1) are cpu-bound', code: py`assert classify(30.0, 10.0) == "cpu-bound"` },
        { name: 'suggest maps every category', code: py`assert suggest(9.0, 10.0, True) == "processes"
assert suggest(1.0, 10.0, True) == "asyncio"
assert suggest(1.0, 10.0, False) == "threads"
assert suggest(5.0, 10.0, False) == "pipeline"` },
        { name: 'invalid measurements raise ValueError', code: py`with raises(ValueError):
    classify(1.0, 0)
with raises(ValueError):
    classify(-1.0, 5.0)` },
      ],
    },
    {
      id: 'size-the-pool',
      title: 'Size an I/O pool with Little’s law',
      difficulty: 'intermediate',
      prompt: py`For I/O-bound work, **Little's law** says: requests in flight = requests per second × seconds per request. Write:

1. \`workers_needed(requests_per_second, seconds_per_request)\` — the smallest whole number of concurrent workers that sustains that rate: the product **rounded up**. It must be robust to floating-point noise: \`workers_needed(30, 0.1)\` must be \`3\` even though \`30 * 0.1\` is \`3.0000000000000004\`. Return \`0\` if the rate is 0. Raise \`ValueError\` for negative arguments.
2. \`max_throughput(workers, seconds_per_request)\` — the requests per second that \`workers\` concurrent workers can sustain: \`workers / seconds_per_request\`. Raise \`ValueError\` if \`seconds_per_request <= 0\` or \`workers < 0\`.`,
      files: {
        'main.py': py`import math


def workers_needed(requests_per_second, seconds_per_request):
    # TODO: Little's law, rounded up
    return requests_per_second


def max_throughput(workers, seconds_per_request):
    # TODO: how many requests per second can these workers handle?
    return workers


print(workers_needed(50, 0.2))      # 10
print(max_throughput(10, 0.25))     # 40.0
`,
      },
      hints: [
        'math.ceil(x) rounds up to the next whole number.',
        'Round the product to a few decimal places before ceil to remove float noise: round(rate * latency, 9).',
        'return math.ceil(round(requests_per_second * seconds_per_request, 9)); and workers / seconds_per_request for the throughput.',
      ],
      solution: {
        explanation: py`Little's law holds for any stable system: the average number of items in flight equals the arrival rate times the average time each item spends inside. For a client calling an API, the "items" are requests, so the concurrency you need is rate × latency, rounded **up** (half a worker doesn't exist). Read backwards, it gives the ceiling for a fixed pool: \`workers / latency\` requests per second.

\`30 * 0.1\` is \`3.0000000000000004\` in binary floating point, and \`math.ceil\` would turn that into 4. Rounding to 9 decimal places first removes that noise without affecting real fractional values. In practice add headroom (latency varies) and never exceed what the downstream service allows — its connection pool or rate limit is the real cap.`,
        files: {
          'main.py': py`import math


def workers_needed(requests_per_second, seconds_per_request):
    if requests_per_second < 0 or seconds_per_request < 0:
        raise ValueError("rate and latency cannot be negative")
    in_flight = round(requests_per_second * seconds_per_request, 9)   # remove float noise
    return math.ceil(in_flight)


def max_throughput(workers, seconds_per_request):
    if workers < 0:
        raise ValueError("workers cannot be negative")
    if seconds_per_request <= 0:
        raise ValueError("seconds_per_request must be positive")
    return workers / seconds_per_request


print(workers_needed(50, 0.2))      # 10
print(max_throughput(10, 0.25))     # 40.0
`,
        },
      },
      tests: [
        { name: '50 req/s at 0.2 s each needs 10 workers', code: py`assert workers_needed(50, 0.2) == 10` },
        { name: 'fractions round up', code: py`assert workers_needed(10, 0.25) == 3` },
        { name: 'float noise does not add a worker', code: py`assert workers_needed(30, 0.1) == 3` },
        { name: 'no traffic needs no workers', code: py`assert workers_needed(0, 0.3) == 0` },
        { name: 'throughput of a fixed pool', code: py`assert max_throughput(10, 0.25) == approx(40.0)` },
        { name: 'bad arguments raise ValueError', code: py`with raises(ValueError):
    workers_needed(-1, 0.2)
with raises(ValueError):
    max_throughput(5, 0)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'choosing-concurrency-image-pipeline',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'You must download 50,000 product images from a supplier’s API and generate three thumbnail sizes for each, in Python. Which concurrency models do you use and how do they fit together?',
      answer: 'Two stages with different models: downloading is I/O-bound → asyncio with an async HTTP client and a concurrency limit matching the supplier’s rate limits (or a thread pool with a blocking client); thumbnailing is CPU-bound → a process pool sized to the cores (Pillow does much of the work in C). Connect the stages with a bounded queue so downloads can’t outrun processing, write results as they finish, and track failures for retry.',
      explanation: py`Mixed workloads are best split into stages, each with the model that fits its bottleneck. In asyncio, the CPU stage can be called with \`loop.run_in_executor(process_pool, make_thumbnails, path)\`; pass file paths, not image bytes, to keep pickling cheap. Bounded queues provide backpressure. Measure each stage: whichever is slowest sets the overall throughput.`,
      whyAsked: 'Real jobs are rarely purely I/O- or CPU-bound; this checks whether you can decompose them.',
      mistakes: ['One model for everything', 'Ignoring the supplier’s rate limits', 'Sending image bytes to processes instead of paths', 'No backpressure between stages'],
      followUps: ['How would you size each stage?', 'How do you resume after a crash halfway through?', 'When would you move this to a distributed queue?'],
      modelAnswer: 'I’d treat it as a two-stage pipeline because the stages have different bottlenecks. Downloading is waiting on the network, so I’d use asyncio with an async client like httpx, a semaphore or worker pool sized to what the supplier allows, timeouts and retries with backoff. Thumbnailing is CPU work, so it goes to a process pool with about one worker per core; from the async side I’d call it via run_in_executor and pass file paths rather than image bytes so pickling stays cheap. A bounded queue between the stages gives backpressure, results are written as they finish, and failed ids are recorded so the job can resume. If it needed to run on several machines or survive deploys, I’d turn each image into a queued job instead.',
    },
    {
      id: 'choosing-concurrency-background-jobs',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'A web app generates PDF reports (10–60 s of CPU each) and emails them when users click "Export". Today it does this inside the request, and requests time out under load. Design the fix.',
      answer: 'Move the work to a task queue: the request validates input, creates a report record (status "pending") and enqueues a job with the report id, returning 202 with the id. Separate worker processes (Celery/RQ) render the PDF, store it (object storage), email a link, and update the status; the client polls or gets notified. Jobs are idempotent, have time limits and retries with backoff, and failures go to a dead-letter queue; workers scale independently, and queue length is monitored.',
      explanation: py`Long CPU work in web workers ties them up and makes latency unpredictable; in-process background tasks die on deploy. A broker-backed queue gives durability, retries and independent scaling. Idempotency matters because delivery is at least once. Passing an id (not the data) keeps messages small and lets the worker read fresh state.`,
      whyAsked: 'It tests system-level thinking about where work should run, not just which Python API to call.',
      mistakes: ['Spawning a thread per request for the PDF', 'Using asyncio for CPU-heavy rendering', 'No idempotency or status tracking', 'Putting the PDF bytes in the queue message'],
      followUps: ['How do you prevent two emails if a job is retried?', 'How do you scale workers separately from web servers?', 'What happens to queued jobs during a deploy?'],
      modelAnswer: 'Rendering and emailing don’t belong in the request. I’d have the endpoint validate the input, create a report row with status pending, enqueue a job carrying just the report id on Celery or RQ, and return 202 with that id. Separate worker processes pick up the job, render the PDF, upload it to object storage, email a link and mark the report done; the client polls the status endpoint or gets a notification. Because queues deliver at least once, the job is idempotent — it checks the status before emailing — and it has a time limit, retries with backoff and a dead-letter queue. Workers scale independently of the web tier, and I’d alert on queue length so we know when to add capacity.',
    },
    {
      id: 'choosing-concurrency-requests-script',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'An existing script calls an API 300 times with the requests library, one call after another, and takes several minutes. What is the quickest safe speed-up, and why not asyncio first?',
      options: [
        'Rewrite everything with asyncio',
        'Wrap the call in a function and run it with a ThreadPoolExecutor of moderate size',
        'Use a ProcessPoolExecutor with one process per call',
        'Nothing can be done because of the GIL',
      ],
      correctOption: 1,
      answer: 'A ThreadPoolExecutor with a moderate number of workers (sized to the API’s limits) around the existing requests code: the work is I/O-bound, threads release the GIL while waiting, and nothing needs rewriting. asyncio would require replacing requests with an async client and making the call chain async — worth it for thousands of connections, not for 300 calls.',
      explanation: py`Waiting threads release the GIL, so the network waits overlap. Keep per-call timeouts, cap \`max_workers\` to respect rate limits, and collect results with \`pool.map\` or futures so exceptions surface. Processes would work but add start-up and pickling for no benefit.`,
      whyAsked: 'Checks pragmatic judgement: the right tool is often the one that fits existing code.',
      mistakes: ['Claiming the GIL prevents any speed-up', 'Unbounded threads hammering the API', 'Choosing processes for I/O'],
      followUps: ['How would you pick max_workers?', 'How would you handle failed calls?', 'At what point would asyncio become worth it?'],
      modelAnswer: 'The script is I/O-bound — almost all the time is spent waiting for the API — so the quickest win is to put the call in a function and run it through a ThreadPoolExecutor with a moderate worker count sized to the API’s rate limit. Threads release the GIL while they wait on the network, so the waits overlap, and the existing requests code doesn’t change. asyncio would also work, but it means swapping requests for an async client and making the call chain async, which is worth it for thousands of concurrent connections, not 300 calls. I’d keep timeouts on every call and collect results through futures so failures aren’t lost.',
    },
    {
      id: 'choosing-concurrency-measure-first',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Why should you measure before choosing a concurrency model, and what exactly would you measure?',
      answer: 'Because the right model depends on where the time goes, and intuition is often wrong. Measure wall time vs CPU time (time.perf_counter vs time.process_time) per stage to classify I/O- vs CPU-bound; profile (cProfile, py-spy) to find dominant functions; check downstream limits (connection pools, rate limits); and benchmark candidate models against the sequential baseline under realistic data sizes.',
      explanation: py`A job that "feels" CPU-heavy can be waiting on a database most of the time, and vice versa. If one step dominates, optimising it beats any concurrency. Measurements also tell you when to stop adding workers (efficiency) and protect against regressions.`,
      whyAsked: 'Senior engineers are expected to justify architecture choices with data.',
      mistakes: ['Choosing a model by habit or hype', 'Benchmarking with toy data', 'Measuring only total time, not per stage'],
      followUps: ['What does it mean if CPU time exceeds wall time?', 'How do you profile a running production process?', 'How would you present the results to your team?'],
      modelAnswer: 'Because every model only helps a particular kind of bottleneck, and people misjudge where time goes all the time. I’d first time the job and each stage with both perf_counter for wall time and process_time for CPU time: if CPU time is close to wall time it’s CPU-bound, if it’s a small fraction it’s waiting. Then I’d profile with cProfile or py-spy to see which functions dominate — often one query or loop is the real problem and fixing it beats any concurrency. I’d check downstream limits like connection pools and rate limits, and finally benchmark the candidate model against the sequential baseline on realistic data, adding workers until the efficiency drops off.',
    },
    {
      id: 'choosing-concurrency-scaling-report',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'You timed a CPU-bound job with different numbers of worker processes. Write `scaling_report(timings)` returning `{workers: (speedup, efficiency)}` (both rounded to 2 decimals; speedup = time with 1 worker ÷ time with n; efficiency = speedup ÷ n), and `best_workers(timings, min_efficiency=0.5)` returning the **largest** worker count whose efficiency is at least `min_efficiency`. `timings` maps worker counts to seconds and must contain `1` — otherwise raise `ValueError`.',
      answer: 'Take base = timings[1]; for each n compute speedup = base / t and efficiency = speedup / n, rounded; best_workers filters by efficiency and returns the maximum n.',
      explanation: py`Speed-up alone keeps rising slowly as you add workers; *efficiency* shows how much each worker still contributes. Picking the largest count above an efficiency threshold balances speed against wasted cores — and the numbers come from measurement, which captures overheads Amdahl's law alone doesn't (start-up, pickling, memory bandwidth). The example data in the starter is illustrative, not a benchmark.`,
      starter: { files: { 'main.py': py`def scaling_report(timings):
    # TODO: {workers: (speedup, efficiency)}
    return {}


def best_workers(timings, min_efficiency=0.5):
    # TODO: the largest worker count that is still efficient enough
    return 1


# example measurements (illustrative data): workers -> seconds
timings = {1: 12.0, 2: 6.5, 4: 3.6, 8: 3.4}
print(scaling_report(timings))
print(best_workers(timings))     # 4
` } },
      tests: [
        { name: 'speed-up and efficiency for each worker count', code: py`report = scaling_report({1: 12.0, 2: 6.5, 4: 3.6, 8: 3.4})
assert report == {1: (1.0, 1.0), 2: (1.85, 0.92), 4: (3.33, 0.83), 8: (3.53, 0.44)}` },
        { name: 'picks the largest efficient worker count', code: py`assert best_workers({1: 12.0, 2: 6.5, 4: 3.6, 8: 3.4}) == 4` },
        { name: 'a stricter threshold picks fewer workers', code: py`assert best_workers({1: 12.0, 2: 6.5, 4: 3.6, 8: 3.4}, min_efficiency=0.9) == 2` },
        { name: 'perfect scaling keeps every worker', code: py`assert best_workers({1: 8.0, 2: 4.0, 4: 2.0}) == 4` },
        { name: 'timings without a 1-worker baseline raise ValueError', code: py`with raises(ValueError):
    scaling_report({2: 5.0, 4: 3.0})` },
      ],
      solution: { files: { 'main.py': py`def scaling_report(timings):
    if 1 not in timings:
        raise ValueError("timings need a 1-worker baseline")
    base = timings[1]
    report = {}
    for workers, seconds in sorted(timings.items()):
        speedup = base / seconds
        report[workers] = (round(speedup, 2), round(speedup / workers, 2))
    return report


def best_workers(timings, min_efficiency=0.5):
    report = scaling_report(timings)
    efficient = [workers for workers, (_, efficiency) in report.items() if efficiency >= min_efficiency]
    return max(efficient)


# example measurements (illustrative data): workers -> seconds
timings = {1: 12.0, 2: 6.5, 4: 3.6, 8: 3.4}
print(scaling_report(timings))
print(best_workers(timings))     # 4
` } },
      hints: ['Speed-up is the baseline time divided by the time with n workers.', 'Filter the report by efficiency and take max() of the remaining worker counts — 1 always qualifies when min_efficiency <= 1.'],
      whyAsked: 'It shows you can turn benchmark numbers into a sizing decision instead of guessing pool sizes.',
      mistakes: ['Choosing the count with the highest speed-up regardless of cost', 'Dividing the wrong way round', 'Forgetting the baseline check'],
      followUps: ['Why does efficiency drop as workers increase?', 'How does Amdahl’s law predict this curve?', 'How many repetitions would you time, and why?'],
      modelAnswer: 'I take the one-worker time as the baseline and raise a ValueError if it’s missing. For each worker count, speed-up is baseline divided by that time, and efficiency is speed-up divided by the number of workers; I round both to two decimals and return them in a dict. best_workers builds the report, keeps the counts whose efficiency meets the threshold and returns the largest. With the example data, going from 4 to 8 workers barely helps — efficiency falls to 0.44 — so 4 is the sensible choice. In practice I’d time each configuration several times and use the median to avoid noise.',
    },
    {
      id: 'choosing-concurrency-free-threading-impact',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does the free-threaded CPython build (supported, not default, in 3.14) change the concurrency decision guide?',
      answer: 'Only one branch changes: CPU-bound Python can run in parallel on threads, so a thread pool becomes a candidate instead of processes — no pickling, shared memory, cheaper start-up. Conditions: all C extensions must support free-threading (or the GIL is re-enabled), shared state needs proper locking (races become more frequent), and single-threaded performance is somewhat lower, so measure. I/O-bound guidance and the need for task queues stay the same.',
      explanation: py`Free-threading removes the main reason processes were needed for CPU-bound Python, but not their other benefits (isolation, crash containment) — and it's not the default interpreter. Check with \`sys._is_gil_enabled()\`. Many teams will keep processes until their dependency stack and measurements justify switching.`,
      whyAsked: 'It tests whether you understand *why* the guide says what it says, and whether you track the language’s evolution.',
      mistakes: ['Saying Python 3.14 removed the GIL by default', 'Assuming every program gets faster', 'Forgetting extension compatibility and thread safety'],
      followUps: ['How do you check whether the GIL is enabled at runtime?', 'What benefits do processes keep even without a GIL?', 'How would you trial the free-threaded build safely?'],
      modelAnswer: 'It changes one branch of the guide. On the free-threaded build threads can execute Python bytecode in parallel, so for CPU-bound Python a thread pool becomes a real alternative to processes — no pickling, shared memory, cheaper start-up. But it’s an optional build in 3.14, not the default, every C extension has to support it or the GIL comes back, shared state now races much more readily, and single-threaded code is somewhat slower. So I’d trial it on a CPU-bound workload with sys._is_gil_enabled checks and benchmarks. Everything else stays: waiting is still best overlapped with asyncio or threads, and durable work still needs a queue — and processes keep their isolation advantages.',
    },
    {
      id: 'choosing-concurrency-web-server-layers',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Explain how a typical production Python web deployment combines processes, threads and asyncio. Why not just one of them?',
      answer: 'A server like Gunicorn or Uvicorn runs several worker processes (to use all cores and isolate crashes and memory leaks); inside each, either a thread pool (WSGI apps such as Django/Flask with --threads) or an asyncio event loop (ASGI apps such as FastAPI) handles many concurrent requests that mostly wait on databases and APIs; slow or durable work is pushed to a task queue with its own worker processes. Each layer addresses a different bottleneck: CPU cores, I/O waiting, and long-running reliable work.',
      explanation: py`Processes alone would need one process per concurrent request (memory-heavy); one event loop alone uses one core and is fragile to blocking code; threads alone are limited by the GIL for Python execution. Sizing: processes ≈ cores (more with memory headroom), threads or connections sized to downstream limits, queue workers scaled by queue length.`,
      whyAsked: 'It connects the theory of the concurrency level to how production systems are actually run.',
      mistakes: ['Thinking a single asyncio process uses all cores', 'Setting hundreds of processes per machine', 'Running long jobs inside web workers'],
      followUps: ['How many worker processes would you start on an 8-core machine?', 'What happens when one worker process crashes?', 'How do database connection pools interact with these numbers?'],
      modelAnswer: 'Production deployments layer the models because each solves a different problem. The server, say Gunicorn or Uvicorn, starts several worker processes — roughly one per core — so Python code runs on all cores and a crash or leak only takes out one worker. Inside each process, requests mostly wait on databases and APIs, so either a small thread pool handles them for WSGI apps like Django and Flask, or an asyncio event loop handles them for ASGI apps like FastAPI. Anything slow or that must not be lost, like reports or emails, goes to a task queue with separate worker processes that scale on their own. Using only one model would either waste memory, use a single core, or tie up web workers with long jobs; and the total connection count across all of this has to fit the database’s pool.',
    },
  ],

  takeaways: [
    'Measure first: wall time vs CPU time per stage, then profile — fix a dominant slow step before adding concurrency.',
    'Ask in order: must the work outlive the process (task queue)? Is there anything to overlap (else sequential)? Waiting or computing?',
    'Waiting → asyncio with async libraries, or a bounded thread pool with blocking ones.',
    'Computing → vectorise if possible, otherwise processes sized to the cores (threads only on a free-threaded build, after measuring).',
    'Size I/O concurrency with Little’s law and downstream limits; size CPU pools by cores and efficiency.',
    'Real systems layer models: processes × (threads or event loop) for web serving, plus task queues for slow, durable jobs.',
    'Bound everything, make queued jobs idempotent, and re-measure after each change.',
  ],
}
