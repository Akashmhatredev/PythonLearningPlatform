<p align="center">
  <img src="public/favicon.svg" width="72" alt="">
</p>

<h1 align="center">Python Learning Platform</h1>

<p align="center">
  <img alt="CPython 3.14 in the browser" src="https://img.shields.io/badge/CPython-3.14_in_your_browser-3776ab?style=flat-square&logo=python&logoColor=ffd43b&labelColor=171717">
  <img alt="Pyodide 314.0.7" src="https://img.shields.io/badge/Pyodide-314.0.7-ffd43b?style=flat-square&labelColor=171717">
  <img alt="Vue 3.5 + Vite 8" src="https://img.shields.io/badge/Vue_3.5-Vite_8-3776ab?style=flat-square&labelColor=171717">
  <img alt="Tested with Vitest and Playwright" src="https://img.shields.io/badge/tested_with-Vitest_%2B_Playwright-ffd43b?style=flat-square&labelColor=171717">
  <img alt="Accessibility: WCAG 2.1 AA, checked with axe" src="https://img.shields.io/badge/a11y-WCAG_2.1_AA-3776ab?style=flat-square&labelColor=171717">
</p>

<p align="center">
  <b>An interactive Python course where the code really runs.</b><br>
  From “what is a program?” to asyncio, CPython internals, clean architecture and interview drills:<br>
  plain-English lessons, real Python in the browser, step-by-step visualizers, quizzes, test-graded exercises<br>
  and interview practice. No account, no backend.
</p>

<p align="center">
  <a href="#quick-start"><b>Quick start</b></a> ·
  <a href="#how-every-lesson-works">How lessons work</a> ·
  <a href="#the-course-map">The course map</a> ·
  <a href="#real-python-in-the-browser">The Python sandbox</a> ·
  <a href="#visualizers">Visualizers</a> ·
  <a href="CONTENT_GUIDE.md">Write a lesson</a>
</p>

---

## What's inside

| | |
|---|---|
| **134 lessons in 27 levels** | beginner → professional, each with explanation, ELI15, analogy, live example, walkthrough, internals, mistakes, debugging tips and takeaways |
| **9 guided projects** | from a number-guessing game to an async data pipeline and a production-style service |
| **884 interview questions** | conceptual, predict-the-output, debugging, coding (test-graded), scenario, comparison and architecture — each with a concise answer, a speakable model answer, common mistakes and follow-ups |
| **259 graded coding exercises** | checked by real Python tests, with progressive hints and full solutions |
| **10 visualizers** | a real-execution code tracer (frames, variables, objects, closures, generators), hash tables, exception propagation, attribute lookup & MRO, memory & GC, the asyncio event loop, threads vs processes, and a live performance lab |
| **Interview mode** | practice sessions or timed mock interviews, filtered by topic, type and difficulty, with review and a weak-area revision queue |
| **938 quiz questions & 497 guided experiments** | predict-the-output, find-the-bug, fill-in and multiple-choice questions with feedback on every wrong option; guided experiments in every playground, most of them checked by tests |
| **Progress tracking** | completion rules based on real activity, streaks, bookmarks, revision queue, export/import — stored in your browser |

## How every lesson works

**Learn → Experiment → Visualize → Understand → Practice → Interview → Review.** Every lesson explains the idea for a 15-year-old first (with an everyday analogy), then gives the precise rules, a line-by-line walkthrough and a live playground with guided experiments. A visual or animation shows what Python does internally. Then come predict-the-output and find-the-bug quizzes, coding exercises graded by tests, and topic-specific interview questions.

