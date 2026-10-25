// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PRICES = py`import asyncio

# shop -> (seconds the shop takes to answer, price; None means the shop is down)
SHOPS = {
    "acme": (0.1, 19.99),
    "bolt": (0.3, 18.49),
    "corner": (0.05, None),
    "delta": (0.15, 21.00),
}
LIMIT = 2         # at most this many requests in flight at once
TIMEOUT = 0.2     # seconds we are willing to wait for one shop
in_flight = 0


async def fetch_price(shop):
    """A fake HTTP request (simplified: the sandbox has no network)."""
    delay, price = SHOPS[shop]
    await asyncio.sleep(delay)
    if price is None:
        raise ConnectionError(f"{shop} is down")
    return price


async def check(shop, limit):
    global in_flight
    async with limit:                              # wait for a free slot
        in_flight += 1
        print(f"  asking {shop} ({in_flight} in flight)")
        try:
            async with asyncio.timeout(TIMEOUT):   # 3.11+
                return await fetch_price(shop)
        except (TimeoutError, ConnectionError) as error:
            return error                           # report it instead of crashing
        finally:
            in_flight -= 1


async def main():
    limit = asyncio.Semaphore(LIMIT)
    async with asyncio.TaskGroup() as tg:          # 3.11+
        tasks = {shop: tg.create_task(check(shop, limit)) for shop in SHOPS}
    # leaving the block means every task has finished
    prices = {}
    for shop, task in tasks.items():
        result = task.result()
        if isinstance(result, Exception):
            print(f"{shop}: failed ({result!r})")
        else:
            prices[shop] = result
            print(f"{shop}: {result:.2f}")
    best = min(prices, key=prices.get)
    print(f"best price: {best} at {prices[best]:.2f}")


