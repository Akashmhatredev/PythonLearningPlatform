// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const BREAKFAST = py`import asyncio
import time


async def cook(dish, seconds):
    """A coroutine: it can pause at await and let other dishes cook."""
    print(f"  start {dish}")
    await asyncio.sleep(seconds)          # waiting: control goes back to the event loop
    print(f"  {dish} done")
    return dish


async def one_after_another():
    eggs = await cook("eggs", 0.3)
    toast = await cook("toast", 0.2)
    tea = await cook("tea", 0.1)
    return [eggs, toast, tea]


async def all_at_once():
    return await asyncio.gather(cook("eggs", 0.3), cook("toast", 0.2), cook("tea", 0.1))


async def main():
    for recipe in (one_after_another, all_at_once):
        print(f"{recipe.__name__}:")
        started = time.perf_counter()
        breakfast = await recipe()
        elapsed = time.perf_counter() - started
        print(f"  served {breakfast} after {elapsed:.1f}s")


asyncio.run(main())
`

export default {
  id: 'asyncio-basics',
  title: 'async/await & the event loop',
  summary: 'Coroutines are functions that can pause at await; one event loop runs many of them on a single thread, switching whenever one is waiting — so their waits overlap.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['concurrency-concepts', 'generators', 'defining-functions'],
  related: ['asyncio-in-practice', 'threading', 'choosing-concurrency', 'generators', 'advanced-generators', 'concurrency-concepts', 'http-clients', 'project-async-pipeline'],
  tags: ['asyncio', 'async', 'await', 'coroutine', 'event loop', 'asyncio.run', 'asyncio.sleep', 'gather', 'awaitable', 'task', 'cooperative multitasking', 'non-blocking', 'never awaited', 'RuntimeWarning', 'I/O-bound'],
  apis: [
    { name: 'async def', summary: 'Defines a coroutine function. Calling it returns a coroutine object; its body runs only when awaited or scheduled.' },
    { name: 'await awaitable', summary: 'Inside a coroutine: pause until the awaitable (coroutine, Task or Future) finishes, letting the event loop run other tasks meanwhile.' },
    { name: 'asyncio.run(coro)', summary: 'Creates an event loop, runs the coroutine to completion, closes the loop and returns the result. The usual entry point.' },
    { name: 'asyncio.sleep(seconds)', summary: 'A non-blocking pause: suspends only the current task. asyncio.sleep(0) just lets other ready tasks run.' },
    { name: 'asyncio.gather(*aws)', summary: 'Runs awaitables concurrently (coroutines are wrapped in Tasks) and returns their results in argument order.' },
    { name: 'asyncio.iscoroutine(obj)', summary: 'True if obj is a coroutine object.' },
    { name: 'python -m asyncio', summary: 'An interactive REPL that allows top-level await.' },
  ],
  docs: [
    { label: 'asyncio — coroutines and tasks', url: 'https://docs.python.org/3/library/asyncio-task.html' },
    { label: 'asyncio — the event loop', url: 'https://docs.python.org/3/library/asyncio-eventloop.html' },
    { label: 'Developing with asyncio (debug mode, common mistakes)', url: 'https://docs.python.org/3/library/asyncio-dev.html' },
    { label: 'PEP 492 — coroutines with async and await syntax', url: 'https://peps.python.org/pep-0492/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`\`asyncio\` is Python's built-in toolkit for running many **waiting** tasks at once on a **single thread**. It rests on two keywords:`,
    py`- \`async def\` defines a **coroutine function** — a function that is allowed to pause in the middle and resume later;
- \`await\` marks the places where it pauses: "I'm waiting for this; run something else meanwhile."`,
    py`Something has to decide what runs next while a coroutine is paused. That's the **event loop**: a scheduler that keeps a list of tasks, runs one until it hits an \`await\` on something that isn't ready, then switches to another one that *is* ready. \`asyncio.run(main())\` creates the loop and hands it your first coroutine.`,
    py`Because switches only happen at \`await\`, asyncio is **cooperative**: a task keeps the thread until it awaits. That makes the order of events predictable and races rarer than with [threads](lesson:threading) — and it means a task that never awaits (or calls a *blocking* function like \`time.sleep\`) freezes every other task. This lesson covers the core ideas; [asyncio in practice](lesson:asyncio-in-practice) covers tasks, timeouts, cancellation and limits.`,
    { callout: 'tip', title: 'This one runs here', text: py`Unlike threads and processes, asyncio works fully in the browser playground — real CPython 3.14 with a real event loop. Every example in this lesson is runnable.` },
  ],
  why: [
    py`**Waiting dominates many programs.** A web scraper, a chat server or a service calling five APIs spends most of its time waiting for the network. While one request waits, the loop can start, continue or finish dozens of others.`,
    py`**It scales to many connections cheaply.** Each task is a small Python object, not an OS thread with its own stack, so one process can juggle thousands of open connections — the reason frameworks like FastAPI, aiohttp and many WebSocket servers are built on asyncio.`,
    py`**Switch points are visible.** Code between two \`await\`s runs without interruption by other tasks, which makes shared state much easier to reason about than with pre-emptive threads.`,
    py`**It's the modern Python I/O ecosystem.** Async HTTP clients (httpx, aiohttp), database drivers (asyncpg) and web frameworks all speak \`async\`/\`await\`. Reading them requires understanding the basics here.`,
  ],
  eli15: [
    py`Think about making breakfast: eggs take 3 minutes, toast 2, tea 1.`,
    py`The silly way: put the eggs on and **stare at the pan** for 3 minutes, then start the toast and stare at the toaster, then make tea. 6 minutes.`,
    py`The normal way: put the eggs on, and **while they boil**, start the toast, and while *that* runs, put the kettle on. Whenever something beeps, deal with it. Breakfast is ready in about 3 minutes — and you're still just **one person**.`,
    py`In Python, you are the **event loop**. Each dish is a **coroutine**. \`await asyncio.sleep(3)\` means "put this on and come back when it beeps — go do something else". And \`time.sleep(3)\` is staring at the pan: nothing else can happen while you stare.`,
  ],
  analogy: {
    title: 'A waiter serving many tables',
    body: [
      py`A good waiter doesn't stand at one table while the kitchen cooks its food. They take an order, pass it to the kitchen, and **move on** to the next table. When a dish is ready, they pick it up and serve it. One waiter, many tables, nobody idle.`,
      py`The waiter is the **event loop**; each table is a **task**. "Pass the order to the kitchen and move on" is \`await\`. The waiter only switches tables at those natural pauses — never in the middle of writing an order. And if one table makes the waiter stand still for ten minutes (a blocking call), *every* table waits.`,
    ],
    mapping: [
      ['the waiter', 'the event loop (one thread)'],
      ['a table being served', 'a task running a coroutine'],
      ['handing the order to the kitchen and moving on', 'await on something that is not ready yet'],
      ['the kitchen bell: "table 4’s food is ready"', 'a timer or I/O event that makes a task ready again'],
      ['a customer who keeps the waiter talking for 10 minutes', 'a blocking call (time.sleep, requests.get) that freezes the loop'],
      ['a waiter who serves tables strictly one by one', 'awaiting coroutines one after another: still sequential'],
    ],
  },
  visual: {
    type: 'asyncio-loop',
    title: 'Awaiting one coroutine after another',
    props: { preset: 'await-order' },
    alt: 'An event loop stepper for a program that awaits brew("tea", 2) and then brew("coffee", 1). The running lane shows main and brew; while tea sleeps, the loop is idle with main waiting on a timer until t = 2 s, and only then does coffee start, finishing at t = 3 s. Output: start tea, done tea, start coffee, done coffee.',
    caption: py`Step through with ▶ and watch the **clock**. \`await brew(...)\` runs the coroutine *inside the current task*; while it sleeps, nothing else is scheduled, so the loop just waits. Awaiting coroutines one by one is still **sequential**. The animation further down shows the fix.`,
  },
  syntax: [
    py`#### Defining and running a coroutine`,
    { code: py`import asyncio


async def greet(name):            # a coroutine function
    await asyncio.sleep(0.1)      # pause here without blocking the thread
    return f"hello {name}"


result = asyncio.run(greet("Ada"))   # start a loop, run until done, close the loop
print(result)                        # hello Ada`, lang: 'python', title: 'the smallest asyncio program' },
    py`- \`async def\` makes \`greet\` a **coroutine function**. Calling \`greet("Ada")\` does **not** run its body — it returns a **coroutine object**, a paused computation waiting to be driven.
- \`await\` can only be used inside \`async def\` (elsewhere it's \`SyntaxError: 'await' outside async function\`). It drives an **awaitable** — a coroutine, a \`Task\` or a \`Future\` — to completion and gives you its result.
- \`asyncio.run()\` is the bridge from normal code into async code. Call it **once**, at the top of your program; it can't be called while a loop is already running in the same thread.`,
    py`#### Calling without awaiting does nothing`,
    { code: py`import asyncio


async def save(note):
    print("saving", note)


async def main():
    coro = save("shopping list")          # nothing printed: only a coroutine object
    print(type(coro).__name__)            # coroutine
    await coro                            # NOW it runs: saving shopping list


asyncio.run(main())`, lang: 'python', title: 'a coroutine object is a paused call' },
    py`If a coroutine object is thrown away without ever being awaited, Python warns you when it is garbage-collected: \`RuntimeWarning: coroutine 'save' was never awaited\`. Treat that warning as an error — some work you meant to do never happened.`,
    py`#### asyncio.sleep vs time.sleep`,
    { code: py`import asyncio
import time


async def polite():
    await asyncio.sleep(0.1)    # suspends THIS task; the loop runs others meanwhile


async def rude():
    time.sleep(0.1)             # blocks the whole thread: no other task can run`, lang: 'python', title: 'two kinds of waiting' },
    py`The same goes for every blocking call: \`requests.get()\`, \`open().read()\` on slow storage, a synchronous database driver, a long pure-Python computation. Inside async code, use the async version of a library, or move the blocking call off the loop (covered in [asyncio in practice](lesson:asyncio-in-practice)).`,
    py`#### Sequential vs concurrent`,
    { code: py`import asyncio


async def fetch(page, seconds):
    await asyncio.sleep(seconds)
    return page


async def main():
    # sequential: about 0.2 + 0.1 = 0.3 s
    a = await fetch("news", 0.2)
    b = await fetch("weather", 0.1)

    # concurrent: about max(0.2, 0.1) = 0.2 s, results in argument order
    c, d = await asyncio.gather(fetch("news", 0.2), fetch("weather", 0.1))
    print(a, b, c, d)


asyncio.run(main())`, lang: 'python', title: 'await one by one, or gather' },
    py`\`await coro\` runs that coroutine *inside the current task*, to completion, before the next line — so awaiting things one by one is sequential. To make waits overlap you need several **tasks**: \`asyncio.gather()\` wraps each coroutine in a task, runs them concurrently and returns the results **in argument order**, not finishing order.`,
    { callout: 'tip', title: 'Top-level await in the REPL', text: py`Run \`python -m asyncio\` to get a REPL where you can type \`await asyncio.sleep(1)\` directly. Jupyter notebooks also allow top-level \`await\` (they already run an event loop, which is why \`asyncio.run()\` fails inside them). In normal scripts, use \`asyncio.run()\`.` },
  ],
  walkthrough: {
    title: 'Reading the breakfast program',
    lang: 'python',
    code: BREAKFAST,
    intro: py`This is the playground program below (press **Guide** there to step through it inside the editor).`,
    steps: [
      { lines: [5, 10], text: py`\`cook\` is a coroutine. It prints, then \`await asyncio.sleep(seconds)\` **suspends** it: the event loop sets a timer and is free to run other tasks until it fires. Then it prints and returns the dish.` },
      { lines: [13, 17], text: py`\`one_after_another\` awaits each dish fully before starting the next: 0.3 + 0.2 + 0.1 = about 0.6 s. Each \`await cook(...)\` runs inside the same task.` },
      { lines: [20, 21], text: py`\`all_at_once\` hands three coroutines to \`asyncio.gather\`, which wraps each in its own **task**. All three start, all three timers tick at the same time, and the total is about the *longest* one, 0.3 s.` },
      { lines: [24, 30], text: py`\`main\` tries both recipes. A coroutine function is an ordinary object, so it can sit in a tuple; \`await recipe()\` calls it and awaits the coroutine it returns. \`time.perf_counter()\` measures the elapsed wall-clock time.` },
      { lines: [33], text: py`\`asyncio.run(main())\` creates the event loop, runs \`main()\` until it returns, and closes the loop. Every async program has one such entry point.` },
    ],
  },
  playground: {
    title: 'Breakfast, sequential and concurrent',
    objective: 'Run it and compare the order of the lines and the two timings; then break and extend it with the experiments.',
    files: { 'main.py': BREAKFAST },
    expected: py`\`\`\`text
one_after_another:
  start eggs
  eggs done
  start toast
  toast done
  start tea
  tea done
  served ['eggs', 'toast', 'tea'] after 0.6s
all_at_once:
  start eggs
  start toast
  start tea
  tea done
  toast done
  eggs done
  served ['eggs', 'toast', 'tea'] after 0.3s
\`\`\`

The timings are measured live and may differ slightly. Notice that \`gather\` returns the dishes in **argument order** even though tea finished first.`,
    experiments: [
      {
        id: 'forget-await',
        task: py`In \`one_after_another\`, delete the word \`await\` in front of \`cook("tea", 0.1)\`. Predict what gets served, then run it and also read the warning in the output.`,
        hint: py`The line becomes \`tea = cook("tea", 0.1)\`.`,
        tests: [{ name: 'a coroutine object was served instead of tea', code: py`assert "coroutine object cook" in output, 'Remove await before cook("tea", 0.1)'` }],
        explain: py`Without \`await\`, \`cook("tea", 0.1)\` only *creates* a coroutine object — "start tea" never prints — and that object ends up on the plate. When it's garbage-collected Python prints \`RuntimeWarning: coroutine 'cook' was never awaited\`. Put the \`await\` back.`,
      },
      {
        id: 'add-coffee',
        task: py`Add coffee that takes **0.25 s** to both recipes (and to the returned list in \`one_after_another\`). Before running, predict how much longer each recipe takes.`,
        hint: py`\`coffee = await cook("coffee", 0.25)\` plus \`return [eggs, toast, tea, coffee]\`; and a fourth argument \`cook("coffee", 0.25)\` to \`gather\`.`,
        tests: [{ name: 'coffee was made in both recipes', code: py`assert output.count("coffee done") == 2` }],
        explain: py`Sequential time is the **sum** of the waits, so it grows by 0.25 s. Concurrent time is roughly the **longest** wait, and 0.25 s is shorter than the eggs' 0.3 s, so \`all_at_once\` takes about the same time as before. That "sum vs maximum" is the whole case for concurrency.`,
      },
      {
        id: 'block-the-loop',
        task: py`In \`cook\`, replace \`await asyncio.sleep(seconds)\` with \`time.sleep(seconds)\`. Look at the order of lines in the \`all_at_once\` section and at its timing.`,
        hint: py`Only line 8 changes; \`time\` is already imported.`,
        tests: [{ name: 'the "concurrent" recipe became sequential', code: py`section = output.split("all_at_once:")[1]
assert section.index("eggs done") < section.index("start toast"), 'Use time.sleep(seconds) in cook'` }],
        explain: py`\`time.sleep\` never gives control back to the event loop, so no other task can start until it returns — \`gather\` can't overlap anything, and the "concurrent" recipe takes as long as the sequential one. Any blocking call does this. Change it back to \`await asyncio.sleep(seconds)\`.`,
      },
      {
        id: 'tea-first',
        task: py`Write a third recipe, \`tea_first\`: make the tea on its own first, **then** make eggs and toast together with \`gather\`. Return \`[tea, eggs, toast]\` and add it to the tuple in \`main\`. Predict its time before you run it.`,
        hint: py`\`async def tea_first():\` / \`tea = await cook("tea", 0.1)\` / \`eggs, toast = await asyncio.gather(cook("eggs", 0.3), cook("toast", 0.2))\` / \`return [tea, eggs, toast]\` — then \`for recipe in (one_after_another, all_at_once, tea_first):\`.`,
        tests: [
          { name: 'tea is finished before the eggs start', code: py`section = output.split("tea_first:")[1]
assert section.index("tea done") < section.index("start eggs")` },
          { name: 'eggs and toast overlap', code: py`section = output.split("tea_first:")[1]
assert section.index("start toast") < section.index("eggs done")` },
        ],
        explain: py`You can mix both styles: \`await\` when a step **depends** on the previous one, \`gather\` for steps that are **independent**. This one takes about 0.1 + 0.3 = 0.4 s — between the other two.`,
      },
    ],
  },
  animation: {
    type: 'asyncio-loop',
    title: 'gather: two tasks, overlapping waits',
    props: { preset: 'gather' },
    alt: 'An event loop stepper for asyncio.gather(brew("tea", 2), brew("coffee", 1)). gather wraps each coroutine in a Task; the loop runs tea until it awaits sleep(2), then runs coffee until it awaits sleep(1). Both timers tick at the same time; coffee finishes at t = 1 s and tea at t = 2 s, then main resumes. Total about 2 s instead of 3.',
    caption: py`Here \`gather\` creates two **tasks**. Each one runs until its \`await\`, then hands the loop to the next ready task. Both timers run at the same time, so the program finishes after the *longest* wait.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`The event loop is basically a **to-do list** plus an **alarm clock**. The to-do list holds tasks that are ready to continue. The alarm clock remembers which tasks want to wake up at what time (\`asyncio.sleep\`) or when some data arrives (network I/O).`,
      py`The loop repeats one simple cycle: take the next ready task, let it run until it reaches an \`await\` on something unfinished, put it aside, check the alarm clock and the network for anything that has become ready, repeat. When nothing is ready, it sleeps until the next alarm or event — using no CPU at all.`,
      py`Because only one task runs at a time and switches happen only at \`await\`, the code between two awaits behaves as if no other task existed.`,
    ],
    technical: [
      py`#### Coroutines are built on generators`,
      py`A coroutine object works like a [generator](lesson:generators): it can be *resumed* with \`send()\` and it *suspends* where it waits. \`await x\` delegates to \`x\` much like \`yield from\`: if \`x\` has to wait, a \`Future\` travels up the chain of awaits to whoever is driving the coroutine — a \`Task\`.`,
      py`A **Task** wraps one coroutine and drives it: it calls \`coro.send(None)\` to run it up to its next suspension point. If the coroutine is waiting on a \`Future\` (a placeholder for a result that doesn't exist yet), the Task registers a callback on that future — "resume me when you're done" — and returns control to the loop. When the future gets its result, the callback puts the Task back on the ready queue. When the coroutine returns, the Task stores the result and wakes up anyone awaiting the Task.`,
      py`#### Inside the loop`,
      py`- a **ready queue** (a deque of callbacks to run now, added with \`call_soon\`);
- a **heap of timers** (\`call_later\` / \`call_at\`): \`asyncio.sleep(d)\` creates a future and schedules "set its result" \`d\` seconds later; \`asyncio.sleep(0)\` is special-cased to just yield once;
- a **selector** (epoll on Linux, kqueue on macOS; a proactor on Windows) that asks the OS which sockets are ready, with a timeout equal to the time until the next timer.`,
      py`Each loop iteration runs everything that's ready, then blocks in the selector until the next I/O event or timer. This is why one blocking call is so harmful: while your code runs, the loop can't reach the selector or the timers at all.`,
      { callout: 'note', title: 'Awaiting a coroutine vs creating a task', text: py`\`await coro\` does **not** create a task: the coroutine runs inside the *current* task, as if it were a normal function call that can pause. Only tasks are scheduled independently. \`asyncio.gather()\` and \`asyncio.create_task()\` create tasks — that's what lets work overlap.` },
    ],
    production: [
      py`**Never block the loop.** Use async libraries for network and database I/O (httpx or aiohttp instead of requests; asyncpg instead of a sync driver). Run unavoidable blocking or CPU-heavy calls in a thread or process pool ([asyncio in practice](lesson:asyncio-in-practice)).`,
      py`**Use debug mode while developing.** \`asyncio.run(main(), debug=True)\` (or \`PYTHONASYNCIODEBUG=1\`) logs callbacks that hold the loop for longer than 100 ms by default and shows where never-awaited coroutines were created — catching the two most common asyncio bugs early.`,
      py`**Async is contagious.** To \`await\` something, you must be inside \`async def\`, so async tends to spread up the call stack to a single \`asyncio.run()\` at the top. Keep pure logic (parsing, calculations) in normal functions and call them from coroutines; only I/O needs to be async.`,
      py`**One loop per thread.** Frameworks such as FastAPI or aiohttp start the loop for you — don't call \`asyncio.run()\` inside their handlers. Alternative loop implementations such as uvloop plug into the same API.`,
    ],
  },
  mistakes: [
    {
      title: 'Calling a coroutine function without await',
      wrong: { code: py`import asyncio

async def save(note):
    await asyncio.sleep(0.1)
    print("saved", note)

async def main():
    save("groceries")          # creates a coroutine object and throws it away
    print("done")

asyncio.run(main())`, lang: 'python' },
      right: { code: py`import asyncio

async def save(note):
    await asyncio.sleep(0.1)
    print("saved", note)

async def main():
    await save("groceries")
    print("done")

asyncio.run(main())`, lang: 'python' },
      explanation: py`Calling a coroutine function only creates a coroutine; nothing runs until it's awaited (or wrapped in a task). Python warns: \`RuntimeWarning: coroutine 'save' was never awaited\`.`,
    },
    {
      title: 'Blocking the event loop with time.sleep (or any blocking call)',
      wrong: { code: py`import asyncio
import time

async def poll_sensor(name):
    time.sleep(0.2)                 # freezes every other task
    return f"{name}: 21.5"`, lang: 'python' },
      right: { code: py`import asyncio

async def poll_sensor(name):
    await asyncio.sleep(0.2)        # only this task waits
    return f"{name}: 21.5"`, lang: 'python' },
      explanation: py`Async code is cooperative: a task gives up the thread only at \`await\`. A blocking call holds the thread, so all other tasks stall. The same applies to \`requests.get\`, sync DB drivers and heavy loops.`,
    },
    {
      title: 'Awaiting independent work one by one',
      wrong: { code: py`async def load_dashboard(user_id):
    profile = await load_profile(user_id)    # 0.2 s
    orders = await load_orders(user_id)      # 0.2 s, but it didn't need the profile
    return profile, orders`, lang: 'python', static: true },
      right: { code: py`async def load_dashboard(user_id):
    profile, orders = await asyncio.gather(load_profile(user_id), load_orders(user_id))
    return profile, orders`, lang: 'python', static: true },
      explanation: py`Sequential awaits are right when a step needs the previous result. When steps are independent, \`gather\` (or a \`TaskGroup\`) lets their waits overlap.`,
    },
    {
      title: 'Awaiting something that is not awaitable',
      wrong: { code: py`async def main():
    await time.sleep(1)     # time.sleep returns None; awaiting None fails`, lang: 'python', static: true },
      right: { code: py`async def main():
    await asyncio.sleep(1)`, lang: 'python', static: true },
      explanation: py`Only awaitables (coroutines, Tasks, Futures, objects with \`__await__\`) can be awaited. \`time.sleep(1)\` blocks for a second *and then* fails with \`TypeError: 'NoneType' object can't be awaited\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`RuntimeWarning: coroutine 'save' was never awaited`,
      cause: py`A coroutine function was called without \`await\` (or without passing the result to \`create_task\`/\`gather\`), so its body never ran.`,
      fix: py`Add \`await\`, or schedule it with \`asyncio.create_task(...)\`. Run with \`debug=True\` to see where the coroutine was created.`,
    },
    {
      symptom: py`SyntaxError: 'await' outside async function`,
      cause: py`\`await\` used in a regular \`def\` or at the top level of a script.`,
      fix: py`Make the enclosing function \`async def\` (and await it from its caller), or start the async part with \`asyncio.run()\`.`,
    },
    {
      symptom: py`RuntimeError: asyncio.run() cannot be called from a running event loop`,
      cause: py`\`asyncio.run()\` was called from code that is already running inside a loop — another coroutine, a Jupyter notebook, or an async framework's handler.`,
      fix: py`Inside async code, just \`await\` the coroutine. In Jupyter, use top-level \`await\`.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object can't be awaited`,
      cause: py`\`await\` was put in front of an ordinary function call, e.g. \`await time.sleep(1)\` or a sync helper that returns \`None\`.`,
      fix: py`Await only coroutines and other awaitables; call regular functions without \`await\`.`,
    },
    {
      symptom: py`The async version is no faster than the normal one.`,
      cause: py`Either the coroutines are awaited one after another, or a blocking call inside them stops the loop from overlapping anything.`,
      fix: py`Run independent work with \`gather\`/tasks, and replace blocking calls with async equivalents. \`debug=True\` reports slow, blocking callbacks.`,
    },
  ],
  bestPractices: [
    'Have exactly one asyncio.run(main()) at the entry point of your program.',
    'Await every coroutine you create — treat "never awaited" warnings as bugs.',
    'Never call blocking functions (time.sleep, requests, sync DB drivers) inside async def.',
    'Use plain await for steps that depend on each other and gather (or a TaskGroup) for independent ones.',
    'Keep pure computation in regular functions; make only I/O-facing code async.',
    'Develop with asyncio debug mode on to catch blocking calls and forgotten awaits.',
  ],
  useCases: [
    'Calling many HTTP APIs or downloading many pages concurrently with an async client.',
    'Web servers and APIs that keep thousands of connections open (FastAPI, aiohttp, Starlette).',
    'Chat apps, WebSockets, game servers and other long-lived connections.',
    'Bots and crawlers that mix timers, network calls and periodic tasks.',
    'Pipelines that wait on queues, databases and message brokers.',
  ],
  whenToUse: {
    use: [
      'The work is I/O-bound and there are many things to wait for at once.',
      'Async versions of your libraries exist (HTTP client, database driver).',
      'You want predictable switch points instead of pre-emptive threads.',
    ],
    avoid: [
      'CPU-bound work — one thread can only compute one thing at a time.',
      'Programs built entirely on blocking libraries with no async alternatives (threads are simpler).',
      'Simple scripts that make one or two calls: async adds complexity for no gain.',
    ],
  },
  comparison: {
    title: 'Coroutine function vs coroutine object vs task',
    headers: ['', 'Coroutine function', 'Coroutine object', 'Task'],
    rows: [
      ['what it is', 'the async def itself, e.g. cook', 'the paused call cook("eggs", 0.3)', 'a coroutine scheduled on the event loop'],
      ['created by', 'async def', 'calling the function', 'asyncio.create_task(), gather(), TaskGroup'],
      ['runs when', 'never by itself', 'only when awaited (inside the awaiting task)', 'as soon as the loop gets a chance, independently'],
      ['if you forget it', 'nothing happens', '"was never awaited" warning, work silently skipped', 'it may still run; you lose its result and errors'],
    ],
    note: py`Tasks are what make work overlap. [asyncio in practice](lesson:asyncio-in-practice) covers \`create_task\`, \`TaskGroup\`, cancellation and timeouts.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'asyncio-basics-q1',
      type: 'mcq',
      prompt: '`cook` is defined with `async def`. What does the expression `cook("eggs", 0.3)` do on its own, without `await`?',
      options: [
        { text: 'Runs cook in the background', why: 'Nothing is scheduled. A coroutine runs only when it is awaited or wrapped in a task.' },
        'Creates a coroutine object; the body has not started running',
        { text: 'Runs cook to completion and returns "eggs"', why: 'That is what await cook(...) does. The call alone just builds the coroutine object.' },
        { text: 'Raises SyntaxError', why: 'Calling a coroutine function is legal anywhere; only await is restricted to async def.' },
      ],
      answer: 1,
      explanation: py`A coroutine object is a paused computation. If it is never awaited, Python warns \`RuntimeWarning: coroutine 'cook' was never awaited\` when it's garbage-collected.`,
    },
    {
      id: 'asyncio-basics-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import asyncio

async def say(word, delay):
    await asyncio.sleep(delay)
    print(word)

async def main():
    await say("one", 0.2)
    await say("two", 0.1)
    print("three")

asyncio.run(main())`,
      options: [
        { text: 'two, one, three', why: 'That would need the two calls to run concurrently. Each await finishes completely before the next line runs.' },
        'one, two, three',
        { text: 'three, two, one', why: 'main reaches print("three") only after both awaits have completed.' },
        { text: 'one, three, two', why: 'await say("two", 0.1) finishes before print("three").' },
      ],
      answer: 1,
      explanation: py`Awaiting coroutines one after another is sequential: "one" after 0.2 s, "two" 0.1 s later, then "three". To overlap the waits you'd use \`asyncio.gather(say("one", 0.2), say("two", 0.1))\`, which would print "two" first.`,
    },
    {
      id: 'asyncio-basics-q3',
      type: 'bug',
      prompt: 'This coroutine should pause for half a second between the two prints, but "after" appears immediately and a RuntimeWarning is printed. Click the buggy line.',
      code: py`import asyncio

async def nap():
    print("before")
    asyncio.sleep(0.5)
    print("after")

asyncio.run(nap())`,
      answerLine: 5,
      explanation: py`\`asyncio.sleep(0.5)\` is a coroutine; without \`await\` it is created and thrown away (\`RuntimeWarning: coroutine 'sleep' was never awaited\`). Write \`await asyncio.sleep(0.5)\`.`,
    },
    {
      id: 'asyncio-basics-q4',
      type: 'fill',
      prompt: 'Complete the program so it defines a coroutine, pauses without blocking, and starts the event loop.',
      code: py`import asyncio

___ def fetch_score(team):
    ___ asyncio.sleep(0.1)
    return 3

print(asyncio.___(fetch_score("blue")))`,
      answer: [['async'], ['await'], ['run']],
      explanation: py`\`async def\` makes a coroutine function, \`await asyncio.sleep(...)\` pauses just this task, and \`asyncio.run(...)\` creates the loop, runs the coroutine and returns \`3\`.`,
    },
    {
      id: 'asyncio-basics-q5',
      type: 'output',
      prompt: 'Two jobs are gathered, but each uses `time.sleep`. What does it print?',
      code: py`import asyncio
import time

async def job(name):
    print("start", name)
    time.sleep(0.1)
    print("end", name)

async def main():
    await asyncio.gather(job("A"), job("B"))

asyncio.run(main())`,
      options: [
        { text: 'start A, start B, end A, end B', why: 'That needs job A to give the loop back while it waits — but time.sleep never awaits.' },
        'start A, end A, start B, end B',
        { text: 'start B, end B, start A, end A', why: 'gather schedules the tasks in argument order, so A runs first.' },
        { text: 'An error: time.sleep cannot be used in async code', why: 'It is allowed — it just blocks the whole thread.' },
      ],
      answer: 1,
      explanation: py`Task A runs until it awaits — and it never does. \`time.sleep\` blocks the thread, so B can only start after A has finished. Replace it with \`await asyncio.sleep(0.1)\` and the output becomes start A, start B, end A, end B.`,
    },
    {
      id: 'asyncio-basics-q6',
      type: 'mcq',
      prompt: 'Which statement about the asyncio event loop is true?',
      options: [
        { text: 'It runs each task on its own thread', why: 'All tasks of a loop run on the one thread that runs the loop.' },
        { text: 'It can switch tasks at any line, like the OS switches threads', why: 'asyncio is cooperative: switches happen only where a task awaits something that is not ready.' },
        'It runs one task at a time and switches only when the running task awaits something that is not ready',
        { text: 'It makes CPU-bound code faster by running it in parallel', why: 'One thread computes one thing at a time; asyncio overlaps waiting, not computing.' },
      ],
      answer: 2,
      explanation: py`That's **cooperative multitasking**: predictable switch points, cheap tasks, and the responsibility to never block.`,
    },
    {
      id: 'asyncio-basics-q7',
      type: 'short',
      prompt: 'A teammate added `async` to every function in a slow script and it got no faster. Explain why.',
      answer: py`\`async def\` only makes a function *able* to pause; it doesn't make anything run at the same time. Concurrency needs two things: the waits must be real non-blocking awaits (asyncio.sleep, an async HTTP client — not time.sleep or requests, which block the loop), and the independent pieces must run as separate tasks (asyncio.gather, create_task, a TaskGroup) instead of being awaited one after another. If the script is CPU-bound, asyncio can't help at all, because one thread can only compute one thing at a time.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'fetch-all-concurrently',
      title: 'Fetch every page at once',
      difficulty: 'intermediate',
      prompt: py`\`fake_fetch(url)\` pretends to download a page (it waits a little and returns some HTML). Write \`async def fetch_all(urls)\` that:

- fetches **all** the URLs **concurrently** (they must all start before any of them finishes),
- returns a \`dict\` mapping each URL to its page, with the keys **in the same order as \`urls\`**,
- returns \`{}\` for an empty list.

Don't change \`fake_fetch\`: the tests read its \`events\` log to check that the downloads overlapped.`,
      files: {
        'main.py': py`import asyncio

events = []


async def fake_fetch(url):
    """Pretend network call: waits longer for longer URLs."""
    events.append(f"start {url}")
    await asyncio.sleep(0.02 * len(url))
    events.append(f"end {url}")
    return f"<html>{url}</html>"


async def fetch_all(urls):
    # TODO: this works, but fetches one page at a time
    pages = {}
    for url in urls:
        pages[url] = await fake_fetch(url)
    return pages


print(asyncio.run(fetch_all(["a.io", "bb.io", "ccc.io"])))
`,
      },
      hints: [
        'Awaiting inside the loop finishes each download before the next starts. You need all the coroutines running together.',
        'asyncio.gather(*(fake_fetch(url) for url in urls)) returns the pages in the same order as urls.',
        'pages = await asyncio.gather(*(fake_fetch(url) for url in urls)); return dict(zip(urls, pages))',
      ],
      solution: {
        explanation: py`\`asyncio.gather\` wraps every coroutine in a task, so all downloads start before the first wait ends, and the total time is roughly the longest download instead of the sum. \`gather\` returns results in **argument order**, regardless of which finished first, so \`zip(urls, pages)\` pairs every URL with its own page and \`dict\` keeps that order. With an empty list, \`gather()\` simply returns \`[]\` and the dict is empty.

For real downloads you'd also cap how many run at once (\`asyncio.Semaphore\`) and set timeouts — see [asyncio in practice](lesson:asyncio-in-practice).`,
        files: {
          'main.py': py`import asyncio

events = []


async def fake_fetch(url):
    """Pretend network call: waits longer for longer URLs."""
    events.append(f"start {url}")
    await asyncio.sleep(0.02 * len(url))
    events.append(f"end {url}")
    return f"<html>{url}</html>"


async def fetch_all(urls):
    pages = await asyncio.gather(*(fake_fetch(url) for url in urls))
    return dict(zip(urls, pages))


print(asyncio.run(fetch_all(["a.io", "bb.io", "ccc.io"])))
`,
        },
      },
      tests: [
        { name: 'returns every page under its URL', code: py`result = await fetch_all(["a.io", "bb.io"])
assert result == {"a.io": "<html>a.io</html>", "bb.io": "<html>bb.io</html>"}` },
        { name: 'keys keep the order of urls', code: py`urls = ["ccc.io", "a.io", "bb.io"]
result = await fetch_all(urls)
assert list(result) == urls` },
        { name: 'all downloads start before any finishes', code: py`events.clear()
await fetch_all(["a.io", "bb.io", "ccc.io"])
assert [e.split()[0] for e in events[:3]] == ["start", "start", "start"], f'Downloads did not overlap: {events}'` },
        { name: 'an empty list gives an empty dict', code: py`assert await fetch_all([]) == {}` },
      ],
    },
    {
      id: 'fix-the-dashboard',
      title: 'Fix the slow, broken dashboard',
      difficulty: 'intermediate',
      prompt: py`\`dashboard(user_id)\` should load a user's profile and orders and return \`{"profile": <profile dict>, "orders": <orders list>}\`. It has three bugs:

1. \`load_profile\` blocks the event loop;
2. \`dashboard\` forgets to await the profile, so a coroutine object ends up in the result;
3. the two loads run one after another although they're independent.

Fix them so that \`dashboard\` returns the right data and **both loads start before either finishes** (the tests read the \`log\` list to check this). Keep the function names, the log messages and the 0.1-second waits.`,
      files: {
        'main.py': py`import asyncio
import time

log = []


async def load_profile(user_id):
    log.append(f"start profile {user_id}")
    time.sleep(0.1)                          # simulated database call
    log.append(f"end profile {user_id}")
    return {"id": user_id, "name": f"user{user_id}"}


async def load_orders(user_id):
    log.append(f"start orders {user_id}")
    await asyncio.sleep(0.1)                 # simulated API call
    log.append(f"end orders {user_id}")
    return [f"order-{user_id}-1"]


async def dashboard(user_id):
    profile = load_profile(user_id)
    orders = await load_orders(user_id)
    return {"profile": profile, "orders": orders}


print(asyncio.run(dashboard(7)))
`,
      },
      hints: [
        'Inside async code, time.sleep(0.1) must become await asyncio.sleep(0.1).',
        'Both loads are independent — start them together with asyncio.gather and unpack the two results.',
        'profile, orders = await asyncio.gather(load_profile(user_id), load_orders(user_id))',
      ],
      solution: {
        explanation: py`Bug 1: \`time.sleep\` held the only thread, so nothing else could run during the "database call"; \`await asyncio.sleep(0.1)\` suspends just this task. Bug 2: \`load_profile(user_id)\` without \`await\` only created a coroutine object, which landed in the result (and triggered a "never awaited" warning). Bug 3: the loads don't depend on each other, so \`asyncio.gather\` runs them as two tasks whose waits overlap — the dashboard now takes about 0.1 s instead of 0.2 s.

Fixing only bug 3 wouldn't be enough: with \`time.sleep\` still in \`load_profile\`, \`gather\` would start it, block the loop for 0.1 s, and only then start the orders. Concurrency needs both independent tasks *and* non-blocking waits.`,
        files: {
          'main.py': py`import asyncio

log = []


async def load_profile(user_id):
    log.append(f"start profile {user_id}")
    await asyncio.sleep(0.1)                 # simulated database call
    log.append(f"end profile {user_id}")
    return {"id": user_id, "name": f"user{user_id}"}


async def load_orders(user_id):
    log.append(f"start orders {user_id}")
    await asyncio.sleep(0.1)                 # simulated API call
    log.append(f"end orders {user_id}")
    return [f"order-{user_id}-1"]


async def dashboard(user_id):
    profile, orders = await asyncio.gather(load_profile(user_id), load_orders(user_id))
    return {"profile": profile, "orders": orders}


print(asyncio.run(dashboard(7)))
`,
        },
      },
      tests: [
        { name: 'the profile is real data, not a coroutine', code: py`result = await dashboard(7)
assert result["profile"] == {"id": 7, "name": "user7"}` },
        { name: 'the orders are returned', code: py`result = await dashboard(3)
assert result["orders"] == ["order-3-1"]` },
        { name: 'both loads start before either finishes', code: py`log.clear()
await dashboard(5)
assert log[0].startswith("start") and log[1].startswith("start"), f'The loads did not overlap: {log}'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'asyncio-basics-coroutine-await',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a coroutine in Python, and what exactly does await do?',
      answer: 'A coroutine is the object returned by calling an async def function: a computation that can suspend and resume. await drives an awaitable (coroutine, Task or Future) and suspends the current coroutine until that awaitable has a result, letting the event loop run other tasks meanwhile; then it resumes with the result.',
      explanation: py`Calling \`async def\` functions doesn't run them — it creates coroutine objects. Something must drive them: \`await\` from another coroutine, a \`Task\`, or \`asyncio.run\`. \`await\` is the only place a coroutine can be suspended, which is what makes asyncio cooperative and its switch points explicit.`,
      whyAsked: 'It tests whether the candidate understands the execution model rather than treating async/await as magic keywords.',
      mistakes: ['Saying a coroutine runs in a separate thread', 'Saying calling an async function starts it in the background', 'Saying await blocks the thread'],
      followUps: ['What is the difference between a coroutine and a Task?', 'Why can await only be used inside async def?', 'How are coroutines related to generators?'],
      modelAnswer: 'A coroutine is what you get when you call an async def function: a paused computation that can suspend in the middle and be resumed later. Calling the function doesn’t run the body — something has to drive it. await is how you drive one from another coroutine: it runs the awaitable, and if that awaitable has to wait — say for a timer or a socket — the current coroutine is suspended and control goes back to the event loop, which runs other tasks. When the result is ready, the loop resumes the coroutine right after the await with that value. So await is a pause point, not a block: the thread keeps working on other tasks.',
    },
    {
      id: 'asyncio-basics-sequential-vs-gather',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Each fetch below sleeps for 1 second. Roughly how long does each version of main take, and why?',
      code: { lang: 'python', code: py`async def main_a():
    a = await fetch("a")
    b = await fetch("b")
    c = await fetch("c")

async def main_b():
    a, b, c = await asyncio.gather(fetch("a"), fetch("b"), fetch("c"))` },
      options: ['Both about 1 s', 'Both about 3 s', 'main_a about 3 s, main_b about 1 s', 'main_a about 1 s, main_b about 3 s'],
      correctOption: 2,
      answer: 'main_a takes about 3 s: each await runs the coroutine inside the current task to completion before the next line. main_b takes about 1 s: gather wraps each coroutine in its own task, so the three waits overlap.',
      explanation: py`Awaiting a coroutine doesn't schedule it independently — it's like a function call that may pause. Overlap requires several tasks. That's true only if \`fetch\` awaits a non-blocking wait; with a blocking call inside, both versions take about 3 s.`,
      whyAsked: 'The most common asyncio misconception is that async code is automatically concurrent.',
      mistakes: ['Thinking each await starts a background job', 'Forgetting that gather returns results in argument order', 'Not mentioning the blocking-call caveat'],
      followUps: ['In what order does gather return results?', 'What if one fetch raises an exception?', 'When is sequential awaiting the right choice?'],
      modelAnswer: 'main_a takes about three seconds and main_b about one. In main_a each await runs that coroutine inside the current task and waits for it to finish before moving to the next line, so the sleeps add up. In main_b, gather wraps each coroutine in its own task and schedules all three; each one starts its sleep and gives the loop back, so the three timers run at the same time and the total is the longest one. Results still come back in argument order. One caveat: that only holds if fetch really awaits something non-blocking — with time.sleep or requests inside, both would take three seconds.',
    },
    {
      id: 'asyncio-basics-never-awaited',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Logs show "RuntimeWarning: coroutine \'send_receipt\' was never awaited" and customers report missing receipts. What happened and how do you prevent it?',
      answer: 'Somewhere send_receipt(...) is called without await (or without being scheduled), so only a coroutine object was created and discarded — the email code never ran. Fix by awaiting it, or creating a task and keeping a reference if it should run in the background. Prevent it with asyncio debug mode, treating RuntimeWarnings as errors in tests (-W error::RuntimeWarning), and linters/type checkers that flag unused coroutines.',
      explanation: py`The warning is emitted when the coroutine object is garbage-collected without ever having started. Debug mode adds the traceback of where it was created. Type checkers such as mypy and pyright can report an unused coroutine result, and Ruff has rules for common asyncio mistakes. In tests, \`python -W error::RuntimeWarning\` turns the warning into a failure.`,
      whyAsked: 'It is a classic production bug that fails silently except for a warning many teams ignore.',
      mistakes: ['Ignoring the warning as noise', 'Fixing it with asyncio.run inside an async function', 'Using create_task without keeping a reference'],
      followUps: ['What is the difference between awaiting and create_task here?', 'Why must you keep a reference to a background task?', 'How do you surface errors from fire-and-forget tasks?'],
      modelAnswer: 'That warning means send_receipt was called like a normal function without await, so Python only created a coroutine object and later garbage-collected it — the body, and so the email, never ran. I’d find the call site, which debug mode shows with a traceback, and either await it or, if it should run in the background, schedule it with create_task and keep a reference so it isn’t lost and its errors get logged. To prevent it, I’d run tests with RuntimeWarnings turned into errors and use a type checker or linter that flags unused coroutines.',
    },
    {
      id: 'asyncio-basics-event-loop-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'How does the asyncio event loop actually work under the hood?',
      answer: 'It keeps a queue of ready callbacks, a heap of timers and a selector for I/O. Tasks wrap coroutines and advance them with send(); when a coroutine awaits an unfinished Future, the Task registers a done-callback and yields control. Each loop iteration runs ready callbacks, then blocks in the selector (epoll/kqueue) until the next I/O event or timer, and completed futures schedule their tasks to resume.',
      explanation: py`Coroutines are generator-like: \`await\` delegates like \`yield from\`, so a pending Future bubbles up to the Task driving the chain. \`asyncio.sleep(d)\` is a future plus \`loop.call_later(d, ...)\`. Socket operations register interest with the selector. Because everything runs in one thread, a callback that runs long delays every timer and I/O event — which is why blocking calls are so damaging and why debug mode measures slow callbacks.`,
      whyAsked: 'Senior candidates are expected to explain the mechanism, which is what lets them debug latency and blocking issues.',
      mistakes: ['Describing threads instead of a single-threaded scheduler', 'Not knowing what a Future or Task is', 'Thinking the loop polls tasks in a busy loop'],
      followUps: ['What does asyncio.sleep(0) do?', 'How would you implement a minimal event loop with generators?', 'Why does a CPU-heavy callback delay timers?'],
      modelAnswer: 'The loop is a single-threaded scheduler with three parts: a ready queue of callbacks, a heap of timers, and a selector — epoll or kqueue — that tells it which sockets are ready. Coroutines don’t run by themselves; a Task wraps each one and advances it by calling send. When the coroutine awaits a Future that isn’t done, that future travels up to the Task, which attaches a callback saying "resume me" and gives control back. Each iteration the loop runs everything in the ready queue, then sleeps in the selector until the next I/O event or the next timer is due; when a future gets its result, its callbacks put the waiting tasks back on the ready queue. asyncio.sleep is just a future resolved by a timer. Since it’s one thread, anything slow inside a callback delays every other task, which is the whole reason you must not block the loop.',
    },
    {
      id: 'asyncio-basics-vs-threads',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'For an I/O-bound program, compare asyncio with a thread pool. When would you pick each?',
      answer: 'Both overlap waits. asyncio uses one thread and cooperative switching at await: tasks are very cheap (thousands of connections), switch points are explicit, but it needs async libraries and any blocking call stalls everything. A thread pool works with ordinary blocking libraries and needs no code rewrite, but each thread costs more memory, switching is pre-emptive (shared state needs locks), and it doesn’t scale to tens of thousands of connections. Pick asyncio for many concurrent connections with async libraries; threads for moderate concurrency with blocking libraries.',
      explanation: py`The choice often comes down to the ecosystem: if your HTTP client and database driver are async, asyncio is natural; if you're stuck with \`requests\` and a sync driver, a \`ThreadPoolExecutor\` gives you concurrency without rewriting. You can also combine them: \`asyncio.to_thread()\` runs a blocking call in a thread pool from async code.`,
      whyAsked: 'It checks whether you can weigh trade-offs instead of following hype.',
      mistakes: ['Claiming asyncio is always faster', 'Ignoring library support', 'Saying asyncio avoids all race conditions'],
      followUps: ['How can races still happen in asyncio code?', 'How would you call a blocking library from asyncio?', 'What does each model cost per concurrent operation?'],
      modelAnswer: 'Both are good at overlapping waits. asyncio runs everything on one thread and only switches at await, so each task is just a small object — I can hold thousands of connections — and I always know where switches can happen. The cost is that the whole stack must be async: one blocking call freezes every task. A thread pool works with ordinary blocking libraries like requests, so it’s often the quickest win for an existing codebase, but threads are heavier, the OS switches them anywhere so shared data needs locks, and they don’t scale to tens of thousands of connections. So I pick asyncio for high-concurrency services with async libraries, a thread pool for moderate concurrency with blocking libraries, and asyncio.to_thread when I need to mix the two.',
    },
    {
      id: 'asyncio-basics-breakfast-order',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `async def make_breakfast(dishes)` where `dishes` maps a dish name to its cooking time in seconds. Cook all dishes **concurrently** and return the list of dish names **in the order they finished**.',
      answer: 'Create an inner coroutine that sleeps for the dish’s time and then appends its name to a shared list; run one per dish with asyncio.gather; return the list.',
      explanation: py`\`gather\` returns results in *argument* order, so to get *finishing* order each task records itself when it finishes. Appending to a list from several tasks is safe here because asyncio only switches at \`await\` — the append can't be interrupted by another task. (\`asyncio.as_completed\` is another way to consume results in finishing order.)`,
      starter: { files: { 'main.py': py`import asyncio


async def make_breakfast(dishes):
    # TODO: cook concurrently and return names in finishing order.
    # This placeholder cooks one dish at a time.
    finished = []
    for name, seconds in dishes.items():
        await asyncio.sleep(seconds)
        finished.append(name)
    return finished


print(asyncio.run(make_breakfast({"eggs": 0.15, "tea": 0.05, "toast": 0.1})))
` } },
      tests: [
        { name: 'dishes come out in finishing order', code: py`assert await make_breakfast({"eggs": 0.15, "tea": 0.05, "toast": 0.1}) == ["tea", "toast", "eggs"]` },
        { name: 'a single dish', code: py`assert await make_breakfast({"porridge": 0.05}) == ["porridge"]` },
        { name: 'no dishes, nothing cooked', code: py`assert await make_breakfast({}) == []` },
      ],
      solution: { files: { 'main.py': py`import asyncio


async def make_breakfast(dishes):
    finished = []

    async def cook(name, seconds):
        await asyncio.sleep(seconds)
        finished.append(name)          # safe: no await between check and append

    await asyncio.gather(*(cook(name, seconds) for name, seconds in dishes.items()))
    return finished


print(asyncio.run(make_breakfast({"eggs": 0.15, "tea": 0.05, "toast": 0.1})))
` } },
      hints: ['gather keeps argument order, so record the finishing order yourself.', 'An inner async def can append to a list from the enclosing function.'],
      whyAsked: 'A compact check that you can turn sequential code into concurrent code and know gather’s ordering guarantees.',
      mistakes: ['Returning gather’s result directly (argument order, not finishing order)', 'Awaiting each dish in a loop (sequential)', 'Using time.sleep inside the coroutine'],
      followUps: ['How would you do this with asyncio.as_completed?', 'Why is appending to a shared list safe here but not with threads?', 'How would you add a timeout for slow dishes?'],
      modelAnswer: 'Since gather returns results in argument order, I let each task record when it finishes. I define a small inner coroutine that sleeps for the dish’s cooking time and then appends the dish name to a list in the enclosing scope, start one per dish with asyncio.gather, and return the list. The appends are safe without a lock because asyncio only switches tasks at await, and there’s no await between the end of the sleep and the append. An alternative is iterating over asyncio.as_completed, which yields results as they finish.',
    },
    {
      id: 'asyncio-basics-latency-spikes',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'An async web service normally answers in a few milliseconds, but every few minutes all requests stall for about two seconds at once. What is a likely cause, and how do you find and fix it?',
      answer: 'Something is blocking the event loop for ~2 s — a synchronous call (requests, a sync DB driver, file I/O, time.sleep) or a CPU-heavy computation (e.g. building a report, parsing a big JSON) inside a coroutine. Because all requests share one loop, they all stall. Find it with asyncio debug mode (slow-callback warnings), logging or a sampling profiler (py-spy); fix by using async libraries, or offloading with asyncio.to_thread / run_in_executor (threads for blocking I/O, a process pool for CPU work).',
      explanation: py`"Everything stalls at the same time" is the signature of a blocked loop — a single slow request would only affect itself. Debug mode logs callbacks that take longer than \`loop.slow_callback_duration\` (0.1 s by default). Offloading moves the work to another thread or process and lets the coroutine \`await\` its completion, keeping the loop responsive.`,
      whyAsked: 'Diagnosing a blocked event loop is the most common real-world asyncio performance problem.',
      mistakes: ['Scaling up servers without finding the blocking call', 'Blaming the network', 'Wrapping CPU-heavy work in to_thread on standard CPython and expecting parallel speed-up'],
      followUps: ['How does debug mode detect slow callbacks?', 'When would you use a process pool rather than a thread?', 'How could you monitor event-loop lag in production?'],
      modelAnswer: 'When every request stalls together, I suspect the event loop itself is blocked: some coroutine runs a synchronous call or a heavy computation for about two seconds, and since all requests share one loop thread, nothing else can run meanwhile. Typical culprits are a periodic report or cache rebuild, a sync HTTP or database call, or parsing a big file. I’d turn on asyncio debug mode in staging to get slow-callback warnings with the offending code, or take py-spy dumps during a stall. The fix is to use async libraries for I/O, or offload with asyncio.to_thread for blocking calls and a process pool via run_in_executor for CPU-heavy work. I’d also add a loop-lag metric — a task that measures how late its periodic sleep wakes up — so this shows up on a dashboard.',
    },
  ],

  takeaways: [
    'async def creates a coroutine function; calling it only creates a coroutine object — nothing runs until it is awaited or scheduled.',
    'await pauses the current coroutine until an awaitable is done and lets the event loop run other tasks meanwhile.',
    'asyncio.run(main()) is the single entry point: it creates the loop, runs main and closes the loop.',
    'The event loop runs one task at a time on one thread and switches only at await (cooperative multitasking).',
    'Awaiting coroutines one after another is sequential; asyncio.gather (tasks) makes independent waits overlap and returns results in argument order.',
    'Blocking calls such as time.sleep or requests.get freeze every task — use asyncio.sleep and async libraries.',
    'Treat "coroutine was never awaited" warnings as bugs; develop with debug mode on.',
  ],
}