Accuracy rules for the content: Python 3.14 behaviour, version-specific features labelled (“3.10+”), CPython implementation details (small-int cache, reference counting, the GIL, bytecode) clearly separated from language guarantees, no invented numbers, simplified code labelled as simplified. See [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## The course map

| # | Level | # | Level |
|---|---|---|---|
| 01 | Programming & Python Setup | 15 | Dataclasses, Enums & Modern Python |
| 02 | Variables, Types & Operators | 16 | Type Hints & Static Typing |
| 03 | Strings & Text | 17 | Functional Programming |
| 04 | Lists, Tuples, Sets & Dictionaries | 18 | Virtual Environments, pip & Packaging |
| 05 | Conditions, Loops & Control Flow | 19 | Testing with pytest |
| 06 | Functions | 20 | Debugging, Logging & Performance |
| 07 | Comprehensions, Iterators & Generators | 21 | Concurrency, Parallelism & asyncio |
| 08 | Modules, Packages & Project Structure | 22 | Memory Management & Python Internals |
| 09 | Exceptions & Error Handling | 23 | Databases, HTTP & APIs |
| 10 | Files, Paths & Data Formats | 24 | Security |
| 11 | Standard Library Essentials | 25 | Design Patterns & Clean Architecture |
| 12 | Object-Oriented Programming | 26 | Practical Python Projects |
| 13 | Python's Data Model | 27 | Python Interview Preparation |
| 14 | Decorators, Context Managers & Descriptors | | |

The full list lives in [`src/content/curriculum.js`](src/content/curriculum.js).

## Quick start

Requires **Node 20.19+** (`.nvmrc` pins Node 24).

```bash
nvm use            # or any Node >= 20.19
npm install
npm run dev        # → http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (sends the cross-origin-isolation headers the Python runtime uses) |
| `npm run build` / `npm run preview` | production build (includes the Pyodide runtime files) / serve it |
| `npm test` | all unit, Python-sandbox and content tests (Vitest) |
| `npm run validate:content` | content validation only; `LESSONS=lists,sets npm run validate:content` limits it |
| `npm run test:e2e` | Playwright end-to-end and axe accessibility tests against a production build (uses your installed Chrome) |
| `node scripts/run-python.mjs 'print(1 + 1)'` | run a snippet in the exact runtime the playground uses |

## Real Python in the browser

The playground runs **CPython 3.14 compiled to WebAssembly** ([Pyodide](https://pyodide.org) 314.0.7), installed from npm and served by the app itself — no CDN, works offline once loaded. Nothing is simulated: output, tracebacks, variables and test verdicts all come from the interpreter.

1. **One runtime per page.** `src/services/python/worker.js` loads Pyodide once in a Web Worker; every playground, exercise check, code tracer and performance demo on the page shares it (`src/services/python/client.js` queues runs).
2. **A Python harness** (`src/services/python/harness.py`) writes the project's files to an in-memory filesystem, runs `main.py` as `__main__`, streams stdout/stderr, reports globals for the Variables panel and formats real tracebacks without harness frames. Each run starts from clean interpreter state (project modules, logging config, warning filters, environment, builtins are reset).
3. **Tests are Python.** Exercise, experiment, interview and project tests are Python snippets run against a fresh copy of the learner's program, with helpers (`output`, `run_program`, `capture`, `raises`, `approx`, …) and pytest-style failure messages that show both sides of a failed comparison.
4. **`input()` works live.** With cross-origin isolation (COOP/COEP headers) the worker pauses on `input()` and the page asks the learner for a line; lines can also be pre-typed in the Input tab (that's what tests use).
5. **Runaway code is stopped.** After 10 s (20 s for tests) the client raises `KeyboardInterrupt` in the worker through a shared interrupt buffer; code stuck inside C is handled by replacing the worker. A Stop button does the same on demand.
6. **Fidelity fixes.** `time.sleep()` blocks like CPython (Pyodide's default yields to the event loop, which would teach the wrong lesson about blocking async code); `asyncio.run()` uses WebAssembly stack switching (JSPI) where available.
7. **The same engine validates the content.** `tests/unit/python-runner.js` drives the identical engine and harness from a Node worker thread, so CI proves that every playground runs, every exercise solution passes its tests, every starter fails at least one, every experiment needs a change, every Python code block compiles and every code-tracer visual traces.

> [!NOTE]
> The sandbox has the whole standard library (`json`, `csv`, `re`, `sqlite3`, `asyncio`, `dataclasses`, `unittest`, `unittest.mock`, `logging`, `tracemalloc`, `dis`, …) but no third-party packages, no network, and no threads or subprocesses. Lessons show `requests`, `pytest`, `threading`, `multiprocessing` and frameworks as clearly marked static code, and simulate networks honestly.

## Visualizers

| Visualizer | Shows |
|---|---|
| **Code tracer** | real execution step by step (`sys.settrace`): frames, variables, arrows to objects, closures, generators, classes, return values, exceptions — learners can edit the code and re-trace |
| Hash table | how dict/set lookups hash keys into buckets (simplified, interactive) |
| Exception flow | an exception climbing the call stack; `except`, `finally`, `raise … from` |
| Attribute lookup & MRO | instance → class → bases, diamonds and cooperative `super()` |
| Memory & GC | reference counts, cycles and the cyclic collector, weak references (CPython) |
| asyncio event loop | tasks, awaits, `gather`, `create_task`, a blocking call freezing the loop |
| Threads vs processes vs asyncio | I/O-bound vs CPU-bound timelines, the GIL, a lost-update race |
| Performance lab | measured live by Python in your browser: list vs set, `+` vs `join`, `lru_cache`, list vs generator memory |
| Concept diagram, comparison | lesson-defined stepped diagrams and side-by-side code |

## Theme

The “anti-polish” raw aesthetic of the original app — paper background, thick ink borders, offset shadows, hand-made stickers — with a Python palette: blue `#3776AB` (primary), yellow `#FFD43B` (secondary), paper `#F7F3E8`, ink `#171717`. All colours are tokens in [`src/styles/tokens.css`](src/styles/tokens.css); change the `--py-*` values to retheme everything. Code syntax colours are deliberately independent of the brand palette. Light and dark themes are both supported.

## Tech stack & structure

| Layer | Tools |
|---|---|
| App | Vue 3.5 (`<script setup>`), Vite, Vue Router, Pinia |
| Python | Pyodide (CPython 3.14 → WebAssembly) in a Web Worker |
| Editor | CodeMirror 6 with Python mode (4-space indents); Lezer for static highlighting |
| Motion & icons | GSAP (hero only), lucide icons |
| Tests | Vitest + Vue Test Utils, Playwright + axe-core |

<details>
<summary><b>Project structure</b></summary>

```text
plugins/
  content-index.js      builds virtual modules from the lessons (index · search · question bank)
  pyodide-assets.js     serves/emits the Pyodide runtime files (virtual:pyodide)
scripts/run-python.mjs  run a snippet in the playground's exact runtime
src/
  content/
    curriculum.js       the course map (27 levels, teaching order)
    lessons/<level>/<lesson>.js   one pure-data module per lesson
    schema.js · visualizers.js · playground-examples.js · interview-categories.js
  services/python/      harness.py · engine.js · worker.js · client.js
  composables/          useSandbox (Python runs), useStepPlayer, …
  components/
    code/               PlaygroundEditor, CodeEditor, ConsolePanel (output + live input), StateInspector (variables)
    diagrams/           CodeTracer, HashTable, ExceptionFlow, ClassLookup, MemoryVisualizer, AsyncioLoop,
                        ConcurrencyTimeline, PerformanceLab, ConceptDiagram, ComparisonVisualizer
    layout/ ui/ learning/ quiz/ interview/
  pages/ stores/ utils/ styles/
tests/
  unit/                 content validation, Python sandbox, stores, components, utils
  e2e/                  learning flow, playground (input, tracebacks, stop), interview, visualizers, axe
```

</details>

## Progress and data

Stored in `localStorage` under `plp:*` (see `services/storage.js`), so it never collides with other apps on the same origin. *Settings → Your data* exports and imports JSON and resets data. Completion requires real activity: run the example, pass the quiz on first tries, pass an exercise's tests.

## Deployment

`vercel.json` configures the build, SPA rewrites, long-term caching for hashed assets and the Pyodide files, security headers, and the `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers that enable live `input()` and interrupting runaway code. Any static host works if it sends those two headers and falls back to `index.html`; without them the playground still runs, but `input()` reads only pre-typed lines and runaway code is stopped by restarting the runtime.

## Known limitations

- Standard library only — no `pip install` in the browser, no network, no threads or subprocesses.
- Blocking inside asyncio needs WebAssembly stack switching (JSPI; Chrome/Edge 137+). In browsers without it, top-level `asyncio.run(main())` is compiled as `await main()` so the standard idiom still runs; `asyncio.run()` called from inside a function explains the limitation instead.
- The browser runtime is 32-bit WebAssembly: `sys.getsizeof` values, errno numbers and very large `range` lengths differ from desktop CPython. Lessons avoid hard-coding them.
- Infinite recursion through C code (e.g. a property setter assigning to itself) can exhaust the WebAssembly stack; the runtime is restarted and the learner is told why. Plain Python recursion raises `RecursionError` normally.
- The first run downloads the Python runtime (about 12 MB); it is cached afterwards.