asyncio.run(main())
`

export default {
  id: 'asyncio-in-practice',
  title: 'asyncio in practice: tasks, timeouts & limits',
  summary: 'Real async programs start tasks and keep track of them, wait with timeouts, cancel cleanly, limit how much runs at once, pass work through queues — and keep blocking code off the event loop.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['asyncio-basics', 'exception-groups', 'context-managers'],
  related: ['asyncio-basics', 'exception-groups', 'threading', 'multiprocessing', 'choosing-concurrency', 'context-managers', 'http-clients', 'project-async-pipeline'],
  tags: ['asyncio', 'create_task', 'Task', 'gather', 'return_exceptions', 'TaskGroup', 'ExceptionGroup', 'except*', 'timeout', 'wait_for', 'TimeoutError', 'cancel', 'CancelledError', 'Semaphore', 'asyncio.Queue', 'producer consumer', 'async with', 'async for', 'to_thread', 'run_in_executor', 'httpx', 'aiohttp'],
  apis: [
    { name: 'asyncio.create_task(coro, name=None)', summary: 'Schedules a coroutine as a Task that runs independently; returns the Task. Keep a reference to it.' },
    { name: 'asyncio.gather(*aws, return_exceptions=False)', summary: 'Runs awaitables concurrently and returns results in argument order; with return_exceptions=True, exceptions are returned as values.' },
    { name: 'asyncio.TaskGroup()', summary: '(3.11+) async with block that owns its tasks: waits for all of them, and if one fails cancels the rest and raises an ExceptionGroup.' },
    { name: 'asyncio.timeout(delay)', summary: '(3.11+) async with block that cancels its body after delay seconds and raises TimeoutError.' },
    { name: 'asyncio.wait_for(aw, timeout)', summary: 'Awaits aw; on timeout cancels it and raises TimeoutError.' },
    { name: 'Task.cancel()', summary: 'Requests cancellation: a CancelledError is thrown into the coroutine at its current await.' },
    { name: 'asyncio.Semaphore(n)', summary: 'async with sem: lets at most n tasks into the block at once.' },
    { name: 'asyncio.Queue(maxsize=0)', summary: 'A FIFO queue for tasks: await put()/get(), task_done(), await join(). shutdown() is 3.13+.' },
    { name: 'asyncio.as_completed(aws)', summary: 'Iterate over awaitables in the order they finish.' },
    { name: 'asyncio.to_thread(func, *args)', summary: '(3.9+) Runs a blocking function in a worker thread and awaits its result.' },
    { name: 'loop.run_in_executor(executor, func, *args)', summary: 'Runs func in a thread or process pool executor and returns an awaitable future.' },
  ],
  docs: [
    { label: 'asyncio — coroutines and tasks (TaskGroup, timeouts, cancellation)', url: 'https://docs.python.org/3/library/asyncio-task.html' },
    { label: 'asyncio — synchronization primitives (Lock, Semaphore, Event)', url: 'https://docs.python.org/3/library/asyncio-sync.html' },
    { label: 'asyncio — queues', url: 'https://docs.python.org/3/library/asyncio-queue.html' },
    { label: 'Developing with asyncio', url: 'https://docs.python.org/3/library/asyncio-dev.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`In [async/await & the event loop](lesson:asyncio-basics) you learned the core idea: coroutines pause at \`await\`, and \`gather\` lets their waits overlap. Real programs need more control:`,
    py`- start work in the background and collect it later (**tasks**);
- stop waiting for something that's too slow (**timeouts**) and stop work you no longer need (**cancellation**);
- make sure one failure doesn't leave half-finished tasks lying around (**TaskGroup**);
- not overwhelm a server with 10,000 requests at once (**Semaphore**, **Queue**);
- use libraries that weren't written for asyncio without freezing the loop (**to_thread**, **run_in_executor**).`,
    py`This lesson is a tour of those tools with one running example: checking prices at several shops, with a concurrency limit, a timeout per shop, and failures reported instead of crashing the program.`,
    { callout: 'version', title: 'Python 3.11+', text: py`\`asyncio.TaskGroup\` and \`asyncio.timeout()\` were added in **Python 3.11**, together with \`ExceptionGroup\` and \`except*\`. Since 3.11, \`asyncio.TimeoutError\` is the same class as the built-in \`TimeoutError\`. On older versions use \`gather\` and \`wait_for\`.` },
  ],
  why: [
    py`**Unbounded concurrency breaks things.** Starting 10,000 requests at once can exhaust sockets and memory, trip rate limits, or take down the service you're calling. A limit keeps you a good citizen and makes performance predictable.`,
    py`**Networks are unreliable.** Some calls hang forever. Without timeouts, one stuck server can stall your whole program; without cancellation, abandoned work keeps running and leaking resources.`,
    py`**Errors must not vanish.** A background task that crashes silently, or a sibling that keeps running after its partner failed, causes the hardest bugs in async code. \`TaskGroup\` gives *structured concurrency*: tasks can't outlive the block that started them.`,
    py`**Not everything is async.** Real projects mix async code with blocking libraries and CPU-heavy work. Knowing how to move those off the event loop is what keeps an async service responsive.`,
  ],
  eli15: [
    py`Imagine you're organising a group order for lunch from several restaurants.`,
    py`- You don't call one restaurant and wait on hold before calling the next — you put several calls on **speaker phones** at once (**tasks**).
- You only have **two phones**, so at most two calls happen at a time; the others wait for a free phone (**Semaphore**).
- If a restaurant keeps you on hold for more than a minute, you hang up and move on (**timeout**).
- If the whole lunch gets cancelled, you hang up **every** call still going (**cancellation**), and the TaskGroup is the rule "nobody leaves the room with a call still open".`,
    py`One person (one thread) is managing everything — it works because most of the time is spent *waiting on hold*.`,
  ],
  analogy: {
    title: 'A dispatcher running a delivery team',
    body: [
      py`A dispatcher sends drivers out on jobs (\`create_task\`) and keeps the list of who is out (the task references). The depot has only a few vans, so drivers wait at the depot until a van is free (\`Semaphore\`). New orders go on a board that drivers take from when they're free (\`Queue\`).`,
      py`Every job has a deadline; a driver stuck in traffic too long is called back (\`timeout\`, \`cancel\`). And the shift rule says: if one job goes badly wrong, call everyone back and report every problem together (\`TaskGroup\` and \`ExceptionGroup\`). Heavy paperwork that would keep the dispatcher off the radio is handed to an assistant in the back office (\`to_thread\`).`,
    ],
    mapping: [
      ['sending a driver out', 'asyncio.create_task(coro)'],
      ['the dispatcher’s list of drivers out on jobs', 'keeping references to tasks (a set, or a TaskGroup)'],
      ['only three vans', 'asyncio.Semaphore(3)'],
      ['the order board', 'asyncio.Queue between producers and workers'],
      ['calling a driver back after the deadline', 'asyncio.timeout() / Task.cancel()'],
      ['"one job failed: everyone come back, report all problems"', 'TaskGroup cancelling siblings and raising an ExceptionGroup'],
      ['handing paperwork to the back office', 'asyncio.to_thread / run_in_executor'],
    ],
  },
  visual: {
    type: 'asyncio-loop',
    title: 'create_task schedules — it doesn’t run yet',
    props: { preset: 'create-task' },
    alt: 'An event loop stepper. main calls create_task(ping("A")), which puts task A in the ready queue but does not run it; main prints "task created", then awaits ping("B") inside its own task, which prints "ping B" and yields at sleep(0). Task A then runs and prints "ping A", main resumes and prints "pong B", then awaits task A, which prints "pong A".',
    caption: py`Press ▶. \`create_task\` puts the new task in the **ready queue**; it only starts when the current task reaches an \`await\` that gives the loop back. Final order: task created, ping B, ping A, pong B, pong A.`,
  },
  syntax: [
    py`#### Tasks: start now, collect later`,
    { code: py`import asyncio


async def fetch(name, seconds):
    await asyncio.sleep(seconds)
    return f"{name} data"


async def main():
    weather = asyncio.create_task(fetch("weather", 0.2))   # starts at the next await
    news = asyncio.create_task(fetch("news", 0.1))
    print("both requests sent")
    print(await weather, "|", await news)                  # about 0.2 s in total


asyncio.run(main())`, lang: 'python', title: 'create_task' },
    py`A **task** runs independently once the loop gets control. Awaiting a task gives you its result (or raises its exception). The event loop keeps only a *weak* reference to tasks, so a task nobody references can be garbage-collected before it finishes. For fire-and-forget background work, keep references yourself:`,
    { code: py`background_tasks = set()


def start_in_background(coro):
    task = asyncio.create_task(coro)
    background_tasks.add(task)                        # strong reference
    task.add_done_callback(background_tasks.discard)  # forget it once it's done
    return task`, lang: 'python', title: 'the pattern recommended by the asyncio docs' },
    py`#### gather vs TaskGroup`,
    { code: py`import asyncio


async def load(name, seconds, fail=False):
    await asyncio.sleep(seconds)
    if fail:
        raise ValueError(f"{name} failed")
    return name


async def main():
    # gather: errors as values, every task runs to the end
    results = await asyncio.gather(load("a", 0.1), load("b", 0.05, fail=True), return_exceptions=True)
    print(results)                                   # ['a', ValueError('b failed')]

    # TaskGroup (3.11+): one failure cancels the others; errors come as an ExceptionGroup
    try:
        async with asyncio.TaskGroup() as tg:
            slow = tg.create_task(load("slow", 0.3))
            tg.create_task(load("broken", 0.05, fail=True))
    except* ValueError as group:
        print("failed:", group.exceptions)           # (ValueError('broken failed'),)
    print("slow cancelled?", slow.cancelled())       # True


asyncio.run(main())`, lang: 'python', title: 'two ways to run a batch' },
    py`- \`gather(...)\` returns results in argument order. Without \`return_exceptions\`, the **first** exception propagates to you — but the other tasks are **not** cancelled; they keep running unobserved. With \`return_exceptions=True\` you get exceptions back as list items.
- \`TaskGroup\` waits for every task created in it. If one fails, it **cancels the others**, waits for them to finish cancelling, and raises an \`ExceptionGroup\` with every error — handle it with \`except*\` (see [exception groups](lesson:exception-groups)). Prefer it for new code: tasks can never leak out of the block.`,
    py`#### Timeouts`,
    { code: py`import asyncio


async def slow_report():
    await asyncio.sleep(1)
    return "report"


async def main():
    try:
        async with asyncio.timeout(0.2):                  # 3.11+
            await slow_report()
    except TimeoutError:
        print("gave up after 0.2 s")

    try:
        await asyncio.wait_for(slow_report(), timeout=0.2)   # works on older versions too
    except TimeoutError:
        print("wait_for gave up too")


asyncio.run(main())`, lang: 'python', title: 'asyncio.timeout and wait_for' },
    py`Both work by **cancelling** the awaited work and turning the cancellation into a \`TimeoutError\` for you. \`asyncio.timeout()\` can wrap several awaits at once — handy for a deadline on a whole operation.`,
    py`#### Cancellation`,
    { code: py`import asyncio


async def upload(name):
    try:
        await asyncio.sleep(1)
        return "uploaded"
    except asyncio.CancelledError:
        print(f"cleaning up {name}")   # close files, roll back, release resources...
        raise                          # ...then ALWAYS re-raise


async def main():
    task = asyncio.create_task(upload("photo.jpg"))
    await asyncio.sleep(0.1)
    task.cancel()                      # request cancellation
    try:
        await task
    except asyncio.CancelledError:
        print("cancelled:", task.cancelled())   # cancelled: True


asyncio.run(main())`, lang: 'python', title: 'cancel(), CancelledError and cleanup' },
    py`\`task.cancel()\` throws \`CancelledError\` into the coroutine at the \`await\` where it's paused. Clean up in \`except\`/\`finally\` and **re-raise** — swallowing it breaks timeouts and TaskGroups. \`CancelledError\` inherits from \`BaseException\` (since 3.8), so \`except Exception:\` doesn't catch it by accident.`,
    py`#### Limiting concurrency: Semaphore`,
    { code: py`import asyncio


async def download(url, limit):
    async with limit:                 # at most 5 tasks inside this block at once
        await asyncio.sleep(0.1)      # the request
        return url


async def main():
    limit = asyncio.Semaphore(5)
    urls = [f"https://example.com/{n}" for n in range(20)]
    pages = await asyncio.gather(*(download(url, limit) for url in urls))
    print(len(pages))                 # 20, in about 4 rounds of 5


asyncio.run(main())`, lang: 'python', title: 'Semaphore' },
    py`#### Producer / consumer: asyncio.Queue`,
    { code: py`import asyncio


async def producer(queue):
    for order in ["pizza", "pasta", "salad", "soup"]:
        await queue.put(order)        # waits if the queue is full (backpressure)


async def cook(name, queue):
    while True:
        order = await queue.get()
        await asyncio.sleep(0.05)     # cooking
        print(f"{name} cooked {order}")
        queue.task_done()


async def main():
    queue = asyncio.Queue(maxsize=2)
    cooks = [asyncio.create_task(cook(f"cook-{i}", queue)) for i in range(2)]
    await producer(queue)
    await queue.join()                # wait until every item got task_done()
    for c in cooks:
        c.cancel()                    # stop the idle workers


asyncio.run(main())`, lang: 'python', title: 'a fixed pool of worker tasks' },
    py`A queue gives you a *fixed number of workers* (here 2) no matter how much work arrives, plus backpressure through \`maxsize\`. Stop workers with sentinels, by cancelling them, or with \`queue.shutdown()\` (3.13+).`,
    py`#### async with and async for`,
    py`Async code has its own versions of the context-manager and iterator protocols: \`async with\` calls \`await obj.__aenter__()\` / \`await obj.__aexit__(...)\` (you've used it with \`Semaphore\`, \`timeout\` and \`TaskGroup\`), and \`async for\` calls \`await it.__anext__()\` for each item. An \`async def\` containing \`yield\` is an **async generator** — perfect for streaming results:`,
    { code: py`import asyncio


async def ticks(count):
    for n in range(count):
        await asyncio.sleep(0.01)     # e.g. wait for the next message from a socket
        yield n


async def main():
    async for n in ticks(3):
        print("tick", n)


asyncio.run(main())`, lang: 'python', title: 'an async generator' },
    py`#### Blocking code in async programs`,
    { code: py`import asyncio
from concurrent.futures import ProcessPoolExecutor

import requests                                 # a blocking library


def make_thumbnail(path):                       # CPU-heavy, pure Python
    ...


async def main():
    # blocking I/O: run it in a worker thread (3.9+)
    response = await asyncio.to_thread(requests.get, "https://example.com", timeout=10)

    # CPU-heavy work: run it in a process pool
    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor() as pool:
        thumb = await loop.run_in_executor(pool, make_thumbnail, "cat.jpg")


if __name__ == "__main__":
    asyncio.run(main())`, lang: 'python', title: 'to_thread and run_in_executor (run locally)', static: true },
    py`Both keep the event loop free while the blocking work runs elsewhere. Use threads for blocking I/O; on standard CPython, use a process pool for CPU-heavy work (threads would hold the GIL). Neither can run in this browser sandbox, where threads and processes can't start.`,
    py`#### Async libraries`,
    { code: py`import asyncio

import httpx                                    # pip install httpx


async def main():
    async with httpx.AsyncClient(timeout=10) as client:      # one client, reused connections
        responses = await asyncio.gather(
            client.get("https://www.python.org"),
            client.get("https://docs.python.org/3/"),
        )
    print([r.status_code for r in responses])


asyncio.run(main())`, lang: 'python', title: 'httpx (third-party, run locally)', static: true },
    py`\`httpx.AsyncClient\` and \`aiohttp.ClientSession\` are the common async HTTP clients; \`asyncpg\` and the async modes of SQLAlchemy cover databases. Create **one** client/session and reuse it — it pools connections. See [HTTP clients](lesson:http-clients).`,
  ],
  walkthrough: {
    title: 'Reading the price checker',
    lang: 'python',
    code: PRICES,
    intro: py`This is the playground program (press **Guide** there to step through it). \`fetch_price\` is a **simplified** stand-in for an HTTP call — the sandbox has no network — but every asyncio tool around it is the real thing.`,
    steps: [
      { lines: [3, 12], text: py`Four shops: each answers after some delay with a price, or fails. \`LIMIT\` caps how many requests are in flight; \`TIMEOUT\` is how long we wait for one shop. \`in_flight\` lets us watch the limit work.` },
      { lines: [15, 21], text: py`The fake request: sleep (the network), then return a price or raise \`ConnectionError\`.` },
      { lines: [24, 27], text: py`\`async with limit:\` — the Semaphore. Only \`LIMIT\` tasks can be inside this block; the others wait at this line until someone leaves.` },
      { lines: [29, 35], text: py`\`asyncio.timeout(TIMEOUT)\` cancels the request if it takes too long and raises \`TimeoutError\`. Expected failures are **returned** as values so one bad shop doesn't crash the batch; \`finally\` keeps the in-flight count right whatever happens.` },
      { lines: [38, 41], text: py`A \`TaskGroup\` starts one task per shop and doesn't let the program continue until all of them are done. The tasks are kept in a dict so their results can be read afterwards.` },
      { lines: [43, 52], text: py`\`task.result()\` gives each task's return value. Errors are reported, prices collected, and the cheapest shop is picked with \`min(..., key=prices.get)\`.` },
    ],
  },
  playground: {
    title: 'Price checker: limits, timeouts, failures',
    objective: 'Run it, explain each line of output, then tune the timeout and limit and see what happens when an error escapes the TaskGroup.',
    files: { 'main.py': PRICES },
    expected: py`\`\`\`text
  asking acme (1 in flight)
  asking bolt (2 in flight)
  asking corner (2 in flight)
  asking delta (2 in flight)
acme: 19.99
bolt: failed (TimeoutError())
corner: failed (ConnectionError('corner is down'))
delta: 21.00
best price: acme at 19.99
\`\`\`

Never more than 2 in flight: \`corner\` only starts when \`acme\` finishes, \`delta\` when \`corner\` fails. \`bolt\` is the cheapest — but it answers too slowly.`,
    experiments: [
      {
        id: 'patience',
        task: py`bolt has the best price but needs 0.3 s. Raise \`TIMEOUT\` so that bolt answers in time, and predict the new best price.`,
        hint: py`\`TIMEOUT = 0.35\` is enough.`,
        tests: [{ name: 'bolt now wins', code: py`assert "best price: bolt" in output, 'Give bolt enough time to answer'` }],
        explain: py`Timeouts are a trade-off between completeness and latency: a longer timeout catches slow-but-good answers, a shorter one keeps your program snappy when a server hangs. Production code usually sets a timeout per call **and** an overall deadline.`,
      },
      {
        id: 'one-at-a-time',
        task: py`Set \`LIMIT = 1\`. Predict the "in flight" numbers, then run it.`,
        hint: py`Only the \`LIMIT = 2\` line changes.`,
        tests: [{ name: 'never more than one request in flight', code: py`assert "(2 in flight)" not in output and "asking delta" in output` }],
        explain: py`With a semaphore of 1 the tasks still exist concurrently, but only one at a time may make a request — effectively sequential. The limit is how you balance speed against load on the server; one global semaphore shared by all tasks is the simplest rate-control tool in asyncio.`,
      },
      {
        id: 'let-it-crash',
        task: py`In \`check\`, change \`except (TimeoutError, ConnectionError) as error:\` to \`except TimeoutError as error:\`. Run it and read the traceback. Which shops were asked, and what happened to the others? Undo the change afterwards.`,
        hint: py`Look for \`ExceptionGroup: unhandled errors in a TaskGroup\` and the \`ConnectionError\` inside it.`,
        explain: py`The \`ConnectionError\` now escapes \`corner\`'s task. The TaskGroup reacts by **cancelling** the sibling tasks still running (\`bolt\` and \`delta\`), waiting for them, and raising an \`ExceptionGroup\` containing the error. Nothing keeps running in the background unobserved. To handle it at the group level you'd write \`except* ConnectionError:\` around the \`async with\` ([exception groups](lesson:exception-groups)).`,
      },
      {
        id: 'add-shop',
        task: py`Add a fifth shop, \`"echo": (0.05, 17.50)\`, to \`SHOPS\`. Predict when it gets asked (with \`LIMIT = 2\`) and what the best price becomes.`,
        hint: py`Add the entry to the \`SHOPS\` dict; nothing else changes.`,
        tests: [
          { name: 'echo was asked', code: py`assert "asking echo" in output` },
          { name: 'echo has the best price', code: py`assert "best price: echo" in output` },
        ],
        explain: py`echo is created last, so it waits for a free slot behind the other shops — the semaphore wakes waiters in the order they arrived. Adding work changes nothing else in the code: the TaskGroup, the limit and the timeout apply to every shop automatically.`,
      },
    ],
  },
  animation: {
    type: 'asyncio-loop',
    title: 'One blocking call freezes every task',
    props: { preset: 'blocking' },
    alt: 'An event loop stepper where a heartbeat task should print "beat" every 0.1 s while slow_report calls time.sleep(0.3). After the first beat, the report task blocks the thread; the heartbeat’s timer fires at 0.1 s but cannot run until the report finishes at 0.3 s, so the second beat arrives 0.2 s late.',
    caption: py`Timeouts and cancellation only take effect at an \`await\`. While \`time.sleep\` (or any blocking call) runs, the loop can't fire timers, run other tasks or even cancel the blocking one. Move such work to \`asyncio.to_thread\` or an executor.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A **Task** is a coroutine that the event loop has taken charge of. You get one back from \`create_task\`, and you can ask it things: \`done()\`, \`result()\`, \`cancelled()\`, \`cancel()\`. When you \`await\` a task, you wait for it without blocking the other tasks.`,
      py`**Cancelling** a task doesn't stop it instantly: the loop delivers a \`CancelledError\` the next time the task is paused at an \`await\`. That's what makes cleanup possible — and why a task stuck in a blocking call can't be cancelled until the call returns.`,
      py`A **timeout** is just cancellation with a timer: "if this isn't done in 2 seconds, cancel it and tell me with a \`TimeoutError\`."`,
    ],
    technical: [
      py`#### How cancellation travels`,
      py`\`task.cancel()\` marks the task; on its next step the loop calls \`coro.throw(CancelledError())\`, so the exception appears **at the \`await\` where the coroutine is suspended** and propagates up through its \`try\`/\`finally\` blocks. If the coroutine is awaiting another task or future, that inner one is cancelled too. \`Task.cancelling()\` and \`Task.uncancel()\` (3.11+) track pending cancellation requests; \`asyncio.timeout()\` and \`TaskGroup\` use them to tell *their* cancellations apart from one requested by someone else — another reason never to swallow \`CancelledError\`.`,
      py`#### Structured concurrency`,
      py`\`TaskGroup.__aexit__\` waits for all child tasks. When the first child fails with an exception other than \`CancelledError\`, the group cancels the remaining children *and the task running the \`async with\` body*, waits for everything to settle, then raises \`ExceptionGroup\` (or \`BaseExceptionGroup\`) with all the failures. The guarantee: when the block exits, no child task is still running.`,
      py`#### gather's subtleties`,
      py`If \`gather\` itself is cancelled, it cancels all its children. But if a child *fails* and \`return_exceptions\` is \`False\`, \`gather\` raises immediately and leaves the other children running. Their results and errors are then never observed, which can produce \`Task exception was never retrieved\` messages later. \`TaskGroup\` avoids this class of bug.`,
      py`#### Weak references to tasks`,
      py`The loop's set of all tasks holds them weakly; the ready queue holds a task only while it is scheduled to run. A task waiting on a timer or socket may be referenced only by the future it's waiting on, so if your code dropped its reference, it can be garbage-collected mid-flight — and you may see \`Task was destroyed but it is pending!\`. Hence the "keep a set of background tasks" pattern.`,
      py`#### Executors`,
      py`\`loop.run_in_executor(executor, fn, *args)\` submits \`fn\` to a \`concurrent.futures\` executor (the loop's default thread pool if \`executor\` is \`None\`) and wraps the resulting future so coroutines can await it. \`asyncio.to_thread()\` is a convenience wrapper that also copies the current \`contextvars\` context into the thread. Cancelling the awaiting coroutine does **not** stop a function already running in a thread.`,
    ],
    production: [
      py`**Every network call gets a timeout.** Use library timeouts (\`httpx.AsyncClient(timeout=10)\`) plus \`asyncio.timeout()\` around operations made of several steps, so a stuck dependency becomes a handled \`TimeoutError\`, not a stuck request.`,
      py`**Bound everything.** A semaphore per external service (sized to its rate limits), bounded queues (\`maxsize\`) between pipeline stages, a fixed number of worker tasks. Unbounded \`gather\` over a list of 100,000 coroutines creates 100,000 tasks at once.`,
      py`**Prefer TaskGroup for batches; track background tasks.** Fire-and-forget tasks need a reference *and* a done-callback that logs exceptions. Long-lived background workers are best started and cancelled in one place, such as an application's startup and shutdown hooks.`,
      py`**Shut down gracefully.** \`asyncio.run()\` cancels leftover tasks when \`main()\` returns; make sure they handle \`CancelledError\` by cleaning up and re-raising. For servers, stop accepting new work, let in-flight work finish (with a deadline), then cancel the rest.`,
      py`**Debugging tools.** \`asyncio.run(main(), debug=True)\` reports slow callbacks and never-awaited coroutines; \`asyncio.all_tasks()\` lists running tasks; Python 3.14 adds \`python -m asyncio ps <PID>\` and \`python -m asyncio pstree <PID>\` to inspect the tasks of a running process from outside.`,
      py`**Know when asyncio isn't the answer.** CPU-heavy work belongs in a process pool or a separate worker system; a mostly-blocking codebase may be simpler with threads. [Choosing a concurrency model](lesson:choosing-concurrency) compares the options.`,
    ],
  },
  mistakes: [
    {
      title: 'Fire-and-forget without keeping a reference',
      wrong: { code: py`async def handle_signup(user):
    asyncio.create_task(send_welcome_email(user))   # may be garbage-collected; errors vanish
    return "ok"`, lang: 'python', static: true },
      right: { code: py`background_tasks = set()

async def handle_signup(user):
    task = asyncio.create_task(send_welcome_email(user))
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)
    return "ok"`, lang: 'python', static: true },
      explanation: py`The loop only keeps weak references to tasks. Keep a strong reference until the task is done (and ideally log its exception in a done-callback). For work that must survive restarts, use a real job queue instead.`,
    },
    {
      title: 'Swallowing CancelledError',
      wrong: { code: py`async def worker(queue):
    while True:
        try:
            item = await queue.get()
            await process(item)
        except BaseException:          # also catches CancelledError...
            log.exception("failed")    # ...so cancel() and timeouts never take effect`, lang: 'python', static: true },
      right: { code: py`async def worker(queue):
    while True:
        item = await queue.get()
        try:
            await process(item)
        except Exception:              # CancelledError is a BaseException: it passes through
            log.exception("failed")`, lang: 'python', static: true },
      explanation: py`Cancellation is delivered as an exception. Catch \`Exception\` for ordinary errors; if you must catch \`CancelledError\` (for cleanup), re-raise it. A task that swallows it can't be stopped by \`cancel()\`, \`timeout()\` or a failing \`TaskGroup\`.`,
    },
    {
      title: 'gather over an unbounded list',
      wrong: { code: py`pages = await asyncio.gather(*(fetch(url) for url in all_100k_urls))   # 100k sockets at once`, lang: 'python', static: true },
      right: { code: py`limit = asyncio.Semaphore(20)

async def polite_fetch(url):
    async with limit:
        return await fetch(url)

pages = await asyncio.gather(*(polite_fetch(url) for url in all_100k_urls))`, lang: 'python', static: true },
      explanation: py`Concurrency without a cap exhausts file descriptors and memory and hammers the server ("Too many open files", HTTP 429). A semaphore — or a fixed number of workers reading from a queue, which also avoids creating 100k task objects — keeps it bounded.`,
    },
    {
      title: 'Expecting a timeout to interrupt blocking code',
      wrong: { code: py`async with asyncio.timeout(1):
    data = requests.get(url).json()          # blocks: the timeout can't fire until it returns`, lang: 'python', static: true },
      right: { code: py`async with asyncio.timeout(1):
    data = await asyncio.to_thread(fetch_json, url)   # the loop stays free; fetch_json should set its own timeout too`, lang: 'python', static: true },
      explanation: py`Timeouts work by cancelling at an \`await\`. A blocking call has no \`await\`, so the loop — including the timeout's timer — is frozen until it returns. Make the work awaitable (async library, \`to_thread\`) and give the blocking call its own timeout, because cancelling the awaiting task doesn't stop a running thread.`,
    },
  ],
  debugging: [
    {
      symptom: py`Task was destroyed but it is pending!`,
      cause: py`A task was garbage-collected (no references left) or the loop closed while it was still running.`,
      fix: py`Keep references to background tasks (a set + \`add_done_callback(discard)\`), or use a \`TaskGroup\`; await or cancel tasks before \`main()\` returns.`,
    },
    {
      symptom: py`Task exception was never retrieved`,
      cause: py`A task raised and nobody awaited it or called \`result()\` — common with fire-and-forget tasks or after \`gather\` raised early.`,
      fix: py`Await every task, use a \`TaskGroup\`, or add a done-callback that logs \`task.exception()\`.`,
    },
    {
      symptom: py`ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)`,
      cause: py`A task inside a \`TaskGroup\` raised; the group cancelled the others and re-raised all errors as a group.`,
      fix: py`Handle expected errors inside the task, or around the group with \`except* SomeError:\`. Read every sub-exception in the traceback.`,
    },
    {
      symptom: py`A task ignores cancel() / a timeout never fires.`,
      cause: py`The task catches \`CancelledError\` (or \`BaseException\`) without re-raising, or it's stuck in a blocking call with no \`await\`.`,
      fix: py`Re-raise \`CancelledError\` after cleanup; replace blocking calls with async ones or \`to_thread\`.`,
    },
    {
      symptom: py`OSError: [Errno 24] Too many open files (or many HTTP 429 responses)`,
      cause: py`Unbounded concurrency: thousands of connections opened at once.`,
      fix: py`Limit concurrency with a \`Semaphore\` or a fixed pool of worker tasks reading from a \`Queue\`; reuse one HTTP client session.`,
    },
    {
      symptom: py`RuntimeError: can't start new thread (from asyncio.to_thread in this sandbox)`,
      cause: py`The browser sandbox can't create threads, so \`to_thread\` and \`run_in_executor\` are unavailable here.`,
      fix: py`Run that code on your own machine; in the playground, simulate blocking work with \`time.sleep\` to see its effect on the loop.`,
    },
  ],
  bestPractices: [
    'Use TaskGroup (3.11+) for batches of related tasks; use gather(return_exceptions=True) when you want every result regardless of failures.',
    'Keep references to every task you create, and make sure some code observes its result or exception.',
    'Put a timeout on every operation that talks to the outside world.',
    'Clean up in finally / except CancelledError and always re-raise CancelledError.',
    'Bound concurrency with a Semaphore or a fixed pool of worker tasks reading a bounded Queue.',
    'Reuse one async HTTP client/session; never call blocking libraries directly from coroutines.',
    'Move blocking I/O to asyncio.to_thread and CPU-heavy work to a process pool via run_in_executor.',
  ],
  useCases: [
    'Crawlers and API aggregators that call many endpoints with a concurrency cap and timeouts.',
    'Async web services that fan out to several backends per request and must not hang.',
    'Producer/consumer pipelines: read from a message broker, process with N workers, write results.',
    'Periodic background jobs (heartbeats, cache refresh) inside a long-running async app.',
    'Wrapping legacy blocking libraries in an async service with to_thread.',
  ],
  whenToUse: {
    use: [
      'TaskGroup: several tasks that succeed or fail together.',
      'gather(return_exceptions=True): independent tasks where partial results are useful.',
      'Semaphore / Queue workers: any batch larger than what the other side can handle at once.',
      'timeout / wait_for: anything that waits on the network, disk or another process.',
    ],
    avoid: [
      'create_task without keeping a reference or observing the result.',
      'except BaseException / except CancelledError without re-raising.',
      'to_thread for CPU-heavy pure Python on standard CPython (use a process pool).',
    ],
  },
  comparison: {
    title: 'Ways to run several coroutines',
    headers: ['', 'await one by one', 'gather', 'TaskGroup (3.11+)', 'Queue + workers'],
    rows: [
      ['runs concurrently', 'no', 'yes', 'yes', 'yes, N at a time'],
      ['result order', 'code order', 'argument order', 'read each task.result()', 'whatever the workers record'],
      ['when one fails', 'stops at that line', 'raises first error; others keep running (or errors as values)', 'cancels the others; ExceptionGroup with all errors', 'you decide inside the worker'],
      ['limits concurrency', 'trivially (1)', 'only with a Semaphore', 'only with a Semaphore', 'yes: number of workers'],
      ['best for', 'dependent steps', 'small fixed batches, partial results', 'all-or-nothing batches', 'large or streaming workloads'],
    ],
    note: py`\`asyncio.as_completed()\` is a fifth option when you want to handle results as soon as each one finishes.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'asyncio-in-practice-q1',
      type: 'mcq',
      prompt: 'Why should you keep a reference to a task created with `asyncio.create_task()` for background work?',
      options: [
        { text: 'Without a reference the task never starts', why: 'It is scheduled immediately; the problem comes later, while it is waiting.' },
        'The event loop only keeps weak references, so an unreferenced task can be garbage-collected before it finishes',
        { text: 'create_task returns a coroutine that must be awaited to run', why: 'It returns a Task, which runs on its own once the loop gets control.' },
        { text: 'References are needed to run tasks in parallel on several cores', why: 'All tasks share one thread; references are about lifetime, not parallelism.' },
      ],
      answer: 1,
      explanation: py`Keep tasks in a collection (and discard them when done), or use a \`TaskGroup\`. That also gives you a way to observe their exceptions.`,
    },
    {
      id: 'asyncio-in-practice-q2',
      type: 'output',
      prompt: 'What does this print, line by line?',
      code: py`import asyncio

async def job(name):
    print("start", name)
    await asyncio.sleep(0)
    print("end", name)

async def main():
    task = asyncio.create_task(job("A"))
    print("created")
    await task
    print("main done")

asyncio.run(main())`,
      options: [
        { text: 'start A, created, end A, main done', why: 'create_task only schedules the task; it can’t run until main gives up control at an await.' },
        'created, start A, end A, main done',
        { text: 'created, main done, start A, end A', why: 'await task makes main wait until A has finished.' },
        { text: 'created, start A, main done, end A', why: 'main resumes only after the task is completely done.' },
      ],
      answer: 1,
      explanation: py`The new task sits in the ready queue while \`main\` keeps running and prints "created". At \`await task\`, \`main\` pauses; A runs ("start A"), yields at \`sleep(0)\`, resumes ("end A") and finishes; then \`main\` continues.`,
    },
    {
      id: 'asyncio-in-practice-q3',
      type: 'bug',
      prompt: '`main` cancels the heartbeat after 2.5 s, but `await task` never returns. Click the line responsible.',
      code: py`import asyncio

async def heartbeat():
    while True:
        try:
            print("beat")
            await asyncio.sleep(1)
        except asyncio.CancelledError:
            print("cleaning up")
            continue

async def main():
    task = asyncio.create_task(heartbeat())
    await asyncio.sleep(2.5)
    task.cancel()
    await task

asyncio.run(main())`,
      answerLine: 10,
      explanation: py`The handler swallows the cancellation and loops again, so the task never finishes. After cleaning up, write \`raise\` instead of \`continue\` — then \`await task\` raises \`CancelledError\` in \`main\` (catch it there if that's expected).`,
    },
    {
      id: 'asyncio-in-practice-q4',
      type: 'fill',
      prompt: 'Complete the code: run both downloads in a task group (Python 3.11+).',
      code: py`async def main():
    async with asyncio.___() as tg:
        a = tg.___(download("a.csv"))
        b = tg.___(download("b.csv"))
    print(a.result(), b.result())`,
      answer: [['TaskGroup'], ['create_task'], ['create_task']],
      explanation: py`\`asyncio.TaskGroup()\` is used with \`async with\`; \`tg.create_task(...)\` starts each task in the group. The block exits only when both are done, so \`result()\` is safe afterwards.`,
    },
    {
      id: 'asyncio-in-practice-q5',
      type: 'mcq',
      prompt: 'One of three coroutines passed to `asyncio.gather(a(), b(), c(), return_exceptions=True)` raises `ValueError`. What happens?',
      options: [
        { text: 'gather raises the ValueError immediately', why: 'That is the behaviour without return_exceptions=True.' },
        { text: 'The other two tasks are cancelled', why: 'gather never cancels the others because of a failure; a TaskGroup would.' },
        'gather waits for all three and returns a list with two results and the ValueError object in the failed position',
        { text: 'The ValueError is silently dropped and the list has two items', why: 'The exception is kept, in argument order, as an item of the list.' },
      ],
      answer: 2,
      explanation: py`With \`return_exceptions=True\`, exceptions are treated like results. Check each item with \`isinstance(item, Exception)\`.`,
    },
    {
      id: 'asyncio-in-practice-q6',
      type: 'mcq',
      prompt: 'Inside `async with asyncio.TaskGroup() as tg:` three tasks run. One raises `KeyError` while the other two are still waiting. Select **all** that are true.',
      options: [
        'The two other tasks are cancelled',
        'The TaskGroup waits for the cancelled tasks to finish before exiting',
        { text: 'The KeyError propagates out of the async with as a plain KeyError', why: 'TaskGroup always wraps failures in an ExceptionGroup, even when there is only one.' },
        'Code after the block can catch it with except* KeyError',
      ],
      answer: [0, 1, 3],
      explanation: py`That's structured concurrency: on the first failure the group cancels its remaining children, waits for them, and raises an \`ExceptionGroup\` holding every failure. \`except* KeyError\` handles the matching part of the group.`,
    },
    {
      id: 'asyncio-in-practice-q7',
      type: 'short',
      prompt: 'Why doesn’t `async with asyncio.timeout(1):` stop a coroutine that is inside `time.sleep(5)`? What would you do instead?',
      answer: py`Timeouts work by cancelling the task, and cancellation is delivered as a CancelledError at an await. time.sleep is a blocking call with no await: it holds the only thread, so the event loop can't even run the timer callback until the sleep returns after 5 seconds. Only then is the cancellation delivered. Fix: use await asyncio.sleep, an async library, or move the blocking call off the loop with asyncio.to_thread (and give the blocking call its own timeout, because cancelling the awaiting task doesn't stop a function already running in a thread).`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'bounded-downloads',
      title: 'Download politely: at most N at a time',
      difficulty: 'intermediate',
      prompt: py`\`fake_download(url)\` pretends to download a URL and records in \`stats\` how many downloads are running at once. Write \`async def fetch_all(urls, limit)\` that:

- downloads every URL with \`fake_download\` and returns the results as a **list in the same order as \`urls\`**;
- never has more than \`limit\` downloads running at the same time — use an \`asyncio.Semaphore\`;
- still runs up to \`limit\` downloads concurrently (not one at a time);
- raises \`ValueError\` if \`limit < 1\` (a semaphore of 0 would wait forever).

Don't change \`fake_download\` or \`stats\`: the tests read \`stats["peak"]\`.`,
      files: {
        'main.py': py`import asyncio

stats = {"active": 0, "peak": 0}


async def fake_download(url):
    """Pretend network call that tracks how many run at once."""
    stats["active"] += 1
    stats["peak"] = max(stats["peak"], stats["active"])
    await asyncio.sleep(0.02)
    stats["active"] -= 1
    return url.upper()


async def fetch_all(urls, limit):
    # TODO: cap concurrency at limit (this version starts everything at once)
    return await asyncio.gather(*(fake_download(url) for url in urls))


urls = [f"site{n}.example" for n in range(10)]
print(asyncio.run(fetch_all(urls, 3)))
print("peak concurrency:", stats["peak"])
`,
      },
      hints: [
        'Create one asyncio.Semaphore(limit) inside fetch_all and share it between all downloads.',
        'Wrap each download in a small helper coroutine that does async with semaphore: return await fake_download(url).',
        'sem = asyncio.Semaphore(limit); async def one(url): async with sem: return await fake_download(url); return await asyncio.gather(*(one(u) for u in urls))',
      ],
      solution: {
        explanation: py`The semaphore starts with \`limit\` permits. Every download must take one (\`async with sem:\`) before calling \`fake_download\`, and gives it back when the block ends — even if the download raises. Extra tasks wait at \`async with\` without blocking the loop. \`gather\` still creates all the tasks, so as soon as a permit is freed the next waiting task proceeds, keeping exactly \`limit\` downloads busy; and it returns results in argument order.

The semaphore must be **one shared object**: creating it inside the helper would give each download its own permit and limit nothing. For very large URL lists, a fixed pool of \`limit\` worker tasks reading from an \`asyncio.Queue\` avoids creating one task per URL up front — that's the next exercise.`,
        files: {
          'main.py': py`import asyncio

stats = {"active": 0, "peak": 0}


async def fake_download(url):
    """Pretend network call that tracks how many run at once."""
    stats["active"] += 1
    stats["peak"] = max(stats["peak"], stats["active"])
    await asyncio.sleep(0.02)
    stats["active"] -= 1
    return url.upper()


async def fetch_all(urls, limit):
    if limit < 1:
        raise ValueError("limit must be at least 1")
    semaphore = asyncio.Semaphore(limit)

    async def fetch_one(url):
        async with semaphore:
            return await fake_download(url)

    return await asyncio.gather(*(fetch_one(url) for url in urls))


urls = [f"site{n}.example" for n in range(10)]
print(asyncio.run(fetch_all(urls, 3)))
print("peak concurrency:", stats["peak"])
`,
        },
      },
      tests: [
        { name: 'returns every result in input order', code: py`result = await fetch_all(["b.io", "a.io", "c.io"], 2)
assert result == ["B.IO", "A.IO", "C.IO"]` },
        { name: 'never more than limit at once', code: py`stats["peak"] = 0
await fetch_all([f"s{n}.io" for n in range(12)], 3)
assert stats["peak"] <= 3, f'peak was {stats["peak"]}'` },
        { name: 'still uses the full limit concurrently', code: py`stats["peak"] = 0
await fetch_all([f"s{n}.io" for n in range(12)], 4)
assert stats["peak"] == 4, f'peak was {stats["peak"]}: downloads should overlap up to the limit'` },
        { name: 'limit below 1 raises ValueError', code: py`with raises(ValueError):
    await fetch_all(["a.io"], 0)` },
      ],
    },
    {
      id: 'queue-workers',
      title: 'A pool of worker tasks with asyncio.Queue',
      difficulty: 'advanced',
      prompt: py`Build a small order-processing pipeline:

1. \`async def worker(number, queue, handled)\` — loop forever: \`order = await queue.get()\`. If \`order\` is \`None\` (the stop signal), call \`queue.task_done()\` and **return**. Otherwise \`await asyncio.sleep(0.01)\` (the processing), append the tuple \`(number, order)\` to the list \`handled\`, and call \`queue.task_done()\`.
2. \`async def run_pipeline(orders, workers=3)\` — create an \`asyncio.Queue\`, put every order in it followed by **one \`None\` per worker**, start \`workers\` worker tasks numbered \`1\` to \`workers\`, wait until all of them have finished (a \`TaskGroup\` or \`gather\`), and return the \`handled\` list.

The tests check that every order is handled exactly once, that the work is shared between workers, and that \`worker\` marks every item done.`,
      files: {
        'main.py': py`import asyncio


async def worker(number, queue, handled):
    # TODO: take orders from the queue until you get None
    pass


async def run_pipeline(orders, workers=3):
    # TODO: use a queue and several workers. This placeholder does
    # everything itself, one order at a time.
    handled = []
    for order in orders:
        await asyncio.sleep(0.01)
        handled.append((1, order))
    return handled


print(asyncio.run(run_pipeline(["pizza", "pasta", "salad", "soup", "curry", "tacos"])))
`,
      },
      hints: [
        'Fill the queue with put_nowait() before starting the workers: the orders first, then workers × None.',
        'Each worker returns when it takes a None, so waiting for all worker tasks (TaskGroup) means all orders are done.',
        'async with asyncio.TaskGroup() as tg:\n    for number in range(1, workers + 1):\n        tg.create_task(worker(number, queue, handled))',
      ],
      solution: {
        explanation: py`The queue decouples *what* has to be done from *who* does it. Each worker repeatedly takes the next order; while one worker is "processing" (sleeping), the loop lets the others take orders, so the work spreads across workers automatically — the fastest-free worker gets the next item.

Shutdown uses **sentinels**: after the real orders come exactly one \`None\` per worker. Because the queue is FIFO, every worker reaches a \`None\` only after all orders were taken, and each worker stops after taking exactly one. The \`TaskGroup\` then exits when all workers have returned — no cancellation needed, and if a worker crashed, the group would cancel the others and report the error.

\`task_done()\` after every \`get()\` (including the sentinel) keeps the queue's unfinished-task counter accurate, so code elsewhere can \`await queue.join()\` to wait for all work. On 3.13+, \`queue.shutdown()\` is an alternative to sentinels.`,
        files: {
          'main.py': py`import asyncio


async def worker(number, queue, handled):
    while True:
        order = await queue.get()
        if order is None:                 # stop signal
            queue.task_done()
            return
        await asyncio.sleep(0.01)         # processing the order
        handled.append((number, order))
        queue.task_done()


async def run_pipeline(orders, workers=3):
    queue = asyncio.Queue()
    for order in orders:
        queue.put_nowait(order)
    for _ in range(workers):
        queue.put_nowait(None)            # one sentinel per worker
    handled = []
    async with asyncio.TaskGroup() as tg:
        for number in range(1, workers + 1):
            tg.create_task(worker(number, queue, handled))
    return handled


print(asyncio.run(run_pipeline(["pizza", "pasta", "salad", "soup", "curry", "tacos"])))
`,
        },
      },
      tests: [
        { name: 'worker handles an order and stops at None', code: py`q = asyncio.Queue()
q.put_nowait("soup")
q.put_nowait(None)
done = []
await asyncio.wait_for(worker(7, q, done), 1)
assert done == [(7, "soup")]` },
        { name: 'worker calls task_done for every item', code: py`q = asyncio.Queue()
for item in ["a", "b", None]:
    q.put_nowait(item)
await asyncio.wait_for(worker(1, q, []), 1)
await asyncio.wait_for(q.join(), 0.5)` },
        { name: 'every order is handled exactly once', code: py`orders = ["pizza", "pasta", "salad", "soup", "curry", "tacos"]
handled = await asyncio.wait_for(run_pipeline(orders, 3), 2)
assert sorted(order for _, order in handled) == sorted(orders)` },
        { name: 'the work is shared between all workers', code: py`handled = await asyncio.wait_for(run_pipeline([f"order{n}" for n in range(6)], 3), 2)
assert {number for number, _ in handled} == {1, 2, 3}` },
        { name: 'no orders, nothing handled', code: py`assert await asyncio.wait_for(run_pipeline([], 2), 2) == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'asyncio-in-practice-gather-vs-taskgroup',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare asyncio.gather and asyncio.TaskGroup. When would you use each?',
      answer: 'gather runs awaitables concurrently and returns results in argument order; on failure it raises the first exception but leaves the other tasks running, or with return_exceptions=True returns errors as values. TaskGroup (3.11+) is structured concurrency: it waits for all tasks, cancels the rest when one fails, and raises an ExceptionGroup with every error. Use TaskGroup for all-or-nothing batches and new code; gather(return_exceptions=True) when partial results are useful.',
      explanation: py`The key difference is what happens on failure. gather's default leaves orphaned tasks whose errors may surface later as "Task exception was never retrieved". TaskGroup guarantees no child outlives the block and that every error is reported, via \`except*\`. gather remains handy for quick fixed batches and when you explicitly want "best effort" semantics.`,
      whyAsked: 'It reveals whether a candidate knows modern asyncio and thinks about failure modes, not just the happy path.',
      mistakes: ['Saying gather cancels the other tasks when one fails', 'Not knowing TaskGroup raises an ExceptionGroup', 'Not mentioning the 3.11 requirement'],
      followUps: ['How do you handle errors from a TaskGroup?', 'What happens to gather’s children if gather itself is cancelled?', 'How would you collect partial results with a TaskGroup?'],
      modelAnswer: 'Both run several coroutines concurrently; the difference is failure handling. gather returns results in argument order, and if one fails it raises the first exception immediately but does not cancel the others — they keep running, and their errors may never be observed — unless I pass return_exceptions=True, in which case errors come back as values in the list. TaskGroup, from 3.11, is structured concurrency: it waits for all its tasks, and on the first failure it cancels the remaining ones, waits for them, and raises an ExceptionGroup with every error, which I handle with except*. So for new code and all-or-nothing batches I use TaskGroup; when I want best-effort partial results, gather with return_exceptions=True, or a TaskGroup whose tasks catch their own expected errors.',
    },
    {
      id: 'asyncio-in-practice-lost-tasks',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'An async web app starts a background task per request with `asyncio.create_task(log_analytics(event))`. Some events never get logged, and the logs occasionally show "Task was destroyed but it is pending!". Explain and fix.',
      answer: 'The tasks aren’t referenced anywhere, and the event loop holds tasks only weakly, so some are garbage-collected while waiting; their exceptions are also never observed. Keep strong references (a set with add_done_callback(discard)) and log exceptions in a done-callback — or, if the work must not be lost on restarts, push it to a durable queue instead.',
      explanation: py`Garbage collection of an unreferenced pending task destroys it mid-flight. The fix is the pattern from the asyncio docs. Even then, in-process background tasks die when the process restarts; analytics or emails that must be delivered belong in a job queue (Celery, RQ, a cloud queue) or at least a bounded in-process queue that is drained at shutdown.`,
      whyAsked: 'Fire-and-forget tasks are a common, subtle production bug in async services.',
      mistakes: ['Blaming the analytics service', 'Fixing it by awaiting the task in the request (adds latency) without discussing trade-offs', 'Not mentioning durability'],
      followUps: ['How would you make sure these tasks finish during shutdown?', 'Where would you log their exceptions?', 'When is an in-process task the wrong tool?'],
      modelAnswer: 'The event loop only keeps weak references to tasks, so a task created with create_task and not stored anywhere can be garbage-collected while it’s waiting — that’s the "Task was destroyed but it is pending" message, and the event is lost. Any exception it raises is also never observed. I’d keep strong references in a module-level set, add a done-callback that discards the task and logs any exception, and drain or cancel the set on shutdown. If the analytics must never be lost, I’d go further and push events to a durable queue processed by workers, because in-process tasks die with the process.',
    },
    {
      id: 'asyncio-in-practice-cancellation',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'How does cancellation work in asyncio, and what are the rules for writing cancellation-safe coroutines?',
      answer: 'task.cancel() requests cancellation; the loop throws CancelledError into the coroutine at the await where it is suspended, and it propagates like any exception. Timeouts and TaskGroups are built on it. Rules: clean up in finally/except and re-raise CancelledError; don’t catch BaseException broadly; keep critical sections that must not be interrupted short or protect them (asyncio.shield, carefully); remember blocking calls can’t be cancelled until they return.',
      explanation: py`Because cancellation is an exception at an \`await\`, any await is a potential exit point — design so that being interrupted there leaves state consistent (e.g. commit or roll back in \`finally\`). \`CancelledError\` derives from \`BaseException\` so ordinary \`except Exception\` handlers don't swallow it. \`asyncio.timeout()\` and \`TaskGroup\` use \`Task.uncancel()\` bookkeeping to distinguish their own cancellations from external ones, which breaks if code swallows the error.`,
      whyAsked: 'Correct cancellation handling separates robust async services from ones that leak resources or hang on shutdown.',
      mistakes: ['Thinking cancel() stops the task immediately', 'Catching CancelledError and continuing', 'Believing cancellation interrupts blocking calls'],
      followUps: ['What does asyncio.shield do, and what are its pitfalls?', 'Why is CancelledError a BaseException?', 'How does asyncio.timeout turn a cancellation into a TimeoutError?'],
      modelAnswer: 'Cancellation in asyncio is cooperative and exception-based. Calling task.cancel() just requests it; next time the task is resumed, the loop throws a CancelledError into the coroutine at the await where it’s paused, and it propagates up through try and finally blocks like any other exception. Timeouts and TaskGroups are built on this mechanism. So my rules are: treat every await as a possible exit point and keep state consistent there; do cleanup in finally or in an except CancelledError block and then always re-raise; never catch BaseException broadly, which is exactly why CancelledError isn’t an Exception subclass; and remember that blocking calls can’t be cancelled until they return. For a short operation that must complete, asyncio.shield exists, but I use it sparingly.',
    },
    {
      id: 'asyncio-in-practice-crawler-limits',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Your async crawler gathers 50,000 fetches at once. It crashes with "Too many open files" and the target site starts returning 429s. Redesign it.',
      answer: 'Bound concurrency: a fixed pool of N worker tasks reading URLs from a bounded asyncio.Queue (or a Semaphore around each fetch), one shared HTTP client with connection limits, per-request timeouts, retries with backoff for 429/5xx honouring Retry-After, and optionally a per-host rate limiter. Results stream out of the workers instead of being accumulated in one giant gather.',
      explanation: py`Unbounded gather opens a socket per coroutine and creates 50,000 tasks. A queue with N workers caps both sockets and tasks; \`maxsize\` gives backpressure if URLs are discovered while crawling. Connection limits on the client (httpx \`Limits\`, aiohttp \`TCPConnector(limit=...)\`) are a second safety net. 429 means "slow down": back off exponentially and respect \`Retry-After\`.`,
      whyAsked: 'It tests practical async engineering: resource limits, politeness and resilience.',
      mistakes: ['Just raising the OS file-descriptor limit', 'Adding sleep between requests instead of real concurrency control', 'Retrying 429s immediately'],
      followUps: ['Semaphore or worker pool — which and why?', 'How would you implement a per-domain rate limit?', 'How do you avoid fetching the same URL twice?'],
      modelAnswer: 'The crawler has unbounded concurrency: 50,000 tasks each opening a connection at once, which exhausts file descriptors and looks like an attack to the site. I’d switch to a fixed pool of worker tasks, say twenty, pulling URLs from a bounded asyncio.Queue, so at most twenty requests are ever in flight and newly discovered URLs apply backpressure. All workers share one HTTP client with its own connection limit and per-request timeouts. On 429 or 5xx responses I’d retry with exponential backoff and respect Retry-After, and if needed add a per-host rate limiter. Workers write results as they go instead of building one huge list, and a seen-set prevents duplicate fetches.',
    },
    {
      id: 'asyncio-in-practice-retry',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Write `async def fetch_with_retry(fetch, attempts=3, timeout=0.05)`. `fetch` is a coroutine function with no arguments. Call it with a per-attempt timeout (use `asyncio.timeout`); if an attempt times out, try again, up to `attempts` times in total. Return the first successful result; if every attempt times out, raise the last `TimeoutError`. Any other exception must propagate immediately without retrying.',
      answer: 'Loop over the attempts; inside, async with asyncio.timeout(timeout): return await fetch(); catch TimeoutError and re-raise only on the last attempt.',
      explanation: py`Each attempt gets a fresh timeout context. Returning from inside \`async with\` exits the loop on success. Catching only \`TimeoutError\` means other errors (e.g. \`ValueError\` from bad data) propagate on the first attempt — retrying non-transient errors only wastes time. Production versions add exponential backoff with jitter between attempts and an overall deadline.`,
      starter: { files: { 'main.py': py`import asyncio


async def fetch_with_retry(fetch, attempts=3, timeout=0.05):
    # TODO: per-attempt timeout and retries. This version just waits forever.
    return await fetch()


calls = 0


async def flaky():
    """Slow on the first two calls, fast on the third."""
    global calls
    calls += 1
    await asyncio.sleep(0.2 if calls < 3 else 0.01)
    return "ok"


print(asyncio.run(fetch_with_retry(flaky)), "after", calls, "calls")
` } },
      tests: [
        { name: 'a fast fetch succeeds on the first attempt', code: py`count = [0]
async def fast():
    count[0] += 1
    return 42
assert await fetch_with_retry(fast) == 42 and count[0] == 1` },
        { name: 'slow attempts are retried until one succeeds', code: py`count = [0]
async def slow_then_fast():
    count[0] += 1
    await asyncio.sleep(0.2 if count[0] < 3 else 0.01)
    return "ok"
assert await fetch_with_retry(slow_then_fast, attempts=3, timeout=0.05) == "ok"
assert count[0] == 3` },
        { name: 'raises TimeoutError after the last attempt', code: py`count = [0]
async def always_slow():
    count[0] += 1
    await asyncio.sleep(0.2)
with raises(TimeoutError):
    await fetch_with_retry(always_slow, attempts=2, timeout=0.03)
assert count[0] == 2` },
        { name: 'other errors are not retried', code: py`count = [0]
async def broken():
    count[0] += 1
    raise ValueError("bad data")
with raises(ValueError):
    await fetch_with_retry(broken)
assert count[0] == 1` },
      ],
      solution: { files: { 'main.py': py`import asyncio


async def fetch_with_retry(fetch, attempts=3, timeout=0.05):
    for attempt in range(1, attempts + 1):
        try:
            async with asyncio.timeout(timeout):
                return await fetch()
        except TimeoutError:
            if attempt == attempts:
                raise                       # out of attempts: let the caller know


calls = 0


async def flaky():
    """Slow on the first two calls, fast on the third."""
    global calls
    calls += 1
    await asyncio.sleep(0.2 if calls < 3 else 0.01)
    return "ok"


print(asyncio.run(fetch_with_retry(flaky)), "after", calls, "calls")
` } },
      hints: ['for attempt in range(1, attempts + 1): gives you the attempt number.', 'Catch only TimeoutError, and use a bare raise on the final attempt.'],
      whyAsked: 'Timeouts and retries are daily work in async services; the details (what to retry, per-attempt vs overall) matter.',
      mistakes: ['Retrying every exception', 'One timeout around the whole loop instead of per attempt', 'Swallowing the final TimeoutError and returning None'],
      followUps: ['How would you add exponential backoff with jitter?', 'How would you also enforce an overall deadline?', 'Which HTTP errors are safe to retry?'],
      modelAnswer: 'I loop over the attempts, and inside each one I open a fresh asyncio.timeout context and return await fetch(), so a success leaves the function immediately. I catch only TimeoutError: if it’s not the last attempt I just continue, and on the last attempt I re-raise so the caller sees the timeout. Any other exception isn’t caught, so it propagates on the first try — retrying a ValueError from bad data would just waste time. In production I’d add exponential backoff with jitter between attempts and wrap the whole thing in an overall deadline.',
    },
    {
      id: 'asyncio-in-practice-blocking-libraries',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You are building an async API service, but you must use a vendor SDK that only has blocking calls, and some endpoints also do heavy PDF rendering in pure Python. How do you keep the service responsive?',
      answer: 'Never call either directly from coroutines. Wrap blocking SDK calls with asyncio.to_thread (or run_in_executor with a dedicated, sized ThreadPoolExecutor) plus timeouts; run CPU-heavy rendering in a ProcessPoolExecutor via run_in_executor, or move it to a separate worker service/queue if it is slow or must survive restarts. Bound both pools, and monitor event-loop lag.',
      explanation: py`Threads suit blocking I/O because waiting releases the GIL; a dedicated pool sized to the SDK's rate limits protects the default executor. CPU-bound Python holds the GIL, so threads would slow the loop thread too — processes keep it out of the interpreter entirely. Long jobs (seconds+) are better returned as "202 Accepted" plus a job id processed by background workers. Cancellation doesn't stop running threads, so the SDK calls need their own timeouts.`,
      whyAsked: 'Real systems are rarely async all the way down; integrating blocking and CPU-heavy code safely is a senior skill.',
      mistakes: ['Calling the SDK directly inside async def', 'Using to_thread for CPU-heavy pure Python on standard CPython', 'Unbounded executors', 'Assuming cancellation stops a thread'],
      followUps: ['How would you size the thread pool?', 'How do contextvars behave with to_thread?', 'When would you split rendering into its own service?'],
      modelAnswer: 'The rule is that nothing slow runs on the event loop thread. For the blocking SDK, I’d call it through asyncio.to_thread, or better a dedicated ThreadPoolExecutor sized to the vendor’s rate limit via run_in_executor, with the SDK’s own timeouts set, because cancelling my coroutine won’t stop a call already running in a thread. For PDF rendering in pure Python, threads would still fight for the GIL, so I’d use a ProcessPoolExecutor through run_in_executor; if renders take long or must survive deploys, I’d make the endpoint return a job id and let separate workers process a queue. Both pools are bounded, and I’d track event-loop lag so a regression shows up immediately.',
    },
    {
      id: 'asyncio-in-practice-async-protocols',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What do `async with` and `async for` do, and why do they exist?',
      answer: 'They are the async versions of the context-manager and iteration protocols: async with awaits __aenter__ and __aexit__, and async for awaits __anext__ for each item. They exist because entering/leaving a resource (opening a connection, acquiring a semaphore) or fetching the next item (reading the next message from a socket) may need to wait, and that wait must be able to yield to the event loop.',
      explanation: py`Examples: \`async with httpx.AsyncClient() as client\`, \`async with semaphore\`, \`async with asyncio.timeout(1)\`, \`async with asyncio.TaskGroup() as tg\`. An \`async def\` function containing \`yield\` is an async generator usable with \`async for\`; \`contextlib.asynccontextmanager\` builds async context managers from async generators.`,
      whyAsked: 'A warm-up that checks the candidate can read everyday async code.',
      mistakes: ['Thinking async for runs the loop body concurrently', 'Using a normal with on an async-only context manager', 'Not knowing async generators exist'],
      followUps: ['Does async for process items concurrently?', 'How do you write an async context manager?', 'What is an async generator?'],
      modelAnswer: 'They’re the async versions of with and for. async with calls and awaits __aenter__ on the way in and __aexit__ on the way out, so setting up or tearing down a resource — opening a connection, acquiring a semaphore, starting a TaskGroup — can wait without blocking the loop. async for awaits __anext__ to get each item, which suits streams like messages from a socket or pages from an API. Note that async for still processes items one at a time; it just lets the loop run other tasks while waiting for the next one. Async generators and contextlib.asynccontextmanager make writing these easy.',
    },
  ],

  takeaways: [
    'asyncio.create_task schedules a coroutine to run independently; keep a reference and observe its result or exception.',
    'gather returns results in argument order; return_exceptions=True turns errors into values; on failure it does not cancel the others.',
    'TaskGroup (3.11+) is structured concurrency: it cancels siblings when one fails and raises an ExceptionGroup (handle with except*).',
    'asyncio.timeout (3.11+) and wait_for cancel slow work and raise TimeoutError; they only act at an await.',
    'Cancellation is a CancelledError thrown at the current await: clean up in finally and always re-raise it.',
    'Bound concurrency with a Semaphore or a fixed pool of workers reading an asyncio.Queue.',
    'Keep the loop free: blocking I/O via asyncio.to_thread, CPU-heavy work via a process pool, async libraries (httpx, aiohttp) for the network.',
  ],
}
